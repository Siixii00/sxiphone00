class StorageManager {
  constructor(options = {}) {
    this.memoryStore = options.memoryStore || null;
    this.warningThreshold = options.warningThreshold || 0.7;
    this.criticalThreshold = options.criticalThreshold || 0.9;
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
        console.warn('[StorageManager] 無法獲取儲存估計:', e);
      }
    }
    return { quota: 0, usage: 0, usagePercentage: 0, available: 0 };
  }

  async getDetailedEstimate() {
    const result = {
      indexedDB: { size: 0, count: 0 },
      localStorage: { size: 0, count: 0 },
      cacheStorage: { size: 0, count: 0 },
      total: { size: 0, count: 0 }
    };

    result.indexedDB = await this._getIndexedDBSize();
    result.localStorage = this._getLocalStorageSize();
    result.cacheStorage = await this._getCacheStorageSize();
    
    result.total.size = result.indexedDB.size + result.localStorage.size + result.cacheStorage.size;
    result.total.count = result.indexedDB.count + result.localStorage.count + result.cacheStorage.count;

    return result;
  }

  async _getIndexedDBSize() {
    if (!this.memoryStore || !this.memoryStore.db) {
      return { size: 0, count: 0 };
    }

    try {
      const memories = await this.memoryStore.getAll();
      let size = 0;
      
      for (const memory of memories) {
        size += this._estimateObjectSize(memory);
      }

      return { size, count: memories.length };
    } catch (e) {
      console.warn('[StorageManager] 無法計算 IndexedDB 大小:', e);
      return { size: 0, count: 0 };
    }
  }

  _getLocalStorageSize() {
    let size = 0;
    let count = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sx_')) {
        const value = localStorage.getItem(key) || '';
        size += key.length + value.length;
        count++;
      }
    }

    return { size: size * 2, count };
  }

  async _getCacheStorageSize() {
    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;
      let totalCount = 0;

      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        totalCount += keys.length;
        
        for (const request of keys) {
          const response = await cache.match(request);
          if (response) {
            const blob = await response.clone().blob();
            totalSize += blob.size;
          }
        }
      }

      return { size: totalSize, count: totalCount };
    } catch (e) {
      console.warn('[StorageManager] 無法計算 Cache 大小:', e);
      return { size: 0, count: 0 };
    }
  }

  _estimateObjectSize(obj) {
    const str = JSON.stringify(obj);
    return str.length * 2;
  }

  checkIOSStorageWarning() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (!isIOS) {
      return { isIOS: false, warning: null };
    }

    const localStorageSize = this._getLocalStorageSize();
    const localStorageLimit = 5 * 1024 * 1024;
    const usagePercentage = localStorageSize.size / localStorageLimit;

    let warning = null;
    if (usagePercentage > this.criticalThreshold) {
      warning = 'critical';
    } else if (usagePercentage > this.warningThreshold) {
      warning = 'warning';
    }

    return {
      isIOS: true,
      localStorageUsage: localStorageSize.size,
      localStorageLimit,
      usagePercentage,
      warning
    };
  }

  getCleanupRecommendations() {
    const recommendations = [];

    const localStorageSize = this._getLocalStorageSize();
    if (localStorageSize.size > 1024 * 1024) {
      recommendations.push({
        type: 'localStorage',
        message: `localStorage 使用 ${this._formatSize(localStorageSize.size)}，建議遷移到 IndexedDB`,
        priority: 'medium',
        keys: this._getLargeLocalStorageKeys()
      });
    }

    return recommendations;
  }

  _getLargeLocalStorageKeys() {
    const largeKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sx_')) {
        const value = localStorage.getItem(key) || '';
        const size = (key.length + value.length) * 2;
        if (size > 10 * 1024) {
          largeKeys.push({ key, size: this._formatSize(size) });
        }
      }
    }
    return largeKeys.sort((a, b) => b.size - a.size).slice(0, 5);
  }

  _formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  async migrateLocalStorageToIndexedDB(key, storeName = 'metadata') {
    if (!this.memoryStore || !this.memoryStore.db) {
      throw new Error('MemoryStore 未初始化');
    }

    const value = localStorage.getItem(key);
    if (!value) {
      return { migrated: false, reason: 'key_not_found' };
    }

    try {
      await this.memoryStore.setMetadata(key, JSON.parse(value));
      localStorage.removeItem(key);
      console.log(`[StorageManager] 已遷移 ${key} 到 IndexedDB`);
      return { migrated: true, key };
    } catch (e) {
      console.error(`[StorageManager] 遷移 ${key} 失敗:`, e);
      return { migrated: false, reason: e.message };
    }
  }

  async clearServiceWorkerCache() {
    try {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        await caches.delete(name);
      }
      console.log('[StorageManager] Service Worker Cache 已清除');
      return true;
    } catch (e) {
      console.error('[StorageManager] 清除 Cache 失敗:', e);
      return false;
    }
  }

  getStats() {
    return {
      warningThreshold: this.warningThreshold,
      criticalThreshold: this.criticalThreshold
    };
  }
}

if (typeof window !== 'undefined') {
  window.StorageManager = StorageManager;
}
