(function(global) {
    'use strict';

    function _loadScriptSync(src) {
        if (document.querySelector(`script[src="${src}"]`)) return;
        const s = document.createElement('script');
        s.src = src;
        s.async = false;
        (document.head || document.documentElement).appendChild(s);
    }

    function _resolveScriptBasePath() {
        try {
            const scripts = document.querySelectorAll('script[src*="shared-settings"]');
            if (scripts.length > 0) {
                const src = scripts[0].getAttribute('src');
                const idx = src.lastIndexOf('/');
                return idx >= 0 ? src.slice(0, idx + 1) : '';
            }
            return '../scripts/';
        } catch (_) {
            return '../scripts/';
        }
    }

    (function _ensureDeps() {
        const basePath = _resolveScriptBasePath();
        if (typeof sxStorage === 'undefined' && typeof SXStorage === 'undefined') {
            _loadScriptSync(basePath + 'sx-storage.js');
        }
        if (typeof sxSetItem === 'undefined') {
            _loadScriptSync(basePath + 'sx-helper.js');
        }
    })();

    const safeJsonParse = (raw, fallback) => {
        if (!raw) return fallback;
        try {
            return JSON.parse(raw) ?? fallback;
        } catch {
            return fallback;
        }
    };

    const SxStorage = {
        _initialized: false,
        _useIndexedDBFirst: true,
        _migrationComplete: false,
        _cache: new Map(),
        
        priorityKeys: [
            'sx_characters', 'sx_users', 'sx_npcs',
            'sx_chat_sessions', 'sx_chat_history',
            'sx_short_term_memory', 'sx_long_term_memory',
            'sx_masks', 'sx_worldbook_cot', 'sx_worldbook_style',
            'sx_worldbook_global', 'sx_worldbook_keywords',
            'sx_worldbook_backend', 'sx_worldbook_theater'
        ],
        
        async init() {
            if (this._initialized) return;
            this._initialized = true;
            console.log('[SxStorage] 初始化完成，使用 sx-helper.js');
        },
        
        async setItem(key, value) {
            if (typeof sxSetItem === 'function') {
                const result = await sxSetItem(key, value);
                if (result) {
                    this._cache.set(key, typeof value === 'string' ? value : JSON.stringify(value));
                }
                return result;
            }
            console.error('[SxStorage] sxSetItem 不可用');
            return false;
        },
        
        async getItem(key) {
            const cached = this._cache.get(key);
            if (cached !== undefined) return cached;
            
            if (typeof sxGetItem === 'function') {
                const value = await sxGetItem(key);
                if (value !== null) {
                    this._cache.set(key, value);
                }
                return value;
            }
            console.error('[SxStorage] sxGetItem 不可用');
            return null;
        },
        
        async getJson(key, fallback = []) {
            const raw = await this.getItem(key);
            return safeJsonParse(raw, fallback);
        },
        
        async removeItem(key) {
            this._cache.delete(key);
            if (typeof sxRemoveItem === 'function') {
                return await sxRemoveItem(key);
            }
            console.error('[SxStorage] sxRemoveItem 不可用');
            return false;
        },

        _getCache(key) {
            return this._cache.get(key);
        },

        _setCache(key, value) {
            this._cache.set(key, value);
        },
        
        async getStorageUsage() {
            let total = 0;
            for (const [key, value] of this._cache.entries()) {
                total += (key.length + (value?.length || 0)) * 2;
            }
            
            if (typeof sxStorage !== 'undefined' && sxStorage.getStorageEstimate) {
                try {
                    const estimate = await sxStorage.getStorageEstimate();
                    return {
                        cache: total,
                        indexedDB: estimate.usage || 0,
                        total: total + (estimate.usage || 0),
                        cacheKB: (total / 1024).toFixed(1),
                        indexedDBKB: ((estimate.usage || 0) / 1024).toFixed(1),
                        totalKB: ((total + (estimate.usage || 0)) / 1024).toFixed(1)
                    };
                } catch (e) {}
            }
            
            return {
                cache: total,
                indexedDB: 0,
                total: total,
                cacheKB: (total / 1024).toFixed(1),
                indexedDBKB: '0',
                totalKB: (total / 1024).toFixed(1)
            };
        },
        
        async clearOldData(options = {}) {
            const keepDays = options.keepDays || 7;
            const cutoff = Date.now() - keepDays * 24 * 60 * 60 * 1000;
            
            const chatHistory = await this.getJson('sx_chat_history', []);
            if (Array.isArray(chatHistory)) {
                const filtered = chatHistory.filter(msg => {
                    const ts = msg.timestamp || msg.createdAt;
                    if (!ts) return true;
                    return new Date(ts).getTime() > cutoff;
                });
                await this.setItem('sx_chat_history', filtered);
            }
            
            const sessions = await this.getJson('sx_chat_sessions', []);
            if (Array.isArray(sessions)) {
                const filtered = sessions.filter(s => {
                    const ts = s.lastMessageAt || s.updatedAt;
                    if (!ts) return true;
                    return new Date(ts).getTime() > cutoff;
                });
                await this.setItem('sx_chat_sessions', filtered);
            }
            
            console.log(`[SxStorage] 清理完成，保留 ${keepDays} 天內資料`);
        },
        
        async compressAndVectorize(options = {}) {
            const compressDays = options.compressDays || 7;
            const deleteDays = options.deleteDays || 30;
            const now = Date.now();
            const compressCutoff = now - compressDays * 24 * 60 * 60 * 1000;
            const deleteCutoff = now - deleteDays * 24 * 60 * 60 * 1000;
            
            const stats = {
                compressed: 0,
                deleted: 0,
                vectorized: 0,
                savedBytes: 0
            };
            
            const chatHistory = await this.getJson('sx_chat_history', []);
            if (Array.isArray(chatHistory) && chatHistory.length > 0) {
                const compressedHistory = [];
                const toDelete = [];
                const toCompress = [];
                
                for (const msg of chatHistory) {
                    const ts = new Date(msg.timestamp || msg.createdAt || 0).getTime();
                    
                    if (ts < deleteCutoff) {
                        toDelete.push(msg);
                        stats.deleted++;
                    } else if (ts < compressCutoff) {
                        toCompress.push(msg);
                    } else {
                        compressedHistory.push(msg);
                    }
                }
                
                if (toCompress.length > 0) {
                    const compressed = await this._compressMessages(toCompress);
                    compressedHistory.push(...compressed.compressed);
                    stats.compressed = compressed.count;
                    stats.savedBytes = compressed.savedBytes;
                    
                    if (compressed.vectors && compressed.vectors.length > 0) {
                        await this._saveVectors(compressed.vectors, 'chat_history');
                        stats.vectorized = compressed.vectors.length;
                    }
                }
                
                await this.setItem('sx_chat_history', compressedHistory);
            }
            
            const sessions = await this.getJson('sx_chat_sessions', []);
            if (Array.isArray(sessions) && sessions.length > 0) {
                const activeSessions = [];
                const toArchive = [];
                
                for (const session of sessions) {
                    const ts = new Date(session.lastMessageAt || session.updatedAt || 0).getTime();
                    
                    if (ts < deleteCutoff) {
                        stats.deleted++;
                    } else if (ts < compressCutoff) {
                        toArchive.push(session);
                        stats.compressed++;
                    } else {
                        activeSessions.push(session);
                    }
                }
                
                if (toArchive.length > 0) {
                    const archived = await this._compressSessions(toArchive);
                    activeSessions.push(...archived.sessions);
                    stats.savedBytes += archived.savedBytes;
                    
                    if (archived.vectors && archived.vectors.length > 0) {
                        await this._saveVectors(archived.vectors, 'chat_sessions');
                        stats.vectorized += archived.vectors.length;
                    }
                }
                
                await this.setItem('sx_chat_sessions', activeSessions);
            }
            
            const memories = await this.getJson('sx_short_term_memory', []);
            if (Array.isArray(memories) && memories.length > 0) {
                const activeMemories = [];
                const toArchive = [];
                
                for (const mem of memories) {
                    const ts = new Date(mem.timestamp || mem.createdAt || 0).getTime();
                    
                    if (ts < deleteCutoff) {
                        stats.deleted++;
                    } else if (ts < compressCutoff) {
                        toArchive.push(mem);
                        stats.compressed++;
                    } else {
                        activeMemories.push(mem);
                    }
                }
                
                if (toArchive.length > 0) {
                    const archived = await this._compressMemories(toArchive);
                    activeMemories.push(...archived.memories);
                    stats.savedBytes += archived.savedBytes;
                    
                    if (archived.vectors && archived.vectors.length > 0) {
                        await this._saveVectors(archived.vectors, 'memories');
                        stats.vectorized += archived.vectors.length;
                    }
                }
                
                await this.setItem('sx_short_term_memory', activeMemories);
            }
            
            console.log(`[SxStorage] 壓縮向量化完成: 壓縮 ${stats.compressed}, 刪除 ${stats.deleted}, 向量化 ${stats.vectorized}, 節省 ${(stats.savedBytes / 1024).toFixed(1)} KB`);
            
            await this.setItem('sx_last_compress_cleanup', now.toString());
            
            return stats;
        },
        
        async _compressMessages(messages) {
            const compressed = [];
            const vectors = [];
            let savedBytes = 0;
            
            const grouped = {};
            for (const msg of messages) {
                const date = new Date(msg.timestamp || msg.createdAt).toDateString();
                if (!grouped[date]) grouped[date] = [];
                grouped[date].push(msg);
            }
            
            for (const [date, msgs] of Object.entries(grouped)) {
                const summary = {
                    id: `compressed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'compressed_summary',
                    date: date,
                    messageCount: msgs.length,
                    summary: this._generateSummary(msgs),
                    participants: [...new Set(msgs.map(m => m.role || m.sender))],
                    compressedAt: new Date().toISOString(),
                    originalSize: JSON.stringify(msgs).length
                };
                
                const vector = {
                    id: summary.id,
                    content: summary.summary,
                    metadata: {
                        date: date,
                        messageCount: msgs.length,
                        participants: summary.participants
                    },
                    createdAt: new Date().toISOString()
                };
                vectors.push(vector);
                
                compressed.push(summary);
                savedBytes += summary.originalSize - JSON.stringify(summary).length;
            }
            
            return { compressed, vectors, count: messages.length, savedBytes };
        },
        
        async _compressSessions(sessions) {
            const compressedSessions = [];
            const vectors = [];
            let savedBytes = 0;
            
            for (const session of sessions) {
                const compressed = {
                    id: session.id,
                    charName: session.charName,
                    compressedAt: new Date().toISOString(),
                    messageCount: session.messages?.length || 0,
                    summary: this._generateSessionSummary(session),
                    lastMessageAt: session.lastMessageAt,
                    originalSize: JSON.stringify(session).length
                };
                
                if (session.messages && session.messages.length > 0) {
                    const vector = {
                        id: `session_${session.id}`,
                        content: compressed.summary,
                        metadata: {
                            charName: session.charName,
                            messageCount: compressed.messageCount
                        },
                        createdAt: new Date().toISOString()
                    };
                    vectors.push(vector);
                }
                
                compressedSessions.push(compressed);
                savedBytes += compressed.originalSize - JSON.stringify(compressed).length;
            }
            
            return { sessions: compressedSessions, vectors, savedBytes };
        },
        
        async _compressMemories(memories) {
            const compressedMemories = [];
            const vectors = [];
            let savedBytes = 0;
            
            for (const mem of memories) {
                const compressed = {
                    id: mem.id,
                    compressedAt: new Date().toISOString(),
                    summary: mem.summary || mem.content?.substring(0, 200) || '',
                    tags: mem.tags || [],
                    emotion: mem.emotion,
                    importance: mem.importance,
                    originalSize: JSON.stringify(mem).length
                };
                
                const vector = {
                    id: mem.id,
                    content: compressed.summary,
                    metadata: {
                        tags: compressed.tags,
                        emotion: compressed.emotion,
                        importance: compressed.importance
                    },
                    createdAt: new Date().toISOString()
                };
                vectors.push(vector);
                
                compressedMemories.push(compressed);
                savedBytes += compressed.originalSize - JSON.stringify(compressed).length;
            }
            
            return { memories: compressedMemories, vectors, savedBytes };
        },
        
        _generateSummary(messages) {
            const roles = {};
            for (const msg of messages) {
                const role = msg.role || msg.sender || 'unknown';
                if (!roles[role]) roles[role] = [];
                roles[role].push(msg.content || msg.text || '');
            }
            
            const parts = [];
            for (const [role, contents] of Object.entries(roles)) {
                const totalLen = contents.reduce((sum, c) => sum + c.length, 0);
                const avgLen = Math.round(totalLen / contents.length);
                parts.push(`${role}: ${contents.length}則訊息 (平均${avgLen}字)`);
            }
            
            return parts.join('; ');
        },
        
        _generateSessionSummary(session) {
            const msgs = session.messages || [];
            if (msgs.length === 0) return '無訊息';
            
            const userMsgs = msgs.filter(m => m.role === 'user' || m.isUser).length;
            const charMsgs = msgs.length - userMsgs;
            
            const lastMsg = msgs[msgs.length - 1];
            const preview = (lastMsg?.content || lastMsg?.text || '').substring(0, 100);
            
            return `共${msgs.length}則訊息 (User:${userMsgs}, Char:${charMsgs})。最後: ${preview}...`;
        },
        
        async _saveVectors(vectors, source) {
            const existingVectors = await this.getJson('sx_compressed_vectors', []);
            
            for (const v of vectors) {
                v.source = source;
                existingVectors.push(v);
            }
            
            await this.setItem('sx_compressed_vectors', existingVectors);
        },
        
        async getCompressedVectors(options = {}) {
            const vectors = await this.getJson('sx_compressed_vectors', []);
            
            if (options.source) {
                return vectors.filter(v => v.source === options.source);
            }
            
            return vectors;
        },
        
        async searchCompressedData(query, options = {}) {
            const vectors = await this.getCompressedVectors();
            const results = [];
            const queryLower = query.toLowerCase();
            
            for (const v of vectors) {
                if (v.content && v.content.toLowerCase().includes(queryLower)) {
                    results.push({
                        id: v.id,
                        content: v.content,
                        metadata: v.metadata,
                        source: v.source,
                        score: 1
                    });
                }
            }
            
            return results.sort((a, b) => b.score - a.score).slice(0, options.limit || 20);
        }
    };
    
    global.SxStorage = SxStorage;

    const LanguageModule = {
        aliasMap: {
            'zh-TW': 'zh-Hant',
            'zh-HK': 'zh-Hant',
            'zh-MO': 'zh-Hant',
            'zh-CN': 'zh-Hans',
            'zh-SG': 'zh-Hans'
        },

        async getCurrentLangAsync() {
            const rawLang = await SxStorage.getItem('sxiphone_lang') || 'zh-Hant';
            return this.normalizeLang(rawLang);
        },

        getCurrentLang() {
            const cached = SxStorage._getCache('sxiphone_lang');
            const rawLang = cached || localStorage.getItem('sxiphone_lang') || 'zh-Hant';
            return this.normalizeLang(rawLang);
        },

        normalizeLang(rawLang) {
            const normalized = this.aliasMap[rawLang] || rawLang;
            return normalized;
        },

        _updateCallbacks: [],

        onUpdate(callback) {
            if (typeof callback === 'function') {
                this._updateCallbacks.push(callback);
            }
        },

        offUpdate(callback) {
            const idx = this._updateCallbacks.indexOf(callback);
            if (idx > -1) {
                this._updateCallbacks.splice(idx, 1);
            }
        },

        triggerUpdate(lang) {
            const currentLang = lang || this.getCurrentLang();
            this._updateCallbacks.forEach(callback => {
                try {
                    callback(currentLang);
                } catch (e) {
                    console.warn('[LanguageModule] UI 更新回調執行失敗:', e);
                }
            });
        },

        initListener() {
            window.addEventListener('message', (event) => {
                const data = event.data;
                if (!data || typeof data !== 'object') return;

                if (data.type === 'LANGUAGE_CHANGED' && data.lang) {
                    console.log('[LanguageModule] 收到語言變更訊息:', data.lang);
                    SxStorage.setItem('sxiphone_lang', data.lang);
                    if (document.documentElement) {
                        document.documentElement.lang = this.normalizeLang(data.lang);
                    }
                    this.triggerUpdate(this.normalizeLang(data.lang));
                }
            });

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.triggerUpdate();
                });
            } else {
                this.triggerUpdate();
            }
        }
    };

    const AppearanceModule = {
        _updateCallbacks: [],
        _configCache: null,
        
        async getAppearanceConfigAsync() {
            const raw = await SxStorage.getItem('sx_custom_theme_config');
            return safeJsonParse(raw, {
                textPrimary: '#ffffff',
                textSecondary: '#9ca3af',
                textHeading: '#ffffff',
                textLink: '#5B8DEF',
                borderWidth: 1,
                borderColor: '#ffffff',
                cardBorderWidth: 1,
                cardRadius: 18,
                elementGap: 12,
                fontSize: 14,
                headingSize: 22,
                iconSize: 62,
                iconRadius: 20,
                appBgColor: '#1c1c1e',
                appBgOpacity: 30
            });
        },
        
        getAppearanceConfig() {
            if (this._configCache) return this._configCache;
            const cached = SxStorage._getCache('sx_custom_theme_config');
            const raw = cached || localStorage.getItem('sx_custom_theme_config');
            return safeJsonParse(raw, {
                textPrimary: '#ffffff',
                textSecondary: '#9ca3af',
                textHeading: '#ffffff',
                textLink: '#5B8DEF',
                borderWidth: 1,
                borderColor: '#ffffff',
                cardBorderWidth: 1,
                cardRadius: 18,
                elementGap: 12,
                fontSize: 14,
                headingSize: 22,
                iconSize: 62,
                iconRadius: 20,
                appBgColor: '#1c1c1e',
                appBgOpacity: 30
            });
        },
        
        async getThemeModeAsync() {
            return await SxStorage.getItem('sx_theme_mode') || 'dark';
        },
        
        getThemeMode() {
            const cached = SxStorage._getCache('sx_theme_mode');
            return cached || localStorage.getItem('sx_theme_mode') || 'dark';
        },
        
        async getThemeAccentAsync() {
            return await SxStorage.getItem('sx_theme_accent') || '#5B8DEF';
        },
        
        getThemeAccent() {
            const cached = SxStorage._getCache('sx_theme_accent');
            return cached || localStorage.getItem('sx_theme_accent') || '#5B8DEF';
        },
        
        async getTextColorAsync() {
            const mode = await this.getThemeModeAsync();
            return await SxStorage.getItem('sx_theme_text_color') || 
                   (mode === 'light' ? '#000000' : '#ffffff');
        },
        
        getTextColor() {
            const cached = SxStorage._getCache('sx_theme_text_color');
            if (cached) return cached;
            return localStorage.getItem('sx_theme_text_color') || 
                   (this.getThemeMode() === 'light' ? '#000000' : '#ffffff');
        },
        
        async getAppBgConfigAsync() {
            const color = await SxStorage.getItem('sx_theme_app_bg_color') || '#1c1c1e';
            const opacityRaw = await SxStorage.getItem('sx_theme_app_bg_alpha') || '30';
            const blurRaw = await SxStorage.getItem('sx_theme_app_bg_blur') || '20';
            return {
                color,
                opacity: parseInt(opacityRaw),
                blur: parseInt(blurRaw)
            };
        },
        
        getAppBgConfig() {
            const colorCache = SxStorage._getCache('sx_theme_app_bg_color');
            const alphaCache = SxStorage._getCache('sx_theme_app_bg_alpha');
            const blurCache = SxStorage._getCache('sx_theme_app_bg_blur');
            return {
                color: colorCache || localStorage.getItem('sx_theme_app_bg_color') || '#1c1c1e',
                opacity: parseInt(alphaCache || localStorage.getItem('sx_theme_app_bg_alpha') || '30'),
                blur: parseInt(blurCache || localStorage.getItem('sx_theme_app_bg_blur') || '20')
            };
        },
        
        onUpdate(callback) {
            if (typeof callback === 'function') {
                this._updateCallbacks.push(callback);
            }
        },
        
        offUpdate(callback) {
            const idx = this._updateCallbacks.indexOf(callback);
            if (idx > -1) {
                this._updateCallbacks.splice(idx, 1);
            }
        },
        
        triggerUpdate(config) {
            const currentConfig = config || this.getAppearanceConfig();
            this._configCache = currentConfig;
            this._updateCallbacks.forEach(callback => {
                try {
                    callback(currentConfig);
                } catch (e) {
                    console.warn('[AppearanceModule] 外觀更新回調執行失敗:', e);
                }
            });
        },
        
        applyToPage(config) {
            const cfg = config || this.getAppearanceConfig();
            const root = document.documentElement;
            
            if (cfg.textPrimary) root.style.setProperty('--sx-text', cfg.textPrimary);
            if (cfg.textSecondary) root.style.setProperty('--sx-text-secondary', cfg.textSecondary);
            if (cfg.textLink) root.style.setProperty('--sx-accent', cfg.textLink);
            if (cfg.fontSize) root.style.setProperty('--sx-font-size', cfg.fontSize + 'px');
            if (cfg.headingSize) root.style.setProperty('--sx-heading-size', cfg.headingSize + 'px');
            if (cfg.cardRadius) root.style.setProperty('--sx-card-radius', cfg.cardRadius + 'px');
            if (cfg.iconRadius) root.style.setProperty('--sx-icon-radius', cfg.iconRadius + 'px');
            if (cfg.iconSize) root.style.setProperty('--sx-icon-size', cfg.iconSize + 'px');
            
            const mode = this.getThemeMode();
            const effectiveMode = mode === 'custom-light' ? 'light' : mode === 'custom-dark' ? 'dark' : mode;
            root.dataset.theme = effectiveMode;
            document.body?.classList.toggle('theme-light', effectiveMode === 'light');
            
            const accent = this.getThemeAccent();
            root.style.setProperty('--sx-accent', accent);
            
            const textColor = this.getTextColor();
            root.style.setProperty('--sx-text-color', textColor);
            
            const styleId = 'sx-appearance-override';
            let styleEl = document.getElementById(styleId);
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = styleId;
                document.head.appendChild(styleEl);
            }
            
            styleEl.textContent = `
                body, .app-container, .app-content {
                    color: ${cfg.textPrimary || '#ffffff'};
                    font-size: ${cfg.fontSize || 14}px;
                }
                .card, .panel, .modal, .bubble {
                    border-radius: ${cfg.cardRadius || 18}px;
                    border-width: ${cfg.cardBorderWidth || 1}px;
                }
                .icon-box, .app-icon {
                    border-radius: ${cfg.iconRadius || 20}px;
                    width: ${cfg.iconSize || 62}px;
                    height: ${cfg.iconSize || 62}px;
                }
                h1, h2, h3, .heading, .title {
                    color: ${cfg.textHeading || '#ffffff'};
                    font-size: ${cfg.headingSize || 22}px;
                }
                a, .link, .accent-text {
                    color: ${cfg.textLink || accent};
                }
                .secondary-text, .hint, .label {
                    color: ${cfg.textSecondary || '#9ca3af'};
                }
            `;
            
            console.log('[AppearanceModule] 外觀已應用到頁面');
        },
        
        initListener() {
            window.addEventListener('message', (event) => {
                const data = event.data;
                if (!data || typeof data !== 'object') return;
                
                if (data.type === 'APPEARANCE_THEME_CHANGED' && data.config) {
                    console.log('[AppearanceModule] 收到外觀變更訊息');
                    this.triggerUpdate(data.config);
                    this.applyToPage(data.config);
                }
                
                if (data.type === 'THEME_MODE_CHANGED' && data.mode) {
                    console.log('[AppearanceModule] 收到主題模式變更:', data.mode);
                    SxStorage.setItem('sx_theme_mode', data.mode);
                    this.applyToPage();
                }
                
                if (data.type === 'THEME_ACCENT_CHANGED' && data.accent) {
                    console.log('[AppearanceModule] 收到強調色變更:', data.accent);
                    SxStorage.setItem('sx_theme_accent', data.accent);
                    this.applyToPage();
                }
                
                if (data.type === 'THEME_TEXT_COLOR_CHANGED' && data.color) {
                    console.log('[AppearanceModule] 收到文字顏色變更:', data.color);
                    SxStorage.setItem('sx_theme_text_color', data.color);
                    this.applyToPage();
                }
                
                if (data.type === 'THEME_APP_BG_CHANGED' && data.color) {
                    console.log('[AppearanceModule] 收到應用背景變更:', data.color);
                    SxStorage.setItem('sx_theme_app_bg_color', data.color);
                    if (data.alpha) SxStorage.setItem('sx_theme_app_bg_alpha', data.alpha);
                    this.applyToPage();
                }
            });
            
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.applyToPage();
                    this.triggerUpdate();
                });
            } else {
                this.applyToPage();
                this.triggerUpdate();
            }
        }
    };

    const detectBrowser = () => {
        const ua = navigator.userAgent;
        return {
            isIOS: /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
            isAndroid: /Android/i.test(ua),
            isChrome: /Chrome/i.test(ua) && /Google/i.test(ua),
            isEdge: /Edg/i.test(ua),
            isOpera: /OPR|Opera/i.test(ua),
            isVia: /Via/i.test(ua),
            isXBrowser: /XBrowser/i.test(ua),
            isSamsung: /SamsungBrowser/i.test(ua),
            isFirefox: /Firefox/i.test(ua),
            isUCBrowser: /UCBrowser/i.test(ua),
            isQQBrowser: /QQBrowser/i.test(ua),
            isQuark: /Quark/i.test(ua),
            is360Browser: /360Browser/i.test(ua)
        };
    };

    const StorageProtection = {
        browser: detectBrowser(),

        async requestPersistence() {
            if (navigator.storage && navigator.storage.persist) {
                try {
                    const isPersisted = await navigator.storage.persist();
                    console.log('[StorageProtection] 持久化狀態:', isPersisted ? '已啟用' : '未啟用');
                    return isPersisted;
                } catch (e) {
                    console.warn('[StorageProtection] 持久化請求失敗:', e);
                    return false;
                }
            }
            console.log('[StorageProtection] Storage API 不支援，使用備用方法');
            return false;
        },

        async save(key, value) {
            try {
                const serialized = typeof value === 'object' ? JSON.stringify(value) : value;
                
                await SxStorage.setItem(key, serialized);
                
                try {
                    sessionStorage.setItem(key + '_backup', serialized);
                } catch (e) {}

                try {
                    window.dispatchEvent(new StorageEvent('storage', { key, newValue: serialized }));
                } catch (e) {}

                if (this.browser.isVia || this.browser.isXBrowser) {
                    await SxStorage.setItem(key, serialized);
                }

                return true;
            } catch (e) {
                console.error('[StorageProtection] 保存失敗:', key, e);
                
                try {
                    sessionStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : value);
                    return true;
                } catch (e2) {
                    console.error('[StorageProtection] 備份儲存也失敗:', e2);
                    return false;
                }
            }
        },

        async load(key, fallback = null) {
            try {
                const value = await SxStorage.getItem(key);
                if (value !== null) return JSON.parse(value);
                
                const backup = sessionStorage.getItem(key + '_backup');
                if (backup !== null) {
                    const parsed = JSON.parse(backup);
                    await SxStorage.setItem(key, backup);
                    return parsed;
                }
            } catch (e) {
                console.warn('[StorageProtection] 讀取失敗:', key, e);
            }
            return fallback;
        },

        initAppProtection(saveCallback) {
            const browser = this.browser;
            
            console.log('[StorageProtection] 瀏覽器檢測:', browser);

            window.addEventListener('pagehide', (event) => {
                console.log('[StorageProtection] pagehide 觸發，保存數據...');
                if (saveCallback) saveCallback();
            });

            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden') {
                    console.log('[StorageProtection] visibilitychange(hidden) 觸發，保存數據...');
                    if (saveCallback) saveCallback();
                }
            });

            window.addEventListener('beforeunload', () => {
                if (saveCallback) saveCallback();
            });

            window.addEventListener('unload', () => {
                if (saveCallback) saveCallback();
            });

            if ('onfreeze' in document) {
                document.addEventListener('freeze', () => {
                    console.log('[StorageProtection] freeze 觸發，保存數據...');
                    if (saveCallback) saveCallback();
                });
            }

            if ('onresume' in document) {
                document.addEventListener('resume', () => {
                    console.log('[StorageProtection] resume 觸發');
                });
            }

            window.addEventListener('message', (event) => {
                if (event.data?.type === 'APP_WILL_CLOSE') {
                    console.log('[StorageProtection] APP_WILL_CLOSE 觸發，保存數據...');
                    if (saveCallback) saveCallback();
                }
            });

            if (browser.isVia) {
                console.log('[StorageProtection] Via 瀏覽器特殊處理已啟用');
                setInterval(() => {
                    if (saveCallback) saveCallback();
                }, 5000);
            }

            if (browser.isXBrowser) {
                console.log('[StorageProtection] X瀏覽器特殊處理已啟用');
                setInterval(() => {
                    if (saveCallback) saveCallback();
                }, 5000);
            }

            this.requestPersistence();
        }
    };

    const SettingsReader = {
        async getApiConfigsAsync() {
            return await SxStorage.getJson('api_configs', []);
        },

        getApiConfigs() {
            const cached = SxStorage._getCache('api_configs');
            return safeJsonParse(cached || localStorage.getItem('api_configs'), []);
        },

        async getActiveApiIndexAsync() {
            const idx = await SxStorage.getItem('sx_active_api');
            if (idx === null) return 0;
            const parsed = parseInt(idx, 10);
            if (isNaN(parsed)) return 0;
            return parsed;
        },

        getActiveApiIndex() {
            const cached = SxStorage._getCache('sx_active_api');
            const idx = cached || localStorage.getItem('sx_active_api');
            if (idx === null) return 0;
            const parsed = parseInt(idx, 10);
            if (isNaN(parsed)) return 0;
            return parsed;
        },

        async getActiveApiAsync() {
            const configs = await this.getApiConfigsAsync();
            if (!configs || configs.length === 0) return null;
            const idx = await this.getActiveApiIndexAsync();
            if (idx < 0 || idx >= configs.length) {
                console.warn('[SettingsReader] API 索引超出範圍，使用第一個 API');
                return configs[0];
            }
            return configs[idx];
        },

        getActiveApi() {
            const configs = this.getApiConfigs();
            if (!configs || configs.length === 0) return null;
            const idx = this.getActiveApiIndex();
            if (idx < 0 || idx >= configs.length) {
                console.warn('[SettingsReader] API 索引超出範圍，使用第一個 API');
                return configs[0];
            }
            return configs[idx];
        },

        async getActiveApiWithFallbackAsync() {
            const configs = await this.getApiConfigsAsync();
            if (!configs || configs.length === 0) {
                console.warn('[SettingsReader] 沒有可用的 API 配置');
                return null;
            }
            const idx = await this.getActiveApiIndexAsync();
            const api = configs[idx] || configs[0];
            console.log(`[SettingsReader] 使用 API #${idx}: ${api?.name || '未命名'} (${api?.url?.slice(0, 30)}...)`);
            return api;
        },

        getActiveApiWithFallback() {
            const configs = this.getApiConfigs();
            if (!configs || configs.length === 0) {
                console.warn('[SettingsReader] 沒有可用的 API 配置');
                return null;
            }
            const idx = this.getActiveApiIndex();
            const api = configs[idx] || configs[0];
            console.log(`[SettingsReader] 使用 API #${idx}: ${api?.name || '未命名'} (${api?.url?.slice(0, 30)}...)`);
            return api;
        },

        async getCharactersAsync() {
            return await SxStorage.getJson('sx_characters', []);
        },

        getCharacters() {
            const cached = SxStorage._getCache('sx_characters');
            return safeJsonParse(cached || localStorage.getItem('sx_characters'), []);
        },

        async getUsersAsync() {
            return await SxStorage.getJson('sx_users', []);
        },

        getUsers() {
            const cached = SxStorage._getCache('sx_users');
            return safeJsonParse(cached || localStorage.getItem('sx_users'), []);
        },

        async getNpcsAsync() {
            return await SxStorage.getJson('sx_npcs', []);
        },

        getNpcs() {
            const cached = SxStorage._getCache('sx_npcs');
            return safeJsonParse(cached || localStorage.getItem('sx_npcs'), []);
        },

        async getAllPersonasAsync() {
            const chars = await this.getCharactersAsync();
            const users = await this.getUsersAsync();
            const npcs = await this.getNpcsAsync();
            return [
                ...chars.map(c => ({ ...c, type: 'character' })),
                ...users.map(u => ({ ...u, type: 'user' })),
                ...npcs.map(n => ({ ...n, type: 'npc' }))
            ];
        },

        getAllPersonas() {
            const chars = this.getCharacters();
            const users = this.getUsers();
            const npcs = this.getNpcs();
            return [
                ...chars.map(c => ({ ...c, type: 'character' })),
                ...users.map(u => ({ ...u, type: 'user' })),
                ...npcs.map(n => ({ ...n, type: 'npc' }))
            ];
        },

        async getWorldbookIndexAsync() {
            return await SxStorage.getJson('sx_worldbook_index', []);
        },

        getWorldbookIndex() {
            const cached = SxStorage._getCache('sx_worldbook_index');
            return safeJsonParse(cached || localStorage.getItem('sx_worldbook_index'), []);
        },

        async getWorldbookMountsAsync() {
            return await SxStorage.getJson('sx_worldbook_mounts', []);
        },

        getWorldbookMounts() {
            const cached = SxStorage._getCache('sx_worldbook_mounts');
            return safeJsonParse(cached || localStorage.getItem('sx_worldbook_mounts'), []);
        },

        async getWorldbookPartsAsync() {
            const [cot, style, global, keywords, backend, theater] = await Promise.all([
                SxStorage.getJson('sx_worldbook_cot', []),
                SxStorage.getJson('sx_worldbook_style', []),
                SxStorage.getJson('sx_worldbook_global', []),
                SxStorage.getJson('sx_worldbook_keywords', []),
                SxStorage.getJson('sx_worldbook_backend', []),
                SxStorage.getJson('sx_worldbook_theater', [])
            ]);
            return { cot, style, global, keywords, backend, theater };
        },

        getWorldbookParts() {
            return {
                cot: safeJsonParse(SxStorage._getCache('sx_worldbook_cot') || localStorage.getItem('sx_worldbook_cot'), []),
                style: safeJsonParse(SxStorage._getCache('sx_worldbook_style') || localStorage.getItem('sx_worldbook_style'), []),
                global: safeJsonParse(SxStorage._getCache('sx_worldbook_global') || localStorage.getItem('sx_worldbook_global'), []),
                keywords: safeJsonParse(SxStorage._getCache('sx_worldbook_keywords') || localStorage.getItem('sx_worldbook_keywords'), []),
                backend: safeJsonParse(SxStorage._getCache('sx_worldbook_backend') || localStorage.getItem('sx_worldbook_backend'), []),
                theater: safeJsonParse(SxStorage._getCache('sx_worldbook_theater') || localStorage.getItem('sx_worldbook_theater'), [])
            };
        },

        async getCurrentUserAsync() {
            const [name, avatar, personality, background] = await Promise.all([
                SxStorage.getItem('sx_user_name'),
                SxStorage.getItem('sx_user_avatar'),
                SxStorage.getItem('sx_user_personality'),
                SxStorage.getItem('sx_user_background')
            ]);
            return {
                name: name || '',
                avatar: avatar || '',
                personality: personality || '',
                background: background || ''
            };
        },

        getCurrentUser() {
            return {
                name: SxStorage._getCache('sx_user_name') || localStorage.getItem('sx_user_name') || '',
                avatar: SxStorage._getCache('sx_user_avatar') || localStorage.getItem('sx_user_avatar') || '',
                personality: SxStorage._getCache('sx_user_personality') || localStorage.getItem('sx_user_personality') || '',
                background: SxStorage._getCache('sx_user_background') || localStorage.getItem('sx_user_background') || ''
            };
        },

        async getMasksAsync() {
            return await SxStorage.getJson('sx_masks', []);
        },

        getMasks() {
            const cached = SxStorage._getCache('sx_masks');
            return safeJsonParse(cached || localStorage.getItem('sx_masks'), []);
        },

        async getActiveMaskAsync() {
            const masks = await this.getMasksAsync();
            return masks[0] || null;
        },

        getActiveMask() {
            const masks = this.getMasks();
            return masks[0] || null;
        },

        async getCharByNameAsync(name) {
            if (!name) return null;
            const chars = await this.getCharactersAsync();
            return chars.find(c => c.name === name) || null;
        },

        getCharByName(name) {
            if (!name) return null;
            const chars = this.getCharacters();
            return chars.find(c => c.name === name) || null;
        },

        async getUserByNameAsync(name) {
            if (!name) return null;
            const users = await this.getUsersAsync();
            return users.find(u => u.name === name) || null;
        },

        getUserByName(name) {
            if (!name) return null;
            const users = this.getUsers();
            return users.find(u => u.name === name) || null;
        },

        async getNpcByNameAsync(name) {
            if (!name) return null;
            const npcs = await this.getNpcsAsync();
            return npcs.find(n => n.name === name) || null;
        },

        getNpcByName(name) {
            if (!name) return null;
            const npcs = this.getNpcs();
            return npcs.find(n => n.name === name) || null;
        },

        async getPersonaByNameAsync(name) {
            return await this.getCharByNameAsync(name) || 
                   await this.getUserByNameAsync(name) || 
                   await this.getNpcByNameAsync(name) || null;
        },

        getPersonaByName(name) {
            return this.getCharByName(name) || 
                   this.getUserByName(name) || 
                   this.getNpcByName(name) || null;
        },

        async getActiveCharAsync() {
            const charName = await SxStorage.getItem('sx_char_name') || '';
            if (charName) {
                const found = await this.getCharByNameAsync(charName);
                if (found) return found;
            }
            const chars = await this.getCharactersAsync();
            return chars[0] || null;
        },

        getActiveChar() {
            const charName = SxStorage._getCache('sx_char_name') || localStorage.getItem('sx_char_name') || '';
            if (charName) {
                const found = this.getCharByName(charName);
                if (found) return found;
            }
            const chars = this.getCharacters();
            return chars[0] || null;
        },

        async getSettingsSnapshotAsync() {
            const [apis, activeApiIndex, characters, users, npcs, worldbook, worldbookIndex, worldbookMounts, currentUser, masks] = await Promise.all([
                this.getApiConfigsAsync(),
                this.getActiveApiIndexAsync(),
                this.getCharactersAsync(),
                this.getUsersAsync(),
                this.getNpcsAsync(),
                this.getWorldbookPartsAsync(),
                this.getWorldbookIndexAsync(),
                this.getWorldbookMountsAsync(),
                this.getCurrentUserAsync(),
                this.getMasksAsync()
            ]);
            
            const [activeApi, activeApiWithFallback, activeMask, activeChar] = await Promise.all([
                this.getActiveApiAsync(),
                this.getActiveApiWithFallbackAsync(),
                this.getActiveMaskAsync(),
                this.getActiveCharAsync()
            ]);
            
            return {
                apis,
                activeApiIndex,
                activeApi,
                activeApiWithFallback,
                characters,
                users,
                npcs,
                personas: [
                    ...characters.map(c => ({ ...c, type: 'character' })),
                    ...users.map(u => ({ ...u, type: 'user' })),
                    ...npcs.map(n => ({ ...n, type: 'npc' }))
                ],
                worldbook,
                worldbookIndex,
                worldbookMounts,
                currentUser,
                masks,
                activeMask,
                activeChar
            };
        },

        getSettingsSnapshot() {
            return {
                apis: this.getApiConfigs(),
                activeApiIndex: this.getActiveApiIndex(),
                activeApi: this.getActiveApi(),
                activeApiWithFallback: this.getActiveApiWithFallback(),
                characters: this.getCharacters(),
                users: this.getUsers(),
                npcs: this.getNpcs(),
                personas: this.getAllPersonas(),
                worldbook: this.getWorldbookParts(),
                worldbookIndex: this.getWorldbookIndex(),
                worldbookMounts: this.getWorldbookMounts(),
                currentUser: this.getCurrentUser(),
                masks: this.getMasks(),
                activeMask: this.getActiveMask(),
                activeChar: this.getActiveChar()
            };
        }
    };

    const getActiveApiConfig = () => {
        return SettingsReader.getActiveApiWithFallback();
    };

    const getActiveApiConfigAsync = async () => {
        return await SettingsReader.getActiveApiWithFallbackAsync();
    };

    global.SxSettings = SettingsReader;
    global.getSxSettings = () => SettingsReader.getSettingsSnapshot();
    global.getSxSettingsAsync = () => SettingsReader.getSettingsSnapshotAsync();
    global.getActiveApiConfig = getActiveApiConfig;
    global.getActiveApiConfigAsync = getActiveApiConfigAsync;
    global.SettingsReader = SettingsReader;
    global.StorageProtection = StorageProtection;
    
    global.SxLanguage = LanguageModule;
    global.getCurrentLang = () => LanguageModule.getCurrentLang();
    global.getCurrentLangAsync = () => LanguageModule.getCurrentLangAsync();
    global.onLanguageChange = (callback) => LanguageModule.onUpdate(callback);
    global.offLanguageChange = (callback) => LanguageModule.offUpdate(callback);
    
    global.SxAppearance = AppearanceModule;
    global.getAppearanceConfig = () => AppearanceModule.getAppearanceConfig();
    global.getAppearanceConfigAsync = () => AppearanceModule.getAppearanceConfigAsync();
    global.onAppearanceChange = (callback) => AppearanceModule.onUpdate(callback);
    global.offAppearanceChange = (callback) => AppearanceModule.offUpdate(callback);
    global.applyAppearance = (config) => AppearanceModule.applyToPage(config);

    LanguageModule.initListener();
    
    AppearanceModule.initListener();

})(typeof window !== 'undefined' ? window : globalThis);
