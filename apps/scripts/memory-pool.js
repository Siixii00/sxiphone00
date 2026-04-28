class MemoryPool {
  constructor(options = {}) {
    this.shortTermMemory = options.shortTermMemory || null;
    this.memoryManager = options.memoryManager || null;
    this.memoryStore = options.memoryStore || null;
    this.embeddingEngine = options.embeddingEngine || null;
    
    this.config = {
      perceptionWeight: options.perceptionWeight || {
        smell: 1.0,
        touch: 0.95,
        sight: 0.7,
        sound: 0.6,
        taste: 0.85
      },
      spatialDecayRate: options.spatialDecayRate || 0.1,
      temporalEmotionBoost: options.temporalEmotionBoost || 0.3,
      consolidationThreshold: options.consolidationThreshold || 0.65,
      triggerThreshold: options.triggerThreshold || 0.75,
      maxPoolSize: options.maxPoolSize || 50,
      ...options
    };
    
    this.pool = {
      premise: null,
      perception: [],
      spatial: [],
      temporal: []
    };
    
    this.sensoryIndex = new Map();
    this.triggerCache = new Map();
    this.isInitialized = false;
    this.storageKey = 'sx_memory_pool_state';
  }
  
  initialize() {
    this._loadFromStorage();
    this._buildSensoryIndex();
    this.isInitialized = true;
    console.log('[MemoryPool] 記憶池已初始化');
    return true;
  }
  
  _loadFromStorage() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const data = JSON.parse(raw);
        this.pool = data.pool || this.pool;
        this.triggerCache = new Map(data.triggerCache || []);
      }
    } catch (e) {
      console.warn('[MemoryPool] 載入狀態失敗:', e);
    }
  }
  
  _saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify({
        pool: this.pool,
        triggerCache: Array.from(this.triggerCache.entries()),
        savedAt: new Date().toISOString()
      }));
    } catch (e) {
      console.warn('[MemoryPool] 保存狀態失敗:', e);
    }
  }
  
  _buildSensoryIndex() {
    this.sensoryIndex.clear();
    
    const sensoryKeywords = {
      smell: ['味道', '氣味', '香味', '臭味', '芳香', '香水', '花香', '食物', '咖啡', '茶香', '雨味', '海味', '森林', '薰香', '聞到', '嗅到'],
      touch: ['觸感', '溫度', '冰冷', '溫暖', '炎熱', '柔軟', '堅硬', '光滑', '粗糙', '濕潤', '乾燥', '疼痛', '麻痺', '擁抱', '撫摸', '握著', '碰到'],
      sight: ['看到', '看見', '顏色', '形狀', '光線', '黑暗', '明亮', '模糊', '清晰', '美麗', '醜陋', '風景', '畫面', '影像'],
      sound: ['聲音', '音樂', '噪音', '安靜', '吵鬧', '旋律', '節奏', '說話', '唱歌', '哭聲', '笑聲', '風聲', '雨聲'],
      taste: ['味道', '甜', '酸', '苦', '辣', '鹹', '美味', '難吃', '口感', '品嚐', '吃', '喝']
    };
    
    for (const [sense, keywords] of Object.entries(sensoryKeywords)) {
      for (const kw of keywords) {
        this.sensoryIndex.set(kw, sense);
      }
    }
  }
  
  setPremise(context) {
    this.pool.premise = {
      context,
      establishedAt: new Date().toISOString(),
      active: true
    };
    this._saveToStorage();
    console.log('[MemoryPool] 前提層已設置:', context);
    return this.pool.premise;
  }
  
  addPerception(content, options = {}) {
    const senses = this._detectSenses(content);
    const weights = this._calculatePerceptionWeights(senses);
    const dominantSense = this._getDominantSense(weights);
    
    const perception = {
      id: `per_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      content,
      senses,
      weights,
      dominantSense,
      emotion: options.emotion || null,
      metadata: options.metadata || {},
      createdAt: new Date().toISOString(),
      accessCount: 0,
      triggerScore: this._calculateTriggerScore(weights, dominantSense)
    };
    
    this.pool.perception.push(perception);
    
    if (this.pool.perception.length > this.config.maxPoolSize) {
      this._evictWeakestPerception();
    }
    
    this._updateTriggerCache(perception);
    this._saveToStorage();
    
    console.log(`[MemoryPool] 感知層新增: ${perception.id} (主導感官: ${dominantSense}, 觸發分數: ${perception.triggerScore.toFixed(2)})`);
    
    this._checkConsolidation();
    
    return perception;
  }
  
  _detectSenses(content) {
    const detected = {};
    const text = content.toLowerCase();
    
    for (const [keyword, sense] of this.sensoryIndex) {
      if (text.includes(keyword)) {
        detected[sense] = (detected[sense] || 0) + 1;
      }
    }
    
    return detected;
  }
  
  _calculatePerceptionWeights(senses) {
    const weights = {};
    
    for (const [sense, count] of Object.entries(senses)) {
      const baseWeight = this.config.perceptionWeight[sense] || 0.5;
      weights[sense] = baseWeight * (1 + Math.log(count + 1) * 0.2);
    }
    
    return weights;
  }
  
  _getDominantSense(weights) {
    let maxWeight = 0;
    let dominant = 'sight';
    
    for (const [sense, weight] of Object.entries(weights)) {
      if (weight > maxWeight) {
        maxWeight = weight;
        dominant = sense;
      }
    }
    
    return dominant;
  }
  
  _calculateTriggerScore(weights, dominantSense) {
    const dominantWeight = weights[dominantSense] || 0.5;
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    const diversityBonus = Object.keys(weights).length * 0.05;
    
    return dominantWeight + (totalWeight * 0.1) + diversityBonus;
  }
  
  _updateTriggerCache(perception) {
    const keywords = this._extractTriggerKeywords(perception.content);
    
    for (const kw of keywords) {
      if (!this.triggerCache.has(kw)) {
        this.triggerCache.set(kw, []);
      }
      this.triggerCache.get(kw).push({
        perceptionId: perception.id,
        dominantSense: perception.dominantSense,
        triggerScore: perception.triggerScore,
        createdAt: perception.createdAt
      });
    }
  }
  
  _extractTriggerKeywords(content) {
    const keywords = new Set();
    const text = content.toLowerCase();
    
    for (const [keyword, sense] of this.sensoryIndex) {
      if (text.includes(keyword)) {
        keywords.add(keyword);
      }
    }
    
    const chinesePhrases = content.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
    for (const phrase of chinesePhrases) {
      if (phrase.length >= 2) {
        keywords.add(phrase);
      }
    }
    
    return Array.from(keywords).slice(0, 10);
  }
  
  _evictWeakestPerception() {
    if (this.pool.perception.length === 0) return;
    
    this.pool.perception.sort((a, b) => b.triggerScore - a.triggerScore);
    const evicted = this.pool.perception.pop();
    
    console.log(`[MemoryPool] 驅逐最弱感知: ${evicted.id}`);
  }
  
  addSpatial(description, options = {}) {
    const spatial = {
      id: `spa_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      description,
      environment: options.environment || null,
      location: options.location || null,
      linkedPerceptions: options.linkedPerceptions || [],
      emotion: options.emotion || null,
      metadata: options.metadata || {},
      createdAt: new Date().toISOString(),
      decayFactor: 1.0
    };
    
    this.pool.spatial.push(spatial);
    this._saveToStorage();
    
    console.log(`[MemoryPool] 空間層新增: ${spatial.id}`);
    
    return spatial;
  }
  
  addTemporal(timestamp, options = {}) {
    const temporal = {
      id: `tmp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: timestamp || new Date().toISOString(),
      timeContext: this._parseTimeContext(timestamp),
      emotion: options.emotion || null,
      emotionDye: this._calculateEmotionDye(options.emotion),
      linkedSpatial: options.linkedSpatial || [],
      linkedPerceptions: options.linkedPerceptions || [],
      metadata: options.metadata || {},
      createdAt: new Date().toISOString()
    };
    
    this.pool.temporal.push(temporal);
    this._saveToStorage();
    
    console.log(`[MemoryPool] 時間層新增: ${temporal.id}`);
    
    return temporal;
  }
  
  _parseTimeContext(timestamp) {
    if (!timestamp) return { period: 'unknown', label: '未知時間' };
    
    const date = new Date(timestamp);
    const hour = date.getHours();
    
    let period, label;
    
    if (hour >= 5 && hour < 12) {
      period = 'morning';
      label = '早晨';
    } else if (hour >= 12 && hour < 14) {
      period = 'noon';
      label = '中午';
    } else if (hour >= 14 && hour < 18) {
      period = 'afternoon';
      label = '下午';
    } else if (hour >= 18 && hour < 21) {
      period = 'evening';
      label = '傍晚';
    } else if (hour >= 21 && hour < 24) {
      period = 'night';
      label = '夜晚';
    } else {
      period = 'midnight';
      label = '深夜';
    }
    
    return { period, label, hour };
  }
  
  _calculateEmotionDye(emotion) {
    if (!emotion) return { intensity: 0, color: 'neutral' };
    
    const valence = emotion.valence || 0.5;
    const arousal = emotion.arousal || 0.5;
    const intensity = Math.abs(valence - 0.5) + arousal;
    
    let color;
    if (valence > 0.7 && arousal > 0.5) {
      color = 'warm';
    } else if (valence < 0.3 && arousal > 0.5) {
      color = 'cold';
    } else if (arousal > 0.7) {
      color = 'intense';
    } else {
      color = 'neutral';
    }
    
    return { intensity, color, valence, arousal };
  }
  
  trigger(query, options = {}) {
    const results = {
      matched: [],
      triggerType: null,
      confidence: 0
    };
    
    const querySenses = this._detectSenses(query);
    const queryKeywords = this._extractTriggerKeywords(query);
    
    if (Object.keys(querySenses).length > 0) {
      results.triggerType = 'sensory';
      results.matched = this._matchBySenses(querySenses, query);
    }
    
    if (results.matched.length === 0 && queryKeywords.length > 0) {
      results.triggerType = 'keyword';
      results.matched = this._matchByKeywords(queryKeywords);
    }
    
    if (results.matched.length === 0) {
      results.triggerType = 'semantic';
      results.matched = this._matchBySemantic(query);
    }
    
    if (results.matched.length > 0) {
      results.confidence = this._calculateMatchConfidence(results.matched, query);
      this._updateAccessCounts(results.matched);
    }
    
    console.log(`[MemoryPool] 觸發查詢: ${results.triggerType}, 匹配 ${results.matched.length} 條, 信心度 ${results.confidence.toFixed(2)}`);
    
    return results;
  }
  
  _matchBySenses(querySenses, query) {
    const matches = [];
    
    for (const perception of this.pool.perception) {
      let matchScore = 0;
      
      for (const [sense, weight] of Object.entries(querySenses)) {
        if (perception.senses[sense]) {
          const perceptionWeight = perception.weights[sense] || 0.5;
          matchScore += Math.min(weight, perceptionWeight) * this.config.perceptionWeight[sense];
        }
      }
      
      if (matchScore >= this.config.triggerThreshold * 0.5) {
        matches.push({
          type: 'perception',
          data: perception,
          matchScore,
          matchDetails: { senses: querySenses }
        });
      }
    }
    
    return matches.sort((a, b) => b.matchScore - a.matchScore).slice(0, 10);
  }
  
  _matchByKeywords(queryKeywords) {
    const matches = [];
    
    for (const kw of queryKeywords) {
      const cached = this.triggerCache.get(kw) || [];
      for (const entry of cached) {
        const perception = this.pool.perception.find(p => p.id === entry.perceptionId);
        if (perception) {
          matches.push({
            type: 'perception',
            data: perception,
            matchScore: entry.triggerScore,
            matchDetails: { keyword: kw }
          });
        }
      }
    }
    
    const uniqueMatches = [];
    const seen = new Set();
    for (const m of matches) {
      if (!seen.has(m.data.id)) {
        seen.add(m.data.id);
        uniqueMatches.push(m);
      }
    }
    
    return uniqueMatches.sort((a, b) => b.matchScore - a.matchScore).slice(0, 10);
  }
  
  async _matchBySemantic(query) {
    if (!this.embeddingEngine || !this.embeddingEngine.isInitialized) {
      return [];
    }
    
    try {
      const queryEmbedding = await this.embeddingEngine.embed(query);
      const matches = [];
      
      for (const perception of this.pool.perception) {
        if (perception.embedding) {
          const similarity = this._cosineSimilarity(queryEmbedding, perception.embedding);
          if (similarity >= 0.6) {
            matches.push({
              type: 'perception',
              data: perception,
              matchScore: similarity,
              matchDetails: { semantic: true }
            });
          }
        }
      }
      
      return matches.sort((a, b) => b.matchScore - a.matchScore).slice(0, 10);
    } catch (e) {
      console.warn('[MemoryPool] 語義匹配失敗:', e);
      return [];
    }
  }
  
  _calculateMatchConfidence(matches, query) {
    if (matches.length === 0) return 0;
    
    const topScore = matches[0].matchScore;
    const avgScore = matches.reduce((sum, m) => sum + m.matchScore, 0) / matches.length;
    const diversity = Math.min(matches.length / 5, 1);
    
    return (topScore * 0.5 + avgScore * 0.3 + diversity * 0.2);
  }
  
  _updateAccessCounts(matches) {
    for (const match of matches) {
      if (match.data && match.data.accessCount !== undefined) {
        match.data.accessCount++;
        match.data.lastAccessed = new Date().toISOString();
      }
    }
    this._saveToStorage();
  }
  
  _checkConsolidation() {
    const highTriggerPerceptions = this.pool.perception.filter(
      p => p.triggerScore >= this.config.consolidationThreshold
    );
    
    if (highTriggerPerceptions.length >= 3) {
      console.log(`[MemoryPool] 偵測到 ${highTriggerPerceptions.length} 條高觸發分數感知，準備鞏固`);
      this._triggerConsolidation(highTriggerPerceptions);
    }
  }
  
  async _triggerConsolidation(perceptions) {
    if (!this.shortTermMemory && !this.memoryManager) {
      console.log('[MemoryPool] 無可用記憶系統進行鞏固');
      return;
    }
    
    for (const perception of perceptions) {
      try {
        const consolidatedContent = this._buildConsolidatedContent(perception);
        
        if (this.shortTermMemory && this.shortTermMemory.isInitialized) {
          this.shortTermMemory.push(consolidatedContent, {
            importance: Math.round(perception.triggerScore * 10),
            emotion: perception.emotion,
            source: 'memory_pool',
            tags: ['sensory', perception.dominantSense],
            metadata: {
              perceptionId: perception.id,
              triggerScore: perception.triggerScore,
              senses: perception.senses
            }
          });
        }
        
        if (this.memoryManager && this.memoryManager.isInitialized) {
          await this.memoryManager.hold(consolidatedContent, {
            importance: Math.round(perception.triggerScore * 10),
            emotion: perception.emotion,
            source: 'memory_pool',
            tags: ['sensory', perception.dominantSense],
            metadata: {
              perceptionId: perception.id,
              triggerScore: perception.triggerScore
            }
          });
        }
        
        console.log(`[MemoryPool] 感知已鞏固: ${perception.id}`);
      } catch (e) {
        console.warn(`[MemoryPool] 鞏固失敗: ${perception.id}`, e);
      }
    }
  }
  
  _buildConsolidatedContent(perception) {
    const senseDescriptions = {
      smell: '聞到',
      touch: '觸碰到',
      sight: '看到',
      sound: '聽到',
      taste: '嚐到'
    };
    
    const dominantDesc = senseDescriptions[perception.dominantSense] || '感知到';
    
    return `[${dominantDesc}] ${perception.content}`;
  }
  
  buildFullContext() {
    const context = {
      premise: this.pool.premise,
      perceptions: this.pool.perception.slice(-10),
      spatial: this.pool.spatial.slice(-5),
      temporal: this.pool.temporal.slice(-5),
      summary: this._generateSummary()
    };
    
    return context;
  }
  
  _generateSummary() {
    const parts = [];
    
    if (this.pool.premise) {
      parts.push(`當前情境：${this.pool.premise.context}`);
    }
    
    if (this.pool.perception.length > 0) {
      const dominantSenses = {};
      for (const p of this.pool.perception) {
        dominantSenses[p.dominantSense] = (dominantSenses[p.dominantSense] || 0) + 1;
      }
      const topSense = Object.entries(dominantSenses).sort((a, b) => b[1] - a[1])[0];
      if (topSense) {
        parts.push(`感知記憶 ${this.pool.perception.length} 條，主導感官：${topSense[0]}`);
      }
    }
    
    if (this.pool.spatial.length > 0) {
      parts.push(`空間記憶 ${this.pool.spatial.length} 處`);
    }
    
    if (this.pool.temporal.length > 0) {
      const latestTemporal = this.pool.temporal[this.pool.temporal.length - 1];
      if (latestTemporal && latestTemporal.timeContext) {
        parts.push(`時間標記：${latestTemporal.timeContext.label}`);
      }
    }
    
    return parts.join('；');
  }
  
  processConversationMessage(message, options = {}) {
    if (!message || !message.content) return null;
    
    const content = typeof message.content === 'string' 
      ? message.content 
      : message.content.text || '';
    
    if (content.length < 10) return null;
    
    const senses = this._detectSenses(content);
    const hasStrongSensory = Object.keys(senses).some(
      s => ['smell', 'touch'].includes(s)
    );
    
    if (hasStrongSensory) {
      return this.addPerception(content, {
        emotion: options.emotion,
        metadata: {
          role: message.role,
          source: options.source || 'conversation',
          ...options.metadata
        }
      });
    }
    
    const spatialKeywords = ['在', '裡', '外', '旁邊', '附近', '房間', '地方', '環境', '周圍'];
    const hasSpatial = spatialKeywords.some(kw => content.includes(kw));
    
    if (hasSpatial) {
      return this.addSpatial(content, {
        emotion: options.emotion,
        metadata: {
          role: message.role,
          source: options.source || 'conversation',
          ...options.metadata
        }
      });
    }
    
    const temporalKeywords = ['今天', '昨天', '明天', '早上', '下午', '晚上', '現在', '剛才', '等等'];
    const hasTemporal = temporalKeywords.some(kw => content.includes(kw));
    
    if (hasTemporal) {
      return this.addTemporal(new Date().toISOString(), {
        emotion: options.emotion,
        metadata: {
          role: message.role,
          source: options.source || 'conversation',
          content: content.substring(0, 100),
          ...options.metadata
        }
      });
    }
    
    return null;
  }
  
  getStats() {
    return {
      isInitialized: this.isInitialized,
      poolSize: {
        perception: this.pool.perception.length,
        spatial: this.pool.spatial.length,
        temporal: this.pool.temporal.length
      },
      triggerCacheSize: this.triggerCache.size,
      sensoryIndexSize: this.sensoryIndex.size,
      hasPremise: this.pool.premise !== null,
      config: { ...this.config }
    };
  }
  
  clear() {
    this.pool = {
      premise: null,
      perception: [],
      spatial: [],
      temporal: []
    };
    this.triggerCache.clear();
    this._saveToStorage();
    console.log('[MemoryPool] 已清空');
  }
  
  export() {
    return {
      pool: this.pool,
      triggerCache: Array.from(this.triggerCache.entries()),
      exportedAt: new Date().toISOString()
    };
  }
  
  import(data) {
    if (data.pool) {
      this.pool = data.pool;
    }
    if (data.triggerCache) {
      this.triggerCache = new Map(data.triggerCache);
    }
    this._saveToStorage();
    console.log('[MemoryPool] 匯入完成');
  }
  
  _cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

if (typeof window !== 'undefined') {
  window.MemoryPool = MemoryPool;
}
