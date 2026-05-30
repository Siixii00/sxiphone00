(function() {
    'use strict';

    const STORAGE_KEY_ENABLED = 'sx_weather_reminder_enabled';
    const STORAGE_KEY_INTERVAL = 'sx_weather_reminder_interval';
    const STORAGE_KEY_LAST_REMINDER = 'sx_weather_reminder_last';
    const STORAGE_KEY_LOCATION = 'sx_weather_location';
    const STORAGE_KEY_CACHE = 'sx_weather_cache';

    const DEFAULT_INTERVAL = 60 * 60 * 1000;
    const MIN_INTERVAL = 30 * 60 * 1000;
    const MAX_INTERVAL = 180 * 60 * 1000;
    const CACHE_TTL = 10 * 60 * 1000;

    let state = {
        enabled: false,
        interval: DEFAULT_INTERVAL,
        lastReminder: 0,
        timer: null,
        isRunning: false,
        apiConfig: null,
        charConfig: null,
        userConfig: null
    };

    function getCharConfig() {
        let charName = localStorage.getItem('sx_char_name');
        let charPersonality = localStorage.getItem('sx_char_personality');
        let charBackground = localStorage.getItem('sx_char_background');
        let charAvatar = localStorage.getItem('sx_char_avatar');
        
        if (!charName || charName === '預設用戶') {
            const rawChars = localStorage.getItem('sx_characters');
            if (rawChars) {
                try {
                    const chars = JSON.parse(rawChars);
                    if (Array.isArray(chars) && chars.length > 0) {
                        const found = chars.find(c => c.name === charName);
                        const firstChar = found || chars[0];
                        if (firstChar && firstChar.name && firstChar.name !== '預設用戶') {
                            charName = firstChar.name;
                            charPersonality = firstChar.personality || '';
                            charBackground = firstChar.background || '';
                            charAvatar = firstChar.avatar || '';
                        }
                    }
                } catch (e) {}
            }
        }
        
        const masks = JSON.parse(localStorage.getItem('sx_masks') || '[]');
        const activeMask = masks[0] || {};
        
        return {
            name: charName || activeMask.name || '角色',
            personality: charPersonality || activeMask.personality || '',
            background: charBackground || activeMask.background || '',
            avatar: charAvatar || activeMask.avatar || ''
        };
    }

    function getUserConfig() {
        return {
            name: localStorage.getItem('sx_user_name') || 'User',
            personality: localStorage.getItem('sx_user_personality') || ''
        };
    }

    function getApiConfig() {
        if (typeof window.SettingsReader !== 'undefined' && window.SettingsReader.getActiveApiWithFallback) {
            return window.SettingsReader.getActiveApiWithFallback();
        }
        
        const raw = localStorage.getItem('api_configs');
        if (!raw) return null;
        
        try {
            const configs = JSON.parse(raw);
            const activeIndexStr = localStorage.getItem('sx_active_api');
            const activeIndex = activeIndexStr !== null ? parseInt(activeIndexStr, 10) : 0;
            const validIndex = (!isNaN(activeIndex) && activeIndex >= 0 && activeIndex < configs.length) ? activeIndex : 0;
            return configs[validIndex] || configs[0] || null;
        } catch {
            return null;
        }
    }

    function getWeatherType(code, temp) {
        if ([95, 96, 99].includes(code)) return 'storm';
        if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snow';
        if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return 'rain';
        if (temp >= 30) return 'hot';
        if (temp <= 15) return 'cold';
        if ([0, 1].includes(code)) return 'sunny';
        if ([2, 3].includes(code)) return 'cloudy';
        if ([45, 48].includes(code)) return 'cloudy';
        return 'nice';
    }

    function getWeatherDescription(code) {
        const map = {
            0: '晴朗', 1: '多雲', 2: '陰晴', 3: '陰天',
            45: '有霧', 48: '濃霧',
            51: '毛毛雨', 53: '細雨', 55: '小雨',
            61: '小雨', 63: '中雨', 65: '大雨',
            71: '小雪', 73: '中雪', 75: '大雪', 77: '霰',
            80: '陣雨', 81: '強陣雨', 82: '大陣雨',
            85: '陣雪', 86: '強陣雪',
            95: '雷雨', 96: '雷雨冰雹', 99: '強雷雨'
        };
        return map[code] || '天氣未知';
    }

    function getDefaultReminder(charName, userName, weatherType, temp) {
        const weatherDesc = temp !== null ? `氣溫 ${temp}°C` : '';
        const templates = {
            hot: [`${userName}天氣很熱，記得多喝水防中暑喔！`, `高溫提醒！${userName}注意防曬～`, `天氣炎熱，${charName}提醒${userName}待在涼爽的地方`],
            cold: [`${userName}天氣冷，多穿點別感冒！`, `低溫提醒！${userName}注意保暖～`, `天氣寒冷，${charName}提醒${userName}加件衣服`],
            rain: [`${userName}今天下雨，出門帶傘！`, `雨天提醒！${userName}小心路滑～`, `下雨了，${charName}提醒${userName}別淋濕`],
            sunny: [`${userName}天氣不錯，適合出門走走！`, `晴朗好天氣！${userName}有什麼計畫？`, `陽光普照，${charName}祝你心情愉快`],
            cloudy: [`${userName}多雲天氣，可能會變天喔`, `陰天提醒！${userName}外出帶件外套`, `多雲，${charName}提醒${userName}注意天氣變化`],
            storm: [`${userName}雷雨天，盡量別出門！`, `惡劣天氣提醒！${userName}待在室內較安全`, `雷雨來了，${charName}提醒${userName}注意安全`],
            snow: [`${userName}下雪了，注意保暖和路滑！`, `雪天提醒！${userName}穿暖一點`, `下雪了，${charName}提醒${userName}走路小心`],
            nice: [`${userName}天氣舒適，今天會是美好的一天！`, `天氣宜人！${charName}祝你順利`, `這天氣很舒服，${userName}心情不錯吧？`]
        };
        const msgs = templates[weatherType] || templates.nice;
        return msgs[Math.floor(Math.random() * msgs.length)];
    }

    async function generateAIReminder(charConfig, userConfig, weatherData) {
        const apiConfig = getApiConfig();
        
        if (!apiConfig || !apiConfig.url) {
            console.log('[WeatherReminder] 無 API 設定，使用預設提醒');
            return null;
        }

        const current = weatherData.current;
        const code = current.weather_code || 0;
        const temp = current.temperature_2m || 25;
        const weatherType = getWeatherType(code, temp);
        const weatherDesc = getWeatherDescription(code);
        
        const charName = charConfig.name || '角色';
        const charPersonality = charConfig.personality || '';
        const charBackground = charConfig.background || '';
        const userName = userConfig.name || 'User';
        
        const lang = localStorage.getItem('sxiphone_lang') || 'zh-TW';

        const systemPrompt = `# CHARACTER_PROFILE
## 角色資訊
- 名字: ${charName}
- 性格特質: ${charPersonality || '友善、溫柔'}
- 背景故事: ${charBackground || '無'}

## 角色扮演指南
你現在要扮演 ${charName} 這個角色。請完全沉浸在這個角色中，用角色的視角、語氣和說話方式來生成天氣提醒。

# USER_CONTEXT
- 用戶名稱: ${userName}

# RESPONSE_GUIDELINES
1. **角色一致性**: 始終保持 ${charName} 的角色特質，包括說話方式、用詞習慣、情感表達。
2. **語言**: 使用 ${lang} 進行交流。
3. **身分保密**: 絕對不要提及你是 AI 或語言模型。
4. **語氣**: 根據角色性格決定語氣（溫柔/冷淡/活潑/關心等）。
5. **長度**: 簡短自然，15-50字。

輸出格式為 JSON: {"message": "你的天氣提醒內容"}`;

        const userPrompt = `# 天氣資訊
- 天氣狀況: ${weatherDesc}
- 氣溫: ${temp}°C
- 天氣類型: ${weatherType}

請以 ${charName} 的身分，根據上述天氣資訊，生成一句天氣提醒給 ${userName}。
要求：
1. 必須完全符合角色性格設定
2. 根據天氣類型給出適當的提醒（如：帶傘、防曬、保暖等）
3. 語氣和用詞要符合角色特質
4. 自然親切，像朋友間的提醒`;

        try {
            const endpoint = apiConfig.url.endsWith('/chat/completions')
                ? apiConfig.url
                : `${apiConfig.url.replace(/\/$/, '')}/chat/completions`;

            const headers = { 'Content-Type': 'application/json' };
            if (apiConfig.key) {
                headers.Authorization = `Bearer ${apiConfig.key}`;
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    model: apiConfig.model || 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.9,
                    max_tokens: 100
                })
            });

            if (!response.ok) {
                console.warn('[WeatherReminder] API 請求失敗:', response.status);
                return null;
            }

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content || '';

            let parsed = null;
            try {
                parsed = JSON.parse(content);
            } catch {
                const match = content.match(/\{[\s\S]*\}/);
                if (match) {
                    try {
                        parsed = JSON.parse(match[0]);
                    } catch {
                        return content.trim().replace(/^["']|["']$/g, '');
                    }
                }
            }

            return parsed?.message || content.trim().replace(/^["']|["']$/g, '');
        } catch (err) {
            console.warn('[WeatherReminder] AI 生成失敗:', err);
            return null;
        }
    }

    async function fetchWeatherData(lat, lon, timezone) {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=${encodeURIComponent(timezone || 'Asia/Taipei')}`;
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            return await response.json();
        } catch (err) {
            console.warn('[WeatherReminder] 獲取天氣失敗:', err);
            return null;
        }
    }

    async function geocodeLocation(query) {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=zh-TW&format=json`;
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            if (data.results && data.results.length > 0) {
                const place = data.results[0];
                return {
                    name: place.name,
                    lat: place.latitude,
                    lon: place.longitude,
                    timezone: place.timezone
                };
            }
            
            return null;
        } catch (err) {
            console.warn('[WeatherReminder] 地理編碼失敗:', err);
            return null;
        }
    }

    function getCachedWeather() {
        const raw = localStorage.getItem(STORAGE_KEY_CACHE);
        if (!raw) return null;
        
        try {
            const parsed = JSON.parse(raw);
            if (Date.now() - parsed.timestamp > CACHE_TTL) {
                return null;
            }
            return parsed;
        } catch (e) {
            return null;
        }
    }

    function loadConfig() {
        state.enabled = localStorage.getItem(STORAGE_KEY_ENABLED) === '1';
        state.interval = Math.max(MIN_INTERVAL, Math.min(MAX_INTERVAL,
            Number(localStorage.getItem(STORAGE_KEY_INTERVAL)) || DEFAULT_INTERVAL
        ));
        state.lastReminder = Number(localStorage.getItem(STORAGE_KEY_LAST_REMINDER)) || 0;
        
        state.charConfig = getCharConfig();
        state.userConfig = getUserConfig();
        state.apiConfig = getApiConfig();
    }

    function saveConfig() {
        const entries = [
            [STORAGE_KEY_ENABLED, state.enabled ? '1' : '0'],
            [STORAGE_KEY_INTERVAL, String(state.interval)],
            [STORAGE_KEY_LAST_REMINDER, String(state.lastReminder)]
        ];
        
        for (const [key, value] of entries) {
            if (typeof sxStorage !== 'undefined' && sxStorage) {
                sxStorage.setItem(key, value).catch(() => {});
            } else {
                localStorage.setItem(key, value);
            }
        }
    }

    async function checkAndSendReminder() {
        if (!state.enabled) return;
        
        const location = localStorage.getItem(STORAGE_KEY_LOCATION);
        if (!location) {
            console.log('[WeatherReminder] 未設定地點，跳過提醒');
            return;
        }

        let weatherData = null;
        
        const cached = getCachedWeather();
        if (cached && cached.location === location) {
            weatherData = cached.data;
        } else {
            const placeInfo = await geocodeLocation(location);
            if (placeInfo) {
                weatherData = await fetchWeatherData(placeInfo.lat, placeInfo.lon, placeInfo.timezone);
            }
        }
        
        if (!weatherData || !weatherData.current) {
            console.warn('[WeatherReminder] 無法獲取天氣資料');
            return;
        }

        const current = weatherData.current;
        const code = current.weather_code || 0;
        const temp = current.temperature_2m || 25;
        const weatherType = getWeatherType(code, temp);

        state.charConfig = getCharConfig();
        state.userConfig = getUserConfig();
        
        const charConfig = state.charConfig;
        const userConfig = state.userConfig;

        let reminder = await generateAIReminder(charConfig, userConfig, weatherData);
        
        if (!reminder) {
            reminder = getDefaultReminder(charConfig.name, userConfig.name, weatherType, temp);
        }

        if (window.SxNotification) {
            window.SxNotification.show({
                appId: 'weather',
                title: `${charConfig.name}的天氣提醒`,
                message: reminder,
                icon: 'partly_cloudy_day',
                color: '#4facfe',
                duration: 8000,
                useSystemNotification: true,
                data: {
                    appId: 'weather',
                    weatherType,
                    temperature: temp
                }
            });
        }

        state.lastReminder = Date.now();
        saveConfig();
        
        console.log('[WeatherReminder] 已發送提醒:', reminder);
    }

    function scheduleNextReminder() {
        if (state.timer) {
            clearTimeout(state.timer);
            state.timer = null;
        }
        
        if (!state.enabled) {
            state.isRunning = false;
            return;
        }

        const now = Date.now();
        const timeSinceLast = now - state.lastReminder;
        const nextDelay = Math.max(0, state.interval - timeSinceLast);
        
        console.log('[WeatherReminder] 下次提醒延遲:', Math.floor(nextDelay / 60000), '分鐘');
        
        const checkAndSchedule = () => {
            if (!state.enabled) {
                state.isRunning = false;
                return;
            }
            
            checkAndSendReminder().then(() => {
                scheduleNextReminder();
            }).catch(err => {
                console.warn('[WeatherReminder] 提醒發送失敗:', err);
                scheduleNextReminder();
            });
        };
        
        state.timer = setTimeout(checkAndSchedule, nextDelay);
        state.isRunning = true;
    }

    function start() {
        if (state.enabled && state.isRunning) {
            console.log('[WeatherReminder] 已在運行中');
            return;
        }
        
        state.enabled = true;
        saveConfig();
        
        const now = Date.now();
        const timeSinceLast = now - state.lastReminder;
        
        if (timeSinceLast >= state.interval) {
            checkAndSendReminder().then(() => {
                scheduleNextReminder();
            });
        } else {
            scheduleNextReminder();
        }
        
        console.log('[WeatherReminder] 已啟動');
    }

    function stop() {
        state.enabled = false;
        
        if (state.timer) {
            clearTimeout(state.timer);
            state.timer = null;
        }
        
        state.isRunning = false;
        saveConfig();
        
        console.log('[WeatherReminder] 已停止');
    }

    function setInterval(ms) {
        state.interval = Math.max(MIN_INTERVAL, Math.min(MAX_INTERVAL, ms));
        saveConfig();
        
        if (state.enabled && state.isRunning) {
            scheduleNextReminder();
        }
    }

    function getStatus() {
        return {
            enabled: state.enabled,
            interval: state.interval,
            lastReminder: state.lastReminder,
            isRunning: state.isRunning,
            nextReminder: state.lastReminder + state.interval,
            hasApi: !!state.apiConfig,
            charName: state.charConfig?.name || '未設定'
        };
    }

    function triggerImmediateReminder() {
        return checkAndSendReminder();
    }

    function updateCharConfig() {
        state.charConfig = getCharConfig();
        state.userConfig = getUserConfig();
    }

    function updateApiConfig() {
        state.apiConfig = getApiConfig();
    }

    function init() {
        if (window.__weatherReminderInitialized) {
            console.warn('[WeatherReminder] 檢測到重複初始化，跳過');
            return;
        }
        window.__weatherReminderInitialized = true;
        
        loadConfig();
        
        window.addEventListener('message', (event) => {
            const data = event.data;
            if (!data || typeof data !== 'object') return;
            
            switch (data.type) {
                case 'WEATHER_REMINDER_START':
                    start();
                    break;
                case 'WEATHER_REMINDER_STOP':
                    stop();
                    break;
                case 'WEATHER_REMINDER_SET_INTERVAL':
                    if (data.payload?.interval) {
                        setInterval(data.payload.interval);
                    }
                    break;
                case 'WEATHER_REMINDER_GET_STATUS':
                    window.dispatchEvent(new CustomEvent('weather-reminder-status', {
                        detail: getStatus()
                    }));
                    break;
                case 'WEATHER_REMINDER_TRIGGER':
                    triggerImmediateReminder();
                    break;
                case 'WEATHER_REMINDER_UPDATE_CONFIG':
                    updateCharConfig();
                    updateApiConfig();
                    break;
            }
        });
        
        if (state.enabled) {
            console.log('[WeatherReminder] 自動啟動定時提醒');
            start();
        }
        
        console.log('[WeatherReminder] 模組已初始化', getStatus());
    }

    init();

    window.WeatherReminderScheduler = {
        start,
        stop,
        setInterval,
        getStatus,
        triggerImmediateReminder,
        checkAndSendReminder,
        updateCharConfig,
        updateApiConfig,
        MIN_INTERVAL,
        MAX_INTERVAL
    };
})();