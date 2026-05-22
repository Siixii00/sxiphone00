class ChatMemoryIntegration {
  constructor(options = {}) {
    this.memoryStore = options.memoryStore || null;
    this.embeddingEngine = options.embeddingEngine || null;
    this.emotionTagger = options.emotionTagger || null;
    this.classifier = options.classifier || null;
    
    this.config = {
      maxChatMemories: options.maxChatMemories || 1000,
      batchSize: options.batchSize || 20,
      autoVectorize: options.autoVectorize !== false,
      vectorizeDelay: options.vectorizeDelay || 5000,
      minMessageLength: options.minMessageLength || 10,
      importanceThreshold: options.importanceThreshold || 6
    };
    
    this.pendingQueue = [];
    this.isProcessing = false;
    this.lastVectorizeTime = null;
    this.vectorizeTimer = null;
  }

  async initialize() {
    if (!this.memoryStore) {
      try {
        if (typeof MemoryStore !== 'undefined') {
          this.memoryStore = new MemoryStore();
          await this.memoryStore.init();
          console.log('[ChatMemoryIntegration] MemoryStore 初始化成功');
        }
      } catch (e) {
        console.warn('[ChatMemoryIntegration] MemoryStore 初始化失敗:', e);
      }
    }
    
    if (!this.embeddingEngine) {
      try {
        if (typeof EmbeddingEngine !== 'undefined') {
          this.embeddingEngine = new EmbeddingEngine({ memoryStore: this.memoryStore });
          console.log('[ChatMemoryIntegration] EmbeddingEngine 已創建（延遲初始化）');
        }
      } catch (e) {
        console.warn('[ChatMemoryIntegration] EmbeddingEngine 創建失敗:', e);
      }
    }
    
    console.log('[ChatMemoryIntegration] 初始化完成');
    return true;
  }

  async processChatMessage(message, meta = {}) {
    if (!message || !message.content) {
      return { success: false, reason: 'invalid_message' };
    }
    
    const content = this._extractTextContent(message.content);
    if (content.length < this.config.minMessageLength) {
      return { success: false, reason: 'too_short' };
    }
    
    const chatMemory = {
      id: `chat_${message.id || Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: this._buildMemoryContent(message, meta),
      rawContent: content,
      role: message.role,
      timestamp: message.timestamp || new Date().toISOString(),
      sessionId: meta.sessionId || getActiveChatId?.() || 'default',
      charName: meta.charName || localStorage.getItem('sx_char_name') || 'AI',
      userName: meta.userName || localStorage.getItem('sx_user_name') || 'User',
      tags: this._extractTags(message, meta),
      domain: ['chat', message.role === 'user' ? 'user_message' : 'ai_response'],
      metadata: {
        type: 'chat_memory',
        source: 'chat',
        importance: this._calculateImportance(message, meta),
        created: new Date().toISOString(),
        vectorized: false,
        sessionId: meta.sessionId || 'default',
        messageId: message.id
      },
      emotion: await this._analyzeEmotion(content)
    };
    
    if (this.config.autoVectorize && this.embeddingEngine) {
      this._scheduleVectorization(chatMemory);
    }
    
    if (this.memoryStore) {
      try {
        await this.memoryStore.create(chatMemory);
        console.log(`[ChatMemoryIntegration] 聊天記憶已儲存: ${chatMemory.id}`);
        return { success: true, id: chatMemory.id };
      } catch (e) {
        console.error('[ChatMemoryIntegration] 儲存聊天記憶失敗:', e);
        return { success: false, reason: e.message };
      }
    }
    
    this._saveToLocalStorage(chatMemory);
    return { success: true, id: chatMemory.id, storage: 'localStorage' };
  }

  async processChatSession(sessionId, session) {
    if (!session || !session.history || session.history.length === 0) {
      return { processed: 0, vectorized: 0 };
    }
    
    const results = {
      processed: 0,
      vectorized: 0,
      failed: 0
    };
    
    const messages = session.history;
    const meta = {
      sessionId,
      charName: session.title || localStorage.getItem('sx_char_name') || 'AI'
    };
    
    for (const message of messages) {
      try {
        const result = await this.processChatMessage(message, meta);
        if (result.success) {
          results.processed++;
        } else {
          results.failed++;
        }
      } catch (e) {
        console.warn('[ChatMemoryIntegration] 處理訊息失敗:', e);
        results.failed++;
      }
    }
    
    console.log(`[ChatMemoryIntegration] 會話處理完成: ${results.processed} 成功, ${results.failed} 失敗`);
    return results;
  }

  async vectorizeChatMemory(memory) {
    if (!this.embeddingEngine) {
      console.warn('[ChatMemoryIntegration] EmbeddingEngine 未初始化');
      return null;
    }
    
    if (!this.embeddingEngine.isInitialized) {
      try {
        await this.embeddingEngine.initialize();
      } catch (e) {
        console.warn('[ChatMemoryIntegration] EmbeddingEngine 初始化失敗:', e);
        return this._simpleHashEmbedding(memory.content);
      }
    }
    
    try {
      const embedding = await this.embeddingEngine.embed(memory.content);
      
      if (this.memoryStore && memory.id) {
        await this.memoryStore.update(memory.id, {
          embedding,
          metadata: { vectorized: true, vectorizedAt: new Date().toISOString() }
        });
      }
      
      console.log(`[ChatMemoryIntegration] 記憶向量化完成: ${memory.id}`);
      return embedding;
    } catch (e) {
      console.error('[ChatMemoryIntegration] 向量化失敗:', e);
      return this._simpleHashEmbedding(memory.content);
    }
  }

  async vectorizePendingMemories() {
    if (this.isProcessing) {
      console.log('[ChatMemoryIntegration] 正在處理中，跳過');
      return { processed: 0 };
    }
    
    if (!this.memoryStore) {
      console.warn('[ChatMemoryIntegration] MemoryStore 未初始化');
      return { processed: 0 };
    }
    
    this.isProcessing = true;
    let processed = 0;
    
    try {
      const allMemories = await this.memoryStore.getAll();
      const unvectorized = allMemories.filter(m => 
        m.metadata?.type === 'chat_memory' && 
        !m.metadata?.vectorized
      );
      
      console.log(`[ChatMemoryIntegration] 發現 ${unvectorized.length} 條待向量化聊天記憶`);
      
      for (const memory of unvectorized.slice(0, this.config.batchSize)) {
        try {
          await this.vectorizeChatMemory(memory);
          processed++;
        } catch (e) {
          console.warn(`[ChatMemoryIntegration] 向量化失敗: ${memory.id}`, e);
        }
      }
      
      this.lastVectorizeTime = new Date().toISOString();
    } finally {
      this.isProcessing = false;
    }
    
    return { processed };
  }

  async searchChatMemories(query, options = {}) {
    if (!this.memoryStore) {
      return [];
    }
    
    if (this.embeddingEngine?.isInitialized && options.useVector) {
      try {
        const queryEmbedding = await this.embeddingEngine.embed(query);
        const results = await this.memoryStore.searchByEmbedding(queryEmbedding, options.limit || 10);
        return results.filter(m => m.metadata?.type === 'chat_memory');
      } catch (e) {
        console.warn('[ChatMemoryIntegration] 向量搜索失敗，使用關鍵字搜索:', e);
      }
    }
    
    const allMemories = await this.memoryStore.getAll();
    const chatMemories = allMemories.filter(m => m.metadata?.type === 'chat_memory');
    
    const queryLower = query.toLowerCase();
    return chatMemories
      .filter(m => m.content.toLowerCase().includes(queryLower))
      .slice(0, options.limit || 10);
  }

  async getRecentChatMemories(limit = 20, sessionId = null) {
    if (!this.memoryStore) {
      return this._loadFromLocalStorage(limit);
    }
    
    const filters = { type: 'chat_memory' };
    if (sessionId) {
      filters.sessionId = sessionId;
    }
    
    const memories = await this.memoryStore.query({
      ...filters,
      limit
    });
    
    return memories.sort((a, b) => 
      new Date(b.metadata?.created) - new Date(a.metadata?.created)
    );
  }

  async classifyChatMemories() {
    if (!this.memoryStore || !this.classifier) {
      console.log('[ChatMemoryIntegration] 分類器未初始化，跳過');
      return { classified: 0 };
    }
    
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
        console.warn(`[ChatMemoryIntegration] 分類失敗: ${memory.id}`, e);
      }
    }
    
    console.log(`[ChatMemoryIntegration] 分類完成: ${classified} 條`);
    return { classified };
  }

  async summarizeChatMemories(sessionId) {
    const memories = await this.getRecentChatMemories(100, sessionId);
    
    if (memories.length === 0) {
      return null;
    }
    
    const summary = {
      sessionId,
      totalMessages: memories.length,
      userMessages: memories.filter(m => m.role === 'user').length,
      aiMessages: memories.filter(m => m.role === 'assistant').length,
      timeRange: {
        start: memories[memories.length - 1]?.metadata?.created,
        end: memories[0]?.metadata?.created
      },
      topEmotions: this._extractTopEmotions(memories),
      topTags: this._extractTopTags(memories),
      avgImportance: memories.reduce((sum, m) => sum + (m.metadata?.importance || 5), 0) / memories.length
    };
    
    return summary;
  }

  async pruneOldMemories() {
    if (!this.memoryStore) {
      return { pruned: 0 };
    }
    
    const allMemories = await this.memoryStore.getAll();
    const chatMemories = allMemories.filter(m => m.metadata?.type === 'chat_memory');
    
    if (chatMemories.length <= this.config.maxChatMemories) {
      return { pruned: 0 };
    }
    
    const toPrune = chatMemories.length - this.config.maxChatMemories;
    const sorted = chatMemories.sort((a, b) => {
      const impA = a.metadata?.importance || 5;
      const impB = b.metadata?.importance || 5;
      if (impA !== impB) return impA - impB;
      
      return new Date(a.metadata?.created) - new Date(b.metadata?.created);
    });
    
    let pruned = 0;
    for (const memory of sorted.slice(0, toPrune)) {
      try {
        if (memory.metadata?.importance < this.config.importanceThreshold) {
          await this.memoryStore.delete(memory.id);
          pruned++;
        }
      } catch (e) {
        console.warn(`[ChatMemoryIntegration] 刪除記憶失敗: ${memory.id}`, e);
      }
    }
    
    console.log(`[ChatMemoryIntegration] 清理完成: ${pruned} 條舊記憶`);
    return { pruned };
  }

  _extractTextContent(content) {
    if (typeof content === 'string') {
      return content.replace(/<[^>]*>/g, '').trim();
    }
    return '';
  }

  _buildMemoryContent(message, meta) {
    const role = message.role === 'user' ? meta.userName || 'User' : meta.charName || 'AI';
    const content = this._extractTextContent(message.content);
    const timestamp = message.timestamp || new Date().toISOString();
    
    return `[聊天記憶] ${role} 在 ${timestamp} 說：${content}`;
  }

  _extractTags(message, meta) {
    const tags = ['chat', message.role === 'user' ? 'user_message' : 'ai_response'];
    
    const content = this._extractTextContent(message.content).toLowerCase();
    
    const emotionKeywords = {
      '開心': ['開心', '快樂', '哈哈', '笑', '高興', '太好了'],
      '難過': ['難過', '傷心', '哭', '哭哭', '嗚嗚', '心疼'],
      '生氣': ['生氣', '憤怒', '氣死', '可惡', '討厭'],
      '擔心': ['擔心', '焦慮', '緊張', '害怕', '恐懼'],
      '愛': ['愛', '喜歡', '想你', '愛你', '親愛的'],
      '疑問': ['？', '嗎', '呢', '什麼', '為什麼', '怎麼']
    };
    
    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      if (keywords.some(kw => content.includes(kw))) {
        tags.push(emotion);
      }
    }
    
    if (meta.charName) {
      tags.push(meta.charName);
    }
    
    return [...new Set(tags)];
  }

  _calculateImportance(message, meta) {
    let importance = 5;
    
    const content = this._extractTextContent(message.content);
    
    if (content.length > 200) importance += 1;
    if (content.length > 500) importance += 1;
    
    const importantKeywords = ['重要', '記住', '不要忘記', '答應', '約定', '承諾', '永遠', '愛'];
    for (const kw of importantKeywords) {
      if (content.includes(kw)) {
        importance += 1;
      }
    }
    
    const emotionKeywords = ['愛', '喜歡', '開心', '難過', '生氣', '擔心'];
    for (const kw of emotionKeywords) {
      if (content.includes(kw)) {
        importance += 0.5;
      }
    }
    
    return Math.min(10, Math.max(1, Math.round(importance)));
  }

  async _analyzeEmotion(content) {
    const emotion = { valence: 0.5, arousal: 0.5 };
    
    const positiveWords = ['開心', '快樂', '喜歡', '愛', '高興', '幸福', '美好', '太好了', '哈哈'];
    const negativeWords = ['難過', '傷心', '生氣', '討厭', '憤怒', '害怕', '擔心', '焦慮'];
    const highArousalWords = ['興奮', '激動', '憤怒', '驚訝', '震驚', '太棒了'];
    const lowArousalWords = ['平靜', '放鬆', '安靜', '無聊', '累了'];
    
    const text = content.toLowerCase();
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    for (const word of positiveWords) {
      if (text.includes(word)) positiveCount++;
    }
    for (const word of negativeWords) {
      if (text.includes(word)) negativeCount++;
    }
    
    if (positiveCount > negativeCount) {
      emotion.valence = Math.min(1, 0.5 + positiveCount * 0.1);
    } else if (negativeCount > positiveCount) {
      emotion.valence = Math.max(0, 0.5 - negativeCount * 0.1);
    }
    
    let highCount = 0;
    let lowCount = 0;
    
    for (const word of highArousalWords) {
      if (text.includes(word)) highCount++;
    }
    for (const word of lowArousalWords) {
      if (text.includes(word)) lowCount++;
    }
    
    if (highCount > lowCount) {
      emotion.arousal = Math.min(1, 0.5 + highCount * 0.1);
    } else if (lowCount > highCount) {
      emotion.arousal = Math.max(0, 0.5 - lowCount * 0.1);
    }
    
    return emotion;
  }

  _scheduleVectorization(memory) {
    this.pendingQueue.push(memory);
    
    if (this.vectorizeTimer) {
      clearTimeout(this.vectorizeTimer);
    }
    
    this.vectorizeTimer = setTimeout(() => {
      this.vectorizePendingMemories();
    }, this.config.vectorizeDelay);
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

  _saveToLocalStorage(memory) {
    try {
      const key = 'sx_chat_memories';
      const raw = localStorage.getItem(key);
      const memories = raw ? JSON.parse(raw) : [];
      
      memories.unshift(memory);
      
      if (memories.length > 100) {
        memories.splice(100);
      }
      
      localStorage.setItem(key, JSON.stringify(memories));
    } catch (e) {
      console.warn('[ChatMemoryIntegration] localStorage 儲存失敗:', e);
    }
  }

  _loadFromLocalStorage(limit = 20) {
    try {
      const key = 'sx_chat_memories';
      const raw = localStorage.getItem(key);
      const memories = raw ? JSON.parse(raw) : [];
      return memories.slice(0, limit);
    } catch (e) {
      return [];
    }
  }

  _extractTopEmotions(memories) {
    const emotionCounts = {};
    
    for (const memory of memories) {
      const tags = memory.tags || [];
      for (const tag of tags) {
        if (['開心', '難過', '生氣', '擔心', '愛', '疑問'].includes(tag)) {
          emotionCounts[tag] = (emotionCounts[tag] || 0) + 1;
        }
      }
    }
    
    return Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([emotion, count]) => ({ emotion, count }));
  }

  _extractTopTags(memories) {
    const tagCounts = {};
    
    for (const memory of memories) {
      const tags = memory.tags || [];
      for (const tag of tags) {
        if (!['chat', 'user_message', 'ai_response'].includes(tag)) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      }
    }
    
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));
  }

  getStats() {
    return {
      isProcessing: this.isProcessing,
      pendingQueueSize: this.pendingQueue.length,
      lastVectorizeTime: this.lastVectorizeTime,
      config: { ...this.config },
      hasMemoryStore: !!this.memoryStore,
      hasEmbeddingEngine: !!this.embeddingEngine,
      embeddingInitialized: this.embeddingEngine?.isInitialized || false
    };
  }
}

if (typeof window !== 'undefined') {
  window.ChatMemoryIntegration = ChatMemoryIntegration;
}
