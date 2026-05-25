class UnifiedStorageManager {
  constructor(options = {}) {
    this.sxStorage = options.sxStorage || (typeof sxStorage !== 'undefined' ? sxStorage : null);
    this.warningThreshold = options.warningThreshold || 0.7;
    this.criticalThreshold = options.criticalThreshold || 0.9;
    this.maxPartSize = options.maxPartSize || 800 * 1024;
    this.backupStatus = {
      lastSuccess: null,
      lastError: null,
      isLargeBackup: false,
      partCount: 0
    };
    
    this.pipelineConfig = {
      enabled: true,
      supabaseBackupInterval: 10 * 60 * 1000,
      nightlyBackupHour: 3
    };
    
    this._cloudCache = new Map();
    this._verifiedBackups = new Set();
    this._autoCleanupRunning = false;
    this._supabaseBackupTimer = null;
    this._nightlyBackupTimer = null;
    
    this._startPipeline();
  }

  async _ensureStorage() {
    if (this.sxStorage) {
      await this.sxStorage.init();
      return true;
    }
    if (typeof sxStorage !== 'undefined') {
      this.sxStorage = sxStorage;
      await this.sxStorage.init();
      return true;
    }
    console.warn('[UnifiedStorageManager] sxStorage 未初始化');
    return false;
  }

  async setItem(key, value) {
    await this._ensureStorage();
    return this.sxStorage.setItem(key, value);
  }

  async getItem(key) {
    await this._ensureStorage();
    return this.sxStorage.getItem(key);
  }

  async getJSON(key) {
    await this._ensureStorage();
    return this.sxStorage.getJSON(key);
  }

  async setJSON(key, value) {
    await this._ensureStorage();
    return this.sxStorage.setJSON(key, value);
  }

  async removeItem(key) {
    await this._ensureStorage();
    return this.sxStorage.removeItem(key);
  }

  async getAllKeys() {
    await this._ensureStorage();
    return this.sxStorage.getAllKeys();
  }

  async saveChatSession(session) {
    await this._ensureStorage();
    return this.sxStorage.saveChatSession(session);
  }

  async getChatSession(id) {
    await this._ensureStorage();
    return this.sxStorage.getChatSession(id);
  }

  async getAllChatSessions() {
    await this._ensureStorage();
    return this.sxStorage.getAllChatSessions();
  }

  async deleteChatSession(id) {
    await this._ensureStorage();
    return this.sxStorage.deleteChatSession(id);
  }

  async saveCharacter(character) {
    await this._ensureStorage();
    return this.sxStorage.saveCharacter(character);
  }

  async getCharacter(id) {
    await this._ensureStorage();
    return this.sxStorage.getCharacter(id);
  }

  async getAllCharacters() {
    await this._ensureStorage();
    return this.sxStorage.getAllCharacters();
  }

  async deleteCharacter(id) {
    await this._ensureStorage();
    return this.sxStorage.deleteCharacter(id);
  }

  async saveMemory(memory) {
    await this._ensureStorage();
    return this.sxStorage.saveMemory(memory);
  }

  async getMemory(id) {
    await this._ensureStorage();
    return this.sxStorage.getMemory(id);
  }

  async getAllMemories(options = {}) {
    await this._ensureStorage();
    return this.sxStorage.getAllMemories(options);
  }

  async deleteMemory(id) {
    await this._ensureStorage();
    return this.sxStorage.deleteMemory(id);
  }

  async saveSetting(key, value) {
    await this._ensureStorage();
    return this.sxStorage.saveSetting(key, value);
  }

  async getSetting(key) {
    await this._ensureStorage();
    return this.sxStorage.getSetting(key);
  }

  async getAllSettings() {
    await this._ensureStorage();
    return this.sxStorage.getAllSettings();
  }

  _startPipeline() {
    if (typeof window === 'undefined') return;
    
    console.log('[UnifiedStorageManager] 啟動資料管線');
    
    this._supabaseBackupTimer = setInterval(() => {
      this._autoSupabaseBackup();
    }, this.pipelineConfig.supabaseBackupInterval);
    
    this._checkNightlyBackup();
    setInterval(() => {
      this._checkNightlyBackup();
    }, 60 * 60 * 1000);
  }

  async _autoSupabaseBackup() {
    const autoEnabled = await this.getSetting('sx_supabase_auto_backup');
    if (autoEnabled !== 'true') return;

    const lastBackup = await this.getSetting('sx_supabase_last_auto_backup');
    const now = Date.now();
    
    if (lastBackup && (now - parseInt(lastBackup)) < 5 * 60 * 1000) return;

    console.log('[UnifiedStorageManager] 執行定時 Supabase 備份');

    try {
      const result = await this.backupToSupabase();
      if (result.success) {
        await this.saveSetting('sx_supabase_last_auto_backup', now.toString());
        console.log('[UnifiedStorageManager] Supabase 定時備份成功');
      }
    } catch (e) {
      console.error('[UnifiedStorageManager] Supabase 定時備份失敗:', e);
    }
  }

  _checkNightlyBackup() {
    const now = new Date();
    const currentHour = now.getHours();
    
    if (currentHour === this.pipelineConfig.nightlyBackupHour) {
      const lastNightly = localStorage.getItem('sx_last_nightly_backup');
      const today = now.toDateString();
      
      if (lastNightly !== today) {
        console.log('[UnifiedStorageManager] 執行每晚備份');
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

    const githubToken = await this.getSetting('sx_github_token');
    if (githubToken) {
      try {
        const result = await this.backupToGitHub();
        results.github = result.success ? 'success' : 'failed';
      } catch (e) {
        results.github = 'error';
        results.errors.push(`GitHub: ${e.message}`);
      }
    }

    const supabaseUrl = await this.getSetting('sx_supabase_url');
    const supabaseKey = await this.getSetting('sx_supabase_key');
    if (supabaseUrl && supabaseKey) {
      try {
        const result = await this.backupToSupabase();
        results.supabase = result.success ? 'success' : 'failed';
      } catch (e) {
        results.supabase = 'error';
        results.errors.push(`Supabase: ${e.message}`);
      }
    }

    results.success = results.github === 'success' || results.supabase === 'success';

    if (results.success) {
      this.saveSetting('sx_last_nightly_backup', new Date().toDateString());
      console.log('[UnifiedStorageManager] 每晚備份成功:', results);
    } else {
      console.error('[UnifiedStorageManager] 每晚備份失敗:', results);
    }

    return results;
  }

  async backupToSupabase(options = {}) {
    await this._ensureStorage();
    return this.sxStorage.backupToSupabase(options);
  }

  async restoreFromSupabase(options = {}) {
    await this._ensureStorage();
    return this.sxStorage.restoreFromSupabase(options);
  }

  async getSupabaseBackupList(options = {}) {
    await this._ensureStorage();
    return this.sxStorage.getSupabaseBackupList(options);
  }

  async backupToGitHub(options = {}) {
    await this._ensureStorage();
    
    const token = options.token || localStorage.getItem('sx_github_token') || await this.getSetting('sx_github_token');
    const repoName = options.repoName || localStorage.getItem('sx_github_repo_name') || localStorage.getItem('sx_github_repo') || await this.getSetting('sx_github_repo_name') || 'sxiphone-backup';
    const basePath = options.filePath || localStorage.getItem('sx_github_backup_file') || await this.getSetting('sx_github_backup_file') || 'backup/sxiphone';
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
      const data = await this.sxStorage.exportAllData();
      const payload = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        device: navigator.userAgent,
        data: data
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
    await this.saveSetting('sx_github_last_sync', new Date().toLocaleString());

    return { success: true, isSplit: false, partCount: 1 };
  }

  async _splitUpload(owner, repoName, basePath, payload, token, statusCallback) {
    const jsonStr = JSON.stringify(payload);
    const contentBase64 = this._encodeBase64(jsonStr);
    
    const partSize = this.maxPartSize;
    const totalParts = Math.ceil(contentBase64.length / partSize);
    
    this.backupStatus.isLargeBackup = true;
    this.backupStatus.partCount = totalParts;

    const manifest = {
      version: '1.0',
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
    await this.saveSetting('sx_github_last_sync', new Date().toLocaleString());

    return { success: true, isSplit: true, partCount: totalParts };
  }

  async restoreFromGitHub(options = {}) {
    await this._ensureStorage();
    
    const token = options.token || localStorage.getItem('sx_github_token') || await this.getSetting('sx_github_token');
    const repoName = options.repoName || localStorage.getItem('sx_github_repo_name') || localStorage.getItem('sx_github_repo') || await this.getSetting('sx_github_repo_name') || 'sxiphone-backup';
    const basePath = options.filePath || localStorage.getItem('sx_github_backup_file') || await this.getSetting('sx_github_backup_file') || 'backup/sxiphone';
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
    } catch {}
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
      console.log('[UnifiedStorageManager] part', i, 'encoding:', partData.encoding, 'content preview:', partData.content?.substring(0, 100));
      
      let partContent = partData.content;
      if (partData.encoding === 'base64') {
        partContent = this._decodeBase64(partData.content);
      }
      parts.push(partContent);
    }

    statusCallback('正在合併資料...');
    const combined = parts.join('');
    console.log('[UnifiedStorageManager] combined length:', combined.length, 'first 100 chars:', combined.substring(0, 100));
    
    let jsonStr;
    if (combined.trim().startsWith('{') || combined.trim().startsWith('[')) {
      jsonStr = combined;
    } else {
      jsonStr = this._decodeBase64(combined);
    }

    if (checksum) {
      const computedChecksum = await this._computeChecksum(jsonStr);
      if (computedChecksum !== checksum) {
        console.warn('[UnifiedStorageManager] 校驗碼不符，但繼續還原');
      }
    }

    const payload = JSON.parse(jsonStr);
    await this.sxStorage.importAllData(payload.data);

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

    await this.sxStorage.importAllData(payload.data);

    return { success: true, restoredFrom: 'single' };
  }

  _encodeBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  _decodeBase64(base64) {
    const trimmed = base64.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      console.log('[UnifiedStorageManager] 內容已是 JSON，跳過解碼');
      return base64;
    }
    const cleaned = base64.replace(/\s/g, '');
    try {
      const binary = atob(cleaned);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new TextDecoder('utf-8').decode(bytes);
    } catch (e) {
      console.error('[UnifiedStorageManager] Base64 解碼失敗:', e.message);
      throw new Error('Base64 解碼失敗: ' + e.message);
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
      } catch {}
    }
    return null;
  }

  async exportAllData() {
    await this._ensureStorage();
    return this.sxStorage.exportAllData();
  }

  async importAllData(data) {
    await this._ensureStorage();
    return this.sxStorage.importAllData(data);
  }

  async clearAll() {
    await this._ensureStorage();
    return this.sxStorage.clearAll();
  }

  async cleanup(options = {}) {
    const result = { cacheCleared: false, clearedSize: 0 };
    
    if (options.clearCache) {
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          for (const name of cacheNames) {
            const cache = await caches.open(name);
            const keys = await cache.keys();
            result.clearedSize += keys.length;
            await caches.delete(name);
          }
          result.cacheCleared = true;
        } catch (e) {
          console.error('[UnifiedStorageManager] 清理快取失敗:', e);
        }
      }
    }
    
    return result;
  }

  async migrateFromLocalStorage() {
    await this._ensureStorage();
    return this.sxStorage.migrateFromLocalStorage();
  }

  /**
   * 同步所有記憶資料（localStorage ↔ IndexedDB）
   * @param {'push'|'pull'} direction
   *   - push: localStorage → IndexedDB
   *   - pull: IndexedDB → localStorage（寫入 sxStorage 快取，小型資料也同步 native）
   * @returns {Promise<{shortTerm: {success, count?, reason?}, longTerm: {success, count?, reason?}}>}
   */
  async syncAllMemories(direction = 'push') {
    await this._ensureStorage();

    const MEMORY_KEYS = [
      'sx_short_term_memory',
      'sx_long_term_memory',
      'sx_memory_associations',
      'sx_memory_pool',
      'sx_daily_awakening_state',
      'sx_sleep_scheduler_state',
      'sx_memory_identity',
      'sx_chat_history',
      'sx_chat_sessions',
      'sx_characters',
      'sx_users',
      'sx_npcs',
      'sx_masks',
      'sx_char_name', 'sx_char_avatar', 'sx_char_personality', 'sx_char_background', 'sx_char_examples',
      'sx_user_name', 'sx_user_avatar', 'sx_user_personality', 'sx_user_background',
      'sx_worldbook_cot', 'sx_worldbook_style', 'sx_worldbook_global',
      'sx_worldbook_keywords', 'sx_worldbook_backend', 'sx_worldbook_theater',
      'sx_worldbook_mounts',
      'sx_active_api',
      'api_configs'
    ];

    const result = { shortTerm: { success: false }, longTerm: { success: false } };

    try {
      if (direction === 'push') {
        // localStorage → IndexedDB
        let pushed = 0;
        for (const key of MEMORY_KEYS) {
          try {
            // 使用原生 localStorage 讀取（繞過 mirror 的快取）
            const value = localStorage.getItem(key);
            if (value !== null && value !== undefined) {
              await this.sxStorage.setItem(key, value);
              pushed++;
            }
          } catch (_) {}
        }
        result.shortTerm = { success: true, count: pushed };
        result.longTerm = { success: true, count: pushed };
        console.info(`[UnifiedStorageManager] syncAllMemories push: ${pushed} keys`);

      } else if (direction === 'pull') {
        // IndexedDB → localStorage（透過 mirror 或 native）
        let pulled = 0;
        for (const key of MEMORY_KEYS) {
          try {
            const value = await this.sxStorage.getItem(key);
            if (value !== null && value !== undefined) {
              // 寫入 localStorage（mirror 會同時寫 IndexedDB + native <8KB）
              localStorage.setItem(key, value);
              pulled++;
            }
          } catch (_) {}
        }
        result.shortTerm = { success: true, count: pulled };
        result.longTerm = { success: true, count: pulled };
        console.info(`[UnifiedStorageManager] syncAllMemories pull: ${pulled} keys`);
      }
    } catch (e) {
      const msg = e.message || String(e);
      result.shortTerm = { success: false, reason: msg };
      result.longTerm = { success: false, reason: msg };
      console.error('[UnifiedStorageManager] syncAllMemories 失敗:', e);
    }

    return result;
  }

  async getStorageEstimate() {
    await this._ensureStorage();
    return this.sxStorage.getStorageEstimate();
  }

  async getStats() {
    await this._ensureStorage();
    return this.sxStorage.getStats();
  }

  /**
   * 取得詳細的儲存空間估算（localStorage + IndexedDB）
   * settings.js 的 updateStorageUI() 依賴此方法
   */
  async getDetailedEstimate() {
    await this._ensureStorage();

    // localStorage 大小
    let lsSize = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const val = localStorage.getItem(key);
          if (val) lsSize += (key.length + val.length) * 2; // UTF-16
        }
      }
    } catch (_) {}

    // IndexedDB 大小
    let idbSize = 0;
    try {
      if (navigator.storage?.estimate) {
        const est = await navigator.storage.estimate();
        idbSize = est.usage || 0;
      } else if (this.sxStorage) {
        const est = await this.sxStorage.getStorageEstimate();
        idbSize = est.usage || 0;
      }
    } catch (_) {}

    return {
      localStorage: { size: lsSize, count: localStorage.length },
      indexedDB: { size: idbSize },
      total: { size: lsSize + idbSize }
    };
  }

  /**
   * iOS Safari 儲存警告檢查
   * iOS Safari 的 IndexedDB 有特殊限制：
   * - PWA 模式: 最多可使用裝置可用空間的 50%
   * - 非 PWA: 可能被系統在 7 天未使用後清除
   * @returns {Promise<{isIOS, isSafari?, warning?, usagePercentage, isPWA?}>}
   */
  async checkIOSStorageWarning() {
    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua);

    if (!isIOS) {
      return { isIOS: false, warning: null, usagePercentage: 0 };
    }

    const result = { isIOS: true, isSafari, warning: null, usagePercentage: 0 };

    // 用 StorageManager API 計算使用率
    try {
      if (navigator.storage?.estimate) {
        const est = await navigator.storage.estimate();
        const quota = est.quota || 0;
        const usage = est.usage || 0;
        if (quota > 0) {
          result.usagePercentage = usage / quota;
          if (result.usagePercentage > 0.9) {
            result.warning = 'critical';
          } else if (result.usagePercentage > 0.7) {
            result.warning = 'warning';
          }
        }
      }
    } catch (_) {}

    // 檢查是否以 PWA 模式運行
    const isPWA = window.matchMedia?.('(display-mode: standalone)')?.matches ||
                  window.navigator?.standalone === true;
    result.isPWA = isPWA;

    if (!isPWA) {
      result.warning = result.warning || 'warning';
    }

    return result;
  }

  getBackupStatus() {
    return { ...this.backupStatus };
  }

  async getSyncStatus() {
    return {
      lastGithubBackup: await this.getSetting('sx_github_last_sync'),
      lastSupabaseBackup: await this.getSetting('sx_supabase_last_sync'),
      lastNightlyBackup: await this.getSetting('sx_last_nightly_backup'),
      lastError: this.backupStatus.lastError
    };
  }

  async collectAllStorageData() {
    return this.exportAllData();
  }

  async searchCloudHistory(query, options = {}) {
    const results = {
      chat: [],
      memory: [],
      innerVoice: [],
      generated: [],
      total: 0
    };

    const url = await this.getSetting('sx_supabase_url');
    const key = await this.getSetting('sx_supabase_key');
    
    if (!url || !key) {
      console.warn('[UnifiedStorageManager] Supabase 未設定，無法搜尋雲端');
      return results;
    }

    const table = await this.getSetting('sx_supabase_table') || 'sxiphone_backups';
    const maxResults = options.maxResults || 50;
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

        if (backup.data.keyValue) {
          const chatSessions = backup.data.keyValue['sx_chat_sessions'];
          if (chatSessions) {
            try {
              const sessions = typeof chatSessions === 'string' ? JSON.parse(chatSessions) : chatSessions;
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
        }

        if (backup.data.memories) {
          const relevantMemories = backup.data.memories.filter(m => 
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

    const url = await this.getSetting('sx_supabase_url');
    const key = await this.getSetting('sx_supabase_key');
    
    if (!url || !key) {
      return context;
    }

    const table = await this.getSetting('sx_supabase_table') || 'sxiphone_backups';
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

        if (backup.data.chatSessions && charName) {
          const charSessions = backup.data.chatSessions.filter(s => 
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
        }

        if (backup.data.memories && charName) {
          const relevantMems = backup.data.memories.filter(m => 
            m.charName && m.charName.toLowerCase() === charName.toLowerCase()
          ).slice(-10);
          
          if (relevantMems.length > 0) {
            context.relevantMemories.push(...relevantMems);
          }
        }

        if (backup.data.characters && charName) {
          const char = backup.data.characters.find(c => 
            c.name && c.name.toLowerCase() === charName.toLowerCase()
          );
          if (char && !context.characterInfo) {
            context.characterInfo = char;
          }
        }
      }

      context.retrieved = context.recentChats.length > 0 || 
                          context.relevantMemories.length > 0 || 
                          context.innerVoices.length > 0;
      
      if (context.retrieved) {
        console.log(`[UnifiedStorageManager] 為 ${charName} 檢索到: ${context.recentChats.length} 個對話, ${context.relevantMemories.length} 條記憶`);
      }
      
    } catch (e) {
      console.error('[UnifiedStorageManager] AI 上下文檢索失敗:', e);
    }

    return context;
  }
}

if (typeof window !== 'undefined') {
  window.UnifiedStorageManager = UnifiedStorageManager;
}
