(function() {
    'use strict';

    class AndroidFloatingWindow {
        constructor(core) {
            this.core = core;
            this.container = null;
            this.ball = null;
            this.panel = null;
            this.popupWindow = null;
            this.pipWindow = null;
            this.isDragging = false;
            this.dragOffset = { x: 0, y: 0 };
            this.touchStartPos = { x: 0, y: 0 };
            this.hasMoved = false;
        }

        init() {
            this.createStyles();
            this.createContainer();
            this.bindEvents();
            this.checkPiPSupport();
            
            console.log('[AndroidFloatingWindow] 已初始化', {
                isPWA: this.isPWA(),
                supportsPiP: this.supportsPiP()
            });
        }

        isPWA() {
            return window.matchMedia('(display-mode: standalone)').matches ||
                   window.navigator.standalone === true;
        }

        supportsPiP() {
            return 'pictureInPictureEnabled' in document && document.pictureInPictureEnabled;
        }

        createStyles() {
            if (document.getElementById('android-floating-messenger-styles')) return;
            
            const style = document.createElement('style');
            style.id = 'android-floating-messenger-styles';
            style.textContent = `
                .afm-container {
                    position: fixed;
                    z-index: 99999;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    touch-action: none;
                }
                
                .afm-container.hidden {
                    display: none;
                }
                
                .afm-ball {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.15s ease;
                    user-select: none;
                    -webkit-user-select: none;
                    -webkit-tap-highlight-color: transparent;
                }
                
                .afm-ball:active {
                    transform: scale(0.9);
                }
                
                .afm-ball-icon {
                    color: white;
                    font-size: 28px;
                    pointer-events: none;
                }
                
                .afm-ball-badge {
                    position: absolute;
                    top: -4px;
                    right: -4px;
                    min-width: 22px;
                    height: 22px;
                    background: #ff3b30;
                    border-radius: 11px;
                    color: white;
                    font-size: 12px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0 6px;
                    border: 2px solid white;
                }
                
                .afm-panel {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: white;
                    z-index: 99998;
                    display: flex;
                    flex-direction: column;
                    transform: translateY(100%);
                    transition: transform 0.3s ease;
                }
                
                .afm-panel.visible {
                    transform: translateY(0);
                }
                
                .afm-panel.dark {
                    background: #1c1c1e;
                }
                
                .afm-header {
                    display: flex;
                    align-items: center;
                    padding: 16px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding-top: max(16px, env(safe-area-inset-top));
                    flex-shrink: 0;
                }
                
                .afm-header-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.2);
                    margin-right: 12px;
                    object-fit: cover;
                }
                
                .afm-header-info {
                    flex: 1;
                }
                
                .afm-header-name {
                    color: white;
                    font-size: 16px;
                    font-weight: 600;
                }
                
                .afm-header-status {
                    color: rgba(255, 255, 255, 0.7);
                    font-size: 12px;
                }
                
                .afm-header-btn {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.15);
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .afm-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px;
                    background: #f5f5f5;
                    -webkit-overflow-scrolling: touch;
                }
                
                .afm-panel.dark .afm-messages {
                    background: #2c2c2e;
                }
                
                .afm-message {
                    margin-bottom: 16px;
                    display: flex;
                    flex-direction: column;
                }
                
                .afm-message.sent {
                    align-items: flex-end;
                }
                
                .afm-message.received {
                    align-items: flex-start;
                }
                
                .afm-message-bubble {
                    max-width: 80%;
                    padding: 12px 16px;
                    border-radius: 20px;
                    font-size: 16px;
                    line-height: 1.4;
                    word-wrap: break-word;
                }
                
                .afm-message.sent .afm-message-bubble {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-bottom-right-radius: 4px;
                }
                
                .afm-message.received .afm-message-bubble {
                    background: white;
                    color: #333;
                    border-bottom-left-radius: 4px;
                }
                
                .afm-panel.dark .afm-message.received .afm-message-bubble {
                    background: #3a3a3c;
                    color: #fff;
                }
                
                .afm-message-time {
                    font-size: 11px;
                    color: #999;
                    margin-top: 4px;
                }
                
                .afm-input-area {
                    display: flex;
                    align-items: center;
                    padding: 12px 16px;
                    background: white;
                    border-top: 1px solid #eee;
                    padding-bottom: max(12px, env(safe-area-inset-bottom));
                    gap: 12px;
                    flex-shrink: 0;
                }
                
                .afm-panel.dark .afm-input-area {
                    background: #1c1c1e;
                    border-top-color: #3a3a3c;
                }
                
                .afm-input {
                    flex: 1;
                    border: none;
                    background: #f5f5f5;
                    border-radius: 24px;
                    padding: 12px 20px;
                    font-size: 16px;
                    outline: none;
                }
                
                .afm-panel.dark .afm-input {
                    background: #2c2c2e;
                    color: white;
                }
                
                .afm-send-btn {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                
                .afm-toolbar {
                    display: flex;
                    padding: 12px 16px;
                    background: #fafafa;
                    border-top: 1px solid #eee;
                    gap: 16px;
                    flex-shrink: 0;
                }
                
                .afm-panel.dark .afm-toolbar {
                    background: #2c2c2e;
                    border-top-color: #3a3a3c;
                }
                
                .afm-toolbar-btn {
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    background: transparent;
                    border: none;
                    color: #666;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .afm-panel.dark .afm-toolbar-btn {
                    color: #999;
                }
                
                .afm-pip-video {
                    position: fixed;
                    width: 1px;
                    height: 1px;
                    opacity: 0;
                    pointer-events: none;
                }
            `;
            document.head.appendChild(style);
        }

        createContainer() {
            this.container = document.createElement('div');
            this.container.className = 'afm-container hidden';
            this.container.innerHTML = `
                <div class="afm-ball" id="afm-ball">
                    <span class="afm-ball-icon">💬</span>
                </div>
            `;
            
            this.panel = document.createElement('div');
            this.panel.className = 'afm-panel';
            this.panel.innerHTML = `
                <div class="afm-header">
                    <img class="afm-header-avatar" id="afm-avatar" src="" alt="">
                    <div class="afm-header-info">
                        <div class="afm-header-name" id="afm-name">AI 助理</div>
                        <div class="afm-header-status">在線</div>
                    </div>
                    <button class="afm-header-btn" id="afm-close">×</button>
                </div>
                <div class="afm-messages" id="afm-messages"></div>
                <div class="afm-toolbar">
                    <button class="afm-toolbar-btn" id="afm-screenshot">
                        <span class="material-symbols-rounded">photo_camera</span>
                    </button>
                    <button class="afm-toolbar-btn" id="afm-screenshare">
                        <span class="material-symbols-rounded">screen_share</span>
                    </button>
                </div>
                <div class="afm-input-area">
                    <input type="text" class="afm-input" id="afm-input" placeholder="輸入訊息...">
                    <button class="afm-send-btn" id="afm-send">
                        <span class="material-symbols-rounded">send</span>
                    </button>
                </div>
            `;
            
            const appendToBody = () => {
                if (document.body) {
                    document.body.appendChild(this.container);
                    document.body.appendChild(this.panel);
                    
                    this.ball = document.getElementById('afm-ball');
                    
                    this.updatePosition();
                    this.updateCharacterInfo();
                    console.log('[AndroidFloatingWindow] 容器已創建並附加到 body');
                } else {
                    setTimeout(appendToBody, 100);
                }
            };
            
            appendToBody();
        }

        bindEvents() {
            this.ball.addEventListener('touchstart', (e) => {
                this.onTouchStart(e);
            }, { passive: false });
            
            this.ball.addEventListener('touchmove', (e) => {
                this.onTouchMove(e);
            }, { passive: false });
            
            this.ball.addEventListener('touchend', (e) => {
                this.onTouchEnd(e);
            });
            
            document.getElementById('afm-close').addEventListener('click', () => {
                this.hidePanel();
            });
            
            document.getElementById('afm-send').addEventListener('click', () => {
                this.sendInputMessage();
            });
            
            document.getElementById('afm-input').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendInputMessage();
                }
            });
            
            document.getElementById('afm-screenshot').addEventListener('click', () => {
                this.captureScreen();
            });
            
            document.getElementById('afm-screenshare').addEventListener('click', () => {
                this.core.startScreenShare();
            });
            
            this.core.on('message_received', (msg) => {
                this.onMessage(msg);
            });
            
            this.core.on('character_updated', () => {
                this.updateCharacterInfo();
            });
        }

        onTouchStart(e) {
            e.preventDefault();
            this.isDragging = false;
            this.hasMoved = false;
            const touch = e.touches[0];
            this.touchStartPos = { x: touch.clientX, y: touch.clientY };
            this.dragOffset = {
                x: touch.clientX - this.core.position.x,
                y: touch.clientY - this.core.position.y
            };
        }

        onTouchMove(e) {
            e.preventDefault();
            const touch = e.touches[0];
            
            const deltaX = Math.abs(touch.clientX - this.touchStartPos.x);
            const deltaY = Math.abs(touch.clientY - this.touchStartPos.y);
            
            if (deltaX > 10 || deltaY > 10) {
                this.hasMoved = true;
                this.isDragging = true;
            }
            
            if (this.isDragging) {
                const newX = Math.max(0, Math.min(window.innerWidth - 60, touch.clientX - this.dragOffset.x));
                const newY = Math.max(0, Math.min(window.innerHeight - 60, touch.clientY - this.dragOffset.y));
                
                this.core.setPosition(newX, newY);
                this.updatePosition();
            }
        }

        onTouchEnd(e) {
            if (!this.hasMoved) {
                this.showPanel();
            }
            this.isDragging = false;
        }

        updatePosition() {
            const pos = this.core.position;
            this.container.style.left = pos.x + 'px';
            this.container.style.top = pos.y + 'px';
        }

        updateCharacterInfo() {
            const info = this.core.getCharacterInfo();
            const nameEl = document.getElementById('afm-name');
            const avatarEl = document.getElementById('afm-avatar');
            
            if (nameEl) nameEl.textContent = info.name;
            if (avatarEl) {
                if (info.avatar) {
                    avatarEl.src = info.avatar;
                } else {
                    avatarEl.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                }
            }
        }

        show() {
            this.container.classList.remove('hidden');
            this.core.state.isOpen = true;
            this.updatePosition();
            this.updateBadge();
            this.updateCharacterInfo();
            console.log('[AndroidFloatingWindow] 已顯示懸浮球');
        }

        hide() {
            this.container.classList.add('hidden');
            this.hidePanel();
            this.core.state.isOpen = false;
        }

        showPanel() {
            this.panel.classList.add('visible');
            this.core.state.isMinimized = false;
            this.core.clearUnread();
            this.updateBadge();
            this.loadRecentMessages();
            
            setTimeout(() => {
                document.getElementById('afm-input')?.focus();
            }, 300);
        }

        hidePanel() {
            this.panel.classList.remove('visible');
            this.core.state.isMinimized = true;
            this.core.saveState();
        }

        minimize() {
            this.hidePanel();
        }

        expand() {
            this.showPanel();
        }

        loadRecentMessages() {
            const session = this.core.getActiveSession();
            if (!session || !session.history) return;
            
            const container = document.getElementById('afm-messages');
            container.innerHTML = '';
            
            const recentMessages = session.history.slice(-30);
            recentMessages.forEach(msg => {
                this.addMessage(msg.content, msg.role === 'user' ? 'sent' : 'received', false);
            });
            
            this.scrollToBottom();
        }

        addMessage(content, type = 'received', scroll = true) {
            const container = document.getElementById('afm-messages');
            const msgEl = document.createElement('div');
            msgEl.className = `afm-message ${type}`;
            
            const time = new Date().toLocaleTimeString('zh-TW', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            msgEl.innerHTML = `
                <div class="afm-message-bubble">${this.escapeHtml(content)}</div>
                <div class="afm-message-time">${time}</div>
            `;
            
            container.appendChild(msgEl);
            
            if (scroll) {
                this.scrollToBottom();
            }
        }

        scrollToBottom() {
            const container = document.getElementById('afm-messages');
            container.scrollTop = container.scrollHeight;
        }

        sendInputMessage() {
            const input = document.getElementById('afm-input');
            const message = input.value.trim();
            if (!message) return;
            
            this.addMessage(message, 'sent');
            input.value = '';
            
            this.core.sendMessage(message);
        }

        updateBadge() {
            let badge = this.ball.querySelector('.afm-ball-badge');
            const count = this.core.state.unreadCount;
            
            if (count > 0) {
                if (!badge) {
                    badge = document.createElement('div');
                    badge.className = 'afm-ball-badge';
                    this.ball.appendChild(badge);
                }
                badge.textContent = count > 99 ? '99+' : count;
            } else if (badge) {
                badge.remove();
            }
        }

        onMessage(message) {
            if (this.core.state.isMinimized) {
                this.updateBadge();
            } else {
                this.addMessage(message.content, 'received');
            }
        }

        checkPiPSupport() {
            if (!this.supportsPiP()) {
                console.log('[AndroidFloatingWindow] 此裝置不支援 PiP');
            }
        }

        async enterPiPMode(videoElement) {
            if (!this.supportsPiP()) return false;
            
            try {
                await videoElement.requestPictureInPicture();
                console.log('[AndroidFloatingWindow] 進入 PiP 模式');
                return true;
            } catch (err) {
                console.warn('[AndroidFloatingWindow] 進入 PiP 失敗:', err);
                return false;
            }
        }

        async exitPiPMode() {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
                console.log('[AndroidFloatingWindow] 退出 PiP 模式');
            }
        }

        async captureScreen() {
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({
                    video: { mediaSource: 'screen' }
                });
                
                const video = document.createElement('video');
                video.srcObject = stream;
                await video.play();
                
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0);
                
                stream.getTracks().forEach(track => track.stop());
                
                const dataUrl = canvas.toDataURL('image/png');
                
                this.addMessage('📷 已截取螢幕畫面', 'sent');
                
                if (window.parent !== window) {
                    window.parent.postMessage({
                        type: 'FLOATING_SCREENSHOT',
                        dataUrl: dataUrl
                    }, '*');
                }
                
                return dataUrl;
            } catch (err) {
                console.warn('[AndroidFloatingWindow] 截圖失敗:', err);
                return null;
            }
        }

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    }

    window.AndroidFloatingWindow = AndroidFloatingWindow;
})();
