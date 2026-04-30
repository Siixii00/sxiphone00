class EmbeddingEngine {
  constructor(options = {}) {
    this.model = options.model || 'Xenova/all-MiniLM-L6-v2';
    this.dimensions = options.dimensions || 384;
    this.pipeline = null;
    this.isInitialized = false;
    this.isLoading = false;
    this.cache = new Map();
    this.memoryStore = options.memoryStore || null;
    this.useCompression = options.useCompression !== false;
    
    this.apiConfig = {
      enabled: options.apiEnabled || false,
      provider: options.apiProvider || null,
      url: options.apiUrl || '',
      key: options.apiKey || '',
      model: options.apiModel || ''
    };
  }

  async initialize(progressCallback = null) {
    if (this.isInitialized) {
      console.log('[EmbeddingEngine] 已初始化，跳過');
      return true;
    }

    if (this.isLoading) {
      console.log('[EmbeddingEngine] 正在加載中，請等待');
      return false;
    }

    this.isLoading = true;

    try {
      if (progressCallback) progressCallback({ stage: 'loading', progress: 0 });

      if (typeof Transformers === 'undefined') {
        console.log('[EmbeddingEngine] 加載 Transformers.js...');
        if (progressCallback) progressCallback({ stage: 'loading_lib', progress: 10 });
        
        await this._loadTransformers();
      }

      if (progressCallback) progressCallback({ stage: 'loading_model', progress: 20 });

      console.log(`[EmbeddingEngine] 加載模型: ${this.model}`);
      
      const { pipeline, env } = window.Transformers;
      
      env.allowLocalModels = false;
      env.useBrowserCache = true;

      this.pipeline = await pipeline('feature-extraction', this.model, {
        progress_callback: (progress) => {
          if (progressCallback) {
            const percent = 20 + Math.round((progress.progress || 0) * 0.7);
            progressCallback({ 
              stage: 'downloading', 
              progress: percent,
              file: progress.file || ''
            });
          }
        }
      });

      this.isInitialized = true;
      this.isLoading = false;
      
      console.log('[EmbeddingEngine] 模型加載完成');
      if (progressCallback) progressCallback({ stage: 'ready', progress: 100 });
      
      return true;
    } catch (error) {
      this.isLoading = false;
      console.error('[EmbeddingEngine] 初始化失敗:', error);
      
      if (this.apiConfig.enabled && this.apiConfig.provider) {
        console.log('[EmbeddingEngine] 嘗試使用 API 降級...');
        this.isInitialized = true;
        return true;
      }
      
      throw error;
    }
  }

  async _loadTransformers() {
    return new Promise((resolve, reject) => {
      if (typeof Transformers !== 'undefined') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.type = 'module';
      script.textContent = `
        import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1';
        window.Transformers = { pipeline, env };
        window.dispatchEvent(new Event('transformers-loaded'));
      `;
      
      const timeout = setTimeout(() => {
        reject(new Error('Transformers.js 加載超時'));
      }, 60000);

      window.addEventListener('transformers-loaded', () => {
        clearTimeout(timeout);
        resolve();
      }, { once: true });

      document.head.appendChild(script);
    });
  }

  async embed(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('無效的輸入文本');
    }

    const normalizedText = text.trim().toLowerCase();
    const cacheKey = this._hashText(normalizedText);
    
    if (this.cache.has(cacheKey)) {
      console.log('[EmbeddingEngine] 使用緩存嵌入');
      const cached = this.cache.get(cacheKey);
      return this.useCompression && this._isCompressed(cached) 
        ? this._decompressVector(cached) 
        : cached;
    }

    if (this.memoryStore) {
      try {
        const cachedEmbedding = await this.memoryStore.getEmbedding(cacheKey);
        if (cachedEmbedding && cachedEmbedding.vector) {
          console.log('[EmbeddingEngine] 使用 IndexedDB 緩存嵌入');
          const vector = this._isCompressed(cachedEmbedding.vector)
            ? this._decompressVector(cachedEmbedding.vector)
            : cachedEmbedding.vector;
          this.cache.set(cacheKey, cachedEmbedding.vector);
          return vector;
        }
      } catch (e) {
        console.warn('[EmbeddingEngine] 讀取 IndexedDB 緩存失敗:', e);
      }
    }

    if (this.apiConfig.enabled && this.apiConfig.provider && !this.pipeline) {
      return await this._embedWithAPI(text);
    }

    if (!this.pipeline) {
      throw new Error('模型尚未初始化，請先調用 initialize()');
    }

    try {
      console.log('[EmbeddingEngine] 生成嵌入向量...');
      const output = await this.pipeline(text, { pooling: 'mean', normalize: true });
      const vector = Array.from(output.data);

      const vectorToStore = this.useCompression ? this._compressVector(vector) : vector;
      this.cache.set(cacheKey, vectorToStore);

      if (this.memoryStore) {
        try {
          await this.memoryStore.addEmbedding({
            id: cacheKey,
            vector: vectorToStore,
            text: text.slice(0, 200),
            createdAt: new Date().toISOString(),
            model: this.model,
            compressed: this.useCompression
          });
        } catch (e) {
          console.warn('[EmbeddingEngine] 保存嵌入到 IndexedDB 失敗:', e);
        }
      }

      console.log(`[EmbeddingEngine] 嵌入生成完成，維度: ${vector.length}${this.useCompression ? ' (已壓縮)' : ''}`);
      return vector;
    } catch (error) {
      console.error('[EmbeddingEngine] 嵌入生成失敗:', error);
      throw error;
    }
  }

  async embedBatch(texts, batchSize = 5) {
    if (!Array.isArray(texts) || texts.length === 0) {
      return [];
    }

    console.log(`[EmbeddingEngine] 批量嵌入 ${texts.length} 條文本`);
    const results = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(text => this.embed(text).catch(e => {
          console.warn('[EmbeddingEngine] 批量嵌入單條失敗:', e);
          return null;
        }))
      );
      results.push(...batchResults);
      
      console.log(`[EmbeddingEngine] 已處理 ${Math.min(i + batchSize, texts.length)}/${texts.length}`);
    }

    return results;
  }

  async _embedWithAPI(text) {
    const { provider, url, key, model } = this.apiConfig;

    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          input: text,
          model: model || 'text-embedding-3-small'
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API 錯誤: ${response.status}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    }

    if (provider === 'custom' && url) {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(key && { 'Authorization': `Bearer ${key}` })
        },
        body: JSON.stringify({ input: text, model })
      });

      if (!response.ok) {
        throw new Error(`自定義 API 錯誤: ${response.status}`);
      }

      const data = await response.json();
      return data.embedding || data.data?.[0]?.embedding || data.values;
    }

    throw new Error(`不支持的 API 提供者: ${provider}`);
  }

  _compressVector(vector) {
    if (!Array.isArray(vector) || vector.length === 0) {
      return vector;
    }
    
    const min = Math.min(...vector);
    const max = Math.max(...vector);
    const range = max - min || 1;
    
    const compressed = new Int8Array(vector.length);
    for (let i = 0; i < vector.length; i++) {
      const normalized = (vector[i] - min) / range;
      compressed[i] = Math.round(normalized * 254 - 127);
    }
    
    return {
      __compressed: true,
      data: Array.from(compressed),
      min,
      max,
      originalLength: vector.length
    };
  }

  _decompressVector(compressed) {
    if (!compressed || !compressed.__compressed) {
      return compressed;
    }
    
    const { data, min, max, originalLength } = compressed;
    const range = max - min || 1;
    
    const decompressed = new Float32Array(originalLength);
    for (let i = 0; i < originalLength; i++) {
      const normalized = (data[i] + 127) / 254;
      decompressed[i] = normalized * range + min;
    }
    
    return Array.from(decompressed);
  }

  _isCompressed(vector) {
    return vector && typeof vector === 'object' && vector.__compressed === true;
  }

  cosineSimilarity(vecA, vecB) {
    const a = this._isCompressed(vecA) ? this._decompressVector(vecA) : vecA;
    const b = this._isCompressed(vecB) ? this._decompressVector(vecB) : vecB;
    
    if (!a || !b || a.length !== b.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  euclideanDistance(vecA, vecB) {
    const a = this._isCompressed(vecA) ? this._decompressVector(vecA) : vecA;
    const b = this._isCompressed(vecB) ? this._decompressVector(vecB) : vecB;
    
    if (!a || !b || a.length !== b.length) {
      return Infinity;
    }

    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }

    return Math.sqrt(sum);
  }

  async findSimilar(targetVector, vectors, k = 10) {
    if (!targetVector || !Array.isArray(vectors)) {
      return [];
    }

    const similarities = vectors.map((vec, index) => ({
      index,
      similarity: this.cosineSimilarity(targetVector, vec)
    }));

    similarities.sort((a, b) => b.similarity - a.similarity);

    return similarities.slice(0, k);
  }

  _hashText(text) {
    let hash = 5381;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) + hash) + text.charCodeAt(i);
    }
    return `emb_${Math.abs(hash).toString(36)}`;
  }

  clearCache() {
    this.cache.clear();
    console.log('[EmbeddingEngine] 緩存已清除');
  }

  getStats() {
    return {
      isInitialized: this.isInitialized,
      isLoading: this.isLoading,
      model: this.model,
      dimensions: this.dimensions,
      cacheSize: this.cache.size,
      apiEnabled: this.apiConfig.enabled,
      apiProvider: this.apiConfig.provider,
      useCompression: this.useCompression
    };
  }

  setApiConfig(config) {
    this.apiConfig = {
      enabled: config.enabled || false,
      provider: config.provider || null,
      url: config.url || '',
      key: config.key || '',
      model: config.model || ''
    };
    console.log('[EmbeddingEngine] API 配置已更新');
  }
}

if (typeof window !== 'undefined') {
  window.EmbeddingEngine = EmbeddingEngine;
}
