class GlobalMemorySystem {
  constructor(options = {}) {
    this.memoryStore = null;
    this.embeddingEngine = null;
    this.dailyAwakening = null;
    this.sleepEngine = null;
    this.sleepScheduler = null;
    
    this.config = {
      autoVectorize: options.autoVectorize !== false,
      autoSleep: options.autoSleep !== false,
      sleepStartTime: options.sleepStartTime || '02:00',
      sleepEndTime: options.sleepEndTime || '06:00',
      recallDays: options.recallDays || 7,
      maxMemories: options.maxMemories || 5000,
      ...options
    };
    
    this.isInitialized = false;
    this.initializationPromise = null;
  }

  async initialize(progressCallback = null) {
    if (this.isInitialized) return true;
    if (this.initializationPromise) return this.initializationPromise;
    
    this.initializationPromise = this._doInitialize(progressCallback);
    return this.initializationPromise;
  }

  async _doInitialize(progressCallback) {
    try {
      if (progressCallback) progressCallback({ stage: 'memory_store', progress: 10 });
      
      if (typeof MemoryStore !== 'undefined') {
        this.memoryStore = new MemoryStore();
        await this.memoryStore.init();
        console.log('[GlobalMemorySystem] MemoryStore 初始化完成');
      }
      
      if (progressCallback) progressCallback({ stage: 'embedding_engine', progress: 30 });
      
      if (typeof EmbeddingEngine !== 'undefined') {
        this.embeddingEngine = new EmbeddingEngine({
          memoryStore: this.memoryStore
        });
        console.log('[GlobalMemorySystem] EmbeddingEngine 已創建，準備初始化...');
        
        try {
          await this.embeddingEngine.initialize((p) => {
            if (progressCallback) {
              progressCallback({ 
                stage: 'embedding_model', 
                progress: 30 + Math.round(p.progress * 0.2) 
              });
            }
          });
          console.log('[GlobalMemorySystem] EmbeddingEngine 初始化完成');
        } catch (e) {
          console.warn('[GlobalMemorySystem] EmbeddingEngine 初始化失敗，將使用降級模式:', e);
        }
      }
      
      if (progressCallback) progressCallback({ stage: 'daily_awakening', progress: 50 });
      
      if (typeof DailyAwakening !== 'undefined') {
        this.dailyAwakening = new DailyAwakening({
          memoryStore: this.memoryStore,
          embeddingEngine: this.embeddingEngine,
          recallDays: this.config.recallDays,
          sleepStartTime: this.config.sleepStartTime,
          sleepEndTime: this.config.sleepEndTime
        });
        await this.dailyAwakening.initialize();
        console.log('[GlobalMemorySystem] DailyAwakening 初始化完成');
      }
      
      if (progressCallback) progressCallback({ stage: 'sleep_engine', progress: 70 });
      
      if (typeof SleepEngine !== 'undefined') {
        this.sleepEngine = new SleepEngine({
          memoryStore: this.memoryStore,
          embeddingEngine: this.embeddingEngine,
          chatMemoryIntegration: this
        });
        
        if (typeof SleepScheduler !== 'undefined') {
          this.sleepScheduler = new SleepScheduler(this.sleepEngine);
          this.sleepScheduler.setNightlySleepTime(
            parseInt(this.config.sleepStartTime.split(':')[0]),
            parseInt(this.config.sleepStartTime.split(':')[1])
          );
        }
        console.log('[GlobalMemorySystem] SleepEngine 初始化完成');
      }
      
      if (progressCallback) progressCallback({ stage: 'ready', progress: 100 });
      
      this.isInitialized = true;
      console.log('[GlobalMemorySystem] 全域記憶系統初始化完成');
      
      this._exposeGlobal();
      
      return true;
    } catch (e) {
      console.error('[GlobalMemorySystem] 初始化失敗:', e);
      this.isInitialized = false;
      return false;
    }
  }

  _exposeGlobal() {
    window.globalMemorySystem = this;
    window.memoryStore = this.memoryStore;
    window.embeddingEngine = this.embeddingEngine;
    window.dailyAwakening = this.dailyAwakening;
    window.sleepEngine = this.sleepEngine;
  }

  async hold(content, options = {}) {
    if (!this.memoryStore) {
      console.warn('[GlobalMemorySystem] MemoryStore 未初始化');
      return null;
    }
    
    const appId = options.appId || options.source || 'unknown';
    const memory = {
      content,
      embedding: null,
      emotion: options.emotion || { valence: 0.5, arousal: 0.5 },
      tags: options.tags || [],
      domain: options.domain || [appId],
      metadata: {
        type: options.type || 'dynamic',
        importance: options.importance || 5,
        source: appId,
        created: new Date().toISOString(),
        ...options.metadata
      }
    };
    
    if (this.config.autoVectorize && this.embeddingEngine) {
      try {
        if (!this.embeddingEngine.isInitialized) {
          await this.embeddingEngine.initialize();
        }
        memory.embedding = await this.embeddingEngine.embed(content);
      } catch (e) {
        console.warn('[GlobalMemorySystem] 向量化失敗:', e);
        memory.embedding = this._simpleHashEmbedding(content);
      }
    }
    
    const created = await this.memoryStore.create(memory);
    console.log(`[GlobalMemorySystem] 記憶已儲存: ${created.id} (來源: ${appId})`);
    
    return created;
  }

  async recall(options = {}) {
    if (!this.memoryStore) {
      return [];
    }
    
    const memories = await this.memoryStore.query({
      type: options.type,
      minImportance: options.minImportance,
      tags: options.tags,
      domain: options.domain,
      limit: options.limit || 20
    });
    
    return memories;
  }

  async search(query, options = {}) {
    if (!this.memoryStore) {
      return [];
    }
    
    if (this.embeddingEngine?.isInitialized && options.useVector !== false) {
      try {
        const queryEmbedding = await this.embeddingEngine.embed(query);
        return await this.memoryStore.searchByEmbedding(queryEmbedding, options.limit || 10);
      } catch (e) {
        console.warn('[GlobalMemorySystem] 向量搜索失敗:', e);
      }
    }
    
    const allMemories = await this.memoryStore.getAll();
    const queryLower = query.toLowerCase();
    
    return allMemories
      .filter(m => m.content?.toLowerCase().includes(queryLower))
      .slice(0, options.limit || 10);
  }

  async processAppMemory(appId, data) {
    if (!data || !data.content) {
      return { success: false, reason: 'no_content' };
    }
    
    const memory = await this.hold(data.content, {
      appId,
      type: data.type || 'app_memory',
      importance: data.importance || 5,
      tags: data.tags || [],
      domain: [appId, ...(data.domain || [])],
      emotion: data.emotion,
      metadata: {
        ...data.metadata,
        appId,
        processedAt: new Date().toISOString()
      }
    });
    
    this._notifyApps('GLOBAL_MEMORY_APP_PROCESSED', { appId, memory });
    
    return { success: true, memory };
  }

  _notifyApps(type, payload) {
    const frame = document.getElementById('app-frame');
    if (frame?.contentWindow) {
      frame.contentWindow.postMessage({ type, payload }, '*');
    }
    window.postMessage({ type, payload }, '*');
  }

  async conversationStart() {
    if (this.dailyAwakening) {
      return await this.dailyAwakening.conversationStart();
    }
    
    const recentMemories = await this.recall({ limit: 10 });
    
    return {
      needsAwakening: false,
      context: {
        surfaced: recentMemories,
        collects: [],
        emotionalTone: { valence: 0.5, arousal: 0.3, label: '平靜' }
      }
    };
  }

  async getAwakeningPrompt() {
    if (this.dailyAwakening) {
      return await this.dailyAwakening.getAwakeningPrompt();
    }
    return '';
  }

  startSleepScheduler() {
    if (this.sleepScheduler) {
      this.sleepScheduler.start();
      console.log('[GlobalMemorySystem] 睡眠調度器已啟動');
    }
  }

  stopSleepScheduler() {
    if (this.sleepScheduler) {
      this.sleepScheduler.stop();
      console.log('[GlobalMemorySystem] 睡眠調度器已停止');
    }
  }

  async triggerSleep() {
    if (this.sleepEngine) {
      return await this.sleepEngine.sleep('manual');
    }
    return null;
  }

  async vectorizeExistingMemories(options = {}) {
    if (!this.memoryStore) {
      throw new Error('MemoryStore 未初始化');
    }
    
    if (!this.embeddingEngine || !this.embeddingEngine.isInitialized) {
      throw new Error('EmbeddingEngine 未初始化，請先初始化向量化引擎');
    }
    
    const allMemories = await this.memoryStore.getAll();
    const memoriesWithoutEmbedding = allMemories.filter(m => !m.embedding || !Array.isArray(m.embedding));
    
    if (memoriesWithoutEmbedding.length === 0) {
      console.log('[GlobalMemorySystem] 所有記憶都已向量化');
      return { total: allMemories.length, vectorized: 0, skipped: allMemories.length };
    }
    
    console.log(`[GlobalMemorySystem] 開始向量化 ${memoriesWithoutEmbedding.length} 條記憶...`);
    
    const batchSize = options.batchSize || 5;
    const results = { total: memoriesWithoutEmbedding.length, vectorized: 0, failed: 0, skipped: allMemories.length - memoriesWithoutEmbedding.length };
    
    for (let i = 0; i < memoriesWithoutEmbedding.length; i += batchSize) {
      const batch = memoriesWithoutEmbedding.slice(i, i + batchSize);
      
      for (const memory of batch) {
        try {
          const embedding = await this.embeddingEngine.embed(memory.content);
          await this.memoryStore.update(memory.id, { embedding });
          results.vectorized++;
          console.log(`[GlobalMemorySystem] 向量化進度: ${results.vectorized}/${results.total} (${memory.id})`);
          
          if (options.progressCallback) {
            options.progressCallback({
              current: results.vectorized,
              total: results.total,
              memoryId: memory.id
            });
          }
        } catch (e) {
          results.failed++;
          console.warn(`[GlobalMemorySystem] 向量化失敗: ${memory.id}`, e);
        }
      }
      
      if (options.delayBetweenBatches) {
        await new Promise(resolve => setTimeout(resolve, options.delayBetweenBatches));
      }
    }
    
    console.log(`[GlobalMemorySystem] 向量化完成: ${results.vectorized} 成功, ${results.failed} 失敗`);
    return results;
  }

  async getVectorizationStats() {
    if (!this.memoryStore) {
      return { error: 'MemoryStore 未初始化' };
    }
    
    const allMemories = await this.memoryStore.getAll();
    const withEmbedding = allMemories.filter(m => m.embedding && Array.isArray(m.embedding));
    
    return {
      total: allMemories.length,
      vectorized: withEmbedding.length,
      notVectorized: allMemories.length - withEmbedding.length,
      percentage: allMemories.length > 0 ? Math.round((withEmbedding.length / allMemories.length) * 100) : 0
    };
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasMemoryStore: !!this.memoryStore,
      hasEmbeddingEngine: !!this.embeddingEngine,
      embeddingInitialized: this.embeddingEngine?.isInitialized || false,
      hasDailyAwakening: !!this.dailyAwakening,
      hasSleepEngine: !!this.sleepEngine,
      sleepSchedulerRunning: this.sleepScheduler?.isStarted || false,
      config: { ...this.config }
    };
  }

  _simpleHashEmbedding(text, dimensions = 384) {
    const vector = new Array(dimensions).fill(0);
    const normalized = text.toLowerCase().trim();
    
    for (let i = 0; i < normalized.length; i++) {
      const charCode = normalized.charCodeAt(i);
      const pos = i % dimensions;
      vector[pos] += Math.sin(charCode * (i + 1) * 0.1) * 0.1;
    }
    
    let norm = 0;
    for (let i = 0; i < dimensions; i++) {
      norm += vector[i] * vector[i];
    }
    norm = Math.sqrt(norm);
    
    if (norm > 0) {
      for (let i = 0; i < dimensions; i++) {
        vector[i] /= norm;
      }
    }
    
    return vector;
  }
}

const globalMemorySystem = new GlobalMemorySystem();

if (typeof window !== 'undefined') {
  window.GlobalMemorySystem = GlobalMemorySystem;
  window.globalMemorySystem = globalMemorySystem;
}
