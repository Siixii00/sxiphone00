const AppMemoryHelper = {
  appId: null,
  
  init(appId) {
    this.appId = appId;
    console.log(`[AppMemoryHelper] 初始化: ${appId}`);
  },
  
  async hold(content, options = {}) {
    return this._sendRequest('GLOBAL_MEMORY_HOLD', {
      content,
      options: {
        ...options,
        appId: this.appId,
        source: this.appId
      }
    });
  },
  
  async recall(options = {}) {
    return this._sendRequest('GLOBAL_MEMORY_RECALL', { options });
  },
  
  async search(query, options = {}) {
    return this._sendRequest('GLOBAL_MEMORY_SEARCH', { query, options });
  },
  
  async processAppMemory(data) {
    return this._sendRequest('GLOBAL_MEMORY_PROCESS_APP', {
      appId: this.appId,
      data
    });
  },
  
  async conversationStart() {
    return this._sendRequest('GLOBAL_MEMORY_CONVERSATION_START', {});
  },
  
  async getAwakeningPrompt() {
    return this._sendRequest('GLOBAL_MEMORY_GET_AWAKENING_PROMPT', {});
  },
  
  async triggerSleep() {
    return this._sendRequest('GLOBAL_MEMORY_TRIGGER_SLEEP', {});
  },
  
  async getStatus() {
    return this._sendRequest('GLOBAL_MEMORY_GET_STATUS', {});
  },
  
  _sendRequest(type, payload) {
    return new Promise((resolve, reject) => {
      const requestId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const timeout = setTimeout(() => {
        window.removeEventListener('message', handler);
        reject(new Error(`請求超時: ${type}`));
      }, 30000);
      
      const handler = (event) => {
        const data = event.data || {};
        if (data.type === `${type}_RESULT` || 
            data.type === 'GLOBAL_MEMORY_HOLD_RESULT' ||
            data.type === 'GLOBAL_MEMORY_RECALL_RESULT' ||
            data.type === 'GLOBAL_MEMORY_SEARCH_RESULT' ||
            data.type === 'GLOBAL_MEMORY_PROCESS_APP_RESULT' ||
            data.type === 'GLOBAL_MEMORY_CONVERSATION_START_RESULT' ||
            data.type === 'GLOBAL_MEMORY_AWAKENING_PROMPT_RESULT' ||
            data.type === 'GLOBAL_MEMORY_SLEEP_RESULT' ||
            data.type === 'GLOBAL_MEMORY_STATUS_RESULT') {
          
          clearTimeout(timeout);
          window.removeEventListener('message', handler);
          
          if (data.result !== undefined) {
            resolve(data.result);
          } else if (data.prompt !== undefined) {
            resolve(data.prompt);
          } else if (data.status !== undefined) {
            resolve(data.status);
          } else {
            resolve(data);
          }
        }
      };
      
      window.addEventListener('message', handler);
      
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type, payload }, '*');
      } else {
        if (window.globalMemorySystem) {
          this._handleLocally(type, payload).then(resolve).catch(reject);
        } else {
          reject(new Error('全域記憶系統未初始化'));
        }
      }
    });
  },
  
  async _handleLocally(type, payload) {
    const gms = window.globalMemorySystem;
    if (!gms) throw new Error('全域記憶系統未初始化');
    
    switch (type) {
      case 'GLOBAL_MEMORY_HOLD':
        return await gms.hold(payload.content, payload.options);
      case 'GLOBAL_MEMORY_RECALL':
        return await gms.recall(payload.options);
      case 'GLOBAL_MEMORY_SEARCH':
        return await gms.search(payload.query, payload.options);
      case 'GLOBAL_MEMORY_PROCESS_APP':
        return await gms.processAppMemory(payload.appId, payload.data);
      case 'GLOBAL_MEMORY_CONVERSATION_START':
        return await gms.conversationStart();
      case 'GLOBAL_MEMORY_GET_AWAKENING_PROMPT':
        return await gms.getAwakeningPrompt();
      case 'GLOBAL_MEMORY_TRIGGER_SLEEP':
        return await gms.triggerSleep();
      case 'GLOBAL_MEMORY_GET_STATUS':
        return gms.getStatus();
      default:
        throw new Error(`未知的請求類型: ${type}`);
    }
  }
};

if (typeof window !== 'undefined') {
  window.AppMemoryHelper = AppMemoryHelper;
}
