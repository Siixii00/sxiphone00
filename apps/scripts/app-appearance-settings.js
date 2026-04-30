(function(global) {
    'use strict';

    const STORAGE_KEY_PREFIX = 'sx_app_interface_';
    const CUSTOM_LIGHT_KEY = 'sx_app_interface_custom_light';
    const CUSTOM_DARK_KEY = 'sx_app_interface_custom_dark';
    const THEME_MODE_KEY = 'sx_theme_mode';
    const GLOBAL_APPEARANCE_SAVED = 'sx_global_appearance_saved';

    const defaultLightSettings = {
        bgColor: '#f2f2f7',
        cardBgColor: '#ffffff',
        textColor: '#1c1c1e',
        mutedColor: '#6e6e73',
        borderColor: '#d1d1d6',
        accentColor: '#007aff',
        fontFamily: "'SF Pro Display', sans-serif",
        fontSize: 14,
        headingSize: 22,
        lineHeight: 1.5,
        cardRadius: 12,
        cardPadding: 14,
        sectionGap: 12,
        btnRadius: 10,
        inputRadius: 10,
        shadow: 10,
        blur: 0,
        animationSpeed: 'normal',
        customCss: ''
    };

    const defaultDarkSettings = {
        bgColor: '#0b0c12',
        cardBgColor: '#12131b',
        textColor: '#e5e7eb',
        mutedColor: '#9ca3af',
        borderColor: '#1f2030',
        accentColor: '#5B8DEF',
        fontFamily: "'SF Pro Display', sans-serif",
        fontSize: 14,
        headingSize: 22,
        lineHeight: 1.5,
        cardRadius: 12,
        cardPadding: 14,
        sectionGap: 12,
        btnRadius: 10,
        inputRadius: 10,
        shadow: 25,
        blur: 0,
        animationSpeed: 'normal',
        customCss: ''
    };

    const safeJsonParse = (raw, fallback) => {
        if (!raw) return fallback;
        try {
            return JSON.parse(raw) ?? fallback;
        } catch {
            return fallback;
        }
    };

    const getThemeMode = () => {
        return localStorage.getItem(THEME_MODE_KEY) || 'dark';
    };

    const setThemeMode = (mode) => {
        localStorage.setItem(THEME_MODE_KEY, mode);
        window.parent?.postMessage({ type: 'THEME_MODE_CHANGED', mode }, '*');
        window.parent?.postMessage({ type: 'TRIGGER_GITHUB_SYNC' }, '*');
    };

    const getCustomLightSettings = () => {
        return safeJsonParse(localStorage.getItem(CUSTOM_LIGHT_KEY), { ...defaultLightSettings });
    };

    const getCustomDarkSettings = () => {
        return safeJsonParse(localStorage.getItem(CUSTOM_DARK_KEY), { ...defaultDarkSettings });
    };

    const saveCustomLightSettings = (settings) => {
        localStorage.setItem(CUSTOM_LIGHT_KEY, JSON.stringify(settings));
        window.parent?.postMessage({ type: 'TRIGGER_GITHUB_SYNC' }, '*');
    };

    const saveCustomDarkSettings = (settings) => {
        localStorage.setItem(CUSTOM_DARK_KEY, JSON.stringify(settings));
        window.parent?.postMessage({ type: 'TRIGGER_GITHUB_SYNC' }, '*');
    };

    const saveGlobalAppearance = (settings) => {
        localStorage.setItem(GLOBAL_APPEARANCE_SAVED, JSON.stringify(settings));
        window.parent?.postMessage({ type: 'TRIGGER_GITHUB_SYNC' }, '*');
    };

    const getSavedGlobalAppearance = () => {
        const saved = localStorage.getItem(GLOBAL_APPEARANCE_SAVED);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return null;
            }
        }
        return null;
    };

    const clearSavedGlobalAppearance = () => {
        localStorage.removeItem(GLOBAL_APPEARANCE_SAVED);
        window.parent?.postMessage({ type: 'TRIGGER_GITHUB_SYNC' }, '*');
    };

    const getCurrentSettings = () => {
        const savedGlobal = localStorage.getItem(GLOBAL_APPEARANCE_SAVED);
        if (savedGlobal) {
            try {
                const parsed = JSON.parse(savedGlobal);
                return parsed;
            } catch (e) {}
        }
        const mode = getThemeMode();
        switch (mode) {
            case 'light':
                return { ...defaultLightSettings };
            case 'custom-light':
                return getCustomLightSettings();
            case 'custom-dark':
                return getCustomDarkSettings();
            case 'dark':
            default:
                return { ...defaultDarkSettings };
        }
    };

    const getAppSettings = (appId) => {
        if (!appId || appId === 'global') {
            return getCurrentSettings();
        }
        const useGlobal = localStorage.getItem(`${STORAGE_KEY_PREFIX}${appId}_use_global`);
        if (useGlobal === 'true' || useGlobal === null) {
            return getCurrentSettings();
        }
        return safeJsonParse(localStorage.getItem(`${STORAGE_KEY_PREFIX}${appId}`), getCurrentSettings());
    };

    const getUseGlobal = (appId) => {
        if (!appId || appId === 'global') return true;
        const val = localStorage.getItem(`${STORAGE_KEY_PREFIX}${appId}_use_global`);
        return val === null || val === 'true';
    };

    const setUseGlobal = (appId, useGlobal) => {
        if (!appId || appId === 'global') return;
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${appId}_use_global`, useGlobal ? 'true' : 'false');
        window.parent?.postMessage({ type: 'TRIGGER_GITHUB_SYNC' }, '*');
    };

    const saveAppSettings = (appId, settings, themeType = null) => {
        if (!appId || appId === 'global') {
            const mode = themeType || getThemeMode();
            if (mode === 'custom-light') {
                saveCustomLightSettings(settings);
            } else if (mode === 'custom-dark') {
                saveCustomDarkSettings(settings);
            }
        } else {
            localStorage.setItem(`${STORAGE_KEY_PREFIX}${appId}`, JSON.stringify(settings));
        }
        window.parent?.postMessage({ type: 'TRIGGER_GITHUB_SYNC' }, '*');
    };

    const resetAppSettings = (appId) => {
        if (!appId || appId === 'global') {
            const mode = getThemeMode();
            if (mode === 'custom-light') {
                localStorage.setItem(CUSTOM_LIGHT_KEY, JSON.stringify(defaultLightSettings));
            } else if (mode === 'custom-dark') {
                localStorage.setItem(CUSTOM_DARK_KEY, JSON.stringify(defaultDarkSettings));
            }
        } else {
            localStorage.removeItem(`${STORAGE_KEY_PREFIX}${appId}`);
            localStorage.setItem(`${STORAGE_KEY_PREFIX}${appId}_use_global`, 'true');
        }
        window.parent?.postMessage({ type: 'TRIGGER_GITHUB_SYNC' }, '*');
    };

    const applySettingsToElement = (element, settings) => {
        const root = element || document.documentElement;
        const s = settings;

        root.style.setProperty('--app-bg-color', s.bgColor);
        root.style.setProperty('--app-card-bg', s.cardBgColor);
        root.style.setProperty('--app-text-color', s.textColor);
        root.style.setProperty('--app-muted-color', s.mutedColor);
        root.style.setProperty('--app-border-color', s.borderColor);
        root.style.setProperty('--app-accent-color', s.accentColor);
        root.style.setProperty('--app-font-family', s.fontFamily);
        root.style.setProperty('--app-font-size', s.fontSize + 'px');
        root.style.setProperty('--app-heading-size', s.headingSize + 'px');
        root.style.setProperty('--app-line-height', s.lineHeight);
        root.style.setProperty('--app-card-radius', s.cardRadius + 'px');
        root.style.setProperty('--app-card-padding', s.cardPadding + 'px');
        root.style.setProperty('--app-section-gap', s.sectionGap + 'px');
        root.style.setProperty('--app-btn-radius', s.btnRadius + 'px');
        root.style.setProperty('--app-input-radius', s.inputRadius + 'px');
        root.style.setProperty('--app-shadow', s.shadow);
        root.style.setProperty('--app-blur', s.blur + 'px');

        let styleEl = document.getElementById('sx-app-appearance-custom');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'sx-app-appearance-custom';
            document.head.appendChild(styleEl);
        }

        let css = `
            :root {
                --app-bg-color: ${s.bgColor};
                --app-card-bg: ${s.cardBgColor};
                --app-text-color: ${s.textColor};
                --app-muted-color: ${s.mutedColor};
                --app-border-color: ${s.borderColor};
                --app-accent-color: ${s.accentColor};
            }
            body, .app-container, .app-content, .page {
                background-color: ${s.bgColor};
                color: ${s.textColor};
                font-family: ${s.fontFamily};
                font-size: ${s.fontSize}px;
                line-height: ${s.lineHeight};
            }
            .card, .modal, .bubble, .section-card {
                background-color: ${s.cardBgColor};
                border-radius: ${s.cardRadius}px;
                padding: ${s.cardPadding}px;
                border: 1px solid ${s.borderColor};
            }
            .secondary-text, .hint, .label, .muted {
                color: ${s.mutedColor};
            }
            h1, h2, h3, .heading, .title, .panel-title {
                color: ${s.textColor};
                font-size: ${s.headingSize}px;
            }
            a, .link, .accent-text, .primary {
                color: ${s.accentColor};
            }
            button.primary, .primary-btn {
                background-color: ${s.accentColor};
                border-radius: ${s.btnRadius}px;
            }
            button.ghost, .ghost-btn {
                border-radius: ${s.btnRadius}px;
                border-color: ${s.borderColor};
            }
            input, textarea, select {
                border-radius: ${s.inputRadius}px;
                border-color: ${s.borderColor};
                background-color: ${s.cardBgColor};
                color: ${s.textColor};
            }
            .icon-btn, .icon-btn i, button.icon-btn, button.icon-btn i, .weverse-app .icon-btn, .weverse-app .icon-btn i {
                color: ${s.textColor} !important;
            }
            .section, section {
                margin-bottom: ${s.sectionGap}px;
            }
        `;

        if (s.shadow > 0) {
            css += `.card, .modal { box-shadow: 0 ${Math.round(s.shadow / 5)}px ${s.shadow}px rgba(0,0,0,0.3); }`;
        }

        if (s.blur > 0) {
            css += `.card, .modal { backdrop-filter: blur(${s.blur}px); }`;
        }

        const animationDurations = { none: '0s', fast: '0.15s', normal: '0.25s', slow: '0.4s' };
        const duration = animationDurations[s.animationSpeed] || '0.25s';
        if (s.animationSpeed !== 'none') {
            css += `*, *::before, *::after { transition-duration: ${duration}; }`;
        }

        if (s.customCss && s.customCss.trim()) {
            css += s.customCss;
        }

        styleEl.textContent = css;
    };

    const createPanelHTML = (appId, appName) => {
        const mode = getThemeMode();
        const isCustomMode = mode === 'custom-light' || mode === 'custom-dark';
        const settings = getAppSettings(appId);
        const useGlobal = appId !== 'global' ? getUseGlobal(appId) : false;
        const isGlobal = appId === 'global';

        let themeTypeLabel = '';
        if (isGlobal) {
            if (mode === 'custom-light') themeTypeLabel = '自訂淺色';
            else if (mode === 'custom-dark') themeTypeLabel = '自訂深色';
            else if (mode === 'light') themeTypeLabel = '淺色（預設）';
            else themeTypeLabel = '深色（預設）';
        }

        return `
            <div class="sx-app-appearance-panel" id="sx-app-appearance-panel">
                <div class="sx-panel-header">
                    <button class="sx-panel-back" id="sx-appearance-back" type="button">
                        <i class="fas fa-chevron-left"></i> 返回
                    </button>
                    <div class="sx-panel-title">外觀設定${isGlobal && themeTypeLabel ? ` - ${themeTypeLabel}` : ''}</div>
                    <div style="width:60px"></div>
                </div>
                
                <div class="sx-panel-content">
                    ${!isGlobal ? `
                    <div class="sx-toggle-row">
                        <label>
                            <span>使用全域設定</span>
                            <input type="checkbox" id="sx-use-global" ${useGlobal ? 'checked' : ''}>
                        </label>
                    </div>
                    <div class="sx-divider"></div>
                    ` : ''}
                    
                    ${isGlobal && !isCustomMode ? `
                    <div class="sx-info-box">
                        <i class="fas fa-info-circle"></i>
                        <span>此為預設模式，無法修改。請切換到「自訂淺色」或「自訂深色」後再進行調整。</span>
                    </div>
                    ` : ''}
                    
                    <div class="sx-settings-section ${!isGlobal && useGlobal ? 'sx-disabled' : ''} ${isGlobal && !isCustomMode ? 'sx-disabled' : ''}" id="sx-settings-area">
                        <div class="sx-section-title">顏色設定</div>
                        <div class="sx-color-grid">
                            <label class="sx-field">
                                <span>應用背景色</span>
                                <input type="color" id="sx-bg-color" value="${settings.bgColor}">
                            </label>
                            <label class="sx-field">
                                <span>卡片背景色</span>
                                <input type="color" id="sx-card-bg-color" value="${settings.cardBgColor}">
                            </label>
                            <label class="sx-field">
                                <span>主要文字色</span>
                                <input type="color" id="sx-text-color" value="${settings.textColor}">
                            </label>
                            <label class="sx-field">
                                <span>次要文字色</span>
                                <input type="color" id="sx-muted-color" value="${settings.mutedColor}">
                            </label>
                            <label class="sx-field">
                                <span>邊框顏色</span>
                                <input type="color" id="sx-border-color" value="${settings.borderColor}">
                            </label>
                            <label class="sx-field">
                                <span>強調色</span>
                                <input type="color" id="sx-accent-color" value="${settings.accentColor}">
                            </label>
                        </div>
                        
                        <div class="sx-section-title">字體與大小</div>
                        <label class="sx-field sx-field-row">
                            <span>應用字體</span>
                            <select id="sx-font-family">
                                <option value="'SF Pro Display', sans-serif" ${settings.fontFamily.includes('SF Pro') ? 'selected' : ''}>SF Pro Display</option>
                                <option value="'PingFang TC', sans-serif" ${settings.fontFamily.includes('PingFang') ? 'selected' : ''}>PingFang TC</option>
                                <option value="'Noto Sans TC', sans-serif" ${settings.fontFamily.includes('Noto Sans') ? 'selected' : ''}>Noto Sans TC</option>
                                <option value="'Microsoft JhengHei', sans-serif" ${settings.fontFamily.includes('JhengHei') ? 'selected' : ''}>微軟正黑體</option>
                                <option value="system-ui, sans-serif" ${settings.fontFamily.includes('system-ui') ? 'selected' : ''}>系統預設</option>
                            </select>
                        </label>
                        <label class="sx-field sx-field-row">
                            <span>基礎字體大小</span>
                            <input type="range" id="sx-font-size" min="12" max="18" step="1" value="${settings.fontSize}">
                            <span class="sx-range-val" id="sx-font-size-val">${settings.fontSize}px</span>
                        </label>
                        <label class="sx-field sx-field-row">
                            <span>標題字體大小</span>
                            <input type="range" id="sx-heading-size" min="16" max="28" step="1" value="${settings.headingSize}">
                            <span class="sx-range-val" id="sx-heading-size-val">${settings.headingSize}px</span>
                        </label>
                        <label class="sx-field sx-field-row">
                            <span>行高</span>
                            <input type="range" id="sx-line-height" min="1.2" max="2" step="0.1" value="${settings.lineHeight}">
                            <span class="sx-range-val" id="sx-line-height-val">${settings.lineHeight}</span>
                        </label>
                        
                        <div class="sx-section-title">排版設定</div>
                        <label class="sx-field sx-field-row">
                            <span>卡片圓角</span>
                            <input type="range" id="sx-card-radius" min="0" max="24" step="2" value="${settings.cardRadius}">
                            <span class="sx-range-val" id="sx-card-radius-val">${settings.cardRadius}px</span>
                        </label>
                        <label class="sx-field sx-field-row">
                            <span>卡片內距</span>
                            <input type="range" id="sx-card-padding" min="8" max="24" step="2" value="${settings.cardPadding}">
                            <span class="sx-range-val" id="sx-card-padding-val">${settings.cardPadding}px</span>
                        </label>
                        <label class="sx-field sx-field-row">
                            <span>區塊間距</span>
                            <input type="range" id="sx-section-gap" min="8" max="24" step="2" value="${settings.sectionGap}">
                            <span class="sx-range-val" id="sx-section-gap-val">${settings.sectionGap}px</span>
                        </label>
                        <label class="sx-field sx-field-row">
                            <span>按鈕圓角</span>
                            <input type="range" id="sx-btn-radius" min="4" max="20" step="1" value="${settings.btnRadius}">
                            <span class="sx-range-val" id="sx-btn-radius-val">${settings.btnRadius}px</span>
                        </label>
                        <label class="sx-field sx-field-row">
                            <span>輸入框圓角</span>
                            <input type="range" id="sx-input-radius" min="4" max="20" step="1" value="${settings.inputRadius}">
                            <span class="sx-range-val" id="sx-input-radius-val">${settings.inputRadius}px</span>
                        </label>
                        
                        <div class="sx-section-title">特效設定</div>
                        <label class="sx-field sx-field-row">
                            <span>卡片陰影強度</span>
                            <input type="range" id="sx-shadow" min="0" max="50" step="5" value="${settings.shadow}">
                            <span class="sx-range-val" id="sx-shadow-val">${settings.shadow}</span>
                        </label>
                        <label class="sx-field sx-field-row">
                            <span>背景模糊</span>
                            <input type="range" id="sx-blur" min="0" max="20" step="1" value="${settings.blur}">
                            <span class="sx-range-val" id="sx-blur-val">${settings.blur}px</span>
                        </label>
                        <label class="sx-field sx-field-row">
                            <span>動畫速度</span>
                            <select id="sx-animation-speed">
                                <option value="none" ${settings.animationSpeed === 'none' ? 'selected' : ''}>無動畫</option>
                                <option value="fast" ${settings.animationSpeed === 'fast' ? 'selected' : ''}>快速 (0.15s)</option>
                                <option value="normal" ${settings.animationSpeed === 'normal' ? 'selected' : ''}>正常 (0.25s)</option>
                                <option value="slow" ${settings.animationSpeed === 'slow' ? 'selected' : ''}>慢速 (0.4s)</option>
                            </select>
                        </label>
                        
                        <div class="sx-section-title">進階設定</div>
                        <label class="sx-field">
                            <span>自訂 CSS</span>
                        </label>
                        <textarea id="sx-custom-css" rows="4" placeholder="輸入自訂 CSS...">${settings.customCss || ''}</textarea>
                    </div>
                    
                    <div class="sx-panel-actions">
                        <button class="sx-btn sx-btn-ghost" id="sx-reset-btn" type="button">重置</button>
                        <button class="sx-btn sx-btn-ghost" id="sx-save-btn" type="button" style="background:#34C759;color:#fff;border-color:#34C759;">儲存外觀設定</button>
                        <button class="sx-btn sx-btn-primary" id="sx-apply-btn" type="button">套用</button>
                    </div>
                </div>
            </div>
        `;
    };

    const initPanelEvents = (appId, panel, onClose) => {
        const useGlobalCheckbox = panel.querySelector('#sx-use-global');
        const settingsArea = panel.querySelector('#sx-settings-area');
        const backBtn = panel.querySelector('#sx-appearance-back');
        const resetBtn = panel.querySelector('#sx-reset-btn');
        const saveBtn = panel.querySelector('#sx-save-btn');
        const applyBtn = panel.querySelector('#sx-apply-btn');

        const rangeInputs = [
            { id: 'sx-font-size', valId: 'sx-font-size-val', suffix: 'px' },
            { id: 'sx-heading-size', valId: 'sx-heading-size-val', suffix: 'px' },
            { id: 'sx-line-height', valId: 'sx-line-height-val', suffix: '' },
            { id: 'sx-card-radius', valId: 'sx-card-radius-val', suffix: 'px' },
            { id: 'sx-card-padding', valId: 'sx-card-padding-val', suffix: 'px' },
            { id: 'sx-section-gap', valId: 'sx-section-gap-val', suffix: 'px' },
            { id: 'sx-btn-radius', valId: 'sx-btn-radius-val', suffix: 'px' },
            { id: 'sx-input-radius', valId: 'sx-input-radius-val', suffix: 'px' },
            { id: 'sx-shadow', valId: 'sx-shadow-val', suffix: '' },
            { id: 'sx-blur', valId: 'sx-blur-val', suffix: 'px' }
        ];

        rangeInputs.forEach(({ id, valId, suffix }) => {
            const input = panel.querySelector(`#${id}`);
            const valSpan = panel.querySelector(`#${valId}`);
            if (input && valSpan) {
                input.addEventListener('input', () => {
                    valSpan.textContent = input.value + suffix;
                });
            }
        });

        if (useGlobalCheckbox && settingsArea) {
            useGlobalCheckbox.addEventListener('change', () => {
                const useGlobal = useGlobalCheckbox.checked;
                settingsArea.classList.toggle('sx-disabled', useGlobal);
                setUseGlobal(appId, useGlobal);
                if (useGlobal) {
                    const currentSettings = getCurrentSettings();
                    populateSettings(panel, currentSettings);
                    applySettingsToElement(null, currentSettings);
                }
            });
        }

        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (onClose) onClose();
                else panel.remove();
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                const mode = getThemeMode();
                let defaultSettings = mode === 'custom-light' ? defaultLightSettings : defaultDarkSettings;
                if (appId !== 'global') {
                    defaultSettings = getCurrentSettings();
                }
                resetAppSettings(appId);
                const settings = appId === 'global' ? getCurrentSettings() : getAppSettings(appId);
                populateSettings(panel, settings);
                applySettingsToElement(null, settings);
            });
        }

        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                const newSettings = collectSettings(panel);
                const mode = getThemeMode();
                saveAppSettings(appId, newSettings, mode);
                applySettingsToElement(null, newSettings);
                
                if (appId === 'global' && (mode === 'custom-light' || mode === 'custom-dark')) {
                    window.parent?.postMessage({ 
                        type: 'CUSTOM_THEME_UPDATED', 
                        mode: mode,
                        settings: newSettings 
                    }, '*');
                }
                
                if (onClose) onClose();
            });
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const newSettings = collectSettings(panel);
                const mode = getThemeMode();
                saveGlobalAppearance(newSettings);
                saveAppSettings(appId, newSettings, mode);
                applySettingsToElement(null, newSettings);
                
                if (appId === 'global') {
                    window.parent?.postMessage({ 
                        type: 'GLOBAL_APPEARANCE_SAVED', 
                        mode: mode,
                        settings: newSettings 
                    }, '*');
                }
                
                const toast = document.createElement('div');
                toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#34C759;color:#fff;padding:12px 24px;border-radius:20px;font-size:14px;z-index:10000;animation:fadeIn 0.3s;';
                toast.textContent = '外觀設定已儲存';
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 2000);
            });
        }
    };

    const populateSettings = (panel, settings) => {
        const fields = {
            'sx-bg-color': settings.bgColor,
            'sx-card-bg-color': settings.cardBgColor,
            'sx-text-color': settings.textColor,
            'sx-muted-color': settings.mutedColor,
            'sx-border-color': settings.borderColor,
            'sx-accent-color': settings.accentColor,
            'sx-font-size': settings.fontSize,
            'sx-heading-size': settings.headingSize,
            'sx-line-height': settings.lineHeight,
            'sx-card-radius': settings.cardRadius,
            'sx-card-padding': settings.cardPadding,
            'sx-section-gap': settings.sectionGap,
            'sx-btn-radius': settings.btnRadius,
            'sx-input-radius': settings.inputRadius,
            'sx-shadow': settings.shadow,
            'sx-blur': settings.blur
        };

        Object.entries(fields).forEach(([id, value]) => {
            const el = panel.querySelector(`#${id}`);
            if (el) el.value = value;
        });

        const fontFamilySelect = panel.querySelector('#sx-font-family');
        if (fontFamilySelect) {
            fontFamilySelect.value = settings.fontFamily;
        }

        const animationSelect = panel.querySelector('#sx-animation-speed');
        if (animationSelect) {
            animationSelect.value = settings.animationSpeed;
        }

        const customCss = panel.querySelector('#sx-custom-css');
        if (customCss) {
            customCss.value = settings.customCss || '';
        }

        const rangeVals = {
            'sx-font-size-val': settings.fontSize + 'px',
            'sx-heading-size-val': settings.headingSize + 'px',
            'sx-line-height-val': settings.lineHeight,
            'sx-card-radius-val': settings.cardRadius + 'px',
            'sx-card-padding-val': settings.cardPadding + 'px',
            'sx-section-gap-val': settings.sectionGap + 'px',
            'sx-btn-radius-val': settings.btnRadius + 'px',
            'sx-input-radius-val': settings.inputRadius + 'px',
            'sx-shadow-val': settings.shadow,
            'sx-blur-val': settings.blur + 'px'
        };

        Object.entries(rangeVals).forEach(([id, val]) => {
            const el = panel.querySelector(`#${id}`);
            if (el) el.textContent = val;
        });
    };

    const collectSettings = (panel) => {
        return {
            bgColor: panel.querySelector('#sx-bg-color')?.value || defaultDarkSettings.bgColor,
            cardBgColor: panel.querySelector('#sx-card-bg-color')?.value || defaultDarkSettings.cardBgColor,
            textColor: panel.querySelector('#sx-text-color')?.value || defaultDarkSettings.textColor,
            mutedColor: panel.querySelector('#sx-muted-color')?.value || defaultDarkSettings.mutedColor,
            borderColor: panel.querySelector('#sx-border-color')?.value || defaultDarkSettings.borderColor,
            accentColor: panel.querySelector('#sx-accent-color')?.value || defaultDarkSettings.accentColor,
            fontFamily: panel.querySelector('#sx-font-family')?.value || defaultDarkSettings.fontFamily,
            fontSize: parseInt(panel.querySelector('#sx-font-size')?.value) || defaultDarkSettings.fontSize,
            headingSize: parseInt(panel.querySelector('#sx-heading-size')?.value) || defaultDarkSettings.headingSize,
            lineHeight: parseFloat(panel.querySelector('#sx-line-height')?.value) || defaultDarkSettings.lineHeight,
            cardRadius: parseInt(panel.querySelector('#sx-card-radius')?.value) || defaultDarkSettings.cardRadius,
            cardPadding: parseInt(panel.querySelector('#sx-card-padding')?.value) || defaultDarkSettings.cardPadding,
            sectionGap: parseInt(panel.querySelector('#sx-section-gap')?.value) || defaultDarkSettings.sectionGap,
            btnRadius: parseInt(panel.querySelector('#sx-btn-radius')?.value) || defaultDarkSettings.btnRadius,
            inputRadius: parseInt(panel.querySelector('#sx-input-radius')?.value) || defaultDarkSettings.inputRadius,
            shadow: parseInt(panel.querySelector('#sx-shadow')?.value) || defaultDarkSettings.shadow,
            blur: parseInt(panel.querySelector('#sx-blur')?.value) || defaultDarkSettings.blur,
            animationSpeed: panel.querySelector('#sx-animation-speed')?.value || defaultDarkSettings.animationSpeed,
            customCss: panel.querySelector('#sx-custom-css')?.value || ''
        };
    };

    const openAppearancePanel = (appId, container, onClose) => {
        const currentAppId = appId || 'global';
        const html = createPanelHTML(currentAppId, '');
        
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        const panel = wrapper.firstElementChild;
        
        if (container) {
            container.appendChild(panel);
        } else {
            document.body.appendChild(panel);
        }
        
        initPanelEvents(currentAppId, panel, onClose);
        
        return panel;
    };

    const initAppearanceForApp = (appId) => {
        const settings = getAppSettings(appId);
        applySettingsToElement(null, settings);
        
        window.addEventListener('message', (event) => {
            const data = event.data;
            if (!data || typeof data !== 'object') return;
            
            if (data.type === 'THEME_MODE_CHANGED') {
                // 如果帶有 settings，直接使用
                if (data.settings && getUseGlobal(appId)) {
                    applySettingsToElement(null, data.settings);
                } else if (getUseGlobal(appId)) {
                    const newSettings = getCurrentSettings();
                    applySettingsToElement(null, newSettings);
                }
            }
            
            if (data.type === 'CUSTOM_THEME_UPDATED') {
                if (getUseGlobal(appId)) {
                    applySettingsToElement(null, data.settings);
                }
            }
        });
    };

    global.SxAppAppearance = {
        getThemeMode,
        setThemeMode,
        getCustomLightSettings,
        getCustomDarkSettings,
        saveCustomLightSettings,
        saveCustomDarkSettings,
        getCurrentSettings,
        getAppSettings,
        getUseGlobal,
        setUseGlobal,
        saveAppSettings,
        resetAppSettings,
        applySettingsToElement,
        createPanelHTML,
        openAppearancePanel,
        initAppearanceForApp,
        saveGlobalAppearance,
        getSavedGlobalAppearance,
        clearSavedGlobalAppearance,
        defaultLightSettings,
        defaultDarkSettings
    };

})(typeof window !== 'undefined' ? window : globalThis);
