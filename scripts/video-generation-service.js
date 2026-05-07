const VideoGenerationService = {
  HF_SPACE_URL: 'https://lightricks-ltx-video-distilled.hf.space',
  DEFAULT_NEGATIVE_PROMPT: 'worst quality, inconsistent motion, blurry, jittery, distorted',
  DEFAULT_HEIGHT: 512,
  DEFAULT_WIDTH: 704,
  DEFAULT_DURATION: 2.0,
  DEFAULT_GUIDANCE_SCALE: 3.0,
  MAX_POLL_ATTEMPTS: 300,
  POLL_INTERVAL: 2000,

  async generateVideo(prompt, options = {}, onProgress = null) {
    const {
      negativePrompt = this.DEFAULT_NEGATIVE_PROMPT,
      height = this.DEFAULT_HEIGHT,
      width = this.DEFAULT_WIDTH,
      duration = this.DEFAULT_DURATION,
      guidanceScale = this.DEFAULT_GUIDANCE_SCALE,
      seed = Math.floor(Math.random() * 2147483647),
      randomizeSeed = true,
      improveTexture = true
    } = options;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new Error('Prompt is required');
    }

    const validHeight = Math.max(256, Math.min(1280, Math.round(height / 32) * 32));
    const validWidth = Math.max(256, Math.min(1280, Math.round(width / 32) * 32));
    const validDuration = Math.max(0.3, Math.min(8.5, duration));
    const validGuidance = Math.max(1.0, Math.min(10.0, guidanceScale));

    try {
      if (onProgress) onProgress({ stage: 'starting', message: '正在啟動生成...' });

      const response = await fetch(`${this.HF_SPACE_URL}/call/text_to_video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [
            prompt.trim(),
            negativePrompt,
            null,
            null,
            validHeight,
            validWidth,
            'text-to-video',
            validDuration,
            9,
            seed,
            randomizeSeed,
            validGuidance,
            improveTexture
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API 請求失敗: ${response.status}`);
      }

      const result = await response.json();
      const eventId = result.event_id;

      if (!eventId) {
        throw new Error('無法取得任務 ID');
      }

      if (onProgress) onProgress({ stage: 'queued', message: '已加入佇列，等待處理...' });

      const videoUrl = await this.pollForResult(eventId, onProgress);
      return { videoUrl, seed: randomizeSeed ? null : seed };

    } catch (error) {
      console.error('Video generation error:', error);
      throw error;
    }
  },

  async pollForResult(eventId, onProgress = null) {
    const statusUrl = `${this.HF_SPACE_URL}/call/text_to_video/${eventId}`;
    let attempts = 0;

    while (attempts < this.MAX_POLL_ATTEMPTS) {
      attempts++;

      try {
        const response = await fetch(statusUrl);
        if (!response.ok) {
          if (response.status === 404) {
            await this.sleep(this.POLL_INTERVAL);
            continue;
          }
          throw new Error(`狀態查詢失敗: ${response.status}`);
        }

        const text = await response.text();
        const lines = text.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.msg === 'process_generating') {
                if (onProgress) {
                  const progress = Math.min(90, attempts * 0.5);
                  onProgress({
                    stage: 'generating',
                    message: `生成中... 預估 ${Math.ceil((this.MAX_POLL_ATTEMPTS - attempts) * 2 / 60)} 分鐘`,
                    progress
                  });
                }
              }

              if (data.msg === 'process_completed') {
                if (data.success === false) {
                  throw new Error(data.error || '生成失敗');
                }

                const output = data.output;
                if (output && output.data && Array.isArray(output.data)) {
                  const videoUrl = output.data[0];
                  if (videoUrl && typeof videoUrl === 'string') {
                    if (onProgress) onProgress({ stage: 'completed', message: '生成完成！', progress: 100 });
                    return videoUrl;
                  }
                }

                throw new Error('無法取得影片 URL');
              }
            } catch (parseError) {
              if (parseError.message && !parseError.message.includes('JSON')) {
                throw parseError;
              }
            }
          }
        }

        await this.sleep(this.POLL_INTERVAL);

      } catch (error) {
        if (error.message && (error.message.includes('生成失敗') || error.message.includes('無法取得'))) {
          throw error;
        }
        console.warn(`Poll attempt ${attempts} failed:`, error);
        await this.sleep(this.POLL_INTERVAL);
      }
    }

    throw new Error('生成逾時，請稍後重試');
  },

  async downloadVideo(videoUrl) {
    try {
      const response = await fetch(videoUrl);
      if (!response.ok) throw new Error('下載失敗');

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `ai-video-${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

      return blobUrl;
    } catch (error) {
      console.error('Download error:', error);
      throw new Error('影片下載失敗');
    }
  },

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  saveToLocalStorage(videoData, source) {
    const storageKey = 'sx_generated_videos';
    let stored = { videos: [] };

    try {
      const existing = localStorage.getItem(storageKey);
      if (existing) {
        stored = JSON.parse(existing);
      }
    } catch (e) {
      console.warn('Failed to parse stored videos:', e);
    }

    const newVideo = {
      id: `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      prompt: videoData.prompt,
      videoUrl: videoData.videoUrl,
      thumbnail: videoData.thumbnail || null,
      createdAt: new Date().toISOString(),
      status: 'completed',
      source: source
    };

    stored.videos.unshift(newVideo);

    try {
      localStorage.setItem(storageKey, JSON.stringify(stored));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }

    return newVideo;
  },

  getStoredVideos(source = null) {
    const storageKey = 'sx_generated_videos';
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return [];

      const data = JSON.parse(stored);
      if (!data.videos) return [];

      if (source) {
        return data.videos.filter(v => v.source === source);
      }
      return data.videos;
    } catch (e) {
      console.warn('Failed to get stored videos:', e);
      return [];
    }
  }
};

if (typeof window !== 'undefined') {
  window.VideoGenerationService = VideoGenerationService;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = VideoGenerationService;
}
