class UnifiedStorageManager {
  constructor(options = {}) {
    this.memoryStore = options.memoryStore || null;
    this.warningThreshold = options.warningThreshold || 0.7;
    this.criticalThreshold = options.criticalThreshold || 0.9;
    this.maxPartSize = options.maxPartSize || 800 * 1024;
    this.backupStatus = {
      lastSuccess: null,
      lastError: null,
      isLargeBackup: false,
      partCount: 0
    };
    this.iosStorageLimit = 5 * 1024 * 1024;
    
    this.pipelineConfig = {
      enabled: true,
      migrateInterval: 3 * 60 * 1000,
      supabaseBackupInterval: 10 * 60 * 1000,
      nightlyBackupHour: 3,
      keysToMigrate: [
        'sx_chat_sessions',
        'sx_chat_history',
        'sx_short_term_memory',
        'sx_characters',
        'sx_masks',
        'sx_users',
        'sx_npcs',
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
      ],
      keyPatterns: [
        /^sx_memory_/,
        /^sx_long_term_memory/,
        /^sx_archived_/,
        /^sx_app_/,
        /^api_/
      ]
    };
    
    this.progressiveCleanupConfig = {
      enabled: true,
      keepRecentDays: 7,
      keepRecentSessions: 10,
      keepRecentMemories: 50,
      cleanupInterval: 24 * 60 * 60 * 1000,
      minBackupAge: 60 * 60 * 1000
    };
    
    this.cloudRetrievalConfig = {
      enabled: true,
      cacheTimeout: 5 * 60 * 1000,
      maxResults: 50,
      searchTypes: {
        chat: 'sx_chat_sessions',
        memory: 'sx_short_term_memory',
        innerVoice: 'sx_inner_voice_history',
        generated: 'generated_content'
      }
    };
    
    this._cloudCache = new Map();
    this._verifiedBackups = new Set();
    this._autoCleanupRunning = false;
    this._migrateTimer = null;
    this._supabaseBackupTimer = null;
    this._nightlyBackupTimer = null;
    
    this._loadVerifiedBackups();
    this._startPipeline();
  }

  _loadVerifiedBackups() {
    try {
      const saved = localStorage.getItem('sx_verified_backups');
      if (saved) {
        const parsed = JSON.parse(saved);
        this._verifiedBackups = new Set(parsed);
      }
    } catch (e) {
      console.warn('[UnifiedStorageManager] 無法載入已驗證備份列表');
    }
  }

  _saveVerifiedBackups() {
    try {
      localStorage.setItem('sx_verified_backups', JSON.stringify([...this._verifiedBackups]));
    } catch (e) {
      console.warn('[UnifiedStorageManager] 無法儲存已驗證備份列表');
    }
  }

  async verifyBackupExists(backupId, source = 'supabase') {
    const cacheKey = `${source}_${backupId}`;
    
    if (this._verifiedBackups.has(cacheKey)) {
      return { verified: true, cached: true };
    }

    if (source === 'supabase') {
      const url = localStorage.getItem('sx_supabase_url');
      const key = localStorage.getItem('sx_supabase_key');
      const table = localStorage.getItem('sx_supabase_table') || 'sxiphone_backups';
      
      if (!url || !key) {
        return { verified: false, error: 'Supabase 未設定' };
      }

      try {
        const resp = await fetch(`${url}/rest/v1/${table}?id=eq.${backupId}&select=id,exported_at`, {
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`
          }
        });

        if (resp.ok) {
          const data = await resp.json();
          if (data && data.length > 0) {
            this._verifiedBackups.add(cacheKey);
            this._saveVerifiedBackups();
            return { verified: true, cached: false, data: data[0] };
          }
        }
        
        return { verified: false, error: '備份不存在' };
      } catch (e) {
        return { verified: false, error: e.message };
      }
    }

    if (source === 'github') {
      const token = localStorage.getItem('sx_github_token') || localStorage.getItem('sx_github_pat');
      const repo = localStorage.getItem('sx_github_repo_name') || localStorage.getItem('sx_github_repo') || 'sxiphone-backup';
      const user = localStorage.getItem('sx_github_user');
      
      if (!token || !user) {
        return { verified: false, error: 'GitHub 未設定' };
      }

      try {
        const resp = await fetch(`https://api.github.com/repos/${user}/${repo}/contents/backup/sxiphone.json`, {
          headers: { Authorization: `token ${token}` }
        });

        if (resp.ok) {
          this._verifiedBackups.add(cacheKey);
          this._saveVerifiedBackups();
          return { verified: true, cached: false };
        }
        
        return { verified: false, error: '備份不存在' };
      } catch (e) {
        return { verified: false, error: e.message };
      }
    }

    return { verified: false, error: '未知的備份來源' };
  }

  async searchCloudHistory(query, options = {}) {
    const results = {
      chat: [],
      memory: [],
      innerVoice: [],
      generated: [],
      total: 0
    };

    const url = localStorage.getItem('sx_supabase_url');
    const key = localStorage.getItem('sx_supabase_key');
    
    if (!url || !key) {
      console.warn('[UnifiedStorageManager] Supabase 未設定，無法搜尋雲端');
      return results;
    }

    const table = localStorage.getItem('sx_supabase_table') || 'sxiphone_backups';
    const maxResults = options.maxResults || this.cloudRetrievalConfig.maxResults;
    const searchQuery = query.toLowerCase();

    try {
      const resp = await fetch(`${url}/rest/v1/${table}?select=id,exported_at,data&order=exported_at.desc&limit=${Math.min(maxResults, 20)}`, {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`
        }
      });

      if (!resp.ok) {
        throw new Error(`搜尋失敗: ${resp.status}`);
      }

      const backups = await resp.json();
      
      for (const backup of backups) {
        if (!backup.data) continue;

        if (backup.data.localStorage) {
          const chatSessions = backup.data.localStorage.sx_chat_sessions;
          if (chatSessions) {
            try {
              const sessions = JSON.parse(chatSessions);
              for (const session of sessions) {
                if (session.messages) {
                  const relevantMessages = session.messages.filter(msg => 
                    (msg.content && msg.content.toLowerCase().includes(searchQuery)) ||
                    (msg.role && msg.role.toLowerCase().includes(searchQuery))
                  );
                  if (relevantMessages.length > 0) {
                    results.chat.push({
                      sessionId: session.id,
                      charName: session.charName,
                      messages: relevantMessages,
                      exportedAt: backup.exported_at,
                      backupId: backup.id
                    });
                  }
                }
              }
            } catch {}
          }

          const innerVoice = backup.data.localStorage.sx_inner_voice_history;
          if (innerVoice) {
            try {
              const voices = JSON.parse(innerVoice);
              const relevantVoices = voices.filter(v => 
                (v.content && v.content.toLowerCase().includes(searchQuery)) ||
                (v.charName && v.charName.toLowerCase().includes(searchQuery))
              );
              if (relevantVoices.length > 0) {
                results.innerVoice.push({
                  voices: relevantVoices,
                  exportedAt: backup.exported_at,
                  backupId: backup.id
                });
              }
            } catch {}
          }
        }

        if (backup.data.localforage) {
          const memories = backup.data.localforage.sx_short_term_memory;
          if (memories) {
            try {
              const memList = typeof memories === 'string' ? JSON.parse(memories) : memories;
              const relevantMemories = memList.filter(m => 
                (m.content && m.content.toLowerCase().includes(searchQuery)) ||
                (m.summary && m.summary.toLowerCase().includes(searchQuery)) ||
                (m.tags && m.tags.some(t => t.toLowerCase().includes(searchQuery)))
              );
              if (relevantMemories.length > 0) {
                results.memory.push({
                  memories: relevantMemories,
                  exportedAt: backup.exported_at,
                  backupId: backup.id
                });
              }
            } catch {}
          }
        }
      }

      results.total = results.chat.length + results.memory.length + 
                       results.innerVoice.length + results.generated.length;
      
      console.log(`[UnifiedStorageManager] 雲端搜尋完成，找到 ${results.total} 筆相關資料`);
      
    } catch (e) {
      console.error('[UnifiedStorageManager] 雲端搜尋失敗:', e);
    }

    return results;
  }

  async retrieveContextForAI(charName, options = {}) {
    const context = {
      recentChats: [],
      relevantMemories: [],
      innerVoices: [],
      characterInfo: null,
      retrieved: false
    };

    const url = localStorage.getItem('sx_supabase_url');
    const key = localStorage.getItem('sx_supabase_key');
    
    if (!url || !key) {
      return context;
    }

    const table = localStorage.getItem('sx_supabase_table') || 'sxiphone_backups';
    const maxBackups = options.maxBackups || 5;

    try {
      const resp = await fetch(`${url}/rest/v1/${table}?select=id,exported_at,data&order=exported_at.desc&limit=${maxBackups}`, {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`
        }
      });

      if (!resp.ok) {
        throw new Error(`檢索失敗: ${resp.status}`);
      }

      const backups = await resp.json();
      
      for (const backup of backups) {
        if (!backup.data) continue;

        if (backup.data.localStorage) {
          const chatSessions = backup.data.localStorage.sx_chat_sessions;
          if (chatSessions && charName) {
            try {
              const sessions = JSON.parse(chatSessions);
              const charSessions = sessions.filter(s => 
                s.charName && s.charName.toLowerCase() === charName.toLowerCase()
              );
              
              for (const session of charSessions.slice(0, 3)) {
                if (session.messages && session.messages.length > 0) {
                  context.recentChats.push({
                    sessionId: session.id,
                    messages: session.messages.slice(-10),
                    lastActive: session.lastActive,
                    exportedAt: backup.exported_at
                  });
                }
              }
            } catch {}
          }

          const innerVoice = backup.data.localStorage.sx_inner_voice_history;
          if (innerVoice && charName) {
            try {
              const voices = JSON.parse(innerVoice);
              const charVoices = voices.filter(v => 
                v.charName && v.charName.toLowerCase() === charName.toLowerCase()
              ).slice(-5);
              
              if (charVoices.length > 0) {
                context.innerVoices.push(...charVoices);
              }
            } catch {}
          }
        }

        if (backup.data.localforage) {
          const memories = backup.data.localforage.sx_short_term_memory;
          if (memories) {
            try {
              const memList = typeof memories === 'string' ? JSON.parse(memories) : memories;
              const relevantMems = memList.filter(m => 
                m.charName && m.charName.toLowerCase() === charName.toLowerCase()
              ).slice(-10);
              
              if (relevantMems.length > 0) {
                context.relevantMemories.push(...relevantMems);
              }
            } catch {}
          }
        }
      }

      context.retrieved = context.recentChats.length > 0 || 
                          context.relevantMemories.length > 0 || 
                          context.innerVoices.length > 0;
      
      if (context.retrieved) {
        console.log(`[UnifiedStorageManager] 為 ${charName} 檢索到: ${context.recentChats.length} 個對話, ${context.relevantMemories.length} 條記憶, ${context.innerVoices.length} 條心聲`);
      }
      
    } catch (e) {
      console.error('[UnifiedStorageManager] AI 上下文檢索失敗:', e);
    }

    return context;
  }

  async cleanupVerifiedData(options = {}) {
    const results = {
      verified: 0,
      cleaned: 0,
      errors: []
    };

    const lastBackupId = localStorage.getItem('sx_last_backup_id');
    const lastBackupTime = localStorage.getItem('sx_last_backup_time');
    
    if (!lastBackupId || !lastBackupTime) {
      return { ...results, error: '沒有備份記錄' };
    }

    const backupAge = Date.now() - parseInt(lastBackupTime);
    const minAge = options.minAge || 60 * 60 * 1000;
    
    if (backupAge < minAge) {
      return { ...results, error: '備份時間太近，暫不清理' };
    }

    const verification = await this.verifyBackupExists(lastBackupId, 'supabase');
    if (!verification.verified) {
      const ghVerification = await this.verifyBackupExists(lastBackupId, 'github');
      if (!ghVerification.verified) {
        return { ...results, error: '無法驗證備份存在' };
      }
    }

    results.verified = 1;
    console.log('[UnifiedStorageManager] 備份已驗證，開始清理已備份資料');

    const keysToClean = this.pipelineConfig.keysToMigrate;
    
    for (const key of keysToClean) {
      try {
        const value = localStorage.getItem(key);
        if (!value) continue;

        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) continue;

        const cutoffTime = parseInt(lastBackupTime) - 24 * 60 * 60 * 1000;
        const recent = parsed.filter(item => {
          const itemTime = new Date(item.lastActive || item.createdAt || item.timestamp || 0).getTime();
          return itemTime > cutoffTime;
        });

        if (recent.length < parsed.length) {
          localStorage.setItem(key, JSON.stringify(recent));
          results.cleaned += parsed.length - recent.length;
          console.log(`[UnifiedStorageManager] 清理 ${key}: ${parsed.length - recent.length} 筆舊資料`);
        }
      } catch (e) {
        results.errors.push(`${key}: ${e.message}`);
      }
    }

    localStorage.setItem('sx_last_verified_cleanup', Date.now().toString());
    
    return results;
  }

  async getCloudBackupList(options = {}) {
    const list = [];
    
    const url = localStorage.getItem('sx_supabase_url');
    const key = localStorage.getItem('sx_supabase_key');
    
    if (!url || !key) {
      return list;
    }

    const table = localStorage.getItem('sx_supabase_table') || 'sxiphone_backups';
    const limit = options.limit || 20;

    try {
      const resp = await fetch(`${url}/rest/v1/${table}?select=id,exported_at,type,device&order=exported_at.desc&limit=${limit}`, {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`
        }
      });

      if (resp.ok) {
        const data = await resp.json();
        return data;
      }
    } catch (e) {
      console.error('[UnifiedStorageManager] 獲取備份列表失敗:', e);
    }

    return list;
  }

  _startPipeline() {
    if (typeof window === 'undefined') return;
    
    console.log('[UnifiedStorageManager] 啟動資料管線');
    
    this._migrateTimer = setInterval(() => {
      this._migrateToIndexedDBPipeline();
    }, this.pipelineConfig.migrateInterval);
    
    this._supabaseBackupTimer = setInterval(() => {
      this._autoSupabaseBackup();
    }, this.pipelineConfig.supabaseBackupInterval);
    
    this._checkNightlyBackup();
    setInterval(() => {
      this._checkNightlyBackup();
    }, 60 * 60 * 1000);
    
    if (this.isIOS()) {
      this._runInitialCheck();
      
      setInterval(() => {
        this._autoCleanupCheck();
      }, 5 * 60 * 1000);

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this._autoCleanupCheck();
        }
      });
    }
    
    setTimeout(() => {
      this._migrateToIndexedDBPipeline();
    }, 30 * 1000);
  }

  async _migrateToIndexedDBPipeline() {
    if (typeof localforage === 'undefined') {
      console.warn('[UnifiedStorageManager] localforage 未載入，跳過遷移');
      return;
    }

    const lastMigrate = localStorage.getItem('sx_last_pipeline_migrate');
    const now = Date.now();
    
    if (lastMigrate && (now - parseInt(lastMigrate)) < 60 * 1000) {
      return;
    }

    console.log('[UnifiedStorageManager] 執行 localStorage → IndexedDB 遷移管線');
    
    let migratedCount = 0;
    let freedSpace = 0;

    const keysToProcess = [...this.pipelineConfig.keysToMigrate];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      if (this.pipelineConfig.keyPatterns.some(pattern => pattern.test(key))) {
        if (!keysToProcess.includes(key)) {
          keysToProcess.push(key);
        }
      }
    }

    for (const key of keysToProcess) {
      if (key.endsWith('_in_idb')) continue;
      
      const value = localStorage.getItem(key);
      if (!value) continue;

      try {
        await localforage.setItem(key, value);
        
        const size = (key.length + value.length) * 2;
        freedSpace += size;
        
        localStorage.removeItem(key);
        localStorage.setItem(`${key}_in_idb`, 'true');
        
        migratedCount++;
        console.log(`[UnifiedStorageManager] 已遷移 ${key} 到 IndexedDB (${this._formatSize(size)})`);
      } catch (e) {
        console.error(`[UnifiedStorageManager] 遷移 ${key} 失敗:`, e);
      }
    }

    if (migratedCount > 0) {
      localStorage.setItem('sx_last_pipeline_migrate', now.toString());
      console.log(`[UnifiedStorageManager] 遷移完成，共 ${migratedCount} 項，釋放 ${this._formatSize(freedSpace)} 空間`);
    }

    return { migratedCount, freedSpace };
  }

  async _autoSupabaseBackup() {
    const url = localStorage.getItem('sx_supabase_url');
    const key = localStorage.getItem('sx_supabase_key');
    
    if (!url || !key) {
      return;
    }

    const autoEnabled = localStorage.getItem('sx_supabase_auto_backup') === 'true';
    if (!autoEnabled) {
      return;
    }

    const lastBackup = localStorage.getItem('sx_supabase_last_auto_backup');
    const now = Date.now();
    
    if (lastBackup && (now - parseInt(lastBackup)) < 5 * 60 * 1000) {
      return;
    }

    console.log('[UnifiedStorageManager] 執行定時 Supabase 備份 (第一保險)');
    
    try {
      const result = await this._backupIndexedDBToSupabase(url, key);
      if (result.success) {
        localStorage.setItem('sx_supabase_last_auto_backup', now.toString());
        console.log('[UnifiedStorageManager] Supabase 定時備份成功');
      }
    } catch (e) {
      console.error('[UnifiedStorageManager] Supabase 定時備份失敗:', e);
    }
  }

  async _backupIndexedDBToSupabase(url, key) {
    if (typeof localforage === 'undefined') {
      return { success: false, error: 'localforage_unavailable' };
    }

    const table = localStorage.getItem('sx_supabase_table') || 'sxiphone_backups';
    const backupId = `pipeline_${Date.now()}`;
    
    try {
      const data = {};
      await localforage.iterate((value, k) => {
        if (k.startsWith('sx_') || k.startsWith('api_')) {
          data[k] = value;
        }
      });

      for (const key of this.pipelineConfig.keysToMigrate) {
        const inIdb = localStorage.getItem(`${key}_in_idb`) === 'true';
        if (inIdb) {
          const value = await localforage.getItem(key);
          if (value) {
            data[key] = value;
          }
        }
      }

      const payload = {
        id: backupId,
        type: 'pipeline_backup',
        version: '3.0',
        exported_at: new Date().toISOString(),
        device: navigator.userAgent,
        data: data,
        user_id: localStorage.getItem('sx_user_name') || 'default'
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
        throw new Error(`Supabase 錯誤: ${resp.status}`);
      }

      localStorage.setItem('sx_last_backup_id', backupId);
      localStorage.setItem('sx_last_backup_time', Date.now().toString());
      localStorage.setItem('sx_last_backup_source', 'supabase');

      this.cleanupVerifiedData({ minAge: 30 * 60 * 1000 }).catch(e => {
        console.warn('[UnifiedStorageManager] 備份後清理失敗:', e);
      });

      return { success: true, backupId };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  _checkNightlyBackup() {
    const now = new Date();
    const currentHour = now.getHours();
    
    if (currentHour === this.pipelineConfig.nightlyBackupHour) {
      const lastNightly = localStorage.getItem('sx_last_nightly_backup');
      const today = now.toDateString();
      
      if (lastNightly !== today) {
        console.log('[UnifiedStorageManager] 執行每晚備份 (第二保險)');
        this._executeNightlyBackup();
      }
    }
  }

  async _executeNightlyBackup() {
    const results = {
      github: null,
      supabase: null,
      success: false,
      errors: []
    };

    const githubToken = localStorage.getItem('sx_github_token') || localStorage.getItem('sx_github_pat');
    if (githubToken) {
      try {
        const result = await this.backupToGitHub({
          onStatus: (msg) => console.log('[NightlyBackup] ' + msg)
        });
        results.github = result.success ? 'success' : 'failed';
      } catch (e) {
        results.github = 'error';
        results.errors.push(`GitHub: ${e.message}`);
      }
    }

    const supabaseUrl = localStorage.getItem('sx_supabase_url');
    const supabaseKey = localStorage.getItem('sx_supabase_key');
    if (supabaseUrl && supabaseKey) {
      try {
        const result = await this._backupIndexedDBToSupabase(supabaseUrl, supabaseKey);
        results.supabase = result.success ? 'success' : 'failed';
      } catch (e) {
        results.supabase = 'error';
        results.errors.push(`Supabase: ${e.message}`);
      }
    }

    results.success = results.github === 'success' || results.supabase === 'success';

    if (results.success) {
      localStorage.setItem('sx_last_nightly_backup', new Date().toDateString());
      console.log('[UnifiedStorageManager] 每晚備份成功:', results);
    } else {
      console.error('[UnifiedStorageManager] 每晚備份失敗:', results);
      this._notifyBackupFailed(results);
    }

    return results;
  }

  _notifyBackupFailed(results) {
    const lastNotify = localStorage.getItem('sx_last_backup_fail_notify');
    const now = Date.now();
    
    if (lastNotify && (now - parseInt(lastNotify)) < 6 * 60 * 60 * 1000) {
      return;
    }

    localStorage.setItem('sx_last_backup_fail_notify', now.toString());
    localStorage.setItem('sx_backup_fail_pending', 'true');
    localStorage.setItem('sx_backup_fail_details', JSON.stringify({
      time: new Date().toISOString(),
      results
    }));

    window.dispatchEvent(new CustomEvent('sxiphone-backup-failed', {
      detail: { results }
    }));

    console.warn('[UnifiedStorageManager] 備份失敗，已設定提醒標記');
  }

  checkBackupStatus() {
    const pending = localStorage.getItem('sx_backup_fail_pending') === 'true';
    const details = localStorage.getItem('sx_backup_fail_details');
    
    return {
      hasPendingNotification: pending,
      details: details ? JSON.parse(details) : null,
      lastGithubBackup: localStorage.getItem('sx_github_last_sync'),
      lastSupabaseBackup: localStorage.getItem('sx_supabase_last_sync'),
      lastNightlyBackup: localStorage.getItem('sx_last_nightly_backup')
    };
  }

  clearBackupNotification() {
    localStorage.removeItem('sx_backup_fail_pending');
    localStorage.removeItem('sx_backup_fail_details');
  }

  async restoreFromIndexedDB() {
    if (typeof localforage === 'undefined') {
      return { success: false, error: 'localforage_unavailable' };
    }

    let restoredCount = 0;

    for (const key of this.pipelineConfig.keysToMigrate) {
      const inIdb = localStorage.getItem(`${key}_in_idb`) === 'true';
      if (inIdb) {
        const value = await localforage.getItem(key);
        if (value) {
          try {
            localStorage.setItem(key, value);
            restoredCount++;
          } catch (e) {
            console.warn(`[UnifiedStorageManager] 無法還原 ${key} 到 localStorage:`, e);
          }
        }
      }
    }

    return { success: true, restoredCount };
  }

  safeSetItem(key, value, options = {}) {
    const maxRetries = options.maxRetries || 2;
    const minFreeSpace = options.minFreeSpace || 100 * 1024;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const pressure = this.checkIOSStoragePressureSync();
        
        if (pressure.pressure === 'critical' || pressure.pressure === 'high') {
          console.warn('[UnifiedStorageManager] 寫入前檢測到高壓力，先清理');
          this.emergencyCleanupSync();
        }
        
        localStorage.setItem(key, value);
        return { success: true };
      } catch (e) {
        if (e.name === 'QuotaExceededError' || e.code === 22 || e.message.includes('quota')) {
          console.warn(`[UnifiedStorageManager] localStorage 已滿，嘗試清理 (第 ${attempt + 1} 次)`);
          
          this.emergencyCleanupSync();
          
          if (attempt === maxRetries) {
            console.error('[UnifiedStorageManager] 清理後仍無法寫入，嘗試遷移到 IndexedDB');
            return this._migrateToIndexedDB(key, value);
          }
        } else {
          return { success: false, error: e.message };
        }
      }
    }
    
    return { success: false, error: 'max_retries_exceeded' };
  }

  checkIOSStoragePressureSync() {
    if (!this.isIOS()) {
      return { isIOS: false, pressure: 'none', usage: 0, limit: 0 };
    }

    const localStorageSize = this._getLocalStorageSize();
    const usagePercentage = localStorageSize.size / this.iosStorageLimit;

    let pressure = 'none';
    if (usagePercentage > 0.9) {
      pressure = 'critical';
    } else if (usagePercentage > 0.75) {
      pressure = 'high';
    } else if (usagePercentage > 0.6) {
      pressure = 'moderate';
    }

    return {
      isIOS: true,
      pressure,
      usage: localStorageSize.size,
      limit: this.iosStorageLimit,
      usagePercentage
    };
  }

  emergencyCleanupSync() {
    console.log('[UnifiedStorageManager] 執行緊急同步清理');
    let cleared = 0;

    const keysToCheck = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sx_')) {
        keysToCheck.push(key);
      }
    }

    keysToCheck.sort((a, b) => {
      const valueA = localStorage.getItem(a) || '';
      const valueB = localStorage.getItem(b) || '';
      return valueB.length - valueA.length;
    });

    for (const key of keysToCheck) {
      if (key.includes('_temp') || key.includes('_cache') || key.includes('_old')) {
        localStorage.removeItem(key);
        cleared++;
        continue;
      }

      const value = localStorage.getItem(key);
      if (value && value.length > 50 * 1024) {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed) && parsed.length > 30) {
            const recent = parsed.slice(-30);
            localStorage.setItem(key, JSON.stringify(recent));
            cleared++;
          }
        } catch {}
      }
    }

    const sessionsRaw = localStorage.getItem('sx_chat_sessions');
    if (sessionsRaw) {
      try {
        const sessions = JSON.parse(sessionsRaw);
        if (sessions.length > 5) {
          const recent = sessions.slice(-5);
          localStorage.setItem('sx_chat_sessions', JSON.stringify(recent));
          cleared += sessions.length - 5;
        }
      } catch {}
    }

    const memoryRaw = localStorage.getItem('sx_short_term_memory');
    if (memoryRaw) {
      try {
        const memories = JSON.parse(memoryRaw);
        if (memories.length > 20) {
          const recent = memories.slice(-20);
          localStorage.setItem('sx_short_term_memory', JSON.stringify(recent));
          cleared += memories.length - 20;
        }
      } catch {}
    }

    console.log('[UnifiedStorageManager] 緊急清理完成，清理了', cleared, '項');
    return cleared;
  }

  async emergencyCleanup() {
    console.log('[UnifiedStorageManager] 執行緊急異步清理');
    
    const results = {
      cleared: 0,
      archived: 0,
      errors: []
    };

    results.cleared += this.emergencyCleanupSync();

    const sessionResult = await this._cleanupOldSessions({ 
      keepRecentDays: 3, 
      keepRecentSessions: 5 
    });
    results.cleared += sessionResult.cleared;
    if (sessionResult.error) results.errors.push(sessionResult.error);

    const memoryResult = await this._cleanupOldMemories({ 
      keepRecentDays: 3, 
      keepRecentMemories: 20 
    });
    results.cleared += memoryResult.cleared;
    if (memoryResult.error) results.errors.push(memoryResult.error);

    const cacheResult = await this._cleanupOldCache({});
    results.cleared += cacheResult.cleared;
    if (cacheResult.error) results.errors.push(cacheResult.error);

    localStorage.setItem('sx_last_emergency_cleanup', Date.now().toString());

    console.log('[UnifiedStorageManager] 緊急清理完成:', results);
    return results;
  }

  _migrateToIndexedDB(key, value) {
    if (typeof localforage === 'undefined') {
      return { success: false, error: 'localforage_unavailable' };
    }

    try {
      localforage.setItem(key, value).then(() => {
        console.log('[UnifiedStorageManager] 已遷移', key, '到 IndexedDB');
      }).catch(e => {
        console.error('[UnifiedStorageManager] 遷移失敗:', e);
      });
      
      return { success: true, migrated: true, key };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  getStorageUsage() {
    const usage = {};
    let total = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sx_')) {
        const value = localStorage.getItem(key) || '';
        const size = (key.length + value.length) * 2;
        usage[key] = size;
        total += size;
      }
    }

    const sorted = Object.entries(usage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    return {
      total,
      limit: this.iosStorageLimit,
      usagePercentage: total / this.iosStorageLimit,
      topKeys: sorted.map(([key, size]) => ({
        key,
        size: this._formatSize(size),
        bytes: size
      }))
    };
  }

  async getData(key) {
    const localValue = localStorage.getItem(key);
    if (localValue !== null) {
      return localValue;
    }

    const inIdb = localStorage.getItem(`${key}_in_idb`) === 'true';
    if (inIdb && typeof localforage !== 'undefined') {
      const idbValue = await localforage.getItem(key);
      if (idbValue !== null) {
        return idbValue;
      }
    }

    return null;
  }

  async setData(key, value) {
    const result = this.safeSetItem(key, value);
    
    if (result.migrated || result.success) {
      if (typeof localforage !== 'undefined') {
        await localforage.setItem(key, value);
      }
    }
    
    return result;
  }

  async collectAllStorageData() {
    const data = {
      localStorage: {},
      localforage: {},
      migrated: {},
      summary: {
        localStorageKeys: 0,
        localforageKeys: 0,
        totalSize: 0
      }
    };

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (!(key.startsWith('sx_') || key.startsWith('api_') || key.startsWith('sxiphone'))) continue;
      if (key.endsWith('_in_idb')) continue;
      if (key.includes('_token') || key.includes('_key') || key.includes('_pat')) continue;
      if (key.includes('github_') || key.includes('supabase_')) continue;
      
      try {
        const value = localStorage.getItem(key);
        if (value === null) continue;
        data.localStorage[key] = value;
        data.summary.localStorageKeys++;
        data.summary.totalSize += (key.length + value.length) * 2;
      } catch (e) {
        console.warn('[UnifiedStorageManager] 無法讀取 localStorage:', key);
      }
    }

    if (typeof localforage !== 'undefined') {
      try {
        await localforage.iterate((value, key) => {
          if (key.startsWith('sx_') || key.startsWith('api_') || key.startsWith('sxiphone')) {
            data.localforage[key] = value;
            data.summary.localforageKeys++;
            
            if (!data.localStorage[key]) {
              data.migrated[key] = value;
            }
          }
        });
      } catch (e) {
        console.warn('[UnifiedStorageManager] 無法讀取 localforage:', e);
      }
    }

    data.summary.totalSizeFormatted = this._formatSize(data.summary.totalSize);
    
    return data;
  }

  isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  async checkIOSStoragePressure() {
    if (!this.isIOS()) {
      return { isIOS: false, pressure: 'none', usage: 0, limit: 0 };
    }

    const localStorageSize = this._getLocalStorageSize();
    const usagePercentage = localStorageSize.size / this.iosStorageLimit;

    let pressure = 'none';
    if (usagePercentage > 0.9) {
      pressure = 'critical';
    } else if (usagePercentage > 0.75) {
      pressure = 'high';
    } else if (usagePercentage > 0.6) {
      pressure = 'moderate';
    }

    return {
      isIOS: true,
      pressure,
      usage: localStorageSize.size,
      limit: this.iosStorageLimit,
      usagePercentage,
      available: this.iosStorageLimit - localStorageSize.size,
      recommendation: this._getCleanupRecommendation(pressure, usagePercentage)
    };
  }

  _getCleanupRecommendation(pressure, usagePercentage) {
    if (pressure === 'critical') {
      return '儲存空間嚴重不足，建議立即清理舊資料';
    } else if (pressure === 'high') {
      return '儲存空間偏高，建議清理較舊的資料';
    } else if (pressure === 'moderate') {
      return '儲存空間中等，可考慮清理部分舊資料';
    }
    return '儲存空間充足';
  }

  async progressiveCleanupAfterBackup(backupResult, options = {}) {
    if (!this.isIOS() && !options.force) {
      console.log('[UnifiedStorageManager] 非 iOS 裝置，跳過漸進式清理');
      return { skipped: true, reason: 'not_ios' };
    }

    if (!backupResult || !backupResult.success) {
      console.warn('[UnifiedStorageManager] 備份未成功，不執行清理');
      return { skipped: true, reason: 'backup_failed' };
    }

    const config = { ...this.progressiveCleanupConfig, ...options };
    const pressure = await this.checkIOSStoragePressure();
    
    console.log('[UnifiedStorageManager] 開始漸進式清理，儲存壓力:', pressure.pressure);

    const results = {
      pressure: pressure.pressure,
      usageBefore: pressure.usage,
      usageAfter: 0,
      cleared: {
        sessions: 0,
        memories: 0,
        messages: 0,
        cache: 0,
        other: 0
      },
      migrated: [],
      errors: []
    };

    if (pressure.pressure === 'critical' || pressure.pressure === 'high') {
      const sessionResult = await this._cleanupOldSessions(config);
      results.cleared.sessions = sessionResult.cleared;
      if (sessionResult.error) results.errors.push(sessionResult.error);
    }

    if (pressure.pressure !== 'none') {
      const memoryResult = await this._cleanupOldMemories(config);
      results.cleared.memories = memoryResult.cleared;
      if (memoryResult.error) results.errors.push(memoryResult.error);
    }

    if (pressure.pressure === 'critical') {
      const messageResult = await this._cleanupOldMessages(config);
      results.cleared.messages = messageResult.cleared;
      if (messageResult.error) results.errors.push(messageResult.error);
    }

    const cacheResult = await this._cleanupOldCache(config);
    results.cleared.cache = cacheResult.cleared;
    if (cacheResult.error) results.errors.push(cacheResult.error);

    if (pressure.pressure === 'critical') {
      const otherResult = await this._cleanupOtherData(config);
      results.cleared.other = otherResult.cleared;
      if (otherResult.error) results.errors.push(otherResult.error);
    }

    const afterPressure = await this.checkIOSStoragePressure();
    results.usageAfter = afterPressure.usage;
    results.spaceReclaimed = results.usageBefore - results.usageAfter;

    localStorage.setItem('sx_last_progressive_cleanup', Date.now().toString());
    localStorage.setItem('sx_cleanup_stats', JSON.stringify({
      lastCleanup: new Date().toISOString(),
      spaceReclaimed: results.spaceReclaimed,
      pressure: pressure.pressure
    }));

    console.log('[UnifiedStorageManager] 漸進式清理完成，釋放空間:', 
      this._formatSize(results.spaceReclaimed));

    return results;
  }

  async _cleanupOldSessions(config) {
    const result = { cleared: 0, error: null };
    
    try {
      const sessionsRaw = localStorage.getItem('sx_chat_sessions');
      if (!sessionsRaw) return result;

      const sessions = JSON.parse(sessionsRaw);
      const cutoffTime = Date.now() - config.keepRecentDays * 24 * 60 * 60 * 1000;
      
      const recentSessions = [];
      const oldSessions = [];
      
      sessions.forEach(s => {
        const lastActive = new Date(s.lastActive || s.createdAt).getTime();
        if (lastActive > cutoffTime || recentSessions.length < config.keepRecentSessions) {
          recentSessions.push(s);
        } else {
          oldSessions.push(s);
        }
      });

      if (oldSessions.length > 0) {
        if (typeof localforage !== 'undefined') {
          await localforage.setItem('sx_archived_sessions', oldSessions);
          console.log('[UnifiedStorageManager] 已歸檔', oldSessions.length, '個舊對話到 IndexedDB');
        }
        
        localStorage.setItem('sx_chat_sessions', JSON.stringify(recentSessions));
        result.cleared = oldSessions.length;
      }
    } catch (e) {
      result.error = `清理對話失敗: ${e.message}`;
      console.error('[UnifiedStorageManager]', result.error);
    }

    return result;
  }

  async _cleanupOldMemories(config) {
    const result = { cleared: 0, error: null };
    
    try {
      const memoryRaw = localStorage.getItem('sx_short_term_memory');
      if (!memoryRaw) return result;

      const memories = JSON.parse(memoryRaw);
      const cutoffTime = Date.now() - config.keepRecentDays * 24 * 60 * 60 * 1000;
      
      const recentMemories = [];
      const oldMemories = [];
      
      memories.forEach(m => {
        const createdAt = new Date(m.createdAt || Date.now()).getTime();
        if (createdAt > cutoffTime || recentMemories.length < config.keepRecentMemories) {
          recentMemories.push(m);
        } else {
          oldMemories.push(m);
        }
      });

      if (oldMemories.length > 0) {
        if (typeof localforage !== 'undefined') {
          const archived = (await localforage.getItem('sx_archived_memories')) || [];
          await localforage.setItem('sx_archived_memories', [...archived, ...oldMemories]);
          console.log('[UnifiedStorageManager] 已歸檔', oldMemories.length, '條舊記憶到 IndexedDB');
        }
        
        localStorage.setItem('sx_short_term_memory', JSON.stringify(recentMemories));
        result.cleared = oldMemories.length;
      }
    } catch (e) {
      result.error = `清理記憶失敗: ${e.message}`;
      console.error('[UnifiedStorageManager]', result.error);
    }

    return result;
  }

  async _cleanupOldMessages(config) {
    const result = { cleared: 0, error: null };
    
    try {
      const sessionsRaw = localStorage.getItem('sx_chat_sessions');
      if (!sessionsRaw) return result;

      const sessions = JSON.parse(sessionsRaw);
      let totalCleared = 0;
      
      const cleanedSessions = sessions.map(session => {
        if (!session.messages || session.messages.length <= 50) {
          return session;
        }

        const recentMessages = session.messages.slice(-50);
        const oldMessages = session.messages.slice(0, -50);
        
        if (oldMessages.length > 0 && typeof localforage !== 'undefined') {
          localforage.setItem(`sx_archived_messages_${session.id}`, oldMessages).catch(() => {});
          totalCleared += oldMessages.length;
        }

        return { ...session, messages: recentMessages };
      });

      if (totalCleared > 0) {
        localStorage.setItem('sx_chat_sessions', JSON.stringify(cleanedSessions));
        result.cleared = totalCleared;
        console.log('[UnifiedStorageManager] 已歸檔', totalCleared, '條舊訊息');
      }
    } catch (e) {
      result.error = `清理訊息失敗: ${e.message}`;
      console.error('[UnifiedStorageManager]', result.error);
    }

    return result;
  }

  async _cleanupOldCache(config) {
    const result = { cleared: 0, error: null };
    
    try {
      const cacheNames = await caches.keys();
      let clearedCount = 0;

      for (const name of cacheNames) {
        if (name.includes('old') || name.includes('backup') || name.includes('temp')) {
          await caches.delete(name);
          clearedCount++;
        }
      }

      if (clearedCount > 0) {
        result.cleared = clearedCount;
        console.log('[UnifiedStorageManager] 已清理', clearedCount, '個舊快取');
      }
    } catch (e) {
      result.error = `清理快取失敗: ${e.message}`;
      console.error('[UnifiedStorageManager]', result.error);
    }

    return result;
  }

  async _cleanupOtherData(config) {
    const result = { cleared: 0, error: null };
    
    try {
      const keysToRemove = [];
      const cutoffTime = Date.now() - config.keepRecentDays * 24 * 60 * 60 * 1000;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        
        if (key.includes('_temp') || key.includes('_cache') || key.includes('_old')) {
          keysToRemove.push(key);
          continue;
        }

        if (key.startsWith('sx_') && !key.includes('session') && !key.includes('memory')) {
          const value = localStorage.getItem(key);
          if (value && value.length > 100 * 1024) {
            try {
              const parsed = JSON.parse(value);
              if (Array.isArray(parsed) && parsed.length > 100) {
                const recent = parsed.slice(-50);
                localStorage.setItem(key, JSON.stringify(recent));
                result.cleared += parsed.length - 50;
              }
            } catch {}
          }
        }
      }

      for (const key of keysToRemove) {
        localStorage.removeItem(key);
        result.cleared++;
      }

      if (result.cleared > 0) {
        console.log('[UnifiedStorageManager] 已清理其他資料:', result.cleared);
      }
    } catch (e) {
      result.error = `清理其他資料失敗: ${e.message}`;
      console.error('[UnifiedStorageManager]', result.error);
    }

    return result;
  }

  async autoProgressiveCleanup() {
    const lastCleanup = localStorage.getItem('sx_last_progressive_cleanup');
    const now = Date.now();
    const config = this.progressiveCleanupConfig;

    if (lastCleanup && (now - parseInt(lastCleanup)) < config.cleanupInterval) {
      return { skipped: true, reason: 'too_recent' };
    }

    const pressure = await this.checkIOSStoragePressure();
    if (pressure.pressure === 'none') {
      return { skipped: true, reason: 'no_pressure' };
    }

    const lastBackup = localStorage.getItem('sx_github_last_sync') || 
                       localStorage.getItem('sx_supabase_last_sync');
    
    if (!lastBackup) {
      console.warn('[UnifiedStorageManager] 沒有備份記錄，不執行自動清理');
      return { skipped: true, reason: 'no_backup' };
    }

    const lastBackupTime = new Date(lastBackup).getTime();
    if (now - lastBackupTime > config.minBackupAge) {
      console.log('[UnifiedStorageManager] 執行自動漸進式清理');
      return await this.progressiveCleanupAfterBackup(
        { success: true, source: 'auto' },
        { force: true }
      );
    }

    return { skipped: true, reason: 'backup_too_recent' };
  }

  getCleanupStats() {
    const statsRaw = localStorage.getItem('sx_cleanup_stats');
    if (!statsRaw) return null;
    
    try {
      return JSON.parse(statsRaw);
    } catch {
      return null;
    }
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
        console.warn('[UnifiedStorageManager] 無法獲取儲存估計:', e);
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
      console.warn('[UnifiedStorageManager] 無法計算 IndexedDB 大小:', e);
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
      console.warn('[UnifiedStorageManager] 無法計算 Cache 大小:', e);
      return { size: 0, count: 0 };
    }
  }

  _estimateObjectSize(obj) {
    const str = JSON.stringify(obj);
    return str.length * 2;
  }

  _formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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

  async collectAllStorageData() {
    const data = {
      localStorage: {},
      localforage: {}
    };

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (!(key.startsWith('sx_') || key.startsWith('api_') || key.startsWith('sxiphone'))) continue;
      try {
        const value = localStorage.getItem(key);
        if (value === null) continue;
        data.localStorage[key] = value;
      } catch (e) {
        console.warn('[UnifiedStorageManager] 無法讀取 localStorage:', key);
      }
    }

    if (typeof localforage !== 'undefined') {
      try {
        await localforage.iterate((value, key) => {
          if (key.startsWith('sx_') || key.startsWith('api_') || key.startsWith('sxiphone')) {
            data.localforage[key] = value;
          }
        });
      } catch (e) {
        console.warn('[UnifiedStorageManager] 無法讀取 localforage:', e);
      }
    }

    return data;
  }

  async backupToGitHub(options = {}) {
    const token = options.token || localStorage.getItem('sx_github_token') || localStorage.getItem('sx_github_pat');
    const repoName = options.repoName || localStorage.getItem('sx_github_repo_name') || localStorage.getItem('sx_github_repo') || 'sxiphone-backup';
    const basePath = options.filePath || localStorage.getItem('sx_github_backup_file') || 'backup/sxiphone';
    const statusCallback = options.onStatus || (() => {});
    
    if (!token) {
      throw new Error('請先設定 GitHub Token');
    }

    this.backupStatus.lastError = null;
    statusCallback('正在連接 GitHub...');

    try {
      const userResp = await fetch('https://api.github.com/user', {
        headers: { Authorization: `token ${token}` }
      });
      
      if (!userResp.ok) {
        throw new Error('無法取得使用者資訊');
      }
      
      const userData = await userResp.json();
      const owner = userData.login;

      statusCallback('正在檢查儲存庫...');
      await this._ensureRepoExists(owner, repoName, token);

      statusCallback('正在收集資料...');
      const allData = await this.collectAllStorageData();
      const payload = {
        version: '3.0',
        exportedAt: new Date().toISOString(),
        device: navigator.userAgent,
        data: allData
      };

      const jsonStr = JSON.stringify(payload);
      const contentBase64 = this._encodeBase64(jsonStr);

      if (contentBase64.length > this.maxPartSize) {
        statusCallback('資料較大，正在分割上傳...');
        return await this._splitUpload(owner, repoName, basePath, payload, token, statusCallback);
      } else {
        statusCallback('正在上傳備份...');
        return await this._singleUpload(owner, repoName, `${basePath}.json`, payload, token);
      }
    } catch (e) {
      this.backupStatus.lastError = e.message;
      console.error('[UnifiedStorageManager] GitHub 備份錯誤:', e);
      throw e;
    }
  }

  async _ensureRepoExists(owner, repoName, token) {
    const repoResp = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, {
      headers: { Authorization: `token ${token}` }
    });
    
    if (repoResp.status === 404) {
      const createResp = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: repoName, 
          private: true,
          description: 'SxiPhone 備份儲存庫'
        })
      });
      if (!createResp.ok) {
        throw new Error('無法建立儲存庫');
      }
    }
  }

  async _singleUpload(owner, repoName, filePath, payload, token) {
    const jsonStr = JSON.stringify(payload, null, 2);
    const contentBase64 = this._encodeBase64(jsonStr);

    let sha = null;
    try {
      const existing = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}`, {
        headers: { Authorization: `token ${token}` }
      });
      if (existing.ok) {
        const existingData = await existing.json();
        sha = existingData.sha;
      }
    } catch {}

    const uploadResp = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}`, {
      method: 'PUT',
      headers: { 
        Authorization: `token ${token}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        message: `SxiPhone 備份 ${new Date().toLocaleString()}`,
        content: contentBase64,
        sha
      })
    });

    if (!uploadResp.ok) {
      const errData = await uploadResp.json().catch(() => ({}));
      throw new Error(errData.message || `上傳失敗 (${uploadResp.status})`);
    }

    this.backupStatus.lastSuccess = new Date().toISOString();
    this.backupStatus.isLargeBackup = false;
    this.backupStatus.partCount = 1;
    localStorage.setItem('sx_github_last_sync', new Date().toLocaleString());

    const result = { success: true, isSplit: false, partCount: 1 };
    
    this.progressiveCleanupAfterBackup(result).catch(e => {
      console.warn('[UnifiedStorageManager] 漸進式清理失敗:', e);
    });

    return result;
  }

  async _splitUpload(owner, repoName, basePath, payload, token, statusCallback) {
    const jsonStr = JSON.stringify(payload);
    const contentBase64 = this._encodeBase64(jsonStr);
    
    const partSize = this.maxPartSize;
    const totalParts = Math.ceil(contentBase64.length / partSize);
    
    this.backupStatus.isLargeBackup = true;
    this.backupStatus.partCount = totalParts;

    const manifest = {
      version: '3.0',
      exportedAt: new Date().toISOString(),
      totalParts,
      originalSize: jsonStr.length,
      checksum: await this._computeChecksum(jsonStr)
    };

    for (let i = 0; i < totalParts; i++) {
      const start = i * partSize;
      const end = Math.min(start + partSize, contentBase64.length);
      const partContent = contentBase64.substring(start, end);
      const partNum = i + 1;
      const filePath = `${basePath}/part${partNum}.json`;

      statusCallback(`正在上傳分割 ${partNum}/${totalParts}...`);

      let sha = null;
      try {
        const existing = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}`, {
          headers: { Authorization: `token ${token}` }
        });
        if (existing.ok) {
          const existingData = await existing.json();
          sha = existingData.sha;
        }
      } catch {}

      const uploadResp = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}`, {
        method: 'PUT',
        headers: { 
          Authorization: `token ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          message: `SxiPhone 備份分割 ${partNum}/${totalParts} - ${new Date().toLocaleString()}`,
          content: partContent,
          sha
        })
      });

      if (!uploadResp.ok) {
        const errData = await uploadResp.json().catch(() => ({}));
        throw new Error(`分割 ${partNum} 上傳失敗: ${errData.message || uploadResp.status}`);
      }
    }

    statusCallback('正在上傳清單檔案...');
    const manifestPath = `${basePath}/manifest.json`;
    let manifestSha = null;
    try {
      const existingManifest = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${manifestPath}`, {
        headers: { Authorization: `token ${token}` }
      });
      if (existingManifest.ok) {
        const existingData = await existingManifest.json();
        manifestSha = existingData.sha;
      }
    } catch {}

    const manifestResp = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${manifestPath}`, {
      method: 'PUT',
      headers: { 
        Authorization: `token ${token}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        message: `SxiPhone 備份清單 - ${new Date().toLocaleString()}`,
        content: this._encodeBase64(JSON.stringify(manifest, null, 2)),
        sha: manifestSha
      })
    });

    if (!manifestResp.ok) {
      throw new Error('無法上傳清單檔案');
    }

    this.backupStatus.lastSuccess = new Date().toISOString();
    localStorage.setItem('sx_github_last_sync', new Date().toLocaleString());

    const result = { success: true, isSplit: true, partCount: totalParts };
    
    this.progressiveCleanupAfterBackup(result).catch(e => {
      console.warn('[UnifiedStorageManager] 漸進式清理失敗:', e);
    });

    return result;
  }

  async restoreFromGitHub(options = {}) {
    const token = options.token || localStorage.getItem('sx_github_token') || localStorage.getItem('sx_github_pat');
    const repoName = options.repoName || localStorage.getItem('sx_github_repo_name') || localStorage.getItem('sx_github_repo') || 'sxiphone-backup';
    const basePath = options.filePath || localStorage.getItem('sx_github_backup_file') || 'backup/sxiphone';
    const statusCallback = options.onStatus || (() => {});
    const onProgress = options.onProgress || (() => {});

    if (!token) {
      throw new Error('請先設定 GitHub Token');
    }

    statusCallback('正在連接 GitHub...');

    try {
      const userResp = await fetch('https://api.github.com/user', {
        headers: { Authorization: `token ${token}` }
      });
      
      if (!userResp.ok) {
        throw new Error('無法取得使用者資訊');
      }
      
      const userData = await userResp.json();
      const owner = userData.login;

      statusCallback('正在檢查備份清單...');
      const manifest = await this._fetchManifest(owner, repoName, basePath, token);

      if (manifest && manifest.totalParts) {
        statusCallback(`發現分割備份 (${manifest.totalParts} 部分)，正在下載...`);
        return await this._splitDownload(owner, repoName, basePath, manifest, token, statusCallback, onProgress);
      } else {
        statusCallback('正在下載備份...');
        return await this._singleDownload(owner, repoName, `${basePath}.json`, token);
      }
    } catch (e) {
      console.error('[UnifiedStorageManager] GitHub 還原錯誤:', e);
      throw e;
    }
  }

  async _fetchManifest(owner, repoName, basePath, token) {
    try {
      const manifestResp = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${basePath}/manifest.json`, {
        headers: { Authorization: `token ${token}`, 'Accept': 'application/vnd.github.v3+json' }
      });

      if (manifestResp.ok) {
        const data = await manifestResp.json();
        const content = this._decodeBase64(data.content);
        return JSON.parse(content);
      }
    } catch (e) {
      console.log('[UnifiedStorageManager] 無清單檔案，嘗試單一檔案還原');
    }
    return null;
  }

  async _splitDownload(owner, repoName, basePath, manifest, token, statusCallback, onProgress) {
    const { totalParts, checksum } = manifest;
    const parts = [];

    for (let i = 1; i <= totalParts; i++) {
      statusCallback(`正在下載分割 ${i}/${totalParts}...`);
      onProgress(i, totalParts);

      const partResp = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${basePath}/part${i}.json`, {
        headers: { Authorization: `token ${token}`, 'Accept': 'application/vnd.github.v3+json' }
      });

      if (!partResp.ok) {
        throw new Error(`無法下載分割 ${i}`);
      }

      const partData = await partResp.json();
      parts.push(partData.content);
    }

    statusCallback('正在合併資料...');
    const combinedBase64 = parts.join('');
    const jsonStr = this._decodeBase64(combinedBase64);

    if (checksum) {
      const computedChecksum = await this._computeChecksum(jsonStr);
      if (computedChecksum !== checksum) {
        console.warn('[UnifiedStorageManager] 校驗碼不符，但繼續還原');
      }
    }

    const payload = JSON.parse(jsonStr);
    await this._restoreData(payload);

    return { success: true, restoredFrom: 'split', partCount: totalParts };
  }

  async _singleDownload(owner, repoName, filePath, token) {
    const fileResp = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}`, {
      headers: { Authorization: `token ${token}`, 'Accept': 'application/vnd.github.v3+json' }
    });

    if (!fileResp.ok) {
      if (fileResp.status === 404) {
        throw new Error('找不到備份檔案');
      }
      throw new Error(`下載失敗 (${fileResp.status})`);
    }

    const fileData = await fileResp.json();
    const content = this._decodeBase64(fileData.content);
    const payload = JSON.parse(content);

    await this._restoreData(payload);

    return { success: true, restoredFrom: 'single' };
  }

  async _restoreData(payload) {
    const data = payload.data || payload;
    let count = 0;

    if (data.localStorage) {
      for (const [key, value] of Object.entries(data.localStorage)) {
        try {
          localStorage.setItem(key, value);
          count++;
        } catch (e) {
          console.warn('[UnifiedStorageManager] 無法還原 localStorage:', key);
        }
      }
    }

    if (data.localforage && typeof localforage !== 'undefined') {
      for (const [key, value] of Object.entries(data.localforage)) {
        try {
          await localforage.setItem(key, value);
          count++;
        } catch (e) {
          console.warn('[UnifiedStorageManager] 無法還原 localforage:', key);
        }
      }
    }

    window.dispatchEvent(new CustomEvent('sxiphone-data-restored', { 
      detail: { count, source: 'github-pull' } 
    }));

    window.parent?.postMessage({
      type: 'DATA_RESTORED',
      count
    }, '*');

    console.log(`[UnifiedStorageManager] 已還原 ${count} 筆資料`);
    
    return count;
  }

  _encodeBase64(str) {
    try {
      return btoa(unescape(encodeURIComponent(str)));
    } catch (e) {
      return btoa(str);
    }
  }

  _decodeBase64(base64) {
    try {
      return decodeURIComponent(escape(atob(base64)));
    } catch (e) {
      return atob(base64);
    }
  }

  async _computeChecksum(str) {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (e) {
        console.warn('[UnifiedStorageManager] 無法計算校驗碼:', e);
      }
    }
    return null;
  }

  getBackupStatus() {
    return { ...this.backupStatus };
  }

  getSyncStatus() {
    return {
      lastSync: localStorage.getItem('sx_github_last_sync'),
      user: localStorage.getItem('sx_github_user'),
      repo: localStorage.getItem('sx_github_repo_name'),
      lastError: this.backupStatus.lastError
    };
  }

  async cleanup(options = {}) {
    const results = {
      localStorageCleared: 0,
      cacheCleared: false,
      migratedKeys: []
    };

    if (options.clearOldChatCache) {
      const sessionsRaw = localStorage.getItem('sx_chat_sessions');
      if (sessionsRaw) {
        try {
          const sessions = JSON.parse(sessionsRaw);
          const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
          const filtered = sessions.filter(s => {
            const lastActive = new Date(s.lastActive || s.createdAt).getTime();
            return lastActive > thirtyDaysAgo;
          });
          if (filtered.length < sessions.length) {
            localStorage.setItem('sx_chat_sessions', JSON.stringify(filtered));
            results.localStorageCleared = sessions.length - filtered.length;
          }
        } catch (e) {
          console.warn('[UnifiedStorageManager] 清理聊天快取失敗:', e);
        }
      }
    }

    if (options.clearCache) {
      results.cacheCleared = await this.clearServiceWorkerCache();
    }

    if (options.migrateToIndexedDB && this.memoryStore) {
      const keysToMigrate = ['sx_chat_sessions', 'sx_characters', 'sx_masks', 'sx_users'];
      for (const key of keysToMigrate) {
        const result = await this.migrateLocalStorageToIndexedDB(key);
        if (result.migrated) {
          results.migratedKeys.push(key);
        }
      }
    }

    return results;
  }

  async migrateLocalStorageToIndexedDB(key) {
    if (!this.memoryStore || !this.memoryStore.db) {
      return { migrated: false, reason: 'MemoryStore 未初始化' };
    }

    const value = localStorage.getItem(key);
    if (!value) {
      return { migrated: false, reason: 'key_not_found' };
    }

    try {
      await this.memoryStore.setMetadata(key, JSON.parse(value));
      localStorage.removeItem(key);
      console.log(`[UnifiedStorageManager] 已遷移 ${key} 到 IndexedDB`);
      return { migrated: true, key };
    } catch (e) {
      console.error(`[UnifiedStorageManager] 遷移 ${key} 失敗:`, e);
      return { migrated: false, reason: e.message };
    }
  }

  async clearServiceWorkerCache() {
    try {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        await caches.delete(name);
      }
      console.log('[UnifiedStorageManager] Service Worker Cache 已清除');
      return true;
    } catch (e) {
      console.error('[UnifiedStorageManager] 清除 Cache 失敗:', e);
      return false;
    }
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

  async syncShortTermMemory(direction = 'push') {
    if (typeof localforage === 'undefined') {
      console.warn('[UnifiedStorageManager] localforage 未載入');
      return { success: false, reason: 'localforage_unavailable' };
    }

    const storageKey = 'sx_short_term_memory';
    
    try {
      if (direction === 'push') {
        const localData = localStorage.getItem(storageKey);
        if (!localData) {
          return { success: true, reason: 'no_local_data' };
        }
        
        await localforage.setItem(storageKey, JSON.parse(localData));
        console.log('[UnifiedStorageManager] 短期記憶已同步到 IndexedDB');
        return { success: true, direction: 'push' };
      } else {
        const idbData = await localforage.getItem(storageKey);
        if (!idbData) {
          return { success: true, reason: 'no_idb_data' };
        }
        
        const localData = localStorage.getItem(storageKey);
        let mergedData;
        
        if (localData) {
          const localMemories = JSON.parse(localData);
          const idbMemories = typeof idbData === 'string' ? JSON.parse(idbData) : idbData;
          
          const localIds = new Set(localMemories.map(m => m.id));
          const newFromIdb = idbMemories.filter(m => !localIds.has(m.id));
          mergedData = [...localMemories, ...newFromIdb];
          
          mergedData.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          
          if (mergedData.length > 100) {
            mergedData = mergedData.slice(-100);
          }
        } else {
          mergedData = typeof idbData === 'string' ? JSON.parse(idbData) : idbData;
        }
        
        localStorage.setItem(storageKey, JSON.stringify(mergedData));
        console.log('[UnifiedStorageManager] 短期記憶已從 IndexedDB 同步');
        return { success: true, direction: 'pull', count: mergedData.length };
      }
    } catch (e) {
      console.error('[UnifiedStorageManager] 短期記憶同步失敗:', e);
      return { success: false, reason: e.message };
    }
  }

  async syncAllMemories(direction = 'push') {
    const results = {
      shortTerm: null,
      longTerm: null
    };

    results.shortTerm = await this.syncShortTermMemory(direction);

    if (direction === 'pull' && this.memoryStore) {
      try {
        const memories = await this.memoryStore.getAll();
        console.log('[UnifiedStorageManager] 長期記憶已載入:', memories.length);
        results.longTerm = { success: true, count: memories.length };
      } catch (e) {
        results.longTerm = { success: false, reason: e.message };
      }
    }

    return results;
  }

  async autoSync() {
    const lastSync = localStorage.getItem('sx_last_memory_sync');
    const now = Date.now();
    const syncInterval = 5 * 60 * 1000;

    if (lastSync && (now - parseInt(lastSync)) < syncInterval) {
      return { skipped: true, reason: 'too_recent' };
    }

    const results = await this.syncAllMemories('push');
    localStorage.setItem('sx_last_memory_sync', now.toString());
    
    return results;
  }

  async syncMemoriesToSupabase(options = {}) {
    const url = options.url || localStorage.getItem('sx_supabase_url');
    const key = options.key || localStorage.getItem('sx_supabase_key');
    const table = options.table || localStorage.getItem('sx_supabase_table') || 'sxiphone_memories';
    const statusCallback = options.onStatus || (() => {});

    if (!url || !key) {
      throw new Error('請先設定 Supabase URL 和 Key');
    }

    statusCallback('正在收集記憶...');

    try {
      const memories = [];

      const shortTermMemory = localStorage.getItem('sx_short_term_memory');
      if (shortTermMemory) {
        const parsed = JSON.parse(shortTermMemory);
        if (Array.isArray(parsed)) {
          memories.push(...parsed);
        }
      }

      if (typeof localforage !== 'undefined') {
        const longTermMemories = [];
        await localforage.iterate((value, key) => {
          if (key.startsWith('sx_memory_') || key.startsWith('sx_long_term_memory')) {
            longTermMemories.push({ key, value });
          }
        });
        if (longTermMemories.length > 0) {
          memories.push({ type: 'long_term', items: longTermMemories });
        }
      }

      if (memories.length === 0) {
        statusCallback('沒有記憶可同步');
        return { success: true, reason: 'no_memories', count: 0 };
      }

      statusCallback('正在推送記憶到 Supabase...');

      const payload = {
        id: `memory_${Date.now()}`,
        type: 'memory_sync',
        user_id: localStorage.getItem('sx_user_name') || 'default',
        device: navigator.userAgent,
        memories: memories,
        exported_at: new Date().toISOString()
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
        if (resp.status === 404) {
          throw new Error('資料表不存在，請先在 Supabase 建立 sxiphone_memories 資料表');
        }
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.message || `推送失敗 (${resp.status})`);
      }

      localStorage.setItem('sx_supabase_memory_last_sync', new Date().toLocaleString());
      statusCallback(`已推送 ${memories.length} 條記憶`);

      return { success: true, count: memories.length };
    } catch (e) {
      console.error('[UnifiedStorageManager] Supabase 記憶同步錯誤:', e);
      throw e;
    }
  }

  async pullMemoriesFromSupabase(options = {}) {
    const url = options.url || localStorage.getItem('sx_supabase_url');
    const key = options.key || localStorage.getItem('sx_supabase_key');
    const table = options.table || localStorage.getItem('sx_supabase_table') || 'sxiphone_memories';
    const statusCallback = options.onStatus || (() => {});

    if (!url || !key) {
      throw new Error('請先設定 Supabase URL 和 Key');
    }

    statusCallback('正在從 Supabase 拉取記憶...');

    try {
      const resp = await fetch(`${url}/rest/v1/${table}?select=*&order=exported_at.desc&limit=1&type=eq.memory_sync`, {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`
        }
      });

      if (!resp.ok) {
        throw new Error(`拉取失敗 (${resp.status})`);
      }

      const records = await resp.json();
      if (!records || records.length === 0) {
        statusCallback('找不到記憶資料');
        return { success: true, reason: 'no_records', count: 0 };
      }

      const latestRecord = records[0];
      const memories = latestRecord.memories;
      if (!memories) {
        throw new Error('記憶格式不正確');
      }

      statusCallback('正在合併記憶...');

      let mergedCount = 0;

      const shortTermMemories = memories.filter(m => !m.type || m.type !== 'long_term');
      if (shortTermMemories.length > 0) {
        const existing = localStorage.getItem('sx_short_term_memory');
        let existingMemories = [];
        if (existing) {
          try {
            existingMemories = JSON.parse(existing);
          } catch {}
        }

        const existingIds = new Set(existingMemories.map(m => m.id));
        const newMemories = shortTermMemories.filter(m => !existingIds.has(m.id));
        const merged = [...existingMemories, ...newMemories];
        merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        
        localStorage.setItem('sx_short_term_memory', JSON.stringify(merged.slice(-100)));
        mergedCount += newMemories.length;
      }

      const longTermData = memories.find(m => m.type === 'long_term');
      if (longTermData && longTermData.items && typeof localforage !== 'undefined') {
        for (const item of longTermData.items) {
          await localforage.setItem(item.key, item.value);
          mergedCount++;
        }
      }

      localStorage.setItem('sx_supabase_memory_last_sync', new Date().toLocaleString());
      statusCallback(`已拉取並合併 ${mergedCount} 條記憶`);

      window.dispatchEvent(new CustomEvent('sxiphone-data-restored', {
        detail: { count: mergedCount, source: 'supabase-memory-pull' }
      }));

      return { success: true, count: mergedCount };
    } catch (e) {
      console.error('[UnifiedStorageManager] Supabase 記憶拉取錯誤:', e);
      throw e;
    }
  }

  getStats() {
    return {
      warningThreshold: this.warningThreshold,
      criticalThreshold: this.criticalThreshold,
      maxPartSize: this.maxPartSize,
      backupStatus: this.getBackupStatus()
    };
  }
}

if (typeof window !== 'undefined') {
  window.UnifiedStorageManager = UnifiedStorageManager;
}
