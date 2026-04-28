const MemoryHelper = {
  _initialized: false,
  
  async ensureInit() {
    if (this._initialized) return true;
    
    const um = window.unifiedMemory || window.parent?.unifiedMemory;
    if (um && um.isInitialized) {
      this._initialized = true;
      return true;
    }
    
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const um = window.unifiedMemory || window.parent?.unifiedMemory;
        if (um && um.isInitialized) {
          this._initialized = true;
          clearInterval(checkInterval);
          resolve(true);
        }
      }, 100);
      
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(false);
      }, 5000);
    });
  },
  
  async recall(query, options = {}) {
    await this.ensureInit();
    
    return new Promise((resolve) => {
      const handler = (event) => {
        if (event.data?.type === 'UNIFIED_MEMORY_RECALL_RESULT') {
          window.removeEventListener('message', handler);
          resolve(event.data);
        }
      };
      
      window.addEventListener('message', handler);
      
      window.parent?.postMessage({
        type: 'UNIFIED_MEMORY_RECALL',
        payload: { query, options }
      }, '*');
      
      setTimeout(() => {
        window.removeEventListener('message', handler);
        resolve({ memories: [], error: 'timeout' });
      }, 10000);
    });
  },
  
  async memorize(content, options = {}) {
    await this.ensureInit();
    
    return new Promise((resolve) => {
      const handler = (event) => {
        if (event.data?.type === 'UNIFIED_MEMORY_MEMORIZE_RESULT') {
          window.removeEventListener('message', handler);
          resolve(event.data);
        }
      };
      
      window.addEventListener('message', handler);
      
      window.parent?.postMessage({
        type: 'UNIFIED_MEMORY_MEMORIZE',
        payload: { content, options }
      }, '*');
      
      setTimeout(() => {
        window.removeEventListener('message', handler);
        resolve({ success: false, error: 'timeout' });
      }, 10000);
    });
  },
  
  async forget(id) {
    await this.ensureInit();
    
    return new Promise((resolve) => {
      const handler = (event) => {
        if (event.data?.type === 'UNIFIED_MEMORY_FORGET_RESULT') {
          window.removeEventListener('message', handler);
          resolve(event.data);
        }
      };
      
      window.addEventListener('message', handler);
      
      window.parent?.postMessage({
        type: 'UNIFIED_MEMORY_FORGET',
        payload: { id }
      }, '*');
      
      setTimeout(() => {
        window.removeEventListener('message', handler);
        resolve({ success: false, error: 'timeout' });
      }, 10000);
    });
  },
  
  async sleep(reason = 'manual') {
    await this.ensureInit();
    
    return new Promise((resolve) => {
      const handler = (event) => {
        if (event.data?.type === 'UNIFIED_MEMORY_SLEEP_RESULT') {
          window.removeEventListener('message', handler);
          resolve(event.data);
        }
      };
      
      window.addEventListener('message', handler);
      
      window.parent?.postMessage({
        type: 'UNIFIED_MEMORY_SLEEP',
        payload: { reason }
      }, '*');
      
      setTimeout(() => {
        window.removeEventListener('message', handler);
        resolve({ success: false, error: 'timeout' });
      }, 30000);
    });
  },
  
  async awaken() {
    await this.ensureInit();
    
    return new Promise((resolve) => {
      const handler = (event) => {
        if (event.data?.type === 'UNIFIED_MEMORY_AWAKEN_RESULT') {
          window.removeEventListener('message', handler);
          resolve(event.data);
        }
      };
      
      window.addEventListener('message', handler);
      
      window.parent?.postMessage({
        type: 'UNIFIED_MEMORY_AWAKEN',
        payload: {}
      }, '*');
      
      setTimeout(() => {
        window.removeEventListener('message', handler);
        resolve({ success: false, error: 'timeout' });
      }, 15000);
    });
  },
  
  setIdentity(identity) {
    window.parent?.postMessage({
      type: 'UNIFIED_MEMORY_SET_IDENTITY',
      payload: { identity }
    }, '*');
  },
  
  async getStats() {
    await this.ensureInit();
    
    return new Promise((resolve) => {
      const handler = (event) => {
        if (event.data?.type === 'UNIFIED_MEMORY_GET_STATS_RESULT') {
          window.removeEventListener('message', handler);
          resolve(event.data);
        }
      };
      
      window.addEventListener('message', handler);
      
      window.parent?.postMessage({
        type: 'UNIFIED_MEMORY_GET_STATS',
        payload: {}
      }, '*');
      
      setTimeout(() => {
        window.removeEventListener('message', handler);
        resolve({ isInitialized: false, error: 'timeout' });
      }, 5000);
    });
  },
  
  async export() {
    await this.ensureInit();
    
    return new Promise((resolve) => {
      const handler = (event) => {
        if (event.data?.type === 'UNIFIED_MEMORY_EXPORT_RESULT') {
          window.removeEventListener('message', handler);
          resolve(event.data);
        }
      };
      
      window.addEventListener('message', handler);
      
      window.parent?.postMessage({
        type: 'UNIFIED_MEMORY_EXPORT',
        payload: {}
      }, '*');
      
      setTimeout(() => {
        window.removeEventListener('message', handler);
        resolve({ error: 'timeout' });
      }, 15000);
    });
  },
  
  async import(data) {
    await this.ensureInit();
    
    return new Promise((resolve) => {
      const handler = (event) => {
        if (event.data?.type === 'UNIFIED_MEMORY_IMPORT_RESULT') {
          window.removeEventListener('message', handler);
          resolve(event.data);
        }
      };
      
      window.addEventListener('message', handler);
      
      window.parent?.postMessage({
        type: 'UNIFIED_MEMORY_IMPORT',
        payload: { data }
      }, '*');
      
      setTimeout(() => {
        window.removeEventListener('message', handler);
        resolve({ success: false, error: 'timeout' });
      }, 30000);
    });
  },
  
  quickRecall: null,
  
  setupQuickRecall(callback) {
    if (this.quickRecall) {
      window.removeEventListener('message', this.quickRecall);
    }
    
    this.quickRecall = async (event) => {
      if (event.data?.type === 'MEMORY_HISTORY_READY' || 
          event.data?.type === 'UNIFIED_MEMORY_RECALL_RESULT') {
        callback(event.data);
      }
    };
    
    window.addEventListener('message', this.quickRecall);
  },
  
  requestHistory(limit = 20) {
    window.parent?.postMessage({
      type: 'MEMORY_REQUEST_HISTORY',
      payload: { limit, includePool: true }
    }, '*');
  },
  
  sendChatEvent(content, role = 'user', options = {}) {
    window.parent?.postMessage({
      type: 'MEMORY_CHAT_EVENT',
      payload: {
        content,
        role,
        source: options.source || 'app',
        importance: options.importance || 5,
        emotion: options.emotion,
        tags: options.tags,
        metadata: options.metadata
      }
    }, '*');
  }
};

if (typeof window !== 'undefined') {
  window.MemoryHelper = MemoryHelper;
}
