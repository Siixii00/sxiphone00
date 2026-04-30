class StorageAdapter {
    constructor() {
        this.isIOS = /iP(ad|hone|od)/.test(navigator.userAgent);
        this.preferIndexedDB = this.isIOS;
        this._localforageReady = false;
        this._initPromise = this._initLocalforage();
        this._cache = new Map();
        this._cacheExpiry = new Map();
        this.CACHE_TTL = 30000;
    }

    async _initLocalforage() {
        if (typeof localforage === 'undefined') {
            console.warn('[StorageAdapter] localforage 未載入');
            return false;
        }
        try {
            if (!localforage._config || !localforage._config.storeName) {
                localforage.config({
                    name: 'sxiphone',
                    storeName: 'keyvaluepairs',
                    driver: [localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE]
                });
            }
            this._localforageReady = true;
            console.log('[StorageAdapter] localforage 初始化完成，iOS模式:', this.isIOS);
            return true;
        } catch (e) {
            console.error('[StorageAdapter] localforage 初始化失敗:', e);
            return false;
        }
    }

    async ready() {
        return this._initPromise;
    }

    _shouldCacheToLocalStorage(key, value) {
        if (!this.isIOS) return true;
        const smallKeys = [
            'sx_user_name', 'sx_user_avatar', 'sx_user_background', 'sx_user_personality',
            'sx_char_name', 'sx_char_avatar', 'sx_char_personality', 'sx_char_background',
            'sx_chat_active', 'sx_theme', 'sx_language'
        ];
        if (smallKeys.includes(key)) return true;
        if (key === 'sx_chat_history_cache') return true;
        return false;
    }

    async setItem(key, value) {
        await this._initPromise;
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        
        this._cache.set(key, value);
        this._cacheExpiry.set(key, Date.now() + this.CACHE_TTL);

        if (this.preferIndexedDB && this._localforageReady) {
            try {
                await localforage.setItem(key, stringValue);
                if (this._shouldCacheToLocalStorage(key, stringValue)) {
                    try {
                        localStorage.setItem(key, stringValue);
                    } catch (e) {
                        console.warn('[StorageAdapter] localStorage 快取失敗:', e);
                    }
                }
                return true;
            } catch (e) {
                console.error('[StorageAdapter] IndexedDB 寫入失敗:', e);
            }
        }

        try {
            localStorage.setItem(key, stringValue);
            return true;
        } catch (e) {
            console.error('[StorageAdapter] localStorage 寫入失敗:', e);
            if (this._localforageReady) {
                try {
                    await localforage.setItem(key, stringValue);
                    return true;
                } catch (e2) {
                    console.error('[StorageAdapter] 備援寫入也失敗:', e2);
                }
            }
            return false;
        }
    }

    async getItem(key) {
        await this._initPromise;

        if (this._cache.has(key)) {
            const expiry = this._cacheExpiry.get(key);
            if (expiry && Date.now() < expiry) {
                return this._cache.get(key);
            }
            this._cache.delete(key);
            this._cacheExpiry.delete(key);
        }

        if (this.preferIndexedDB && this._localforageReady) {
            try {
                const value = await localforage.getItem(key);
                if (value !== null) {
                    this._cache.set(key, value);
                    this._cacheExpiry.set(key, Date.now() + this.CACHE_TTL);
                    return value;
                }
            } catch (e) {
                console.warn('[StorageAdapter] IndexedDB 讀取失敗，嘗試 localStorage:', e);
            }
        }

        const localValue = localStorage.getItem(key);
        if (localValue !== null) {
            this._cache.set(key, localValue);
            this._cacheExpiry.set(key, Date.now() + this.CACHE_TTL);
        }
        return localValue;
    }

    async getJSON(key) {
        const value = await this.getItem(key);
        if (value === null) return null;
        try {
            return JSON.parse(value);
        } catch (e) {
            console.warn('[StorageAdapter] JSON 解析失敗:', key, e);
            return null;
        }
    }

    async setJSON(key, value) {
        return this.setItem(key, JSON.stringify(value));
    }

    async removeItem(key) {
        await this._initPromise;
        this._cache.delete(key);
        this._cacheExpiry.delete(key);

        if (this._localforageReady) {
            try {
                await localforage.removeItem(key);
            } catch (e) {
                console.warn('[StorageAdapter] IndexedDB 刪除失敗:', e);
            }
        }
        localStorage.removeItem(key);
    }

    async migrateFromLocalStorage(keys) {
        await this._initPromise;
        if (!this._localforageReady) {
            console.warn('[StorageAdapter] 無法遷移：localforage 未就緒');
            return { migrated: 0, errors: [] };
        }

        const result = { migrated: 0, errors: [] };

        for (const key of keys) {
            try {
                const localValue = localStorage.getItem(key);
                if (localValue !== null) {
                    const existingValue = await localforage.getItem(key);
                    if (existingValue === null) {
                        await localforage.setItem(key, localValue);
                        console.log('[StorageAdapter] 遷移完成:', key);
                        result.migrated++;
                    } else {
                        console.log('[StorageAdapter] 跳過已存在:', key);
                    }
                }
            } catch (e) {
                console.error('[StorageAdapter] 遷移失敗:', key, e);
                result.errors.push({ key, error: e.message });
            }
        }

        return result;
    }

    async clearLargeDataFromLocalStorage(keys) {
        for (const key of keys) {
            try {
                const value = localStorage.getItem(key);
                if (value && value.length > 10000) {
                    const indexedDBValue = await localforage.getItem(key);
                    if (indexedDBValue !== null) {
                        localStorage.removeItem(key);
                        console.log('[StorageAdapter] 已從 localStorage 清除大型資料:', key);
                    }
                }
            } catch (e) {
                console.warn('[StorageAdapter] 清除失敗:', key, e);
            }
        }
    }

    async getStorageUsage() {
        let localStorageSize = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                const value = localStorage.getItem(key);
                if (value) localStorageSize += value.length * 2;
            }
        }

        let indexedDBSize = 0;
        if (this._localforageReady) {
            try {
                await localforage.iterate((value) => {
                    if (typeof value === 'string') {
                        indexedDBSize += value.length * 2;
                    }
                });
            } catch (e) {
                console.warn('[StorageAdapter] 計算 IndexedDB 大小失敗:', e);
            }
        }

        return {
            localStorage: localStorageSize,
            localStorageMB: (localStorageSize / 1024 / 1024).toFixed(2),
            indexedDB: indexedDBSize,
            indexedDBMB: (indexedDBSize / 1024 / 1024).toFixed(2),
            totalMB: ((localStorageSize + indexedDBSize) / 1024 / 1024).toFixed(2)
        };
    }
}

const storageAdapter = new StorageAdapter();

window.StorageAdapter = StorageAdapter;
window.storageAdapter = storageAdapter;
