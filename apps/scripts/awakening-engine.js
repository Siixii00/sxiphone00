class AwakeningEngine {
  constructor(options = {}) {
    this.memoryStore = options.memoryStore || null;
    this.embeddingEngine = options.embeddingEngine || null;
    this.searchEngine = options.searchEngine || null;
    this.emotionTagger = options.emotionTagger || null;
    
    this.config = {
      yesterdayMemoryLimit: options.yesterdayMemoryLimit || 30,
      recentMemoryLimit: options.recentMemoryLimit || 10,
      minImportance: options.minImportance || 4,
      emotionalBoostThreshold: options.emotionalBoostThreshold || 0.7,
      awakeningCooldown: options.awakeningCooldown || 3600000
    };
    
    this.lastAwakening = null;
    this.todayMemoryContext = null;
    this.keywordIndex = new Map();
  }

  async dailyAwakening() {
    const now = new Date();
    const today = now.toDateString();
    
    const lastAwakeningState = this._loadAwakeningState();
    
    if (lastAwakeningState.date === today) {
      const timeSinceAwakening = now.getTime() - new Date(lastAwakeningState.awakenedAt).getTime();
      if (timeSinceAwakening < this.config.awakeningCooldown) {
        console.log('[AwakeningEngine] 今日已喚醒，返回快取');
        return {
          type: 'cached',
          memories: lastAwakeningState.memories,
          summary: lastAwakeningState.summary
        };
      }
    }

    console.log('[AwakeningEngine] 開始每日喚醒流程...');

    const awakeningResult = {
      type: 'morning_recall',
      yesterdayMemories: [],
      recentImportant: [],
      emotionalHighlights: [],
      wikiContext: null,
      summary: null,
      context: null
    };

    awakeningResult.yesterdayMemories = await this._recallYesterdayMemories();

    awakeningResult.recentImportant = await this._recallRecentImportant();

    awakeningResult.emotionalHighlights = await this._findEmotionalHighlights();

    awakeningResult.wikiContext = await this._loadWikiContext();

    awakeningResult.summary = await this._generateAwakeningSummary(awakeningResult);

    awakeningResult.context = this._buildMemoryContext(awakeningResult);

    await this._buildKeywordIndex(awakeningResult.yesterdayMemories, awakeningResult.recentImportant);

    this._saveAwakeningState({
      date: today,
      awakenedAt: now.toISOString(),
      memories: {
        yesterday: awakeningResult.yesterdayMemories.length,
        recent: awakeningResult.recentImportant.length,
        emotional: awakeningResult.emotionalHighlights.length,
        wiki: awakeningResult.wikiContext?.userEntries || 0
      },
      summary: awakeningResult.summary
    });

    this.lastAwakening = now;
    this.todayMemoryContext = awakeningResult.context;

    console.log(`[AwakeningEngine] 喚醒完成：昨日 ${awakeningResult.yesterdayMemories.length} 條，近期 ${awakeningResult.recentImportant.length} 條，情感 ${awakeningResult.emotionalHighlights.length} 條，Wiki ${awakeningResult.wikiContext?.totalEntries || 0} 條`);

    return awakeningResult;
  }

  async _loadWikiContext() {
    const wikiContext = {
      userEntries: [],
      charEntries: [],
      recentEntries: [],
      importantEntries: [],
      linkedEntries: [],
      totalEntries: 0,
      chars: [],
      summary: null
    };

    try {
      const wikiDB = await this._openWikiDB();
      if (!wikiDB) {
        console.log('[AwakeningEngine] Wiki DB 未初始化，跳過 Wiki 載入');
        return wikiContext;
      }

      const userEntries = await this._getAllWikiEntries(wikiDB, 'user_entries');
      const charEntries = await this._getAllWikiEntries(wikiDB, 'char_entries');
      const chars = await this._getAllWikiEntries(wikiDB, 'chars');

      wikiContext.userEntries = userEntries;
      wikiContext.charEntries = charEntries;
      wikiContext.chars = chars;
      wikiContext.totalEntries = userEntries.length + charEntries.length;

      const now = Date.now();
      const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;

      wikiContext.recentEntries = [...userEntries, ...charEntries]
        .filter(e => {
          const created = e.createdAt ? new Date(e.createdAt).getTime() : 0;
          return created >= threeDaysAgo;
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10);

      wikiContext.importantEntries = [...userEntries, ...charEntries]
        .filter(e => (e.importance || 5) >= 7 || e.category === 'important')
        .sort((a, b) => (b.importance || 5) - (a.importance || 5))
        .slice(0, 10);

      const linkedIds = new Set();
      [...userEntries, ...charEntries].forEach(e => {
        if (e.linkedMemories) {
          e.linkedMemories.forEach(id => linkedIds.add(id));
        }
      });

      wikiContext.linkedEntries = [...userEntries, ...charEntries]
        .filter(e => linkedIds.has(e.id))
        .slice(0, 10);

      wikiContext.summary = this._generateWikiSummary(wikiContext);

      console.log(`[AwakeningEngine] Wiki 載入完成：User ${userEntries.length} 條，Char ${charEntries.length} 條，Chars ${chars.length} 個`);

      wikiDB.close();
    } catch (e) {
      console.warn('[AwakeningEngine] Wiki 載入失敗:', e);
    }

    return wikiContext;
  }

  async _openWikiDB() {
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
  }

  async _getAllWikiEntries(db, storeName) {
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => resolve([]);
      } catch (e) {
        resolve([]);
      }
    });
  }

  _generateWikiSummary(wikiContext) {
    const parts = [];

    if (wikiContext.userEntries.length > 0) {
      const categories = {};
      const weightedEntries = wikiContext.userEntries.map(e => ({
        ...e,
        weight: e.weight || 0.5
      }));
      
      weightedEntries.forEach(e => {
        const cat = e.category || 'other';
        categories[cat] = (categories[cat] || 0) + 1;
      });
      
      const topCats = Object.entries(categories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat, count]) => `${cat}(${count})`);
      
      const avgWeight = weightedEntries.reduce((sum, e) => sum + e.weight, 0) / weightedEntries.length;
      
      parts.push(`User Wiki: ${wikiContext.userEntries.length} 條 [${topCats.join(', ')}] (平均權重: ${avgWeight.toFixed(2)})`);
    }

    if (wikiContext.charEntries.length > 0) {
      const charGroups = {};
      wikiContext.charEntries.forEach(e => {
        const charId = e.charId || 'unknown';
        charGroups[charId] = (charGroups[charId] || 0) + 1;
      });
      parts.push(`Char Wiki: ${wikiContext.charEntries.length} 條 (${Object.keys(charGroups).length} 個角色)`);
    }

    if (wikiContext.recentEntries.length > 0) {
      parts.push(`近期更新: ${wikiContext.recentEntries.length} 條`);
    }

    if (wikiContext.importantEntries.length > 0) {
      const highWeight = wikiContext.importantEntries.filter(e => (e.weight || 0.5) >= 0.7).length;
      parts.push(`重要記憶: ${wikiContext.importantEntries.length} 條 (高權重: ${highWeight})`);
    }

    return {
      text: parts.join(' | '),
      stats: {
        userCount: wikiContext.userEntries.length,
        charCount: wikiContext.charEntries.length,
        charCount_: wikiContext.chars.length,
        recentCount: wikiContext.recentEntries.length,
        importantCount: wikiContext.importantEntries.length
      },
      generatedAt: new Date().toISOString()
    };
  }

  async thinkWithWiki(query, options = {}) {
    const thinkingResult = {
      query,
      keywords: [],
      directMatches: [],
      associations: [],
      extendedThoughts: [],
      wikiContext: null,
      summary: null
    };

    if (window.WikiEngine && this.todayMemoryContext?.wiki) {
      try {
        const wikiDB = await this._openWikiDB();
        if (wikiDB) {
          const wikiEngine = new WikiEngine({
            getAllEntries: (store) => this._getAllWikiEntries(wikiDB, store),
            getEntry: (store, id) => this._getWikiEntry(wikiDB, store, id),
            updateEntry: (store, entry) => this._updateWikiEntry(wikiDB, store, entry)
          });

          await wikiEngine.initialize();

          const wikiThinking = await wikiEngine.think(query, { limit: 5, spreadDepth: 2 });

          thinkingResult.keywords = wikiThinking.keywords;
          thinkingResult.directMatches = wikiThinking.directMatches;
          thinkingResult.associations = wikiThinking.associations;
          thinkingResult.extendedThoughts = wikiThinking.extendedThoughts;
          thinkingResult.summary = wikiThinking.summary;

          wikiDB.close();
        }
      } catch (e) {
        console.warn('[AwakeningEngine] Wiki 思考失敗:', e);
      }
    }

    const memoryMatches = await this.triggerRecallByKeyword(query, { limit: 5 });
    thinkingResult.memoryMatches = memoryMatches.map(m => ({
      id: m.memory.id,
      content: m.memory.content?.substring(0, 100),
      score: m.score,
      matchType: m.matchType
    }));

    return thinkingResult;
  }

  async _getWikiEntry(db, storeName, id) {
    return new Promise((resolve) => {
      try {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  }

  async _updateWikiEntry(db, storeName, entry) {
    return new Promise((resolve) => {
      try {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(entry);
        request.onsuccess = () => resolve(entry);
        request.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  }

  async _recallYesterdayMemories() {
    if (!this.memoryStore) return [];

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);

    try {
      const allMemories = await this.memoryStore.getAll({ limit: 200 });
      
      const yesterdayMemories = allMemories.filter(m => {
        const created = m.metadata?.created ? new Date(m.metadata.created).getTime() : 0;
        return created >= yesterday.getTime() && created <= yesterdayEnd.getTime();
      });

      const scored = yesterdayMemories.map(m => ({
        memory: m,
        score: this._calculateRecallScore(m)
      }));

      scored.sort((a, b) => b.score - a.score);

      const topMemories = scored.slice(0, this.config.yesterdayMemoryLimit).map(s => s.memory);

      for (const memory of topMemories) {
        await this.memoryStore.update(memory.id, {
          metadata: {
            lastActive: new Date().toISOString(),
            activationCount: (memory.metadata?.activationCount || 1) + 1,
            lastRecallType: 'morning_awakening'
          }
        });
      }

      return topMemories;
    } catch (e) {
      console.warn('[AwakeningEngine] 回溯昨日記憶失敗:', e);
      return [];
    }
  }

  async _recallRecentImportant() {
    if (!this.memoryStore) return [];

    try {
      const allMemories = await this.memoryStore.getAll({ limit: 100 });
      
      const now = Date.now();
      const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

      const recentImportant = allMemories.filter(m => {
        const created = m.metadata?.created ? new Date(m.metadata.created).getTime() : now;
        const importance = m.metadata?.importance || 5;
        const isRecent = created >= weekAgo;
        const isImportant = importance >= 6;
        const isReinforced = (m.metadata?.reinforcementCount || 0) >= 2;
        
        return isRecent && (isImportant || isReinforced);
      });

      const scored = recentImportant.map(m => ({
        memory: m,
        score: this._calculateRecallScore(m)
      }));

      scored.sort((a, b) => b.score - a.score);

      return scored.slice(0, this.config.recentMemoryLimit).map(s => s.memory);
    } catch (e) {
      console.warn('[AwakeningEngine] 回溯近期重要記憶失敗:', e);
      return [];
    }
  }

  async _findEmotionalHighlights() {
    if (!this.memoryStore) return [];

    try {
      const allMemories = await this.memoryStore.getAll({ limit: 100 });
      
      const emotionalMemories = allMemories.filter(m => {
        if (!m.emotion) return false;
        
        const arousal = m.emotion.arousal || 0.5;
        const valence = m.emotion.valence || 0.5;
        const emotionalIntensity = Math.abs(valence - 0.5) + arousal;
        
        return emotionalIntensity >= this.config.emotionalBoostThreshold;
      });

      const scored = emotionalMemories.map(m => ({
        memory: m,
        score: this._calculateRecallScore(m) * 1.5
      }));

      scored.sort((a, b) => b.score - a.score);

      return scored.slice(0, 5).map(s => s.memory);
    } catch (e) {
      console.warn('[AwakeningEngine] 尋找情感亮點失敗:', e);
      return [];
    }
  }

  _calculateRecallScore(memory) {
    const now = Date.now();
    
    const importance = memory.metadata?.importance || 5;
    const activationCount = memory.metadata?.activationCount || 1;
    const reinforcementCount = memory.metadata?.reinforcementCount || 0;
    const memoryStrength = memory.metadata?.memoryStrength || 0.5;
    
    const created = memory.metadata?.created ? new Date(memory.metadata.created).getTime() : now;
    const daysSinceCreated = (now - created) / (1000 * 60 * 60 * 24);
    
    const lastActive = memory.metadata?.lastActive ? new Date(memory.metadata.lastActive).getTime() : created;
    const hoursSinceActive = (now - lastActive) / (1000 * 60 * 60);
    
    const lambda = 0.05;
    const baseRetention = Math.exp(-lambda * daysSinceCreated);
    
    const reinforcementProtection = 1 + Math.min(reinforcementCount * 0.15, 0.5);
    
    const strengthFactor = 0.5 + memoryStrength * 0.5;
    
    const arousal = memory.emotion?.arousal || 0.5;
    const valence = memory.emotion?.valence || 0.5;
    const emotionWeight = 1 + (Math.abs(valence - 0.5) + arousal) * 0.3;
    
    const freshnessBonus = 1 + Math.exp(-hoursSinceActive / 24);
    
    const activationBonus = Math.pow(activationCount, 0.15);
    
    const recencyBoost = daysSinceCreated <= 1 ? 1.5 : (daysSinceCreated <= 3 ? 1.2 : 1);
    
    return importance * baseRetention * reinforcementProtection * strengthFactor * 
           emotionWeight * freshnessBonus * activationBonus * recencyBoost;
  }

  async _generateAwakeningSummary(awakeningResult) {
    const parts = [];
    
    if (awakeningResult.yesterdayMemories.length > 0) {
      const yesterdayTopics = this._extractTopics(awakeningResult.yesterdayMemories);
      parts.push(`昨日記憶 ${awakeningResult.yesterdayMemories.length} 條，主題：${yesterdayTopics.join('、')}`);
    }
    
    if (awakeningResult.recentImportant.length > 0) {
      parts.push(`近期重要記憶 ${awakeningResult.recentImportant.length} 條`);
    }
    
    if (awakeningResult.emotionalHighlights.length > 0) {
      const emotions = awakeningResult.emotionalHighlights.map(m => {
        const v = m.emotion?.valence || 0.5;
        const a = m.emotion?.arousal || 0.5;
        if (v > 0.7 && a > 0.5) return '開心';
        if (v < 0.3 && a > 0.5) return '難過';
        if (v < 0.4 && a > 0.7) return '生氣';
        if (a > 0.7) return '激動';
        return '平靜';
      });
      parts.push(`情感記憶：${[...new Set(emotions)].join('、')}`);
    }

    if (awakeningResult.wikiContext && awakeningResult.wikiContext.totalEntries > 0) {
      const wiki = awakeningResult.wikiContext;
      parts.push(`Wiki: User ${wiki.userEntries.length} 條, Char ${wiki.charEntries.length} 條`);
    }
    
    return {
      text: parts.join('。'),
      stats: {
        yesterdayCount: awakeningResult.yesterdayMemories.length,
        recentCount: awakeningResult.recentImportant.length,
        emotionalCount: awakeningResult.emotionalHighlights.length,
        wikiCount: awakeningResult.wikiContext?.totalEntries || 0
      },
      generatedAt: new Date().toISOString()
    };
  }

  _extractTopics(memories) {
    const wordFreq = new Map();
    const stopWords = new Set(['的', '是', '在', '了', '和', '有', '我', '你', '他', '她', '它', '們', '這', '那', '就', '也', '都', '會', '能', '要', '可以', '一個', '一個', '什麼', '怎麼', '為什麼']);
    
    for (const memory of memories) {
      const words = (memory.content || '').match(/[\u4e00-\u9fa5]{2,}/g) || [];
      for (const word of words) {
        if (stopWords.has(word)) continue;
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    }
    
    const sorted = [...wordFreq.entries()].sort((a, b) => b[1] - a[1]);
    return sorted.slice(0, 5).map(([word]) => word);
  }

  _buildMemoryContext(awakeningResult) {
    const context = {
      yesterday: [],
      recent: [],
      emotional: [],
      wiki: null,
      keywords: []
    };
    
    for (const m of awakeningResult.yesterdayMemories.slice(0, 10)) {
      context.yesterday.push({
        id: m.id,
        content: m.content?.substring(0, 100),
        importance: m.metadata?.importance,
        emotion: m.emotion
      });
    }
    
    for (const m of awakeningResult.recentImportant.slice(0, 5)) {
      context.recent.push({
        id: m.id,
        content: m.content?.substring(0, 100),
        importance: m.metadata?.importance
      });
    }
    
    for (const m of awakeningResult.emotionalHighlights.slice(0, 3)) {
      context.emotional.push({
        id: m.id,
        content: m.content?.substring(0, 100),
        emotion: m.emotion
      });
    }

    if (awakeningResult.wikiContext) {
      context.wiki = {
        userEntries: awakeningResult.wikiContext.recentEntries
          .filter(e => !e.charId)
          .slice(0, 5)
          .map(e => ({
            id: e.id,
            title: e.title,
            category: e.category,
            content: e.content?.substring(0, 100)
          })),
        charEntries: awakeningResult.wikiContext.recentEntries
          .filter(e => e.charId)
          .slice(0, 5)
          .map(e => ({
            id: e.id,
            title: e.title,
            charId: e.charId,
            content: e.content?.substring(0, 100)
          })),
        important: awakeningResult.wikiContext.importantEntries.slice(0, 5).map(e => ({
          id: e.id,
          title: e.title,
          category: e.category
        })),
        summary: awakeningResult.wikiContext.summary
      };
    }
    
    context.keywords = this._extractKeywords([
      ...awakeningResult.yesterdayMemories,
      ...awakeningResult.recentImportant
    ]);
    
    return context;
  }

  async _buildKeywordIndex(...memoryArrays) {
    this.keywordIndex.clear();
    
    const allMemories = memoryArrays.flat();
    
    for (const memory of allMemories) {
      const keywords = this._extractKeywords([memory]);
      for (const kw of keywords) {
        if (!this.keywordIndex.has(kw)) {
          this.keywordIndex.set(kw, []);
        }
        this.keywordIndex.get(kw).push({
          id: memory.id,
          importance: memory.metadata?.importance || 5,
          emotion: memory.emotion,
          strength: memory.metadata?.memoryStrength || 0.5
        });
      }
    }
    
    console.log(`[AwakeningEngine] 建立關鍵詞索引：${this.keywordIndex.size} 個關鍵詞`);
  }

  _extractKeywords(memories) {
    const wordFreq = new Map();
    const stopWords = new Set(['的', '是', '在', '了', '和', '有', '我', '你', '他', '她', '它', '們', '這', '那', '就', '也', '都', '會', '能', '要', '可以', '一個', '什麼', '怎麼', '為什麼', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must']);
    
    for (const memory of memories) {
      const content = memory.content || '';
      const chineseWords = content.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
      const englishWords = content.toLowerCase().match(/[a-z]{3,}/g) || [];
      
      for (const word of [...chineseWords, ...englishWords]) {
        if (stopWords.has(word)) continue;
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    }
    
    const sorted = [...wordFreq.entries()].sort((a, b) => b[1] - a[1]);
    return sorted.slice(0, 30).map(([word]) => word);
  }

  async triggerRecallByKeyword(keyword, options = {}) {
    const results = [];
    
    const exactMatches = this.keywordIndex.get(keyword) || [];
    for (const match of exactMatches) {
      const memory = await this.memoryStore.read(match.id);
      if (memory) {
        results.push({
          memory,
          matchType: 'exact_keyword',
          score: 1.0 * match.strength
        });
      }
    }
    
    for (const [kw, matches] of this.keywordIndex) {
      if (kw !== keyword && kw.includes(keyword) || keyword.includes(kw)) {
        for (const match of matches.slice(0, 3)) {
          const memory = await this.memoryStore.read(match.id);
          if (memory && !results.find(r => r.memory.id === memory.id)) {
            results.push({
              memory,
              matchType: 'partial_keyword',
              score: 0.8 * match.strength
            });
          }
        }
      }
    }
    
    if (this.embeddingEngine?.isInitialized && results.length < 10) {
      try {
        const queryEmbedding = await this.embeddingEngine.embed(keyword);
        const semanticMatches = await this.memoryStore.searchByEmbedding(queryEmbedding, 10);
        
        for (const match of semanticMatches) {
          if (match.similarity >= 0.65 && !results.find(r => r.memory.id === match.id)) {
            results.push({
              memory: match,
              matchType: 'semantic',
              score: match.similarity * 0.9
            });
          }
        }
      } catch (e) {
        console.warn('[AwakeningEngine] 語義匹配失敗:', e);
      }
    }
    
    results.sort((a, b) => b.score - a.score);
    
    for (const result of results.slice(0, 5)) {
      await this.memoryStore.update(result.memory.id, {
        metadata: {
          lastActive: new Date().toISOString(),
          activationCount: (result.memory.metadata?.activationCount || 1) + 1,
          lastRecallType: 'keyword_trigger',
          triggeredBy: keyword
        }
      });
    }
    
    console.log(`[AwakeningEngine] 關鍵詞「${keyword}」觸發 ${results.length} 條記憶`);
    
    return results.slice(0, options.limit || 10);
  }

  _loadAwakeningState() {
    try {
      const raw = localStorage.getItem('sx_daily_awakening_state');
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[AwakeningEngine] 載入喚醒狀態失敗:', e);
    }
    return { date: null, awakenedAt: null };
  }

  _saveAwakeningState(state) {
    try {
      localStorage.setItem('sx_daily_awakening_state', JSON.stringify(state));
    } catch (e) {
      console.warn('[AwakeningEngine] 保存喚醒狀態失敗:', e);
    }
  }

  getAwakeningStatus() {
    const state = this._loadAwakeningState();
    return {
      lastAwakening: state.awakenedAt,
      lastDate: state.date,
      todayDate: new Date().toDateString(),
      needsAwakening: state.date !== new Date().toDateString(),
      keywordIndexSize: this.keywordIndex.size,
      contextReady: this.todayMemoryContext !== null,
      hasWiki: this.todayMemoryContext?.wiki !== null
    };
  }

  getWikiContext() {
    return this.todayMemoryContext?.wiki || null;
  }

  getWikiEntries(type = 'all') {
    const wiki = this.getWikiContext();
    if (!wiki) return [];

    if (type === 'user') return wiki.userEntries || [];
    if (type === 'char') return wiki.charEntries || [];
    if (type === 'important') return wiki.important || [];

    return [...(wiki.userEntries || []), ...(wiki.charEntries || [])];
  }

  getMemoryContext() {
    return this.todayMemoryContext;
  }

  getKeywords() {
    return [...this.keywordIndex.keys()];
  }
}

if (typeof window !== 'undefined') {
  window.AwakeningEngine = AwakeningEngine;
}
