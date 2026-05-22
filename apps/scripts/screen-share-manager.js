(function() {
    'use strict';

    class ScreenShareManager {
        constructor(options = {}) {
            this.stream = null;
            this.videoElement = null;
            this.canvasElement = null;
            this.isSharing = false;
            this.onFrameCallback = options.onFrame || null;
            this.onStopCallback = options.onStop || null;
            this.frameInterval = options.frameInterval || 1000;
            this.frameTimer = null;
            this.quality = options.quality || 0.8;
            this.maxWidth = options.maxWidth || 1920;
            this.maxHeight = options.maxHeight || 1080;
        }

        async start(options = {}) {
            if (this.isSharing) {
                console.warn('[ScreenShareManager] 已經在分享中');
                return this.stream;
            }

            if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
                console.error('[ScreenShareManager] 此瀏覽器不支援螢幕分享');
                return null;
            }

            const defaultOptions = {
                video: {
                    displaySurface: 'monitor',
                    width: { ideal: this.maxWidth },
                    height: { ideal: this.maxHeight },
                    frameRate: { ideal: 30 }
                },
                audio: false,
                preferCurrentTab: false,
                selfBrowserSurface: 'include',
                systemAudio: 'exclude',
                surfaceSwitching: 'include',
                monitorTypeSurfaces: 'include'
            };

            const shareOptions = { ...defaultOptions, ...options };

            try {
                this.stream = await navigator.mediaDevices.getDisplayMedia(shareOptions);
                
                this.setupVideoElement();
                this.setupCanvasElement();
                this.bindStreamEvents();
                
                this.isSharing = true;
                
                if (this.onFrameCallback) {
                    this.startFrameCapture();
                }
                
                console.log('[ScreenShareManager] 螢幕分享已開始');
                
                this.emit('started', { stream: this.stream });
                
                return this.stream;
            } catch (err) {
                console.error('[ScreenShareManager] 啟動螢幕分享失敗:', err);
                this.emit('error', { error: err });
                return null;
            }
        }

        setupVideoElement() {
            this.videoElement = document.createElement('video');
            this.videoElement.srcObject = this.stream;
            this.videoElement.autoplay = true;
            this.videoElement.playsInline = true;
            this.videoElement.muted = true;
            this.videoElement.style.position = 'fixed';
            this.videoElement.style.top = '0';
            this.videoElement.style.left = '0';
            this.videoElement.style.width = '100%';
            this.videoElement.style.height = '100%';
            this.videoElement.style.objectFit = 'contain';
            this.videoElement.style.zIndex = '9999';
            this.videoElement.style.background = '#000';
            this.videoElement.style.opacity = '0';
            this.videoElement.style.pointerEvents = 'none';
            
            document.body.appendChild(this.videoElement);
            
            this.videoElement.play().catch(err => {
                console.warn('[ScreenShareManager] 播放視頻失敗:', err);
            });
        }

        setupCanvasElement() {
            this.canvasElement = document.createElement('canvas');
            this.canvasElement.style.display = 'none';
            document.body.appendChild(this.canvasElement);
        }

        bindStreamEvents() {
            const videoTrack = this.stream.getVideoTracks()[0];
            
            if (videoTrack) {
                videoTrack.onended = () => {
                    this.stop();
                };
                
                videoTrack.addEventListener('ended', () => {
                    this.stop();
                });
            }
            
            this.stream.getTracks().forEach(track => {
                track.addEventListener('ended', () => {
                    if (!this.stream.getTracks().some(t => t.readyState === 'live')) {
                        this.stop();
                    }
                });
            });
        }

        startFrameCapture() {
            if (this.frameTimer) {
                clearInterval(this.frameTimer);
            }
            
            this.frameTimer = setInterval(() => {
                this.captureFrame();
            }, this.frameInterval);
        }

        stopFrameCapture() {
            if (this.frameTimer) {
                clearInterval(this.frameTimer);
                this.frameTimer = null;
            }
        }

        captureFrame() {
            if (!this.videoElement || !this.canvasElement || !this.isSharing) {
                return null;
            }

            const video = this.videoElement;
            const canvas = this.canvasElement;
            
            if (video.videoWidth === 0 || video.videoHeight === 0) {
                return null;
            }
            
            const scale = Math.min(
                this.maxWidth / video.videoWidth,
                this.maxHeight / video.videoHeight,
                1
            );
            
            canvas.width = Math.floor(video.videoWidth * scale);
            canvas.height = Math.floor(video.videoHeight * scale);
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const dataUrl = canvas.toDataURL('image/jpeg', this.quality);
            
            if (this.onFrameCallback) {
                this.onFrameCallback(dataUrl);
            }
            
            this.emit('frame', { dataUrl, width: canvas.width, height: canvas.height });
            
            return dataUrl;
        }

        captureScreenshot() {
            return this.captureFrame();
        }

        async captureAndSend() {
            const dataUrl = this.captureFrame();
            
            if (dataUrl && window.parent !== window) {
                window.parent.postMessage({
                    type: 'SCREEN_SHARE_FRAME',
                    dataUrl: dataUrl
                }, '*');
            }
            
            return dataUrl;
        }

        stop() {
            if (!this.isSharing) return;
            
            this.stopFrameCapture();
            
            if (this.stream) {
                this.stream.getTracks().forEach(track => {
                    track.stop();
                });
                this.stream = null;
            }
            
            if (this.videoElement) {
                this.videoElement.srcObject = null;
                this.videoElement.remove();
                this.videoElement = null;
            }
            
            if (this.canvasElement) {
                this.canvasElement.remove();
                this.canvasElement = null;
            }
            
            this.isSharing = false;
            
            if (this.onStopCallback) {
                this.onStopCallback();
            }
            
            this.emit('stopped');
            
            console.log('[ScreenShareManager] 螢幕分享已停止');
        }

        getState() {
            return {
                isSharing: this.isSharing,
                hasStream: !!this.stream,
                trackCount: this.stream ? this.stream.getTracks().length : 0,
                videoSize: this.videoElement ? {
                    width: this.videoElement.videoWidth,
                    height: this.videoElement.videoHeight
                } : null
            };
        }

        getStream() {
            return this.stream;
        }

        getVideoTrack() {
            if (!this.stream) return null;
            return this.stream.getVideoTracks()[0] || null;
        }

        getAudioTrack() {
            if (!this.stream) return null;
            return this.stream.getAudioTracks()[0] || null;
        }

        async getSettings() {
            const track = this.getVideoTrack();
            if (!track) return null;
            
            return track.getSettings();
        }

        async switchDisplaySurface() {
            if (!this.isSharing) return false;
            
            const videoTrack = this.getVideoTrack();
            if (!videoTrack) return false;
            
            try {
                await videoTrack.applyConstraints({
                    displaySurface: 'monitor'
                });
                return true;
            } catch (err) {
                console.warn('[ScreenShareManager] 切換顯示表面失敗:', err);
                return false;
            }
        }

        setQuality(quality) {
            this.quality = Math.max(0.1, Math.min(1, quality));
        }

        setFrameInterval(interval) {
            this.frameInterval = Math.max(100, interval);
            
            if (this.isSharing && this.onFrameCallback) {
                this.startFrameCapture();
            }
        }

        setMaxSize(width, height) {
            this.maxWidth = Math.max(320, width);
            this.maxHeight = Math.max(240, height);
        }

        on(event, callback) {
            if (!this._eventListeners) {
                this._eventListeners = new Map();
            }
            if (!this._eventListeners.has(event)) {
                this._eventListeners.set(event, []);
            }
            this._eventListeners.get(event).push(callback);
        }

        off(event, callback) {
            if (!this._eventListeners || !this._eventListeners.has(event)) return;
            
            const listeners = this._eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }

        emit(event, data) {
            if (!this._eventListeners || !this._eventListeners.has(event)) return;
            
            this._eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (err) {
                    console.error('[ScreenShareManager] 事件回調錯誤:', err);
                }
            });
        }

        static isSupported() {
            return !!(
                navigator.mediaDevices &&
                navigator.mediaDevices.getDisplayMedia
            );
        }

        static getCapabilities() {
            if (!ScreenShareManager.isSupported()) {
                return { supported: false };
            }
            
            return {
                supported: true,
                canShareAudio: true,
                canShareScreen: true,
                canShareWindow: true,
                canShareTab: true
            };
        }
    }

    class ScreenAnalyzer {
        constructor(screenShareManager) {
            this.manager = screenShareManager;
            this.analysisInterval = 5000;
            this.analysisTimer = null;
            this.lastAnalysis = null;
            this.onAnalysisCallback = null;
        }

        startAnalysis(callback, interval = 5000) {
            this.onAnalysisCallback = callback;
            this.analysisInterval = interval;
            
            if (this.analysisTimer) {
                clearInterval(this.analysisTimer);
            }
            
            this.analysisTimer = setInterval(() => {
                this.analyze();
            }, this.analysisInterval);
            
            console.log('[ScreenAnalyzer] 分析已開始');
        }

        stopAnalysis() {
            if (this.analysisTimer) {
                clearInterval(this.analysisTimer);
                this.analysisTimer = null;
            }
            
            console.log('[ScreenAnalyzer] 分析已停止');
        }

        async analyze() {
            const frame = this.manager.captureFrame();
            
            if (!frame) {
                return null;
            }
            
            const analysis = {
                timestamp: Date.now(),
                frame: frame,
                metadata: {
                    width: this.manager.canvasElement?.width || 0,
                    height: this.manager.canvasElement?.height || 0,
                    quality: this.manager.quality
                }
            };
            
            this.lastAnalysis = analysis;
            
            if (this.onAnalysisCallback) {
                this.onAnalysisCallback(analysis);
            }
            
            this.manager.emit('analysis', analysis);
            
            return analysis;
        }

        getLastAnalysis() {
            return this.lastAnalysis;
        }
    }

    window.ScreenShareManager = ScreenShareManager;
    window.ScreenAnalyzer = ScreenAnalyzer;
})();