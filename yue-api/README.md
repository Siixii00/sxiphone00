# YuE Music Generation API

這是 YuE 音樂生成模型的後端 API 伺服器，用於整合到 sxiphone 音樂應用程式中。

## 系統需求

- Python 3.8+
- CUDA 11.8+ (建議使用 GPU)
- GPU 記憶體: 建議 24GB+ (RTX 4090 或更高)
- 硬碟空間: 約 30GB (模型權重)

## 快速開始

### 1. 安裝依賴

```bash
# 建立虛擬環境
python -m venv venv

# 啟動虛擬環境
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 安裝依賴
pip install -r requirements.txt
```

### 2. 下載 YuE 模型

模型會在首次啟動時自動從 Hugging Face 下載，或您可以預先下載：

```bash
# 下載 Stage 1 模型
git clone https://huggingface.co/m-a-p/YuE-s1-7B-anneal-en-cot

# 下載 Stage 2 模型
git clone https://huggingface.co/m-a-p/YuE-s2-1B-general
```

### 3. 啟動伺服器

```bash
# Windows
start.bat

# 或直接執行
python main.py
```

伺服器將在 `http://localhost:8000` 啟動。

## API 端點

### 健康檢查
```
GET /health
```

### 生成歌詞
```
POST /api/yue/lyrics
```

請求體：
```json
{
  "theme": "夢想與希望",
  "language": "zh",
  "mood": "calm",
  "style": "pop",
  "segments": 4
}
```

### 生成音樂
```
POST /api/yue/generate
```

請求體：
```json
{
  "lyrics": "[verse]\n夢想在遠方閃耀\n[chorus]\n我們一起飛翔",
  "genre_tags": "pop female vocal catchy upbeat",
  "language": "zh",
  "style": "pop",
  "mood": "calm",
  "run_n_segments": 2
}
```

### 查詢任務狀態
```
GET /api/yue/status/{task_id}
```

### 下載生成的音樂
```
GET /api/yue/download/{task_id}/{file_type}
```

`file_type` 可以是：
- `mixed` - 混合音軌
- `vocal` - 人聲音軌
- `instrumental` - 伴奏音軌

## 環境變數

| 變數名 | 預設值 | 說明 |
|--------|--------|------|
| `YUE_STAGE1_MODEL` | `m-a-p/YuE-s1-7B-anneal-en-cot` | Stage 1 模型名稱 |
| `YUE_STAGE2_MODEL` | `m-a-p/YuE-s2-1B-general` | Stage 2 模型名稱 |

## 支援的語言

- `zh` - 中文
- `en` - 英文
- `ja` - 日文
- `ko` - 韓文
- `mixed` - 混合語言

## 支援的風格

- `pop` - 流行
- `ballad` - 抒情
- `rock` - 搖滾
- `electronic` - 電子
- `jazz` - 爵士
- `rnb` - R&B
- `acoustic` - 木吉他
- `hiphop` - 嘻哈

## 支援的心情

- `calm` - 平靜放鬆
- `happy` - 開心愉悅
- `sad` - 憂鬱感性
- `energetic` - 活力充沛
- `romantic` - 浪漫溫馨
- `mysterious` - 神秘夢幻

## 效能參考

| GPU | 30秒音訊生成時間 |
|-----|------------------|
| H800 | ~150 秒 |
| RTX 4090 | ~360 秒 |

## 授權

YuE 模型使用 Apache 2.0 授權。

## 相關連結

- [YuE GitHub](https://github.com/multimodal-art-projection/YuE)
- [YuE Paper](https://arxiv.org/abs/2503.08638)
- [YuE Demo](https://map-yue.github.io/)
