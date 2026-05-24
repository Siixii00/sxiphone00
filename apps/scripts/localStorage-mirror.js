/**
 * localStorage-mirror.js
 *
 * 全域攔截層：將 **所有** localStorage 操作無縫轉發到 sxStorage (IndexedDB)。
 * 完全消除 localStorage 5MB 容量限制問題。
 *
 * 載入時機：在 sx-storage.js 之後、所有其他 script 之前。
 *
 * 行為：
 * - setItem(key, value)  → sxStorage.setItem() [不寫 native localStorage]
 * - getItem(key)         → sxStorage._getCache(key) 同步快取 || native fallback (遷移過渡)
 * - removeItem(key)      → sxStorage.removeItem() + native cleanup
 * - clear()              → sxStorage.clearAll() + native clear
 * - key(index) / length  → 暫保留 native 行為（遷移完成後 native 為空）
 *
 * Bootstrap 遷移：
 *   首次載入時自動將原生 localStorage 中所有資料搬移至 IndexedDB，
 *   成功後刪除 native 副本。
 */
(function (global) {
  'use strict';

  // ─── 保存原生方法引用（在 patch 之前） ──────────────────────────────────────
  const _nativeGetItem = localStorage.getItem.bind(localStorage);
  const _nativeSetItem = localStorage.setItem.bind(localStorage);
  const _nativeRemoveItem = localStorage.removeItem.bind(localStorage);
  const _nativeKey = localStorage.key.bind(localStorage);
  const _nativeLengthDesc = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(localStorage), 'length'
  ) || Object.getOwnPropertyDescriptor(localStorage.__proto__, 'length');
  const _nativeClear = localStorage.clear.bind(localStorage);

  // ─── 內部狀態 ───────────────────────────────────────────────────────────────
  let _sxReady = false;
  let _bootstrapDone = false;
  let _writeQueue = [];

  // ─── helpers ────────────────────────────────────────────────────────────────

  function _isSxReady() {
    return _sxReady && typeof sxStorage !== 'undefined' && sxStorage !== null;
  }

  async function _writeSingle(key, value) {
    try {
      await sxStorage.setItem(key, value);
    } catch (e) {
      console.error('[localStorage-mirror] sxStorage.setItem 失敗:', key, e);
    }
  }

  function _flushQueue() {
    if (!_isSxReady() || _writeQueue.length === 0) return;
    const batch = _writeQueue.splice(0);
    for (const { key, value } of batch) {
      _writeSingle(key, value);
    }
  }

  // ─── Bootstrap 遷移 ─────────────────────────────────────────────────────────
  // 策略變更：不再刪除 native localStorage 中的資料。
  // 只將資料「複製」到 IndexedDB，但保留 native 副本作為同步讀取 fallback。
  // 這確保 iframe app 在 cache 尚未暖的情況下仍能讀到資料。
  // 寫入則只走 IndexedDB（不寫 native），逐步讓 native 過時淘汰。

  function _runBootstrap() {
    if (_bootstrapDone || !_isSxReady()) return;
    _bootstrapDone = true;

    const nativeLen = _nativeLengthDesc ? _nativeLengthDesc.get.call(localStorage) : 0;
    if (nativeLen === 0) {
      console.info('[localStorage-mirror] 原生 localStorage 為空，無需遷移');
      return;
    }

    const toMigrate = [];
    for (let i = 0; i < nativeLen; i++) {
      const key = _nativeKey(i);
      if (key) {
        const val = _nativeGetItem(key);
        if (val !== null) toMigrate.push({ key, val });
      }
    }

    if (toMigrate.length === 0) return;

    console.info(`[localStorage-mirror] 複製 ${toMigrate.length} 筆 localStorage → IndexedDB（保留原生副本作為同步 fallback）`);

    (async () => {
      let migrated = 0;
      for (const { key, val } of toMigrate) {
        try {
          await sxStorage.setItem(key, val);
          migrated++;
        } catch (e) {
          console.warn('[localStorage-mirror] 遷移失敗:', key, e);
        }
      }
      console.info(`[localStorage-mirror] 遷移完成: ${migrated}/${toMigrate.length}`);
    })();
  }

  // ─── Patch localStorage ─────────────────────────────────────────────────────
  // 大型資料（>8KB）只寫 IndexedDB；小型設定同時寫 native + IndexedDB（確保 iframe 同步讀取）
  const NATIVE_WRITE_MAX_SIZE = 8192; // 8KB：超過此大小不寫 native localStorage

  localStorage.setItem = function (key, value) {
    const strValue = typeof value === 'string' ? value : String(value);

    if (_isSxReady()) {
      _writeSingle(key, strValue); // 非同步寫 IndexedDB
    } else {
      _writeQueue.push({ key, value: strValue });
    }

    // 小型資料同步寫入 native localStorage（作為 iframe 同步讀取 fallback）
    if (strValue.length <= NATIVE_WRITE_MAX_SIZE) {
      try { _nativeSetItem(key, strValue); } catch (_) {
        // localStorage 滿了 → 只靠 IndexedDB
      }
    }
    // 大型資料（base64 圖片、大 JSON）不寫 native → 避免 5MB 爆掉
  };

  localStorage.getItem = function (key) {
    // 1. 優先從 sxStorage 記憶體快取（最新資料）
    if (_isSxReady()) {
      try {
        const cached = sxStorage._getCache?.(key);
        if (cached !== undefined && cached !== null) return cached;
      } catch (_) {}
    }
    // 2. fallback: native localStorage（小型資料仍有同步副本，大型資料遷移前的殘留）
    return _nativeGetItem(key);
  };

  localStorage.removeItem = function (key) {
    if (_isSxReady()) {
      sxStorage.removeItem(key).catch(() => {});
    }
    // 同時清除原生殘留
    try { _nativeRemoveItem(key); } catch (_) {}
  };

  localStorage.clear = function () {
    _nativeClear();
    if (_isSxReady()) {
      sxStorage.clearAll().catch(() => {});
    }
  };

  // length / key 保留原生行為（遷移完成後 native 為空，length=0）
  // 不 patch length/key 以避免引入複雜性

  // ─── Ready Signal & Public API ─────────────────────────────────────────────

  global.__localStorageMirror = {
    get isReady() { return _sxReady; },
    get isBootstrapDone() { return _bootstrapDone; },
    get queuedWrites() { return _writeQueue.length; },

    /**
     * 外部呼叫此方法標記 sxStorage 已就緒。
     * 觸發：排隊寫入 flush + bootstrap 遷移。
     */
    markSxReady() {
      if (_sxReady) return;
      _sxReady = true;
      console.info('[localStorage-mirror] sxStorage 已就緒，開始 flush + 遷移');

      // 確保 sxStorage.init() 完成（預載快取）後再 flush
      const doFlush = () => {
        _flushQueue();
        _runBootstrap();
      };

      if (typeof sxStorage !== 'undefined' && sxStorage?.init) {
        sxStorage.init().then(doFlush).catch(doFlush);
      } else {
        doFlush();
      }
    },

    /** 等待 sxStorage init 完成後標記 ready */
    async awaitSxStorage() {
      if (_sxReady) return;
      if (typeof sxStorage !== 'undefined' && sxStorage?.init) {
        await sxStorage.init();
      }
      this.markSxReady();
    },

    /** 手動觸發遷移（用於 debug） */
    migrate() {
      _bootstrapDone = false;
      _runBootstrap();
    }
  };

  // ─── 自動偵測 sxStorage ─────────────────────────────────────────────────────

  if (typeof sxStorage !== 'undefined' && sxStorage !== null) {
    // sx-storage.js 已載入，立即標記
    global.__localStorageMirror.markSxReady();
  } else {
    console.info('[localStorage-mirror] 已載入，等待 sxStorage...');
  }

})(typeof window !== 'undefined' ? window : globalThis);
