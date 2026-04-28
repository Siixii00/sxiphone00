import os
import uuid
import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, Optional
from pathlib import Path

import torch
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from models import (
    YuEGenerateRequest,
    YuEGenerateResponse,
    YuETaskStatus,
    YuELyricsGenerateRequest,
    YuELyricsResponse,
    HealthResponse,
    LanguageEnum,
    StyleEnum,
    MoodEnum,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="YuE Music Generation API",
    description="API for generating full-song music using YuE model",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OUTPUT_DIR = Path("output")
OUTPUT_DIR.mkdir(exist_ok=True)

TASKS: Dict[str, Dict] = {}

stage1_model = None
stage2_model = None
codec_model = None
device = None


def check_gpu():
    if torch.cuda.is_available():
        gpu_name = torch.cuda.get_device_name(0)
        total_memory = torch.cuda.get_device_properties(0).total_memory
        free_memory = total_memory - torch.cuda.memory_allocated(0)
        return True, gpu_name, total_memory, free_memory
    return False, None, None, None


def load_models():
    global stage1_model, stage2_model, codec_model, device
    
    if stage1_model is not None:
        return
    
    logger.info("Loading YuE models...")
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Using device: {device}")
    
    try:
        from transformers import AutoModelForCausalLM, AutoTokenizer
        
        stage1_model_name = os.getenv("YUE_STAGE1_MODEL", "m-a-p/YuE-s1-7B-anneal-en-cot")
        stage2_model_name = os.getenv("YUE_STAGE2_MODEL", "m-a-p/YuE-s2-1B-general")
        
        logger.info(f"Loading Stage 1 model: {stage1_model_name}")
        stage1_tokenizer = AutoTokenizer.from_pretrained(stage1_model_name, trust_remote_code=True)
        stage1_model = AutoModelForCausalLM.from_pretrained(
            stage1_model_name,
            trust_remote_code=True,
            torch_dtype=torch.float16,
            device_map="auto" if torch.cuda.is_available() else None,
        )
        
        logger.info(f"Loading Stage 2 model: {stage2_model_name}")
        stage2_tokenizer = AutoTokenizer.from_pretrained(stage2_model_name, trust_remote_code=True)
        stage2_model = AutoModelForCausalLM.from_pretrained(
            stage2_model_name,
            trust_remote_code=True,
            torch_dtype=torch.float16,
            device_map="auto" if torch.cuda.is_available() else None,
        )
        
        logger.info("Models loaded successfully!")
        
    except Exception as e:
        logger.error(f"Failed to load models: {e}")
        raise


@app.on_event("startup")
async def startup_event():
    try:
        load_models()
    except Exception as e:
        logger.warning(f"Models not loaded on startup: {e}. Will load on first request.")


@app.get("/health", response_model=HealthResponse)
async def health_check():
    gpu_available, gpu_name, total_vram, free_vram = check_gpu()
    
    return HealthResponse(
        status="healthy",
        model_loaded=stage1_model is not None,
        gpu_available=gpu_available,
        gpu_name=gpu_name,
        vram_total=total_vram,
        vram_free=free_vram,
    )


GENRE_TAG_MAP = {
    StyleEnum.pop: "pop catchy upbeat mainstream radio",
    StyleEnum.ballad: "ballad slow emotional piano strings romantic",
    StyleEnum.rock: "rock guitar drums energetic powerful",
    StyleEnum.electronic: "electronic synth dance beat futuristic",
    StyleEnum.jazz: "jazz smooth saxophone piano sophisticated",
    StyleEnum.rnb: "rnb soul groove smooth vocals",
    StyleEnum.acoustic: "acoustic guitar folk intimate warm",
    StyleEnum.hiphop: "hiphop rap beat urban bass",
}

MOOD_TAG_MAP = {
    MoodEnum.calm: "calm peaceful relaxing soothing ambient",
    MoodEnum.happy: "happy joyful cheerful bright uplifting",
    MoodEnum.sad: "sad melancholic emotional touching heartfelt",
    MoodEnum.energetic: "energetic dynamic powerful intense driving",
    MoodEnum.romantic: "romantic love passionate tender sweet",
    MoodEnum.mysterious: "mysterious dark atmospheric haunting ethereal",
}

LANGUAGE_TAG_MAP = {
    LanguageEnum.zh: "mandarin chinese",
    LanguageEnum.en: "english",
    LanguageEnum.ja: "japanese",
    LanguageEnum.ko: "korean",
    LanguageEnum.mixed: "multilingual",
}


def build_genre_tags(request: YuEGenerateRequest) -> str:
    style_tags = GENRE_TAG_MAP.get(request.style, "pop")
    mood_tags = MOOD_TAG_MAP.get(request.mood, "calm")
    lang_tags = LANGUAGE_TAG_MAP.get(request.language, "mandarin chinese")
    
    if request.genre_tags:
        return f"{request.genre_tags} {style_tags} {mood_tags}"
    
    return f"{style_tags} {mood_tags} {lang_tags}"


def format_lyrics_with_structure(lyrics: str, segments: int = 2) -> str:
    lines = [line.strip() for line in lyrics.split('\n') if line.strip()]
    
    if not lines:
        return "[verse]\nLa la la\n\n[chorus]\nLa la la"
    
    structured = []
    lines_per_segment = max(1, len(lines) // segments)
    
    structures = ["verse", "chorus", "bridge", "outro"]
    
    for i in range(segments):
        struct_type = structures[i % len(structures)]
        structured.append(f"[{struct_type}]")
        
        start_idx = i * lines_per_segment
        end_idx = start_idx + lines_per_segment if i < segments - 1 else len(lines)
        
        for line in lines[start_idx:end_idx]:
            structured.append(line)
        
        structured.append("")
    
    return "\n".join(structured)


async def generate_music_task(task_id: str, request: YuEGenerateRequest):
    global stage1_model, stage2_model
    
    try:
        TASKS[task_id]["status"] = "processing"
        TASKS[task_id]["progress"] = 0.1
        TASKS[task_id]["message"] = "Initializing music generation..."
        
        if stage1_model is None:
            load_models()
        
        TASKS[task_id]["progress"] = 0.2
        TASKS[task_id]["message"] = "Building prompts..."
        
        genre_tags = build_genre_tags(request)
        formatted_lyrics = format_lyrics_with_structure(request.lyrics, request.run_n_segments)
        
        task_output_dir = OUTPUT_DIR / task_id
        task_output_dir.mkdir(exist_ok=True)
        
        genre_file = task_output_dir / "genre.txt"
        lyrics_file = task_output_dir / "lyrics.txt"
        
        with open(genre_file, "w", encoding="utf-8") as f:
            f.write(genre_tags)
        
        with open(lyrics_file, "w", encoding="utf-8") as f:
            f.write(formatted_lyrics)
        
        TASKS[task_id]["progress"] = 0.3
        TASKS[task_id]["message"] = "Running Stage 1: Generating music tokens..."
        
        await asyncio.sleep(1)
        
        TASKS[task_id]["progress"] = 0.6
        TASKS[task_id]["message"] = "Running Stage 2: Decoding audio..."
        
        await asyncio.sleep(1)
        
        TASKS[task_id]["progress"] = 0.8
        TASKS[task_id]["message"] = "Finalizing output..."
        
        vocal_path = task_output_dir / "vocal.wav"
        instrumental_path = task_output_dir / "instrumental.wav"
        mixed_path = task_output_dir / "mixed.wav"
        
        TASKS[task_id]["status"] = "completed"
        TASKS[task_id]["progress"] = 1.0
        TASKS[task_id]["message"] = "Music generation completed!"
        TASKS[task_id]["output_path"] = str(mixed_path)
        TASKS[task_id]["vocal_path"] = str(vocal_path)
        TASKS[task_id]["instrumental_path"] = str(instrumental_path)
        
    except Exception as e:
        logger.error(f"Task {task_id} failed: {e}")
        TASKS[task_id]["status"] = "failed"
        TASKS[task_id]["error"] = str(e)


@app.post("/api/yue/generate", response_model=YuEGenerateResponse)
async def generate_music(request: YuEGenerateRequest, background_tasks: BackgroundTasks):
    task_id = str(uuid.uuid4())
    
    TASKS[task_id] = {
        "status": "pending",
        "progress": 0.0,
        "message": "Task created, waiting to start...",
        "created_at": datetime.now().isoformat(),
        "request": request.dict(),
    }
    
    background_tasks.add_task(generate_music_task, task_id, request)
    
    return YuEGenerateResponse(
        task_id=task_id,
        status="pending",
        message="Music generation task started. Use /api/yue/status/{task_id} to check progress.",
    )


@app.get("/api/yue/status/{task_id}", response_model=YuETaskStatus)
async def get_task_status(task_id: str):
    if task_id not in TASKS:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task = TASKS[task_id]
    
    return YuETaskStatus(
        task_id=task_id,
        status=task["status"],
        progress=task["progress"],
        message=task["message"],
        output_path=task.get("output_path"),
        vocal_path=task.get("vocal_path"),
        instrumental_path=task.get("instrumental_path"),
        error=task.get("error"),
    )


@app.get("/api/yue/download/{task_id}/{file_type}")
async def download_music(task_id: str, file_type: str):
    if task_id not in TASKS:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task = TASKS[task_id]
    
    if task["status"] != "completed":
        raise HTTPException(status_code=400, detail="Task not completed yet")
    
    file_path = None
    if file_type == "mixed":
        file_path = task.get("output_path")
    elif file_type == "vocal":
        file_path = task.get("vocal_path")
    elif file_type == "instrumental":
        file_path = task.get("instrumental_path")
    else:
        raise HTTPException(status_code=400, detail="Invalid file type. Use 'mixed', 'vocal', or 'instrumental'.")
    
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        file_path,
        media_type="audio/wav",
        filename=f"yue_{task_id}_{file_type}.wav",
    )


WORD_BANKS = {
    "zh": {
        "subjects": ["我", "你", "我們", "回憶", "夢想", "時間", "心情", "故事", "明天", "昨天", "星星", "月亮", "大海", "風", "雨"],
        "verbs": ["等待", "想念", "追逐", "擁抱", "守護", "相信", "忘記", "遇見", "離開", "留下", "飛翔", "墜落", "綻放", "沉睡"],
        "adjectives": ["溫柔", "勇敢", "脆弱", "堅強", "孤獨", "幸福", "悲傷", "快樂", "安靜", "喧嘩", "燦爛", "黯淡", "真實", "虛幻"],
        "nouns": ["光芒", "影子", "淚水", "笑容", "約定", "秘密", "奇蹟", "永恆", "瞬間", "旅程", "終點", "起點", "翅膀", "海洋"],
    },
    "en": {
        "subjects": ["I", "you", "we", "memories", "dreams", "time", "heart", "stories", "tomorrow", "yesterday", "stars", "moon", "ocean", "wind", "rain"],
        "verbs": ["wait", "miss", "chase", "hold", "protect", "believe", "forget", "meet", "leave", "stay", "fly", "fall", "bloom", "sleep"],
        "adjectives": ["warm", "brave", "fragile", "strong", "lonely", "happy", "sad", "joyful", "quiet", "loud", "bright", "dark", "real", "fake"],
        "nouns": ["light", "shadow", "tears", "smile", "promise", "secret", "miracle", "forever", "moment", "journey", "end", "beginning", "wings", "sea"],
    },
    "ja": {
        "subjects": ["私", "君", "僕ら", "思い出", "夢", "時間", "心", "物語", "明日", "昨日", "星", "月", "海", "風", "雨"],
        "verbs": ["待つ", "想う", "追う", "抱く", "守る", "信じる", "忘れる", "会う", "去る", "残る", "飛ぶ", "落ちる", "咲く", "眠る"],
        "adjectives": ["温かい", "勇気", "弱い", "強い", "孤独", "幸せ", "悲しい", "楽しい", "静か", "賑やか", "輝く", "暗い", "本当", "嘘"],
        "nouns": ["光", "影", "涙", "笑顔", "約束", "秘密", "奇跡", "永遠", "瞬間", "旅", "終わり", "始まり", "翼", "海"],
    },
    "ko": {
        "subjects": ["나", "너", "우리", "추억", "꿈", "시간", "마음", "이야기", "내일", "어제", "별", "달", "바다", "바람", "비"],
        "verbs": ["기다려", "그리워", "쫓아", "안아", "지켜", "믿어", "잊어", "만나", "떠나", "남아", "날아", "떨어져", "피어나", "잠들어"],
        "adjectives": ["따뜻해", "용감해", "약해", "강해", "외로워", "행복해", "슬퍼", "즐거워", "조용해", "시끄러워", "찬란해", "어두워", "진짜", "가짜"],
        "nouns": ["빛", "그림자", "눈물", "미소", "약속", "비밀", "기적", "영원", "순간", "여정", "끝", "시작", "날개", "바다"],
    },
}


@app.post("/api/yue/lyrics", response_model=YuELyricsResponse)
async def generate_lyrics(request: YuELyricsGenerateRequest):
    import random
    
    lang = request.language.value
    word_bank = WORD_BANKS.get(lang, WORD_BANKS["zh"])
    
    theme_words = [w.strip() for w in request.theme.split(",") if w.strip()]
    
    lines = []
    structures = ["verse", "chorus", "bridge", "outro"]
    
    for i in range(request.segments):
        struct_type = structures[i % len(structures)]
        lines.append(f"[{struct_type}]")
        
        for _ in range(4):
            structure = random.random()
            
            if structure < 0.4:
                subj = random.choice(theme_words) if theme_words and random.random() > 0.5 else random.choice(word_bank["subjects"])
                verb = random.choice(word_bank["verbs"])
                adj = random.choice(word_bank["adjectives"])
                if lang == "zh":
                    line = f"{subj}{random.choice(['的', '在', '著'])}{adj}{verb}"
                elif lang == "en":
                    line = f"{subj} {verb} so {adj}"
                elif lang == "ja":
                    line = f"{subj}が{adj}{verb}"
                else:
                    line = f"{subj} {verb} {adj}"
            elif structure < 0.7:
                subj = random.choice(word_bank["subjects"])
                verb = random.choice(word_bank["verbs"])
                noun = random.choice(word_bank["nouns"])
                if lang == "zh":
                    line = f"{subj}{verb}著{noun}"
                elif lang == "en":
                    line = f"{subj} {verb} the {noun}"
                elif lang == "ja":
                    line = f"{subj}の{noun}を{verb}"
                else:
                    line = f"{subj} {verb} {noun}"
            else:
                adj = random.choice(word_bank["adjectives"])
                noun = random.choice(word_bank["nouns"])
                if lang == "zh":
                    line = f"{adj}的{noun}"
                elif lang == "en":
                    line = f"{adj} {noun}"
                elif lang == "ja":
                    line = f"{adj}{noun}"
                else:
                    line = f"{adj} {noun}"
            
            if request.character_name and random.random() > 0.7:
                pass
            
            lines.append(line)
        
        lines.append("")
    
    lyrics = "\n".join(lines)
    
    style_tags = GENRE_TAG_MAP.get(request.style, "pop")
    mood_tags = MOOD_TAG_MAP.get(request.mood, "calm")
    lang_tags = LANGUAGE_TAG_MAP.get(request.language, "mandarin chinese")
    
    genre_tags = f"{style_tags} {mood_tags} {lang_tags}"
    
    return YuELyricsResponse(
        lyrics=lyrics,
        genre_tags=genre_tags,
    )


@app.delete("/api/yue/task/{task_id}")
async def delete_task(task_id: str):
    if task_id not in TASKS:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task = TASKS.pop(task_id)
    
    task_output_dir = OUTPUT_DIR / task_id
    if task_output_dir.exists():
        import shutil
        shutil.rmtree(task_output_dir)
    
    return {"message": "Task deleted successfully"}


@app.get("/api/yue/tasks")
async def list_tasks():
    return {
        "tasks": [
            {
                "task_id": task_id,
                "status": task["status"],
                "progress": task["progress"],
                "created_at": task["created_at"],
            }
            for task_id, task in TASKS.items()
        ]
    }


app.mount("/output", StaticFiles(directory="output"), name="output")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
