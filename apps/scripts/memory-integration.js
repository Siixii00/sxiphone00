class MemoryIntegration {
  constructor() {
    this.manager = null;
    this.isInitialized = false;
    this.useNewSystem = false;
    this.config = {
      enabled: true,
      autoMigrate: true,
      preferNew: true
    };
  }

  async initialize(options = {}) {
    if (this.isInitialized) return true;

    this.config = { ...this.config, ...options };

    try {
      if (typeof MemoryManager === 'undefined') {
        console.warn('[MemoryIntegration] MemoryManager 未載入，使用舊系統');
        this.useNewSystem = false;
        this.isInitialized = true;
        return false;
      }

      this.manager = new MemoryManager();
      await this.manager.initialize((progress) => {
        console.log(`[MemoryIntegration] 初始化進度: ${progress.stage} ${progress.progress}%`);
      });

      this.useNewSystem = true;
      this.isInitialized = true;

      if (this.config.autoMigrate) {
        this._scheduleMigration();
      }

      console.log('[MemoryIntegration] 新記憶系統已啟用');
      return true;
    } catch (error) {
      console.error('[MemoryIntegration] 初始化失敗:', error);
      this.useNewSystem = false;
      this.isInitialized = true;
      return false;
    }
  }

  async writeMemory(summary, meta = {}) {
    if (!this.useNewSystem || !this.manager) {
      return { success: false, reason: 'new-system-not-available' };
    }

    try {
      const memory = await this.manager.hold(summary, {
        importance: meta.importance || 5,
        source: meta.source || 'auto',
        tags: meta.tags || [],
        domain: meta.domain || []
      });

      return { success: true, id: memory.id, hash: memory.hash };
    } catch (error) {
      console.error('[MemoryIntegration] 寫入記憶失敗:', error);
      return { success: false, reason: error.message };
    }
  }

  async readMemorySnapshot(payload = {}) {
    if (!this.useNewSystem || !this.manager) {
      return null;
    }

    try {
      const limit = payload.limit || 20;
      const memories = await this.manager.memoryStore.getAll({ limit });

      const items = memories.map(m => ({
        id: m.id,
        summary: m.content,
        hash: m.hash,
        createdAt: m.metadata?.created,
        source: m.metadata?.source,
        emotion: m.emotion,
        tags: m.tags,
        importance: m.metadata?.importance
      }));

      return {
        userKey: 'indexeddb',
        items,
        count: items.length,
        source: 'new-system',
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('[MemoryIntegration] 讀取記憶失敗:', error);
      return null;
    }
  }

  async searchMemory(query, options = {}) {
    if (!this.useNewSystem || !this.manager) {
      return [];
    }

    try {
      return await this.manager.search(query, options);
    } catch (error) {
      console.error('[MemoryIntegration] 搜索記憶失敗:', error);
      return [];
    }
  }

  async breath(options = {}) {
    if (!this.useNewSystem || !this.manager) {
      return { surfaced: [], feels: [] };
    }

    try {
      return await this.manager.breath(options);
    } catch (error) {
      console.error('[MemoryIntegration] Breath 失敗:', error);
      return { surfaced: [], feels: [] };
    }
  }

  async trace(id, updates) {
    if (!this.useNewSystem || !this.manager) {
      return null;
    }

    try {
      return await this.manager.trace(id, updates);
    } catch (error) {
      console.error('[MemoryIntegration] 更新記憶失敗:', error);
      return null;
    }
  }

  async pulse() {
    if (!this.useNewSystem || !this.manager) {
      return null;
    }

    try {
      return await this.manager.pulse();
    } catch (error) {
      console.error('[MemoryIntegration] Pulse 失敗:', error);
      return null;
    }
  }

  async dream() {
    if (!this.useNewSystem || !this.manager) {
      return { crystallized: false, reason: 'not-available' };
    }

    try {
      return await this.manager.dream();
    } catch (error) {
      console.error('[MemoryIntegration] Dream 失敗:', error);
      return { crystallized: false, reason: error.message };
    }
  }

  async migrateOldMemories(progressCallback = null) {
    if (!this.useNewSystem || !this.manager) {
      console.warn('[MemoryIntegration] 無法遷移：新系統未啟用');
      return { migrated: 0, failed: 0 };
    }

    const MEMORY_BUCKET_PREFIX = 'sx_global_memory_bucket:';
    const oldMemories = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(MEMORY_BUCKET_PREFIX)) {
        try {
          const raw = localStorage.getItem(key);
          const bucket = JSON.parse(raw || '[]');
          if (Array.isArray(bucket)) {
            oldMemories.push(...bucket);
          }
        } catch (e) {
          console.warn(`[MemoryIntegration] 讀取 ${key} 失敗:`, e);
        }
      }
    }

    console.log(`[MemoryIntegration] 發現 ${oldMemories.length} 條舊記憶`);

    let migrated = 0;
    let failed = 0;

    for (let i = 0; i < oldMemories.length; i++) {
      const mem = oldMemories[i];
      try {
        await this.manager.hold(mem.summary, {
          id: mem.id,
          importance: 5,
          source: mem.source || 'migration',
          metadata: {
            created: mem.createdAt,
            migratedAt: new Date().toISOString()
          }
        });
        migrated++;

        if (progressCallback) {
          progressCallback({ current: i + 1, total: oldMemories.length, migrated, failed });
        }
      } catch (e) {
        console.warn(`[MemoryIntegration] 遷移失敗: ${mem.id}`, e);
        failed++;
      }
    }

    console.log(`[MemoryIntegration] 遷移完成: ${migrated} 成功, ${failed} 失敗`);

    localStorage.setItem('sx_memory_migration_status', JSON.stringify({
      migratedCount: migrated,
      failedCount: failed,
      lastMigrationAt: new Date().toISOString()
    }));

    return { migrated, failed, total: oldMemories.length };
  }

  _scheduleMigration() {
    const status = localStorage.getItem('sx_memory_migration_status');
    if (status) {
      console.log('[MemoryIntegration] 已有遷移記錄，跳過自動遷移');
      return;
    }

    setTimeout(() => {
      this.migrateOldMemories((progress) => {
        console.log(`[MemoryIntegration] 遷移進度: ${progress.current}/${progress.total}`);
      });
    }, 5000);
  }

  getStats() {
    if (!this.manager) {
      return { enabled: false, initialized: this.isInitialized };
    }

    return {
      enabled: this.useNewSystem,
      initialized: this.isInitialized,
      ...this.manager.getStats()
    };
  }

  setEnabled(enabled) {
    this.config.enabled = enabled;
    this.useNewSystem = enabled && this.manager?.isInitialized;
    console.log(`[MemoryIntegration] 新系統 ${enabled ? '啟用' : '停用'}`);
  }
}

const memoryIntegration = new MemoryIntegration();

if (typeof window !== 'undefined') {
  window.memoryIntegration = memoryIntegration;
  window.MemoryIntegration = MemoryIntegration;
}
