(function(global) {
    'use strict';

    const safeJsonParse = (raw, fallback) => {
        if (!raw) return fallback;
        try {
            return JSON.parse(raw) ?? fallback;
        } catch {
            return fallback;
        }
    };

    // --- 語言處理模組 ---
    const LanguageModule = {
        // 語言別名對應
        aliasMap: {
            'zh-TW': 'zh-Hant',
            'zh-HK': 'zh-Hant',
            'zh-MO': 'zh-Hant',
            'zh-CN': 'zh-Hans',
            'zh-SG': 'zh-Hans'
        },

        // 獲取當前語言
        getCurrentLang() {
            const rawLang = localStorage.getItem('sxiphone_lang') || 'zh-Hant';
            return this.normalizeLang(rawLang);
        },

        // 標準化語言代碼
        normalizeLang(rawLang) {
            const normalized = this.aliasMap[rawLang] || rawLang;
            return normalized;
        },

        // UI 更新回調註冊表
        _updateCallbacks: [],

        // 註冊 UI 更新回調
        onUpdate(callback) {
            if (typeof callback === 'function') {
                this._updateCallbacks.push(callback);
            }
        },

        // 移除 UI 更新回調
        offUpdate(callback) {
            const idx = this._updateCallbacks.indexOf(callback);
            if (idx > -1) {
                this._updateCallbacks.splice(idx, 1);
            }
        },

        // 觸發所有 UI 更新回調
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

        // 初始化語言監聽器
        initListener() {
            // 監聽來自父視窗的語言變更訊息
            window.addEventListener('message', (event) => {
                const data = event.data;
                if (!data || typeof data !== 'object') return;

                if (data.type === 'LANGUAGE_CHANGED' && data.lang) {
                    console.log('[LanguageModule] 收到語言變更訊息:', data.lang);
                    // 更新 localStorage
                    localStorage.setItem('sxiphone_lang', data.lang);
                    // 更新 html lang 屬性
                    if (document.documentElement) {
                        document.documentElement.lang = this.normalizeLang(data.lang);
                    }
                    // 觸發 UI 更新
                    this.triggerUpdate(this.normalizeLang(data.lang));
                }
            });

            // 頁面載入時也觸發一次（確保初始狀態正確）
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.triggerUpdate();
                });
            } else {
                this.triggerUpdate();
            }
        }
    };

    // --- 外觀主題模組 ---
    const AppearanceModule = {
        // 外觀更新回調註冊表
        _updateCallbacks: [],
        
        // 獲取當前外觀設定
        getAppearanceConfig() {
            return safeJsonParse(localStorage.getItem('sx_custom_theme_config'), {
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
        
        // 獲取主題模式
        getThemeMode() {
            return localStorage.getItem('sx_theme_mode') || 'dark';
        },
        
        // 獲取主題強調色
        getThemeAccent() {
            return localStorage.getItem('sx_theme_accent') || '#5B8DEF';
        },
        
        // 獲取文字顏色
        getTextColor() {
            return localStorage.getItem('sx_theme_text_color') || 
                   (this.getThemeMode() === 'light' ? '#000000' : '#ffffff');
        },
        
        // 獲取應用背景設定
        getAppBgConfig() {
            return {
                color: localStorage.getItem('sx_theme_app_bg_color') || '#1c1c1e',
                opacity: parseInt(localStorage.getItem('sx_theme_app_bg_alpha') || '30'),
                blur: parseInt(localStorage.getItem('sx_theme_app_bg_blur') || '20')
            };
        },
        
        // 註冊外觀更新回調
        onUpdate(callback) {
            if (typeof callback === 'function') {
                this._updateCallbacks.push(callback);
            }
        },
        
        // 移除外觀更新回調
        offUpdate(callback) {
            const idx = this._updateCallbacks.indexOf(callback);
            if (idx > -1) {
                this._updateCallbacks.splice(idx, 1);
            }
        },
        
        // 觸發所有外觀更新回調
        triggerUpdate(config) {
            const currentConfig = config || this.getAppearanceConfig();
            this._updateCallbacks.forEach(callback => {
                try {
                    callback(currentConfig);
                } catch (e) {
                    console.warn('[AppearanceModule] 外觀更新回調執行失敗:', e);
                }
            });
        },
        
        // 應用外觀設定到當前頁面
        applyToPage(config) {
            const cfg = config || this.getAppearanceConfig();
            const root = document.documentElement;
            
            // 設定 CSS 變數
            if (cfg.textPrimary) root.style.setProperty('--sx-text', cfg.textPrimary);
            if (cfg.textSecondary) root.style.setProperty('--sx-text-secondary', cfg.textSecondary);
            if (cfg.textLink) root.style.setProperty('--sx-accent', cfg.textLink);
            if (cfg.fontSize) root.style.setProperty('--sx-font-size', cfg.fontSize + 'px');
            if (cfg.headingSize) root.style.setProperty('--sx-heading-size', cfg.headingSize + 'px');
            if (cfg.cardRadius) root.style.setProperty('--sx-card-radius', cfg.cardRadius + 'px');
            if (cfg.iconRadius) root.style.setProperty('--sx-icon-radius', cfg.iconRadius + 'px');
            if (cfg.iconSize) root.style.setProperty('--sx-icon-size', cfg.iconSize + 'px');
            
            // 應用主題模式
            const mode = this.getThemeMode();
            const effectiveMode = mode === 'custom-light' ? 'light' : mode === 'custom-dark' ? 'dark' : mode;
            root.dataset.theme = effectiveMode;
            document.body?.classList.toggle('theme-light', effectiveMode === 'light');
            
            // 應用強調色
            const accent = this.getThemeAccent();
            root.style.setProperty('--sx-accent', accent);
            
            // 應用文字顏色
            const textColor = this.getTextColor();
            root.style.setProperty('--sx-text-color', textColor);
            
            // 動態注入樣式
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
        
        // 初始化外觀監聽器
        initListener() {
            // 監聽來自父視窗的外觀變更訊息
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
                    localStorage.setItem('sx_theme_mode', data.mode);
                    this.applyToPage();
                }
                
                if (data.type === 'THEME_ACCENT_CHANGED' && data.accent) {
                    console.log('[AppearanceModule] 收到強調色變更:', data.accent);
                    localStorage.setItem('sx_theme_accent', data.accent);
                    this.applyToPage();
                }
                
                if (data.type === 'THEME_TEXT_COLOR_CHANGED' && data.color) {
                    console.log('[AppearanceModule] 收到文字顏色變更:', data.color);
                    localStorage.setItem('sx_theme_text_color', data.color);
                    this.applyToPage();
                }
                
                if (data.type === 'THEME_APP_BG_CHANGED' && data.color) {
                    console.log('[AppearanceModule] 收到應用背景變更:', data.color);
                    localStorage.setItem('sx_theme_app_bg_color', data.color);
                    if (data.alpha) localStorage.setItem('sx_theme_app_bg_alpha', data.alpha);
                    this.applyToPage();
                }
            });
            
            // 頁面載入時應用當前外觀設定
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

    // --- 瀏覽器檢測 ---
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

    // --- 跨瀏覽器儲存保護模組 ---
    const StorageProtection = {
        browser: detectBrowser(),

        // 請求持久化儲存權限
        async requestPersistence() {
            // Storage API 支援檢測
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
            // 對於不支援 Storage API 的瀏覽器，使用其他方法
            console.log('[StorageProtection] Storage API 不支援，使用備用方法');
            return false;
        },

        // 保存數據的包裝函數，確保立即寫入
        save(key, value) {
            try {
                const serialized = typeof value === 'object' ? JSON.stringify(value) : value;
                
                // 主要儲存
                localStorage.setItem(key, serialized);
                
                // 針對某些瀏覽器的額外保險：嘗試 sessionStorage 作為備份
                try {
                    sessionStorage.setItem(key + '_backup', serialized);
                } catch (e) {
                    // sessionStorage 可能不可用
                }

                // 強制觸發 storage 事件
                try {
                    window.dispatchEvent(new StorageEvent('storage', { key, newValue: serialized }));
                } catch (e) {
                    // 某些瀏覽器可能不支援 StorageEvent 建構子
                }

                // 針對 Via/X瀏覽器 的特殊處理：強制寫入
                if (this.browser.isVia || this.browser.isXBrowser) {
                    // 重複寫入以確保
                    localStorage.setItem(key, serialized);
                }

                return true;
            } catch (e) {
                console.error('[StorageProtection] 保存失敗:', key, e);
                
                // 嘗試使用 sessionStorage 作為備份
                try {
                    sessionStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : value);
                    return true;
                } catch (e2) {
                    console.error('[StorageProtection] 備份儲存也失敗:', e2);
                    return false;
                }
            }
        },

        // 讀取數據（支援備份恢復）
        load(key, fallback = null) {
            try {
                const value = localStorage.getItem(key);
                if (value !== null) return JSON.parse(value);
                
                // 嘗試從備份恢復
                const backup = sessionStorage.getItem(key + '_backup');
                if (backup !== null) {
                    const parsed = JSON.parse(backup);
                    // 恢復到 localStorage
                    localStorage.setItem(key, backup);
                    return parsed;
                }
            } catch (e) {
                console.warn('[StorageProtection] 讀取失敗:', key, e);
            }
            return fallback;
        },

        // 初始化應用程式的儲存保護
        initAppProtection(saveCallback) {
            const browser = this.browser;
            
            console.log('[StorageProtection] 瀏覽器檢測:', browser);

            // pagehide - iOS Safari 最可靠
            window.addEventListener('pagehide', (event) => {
                console.log('[StorageProtection] pagehide 觸發，保存數據...');
                if (saveCallback) saveCallback();
            });

            // visibilitychange - 頁面隱藏時保存
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden') {
                    console.log('[StorageProtection] visibilitychange(hidden) 觸發，保存數據...');
                    if (saveCallback) saveCallback();
                }
            });

            // beforeunload - 大多數瀏覽器支援
            window.addEventListener('beforeunload', () => {
                if (saveCallback) saveCallback();
            });

            // unload - 舊瀏覽器備用（某些瀏覽器可能只支援這個）
            window.addEventListener('unload', () => {
                if (saveCallback) saveCallback();
            });

            // freeze - Android Chrome 凍結事件
            if ('onfreeze' in document) {
                document.addEventListener('freeze', () => {
                    console.log('[StorageProtection] freeze 觸發，保存數據...');
                    if (saveCallback) saveCallback();
                });
            }

            // resume - 從凍結恢復時
            if ('onresume' in document) {
                document.addEventListener('resume', () => {
                    console.log('[StorageProtection] resume 觸發');
                });
            }

            // 監聽來自父視窗的關閉通知
            window.addEventListener('message', (event) => {
                if (event.data?.type === 'APP_WILL_CLOSE') {
                    console.log('[StorageProtection] APP_WILL_CLOSE 觸發，保存數據...');
                    if (saveCallback) saveCallback();
                }
            });

            // 針對 Via 瀏覽器的特殊處理
            if (browser.isVia) {
                console.log('[StorageProtection] Via 瀏覽器特殊處理已啟用');
                // 定期保存（每 5 秒）
                setInterval(() => {
                    if (saveCallback) saveCallback();
                }, 5000);
            }

            // 針對 X瀏覽器 的特殊處理
            if (browser.isXBrowser) {
                console.log('[StorageProtection] X瀏覽器特殊處理已啟用');
                // 定期保存（每 5 秒）
                setInterval(() => {
                    if (saveCallback) saveCallback();
                }, 5000);
            }

            // 請求持久化
            this.requestPersistence();
        }
    };

    const SettingsReader = {
        getApiConfigs() {
            return safeJsonParse(localStorage.getItem('api_configs'), []);
        },

        getActiveApiIndex() {
            const idx = localStorage.getItem('sx_active_api');
            if (idx === null) return 0;
            const parsed = parseInt(idx, 10);
            if (isNaN(parsed)) return 0;
            return parsed;
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

        getCharacters() {
            return safeJsonParse(localStorage.getItem('sx_characters'), []);
        },

        getUsers() {
            return safeJsonParse(localStorage.getItem('sx_users'), []);
        },

        getNpcs() {
            return safeJsonParse(localStorage.getItem('sx_npcs'), []);
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

        getWorldbookIndex() {
            return safeJsonParse(localStorage.getItem('sx_worldbook_index'), []);
        },

        getWorldbookMounts() {
            return safeJsonParse(localStorage.getItem('sx_worldbook_mounts'), []);
        },

        getWorldbookParts() {
            return {
                cot: safeJsonParse(localStorage.getItem('sx_worldbook_cot'), []),
                style: safeJsonParse(localStorage.getItem('sx_worldbook_style'), []),
                global: safeJsonParse(localStorage.getItem('sx_worldbook_global'), []),
                keywords: safeJsonParse(localStorage.getItem('sx_worldbook_keywords'), []),
                backend: safeJsonParse(localStorage.getItem('sx_worldbook_backend'), []),
                theater: safeJsonParse(localStorage.getItem('sx_worldbook_theater'), [])
            };
        },

        getCurrentUser() {
            return {
                name: localStorage.getItem('sx_user_name') || '',
                avatar: localStorage.getItem('sx_user_avatar') || '',
                personality: localStorage.getItem('sx_user_personality') || '',
                background: localStorage.getItem('sx_user_background') || ''
            };
        },

        getMasks() {
            return safeJsonParse(localStorage.getItem('sx_masks'), []);
        },

        getActiveMask() {
            const masks = this.getMasks();
            return masks[0] || null;
        },

        getCharByName(name) {
            if (!name) return null;
            const chars = this.getCharacters();
            return chars.find(c => c.name === name) || null;
        },

        getUserByName(name) {
            if (!name) return null;
            const users = this.getUsers();
            return users.find(u => u.name === name) || null;
        },

        getNpcByName(name) {
            if (!name) return null;
            const npcs = this.getNpcs();
            return npcs.find(n => n.name === name) || null;
        },

        getPersonaByName(name) {
            return this.getCharByName(name) || 
                   this.getUserByName(name) || 
                   this.getNpcByName(name) || null;
        },

        getActiveChar() {
            const charName = localStorage.getItem('sx_char_name') || '';
            if (charName) {
                const found = this.getCharByName(charName);
                if (found) return found;
            }
            const chars = this.getCharacters();
            return chars[0] || null;
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

    global.SxSettings = SettingsReader;
    global.getSxSettings = () => SettingsReader.getSettingsSnapshot();
    global.getActiveApiConfig = getActiveApiConfig;
    global.SettingsReader = SettingsReader;
    global.StorageProtection = StorageProtection;
    
    // 暴露語言處理模組
    global.SxLanguage = LanguageModule;
    global.getCurrentLang = () => LanguageModule.getCurrentLang();
    global.onLanguageChange = (callback) => LanguageModule.onUpdate(callback);
    global.offLanguageChange = (callback) => LanguageModule.offUpdate(callback);
    
    // 暴露外觀處理模組
    global.SxAppearance = AppearanceModule;
    global.getAppearanceConfig = () => AppearanceModule.getAppearanceConfig();
    global.onAppearanceChange = (callback) => AppearanceModule.onUpdate(callback);
    global.offAppearanceChange = (callback) => AppearanceModule.offUpdate(callback);
    global.applyAppearance = (config) => AppearanceModule.applyToPage(config);

    // 自動初始化語言監聯器
    LanguageModule.initListener();
    
    // 自動初始化外觀監聯器
    AppearanceModule.initListener();

})(typeof window !== 'undefined' ? window : globalThis);
