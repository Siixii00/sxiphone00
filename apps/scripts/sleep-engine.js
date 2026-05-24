class SleepEngine {
  constructor(options = {}) {
    this.memoryStore = options.memoryStore || null;
    this.classifier = options.classifier || null;
    this.standardizer = options.standardizer || null;
    this.embeddingEngine = options.embeddingEngine || null;
    this.chatMemoryIntegration = options.chatMemoryIntegration || null;
    this.shortTermMemory = options.shortTermMemory || null;

    this.config = {
      idleThreshold: options.idleThreshold || 300000,
      autoInterval: options.autoInterval || 3600000,
      batchSize: options.batchSize || 20,
      similarityThreshold: options.similarityThreshold || 0.75,
      patternThreshold: options.patternThreshold || 3,
      decayThreshold: options.decayThreshold || 0.3,
      socialMemoryLimit: options.socialMemoryLimit || 500,
      chatMemoryLimit: options.chatMemoryLimit || 1000,
      shortTermDecayMinutes: options.shortTermDecayMinutes || 30,
      shortTermImportanceThreshold: options.shortTermImportanceThreshold || 6
    };

    this.isRunning = false;
    this.lastSleepTime = null;
    this.sleepCount = 0;
    this.pendingQueue = [];
    this.sleepPhases = [
      'recall',
      'shortToLong',
      'classify',
      'consolidate',
      'crystallize',
      'decay',
      'socialMemories',
      'chatMemories',
      'wikiProcessing'
    ];
  }

  async sleep(trigger = 'auto', options = {}) {
    if (this.isRunning) {
      console.log('[SleepEngine] 休眠正在進行中，跳過');
      return { skipped: true, reason: 'already_running' };
    }

    if (!this.memoryStore) {
      console.warn('[SleepEngine] MemoryStore 未設置，嘗試從全域獲取');
      this.memoryStore = window.memoryStore;
      if (!this.memoryStore) {
        return { skipped: true, reason: 'no_store' };
      }
    }

    if (!this.embeddingEngine) {
      this.embeddingEngine = window.embeddingEngine;
    }
    
    if (!this.classifier) {
      this.classifier = window.memoryClassifier;
    }
    
    if (!this.shortTermMemory) {
      this.shortTermMemory = window.shortTermMemory;
    }

    this.isRunning = true;
    console.log(`[SleepEngine] 進入休眠模式，觸發原因: ${trigger}`);
    console.log(`[SleepEngine] 組件狀態: memoryStore=${!!this.memoryStore}, embeddingEngine=${!!this.embeddingEngine?.isInitialized}, classifier=${!!this.classifier}, shortTermMemory=${!!this.shortTermMemory?.isInitialized}`);

    const tasks = options.tasks || JSON.parse(localStorage.getItem('sx_ai_sleep_tasks') || '{"consolidate":true,"vectorize":true,"associate":true,"decay":true,"wiki":true}');

    const report = {
      trigger,
      startTime: new Date().toISOString(),
      phases: {}
    };

    try {
      console.log('[SleepEngine] Phase 1: Recall (建立關聯)');
      report.phases.recall = tasks.associate !== false ? await this.recall() : { skipped: true };
      
      console.log('[SleepEngine] Phase 2: ShortToLong (短期記憶轉長期)');
      report.phases.shortToLong = tasks.consolidate !== false ? await this.consolidateShortTermMemory() : { skipped: true };
      
      console.log('[SleepEngine] Phase 3: Classify (分類)');
      report.phases.classify = await this.classify();
      
      console.log('[SleepEngine] Phase 4: Consolidate (合併相似記憶)');
      report.phases.consolidate = await this.consolidate();
      
      console.log('[SleepEngine] Phase 5: Crystallize (結晶化)');
      report.phases.crystallize = await this.crystallize();
      
      console.log('[SleepEngine] Phase 6: Decay (衰變)');
      report.phases.decay = tasks.decay !== false ? await this.decay() : { skipped: true };
      
      console.log('[SleepEngine] Phase 7: SocialMemories (社交記憶向量化)');
      report.phases.socialMemories = tasks.vectorize !== false ? await this.processSocialMemories() : { skipped: true };
      
      console.log('[SleepEngine] Phase 8: ChatMemories (聊天記憶向量化)');
      report.phases.chatMemories = tasks.vectorize !== false ? await this.processChatMemories() : { skipped: true };
      
      console.log('[SleepEngine] Phase 9: WikiProcessing (Wiki處理)');
      report.phases.wikiProcessing = tasks.wiki !== false ? await this.processWikiEntries() : { skipped: true };

      report.endTime = new Date().toISOString();
      report.duration = Date.parse(report.endTime) - Date.parse(report.startTime);
      report.success = true;

      this.lastSleepTime = report.endTime;
      this.sleepCount++;

      this._markAwakeningNeeded();

      console.log(`[SleepEngine] 休眠完成，耗時 ${report.duration}ms`);
      console.log('[SleepEngine] 報告:', JSON.stringify(report.phases, null, 2));
      
      if (options.autoBackup !== false) {
        await this._autoBackup(report);
      }
      
      return report;
    } catch (error) {
      console.error('[SleepEngine] 休眠過程出錯:', error);
      report.error = error.message;
      report.success = false;
      return report;
    } finally {
      this.isRunning = false;
    }
  }

  async consolidateShortTermMemory() {
    const result = {
      loaded: 0,
      vectorized: 0,
      classified: 0,
      reinforced: 0,
      stored: 0,
      failed: 0
    };

    let shortTermMemory = this.shortTermMemory || window.shortTermMemory;
    if (!shortTermMemory || !shortTermMemory.isInitialized) {
      console.log('[SleepEngine] Phase 2 - ShortToLong: ShortTermMemory 未初始化');
      
      if (typeof ShortTermMemory !== 'undefined') {
        try {
          shortTermMemory = new ShortTermMemory({
            maxCapacity: 100,
            decayMinutes: this.config.shortTermDecayMinutes,
            importanceThreshold: this.config.shortTermImportanceThreshold
          });
          shortTermMemory.initialize();
          window.shortTermMemory = shortTermMemory;
          this.shortTermMemory = shortTermMemory;
          console.log('[SleepEngine] Phase 2 - ShortToLong: 已創建 ShortTermMemory');
        } catch (e) {
          console.warn('[SleepEngine] Phase 2 - ShortToLong: ShortTermMemory 創建失敗:', e);
          return result;
        }
      } else {
        return result;
      }
    }

    try {
      const readyMemories = shortTermMemory.getReadyForConsolidation();
      result.loaded = readyMemories ? readyMemories.length : 0;

      if (!readyMemories || readyMemories.length === 0) {
        console.log('[SleepEngine] Phase 2 - ShortToLong: 無需鞏固的記憶');
        return result;
      }

      console.log(`[SleepEngine] Phase 2 - ShortToLong: ${readyMemories.length} 條待處理`);

      const consolidatedIds = [];

      for (const entry of readyMemories) {
        try {
          let embedding = null;
          
          if (this.embeddingEngine && this.embeddingEngine.isInitialized) {
            try {
              embedding = await Promise.race([
                this.embeddingEngine.embed(entry.content),
                new Promise((_, reject) => setTimeout(() => reject(new Error('向量化超時')), 10000))
              ]);
              result.vectorized++;
            } catch (e) {
              console.warn('[SleepEngine] 向量化失敗，使用降級:', e.message);
              embedding = this._simpleHashEmbedding(entry.content);
            }
          } else {
            embedding = this._simpleHashEmbedding(entry.content);
          }

          let region = null;
          if (this.classifier) {
            try {
              const classifyResult = await this.classifier.classify(entry.content, { skipLLM: true });
              region = {
                primary: classifyResult.primary,
                secondary: classifyResult.secondary || [],
                confidence: classifyResult.confidence || 0.5
              };
              result.classified++;
            } catch (e) {
              console.warn('[SleepEngine] 分類失敗:', e.message);
            }
          }

          const emotion = entry.emotion || this._analyzeChatEmotion(entry.content);

          const existingSimilar = await this._findSimilarLongTermMemory(entry.content, embedding);
          if (existingSimilar) {
            await this._reinforceMemory(existingSimilar, entry, embedding);
            result.reinforced++;
            consolidatedIds.push(entry.id);
            continue;
          }

          const memory = await this.memoryStore.create({
            content: entry.content,
            embedding,
            emotion,
            tags: ['short_term_consolidated', entry.role, entry.source, ...entry.tags],
            domain: [entry.source, 'consolidated'],
            region,
            metadata: {
              type: 'dynamic',
              importance: entry.importance,
              source: entry.source,
              originalId: entry.id,
              originalCreatedAt: entry.createdAt,
              consolidatedAt: new Date().toISOString(),
              accessCount: entry.accessCount,
              activationCount: 1,
              reinforcementCount: 0,
              lastReinforced: null,
              consolidated: true,
              sleepSession: this.sleepCount,
              memoryStrength: this._calculateInitialStrength(entry)
            }
          });

          consolidatedIds.push(entry.id);
          result.stored++;

          if (result.stored % 10 === 0) {
            console.log(`[SleepEngine] Phase 2 進度: ${result.stored}/${result.loaded}`);
          }
        } catch (e) {
          console.warn(`[SleepEngine] 鞏固失敗: ${entry.id}`, e.message);
          result.failed++;
        }
      }

      if (shortTermMemory.markConsolidated) {
        shortTermMemory.markConsolidated(consolidatedIds);
      }

      console.log(`[SleepEngine] Phase 2 - ShortToLong: ${result.stored} 新建, ${result.reinforced} 強化, ${result.vectorized} 向量化, ${result.failed} 失敗`);
    } catch (e) {
      console.error('[SleepEngine] Phase 2 - ShortToLong 整體錯誤:', e);
    }
    
    return result;
  }

  _calculateInitialStrength(entry) {
    let strength = 0.5;
    
    strength += (entry.importance || 5) * 0.05;
    
    if (entry.emotion) {
      const emotionIntensity = Math.abs(entry.emotion.valence - 0.5) + entry.emotion.arousal;
      strength += emotionIntensity * 0.1;
    }
    
    strength += Math.min(entry.accessCount || 1, 5) * 0.02;
    
    return Math.min(1, Math.max(0.1, strength));
  }

  async _findSimilarLongTermMemory(content, embedding) {
    if (!this.memoryStore || !embedding) return null;
    
    try {
      const similar = await this.memoryStore.searchByEmbedding(embedding, 3);
      for (const candidate of similar) {
        if (candidate.similarity >= 0.8) {
          return candidate;
        }
      }
    } catch (e) {
      console.warn('[SleepEngine] 查找相似長期記憶失敗:', e);
    }
    return null;
  }

  async _reinforceMemory(existing, shortTermEntry, newEmbedding) {
    const reinforcementCount = (existing.metadata?.reinforcementCount || 0) + 1;
    const currentStrength = existing.metadata?.memoryStrength || 0.5;
    
    const reinforcementBoost = 0.1 * Math.pow(0.8, reinforcementCount - 1);
    const newStrength = Math.min(1, currentStrength + reinforcementBoost);
    
    const mergedEmotion = {
      valence: (existing.emotion?.valence || 0.5) * 0.7 + (shortTermEntry.emotion?.valence || 0.5) * 0.3,
      arousal: Math.max(existing.emotion?.arousal || 0.5, shortTermEntry.emotion?.arousal || 0.5)
    };
    
    const mergedEmbedding = newEmbedding && existing.embedding
      ? this._mergeEmbeddings(existing.embedding, newEmbedding, reinforcementCount)
      : existing.embedding;
    
    const mergedTags = [...new Set([...(existing.tags || []), ...(shortTermEntry.tags || [])])];
    
    const contextAdditions = [];
    if (!existing.content.includes(shortTermEntry.content)) {
      contextAdditions.push(shortTermEntry.content);
    }
    const enrichedContent = contextAdditions.length > 0
      ? `${existing.content}\n[補充] ${contextAdditions.join('; ')}`
      : existing.content;
    
    await this.memoryStore.update(existing.id, {
      content: enrichedContent,
      embedding: mergedEmbedding,
      emotion: mergedEmotion,
      tags: mergedTags,
      metadata: {
        ...existing.metadata,
        importance: Math.max(existing.metadata?.importance || 5, shortTermEntry.importance || 5),
        activationCount: (existing.metadata?.activationCount || 1) + 1,
        reinforcementCount,
        lastReinforced: new Date().toISOString(),
        memoryStrength: newStrength,
        lastAccessed: new Date().toISOString(),
        reinforcedFrom: [...(existing.metadata?.reinforcedFrom || []), shortTermEntry.id].slice(-10)
      }
    });
    
    console.log(`[SleepEngine] 強化記憶: ${existing.id} (第 ${reinforcementCount} 次, 強度: ${newStrength.toFixed(2)})`);
  }

  _mergeEmbeddings(existing, newEmb, reinforcementCount) {
    const weight = 1 / (reinforcementCount + 1);
    const merged = [];
    for (let i = 0; i < existing.length; i++) {
      merged[i] = existing[i] * (1 - weight) + (newEmb[i] || 0) * weight;
    }
    
    let norm = 0;
    for (let i = 0; i < merged.length; i++) {
      norm += merged[i] * merged[i];
    }
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let i = 0; i < merged.length; i++) {
        merged[i] /= norm;
      }
    }
    
    return merged;
  }

  async recall() {
    const memories = await this.memoryStore.query({
      limit: this.config.batchSize,
      orderBy: 'created',
      order: 'desc'
    });

    const unconsolidated = memories.filter(m => !m.metadata?.consolidated);

    const associations = await this._buildAssociations(memories);

    console.log(`[SleepEngine] Phase 1 - Recall: ${memories.length} 條記憶, ${associations.length} 個關聯`);

    return {
      memoriesProcessed: memories.length,
      unconsolidated: unconsolidated.length,
      associationsFound: associations.length,
      associations: associations.slice(0, 10)
    };
  }

  async classify() {
    try {
      const allMemories = await this.memoryStore.getAll();
      const unclassified = allMemories.filter(m => !m.region?.primary);

      if (unclassified.length === 0) {
        console.log('[SleepEngine] Phase 2 - Classify: 無需分類的記憶');
        return { classified: 0, skipped: true };
      }

      let classified = 0;
      let failed = 0;

      const maxToProcess = Math.min(unclassified.length, this.config.batchSize);

      for (const memory of unclassified.slice(0, maxToProcess)) {
        try {
          if (!this.classifier) {
            continue;
          }

          const result = await this.classifier.classify(memory.content, { skipLLM: true });

          await this.memoryStore.update(memory.id, {
            region: {
              primary: result.primary,
              secondary: result.secondary || [],
              confidence: result.confidence || 0.5,
              distribution: result.distribution || {}
            }
          });

          classified++;
        } catch (e) {
          console.warn(`[SleepEngine] 分類失敗: ${memory.id}`, e.message);
          failed++;
        }
      }

      console.log(`[SleepEngine] Phase 2 - Classify: ${classified} 成功, ${failed} 失敗`);

      return { classified, failed, total: unclassified.length };
    } catch (e) {
      console.error('[SleepEngine] Phase 2 - Classify 整體錯誤:', e);
      return { classified: 0, failed: 0, error: e.message };
    }
  }

  async consolidate() {
    const memories = await this.memoryStore.getAll({ limit: 50 });

    if (memories.length < 2) {
      console.log('[SleepEngine] Phase 3 - Consolidate: 記憶數量不足');
      return { merged: 0, groupsFound: 0 };
    }

    const groups = await this._findSimilarGroups(memories);

    let merged = 0;
    let failed = 0;

    for (const group of groups) {
      if (group.length >= 2) {
        try {
          await this._mergeMemories(group);
          merged++;
        } catch (e) {
          console.warn('[SleepEngine] 合併失敗:', e);
          failed++;
        }
      }
    }

    console.log(`[SleepEngine] Phase 3 - Consolidate: ${groups.length} 組, ${merged} 合併成功`);

    return { groupsFound: groups.length, merged, failed };
  }

  async crystallize() {
    const memories = await this.memoryStore.getAll();

    const patterns = await this._detectPatterns(memories);

    let crystallized = 0;

    for (const pattern of patterns) {
      if (pattern.occurrences >= this.config.patternThreshold) {
        try {
          await this._createCrystallizedMemory(pattern);
          crystallized++;
        } catch (e) {
          console.warn('[SleepEngine] 結晶化失敗:', e);
        }
      }
    }

    const unconsolidated = memories.filter(m => !m.metadata?.consolidated);
    let markedConsolidated = 0;

    for (const memory of unconsolidated.slice(0, this.config.batchSize)) {
      try {
        const strength = memory.metadata?.memoryStrength || 0.5;
        const reinforcement = memory.metadata?.reinforcementCount || 0;
        
        await this.memoryStore.update(memory.id, {
          metadata: {
            consolidated: true,
            consolidatedAt: new Date().toISOString(),
            memoryStrength: Math.min(1, strength + 0.1 + reinforcement * 0.05)
          }
        });
        markedConsolidated++;
      } catch (e) {
        console.warn(`[SleepEngine] 標記鞏固失敗: ${memory.id}`, e);
      }
    }

    await this._strengthenReinforcedMemories(memories);

    console.log(`[SleepEngine] Phase 4 - Crystallize: ${patterns.length} 模式, ${crystallized} 結晶化, ${markedConsolidated} 鞏固`);

    return {
      patternsDetected: patterns.length,
      crystallized,
      markedConsolidated
    };
  }

  async _strengthenReinforcedMemories(memories) {
    const reinforced = memories.filter(m => (m.metadata?.reinforcementCount || 0) >= 2);
    
    for (const memory of reinforced) {
      try {
        const currentStrength = memory.metadata?.memoryStrength || 0.5;
        const reinforcementBonus = Math.min(0.1 * memory.metadata.reinforcementCount, 0.3);
        
        await this.memoryStore.update(memory.id, {
          metadata: {
            memoryStrength: Math.min(1, currentStrength + reinforcementBonus)
          }
        });
      } catch (e) {
        console.warn(`[SleepEngine] 強化記憶失敗: ${memory.id}`, e);
      }
    }
    
    if (reinforced.length > 0) {
      console.log(`[SleepEngine] 強化了 ${reinforced.length} 條被重複強調的記憶`);
    }
  }

  async decay() {
    const memories = await this.memoryStore.getAll();

    let archived = 0;
    let boosted = 0;

    for (const memory of memories) {
      if (memory.metadata?.type === 'archived' || memory.metadata?.pinned) {
        continue;
      }

      const score = this._calculateDecayScore(memory);

      if (score < this.config.decayThreshold && memory.metadata?.type !== 'permanent') {
        try {
          await this.memoryStore.update(memory.id, {
            metadata: { type: 'archived' },
            score
          });
          archived++;
        } catch (e) {
          console.warn(`[SleepEngine] 歸檔失敗: ${memory.id}`, e);
        }
      } else if (score > 50 && memory.metadata?.importance >= 7) {
        boosted++;
      }
    }

    console.log(`[SleepEngine] Phase 5 - Decay: ${archived} 歸檔, ${boosted} 高價值`);

    return { archived, boosted, total: memories.length };
  }

  async processSocialMemories() {
    const result = {
      facebook: { processed: 0, vectorized: 0, stored: 0 },
      twitter: { processed: 0, vectorized: 0, stored: 0 },
      instagram: { processed: 0, vectorized: 0, stored: 0 }
    };

    try {
      const fbMemories = this._loadSocialMemories('sx_fb_post_memories');
      result.facebook.processed = fbMemories.length;
      
      const twMemories = this._loadSocialMemories('sx_twitter_tweet_memories');
      result.twitter.processed = twMemories.length;
      
      const igMemories = this._loadSocialMemories('sx_instagram_post_memories');
      result.instagram.processed = igMemories.length;

      const allSocialMemories = [
        ...fbMemories.map(m => ({ ...m, platform: 'facebook' })),
        ...twMemories.map(m => ({ ...m, platform: 'twitter' })),
        ...igMemories.map(m => ({ ...m, platform: 'instagram' }))
      ];

      if (allSocialMemories.length === 0) {
        console.log('[SleepEngine] Phase 6 - SocialMemories: 無社交媒體記憶需處理');
        return result;
      }

      const alreadyVectorized = await this._getVectorizedIds();
      const unvectorized = allSocialMemories.filter(m => !alreadyVectorized.has(m.id));

      if (unvectorized.length === 0) {
        console.log('[SleepEngine] Phase 6 - SocialMemories: 所有記憶已向量化');
        return result;
      }

      console.log(`[SleepEngine] Phase 6 - SocialMemories: ${unvectorized.length} 條待向量化`);

      let processedCount = 0;
      const batchSize = 10;

      for (const memory of unvectorized) {
        try {
          if (processedCount >= this.config.batchSize) {
            console.log(`[SleepEngine] Phase 6 - 達到批次限制 ${this.config.batchSize}，暫停處理`);
            break;
          }

          const content = this._buildMemoryText(memory);
          let embedding = null;

          if (this.embeddingEngine && this.embeddingEngine.isInitialized) {
            try {
              embedding = await Promise.race([
                this.embeddingEngine.embed(content),
                new Promise((_, reject) => setTimeout(() => reject(new Error('超時')), 8000))
              ]);
            } catch (e) {
              console.warn('[SleepEngine] 社交記憶向量化失敗，使用哈希降維:', e.message);
              embedding = this._simpleHashEmbedding(content);
            }
          } else {
            embedding = this._simpleHashEmbedding(content);
          }

          await this.memoryStore.create({
            content,
            embedding,
            emotion: { valence: 0.5, arousal: 0.3 },
            tags: ['social_memory', memory.platform, memory.author || memory.user || 'unknown'],
            domain: [memory.platform, 'social_media'],
            metadata: {
              type: 'permanent',
              importance: 6,
              source: `${memory.platform}_memory`,
              socialMemoryId: memory.id,
              platform: memory.platform,
              originalDate: memory.date || '',
              consolidated: true,
              vectorizedAt: new Date().toISOString()
            }
          });

          if (memory.platform === 'facebook') result.facebook.vectorized++;
          if (memory.platform === 'twitter') result.twitter.vectorized++;
          if (memory.platform === 'instagram') result.instagram.vectorized++;
          
          processedCount++;
        } catch (e) {
          console.warn(`[SleepEngine] 社交記憶處理失敗: ${memory.id}`, e.message);
        }
      }

      result.facebook.stored = fbMemories.length;
      result.twitter.stored = twMemories.length;
      result.instagram.stored = igMemories.length;

      console.log(`[SleepEngine] Phase 6 - SocialMemories: FB=${result.facebook.vectorized}, TW=${result.twitter.vectorized}, IG=${result.instagram.vectorized} 已向量化`);
    } catch (e) {
      console.error('[SleepEngine] Phase 6 - SocialMemories 整體錯誤:', e);
    }

    return result;
  }

  async processChatMemories() {
    const result = {
      loaded: 0,
      vectorized: 0,
      classified: 0,
      pruned: 0,
      summarized: 0
    };

    try {
      if (!this.chatMemoryIntegration) {
        if (typeof ChatMemoryIntegration !== 'undefined') {
          try {
            this.chatMemoryIntegration = new ChatMemoryIntegration({
              memoryStore: this.memoryStore,
              embeddingEngine: this.embeddingEngine,
              classifier: this.classifier
            });
            await this.chatMemoryIntegration.initialize();
          } catch (e) {
            console.warn('[SleepEngine] Phase 7 - ChatMemoryIntegration 初始化失敗:', e);
            return result;
          }
        } else {
          console.log('[SleepEngine] Phase 7 - ChatMemories: ChatMemoryIntegration 未定義');
          return result;
        }
      }

      const chatSessions = this._loadChatSessions();
      result.loaded = chatSessions.length;

      console.log(`[SleepEngine] Phase 7 - ChatMemories: ${chatSessions.length} 個聊天會話`);

      const allChatMemories = [];
      for (const session of chatSessions) {
        if (!session.history || session.history.length === 0) continue;

        for (const message of session.history) {
          try {
            const content = this._extractChatText(message.content);
            if (content.length < 10) continue;

            allChatMemories.push({
              id: `chat_${session.id}_${message.id || Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
              content: this._buildChatMemoryText(message, session),
              rawContent: content,
              role: message.role,
              sessionId: session.id,
              sessionTitle: session.title,
              timestamp: message.timestamp || session.createdAt || new Date().toISOString()
            });
          } catch (e) {
            console.warn('[SleepEngine] 提取聊天訊息失敗:', e);
          }
        }
      }

      if (allChatMemories.length === 0) {
        console.log('[SleepEngine] Phase 7 - ChatMemories: 無聊天記憶需處理');
        return result;
      }

      const alreadyVectorized = await this._getChatVectorizedIds();
      const toVectorize = allChatMemories.filter(m => !alreadyVectorized.has(m.id));

      console.log(`[SleepEngine] Phase 7 - ChatMemories: ${toVectorize.length} 條待向量化`);

      const maxToProcess = Math.min(toVectorize.length, this.config.batchSize * 2);
      
      for (let i = 0; i < maxToProcess; i++) {
        const memory = toVectorize[i];
        try {
          let embedding = null;

          if (this.embeddingEngine && this.embeddingEngine.isInitialized) {
            try {
              embedding = await Promise.race([
                this.embeddingEngine.embed(memory.content),
                new Promise((_, reject) => setTimeout(() => reject(new Error('超時')), 8000))
              ]);
            } catch (e) {
              console.warn('[SleepEngine] 聊天記憶向量化失敗，使用哈希降維:', e.message);
              embedding = this._simpleHashEmbedding(memory.content);
            }
          } else {
            embedding = this._simpleHashEmbedding(memory.content);
          }

          const emotion = this._analyzeChatEmotion(memory.rawContent);
          const importance = this._calculateChatImportance(memory.rawContent);
          const tags = this._extractChatTags(memory.rawContent, memory.role);

          await this.memoryStore.create({
            content: memory.content,
            embedding,
            emotion,
            tags: ['chat_memory', memory.role, ...tags],
            domain: ['chat', memory.sessionId],
            metadata: {
              type: 'chat_memory',
              importance,
              source: 'chat',
              sessionId: memory.sessionId,
              sessionTitle: memory.sessionTitle,
              role: memory.role,
              originalTimestamp: memory.timestamp,
              vectorizedAt: new Date().toISOString(),
              consolidated: false
            }
          });

          result.vectorized++;
        } catch (e) {
          console.warn(`[SleepEngine] 聊天記憶處理失敗: ${memory.id}`, e.message);
        }
      }

      if (this.classifier) {
        try {
          result.classified = await this._classifyChatMemories();
        } catch (e) {
          console.warn('[SleepEngine] 聊天記憶分類失敗:', e);
        }
      }

      try {
        result.pruned = await this._pruneOldChatMemories();
      } catch (e) {
        console.warn('[SleepEngine] 聊天記憶清理失敗:', e);
      }

      try {
        result.summarized = await this._createChatSummaries(chatSessions);
      } catch (e) {
        console.warn('[SleepEngine] 聊天摘要創建失敗:', e);
      }

      console.log(`[SleepEngine] Phase 7 - ChatMemories: ${result.vectorized} 向量化, ${result.classified} 分類, ${result.pruned} 清理`);
    } catch (e) {
      console.error('[SleepEngine] Phase 7 - ChatMemories 整體錯誤:', e);
    }

    return result;
  }

  _loadChatSessions() {
    try {
      const raw = localStorage.getItem('sx_chat_sessions');
      if (!raw) return [];
      const sessions = JSON.parse(raw);
      return Array.isArray(sessions) ? sessions : [];
    } catch {
      return [];
    }
  }

  _extractChatText(content) {
    if (typeof content === 'string') {
      return content.replace(/<[^>]*>/g, '').trim();
    }
    return '';
  }

  _buildChatMemoryText(message, session) {
    const role = message.role === 'user' ? '用戶' : (session.title || 'AI');
    const content = this._extractChatText(message.content);
    const timestamp = message.timestamp || new Date().toISOString();

    return `[聊天記憶] ${role} 在 ${timestamp} 說：${content}`;
  }

  async _getChatVectorizedIds() {
    const vectorized = new Set();
    try {
      const allMemories = await this.memoryStore.getAll();
      for (const m of allMemories) {
        if (m.metadata?.type === 'chat_memory' && m.metadata?.sessionId) {
          vectorized.add(m.id);
        }
      }
    } catch (e) {
      console.warn('[SleepEngine] 獲取已向量化聊天ID失敗:', e);
    }
    return vectorized;
  }

  _analyzeChatEmotion(content) {
    const emotion = { valence: 0.5, arousal: 0.5 };

    const positiveWords = ['開心', '快樂', '喜歡', '愛', '高興', '幸福', '美好', '太好了', '哈哈'];
    const negativeWords = ['難過', '傷心', '生氣', '討厭', '憤怒', '害怕', '擔心', '焦慮'];
    const highArousalWords = ['興奮', '激動', '憤怒', '驚訝', '震驚', '太棒了'];

    const text = content.toLowerCase();

    let positiveCount = positiveWords.filter(w => text.includes(w)).length;
    let negativeCount = negativeWords.filter(w => text.includes(w)).length;

    if (positiveCount > negativeCount) {
      emotion.valence = Math.min(1, 0.5 + positiveCount * 0.1);
    } else if (negativeCount > positiveCount) {
      emotion.valence = Math.max(0, 0.5 - negativeCount * 0.1);
    }

    let highCount = highArousalWords.filter(w => text.includes(w)).length;
    if (highCount > 0) {
      emotion.arousal = Math.min(1, 0.5 + highCount * 0.1);
    }

    return emotion;
  }

  _calculateChatImportance(content) {
    let importance = 5;

    if (content.length > 200) importance += 1;
    if (content.length > 500) importance += 1;

    const importantKeywords = ['重要', '記住', '不要忘記', '答應', '約定', '承諾', '永遠', '愛'];
    for (const kw of importantKeywords) {
      if (content.includes(kw)) importance += 1;
    }

    return Math.min(10, Math.max(1, importance));
  }

  _extractChatTags(content, role) {
    const tags = [role === 'user' ? 'user_message' : 'ai_response'];

    const emotionKeywords = {
      '開心': ['開心', '快樂', '哈哈', '笑', '高興'],
      '難過': ['難過', '傷心', '哭', '哭哭'],
      '生氣': ['生氣', '憤怒', '氣死', '可惡'],
      '愛': ['愛', '喜歡', '想你', '愛你']
    };

    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      if (keywords.some(kw => content.includes(kw))) {
        tags.push(emotion);
      }
    }

    return tags;
  }

  async _classifyChatMemories() {
    if (!this.classifier || !this.memoryStore) return 0;

    const allMemories = await this.memoryStore.getAll();
    const unclassified = allMemories.filter(m =>
      m.metadata?.type === 'chat_memory' &&
      !m.region?.primary
    );

    let classified = 0;

    for (const memory of unclassified.slice(0, this.config.batchSize)) {
      try {
        const result = await this.classifier.classify(memory.content, { skipLLM: true });

        await this.memoryStore.update(memory.id, {
          region: {
            primary: result.primary,
            secondary: result.secondary || [],
            confidence: result.confidence || 0.5
          }
        });

        classified++;
      } catch (e) {
        console.warn(`[SleepEngine] 聊天記憶分類失敗: ${memory.id}`, e);
      }
    }

    return classified;
  }

  async _pruneOldChatMemories() {
    if (!this.memoryStore) return 0;

    const allMemories = await this.memoryStore.getAll();
    const chatMemories = allMemories.filter(m => m.metadata?.type === 'chat_memory');

    if (chatMemories.length <= this.config.chatMemoryLimit) return 0;

    const toPrune = chatMemories.length - this.config.chatMemoryLimit;
    const sorted = chatMemories.sort((a, b) => {
      const impA = a.metadata?.importance || 5;
      const impB = b.metadata?.importance || 5;
      if (impA !== impB) return impA - impB;
      return new Date(a.metadata?.created) - new Date(b.metadata?.created);
    });

    let pruned = 0;
    for (const memory of sorted.slice(0, toPrune)) {
      try {
        if ((memory.metadata?.importance || 5) < 6) {
          await this.memoryStore.delete(memory.id);
          pruned++;
        }
      } catch (e) {
        console.warn(`[SleepEngine] 刪除聊天記憶失敗: ${memory.id}`, e);
      }
    }

    return pruned;
  }

  async _createChatSummaries(sessions) {
    let summarized = 0;

    for (const session of sessions.slice(0, 5)) {
      if (!session.history || session.history.length < 10) continue;

      try {
        const summary = {
          sessionId: session.id,
          sessionTitle: session.title,
          totalMessages: session.history.length,
          userMessages: session.history.filter(m => m.role === 'user').length,
          aiMessages: session.history.filter(m => m.role === 'assistant').length,
          summarizedAt: new Date().toISOString()
        };

        const summaryContent = `[聊天摘要] 會話「${session.title}」共有 ${session.history.length} 則訊息（用戶 ${summary.userMessages} 則，AI ${summary.aiMessages} 則）`;

        const existingSummary = await this.memoryStore.query({
          type: 'chat_summary',
          sessionId: session.id
        });

        if (existingSummary.length === 0) {
          await this.memoryStore.create({
            content: summaryContent,
            tags: ['chat_summary', session.id],
            domain: ['chat', 'summary'],
            metadata: {
              type: 'chat_summary',
              importance: 7,
              source: 'sleep_summary',
              sessionId: session.id,
              sessionTitle: session.title,
              summaryData: summary,
              consolidated: true
            }
          });
          summarized++;
        }
      } catch (e) {
        console.warn(`[SleepEngine] 創建聊天摘要失敗: ${session.id}`, e);
      }
    }

    return summarized;
  }

  _loadSocialMemories(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  _buildMemoryText(memory) {
    const platform = memory.platform || 'unknown';
    const author = memory.author || memory.user || '未知';
    const date = memory.date || '未知日期';
    const text = memory.text || memory.content || memory.caption || '';

    if (platform === 'facebook') {
      return `[臉書記憶] ${author}在${date}發了一篇貼文：${text}`;
    }
    if (platform === 'twitter') {
      return `[推特記憶] ${author}在${date}發了一則推文：${text}`;
    }
    if (platform === 'instagram') {
      return `[Instagram記憶] ${author}在${date}發了一則貼文：${text}`;
    }
    return `[${platform}記憶] ${author}在${date}：${text}`;
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

  async _getVectorizedIds() {
    const vectorized = new Set();
    try {
      const allMemories = await this.memoryStore.getAll();
      for (const m of allMemories) {
        if (m.metadata?.source?.endsWith('_memory') && m.metadata?.socialMemoryId) {
          vectorized.add(m.metadata.socialMemoryId);
        }
      }
    } catch (e) {
      console.warn('[SleepEngine] 獲取已向量化ID失敗:', e);
    }
    return vectorized;
  }

  async _syncToCloud(memories) {
    try {
      const githubToken = localStorage.getItem('sx_github_token');
      const githubRepo = localStorage.getItem('sx_github_repo_name') || localStorage.getItem('sx_github_repo') || 'sxiphone-backup';
      
      if (!githubToken || !githubRepo) {
        console.log('[SleepEngine] 未連接 GitHub，跳過雲端同步');
        return;
      }

      const payload = {
        syncedAt: new Date().toISOString(),
        count: memories.length,
        memories: memories.map(m => ({
          id: m.id,
          platform: m.platform,
          author: m.author || m.user,
          date: m.date,
          text: m.text || m.content || m.caption,
          timestamp: m.timestamp
        }))
      };

      const path = `data/social_memories_${new Date().toISOString().split('T')[0]}.json`;
      
      const response = await fetch(`https://api.github.com/repos/${githubRepo}/contents/${path}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `[sleep] 同步社交媒體記憶 ${payload.count} 條`,
          content: btoa(unescape(encodeURIComponent(JSON.stringify(payload, null, 2))))
        })
      });

      if (response.ok) {
        console.log(`[SleepEngine] 雲端同步成功: ${payload.count} 條記憶`);
      } else {
        console.warn('[SleepEngine] 雲端同步失敗:', response.status);
      }
    } catch (e) {
      console.warn('[SleepEngine] 雲端同步出錯:', e);
    }
  }

  async _buildAssociations(memories) {
    const associations = [];

    for (let i = 0; i < memories.length; i++) {
      for (let j = i + 1; j < memories.length; j++) {
        const memA = memories[i];
        const memB = memories[j];

        if (memA.embedding && memB.embedding && this.embeddingEngine) {
          const similarity = this._cosineSimilarity(memA.embedding, memB.embedding);

          if (similarity >= this.config.similarityThreshold) {
            associations.push({
              memoryA: memA.id,
              memoryB: memB.id,
              similarity,
              type: 'semantic',
              strength: similarity
            });
          }
        }

        if (memA.domain && memB.domain) {
          const commonDomains = memA.domain.filter(d => memB.domain.includes(d));
          if (commonDomains.length > 0) {
            associations.push({
              memoryA: memA.id,
              memoryB: memB.id,
              commonDomains,
              type: 'domain',
              strength: commonDomains.length * 0.3
            });
          }
        }

        if (memA.emotion && memB.emotion) {
          const emotionSimilarity = this._calculateEmotionSimilarity(memA.emotion, memB.emotion);
          if (emotionSimilarity > 0.7) {
            associations.push({
              memoryA: memA.id,
              memoryB: memB.id,
              emotionSimilarity,
              type: 'emotion',
              strength: emotionSimilarity * 0.5
            });
          }
        }

        if (memA.metadata?.created && memB.metadata?.created) {
          const timeDiff = Math.abs(
            new Date(memA.metadata.created).getTime() - 
            new Date(memB.metadata.created).getTime()
          ) / (1000 * 60 * 60);
          
          if (timeDiff < 24) {
            associations.push({
              memoryA: memA.id,
              memoryB: memB.id,
              hoursApart: timeDiff,
              type: 'temporal',
              strength: Math.max(0.3, 1 - timeDiff / 24)
            });
          }
        }

        if (memA.tags && memB.tags) {
          const commonTags = memA.tags.filter(t => memB.tags.includes(t));
          if (commonTags.length >= 2) {
            associations.push({
              memoryA: memA.id,
              memoryB: memB.id,
              commonTags,
              type: 'tag',
              strength: commonTags.length * 0.2
            });
          }
        }
      }
    }

    await this._storeAssociations(associations);

    return associations;
  }

  _calculateEmotionSimilarity(emotionA, emotionB) {
    const valenceDiff = Math.abs((emotionA.valence || 0.5) - (emotionB.valence || 0.5));
    const arousalDiff = Math.abs((emotionA.arousal || 0.5) - (emotionB.arousal || 0.5));
    
    return 1 - (valenceDiff + arousalDiff) / 2;
  }

  async _storeAssociations(associations) {
    if (associations.length === 0) return;

    try {
      const existingRaw = await sxStorage.getItem('sx_memory_associations');
      const existing = existingRaw ? JSON.parse(existingRaw) : [];

      const associationMap = new Map();
      [...existing, ...associations].forEach(a => {
        const key = `${a.memoryA}:${a.memoryB}`;
        const existing = associationMap.get(key);
        if (!existing || a.strength > existing.strength) {
          associationMap.set(key, a);
        }
      });

      const merged = Array.from(associationMap.values()).slice(-1000);
      await sxStorage.setItem('sx_memory_associations', JSON.stringify(merged));

      console.log(`[SleepEngine] 儲存 ${associations.length} 個新聯想，總計 ${merged.length} 個`);
    } catch (e) {
      console.warn('[SleepEngine] 儲存聯想失敗:', e);
    }
  }

  async getAssociatedMemories(memoryId, options = {}) {
    try {
      const raw = localStorage.getItem('sx_memory_associations');
      if (!raw) return [];
      
      const associations = JSON.parse(raw);
      const related = associations.filter(
        a => a.memoryA === memoryId || a.memoryB === memoryId
      );
      
      const results = [];
      for (const assoc of related) {
        const otherId = assoc.memoryA === memoryId ? assoc.memoryB : assoc.memoryA;
        const memory = await this.memoryStore.read(otherId);
        if (memory) {
          results.push({
            ...memory,
            associationType: assoc.type,
            associationStrength: assoc.strength
          });
        }
      }
      
      results.sort((a, b) => b.associationStrength - a.associationStrength);
      return results.slice(0, options.limit || 10);
    } catch (e) {
      console.warn('[SleepEngine] 獲取關聯記憶失敗:', e);
      return [];
    }
  }

  async _findSimilarGroups(memories) {
    const groups = [];
    const processed = new Set();

    for (const memory of memories) {
      if (processed.has(memory.id)) continue;
      if (!memory.embedding) continue;

      const group = [memory];
      processed.add(memory.id);

      for (const other of memories) {
        if (processed.has(other.id)) continue;
        if (!other.embedding) continue;

        const similarity = this._cosineSimilarity(memory.embedding, other.embedding);

        if (similarity >= this.config.similarityThreshold) {
          group.push(other);
          processed.add(other.id);
        }
      }

      if (group.length >= 2) {
        groups.push(group);
      }
    }

    return groups;
  }

  async _mergeMemories(group) {
    if (group.length < 2) return;

    const sorted = group.sort((a, b) => {
      const impA = a.metadata?.importance || 5;
      const impB = b.metadata?.importance || 5;
      return impB - impA;
    });

    const primary = sorted[0];
    const others = sorted.slice(1);

    const mergedContent = [primary.content];
    const mergedTags = [...(primary.tags || [])];
    const mergedDomains = [...(primary.domain || [])];

    for (const other of others) {
      if (!primary.content.includes(other.content)) {
        mergedContent.push(other.content);
      }

      for (const tag of other.tags || []) {
        if (!mergedTags.includes(tag)) {
          mergedTags.push(tag);
        }
      }

      for (const domain of other.domain || []) {
        if (!mergedDomains.includes(domain)) {
          mergedDomains.push(domain);
        }
      }
    }

    const avgEmotion = {
      valence: group.reduce((sum, m) => sum + (m.emotion?.valence || 0.5), 0) / group.length,
      arousal: group.reduce((sum, m) => sum + (m.emotion?.arousal || 0.5), 0) / group.length
    };

    const maxImportance = Math.max(...group.map(m => m.metadata?.importance || 5));

    await this.memoryStore.update(primary.id, {
      content: mergedContent.join('\n---\n'),
      tags: mergedTags,
      domain: mergedDomains,
      emotion: avgEmotion,
      metadata: {
        importance: maxImportance,
        mergedFrom: others.map(m => m.id),
        mergedAt: new Date().toISOString()
      }
    });

    for (const other of others) {
      await this.memoryStore.update(other.id, {
        metadata: {
          type: 'merged',
          mergedInto: primary.id
        }
      });
    }

    console.log(`[SleepEngine] 合併 ${group.length} 條記憶到 ${primary.id}`);
  }

  async _detectPatterns(memories) {
    const patterns = [];
    const contentMap = new Map();

    for (const memory of memories) {
      if (memory.metadata?.type === 'archived' || memory.metadata?.type === 'merged') {
        continue;
      }

      const keywords = this._extractKeywords(memory.content);

      for (const keyword of keywords) {
        if (!contentMap.has(keyword)) {
          contentMap.set(keyword, []);
        }
        contentMap.get(keyword).push(memory);
      }
    }

    for (const [keyword, relatedMemories] of contentMap) {
      if (relatedMemories.length >= this.config.patternThreshold) {
        patterns.push({
          keyword,
          occurrences: relatedMemories.length,
          memories: relatedMemories,
          avgImportance: relatedMemories.reduce((sum, m) => sum + (m.metadata?.importance || 5), 0) / relatedMemories.length
        });
      }
    }

    patterns.sort((a, b) => b.occurrences - a.occurrences);

    return patterns.slice(0, 10);
  }

  _extractKeywords(content) {
    const stopWords = new Set(['的', '是', '在', '了', '和', '有', '我', '你', '他', '她', '它', '們', '這', '那', '就', '也', '都', '會', '能', '要', '可以', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'this', 'that', 'these', 'those']);

    const words = content.toLowerCase().match(/[\u4e00-\u9fa5]+|[a-z]+/g) || [];

    const keywords = [];
    const seen = new Set();

    for (const word of words) {
      if (word.length < 2) continue;
      if (stopWords.has(word)) continue;
      if (seen.has(word)) continue;

      seen.add(word);
      keywords.push(word);
    }

    return keywords.slice(0, 10);
  }

  async _createCrystallizedMemory(pattern) {
    const combinedContent = pattern.memories
      .map(m => m.content)
      .join('\n');

    const avgEmotion = {
      valence: pattern.memories.reduce((sum, m) => sum + (m.emotion?.valence || 0.5), 0) / pattern.memories.length,
      arousal: pattern.memories.reduce((sum, m) => sum + (m.emotion?.arousal || 0.5), 0) / pattern.memories.length
    };

    const crystallized = await this.memoryStore.create({
      content: `【結晶記憶】關於「${pattern.keyword}」的 ${pattern.occurrences} 次相關經歷：\n${combinedContent.slice(0, 500)}`,
      emotion: avgEmotion,
      tags: ['crystallized', pattern.keyword],
      domain: [...new Set(pattern.memories.flatMap(m => m.domain || []))],
      metadata: {
        type: 'permanent',
        importance: Math.min(10, Math.round(pattern.avgImportance + 2)),
        source: 'sleep_crystallization',
        crystallizedFrom: pattern.memories.map(m => m.id),
        crystallizedAt: new Date().toISOString(),
        consolidated: true
      }
    });

    console.log(`[SleepEngine] 創建結晶記憶: ${crystallized.id}`);
    return crystallized;
  }

  _calculateDecayScore(memory) {
    if (!memory || !memory.metadata) {
      return 0;
    }

    const now = Date.now();
    const lastActive = memory.metadata.lastActive
      ? new Date(memory.metadata.lastActive).getTime()
      : now;

    const daysSinceActive = (now - lastActive) / (1000 * 60 * 60 * 24);

    const importance = memory.metadata.importance || 5;
    const activationCount = memory.metadata.activationCount || 1;

    const timeWeight = Math.exp(-0.1 * daysSinceActive);

    const arousal = memory.emotion?.arousal || 0.5;
    const emotionWeight = 1.0 + arousal * 0.5;

    let score = importance *
      Math.pow(activationCount, 0.2) *
      Math.exp(-0.05 * daysSinceActive) *
      timeWeight *
      emotionWeight;

    if (memory.metadata.resolved) {
      score *= 0.1;
    }

    if (memory.metadata.type === 'feel') {
      score = Math.max(score, 30);
    }

    if (memory.metadata.type === 'permanent') {
      score = 100;
    }

    return score;
  }

  _cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  enqueue(memoryId) {
    if (!this.pendingQueue.includes(memoryId)) {
      this.pendingQueue.push(memoryId);
    }
  }

  _markAwakeningNeeded() {
    const now = Date.now();
    if (typeof sxStorage !== 'undefined' && sxStorage) {
      sxStorage.setItem('sx_sleep_completed_at', new Date().toISOString()).catch(() => {});
      sxStorage.setItem('sx_needs_awakening', 'true').catch(() => {});
      sxStorage.getItem('sx_daily_awakening_state').then(stateRaw => {
        if (stateRaw) {
          try {
            const state = JSON.parse(stateRaw);
            const today = new Date().toDateString();
            if (state.date !== today) {
              sxStorage.removeItem('sx_daily_awakening_state').catch(() => {});
              console.log('[SleepEngine] 已清除舊的喚醒狀態，明日將重新執行晨間回溯');
            }
          } catch (_) {}
        }
      }).catch(() => {});
    }
    console.log('[SleepEngine] 已標記需要喚醒');
  }

  async _autoBackup(sleepReport) {
    const autoBackupEnabled = localStorage.getItem('sx_auto_backup_enabled') !== 'false';
    if (!autoBackupEnabled) {
      console.log('[SleepEngine] 自動備份已停用');
      return;
    }

    const backupTargets = [];
    
    const githubToken = localStorage.getItem('sx_github_token') || localStorage.getItem('sx_github_pat');
    if (githubToken) {
      backupTargets.push('github');
    }
    
    const supabaseUrl = localStorage.getItem('sx_supabase_url');
    const supabaseKey = localStorage.getItem('sx_supabase_key');
    if (supabaseUrl && supabaseKey) {
      backupTargets.push('supabase');
    }
    
    if (backupTargets.length === 0) {
      console.log('[SleepEngine] 未設定任何備份目標，跳過自動備份');
      return;
    }

    console.log(`[SleepEngine] 開始自動備份到: ${backupTargets.join(', ')}`);
    
    const backupResult = {
      github: null,
      supabase: null,
      errors: []
    };

    if (backupTargets.includes('github')) {
      try {
        const success = await this._backupToGitHub(sleepReport);
        backupResult.github = success ? 'success' : 'failed';
        if (success) {
          localStorage.setItem('sx_github_last_sync', new Date().toLocaleString());
        }
      } catch (e) {
        console.warn('[SleepEngine] GitHub 備份失敗:', e);
        backupResult.github = 'error';
        backupResult.errors.push(`GitHub: ${e.message}`);
      }
    }

    if (backupTargets.includes('supabase')) {
      try {
        const success = await this._backupToSupabase(sleepReport);
        backupResult.supabase = success ? 'success' : 'failed';
        if (success) {
          localStorage.setItem('sx_supabase_last_sync', new Date().toLocaleString());
        }
      } catch (e) {
        console.warn('[SleepEngine] Supabase 備份失敗:', e);
        backupResult.supabase = 'error';
        backupResult.errors.push(`Supabase: ${e.message}`);
      }
    }

    console.log('[SleepEngine] 自動備份完成:', backupResult);

    const hasSuccess = backupResult.github === 'success' || backupResult.supabase === 'success';
    if (hasSuccess && typeof UnifiedStorageManager !== 'undefined') {
      try {
        const manager = new UnifiedStorageManager();
        const cleanupResult = await manager.progressiveCleanupAfterBackup({ success: true, source: 'auto' });
        if (cleanupResult && !cleanupResult.skipped) {
          console.log('[SleepEngine] 漸進式清理完成，釋放空間:', cleanupResult.spaceReclaimed);
        }
      } catch (e) {
        console.warn('[SleepEngine] 漸進式清理失敗:', e);
      }
    }

    return backupResult;
  }

  async _backupToGitHub(sleepReport) {
    if (typeof UnifiedStorageManager === 'undefined') {
      console.warn('[SleepEngine] UnifiedStorageManager 未載入，使用舊方法');
      return this._legacyBackupToGitHub(sleepReport);
    }

    const token = localStorage.getItem('sx_github_token') || localStorage.getItem('sx_github_pat');
    if (!token) return false;

    try {
      const manager = new UnifiedStorageManager();
      
      const result = await manager.backupToGitHub({
        onStatus: (msg) => console.log('[SleepEngine] ' + msg)
      });

      if (result.success) {
        console.log('[SleepEngine] GitHub 備份成功' + (result.isSplit ? ' (分割 ' + result.partCount + ' 部分)' : ''));
        return true;
      }
      return false;
    } catch (e) {
      console.error('[SleepEngine] GitHub 備份錯誤:', e);
      return false;
    }
  }

  async _legacyBackupToGitHub(sleepReport) {
    const token = localStorage.getItem('sx_github_token') || localStorage.getItem('sx_github_pat');
    const repoName = localStorage.getItem('sx_github_repo_name') || localStorage.getItem('sx_github_repo') || 'sxiphone-backup';
    const filePath = localStorage.getItem('sx_github_backup_file') || 'backup/sxiphone.json';
    
    if (!token) return false;

    try {
      const userResp = await fetch('https://api.github.com/user', {
        headers: { Authorization: 'token ' + token }
      });
      
      if (!userResp.ok) {
        throw new Error('無法取得使用者資訊');
      }
      
      const userData = await userResp.json();
      const owner = userData.login;

      const allData = await this._collectBackupData();
      allData.sleepReport = {
        trigger: sleepReport.trigger,
        duration: sleepReport.duration,
        phases: sleepReport.phases,
        timestamp: sleepReport.endTime
      };

      const jsonStr = JSON.stringify(allData, null, 2);
      const contentBase64 = btoa(unescape(encodeURIComponent(jsonStr)));

      if (contentBase64.length > 1024 * 1024) {
        console.warn('[SleepEngine] 備份資料過大，跳過 GitHub 備份');
        return false;
      }

      let sha = null;
      try {
        const existing = await fetch('https://api.github.com/repos/' + owner + '/' + repoName + '/contents/' + filePath, {
          headers: { Authorization: 'token ' + token }
        });
        if (existing.ok) {
          const existingData = await existing.json();
          sha = existingData.sha;
        }
      } catch {}

      const uploadResp = await fetch('https://api.github.com/repos/' + owner + '/' + repoName + '/contents/' + filePath, {
        method: 'PUT',
        headers: { 
          Authorization: 'token ' + token, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          message: '[Auto Backup] 睡眠後自動備份 ' + new Date().toLocaleString(),
          content: contentBase64,
          sha
        })
      });

      if (!uploadResp.ok) {
        const errData = await uploadResp.json().catch(() => ({}));
        throw new Error(errData.message || '上傳失敗 (' + uploadResp.status + ')');
      }

      console.log('[SleepEngine] GitHub 備份成功');
      return true;
    } catch (e) {
      console.error('[SleepEngine] GitHub 備份錯誤:', e);
      throw e;
    }
  }

  async _backupToSupabase(sleepReport) {
    const url = localStorage.getItem('sx_supabase_url');
    const key = localStorage.getItem('sx_supabase_key');
    const table = localStorage.getItem('sx_supabase_table') || 'sxiphone_backups';

    if (!url || !key) return false;

    try {
      const allData = await this._collectBackupData();
      
      const payload = {
        id: `sleep_backup_${Date.now()}`,
        version: '3.0',
        exported_at: new Date().toISOString(),
        device: navigator.userAgent,
        data: allData,
        sleep_report: {
          trigger: sleepReport.trigger,
          duration: sleepReport.duration,
          phases: sleepReport.phases
        },
        user_id: localStorage.getItem('sx_user_name') || 'default'
      };

      const resp = await fetch(`${url}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        throw new Error(`Supabase 錯誤: ${resp.status}`);
      }

      console.log('[SleepEngine] Supabase 備份成功');
      return true;
    } catch (e) {
      console.error('[SleepEngine] Supabase 備份錯誤:', e);
      throw e;
    }
  }

  async _collectBackupData() {
    const data = {
      localStorage: {},
      sxStorage: {},
      memoryStats: null
    };

    // 掃描原生 localStorage 中非 sx_* 的 legacy key
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.startsWith('sx_') || key.startsWith('api_') || key.startsWith('sxiphone')) continue; // 已遷移至 sxStorage
      if (key === PWA_MANIFEST_KEY || key === PWA_ICON_KEY || key.startsWith('BOOT_ANIMATION')) continue;
      try {
        const value = localStorage.getItem(key);
        if (value && value.length < 512000) {
          data.localStorage[key] = value;
        }
      } catch {}
    }

    // 從 sxStorage 取所有 sx_* key → 補入備份資料
    if (typeof sxStorage !== 'undefined' && sxStorage) {
      try {
        const keys = await sxStorage.getAllKeys();
        for (const key of keys) {
          if (key.startsWith('sx_')) {
            try {
              const value = await sxStorage.getItem(key);
              if (value) data.sxStorage[key] = value;
            } catch {}
          }
        }
      } catch (e) {
        console.warn('[SleepEngine] _collectBackupData 讀取 sxStorage 失敗:', e);
      }
    }

    if (this.memoryStore) {
      try {
        const memories = await this.memoryStore.getAll();
        data.memoryStats = {
          totalMemories: memories.length,
          lastBackup: new Date().toISOString()
        };
      } catch {}
    }

    return data;
  }

  getStats() {
    return {
      isRunning: this.isRunning,
      lastSleepTime: this.lastSleepTime,
      sleepCount: this.sleepCount,
      pendingQueueSize: this.pendingQueue.length,
      config: { ...this.config }
    };
  }

  setConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('[SleepEngine] 配置已更新');
  }
}

class SleepScheduler {
  constructor(sleepEngine) {
    this.engine = sleepEngine;
    this.lastActivity = Date.now();
    this.timers = [];
    this.isStarted = false;
    this.nightlySleepTime = { hour: 23, minute: 0 };
    this.sleepState = {
      lastNightlySleep: null,
      lastScheduledSleep: null,
      totalSleeps: 0
    };
    this._loadSleepState();
  }

  _loadSleepState() {
    try {
      if (typeof sxStorage !== 'undefined' && sxStorage) {
        sxStorage.getItem('sx_sleep_scheduler_state').then(saved => {
          if (saved) {
            try {
              const data = JSON.parse(saved);
              this.sleepState = { ...this.sleepState, ...data };
              this.nightlySleepTime = data.nightlySleepTime || this.nightlySleepTime;
            } catch (_) {}
          }
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('[SleepScheduler] 載入狀態失敗:', e);
    }
  }

  _saveSleepState() {
    if (typeof sxStorage !== 'undefined' && sxStorage) {
      sxStorage.setItem('sx_sleep_scheduler_state', JSON.stringify({
        ...this.sleepState,
        nightlySleepTime: this.nightlySleepTime,
        savedAt: new Date().toISOString()
      })).catch(e => {
        console.warn('[SleepScheduler] _saveSleepState 失敗:', e);
      });
    }
  }

  start() {
    if (this.isStarted) {
      console.log('[SleepScheduler] 已啟動，跳過');
      return;
    }

    this.isStarted = true;

    this.timers.push(
      setInterval(async () => {
        try {
          await this.engine.sleep('scheduled');
        } catch (e) {
          console.error('[SleepScheduler] 定時休眠失敗:', e);
        }
      }, this.engine.config.autoInterval)
    );

    this.timers.push(
      setInterval(() => {
        const idle = Date.now() - this.lastActivity;
        if (idle >= this.engine.config.idleThreshold) {
          this.engine.sleep('idle').catch(e => {
            console.error('[SleepScheduler] 閒置休眠失敗:', e);
          });
        }
      }, 60000)
    );

    this._setupNightlySleep();
    this._setupActivityListeners();

    console.log('[SleepScheduler] 調度器已啟動');
  }

  _setupNightlySleep() {
    const loadSleepTime = () => {
      const savedStart = localStorage.getItem('sx_ai_sleep_start') || '23:00';
      const [hour, minute] = savedStart.split(':').map(Number);
      return { hour, minute };
    };
    
    const checkNightlySleep = () => {
      const sleepTime = loadSleepTime();
      this.nightlySleepTime = sleepTime;
      
      const enabled = localStorage.getItem('sx_ai_sleep_enabled') !== 'false';
      if (!enabled) {
        console.log('[SleepScheduler] 自動睡眠已停用');
        return;
      }
      
      const now = new Date();
      const target = new Date();
      target.setHours(this.nightlySleepTime.hour, this.nightlySleepTime.minute, 0, 0);
      
      if (now >= target) {
        const lastSleepDate = this.sleepState.lastNightlySleep 
          ? new Date(this.sleepState.lastNightlySleep).toDateString()
          : null;
        
        if (lastSleepDate === now.toDateString()) {
          target.setDate(target.getDate() + 1);
        }
      }
      
      const delay = target - now;
      
      if (this.nightlyTimer) {
        clearTimeout(this.nightlyTimer);
      }
      
      this.nightlyTimer = setTimeout(async () => {
        console.log('[SleepScheduler] 執行每晚睡眠...');
        console.log('[SleepScheduler] 開始短期記憶→長期記憶轉換與向量化...');
        
        try {
          const tasks = JSON.parse(localStorage.getItem('sx_ai_sleep_tasks') || '{"consolidate":true,"vectorize":true,"associate":true,"decay":true,"wiki":true}');
          
          const report = await this.engine.sleep('nightly', { tasks });
          console.log('[SleepScheduler] 每晚睡眠完成:', report.phases?.shortToLong);
          
          this.sleepState.lastNightlySleep = new Date().toISOString();
          this.sleepState.totalSleeps++;
          this._saveSleepState();
          
          this._notifySleepComplete(report);
        } catch (e) {
          console.error('[SleepScheduler] 每晚睡眠失敗:', e);
        }
        this._setupNightlySleep();
      }, delay);
      
      console.log(`[SleepScheduler] 下次每晚睡眠將在 ${target.toLocaleString()} 執行`);
    };
    
    checkNightlySleep();
    
    this.timers.push(
      setInterval(checkNightlySleep, 60000)
    );
    
    window.addEventListener('storage', (e) => {
      if (e.key === 'sx_ai_sleep_start' || e.key === 'sx_ai_sleep_enabled') {
        console.log('[SleepScheduler] 偵測到睡眠設定變更，重新排程');
        checkNightlySleep();
      }
    });
  }

  _notifySleepComplete(report) {
    const event = new CustomEvent('sx-sleep-complete', {
      detail: {
        trigger: report.trigger,
        phases: report.phases,
        duration: report.duration,
        success: report.success,
        timestamp: new Date().toISOString()
      }
    });
    window.dispatchEvent(event);

    if (typeof sxStorage !== 'undefined' && sxStorage) {
      sxStorage.setItem('sx_last_sleep_report', JSON.stringify({
        trigger: report.trigger,
        phases: report.phases,
        timestamp: new Date().toISOString()
      })).catch(e => {
        console.warn('[SleepScheduler] _notifySleepComplete 失敗:', e);
      });
    }
  }

  setNightlySleepTime(hour, minute) {
    this.nightlySleepTime = { hour, minute };
    this._setupNightlySleep();
    console.log(`[SleepScheduler] 每晚睡眠時間已設為 ${hour}:${minute.toString().padStart(2, '0')}`);
  }

  stop() {
    for (const timer of this.timers) {
      clearInterval(timer);
    }
    if (this.nightlyTimer) {
      clearTimeout(this.nightlyTimer);
    }
    this.timers = [];
    this.isStarted = false;
    console.log('[SleepScheduler] 調度器已停止');
  }

  _setupActivityListeners() {
    const updateActivity = () => {
      this.lastActivity = Date.now();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', updateActivity, { passive: true });
      window.addEventListener('keydown', updateActivity, { passive: true });
      window.addEventListener('click', updateActivity, { passive: true });
      window.addEventListener('scroll', updateActivity, { passive: true });
    }
  }

  onConversationEnd() {
    setTimeout(() => {
      this.engine.sleep('conversation_end').catch(e => {
        console.error('[SleepScheduler] 對話結束休眠失敗:', e);
      });
    }, 5000);
  }

  async manualTrigger() {
    return await this.engine.sleep('manual');
  }

  updateActivity() {
    this.lastActivity = Date.now();
  }

  getStatus() {
    return {
      isStarted: this.isStarted,
      lastActivity: new Date(this.lastActivity).toISOString(),
      idleTime: Date.now() - this.lastActivity,
      engineStats: this.engine.getStats()
    };
  }
}

SleepEngine.prototype.processWikiEntries = async function() {
    const result = {
      userEntries: 0,
      charEntries: 0,
      vectorized: 0,
      linked: 0,
      synced: 0,
      failed: 0
    };

    try {
      const wikiDB = await this._openWikiDB();
      if (!wikiDB) {
        console.log('[SleepEngine] Phase 8 - WikiProcessing: Wiki DB 未初始化');
        return result;
      }

      const userEntries = await this._getAllWikiEntries(wikiDB, 'user_entries');
      const charEntries = await this._getAllWikiEntries(wikiDB, 'char_entries');
      
      result.userEntries = userEntries.length;
      result.charEntries = charEntries.length;
      
      const allEntries = [...userEntries, ...charEntries];
      const unvectorized = allEntries.filter(e => !e.embedding || !e.vectorizedAt);
      
      console.log(`[SleepEngine] Phase 8 - WikiProcessing: ${unvectorized.length} 條待向量化`);

      for (const entry of unvectorized.slice(0, this.config.batchSize)) {
        try {
          let embedding = null;
          
          if (this.embeddingEngine && this.embeddingEngine.isInitialized) {
            try {
              embedding = await this.embeddingEngine.embed(entry.content);
            } catch (e) {
              embedding = this._simpleHashEmbedding(entry.content);
            }
          } else {
            embedding = this._simpleHashEmbedding(entry.content);
          }

          const storeName = entry.charId ? 'char_entries' : 'user_entries';
          await this._updateWikiEntry(wikiDB, storeName, entry.id, {
            embedding,
            vectorizedAt: new Date().toISOString(),
            keywords: this._extractWikiKeywords(entry.content),
            entities: this._extractWikiEntities(entry.content)
          });

          result.vectorized++;

          if (result.vectorized % 10 === 0) {
            console.log(`[SleepEngine] Phase 8 進度: ${result.vectorized}/${unvectorized.length}`);
          }
        } catch (e) {
          console.warn(`[SleepEngine] Wiki 條目向量化失敗: ${entry.id}`, e);
          result.failed++;
        }
      }

      const linkResult = await this._buildWikiLinks(wikiDB, allEntries);
      result.linked = linkResult;

      const syncResult = await this._syncWikiToCloud(wikiDB, allEntries);
      result.synced = syncResult;

      const generateResult = await this._generateCharWikiEntries(wikiDB);
      result.generated = generateResult;

      console.log(`[SleepEngine] Phase 8 - WikiProcessing: ${result.vectorized} 向量化, ${result.linked} 連結, ${result.synced} 同步, ${result.generated} 生成`);

      wikiDB.close();
    } catch (e) {
      console.error('[SleepEngine] Wiki 處理失敗:', e);
    }

    return result;
  };

  SleepEngine.prototype._generateCharWikiEntries = async function(wikiDB) {
    const result = { generated: 0, failed: 0 };
    
    try {
      const chars = await this._getAllWikiEntries(wikiDB, 'chars');
      if (!chars || chars.length === 0) {
        console.log('[SleepEngine] 沒有角色需要生成 Wiki');
        return result;
      }
      
      const charEntries = await this._getAllWikiEntries(wikiDB, 'char_entries');
      
      for (const char of chars) {
        const charId = char.id;
        const existingEntries = charEntries.filter(e => e.charId === charId);
        
        if (existingEntries.length >= 5) {
          console.log(`[SleepEngine] 角色 ${char.name} 已有 ${existingEntries.length} 條 Wiki，跳過生成`);
          continue;
        }
        
        const chatHistory = this._getRecentChatHistory(char.name);
        if (!chatHistory || chatHistory.length < 5) {
          console.log(`[SleepEngine] 角色 ${char.name} 聊天記錄不足，跳過生成`);
          continue;
        }
        
        const newEntries = await this._generateWikiFromChatHistory(char, chatHistory, existingEntries);
        
        for (const entry of newEntries) {
          try {
            entry.charId = charId;
            entry.id = `char_wiki_${charId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            entry.createdAt = new Date().toISOString();
            entry.updatedAt = new Date().toISOString();
            
            await this._addWikiEntry(wikiDB, 'char_entries', entry);
            result.generated++;
          } catch (e) {
            console.warn(`[SleepEngine] 添加 Wiki 條目失敗:`, e);
            result.failed++;
          }
        }
        
        console.log(`[SleepEngine] 角色 ${char.name} 生成了 ${newEntries.length} 條 Wiki`);
      }
    } catch (e) {
      console.error('[SleepEngine] Char Wiki 生成失敗:', e);
    }
    
    return result.generated;
  };

  SleepEngine.prototype._getRecentChatHistory = function(charName) {
    try {
      const sessionsRaw = localStorage.getItem('sx_chat_sessions');
      if (!sessionsRaw) return [];
      
      const sessions = JSON.parse(sessionsRaw);
      if (!Array.isArray(sessions)) return [];
      
      const allMessages = [];
      for (const session of sessions) {
        if (session.history && Array.isArray(session.history)) {
          allMessages.push(...session.history);
        }
      }
      
      const charNameLower = (charName || '').toLowerCase();
      const relevantMessages = allMessages.filter(msg => {
        const senderLower = (msg.sender || msg.role || '').toLowerCase();
        return senderLower.includes(charNameLower) || charNameLower.includes(senderLower) || msg.role === 'user';
      });
      
      return relevantMessages.slice(-30);
    } catch (e) {
      console.warn('[SleepEngine] 獲取聊天記錄失敗:', e);
      return [];
    }
  };

  SleepEngine.prototype._generateWikiFromChatHistory = async function(char, chatHistory, existingEntries) {
    const entries = [];
    
    const personality = char.personality || localStorage.getItem('sx_char_personality') || '';
    const background = char.background || localStorage.getItem('sx_char_background') || '';
    const userName = localStorage.getItem('sx_user_name') || 'User';
    
    const recentTopics = this._extractTopicsFromChat(chatHistory);
    const emotionalPatterns = this._extractEmotionalPatterns(chatHistory);
    const interactionPatterns = this._extractInteractionPatterns(chatHistory, char.name, userName);
    
    if (recentTopics.length > 0 && existingEntries.filter(e => e.category === 'conversations').length < 2) {
      entries.push({
        title: `與 ${userName} 的對話主題`,
        category: 'conversations',
        tags: ['對話', '主題', userName],
        content: `根據最近的對話記錄，${char.name} 和 ${userName} 常常討論以下主題：\n${recentTopics.map(t => `- ${t}`).join('\n')}\n\n這些對話反映了兩人之間的互動模式。`
      });
    }
    
    if (emotionalPatterns.length > 0 && existingEntries.filter(e => e.category === 'user_memories').length < 2) {
      entries.push({
        title: `情感表達模式`,
        category: 'user_memories',
        tags: ['情感', '性格', char.name],
        content: `${char.name} 在對話中展現了以下情感特質：\n${emotionalPatterns.map(p => `- ${p}`).join('\n')}\n\n${personality ? `性格設定：${personality}` : ''}`
      });
    }
    
    if (interactionPatterns.length > 0 && existingEntries.filter(e => e.category === 'daily').length < 2) {
      entries.push({
        title: `日常互動記錄`,
        category: 'daily',
        tags: ['日常', '互動', userName],
        content: `${char.name} 和 ${userName} 的日常互動模式：\n${interactionPatterns.map(p => `- ${p}`).join('\n')}\n\n這些互動展現了兩人之間的關係動態。`
      });
    }
    
    if (background && existingEntries.filter(e => e.category === 'world').length < 1) {
      entries.push({
        title: `背景故事`,
        category: 'world',
        tags: ['背景', '故事', '設定'],
        content: background
      });
    }
    
    return entries.slice(0, 3);
  };

  SleepEngine.prototype._extractTopicsFromChat = function(chatHistory) {
    const topics = [];
    const keywordPatterns = [
      { pattern: /聊到|討論|說到|提到|談到/g, extract: (msg) => msg.content.slice(0, 30) },
      { pattern: /喜歡|愛|偏好|最愛/g, extract: (msg) => `喜好: ${msg.content.slice(0, 20)}` },
      { pattern: /想去|要去|計劃|打算/g, extract: (msg) => `計劃: ${msg.content.slice(0, 20)}` }
    ];
    
    for (const msg of chatHistory.slice(-15)) {
      const content = msg.content || '';
      for (const { pattern, extract } of keywordPatterns) {
        if (pattern.test(content)) {
          topics.push(extract(msg));
          break;
        }
      }
    }
    
    return [...new Set(topics)].slice(0, 5);
  };

  SleepEngine.prototype._extractEmotionalPatterns = function(chatHistory) {
    const patterns = [];
    const emotionPatterns = [
      { pattern: /開心|快樂|高興|哈哈|嘻/g, label: '開心愉悅' },
      { pattern: /難過|傷心|哭|淚/g, label: '感性脆弱' },
      { pattern: /擔心|焦慮|緊張|不安/g, label: '關心體貼' },
      { pattern: /生氣|憤怒|不滿/g, label: '直率表達' },
      { pattern: /溫柔|體貼|關心|照顧/g, label: '溫柔體貼' },
      { pattern: /調侃|玩笑|逗|鬧/g, label: '幽默調皮' }
    ];
    
    for (const msg of chatHistory.slice(-20)) {
      const content = msg.content || '';
      for (const { pattern, label } of emotionPatterns) {
        if (pattern.test(content)) {
          patterns.push(label);
          break;
        }
      }
    }
    
    return [...new Set(patterns)].slice(0, 4);
  };

  SleepEngine.prototype._extractInteractionPatterns = function(chatHistory, charName, userName) {
    const patterns = [];
    
    const userMessages = chatHistory.filter(m => m.role === 'user' || m.sender === userName);
    const charMessages = chatHistory.filter(m => m.role === 'assistant' || (m.sender && m.sender.toLowerCase().includes(charName.toLowerCase())));
    
    if (userMessages.length > 0) {
      const avgUserLength = userMessages.reduce((sum, m) => sum + (m.content?.length || 0), 0) / userMessages.length;
      patterns.push(`${userName} 平均訊息長度: ${Math.round(avgUserLength)} 字`);
    }
    
    if (charMessages.length > 0) {
      const avgCharLength = charMessages.reduce((sum, m) => sum + (m.content?.length || 0), 0) / charMessages.length;
      patterns.push(`${charName} 平均回覆長度: ${Math.round(avgCharLength)} 字`);
    }
    
    const responseRatio = charMessages.length / (userMessages.length || 1);
    patterns.push(`互動比例: ${userName} ${userMessages.length} 則 / ${charName} ${charMessages.length} 則`);
    
    return patterns;
  };

  SleepEngine.prototype._addWikiEntry = async function(db, storeName, entry) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(entry);
      request.onsuccess = () => resolve(entry);
      request.onerror = () => reject(request.error);
    });
  };

SleepEngine.prototype._openWikiDB = async function() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('sx_personal_wiki', 1);
      request.onerror = () => resolve(null);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('user_entries')) {
          db.createObjectStore('user_entries', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('char_entries')) {
          db.createObjectStore('char_entries', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('chars')) {
          db.createObjectStore('chars', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('wiki_log')) {
          db.createObjectStore('wiki_log', { keyPath: 'id' });
        }
      };
    });
  };

SleepEngine.prototype._getAllWikiEntries = async function(db, storeName) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  };

SleepEngine.prototype._updateWikiEntry = async function(db, storeName, id, updates) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const entry = getRequest.result;
        if (!entry) {
          resolve(null);
          return;
        }
        
        const updated = { ...entry, ...updates };
        const putRequest = store.put(updated);
        putRequest.onsuccess = () => resolve(updated);
        putRequest.onerror = () => reject(putRequest.error);
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  };

SleepEngine.prototype._extractWikiKeywords = function(text) {
    if (!text) return [];
    
    const stopWords = new Set([
      '的', '是', '在', '了', '和', '有', '我', '你', '他', '她', '它', '們',
      '這', '那', '就', '也', '都', '會', '能', '要', '可以', '一個', '什麼',
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'
    ]);

    const chineseWords = text.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
    const englishWords = text.toLowerCase().match(/[a-z]{3,}/g) || [];

    const wordFreq = new Map();
    for (const word of [...chineseWords, ...englishWords]) {
      if (stopWords.has(word)) continue;
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    }

    return [...wordFreq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  };

SleepEngine.prototype._extractWikiEntities = function(text) {
    if (!text) return [];
    const entities = [];

    const personPattern = /([A-Z][a-z]+|[一-龥]{2,4})(?=\s*(?:說|問|想|覺得|告訴|提到))/g;
    const persons = text.match(personPattern) || [];
    persons.forEach(p => {
      if (!entities.find(e => e.name === p)) {
        entities.push({ name: p, type: 'person' });
      }
    });

    const datePattern = /(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日]?|\d{1,2}[-/]\d{1,2})/g;
    const dates = text.match(datePattern) || [];
    dates.forEach(d => {
      entities.push({ name: d, type: 'date' });
    });

    const locationPattern = /在([一-龥]{2,6})/g;
    let match;
    while ((match = locationPattern.exec(text)) !== null) {
      entities.push({ name: match[1], type: 'location' });
    }

    return entities;
  };

SleepEngine.prototype._buildWikiLinks = async function(db, entries) {
    let linked = 0;
    const threshold = 0.7;

    for (let i = 0; i < entries.length; i++) {
      const entryA = entries[i];
      if (!entryA.embedding) continue;

      const links = [];
      
      for (let j = i + 1; j < entries.length; j++) {
        const entryB = entries[j];
        if (!entryB.embedding) continue;

        const similarity = this._cosineSimilarity(entryA.embedding, entryB.embedding);
        
        if (similarity >= threshold) {
          links.push({
            id: entryB.id,
            similarity,
            title: entryB.title
          });
        }
      }

      if (links.length > 0) {
        const storeName = entryA.charId ? 'char_entries' : 'user_entries';
        try {
          await this._updateWikiEntry(db, storeName, entryA.id, {
            linkedMemories: links.slice(0, 5).map(l => l.id),
            linkScores: links.slice(0, 5)
          });
          linked++;
        } catch (e) {
          console.warn(`[SleepEngine] 更新 Wiki 連結失敗: ${entryA.id}`, e);
        }
      }
    }

    return linked;
  };

SleepEngine.prototype._syncWikiToCloud = async function(db, entries) {
    try {
      const githubToken = localStorage.getItem('sx_github_token');
      const githubRepo = localStorage.getItem('sx_github_repo_name') || localStorage.getItem('sx_github_repo') || 'sxiphone-backup';
      
      if (!githubToken || !githubRepo) {
        console.log('[SleepEngine] Wiki 同步: 未連接 GitHub，跳過');
        return 0;
      }

      const userEntries = entries.filter(e => !e.charId);
      const charEntries = entries.filter(e => e.charId);

      const userPayload = {
        syncedAt: new Date().toISOString(),
        count: userEntries.length,
        entries: userEntries.map(e => ({
          id: e.id,
          title: e.title,
          content: e.content,
          category: e.category,
          tags: e.tags,
          keywords: e.keywords,
          entities: e.entities,
          linkedMemories: e.linkedMemories,
          createdAt: e.createdAt,
          updatedAt: e.updatedAt
        }))
      };

      const charPayload = {
        syncedAt: new Date().toISOString(),
        count: charEntries.length,
        entries: charEntries.map(e => ({
          id: e.id,
          charId: e.charId,
          title: e.title,
          content: e.content,
          category: e.category,
          tags: e.tags,
          keywords: e.keywords,
          entities: e.entities,
          linkedMemories: e.linkedMemories,
          createdAt: e.createdAt,
          updatedAt: e.updatedAt
        }))
      };

      const dateStr = new Date().toISOString().split('T')[0];
      let synced = 0;

      if (userEntries.length > 0) {
        const userPath = `wiki/user_wiki_${dateStr}.json`;
        const userResponse = await fetch(`https://api.github.com/repos/${githubRepo}/contents/${userPath}`, {
          method: 'PUT',
          headers: {
            'Authorization': `token ${githubToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: `[wiki] 同步 User Wiki ${userEntries.length} 條`,
            content: btoa(unescape(encodeURIComponent(JSON.stringify(userPayload, null, 2))))
          })
        });
        if (userResponse.ok) synced += userEntries.length;
      }

      if (charEntries.length > 0) {
        const charPath = `wiki/char_wiki_${dateStr}.json`;
        const charResponse = await fetch(`https://api.github.com/repos/${githubRepo}/contents/${charPath}`, {
          method: 'PUT',
          headers: {
            'Authorization': `token ${githubToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: `[wiki] 同步 Char Wiki ${charEntries.length} 條`,
            content: btoa(unescape(encodeURIComponent(JSON.stringify(charPayload, null, 2))))
          })
        });
        if (charResponse.ok) synced += charEntries.length;
      }

      const indexPayload = {
        syncedAt: new Date().toISOString(),
        userCount: userEntries.length,
        charCount: charEntries.length,
        userIndex: userEntries.map(e => ({ id: e.id, title: e.title, category: e.category })),
        charIndex: charEntries.map(e => ({ id: e.id, charId: e.charId, title: e.title, category: e.category }))
      };

      const indexPath = `wiki/index_${dateStr}.json`;
      await fetch(`https://api.github.com/repos/${githubRepo}/contents/${indexPath}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `[wiki] 同步 Wiki 索引`,
          content: btoa(unescape(encodeURIComponent(JSON.stringify(indexPayload, null, 2))))
        })
      });

      console.log(`[SleepEngine] Wiki 雲端同步成功: ${synced} 條`);
      return synced;
    } catch (e) {
      console.warn('[SleepEngine] Wiki 雲端同步失敗:', e);
      return 0;
    }
  };

if (typeof window !== 'undefined') {
  window.SleepEngine = SleepEngine;
  window.SleepScheduler = SleepScheduler;
  
  window.triggerMemorySleep = async function(options = {}) {
    console.log('[MemorySleep] 手動觸發記憶睡眠流程...');
    
    const sleepEngine = window.sleepEngine || 
                        window.unifiedMemory?.sleepEngine || 
                        window.globalMemorySystem?.sleepEngine;
    
    if (!sleepEngine) {
      console.error('[MemorySleep] 找不到 SleepEngine，請確認記憶系統已初始化');
      return { success: false, error: 'sleep_engine_not_found' };
    }
    
    const report = await sleepEngine.sleep('manual', options);
    
    if (report.success) {
      console.log('[MemorySleep] 睡眠流程完成！');
      console.log('[MemorySleep] 階段結果:', report.phases);
    } else {
      console.error('[MemorySleep] 睡眠流程失敗:', report.error);
    }
    
    return report;
  };
  
  window.getMemorySleepStatus = function() {
    const sleepEngine = window.sleepEngine || 
                        window.unifiedMemory?.sleepEngine || 
                        window.globalMemorySystem?.sleepEngine;
    
    if (!sleepEngine) {
      return { initialized: false, error: 'sleep_engine_not_found' };
    }
    
    return {
      initialized: true,
      isRunning: sleepEngine.isRunning,
      lastSleepTime: sleepEngine.lastSleepTime,
      sleepCount: sleepEngine.sleepCount,
      hasMemoryStore: !!sleepEngine.memoryStore,
      hasEmbeddingEngine: !!sleepEngine.embeddingEngine?.isInitialized,
      hasClassifier: !!sleepEngine.classifier,
      hasShortTermMemory: !!sleepEngine.shortTermMemory?.isInitialized,
      config: sleepEngine.config
    };
  };
}
