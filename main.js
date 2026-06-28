(function() {
    // === iOS PWA 單例檢測機制 ===
    // 防止 iOS Safari 重複開啟 PWA 實例
    const PWA_SINGLETON_KEY = '__sxiphone_pwa_singleton';
    const PWA_INSTANCE_EXPIRY_KEY = '__sxiphone_pwa_singleton_expiry';
    const PWA_INSTANCE_ID = `instance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const SINGLETON_EXPIRY_MS = 5000; // 5 秒過期，避免舊標記阻止新啟動
    
    // 檢測是否為 iOS PWA 模式
    const isIOSPWA = (/iPad|iPhone|iPod/.test(navigator.userAgent) || 
                      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) &&
                      (window.matchMedia('(display-mode: standalone)').matches || 
                       window.navigator.standalone === true);
    
    // 記錄啟動資訊（診斷用）
    console.log('[PWA Singleton] 啟動時間:', new Date().toISOString());
    console.log('[PWA Singleton] 當前 URL:', window.location.href);
    console.log('[PWA Singleton] 是否為 iOS PWA:', isIOSPWA);
    console.log('[PWA Singleton] 實例 ID:', PWA_INSTANCE_ID);
    console.log('[PWA Singleton] Service Worker Controller:', navigator.serviceWorker?.controller ? '存在' : '不存在');
    
    // 清理過期的實例標記
    const cleanupExpiredInstance = () => {
        try {
            const expiry = sessionStorage.getItem(PWA_INSTANCE_EXPIRY_KEY);
            if (expiry) {
                const expiryTime = parseInt(expiry, 10);
                if (Date.now() - expiryTime > SINGLETON_EXPIRY_MS) {
                    console.log('[PWA Singleton] 發現過期標記，清理舊實例');
                    sessionStorage.removeItem(PWA_SINGLETON_KEY);
                    sessionStorage.removeItem(PWA_INSTANCE_EXPIRY_KEY);
                    return true;
                }
            }
        } catch (e) {
            console.warn('[PWA Singleton] 清理過期標記失敗:', e);
        }
        return false;
    };
    
    if (isIOSPWA) {
        // 先清理過期標記
        cleanupExpiredInstance();
        
        // 檢查是否已有運行中的實例
        const existingInstance = sessionStorage.getItem(PWA_SINGLETON_KEY);
        
        // 如果有現有實例，先檢查是否真的是另一個實例（不是自己）
        if (existingInstance && existingInstance !== PWA_INSTANCE_ID) {
            // 給予短暫的等待時間，讓舊實例有機會更新時間戳
            const expiry = sessionStorage.getItem(PWA_INSTANCE_EXPIRY_KEY);
            if (expiry) {
                const expiryTime = parseInt(expiry, 10);
                // 如果時間戳在 2 秒內更新過，表示舊實例還活著
                if (Date.now() - expiryTime < 2000) {
                    console.warn('[PWA Singleton] 檢測到活著的舊實例，跳過此次啟動');
                    // 不阻止執行，因為 iOS PWA 可能會在切換 app時觸發多次
                    // 只是記錄但不阻止，讓正常的 PWA 啟動流程繼續
                }
            }
        }
        
        // 記錄當前實例（無論是否有舊實例，都更新為當前）
        sessionStorage.setItem(PWA_SINGLETON_KEY, PWA_INSTANCE_ID);
        sessionStorage.setItem(PWA_INSTANCE_EXPIRY_KEY, Date.now().toString());
        window[PWA_SINGLETON_KEY] = PWA_INSTANCE_ID;
        
        // 定期更新時間戳，表示實例還活著（但在頁面隱藏時暫停以節省資源）
        let heartbeatInterval = null;
        let isHeartbeatActive = true;
        
        const startHeartbeat = () => {
            if (heartbeatInterval) return; // 避免重複啟動
            isHeartbeatActive = true;
            heartbeatInterval = setInterval(() => {
                // 只有在頁面可見時才更新時間戳
                if (document.visibilityState === 'visible') {
                    try {
                        const currentInstance = sessionStorage.getItem(PWA_SINGLETON_KEY);
                        if (currentInstance === PWA_INSTANCE_ID) {
                            sessionStorage.setItem(PWA_INSTANCE_EXPIRY_KEY, Date.now().toString());
                        }
                    } catch (e) {}
                }
            }, 2000); // 改為 2 秒，減少 CPU 使用
        };
        
        const stopHeartbeat = () => {
            if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
                heartbeatInterval = null;
            }
            isHeartbeatActive = false;
        };
        
        // 只在頁面可見時啟動心跳
        if (document.visibilityState === 'visible') {
            startHeartbeat();
        }
        
        // 監聽頁面卸載，清理標記（iOS 特殊處理）
        window.addEventListener('pagehide', (e) => {
            console.log('[PWA Singleton] pagehide - 清理單例標記');
            stopHeartbeat();
            try {
                const currentInstance = sessionStorage.getItem(PWA_SINGLETON_KEY);
                if (currentInstance === PWA_INSTANCE_ID) {
                    sessionStorage.removeItem(PWA_SINGLETON_KEY);
                    sessionStorage.removeItem(PWA_INSTANCE_EXPIRY_KEY);
                }
            } catch (e) {}
        });
        
        // visibilitychange 時確認實例狀態並控制心跳
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                try {
                    const currentInstance = sessionStorage.getItem(PWA_SINGLETON_KEY);
                    if (!currentInstance || currentInstance === PWA_INSTANCE_ID) {
                        sessionStorage.setItem(PWA_SINGLETON_KEY, PWA_INSTANCE_ID);
                        sessionStorage.setItem(PWA_INSTANCE_EXPIRY_KEY, Date.now().toString());
                        console.log('[PWA Singleton] visibilitychange visible - 更新實例標記');
                    }
                } catch (e) {}
                // 頁面可見時啟動心跳
                startHeartbeat();
            } else if (document.visibilityState === 'hidden') {
                // 頁面變隱藏時，停止心跳以節省資源
                stopHeartbeat();
                // 更新最後時間戳
                try {
                    const currentInstance = sessionStorage.getItem(PWA_SINGLETON_KEY);
                    if (currentInstance === PWA_INSTANCE_ID) {
                        sessionStorage.setItem(PWA_INSTANCE_EXPIRY_KEY, Date.now().toString());
                    }
                } catch (e) {}
            }
        });
        
        // iOS 特殊處理：beforeunload 時清理（雖然 iOS 可能不觸發）
        window.addEventListener('beforeunload', () => {
            stopHeartbeat();
            try {
                sessionStorage.removeItem(PWA_SINGLETON_KEY);
                sessionStorage.removeItem(PWA_INSTANCE_EXPIRY_KEY);
            } catch (e) {}
        });
    }
    
    window.addEventListener('error', (event) => {
        console.error('[Global Error]', event.message, event.filename, event.lineno);
        event.preventDefault();
    });
    
    window.addEventListener('unhandledrejection', (event) => {
        console.error('[Unhandled Rejection]', event.reason);
        event.preventDefault();
    });
    
    // --- iOS 記憶體壓力保護 ---
    const IOSMemoryProtection = {
        lastSaveTime: 0,
        saveThrottle: 2000,
        isSaving: false,
        
        shouldSave() {
            const now = Date.now();
            if (this.isSaving || (now - this.lastSaveTime) < this.saveThrottle) {
                return false;
            }
            return true;
        },
        
        markSaveStart() {
            this.isSaving = true;
            this.lastSaveTime = Date.now();
        },
        
        markSaveEnd() {
            this.isSaving = false;
        }
    };
    
    // --- 0. 瀏覽器兼容性檢測與修復 ---
    const BrowserCompat = {
        // 檢測瀏覽器類型
        detect() {
            const ua = navigator.userAgent;
            return {
                isIOS: /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
                isAndroid: /Android/i.test(ua),
                isChrome: /Chrome/i.test(ua) && /Google/i.test(ua),
                isEdge: /Edg/i.test(ua),
                isOpera: /OPR|Opera/i.test(ua),
                isVia: /Via/i.test(ua),
                isXBrowser: /XBrowser/i.test(ua),
                isSamsung: /SamsungBrowser/i.test(ua),
                isFirefox: /Firefox/i.test(ua),
                isUCBrowser: /UCBrowser/i.test(ua),
                isQQBrowser: /QQBrowser/i.test(ua),
                isYujian: /Yujian|雨見|YuJian/i.test(ua),
                isSafari: /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua),
                isMobile: /Mobi|Android|iPhone|iPad|iPod/i.test(ua),
                isTablet: /Tablet|iPad/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
            };
        },

        // 應用瀏覽器特定的修復
        applyFixes() {
            const browser = this.detect();
            const root = document.documentElement;
            
            // 添加瀏覽器類別到 html 元素
            if (browser.isIOS) root.classList.add('browser-ios');
            if (browser.isAndroid) root.classList.add('browser-android');
            if (browser.isChrome) root.classList.add('browser-chrome');
            if (browser.isEdge) root.classList.add('browser-edge');
            if (browser.isOpera) root.classList.add('browser-opera');
            if (browser.isVia) root.classList.add('browser-via');
            if (browser.isXBrowser) root.classList.add('browser-xbrowser');
            if (browser.isSamsung) root.classList.add('browser-samsung');
            if (browser.isFirefox) root.classList.add('browser-firefox');
            if (browser.isUCBrowser) root.classList.add('browser-uc');
            if (browser.isQQBrowser) root.classList.add('browser-qq');
            if (browser.isYujian) root.classList.add('browser-yujian');
            if (browser.isMobile) root.classList.add('device-mobile');
            if (browser.isTablet) root.classList.add('device-tablet');

            // Via 瀏覽器特殊處理
            if (browser.isVia) {
                console.log('[BrowserCompat] Via 瀏覽器檢測到，應用特殊修復');
                // Via 瀏覽器可能需要強制啟用觸控事件
                root.style.setProperty('--via-touch-fix', '1');
            }

            // X瀏覽器特殊處理
            if (browser.isXBrowser) {
                console.log('[BrowserCompat] X瀏覽器檢測到，應用特殊修復');
                root.style.setProperty('--xbrowser-fix', '1');
            }

            // 雨見瀏覽器特殊處理
            if (browser.isYujian) {
                console.log('[BrowserCompat] 雨見瀏覽器檢測到，應用特殊修復');
                root.style.setProperty('--yujian-fix', '1');
                // 雨見瀏覽器可能需要特殊的觸控事件處理
                root.style.setProperty('--touch-action-fix', 'manipulation');
            }

            // Firefox 瀏覽器特殊處理
            if (browser.isFirefox) {
                console.log('[BrowserCompat] Firefox 瀏覽器檢測到，應用特殊修復');
                root.style.setProperty('--firefox-fix', '1');
                // Firefox 對 backdrop-filter 支援較晚，可能需要替代方案
                root.style.setProperty('--backdrop-filter-support', 'check');
            }

            // Edge 瀏覽器特殊處理
            if (browser.isEdge) {
                console.log('[BrowserCompat] Edge 瀏覽器檢測到');
            }

            // Opera 瀏覽器特殊處理
            if (browser.isOpera) {
                console.log('[BrowserCompat] Opera 瀏覽器檢測到');
            }

            // 通用移動瀏覽器修復
            if (browser.isMobile) {
                // 防止雙擊縮放
                document.addEventListener('touchstart', (e) => {
                    if (e.touches.length > 1) {
                        e.preventDefault();
                    }
                }, { passive: false });
                
                // 防止雙指縮放
                document.addEventListener('gesturestart', (e) => {
                    e.preventDefault();
                }, { passive: false });
            }

            console.log('[BrowserCompat] 瀏覽器檢測結果:', browser);
            return browser;
        },

        requestFullscreen(element = document.documentElement) {
            const browser = this.detect();
            
            if (browser.isAndroid && browser.isChrome) {
                const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                              window.matchMedia('(display-mode: fullscreen)').matches;
                if (!isPWA) {
                    this.showAndroidFullscreenTip();
                    return Promise.reject(new Error('Android Chrome 需要安裝 PWA'));
                }
            }
            
            let requestMethod = null;
            if (element.requestFullscreen) {
                requestMethod = element.requestFullscreen.bind(element);
            } else if (element.webkitRequestFullscreen) {
                requestMethod = element.webkitRequestFullscreen.bind(element);
            } else if (element.webkitRequestFullScreen) {
                requestMethod = element.webkitRequestFullScreen.bind(element);
            } else if (element.mozRequestFullScreen) {
                requestMethod = element.mozRequestFullScreen.bind(element);
            } else if (element.msRequestFullscreen) {
                requestMethod = element.msRequestFullscreen.bind(element);
            }

            if (requestMethod) {
                localStorage.setItem('sx_fullscreen_preferred', 'true');
                return requestMethod().catch(err => {
                    console.warn('[BrowserCompat] 全螢幕請求失敗:', err);
                    localStorage.removeItem('sx_fullscreen_preferred');
                    if (browser.isIOS && browser.isSafari) {
                        this.showIOSFullscreenTip();
                    }
                    if (browser.isAndroid && browser.isChrome) {
                        this.showAndroidFullscreenTip();
                    }
                    return Promise.reject(err);
                });
            }

            if (browser.isIOS) {
                this.showIOSFullscreenTip();
            }
            if (browser.isAndroid && browser.isChrome) {
                this.showAndroidFullscreenTip();
            }
            return Promise.reject(new Error('不支援全螢幕 API'));
        },

        exitFullscreen() {
            localStorage.removeItem('sx_fullscreen_preferred');
            if (document.exitFullscreen) {
                return document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                return document.webkitExitFullscreen();
            } else if (document.webkitCancelFullScreen) {
                return document.webkitCancelFullScreen();
            } else if (document.mozCancelFullScreen) {
                return document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                return document.msExitFullscreen();
            }
            return Promise.reject(new Error('不支援退出全螢幕 API'));
        },

        isFullscreen() {
            return !!(document.fullscreenElement || document.webkitFullscreenElement || 
                      document.webkitCurrentFullScreenElement || document.mozFullScreenElement || 
                      document.msFullscreenElement);
        },

        showIOSFullscreenTip() {
            const tip = document.createElement('div');
            tip.className = 'ios-fullscreen-tip';
            tip.innerHTML = `
                <div class="ios-fullscreen-content">
                    <h3>📱 iOS 全螢幕提示</h3>
                    <p>請將網站加入主畫面以獲得最佳全螢幕體驗：</p>
                    <ol>
                        <li>點擊 Safari 底部的「分享」按鈕 <span style="font-size:16px;">⬆️</span></li>
                        <li>選擇「加入主畫面」</li>
                        <li>從主畫面開啟此 App</li>
                    </ol>
                    <button class="ios-fullscreen-close">知道了</button>
                </div>
            `;
            tip.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.85);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 999999;
                padding: 20px;
            `;
            const content = tip.querySelector('.ios-fullscreen-content');
            content.style.cssText = `
                background: #1c1c1e;
                border-radius: 16px;
                padding: 24px;
                max-width: 320px;
                color: white;
                text-align: left;
            `;
            const closeBtn = tip.querySelector('.ios-fullscreen-close');
            closeBtn.style.cssText = `
                margin-top: 16px;
                padding: 10px 24px;
                background: #0a84ff;
                border: none;
                border-radius: 8px;
                color: white;
                font-size: 16px;
                cursor: pointer;
                width: 100%;
            `;
            closeBtn.onclick = () => tip.remove();
            document.body.appendChild(tip);
        },

        showAndroidFullscreenTip() {
            const tip = document.createElement('div');
            tip.className = 'android-fullscreen-tip';
            tip.innerHTML = `
                <div class="android-fullscreen-content">
                    <h3>📱 Android 全螢幕提示</h3>
                    <p>Android Chrome 不支援網頁全螢幕 API，請安裝 PWA 以獲得最佳體驗：</p>
                    <ol>
                        <li>點擊 Chrome 右上角的「⋮」選單</li>
                        <li>選擇「安裝應用」或「添加到主屏幕」</li>
                        <li>從主屏幕開啟此 App</li>
                    </ol>
                    <p style="margin-top:12px;font-size:13px;opacity:0.8;">💡 安裝後將自動以全螢幕模式運行</p>
                    <button class="android-fullscreen-close">知道了</button>
                </div>
            `;
            tip.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.85);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 999999;
                padding: 20px;
            `;
            const content = tip.querySelector('.android-fullscreen-content');
            content.style.cssText = `
                background: #1c1c1e;
                border-radius: 16px;
                padding: 24px;
                max-width: 340px;
                color: white;
                text-align: left;
            `;
            const closeBtn = tip.querySelector('.android-fullscreen-close');
            closeBtn.style.cssText = `
                margin-top: 16px;
                padding: 10px 24px;
                background: #0a84ff;
                border: none;
                border-radius: 8px;
                color: white;
                font-size: 16px;
                cursor: pointer;
                width: 100%;
            `;
            closeBtn.onclick = () => tip.remove();
            document.body.appendChild(tip);
        },

        toggleFullscreen(element = document.documentElement) {
            if (this.isFullscreen()) {
                return this.exitFullscreen();
            } else {
                return this.requestFullscreen(element);
            }
        },

        onFullscreenChange(callback) {
            const events = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
            events.forEach(event => {
                document.addEventListener(event, callback);
            });
        },

        setupFullscreenPersistence() {
            const events = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
            events.forEach(event => {
                document.addEventListener(event, () => {
                    const isFs = this.isFullscreen();
                    if (!isFs) {
                        const preferred = localStorage.getItem('sx_fullscreen_preferred');
                        if (preferred === 'true') {
                            setTimeout(() => {
                                if (!this.isFullscreen()) {
                                    localStorage.removeItem('sx_fullscreen_preferred');
                                }
                            }, 1000);
                        }
                    }
                });
            });
        },

        isPWA() {
            return window.matchMedia('(display-mode: standalone)').matches ||
                   window.matchMedia('(display-mode: fullscreen)').matches ||
                   window.matchMedia('(display-mode: minimal-ui)').matches ||
                   window.navigator.standalone === true;
        },

        isAndroidWebAppShortcut() {
            const browser = this.detect();
            if (!browser.isAndroid) return false;
            
            const isPWA = this.isPWA();
            if (isPWA) return false;
            
            const referrer = document.referrer || '';
            const isFromHomescreen = referrer === '' || 
                                     referrer.includes('android-app://') ||
                                     window.performance?.navigation?.type === 0;
            
            const hasStandaloneDisplay = window.outerHeight > window.innerHeight * 0.9;
            
            return isFromHomescreen || hasStandaloneDisplay;
        },

        hideAndroidAddressBar() {
            const browser = this.detect();
            if (!browser.isAndroid) return;

            const isPWA = this.isPWA();
            if (isPWA) {
                console.log('[BrowserCompat] Android PWA 模式，網址列已隱藏');
                return;
            }

            const hideUrlBar = () => {
                const scrollToHide = () => {
                    if (document.body.scrollTop === 0 && document.documentElement.scrollTop === 0) {
                        window.scrollTo(0, 1);
                        setTimeout(() => {
                            if (document.body.scrollTop === 1 || document.documentElement.scrollTop === 1) {
                                window.scrollTo(0, 0);
                            }
                        }, 100);
                    }
                };

                if (document.readyState === 'complete') {
                    scrollToHide();
                } else {
                    window.addEventListener('load', scrollToHide);
                }
            };

            const attemptHide = () => {
                const viewportHeight = window.innerHeight;
                const screenHeight = window.screen.height;
                const urlBarHeight = screenHeight - viewportHeight;

                if (urlBarHeight > 50 && urlBarHeight < 150) {
                    console.log('[BrowserCompat] 檢測到 Android 網址列，嘗試隱藏');
                    hideUrlBar();
                }
            };

            attemptHide();

            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(attemptHide, 100);
            });

            window.addEventListener('orientationchange', () => {
                setTimeout(attemptHide, 300);
            });

            document.addEventListener('touchstart', () => {
                if (document.body.scrollTop === 0 && document.documentElement.scrollTop === 0) {
                    window.scrollTo(0, 1);
                }
            }, { passive: true, once: true });

            console.log('[BrowserCompat] Android 網址列隱藏功能已啟用');
        },

        setupAndroidUrlBarHiding() {
            const browser = this.detect();
            if (!browser.isAndroid) return;

            const isPWA = this.isPWA();
            
            if (isPWA) {
                console.log('[BrowserCompat] Android PWA 模式，無需隱藏網址列');
                document.body.classList.add('pwa-mode');
                return;
            }

            this.hideAndroidAddressBar();
            document.body.classList.add('android-browser-mode');

            const showInstallTip = () => {
                const dismissed = localStorage.getItem('sx_android_install_tip_dismissed');
                if (dismissed) {
                    const dismissedTime = parseInt(dismissed);
                    if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
                        return;
                    }
                }

                const tip = document.createElement('div');
                tip.id = 'android-install-tip';
                tip.innerHTML = `
                    <div class="tip-content">
                        <div class="tip-header">
                            <span class="tip-icon">📱</span>
                            <span class="tip-title">安裝應用獲得最佳體驗</span>
                        </div>
                        <p class="tip-desc">安裝後將隱藏網址列，獲得全螢幕體驗</p>
                        <div class="tip-steps">
                            <span>1. 點擊瀏覽器選單 <strong>⋮</strong></span>
                            <span>2. 選擇「安裝應用」或「添加到主屏幕」</span>
                        </div>
                        <div class="tip-actions">
                            <button class="tip-dismiss">不再提示</button>
                            <button class="tip-close">關閉</button>
                        </div>
                    </div>
                `;
                tip.style.cssText = `
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 999999;
                    max-width: 90%;
                    width: 360px;
                `;
                const content = tip.querySelector('.tip-content');
                content.style.cssText = `
                    background: linear-gradient(135deg, #1a1a2e, #16213e);
                    border-radius: 16px;
                    padding: 16px;
                    color: white;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                `;
                const header = tip.querySelector('.tip-header');
                header.style.cssText = `
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 8px;
                `;
                const icon = tip.querySelector('.tip-icon');
                icon.style.cssText = `font-size: 20px;`;
                const title = tip.querySelector('.tip-title');
                title.style.cssText = `font-weight: 600; font-size: 15px;`;
                const desc = tip.querySelector('.tip-desc');
                desc.style.cssText = `font-size: 13px; opacity: 0.8; margin: 0 0 10px;`;
                const steps = tip.querySelector('.tip-steps');
                steps.style.cssText = `
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    font-size: 12px;
                    opacity: 0.9;
                    background: rgba(255,255,255,0.1);
                    padding: 10px;
                    border-radius: 8px;
                    margin-bottom: 12px;
                `;
                const actions = tip.querySelector('.tip-actions');
                actions.style.cssText = `display: flex; gap: 8px;`;
                
                const dismissBtn = tip.querySelector('.tip-dismiss');
                dismissBtn.style.cssText = `
                    flex: 1;
                    padding: 8px 12px;
                    background: rgba(255,255,255,0.1);
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-size: 13px;
                    cursor: pointer;
                `;
                dismissBtn.onclick = () => {
                    localStorage.setItem('sx_android_install_tip_dismissed', Date.now().toString());
                    tip.remove();
                };

                const closeBtn = tip.querySelector('.tip-close');
                closeBtn.style.cssText = `
                    flex: 1;
                    padding: 8px 12px;
                    background: #0a84ff;
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-size: 13px;
                    cursor: pointer;
                `;
                closeBtn.onclick = () => tip.remove();

                document.body.appendChild(tip);

                setTimeout(() => {
                    if (tip.parentNode) tip.remove();
                }, 15000);
            };

            setTimeout(showInstallTip, 3000);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            BrowserCompat.applyFixes();
            BrowserCompat.setupFullscreenPersistence();
            BrowserCompat.setupAndroidUrlBarHiding();
        });
    } else {
        BrowserCompat.applyFixes();
        BrowserCompat.setupFullscreenPersistence();
        BrowserCompat.setupAndroidUrlBarHiding();
    }

    window.SxBrowserCompat = BrowserCompat;

    // --- PWA 動態 Manifest 管理 ---
    const PWA_MANIFEST_KEY = 'sx_pwa_manifest_config';
    const PWA_ICON_KEY = 'sx_pwa_custom_icon';

    // 生成動態 manifest Blob URL
    const generateDynamicManifest = () => {
        // iOS PWA 重要：使用絕對路徑確保 URL 一致性
        // 避免相對路徑導致 iOS Safari 誤判為不同實例
        const baseOrigin = window.location.origin;
        const basePath = baseOrigin + window.location.pathname.replace(/\/[^\/]*$/, '/');
        
        const defaultManifest = {
            name: "sxiphone",
            short_name: "sxiphone",
            // iOS PWA: start_url 必須與 scope 一致，且使用絕對路徑
            start_url: baseOrigin + "/",
            scope: baseOrigin + "/",
            display: "standalone",
            display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
            orientation: "portrait",
            background_color: "#0b0c12",
            theme_color: "#0b0c12",
            description: "iOS 風格的手機介面模擬器",
            categories: ["entertainment", "utilities"],
            lang: "zh-TW",
            id: "sxiphone-pwa"
        };

        try {
            const savedConfig = localStorage.getItem(PWA_MANIFEST_KEY);
            const savedIcon = localStorage.getItem(PWA_ICON_KEY);
            
            const config = savedConfig ? JSON.parse(savedConfig) : {};
            
            const manifest = {
                ...defaultManifest,
                name: config.name || defaultManifest.name,
                short_name: config.short_name || config.name || defaultManifest.short_name,
                background_color: config.background_color || defaultManifest.background_color,
                theme_color: config.theme_color || defaultManifest.theme_color,
                // 確保 start_url 和 scope 保持一致
                start_url: defaultManifest.start_url,
                scope: defaultManifest.scope
            };

            // 如果有自訂圖標，使用 data URL 或圖床 URL
            if (savedIcon) {
                manifest.icons = [
                    {
                        src: savedIcon,
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "any"
                    },
                    {
                        src: savedIcon,
                        sizes: "192x192",
                        type: "image/png",
                        purpose: "any"
                    },
                    {
                        src: savedIcon,
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "maskable"
                    }
                ];
            } else {
                // 使用預設圖標
                manifest.icons = [
                    {
                        src: basePath + "apps/screenshots/current.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "any"
                    },
                    {
                        src: basePath + "apps/screenshots/icon-192x192.png",
                        sizes: "192x192",
                        type: "image/png",
                        purpose: "any"
                    },
                    {
                        src: basePath + "apps/screenshots/current.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "maskable"
                    }
                ];
            }

            // 添加 shortcuts - 使用統一的 URL 格式
            manifest.shortcuts = [
                {
                    name: "聊天",
                    short_name: "聊天",
                    description: "開啟聊天應用",
                    url: baseOrigin + "/?app=chat",
                    icons: [{ src: savedIcon || (basePath + "apps/screenshots/icon-192x192.png"), sizes: "192x192" }]
                },
                {
                    name: "設定",
                    short_name: "設定",
                    description: "開啟設定",
                    url: baseOrigin + "/?app=settings",
                    icons: [{ src: savedIcon || (basePath + "apps/screenshots/icon-192x192.png"), sizes: "192x192" }]
                }
            ];

            // 添加 screenshots
            manifest.screenshots = [
                {
                    src: savedIcon || (basePath + "apps/screenshots/current.png"),
                    sizes: "512x512",
                    type: "image/png"
                }
            ];

            return manifest;
        } catch (e) {
            console.warn('[PWA] 生成 manifest 失敗:', e);
            return defaultManifest;
        }
    };

    // 更新 manifest link
    const updateManifestLink = () => {
        const manifest = generateDynamicManifest();
        const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
        const blobUrl = URL.createObjectURL(blob);

        // 移除舊的 manifest link
        const oldLink = document.querySelector('link[rel="manifest"]');
        if (oldLink) {
            // 釋放舊的 Blob URL
            if (oldLink.href.startsWith('blob:')) {
                URL.revokeObjectURL(oldLink.href);
            }
            oldLink.remove();
        }

        // 添加新的 manifest link
        const newLink = document.createElement('link');
        newLink.rel = 'manifest';
        newLink.href = blobUrl;
        document.head.appendChild(newLink);

        // 同步更新 theme-color meta
        const themeColorMeta = document.getElementById('theme-color-meta');
        if (themeColorMeta) {
            themeColorMeta.content = manifest.theme_color;
        }

        // 同步更新 apple-mobile-web-app-title
        const appleTitle = document.getElementById('apple-web-app-title');
        if (appleTitle) {
            appleTitle.content = manifest.name;
        }

        // 同步更新 apple-touch-icon（如果有自訂圖標）
        const savedIcon = localStorage.getItem(PWA_ICON_KEY);
        if (savedIcon) {
            const appleTouchIcon = document.getElementById('apple-touch-icon');
            if (appleTouchIcon) {
                appleTouchIcon.href = savedIcon;
            }
        }

        console.log('[PWA] Manifest 已更新:', manifest.name);
        
        return blobUrl;
    };

    // 監聽來自 appearance 應用的 manifest 更新訊息
    window.addEventListener('message', (event) => {
        if (event.data?.type === 'PWA_MANIFEST_UPDATE') {
            console.log('[PWA] 收到 manifest 更新請求');
            updateManifestLink();
        } else if (event.data?.type === 'PWA_MANIFEST_RESET') {
            console.log('[PWA] 收到 manifest 重置請求');
            updateManifestLink();
        } else if (event.data?.type === 'TRIGGER_GITHUB_SYNC') {
            const token = localStorage.getItem('sx_github_token');
            const username = localStorage.getItem('sx_github_user');
            if (token && username && typeof window.syncToGitHub === 'function') {
                window.syncToGitHub().then(() => {
                    console.log('[PWA] 已同步到 GitHub');
                }).catch((err) => {
                    console.warn('[PWA] GitHub 同步失敗:', err);
                });
            }
        } else if (event.data?.type === 'TOGGLE_FULLSCREEN') {
            if (window.SxBrowserCompat) {
                window.SxBrowserCompat.toggleFullscreen().catch(() => {});
            }
        }
    });

    // 頁面載入時檢查是否有自訂 manifest
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            const savedConfig = localStorage.getItem(PWA_MANIFEST_KEY);
            const savedIcon = localStorage.getItem(PWA_ICON_KEY);
            if (savedConfig || savedIcon) {
                updateManifestLink();
            }
        });
    } else {
        const savedConfig = localStorage.getItem(PWA_MANIFEST_KEY);
        const savedIcon = localStorage.getItem(PWA_ICON_KEY);
        if (savedConfig || savedIcon) {
            updateManifestLink();
        }
    }

    // 暴露給全域使用
    window.updatePWAManifest = updateManifestLink;

    // --- 1. Firebase 初始化 ---
    const firebaseConfig = {
        apiKey: "AIzaSyDrzRFOrPWT1BeZIEv7ERX4DGlJWIMCEng",
        authDomain: "sxiphonecode.firebaseapp.com",
        databaseURL: "https://sxiphonecode-default-rtdb.firebaseio.com/",
        projectId: "sxiphonecode",
        storageBucket: "sxiphonecode.firebasestorage.app",
        messagingSenderId: "132296470524",
        appId: "1:132296470524:web:13e208213f4e9362d30c79"
    };

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const database = firebase.database();

    // --- 2. 語系資料 ---
    const langData = {
        'zh-Hant': { month: 'long', day: 'numeric', weekday: 'long', unlock: '向上滑動以解鎖' },
        'zh-Hans': { month: 'long', day: 'numeric', weekday: 'long', unlock: '向上滑动以解锁' },
        'en-US': { month: 'short', day: 'numeric', weekday: 'short', unlock: 'Swipe up to unlock' },
        'ja-JP': { month: 'long', day: 'numeric', weekday: 'short', unlock: '上にスワイプして解除' },
        'ko-KR': { month: 'long', day: 'numeric', weekday: 'long', unlock: '위로 쓸어올려서 잠금 해제' }
    };

    const languageAliasMap = {
        'zh-TW': 'zh-Hant',
        'zh-HK': 'zh-Hant',
        'zh-MO': 'zh-Hant',
        'zh-CN': 'zh-Hans',
        'zh-SG': 'zh-Hans'
    };

    const appLabelData = {
        'zh-Hant': {
            chat: '聊天', settings: '設定', album: '相簿', touch: '輔助觸控', worldbook: '世界書', pomodoro: '番茄鐘',
            weather: '天氣', twitter: '推特', facebook: '臉書', chrome: 'Chrome', bilibili: 'bilibili', youtube: 'YouTube',
            'exchange-diary': '交換日記', lofter: 'lofter', 'drift-bottle': '漂流瓶', 'match-3': '消消樂', bubbles: 'bubbles',
            weverse: 'weverse', 'daily-recipe': '每日食譜', music: '音樂', delivery: '外送', taobao: '購物', dating: '約會', farm: '農場',
            'guzi-guide': '谷子圖鑒', 'smart-painter': '照相館', instagram: 'Instagram', timetree: 'timetree', pub: '酒館',
            kakaopay: 'kakaopay', widget: 'widget', twitch: 'twitch', appearance: '外觀', ao3: 'AO3', phone: '電話', passkey: 'Passkey', theater: '劇場', arcade: '街機廳', 'personal-wiki': '個人紀錄'
        },
        'zh-Hans': {
            chat: '聊天', settings: '设置', album: '相册', touch: '辅助触控', worldbook: '世界书', pomodoro: '番茄钟',
            weather: '天气', twitter: '推特', facebook: '脸书', chrome: 'Chrome', bilibili: 'bilibili', youtube: 'YouTube',
            'exchange-diary': '交换日记', lofter: 'lofter', 'drift-bottle': '漂流瓶', 'match-3': '消消乐', bubbles: 'bubbles',
            weverse: 'weverse', 'daily-recipe': '每日食谱', music: '音乐', delivery: '外送', taobao: '淘宝', dating: '约会', farm: '农场',
            'guzi-guide': '谷子图鉴', 'smart-painter': '智画师', instagram: 'Instagram', timetree: 'timetree', pub: '酒馆',
            kakaopay: 'kakaopay', widget: 'widget', twitch: 'twitch', appearance: '外观', ao3: 'AO3', phone: '电话', passkey: 'Passkey', theater: '剧场', arcade: '街机厅', 'personal-wiki': '个人纪录'
        },
        'en-US': {
            chat: 'Chat', settings: 'Settings', album: 'Album', touch: 'AssistiveTouch', worldbook: 'Worldbook', pomodoro: 'Pomodoro',
            weather: 'Weather', twitter: 'Twitter', facebook: 'Facebook', chrome: 'Chrome', bilibili: 'bilibili', youtube: 'YouTube',
            'exchange-diary': 'Diary', lofter: 'lofter', 'drift-bottle': 'Drift Bottle', 'match-3': 'Match 3', bubbles: 'bubbles',
            weverse: 'weverse', 'daily-recipe': 'Recipes', music: 'Music', delivery: 'Delivery', taobao: 'Taobao', dating: 'Dating', farm: 'Farm',
            'guzi-guide': 'Guzi Guide', 'smart-painter': 'Smart Painter', instagram: 'Instagram', timetree: 'timetree', pub: 'Pub',
            kakaopay: 'kakaopay', widget: 'widget', twitch: 'twitch', appearance: 'Appearance', ao3: 'AO3', phone: 'Phone', passkey: 'Passkey', theater: 'Theater', arcade: 'Arcade', 'personal-wiki': 'Personal Wiki'
        },
        'ja-JP': {
            chat: 'チャット', settings: '設定', album: 'アルバム', touch: 'AssistiveTouch', worldbook: 'ワールドブック', pomodoro: 'ポモドーロ',
            weather: '天気', twitter: 'Twitter', facebook: 'Facebook', chrome: 'Chrome', bilibili: 'bilibili', youtube: 'YouTube',
            'exchange-diary': '交換日記', lofter: 'lofter', 'drift-bottle': '漂流ボトル', 'match-3': 'マッチ3', bubbles: 'bubbles',
            weverse: 'weverse', 'daily-recipe': '毎日のレシピ', music: '音楽', delivery: 'デリバリー', taobao: 'Taobao', dating: 'デート', farm: '農場',
            'guzi-guide': 'グッズ図鑑', 'smart-painter': 'スマート絵師', instagram: 'Instagram', timetree: 'timetree', pub: '酒場',
            kakaopay: 'kakaopay', widget: 'widget', twitch: 'twitch', appearance: '外観', ao3: 'AO3', phone: '電話', passkey: 'Passkey', theater: '劇場', arcade: 'アーケード', 'personal-wiki': '個人記録'
        },
        'ko-KR': {
            chat: '채팅', settings: '설정', album: '앨범', touch: '보조 터치', worldbook: '월드북', pomodoro: '포모도로',
            weather: '날씨', twitter: '트위터', facebook: '페이스북', chrome: 'Chrome', bilibili: 'bilibili', youtube: 'YouTube',
            'exchange-diary': '교환 일기', lofter: 'lofter', 'drift-bottle': '표류병', 'match-3': '매치3', bubbles: 'bubbles',
            weverse: 'weverse', 'daily-recipe': '오늘의 레시피', music: '음악', delivery: '배달', taobao: 'Taobao', dating: '데이트', farm: '농장',
            'guzi-guide': '구즈 가이드', 'smart-painter': '스마트 페인터', instagram: 'Instagram', timetree: 'timetree', pub: '펍',
            kakaopay: 'kakaopay', widget: 'widget', twitch: 'twitch', appearance: '외관', ao3: 'AO3', phone: '전화', passkey: 'Passkey', theater: '극장', arcade: '오락실', 'personal-wiki': '개인 기록'
        }
    };

    const normalizeLang = (rawLang) => {
        const normalized = languageAliasMap[rawLang] || rawLang;
        return langData[normalized] ? normalized : 'zh-Hant';
    };

    const getCurrentLang = () => normalizeLang(localStorage.getItem('sxiphone_lang') || 'zh-Hant');

    const getAIReadableLangName = (lang) => {
        const names = {
            'zh-Hant': '繁體中文',
            'zh-Hans': '简体中文',
            'zh-TW': '繁體中文',
            'zh-CN': '简体中文',
            'en-US': 'English',
            'ja-JP': '日本語',
            'ko-KR': '한국어'
        };
        return names[lang] || '繁體中文';
    };

    const getLocaleStringLang = (lang) => {
        const map = {
            'zh-Hant': 'zh-TW',
            'zh-Hans': 'zh-CN'
        };
        return map[lang] || lang;
    };

    window.getAIReadableLangName = getAIReadableLangName;
    window.getLocaleStringLang = getLocaleStringLang;

    // --- 3. 系統核心功能 (時間) ---
    function updateClock() {
        const lang = getCurrentLang();
        const now = new Date();
        const timeStr = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
        
        const timeEl = document.getElementById('time');
        const statusTimeEl = document.getElementById('status-time');
        const dateEl = document.getElementById('date');
        const unlockText = document.getElementById('unlock-text');

        if(timeEl) timeEl.innerText = timeStr;
        if(statusTimeEl) statusTimeEl.innerText = timeStr;
        if(dateEl && langData[lang]) {
            dateEl.innerText = now.toLocaleDateString(lang, { 
                month: langData[lang].month, 
                day: langData[lang].day, 
                weekday: langData[lang].weekday 
            });
        }
        if(unlockText && langData[lang]) {
            unlockText.innerText = langData[lang].unlock;
        }
    }

    function applyLanguageToUI() {
        const lang = getCurrentLang();
        localStorage.setItem('sxiphone_lang', lang);
        document.documentElement.lang = lang;

        const labels = appLabelData[lang] || appLabelData['zh-Hant'];
        document.querySelectorAll('.app-icon').forEach((icon) => {
            const appId = getAppIdFromNode(icon);
            if (!appId) return;
            const labelEl = icon.querySelector('.app-label');
            if (!labelEl) return;
            if (!labelEl.dataset.defaultLabel) {
                labelEl.dataset.defaultLabel = labelEl.textContent || '';
            }
            labelEl.textContent = labels[appId] || labelEl.dataset.defaultLabel;
        });

        updateClock();

        const frame = document.getElementById('app-frame');
        syncLanguageToFrame(frame, lang);
        
        window.dispatchEvent(new CustomEvent('sx-language-changed', { detail: { lang } }));
    }

    // --- 4. 桌布套用函式（自動上傳圖床） ---
    function applyWallpaper(url) {
        if (!url) return;
        const formattedUrl = url.startsWith('url(') ? url : `url('${url}')`;
        document.documentElement.style.setProperty('--wallpaper-url', formattedUrl);

        // 嘗試上傳圖床（base64 → URL），成功則回填 URL
        if (typeof ImageUploader !== 'undefined' && ImageUploader.isBase64(url)) {
            ImageUploader.uploadOrKeep(url).then(finalUrl => {
                if (finalUrl !== url) {
                    // 上傳成功，用 URL 取代 base64
                    const fmt = `url('${finalUrl}')`;
                    document.documentElement.style.setProperty('--wallpaper-url', fmt);
                    localStorage.setItem('userWallpaper', finalUrl);
                    console.info('[Wallpaper] base64 已上傳圖床:', finalUrl);
                } else {
                    localStorage.setItem('userWallpaper', url);
                }
            });
        } else {
            localStorage.setItem('userWallpaper', url);
        }
        console.log("✅ 桌布已更新並儲存");
    }

    function applyLockscreen(url) {
        if (!url) return;
        const formattedUrl = url.startsWith('url(') ? url : `url('${url}')`;
        document.documentElement.style.setProperty('--lockscreen-url', formattedUrl);

        if (typeof ImageUploader !== 'undefined' && ImageUploader.isBase64(url)) {
            ImageUploader.uploadOrKeep(url).then(finalUrl => {
                if (finalUrl !== url) {
                    const fmt = `url('${finalUrl}')`;
                    document.documentElement.style.setProperty('--lockscreen-url', fmt);
                    localStorage.setItem('userLockscreen', finalUrl);
                    console.info('[Lockscreen] base64 已上傳圖床:', finalUrl);
                } else {
                    localStorage.setItem('userLockscreen', url);
                }
            });
        } else {
            localStorage.setItem('userLockscreen', url);
        }
        console.log("✅ 鎖屏桌布已更新並儲存");
    }

    const THEME_MODE_KEY = 'sx_theme_mode';
    const THEME_ACCENT_KEY = 'sx_theme_accent';
    const THEME_TEXT_KEY = 'sx_theme_text_color';
    const THEME_ICON_BORDER_KEY = 'sx_theme_icon_border_color';
    const THEME_APP_BG_KEY = 'sx_theme_app_bg_color';
    const THEME_APP_BG_ALPHA_KEY = 'sx_theme_app_bg_alpha';

    const PHONE_CHECK_KEY = 'sx_phone_check_enabled';
    const PHONE_CHECK_MIN_DELAY_KEY = 'sx_phone_check_min_delay';
    const PHONE_CHECK_MAX_DELAY_KEY = 'sx_phone_check_max_delay';
    const PHONE_CHECK_MIN_DURATION_KEY = 'sx_phone_check_min_duration';
    const PHONE_CHECK_MAX_DURATION_KEY = 'sx_phone_check_max_duration';
    const PHONE_CHECK_SWITCH_MIN = 8000;
    const PHONE_CHECK_SWITCH_MAX = 18000;

    const CUSTOM_ICON_KEY = 'sx_custom_icons';

    const APP_FOLDER_PREFIX = 'sx_app_';
    const APP_FOLDER_SUFFIX = '_folder';
    let currentAppId = '';

    const APP_STORAGE_MAP = {
        album: {
            keys: ['sx_album_uploaded_images', 'sx_wallpaper_keyword']
        },
        appearance: {
            keys: [
                'sx_theme_mode',
                'sx_theme_accent',
                'sx_theme_text_color',
                'sx_theme_icon_border_color',
                'sx_theme_app_bg_color',
                'sx_theme_app_bg_alpha',
                'sx_theme_image',
                'sx_custom_icons',
                'sx_custom_theme_config',
                'sx_app_interface_config'
            ]
        },
        pomodoro: {
            keys: ['pomodoro_config']
        },
        'emoji-shop': {
            keys: ['sx_emoji_packs', 'sx_emoji_default_ryan_loaded']
        },
        bilibili: {
            keys: ['sx_bili_generated_titles', 'sx_bili_feed_custom', 'sx_bili_feed_custom_meta']
        },
        chat: {
            keys: [
                'sx_masks',
                'sx_chat_sessions',
                'sx_chat_active',
                'sx_chat_history',
                'sx_chat_font_size',
                'chat_history_range',
                'sx_user_name',
                'sx_user_avatar',
                'sx_user_personality',
                'sx_user_background'
            ]
        },
        worldbook: {
            keys: [
                'sx_worldbook_cot',
                'sx_worldbook_style',
                'sx_worldbook_global',
                'sx_worldbook_keywords',
                'sx_worldbook_backend',
                'sx_worldbook_index',
                'sx_worldbook_mounts'
            ]
        },
        settings: {
            keys: [
                'api_configs',
                'sx_active_api',
                'sxiphone_lang',
                'sxiphone_region',
                'sx_user_name',
                'sx_user_avatar',
                'sx_user_personality',
                'sx_user_background',
                'sx_characters',
                'sx_users',
                'sx_npcs',
                'sx_nova_api_url',
                'sx_nova_api_key',
                'sx_github_token',
                'sx_github_user',
                'sx_github_repo_name'
            ]
        },
        weather: {
            keys: ['sx_weather_location', 'sx_weather_cache']
        },
        touch: {
            keys: ['sx_ball_enabled', 'sx_ball_style'],
            prefixes: ['sx_ball_func_']
        },
        'smart-painter': {
            keys: ['smartPainterLoras', 'smartPainterHistory']
        },
        phone: {
            keys: ['sx_voice_call_recordings']
        },
        taobao: {
            keys: ['sx_shop_products', 'sx_shop_cart']
        },
        theater: {
            keys: ['sx_theater_content', 'sx_theater_progress', 'sx_theater_mylist']
        },
        farm: {
            keys: ['sx_farm_save', 'sx_farm_settings']
        }
    };

    const getAppFolderKey = (appId) => `${APP_FOLDER_PREFIX}${appId}${APP_FOLDER_SUFFIX}`;

    const trackAppStorageForFrame = (frame, appId) => {
        if (!frame || !appId || frame.dataset.storageTracked === '1') return;
        frame.dataset.storageTracked = '1';
        // 用 StorageEvent 監聽，不覆蓋原生方法（避免污染備份）
        try {
            frame.contentWindow?.addEventListener('storage', (e) => {
                if (e.key) handleAppStorageMutation(appId, e.key);
            });
        } catch (e) {
            console.warn('[trackAppStorageForFrame] 監聽失敗:', e);
        }
    };

    const getStorageValue = (key) => {
        const val = localStorage.getItem(key);
        return val === null ? null : val;
    };

    const shouldTrackKey = (appId, key) => {
        const config = APP_STORAGE_MAP[appId];
        if (!config) return false;
        if (config.keys?.includes(key)) return true;
        if (config.prefixes?.some(prefix => key.startsWith(prefix))) return true;
        return false;
    };

    const collectStorageForApp = (appId) => {
        const config = APP_STORAGE_MAP[appId];
        if (!config) return {};
        const result = {};
        (config.keys || []).forEach((key) => {
            const value = getStorageValue(key);
            if (value !== null) result[key] = value;
        });
        if (config.prefixes?.length) {
            for (let i = 0; i < localStorage.length; i += 1) {
                const key = localStorage.key(i);
                if (!key) continue;
                if (!config.prefixes.some(prefix => key.startsWith(prefix))) continue;
                const value = getStorageValue(key);
                if (value !== null) result[key] = value;
            }
        }
        return result;
    };

    // --- 4.1 全域記憶模組 ---
    const MEMORY_INDEX_KEY = 'sx_global_memory_index';
    const MEMORY_BUCKET_PREFIX = 'sx_global_memory_bucket:';
    const MEMORY_INTERVAL_KEY = 'sx_memory_interval';
    const MEMORY_DEFAULT_INTERVAL = 15;
    const MEMORY_MIN_LEN = 120;
    const MEMORY_MAX_LEN = 200;
    const MEMORY_MAX_MESSAGES = 20;
    const MEMORY_MIN_INTERVAL = 10;
    const MEMORY_MAX_INTERVAL = 20;

    const clampNumber = (value, min, max) => Math.max(min, Math.min(max, value));

    const memoryState = {
        buffer: [],
        interval: clampNumber(Number(localStorage.getItem(MEMORY_INTERVAL_KEY)) || MEMORY_DEFAULT_INTERVAL, MEMORY_MIN_INTERVAL, MEMORY_MAX_INTERVAL)
    };

    let newMemorySystem = null;
    let newMemoryInitialized = false;
    let shortTermMemory = null;
    let memoryPool = null;
    let unifiedMemory = null;

    const initUnifiedMemorySystem = async () => {
        if (unifiedMemory) return unifiedMemory;
        
        if (typeof UnifiedMemorySystem !== 'undefined') {
            const apiConfig = _getApiConfig();
            unifiedMemory = new UnifiedMemorySystem({ apiConfig });
            
            try {
                await unifiedMemory.initialize((progress) => {
                    console.log(`[Memory] 統一系統初始化: ${progress.stage} ${progress.progress}%`);
                });
                
                window.unifiedMemory = unifiedMemory;
                newMemorySystem = unifiedMemory;
                shortTermMemory = unifiedMemory.shortTermMemory;
                memoryPool = unifiedMemory.memoryPool;
                
                const userName = localStorage.getItem('sx_user_name');
                if (userName) {
                    unifiedMemory.setIdentity({ name: userName, type: 'user_companion' });
                }
                
                if (unifiedMemory.sleepEngine && typeof SleepScheduler !== 'undefined') {
                    const scheduler = new SleepScheduler(unifiedMemory.sleepEngine);
                    scheduler.start();
                    unifiedMemory.sleepScheduler = scheduler;
                }
                
                console.log('[Memory] 統一記憶系統已啟用（含所有子系統整合）');
                return unifiedMemory;
            } catch (e) {
                console.warn('[Memory] 統一系統初始化失敗，嘗試降級:', e);
                unifiedMemory = null;
            }
        }
        
        return initLegacyMemorySystem();
    };

    const initLegacyMemorySystem = async () => {
        if (newMemoryInitialized) return newMemorySystem;
        newMemoryInitialized = true;

        initShortTermMemory();

        try {
            if (typeof MemoryManager !== 'undefined') {
                const apiConfig = _getApiConfig();
                newMemorySystem = new MemoryManager({ 
                    apiConfig,
                    shortTermMemory: shortTermMemory
                });
                await newMemorySystem.initialize((progress) => {
                    console.log(`[Memory] 新系統初始化: ${progress.stage} ${progress.progress}%`);
                });
                
                if (newMemorySystem.sleepEngine) {
                    newMemorySystem.sleepEngine.shortTermMemory = shortTermMemory;
                }
                
                if (newMemorySystem.sleepScheduler) {
                    newMemorySystem.startSleepScheduler();
                }
                
                window.globalMemorySystem = newMemorySystem;
                
                initMemoryPool();
                
                console.log('[Memory] 新記憶系統已啟用（含休眠調度、短期記憶與記憶池整合）');
            }
        } catch (e) {
            console.warn('[Memory] 新系統初始化失敗，使用舊系統:', e);
            newMemorySystem = null;
        }
        
        return newMemorySystem;
    };

    const initShortTermMemory = () => {
        if (shortTermMemory) return shortTermMemory;
        
        if (typeof ShortTermMemory !== 'undefined') {
            shortTermMemory = new ShortTermMemory({
                maxCapacity: 100,
                decayMinutes: 30,
                importanceThreshold: 6
            });
            shortTermMemory.initialize();
            window.shortTermMemory = shortTermMemory;
            console.log('[Memory] 短期記憶系統已啟用');
        }
        
        return shortTermMemory;
    };

    const initMemoryPool = () => {
        if (memoryPool) return memoryPool;
        
        if (typeof MemoryPool !== 'undefined') {
            memoryPool = new MemoryPool({
                shortTermMemory: shortTermMemory,
                memoryManager: newMemorySystem,
                memoryStore: newMemorySystem?.memoryStore,
                embeddingEngine: newMemorySystem?.embeddingEngine,
                perceptionWeight: {
                    smell: 1.0,
                    touch: 0.95,
                    sight: 0.7,
                    sound: 0.6,
                    taste: 0.85
                },
                consolidationThreshold: 0.65,
                triggerThreshold: 0.75
            });
            memoryPool.initialize();
            window.memoryPool = memoryPool;
            console.log('[Memory] 記憶池系統已啟用（認知模型架構）');
        }
        
        return memoryPool;
    };

    const initNewMemorySystem = async () => {
        return initUnifiedMemorySystem();
    };

    const _getApiConfig = () => {
        const raw = localStorage.getItem('sx_nova_api_key');
        if (!raw) return null;
        try {
            const config = JSON.parse(raw);
            return {
                provider: config.provider || 'openai',
                key: config.key,
                url: config.url,
                model: config.model
            };
        } catch (e) {
            return null;
        }
    };

    const migrateOldMemories = async () => {
        if (!newMemorySystem) return { migrated: 0, failed: 0 };

        const MEMORY_BUCKET_PREFIX = 'sx_global_memory_bucket:';
        const oldMemories = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(MEMORY_BUCKET_PREFIX)) {
                try {
                    const raw = localStorage.getItem(key);
                    const bucket = JSON.parse(raw || '[]');
                    if (Array.isArray(bucket)) oldMemories.push(...bucket);
                } catch (e) {}
            }
        }

        let migrated = 0, failed = 0;
        for (const mem of oldMemories) {
            try {
                await newMemorySystem.hold(mem.summary, {
                    id: mem.id,
                    importance: 5,
                    source: mem.source || 'migration',
                    metadata: { created: mem.createdAt }
                });
                migrated++;
            } catch (e) {
                failed++;
            }
        }

        localStorage.setItem('sx_memory_migration_status', JSON.stringify({
            migratedCount: migrated,
            failedCount: failed,
            lastMigrationAt: new Date().toISOString()
        }));

        console.log(`[Memory] 遷移完成: ${migrated} 成功, ${failed} 失敗`);
        return { migrated, failed };
    };

    const getUserKey = () => {
        const name = localStorage.getItem('sx_user_name');
        if (name && name.trim()) return name.trim();
        return 'default';
    };

    const safeJsonParse = (raw, fallback) => {
        if (!raw) return fallback;
        try {
            const parsed = JSON.parse(raw);
            return parsed ?? fallback;
        } catch (e) {
            return fallback;
        }
    };

    const loadMemoryIndex = () => {
        const raw = localStorage.getItem(MEMORY_INDEX_KEY);
        const data = safeJsonParse(raw, []);
        return Array.isArray(data) ? data : [];
    };

    const saveMemoryIndex = (index) => {
        localStorage.setItem(MEMORY_INDEX_KEY, JSON.stringify(index || []));
    };

    const loadMemoryBucket = (userKey) => {
        const raw = localStorage.getItem(`${MEMORY_BUCKET_PREFIX}${userKey}`);
        const data = safeJsonParse(raw, []);
        return Array.isArray(data) ? data : [];
    };

    const saveMemoryBucket = (userKey, bucket) => {
        localStorage.setItem(`${MEMORY_BUCKET_PREFIX}${userKey}`, JSON.stringify(bucket || []));
    };

    const readMemorySnapshot = (payload = {}) => {
        const userKey = payload.userKey || getUserKey();
        const bucket = loadMemoryBucket(userKey);
        const index = loadMemoryIndex();
        const limit = Number.isFinite(Number(payload.limit)) ? Number(payload.limit) : 20;
        const items = limit > 0 ? bucket.slice(-limit) : bucket.slice();
        return {
            userKey,
            items,
            count: bucket.length,
            indexCount: index.length,
            updatedAt: new Date().toISOString()
        };
    };

    const exportMemoryDump = () => {
        const index = loadMemoryIndex();
        const buckets = {};
        for (let i = 0; i < localStorage.length; i += 1) {
            const key = localStorage.key(i);
            if (!key || !key.startsWith(MEMORY_BUCKET_PREFIX)) continue;
            const userKey = key.replace(MEMORY_BUCKET_PREFIX, '');
            buckets[userKey] = loadMemoryBucket(userKey);
        }
        return {
            version: 1,
            exportedAt: new Date().toISOString(),
            interval: memoryState.interval,
            index,
            buckets
        };
    };

    const hashSummary = (text) => {
        let hash = 5381;
        const normalized = String(text || '').trim();
        for (let i = 0; i < normalized.length; i += 1) {
            hash = (hash * 33) ^ normalized.charCodeAt(i);
        }
        return (hash >>> 0).toString(16);
    };

    const compactMessage = (message) => {
        if (!message || !message.content) return '';
        const role = message.role === 'assistant' ? '助理' : '使用者';
        const content = String(message.content)
            .replace(/[\r\n]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        if (!content) return '';
        return `${role}:${content}`;
    };

    const buildSummaryFromMessages = (messages) => {
        const list = Array.isArray(messages) ? messages : [];
        const parts = [];
        for (let i = list.length - 1; i >= 0; i -= 1) {
            const part = compactMessage(list[i]);
            if (!part) continue;
            parts.unshift(part);
            const joined = parts.join('；');
            if (joined.length >= MEMORY_MIN_LEN) break;
            if (parts.length >= MEMORY_MAX_MESSAGES) break;
        }
        let summary = parts.join('；');
        if (summary.length > MEMORY_MAX_LEN) {
            summary = summary.slice(0, MEMORY_MAX_LEN);
        }
        if (summary.length < MEMORY_MIN_LEN && list.length > parts.length) {
            // 仍不足時補上更早內容
            for (let i = list.length - parts.length - 1; i >= 0; i -= 1) {
                const part = compactMessage(list[i]);
                if (!part) continue;
                summary = `${part}；${summary}`;
                if (summary.length >= MEMORY_MIN_LEN) break;
            }
            if (summary.length > MEMORY_MAX_LEN) {
                summary = summary.slice(0, MEMORY_MAX_LEN);
            }
        }
        return summary.trim();
    };

    const emitMemoryEvent = (type, payload, targetWindow) => {
        const target = targetWindow || document.getElementById('app-frame')?.contentWindow;
        if (target) {
            target.postMessage({ type, payload }, '*');
        }
        window.postMessage({ type, payload }, '*');
    };

    const writeMemorySummary = (summary, meta = {}) => {
        if (!summary) {
            return { success: false, reason: 'empty-summary' };
        }
        const userKey = getUserKey();
        const index = loadMemoryIndex();
        const hash = hashSummary(summary);
        if (index.some(item => item.hash === hash)) {
            return { success: false, reason: 'duplicate', hash };
        }
        const entry = {
            id: `mem_${Date.now()}`,
            hash,
            createdAt: new Date().toISOString(),
            length: summary.length,
            source: meta.source || 'auto',
            userKey
        };
        const bucket = loadMemoryBucket(userKey);
        bucket.push({
            id: entry.id,
            summary,
            hash,
            createdAt: entry.createdAt,
            source: entry.source,
            meta: meta.extra || null
        });
        index.push(entry);
        saveMemoryBucket(userKey, bucket);
        saveMemoryIndex(index);
        return { success: true, hash, entry };
    };

    const summarizeAndWrite = (messages, meta = {}, targetWindow) => {
        const summary = buildSummaryFromMessages(messages);
        const hash = hashSummary(summary);
        emitMemoryEvent('MEMORY_SUMMARY_READY', { summary, hash, meta }, targetWindow);
        const result = writeMemorySummary(summary, meta);
        emitMemoryEvent('MEMORY_WRITE_RESULT', result, targetWindow);
        return result;
    };

    const handleMemoryChatEvent = async (payload, targetWindow) => {
        if (!payload || !payload.content) return;

        const um = unifiedMemory || window.unifiedMemory;
        if (um && um.isInitialized) {
            await um.memorize(payload.content, {
                importance: payload.importance || 5,
                emotion: payload.emotion,
                source: payload.source || 'chat',
                tags: payload.tags || [],
                metadata: {
                    role: payload.role,
                    ...payload.metadata
                }
            });
        } else {
            const mp = memoryPool || window.memoryPool;
            if (mp && mp.isInitialized) {
                mp.processConversationMessage({
                    content: payload.content,
                    role: payload.role
                }, {
                    emotion: payload.emotion,
                    source: payload.source || 'chat',
                    metadata: payload.metadata
                });
            }

            const stm = shortTermMemory || window.shortTermMemory;
            if (stm && stm.isInitialized) {
                stm.push(payload.content, {
                    role: payload.role || 'user',
                    source: payload.source || 'chat',
                    importance: payload.importance || 5,
                    emotion: payload.emotion || null,
                    tags: payload.tags || [],
                    metadata: payload.metadata || {}
                });
            } else {
                memoryState.buffer.push({
                    role: payload.role || 'user',
                    content: payload.content,
                    source: payload.source || 'chat',
                    createdAt: new Date().toISOString()
                });
            }

            if (newMemorySystem && newMemorySystem.isInitialized) {
                try {
                    await newMemorySystem.hold(payload.content, {
                        importance: payload.importance || 5,
                        source: payload.source || 'chat',
                        emotion: payload.emotion,
                        tags: payload.tags || [],
                        metadata: {
                            role: payload.role,
                            ...payload.metadata
                        }
                    });
                } catch (e) {
                    console.warn('[Memory] 寫入長期記憶失敗:', e);
                }
            }
        }

        if (memoryState.buffer.length >= memoryState.interval) {
            summarizeAndWrite(memoryState.buffer, { source: 'interval', extra: { count: memoryState.buffer.length } }, targetWindow);
            memoryState.buffer = [];
        }
    };

    const handleMemoryRequestSummary = (payload, targetWindow) => {
        const useBuffer = memoryState.buffer.length > 0;
        const history = safeJsonParse(localStorage.getItem('sx_chat_history'), []);
        const customMessages = Array.isArray(payload?.messages) ? payload.messages : null;
        const messages = customMessages || (useBuffer ? memoryState.buffer : history);
        const meta = {
            source: payload?.source || (customMessages ? 'manual-custom' : useBuffer ? 'manual-buffer' : 'manual-history'),
            extra: payload?.extra || null
        };
        summarizeAndWrite(messages, meta, targetWindow);
        if (useBuffer) memoryState.buffer = [];
    };

    const handleMemoryRequestHistory = async (payload, targetWindow) => {
        const um = unifiedMemory || window.unifiedMemory;
        
        if (um && um.isInitialized) {
            try {
                const recallResult = await um.recall(payload?.query || '', {
                    limit: payload?.limit || 20,
                    usePool: payload?.includePool !== false,
                    useSearch: true,
                    useShortTerm: true,
                    useAwakening: false
                });
                
                const snapshot = {
                    userKey: 'unified_system',
                    items: recallResult.memories,
                    shortTerm: recallResult.shortTerm,
                    pool: recallResult.pool,
                    context: recallResult.context,
                    identity: recallResult.identity,
                    source: 'unified_memory',
                    updatedAt: new Date().toISOString()
                };
                
                emitMemoryEvent('MEMORY_HISTORY_READY', snapshot, targetWindow);
                return;
            } catch (e) {
                console.warn('[Memory] 統一系統讀取失敗:', e);
            }
        }
        
        let snapshot = null;

        const mp = memoryPool || window.memoryPool;
        if (mp && mp.isInitialized && payload?.includePool) {
            const poolContext = mp.buildFullContext();
            snapshot = {
                userKey: 'memory_pool',
                items: [],
                pool: poolContext,
                source: 'memory_pool',
                updatedAt: new Date().toISOString()
            };
        }

        if (!snapshot && newMemorySystem && newMemorySystem.isInitialized) {
            try {
                const limit = payload?.limit || 20;
                const memories = await newMemorySystem.memoryStore.getAll({ limit });
                snapshot = {
                    userKey: 'indexeddb',
                    items: memories.map(m => ({
                        id: m.id,
                        summary: m.content,
                        hash: m.hash,
                        createdAt: m.metadata?.created,
                        source: m.metadata?.source,
                        emotion: m.emotion,
                        tags: m.tags,
                        importance: m.metadata?.importance
                    })),
                    count: memories.length,
                    source: 'new-system',
                    updatedAt: new Date().toISOString()
                };
                
                if (mp && mp.isInitialized) {
                    snapshot.pool = mp.buildFullContext();
                }
            } catch (e) {
                console.warn('[Memory] 新系統讀取失敗:', e);
            }
        }

        if (!snapshot) {
            snapshot = readMemorySnapshot(payload);
            
            if (mp && mp.isInitialized) {
                snapshot.pool = mp.buildFullContext();
            }
        }

        emitMemoryEvent('MEMORY_HISTORY_READY', snapshot, targetWindow);
    };

    const handleMemoryPoolTrigger = async (payload, targetWindow) => {
        const mp = memoryPool || window.memoryPool;
        if (!mp || !mp.isInitialized) {
            emitMemoryEvent('MEMORY_POOL_TRIGGER_RESULT', { success: false, reason: 'not_initialized' }, targetWindow);
            return;
        }

        const result = mp.trigger(payload.query || '', payload.options || {});
        emitMemoryEvent('MEMORY_POOL_TRIGGER_RESULT', { success: true, result }, targetWindow);
    };

    const handleMemoryPoolPremise = (payload, targetWindow) => {
        const mp = memoryPool || window.memoryPool;
        if (!mp || !mp.isInitialized) {
            emitMemoryEvent('MEMORY_POOL_PREMISE_RESULT', { success: false, reason: 'not_initialized' }, targetWindow);
            return;
        }

        const premise = mp.setPremise(payload.context || '');
        emitMemoryEvent('MEMORY_POOL_PREMISE_RESULT', { success: true, premise }, targetWindow);
    };

    const handleMemoryExport = (payload, targetWindow) => {
        const dump = exportMemoryDump();
        emitMemoryEvent('MEMORY_EXPORT_READY', dump, targetWindow);
    };

    const clearMemoryForUser = (payload = {}, targetWindow) => {
        const userKey = payload.userKey || getUserKey();
        localStorage.removeItem(`${MEMORY_BUCKET_PREFIX}${userKey}`);
        const index = loadMemoryIndex().filter(item => item.userKey !== userKey);
        saveMemoryIndex(index);
        emitMemoryEvent('MEMORY_CLEAR_DONE', { userKey }, targetWindow);
    };

    const loadAppFolder = (appId) => {
        if (!appId) return null;
        const raw = localStorage.getItem(getAppFolderKey(appId));
        if (!raw) return { appId, updatedAt: null, data: {} };
        try {
            return JSON.parse(raw);
        } catch {
            return { appId, updatedAt: null, data: {} };
        }
    };

    const saveAppFolder = (appId, data = {}, meta = {}) => {
        if (!appId) return;
        const current = loadAppFolder(appId) || { appId, data: {} };
        const mergedStorage = {
            ...(current.data?.storage || {}),
            ...(data?.storage || {})
        };
        const mergedData = {
            ...(current.data || {}),
            ...(data || {}),
            storage: mergedStorage
        };
        const payload = {
            appId,
            updatedAt: new Date().toISOString(),
            data: mergedData,
            ...meta
        };
        localStorage.setItem(getAppFolderKey(appId), JSON.stringify(payload));
    };

    const ensureAppFolder = (appId) => {
        if (!appId) return;
        const existing = localStorage.getItem(getAppFolderKey(appId));
        if (!existing) {
            saveAppFolder(appId, {}, { createdAt: new Date().toISOString() });
        }
    };

    const getEffectiveTheme = (mode) => {
        if (mode === 'custom-light') return 'light';
        if (mode === 'custom-dark') return 'dark';
        if (mode !== 'auto') return mode || 'dark';
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? 'dark' : 'light';
    };

    const getThemeSnapshot = () => ({
        mode: document.documentElement.dataset.theme || 'dark',
        accent: getComputedStyle(document.documentElement).getPropertyValue('--sx-accent'),
        textColor: getComputedStyle(document.documentElement).getPropertyValue('--sx-text'),
        iconBorderColor: getComputedStyle(document.documentElement).getPropertyValue('--sx-icon-border'),
        appBg: getComputedStyle(document.documentElement).getPropertyValue('--sx-app-bg')
    });

    const getAppearanceSnapshot = () => {
        try {
            const raw = localStorage.getItem('sx_custom_theme_config');
            if (raw) {
                return JSON.parse(raw);
            }
        } catch (e) {
            console.warn('[Main] 讀取外觀設定失敗:', e);
        }
        return {
            textPrimary: localStorage.getItem('sx_theme_text_color') || '#ffffff',
            textSecondary: '#9ca3af',
            textHeading: '#ffffff',
            textLink: localStorage.getItem('sx_theme_accent') || '#5B8DEF',
            fontSize: 14,
            headingSize: 22,
            cardRadius: 18,
            iconRadius: 20,
            iconSize: 62,
            appBgColor: localStorage.getItem('sx_theme_app_bg_color') || '#1c1c1e',
            appBgOpacity: parseInt(localStorage.getItem('sx_theme_app_bg_alpha') || '30')
        };
    };

    const ensureFrameThemeStyle = (doc) => {
        if (!doc) return;
        let style = doc.getElementById('sx-global-theme');
        if (!style) {
            style = doc.createElement('style');
            style.id = 'sx-global-theme';
            style.textContent = `
                :root { color-scheme: light dark; }
                body { color: var(--sx-text, #ffffff); }
            `;
            doc.head?.appendChild(style);
        }
    };

    const syncThemeToFrame = (frame, theme) => {
        if (!frame?.contentWindow) return;
        try {
            const doc = frame.contentWindow.document;
            if (!doc) return;
            ensureFrameThemeStyle(doc);
            doc.documentElement.dataset.theme = theme.mode;
            doc.body?.classList.toggle('theme-light', theme.mode === 'light');
            if (theme.accent) doc.documentElement.style.setProperty('--sx-accent', theme.accent);
            if (theme.textColor) doc.documentElement.style.setProperty('--sx-text', theme.textColor);
            if (theme.iconBorderColor) doc.documentElement.style.setProperty('--sx-icon-border', theme.iconBorderColor);
            if (theme.appBg) doc.documentElement.style.setProperty('--sx-app-bg', theme.appBg);
        } catch (err) {
            console.warn('同步主題到應用程式失敗', err);
        }
    };

    const syncLanguageToFrame = (frame, lang) => {
        if (!frame?.contentWindow || !lang) return;
        try {
            const doc = frame.contentWindow.document;
            if (doc?.documentElement) {
                doc.documentElement.lang = lang;
            }
            frame.contentWindow.postMessage({ type: 'LANGUAGE_CHANGED', lang }, '*');
        } catch (err) {
            console.warn('同步語言到應用程式失敗', err);
        }
    };

    const applyRootTheme = (mode, accent, payload = {}) => {
        const currentMode = document.documentElement.dataset.theme || 'dark';
        const requestedMode = mode || currentMode;
        const effectiveMode = getEffectiveTheme(requestedMode);

        if (mode) {
            document.documentElement.dataset.theme = effectiveMode;
            if (mode !== 'auto') localStorage.setItem(THEME_MODE_KEY, mode);
        }
        if (accent) {
            document.documentElement.style.setProperty('--sx-accent', accent);
            localStorage.setItem(THEME_ACCENT_KEY, accent);
        }

        const resolvedTextColor = payload.textColor || (mode ? (effectiveMode === 'light' ? '#000000' : '#ffffff') : null);
        if (resolvedTextColor) {
            document.documentElement.style.setProperty('--sx-text', resolvedTextColor);
            localStorage.setItem(THEME_TEXT_KEY, resolvedTextColor);
        }
        if (payload.iconBorderColor) {
            document.documentElement.style.setProperty('--sx-icon-border', payload.iconBorderColor);
            localStorage.setItem(THEME_ICON_BORDER_KEY, payload.iconBorderColor);
        }
        if (payload.appBgColor) {
            const alpha = payload.appBgAlpha ?? Number(localStorage.getItem(THEME_APP_BG_ALPHA_KEY) || 30);
            const opacity = Math.max(0, Math.min(100, Number(alpha))) / 100;
            const rgba = payload.appBgColor.replace('#', '');
            const r = parseInt(rgba.slice(0, 2), 16);
            const g = parseInt(rgba.slice(2, 4), 16);
            const b = parseInt(rgba.slice(4, 6), 16);
            document.documentElement.style.setProperty('--sx-app-bg', `rgba(${r}, ${g}, ${b}, ${opacity})`);
            localStorage.setItem(THEME_APP_BG_KEY, payload.appBgColor);
            localStorage.setItem(THEME_APP_BG_ALPHA_KEY, String(alpha));
        }

        const frame = document.getElementById('app-frame');
        const snapshot = getThemeSnapshot();
        if (frame?.contentWindow) {
            frame.contentWindow.postMessage({
                type: 'THEME_APPLIED',
                ...snapshot
            }, '*');
            syncThemeToFrame(frame, snapshot);
        }
    };

    const sendAppFolderSync = (appId, data = {}) => {
        if (!appId) return;
        saveAppFolder(appId, data, { source: 'app', syncedAt: new Date().toISOString() });
        const frame = document.getElementById('app-frame');
        if (frame?.contentWindow) {
            frame.contentWindow.postMessage({ type: 'APP_FOLDER_SYNC', appId, data }, '*');
        }
    };

    const syncAppFolderFromStorage = (appId) => {
        if (!appId) return;
        const folder = loadAppFolder(appId);
        if (folder?.data) {
            sendAppFolderSync(appId, folder.data);
        }
    };

    const syncAppFolderSnapshot = (appId) => {
        if (!appId) return;
        const storage = collectStorageForApp(appId);
        if (!Object.keys(storage).length) return;
        saveAppFolder(appId, { storage }, { source: 'system', syncedAt: new Date().toISOString() });
        const frame = document.getElementById('app-frame');
        if (frame?.contentWindow) {
            frame.contentWindow.postMessage({ type: 'APP_FOLDER_SYNC', appId, data: { storage } }, '*');
        }
    };

    const handleAppStorageMutation = (appId, key) => {
        if (!appId || !key) return;
        if (!shouldTrackKey(appId, key)) return;
        syncAppFolderSnapshot(appId);
    };

    const applyThemeFromStorage = () => {
        const mode = localStorage.getItem(THEME_MODE_KEY) || 'dark';
        const accent = localStorage.getItem(THEME_ACCENT_KEY) || '#5B8DEF';
        const fallbackText = getEffectiveTheme(mode) === 'light' ? '#000000' : '#ffffff';
        const textColor = localStorage.getItem(THEME_TEXT_KEY) || fallbackText;
        const iconBorderColor = localStorage.getItem(THEME_ICON_BORDER_KEY) || '#ffffff';
        const appBgColor = localStorage.getItem(THEME_APP_BG_KEY) || '#1c1c1e';
        const appBgAlpha = Number(localStorage.getItem(THEME_APP_BG_ALPHA_KEY) || 30);
        applyRootTheme(mode, accent, { textColor, iconBorderColor, appBgColor, appBgAlpha });
    };

    const APPEARANCE_PRESET_KEY = 'sx_appearance_preset';

    const saveAppearancePreset = (mode, isCustom) => {
        const preset = isCustom ? `custom-${mode}` : mode;
        localStorage.setItem(APPEARANCE_PRESET_KEY, preset);
    };

    const loadAppearancePreset = () => {
        return localStorage.getItem(APPEARANCE_PRESET_KEY) || 'dark';
    };

    const applyAppearancePreset = (mode, isCustom) => {
        if (isCustom) {
            const customMode = mode === 'light' ? 'custom-light' : 'custom-dark';
            localStorage.setItem(THEME_MODE_KEY, customMode);
            
            const customConfigKey = `sx_custom_appearance_${mode}`;
            const savedConfig = localStorage.getItem(customConfigKey);
            if (savedConfig) {
                try {
                    const config = JSON.parse(savedConfig);
                    if (config.accent) {
                        localStorage.setItem(THEME_ACCENT_KEY, config.accent);
                        document.documentElement.style.setProperty('--sx-accent', config.accent);
                    }
                    if (config.textColor) {
                        localStorage.setItem(THEME_TEXT_KEY, config.textColor);
                    }
                    if (config.appBgColor) {
                        localStorage.setItem(THEME_APP_BG_KEY, config.appBgColor);
                    }
                } catch (e) {
                    console.warn('載入自訂外觀設定失敗', e);
                }
            }
            
            applyRootTheme(customMode, null);
        } else {
            localStorage.setItem(THEME_MODE_KEY, mode);
            const defaultAccent = mode === 'light' ? '#007aff' : '#5B8DEF';
            const defaultText = mode === 'light' ? '#000000' : '#ffffff';
            const defaultAppBg = mode === 'light' ? '#f2f2f7' : '#1c1c1e';
            
            localStorage.setItem(THEME_ACCENT_KEY, defaultAccent);
            localStorage.setItem(THEME_TEXT_KEY, defaultText);
            localStorage.setItem(THEME_APP_BG_KEY, defaultAppBg);
            
            applyRootTheme(mode, defaultAccent, { 
                textColor: defaultText, 
                appBgColor: defaultAppBg 
            });
        }
        
        saveAppearancePreset(mode, isCustom);
        applyThemeFromStorage();
        
        const frame = document.getElementById('app-frame');
        if (frame?.contentWindow) {
            frame.contentWindow.postMessage({ 
                type: 'THEME_APPLIED', 
                mode: getEffectiveTheme(mode),
                accent: localStorage.getItem(THEME_ACCENT_KEY)
            }, '*');
        }
    };

    const showAppearancePicker = () => {
        const picker = document.getElementById('appearance-picker');
        if (!picker) {
            console.warn('[Appearance] appearance-picker 元素不存在');
            return;
        }
        
        const currentPreset = loadAppearancePreset();
        picker.querySelectorAll('.appearance-option').forEach(btn => {
            const mode = btn.dataset.mode;
            const isCustom = btn.dataset.custom === 'true';
            const presetKey = isCustom ? `custom-${mode}` : mode;
            btn.classList.toggle('active', presetKey === currentPreset);
        });
        
        picker.classList.remove('hidden');
        console.log('[Appearance] 外觀選擇器已開啟');
        
        const closePicker = (e) => {
            if (!e.target.closest('.appearance-picker-card')) {
                picker.classList.add('hidden');
                document.removeEventListener('click', closePicker);
                console.log('[Appearance] 外觀選擇器已關閉');
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', closePicker);
        }, 200);
    };

    const initAppearancePicker = () => {
        const picker = document.getElementById('appearance-picker');
        if (!picker) return;
        
        picker.querySelectorAll('.appearance-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const mode = btn.dataset.mode;
                const isCustom = btn.dataset.custom === 'true';
                applyAppearancePreset(mode, isCustom);
                picker.classList.add('hidden');
            });
        });
    };

    const loadCustomIcons = () => {
        try {
            const raw = localStorage.getItem(CUSTOM_ICON_KEY);
            const parsed = raw ? JSON.parse(raw) : {};
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (err) {
            console.warn('自訂圖標解析失敗', err);
            return {};
        }
    };

    // --- 4.2 手機檢查事件 ---
    let phoneCheckEnabled = false;
    let phoneCheckTimer = null;
    let phoneCheckSwitchTimer = null;
    let phoneCheckEndTimer = null;
    let phoneCheckTicker = null;
    let phoneCheckActive = false;
    let phoneCheckEndsAt = 0;
    let phoneCheckStartAt = 0;
    let phoneCheckLastEvaluation = '';
    let phoneCheckAppsSeen = new Set();
    let phoneCheckMessageTimer = null;
    let phoneCheckAIMessages = [];

    const getPhoneCheckDelaySettings = () => ({
        minDelay: parseInt(localStorage.getItem(PHONE_CHECK_MIN_DELAY_KEY)) || 5,
        maxDelay: parseInt(localStorage.getItem(PHONE_CHECK_MAX_DELAY_KEY)) || 60,
        minDuration: parseInt(localStorage.getItem(PHONE_CHECK_MIN_DURATION_KEY)) || 2,
        maxDuration: parseInt(localStorage.getItem(PHONE_CHECK_MAX_DURATION_KEY)) || 5
    });

    const getPhoneCheckApiConfig = () => {
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
    };

    const getPhoneCheckCharacterData = () => {
        const charName = localStorage.getItem('sx_char_name');
        if (!charName) return null;
        const raw = localStorage.getItem('sx_characters');
        if (!raw) return null;
        try {
            const list = JSON.parse(raw);
            return list.find(c => c.name === charName) || null;
        } catch {
            return null;
        }
    };

    const getPhoneCheckUserData = () => {
        return {
            name: localStorage.getItem('sx_user_name') || 'User',
            personality: localStorage.getItem('sx_user_personality') || '',
            background: localStorage.getItem('sx_user_background') || ''
        };
    };

    const getPhoneCheckUserPhoneContent = () => {
        const content = {};
        
        const chatHistoryRaw = localStorage.getItem('sx_chat_history');
        if (chatHistoryRaw) {
            try {
                const history = JSON.parse(chatHistoryRaw);
                if (Array.isArray(history) && history.length > 0) {
                    content.recentChats = history.slice(-5).map(h => {
                        const role = h.role === 'user' ? '用戶' : '角色';
                        const text = (h.content || '').slice(0, 50);
                        return `${role}: ${text}`;
                    }).join('\n');
                }
            } catch {}
        }
        
        const albumRaw = localStorage.getItem('sx_album_images');
        if (albumRaw) {
            try {
                const images = JSON.parse(albumRaw);
                if (Array.isArray(images) && images.length > 0) {
                    content.albumCount = images.length;
                    content.albumRecent = images.slice(0, 3).map(img => img.name || '照片').join(', ');
                }
            } catch {}
        }
        
        const diaryRaw = localStorage.getItem('sx_exchange_diary_entries');
        if (diaryRaw) {
            try {
                const entries = JSON.parse(diaryRaw);
                if (Array.isArray(entries) && entries.length > 0) {
                    content.diaryCount = entries.length;
                    const lastEntry = entries[entries.length - 1];
                    if (lastEntry && lastEntry.content) {
                        content.diaryRecent = lastEntry.content.slice(0, 100);
                    }
                }
            } catch {}
        }
        
        const notesRaw = localStorage.getItem('sx_notes');
        if (notesRaw) {
            try {
                const notes = JSON.parse(notesRaw);
                if (Array.isArray(notes) && notes.length > 0) {
                    content.notesCount = notes.length;
                }
            } catch {}
        }
        
        return content;
    };

    const getPhoneCheckWorldbookContext = () => {
        const categories = ['cot', 'style', 'global', 'keywords', 'backend'];
        const entries = [];
        categories.forEach(cat => {
            const key = `sx_worldbook_${cat}`;
            const raw = localStorage.getItem(key);
            if (!raw) return;
            try {
                const list = JSON.parse(raw);
                if (Array.isArray(list)) {
                    list.slice(0, 3).forEach(e => {
                        if (e.title && e.content) {
                            entries.push(`${e.title}: ${e.content.slice(0, 100)}`);
                        }
                    });
                }
            } catch {}
        });
        return entries.length > 0 ? entries.join('\n') : '';
    };

    const generatePhoneCheckMessage = async () => {
        const config = getPhoneCheckApiConfig();
        if (!config || !config.url) {
            return null;
        }

        const char = getPhoneCheckCharacterData();
        const user = getPhoneCheckUserData();
        const worldbook = getPhoneCheckWorldbookContext();
        const phoneContent = getPhoneCheckUserPhoneContent();

        const charName = char?.name || localStorage.getItem('sx_char_name') || '角色';
        const charPersonality = char?.personality || '';
        const charBackground = char?.background || '';

        const apps = Array.from(phoneCheckAppsSeen || []);
        const appsText = apps.length ? apps.slice(-3).join('、') : '你的手機';

        const lang = localStorage.getItem('sxiphone_lang') || 'zh-TW';

        const systemPrompt = `你是一個正在查看使用者手機的角色，請根據角色性格和看到的內容生成一句簡短的話。
請使用 ${getAIReadableLangName(lang)} 撰撰寫。
輸出格式為 JSON: {"message": "一句話"}`;

        let context = `# 角色設定\n名稱: ${charName}\n`;
        if (charPersonality) context += `性格: ${charPersonality}\n`;
        if (charBackground) context += `背景: ${charBackground}\n`;
        context += `\n# 使用者\n名稱: ${user.name}\n`;
        if (worldbook) context += `\n# 世界書\n${worldbook}\n`;
        context += `\n# 當前狀況\n正在查看: ${appsText}\n`;
        
        if (Object.keys(phoneContent).length > 0) {
            context += `\n# 手機內容\n`;
            if (phoneContent.recentChats) {
                context += `最近聊天記錄:\n${phoneContent.recentChats}\n`;
            }
            if (phoneContent.albumCount) {
                context += `相簿: ${phoneContent.albumCount} 張照片`;
                if (phoneContent.albumRecent) {
                    context += `（最近: ${phoneContent.albumRecent}）`;
                }
                context += `\n`;
            }
            if (phoneContent.diaryCount) {
                context += `交換日記: ${phoneContent.diaryCount} 篇`;
                if (phoneContent.diaryRecent) {
                    context += `\n最新日記: ${phoneContent.diaryRecent}`;
                }
                context += `\n`;
            }
            if (phoneContent.notesCount) {
                context += `筆記: ${phoneContent.notesCount} 則\n`;
            }
        }

        const prompt = `${context}

請生成一句角色在查看手機時會說的話，要求：
1. 根據看到的內容發表評論或感想
2. 符合角色性格
3. 簡短自然（15-40字）
4. 可以是評論、疑問、驚訝或感想

輸出 JSON 格式。`;

        try {
            const endpoint = config.url.endsWith('/chat/completions')
                ? config.url
                : `${config.url.replace(/\/$/, '')}/chat/completions`;

            const headers = { 'Content-Type': 'application/json' };
            if (config.key) {
                headers.Authorization = `Bearer ${config.key}`;
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    model: config.model || 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.9
                })
            });

            if (!response.ok) return null;

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content || '';

            let parsed = null;
            try {
                parsed = JSON.parse(content);
            } catch {
                const match = content.match(/\{[\s\S]*\}/);
                if (match) parsed = JSON.parse(match[0]);
            }

            return parsed?.message || null;
        } catch {
            return null;
        }
    };

    const updatePhoneCheckMessage = async () => {
        if (!phoneCheckActive) return;

        const messageEl = document.getElementById('phone-check-message');
        if (!messageEl) return;

        const aiMessage = await generatePhoneCheckMessage();

        if (aiMessage) {
            messageEl.textContent = aiMessage;
            phoneCheckAIMessages.push(aiMessage);
            const frame = document.getElementById('app-frame');
            if (frame?.contentWindow) {
                const charName = localStorage.getItem('sx_char_name') || '角色';
                const apps = Array.from(phoneCheckAppsSeen || []);
                frame.contentWindow.postMessage({
                    type: 'PHONE_CHECK_MESSAGE',
                    charName: charName,
                    message: aiMessage,
                    apps: apps
                }, '*');
            }
        } else {
            const charName = localStorage.getItem('sx_char_name') || '角色';
            messageEl.textContent = `${charName}正在查看你的手機...`;
        }
    };

    const getAllAppIds = () => {
        const nodes = document.querySelectorAll('.app-icon');
        const ids = new Set();
        nodes.forEach(node => {
            const appId = getAppIdFromNode(node);
            if (appId) ids.add(appId);
        });
        return Array.from(ids);
    };

    const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    const schedulePhoneCheck = () => {
        if (!phoneCheckEnabled) return;
        if (phoneCheckActive) return;
        if (phoneCheckTimer) clearTimeout(phoneCheckTimer);
        const settings = getPhoneCheckDelaySettings();
        const minDelayMs = settings.minDelay * 60 * 1000;
        const maxDelayMs = settings.maxDelay * 60 * 1000;
        const delay = randomBetween(minDelayMs, maxDelayMs);
        phoneCheckTimer = setTimeout(() => triggerPhoneCheck(), delay);
    };

    const updatePhoneCheckOverlay = () => {
        const overlay = document.getElementById('phone-check-overlay');
        const timerEl = document.getElementById('phone-check-timer');
        if (!overlay) return;
        if (!phoneCheckActive) {
            overlay.classList.add('hidden');
            return;
        }
        overlay.classList.remove('hidden');
        if (timerEl) {
            const remaining = Math.max(0, phoneCheckEndsAt - Date.now());
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            timerEl.textContent = `剩餘 ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    };

    const getInitialPhoneCheckMessage = async () => {
        const aiMessage = await generatePhoneCheckMessage();
        if (aiMessage) return aiMessage;
        const charName = localStorage.getItem('sx_char_name') || '角色';
        return `${charName}開始查看你的手機...`;
    };

    const stopPhoneCheck = () => {
        phoneCheckActive = false;
        if (phoneCheckSwitchTimer) clearTimeout(phoneCheckSwitchTimer);
        if (phoneCheckEndTimer) clearTimeout(phoneCheckEndTimer);
        if (phoneCheckTicker) clearInterval(phoneCheckTicker);
        if (phoneCheckMessageTimer) clearInterval(phoneCheckMessageTimer);
        phoneCheckSwitchTimer = null;
        phoneCheckEndTimer = null;
        phoneCheckTicker = null;
        phoneCheckMessageTimer = null;
        const viewport = document.getElementById('app-viewport');
        viewport?.classList.remove('phone-check-active');
        const messageEl = document.getElementById('phone-check-message');
        if (messageEl) messageEl.dataset.locked = '0';
        updatePhoneCheckOverlay();
        const durationMs = Math.max(0, Date.now() - phoneCheckStartAt);
        const minutes = Math.max(1, Math.round(durationMs / 60000));
        const apps = Array.from(phoneCheckAppsSeen || []);
        const charName = localStorage.getItem('sx_char_name') || '角色';
        const evaluation = phoneCheckLastEvaluation || phoneCheckAIMessages.slice(-1)[0] || '（無）';
        const appsText = apps.length ? apps.join('、') : '未記錄';
        const summary = `手機檢查事件：${charName}查看了你的手機並留下評語「${evaluation}」。檢查持續約${minutes}分鐘，期間瀏覽了${appsText}。`;
        const result = writeMemorySummary(summary, {
            source: 'phone-check',
            extra: { durationMs, minutes, apps, evaluation, charName }
        });
        emitMemoryEvent('MEMORY_WRITE_RESULT', result);
        
        const frame = document.getElementById('app-frame');
        if (frame?.contentWindow) {
            frame.contentWindow.postMessage({
                type: 'PHONE_CHECK_ENDED',
                charName: charName,
                message: evaluation,
                apps: apps,
                duration: minutes
            }, '*');
        }
        
        phoneCheckLastEvaluation = '';
        phoneCheckAppsSeen = new Set();
        phoneCheckAIMessages = [];
        schedulePhoneCheck();
    };

    const cycleRandomApps = () => {
        if (!phoneCheckActive) return;
        const apps = getAllAppIds();
        if (!apps.length) return;
        const current = currentAppId;
        let next = apps[randomBetween(0, apps.length - 1)];
        if (apps.length > 1) {
            let safety = 0;
            while (next === current && safety < 100) {
                next = apps[randomBetween(0, apps.length - 1)];
                safety++;
            }
        }
        window.launchApp(next);
        phoneCheckAppsSeen.add(next);
        const delay = randomBetween(PHONE_CHECK_SWITCH_MIN, PHONE_CHECK_SWITCH_MAX);
        phoneCheckSwitchTimer = setTimeout(cycleRandomApps, delay);
    };

    const triggerPhoneCheck = async () => {
        if (!phoneCheckEnabled || phoneCheckActive) return;
        phoneCheckActive = true;
        phoneCheckAIMessages = [];
        const settings = getPhoneCheckDelaySettings();
        const minDurationMs = settings.minDuration * 60 * 1000;
        const maxDurationMs = settings.maxDuration * 60 * 1000;
        const duration = randomBetween(minDurationMs, maxDurationMs);
        phoneCheckEndsAt = Date.now() + duration;
        phoneCheckStartAt = Date.now();
        phoneCheckAppsSeen = new Set();
        const viewport = document.getElementById('app-viewport');
        viewport?.classList.add('phone-check-active');
        const messageEl = document.getElementById('phone-check-message');
        if (messageEl) {
            messageEl.dataset.locked = '1';
            const initialMsg = await getInitialPhoneCheckMessage();
            phoneCheckLastEvaluation = initialMsg;
            messageEl.textContent = initialMsg;
        }
        if (currentAppId) phoneCheckAppsSeen.add(currentAppId);
        updatePhoneCheckOverlay();
        phoneCheckTicker = setInterval(updatePhoneCheckOverlay, 1000);
        
        phoneCheckMessageTimer = setInterval(() => {
            updatePhoneCheckMessage();
        }, 5000 + randomBetween(0, 3000));
        
        const charName = localStorage.getItem('sx_char_name') || '角色';
        const frame = document.getElementById('app-frame');
        if (frame?.contentWindow) {
            frame.contentWindow.postMessage({
                type: 'PHONE_CHECK_STARTED',
                charName: charName,
                message: phoneCheckLastEvaluation || `${charName}開始查看你的手機...`
            }, '*');
        }
        
        cycleRandomApps();
        phoneCheckEndTimer = setTimeout(stopPhoneCheck, duration);
    };

    const saveCustomIcon = (appId, url) => {
        const map = loadCustomIcons();
        map[appId] = url;
        localStorage.setItem(CUSTOM_ICON_KEY, JSON.stringify(map));
    };

    const clearCustomIcon = (appId) => {
        const map = loadCustomIcons();
        delete map[appId];
        localStorage.setItem(CUSTOM_ICON_KEY, JSON.stringify(map));
    };

    const getAppIdFromNode = (node) => {
        if (!node) return '';
        if (node.dataset.appId) return node.dataset.appId;
        const raw = node.getAttribute('onclick') || '';
        const match = raw.match(/launchApp\(['"]([^'"]+)['"]\)/);
        return match?.[1] || '';
    };

    const applyCustomIcons = () => {
        const map = loadCustomIcons();
        const icons = document.querySelectorAll('.app-icon');
        icons.forEach(icon => {
            const appId = getAppIdFromNode(icon);
            if (!appId) return;
            const box = icon.querySelector('.icon-box');
            if (!box) return;

            if (!box.dataset.defaultBg) {
                box.dataset.defaultBg = box.getAttribute('style') || '';
            }

            const url = map[appId];
            if (url) {
                box.style.backgroundImage = `url(${url})`;
                box.style.backgroundSize = 'cover';
                box.style.backgroundPosition = 'center';
                box.style.backgroundRepeat = 'no-repeat';
                box.style.border = '1px solid rgba(255,255,255,0.35)';
                box.style.outline = '1px solid rgba(255,255,255,0.18)';
                const label = icon.querySelector('span');
                if (label) label.style.color = '#fff';
            } else {
                box.style.backgroundImage = '';
                box.setAttribute('style', box.dataset.defaultBg);
                const label = icon.querySelector('span');
                if (label) label.style.color = '';
            }
        });
    };

    // --- 5. 訊息監聽器 (處理來自 iframe 的訊息 & 同步主題/圖標) ---
    window.addEventListener('message', function(event) {
        const data = event.data;
        if (!data || typeof data !== 'object' || !data.type) return;

        if (currentAppId) {
            console.debug(`[app:${currentAppId}] message`, data.type, data.payload || '');
        }

        if (data.type && data.type.startsWith('MEMORY_')) {
            console.debug('[memory] message', data.type, data.payload || {});
        }

        // 調試：記錄所有收到的訊息類型
        console.log("[Main] 父視窗收到訊息類型:", data.type);
        
        // === 優先處理 KAKAOPAY_ARCADE_TOPUP ===
        if (data.type === 'KAKAOPAY_ARCADE_TOPUP') {
            console.log('[Main] 處理 KAKAOPAY_ARCADE_TOPUP:', data);
            const amount = data.amount;
            const coins = data.coins || amount;
            
            if (amount && amount > 0) {
                const STORAGE_KEY = 'sxiphone.kakaopay.ledger.v1';
                let ledgerData = { budget: 30000, transactions: [] };
                
                try {
                    const raw = localStorage.getItem(STORAGE_KEY);
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        ledgerData = {
                            budget: parsed.budget || 30000,
                            transactions: Array.isArray(parsed.transactions) ? parsed.transactions : []
                        };
                    }
                } catch (e) {}
                
                const now = new Date();
                const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                
                ledgerData.transactions.unshift({
                    id: `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
                    type: 'expense',
                    category: '街機',
                    amount: amount,
                    note: `街機廳儲值 - ${coins}金幣`,
                    date: dateStr,
                    createdAt: Date.now()
                });
                
                localStorage.setItem(STORAGE_KEY, JSON.stringify(ledgerData));
                
                const successMsg = {
                    type: 'KAKAOPAY_ARCADE_TOPUP_SUCCESS',
                    amount: amount,
                    coins: coins,
                    source: data.source || '街機廳',
                    timestamp: Date.now()
                };
                
                console.log('[Main] 發送成功訊息:', successMsg);
                
                const appFrame = document.getElementById('app-frame');
                if (appFrame && appFrame.contentWindow) {
                    appFrame.contentWindow.postMessage(successMsg, '*');
                }
                if (event.source) {
                    event.source.postMessage(successMsg, '*');
                }
                
                console.log('[Main] 街機廳儲值成功:', coins, '金幣');
            }
            return; // 處理完成，不進入 switch
        }
        
        switch (data.type) {
            case 'updateWallpaper':
                applyWallpaper(data.url);
                break;
            case 'updateLockscreen':
                applyLockscreen(data.url);
                break;
            case 'ALBUM_ADD_IMAGE':
                if (data.url) {
                    const albumKey = 'sx_album_uploaded_images';
                    let albumImages = [];
                    try {
                        const raw = localStorage.getItem(albumKey);
                        albumImages = raw ? JSON.parse(raw) : [];
                        if (!Array.isArray(albumImages)) albumImages = [];
                    } catch { albumImages = []; }
                    albumImages.unshift({
                        id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                        url: data.url,
                        source: data.source || 'uploaded',
                        createdAt: new Date().toISOString()
                    });
                    localStorage.setItem(albumKey, JSON.stringify(albumImages.slice(0, 200)));
                    const albumFrame = document.getElementById('app-frame');
                    if (albumFrame?.contentWindow) {
                        albumFrame.contentWindow.postMessage({
                            type: 'ALBUM_ADD_IMAGE',
                            url: data.url,
                            source: data.source || 'uploaded'
                        }, '*');
                    }
                }
                break;
            case 'GITHUB_SYNC_PUSH':
                window.syncToGitHub?.().then(() => {
                    event.source?.postMessage({ type: 'GITHUB_SYNC_RESULT', success: true, direction: 'push' }, '*');
                }).catch((err) => {
                    event.source?.postMessage({ type: 'GITHUB_SYNC_RESULT', success: false, direction: 'push', error: err.message }, '*');
                });
                break;
            case 'GITHUB_SYNC_PULL':
                window.syncFromGitHub?.().then((count) => {
                    event.source?.postMessage({ type: 'GITHUB_SYNC_RESULT', success: true, direction: 'pull', count }, '*');
                    applyThemeFromStorage();
                    applyCustomIcons();
                }).catch((err) => {
                    event.source?.postMessage({ type: 'GITHUB_SYNC_RESULT', success: false, direction: 'pull', error: err.message }, '*');
                });
                break;
            case 'DATA_RESTORED':
                console.log('[Main] 收到資料還原通知，刷新 UI...');
                applyThemeFromStorage();
                applyCustomIcons();
                applyLanguageToUI();
                window.dispatchEvent(new Event('sx-app-layout-updated'));
                break;
            case 'USER_SETTINGS_UPDATED':
                if (data.payload?.name) {
                    localStorage.setItem('sx_user_name', data.payload.name);
                    console.log('[Main] 用戶名稱已更新:', data.payload.name);
                }
                break;
            case 'GITHUB_STATUS':
                event.source?.postMessage({
                    type: 'GITHUB_STATUS_RESULT',
                    connected: !!localStorage.getItem(GITHUB_TOKEN_KEY),
                    username: localStorage.getItem(GITHUB_USER_KEY) || '',
                    repo: localStorage.getItem(GITHUB_REPO_KEY) || ''
                }, '*');
                break;
            case 'closeApp':
                window.closeApp();
                break;
            case 'DELIVERY_ORDER_TO_CHAT':
                if (data.order) {
                    const chatFrame = document.getElementById('app-frame');
                    if (chatFrame?.contentWindow) {
                        chatFrame.contentWindow.postMessage({
                            type: 'DELIVERY_ORDER',
                            order: data.order,
                            message: data.message
                        }, '*');
                    }
                    console.log('[Main] 外送訂單已發送到 chat:', data.order);
                }
                break;
            case 'HIDE_STATUS_BAR':
                (function() {
                    const statusBar = document.querySelector('.status-bar');
                    if (statusBar) statusBar.style.display = 'none';
                })();
                break;
            case 'SHOW_STATUS_BAR':
                (function() {
                    const statusBar = document.querySelector('.status-bar');
                    let themeConfig = {};
                    try { themeConfig = JSON.parse(localStorage.getItem('sx_custom_theme_config') || '{}'); } catch {}
                    if (statusBar && !themeConfig.hideTopbar) {
                        statusBar.style.display = '';
                    }
                })();
                break;
            case 'openApp':
                if (data.appId) {
                    window.launchApp(data.appId);
                    if (data.subPanel) {
                        setTimeout(() => {
                            const appFrame = document.getElementById('app-frame');
                            if (appFrame?.contentWindow) {
                                appFrame.contentWindow.postMessage({
                                    type: 'OPEN_SUB_PANEL',
                                    panelId: data.subPanel
                                }, '*');
                            }
                        }, 300);
                    }
                }
                break;
            case 'KAKAOPAY_ARCADE_TOPUP':
                console.log('[Main] 收到 KAKAOPAY_ARCADE_TOPUP:', data);
                (function(evtSource) {
                    const amount = data.amount;
                    const coins = data.coins || amount;
                    console.log('[Main] amount:', amount, 'coins:', coins);
                    if (!amount || amount <= 0) return;
                    
                    const STORAGE_KEY = 'sxiphone.kakaopay.ledger.v1';
                    let ledgerData = { budget: 30000, transactions: [] };
                    
                    try {
                        const raw = localStorage.getItem(STORAGE_KEY);
                        if (raw) {
                            const parsed = JSON.parse(raw);
                            ledgerData = {
                                budget: parsed.budget || 30000,
                                transactions: Array.isArray(parsed.transactions) ? parsed.transactions : []
                            };
                        }
                    } catch (e) {}
                    
                    const now = new Date();
                    const year = now.getFullYear();
                    const month = String(now.getMonth() + 1).padStart(2, '0');
                    const day = String(now.getDate()).padStart(2, '0');
                    const dateStr = `${year}-${month}-${day}`;
                    
                    ledgerData.transactions.unshift({
                        id: `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
                        type: 'expense',
                        category: '街機',
                        amount: amount,
                        note: `街機廳儲值 - ${coins}金幣`,
                        date: dateStr,
                        createdAt: Date.now()
                    });
                    
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(ledgerData));
                    
                    const successMsg = {
                        type: 'KAKAOPAY_ARCADE_TOPUP_SUCCESS',
                        amount: amount,
                        coins: coins,
                        source: data.source || '街機廳',
                        timestamp: Date.now()
                    };
                    
                    console.log('[Main] Sending success message to arcade:', successMsg);
                    
                    // 優先發送給 app-frame 的 contentWindow
                    const appFrame = document.getElementById('app-frame');
                    if (appFrame?.contentWindow) {
                        appFrame.contentWindow.postMessage(successMsg, '*');
                    } else if (evtSource) {
                        evtSource.postMessage(successMsg, '*');
                    }
                    
                    console.log('[Main] 街機廳儲值成功:', coins, '金幣 (NT$', amount, ')');
                })(event.source);
                break;
            case 'APP_FOLDER_UPDATE':
                if (data.appId && data.payload) {
                    saveAppFolder(data.appId, data.payload, { source: 'app', syncedAt: new Date().toISOString() });
                }
                break;
            case 'REQUEST_APP_FOLDER_SYNC':
                if (data.appId) {
                    syncAppFolderFromStorage(data.appId);
                }
                break;
            case 'THEME_MODE_CHANGED':
                applyRootTheme(data.mode, null);
                // 廣播外觀設定到當前應用程式
                const currentMode = data.mode;
                const appFrame = document.getElementById('app-frame');
                if (appFrame?.contentWindow) {
                    let settingsToSend = null;
                    // 優先使用已儲存的外觀設定
                    const savedGlobalAppearance = localStorage.getItem('sx_global_appearance_saved');
                    if (savedGlobalAppearance) {
                        try { settingsToSend = JSON.parse(savedGlobalAppearance); } catch (e) {}
                    }
                    if (!settingsToSend) {
                        if (currentMode === 'custom-light') {
                            const raw = localStorage.getItem('sx_app_interface_custom_light');
                            if (raw) {
                                try { settingsToSend = JSON.parse(raw); } catch (e) {}
                            }
                        } else if (currentMode === 'custom-dark') {
                            const raw = localStorage.getItem('sx_app_interface_custom_dark');
                            if (raw) {
                                try { settingsToSend = JSON.parse(raw); } catch (e) {}
                            }
                        }
                    }
                    if (settingsToSend) {
                        appFrame.contentWindow.postMessage({
                            type: 'THEME_MODE_CHANGED',
                            mode: currentMode,
                            settings: settingsToSend
                        }, '*');
                    }
                }
                // 同步到雲端
                window.syncToGitHub?.().catch(err => console.warn('[Main] 主題同步失敗:', err));
                break;
            case 'THEME_CHANGED':
                // 轉發主題變更到 chat app
                if (data.theme) {
                    const appFrame = document.getElementById('app-frame');
                    if (appFrame?.contentWindow) {
                        appFrame.contentWindow.postMessage({
                            type: 'THEME_CHANGED',
                            theme: data.theme
                        }, '*');
                    }
                    console.log('[Main] 主題已變更:', data.theme.name);
                }
                break;
            case 'APPEARANCE_THEME_CHANGED':
                // 轉發外觀變更到所有應用程式
                if (data.config) {
                    const appFrame = document.getElementById('app-frame');
                    if (appFrame?.contentWindow) {
                        appFrame.contentWindow.postMessage({
                            type: 'APPEARANCE_THEME_CHANGED',
                            config: data.config
                        }, '*');
                    }
                    console.log('[Main] 外觀主題已變更');
                }
                break;
            case 'CUSTOM_THEME_UPDATED':
            case 'CUSTOM_THEME_APPLY':
                // 轉發自訂主題到所有應用程式
                if (data.config) {
                    const appFrame = document.getElementById('app-frame');
                    if (appFrame?.contentWindow) {
                        appFrame.contentWindow.postMessage({
                            type: 'APPEARANCE_THEME_CHANGED',
                            config: data.config
                        }, '*');
                    }
                    console.log('[Main] 自訂主題已更新');
                }
                break;
            case 'GLOBAL_APPEARANCE_SAVED':
                // 儲存全域外觀設定並廣播到所有應用程式
                if (data.settings) {
                    localStorage.setItem('sx_global_appearance_saved', JSON.stringify(data.settings));
                    const appFrame = document.getElementById('app-frame');
                    if (appFrame?.contentWindow) {
                        appFrame.contentWindow.postMessage({
                            type: 'APPEARANCE_THEME_CHANGED',
                            config: data.settings
                        }, '*');
                        appFrame.contentWindow.postMessage({
                            type: 'GLOBAL_APPEARANCE_SAVED',
                            mode: data.mode,
                            settings: data.settings
                        }, '*');
                    }
                    console.log('[Main] 全域外觀設定已儲存');
                }
                break;
            case 'THEME_ACCENT_CHANGED':
                applyRootTheme(null, data.accent);
                break;
            case 'THEME_IMAGE_UPDATED':
                if (data.accent) applyRootTheme(null, data.accent);
                if (data.mode) applyRootTheme(data.mode, null);
                break;
            case 'THEME_TEXT_COLOR_CHANGED':
                if (data.color) applyRootTheme(null, null, { textColor: data.color });
                break;
            case 'THEME_ICON_BORDER_COLOR_CHANGED':
                if (data.color) applyRootTheme(null, null, { iconBorderColor: data.color });
                break;
            case 'THEME_APP_BG_CHANGED':
                if (data.color) applyRootTheme(null, null, { appBgColor: data.color, appBgAlpha: data.alpha });
                break;
            case 'settingsUpdated':
                applyLanguageToUI();
                break;
            case 'LANGUAGE_CHANGED':
                if (data.lang) {
                    localStorage.setItem('sxiphone_lang', data.lang);
                    document.documentElement.lang = normalizeLang(data.lang);
                    applyLanguageToUI();
                }
                break;
            case 'WIDGET_LAYOUT_UPDATED':
                if (Array.isArray(data.layout)) {
                    localStorage.setItem('sx_widget_layout', JSON.stringify(data.layout));
                    window.dispatchEvent(new Event('sx-home-widget-layout-updated'));
                }
                break;
            case 'APP_LAYOUT_UPDATED':
                if (Array.isArray(data.appLayout)) {
                    localStorage.setItem('sx_app_layout', JSON.stringify(data.appLayout));
                }
                if (Array.isArray(data.hiddenApps)) {
                    localStorage.setItem('sx_hidden_apps', JSON.stringify(data.hiddenApps));
                }
                // 重新渲染首頁
                window.dispatchEvent(new Event('sx-app-layout-updated'));
                break;
            case 'SET_CUSTOM_ICON':
                if (data.appId && data.url) {
                    saveCustomIcon(data.appId, data.url);
                    applyCustomIcons();
                }
                break;
            case 'CLEAR_CUSTOM_ICON':
                if (data.appId) {
                    clearCustomIcon(data.appId);
                    applyCustomIcons();
                }
                break;
            case 'TOGGLE_BALL':
                if (floatingBall) {
                    if (data.enabled) {
                        floatingBall.classList.remove('hidden');
                    } else {
                        floatingBall.classList.add('hidden');
                        floatingPanel?.classList.add('hidden');
                    }
                }
                break;
            case 'TOGGLE_BALL_FUNCTION':
                if (data.function) {
                    const key = `sx_ball_func_${data.function}`;
                    localStorage.setItem(key, data.enabled ? '1' : '0');
                    renderFloatingPanel();
                }
                break;
            case 'EXECUTE_FUNCTION':
                if (data.function) {
                    triggerBallFunction(data.function);
                }
                break;
            case 'PHONE_CHECK_TOGGLE':
                phoneCheckEnabled = data.enabled === true;
                localStorage.setItem(PHONE_CHECK_KEY, phoneCheckEnabled ? '1' : '0');
                if (!phoneCheckEnabled) {
                    stopPhoneCheck();
                }
                break;
            case 'MEMORY_CHAT_EVENT':
                handleMemoryChatEvent(data.payload, event.source);
                break;
            case 'MEMORY_REQUEST_SUMMARY':
                handleMemoryRequestSummary(data.payload, event.source);
                break;
            case 'MEMORY_INTERVAL_UPDATED':
                if (data.payload && Number.isFinite(Number(data.payload.interval))) {
                    memoryState.interval = clampNumber(Number(data.payload.interval), MEMORY_MIN_INTERVAL, MEMORY_MAX_INTERVAL);
                    localStorage.setItem(MEMORY_INTERVAL_KEY, String(memoryState.interval));
                }
                break;
            case 'MEMORY_REQUEST_HISTORY':
                handleMemoryRequestHistory(data.payload, event.source);
                break;
            case 'MEMORY_EXPORT_REQUEST':
                handleMemoryExport(data.payload, event.source);
                break;
            case 'MEMORY_CLEAR_REQUEST':
                clearMemoryForUser(data.payload, event.source);
                break;
            case 'MEMORY_SEARCH':
                if (newMemorySystem && newMemorySystem.isInitialized) {
                    newMemorySystem.search(data.payload?.query || '', data.payload?.options || {})
                        .then(results => emitMemoryEvent('MEMORY_SEARCH_RESULT', { results }, event.source))
                        .catch(e => emitMemoryEvent('MEMORY_SEARCH_RESULT', { results: [], error: e.message }, event.source));
                } else {
                    emitMemoryEvent('MEMORY_SEARCH_RESULT', { results: [], error: 'new-system-not-available' }, event.source);
                }
                break;
            case 'MEMORY_BREATH':
                if (newMemorySystem && newMemorySystem.isInitialized) {
                    newMemorySystem.breath(data.payload?.options || {})
                        .then(result => emitMemoryEvent('MEMORY_BREATH_RESULT', result, event.source))
                        .catch(e => emitMemoryEvent('MEMORY_BREATH_RESULT', { surfaced: [], feels: [], error: e.message }, event.source));
                } else {
                    emitMemoryEvent('MEMORY_BREATH_RESULT', { surfaced: [], feels: [], error: 'new-system-not-available' }, event.source);
                }
                break;
            case 'MEMORY_TRACE':
                if (newMemorySystem && newMemorySystem.isInitialized && data.payload?.id) {
                    newMemorySystem.trace(data.payload.id, data.payload.updates || {})
                        .then(result => emitMemoryEvent('MEMORY_TRACE_RESULT', { success: true, memory: result }, event.source))
                        .catch(e => emitMemoryEvent('MEMORY_TRACE_RESULT', { success: false, error: e.message }, event.source));
                } else {
                    emitMemoryEvent('MEMORY_TRACE_RESULT', { success: false, error: 'invalid-request' }, event.source);
                }
                break;
            case 'MEMORY_DREAM':
                if (newMemorySystem && newMemorySystem.isInitialized) {
                    newMemorySystem.dream()
                        .then(result => emitMemoryEvent('MEMORY_DREAM_RESULT', result, event.source))
                        .catch(e => emitMemoryEvent('MEMORY_DREAM_RESULT', { crystallized: false, error: e.message }, event.source));
                } else {
                    emitMemoryEvent('MEMORY_DREAM_RESULT', { crystallized: false, error: 'new-system-not-available' }, event.source);
                }
                break;
            case 'MEMORY_SLEEP':
                if (newMemorySystem && newMemorySystem.isInitialized) {
                    newMemorySystem.triggerSleep(data.payload?.reason || 'manual')
                        .then(result => emitMemoryEvent('MEMORY_SLEEP_RESULT', result, event.source))
                        .catch(e => emitMemoryEvent('MEMORY_SLEEP_RESULT', { success: false, error: e.message }, event.source));
                } else {
                    emitMemoryEvent('MEMORY_SLEEP_RESULT', { success: false, error: 'new-system-not-available' }, event.source);
                }
                break;
            case 'MEMORY_REPORT':
                if (newMemorySystem && newMemorySystem.isInitialized) {
                    newMemorySystem.generateMemoryReport(data.payload?.options || {})
                        .then(result => emitMemoryEvent('MEMORY_REPORT_RESULT', result, event.source))
                        .catch(e => emitMemoryEvent('MEMORY_REPORT_RESULT', { error: e.message }, event.source));
                } else {
                    emitMemoryEvent('MEMORY_REPORT_RESULT', { error: 'new-system-not-available' }, event.source);
                }
                break;
            case 'CONVERSATION_END':
                if (newMemorySystem && newMemorySystem.isInitialized) {
                    newMemorySystem.onConversationEnd();
                }
                break;
            case 'MEMORY_MIGRATE':
                migrateOldMemories()
                    .then(result => emitMemoryEvent('MEMORY_MIGRATE_RESULT', result, event.source))
                    .catch(e => emitMemoryEvent('MEMORY_MIGRATE_RESULT', { migrated: 0, failed: 0, error: e.message }, event.source));
                break;
            case 'MEMORY_INIT':
                initNewMemorySystem()
                    .then(() => emitMemoryEvent('MEMORY_INIT_RESULT', { success: !!newMemorySystem }, event.source))
                    .catch(e => emitMemoryEvent('MEMORY_INIT_RESULT', { success: false, error: e.message }, event.source));
                break;
            case 'MEMORY_POOL_TRIGGER':
                handleMemoryPoolTrigger(data.payload, event.source);
                break;
            case 'MEMORY_POOL_PREMISE':
                handleMemoryPoolPremise(data.payload, event.source);
                break;
            case 'MEMORY_POOL_STATS':
                const mpStats = memoryPool || window.memoryPool;
                if (mpStats && mpStats.isInitialized) {
                    emitMemoryEvent('MEMORY_POOL_STATS_RESULT', mpStats.getStats(), event.source);
                } else {
                    emitMemoryEvent('MEMORY_POOL_STATS_RESULT', { isInitialized: false }, event.source);
                }
                break;
            case 'MEMORY_WRITE_RESULT':
                // 記憶寫入結果，僅記錄不需要額外處理
                console.log('[Main] MEMORY_WRITE_RESULT:', data.payload);
                break;
            case 'UNIFIED_MEMORY_RECALL':
                if (unifiedMemory && unifiedMemory.isInitialized) {
                    unifiedMemory.recall(data.payload?.query || '', data.payload?.options || {})
                        .then(result => emitMemoryEvent('UNIFIED_MEMORY_RECALL_RESULT', result, event.source))
                        .catch(e => emitMemoryEvent('UNIFIED_MEMORY_RECALL_RESULT', { memories: [], error: e.message }, event.source));
                } else {
                    initUnifiedMemorySystem()
                        .then(() => unifiedMemory?.recall(data.payload?.query || '', data.payload?.options || {}))
                        .then(result => emitMemoryEvent('UNIFIED_MEMORY_RECALL_RESULT', result, event.source))
                        .catch(e => emitMemoryEvent('UNIFIED_MEMORY_RECALL_RESULT', { memories: [], error: e.message }, event.source));
                }
                break;
            case 'UNIFIED_MEMORY_MEMORIZE':
                if (unifiedMemory && unifiedMemory.isInitialized && data.payload?.content) {
                    unifiedMemory.memorize(data.payload.content, data.payload?.options || {})
                        .then(result => emitMemoryEvent('UNIFIED_MEMORY_MEMORIZE_RESULT', result, event.source))
                        .catch(e => emitMemoryEvent('UNIFIED_MEMORY_MEMORIZE_RESULT', { success: false, error: e.message }, event.source));
                } else {
                    emitMemoryEvent('UNIFIED_MEMORY_MEMORIZE_RESULT', { success: false, error: 'not_initialized' }, event.source);
                }
                break;
            case 'UNIFIED_MEMORY_FORGET':
                if (unifiedMemory && unifiedMemory.isInitialized && data.payload?.id) {
                    unifiedMemory.forget(data.payload.id, data.payload?.options || {})
                        .then(result => emitMemoryEvent('UNIFIED_MEMORY_FORGET_RESULT', result, event.source))
                        .catch(e => emitMemoryEvent('UNIFIED_MEMORY_FORGET_RESULT', { success: false, error: e.message }, event.source));
                } else {
                    emitMemoryEvent('UNIFIED_MEMORY_FORGET_RESULT', { success: false, error: 'not_initialized' }, event.source);
                }
                break;
            case 'UNIFIED_MEMORY_SLEEP':
                if (unifiedMemory && unifiedMemory.isInitialized) {
                    unifiedMemory.sleep(data.payload?.reason || 'manual')
                        .then(result => emitMemoryEvent('UNIFIED_MEMORY_SLEEP_RESULT', result, event.source))
                        .catch(e => emitMemoryEvent('UNIFIED_MEMORY_SLEEP_RESULT', { success: false, error: e.message }, event.source));
                } else {
                    emitMemoryEvent('UNIFIED_MEMORY_SLEEP_RESULT', { success: false, error: 'not_initialized' }, event.source);
                }
                break;
            case 'UNIFIED_MEMORY_AWAKEN':
                if (unifiedMemory && unifiedMemory.isInitialized) {
                    unifiedMemory.awaken()
                        .then(result => emitMemoryEvent('UNIFIED_MEMORY_AWAKEN_RESULT', result, event.source))
                        .catch(e => emitMemoryEvent('UNIFIED_MEMORY_AWAKEN_RESULT', { success: false, error: e.message }, event.source));
                } else {
                    emitMemoryEvent('UNIFIED_MEMORY_AWAKEN_RESULT', { success: false, error: 'not_initialized' }, event.source);
                }
                break;
            case 'UNIFIED_MEMORY_SET_IDENTITY':
                if (unifiedMemory && unifiedMemory.isInitialized && data.payload?.identity) {
                    const identity = unifiedMemory.setIdentity(data.payload.identity);
                    emitMemoryEvent('UNIFIED_MEMORY_SET_IDENTITY_RESULT', { success: true, identity }, event.source);
                } else {
                    emitMemoryEvent('UNIFIED_MEMORY_SET_IDENTITY_RESULT', { success: false, error: 'not_initialized' }, event.source);
                }
                break;
            case 'UNIFIED_MEMORY_GET_STATS':
                if (unifiedMemory && unifiedMemory.isInitialized) {
                    emitMemoryEvent('UNIFIED_MEMORY_GET_STATS_RESULT', unifiedMemory.getStats(), event.source);
                } else {
                    emitMemoryEvent('UNIFIED_MEMORY_GET_STATS_RESULT', { isInitialized: false }, event.source);
                }
                break;
            case 'UNIFIED_MEMORY_EXPORT':
                if (unifiedMemory && unifiedMemory.isInitialized) {
                    unifiedMemory.export()
                        .then(result => emitMemoryEvent('UNIFIED_MEMORY_EXPORT_RESULT', result, event.source))
                        .catch(e => emitMemoryEvent('UNIFIED_MEMORY_EXPORT_RESULT', { error: e.message }, event.source));
                } else {
                    emitMemoryEvent('UNIFIED_MEMORY_EXPORT_RESULT', { error: 'not_initialized' }, event.source);
                }
                break;
            case 'UNIFIED_MEMORY_IMPORT':
                if (unifiedMemory && unifiedMemory.isInitialized && data.payload?.data) {
                    unifiedMemory.import(data.payload.data)
                        .then(result => emitMemoryEvent('UNIFIED_MEMORY_IMPORT_RESULT', result, event.source))
                        .catch(e => emitMemoryEvent('UNIFIED_MEMORY_IMPORT_RESULT', { success: false, error: e.message }, event.source));
                } else {
                    emitMemoryEvent('UNIFIED_MEMORY_IMPORT_RESULT', { success: false, error: 'not_initialized' }, event.source);
                }
                break;
            case 'UPDATE_BALL_STYLE':
                if (data.payload) {
                    localStorage.setItem('sx_ball_style', JSON.stringify(data.payload));
                    applyBallStyleFromStorage();
                }
                break;
            case 'TOUCH_ENV_SYNC': {
                const payload = data.payload || {};
                if (payload.sx_nova_api_url) localStorage.setItem('sx_nova_api_url', payload.sx_nova_api_url);
                if (payload.sx_nova_api_key) localStorage.setItem('sx_nova_api_key', payload.sx_nova_api_key);
                if (payload.sx_theme_mode) applyRootTheme(payload.sx_theme_mode, null);
                if (payload.sx_theme_accent) applyRootTheme(null, payload.sx_theme_accent);
                if (payload.sx_theme_text_color) applyRootTheme(null, null, { textColor: payload.sx_theme_text_color });
                if (payload.sx_theme_app_bg_color) applyRootTheme(null, null, { appBgColor: payload.sx_theme_app_bg_color });
                break;
            }
            case 'REQUEST_WORLD_BOOK_SYNC': {
                const frame = document.getElementById('app-frame');
                if (frame && frame.contentWindow) {
                    frame.contentWindow.postMessage({ type: 'REQUEST_WORLD_BOOK_SYNC' }, '*');
                }
                if (event.source) {
                    event.source.postMessage({ type: 'WORLD_BOOK_SYNC_READY' }, '*');
                }
                break;
            }
            case 'WORLD_BOOK_UPDATED': {
                const frame = document.getElementById('app-frame');
                if (frame && frame.contentWindow) {
                    frame.contentWindow.postMessage({ type: 'WORLD_BOOK_UPDATED' }, '*');
                }
                if (event.source) {
                    event.source.postMessage({ type: 'WORLD_BOOK_SYNC_READY' }, '*');
                }
                break;
            }
            case 'CUSTOM_THEME_UPDATED':
            case 'CUSTOM_THEME_APPLY':
                if (data.config && typeof data.config === 'object') {
                    localStorage.setItem('sx_custom_theme_config', JSON.stringify(data.config));
                    applyCustomTheme(data.config);
                }
                break;
            case 'APP_INTERFACE_UPDATED':
                if (data.config && typeof data.config === 'object') {
                    const appId = data.appId || 'global';
                    const key = appId === 'global' ? 'sx_app_interface_config' : `sx_app_interface_${appId}`;
                    localStorage.setItem(key, JSON.stringify(data.config));
                    injectAppInterfaceToFrame(data.config, appId);
                }
                break;
            default:
                // 特別處理 KAKAOPAY_ARCADE_TOPUP（防止 case 匹配失敗）
                if (data.type === 'KAKAOPAY_ARCADE_TOPUP') {
                    console.log('[Main] 在 default 中處理 KAKAOPAY_ARCADE_TOPUP:', data);
                    const amount = data.amount;
                    const coins = data.coins || amount;
                    console.log('[Main] amount:', amount, 'coins:', coins);
                    if (!amount || amount <= 0) {
                        console.warn('[Main] Invalid amount:', amount);
                        return;
                    }
                    
                    const STORAGE_KEY = 'sxiphone.kakaopay.ledger.v1';
                    let ledgerData = { budget: 30000, transactions: [] };
                    
                    try {
                        const raw = localStorage.getItem(STORAGE_KEY);
                        if (raw) {
                            const parsed = JSON.parse(raw);
                            ledgerData = {
                                budget: parsed.budget || 30000,
                                transactions: Array.isArray(parsed.transactions) ? parsed.transactions : []
                            };
                        }
                    } catch (e) {}
                    
                    const now = new Date();
                    const year = now.getFullYear();
                    const month = String(now.getMonth() + 1).padStart(2, '0');
                    const day = String(now.getDate()).padStart(2, '0');
                    const dateStr = `${year}-${month}-${day}`;
                    
                    ledgerData.transactions.unshift({
                        id: `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
                        type: 'expense',
                        category: '街機',
                        amount: amount,
                        note: `街機廳儲值 - ${coins}金幣`,
                        date: dateStr,
                        createdAt: Date.now()
                    });
                    
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(ledgerData));
                    console.log('[Main] Ledger updated');
                    
                    const successMsg = {
                        type: 'KAKAOPAY_ARCADE_TOPUP_SUCCESS',
                        amount: amount,
                        coins: coins,
                        source: data.source || '街機廳',
                        timestamp: Date.now()
                    };
                    
                    console.log('[Main] Sending success message:', successMsg);
                    
                    // 嘗試多種方式發送成功訊息
                    const appFrame = document.getElementById('app-frame');
                    console.log('[Main] appFrame:', appFrame, 'contentWindow:', appFrame?.contentWindow);
                    
                    if (appFrame && appFrame.contentWindow) {
                        console.log('[Main] Sending to app-frame.contentWindow');
                        appFrame.contentWindow.postMessage(successMsg, '*');
                    }
                    
                    // 也嘗試發送給 event.source
                    if (event.source) {
                        console.log('[Main] Sending to event.source');
                        event.source.postMessage(successMsg, '*');
                    }
                    
                    // 廣播到所有可能的目標
                    window.postMessage(successMsg, '*');
                    
                    console.log('[Main] 街機廳儲值成功:', coins, '金幣 (NT$', amount, ')');
                    return;
                }
                console.warn("未知的訊息類型:", data.type);
        }
    });

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
        fontBoot: "'Great Vibes', cursive",
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

    const applyCustomTheme = (config) => {
        const root = document.documentElement.style;
        const def = defaultCustomTheme();

        root.setProperty('--sx-text-primary', config.textPrimary || def.textPrimary);
        root.setProperty('--sx-text-secondary', config.textSecondary || def.textSecondary);
        root.setProperty('--sx-text-heading', config.textHeading || def.textHeading);
        root.setProperty('--sx-text-link', config.textLink || def.textLink);
        root.setProperty('--sx-border-width', (config.borderWidth || def.borderWidth) + 'px');
        root.setProperty('--sx-border-color', config.borderColor || def.borderColor);
        root.setProperty('--sx-card-border-width', (config.cardBorderWidth || def.cardBorderWidth) + 'px');
        root.setProperty('--sx-card-radius', (config.cardRadius || def.cardRadius) + 'px');
        root.setProperty('--sx-element-gap', (config.elementGap || def.elementGap) + 'px');
        root.setProperty('--sx-statusbar-padding', (config.statusbarPadding || def.statusbarPadding) + 'px');
        root.setProperty('--sx-home-padding-top', (config.homePaddingTop || def.homePaddingTop) + 'px');
        root.setProperty('--sx-home-padding-bottom', (config.homePaddingBottom || def.homePaddingBottom) + 'px');
        root.setProperty('--sx-icon-gap', (config.iconGap || def.iconGap) + 'px');
        root.setProperty('--sx-font-size', (config.fontSize || def.fontSize) + 'px');
        root.setProperty('--sx-heading-size', (config.headingSize || def.headingSize) + 'px');
        root.setProperty('--sx-app-label-size', (config.appLabelSize || def.appLabelSize) + 'px');
        root.setProperty('--sx-time-size', (config.timeSize || def.timeSize) + 'px');
        root.setProperty('--sx-date-size', (config.dateSize || def.dateSize) + 'px');
        root.setProperty('--sx-phone-border-width', (config.phoneBorderWidth || def.phoneBorderWidth) + 'px');
        root.setProperty('--sx-phone-border-color', config.phoneBorderColor || def.phoneBorderColor);
        root.setProperty('--sx-phone-border-radius', (config.phoneBorderRadius || def.phoneBorderRadius) + 'px');
        root.setProperty('--sx-phone-width-ratio', (config.phoneWidthRatio || def.phoneWidthRatio) + '%');
        root.setProperty('--sx-battery-level', (config.batteryLevel || def.batteryLevel) + '%');
        root.setProperty('--sx-battery-low-warning', (config.batteryLowWarning || def.batteryLowWarning) + '%');
        root.setProperty('--sx-battery-low-color', config.batteryLowColor || def.batteryLowColor);
        root.setProperty('--sx-font-primary', config.fontPrimary || def.fontPrimary);
        root.setProperty('--sx-font-lock-time', config.fontLockTime || def.fontLockTime);
        root.setProperty('--sx-font-boot', config.fontBoot || def.fontBoot);
        root.setProperty('--sx-font-chat', config.fontChat || def.fontChat);
        root.setProperty('--sx-font-app-title', config.fontAppTitle || def.fontAppTitle);
        root.setProperty('--sx-icon-size', (config.iconSize || def.iconSize) + 'px');
        root.setProperty('--sx-icon-radius', (config.iconRadius || def.iconRadius) + 'px');
        root.setProperty('--sx-icon-inner-size', (config.iconInnerSize || def.iconInnerSize) + 'px');
        root.setProperty('--sx-icon-opacity', (config.iconOpacity || def.iconOpacity) / 100);
        root.setProperty('--sx-icon-shadow', config.iconShadow || def.iconShadow);
        root.setProperty('--sx-app-bg-color', config.appBgColor || def.appBgColor);
        root.setProperty('--sx-app-bg-opacity', (config.appBgOpacity || def.appBgOpacity) / 100);
        root.setProperty('--sx-app-bg-blur', (config.appBgBlur || def.appBgBlur) + 'px');
        root.setProperty('--sx-app-bg-saturate', (config.appBgSaturate || def.appBgSaturate) + '%');

        const phoneContainer = document.getElementById('phone-container');
        if (phoneContainer) {
            phoneContainer.style.borderWidth = (config.phoneBorderWidth || def.phoneBorderWidth) + 'px';
            phoneContainer.style.borderColor = config.phoneBorderColor || def.phoneBorderColor;
            phoneContainer.style.borderRadius = (config.phoneBorderRadius || def.phoneBorderRadius) + 'px';
        }

        const statusBar = document.querySelector('.status-bar');
        if (statusBar) {
            const hideTopbar = config.hideTopbar || false;
            const hideTopbarHome = config.hideTopbarHome || false;
            const viewport = document.getElementById('app-viewport');
            const isInApp = viewport && viewport.classList.contains('active');
            
            if (hideTopbar && (isInApp || hideTopbarHome)) {
                statusBar.style.display = 'none';
            } else {
                statusBar.style.display = 'flex';
                statusBar.style.padding = `${config.statusbarPadding || def.statusbarPadding}px 30px`;
                if (config.statusbarPosition === 'bottom') {
                    statusBar.style.top = 'auto';
                    statusBar.style.bottom = '0';
                } else {
                    statusBar.style.top = '0';
                    statusBar.style.bottom = 'auto';
                }
            }
        }

        const homeScreen = document.getElementById('home-screen');
        if (homeScreen) {
            homeScreen.style.paddingTop = (config.homePaddingTop || def.homePaddingTop) + 'px';
            homeScreen.style.paddingBottom = (config.homePaddingBottom || def.homePaddingBottom) + 'px';
        }

        const timeEl = document.getElementById('time');
        if (timeEl) {
            timeEl.style.fontSize = (config.timeSize || def.timeSize) + 'px';
            timeEl.style.fontFamily = config.fontLockTime || def.fontLockTime;
        }

        const dateEl = document.getElementById('date');
        if (dateEl) {
            dateEl.style.fontSize = (config.dateSize || def.dateSize) + 'px';
        }

        if (config.fontCustomUrl) {
            const existingLink = document.getElementById('custom-font-link');
            if (existingLink) existingLink.remove();
            const link = document.createElement('link');
            link.id = 'custom-font-link';
            link.rel = 'stylesheet';
            link.href = config.fontCustomUrl;
            document.head.appendChild(link);
            if (config.fontCustomName) {
                root.setProperty('--sx-font-custom', config.fontCustomName);
            }
        }

        document.body.style.fontFamily = config.fontPrimary || def.fontPrimary;
        root.setProperty('--sx-text', config.textPrimary || def.textPrimary);

        const batteryIcon = document.querySelector('.status-icons .fa-battery-full, .status-icons .fa-battery-three-quarters, .status-icons .fa-battery-half, .status-icons .fa-battery-quarter, .status-icons .fa-battery-empty');
        if (batteryIcon) {
            const level = config.batteryLevel || def.batteryLevel;
            const lowWarning = config.batteryLowWarning || def.batteryLowWarning;
            if (level <= lowWarning) {
                batteryIcon.style.color = config.batteryLowColor || def.batteryLowColor;
            } else {
                batteryIcon.style.color = '';
            }
        }

        const frame = document.getElementById('app-frame');
        if (frame?.contentWindow) {
            frame.contentWindow.postMessage({ type: 'CUSTOM_THEME_SYNC', config }, '*');
        }
    };

    const loadCustomThemeFromStorage = () => {
        try {
            const raw = localStorage.getItem('sx_custom_theme_config');
            if (!raw) return;
            const config = JSON.parse(raw);
            applyCustomTheme(config);
        } catch (err) {
            console.warn('載入自訂主題失敗', err);
        }
    };

    const defaultAppInterface = () => ({
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
        shadowIntensity: 25,
        blurAmount: 0,
        animationSpeed: 'normal',
        customCss: ''
    });

    const getAnimationDuration = (speed) => {
        switch (speed) {
            case 'none': return '0s';
            case 'fast': return '0.15s';
            case 'slow': return '0.4s';
            default: return '0.25s';
        }
    };

    const injectAppInterfaceToFrame = (config, appId = 'global') => {
        const frame = document.getElementById('app-frame');
        if (!frame?.contentWindow?.document) return;

        const def = defaultAppInterface();
        const cfg = { ...def, ...config };

        const styleId = appId === 'global' ? 'sx-app-interface-style' : `sx-app-interface-style-${appId}`;
        let styleEl = frame.contentWindow.document.getElementById(styleId);
        if (!styleEl) {
            styleEl = frame.contentWindow.document.createElement('style');
            styleEl.id = styleId;
            frame.contentWindow.document.head.appendChild(styleEl);
        }

        const animDuration = getAnimationDuration(cfg.animationSpeed);
        const shadowValue = cfg.shadowIntensity > 0 
            ? `0 ${cfg.shadowIntensity * 0.5}px ${cfg.shadowIntensity}px rgba(0,0,0,0.25)`
            : 'none';
        const blurValue = cfg.blurAmount > 0 
            ? `blur(${cfg.blurAmount}px)` 
            : 'none';

        const appSpecificSelector = appId !== 'global' ? `.${appId}-app, ` : '';
        const globalSelectors = `body, .app-content, .chat-app, .settings-app, .ios-settings, 
            .album-app, .music-app, .weather-app, .pomodoro-app,
            .profile-app, .worldbook-app, .widget-app, .touch-app,
            .delivery-app, .recipe-app, .passkey-app, .timetree-app,
            .instagram-app, .smart-painter-app, .ao3-app, .phone-app,
            .twitch-app, .pub-app, .weverse-app, .drift-bottle-app,
            .twitter-app, .facebook-app, .lofter-app, .kakaopay-app,
            .guzi-guide-app, .gift-shop-app, .emoji-shop-app, .theme-shop-app,
            .dating-app, .exchange-diary-app, .bubbles-app, .match-3-app,
            .taobao-app, .youtube-app, .bilibili-app, .chrome-app`;

        styleEl.textContent = `
            :root {
                --app-bg: ${cfg.bgColor};
                --app-card-bg: ${cfg.cardBgColor};
                --app-text: ${cfg.textColor};
                --app-muted: ${cfg.mutedColor};
                --app-border: ${cfg.borderColor};
                --app-accent: ${cfg.accentColor};
                --app-font-family: ${cfg.fontFamily};
                --app-font-size: ${cfg.fontSize}px;
                --app-heading-size: ${cfg.headingSize}px;
                --app-line-height: ${cfg.lineHeight};
                --app-card-radius: ${cfg.cardRadius}px;
                --app-card-padding: ${cfg.cardPadding}px;
                --app-section-gap: ${cfg.sectionGap}px;
                --app-btn-radius: ${cfg.btnRadius}px;
                --app-input-radius: ${cfg.inputRadius}px;
                --app-shadow: ${shadowValue};
                --app-blur: ${blurValue};
                --app-transition: ${animDuration};
            }
            ${appSpecificSelector}${globalSelectors} {
                background: ${cfg.bgColor} !important;
                color: ${cfg.textColor} !important;
                font-family: ${cfg.fontFamily} !important;
                font-size: ${cfg.fontSize}px !important;
                line-height: ${cfg.lineHeight} !important;
            }
            .card, .ios-card, .kakao-card, .chat-card, .settings-card,
            .app-card, .modal-card, .dialog-card, .panel-card,
            .group, .list-card, .ios-form-group {
                background: ${cfg.cardBgColor} !important;
                border-radius: ${cfg.cardRadius}px !important;
                padding: ${cfg.cardPadding}px !important;
                box-shadow: ${shadowValue} !important;
                border: 1px solid ${cfg.borderColor} !important;
            }
            h1, h2, h3, h4, h5, h6, .title, .heading, .app-title, .nav-title,
            .kakao-title, .card-title, .section-title {
                color: ${cfg.textColor} !important;
                font-size: ${cfg.headingSize}px !important;
            }
            .muted, .hint, .subtitle, .description, .secondary-text,
            .ios-hint, .kakao-hint {
                color: ${cfg.mutedColor} !important;
            }
            a, .link, .accent-text, .primary-color {
                color: ${cfg.accentColor} !important;
            }
            button, .btn, .button, .primary-btn, .ghost-btn, .icon-btn,
            .kakao-btn, .ios-btn, .action-btn, .submit-btn {
                border-radius: ${cfg.btnRadius}px !important;
                transition: all ${animDuration} ease !important;
            }
            input, textarea, select, .input, .field, .text-field,
            .kakao-input, .ios-input, .form-input, .search-input {
                border-radius: ${cfg.inputRadius}px !important;
                border: 1px solid ${cfg.borderColor} !important;
                background: ${cfg.cardBgColor} !important;
                color: ${cfg.textColor} !important;
                transition: all ${animDuration} ease !important;
            }
            input:focus, textarea:focus, select:focus {
                border-color: ${cfg.accentColor} !important;
                outline: none !important;
            }
            section, .section, .group, .ios-section, .tab-panel,
            .chat-section, .settings-section {
                margin-bottom: ${cfg.sectionGap}px !important;
            }
            * {
                transition-duration: ${animDuration} !important;
            }
            ${cfg.customCss || ''}
        `;

        frame.contentWindow.postMessage({ type: 'APP_INTERFACE_SYNC', config: cfg, appId }, '*');
    };

    const loadAppInterfaceFromStorage = () => {
        try {
            const raw = localStorage.getItem('sx_app_interface_config');
            if (!raw) return;
            const config = JSON.parse(raw);
            injectAppInterfaceToFrame(config, 'global');
        } catch (err) {
            console.warn('載入應用介面設定失敗', err);
        }
    };

    const loadAppInterfaceForApp = (appId) => {
        if (!appId) return;
        try {
            const key = appId === 'global' ? 'sx_app_interface_config' : `sx_app_interface_${appId}`;
            const raw = localStorage.getItem(key);
            if (!raw) return;
            const config = JSON.parse(raw);
            injectAppInterfaceToFrame(config, appId);
        } catch (err) {
            console.warn(`載入應用 ${appId} 介面設定失敗`, err);
        }
    };

    // --- 6. 初始化主題與自訂圖標 ---
    applyThemeFromStorage();
    applyCustomIcons();
    loadCustomThemeFromStorage();
    initAppearancePicker();
    if (window.matchMedia) {
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const handleSystemThemeChange = () => {
            const storedMode = localStorage.getItem(THEME_MODE_KEY) || 'dark';
            if (storedMode === 'auto') {
                applyRootTheme('auto', null);
            }
        };
        if (typeof media.addEventListener === 'function') {
            media.addEventListener('change', handleSystemThemeChange);
        } else if (typeof media.addListener === 'function') {
            media.addListener(handleSystemThemeChange);
        }
    }
// --- 6. 滑動解鎖邏輯 ---
    const lockScreen = document.getElementById('lock-screen');
    const floatingBall = document.getElementById('floating-ball');
    const floatingBallInner = floatingBall?.querySelector('.floating-ball-inner');
    const floatingPanel = document.getElementById('floating-panel');
    const floatingPanelGrid = document.getElementById('floating-panel-grid');
    let startY = 0;
    let isDragging = false;

    const ballFunctions = [
        { key: 'closeApp', label: '關閉應用程式', icon: 'x' },
        { key: 'openSettings', label: '開啟設定', icon: 'settings' },
        { key: 'takeScreenshot', label: '截圖', icon: 'camera' },
        { key: 'switchApi', label: '切換 API 伺服器', icon: 'server' },
        { key: 'switchAppearance', label: '切換外觀', icon: 'sparkles' },
        { key: 'playMusic', label: '播放音樂', icon: 'music' },
        { key: 'addToWiki', label: '加入百科', icon: 'book' },
        { key: 'forceSleep', label: '立即睡眠', icon: 'moon' }
    ];

    const getBallFunctionEnabled = (key) => {
        const stored = localStorage.getItem(`sx_ball_func_${key}`);
        return stored !== '0';
    };

    const renderFloatingPanel = () => {
        if (!floatingPanelGrid) return;
        floatingPanelGrid.innerHTML = '';

        const enabledItems = ballFunctions.filter(item => getBallFunctionEnabled(item.key));
        enabledItems.forEach(item => {
            const el = document.createElement('div');
            el.className = 'floating-panel-item';
            el.dataset.func = item.key;
            el.innerHTML = `
                <div class="floating-panel-icon"><i data-lucide="${item.icon}"></i></div>
                <span>${item.label}</span>
            `;
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                triggerBallFunction(item.key);
                if (floatingPanel) {
                    floatingPanel.classList.add('hidden');
                }
            });
            floatingPanelGrid.appendChild(el);
        });

        if (window.lucide) {
            lucide.createIcons();
        }
    };

    const applyBallStyleFromStorage = () => {
        if (!floatingBall) return;
        const raw = localStorage.getItem('sx_ball_style');
        if (!raw) return;
        try {
            const style = JSON.parse(raw);
            if (!style) return;

            const size = Number(style.size) || 60;
            const hue = Number(style.hue) || 0;
            const opacity = Number(style.opacity) || 0.4;
            const mode = style.style || 'smoke';

            floatingBall.style.width = `${size}px`;
            floatingBall.style.height = `${size}px`;

            if (mode === 'frost') {
                floatingBall.style.backgroundColor = `rgba(255, 255, 255, ${opacity})`;
                floatingBall.style.backdropFilter = 'blur(10px)';
                if (floatingBallInner) {
                    floatingBallInner.style.backgroundColor = 'rgba(255, 255, 255, 0.85)';
                }
            } else if (mode === 'solid') {
                floatingBall.style.backgroundColor = `hsla(${hue}, 80%, 50%, ${opacity})`;
                floatingBall.style.backdropFilter = 'none';
                if (floatingBallInner) {
                    floatingBallInner.style.backgroundColor = `hsla(${hue}, 90%, 85%, 0.9)`;
                }
            } else {
                floatingBall.style.backgroundColor = `rgba(0, 0, 0, ${opacity})`;
                floatingBall.style.backdropFilter = 'blur(10px)';
                if (floatingBallInner) {
                    floatingBallInner.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                }
            }
        } catch (e) {
            console.warn('讀取懸浮球樣式失敗', e);
        }
    };

    const triggerBallFunction = (key) => {
        switch (key) {
            case 'closeApp':
                window.closeApp();
                break;
            case 'openSettings':
                window.launchApp('settings');
                break;
            case 'takeScreenshot':
                takeScreenshot();
                break;
            case 'switchApi':
                showApiSwitcher();
                break;
            case 'switchAppearance':
                showAppearancePicker();
                break;
            case 'playMusic':
                window.launchApp('music');
                setTimeout(() => {
                    const frame = document.getElementById('app-frame');
                    frame?.contentWindow?.postMessage({ type: 'MUSIC_PLAY' }, '*');
                }, 400);
                break;
            case 'changeMask':
                document.getElementById('wallpaper-overlay')?.classList.toggle('hidden');
                break;
            case 'addToWiki':
                window.launchApp('personal-wiki');
                break;
            case 'forceSleep':
                triggerForceSleep();
                break;
            case 'addToMemory':
                console.debug('[memory] manual trigger from assistive touch');
                handleMemoryRequestSummary({ source: 'assistive-touch' }, null);
                break;
            default:
                console.warn('未支援的懸浮球功能:', key);
        }
    };

    const triggerForceSleep = async () => {
        const system = newMemorySystem || window.globalMemorySystem || window.unifiedMemory;
        if (!system) {
            alert('記憶系統尚未初始化');
            return;
        }
        
        const sleepEngine = system.sleepEngine;
        if (!sleepEngine) {
            alert('睡眠引擎尚未初始化');
            return;
        }
        
        const confirmed = confirm('確定要立即執行睡眠處理嗎？\n這會整合記憶、更新衰減、並處理 Wiki 條目。');
        if (!confirmed) return;
        
        try {
            console.log('[Sleep] 開始執行強制睡眠...');
            
            const result = await sleepEngine.sleep('manual', {
                tasks: {
                    consolidate: true,
                    vectorize: true,
                    associate: true,
                    decay: true,
                    wiki: true
                }
            });
            
            console.log('[Sleep] 睡眠處理完成:', result);
            
            if (result.skipped) {
                alert(`睡眠處理已跳過\n原因: ${result.reason || '未知'}`);
            } else {
                alert(`睡眠處理完成！\n\n` +
                    `短期轉長期: ${result.phases?.shortToLong?.stored || 0} 條\n` +
                    `記憶整合: ${result.phases?.consolidate?.merged || 0} 條\n` +
                    `社交記憶向量化: ${result.phases?.socialMemories?.vectorized || 0} 條\n` +
                    `聊天記憶向量化: ${result.phases?.chatMemories?.vectorized || 0} 條\n` +
                    `Wiki 向量化: ${result.phases?.wikiProcessing?.vectorized || 0} 條\n` +
                    `Char Wiki 生成: ${result.phases?.wikiProcessing?.generated || 0} 條`);
            }
        } catch (e) {
            console.error('[Sleep] 睡眠處理失敗:', e);
            alert('睡眠處理失敗: ' + e.message);
        }
    };

    const showApiSwitcher = () => {
        const raw = localStorage.getItem('api_configs');
        if (!raw) {
            alert('尚未設定 API，請先到設定頁面新增 API');
            return;
        }
        
        let configs = [];
        try {
            configs = JSON.parse(raw);
        } catch (e) {
            alert('API 設定格式錯誤');
            return;
        }
        
        if (!Array.isArray(configs) || configs.length === 0) {
            alert('尚未設定 API，請先到設定頁面新增 API');
            return;
        }
        
        const currentIndex = parseInt(localStorage.getItem('sx_active_api') || '0', 10);
        
        const overlay = document.createElement('div');
        overlay.id = 'api-switcher-overlay';
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
        `;
        
        const card = document.createElement('div');
        card.style.cssText = `
            background: #1c1c1e;
            border-radius: 16px;
            padding: 20px;
            width: 100%;
            max-width: 320px;
            max-height: 80vh;
            overflow-y: auto;
        `;
        
        const title = document.createElement('div');
        title.style.cssText = 'font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #fff;';
        title.textContent = '選擇 API 伺服器';
        card.appendChild(title);
        
        configs.forEach((config, index) => {
            const item = document.createElement('div');
            item.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 14px 16px;
                background: ${index === currentIndex ? 'rgba(91, 141, 239, 0.2)' : 'rgba(255,255,255,0.05)'};
                border: 1px solid ${index === currentIndex ? '#5B8DEF' : 'rgba(255,255,255,0.1)'};
                border-radius: 12px;
                margin-bottom: 10px;
                cursor: pointer;
            `;
            
            const info = document.createElement('div');
            info.innerHTML = `
                <div style="font-weight: 600; color: #fff; margin-bottom: 4px;">${config.name || '未命名'}</div>
                <div style="font-size: 12px; color: #8e8e93;">${config.url?.slice(0, 40) || ''}${config.url?.length > 40 ? '...' : ''}</div>
            `;
            
            const check = document.createElement('div');
            if (index === currentIndex) {
                check.innerHTML = '<i class="fas fa-check" style="color: #5B8DEF; font-size: 18px;"></i>';
            }
            
            item.appendChild(info);
            item.appendChild(check);
            
            item.addEventListener('click', () => {
                localStorage.setItem('sx_active_api', String(index));
                overlay.remove();
                console.log(`[API] 已切換到: ${config.name}`);
            });
            
            card.appendChild(item);
        });
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '關閉';
        closeBtn.style.cssText = `
            width: 100%;
            padding: 14px;
            margin-top: 10px;
            background: rgba(255,255,255,0.1);
            border: none;
            border-radius: 12px;
            color: #fff;
            font-size: 16px;
            cursor: pointer;
        `;
        closeBtn.addEventListener('click', () => overlay.remove());
        card.appendChild(closeBtn);
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
        
        overlay.appendChild(card);
        document.body.appendChild(overlay);
    };

    const takeScreenshot = async () => {
        const phoneContainer = document.getElementById('phone-container');
        if (!phoneContainer) {
            alert('無法取得螢幕內容');
            return;
        }

        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            inset: 0;
            background: #fff;
            z-index: 99999;
            opacity: 0;
            transition: opacity 0.1s ease;
            pointer-events: none;
        `;
        document.body.appendChild(flash);
        
        requestAnimationFrame(() => {
            flash.style.opacity = '1';
            setTimeout(() => {
                flash.style.opacity = '0';
                setTimeout(() => flash.remove(), 100);
            }, 100);
        });

        try {
            const canvas = await html2canvas(phoneContainer, {
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#000',
                scale: window.devicePixelRatio || 1,
                logging: false
            });

            const dataUrl = canvas.toDataURL('image/png');
            
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `screenshot_${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}.png`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            console.log('[Screenshot] 截圖已儲存');
        } catch (e) {
            console.error('[Screenshot] 截圖失敗:', e);
            alert('截圖失敗，請稍後重試');
        }
    };

    const ensureBallPosition = () => {
        if (!floatingBall) return;
        const stored = localStorage.getItem('sx_ball_position');
        if (stored) {
            try {
                const pos = JSON.parse(stored);
                floatingBall.style.left = `${pos.x}px`;
                floatingBall.style.top = `${pos.y}px`;
                floatingBall.style.right = 'auto';
            } catch (e) {
                console.warn('懸浮球位置還原失敗', e);
            }
        }
    };

    const updatePanelPosition = () => {
        if (!floatingPanel || !floatingBall) return;
        const ballRect = floatingBall.getBoundingClientRect();
        const containerRect = document.getElementById('phone-container')?.getBoundingClientRect();
        if (!containerRect) return;
        const offsetX = ballRect.left - containerRect.left;
        const offsetY = ballRect.top - containerRect.top;
        const ballCenterX = offsetX + ballRect.width / 2;

        const panelWidth = floatingPanel.offsetWidth || 210;
        const panelHeight = floatingPanel.offsetHeight || 300;
        const isLeftSide = ballCenterX < containerRect.width / 2;
        const margin = 12;

        // 水平位置
        if (isLeftSide) {
            floatingPanel.style.left = `${offsetX + ballRect.width + margin}px`;
        } else {
            floatingPanel.style.left = `${offsetX - panelWidth - margin}px`;
        }

        // 垂直位置 - 考虑底部边界
        let topPosition = offsetY + 10;
        const bottomEdge = topPosition + panelHeight;
        const containerHeight = containerRect.height;

        if (bottomEdge > containerHeight - 20) {
            // 如果面板超出底部，将其向上调整
            topPosition = containerHeight - panelHeight - 20;
            // 确保不会超出顶部
            if (topPosition < 10) {
                topPosition = 10;
            }
        }

        floatingPanel.style.top = `${topPosition}px`;
        floatingPanel.style.right = 'auto';
    };

    let ballDragMoved = false;
    let ballDragMovedTimer = null;

    const initBallDrag = () => {
        if (!floatingBall) return;
        let dragging = false;
        let hasMoved = false;
        let startX = 0;
        let startY = 0;
        let pointerId = null;
        let offsetX = 0;
        let offsetY = 0;
        let cachedContainerRect = null; // 快取容器尺寸，避免每次 move 都 reflow
        let cachedBallSize = null; // 快取球尺寸
        const MOVE_THRESHOLD = 5;

        const getContainerRect = () => document.getElementById('phone-container')?.getBoundingClientRect() || { left: 0, top: 0, width: 375, height: 812, right: 375, bottom: 812 };

        const onPointerDown = (event) => {
            dragging = true;
            hasMoved = false;
            const point = event.touches ? event.touches[0] : event;
            pointerId = event.pointerId || (event.touches ? event.touches[0].identifier : null);
            const rect = floatingBall.getBoundingClientRect();
            cachedContainerRect = getContainerRect();
            cachedBallSize = { width: rect.width, height: rect.height };
            offsetX = point.clientX - rect.left;
            offsetY = point.clientY - rect.top;
            startX = point.clientX;
            startY = point.clientY;
            floatingBall.style.transition = 'none';
            event.preventDefault();
            event.stopPropagation();
        };

        const onPointerMove = (event) => {
            if (!dragging) return;
            if (pointerId !== null) {
                const eventPointerId = event.pointerId ?? (event.touches ? event.touches[0]?.identifier : null);
                if (eventPointerId !== pointerId) return;
            }
            const point = event.touches ? event.touches[0] : event;
            
            const deltaX = point.clientX - startX;
            const deltaY = point.clientY - startY;
            if (Math.abs(deltaX) > MOVE_THRESHOLD || Math.abs(deltaY) > MOVE_THRESHOLD) {
                hasMoved = true;
                ballDragMoved = true;
            }
            
            // 使用快取的尺寸，避免每次 move 都觸發 reflow
            const containerRect = cachedContainerRect;
            const ballWidth = cachedBallSize.width;
            const ballHeight = cachedBallSize.height;
            const minLeft = containerRect.left + 2;
            const maxLeft = containerRect.right - ballWidth - 2;
            const minTop = containerRect.top + 56;
            const maxTop = containerRect.bottom - ballHeight - 8;
            const newX = Math.min(Math.max(point.clientX - offsetX, minLeft), maxLeft);
            const newY = Math.min(Math.max(point.clientY - offsetY, minTop), maxTop);
            
            // 直接更新位置，不調用 updatePanelPosition()（拖拽結束後再更新）
            floatingBall.style.left = `${newX - containerRect.left}px`;
            floatingBall.style.top = `${newY - containerRect.top}px`;
            floatingBall.style.right = 'auto';
        };

        const onPointerUp = (event) => {
            if (!dragging) return;
            const wasDragging = hasMoved;
            dragging = false;
            pointerId = null;
            cachedContainerRect = null;
            cachedBallSize = null;
            
            if (ballDragMovedTimer) {
                clearTimeout(ballDragMovedTimer);
            }
            ballDragMovedTimer = setTimeout(() => {
                ballDragMoved = false;
            }, 100);
            
            if (!wasDragging) {
                floatingPanel.classList.toggle('hidden');
                updatePanelPosition();
            }
            
            const containerRect = getContainerRect();
            const rect = floatingBall.getBoundingClientRect();
            const ballWidth = rect.width;

            const leftLimit = 2;
            const rightLimit = containerRect.width - ballWidth - 2;
            const currentLeft = rect.left - containerRect.left;

            const snapLeft = currentLeft <= containerRect.width / 2 ? leftLimit : rightLimit;
            
            requestAnimationFrame(() => {
                floatingBall.style.transition = 'left 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94), top 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                floatingBall.style.left = `${snapLeft}px`;

                const pos = {
                    x: snapLeft,
                    y: rect.top - containerRect.top
                };
                localStorage.setItem('sx_ball_position', JSON.stringify(pos));
                updatePanelPosition();
                
                setTimeout(() => {
                    if (floatingBall) {
                        floatingBall.style.transition = '';
                    }
                }, 250);
            });
        };

        floatingBall.addEventListener('mousedown', onPointerDown);
        floatingBall.addEventListener('touchstart', onPointerDown, { passive: false });

        window.addEventListener('mousemove', onPointerMove);
        window.addEventListener('touchmove', onPointerMove, { passive: false });
        window.addEventListener('mouseup', onPointerUp);
        window.addEventListener('touchend', onPointerUp);
    };

    // 滑動解鎖處理函數
    const handleStart = (y) => {
        if (!lockScreen) return;
        isDragging = true;
        startY = y;
        lockScreen.style.transition = 'none';
    };

    // 修正：必須接收 e 參數，否則電腦端執行 preventDefault 會報錯
    const handleMove = (y, e) => {
        if (!isDragging || !lockScreen) return;
        
        // 阻止瀏覽器預設行為（如滑動回彈、選取文字）
        if (e && e.cancelable) e.preventDefault(); 

        let diffY = y - startY;
        // 只允許向上滑動 (diffY < 0)
        if (diffY < 0) {
            lockScreen.style.transform = `translateY(${diffY}px)`;
        }
    };

const handleEnd = (y) => {
    if (!isDragging || !lockScreen) return;
    isDragging = false;
    
    let diffY = y - startY;

    // 檢查點：增加 log 觀察數值，看看是不是 diffY 根本沒達到 -100
    console.log("滑動距離:", diffY);

    lockScreen.style.transition = 'transform 0.5s cubic-bezier(0.19, 1, 0.22, 1)';
    
    // 修正：有時候手感問題，門檻值設 80-100 比較順手
    if (diffY < -80) { 
        // 成功解鎖
        lockScreen.style.transform = 'translateY(-100%)';
        
        // 增加一個 flag 防止重複觸發
        setTimeout(() => {
            lockScreen.classList.add('hidden'); // 確保完全消失不擋住後方點擊
            if (typeof window.unlockPhone === 'function') {
                window.unlockPhone();
            }
        }, 400);
    } else {
        // 回彈
        lockScreen.style.transform = 'translateY(0)';
    }
};

    if (lockScreen) {
        // 行動端
        lockScreen.addEventListener('touchstart', (e) => handleStart(e.touches[0].clientY), {passive: true});
        lockScreen.addEventListener('touchmove', (e) => handleMove(e.touches[0].clientY, e), {passive: false});
        lockScreen.addEventListener('touchend', (e) => handleEnd(e.changedTouches[0].clientY));

        // 電腦端
        lockScreen.addEventListener('mousedown', (e) => {
            handleStart(e.clientY);
            
            // 修正：這裡要確實將 ev 傳給 handleMove
            const onMouseMove = (ev) => handleMove(ev.clientY, ev);
            
            const onMouseUp = (ev) => {
                handleEnd(ev.clientY);
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
            };
            
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        });
    }

    if (floatingBall && floatingPanel) {
        ensureBallPosition();
        initBallDrag();
        renderFloatingPanel();
        applyBallStyleFromStorage();

        floatingBall.addEventListener('click', (event) => {
            if (ballDragMoved) return;
            if (event.detail > 1) return;
            event.stopPropagation();
            floatingPanel.classList.toggle('hidden');
            updatePanelPosition();
        });

        floatingBall.addEventListener('touchend', (event) => {
            if (ballDragMoved) return;
            if (event.detail > 1) return;
        });

        document.addEventListener('click', (event) => {
            if (floatingPanel.classList.contains('hidden')) return;
            if (floatingPanel.contains(event.target) || floatingBall.contains(event.target)) return;
            floatingPanel.classList.add('hidden');
        });
    }

    const HOME_PAGE_SIZE = parseInt(localStorage.getItem('sx_home_page_size') || '8', 10); // 每頁圖標數量，可透過設定 widget 調整
    const HOME_WIDGETS_KEY = 'sx_home_widgets';
    const HOME_WIDGET_LAYOUT_KEY = 'sx_widget_layout';
    const ENABLE_HOME_EDIT = false; // 停用長按拖曳與分頁，改用 widget 設定
    let homeWidgetBoard = null;

    // 檢查是否為第一次使用（沒有任何 widget 相關設定）
    const WIDGET_INITIALIZED_KEY = 'sx_widget_initialized';
    if (!localStorage.getItem(WIDGET_INITIALIZED_KEY)) {
        // 第一次使用，確保沒有預設小工具
        localStorage.setItem(HOME_WIDGETS_KEY, JSON.stringify([]));
        localStorage.setItem(HOME_WIDGET_LAYOUT_KEY, JSON.stringify([]));
        localStorage.setItem(WIDGET_INITIALIZED_KEY, 'true');
        console.log('[Widget] 第一次使用，已初始化為空白設定');
    }

    const parseUserHomeConfig = () => {
        const configNode = document.getElementById('sx-user-home-config');
        if (!configNode) return {};
        try {
            const parsed = JSON.parse(configNode.textContent || '{}');
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (err) {
            console.warn('首頁小工具設定解析失敗，將使用預設值', err);
            return {};
        }
    };

    const normalizeLibraryEntry = (entry = {}) => {
        const title = typeof entry.title === 'string' && entry.title.trim() ? entry.title.trim() : '小工具';
        const size = ['small', 'medium', 'large'].includes(entry.size) ? entry.size : 'small';
        const content = typeof entry.content === 'string' ? entry.content : '';
        return { title, size, content };
    };

    const userHomeConfig = parseUserHomeConfig();

    const defaultWidgetLibrary = {
        clock: { title: '時鐘', size: 'small', content: () => new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }) },
        weather: { title: '天氣', size: 'small', content: () => '台北 27°C ☁️' },
        music: { title: '音樂', size: 'medium', content: () => '正在播放：隨機推薦歌單' },
        photo: { title: '相片', size: 'medium', content: () => '📸 今日回憶：尚未選擇' },
        calendar: { title: '行事曆', size: 'small', content: () => '今天 2 筆行程' },
        quote: { title: '語錄', size: 'large', content: () => '「先完成再完美。」' }
    };

    const userWidgetLibrary = Object.entries(userHomeConfig.widgetLibrary || {}).reduce((acc, [key, value]) => {
        acc[key] = normalizeLibraryEntry(value);
        return acc;
    }, {});

    const widgetLibrary = {
        ...defaultWidgetLibrary,
        ...userWidgetLibrary
    };

    const loadWidgets = () => {
        try {
            const raw = localStorage.getItem(HOME_WIDGETS_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    };

    const saveWidgets = (widgets) => {
        localStorage.setItem(HOME_WIDGETS_KEY, JSON.stringify(widgets));
    };

    const loadWidgetLayout = () => {
        try {
            const raw = localStorage.getItem(HOME_WIDGET_LAYOUT_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    };

    const saveWidgetLayout = (layout) => {
        localStorage.setItem(HOME_WIDGET_LAYOUT_KEY, JSON.stringify(layout));
    };

    const normalizeWidgetLayout = (layout) => {
        if (!Array.isArray(layout)) return [];
        return layout
            .filter(widget => widget && typeof widget === 'object' && typeof widget.type === 'string')
            .filter(widget => widget.enabled !== false)
            .map((widget, index) => ({
                id: widget.id || `home-widget-${index}`,
                type: widget.type,
                size: widget.size || '2x1',
                bgColor: widget.bgColor || 'transparent',
                opacity: Number.isFinite(Number(widget.opacity)) ? Number(widget.opacity) : 100,
                radius: Number.isFinite(Number(widget.radius)) ? Number(widget.radius) : 16,
                customTitle: typeof widget.customTitle === 'string' ? widget.customTitle : '',
                customSubtitle: typeof widget.customSubtitle === 'string' ? widget.customSubtitle : '',
                customImage: typeof widget.customImage === 'string' ? widget.customImage : '',
                widgetStyle: ['glass', 'vinyl', 'polaroid', 'slideshow'].includes(widget.widgetStyle) ? widget.widgetStyle : 'glass',
                order: Number.isFinite(Number(widget.order)) ? Number(widget.order) : index
            }))
            .sort((a, b) => a.order - b.order);
    };

    const sizeToGridSpan = (size) => {
        const map = {
            '1x1': { cols: 1, rows: 1, minHeight: 78 },
            '2x1': { cols: 2, rows: 1, minHeight: 78 },
            '2x2': { cols: 2, rows: 2, minHeight: 168 },
            '4x1': { cols: 4, rows: 1, minHeight: 78 },
            '4x2': { cols: 4, rows: 2, minHeight: 168 }
        };
        return map[size] || map['2x1'];
    };

    const asRgba = (hex, alpha) => {
        if (typeof hex !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(hex)) return `rgba(255,255,255,${alpha})`;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const resolveLayoutWidgetDisplay = (widget) => {
        const now = new Date();
        const weekdayList = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
        const weekday = weekdayList[now.getDay()];
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const time = now.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });

        const map = {
            'clock-1': { title: '時鐘', main: time, sub: `${weekday}，${month}月${day}日`, icon: '' },
            'clock-2': { title: '大時鐘', main: time, sub: '', icon: '' },
            date: { title: '日期', main: String(day), sub: `${month}月 ${weekday}`, icon: '' },
            quote: { title: '每日一句', main: '「先完成再完美。」', sub: '', icon: '' },
            weather: { title: '天氣', main: '25°C', sub: '台北市', icon: '' },
            calendar: { title: '日曆', main: '今日行程', sub: '2 筆待辦', icon: '' },
            battery: { title: '電池', main: '85%', sub: '目前電量', icon: '' },
            steps: { title: '步數', main: '8,520', sub: '今日步數', icon: '' },
            photo: { title: '相片', main: '今日回憶', sub: '尚未選擇', icon: '' },
            music: { title: '音樂', main: '正在播放', sub: '隨機推薦歌單', icon: '' },
            video: { title: '影片', main: '影片', sub: '快速開啟', icon: '' },
            shortcut: { title: '快捷方式', main: '捷徑', sub: '1 個快速動作', icon: '' },
            notes: { title: '筆記', main: '筆記', sub: '尚無內容', icon: '' },
            timer: { title: '計時器', main: '25:00', sub: '專注中', icon: '' },
            reminder: { title: '提醒', main: '提醒', sub: '今天 1 則', icon: '' }
        };

        const fallback = map[widget.type] || {
            title: widget.type,
            main: '小工具',
            sub: '',
            icon: ''
        };

        return {
            ...fallback,
            title: widget.customTitle || fallback.title,
            sub: widget.customSubtitle || fallback.sub
        };
    };

    const createRemoveButton = (onClick) => {
        const removeBtn = document.createElement('button');
        removeBtn.textContent = '×';
        removeBtn.title = '移除小工具';
        removeBtn.style.cssText = 'position:absolute;top:6px;right:8px;border:none;background:transparent;color:#fff;font-size:16px;cursor:pointer;display:none;';
        removeBtn.addEventListener('click', onClick);
        return removeBtn;
    };

    if (!localStorage.getItem(HOME_WIDGETS_KEY) && Array.isArray(userHomeConfig.defaultHomeWidgets)) {
        saveWidgets(userHomeConfig.defaultHomeWidgets.filter(type => typeof type === 'string'));
    }

    if (!localStorage.getItem(HOME_WIDGET_LAYOUT_KEY) && Array.isArray(userHomeConfig.defaultWidgetLayout)) {
        saveWidgetLayout(userHomeConfig.defaultWidgetLayout);
    }

    const renderWidgets = () => {
        if (!homeWidgetBoard) return;
        const layoutWidgets = normalizeWidgetLayout(loadWidgetLayout());
        const useLayoutWidgets = layoutWidgets.length > 0;
        const widgets = loadWidgets();
        homeWidgetBoard.innerHTML = '';

        if (useLayoutWidgets) {
            layoutWidgets.forEach((widget, index) => {
                const span = sizeToGridSpan(widget.size);
                const display = resolveLayoutWidgetDisplay(widget);

                const card = document.createElement('div');
                card.className = 'widget-card from-layout';
                card.style.position = 'relative';
                card.style.gridColumn = `span ${span.cols}`;
                card.style.gridRow = `span ${span.rows}`;
                card.style.minHeight = `${span.minHeight}px`;
                card.style.borderRadius = `${widget.radius}px`;

                if (widget.bgColor && widget.bgColor !== 'transparent') {
                    const alpha = Math.max(0, Math.min(100, widget.opacity)) / 100;
                    card.style.background = asRgba(widget.bgColor, alpha);
                }

                if (widget.customImage) {
                    card.classList.add('has-image');
                    const styleType = ['glass', 'vinyl', 'polaroid', 'slideshow'].includes(widget.widgetStyle) ? widget.widgetStyle : 'glass';
                    card.classList.add(`widget-style-${styleType}`);

                    if (styleType === 'glass') {
                        card.style.backgroundImage = `linear-gradient(180deg, rgba(255,255,255,0.1), rgba(0,0,0,0.28)), url('${widget.customImage}')`;
                        card.style.backgroundSize = 'cover';
                        card.style.backgroundPosition = 'center';
                        card.style.backgroundRepeat = 'no-repeat';
                    } else if (styleType === 'vinyl') {
                        card.insertAdjacentHTML('afterbegin', `
                            <div class="widget-style-shell vinyl-shell">
                                <div class="vinyl-disc"></div>
                                <div class="vinyl-cover" style="background-image:url('${widget.customImage}')"></div>
                            </div>
                        `);
                    } else if (styleType === 'polaroid') {
                        card.insertAdjacentHTML('afterbegin', `
                            <div class="widget-style-shell polaroid-shell">
                                <div class="polaroid-photo" style="background-image:url('${widget.customImage}')"></div>
                            </div>
                        `);
                    } else if (styleType === 'slideshow') {
                        card.insertAdjacentHTML('afterbegin', `
                            <div class="widget-style-shell slideshow-shell">
                                <div class="slide-photo" style="background-image:url('${widget.customImage}')"></div>
                                <div class="slide-strip"></div>
                            </div>
                        `);
                    }
                }

                card.innerHTML = `
                    ${display.icon ? `<div class="widget-icon">${display.icon}</div>` : ''}
                    <strong>${display.title}</strong>
                    <div class="widget-main">${display.main}</div>
                    ${display.sub ? `<div class="widget-sub">${display.sub}</div>` : ''}
                `;

                const removeBtn = createRemoveButton((e) => {
                    e.stopPropagation();
                    const next = normalizeWidgetLayout(loadWidgetLayout());
                    next.splice(index, 1);
                    next.forEach((item, order) => {
                        item.order = order;
                    });
                    saveWidgetLayout(next);
                    renderWidgets();
                });

                card.appendChild(removeBtn);
                homeWidgetBoard.appendChild(card);
            });
        } else {
            widgets.forEach((type, index) => {
                const meta = widgetLibrary[type];
                if (!meta) return;
                const card = document.createElement('div');
                const size = ['small', 'medium', 'large'].includes(meta.size) ? meta.size : 'small';
                const content = typeof meta.content === 'function' ? meta.content() : (meta.content || '');
                card.className = `widget-card ${size}`;
                card.innerHTML = `<strong>${meta.title}</strong><span>${content}</span>`;

                const removeBtn = createRemoveButton((e) => {
                    e.stopPropagation();
                    const next = loadWidgets();
                    next.splice(index, 1);
                    saveWidgets(next);
                    renderWidgets();
                });

                card.style.position = 'relative';
                card.appendChild(removeBtn);
                homeWidgetBoard.appendChild(card);
            });
        }

        const editing = document.getElementById('home-screen')?.classList.contains('home-screen-edit');
        homeWidgetBoard.querySelectorAll('button').forEach(btn => {
            btn.style.display = editing ? 'block' : 'none';
        });
    };

    const updatePageDots = () => {
        const scroll = document.getElementById('home-scroll');
        const dotsWrap = document.getElementById('home-page-dots');
        if (!scroll || !dotsWrap) return;
        const pages = scroll.querySelectorAll('.home-page');
        const index = Math.round(scroll.scrollLeft / Math.max(scroll.clientWidth, 1));
        dotsWrap.innerHTML = '';
        pages.forEach((_, i) => {
            const dot = document.createElement('span');
            dot.className = `dot${i === index ? ' active' : ''}`;
            dotsWrap.appendChild(dot);
        });
    };

    const setHomeEditMode = (enabled) => {
        const homeScreen = document.getElementById('home-screen');
        const picker = document.getElementById('widget-picker');

        if (!ENABLE_HOME_EDIT) {
            homeScreen?.classList.remove('home-screen-edit');
            picker?.classList.add('hidden');
            document.querySelectorAll('#home-scroll .app-icon').forEach(icon => {
                icon.setAttribute('draggable', 'false');
            });
            document.querySelectorAll('#home-scroll .shortcut-hide-btn').forEach(btn => {
                btn.style.display = 'none';
            });
            renderWidgets();
            return;
        }

        homeScreen?.classList.toggle('home-screen-edit', enabled);
        if (!enabled) {
            picker?.classList.add('hidden');
        } else {
            picker?.classList.remove('hidden');
        }

        document.querySelectorAll('#home-scroll .app-icon').forEach(icon => {
            icon.setAttribute('draggable', enabled ? 'true' : 'false');
        });
        document.querySelectorAll('#home-scroll .shortcut-hide-btn').forEach(btn => {
            btn.style.display = enabled ? 'flex' : 'none';
        });

        renderWidgets();
    };

    const initHomePages = () => {
        const sourceGrid = document.getElementById('app-grid-source');
    const homeScroll = document.getElementById('home-scroll');
    const homeScreen = document.getElementById('home-screen');
    const picker = document.getElementById('widget-picker');
    const dots = document.getElementById('home-page-dots');
    if (!sourceGrid || !homeScroll || !homeScreen || !dots) return;

        // 分頁與應用程式渲染（ENABLE_HOME_EDIT 只控制拖曳編輯功能）
        const pages = [];
        const categoryMap = {
            social: ['chat', 'twitter', 'facebook', 'instagram', 'weverse', 'bubbles', 'lofter', 'twitch'],
            media: ['youtube', 'bilibili', 'music', 'chrome', 'ao3'],
            tools: ['settings', 'widget', 'weather', 'timetree', 'kakaopay', 'touch', 'phone'],
            life: ['delivery', 'taobao', 'daily-recipe', 'dating', 'exchange-diary', 'drift-bottle']
        };

        const createPage = () => {
            const page = document.createElement('section');
            page.className = 'home-page';
            const grid = document.createElement('div');
            grid.className = 'app-grid';
            page.appendChild(grid);
            pages.push({ page, grid });
            homeScroll.appendChild(page);
            return { page, grid };
        };

        const first = createPage();
        homeWidgetBoard = document.createElement('div');
        homeWidgetBoard.className = 'widget-board';
        first.page.insertBefore(homeWidgetBoard, first.grid);

        // 隱藏應用程式的持久化
        const HIDDEN_APPS_KEY = 'sx_hidden_apps';
        
        const getHiddenApps = () => {
            try {
                const raw = localStorage.getItem(HIDDEN_APPS_KEY);
                return raw ? JSON.parse(raw) : [];
            } catch { return []; }
        };
        
        const saveHiddenApps = (apps) => {
            localStorage.setItem(HIDDEN_APPS_KEY, JSON.stringify(apps));
        };
        
        const hideApp = (appId) => {
            const hidden = getHiddenApps();
            if (!hidden.includes(appId)) {
                hidden.push(appId);
                saveHiddenApps(hidden);
            }
        };
        
        const showApp = (appId) => {
            const hidden = getHiddenApps();
            const idx = hidden.indexOf(appId);
            if (idx > -1) {
                hidden.splice(idx, 1);
                saveHiddenApps(hidden);
            }
        };
        
        const isAppHidden = (appId) => {
            return getHiddenApps().includes(appId);
        };

        const icons = Array.from(sourceGrid.querySelectorAll('.app-icon')).map(node => node.cloneNode(true));

        const enhanceIcon = (icon) => {
            icon.classList.add('app-shortcut-item');
            icon.setAttribute('draggable', 'false');

            const rawOnclick = icon.getAttribute('onclick') || '';
            const match = rawOnclick.match(/launchApp\(['"]([^'"]+)['"]\)/);
            const appId = match?.[1] || '';
            if (appId) {
                icon.dataset.appId = appId;
            }

            // 只在編輯模式啟用時才顯示隱藏按鈕
            if (ENABLE_HOME_EDIT && !icon.querySelector('.shortcut-hide-btn')) {
                const hideBtn = document.createElement('button');
                hideBtn.className = 'shortcut-hide-btn';
                hideBtn.type = 'button';
                hideBtn.textContent = '−';
                hideBtn.style.display = 'none';
                icon.appendChild(hideBtn);

                icon.querySelector('.shortcut-hide-btn')?.addEventListener('click', (event) => {
                    event.stopPropagation();
                    if (appId) {
                        hideApp(appId);
                    }
                    icon.style.display = 'none';
                });
            }
            
            // 檢查是否已被隱藏
            if (appId && isAppHidden(appId)) {
                icon.style.display = 'none';
            }
            
            return icon;
        };

        // 分頁：每頁 HOME_PAGE_SIZE 個圖標
        icons.forEach((icon, idx) => {
            const pageIndex = Math.floor(idx / HOME_PAGE_SIZE);
            const target = pages[pageIndex] || createPage();
            target.grid.appendChild(enhanceIcon(icon));
        });

        // 保底：集中處理圖示點擊，確保永遠能呼叫 launchApp
        const handleIconTap = (event) => {
            const icon = event.target.closest('.app-shortcut-item');
            if (!icon) return;
            if (event.target.closest('.shortcut-hide-btn')) return;
            const rawOnclick = icon.getAttribute('onclick') || '';
            const parsed = rawOnclick.match(/launchApp\(['"]([^'"]+)['"]\)/);
            const appId = icon.dataset.appId || parsed?.[1];
            if (!appId) return;
            console.log('Icon click -> launchApp:', appId);
            window.launchApp(appId);
        };

        homeScroll.addEventListener('click', handleIconTap);
        
        // 觸控優化：使用 touchend 加快響應
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;
        
        homeScroll.addEventListener('touchstart', (event) => {
            touchStartX = event.touches[0].clientX;
            touchStartY = event.touches[0].clientY;
            touchStartTime = Date.now();
        }, { passive: true });
        
        homeScroll.addEventListener('touchend', (event) => {
            const touchEndX = event.changedTouches[0].clientX;
            const touchEndY = event.changedTouches[0].clientY;
            const touchEndTime = Date.now();
            
            const deltaX = Math.abs(touchEndX - touchStartX);
            const deltaY = Math.abs(touchEndY - touchStartY);
            const deltaTime = touchEndTime - touchStartTime;
            
            // 如果移動距離小於 10px 且時間小於 300ms，視為點擊
            if (deltaX < 10 && deltaY < 10 && deltaTime < 300) {
                const icon = event.target.closest('.app-shortcut-item');
                if (icon && !event.target.closest('.shortcut-hide-btn')) {
                    event.preventDefault();
                    handleIconTap(event);
                }
            }
        }, { passive: false });

        // App 資料庫頁面
        const appLibraryPage = document.createElement('section');
        appLibraryPage.className = 'home-page app-library-page';
        const libraryWrap = document.createElement('div');
        libraryWrap.className = 'app-library-wrap';
        const allIcons = Array.from(sourceGrid.querySelectorAll('.app-icon'));

        const getAppId = (node) => {
            const raw = node.getAttribute('onclick') || '';
            const match = raw.match(/launchApp\(['"]([^'"]+)['"]\)/);
            return match?.[1] || '';
        };

        const categories = [
            { key: 'social', label: '社群' },
            { key: 'media', label: '影音' },
            { key: 'tools', label: '工具' },
            { key: 'life', label: '生活' }
        ];

        const modal = document.createElement('div');
        modal.className = 'app-library-modal hidden';
        modal.innerHTML = `
            <div class="app-library-modal-header">
                <button class="app-library-back" type="button">返回</button>
                <h3 id="app-library-modal-title">App 資料庫</h3>
            </div>
            <div class="app-library-modal-grid"></div>
        `;
        homeScreen.appendChild(modal);
        const modalTitle = modal.querySelector('#app-library-modal-title');
        const modalGrid = modal.querySelector('.app-library-modal-grid');

        const openLibraryCategory = (label, nodes) => {
            if (!modalGrid || !modalTitle) return;
            modalTitle.textContent = label;
            modalGrid.innerHTML = '';
            nodes.forEach(node => {
                const app = node.cloneNode(true);
                app.classList.remove('library-item');
                modalGrid.appendChild(app);
            });
            modal.classList.remove('hidden');
        };

        modal.querySelector('.app-library-back')?.addEventListener('click', () => {
            modal.classList.add('hidden');
        });

        categories.forEach(category => {
            const categoryApps = allIcons.filter(node => categoryMap[category.key]?.includes(getAppId(node)));
            const section = document.createElement('div');
            section.className = 'library-category';
            section.innerHTML = `<h4>${category.label}</h4><div class="library-grid"></div>`;
            const grid = section.querySelector('.library-grid');
            categoryApps.slice(0, 4).forEach(node => {
                const app = node.cloneNode(true);
                app.classList.add('library-item');
                grid?.appendChild(app);
            });

            section.addEventListener('click', () => {
                openLibraryCategory(category.label, categoryApps);
            });
            libraryWrap.appendChild(section);
        });

        // 已隱藏的應用區塊
        const hiddenAppsSection = document.createElement('div');
        hiddenAppsSection.className = 'library-category hidden-apps-section';
        hiddenAppsSection.innerHTML = `<h4>已隱藏的應用</h4><div class="library-grid hidden-apps-grid"></div>`;
        const hiddenAppsGrid = hiddenAppsSection.querySelector('.hidden-apps-grid');
        
        const renderHiddenApps = () => {
            if (!hiddenAppsGrid) return;
            hiddenAppsGrid.innerHTML = '';
            const hiddenApps = getHiddenApps();
            
            if (hiddenApps.length === 0) {
                hiddenAppsGrid.innerHTML = '<span class="no-hidden-apps">沒有隱藏的應用</span>';
                return;
            }
            
            hiddenApps.forEach(appId => {
                const originalIcon = allIcons.find(node => getAppId(node) === appId);
                if (!originalIcon) return;
                
                const app = originalIcon.cloneNode(true);
                app.classList.add('library-item', 'hidden-app-item');
                app.style.display = '';
                app.style.opacity = '0.6';
                
                // 點擊還原
                app.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showApp(appId);
                    renderHiddenApps();
                    // 重新渲染桌面圖標
                    const homeIcon = document.querySelector(`.app-shortcut-item[data-app-id="${appId}"]`);
                    if (homeIcon) {
                        homeIcon.style.display = '';
                    }
                    // 顯示還原提示
                    const toast = document.createElement('div');
                    toast.className = 'restore-toast';
                    toast.textContent = '已還原應用';
                    document.body.appendChild(toast);
                    setTimeout(() => toast.remove(), 1500);
                });
                
                // 添加還原按鈕
                const restoreBtn = document.createElement('button');
                restoreBtn.className = 'restore-btn';
                restoreBtn.textContent = '還原';
                restoreBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showApp(appId);
                    renderHiddenApps();
                    const homeIcon = document.querySelector(`.app-shortcut-item[data-app-id="${appId}"]`);
                    if (homeIcon) {
                        homeIcon.style.display = '';
                    }
                });
                app.appendChild(restoreBtn);
                
                hiddenAppsGrid.appendChild(app);
            });
        };
        
        renderHiddenApps();
        libraryWrap.appendChild(hiddenAppsSection);

        appLibraryPage.appendChild(libraryWrap);
        homeScroll.appendChild(appLibraryPage);
        // 將「App 資料庫」也納入 pages，確保分頁點與滾動可達
        pages.push({ page: appLibraryPage, grid: libraryWrap });

        // -------- 分頁點點 --------
        const renderDots = () => {
            dots.innerHTML = '';
            pages.forEach((_, idx) => {
                const dot = document.createElement('div');
                dot.className = 'dot' + (idx === 0 ? ' active' : '');
                dots.appendChild(dot);
            });
        };

        const updatePageDotsLocal = () => {
            const pageWidth = homeScroll.offsetWidth;
            const index = Math.round(homeScroll.scrollLeft / pageWidth);
            Array.from(dots.children).forEach((dot, idx) => {
                dot.classList.toggle('active', idx === index);
            });
        };

        renderDots();
        updatePageDotsLocal();
        homeScroll.addEventListener('scroll', () => {
            updatePageDotsLocal();
        }, { passive: true });

        // -------- 滑動翻頁 --------
        let pageDragX = 0;
        let pageDragScroll = 0;
        let pageDragTime = 0;
        let draggingPage = false;
        let isAnimating = false;
        let rafId = null;

        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

        const animatePageSnap = (targetLeft, duration = 380) => {
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            
            const startLeft = homeScroll.scrollLeft;
            const distance = targetLeft - startLeft;
            const startTime = performance.now();
            isAnimating = true;

            const tick = (now) => {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = easeOutCubic(progress);
                homeScroll.scrollLeft = startLeft + distance * eased;
                
                if (progress < 1) {
                    rafId = requestAnimationFrame(tick);
                } else {
                    isAnimating = false;
                    rafId = null;
                }
            };

            rafId = requestAnimationFrame(tick);
        };

        const snapToPage = (index) => {
            const clamped = Math.max(0, Math.min(index, pages.length - 1));
            animatePageSnap(clamped * homeScroll.offsetWidth, 320);
        };

        // 觸控滑動
        homeScroll.addEventListener('touchstart', (e) => {
            if (e.target.closest('.app-library-wrap')) return;
            draggingPage = true;
            pageDragX = e.touches[0]?.clientX || 0;
            pageDragScroll = homeScroll.scrollLeft;
            pageDragTime = Date.now();
            homeScroll.classList.add('dragging');
        }, { passive: true });

        homeScroll.addEventListener('touchmove', (event) => {
            if (!draggingPage) return;
            const point = event.touches[0];
            if (!point) return;
            event.preventDefault();
            const deltaX = point.clientX - pageDragX;
            homeScroll.scrollLeft = pageDragScroll - deltaX;
        }, { passive: false });

        homeScroll.addEventListener('touchend', (e) => {
            if (!draggingPage) return;
            draggingPage = false;
            homeScroll.classList.remove('dragging');
            
            const pageWidth = Math.max(homeScroll.clientWidth, 1);
            const currentScroll = homeScroll.scrollLeft;
            const deltaX = (e.changedTouches[0]?.clientX || 0) - pageDragX;
            const deltaTime = Math.max(Date.now() - pageDragTime, 1);
            const velocity = Math.abs(deltaX) / deltaTime;
            
            let currentIndex = Math.floor(currentScroll / pageWidth);
            const offsetRatio = (currentScroll % pageWidth) / pageWidth;
            
            const isFastSwipe = velocity > 0.15 && Math.abs(deltaX) > 15;
            let targetIndex;
            
            if (isFastSwipe) {
                if (deltaX > 0) {
                    targetIndex = Math.max(0, currentIndex);
                } else {
                    targetIndex = Math.min(pages.length - 1, currentIndex + 1);
                }
            } else {
                if (offsetRatio > 0.2) {
                    targetIndex = Math.min(pages.length - 1, currentIndex + 1);
                } else {
                    targetIndex = currentIndex;
                }
            }
            
            animatePageSnap(targetIndex * pageWidth, 320);
        });

        // 滾輪翻頁
        let wheelAccum = 0;
        const WHEEL_THRESHOLD = 50;
        homeScroll.addEventListener('wheel', (event) => {
            if (event.ctrlKey) return;
            if (isAnimating) return;

            const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
            if (!delta) return;

            event.preventDefault();
            wheelAccum += delta;

            if (Math.abs(wheelAccum) < WHEEL_THRESHOLD) return;

            const pageWidth = Math.max(homeScroll.clientWidth, 1);
            const currentIndex = Math.round(homeScroll.scrollLeft / pageWidth);
            const step = wheelAccum > 0 ? 1 : -1;
            const targetIndex = Math.max(0, Math.min(pages.length - 1, currentIndex + step));

            animatePageSnap(targetIndex * pageWidth, 320);
            wheelAccum = 0;
        }, { passive: false });

        // -------- 編輯模式相關（只在 ENABLE_HOME_EDIT 時啟用）--------
        if (ENABLE_HOME_EDIT) {
            // 拖曳編輯功能
            let draggingIcon = null;
            homeScroll.addEventListener('dragstart', (event) => {
                const icon = event.target.closest('.app-icon');
                if (!icon || !homeScreen.classList.contains('home-screen-edit')) {
                    event.preventDefault();
                    return;
                }
                draggingIcon = icon;
                icon.classList.add('dragging-icon');
                if (event.dataTransfer) {
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', icon.querySelector('span')?.textContent || 'app');
                }
            });

            homeScroll.addEventListener('dragend', () => {
                draggingIcon?.classList.remove('dragging-icon');
                draggingIcon = null;
            });

            homeScroll.addEventListener('dragover', (event) => {
                if (!draggingIcon || !homeScreen.classList.contains('home-screen-edit')) return;
                event.preventDefault();
            });

            homeScroll.addEventListener('drop', (event) => {
                if (!draggingIcon || !homeScreen.classList.contains('home-screen-edit')) return;
                event.preventDefault();

                const targetIcon = event.target.closest('.app-icon');
                if (targetIcon && targetIcon !== draggingIcon) {
                    // 建立資料夾
                    const folder = document.createElement('div');
                    folder.className = 'app-icon app-folder';
                    folder.setAttribute('draggable', 'false');
                    folder.innerHTML = `
                        <div class="icon-box folder-box">
                            <div class="folder-preview">
                                <span>${(draggingIcon.querySelector('span')?.textContent || 'A').slice(0, 1)}</span>
                                <span>${(targetIcon.querySelector('span')?.textContent || 'B').slice(0, 1)}</span>
                            </div>
                        </div>
                        <span>資料夾</span>
                    `;
                    targetIcon.replaceWith(folder);
                    draggingIcon.remove();
                    return;
                }

                const targetGrid = event.target.closest('.app-grid');
                if (targetGrid && !targetGrid.closest('.app-library-page')) {
                    targetGrid.appendChild(draggingIcon);
                }
            });

            // 長按進入編輯模式
            let pressTimer = null;
            let moved = false;
            const startPress = () => {
                moved = false;
                clearTimeout(pressTimer);
                pressTimer = setTimeout(() => {
                    homeScreen.classList.add('home-screen-edit');
                    document.querySelectorAll('#home-scroll .shortcut-hide-btn').forEach(btn => {
                        btn.style.display = 'flex';
                    });
                }, 500);
            };
            const cancelPress = () => {
                clearTimeout(pressTimer);
            };

            homeScreen.addEventListener('mousedown', (event) => {
                if (event.button !== 0) return;
                startPress();
            });
            homeScreen.addEventListener('touchstart', startPress, { passive: true });
            homeScreen.addEventListener('mousemove', () => {
                moved = true;
                if (moved) cancelPress();
            });
            homeScreen.addEventListener('touchmove', () => {
                moved = true;
                if (moved) cancelPress();
            }, { passive: true });
            homeScreen.addEventListener('mouseup', cancelPress);
            homeScreen.addEventListener('mouseleave', cancelPress);
            homeScreen.addEventListener('touchend', cancelPress);

            // 點擊空白處退出編輯模式
            document.addEventListener('click', (event) => {
                if (!homeScreen.classList.contains('home-screen-edit')) return;
                if (!event.target.closest('.app-icon') && !event.target.closest('.widget-card') && !event.target.closest('.library-category')) {
                    homeScreen.classList.remove('home-screen-edit');
                    document.querySelectorAll('#home-scroll .shortcut-hide-btn').forEach(btn => {
                        btn.style.display = 'none';
                    });
                }
            });
        }

        // Widget picker 事件
        picker?.addEventListener('click', (event) => {
            const btn = event.target.closest('.widget-option');
            if (!btn) return;
            const type = btn.dataset.widgetType;
            if (!type || !widgetLibrary[type]) return;

            const layoutWidgets = normalizeWidgetLayout(loadWidgetLayout());
            if (layoutWidgets.length) {
                layoutWidgets.push({
                    id: `home-widget-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
                    type,
                    size: '2x1',
                    bgColor: 'transparent',
                    opacity: 100,
                    radius: 16,
                    order: layoutWidgets.length
                });
                saveWidgetLayout(layoutWidgets);
            } else {
                const widgets = loadWidgets();
                widgets.push(type);
                saveWidgets(widgets);
            }

            renderWidgets();
            picker.classList.add('hidden');
        });

        // 初始渲染小工具
        renderWidgets();

        window.addEventListener('sx-home-widget-layout-updated', renderWidgets);
    };

    // --- 7. 全域視窗控制 ---
    const GITHUB_TOKEN_KEY = 'sx_github_token';
    const GITHUB_USER_KEY = 'sx_github_user';
    const GITHUB_REPO_KEY = 'sx_github_repo_name';
    const GITHUB_BACKUP_REPO = 'sxiphone-backup';

    const githubApi = (token, path, opts = {}) => fetch(`https://api.github.com${path}`, {
        ...opts,
        headers: {
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github.v3+json',
            ...(opts.headers || {})
        }
    }).then(r => {
        if (!r.ok) throw new Error(`GitHub API ${r.status}: ${r.statusText}`);
        return r.json();
    });

    const githubApiRaw = async (token, path, opts = {}) => {
        const res = await fetch(`https://api.github.com${path}`, {
            ...opts,
            headers: {
                Authorization: `token ${token}`,
                Accept: 'application/vnd.github.v3+json',
                ...(opts.headers || {})
            }
        });
        if (!res.ok) {
            const text = await res.text();
            let errMsg = `GitHub API ${res.status}: ${res.statusText}`;
            try { const errData = JSON.parse(text); errMsg = errData.message || errMsg; } catch {}
            throw new Error(errMsg);
        }
        return res;
    };

    const validateGitHubToken = async (token) => {
        const res = await githubApiRaw(token, '/user');
        return res.json();
    };

    const ensureBackupRepo = async (token, username) => {
        try {
            await githubApi(token, `/repos/${username}/${GITHUB_BACKUP_REPO}`);
            return GITHUB_BACKUP_REPO;
        } catch {
            await githubApiRaw(token, '/user/repos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: GITHUB_BACKUP_REPO,
                    private: true,
                    description: 'sxiphone 跨裝置備份儲存庫',
                    auto_init: true
                })
            });
            return GITHUB_BACKUP_REPO;
        }
    };

    const collectBackupData = async () => {
        const skipKeys = new Set([GITHUB_TOKEN_KEY, GITHUB_USER_KEY, GITHUB_REPO_KEY]);
        const data = { localStorage: {}, localforage: {}, persistedData: null };
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key || skipKeys.has(key)) continue;
            const val = localStorage.getItem(key);
            if (val && val.length > 512000) continue;
            data.localStorage[key] = val;
        }
        
        if (typeof localforage !== 'undefined') {
            try {
                await localforage.ready();
                const keys = await localforage.keys();
                for (const key of keys) {
                    if (skipKeys.has(key)) continue;
                    const val = await localforage.getItem(key);
                    data.localforage[key] = val;
                }
                
                const chatDataStore = localforage.createInstance({
                    name: 'sxiphone',
                    storeName: 'chatData'
                });
                const persistedData = await chatDataStore.getItem('sx_app_persisted_data');
                if (persistedData) {
                    data.persistedData = persistedData;
                    console.log('[GitHub] 收集 persistedData 完成，包含 keys:', Object.keys(persistedData));
                }
            } catch (e) {
                console.warn('[GitHub] 收集 IndexedDB 資料失敗:', e);
            }
        }
        
        return data;
    };

    const pushToGitHub = async (token, username, repo) => {
        const data = await collectBackupData();
        const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
        let sha = null;
        try {
            const existing = await githubApi(token, `/repos/${username}/${repo}/contents/backup.json`);
            sha = existing.sha;
        } catch {}
        const body = { message: `sxiphone backup ${new Date().toISOString()}`, content };
        if (sha) body.sha = sha;
        await githubApiRaw(token, `/repos/${username}/${repo}/contents/backup.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
    };

    const decodeBackupContent = (base64Content) => {
        const cleaned = base64Content.replace(/\s/g, '');
        if (cleaned.startsWith('eyJ') || /^[A-Za-z0-9+/=]+$/.test(cleaned)) {
            try {
                const decoded = decodeURIComponent(escape(atob(cleaned)));
                if (decoded.trim().startsWith('{') || decoded.trim().startsWith('[')) {
                    return decoded;
                }
            } catch (e) {
                console.warn('[GitHub] 標準 base64 解碼失敗，嘗試其他方式:', e.message);
            }
        }
        const trimmed = base64Content.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            return trimmed;
        }
        throw new Error('無法解析備份內容：格式不支援');
    };

    const pullFromGitHub = async (token, username, repo) => {
        const file = await githubApi(token, `/repos/${username}/${repo}/contents/backup.json`);
        const raw = decodeBackupContent(file.content);
        const data = JSON.parse(raw);
        const skipKeys = new Set([GITHUB_TOKEN_KEY, GITHUB_USER_KEY, GITHUB_REPO_KEY]);
        
        if (data.localStorage) {
            Object.entries(data.localStorage).forEach(([key, val]) => {
                if (!skipKeys.has(key)) localStorage.setItem(key, val);
            });
        } else {
            Object.entries(data).forEach(([key, val]) => {
                if (!skipKeys.has(key) && key !== 'localforage' && key !== 'persistedData') {
                    localStorage.setItem(key, val);
                }
            });
        }
        
        if (data.localforage && typeof localforage !== 'undefined') {
            try {
                for (const [key, val] of Object.entries(data.localforage)) {
                    if (!skipKeys.has(key)) {
                        await localforage.setItem(key, val);
                    }
                }
            } catch (e) {
                console.warn('[GitHub] localforage 還原失敗:', e);
            }
        }
        
        if (data.persistedData && typeof localforage !== 'undefined') {
            try {
                const chatDataStore = localforage.createInstance({
                    name: 'sxiphone',
                    storeName: 'chatData'
                });
                const existingPersisted = await chatDataStore.getItem('sx_app_persisted_data') || {};
                const mergedData = { ...existingPersisted, ...data.persistedData };
                await chatDataStore.setItem('sx_app_persisted_data', mergedData);
                console.log('[GitHub] persistedData 已還原，包含 keys:', Object.keys(mergedData));
                
                if (mergedData.userName) localStorage.setItem('sx_user_name', mergedData.userName);
                if (mergedData.userAvatar) localStorage.setItem('sx_user_avatar', mergedData.userAvatar);
                if (mergedData.userPersonality) localStorage.setItem('sx_user_personality', mergedData.userPersonality);
                if (mergedData.userBackground) localStorage.setItem('sx_user_background', mergedData.userBackground);
                if (mergedData.userLikes) localStorage.setItem('sx_user_likes', mergedData.userLikes);
if (mergedData.userTaboos) localStorage.setItem('sx_user_taboos', mergedData.userTaboos);
                if (mergedData.userStatus) localStorage.setItem('sx_user_status', mergedData.userStatus);
                if (mergedData.charName) localStorage.setItem('sx_char_name', mergedData.charName);
                if (mergedData.charAvatar) localStorage.setItem('sx_char_avatar', mergedData.charAvatar);
                if (mergedData.charPersonality) localStorage.setItem('sx_char_personality', mergedData.charPersonality);
                if (mergedData.charBackground) localStorage.setItem('sx_char_background', mergedData.charBackground);
                if (mergedData.sx_characters) localStorage.setItem('sx_characters', JSON.stringify(mergedData.sx_characters));
                if (mergedData.sx_users) localStorage.setItem('sx_users', JSON.stringify(mergedData.sx_users));
                if (mergedData.masks) localStorage.setItem('sx_masks', JSON.stringify(mergedData.masks));
                if (mergedData.apis) localStorage.setItem('api_configs', JSON.stringify(mergedData.apis));
            } catch (e) {
                console.warn('[GitHub] persistedData 還原失敗:', e);
            }
        }
        
        let count = 0;
        if (data.localStorage) count += Object.keys(data.localStorage).length;
        if (data.localforage) count += Object.keys(data.localforage).length;
        if (data.persistedData) count += 1;
        if (!data.localStorage && !data.localforage && !data.persistedData) {
            count = Object.keys(data).length;
        }
        
        console.log('[GitHub] 還原完成，共 ' + count + ' 筆資料');
        return count;
    };

    const showGitHubStep = (step) => {
        ['connect', 'loading', 'done', 'error', 'guest-confirm'].forEach(s => {
            const el = document.getElementById(`github-steps-${s}`);
            if (el) el.classList.toggle('hidden', s !== step);
        });
    };

    window.connectGitHub = async function() {
        const input = document.getElementById('github-token');
        const token = input?.value?.trim();
        if (!token) return;
        showGitHubStep('loading');
        const statusEl = document.getElementById('github-status');
        try {
            if (statusEl) statusEl.textContent = '正在驗證 Token...';
            const user = await validateGitHubToken(token);
            const username = user.login;
            localStorage.setItem(GITHUB_TOKEN_KEY, token);
            localStorage.setItem(GITHUB_USER_KEY, username);

            if (statusEl) statusEl.textContent = '正在建立備份儲存庫...';
            const repo = await ensureBackupRepo(token, username);
            localStorage.setItem(GITHUB_REPO_KEY, repo);

            try {
                if (statusEl) statusEl.textContent = '正在同步資料...';
                await pushToGitHub(token, username, repo);
            } catch (syncErr) {
                console.warn('首次同步失敗，稍後可手動備份', syncErr);
            }

            showGitHubStep('done');
            setTimeout(() => {
                document.getElementById('auth-modal')?.classList.add('hidden');
                const ls = document.getElementById('lock-screen');
                if (ls) ls.style.transform = 'translateY(-100%)';
            }, 1200);
        } catch (err) {
            console.error('GitHub 連接失敗:', err);
            localStorage.removeItem(GITHUB_TOKEN_KEY);
            localStorage.removeItem(GITHUB_USER_KEY);
            localStorage.removeItem(GITHUB_REPO_KEY);
            const msgEl = document.getElementById('github-error-msg');
            if (msgEl) msgEl.textContent = `連接失敗：${err.message || '請確認 Token 與權限'}`;
            showGitHubStep('error');
        }
    };

    window.resetGitHubFlow = function() {
        showGitHubStep('connect');
    };

    const GUEST_KEY = 'sx_guest_mode';

    window.guestLogin = function() {
        showGitHubStep('guest-confirm');
    };

    window.cancelGuest = function() {
        showGitHubStep('connect');
    };

    window.confirmGuest = function() {
        localStorage.setItem(GUEST_KEY, '1');
        document.getElementById('auth-modal')?.classList.add('hidden');
        const ls = document.getElementById('lock-screen');
        if (ls) ls.style.transform = 'translateY(-100%)';
    };

    window.syncToGitHub = async function() {
        const token = localStorage.getItem(GITHUB_TOKEN_KEY);
        const username = localStorage.getItem(GITHUB_USER_KEY);
        const repo = localStorage.getItem(GITHUB_REPO_KEY) || GITHUB_BACKUP_REPO;
        if (!token || !username) throw new Error('尚未連接 GitHub');
        await pushToGitHub(token, username, repo);
    };

    window.syncFromGitHub = async function() {
        const token = localStorage.getItem(GITHUB_TOKEN_KEY);
        const username = localStorage.getItem(GITHUB_USER_KEY);
        const repo = localStorage.getItem(GITHUB_REPO_KEY) || GITHUB_BACKUP_REPO;
        if (!token || !username) throw new Error('尚未連接 GitHub');
        return await pullFromGitHub(token, username, repo);
    };

    window.unlockPhone = function() {
        const githubToken = localStorage.getItem(GITHUB_TOKEN_KEY);
        const oldKey = localStorage.getItem('sxiphone_device_key');
        const guestMode = localStorage.getItem(GUEST_KEY);
        const ls = document.getElementById('lock-screen');
        if (!githubToken && !oldKey && !guestMode) {
            if (ls) ls.style.transform = 'translateY(0)';
            document.getElementById('auth-modal')?.classList.remove('hidden');
        } else {
            if (ls) ls.style.transform = 'translateY(-100%)';
        }
    };

    window.lockPhone = function() {
        const ls = document.getElementById('lock-screen');
        if(ls) ls.style.transform = 'translateY(0)';
        window.closeApp();
    };

    window.launchApp = function(appId) {
        const viewport = document.getElementById('app-viewport');
        const frame = document.getElementById('app-frame');
        const homeScreen = document.getElementById('home-screen');
        const lockScreen = document.getElementById('lock-screen');
        if (!viewport || !frame) return;

        if (appId === 'chat' && window.FloatingMessenger) {
            window.FloatingMessenger.clearBadge();
        }

        if (phoneCheckActive && appId !== currentAppId) {
            viewport.classList.add('phone-check-active');
            updatePhoneCheckOverlay();
        }

        const appIdRaw = appId || '';
        const [appIdBase, queryStringRaw] = appIdRaw.split('?');
        const queryString = queryStringRaw ? `?${queryStringRaw}` : '';
        currentAppId = appIdBase;
        ensureAppFolder(currentAppId);
        frame.src = `apps/${appIdBase}/${appIdBase}.html${queryString}`;
        frame.onload = () => {
            trackAppStorageForFrame(frame, currentAppId);
            syncAppFolderSnapshot(currentAppId);
            const theme = getThemeSnapshot();
            syncThemeToFrame(frame, theme);
            syncLanguageToFrame(frame, getCurrentLang());
            frame.contentWindow?.postMessage({ type: 'THEME_APPLIED', ...theme }, '*');
            
            const appearanceConfig = getAppearanceSnapshot();
            frame.contentWindow?.postMessage({ type: 'APPEARANCE_THEME_CHANGED', config: appearanceConfig }, '*');
            
            // 載入自定義外觀設定
            const themeMode = localStorage.getItem('sx_theme_mode') || 'dark';
            const useGlobalKey = `sx_app_interface_${currentAppId}_use_global`;
            const useGlobal = localStorage.getItem(useGlobalKey);
            
            let settingsToSend = null;
            
            // 優先使用已儲存的外觀設定
            const savedGlobalAppearance = localStorage.getItem('sx_global_appearance_saved');
            if (savedGlobalAppearance) {
                try { settingsToSend = JSON.parse(savedGlobalAppearance); } catch (e) {}
            }
            
            if (!settingsToSend && useGlobal !== 'false') {
                // 使用全域設定（根據當前模式）
                if (themeMode === 'custom-light') {
                    const raw = localStorage.getItem('sx_app_interface_custom_light');
                    if (raw) {
                        try { settingsToSend = JSON.parse(raw); } catch (e) {}
                    }
                } else if (themeMode === 'custom-dark') {
                    const raw = localStorage.getItem('sx_app_interface_custom_dark');
                    if (raw) {
                        try { settingsToSend = JSON.parse(raw); } catch (e) {}
                    }
                }
            } else if (!settingsToSend) {
                // 使用個別設定
                const appInterfaceKey = `sx_app_interface_${currentAppId}`;
                const raw = localStorage.getItem(appInterfaceKey);
                if (raw) {
                    try { settingsToSend = JSON.parse(raw); } catch (e) {}
                }
            }
            
            if (settingsToSend) {
                frame.contentWindow?.postMessage({ 
                    type: 'APP_APPEARANCE_CHANGED', 
                    appId: currentAppId, 
                    settings: settingsToSend 
                }, '*');
            }
        };
        viewport.classList.add('active');
        homeScreen?.classList.add('app-open');
        lockScreen?.classList.add('app-open');
        
        const statusBar = document.querySelector('.status-bar');
        if (currentAppId === 'home') {
            if (statusBar) statusBar.style.display = 'none';
        } else {
            let themeConfig = {};
            try { themeConfig = JSON.parse(localStorage.getItem('sx_custom_theme_config') || '{}'); } catch {}
            if (themeConfig.hideTopbar) {
                if (statusBar) statusBar.style.display = 'none';
            } else {
                if (statusBar) statusBar.style.display = '';
            }
        }
    };

    const initPhoneCheckState = () => {
        const storedValue = localStorage.getItem(PHONE_CHECK_KEY);
        if (storedValue === null) {
            phoneCheckEnabled = false;
            localStorage.setItem(PHONE_CHECK_KEY, '0');
        } else {
            phoneCheckEnabled = storedValue === '1';
        }
        if (!phoneCheckEnabled) {
            stopPhoneCheck();
        }
    };

    const isAndroid = () => /android/i.test(navigator.userAgent);

    const initAndroidBackButton = () => {
        if (!isAndroid()) return;
        
        let appHistory = [];
        
        window.addEventListener('launchApp', (e) => {
            if (e.detail?.appId) {
                appHistory.push(e.detail.appId);
            }
        });

        const originalLaunchApp = window.launchApp;
        window.launchApp = function(appId) {
            appHistory.push(appId);
            originalLaunchApp(appId);
        };

        window.addEventListener('popstate', () => {
            if (appHistory.length > 0) {
                appHistory.pop();
            }
            if (currentAppId) {
                window.closeApp();
            }
        });

        if (history.state === null) {
            history.replaceState({ init: true }, '');
        }
        
        window.pushAppHistory = function(appId) {
            history.pushState({ app: appId }, '', `#app-${appId}`);
        };
    };

    window.closeApp = function() {
        const frame = document.getElementById('app-frame');
        if (frame && frame.contentWindow && currentAppId) {
            try {
                frame.contentWindow.postMessage({ type: 'APP_WILL_CLOSE', appId: currentAppId }, '*');
            } catch (e) {
                console.warn('通知 iframe 保存失敗:', e);
            }
        }

        const viewport = document.getElementById('app-viewport');
        const homeScreen = document.getElementById('home-screen');
        const lockScreen = document.getElementById('lock-screen');
        if (viewport) {
            viewport.classList.remove('active');
            if (!phoneCheckActive) {
                viewport.classList.remove('phone-check-active');
            }
            homeScreen?.classList.remove('app-open');
            lockScreen?.classList.remove('app-open');
            setTimeout(() => { 
                if (!viewport.classList.contains('active') && frame) {
                    frame.src = "about:blank"; 
                }
            }, 400);
        }
        currentAppId = '';
        
        const statusBar = document.querySelector('.status-bar');
        let themeConfig = {};
        try { themeConfig = JSON.parse(localStorage.getItem('sx_custom_theme_config') || '{}'); } catch {}
        if (statusBar) {
            if (themeConfig.hideTopbar) {
                statusBar.style.display = 'none';
            } else {
                statusBar.style.display = '';
            }
        }
    };

    // --- 8. iOS Safari / Android Chrome 儲存保護 ---
    const requestStoragePersistence = async () => {
        if (navigator.storage && navigator.storage.persist) {
            try {
                const isPersisted = await navigator.storage.persist();
                console.log('儲存持久化狀態:', isPersisted ? '已啟用' : '未啟用');
                return isPersisted;
            } catch (e) {
                console.warn('儲存持久化請求失敗:', e);
                return false;
            }
        }
        return false;
    };

    const notifyFrameToSave = () => {
        const frame = document.getElementById('app-frame');
        if (frame && frame.contentWindow) {
            try {
                frame.contentWindow.postMessage({ type: 'APP_WILL_CLOSE', appId: currentAppId }, '*');
            } catch (e) {
                console.warn('通知 iframe 保存失敗:', e);
            }
        }
    };

    const saveAllData = () => {
        notifyFrameToSave();
        
        // 強制寫入一個時間戳，確保 localStorage 被更新
        try {
            localStorage.setItem('sx_last_save_time', new Date().toISOString());
        } catch (e) {
            console.warn('保存時間戳失敗:', e);
        }
    };

    // iOS Safari 特別處理：pagehide 比 beforeunload 更可靠
    window.addEventListener('pagehide', (event) => {
        console.log('頁面即將隱藏，保存數據...');
        saveAllData();
    });

    // visibilitychange 處理
    let _lastVisibilityChangeTime = 0;
    const VISIBILITY_CHANGE_THRESHOLD = 500;
    
    document.addEventListener('visibilitychange', () => {
        const now = Date.now();
        if (now - _lastVisibilityChangeTime < VISIBILITY_CHANGE_THRESHOLD) {
            console.log('[Visibility] 忽略快速重複的 visibilitychange 事件');
            return;
        }
        _lastVisibilityChangeTime = now;
        
        if (document.visibilityState === 'hidden') {
            console.log('頁面變為不可見，保存數據...');
            saveAllData();
        } else if (document.visibilityState === 'visible') {
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                          (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
            const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                          window.navigator.standalone === true;
            
            if (!isIOS || !isPWA) {
                const preferredFullscreen = localStorage.getItem('sx_fullscreen_preferred');
                if (preferredFullscreen === 'true' && window.SxBrowserCompat) {
                    const isCurrentlyFullscreen = window.SxBrowserCompat.isFullscreen();
                    if (!isCurrentlyFullscreen) {
                        console.log('[Fullscreen] 恢復全螢幕模式...');
                        window.SxBrowserCompat.requestFullscreen().catch(() => {});
                    }
                }
            }
        }
    });

    // beforeunload 作為備用
    window.addEventListener('beforeunload', () => {
        saveAllData();
    });

    // 凍結事件（Android Chrome）
    document.addEventListener('freeze', () => {
        console.log('頁面被凍結，保存數據...');
        saveAllData();
    });

    // --- 9. 初始化執行 ---
    const initGlobalMemorySystem = async () => {
        if (window.globalMemorySystem && window.globalMemorySystem.isInitialized) {
            return window.globalMemorySystem;
        }
        
        try {
            if (!window.globalMemorySystem) {
                console.warn('[GlobalMemory] window.globalMemorySystem 不存在，無法初始化');
                return null;
            }
            
            await window.globalMemorySystem.initialize((progress) => {
                console.log(`[GlobalMemory] 初始化進度: ${progress.stage} ${progress.progress}%`);
            });
            
            if (window.globalMemorySystem.sleepScheduler) {
                window.globalMemorySystem.startSleepScheduler();
            }
            
            console.log('[GlobalMemory] 全域記憶系統已啟動');
            return window.globalMemorySystem;
        } catch (e) {
            console.error('[GlobalMemory] 初始化失敗:', e);
            return null;
        }
    };

    window.addEventListener('message', async (event) => {
        const { type, payload } = event.data || {};
        if (!type) return;
        
        const validPrefixes = ['GLOBAL_MEMORY_', 'TRIGGER_', 'GET_MEMORY_CONTEXT'];
        const isValidType = validPrefixes.some(prefix => type.startsWith(prefix)) || type === 'AI_SLEEP_SETTINGS_UPDATED';
        if (!isValidType) return;
        
        const gms = window.globalMemorySystem;
        if (!gms || !gms.isInitialized) {
            console.warn('[GlobalMemory] 系統未初始化，無法處理訊息:', type);
            return;
        }
        
        const sourceWindow = event.source || event.target;
        
        try {
            switch (type) {
                case 'GLOBAL_MEMORY_HOLD': {
                    const holdResult = await gms.hold(payload.content, payload.options);
                    sourceWindow?.postMessage({ type: 'GLOBAL_MEMORY_HOLD_RESULT', result: holdResult }, '*');
                    break;
                }
                case 'GLOBAL_MEMORY_RECALL': {
                    const recallResult = await gms.recall(payload.options);
                    sourceWindow?.postMessage({ type: 'GLOBAL_MEMORY_RECALL_RESULT', result: recallResult }, '*');
                    break;
                }
                case 'GLOBAL_MEMORY_SEARCH': {
                    const searchResult = await gms.search(payload.query, payload.options);
                    sourceWindow?.postMessage({ type: 'GLOBAL_MEMORY_SEARCH_RESULT', result: searchResult }, '*');
                    break;
                }
                case 'GLOBAL_MEMORY_PROCESS_APP': {
                    const appResult = await gms.processAppMemory(payload.appId, payload.data);
                    sourceWindow?.postMessage({ type: 'GLOBAL_MEMORY_PROCESS_APP_RESULT', result: appResult }, '*');
                    break;
                }
                case 'GLOBAL_MEMORY_CONVERSATION_START': {
                    const convResult = await gms.conversationStart();
                    sourceWindow?.postMessage({ type: 'GLOBAL_MEMORY_CONVERSATION_START_RESULT', result: convResult }, '*');
                    break;
                }
                case 'GLOBAL_MEMORY_GET_AWAKENING_PROMPT': {
                    const prompt = await gms.getAwakeningPrompt();
                    sourceWindow?.postMessage({ type: 'GLOBAL_MEMORY_AWAKENING_PROMPT_RESULT', prompt }, '*');
                    break;
                }
                case 'GLOBAL_MEMORY_TRIGGER_SLEEP': {
                    const sleepResult = await gms.triggerSleep();
                    sourceWindow?.postMessage({ type: 'GLOBAL_MEMORY_SLEEP_RESULT', result: sleepResult }, '*');
                    break;
                }
                case 'GLOBAL_MEMORY_GET_STATUS': {
                    const status = gms.getStatus();
                    sourceWindow?.postMessage({ type: 'GLOBAL_MEMORY_STATUS_RESULT', status }, '*');
                    break;
                }
                case 'AI_SLEEP_SETTINGS_UPDATED':
                    if (gms.sleepScheduler) {
                        console.log('[GlobalMemory] 收到睡眠設定更新:', payload);
                        if (payload.sleepStart) {
                            const [hour, minute] = payload.sleepStart.split(':').map(Number);
                            gms.sleepScheduler.nightlySleepTime = { hour, minute };
                        }
                    }
                    break;
                case 'TRIGGER_AI_SLEEP': {
                    console.log('[GlobalMemory] 收到手動觸發睡眠指令');
                    const manualSleepResult = await gms.triggerSleep(payload?.reason || 'manual');
                    sourceWindow?.postMessage({ type: 'GLOBAL_MEMORY_SLEEP_RESULT', result: manualSleepResult }, '*');
                    break;
                }
                case 'TRIGGER_KEYWORD_RECALL': {
                    console.log('[GlobalMemory] 收到關鍵詞觸發回憶指令:', payload?.keyword);
                    if (gms.awakeningEngine) {
                        const keywordResults = await gms.triggerRecallByKeyword(payload?.keyword || '', payload?.options || {});
                        sourceWindow?.postMessage({ type: 'KEYWORD_RECALL_RESULT', results: keywordResults }, '*');
                    }
                    break;
                }
                case 'GET_MEMORY_CONTEXT':
                    if (gms.awakeningEngine) {
                        const context = gms.getMemoryContext();
                        sourceWindow?.postMessage({ type: 'MEMORY_CONTEXT_RESULT', context }, '*');
                    }
                    break;
                case 'TRIGGER_DAILY_AWAKENING': {
                    console.log('[GlobalMemory] 收到手動觸發每日喚醒指令');
                    if (gms.awakeningEngine) {
                        const awakeningResult = await gms.dailyAwakening();
                        sourceWindow?.postMessage({ type: 'DAILY_AWAKENING_RESULT', result: awakeningResult }, '*');
                    }
                    break;
                }
            }
        } catch (e) {
            console.error('[GlobalMemory] 訊息處理錯誤:', e);
        }
    });

    const ENV_AWARENESS_KEY = 'sx_env_awareness_settings';
    
    const getEnvAwarenessSettings = () => {
        try {
            const raw = localStorage.getItem(ENV_AWARENESS_KEY);
            if (!raw) return { enabled: false };
            return JSON.parse(raw);
        } catch {
            return { enabled: false };
        }
    };
    
    const getEnvContext = () => {
        const settings = getEnvAwarenessSettings();
        if (!settings.enabled) return '';
        
        const parts = [];
        const now = new Date();
        const timezone = settings.autoTimezone 
            ? Intl.DateTimeFormat().resolvedOptions().timeZone 
            : settings.manualTimezone || 'Asia/Taipei';
        
        if (settings.injectTime !== false) {
            const timeStr = now.toLocaleString('zh-TW', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
                hour: '2-digit',
                minute: '2-digit',
                timeZone
            });
            
            const hour = now.getHours();
            let timeOfDay = '';
            if (hour >= 5 && hour < 12) {
                timeOfDay = '早上';
            } else if (hour >= 12 && hour < 14) {
                timeOfDay = '中午';
            } else if (hour >= 14 && hour < 18) {
                timeOfDay = '下午';
            } else if (hour >= 18 && hour < 22) {
                timeOfDay = '晚上';
            } else {
                timeOfDay = '深夜';
            }
            
            parts.push(`目前時間：${timeStr}（${timeOfDay}）`);
            parts.push(`ISO 時間：${now.toISOString()}`);
        }
        
        if (settings.injectLocation !== false) {
            const displayLocation = settings.locationDisplay;
            const actualCity = settings.locationCity;
            
            if (settings.useFictionalLocation && displayLocation) {
                parts.push(`所在地：${displayLocation}`);
            } else if (actualCity) {
                const location = settings.locationCountry 
                    ? `${actualCity}, ${settings.locationCountry}`
                    : actualCity;
                parts.push(`所在地：${location}`);
            } else if (displayLocation) {
                parts.push(`所在地：${displayLocation}`);
            }
        }
        
        if (settings.injectWeather !== false && settings.cachedWeather) {
            const w = settings.cachedWeather;
            parts.push(`目前天氣：${w.description}，氣溫 ${w.temperature}°C`);
        }
        
        const result = parts.join('\n');
        console.log('[EnvAwareness] 環境上下文已更新:', result.substring(0, 100) + '...');
        return result;
    };
    
    window.getEnvContext = getEnvContext;
    window.getEnvSettings = getEnvAwarenessSettings;
    
    window.addEventListener('message', (event) => {
        const { type } = event.data || {};
        
        if (type === 'GET_ENV_CONTEXT') {
            const sourceWindow = event.source || event.target;
            const context = getEnvContext();
            sourceWindow?.postMessage({ type: 'ENV_CONTEXT_RESULT', context }, '*');
        }
    });

    const checkStorageStatus = async () => {
        if (navigator.storage && navigator.storage.estimate) {
            const { usage, quota } = await navigator.storage.estimate();
            const usedMB = (usage / 1024 / 1024).toFixed(2);
            const quotaMB = (quota / 1024 / 1024).toFixed(2);
            console.log(`[Storage] 已用 ${usedMB}MB / 總計 ${quotaMB}MB`);
            if (usage / quota > 0.8) {
                console.warn('[Storage] 儲存空間即將用盡，請清理舊資料');
            }
        }
    };

    // ─── 啟動時自動遷移 base64 圖片到圖床 ──────────────────────────────────
    const _migrateBase64ToImageHost = async () => {
        if (typeof ImageUploader === 'undefined' || !ImageUploader.isEnabled()) return;

        const IMAGE_KEYS = [
            'userWallpaper',
            'userLockscreen',
            'sx_char_avatar',
            'sx_user_avatar'
        ];

        let migrated = 0;
        for (const key of IMAGE_KEYS) {
            try {
                const val = localStorage.getItem(key);
                if (!val || !ImageUploader.isBase64(val)) continue;

                console.info(`[ImageMigrate] 偵測到 base64 圖片: ${key} (${(val.length / 1024).toFixed(0)}KB)`);
                const url = await ImageUploader.upload(val);
                if (url) {
                    localStorage.setItem(key, url);
                    migrated++;
                    console.info(`[ImageMigrate] ${key} → ${url}`);
                }
            } catch (e) {
                console.warn(`[ImageMigrate] ${key} 遷移失敗:`, e);
            }
        }

        // 掃描角色列表中的 avatar
        try {
            const charsRaw = localStorage.getItem('sx_characters');
            if (charsRaw) {
                const chars = JSON.parse(charsRaw);
                let charMigrated = 0;
                if (Array.isArray(chars)) {
                    for (const char of chars) {
                        if (char.avatar && ImageUploader.isBase64(char.avatar)) {
                            const url = await ImageUploader.upload(char.avatar);
                            if (url) {
                                char.avatar = url;
                                charMigrated++;
                            }
                        }
                    }
                    if (charMigrated > 0) {
                        localStorage.setItem('sx_characters', JSON.stringify(chars));
                        migrated += charMigrated;
                        console.info(`[ImageMigrate] 角色 avatar 遷移: ${charMigrated} 張`);
                    }
                }
            }
        } catch (e) {
            console.warn('[ImageMigrate] 角色 avatar 掃描失敗:', e);
        }

        // 掃描 masks 中的 avatar
        try {
            const masksRaw = localStorage.getItem('sx_masks');
            if (masksRaw) {
                const masks = JSON.parse(masksRaw);
                let maskMigrated = 0;
                if (Array.isArray(masks)) {
                    for (const mask of masks) {
                        if (mask.avatar && ImageUploader.isBase64(mask.avatar)) {
                            const url = await ImageUploader.upload(mask.avatar);
                            if (url) {
                                mask.avatar = url;
                                maskMigrated++;
                            }
                        }
                    }
                    if (maskMigrated > 0) {
                        localStorage.setItem('sx_masks', JSON.stringify(masks));
                        migrated += maskMigrated;
                    }
                }
            }
        } catch (_) {}

        // 掃描相簿中的 base64
        try {
            const albumRaw = localStorage.getItem('sx_album_uploaded_images');
            if (albumRaw) {
                const imgs = JSON.parse(albumRaw);
                let albumMigrated = 0;
                if (Array.isArray(imgs)) {
                    for (const img of imgs) {
                        if (img.url && ImageUploader.isBase64(img.url)) {
                            const url = await ImageUploader.upload(img.url);
                            if (url) {
                                img.url = url;
                                albumMigrated++;
                            }
                        }
                    }
                    if (albumMigrated > 0) {
                        localStorage.setItem('sx_album_uploaded_images', JSON.stringify(imgs));
                        migrated += albumMigrated;
                        console.info(`[ImageMigrate] 相簿圖片遷移: ${albumMigrated} 張`);
                    }
                }
            }
        } catch (_) {}

        if (migrated > 0) {
            console.info(`[ImageMigrate] ✅ 總計遷移 ${migrated} 張 base64 圖片到圖床`);
        } else {
            console.info('[ImageMigrate] 無需遷移的 base64 圖片');
        }
    };

    function init() {
        // 啟動 localStorage 全域反射層（所有 key 走 sxStorage / IndexedDB）
        try {
            if (window.__localStorageMirror?.markSxReady) {
                window.__localStorageMirror.markSxReady();
            }
        } catch (_) {}

        requestStoragePersistence().catch(e => console.warn('Storage persistence failed:', e));
        checkStorageStatus().catch(e => console.warn('Storage status check failed:', e));

        // 延遲執行圖片自動上傳遷移（base64 → 圖床 URL）
        setTimeout(_migrateBase64ToImageHost, 8000);

        applyLanguageToUI();
        updateClock();
        setInterval(updateClock, 1000);
        
        initAndroidBackButton();
        
        const root = document.documentElement;
        root.style.setProperty('--phone-width', (localStorage.getItem('sx_setting_w') || '375') + 'px');
        root.style.setProperty('--phone-height', (localStorage.getItem('sx_setting_h') || '812') + 'px');
        
        // 優先讀取 userWallpaper
        const saved = localStorage.getItem('userWallpaper');
        if (saved) {
            applyWallpaper(saved);
        }
        
        // 讀取鎖屏桌布
        const savedLockscreen = localStorage.getItem('userLockscreen');
        if (savedLockscreen) {
            applyLockscreen(savedLockscreen);
        }
        
                if (window.lucide) lucide.createIcons();

        if (floatingBall) {
            const enabled = localStorage.getItem('sx_ball_enabled') === '1';
            if (enabled) {
                floatingBall.classList.remove('hidden');
            } else {
                floatingBall.classList.add('hidden');
            }
            applyBallStyleFromStorage();
        }

        // 暫時停用首頁進階功能，保留最基礎 App 開啟流程
        initHomePages();
        initPhoneCheckState();
        
        // 在 initHomePages 之後重新套用自訂圖標和語言，因為 initHomePages 會建立新的圖標元素
        applyCustomIcons();
        applyLanguageToUI();
        
        // 自動向量化現有記憶
        const autoVectorizeExistingMemories = async () => {
            const system = newMemorySystem || window.globalMemorySystem;
            if (!system || !system.isInitialized) return;
            
            if (!system.embeddingEngine || !system.embeddingEngine.isInitialized) {
                console.log('[Memory] EmbeddingEngine 未初始化，跳過自動向量化');
                return;
            }
            
            if (typeof system.getVectorizationStats !== 'function') {
                console.log('[Memory] 系統不支援 getVectorizationStats，跳過自動向量化');
                return;
            }
            
            try {
                const stats = await system.getVectorizationStats();
                if (stats && stats.notVectorized > 0) {
                    console.log(`[Memory] 發現 ${stats.notVectorized} 條未向量化的記憶，開始背景處理...`);
                    
                    if (typeof system.vectorizeExistingMemories === 'function') {
                        const result = await system.vectorizeExistingMemories({
                            batchSize: 3,
                            delayBetweenBatches: 200
                        });
                        
                        console.log(`[Memory] 背景向量化完成: ${result.vectorized} 成功, ${result.failed} 失敗`);
                    }
                }
            } catch (e) {
                console.warn('[Memory] 自動向量化失敗:', e);
            }
        };
        
        // 初始化記憶系統
        setTimeout(async () => {
            try {
                await initUnifiedMemorySystem();
            } catch (e) {
                console.error('[Init] Memory system init failed:', e);
            }
            
            setTimeout(autoVectorizeExistingMemories, 5000);
            
            // 檢查是否需要每日喚醒
            setTimeout(async () => {
                const um = window.unifiedMemory;
                if (um && um.isInitialized) {
                    const awakeningEngine = um.awakeningEngine;
                    if (awakeningEngine) {
                        const status = awakeningEngine.getAwakeningStatus();
                        if (status.needsAwakening) {
                            console.log('[Memory] 偵測到新的一天，執行每日喚醒...');
                            try {
                                const awakeningResult = await um.awaken();
                                console.log('[Memory] 每日喚醒完成:', awakeningResult.summary?.text);
                            } catch (e) {
                                console.warn('[Memory] 每日喚醒失敗:', e);
                            }
                        }
                    }
                    
                    // 設置身份
                    const userName = localStorage.getItem('sx_user_name');
                    if (userName && !um.getIdentity()) {
                        um.setIdentity({ name: userName, type: 'user_companion' });
                    }
                }
            }, 3000);
        }, 2000);
    }
    
    init();
})();
