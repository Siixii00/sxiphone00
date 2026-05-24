(function() {
    'use strict';

    const STORAGE_KEY = 'sx_notifications';
    const MAX_NOTIFICATIONS = 50;
    const DEFAULT_DISPLAY_DURATION = 5000;
    const COLLAPSE_DELAY = 3000;

    const APP_ICONS = {
        chat: { icon: 'chat_bubble', color: 'linear-gradient(135deg,#4facfe,#00f2fe)', name: '聊天' },
        settings: { icon: 'settings', color: '#8e8e93', name: '設定' },
        album: { icon: 'photo_library', color: 'linear-gradient(135deg,#ff9a9e,#fecfef)', name: '相簿' },
        worldbook: { icon: 'menu_book', color: 'linear-gradient(145deg, #5856D6, #3634A3)', name: '世界書' },
        pomodoro: { icon: 'timer', color: '#f25f5c', name: '番茄鐘' },
        weather: { icon: 'partly_cloudy_day', color: '#4facfe', name: '天氣' },
        twitter: { icon: 'alternate_email', color: '#1da1f2', name: '推特' },
        facebook: { icon: 'group', color: '#1877f2', name: '臉書' },
        bilibili: { icon: 'live_tv', color: '#00a1d6', name: 'bilibili' },
        youtube: { icon: 'play_circle', color: '#ff0000', name: 'YouTube' },
        music: { icon: 'music_note', color: '#ff5f9f', name: '音樂' },
        instagram: { icon: 'photo_camera', color: '#c13584', name: 'Instagram' },
        phone: { icon: 'call', color: '#1ec06b', name: '電話' },
        dating: { icon: 'favorite', color: '#e91e63', name: '約會' },
        exchange_diary: { icon: 'auto_stories', color: '#9c27b0', name: '交換日記' },
        drift_bottle: { icon: 'sailing', color: '#2d9cdb', name: '漂流瓶' },
        default: { icon: 'notifications', color: '#007AFF', name: '通知' }
    };

    class SxNotificationManager {
        constructor() {
            this.notifications = [];
            this.stackElement = null;
            this.centerElement = null;
            this.centerContent = null;
            this.isCenterOpen = false;
            this.isDarkMode = false;
            this.onLockScreen = false;
            this.expandedNotificationId = null;
            this.pendingSystemNotifications = [];
            this.systemNotificationPermission = null;
            
            this.init();
        }

        init() {
            this.stackElement = document.getElementById('sx-notification-stack');
            this.centerElement = document.getElementById('sx-notification-center');
            this.centerContent = document.getElementById('sx-notification-center-content');
            
            this.loadNotifications();
            this.detectDarkMode();
            this.bindEvents();
            this.checkSystemNotificationSupport();
            
            window.SxNotification = this;
            console.log('[SxNotification] 通知系統已初始化');
        }

        detectDarkMode() {
            const checkDark = () => {
                const savedTheme = localStorage.getItem('sx_theme_mode');
                if (savedTheme === 'dark') {
                    this.isDarkMode = true;
                } else if (savedTheme === 'light') {
                    this.isDarkMode = false;
                } else {
                    this.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
                }
            };
            
            checkDark();
            
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', checkDark);
            
            const originalSetItem = localStorage.setItem.bind(localStorage);
            localStorage.setItem = (key, value) => {
                // sx_* 全部走 sxStorage（透過 localStorage-mirror 攔截或直接調用）
                if (key && key.startsWith('sx_')) {
                    // 觸發 sxStorage set + cache 更新
                    if (typeof sxStorage !== 'undefined' && sxStorage) {
                        sxStorage.setItem(key, value).catch(() => {});
                    }
                    if (key === 'sx_theme_mode') {
                        checkDark();
                    }
                } else {
                    originalSetItem(key, value);   // 非 sx key 才 fallback 原生 localStorage
                }
            };
        }

        bindEvents() {
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.collapseAllVisible();
                }
            });

            document.addEventListener('click', (e) => {
                if (this.isCenterOpen && 
                    !this.centerElement.contains(e.target) && 
                    !e.target.closest('.sx-notification')) {
                    this.closeCenter();
                }
            });

            let touchStartY = 0;
            const phoneContainer = document.getElementById('phone-container');
            
            phoneContainer?.addEventListener('touchstart', (e) => {
                touchStartY = e.touches[0].clientY;
            }, { passive: true });

            phoneContainer?.addEventListener('touchmove', (e) => {
                const touchY = e.touches[0].clientY;
                const deltaY = touchY - touchStartY;
                
                if (deltaY > 100 && touchStartY < 80 && !this.isCenterOpen) {
                    this.openCenter();
                } else if (deltaY < -100 && this.isCenterOpen) {
                    this.closeCenter();
                }
            }, { passive: true });

            const lockScreen = document.getElementById('lock-screen');
            const observer = new MutationObserver(() => {
                this.onLockScreen = !lockScreen?.classList.contains('hidden');
                this.updateStackPosition();
            });
            
            if (lockScreen) {
                observer.observe(lockScreen, { attributes: true, attributeFilter: ['class'] });
            }

            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.addEventListener('message', (event) => {
                    const { type, data } = event.data || {};
                    
                    if (type === 'NOTIFICATION_CLICKED') {
                        console.log('[SxNotification] 通知被點擊:', data);
                        if (data?.appId) {
                            window.launchApp?.(data.appId);
                        }
                    }
                });
            }
        }

        updateStackPosition() {
            if (this.onLockScreen) {
                this.stackElement?.classList.add('on-lock-screen');
            } else {
                this.stackElement?.classList.remove('on-lock-screen');
            }
        }

        checkSystemNotificationSupport() {
            if ('Notification' in window) {
                this.systemNotificationPermission = Notification.permission;
            }
            
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(registration => {
                    console.log('[SxNotification] Service Worker 就緒，支援推送通知');
                }).catch(err => {
                    console.warn('[SxNotification] Service Worker 未就緒:', err);
                });
            }
        }

        async requestSystemPermission() {
            if (!('Notification' in window)) {
                console.warn('[SxNotification] 此瀏覽器不支援系統通知');
                return { granted: false, reason: 'not_supported' };
            }

            if (Notification.permission === 'granted') {
                this.systemNotificationPermission = 'granted';
                return { granted: true, reason: 'already_granted' };
            }

            if (Notification.permission === 'denied') {
                console.warn('[SxNotification] 系統通知權限已被拒絕');
                return { granted: false, reason: 'denied' };
            }

            let permission;
            
            try {
                if (typeof Notification.requestPermission === 'function') {
                    permission = await Notification.requestPermission();
                } else {
                    permission = await new Promise((resolve) => {
                        Notification.requestPermission(resolve);
                    });
                }
                
                this.systemNotificationPermission = permission;
                
                if (permission === 'granted') {
                    this.testSystemNotification();
                }
                
                return { granted: permission === 'granted', reason: permission };
            } catch (err) {
                console.error('[SxNotification] 請求系統通知權限失敗:', err);
                return { granted: false, reason: 'error', error: err.message };
            }
        }

        testSystemNotification() {
            const options = {
                body: '通知功能已啟用！現在可以接收後台通知。',
                icon: '/apps/screenshots/icon-192x192.png',
                badge: '/apps/screenshots/icon-48x48.png',
                tag: 'test-notification',
                vibrate: [100, 50, 100],
                requireInteraction: false
            };
            
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification('sxiphone 測試通知', options);
                });
            } else {
                new Notification('sxiphone 測試通知', options);
            }
        }

        getPermissionStatus() {
            if (!('Notification' in window)) {
                return { supported: false, permission: 'not_supported' };
            }
            
            return {
                supported: true,
                permission: Notification.permission,
                canRequest: Notification.permission === 'default'
            };
        }

        loadNotifications() {
            try {
                if (typeof sxStorage !== 'undefined' && sxStorage) {
                    sxStorage.getItem(STORAGE_KEY).then(raw => {
                        this.notifications = raw ? JSON.parse(raw) : [];
                    }).catch(() => {
                        this.notifications = [];
                    });
                } else {
                    const raw = localStorage.getItem(STORAGE_KEY);
                    this.notifications = raw ? JSON.parse(raw) : [];
                }
            } catch {
                this.notifications = [];
            }
        }

        saveNotifications() {
            try {
                const content = JSON.stringify(this.notifications.slice(0, MAX_NOTIFICATIONS));
                if (typeof sxStorage !== 'undefined' && sxStorage) {
                    sxStorage.setItem(STORAGE_KEY, content).catch(e => {
                        console.warn('[SxNotification] 儲存通知失敗:', e);
                    });
                } else {
                    localStorage.setItem(STORAGE_KEY, content);
                }
            } catch (e) {
                console.warn('[SxNotification] 儲存通知失敗:', e);
            }
        }

        getAppInfo(appId) {
            return APP_ICONS[appId] || APP_ICONS.default;
        }

        formatTime(timestamp) {
            const now = Date.now();
            const diff = now - timestamp;
            
            if (diff < 60000) return '剛剛';
            if (diff < 3600000) return `${Math.floor(diff / 60000)} 分鐘前`;
            if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小時前`;
            
            const date = new Date(timestamp);
            return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
        }

        show(options) {
            const {
                appId = 'default',
                title = '',
                message = '',
                body = '',
                icon: customIcon,
                color: customColor,
                duration = DEFAULT_DISPLAY_DURATION,
                actions = [],
                data = {},
                silent = false,
                useSystemNotification = 'auto'
            } = options;

            const notificationMessage = message || body;
            const appInfo = this.getAppInfo(appId);
            
            const notification = {
                id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                appId,
                appName: appInfo.name,
                icon: customIcon || appInfo.icon,
                iconColor: customColor || appInfo.color,
                title,
                message: notificationMessage,
                timestamp: Date.now(),
                read: false,
                actions,
                data
            };

            this.notifications.unshift(notification);
            if (this.notifications.length > MAX_NOTIFICATIONS) {
                this.notifications = this.notifications.slice(0, MAX_NOTIFICATIONS);
            }
            this.saveNotifications();

            this.renderStackNotification(notification, duration);

            if (!silent) {
                this.playNotificationSound();
            }

            const shouldUseSystem = useSystemNotification === 'auto' 
                ? document.hidden || this.onLockScreen
                : useSystemNotification;

            if (shouldUseSystem && this.systemNotificationPermission === 'granted') {
                this.showSystemNotification(notification);
            }

            this.updateAppBadge(appId);
            
            return notification.id;
        }

        renderStackNotification(notification, duration) {
            if (!this.stackElement) return;

            const el = document.createElement('div');
            el.className = `sx-notification${this.isDarkMode ? ' dark' : ''}`;
            el.dataset.id = notification.id;
            
            el.innerHTML = `
                <div class="sx-notification-header">
                    <div class="sx-notification-icon" style="background: ${notification.iconColor}">
                        <span class="material-symbols-rounded" style="font-size: 14px; color: #fff;">${notification.icon}</span>
                    </div>
                    <span class="sx-notification-app-name">${notification.appName}</span>
                    <span class="sx-notification-time">${this.formatTime(notification.timestamp)}</span>
                </div>
                <div class="sx-notification-body">
                    ${notification.title ? `<div class="sx-notification-title">${notification.title}</div>` : ''}
                    <div class="sx-notification-message">${notification.message}</div>
                </div>
                ${notification.actions?.length ? this.renderActions(notification.actions) : ''}
            `;

            el.addEventListener('click', (e) => {
                if (e.target.closest('.sx-notification-action')) return;
                this.handleNotificationClick(notification);
            });

            this.stackElement.appendChild(el);

            if (duration > 0) {
                setTimeout(() => {
                    this.collapseNotification(notification.id);
                }, COLLAPSE_DELAY);

                setTimeout(() => {
                    this.dismissNotification(notification.id);
                }, duration);
            }
        }

        renderActions(actions) {
            return `
                <div class="sx-notification-actions">
                    ${actions.map((action, i) => `
                        <button class="sx-notification-action${action.destructive ? ' destructive' : ''}" 
                                data-action-index="${i}">
                            ${action.title}
                        </button>
                    `).join('')}
                </div>
            `;
        }

        handleNotificationClick(notification) {
            if (this.expandedNotificationId === notification.id) {
                this.collapseNotification(notification.id);
                return;
            }

            this.expandNotification(notification.id);

            if (notification.data?.url) {
                setTimeout(() => {
                    if (notification.data.appId) {
                        window.launchApp?.(notification.data.appId);
                    }
                }, 300);
            }
        }

        expandNotification(id) {
            this.expandedNotificationId = id;
            const el = this.stackElement?.querySelector(`[data-id="${id}"]`);
            el?.classList.add('expanded');
        }

        collapseNotification(id) {
            if (this.expandedNotificationId === id) {
                this.expandedNotificationId = null;
            }
            const el = this.stackElement?.querySelector(`[data-id="${id}"]`);
            el?.classList.add('collapse');
            el?.classList.remove('expanded');
        }

        collapseAllVisible() {
            const notifications = this.stackElement?.querySelectorAll('.sx-notification');
            notifications?.forEach(el => {
                el.classList.add('collapse');
                el.classList.remove('expanded');
            });
            this.expandedNotificationId = null;
        }

        dismissNotification(id) {
            const el = this.stackElement?.querySelector(`[data-id="${id}"]`);
            if (el) {
                el.classList.add('hide');
                setTimeout(() => el.remove(), 300);
            }
        }

        showSystemNotification(notification) {
            if (this.systemNotificationPermission !== 'granted') return;

            const options = {
                body: notification.message,
                icon: '/apps/screenshots/icon-192x192.png',
                badge: '/apps/screenshots/icon-48x48.png',
                tag: notification.id,
                data: notification.data,
                vibrate: [200, 100, 200],
                requireInteraction: false,
                renotify: true
            };

            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification(notification.title || notification.appName, options)
                        .catch(err => {
                            console.warn('[SxNotification] SW 通知失失敗，嘗試直接通知:', err);
                            this.showDirectNotification(notification, options);
                        });
                }).catch(err => {
                    console.warn('[SxNotification] SW 未就緒，使用直接通知:', err);
                    this.showDirectNotification(notification, options);
                });
            } else {
                this.showDirectNotification(notification, options);
            }
        }

        showDirectNotification(notification, options) {
            try {
                const systemNotif = new Notification(notification.title || notification.appName, options);

                systemNotif.onclick = () => {
                    window.focus();
                    if (notification.data?.appId) {
                        window.launchApp?.(notification.data.appId);
                    }
                    systemNotif.close();
                };

                setTimeout(() => systemNotif.close(), 10000);
            } catch (err) {
                console.error('[SxNotification] 系統通知發送失敗:', err);
            }
        }

        playNotificationSound() {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(1320, audioContext.currentTime + 0.1);
                
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
            } catch (e) {
                // 靜默失敗
            }
        }

        updateAppBadge(appId) {
            const unreadCount = this.notifications.filter(n => n.appId === appId && !n.read).length;
            const appIcon = document.querySelector(`[data-app-id="${appId}"]`);
            
            if (appIcon) {
                let badge = appIcon.querySelector('.sx-notification-badge');
                
                if (unreadCount > 0) {
                    if (!badge) {
                        badge = document.createElement('span');
                        badge.className = 'sx-notification-badge';
                        appIcon.appendChild(badge);
                    }
                    badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                } else if (badge) {
                    badge.remove();
                }
            }
        }

        markAsRead(id) {
            const notification = this.notifications.find(n => n.id === id);
            if (notification) {
                notification.read = true;
                this.saveNotifications();
                this.updateAppBadge(notification.appId);
            }
        }

        markAllAsRead() {
            this.notifications.forEach(n => n.read = true);
            this.saveNotifications();
            
            Object.keys(APP_ICONS).forEach(appId => {
                this.updateAppBadge(appId);
            });
        }

        remove(id) {
            const index = this.notifications.findIndex(n => n.id === id);
            if (index > -1) {
                const appId = this.notifications[index].appId;
                this.notifications.splice(index, 1);
                this.saveNotifications();
                this.updateAppBadge(appId);
            }
            this.dismissNotification(id);
        }

        clearAll() {
            const visibleNotifications = this.stackElement?.querySelectorAll('.sx-notification');
            visibleNotifications?.forEach(el => {
                el.classList.add('hide');
                setTimeout(() => el.remove(), 300);
            });

            this.notifications = [];
            this.saveNotifications();
            
            Object.keys(APP_ICONS).forEach(appId => {
                this.updateAppBadge(appId);
            });

            this.closeCenter();
        }

        openCenter() {
            if (this.isCenterOpen) return;
            
            this.isCenterOpen = true;
            this.centerElement?.classList.add('open');
            this.renderNotificationCenter();
            this.markAllAsRead();
        }

        closeCenter() {
            if (!this.isCenterOpen) return;
            
            this.isCenterOpen = false;
            this.centerElement?.classList.remove('open');
        }

        toggleCenter() {
            if (this.isCenterOpen) {
                this.closeCenter();
            } else {
                this.openCenter();
            }
        }

        renderNotificationCenter() {
            if (!this.centerContent) return;

            if (this.notifications.length === 0) {
                this.centerContent.innerHTML = `
                    <div style="text-align: center; padding: 60px 20px; color: rgba(255,255,255,0.5);">
                        <span class="material-symbols-rounded" style="font-size: 48px; opacity: 0.3;">notifications_off</span>
                        <p style="margin-top: 16px; font-size: 16px;">沒有通知</p>
                    </div>
                `;
                return;
            }

            const grouped = this.groupNotificationsByTime();
            
            let html = '';
            for (const [group, notifications] of Object.entries(grouped)) {
                html += `
                    <div class="sx-notification-group">
                        <div class="sx-notification-group-header">${group}</div>
                        <div class="sx-notification-group-list">
                            ${notifications.map(n => this.renderCenterNotification(n)).join('')}
                        </div>
                    </div>
                `;
            }
            
            this.centerContent.innerHTML = html;

            this.centerContent.querySelectorAll('.sx-notification').forEach(el => {
                el.addEventListener('click', () => {
                    const id = el.dataset.id;
                    const notification = this.notifications.find(n => n.id === id);
                    if (notification) {
                        this.handleNotificationClick(notification);
                        this.closeCenter();
                    }
                });
            });
        }

        groupNotificationsByTime() {
            const groups = {};
            const now = Date.now();
            
            this.notifications.forEach(n => {
                const diff = now - n.timestamp;
                let group;
                
                if (diff < 3600000) {
                    group = '最近一小時';
                } else if (diff < 86400000) {
                    group = '今天';
                } else if (diff < 172800000) {
                    group = '昨天';
                } else {
                    const date = new Date(n.timestamp);
                    group = `${date.getMonth() + 1}月${date.getDate()}日`;
                }
                
                if (!groups[group]) {
                    groups[group] = [];
                }
                groups[group].push(n);
            });
            
            return groups;
        }

        renderCenterNotification(notification) {
            return `
                <div class="sx-notification${this.isDarkMode ? ' dark' : ''}" data-id="${notification.id}">
                    <div class="sx-notification-header">
                        <div class="sx-notification-icon" style="background: ${notification.iconColor}">
                            <span class="material-symbols-rounded" style="font-size: 14px; color: #fff;">${notification.icon}</span>
                        </div>
                        <span class="sx-notification-app-name">${notification.appName}</span>
                        <span class="sx-notification-time">${this.formatTime(notification.timestamp)}</span>
                    </div>
                    <div class="sx-notification-body">
                        ${notification.title ? `<div class="sx-notification-title">${notification.title}</div>` : ''}
                        <div class="sx-notification-message">${notification.message}</div>
                    </div>
                </div>
            `;
        }

        getUnreadCount(appId = null) {
            if (appId) {
                return this.notifications.filter(n => n.appId === appId && !n.read).length;
            }
            return this.notifications.filter(n => !n.read).length;
        }

        getAll() {
            return [...this.notifications];
        }

        schedule(options) {
            const { delay = 0, ...notifOptions } = options;
            
            if (delay <= 0) {
                return this.show(notifOptions);
            }
            
            const timeoutId = setTimeout(() => {
                this.show(notifOptions);
            }, delay);
            
            return timeoutId;
        }

        cancelScheduled(timeoutId) {
            clearTimeout(timeoutId);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            new SxNotificationManager();
        });
    } else {
        new SxNotificationManager();
    }
})();
