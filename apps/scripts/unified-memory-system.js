class UnifiedMemorySystem {
  constructor(options = {}) {
    this.memoryStore = options.memoryStore || null;
    this.embeddingEngine = options.embeddingEngine || null;
    this.searchEngine = options.searchEngine || null;
    this.decayEngine = options.decayEngine || null;
    this.emotionTagger = options.emotionTagger || null;
    this.classifier = options.classifier || null;
    this.shortTermMemory = options.shortTermMemory || null;
    this.memoryPool = options.memoryPool || null;
    this.sleepEngine = options.sleepEngine || null;
    this.awakeningEngine = options.awakeningEngine || null;
    
    this.apiConfig = options.apiConfig || null;
    this.isInitialized = false;
    this.initializationPromise = null;
    
    this.config = {
      autoSave: options.autoSave !== false,
      autoSaveInterval: options.autoSaveInterval || 60000,
      enablePoolIntegration: options.enablePoolIntegration !== false,
      enableDecay: options.enableDecay !== false,
      enableAwakening: options.enableAwakening !== false,
      contextWindowSize: options.contextWindowSize || 10,
      ...options
    };
    
    this._identity = null;
    this._lastContextBuild = null;
    this._contextCache = null;
  }
  
  async initialize(progressCallback = null) {
    if (this.isInitialized) return true;
    if (this.initializationPromise) return this.initializationPromise;
    
    this.initializationPromise = this._doInitialize(progressCallback);
    return this.initializationPromise;
  }
  
  async _doInitialize(progressCallback) {
    try {
      if (progressCallback) progressCallback({ stage: 'store', progress: 10 });
      
      if (!this.memoryStore && typeof MemoryStore !== 'undefined') {
        this.memoryStore = new MemoryStore();
        await this.memoryStore.init();
      }
      
      if (progressCallback) progressCallback({ stage: 'embedding', progress: 25 });
      
      if (!this.embeddingEngine && typeof EmbeddingEngine !== 'undefined') {
        this.embeddingEngine = new EmbeddingEngine({ memoryStore: this.memoryStore });
        try {
          await this.embeddingEngine.initialize();
        } catch (e) {
          console.warn('[UnifiedMemorySystem] EmbeddingEngine 初始化失敗:', e);
        }
      }
      
      if (progressCallback) progressCallback({ stage: 'decay', progress: 40 });
      
      if (!this.decayEngine && typeof DecayEngine !== 'undefined') {
        this.decayEngine = new DecayEngine({ memoryStore: this.memoryStore });
      }
      
      if (progressCallback) progressCallback({ stage: 'search', progress: 55 });
      
      if (!this.searchEngine && typeof SearchEngine !== 'undefined') {
        this.searchEngine = new SearchEngine({
          memoryStore: this.memoryStore,
          embeddingEngine: this.embeddingEngine,
          decayEngine: this.decayEngine
        });
        await this.searchEngine.initialize();
      }
      
      if (progressCallback) progressCallback({ stage: 'emotion', progress: 65 });
      
      if (!this.emotionTagger && typeof EmotionTagger !== 'undefined') {
        this.emotionTagger = new EmotionTagger();
      }
      
      if (progressCallback) progressCallback({ stage: 'classifier', progress: 75 });
      
      if (!this.classifier && typeof MemoryClassifier !== 'undefined') {
        this.classifier = new MemoryClassifier({ apiConfig: this.apiConfig });
      }
      
      if (progressCallback) progressCallback({ stage: 'short_term', progress: 85 });
      
      if (!this.shortTermMemory && typeof ShortTermMemory !== 'undefined') {
        this.shortTermMemory = new ShortTermMemory({
          maxCapacity: 100,
          decayMinutes: 30,
          importanceThreshold: 6
        });
        this.shortTermMemory.initialize();
      }
      
      if (progressCallback) progressCallback({ stage: 'pool', progress: 90 });
      
      if (!this.memoryPool && typeof MemoryPool !== 'undefined') {
        this.memoryPool = new MemoryPool({
          shortTermMemory: this.shortTermMemory,
          memoryManager: this,
          memoryStore: this.memoryStore,
          embeddingEngine: this.embeddingEngine
        });
        this.memoryPool.initialize();
      }
      
      if (progressCallback) progressCallback({ stage: 'awakening', progress: 95 });
      
      if (!this.awakeningEngine && typeof AwakeningEngine !== 'undefined') {
        this.awakeningEngine = new AwakeningEngine({
          memoryStore: this.memoryStore,
          embeddingEngine: this.embeddingEngine,
          searchEngine: this.searchEngine,
          emotionTagger: this.emotionTagger
        });
      }
      
      if (!this.sleepEngine && typeof SleepEngine !== 'undefined') {
        this.sleepEngine = new SleepEngine({
          memoryStore: this.memoryStore,
          embeddingEngine: this.embeddingEngine,
          classifier: this.classifier,
          standardizer: this.memoryStandardizer || null,
          shortTermMemory: this.shortTermMemory,
          chatMemoryIntegration: null
        });
      }
      
      if (this.searchEngine && this.decayEngine) {
        this.searchEngine.decayEngine = this.decayEngine;
      }
      
      this._loadIdentity();
      this._startAutoSave();
      
      this.isInitialized = true;
      
      if (progressCallback) progressCallback({ stage: 'ready', progress: 100 });
      
      console.log('[UnifiedMemorySystem] 統一記憶系統初始化完成');
      
      this._exposeGlobal();
      
      return true;
    } catch (e) {
      console.error('[UnifiedMemorySystem] 初始化失敗:', e);
      throw e;
    }
  }
  
  _loadIdentity() {
    try {
      if (typeof sxStorage !== 'undefined' && sxStorage?.getSetting) {
        sxStorage.getSetting('sx_memory_identity').then(saved => {
          if (saved && !this._identity) {
            this._identity = JSON.parse(saved);
            this._saveIdentity();
          }
        }).catch(() => {});
      }
    } catch (_) {
      this._identity = null;
    }
  }
  
  _saveIdentity() {
    if (this._identity && typeof sxStorage !== 'undefined' && sxStorage?.saveSetting) {
      sxStorage.saveSetting('sx_memory_identity', JSON.stringify(this._identity)).catch(() => {});
    }
  }
  
  _startAutoSave() {
    if (!this.config.autoSave) return;
    
    setInterval(() => {
      this._saveIdentity();
    }, this.config.autoSaveInterval);
  }
  
  _exposeGlobal() {
    window.unifiedMemory = this;
    window.memoryStore = this.memoryStore;
    window.embeddingEngine = this.embeddingEngine;
    window.searchEngine = this.searchEngine;
    window.decayEngine = this.decayEngine;
    window.shortTermMemory = this.shortTermMemory;
    window.memoryPool = this.memoryPool;
    window.awakeningEngine = this.awakeningEngine;
    window.sleepEngine = this.sleepEngine;
  }
  
  setIdentity(identity) {
    this._identity = {
      ...identity,
      establishedAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };
    this._saveIdentity();
    
    if (this.memoryPool) {
      if (identity.type === 'character' || identity.type === 'ai') {
        this.memoryPool.setPremise(`我是 ${identity.name || 'AI 助理'}，正在與用戶對話`);
      } else if (identity.type === 'user_companion') {
        const charName = localStorage.getItem('sx_char_name') || 'AI 助理';
        this.memoryPool.setPremise(`我是 ${charName}，正在與用戶對話`);
      } else {
        this.memoryPool.setPremise(`我是 ${identity.name || 'AI 助理'}，正在與用戶對話`);
      }
    }
    
    console.log('[UnifiedMemorySystem] 身份已設置:', identity.name || '未知');
    return this._identity;
  }
  
  getIdentity() {
    return this._identity;
  }
  
  async recall(query, options = {}) {
    if (!this.isInitialized) {
      console.warn('[UnifiedMemorySystem] 系統未初始化');
      return { memories: [], context: null };
    }
    
    const results = {
      memories: [],
      shortTerm: [],
      pool: null,
      awakening: null,
      context: null,
      identity: this._identity
    };
    
    if (this.memoryPool && options.usePool !== false) {
      const poolResult = this.memoryPool.trigger(query, options);
      results.pool = poolResult;
      
      if (poolResult.matched && poolResult.matched.length > 0) {
        for (const match of poolResult.matched.slice(0, 5)) {
          results.memories.push({
            id: match.data.id,
            content: match.data.content,
            score: match.matchScore,
            source: 'memory_pool',
            type: match.type,
            dominantSense: match.data.dominantSense
          });
        }
      }
    }
    
    if (this.searchEngine && options.useSearch !== false) {
      const searchResults = await this.searchEngine.search(query, {
        limit: options.limit || 10,
        ...options
      });
      
      for (const mem of searchResults) {
        if (!results.memories.find(m => m.id === mem.id)) {
          results.memories.push({
            id: mem.id,
            content: mem.content,
            score: mem.finalScore || mem.surfaceScore,
            source: 'search_engine',
            emotion: mem.emotion,
            importance: mem.metadata?.importance,
            tags: mem.tags
          });
        }
      }
    }
    
    if (this.shortTermMemory && options.useShortTerm !== false) {
      const recentShortTerm = this.shortTermMemory.getRecent(options.shortTermLimit || 10);
      results.shortTerm = recentShortTerm.map(m => ({
        id: m.id,
        content: m.content,
        importance: m.importance,
        emotion: m.emotion,
        age: Date.now() - new Date(m.createdAt).getTime()
      }));
    }
    
    if (this.awakeningEngine && options.useAwakening !== false) {
      const awakeningStatus = this.awakeningEngine.getAwakeningStatus();
      if (awakeningStatus.needsAwakening) {
        const awakeningResult = await this.awakeningEngine.dailyAwakening();
        results.awakening = awakeningResult;
      } else {
        results.awakening = this.awakeningEngine.getMemoryContext();
      }
    }
    
    results.memories.sort((a, b) => b.score - a.score);
    results.memories = results.memories.slice(0, options.limit || 10);
    
    results.context = this._buildContext(results);
    
    if (this._identity) {
      this._identity.lastActive = new Date().toISOString();
    }
    
    console.log(`[UnifiedMemorySystem] 回憶完成: ${results.memories.length} 條記憶, ${results.shortTerm.length} 條短期記憶`);
    
    return results;
  }
  
  _buildContext(results) {
    const context = {
      identity: this._identity,
      summary: '',
      recentMemories: [],
      emotionalTone: { valence: 0.5, arousal: 0.5 },
      keywords: [],
      timestamp: new Date().toISOString()
    };
    
    const memoryTexts = results.memories.map(m => m.content).join(' ');
    const shortTermTexts = results.shortTerm.map(m => m.content).join(' ');
    const allText = memoryTexts + ' ' + shortTermTexts;
    
    context.keywords = this._extractKeywords(allText);
    
    if (results.memories.length > 0) {
      const avgValence = results.memories.reduce((sum, m) => {
        return sum + (m.emotion?.valence || 0.5);
      }, 0) / results.memories.length;
      const avgArousal = results.memories.reduce((sum, m) => {
        return sum + (m.emotion?.arousal || 0.5);
      }, 0) / results.memories.length;
      context.emotionalTone = { valence: avgValence, arousal: avgArousal };
    }
    
    context.recentMemories = results.memories.slice(0, 5).map(m => ({
      content: m.content.substring(0, 100),
      score: m.score
    }));
    
    const parts = [];
    if (this._identity) {
      parts.push(`身份: ${this._identity.name || 'AI 助理'}`);
    }
    parts.push(`記憶數量: ${results.memories.length}`);
    if (results.shortTerm.length > 0) {
      parts.push(`短期記憶: ${results.shortTerm.length} 條`);
    }
    if (context.keywords.length > 0) {
      parts.push(`關鍵詞: ${context.keywords.slice(0, 5).join(', ')}`);
    }
    context.summary = parts.join(' | ');
    
    return context;
  }
  
  _extractKeywords(text) {
    const stopWords = new Set(['的', '是', '在', '了', '和', '有', '我', '你', '他', '她', '它', '們', '這', '那', '就', '也', '都', '會', '能', '要', '可以', '一個', '什麼', '怎麼', '為什麼', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must']);
    
    const chineseWords = text.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
    const englishWords = text.toLowerCase().match(/[a-z]{3,}/g) || [];
    
    const wordFreq = new Map();
    for (const word of [...chineseWords, ...englishWords]) {
      if (stopWords.has(word)) continue;
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    }
    
    const sorted = [...wordFreq.entries()].sort((a, b) => b[1] - a[1]);
    return sorted.slice(0, 20).map(([word]) => word);
  }
  
  async memorize(content, options = {}) {
    if (!this.isInitialized) {
      console.warn('[UnifiedMemorySystem] 系統未初始化');
      return null;
    }
    
    const results = {
      shortTerm: null,
      longTerm: null,
      pool: null,
      success: false
    };
    
    if (this.memoryPool && options.usePool !== false) {
      const senses = this.memoryPool._detectSenses(content);
      if (Object.keys(senses).length > 0) {
        results.pool = this.memoryPool.addPerception(content, {
          emotion: options.emotion,
          metadata: options.metadata
        });
      }
    }
    
    if (this.shortTermMemory && options.useShortTerm !== false) {
      results.shortTerm = this.shortTermMemory.push(content, {
        importance: options.importance || 5,
        emotion: options.emotion,
        source: options.source || 'user',
        tags: options.tags || [],
        metadata: options.metadata
      });
    }
    
    if (this.memoryStore && options.useLongTerm !== false) {
      try {
        let embedding = null;
        if (this.embeddingEngine?.isInitialized) {
          embedding = await this.embeddingEngine.embed(content);
        }
        
        let emotion = options.emotion;
        if (!emotion && this.emotionTagger) {
          const emotionResult = await this.emotionTagger.analyzeAuto(content);
          emotion = {
            valence: emotionResult.valence,
            arousal: emotionResult.arousal
          };
        }
        
        let region = null;
        if (this.classifier && options.classify !== false) {
          try {
            const classifyResult = await this.classifier.classify(content, { skipLLM: true });
            region = {
              primary: classifyResult.primary,
              secondary: classifyResult.secondary || [],
              confidence: classifyResult.confidence || 0.5
            };
          } catch (e) {}
        }
        
        const memory = {
          content,
          embedding,
          emotion: emotion || { valence: 0.5, arousal: 0.5 },
          tags: options.tags || [],
          domain: options.domain || [],
          region,
          metadata: {
            importance: options.importance || 5,
            type: options.type || 'dynamic',
            source: options.source || 'user',
            created: new Date().toISOString(),
            ...options.metadata
          }
        };
        
        results.longTerm = await this.memoryStore.create(memory);
        results.success = true;
        
        console.log(`[UnifiedMemorySystem] 記憶已儲存: ${results.longTerm.id}`);
      } catch (e) {
        console.warn('[UnifiedMemorySystem] 長期記憶儲存失敗:', e);
      }
    }
    
    return results;
  }
  
  async forget(id, options = {}) {
    if (!this.isInitialized) {
      return { success: false, reason: 'not_initialized' };
    }
    
    const results = { success: false, shortTerm: false, longTerm: false, pool: false };
    
    if (this.shortTermMemory) {
      const removed = this.shortTermMemory.remove(id);
      results.shortTerm = removed;
    }
    
    if (this.memoryStore) {
      try {
        await this.memoryStore.delete(id);
        results.longTerm = true;
      } catch (e) {}
    }
    
    results.success = results.shortTerm || results.longTerm || results.pool;
    return results;
  }
  
  async sleep(reason = 'manual') {
    if (!this.sleepEngine) {
      return { success: false, reason: 'sleep_engine_not_available' };
    }
    
    console.log(`[UnifiedMemorySystem] 進入睡眠模式: ${reason}`);
    
    const result = await this.sleepEngine.sleep(reason);
    
    if (result.success) {
      this._contextCache = null;
      this._lastContextBuild = null;
    }
    
    return result;
  }
  
  async awaken() {
    if (!this.awakeningEngine) {
      return { success: false, reason: 'awakening_engine_not_available' };
    }
    
    console.log('[UnifiedMemorySystem] 執行喚醒程序');
    
    const result = await this.awakeningEngine.dailyAwakening();
    
    if (this._identity) {
      this._identity.lastActive = new Date().toISOString();
      this._saveIdentity();
    }
    
    return result;
  }
  
  getStats() {
    return {
      isInitialized: this.isInitialized,
      hasIdentity: !!this._identity,
      components: {
        memoryStore: !!this.memoryStore,
        embeddingEngine: !!this.embeddingEngine,
        searchEngine: !!this.searchEngine,
        decayEngine: !!this.decayEngine,
        emotionTagger: !!this.emotionTagger,
        classifier: !!this.classifier,
        shortTermMemory: !!this.shortTermMemory,
        memoryPool: !!this.memoryPool,
        sleepEngine: !!this.sleepEngine,
        awakeningEngine: !!this.awakeningEngine
      },
      shortTermStats: this.shortTermMemory?.getStats(),
      poolStats: this.memoryPool?.getStats(),
      decayStats: this.decayEngine?.getConfig()
    };
  }
  
  async export() {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      identity: this._identity,
      memories: [],
      shortTerm: [],
      pool: null
    };
    
    if (this.memoryStore) {
      data.memories = await this.memoryStore.getAll();
    }
    
    if (this.shortTermMemory) {
      data.shortTerm = this.shortTermMemory.getAll();
    }
    
    if (this.memoryPool) {
      data.pool = this.memoryPool.export();
    }
    
    return data;
  }
  
  async import(data) {
    if (!data) return { success: false, reason: 'no_data' };
    
    if (data.identity) {
      this._identity = data.identity;
      this._saveIdentity();
    }
    
    if (data.memories && this.memoryStore) {
      for (const mem of data.memories) {
        try {
          await this.memoryStore.create(mem);
        } catch (e) {}
      }
    }
    
    if (data.shortTerm && this.shortTermMemory) {
      this.shortTermMemory.import({ buffer: data.shortTerm });
    }
    
    if (data.pool && this.memoryPool) {
      this.memoryPool.import(data.pool);
    }
    
    return { success: true };
  }
  
  setApiConfig(config) {
    this.apiConfig = config;
    if (this.classifier) {
      this.classifier.setApiConfig(config);
    }
    if (this.embeddingEngine) {
      this.embeddingEngine.setApiConfig?.(config);
    }
  }
}

if (typeof window !== 'undefined') {
  window.UnifiedMemorySystem = UnifiedMemorySystem;
}
