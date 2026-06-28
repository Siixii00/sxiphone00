(() => {
    const MODE_KEY = 'sx_theme_mode';
    const ACCENT_KEY = 'sx_theme_accent';
    const CUSTOM_ICON_KEY = 'sx_custom_icons';
    const THEME_IMAGE_KEY = 'sx_theme_image';
    const PATTERN_WALLPAPER_KEY = 'sx_pattern_wallpaper';

    const saveAppearanceData = () => {
        try {
            const mode = localStorage.getItem(MODE_KEY) || 'dark';
            const accent = localStorage.getItem(ACCENT_KEY) || '#5B8DEF';
            console.log("外觀數據已保存至 localStorage");
        } catch (e) {
            console.error("保存外觀數據失敗:", e);
        }
    };

    const saveToPersistentStorage = async () => {
        saveAppearanceData();
        if (typeof localforage !== 'undefined') {
            try {
                const existingData = await localforage.getItem('sx_app_persisted_data') || {};
                const mode = localStorage.getItem(MODE_KEY) || 'dark';
                const accent = localStorage.getItem(ACCENT_KEY) || '#5B8DEF';
                await localforage.setItem('sx_app_persisted_data', {
                    ...existingData,
                    sx_theme_mode: mode,
                    sx_theme_accent: accent
                });
                console.log("外觀數據已保存至 IndexedDB");
            } catch (e) {
                console.error("IndexedDB 保存失敗:", e);
            }
        }
    };

    window.addEventListener('pagehide', () => {
        saveAppearanceData();
    });

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            saveAppearanceData();
        }
    });

    window.addEventListener('message', (event) => {
        if (event.data?.type === 'APP_WILL_CLOSE') {
            saveAppearanceData();
        }
    });

    const modeInputs = () => Array.from(document.querySelectorAll('input[name="mode"]'));

    const loadState = () => ({
        mode: localStorage.getItem(MODE_KEY) || 'dark',
        accent: localStorage.getItem(ACCENT_KEY) || '#5B8DEF'
    });

    const applyMode = (mode) => {
        const effective = mode === 'custom-light' ? 'light' : mode === 'custom-dark' ? 'dark' : mode;
        document.documentElement.dataset.theme = effective;
        document.body?.classList.toggle('theme-light', effective === 'light');
        localStorage.setItem(MODE_KEY, mode);
        window.parent?.postMessage({ type: 'THEME_MODE_CHANGED', mode: mode }, '*');
        
        // 同步到雲端
        window.parent?.postMessage({ type: 'TRIGGER_GITHUB_SYNC' }, '*');
        
        if (mode.startsWith('custom-')) {
            saveCustomAppearancePreset(effective);
        }
    };

    const saveCustomAppearancePreset = (mode) => {
        const accent = localStorage.getItem(ACCENT_KEY) || '#5B8DEF';
        const textColor = localStorage.getItem('sx_theme_text_color') || (mode === 'light' ? '#000000' : '#ffffff');
        const appBgColor = localStorage.getItem('sx_theme_app_bg_color') || (mode === 'light' ? '#f2f2f7' : '#1c1c1e');
        
        const config = { accent, textColor, appBgColor };
        localStorage.setItem(`sx_custom_appearance_${mode}`, JSON.stringify(config));
    };

    const applyAccent = (accent) => {
        document.documentElement.style.setProperty('--sx-accent', accent);
        localStorage.setItem(ACCENT_KEY, accent);
        window.parent?.postMessage({ type: 'THEME_ACCENT_CHANGED', accent }, '*');
        
        // 同步到雲端
        window.parent?.postMessage({ type: 'TRIGGER_GITHUB_SYNC' }, '*');
        
        const currentMode = localStorage.getItem(MODE_KEY) || 'dark';
        if (currentMode.startsWith('custom-')) {
            const effective = currentMode === 'custom-light' ? 'light' : 'dark';
            saveCustomAppearancePreset(effective);
        }
    };

    const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

    const hsvToRgb = (h, s, v) => {
        const c = v * s;
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        const m = v - c;
        let r = 0, g = 0, b = 0;
        if (h < 60) [r, g, b] = [c, x, 0];
        else if (h < 120) [r, g, b] = [x, c, 0];
        else if (h < 180) [r, g, b] = [0, c, x];
        else if (h < 240) [r, g, b] = [0, x, c];
        else if (h < 300) [r, g, b] = [x, 0, c];
        else [r, g, b] = [c, 0, x];
        return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255)
        };
    };

    const rgbToHsv = (r, g, b) => {
        const rn = r / 255, gn = g / 255, bn = b / 255;
        const max = Math.max(rn, gn, bn);
        const min = Math.min(rn, gn, bn);
        const delta = max - min;
        let h = 0;
        if (delta !== 0) {
            if (max === rn) h = 60 * (((gn - bn) / delta) % 6);
            else if (max === gn) h = 60 * (((bn - rn) / delta) + 2);
            else h = 60 * (((rn - gn) / delta) + 4);
        }
        if (h < 0) h += 360;
        const s = max === 0 ? 0 : delta / max;
        const v = max;
        return { h, s, v };
    };

    const rgbToHex = ({ r, g, b }) => '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
    const hexToRgb = (hex) => {
        const raw = hex.replace('#', '').trim();
        if (!/^[0-9a-fA-F]{6}$/.test(raw)) return null;
        return {
            r: parseInt(raw.slice(0, 2), 16),
            g: parseInt(raw.slice(2, 4), 16),
            b: parseInt(raw.slice(4, 6), 16)
        };
    };

    const generatePalette = (baseHex) => {
        const rgb = hexToRgb(baseHex);
        if (!rgb) return [];
        const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
        const variations = [
            { s: 0.2, v: 0.96 },
            { s: 0.35, v: 0.82 },
            { s: clamp(hsv.s, 0.45, 0.7), v: clamp(hsv.v, 0.55, 0.8) },
            { s: clamp(hsv.s, 0.7, 0.95), v: clamp(hsv.v, 0.4, 0.65) },
            { s: clamp(hsv.s + 0.1, 0.65, 0.95), v: clamp(hsv.v - 0.2, 0.2, 0.5) },
            { s: clamp(hsv.s + 0.2, 0.7, 1), v: clamp(hsv.v - 0.35, 0.15, 0.45) }
        ];
        return variations.map(v => rgbToHex(hsvToRgb(hsv.h, v.s, v.v)));
    };

    const readImageAsDataURL = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

    const extractPalette = async (dataUrl) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const size = 120;
                canvas.width = size;
                canvas.height = size;
                ctx.drawImage(img, 0, 0, size, size);
                const { data } = ctx.getImageData(0, 0, size, size);
                const buckets = {};
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i], g = data[i + 1], b = data[i + 2];
                    const key = `${Math.round(r/24)*24},${Math.round(g/24)*24},${Math.round(b/24)*24}`;
                    buckets[key] = (buckets[key] || 0) + 1;
                }
                const sorted = Object.entries(buckets).sort((a, b) => b[1] - a[1]);
                const top = sorted.slice(0, 5).map(([k]) => k.split(',').map(Number));
                const [accent = [91, 141, 239], muted = [156, 163, 175], bg = [15, 16, 26]] = top;
                const toHex = ([r, g, b]) => '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
                const brightness = (c) => (c[0]*0.299 + c[1]*0.587 + c[2]*0.114) / 255;
                resolve({
                    accent: toHex(accent),
                    muted: toHex(muted),
                    bg: toHex(bg),
                    brightness: brightness(bg)
                });
            };
            img.onerror = reject;
            img.src = dataUrl;
        });
    };

    const loadImage = (dataUrl) => new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = dataUrl;
    });

    const buildPatternWallpaper = async (imageUrl, options = {}) => {
        const size = clamp(Number(options.size) || 86, 24, 220);
        const gap = clamp(Number(options.gap) || 20, 0, 120);
        const angle = Number(options.angle) === 45 ? 45 : -45;
        const bgColor = options.bgColor || '#0B0C12';
        const canvasSize = clamp((size + gap) * 6, 360, 1280);

        const img = await loadImage(imageUrl);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = canvasSize;
        canvas.height = canvasSize;

        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const step = size + gap;
        const radius = Math.ceil(Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height));

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((Math.PI / 180) * angle);
        for (let y = -radius; y <= radius; y += step) {
            for (let x = -radius; x <= radius; x += step) {
                ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
            }
        }
        ctx.restore();

        return canvas.toDataURL('image/png');
    };

    const updatePaletteUI = ({ accent, muted, bg, brightness }) => {
        const palette = document.getElementById('theme-palette');
        const chipAccent = document.getElementById('chip-accent');
        const chipMuted = document.getElementById('chip-muted');
        const chipBg = document.getElementById('chip-bg');
        const brightnessText = document.getElementById('brightness-text');
        if (!palette) return;
        palette.hidden = false;
        const setChip = (chip, color, label) => {
            if (!chip) return;
            chip.querySelector('.chip-dot').style.background = color;
            chip.querySelector('.chip-text').textContent = label;
        };
        setChip(chipAccent, accent, 'Accent');
        setChip(chipMuted, muted, 'Muted');
        setChip(chipBg, bg, 'Background');
        if (brightnessText) {
            brightnessText.textContent = brightness > 0.55 ? '建議：淺色模式' : '建議：深色模式';
        }
    };

    const applyImageTheme = ({ accent, brightness, dataUrl }) => {
        applyAccent(accent);
        const mode = brightness > 0.55 ? 'light' : 'dark';
        applyMode(mode);
        localStorage.setItem(THEME_IMAGE_KEY, dataUrl || '');
        window.parent?.postMessage({ type: 'THEME_IMAGE_UPDATED', accent, mode, dataUrl }, '*');
        
        // 同步到雲端
        window.parent?.postMessage({ type: 'TRIGGER_GITHUB_SYNC' }, '*');
    };

    const buildCssThemeFromPalette = ({ accent, muted, bg, brightness }, forcedMode = '') => {
        const autoMode = brightness > 0.55 ? 'light' : 'dark';
        const mode = forcedMode || autoMode;
        const text = mode === 'light' ? '#000000' : '#ffffff';
        const iconBorder = text;
        const css = `:root {\n` +
            `  --sx-accent: ${accent};\n` +
            `  --sx-text: ${text};\n` +
            `  --sx-icon-border: ${iconBorder};\n` +
            `  --sx-app-bg: ${bg};\n` +
            `}\n` +
            `html[data-theme=\"${mode}\"], body.theme-light {\n` +
            `  color-scheme: ${mode};\n` +
            `}`;
        return { css, mode, text, iconBorder, appBg: bg };
    };

    const parsePromptColors = (text) => {
        const lower = text.toLowerCase();
        const colorMap = {
            red: '#FF3B30',
            orange: '#FF9500',
            yellow: '#FFCC00',
            green: '#34C759',
            blue: '#0A84FF',
            purple: '#AF52DE',
            pink: '#FF2D55',
            teal: '#30B0C7'
        };
        const zhMap = {
            '紅': '#FF3B30',
            '橘': '#FF9500',
            '黃': '#FFCC00',
            '綠': '#34C759',
            '藍': '#0A84FF',
            '紫': '#AF52DE',
            '粉': '#FF2D55',
            '青': '#30B0C7'
        };
        let accent = null;
        Object.entries(colorMap).some(([key, val]) => {
            if (lower.includes(key)) { accent = val; return true; }
            return false;
        });
        if (!accent) {
            Object.entries(zhMap).some(([key, val]) => {
                if (text.includes(key)) { accent = val; return true; }
                return false;
            });
        }
        return accent;
    };

    const buildThemeFromPrompt = (prompt, forcedMode = '') => {
        const wantsLight = /淺色|light/i.test(prompt);
        const wantsDark = /深色|dark/i.test(prompt);
        const mode = forcedMode || (wantsLight ? 'light' : wantsDark ? 'dark' : 'dark');
        const accent = parsePromptColors(prompt) || '#5B8DEF';
        const bg = mode === 'light' ? '#F2F2F7' : '#101217';
        const text = mode === 'light' ? '#000000' : '#ffffff';
        const iconBorder = text;
        const css = `:root {\n` +
            `  --sx-accent: ${accent};\n` +
            `  --sx-text: ${text};\n` +
            `  --sx-icon-border: ${iconBorder};\n` +
            `  --sx-app-bg: ${bg};\n` +
            `}\n` +
            `html[data-theme=\"${mode}\"], body.theme-light {\n` +
            `  color-scheme: ${mode};\n` +
            `}`;
        return { css, mode, accent, text, iconBorder, appBg: bg };
    };

    const saveCustomIcon = (appId, url) => {
        const raw = localStorage.getItem(CUSTOM_ICON_KEY);
        let map = {};
        try { map = raw ? JSON.parse(raw) : {}; } catch { map = {}; }
        map[appId] = url;
        localStorage.setItem(CUSTOM_ICON_KEY, JSON.stringify(map));
        window.parent?.postMessage({ type: 'SET_CUSTOM_ICON', appId, url }, '*');
    };

    const clearCustomIcon = (appId) => {
        const raw = localStorage.getItem(CUSTOM_ICON_KEY);
        let map = {};
        try { map = raw ? JSON.parse(raw) : {}; } catch { map = {}; }
        delete map[appId];
        localStorage.setItem(CUSTOM_ICON_KEY, JSON.stringify(map));
        window.parent?.postMessage({ type: 'CLEAR_CUSTOM_ICON', appId }, '*');
    };

    const init = () => {
        const state = loadState();

        modeInputs().forEach(input => {
            input.checked = input.value === state.mode;
            input.onchange = () => applyMode(input.value);
        });

        const accentCanvas = document.getElementById('accent-canvas');
        const accentThumb = document.getElementById('accent-thumb');
        const hueBar = document.getElementById('accent-hue');
        const hueThumb = document.getElementById('accent-hue-thumb');
        const hexInput = document.getElementById('accent-hex');
        const paletteWrap = document.getElementById('accent-palette');
        const generateBtn = document.getElementById('generate-accent');

        let hue = 210;
        let sat = 0.75;
        let val = 0.7;

        const updateCanvasHue = () => {
            if (!accentCanvas) return;
            accentCanvas.style.background = `
                linear-gradient(90deg, #fff, hsla(${hue}, 100%, 50%, 1)),
                linear-gradient(0deg, #000, rgba(0,0,0,0))
            `;
        };

        const updateThumb = () => {
            if (!accentThumb || !accentCanvas) return;
            const rect = accentCanvas.getBoundingClientRect();
            accentThumb.style.left = `${sat * rect.width}px`;
            accentThumb.style.top = `${(1 - val) * rect.height}px`;
        };

        const updateHueThumb = () => {
            if (!hueThumb || !hueBar) return;
            const rect = hueBar.getBoundingClientRect();
            hueThumb.style.left = `${(hue / 360) * rect.width}px`;
        };

        const renderPalette = (colors, activeHex) => {
            if (!paletteWrap) return;
            paletteWrap.innerHTML = '';
            colors.forEach(color => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = `accent-chip${color === activeHex ? ' active' : ''}`;
                btn.style.setProperty('--chip-color', color);
                btn.addEventListener('click', () => {
                    applyAccent(color);
                    renderPalette(colors, color);
                });
                paletteWrap.appendChild(btn);
            });
        };

        const applyFromHSV = () => {
            const hex = rgbToHex(hsvToRgb(hue, sat, val));
            if (hexInput) hexInput.value = hex.replace('#', '');
            applyAccent(hex);
            renderPalette(generatePalette(hex), hex);
        };

        const setFromHex = (hex) => {
            const rgb = hexToRgb(hex);
            if (!rgb) return;
            const next = rgbToHsv(rgb.r, rgb.g, rgb.b);
            hue = next.h;
            sat = next.s;
            val = next.v;
            updateCanvasHue();
            updateThumb();
            updateHueThumb();
            applyAccent(hex);
            renderPalette(generatePalette(hex), hex);
        };

        const handleCanvasPointer = (event) => {
            if (!accentCanvas) return;
            const rect = accentCanvas.getBoundingClientRect();
            const clientX = event.touches ? event.touches[0].clientX : event.clientX;
            const clientY = event.touches ? event.touches[0].clientY : event.clientY;
            sat = clamp((clientX - rect.left) / rect.width, 0, 1);
            val = clamp(1 - (clientY - rect.top) / rect.height, 0, 1);
            updateThumb();
            applyFromHSV();
        };

        const handleHuePointer = (event) => {
            if (!hueBar) return;
            const rect = hueBar.getBoundingClientRect();
            const clientX = event.touches ? event.touches[0].clientX : event.clientX;
            hue = clamp((clientX - rect.left) / rect.width, 0, 1) * 360;
            updateCanvasHue();
            updateHueThumb();
            applyFromHSV();
        };

        if (accentCanvas) {
            accentCanvas.addEventListener('mousedown', handleCanvasPointer);
            accentCanvas.addEventListener('touchstart', handleCanvasPointer, { passive: true });
        }
        if (hueBar) {
            hueBar.addEventListener('mousedown', handleHuePointer);
            hueBar.addEventListener('touchstart', handleHuePointer, { passive: true });
        }
        if (hexInput) {
            hexInput.addEventListener('change', () => {
                const val = hexInput.value.trim();
                if (!val) return;
                setFromHex(`#${val}`);
            });
        }
        generateBtn?.addEventListener('click', () => {
            const current = `#${hexInput?.value.trim() || '5B8DEF'}`;
            renderPalette(generatePalette(current), current);
        });

        applyMode(state.mode);
        setFromHex(state.accent);

        const saveBtn = document.getElementById('save-icon-btn');
        const clearBtn = document.getElementById('clear-icon-btn');
        const idInput = document.getElementById('custom-app-id');
        const urlInput = document.getElementById('custom-app-url');

        const imageInput = document.getElementById('theme-image-input');
        const preview = document.getElementById('theme-image-preview');
        const applyImageBtn = document.getElementById('apply-image-theme');
        const resetImageBtn = document.getElementById('reset-image-theme');
        const paletteRow = document.getElementById('theme-palette');
        let lastPalette = null;
        let lastImageDataUrl = '';

        const aiInput = document.getElementById('ai-theme-input');
        const aiPreview = document.getElementById('ai-theme-preview');
        const aiPreviewBtn = document.getElementById('ai-preview-btn');
        const aiApplyBtn = document.getElementById('ai-apply-btn');
        const aiCssOutput = document.getElementById('ai-css-output');
        let aiPalette = null;
        let aiImageDataUrl = '';
        const aiModeToggles = Array.from(document.querySelectorAll('.ai-theme .ai-mode-toggle'));
        const aiImageModeToggle = aiModeToggles[0] || null;
        const aiTextModeToggle = aiModeToggles[1] || null;

        const aiTextPrompt = document.getElementById('ai-text-prompt');
        const aiTextPreviewBtn = document.getElementById('ai-text-preview-btn');
        const aiTextApplyBtn = document.getElementById('ai-text-apply-btn');
        const aiTextCssOutput = document.getElementById('ai-text-css-output');

        const patternInput = document.getElementById('pattern-image-input');
        const patternPreview = document.getElementById('pattern-preview');
        const patternApplyBtn = document.getElementById('pattern-apply-btn');
        const patternPreviewBtn = document.getElementById('pattern-preview-btn');
        const patternBgColor = document.getElementById('pattern-bg-color');
        const patternSize = document.getElementById('pattern-size');
        const patternGap = document.getElementById('pattern-gap');
        const patternAngleToggle = document.getElementById('pattern-angle-toggle');
        let patternImageDataUrl = '';
        let patternWallpaperDataUrl = '';

        saveBtn?.addEventListener('click', () => {
            const appId = idInput.value.trim();
            const url = urlInput.value.trim();
            if (!appId || !url) return;
            saveCustomIcon(appId, url);
        });

        clearBtn?.addEventListener('click', () => {
            const appId = idInput.value.trim();
            if (!appId) return;
            clearCustomIcon(appId);
        });

        // === 自訂捷徑圖標管理 ===
        const shortcutIconManager = {
            uploadInput: document.getElementById('shortcut-icon-upload-input'),
            urlInput: document.getElementById('shortcut-icon-url-input'),
            appIdUpload: document.getElementById('shortcut-app-id-upload'),
            appIdUrl: document.getElementById('shortcut-app-id-url'),
            previewUpload: document.getElementById('shortcut-icon-preview-upload'),
            previewUrl: document.getElementById('shortcut-icon-preview-url'),
            galleryGrid: document.getElementById('shortcut-gallery-grid'),
            tabs: document.querySelectorAll('.shortcut-tab'),
            tabUpload: document.getElementById('shortcut-tab-upload'),
            tabUrl: document.getElementById('shortcut-tab-url'),
            saveUploadBtn: document.getElementById('shortcut-save-upload-btn'),
            saveUrlBtn: document.getElementById('shortcut-save-url-btn'),
            clearUploadBtn: document.getElementById('shortcut-clear-upload-btn'),
            clearUrlBtn: document.getElementById('shortcut-clear-url-btn'),
            previewUrlBtn: document.getElementById('shortcut-preview-url-btn'),
            clearAllBtn: document.getElementById('shortcut-clear-all-btn'),
            currentUploadDataUrl: '',
            currentUrlData: ''
        };

        const APP_LABELS = {
            chat: '聊天', settings: '設定', album: '相簿', touch: '輔助觸控',
            worldbook: '世界書', pomodoro: '番茄鐘', weather: '天氣',
            twitter: '推特', facebook: '臉書', chrome: 'Chrome',
            bilibili: 'bilibili', youtube: 'YouTube', 'exchange-diary': '交換日記',
            lofter: 'lofter', 'drift-bottle': '漂流瓶', 'match-3': '消消樂',
            bubbles: 'bubbles', weverse: 'weverse', 'daily-recipe': '每日食譜',
            music: '音樂', delivery: '外送', taobao: '購物', dating: '約會',
            'guzi-guide': '谷子圖鑒', 'smart-painter': '照相館', instagram: 'Instagram',
            timetree: 'timetree', pub: '酒館', kakaopay: 'kakaopay', widget: 'widget',
            twitch: 'twitch', appearance: '外觀', ao3: 'AO3', phone: '電話',
            passkey: 'Passkey', theater: '劇場', arcade: '街機廳'
        };

        // URL 驗證函數 - 防止 XSS
        const isValidIconUrl = (url) => {
            if (!url || typeof url !== 'string') return false;
            // 只允許 http/https URL 或 data:image URL
            return /^https?:\/\//i.test(url) || /^data:image\//i.test(url);
        };

        // 安全地轉義 URL 中的特殊字符
        const escapeUrlForStyle = (url) => {
            // 移除可能危險的字符
            return url.replace(/['"()<>]/g, '');
        };

        const renderShortcutGallery = () => {
            const grid = shortcutIconManager.galleryGrid;
            if (!grid) return;
            
            let map = {};
            try {
                const raw = localStorage.getItem(CUSTOM_ICON_KEY);
                if (raw) {
                    map = JSON.parse(raw);
                    if (typeof map !== 'object' || Array.isArray(map)) map = {};
                }
            } catch (e) {
                console.warn('[ShortcutGallery] 讀取 localStorage 失敗:', e);
                map = {};
            }
            
            const entries = Object.entries(map);
            if (entries.length === 0) {
                grid.innerHTML = '<span class="hint">尚未自訂任何圖標</span>';
                return;
            }
            
            grid.innerHTML = '';
            entries.forEach(([appId, url]) => {
                const item = document.createElement('div');
                item.className = 'shortcut-gallery-item';
                item.dataset.appId = appId;
                
                const img = document.createElement('div');
                img.className = 'shortcut-gallery-thumb';
                if (url && isValidIconUrl(url)) {
                    img.style.backgroundImage = `url('${escapeUrlForStyle(url)}')`;
                }
                
                const label = document.createElement('span');
                label.className = 'shortcut-gallery-label';
                label.textContent = APP_LABELS[appId] || appId;
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'shortcut-gallery-delete';
                deleteBtn.type = 'button';
                deleteBtn.textContent = '×';
                deleteBtn.title = '刪除';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    clearCustomIcon(appId);
                    renderShortcutGallery();
                });
                
                item.appendChild(img);
                item.appendChild(label);
                item.appendChild(deleteBtn);
                grid.appendChild(item);
            });
        };

        const setShortcutPreview = (previewEl, url, isDataUrl = false) => {
            if (!previewEl) return;
            
            // 清空預覽區域
            previewEl.innerHTML = '';
            
            if (url && isValidIconUrl(url)) {
                // 使用 DOM 操作而非 innerHTML 來防止 XSS
                const img = document.createElement('img');
                img.src = url;
                img.alt = '圖標預覽';
                img.style.cssText = 'max-width:80px;max-height:80px;border-radius:16px;object-fit:contain;';
                img.onerror = () => {
                    previewEl.innerHTML = '<span class="hint" style="color:#FF3B30;">圖片載入失敗</span>';
                };
                previewEl.appendChild(img);
            } else {
                const hint = document.createElement('span');
                hint.className = 'hint';
                hint.textContent = isDataUrl 
                    ? '支援 PNG、JPG、WebP，建議使用透明背景的方形圖片'
                    : '輸入圖床 URL 後點擊預覽按鈕查看效果';
                previewEl.appendChild(hint);
            }
        };

        // Tab 切換
        shortcutIconManager.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                shortcutIconManager.tabs.forEach(t => t.classList.toggle('active', t === tab));
                shortcutIconManager.tabUpload?.classList.toggle('hidden', targetTab !== 'upload');
                shortcutIconManager.tabUrl?.classList.toggle('hidden', targetTab !== 'url');
            });
        });

        // 上傳圖片處理
        shortcutIconManager.uploadInput?.addEventListener('change', async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            
            // 檢查檔案大小 (最大 2MB)
            if (file.size > 2 * 1024 * 1024) {
                alert('圖片大小不能超過 2MB');
                return;
            }
            
            try {
                const dataUrl = await readImageAsDataURL(file);
                shortcutIconManager.currentUploadDataUrl = dataUrl;
                setShortcutPreview(shortcutIconManager.previewUpload, dataUrl, true);
            } catch (err) {
                console.error('讀取圖片失敗:', err);
                alert('讀取圖片失敗，請重試');
            }
        });

        // 上傳模式 - 套用按鈕
        shortcutIconManager.saveUploadBtn?.addEventListener('click', () => {
            const appId = shortcutIconManager.appIdUpload?.value;
            const url = shortcutIconManager.currentUploadDataUrl;
            
            if (!appId) {
                alert('請選擇應用程式');
                return;
            }
            if (!url) {
                alert('請先選擇圖片');
                return;
            }
            
            saveCustomIcon(appId, url);
            renderShortcutGallery();
            alert(`已為「${APP_LABELS[appId] || appId}」設定自訂圖標`);
        });

        // 上傳模式 - 清除按鈕
        shortcutIconManager.clearUploadBtn?.addEventListener('click', () => {
            shortcutIconManager.currentUploadDataUrl = '';
            if (shortcutIconManager.uploadInput) shortcutIconManager.uploadInput.value = '';
            setShortcutPreview(shortcutIconManager.previewUpload, '', true);
        });

        // URL 模式 - 預覽按鈕
        shortcutIconManager.previewUrlBtn?.addEventListener('click', () => {
            const url = shortcutIconManager.urlInput?.value.trim();
            if (!url) {
                alert('請輸入圖標 URL');
                return;
            }
            
            // 測試圖片是否可載入
            const testImg = new Image();
            testImg.onload = () => {
                shortcutIconManager.currentUrlData = url;
                setShortcutPreview(shortcutIconManager.previewUrl, url, false);
            };
            testImg.onerror = () => {
                alert('無法載入圖片，請檢查 URL 是否正確');
            };
            testImg.src = url;
        });

        // URL 模式 - 套用按鈕
        shortcutIconManager.saveUrlBtn?.addEventListener('click', () => {
            const appId = shortcutIconManager.appIdUrl?.value;
            const url = shortcutIconManager.currentUrlData || shortcutIconManager.urlInput?.value.trim();
            
            if (!appId) {
                alert('請選擇應用程式');
                return;
            }
            if (!url) {
                alert('請輸入圖標 URL');
                return;
            }
            
            saveCustomIcon(appId, url);
            renderShortcutGallery();
            alert(`已為「${APP_LABELS[appId] || appId}」設定自訂圖標`);
        });

        // URL 模式 - 清除按鈕
        shortcutIconManager.clearUrlBtn?.addEventListener('click', () => {
            shortcutIconManager.currentUrlData = '';
            if (shortcutIconManager.urlInput) shortcutIconManager.urlInput.value = '';
            setShortcutPreview(shortcutIconManager.previewUrl, '', false);
        });

        // 全部清除按鈕
        shortcutIconManager.clearAllBtn?.addEventListener('click', () => {
            if (!confirm('確定要清除所有自訂圖標嗎？')) return;
            
            localStorage.removeItem(CUSTOM_ICON_KEY);
            renderShortcutGallery();
            window.parent?.postMessage({ type: 'CLEAR_ALL_CUSTOM_ICONS' }, '*');
        });

        // 初始化圖標庫
        renderShortcutGallery();

        // === PWA 桌面圖標管理 ===
        const PWA_MANIFEST_KEY = 'sx_pwa_manifest_config';
        const PWA_ICON_KEY = 'sx_pwa_custom_icon';

        const pwaIconManager = {
            uploadInput: document.getElementById('pwa-icon-upload-input'),
            urlInput: document.getElementById('pwa-icon-url-input'),
            currentIcon: document.getElementById('pwa-icon-current'),
            newIcon: document.getElementById('pwa-icon-new'),
            tabs: document.querySelectorAll('.pwa-tab'),
            tabUpload: document.getElementById('pwa-tab-upload'),
            tabUrl: document.getElementById('pwa-tab-url'),
            appName: document.getElementById('pwa-app-name'),
            bgColor: document.getElementById('pwa-bg-color'),
            themeColor: document.getElementById('pwa-theme-color'),
            applyBtn: document.getElementById('pwa-apply-btn'),
            resetBtn: document.getElementById('pwa-reset-btn'),
            installHint: document.getElementById('pwa-install-hint'),
            cloudStatus: document.getElementById('pwa-cloud-status'),
            currentIconData: null,
            newIconData: null
        };

        // 檢查是否有 GitHub 雲端備份連接
        const checkCloudBackupStatus = () => {
            const githubToken = localStorage.getItem('sx_github_token');
            if (!githubToken && pwaIconManager.cloudStatus) {
                pwaIconManager.cloudStatus.innerHTML = `
                    <span class="material-symbols-rounded">cloud_off</span>
                    <span>尚未連接雲端備份，建議先在「設定」中連接 GitHub</span>
                `;
                pwaIconManager.cloudStatus.style.background = 'rgba(255, 59, 48, 0.12)';
                pwaIconManager.cloudStatus.style.borderColor = 'rgba(255, 59, 48, 0.3)';
                pwaIconManager.cloudStatus.style.color = '#FF3B30';
            }
        };

        // 載入已儲存的 PWA 設定
        const loadPWAConfig = () => {
            try {
                const raw = localStorage.getItem(PWA_MANIFEST_KEY);
                if (raw) {
                    const config = JSON.parse(raw);
                    if (pwaIconManager.appName) pwaIconManager.appName.value = config.name || 'sxiphone';
                    if (pwaIconManager.bgColor) pwaIconManager.bgColor.value = config.background_color || '#0b0c12';
                    if (pwaIconManager.themeColor) pwaIconManager.themeColor.value = config.theme_color || '#0b0c12';
                }
                
                const iconRaw = localStorage.getItem(PWA_ICON_KEY);
                if (iconRaw && pwaIconManager.currentIcon) {
                    const img = document.createElement('img');
                    img.src = iconRaw;
                    img.alt = '目前圖標';
                    pwaIconManager.currentIcon.innerHTML = '';
                    pwaIconManager.currentIcon.appendChild(img);
                    pwaIconManager.currentIconData = iconRaw;
                } else if (pwaIconManager.currentIcon) {
                    // 使用預設圖標
                    const img = document.createElement('img');
                    img.src = 'apps/screenshots/current.png';
                    img.alt = '目前圖標';
                    pwaIconManager.currentIcon.innerHTML = '';
                    pwaIconManager.currentIcon.appendChild(img);
                }
            } catch (e) {
                console.warn('[PWA] 載入設定失敗:', e);
            }
            
            checkCloudBackupStatus();
        };

        // Tab 切換
        pwaIconManager.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                pwaIconManager.tabs.forEach(t => t.classList.toggle('active', t === tab));
                pwaIconManager.tabUpload?.classList.toggle('hidden', targetTab !== 'upload');
                pwaIconManager.tabUrl?.classList.toggle('hidden', targetTab !== 'url');
            });
        });

        // 上傳圖片處理
        pwaIconManager.uploadInput?.addEventListener('change', async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            
            // 檢查檔案大小 (最大 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('圖片大小不能超過 5MB');
                return;
            }
            
            try {
                const dataUrl = await readImageAsDataURL(file);
                pwaIconManager.newIconData = dataUrl;
                
                if (pwaIconManager.newIcon) {
                    pwaIconManager.newIcon.innerHTML = `<img src="${dataUrl}" alt="新圖標">`;
                }
            } catch (err) {
                console.error('讀取圖片失敗:', err);
                alert('讀取圖片失敗，請重試');
            }
        });

        // URL 輸入預覽
        pwaIconManager.urlInput?.addEventListener('change', () => {
            const url = pwaIconManager.urlInput.value.trim();
            if (!url) return;
            
            // 驗證 URL
            if (!isValidIconUrl(url)) {
                alert('請輸入有效的圖片 URL（http:// 或 https:// 開頭）');
                return;
            }
            
            const testImg = new Image();
            testImg.onload = () => {
                pwaIconManager.newIconData = url;
                if (pwaIconManager.newIcon) {
                    pwaIconManager.newIcon.innerHTML = `<img src="${url}" alt="新圖標">`;
                }
            };
            testImg.onerror = () => {
                alert('無法載入圖片，請檢查 URL');
            };
            testImg.src = url;
        });

        // 套用 PWA 設定
        pwaIconManager.applyBtn?.addEventListener('click', () => {
            const iconData = pwaIconManager.newIconData || pwaIconManager.currentIconData;
            
            if (!iconData) {
                alert('請先上傳或輸入圖標');
                return;
            }
            
            const config = {
                name: pwaIconManager.appName?.value || 'sxiphone',
                short_name: pwaIconManager.appName?.value || 'sxiphone',
                background_color: pwaIconManager.bgColor?.value || '#0b0c12',
                theme_color: pwaIconManager.themeColor?.value || '#0b0c12',
                updated_at: new Date().toISOString()
            };
            
            // 儲存設定
            localStorage.setItem(PWA_MANIFEST_KEY, JSON.stringify(config));
            localStorage.setItem(PWA_ICON_KEY, iconData);
            
            // 通知父視窗更新 manifest
            window.parent?.postMessage({
                type: 'PWA_MANIFEST_UPDATE',
                config,
                iconData
            }, '*');
            
            // 更新當前圖標顯示
            if (pwaIconManager.currentIcon) {
                const img = document.createElement('img');
                img.src = iconData;
                img.alt = '目前圖標';
                pwaIconManager.currentIcon.innerHTML = '';
                pwaIconManager.currentIcon.appendChild(img);
            }
            pwaIconManager.currentIconData = iconData;
            
            // 顯示詳細提示
            if (pwaIconManager.installHint) {
                pwaIconManager.installHint.hidden = false;
                // 滾動到提示區域
                pwaIconManager.installHint.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            
            // 檢查是否有雲端備份
            const githubToken = localStorage.getItem('sx_github_token');
            if (!githubToken) {
                alert('設定已儲存！\n\n⚠️ 您尚未連接 GitHub 雲端備份。\n\niOS 用戶注意：移除 PWA 會清除本機資料，強烈建議先到「設定」連接 GitHub 備份。');
            } else {
                // 觸發同步到雲端
                window.parent?.postMessage({ type: 'TRIGGER_GITHUB_SYNC' }, '*');
            }
        });

        // 重置 PWA 設定
        pwaIconManager.resetBtn?.addEventListener('click', () => {
            if (!confirm('確定要恢復預設的 PWA 圖標設定嗎？')) return;
            
            localStorage.removeItem(PWA_MANIFEST_KEY);
            localStorage.removeItem(PWA_ICON_KEY);
            
            // 重置表單
            if (pwaIconManager.appName) pwaIconManager.appName.value = 'sxiphone';
            if (pwaIconManager.bgColor) pwaIconManager.bgColor.value = '#0b0c12';
            if (pwaIconManager.themeColor) pwaIconManager.themeColor.value = '#0b0c12';
            
            // 重置圖標顯示
            if (pwaIconManager.currentIcon) {
                const img = document.createElement('img');
                img.src = 'apps/screenshots/current.png';
                img.alt = '目前圖標';
                pwaIconManager.currentIcon.innerHTML = '';
                pwaIconManager.currentIcon.appendChild(img);
            }
            if (pwaIconManager.newIcon) {
                pwaIconManager.newIcon.innerHTML = '<span class="hint">新圖標</span>';
            }
            
            pwaIconManager.currentIconData = null;
            pwaIconManager.newIconData = null;
            
            if (pwaIconManager.installHint) {
                pwaIconManager.installHint.hidden = true;
            }
            
            // 通知父視窗
            window.parent?.postMessage({ type: 'PWA_MANIFEST_RESET' }, '*');
        });

        // 初始化 PWA 設定
        loadPWAConfig();

        const setPreview = (url) => {
            if (!preview) return;
            preview.innerHTML = url ? `<img src="${url}" alt="預覽">` : `<span class="hint">上傳圖片後，將自動分析色彩並推薦主題</span>`;
        };

        imageInput?.addEventListener('change', async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const dataUrl = await readImageAsDataURL(file);
            lastImageDataUrl = dataUrl;
            setPreview(dataUrl);
            const palette = await extractPalette(dataUrl);
            lastPalette = palette;
            updatePaletteUI(palette);
        });

        applyImageBtn?.addEventListener('click', () => {
            if (!lastPalette) return;
            applyImageTheme({ ...lastPalette, dataUrl: lastImageDataUrl });
        });

        resetImageBtn?.addEventListener('click', () => {
            lastPalette = null;
            lastImageDataUrl = '';
            paletteRow.hidden = true;
            setPreview('');
            localStorage.removeItem(THEME_IMAGE_KEY);
        });

        const setAiPreview = (url) => {
            if (!aiPreview) return;
            aiPreview.innerHTML = url ? `<img src="${url}" alt="AI 主題預覽">` : `<span class="hint">上傳圖片後，將分析並產生主題 CSS</span>`;
        };

        const setModeToggle = (wrap, mode) => {
            if (!wrap) return;
            wrap.querySelectorAll('.mode-pill').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.mode === mode);
            });
            wrap.dataset.mode = mode;
        };

        const getModeToggle = (wrap) => wrap?.dataset.mode || 'dark';

        aiImageModeToggle?.addEventListener('click', (event) => {
            const btn = event.target.closest('.mode-pill');
            if (!btn) return;
            setModeToggle(aiImageModeToggle, btn.dataset.mode || 'dark');
        });

        aiTextModeToggle?.addEventListener('click', (event) => {
            const btn = event.target.closest('.mode-pill');
            if (!btn) return;
            setModeToggle(aiTextModeToggle, btn.dataset.mode || 'dark');
        });

        setModeToggle(aiImageModeToggle, 'dark');
        setModeToggle(aiTextModeToggle, 'dark');

        aiInput?.addEventListener('change', async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const dataUrl = await readImageAsDataURL(file);
            aiImageDataUrl = dataUrl;
            setAiPreview(dataUrl);
            const palette = await extractPalette(dataUrl);
            aiPalette = palette;
            const forced = getModeToggle(aiImageModeToggle);
            const generated = buildCssThemeFromPalette(palette, forced);
            if (aiCssOutput) aiCssOutput.value = generated.css;
        });

        aiPreviewBtn?.addEventListener('click', () => {
            if (!aiPalette) return;
            const forced = getModeToggle(aiImageModeToggle);
            const generated = buildCssThemeFromPalette(aiPalette, forced);
            applyMode(generated.mode);
            applyAccent(aiPalette.accent);
        });

        aiApplyBtn?.addEventListener('click', () => {
            if (!aiPalette) return;
            const forced = getModeToggle(aiImageModeToggle);
            const generated = buildCssThemeFromPalette(aiPalette, forced);
            localStorage.setItem('sx_theme_text_color', generated.text);
            localStorage.setItem('sx_theme_icon_border_color', generated.iconBorder);
            localStorage.setItem('sx_theme_app_bg_color', generated.appBg);
            applyMode(generated.mode);
            applyAccent(aiPalette.accent);
            window.parent?.postMessage({
                type: 'THEME_IMAGE_UPDATED',
                accent: aiPalette.accent,
                mode: generated.mode,
                dataUrl: aiImageDataUrl
            }, '*');
            window.parent?.postMessage({ type: 'THEME_TEXT_COLOR_CHANGED', color: generated.text }, '*');
            window.parent?.postMessage({ type: 'THEME_ICON_BORDER_COLOR_CHANGED', color: generated.iconBorder }, '*');
            window.parent?.postMessage({ type: 'THEME_APP_BG_CHANGED', color: generated.appBg, alpha: 30 }, '*');
        });

        aiTextPreviewBtn?.addEventListener('click', () => {
            const prompt = aiTextPrompt?.value.trim() || '';
            const forced = getModeToggle(aiTextModeToggle);
            const generated = buildThemeFromPrompt(prompt, forced);
            if (aiTextCssOutput) aiTextCssOutput.value = generated.css;
            applyMode(generated.mode);
            applyAccent(generated.accent);
        });

        aiTextApplyBtn?.addEventListener('click', () => {
            const prompt = aiTextPrompt?.value.trim() || '';
            const forced = getModeToggle(aiTextModeToggle);
            const generated = buildThemeFromPrompt(prompt, forced);
            if (aiTextCssOutput) aiTextCssOutput.value = generated.css;
            localStorage.setItem('sx_theme_text_color', generated.text);
            localStorage.setItem('sx_theme_icon_border_color', generated.iconBorder);
            localStorage.setItem('sx_theme_app_bg_color', generated.appBg);
            applyMode(generated.mode);
            applyAccent(generated.accent);
            window.parent?.postMessage({ type: 'THEME_TEXT_COLOR_CHANGED', color: generated.text }, '*');
            window.parent?.postMessage({ type: 'THEME_ICON_BORDER_COLOR_CHANGED', color: generated.iconBorder }, '*');
            window.parent?.postMessage({ type: 'THEME_APP_BG_CHANGED', color: generated.appBg, alpha: 30 }, '*');
        });

        const setPatternPreview = (url) => {
            if (!patternPreview) return;
            if (!url) {
                patternPreview.removeAttribute('style');
                patternPreview.innerHTML = '<span class="hint">上傳圖片後，會自動複製成一列並旋轉 45 度平鋪填滿畫面</span>';
                return;
            }
            patternPreview.innerHTML = '';
            patternPreview.style.backgroundImage = `url('${url}')`;
            patternPreview.style.backgroundSize = 'cover';
            patternPreview.style.backgroundPosition = 'center';
            patternPreview.style.backgroundRepeat = 'no-repeat';
        };

        const setPatternAngle = (angle) => {
            if (!patternAngleToggle) return;
            const resolved = String(angle) === '45' ? '45' : '-45';
            patternAngleToggle.dataset.angle = resolved;
            patternAngleToggle.querySelectorAll('.mode-pill').forEach((btn) => {
                btn.classList.toggle('active', btn.dataset.angle === resolved);
            });
        };

        const getPatternConfig = () => ({
            bgColor: patternBgColor?.value || '#0B0C12',
            size: Number(patternSize?.value || 86),
            gap: Number(patternGap?.value || 20),
            angle: Number(patternAngleToggle?.dataset.angle || '-45')
        });

        const regeneratePattern = async () => {
            if (!patternImageDataUrl) return '';
            const next = await buildPatternWallpaper(patternImageDataUrl, getPatternConfig());
            patternWallpaperDataUrl = next;
            setPatternPreview(next);
            return next;
        };

        patternAngleToggle?.addEventListener('click', (event) => {
            const btn = event.target.closest('.mode-pill');
            if (!btn) return;
            setPatternAngle(btn.dataset.angle || '-45');
            regeneratePattern().catch(() => {});
        });

        patternInput?.addEventListener('change', async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const dataUrl = await readImageAsDataURL(file);
            patternImageDataUrl = dataUrl;
            await regeneratePattern();
        });

        [patternBgColor, patternSize, patternGap].forEach((el) => {
            el?.addEventListener('input', () => {
                regeneratePattern().catch(() => {});
            });
        });

        patternPreviewBtn?.addEventListener('click', async () => {
            if (!patternImageDataUrl) return;
            const wallpaper = patternWallpaperDataUrl || await regeneratePattern();
            setPatternPreview(wallpaper);
        });

        patternApplyBtn?.addEventListener('click', async () => {
            if (!patternImageDataUrl) return;
            const wallpaper = patternWallpaperDataUrl || await regeneratePattern();
            localStorage.setItem(PATTERN_WALLPAPER_KEY, wallpaper);
            window.parent?.postMessage({ type: 'updateWallpaper', url: wallpaper }, '*');
            // 同步到雲端
            window.parent?.postMessage({ type: 'TRIGGER_GITHUB_SYNC' }, '*');
        });

        setPatternAngle('-45');
        const savedPattern = localStorage.getItem(PATTERN_WALLPAPER_KEY);
        if (savedPattern) {
            patternWallpaperDataUrl = savedPattern;
            setPatternPreview(savedPattern);
        }

        const CUSTOM_THEME_KEY = 'sx_custom_theme_config';

        const defaultCustomTheme = () => ({
            textPrimary: '#ffffff',
            textSecondary: '#9ca3af',
            textHeading: '#ffffff',
            textLink: '#5B8DEF',
            borderWidth: 1,
            borderColor: '#ffffff',
            cardBorderWidth: 1,
            cardRadius: 18,
            elementGap: 12,
            statusbarPosition: 'top',
            statusbarPadding: 15,
            homePaddingTop: 70,
            homePaddingBottom: 34,
            iconGap: 18,
            hideTopbar: false,
            hideTopbarHome: false,
            fontSize: 14,
            headingSize: 22,
            appLabelSize: 12,
            timeSize: 80,
            dateSize: 16,
            phoneStyle: 'iphone-14',
            phoneBorderWidth: 12,
            phoneBorderColor: '#333333',
            phoneBorderRadius: 55,
            phoneWidthRatio: 46,
            batteryShowPercent: true,
            batteryIconStyle: 'full',
            batteryLevel: 100,
            batteryLowWarning: 20,
            batteryLowColor: '#FF3B30',
            fontPrimary: "'SF Pro Display', sans-serif",
            fontLockTime: "'SF Pro Display', sans-serif",
            fontChat: "'SF Pro Display', sans-serif",
            fontAppTitle: "'SF Pro Display', sans-serif",
            fontCustomUrl: '',
            fontCustomName: '',
            iconSize: 62,
            iconRadius: 20,
            iconInnerSize: 28,
            iconOpacity: 100,
            iconShadow: 28,
            appBgColor: '#1c1c1e',
            appBgOpacity: 30,
            appBgBlur: 20,
            appBgSaturate: 200
        });

        const loadCustomTheme = () => {
            const base = defaultCustomTheme();
            try {
                const raw = localStorage.getItem(CUSTOM_THEME_KEY);
                if (!raw) return base;
                const parsed = JSON.parse(raw);
                return { ...base, ...parsed };
            } catch {
                return base;
            }
        };

        const saveCustomTheme = (config) => {
            localStorage.setItem(CUSTOM_THEME_KEY, JSON.stringify(config));
            window.parent?.postMessage({ type: 'CUSTOM_THEME_UPDATED', config }, '*');
            // 同步到雲端
            window.parent?.postMessage({ type: 'TRIGGER_GITHUB_SYNC' }, '*');
            console.log('[Appearance] 自訂主題已儲存並同步:', config);
        };

        const applyCustomThemeToParent = (config) => {
            window.parent?.postMessage({ type: 'CUSTOM_THEME_APPLY', config }, '*');
            // 通知所有應用程式更新主題
            window.parent?.postMessage({ type: 'APPEARANCE_THEME_CHANGED', config }, '*');
        };

        const setupRangeValueSync = (inputId, valueId, suffix = 'px') => {
            const input = document.getElementById(inputId);
            const value = document.getElementById(valueId);
            if (input && value) {
                value.textContent = input.value + suffix;
                input.addEventListener('input', () => {
                    value.textContent = input.value + suffix;
                });
            }
        };

        const setupCustomThemeInputs = () => {
            const config = loadCustomTheme();

            const textPrimary = document.getElementById('global-text-primary');
            const textSecondary = document.getElementById('global-text-secondary');
            const textHeading = document.getElementById('global-text-heading');
            const textLink = document.getElementById('global-text-link');

            if (textPrimary) textPrimary.value = config.textPrimary;
            if (textSecondary) textSecondary.value = config.textSecondary;
            if (textHeading) textHeading.value = config.textHeading;
            if (textLink) textLink.value = config.textLink;

            const applyTextColorBtn = document.getElementById('apply-text-color-btn');
            const resetTextColorBtn = document.getElementById('reset-text-color-btn');

            applyTextColorBtn?.addEventListener('click', () => {
                const newConfig = loadCustomTheme();
                newConfig.textPrimary = textPrimary?.value || '#ffffff';
                newConfig.textSecondary = textSecondary?.value || '#9ca3af';
                newConfig.textHeading = textHeading?.value || '#ffffff';
                newConfig.textLink = textLink?.value || '#5B8DEF';
                saveCustomTheme(newConfig);
                applyCustomThemeToParent(newConfig);
            });

            resetTextColorBtn?.addEventListener('click', () => {
                const def = defaultCustomTheme();
                if (textPrimary) textPrimary.value = def.textPrimary;
                if (textSecondary) textSecondary.value = def.textSecondary;
                if (textHeading) textHeading.value = def.textHeading;
                if (textLink) textLink.value = def.textLink;
            });

            const borderWidth = document.getElementById('global-border-width');
            const borderColor = document.getElementById('global-border-color');
            const cardBorderWidth = document.getElementById('global-card-border-width');
            const cardRadius = document.getElementById('global-card-radius');
            const elementGap = document.getElementById('global-element-gap');

            if (borderWidth) borderWidth.value = config.borderWidth;
            if (borderColor) borderColor.value = config.borderColor;
            if (cardBorderWidth) cardBorderWidth.value = config.cardBorderWidth;
            if (cardRadius) cardRadius.value = config.cardRadius;
            if (elementGap) elementGap.value = config.elementGap;

            setupRangeValueSync('global-border-width', 'border-width-value', 'px');
            setupRangeValueSync('global-card-border-width', 'card-border-width-value', 'px');
            setupRangeValueSync('global-card-radius', 'card-radius-value', 'px');
            setupRangeValueSync('global-element-gap', 'element-gap-value', 'px');

            const applyBorderBtn = document.getElementById('apply-border-btn');
            const resetBorderBtn = document.getElementById('reset-border-btn');

            applyBorderBtn?.addEventListener('click', () => {
                const newConfig = loadCustomTheme();
                newConfig.borderWidth = Number(borderWidth?.value || 1);
                newConfig.borderColor = borderColor?.value || '#ffffff';
                newConfig.cardBorderWidth = Number(cardBorderWidth?.value || 1);
                newConfig.cardRadius = Number(cardRadius?.value || 18);
                newConfig.elementGap = Number(elementGap?.value || 12);
                saveCustomTheme(newConfig);
                applyCustomThemeToParent(newConfig);
            });

            resetBorderBtn?.addEventListener('click', () => {
                const def = defaultCustomTheme();
                if (borderWidth) borderWidth.value = def.borderWidth;
                if (borderColor) borderColor.value = def.borderColor;
                if (cardBorderWidth) cardBorderWidth.value = def.cardBorderWidth;
                if (cardRadius) cardRadius.value = def.cardRadius;
                if (elementGap) elementGap.value = def.elementGap;
                document.getElementById('border-width-value').textContent = def.borderWidth + 'px';
                document.getElementById('card-border-width-value').textContent = def.cardBorderWidth + 'px';
                document.getElementById('card-radius-value').textContent = def.cardRadius + 'px';
                document.getElementById('element-gap-value').textContent = def.elementGap + 'px';
            });

            const hideTopbar = document.getElementById('hide-topbar');
            const hideTopbarHome = document.getElementById('hide-topbar-home');
            const statusbarPosition = document.getElementById('global-statusbar-position');
            const statusbarPadding = document.getElementById('global-statusbar-padding');
            const homePaddingTop = document.getElementById('global-home-padding-top');
            const homePaddingBottom = document.getElementById('global-home-padding-bottom');
            const iconGap = document.getElementById('global-icon-gap');

            if (hideTopbar) hideTopbar.checked = config.hideTopbar || false;
            if (hideTopbarHome) hideTopbarHome.checked = config.hideTopbarHome || false;
            if (statusbarPosition) statusbarPosition.value = config.statusbarPosition;
            if (statusbarPadding) statusbarPadding.value = config.statusbarPadding;
            if (homePaddingTop) homePaddingTop.value = config.homePaddingTop;
            if (homePaddingBottom) homePaddingBottom.value = config.homePaddingBottom;
            if (iconGap) iconGap.value = config.iconGap;

            setupRangeValueSync('global-statusbar-padding', 'statusbar-padding-value', 'px');
            setupRangeValueSync('global-home-padding-top', 'home-padding-top-value', 'px');
            setupRangeValueSync('global-home-padding-bottom', 'home-padding-bottom-value', 'px');
            setupRangeValueSync('global-icon-gap', 'icon-gap-value', 'px');

            const applyPositionBtn = document.getElementById('apply-position-btn');
            const resetPositionBtn = document.getElementById('reset-position-btn');

            applyPositionBtn?.addEventListener('click', () => {
                const newConfig = loadCustomTheme();
                newConfig.hideTopbar = hideTopbar?.checked || false;
                newConfig.hideTopbarHome = hideTopbarHome?.checked || false;
                newConfig.statusbarPosition = statusbarPosition?.value || 'top';
                newConfig.statusbarPadding = Number(statusbarPadding?.value || 15);
                newConfig.homePaddingTop = Number(homePaddingTop?.value || 70);
                newConfig.homePaddingBottom = Number(homePaddingBottom?.value || 34);
                newConfig.iconGap = Number(iconGap?.value || 18);
                saveCustomTheme(newConfig);
                applyCustomThemeToParent(newConfig);
            });

            resetPositionBtn?.addEventListener('click', () => {
                const def = defaultCustomTheme();
                if (hideTopbar) hideTopbar.checked = def.hideTopbar;
                if (hideTopbarHome) hideTopbarHome.checked = def.hideTopbarHome;
                if (statusbarPosition) statusbarPosition.value = def.statusbarPosition;
                if (statusbarPadding) statusbarPadding.value = def.statusbarPadding;
                if (homePaddingTop) homePaddingTop.value = def.homePaddingTop;
                if (homePaddingBottom) homePaddingBottom.value = def.homePaddingBottom;
                if (iconGap) iconGap.value = def.iconGap;
                document.getElementById('statusbar-padding-value').textContent = def.statusbarPadding + 'px';
                document.getElementById('home-padding-top-value').textContent = def.homePaddingTop + 'px';
                document.getElementById('home-padding-bottom-value').textContent = def.homePaddingBottom + 'px';
                document.getElementById('icon-gap-value').textContent = def.iconGap + 'px';
            });

            const fontSize = document.getElementById('global-font-size');
            const headingSize = document.getElementById('global-heading-size');
            const appLabelSize = document.getElementById('global-app-label-size');
            const timeSize = document.getElementById('global-time-size');
            const dateSize = document.getElementById('global-date-size');

            if (fontSize) fontSize.value = config.fontSize;
            if (headingSize) headingSize.value = config.headingSize;
            if (appLabelSize) appLabelSize.value = config.appLabelSize;
            if (timeSize) timeSize.value = config.timeSize;
            if (dateSize) dateSize.value = config.dateSize;

            setupRangeValueSync('global-font-size', 'font-size-value', 'px');
            setupRangeValueSync('global-heading-size', 'heading-size-value', 'px');
            setupRangeValueSync('global-app-label-size', 'app-label-size-value', 'px');
            setupRangeValueSync('global-time-size', 'time-size-value', 'px');
            setupRangeValueSync('global-date-size', 'date-size-value', 'px');

            const applyFontSizeBtn = document.getElementById('apply-font-size-btn');
            const resetFontSizeBtn = document.getElementById('reset-font-size-btn');

            applyFontSizeBtn?.addEventListener('click', () => {
                const newConfig = loadCustomTheme();
                newConfig.fontSize = Number(fontSize?.value || 14);
                newConfig.headingSize = Number(headingSize?.value || 22);
                newConfig.appLabelSize = Number(appLabelSize?.value || 12);
                newConfig.timeSize = Number(timeSize?.value || 80);
                newConfig.dateSize = Number(dateSize?.value || 16);
                saveCustomTheme(newConfig);
                applyCustomThemeToParent(newConfig);
            });

            resetFontSizeBtn?.addEventListener('click', () => {
                const def = defaultCustomTheme();
                if (fontSize) fontSize.value = def.fontSize;
                if (headingSize) headingSize.value = def.headingSize;
                if (appLabelSize) appLabelSize.value = def.appLabelSize;
                if (timeSize) timeSize.value = def.timeSize;
                if (dateSize) dateSize.value = def.dateSize;
                document.getElementById('font-size-value').textContent = def.fontSize + 'px';
                document.getElementById('heading-size-value').textContent = def.headingSize + 'px';
                document.getElementById('app-label-size-value').textContent = def.appLabelSize + 'px';
                document.getElementById('time-size-value').textContent = def.timeSize + 'px';
                document.getElementById('date-size-value').textContent = def.dateSize + 'px';
            });

            const phoneStyleInputs = document.querySelectorAll('input[name="phone-style"]');
            phoneStyleInputs.forEach(input => {
                input.checked = input.value === config.phoneStyle;
            });

            const phoneBorderWidth = document.getElementById('phone-border-width');
            const phoneBorderColor = document.getElementById('phone-border-color');
            const phoneBorderRadius = document.getElementById('phone-border-radius');
            const phoneWidthRatio = document.getElementById('phone-width-ratio');

            if (phoneBorderWidth) phoneBorderWidth.value = config.phoneBorderWidth;
            if (phoneBorderColor) phoneBorderColor.value = config.phoneBorderColor;
            if (phoneBorderRadius) phoneBorderRadius.value = config.phoneBorderRadius;
            if (phoneWidthRatio) phoneWidthRatio.value = config.phoneWidthRatio;

            setupRangeValueSync('phone-border-width', 'phone-border-width-value', 'px');
            setupRangeValueSync('phone-border-radius', 'phone-border-radius-value', 'px');
            setupRangeValueSync('phone-width-ratio', 'phone-width-ratio-value', '%');

            const applyPhoneStyleBtn = document.getElementById('apply-phone-style-btn');
            const resetPhoneStyleBtn = document.getElementById('reset-phone-style-btn');

            applyPhoneStyleBtn?.addEventListener('click', () => {
                const newConfig = loadCustomTheme();
                const selectedStyle = document.querySelector('input[name="phone-style"]:checked');
                newConfig.phoneStyle = selectedStyle?.value || 'iphone-14';
                newConfig.phoneBorderWidth = Number(phoneBorderWidth?.value || 12);
                newConfig.phoneBorderColor = phoneBorderColor?.value || '#333333';
                newConfig.phoneBorderRadius = Number(phoneBorderRadius?.value || 55);
                newConfig.phoneWidthRatio = Number(phoneWidthRatio?.value || 46);
                saveCustomTheme(newConfig);
                applyCustomThemeToParent(newConfig);
            });

            resetPhoneStyleBtn?.addEventListener('click', () => {
                const def = defaultCustomTheme();
                phoneStyleInputs.forEach(input => {
                    input.checked = input.value === def.phoneStyle;
                });
                if (phoneBorderWidth) phoneBorderWidth.value = def.phoneBorderWidth;
                if (phoneBorderColor) phoneBorderColor.value = def.phoneBorderColor;
                if (phoneBorderRadius) phoneBorderRadius.value = def.phoneBorderRadius;
                if (phoneWidthRatio) phoneWidthRatio.value = def.phoneWidthRatio;
                document.getElementById('phone-border-width-value').textContent = def.phoneBorderWidth + 'px';
                document.getElementById('phone-border-radius-value').textContent = def.phoneBorderRadius + 'px';
                document.getElementById('phone-width-ratio-value').textContent = def.phoneWidthRatio + '%';
            });

            const batteryShowPercent = document.getElementById('battery-show-percent');
            const batteryIconStyle = document.getElementById('battery-icon-style');
            const batteryLevel = document.getElementById('battery-level');
            const batteryLowWarning = document.getElementById('battery-low-warning');
            const batteryLowColor = document.getElementById('battery-low-color');

            if (batteryShowPercent) batteryShowPercent.checked = config.batteryShowPercent;
            if (batteryIconStyle) batteryIconStyle.value = config.batteryIconStyle;
            if (batteryLevel) batteryLevel.value = config.batteryLevel;
            if (batteryLowWarning) batteryLowWarning.value = config.batteryLowWarning;
            if (batteryLowColor) batteryLowColor.value = config.batteryLowColor;

            setupRangeValueSync('battery-level', 'battery-level-value', '%');
            setupRangeValueSync('battery-low-warning', 'battery-low-warning-value', '%');

            const applyBatteryBtn = document.getElementById('apply-battery-btn');
            const resetBatteryBtn = document.getElementById('reset-battery-btn');

            applyBatteryBtn?.addEventListener('click', () => {
                const newConfig = loadCustomTheme();
                newConfig.batteryShowPercent = !!batteryShowPercent?.checked;
                newConfig.batteryIconStyle = batteryIconStyle?.value || 'full';
                newConfig.batteryLevel = Number(batteryLevel?.value || 100);
                newConfig.batteryLowWarning = Number(batteryLowWarning?.value || 20);
                newConfig.batteryLowColor = batteryLowColor?.value || '#FF3B30';
                saveCustomTheme(newConfig);
                applyCustomThemeToParent(newConfig);
            });

            resetBatteryBtn?.addEventListener('click', () => {
                const def = defaultCustomTheme();
                if (batteryShowPercent) batteryShowPercent.checked = def.batteryShowPercent;
                if (batteryIconStyle) batteryIconStyle.value = def.batteryIconStyle;
                if (batteryLevel) batteryLevel.value = def.batteryLevel;
                if (batteryLowWarning) batteryLowWarning.value = def.batteryLowWarning;
                if (batteryLowColor) batteryLowColor.value = def.batteryLowColor;
                document.getElementById('battery-level-value').textContent = def.batteryLevel + '%';
                document.getElementById('battery-low-warning-value').textContent = def.batteryLowWarning + '%';
            });

            const fontPrimary = document.getElementById('font-primary');
            const fontLockTime = document.getElementById('font-lock-time');
            const fontChat = document.getElementById('font-chat');
            const fontAppTitle = document.getElementById('font-app-title');
            const fontCustomUrl = document.getElementById('font-custom-url');
            const fontCustomName = document.getElementById('font-custom-name');

            if (fontPrimary) fontPrimary.value = config.fontPrimary;
            if (fontLockTime) fontLockTime.value = config.fontLockTime;
            if (fontChat) fontChat.value = config.fontChat;
            if (fontAppTitle) fontAppTitle.value = config.fontAppTitle;
            if (fontCustomUrl) fontCustomUrl.value = config.fontCustomUrl;
            if (fontCustomName) fontCustomName.value = config.fontCustomName;

            const applyFontBtn = document.getElementById('apply-font-btn');
            const resetFontBtn = document.getElementById('reset-font-btn');

            applyFontBtn?.addEventListener('click', () => {
                const newConfig = loadCustomTheme();
                newConfig.fontPrimary = fontPrimary?.value || "'SF Pro Display', sans-serif";
                newConfig.fontLockTime = fontLockTime?.value || "'SF Pro Display', sans-serif";
                newConfig.fontChat = fontChat?.value || "'SF Pro Display', sans-serif";
                newConfig.fontAppTitle = fontAppTitle?.value || "'SF Pro Display', sans-serif";
                newConfig.fontCustomUrl = fontCustomUrl?.value || '';
                newConfig.fontCustomName = fontCustomName?.value || '';
                saveCustomTheme(newConfig);
                applyCustomThemeToParent(newConfig);
            });

            resetFontBtn?.addEventListener('click', () => {
                const def = defaultCustomTheme();
                if (fontPrimary) fontPrimary.value = def.fontPrimary;
                if (fontLockTime) fontLockTime.value = def.fontLockTime;
                if (fontChat) fontChat.value = def.fontChat;
                if (fontAppTitle) fontAppTitle.value = def.fontAppTitle;
                if (fontCustomUrl) fontCustomUrl.value = def.fontCustomUrl;
                if (fontCustomName) fontCustomName.value = def.fontCustomName;
            });

            const iconSize = document.getElementById('icon-size');
            const iconRadius = document.getElementById('icon-radius');
            const iconInnerSize = document.getElementById('icon-inner-size');
            const iconOpacity = document.getElementById('icon-opacity');
            const iconShadow = document.getElementById('icon-shadow');

            if (iconSize) iconSize.value = config.iconSize;
            if (iconRadius) iconRadius.value = config.iconRadius;
            if (iconInnerSize) iconInnerSize.value = config.iconInnerSize;
            if (iconOpacity) iconOpacity.value = config.iconOpacity;
            if (iconShadow) iconShadow.value = config.iconShadow;

            setupRangeValueSync('icon-size', 'icon-size-value', 'px');
            setupRangeValueSync('icon-radius', 'icon-radius-value', 'px');
            setupRangeValueSync('icon-inner-size', 'icon-inner-size-value', 'px');
            setupRangeValueSync('icon-opacity', 'icon-opacity-value', '%');

            const applyIconStyleBtn = document.getElementById('apply-icon-style-btn');
            const resetIconStyleBtn = document.getElementById('reset-icon-style-btn');

            applyIconStyleBtn?.addEventListener('click', () => {
                const newConfig = loadCustomTheme();
                newConfig.iconSize = Number(iconSize?.value || 62);
                newConfig.iconRadius = Number(iconRadius?.value || 20);
                newConfig.iconInnerSize = Number(iconInnerSize?.value || 28);
                newConfig.iconOpacity = Number(iconOpacity?.value || 100);
                newConfig.iconShadow = Number(iconShadow?.value || 28);
                saveCustomTheme(newConfig);
                applyCustomThemeToParent(newConfig);
            });

            resetIconStyleBtn?.addEventListener('click', () => {
                const def = defaultCustomTheme();
                if (iconSize) iconSize.value = def.iconSize;
                if (iconRadius) iconRadius.value = def.iconRadius;
                if (iconInnerSize) iconInnerSize.value = def.iconInnerSize;
                if (iconOpacity) iconOpacity.value = def.iconOpacity;
                if (iconShadow) iconShadow.value = def.iconShadow;
                document.getElementById('icon-size-value').textContent = def.iconSize + 'px';
                document.getElementById('icon-radius-value').textContent = def.iconRadius + 'px';
                document.getElementById('icon-inner-size-value').textContent = def.iconInnerSize + 'px';
                document.getElementById('icon-opacity-value').textContent = def.iconOpacity + '%';
            });

            const appBgColor = document.getElementById('app-bg-color');
            const appBgOpacity = document.getElementById('app-bg-opacity');
            const appBgBlur = document.getElementById('app-bg-blur');
            const appBgSaturate = document.getElementById('app-bg-saturate');

            if (appBgColor) appBgColor.value = config.appBgColor;
            if (appBgOpacity) appBgOpacity.value = config.appBgOpacity;
            if (appBgBlur) appBgBlur.value = config.appBgBlur;
            if (appBgSaturate) appBgSaturate.value = config.appBgSaturate;

            setupRangeValueSync('app-bg-opacity', 'app-bg-opacity-value', '%');
            setupRangeValueSync('app-bg-blur', 'app-bg-blur-value', 'px');
            setupRangeValueSync('app-bg-saturate', 'app-bg-saturate-value', '%');

            const applyBackgroundBtn = document.getElementById('apply-background-btn');
            const resetBackgroundBtn = document.getElementById('reset-background-btn');

            applyBackgroundBtn?.addEventListener('click', () => {
                const newConfig = loadCustomTheme();
                newConfig.appBgColor = appBgColor?.value || '#1c1c1e';
                newConfig.appBgOpacity = Number(appBgOpacity?.value || 30);
                newConfig.appBgBlur = Number(appBgBlur?.value || 20);
                newConfig.appBgSaturate = Number(appBgSaturate?.value || 200);
                saveCustomTheme(newConfig);
                applyCustomThemeToParent(newConfig);
            });

            resetBackgroundBtn?.addEventListener('click', () => {
                const def = defaultCustomTheme();
                if (appBgColor) appBgColor.value = def.appBgColor;
                if (appBgOpacity) appBgOpacity.value = def.appBgOpacity;
                if (appBgBlur) appBgBlur.value = def.appBgBlur;
                if (appBgSaturate) appBgSaturate.value = def.appBgSaturate;
                document.getElementById('app-bg-opacity-value').textContent = def.appBgOpacity + '%';
                document.getElementById('app-bg-blur-value').textContent = def.appBgBlur + 'px';
                document.getElementById('app-bg-saturate-value').textContent = def.appBgSaturate + '%';
            });



        setupCustomThemeInputs();

        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            backBtn.onclick = () => window.parent?.postMessage({ type: 'closeApp' }, '*');
        }

        // 自訂外觀設定編輯按鈕
        const editCustomLightBtn = document.getElementById('edit-custom-light-btn');
        const editCustomDarkBtn = document.getElementById('edit-custom-dark-btn');

        if (editCustomLightBtn) {
            editCustomLightBtn.addEventListener('click', () => {
                localStorage.setItem('sx_theme_mode', 'custom-light');
                modeInputs().forEach(input => {
                    input.checked = input.value === 'custom-light';
                });
                applyMode('custom-light');
                showAppearanceSettingsInline('light');
            });
        }

        if (editCustomDarkBtn) {
            editCustomDarkBtn.addEventListener('click', () => {
                localStorage.setItem('sx_theme_mode', 'custom-dark');
                modeInputs().forEach(input => {
                    input.checked = input.value === 'custom-dark';
                });
                applyMode('custom-dark');
                showAppearanceSettingsInline('dark');
            });
        }
    };

    const showAppearanceSettingsInline = (themeType) => {
        const existingPanel = document.getElementById('inline-appearance-panel');
        if (existingPanel) {
            existingPanel.remove();
            return;
        }

        const settings = themeType === 'light' 
            ? (JSON.parse(localStorage.getItem('sx_app_interface_custom_light') || 'null') || {
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
            })
            : (JSON.parse(localStorage.getItem('sx_app_interface_custom_dark') || 'null') || {
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
            });

        const panel = document.createElement('section');
        panel.className = 'card inline-appearance-panel';
        panel.id = 'inline-appearance-panel';
        panel.innerHTML = `
            <div class="card-title" style="display:flex;justify-content:space-between;align-items:center;">
                <span>${themeType === 'light' ? '自訂淺色' : '自訂深色'}設定</span>
                <button class="ghost-btn" onclick="this.closest('.inline-appearance-panel').remove()" style="padding:6px 12px;font-size:13px;">關閉</button>
            </div>
            <div class="inline-settings-content">
                <div class="sx-section-title">顏色設定</div>
                <div class="sx-color-grid">
                    <label class="sx-field">
                        <span>背景色</span>
                        <input type="color" id="inline-bg-color" value="${settings.bgColor}">
                    </label>
                    <label class="sx-field">
                        <span>卡片背景色</span>
                        <input type="color" id="inline-card-bg-color" value="${settings.cardBgColor}">
                    </label>
                    <label class="sx-field">
                        <span>主要文字色</span>
                        <input type="color" id="inline-text-color" value="${settings.textColor}">
                    </label>
                    <label class="sx-field">
                        <span>次要文字色</span>
                        <input type="color" id="inline-muted-color" value="${settings.mutedColor}">
                    </label>
                    <label class="sx-field">
                        <span>邊框顏色</span>
                        <input type="color" id="inline-border-color" value="${settings.borderColor}">
                    </label>
                    <label class="sx-field">
                        <span>強調色</span>
                        <input type="color" id="inline-accent-color" value="${settings.accentColor}">
                    </label>
                </div>
                
                <div class="sx-section-title">字體與大小</div>
                <label class="sx-field sx-field-row">
                    <span>應用字體</span>
                    <select id="inline-font-family">
                        <option value="'SF Pro Display', sans-serif" ${settings.fontFamily.includes('SF Pro') ? 'selected' : ''}>SF Pro Display</option>
                        <option value="'PingFang TC', sans-serif" ${settings.fontFamily.includes('PingFang') ? 'selected' : ''}>PingFang TC</option>
                        <option value="'Noto Sans TC', sans-serif" ${settings.fontFamily.includes('Noto Sans') ? 'selected' : ''}>Noto Sans TC</option>
                        <option value="'Microsoft JhengHei', sans-serif" ${settings.fontFamily.includes('JhengHei') ? 'selected' : ''}>微軟正黑體</option>
                        <option value="system-ui, sans-serif" ${settings.fontFamily.includes('system-ui') ? 'selected' : ''}>系統預設</option>
                    </select>
                </label>
                <label class="sx-field sx-field-row">
                    <span>基礎字體大小</span>
                    <input type="range" id="inline-font-size" min="12" max="18" step="1" value="${settings.fontSize}">
                    <span class="sx-range-val" id="inline-font-size-val">${settings.fontSize}px</span>
                </label>
                <label class="sx-field sx-field-row">
                    <span>標題字體大小</span>
                    <input type="range" id="inline-heading-size" min="16" max="28" step="1" value="${settings.headingSize}">
                    <span class="sx-range-val" id="inline-heading-size-val">${settings.headingSize}px</span>
                </label>
                <label class="sx-field sx-field-row">
                    <span>行高</span>
                    <input type="range" id="inline-line-height" min="1.2" max="2" step="0.1" value="${settings.lineHeight}">
                    <span class="sx-range-val" id="inline-line-height-val">${settings.lineHeight}</span>
                </label>
                
                <div class="sx-section-title">排版設定</div>
                <label class="sx-field sx-field-row">
                    <span>卡片圓角</span>
                    <input type="range" id="inline-card-radius" min="0" max="24" step="2" value="${settings.cardRadius}">
                    <span class="sx-range-val" id="inline-card-radius-val">${settings.cardRadius}px</span>
                </label>
                <label class="sx-field sx-field-row">
                    <span>卡片內距</span>
                    <input type="range" id="inline-card-padding" min="8" max="24" step="2" value="${settings.cardPadding}">
                    <span class="sx-range-val" id="inline-card-padding-val">${settings.cardPadding}px</span>
                </label>
                <label class="sx-field sx-field-row">
                    <span>區塊間距</span>
                    <input type="range" id="inline-section-gap" min="8" max="24" step="2" value="${settings.sectionGap}">
                    <span class="sx-range-val" id="inline-section-gap-val">${settings.sectionGap}px</span>
                </label>
                <label class="sx-field sx-field-row">
                    <span>按鈕圓角</span>
                    <input type="range" id="inline-btn-radius" min="4" max="20" step="1" value="${settings.btnRadius}">
                    <span class="sx-range-val" id="inline-btn-radius-val">${settings.btnRadius}px</span>
                </label>
                <label class="sx-field sx-field-row">
                    <span>輸入框圓角</span>
                    <input type="range" id="inline-input-radius" min="4" max="20" step="1" value="${settings.inputRadius}">
                    <span class="sx-range-val" id="inline-input-radius-val">${settings.inputRadius}px</span>
                </label>
                
                <div class="sx-section-title">特效設定</div>
                <label class="sx-field sx-field-row">
                    <span>卡片陰影強度</span>
                    <input type="range" id="inline-shadow" min="0" max="50" step="5" value="${settings.shadow}">
                    <span class="sx-range-val" id="inline-shadow-val">${settings.shadow}</span>
                </label>
                <label class="sx-field sx-field-row">
                    <span>背景模糊</span>
                    <input type="range" id="inline-blur" min="0" max="20" step="1" value="${settings.blur}">
                    <span class="sx-range-val" id="inline-blur-val">${settings.blur}px</span>
                </label>
                <label class="sx-field sx-field-row">
                    <span>動畫速度</span>
                    <select id="inline-animation-speed">
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
                <textarea id="inline-custom-css" rows="4" placeholder="輸入自訂 CSS...">${settings.customCss || ''}</textarea>
                
                <div class="icon-actions" style="margin-top:16px;">
                    <button class="ghost-btn" id="inline-reset-btn" type="button">重置</button>
                    <button class="ghost-btn" id="inline-save-btn" type="button" style="background:#34C759;color:#fff;border-color:#34C759;">儲存外觀設定</button>
                    <button class="primary-btn" id="inline-apply-btn" type="button">套用</button>
                </div>
            </div>
        `;

        const appInterfaceSection = document.querySelector('.app-interface-info')?.closest('section');
        if (appInterfaceSection) {
            appInterfaceSection.after(panel);
        } else {
            document.querySelector('.app-content').appendChild(panel);
        }

        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });

        const rangeInputs = [
            { id: 'inline-font-size', valId: 'inline-font-size-val', suffix: 'px' },
            { id: 'inline-heading-size', valId: 'inline-heading-size-val', suffix: 'px' },
            { id: 'inline-line-height', valId: 'inline-line-height-val', suffix: '' },
            { id: 'inline-card-radius', valId: 'inline-card-radius-val', suffix: 'px' },
            { id: 'inline-card-padding', valId: 'inline-card-padding-val', suffix: 'px' },
            { id: 'inline-section-gap', valId: 'inline-section-gap-val', suffix: 'px' },
            { id: 'inline-btn-radius', valId: 'inline-btn-radius-val', suffix: 'px' },
            { id: 'inline-input-radius', valId: 'inline-input-radius-val', suffix: 'px' },
            { id: 'inline-shadow', valId: 'inline-shadow-val', suffix: '' },
            { id: 'inline-blur', valId: 'inline-blur-val', suffix: 'px' }
        ];

        rangeInputs.forEach(({ id, valId, suffix }) => {
            const input = document.getElementById(id);
            const valSpan = document.getElementById(valId);
            if (input && valSpan) {
                input.addEventListener('input', () => {
                    valSpan.textContent = input.value + suffix;
                });
            }
        });

        const applyBtn = document.getElementById('inline-apply-btn');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                const newSettings = {
                    bgColor: document.getElementById('inline-bg-color')?.value || settings.bgColor,
                    cardBgColor: document.getElementById('inline-card-bg-color')?.value || settings.cardBgColor,
                    textColor: document.getElementById('inline-text-color')?.value || settings.textColor,
                    mutedColor: document.getElementById('inline-muted-color')?.value || settings.mutedColor,
                    borderColor: document.getElementById('inline-border-color')?.value || settings.borderColor,
                    accentColor: document.getElementById('inline-accent-color')?.value || settings.accentColor,
                    fontFamily: document.getElementById('inline-font-family')?.value || settings.fontFamily,
                    fontSize: Number(document.getElementById('inline-font-size')?.value || settings.fontSize),
                    headingSize: Number(document.getElementById('inline-heading-size')?.value || settings.headingSize),
                    lineHeight: Number(document.getElementById('inline-line-height')?.value || settings.lineHeight),
                    cardRadius: Number(document.getElementById('inline-card-radius')?.value || settings.cardRadius),
                    cardPadding: Number(document.getElementById('inline-card-padding')?.value || settings.cardPadding),
                    sectionGap: Number(document.getElementById('inline-section-gap')?.value || settings.sectionGap),
                    btnRadius: Number(document.getElementById('inline-btn-radius')?.value || settings.btnRadius),
                    inputRadius: Number(document.getElementById('inline-input-radius')?.value || settings.inputRadius),
                    shadow: Number(document.getElementById('inline-shadow')?.value || settings.shadow),
                    blur: Number(document.getElementById('inline-blur')?.value || settings.blur),
                    animationSpeed: document.getElementById('inline-animation-speed')?.value || settings.animationSpeed,
                    customCss: document.getElementById('inline-custom-css')?.value || ''
                };

                const key = themeType === 'light' ? 'sx_app_interface_custom_light' : 'sx_app_interface_custom_dark';
                localStorage.setItem(key, JSON.stringify(newSettings));
                
                window.parent?.postMessage({ type: 'CUSTOM_THEME_UPDATED', mode: `custom-${themeType}`, settings: newSettings }, '*');
                window.parent?.postMessage({ type: 'TRIGGER_GITHUB_SYNC' }, '*');

                panel.remove();
            });
        }

        const resetBtn = document.getElementById('inline-reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                const defaults = themeType === 'light' ? {
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
                } : {
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

                document.getElementById('inline-bg-color').value = defaults.bgColor;
                document.getElementById('inline-card-bg-color').value = defaults.cardBgColor;
                document.getElementById('inline-text-color').value = defaults.textColor;
                document.getElementById('inline-muted-color').value = defaults.mutedColor;
                document.getElementById('inline-border-color').value = defaults.borderColor;
                document.getElementById('inline-accent-color').value = defaults.accentColor;
                document.getElementById('inline-font-family').value = defaults.fontFamily;
                document.getElementById('inline-font-size').value = defaults.fontSize;
                document.getElementById('inline-heading-size').value = defaults.headingSize;
                document.getElementById('inline-line-height').value = defaults.lineHeight;
                document.getElementById('inline-card-radius').value = defaults.cardRadius;
                document.getElementById('inline-card-padding').value = defaults.cardPadding;
                document.getElementById('inline-section-gap').value = defaults.sectionGap;
                document.getElementById('inline-btn-radius').value = defaults.btnRadius;
                document.getElementById('inline-input-radius').value = defaults.inputRadius;
                document.getElementById('inline-shadow').value = defaults.shadow;
                document.getElementById('inline-blur').value = defaults.blur;
                document.getElementById('inline-animation-speed').value = defaults.animationSpeed;
                document.getElementById('inline-custom-css').value = defaults.customCss;

                document.getElementById('inline-font-size-val').textContent = defaults.fontSize + 'px';
                document.getElementById('inline-heading-size-val').textContent = defaults.headingSize + 'px';
                document.getElementById('inline-line-height-val').textContent = defaults.lineHeight;
                document.getElementById('inline-card-radius-val').textContent = defaults.cardRadius + 'px';
                document.getElementById('inline-card-padding-val').textContent = defaults.cardPadding + 'px';
                document.getElementById('inline-section-gap-val').textContent = defaults.sectionGap + 'px';
                document.getElementById('inline-btn-radius-val').textContent = defaults.btnRadius + 'px';
                document.getElementById('inline-input-radius-val').textContent = defaults.inputRadius + 'px';
                document.getElementById('inline-shadow-val').textContent = defaults.shadow;
                document.getElementById('inline-blur-val').textContent = defaults.blur + 'px';
            });
        }

        const saveBtn = document.getElementById('inline-save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const newSettings = {
                    bgColor: document.getElementById('inline-bg-color')?.value || settings.bgColor,
                    cardBgColor: document.getElementById('inline-card-bg-color')?.value || settings.cardBgColor,
                    textColor: document.getElementById('inline-text-color')?.value || settings.textColor,
                    mutedColor: document.getElementById('inline-muted-color')?.value || settings.mutedColor,
                    borderColor: document.getElementById('inline-border-color')?.value || settings.borderColor,
                    accentColor: document.getElementById('inline-accent-color')?.value || settings.accentColor,
                    fontFamily: document.getElementById('inline-font-family')?.value || settings.fontFamily,
                    fontSize: Number(document.getElementById('inline-font-size')?.value || settings.fontSize),
                    headingSize: Number(document.getElementById('inline-heading-size')?.value || settings.headingSize),
                    lineHeight: Number(document.getElementById('inline-line-height')?.value || settings.lineHeight),
                    cardRadius: Number(document.getElementById('inline-card-radius')?.value || settings.cardRadius),
                    cardPadding: Number(document.getElementById('inline-card-padding')?.value || settings.cardPadding),
                    sectionGap: Number(document.getElementById('inline-section-gap')?.value || settings.sectionGap),
                    btnRadius: Number(document.getElementById('inline-btn-radius')?.value || settings.btnRadius),
                    inputRadius: Number(document.getElementById('inline-input-radius')?.value || settings.inputRadius),
                    shadow: Number(document.getElementById('inline-shadow')?.value || settings.shadow),
                    blur: Number(document.getElementById('inline-blur')?.value || settings.blur),
                    animationSpeed: document.getElementById('inline-animation-speed')?.value || settings.animationSpeed,
                    customCss: document.getElementById('inline-custom-css')?.value || ''
                };

                const key = themeType === 'light' ? 'sx_app_interface_custom_light' : 'sx_app_interface_custom_dark';
                localStorage.setItem(key, JSON.stringify(newSettings));
                localStorage.setItem('sx_global_appearance_saved', JSON.stringify(newSettings));
                
                window.parent?.postMessage({ type: 'GLOBAL_APPEARANCE_SAVED', mode: `custom-${themeType}`, settings: newSettings }, '*');
                window.parent?.postMessage({ type: 'TRIGGER_GITHUB_SYNC' }, '*');

                const toast = document.createElement('div');
                toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#34C759;color:#fff;padding:12px 24px;border-radius:20px;font-size:14px;z-index:10000;';
                toast.textContent = '外觀設定已儲存';
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 2000);
            });
        }
    };

    document.addEventListener('DOMContentLoaded', init);
})();

// 監聽資料還原事件
window.addEventListener('sxiphone-data-restored', (event) => {
    console.log('[Appearance] 收到資料還原通知，刷新 UI...');
    setTimeout(() => {
        if (typeof loadPWAConfig === 'function') {
            loadPWAConfig();
        }
    }, 100);
});
