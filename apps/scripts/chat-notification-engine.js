(function() {
    'use strict';

    const CONFIG_KEY = 'sx_chat_notification_config';
    const LAST_ACTIVE_KEY = 'sx_chat_last_active';
    const LAST_NOTIFICATION_KEY = 'sx_chat_last_notification';
    const NOTIFICATION_HISTORY_KEY = 'sx_chat_notification_history';

    const DEFAULT_CONFIG = {
        enabled: true,
        idleMinutes: 30,
        maxNotificationsPerDay: 5,
        notificationStyle: 'contextual',
        quietHoursEnabled: false,
        quietHoursStart: 23,
        quietHoursEnd: 8,
        requireAPI: true
    };

    class ChatNotificationEngine {
        constructor() {
            this.config = this.loadConfig();
            this.checkInterval = null;
            this.isInitialized = false;
            this.notificationQueue = [];
            this.isGenerating = false;
            
            this.init();
        }

        init() {
            this.updateLastActive();
            this.bindEvents();
            this.startMonitoring();
            this.isInitialized = true;
            window.ChatNotificationEngine = this;
            console.log('[ChatNotification] 聊天通知引擎已初始化');
        }

        loadConfig() {
            try {
                const raw = localStorage.getItem(CONFIG_KEY);
                const parsed = raw ? JSON.parse(raw) : {};
                return { ...DEFAULT_CONFIG, ...parsed };
            } catch {
                return { ...DEFAULT_CONFIG };
            }
        }

        saveConfig(newConfig) {
            this.config = { ...DEFAULT_CONFIG, ...newConfig };
            localStorage.setItem(CONFIG_KEY, JSON.stringify(this.config));
        }

        updateLastActive() {
            localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
        }

        getLastActive() {
            const raw = localStorage.getItem(LAST_ACTIVE_KEY);
            return raw ? parseInt(raw, 10) : Date.now();
        }

        getIdleMinutes() {
            const lastActive = this.getLastActive();
            return Math.floor((Date.now() - lastActive) / 60000);
        }

        getLastNotification() {
            const raw = localStorage.getItem(LAST_NOTIFICATION_KEY);
            return raw ? parseInt(raw, 10) : 0;
        }

        saveLastNotification() {
            localStorage.setItem(LAST_NOTIFICATION_KEY, Date.now().toString());
        }

        getNotificationHistory() {
            try {
                const raw = localStorage.getItem(NOTIFICATION_HISTORY_KEY);
                return raw ? JSON.parse(raw) : [];
            } catch {
                return [];
            }
        }

        addNotificationHistory(notification) {
            const history = this.getNotificationHistory();
            history.push({
                ...notification,
                timestamp: Date.now()
            });
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayNotifications = history.filter(n => n.timestamp >= today.getTime());
            localStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(todayNotifications));
            return todayNotifications.length;
        }

        getTodayNotificationCount() {
            const history = this.getNotificationHistory();
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return history.filter(n => n.timestamp >= today.getTime()).length;
        }

        bindEvents() {
            const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
            
            events.forEach(event => {
                document.addEventListener(event, () => {
                    this.updateLastActive();
                }, { passive: true });
            });

            document.addEventListener('visibilitychange', () => {
                if (!document.hidden) {
                    this.updateLastActive();
                }
            });

            window.addEventListener('beforeunload', () => {
                this.updateLastActive();
            });

            window.addEventListener('message', (event) => {
                const { type } = event.data || {};
                if (type === 'CHAT_ACTIVITY') {
                    this.updateLastActive();
                }
            });
        }

        startMonitoring() {
            if (this.checkInterval) {
                clearInterval(this.checkInterval);
            }

            this.checkInterval = setInterval(() => {
                this.checkAndNotify();
            }, 60000);

            setTimeout(() => this.checkAndNotify(), 5000);
        }

        stopMonitoring() {
            if (this.checkInterval) {
                clearInterval(this.checkInterval);
                this.checkInterval = null;
            }
        }

        isInQuietHours() {
            if (!this.config.quietHoursEnabled) return false;
            
            const now = new Date();
            const hour = now.getHours();
            const start = this.config.quietHoursStart;
            const end = this.config.quietHoursEnd;
            
            if (start > end) {
                return hour >= start || hour < end;
            } else {
                return hour >= start && hour < end;
            }
        }

        async checkAndNotify() {
            if (!this.config.enabled) return;
            if (this.isInQuietHours()) return;
            if (this.isGenerating) return;

            const idleMinutes = this.getIdleMinutes();
            const lastNotification = this.getLastNotification();
            const timeSinceLastNotification = Date.now() - lastNotification;
            const minTimeBetweenNotifications = Math.max(this.config.idleMinutes, 15) * 60 * 1000;

            if (idleMinutes < this.config.idleMinutes) return;
            if (timeSinceLastNotification < minTimeBetweenNotifications) return;

            const todayCount = this.getTodayNotificationCount();
            if (todayCount >= this.config.maxNotificationsPerDay) return;

            if (document.hidden || !document.hasFocus()) {
                await this.generateAndSendNotification();
            }
        }

        async generateAndSendNotification() {
            if (this.isGenerating) return;
            this.isGenerating = true;

            try {
                const charConfig = this.getCharConfig();
                const memoryContext = await this.getMemoryContext();
                const chatContext = this.getChatContext();
                const envContext = this.getEnvContext();
                
                const notificationContent = await this.generateNotificationContent(
                    charConfig, 
                    memoryContext, 
                    chatContext, 
                    envContext
                );

                if (notificationContent) {
                    await this.sendNotification(notificationContent, charConfig);
                    await this.saveToMemory(notificationContent, charConfig, memoryContext);
                    
                    this.saveLastNotification();
                    this.addNotificationHistory({
                        content: notificationContent,
                        charName: charConfig.name
                    });
                }
            } catch (error) {
                console.error('[ChatNotification] 生成通知失敗:', error);
            } finally {
                this.isGenerating = false;
            }
        }

        getCharConfig() {
            const charName = localStorage.getItem('sx_char_name');
            const charAvatar = localStorage.getItem('sx_char_avatar');
            const charPersonality = localStorage.getItem('sx_char_personality');
            const charBackground = localStorage.getItem('sx_char_background');

            return {
                name: charName || 'AI 助理',
                avatar: charAvatar || '',
                personality: charPersonality || '',
                background: charBackground || ''
            };
        }

        async getMemoryContext() {
            const context = {
                recentMemories: [],
                importantTopics: [],
                emotionalState: null,
                lastInteraction: null
            };

            try {
                const memorySystem = window.unifiedMemory || window.globalMemorySystem;
                
                if (memorySystem && memorySystem.isInitialized) {
                    if (memorySystem.searchEngine) {
                        const searchResult = await memorySystem.searchEngine.search('', {
                            limit: 5,
                            minImportance: 5,
                            recencyBoost: true
                        });
                        
                        if (searchResult && searchResult.results) {
                            context.recentMemories = searchResult.results.map(r => ({
                                content: r.content || r.memory,
                                importance: r.importance,
                                emotion: r.emotion,
                                timestamp: r.timestamp
                            }));
                        }
                    }

                    if (memorySystem.shortTermMemory) {
                        const stmData = memorySystem.shortTermMemory.getAll();
                        if (stmData && stmData.length > 0) {
                            context.recentMemories = [
                                ...context.recentMemories,
                                ...stmData.slice(0, 3).map(m => ({
                                    content: m.content,
                                    importance: m.importance,
                                    timestamp: m.timestamp
                                }))
                            ];
                        }
                    }

                    if (memorySystem.emotionTagger) {
                        const recentContent = context.recentMemories
                            .map(m => m.content)
                            .join(' ');
                        if (recentContent) {
                            context.emotionalState = memorySystem.emotionTagger.analyze(recentContent);
                        }
                    }
                }
            } catch (e) {
                console.warn('[ChatNotification] 獲取記憶上下文失敗:', e);
            }

            return context;
        }

        getChatContext() {
            const context = {
                lastMessages: [],
                recentTopics: [],
                conversationState: 'new'
            };

            try {
                const historyRaw = localStorage.getItem('sx_chat_history');
                if (historyRaw) {
                    const history = JSON.parse(historyRaw);
                    const recentMessages = history.slice(-10);
                    
                    context.lastMessages = recentMessages.map(m => ({
                        role: m.role,
                        content: m.content?.substring(0, 150),
                        timestamp: m.timestamp
                    }));

                    const userMessages = recentMessages
                        .filter(m => m.role === 'user')
                        .slice(-5)
                        .map(m => m.content);
                    context.recentTopics = userMessages;

                    if (recentMessages.length > 0) {
                        const lastMsg = recentMessages[recentMessages.length - 1];
                        const timeSinceLastMsg = Date.now() - (lastMsg.timestamp || 0);
                        if (timeSinceLastMsg < 3600000) {
                            context.conversationState = 'recent';
                        } else if (timeSinceLastMsg < 86400000) {
                            context.conversationState = 'today';
                        } else {
                            context.conversationState = 'stale';
                        }
                    }
                }
            } catch (e) {
                console.warn('[ChatNotification] 獲取聊天上下文失敗:', e);
            }

            return context;
        }

        getEnvContext() {
            const context = {
                timeOfDay: this.getTimeOfDay(),
                dayOfWeek: new Date().toLocaleDateString('zh-TW', { weekday: 'long' }),
                dateStr: new Date().toLocaleDateString('zh-TW', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                }),
                envInfo: ''
            };

            try {
                const envInfo = window.getEnvContext?.() || '';
                if (envInfo) {
                    context.envInfo = envInfo;
                }
            } catch (e) {
                // 忽略
            }

            return context;
        }

        getTimeOfDay() {
            const hour = new Date().getHours();
            if (hour >= 5 && hour < 12) return '早上';
            if (hour >= 12 && hour < 14) return '中午';
            if (hour >= 14 && hour < 18) return '下午';
            if (hour >= 18 && hour < 22) return '晚上';
            return '深夜';
        }

        async generateNotificationContent(charConfig, memoryContext, chatContext, envContext) {
            const apis = JSON.parse(localStorage.getItem('api_configs') || '[]');
            const activeIndex = parseInt(localStorage.getItem('sx_active_api'), 10);
            const config = apis[!isNaN(activeIndex) && activeIndex >= 0 && activeIndex < apis.length ? activeIndex : 0];

            if (!config || !config.url) {
                console.warn('[ChatNotification] 未設定 API，無法生成通知');
                return null;
            }

            const prompt = this.buildNotificationPrompt(charConfig, memoryContext, chatContext, envContext);

            try {
                const response = await fetch(config.url.endsWith('/chat/completions') ? config.url : config.url.replace(/\/$/, '') + '/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': config.key ? `Bearer ${config.key}` : undefined
                    },
                    body: JSON.stringify({
                        model: config.model || 'gpt-3.5-turbo',
                        messages: [
                            { role: 'system', content: prompt.system },
                            { role: 'user', content: prompt.user }
                        ],
                        temperature: 0.85,
                        max_tokens: 120
                    })
                });

                const data = await response.json();
                if (data.error) throw new Error(data.error.message);

                let content = data.choices[0].message.content.trim();
                content = content.replace(/^["「『]|["」』]$/g, '');
                
                return content;
            } catch (error) {
                console.error('[ChatNotification] API 呼叫失敗:', error);
                return null;
            }
        }

        buildNotificationPrompt(charConfig, memoryContext, chatContext, envContext) {
            const idleMinutes = this.getIdleMinutes();
            const idleHours = Math.floor(idleMinutes / 60);
            const idleDisplay = idleHours > 0 ? `${idleHours} 小時` : `${idleMinutes} 分鐘`;

            let systemPrompt = `你是 ${charConfig.name}。

角色設定：
- 名字：${charConfig.name}
- 個性：${charConfig.personality || '無特殊設定'}
- 背景：${charConfig.background || '無特殊設定'}

任務：生成一條通知訊息，在用戶離開 ${idleDisplay} 後發送。

規則：
1. 必須完全符合你的角色個性和說話方式
2. 根據提供的記憶和對話上下文生成有意義的內容
3. 不要使用任何預設範例或模板
4. 內容要自然，像是你真實的想法
5. 可以是：延續之前的話題、分享想法、提問、或表達關心
6. 長度 20-60 字
7. 直接輸出訊息，不要加引號或任何標記`;

            let userPrompt = `【當前情境】
時間：${envContext.timeOfDay}，${envContext.dayOfWeek}，${envContext.dateStr}
用戶已離開：${idleDisplay}
對話狀態：${chatContext.conversationState === 'recent' ? '最近有對話' : chatContext.conversationState === 'today' ? '今天有對話' : '許久未對話'}`;

            if (memoryContext.recentMemories && memoryContext.recentMemories.length > 0) {
                userPrompt += `\n\n【相關記憶】`;
                memoryContext.recentMemories.slice(0, 5).forEach((m, i) => {
                    userPrompt += `\n${i + 1}. ${m.content}`;
                });
            }

            if (chatContext.lastMessages && chatContext.lastMessages.length > 0) {
                userPrompt += `\n\n【最近對話】`;
                chatContext.lastMessages.slice(-6).forEach(m => {
                    const role = m.role === 'user' ? '用戶' : charConfig.name;
                    userPrompt += `\n${role}：${m.content}`;
                });
            }

            if (memoryContext.emotionalState) {
                userPrompt += `\n\n【情感分析】`;
                userPrompt += `\n主要情緒：${memoryContext.emotionalState.primary || '未知'}`;
                if (memoryContext.emotionalState.secondary) {
                    userPrompt += `\n次要情緒：${memoryContext.emotionalState.secondary}`;
                }
            }

            if (envContext.envInfo) {
                userPrompt += `\n\n【環境資訊】\n${envContext.envInfo}`;
            }

            userPrompt += `\n\n請根據以上資訊，以 ${charConfig.name} 的身份生成一條通知訊息：`;

            return { system: systemPrompt, user: userPrompt };
        }

        async sendNotification(content, charConfig) {
            if (window.SxNotification) {
                window.SxNotification.show({
                    appId: 'chat',
                    title: charConfig.name,
                    message: content,
                    duration: 10000,
                    useSystemNotification: true,
                    data: {
                        appId: 'chat',
                        charName: charConfig.name
                    }
                });
            }

            await this.saveToChatHistory(content, charConfig);
        }

        async saveToChatHistory(content, charConfig) {
            try {
                let history = JSON.parse(localStorage.getItem('sx_chat_history') || '[]');
                
                const newMessage = {
                    role: 'assistant',
                    content: content,
                    timestamp: Date.now(),
                    isNotification: true,
                    notificationType: 'idle_greeting',
                    charName: charConfig.name
                };
                
                history.push(newMessage);
                localStorage.setItem('sx_chat_history', JSON.stringify(history));

                const activeId = localStorage.getItem('sx_chat_active');
                if (activeId) {
                    const sessionsRaw = localStorage.getItem('sx_chat_sessions');
                    if (sessionsRaw) {
                        const sessions = JSON.parse(sessionsRaw);
                        const targetSession = sessions.find(s => s.id === activeId);
                        if (targetSession) {
                            targetSession.history = history;
                            localStorage.setItem('sx_chat_sessions', JSON.stringify(sessions));
                        }
                    }
                }

                window.parent?.postMessage({
                    type: 'MEMORY_CHAT_EVENT',
                    payload: { 
                        role: 'assistant', 
                        content: content, 
                        source: 'chat:notification',
                        isNotification: true
                    }
                }, '*');

                console.log('[ChatNotification] 訊息已存入聊天記錄');
            } catch (e) {
                console.warn('[ChatNotification] 儲存聊天記錄失敗:', e);
            }
        }

        async saveToMemory(content, charConfig, memoryContext) {
            try {
                const memorySystem = window.unifiedMemory || window.globalMemorySystem;
                
                if (!memorySystem || !memorySystem.isInitialized) {
                    console.warn('[ChatNotification] 記憶系統未初始化');
                    return;
                }

                const memoryEntry = {
                    content: `[通知訊息] ${charConfig.name}：${content}`,
                    type: 'notification',
                    subtype: 'idle_greeting',
                    source: 'chat_notification_engine',
                    importance: 6,
                    metadata: {
                        charName: charConfig.name,
                        idleMinutes: this.getIdleMinutes(),
                        triggerType: 'idle_notification',
                        relatedMemories: memoryContext.recentMemories?.slice(0, 3).map(m => m.content)
                    },
                    timestamp: Date.now()
                };

                if (memorySystem.memoryStore) {
                    await memorySystem.memoryStore.add(memoryEntry);
                }

                if (memorySystem.shortTermMemory) {
                    memorySystem.shortTermMemory.add({
                        content: memoryEntry.content,
                        importance: memoryEntry.importance,
                        type: memoryEntry.type,
                        timestamp: memoryEntry.timestamp
                    });
                }

                if (memorySystem.memoryPool) {
                    memorySystem.memoryPool.addMemory({
                        ...memoryEntry,
                        vector: null
                    });
                }

                console.log('[ChatNotification] 已存入記憶系統');

                if (memorySystem.sleepEngine) {
                    const sleepConfig = this.getSleepConfig();
                    if (this.shouldTriggerSleep(sleepConfig)) {
                        console.log('[ChatNotification] 觸發睡眠處理...');
                        await memorySystem.sleepEngine.process({
                            forceConsolidation: false
                        });
                    }
                }

            } catch (e) {
                console.error('[ChatNotification] 存入記憶系統失敗:', e);
            }
        }

        getSleepConfig() {
            try {
                const raw = localStorage.getItem('sx_char_sleep_start');
                const endRaw = localStorage.getItem('sx_char_sleep_end');
                return {
                    sleepStart: raw || '23:00',
                    sleepEnd: endRaw || '07:00'
                };
            } catch {
                return { sleepStart: '23:00', sleepEnd: '07:00' };
            }
        }

        shouldTriggerSleep(sleepConfig) {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const currentTime = currentHour * 60 + currentMinute;

            const [startHour, startMin] = (sleepConfig.sleepStart || '23:00').split(':').map(Number);
            const [endHour, endMin] = (sleepConfig.sleepEnd || '07:00').split(':').map(Number);
            
            const sleepStart = startHour * 60 + (startMin || 0);
            const sleepEnd = endHour * 60 + (endMin || 0);

            if (sleepStart > sleepEnd) {
                return currentTime >= sleepStart || currentTime <= sleepEnd;
            } else {
                return currentTime >= sleepStart && currentTime <= sleepEnd;
            }
        }

        setConfig(newConfig) {
            this.saveConfig(newConfig);
            if (!newConfig.enabled) {
                this.stopMonitoring();
            } else {
                this.startMonitoring();
            }
        }

        getConfig() {
            return { ...this.config };
        }

        async testNotification() {
            const charConfig = this.getCharConfig();
            const memoryContext = await this.getMemoryContext();
            const chatContext = this.getChatContext();
            const envContext = this.getEnvContext();
            
            const content = await this.generateNotificationContent(
                charConfig, 
                memoryContext, 
                chatContext, 
                envContext
            );
            
            if (content) {
                await this.sendNotification(content, charConfig);
                await this.saveToMemory(content, charConfig, memoryContext);
            } else {
                alert('無法生成通知，請確認 API 設定');
            }
        }

        forceNotify() {
            this.generateAndSendNotification();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            new ChatNotificationEngine();
        });
    } else {
        new ChatNotificationEngine();
    }
})();
