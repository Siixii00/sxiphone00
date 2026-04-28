class SearchEngine {
  constructor(options = {}) {
    this.memoryStore = options.memoryStore || null;
    this.embeddingEngine = options.embeddingEngine || null;
    this.decayEngine = options.decayEngine || null;
    
    this.fuse = null;
    this.fuseOptions = {
      includeScore: true,
      includeMatches: true,
      threshold: 0.4,
      ignoreLocation: true,
      minMatchCharLength: 2,
      keys: [
        { name: 'content', weight: 3.0 },
        { name: 'tags', weight: 2.0 },
        { name: 'domain', weight: 1.5 },
        { name: 'metadata.source', weight: 0.5 }
      ]
    };

    this.scoringWeights = {
      topicRelevance: 4.0,
      emotionResonance: 2.0,
      timeProximity: 2.5,
      importance: 1.0,
      memoryStrength: 3.0,
      reinforcementBonus: 2.0,
      activationBonus: 1.5
    };

    this.defaultOptions = {
      maxResults: 20,
      maxTokens: 10000,
      minScore: 0.1,
      includeScores: true
    };
  }

  async initialize() {
    if (typeof Fuse === 'undefined') {
      console.log('[SearchEngine] 加載 Fuse.js...');
      await this._loadFuse();
    }
    console.log('[SearchEngine] 初始化完成');
    return true;
  }

  async _loadFuse() {
    return new Promise((resolve, reject) => {
      if (typeof Fuse !== 'undefined') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/fuse.js@6.6.2/dist/fuse.min.js';
      script.onload = () => {
        console.log('[SearchEngine] Fuse.js 加載完成');
        resolve();
      };
      script.onerror = () => reject(new Error('Fuse.js 加載失敗'));
      document.head.appendChild(script);
    });
  }

  async keywordSearch(query, options = {}) {
    if (!query || typeof query !== 'string') {
      return [];
    }

    const memories = await this._getMemories(options);
    if (memories.length === 0) {
      return [];
    }

    this.fuse = new Fuse(memories, this.fuseOptions);
    const results = this.fuse.search(query);

    const processed = results.map(result => ({
      ...result.item,
      keywordScore: 1 - result.score,
      matches: result.matches?.map(m => ({
        key: m.key,
        value: m.value,
        indices: m.indices
      })) || []
    }));

    const limit = options.limit || this.defaultOptions.maxResults;
    return processed.slice(0, limit);
  }

  async vectorSearch(query, options = {}) {
    if (!this.embeddingEngine) {
      console.warn('[SearchEngine] EmbeddingEngine 未設置，無法執行向量搜索');
      return [];
    }

    if (!this.embeddingEngine.isInitialized) {
      console.warn('[SearchEngine] EmbeddingEngine 未初始化');
      return [];
    }

    if (!query || typeof query !== 'string' || query.trim() === '') {
      return [];
    }

    const queryEmbedding = await this.embeddingEngine.embed(query);
    if (!queryEmbedding) {
      return [];
    }

    const memories = await this._getMemories(options);
    const memoriesWithEmbedding = memories.filter(m => m.embedding && Array.isArray(m.embedding));

    if (memoriesWithEmbedding.length === 0) {
      console.log('[SearchEngine] 沒有帶有嵌入向量的記憶');
      return [];
    }

    const similarities = memoriesWithEmbedding.map(m => ({
      memory: m,
      similarity: this.embeddingEngine.cosineSimilarity(queryEmbedding, m.embedding)
    }));

    similarities.sort((a, b) => b.similarity - a.similarity);

    const threshold = options.similarityThreshold || 0.3;
    const filtered = similarities.filter(s => s.similarity >= threshold);

    const limit = options.limit || this.defaultOptions.maxResults;
    const results = filtered.slice(0, limit).map(s => ({
      ...s.memory,
      vectorScore: s.similarity
    }));

    return results;
  }

  async search(query, options = {}) {
    const opts = { ...this.defaultOptions, ...options };

    const [keywordResults, vectorResults] = await Promise.all([
      this.keywordSearch(query, { ...opts, limit: opts.maxResults * 2 }),
      this.vectorSearch(query, { ...opts, limit: opts.maxResults * 2 })
    ]);

    const merged = this._mergeResults(keywordResults, vectorResults);

    const scored = merged.map(memory => {
      const score = this.calculateScore(memory, query, opts);
      return { ...memory, finalScore: score };
    });

    scored.sort((a, b) => b.finalScore - a.finalScore);

    let results = scored.filter(m => m.finalScore >= opts.minScore);

    if (opts.maxTokens) {
      results = this._truncateByTokens(results, opts.maxTokens);
    }

    return results.slice(0, opts.maxResults);
  }

  _mergeResults(keywordResults, vectorResults) {
    const mergedMap = new Map();

    keywordResults.forEach(m => {
      mergedMap.set(m.id, { ...m, source: 'keyword' });
    });

    vectorResults.forEach(m => {
      if (mergedMap.has(m.id)) {
        const existing = mergedMap.get(m.id);
        mergedMap.set(m.id, {
          ...existing,
          vectorScore: m.vectorScore,
          source: 'both'
        });
      } else {
        mergedMap.set(m.id, { ...m, source: 'vector' });
      }
    });

    return Array.from(mergedMap.values());
  }

  calculateScore(memory, query, context = {}) {
    const weights = this.scoringWeights;

    const topicRelevance = this._calculateTopicRelevance(memory, query);
    const emotionResonance = this._calculateEmotionResonance(memory, context);
    const timeProximity = this._calculateTimeProximity(memory);
    const importance = this._calculateImportance(memory);
    const memoryStrength = this._calculateMemoryStrength(memory);
    const reinforcementBonus = this._calculateReinforcementBonus(memory);
    const activationBonus = this._calculateActivationBonus(memory);

    let score = (
      topicRelevance * weights.topicRelevance +
      emotionResonance * weights.emotionResonance +
      timeProximity * weights.timeProximity +
      importance * weights.importance +
      memoryStrength * weights.memoryStrength +
      reinforcementBonus * weights.reinforcementBonus +
      activationBonus * weights.activationBonus
    ) / 15;

    if (this.decayEngine) {
      const decayFactor = this.decayEngine.calculateDecayFactor(memory);
      score *= decayFactor;
    }

    if (memory.metadata?.resolved) {
      score *= 0.05;
    }
    if (memory.metadata?.pinned) {
      score = Math.max(score, 999.0);
    }
    if (memory.metadata?.type === 'feel') {
      score = Math.max(score, 50.0);
    }

    return score;
  }

  _calculateMemoryStrength(memory) {
    const strength = memory.metadata?.memoryStrength;
    if (strength !== undefined) {
      return strength;
    }
    
    const importance = memory.metadata?.importance || 5;
    const activationCount = memory.metadata?.activationCount || 1;
    const reinforcementCount = memory.metadata?.reinforcementCount || 0;
    
    let baseStrength = importance / 10;
    baseStrength += Math.min(activationCount / 20, 0.2);
    baseStrength += Math.min(reinforcementCount / 10, 0.2);
    
    return Math.min(baseStrength, 1);
  }

  _calculateReinforcementBonus(memory) {
    const reinforcementCount = memory.metadata?.reinforcementCount || 0;
    
    if (reinforcementCount === 0) return 0;
    
    const bonus = 0.2 * (1 - Math.exp(-reinforcementCount / 3));
    
    const lastReinforced = memory.metadata?.lastReinforced;
    if (lastReinforced) {
      const hoursSinceReinforced = (Date.now() - new Date(lastReinforced).getTime()) / (1000 * 60 * 60);
      const recencyFactor = Math.exp(-hoursSinceReinforced / 168);
      bonus *= (0.5 + 0.5 * recencyFactor);
    }
    
    return Math.min(bonus, 0.8);
  }

  _calculateActivationBonus(memory) {
    const activationCount = memory.metadata?.activationCount || 1;
    
    const bonus = Math.log(activationCount + 1) / 5;
    
    const lastAccessed = memory.metadata?.lastAccessed || memory.metadata?.lastActive;
    if (lastAccessed) {
      const hoursSinceAccessed = (Date.now() - new Date(lastAccessed).getTime()) / (1000 * 60 * 60);
      const recencyFactor = Math.exp(-hoursSinceAccessed / 72);
      bonus *= (0.3 + 0.7 * recencyFactor);
    }
    
    return Math.min(bonus, 0.6);
  }

  _calculateTopicRelevance(memory, query) {
    let relevance = 0;

    if (memory.keywordScore) {
      relevance += memory.keywordScore * 0.5;
    }
    if (memory.vectorScore) {
      relevance += memory.vectorScore * 0.5;
    }

    if (!memory.keywordScore && !memory.vectorScore) {
      if (memory.content && query) {
        const queryWords = query.toLowerCase().split(/\s+/);
        const contentLower = memory.content.toLowerCase();
        const matches = queryWords.filter(w => contentLower.includes(w)).length;
        relevance = Math.min(matches / queryWords.length, 1);
      }
    }

    return relevance;
  }

  _calculateEmotionResonance(memory, context) {
    if (!memory.emotion) {
      return 0.5;
    }

    const valence = memory.emotion.valence || 0.5;
    const arousal = memory.emotion.arousal || 0.5;

    let resonance = 0.5;

    if (context.emotion) {
      const valenceDiff = Math.abs(valence - context.emotion.valence);
      const arousalDiff = Math.abs(arousal - context.emotion.arousal);
      resonance = 1 - (valenceDiff + arousalDiff) / 2;
    }

    if (arousal > 0.7) {
      resonance *= 1.2;
    }

    return Math.min(resonance, 1);
  }

  _calculateTimeProximity(memory) {
    const now = Date.now();
    const lastActive = memory.metadata?.lastActive 
      ? new Date(memory.metadata.lastActive).getTime()
      : now;
    const created = memory.metadata?.created
      ? new Date(memory.metadata.created).getTime()
      : now;

    const hoursSinceActive = (now - lastActive) / (1000 * 60 * 60);
    const hoursSinceCreated = (now - created) / (1000 * 60 * 60);

    const activeProximity = Math.exp(-hoursSinceActive / 36);
    const createdProximity = Math.exp(-hoursSinceCreated / 168);

    return activeProximity * 0.7 + createdProximity * 0.3;
  }

  _calculateImportance(memory) {
    const importance = memory.metadata?.importance || 5;
    const activationCount = memory.metadata?.activationCount || 1;

    const importanceScore = importance / 10;
    const activationScore = Math.min(Math.log(activationCount + 1) / 3, 1);

    return importanceScore * 0.7 + activationScore * 0.3;
  }

  _truncateByTokens(memories, maxTokens) {
    const result = [];
    let totalTokens = 0;

    for (const memory of memories) {
      const tokens = this._estimateTokens(memory.content);
      if (totalTokens + tokens <= maxTokens) {
        result.push(memory);
        totalTokens += tokens;
      } else {
        break;
      }
    }

    return result;
  }

  _estimateTokens(text) {
    if (!text) return 0;
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const otherChars = text.length - chineseChars;
    return Math.ceil(chineseChars * 1.5 + otherChars / 4);
  }

  async surface(options = {}) {
    const memories = await this._getMemories(options);

    const scored = memories.map(memory => {
      const score = this.calculateScore(memory, null, options);
      return { ...memory, surfaceScore: score };
    });

    scored.sort((a, b) => b.surfaceScore - a.surfaceScore);

    const threshold = options.threshold || 0.3;
    const surfaced = scored.filter(m => m.surfaceScore >= threshold);

    const limit = options.limit || 10;
    return surfaced.slice(0, limit);
  }

  async _getMemories(options = {}) {
    if (!this.memoryStore) {
      console.warn('[SearchEngine] MemoryStore 未設置');
      return [];
    }

    const filters = {};
    if (options.type) filters.type = options.type;
    if (options.minImportance) filters.minImportance = options.minImportance;
    if (options.resolved !== undefined) filters.resolved = options.resolved;
    if (options.pinned !== undefined) filters.pinned = options.pinned;

    return await this.memoryStore.query(filters);
  }

  setScoringWeights(weights) {
    this.scoringWeights = { ...this.scoringWeights, ...weights };
    console.log('[SearchEngine] 評分權重已更新:', this.scoringWeights);
  }

  setFuseOptions(options) {
    this.fuseOptions = { ...this.fuseOptions, ...options };
    this.fuse = null;
    console.log('[SearchEngine] Fuse 選項已更新');
  }
}

if (typeof window !== 'undefined') {
  window.SearchEngine = SearchEngine;
}
