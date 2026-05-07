(function() {
    'use strict';

    if (typeof SxAppAppearance === 'undefined') {
        console.warn('SxAppAppearance not loaded. App configs will not be registered.');
        return;
    }

    SxAppAppearance.registerAppConfig('chat', {
        name: '聊天',
        settings: {
            bubbleColor: {
                type: 'color',
                label: '訊息氣泡顏色',
                default: '#5B8DEF',
                cssVar: '--chat-bubble-color'
            },
            bubbleRadius: {
                type: 'range',
                label: '氣泡圓角',
                default: 16,
                min: 0,
                max: 24,
                step: 2,
                unit: 'px',
                cssVar: '--chat-bubble-radius'
            },
            messageFontSize: {
                type: 'range',
                label: '訊息字體大小',
                default: 14,
                min: 12,
                max: 18,
                step: 1,
                unit: 'px',
                cssVar: '--chat-message-font-size'
            },
            timestampColor: {
                type: 'color',
                label: '時間戳顏色',
                default: '#9ca3af',
                cssVar: '--chat-timestamp-color'
            }
        }
    });

    SxAppAppearance.registerAppConfig('music', {
        name: '音樂',
        settings: {
            playerBgColor: {
                type: 'color',
                label: '播放器背景色',
                default: '#1a1a2e',
                cssVar: '--music-player-bg'
            },
            progressColor: {
                type: 'color',
                label: '進度條顏色',
                default: '#5B8DEF',
                cssVar: '--music-progress-color'
            },
            albumRadius: {
                type: 'range',
                label: '專輯封面圓角',
                default: 8,
                min: 0,
                max: 24,
                step: 2,
                unit: 'px',
                cssVar: '--music-album-radius'
            },
            lyricsSize: {
                type: 'range',
                label: '歌詞字體大小',
                default: 16,
                min: 12,
                max: 24,
                step: 1,
                unit: 'px',
                cssVar: '--music-lyrics-size'
            }
        }
    });

    SxAppAppearance.registerAppConfig('weather', {
        name: '天氣',
        settings: {
            iconColor: {
                type: 'color',
                label: '天氣圖示顏色',
                default: '#FFD700',
                cssVar: '--weather-icon-color'
            },
            tempSize: {
                type: 'range',
                label: '溫度字體大小',
                default: 48,
                min: 32,
                max: 72,
                step: 4,
                unit: 'px',
                cssVar: '--weather-temp-size'
            },
            cardOpacity: {
                type: 'range',
                label: '卡片透明度',
                default: 90,
                min: 50,
                max: 100,
                step: 5,
                unit: '%',
                cssVar: '--weather-card-opacity'
            }
        }
    });

    SxAppAppearance.registerAppConfig('arcade', {
        name: '遊戲中心',
        settings: {
            gameCardRadius: {
                type: 'range',
                label: '遊戲卡片圓角',
                default: 12,
                min: 0,
                max: 24,
                step: 2,
                unit: 'px',
                cssVar: '--arcade-card-radius'
            },
            scoreColor: {
                type: 'color',
                label: '積分顯示顏色',
                default: '#FFD700',
                cssVar: '--arcade-score-color'
            },
            mapGridGap: {
                type: 'range',
                label: '地圖網格間距',
                default: 4,
                min: 0,
                max: 12,
                step: 2,
                unit: 'px',
                cssVar: '--arcade-map-gap'
            }
        }
    });

    SxAppAppearance.registerAppConfig('album', {
        name: '相簿',
        settings: {
            gridGap: {
                type: 'range',
                label: '照片網格間距',
                default: 4,
                min: 0,
                max: 16,
                step: 2,
                unit: 'px',
                cssVar: '--album-grid-gap'
            },
            thumbRadius: {
                type: 'range',
                label: '縮圖圓角',
                default: 4,
                min: 0,
                max: 16,
                step: 2,
                unit: 'px',
                cssVar: '--album-thumb-radius'
            },
            selectColor: {
                type: 'color',
                label: '選取框顏色',
                default: '#007aff',
                cssVar: '--album-select-color'
            }
        }
    });

    SxAppAppearance.registerAppConfig('settings', {
        name: '設定',
        settings: {
            itemGap: {
                type: 'range',
                label: '設定項目間距',
                default: 12,
                min: 4,
                max: 24,
                step: 2,
                unit: 'px',
                cssVar: '--settings-item-gap'
            },
            toggleColor: {
                type: 'color',
                label: '切換開關顏色',
                default: '#34C759',
                cssVar: '--settings-toggle-color'
            },
            descSize: {
                type: 'range',
                label: '說明文字大小',
                default: 12,
                min: 10,
                max: 16,
                step: 1,
                unit: 'px',
                cssVar: '--settings-desc-size'
            }
        }
    });

    SxAppAppearance.registerAppConfig('pomodoro', {
        name: '番茄鐘',
        settings: {
            timerSize: {
                type: 'range',
                label: '計時器字體大小',
                default: 64,
                min: 40,
                max: 96,
                step: 4,
                unit: 'px',
                cssVar: '--pomodoro-timer-size'
            },
            progressColor: {
                type: 'color',
                label: '進度環顏色',
                default: '#FF6B6B',
                cssVar: '--pomodoro-progress-color'
            },
            breakColor: {
                type: 'color',
                label: '休息模式顏色',
                default: '#4ECDC4',
                cssVar: '--pomodoro-break-color'
            }
        }
    });

    SxAppAppearance.registerAppConfig('theater', {
        name: '劇場',
        settings: {
            cardRadius: {
                type: 'range',
                label: '劇場卡片圓角',
                default: 12,
                min: 0,
                max: 24,
                step: 2,
                unit: 'px',
                cssVar: '--theater-card-radius'
            },
            controlBg: {
                type: 'color',
                label: '控制列背景色',
                default: 'rgba(0,0,0,0.8)',
                cssVar: '--theater-control-bg'
            }
        }
    });

    SxAppAppearance.registerAppConfig('worldbook', {
        name: '世界辭典',
        settings: {
            entryCardRadius: {
                type: 'range',
                label: '條目卡片圓角',
                default: 8,
                min: 0,
                max: 20,
                step: 2,
                unit: 'px',
                cssVar: '--worldbook-card-radius'
            },
            tagColor: {
                type: 'color',
                label: '標籤顏色',
                default: '#5B8DEF',
                cssVar: '--worldbook-tag-color'
            },
            editorBg: {
                type: 'color',
                label: '編輯區背景色',
                default: '#1a1a2e',
                cssVar: '--worldbook-editor-bg'
            }
        }
    });

    SxAppAppearance.registerAppConfig('facebook', {
        name: 'Facebook',
        settings: {
            postCardRadius: {
                type: 'range',
                label: '貼文卡片圓角',
                default: 12,
                min: 0,
                max: 24,
                step: 2,
                unit: 'px',
                cssVar: '--facebook-card-radius'
            },
            likeColor: {
                type: 'color',
                label: '按讚顏色',
                default: '#1877F2',
                cssVar: '--facebook-like-color'
            },
            commentBg: {
                type: 'color',
                label: '留言區背景色',
                default: '#f0f2f5',
                cssVar: '--facebook-comment-bg'
            }
        }
    });

    SxAppAppearance.registerAppConfig('instagram', {
        name: 'Instagram',
        settings: {
            gridGap: {
                type: 'range',
                label: '圖片網格間距',
                default: 2,
                min: 0,
                max: 8,
                step: 1,
                unit: 'px',
                cssVar: '--instagram-grid-gap'
            },
            storyRingColor: {
                type: 'color',
                label: '限時動態環顏色',
                default: '#C13584',
                cssVar: '--instagram-story-ring'
            },
            postGap: {
                type: 'range',
                label: '貼文間距',
                default: 16,
                min: 8,
                max: 32,
                step: 4,
                unit: 'px',
                cssVar: '--instagram-post-gap'
            }
        }
    });

    SxAppAppearance.registerAppConfig('twitter', {
        name: 'Twitter',
        settings: {
            tweetCardRadius: {
                type: 'range',
                label: '推文卡片圓角',
                default: 16,
                min: 0,
                max: 24,
                step: 2,
                unit: 'px',
                cssVar: '--twitter-card-radius'
            },
            linkColor: {
                type: 'color',
                label: '連結顏色',
                default: '#1DA1F2',
                cssVar: '--twitter-link-color'
            },
            avatarSize: {
                type: 'range',
                label: '頭像大小',
                default: 48,
                min: 32,
                max: 64,
                step: 4,
                unit: 'px',
                cssVar: '--twitter-avatar-size'
            }
        }
    });

    SxAppAppearance.registerAppConfig('bilibili', {
        name: 'Bilibili',
        settings: {
            videoCardRadius: {
                type: 'range',
                label: '影片卡片圓角',
                default: 8,
                min: 0,
                max: 20,
                step: 2,
                unit: 'px',
                cssVar: '--bilibili-card-radius'
            },
            danmakuSize: {
                type: 'range',
                label: '彈幕字體大小',
                default: 24,
                min: 16,
                max: 36,
                step: 2,
                unit: 'px',
                cssVar: '--bilibili-danmaku-size'
            },
            progressColor: {
                type: 'color',
                label: '進度條顏色',
                default: '#FB7299',
                cssVar: '--bilibili-progress-color'
            }
        }
    });

    SxAppAppearance.registerAppConfig('youtube', {
        name: 'YouTube',
        settings: {
            thumbRadius: {
                type: 'range',
                label: '影片縮圖圓角',
                default: 12,
                min: 0,
                max: 24,
                step: 2,
                unit: 'px',
                cssVar: '--youtube-thumb-radius'
            },
            controlBg: {
                type: 'color',
                label: '播放控制列顏色',
                default: '#212121',
                cssVar: '--youtube-control-bg'
            },
            subscribeColor: {
                type: 'color',
                label: '訂閱按鈕顏色',
                default: '#FF0000',
                cssVar: '--youtube-subscribe-color'
            }
        }
    });

    SxAppAppearance.registerAppConfig('weverse', {
        name: 'Weverse',
        settings: {
            postCardRadius: {
                type: 'range',
                label: '貼文卡片圓角',
                default: 12,
                min: 0,
                max: 24,
                step: 2,
                unit: 'px',
                cssVar: '--weverse-card-radius'
            },
            badgeColor: {
                type: 'color',
                label: '粉絲徽章顏色',
                default: '#00C3FF',
                cssVar: '--weverse-badge-color'
            }
        }
    });

    SxAppAppearance.registerAppConfig('lofter', {
        name: 'Lofter',
        settings: {
            articleCardRadius: {
                type: 'range',
                label: '文章卡片圓角',
                default: 8,
                min: 0,
                max: 20,
                step: 2,
                unit: 'px',
                cssVar: '--lofter-card-radius'
            },
            tagColor: {
                type: 'color',
                label: '標籤顏色',
                default: '#00B386',
                cssVar: '--lofter-tag-color'
            },
            gridGap: {
                type: 'range',
                label: '圖片網格間距',
                default: 4,
                min: 0,
                max: 16,
                step: 2,
                unit: 'px',
                cssVar: '--lofter-grid-gap'
            }
        }
    });

    SxAppAppearance.registerAppConfig('dating', {
        name: '約會',
        settings: {
            cardRadius: {
                type: 'range',
                label: '卡片圓角',
                default: 16,
                min: 0,
                max: 28,
                step: 2,
                unit: 'px',
                cssVar: '--dating-card-radius'
            },
            matchColor: {
                type: 'color',
                label: '配對動畫顏色',
                default: '#FF6B6B',
                cssVar: '--dating-match-color'
            },
            bubbleColor: {
                type: 'color',
                label: '訊息氣泡顏色',
                default: '#5B8DEF',
                cssVar: '--dating-bubble-color'
            }
        }
    });

    SxAppAppearance.registerAppConfig('kakaopay', {
        name: 'KakaoPay',
        settings: {
            amountSize: {
                type: 'range',
                label: '金額字體大小',
                default: 28,
                min: 20,
                max: 40,
                step: 2,
                unit: 'px',
                cssVar: '--kakaopay-amount-size'
            },
            chartColor: {
                type: 'color',
                label: '圖表顏色',
                default: '#F7E600',
                cssVar: '--kakaopay-chart-color'
            }
        }
    });

    SxAppAppearance.registerAppConfig('timetree', {
        name: '時間樹',
        settings: {
            timelineStyle: {
                type: 'select',
                label: '時間軸樣式',
                default: 'line',
                options: [
                    { value: 'line', label: '線條' },
                    { value: 'dots', label: '圓點' }
                ],
                cssVar: '--timetree-style'
            },
            eventColor: {
                type: 'color',
                label: '事件顏色',
                default: '#5B8DEF',
                cssVar: '--timetree-event-color'
            },
            dateSize: {
                type: 'range',
                label: '日期標題大小',
                default: 18,
                min: 14,
                max: 24,
                step: 1,
                unit: 'px',
                cssVar: '--timetree-date-size'
            }
        }
    });

    SxAppAppearance.registerAppConfig('pub', {
        name: '酒館',
        settings: {
            cardRadius: {
                type: 'range',
                label: '酒館卡片圓角',
                default: 12,
                min: 0,
                max: 24,
                step: 2,
                unit: 'px',
                cssVar: '--pub-card-radius'
            },
            starColor: {
                type: 'color',
                label: '評分星星顏色',
                default: '#FFD700',
                cssVar: '--pub-star-color'
            }
        }
    });

    SxAppAppearance.registerAppConfig('exchange-diary', {
        name: '交換日記',
        settings: {
            cardRadius: {
                type: 'range',
                label: '日記卡片圓角',
                default: 12,
                min: 0,
                max: 24,
                step: 2,
                unit: 'px',
                cssVar: '--diary-card-radius'
            },
            dateColor: {
                type: 'color',
                label: '日期標題顏色',
                default: '#5B8DEF',
                cssVar: '--diary-date-color'
            },
            contentSize: {
                type: 'range',
                label: '內文字體大小',
                default: 14,
                min: 12,
                max: 18,
                step: 1,
                unit: 'px',
                cssVar: '--diary-content-size'
            }
        }
    });

    SxAppAppearance.registerAppConfig('drift-bottle', {
        name: '漂流瓶',
        settings: {
            bottleColor: {
                type: 'color',
                label: '瓶子動畫顏色',
                default: '#4ECDC4',
                cssVar: '--bottle-color'
            },
            messageCardRadius: {
                type: 'range',
                label: '訊息卡片圓角',
                default: 16,
                min: 0,
                max: 28,
                step: 2,
                unit: 'px',
                cssVar: '--bottle-card-radius'
            },
            waveColor: {
                type: 'color',
                label: '海浪效果顏色',
                default: '#0077B6',
                cssVar: '--bottle-wave-color'
            }
        }
    });

    SxAppAppearance.registerAppConfig('guzi-guide', {
        name: '穀子指南',
        settings: {
            cardRadius: {
                type: 'range',
                label: '商品卡片圓角',
                default: 8,
                min: 0,
                max: 20,
                step: 2,
                unit: 'px',
                cssVar: '--guzi-card-radius'
            },
            priceColor: {
                type: 'color',
                label: '價格標籤顏色',
                default: '#FF6B6B',
                cssVar: '--guzi-price-color'
            },
            favColor: {
                type: 'color',
                label: '收藏圖示顏色',
                default: '#FF4757',
                cssVar: '--guzi-fav-color'
            }
        }
    });

    SxAppAppearance.registerAppConfig('smart-painter', {
        name: '智能繪圖',
        settings: {
            toolbarBg: {
                type: 'color',
                label: '工具列背景色',
                default: '#2d2d2d',
                cssVar: '--painter-toolbar-bg'
            },
            brushSizeDisplay: {
                type: 'range',
                label: '筆刷大小顯示',
                default: 24,
                min: 16,
                max: 32,
                step: 2,
                unit: 'px',
                cssVar: '--painter-brush-size'
            },
            paletteRadius: {
                type: 'range',
                label: '調色盤圓角',
                default: 12,
                min: 0,
                max: 24,
                step: 2,
                unit: 'px',
                cssVar: '--painter-palette-radius'
            }
        }
    });

    SxAppAppearance.registerAppConfig('personal-wiki', {
        name: '個人維基',
        settings: {
            pageBg: {
                type: 'color',
                label: '維基頁面背景色',
                default: '#1a1a2e',
                cssVar: '--wiki-page-bg'
            },
            tocColor: {
                type: 'color',
                label: '目錄顏色',
                default: '#5B8DEF',
                cssVar: '--wiki-toc-color'
            },
            codeBg: {
                type: 'color',
                label: '程式碼區塊背景色',
                default: '#0d0d0d',
                cssVar: '--wiki-code-bg'
            }
        }
    });

    SxAppAppearance.registerAppConfig('chrome', {
        name: '瀏覽器',
        settings: {
            progressColor: {
                type: 'color',
                label: '載入進度條顏色',
                default: '#5B8DEF',
                cssVar: '--chrome-progress-color'
            },
            tabRadius: {
                type: 'range',
                label: '分頁標籤圓角',
                default: 8,
                min: 0,
                max: 16,
                step: 2,
                unit: 'px',
                cssVar: '--chrome-tab-radius'
            }
        }
    });

    SxAppAppearance.registerAppConfig('phone', {
        name: '電話',
        settings: {
            dialpadRadius: {
                type: 'range',
                label: '撥號盤圓角',
                default: 50,
                min: 0,
                max: 50,
                step: 5,
                unit: '%',
                cssVar: '--phone-dialpad-radius'
            },
            contactCardRadius: {
                type: 'range',
                label: '聯絡人卡片圓角',
                default: 12,
                min: 0,
                max: 24,
                step: 2,
                unit: 'px',
                cssVar: '--phone-contact-radius'
            }
        }
    });

    SxAppAppearance.registerAppConfig('passkey', {
        name: '密碼管理',
        settings: {
            cardRadius: {
                type: 'range',
                label: '密碼卡片圓角',
                default: 12,
                min: 0,
                max: 24,
                step: 2,
                unit: 'px',
                cssVar: '--passkey-card-radius'
            },
            copyColor: {
                type: 'color',
                label: '複製按鈕顏色',
                default: '#34C759',
                cssVar: '--passkey-copy-color'
            },
            securityHigh: {
                type: 'color',
                label: '安全等級高顏色',
                default: '#34C759',
                cssVar: '--passkey-security-high'
            }
        }
    });

    SxAppAppearance.registerAppConfig('ao3', {
        name: 'AO3',
        settings: {
            articleBg: {
                type: 'color',
                label: '文章背景色',
                default: '#1a1a2e',
                cssVar: '--ao3-article-bg'
            },
            tagColor: {
                type: 'color',
                label: '標籤顏色',
                default: '#5B8DEF',
                cssVar: '--ao3-tag-color'
            },
            chapterNavBg: {
                type: 'color',
                label: '章節導航背景色',
                default: '#2d2d2d',
                cssVar: '--ao3-nav-bg'
            }
        }
    });

    SxAppAppearance.registerAppConfig('twitch', {
        name: 'Twitch',
        settings: {
            streamCardRadius: {
                type: 'range',
                label: '直播卡片圓角',
                default: 8,
                min: 0,
                max: 20,
                step: 2,
                unit: 'px',
                cssVar: '--twitch-card-radius'
            },
            chatBg: {
                type: 'color',
                label: '聊天室背景色',
                default: '#18181b',
                cssVar: '--twitch-chat-bg'
            },
            viewerColor: {
                type: 'color',
                label: '觀眾數顯示顏色',
                default: '#BF94FF',
                cssVar: '--twitch-viewer-color'
            }
        }
    });

    SxAppAppearance.registerAppConfig('home', {
        name: '宅家',
        settings: {
            iconSize: {
                type: 'range',
                label: '應用圖示大小',
                default: 60,
                min: 48,
                max: 80,
                step: 4,
                unit: 'px',
                cssVar: '--home-icon-size'
            },
            folderColor: {
                type: 'color',
                label: '資料夾顏色',
                default: 'rgba(255,255,255,0.15)',
                cssVar: '--home-folder-color'
            },
            searchRadius: {
                type: 'range',
                label: '搜尋列圓角',
                default: 12,
                min: 0,
                max: 24,
                step: 2,
                unit: 'px',
                cssVar: '--home-search-radius'
            }
        }
    });

})();
