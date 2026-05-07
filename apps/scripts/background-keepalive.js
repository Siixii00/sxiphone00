const BackgroundKeepalive = (function() {
    const STORAGE_KEY_ENABLED = 'sx_keepalive_enabled';
    const STORAGE_KEY_INTERVAL = 'sx_keepalive_interval';
    const STORAGE_KEY_GREETING_ENABLED = 'sx_keepalive_greeting_enabled';
    const STORAGE_KEY_GREETING_INTERVAL = 'sx_keepalive_greeting_interval';
    const STORAGE_KEY_CONTEXT_MODE = 'sx_keepalive_context_mode';
    const STORAGE_KEY_CUSTOM_PROMPT = 'sx_keepalive_custom_prompt';
    const STORAGE_KEY_LAST_PING = 'sx_keepalive_last_ping';
    const STORAGE_KEY_LAST_GREETING = 'sx_keepalive_last_greeting';
    const STORAGE_KEY_QUEUE = 'sx_keepalive_queue';

    const DEFAULT_INTERVAL = 5 * 60 * 1000;
    const MIN_INTERVAL = 1 * 60 * 1000;
    const MAX_INTERVAL = 60 * 60 * 1000;
    const DEFAULT_GREETING_INTERVAL = 30 * 60 * 1000;
    const MIN_GREETING_INTERVAL = 5 * 60 * 1000;
    const MAX_GREETING_INTERVAL = 120 * 60 * 1000;

    let state = {
        enabled: false,
        interval: DEFAULT_INTERVAL,
        greetingEnabled: true,
        greetingInterval: DEFAULT_GREETING_INTERVAL,
        contextMode: 'smart',
        customPrompt: '',
        lastPing: 0,
        lastGreeting: 0,
        isInBackground: false,
        pingTimer: null,
        greetingTimer: null,
        apiConfig: null,
        charConfig: null,
        userConfig: null,
        pendingQueue: []
    };

    function getContextPrompts() {
        const charName = state.charConfig?.name || '角色';
        return {
            smart: `根據最近的對話內容和時間，以「${charName}」的身分生成一句自然的問候或延續話題的話。
要求：
1. 如果剛結束對話不久（<30分鐘），可以延續話題
2. 如果已經很久沒聊（>2小時），用問候開場
3. 必須完全符合角色性格設定
4. 簡短自然，15-40字
5. 可以帶一點關心或好奇`,
            greeting: `以「${charName}」的身分生成一句簡單的問候語。
要求：
1. 必須完全符合角色性格設定
2. 簡短溫馨，10-30字
3. 可以是關心、問候或想念`,
            followup: `根據最近的對話內容，以「${charName}」的身分生成一句延續話題的話。
要求：
1. 自然承接上次的話題
2. 可以是追問、補充或延伸
3. 必須完全符合角色性格設定
4. 簡短自然，15-40字`,
            random: `以「${charName}」的身分隨機生成一句話。
要求：
1. 可以是任何類型：問候、關心、分享、好奇
2. 必須完全符合角色性格設定
3. 簡短有趣，15-40字`
        };
    }

    const contextPrompts = {
        smart: `根據最近的對話內容和時間，生成一句自然的問候或延續話題的話。
要求：
1. 如果剛結束對話不久（<30分鐘），可以延續話題
2. 如果已經很久沒聊（>2小時），用問候開場
3. 符合角色性格
4. 簡短自然，15-40字
5. 可以帶一點關心或好奇`,
        greeting: `生成一句簡單的問候語。
要求：
1. 符合角色性格
2. 簡短溫馨，10-30字
3. 可以是關心、問候或想念`,
        followup: `根據最近的對話內容，生成一句延續話題的話。
要求：
1. 自然承接上次的話題
2. 可以是追問、補充或延伸
3. 符合角色性格
4. 簡短自然，15-40字`,
        random: `隨機生成一句話。
要求：
1. 可以是任何類型：問候、關心、分享、好奇
2. 符合角色性格
3. 簡短有趣，15-40字`
    };

    function getContextPrompts() {
        const charName = state.charConfig?.name || '角色';
        return {
            smart: `根據最近的對話內容和時間，以「${charName}」的身分生成一句自然的問候或延續話題的話。
要求：
1. 如果剛結束對話不久（<30分鐘），可以延續話題
2. 如果已經很久沒聊（>2小時），用問候開場
3. 必須完全符合角色性格設定
4. 簡短自然，15-40字
5. 可以帶一點關心或好奇`,
            greeting: `以「${charName}」的身分生成一句簡單的問候語。
要求：
1. 必須完全符合角色性格設定
2. 簡短溫馨，10-30字
3. 可以是關心、問候或想念`,
            followup: `根據最近的對話內容，以「${charName}」的身分生成一句延續話題的話。
要求：
1. 自然承接上次的話題
2. 可以是追問、補充或延伸
3. 必須完全符合角色性格設定
4. 簡短自然，15-40字`,
            random: `以「${charName}」的身分隨機生成一句話。
要求：
1. 可以是任何類型：問候、關心、分享、好奇
2. 必須完全符合角色性格設定
3. 簡短有趣，15-40字`
        };
    }

    function loadConfig() {
        state.enabled = localStorage.getItem(STORAGE_KEY_ENABLED) === '1';
        state.interval = clampInterval(
            Number(localStorage.getItem(STORAGE_KEY_INTERVAL)) || DEFAULT_INTERVAL,
            MIN_INTERVAL, MAX_INTERVAL
        );
        state.greetingEnabled = localStorage.getItem(STORAGE_KEY_GREETING_ENABLED) !== '0';
        state.greetingInterval = clampInterval(
            Number(localStorage.getItem(STORAGE_KEY_GREETING_INTERVAL)) || DEFAULT_GREETING_INTERVAL,
            MIN_GREETING_INTERVAL, MAX_GREETING_INTERVAL
        );
        state.contextMode = localStorage.getItem(STORAGE_KEY_CONTEXT_MODE) || 'smart';
        state.customPrompt = localStorage.getItem(STORAGE_KEY_CUSTOM_PROMPT) || '';
        state.lastPing = Number(localStorage.getItem(STORAGE_KEY_LAST_PING)) || 0;
        state.lastGreeting = Number(localStorage.getItem(STORAGE_KEY_LAST_GREETING)) || 0;
        
        try {
            const queueRaw = localStorage.getItem(STORAGE_KEY_QUEUE);
            state.pendingQueue = queueRaw ? JSON.parse(queueRaw) : [];
        } catch {
            state.pendingQueue = [];
        }

        updateApiConfig();
        updateCharConfig();
        updateUserConfig();
    }

    function saveConfig() {
        localStorage.setItem(STORAGE_KEY_ENABLED, state.enabled ? '1' : '0');
        localStorage.setItem(STORAGE_KEY_INTERVAL, String(state.interval));
        localStorage.setItem(STORAGE_KEY_GREETING_ENABLED, state.greetingEnabled ? '1' : '0');
        localStorage.setItem(STORAGE_KEY_GREETING_INTERVAL, String(state.greetingInterval));
        localStorage.setItem(STORAGE_KEY_CONTEXT_MODE, state.contextMode);
        localStorage.setItem(STORAGE_KEY_CUSTOM_PROMPT, state.customPrompt);
        localStorage.setItem(STORAGE_KEY_LAST_PING, String(state.lastPing));
        localStorage.setItem(STORAGE_KEY_LAST_GREETING, String(state.lastGreeting));
        localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(state.pendingQueue));
    }

    function clampInterval(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function updateApiConfig() {
        if (typeof window.SettingsReader !== 'undefined' && window.SettingsReader.getActiveApiWithFallback) {
            state.apiConfig = window.SettingsReader.getActiveApiWithFallback();
            if (state.apiConfig) {
                console.log('[Keepalive] 使用統一 API:', state.apiConfig.name || '未命名');
            }
            return;
        }
        
        const raw = localStorage.getItem('api_configs');
        if (!raw) {
            state.apiConfig = null;
            return;
        }
        try {
            const configs = JSON.parse(raw);
            const activeIndexStr = localStorage.getItem('sx_active_api');
            const activeIndex = activeIndexStr !== null ? parseInt(activeIndexStr, 10) : 0;
            const validIndex = (!isNaN(activeIndex) && activeIndex >= 0 && activeIndex < configs.length) ? activeIndex : 0;
            state.apiConfig = configs[validIndex] || configs[0] || null;
            if (state.apiConfig) {
                console.log('[Keepalive] 使用 API #' + validIndex + ':', state.apiConfig.name || '未命名');
            }
        } catch {
            state.apiConfig = null;
        }
    }

    function updateCharConfig() {
        const charName = localStorage.getItem('sx_char_name');
        const charPersonality = localStorage.getItem('sx_char_personality');
        const charBackground = localStorage.getItem('sx_char_background');
        const charAvatar = localStorage.getItem('sx_char_avatar');
        
        state.charConfig = {
            name: charName || 'AI 助理',
            personality: charPersonality || '',
            background: charBackground || '',
            avatar: charAvatar || ''
        };
    }

    function updateUserConfig() {
        state.userConfig = {
            name: localStorage.getItem('sx_user_name') || 'User',
            personality: localStorage.getItem('sx_user_personality') || '',
            background: localStorage.getItem('sx_user_background') || ''
        };
    }

    function getEnvContext() {
        try {
            const envSettingsRaw = localStorage.getItem('sx_env_awareness_settings');
            if (!envSettingsRaw) return '';
            
            const envSettings = JSON.parse(envSettingsRaw);
            if (!envSettings.enabled) return '';
            
            const parts = [];
            const now = new Date();
            const timezone = envSettings.autoTimezone 
                ? Intl.DateTimeFormat().resolvedOptions().timeZone 
                : envSettings.manualTimezone;
            
            if (envSettings.injectTime) {
                const timeStr = now.toLocaleString('zh-TW', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone
                });
                parts.push(`目前時間：${timeStr}`);
            }
            
            if (envSettings.injectLocation) {
                const displayLocation = envSettings.locationDisplay;
                const actualCity = envSettings.locationCity;
                
                if (envSettings.useFictionalLocation && displayLocation) {
                    parts.push(`所在地：${displayLocation}`);
                } else if (actualCity) {
                    const location = envSettings.locationCountry 
                        ? `${actualCity}, ${envSettings.locationCountry}`
                        : actualCity;
                    parts.push(`所在地：${location}`);
                } else if (displayLocation) {
                    parts.push(`所在地：${displayLocation}`);
                }
            }
            
            if (envSettings.injectWeather && envSettings.cachedWeather) {
                const w = envSettings.cachedWeather;
                parts.push(`目前天氣：${w.description}，氣溫 ${w.temperature}°C`);
            }
            
            return parts.join('\n');
        } catch (e) {
            return '';
        }
    }

    function inferUserActivity(timeSinceLast, lastMessage) {
        const now = new Date();
        const hour = now.getHours();
        const minutesSinceLast = Math.floor(timeSinceLast / 60000);
        
        const activities = [];
        
        if (hour >= 6 && hour < 9) {
            activities.push('早晨時段，可能剛起床或準備上班/上學');
        } else if (hour >= 9 && hour < 12) {
            activities.push('上午時段，可能正在工作或上課');
        } else if (hour >= 12 && hour < 14) {
            activities.push('中午時段，可能在用餐或休息');
        } else if (hour >= 14 && hour < 18) {
            activities.push('下午時段，可能正在工作或上課');
        } else if (hour >= 18 && hour < 21) {
            activities.push('傍晚時段，可能剛下班/放學或在用餐');
        } else if (hour >= 21 && hour < 24) {
            activities.push('晚間時段，可能在家休息或準備睡覺');
        } else if (hour >= 0 && hour < 6) {
            activities.push('深夜時段，可能正在睡覺');
        }
        
        if (minutesSinceLast > 480) {
            activities.push('已超過8小時未回應，可能在睡覺或長時間工作');
        } else if (minutesSinceLast > 120) {
            activities.push('已超過2小時未回應，可能專注於某件事');
        } else if (minutesSinceLast > 60) {
            activities.push('已超過1小時未回應，可能在忙其他事情');
        }
        
        if (lastMessage) {
            const lowerMsg = lastMessage.toLowerCase();
            if (lowerMsg.includes('睡') || lowerMsg.includes('晚安')) {
                activities.push('用戶提到睡覺相關，可能去休息了');
            }
            if (lowerMsg.includes('上班') || lowerMsg.includes('工作') || lowerMsg.includes('上班')) {
                activities.push('用戶提到工作相關，可能正在工作');
            }
            if (lowerMsg.includes('上學') || lowerMsg.includes('學校') || lowerMsg.includes('課')) {
                activities.push('用戶提到學校相關，可能在上課');
            }
            if (lowerMsg.includes('吃') || lowerMsg.includes('餐')) {
                activities.push('用戶提到用餐相關，可能在吃飯');
            }
            if (lowerMsg.includes('出門') || lowerMsg.includes('外出') || lowerMsg.includes('離開')) {
                activities.push('用戶提到外出，可能不在家');
            }
        }
        
        return activities;
    }

    function getTimeBasedGreeting() {
        const now = new Date();
        const hour = now.getHours();
        
        if (hour >= 5 && hour < 12) {
            return '早安';
        } else if (hour >= 12 && hour < 18) {
            return '午安';
        } else if (hour >= 18 && hour < 22) {
            return '晚安';
        } else {
            return '這麼晚了還沒睡嗎';
        }
    }

    function getWorldbookData() {
        const categories = ['cot', 'style', 'global', 'keywords', 'backend', 'theater'];
        const worldbookData = {};
        
        categories.forEach(cat => {
            const key = `sx_worldbook_${cat}`;
            const data = localStorage.getItem(key);
            if (data) {
                try {
                    worldbookData[cat] = JSON.parse(data);
                } catch (e) {
                    worldbookData[cat] = [];
                }
            } else {
                worldbookData[cat] = [];
            }
        });
        
        return worldbookData;
    }

    function getWorldbookMounts() {
        const data = localStorage.getItem('sx_worldbook_mounts');
        if (data) {
            try {
                return JSON.parse(data);
            } catch (e) {
                return [];
            }
        }
        return [];
    }

    function scanWorldbookContent(text, worldbookData) {
        if (!text || !worldbookData) return '';
        
        const allEntries = [];
        const categories = ['cot', 'style', 'global', 'keywords', 'backend', 'theater'];
        
        categories.forEach(cat => {
            const entries = worldbookData[cat];
            if (Array.isArray(entries)) {
                entries.forEach(entry => {
                    if (entry && entry.keywords && entry.content) {
                        const keywords = Array.isArray(entry.keywords) 
                            ? entry.keywords 
                            : entry.keywords.split(',').map(k => k.trim()).filter(k => k);
                        
                        const hasMatch = keywords.some(keyword => 
                            text.toLowerCase().includes(keyword.toLowerCase())
                        );
                        
                        if (hasMatch) {
                            allEntries.push({
                                category: cat,
                                content: entry.content,
                                priority: entry.priority || 0
                            });
                        }
                    }
                });
            }
        });
        
        allEntries.sort((a, b) => b.priority - a.priority);
        return allEntries.map(e => e.content).join('\n');
    }

    function getRecentHistory(limit = 10) {
        try {
            const raw = localStorage.getItem('sx_chat_history');
            const history = raw ? JSON.parse(raw) : [];
            return history.slice(-limit);
        } catch {
            return [];
        }
    }

    function getTimeSinceLastMessage() {
        const history = getRecentHistory(1);
        if (!history.length) return Infinity;
        const lastMsg = history[history.length - 1];
        if (!lastMsg || !lastMsg.timestamp) return Infinity;
        return Date.now() - lastMsg.timestamp;
    }

    async function getAwakeningContext() {
        if (window.AppMemoryHelper) {
            try {
                const result = await window.AppMemoryHelper.conversationStart();
                return result?.context || null;
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    function formatAwakeningForGreeting(context) {
        if (!context) return '';
        
        let prompt = '';
        
        if (context.collects && context.collects.length > 0) {
            prompt += '昨日感受：';
            for (const c of context.collects.slice(0, 3)) {
                prompt += `${c.feel}；`;
            }
            prompt += '\n';
        }
        
        if (context.surfaced && context.surfaced.length > 0) {
            prompt += '記憶片段：';
            for (const m of context.surfaced.slice(0, 3)) {
                prompt += `${m.content}；`;
            }
            prompt += '\n';
        }
        
        if (context.emotionalTone) {
            prompt += `情緒狀態：${context.emotionalTone.label}\n`;
        }
        
        return prompt;
    }

    function selectGreetingStyle() {
        const personality = (state.charConfig?.personality || '').toLowerCase();
        
        if (personality.includes('浪漫') || personality.includes('深情') || personality.includes('戀愛') || personality.includes('佔有') || personality.includes('痴情')) {
            return 'romantic';
        }
        if (personality.includes('調皮') || personality.includes('活潑') || personality.includes('俏皮') || personality.includes('愛鬧') || personality.includes('搞笑')) {
            return 'playful';
        }
        if (personality.includes('溫柔') || personality.includes('體貼') || personality.includes('關心') || personality.includes('善良') || personality.includes('暖')) {
            return 'caring';
        }
        if (personality.includes('好奇') || personality.includes('八卦') || personality.includes('愛問')) {
            return 'curious';
        }
        if (personality.includes('冷淡') || personality.includes('高冷') || personality.includes('傲嬌') || personality.includes('腹黑') || personality.includes('病嬌')) {
            return 'cold';
        }
        if (personality.includes('霸道') || personality.includes('強勢') || personality.includes('佔有慾')) {
            return 'dominant';
        }
        return 'casual';
    }

    function generateLocalGreeting() {
        const style = selectGreetingStyle();
        const charName = state.charConfig?.name || '角色';
        const userName = state.userConfig?.name || 'User';
        const minutesSinceLast = Math.floor(getTimeSinceLastMessage() / 60000);
        
        const styleTemplates = {
            romantic: [
                `${charName}在想${userName}，什麼時候能見面？`,
                `每分每秒${charName}都在想你。`,
                `${userName}是${charName}最想念的人。`,
                `希望${userName}在身邊。`,
                `${charName}的心裡都是${userName}。`,
                `好想聽${userName}的聲音。`,
                `什麼時候能再聊天？${charName}想你了。`,
                `${userName}今天過得好嗎？${charName}想你了。`
            ],
            playful: [
                `嘿！${userName}想${charName}了沒？`,
                `${charName}偷偷看一下${userName}在不在～`,
                `猜猜${charName}現在在想什麼？`,
                `${userName}已經 ${minutesSinceLast} 分鐘沒理${charName}了！`,
                `${userName}快點出現！`,
                `${charName}呼叫${userName}～`,
                `${charName}有驚喜要給${userName}！`,
                `${userName}猜${charName}為什麼發這個？`
            ],
            caring: [
                `${userName}記得按時吃飯喔。`,
                `${userName}別太累了，休息一下。`,
                `${charName}想知道${userName}今天過得怎麼樣？`,
                `${userName}有什麼想分享的嗎？`,
                `${charName}在這裡，${userName}隨時都可以找我。`,
                `${charName}希望${userName}今天一切順利。`,
                `${userName}別忘記照顧自己。`,
                `${userName}需要和${charName}聊聊天嗎？`
            ],
            curious: [
                `${userName}最近在忙什麼呀？`,
                `${userName}有什麼新鮮事嗎？`,
                `${charName}想知道${userName}今天發生了什麼有趣的事？`,
                `${userName}在想什麼呢？`,
                `${userName}最近有看什麼好看的嗎？`,
                `${userName}有推薦的東西給${charName}嗎？`,
                `${userName}最近心情怎麼樣？`,
                `${userName}有什麼想和${charName}聊的嗎？`
            ],
            cold: [
                `哼，${charName}只是隨便看看。`,
                `${userName}終於想起${charName}了？`,
                `...${userName}在嗎？`,
                `${charName}不是在等你，只是剛好看到。`,
                `算了，${userName}忙吧。`,
                `${charName}沒有特別想${userName}。`,
                `...${userName}還活著？`,
                `${charName}只是確認一下${userName}還在。`
            ],
            dominant: [
                `${userName}，${charName}在等你回覆。`,
                `不許不理${charName}。`,
                `${userName}最好乖乖回覆。`,
                `${charName}在監視${userName}喔。`,
                `${userName}已經 ${minutesSinceLast} 分鐘沒回${charName}了。`,
                `${userName}，過來。`,
                `${charName}說的話${userName}聽到了嗎？`,
                `${userName}不回覆${charName}的後果知道嗎？`
            ],
            casual: [
                `${charName}在嗎？想${userName}了。`,
                `${userName}最近還好嗎？`,
                `${userName}有空的時候回${charName}一下。`,
                `${charName}只是想打聲招呼給${userName}。`,
                `${userName}在忙嗎？`,
                `${charName}突然想到${userName}了。`,
                `${charName}沒事，就是想看看${userName}。`,
                `嘿，${userName}還在嗎？`
            ]
        };
        
        const templates = styleTemplates[style] || styleTemplates.casual;
        return templates[Math.floor(Math.random() * templates.length)];
    }

    async function generateAIGreeting() {
        if (!state.apiConfig || !state.apiConfig.url) {
            return generateLocalGreeting();
        }

        const history = getRecentHistory(10);
        const timeSinceLast = getTimeSinceLastMessage();
        const minutesSinceLast = Math.floor(timeSinceLast / 60000);

        const contextMode = state.contextMode || 'smart';
        const contextPrompts = getContextPrompts();
        const promptTemplate = contextPrompts[contextMode] || contextPrompts.smart;
        
        const charName = state.charConfig?.name || '角色';
        const charPersonality = state.charConfig?.personality || '';
        const charBackground = state.charConfig?.background || '';
        const userName = state.userConfig?.name || 'User';
        const userBackground = state.userConfig?.background || '';
        
        const lang = localStorage.getItem('sxiphone_lang') || 'zh-TW';
        const region = localStorage.getItem('sxiphone_region') || '未知';

        const worldbookData = getWorldbookData();
        const mounts = getWorldbookMounts();
        const enabledMounts = mounts.filter(m => m.enabled);
        
        const lastHistoryText = history.length > 0 
            ? (history[history.length - 1].content || '')
            : '';
        const worldbookContent = scanWorldbookContent(lastHistoryText, worldbookData);
        
        let awakeningContext = '';
        try {
            const awakeningData = await getAwakeningContext();
            if (awakeningData) {
                awakeningContext = formatAwakeningForGreeting(awakeningData);
            }
        } catch (e) {
            console.warn('[Keepalive] 獲取喚醒上下文失敗:', e);
        }

        const envContext = getEnvContext();
        const userActivities = inferUserActivity(timeSinceLast, lastHistoryText);
        const timeGreeting = getTimeBasedGreeting();

        let systemPrompt = `# CHARACTER_PROFILE
## 基本資訊
- 名字: ${charName}
- 性格特質: ${charPersonality || '友善、溫柔'}
- 背景故事: ${charBackground || '無'}

## 角色扮演指南
你現在要扮演 ${charName} 這個角色。請完全沉浸在這個角色中，用角色的視角和語氣來思考和回應。

# USER_CONTEXT
- 用戶名稱: ${userName}
- 用戶背景: ${userBackground || '未知'}
- 所在地區: ${region}

# RESPONSE_GUIDELINES
1. **角色一致性**: 始終保持 ${charName} 的角色特質，包括說話方式、用詞習慣、情感表達等。
2. **語言**: 使用 ${lang} 進行交流。
3. **身分保密**: 絕對不要提及你是 AI 或語言模型。
4. **回應風格**: 根據角色性格來決定回應的長度和風格。
5. **時間感知**: 根據當前時間和用戶可能的活動來調整問候內容。

輸出格式為 JSON: {"message": "一句話"}`;

        let context = `# 當前情境\n`;
        context += `距離上次對話: ${minutesSinceLast} 分鐘\n`;
        context += `使用者名稱: ${userName}\n`;
        context += `角色名稱: ${charName}\n`;
        context += `時間問候: ${timeGreeting}\n`;

        if (envContext) {
            context += `\n# 環境資訊\n${envContext}\n`;
        }

        if (userActivities.length > 0) {
            context += `\n# 用戶活動推斷\n`;
            userActivities.forEach(activity => {
                context += `- ${activity}\n`;
            });
        }

        if (worldbookContent) {
            context += `\n# 世界書相關內容\n${worldbookContent}\n`;
        }

        if (enabledMounts.length > 0) {
            context += `\n# 已掛載世界書\n已掛載 ${enabledMounts.length} 個世界書條目\n`;
        }

        if (awakeningContext) {
            context += `\n# 每日喚醒記憶\n${awakeningContext}\n`;
        }

        if (history.length > 0) {
            context += `\n# 最近對話紀錄\n`;
            history.forEach(msg => {
                const role = msg.role === 'user' ? userName : charName;
                context += `${role}: ${msg.content?.slice(0, 150) || ''}\n`;
            });
        }

        const customPrompt = state.customPrompt;
        let fullPrompt = `${context}\n\n${promptTemplate}`;
        
        if (minutesSinceLast > 60) {
            fullPrompt += `\n\n注意：用戶已經 ${minutesSinceLast} 分鐘沒有回應了。請根據時間和可能的活動來推斷用戶去做什麼了，並用關心或好奇的語氣問候。`;
        }
        
        if (customPrompt) {
            fullPrompt += `\n\n額外指示: ${customPrompt}`;
        }

        try {
            const endpoint = state.apiConfig.url.endsWith('/chat/completions')
                ? state.apiConfig.url
                : `${state.apiConfig.url.replace(/\/$/, '')}/chat/completions`;

            const headers = { 'Content-Type': 'application/json' };
            if (state.apiConfig.key) {
                headers.Authorization = `Bearer ${state.apiConfig.key}`;
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    model: state.apiConfig.model || 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: fullPrompt }
                    ],
                    temperature: 0.9,
                    max_tokens: 100
                })
            });

            if (!response.ok) {
                return generateLocalGreeting();
            }

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content || '';

            let parsed = null;
            try {
                parsed = JSON.parse(content);
            } catch {
                const match = content.match(/\{[\s\S]*\}/);
                if (match) parsed = JSON.parse(match[0]);
            }

            return parsed?.message || generateLocalGreeting();
        } catch (err) {
            console.warn('[Keepalive] AI 生成失敗:', err);
            return generateLocalGreeting();
        }
    }

    async function sendPing() {
        if (!state.apiConfig || !state.apiConfig.url) {
            return false;
        }

        try {
            const endpoint = state.apiConfig.url.endsWith('/chat/completions')
                ? state.apiConfig.url
                : `${state.apiConfig.url.replace(/\/$/, '')}/chat/completions`;

            const headers = { 'Content-Type': 'application/json' };
            if (state.apiConfig.key) {
                headers.Authorization = `Bearer ${state.apiConfig.key}`;
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    model: state.apiConfig.model || 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: 'Respond with OK' },
                        { role: 'user', content: 'ping' }
                    ],
                    max_tokens: 5
                })
            });

            state.lastPing = Date.now();
            localStorage.setItem(STORAGE_KEY_LAST_PING, String(state.lastPing));

            return response.ok;
        } catch (err) {
            console.warn('[Keepalive] Ping 失敗:', err);
            return false;
        }
    }

    async function sendGreeting() {
        const message = await generateAIGreeting();
        
        if (!message) {
            return false;
        }

        const greetingData = {
            id: `greeting_${Date.now()}`,
            message,
            timestamp: Date.now(),
            charName: state.charConfig?.name || '角色',
            contextMode: state.contextMode
        };

        state.pendingQueue.push(greetingData);
        if (state.pendingQueue.length > 10) {
            state.pendingQueue = state.pendingQueue.slice(-10);
        }
        localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(state.pendingQueue));

        state.lastGreeting = Date.now();
        localStorage.setItem(STORAGE_KEY_LAST_GREETING, String(state.lastGreeting));

        if (window.parent && window.parent !== window) {
            window.parent.postMessage({
                type: 'KEEPALIVE_GREETING',
                payload: greetingData
            }, '*');
        }

        window.dispatchEvent(new CustomEvent('keepalive-greeting', {
            detail: greetingData
        }));

        console.log('[Keepalive] 已生成問候:', message);
        return true;
    }

    function scheduleNextPing() {
        if (state.pingTimer) {
            clearTimeout(state.pingTimer);
            state.pingTimer = null;
        }

        if (!state.enabled || !state.isInBackground) {
            return;
        }

        const scheduleWithFallback = () => {
            const startTime = Date.now();
            const checkInterval = () => {
                if (!state.enabled || !state.isInBackground) return;
                
                const elapsed = Date.now() - startTime;
                if (elapsed >= state.interval) {
                    sendPing().then(() => {
                        scheduleNextPing();
                    });
                } else {
                    const remaining = state.interval - elapsed;
                    const nextCheck = Math.min(remaining, 30000);
                    state.pingTimer = setTimeout(checkInterval, nextCheck);
                }
            };
            state.pingTimer = setTimeout(checkInterval, Math.min(state.interval, 30000));
        };

        scheduleWithFallback();
    }

    function scheduleNextGreeting() {
        if (state.greetingTimer) {
            clearTimeout(state.greetingTimer);
            state.greetingTimer = null;
        }

        if (!state.enabled || !state.isInBackground || !state.greetingEnabled) {
            return;
        }

        const scheduleWithFallback = () => {
            const startTime = Date.now();
            const checkInterval = () => {
                if (!state.enabled || !state.isInBackground || !state.greetingEnabled) return;
                
                const elapsed = Date.now() - startTime;
                if (elapsed >= state.greetingInterval) {
                    sendGreeting().then(() => {
                        scheduleNextGreeting();
                    });
                } else {
                    const remaining = state.greetingInterval - elapsed;
                    const nextCheck = Math.min(remaining, 60000);
                    state.greetingTimer = setTimeout(checkInterval, nextCheck);
                }
            };
            state.greetingTimer = setTimeout(checkInterval, Math.min(state.greetingInterval, 60000));
        };

        scheduleWithFallback();
    }

    function start() {
        if (state.enabled) {
            return;
        }
        
        state.enabled = true;
        saveConfig();
        
        if (state.isInBackground) {
            scheduleNextPing();
            if (state.greetingEnabled) {
                scheduleNextGreeting();
            }
        }

        console.log('[Keepalive] 已啟動');
        notifyStatusChange();
    }

    function stop() {
        state.enabled = false;
        
        if (state.pingTimer) {
            clearTimeout(state.pingTimer);
            state.pingTimer = null;
        }
        if (state.greetingTimer) {
            clearTimeout(state.greetingTimer);
            state.greetingTimer = null;
        }

        saveConfig();
        console.log('[Keepalive] 已停止');
        notifyStatusChange();
    }

    function enterBackground() {
        state.isInBackground = true;
        
        localStorage.setItem('sx_keepalive_background_time', String(Date.now()));
        
        if (state.enabled) {
            scheduleNextPing();
            if (state.greetingEnabled) {
                scheduleNextGreeting();
            }
        }

        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'KEEPALIVE_START',
                interval: state.interval,
                greetingInterval: state.greetingInterval
            });
        }

        if ('BroadcastChannel' in window) {
            try {
                const channel = new BroadcastChannel('keepalive-sync');
                channel.postMessage({
                    type: 'BACKGROUND_ENTER',
                    timestamp: Date.now()
                });
            } catch (e) {}
        }

        console.log('[Keepalive] 進入背景模式');
    }

    function enterForeground() {
        const backgroundTime = parseInt(localStorage.getItem('sx_keepalive_background_time') || '0', 10);
        const timeSinceBackground = Date.now() - backgroundTime;
        
        state.isInBackground = false;
        
        if (state.pingTimer) {
            clearTimeout(state.pingTimer);
            state.pingTimer = null;
        }
        if (state.greetingTimer) {
            clearTimeout(state.greetingTimer);
            state.greetingTimer = null;
        }

        if (state.enabled && state.greetingEnabled && timeSinceBackground > state.greetingInterval) {
            console.log('[Keepalive] 從背景返回，已超過問候間隔，觸發問候');
            sendGreeting().catch(e => console.warn('[Keepalive] 問候失敗:', e));
        }

        processPendingQueue();

        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'KEEPALIVE_STOP'
            });
        }

        if ('BroadcastChannel' in window) {
            try {
                const channel = new BroadcastChannel('keepalive-sync');
                channel.postMessage({
                    type: 'FOREGROUND_ENTER',
                    timestamp: Date.now()
                });
            } catch (e) {}
        }

        console.log('[Keepalive] 進入前景模式，背景時間:', Math.floor(timeSinceBackground / 1000), '秒');
    }

    function processPendingQueue() {
        if (state.pendingQueue.length === 0) {
            return;
        }

        const queue = [...state.pendingQueue];
        state.pendingQueue = [];
        localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify([]));

        queue.forEach(item => {
            if (window.parent && window.parent !== window) {
                window.parent.postMessage({
                    type: 'KEEPALIVE_GREETING',
                    payload: item
                }, '*');
            }

            window.dispatchEvent(new CustomEvent('keepalive-greeting', {
                detail: item
            }));
        });

        console.log('[Keepalive] 處理佇列訊息:', queue.length);
    }

    function notifyStatusChange() {
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({
                type: 'KEEPALIVE_STATUS',
                payload: getStatus()
            }, '*');
        }

        window.dispatchEvent(new CustomEvent('keepalive-status', {
            detail: getStatus()
        }));
    }

    function getStatus() {
        return {
            enabled: state.enabled,
            interval: state.interval,
            greetingEnabled: state.greetingEnabled,
            greetingInterval: state.greetingInterval,
            contextMode: state.contextMode,
            customPrompt: state.customPrompt,
            lastPing: state.lastPing,
            lastGreeting: state.lastGreeting,
            isInBackground: state.isInBackground,
            pendingCount: state.pendingQueue.length,
            hasApi: !!state.apiConfig
        };
    }

    function setConfig(config) {
        if (typeof config.enabled === 'boolean') {
            state.enabled = config.enabled;
        }
        if (typeof config.interval === 'number') {
            state.interval = clampInterval(config.interval, MIN_INTERVAL, MAX_INTERVAL);
        }
        if (typeof config.greetingEnabled === 'boolean') {
            state.greetingEnabled = config.greetingEnabled;
        }
        if (typeof config.greetingInterval === 'number') {
            state.greetingInterval = clampInterval(config.greetingInterval, MIN_GREETING_INTERVAL, MAX_GREETING_INTERVAL);
        }
        if (typeof config.contextMode === 'string') {
            state.contextMode = config.contextMode;
        }
        if (typeof config.customPrompt === 'string') {
            state.customPrompt = config.customPrompt;
        }

        saveConfig();

        if (state.enabled && state.isInBackground) {
            scheduleNextPing();
            if (state.greetingEnabled) {
                scheduleNextGreeting();
            }
        }

        notifyStatusChange();
    }

    function triggerImmediateGreeting() {
        return sendGreeting();
    }

    function init() {
        loadConfig();

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                enterBackground();
            } else {
                enterForeground();
            }
        });

        window.addEventListener('pagehide', () => {
            enterBackground();
        });

        window.addEventListener('pageshow', () => {
            enterForeground();
        });

        window.addEventListener('message', (event) => {
            const data = event.data;
            if (!data || typeof data !== 'object') return;

            switch (data.type) {
                case 'KEEPALIVE_START':
                    start();
                    break;
                case 'KEEPALIVE_STOP':
                    stop();
                    break;
                case 'KEEPALIVE_SET_CONFIG':
                    if (data.payload) {
                        setConfig(data.payload);
                    }
                    break;
                case 'KEEPALIVE_GET_STATUS':
                    notifyStatusChange();
                    break;
                case 'KEEPALIVE_TRIGGER_GREETING':
                    triggerImmediateGreeting();
                    break;
                case 'KEEPALIVE_UPDATE_CONFIG':
                    updateApiConfig();
                    updateCharConfig();
                    updateUserConfig();
                    break;
            }
        });

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(() => {
                console.log('[Keepalive] Service Worker 已就緒');
            });
        }

        console.log('[Keepalive] 模組已初始化', getStatus());
    }

    init();

    return {
        start,
        stop,
        getStatus,
        setConfig,
        triggerImmediateGreeting,
        enterBackground,
        enterForeground,
        updateApiConfig,
        updateCharConfig,
        updateUserConfig,
        MIN_INTERVAL,
        MAX_INTERVAL,
        MIN_GREETING_INTERVAL,
        MAX_GREETING_INTERVAL
    };
})();

window.BackgroundKeepalive = BackgroundKeepalive;
