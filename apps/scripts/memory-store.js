class MemoryStore {
  constructor() {
    this.sxStorage = null;
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) {
      return true;
    }

    if (typeof sxStorage !== 'undefined') {
      this.sxStorage = sxStorage;
      await this.sxStorage.init();
      this.isInitialized = true;
      console.log('[MemoryStore] 初始化完成，使用 sxStorage');
      return true;
    }

    console.warn('[MemoryStore] sxStorage 未載入');
    return false;
  }

  get db() {
    return this.sxStorage?.db || null;
  }

  async close() {
    if (this.sxStorage) {
      await this.sxStorage.close();
    }
    this.isInitialized = false;
    console.log('[MemoryStore] 已關閉');
  }

  async clear() {
    if (!this.sxStorage) {
      throw new Error('Storage 未初始化');
    }
    
    await this.sxStorage._clearStore('memories');
    await this.sxStorage._clearStore('embeddings');
    console.log('[MemoryStore] 所有記憶資料已清除');
  }

  async create(memory) {
    if (!this.sxStorage) {
      await this.init();
    }

    const contentHash = this._djb2Hash(memory.content || '');
    
    const existing = await this._findByHash(contentHash);
    if (existing) {
      console.log(`[MemoryStore] 發現重複記憶，強化現有記憶: ${existing.id}`);
      return this._reinforceExisting(existing, memory);
    }

    const now = new Date().toISOString();
    const fullMemory = {
      id: memory.id || `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: memory.content || '',
      embedding: memory.embedding || null,
      charId: memory.charId || null,
      type: memory.type || memory.metadata?.type || 'dynamic',
      importance: memory.importance || memory.metadata?.importance || 5,
      tags: memory.tags || [],
      domain: memory.domain || [],
      emotion: memory.emotion || { valence: 0.5, arousal: 0.5 },
      hash: contentHash,
      score: memory.score || 0,
      region: memory.region || null,
      createdAt: memory.createdAt || memory.metadata?.created || now,
      lastActive: memory.lastActive || memory.metadata?.lastActive || now,
      activationCount: memory.activationCount || memory.metadata?.activationCount || 1,
      source: memory.source || memory.metadata?.source || 'chat',
      consolidated: memory.consolidated || memory.metadata?.consolidated || false,
      metadata: memory.metadata || {}
    };

    await this.sxStorage.saveMemory(fullMemory);
    console.log(`[MemoryStore] 記憶創建成功: ${fullMemory.id}`);
    return fullMemory;
  }

  async _findByHash(hash) {
    if (!this.sxStorage) return null;
    
    const memories = await this.sxStorage.getAllMemories();
    return memories.find(m => m.hash === hash) || null;
  }

  async _reinforceExisting(existing, newMemory) {
    const updated = { ...existing };
    
    updated.activationCount = (updated.activationCount || 1) + 1;
    updated.lastActive = new Date().toISOString();
    updated.importance = Math.max(updated.importance || 5, newMemory.importance || newMemory.metadata?.importance || 5);
    updated.reinforcementCount = (updated.reinforcementCount || 0) + 1;
    updated.lastReinforced = new Date().toISOString();
    
    if (newMemory.tags && newMemory.tags.length > 0) {
      updated.tags = [...new Set([...(updated.tags || []), ...newMemory.tags])];
    }
    
    if (newMemory.domain && newMemory.domain.length > 0) {
      updated.domain = [...new Set([...(updated.domain || []), ...newMemory.domain])];
    }
    
    if (newMemory.emotion) {
      updated.emotion = {
        valence: (updated.emotion?.valence || 0.5) * 0.7 + (newMemory.emotion.valence || 0.5) * 0.3,
        arousal: Math.max(updated.emotion?.arousal || 0.5, newMemory.emotion.arousal || 0.5)
      };
    }

    await this.sxStorage.saveMemory(updated);
    console.log(`[MemoryStore] 記憶強化成功: ${updated.id}`);
    return updated;
  }

  async read(id) {
    if (!this.sxStorage) {
      await this.init();
    }
    return this.sxStorage.getMemory(id);
  }

  async update(id, updates) {
    if (!this.sxStorage) {
      await this.init();
    }

    const existing = await this.read(id);
    if (!existing) {
      throw new Error(`記憶不存在: ${id}`);
    }

    const updated = { ...existing };

    if (updates.content !== undefined) {
      updated.content = updates.content;
      updated.hash = this._djb2Hash(updates.content);
    }
    if (updates.embedding !== undefined) {
      updated.embedding = updates.embedding;
    }
    if (updates.importance !== undefined) {
      updated.importance = updates.importance;
    }
    if (updates.type !== undefined) {
      updated.type = updates.type;
    }
    if (updates.charId !== undefined) {
      updated.charId = updates.charId;
    }
    if (updates.emotion) {
      updated.emotion = { ...updated.emotion, ...updates.emotion };
    }
    if (updates.tags !== undefined) {
      updated.tags = updates.tags;
    }
    if (updates.domain !== undefined) {
      updated.domain = updates.domain;
    }
    if (updates.score !== undefined) {
      updated.score = updates.score;
    }
    if (updates.region !== undefined) {
      updated.region = updates.region;
    }
    if (updates.metadata) {
      updated.metadata = { ...updated.metadata, ...updates.metadata };
    }
    
    updated.lastActive = new Date().toISOString();

    await this.sxStorage.saveMemory(updated);
    console.log(`[MemoryStore] 更新記憶成功: ${id}`);
    return updated;
  }

  async delete(id) {
    if (!this.sxStorage) {
      await this.init();
    }

    const existing = await this.read(id);
    if (!existing) {
      console.log(`[MemoryStore] 記憶不存在，無需刪除: ${id}`);
      return false;
    }

    await this.sxStorage.deleteMemory(id);
    console.log(`[MemoryStore] 刪除記憶成功: ${id}`);
    return true;
  }

  async getAll(options = {}) {
    if (!this.sxStorage) {
      await this.init();
    }
    return this.sxStorage.getAllMemories(options);
  }

  async getByType(type) {
    return this.getAll({ type });
  }

  async getByCharId(charId) {
    if (!this.sxStorage) {
      await this.init();
    }
    return this.sxStorage.getMemoriesByCharId(charId);
  }

  async query(filters = {}) {
    return this.getAll(filters);
  }

  async searchByEmbedding(embedding, k = 10) {
    if (!this.sxStorage) {
      await this.init();
    }
    if (!embedding) {
      throw new Error('無效的嵌入向量');
    }

    const allMemories = await this.getAll();
    const memoriesWithEmbedding = allMemories.filter(m => m.embedding);

    if (memoriesWithEmbedding.length === 0) {
      console.log('[MemoryStore] 沒有帶有嵌入向量的記憶');
      return [];
    }

    const similarities = memoriesWithEmbedding.map(m => ({
      memory: m,
      similarity: this._cosineSimilarity(embedding, m.embedding)
    }));

    similarities.sort((a, b) => b.similarity - a.similarity);

    const topK = similarities.slice(0, k);
    console.log(`[MemoryStore] 向量搜索返回 ${topK.length} 條結果`);
    return topK.map(item => ({
      ...item.memory,
      similarity: item.similarity
    }));
  }

  async count() {
    const memories = await this.getAll();
    return memories.length;
  }

  async exists(id) {
    const memory = await this.read(id);
    return memory !== null;
  }

  async addMemory(memory) {
    return this.create(memory);
  }

  async getMemory(id) {
    return this.read(id);
  }

  async addEmbedding(embedding) {
    if (!this.sxStorage) {
      await this.init();
    }
    
    const record = {
      id: embedding.id || `emb_${Date.now()}`,
      memoryId: embedding.memoryId,
      vector: embedding.vector || embedding.embedding,
      createdAt: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.sxStorage.db.transaction('embeddings', 'readwrite');
      const store = transaction.objectStore('embeddings');
      const request = store.put(record);

      request.onsuccess = () => resolve(record);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async getEmbedding(id) {
    if (!this.sxStorage) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.sxStorage.db.transaction('embeddings', 'readonly');
      const store = transaction.objectStore('embeddings');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async setMetadata(key, value) {
    if (!this.sxStorage) {
      await this.init();
    }
    return this.sxStorage.saveSetting(key, value);
  }

  async getMetadata(key) {
    if (!this.sxStorage) {
      await this.init();
    }
    return this.sxStorage.getSetting(key);
  }

  getStore(storeName, mode = 'readonly') {
    if (!this.sxStorage || !this.sxStorage.db) {
      throw new Error('資料庫未初始化');
    }
    const transaction = this.sxStorage.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  _djb2Hash(str) {
    let hash = 5381;
    const normalized = str.trim().toLowerCase();
    for (let i = 0; i < normalized.length; i++) {
      hash = ((hash << 5) + hash) + normalized.charCodeAt(i);
    }
    return Math.abs(hash).toString(36);
  }

  _cosineSimilarity(vecA, vecB) {
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

  _isCompressed(vector) {
    return vector && typeof vector === 'object' && vector.__compressed === true;
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
}

if (typeof window !== 'undefined') {
  window.MemoryStore = MemoryStore;
}
