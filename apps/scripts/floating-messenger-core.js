(function() {
    'use strict';

    const STORAGE_KEY_PREFIX = 'sx_floating_messenger_';
    const STATE_KEY = STORAGE_KEY_PREFIX + 'state';
    const POSITION_KEY = STORAGE_KEY_PREFIX + 'position';

    const Platform = {
        isIOS() {
            return /iP(ad|hone|od)/.test(navigator.userAgent);
        },
        isAndroid() {
            return /Android/.test(navigator.userAgent);
        },
        isDesktop() {
            return !this.isIOS() && !this.isAndroid();
        },
        isPWA() {
            return window.matchMedia('(display-mode: standalone)').matches ||
                   window.navigator.standalone === true;
        },
        supportsFloatingWindow() {
            return this.isDesktop() || (this.isAndroid() && this.isPWA());
        },
        supportsScreenShare() {
            return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
        },
        supportsPiP() {
            return 'pictureInPictureEnabled' in document && document.pictureInPictureEnabled;
        }
    };

    class FloatingMessengerCore {
        constructor() {
            this.state = {
                isOpen: false,
                isMinimized: true,
                activeChatId: null,
                characterName: null,
                characterAvatar: null,
                unreadCount: 0
            };
            this.position = { x: 20, y: 20 };
            this.size = { width: 320, height: 480 };
            this.platformImpl = null;
            this.messageQueue = [];
            this.eventListeners = new Map();
            
            this.init();
        }

        async init() {
            this.loadState();
            this.loadPosition();
            this.setupStorageListener();
            this.setupMessageListener();
            
            await this.initPlatformImpl();
            
            window.FloatingMessenger = this;
            console.log('[FloatingMessenger] 核心模組已初始化', {
                platform: this.getPlatformType(),
                supportsFloating: Platform.supportsFloatingWindow(),
                supportsScreenShare: Platform.supportsScreenShare()
            });
        }

        getPlatformType() {
            if (Platform.isDesktop()) return 'desktop';
            if (Platform.isAndroid()) return 'android';
            if (Platform.isIOS()) return 'ios';
            return 'unknown';
        }

        async initPlatformImpl() {
            const platformType = this.getPlatformType();
            
            switch (platformType) {
                case 'desktop':
                    if (typeof DesktopFloatingWindow !== 'undefined') {
                        this.platformImpl = new DesktopFloatingWindow(this);
                    }
                    break;
                case 'android':
                    if (typeof AndroidFloatingWindow !== 'undefined') {
                        this.platformImpl = new AndroidFloatingWindow(this);
                    }
                    break;
                case 'ios':
                    if (typeof IOSNotificationHandler !== 'undefined') {
                        this.platformImpl = new IOSNotificationHandler(this);
                    }
                    break;
            }
            
            if (this.platformImpl && typeof this.platformImpl.init === 'function') {
                await this.platformImpl.init();
            }
        }

        loadState() {
            try {
                const saved = localStorage.getItem(STATE_KEY);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    this.state = { ...this.state, ...parsed };
                }
            } catch (e) {
                console.warn('[FloatingMessenger] 載入狀態失敗:', e);
            }
        }

        saveState() {
            try {
                localStorage.setItem(STATE_KEY, JSON.stringify(this.state));
            } catch (e) {
                console.warn('[FloatingMessenger] 保存狀態失敗:', e);
            }
        }

        loadPosition() {
            try {
                const saved = localStorage.getItem(POSITION_KEY);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    this.position = { ...this.position, ...parsed };
                }
            } catch (e) {
                console.warn('[FloatingMessenger] 載入位置失敗:', e);
            }
        }

        savePosition() {
            try {
                localStorage.setItem(POSITION_KEY, JSON.stringify(this.position));
            } catch (e) {
                console.warn('[FloatingMessenger] 保存位置失敗:', e);
            }
        }

        setupStorageListener() {
            window.addEventListener('storage', (event) => {
                if (event.key === 'sx_char_name' || event.key === 'sx_char_avatar') {
                    this.updateCharacterInfo();
                }
                if (event.key === 'sx_chat_sessions') {
                    this.emit('chat_sessions_updated');
                }
            });
        }

        setupMessageListener() {
            window.addEventListener('message', (event) => {
                const data = event.data;
                if (!data || typeof data !== 'object') return;
                
                switch (data.type) {
                    case 'OPEN_FLOATING_MESSENGER':
                        this.open();
                        break;
                    case 'CLOSE_FLOATING_MESSENGER':
                        this.close();
                        break;
                    case 'TOGGLE_FLOATING_MESSENGER':
                        this.toggle();
                        break;
                    case 'SEND_FLOATING_MESSAGE':
                        if (data.message) {
                            this.sendMessage(data.message);
                        }
                        break;
                    case 'FLOATING_MESSAGE_RECEIVED':
                        if (data.message) {
                            this.handleIncomingMessage(data.message);
                        }
                        break;
                    case 'SHARE_SCREEN':
                        this.startScreenShare();
                        break;
                    case 'UPDATE_FLOATING_POSITION':
                        if (data.position) {
                            this.position = { ...this.position, ...data.position };
                            this.savePosition();
                        }
                        break;
                }
            });
        }

        updateCharacterInfo() {
            const charName = localStorage.getItem('sx_char_name') || 'AI 助理';
            const charAvatar = localStorage.getItem('sx_char_avatar') || '';
            
            this.state.characterName = charName;
            this.state.characterAvatar = charAvatar;
            this.saveState();
            
            this.emit('character_updated', {
                name: charName,
                avatar: charAvatar
            });
        }

        getCharacterInfo() {
            if (!this.state.characterName) {
                this.updateCharacterInfo();
            }
            return {
                name: this.state.characterName || 'AI 助理',
                avatar: this.state.characterAvatar || ''
            };
        }

        getActiveChatId() {
            const sessions = this.getChatSessions();
            if (sessions.length === 0) return null;
            
            const activeId = localStorage.getItem('sx_active_chat_id');
            if (activeId && sessions.find(s => s.id === activeId)) {
                return activeId;
            }
            
            return sessions[0].id;
        }

        getChatSessions() {
            try {
                const raw = localStorage.getItem('sx_chat_sessions');
                if (raw) {
                    const parsed = JSON.parse(raw);
                    return Array.isArray(parsed) ? parsed : [];
                }
            } catch (e) {
                console.warn('[FloatingMessenger] 讀取聊天室列表失敗:', e);
            }
            return [];
        }

        getActiveSession() {
            const chatId = this.getActiveChatId();
            if (!chatId) return null;
            
            const sessions = this.getChatSessions();
            return sessions.find(s => s.id === chatId) || null;
        }

        open() {
            if (this.state.isOpen) return;
            
            this.state.isOpen = true;
            this.state.isMinimized = false;
            this.saveState();
            
            this.updateCharacterInfo();
            
            if (this.platformImpl && typeof this.platformImpl.show === 'function') {
                this.platformImpl.show();
            }
            
            this.emit('opened');
            console.log('[FloatingMessenger] 已開啟');
        }

        close() {
            if (!this.state.isOpen) return;
            
            this.state.isOpen = false;
            this.saveState();
            
            if (this.platformImpl && typeof this.platformImpl.hide === 'function') {
                this.platformImpl.hide();
            }
            
            this.emit('closed');
            console.log('[FloatingMessenger] 已關閉');
        }

        toggle() {
            if (this.state.isOpen) {
                this.close();
            } else {
                this.open();
            }
        }

        minimize() {
            if (!this.state.isOpen || this.state.isMinimized) return;
            
            this.state.isMinimized = true;
            this.saveState();
            
            if (this.platformImpl && typeof this.platformImpl.minimize === 'function') {
                this.platformImpl.minimize();
            }
            
            this.emit('minimized');
        }

        expand() {
            if (!this.state.isOpen || !this.state.isMinimized) return;
            
            this.state.isMinimized = false;
            this.saveState();
            
            if (this.platformImpl && typeof this.platformImpl.expand === 'function') {
                this.platformImpl.expand();
            }
            
            this.emit('expanded');
        }

        async sendMessage(message) {
            if (!message || !message.trim()) return;
            
            const chatId = this.getActiveChatId();
            if (!chatId) {
                console.warn('[FloatingMessenger] 沒有活躍的聊天室');
                return;
            }
            
            this.emit('message_sending', { message, chatId });
            
            if (window.parent !== window) {
                window.parent.postMessage({
                    type: 'FLOATING_SEND_MESSAGE',
                    message: message,
                    chatId: chatId
                }, '*');
            }
            
            console.log('[FloatingMessenger] 發送訊息:', message.slice(0, 50));
        }

        handleIncomingMessage(message) {
            this.messageQueue.push(message);
            
            if (!this.state.isOpen || this.state.isMinimized) {
                this.state.unreadCount++;
                this.saveState();
                this.updateBadge();
            }
            
            this.emit('message_received', message);
            
            if (this.platformImpl && typeof this.platformImpl.onMessage === 'function') {
                this.platformImpl.onMessage(message);
            }
        }

        updateBadge() {
            const count = this.state.unreadCount;
            
            if ('setAppBadge' in navigator) {
                if (count > 0) {
                    navigator.setAppBadge(count).catch(() => {});
                } else {
                    navigator.clearAppBadge().catch(() => {});
                }
            }
            
            this.emit('badge_updated', { count });
        }

        async startScreenShare() {
            if (!Platform.supportsScreenShare()) {
                console.warn('[FloatingMessenger] 此平台不支援螢幕分享');
                return null;
            }
            
            if (typeof ScreenShareManager !== 'undefined') {
                const screenShare = new ScreenShareManager();
                const stream = await screenShare.start();
                
                if (stream) {
                    this.emit('screen_share_started', { stream });
                    return stream;
                }
            }
            
            return null;
        }

        stopScreenShare() {
            this.emit('screen_share_stopped');
        }

        captureScreen() {
            if (this.platformImpl && typeof this.platformImpl.captureScreen === 'function') {
                return this.platformImpl.captureScreen();
            }
            return null;
        }

        on(event, callback) {
            if (!this.eventListeners.has(event)) {
                this.eventListeners.set(event, []);
            }
            this.eventListeners.get(event).push(callback);
        }

        off(event, callback) {
            if (this.eventListeners.has(event)) {
                const listeners = this.eventListeners.get(event);
                const index = listeners.indexOf(callback);
                if (index > -1) {
                    listeners.splice(index, 1);
                }
            }
        }

        emit(event, data) {
            if (this.eventListeners.has(event)) {
                this.eventListeners.get(event).forEach(callback => {
                    try {
                        callback(data);
                    } catch (e) {
                        console.error('[FloatingMessenger] 事件回調錯誤:', e);
                    }
                });
            }
        }

        getState() {
            return { ...this.state };
        }

        setPosition(x, y) {
            this.position.x = x;
            this.position.y = y;
            this.savePosition();
            this.emit('position_changed', this.position);
        }

        setSize(width, height) {
            this.size.width = width;
            this.size.height = height;
            this.emit('size_changed', this.size);
        }

        clearUnread() {
            this.state.unreadCount = 0;
            this.saveState();
            this.updateBadge();
            this.emit('unread_cleared');
        }

        clearBadge() {
            if ('clearAppBadge' in navigator) {
                navigator.clearAppBadge().catch(() => {});
            }
        }

        isAvailable() {
            return Platform.supportsFloatingWindow() || Platform.isIOS();
        }

        getCapabilities() {
            return {
                floatingWindow: Platform.supportsFloatingWindow(),
                screenShare: Platform.supportsScreenShare(),
                pictureInPicture: Platform.supportsPiP(),
                notifications: Platform.isIOS(),
                pwa: Platform.isPWA()
            };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            new FloatingMessengerCore();
        });
    } else {
        new FloatingMessengerCore();
    }
})();
