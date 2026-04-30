import discord
from discord import sinks
import os
import functools
import inspect
from typing import get_args, get_origin, Union
import json
import aiohttp
import threading
import asyncio
import time
import random
import io
import tempfile
import subprocess
import wave
from typing import Optional
import re
import base64
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from collections import defaultdict

# ───────── 設定檔處理 (JSON) ─────────
CONFIG_FILE = "config.json"
MEMORY_FILE = "memory.json"
CHAT_LOG_DIR = "chat_logs"
VOICE_CONFIG_FILE = "voice_profiles.json"
VOICE_RANDOM_RATE = float(os.environ.get("VOICE_RANDOM_RATE", "0.3"))
VOICE_SAMPLE_RATE = int(os.environ.get("VOICE_SAMPLE_RATE", "48000"))
VOICE_CHANNELS = int(os.environ.get("VOICE_CHANNELS", "2"))
VOICE_SAMPLE_WIDTH = int(os.environ.get("VOICE_SAMPLE_WIDTH", "2"))
VOICE_SILENCE_SECONDS = float(os.environ.get("VOICE_SILENCE_SECONDS", "1.5"))
VOICE_MIN_SEGMENT_SECONDS = float(os.environ.get("VOICE_MIN_SEGMENT_SECONDS", "2.0"))
STT_SPACE_URL = str(os.environ.get("STT_SPACE_URL", "")).strip().rstrip("/")
STT_API_KEY = str(os.environ.get("STT_API_KEY", "")).strip()
STT_TIMEOUT = float(os.environ.get("STT_TIMEOUT", "20"))
STT_LANGUAGE = str(os.environ.get("STT_LANGUAGE", "")).strip()
STT_RETRY_COUNT = int(os.environ.get("STT_RETRY_COUNT", "2"))
STT_RETRY_DELAY = float(os.environ.get("STT_RETRY_DELAY", "1.0"))

class _AppCommandsCompat:
    class Choice(discord.OptionChoice):
        def __class_getitem__(cls, item):
            return cls

    @staticmethod
    def choices(**kwargs):
        def decorator(func):
            items = func.__dict__.setdefault("_kilo_choices", [])
            for param, choices in kwargs.items():
                items.append((param, choices))
            return func
        return decorator

    @staticmethod
    def autocomplete(**kwargs):
        def decorator(func):
            items = func.__dict__.setdefault("_kilo_autocomplete", [])
            for param, ac in kwargs.items():
                items.append((param, ac))
            return func
        return decorator


app_commands = _AppCommandsCompat


class _InteractionResponseAdapter:
    def __init__(self, ctx):
        self._ctx = ctx

    async def send_message(self, content=None, ephemeral=False, **kwargs):
        await self._ctx.respond(content=content, ephemeral=ephemeral, **kwargs)

    async def defer(self, ephemeral=False, **kwargs):
        await self._ctx.defer(ephemeral=ephemeral, **kwargs)


class _InteractionFollowupAdapter:
    def __init__(self, ctx):
        self._ctx = ctx

    async def send(self, content=None, ephemeral=False, **kwargs):
        await self._ctx.followup.send(content=content, ephemeral=ephemeral, **kwargs)


class _InteractionAdapter:
    def __init__(self, ctx):
        self._ctx = ctx
        self.user = ctx.user
        self.channel = ctx.channel
        self.channel_id = ctx.channel_id
        self.guild = getattr(ctx, "guild", None)
        self.response = _InteractionResponseAdapter(ctx)
        self.followup = _InteractionFollowupAdapter(ctx)

    def __getattr__(self, name):
        return getattr(self._ctx, name)


class _CommandTreeCompat:
    def __init__(self, bot: discord.Bot):
        self._bot = bot

    def command(self, name: Optional[str] = None, description: Optional[str] = None):
        def decorator(func):
            cmd_name = name or func.__name__
            cmd_desc = description or (func.__doc__ or "")

            def _is_choice_annotation(annotation) -> bool:
                if annotation is inspect._empty:
                    return False
                if annotation is app_commands.Choice:
                    return True
                if hasattr(annotation, "__mro__") and app_commands.Choice in getattr(annotation, "__mro__", []):
                    return True
                origin = get_origin(annotation)
                if origin is None:
                    return False
                return any(_is_choice_annotation(arg) for arg in get_args(annotation))

            @functools.wraps(func)
            async def wrapper(ctx, *args, **kwargs):
                interaction = _InteractionAdapter(ctx)
                sig = inspect.signature(func)
                bound = sig.bind_partial(interaction, *args, **kwargs)
                for param_name, value in list(bound.arguments.items()):
                    if param_name == list(sig.parameters.keys())[0]:
                        continue
                    annotation = sig.parameters[param_name].annotation
                    if _is_choice_annotation(annotation) and not hasattr(value, "value"):
                        bound.arguments[param_name] = app_commands.Choice(name=str(value), value=value)
                return await func(**bound.arguments)

            def _normalize_annotation(annotation):
                if _is_choice_annotation(annotation):
                    return str
                origin = get_origin(annotation)
                if origin is None:
                    return annotation
                args = get_args(annotation)
                if not args:
                    return annotation
                if origin is list or origin is tuple or origin is set:
                    normalized_args = tuple(_normalize_annotation(arg) for arg in args)
                    try:
                        return origin[normalized_args]
                    except Exception:
                        return annotation
                if origin is Union:
                    non_none = [arg for arg in args if arg is not type(None)]
                    if non_none:
                        return _normalize_annotation(non_none[0])
                normalized_args = tuple(_normalize_annotation(arg) for arg in args)
                try:
                    return origin[normalized_args]
                except Exception:
                    return annotation

            sig = inspect.signature(func)
            params = list(sig.parameters.values())
            if params:
                params = params[1:]
            normalized_params = []
            for param in params:
                normalized_params.append(
                    param.replace(annotation=_normalize_annotation(param.annotation))
                )
            ctx_param = inspect.Parameter(
                "ctx",
                inspect.Parameter.POSITIONAL_OR_KEYWORD,
                annotation=discord.ApplicationContext
            )
            wrapper.__signature__ = sig.replace(parameters=[ctx_param] + normalized_params)

            annotations = dict(getattr(func, "__annotations__", {}))
            if annotations:
                normalized = {}
                for key, value in annotations.items():
                    if key == list(sig.parameters.keys())[0]:
                        continue
                    normalized[key] = _normalize_annotation(value)
                for param, _ in getattr(func, "_kilo_choices", []):
                    normalized[param] = str
                wrapper.__annotations__ = normalized

            for param, choices in getattr(func, "_kilo_choices", []):
                wrapper = discord.option(param, choices=choices)(wrapper)
            for param, ac in getattr(func, "_kilo_autocomplete", []):
                async def _ac(ctx, _ac_func=ac):
                    return await _ac_func(ctx, str(ctx.value or ""))

                wrapper = discord.option(param, autocomplete=_ac)(wrapper)

            return self._bot.slash_command(name=cmd_name, description=cmd_desc)(wrapper)

        return decorator

    async def sync(self):
        return await self._bot.sync_commands()


TEXT_LANG_CHOICES = [
    discord.OptionChoice(name="繁體中文", value="繁體中文"),
    discord.OptionChoice(name="簡體中文", value="簡體中文"),
    discord.OptionChoice(name="English", value="English"),
    discord.OptionChoice(name="한국어", value="한국어"),
    discord.OptionChoice(name="日本語", value="日本語"),
    discord.OptionChoice(name="Español", value="Español"),
    discord.OptionChoice(name="Français", value="Français"),
    discord.OptionChoice(name="Deutsch", value="Deutsch"),
]

VOICE_LANG_CHOICES = [
    discord.OptionChoice(name="繁體中文 (zho_Hant)", value="zho_Hant"),
    discord.OptionChoice(name="簡體中文 (zho_Hans)", value="zho_Hans"),
    discord.OptionChoice(name="English (eng_Latn)", value="eng_Latn"),
    discord.OptionChoice(name="한국어 (kor_Hang)", value="kor_Hang"),
    discord.OptionChoice(name="日本語 (jpn_Jpan)", value="jpn_Jpan"),
    discord.OptionChoice(name="Español (spa_Latn)", value="spa_Latn"),
    discord.OptionChoice(name="Français (fra_Latn)", value="fra_Latn"),
    discord.OptionChoice(name="Deutsch (deu_Latn)", value="deu_Latn"),
]

TEXT_LANG_TO_NLLB = {
    "繁體中文": "zho_Hant",
    "簡體中文": "zho_Hans",
    "English": "eng_Latn",
    "한국어": "kor_Hang",
    "日本語": "jpn_Jpan",
    "Español": "spa_Latn",
    "Français": "fra_Latn",
    "Deutsch": "deu_Latn",
}

def _parse_size_to_bytes(raw: str) -> int:
    if raw is None:
        return 8 * 1024 * 1024
    text = str(raw).strip().lower()
    if not text:
        return 8 * 1024 * 1024
    if text.isdigit():
        return int(text)
    match = re.match(r"^(\d+(?:\.\d+)?)(kb|mb|gb)$", text)
    if not match:
        return 8 * 1024 * 1024
    value = float(match.group(1))
    unit = match.group(2)
    factor = {"kb": 1024, "mb": 1024 ** 2, "gb": 1024 ** 3}[unit]
    return int(value * factor)

VOICE_MAX_BYTES = _parse_size_to_bytes(os.environ.get("VOICE_MAX_BYTES", str(8 * 1024 * 1024)))

def load_config():
    env_api_url = os.environ.get("API_URL", "https://api.openai.com/v1")
    env_api_key = os.environ.get("API_KEY", "")
    env_model = os.environ.get("MODEL", "gpt-3.5-turbo")
    env_prompt = os.environ.get("SYSTEM_PROMPT", "你是一個友善的助手。")
    env_roleplay_prompt = os.environ.get("ROLEPLAY_PROMPT", "")
    env_character_prompt = os.environ.get("CHARACTER_PROMPT", "")
    env_sample_id = os.environ.get("VOICE_SAMPLE_ID", "")

    default_forbidden_words = [
        "說教",
        "重複 prompt 內容",
        "AI 原生模型",
        "說教詞彙",
        "選項",
    ]
    default_forbidden_actions = [
        "說教和引導",
        "額外生成用戶沒有說明的設定"
    ]

    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                data.setdefault("api_url", env_api_url)
                data.setdefault("api_key", env_api_key)
                data.setdefault("model", env_model)
                data.setdefault("system_prompt", env_prompt)
                data.setdefault("roleplay_prompt", env_roleplay_prompt)
                data.setdefault("character_prompt", env_character_prompt)
                if "forbidden" in data and "forbidden_words" not in data:
                    data["forbidden_words"] = data.get("forbidden", default_forbidden_words)
                existing_words = data.get("forbidden_words", default_forbidden_words)
                if not isinstance(existing_words, list):
                    existing_words = list(default_forbidden_words)
                for item in default_forbidden_words:
                    if item not in existing_words:
                        existing_words.append(item)
                data["forbidden_words"] = existing_words
                data.setdefault("forbidden_foods", [])
                data.setdefault("hated_foods", [])
                existing_actions = data.get("forbidden_actions", default_forbidden_actions)
                if not isinstance(existing_actions, list):
                    existing_actions = list(default_forbidden_actions)
                for item in default_forbidden_actions:
                    if item not in existing_actions:
                        existing_actions.append(item)
                data["forbidden_actions"] = existing_actions
                data.setdefault("summary_schedule", {
                    "enabled": False,
                    "time": "",
                    "timezone": "Asia/Taipei",
                    "last_sent_date": ""
                })
                data.setdefault("memory_sync", {
                    "enabled": False,
                    "days": 7,
                    "timezone": "Asia/Taipei",
                    "last_loaded_date": ""
                })
                data.setdefault("github_backup", {
                    "repo": "",
                    "branch": "",
                    "token": "",
                    "path": ""
                })
                data.setdefault("response_style", "")
                data.setdefault("bot_name", "")
                data.setdefault("bot_nickname", "")
                data.setdefault("owner_profile", {
                    "name": "",
                    "id": "",
                    "title": "",
                    "pronoun": "",
                    "nickname": ""
                })
                data.setdefault("timeout_minutes", 0)
                data.setdefault("dinner_location", "")
                data.setdefault("meal_reminder", {
                    "enabled": False,
                    "location": "",
                    "breakfast_time": "",
                    "lunch_time": "",
                    "dinner_time": "",
                    "channel_id": 0,
                    "timezone": "Asia/Taipei",
                    "last_sent": {}
                })
                data.setdefault("auto_chime_in", True)
                data.setdefault("chime_probability", 0.35)
                data.setdefault("chime_decision_retries", 1)
                data.setdefault("chime_in_channels", [])
                data.setdefault("timeout_channels", [])
                data.setdefault("user_profile", {
                    "appearance": "",
                    "personality": "",
                    "occupation": ""
                })
                data.setdefault("weather_reminder", {
                    "enabled": False,
                    "location": "",
                    "time": "",
                    "channel_id": 0,
                    "timezone": "Asia/Taipei",
                    "last_sent_date": ""
                })
                data.setdefault("todo_reminder", {
                    "enabled": False,
                    "content": "",
                    "time": "",
                    "channel_id": 0,
                    "timezone": "Asia/Taipei",
                    "last_sent_date": ""
                })
                data.setdefault("voice_default", {
                    "sample_id": env_sample_id
                })
                data.setdefault("voice_listen", {
                    "enabled": False,
                    "voice_channel_id": 0,
                    "reply_channel_id": 0,
                    "name_triggers": [],
                    "name_trigger_enabled": False
                })
                data.setdefault("nsfw_guard", {
                    "enabled": False,
                    "max_members": 0
                })
                data.setdefault("stt", {
                    "url": "",
                    "token": "",
                    "timeout": 0,
                    "language": ""
                })
                if env_sample_id:
                    data["voice_default"]["sample_id"] = env_sample_id
                return data
        except:
            pass
    return {
        "api_url": env_api_url,
        "api_key": env_api_key,
        "model": env_model,
        "system_prompt": env_prompt,
        "roleplay_prompt": env_roleplay_prompt,
        "character_prompt": env_character_prompt,
        "forbidden_words": default_forbidden_words,
        "forbidden_foods": [],
        "hated_foods": [],
        "forbidden_actions": default_forbidden_actions,
        "summary_schedule": {
            "enabled": False,
            "time": "",
            "timezone": "Asia/Taipei",
            "last_sent_date": ""
        },
        "memory_sync": {
            "enabled": False,
            "days": 7,
            "timezone": "Asia/Taipei",
            "last_loaded_date": ""
        },
        "github_backup": {
            "repo": "",
            "branch": "",
            "token": "",
            "path": ""
        },
        "response_style": "",
        "bot_name": "",
        "bot_nickname": "",
        "owner_profile": {
            "name": "",
            "id": "",
            "title": "",
            "pronoun": "",
            "nickname": ""
        },
        "timeout_minutes": 0,
        "dinner_location": "",
        "meal_reminder": {
            "enabled": False,
            "location": "",
            "breakfast_time": "",
            "lunch_time": "",
            "dinner_time": "",
            "channel_id": 0,
            "timezone": "Asia/Taipei",
            "last_sent": {}
        },
        "auto_chime_in": True,
        "chime_probability": 0.35,
        "chime_decision_retries": 1,
        "chime_in_channels": [],
        "timeout_channels": [],
        "user_profile": {
            "appearance": "",
            "personality": "",
            "occupation": ""
        },
        "weather_reminder": {
            "enabled": False,
            "location": "",
            "time": "",
            "channel_id": 0,
            "timezone": "Asia/Taipei",
            "last_sent_date": ""
        },
        "todo_reminder": {
            "enabled": False,
            "content": "",
            "time": "",
            "channel_id": 0,
            "timezone": "Asia/Taipei",
            "last_sent_date": ""
        },
        "voice_default": {
            "sample_id": env_sample_id
        },
        "voice_listen": {
            "enabled": False,
            "voice_channel_id": 0,
            "reply_channel_id": 0,
            "name_triggers": [],
            "name_trigger_enabled": False
        },
        "nsfw_guard": {
            "enabled": False,
            "max_members": 0
        },
        "stt": {
            "url": "",
            "token": "",
            "timeout": 0,
            "language": ""
        }
    }

def save_config(cfg):
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2, ensure_ascii=False)

def load_voice_profiles():
    if os.path.exists(VOICE_CONFIG_FILE):
        try:
            with open(VOICE_CONFIG_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, dict):
                    return data
        except:
            pass
    return {}

def save_voice_profiles(data):
    try:
        with open(VOICE_CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except:
        pass

# ───────── 對話紀錄與變數 ─────────
global_history = []
channel_last_time = {}
MAX_HISTORY = 10
memory_lock = threading.Lock()
voice_profiles = load_voice_profiles()
song_history = []

voice_channel_id = None
voice_listen_task = None
voice_active_sink = None

def get_voice_listen_config():
    cfg = config.get("voice_listen", {}) or {}
    return {
        "enabled": bool(cfg.get("enabled", False)),
        "voice_channel_id": int(cfg.get("voice_channel_id", 0) or 0),
        "reply_channel_id": int(cfg.get("reply_channel_id", 0) or 0),
        "name_triggers": list(cfg.get("name_triggers", []) or []),
        "name_trigger_enabled": bool(cfg.get("name_trigger_enabled", False)),
    }

def get_stt_config():
    cfg = config.get("stt", {}) or {}
    url = str(cfg.get("url", "")).strip() or STT_SPACE_URL
    token = str(cfg.get("token", "")).strip() or STT_API_KEY
    try:
        timeout_val = float(cfg.get("timeout", 0) or 0)
    except Exception:
        timeout_val = 0
    timeout = timeout_val if timeout_val > 0 else STT_TIMEOUT
    language = str(cfg.get("language", "")).strip() or STT_LANGUAGE
    return {
        "url": url,
        "token": token,
        "timeout": timeout,
        "language": language,
    }

def _normalize_text(text: str) -> str:
    return re.sub(r"\s+", "", str(text or "")).lower()

def _get_channel_member_count(channel) -> int:
    try:
        members = getattr(channel, "members", None)
        if isinstance(members, list) and members:
            return len(members)
    except Exception:
        pass
    try:
        if hasattr(channel, "guild") and channel.guild and channel.guild.member_count:
            return int(channel.guild.member_count)
    except Exception:
        pass
    return 0

async def _classify_nsfw(text: str) -> bool:
    if not text:
        return False
    if not config.get("api_key") or not config.get("api_url"):
        return False
    endpoint = f"{config['api_url'].rstrip('/')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {config['api_key']}",
        "Content-Type": "application/json"
    }
    body = {
        "model": config["model"],
        "messages": [
            {"role": "system", "content": (
                "你是一個內容分類器。請判斷輸入是否屬於 NSFW（成人/情色/露骨性內容）。"
                "只回覆 JSON：{\"nsfw\": true/false}"
            )},
            {"role": "user", "content": text}
        ],
        "response_format": {"type": "json_object"}
    }
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(endpoint, headers=headers, json=body, timeout=12) as resp:
                if resp.status != 200:
                    return False
                data = await resp.json()
                result = json.loads(data["choices"][0]["message"]["content"])
                return bool(result.get("nsfw", False))
    except Exception:
        return False

async def _should_block_nsfw(channel, text: str) -> bool:
    guard = config.get("nsfw_guard", {}) or {}
    if not guard.get("enabled", False):
        return False
    max_members = int(guard.get("max_members", 0) or 0)
    if max_members <= 0:
        return False
    member_count = _get_channel_member_count(channel)
    if member_count <= max_members:
        return False
    return await _classify_nsfw(text)

async def _select_reaction_emoji(text: str) -> str:
    if not text:
        return ""
    if not config.get("api_key") or not config.get("api_url"):
        return ""
    endpoint = f"{config['api_url'].rstrip('/')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {config['api_key']}",
        "Content-Type": "application/json"
    }
    body = {
        "model": config["model"],
        "messages": [
            {"role": "system", "content": (
                "你是一個 Discord 反應選擇器。"
                "請根據訊息語氣挑選 1 個適合的預設小黃臉表情符號，"
                "若不需要反應就回空字串。"
                "只回覆 JSON：{\"emoji\": \"\" 或 \"🙂\"}"
            )},
            {"role": "user", "content": text}
        ],
        "response_format": {"type": "json_object"}
    }
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(endpoint, headers=headers, json=body, timeout=10) as resp:
                if resp.status != 200:
                    return ""
                data = await resp.json()
                result = json.loads(data["choices"][0]["message"]["content"])
                emoji = str(result.get("emoji", "")).strip()
                return emoji
    except Exception:
        return ""

def _is_song_request(text: str) -> bool:
    if not text:
        return False
    key = _normalize_text(text)
    return any(k in key for k in ["推薦歌", "推薦歌曲", "推薦音樂", "推歌", "推音樂"])

def _extract_song_candidates(text: str) -> list[str]:
    if not text:
        return []
    candidates = []
    for line in str(text).splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        lower = stripped.lower()
        if "http://" in lower or "https://" in lower:
            continue
        if "spotify" in lower or "music.youtube" in lower:
            continue
        if stripped[0] in {"-", "•", "*", "1", "2", "3", "4", "5", "6", "7", "8", "9"}:
            candidates.append(stripped.lstrip("-•*0123456789.、 ").strip())
            continue
        if " - " in stripped or " — " in stripped or "：" in stripped:
            candidates.append(stripped)
    uniq = []
    for item in candidates:
        if item and item not in uniq:
            uniq.append(item)
        if len(uniq) >= 20:
            break
    return uniq

def _contains_trigger(text: str, triggers: list[str]) -> bool:
    normalized = _normalize_text(text)
    for raw in triggers:
        if not raw:
            continue
        key = _normalize_text(raw)
        if key and key in normalized:
            return True
    return False

def _is_name_triggered(text: str) -> bool:
    triggers = []
    bot_name = str(config.get("bot_name", "")).strip()
    bot_nickname = str(config.get("bot_nickname", "")).strip()
    if bot_name:
        triggers.append(bot_name)
    if bot_nickname:
        triggers.append(bot_nickname)
    if client and client.user:
        triggers.append(client.user.name)
        if client.user.display_name:
            triggers.append(client.user.display_name)
    return _contains_trigger(text, triggers)

def _write_wav_bytes(raw_pcm: bytes, sample_rate: int, channels: int, sample_width: int) -> bytes:
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(sample_width)
        wf.setframerate(sample_rate)
        wf.writeframes(raw_pcm)
    return buf.getvalue()

async def transcribe_pcm(raw_pcm: bytes) -> str:
    stt_cfg = get_stt_config()
    stt_url = stt_cfg.get("url", "")
    if not raw_pcm or not stt_url:
        return ""
    try:
        if raw_pcm[:4] == b"RIFF" and raw_pcm[8:12] == b"WAVE":
            wav_bytes = raw_pcm
        else:
            wav_bytes = _write_wav_bytes(raw_pcm, VOICE_SAMPLE_RATE, VOICE_CHANNELS, VOICE_SAMPLE_WIDTH)
        attempts = max(1, STT_RETRY_COUNT)
        for attempt in range(1, attempts + 1):
            form = aiohttp.FormData()
            form.add_field(
                "audio",
                wav_bytes,
                filename="audio.wav",
                content_type="audio/wav"
            )
            stt_language = stt_cfg.get("language", "")
            if stt_language:
                form.add_field("language", stt_language)
            headers = {}
            stt_token = stt_cfg.get("token", "")
            if stt_token:
                headers["Authorization"] = f"Bearer {stt_token}"
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        f"{stt_url}/transcribe",
                        data=form,
                        headers=headers,
                        timeout=stt_cfg.get("timeout", STT_TIMEOUT)
                    ) as resp:
                        if resp.status != 200:
                            err_text = await resp.text()
                            print(f"[stt] HTTP {resp.status} on attempt {attempt}: {err_text[:200]}")
                        else:
                            data = await resp.json()
                            text = data.get("text", "") if isinstance(data, dict) else ""
                            text = str(text or "").strip()
                            if text:
                                return text
                            print(f"[stt] empty text on attempt {attempt}")
            except Exception as e:
                print(f"[stt] exception on attempt {attempt}: {str(e)}")
            if attempt < attempts:
                await asyncio.sleep(max(0.1, STT_RETRY_DELAY))
    except Exception:
        return ""
    return ""


async def stt_health_check() -> tuple[bool, str]:
    stt_cfg = get_stt_config()
    stt_url = stt_cfg.get("url", "")
    if not stt_url:
        return False, "STT URL 未設定"
    headers = {}
    token = stt_cfg.get("token", "")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    endpoints = ["/health", "/docs", "/openapi.json"]
    async with aiohttp.ClientSession() as session:
        for path in endpoints:
            try:
                async with session.get(
                    f"{stt_url}{path}",
                    headers=headers,
                    timeout=min(6, stt_cfg.get("timeout", STT_TIMEOUT))
                ) as resp:
                    if resp.status < 400:
                        return True, f"HTTP {resp.status} {path}"
                    text = await resp.text()
                    last_error = f"HTTP {resp.status} {path}: {text[:120]}"
            except Exception as e:
                last_error = f"{type(e).__name__}: {e}"
    return False, last_error

async def handle_voice_transcript(text: str, author: Optional[discord.User], reply_channel_id: int, from_name_trigger: bool = False):
    if not text:
        return
    channel = client.get_channel(reply_channel_id)
    if channel is None:
        try:
            channel = await client.fetch_channel(reply_channel_id)
        except Exception:
            return

    display_name = author.display_name if author else "語音使用者"
    voice_display = f"{display_name}: {text}"
    add_to_history(channel.id, "user", voice_display)

    should_chime, _ = await check_if_should_chime(channel.id)
    if from_name_trigger:
        should_chime = True
    if not should_chime:
        return

    async with channel.typing():
        reply = await call_api(
            channel.id,
            user_text=text,
            special_instruction=(
                f"此訊息來自語音轉文字，說話者為 {display_name}。"
                "請以文字插嘴方式回覆，語氣要自然簡短。"
            ),
            author=author
        )
        await channel.send(reply)
        await maybe_send_voice(channel, reply, author=author)
        add_to_history(channel.id, "assistant", reply)

async def voice_segment_worker():
    return

def save_runtime_state():
    """把對話記憶與最後活動時間持久化到磁碟。"""
    try:
        with memory_lock:
            payload = {
                "global_history": global_history[-MAX_HISTORY:],
                "channel_last_time": {str(k): v for k, v in channel_last_time.items()},
                "song_history": song_history[-20:]
            }
            with open(MEMORY_FILE, "w", encoding="utf-8") as f:
                json.dump(payload, f, ensure_ascii=False, indent=2)
    except:
        pass

def load_runtime_state():
    """啟動時載入既有對話記憶，避免重啟後全部遺失。"""
    global global_history, channel_last_time, song_history
    if not os.path.exists(MEMORY_FILE):
        return
    try:
        with open(MEMORY_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)

        loaded_history = data.get("global_history", None)
        loaded_last_time = data.get("channel_last_time", {})
        loaded_song_history = data.get("song_history", [])

        if isinstance(loaded_history, list):
            global_history = loaded_history[-MAX_HISTORY:]
        else:
            legacy_history = data.get("channel_history", {})
            merged = []
            if isinstance(legacy_history, dict):
                for items in legacy_history.values():
                    if isinstance(items, list):
                        merged.extend(items)
            global_history = merged[-MAX_HISTORY:]
        channel_last_time = {
            int(k): float(v)
            for k, v in loaded_last_time.items()
        }
        if isinstance(loaded_song_history, list):
            song_history = [str(x) for x in loaded_song_history if str(x).strip()][:20]
    except:
        global_history = []
        channel_last_time = {}
        song_history = []

def _get_summary_timezone():
    tz_name = str(config.get("summary_schedule", {}).get("timezone", "Asia/Taipei")).strip()
    try:
        return ZoneInfo(tz_name)
    except Exception:
        return ZoneInfo("Asia/Taipei")

def _append_chat_log(channel_id: int, role: str, content: str):
    try:
        os.makedirs(CHAT_LOG_DIR, exist_ok=True)
        now_local = datetime.now(_get_summary_timezone())
        date_str = now_local.strftime("%Y-%m-%d")
        log_path = os.path.join(CHAT_LOG_DIR, f"{date_str}.jsonl")
        entry = {
            "ts": now_local.isoformat(),
            "channel_id": int(channel_id),
            "role": role,
            "content": content
        }
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    except:
        pass

def _remove_last_assistant_log(channel_id: int):
    try:
        os.makedirs(CHAT_LOG_DIR, exist_ok=True)
        now_local = datetime.now(_get_summary_timezone())
        date_str = now_local.strftime("%Y-%m-%d")
        log_path = os.path.join(CHAT_LOG_DIR, f"{date_str}.jsonl")
        if not os.path.exists(log_path):
            return False
        with open(log_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
        for idx in range(len(lines) - 1, -1, -1):
            try:
                item = json.loads(lines[idx].strip())
                if (
                    item.get("role") == "assistant"
                    and int(item.get("channel_id", 0)) == int(channel_id)
                ):
                    lines.pop(idx)
                    with open(log_path, "w", encoding="utf-8") as wf:
                        wf.writelines(lines)
                    return True
            except Exception:
                continue
    except Exception:
        return False
    return False

config = load_config()
load_runtime_state()

long_term_memory = ""

async def _load_github_summaries() -> str:
    sync_cfg = config.get("memory_sync", {}) or {}
    if not sync_cfg.get("enabled", False):
        return ""
    days = int(sync_cfg.get("days", 0) or 0)
    if days <= 0:
        return ""
    tz_name = str(sync_cfg.get("timezone", "Asia/Taipei")).strip() or "Asia/Taipei"
    try:
        tz = ZoneInfo(tz_name)
    except Exception:
        tz = ZoneInfo("Asia/Taipei")

    github_cfg = config.get("github_backup", {}) or {}
    repo = str(github_cfg.get("repo") or os.environ.get("GITHUB_REPO", "")).strip()
    branch = str(github_cfg.get("branch") or os.environ.get("GITHUB_BRANCH", "main")).strip() or "main"
    token = str(github_cfg.get("token") or os.environ.get("GITHUB_TOKEN", "")).strip()
    if not repo or not token:
        return ""

    base_path = _get_github_summary_base_path()
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github+json"
    }

    async def _fetch_day_summary(date_str: str) -> str:
        path = f"{base_path}{date_str}.md"
        url = f"https://api.github.com/repos/{repo}/contents/{path}"
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers, params={"ref": branch}, timeout=15) as resp:
                    if resp.status != 200:
                        return ""
                    data = await resp.json()
                    content_b64 = data.get("content", "")
                    if not content_b64:
                        return ""
                    try:
                        decoded = base64.b64decode(content_b64).decode("utf-8", errors="ignore")
                    except Exception:
                        return ""
                    return decoded.strip()
        except Exception:
            return ""

    now_local = datetime.now(tz)
    results = []
    for i in range(days):
        day = now_local - timedelta(days=i)
        date_str = day.strftime("%Y-%m-%d")
        text = await _fetch_day_summary(date_str)
        if text:
            results.append(f"# {date_str}\n{text}")
    return "\n\n".join(reversed(results))

DINNER_OPTIONS = [
    "日式咖哩飯",
    "牛肉麵",
    "壽司",
    "韓式拌飯",
    "泰式打拋豬",
    "義大利麵",
    "披薩",
    "滷肉飯",
    "雞肉飯",
    "火鍋",
    "麻辣燙",
    "海鮮粥",
    "鍋貼",
    "水餃",
    "燒肉飯",
    "拉麵",
    "炒飯",
    "炒麵",
    "漢堡",
    "三明治",
    "沙拉",
    "關東煮",
    "鹽酥雞",
    "烤雞腿便當",
    "蔬食便當",
    "咖哩烏龍",
    "清燉雞湯麵",
    "壽喜燒",
    "鐵板燒",
    "燉飯"
]

def _extract_speaker_and_text(content: str):
    """從 `顯示名稱: 訊息內容` 格式中切出發言者與內容。"""
    if not isinstance(content, str):
        return None, content
    if ": " in content:
        speaker, text = content.split(": ", 1)
        if speaker.strip():
            return speaker.strip(), text
    return None, content

def get_recent_speakers_summary(channel_id, limit=6):
    """整理最近對話中的發言者摘要，提供給 system prompt 做身分辨識。"""
    recent = global_history[-limit:]
    lines = []
    for item in recent:
        role = item.get("role")
        content = item.get("content", "")
        speaker, text = _extract_speaker_and_text(content)
        if role == "user":
            if speaker:
                lines.append(f"- 使用者({speaker}): {text}")
            else:
                lines.append(f"- 使用者(未知名稱): {content}")
        else:
            lines.append(f"- 助手: {content}")
    return "\n".join(lines) if lines else "- (目前沒有可用上下文)"

def add_to_history(channel_id, role, content):
    global_history.append({"role": role, "content": content})
    if len(global_history) > MAX_HISTORY:
        global_history.pop(0)
    _append_chat_log(channel_id, role, content)
    save_runtime_state()

def _remove_last_assistant_message(channel_id):
    removed = None
    for i in range(len(global_history) - 1, -1, -1):
        if global_history[i].get("role") == "assistant":
            removed = global_history.pop(i)
            save_runtime_state()
            return removed
    return None

def _get_last_user_message(channel_id):
    for i in range(len(global_history) - 1, -1, -1):
        if global_history[i].get("role") == "user":
            return global_history[i].get("content", "")
    return ""

def _is_chime_channel_allowed(channel_id: int):
    allowed = config.get("chime_in_channels", [])
    if not isinstance(allowed, list) or not allowed:
        return True
    try:
        allowed_ids = {int(cid) for cid in allowed}
    except Exception:
        return True
    return int(channel_id) in allowed_ids


def _is_timeout_channel_allowed(channel_id: int):
    allowed = config.get("timeout_channels", [])
    if not isinstance(allowed, list) or not allowed:
        return False
    try:
        allowed_ids = {int(cid) for cid in allowed}
    except Exception:
        return False
    return int(channel_id) in allowed_ids

def _parse_channel_id(raw: str) -> Optional[int]:
    if raw is None:
        return None
    digits = re.findall(r"\d+", str(raw))
    if not digits:
        return None
    try:
        return int(digits[0])
    except Exception:
        return None


async def _start_voice_listen(voice_channel_id: int, reply_channel_id: int):
    global voice_listen_task, voice_active_sink
    if not voice_channel_id or not reply_channel_id:
        return
    if client.voice_client is None or not client.voice_client.is_connected():
        channel = client.get_channel(voice_channel_id)
        if channel is None:
            try:
                channel = await client.fetch_channel(voice_channel_id)
            except Exception:
                channel = None
        if channel is None or not isinstance(channel, (discord.VoiceChannel, discord.StageChannel)):
            return
        if client.voice_client:
            try:
                await client.voice_client.disconnect(force=True)
            except Exception:
                pass
        client.voice_client = await channel.connect()

    if voice_listen_task:
        voice_listen_task.cancel()
        voice_listen_task = None
    voice_listen_task = client.loop.create_task(_voice_listen_worker(reply_channel_id))

    if voice_active_sink:
        try:
            client.voice_client.stop_recording()
        except Exception:
            pass
    sink = sinks.WaveSink()
    voice_active_sink = sink
    client.voice_client.start_recording(
        sink,
        _voice_recording_done_callback,
        reply_channel_id
    )


async def _stop_voice_listen():
    global voice_listen_task, voice_active_sink
    if voice_listen_task:
        voice_listen_task.cancel()
        voice_listen_task = None
    if client.voice_client and client.voice_client.is_recording():
        try:
            client.voice_client.stop_recording()
        except Exception:
            pass
    voice_active_sink = None


def _voice_recording_done_callback(sink: sinks.WaveSink, reply_channel_id: int):
    try:
        for user_id, audio in (sink.audio_data or {}).items():
            if not audio or not getattr(audio, "file", None):
                continue
            try:
                audio.file.seek(0)
                raw_pcm = audio.file.read()
                if not raw_pcm:
                    continue
                asyncio.run_coroutine_threadsafe(
                    _handle_voice_pcm(raw_pcm, user_id, reply_channel_id),
                    client.loop
                )
            except Exception:
                continue
    except Exception:
        pass


async def _handle_voice_pcm(raw_pcm: bytes, user_id: int, reply_channel_id: int):
    if not raw_pcm:
        return
    text = await transcribe_pcm(raw_pcm)
    if not text:
        return
    author = client.get_user(int(user_id)) if user_id else None
    cfg = get_voice_listen_config()
    triggered = False
    if cfg.get("name_trigger_enabled"):
        triggered = _is_name_triggered(text) or _contains_trigger(text, cfg.get("name_triggers", []))
    await handle_voice_transcript(text, author, reply_channel_id, from_name_trigger=triggered)


async def _voice_listen_worker(reply_channel_id: int):
    while True:
        await asyncio.sleep(VOICE_SILENCE_SECONDS)
        if client.voice_client is None or not client.voice_client.is_connected():
            return
        if client.voice_client.is_recording():
            try:
                client.voice_client.stop_recording()
            except Exception:
                pass
        sink = sinks.WaveSink()
        global voice_active_sink
        voice_active_sink = sink
        client.voice_client.start_recording(
            sink,
            _voice_recording_done_callback,
            reply_channel_id
        )


async def _ensure_voice_listen_on_ready():
    await client.wait_until_ready()
    cfg = get_voice_listen_config()
    if not cfg.get("enabled"):
        return
    voice_id = int(cfg.get("voice_channel_id", 0) or 0)
    reply_id = int(cfg.get("reply_channel_id", 0) or 0)
    if not voice_id or not reply_id:
        return
    try:
        await _start_voice_listen(voice_id, reply_id)
    except Exception as e:
        print(f"[voice] auto-start failed: {type(e).__name__}: {e}")

# ───────── 語音設定/呼叫 HF XTTS ─────────
def get_voice_profile(user_id: int) -> dict:
    profile = voice_profiles.get(str(user_id))
    if isinstance(profile, dict):
        return profile
    default_profile = config.get("voice_default")
    if isinstance(default_profile, dict):
        return default_profile
    return {}

def is_voice_enabled(user_id: int) -> bool:
    profile = get_voice_profile(user_id)
    if isinstance(profile, dict) and "enabled" in profile:
        return bool(profile.get("enabled"))
    return True

def set_voice_profile(user_id: int, profile: dict) -> None:
    voice_profiles[str(user_id)] = profile
    save_voice_profiles(voice_profiles)

def _resolve_hf_token(profile: dict) -> str:
    if profile.get("hf_token"):
        return str(profile.get("hf_token"))
    return os.environ.get("HF_TOKEN", "")


def _resolve_space_url(profile: dict) -> str:
    return ""


def _resolve_gradio_space(profile: dict) -> str:
    return ""


def _resolve_gradio_api_name(profile: dict) -> str:
    return ""


def _resolve_tonyassi_base() -> str:
    return str(os.environ.get("TONYASSI_SPACE", "https://tonyassi-voice-clone.hf.space")).strip().rstrip("/")


def _resolve_hasbas_base() -> str:
    return str(
        os.environ.get("HASANBASBUNAR_SPACE", "https://hasanbasbunar-voice-cloning-xtts-v2.hf.space")
    ).strip().rstrip("/")


def _resolve_voice_provider(profile: dict) -> str:
    provider = str(profile.get("voice_provider", "") or os.environ.get("VOICE_PROVIDER", "")).strip().lower()
    return provider or "quinoad"


def _resolve_quinoad_base() -> str:
    return str(
        os.environ.get("QUINOAD_SPACE", "https://quinoad-voice-clone-multilingual.hf.space")
    ).strip().rstrip("/")


def _resolve_voice_sample_rate() -> int:
    raw = os.environ.get("VOICE_SAMPLE_RATE", "22050")
    try:
        value = int(str(raw).strip())
    except Exception:
        return 22050
    if value < 8000:
        return 8000
    if value > 48000:
        return 48000
    return value


def _env_float(name: str, default: float) -> float:
    raw = os.environ.get(name)
    if raw is None:
        return default
    try:
        return float(str(raw).strip())
    except Exception:
        return default


def _env_int(name: str, default: int) -> int:
    raw = os.environ.get(name)
    if raw is None:
        return default
    try:
        return int(float(str(raw).strip()))
    except Exception:
        return default


def _env_bool(name: str, default: bool) -> bool:
    raw = os.environ.get(name)
    if raw is None:
        return default
    text = str(raw).strip().lower()
    if text in {"1", "true", "yes", "y", "on"}:
        return True
    if text in {"0", "false", "no", "n", "off"}:
        return False
    return default


def _resample_audio_bytes(audio_bytes: bytes, sample_rate: int) -> bytes:
    if not audio_bytes:
        return audio_bytes
    with tempfile.TemporaryDirectory() as tmp_dir:
        input_path = os.path.join(tmp_dir, "input")
        output_path = os.path.join(tmp_dir, "output.mp3")
        with open(input_path, "wb") as f:
            f.write(audio_bytes)
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-i",
                input_path,
                "-ar",
                str(sample_rate),
                "-ac",
                "1",
                "-codec:a",
                "libmp3lame",
                "-qscale:a",
                "2",
                output_path,
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        with open(output_path, "rb") as f:
            return f.read()


def _split_audio_bytes(audio_bytes: bytes, max_bytes: int) -> list[bytes]:
    if not audio_bytes:
        return []
    if max_bytes <= 0:
        return [audio_bytes]
    return [audio_bytes[i:i + max_bytes] for i in range(0, len(audio_bytes), max_bytes)]


def _guess_audio_content_type(url: str) -> str:
    lower = str(url or "").lower()
    if lower.endswith(".wav"):
        return "audio/wav"
    if lower.endswith(".mp3"):
        return "audio/mpeg"
    return ""


def _resolve_sample_url(profile: dict) -> str:
    explicit = str(profile.get("sample_url", "")).strip()
    if explicit:
        return explicit
    sample_id = str(profile.get("sample_id", "")).strip()
    if sample_id.startswith("http://") or sample_id.startswith("https://"):
        return sample_id
    base = str(os.environ.get("VOICE_SAMPLE_BASE_URL", "")).strip().rstrip("/")
    if not base or not sample_id:
        return ""
    if not sample_id.lower().endswith(".wav"):
        sample_id = f"{sample_id}.wav"
    return f"{base}/{sample_id}"


async def request_tts_from_hf(text: str, profile: dict, target_lang: Optional[str] = None, force_chunked: bool = True):
    provider = _resolve_voice_provider(profile)

    if provider == "tonyassi" or profile.get("use_tonyassi") or os.environ.get("USE_TONYASSI_TTS", "").strip():
        return await request_tts_from_tonyassi(
            text=text,
            profile=profile,
        )

    if provider == "hasan" or provider == "hasanbasbunar":
        return await request_tts_from_hasanbasbunar(
            text=text,
            profile=profile,
        )

    if provider == "quinoad":
        return await request_tts_from_quinoad(
            text=text,
            profile=profile,
            target_lang=target_lang,
        )

    raw_sample_id = str(profile.get("sample_id", "")).strip()
    sample_id = raw_sample_id
    if "," in raw_sample_id:
        candidates = [s.strip() for s in raw_sample_id.split(",") if s.strip()]
        if candidates:
            sample_id = random.choice(candidates)

    voice_lang = (target_lang or str(profile.get("voice_lang", "")).strip())
    source_lang_label = str(profile.get("text_lang", "")).strip()
    source_lang = TEXT_LANG_TO_NLLB.get(source_lang_label, "")
    auto_translate = bool(voice_lang)

    payload = {
        "user_id": profile.get("user_id", ""),
        "sample_id": sample_id,
        "text": text,
        "chunked": bool(force_chunked),
        "max_bytes": VOICE_MAX_BYTES,
        "auto_translate": auto_translate,
    }
    if voice_lang:
        payload["target_lang"] = voice_lang
    if source_lang:
        payload["source_lang"] = source_lang

    headers = {"Content-Type": "application/json"}
    token = os.environ.get("HF_TOKEN", "")
    if token:
        headers["Authorization"] = f"Bearer {token}"

    return {"error": "已移除 HF Space CPU 語音生成"}


async def request_tts_from_tonyassi(text: str, profile: dict):
    base_url = _resolve_tonyassi_base()
    sample_url = _resolve_sample_url(profile)
    if not sample_url:
        return {"error": "未設定 sample_url 或 VOICE_SAMPLE_BASE_URL"}

    payload = {
        "data": [
            text,
            {
                "path": sample_url,
                "meta": {"_type": "gradio.FileData"}
            }
        ]
    }

    call_url = f"{base_url}/gradio_api/call/clone"
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(call_url, json=payload, timeout=120) as resp:
                if resp.status != 200:
                    err_text = await resp.text()
                    return {"error": f"tonyassi POST 失敗 ({resp.status}): {err_text[:200]}"}
                data = await resp.json(content_type=None)
                event_id = data.get("event_id") or data.get("id")
                if not event_id:
                    return {"error": "tonyassi 回傳缺少 event_id"}

        result_url = f"{base_url}/gradio_api/call/clone/{event_id}"
        async with aiohttp.ClientSession() as session:
            async with session.get(result_url, timeout=300) as resp:
                if resp.status != 200:
                    err_text = await resp.text()
                    return {"error": f"tonyassi GET 失敗 ({resp.status}): {err_text[:200]}"}
                raw_text = await resp.text()
    except Exception as e:
        return {"error": f"tonyassi 連線失敗: {str(e)}"}

    audio_url = ""
    for line in raw_text.splitlines():
        if line.startswith("data:"):
            try:
                payload = json.loads(line.replace("data:", "", 1).strip())
            except Exception:
                continue
            if isinstance(payload, dict):
                data_list = payload.get("data")
                if isinstance(data_list, list) and data_list:
                    last = data_list[-1]
                    if isinstance(last, dict):
                        audio_url = last.get("url") or last.get("path") or ""
                    elif isinstance(last, str):
                        audio_url = last
            if audio_url:
                break

    if not audio_url:
        try:
            parsed = json.loads(raw_text)
        except Exception:
            parsed = None
        if isinstance(parsed, dict):
            data_list = parsed.get("data")
            if isinstance(data_list, list) and data_list:
                last = data_list[-1]
                if isinstance(last, dict):
                    audio_url = last.get("url") or last.get("path") or ""
                elif isinstance(last, str):
                    audio_url = last

    if not audio_url:
        snippet = raw_text.strip().replace("\n", " ")[:500]
        return {"error": f"tonyassi 回傳未包含音訊 URL，原始回應片段: {snippet}"}

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(audio_url, timeout=120) as resp:
                if resp.status != 200:
                    err_text = await resp.text()
                    return {
                        "audio_url": audio_url,
                        "content_type": _guess_audio_content_type(audio_url),
                        "warning": f"音訊下載失敗 ({resp.status}): {err_text[:200]}"
                    }
                audio_bytes = await resp.read()
                header_type = str(resp.headers.get("Content-Type", "")).lower()
                guessed = _guess_audio_content_type(audio_url)
                content_type = header_type or guessed or "audio/wav"
                return {"audio": audio_bytes, "content_type": content_type}
    except Exception as e:
        return {
            "audio_url": audio_url,
            "content_type": _guess_audio_content_type(audio_url),
            "warning": f"音訊下載失敗: {str(e)}"
        }


async def request_tts_from_hasanbasbunar(text: str, profile: dict):
    base_url = _resolve_hasbas_base()
    sample_url = _resolve_sample_url(profile)
    if not sample_url:
        return {"error": "未設定 sample_url 或 VOICE_SAMPLE_BASE_URL"}

    lang_label = str(profile.get("text_lang", "English")).strip() or "English"
    payload = {
        "data": [
            text,
            sample_url,
            str(profile.get("example_audio_name", "audio_1.wav")) or "audio_1.wav",
            lang_label,
            _env_float("HASAN_TEMPERATURE", 0.1),
            _env_float("HASAN_SPEED", 0.5),
            _env_bool("HASAN_DO_SAMPLE", True),
            _env_float("HASAN_REPETITION_PENALTY", 1.0),
            _env_float("HASAN_LENGTH_PENALTY", 1.0),
            _env_int("HASAN_GPT_COND_LENGTH", 10),
            _env_int("HASAN_TOP_K", 0),
            _env_float("HASAN_TOP_P", 0.0),
            _env_bool("HASAN_REMOVE_SILENCE", True),
            _env_float("HASAN_SILENCE_THRESHOLD", -60.0),
            _env_int("HASAN_MIN_SILENCE_LENGTH", 300),
            _env_int("HASAN_KEEP_SILENCE", 100),
            str(os.environ.get("HASAN_SPLITTING_METHOD", "Native XTTS splitting")),
            _env_int("HASAN_MAX_CHARS", 50),
            _env_bool("HASAN_ENABLE_PREPROCESS", True),
        ]
    }

    call_url = f"{base_url}/gradio_api/call/voice_clone_synthesis"
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(call_url, json=payload, timeout=120) as resp:
                if resp.status != 200:
                    err_text = await resp.text()
                    return {"error": f"hasanbasbunar POST 失敗 ({resp.status}): {err_text[:200]}"}
                data = await resp.json(content_type=None)
                event_id = data.get("event_id") or data.get("id")
                if not event_id:
                    return {"error": "hasanbasbunar 回傳缺少 event_id"}

        result_url = f"{base_url}/gradio_api/call/voice_clone_synthesis/{event_id}"
        async with aiohttp.ClientSession() as session:
            async with session.get(result_url, timeout=300) as resp:
                if resp.status != 200:
                    err_text = await resp.text()
                    return {"error": f"hasanbasbunar GET 失敗 ({resp.status}): {err_text[:200]}"}
                raw_text = await resp.text()
    except Exception as e:
        return {"error": f"hasanbasbunar 連線失敗: {str(e)}"}

    audio_url = ""
    for line in raw_text.splitlines():
        if line.startswith("data:"):
            try:
                payload = json.loads(line.replace("data:", "", 1).strip())
            except Exception:
                continue
            if isinstance(payload, dict):
                data_list = payload.get("data")
                if isinstance(data_list, list) and data_list:
                    last = data_list[-1]
                    if isinstance(last, dict):
                        audio_url = last.get("url") or last.get("path") or ""
                    elif isinstance(last, str):
                        audio_url = last
            if audio_url:
                break

    if not audio_url:
        return {"error": "hasanbasbunar 回傳未包含音訊 URL"}

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(audio_url, timeout=120) as resp:
                if resp.status != 200:
                    err_text = await resp.text()
                    return {"error": f"音訊下載失敗 ({resp.status}): {err_text[:200]}"}
                audio_bytes = await resp.read()
                header_type = str(resp.headers.get("Content-Type", "")).lower()
                guessed = _guess_audio_content_type(audio_url)
                content_type = header_type or guessed or "audio/wav"
                return {"audio": audio_bytes, "content_type": content_type}
    except Exception as e:
        return {"error": f"音訊下載失敗: {str(e)}"}


async def request_tts_from_quinoad(text: str, profile: dict, target_lang: Optional[str] = None):
    base_url = _resolve_quinoad_base()
    sample_url = _resolve_sample_url(profile)
    if not sample_url:
        return {"error": "未設定 sample_url 或 VOICE_SAMPLE_BASE_URL"}

    lang_label = target_lang or str(profile.get("text_lang", "")).strip() or "en"
    payload = {
        "data": [
            text,
            {"path": sample_url, "meta": {"_type": "gradio.FileData"}},
            lang_label,
        ]
    }

    call_url = f"{base_url}/gradio_api/call/predict"
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(call_url, json=payload, timeout=120) as resp:
                if resp.status != 200:
                    err_text = await resp.text()
                    return {"error": f"quinoad POST 失敗 ({resp.status}): {err_text[:200]}"}
                data = await resp.json(content_type=None)
                event_id = data.get("event_id") or data.get("id")
                if not event_id:
                    return {"error": "quinoad 回傳缺少 event_id"}

        result_url = f"{base_url}/gradio_api/call/predict/{event_id}"
        async with aiohttp.ClientSession() as session:
            async with session.get(result_url, timeout=300) as resp:
                if resp.status != 200:
                    err_text = await resp.text()
                    return {"error": f"quinoad GET 失敗 ({resp.status}): {err_text[:200]}"}
                raw_text = await resp.text()
    except Exception as e:
        return {"error": f"quinoad 連線失敗: {str(e)}"}

    audio_url = ""
    for line in raw_text.splitlines():
        if line.startswith("data:"):
            try:
                payload = json.loads(line.replace("data:", "", 1).strip())
            except Exception:
                continue
            if isinstance(payload, dict):
                data_list = payload.get("data")
                if isinstance(data_list, list) and data_list:
                    last = data_list[-1]
                    if isinstance(last, dict):
                        audio_url = last.get("url") or last.get("path") or ""
                    elif isinstance(last, str):
                        audio_url = last
            if audio_url:
                break

    if not audio_url:
        try:
            parsed = json.loads(raw_text)
        except Exception:
            parsed = None
        if isinstance(parsed, dict):
            data_list = parsed.get("data")
            if isinstance(data_list, list) and data_list:
                last = data_list[-1]
                if isinstance(last, dict):
                    audio_url = last.get("url") or last.get("path") or ""
                elif isinstance(last, str):
                    audio_url = last

    if not audio_url:
        snippet = raw_text.strip().replace("\n", " ")[:500]
        return {"error": f"quinoad 回傳未包含音訊 URL，原始回應片段: {snippet}"}

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(audio_url, timeout=120) as resp:
                if resp.status != 200:
                    err_text = await resp.text()
                    return {
                        "audio_url": audio_url,
                        "content_type": _guess_audio_content_type(audio_url),
                        "warning": f"音訊下載失敗 ({resp.status}): {err_text[:200]}"
                    }
                audio_bytes = await resp.read()
                header_type = str(resp.headers.get("Content-Type", "")).lower()
                guessed = _guess_audio_content_type(audio_url)
                content_type = header_type or guessed or "audio/wav"
                return {"audio": audio_bytes, "content_type": content_type}
    except Exception as e:
        return {
            "audio_url": audio_url,
            "content_type": _guess_audio_content_type(audio_url),
            "warning": f"音訊下載失敗: {str(e)}"
        }
async def send_voice_response(channel: discord.abc.Messageable, text: str, profile: dict, target_lang: Optional[str] = None):
    provider = _resolve_voice_provider(profile)
    if provider in {"tonyassi", "hasan", "hasanbasbunar", "quinoad"} or profile.get("use_tonyassi") or os.environ.get("USE_TONYASSI_TTS", "").strip():
        if not _resolve_sample_url(profile):
            await channel.send("⚠️ 尚未設定 sample_url 或 VOICE_SAMPLE_BASE_URL。請使用 /set_voice 設定 sample_url。")
            return

    result = await request_tts_from_hf(text=text, profile=profile, target_lang=target_lang)
    if result.get("error"):
        await channel.send(f"⚠️ 語音生成失敗：{result['error']}")
        return

    audio_url = result.get("audio_url")
    if audio_url:
        warning = result.get("warning")
        if warning:
            await channel.send(f"⚠️ {warning}")
        await channel.send(f"🔊 音訊連結：{audio_url}")
        return

    audio_bytes = result.get("audio")
    content_type = str(result.get("content_type", ""))
    if isinstance(audio_bytes, (bytes, bytearray)):
        chunks = _split_audio_bytes(bytes(audio_bytes), VOICE_MAX_BYTES)
        if not chunks:
            await channel.send("⚠️ 語音回傳為空。")
            return
        for idx, chunk in enumerate(chunks, start=1):
            ext = "wav" if "wav" in content_type else "mp3"
            filename = f"voice_{idx}.{ext}" if len(chunks) > 1 else f"voice.{ext}"
            file = discord.File(io.BytesIO(chunk), filename=filename)
            await channel.send(file=file)
        return

    segments = result.get("segments")
    if result.get("chunked") and isinstance(segments, list):
        for seg in segments:
            if not isinstance(seg, dict):
                continue
            audio_b64 = seg.get("audio_base64")
            if not audio_b64:
                continue
            chunk_bytes = base64.b64decode(audio_b64)
            filename = f"voice_{seg.get('index', 0)}.mp3"
            file = discord.File(io.BytesIO(chunk_bytes), filename=filename)
            await channel.send(file=file)
        return

    await channel.send("⚠️ 語音回傳格式不正確。")

# ───────── 核心工具：拉取模型清單 ─────────
def _normalize_api_base(api_url: str) -> str:
    if not api_url:
        return ""
    base = str(api_url).strip().rstrip("/")
    # 若已包含 /v1 或更深層路徑，截到 /v1
    match = re.search(r"^(.*?/v1)(/.*)?$", base)
    if match:
        return match.group(1)
    return f"{base}/v1"

async def fetch_models():
    """從自定義 API 網址拉取可用模型列表供選單使用"""
    if not config.get("api_key") or not config.get("api_url"):
        return []
    base = _normalize_api_base(config.get("api_url", ""))
    if not base:
        return []
    url = f"{base}/models"
    headers = {"Authorization": f"Bearer {config['api_key']}"}
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers, timeout=8) as resp:
                if resp.status == 200:
                    data = await resp.json(content_type=None)
                    payload = data
                    if isinstance(data, dict):
                        payload = data.get("data", data.get("models", []))
                    models = []
                    if isinstance(payload, list):
                        for item in payload:
                            if isinstance(item, str):
                                models.append(item)
                            elif isinstance(item, dict):
                                model_id = (
                                    item.get("id")
                                    or item.get("name")
                                    or item.get("model")
                                    or item.get("value")
                                )
                                if model_id:
                                    models.append(str(model_id))
                    if models:
                        return sorted(set(models))
    except:
        pass
    return []

# ───────── Discord Bot 設定 ─────────
intents = discord.Intents.default()
intents.message_content = True 
intents.voice_states = True
intents.members = bool(os.environ.get("DISCORD_ENABLE_MEMBERS_INTENT", ""))

class MyClient(discord.Bot):
    def __init__(self):
        super().__init__(intents=intents)
        self.tree = _CommandTreeCompat(self)
        self.voice_client: Optional[discord.VoiceClient] = None

    async def setup_hook(self):
        # 啟動超時檢查背景任務
        self.loop.create_task(timeout_checker())
        # 啟動每日天氣提醒背景任務
        self.loop.create_task(weather_reminder_checker())
        # 啟動每日三餐提醒背景任務
        self.loop.create_task(meal_reminder_checker())
        # 啟動每日待辦提醒背景任務
        self.loop.create_task(todo_reminder_checker())
        # 啟動每日總結背景任務
        self.loop.create_task(daily_summary_checker())
        # 啟動長期記憶載入任務（從 GitHub summary）
        self.loop.create_task(memory_sync_worker())
        # 語音接收（若已啟用，啟動語音偵測）
        self.loop.create_task(_ensure_voice_listen_on_ready())
        # 語音自動重連
        self.loop.create_task(voice_reconnect_watcher())

client = MyClient()
OWNER_ID = int(os.environ.get("OWNER_ID", 0))

def is_owner(interaction: discord.Interaction):
    return interaction.user.id == OWNER_ID

# ───────── API 呼叫邏輯 ─────────
def build_system_prompt(channel_id=None, author=None):
    tz = timezone(timedelta(hours=8))
    now = datetime.now(tz)
    current_time_str = now.strftime("%Y-%m-%d %H:%M:%S")
    weekday_list = ["一", "二", "三", "四", "五", "六", "日"]
    weekday = weekday_list[now.weekday()]

    prompt = config["system_prompt"]

    owner_profile = config.get("owner_profile", {})
    owner_name = owner_profile.get("name", "")
    owner_id_text = owner_profile.get("id", "")
    owner_title = owner_profile.get("title", "")
    owner_pronoun = owner_profile.get("pronoun", "")
    owner_nickname = owner_profile.get("nickname", "")
    if owner_name or owner_id_text or owner_title or owner_pronoun or owner_nickname:
        prompt += "\n\n【Owner 身分提醒】"
        if owner_name:
            prompt += f"\n- Discord 名字：{owner_name}"
        if owner_id_text:
            prompt += f"\n- Discord ID：{owner_id_text}"
        if owner_title:
            prompt += f"\n- 你對 Owner 的稱呼：{owner_title}"
        if owner_pronoun:
            prompt += f"\n- Owner 人稱代詞：{owner_pronoun}"
        if owner_nickname:
            prompt += f"\n- Owner 暱稱：{owner_nickname}"

    response_style = str(config.get("response_style", "")).strip()
    if response_style:
        prompt += f"\n\n【回應文風】\n{response_style}"
        prompt += (
            "\n【格式規則】"
            "\n- 嚴格遵守上述回應文風。"
            "\n- 不要使用多餘的換行或斷點，除非文風明確要求分段。"
            "\n- 回覆必須連貫自然，避免無意義的空白行。"
            "\n- 若文風包含『範例句』或示範內容，只能參考風格與語氣，不可照抄原句。"
        )

    bot_name = str(config.get("bot_name", "")).strip()
    bot_nickname = str(config.get("bot_nickname", "")).strip()
    if bot_name or bot_nickname:
        prompt += "\n\n【你的名字/暱稱】"
        if bot_name:
            prompt += f"\n- 名字：{bot_name}"
        if bot_nickname:
            prompt += f"\n- 暱稱：{bot_nickname}"
        prompt += "\n當使用者呼喚或提及你時，優先以這些名字/暱稱自稱。"

    roleplay_prompt = str(config.get("roleplay_prompt", "")).strip()
    character_prompt = str(config.get("character_prompt", "")).strip()
    if roleplay_prompt:
        prompt += f"\n\n【Roleplay 守則】\n{roleplay_prompt}"
    if character_prompt:
        prompt += f"\n\n【角色設定】\n{character_prompt}"

    # 將時間資訊注入到 Prompt 中
    prompt += f"\n\n【目前時間感知】"
    prompt += f"\n現在的精確時間是：{current_time_str} (星期{weekday})"
    prompt += f"\n你必須根據這個時間來回應使用者（例如打招呼或提及日期）。"

    if author:
        is_boss = (author.id == OWNER_ID)
        # 取得使用者的顯示名稱 (伺服器暱稱優先，沒有就用一般名稱)
        display_name = author.display_name
        prompt += f"\n\n【目前的對話對象】"
        prompt += f"\n名稱：{display_name}"
        if is_boss:
            prompt += f"\n身份：他是你的【交往對象】。你對他應該展現出最高的忠誠度與親暱感。"
        else:
            prompt += f"\n身份：他是你主人的【朋友】。你可以對他友善，但要清楚知道誰才是真正的戀人。"

        if is_boss:
            profile = config.get("user_profile", {})
            appearance = profile.get("appearance", "").strip()
            personality = profile.get("personality", "").strip()
            occupation = profile.get("occupation", "").strip()
            prompt += "\n\n【主要使用者設定】"
            prompt += f"\n外觀：{appearance or '（未設定）'}"
            prompt += f"\n個性：{personality or '（未設定）'}"
            prompt += f"\n職業：{occupation or '（未設定）'}"
            if owner_nickname:
                prompt += f"\n稱呼：請以『{owner_nickname}』稱呼主要使用者。"
            prompt += (
                "\n你必須讀取並記住上述設定，"
                "在回覆主要使用者時融入外觀、個性與職業相關的細節，"
                "以提升代入感。"
            )

    # 身分辨識與上下文一致性規範（所有情境都必須遵守）
    prompt += (
        "\n\n【回覆前必做流程】"
        "\n1) 先閱讀最近上下文，辨識『最後一位人類發言者』是誰。"
        "\n2) 僅依該發言者的身分與語氣回覆，不可把其他角色當成目前對象。"
        "\n3) 若上下文不足以確認對象，必須明確用中性方式回覆，不能擅自捏造對象或關係。"
        "\n4) 任何回覆（被標記回覆、主動插嘴、沉默破冰）都必須遵守本 prompt 的人設與禁令。"
    )

    if channel_id is not None:
        prompt += "\n\n【最近對話摘要（請用於辨識發言者）】\n"
        prompt += get_recent_speakers_summary(channel_id)

    if long_term_memory:
        prompt += "\n\n【長期記憶（近期總結）】\n"
        prompt += long_term_memory

    
    forbidden_words = config.get("forbidden_words", []) or []
    forbidden_foods = config.get("forbidden_foods", []) or []
    hated_foods = config.get("hated_foods", []) or []
    forbidden_actions = config.get("forbidden_actions", []) or []

    if forbidden_words or forbidden_foods or hated_foods or forbidden_actions:
        prompt += "\n\n【絕對禁令】"
        if forbidden_words:
            prompt += f"\n- 禁止詞彙：{'、'.join(forbidden_words)}"
        if forbidden_foods:
            prompt += f"\n- 禁止出現的食物：{'、'.join(forbidden_foods)}"
        if hated_foods:
            prompt += f"\n- OWNER 討厭的食物：{'、'.join(hated_foods)}"
        if forbidden_actions:
            prompt += f"\n- 禁止行為：{'、'.join(forbidden_actions)}"
        prompt += (
            "\n回覆中不得直接或間接提及上述內容（包含同義詞或變形）。"
            "若使用者提到，請改用泛稱並禮貌拒絕，避免任何細節延伸。"
        )
    return prompt

def profile_incomplete():
    profile = config.get("user_profile", {})
    return any(
        not str(profile.get(key, "")).strip()
        for key in ["appearance", "personality", "occupation"]
    )

def char_incomplete():
    return any(
        not str(config.get(key, "")).strip()
        for key in ["system_prompt", "roleplay_prompt", "character_prompt", "response_style"]
    )

async def call_api(channel_id, user_text=None, special_instruction=None, author=None):
    if not config["api_key"]: return "⚠️ 請先設定 API Key。"
    if author and author.id == OWNER_ID:
        if profile_incomplete():
            return "⚠️ 主要使用者的外觀、個性或職業尚未設定，請先使用 /set_user 完成設定。"
        if char_incomplete():
            return "⚠️ 角色設定尚未完成，請先使用 /set_char 補齊個性/守則/角色/文風設定。"
    
    endpoint = f"{config['api_url'].rstrip('/')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {config['api_key']}",
        "Content-Type": "application/json"
    }
    system_content = build_system_prompt(channel_id=channel_id, author=author)
    if user_text and _is_song_request(user_text):
        recent_songs = "、".join(song_history[-20:]) if song_history else "（無）"
        system_content += (
            "\n\n【歌曲推薦規則】"
            "\n- 請依照對話情緒與語氣挑選歌曲。"
            "\n- 請避免推薦最近 20 次已推薦的歌曲。"
            f"\n- 最近 20 次推薦清單：{recent_songs}"
            "\n- 請輸出 3 首歌，格式為「歌名 - 歌手」。"
            "\n- 另外輸出 Spotify 與 YouTube Music 的搜尋連結（用歌曲關鍵字即可）。"
            "\n  Spotify：https://open.spotify.com/search/<關鍵字>"
            "\n  YouTube Music：https://music.youtube.com/search?q=<關鍵字>"
        )
    if author:
        profile = get_voice_profile(author.id)
        text_lang = profile.get("text_lang")
        if text_lang:
            system_content += f"\n\n[語言設定] 請用 {text_lang} 回覆。"
    if special_instruction:
        system_content += f"\n\n[系統指令: {special_instruction}]"

    messages = [{"role": "system", "content": system_content}]
    messages += global_history
    if user_text:
        messages.append({"role": "user", "content": user_text})

    body = {"model": config["model"], "messages": messages}
    
    def _cleanup_response_text(text: str) -> str:
        raw = str(text or "")
        if not raw:
            return raw
        lines = [ln.rstrip() for ln in raw.splitlines()]
        cleaned = []
        blank_count = 0
        for ln in lines:
            if ln.strip() == "":
                blank_count += 1
                if blank_count > 1:
                    continue
                cleaned.append("")
                continue
            blank_count = 0
            cleaned.append(ln)
        result = "\n".join(cleaned).strip()
        return result

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(endpoint, headers=headers, json=body, timeout=45) as resp:
                if resp.status != 200:
                    res_text = await resp.text()
                    return f"❌ API 錯誤 ({resp.status}): {res_text[:100]}"
                data = await resp.json()
                content = data["choices"][0]["message"]["content"]
                cleaned = _cleanup_response_text(content)
                if user_text and _is_song_request(user_text):
                    candidates = _extract_song_candidates(cleaned)
                    if candidates:
                        for item in candidates:
                            if item and item not in song_history:
                                song_history.append(item)
                        if len(song_history) > 20:
                            del song_history[:-20]
                        save_runtime_state()
                return cleaned
    except Exception as e:
        return f"❌ 連線失敗: {str(e)}"

async def maybe_send_voice(channel, reply_text: str, author: Optional[discord.User] = None, force: bool = False):
    if not reply_text:
        return
    if author and not is_voice_enabled(author.id):
        return
    if not force and random.random() > VOICE_RANDOM_RATE:
        return
    profile = {}
    if author:
        profile = get_voice_profile(author.id)
    if not profile:
        profile = get_voice_profile(0)
    if not profile:
        return
    target_lang = profile.get("voice_lang") or None
    await send_voice_response(channel, reply_text, profile, target_lang=target_lang)

async def check_if_should_chime(channel_id: int):
    """讓 AI 決定是否要針對目前的對話進行插嘴"""
    if not config["api_key"]: return False, ""
    
    # 取得最近的對話內容作為判斷依據
    history = global_history
    if not history: return False, ""
    
    # 構建判斷用的 Prompt（含發言者資訊）
    history_str = "\n".join([f"{m['role']}: {m['content']}" for m in history[-5:]])
    
    headers = {
        "Authorization": f"Bearer {config['api_key']}",
        "Content-Type": "application/json"
    }
    
    decision_prompt = {
        "model": config["model"],
        "messages": [
            {"role": "system", "content": (
                "你是一個聊天室觀察者。你必須先辨識最後一位人類發言者與目前話題，再決定是否要『主動插嘴』。"
                "只需判斷是否插嘴，不要生成實際回覆內容。"
                "如果值得插嘴（可提供幫助、澄清、或符合人設），請回覆：{\"chime\": true}。"
                "如果不需要你參與，請回覆：{\"chime\": false}。"
                "注意：請只回覆 JSON 格式，不要有其他廢話。"
            )},
            {"role": "user", "content": (
                f"系統人設摘要：{config['system_prompt']}\n"
                f"最近對話摘要：\n{get_recent_speakers_summary(channel_id)}\n\n"
                f"原始對話紀錄：\n{history_str}"
            )}
        ],
        "response_format": { "type": "json_object" } # 確保回傳 JSON
    }

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{config['api_url'].rstrip('/')}/chat/completions", 
                                   headers=headers, json=decision_prompt, timeout=10) as resp:
                data = await resp.json()
                result = json.loads(data["choices"][0]["message"]["content"])
                return result.get("chime", False), ""
    except:
        return False, ""

# ───────── 天氣查詢工具 ─────────
async def fetch_weather_summary(location: str):
    """使用 wttr.in 取得天氣資訊（免金鑰）"""
    query = location.strip()
    if not query:
        return "⚠️ 請提供有效地點。"

    url = f"https://wttr.in/{query}?format=j1"
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=10) as resp:
                if resp.status != 200:
                    return f"❌ 天氣服務錯誤 ({resp.status})，請稍後再試。"
                data = await resp.json()

        current = (data.get("current_condition") or [{}])[0]
        nearest = (data.get("nearest_area") or [{}])[0]
        area = ((nearest.get("areaName") or [{}])[0].get("value") or query)
        region = ((nearest.get("region") or [{}])[0].get("value") or "")
        country = ((nearest.get("country") or [{}])[0].get("value") or "")

        desc = ((current.get("weatherDesc") or [{}])[0].get("value") or "未知")
        temp_c = current.get("temp_C", "-")
        feels_c = current.get("FeelsLikeC", "-")
        humidity = current.get("humidity", "-")
        wind_kph = current.get("windspeedKmph", "-")

        location_display = "、".join([p for p in [area, region, country] if p])
        return (
            f"🌦️ {location_display} 天氣提醒\n"
            f"- 目前天氣：{desc}\n"
            f"- 溫度：{temp_c}°C（體感 {feels_c}°C）\n"
            f"- 濕度：{humidity}%\n"
            f"- 風速：{wind_kph} km/h"
        )
    except Exception as e:
        return f"❌ 無法取得天氣資料：{str(e)}"


async def _send_weather_reminder(channel, location: str) -> str:
    raw_weather = await fetch_weather_summary(location)
    final_text = await build_personalized_weather_text(location, raw_weather, channel_id=channel.id)
    await channel.send(final_text)
    add_to_history(channel.id, "assistant", final_text)
    return final_text


async def _send_meal_reminder(channel, location: str, meal_key: str, update_last_sent: bool = False) -> str:
    suggestion = await generate_dinner_suggestion(location, channel_id=channel.id)
    prefix = {"breakfast": "早餐", "lunch": "午餐", "dinner": "晚餐"}.get(meal_key, "餐點")
    final_text = f"🍽️ {prefix}提醒：{suggestion}"
    await channel.send(final_text)
    add_to_history(channel.id, "assistant", final_text)
    if update_last_sent:
        reminder = config.get("meal_reminder", {})
        last_sent = reminder.get("last_sent")
        if not isinstance(last_sent, dict):
            last_sent = {}
        tz_name = str(reminder.get("timezone", "Asia/Taipei")).strip() or "Asia/Taipei"
        today = datetime.now(ZoneInfo(tz_name)).strftime("%Y-%m-%d")
        last_sent[meal_key] = today
        reminder["last_sent"] = last_sent
        config["meal_reminder"] = reminder
        save_config(config)
    return final_text

def is_valid_hhmm(time_str: str):
    try:
        datetime.strptime(time_str, "%H:%M")
        return True
    except:
        return False

def is_valid_timezone(tz_name: str):
    try:
        ZoneInfo(tz_name)
        return True
    except:
        return False

async def build_personalized_weather_text(location: str, raw_weather: str, channel_id=None):
    """用目前 system_prompt 角色語氣包裝天氣提醒。"""
    if raw_weather.startswith("❌") or raw_weather.startswith("⚠️"):
        return "⚠️ 天氣提醒請求失敗，請稍後再試或使用 /reroll 重試。"

    if not config.get("api_key"):
        return "⚠️ 天氣提醒請求失敗：未設定 API Key。"

    endpoint = f"{config['api_url'].rstrip('/')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {config['api_key']}",
        "Content-Type": "application/json"
    }
    system_content = build_system_prompt(channel_id=channel_id, author=None)
    system_content += (
        "\n\n【任務】"
        "\n你現在要發送『天氣提醒』。"
        "\n請使用目前角色個性與語氣，"
        "內容包含：1) 目前天氣重點 2) 一句貼心的生活建議。"
        "\n請僅依據提供的原始天氣資料，不可捏造數字。"
    )
    async def _call_weather_llm(prompt_text: str) -> str:
        body = {
            "model": config["model"],
            "messages": [
                {"role": "system", "content": prompt_text},
                {"role": "user", "content": f"地點：{location}\n原始天氣資料：\n{raw_weather}"}
            ]
        }
        try:
            print(f"[weather] calling LLM model={config.get('model')} url={config.get('api_url')}")
            async with aiohttp.ClientSession() as session:
                async with session.post(endpoint, headers=headers, json=body, timeout=20) as resp:
                    if resp.status != 200:
                        res_text = await resp.text()
                        return f"⚠️ 天氣提醒生成失敗 ({resp.status}): {res_text[:120]}"
                    data = await resp.json()
                    content = data["choices"][0]["message"]["content"]
                    return str(content or "").strip()
        except Exception as e:
            return f"⚠️ 天氣提醒生成失敗: {str(e)}"

    content = await _call_weather_llm(system_content)
    if content.startswith("⚠️"):
        return content
    if not content:
        return "⚠️ 天氣提醒請求失敗（LLM 回傳空），請使用 /reroll 重試。"
    if _normalize_text(content) == _normalize_text(raw_weather):
        retry_prompt = (
            system_content
            + "\n\n【重要】請不要重複原始天氣資料或其格式，"
            "必須改寫成角色口吻的提醒。"
        )
        retry = await _call_weather_llm(retry_prompt)
        if retry and not retry.startswith("⚠️") and _normalize_text(retry) != _normalize_text(raw_weather):
            return retry
        return "⚠️ 天氣提醒請求失敗（LLM 重複原始格式），請使用 /reroll 重試。"
    return content

# ───────── 晚餐推薦工具 ─────────
async def generate_dinner_suggestion(location: str, channel_id=None):
    if not config.get("api_key"):
        return "⚠️ 餐點提醒請求失敗：未設定 API Key。"

    location = location.strip()
    if not location:
        return "⚠️ 尚未設定所在地點，請先使用 /set_user 設定 location。"

    endpoint = f"{config['api_url'].rstrip('/')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {config['api_key']}",
        "Content-Type": "application/json"
    }

    system_content = build_system_prompt(channel_id=channel_id, author=None)
    system_content += (
        "\n\n【任務】"
        "\n你現在要做『晚餐推薦』。"
        "\n請先為使用者挑選 1 個最適合的餐點關鍵字（例如：拉麵、漢堡、咖哩、便當）。"
        "\n由於無法直接抓取店家，請輸出『UberEats 搜尋連結 + 推薦餐點類型 + 一句理由』即可。"
        "\n搜尋連結格式：https://www.ubereats.com/tw/search?q=<關鍵字>"
        "\n請以角色語氣回覆，簡短自然。"
    )

    body = {
        "model": config["model"],
        "messages": [
            {"role": "system", "content": system_content},
            {"role": "user", "content": f"使用者所在地點：{location}"}
        ]
    }

    try:
        print(f"[meal] calling LLM model={config.get('model')} url={config.get('api_url')}")
        async with aiohttp.ClientSession() as session:
            async with session.post(endpoint, headers=headers, json=body, timeout=20) as resp:
                if resp.status != 200:
                    res_text = await resp.text()
                    return f"⚠️ 餐點提醒請求失敗 ({resp.status}): {res_text[:120]}，請使用 /reroll 重試。"
                data = await resp.json()
                content = data["choices"][0]["message"]["content"]
                if not content:
                    return "⚠️ 餐點提醒請求失敗（LLM 回傳空），請使用 /reroll 重試。"
                return content
    except Exception as e:
        return f"⚠️ 餐點提醒請求失敗: {str(e)}，請使用 /reroll 重試。"

def _get_summary_file_path(date_str: str):
    base_path = str(os.environ.get("GITHUB_SUMMARY_PATH", "summaries/") or "summaries/")
    if not base_path.endswith("/"):
        base_path += "/"
    return f"{base_path}{date_str}.md"

def _get_github_summary_base_path() -> str:
    github_cfg = config.get("github_backup", {}) or {}
    custom_path = str(github_cfg.get("path", "")).strip()
    if custom_path:
        if not custom_path.endswith("/"):
            custom_path += "/"
        return custom_path
    base_path = str(os.environ.get("GITHUB_SUMMARY_PATH", "summaries/") or "summaries/")
    if not base_path.endswith("/"):
        base_path += "/"
    return base_path

async def _generate_daily_summary(date_str: str):
    log_path = os.path.join(CHAT_LOG_DIR, f"{date_str}.jsonl")
    if not os.path.exists(log_path):
        return ""

    lines = []
    entries = []
    try:
        with open(log_path, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    item = json.loads(line.strip())
                    role = item.get("role")
                    content = item.get("content", "")
                    if role and content:
                        lines.append(f"{role}: {content}")
                        entries.append({
                            "ts": item.get("ts", ""),
                            "role": role,
                            "content": content,
                        })
                except:
                    continue
    except:
        return ""

    if not lines:
        return ""

    if not config.get("api_key"):
        return ""

    endpoint = f"{config['api_url'].rstrip('/')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {config['api_key']}",
        "Content-Type": "application/json"
    }

    system_content = build_system_prompt(channel_id=None, author=None)
    system_content += (
        "\n\n【任務】"
        "\n請將以下聊天室紀錄整理成每日總結。"
        "\n要求：1) 100~200 字 2) 重點條列 3) 不洩露敏感資訊 4) 不要逐字重複對話。"
    )

    async def _generate_summary_table(items: list[dict]) -> str:
        if not items:
            return ""
        table_prompt = (
            "你是一個摘要助手。請根據聊天紀錄挑出 5~10 個最重要事件，"
            "輸出 Markdown 表格，欄位為：時間、重要事件。"
            "時間請用 24 小時 HH:MM，若無法判斷請用 '--:--'。"
            "只輸出表格，不要其他文字。"
        )
        table_body = {
            "model": config["model"],
            "messages": [
                {"role": "system", "content": table_prompt},
                {"role": "user", "content": json.dumps(items[-300:], ensure_ascii=False)}
            ]
        }
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(endpoint, headers=headers, json=table_body, timeout=30) as resp:
                    if resp.status != 200:
                        return ""
                    data = await resp.json()
                    return str(data["choices"][0]["message"]["content"] or "").strip()
        except:
            return ""

    table_md = await _generate_summary_table(entries)

    body = {
        "model": config["model"],
        "messages": [
            {"role": "system", "content": system_content},
            {"role": "user", "content": "\n".join(lines[-300:])}
        ]
    }

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(endpoint, headers=headers, json=body, timeout=30) as resp:
                if resp.status != 200:
                    return ""
                data = await resp.json()
                summary_text = data["choices"][0]["message"]["content"].strip()
                if table_md:
                    return "\n".join([
                        f"# {date_str} 摘要",
                        "\n## 重要事件表",
                        table_md,
                        "\n## 總結",
                        summary_text
                    ])
                return summary_text
    except:
        return ""

async def _push_summary_to_github(date_str: str, content: str):
    github_cfg = config.get("github_backup", {}) or {}
    repo = str(github_cfg.get("repo") or os.environ.get("GITHUB_REPO", "")).strip()
    branch = str(github_cfg.get("branch") or os.environ.get("GITHUB_BRANCH", "main")).strip() or "main"
    token = str(github_cfg.get("token") or os.environ.get("GITHUB_TOKEN", "")).strip()

    if not repo or not token:
        return False, "⚠️ GitHub 未設定，已略過推送。"

    path = f"{_get_github_summary_base_path()}{date_str}.md"
    custom_path = str(github_cfg.get("path", "")).strip()
    if custom_path:
        if not custom_path.endswith("/"):
            custom_path += "/"
        path = f"{custom_path}{date_str}.md"
    url = f"https://api.github.com/repos/{repo}/contents/{path}"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github+json"
    }

    # 取得既有檔案的 sha（若存在）
    sha = None
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers, params={"ref": branch}, timeout=15) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    sha = data.get("sha")
    except:
        sha = None

    payload = {
        "message": f"daily summary {date_str}",
        "content": base64.b64encode(content.encode("utf-8")).decode("utf-8"),
        "branch": branch
    }
    if sha:
        payload["sha"] = sha

    try:
        async with aiohttp.ClientSession() as session:
            async with session.put(url, headers=headers, json=payload, timeout=20) as resp:
                if resp.status in (200, 201):
                    return True, "✅ 已推送每日總結到 GitHub。"
                error_text = await resp.text()
                return False, f"❌ GitHub 上傳失敗 ({resp.status}): {error_text[:120]}"
    except Exception as e:
        return False, f"❌ GitHub 連線失敗: {str(e)}"

async def daily_summary_checker():
    await client.wait_until_ready()
    while not client.is_closed():
        await asyncio.sleep(20)

        schedule = config.get("summary_schedule", {})
        if not schedule.get("enabled", False):
            continue

        remind_time = str(schedule.get("time", "")).strip()
        tz_name = str(schedule.get("timezone", "")).strip()

        if not remind_time or not is_valid_hhmm(remind_time) or not is_valid_timezone(tz_name):
            continue

        now_local = datetime.now(ZoneInfo(tz_name))
        if now_local.strftime("%H:%M") != remind_time:
            continue

        today = now_local.strftime("%Y-%m-%d")
        if schedule.get("last_sent_date") == today:
            continue

        summary = await _generate_daily_summary(today)
        if summary:
            ok, _ = await _push_summary_to_github(today, summary)
            if ok:
                config.setdefault("summary_schedule", {})["last_sent_date"] = today
                save_config(config)

async def memory_sync_worker():
    await client.wait_until_ready()
    global long_term_memory
    while not client.is_closed():
        await asyncio.sleep(30)
        sync_cfg = config.get("memory_sync", {}) or {}
        if not sync_cfg.get("enabled", False):
            continue
        tz_name = str(sync_cfg.get("timezone", "Asia/Taipei")).strip() or "Asia/Taipei"
        try:
            tz = ZoneInfo(tz_name)
        except Exception:
            tz = ZoneInfo("Asia/Taipei")
        today = datetime.now(tz).strftime("%Y-%m-%d")
        if sync_cfg.get("last_loaded_date") == today and long_term_memory:
            continue
        long_term_memory = await _load_github_summaries()
        sync_cfg["last_loaded_date"] = today
        config["memory_sync"] = sync_cfg
        save_config(config)

async def weather_reminder_checker():
    """每天定時推送一次天氣提醒到指定頻道。"""
    await client.wait_until_ready()
    while not client.is_closed():
        await asyncio.sleep(20)

        reminder = config.get("weather_reminder", {})
        if not reminder.get("enabled", False):
            continue

        location = str(reminder.get("location", "")).strip()
        remind_time = str(reminder.get("time", "")).strip()
        tz_name = str(reminder.get("timezone", "")).strip()
        channel_id = int(reminder.get("channel_id", 0) or 0)

        if not location or not remind_time or not tz_name or channel_id <= 0:
            continue
        if not is_valid_hhmm(remind_time) or not is_valid_timezone(tz_name):
            continue

        now_local = datetime.now(ZoneInfo(tz_name))
        if now_local.strftime("%H:%M") != remind_time:
            continue

        today = now_local.strftime("%Y-%m-%d")
        if reminder.get("last_sent_date") == today:
            continue

        channel = client.get_channel(channel_id)
        if channel is None:
            try:
                channel = await client.fetch_channel(channel_id)
            except:
                continue

        try:
            final_text = await _send_weather_reminder(channel, location)
            if not final_text:
                continue
            config.setdefault("weather_reminder", {})["last_sent_date"] = today
            save_config(config)
        except:
            pass


async def meal_reminder_checker():
    """每天定時推送三餐提醒與推薦到指定頻道。"""
    await client.wait_until_ready()
    while not client.is_closed():
        await asyncio.sleep(20)

        reminder = config.get("meal_reminder", {})
        if not reminder.get("enabled", False):
            continue

        location = str(reminder.get("location", "")) or str(config.get("dinner_location", ""))
        location = location.strip()
        tz_name = str(reminder.get("timezone", "")).strip()
        channel_id = int(reminder.get("channel_id", 0) or 0)

        if not location or not tz_name or channel_id <= 0:
            continue
        if not is_valid_timezone(tz_name):
            continue

        now_local = datetime.now(ZoneInfo(tz_name))
        current_hhmm = now_local.strftime("%H:%M")
        today = now_local.strftime("%Y-%m-%d")

        slots = {
            "breakfast": str(reminder.get("breakfast_time", "")).strip(),
            "lunch": str(reminder.get("lunch_time", "")).strip(),
            "dinner": str(reminder.get("dinner_time", "")).strip(),
        }

        last_sent = reminder.get("last_sent")
        if not isinstance(last_sent, dict):
            last_sent = {}

        target_meal = None
        for meal_key, meal_time in slots.items():
            if not meal_time or not is_valid_hhmm(meal_time):
                continue
            if current_hhmm == meal_time:
                if last_sent.get(meal_key) == today:
                    target_meal = None
                    break
                target_meal = meal_key
                break

        if not target_meal:
            continue

        channel = client.get_channel(channel_id)
        if channel is None:
            try:
                channel = await client.fetch_channel(channel_id)
            except:
                continue

        try:
            sent = await _send_meal_reminder(channel, location, target_meal, update_last_sent=True)
            if not sent:
                continue
            last_sent[target_meal] = today
            reminder["last_sent"] = last_sent
            config["meal_reminder"] = reminder
            save_config(config)
        except:
            pass


async def todo_reminder_checker():
    """每天定時推送待辦事項提醒到指定頻道。"""
    await client.wait_until_ready()
    while not client.is_closed():
        await asyncio.sleep(20)

        reminder = config.get("todo_reminder", {})
        if not reminder.get("enabled", False):
            continue

        content = str(reminder.get("content", "")).strip()
        remind_time = str(reminder.get("time", "")).strip()
        tz_name = str(reminder.get("timezone", "")).strip()
        channel_id = int(reminder.get("channel_id", 0) or 0)

        if not content or not remind_time or not tz_name or channel_id <= 0:
            continue
        if not is_valid_hhmm(remind_time) or not is_valid_timezone(tz_name):
            continue

        now_local = datetime.now(ZoneInfo(tz_name))
        if now_local.strftime("%H:%M") != remind_time:
            continue

        today = now_local.strftime("%Y-%m-%d")
        if reminder.get("last_sent_date") == today:
            continue

        channel = client.get_channel(channel_id)
        if channel is None:
            try:
                channel = await client.fetch_channel(channel_id)
            except:
                continue

        try:
            prompt = (
                "你要用角色口氣提醒使用者今天的待辦事項。"
                "請以親切自然的方式開場，並列出待辦清單。"
                "回覆不要過長，但要清楚。"
            )
            reply = await call_api(
                channel.id,
                user_text=f"今日待辦清單：\n{content}",
                special_instruction=prompt
            )
            await channel.send(reply)
            add_to_history(channel.id, "assistant", reply)
            config.setdefault("todo_reminder", {})["last_sent_date"] = today
            save_config(config)
        except:
            pass

# ───────── 背景任務：語音自動重連 ─────────
async def voice_reconnect_watcher():
    """監控語音連線，若意外斷線則自動重連。"""
    await client.wait_until_ready()
    while not client.is_closed():
        await asyncio.sleep(30)
        try:
            cfg = get_voice_listen_config()
            if not cfg.get("enabled"):
                continue
            voice_id = int(cfg.get("voice_channel_id", 0) or 0)
            reply_id = int(cfg.get("reply_channel_id", 0) or 0)
            if not voice_id or not reply_id:
                continue
            vc = client.voice_client
            if vc is None or not vc.is_connected():
                print("[voice] 偵測到斷線，嘗試重連...")
                try:
                    await _start_voice_listen(voice_id, reply_id)
                    print("[voice] 重連成功")
                except Exception as e:
                    print(f"[voice] 重連失敗：{type(e).__name__}: {e}")
        except Exception as e:
            print(f"[voice_reconnect_watcher] 例外：{type(e).__name__}: {e}")

# ───────── 背景任務：超時主動說話 ─────────
async def timeout_checker():
    await client.wait_until_ready()
    while not client.is_closed():
        await asyncio.sleep(60)
        now = time.time()
        timeout_sec = config["timeout_minutes"] * 60

        for channel_id, last_time in list(channel_last_time.items()):
            if not _is_timeout_channel_allowed(channel_id):
                continue
            if now - last_time >= timeout_sec:
                channel = client.get_channel(channel_id)
                if channel:
                    try:
                        reply = await call_api(
                            channel_id,
                            special_instruction=(
                                "目前頻道沉默中。請先確認最近對話中的最後發言者身分，"
                                "再以你的人設自然地說一句破冰話；若無明確對象，"
                                "請用中性、非指定對象的方式開場。"
                            )
                        )
                        await channel.send(reply)
                        add_to_history(channel_id, "assistant", reply)
                    except: pass
                channel_last_time[channel_id] = now
                save_runtime_state()

# ───────── Discord 事件 ─────────
@client.event
async def on_ready():
    print(f"✅ Bot 已在 Railway 上線：{client.user}")

@client.event
async def on_message(message):
    if message.author == client.user: return

    # 私訊（DM）：僅回覆 OWNER
    if isinstance(message.channel, discord.DMChannel):
        if message.author.id != OWNER_ID:
            return
        display_text = f"{message.author.display_name}: {message.content}"
        add_to_history(message.channel.id, "user", display_text)
        channel_last_time[message.channel.id] = time.time()
        save_runtime_state()
        async with message.channel.typing():
            reply = await call_api(
                message.channel.id,
                special_instruction=(
                    f"你正在私訊回覆 {message.author.display_name}。"
                    "請維持人設並簡短自然。"
                ),
                author=message.author
            )
            await message.reply(reply)
            await maybe_send_voice(message.channel, reply, author=message.author)
            add_to_history(message.channel.id, "assistant", reply)
        return
    
    # 紀錄訊息（包含發言者名稱，這能幫助 AI 識別誰是誰）
    display_text = f"{message.author.display_name}: {message.content}"
    add_to_history(message.channel.id, "user", display_text)
    channel_last_time[message.channel.id] = time.time()
    save_runtime_state()

    # 情況 A：被標記 (@Bot) -> 必定回覆
    if client.user in message.mentions:
        image_attachments = [a for a in message.attachments if _is_image_attachment(a)]
        if image_attachments:
            vision_text = await _describe_images_with_vision(image_attachments)
            if vision_text:
                await message.reply(f"🖼️ 圖片描述：{vision_text}")
                return
        if await _should_block_nsfw(message.channel, message.content):
            await message.reply("⚠️ 此頻道人數較多，為避免隱私外洩，無法討論 NSFW 話題。請改用私密頻道。")
            return
        async with message.channel.typing():
            reply = await call_api(
                message.channel.id,
                special_instruction=(
                    f"你正在回覆被標記訊息。最後發言者是 {message.author.display_name}，"
                    "請以此人為對象並嚴格遵守人設。"
                ),
                author=message.author
            )
            await message.reply(reply)
            await maybe_send_voice(message.channel, reply, author=message.author)
            add_to_history(message.channel.id, "assistant", reply)
        return

    # 情況 B：沒被標記 -> 判斷是否要自動插嘴
    if _is_chime_channel_allowed(message.channel.id):
        emoji = await _select_reaction_emoji(message.content)
        if emoji:
            try:
                await message.add_reaction(emoji)
            except Exception:
                pass
        name_triggered = _is_name_triggered(message.content)
        if not config.get("auto_chime_in", True) and not name_triggered:
            return

        # 隨機等待 1~3 秒，模擬真人在看訊息的感覺
        await asyncio.sleep(2)

        chime_prob = float(config.get("chime_probability", 0.35) or 0)
        if not name_triggered:
            if chime_prob <= 0 or random.random() > chime_prob:
                return

        if name_triggered:
            should_chime = True
        elif chime_prob >= 1:
            should_chime = True
        else:
            retries = int(config.get("chime_decision_retries", 1) or 1)
            retries = max(1, min(3, retries))
            should_chime = False
            for _ in range(retries):
                should_chime, _ = await check_if_should_chime(message.channel.id)
                if should_chime:
                    break

        if should_chime:
            if await _should_block_nsfw(message.channel, message.content):
                return
            async with message.channel.typing():
                chime_reply = await call_api(
                    message.channel.id,
                    special_instruction=(
                        f"你決定要主動插嘴。請先確認最後發言者是 {message.author.display_name}，"
                        "再依照人設給出簡短、自然且不搶戲的一句話。"
                    ),
                    author=message.author
                )
                await message.channel.send(chime_reply)
                await maybe_send_voice(message.channel, chime_reply, author=message.author)
                add_to_history(message.channel.id, "assistant", chime_reply)
# ───────── 斜線指令面板 ─────────

@client.tree.command(name="reroll", description="重新生成上一則回應")
async def reroll(interaction: discord.Interaction):
    if not is_owner(interaction): return
    await interaction.response.defer(ephemeral=False)

    last_user = _get_last_user_message(interaction.channel_id)
    if not last_user:
        await interaction.followup.send("⚠️ 找不到上一則使用者訊息，無法 reroll。")
        return

    removed = _remove_last_assistant_message(interaction.channel_id)
    if not removed:
        await interaction.followup.send("⚠️ 找不到上一則回應，無法 reroll。")
        return
    _remove_last_assistant_log(interaction.channel_id)

    async with interaction.channel.typing():
        reply = await call_api(
            interaction.channel_id,
            user_text=last_user,
            special_instruction="使用者要求重新生成回應，請避免與上一版本重複。",
            author=interaction.user
        )
        await interaction.followup.send(reply)
        await maybe_send_voice(interaction.channel, reply, author=interaction.user)
        add_to_history(interaction.channel_id, "assistant", reply)


@client.tree.command(name="reroll_weather", description="重新生成今日天氣提醒")
async def reroll_weather(interaction: discord.Interaction):
    if not is_owner(interaction):
        return
    await interaction.response.defer(ephemeral=True)
    reminder = config.get("weather_reminder", {})
    if not reminder.get("enabled", False):
        await interaction.followup.send("⚠️ 天氣提醒尚未啟用。", ephemeral=True)
        return
    location = str(reminder.get("location", "")).strip()
    channel_id = int(reminder.get("channel_id", 0) or 0)
    if not location or channel_id <= 0:
        await interaction.followup.send("⚠️ 天氣提醒設定不完整，請先用 /set_weather_reminder 設定。", ephemeral=True)
        return
    channel = client.get_channel(channel_id)
    if channel is None:
        try:
            channel = await client.fetch_channel(channel_id)
        except Exception:
            await interaction.followup.send("⚠️ 找不到天氣提醒頻道，或 Bot 無權限。", ephemeral=True)
            return
    try:
        await _send_weather_reminder(channel, location)
        await interaction.followup.send("✅ 已重新推送天氣提醒。", ephemeral=True)
    except Exception as e:
        await interaction.followup.send(f"⚠️ 天氣提醒重送失敗：{type(e).__name__}: {e}", ephemeral=True)


@client.tree.command(name="reroll_meal", description="重新生成餐點提醒（早餐/午餐/晚餐）")
@app_commands.choices(
    meal=[
        app_commands.Choice(name="breakfast", value="breakfast"),
        app_commands.Choice(name="lunch", value="lunch"),
        app_commands.Choice(name="dinner", value="dinner"),
    ]
)
async def reroll_meal(
    interaction: discord.Interaction,
    meal: app_commands.Choice[str]
):
    if not is_owner(interaction):
        return
    await interaction.response.defer(ephemeral=True)
    reminder = config.get("meal_reminder", {})
    if not reminder.get("enabled", False):
        await interaction.followup.send("⚠️ 三餐提醒尚未啟用。", ephemeral=True)
        return
    location = str(reminder.get("location", "")) or str(config.get("dinner_location", ""))
    location = location.strip()
    channel_id = int(reminder.get("channel_id", 0) or 0)
    if not location or channel_id <= 0:
        await interaction.followup.send("⚠️ 三餐提醒設定不完整，請先用 /set_remind 設定。", ephemeral=True)
        return
    channel = client.get_channel(channel_id)
    if channel is None:
        try:
            channel = await client.fetch_channel(channel_id)
        except Exception:
            await interaction.followup.send("⚠️ 找不到三餐提醒頻道，或 Bot 無權限。", ephemeral=True)
            return
    try:
        await _send_meal_reminder(channel, location, meal.value, update_last_sent=False)
        label = {"breakfast": "早餐", "lunch": "午餐", "dinner": "晚餐"}.get(meal.value, meal.value)
        await interaction.followup.send(f"✅ 已重新推送 {label} 提醒。", ephemeral=True)
    except Exception as e:
        await interaction.followup.send(f"⚠️ 餐點提醒重送失敗：{type(e).__name__}: {e}", ephemeral=True)


@client.tree.command(name="config", description="查看機器人設定（可指定分類/項目）")
@app_commands.choices(
    category=[
        app_commands.Choice(name="basic", value="basic"),
        app_commands.Choice(name="prompt", value="prompt"),
        app_commands.Choice(name="owner", value="owner"),
        app_commands.Choice(name="dinner", value="dinner"),
        app_commands.Choice(name="chime", value="chime"),
        app_commands.Choice(name="weather", value="weather"),
        app_commands.Choice(name="forbidden", value="forbidden"),
        app_commands.Choice(name="summary", value="summary")
    ]
)
async def slash_config(
    interaction: discord.Interaction,
    category: Optional[app_commands.Choice[str]] = None,
    item: Optional[str] = None
):
    if not is_owner(interaction): return

    forbidden_words = config.get("forbidden_words", []) or []
    forbidden_foods = config.get("forbidden_foods", []) or []
    hated_foods = config.get("hated_foods", []) or []
    forbidden_actions = config.get("forbidden_actions", []) or []
    forbidden_words_str = ", ".join(forbidden_words) if forbidden_words else "無"
    forbidden_foods_str = ", ".join(forbidden_foods) if forbidden_foods else "無"
    hated_foods_str = ", ".join(hated_foods) if hated_foods else "無"
    forbidden_actions_str = ", ".join(forbidden_actions) if forbidden_actions else "無"

    profile = config.get("user_profile", {})
    reminder = config.get("weather_reminder", {})
    appearance = profile.get("appearance", "") or "未設定"
    personality = profile.get("personality", "") or "未設定"
    occupation = profile.get("occupation", "") or "未設定"
    weather_enabled = "開啟" if reminder.get("enabled") else "關閉"
    weather_location = reminder.get("location", "") or "未設定"
    weather_time = reminder.get("time", "") or "未設定"
    weather_channel = reminder.get("channel_id", 0) or "未設定"
    weather_tz = reminder.get("timezone", "") or "未設定"

    dinner_location = config.get("dinner_location", "") or "未設定"
    chime_channels = config.get("chime_in_channels", [])
    if isinstance(chime_channels, list) and chime_channels:
        chime_channels_str = ", ".join([str(c) for c in chime_channels])
    else:
        chime_channels_str = "未設定(不限)"
    chime_retries = config.get("chime_decision_retries", 1) or 1

    roleplay_prompt = config.get("roleplay_prompt", "") or "未設定"
    character_prompt = config.get("character_prompt", "") or "未設定"
    response_style = config.get("response_style", "") or "未設定"
    bot_name = config.get("bot_name", "") or "未設定"
    bot_nickname = config.get("bot_nickname", "") or "未設定"

    owner_profile = config.get("owner_profile", {})
    owner_name = owner_profile.get("name", "") or "未設定"
    owner_id_text = owner_profile.get("id", "") or "未設定"
    owner_title = owner_profile.get("title", "") or "未設定"
    owner_pronoun = owner_profile.get("pronoun", "") or "未設定"
    owner_nickname = owner_profile.get("nickname", "") or "未設定"

    summary_cfg = config.get("summary_schedule", {})
    summary_enabled = "開啟" if summary_cfg.get("enabled") else "關閉"
    summary_time = summary_cfg.get("time", "") or "未設定"
    summary_tz = summary_cfg.get("timezone", "") or "未設定"

    voice_default = config.get("voice_default", {})
    voice_sample_id = voice_default.get("sample_id", "") or "未設定"
    voice_text_lang = voice_default.get("text_lang", "") or "未設定"
    voice_voice_lang = voice_default.get("voice_lang", "") or "未設定"

    sections = {
        "basic": {
            "title": "🔧 基本設定",
            "fields": {
                "api_url": ("API URL", config.get("api_url", "")),
                "model": ("模型", config.get("model", "")),
                "system_prompt": ("個性", config.get("system_prompt", "")),
                "response_style": ("回應文風", response_style)
            }
        },
        "prompt": {
            "title": "🧩 Prompt 設定",
            "fields": {
                "roleplay_prompt": ("Roleplay 守則", roleplay_prompt),
                "character_prompt": ("角色設定", character_prompt),
                "bot_name": ("Bot 名字", bot_name),
                "bot_nickname": ("Bot 暱稱", bot_nickname)
            }
        },
        "owner": {
            "title": "🧑‍🤝‍🧑 Owner 設定",
            "fields": {
                "owner_name": ("Owner 名字", owner_name),
                "owner_id": ("Owner ID", owner_id_text),
                "owner_title": ("Owner 稱呼", owner_title),
                "owner_pronoun": ("Owner 代詞", owner_pronoun),
                "owner_nickname": ("Owner 暱稱", owner_nickname)
            }
        },
        "dinner": {
            "title": "🍽️ 晚餐推薦",
            "fields": {
                "dinner_location": ("晚餐推薦地點", dinner_location)
            }
        },
        "chime": {
            "title": "💬 插嘴/破冰",
            "fields": {
                "chime_channels": ("可插嘴/破冰頻道", chime_channels_str),
                "chime_retries": ("AI 判斷重試次數", chime_retries)
            }
        },
        "weather": {
            "title": "🌦️ 天氣提醒",
            "fields": {
                "weather_enabled": ("天氣提醒", weather_enabled),
                "weather_location": ("提醒地點", weather_location),
                "weather_time": ("提醒時間", weather_time),
                "weather_channel": ("提醒頻道ID", weather_channel),
                "weather_tz": ("提醒時區", weather_tz)
            }
        },
        "forbidden": {
            "title": "🚫 禁止清單",
            "fields": {
                "forbidden_words": ("禁止詞彙", forbidden_words_str),
                "forbidden_foods": ("禁止出現的食物", forbidden_foods_str),
                "hated_foods": ("OWNER 討厭的食物", hated_foods_str),
                "forbidden_actions": ("禁止行為", forbidden_actions_str)
            }
        },
        "summary": {
            "title": "📝 每日總結",
            "fields": {
                "summary_enabled": ("每日總結", summary_enabled),
                "summary_time": ("總結時間", summary_time),
                "summary_tz": ("總結時區", summary_tz)
            }
        },
        "voice": {
            "title": "🔊 語音設定",
            "fields": {
                "voice_sample_id": ("Voice Sample ID", voice_sample_id),
                "voice_text_lang": ("Text Language", voice_text_lang),
                "voice_voice_lang": ("Voice Language", voice_voice_lang)
            }
        }
    }

    if category and category.value not in sections:
        await interaction.response.send_message("⚠️ 找不到該分類。", ephemeral=True)
        return

    selected = sections[category.value] if category else None
    if item and selected:
        if item not in selected["fields"]:
            await interaction.response.send_message("⚠️ 找不到該設定項目。", ephemeral=True)
            return
        title = selected["title"]
        field_name, field_value = selected["fields"][item]
        embed = discord.Embed(title=title)
        embed.add_field(name=field_name, value=field_value, inline=False)
        await interaction.response.send_message(embed=embed, ephemeral=True)
        return

    if selected:
        embed = discord.Embed(title=selected["title"])
        for _, (fname, fvalue) in selected["fields"].items():
            embed.add_field(name=fname, value=fvalue, inline=False)
        await interaction.response.send_message(embed=embed, ephemeral=True)
        return

    embed = discord.Embed(title="⚙️ 機器人設定總覽")
    for sec in sections.values():
        for _, (fname, fvalue) in sec["fields"].items():
            embed.add_field(name=fname, value=fvalue, inline=False)
    await interaction.response.send_message(embed=embed, ephemeral=True)


@client.tree.command(name="sync", description="強制同步指令選單")
async def sync(interaction: discord.Interaction):
    if not is_owner(interaction): return
    await interaction.response.defer(ephemeral=True)
    await client.tree.sync()
    await interaction.followup.send("🔄 指令已同步，請重啟 Discord 查看。", ephemeral=True)


# 自動補完模型清單
async def model_autocomplete(interaction: discord.Interaction, current: str):
    models = await fetch_models()
    keyword = str(current or "").lower()
    return [discord.OptionChoice(name=m, value=m) for m in models if keyword in m.lower()][:25]

@client.tree.command(name="set_api", description="設定 API URL / Key / 模型")
async def api(
    interaction: discord.Interaction,
    url: Optional[str] = None,
    key: Optional[str] = None,
    model: Optional[str] = None
):
    if not is_owner(interaction):
        return

    if not url and not key and not model:
        await interaction.response.send_message("⚠️ 請至少提供 url/key/model 其中一項。", ephemeral=True)
        return

    updated = []
    if url:
        config["api_url"] = url
        updated.append(f"URL：`{url}`")
    if key:
        config["api_key"] = key
        updated.append("Key：已更新")
    if model:
        config["model"] = model
        updated.append(f"模型：`{model}`")

    save_config(config)
    await interaction.response.send_message("✅ API 設定已更新：" + "、".join(updated), ephemeral=True)


@client.tree.command(name="list_models", description="列出可用模型清單")
async def list_models(interaction: discord.Interaction):
    if not is_owner(interaction):
        return
    await interaction.response.defer(ephemeral=True)
    models = await fetch_models()
    if not models:
        await interaction.followup.send("⚠️ 無法取得模型清單，請確認 API URL/Key。", ephemeral=True)
        return
    preview = "\n".join(models[:50])
    await interaction.followup.send(f"✅ 取得模型 {len(models)} 筆：\n```\n{preview}\n```", ephemeral=True)

@client.tree.command(name="set_char", description="設定角色/Owner/回應文風")
async def set_char(
    interaction: discord.Interaction,
    rule: Optional[str] = None,
    char: Optional[str] = None,
    style: Optional[str] = None,
    bot_name: Optional[str] = None,
    bot_nickname: Optional[str] = None,
    owner_name: Optional[str] = None,
    owner_id: Optional[str] = None,
    owner_title: Optional[str] = None,
    owner_pronoun: Optional[str] = None,
    owner_nickname: Optional[str] = None
):
    if not is_owner(interaction): return

    updated = False
    if rule is not None:
        config["roleplay_prompt"] = rule
        updated = True
    if char is not None:
        config["character_prompt"] = char
        updated = True
    if style is not None:
        config["response_style"] = style
        updated = True

    if bot_name is not None:
        config["bot_name"] = bot_name
        updated = True
    if bot_nickname is not None:
        config["bot_nickname"] = bot_nickname
        updated = True

    owner_profile = config.get("owner_profile", {})
    if owner_name is not None:
        owner_profile["name"] = owner_name
        updated = True
    if owner_id is not None:
        owner_profile["id"] = owner_id
        updated = True
    if owner_title is not None:
        owner_profile["title"] = owner_title
        updated = True
    if owner_pronoun is not None:
        owner_profile["pronoun"] = owner_pronoun
        updated = True
    if owner_nickname is not None:
        owner_profile["nickname"] = owner_nickname
        updated = True
    config["owner_profile"] = owner_profile

    if not updated:
        await interaction.response.send_message("⚠️ 請至少提供任一欄位（rule/char/style/bot_name/bot_nickname/owner_*）。", ephemeral=True)
        return

    save_config(config)
    await interaction.response.send_message("✅ 角色設定已更新！", ephemeral=True)


async def _chime_channel_autocomplete(
    interaction: discord.Interaction,
    current: str,
):
    channels = config.get("chime_in_channels", [])
    if not isinstance(channels, list):
        return []
    results = []
    keyword = str(current or "").strip().lower()
    for raw_id in channels:
        try:
            channel_id = int(raw_id)
        except Exception:
            continue
        channel = client.get_channel(channel_id)
        name = channel.name if channel else f"ID {channel_id}"
        label = f"{name} ({channel_id})"
        if keyword and keyword not in label.lower():
            continue
        results.append(app_commands.Choice(name=label[:100], value=str(channel_id)))
        if len(results) >= 25:
            break
    return results


@client.tree.command(name="set_chime_channels", description="新增/移除/清空可插嘴/破冰頻道")
@app_commands.autocomplete(channel_id=_chime_channel_autocomplete)
async def set_chime_channels(
    interaction: discord.Interaction,
    add_channel_id: Optional[str] = None,
    remove_channel_id: Optional[str] = None,
    clear: Optional[bool] = None,
    channel_id: Optional[str] = None,
):
    if not is_owner(interaction):
        return

    if clear:
        config["chime_in_channels"] = []
        save_config(config)
        await interaction.response.send_message("✅ 已清空可插嘴/破冰頻道清單（不限）。", ephemeral=True)
        return

    target_raw = add_channel_id or remove_channel_id or channel_id
    parsed_channel_id = _parse_channel_id(str(target_raw))
    if parsed_channel_id is None:
        await interaction.response.send_message("⚠️ 請輸入有效頻道 ID（數字或 #頻道）。", ephemeral=True)
        return

    channel = client.get_channel(parsed_channel_id)
    if channel is None:
        try:
            channel = await client.fetch_channel(parsed_channel_id)
        except:
            channel = None

    chime_channels = config.get("chime_in_channels", [])
    if not isinstance(chime_channels, list):
        chime_channels = []

    if add_channel_id or (target_raw and not remove_channel_id):
        if int(parsed_channel_id) not in [int(c) for c in chime_channels]:
            chime_channels.append(int(parsed_channel_id))
            config["chime_in_channels"] = chime_channels
            save_config(config)
        label = f"{channel.name} ({parsed_channel_id})" if channel else str(parsed_channel_id)
        await interaction.response.send_message(f"✅ 已加入可插嘴/破冰頻道：`{label}`", ephemeral=True)
        return

    if remove_channel_id:
        filtered = [int(c) for c in chime_channels if int(c) != int(parsed_channel_id)]
        config["chime_in_channels"] = filtered
        save_config(config)
        label = f"{channel.name} ({parsed_channel_id})" if channel else str(parsed_channel_id)
        await interaction.response.send_message(f"✅ 已移除可插嘴/破冰頻道：`{label}`", ephemeral=True)
        return

    await interaction.response.send_message("⚠️ 請提供 add_channel_id/remove_channel_id 或 clear=true。", ephemeral=True)


@client.tree.command(name="set_chime_rate", description="設定插嘴觸發機率 (0~1)")
async def set_chime_rate(
    interaction: discord.Interaction,
    rate: float
):
    if not is_owner(interaction):
        return
    if rate < 0 or rate > 1:
        await interaction.response.send_message("⚠️ rate 必須在 0~1 之間。", ephemeral=True)
        return
    config["chime_probability"] = rate
    save_config(config)
    await interaction.response.send_message(f"✅ 插嘴機率已設定為 `{rate}`。", ephemeral=True)


@client.tree.command(name="set_chime_retries", description="設定 AI 插嘴判斷重試次數 (1~3)")
async def set_chime_retries(
    interaction: discord.Interaction,
    retries: int
):
    if not is_owner(interaction):
        return
    if retries < 1 or retries > 3:
        await interaction.response.send_message("⚠️ retries 必須在 1~3 之間。", ephemeral=True)
        return
    config["chime_decision_retries"] = int(retries)
    save_config(config)
    await interaction.response.send_message(f"✅ AI 判斷重試次數已設定為 `{retries}`。", ephemeral=True)


@client.tree.command(name="set_weather_reminder", description="設定/關閉每日天氣提醒")
async def set_weather_reminder(
    interaction: discord.Interaction,
    enabled: Optional[bool] = None,
    location: Optional[str] = None,
    time_str: Optional[str] = None,
    channel_id: Optional[str] = None,
    tz_name: Optional[str] = None,
):
    if not is_owner(interaction):
        return

    if enabled is False:
        config["weather_reminder"] = {
            "enabled": False,
            "location": "",
            "time": "",
            "channel_id": 0,
            "timezone": "Asia/Taipei",
            "last_sent_date": ""
        }
        save_config(config)
        await interaction.response.send_message("✅ 已關閉每日天氣提醒。", ephemeral=True)
        return

    if not location or not time_str or not channel_id or not tz_name:
        await interaction.response.send_message(
            "⚠️ 請提供 location、time、channel_id、tz_name。",
            ephemeral=True
        )
        return

    if not is_valid_hhmm(time_str):
        await interaction.response.send_message("⚠️ 時間格式錯誤，請使用 HH:MM（24 小時制），例如 07:30。", ephemeral=True)
        return

    if not is_valid_timezone(tz_name):
        await interaction.response.send_message("⚠️ 時區名稱錯誤，例如 Asia/Taipei。", ephemeral=True)
        return

    parsed_channel_id = _parse_channel_id(str(channel_id))
    if parsed_channel_id is None:
        await interaction.response.send_message("⚠️ 頻道 ID 格式錯誤，請輸入數字或 #頻道。", ephemeral=True)
        return

    channel = client.get_channel(parsed_channel_id)
    if channel is None:
        try:
            channel = await client.fetch_channel(parsed_channel_id)
        except:
            await interaction.response.send_message("⚠️ 找不到該頻道 ID，或 Bot 沒有權限存取該頻道。", ephemeral=True)
            return

    config["weather_reminder"] = {
        "enabled": True,
        "location": location.strip(),
        "time": time_str.strip(),
        "channel_id": int(channel.id),
        "timezone": tz_name.strip(),
        "last_sent_date": ""
    }
    save_config(config)
    await interaction.response.send_message(
        f"✅ 已設定天氣提醒：時間 `{time_str}`、時區 `{tz_name}`、頻道 `{channel.id}`、地點 `{location}`。",
        ephemeral=True
    )

@client.tree.command(name="set_remind", description="設定/關閉每日三餐提醒與推薦")
async def set_remind(
    interaction: discord.Interaction,
    enabled: Optional[bool] = None,
    location: Optional[str] = None,
    breakfast_time: Optional[str] = None,
    lunch_time: Optional[str] = None,
    dinner_time: Optional[str] = None,
    channel_id: Optional[str] = None,
    tz_name: Optional[str] = None,
):
    if not is_owner(interaction):
        return

    if enabled is False:
        config["meal_reminder"] = {
            "enabled": False,
            "location": "",
            "breakfast_time": "",
            "lunch_time": "",
            "dinner_time": "",
            "channel_id": 0,
            "timezone": "Asia/Taipei",
            "last_sent": {}
        }
        save_config(config)
        await interaction.response.send_message("✅ 已關閉每日三餐提醒。", ephemeral=True)
        return

    if not location or not tz_name or not channel_id:
        await interaction.response.send_message("⚠️ 請提供 location、channel_id、tz_name。", ephemeral=True)
        return

    for label, value in [("breakfast_time", breakfast_time), ("lunch_time", lunch_time), ("dinner_time", dinner_time)]:
        if value and not is_valid_hhmm(value):
            await interaction.response.send_message("⚠️ 時間格式錯誤，請使用 HH:MM（24 小時制），例如 07:30。", ephemeral=True)
            return

    parsed_channel_id = _parse_channel_id(str(channel_id))
    if parsed_channel_id is None:
        await interaction.response.send_message("⚠️ 頻道 ID 格式錯誤，請輸入數字或 #頻道。", ephemeral=True)
        return

    channel = client.get_channel(parsed_channel_id)
    if channel is None:
        try:
            channel = await client.fetch_channel(parsed_channel_id)
        except:
            await interaction.response.send_message("⚠️ 找不到該頻道 ID，或 Bot 沒有權限存取該頻道。", ephemeral=True)
            return

    config["meal_reminder"] = {
        "enabled": True,
        "location": location.strip(),
        "breakfast_time": (breakfast_time or "").strip(),
        "lunch_time": (lunch_time or "").strip(),
        "dinner_time": (dinner_time or "").strip(),
        "channel_id": int(channel.id),
        "timezone": tz_name.strip(),
        "last_sent": {}
    }
    save_config(config)
    await interaction.response.send_message(
        f"✅ 已設定三餐提醒：早餐 `{breakfast_time or '未設定'}`、午餐 `{lunch_time or '未設定'}`、晚餐 `{dinner_time or '未設定'}`，時區 `{tz_name}`，頻道 `{channel.id}`。",
        ephemeral=True
    )


@client.tree.command(name="set_todo_reminder", description="設定/關閉每日待辦事項提醒")
async def set_todo_reminder(
    interaction: discord.Interaction,
    enabled: Optional[bool] = None,
    content: Optional[str] = None,
    time_str: Optional[str] = None,
    channel_id: Optional[str] = None,
    tz_name: Optional[str] = None,
):
    if not is_owner(interaction):
        return

    if enabled is False:
        config["todo_reminder"] = {
            "enabled": False,
            "content": "",
            "time": "",
            "channel_id": 0,
            "timezone": "Asia/Taipei",
            "last_sent_date": ""
        }
        save_config(config)
        await interaction.response.send_message("✅ 已關閉每日待辦事項提醒。", ephemeral=True)
        return

    if not content or not time_str or not channel_id or not tz_name:
        await interaction.response.send_message(
            "⚠️ 請提供 content、time、channel_id、tz_name。",
            ephemeral=True
        )
        return

    if not is_valid_hhmm(time_str):
        await interaction.response.send_message("⚠️ 時間格式錯誤，請使用 HH:MM（24 小時制），例如 07:30。", ephemeral=True)
        return

    if not is_valid_timezone(tz_name):
        await interaction.response.send_message("⚠️ 時區名稱錯誤，例如 Asia/Taipei。", ephemeral=True)
        return

    parsed_channel_id = _parse_channel_id(str(channel_id))
    if parsed_channel_id is None:
        await interaction.response.send_message("⚠️ 頻道 ID 格式錯誤，請輸入數字或 #頻道。", ephemeral=True)
        return

    channel = client.get_channel(parsed_channel_id)
    if channel is None:
        try:
            channel = await client.fetch_channel(parsed_channel_id)
        except:
            await interaction.response.send_message("⚠️ 找不到該頻道 ID，或 Bot 沒有權限存取該頻道。", ephemeral=True)
            return

    cleaned = "\n".join([line.strip() for line in str(content).splitlines() if line.strip()])
    if not cleaned:
        await interaction.response.send_message("⚠️ 待辦內容不可為空。", ephemeral=True)
        return

    config["todo_reminder"] = {
        "enabled": True,
        "content": cleaned,
        "time": time_str.strip(),
        "channel_id": int(channel.id),
        "timezone": tz_name.strip(),
        "last_sent_date": ""
    }
    save_config(config)
    await interaction.response.send_message(
        "✅ 已設定待辦提醒：\n"
        f"- 時間：`{time_str}`\n"
        f"- 時區：`{tz_name}`\n"
        f"- 頻道：`{channel.id}`\n"
        "- 內容：\n"
        f"```\n{cleaned}\n```",
        ephemeral=True
    )

@client.tree.command(name="set_user", description="設定主要使用者外觀/個性/職業/所在地點")
async def set_profile(
    interaction: discord.Interaction,
    appearance: Optional[str] = None,
    personality: Optional[str] = None,
    occupation: Optional[str] = None,
    location: Optional[str] = None
):
    if not is_owner(interaction): return
    updated = False

    if appearance is not None or personality is not None or occupation is not None:
        profile = config.get("user_profile", {})
        if appearance is not None:
            profile["appearance"] = appearance
            updated = True
        if personality is not None:
            profile["personality"] = personality
            updated = True
        if occupation is not None:
            profile["occupation"] = occupation
            updated = True
        config["user_profile"] = profile

    if location is not None:
        config["dinner_location"] = location.strip()
        updated = True

    if not updated:
        await interaction.response.send_message("⚠️ 請至少提供一個欄位（appearance/personality/occupation/location）。", ephemeral=True)
        return

    save_config(config)
    await interaction.response.send_message("✅ 使用者設定已更新！", ephemeral=True)

@client.tree.command(name="set_summary", description="設定/開關/立即執行每日總結")
async def set_summary(
    interaction: discord.Interaction,
    enabled: Optional[bool] = None,
    run: Optional[bool] = None,
    time_str: Optional[str] = None,
    tz_name: Optional[str] = None,
):
    if not is_owner(interaction):
        return

    if time_str or tz_name:
        if not time_str or not tz_name:
            await interaction.response.send_message("⚠️ 請提供 time_str 與 tz_name。", ephemeral=True)
            return
        if not is_valid_hhmm(time_str):
            await interaction.response.send_message("⚠️ 時間格式錯誤，請使用 HH:MM（24 小時制），例如 23:30。", ephemeral=True)
            return
        if not is_valid_timezone(tz_name):
            await interaction.response.send_message("⚠️ 時區格式錯誤，請使用 IANA 時區名稱，例如 Asia/Taipei。", ephemeral=True)
            return
        config["summary_schedule"] = {
            "enabled": True,
            "time": time_str,
            "timezone": tz_name.strip(),
            "last_sent_date": ""
        }
        save_config(config)
        await interaction.response.send_message(
            f"✅ 已設定每日總結時間：每天 `{time_str}`（`{tz_name}`）。",
            ephemeral=True
        )
        return

    if enabled is True:
        config.setdefault("summary_schedule", {})["enabled"] = True
        save_config(config)
        await interaction.response.send_message("✅ 已開啟每日總結。", ephemeral=True)
        return

    if enabled is False:
        config.setdefault("summary_schedule", {})["enabled"] = False
        save_config(config)
        await interaction.response.send_message(
            "⚠️ 已關閉每日總結。若未連接 GitHub，聊天記憶可能會隨重啟或資料清理而流失。",
            ephemeral=True
        )
        return

    if run:
        await interaction.response.defer(ephemeral=True)
        now_local = datetime.now(_get_summary_timezone())
        today = now_local.strftime("%Y-%m-%d")
        summary = await _generate_daily_summary(today)
        if not summary:
            await interaction.followup.send("⚠️ 找不到可用聊天紀錄或摘要生成失敗。", ephemeral=True)
            return
        ok, msg = await _push_summary_to_github(today, summary)
        await interaction.followup.send(msg, ephemeral=True)
        return

    await interaction.response.send_message("⚠️ 請提供 enabled、run 或 time_str/tz_name。", ephemeral=True)


@client.tree.command(name="set_voice", description="語音設定與手動觸發")
@app_commands.choices(text_lang=TEXT_LANG_CHOICES, voice_lang=VOICE_LANG_CHOICES)
async def voice(
    interaction: discord.Interaction,
    show: Optional[bool] = None,
    clear: Optional[bool] = None,
    sample_url: Optional[str] = None,
    use_tonyassi: Optional[bool] = None,
    voice_provider: Optional[str] = None,
    example_audio_name: Optional[str] = None,
    text_lang: Optional[app_commands.Choice[str]] = None,
    voice_lang: Optional[app_commands.Choice[str]] = None,
    enabled: Optional[bool] = None,
    test_text: Optional[str] = None,
):
    await interaction.response.defer(ephemeral=True)
    user_key = str(interaction.user.id)

    if clear:
        if user_key in voice_profiles:
            voice_profiles.pop(user_key)
            save_voice_profiles(voice_profiles)
        await interaction.followup.send("✅ 已清除你的語音設定。", ephemeral=True)
        return

    if show:
        profile = get_voice_profile(interaction.user.id)
        if not profile:
            await interaction.followup.send("⚠️ 尚未設定語音資料。使用 /set_voice 參數來設定。", ephemeral=True)
            return
        masked = {
            "sample_url": profile.get("sample_url", ""),
            "use_tonyassi": profile.get("use_tonyassi", False),
            "voice_provider": profile.get("voice_provider", ""),
            "example_audio_name": profile.get("example_audio_name", ""),
            "text_lang": profile.get("text_lang", ""),
            "voice_lang": profile.get("voice_lang", ""),
            "enabled": profile.get("enabled", True)
        }
        await interaction.followup.send(f"你的語音設定：```json\n{json.dumps(masked, ensure_ascii=False, indent=2)}\n```", ephemeral=True)
        return

    if any([sample_url, use_tonyassi is not None, voice_provider, example_audio_name, text_lang, voice_lang, enabled is not None, test_text]):
        profile = get_voice_profile(interaction.user.id)
        if sample_url:
            profile["sample_url"] = sample_url.strip()
        if use_tonyassi is not None:
            profile["use_tonyassi"] = bool(use_tonyassi)
        if voice_provider:
            profile["voice_provider"] = voice_provider.strip().lower()
        if example_audio_name:
            profile["example_audio_name"] = example_audio_name.strip()
        if text_lang:
            profile["text_lang"] = text_lang.value.strip()
        if voice_lang:
            profile["voice_lang"] = voice_lang.value.strip()
        if enabled is not None:
            profile["enabled"] = bool(enabled)
        set_voice_profile(interaction.user.id, profile)
        await interaction.followup.send("✅ 已更新你的語音設定。", ephemeral=True)
        if test_text:
            await send_voice_response(interaction.channel, test_text, profile, target_lang=None)
        return

    await interaction.followup.send("⚠️ 請提供 show/clear 或任一語音設定參數。", ephemeral=True)



@client.tree.command(name="set_forbidden", description="新增/清空禁止清單")
@app_commands.choices(
    category=[
        app_commands.Choice(name="禁止詞彙", value="forbidden_words"),
        app_commands.Choice(name="禁止出現的食物", value="forbidden_foods"),
        app_commands.Choice(name="OWNER 討厭的食物", value="hated_foods"),
        app_commands.Choice(name="禁止行為", value="forbidden_actions")
    ]
)
async def set_forbidden(
    interaction: discord.Interaction,
    add_item: Optional[str] = None,
    clear: Optional[bool] = None,
    category: Optional[app_commands.Choice[str]] = None,
):
    if not is_owner(interaction):
        return

    if add_item:
        if category is None:
            await interaction.response.send_message("⚠️ 請提供 category。", ephemeral=True)
            return
        key = category.value
        items = config.get(key, [])
        if not isinstance(items, list):
            items = []
        if add_item not in items:
            items.append(add_item)
            config[key] = items
            save_config(config)
        await interaction.response.send_message(f"✅ 已將 `{add_item}` 加入 `{category.name}` 清單。", ephemeral=True)
        return

    if clear:
        if category is None:
            config["forbidden_words"] = []
            config["forbidden_foods"] = []
            config["hated_foods"] = []
            config["forbidden_actions"] = []
            save_config(config)
            await interaction.response.send_message("✅ 所有禁止清單已清空。", ephemeral=True)
            return

        key = category.value
        config[key] = []
        save_config(config)
        await interaction.response.send_message(f"✅ `{category.name}` 清單已清空。", ephemeral=True)
        return

    await interaction.response.send_message("⚠️ 請提供 add_item 或 clear=true。", ephemeral=True)

async def _timeout_channel_autocomplete(
    interaction: discord.Interaction,
    current: str,
):
    channels = config.get("timeout_channels", [])
    if not isinstance(channels, list):
        return []
    results = []
    keyword = str(current or "").strip().lower()
    for raw_id in channels:
        try:
            channel_id = int(raw_id)
        except Exception:
            continue
        channel = client.get_channel(channel_id)
        name = channel.name if channel else f"ID {channel_id}"
        label = f"{name} ({channel_id})"
        if keyword and keyword not in label.lower():
            continue
        results.append(app_commands.Choice(name=label[:100], value=str(channel_id)))
        if len(results) >= 25:
            break
    return results


@client.tree.command(name="set_timeout", description="設定沉默多久(分)後機器人主動開話題")
@app_commands.autocomplete(channel_id=_timeout_channel_autocomplete)
async def set_timeout(
    interaction: discord.Interaction,
    minutes: Optional[int] = None,
    add_channel_id: Optional[str] = None,
    remove_channel_id: Optional[str] = None,
    clear_channels: Optional[bool] = None,
    channel_id: Optional[str] = None,
):
    if not is_owner(interaction):
        return

    if minutes is not None:
        config["timeout_minutes"] = minutes
        save_config(config)
        await interaction.response.send_message(f"✅ 超時設定為 `{minutes}` 分鐘。", ephemeral=True)
        return

    if clear_channels:
        config["timeout_channels"] = []
        save_config(config)
        await interaction.response.send_message("✅ 已清空 timeout 頻道清單。", ephemeral=True)
        return

    target_raw = add_channel_id or remove_channel_id or channel_id
    parsed_channel_id = _parse_channel_id(str(target_raw))
    if parsed_channel_id is None:
        await interaction.response.send_message("⚠️ 請輸入有效頻道 ID（數字或 #頻道）。", ephemeral=True)
        return

    channel = client.get_channel(parsed_channel_id)
    if channel is None:
        try:
            channel = await client.fetch_channel(parsed_channel_id)
        except:
            channel = None

    timeout_channels = config.get("timeout_channels", [])
    if not isinstance(timeout_channels, list):
        timeout_channels = []

    if add_channel_id or (target_raw and not remove_channel_id):
        if int(parsed_channel_id) not in [int(c) for c in timeout_channels]:
            timeout_channels.append(int(parsed_channel_id))
            config["timeout_channels"] = timeout_channels
            save_config(config)
        label = f"{channel.name} ({parsed_channel_id})" if channel else str(parsed_channel_id)
        await interaction.response.send_message(f"✅ 已加入 timeout 頻道：`{label}`", ephemeral=True)
        return

    if remove_channel_id:
        filtered = [int(c) for c in timeout_channels if int(c) != int(parsed_channel_id)]
        config["timeout_channels"] = filtered
        save_config(config)
        label = f"{channel.name} ({parsed_channel_id})" if channel else str(parsed_channel_id)
        await interaction.response.send_message(f"✅ 已移除 timeout 頻道：`{label}`", ephemeral=True)
        return

    await interaction.response.send_message("⚠️ 請提供 minutes、add_channel_id/remove_channel_id 或 clear_channels=true。", ephemeral=True)


@client.tree.command(name="set_voice_listen", description="語音偵測插嘴設定/進出語音頻道")
async def set_voice_listen(
    interaction: discord.Interaction,
    enabled: Optional[bool] = None,
    voice_channel_id: Optional[str] = None,
    reply_channel_id: Optional[str] = None,
    names: Optional[str] = None,
    status: Optional[bool] = None,
):
    if not is_owner(interaction):
        return

    await interaction.response.defer(ephemeral=True)

    cfg = get_voice_listen_config()

    if status:
        stt_cfg = get_stt_config()
        await interaction.followup.send(
            "\n".join([
                f"✅ 啟用狀態：{cfg['enabled']}",
                f"🎤 語音頻道 ID：{cfg['voice_channel_id'] or '未設定'}",
                f"💬 回覆頻道 ID：{cfg['reply_channel_id'] or '未設定'}",
                f"🧷 名字觸發：{cfg['name_trigger_enabled']}",
                f"🔤 名字清單：{', '.join(cfg['name_triggers']) if cfg['name_triggers'] else '（空）'}",
                f"🛰️ STT 服務：{stt_cfg.get('url') or '未設定'}",
                "ℹ️ 語音辨識需外部部署 STT 服務並填入 STT_SPACE_URL 才能啟用。"
            ]),
            ephemeral=True
        )
        return

    if enabled is False:
        config["voice_listen"] = {
            "enabled": False,
            "voice_channel_id": cfg.get("voice_channel_id", 0),
            "reply_channel_id": cfg.get("reply_channel_id", 0),
            "name_triggers": cfg.get("name_triggers", []),
            "name_trigger_enabled": cfg.get("name_trigger_enabled", False)
        }
        save_config(config)
        await _stop_voice_listen()
        if client.voice_client:
            try:
                await client.voice_client.disconnect(force=True)
            except Exception:
                pass
            client.voice_client = None
        await interaction.followup.send("✅ 已停用語音偵測並離開語音頻道。", ephemeral=True)
        return

    if enabled is True:
        parsed_voice_id = _parse_channel_id(str(voice_channel_id))
        parsed_reply_id = _parse_channel_id(str(reply_channel_id))
        if parsed_voice_id is None:
            await interaction.followup.send("⚠️ 請提供有效語音頻道 ID（數字或 #頻道）。", ephemeral=True)
            return
        if parsed_reply_id is None:
            await interaction.followup.send("⚠️ 請提供有效回覆頻道 ID（數字或 #頻道）。", ephemeral=True)
            return
        name_list = cfg.get("name_triggers", [])
        name_enabled = cfg.get("name_trigger_enabled", False)
        if names is not None:
            cleaned = [item.strip() for item in str(names).replace("\n", ",").split(",")]
            name_list = [item for item in cleaned if item]
            name_enabled = bool(name_list)

        config["voice_listen"] = {
            "enabled": True,
            "voice_channel_id": int(parsed_voice_id),
            "reply_channel_id": int(parsed_reply_id),
            "name_triggers": name_list,
            "name_trigger_enabled": name_enabled
        }
        save_config(config)

        try:
            await _start_voice_listen(int(parsed_voice_id), int(parsed_reply_id))
        except Exception as e:
            await interaction.followup.send(
                f"❌ 啟動語音偵測失敗：{type(e).__name__}: {e}",
                ephemeral=True
            )
            return

        stt_cfg = get_stt_config()
        await interaction.followup.send(
            "\n".join([
                "✅ 已啟用語音偵測。",
                f"🎤 語音頻道 ID：{parsed_voice_id}",
                f"💬 回覆頻道 ID：{parsed_reply_id}",
                f"🧷 名字觸發：{name_enabled}",
                f"🔤 名字清單：{', '.join(name_list) if name_list else '（空）'}",
                f"🛰️ STT 服務：{stt_cfg.get('url') or '未設定'}",
                "ℹ️ 可用 /stt_health 進行 STT 連線診斷。"
            ]),
            ephemeral=True
        )
        return

    await interaction.followup.send("⚠️ 請提供 enabled=true/false 或 status=true。", ephemeral=True)


@client.tree.command(name="set_stt", description="設定/查看 STT 服務（URL/Token/Timeout/Language）")
async def set_stt(
    interaction: discord.Interaction,
    show: Optional[bool] = None,
    clear: Optional[bool] = None,
    url: Optional[str] = None,
    token: Optional[str] = None,
    timeout: Optional[float] = None,
    language: Optional[str] = None,
):
    if not is_owner(interaction):
        return

    await interaction.response.defer(ephemeral=True)

    if show:
        stt_cfg = get_stt_config()
        await interaction.followup.send(
            "\n".join([
                f"🛰️ STT URL：{stt_cfg.get('url') or '未設定'}",
                f"🔐 Token：{'已設定' if stt_cfg.get('token') else '未設定'}",
                f"⏱️ Timeout：{stt_cfg.get('timeout')} 秒",
                f"🌐 Language：{stt_cfg.get('language') or '未設定'}",
            ]),
            ephemeral=True
        )
        return

    if clear:
        config["stt"] = {
            "url": "",
            "token": "",
            "timeout": 0,
            "language": ""
        }
        save_config(config)
        await interaction.followup.send("✅ 已清除 STT 設定，將回退到環境變數。", ephemeral=True)
        return

    if not url:
        await interaction.followup.send("⚠️ 請提供 STT URL。", ephemeral=True)
        return

    clean_url = str(url).strip().rstrip("/")
    if not clean_url.startswith("http://") and not clean_url.startswith("https://"):
        await interaction.followup.send("⚠️ STT URL 需包含 http(s)://", ephemeral=True)
        return

    timeout_val = 0
    if timeout is not None:
        try:
            timeout_val = float(timeout)
        except Exception:
            await interaction.followup.send("⚠️ timeout 必須是數字（秒）。", ephemeral=True)
            return
        if timeout_val <= 0:
            await interaction.followup.send("⚠️ timeout 必須大於 0。", ephemeral=True)
            return

    config["stt"] = {
        "url": clean_url,
        "token": str(token or "").strip(),
        "timeout": timeout_val,
        "language": str(language or "").strip(),
    }
    save_config(config)
    await interaction.followup.send(
        "\n".join([
            "✅ 已更新 STT 設定。",
            f"🛰️ URL：`{clean_url}`",
            f"🔐 Token：{'已設定' if token else '未設定'}",
            f"⏱️ Timeout：`{timeout_val or '使用環境變數'}`",
            f"🌐 Language：`{language or '使用環境變數'}`",
        ]),
        ephemeral=True
    )


@client.tree.command(name="stt_health", description="檢查 STT 服務連線狀態")
async def stt_health(interaction: discord.Interaction):
    if not is_owner(interaction):
        return
    await interaction.response.defer(ephemeral=True)
    ok, detail = await stt_health_check()
    if ok:
        await interaction.followup.send(f"✅ STT 連線正常：{detail}", ephemeral=True)
    else:
        await interaction.followup.send(f"⚠️ STT 連線失敗：{detail}", ephemeral=True)


@client.tree.command(name="set_nsfw_guard", description="設定頻道人數限制的 NSFW 防護")
async def set_nsfw_guard(
    interaction: discord.Interaction,
    enabled: Optional[bool] = None,
    max_members: Optional[int] = None,
    status: Optional[bool] = None,
):
    if not is_owner(interaction):
        return

    await interaction.response.defer(ephemeral=True)

    guard = config.get("nsfw_guard", {}) or {}

    if status:
        await interaction.followup.send(
            "\n".join([
                f"✅ 啟用狀態：{guard.get('enabled', False)}",
                f"👥 最大人數：{guard.get('max_members', 0)}",
            ]),
            ephemeral=True
        )
        return

    if enabled is False:
        config["nsfw_guard"] = {"enabled": False, "max_members": 0}
        save_config(config)
        await interaction.followup.send("✅ 已關閉 NSFW 防護限制。", ephemeral=True)
        return

    if max_members is None or max_members <= 0:
        await interaction.followup.send("⚠️ 請提供大於 0 的 max_members。", ephemeral=True)
        return

    config["nsfw_guard"] = {"enabled": True, "max_members": int(max_members)}
    save_config(config)
    await interaction.followup.send(
        f"✅ 已啟用 NSFW 防護：當頻道人數 > {int(max_members)} 時，禁止 NSFW 話題。",
        ephemeral=True
    )


@client.tree.command(name="set_github_backup", description="設定 GitHub 備份參數")
async def set_github_backup(
    interaction: discord.Interaction,
    show: Optional[bool] = None,
    clear: Optional[bool] = None,
    repo: Optional[str] = None,
    branch: Optional[str] = None,
    token: Optional[str] = None,
    path: Optional[str] = None,
):
    if not is_owner(interaction):
        return

    await interaction.response.defer(ephemeral=True)

    cfg = config.get("github_backup", {}) or {}

    if show:
        await interaction.followup.send(
            "\n".join([
                f"📦 Repo：{cfg.get('repo') or os.environ.get('GITHUB_REPO', '') or '未設定'}",
                f"🌿 Branch：{cfg.get('branch') or os.environ.get('GITHUB_BRANCH', 'main') or 'main'}",
                f"🔐 Token：{'已設定' if (cfg.get('token') or os.environ.get('GITHUB_TOKEN')) else '未設定'}",
                f"📁 Path：{cfg.get('path') or os.environ.get('GITHUB_SUMMARY_PATH', 'summaries/')}",
            ]),
            ephemeral=True
        )
        return

    if clear:
        config["github_backup"] = {"repo": "", "branch": "", "token": "", "path": ""}
        save_config(config)
        await interaction.followup.send("✅ 已清除 GitHub 備份設定，將回退環境變數。", ephemeral=True)
        return

    if not repo and not branch and not token and not path:
        await interaction.followup.send("⚠️ 請至少提供 repo/branch/token/path 其中一項。", ephemeral=True)
        return

    cleaned_repo = cfg.get("repo", "")
    if repo:
        cleaned_repo = str(repo).strip()
        if "/" not in cleaned_repo:
            await interaction.followup.send("⚠️ repo 格式應為 owner/repo。", ephemeral=True)
            return

    config["github_backup"] = {
        "repo": cleaned_repo,
        "branch": str(branch if branch is not None else cfg.get("branch", "")).strip(),
        "token": str(token if token is not None else cfg.get("token", "")).strip(),
        "path": str(path if path is not None else cfg.get("path", "")).strip(),
    }
    save_config(config)
    await interaction.followup.send(
        "\n".join([
            "✅ 已更新 GitHub 備份設定。",
            f"📦 Repo：`{cleaned_repo or '使用環境變數'}`",
            f"🌿 Branch：`{(branch if branch is not None else '使用環境變數')}`",
            f"🔐 Token：{'已設定' if (token is not None and token) else '未變更'}",
            f"📁 Path：`{(path if path is not None else '使用環境變數')}`",
        ]),
        ephemeral=True
    )
    return


@client.tree.command(name="set_memory_sync", description="設定從 GitHub summary 載入長期記憶")
async def set_memory_sync(
    interaction: discord.Interaction,
    enabled: Optional[bool] = None,
    reload: Optional[bool] = None,
    show: Optional[bool] = None,
    days: Optional[int] = None,
    tz_name: Optional[str] = None,
):
    if not is_owner(interaction):
        return

    await interaction.response.defer(ephemeral=True)
    cfg = config.get("memory_sync", {}) or {}

    if show:
        await interaction.followup.send(
            "\n".join([
                f"✅ 啟用狀態：{cfg.get('enabled', False)}",
                f"📅 天數：{cfg.get('days', 7)}",
                f"🌐 時區：{cfg.get('timezone', 'Asia/Taipei')}",
                f"🕒 最後載入：{cfg.get('last_loaded_date', '') or '尚未載入'}",
                "ℹ️ 每天第一次載入會較慢（需從 GitHub 讀取 summary）。"
            ]),
            ephemeral=True
        )
        return

    if enabled is False:
        config["memory_sync"] = {"enabled": False, "days": 7, "timezone": "Asia/Taipei", "last_loaded_date": ""}
        save_config(config)
        await interaction.followup.send("✅ 已關閉長期記憶載入。", ephemeral=True)
        return

    if reload:
        global long_term_memory
        long_term_memory = await _load_github_summaries()
        tz_val = cfg.get("timezone", "Asia/Taipei")
        cfg["last_loaded_date"] = datetime.now(ZoneInfo(tz_val)).strftime("%Y-%m-%d")
        config["memory_sync"] = cfg
        save_config(config)
        await interaction.followup.send("✅ 已重新載入長期記憶（可能需要幾秒）。", ephemeral=True)
        return

    if days is None or days <= 0:
        await interaction.followup.send("⚠️ 請提供大於 0 的 days。", ephemeral=True)
        return

    if tz_name and not is_valid_timezone(tz_name):
        await interaction.followup.send("⚠️ 時區名稱錯誤，例如 Asia/Taipei。", ephemeral=True)
        return

    config["memory_sync"] = {
        "enabled": True,
        "days": int(days),
        "timezone": tz_name.strip() if tz_name else cfg.get("timezone", "Asia/Taipei"),
        "last_loaded_date": ""
    }
    save_config(config)
    await interaction.followup.send(
        "\n".join([
            "✅ 已啟用長期記憶載入。",
            f"📅 天數：`{int(days)}`",
            f"🌐 時區：`{(tz_name or cfg.get('timezone', 'Asia/Taipei'))}`",
            "ℹ️ 每天第一次載入會較慢（需從 GitHub 讀取 summary）。"
        ]),
        ephemeral=True
    )

@client.tree.command(name="join_voice_only", description="只加入語音頻道（不啟用語音偵測/回覆）")
async def join_voice_only(
    interaction: discord.Interaction,
    voice_channel_id: Optional[str] = None,
):
    if not is_owner(interaction):
        return

    await interaction.response.defer(ephemeral=True)
    parsed = _parse_channel_id(str(voice_channel_id))
    if parsed is None:
        await interaction.followup.send("⚠️ 請輸入有效語音頻道 ID（數字或 #頻道）。", ephemeral=True)
        return
    channel = client.get_channel(parsed)
    if channel is None:
        try:
            channel = await client.fetch_channel(parsed)
        except Exception:
            channel = None
    if channel is None or not isinstance(channel, (discord.VoiceChannel, discord.StageChannel)):
        await interaction.followup.send("⚠️ 找不到語音頻道或頻道類型不支援。", ephemeral=True)
        return
    if client.voice_client:
        try:
            await client.voice_client.disconnect(force=True)
        except Exception:
            pass
    try:
        vc = await channel.connect()
        client.voice_client = vc
    except Exception as e:
        debug_info = f"{type(e).__name__}: {e}"
        await interaction.followup.send(
            "\n".join([
                "❌ 進入語音頻道失敗。",
                f"錯誤：{debug_info}",
                "提示：請確認 opus/ffmpeg/PyNaCl 是否可用與語音權限。"
            ]),
            ephemeral=True
        )
        return
    await interaction.followup.send(
        "\n".join([
            f"✅ 已進入語音頻道：`{parsed}`",
            "ℹ️ 目前僅加入不回應；若需語音辨識回覆，請外接 STT 並使用 /set_voice_listen join。"
        ]),
        ephemeral=True
    )


# ───────── 啟動 ─────────
if __name__ == "__main__":
    TOKEN = os.environ.get("DISCORD_TOKEN")
    if TOKEN:
        client.run(TOKEN)
    else:
        print("❌ 錯誤：找不到 DISCORD_TOKEN 環境變數")
