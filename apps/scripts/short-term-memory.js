class ShortTermMemory {
  constructor(options = {}) {
    this.config = {
      maxCapacity: options.maxCapacity || 100,
      decayMinutes: options.decayMinutes || 30,
      importanceThreshold: options.importanceThreshold || 6,
      autoSaveInterval: options.autoSaveInterval || 60000
    };
    
    this.buffer = [];
    this.isInitialized = false;
    this.storageKey = 'sx_short_term_memory';
    this.idbKey = 'sx_short_term_memory_idb';
    this.autoSaveTimer = null;
    this.decayTimer = null;
    this.idbSaveTimer = null;
  }
  
  initialize() {
    this._loadFromStorage();
    this._loadFromIndexedDB();
    this._startAutoSave();
    this._startDecayCheck();
    this._startIndexedDBSync();
    this.isInitialized = true;
    console.log('[ShortTermMemory] 初始化完成');
    return true;
  }
  
  async _loadFromIndexedDB() {
    if (typeof localforage === 'undefined') return;
    
    try {
      const idbData = await localforage.getItem(this.idbKey);
      if (idbData) {
        const parsed = typeof idbData === 'string' ? JSON.parse(idbData) : idbData;
        if (Array.isArray(parsed) && parsed.length > 0) {
          const localIds = new Set(this.buffer.map(m => m.id));
          const newFromIdb = parsed.filter(m => !localIds.has(m.id));
          
          if (newFromIdb.length > 0) {
            this.buffer = [...this.buffer, ...newFromIdb];
            this.buffer.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            
            if (this.buffer.length > this.config.maxCapacity) {
              this.buffer = this.buffer.slice(-this.config.maxCapacity);
            }
            
            this._saveToStorage();
            console.log('[ShortTermMemory] 從 IndexedDB 載入 ' + newFromIdb.length + ' 條記憶');
          }
        }
      }
    } catch (e) {
      console.warn('[ShortTermMemory] 從 IndexedDB 載入失敗:', e);
    }
  }
  
  async _saveToIndexedDB() {
    if (typeof localforage === 'undefined') return;
    
    try {
      await localforage.setItem(this.idbKey, JSON.stringify(this.buffer));
    } catch (e) {
      console.warn('[ShortTermMemory] 儲存到 IndexedDB 失敗:', e);
    }
  }
  
  _startIndexedDBSync() {
    if (this.idbSaveTimer) clearInterval(this.idbSaveTimer);
    
    this.idbSaveTimer = setInterval(() => {
      this._saveToIndexedDB();
    }, 30000);
  }
  
  push(content, options = {}) {
    if (!content || typeof content !== 'string') {
      return null;
    }
    
    const entry = {
      id: 'stm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      content,
      role: options.role || 'unknown',
      source: options.source || 'chat',
      importance: options.importance || 5,
      emotion: options.emotion || null,
      tags: options.tags || [],
      createdAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
      accessCount: 1,
      metadata: options.metadata || {}
    };
    
    this.buffer.push(entry);
    
    if (this.buffer.length > this.config.maxCapacity) {
      const removed = this.buffer.shift();
      console.log('[ShortTermMemory] 容量已滿，移除最舊記憶: ' + removed.id);
    }
    
    this._saveToStorage();
    this._saveToIndexedDB();
    
    console.log('[ShortTermMemory] 新增記憶: ' + entry.id + ' (當前 ' + this.buffer.length + '/' + this.config.maxCapacity + ')');
    return entry;
  }
  
  getAll() {
    return [...this.buffer];
  }
  
  getRecent(limit = 20) {
    return this.buffer.slice(-limit);
  }
  
  getById(id) {
    const entry = this.buffer.find(e => e.id === id);
    if (entry) {
      entry.lastAccessed = new Date().toISOString();
      entry.accessCount++;
    }
    return entry || null;
  }
  
  remove(id) {
    const index = this.buffer.findIndex(e => e.id === id);
    if (index >= 0) {
      this.buffer.splice(index, 1);
      this._saveToStorage();
      this._saveToIndexedDB();
      return true;
    }
    return false;
  }
  
  clear() {
    this.buffer = [];
    this._saveToStorage();
    this._saveToIndexedDB();
    console.log('[ShortTermMemory] 已清空');
  }
  
  getStats() {
    const now = Date.now();
    const avgAge = this.buffer.length > 0 
      ? this.buffer.reduce((sum, e) => sum + (now - new Date(e.createdAt).getTime()), 0) / this.buffer.length / 60000
      : 0;
    
    const highImportance = this.buffer.filter(e => e.importance >= this.config.importanceThreshold).length;
    
    return {
      count: this.buffer.length,
      maxCapacity: this.config.maxCapacity,
      avgAgeMinutes: Math.round(avgAge),
      highImportanceCount: highImportance,
      oldestAge: this.buffer.length > 0 
        ? Math.round((now - new Date(this.buffer[0].createdAt).getTime()) / 60000)
        : 0
    };
  }
  
  getReadyForConsolidation() {
    const now = Date.now();
    const threshold = this.config.decayMinutes * 60 * 1000;
    
    const ready = this.buffer.filter(entry => {
      const age = now - new Date(entry.createdAt).getTime();
      const isOld = age >= threshold;
      const isImportant = entry.importance >= this.config.importanceThreshold;
      
      return isOld || isImportant;
    });
    
    return ready;
  }
  
  markConsolidated(ids) {
    for (const id of ids) {
      const index = this.buffer.findIndex(e => e.id === id);
      if (index >= 0) {
        this.buffer.splice(index, 1);
      }
    }
    this._saveToStorage();
    this._saveToIndexedDB();
    console.log('[ShortTermMemory] 已標記 ' + ids.length + ' 條為已鞏固並移除');
  }
  
  _loadFromStorage() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
          const now = Date.now();
          const maxAge = this.config.decayMinutes * 60 * 1000 * 2;
          
          this.buffer = data.filter(entry => {
            const age = now - new Date(entry.createdAt).getTime();
            return age < maxAge;
          });
          
          console.log('[ShortTermMemory] 從 localStorage 載入 ' + this.buffer.length + ' 條記憶');
        }
      }
    } catch (e) {
      console.warn('[ShortTermMemory] 載入失敗:', e);
      this.buffer = [];
    }
  }
  
  _saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.buffer));
    } catch (e) {
      console.warn('[ShortTermMemory] 儲存失敗:', e);
    }
  }
  
  _startAutoSave() {
    if (this.autoSaveTimer) clearInterval(this.autoSaveTimer);
    
    this.autoSaveTimer = setInterval(() => {
      this._saveToStorage();
    }, this.config.autoSaveInterval);
  }
  
  _startDecayCheck() {
    if (this.decayTimer) clearInterval(this.decayTimer);
    
    this.decayTimer = setInterval(() => {
      const now = Date.now();
      const threshold = this.config.decayMinutes * 60 * 1000 * 2;
      
      const before = this.buffer.length;
      this.buffer = this.buffer.filter(entry => {
        const age = now - new Date(entry.createdAt).getTime();
        return age < threshold || entry.importance >= this.config.importanceThreshold;
      });
      
      if (this.buffer.length < before) {
        console.log('[ShortTermMemory] 衰減清理: ' + before + ' -> ' + this.buffer.length);
        this._saveToStorage();
        this._saveToIndexedDB();
      }
    }, 60000);
  }
  
  export() {
    return {
      config: this.config,
      buffer: this.buffer,
      exportedAt: new Date().toISOString()
    };
  }
  
  import(data) {
    if (data.buffer && Array.isArray(data.buffer)) {
      this.buffer = data.buffer;
      this._saveToStorage();
      this._saveToIndexedDB();
      console.log('[ShortTermMemory] 匯入 ' + this.buffer.length + ' 條記憶');
    }
  }
  
  destroy() {
    if (this.autoSaveTimer) clearInterval(this.autoSaveTimer);
    if (this.decayTimer) clearInterval(this.decayTimer);
    if (this.idbSaveTimer) clearInterval(this.idbSaveTimer);
  }
}

if (typeof window !== 'undefined') {
  window.ShortTermMemory = ShortTermMemory;
}
