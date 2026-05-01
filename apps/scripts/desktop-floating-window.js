(function() {
    'use strict';

    class DesktopFloatingWindow {
        constructor(core) {
            this.core = core;
            this.container = null;
            this.ball = null;
            this.panel = null;
            this.header = null;
            this.messagesContainer = null;
            this.inputField = null;
            this.isDragging = false;
            this.isResizing = false;
            this.dragOffset = { x: 0, y: 0 };
            this.resizeStart = { x: 0, y: 0, width: 0, height: 0 };
            this.minWidth = 280;
            this.minHeight = 360;
            this.maxWidth = 600;
            this.maxHeight = 800;
        }

        init() {
            this.createStyles();
            this.createContainer();
            this.bindEvents();
            
            console.log('[DesktopFloatingWindow] 已初始化');
        }

        createStyles() {
            if (document.getElementById('floating-messenger-styles')) return;
            
            const style = document.createElement('style');
            style.id = 'floating-messenger-styles';
            style.textContent = `
                .fm-container {
                    position: fixed;
                    z-index: 99999;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    pointer-events: auto;
                    transition: opacity 0.2s ease, transform 0.2s ease;
                }
                
                .fm-container.hidden {
                    opacity: 0;
                    pointer-events: none;
                    transform: scale(0.9);
                }
                
                .fm-ball {
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                    user-select: none;
                }
                
                .fm-ball:hover {
                    transform: scale(1.1);
                    box-shadow: 0 6px 24px rgba(102, 126, 234, 0.5);
                }
                
                .fm-ball:active {
                    transform: scale(0.95);
                }
                
                .fm-ball-icon {
                    color: white;
                    font-size: 24px;
                }
                
                .fm-ball-badge {
                    position: absolute;
                    top: -4px;
                    right: -4px;
                    min-width: 20px;
                    height: 20px;
                    background: #ff3b30;
                    border-radius: 10px;
                    color: white;
                    font-size: 12px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0 6px;
                }
                
                .fm-panel {
                    position: absolute;
                    bottom: 70px;
                    right: 0;
                    width: 320px;
                    height: 480px;
                    background: #ffffff;
                    border-radius: 16px;
                    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.15);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    opacity: 0;
                    transform: translateY(10px) scale(0.95);
                    transition: opacity 0.2s ease, transform 0.2s ease;
                    pointer-events: none;
                }
                
                .fm-panel.visible {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                    pointer-events: auto;
                }
                
                .fm-panel.dark {
                    background: #1c1c1e;
                }
                
                .fm-header {
                    display: flex;
                    align-items: center;
                    padding: 12px 16px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    cursor: move;
                    user-select: none;
                    flex-shrink: 0;
                }
                
                .fm-header-avatar {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.2);
                    margin-right: 10px;
                    object-fit: cover;
                    flex-shrink: 0;
                }
                
                .fm-header-info {
                    flex: 1;
                    min-width: 0;
                }
                
                .fm-header-name {
                    color: white;
                    font-size: 14px;
                    font-weight: 600;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .fm-header-status {
                    color: rgba(255, 255, 255, 0.7);
                    font-size: 11px;
                }
                
                .fm-header-actions {
                    display: flex;
                    gap: 8px;
                }
                
                .fm-header-btn {
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.15);
                    border: none;
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.2s;
                    padding: 0;
                }
                
                .fm-header-btn:hover {
                    background: rgba(255, 255, 255, 0.25);
                }
                
                .fm-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 12px;
                    background: #f5f5f5;
                }
                
                .fm-panel.dark .fm-messages {
                    background: #2c2c2e;
                }
                
                .fm-message {
                    margin-bottom: 12px;
                    display: flex;
                    flex-direction: column;
                }
                
                .fm-message.sent {
                    align-items: flex-end;
                }
                
                .fm-message.received {
                    align-items: flex-start;
                }
                
                .fm-message-bubble {
                    max-width: 85%;
                    padding: 10px 14px;
                    border-radius: 18px;
                    font-size: 14px;
                    line-height: 1.4;
                    word-wrap: break-word;
                }
                
                .fm-message.sent .fm-message-bubble {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-bottom-right-radius: 4px;
                }
                
                .fm-message.received .fm-message-bubble {
                    background: white;
                    color: #333;
                    border-bottom-left-radius: 4px;
                }
                
                .fm-panel.dark .fm-message.received .fm-message-bubble {
                    background: #3a3a3c;
                    color: #fff;
                }
                
                .fm-message-time {
                    font-size: 10px;
                    color: #999;
                    margin-top: 4px;
                }
                
                .fm-input-area {
                    display: flex;
                    align-items: center;
                    padding: 12px;
                    background: white;
                    border-top: 1px solid #eee;
                    gap: 8px;
                    flex-shrink: 0;
                }
                
                .fm-panel.dark .fm-input-area {
                    background: #1c1c1e;
                    border-top-color: #3a3a3c;
                }
                
                .fm-input {
                    flex: 1;
                    border: none;
                    background: #f5f5f5;
                    border-radius: 20px;
                    padding: 10px 16px;
                    font-size: 14px;
                    outline: none;
                    resize: none;
                    max-height: 100px;
                }
                
                .fm-panel.dark .fm-input {
                    background: #2c2c2e;
                    color: white;
                }
                
                .fm-input::placeholder {
                    color: #999;
                }
                
                .fm-send-btn {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.2s, opacity 0.2s;
                    padding: 0;
                    flex-shrink: 0;
                }
                
                .fm-send-btn:hover {
                    transform: scale(1.05);
                }
                
                .fm-send-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .fm-toolbar {
                    display: flex;
                    padding: 8px 12px;
                    background: #fafafa;
                    border-top: 1px solid #eee;
                    gap: 8px;
                    flex-shrink: 0;
                }
                
                .fm-panel.dark .fm-toolbar {
                    background: #2c2c2e;
                    border-top-color: #3a3a3c;
                }
                
                .fm-toolbar-btn {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: transparent;
                    border: none;
                    color: #666;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.2s, color 0.2s;
                    padding: 0;
                }
                
                .fm-toolbar-btn:hover {
                    background: #eee;
                    color: #333;
                }
                
                .fm-panel.dark .fm-toolbar-btn {
                    color: #999;
                }
                
                .fm-panel.dark .fm-toolbar-btn:hover {
                    background: #3a3a3c;
                    color: #fff;
                }
                
                .fm-resize-handle {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 20px;
                    height: 20px;
                    cursor: nwse-resize;
                    opacity: 0.5;
                }
                
                .fm-resize-handle::before {
                    content: '';
                    position: absolute;
                    bottom: 4px;
                    left: 4px;
                    width: 12px;
                    height: 12px;
                    border-bottom: 2px solid #999;
                    border-left: 2px solid #999;
                }
                
                @media (prefers-color-scheme: dark) {
                    .fm-panel:not(.dark) {
                        background: #1c1c1e;
                    }
                    .fm-panel:not(.dark) .fm-messages {
                        background: #2c2c2e;
                    }
                    .fm-panel:not(.dark) .fm-message.received .fm-message-bubble {
                        background: #3a3a3c;
                        color: #fff;
                    }
                    .fm-panel:not(.dark) .fm-input-area {
                        background: #1c1c1e;
                        border-top-color: #3a3a3c;
                    }
                    .fm-panel:not(.dark) .fm-input {
                        background: #2c2c2e;
                        color: white;
                    }
                    .fm-panel:not(.dark) .fm-toolbar {
                        background: #2c2c2e;
                        border-top-color: #3a3a3c;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        createContainer() {
            this.container = document.createElement('div');
            this.container.className = 'fm-container hidden';
            this.container.innerHTML = `
                <div class="fm-ball" id="fm-ball">
                    <span class="fm-ball-icon">💬</span>
                </div>
                <div class="fm-panel" id="fm-panel">
                    <div class="fm-header" id="fm-header">
                        <img class="fm-header-avatar" id="fm-avatar" src="" alt="">
                        <div class="fm-header-info">
                            <div class="fm-header-name" id="fm-name">AI 助理</div>
                            <div class="fm-header-status">在線</div>
                        </div>
                        <div class="fm-header-actions">
                            <button class="fm-header-btn" id="fm-minimize" title="最小化">
                                <span style="font-size: 16px;">−</span>
                            </button>
                            <button class="fm-header-btn" id="fm-close" title="關閉">
                                <span style="font-size: 16px;">×</span>
                            </button>
                        </div>
                    </div>
                    <div class="fm-messages" id="fm-messages"></div>
                    <div class="fm-toolbar">
                        <button class="fm-toolbar-btn" id="fm-screenshot" title="截圖">
                            <span class="material-symbols-rounded" style="font-size: 20px;">photo_camera</span>
                        </button>
                        <button class="fm-toolbar-btn" id="fm-screenshare" title="螢幕分享">
                            <span class="material-symbols-rounded" style="font-size: 20px;">screen_share</span>
                        </button>
                    </div>
                    <div class="fm-input-area">
                        <input type="text" class="fm-input" id="fm-input" placeholder="輸入訊息...">
                        <button class="fm-send-btn" id="fm-send">
                            <span class="material-symbols-rounded" style="font-size: 20px;">send</span>
                        </button>
                    </div>
                    <div class="fm-resize-handle" id="fm-resize"></div>
                </div>
            `;
            
            const appendToBody = () => {
                if (document.body) {
                    document.body.appendChild(this.container);
                    
                    this.ball = document.getElementById('fm-ball');
                    this.panel = document.getElementById('fm-panel');
                    this.header = document.getElementById('fm-header');
                    this.messagesContainer = document.getElementById('fm-messages');
                    this.inputField = document.getElementById('fm-input');
                    
                    this.updatePosition();
                    this.updateCharacterInfo();
                    console.log('[DesktopFloatingWindow] 容器已創建並附加到 body');
                } else {
                    setTimeout(appendToBody, 100);
                }
            };
            
            appendToBody();
        }

        bindEvents() {
            this.ball.addEventListener('click', (e) => {
                if (!this.isDragging) {
                    this.togglePanel();
                }
            });
            
            document.getElementById('fm-close').addEventListener('click', () => {
                this.hide();
            });
            
            document.getElementById('fm-minimize').addEventListener('click', () => {
                this.minimize();
            });
            
            this.inputField.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendInputMessage();
                }
            });
            
            document.getElementById('fm-send').addEventListener('click', () => {
                this.sendInputMessage();
            });
            
            document.getElementById('fm-screenshot').addEventListener('click', () => {
                this.captureScreen();
            });
            
            document.getElementById('fm-screenshare').addEventListener('click', () => {
                this.core.startScreenShare();
            });
            
            this.bindDragEvents();
            this.bindResizeEvents();
            
            this.core.on('message_received', (msg) => {
                this.addMessage(msg.content, 'received');
            });
            
            this.core.on('character_updated', (data) => {
                this.updateCharacterInfo();
            });
        }

        bindDragEvents() {
            let startX, startY, startPosX, startPosY;
            let hasMoved = false;
            
            this.ball.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.isDragging = true;
                hasMoved = false;
                startX = e.clientX;
                startY = e.clientY;
                startPosX = this.core.position.x;
                startPosY = this.core.position.y;
                this.ball.style.cursor = 'grabbing';
            });
            
            document.addEventListener('mousemove', (e) => {
                if (!this.isDragging) return;
                
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                
                if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
                    hasMoved = true;
                }
                
                const newX = Math.max(0, Math.min(window.innerWidth - 56, startPosX + deltaX));
                const newY = Math.max(0, Math.min(window.innerHeight - 56, startPosY + deltaY));
                
                this.core.setPosition(newX, newY);
                this.updatePosition();
            });
            
            document.addEventListener('mouseup', () => {
                if (this.isDragging) {
                    this.isDragging = false;
                    this.ball.style.cursor = 'pointer';
                }
            });
            
            this.header.addEventListener('mousedown', (e) => {
                if (e.target.closest('.fm-header-btn')) return;
                
                e.preventDefault();
                this.isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                startPosX = this.core.position.x;
                startPosY = this.core.position.y;
            });
        }

        bindResizeEvents() {
            const resizeHandle = document.getElementById('fm-resize');
            
            resizeHandle.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.isResizing = true;
                this.resizeStart = {
                    x: e.clientX,
                    y: e.clientY,
                    width: this.panel.offsetWidth,
                    height: this.panel.offsetHeight
                };
            });
            
            document.addEventListener('mousemove', (e) => {
                if (!this.isResizing) return;
                
                const deltaX = this.resizeStart.x - e.clientX;
                const deltaY = this.resizeStart.y - e.clientY;
                
                const newWidth = Math.max(this.minWidth, Math.min(this.maxWidth, this.resizeStart.width + deltaX));
                const newHeight = Math.max(this.minHeight, Math.min(this.maxHeight, this.resizeStart.height + deltaY));
                
                this.panel.style.width = newWidth + 'px';
                this.panel.style.height = newHeight + 'px';
                
                this.core.setSize(newWidth, newHeight);
            });
            
            document.addEventListener('mouseup', () => {
                this.isResizing = false;
            });
        }

        updatePosition() {
            const pos = this.core.position;
            this.container.style.right = 'auto';
            this.container.style.bottom = 'auto';
            this.container.style.left = pos.x + 'px';
            this.container.style.top = pos.y + 'px';
        }

        updateCharacterInfo() {
            const info = this.core.getCharacterInfo();
            const nameEl = document.getElementById('fm-name');
            const avatarEl = document.getElementById('fm-avatar');
            
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
            
            if (!this.core.state.isMinimized) {
                this.expand();
            }
            
            this.loadRecentMessages();
        }

        hide() {
            this.container.classList.add('hidden');
            this.panel.classList.remove('visible');
            this.core.state.isOpen = false;
            this.core.state.isMinimized = true;
        }

        togglePanel() {
            if (this.panel.classList.contains('visible')) {
                this.minimize();
            } else {
                this.expand();
            }
        }

        minimize() {
            this.panel.classList.remove('visible');
            this.core.state.isMinimized = true;
            this.core.saveState();
        }

        expand() {
            this.panel.classList.add('visible');
            this.core.state.isMinimized = false;
            this.core.saveState();
            this.core.clearUnread();
            this.updateBadge();
            this.inputField.focus();
        }

        loadRecentMessages() {
            const session = this.core.getActiveSession();
            if (!session || !session.history) return;
            
            this.messagesContainer.innerHTML = '';
            
            const recentMessages = session.history.slice(-20);
            recentMessages.forEach(msg => {
                this.addMessage(msg.content, msg.role === 'user' ? 'sent' : 'received', false);
            });
            
            this.scrollToBottom();
        }

        addMessage(content, type = 'received', scroll = true) {
            const msgEl = document.createElement('div');
            msgEl.className = `fm-message ${type}`;
            
            const time = new Date().toLocaleTimeString('zh-TW', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            msgEl.innerHTML = `
                <div class="fm-message-bubble">${this.escapeHtml(content)}</div>
                <div class="fm-message-time">${time}</div>
            `;
            
            this.messagesContainer.appendChild(msgEl);
            
            if (scroll) {
                this.scrollToBottom();
            }
        }

        scrollToBottom() {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }

        sendInputMessage() {
            const message = this.inputField.value.trim();
            if (!message) return;
            
            this.addMessage(message, 'sent');
            this.inputField.value = '';
            
            this.core.sendMessage(message);
        }

        updateBadge() {
            let badge = this.ball.querySelector('.fm-ball-badge');
            const count = this.core.state.unreadCount;
            
            if (count > 0) {
                if (!badge) {
                    badge = document.createElement('div');
                    badge.className = 'fm-ball-badge';
                    this.ball.appendChild(badge);
                }
                badge.textContent = count > 99 ? '99+' : count;
            } else if (badge) {
                badge.remove();
            }
        }

        onMessage(message) {
            if (!this.core.state.isMinimized) {
                this.addMessage(message.content, 'received');
            }
            this.updateBadge();
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
                console.warn('[DesktopFloatingWindow] 截圖失敗:', err);
                return null;
            }
        }

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    }

    window.DesktopFloatingWindow = DesktopFloatingWindow;
})();
