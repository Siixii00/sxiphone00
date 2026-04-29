const DB_NAME = 'sx_memory_db';
const DB_VERSION = 2;

class MemoryStore {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized && this.db) {
      console.log('[MemoryStore] 已初始化，跳過');
      return this.db;
    }

    return new Promise((resolve, reject) => {
      console.log('[MemoryStore] 開始初始化 IndexedDB...');
      
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error('[MemoryStore] IndexedDB 打開失敗:', event.target.error);
        reject(new Error(`IndexedDB 初始化失敗: ${event.target.error}`));
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.isInitialized = true;
        console.log('[MemoryStore] IndexedDB 初始化成功');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        console.log('[MemoryStore] 執行 schema 升級...');
        const db = event.target.result;
        this._createSchema(db);
      };
    });
  }

  _createSchema(db) {
    if (!db.objectStoreNames.contains('memories')) {
      const memoriesStore = db.createObjectStore('memories', { keyPath: 'id' });
      memoriesStore.createIndex('type', 'metadata.type', { unique: false });
      memoriesStore.createIndex('importance', 'metadata.importance', { unique: false });
      memoriesStore.createIndex('lastActive', 'metadata.lastActive', { unique: false });
      memoriesStore.createIndex('created', 'metadata.created', { unique: false });
      memoriesStore.createIndex('region', 'region.primary', { unique: false });
      memoriesStore.createIndex('consolidated', 'metadata.consolidated', { unique: false });
      console.log('[MemoryStore] memories store 創建完成');
    }

    if (!db.objectStoreNames.contains('embeddings')) {
      const embeddingsStore = db.createObjectStore('embeddings', { keyPath: 'id' });
      embeddingsStore.createIndex('createdAt', 'createdAt', { unique: false });
      console.log('[MemoryStore] embeddings store 創建完成');
    }

    if (!db.objectStoreNames.contains('metadata')) {
      db.createObjectStore('metadata', { keyPath: 'key' });
      console.log('[MemoryStore] metadata store 創建完成');
    }

    console.log('[MemoryStore] Schema 升級完成');
  }

  async close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
      console.log('[MemoryStore] 資料庫已關閉');
    }
  }

  async clear() {
    if (!this.db) {
      throw new Error('資料庫未初始化');
    }

    const storeNames = ['memories', 'embeddings', 'metadata'];
    
    for (const storeName of storeNames) {
      await this._clearStore(storeName);
    }
    
    console.log('[MemoryStore] 所有資料已清除');
  }

  _clearStore(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => {
        console.log(`[MemoryStore] ${storeName} 已清除`);
        resolve();
      };

      request.onerror = (event) => {
        console.error(`[MemoryStore] 清除 ${storeName} 失敗:`, event.target.error);
        reject(event.target.error);
      };
    });
  }

  getStore(storeName, mode = 'readonly') {
    if (!this.db) {
      throw new Error('資料庫未初始化');
    }
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  async addMemory(memory) {
    return this._addRecord('memories', memory);
  }

  async getMemory(id) {
    return this._getRecord('memories', id);
  }

  async addEmbedding(embedding) {
    return this._addRecord('embeddings', embedding);
  }

  async getEmbedding(id) {
    return this._getRecord('embeddings', id);
  }

  async setMetadata(key, value) {
    return this._addRecord('metadata', { key, value });
  }

  async getMetadata(key) {
    const record = await this._getRecord('metadata', key);
    return record ? record.value : null;
  }

  _addRecord(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => {
        console.error(`[MemoryStore] 新增 ${storeName} 失敗:`, event.target.error);
        reject(event.target.error);
      };
    });
  }

  _getRecord(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => {
        console.error(`[MemoryStore] 讀取 ${storeName} 失敗:`, event.target.error);
        reject(event.target.error);
      };
    });
  }

  async create(memory) {
    if (!this.db) {
      throw new Error('資料庫未初始化');
    }

    const now = new Date().toISOString();
    const fullMemory = {
      id: memory.id || `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: memory.content || '',
      embedding: memory.embedding || null,
      metadata: {
        created: memory.metadata?.created || now,
        lastActive: memory.metadata?.lastActive || now,
        activationCount: memory.metadata?.activationCount || 1,
        importance: memory.metadata?.importance || 5,
        type: memory.metadata?.type || 'dynamic',
        source: memory.metadata?.source || 'chat',
        resolved: memory.metadata?.resolved || false,
        digested: memory.metadata?.digested || false,
        pinned: memory.metadata?.pinned || false,
        consolidated: memory.metadata?.consolidated || false,
        consolidatedAt: memory.metadata?.consolidatedAt || null
      },
      emotion: memory.emotion || { valence: 0.5, arousal: 0.5, modelValence: null },
      tags: memory.tags || [],
      domain: memory.domain || [],
      hash: memory.hash || this._djb2Hash(memory.content || ''),
      score: memory.score || 0,
      dimensions: memory.dimensions || null,
      region: memory.region || null,
      standardized: memory.standardized || null
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction('memories', 'readwrite');
      const store = transaction.objectStore('memories');
      const request = store.add(fullMemory);

      request.onsuccess = () => {
        console.log(`[MemoryStore] 記憶創建成功: ${fullMemory.id}`);
        resolve(fullMemory);
      };

      request.onerror = (event) => {
        console.error('[MemoryStore] 創建記憶失敗:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async read(id) {
    if (!this.db) {
      throw new Error('資料庫未初始化');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction('memories', 'readonly');
      const store = transaction.objectStore('memories');
      const request = store.get(id);

      request.onsuccess = () => {
        if (request.result) {
          console.log(`[MemoryStore] 讀取記憶成功: ${id}`);
        } else {
          console.log(`[MemoryStore] 記憶不存在: ${id}`);
        }
        resolve(request.result || null);
      };

      request.onerror = (event) => {
        console.error('[MemoryStore] 讀取記憶失敗:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async update(id, updates) {
    if (!this.db) {
      throw new Error('資料庫未初始化');
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
    if (updates.metadata) {
      updated.metadata = { ...updated.metadata, ...updates.metadata };
      if (updates.metadata.lastActive === undefined) {
        updated.metadata.lastActive = new Date().toISOString();
      }
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
    if (updates.dimensions !== undefined) {
      updated.dimensions = updates.dimensions;
    }
    if (updates.region !== undefined) {
      updated.region = updates.region;
    }
    if (updates.standardized !== undefined) {
      updated.standardized = updates.standardized;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction('memories', 'readwrite');
      const store = transaction.objectStore('memories');
      const request = store.put(updated);

      request.onsuccess = () => {
        console.log(`[MemoryStore] 更新記憶成功: ${id}`);
        resolve(updated);
      };

      request.onerror = (event) => {
        console.error('[MemoryStore] 更新記憶失敗:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async delete(id) {
    if (!this.db) {
      throw new Error('資料庫未初始化');
    }

    const existing = await this.read(id);
    if (!existing) {
      console.log(`[MemoryStore] 記憶不存在，無需刪除: ${id}`);
      return false;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction('memories', 'readwrite');
      const store = transaction.objectStore('memories');
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log(`[MemoryStore] 刪除記憶成功: ${id}`);
        resolve(true);
      };

      request.onerror = (event) => {
        console.error('[MemoryStore] 刪除記憶失敗:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async getAll(options = {}) {
    if (!this.db) {
      throw new Error('資料庫未初始化');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction('memories', 'readonly');
      const store = transaction.objectStore('memories');
      const request = store.getAll();

      request.onsuccess = () => {
        let results = request.result || [];
        
        if (options.type) {
          results = results.filter(m => m.metadata?.type === options.type);
        }
        if (options.minImportance !== undefined) {
          results = results.filter(m => (m.metadata?.importance || 0) >= options.minImportance);
        }
        if (options.limit && results.length > options.limit) {
          results = results.slice(0, options.limit);
        }

        console.log(`[MemoryStore] 獲取所有記憶: ${results.length} 條`);
        resolve(results);
      };

      request.onerror = (event) => {
        console.error('[MemoryStore] 獲取所有記憶失敗:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async getByType(type) {
    return this.getAll({ type });
  }

  async query(filters = {}) {
    if (!this.db) {
      throw new Error('資料庫未初始化');
    }

    let results = await this.getAll();

    if (filters.type) {
      results = results.filter(m => m.metadata?.type === filters.type);
    }
    if (filters.minImportance !== undefined) {
      results = results.filter(m => (m.metadata?.importance || 0) >= filters.minImportance);
    }
    if (filters.maxImportance !== undefined) {
      results = results.filter(m => (m.metadata?.importance || 0) <= filters.maxImportance);
    }
    if (filters.resolved !== undefined) {
      results = results.filter(m => m.metadata?.resolved === filters.resolved);
    }
    if (filters.pinned !== undefined) {
      results = results.filter(m => m.metadata?.pinned === filters.pinned);
    }
    if (filters.tags && filters.tags.length > 0) {
      results = results.filter(m => 
        filters.tags.some(tag => m.tags?.includes(tag))
      );
    }
    if (filters.domain && filters.domain.length > 0) {
      results = results.filter(m => 
        filters.domain.some(d => m.domain?.includes(d))
      );
    }
    if (filters.since) {
      const sinceDate = new Date(filters.since);
      results = results.filter(m => new Date(m.metadata?.created) >= sinceDate);
    }
    if (filters.until) {
      const untilDate = new Date(filters.until);
      results = results.filter(m => new Date(m.metadata?.created) <= untilDate);
    }
    if (filters.region) {
      results = results.filter(m => m.region?.primary === filters.region);
    }
    if (filters.consolidated !== undefined) {
      results = results.filter(m => m.metadata?.consolidated === filters.consolidated);
    }
    if (filters.limit && results.length > filters.limit) {
      results = results.slice(0, filters.limit);
    }

    console.log(`[MemoryStore] 查詢結果: ${results.length} 條`);
    return results;
  }

  async searchByEmbedding(embedding, k = 10) {
    if (!this.db) {
      throw new Error('資料庫未初始化');
    }
    if (!embedding || !Array.isArray(embedding)) {
      throw new Error('無效的嵌入向量');
    }

    const allMemories = await this.getAll();
    const memoriesWithEmbedding = allMemories.filter(m => m.embedding && Array.isArray(m.embedding));

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
    if (!this.db) {
      throw new Error('資料庫未初始化');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction('memories', 'readonly');
      const store = transaction.objectStore('memories');
      const request = store.count();

      request.onsuccess = () => {
        console.log(`[MemoryStore] 記憶總數: ${request.result}`);
        resolve(request.result);
      };

      request.onerror = (event) => {
        console.error('[MemoryStore] 獲取計數失敗:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async exists(id) {
    const memory = await this.read(id);
    return memory !== null;
  }

  _djb2Hash(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    return Math.abs(hash).toString(36);
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
}

if (typeof window !== 'undefined') {
  window.MemoryStore = MemoryStore;
}
