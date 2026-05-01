(function() {
    'use strict';

    class IOSNotificationHandler {
        constructor(core) {
            this.core = core;
            this.permissionGranted = false;
            this.serviceWorkerReady = false;
            this.isPWA = false;
            this.iosVersion = null;
            this.quickReplyActions = [];
        }

        async init() {
            this.detectIOSVersion();
            this.checkPWAStatus();
            await this.checkPermission();
            await this.registerServiceWorker();
            this.setupPushNotifications();
            this.setupQuickReplyActions();
            this.setupBackgroundDetection();
            
            console.log('[IOSNotificationHandler] 已初始化', {
                permission: this.permissionGranted,
                swReady: this.serviceWorkerReady,
                isPWA: this.isPWA,
                iosVersion: this.iosVersion,
                supportsWebPush: this.supportsWebPush()
            });
        }

        detectIOSVersion() {
            const match = navigator.userAgent.match(/OS (\d+)_?(\d+)?/);
            if (match) {
                this.iosVersion = {
                    major: parseInt(match[1], 10),
                    minor: parseInt(match[2] || 0, 10)
                };
            }
        }

        checkPWAStatus() {
            this.isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                         window.navigator.standalone === true;
        }

        supportsWebPush() {
            if (!this.iosVersion) return false;
            return this.iosVersion.major >= 16 && this.iosVersion.minor >= 4 && this.isPWA;
        }

        getIOSLimitationMessage() {
            if (!this.isPWA) {
                return '請將此網站加入主屏幕（分享 → 加入主屏幕）以啟用通知功能';
            }
            
            if (!this.iosVersion || this.iosVersion.major < 16) {
                return 'iOS 16.4+ 才支援 Web Push 通知';
            }
            
            if (this.iosVersion.major === 16 && this.iosVersion.minor < 4) {
                return '請更新至 iOS 16.4+ 以支援 Web Push 通知';
            }
            
            if (!this.permissionGranted) {
                return '請授予通知權限以啟用推送通知';
            }
            
            return 'Web Push 已啟用';
        }

        async checkPermission() {
            if (!('Notification' in window)) {
                console.warn('[IOSNotificationHandler] 此瀏覽器不支援通知');
                return;
            }

            if (Notification.permission === 'granted') {
                this.permissionGranted = true;
            } else if (Notification.permission !== 'denied') {
                const permission = await Notification.requestPermission();
                this.permissionGranted = permission === 'granted';
            }
        }

        async registerServiceWorker() {
            if (!('serviceWorker' in navigator)) {
                console.warn('[IOSNotificationHandler] 不支援 Service Worker');
                return;
            }

            try {
                const registration = await navigator.serviceWorker.ready;
                this.serviceWorkerReady = true;
                console.log('[IOSNotificationHandler] Service Worker 已就緒');
                
                navigator.serviceWorker.addEventListener('message', (event) => {
                    this.handleServiceWorkerMessage(event.data);
                });
            } catch (err) {
                console.warn('[IOSNotificationHandler] Service Worker 未就緒:', err);
            }
        }

        setupPushNotifications() {
            this.core.on('message_received', (msg) => {
                this.showNotification(msg);
            });
        }

        setupQuickReplyActions() {
            this.quickReplyActions = [
                { action: 'reply', title: '回覆', type: 'text' },
                { action: 'like', title: '👍', type: 'button' },
                { action: 'love', title: '❤️', type: 'button' },
                { action: 'dismiss', title: '忽略', type: 'button' }
            ];
        }

        async showNotification(message) {
            if (!this.permissionGranted) {
                await this.checkPermission();
                if (!this.permissionGranted) return;
            }

            const characterInfo = this.core.getCharacterInfo();
            const title = characterInfo.name || 'AI 助理';
            const body = typeof message === 'string' ? message : (message.content || '新訊息');
            
            const options = {
                body: body,
                icon: characterInfo.avatar || '/apps/screenshots/icon-192x192.png',
                badge: '/apps/screenshots/icon-48x48.png',
                tag: 'sx-floating-message',
                renotify: true,
                requireInteraction: false,
                vibrate: [200, 100, 200],
                data: {
                    chatId: this.core.getActiveChatId(),
                    timestamp: Date.now(),
                    url: window.location.href
                },
                actions: [
                    { action: 'reply', title: '快速回覆' },
                    { action: 'view', title: '查看' }
                ]
            };

            try {
                if (this.serviceWorkerReady && navigator.serviceWorker.controller) {
                    const registration = await navigator.serviceWorker.ready;
                    await registration.showNotification(title, options);
                } else {
                    const notification = new Notification(title, options);
                    
                    notification.onclick = () => {
                        this.handleNotificationClick(notification);
                    };
                    
                    setTimeout(() => notification.close(), 10000);
                }
                
                console.log('[IOSNotificationHandler] 通知已發送');
            } catch (err) {
                console.error('[IOSNotificationHandler] 發送通知失敗:', err);
            }
        }

        handleNotificationClick(notification) {
            window.focus();
            
            const data = notification.data || {};
            
            if (data.chatId) {
                localStorage.setItem('sx_active_chat_id', data.chatId);
            }
            
            if (window.launchApp) {
                window.launchApp('chat');
            }
            
            notification.close();
        }

        handleServiceWorkerMessage(data) {
            if (!data || typeof data !== 'object') return;
            
            switch (data.type) {
                case 'NOTIFICATION_CLICKED':
                    this.handleNotificationClick({ data: data.data });
                    break;
                    
                case 'QUICK_REPLY':
                    if (data.reply) {
                        this.core.sendMessage(data.reply);
                    }
                    break;
                    
                case 'ACTION_CLICKED':
                    this.handleActionClick(data.action, data.data);
                    break;
            }
        }

        handleActionClick(action, data) {
            switch (action) {
                case 'reply':
                    break;
                    
                case 'like':
                    this.core.sendMessage('👍');
                    break;
                    
                case 'love':
                    this.core.sendMessage('❤️');
                    break;
                    
                case 'dismiss':
                    break;
                    
                case 'view':
                    window.focus();
                    if (window.launchApp) {
                        window.launchApp('chat');
                    }
                    break;
            }
        }

        async showInteractiveNotification(message, options = {}) {
            if (!this.permissionGranted) {
                await this.checkPermission();
                if (!this.permissionGranted) return;
            }

            const characterInfo = this.core.getCharacterInfo();
            const title = options.title || characterInfo.name || 'AI 助理';
            
            const notificationOptions = {
                body: message,
                icon: characterInfo.avatar || '/apps/screenshots/icon-192x192.png',
                badge: '/apps/screenshots/icon-48x48.png',
                tag: options.tag || 'sx-interactive',
                renotify: true,
                requireInteraction: options.requireInteraction || false,
                data: options.data || {},
                actions: options.actions || this.quickReplyActions.map(a => ({
                    action: a.action,
                    title: a.title
                }))
            };

            try {
                if (this.serviceWorkerReady) {
                    const registration = await navigator.serviceWorker.ready;
                    await registration.showNotification(title, notificationOptions);
                } else {
                    new Notification(title, notificationOptions);
                }
            } catch (err) {
                console.error('[IOSNotificationHandler] 發送互動通知失敗:', err);
            }
        }

        show() {
            console.log('[IOSNotificationHandler] iOS 不支援懸浮窗，使用通知模式');
            this.showNotification('點擊以開啟聊天');
        }

        hide() {
            console.log('[IOSNotificationHandler] 隱藏通知模式');
        }

        minimize() {
            console.log('[IOSNotificationHandler] 最小化');
        }

        expand() {
            window.focus();
            if (window.launchApp) {
                window.launchApp('chat');
            }
        }

        onMessage(message) {
            this.showNotification(message);
        }

        async requestPermission() {
            if (!('Notification' in window)) {
                return { granted: false, reason: 'not_supported' };
            }

            if (Notification.permission === 'granted') {
                this.permissionGranted = true;
                return { granted: true, reason: 'already_granted' };
            }

            if (Notification.permission === 'denied') {
                return { granted: false, reason: 'denied' };
            }

            try {
                const permission = await Notification.requestPermission();
                this.permissionGranted = permission === 'granted';
                
                return {
                    granted: this.permissionGranted,
                    reason: permission
                };
            } catch (err) {
                return { granted: false, reason: 'error', error: err.message };
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

        async subscribeToPush() {
            if (!this.serviceWorkerReady) {
                console.warn('[IOSNotificationHandler] Service Worker 未就緒');
                return null;
            }

            try {
                const registration = await navigator.serviceWorker.ready;
                let subscription = await registration.pushManager.getSubscription();
                
                if (!subscription) {
                    const vapidPublicKey = localStorage.getItem('sx_vapid_public_key');
                    if (!vapidPublicKey) {
                        console.warn('[IOSNotificationHandler] 未設定 VAPID 公鑰');
                        return null;
                    }
                    
                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
                    });
                }
                
                console.log('[IOSNotificationHandler] 已訂閱推送通知');
                return subscription;
            } catch (err) {
                console.error('[IOSNotificationHandler] 訂閱推送失敗:', err);
                return null;
            }
        }

        urlBase64ToUint8Array(base64String) {
            const padding = '='.repeat((4 - base64String.length % 4) % 4);
            const base64 = (base64String + padding)
                .replace(/\-/g, '+')
                .replace(/_/g, '/');

            const rawData = window.atob(base64);
            const outputArray = new Uint8Array(rawData.length);

            for (let i = 0; i < rawData.length; ++i) {
                outputArray[i] = rawData.charCodeAt(i);
            }
            return outputArray;
        }

        captureScreen() {
            console.log('[IOSNotificationHandler] iOS 不支援螢幕截圖');
            return null;
        }

        setupBackgroundDetection() {
            let hiddenTime = null;
            let checkInterval = null;
            
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    hiddenTime = Date.now();
                    this.startBackgroundCheck();
                } else {
                    this.stopBackgroundCheck();
                    if (hiddenTime) {
                        const awayMinutes = Math.floor((Date.now() - hiddenTime) / 60000);
                        if (awayMinutes >= 1) {
                            this.onReturnFromBackground(awayMinutes);
                        }
                    }
                    hiddenTime = null;
                }
            });
            
            window.addEventListener('pageshow', () => {
                this.checkPendingNotifications();
            });
        }

        startBackgroundCheck() {
            if (checkInterval) return;
            
            checkInterval = setInterval(() => {
                this.saveHeartbeat();
            }, 30000);
        }

        stopBackgroundCheck() {
            if (checkInterval) {
                clearInterval(checkInterval);
                checkInterval = null;
            }
        }

        saveHeartbeat() {
            localStorage.setItem('sx_ios_heartbeat', Date.now().toString());
        }

        onReturnFromBackground(awayMinutes) {
            console.log(`[IOSNotificationHandler] 用戶離開 ${awayMinutes} 分鐘後返回`);
            
            const pendingCount = this.getPendingNotificationCount();
            
            if (pendingCount > 0) {
                this.showWelcomeBack(pendingCount);
            } else if (awayMinutes >= 30) {
                this.triggerIdleGreeting(awayMinutes);
            }
        }

        getPendingNotificationCount() {
            try {
                const raw = localStorage.getItem('sx_pending_notifications');
                return raw ? JSON.parse(raw).length : 0;
            } catch {
                return 0;
            }
        }

        checkPendingNotifications() {
            const pending = this.getPendingNotifications();
            if (pending.length > 0) {
                pending.forEach(notif => {
                    this.showInAppNotification(notif);
                });
                this.clearPendingNotifications();
            }
        }

        getPendingNotifications() {
            try {
                const raw = localStorage.getItem('sx_pending_notifications');
                return raw ? JSON.parse(raw) : [];
            } catch {
                return [];
            }
        }

        addPendingNotification(notification) {
            const pending = this.getPendingNotifications();
            pending.push({
                ...notification,
                timestamp: Date.now()
            });
            localStorage.setItem('sx_pending_notifications', JSON.stringify(pending));
            this.updateBadge(pending.length);
        }

        clearPendingNotifications() {
            localStorage.setItem('sx_pending_notifications', JSON.stringify([]));
            this.updateBadge(0);
        }

        showWelcomeBack(pendingCount) {
            const charInfo = this.core.getCharacterInfo();
            
            this.showInAppBanner({
                title: charInfo.name,
                message: `歡迎回來！您有 ${pendingCount} 條新訊息`,
                icon: charInfo.avatar,
                onClick: () => {
                    if (window.launchApp) {
                        window.launchApp('chat');
                    }
                }
            });
        }

        triggerIdleGreeting(awayMinutes) {
            if (window.ChatNotificationEngine) {
                window.ChatNotificationEngine.generateAndSendNotification();
            }
        }

        showInAppNotification(notification) {
            this.showInAppBanner({
                title: notification.title || this.core.getCharacterInfo().name,
                message: notification.message || notification.content,
                icon: notification.icon || this.core.getCharacterInfo().avatar,
                onClick: notification.onClick
            });
        }

        showInAppBanner(options) {
            if (document.hidden) {
                this.addPendingNotification(options);
                return;
            }

            let banner = document.getElementById('sx-ios-banner');
            if (banner) banner.remove();

            banner = document.createElement('div');
            banner.id = 'sx-ios-banner';
            banner.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 16px;
                padding-top: max(16px, env(safe-area-inset-top));
                z-index: 999999;
                display: flex;
                align-items: center;
                gap: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                transform: translateY(-100%);
                transition: transform 0.3s ease;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                cursor: pointer;
            `;

            const avatar = options.icon 
                ? `<img src="${options.icon}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">`
                : `<div style="width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:20px;">💬</div>`;

            banner.innerHTML = `
                ${avatar}
                <div style="flex:1;min-width:0;">
                    <div style="font-weight:600;font-size:14px;">${options.title}</div>
                    <div style="font-size:13px;opacity:0.9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${options.message}</div>
                </div>
                <button style="background:rgba(255,255,255,0.2);border:none;color:white;padding:8px 16px;border-radius:20px;font-size:14px;cursor:pointer;">查看</button>
            `;

            document.body.appendChild(banner);

            requestAnimationFrame(() => {
                banner.style.transform = 'translateY(0)';
            });

            const closeBanner = () => {
                banner.style.transform = 'translateY(-100%)';
                setTimeout(() => banner.remove(), 300);
                if (options.onClick) options.onClick();
            };

            banner.addEventListener('click', closeBanner);
            
            setTimeout(() => {
                if (document.body.contains(banner)) {
                    banner.style.transform = 'translateY(-100%)';
                    setTimeout(() => banner.remove(), 300);
                }
            }, 5000);
        }

        updateBadge(count) {
            if ('setAppBadge' in navigator) {
                if (count > 0) {
                    navigator.setAppBadge(count).catch(() => {});
                } else {
                    navigator.clearAppBadge().catch(() => {});
                }
            }
        }

        getCapabilities() {
            return {
                isPWA: this.isPWA,
                iosVersion: this.iosVersion,
                supportsWebPush: this.supportsWebPush(),
                supportsBadge: 'setAppBadge' in navigator,
                limitationMessage: this.getIOSLimitationMessage()
            };
        }
    }

    window.IOSNotificationHandler = IOSNotificationHandler;
})();
