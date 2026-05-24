class StorageAdapter {
  constructor() {
    this.sxStorage = null;
    this._initPromise = this._init();
    this._cache = new Map();
    this._cacheExpiry = new Map();
    this.CACHE_TTL = 60000;
  }

  async _init() {
    if (typeof sxStorage !== 'undefined') {
      this.sxStorage = sxStorage;
      await this.sxStorage.init();
      console.log('[StorageAdapter] sxStorage 初始化完成');
      return true;
    }
    console.error('[StorageAdapter] sxStorage 未載入！所有儲存功能無法運作。');
    return false;
  }

  async ready() {
    return this._initPromise;
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

  // ─── key-value store ────────────────────────────────────────────────────────

  async setItem(key, value) {
    await this._initPromise;
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    this._setCache(key, stringValue);
    if (this.sxStorage) {
      await this.sxStorage.setItem(key, stringValue);
      return true;
    }
    console.error('[StorageAdapter] sxStorage 不可用，setItem 失敗:', key);
    return false;
  }

  async getItem(key) {
    await this._initPromise;
    const cached = this._getCache(key);
    if (cached !== undefined) return cached;
    if (this.sxStorage) {
      const value = await this.sxStorage.getItem(key);
      if (value !== null) {
        this._setCache(key, value);
        return value;
      }
    }
    return null;
  }

  async getJSON(key) {
    const value = await this.getItem(key);
    if (value === null) return null;
    try { return JSON.parse(value); }
    catch { return value; }
  }

  async setJSON(key, value) {
    return this.setItem(key, JSON.stringify(value));
  }

  async removeItem(key) {
    await this._initPromise;
    this._clearCache(key);
    if (this.sxStorage) {
      await this.sxStorage.removeItem(key);
      return true;
    }
    console.error('[StorageAdapter] sxStorage 不可用，removeItem 失敗:', key);
    return false;
  }

  async getAllKeys() {
    await this._initPromise;
    if (this.sxStorage) {
      return this.sxStorage.getAllKeys();
    }
    console.error('[StorageAdapter] sxStorage 不可用，無法列金鑰');
    return [];
  }

  // ─── chat session CRUD ──────────────────────────────────────────────────────

  async saveChatSession(session) {
    return this.sxStorage?.saveChatSession?.(session) ?? null;
  }

  async getChatSession(id) {
    return this.sxStorage?.getChatSession?.(id) ?? null;
  }

  async getAllChatSessions() {
    return this.sxStorage?.getAllChatSessions?.() ?? [];
  }

  async deleteChatSession(id) {
    return this.sxStorage?.deleteChatSession?.(id) ?? false;
  }

  // ─── character CRUD ─────────────────────────────────────────────────────────

  async saveCharacter(character) {
    return this.sxStorage?.saveCharacter?.(character) ?? null;
  }

  async getCharacter(id) {
    return this.sxStorage?.getCharacter?.(id) ?? null;
  }

  async getAllCharacters() {
    return this.sxStorage?.getAllCharacters?.() ?? [];
  }

  async deleteCharacter(id) {
    return this.sxStorage?.deleteCharacter?.(id) ?? false;
  }

  // ─── memory CRUD ────────────────────────────────────────────────────────────

  async saveMemory(memory) {
    return this.sxStorage?.saveMemory?.(memory) ?? null;
  }

  async getMemory(id) {
    return this.sxStorage?.getMemory?.(id) ?? null;
  }

  async getAllMemories(options) {
    return this.sxStorage?.getAllMemories?.(options) ?? [];
  }

  async deleteMemory(id) {
    return this.sxStorage?.deleteMemory?.(id) ?? false;
  }

  // ─── settings CRUD ──────────────────────────────────────────────────────────

  async saveSetting(key, value) {
    return this.sxStorage?.saveSetting?.(key, value) ?? null;
  }

  async getSetting(key) {
    return this.sxStorage?.getSetting?.(key) ?? null;
  }

  async getAllSettings() {
    return this.sxStorage?.getAllSettings?.() ?? {};
  }

  // ─── migration (one-shot, reads native localStorage only during this call) ───

  async migrateFromLocalStorage(keys) {
    if (!this.sxStorage) {
      console.warn('[StorageAdapter] 無法遷移：sxStorage 未就緒');
      return { migrated: 0, errors: [] };
    }
    const result = { migrated: 0, errors: [] };
    for (const key of keys) {
      try {
        const localValue = localStorage.getItem(key);
        if (localValue !== null) {
          await this.sxStorage.setItem(key, localValue);
          console.info('[StorageAdapter] 遷移完成:', key);
          result.migrated++;
        }
      } catch (e) {
        console.error('[StorageAdapter] 遷移失敗:', key, e);
        result.errors.push({ key, error: e.message });
      }
    }
    return result;
  }

  // ─── native localStorage cleanup (operates on remaining legacy keys only) ────

  async clearLargeDataFromLocalStorage(keys) {
    if (!keys || !keys.length) return;
    for (const key of keys) {
      try {
        const value = localStorage.getItem(key);
        if (value && value.length > 10000) {
          if (this.sxStorage) {
            const idbValue = await this.sxStorage.getItem(key);
            if (idbValue !== null) {
              localStorage.removeItem(key);
              console.info('[StorageAdapter] 已從原生 localStorage 清除大型 key:', key);
            }
          }
        }
      } catch (e) {
        console.warn('[StorageAdapter] 清除失敗:', key, e);
      }
    }
  }

  // ─── usage reporting ────────────────────────────────────────────────────────

  async getStorageUsage() {
    let nativeSize = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k) {
          const v = localStorage.getItem(k);
          if (v) nativeSize += k.length * 2 + v.length * 2;
        }
      }
    } catch (_) {}

    let indexedDBSize = 0;
    if (this.sxStorage) {
      const estimate = await this.sxStorage.getStorageEstimate();
      indexedDBSize = estimate.usage;
    }

    return {
      localStorageSize: nativeSize,
      localStorageMB: (nativeSize / 1024 / 1024).toFixed(2),
      indexedDBSize,
      indexedDBMB: (indexedDBSize / 1024 / 1024).toFixed(2),
      totalMB: ((nativeSize + indexedDBSize) / 1024 / 1024).toFixed(2)
    };
  }

  // ─── export / import ────────────────────────────────────────────────────────

  async exportAllData() {
    return this.sxStorage?.exportAllData?.() ?? {
      keyValue: {}, chatSessions: [], characters: [],
      memories: [], settings: {},
      exportedAt: new Date().toISOString(), version: '1.0'
    };
  }

  async importAllData(data) {
    return this.sxStorage?.importAllData?.(data) ?? { success: false, count: 0 };
  }

  // ─── clear ──────────────────────────────────────────────────────────────────

  async clearAll() {
    return this.sxStorage?.clearAll?.() ?? false;
  }

  // ─── migration from legacy localStorage → IndexedDB ────────────────────────

  async migrateFromLocalStorageToIndexedDB() {
    if (!this.sxStorage) return { migrated: 0, errors: [] };
    return this.sxStorage.migrateFromLocalStorage();
  }

  // ─── stats ──────────────────────────────────────────────────────────────────

  async getStats() {
    return this.sxStorage?.getStats?.() ?? {
      keyValue: 0, chatSessions: 0, characters: 0,
      memories: 0, settings: 0, media: 0,
      totalRecords: 0, estimatedSize: 0
    };
  }
}

const storageAdapter = new StorageAdapter();

if (typeof window !== 'undefined') {
  window.StorageAdapter = StorageAdapter;
  window.storageAdapter = storageAdapter;
}
