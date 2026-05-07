from pydantic import BaseModel
from typing import Optional, List
from enum import Enum


class LanguageEnum(str, Enum):
    zh = "zh"
    en = "en"
    ja = "ja"
    ko = "ko"
    mixed = "mixed"


class StyleEnum(str, Enum):
    pop = "pop"
    ballad = "ballad"
    rock = "rock"
    electronic = "electronic"
    jazz = "jazz"
    rnb = "rnb"
    acoustic = "acoustic"
    hiphop = "hiphop"


class MoodEnum(str, Enum):
    calm = "calm"
    happy = "happy"
    sad = "sad"
    energetic = "energetic"
    romantic = "romantic"
    mysterious = "mysterious"


class YuEGenerateRequest(BaseModel):
    lyrics: str
    genre_tags: str
    language: LanguageEnum = LanguageEnum.zh
    style: StyleEnum = StyleEnum.pop
    mood: MoodEnum = MoodEnum.calm
    run_n_segments: int = 2
    max_new_tokens: int = 3000
    repetition_penalty: float = 1.1
    use_audio_prompt: bool = False
    audio_prompt_path: Optional[str] = None
    prompt_start_time: float = 0
    prompt_end_time: float = 30
    use_dual_tracks_prompt: bool = False
    vocal_track_prompt_path: Optional[str] = None
    instrumental_track_prompt_path: Optional[str] = None


class YuEGenerateResponse(BaseModel):
    task_id: str
    status: str
    message: str


class YuETaskStatus(BaseModel):
    task_id: str
    status: str
    progress: float
    message: str
    output_path: Optional[str] = None
    vocal_path: Optional[str] = None
    instrumental_path: Optional[str] = None
    error: Optional[str] = None


class YuELyricsGenerateRequest(BaseModel):
    theme: str
    language: LanguageEnum = LanguageEnum.zh
    mood: MoodEnum = MoodEnum.calm
    style: StyleEnum = StyleEnum.pop
    segments: int = 4
    character_name: Optional[str] = None
    character_personality: Optional[str] = None


class YuELyricsResponse(BaseModel):
    lyrics: str
    genre_tags: str


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    gpu_available: bool
    gpu_name: Optional[str] = None
    vram_total: Optional[int] = None
    vram_free: Optional[int] = None
