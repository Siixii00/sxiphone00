class MemoryManager {
  constructor(options = {}) {
    this.memoryStore = options.memoryStore || null;
    this.embeddingEngine = options.embeddingEngine || null;
    this.searchEngine = options.searchEngine || null;
    this.decayEngine = options.decayEngine || null;
    this.emotionTagger = options.emotionTagger || null;
    this.classifier = options.classifier || null;
    this.dimensionEncoder = options.dimensionEncoder || null;
    this.sleepEngine = options.sleepEngine || null;
    this.sleepScheduler = options.sleepScheduler || null;
    this.standardizer = options.standardizer || null;
    this.shortTermMemory = options.shortTermMemory || null;
    this.awakeningEngine = options.awakeningEngine || null;

    this.config = {
      autoEmbed: options.autoEmbed !== false,
      autoEmotion: options.autoEmotion !== false,
      autoMerge: options.autoMerge !== false,
      autoClassify: options.autoClassify !== false,
      autoEncode: options.autoEncode !== false,
      mergeThreshold: options.mergeThreshold || 0.75,
      maxBufferSize: options.maxBufferSize || 10,
      feelThreshold: options.feelThreshold || 3,
      shortTermDecayMinutes: options.shortTermDecayMinutes || 30,
      shortTermImportanceThreshold: options.shortTermImportanceThreshold || 6
    };

    this.buffer = [];
    this.isInitialized = false;
    this.apiConfig = options.apiConfig || null;
  }

  async initialize(progressCallback = null) {
    if (this.isInitialized) {
      console.log('[MemoryManager] 已初始化');
      return true;
    }

    try {
      if (progressCallback) progressCallback({ stage: 'store', progress: 10 });

      if (!this.memoryStore) {
        this.memoryStore = new MemoryStore();
      }
      await this.memoryStore.init();

      if (progressCallback) progressCallback({ stage: 'embedding', progress: 30 });

      if (!this.embeddingEngine) {
        this.embeddingEngine = new EmbeddingEngine({ memoryStore: this.memoryStore });
      }
      
      try {
        await this.embeddingEngine.initialize((p) => {
          if (progressCallback) {
            progressCallback({ 
              stage: 'embedding_model', 
              progress: 30 + Math.round(p.progress * 0.4) 
            });
          }
        });
        console.log('[MemoryManager] EmbeddingEngine 初始化成功');
      } catch (e) {
        console.warn('[MemoryManager] EmbeddingEngine 初始化失敗，將使用降級模式:', e);
      }

      if (progressCallback) progressCallback({ stage: 'search', progress: 70 });

      if (!this.searchEngine) {
        this.searchEngine = new SearchEngine({
          memoryStore: this.memoryStore,
          embeddingEngine: this.embeddingEngine
        });
      }
      await this.searchEngine.initialize();

      if (progressCallback) progressCallback({ stage: 'decay', progress: 80 });

      if (!this.decayEngine) {
        this.decayEngine = new DecayEngine({ memoryStore: this.memoryStore });
      }

      if (progressCallback) progressCallback({ stage: 'emotion', progress: 90 });

      if (!this.emotionTagger) {
        this.emotionTagger = new EmotionTagger();
      }

      if (progressCallback) progressCallback({ stage: 'classifier', progress: 92 });

      if (!this.classifier && typeof MemoryClassifier !== 'undefined') {
        this.classifier = new MemoryClassifier({ apiConfig: this.apiConfig });
      }

      if (progressCallback) progressCallback({ stage: 'encoder', progress: 94 });

      if (!this.dimensionEncoder && typeof DimensionEncoder !== 'undefined') {
        this.dimensionEncoder = new DimensionEncoder({ emotionTagger: this.emotionTagger });
      }

      if (progressCallback) progressCallback({ stage: 'standardizer', progress: 96 });

      if (!this.standardizer && typeof MemoryStandardizer !== 'undefined') {
        this.standardizer = new MemoryStandardizer();
      }

      if (progressCallback) progressCallback({ stage: 'sleep', progress: 98 });

      if (!this.sleepEngine && typeof SleepEngine !== 'undefined') {
        this.sleepEngine = new SleepEngine({
          memoryStore: this.memoryStore,
          classifier: this.classifier,
          standardizer: this.standardizer,
          embeddingEngine: this.embeddingEngine,
          shortTermMemory: this.shortTermMemory,
          shortTermDecayMinutes: this.config.shortTermDecayMinutes,
          shortTermImportanceThreshold: this.config.shortTermImportanceThreshold
        });
      }

      if (!this.sleepScheduler && typeof SleepScheduler !== 'undefined' && this.sleepEngine) {
        this.sleepScheduler = new SleepScheduler(this.sleepEngine);
      }

      if (!this.awakeningEngine && typeof AwakeningEngine !== 'undefined') {
        this.awakeningEngine = new AwakeningEngine({
          memoryStore: this.memoryStore,
          embeddingEngine: this.embeddingEngine,
          searchEngine: this.searchEngine,
          emotionTagger: this.emotionTagger
        });
      }

      this.searchEngine.decayEngine = this.decayEngine;

      this.isInitialized = true;
      console.log('[MemoryManager] 初始化完成');
      if (progressCallback) progressCallback({ stage: 'ready', progress: 100 });

      return true;
    } catch (error) {
      console.error('[MemoryManager] 初始化失敗:', error);
      throw error;
    }
  }

  async hold(content, options = {}) {
    if (!content || typeof content !== 'string') {
      throw new Error('無效的記憶內容');
    }

    const isFeel = options.feel === true;

    if (this.config.autoMerge && !isFeel) {
      const similar = await this._findSimilarMemory(content);
      if (similar) {
        console.log(`[MemoryManager] 發現相似記憶，嘗試合併: ${similar.id}`);
        return await this._mergeMemory(similar, content, options);
      }
    }

    let embedding = null;
    if (this.config.autoEmbed && this.embeddingEngine?.isInitialized) {
      try {
        embedding = await this.embeddingEngine.embed(content);
      } catch (e) {
        console.warn('[MemoryManager] 生成嵌入失敗:', e);
      }
    }

    let emotion = null;
    if (this.config.autoEmotion && this.emotionTagger) {
      try {
        const emotionResult = await this.emotionTagger.analyzeAuto(content);
        emotion = {
          valence: emotionResult.valence,
          arousal: emotionResult.arousal
        };
      } catch (e) {
        console.warn('[MemoryManager] 情感分析失敗:', e);
      }
    }

    let dimensions = null;
    if (this.config.autoEncode && this.dimensionEncoder) {
      try {
        dimensions = await this.dimensionEncoder.encode(content, {
          emotion,
          timestamp: options.timestamp,
          domain: options.domain,
          location: options.location
        });
      } catch (e) {
        console.warn('[MemoryManager] 維度編碼失敗:', e);
      }
    }

    let region = null;
    if (this.config.autoClassify && this.classifier) {
      try {
        const classifyResult = await this.classifier.classify(content, { skipLLM: true });
        region = {
          primary: classifyResult.primary,
          secondary: classifyResult.secondary || [],
          confidence: classifyResult.confidence || 0.5,
          distribution: classifyResult.distribution || {}
        };
      } catch (e) {
        console.warn('[MemoryManager] 記憶分類失敗:', e);
      }
    }

    let standardized = null;
    if (this.standardizer) {
      try {
        standardized = {
          summary: this.standardizer.generateSummary({ content })
        };
      } catch (e) {
        console.warn('[MemoryManager] 標準化失敗:', e);
      }
    }

    const memory = {
      content,
      embedding,
      emotion: emotion || options.emotion || { valence: 0.5, arousal: 0.5 },
      tags: options.tags || [],
      domain: options.domain || [],
      dimensions,
      region,
      standardized,
      metadata: {
        importance: options.importance || 5,
        type: isFeel ? 'feel' : (options.type || 'dynamic'),
        source: options.source || 'chat',
        pinned: options.pinned || false,
        resolved: options.resolved || false,
        digested: false,
        consolidated: false
      }
    };

    if (options.id) memory.id = options.id;
    if (options.metadata) {
      memory.metadata = { ...memory.metadata, ...options.metadata };
    }

    const created = await this.memoryStore.create(memory);

    this.buffer.push(created);
    if (this.buffer.length > this.config.maxBufferSize) {
      this.buffer.shift();
    }

    if (this.sleepEngine) {
      this.sleepEngine.enqueue(created.id);
    }

    console.log(`[MemoryManager] 記憶已存入: ${created.id}`);
    return created;
  }

  async grow(content, options = {}) {
    const segments = this._splitContent(content);
    const results = [];

    for (const segment of segments) {
      const memory = await this.hold(segment, {
        ...options,
        metadata: { ...options.metadata, source: 'diary' }
      });
      results.push(memory);
    }

    console.log(`[MemoryManager] 日記拆分為 ${results.length} 條記憶`);
    return results;
  }

  _splitContent(content) {
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);
    
    if (paragraphs.length > 1) {
      return paragraphs.map(p => p.trim()).filter(p => p.length >= 20);
    }

    const sentences = content.match(/[^。！？.!?]+[。！？.!?]+/g) || [content];
    const segments = [];
    let current = '';

    for (const sentence of sentences) {
      if ((current + sentence).length > 200) {
        if (current) segments.push(current.trim());
        current = sentence;
      } else {
        current += sentence;
      }
    }
    if (current) segments.push(current.trim());

    return segments.filter(s => s.length >= 20);
  }

  async breath(options = {}) {
    if (this.awakeningEngine) {
      const awakeningStatus = this.awakeningEngine.getAwakeningStatus();
      if (awakeningStatus.needsAwakening) {
        console.log('[MemoryManager] 偵測到新的一天，執行每日喚醒...');
        await this.dailyAwakening();
      }
    }

    const surfaced = await this.searchEngine.surface(options);

    const feels = options.includeFeels !== false
      ? await this.memoryStore.getByType('feel')
      : [];

    const result = {
      surfaced,
      feels: feels.slice(0, options.maxFeels || 5),
      timestamp: new Date().toISOString()
    };

    console.log(`[MemoryManager] Breath 返回 ${surfaced.length} 條浮現記憶, ${result.feels.length} 條 Feel`);
    return result;
  }

  async dailyAwakening() {
    if (!this.awakeningEngine) {
      console.warn('[MemoryManager] AwakeningEngine 未初始化');
      return null;
    }

    const awakeningResult = await this.awakeningEngine.dailyAwakening();
    
    if (awakeningResult.type === 'morning_recall') {
      console.log('[MemoryManager] 每日喚醒完成:', awakeningResult.summary?.text);
      
      window.dispatchEvent(new CustomEvent('sx-daily-awakening', {
        detail: awakeningResult
      }));
    }
    
    return awakeningResult;
  }

  async triggerRecallByKeyword(keyword, options = {}) {
    if (this.awakeningEngine) {
      return await this.awakeningEngine.triggerRecallByKeyword(keyword, options);
    }
    
    if (this.searchEngine) {
      return await this.search(keyword, options);
    }
    
    return [];
  }

  getMemoryContext() {
    if (this.awakeningEngine) {
      return this.awakeningEngine.getMemoryContext();
    }
    return null;
  }

  async search(query, options = {}) {
    return await this.searchEngine.search(query, options);
  }

  async trace(id, updates) {
    const memory = await this.memoryStore.read(id);
    if (!memory) {
      throw new Error(`記憶不存在: ${id}`);
    }

    const updated = await this.memoryStore.update(id, {
      ...updates,
      metadata: {
        ...updates.metadata,
        lastActive: new Date().toISOString(),
        activationCount: (memory.metadata?.activationCount || 1) + 1
      }
    });

    console.log(`[MemoryManager] 記憶已更新: ${id}`);
    return updated;
  }

  async pulse() {
    const stats = await this.decayEngine.getDecayStats();
    const recent = await this.memoryStore.getAll({ limit: 5 });

    return {
      stats,
      recent,
      bufferSize: this.buffer.length,
      isInitialized: this.isInitialized,
      timestamp: new Date().toISOString()
    };
  }

  async dream(options = {}) {
    const feels = await this.memoryStore.getByType('feel');
    
    if (feels.length < this.config.feelThreshold) {
      console.log('[MemoryManager] Feel 數量不足，無法結晶');
      return { crystallized: false, reason: 'insufficient_feels' };
    }

    const groups = await this._groupSimilarFeels(feels);

    const crystallized = [];
    for (const group of groups) {
      if (group.length >= this.config.feelThreshold) {
        const insight = await this._crystallizeGroup(group);
        if (insight) {
          crystallized.push(insight);
        }
      }
    }

    console.log(`[MemoryManager] Dream 結晶化 ${crystallized.length} 條洞察`);
    return {
      crystallized: true,
      insights: crystallized,
      groupsProcessed: groups.length
    };
  }

  async _findSimilarMemory(content) {
    if (!this.embeddingEngine?.isInitialized) {
      return null;
    }

    try {
      const embedding = await this.embeddingEngine.embed(content);
      const similar = await this.memoryStore.searchByEmbedding(embedding, 1);
      
      if (similar.length > 0 && similar[0].similarity >= this.config.mergeThreshold) {
        return similar[0];
      }
    } catch (e) {
      console.warn('[MemoryManager] 查找相似記憶失敗:', e);
    }

    return null;
  }

  async _mergeMemory(existing, newContent, options) {
    const mergedContent = this._mergeContent(existing.content, newContent);
    const mergedTags = [...new Set([...existing.tags, ...(options.tags || [])])];
    const mergedDomain = [...new Set([...existing.domain, ...(options.domain || [])])];

    const mergedEmotion = existing.emotion
      ? {
          valence: (existing.emotion.valence + (options.emotion?.valence || 0.5)) / 2,
          arousal: (existing.emotion.arousal + (options.emotion?.arousal || 0.5)) / 2
        }
      : options.emotion || { valence: 0.5, arousal: 0.5 };

    const updated = await this.memoryStore.update(existing.id, {
      content: mergedContent,
      tags: mergedTags,
      domain: mergedDomain,
      emotion: mergedEmotion,
      metadata: {
        importance: Math.max(existing.metadata?.importance || 5, options.importance || 5),
        activationCount: (existing.metadata?.activationCount || 1) + 1,
        lastActive: new Date().toISOString()
      }
    });

    console.log(`[MemoryManager] 記憶已合併: ${existing.id}`);
    return updated;
  }

  _mergeContent(existing, newContent) {
    if (existing.includes(newContent) || newContent.includes(existing)) {
      return existing.length > newContent.length ? existing : newContent;
    }

    const existingWords = new Set(existing.split(/\s+/));
    const newWords = newContent.split(/\s+/);
    const uniqueNewWords = newWords.filter(w => !existingWords.has(w));

    if (uniqueNewWords.length < 3) {
      return existing;
    }

    return `${existing}\n補充：${newContent}`;
  }

  async _groupSimilarFeels(feels) {
    const groups = [];
    const processed = new Set();

    for (const feel of feels) {
      if (processed.has(feel.id)) continue;

      const group = [feel];
      processed.add(feel.id);

      for (const other of feels) {
        if (processed.has(other.id)) continue;

        if (feel.embedding && other.embedding) {
          const similarity = this.embeddingEngine.cosineSimilarity(feel.embedding, other.embedding);
          if (similarity >= 0.6) {
            group.push(other);
            processed.add(other.id);
          }
        }
      }

      groups.push(group);
    }

    return groups;
  }

  async _crystallizeGroup(group) {
    const combinedContent = group.map(f => f.content).join('\n');
    
    const avgEmotion = {
      valence: group.reduce((sum, f) => sum + (f.emotion?.valence || 0.5), 0) / group.length,
      arousal: group.reduce((sum, f) => sum + (f.emotion?.arousal || 0.5), 0) / group.length
    };

    const insight = await this.hold(`【結晶洞察】${combinedContent.slice(0, 200)}`, {
      type: 'permanent',
      importance: 7,
      emotion: avgEmotion,
      tags: ['crystallized', 'insight'],
      domain: ['feel'],
      metadata: {
        source: 'dream',
        crystallizedFrom: group.map(f => f.id)
      }
    });

    return insight;
  }

  async pin(id) {
    await this.decayEngine.pinMemory(id);
  }

  async unpin(id) {
    await this.decayEngine.unpinMemory(id);
  }

  async resolve(id) {
    await this.trace(id, { metadata: { resolved: true } });
  }

  async remove(id) {
    await this.memoryStore.delete(id);
    this.buffer = this.buffer.filter(m => m.id !== id);
    console.log(`[MemoryManager] 記憶已刪除: ${id}`);
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
      console.log('[MemoryManager] 所有記憶都已向量化');
      return { total: allMemories.length, vectorized: 0, skipped: allMemories.length };
    }
    
    console.log(`[MemoryManager] 開始向量化 ${memoriesWithoutEmbedding.length} 條記憶...`);
    
    const batchSize = options.batchSize || 5;
    const results = { total: memoriesWithoutEmbedding.length, vectorized: 0, failed: 0, skipped: allMemories.length - memoriesWithoutEmbedding.length };
    
    for (let i = 0; i < memoriesWithoutEmbedding.length; i += batchSize) {
      const batch = memoriesWithoutEmbedding.slice(i, i + batchSize);
      
      for (const memory of batch) {
        try {
          const embedding = await this.embeddingEngine.embed(memory.content);
          await this.memoryStore.update(memory.id, { embedding });
          results.vectorized++;
          console.log(`[MemoryManager] 向量化進度: ${results.vectorized}/${results.total} (${memory.id})`);
          
          if (options.progressCallback) {
            options.progressCallback({
              current: results.vectorized,
              total: results.total,
              memoryId: memory.id
            });
          }
        } catch (e) {
          results.failed++;
          console.warn(`[MemoryManager] 向量化失敗: ${memory.id}`, e);
        }
      }
      
      if (options.delayBetweenBatches) {
        await new Promise(resolve => setTimeout(resolve, options.delayBetweenBatches));
      }
    }
    
    console.log(`[MemoryManager] 向量化完成: ${results.vectorized} 成功, ${results.failed} 失敗`);
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

  async export(format = 'json') {
    const memories = await this.memoryStore.getAll();
    
    if (format === 'json') {
      return JSON.stringify(memories, null, 2);
    }

    if (format === 'markdown') {
      return memories.map(m => 
        `## ${m.id}\n\n${m.content}\n\n- 重要性: ${m.metadata?.importance || 5}\n- 類型: ${m.metadata?.type || 'dynamic'}\n- 時間: ${m.metadata?.created || 'unknown'}\n`
      ).join('\n---\n\n');
    }

    return memories;
  }

  async importMemories(data, format = 'json') {
    let memories;

    if (format === 'json') {
      memories = JSON.parse(data);
    } else {
      throw new Error(`不支持的格式: ${format}`);
    }

    const results = [];
    for (const mem of memories) {
      try {
        const created = await this.hold(mem.content, {
          id: mem.id,
          tags: mem.tags,
          domain: mem.domain,
          emotion: mem.emotion,
          importance: mem.metadata?.importance,
          type: mem.metadata?.type,
          source: mem.metadata?.source || 'import'
        });
        results.push(created);
      } catch (e) {
        console.warn(`[MemoryManager] 導入失敗: ${mem.id}`, e);
      }
    }

    console.log(`[MemoryManager] 導入 ${results.length} 條記憶`);
    return results;
  }

  setConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('[MemoryManager] 配置已更新');
  }

  getStats() {
    return {
      isInitialized: this.isInitialized,
      bufferSize: this.buffer.length,
      config: this.config,
      embedding: this.embeddingEngine?.getStats(),
      search: {
        initialized: !!this.searchEngine
      },
      decay: this.decayEngine?.getConfig(),
      sleep: this.sleepEngine?.getStats(),
      classifier: !!this.classifier,
      dimensionEncoder: !!this.dimensionEncoder,
      standardizer: !!this.standardizer,
      awakening: this.awakeningEngine?.getAwakeningStatus()
    };
  }

  setApiConfig(config) {
    this.apiConfig = config;
    if (this.classifier) {
      this.classifier.setApiConfig(config);
    }
    console.log('[MemoryManager] API 配置已更新');
  }

  async triggerSleep(reason = 'manual') {
    if (!this.sleepEngine) {
      console.warn('[MemoryManager] SleepEngine 未初始化');
      return null;
    }
    return await this.sleepEngine.sleep(reason);
  }

  startSleepScheduler() {
    if (this.sleepScheduler) {
      this.sleepScheduler.start();
      console.log('[MemoryManager] SleepScheduler 已啟動');
    } else {
      console.warn('[MemoryManager] SleepScheduler 未初始化');
    }
  }

  stopSleepScheduler() {
    if (this.sleepScheduler) {
      this.sleepScheduler.stop();
      console.log('[MemoryManager] SleepScheduler 已停止');
    }
  }

  onConversationEnd() {
    if (this.sleepScheduler) {
      this.sleepScheduler.onConversationEnd();
    }
  }

  async generateMemoryReport(options = {}) {
    if (!this.standardizer) {
      console.warn('[MemoryManager] Standardizer 未初始化');
      return null;
    }

    const memories = await this.memoryStore.getAll(options);
    return await this.standardizer.generateReport(memories);
  }
}

if (typeof window !== 'undefined') {
  window.MemoryManager = MemoryManager;
}
