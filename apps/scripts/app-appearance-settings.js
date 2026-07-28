(function(global) {
    'use strict';

    const STORAGE_KEY_PREFIX = 'sx_app_interface_';
    const CUSTOM_LIGHT_KEY = 'sx_app_interface_custom_light';
    const CUSTOM_DARK_KEY = 'sx_app_interface_custom_dark';
    const THEME_MODE_KEY = 'sx_theme_mode';
    const GLOBAL_APPEARANCE_SAVED = 'sx_global_appearance_saved';
    const APP_CONFIG_REGISTRY_KEY = 'sx_app_config_registry';

    const appConfigRegistry = {};

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

    const getThemeMode = async () => {
        return await sxGetItem(THEME_MODE_KEY) || 'dark';
    };

    const setThemeMode = async (mode) => {
        await sxSetItem(THEME_MODE_KEY, mode);
        window.parent?.postMessage({ type: 'THEME_MODE_CHANGED', mode }, '*');
        window.parent?.postMessage({ type: 'TRIGGER_GITHUB_SYNC' }, '*');
    };

    const getCustomLightSettings = async () => {
        const raw = await sxGetItem(CUSTOM_LIGHT_KEY);
        return safeJsonParse(raw, { ...defaultLightSettings });
    };

    const getCustomDarkSettings = async () => {
        const raw = await sxGetItem(CUSTOM_DARK_KEY);
        return safeJsonParse(raw, { ...defaultDarkSettings });
    };

    const saveCustomLightSettings = async (settings) => {
        await sxSetJSON(CUSTOM_LIGHT_KEY, settings);
        window.parent?.postMessage({ type: 'TRIGGER_GITHUB_SYNC' }, '*');
    };

    const saveCustomDarkSettings = async (settings) => {
        await sxSetJSON(CUSTOM_DARK_KEY, settings);
        window.parent?.postMessage({ type: 'TRIGGER_GITHUB_SYNC' }, '*');
    };

    const saveGlobalAppearance = async (settings) => {
        await sxSetJSON(GLOBAL_APPEARANCE_SAVED, settings);
        window.parent?.postMessage({ type: 'TRIGGER_GITHUB_SYNC' }, '*');
    };

    const getSavedGlobalAppearance = async () => {
        return await sxGetJSON(GLOBAL_APPEARANCE_SAVED);
    };

    const clearSavedGlobalAppearance = async () => {
        await sxRemoveItem(GLOBAL_APPEARANCE_SAVED);
        window.parent?.postMessage({ type: 'TRIGGER_GITHUB_SYNC' }, '*');
    };

    const getCurrentSettings = async () => {
        const savedGlobal = await sxGetJSON(GLOBAL_APPEARANCE_SAVED);
        if (savedGlobal) {
            return savedGlobal;
        }
        const mode = await getThemeMode();
        switch (mode) {
            case 'light':
                return { ...defaultLightSettings };
            case 'custom-light':
                return await getCustomLightSettings();
            case 'custom-dark':
                return await getCustomDarkSettings();
            case 'dark':
            default:
                return { ...defaultDarkSettings };
        }
    };

    const getAppSettings = async (appId) => {
        if (!appId || appId === 'global') {
            return await getCurrentSettings();
        }
        const useGlobal = await sxGetItem(`${STORAGE_KEY_PREFIX}${appId}_use_global`);
        if (useGlobal === 'true' || useGlobal === null) {
            return await getCurrentSettings();
        }
        const raw = await sxGetItem(`${STORAGE_KEY_PREFIX}${appId}`);
        return safeJsonParse(raw, await getCurrentSettings());
    };

    const getUseGlobal = async (appId) => {
        if (!appId || appId === 'global') return true;
        const val = await sxGetItem(`${STORAGE_KEY_PREFIX}${appId}_use_global`);
        return val === null || val === 'true';
    };

    const setUseGlobal = async (appId, useGlobal) => {
        if (!appId || appId === 'global') return;
        await sxSetItem(`${STORAGE_KEY_PREFIX}${appId}_use_global`, useGlobal ? 'true' : 'false');
        window.parent?.postMessage({ type: 'TRIGGER_GITHUB_SYNC' }, '*');
    };

    const saveAppSettings = async (appId, settings, themeType = null) => {
        if (!appId || appId === 'global') {
            const mode = themeType || await getThemeMode();
            if (mode === 'custom-light') {
                await saveCustomLightSettings(settings);
            } else if (mode === 'custom-dark') {
                await saveCustomDarkSettings(settings);
            }
        } else {
            await sxSetJSON(`${STORAGE_KEY_PREFIX}${appId}`, settings);
        }
        window.parent?.postMessage({ type: 'TRIGGER_GITHUB_SYNC' }, '*');
    };

    const resetAppSettings = async (appId) => {
        if (!appId || appId === 'global') {
            const mode = await getThemeMode();
            if (mode === 'custom-light') {
                await sxSetJSON(CUSTOM_LIGHT_KEY, defaultLightSettings);
            } else if (mode === 'custom-dark') {
                await sxSetJSON(CUSTOM_DARK_KEY, defaultDarkSettings);
            }
        } else {
            await sxRemoveItem(`${STORAGE_KEY_PREFIX}${appId}`);
            await sxSetItem(`${STORAGE_KEY_PREFIX}${appId}_use_global`, 'true');
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

    const createPanelHTML = async (appId, appName) => {
        const mode = await getThemeMode();
        const isCustomMode = mode === 'custom-light' || mode === 'custom-dark';
        const settings = await getAppSettings(appId);
        const useGlobal = appId !== 'global' ? await getUseGlobal(appId) : false;
        const isGlobal = appId === 'global';
        const appConfig = getAppConfig(appId);
        const hasAppSpecific = appConfig && Object.keys(appConfig.settings || {}).length > 0;

        let themeTypeLabel = '';
        if (isGlobal) {
            if (mode === 'custom-light') themeTypeLabel = '自訂淺色';
            else if (mode === 'custom-dark') themeTypeLabel = '自訂深色';
            else if (mode === 'light') themeTypeLabel = '淺色（預設）';
            else themeTypeLabel = '深色（預設）';
        }
        
        const appSpecificHTML = hasAppSpecific ? createAppSpecificPanelHTML(appId) : '';

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
                        
                        ${hasAppSpecific ? appSpecificHTML : ''}
                        
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
        const appConfig = getAppConfig(appId);

        const applyPreview = () => {
            const newSettings = collectSettings(panel);
            const appSpecificSettings = collectAppSpecificSettings(appId, panel);
            const mergedSettings = { ...newSettings, ...appSpecificSettings };
            applySettingsToElement(null, mergedSettings);
            applyAppSpecificCss(appId, mergedSettings);
        };

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
                    applyPreview();
                });
            }
        });

        const colorInputs = [
            'sx-bg-color', 'sx-card-bg-color', 'sx-text-color', 'sx-muted-color',
            'sx-border-color', 'sx-accent-color'
        ];
        colorInputs.forEach(id => {
            const input = panel.querySelector(`#${id}`);
            if (input) {
                input.addEventListener('input', applyPreview);
            }
        });

        const selectInputs = ['sx-font-family', 'sx-animation-speed'];
        selectInputs.forEach(id => {
            const select = panel.querySelector(`#${id}`);
            if (select) {
                select.addEventListener('change', applyPreview);
            }
        });

        const customCss = panel.querySelector('#sx-custom-css');
        if (customCss) {
            customCss.addEventListener('input', applyPreview);
        }

        if (appConfig && appConfig.settings) {
            Object.keys(appConfig.settings).forEach(key => {
                const settingDef = appConfig.settings[key];
                const input = panel.querySelector(`#sx-app-${key}`);
                const valSpan = panel.querySelector(`#sx-app-${key}-val`);
                if (input) {
                    if (settingDef.type === 'range') {
                        input.addEventListener('input', () => {
                            if (valSpan) {
                                valSpan.textContent = input.value + (settingDef.unit || '');
                            }
                            applyPreview();
                        });
                    } else if (settingDef.type === 'color' || settingDef.type === 'select') {
                        input.addEventListener('input', applyPreview);
                        input.addEventListener('change', applyPreview);
                    } else if (settingDef.type === 'toggle') {
                        input.addEventListener('change', applyPreview);
                    }
                }
            });
        }

        if (useGlobalCheckbox && settingsArea) {
            useGlobalCheckbox.addEventListener('change', async () => {
                const useGlobal = useGlobalCheckbox.checked;
                settingsArea.classList.toggle('sx-disabled', useGlobal);
                await setUseGlobal(appId, useGlobal);
                if (useGlobal) {
                    const currentSettings = await getCurrentSettings();
                    populateSettings(panel, currentSettings);
                    populateAppSpecificSettings(appId, panel, currentSettings);
                    applySettingsToElement(null, currentSettings);
                    applyAppSpecificCss(appId, currentSettings);
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
            resetBtn.addEventListener('click', async () => {
                const mode = await getThemeMode();
                let defaultSettings = mode === 'custom-light' ? defaultLightSettings : defaultDarkSettings;
                if (appId !== 'global') {
                    defaultSettings = await getCurrentSettings();
                }
                await resetAppSettings(appId);
                const settings = appId === 'global' ? await getCurrentSettings() : await getAppSettings(appId);
                populateSettings(panel, settings);
                populateAppSpecificSettings(appId, panel, settings);
                applySettingsToElement(null, settings);
                applyAppSpecificCss(appId, settings);
            });
        }

        if (applyBtn) {
            applyBtn.addEventListener('click', async () => {
                const newSettings = collectSettings(panel);
                const appSpecificSettings = collectAppSpecificSettings(appId, panel);
                const mergedSettings = { ...newSettings, ...appSpecificSettings };
                const mode = await getThemeMode();
                await saveAppSettings(appId, mergedSettings, mode);
                applySettingsToElement(null, mergedSettings);
                applyAppSpecificCss(appId, mergedSettings);
                
                if (appId === 'global' && (mode === 'custom-light' || mode === 'custom-dark')) {
                    window.parent?.postMessage({ 
                        type: 'CUSTOM_THEME_UPDATED', 
                        mode: mode,
                        settings: mergedSettings 
                    }, '*');
                }
                
                window.parent?.postMessage({
                    type: 'APP_APPEARANCE_UPDATED',
                    appId: appId,
                    settings: mergedSettings
                }, '*');
                
                if (onClose) onClose();
            });
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                const newSettings = collectSettings(panel);
                const appSpecificSettings = collectAppSpecificSettings(appId, panel);
                const mergedSettings = { ...newSettings, ...appSpecificSettings };
                const mode = await getThemeMode();
                await saveGlobalAppearance(mergedSettings);
                await saveAppSettings(appId, mergedSettings, mode);
                applySettingsToElement(null, mergedSettings);
                applyAppSpecificCss(appId, mergedSettings);
                
                if (appId === 'global') {
                    window.parent?.postMessage({ 
                        type: 'GLOBAL_APPEARANCE_SAVED', 
                        mode: mode,
                        settings: mergedSettings 
                    }, '*');
                }
                
                window.parent?.postMessage({
                    type: 'APP_APPEARANCE_UPDATED',
                    appId: appId,
                    settings: mergedSettings
                }, '*');
                
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

    const openAppearancePanel = async (appId, container, onClose) => {
        const currentAppId = appId || 'global';
        const html = await createPanelHTML(currentAppId, '');
        
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

    const initAppearanceForApp = async (appId) => {
        const settings = await getAppSettings(appId);
        applySettingsToElement(null, settings);
        applyAppSpecificCss(appId, settings);
        
        window.addEventListener('message', async (event) => {
            const data = event.data;
            if (!data || typeof data !== 'object') return;
            
            if (data.type === 'THEME_MODE_CHANGED') {
                const useGlobal = await getUseGlobal(appId);
                if (data.settings && useGlobal) {
                    applySettingsToElement(null, data.settings);
                    applyAppSpecificCss(appId, data.settings);
                } else if (useGlobal) {
                    const newSettings = await getCurrentSettings();
                    applySettingsToElement(null, newSettings);
                    applyAppSpecificCss(appId, newSettings);
                }
            }
            
            if (data.type === 'CUSTOM_THEME_UPDATED') {
                const useGlobal = await getUseGlobal(appId);
                if (useGlobal) {
                    applySettingsToElement(null, data.settings);
                    applyAppSpecificCss(appId, data.settings);
                }
            }
            
            if (data.type === 'APP_APPEARANCE_UPDATED' && data.appId === appId) {
                applySettingsToElement(null, data.settings);
                applyAppSpecificCss(appId, data.settings);
            }
        });
    };

    const registerAppConfig = (appId, config) => {
        if (!appId || !config) return;
        appConfigRegistry[appId] = {
            name: config.name || appId,
            settings: config.settings || {}
        };
    };

    const getAppConfig = (appId) => {
        return appConfigRegistry[appId] || null;
    };

    const getAllAppConfigs = () => {
        return { ...appConfigRegistry };
    };

    const getMergedSettings = async (appId) => {
        const globalSettings = await getCurrentSettings();
        const appConfig = getAppConfig(appId);
        
        if (!appConfig || await getUseGlobal(appId)) {
            return globalSettings;
        }
        
        const appSettings = await getAppSettings(appId);
        const merged = { ...globalSettings, ...appSettings };
        
        if (appConfig.settings) {
            Object.keys(appConfig.settings).forEach(key => {
                const settingDef = appConfig.settings[key];
                if (settingDef.cssVar && merged[key] !== undefined) {
                    merged[`_cssVar_${key}`] = settingDef.cssVar;
                }
            });
        }
        
        return merged;
    };

    const applyAppSpecificCss = (appId, settings) => {
        const appConfig = getAppConfig(appId);
        if (!appConfig || !appConfig.settings) return;
        
        let customCss = '';
        Object.keys(appConfig.settings).forEach(key => {
            const settingDef = appConfig.settings[key];
            if (settingDef.cssVar && settings[key] !== undefined) {
                let value = settings[key];
                if (settingDef.unit) {
                    value = value + settingDef.unit;
                }
                customCss += `${settingDef.cssVar}: ${value};\n`;
            }
        });
        
        if (customCss) {
            let styleEl = document.getElementById('sx-app-specific-styles');
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = 'sx-app-specific-styles';
                document.head.appendChild(styleEl);
            }
            styleEl.textContent = `:root {\n${customCss}}`;
        }
    };

    const createAppSpecificPanelHTML = (appId) => {
        const appConfig = getAppConfig(appId);
        if (!appConfig || !appConfig.settings) return '';
        
        let html = '<div class="sx-section-title">應用程式專屬設定</div>';
        
        Object.keys(appConfig.settings).forEach(key => {
            const settingDef = appConfig.settings[key];
            const currentValue = getAppSettings(appId)[key] || settingDef.default;
            
            switch (settingDef.type) {
                case 'color':
                    html += `
                        <label class="sx-field sx-field-row">
                            <span>${settingDef.label}</span>
                            <input type="color" id="sx-app-${key}" value="${currentValue}">
                        </label>
                    `;
                    break;
                case 'range':
                    html += `
                        <label class="sx-field sx-field-row">
                            <span>${settingDef.label}</span>
                            <input type="range" id="sx-app-${key}" min="${settingDef.min || 0}" max="${settingDef.max || 100}" step="${settingDef.step || 1}" value="${currentValue}">
                            <span class="sx-range-val" id="sx-app-${key}-val">${currentValue}${settingDef.unit || ''}</span>
                        </label>
                    `;
                    break;
                case 'select':
                    let options = '';
                    (settingDef.options || []).forEach(opt => {
                        options += `<option value="${opt.value}" ${currentValue === opt.value ? 'selected' : ''}>${opt.label}</option>`;
                    });
                    html += `
                        <label class="sx-field sx-field-row">
                            <span>${settingDef.label}</span>
                            <select id="sx-app-${key}">${options}</select>
                        </label>
                    `;
                    break;
                case 'toggle':
                    html += `
                        <div class="sx-toggle-row">
                            <label>
                                <span>${settingDef.label}</span>
                                <input type="checkbox" id="sx-app-${key}" ${currentValue ? 'checked' : ''}>
                            </label>
                        </div>
                    `;
                    break;
            }
        });
        
        return html;
    };

    const collectAppSpecificSettings = (appId, panel) => {
        const appConfig = getAppConfig(appId);
        if (!appConfig || !appConfig.settings) return {};
        
        const settings = {};
        Object.keys(appConfig.settings).forEach(key => {
            const el = panel.querySelector(`#sx-app-${key}`);
            if (el) {
                const settingDef = appConfig.settings[key];
                if (settingDef.type === 'toggle') {
                    settings[key] = el.checked;
                } else if (settingDef.type === 'range') {
                    settings[key] = parseFloat(el.value);
                } else {
                    settings[key] = el.value;
                }
            }
        });
        
        return settings;
    };

    const populateAppSpecificSettings = (appId, panel, settings) => {
        const appConfig = getAppConfig(appId);
        if (!appConfig || !appConfig.settings) return;
        
        Object.keys(appConfig.settings).forEach(key => {
            const el = panel.querySelector(`#sx-app-${key}`);
            const valEl = panel.querySelector(`#sx-app-${key}-val`);
            if (el && settings[key] !== undefined) {
                const settingDef = appConfig.settings[key];
                if (settingDef.type === 'toggle') {
                    el.checked = settings[key];
                } else {
                    el.value = settings[key];
                }
                if (valEl) {
                    valEl.textContent = settings[key] + (settingDef.unit || '');
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
        defaultDarkSettings,
        registerAppConfig,
        getAppConfig,
        getAllAppConfigs,
        getMergedSettings,
        applyAppSpecificCss,
        createAppSpecificPanelHTML,
        collectAppSpecificSettings,
        populateAppSpecificSettings
    };

})(typeof window !== 'undefined' ? window : globalThis);
