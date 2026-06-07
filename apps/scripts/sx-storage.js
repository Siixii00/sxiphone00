const DB_NAME = 'sxiphone_db';
const DB_VERSION = 1;

const STORES = {
  KEY_VALUE: 'keyvalue',
  CHAT_SESSIONS: 'chat_sessions',
  CHARACTERS: 'characters',
  MEMORIES: 'memories',
  EMBEDDINGS: 'embeddings',
  SETTINGS: 'settings',
  MEDIA: 'media',
  BACKUPS: 'backups'
};

class SXStorage {
  constructor() {
    this.db = null;
    this.isInitialized = false;
    this._initPromise = null;
    this._cache = new Map();
    this._cacheExpiry = new Map();
    this.CACHE_TTL = 60000;
  }

  async init() {
    if (this.isInitialized && this.db) {
      return this.db;
    }

    if (this._initPromise) {
      return this._initPromise;
    }

    this._initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error('[SXStorage] IndexedDB 打開失敗:', event.target.error);
        reject(new Error(`IndexedDB 初始化失敗: ${event.target.error}`));
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.isInitialized = true;
        console.log('[SXStorage] IndexedDB 初始化成功');
        // 預載所有 keyvalue store 到記憶體快取，讓 localStorage mirror 的同步讀取有資料可用
        // 必須在 resolve 之前完成，確保 mirror markSxReady 時快取已暖
        this._preloadCache().then(() => {
          console.log('[SXStorage] 快取預載完成');
          resolve(this.db);
        }).catch(e => {
          console.warn('[SXStorage] 快取預載失敗，但仍繼續:', e);
          resolve(this.db);
        });
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        this._createSchema(db);
      };
    });

    return this._initPromise;
  }

  /**
   * 預載所有 keyvalue store 進記憶體快取。
   * 這讓 localStorage-mirror 的同步 getItem() 能立即取到 IndexedDB 資料，
   * 解決 iframe app 首次載入時快取冷啟動的問題。
   */
  async _preloadCache() {
    if (!this.db) return;
    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction(STORES.KEY_VALUE, 'readonly');
        const store = tx.objectStore(STORES.KEY_VALUE);
        const request = store.getAll();

        request.onsuccess = () => {
          const records = request.result || [];
          let count = 0;
          for (const record of records) {
            if (record && record.key && record.value !== undefined) {
              this._setCache(record.key, record.value);
              count++;
            }
          }
          console.log(`[SXStorage] 預載 ${count} 筆 key-value 到快取`);
          resolve(count);
        };

        request.onerror = (e) => {
          console.warn('[SXStorage] _preloadCache 失敗:', e.target?.error);
          resolve(0);
        };
      } catch (e) {
        console.warn('[SXStorage] _preloadCache 異常:', e);
        resolve(0);
      }
    });
  }

  _createSchema(db) {
    if (!db.objectStoreNames.contains(STORES.KEY_VALUE)) {
      const kvStore = db.createObjectStore(STORES.KEY_VALUE, { keyPath: 'key' });
      kvStore.createIndex('updatedAt', 'updatedAt', { unique: false });
    }

    if (!db.objectStoreNames.contains(STORES.CHAT_SESSIONS)) {
      const chatStore = db.createObjectStore(STORES.CHAT_SESSIONS, { keyPath: 'id' });
      chatStore.createIndex('charId', 'charId', { unique: false });
      chatStore.createIndex('lastActive', 'lastActive', { unique: false });
    }

    if (!db.objectStoreNames.contains(STORES.CHARACTERS)) {
      const charStore = db.createObjectStore(STORES.CHARACTERS, { keyPath: 'id' });
      charStore.createIndex('name', 'name', { unique: false });
      charStore.createIndex('createdAt', 'createdAt', { unique: false });
    }

    if (!db.objectStoreNames.contains(STORES.MEMORIES)) {
      const memStore = db.createObjectStore(STORES.MEMORIES, { keyPath: 'id' });
      memStore.createIndex('charId', 'charId', { unique: false });
      memStore.createIndex('type', 'type', { unique: false });
      memStore.createIndex('createdAt', 'createdAt', { unique: false });
      memStore.createIndex('importance', 'importance', { unique: false });
    }

    if (!db.objectStoreNames.contains(STORES.EMBEDDINGS)) {
      const embStore = db.createObjectStore(STORES.EMBEDDINGS, { keyPath: 'id' });
      embStore.createIndex('memoryId', 'memoryId', { unique: false });
    }

    if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
      db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
    }

    if (!db.objectStoreNames.contains(STORES.MEDIA)) {
      const mediaStore = db.createObjectStore(STORES.MEDIA, { keyPath: 'id' });
      mediaStore.createIndex('type', 'type', { unique: false });
      mediaStore.createIndex('createdAt', 'createdAt', { unique: false });
    }

    if (!db.objectStoreNames.contains(STORES.BACKUPS)) {
      const backupStore = db.createObjectStore(STORES.BACKUPS, { keyPath: 'id' });
      backupStore.createIndex('exportedAt', 'exportedAt', { unique: false });
      backupStore.createIndex('type', 'type', { unique: false });
    }

    console.log('[SXStorage] Schema 創建完成');
  }

  async close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
      this._initPromise = null;
      console.log('[SXStorage] 資料庫已關閉');
    }
  }

  _getCache(key) {
    if (this._cache.has(key)) {
      const expiry = this._cacheExpiry.get(key);
      if (expiry && Date.now() < expiry) {
        return this._cache.get(key);
      }
      this._cache.delete(key);
      this._cacheExpiry.delete(key);
    }
    return undefined;
  }

  _setCache(key, value) {
    this._cache.set(key, value);
    this._cacheExpiry.set(key, Date.now() + this.CACHE_TTL);
  }

  _clearCache(key) {
    if (key) {
      this._cache.delete(key);
      this._cacheExpiry.delete(key);
    } else {
      this._cache.clear();
      this._cacheExpiry.clear();
    }
  }

  async setItem(key, value) {
    await this.init();
    
    const record = {
      key,
      value: typeof value === 'string' ? value : JSON.stringify(value),
      updatedAt: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(STORES.KEY_VALUE, 'readwrite');
      const store = transaction.objectStore(STORES.KEY_VALUE);
      const request = store.put(record);

      request.onsuccess = () => {
        this._setCache(key, record.value);
        resolve(true);
      };

      request.onerror = (event) => {
        console.error('[SXStorage] setItem 失敗:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async getItem(key) {
    await this.init();

    const cached = this._getCache(key);
    if (cached !== undefined) {
      return cached;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(STORES.KEY_VALUE, 'readonly');
      const store = transaction.objectStore(STORES.KEY_VALUE);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        const value = result ? result.value : null;
        if (value !== null) {
          this._setCache(key, value);
        }
        resolve(value);
      };

      request.onerror = (event) => {
        console.error('[SXStorage] getItem 失敗:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async getJSON(key) {
    const value = await this.getItem(key);
    if (value === null) return null;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  async setJSON(key, value) {
    return this.setItem(key, JSON.stringify(value));
  }

  async removeItem(key) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(STORES.KEY_VALUE, 'readwrite');
      const store = transaction.objectStore(STORES.KEY_VALUE);
      const request = store.delete(key);

      request.onsuccess = () => {
        this._clearCache(key);
        resolve(true);
      };

      request.onerror = (event) => {
        console.error('[SXStorage] removeItem 失敗:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async getAllKeys() {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(STORES.KEY_VALUE, 'readonly');
      const store = transaction.objectStore(STORES.KEY_VALUE);
      const request = store.getAllKeys();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async getKeysByPrefix(prefix) {
    const allKeys = await this.getAllKeys();
    return allKeys.filter(key => key.startsWith(prefix));
  }

  async clearAll() {
    await this.init();
    
    const storeNames = Object.values(STORES);
    
    for (const storeName of storeNames) {
      await this._clearStore(storeName);
    }
    
    this._clearCache();
    console.log('[SXStorage] 所有資料已清除');
  }

  async _clearStore(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async saveChatSession(session) {
    await this.init();
    
    const record = {
      ...session,
      updatedAt: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(STORES.CHAT_SESSIONS, 'readwrite');
      const store = transaction.objectStore(STORES.CHAT_SESSIONS);
      const request = store.put(record);

      request.onsuccess = () => resolve(record);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async getChatSession(id) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(STORES.CHAT_SESSIONS, 'readonly');
      const store = transaction.objectStore(STORES.CHAT_SESSIONS);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async getAllChatSessions() {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(STORES.CHAT_SESSIONS, 'readonly');
      const store = transaction.objectStore(STORES.CHAT_SESSIONS);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result || [];
        results.sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive));
        resolve(results);
      };
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async getChatSessionsByCharId(charId) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(STORES.CHAT_SESSIONS, 'readonly');
      const store = transaction.objectStore(STORES.CHAT_SESSIONS);
      const index = store.index('charId');
      const request = index.getAll(IDBKeyRange.only(charId));

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async deleteChatSession(id) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(STORES.CHAT_SESSIONS, 'readwrite');
      const store = transaction.objectStore(STORES.CHAT_SESSIONS);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async saveCharacter(character) {
    await this.init();
    
    const record = {
      ...character,
      updatedAt: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(STORES.CHARACTERS, 'readwrite');
      const store = transaction.objectStore(STORES.CHARACTERS);
      const request = store.put(record);

      request.onsuccess = () => resolve(record);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async getCharacter(id) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(STORES.CHARACTERS, 'readonly');
      const store = transaction.objectStore(STORES.CHARACTERS);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async getAllCharacters() {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(STORES.CHARACTERS, 'readonly');
      const store = transaction.objectStore(STORES.CHARACTERS);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async deleteCharacter(id) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(STORES.CHARACTERS, 'readwrite');
      const store = transaction.objectStore(STORES.CHARACTERS);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async saveMemory(memory) {
    await this.init();
    
    const record = {
      ...memory,
      updatedAt: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(STORES.MEMORIES, 'readwrite');
      const store = transaction.objectStore(STORES.MEMORIES);
      const request = store.put(record);

      request.onsuccess = () => resolve(record);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async getMemory(id) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(STORES.MEMORIES, 'readonly');
      const store = transaction.objectStore(STORES.MEMORIES);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async getAllMemories(options = {}) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(STORES.MEMORIES, 'readonly');
      const store = transaction.objectStore(STORES.MEMORIES);
      const request = store.getAll();

      request.onsuccess = () => {
        let results = request.result || [];
        
        if (options.charId) {
          results = results.filter(m => m.charId === options.charId);
        }
        if (options.type) {
          results = results.filter(m => m.type === options.type);
        }
        if (options.minImportance !== undefined) {
          results = results.filter(m => (m.importance || 0) >= options.minImportance);
        }
        if (options.limit) {
          results = results.slice(0, options.limit);
        }
        
        results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        resolve(results);
      };
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async getMemoriesByCharId(charId) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(STORES.MEMORIES, 'readonly');
      const store = transaction.objectStore(STORES.MEMORIES);
      const index = store.index('charId');
      const request = index.getAll(IDBKeyRange.only(charId));

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async deleteMemory(id) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(STORES.MEMORIES, 'readwrite');
      const store = transaction.objectStore(STORES.MEMORIES);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async saveSetting(key, value) {
    await this.init();
    
    const record = { key, value, updatedAt: new Date().toISOString() };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(STORES.SETTINGS, 'readwrite');
      const store = transaction.objectStore(STORES.SETTINGS);
      const request = store.put(record);

      request.onsuccess = () => resolve(record);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async getSetting(key) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(STORES.SETTINGS, 'readonly');
      const store = transaction.objectStore(STORES.SETTINGS);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async getAllSettings() {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(STORES.SETTINGS, 'readonly');
      const store = transaction.objectStore(STORES.SETTINGS);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result || [];
        const settings = {};
        for (const item of results) {
          settings[item.key] = item.value;
        }
        resolve(settings);
      };
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async saveMedia(media) {
    await this.init();
    
    const record = {
      ...media,
      createdAt: media.createdAt || new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(STORES.MEDIA, 'readwrite');
      const store = transaction.objectStore(STORES.MEDIA);
      const request = store.put(record);

      request.onsuccess = () => resolve(record);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async getMedia(id) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(STORES.MEDIA, 'readonly');
      const store = transaction.objectStore(STORES.MEDIA);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async getAllMedia(options = {}) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(STORES.MEDIA, 'readonly');
      const store = transaction.objectStore(STORES.MEDIA);
      const request = store.getAll();

      request.onsuccess = () => {
        let results = request.result || [];
        
        if (options.type) {
          results = results.filter(m => m.type === options.type);
        }
        if (options.limit) {
          results = results.slice(0, options.limit);
        }
        
        results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        resolve(results);
      };
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async deleteMedia(id) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(STORES.MEDIA, 'readwrite');
      const store = transaction.objectStore(STORES.MEDIA);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = (event) => reject(event.target.error);
    });
  }

async exportAllData(options = {}) {
    await this.init();
    
    const {
      maxSizeMB = 25,
      maxMemories = 300,
      maxChatSessions = 200,
      compress = true,
      isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    } = options;
    
    const data = {
      keyValue: {},
      chatSessions: [],
      characters: [],
      memories: [],
      settings: {},
      media: [],
      localStorage: {},
      localforage: {},
      persistedData: null,
      exportedAt: new Date().toISOString(),
      version: '3.0',
      exportMeta: {
        compressed: false,
        originalMemories: 0,
        exportedMemories: 0,
        originalSessions: 0,
        exportedSessions: 0,
        skippedMedia: 0
      }
    };

    const estimateSize = (obj) => {
      try {
        return new Blob([JSON.stringify(obj)]).size;
      } catch (e) {
        return 0;
      }
    };
    
    const currentSize = () => estimateSize(data);

    const kvData = await this._getAllFromStore(STORES.KEY_VALUE);
    for (const item of kvData) {
      data.keyValue[item.key] = item.value;
    }

    const allSessions = await this._getAllFromStore(STORES.CHAT_SESSIONS);
    data.exportMeta.originalSessions = allSessions.length;
    
    const recentSessions = allSessions
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, maxChatSessions);
    
    data.chatSessions = recentSessions;
    data.exportMeta.exportedSessions = recentSessions.length;
    
    if (allSessions.length > maxChatSessions) {
      console.log(`[SXStorage] 聊天階段從 ${allSessions.length} 篩選至 ${maxChatSessions} 個`);
    }

    data.characters = await this._getAllFromStore(STORES.CHARACTERS);

    const allMemories = await this._getAllFromStore(STORES.MEMORIES);
    data.exportMeta.originalMemories = allMemories.length;
    
    const recentMemories = allMemories
      .sort((a, b) => new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp))
      .slice(0, maxMemories);
    
    data.memories = recentMemories;
    data.exportMeta.exportedMemories = recentMemories.length;
    
    if (allMemories.length > maxMemories) {
      console.log(`[SXStorage] 記憶從 ${allMemories.length} 篩選至 ${maxMemories} 筆`);
    }
    
    const settingsData = await this._getAllFromStore(STORES.SETTINGS);
    for (const item of settingsData) {
      data.settings[item.key] = item.value;
    }
    
    const allMedia = await this._getAllFromStore(STORES.MEDIA);
    const smallMedia = allMedia.filter(m => {
      const size = estimateSize(m);
      return size < 500 * 1024;
    });
    data.media = smallMedia;
    data.exportMeta.skippedMedia = allMedia.length - smallMedia.length;
    
    if (allMedia.length > smallMedia.length) {
      console.log(`[SXStorage] 媒體從 ${allMedia.length} 篩選至 ${smallMedia.length} 個 (略過大於 500KB)`);
    }
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sx_') || key.startsWith('api_') || key === 'worldbookMounts' || key.startsWith('sxiphone'))) {
        const value = localStorage.getItem(key);
        const itemSize = new Blob([value]).size;
        
        if (itemSize > 2 * 1024 * 1024) {
          console.warn('[SXStorage] 略過大型 localStorage:', key, (itemSize / 1024).toFixed(2), 'KB');
          continue;
        }
        
        try {
          data.localStorage[key] = JSON.parse(value);
        } catch (e) {
          data.localStorage[key] = value;
        }
      }
    }
    
    if (typeof localforage !== 'undefined') {
      try {
        await localforage.ready();
        const keys = await this._getLocalforageKeys();
        for (const key of keys) {
          if (key.startsWith('sx_') || key.startsWith('api_') || key === 'worldbookMounts' || key.startsWith('setting_')) {
            const value = await localforage.getItem(key);
            const itemSize = estimateSize(value);
            
            if (itemSize > 5 * 1024 * 1024) {
              console.warn('[SXStorage] 略過大型 localforage:', key, (itemSize / 1024).toFixed(2), 'KB');
              continue;
            }
            
            data.localforage[key] = value;
          }
        }
      } catch (e) {
        console.warn('[SXStorage] 匯出 localforage 失敗:', e);
      }
      
      try {
        const chatDataStore = localforage.createInstance({
          name: 'sxiphone',
          storeName: 'chatData'
        });
        const persistedData = await chatDataStore.getItem('sx_app_persisted_data');
        if (persistedData) {
          const persistedSize = estimateSize(persistedData);
          
          if (persistedSize > 10 * 1024 * 1024) {
            console.warn('[SXStorage] persistedData 過大，篩選核心資料');
            
            const essentialKeys = [
              'userName', 'userAvatar', 'userPersonality', 'userBackground',
              'userLikes', 'userTaboos', 'userStatus',
              'charName', 'charAvatar', 'charPersonality', 'charBackground',
              'sx_characters', 'sx_users', 'masks', 'apis'
            ];
            
            const filteredData = {};
            for (const key of essentialKeys) {
              if (persistedData[key]) {
                filteredData[key] = persistedData[key];
              }
            }
            
            if (persistedData.sx_chat_sessions) {
              const sessions = persistedData.sx_chat_sessions;
              const recentSessions = sessions
                .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
                .slice(0, Math.min(100, maxChatSessions / 2));
              filteredData.sx_chat_sessions = recentSessions;
              console.log(`[SXStorage] persistedData 聊天階段從 ${sessions.length} 篩選至 ${recentSessions.length}`);
            }
            
            data.persistedData = filteredData;
            data.exportMeta.compressed = true;
          } else {
            data.persistedData = persistedData;
          }
          
          console.log('[SXStorage] 匯出 persistedData 完成，包含 keys:', Object.keys(data.persistedData));
        }
      } catch (e) {
        console.warn('[SXStorage] 匯出 chatData persistedData 失敗:', e);
      }
    }

    const finalSizeMB = currentSize() / 1024 / 1024;
    
    if (finalSizeMB > maxSizeMB) {
      console.warn(`[SXStorage] 匯出資料 ${finalSizeMB.toFixed(2)} MB 超過限制 ${maxSizeMB} MB，進一步壓縮`);
      
      if (data.memories.length > 100) {
        data.memories = data.memories.slice(0, 100);
        data.exportMeta.exportedMemories = 100;
        console.log('[SXStorage] 記憶進一步壓縮至 100 筆');
      }
      
      if (data.chatSessions.length > 50) {
        data.chatSessions = data.chatSessions.slice(0, 50);
        data.exportMeta.exportedSessions = 50;
        console.log('[SXStorage] 聊天階段進一步壓縮至 50 個');
      }
      
      data.media = [];
      data.exportMeta.skippedMedia = allMedia.length;
      
      const largeLfKeys = Object.keys(data.localforage)
        .filter(k => estimateSize(data.localforage[k]) > 1 * 1024 * 1024);
      
      for (const key of largeLfKeys) {
        delete data.localforage[key];
        console.log('[SXStorage] 移除大型 localforage:', key);
      }
      
      data.exportMeta.compressed = true;
    }

    console.log('[SXStorage] 匯出完成:', {
      size: (currentSize() / 1024 / 1024).toFixed(2) + ' MB',
      keyValue: Object.keys(data.keyValue).length,
      chatSessions: data.chatSessions.length,
      characters: data.characters.length,
      memories: data.memories.length,
      localStorage: Object.keys(data.localStorage).length,
      localforage: Object.keys(data.localforage).length,
      persistedData: data.persistedData ? Object.keys(data.persistedData).length : 0,
      meta: data.exportMeta
    });

    return data;
  }
  
  async _getLocalforageKeys() {
    if (typeof localforage !== 'undefined') {
      try {
        await localforage.ready();
        if (typeof localforage.keys === 'function') {
          return await localforage.keys();
        }
      } catch (e) {
        console.warn('[SXStorage] localforage.keys() 失敗:', e);
      }
    }
    return new Promise((resolve, reject) => {
      const keys = [];
      const request = indexedDB.open('sxiphone');
      
      request.onsuccess = () => {
        const db = request.result;
        const storeNames = Array.from(db.objectStoreNames);
        const tx = db.transaction(storeNames, 'readonly');
        
        let pending = storeNames.length;
        for (const storeName of storeNames) {
          const store = tx.objectStore(storeName);
          const cursorReq = store.openCursor();
          
          cursorReq.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
              keys.push(cursor.key);
              cursor.continue();
            } else {
              pending--;
              if (pending === 0) resolve(keys);
            }
          };
          cursorReq.onerror = () => {
            pending--;
            if (pending === 0) resolve(keys);
          };
        }
      };
      request.onerror = () => resolve([]);
    });
  }

  async _getAllFromStore(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async importAllData(data) {
    await this.init();
    
    let count = 0;
    let errors = [];
    let skippedLargeItems = [];
    
    const checkStorageSpace = async () => {
      if (navigator.storage && navigator.storage.estimate) {
        try {
          const estimate = await navigator.storage.estimate();
          const available = estimate.quota - estimate.usage;
          const availableMB = available / 1024 / 1024;
          console.log('[SXStorage] 可用空間:', availableMB.toFixed(2), 'MB');
          return { available, quota: estimate.quota, usage: estimate.usage };
        } catch (e) {
          console.warn('[SXStorage] 空間檢測失敗:', e);
          return { available: Infinity, quota: Infinity, usage: 0 };
        }
      }
      return { available: Infinity, quota: Infinity, usage: 0 };
    };
    
    const estimateItemSize = (value) => {
      try {
        const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
        return new Blob([str]).size;
      } catch (e) {
        return 1024;
      }
    };
    
    const safeSetItem = async (key, value, store = 'indexedDB') => {
      const itemSize = estimateItemSize(value);
      const MAX_LS_ITEM = 5 * 1024 * 1024;
      const MAX_IDB_ITEM = 50 * 1024 * 1024;
      
      if (store === 'localStorage' && itemSize > MAX_LS_ITEM) {
        console.warn('[SXStorage] 階段略過 localStorage 大項目:', key, '(', (itemSize / 1024).toFixed(2), 'KB)');
        skippedLargeItems.push({ key, size: itemSize, store });
        
        if (typeof localforage !== 'undefined') {
          try {
            await localforage.setItem(`overflow_${key}`, value);
            console.log('[SXStorage] 大項目已存至 localforage:', key);
            return true;
          } catch (e) {
            errors.push({ key, error: e.message });
            return false;
          }
        }
        return false;
      }
      
      try {
        if (store === 'localStorage') {
          localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
        } else {
          await this.setItem(key, value);
        }
        return true;
      } catch (e) {
        if (e.name === 'QuotaExceededError' || e.message.includes('quota') || e.message.includes('超出')) {
          console.warn('[SXStorage] 儲存空間不足，略過:', key);
          skippedLargeItems.push({ key, size: itemSize, store, reason: 'quota_exceeded' });
          errors.push({ key, error: '儲存空間不足', size: itemSize });
          return false;
        }
        errors.push({ key, error: e.message });
        console.warn('[SXStorage] 寫入失敗:', key, e.message);
        return false;
      }
    };
    
    const initialSpace = await checkStorageSpace();
    if (initialSpace.available < 10 * 1024 * 1024) {
      console.warn('[SXStorage] 可用空間不足 10MB，嘗試清理...');
      try {
        await this.clearOldData({ keepDays: 7 });
        const afterClean = await checkStorageSpace();
        console.log('[SXStorage] 清理後可用:', (afterClean.available / 1024 / 1024).toFixed(2), 'MB');
      } catch (e) {
        console.warn('[SXStorage] 自動清理失敗:', e);
      }
    }

    if (data.keyValue) {
      for (const [key, value] of Object.entries(data.keyValue)) {
        if (await safeSetItem(key, value, 'indexedDB')) count++;
      }
    }

    if (data.chatSessions) {
      for (const session of data.chatSessions) {
        try {
          const sessionSize = estimateItemSize(session);
          if (sessionSize > 5 * 1024 * 1024) {
            console.warn('[SXStorage] 聊天階段過大，略過:', session.id, (sessionSize / 1024).toFixed(2), 'KB');
            skippedLargeItems.push({ key: `session_${session.id}`, size: sessionSize, store: 'indexedDB' });
            continue;
          }
          await this.saveChatSession(session);
          count++;
        } catch (e) {
          errors.push({ key: `session_${session.id}`, error: e.message });
        }
      }
    }

    if (data.characters) {
      for (const character of data.characters) {
        try {
          await this.saveCharacter(character);
          count++;
        } catch (e) {
          errors.push({ key: `character_${character.id}`, error: e.message });
        }
      }
    }

    if (data.memories) {
      const recentMemories = data.memories.slice(-500);
      for (const memory of recentMemories) {
        try {
          await this.saveMemory(memory);
          count++;
        } catch (e) {
          errors.push({ key: `memory_${memory.id}`, error: e.message });
        }
      }
      if (data.memories.length > 500) {
        console.warn('[SXStorage] 記憶資料過多，只匯入最近 500 筆，共', data.memories.length, '筆');
      }
    }

    if (data.settings) {
      for (const [key, value] of Object.entries(data.settings)) {
        if (await safeSetItem(key, value, 'indexedDB')) count++;
      }
    }

    if (data.media) {
      for (const media of data.media) {
        try {
          const mediaSize = estimateItemSize(media);
          if (mediaSize > 10 * 1024 * 1024) {
            console.warn('[SXStorage] 媒體過大，略過:', media.id, (mediaSize / 1024 / 1024).toFixed(2), 'MB');
            skippedLargeItems.push({ key: `media_${media.id}`, size: mediaSize, store: 'indexedDB' });
            continue;
          }
          await this.saveMedia(media);
          count++;
        } catch (e) {
          errors.push({ key: `media_${media.id}`, error: e.message });
        }
      }
    }
    
    if (data.localStorage) {
      for (const [key, value] of Object.entries(data.localStorage)) {
        if (await safeSetItem(key, value, 'localStorage')) count++;
      }
    }
    
    if (data.localforage && typeof localforage !== 'undefined') {
      try {
        await localforage.ready();
        for (const [key, value] of Object.entries(data.localforage)) {
          if (await safeSetItem(key, value, 'localforage')) count++;
        }
      } catch (e) {
        console.warn('[SXStorage] 匯入 localforage 失敗:', e);
        errors.push({ key: 'localforage_batch', error: e.message });
      }
    }
    
    if (data.charList) {
      if (await safeSetItem('sx_characters', data.charList, 'localStorage')) count++;
      if (typeof localforage !== 'undefined') {
        try {
          await localforage.setItem('sx_characters', data.charList);
        } catch (e) {}
      }
    }
    
    if (data.userList) {
      if (await safeSetItem('sx_users', data.userList, 'localStorage')) count++;
      if (typeof localforage !== 'undefined') {
        try {
          await localforage.setItem('sx_users', data.userList);
        } catch (e) {}
      }
    }

    if (data.persistedData && typeof localforage !== 'undefined') {
      try {
        const chatDataStore = localforage.createInstance({
          name: 'sxiphone',
          storeName: 'chatData'
        });
        
        const persistedSize = estimateItemSize(data.persistedData);
        if (persistedSize > 20 * 1024 * 1024) {
          console.warn('[SXStorage] persistedData 過大，嘗試部分匯入');
          const essentialKeys = ['userName', 'userAvatar', 'charName', 'charAvatar', 'sx_characters', 'sx_users', 'masks', 'apis'];
          const essentialData = {};
          for (const key of essentialKeys) {
            if (data.persistedData[key]) {
              essentialData[key] = data.persistedData[key];
            }
          }
          await chatDataStore.setItem('sx_app_persisted_data', essentialData);
          console.log('[SXStorage] 部分匯入 persistedData，包含 keys:', Object.keys(essentialData));
        } else {
          await chatDataStore.setItem('sx_app_persisted_data', data.persistedData);
          console.log('[SXStorage] 匯入 persistedData 完成，包含 keys:', Object.keys(data.persistedData));
        }
        
        if (data.persistedData.userName) localStorage.setItem('sx_user_name', data.persistedData.userName);
        if (data.persistedData.userAvatar) localStorage.setItem('sx_user_avatar', data.persistedData.userAvatar);
        if (data.persistedData.userPersonality) localStorage.setItem('sx_user_personality', data.persistedData.userPersonality);
        if (data.persistedData.userBackground) localStorage.setItem('sx_user_background', data.persistedData.userBackground);
        if (data.persistedData.userLikes) localStorage.setItem('sx_user_likes', data.persistedData.userLikes);
        if (data.persistedData.userTaboos) localStorage.setItem('sx_user_taboos', data.persistedData.userTaboos);
        if (data.persistedData.userStatus) localStorage.setItem('sx_user_status', data.persistedData.userStatus);
        if (data.persistedData.charName) localStorage.setItem('sx_char_name', data.persistedData.charName);
        if (data.persistedData.charAvatar) localStorage.setItem('sx_char_avatar', data.persistedData.charAvatar);
        if (data.persistedData.charPersonality) localStorage.setItem('sx_char_personality', data.persistedData.charPersonality);
        if (data.persistedData.charBackground) localStorage.setItem('sx_char_background', data.persistedData.charBackground);
        if (data.persistedData.sx_characters) localStorage.setItem('sx_characters', JSON.stringify(data.persistedData.sx_characters));
        if (data.persistedData.sx_users) localStorage.setItem('sx_users', JSON.stringify(data.persistedData.sx_users));
        if (data.persistedData.masks) localStorage.setItem('sx_masks', JSON.stringify(data.persistedData.masks));
        if (data.persistedData.apis) localStorage.setItem('api_configs', JSON.stringify(data.persistedData.apis));
        
        count++;
      } catch (e) {
        console.warn('[SXStorage] 匯入 persistedData 失敗:', e);
        errors.push({ key: 'persistedData', error: e.message });
      }
    }

    this._clearCache();
    
    const finalSpace = await checkStorageSpace();
    
    if (errors.length > 0 || skippedLargeItems.length > 0) {
      console.warn('[SXStorage] 匯入警告:');
      if (skippedLargeItems.length > 0) {
        console.warn('  略過的大項目:', skippedLargeItems.length, '項');
        skippedLargeItems.forEach(item => {
          console.warn(`    - ${item.key}: ${(item.size / 1024).toFixed(2)} KB (${item.store})`);
        });
      }
      if (errors.length > 0) {
        console.warn('  匯入失敗項目:', errors.length, '項');
        errors.forEach(item => {
          console.warn(`    - ${item.key}: ${item.error}`);
        });
      }
    }
    
    console.log(`[SXStorage] 已匯入 ${count} 筆資料`);
    
    return { 
      success: true, 
      count,
      skipped: skippedLargeItems.length,
      errors: errors.length,
      spaceBefore: (initialSpace.usage / 1024 / 1024).toFixed(2) + ' MB',
      spaceAfter: (finalSpace.usage / 1024 / 1024).toFixed(2) + ' MB',
      availableSpace: (finalSpace.available / 1024 / 1024).toFixed(2) + ' MB'
    };
  }

  async backupToSupabase(options = {}) {
    const url = options.url || await this.getSetting('sx_supabase_url');
    const key = options.key || await this.getSetting('sx_supabase_key');
    const table = options.table || await this.getSetting('sx_supabase_table') || 'sxiphone_backups';

    if (!url || !key) {
      throw new Error('請先設定 Supabase URL 和 Key');
    }

    const data = await this.exportAllData();
    const backupId = `backup_${Date.now()}`;

    const payload = {
      id: backupId,
      type: 'full_backup',
      version: '1.0',
      exported_at: new Date().toISOString(),
      device: navigator.userAgent,
      data: data,
      user_id: await this.getSetting('sx_user_name') || 'default'
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
      const errData = await resp.json().catch(() => ({}));
      throw new Error(errData.message || `備份失敗 (${resp.status})`);
    }

    await this.saveSetting('sx_last_backup_id', backupId);
    await this.saveSetting('sx_last_backup_time', Date.now().toString());
    await this.saveSetting('sx_last_backup_source', 'supabase');

    console.log(`[SXStorage] Supabase 備份成功: ${backupId}`);
    return { success: true, backupId };
  }

  async restoreFromSupabase(options = {}) {
    const url = options.url || await this.getSetting('sx_supabase_url');
    const key = options.key || await this.getSetting('sx_supabase_key');
    const table = options.table || await this.getSetting('sx_supabase_table') || 'sxiphone_backups';
    const backupId = options.backupId;

    if (!url || !key) {
      throw new Error('請先設定 Supabase URL 和 Key');
    }

    let queryUrl = `${url}/rest/v1/${table}?select=*&order=exported_at.desc&limit=1`;
    if (backupId) {
      queryUrl = `${url}/rest/v1/${table}?id=eq.${backupId}&select=*`;
    }

    const resp = await fetch(queryUrl, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });

    if (!resp.ok) {
      throw new Error(`取得備份失敗 (${resp.status})`);
    }

    const records = await resp.json();
    if (!records || records.length === 0) {
      throw new Error('找不到備份資料');
    }

    const backup = records[0];
    const data = backup.data;

    if (!data) {
      throw new Error('備份資料格式不正確');
    }

    const result = await this.importAllData(data);
    
    await this.saveSetting('sx_last_restore_time', Date.now().toString());
    await this.saveSetting('sx_last_restore_source', 'supabase');

    console.log(`[SXStorage] Supabase 還原成功: ${result.count} 筆資料`);
    return { success: true, count: result.count, backupId: backup.id };
  }

  async getSupabaseBackupList(options = {}) {
    const url = options.url || await this.getSetting('sx_supabase_url');
    const key = options.key || await this.getSetting('sx_supabase_key');
    const table = options.table || await this.getSetting('sx_supabase_table') || 'sxiphone_backups';
    const limit = options.limit || 20;

    if (!url || !key) {
      return [];
    }

    const resp = await fetch(`${url}/rest/v1/${table}?select=id,exported_at,type,device&order=exported_at.desc&limit=${limit}`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });

    if (!resp.ok) {
      return [];
    }

    return await resp.json();
  }

  async migrateFromLocalStorage() {
    const migratedKeys = [];
    const errors = [];

    const keysToMigrate = [
      'sx_chat_sessions',
      'sx_characters',
      'sx_masks',
      'sx_users',
      'sx_npcs',
      'sx_short_term_memory',
      'sx_long_term_memory',
      'sx_inner_voice_history',
      'sx_voice_settings',
      'sx_voice_call_recordings',
      'sx_user_name',
      'sx_user_avatar',
      'sx_user_personality',
      'sx_user_background',
      'sx_worldbook_cot',
      'sx_worldbook_style',
      'sx_worldbook_global',
      'sx_worldbook_keywords',
      'sx_worldbook_backend',
      'sx_worldbook_theater',
      'sx_food_history',
      'sx_bili_generated_titles',
      'sx_fb_generated_posts',
      'sx_lofter_generated_posts',
      'sx_youtube_char_watch_history',
      'sx_twitch_search_history',
      'sx_ai_sleep_tasks'
    ];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sx_') || key.startsWith('api_'))) {
        if (!keysToMigrate.includes(key)) {
          keysToMigrate.push(key);
        }
      }
    }

    for (const key of keysToMigrate) {
      try {
        const value = localStorage.getItem(key);
        if (value === null) continue;

        if (key === 'sx_chat_sessions') {
          const sessions = JSON.parse(value);
          if (Array.isArray(sessions)) {
            for (const session of sessions) {
              if (session.id) {
                await this.saveChatSession(session);
              }
            }
          }
        } else if (key === 'sx_characters') {
          const characters = JSON.parse(value);
          if (Array.isArray(characters)) {
            for (const char of characters) {
              if (char.id) {
                await this.saveCharacter(char);
              }
            }
          }
        } else if (key === 'sx_short_term_memory' || key === 'sx_long_term_memory') {
          const memories = JSON.parse(value);
          if (Array.isArray(memories)) {
            for (const mem of memories) {
              if (mem.id) {
                await this.saveMemory(mem);
              }
            }
          }
        } else {
          await this.setItem(key, value);
        }

        migratedKeys.push(key);
      } catch (e) {
        errors.push({ key, error: e.message });
      }
    }

    console.log(`[SXStorage] 遷移完成: ${migratedKeys.length} 個 key，${errors.length} 個錯誤`);
    return { migratedKeys, errors };
  }

  async getStorageEstimate() {
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          quota: estimate.quota || 0,
          usage: estimate.usage || 0,
          usagePercentage: estimate.quota ? (estimate.usage / estimate.quota) : 0,
          available: estimate.quota ? (estimate.quota - estimate.usage) : 0
        };
      } catch (e) {
        console.warn('[SXStorage] 無法獲取儲存估計:', e);
      }
    }
    return { quota: 0, usage: 0, usagePercentage: 0, available: 0 };
  }

  async getStats() {
    const stats = {
      keyValue: 0,
      chatSessions: 0,
      characters: 0,
      memories: 0,
      settings: 0,
      media: 0,
      totalRecords: 0,
      estimatedSize: 0
    };

    stats.keyValue = (await this._getAllFromStore(STORES.KEY_VALUE)).length;
    stats.chatSessions = (await this._getAllFromStore(STORES.CHAT_SESSIONS)).length;
    stats.characters = (await this._getAllFromStore(STORES.CHARACTERS)).length;
    stats.memories = (await this._getAllFromStore(STORES.MEMORIES)).length;
    stats.settings = (await this._getAllFromStore(STORES.SETTINGS)).length;
    stats.media = (await this._getAllFromStore(STORES.MEDIA)).length;
    stats.totalRecords = stats.keyValue + stats.chatSessions + stats.characters + 
                         stats.memories + stats.settings + stats.media;

    const estimate = await this.getStorageEstimate();
    stats.estimatedSize = estimate.usage;

    return stats;
  }
}

const sxStorage = new SXStorage();

if (typeof window !== 'undefined') {
  window.SXStorage = SXStorage;
  window.sxStorage = sxStorage;
}
