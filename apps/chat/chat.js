const UserEnv = {
    isIOS() {
        return /iP(ad|hone|od)/.test(navigator.userAgent);
    },
    isAndroid() {
        return /Android/.test(navigator.userAgent);
    },
    isDesktop() {
        return !this.isIOS() && !this.isAndroid();
    }
};

function getActiveConfig() {
    const charName = localStorage.getItem('sx_char_name');
    const charAvatar = localStorage.getItem('sx_char_avatar');
    const charPersonality = localStorage.getItem('sx_char_personality');
    const charBackground = localStorage.getItem('sx_char_background');
    
    if (charName && charName !== '預設用戶') {
        console.log('[getActiveConfig] 從 localStorage 讀取角色:', charName, 'personality:', charPersonality?.slice(0, 30));
        return {
            name: charName,
            avatar: charAvatar || "",
            personality: charPersonality || "一個友善的助手",
            background: charBackground || "無",
            worldBook: ""
        };
    }
    
    const charactersRaw = localStorage.getItem('sx_characters');
    let activeChar = null;
    
    if (charactersRaw) {
        try {
            const characters = JSON.parse(charactersRaw);
            if (Array.isArray(characters) && characters.length > 0) {
                const firstChar = characters[0];
                if (firstChar && firstChar.name && firstChar.name !== '預設用戶') {
                    activeChar = firstChar;
                    console.log('[getActiveConfig] 從 sx_characters 讀取角色:', activeChar.name, 'personality:', activeChar.personality?.slice(0, 30));
                }
            }
        } catch (e) {
            console.warn('解析 sx_characters 失敗:', e);
        }
    }
    
    if (!activeChar) {
        const masksRaw = localStorage.getItem('sx_masks');
        if (masksRaw) {
            try {
                const masks = JSON.parse(masksRaw);
                if (Array.isArray(masks) && masks.length > 0 && masks[0]?.name) {
                    activeChar = masks[0];
                    console.log('[getActiveConfig] 從 sx_masks 讀取角色:', activeChar.name);
                }
            } catch (e) {
                console.warn('解析 sx_masks 失敗:', e);
            }
        }
    }
    
    if (!activeChar) {
        console.log('[getActiveConfig] 未找到角色設定，使用預設值');
    }
    
    return {
        name: activeChar?.name || "AI 助理",
        avatar: activeChar?.avatar || "",
        personality: activeChar?.personality || "一個友善的助手",
        background: activeChar?.background || "無",
        worldBook: activeChar?.worldBook || activeChar?.worldbook || ""
    };
}

// --- 2. 讀取世界書資料 (新架構) ---
function getWorldbookData() {
    const worldbookData = {};
    
    // 讀取新的分類文件
    const newCategories = [
        { key: 'sx_worldbook_theater', cat: 'theater' },
        { key: 'sx_worldbook_conditional', cat: 'conditional' },
        { key: 'sx_worldbook_core', cat: 'core' }
    ];
    
    // 同時保留舊的兼容性
    const legacyCategories = ['cot', 'style', 'global', 'keywords', 'backend'];
    
    // 讀取新架構
    newCategories.forEach(({ key, cat }) => {
        const data = localStorage.getItem(key);
        if (data) {
            try {
                worldbookData[cat] = JSON.parse(data);
                console.log(`[Worldbook] 載入新架構: ${cat}`);
            } catch (e) {
                console.warn(`解析世界書 ${cat} 失敗:`, e);
                worldbookData[cat] = {};
            }
        } else {
            worldbookData[cat] = {};
        }
    });
    
    // 讀取舊架構（向後兼容）
    legacyCategories.forEach(cat => {
        const key = `sx_worldbook_${cat}`;
        const data = localStorage.getItem(key);
        if (data) {
            try {
                worldbookData[key] = JSON.parse(data);
            } catch (e) {
                console.warn(`解析世界書 ${cat} 失敗:`, e);
                worldbookData[key] = [];
            }
        } else {
            worldbookData[key] = [];
        }
    });
    
    // 讀取禁止詞
    const forbiddenData = localStorage.getItem('sx_detected_forbidden');
    if (forbiddenData) {
        try {
            worldbookData.sx_detected_forbidden = JSON.parse(forbiddenData);
        } catch (e) {
            console.warn('解析禁止詞失敗:', e);
            worldbookData.sx_detected_forbidden = [];
        }
    } else {
        worldbookData.sx_detected_forbidden = [];
    }
    
    return worldbookData;
}

function getWorldbookIndex() {
    const raw = localStorage.getItem('sx_worldbook_index');
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed;
        } catch (e) {
            console.warn('解析世界書索引失敗:', e);
        }
    }
    return [];
}

function loadChatSessions() {
    const raw = localStorage.getItem('sx_chat_sessions');
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.warn('解析聊天室列表失敗', e);
        }
    }
    return [];
}

function saveChatSessions(sessions) {
    localStorage.setItem('sx_chat_sessions', JSON.stringify(sessions));
}

const saveChatData = () => {
    try {
        const sessions = loadChatSessions();
        localStorage.setItem('sx_chat_sessions', JSON.stringify(sessions));
        const activeId = getActiveChatId();
        if (activeId) localStorage.setItem('sx_chat_active', activeId);
        
        // 保存用戶設定到 localStorage
        const userNameInput = document.getElementById('set-user-name');
        const userBgInput = document.getElementById('set-user-background');
        if (userNameInput && userNameInput.value.trim()) {
            localStorage.setItem('sx_user_name', userNameInput.value.trim());
        }
        if (userBgInput) {
            localStorage.setItem('sx_user_background', userBgInput.value);
        }
        
        console.log("聊天數據已保存至 localStorage");
    } catch (e) {
        console.error("保存聊天數據失敗:", e);
    }
};

const saveToPersistentStorage = async () => {
    saveChatData();
    if (typeof localforage !== 'undefined') {
        try {
            const sessions = loadChatSessions();
            const userName = localStorage.getItem('sx_user_name') || 'User';
            const userAvatar = localStorage.getItem('sx_user_avatar') || '';
            const userPersonality = localStorage.getItem('sx_user_personality') || '';
            const userBackground = localStorage.getItem('sx_user_background') || '';
            
            const existingData = await localforage.getItem('sx_app_persisted_data') || {};
            await localforage.setItem('sx_app_persisted_data', {
                ...existingData,
                sx_chat_sessions: sessions,
                sx_chat_active: getActiveChatId(),
                userName,
                userAvatar,
                userPersonality,
                userBackground
            });
            console.log("聊天數據已保存至 IndexedDB");
        } catch (e) {
            console.error("IndexedDB 保存失敗:", e);
        }
    }
};

window.addEventListener('pagehide', () => {
    saveChatData();
});

window.addEventListener('pageshow', async (event) => {
    if (typeof localforage !== 'undefined') {
        try {
            const persistedData = await localforage.getItem('sx_app_persisted_data');
            if (persistedData) {
                // 還原用戶資料
                if (persistedData.userName) localStorage.setItem('sx_user_name', persistedData.userName);
                if (persistedData.userAvatar) localStorage.setItem('sx_user_avatar', persistedData.userAvatar);
                if (persistedData.userPersonality) localStorage.setItem('sx_user_personality', persistedData.userPersonality);
                if (persistedData.userBackground) localStorage.setItem('sx_user_background', persistedData.userBackground);
                
                // 還原聊天 sessions (iOS localStorage 備援)
                if (persistedData.sx_chat_sessions) {
                    const existingSessions = localStorage.getItem('sx_chat_sessions');
                    // 只有當 localStorage 沒有資料時才從 localforage 還原
                    if (!existingSessions) {
                        localStorage.setItem('sx_chat_sessions', JSON.stringify(persistedData.sx_chat_sessions));
                        console.log('[Chat] 從 localforage 恢復聊天 sessions:', persistedData.sx_chat_sessions.length, '個');
                    }
                }
                if (persistedData.sx_chat_active) {
                    const existingActive = localStorage.getItem('sx_chat_active');
                    if (!existingActive) {
                        localStorage.setItem('sx_chat_active', persistedData.sx_chat_active);
                    }
                }
            }
        } catch (e) {
            console.warn('[Chat] 從 localforage 恢復用戶資料失敗:', e);
        }
    }
    
    charConfig = getActiveConfig();
    userConfig = getUserConfig();
    
    let displayName = localStorage.getItem('sx_char_name');
    if (!displayName || displayName === '預設用戶') {
        displayName = charConfig.name || "AI 助理";
    }
    
    const nameEl = document.getElementById('display-name');
    const chatTitleEl = document.getElementById('chat-detail-title');
    const hintEl = document.getElementById('hint-name');
    const charPersInput = document.getElementById('set-personality');
    const charBackInput = document.getElementById('set-background');
    const charNameInput = document.getElementById('set-name');
    
    if (nameEl) nameEl.innerText = displayName;
    if (chatTitleEl) chatTitleEl.innerText = displayName;
    if (hintEl) hintEl.innerText = displayName;
    if (charPersInput) charPersInput.value = localStorage.getItem('sx_char_personality') || charConfig.personality || "";
    if (charBackInput) charBackInput.value = localStorage.getItem('sx_char_background') || charConfig.background || "";
    if (charNameInput) charNameInput.value = displayName;
    
    initUserUI();
    
    const userLabels = document.querySelectorAll('.mine .user-name');
    userLabels.forEach(label => label.innerText = userConfig.name || 'User');
    
    const savedMode = localStorage.getItem('sx_generation_mode') || 'dialogue';
    const modeRadios = document.querySelectorAll('input[name="generation-mode"]');
    modeRadios.forEach(radio => {
        radio.checked = (radio.value === savedMode);
    });
    
    if (typeof renderHistory === 'function') {
        renderHistory();
    }
    
    console.log('[Chat] pageshow - 重新載入角色設定:', displayName);
    console.log('[Chat] pageshow - 重新載入用戶設定:', userConfig.name, userConfig.avatar ? '有頭貼' : '無頭貼');
    console.log('[Chat] pageshow - 生成模式:', savedMode);
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        saveChatData();
    }
});

window.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || typeof data !== 'object') return;
    
    if (data.type === 'APP_WILL_CLOSE') {
        saveChatData();
    }
    
    if (data.type === 'OPEN_SUB_PANEL' && data.panelId) {
        const morePanels = {
            'emoji-shop': {
                panel: document.getElementById('emoji-shop-panel'),
                back: document.getElementById('emoji-shop-back')
            },
            'theme-shop': {
                panel: document.getElementById('theme-shop-panel'),
                back: document.getElementById('theme-shop-back')
            },
            'gift-shop': {
                panel: document.getElementById('gift-shop-panel'),
                back: document.getElementById('gift-shop-back')
            },
            'payment-code': {
                panel: document.getElementById('payment-code-panel'),
                back: document.getElementById('payment-code-back')
            }
        };
        
        if (morePanels[data.panelId]) {
            Object.values(morePanels).forEach(({ panel }) => panel?.classList.remove('active'));
            morePanels[data.panelId].panel?.classList.add('active');
            document.querySelector('.kakao-bottom-tabs')?.classList.add('hidden');
        }
    }
    
    // 處理外送訂單
    if (data.type === 'DELIVERY_ORDER' && data.order) {
        console.log('[Chat] 收到外送訂單:', data.order);
        const order = data.order;
        const orderText = data.message || `[外送訂單]\n時間：${order.timeStr}\n餐廳：${order.stores}\n品項：${order.items.map(i => `${i.name} x${i.qty}`).join('、')}\n金額：NT$${order.total}\n地址：${order.address}${order.note ? '\n備註：' + order.note : ''}`;
        
        addMessage(orderText, 'user', false, true);
        
        const foodMemory = {
            type: 'food_preference',
            stores: order.stores,
            items: order.items.map(i => i.name),
            total: order.total,
            timestamp: order.timestamp
        };
        
        let foodHistory = [];
        try {
            const saved = localStorage.getItem('sx_food_history');
            if (saved) foodHistory = JSON.parse(saved);
        } catch (e) {}
        foodHistory.unshift(foodMemory);
        if (foodHistory.length > 30) foodHistory = foodHistory.slice(0, 30);
        localStorage.setItem('sx_food_history', JSON.stringify(foodHistory));
    }
    
    // 監聽 settings 更新
    if (data.type === 'settingsUpdated') {
        console.log('[Chat] 收到 settings 更新，重新載入用戶資料');
        userConfig = getUserConfig();
        initUserUI();
        
        // 更新對話中的用戶名稱標籤
        const userLabels = document.querySelectorAll('.mine .user-name');
        userLabels.forEach(label => label.innerText = userConfig.name || 'User');
    }
    
    if (data.type === 'CHARACTER_UPDATED' && data.payload) {
        console.log('[Chat] 收到角色更新:', data.payload);
        
        const payload = data.payload;
        charConfig = {
            name: payload.name || localStorage.getItem('sx_char_name') || "AI 助理",
            avatar: payload.avatar || localStorage.getItem('sx_char_avatar') || "",
            personality: payload.personality || localStorage.getItem('sx_char_personality') || "一個友善的助手",
            background: payload.background || localStorage.getItem('sx_char_background') || "無",
            worldBook: ""
        };
        
        const nameEl = document.getElementById('display-name');
        const chatTitleEl = document.getElementById('chat-detail-title');
        const hintEl = document.getElementById('hint-name');
        const charPersInput = document.getElementById('set-personality');
        const charBackInput = document.getElementById('set-background');
        const charNameInput = document.getElementById('set-name');
        
        if (nameEl) nameEl.innerText = charConfig.name;
        if (chatTitleEl) chatTitleEl.innerText = charConfig.name;
        if (hintEl) hintEl.innerText = charConfig.name;
        if (charPersInput) charPersInput.value = charConfig.personality || "";
        if (charBackInput) charBackInput.value = charConfig.background || "";
        if (charNameInput) charNameInput.value = charConfig.name || "";
        
        console.log('[Chat] UI 已更新為:', charConfig.name);
    }
    
    if (data.type === 'USER_SETTINGS_UPDATED' && data.payload) {
        console.log('[Chat] 收到用戶更新:', data.payload);
        
        const payload = data.payload;
        
        if (payload.name) localStorage.setItem('sx_user_name', payload.name);
        if (payload.avatar !== undefined) localStorage.setItem('sx_user_avatar', payload.avatar);
        if (payload.personality !== undefined) localStorage.setItem('sx_user_personality', payload.personality);
        if (payload.background !== undefined) localStorage.setItem('sx_user_background', payload.background);
        
        userConfig = getUserConfig();
        initUserUI();
        
        // 更新頭像預覽
        const userAvatarPreview = document.getElementById('preview-user-avatar');
        if (userAvatarPreview && userConfig.avatar) {
            userAvatarPreview.src = userConfig.avatar;
            userAvatarPreview.style.background = '';
        }
        
        // 更新背景故事輸入框
        const userBgInput = document.getElementById('set-user-background');
        if (userBgInput) {
            userBgInput.value = userConfig.background || '';
        }
        
        const userLabels = document.querySelectorAll('.mine .user-name');
        userLabels.forEach(label => label.innerText = userConfig.name || 'User');
        
        console.log('[Chat] 用戶 UI 已更新為:', userConfig.name, userConfig.avatar ? '有頭貼' : '無頭貼');
    }
    
    // 處理語言變更
    if (data.type === 'LANGUAGE_CHANGED' && data.lang) {
        console.log('[Chat] 收到語言變更訊息:', data.lang);
        localStorage.setItem('sxiphone_lang', data.lang);
        // 更新 html lang 屬性
        if (document.documentElement) {
            document.documentElement.lang = data.lang;
        }
        // 觸發 UI 更新（如果有的話）
        if (typeof applyLanguageToUI === 'function') {
            applyLanguageToUI();
        }
        // 觸發語言更新回調
        if (typeof window.SxLanguage !== 'undefined' && typeof window.SxLanguage.triggerUpdate === 'function') {
            window.SxLanguage.triggerUpdate(data.lang);
        }
    }
    
    // 處理街機廳邀請
    if (data.type === 'ARCADE_INVITE' && data.payload) {
        console.log('[Chat] 收到街機廳邀請:', data.payload);
        handleArcadeInvite(data.payload);
    }
    
    // 處理用戶發起的街機廳邀請（角色決定是否接受）
    if (data.type === 'ARCADE_INVITE_FROM_USER' && data.payload) {
        console.log('[Chat] 收到用戶發起的街機廳邀請:', data.payload);
        handleArcadeInviteFromUser(data.payload);
    }
    
    // 處理街機廳大頭貼對話
    if (data.type === 'ARCADE_AVATAR_CLICK' && data.payload) {
        console.log('[Chat] 收到街機廳大頭貼對話:', data.payload);
        handleArcadeAvatarDialogue(data.payload);
    }
    
    // 處理街機廳 AI 對話請求
    if (data.type === 'ARCADE_REQUEST_DIALOGUE' && data.requestId) {
        console.log('[Chat] 收到街機廳 AI 對話請求:', data.requestId);
        handleArcadeRequestDialogue(data);
    }
});

function migrateLegacyHistory() {
    const legacyRaw = localStorage.getItem('sx_chat_history');
    if (!legacyRaw) return;
    try {
        const legacyHistory = JSON.parse(legacyRaw);
        if (!Array.isArray(legacyHistory) || legacyHistory.length === 0) return;
        const sessions = loadChatSessions();
        if (sessions.length === 0) {
            const newId = `chat_${Date.now()}`;
            sessions.push({
                id: newId,
                title: 'AI 助理',
                history: legacyHistory
            });
            saveChatSessions(sessions);
            localStorage.setItem('sx_chat_active', newId);
        }
    } catch (e) {
        console.warn('遷移舊聊天紀錄失敗', e);
    }
}

function getActiveChatId() {
    return localStorage.getItem('sx_chat_active') || '';
}

function setActiveChatId(id) {
    if (!id) return;
    localStorage.setItem('sx_chat_active', id);
}

function getActiveSession() {
    const sessions = loadChatSessions();
    const activeId = getActiveChatId();
    return sessions.find(s => s.id === activeId) || sessions[0] || null;
}

function saveActiveSession(updatedSession) {
    if (!updatedSession) return;
    const sessions = loadChatSessions();
    const idx = sessions.findIndex(s => s.id === updatedSession.id);
    if (idx >= 0) {
        sessions[idx] = updatedSession;
    } else {
        sessions.unshift(updatedSession);
    }
    saveChatSessions(sessions);
}

// --- 3. 渲染世界書選項到側邊欄 ---
function renderWorldbookOptions() {
    const container = document.getElementById('worldbook-mount-list');
    const dropdownToggle = document.getElementById('wb-dropdown-toggle');
    if (!container) return;
    
    const worldbookData = getWorldbookData();
    const mounts = getWorldbookMounts();
    const categories = [
        { key: 'global', label: '全域設定', icon: 'globe', defaultChecked: true },
        { key: 'cot', label: '思維鏈', icon: 'brain', defaultChecked: false },
        { key: 'style', label: '文風設定', icon: 'brush', defaultChecked: false },
        { key: 'keywords', label: '關鍵字', icon: 'tags', defaultChecked: false },
        { key: 'backend', label: '後端設定', icon: 'cog', defaultChecked: false }
    ];
    
    const mountMap = new Map(mounts.map(m => [m.name, m]));
    const makeMountRow = (name, defaultPos = 'mid', checked = false) => {
        const position = mountMap.get(name)?.position || defaultPos;
        const enabled = mountMap.get(name)?.enabled ?? checked;
        return `
            <div class="wb-mount-item">
                <input type="checkbox" class="wb-enable" data-wb-name="${name}" ${enabled ? 'checked' : ''}>
                <span class="wb-name">${name}</span>
                <div class="wb-controls">
                    <span>位置:</span>
                    <select class="wb-pos-selector">
                        <option value="top" ${position === 'top' ? 'selected' : ''}>前 (Top)</option>
                        <option value="mid" ${position === 'mid' ? 'selected' : ''}>中 (Mid)</option>
                        <option value="bottom" ${position === 'bottom' ? 'selected' : ''}>後 (Bottom)</option>
                    </select>
                </div>
            </div>
        `;
    };

    // 清空容器
    container.innerHTML = '';

    // 添加通用常識庫（預設）
    container.insertAdjacentHTML('beforeend', makeMountRow('通用常識庫', 'mid', true));

    // 顯示分類 - 直接從 worldbookData 讀取條目，不依賴 worldbookIndex
    let hasAnyEntries = false;
    
    categories.forEach(cat => {
        const catKey = `sx_worldbook_${cat.key}`;
        const entries = worldbookData[catKey];
        
        // 直接檢查 entries 是否為有效陣列且有內容
        if (!entries || !Array.isArray(entries) || entries.length === 0) return;
        
        hasAnyEntries = true;
        
        // 添加分類標題
        container.insertAdjacentHTML('beforeend', `
            <div class="wb-mount-category">${cat.label}</div>
        `);

        // 直接從 entries 讀取條目
        // global 分類預設勾選，其他分類預設不勾選
        entries.forEach(entry => {
            if (entry && entry.title) {
                container.insertAdjacentHTML('beforeend', makeMountRow(entry.title, 'mid', cat.defaultChecked));
            }
        });
    });
    
    // 如果沒有任何條目，顯示提示訊息
    if (!hasAnyEntries) {
        container.insertAdjacentHTML('beforeend', `
            <div class="wb-mount-empty-hint" style="padding: 12px; color: #888; font-size: 12px; text-align: center;">
                尚無世界書條目<br>
                <small>請先到「世界書」應用程式新增內容</small>
            </div>
        `);
    }

    if (dropdownToggle) {
        const selectedCount = container.querySelectorAll('.wb-enable:checked').length;
        dropdownToggle.innerHTML = `已選擇 ${selectedCount} 個世界書 <i class="fas fa-chevron-down"></i>`;
    }

    // 綁定事件
    bindWorldbookEvents();
}

// --- 4. 綁定世界書事件 ---
function bindWorldbookEvents() {
    const saveBtn = document.getElementById('save-worldbook-mounts');
    if (saveBtn) {
        saveBtn.onclick = saveWorldbookMounts;
    }

    const dropdownToggle = document.getElementById('wb-dropdown-toggle');
    const dropdownMenu = document.getElementById('worldbook-mount-list');
    if (dropdownToggle && dropdownMenu) {
        dropdownToggle.onclick = () => {
            dropdownMenu.classList.toggle('active');
        };

        document.addEventListener('click', (event) => {
            if (dropdownMenu.classList.contains('active') && !dropdownMenu.contains(event.target) && !dropdownToggle.contains(event.target)) {
                dropdownMenu.classList.remove('active');
            }
        });
    }

    const loadBtn = document.getElementById('load-worldbook-mounts');
    if (loadBtn) {
        loadBtn.onclick = () => {
            if (window.parent && window.parent !== window) {
                window.parent.postMessage({ type: 'REQUEST_WORLD_BOOK_SYNC' }, '*');
            } else {
                renderWorldbookOptions();
            }
        };
    }

    if (dropdownMenu) {
        dropdownMenu.addEventListener('change', (event) => {
            if (!event.target.classList.contains('wb-enable')) return;
            const selectedCount = dropdownMenu.querySelectorAll('.wb-enable:checked').length;
            if (dropdownToggle) {
                dropdownToggle.innerHTML = `已選擇 ${selectedCount} 個世界書 <i class="fas fa-chevron-down"></i>`;
            }
        });
    }
}

// --- 5. 保存世界書掛載設定 ---
function saveWorldbookMounts() {
    const items = document.querySelectorAll('.wb-mount-item');
    const mounts = [];
    
    items.forEach(item => {
        const checkbox = item.querySelector('.wb-enable');
        const selector = item.querySelector('.wb-pos-selector');
        const nameSpan = item.querySelector('.wb-name');
        
        if (checkbox && selector && nameSpan) {
            mounts.push({
                name: nameSpan.textContent.trim(),
                enabled: checkbox.checked,
                position: selector.value
            });
        }
    });
    
    // 保存到 localStorage
    localStorage.setItem('sx_worldbook_mounts', JSON.stringify(mounts));
    alert('世界書掛載設定已保存');
}

// --- 6. 讀取已保存的世界書掛載設定 ---
function getWorldbookMounts() {
    const data = localStorage.getItem('sx_worldbook_mounts');
    if (data) {
        try {
            return JSON.parse(data);
        } catch (e) {
            console.warn('解析世界書掛載設定失敗:', e);
            return [];
        }
    }
    return [];
}

// --- 1. 數據更新與讀取核心 ---

/**
 * 核心修正：統一更新角色設定的函式
 * 解決「隨時偵測」並儲存到 localStorage 的問題
 */
function updateActiveMask(field, value) {
    let masks = JSON.parse(localStorage.getItem('sx_masks') || '[]');
    if (masks.length === 0) {
        masks.push({ name: "AI 助理", avatar: "", personality: "", background: "", worldBook: "" });
    }
    masks[0][field] = value;
    localStorage.setItem('sx_masks', JSON.stringify(masks));
    
    let characters = JSON.parse(localStorage.getItem('sx_characters') || '[]');
    if (characters.length === 0) {
        characters.push({ name: "AI 助理", avatar: "", personality: "", background: "", worldBook: "" });
    }
    characters[0][field] = value;
    localStorage.setItem('sx_characters', JSON.stringify(characters));
    
    if (field === 'name') {
        localStorage.setItem('sx_char_name', value);
    } else if (field === 'avatar') {
        localStorage.setItem('sx_char_avatar', value);
    }
    
    if (typeof charConfig !== 'undefined') {
        charConfig[field] = value;
    }
}

// --- 1. 基礎數據載入 ---
let charConfig = getActiveConfig();
let userConfig = getUserConfig();
let iosTempData = {}; // iOS 暫存

// --- 2. 狀態變數 ---
let longClickTimer;
let menuHideTimer;
let currentTargetMsg = null;
let isMenuOpen = false;
let isProcessingLongPress = false;

const KAKAOPAY_LEDGER_KEY = 'sxiphone.kakaopay.ledger.v1';
const CHAT_WALLET_KEY = 'sx_chat_wallets';
const DEFAULT_CHAT_WALLET = { user: 30000, char: 30000 };
const DIARY_STORAGE_KEY = 'sx_char_diaries';
const DIARY_SETTINGS_KEY = 'sx_diary_settings';

function getDiarySettings() {
    try {
        const parsed = JSON.parse(localStorage.getItem(DIARY_SETTINGS_KEY) || '{}');
        return {
            autoGenerate: parsed.autoGenerate !== false,
            defaultTime: parsed.defaultTime || '22:00'
        };
    } catch {
        return { autoGenerate: true, defaultTime: '22:00' };
    }
}

function saveDiarySettings(settings) {
    localStorage.setItem(DIARY_SETTINGS_KEY, JSON.stringify(settings));
}

function getDiaries() {
    try {
        const parsed = JSON.parse(localStorage.getItem(DIARY_STORAGE_KEY) || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveDiaries(diaries) {
    localStorage.setItem(DIARY_STORAGE_KEY, JSON.stringify(diaries));
}

function getTodayDateString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function loadCharMemoryForDiary(charName) {
    try {
        const raw = localStorage.getItem('sx_chat_history');
        if (!raw) return [];
        const history = JSON.parse(raw);
        if (!Array.isArray(history) || history.length === 0) return [];

        const charMessages = [];
        for (const session of history) {
            if (!session?.history || !Array.isArray(session.history)) continue;
            const charNameLower = (charName || '').toLowerCase();
            for (const msg of session.history) {
                const senderLower = (msg.sender || msg.role || '').toLowerCase();
                if (senderLower.includes(charNameLower) || charNameLower.includes(senderLower)) {
                    charMessages.push({
                        content: msg.content || msg.text || '',
                        timestamp: msg.timestamp || session.timestamp || 0,
                        role: msg.role || 'assistant'
                    });
                }
            }
        }
        return charMessages.slice(-30);
    } catch (e) {
        console.warn('[diary] 無法載入角色記憶:', e);
        return [];
    }
}

function generateDiaryContent(history, charName, userName) {
    const charData = getActiveConfig();
    const personality = (charData?.personality || '').trim();
    const background = (charData?.background || '').trim();
    const memory = loadCharMemoryForDiary(charName);
    
    if (!history || history.length === 0) {
        return generateDiaryFromPersonality(charName, userName, personality, background, memory, []);
    }
    
    const todayHistory = history.filter(msg => msg.content);
    
    if (todayHistory.length === 0) {
        return generateDiaryFromPersonality(charName, userName, personality, background, memory, []);
    }
    
    return generateDiaryFromPersonality(charName, userName, personality, background, memory, todayHistory);
}

function generateDiaryFromPersonality(charName, userName, personality, background, memory, chatHistory) {
    const sentences = [];
    
    const personalityParts = personality.split(/[，,、。；;\s]+/).filter(p => p.trim());
    const bgParts = background.split(/[，,、。；;\s]+/).filter(p => p.trim());
    
    let msgCount = 0;
    let userMsgCount = 0;
    const topics = [];
    const emotions = [];
    
    if (chatHistory && chatHistory.length > 0) {
        chatHistory.forEach(msg => {
            if (msg.role === 'user') {
                userMsgCount++;
                const content = msg.content.toLowerCase();
                if (/開心|快樂|哈哈|高興/.test(content)) emotions.push('開心');
                if (/難過|傷心|哭|難過/.test(content)) emotions.push('難過');
                if (/累|疲憊|好累/.test(content)) emotions.push('疲憊');
                if (/生氣|憤怒|火大/.test(content)) emotions.push('生氣');
                if (/想念|思念/.test(content)) emotions.push('想念');
                
                const words = msg.content.slice(0, 20);
                if (words.length > 5) {
                    topics.push(words);
                }
            }
            msgCount++;
        });
    }
    
    if (personalityParts.length > 0) {
        const randomTrait = personalityParts[Math.floor(Math.random() * personalityParts.length)];
        if (msgCount > 0) {
            sentences.push(`以我${randomTrait}的個性，今天和${userName}的對話讓我印象深刻。`);
        } else {
            sentences.push(`以我${randomTrait}的個性，今天過得很特別。`);
        }
    } else if (bgParts.length > 0) {
        const randomBg = bgParts[Math.floor(Math.random() * bgParts.length)];
        if (msgCount > 0) {
            sentences.push(`${randomBg}的我，今天和${userName}的互動讓我有很多感觸。`);
        } else {
            sentences.push(`${randomBg}的我，今天過得還不錯。`);
        }
    } else {
        if (msgCount > 0) {
            sentences.push(`今天和${userName}聊了很多，總共 ${msgCount} 則訊息。`);
        } else {
            sentences.push(`今天沒有特別的事情發生。`);
        }
    }
    
    if (emotions.length > 0) {
        const uniqueEmotions = [...new Set(emotions)].slice(0, 2);
        sentences.push(`感覺今天特別${uniqueEmotions.join('和')}。`);
    }
    
    if (topics.length > 0 && Math.random() > 0.5) {
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];
        sentences.push(`你說的「${randomTopic}...」讓我印象深刻。`);
    }
    
    if (memory && memory.length > 0 && Math.random() > 0.6) {
        const recentMsg = memory[memory.length - 1];
        if (recentMsg && recentMsg.content) {
            const recentKeywords = recentMsg.content.slice(0, 15);
            sentences.push(`之前我們聊過「${recentKeywords}...」，今天又讓我想起來了。`);
        }
    }
    
    if (bgParts.length > 0 && Math.random() > 0.6) {
        const randomBg = bgParts[Math.floor(Math.random() * bgParts.length)];
        sentences.push(`因為${randomBg}的關係，我特別珍惜和你的每一次對話。`);
    }
    
    if (sentences.length < 3) {
        sentences.push(`希望明天也能繼續這樣的對話。`);
    }
    
    sentences.push('');
    sentences.push(`—— ${charName}`);
    
    return sentences.join('\n');
}

function getChatWallets() {
    try {
        const parsed = JSON.parse(localStorage.getItem(CHAT_WALLET_KEY) || '');
        const user = Number(parsed?.user);
        const char = Number(parsed?.char);
        return {
            user: Number.isFinite(user) && user >= 0 ? Math.floor(user) : DEFAULT_CHAT_WALLET.user,
            char: Number.isFinite(char) && char >= 0 ? Math.floor(char) : DEFAULT_CHAT_WALLET.char
        };
    } catch {
        return { ...DEFAULT_CHAT_WALLET };
    }
}

function saveChatWallets(wallets) {
    localStorage.setItem(CHAT_WALLET_KEY, JSON.stringify({
        user: Math.max(0, Math.floor(Number(wallets?.user || 0))),
        char: Math.max(0, Math.floor(Number(wallets?.char || 0)))
    }));
}

function sanitizeText(text) {
    return String(text || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function formatNTD(amount) {
    const lang = localStorage.getItem('sxiphone_lang') || 'zh-Hant';
    const localeCode = window.getLocaleStringLang?.(lang) || 'zh-TW';
    return `NT$${Number(amount || 0).toLocaleString(localeCode)}`;
}

function getTodayYMD() {
    const d = new Date();
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function appendHistoryAndSession(role, content) {
    const history = JSON.parse(localStorage.getItem('sx_chat_history') || '[]');
    history.push({ role, content });
    localStorage.setItem('sx_chat_history', JSON.stringify(history));
    const activeId = getActiveChatId();
    if (activeId) {
        const sessions = loadChatSessions();
        const target = sessions.find(s => s.id === activeId);
        if (target) {
            target.history = history;
            saveChatSessions(sessions);
        }
    }
}

function appendKakaoPayTransferRecord({ flowType, direction, amount, note, userName, charName }) {
    let ledger;
    try {
        ledger = JSON.parse(localStorage.getItem(KAKAOPAY_LEDGER_KEY) || '{}');
    } catch {
        ledger = {};
    }
    const budget = Number(ledger?.budget) > 0 ? Number(ledger.budget) : 30000;
    const transactions = Array.isArray(ledger?.transactions) ? ledger.transactions : [];
    const txType = direction === 'user_to_char' ? 'expense' : 'income';
    const flowLabel = flowType === 'envelope' ? '紅包' : (flowType === 'request' ? '收款' : '轉帳');
    const pairLabel = direction === 'user_to_char'
        ? `${userName} -> ${charName}`
        : `${charName} -> ${userName}`;

    transactions.unshift({
        id: `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
        type: txType,
        category: '其他',
        amount: Number(amount),
        note: `${flowLabel}｜${pairLabel}${note ? `｜${note}` : ''}`,
        date: getTodayYMD(),
        createdAt: Date.now(),
        source: 'chat-transfer',
        flowType,
        direction
    });

    localStorage.setItem(KAKAOPAY_LEDGER_KEY, JSON.stringify({ budget, transactions }));
}

// --- 3. 核心功能：角色資料儲存與 UI 同步 ---

/**
 * 儲存 AI 角色設定並同步 UI
 */
function saveCharSettings(newName) {
    if (!newName) return;

    localStorage.setItem('sx_char_name', newName);
    
    let masks = JSON.parse(localStorage.getItem('sx_masks') || '[]');
    if (masks.length === 0) {
        masks.push({ name: newName, avatar: "", personality: "", background: "", worldBook: "" });
    } else {
        masks[0].name = newName;
    }
    localStorage.setItem('sx_masks', JSON.stringify(masks));

    let characters = JSON.parse(localStorage.getItem('sx_characters') || '[]');
    if (characters.length === 0) {
        characters.push({ name: newName, avatar: "", personality: "", background: "", worldBook: "" });
    } else {
        characters[0].name = newName;
    }
    localStorage.setItem('sx_characters', JSON.stringify(characters));

    charConfig.name = newName;

    const nameEl = document.getElementById('display-name');
    const chatTitleEl = document.getElementById('chat-detail-title');
    const hintEl = document.getElementById('hint-name');
    if (nameEl) nameEl.innerText = newName;
    if (chatTitleEl) chatTitleEl.innerText = newName;
    if (hintEl) hintEl.innerText = newName;

    const charLabels = document.querySelectorAll('.other .user-name');
    charLabels.forEach(label => label.innerText = newName);

    const activeId = getActiveChatId();
    if (activeId) {
        const sessions = loadChatSessions();
        const session = sessions.find(s => s.id === activeId);
        if (session) {
            session.charName = newName;
            session.charAvatar = localStorage.getItem('sx_char_avatar') || '';
            session.charPersonality = localStorage.getItem('sx_char_personality') || '';
            session.charBackground = localStorage.getItem('sx_char_background') || '';
            saveChatSessions(sessions);
        }
    }

    if (typeof window.renderChatListFromStorage === 'function') {
        window.renderChatListFromStorage();
    }

    console.log("AI 角色資料已更新並同步 UI:", newName);
}

/**
 * 儲存用戶資料並同步 UI
 */
function saveUserSettings(newUserName) {
    if (!newUserName) return;

    localStorage.setItem('sx_user_name', newUserName);
    userConfig.name = newUserName;
    
    updateUserToList();

    const userLabels = document.querySelectorAll('.mine .user-name');
    userLabels.forEach(label => label.innerText = newUserName);
    
    const userNameInput = document.getElementById('set-user-name');
    if (userNameInput && userNameInput.value !== newUserName) {
        userNameInput.value = newUserName;
    }

    window.parent?.postMessage({
        type: 'USER_SETTINGS_UPDATED',
        payload: { name: newUserName }
    }, '*');

    console.log("用戶資料已更新並同步 UI:", newUserName);
}

/**
 * 儲存用戶完整資料（名稱、背景等）
 */
function saveUserFullSettings(newUserName, newUserBg) {
    if (newUserName) {
        localStorage.setItem('sx_user_name', newUserName);
        userConfig.name = newUserName;
        
        const userLabels = document.querySelectorAll('.mine .user-name');
        userLabels.forEach(label => label.innerText = newUserName);
    }
    
    if (newUserBg !== undefined) {
        localStorage.setItem('sx_user_background', newUserBg);
        userConfig.background = newUserBg;
    }
    
    console.log("用戶完整資料已更新");
}

/**
 * 獲取當前用戶配置的工具函式
 */
function getUserConfig() {
    let name = localStorage.getItem('sx_user_name');
    let avatar = localStorage.getItem('sx_user_avatar');
    let personality = localStorage.getItem('sx_user_personality');
    let background = localStorage.getItem('sx_user_background');
    
    // 檢查是否有任何欄位缺失，如果缺失則嘗試從 sx_users 補充
    const hasMissingFields = !name || name === '預設用戶' || !avatar || !personality || !background;
    
    if (hasMissingFields) {
        const usersRaw = localStorage.getItem('sx_users');
        if (usersRaw) {
            try {
                const users = JSON.parse(usersRaw);
                if (Array.isArray(users) && users.length > 0) {
                    // 嘗試找到匹配的用戶
                    let matchedUser = null;
                    
                    // 如果有名字，嘗試找到匹配的用戶
                    if (name && name !== '預設用戶') {
                        matchedUser = users.find(u => u.name === name);
                    }
                    
                    // 如果沒找到匹配的，使用第一個用戶
                    if (!matchedUser) {
                        matchedUser = users[0];
                    }
                    
                    if (matchedUser) {
                        // 只補充缺失的欄位
                        if (!name || name === '預設用戶') {
                            name = matchedUser.name || 'User';
                        }
                        if (!avatar) {
                            avatar = matchedUser.avatar || '';
                        }
                        if (!personality) {
                            personality = matchedUser.personality || '';
                        }
                        if (!background) {
                            background = matchedUser.background || '';
                        }
                        console.log('[getUserConfig] 從 sx_users 補充用戶資料:', matchedUser.name);
                    }
                }
            } catch (e) {
                console.warn('[getUserConfig] 解析 sx_users 失敗:', e);
            }
        }
    }
    
    return {
        name: name || 'User',
        avatar: avatar || '',
        personality: personality || '',
        background: background || ''
    };
}

function loadCharPresets() {
    try {
        const raw = localStorage.getItem('sx_characters');
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function loadUserPresets() {
    try {
        const raw = localStorage.getItem('sx_users');
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}
function initUserUI() {
    const user = getUserConfig();
    
    const userNameInput = document.getElementById('set-user-name');
    const userAvatarPreview = document.getElementById('preview-user-avatar');
    const userBgInput = document.getElementById('set-user-background');
    
    if (userNameInput) {
        const newUserNameInput = userNameInput.cloneNode(true);
        userNameInput.parentNode.replaceChild(newUserNameInput, userNameInput);
        
        newUserNameInput.value = user.name || 'User';
        
        newUserNameInput.addEventListener('input', (e) => {
            saveUserSettings(e.target.value);
        });
    }

    if (userAvatarPreview) {
        if (user.avatar) {
            userAvatarPreview.src = user.avatar;
        } else {
            userAvatarPreview.src = '';
            userAvatarPreview.style.background = '#eee';
        }
    }
    
    if (userBgInput) {
        const newUserBgInput = userBgInput.cloneNode(true);
        userBgInput.parentNode.replaceChild(newUserBgInput, userBgInput);
        
        newUserBgInput.value = user.background || '';
        
        newUserBgInput.addEventListener('input', (e) => {
            localStorage.setItem('sx_user_background', e.target.value);
            userConfig.background = e.target.value;
            updateUserToList();
        });
    }
    
    const userLabels = document.querySelectorAll('.mine .user-name');
    userLabels.forEach(label => label.innerText = user.name || 'User');

    console.log("用戶 UI 初始化完成:", user.name, user.avatar ? '有頭貼' : '無頭貼');
}

function updateUserToList() {
    try {
        const usersRaw = localStorage.getItem('sx_users');
        const users = usersRaw ? JSON.parse(usersRaw) : [];
        const currentUserName = localStorage.getItem('sx_user_name') || 'User';
        const currentUserAvatar = localStorage.getItem('sx_user_avatar') || '';
        const currentUserBg = localStorage.getItem('sx_user_background') || '';
        const currentUserPers = localStorage.getItem('sx_user_personality') || '';
        
        const existingIdx = users.findIndex(u => u.name === currentUserName);
        const userData = {
            name: currentUserName,
            avatar: currentUserAvatar,
            personality: currentUserPers,
            background: currentUserBg
        };
        
        if (existingIdx >= 0) {
            users[existingIdx] = { ...users[existingIdx], ...userData };
        } else {
            users.unshift(userData);
        }
        localStorage.setItem('sx_users', JSON.stringify(users));
        
        saveToPersistentStorage();
    } catch (e) {
        console.warn('[Chat] 更新 users 列表失敗:', e);
    }
}

// --- 手機檢查事件設定 ---
const PHONE_CHECK_KEY = 'sx_phone_check_enabled';
const PASSKEY_CONTROL_KEY = 'sx_passkey_control_enabled';
const PHONE_CHECK_MIN_DELAY_KEY = 'sx_phone_check_min_delay';
const PHONE_CHECK_MAX_DELAY_KEY = 'sx_phone_check_max_delay';
const PHONE_CHECK_MIN_DURATION_KEY = 'sx_phone_check_min_duration';
const PHONE_CHECK_MAX_DURATION_KEY = 'sx_phone_check_max_duration';

function initPhoneCheckToggle() {
    const toggle = document.getElementById('phone-check-toggle');
    const status = document.getElementById('phone-check-status');
    const minDelayInput = document.getElementById('phone-check-min-delay');
    const maxDelayInput = document.getElementById('phone-check-max-delay');
    const minDurationInput = document.getElementById('phone-check-min-duration');
    const maxDurationInput = document.getElementById('phone-check-max-duration');
    
    if (!toggle) return;
    const enabled = localStorage.getItem(PHONE_CHECK_KEY) === '1';
    toggle.checked = enabled;
    if (status) status.textContent = enabled ? '已允許隨機觸發' : '關閉時不會觸發';
    
    if (minDelayInput) minDelayInput.value = localStorage.getItem(PHONE_CHECK_MIN_DELAY_KEY) || 5;
    if (maxDelayInput) maxDelayInput.value = localStorage.getItem(PHONE_CHECK_MAX_DELAY_KEY) || 60;
    if (minDurationInput) minDurationInput.value = localStorage.getItem(PHONE_CHECK_MIN_DURATION_KEY) || 2;
    if (maxDurationInput) maxDurationInput.value = localStorage.getItem(PHONE_CHECK_MAX_DURATION_KEY) || 5;
    
    const saveSettings = () => {
        const settings = {
            enabled: toggle.checked,
            minDelay: parseInt(minDelayInput?.value) || 5,
            maxDelay: parseInt(maxDelayInput?.value) || 60,
            minDuration: parseInt(minDurationInput?.value) || 2,
            maxDuration: parseInt(maxDurationInput?.value) || 5
        };
        
        localStorage.setItem(PHONE_CHECK_KEY, settings.enabled ? '1' : '0');
        localStorage.setItem(PHONE_CHECK_MIN_DELAY_KEY, settings.minDelay);
        localStorage.setItem(PHONE_CHECK_MAX_DELAY_KEY, settings.maxDelay);
        localStorage.setItem(PHONE_CHECK_MIN_DURATION_KEY, settings.minDuration);
        localStorage.setItem(PHONE_CHECK_MAX_DURATION_KEY, settings.maxDuration);
        
        if (status) status.textContent = settings.enabled ? '已允許隨機觸發' : '關閉時不會觸發';
        
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ 
                type: 'PHONE_CHECK_TOGGLE', 
                enabled: settings.enabled,
                settings: {
                    minDelay: settings.minDelay,
                    maxDelay: settings.maxDelay,
                    minDuration: settings.minDuration,
                    maxDuration: settings.maxDuration
                }
            }, '*');
        }
    };
    
    toggle.addEventListener('change', saveSettings);
    minDelayInput?.addEventListener('change', saveSettings);
    maxDelayInput?.addEventListener('change', saveSettings);
    minDurationInput?.addEventListener('change', saveSettings);
    maxDurationInput?.addEventListener('change', saveSettings);
    
    if (window.parent && window.parent !== window) {
        window.parent.postMessage({ 
            type: 'PHONE_CHECK_TOGGLE', 
            enabled,
            settings: {
                minDelay: parseInt(minDelayInput?.value) || 5,
                maxDelay: parseInt(maxDelayInput?.value) || 60,
                minDuration: parseInt(minDurationInput?.value) || 2,
                maxDuration: parseInt(maxDurationInput?.value) || 5
            }
        }, '*');
    }
}

function initPasskeyControlToggle() {
    const toggle = document.getElementById('passkey-control-toggle');
    const status = document.getElementById('passkey-control-status');
    if (!toggle) return;
    const enabled = localStorage.getItem(PASSKEY_CONTROL_KEY) === '1';
    toggle.checked = enabled;
    if (status) status.textContent = enabled ? '已啟用 NSFW 自動交接' : '關閉時不會自動交接';
    toggle.addEventListener('change', () => {
        const isOn = toggle.checked;
        localStorage.setItem(PASSKEY_CONTROL_KEY, isOn ? '1' : '0');
        if (status) status.textContent = isOn ? '已啟用 NSFW 自動交接' : '關閉時不會自動交接';
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'PASSKEY_CONTROL_TOGGLE', enabled: isOn }, '*');
        }
    });
    if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'PASSKEY_CONTROL_TOGGLE', enabled }, '*');
    }
}

function isPasskeyControlEnabled() {
    return localStorage.getItem(PASSKEY_CONTROL_KEY) === '1';
}

function checkNsfwTopic(text) {
    if (!text) return false;
    const lowered = text.toLowerCase();
    const keywords = [
        'nsfw', '成人', '18禁', '18+', '性', '性愛', '色情', '裸', '裸露', '內衣', '內褲',
        '胸', '乳', '乳房', '私處', '陰部', '陰道', '陰莖', '龜頭', '高潮', '射精',
        '自慰', '口交', '肛交', '性虐', '調教', 'SM', '捆綁', '性玩具', 'a片', 'av',
        '欲望', '做愛', '床上', '摸', '舔', '約炮', '開房', '啪', '親熱'
    ];
    return keywords.some(word => word && lowered.includes(word.toLowerCase()));
}

function triggerPasskeyControlHandoff(reason, payload = {}) {
    const detail = {
        reason,
        text: payload.text || '',
        chatId: getActiveChatId() || '',
        timestamp: Date.now(),
        character: localStorage.getItem('sx_passkey_character') || ''
    };
    localStorage.setItem('sx_passkey_control_handoff', JSON.stringify(detail));
    if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'PASSKEY_CONTROL_HANDOFF', payload: detail }, '*');
    }
}
/**
 * 補定義：檢查角色是否被拉黑
 * 邏輯：檢查 localStorage 中的封鎖時間，若未滿 1 小時則禁用輸入
 */
function checkBlockStatus() {
    const blockKey = `block_${charConfig.name}`;
    const blockTime = localStorage.getItem(blockKey);
    const sendBtn = document.getElementById('send-trigger');
    const genBtn = document.getElementById('generate-trigger');
    const msgInput = document.getElementById('msg-input');

    if (blockTime) {
        const now = new Date().getTime();
        const timeLeft = parseInt(blockTime) - now;

        if (timeLeft > 0) {
            // 還在封鎖時間內
            const minutes = Math.ceil(timeLeft / (1000 * 60));
            console.log(`角色已被拉黑，剩餘 ${minutes} 分鐘`);
            
            if (msgInput) {
                msgInput.disabled = true;
                msgInput.placeholder = `角色已被拉黑 (剩餘 ${minutes} 分鐘)`;
            }
            if (sendBtn) sendBtn.style.opacity = '0.5';
            if (genBtn) genBtn.style.opacity = '0.5';
            
            return true; // 已被封鎖
        } else {
            // 封鎖時間已過，清除記錄
            localStorage.removeItem(blockKey);
        }
    }

    // 恢復正常狀態
    if (msgInput) {
        msgInput.disabled = false;
        msgInput.placeholder = "輸入訊息...";
    }
    return false;
}
// --- 2. DOMContentLoaded 初始化 (整合去重版) ---
document.addEventListener('DOMContentLoaded', () => {
    charConfig = getActiveConfig();
    userConfig = getUserConfig();
    
    // A. 抓取必要的 DOM 元素
    const nameEl = document.getElementById('display-name');
    const chatTitleEl = document.getElementById('chat-detail-title');
    const charPersInput = document.getElementById('set-personality');
    const charBackInput = document.getElementById('set-background');
    const charNameInput = document.getElementById('set-name');
    const sendBtnTrigger = document.getElementById('send-trigger');
    const genBtnTrigger = document.getElementById('generate-trigger');
    const blockBtn = document.getElementById('block-char'); // 拉黑按鈕
    const deleteChatBtn = document.getElementById('delete-chat');
    const clearChatBtn = document.getElementById('clear-chat');
    const clearMemoryBtn = document.getElementById('clear-memory');
    const chatListView = document.getElementById('chat-list-view');
    const chatDetailView = document.getElementById('chat-detail-view');
    const chatListHeader = document.getElementById('chat-list-header');

    const backToListBtn = document.getElementById('back-to-list');
    const newChatBtn = document.getElementById('new-chat-btn');
    if (newChatBtn) {
        newChatBtn.style.display = 'none';
    }
    const charPresetSelect = document.getElementById('char-preset-select');
    const userPresetSelect = document.getElementById('user-preset-select');

    const renderPresetOptions = () => {
        if (charPresetSelect) {
            const chars = loadCharPresets();
            charPresetSelect.innerHTML = '<option value="">選擇角色</option>' + chars.map((char, index) => `
                <option value="${index}">${char.name || '未命名角色'}</option>
            `).join('');
        }
        if (userPresetSelect) {
            const users = loadUserPresets();
            userPresetSelect.innerHTML = '<option value="">選擇用戶</option>' + users.map((user, index) => `
                <option value="${index}">${user.name || '未命名用戶'}</option>
            `).join('');
        }
    };

    const applyCharPreset = (preset) => {
        if (!preset) return;
        const charName = preset.name || 'AI 助理';
        
        if (charNameInput) charNameInput.value = charName;
        if (charPersInput) charPersInput.value = preset.personality || '';
        if (charBackInput) charBackInput.value = preset.background || '';
        if (nameEl) nameEl.innerText = charName;
        if (chatTitleEl) chatTitleEl.innerText = charName;
        
        localStorage.setItem('sx_char_name', charName);
        if (preset.avatar) {
            localStorage.setItem('sx_char_avatar', preset.avatar);
            const preview = document.getElementById('preview-avatar');
            if (preview) preview.src = preset.avatar;
        }
        if (preset.personality) localStorage.setItem('sx_char_personality', preset.personality);
        if (preset.background) localStorage.setItem('sx_char_background', preset.background);
        
        charConfig = {
            name: charName,
            avatar: preset.avatar || '',
            personality: preset.personality || '一個友善的助手',
            background: preset.background || '無',
            worldBook: preset.worldBook || ''
        };
        
        const activeId = getActiveChatId();
        if (activeId) {
            const sessions = loadChatSessions();
            const session = sessions.find(s => s.id === activeId);
            if (session) {
                session.charName = charName;
                session.charAvatar = preset.avatar || '';
                session.charPersonality = preset.personality || '';
                session.charBackground = preset.background || '';
                saveChatSessions(sessions);
            }
        }
        
        renderChatListFromStorage();
        console.log('[Chat] 已套用角色預設:', charName);
    };

    const applyUserPreset = (preset) => {
        if (!preset) return;
        const userNameInput = document.getElementById('set-user-name');
        const userBgInput = document.getElementById('set-user-background');
        const userPersInput = document.getElementById('set-user-personality');
        const userAvatarPreview = document.getElementById('preview-user-avatar');
        
        const userName = preset.name || 'User';
        
        if (userNameInput) userNameInput.value = userName;
        if (userBgInput) userBgInput.value = preset.background || '';
        if (userPersInput) userPersInput.value = preset.personality || '';
        
        localStorage.setItem('sx_user_name', userName);
        localStorage.setItem('sx_user_background', preset.background || '');
        localStorage.setItem('sx_user_personality', preset.personality || '');
        
        if (preset.avatar) {
            localStorage.setItem('sx_user_avatar', preset.avatar);
            if (userAvatarPreview) userAvatarPreview.src = preset.avatar;
        } else {
            localStorage.removeItem('sx_user_avatar');
            if (userAvatarPreview) {
                userAvatarPreview.src = '';
                userAvatarPreview.style.background = '#eee';
            }
        }
        
        userConfig = getUserConfig();
        updateUserToList();
        
        const userLabels = document.querySelectorAll('.mine .user-name');
        userLabels.forEach(label => label.innerText = userName);
        
        console.log('[Chat] 已套用用戶預設:', userName, preset.avatar ? '有頭貼' : '無頭貼');
    };

    charPresetSelect?.addEventListener('change', () => {
        const index = Number(charPresetSelect.value);
        const list = loadCharPresets();
        applyCharPreset(list[index]);
    });

    userPresetSelect?.addEventListener('change', () => {
        const index = Number(userPresetSelect.value);
        const list = loadUserPresets();
        applyUserPreset(list[index]);
    });

    const requestWorldbookSync = () => {
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'REQUEST_WORLD_BOOK_SYNC' }, '*');
        } else {
            renderWorldbookOptions();
        }
    };

    const chatApp = document.querySelector('.chat-app');

    const showChatList = () => {
      chatApp?.classList.remove('detail-active');
      chatDetailView?.classList.add('hidden');
      document.querySelector('.kakao-bottom-tabs')?.classList.remove('hidden');
    };
  
    const showChatDetail = () => {
      chatApp?.classList.add('detail-active');
      chatDetailView?.classList.remove('hidden');
      document.querySelector('.kakao-bottom-tabs')?.classList.add('hidden');
    };

    const chatListActions = document.getElementById('chat-list-actions');
    const chatHideBtn = document.getElementById('chat-hide-btn');
    const chatDeleteBtn = document.getElementById('chat-delete-btn');
    const bottomTabs = document.querySelectorAll('.kakao-bottom-tab');
    const tabPanels = {
        chats: document.getElementById('chat-tab-chats'),
        friends: document.getElementById('chat-tab-friends'),
        more: document.getElementById('chat-tab-more')
    };

    const morePanels = {
        'emoji-shop': {
            panel: document.getElementById('emoji-shop-panel'),
            back: document.getElementById('emoji-shop-back')
        },
        'theme-shop': {
            panel: document.getElementById('theme-shop-panel'),
            back: document.getElementById('theme-shop-back')
        },
        'gift-shop': {
            panel: document.getElementById('gift-shop-panel'),
            back: document.getElementById('gift-shop-back')
        },
        'payment-code': {
            panel: document.getElementById('payment-code-panel'),
            back: document.getElementById('payment-code-back')
        },
        'appearance-settings': {
            panel: document.getElementById('appearance-settings-panel'),
            back: document.getElementById('appearance-settings-back')
        }
    };
    const moreGrid = document.getElementById('more-grid');
    let selectedChatItem = null;

    const closeAllMorePanels = () => {
        Object.values(morePanels).forEach(({ panel }) => panel?.classList.remove('active'));
    };

    const renderFriendsList = () => {
        const friendsPanel = document.getElementById('chat-tab-friends');
        if (!friendsPanel) return;
        
        const sessions = loadChatSessions();
        console.log('[renderFriendsList] sessions:', sessions);
        const uniqueFriends = new Map();
        
        sessions.forEach(session => {
            console.log('[renderFriendsList] session:', session.id, 'charName:', session.charName);
            if (session.charName && !uniqueFriends.has(session.charName)) {
                uniqueFriends.set(session.charName, {
                    name: session.charName,
                    avatar: session.charAvatar || '',
                    personality: session.charPersonality || '',
                    background: session.charBackground || ''
                });
            }
        });
        
        console.log('[renderFriendsList] uniqueFriends size:', uniqueFriends.size);
        
        if (uniqueFriends.size === 0) {
            friendsPanel.innerHTML = '<div class="tab-placeholder">尚未新增好友</div>';
            return;
        }
        
        const friendsList = document.createElement('div');
        friendsList.className = 'friends-list kakao-list';
        
        uniqueFriends.forEach((friend, name) => {
            const avatarStyle = friend.avatar 
                ? `background-image: url('${friend.avatar}'); background-size: cover; background-position: center;` 
                : 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);';
            
            const item = document.createElement('div');
            item.className = 'friend-list-item';
            item.dataset.friendName = name;
            item.innerHTML = `
                <div class="friend-avatar" style="${avatarStyle}"></div>
                <div class="friend-info">
                    <div class="friend-name">${name}</div>
                    <div class="friend-preview">${friend.personality ? friend.personality.slice(0, 30) + '...' : '點擊開始聊天'}</div>
                </div>
            `;
            friendsList.appendChild(item);
        });
        
        friendsPanel.innerHTML = '';
        friendsPanel.appendChild(friendsList);
        
        friendsList.querySelectorAll('.friend-list-item').forEach(item => {
            item.addEventListener('click', () => {
                const friendName = item.dataset.friendName;
                const sessions = loadChatSessions();
                const existingSession = sessions.find(s => s.charName === friendName);
                
                if (existingSession) {
                    setActiveChatId(existingSession.id);
                    localStorage.setItem('sx_chat_history', JSON.stringify(existingSession.history || []));
                    if (existingSession.charName) localStorage.setItem('sx_char_name', existingSession.charName);
                    if (existingSession.charAvatar) localStorage.setItem('sx_char_avatar', existingSession.charAvatar);
                    if (existingSession.charPersonality) localStorage.setItem('sx_char_personality', existingSession.charPersonality);
                    if (existingSession.charBackground) localStorage.setItem('sx_char_background', existingSession.charBackground);
                    charConfig = getActiveConfig();
                    if (chatTitleEl) chatTitleEl.innerText = friendName;
                    const nameEl = document.getElementById('display-name');
                    if (nameEl) nameEl.innerText = friendName;
                    const hintEl = document.getElementById('hint-name');
                    if (hintEl) hintEl.innerText = friendName;
                    showChatDetail();
                    renderHistory();
                } else {
                    let charName = localStorage.getItem('sx_char_name');
                    if (!charName || charName === '預設用戶') {
                        charName = charConfig.name || 'AI 助理';
                    }
                    const charAvatar = localStorage.getItem('sx_char_avatar') || '';
                    const charPersonality = localStorage.getItem('sx_char_personality') || '';
                    const charBackground = localStorage.getItem('sx_char_background') || '';
                    
                    const newSession = {
                        id: `chat_${Date.now()}`,
                        title: charName,
                        charName: charName,
                        charAvatar: charAvatar,
                        charPersonality: charPersonality,
                        charBackground: charBackground,
                        history: []
                    };
                    sessions.unshift(newSession);
                    saveChatSessions(sessions);
                    setActiveChatId(newSession.id);
                    renderChatListFromStorage();
                    localStorage.setItem('sx_chat_history', JSON.stringify(newSession.history));
                    if (chatTitleEl) chatTitleEl.innerText = charName;
                    showChatDetail();
                    renderHistory();
                }
            });
        });
    };

    bottomTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Tab clicked:', tab.dataset.tab);
            bottomTabs.forEach(btn => btn.classList.remove('active'));
            tab.classList.add('active');
            Object.values(tabPanels).forEach(panel => panel?.classList.remove('active'));
            const target = tab.dataset.tab;
            if (target && tabPanels[target]) {
                tabPanels[target].classList.add('active');
            }
            closeAllMorePanels();
            document.querySelector('.kakao-bottom-tabs')?.classList.remove('hidden');
            if (newChatBtn) {
                newChatBtn.style.display = target === 'friends' ? 'flex' : 'none';
            }
            if (target === 'friends') {
                renderFriendsList();
            }
            if (target !== 'chats') {
                chatApp?.classList.remove('detail-active');
                chatDetailView?.classList.add('hidden');
            } else {
                showChatList();
            }
        });
    });

    moreGrid?.addEventListener('click', (event) => {
        const item = event.target.closest('.more-item');
        if (!item) return;
        const panelKey = item.dataset.more;
        if (panelKey && morePanels[panelKey]) {
            closeAllMorePanels();
            morePanels[panelKey].panel?.classList.add('active');
            document.querySelector('.kakao-bottom-tabs')?.classList.add('hidden');
        }
    });

    Object.values(morePanels).forEach(({ panel, back }) => {
        back?.addEventListener('click', () => {
            panel?.classList.remove('active');
            const chatApp = document.querySelector('.chat-app');
            if (chatApp?.classList.contains('detail-active')) {
                return;
            }
            document.querySelector('.kakao-bottom-tabs')?.classList.remove('hidden');
            const moreTab = document.querySelector('.kakao-bottom-tab[data-tab="more"]');
            bottomTabs.forEach(btn => btn.classList.remove('active'));
            moreTab?.classList.add('active');
            Object.values(tabPanels).forEach(tabPanel => tabPanel?.classList.remove('active'));
            tabPanels.more?.classList.add('active');
        });
    });

    const renderChatListFromStorage = () => {
        if (!chatListView) return;
        chatListView.innerHTML = '';
        const sessions = loadChatSessions();
        sessions.forEach(session => {
            const history = session.history || [];
            const lastMsg = history[history.length - 1];
            const preview = lastMsg?.content ? lastMsg.content.slice(0, 20) : '點擊開始對話';
            
            const sessionCharName = session.charName || localStorage.getItem('sx_char_name') || charConfig.name || 'AI 助理';
            const sessionCharAvatar = session.charAvatar || localStorage.getItem('sx_char_avatar') || '';
            
            const item = document.createElement('div');
            item.className = 'chat-list-item';
            item.dataset.chatId = session.id;
            
            const avatarStyle = sessionCharAvatar 
                ? `background-image: url('${sessionCharAvatar}'); background-size: cover; background-position: center;` 
                : 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);';
            
            item.innerHTML = `
                <div class="chat-avatar" style="${avatarStyle}"></div>
                <div class="chat-info">
                    <div class="chat-name">${sessionCharName}</div>
                    <div class="chat-preview">${preview}</div>
                </div>
                <div class="chat-meta">剛剛</div>
            `;
            chatListView.appendChild(item);
        });
        
        if (sessions.length === 0) {
            let charName = localStorage.getItem('sx_char_name');
            if (!charName || charName === '預設用戶') {
                charName = charConfig.name || 'AI 助理';
            }
            const charAvatar = localStorage.getItem('sx_char_avatar') || '';
            const avatarStyle = charAvatar 
                ? `background-image: url('${charAvatar}'); background-size: cover; background-position: center;` 
                : 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);';
            
            // 修復: 為占位符添加特殊 ID 標記，表示這是空狀態佔位符，不可刪除
            chatListView.innerHTML = `
                <div class="chat-list-item chat-list-placeholder" data-chat-id="__placeholder__" style="justify-content: center; color: #888;">
                    <div class="chat-avatar" style="${avatarStyle}"></div>
                    <div class="chat-info" style="text-align: center;">
                        <div class="chat-name">${charName}</div>
                        <div class="chat-preview">點擊開始對話</div>
                    </div>
                </div>
            `;
        }
    };
    
    window.renderChatListFromStorage = renderChatListFromStorage;
    window.renderFriendsList = renderFriendsList;

    const showChatActions = (item) => {
        selectedChatItem = item;
        if (chatListActions) {
            chatListActions.classList.add('active');
        }
    };

    const hideChatActions = () => {
        selectedChatItem = null;
        if (chatListActions) {
            chatListActions.classList.remove('active');
        }
    };

    chatListView?.addEventListener('click', (event) => {
        if (chatListActions?.classList.contains('active')) {
            hideChatActions();
            return;
        }
        const item = event.target.closest('.chat-list-item');
        if (!item) return;
        const sessions = loadChatSessions();
        const target = sessions.find(s => s.id === item.dataset.chatId);
        
        let sessionCharName = target?.charName || localStorage.getItem('sx_char_name');
        if (!sessionCharName || sessionCharName === '預設用戶') {
            sessionCharName = charConfig.name || 'AI 助理';
        }
        
        if (target) {
            setActiveChatId(target.id);
            localStorage.setItem('sx_chat_history', JSON.stringify(target.history || []));
            
            if (target.charName) {
                localStorage.setItem('sx_char_name', target.charName);
            }
            if (target.charAvatar) {
                localStorage.setItem('sx_char_avatar', target.charAvatar);
            }
            if (target.charPersonality) {
                localStorage.setItem('sx_char_personality', target.charPersonality);
            }
            if (target.charBackground) {
                localStorage.setItem('sx_char_background', target.charBackground);
            }
            
            charConfig = getActiveConfig();
            
            if (chatTitleEl) chatTitleEl.innerText = sessionCharName;
            const nameEl = document.getElementById('display-name');
            if (nameEl) nameEl.innerText = sessionCharName;
            const hintEl = document.getElementById('hint-name');
            if (hintEl) hintEl.innerText = sessionCharName;
            const charNameInput = document.getElementById('set-name');
            if (charNameInput) charNameInput.value = sessionCharName;
        }
        showChatDetail();
        renderHistory();
    });

    chatListView?.addEventListener('contextmenu', (event) => {
        const item = event.target.closest('.chat-list-item');
        if (!item) return;
        
        // 修復: 檢查是否為佔位符項目，佔位符不顯示刪除選項
        const chatId = item.dataset.chatId;
        if (chatId === '__placeholder__') {
            console.log('[Chat] 佔位符項目不支援右鍵選單');
            return;
        }
        
        event.preventDefault();
        showChatActions(item);
    });

    let longPressTimer = null;
    chatListView?.addEventListener('touchstart', (event) => {
        const item = event.target.closest('.chat-list-item');
        if (!item) return;
        
        // 修復: 檢查是否為佔位符項目
        const chatId = item.dataset.chatId;
        if (chatId === '__placeholder__') {
            return;
        }
        
        longPressTimer = setTimeout(() => {
            showChatActions(item);
        }, 500);
    });

    chatListView?.addEventListener('touchend', () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    });

    chatHideBtn?.addEventListener('click', () => {
        if (!selectedChatItem) {
            console.warn('[Chat] 隱藏失敗: 未選擇任何聊天項目');
            hideChatActions();
            return;
        }
        selectedChatItem.style.display = 'none';
        hideChatActions();
    });

    chatDeleteBtn?.addEventListener('click', () => {
        // 修復: 添加診斷日誌和錯誤提示
        console.log('[Chat] 刪除按鈕點擊, selectedChatItem:', selectedChatItem);
        
        if (!selectedChatItem) {
            console.warn('[Chat] 刪除失敗: 未選擇任何聊天項目');
            alert('請先長按或右鍵點擊要刪除的聊天項目');
            hideChatActions();
            return;
        }
        
        const chatId = selectedChatItem.dataset.chatId;
        console.log('[Chat] 嘗試刪除 chatId:', chatId);
        
        // 修復: 檢查是否為佔位符項目
        if (chatId === '__placeholder__') {
            console.warn('[Chat] 無法刪除佔位符項目');
            alert('此為空狀態佔位符，無法刪除。請先開始新的對話。');
            hideChatActions();
            return;
        }
        
        // 修復: 檢查 chatId 是否存在
        if (!chatId) {
            console.error('[Chat] 刪除失敗: chatId 為空');
            alert('刪除失敗：無法識別此聊天項目');
            hideChatActions();
            return;
        }
        
        const sessions = loadChatSessions();
        const newSessions = sessions.filter(s => s.id !== chatId);
        
        console.log('[Chat] 刪除前 sessions 數量:', sessions.length, '刪除後:', newSessions.length);
        
        saveChatSessions(newSessions);
        selectedChatItem.remove();
        renderFriendsList();
        renderChatListFromStorage(); // 修復: 重新渲染列表以確保一致性
        hideChatActions();
        
        console.log('[Chat] 聊天項目已成功刪除');
    });


    backToListBtn?.addEventListener('click', () => {
        showChatList();
    });

    newChatBtn?.addEventListener('click', () => {
        let charName = localStorage.getItem('sx_char_name');
        if (!charName || charName === '預設用戶') {
            charName = charConfig.name || 'AI 助理';
        }
        const charAvatar = localStorage.getItem('sx_char_avatar') || '';
        const charPersonality = localStorage.getItem('sx_char_personality') || '';
        const charBackground = localStorage.getItem('sx_char_background') || '';
        
        const newSession = {
            id: `chat_${Date.now()}`,
            title: charName,
            charName: charName,
            charAvatar: charAvatar,
            charPersonality: charPersonality,
            charBackground: charBackground,
            history: []
        };
        const sessions = loadChatSessions();
        sessions.unshift(newSession);
        saveChatSessions(sessions);
        setActiveChatId(newSession.id);
        renderChatListFromStorage();
        renderFriendsList();
        localStorage.setItem('sx_chat_history', JSON.stringify(newSession.history));
        if (chatTitleEl) chatTitleEl.innerText = charName;
        showChatDetail();
        renderHistory();
    });

    migrateLegacyHistory();
    renderChatListFromStorage();
    renderFriendsList();
    const activeSession = getActiveSession();
    if (activeSession) {
        setActiveChatId(activeSession.id);
    }
    showChatList();

    // B. 初始化 UI 顯示
    const hintEl = document.getElementById('hint-name');
    let displayName = localStorage.getItem('sx_char_name');
    if (!displayName || displayName === '預設用戶') {
        displayName = charConfig.name || "AI 助理";
    }
    if (nameEl) nameEl.innerText = displayName;
    if (chatTitleEl) chatTitleEl.innerText = displayName;
    if (hintEl) hintEl.innerText = displayName;
    if (charPersInput) charPersInput.value = localStorage.getItem('sx_char_personality') || charConfig.personality || "";
    if (charBackInput) charBackInput.value = localStorage.getItem('sx_char_background') || charConfig.background || "";
    if (charNameInput) charNameInput.value = displayName;
    
    console.log('[Chat] 初始化 UI，角色名稱:', displayName);

    renderPresetOptions();

    initUserUI();
    renderHistory();
    initSideDrawer();
    initAPISettings();
    initPhoneCheckToggle();
    initPasskeyControlToggle();
    checkBlockStatus();
    
    requestWorldbookSync();

    initDatingInvitation();
    initDatingInviteSettings();
    initGreetingSettings();
    initRelationshipDistanceSettings();


    const chatFontRange = document.getElementById('chat-font-range');
    const chatFontOutput = document.getElementById('chat-font-output');
    if (chatFontRange) {
        const savedFont = localStorage.getItem('sx_chat_font_size');
        if (savedFont) {
            chatFontRange.value = savedFont;
            if (chatFontOutput) chatFontOutput.value = savedFont;
            document.documentElement.style.setProperty('--chat-font-size', `${savedFont}px`);
        }
        chatFontRange.addEventListener('input', (event) => {
            const value = event.target.value;
            if (chatFontOutput) chatFontOutput.value = value;
            localStorage.setItem('sx_chat_font_size', value);
            document.documentElement.style.setProperty('--chat-font-size', `${value}px`);
        });
    }

    // D. 綁定文字輸入監聽
    charPersInput?.addEventListener('input', (e) => updateActiveMask('personality', e.target.value));
    charBackInput?.addEventListener('input', (e) => updateActiveMask('background', e.target.value));
    charNameInput?.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (nameEl) nameEl.innerText = val; 
        if (chatTitleEl) chatTitleEl.innerText = val || 'AI 助理';
        saveCharSettings(val); 
    });

    // E. 綁定按鈕點擊事件
    if (sendBtnTrigger) {
        sendBtnTrigger.onclick = (e) => {
            e.preventDefault();
            // 傳送前再次檢查拉黑狀態，若已被拉黑則不執行
            if (checkBlockStatus()) return; 
            handleJustSend();
        };
    }

    if (genBtnTrigger) {
        genBtnTrigger.onclick = (e) => {
            e.preventDefault();
            if (checkBlockStatus()) return;
            handleTriggerAI();
        };
    }

    window.addEventListener('message', (event) => {
        const data = event.data;
        if (!data || typeof data !== 'object') return;
        
        // 處理表情包選擇
        if (data.type === 'EMOJI_SELECTED' && data.emoji) {
            console.log('[Chat] 收到表情包選擇:', data.emoji);
            
            // 發送圖片表情
            appendMsg('mine', '', { type: 'image', url: data.emoji.url, name: data.emoji.name });
            const history = JSON.parse(localStorage.getItem('sx_chat_history') || '[]');
            history.push({ role: "user", content: `[表情: ${data.emoji.name}]`, imageUrl: data.emoji.url });
            localStorage.setItem('sx_chat_history', JSON.stringify(history));
            const activeId = getActiveChatId();
            if (activeId) {
                const sessions = loadChatSessions();
                const target = sessions.find(s => s.id === activeId);
                if (target) {
                    target.history = history;
                    saveChatSessions(sessions);
                }
            }
            
            // 關閉表情包商店面板
            const emojiShopPanel = document.getElementById('emoji-shop-panel');
            if (emojiShopPanel) {
                emojiShopPanel.classList.remove('active');
            }
            const chatApp = document.querySelector('.chat-app');
            if (!chatApp?.classList.contains('detail-active')) {
                document.querySelector('.kakao-bottom-tabs')?.classList.remove('hidden');
            }
            
            return;
        }
        
        // 處理表情包更新
        if (data.type === 'EMOJI_PACKS_UPDATED') {
            console.log('[Chat] 表情包已更新，數量:', data.count);
            return;
        }
        
        if (data.type === 'WORLD_BOOK_SYNC_READY') {
            renderWorldbookOptions();
        }
        if (data.type === 'MEMORY_HISTORY_READY') {
            const items = data.payload?.items || [];
            const context = data.payload?.context;
            const identity = data.payload?.identity;
            const pool = data.payload?.pool;
            
            if (context) {
                console.log('[Chat] 記憶上下文:', context.summary);
            }
            
            if (identity) {
                console.log('[Chat] AI 身份:', identity.name);
            }
            
            if (!items.length && !pool) return;
            const chatFlow = document.getElementById('chat-flow');
            if (!chatFlow || chatFlow.children.length > 0) return;
            
            if (items.length > 0) {
                const seed = items.slice(0, 8).map(item => ({ 
                    role: 'assistant', 
                    content: `【記憶】${item.content || item.summary}` 
                }));
                seed.forEach(m => appendMsg('other', m.content));
            }
            
            if (pool && pool.summary) {
                appendMsg('other', `【感知記憶】${pool.summary}`);
            }
        }
        if (data.type === 'MEMORY_CLEAR_DONE') {
            alert('✅ 記憶已清理');
        }
        if (data.type === 'APP_FOLDER_SYNC' && data.appId === 'settings' && data.data?.storage) {
            const storage = data.data.storage;
            if (storage.sx_characters) localStorage.setItem('sx_characters', storage.sx_characters);
            if (storage.sx_users) localStorage.setItem('sx_users', storage.sx_users);
            if (storage.sx_nova_api_url) localStorage.setItem('sx_nova_api_url', storage.sx_nova_api_url);
            if (storage.sx_nova_api_key) localStorage.setItem('sx_nova_api_key', storage.sx_nova_api_key);
            
            if (storage.sx_user_name) localStorage.setItem('sx_user_name', storage.sx_user_name);
            if (storage.sx_user_avatar) localStorage.setItem('sx_user_avatar', storage.sx_user_avatar);
            if (storage.sx_user_personality) localStorage.setItem('sx_user_personality', storage.sx_user_personality);
            if (storage.sx_user_background) localStorage.setItem('sx_user_background', storage.sx_user_background);
            
            renderPresetOptions();
            
            userConfig = getUserConfig();
            initUserUI();
        }
        
        if (data.type === 'USER_AVATAR_UPDATED' && data.payload?.avatar) {
            localStorage.setItem('sx_user_avatar', data.payload.avatar);
            userConfig.avatar = data.payload.avatar;
            
            const userAvatarPreview = document.getElementById('preview-user-avatar');
            if (userAvatarPreview) {
                userAvatarPreview.src = data.payload.avatar;
            }
            
            updateUserToList();
        }
        
        if (data.type === 'settingsUpdated') {
            console.log('[Chat] 收到 settings 更新，重新載入用戶資料');
            userConfig = getUserConfig();
            initUserUI();
            
            const userLabels = document.querySelectorAll('.mine .user-name');
            userLabels.forEach(label => label.innerText = userConfig.name || 'User');
        }
        
        // 處理主題變更
        if (data.type === 'THEME_CHANGED' && data.theme) {
            console.log('[Chat] 收到主題變更:', data.theme.name);
            applyChatTheme(data.theme);
            
            // 轉發到父視窗以便同步
            window.parent?.postMessage({
                type: 'THEME_CHANGED',
                theme: data.theme
            }, '*');
        }
        
        // 處理外觀主題變更
        if (data.type === 'APPEARANCE_THEME_CHANGED' && data.config) {
            console.log('[Chat] 收到外觀主題變更');
            applyAppearanceConfig(data.config);
        }
        
        // 處理主題創建同步
        if (data.type === 'THEME_CREATED' && data.theme) {
            console.log('[Chat] 收到主題創建:', data.theme.name);
            // 轉發到父視窗以便同步到雲端
            window.parent?.postMessage({
                type: 'THEME_CREATED',
                theme: data.theme
            }, '*');
        }
    });

    if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'REQUEST_APP_FOLDER_SYNC', appId: 'settings' }, '*');
    }

    // 【核心新增】綁定拉黑按鈕點擊動作
    if (blockBtn) {
        blockBtn.onclick = () => {
            const charName = charConfig.name || "此角色";
            if (confirm(`確定要拉黑 ${charName} 一小時嗎？這期間將無法發送訊息。`)) {
                // 設定一小時後的 timestamp
                const blockUntil = new Date().getTime() + (1 * 60 * 60 * 1000); 
                localStorage.setItem(`block_${charName}`, blockUntil);
                
                // 立即更新 UI 狀態
                checkBlockStatus(); 
                alert("已將該角色暫時拉黑。");
            }
        };
    }

    if (deleteChatBtn) {
        deleteChatBtn.onclick = () => {
            if (!confirm('確定要刪除目前對話嗎？')) return;
            
            const activeId = getActiveChatId();
            console.log('[Chat] 刪除當前對話, activeId:', activeId);
            
            // 修復: 檢查 activeId 是否存在
            if (!activeId) {
                console.warn('[Chat] 刪除失敗: 沒有活躍的對話');
                alert('目前沒有活躍的對話可刪除');
                return;
            }
            
            const sessions = loadChatSessions();
            const newSessions = sessions.filter(s => s.id !== activeId);
            
            console.log('[Chat] 刪除前 sessions 數量:', sessions.length, '刪除後:', newSessions.length);
            
            saveChatSessions(newSessions);
            localStorage.removeItem('sx_chat_history');
            localStorage.removeItem('sx_chat_active'); // 修復: 清除活躍對話 ID
            
            renderHistory();
            renderChatListFromStorage();
            showChatList();
            alert('目前對話已刪除');
            
            console.log('[Chat] 當前對話已成功刪除');
        };
    }

    if (clearChatBtn) {
        clearChatBtn.onclick = () => {
            if (!confirm('只清除當前對話內容？（記憶摘要不會被清掉）')) return;
            localStorage.setItem('sx_chat_history', JSON.stringify([]));
            const activeId = getActiveChatId();
            if (activeId) {
                const sessions = loadChatSessions();
                const target = sessions.find(s => s.id === activeId);
                if (target) {
                    target.history = [];
                    saveChatSessions(sessions);
                }
            }
            renderHistory();
        };
    }

    if (clearMemoryBtn) {
        clearMemoryBtn.onclick = () => {
            if (!confirm('確定要清理「記憶摘要」嗎？這會影響連續對話。')) return;
            window.parent?.postMessage({
                type: 'MEMORY_CLEAR_REQUEST',
                payload: { scope: 'user' }
            }, '*');
            alert('已送出記憶清理請求');
        };
    }

    // F. 處理圖片讀取與 iOS 適配 (保持原樣)
    const avatarInputs = [
        { inputId: 'avatar-file', previewId: 'preview-avatar', type: 'char' },
        { inputId: 'user-avatar-file', previewId: 'preview-user-avatar', type: 'user' }
    ];

    avatarInputs.forEach(config => {
        const input = document.getElementById(config.inputId);
        const preview = document.getElementById(config.previewId);
        if (input && preview) {
            if (config.type === 'char' && charConfig.avatar) {
                preview.src = charConfig.avatar;
            } else if (config.type === 'user') {
                const savedAvatar = localStorage.getItem('sx_user_avatar');
                if (savedAvatar) {
                    preview.src = savedAvatar;
                    userConfig.avatar = savedAvatar;
                }
            }

            input.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (!file || file.size > 1024 * 1024) return;
                const reader = new FileReader();
                reader.onload = function(event) {
                    const base64 = event.target.result;
                    preview.src = base64;
                    
                    if (config.type === 'char') {
                        updateActiveMask('avatar', base64);
                    } else {
                        localStorage.setItem('sx_user_avatar', base64);
                        userConfig.avatar = base64;
                        
                        updateUserToList();
                        
                        window.parent?.postMessage({
                            type: 'USER_AVATAR_UPDATED',
                            payload: { avatar: base64 }
                        }, '*');
                        
                        console.log('[Chat] 用戶頭貼已保存並同步');
                    }
                };
                reader.readAsDataURL(file);
            });
        }
    }); 
});

    // --- 歷史紀錄長度控制 (獨立於迴圈外) ---
    const rangeInput = document.getElementById('history-range');
    if (rangeInput) {
        rangeInput.value = localStorage.getItem('chat_history_range') || 30;
        const output = rangeInput.nextElementSibling;
        if(output) output.value = rangeInput.value;
        rangeInput.oninput = (e) => {
            if(output) output.value = e.target.value;
            localStorage.setItem('chat_history_range', e.target.value);
        };
    }
    // 初始化右鍵選單
    if (!document.getElementById('context-menu')) {
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.id = 'context-menu';
        menu.innerHTML = `
            <div class="context-menu-item" onclick="copyText(event)">複製</div>
            <div class="context-menu-item" onclick="editMsg(event)">編輯</div>
            <div class="context-menu-item" onclick="triggerRegen(event)">重新生成</div>
            <div class="context-menu-item danger" onclick="deleteMsg(event)">刪除</div>
        `;
        document.body.appendChild(menu);
    }

// --- 3. 側邊欄邏輯 ---
function initSideDrawer() {
    const drawer = document.getElementById('config-drawer');
    const openBtn = document.getElementById('open-menu');
    const closeBtn = document.getElementById('close-menu');
    const plusBtn = document.getElementById('plus-btn');
    const plusMenu = document.getElementById('plus-menu');

    if (openBtn && drawer) {
        openBtn.onclick = (e) => { 
            e.stopPropagation(); 
            charConfig = getActiveConfig();
            userConfig = getUserConfig();
            
            const charPersInput = document.getElementById('set-personality');
            const charBackInput = document.getElementById('set-background');
            const charNameInput = document.getElementById('set-name');
            const charAvatarPreview = document.getElementById('preview-avatar');
            
            if (charNameInput) charNameInput.value = charConfig.name || '';
            if (charPersInput) charPersInput.value = charConfig.personality || '';
            if (charBackInput) charBackInput.value = charConfig.background || '';
            if (charAvatarPreview && charConfig.avatar) charAvatarPreview.src = charConfig.avatar;
            
            console.log('[SideDrawer] 已更新側邊欄角色設定:', charConfig.name, charConfig.personality?.slice(0, 20));
            
            drawer.classList.add('open'); 
        };
    }
    if (closeBtn && drawer) {
        closeBtn.onclick = (e) => { e.stopPropagation(); drawer.classList.remove('open'); };
    }

    const emojiPanel = document.getElementById('emoji-panel');
    const emojiRow = document.getElementById('emoji-row');
    const emojiBack = document.getElementById('emoji-back');
    const locationPanel = document.getElementById('location-panel');
    const locationInput = document.getElementById('location-input');
    const sendLocationBtn = document.getElementById('send-location');
    const transferPanel = document.getElementById('transfer-panel');
    const transferTypeInput = document.getElementById('transfer-type');
    const transferDirectionInput = document.getElementById('transfer-direction');
    const transferAmountInput = document.getElementById('transfer-amount');
    const transferNoteInput = document.getElementById('transfer-note');
    const transferWalletMount = document.getElementById('transfer-wallets');
    const sendTransferBtn = document.getElementById('send-transfer');
    const envelopeStyleSection = document.getElementById('envelope-style-section');
    const envelopeStylesContainer = document.getElementById('envelope-styles');
    const envelopeCustomUpload = document.getElementById('envelope-custom-upload');
    const envelopeCustomFile = document.getElementById('envelope-custom-file');
    const envelopeCustomPreview = document.getElementById('envelope-custom-preview');
    const imageUpload = document.getElementById('image-upload');
    const diaryPanel = document.getElementById('diary-panel');
    const diaryTimeInput = document.getElementById('diary-time');
    const diaryDateInput = document.getElementById('diary-date');
    const diaryPreview = document.getElementById('diary-preview');
    const diaryCancelBtn = document.getElementById('diary-cancel');
    const diaryGenerateBtn = document.getElementById('diary-generate');
    const checkPhonePanel = document.getElementById('check-phone-panel');
    const checkPhoneCharName = document.getElementById('check-phone-char-name');
    const checkPhoneCloseBtn = document.getElementById('check-phone-close');
    const checkPhoneCloseHeader = document.getElementById('check-phone-close-header');
    const checkPhoneApps = document.getElementById('check-phone-apps');
    const charAppViewer = document.getElementById('char-app-viewer');
    const charAppFrame = document.getElementById('char-app-frame');
    const charAppTitle = document.getElementById('char-app-title');
    const backToPhoneBtn = document.getElementById('back-to-phone-btn');
    const innerVoicePanel = document.getElementById('inner-voice-panel');
    const innerVoiceLoading = document.getElementById('inner-voice-loading');
    const innerVoiceContent = document.getElementById('inner-voice-content');
    const innerVoiceCloseBtn = document.getElementById('inner-voice-close');
    const innerVoiceRegenBtn = document.getElementById('inner-voice-regen');
    const innerVoiceHistoryBtn = document.getElementById('inner-voice-history');
    const innerVoiceHistoryPanel = document.getElementById('inner-voice-history-panel');
    const innerVoiceHistoryList = document.getElementById('inner-voice-history-list');
    const innerVoiceHistoryCloseBtn = document.getElementById('inner-voice-history-close');

    const INNER_VOICE_HISTORY_KEY = 'sx_inner_voice_history';

    const getInnerVoiceHistory = () => {
        try {
            const raw = localStorage.getItem(INNER_VOICE_HISTORY_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    };

    const saveInnerVoiceToHistory = (content, charName) => {
        const history = getInnerVoiceHistory();
        const lang = localStorage.getItem('sxiphone_lang') || 'zh-Hant';
        const localeCode = window.getLocaleStringLang?.(lang) || 'zh-TW';
        const entry = {
            id: `iv_${Date.now()}`,
            content,
            charName: charName || 'AI 助理',
            timestamp: Date.now(),
            date: new Date().toLocaleString(localeCode)
        };
        history.unshift(entry);
        if (history.length > 50) {
            history.pop();
        }
        localStorage.setItem(INNER_VOICE_HISTORY_KEY, JSON.stringify(history));
    };

    const saveInnerVoiceToShortTermMemory = (content, charName) => {
        try {
            let shortTermMemory = window.shortTermMemory;
            
            if (!shortTermMemory || !shortTermMemory.isInitialized) {
                if (typeof ShortTermMemory !== 'undefined') {
                    shortTermMemory = new ShortTermMemory({
                        maxCapacity: 100,
                        decayMinutes: 30,
                        importanceThreshold: 6
                    });
                    shortTermMemory.initialize();
                    window.shortTermMemory = shortTermMemory;
                    console.log('[InnerVoice] 已創建 ShortTermMemory');
                } else {
                    console.warn('[InnerVoice] ShortTermMemory 未定義，無法儲存到短期記憶');
                    return;
                }
            }

            const memoryContent = `[心聲] ${charName} 的內心獨白：${content}`;
            
            shortTermMemory.push(memoryContent, {
                role: 'assistant',
                source: 'inner_voice',
                importance: 7,
                tags: ['inner_voice', 'monologue', charName],
                metadata: {
                    type: 'inner_voice',
                    charName,
                    generatedAt: new Date().toISOString()
                }
            });

            console.log('[InnerVoice] 已儲存到短期記憶，睡眠時將轉為長期記憶');
        } catch (e) {
            console.warn('[InnerVoice] 儲存到短期記憶失敗:', e);
        }
    };

    const renderInnerVoiceHistory = () => {
        if (!innerVoiceHistoryList) return;
        const history = getInnerVoiceHistory();
        
        if (history.length === 0) {
            innerVoiceHistoryList.innerHTML = '<div class="history-empty">尚未有歷史記錄</div>';
            return;
        }

        innerVoiceHistoryList.innerHTML = history.map(entry => `
            <div class="history-item" data-id="${entry.id}">
                <div class="history-meta">
                    <span class="history-char">${entry.charName}</span>
                    <span class="history-date">${entry.date}</span>
                </div>
                <div class="history-content">${entry.content}</div>
            </div>
        `).join('');
    };

    const openInnerVoiceHistoryPanel = () => {
        renderInnerVoiceHistory();
        innerVoiceHistoryPanel?.classList.add('active');
    };

    const closeInnerVoiceHistoryPanel = () => {
        innerVoiceHistoryPanel?.classList.remove('active');
    };
    const voiceCallPanel = document.getElementById('voice-call-panel');
    const voiceCallStatus = document.getElementById('voice-call-status');
    const voiceCallVisualizer = document.getElementById('voice-call-visualizer');
    const voiceCallTranscript = document.getElementById('voice-call-transcript');
    const voiceCallStartBtn = document.getElementById('voice-call-start');
    const voiceCallEndBtn = document.getElementById('voice-call-end');
    const voiceCallSettingsHint = document.getElementById('voice-call-settings-hint');
    const voiceGotoSettingsBtn = document.getElementById('voice-goto-settings');
    const callStatusIcon = document.getElementById('call-status-icon');
    const callStatusText = document.getElementById('call-status-text');
    const callTimer = document.getElementById('call-timer');

    const VOICE_SETTINGS_KEY = 'sx_voice_settings';
    let callState = 'idle';
    let callTimerInterval = null;
    let callSeconds = 0;
    let callStartTime = 0;
    let callTranscriptData = [];
    let callTtsBlobs = [];
    let mediaStream = null;
    let mediaRecorder = null;
    let audioContext = null;
    let analyser = null;

    const getVoiceSettings = () => {
        try {
            const raw = localStorage.getItem(VOICE_SETTINGS_KEY);
            const parsed = raw ? JSON.parse(raw) : {};
            return {
                sttApiUrl: parsed.sttApiUrl || '',
                sttApiKey: parsed.sttApiKey || '',
                sttModel: parsed.sttModel || 'whisper-1',
                sttLanguage: parsed.sttLanguage || 'zh-TW',
                ttsApiUrl: parsed.ttsApiUrl || '',
                ttsApiKey: parsed.ttsApiKey || '',
                ttsModel: parsed.ttsModel || 'tts-1',
                ttsVoice: parsed.ttsVoice || 'alloy',
                ttsSpeed: parsed.ttsSpeed || 1.0,
                voiceAutoTts: parsed.voiceAutoTts !== false,
                voiceThinkDelay: parsed.voiceThinkDelay || 1.5,
                voiceProvider: parsed.voiceProvider || '',
                thirdPartyVoiceUrl: parsed.thirdPartyVoiceUrl || '',
                thirdPartyVoiceKey: parsed.thirdPartyVoiceKey || '',
                thirdPartyGroupId: parsed.thirdPartyGroupId || '',
                thirdPartySttPath: parsed.thirdPartySttPath || '/audio/transcriptions',
                thirdPartyTtsPath: parsed.thirdPartyTtsPath || '/text_to_speech',
                thirdPartyVoiceName: parsed.thirdPartyVoiceName || '',
                thirdPartyRequestFormat: parsed.thirdPartyRequestFormat || 'openai',
                thirdPartyAudioFormat: parsed.thirdPartyAudioFormat || 'binary',
                audioResponsePath: parsed.audioResponsePath || 'data.audio',
                customTtsBody: parsed.customTtsBody || '',
                useBuiltIn: parsed.useBuiltIn !== false,
                builtInVoice: parsed.builtInVoice || '',
                useTransformers: parsed.useTransformers || false,
                transformersModel: parsed.transformersModel || 'Xenova/whisper-small',
                ttsLanguage: parsed.ttsLanguage || 'zh-TW',
                enableTranslation: parsed.enableTranslation !== false,
                translateApiUrl: parsed.translateApiUrl || '',
                translateApiKey: parsed.translateApiKey || ''
            };
        } catch {
            return {
                sttApiUrl: '', sttApiKey: '', sttModel: 'whisper-1', sttLanguage: 'zh-TW',
                ttsApiUrl: '', ttsApiKey: '', ttsModel: 'tts-1', ttsVoice: 'alloy', ttsSpeed: 1.0,
                voiceAutoTts: true, voiceThinkDelay: 1.5,
                voiceProvider: '', thirdPartyVoiceUrl: '', thirdPartyVoiceKey: '',
                thirdPartyGroupId: '', thirdPartySttPath: '/audio/transcriptions',
                thirdPartyTtsPath: '/text_to_speech', thirdPartyVoiceName: '',
                thirdPartyRequestFormat: 'openai', thirdPartyAudioFormat: 'binary',
                audioResponsePath: 'data.audio', customTtsBody: '',
                useBuiltIn: true, builtInVoice: '',
                useTransformers: false, transformersModel: 'Xenova/whisper-small',
                ttsLanguage: 'zh-TW',
                enableTranslation: true,
                translateApiUrl: '',
                translateApiKey: ''
            };
        }
    };

    const TransformersWhisperService = {
        transcriber: null,
        isLoading: false,
        loadProgress: 0,
        
        async initialize(onProgress) {
            if (this.transcriber) return this.transcriber;
            if (this.isLoading) {
                return new Promise((resolve) => {
                    const checkInterval = setInterval(() => {
                        if (this.transcriber) {
                            clearInterval(checkInterval);
                            resolve(this.transcriber);
                        }
                    }, 500);
                });
            }
            
            if (!window.TransformersReady) {
                await new Promise((resolve) => {
                    window.addEventListener('transformers-ready', resolve, { once: true });
                });
            }
            
            this.isLoading = true;
            
            try {
                const settings = getVoiceSettings();
                const modelName = settings.transformersModel || 'Xenova/whisper-small';
                
                if (window.TransformersEnv) {
                    window.TransformersEnv.allowLocalModels = false;
                }
                
                this.transcriber = await window.TransformersPipeline(
                    'automatic-speech-recognition',
                    modelName,
                    {
                        progress_callback: (progress) => {
                            this.loadProgress = progress;
                            if (onProgress) onProgress(progress);
                        }
                    }
                );
                
                this.isLoading = false;
                return this.transcriber;
            } catch (err) {
                this.isLoading = false;
                console.error('Transformers.js 初始化失敗:', err);
                throw err;
            }
        },
        
        async transcribe(audioBlob, language = 'zh') {
            const transcriber = await this.initialize();
            
            const audioBuffer = await audioBlob.arrayBuffer();
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const audioData = await audioContext.decodeAudioData(audioBuffer);
            
            const audioArray = audioData.getChannelData(0);
            const sampleRate = audioData.sampleRate;
            
            const targetSampleRate = 16000;
            let resampledAudio;
            if (sampleRate !== targetSampleRate) {
                resampledAudio = await this.resampleAudio(audioArray, sampleRate, targetSampleRate);
            } else {
                resampledAudio = audioArray;
            }
            
            audioContext.close();
            
            const transcribeOptions = {
                task: 'transcribe',
                chunk_length_s: 30,
                stride_length_s: 5
            };
            
            if (language && language !== 'auto') {
                transcribeOptions.language = language.split('-')[0];
            }
            
            const result = await transcriber(resampledAudio, transcribeOptions);
            
            return result.text || '';
        },
        
        async resampleAudio(audioData, fromSampleRate, toSampleRate) {
            const ratio = fromSampleRate / toSampleRate;
            const newLength = Math.round(audioData.length / ratio);
            const result = new Float32Array(newLength);
            
            for (let i = 0; i < newLength; i++) {
                const srcIndex = Math.floor(i * ratio);
                result[i] = audioData[srcIndex];
            }
            
            return result;
        },
        
        isAvailable() {
            return typeof window.TransformersPipeline === 'function' || window.TransformersReady === true;
        }
    };

    const BuiltInSpeechService = {
        recognition: null,
        synthesis: window.speechSynthesis,
        isListening: false,
        voices: [],
        
        isSupported() {
            const hasRecognition = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
            const hasSynthesis = 'speechSynthesis' in window;
            return { stt: hasRecognition, tts: hasSynthesis };
        },
        
        getVoices() {
            if (this.voices.length === 0 && this.synthesis) {
                this.voices = this.synthesis.getVoices() || [];
            }
            return this.voices;
        },
        
        getChineseVoices() {
            const voices = this.getVoices();
            return voices.filter(v => 
                v.lang.startsWith('zh') || 
                v.lang.startsWith('cmn') ||
                v.name.toLowerCase().includes('chinese') ||
                v.name.toLowerCase().includes('中文') ||
                v.name.toLowerCase().includes('台灣')
            );
        },
        
        findBestVoice(lang = 'zh-TW') {
            const voices = this.getVoices();
            let voice = voices.find(v => v.lang === lang);
            if (voice) return voice;
            
            voice = voices.find(v => v.lang.startsWith(lang.split('-')[0]));
            if (voice) return voice;
            
            const chineseVoices = this.getChineseVoices();
            if (chineseVoices.length > 0) return chineseVoices[0];
            
            return voices[0] || null;
        },
        
        startRecognition(options = {}) {
            return new Promise((resolve, reject) => {
                const support = this.isSupported();
                if (!support.stt) {
                    reject(new Error('此瀏覽器不支援語音辨識功能'));
                    return;
                }
                
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                this.recognition = new SpeechRecognition();
                
                this.recognition.lang = options.lang || 'zh-TW';
                this.recognition.continuous = options.continuous || false;
                this.recognition.interimResults = options.interimResults || false;
                this.recognition.maxAlternatives = 1;
                
                let finalTranscript = '';
                
                this.recognition.onresult = (event) => {
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript;
                        }
                    }
                };
                
                this.recognition.onend = () => {
                    this.isListening = false;
                    resolve(finalTranscript.trim());
                };
                
                this.recognition.onerror = (event) => {
                    this.isListening = false;
                    if (event.error === 'no-speech') {
                        resolve('');
                    } else {
                        reject(new Error(`語音辨識錯誤: ${event.error}`));
                    }
                };
                
                this.isListening = true;
                this.recognition.start();
            });
        },
        
        stopRecognition() {
            if (this.recognition && this.isListening) {
                this.recognition.stop();
                this.isListening = false;
            }
        },
        
        speak(text, options = {}) {
            return new Promise((resolve, reject) => {
                const support = this.isSupported();
                if (!support.tts) {
                    reject(new Error('此瀏覽器不支援語音合成功能'));
                    return;
                }
                
                if (!text || !text.trim()) {
                    resolve();
                    return;
                }
                
                const utterance = new SpeechSynthesisUtterance(text);
                
                const voice = options.voice || this.findBestVoice(options.lang || 'zh-TW');
                if (voice) {
                    utterance.voice = voice;
                    utterance.lang = voice.lang;
                } else {
                    utterance.lang = options.lang || 'zh-TW';
                }
                
                utterance.rate = options.rate || 1.0;
                utterance.pitch = options.pitch || 1.0;
                utterance.volume = options.volume || 1.0;
                
                utterance.onend = () => resolve();
                utterance.onerror = (event) => reject(new Error(`語音合成錯誤: ${event.error}`));
                
                this.synthesis.speak(utterance);
            });
        },
        
        stopSpeaking() {
            if (this.synthesis) {
                this.synthesis.cancel();
            }
        }
    };

    if (BuiltInSpeechService.synthesis) {
        BuiltInSpeechService.synthesis.onvoiceschanged = () => {
            BuiltInSpeechService.voices = BuiltInSpeechService.synthesis.getVoices() || [];
        };
    }

    const UnifiedSpeechService = {
        async recognizeSpeech(options = {}) {
            const settings = getVoiceSettings();
            const support = BuiltInSpeechService.isSupported();
            
            const hasExternalSTT = !!(settings.sttApiUrl && settings.sttApiKey) || 
                                   !!(settings.voiceProvider && settings.thirdPartyVoiceUrl && settings.thirdPartyVoiceKey);
            
            const hasTransformers = TransformersWhisperService.isAvailable();
            
            if (settings.useTransformers && hasTransformers && options.audioBlob) {
                try {
                    const lang = (settings.sttLanguage || 'zh-TW').split('-')[0];
                    return await TransformersWhisperService.transcribe(options.audioBlob, lang);
                } catch (err) {
                    console.warn('Transformers.js STT 失敗，嘗試其他方式:', err);
                }
            }
            
            if (options.audioBlob && hasExternalSTT) {
                return await this.recognizeWithExternalAPI(options.audioBlob, settings);
            }
            
            if (support.stt && settings.useBuiltIn) {
                return await BuiltInSpeechService.startRecognition({
                    lang: settings.sttLanguage || 'zh-TW',
                    continuous: options.continuous || false,
                    interimResults: options.interimResults || false
                });
            }
            
            if (hasTransformers && options.audioBlob) {
                try {
                    const lang = (settings.sttLanguage || 'zh-TW').split('-')[0];
                    return await TransformersWhisperService.transcribe(options.audioBlob, lang);
                } catch (err) {
                    console.warn('Transformers.js STT 失敗:', err);
                }
            }
            
            if (hasExternalSTT && options.audioBlob) {
                return await this.recognizeWithExternalAPI(options.audioBlob, settings);
            }
            
            throw new Error('沒有可用的語音辨識服務');
        },
        
        async recognizeWithTransformers(audioBlob, settings) {
            const lang = (settings.sttLanguage || 'zh-TW').split('-')[0];
            return await TransformersWhisperService.transcribe(audioBlob, lang);
        },
        
        async recognizeWithExternalAPI(audioBlob, settings) {
            try {
                const formData = new FormData();
                formData.append('file', audioBlob, 'speech.webm');
                formData.append('model', settings.sttModel || 'whisper-1');
                if (settings.sttLanguage) {
                    formData.append('language', settings.sttLanguage);
                }
                
                const response = await fetch(settings.sttApiUrl, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${settings.sttApiKey}` },
                    body: formData
                });
                
                const result = await response.json();
                return result.text || null;
            } catch (err) {
                console.error('External STT Error:', err);
                return null;
            }
        },
        
        async translateText(text, targetLang) {
            const settings = getVoiceSettings();
            
            if (!settings.translateApiUrl || !settings.translateApiKey) {
                return null;
            }
            
            try {
                const response = await fetch(settings.translateApiUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${settings.translateApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        text: text,
                        target_lang: targetLang,
                        source_lang: settings.ttsLanguage || 'en'
                    })
                });
                
                if (!response.ok) return null;
                
                const result = await response.json();
                return result.translated_text || result.translation || result.text || null;
            } catch (err) {
                console.error('Translation Error:', err);
                return null;
            }
        },
        
        async speakText(text, options = {}) {
            const settings = getVoiceSettings();
            const support = BuiltInSpeechService.isSupported();
            
            const hasExternalTTS = !!(settings.ttsApiUrl && settings.ttsApiKey) ||
                                   !!(settings.voiceProvider && settings.thirdPartyVoiceUrl && settings.thirdPartyVoiceKey);
            
            const systemLang = localStorage.getItem('sxiphone_lang') || 'zh-TW';
            const ttsLang = settings.ttsLanguage || 'zh-TW';
            const needsTranslation = ttsLang !== systemLang && settings.enableTranslation !== false;
            
            let displayText = text;
            let translatedText = null;
            
            if (needsTranslation && settings.translateApiUrl) {
                translatedText = await this.translateText(text, systemLang);
                if (translatedText) {
                    displayText = translatedText;
                }
            }
            
            if (options.onDisplayText && displayText) {
                options.onDisplayText(displayText, translatedText !== null);
            }
            
            if (!settings.useBuiltIn && hasExternalTTS) {
                return await this.speakWithExternalAPI(text, settings);
            }
            
            if (support.tts && (settings.useBuiltIn || !hasExternalTTS)) {
                return await BuiltInSpeechService.speak(text, {
                    lang: ttsLang || settings.sttLanguage || 'zh-TW',
                    voice: settings.builtInVoice ? 
                           BuiltInSpeechService.getVoices().find(v => v.name === settings.builtInVoice) : 
                           null,
                    rate: settings.ttsSpeed || 1.0
                });
            }
            
            if (hasExternalTTS) {
                return await this.speakWithExternalAPI(text, settings);
            }
            
            throw new Error('沒有可用的語音合成服務');
        },
        
        async speakWithExternalAPI(text, settings) {
            try {
                const response = await fetch(settings.ttsApiUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${settings.ttsApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: settings.ttsModel || 'tts-1',
                        voice: settings.ttsVoice || 'alloy',
                        input: text,
                        speed: settings.ttsSpeed || 1.0
                    })
                });
                
                if (!response.ok) throw new Error(`TTS HTTP ${response.status}`);
                
                const audioBlob = await response.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);
                
                await new Promise((resolve, reject) => {
                    audio.onended = () => {
                        URL.revokeObjectURL(audioUrl);
                        resolve();
                    };
                    audio.onerror = () => {
                        URL.revokeObjectURL(audioUrl);
                        reject(new Error('Audio playback error'));
                    };
                    audio.play().catch(reject);
                });
            } catch (err) {
                console.error('External TTS Error:', err);
                throw err;
            }
        },
        
        stopAll() {
            BuiltInSpeechService.stopRecognition();
            BuiltInSpeechService.stopSpeaking();
        },
        
        getAvailableVoices() {
            return BuiltInSpeechService.getVoices();
        },
        
        getChineseVoices() {
            return BuiltInSpeechService.getChineseVoices();
        },
        
        isAvailable() {
            const support = BuiltInSpeechService.isSupported();
            const settings = getVoiceSettings();
            const hasExternal = !!(settings.sttApiUrl && settings.sttApiKey) || 
                               !!(settings.ttsApiUrl && settings.ttsApiKey);
            const hasTransformers = TransformersWhisperService.isAvailable();
            
            return {
                stt: support.stt || hasExternal || hasTransformers,
                tts: support.tts || hasExternal,
                builtInSTT: support.stt,
                builtInTTS: support.tts,
                transformersSTT: hasTransformers,
                external: hasExternal
            };
        },
        
        async initTransformers(onProgress) {
            return await TransformersWhisperService.initialize(onProgress);
        }
    };

    const checkVoiceSettingsReady = () => {
        const availability = UnifiedSpeechService.isAvailable();
        return availability.stt || availability.tts;
    };

    const CHAR_VIEWER_KEY = 'sx_char_viewer_mode';
    const CHAR_ACTIVE_KEY = 'sx_char_active_account';

    const appNames = {
        facebook: 'Facebook',
        'facebook-settings': 'Facebook 設定',
        instagram: 'Instagram',
        twitter: 'Twitter',
        weverse: 'Weverse',
        kakaopay: 'KakaoPay',
        weather: '天氣',
        music: '音樂',
        chrome: 'Chrome',
        album: '相簿',
        diary: '日記',
        notes: '備忘錄',
        settings: '設定'
    };

    let selectedEnvelopeStyle = 'default';
    let customEnvelopeImage = '';
    let currentDiaryContent = '';

    const openDiaryPanel = () => {
        if (diaryPanel) {
            diaryPanel.classList.add('active');
        }
        if (diaryTimeInput) {
            const settings = getDiarySettings();
            diaryTimeInput.value = settings.defaultTime;
        }
        if (diaryDateInput) {
            diaryDateInput.value = getTodayDateString();
        }
        if (diaryPreview) {
            diaryPreview.textContent = '';
        }
        currentDiaryContent = '';
        plusMenu?.classList.remove('open');
    };

    const closeDiaryPanel = () => {
        diaryPanel?.classList.remove('active');
    };

    const handleGenerateDiary = () => {
        const history = JSON.parse(localStorage.getItem('sx_chat_history') || '[]');
        const charName = charConfig?.name || getActiveConfig().name || 'AI 助理';
        const userName = userConfig?.name || localStorage.getItem('sx_user_name') || '我';
        
        currentDiaryContent = generateDiaryContent(history, charName, userName);
        
        if (diaryPreview) {
            const time = diaryTimeInput?.value || '22:00';
            const date = diaryDateInput?.value || getTodayDateString();
            diaryPreview.innerHTML = `<strong>${date} ${time}</strong>\n\n${currentDiaryContent}`;
        }
    };

    const handleSaveDiary = () => {
        if (!currentDiaryContent) {
            handleGenerateDiary();
        }
        
        const date = diaryDateInput?.value || getTodayDateString();
        const time = diaryTimeInput?.value || '22:00';
        
        const diaries = getDiaries();
        const existingIndex = diaries.findIndex(d => d.date === date);
        
        const diaryEntry = {
            id: `diary_${Date.now()}`,
            date,
            time,
            content: currentDiaryContent,
            charName: charConfig?.name || getActiveConfig().name || 'AI 助理',
            createdAt: Date.now()
        };
        
        if (existingIndex !== -1) {
            diaries[existingIndex] = diaryEntry;
        } else {
            diaries.unshift(diaryEntry);
        }
        
        saveDiaries(diaries);
        closeDiaryPanel();
        alert('日記已儲存！');
    };

    const openCheckPhonePanel = () => {
        if (checkPhonePanel) {
            checkPhonePanel.classList.add('active');
        }
        const charName = charConfig?.name || getActiveConfig().name || 'AI 助理';
        if (checkPhoneCharName) {
            checkPhoneCharName.textContent = `${charName} 的手機`;
        }
        plusMenu?.classList.remove('open');
    };

    const closeCheckPhonePanel = () => {
        checkPhonePanel?.classList.remove('active');
        closeCharAppViewer();
    };

    const openCharApp = (appId) => {
        if (!charAppViewer || !charAppFrame) return;
        
        const charName = charConfig?.name || getActiveConfig().name || 'AI 助理';
        const appName = appNames[appId] || appId;
        
        if (charAppTitle) {
            charAppTitle.textContent = `${charName} 的${appName}`;
        }
        
        localStorage.setItem(CHAR_VIEWER_KEY, '1');
        localStorage.setItem(CHAR_ACTIVE_KEY, charName);
        
        let appUrl;
        if (appId === 'facebook-settings') {
            appUrl = `../facebook-settings/facebook-settings.html?charView=1&charName=${encodeURIComponent(charName)}`;
        } else {
            appUrl = `../${appId}/${appId}.html?charView=1&charName=${encodeURIComponent(charName)}`;
        }
        charAppFrame.src = appUrl;
        
        charAppViewer.classList.add('active');
        checkPhonePanel?.classList.remove('active');
    };

    const closeCharAppViewer = () => {
        if (!charAppViewer) return;
        charAppViewer.classList.remove('active');
        if (charAppFrame) {
            charAppFrame.src = '';
        }
        localStorage.removeItem(CHAR_VIEWER_KEY);
    };

    const handlePhoneAppClick = (e) => {
        const appItem = e.target.closest('.phone-app-item');
        if (!appItem) return;
        
        const appId = appItem.dataset.app;
        if (appId) {
            openCharApp(appId);
        }
    };

    diaryCancelBtn?.addEventListener('click', closeDiaryPanel);
    diaryGenerateBtn?.addEventListener('click', handleSaveDiary);
    checkPhoneCloseBtn?.addEventListener('click', closeCheckPhonePanel);
    checkPhoneCloseHeader?.addEventListener('click', closeCheckPhonePanel);
    backToPhoneBtn?.addEventListener('click', () => {
        closeCharAppViewer();
        checkPhonePanel?.classList.add('active');
    });

    diaryPanel?.addEventListener('click', (e) => {
        if (e.target === diaryPanel) closeDiaryPanel();
    });

    checkPhonePanel?.addEventListener('click', (e) => {
        if (e.target === checkPhonePanel) closeCheckPhonePanel();
    });

    checkPhoneApps?.addEventListener('click', handlePhoneAppClick);

    const openInnerVoicePanel = () => {
        if (innerVoicePanel) {
            innerVoicePanel.classList.add('active');
        }
        plusMenu?.classList.remove('open');
        generateInnerVoice();
    };

    const closeInnerVoicePanel = () => {
        innerVoicePanel?.classList.remove('active');
    };

    const assembleInnerVoicePrompt = () => {
        const currentChars = JSON.parse(localStorage.getItem('sx_masks') || '[]');
        const activeChar = currentChars[0] || {};
        const charName = activeChar.name || 'AI 助理';
        const personality = activeChar.personality || '友善';
        const background = activeChar.background || '';
        
        const userName = localStorage.getItem('sx_user_name') || 'User';
        const userBio = document.getElementById('set-user-background')?.value || '';
        
        const history = JSON.parse(localStorage.getItem('sx_chat_history') || '[]');
        const recentHistory = history.slice(-10);
        const historyText = recentHistory.map(m => {
            const role = m.role === 'user' ? userName : charName;
            const content = String(m.content || '').replace(/<[^>]*>/g, '').substring(0, 200);
            return `${role}: ${content}`;
        }).join('\n');
        
        const lastCharMsg = [...history].reverse().find(m => m.role === 'assistant');
        const lastCharContent = lastCharMsg ? String(lastCharMsg.content || '').replace(/<[^>]*>/g, '') : '';
        
        const worldbookData = getWorldbookData();
        const dynamicWI = WorldInfoEngine.scanAndGetContent(lastCharContent, worldbookData);
        
        return `# 角色設定
- 名字: ${charName}
- 性格: ${personality}
- 背景: ${background}

# 用戶資訊
- 名字: ${userName}
- 背景: ${userBio}

# 世界書相關內容
${dynamicWI || '無'}

# 最近對話記錄
${historyText || '無'}

# 角色最後說的話
${lastCharContent || '（尚未有對話）'}

# 任務說明
請以第一人稱視角，撰寫 ${charName} 在說出最後那句話時的內心獨白。

要求：
1. 使用第一人稱「我」來敘述
2. 字數不少於 300 字
3. 要展現角色內心真實的想法和情感
4. 可以包含對 ${userName} 的觀察和感受
5. 要符合角色的性格設定
6. 可以透露一些表面話語背後的深層想法
7. 語言風格要與角色性格一致

請直接開始內心獨白，不需要任何開頭或說明：`;
    };

    const generateInnerVoice = async () => {
        if (!innerVoiceLoading || !innerVoiceContent) return;
        
        innerVoiceLoading.classList.add('active');
        innerVoiceContent.innerHTML = '<div class="inner-voice-empty">正在生成...</div>';
        
        try {
            const prompt = assembleInnerVoicePrompt();
            const payload = [
                { role: 'system', content: '你是一位擅長描寫角色內心戲的作家。請用細膩的筆觸，以第一人稱視角描寫角色的內心獨白。' },
                { role: 'user', content: prompt }
            ];
            
            const apis = JSON.parse(localStorage.getItem('api_configs') || '[]');
            const activeIndex = parseInt(localStorage.getItem('sx_active_api'), 10);
            const validIndex = (!isNaN(activeIndex) && activeIndex >= 0 && activeIndex < apis.length) ? activeIndex : 0;
            const config = apis[validIndex] || apis[0];
            
            if (!config || !config.url) {
                innerVoiceContent.innerHTML = '<div class="inner-voice-empty">請先設定 API</div>';
                innerVoiceLoading.classList.remove('active');
                return;
            }
            
            const apiType = config.type || 'openai';
            let innerVoiceText;
            
            // Gemini 原生 API 格式
            if (apiType === 'gemini') {
                const model = config.model || 'gemini-1.5-flash';
                const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.key}`;
                
                const contents = [{
                    role: 'user',
                    parts: [{ text: `你是一位擅長描寫角色內心戲的作家。請用細膩的筆觸，以第一人稱視角描寫角色的內心獨白。\n\n${prompt}` }]
                }];
                
                const response = await fetch(targetUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents, generationConfig: { temperature: 0.9, maxOutputTokens: 800 } })
                });
                
                const data = await response.json();
                if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
                innerVoiceText = data.candidates?.[0]?.content?.parts?.[0]?.text || '生成失敗';
            } else {
                // OpenAI 相容格式或自訂端點
                let targetUrl;
                if (apiType === 'custom') {
                    targetUrl = config.url;
                } else {
                    targetUrl = config.url.endsWith('/chat/completions') 
                        ? config.url 
                        : config.url.replace(/\/$/, '') + '/chat/completions';
                }
                
                const headers = {
                    'Content-Type': 'application/json'
                };
                if (config.key) headers['Authorization'] = `Bearer ${config.key}`;
                
                const response = await fetch(targetUrl, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        model: config.model || 'gpt-3.5-turbo',
                        messages: payload,
                        temperature: 0.9,
                        max_tokens: 800
                    })
                });
                
                const data = await response.json();
                if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
                innerVoiceText = data.choices?.[0]?.message?.content || '生成失敗';
            }
            
            innerVoiceContent.innerHTML = `<div class="inner-voice-text">${innerVoiceText}</div>`;
            
            const currentChars = JSON.parse(localStorage.getItem('sx_masks') || '[]');
            const activeChar = currentChars[0] || {};
            const charName = activeChar.name || 'AI 助理';
            saveInnerVoiceToHistory(innerVoiceText, charName);
            
            saveInnerVoiceToShortTermMemory(innerVoiceText, charName);
            
        } catch (err) {
            innerVoiceContent.innerHTML = `<div class="inner-voice-empty">生成失敗：${err.message}</div>`;
        } finally {
            innerVoiceLoading.classList.remove('active');
        }
    };

    innerVoiceCloseBtn?.addEventListener('click', closeInnerVoicePanel);
    innerVoiceRegenBtn?.addEventListener('click', generateInnerVoice);
    innerVoiceHistoryBtn?.addEventListener('click', openInnerVoiceHistoryPanel);
    innerVoiceHistoryCloseBtn?.addEventListener('click', closeInnerVoiceHistoryPanel);

    innerVoiceHistoryPanel?.addEventListener('click', (e) => {
        if (e.target === innerVoiceHistoryPanel) closeInnerVoiceHistoryPanel();
    });

    innerVoicePanel?.addEventListener('click', (e) => {
        if (e.target === innerVoicePanel) closeInnerVoicePanel();
    });

    const openVoiceCallPanel = () => {
        if (!voiceCallPanel) return;
        voiceCallPanel.classList.add('active');
        plusMenu?.classList.remove('open');
        
        const isReady = checkVoiceSettingsReady();
        if (voiceCallSettingsHint) {
            voiceCallSettingsHint.classList.toggle('active', !isReady);
        }
        if (voiceCallStartBtn) {
            voiceCallStartBtn.disabled = !isReady;
        }
        
        resetCallUI();
    };

    const closeVoiceCallPanel = () => {
        if (callState !== 'idle') {
            endCall();
        }
        voiceCallPanel?.classList.remove('active');
    };

    const voiceMessagePanel = document.getElementById('voice-message-panel');
    const voiceRecordBtn = document.getElementById('voice-record-btn');
    const voiceRecordStatus = document.getElementById('voice-record-status');
    const voiceRecordHint = document.getElementById('voice-record-hint');
    const recordTimeEl = document.getElementById('record-time');
    const voiceRecordPreview = document.getElementById('voice-record-preview');
    const previewTranscriptText = document.getElementById('preview-transcript-text');
    const previewPlayBtn = document.getElementById('preview-play-btn');
    const previewDurationEl = document.getElementById('preview-duration');
    const voiceCancelBtn = document.getElementById('voice-cancel-btn');
    const voiceSendBtn = document.getElementById('voice-send-btn');
    const voiceMessageCloseBtn = document.getElementById('voice-message-close');
    const voiceMsgGotoSettings = document.getElementById('voice-msg-goto-settings');
    const voiceMessageSettingsHint = document.getElementById('voice-message-settings-hint');
    const textToVoiceText = document.getElementById('text-to-voice-text');
    const showTextBubble = document.getElementById('show-text-bubble');
    const textVoiceCancelBtn = document.getElementById('text-voice-cancel-btn');
    const textVoiceSendBtn = document.getElementById('text-voice-send-btn');

    let voiceMsgRecorder = null;
    let voiceMsgChunks = [];
    let voiceMsgStartTime = 0;
    let voiceMsgTimerInterval = null;
    let voiceMsgAudioBlob = null;
    let voiceMsgTranscript = '';
    let voiceMsgPreviewAudio = null;

    const openVoiceMessagePanel = () => {
        if (!voiceMessagePanel) return;
        voiceMessagePanel.classList.add('active');
        plusMenu?.classList.remove('open');
        
        const availability = UnifiedSpeechService.isAvailable();
        const settings = getVoiceSettings();
        
        const hasAnyService = availability.stt || availability.tts;
        
        if (voiceMessageSettingsHint) {
            voiceMessageSettingsHint.classList.toggle('active', !hasAnyService);
            
            if (!hasAnyService) {
                const hintSpan = voiceMessageSettingsHint.querySelector('span');
                if (hintSpan) {
                    hintSpan.textContent = '此瀏覽器不支援語音功能，請使用 Chrome/Edge 或設定外部 API';
                }
            } else if (settings.useTransformers && availability.transformersSTT) {
                const hintSpan = voiceMessageSettingsHint.querySelector('span');
                if (hintSpan) {
                    hintSpan.textContent = '使用 Transformers.js Whisper 本機運算（首次需下載模型）';
                    voiceMessageSettingsHint.classList.add('active');
                    voiceMessageSettingsHint.style.background = 'rgba(125, 231, 255, 0.15)';
                    voiceMessageSettingsHint.style.borderColor = 'rgba(125, 231, 255, 0.3)';
                }
            } else if (availability.builtInSTT || availability.builtInTTS) {
                const hintSpan = voiceMessageSettingsHint.querySelector('span');
                if (hintSpan && !availability.external) {
                    hintSpan.textContent = '使用瀏覽器內建語音功能（可在設定中切換）';
                    voiceMessageSettingsHint.classList.add('active');
                    voiceMessageSettingsHint.style.background = 'rgba(125, 231, 255, 0.15)';
                    voiceMessageSettingsHint.style.borderColor = 'rgba(125, 231, 255, 0.3)';
                }
            }
        }
        
        if (voiceRecordBtn) {
            voiceRecordBtn.disabled = !availability.stt;
        }
        
        resetVoiceMessagePanel();
    };

    const closeVoiceMessagePanel = () => {
        stopVoiceMsgRecording();
        voiceMessagePanel?.classList.remove('active');
        voiceMessagePanel?.classList.remove('recording');
        resetVoiceMessagePanel();
    };

    const resetVoiceMessagePanel = () => {
        voiceMsgRecorder = null;
        voiceMsgChunks = [];
        voiceMsgStartTime = 0;
        voiceMsgAudioBlob = null;
        voiceMsgTranscript = '';
        
        if (voiceMsgTimerInterval) {
            clearInterval(voiceMsgTimerInterval);
            voiceMsgTimerInterval = null;
        }
        
        if (voiceMsgPreviewAudio) {
            voiceMsgPreviewAudio.pause();
            voiceMsgPreviewAudio = null;
        }
        
        if (recordTimeEl) recordTimeEl.textContent = '00:00';
        if (voiceRecordHint) voiceRecordHint.textContent = '點擊麥克風開始錄音';
        if (voiceRecordBtn) {
            voiceRecordBtn.classList.remove('recording');
            voiceRecordBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        }
        if (voiceRecordPreview) voiceRecordPreview.classList.add('hidden');
        if (previewTranscriptText) previewTranscriptText.textContent = '';
        if (previewDurationEl) previewDurationEl.textContent = '00:00';
        if (textToVoiceText) textToVoiceText.value = '';
        
        voiceMessagePanel?.classList.remove('recording');
    };

    const startVoiceMsgRecording = async () => {
        const availability = UnifiedSpeechService.isAvailable();
        
        if (!availability.stt) {
            alert('沒有可用的語音辨識服務。請在 Settings 啟用 Transformers.js 或設定 STT API。');
            return;
        }

        const support = BuiltInSpeechService.isSupported();
        const settings = getVoiceSettings();
        
        if (settings.useTransformers && availability.transformersSTT) {
            startMediaRecorderVoice(true);
        } else if (support.stt && settings.useBuiltIn) {
            startBuiltInVoiceRecognition();
        } else if (availability.transformersSTT) {
            startMediaRecorderVoice(true);
        } else {
            startMediaRecorderVoice(false);
        }
    };

    const startBuiltInVoiceRecognition = async () => {
        voiceMessagePanel?.classList.add('recording');
        if (voiceRecordBtn) {
            voiceRecordBtn.classList.add('recording');
            voiceRecordBtn.innerHTML = '<i class="fas fa-stop"></i>';
        }
        if (voiceRecordHint) voiceRecordHint.textContent = '請說話...點擊停止';
        
        voiceMsgStartTime = Date.now();
        
        voiceMsgTimerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - voiceMsgStartTime) / 1000);
            if (recordTimeEl) {
                recordTimeEl.textContent = formatTime(elapsed);
            }
        }, 1000);
        
        try {
            const transcript = await BuiltInSpeechService.startRecognition({
                lang: getVoiceSettings().sttLanguage || 'zh-TW',
                continuous: false
            });
            
            stopBuiltInVoiceRecognition();
            
            const duration = Math.floor((Date.now() - voiceMsgStartTime) / 1000);
            voiceMsgTranscript = transcript || '';
            voiceMsgAudioBlob = null;
            
            showVoiceMsgPreview(duration, voiceMsgTranscript);
            
        } catch (err) {
            stopBuiltInVoiceRecognition();
            alert('語音辨識失敗：' + err.message);
        }
    };

    const stopBuiltInVoiceRecognition = () => {
        BuiltInSpeechService.stopRecognition();
        
        if (voiceMsgTimerInterval) {
            clearInterval(voiceMsgTimerInterval);
            voiceMsgTimerInterval = null;
        }
        
        voiceMessagePanel?.classList.remove('recording');
        if (voiceRecordBtn) {
            voiceRecordBtn.classList.remove('recording');
            voiceRecordBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        }
        if (voiceRecordHint) voiceRecordHint.textContent = '處理中...';
    };

    const startMediaRecorderVoice = async (useTransformers = false) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            voiceMsgChunks = [];
            voiceMsgStartTime = Date.now();
            
            const options = { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4' };
            voiceMsgRecorder = new MediaRecorder(stream, options);
            
            voiceMsgRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) voiceMsgChunks.push(e.data);
            };
            
            voiceMsgRecorder.onstop = async () => {
                stream.getTracks().forEach(track => track.stop());
                
                voiceMsgAudioBlob = new Blob(voiceMsgChunks, { type: options.mimeType });
                const duration = Math.floor((Date.now() - voiceMsgStartTime) / 1000);
                
                if (voiceRecordHint) voiceRecordHint.textContent = '辨識中...';
                
                try {
                    const transcript = await UnifiedSpeechService.recognizeSpeech({ audioBlob: voiceMsgAudioBlob });
                    voiceMsgTranscript = transcript || '';
                } catch (err) {
                    console.error('STT Error:', err);
                    voiceMsgTranscript = '';
                }
                
                showVoiceMsgPreview(duration, voiceMsgTranscript);
            };
            
            voiceMsgRecorder.start();
            
            voiceMessagePanel?.classList.add('recording');
            if (voiceRecordBtn) {
                voiceRecordBtn.classList.add('recording');
                voiceRecordBtn.innerHTML = '<i class="fas fa-stop"></i>';
            }
            if (voiceRecordHint) {
                voiceRecordHint.textContent = useTransformers ? '錄音中（將使用 Whisper 辨識）...' : '錄音中...點擊停止';
            }
            
            voiceMsgTimerInterval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - voiceMsgStartTime) / 1000);
                if (recordTimeEl) {
                    recordTimeEl.textContent = formatTime(elapsed);
                }
            }, 1000);
            
        } catch (err) {
            alert('無法啟動麥克風：' + err.message);
        }
    };

    const stopVoiceMsgRecording = () => {
        const support = BuiltInSpeechService.isSupported();
        const settings = getVoiceSettings();
        
        if (support.stt && (settings.useBuiltIn || !(settings.sttApiUrl && settings.sttApiKey))) {
            stopBuiltInVoiceRecognition();
            return;
        }
        
        if (voiceMsgRecorder && voiceMsgRecorder.state === 'recording') {
            voiceMsgRecorder.stop();
        }
        
        if (voiceMsgTimerInterval) {
            clearInterval(voiceMsgTimerInterval);
            voiceMsgTimerInterval = null;
        }
        
        voiceMessagePanel?.classList.remove('recording');
        if (voiceRecordBtn) {
            voiceRecordBtn.classList.remove('recording');
            voiceRecordBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        }
        if (voiceRecordHint) voiceRecordHint.textContent = '處理中...';
    };

    const sendVoiceMsgToSTT = async (audioBlob, settings) => {
        try {
            const formData = new FormData();
            formData.append('file', audioBlob, 'voice_message.webm');
            formData.append('model', settings.sttModel || 'whisper-1');
            if (settings.sttLanguage) {
                formData.append('language', settings.sttLanguage);
            }
            
            const response = await fetch(settings.sttApiUrl, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${settings.sttApiKey}` },
                body: formData
            });
            
            const result = await response.json();
            return result.text || null;
        } catch (err) {
            console.error('STT Error:', err);
            return null;
        }
    };

    const showVoiceMsgPreview = (duration, transcript) => {
        if (voiceRecordPreview) voiceRecordPreview.classList.remove('hidden');
        if (previewDurationEl) previewDurationEl.textContent = formatTime(duration);
        if (previewTranscriptText) {
            previewTranscriptText.textContent = transcript || '（無法辨識語音內容）';
        }
        if (voiceRecordHint) voiceRecordHint.textContent = '錄音完成';
    };

    const playVoiceMsgPreview = () => {
        if (!voiceMsgAudioBlob) return;
        
        if (voiceMsgPreviewAudio) {
            voiceMsgPreviewAudio.pause();
            voiceMsgPreviewAudio = null;
            if (previewPlayBtn) previewPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
            return;
        }
        
        const url = URL.createObjectURL(voiceMsgAudioBlob);
        voiceMsgPreviewAudio = new Audio(url);
        
        voiceMsgPreviewAudio.onended = () => {
            URL.revokeObjectURL(url);
            voiceMsgPreviewAudio = null;
            if (previewPlayBtn) previewPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
        };
        
        voiceMsgPreviewAudio.play();
        if (previewPlayBtn) previewPlayBtn.innerHTML = '<i class="fas fa-pause"></i>';
    };

    const sendVoiceMessage = async () => {
        const duration = Math.floor((Date.now() - voiceMsgStartTime) / 1000);
        const transcript = voiceMsgTranscript;
        
        let audioDataUrl = null;
        if (voiceMsgAudioBlob) {
            audioDataUrl = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(voiceMsgAudioBlob);
            });
        }
        
        const voiceBubbleHtml = `
            <div class="voice-bubble" ${audioDataUrl ? `data-audio="${audioDataUrl}"` : ''} data-duration="${duration}" data-transcript="${transcript || ''}">
                <button class="voice-bubble-play" onclick="playVoiceBubble(this)"><i class="fas fa-play"></i></button>
                <div class="voice-bubble-info">
                    <div class="voice-bubble-duration">${formatTime(duration)}</div>
                    ${transcript ? `<div class="voice-bubble-text">${transcript}</div>` : ''}
                </div>
            </div>
        `;
        
        appendMsg('mine', voiceBubbleHtml);
        
        const history = JSON.parse(localStorage.getItem('sx_chat_history') || '[]');
        const contentText = transcript || '[語音訊息]';
        history.push({ role: 'user', content: contentText });
        localStorage.setItem('sx_chat_history', JSON.stringify(history));
        
        const activeId = getActiveChatId();
        if (activeId) {
            const sessions = loadChatSessions();
            const target = sessions.find(s => s.id === activeId);
            if (target) {
                target.history = history;
                saveChatSessions(sessions);
            }
        }
        
        closeVoiceMessagePanel();
        
        const charReply = await getAIReplyForVoice(contentText);
        if (charReply) {
            appendMsg('other', charReply);
            const updatedHistory = JSON.parse(localStorage.getItem('sx_chat_history') || '[]');
            updatedHistory.push({ role: 'assistant', content: charReply });
            localStorage.setItem('sx_chat_history', JSON.stringify(updatedHistory));
            if (activeId) {
                const sessions = loadChatSessions();
                const target = sessions.find(s => s.id === activeId);
                if (target) {
                    target.history = updatedHistory;
                    saveChatSessions(sessions);
                }
            }
        }
    };

    const sendTextToVoiceMessage = async () => {
        const text = textToVoiceText?.value?.trim();
        if (!text) return;
        
        const settings = getVoiceSettings();
        const showText = showTextBubble?.checked;
        const availability = UnifiedSpeechService.isAvailable();
        
        let audioDataUrl = null;
        let duration = Math.ceil(text.length * 0.15);
        
        if (availability.tts && !settings.useBuiltIn) {
            try {
                const response = await fetch(settings.ttsApiUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${settings.ttsApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: settings.ttsModel || 'tts-1',
                        voice: settings.ttsVoice || 'alloy',
                        input: text,
                        speed: settings.ttsSpeed || 1.0
                    })
                });
                
                if (response.ok) {
                    const audioBlob = await response.blob();
                    audioDataUrl = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.readAsDataURL(audioBlob);
                    });
                }
            } catch (err) {
                console.warn('External TTS Error:', err);
            }
        }
        
        const voiceBubbleHtml = `
            <div class="voice-bubble" ${audioDataUrl ? `data-audio="${audioDataUrl}"` : ''} data-duration="${duration}" data-transcript="${text}" data-use-builtin="${settings.useBuiltIn && availability.builtInTTS}">
                <button class="voice-bubble-play" onclick="playVoiceBubble(this)"><i class="fas fa-play"></i></button>
                <div class="voice-bubble-info">
                    <div class="voice-bubble-duration">${formatTime(duration)}</div>
                    ${showText ? `<div class="voice-bubble-text">${text}</div>` : ''}
                </div>
            </div>
        `;
        
        appendMsg('mine', voiceBubbleHtml);
        
        const history = JSON.parse(localStorage.getItem('sx_chat_history') || '[]');
        history.push({ role: 'user', content: text });
        localStorage.setItem('sx_chat_history', JSON.stringify(history));
        
        const activeId = getActiveChatId();
        if (activeId) {
            const sessions = loadChatSessions();
            const target = sessions.find(s => s.id === activeId);
            if (target) {
                target.history = history;
                saveChatSessions(sessions);
            }
        }
        
        closeVoiceMessagePanel();
        
        const charReply = await getAIReplyForVoice(text);
        if (charReply) {
            appendMsg('other', charReply);
            const updatedHistory = JSON.parse(localStorage.getItem('sx_chat_history') || '[]');
            updatedHistory.push({ role: 'assistant', content: charReply });
            localStorage.setItem('sx_chat_history', JSON.stringify(updatedHistory));
            if (activeId) {
                const sessions = loadChatSessions();
                const target = sessions.find(s => s.id === activeId);
                if (target) {
                    target.history = updatedHistory;
                    saveChatSessions(sessions);
                }
            }
        }
    };

    const getAIReplyForVoice = async (userInput) => {
        try {
            const systemPrompt = await ChatEngine.assembleSystemPrompt(userInput);
            const payload = [
                { role: 'system', content: systemPrompt },
                ...ChatEngine.getHistorySlice()
            ];
            return await callAIAPI(payload);
        } catch (err) {
            console.warn('AI Reply Error:', err);
            return null;
        }
    };

    window.playVoiceBubble = async (btn) => {
        const bubble = btn.closest('.voice-bubble');
        if (!bubble) return;
        
        const audioUrl = bubble.dataset.audio;
        const transcript = bubble.dataset.transcript || '';
        const useBuiltIn = bubble.dataset.useBuiltin === 'true';
        
        if (bubble.dataset.playing === 'true') {
            if (bubble._audio) {
                bubble._audio.pause();
                bubble._audio.currentTime = 0;
            }
            BuiltInSpeechService.stopSpeaking();
            bubble.dataset.playing = 'false';
            btn.innerHTML = '<i class="fas fa-play"></i>';
            return;
        }
        
        if (audioUrl) {
            const audio = new Audio(audioUrl);
            bubble._audio = audio;
            bubble.dataset.playing = 'true';
            btn.innerHTML = '<i class="fas fa-pause"></i>';
            
            audio.onended = () => {
                bubble.dataset.playing = 'false';
                btn.innerHTML = '<i class="fas fa-play"></i>';
            };
            
            audio.play().catch(err => {
                console.error('Audio play error:', err);
                bubble.dataset.playing = 'false';
                btn.innerHTML = '<i class="fas fa-play"></i>';
            });
        } else if (useBuiltIn && transcript) {
            bubble.dataset.playing = 'true';
            btn.innerHTML = '<i class="fas fa-pause"></i>';
            
            try {
                await BuiltInSpeechService.speak(transcript);
            } catch (err) {
                console.error('Built-in TTS error:', err);
            }
            
            bubble.dataset.playing = 'false';
            btn.innerHTML = '<i class="fas fa-play"></i>';
        } else if (transcript) {
            bubble.dataset.playing = 'true';
            btn.innerHTML = '<i class="fas fa-pause"></i>';
            
            try {
                await UnifiedSpeechService.speakText(transcript);
            } catch (err) {
                console.error('TTS error:', err);
            }
            
            bubble.dataset.playing = 'false';
            btn.innerHTML = '<i class="fas fa-play"></i>';
        } else {
            alert('此語音訊息無法播放');
        }
    };

    voiceRecordBtn?.addEventListener('click', () => {
        if (voiceMsgRecorder && voiceMsgRecorder.state === 'recording') {
            stopVoiceMsgRecording();
        } else {
            startVoiceMsgRecording();
        }
    });

    previewPlayBtn?.addEventListener('click', playVoiceMsgPreview);
    voiceCancelBtn?.addEventListener('click', resetVoiceMessagePanel);
    voiceSendBtn?.addEventListener('click', sendVoiceMessage);
    voiceMessageCloseBtn?.addEventListener('click', closeVoiceMessagePanel);
    textVoiceCancelBtn?.addEventListener('click', closeVoiceMessagePanel);
    textVoiceSendBtn?.addEventListener('click', sendTextToVoiceMessage);

    voiceMsgGotoSettings?.addEventListener('click', () => {
        closeVoiceMessagePanel();
        window.parent?.postMessage({ type: 'openApp', appId: 'settings' }, '*');
    });

    voiceMessagePanel?.addEventListener('click', (e) => {
        if (e.target === voiceMessagePanel) {
            closeVoiceMessagePanel();
        }
    });

    document.querySelectorAll('.voice-msg-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.voice-msg-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.voice-msg-panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            const panelId = tab.dataset.tab;
            document.getElementById(panelId)?.classList.add('active');
        });
    });

    const resetCallUI = () => {
        callState = 'idle';
        callSeconds = 0;
        if (callTimer) callTimer.textContent = '00:00';
        if (callStatusText) callStatusText.textContent = '準備中...';
        if (callStatusIcon) {
            callStatusIcon.className = 'call-status-icon';
            callStatusIcon.innerHTML = '<i class="fas fa-phone"></i>';
        }
        if (voiceCallVisualizer) voiceCallVisualizer.classList.remove('active');
        if (voiceCallStartBtn) voiceCallStartBtn.classList.remove('hidden');
        if (voiceCallEndBtn) voiceCallEndBtn.classList.add('hidden');
        if (voiceCallTranscript) {
            voiceCallTranscript.innerHTML = '<div class="transcript-empty">通話內容將顯示在這裡</div>';
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const startCall = async () => {
        const settings = getVoiceSettings();
        if (!settings.sttApiUrl || !settings.sttApiKey || !settings.ttsApiUrl || !settings.ttsApiKey) {
            alert('請先在 Settings 設定 STT/TTS 服務');
            return;
        }

        callState = 'calling';
        callStartTime = Date.now();
        callTranscriptData = [];
        callTtsBlobs = [];
        if (callStatusText) callStatusText.textContent = '正在連接...';
        if (callStatusIcon) {
            callStatusIcon.className = 'call-status-icon calling';
            callStatusIcon.innerHTML = '<i class="fas fa-phone"></i>';
        }
        if (voiceCallStartBtn) voiceCallStartBtn.classList.add('hidden');
        if (voiceCallEndBtn) voiceCallEndBtn.classList.remove('hidden');

        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(mediaStream);
            source.connect(analyser);
            analyser.fftSize = 256;

            callState = 'in-call';
            if (callStatusText) callStatusText.textContent = '通話中';
            if (callStatusIcon) {
                callStatusIcon.className = 'call-status-icon in-call';
                callStatusIcon.innerHTML = '<i class="fas fa-phone-alt"></i>';
            }
            if (voiceCallVisualizer) voiceCallVisualizer.classList.add('active');

            callTimerInterval = setInterval(() => {
                callSeconds++;
                if (callTimer) callTimer.textContent = formatTime(callSeconds);
            }, 1000);

            startListeningLoop();

        } catch (err) {
            alert('無法啟動麥克風：' + err.message);
            resetCallUI();
        }
    };

    const startListeningLoop = async () => {
        if (callState !== 'in-call' || !mediaStream) return;

        const settings = getVoiceSettings();
        const audioChunks = [];
        const recorder = new MediaRecorder(mediaStream);
        
        recorder.ondataavailable = (e) => audioChunks.push(e.data);
        
        recorder.onstop = async () => {
            if (callState !== 'in-call') return;
            
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const userText = await sendToSTT(audioBlob, settings);
            
            if (userText && userText.trim()) {
                addTranscript('user', userText);
                await processUserSpeech(userText);
            }

            if (callState === 'in-call') {
                setTimeout(() => startListeningLoop(), 300);
            }
        };

        recorder.start();
        setTimeout(() => {
            if (recorder.state === 'recording') {
                recorder.stop();
            }
        }, 3000);
    };

    const sendToSTT = async (audioBlob, settings) => {
        if (settings.voiceProvider && settings.thirdPartyVoiceUrl && settings.thirdPartyVoiceKey) {
            return await sendToThirdPartySTT(audioBlob, settings);
        }
        return await sendToBasicSTT(audioBlob, settings);
    };

    const sendToBasicSTT = async (audioBlob, settings) => {
        if (!settings.sttApiUrl || !settings.sttApiKey) return null;
        
        const formData = new FormData();
        formData.append('file', audioBlob, 'speech.webm');
        formData.append('model', settings.sttModel || 'whisper-1');
        if (settings.sttLanguage) {
            formData.append('language', settings.sttLanguage);
        }

        try {
            const response = await fetch(settings.sttApiUrl, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${settings.sttApiKey}` },
                body: formData
            });
            const result = await response.json();
            return result.text || null;
        } catch (err) {
            console.error('STT Error:', err);
            return null;
        }
    };

    const sendToThirdPartySTT = async (audioBlob, settings) => {
        const baseUrl = settings.thirdPartyVoiceUrl.replace(/\/$/, '');
        const sttPath = settings.thirdPartySttPath || '/audio/transcriptions';
        let url = baseUrl + sttPath;

        const formData = new FormData();
        formData.append('file', audioBlob, 'speech.webm');

        const headers = { 'Authorization': `Bearer ${settings.thirdPartyVoiceKey}` };

        if (settings.voiceProvider === 'minimax' && settings.thirdPartyGroupId) {
            url = `${baseUrl}/audio/transcriptions?GroupId=${settings.thirdPartyGroupId}`;
            formData.append('model', settings.sttModel || 'speech-01');
        } else if (settings.voiceProvider === 'huggingface') {
            formData.delete('file');
            formData.append('audio', audioBlob, 'speech.webm');
        } else {
            formData.append('model', settings.sttModel || 'whisper-1');
            if (settings.sttLanguage) {
                formData.append('language', settings.sttLanguage);
            }
        }

        try {
            const response = await fetch(url, { method: 'POST', headers, body: formData });
            const result = await response.json();
            return result.text || result.transcription || result.result || null;
        } catch (err) {
            console.error('Third-party STT Error:', err);
            return null;
        }
    };

    const processUserSpeech = async (text) => {
        if (callState !== 'in-call') return;

        const history = JSON.parse(localStorage.getItem('sx_chat_history') || '[]');
        history.push({ role: 'user', content: text });
        localStorage.setItem('sx_chat_history', JSON.stringify(history));

        const settings = getVoiceSettings();
        const delay = (settings.voiceThinkDelay || 1.5) * 1000;
        
        await new Promise(resolve => setTimeout(resolve, delay));

        const apis = JSON.parse(localStorage.getItem('api_configs') || '[]');
        const activeIndex = parseInt(localStorage.getItem('sx_active_api'), 10);
        const validIndex = (!isNaN(activeIndex) && activeIndex >= 0 && activeIndex < apis.length) ? activeIndex : 0;
        const config = apis[validIndex] || apis[0];
        
        if (!config || !config.url) {
            addTranscript('char', '(未設定 API)');
            return;
        }

        const apiType = config.type || 'openai';
        const currentChars = JSON.parse(localStorage.getItem('sx_masks') || '[]');
        const activeChar = currentChars[0] || {};
        const charName = activeChar.name || 'AI 助理';
        const systemPrompt = await ChatEngine.assembleSystemPrompt(text);

        const payload = [
            { role: 'system', content: systemPrompt },
            ...ChatEngine.getHistorySlice()
        ];

        try {
            let reply;
            
            // Gemini 原生 API 格式
            if (apiType === 'gemini') {
                const model = config.model || 'gemini-1.5-flash';
                const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.key}`;
                
                // 轉換為 Gemini 格式
                const contents = [];
                let systemInstruction = '';
                
                for (const msg of payload) {
                    if (msg.role === 'system') {
                        systemInstruction = msg.content;
                    } else {
                        contents.push({
                            role: msg.role === 'assistant' ? 'model' : 'user',
                            parts: [{ text: msg.content }]
                        });
                    }
                }
                
                const geminiPayload = {
                    contents,
                    generationConfig: { temperature: 0.8, maxOutputTokens: 4096 }
                };
                
                if (systemInstruction) {
                    geminiPayload.systemInstruction = { parts: [{ text: systemInstruction }] };
                }
                
                const response = await fetch(targetUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(geminiPayload)
                });
                
                const data = await response.json();
                if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
                reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '...';
            } else {
                // OpenAI 相容格式或自訂端點
                let targetUrl;
                if (apiType === 'custom') {
                    targetUrl = config.url;
                } else {
                    targetUrl = config.url.endsWith('/chat/completions') 
                        ? config.url 
                        : config.url.replace(/\/$/, '') + '/chat/completions';
                }

                const headers = {
                    'Content-Type': 'application/json'
                };
                if (config.key) headers['Authorization'] = `Bearer ${config.key}`;

                const response = await fetch(targetUrl, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        model: config.model || 'gpt-3.5-turbo',
                        messages: payload,
                        temperature: 0.8
                    })
                });

                const data = await response.json();
                if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
                reply = data.choices?.[0]?.message?.content || '...';
            }
            
            history.push({ role: 'assistant', content: reply });
            localStorage.setItem('sx_chat_history', JSON.stringify(history));

            addTranscript('char', reply);

            if (settings.voiceAutoTts !== false) {
                await speakText(reply, settings);
            }

        } catch (err) {
            addTranscript('char', `(錯誤: ${err.message})`);
        }
    };

    const speakText = async (text, settings) => {
        if (settings.voiceProvider && settings.thirdPartyVoiceUrl && settings.thirdPartyVoiceKey) {
            return await speakTextThirdParty(text, settings);
        }
        return await speakTextBasic(text, settings);
    };

    const speakTextBasic = async (text, settings) => {
        if (!settings.ttsApiUrl || !settings.ttsApiKey) return;

        try {
            const response = await fetch(settings.ttsApiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${settings.ttsApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: settings.ttsModel || 'tts-1',
                    voice: settings.ttsVoice || 'alloy',
                    input: text,
                    speed: settings.ttsSpeed || 1.0
                })
            });

            if (!response.ok) throw new Error('TTS request failed');

            const audioBlob = await response.blob();
            callTtsBlobs.push(audioBlob);
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);

            audio.onended = () => URL.revokeObjectURL(audioUrl);
            await audio.play();

        } catch (err) {
            console.error('TTS Error:', err);
        }
    };

    const speakTextThirdParty = async (text, settings) => {
        const baseUrl = settings.thirdPartyVoiceUrl.replace(/\/$/, '');
        const ttsPath = settings.thirdPartyTtsPath || '/text_to_speech';
        let url = baseUrl + ttsPath;

        const headers = {
            'Authorization': `Bearer ${settings.thirdPartyVoiceKey}`,
            'Content-Type': 'application/json'
        };

        let body = {};

        if (settings.voiceProvider === 'moss') {
            body = {
                text: text,
                speaker: settings.thirdPartyVoiceName || 'default'
            };
        } else if (settings.voiceProvider === 'minimax') {
            if (settings.thirdPartyGroupId) {
                url = `${baseUrl}/text_to_speech?GroupId=${settings.thirdPartyGroupId}`;
            }
            body = {
                text: text,
                voice_id: settings.thirdPartyVoiceName || 'male-qn-qingse',
                model: 'speech-01',
                audio_format: 'mp3'
            };
        } else if (settings.voiceProvider === 'huggingface') {
            body = { inputs: text };
        } else if (settings.thirdPartyRequestFormat === 'custom' && settings.customTtsBody) {
            try {
                const customStr = settings.customTtsBody
                    .replace(/\{\{TEXT\}\}/g, text)
                    .replace(/\{\{VOICE\}\}/g, settings.thirdPartyVoiceName || 'default');
                body = JSON.parse(customStr);
            } catch {
                body = { text, voice: settings.thirdPartyVoiceName || 'default' };
            }
        } else {
            body = {
                model: settings.ttsModel || 'tts-1',
                voice: settings.thirdPartyVoiceName || settings.ttsVoice || 'alloy',
                input: text,
                speed: settings.ttsSpeed || 1.0
            };
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(body)
            });

            if (!response.ok) throw new Error(`TTS HTTP ${response.status}`);

            let audioUrl;
            const audioFormat = settings.thirdPartyAudioFormat || 'binary';

            if (audioFormat === 'binary') {
                const audioBlob = await response.blob();
                callTtsBlobs.push(audioBlob);
                audioUrl = URL.createObjectURL(audioBlob);
            } else if (audioFormat === 'json_base64') {
                const data = await response.json();
                const audioData = getNestedValue(data, settings.audioResponsePath || 'data.audio');
                if (!audioData) throw new Error('No audio data in response');
                const binaryString = atob(audioData);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const audioBlob = new Blob([bytes], { type: 'audio/mp3' });
                callTtsBlobs.push(audioBlob);
                audioUrl = URL.createObjectURL(audioBlob);
            } else if (audioFormat === 'json_url') {
                const data = await response.json();
                audioUrl = getNestedValue(data, settings.audioResponsePath || 'data.audio');
                if (!audioUrl) throw new Error('No audio URL in response');
            }

            const audio = new Audio(audioUrl);
            audio.onended = () => {
                if (audioFormat !== 'json_url') URL.revokeObjectURL(audioUrl);
            };
            await audio.play();

        } catch (err) {
            console.error('Third-party TTS Error:', err);
        }
    };

    const getNestedValue = (obj, path) => {
        if (!path) return obj;
        const keys = path.split('.');
        let result = obj;
        for (const key of keys) {
            if (result && typeof result === 'object' && key in result) {
                result = result[key];
            } else {
                return null;
            }
        }
        return result;
    };

    const addTranscript = (speaker, text) => {
        callTranscriptData.push({ role: speaker, text, timestamp: Date.now() });
        if (!voiceCallTranscript) return;
        
        const isEmpty = voiceCallTranscript.querySelector('.transcript-empty');
        if (isEmpty) isEmpty.remove();

        const charName = charConfig?.name || getActiveConfig().name || 'AI 助理';
        const userName = userConfig?.name || localStorage.getItem('sx_user_name') || '我';
        const displayName = speaker === 'user' ? userName : charName;

        const item = document.createElement('div');
        item.className = `transcript-item ${speaker}`;
        item.innerHTML = `<span class="transcript-label">${displayName}:</span>${text}`;
        voiceCallTranscript.appendChild(item);
        voiceCallTranscript.scrollTop = voiceCallTranscript.scrollHeight;
    };

    const saveInlineCallRecording = async () => {
        if (callTranscriptData.length === 0 && callTtsBlobs.length === 0) return;
        const RECORDINGS_KEY = 'sx_voice_call_recordings';
        const duration = callStartTime ? Math.floor((Date.now() - callStartTime) / 1000) : 0;
        const charName = charConfig?.name || getActiveConfig().name || '未知';

        let audioData = null;
        if (callTtsBlobs.length > 0) {
            try {
                const combined = new Blob(callTtsBlobs, { type: 'audio/webm' });
                audioData = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = () => resolve(null);
                    reader.readAsDataURL(combined);
                });
            } catch {}
        }

        const recording = {
            id: `rec-${Date.now()}`,
            charName,
            timestamp: callStartTime || Date.now(),
            duration,
            audioData,
            mimeType: 'audio/webm',
            transcript: callTranscriptData.slice()
        };

        let recordings = [];
        try {
            const raw = localStorage.getItem(RECORDINGS_KEY);
            recordings = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(recordings)) recordings = [];
        } catch { recordings = []; }

        recordings.unshift(recording);
        if (recordings.length > 100) recordings.pop();
        localStorage.setItem(RECORDINGS_KEY, JSON.stringify(recordings));

        callTranscriptData = [];
        callTtsBlobs = [];
    };

    const endCall = () => {
        callState = 'ended';
        
        if (callTimerInterval) {
            clearInterval(callTimerInterval);
            callTimerInterval = null;
        }

        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            mediaStream = null;
        }

        if (audioContext) {
            audioContext.close();
            audioContext = null;
        }

        saveInlineCallRecording();

        if (callStatusText) callStatusText.textContent = '通話結束';
        if (callStatusIcon) {
            callStatusIcon.className = 'call-status-icon ended';
            callStatusIcon.innerHTML = '<i class="fas fa-phone-slash"></i>';
        }
        if (voiceCallVisualizer) voiceCallVisualizer.classList.remove('active');

        setTimeout(() => {
            resetCallUI();
        }, 2000);
    };

    const gotoSettings = () => {
        closeVoiceCallPanel();
        window.parent?.postMessage({ type: 'openApp', appId: 'settings' }, '*');
    };

    voiceCallStartBtn?.addEventListener('click', startCall);
    voiceCallEndBtn?.addEventListener('click', endCall);
    voiceGotoSettingsBtn?.addEventListener('click', gotoSettings);

    voiceCallPanel?.addEventListener('click', (e) => {
        if (e.target === voiceCallPanel) closeVoiceCallPanel();
    });

    const showEnvelopeStyleSection = () => {
        if (!envelopeStyleSection) return;
        const isEnvelope = transferTypeInput?.value === 'envelope';
        envelopeStyleSection.classList.toggle('hidden', !isEnvelope);
    };

    const handleEnvelopeStyleSelect = (styleItem) => {
        const allItems = envelopeStylesContainer?.querySelectorAll('.envelope-style-item');
        allItems?.forEach(item => item.classList.remove('selected'));
        styleItem.classList.add('selected');
        selectedEnvelopeStyle = styleItem.dataset.style || 'default';
        
        if (selectedEnvelopeStyle === 'custom') {
            envelopeCustomUpload?.classList.remove('hidden');
        } else {
            envelopeCustomUpload?.classList.add('hidden');
        }
    };

    const handleCustomEnvelopeUpload = (file) => {
        if (!file || !file.type.startsWith('image/')) return;
        if (file.size > 2 * 1024 * 1024) {
            alert('圖片大小請勿超過 2MB');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            customEnvelopeImage = reader.result;
            if (envelopeCustomPreview) {
                envelopeCustomPreview.innerHTML = `<img src="${customEnvelopeImage}" alt="自訂紅包封面">`;
                envelopeCustomPreview.classList.add('active');
            }
            const customPreview = envelopeStylesContainer?.querySelector('[data-style="custom"] .envelope-preview');
            if (customPreview) {
                customPreview.style.backgroundImage = `url('${customEnvelopeImage}')`;
                customPreview.classList.add('custom-image');
                customPreview.innerHTML = '';
            }
        };
        reader.readAsDataURL(file);
    };

    const getEnvelopeCardHtml = (flowLabel, amount, note, fromName, toName) => {
        let coverClass = selectedEnvelopeStyle;
        let coverStyle = '';
        let coverContent = '';
        
        if (selectedEnvelopeStyle === 'custom' && customEnvelopeImage) {
            coverClass = 'custom-image';
            coverStyle = `background-image: url('${customEnvelopeImage}');`;
            coverContent = '封';
        } else if (selectedEnvelopeStyle === 'default') {
            coverContent = '福';
        } else if (selectedEnvelopeStyle === 'gold') {
            coverContent = '發';
        } else if (selectedEnvelopeStyle === 'pink') {
            coverContent = '愛';
        }
        
        return `
            <div class="envelope-card">
                <div class="envelope-card-cover ${coverClass}" style="${coverStyle}">${coverContent}</div>
                <div class="envelope-card-info">
                    <div class="amount">${formatNTD(amount)}</div>
                    <div class="note">${note ? sanitizeText(note) : '恭喜發財'}</div>
                </div>
            </div>
        `;
    };

    const renderTransferWallets = () => {
        if (!transferWalletMount) return;
        const wallets = getChatWallets();
        const userName = sanitizeText(userConfig?.name || localStorage.getItem('sx_user_name') || '我');
        const charName = sanitizeText(charConfig?.name || getActiveConfig().name || 'AI 助理');
        transferWalletMount.innerHTML = `
            <div class="transfer-wallet">
                <div class="label">${userName} 錢包</div>
                <div class="value">${formatNTD(wallets.user)}</div>
            </div>
            <div class="transfer-wallet">
                <div class="label">${charName} 錢包</div>
                <div class="value">${formatNTD(wallets.char)}</div>
            </div>
        `;
    };

    const closeTransferPanel = () => {
        transferPanel?.classList.remove('active');
        selectedEnvelopeStyle = 'default';
        customEnvelopeImage = '';
        const allItems = envelopeStylesContainer?.querySelectorAll('.envelope-style-item');
        allItems?.forEach(item => item.classList.remove('selected'));
        const defaultItem = envelopeStylesContainer?.querySelector('[data-style="default"]');
        defaultItem?.classList.add('selected');
        envelopeCustomUpload?.classList.add('hidden');
        if (envelopeCustomPreview) {
            envelopeCustomPreview.innerHTML = '';
            envelopeCustomPreview.classList.remove('active');
        }
        const customPreview = envelopeStylesContainer?.querySelector('[data-style="custom"] .envelope-preview');
        if (customPreview) {
            customPreview.style.backgroundImage = '';
            customPreview.classList.remove('custom-image');
            customPreview.innerHTML = '<i class="fas fa-plus"></i>';
        }
    };

    const openTransferPanel = () => {
        renderTransferWallets();
        showEnvelopeStyleSection();
        transferPanel?.classList.add('active');
        plusMenu?.classList.remove('open');
    };

    transferTypeInput?.addEventListener('change', showEnvelopeStyleSection);

    envelopeStylesContainer?.addEventListener('click', (e) => {
        const styleItem = e.target.closest('.envelope-style-item');
        if (!styleItem) return;
        handleEnvelopeStyleSelect(styleItem);
    });

    envelopeCustomFile?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleCustomEnvelopeUpload(file);
        e.target.value = '';
    });

    const submitTransfer = () => {
        const flowType = transferTypeInput?.value || 'transfer';
        const direction = transferDirectionInput?.value || 'user_to_char';
        const amount = Math.floor(Number(transferAmountInput?.value || 0));
        const note = (transferNoteInput?.value || '').trim();
        if (!amount || amount <= 0) {
            alert('請輸入正確金額');
            return;
        }

        const wallets = getChatWallets();
        const payerKey = direction === 'user_to_char' ? 'user' : 'char';
        const receiverKey = payerKey === 'user' ? 'char' : 'user';
        if (wallets[payerKey] < amount) {
            alert('付款方餘額不足');
            return;
        }

        wallets[payerKey] -= amount;
        wallets[receiverKey] += amount;
        saveChatWallets(wallets);
        renderTransferWallets();

        const userName = userConfig?.name || localStorage.getItem('sx_user_name') || '我';
        const charName = charConfig?.name || getActiveConfig().name || 'AI 助理';
        const flowLabel = flowType === 'envelope' ? '紅包' : (flowType === 'request' ? '收款' : '轉帳');
        const fromName = direction === 'user_to_char' ? userName : charName;
        const toName = direction === 'user_to_char' ? charName : userName;

        let payCard;
        if (flowType === 'envelope') {
            payCard = getEnvelopeCardHtml(flowLabel, amount, note, fromName, toName);
        } else {
            payCard = `
                <div class="map-card">
                    <div class="map-info" style="font-weight:700;">💳 ${flowLabel}成功</div>
                    <div class="map-info">${sanitizeText(fromName)} -> ${sanitizeText(toName)}</div>
                    <div class="map-info">金額：${formatNTD(amount)}</div>
                    <div class="map-info">${note ? sanitizeText(note) : '無備註'}</div>
                </div>
            `;
        }

        const msgType = direction === 'user_to_char' ? 'mine' : 'other';
        appendMsg(msgType, payCard);
        appendHistoryAndSession(msgType === 'mine' ? 'user' : 'assistant', payCard);
        appendKakaoPayTransferRecord({ flowType, direction, amount, note, userName, charName });

        if (transferAmountInput) transferAmountInput.value = '';
        if (transferNoteInput) transferNoteInput.value = '';
        closeTransferPanel();
    };

    const renderKaomojiButtons = (kaomojiList) => {
        if (!emojiRow) return;
        emojiRow.innerHTML = '';
        kaomojiList.forEach(item => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = item;
            btn.addEventListener('click', () => {
                appendMsg('mine', item);
                const history = JSON.parse(localStorage.getItem('sx_chat_history') || '[]');
                history.push({ role: "user", content: item });
                localStorage.setItem('sx_chat_history', JSON.stringify(history));
                const activeId = getActiveChatId();
                if (activeId) {
                    const sessions = loadChatSessions();
                    const target = sessions.find(s => s.id === activeId);
                    if (target) {
                        target.history = history;
                        saveChatSessions(sessions);
                    }
                }
            });
            emojiRow.appendChild(btn);
        });
    };

    const renderStickerButtons = (stickerList) => {
        if (!emojiRow) return;
        emojiRow.innerHTML = '';
        stickerList.forEach(item => {
            const btn = document.createElement('button');
            btn.type = 'button';
            
            if (typeof item === 'object' && item.url) {
                const img = document.createElement('img');
                img.src = item.url;
                img.alt = item.name || 'sticker';
                img.style.cssText = 'width: 32px; height: 32px; object-fit: contain;';
                btn.appendChild(img);
                btn.title = item.name || 'sticker';
                btn.addEventListener('click', () => {
                    appendMsg('mine', '', { type: 'image', url: item.url, name: item.name });
                    const history = JSON.parse(localStorage.getItem('sx_chat_history') || '[]');
                    history.push({ role: "user", content: `[表情: ${item.name || 'sticker'}]`, imageUrl: item.url });
                    localStorage.setItem('sx_chat_history', JSON.stringify(history));
                    const activeId = getActiveChatId();
                    if (activeId) {
                        const sessions = loadChatSessions();
                        const target = sessions.find(s => s.id === activeId);
                        if (target) {
                            target.history = history;
                            saveChatSessions(sessions);
                        }
                    }
                    emojiPanel?.classList.remove('active');
                });
            }
            
            emojiRow.appendChild(btn);
        });
    };

    const kaomojiList = ['(￣▽￣)', '(｡◕‿◕｡)', '(≧∇≦)', '( •̀ᴗ•́ )', '(╯°□°）╯︵ ┻━┻', 'ㅠㅠ', '(ಥ﹏ಥ)', '(´･ω･`)', '(づ｡◕‿‿◕｡)づ', '(*´∀`)~♥', '(•̀ω•́)✧', '(￣︶￣)', '(◕‿◕)', '(◠‿◠)', '(❁´◡`❁)', '(✿◠‿◠)', '(≧◡≦)', '(◕ᴗ◕✿)', '(◠‿◠✿)', '(◕‿◕✿)', '(｡♥‿♥｡)', '(♡‿♡)', '(♥ω♥)', '(◕ᴗ◕)', '(◠ᴗ◠)', '(◕‿‿◕)', '(◠‿‿◠)', '(*≧ω≦)', '(◕‿◕*)', '(◠‿◠*)', '(✧ω✧)', '(◕ᴗ◕✧)', '(◠ᴗ◠✧)'];

    const loadEmojiPacks = () => {
        try {
            const packsRaw = localStorage.getItem('sx_emoji_packs');
            if (packsRaw) {
                const packs = JSON.parse(packsRaw);
                if (Array.isArray(packs) && packs.length > 0) {
                    return packs;
                }
            }
        } catch (e) {
            console.warn('[Chat] 載入表情包失敗:', e);
        }
        return null;
    };

    if (emojiRow) {
        renderKaomojiButtons(kaomojiList);
    }

    if (plusBtn && plusMenu) {
        plusBtn.onclick = (e) => {
            e.stopPropagation();
            plusMenu.classList.toggle('open');
            emojiPanel?.classList.remove('active');
            locationPanel?.classList.remove('active');
        };

        plusMenu.addEventListener('click', (e) => {
            if (e.target.closest('.menu-item')) return;
            if (emojiPanel?.classList.contains('active') || locationPanel?.classList.contains('active')) {
                emojiPanel?.classList.remove('active');
                locationPanel?.classList.remove('active');
            }
        });
    }

    document.querySelectorAll('.menu-item[data-action]').forEach(item => {
        item.addEventListener('click', () => {
            const action = item.dataset.action;
            if (action === 'emoji') {
                renderKaomojiButtons(kaomojiList);
                emojiPanel?.classList.toggle('active');
                locationPanel?.classList.remove('active');
            }
            if (action === 'sticker') {
                emojiPanel?.classList.remove('active');
                locationPanel?.classList.remove('active');
                plusMenu?.classList.remove('open');
                const userPacks = loadEmojiPacks();
                if (userPacks && userPacks.length > 0) {
                    renderStickerButtons(userPacks);
                    emojiPanel?.classList.add('active');
                } else {
                    const emojiShopPanel = document.getElementById('emoji-shop-panel');
                    if (emojiShopPanel) {
                        emojiShopPanel.classList.add('active');
                        document.querySelector('.kakao-bottom-tabs')?.classList.add('hidden');
                    }
                }
            }
            if (action === 'location') {
                locationPanel?.classList.toggle('active');
                emojiPanel?.classList.remove('active');
                plusMenu?.classList.remove('open');
            }
            if (action === 'transfer') {
                emojiPanel?.classList.remove('active');
                locationPanel?.classList.remove('active');
                openTransferPanel();
            }
            if (action === 'image') {
                imageUpload?.click();
            }
            if (action === 'generate-image') {
                const apiUrl = localStorage.getItem('sx_nova_api_url') || '';
                const apiKey = localStorage.getItem('sx_nova_api_key') || '';
                if (!apiUrl || !apiKey) {
                    alert('NovaAI 尚未設定，請到 Settings > API 設定填入 API URL 與 API Key');
                    return;
                }
                alert('NovaAI 已設定，待接入生成流程');
            }
            if (action === 'phone-appearance') {
                showPhoneAppearanceDialog();
                plusMenu?.classList.remove('open');
            }
            if (action === 'generate-diary') {
                emojiPanel?.classList.remove('active');
                locationPanel?.classList.remove('active');
                openDiaryPanel();
            }
            if (action === 'check-phone') {
                emojiPanel?.classList.remove('active');
                locationPanel?.classList.remove('active');
                openCheckPhonePanel();
            }
            if (action === 'inner-voice') {
                emojiPanel?.classList.remove('active');
                locationPanel?.classList.remove('active');
                openInnerVoicePanel();
            }
            if (action === 'voice-call') {
                emojiPanel?.classList.remove('active');
                locationPanel?.classList.remove('active');
                openVoiceCallPanel();
            }
            if (action === 'voice-message') {
                emojiPanel?.classList.remove('active');
                locationPanel?.classList.remove('active');
                openVoiceMessagePanel();
            }
            if (action === 'recommend-product') {
                emojiPanel?.classList.remove('active');
                locationPanel?.classList.remove('active');
                openProductRecommendPanel();
            }
            if (action === 'memory-table') {
                emojiPanel?.classList.remove('active');
                locationPanel?.classList.remove('active');
                plusMenu?.classList.remove('open');
                openMemoryTablePanel();
            }
        });
    });

    locationPanel?.addEventListener('click', (e) => {
        if (e.target.id === 'location-panel') {
            locationPanel.classList.remove('active');
        }
    });

    transferPanel?.addEventListener('click', (e) => {
        if (e.target.id === 'transfer-panel') {
            closeTransferPanel();
        }
    });

    sendTransferBtn?.addEventListener('click', submitTransfer);

    if (emojiBack) {
        emojiBack.addEventListener('click', () => {
            emojiPanel?.classList.remove('active');
        });
    }

    if (sendLocationBtn) {
        sendLocationBtn.addEventListener('click', () => {
            const locationText = locationInput?.value.trim();
            if (!locationText) return;
            const mapMessage = `
                <div class="map-card">
                    <div class="map-image">
                        <div class="map-pin"></div>
                    </div>
                    <div class="map-info">${locationText}</div>
                </div>
            `;
            appendMsg('mine', mapMessage);
            const history = JSON.parse(localStorage.getItem('sx_chat_history') || '[]');
            history.push({ role: "user", content: mapMessage });
            localStorage.setItem('sx_chat_history', JSON.stringify(history));
            const activeId = getActiveChatId();
            if (activeId) {
                const sessions = loadChatSessions();
                const target = sessions.find(s => s.id === activeId);
                if (target) {
                    target.history = history;
                    saveChatSessions(sessions);
                }
            }
            if (locationInput) locationInput.value = '';
            locationPanel?.classList.remove('active');
        });
    }

    if (imageUpload) {
        imageUpload.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                const imgHtml = `<img src="${reader.result}" style="max-width:180px;border-radius:10px;" />`;
                appendMsg('mine', imgHtml);
                const history = JSON.parse(localStorage.getItem('sx_chat_history') || '[]');
                history.push({ role: "user", content: imgHtml });
                localStorage.setItem('sx_chat_history', JSON.stringify(history));
                const activeId = getActiveChatId();
                if (activeId) {
                    const sessions = loadChatSessions();
                    const target = sessions.find(s => s.id === activeId);
                    if (target) {
                        target.history = history;
                        saveChatSessions(sessions);
                    }
                }
                window.parent?.postMessage({
                    type: 'ALBUM_ADD_IMAGE',
                    url: reader.result,
                    source: 'chat'
                }, '*');
            };
            reader.readAsDataURL(file);
        });
    }

    const PHONE_APPEARANCE_KEY = 'sx_phone_appearance_config';

    const getDefaultPhoneAppearanceConfig = () => ({
        brand: 'Sxiphone',
        model: 'Classic',
        font: "'SF Pro Display', sans-serif",
        color: '#333333',
        showBorder: true
    });

    const loadPhoneAppearanceConfigSafe = () => {
        const defaults = getDefaultPhoneAppearanceConfig();
        try {
            const saved = localStorage.getItem(PHONE_APPEARANCE_KEY);
            if (!saved) return defaults;
            const parsed = JSON.parse(saved);
            if (!parsed || typeof parsed !== 'object') return defaults;
            return {
                brand: String(parsed.brand || defaults.brand),
                model: String(parsed.model || defaults.model),
                font: String(parsed.font || defaults.font),
                color: /^#[0-9a-fA-F]{6}$/.test(String(parsed.color || '')) ? parsed.color : defaults.color,
                showBorder: parsed.showBorder !== false
            };
        } catch {
            return defaults;
        }
    };

    const applyPhoneAppearanceConfig = (config = loadPhoneAppearanceConfigSafe()) => {
        const safe = {
            ...getDefaultPhoneAppearanceConfig(),
            ...config
        };
        const resolvedFont = String(safe.font || '').startsWith('custom:')
            ? String(safe.font).slice(7) || getDefaultPhoneAppearanceConfig().font
            : safe.font;

        document.documentElement.style.setProperty('--sx-phone-border', safe.color);
        document.documentElement.style.setProperty('--sx-phone-border-visible', safe.showBorder ? '1' : '0');
        document.documentElement.style.setProperty('--sx-phone-brand', `'${safe.brand}'`);
        document.documentElement.style.setProperty('--sx-font-family', resolvedFont);

        if (!localStorage.getItem(PHONE_APPEARANCE_KEY)) {
            localStorage.setItem(PHONE_APPEARANCE_KEY, JSON.stringify(safe));
        }
    };

    applyPhoneAppearanceConfig();

    const showPhoneAppearanceDialog = () => {
        const dialogId = 'phone-appearance-dialog';
        let dialog = document.getElementById(dialogId);
        if (!dialog) {
            dialog = document.createElement('div');
            dialog.id = dialogId;
            dialog.className = 'phone-appearance-dialog';
            dialog.innerHTML = `
                <div class="dialog-content">
                    <div class="dialog-header">
                        <span>手機外觀設定</span>
                        <button class="dialog-close">&times;</button>
                    </div>
                    <div class="dialog-body">
                        <div class="phone-appearance-form">
                            <div class="form-group">
                                <label for="phone-appearance-brand">手機廠牌</label>
                                <input type="text" id="phone-appearance-brand" placeholder="例：iPhone, Samsung, Sxiphone">
                            </div>
                            <div class="form-group">
                                <label for="phone-appearance-model">手機型號/名稱</label>
                                <input type="text" id="phone-appearance-model" placeholder="例：iPhone 15 Pro, Galaxy S24">
                            </div>
                            <div class="form-group">
                                <label for="phone-appearance-font">字體</label>
                                <select id="phone-appearance-font">
                                    <option value="'SF Pro Display', sans-serif">SF Pro Display (iOS)</option>
                                    <option value="'Inter', sans-serif">Inter (現代)</option>
                                    <option value="'Roboto', sans-serif">Roboto (Android)</option>
                                    <option value="'Segoe UI', sans-serif">Segoe UI (Windows)</option>
                                    <option value="'Arial', sans-serif">Arial (通用)</option>
                                    <option value="custom">自訂字型</option>
                                </select>
                                <input type="text" id="phone-appearance-font-custom" class="hidden" placeholder="例：'Helvetica Neue', sans-serif">
                            </div>
                            <div class="form-group">
                                <label for="phone-appearance-color">主色調</label>
                                <input type="color" id="phone-appearance-color" value="#333333">
                            </div>
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="phone-appearance-show-border" checked>
                                    <span>顯示手機邊框</span>
                                </label>
                            </div>
                            <div class="preview-area">
                                <div class="preview-phone-mini">
                                    <div class="preview-phone-border-mini"></div>
                                    <div class="preview-phone-screen-mini">
                                        <div class="preview-brand-mini">手機預覽</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="dialog-footer">
                        <button class="dialog-btn secondary" id="phone-appearance-cancel">取消</button>
                        <button class="dialog-btn primary" id="phone-appearance-save">套用設定</button>
                    </div>
                </div>
            `;
            document.body.appendChild(dialog);
            
            const closeBtn = dialog.querySelector('.dialog-close');
            const cancelBtn = dialog.querySelector('#phone-appearance-cancel');
            const saveBtn = dialog.querySelector('#phone-appearance-save');
            const fontSelect = dialog.querySelector('#phone-appearance-font');
            const customFontInput = dialog.querySelector('#phone-appearance-font-custom');
            const brandInput = dialog.querySelector('#phone-appearance-brand');
            const modelInput = dialog.querySelector('#phone-appearance-model');
            const colorInput = dialog.querySelector('#phone-appearance-color');
            const showBorderInput = dialog.querySelector('#phone-appearance-show-border');
            
            const updatePreview = () => {
                const brand = brandInput?.value || '手機';
                const color = colorInput?.value || '#333333';
                const showBorder = !!showBorderInput?.checked;
                
                const previewBorder = dialog.querySelector('.preview-phone-border-mini');
                const previewBrand = dialog.querySelector('.preview-brand-mini');
                
                if (previewBorder) {
                    previewBorder.style.borderColor = color;
                    previewBorder.style.borderWidth = showBorder ? '4px' : '0px';
                }
                if (previewBrand) previewBrand.textContent = brand;
            };
            
            const config = loadPhoneAppearanceConfigSafe();
            
            if (brandInput) brandInput.value = config.brand;
            if (modelInput) modelInput.value = config.model;
            if (colorInput) colorInput.value = config.color;
            if (showBorderInput) showBorderInput.checked = config.showBorder !== false;
            
            if (String(config.font || '').startsWith('custom:')) {
                fontSelect.value = 'custom';
                customFontInput.value = config.font.replace('custom:', '');
                customFontInput.classList.remove('hidden');
            } else {
                fontSelect.value = config.font;
                customFontInput.classList.add('hidden');
            }
            
            [brandInput, colorInput, showBorderInput].forEach(el => {
                el.addEventListener('input', updatePreview);
                el.addEventListener('change', updatePreview);
            });
            
            fontSelect.addEventListener('change', () => {
                if (fontSelect.value === 'custom') {
                    customFontInput.classList.remove('hidden');
                } else {
                    customFontInput.classList.add('hidden');
                }
                updatePreview();
            });
            
            customFontInput.addEventListener('input', updatePreview);
            
            const closeDialog = () => {
                dialog.classList.remove('active');
                setTimeout(() => dialog.remove(), 300);
            };
            
            closeBtn?.addEventListener('click', closeDialog);
            cancelBtn?.addEventListener('click', closeDialog);
            
            saveBtn?.addEventListener('click', () => {
                const config = {
                    brand: brandInput?.value.trim() || 'Sxiphone',
                    model: modelInput?.value.trim() || 'Classic',
                    font: fontSelect.value === 'custom' 
                        ? `custom:${customFontInput.value.trim() || "'SF Pro Display', sans-serif"}` 
                        : fontSelect.value,
                    color: colorInput?.value || '#333333',
                    showBorder: !!showBorderInput?.checked
                };
                
                localStorage.setItem(PHONE_APPEARANCE_KEY, JSON.stringify(config));
                applyPhoneAppearanceConfig(config);
                
                window.parent?.postMessage({
                    type: 'PHONE_APPEARANCE_UPDATED',
                    config
                }, '*');
                
                closeDialog();
            });
            
            dialog.addEventListener('click', (e) => {
                if (e.target === dialog) closeDialog();
            });
            
            updatePreview();
        }
        
        dialog.classList.add('active');
    };

    const accordions = drawer.querySelectorAll('.accordion-header');
    accordions.forEach(header => {
        header.onclick = () => {
            const item = header.parentElement;
            const body = item.querySelector('.accordion-body');
            if(body) body.style.display = (body.style.display === 'block') ? 'none' : 'block';
            const icon = header.querySelector('i');
            if(icon) icon.classList.toggle('fa-chevron-down');
            if(icon) icon.classList.toggle('fa-chevron-up');
        };
    });

    document.addEventListener('click', (e) => {
        if (isProcessingLongPress) return;

        const isInsideDrawer = drawer && drawer.contains(e.target);
        if (!isInsideDrawer) drawer?.classList.remove('open');
        if (plusMenu?.classList.contains('open') && !plusMenu.contains(e.target) && e.target !== plusBtn) {
            plusMenu.classList.remove('open');
        }
        const contextMenu = document.getElementById('context-menu');
        if (contextMenu && contextMenu.contains(e.target)) return;
        if (!currentTargetMsg?.contains(e.target) && contextMenu?.style.display === 'flex') {
            closeContextMenu();
        }    
    });
    // 綁定角色設定儲存按鈕
    document.getElementById('save-char')?.addEventListener('click', () => {
    const val = document.getElementById('set-name').value.trim();
    const personality = document.getElementById('set-personality')?.value.trim() || '';
    const background = document.getElementById('set-background')?.value.trim() || '';
    const avatar = document.getElementById('preview-avatar')?.src || '';
    
    localStorage.setItem('sx_char_personality', personality);
    localStorage.setItem('sx_char_background', background);
    if (avatar && !avatar.includes('data:image')) {
        localStorage.setItem('sx_char_avatar', avatar);
    }
    
    saveCharSettings(val);
    alert('角色設定已套用');
});

    // 綁定用戶面具儲存按鈕
    document.getElementById('save-mask')?.addEventListener('click', () => {
    const userNameVal = document.getElementById('set-user-name')?.value.trim() || 'User';
    const userBgVal = document.getElementById('set-user-background')?.value.trim() || '';
    
    saveUserFullSettings(userNameVal, userBgVal);
    alert('個人面具已套用');
});
}

// --- 4. 關閉右鍵選單 ---
function closeContextMenu() {
    const menu = document.getElementById('context-menu');
    if (menu) menu.style.display = 'none';
    if (currentTargetMsg) {
        const bubble = currentTargetMsg.querySelector('.bubble');
        if (bubble) bubble.classList.remove('long-press-active');
    }
    isMenuOpen = false;
    isProcessingLongPress = false;
    clearTimeout(menuHideTimer);
}

// --- 5. 世界書引擎 (新架構) ---
const WorldInfoEngine = {
    /**
     * @param {string} latestText - 用戶最新的輸入文字
     * @param {object} allWorldsData - 包含所有世界書的物件包
     * @param {string} currentBookTitle - (可選) 當前 UI 選中的書名
     */
    scanAndGetContent(latestText, allWorldsData, currentBookTitle = "") {
        if (!allWorldsData) return "";
        
        let activeContent = "";
        
        // --- 第一步：讀取已保存的世界書掛載設定 ---
        const mounts = getWorldbookMounts();
        
        // --- 第二步：處理禁止詞 (最高優先權) ---
        const forbiddenList = allWorldsData.sx_detected_forbidden || [];
        if (forbiddenList.length > 0) {
            activeContent += `\n<CRITICAL_RULE>\n絕對禁止在回覆中出現以下詞彙：[${forbiddenList.join(', ')}]\n</CRITICAL_RULE>\n`;
        }

        // --- 新架構：處理核心內容 (全局掛載) ---
        if (allWorldsData.core && allWorldsData.core.sx_worldbook_core) {
            const coreEntries = allWorldsData.core.sx_worldbook_core;
            if (Array.isArray(coreEntries)) {
                coreEntries.forEach(entry => {
                    if (!entry.enabled) return;
                    
                    // 核心內容始終載入，或根據觸發詞
                    const hasTriggers = entry.triggers && entry.triggers.length > 0;
                    const triggerMatch = hasTriggers && entry.triggers.some(k => latestText.includes(k));
                    
                    if (!hasTriggers || triggerMatch) {
                        activeContent += `<CORE title="${entry.title}">\n${entry.content}\n</CORE>\n`;
                    }
                });
            }
        }
        
        // --- 新架構：處理條件式內容 (局部掛載) ---
        if (allWorldsData.conditional) {
            const cond = allWorldsData.conditional;
            
            // 處理模型專用協議
            if (cond.model_protocols && cond.model_protocols.entries) {
                cond.model_protocols.entries.forEach(entry => {
                    if (!entry.enabled) return;
                    const triggerMatch = entry.triggers && entry.triggers.some(k => latestText.includes(k));
                    if (triggerMatch) {
                        activeContent += `<MODEL_PROTOCOL title="${entry.title}">\n${entry.content}\n</MODEL_PROTOCOL>\n`;
                    }
                });
            }
            
            // 處理文風課程
            if (cond.style_courses && cond.style_courses.entries) {
                cond.style_courses.entries.forEach(entry => {
                    if (!entry.enabled) return;
                    const triggerMatch = entry.triggers && entry.triggers.some(k => latestText.includes(k));
                    if (triggerMatch) {
                        activeContent += `<STYLE title="${entry.title}">\n${entry.content}\n</STYLE>\n`;
                    }
                });
            }
            
            // 處理小劇場類型
            if (cond.theater_types && cond.theater_types.entries) {
                cond.theater_types.entries.forEach(entry => {
                    if (!entry.enabled) return;
                    const triggerMatch = entry.triggers && entry.triggers.some(k => latestText.includes(k));
                    if (triggerMatch) {
                        activeContent += `<THEATER_TYPE title="${entry.title}">\n${entry.content}\n</THEATER_TYPE>\n`;
                    }
                });
            }
            
            // 處理NSFW模組
            if (cond.nsfw_modules && cond.nsfw_modules.entries) {
                cond.nsfw_modules.entries.forEach(entry => {
                    if (!entry.enabled) return;
                    const triggerMatch = entry.triggers && entry.triggers.length > 0 && 
                                        entry.triggers.some(k => latestText.includes(k));
                    // NSFW 模組可以無觸發詞（始終載入）或根據觸發詞
                    if (!entry.triggers || entry.triggers.length === 0 || triggerMatch) {
                        activeContent += `<NSFW_MODULE title="${entry.title}">\n${entry.content}\n</NSFW_MODULE>\n`;
                    }
                });
            }
            
            // 處理NPC客串
            if (cond.npc_guest_appearances && cond.npc_guest_appearances.entries) {
                cond.npc_guest_appearances.entries.forEach(entry => {
                    if (!entry.enabled) return;
                    const triggerMatch = entry.triggers && entry.triggers.some(k => latestText.includes(k));
                    if (triggerMatch) {
                        activeContent += `<NPC_GUEST title="${entry.title}">\n${entry.content}\n</NPC_GUEST>\n`;
                    }
                });
            }
            
            // 處理特殊補丁
            if (cond.special_patches && cond.special_patches.entries) {
                cond.special_patches.entries.forEach(entry => {
                    if (!entry.enabled) return;
                    activeContent += `<PATCH title="${entry.title}">\n${entry.content}\n</PATCH>\n`;
                });
            }
        }
        
        // --- 新架構：處理劇場內容 (由theater.js處理，這裡只做標記) ---
        if (allWorldsData.theater && allWorldsData.theater.sx_worldbook_theater) {
            // 劇場內容由 theater.js 讀取，這裡只添加標記
            activeContent += `<!-- THEATER_CONTENT_AVAILABLE -->\n`;
        }

        // --- 舊架構兼容：根據掛載設定和類別封裝內容 ---
        const categories = ['cot', 'style', 'global', 'keywords', 'backend'];
        
        // 按位置分組
        const contentByPosition = {
            top: [],
            mid: [],
            bottom: []
        };
        
        categories.forEach(cat => {
            const key = `sx_worldbook_${cat}`;
            const entries = allWorldsData[key];
            
            if (!entries || !Array.isArray(entries)) return;

            entries.forEach(entry => {
                // 檢查條目本身的 enabled 狀態
                if (entry.enabled === false) return;
                
                // 檢查是否被掛載
                const mount = mounts.find(m => m.name === entry.title);
                const isGlobal = (cat === 'global');
                
                // global 分類預設啟用，不需要在 mounts 中設定
                // 其他分類需要在 mounts 中明確啟用
                const isMountEnabled = isGlobal 
                    ? (mount?.enabled ?? true)  // global 預設 true
                    : (mount?.enabled ?? false); // 其他分類預設 false
                
                if (!isMountEnabled) return;

                const titleMatch = entry.title && latestText.includes(entry.title);
                const keywordMatch = entry.triggers && entry.triggers.some(k => latestText.includes(k));

                if (isGlobal || titleMatch || keywordMatch) {
                    const content = `<${cat.toUpperCase()} title="${entry.title}">\n${entry.content}\n</${cat.toUpperCase()}>\n`;
                    
                    const position = mount?.position || 'mid';
                    contentByPosition[position].push(content);
                }
            });
        });

        // 按順序組合舊架構內容
        activeContent += contentByPosition.top.join('');
        activeContent += contentByPosition.mid.join('');
        activeContent += contentByPosition.bottom.join('');

        return activeContent;
    }
};

// --- 6. AI 核心邏輯 (修正版) ---
const ChatEngine = {
    getGenerationMode() {
        return localStorage.getItem('sx_generation_mode') || 'dialogue';
    },
    getHistorySlice() {
        const depth = parseInt(localStorage.getItem('chat_history_range')) || 30;
        let history = JSON.parse(localStorage.getItem('sx_chat_history') || '[]');
        return history.slice(-depth);
    },
    // 獲取關係距離設定
    getRelationshipDistanceSettings() {
        const meetupMentionEnabled = localStorage.getItem('sx_meetup_mention_enabled') !== 'false';
        const distance = localStorage.getItem('sx_relationship_distance') || 'moderate';
        return {
            meetupMentionEnabled,
            distance
        };
    },
    // 根據關係距離設定生成提示
    getRelationshipDistancePrompt(settings) {
        const { meetupMentionEnabled, distance } = settings;
        
        const distanceGuides = {
            'close': {
                description: '親密距離',
                instructions: `你們的關係非常親密，可以自然地討論以下話題：
- 線下見面、約會、一起出遊
- 同居、一起生活
- 親密的肢體接觸
- 未來的共同計畫
請根據角色性格自然地表達對見面的期待和渴望。`
            },
            'moderate': {
                description: '適中距離',
                instructions: `你們的關係正在發展中，可以偶爾提及：
- 見面的可能性，但不要太頻繁
- 一起參加活動的邀約
- 對未來見面的期待
請保持自然，不要過於急切地推進見面話題。`
            },
            'distant': {
                description: '遠距離',
                instructions: `你們目前維持遠距離的關係模式。請注意：
- **避免主動提及線下見面、約會地點等話題**
- 可以討論線上活動、共同的興趣愛好
- 如果用戶主動提起見面，可以溫和地回應，但不要過度期待
- 專注於線上互動的品質和情感連結
- 可以表達對用戶的關心，但以遠距離的方式呈現`
            },
            'strict-online': {
                description: '純線上關係',
                instructions: `你們的關係嚴格限制在線上。請務必遵守：
- **絕對禁止提及任何線下見面、約會、碰面相關的話題**
- **不要詢問用戶的具體位置或住址**
- **不要提議任何需要線下見面的活動**
- 專注於線上聊天、分享、情感交流
- 如果用戶提到見面，請溫和地轉移話題或表示線上互動也很好
- 這是一種讓用戶感到安全的關係模式，請尊重這個邊界`
            }
        };
        
        const guide = distanceGuides[distance] || distanceGuides['moderate'];
        
        // 如果關閉了見面提及，額外添加限制
        let additionalNote = '';
        if (!meetupMentionEnabled && distance !== 'strict-online') {
            additionalNote = `\n\n**額外提醒**：用戶已關閉「提及線下見面」功能，請避免主動提起任何見面相關話題。`;
        }
        
        return `
# RELATIONSHIP_DISTANCE_SETTINGS
## 關係模式：${guide.description}
${guide.instructions}${additionalNote}

請根據這個設定調整你的回應方式，確保用戶感到舒適和安全。`;
    },
    // 根據語言返回標點符號規範
    getPunctuationRules(lang) {
        const punctuationGuides = {
            'zh-TW': {
                name: '繁體中文',
                period: '。',
                comma: '，',
                questionMark: '？',
                exclamationMark: '！',
                quoteLeft: '「',
                quoteRight: '」',
                doubleQuoteLeft: '『',
                doubleQuoteRight: '』',
                colon: '：',
                semicolon: '；',
                ellipsis: '……',
                example: '她微微一笑，「沒關係，我等你。」'
            },
            'zh-CN': {
                name: '简体中文',
                period: '。',
                comma: '，',
                questionMark: '？',
                exclamationMark: '！',
                quoteLeft: '「',
                quoteRight: '」',
                doubleQuoteLeft: '『',
                doubleQuoteRight: '』',
                colon: '：',
                semicolon: '；',
                ellipsis: '……',
                example: '她微微一笑，「没关系，我等你。」'
            },
            'ja': {
                name: '日本語',
                period: '。',
                comma: '、',
                questionMark: '？',
                exclamationMark: '！',
                quoteLeft: '「',
                quoteRight: '」',
                doubleQuoteLeft: '『',
                doubleQuoteRight: '』',
                colon: '：',
                semicolon: '；',
                ellipsis: '……',
                example: '彼女は微かに笑い、「大丈夫、待ってるよ」と言った。'
            },
            'ko': {
                name: '한국어',
                period: '。',
                comma: '，',
                questionMark: '？',
                exclamationMark: '！',
                quoteLeft: '「',
                quoteRight: '」',
                doubleQuoteLeft: '『',
                doubleQuoteRight: '』',
                colon: '：',
                semicolon: '；',
                ellipsis: '……',
                example: '그녀는 살며시 웃으며, 「괜찮아, 기다릴게」라고 말했다.'
            },
            'en': {
                name: 'English',
                period: '.',
                comma: ',',
                questionMark: '?',
                exclamationMark: '!',
                quoteLeft: '"',
                quoteRight: '"',
                doubleQuoteLeft: '"',
                doubleQuoteRight: '"',
                colon: ':',
                semicolon: ';',
                ellipsis: '...',
                example: 'She smiled slightly and said, "It\'s okay, I\'ll wait for you."'
            },
            'en-US': {
                name: 'English (US)',
                period: '.',
                comma: ',',
                questionMark: '?',
                exclamationMark: '!',
                quoteLeft: '"',
                quoteRight: '"',
                doubleQuoteLeft: '"',
                doubleQuoteRight: '"',
                colon: ':',
                semicolon: ';',
                ellipsis: '...',
                example: 'She smiled slightly and said, "It\'s okay, I\'ll wait for you."'
            },
            'en-GB': {
                name: 'English (UK)',
                period: '.',
                comma: ',',
                questionMark: '?',
                exclamationMark: '!',
                quoteLeft: '"',
                quoteRight: '"',
                doubleQuoteLeft: '"',
                doubleQuoteRight: '"',
                colon: ':',
                semicolon: ';',
                ellipsis: '...',
                example: 'She smiled slightly and said, "It\'s okay, I\'ll wait for you."'
            }
        };
        
        const langMap = {
            'zh-Hant': 'zh-TW',
            'zh-Hans': 'zh-CN',
            'ja-JP': 'ja',
            'ko-KR': 'ko'
        };
        const normalizedLang = langMap[lang] || lang;
        const p = punctuationGuides[normalizedLang] || punctuationGuides['zh-TW'];
        
        return `
# 標點符號規範（${p.name}）
## 基本標點符號
- 句號：${p.period}
- 逗號：${p.comma}
- 問號：${p.questionMark}
- 驚嘆號：${p.exclamationMark}
- 冒號：${p.colon}
- 分號：${p.semicolon}

## 引號規則
- 對話引號：${p.quoteLeft}對話內容${p.quoteRight}
- 巢迴引號（引號內的引號）：${p.doubleQuoteLeft}內容${p.doubleQuoteRight}
- **所有角色對話必須使用 ${p.quoteLeft}${p.quoteRight} 包裹**

## 正確範例
${p.example}

## 注意事項
- 每個句子結尾必須有明確的標點符號（${p.period}、${p.questionMark}、${p.exclamationMark}）
- 逗號 ${p.comma} 用於句子內部的停頓，不可作為句子結尾
- **禁止使用刪節號** ${p.ellipsis} 作為句子結尾或句首`;
    },
    getModeInstructions(mode, lang = 'zh-TW') {
        // 獲取當前語言的標點符號規範
        const punctuationRules = this.getPunctuationRules(lang);
        
        // 強化版刪節號禁止規則 - 完全禁止使用
        const noEllipsisRule = `
# 【嚴格禁止】刪節號規則
- **絕對禁止**使用任何形式的刪節號：「......」、「...」、「…」、「。。。」、「。。。」、「......」
- **絕對禁止**在句首使用刪節號
- **絕對禁止**在句子中間使用刪節號
- **絕對禁止**以刪節號結尾
- **絕對禁止**連續使用多個句號「。。。。」或「....」
- 若需表達停頓或猶豫，請用完整句子描述，例如：「她頓了頓，似乎在思考該如何回應。」
- 每個句子必須完整，有明確的結尾（句號、問號、驚嘆號）
- **違規範例**：「嗯......好吧」、「那個...我...」、「真的嗎...」
- **正確範例**：「嗯，好吧。」「那個，我有點猶豫。」「真的嗎？」`;
        
        // 對話格式規則 - 根據語言調整
        const isEnglish = lang.startsWith('en');
        const dialogueFormatRule = isEnglish ? `
# 對話格式規則
- 所有角色的口語對話**必須**使用雙引號 "" 包裹
- 正確範例：She smiled slightly and said, "It's okay, I'll wait for you."
- 正確範例："Really?" she asked with surprise.
- 錯誤範例：She smiled and said, It's okay.（缺少引號）` : `
# 對話格式規則
- 所有角色的口語對話**必須**使用「」包裹
- 正確範例：她微微一笑，「沒關係，我等你。」
- 正確範例：「真的嗎？」她驚喜地問道。
- 錯誤範例：她微微一笑，沒關係，我等你。（缺少「」）
- 錯誤範例：她說：沒關係，我等你。（缺少「」）`;
        
        switch(mode) {
            case 'dialogue':
                return `
# GENERATION_MODE: 純對話模式
- 僅生成角色的口語對話內容
- **禁止**使用任何動作描寫（如 *微笑*、*嘆氣*、*點頭* 等）
- **禁止**使用心理描寫或內心獨白
- **禁止**使用第三人稱敘述
- **禁止**使用括號 () 表示內心活動
- 直接以角色的語言回應，就像真實的即時通訊對話
- 回應應該簡潔自然，符合日常對話習慣
- 可以使用表情符號或貼圖來表達情感（如 😊、😂）
- 保持角色性格，但只用文字對話呈現
- **不需要**使用「」包裹對話，直接輸出對話內容即可
${punctuationRules}
${noEllipsisRule}`;
            case 'narrative':
                return `
# GENERATION_MODE: 敘事模式（第三人稱小說風格）
- 以第三人稱視角進行詳細的敘事描寫，如同人小說風格
- 包含豐富的場景描寫、心理活動、感官細節
- 動作描寫應詳細且具有文學性（如：她微微蹙眉，指尖輕敲桌面）
- **內心活動用括號 () 包裹**，例如：(她心裡有些不安，不知道該如何回應)
${dialogueFormatRule}
- 注重氛圍營造和情感渲染
- 可以適度使用比喻、象徵等修辭手法
- 動作直接描寫，不需要特殊符號包裹
${punctuationRules}
${noEllipsisRule}`;
            case 'multi':
                return `
# GENERATION_MODE: 多條消息模式
- 將回覆分成多條獨立的訊息，每條訊息是一個完整的句子或段落
- 使用「|||SPLIT|||」作為訊息分隔符號（例如：第一句話|||SPLIT|||第二句話）
- 每條訊息應該是獨立且完整的，就像真實的即時通訊對話
- 可以混合使用對話和簡短的動作描寫
- 訊息數量建議在 2-5 條之間，根據內容長度調整
- 保持角色性格，讓對話更生動自然
${dialogueFormatRule}
${punctuationRules}
${noEllipsisRule}`;
            case 'multi-text':
                return `
# GENERATION_MODE: 純文字多條消息模式
- 將回覆分成多條獨立的訊息，每條訊息是一個完整的句子或段落
- 使用「|||SPLIT|||」作為訊息分隔符號（例如：第一句話|||SPLIT|||第二句話）
- 每條訊息應該是獨立且完整的，就像真實的即時通訊對話
- **禁止**使用任何動作描寫（如 *微笑*、*嘆氣*、*點頭* 等）
- **禁止**使用心理描寫或內心獨白
- **禁止**使用第三人稱敘述
- **禁止**使用括號 () 表示內心活動
- 直接以角色的語言回應，就像真實的即時通訊對話
- 訊息數量建議在 2-5 條之間，根據內容長度調整
- **不需要**使用「」包裹對話，直接輸出對話內容即可
- 可以使用表情符號或貼圖來表達情感（如 😊、😂）
${punctuationRules}
${noEllipsisRule}`;
            case 'full':
            default:
                return `
# GENERATION_MODE: 完整模式
- 靈活結合動作描寫、對話與內心活動
- **對話用「」包裹**，例如：「我沒事的，你別擔心。」
- **內心活動用括號 () 包裹**，例如：(其實心裡有點難過，但不想讓你擔心)
- **動作直接描寫**，不需要特殊符號，例如：她輕輕嘆了口氣，轉身望向窗外。
- 動作描寫應自然融入對話，增強角色表現力
- 保持適度的描寫，不要過於冗長
- 話少但內心活動豐富的角色：多用 () 描寫內心，對話「」保持簡短
${dialogueFormatRule}
${punctuationRules}
${noEllipsisRule}`;
        }
    },
    async getAwakeningContext() {
        if (window.dailyAwakening) {
            const context = await getAwakeningContextForPrompt();
            return context;
        }
        return null;
    },
    async assembleSystemPrompt(latestUserInput) {
        let activeChar = null;
        
        const charName = localStorage.getItem('sx_char_name');
        const charPersonality = localStorage.getItem('sx_char_personality');
        const charBackground = localStorage.getItem('sx_char_background');
        const charAvatar = localStorage.getItem('sx_char_avatar');
        const charExamples = localStorage.getItem('sx_char_examples');
        
        if (charName && charName !== '預設用戶') {
            activeChar = {
                name: charName,
                personality: charPersonality || '',
                background: charBackground || '',
                avatar: charAvatar || '',
                examples: charExamples || ''
            };
            console.log('[ChatEngine] 從獨立 key 讀取角色:', charName);
        }
        
        if (!activeChar) {
            const charactersRaw = localStorage.getItem('sx_characters');
            if (charactersRaw) {
                try {
                    const characters = JSON.parse(charactersRaw);
                    if (Array.isArray(characters) && characters.length > 0) {
                        activeChar = characters[0];
                        console.log('[ChatEngine] 從 sx_characters 讀取角色:', activeChar?.name);
                    }
                } catch (e) {
                    console.warn('解析 sx_characters 失敗:', e);
                }
            }
        }
        
        if (!activeChar) {
            const currentChars = JSON.parse(localStorage.getItem('sx_masks') || '[]');
            activeChar = currentChars[0] || {};
            console.log('[ChatEngine] 從 sx_masks 讀取角色:', activeChar?.name);
        }
        
        const userName = localStorage.getItem('sx_user_name') || "User";
        const userBio = document.getElementById('set-user-background')?.value || "";
        
        const region = localStorage.getItem('sxiphone_region') || "未知";
        const lang = localStorage.getItem('sxiphone_lang') || "zh-TW";
        
        const worldbookData = getWorldbookData();
        const dynamicWI = WorldInfoEngine.scanAndGetContent(latestUserInput, worldbookData);
        
        const mounts = getWorldbookMounts();
        const enabledMounts = mounts.filter(m => m.enabled);
        const worldbookContext = enabledMounts.length > 0 
            ? `\n\n# MOUNTED_WORLD_BOOKS\n已掛載 ${enabledMounts.length} 個世界書條目，請參考 WORLD_INFO 中的相關內容。`
            : '';

        const personality = activeChar.personality || "友善、樂於助人";
        const background = activeChar.background || "無特定背景";
        const examples = activeChar.examples || '';
        
        let examplesSection = '';
        if (examples && examples.trim()) {
            examplesSection = `
# DIALOGUE_EXAMPLES
以下是角色的對話範例，請學習其說話風格、語氣和格式，但**絕對禁止照抄範例內容**：

${examples}

## 範例學習指南
- 學習範例中的語氣、用詞習慣和情感表達方式
- 學習範例中的格式規範（對話用「」、內心活動用()、動作直接描寫）
- **禁止**直接複製範例中的句子或段落
- **禁止**重複範例中的具體內容
- 應根據當前對話情境，以相同的風格創作新的回應`;
        }
        
        let awakeningContext = '';
        try {
            const awakeningData = await this.getAwakeningContext();
            if (awakeningData) {
                awakeningContext = formatAwakeningForSystemPrompt(awakeningData);
            }
        } catch (e) {
            console.warn('[ChatEngine] 獲取喚醒上下文失敗:', e);
        }

        let envContext = '';
        try {
            const envSettingsRaw = localStorage.getItem('sx_env_awareness_settings');
            const envEnabled = envSettingsRaw ? JSON.parse(envSettingsRaw).enabled : false;
            
            if (envEnabled) {
                if (window.parent && window.parent !== window && typeof window.parent.getEnvContext === 'function') {
                    envContext = window.parent.getEnvContext();
                    console.log('[ChatEngine] 從父視窗獲取環境上下文（時間已更新）');
                } else if (typeof window.getEnvContext === 'function') {
                    envContext = window.getEnvContext();
                    console.log('[ChatEngine] 從本機獲取環境上下文（時間已更新）');
                } else {
                    const settings = JSON.parse(envSettingsRaw);
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
                        if (hour >= 5 && hour < 12) timeOfDay = '早上';
                        else if (hour >= 12 && hour < 14) timeOfDay = '中午';
                        else if (hour >= 14 && hour < 18) timeOfDay = '下午';
                        else if (hour >= 18 && hour < 22) timeOfDay = '晚上';
                        else timeOfDay = '深夜';
                        
                        parts.push(`目前時間：${timeStr}（${timeOfDay}）`);
                        parts.push(`ISO 時間：${now.toISOString()}`);
                    }
                    
                    if (settings.injectLocation !== false) {
                        if (settings.useFictionalLocation && settings.locationDisplay) {
                            parts.push(`所在地：${settings.locationDisplay}`);
                        } else if (settings.locationCity) {
                            const location = settings.locationCountry 
                                ? `${settings.locationCity}, ${settings.locationCountry}`
                                : settings.locationCity;
                            parts.push(`所在地：${location}`);
                        }
                    }
                    
                    if (settings.injectWeather !== false && settings.cachedWeather) {
                        const w = settings.cachedWeather;
                        parts.push(`目前天氣：${w.description}，氣溫 ${w.temperature}°C`);
                    }
                    
                    envContext = parts.join('\n');
                    console.log('[ChatEngine] 直接計算環境上下文（時間已更新）');
                }
            }
        } catch (e) {
            console.warn('[ChatEngine] 獲取環境上下文失敗:', e);
        }

        let envContextSection = '';
        if (envContext) {
            envContextSection = `\n# CURRENT_ENVIRONMENT\n${envContext}\n\n請根據當前時間和環境來調整你的回應。例如：\n- 如果是早晨，可以用朝氣的語氣\n- 如果是深夜，可以關心用戶是否該休息了\n- 如果天氣不好，可以表達關心`;
        }

        let fortuneMemorySection = '';
        try {
            const fortuneMemories = JSON.parse(localStorage.getItem('sx_fortune_memory') || '[]');
            if (fortuneMemories.length > 0) {
                const recentFortunes = fortuneMemories.slice(0, 3);
                const fortuneTexts = recentFortunes.map(f => {
                    const date = f.date || '未知日期';
                    const type = f.type || '占卜';
                    const question = f.question || '未知問題';
                    const cards = f.cards || '';
                    return `${date} 的 ${type}：問題「${question}」，結果：${cards}`;
                });
                fortuneMemorySection = `\n# FORTUNE_MEMORIES\n用戶最近的占卜紀錄：\n${fortuneTexts.join('\n')}\n\n你可以在對話中自然地提起這些占卜，表達關心或好奇。例如：「上次占卜的結果怎麼樣了？」或「那個塔羅牌的解讀對你有幫助嗎？」`;
            }
        } catch (e) {
            console.warn('[ChatEngine] 獲取占卜記憶失敗:', e);
        }

        const generationMode = this.getGenerationMode();
        const modeInstructions = this.getModeInstructions(generationMode, lang);
        
        // 獲取關係距離設定
        const relationshipSettings = this.getRelationshipDistanceSettings();
        const relationshipPrompt = this.getRelationshipDistancePrompt(relationshipSettings);
        
        // 模式名稱對照
        const modeNames = {
            'dialogue': '純對話模式',
            'narrative': '敘事模式',
            'multi': '多條消息模式',
            'multi-text': '純文字多條消息',
            'full': '完整模式'
        };
        const currentModeName = modeNames[generationMode] || generationMode;
        
        // 根據語言調整引號提示
        const isEnglish = lang.startsWith('en');
        const quoteHint = isEnglish ? '對話必須用雙引號 "" 包裹' : '對話必須用「」包裹';
        
        // 模式強化提示 - 確保 AI 注意到當前模式
        const modeEmphasis = `
# ⚠️ 重要提醒：當前生成模式
你正在使用「${currentModeName}」，請務必遵循此模式的格式要求。
- 「純對話模式」：只輸出對話文字，禁止動作和心理描寫，不需要「」包裹
- 「敘事模式」：第三人稱小說風格，對話用「」，內心活動用()，動作直接描寫
- 「完整模式」：對話用「」，內心活動用()，動作直接描寫
- 「多條消息模式」：用 |||SPLIT||| 分隔多條訊息，可含動作描寫
- 「純文字多條消息」：用 |||SPLIT||| 分隔多條訊息，禁止動作描寫
- **所有模式都嚴格禁止使用刪節號「......」、「...」、「…」**
- **所有句子必須有明確結尾（句號、問號、驚嘆號）**
- **禁止以「...」或「......」結尾**
- 違反刪節號規則的回覆將被視為無效`;

        return `
# CHARACTER_PROFILE
## 基本資訊
- 名字: ${activeChar.name || "AI 助理"}
- 性格特質: ${personality}
- 背景故事: ${background}

## 角色扮演指南
你現在要扮演 ${activeChar.name || "AI 助理"} 這個角色。請完全沉浸在這個角色中，用角色的視角和語氣來思考和回應。
${examplesSection}
# USER_CONTEXT
- 用戶名稱: ${userName}
- 用戶背景: ${userBio || "未知"}
- 所在地區: ${region}
${envContextSection}
# WORLD_INFORMATION
${dynamicWI || "（無觸發的世界書內容）"}
${worldbookContext}
${awakeningContext}
${fortuneMemorySection}
${relationshipPrompt}
${modeEmphasis}
${modeInstructions}
# RESPONSE_GUIDELINES
1. **角色一致性**: 始終保持 ${activeChar.name || "AI 助理"} 的角色特質，包括說話方式、用詞習慣、情感表達等。
2. **語言**: 使用 ${lang} 進行交流。
3. **身分保密**: 絕對不要提及你是 AI 或語言模型。
4. **回應風格**: 
   - 根據角色性格和世界書設定來決定回應的長度和風格
   - **嚴格遵循上方 GENERATION_MODE 的格式要求**
5. **情境適應**: 根據對話內容和情境，自然地調整回應方式。
6. **情感真實**: 讓角色的情感反應真實自然，符合其性格設定。
7. **格式檢查**: 回覆前請確認：
   - 對話是否用「」包裹？
   - 是否使用了刪節號「......」或「...」？（禁止使用）
   - 每個句子是否有明確結尾？
8. **標點符號**: 根據語言使用正確標點，禁止連續句號或刪節號

請記住：你的回應應該完全由角色設定和世界書內容來引導，而不是固定的格式。`.trim();
    },
    assembleSystemPromptSync(latestUserInput) {
        let activeChar = null;
        
        const charName = localStorage.getItem('sx_char_name');
        const charPersonality = localStorage.getItem('sx_char_personality');
        const charBackground = localStorage.getItem('sx_char_background');
        const charAvatar = localStorage.getItem('sx_char_avatar');
        const charExamples = localStorage.getItem('sx_char_examples');
        
        if (charName && charName !== '預設用戶') {
            activeChar = {
                name: charName,
                personality: charPersonality || '',
                background: charBackground || '',
                avatar: charAvatar || '',
                examples: charExamples || ''
            };
        }
        
        if (!activeChar) {
            const charactersRaw = localStorage.getItem('sx_characters');
            if (charactersRaw) {
                try {
                    const characters = JSON.parse(charactersRaw);
                    if (Array.isArray(characters) && characters.length > 0) {
                        activeChar = characters[0];
                    }
                } catch (e) {
                    console.warn('解析 sx_characters 失敗:', e);
                }
            }
        }
        
        if (!activeChar) {
            const currentChars = JSON.parse(localStorage.getItem('sx_masks') || '[]');
            activeChar = currentChars[0] || {};
        }
        
        const userName = localStorage.getItem('sx_user_name') || "User";
        const userBio = document.getElementById('set-user-background')?.value || "";
        
        const region = localStorage.getItem('sxiphone_region') || "未知";
        const lang = localStorage.getItem('sxiphone_lang') || "zh-TW";
        
        const worldbookData = getWorldbookData();
        const dynamicWI = WorldInfoEngine.scanAndGetContent(latestUserInput, worldbookData);
        
        const mounts = getWorldbookMounts();
        const enabledMounts = mounts.filter(m => m.enabled);
        const worldbookContext = enabledMounts.length > 0 
            ? `\n\n# MOUNTED_WORLD_BOOKS\n已掛載 ${enabledMounts.length} 個世界書條目，請參考 WORLD_INFO 中的相關內容。`
            : '';

const personality = activeChar.personality || "友善、樂於助人";
        const background = activeChar.background || "無特定背景";
        const examples = activeChar.examples || '';
        
        let examplesSection = '';
        if (examples && examples.trim()) {
            examplesSection = `
# DIALOGUE_EXAMPLES
以下是角色的對話範例，請學習其說話風格、語氣和格式，但**絕對禁止照抄範例內容**：

${examples}

## 範例學習指南
- 學習範例中的語氣、用詞習慣和情感表達方式
- 學習範例中的格式規範（對話用「」、內心活動用()、動作直接描寫）
- **禁止**直接複製範例中的句子或段落
- **禁止**重複範例中的具體內容
- 應根據當前對話情境，以相同的風格創作新的回應`;
        }
        
        const generationMode = this.getGenerationMode();
        const modeInstructions = this.getModeInstructions(generationMode, lang);
        
        // 模式名稱對照
        const modeNames = {
            'dialogue': '純對話模式',
            'narrative': '敘事模式',
            'multi': '多條消息模式',
            'multi-text': '純文字多條消息',
            'full': '完整模式'
        };
        const currentModeName = modeNames[generationMode] || generationMode;
        
        // 根據語言調整引號提示
        const isEnglish = lang.startsWith('en');
        const quoteHint = isEnglish ? '對話必須用雙引號 "" 包裹' : '對話必須用「」包裹';
        
        // 模式強化提示
        const modeEmphasis = `
# ⚠️ 重要提醒：當前生成模式
你正在使用「${currentModeName}」，請務必遵循此模式的格式要求。
- 「純對話模式」：只輸出對話文字，禁止動作和心理描寫，不需要「」包裹
- 「敘事模式」：第三人稱小說風格，對話用「」，內心活動用()，動作直接描寫
- 「完整模式」：對話用「」，內心活動用()，動作直接描寫
- 「多條消息模式」：用 |||SPLIT||| 分隔多條訊息，可含動作描寫
- 「純文字多條消息」：用 |||SPLIT||| 分隔多條訊息，禁止動作描寫
- **所有模式都嚴格禁止使用刪節號「......」、「...」、「…」**
- **所有句子必須有明確結尾（句號、問號、驚嘆號）**
- **禁止以「...」或「......」結尾**
- 違反刪節號規則的回覆將被視為無效`;

        return `
# CHARACTER_PROFILE
## 基本資訊
- 名字: ${activeChar.name || "AI 助理"}
- 性格特質: ${personality}
- 背景故事: ${background}

## 角色扮演指南
你現在要扮演 ${activeChar.name || "AI 助理"} 這個角色。請完全沉浸在這個角色中，用角色的視角和語氣來思考和回應。
${examplesSection}
# USER_CONTEXT
- 用戶名稱: ${userName}
- 用戶背景: ${userBio || "未知"}
- 所在地區: ${region}

# WORLD_INFORMATION
${dynamicWI || "（無觸發的世界書內容）"}
${worldbookContext}
${modeEmphasis}
${modeInstructions}
# RESPONSE_GUIDELINES
1. **角色一致性**: 始終保持 ${activeChar.name || "AI 助理"} 的角色特質，包括說話方式、用詞習慣、情感表達等。
2. **語言**: 使用 ${lang} 進行交流。
3. **身分保密**: 絕對不要提及你是 AI 或語言模型。
4. **回應風格**: 
   - 根據角色性格和世界書設定來決定回應的長度和風格
   - **嚴格遵循上方 GENERATION_MODE 的格式要求**
5. **情境適應**: 根據對話內容和情境，自然地調整回應方式。
6. **情感真實**: 讓角色的情感反應真實自然，符合其性格設定。
7. **格式檢查**: 回覆前請確認：
   - 對話是否用「」包裹？
   - 是否使用了刪節號「......」或「...」？（禁止使用）
   - 每個句子是否有明確結尾？
8. **標點符號**: 根據語言使用正確標點，禁止連續句號或刪節號

請記住：你的回應應該完全由角色設定和世界書內容來引導，而不是固定的格式。`.trim();
    }
};

// --- 7. AI 呼叫 ---
async function callAIAPI(payload) {
    let config = null;
    
    if (typeof window.SettingsReader !== 'undefined' && window.SettingsReader.getActiveApiWithFallback) {
        config = window.SettingsReader.getActiveApiWithFallback();
    } else {
        const apis = JSON.parse(localStorage.getItem('api_configs') || '[]');
        const activeIndex = parseInt(localStorage.getItem('sx_active_api'), 10);
        const validIndex = (!isNaN(activeIndex) && activeIndex >= 0 && activeIndex < apis.length) ? activeIndex : 0;
        config = apis[validIndex] || apis[0];
    }
    
    if (!config || !config.url) return "（錯誤：未偵測到 API 配置，請至控制中心設定）";

    const apiType = config.type || 'openai';  // 預設為 OpenAI 相容格式
    
    try {
        // Gemini 原生 API 格式
        if (apiType === 'gemini') {
            const model = config.model || 'gemini-1.5-flash';
            const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.key}`;
            
            // 將 OpenAI 格式的 messages 轉換為 Gemini 格式
            const contents = [];
            let systemInstruction = '';
            
            for (const msg of payload) {
                if (msg.role === 'system') {
                    systemInstruction = msg.content;
                } else {
                    contents.push({
                        role: msg.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: msg.content }]
                    });
                }
            }
            
            const geminiPayload = {
                contents,
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 4096
                }
            };
            
            if (systemInstruction) {
                geminiPayload.systemInstruction = { parts: [{ text: systemInstruction }] };
            }
            
            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(geminiPayload)
            });
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error.message || JSON.stringify(data.error));
            }
            
            return data.candidates?.[0]?.content?.parts?.[0]?.text || "（Gemini 回應格式異常）";
        }
        
        // 自訂端點格式（完整 URL，不添加任何路徑）
        let targetUrl;
        if (apiType === 'custom') {
            targetUrl = config.url;
        } else {
            // OpenAI 相容格式（OpenRouter、DeepSeek、Claude 等）
            targetUrl = config.url.endsWith('/chat/completions') 
                ? config.url 
                : config.url.replace(/\/$/, '') + '/chat/completions';
        }
        
        const headers = { 
            "Content-Type": "application/json"
        };
        
        // 添加 Authorization header
        if (config.key) {
            headers["Authorization"] = `Bearer ${config.key}`;
        }
        
        const response = await fetch(targetUrl, {
            method: "POST",
            headers,
            body: JSON.stringify({ 
                model: config.model || "gpt-3.5-turbo", 
                messages: payload, 
                temperature: 0.8 
            })
        });
        
        const data = await response.json();
        if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
        return data.choices?.[0]?.message?.content || "（API 回應格式異常）";
    } catch (err) { 
        return `（連線失敗：${err.message}）`; 
    }
}

// --- 8. 訊息渲染 ---
const msgInput = document.getElementById('msg-input');

const READ_STATUS_KEY = 'sx_chat_read_status';
const GREETING_CONFIG_KEY = 'sx_chat_greeting_config';
const LAST_GREETING_KEY = 'sx_chat_last_greeting';

function getReadStatus() {
    try {
        const raw = localStorage.getItem(READ_STATUS_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function saveReadStatus(status) {
    localStorage.setItem(READ_STATUS_KEY, JSON.stringify(status));
}

function getGreetingConfig() {
    try {
        const raw = localStorage.getItem(GREETING_CONFIG_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        return {
            enabled: parsed.enabled !== false,
            minInterval: parsed.minInterval || 30,
            maxInterval: parsed.maxInterval || 120,
            probability: parsed.probability || 0.3
        };
    } catch {
        return { enabled: true, minInterval: 30, maxInterval: 120, probability: 0.3 };
    }
}

function formatMessageTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

function formatTimeAgo(timestamp) {
    if (!timestamp) return '';
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return '剛剛';
    if (minutes < 60) return `${minutes}分鐘前`;
    if (hours < 24) return `${hours}小時前`;
    return `${days}天前`;
}

function calculateReadDelay(personality) {
    if (!personality) return 0;
    
    const lowerPersonality = personality.toLowerCase();
    
    let baseDelay = 5000;
    
    if (lowerPersonality.includes('忙碌') || lowerPersonality.includes('忙') || lowerPersonality.includes('工作狂')) {
        baseDelay = 30000 + Math.random() * 60000;
    } else if (lowerPersonality.includes('懶') || lowerPersonality.includes('悠閒')) {
        baseDelay = 10000 + Math.random() * 30000;
    } else if (lowerPersonality.includes('熱情') || lowerPersonality.includes('積極') || lowerPersonality.includes('主動')) {
        baseDelay = 1000 + Math.random() * 5000;
    } else if (lowerPersonality.includes('害羞') || lowerPersonality.includes('內向')) {
        baseDelay = 8000 + Math.random() * 20000;
    } else if (lowerPersonality.includes('高冷') || lowerPersonality.includes('冷漠')) {
        baseDelay = 20000 + Math.random() * 60000;
    } else if (lowerPersonality.includes('體貼') || lowerPersonality.includes('溫柔')) {
        baseDelay = 2000 + Math.random() * 8000;
    } else {
        baseDelay = 5000 + Math.random() * 25000;
    }
    
    return Math.floor(baseDelay);
}

function scheduleReadUpdate(msgId, delay) {
    setTimeout(() => {
        const readStatus = getReadStatus();
        readStatus[msgId] = { read: true, readAt: Date.now() };
        saveReadStatus(readStatus);
        
        const msgElement = document.querySelector(`[data-msg-id="${msgId}"]`);
        if (msgElement) {
            const unreadBadge = msgElement.querySelector('.unread-badge');
            if (unreadBadge) {
                unreadBadge.classList.add('read');
                unreadBadge.textContent = '';
            }
        }
    }, delay);
}

    function appendMsg(type, text, options = {}) {
    const chatFlow = document.getElementById('chat-flow');
    if (!chatFlow) return;
    const row = document.createElement('div');
    row.className = `msg-row ${type}`;
    
    const msgId = options.msgId || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    row.dataset.msgId = msgId;
    
    const timestamp = options.timestamp || Date.now();
    row.dataset.timestamp = timestamp;
    
    if (options.historyIndex !== undefined) {
        row.dataset.historyIndex = options.historyIndex;
    }
    if (options.splitIndex !== undefined) {
        row.dataset.splitIndex = options.splitIndex;
    }
    
    const currentCharConfig = getActiveConfig();
    const currentUserConfig = getUserConfig();
    
    const charAvatar = currentCharConfig.avatar || "default-avatar.png";
    const userAvatar = currentUserConfig.avatar || "default-user.png";
    const charName = currentCharConfig.name || 'AI 助理';
    const userName = currentUserConfig.name || 'User';

    let content = text;
    if (options.type === 'image' && options.url) {
        content = `<img src="${options.url}" alt="${options.name || 'emoji'}" style="max-width: 150px; max-height: 150px; border-radius: 8px; object-fit: contain;">`;
    } else if (content && typeof content === 'string') {
        // 清理無意義的換行，讓文字更易讀
        content = sanitizeLineBreaks(content);
    }
    
    const timeStr = formatMessageTime(timestamp);
    const readStatus = getReadStatus();
    const isRead = readStatus[msgId]?.read || false;
    
    let unreadBadge = '';
    if (type === 'mine' && !isRead) {
        unreadBadge = `<span class="unread-badge">1</span>`;
    } else if (type === 'mine' && isRead) {
        unreadBadge = `<span class="unread-badge read"></span>`;
    }

    if (type === 'other') {
        row.innerHTML = `
            <div class="avatar" style="background-image:url('${charAvatar}')"></div>
            <div class="bubble-group">
                <div class="user-name">${charName}</div>
                <div class="bubble">${content}</div>
                <div class="msg-meta">
                    <span class="msg-time">${timeStr}</span>
                </div>
            </div>`;
    } else {
        row.innerHTML = `
            <div class="bubble-group">
                <div class="user-name" style="text-align:right;">${userName}</div>
                <div style="display:flex; justify-content:flex-end; align-items:flex-end; gap:4px;">
                    <div class="msg-meta" style="display:flex; flex-direction:column; align-items:flex-end;">
                        ${unreadBadge}
                        <span class="msg-time">${timeStr}</span>
                    </div>
                    <div class="bubble">${content}</div>
                </div>
            </div>
            <div class="avatar" style="background-image:url('${userAvatar}'); margin-left:8px;"></div>`;
    }

    chatFlow.appendChild(row);
    chatFlow.scrollTop = chatFlow.scrollHeight;
    bindLongPress(row);
    
    if (type === 'mine' && !isRead) {
        const delay = calculateReadDelay(currentCharConfig.personality);
        scheduleReadUpdate(msgId, delay);
    }
}

    function bindLongPress(row) {
    const bubble = row.querySelector('.bubble');
    if (!bubble) return;

    const LONG_PRESS_MS = 520;
    let startX = 0;
    let startY = 0;

    const hideMenu = () => {
        clearTimeout(longClickTimer);
        longClickTimer = null;
    };

    const showMenu = (x, y) => {
        const menu = document.getElementById('context-menu');
        if (!menu) return;

        closeContextMenu();
        currentTargetMsg = row;
        bubble.classList.add('long-press-active');

        const menuWidth = 140;
        const menuHeight = 126;
        const maxX = window.innerWidth - menuWidth - 8;
        const maxY = window.innerHeight - menuHeight - 8;
        const left = Math.max(8, Math.min(x - menuWidth / 2, maxX));
        const top = Math.max(8, Math.min(y - 12, maxY));

        menu.style.left = `${left}px`;
        menu.style.top = `${top}px`;
        menu.style.display = 'flex';
        isMenuOpen = true;
        isProcessingLongPress = true;
        setTimeout(() => {
            isProcessingLongPress = false;
        }, 0);
    };

    const startPress = (e) => {
        hideMenu();
        const point = e.touches ? e.touches[0] : e;
        startX = point.clientX;
        startY = point.clientY;
        longClickTimer = setTimeout(() => {
            showMenu(point.clientX, point.clientY);
        }, LONG_PRESS_MS);
    };

    const movePress = (e) => {
        if (!longClickTimer) return;
        const point = e.touches ? e.touches[0] : e;
        const dx = Math.abs(point.clientX - startX);
        const dy = Math.abs(point.clientY - startY);
        if (dx > 12 || dy > 12) {
            hideMenu();
        }
    };

    const endPress = () => {
        hideMenu();
    };

    bubble.addEventListener('touchstart', startPress, { passive: true });
    bubble.addEventListener('touchmove', movePress, { passive: true });
    bubble.addEventListener('touchend', endPress);
    bubble.addEventListener('touchcancel', endPress);
    bubble.addEventListener('mousedown', startPress);
    bubble.addEventListener('mousemove', movePress);
    bubble.addEventListener('mouseup', endPress);
    bubble.addEventListener('mouseleave', endPress);
    bubble.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showMenu(e.clientX, e.clientY);
    });
}
function renderHistory() {
    const chatFlow = document.getElementById('chat-flow');
    if (!chatFlow) return;
    chatFlow.innerHTML = "";
    
    charConfig = getActiveConfig();
    userConfig = getUserConfig();
    
    console.log('[renderHistory] 角色名稱:', charConfig?.name, '用戶名稱:', userConfig?.name);
    
    const activeName = charConfig?.name || 'AI 助理';
    const notice = document.createElement('div');
    notice.className = 'system-notice';
    notice.innerHTML = `現在正與 <span id="hint-name">${activeName}</span> 對話中`;
    chatFlow.appendChild(notice);
    
    const history = JSON.parse(localStorage.getItem('sx_chat_history') || '[]');
    if (history.length === 0) {
        window.parent?.postMessage({
            type: 'MEMORY_REQUEST_HISTORY',
            payload: { limit: 8, source: 'chat:history-seed' }
        }, '*');
        return;
    }
    history.forEach((m, historyIdx) => {
        const type = m.role === 'user' ? 'mine' : 'other';
        const timestamp = m.timestamp || Date.now();
        if (m.imageUrl) {
            appendMsg(type, m.content, { type: 'image', url: m.imageUrl, name: m.content?.replace('[表情: ', '').replace(']', '') || 'emoji', timestamp, historyIndex: historyIdx });
        } else if (m.generationMode === 'multi' && Array.isArray(m.splitMessages) && m.splitMessages.length > 0) {
            m.splitMessages.forEach((msg, splitIdx) => {
                const trimmedMsg = msg.trim();
                if (trimmedMsg) {
                    appendMsg(type, trimmedMsg, { timestamp, historyIndex: historyIdx, splitIndex: splitIdx });
                }
            });
        } else {
            appendMsg(type, m.content, { timestamp, historyIndex: historyIdx });
        }
    });
    
    RandomGreetingSystem.start();
}

// --- 9. 訊息發送與 AI 生成觸發邏輯 (整理版) ---

/**
 * [功能 A] 純發送訊息：僅將文字貼到對話流，不觸發 AI
 */
function handleJustSend() {
    const val = msgInput.value.trim();
    if (!val) return;

    RandomGreetingSystem.updateActivity();

    appendMsg('mine', val, { timestamp: Date.now() });
    msgInput.value = '';

    let history = JSON.parse(localStorage.getItem('sx_chat_history') || '[]');
    history.push({ role: "user", content: val, timestamp: Date.now() });
    localStorage.setItem('sx_chat_history', JSON.stringify(history));
    window.parent?.postMessage({
        type: 'MEMORY_CHAT_EVENT',
        payload: { role: 'user', content: val, source: 'chat:manual' }
    }, '*');

    if (isPasskeyControlEnabled() && checkNsfwTopic(val)) {
        triggerPasskeyControlHandoff('nsfw_detected', { text: val });
    }

    let activeId = getActiveChatId();
    let sessions = loadChatSessions();
    
    if (!activeId || !sessions.find(s => s.id === activeId)) {
        let charName = localStorage.getItem('sx_char_name');
        if (!charName || charName === '預設用戶') {
            charName = charConfig.name || 'AI 助理';
        }
        const newSession = {
            id: `chat_${Date.now()}`,
            title: charName,
            charName: charName,
            charAvatar: localStorage.getItem('sx_char_avatar') || '',
            charPersonality: localStorage.getItem('sx_char_personality') || '',
            charBackground: localStorage.getItem('sx_char_background') || '',
            history: history
        };
        sessions.unshift(newSession);
        saveChatSessions(sessions);
        setActiveChatId(newSession.id);
        activeId = newSession.id;
    } else {
        const target = sessions.find(s => s.id === activeId);
        if (target) {
            target.history = history;
            if (!target.charName) {
                target.charName = localStorage.getItem('sx_char_name') || charConfig.name || 'AI 助理';
            }
            saveChatSessions(sessions);
        }
    }
}

/**
 * [功能 B] 觸發 AI 生成：點擊迴轉鈕 (#generate-trigger) 才送出訊號
 */
async function handleTriggerAI() {
    const genBtn = document.getElementById('generate-trigger');
    if (!genBtn) return;
    // 精準抓取內部的 i 標籤
    const icon = genBtn.querySelector('i');
    
    let history = JSON.parse(localStorage.getItem('sx_chat_history') || '[]');
    if (history.length === 0) return;
    
    const wbParts = (typeof window.getSerializedWorldbookParts === 'function')
                    ? window.getSerializedWorldbookParts()
                    : {};
    const forbiddenList = wbParts.sx_detected_forbidden || [];

    // --- 開始旋轉 ---
    if (icon) {
        icon.classList.add('rotating');
    } else {
        genBtn.classList.add('rotating'); // 備案：萬一 i 沒抓到，讓整個按鈕轉
    }

 try {
        const lastUserInput = history[history.length - 1].content;
        if (isPasskeyControlEnabled() && checkNsfwTopic(lastUserInput)) {
            triggerPasskeyControlHandoff('nsfw_detected', { text: lastUserInput });
        }
        const systemPrompt = await ChatEngine.assembleSystemPrompt(lastUserInput);
        const payload = [
            { role: "system", content: systemPrompt },
            ...ChatEngine.getHistorySlice()
        ];

        let aiReply = await callAIAPI(payload);
        aiReply = applyForbiddenGuard(aiReply, forbiddenList);
        aiReply = sanitizeEllipsis(aiReply);
        
        const generationMode = ChatEngine.getGenerationMode();
        if (generationMode === 'multi') {
            const messages = aiReply.split('|||SPLIT|||').filter(msg => msg.trim());
            for (const msg of messages) {
                const trimmedMsg = msg.trim();
                if (trimmedMsg) {
                    appendMsg('other', trimmedMsg);
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
            }
            const combinedReply = messages.join('\n');
            const freshHistory = JSON.parse(localStorage.getItem('sx_chat_history') || '[]');
            freshHistory.push({ role: "assistant", content: combinedReply, generationMode: 'multi', splitMessages: messages });
            localStorage.setItem('sx_chat_history', JSON.stringify(freshHistory));
            handleHouseInviteResponse(aiReply, freshHistory);
            window.parent?.postMessage({
                type: 'MEMORY_CHAT_EVENT',
                payload: { role: 'assistant', content: aiReply, source: 'chat:ai' }
            }, '*');
            
            let activeId = getActiveChatId();
            let sessions = loadChatSessions();
            if (!activeId || !sessions.find(s => s.id === activeId)) {
                let charName = localStorage.getItem('sx_char_name');
                if (!charName || charName === '預設用戶') {
                    charName = charConfig.name || 'AI 助理';
                }
                const newSession = {
                    id: `chat_${Date.now()}`,
                    title: charName,
                    charName: charName,
                    charAvatar: localStorage.getItem('sx_char_avatar') || '',
                    charPersonality: localStorage.getItem('sx_char_personality') || '',
                    charBackground: localStorage.getItem('sx_char_background') || '',
                    history: freshHistory
                };
                sessions.unshift(newSession);
                saveChatSessions(sessions);
                setActiveChatId(newSession.id);
            } else {
                const target = sessions.find(s => s.id === activeId);
                if (target) {
                    target.history = freshHistory;
                    if (!target.charName) {
                        target.charName = localStorage.getItem('sx_char_name') || charConfig.name || 'AI 助理';
                    }
                    saveChatSessions(sessions);
                }
            }
        } else {
            appendMsg('other', aiReply);
            const freshHistory = JSON.parse(localStorage.getItem('sx_chat_history') || '[]');
            freshHistory.push({ role: "assistant", content: aiReply });
            localStorage.setItem('sx_chat_history', JSON.stringify(freshHistory));
            handleHouseInviteResponse(aiReply, freshHistory);
            window.parent?.postMessage({
                type: 'MEMORY_CHAT_EVENT',
                payload: { role: 'assistant', content: aiReply, source: 'chat:ai' }
            }, '*');
            
            let activeId = getActiveChatId();
            let sessions = loadChatSessions();
            if (!activeId || !sessions.find(s => s.id === activeId)) {
                let charName = localStorage.getItem('sx_char_name');
                if (!charName || charName === '預設用戶') {
                    charName = charConfig.name || 'AI 助理';
                }
                const newSession = {
                    id: `chat_${Date.now()}`,
                    title: charName,
                    charName: charName,
                    charAvatar: localStorage.getItem('sx_char_avatar') || '',
                    charPersonality: localStorage.getItem('sx_char_personality') || '',
                    charBackground: localStorage.getItem('sx_char_background') || '',
                    history: freshHistory
                };
                sessions.unshift(newSession);
                saveChatSessions(sessions);
                setActiveChatId(newSession.id);
            } else {
                const target = sessions.find(s => s.id === activeId);
                if (target) {
                    target.history = freshHistory;
                    if (!target.charName) {
                        target.charName = localStorage.getItem('sx_char_name') || charConfig.name || 'AI 助理';
                    }
                    saveChatSessions(sessions);
                }
            }
        }
        
    } catch (error) {
        console.error("AI 生成出錯:", error);
    } finally {
        // --- 停止旋轉 ---
        if (icon) icon.classList.remove('rotating');
        genBtn.classList.remove('rotating');
    }
}
function applyForbiddenGuard(text, forbiddenList) {
    if (!forbiddenList || forbiddenList.length === 0) return text;
    let safeText = text;
    forbiddenList.forEach(word => {
        if (!word) return;
        const regex = new RegExp(word, 'gi');
        safeText = safeText.replace(regex, "███");
    });
    return safeText;
}

function sanitizeEllipsis(text) {
    return text
        .replace(/\.{2,}/g, '。')
        .replace(/。{2,}/g, '。')
        .replace(/…+/g, '。')
        .replace(/\.\.\.\.\.\.*/g, '。')
        .replace(/[.。][.。]+/g, '。')
        .replace(/(\s*\.\s*){2,}/g, '。')
        .replace(/「\s*」/g, '')
        .replace(/「\s*。/g, '「')
        .replace(/。\s*」/g, '。」');
}

/**
 * 清理文字中的無意義換行
 * - 移除開頭和結尾的空白行
 * - 將連續 3 個以上的換行合併為 2 個（保留段落分隔）
 * - 移除每行結尾的多餘空白
 */
function sanitizeLineBreaks(text) {
    if (!text || typeof text !== 'string') return text;
    
    return text
        // 移除每行結尾的空白
        .replace(/[ \t]+\n/g, '\n')
        // 移除每行結尾的空白（最後一行）
        .replace(/[ \t]+$/, '')
        // 將連續 3 個以上的換行合併為 2 個
        .replace(/\n{3,}/g, '\n\n')
        // 移除開頭的空白行
        .replace(/^\n+/, '')
        // 移除結尾的空白行
        .replace(/\n+$/, '');
}

const RandomGreetingSystem = {
    timer: null,
    lastUserActivity: Date.now(),
    greetingInterval: null,
    
    greetings: {
        friendly: [
            '在嗎？想你了～',
            '最近好嗎？',
            '有空嗎？想聊聊',
            '嘿！在忙什麼呢？',
            '想問你一件事',
            '突然想到你',
            '你還在嗎？',
            '有點無聊，想找人聊天'
        ],
        cold: [
            '嗯？',
            '有事嗎？',
            '在',
            '說吧'
        ],
        shy: [
            '那個...在嗎？',
            '不好意思打擾了...',
            '如果方便的話...',
            '那個...有點想找你聊天'
        ],
        busy: [
            '忙完了，有空嗎？',
            '終於有空了',
            '剛忙完，你在嗎？'
        ],
        caring: [
            '還好嗎？有點擔心你',
            '最近過得怎麼樣？',
            '記得照顧自己喔',
            '別太累了',
            '有好好吃飯嗎？'
        ],
        playful: [
            '嘿！猜猜我在想什麼？',
            '突然好想捉弄你一下',
            '你一定想不到我現在在做什麼',
            '要不要玩個遊戲？'
        ],
        romantic: [
            '在想你',
            '好想見你',
            '你今天過得好嗎？我一直在想你的事',
            '突然覺得好幸福，因為有你'
        ]
    },
    
    checkInMessages: [
        '好久沒聊天了，還好嗎？',
        '你好像很久沒回我了...',
        '是不是在忙呀？',
        '等你好久了～',
        '還在嗎？有點擔心',
        '怎麼消失了這麼久？'
    ],
    
    getPersonalityType(personality) {
        if (!personality) return 'friendly';
        const lower = personality.toLowerCase();
        
        if (lower.includes('冷漠') || lower.includes('高冷') || lower.includes('冷淡')) return 'cold';
        if (lower.includes('害羞') || lower.includes('內向') || lower.includes('靦腆')) return 'shy';
        if (lower.includes('忙碌') || lower.includes('忙') || lower.includes('工作狂')) return 'busy';
        if (lower.includes('體貼') || lower.includes('溫柔') || lower.includes('關心')) return 'caring';
        if (lower.includes('調皮') || lower.includes('愛玩') || lower.includes('活潑')) return 'playful';
        if (lower.includes('浪漫') || lower.includes('深情') || lower.includes('戀愛')) return 'romantic';
        
        return 'friendly';
    },
    
    selectGreeting(personality) {
        const type = this.getPersonalityType(personality);
        const greetings = this.greetings[type] || this.greetings.friendly;
        return greetings[Math.floor(Math.random() * greetings.length)];
    },
    
    selectCheckIn() {
        return this.checkInMessages[Math.floor(Math.random() * this.checkInMessages.length)];
    },
    
    shouldSendGreeting() {
        const config = getGreetingConfig();
        if (!config.enabled) return false;
        
        const lastGreeting = localStorage.getItem(LAST_GREETING_KEY);
        if (lastGreeting) {
            const elapsed = Date.now() - parseInt(lastGreeting);
            const minInterval = config.minInterval * 60 * 1000;
            if (elapsed < minInterval) return false;
        }
        
        return Math.random() < config.probability;
    },
    
    shouldCheckIn() {
        const inactiveTime = Date.now() - this.lastUserActivity;
        const thirtyMinutes = 30 * 60 * 1000;
        const twoHours = 2 * 60 * 60 * 1000;
        
        return inactiveTime > thirtyMinutes && inactiveTime < twoHours && Math.random() < 0.5;
    },
    
    async sendGreeting() {
        if (!this.shouldSendGreeting()) return;
        
        const charConfig = getActiveConfig();
        const greeting = this.selectGreeting(charConfig.personality);
        
        const history = JSON.parse(localStorage.getItem('sx_chat_history') || '[]');
        const lastMsg = history[history.length - 1];
        
        if (lastMsg && lastMsg.role === 'assistant') {
            const lastMsgTime = lastMsg.timestamp || 0;
            const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
            if (lastMsgTime > fiveMinutesAgo) return;
        }
        
        appendMsg('other', greeting, { timestamp: Date.now() });
        history.push({ role: 'assistant', content: greeting, timestamp: Date.now() });
        localStorage.setItem('sx_chat_history', JSON.stringify(history));
        
        localStorage.setItem(LAST_GREETING_KEY, Date.now().toString());
        
        const activeId = getActiveChatId();
        if (activeId) {
            const sessions = loadChatSessions();
            const target = sessions.find(s => s.id === activeId);
            if (target) {
                target.history = history;
                saveChatSessions(sessions);
            }
        }
        
        console.log('[Greeting] 已發送隨機問候:', greeting);
    },
    
    async sendCheckIn() {
        if (!this.shouldCheckIn()) return;
        
        const charConfig = getActiveConfig();
        const checkIn = this.selectCheckIn();
        
        const history = JSON.parse(localStorage.getItem('sx_chat_history') || '[]');
        appendMsg('other', checkIn, { timestamp: Date.now() });
        history.push({ role: 'assistant', content: checkIn, timestamp: Date.now() });
        localStorage.setItem('sx_chat_history', JSON.stringify(history));
        
        const activeId = getActiveChatId();
        if (activeId) {
            const sessions = loadChatSessions();
            const target = sessions.find(s => s.id === activeId);
            if (target) {
                target.history = history;
                saveChatSessions(sessions);
            }
        }
        
        console.log('[Greeting] 已發送用戶長時間未回覆提醒:', checkIn);
    },
    
    updateActivity() {
        this.lastUserActivity = Date.now();
    },
    
    start() {
        const config = getGreetingConfig();
        if (!config.enabled) return;
        
        const intervalMinutes = (config.minInterval + config.maxInterval) / 2;
        const intervalMs = intervalMinutes * 60 * 1000;
        
        this.greetingInterval = setInterval(() => {
            this.sendGreeting();
            this.sendCheckIn();
        }, intervalMs);
        
        console.log('[Greeting] 隨機問候系統已啟動，間隔:', intervalMinutes, '分鐘');
    },
    
    stop() {
        if (this.greetingInterval) {
            clearInterval(this.greetingInterval);
            this.greetingInterval = null;
        }
        console.log('[Greeting] 隨機問候系統已停止');
    }
};

function initGreetingSettings() {
    const toggle = document.getElementById('greeting-toggle');
    const status = document.getElementById('greeting-status');
    const probabilityInput = document.getElementById('greeting-probability');
    const minIntervalInput = document.getElementById('greeting-min-interval');
    const maxIntervalInput = document.getElementById('greeting-max-interval');
    
    if (!toggle) return;
    
    const config = getGreetingConfig();
    toggle.checked = config.enabled;
    if (status) status.textContent = config.enabled ? '已啟用隨機問候' : '關閉時不會主動發送';
    
    if (probabilityInput) probabilityInput.value = Math.round(config.probability * 100);
    if (minIntervalInput) minIntervalInput.value = config.minInterval;
    if (maxIntervalInput) maxIntervalInput.value = config.maxInterval;
    
    const saveSettings = () => {
        const settings = {
            enabled: toggle.checked,
            probability: (parseInt(probabilityInput?.value) || 30) / 100,
            minInterval: parseInt(minIntervalInput?.value) || 30,
            maxInterval: parseInt(maxIntervalInput?.value) || 120
        };
        
        localStorage.setItem(GREETING_CONFIG_KEY, JSON.stringify(settings));
        
        if (status) status.textContent = settings.enabled ? '已啟用隨機問候' : '關閉時不會主動發送';
        
        RandomGreetingSystem.stop();
        if (settings.enabled) {
            RandomGreetingSystem.start();
        }
    };
    
    toggle.addEventListener('change', saveSettings);
    probabilityInput?.addEventListener('change', saveSettings);
    minIntervalInput?.addEventListener('change', saveSettings);
    maxIntervalInput?.addEventListener('change', saveSettings);
}

// 關係距離設定初始化
const MEETUP_MENTION_KEY = 'sx_meetup_mention_enabled';
const RELATIONSHIP_DISTANCE_KEY = 'sx_relationship_distance';

function initRelationshipDistanceSettings() {
    const toggle = document.getElementById('meetup-mention-toggle');
    const status = document.getElementById('meetup-mention-status');
    const distanceSelect = document.getElementById('relationship-distance');
    
    if (!toggle) return;
    
    // 載入保存的設定
    const meetupEnabled = localStorage.getItem(MEETUP_MENTION_KEY) !== 'false';
    const distance = localStorage.getItem(RELATIONSHIP_DISTANCE_KEY) || 'moderate';
    
    toggle.checked = meetupEnabled;
    if (distanceSelect) distanceSelect.value = distance;
    
    const updateStatus = () => {
        if (status) {
            status.textContent = toggle.checked ? '角色可能會提及見面' : '角色不會主動提見面';
        }
    };
    updateStatus();
    
    const saveSettings = () => {
        localStorage.setItem(MEETUP_MENTION_KEY, toggle.checked ? 'true' : 'false');
        if (distanceSelect) {
            localStorage.setItem(RELATIONSHIP_DISTANCE_KEY, distanceSelect.value);
        }
        updateStatus();
        console.log('[Chat] 關係距離設定已保存:', {
            meetupMentionEnabled: toggle.checked,
            distance: distanceSelect?.value
        });
    };
    
    toggle.addEventListener('change', saveSettings);
    distanceSelect?.addEventListener('change', saveSettings);
}

function handleHouseInviteResponse(aiReply, history) {
    const lastUserMsg = [...history].reverse().find(m => m.role === 'user' && m.type === 'house_invite');
    if (!lastUserMsg) return;
    
    const agreePatterns = [
        /好[啊呀吧]?[！!]?$/,
        /我願意/,
        /願意[啊呀吧]?[！!]?$/,
        /可以[啊呀吧]?[！!]?$/,
        /沒問題/,
        /好啊[！!]?$/,
        /好呀[！!]?$/,
        /當然/,
        /一起住/,
        /一起買/,
        /太好了/,
        /好喜歡/
    ];
    
    const rejectPatterns = [
        /不要[啊呀吧]?[！!]?$/,
        /不行/,
        /不方便/,
        /再說/,
        /考慮/,
        /還是不要/,
        /暫時/,
        /以後再說/
    ];
    
    const isAgree = agreePatterns.some(p => p.test(aiReply));
    const isReject = rejectPatterns.some(p => p.test(aiReply));
    
    if (isAgree && !isReject) {
        const pendingInvite = JSON.parse(localStorage.getItem('sx_pending_house_invite') || 'null');
        if (pendingInvite) {
            const chars = JSON.parse(localStorage.getItem('sx_characters') || '[]');
            let charIdx = pendingInvite.charIdx;
            
            if (charIdx === undefined || charIdx === null) {
                const session = getActiveSession();
                const charName = session?.charName || pendingInvite.charName;
                charIdx = chars.findIndex(c => c.name === charName);
            }
            
            if (charIdx >= 0 && charIdx < chars.length) {
                const homeData = JSON.parse(localStorage.getItem('sx_home_data') || '{}');
                if (!homeData.properties) homeData.properties = [];
                if (!homeData.placedFurniture) homeData.placedFurniture = { 
                    user: {
                        living_room: [],
                        bedroom: [],
                        bathroom: [],
                        study: [],
                        kitchen: [],
                        balcony: []
                    }
                };
                
                const roomKey = `shared_${charIdx}_${Date.now()}`;
                const property = {
                    type: 'shared',
                    charIdx: charIdx,
                    roomKey: roomKey,
                    createdAt: Date.now()
                };
                
                homeData.properties.push(property);
                homeData.placedFurniture[roomKey] = {
                    living_room: [],
                    bedroom: [],
                    bathroom: [],
                    study: [],
                    kitchen: [],
                    balcony: []
                };
                
                localStorage.setItem('sx_home_data', JSON.stringify(homeData));
                localStorage.removeItem('sx_pending_house_invite');
                
                console.log('[HouseInvite] TA 同意一起買房，已建立共同房產');
            }
        }
    } else if (isReject) {
        localStorage.removeItem('sx_pending_house_invite');
        console.log('[HouseInvite] TA 拒絕了買房邀請');
    }
}
// --- 事件綁定 ---

// 2. 綁定鍵盤 Enter 鍵：執行 handleJustSend
if (msgInput) {
    msgInput.addEventListener('keydown', (e) => {
        if (e.isComposing || e.keyCode === 229) return;
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleJustSend();
        }
    });
}
// --- 10. 訊息選單功能 ---
window.deleteMsg = (e) => {
    e.stopPropagation();
    if (!currentTargetMsg) return;
    const chatFlow = document.getElementById('chat-flow');
    if (!chatFlow) return;
    
    const historyIndex = currentTargetMsg.dataset.historyIndex;
    const splitIndex = currentTargetMsg.dataset.splitIndex;
    
    let history = JSON.parse(localStorage.getItem('sx_chat_history') || '[]');
    
    if (historyIndex !== undefined) {
        const hIdx = parseInt(historyIndex, 10);
        const historyItem = history[hIdx];
        
        if (splitIndex !== undefined && historyItem?.generationMode === 'multi' && Array.isArray(historyItem.splitMessages)) {
            const sIdx = parseInt(splitIndex, 10);
            historyItem.splitMessages.splice(sIdx, 1);
            
            if (historyItem.splitMessages.length === 0) {
                history.splice(hIdx, 1);
            } else {
                historyItem.content = historyItem.splitMessages.join('\n\n');
            }
        } else {
            history.splice(hIdx, 1);
        }
        
        localStorage.setItem('sx_chat_history', JSON.stringify(history));
        
        const activeId = getActiveChatId();
        if (activeId) {
            const sessions = loadChatSessions();
            const target = sessions.find(s => s.id === activeId);
            if (target) {
                target.history = history;
                saveChatSessions(sessions);
            }
        }
        
        renderHistory();
    }
    
    closeContextMenu();
};

window.copyText = async (e) => {
    e.stopPropagation();
    if (!currentTargetMsg) return;
    const bubble = currentTargetMsg.querySelector('.bubble');
    const text = bubble?.innerText?.trim() || '';
    if (!text) {
        closeContextMenu();
        return;
    }

    try {
        await navigator.clipboard.writeText(text);
    } catch (err) {
        const temp = document.createElement('textarea');
        temp.value = text;
        temp.style.position = 'fixed';
        temp.style.opacity = '0';
        document.body.appendChild(temp);
        temp.focus();
        temp.select();
        document.execCommand('copy');
        temp.remove();
    }
    closeContextMenu();
};

window.triggerRegen = async (e) => {
    e.stopPropagation();
    closeContextMenu();

    let history = JSON.parse(localStorage.getItem('sx_chat_history') || '[]');
    if (history.length === 0) return;
    if (history[history.length - 1]?.role !== 'assistant') return;

    history.pop();
    localStorage.setItem('sx_chat_history', JSON.stringify(history));

    const activeId = getActiveChatId();
    if (activeId) {
        const sessions = loadChatSessions();
        const target = sessions.find(s => s.id === activeId);
        if (target) {
            target.history = history;
            saveChatSessions(sessions);
        }
    }

    renderHistory();
    await handleTriggerAI();
};

window.editMsg = (e) => {
    e.stopPropagation();
    if (!currentTargetMsg) return;
    
    const bubble = currentTargetMsg.querySelector('.bubble');
    if (!bubble) {
        closeContextMenu();
        return;
    }
    
    const isEditing = bubble.getAttribute('contenteditable') === 'true';
    if (isEditing) {
        closeContextMenu();
        return;
    }
    
    const originalText = bubble.innerText?.trim() || '';
    bubble.setAttribute('contenteditable', 'true');
    bubble.classList.add('editing');
    bubble.focus();
    
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(bubble);
    selection.removeAllRanges();
    selection.addRange(range);
    
    const saveEdit = () => {
        const newText = bubble.innerText?.trim() || originalText;
        bubble.setAttribute('contenteditable', 'false');
        bubble.classList.remove('editing');
        
        if (newText !== originalText) {
            const historyIndex = currentTargetMsg.dataset.historyIndex;
            const splitIndex = currentTargetMsg.dataset.splitIndex;
            
            let history = JSON.parse(localStorage.getItem('sx_chat_history') || '[]');
            
            if (historyIndex !== undefined) {
                const hIdx = parseInt(historyIndex, 10);
                const historyItem = history[hIdx];
                
                if (splitIndex !== undefined && historyItem?.generationMode === 'multi' && Array.isArray(historyItem.splitMessages)) {
                    const sIdx = parseInt(splitIndex, 10);
                    historyItem.splitMessages[sIdx] = newText;
                    historyItem.content = historyItem.splitMessages.join('\n\n');
                } else if (historyItem) {
                    historyItem.content = newText;
                }
                
                localStorage.setItem('sx_chat_history', JSON.stringify(history));
                
                const activeId = getActiveChatId();
                if (activeId) {
                    const sessions = loadChatSessions();
                    const target = sessions.find(s => s.id === activeId);
                    if (target) {
                        target.history = history;
                        saveChatSessions(sessions);
                    }
                }
            }
        }
        
        bubble.removeEventListener('blur', saveEdit);
        bubble.removeEventListener('keydown', handleKeydown);
    };
    
    const handleKeydown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            bubble.blur();
        }
        if (e.key === 'Escape') {
            bubble.innerText = originalText;
            bubble.blur();
        }
    };
    
    bubble.addEventListener('blur', saveEdit);
    bubble.addEventListener('keydown', handleKeydown);
    
    closeContextMenu();
};

// --- 11. API 設定初始化 (手機/iOS 兼容) ---
function initAPISettings() {
    const saveBtn = document.getElementById('save-api');
    const urlInput = document.getElementById('api-url');
    const keyInput = document.getElementById('api-key');
    const modelInput = document.getElementById('api-model');
    
    if(!saveBtn || !urlInput || !keyInput || !modelInput) return;

    try {
        const apis = JSON.parse(localStorage.getItem('api_configs') || '[]');
        if(apis[0]){
            urlInput.value = apis[0].url || '';
            keyInput.value = apis[0].key || '';
            modelInput.value = apis[0].model || 'gpt-3.5-turbo';
        }
    } catch(e){ console.warn('API 配置解析錯誤', e); }

    const saveHandler = (e) => {
        e.stopPropagation();
        const config = {
            url: urlInput.value.trim(),
            key: keyInput.value.trim(),
            model: modelInput.value.trim() || 'gpt-3.5-turbo'
        };
        try {
            localStorage.setItem('api_configs', JSON.stringify([config]));
            alert('API 配置已儲存 ✅');
        } catch(e){
            alert('儲存失敗，請確認瀏覽器允許 localStorage');
            console.error(e);
        }
    };

    saveBtn.addEventListener('click', saveHandler);
    saveBtn.addEventListener('touchend', saveHandler);
}
function handleBack() {
    console.log("正在執行返回與同步邏輯...");

    // 1. 視覺動畫
    document.body.style.transition = 'all 0.3s ease';
    document.body.style.opacity = '0';
    document.body.style.transform = 'scale(0.95)';

    // 2. 資料收集與同步
    try {
        // 先收集當前的設定值 (保留您提到的讀取 settings 元素邏輯)
        const lang = document.getElementById('langSelect')?.value;
        const region = document.getElementById('regionInput')?.value;
        const userName = document.getElementById('userNameInput')?.value;

        if (lang) localStorage.setItem('sxiphone_lang', lang);
        if (region) localStorage.setItem('sxiphone_region', region);
        if (userName) localStorage.setItem('sx_user_name', userName);

        // 封裝所有資料到 payload (包含關鍵的頭貼)
        const currentPayload = {
            masks: JSON.parse(localStorage.getItem('sx_masks') || '[]'),
            api_configs: JSON.parse(localStorage.getItem('api_configs') || '[]'),
            chat_history: JSON.parse(localStorage.getItem('sx_chat_history') || '[]'),
            user_name: localStorage.getItem('sx_user_name') || 'User',
            user_avatar: localStorage.getItem('sx_user_avatar') || '',
            lang: localStorage.getItem('sxiphone_lang') || '',
            region: localStorage.getItem('sxiphone_region') || ''
        };

        if (typeof UserEnv !== 'undefined' && UserEnv.isIOS()) {
            window.iosTempData = currentPayload;
            console.log("iOS 數據封裝完成");
        }

        // 3. 執行傳輸邏輯
        const isIframe = window.parent && window.parent !== window;
        if (isIframe) {
            // 發送指令給 iOS App 容器，並帶上完整的 payload
            window.parent.postMessage({
                type: 'closeApp',
                appId: 'chat', // 統一代碼為 chat
                payload: currentPayload
            }, '*');
            console.log("已通過 postMessage 發送 closeApp");
        } else {
            // 非容器環境：跳轉
            setTimeout(() => {
                window.location.replace("../index.html");
            }, 300);
        }

    } catch (e) {
        console.error("同步或返回過程發生錯誤:", e);
    }
}

// --- 12. 語音通話功能 ---
const VoiceCallEngine = {
    settings: null,
    isActive: false,
    isMuted: false,
    isSpeaker: false,
    mediaStream: null,
    mediaRecorder: null,
    audioChunks: [],
    timerInterval: null,
    callStartTime: 0,
    callTranscript: [],
    callTtsAudioBlobs: [],

    loadSettings() {
        try {
            const raw = localStorage.getItem('sx_voice_settings');
            if (!raw) return null;
            return JSON.parse(raw);
        } catch {
            return null;
        }
    },

    isReady() {
        const s = this.loadSettings();
        return !!(s && s.sttApiUrl && s.sttApiKey && s.ttsApiUrl && s.ttsApiKey);
    },

    async startCall() {
        if (this.isActive) return;
        this.settings = this.loadSettings();
        if (!this.isReady()) {
            alert('請先到 Settings 設定 STT 與 TTS 服務');
            return;
        }

        this.isActive = true;
        this.isMuted = false;
        this.isSpeaker = false;
        this.callStartTime = Date.now();
        this.callTranscript = [];
        this.callTtsAudioBlobs = [];

        const panel = document.getElementById('voice-call-panel');
        const statusText = document.getElementById('call-status-text');
        const startBtn = document.getElementById('voice-call-start');
        const endBtn = document.getElementById('voice-call-end');
        const transcript = document.getElementById('voice-call-transcript');
        const timerEl = document.getElementById('call-timer');

        if (panel) panel.classList.add('active');
        if (startBtn) startBtn.classList.add('hidden');
        if (endBtn) endBtn.classList.remove('hidden');
        if (statusText) statusText.textContent = '正在連線...';
        if (transcript) transcript.innerHTML = '';

        this.startTimer(timerEl);

        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (statusText) statusText.textContent = '通話中';
            this.startListening();
        } catch (err) {
            if (statusText) statusText.textContent = `無法存取麥克風：${err.message}`;
            this.endCall();
        }
    },

    startTimer(timerEl) {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.callStartTime) / 1000);
            const min = String(Math.floor(elapsed / 60)).padStart(2, '0');
            const sec = String(elapsed % 60).padStart(2, '0');
            if (timerEl) timerEl.textContent = `${min}:${sec}`;
        }, 1000);
    },

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    },

    startListening() {
        if (!this.mediaStream || !this.isActive) return;

        this.audioChunks = [];
        const options = { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4' };
        this.mediaRecorder = new MediaRecorder(this.mediaStream, options);

        this.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) this.audioChunks.push(e.data);
        };

        this.mediaRecorder.onstop = async () => {
            if (!this.isActive) return;

            const audioBlob = new Blob(this.audioChunks, { type: options.mimeType });
            const userText = await this.sendToSTT(audioBlob);

            if (userText && this.isActive) {
                this.addTranscript('user', userText);
                appendMsg('mine', userText);
                let history = JSON.parse(localStorage.getItem('sx_chat_history') || '[]');
                history.push({ role: 'user', content: userText });
                localStorage.setItem('sx_chat_history', JSON.stringify(history));
                const activeId = getActiveChatId();
                if (activeId) {
                    const sessions = loadChatSessions();
                    const target = sessions.find(s => s.id === activeId);
                    if (target) { target.history = history; saveChatSessions(sessions); }
                }

                const statusText = document.getElementById('call-status-text');
                if (statusText) statusText.textContent = '對方正在思考...';

                const thinkDelay = this.settings?.voiceThinkDelay || 1.5;
                await new Promise(r => setTimeout(r, thinkDelay * 1000));

                if (!this.isActive) return;

                const charReply = await this.getAIReply(userText);

                if (charReply && this.isActive) {
                    this.addTranscript('char', charReply);
                    appendMsg('other', charReply);
                    history = JSON.parse(localStorage.getItem('sx_chat_history') || '[]');
                    history.push({ role: 'assistant', content: charReply });
                    localStorage.setItem('sx_chat_history', JSON.stringify(history));
                    if (activeId) {
                        const sessions = loadChatSessions();
                        const target = sessions.find(s => s.id === activeId);
                        if (target) { target.history = history; saveChatSessions(sessions); }
                    }

                    if (this.settings?.voiceAutoTts !== false) {
                        await this.sendToTTS(charReply);
                    }
                }

                if (statusText) statusText.textContent = '通話中';
            }

            if (this.isActive) {
                this.audioChunks = [];
                setTimeout(() => this.startListening(), 300);
            }
        };

        this.mediaRecorder.start();
        setTimeout(() => {
            if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                this.mediaRecorder.stop();
            }
        }, 5000);
    },

    addTranscript(role, text) {
        this.callTranscript.push({ role, text, timestamp: Date.now() });
        const transcript = document.getElementById('voice-call-transcript');
        if (!transcript) return;
        const emptyEl = transcript.querySelector('.transcript-empty');
        if (emptyEl) emptyEl.remove();

        const entry = document.createElement('div');
        entry.className = `transcript-entry ${role === 'user' ? 'transcript-user' : 'transcript-char'}`;
        entry.textContent = text;
        transcript.appendChild(entry);
        transcript.scrollTop = transcript.scrollHeight;
    },

    async sendToSTT(audioBlob) {
        if (!this.settings) return null;
        try {
            const formData = new FormData();
            formData.append('file', audioBlob, 'recording.webm');
            formData.append('model', this.settings.sttModel || 'whisper-1');
            if (this.settings.sttLanguage) {
                formData.append('language', this.settings.sttLanguage);
            }
            const response = await fetch(this.settings.sttApiUrl, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.settings.sttApiKey}` },
                body: formData
            });
            const result = await response.json();
            return result.text || null;
        } catch (err) {
            console.warn('STT 請求失敗:', err);
            return null;
        }
    },

    async getAIReply(userInput) {
        try {
            const systemPrompt = await ChatEngine.assembleSystemPrompt(userInput);
            const payload = [
                { role: 'system', content: systemPrompt },
                ...ChatEngine.getHistorySlice()
            ];
            return await callAIAPI(payload);
        } catch (err) {
            console.warn('AI 回覆失敗:', err);
            return null;
        }
    },

    async sendToTTS(text) {
        if (!this.settings) return;
        const statusText = document.getElementById('call-status-text');
        const transcript = document.getElementById('voice-call-transcript');
        
        try {
            if (statusText) statusText.textContent = '對方正在說話...';
            
            await UnifiedSpeechService.speakText(text, {
                onDisplayText: (displayText, wasTranslated) => {
                    if (transcript) {
                        const emptyEl = transcript.querySelector('.transcript-empty');
                        if (emptyEl) emptyEl.remove();
                        
                        const entry = document.createElement('div');
                        entry.className = 'transcript-entry transcript-char';
                        
                        if (wasTranslated) {
                            entry.innerHTML = `
                                <div class="transcript-original">${text}</div>
                                <div class="transcript-translated">↳ ${displayText}</div>
                            `;
                        } else {
                            entry.textContent = text;
                        }
                        
                        transcript.appendChild(entry);
                        transcript.scrollTop = transcript.scrollHeight;
                    }
                }
            });

            if (statusText) statusText.textContent = '通話中';
        } catch (err) {
            console.warn('TTS 播放失敗:', err);
            if (statusText) statusText.textContent = '通話中';
        }
    },

    endCall() {
        this.isActive = false;
        this.stopTimer();

        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            try { this.mediaRecorder.stop(); } catch {}
        }
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }

        if (this.callTranscript.length > 0 || this.callTtsAudioBlobs.length > 0) {
            this.saveCallRecording();
        }

        const panel = document.getElementById('voice-call-panel');
        const startBtn = document.getElementById('voice-call-start');
        const endBtn = document.getElementById('voice-call-end');
        const timerEl = document.getElementById('call-timer');
        const statusText = document.getElementById('call-status-text');

        if (startBtn) startBtn.classList.remove('hidden');
        if (endBtn) endBtn.classList.add('hidden');
        if (timerEl) timerEl.textContent = '00:00';
        if (statusText) statusText.textContent = '通話結束';

        setTimeout(() => {
            if (panel) panel.classList.remove('active');
        }, 1500);
    },

    async saveCallRecording() {
        const RECORDINGS_KEY = 'sx_voice_call_recordings';
        const duration = Math.floor((Date.now() - this.callStartTime) / 1000);
        const charName = localStorage.getItem('sx_char_name') || '未知';

        let audioData = null;
        if (this.callTtsAudioBlobs.length > 0) {
            try {
                const combined = new Blob(this.callTtsAudioBlobs, { type: 'audio/webm' });
                audioData = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = () => resolve(null);
                    reader.readAsDataURL(combined);
                });
            } catch (err) {
                console.warn('錄音資料轉換失敗:', err);
            }
        }

        const recording = {
            id: `rec-${Date.now()}`,
            charName,
            timestamp: this.callStartTime,
            duration,
            audioData,
            mimeType: 'audio/webm',
            transcript: this.callTranscript.slice()
        };

        let recordings = [];
        try {
            const raw = localStorage.getItem(RECORDINGS_KEY);
            recordings = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(recordings)) recordings = [];
        } catch { recordings = []; }

        recordings.unshift(recording);
        if (recordings.length > 100) recordings.pop();
        localStorage.setItem(RECORDINGS_KEY, JSON.stringify(recordings));

        this.callTranscript = [];
        this.callTtsAudioBlobs = [];
    },

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.mediaStream) {
            this.mediaStream.getAudioTracks().forEach(track => {
                track.enabled = !this.isMuted;
            });
        }
        const muteBtn = document.getElementById('voice-call-mute');
        if (muteBtn) {
            muteBtn.innerHTML = this.isMuted
                ? '<i class="fas fa-microphone-slash"></i>'
                : '<i class="fas fa-microphone"></i>';
            muteBtn.classList.toggle('active', this.isMuted);
        }
    },

    toggleSpeaker() {
        this.isSpeaker = !this.isSpeaker;
        const speakerBtn = document.getElementById('voice-call-speaker');
        if (speakerBtn) {
            speakerBtn.innerHTML = this.isSpeaker
                ? '<i class="fas fa-volume-up"></i>'
                : '<i class="fas fa-volume-down"></i>';
            speakerBtn.classList.toggle('active', this.isSpeaker);
        }
    }
};

// 語音通話事件綁定
document.addEventListener('DOMContentLoaded', () => {
    const voiceCallStartBtn = document.getElementById('voice-call-start');
    const voiceCallEndBtn = document.getElementById('voice-call-end');
    const voiceCallMuteBtn = document.getElementById('voice-call-mute');
    const voiceCallSpeakerBtn = document.getElementById('voice-call-speaker');
    const voiceGotoSettingsBtn = document.getElementById('voice-goto-settings');
    const voiceCallPanel = document.getElementById('voice-call-panel');

    if (voiceCallStartBtn) {
        voiceCallStartBtn.addEventListener('click', () => VoiceCallEngine.startCall());
    }

    if (voiceCallEndBtn) {
        voiceCallEndBtn.addEventListener('click', () => VoiceCallEngine.endCall());
    }

    if (voiceCallMuteBtn) {
        voiceCallMuteBtn.addEventListener('click', () => VoiceCallEngine.toggleMute());
    }

    if (voiceCallSpeakerBtn) {
        voiceCallSpeakerBtn.addEventListener('click', () => VoiceCallEngine.toggleSpeaker());
    }

    if (voiceGotoSettingsBtn) {
        voiceGotoSettingsBtn.addEventListener('click', () => {
            window.parent?.postMessage({ type: 'openApp', appId: 'settings' }, '*');
        });
    }

    if (voiceCallPanel) {
        voiceCallPanel.addEventListener('click', (e) => {
            if (e.target === voiceCallPanel) {
                VoiceCallEngine.endCall();
            }
        });
    }

    const voiceCallSettingsHint = document.getElementById('voice-call-settings-hint');
    if (voiceCallSettingsHint) {
        const isReady = VoiceCallEngine.isReady();
        voiceCallSettingsHint.classList.toggle('hidden', isReady);
        if (voiceCallStartBtn) {
            voiceCallStartBtn.disabled = !isReady;
            if (!isReady) {
                voiceCallStartBtn.textContent = '尚未設定語音服務';
            } else {
                voiceCallStartBtn.innerHTML = '<i class="fas fa-phone"></i> 開始通話';
            }
        }
    }
});

const SHOP_PRODUCTS_KEY = 'sx_shop_products';
const SHOP_CART_KEY = 'sx_shop_cart';
const SHOP_SETTINGS_KEY = 'sx_shop_settings';

const adultKeywords = [
    '情趣', '成人', '性感', '內衣', '內褲', '情趣用品', '自慰', '按摩棒',
    '跳蛋', '潤滑', '保險套', '避孕', '性感內衣', '絲襪', '吊帶襪',
    '成人用品', '性玩具', '陰莖', '陰道', '肛塞', '飛機杯', '充氣娃娃',
    '情趣內衣', '開襠', '透明裝', '性感睡衣', '束縛', 'SM', '調教',
    '乳環', 'bdsm', '鞭子', '手銬', '眼罩', '蠟燭',
    'adult', 'sex', 'erotic', 'lingerie', 'vibrator', 'dildo', 'condom',
    'masturbat', 'intimate', 'sensual', ' bondage', 'fetish', 'toy',
    'nsfw', '18+', '色色', '做愛', '愛愛', '親熱', '床上', '晚上'
];

const nsfwConversationKeywords = [
    '情趣', '內衣', '性感', '睡衣', '絲襪', '床上', '親熱', '做愛', '愛愛',
    '晚上一起', '今晚', '脫', '摸', '舔', '咬', '敏感', '舒服',
    '想要你', '抱抱', '親親', '貼貼', '蹭蹭', '濕', '硬',
    '玩玩', '試試', '新花樣', '刺激', '興奮', '敏感帶',
    'nsfw', '18+', '色色', '開車', '飆車'
];

function isAdultProduct(product) {
    const title = (product.title || '').toLowerCase();
    const category = (product.category || '').toLowerCase();
    const combined = `${title} ${category}`;
    
    return adultKeywords.some(keyword => combined.includes(keyword.toLowerCase()));
}

function getShopSettings() {
    try {
        const raw = localStorage.getItem(SHOP_SETTINGS_KEY);
        if (raw) {
            return JSON.parse(raw);
        }
    } catch {}
    return { showAdultContent: false, allowAdultRecommend: false };
}

function checkUserAdultConsent() {
    const settings = getShopSettings();
    return settings.allowAdultRecommend === true;
}

let productRecommendPanel = null;
let productRecommendList = null;
let selectedRecommendProduct = null;
let recommendType = 'recommend';

function openProductRecommendPanel() {
    productRecommendPanel = document.getElementById('product-recommend-panel');
    productRecommendList = document.getElementById('product-recommend-list');
    const plusMenu = document.getElementById('plus-menu');
    
    if (!productRecommendPanel || !productRecommendList) return;
    
    plusMenu?.classList.remove('open');
    
    loadAndRenderProducts();
    
    productRecommendPanel.classList.add('active');
    
    const closeBtn = document.getElementById('product-recommend-close');
    const cancelBtn = document.getElementById('product-recommend-cancel');
    const sendBtn = document.getElementById('product-recommend-send');
    
    closeBtn?.addEventListener('click', closeProductRecommendPanel);
    cancelBtn?.addEventListener('click', closeProductRecommendPanel);
    sendBtn?.addEventListener('click', sendProductRecommend);
    
    const radioButtons = document.querySelectorAll('input[name="recommend-type"]');
    radioButtons.forEach(radio => {
        radio.addEventListener('change', (e) => {
            recommendType = e.target.value;
        });
    });
}

function closeProductRecommendPanel() {
    productRecommendPanel?.classList.remove('active');
    selectedRecommendProduct = null;
}

function loadAndRenderProducts() {
    let products = [];
    
    try {
        const raw = localStorage.getItem(SHOP_PRODUCTS_KEY);
        if (raw) {
            products = JSON.parse(raw);
        }
    } catch (e) {
        console.warn('Failed to load products', e);
    }
    
    if (products.length === 0) {
        products = generateDefaultProducts();
    }
    
    const userConsent = checkUserAdultConsent();
    if (!userConsent) {
        products = products.filter(p => !isAdultProduct(p));
    }
    
    renderProductList(products);
}

function generateDefaultProducts() {
    const defaultItems = [
        { id: 'default_1', title: '精選護膚組', price: 456, platform: 'coupang', category: '美妝', thumb: 'linear-gradient(135deg,#f093fb,#f5576c)' },
        { id: 'default_2', title: '潮流服飾', price: 328, platform: 'shopee', category: '服飾', thumb: 'linear-gradient(135deg,#667eea,#764ba2)' },
        { id: 'default_3', title: '無線耳機', price: 899, platform: 'amazon', category: '3C', thumb: 'linear-gradient(135deg,#5ee7df,#b490ca)' },
        { id: 'default_4', title: '居家收納', price: 199, platform: 'taobao', category: '家居', thumb: 'linear-gradient(135deg,#ff9a9e,#fecfef)' }
    ];
    
    return defaultItems;
}

function renderProductList(products) {
    if (!productRecommendList) return;
    
    productRecommendList.innerHTML = products.map(product => `
        <div class="product-recommend-item" data-product-id="${product.id}">
            <div class="product-recommend-thumb" style="background: ${product.thumb};"></div>
            <div class="product-recommend-info">
                <h4>${product.title}</h4>
                <p>NT$ ${product.price}</p>
                <span>${product.platform || '推薦'} · ${product.category || ''}</span>
            </div>
        </div>
    `).join('');
    
    const items = productRecommendList.querySelectorAll('.product-recommend-item');
    items.forEach(item => {
        item.addEventListener('click', () => {
            items.forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            selectedRecommendProduct = products.find(p => p.id === item.dataset.productId);
        });
    });
}

function sendProductRecommend() {
    if (!selectedRecommendProduct) {
        alert('請選擇一個商品');
        return;
    }
    
    const productCard = createProductCardHTML(selectedRecommendProduct, recommendType);
    
    appendMsg('other', productCard);
    
    const history = JSON.parse(localStorage.getItem('sx_chat_history') || '[]');
    history.push({ 
        role: 'assistant', 
        content: productCard,
        productData: selectedRecommendProduct,
        recommendType: recommendType
    });
    localStorage.setItem('sx_chat_history', JSON.stringify(history));
    
    const activeId = getActiveChatId();
    if (activeId) {
        const sessions = loadChatSessions();
        const target = sessions.find(s => s.id === activeId);
        if (target) {
            target.history = history;
            saveChatSessions(sessions);
        }
    }
    
    if (recommendType === 'order') {
        addToCart(selectedRecommendProduct);
    }
    
    closeProductRecommendPanel();
}

function createProductCardHTML(product, type) {
    const orderBadge = type === 'order' ? '<span class="product-order-badge">已為你下單</span>' : '';
    const message = type === 'order' 
        ? `我覺得這個不錯，已經幫你下單了！` 
        : `推薦你這個商品，看看喜不喜歡～`;
    
    const platformUrls = {
        amazon: 'https://www.amazon.com/s?k=',
        coupang: 'https://www.coupang.com/np/search?q=',
        shopee: 'https://shopee.tw/search?keyword=',
        taobao: 'https://s.taobao.com/search?q=',
        pinduoduo: 'https://mobile.yangkeduo.com/search_result.html?search_key=',
        mercari: 'https://www.mercari.com/jp/search/?keyword=',
        xianyu: 'https://www.goofish.com/search?q='
    };
    
    const platformConfig = platformUrls[product.platform];
    const externalUrl = product.sourceUrl || (platformConfig ? `${platformConfig}${encodeURIComponent(product.title)}` : null);
    const externalLink = externalUrl ? `<a href="${externalUrl}" target="_blank" class="product-external-link" onclick="event.stopPropagation()"><i class="fas fa-external-link-alt"></i> 前往平台</a>` : '';
    
    const isAdult = isAdultProduct(product);
    const shopSettings = getShopSettings();
    const showAdult = shopSettings.showAdultContent;
    const blurStyle = isAdult && !showAdult ? 'filter: blur(20px);' : '';
    const adultBadge = isAdult ? '<span style="position:absolute;top:8px;right:8px;background:rgba(239,68,68,0.9);color:#fff;font-size:10px;padding:2px 6px;border-radius:4px;">🔞</span>' : '';
    
    return `
        <div class="product-card-message" data-product-id="${product.id}" onclick="openProductDetail('${product.id}')">
            <div class="product-thumb" style="background: ${product.thumb}; ${blurStyle} position: relative;">
                ${adultBadge}
            </div>
            <h4>${product.title}</h4>
            <p>NT$ ${product.price}</p>
            <span>${product.platform || ''} · ${product.category || ''}</span>
            ${orderBadge}
        </div>
        <div style="margin-top:8px;color:#fff;font-size:13px;">${message}</div>
        ${externalLink}
    `;
}

function addToCart(product) {
    try {
        let cart = [];
        const raw = localStorage.getItem(SHOP_CART_KEY);
        if (raw) {
            cart = JSON.parse(raw);
        }
        
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.qty = (existingItem.qty || 1) + 1;
        } else {
            cart.push({ ...product, qty: 1 });
        }
        
        localStorage.setItem(SHOP_CART_KEY, JSON.stringify(cart));
        
        window.parent?.postMessage({
            type: 'SHOP_CART_UPDATED',
            payload: { product, action: 'add' }
        }, '*');
    } catch (e) {
        console.warn('Failed to add to cart', e);
    }
}

window.openProductDetail = function(productId) {
    window.parent?.postMessage({
        type: 'openApp',
        appId: 'taobao',
        payload: { productId: productId, action: 'viewDetail' }
    }, '*');
};

window.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || typeof data !== 'object') return;
    
    if (data.type === 'SHOP_SEND_PRODUCT_RECOMMEND') {
        selectedRecommendProduct = data.product;
        recommendType = data.recommendType || 'recommend';
        sendProductRecommend();
    }
    
    if (data.type === 'SHOP_PRODUCTS_UPDATED') {
        if (productRecommendPanel?.classList.contains('active')) {
            loadAndRenderProducts();
        }
    }

    if (data.type === 'GIFT_SENT_TO_CHAT') {
        const gift = data.gift;
        if (gift) {
            const giftBubbleHtml = `
                <div class="gift-message-bubble" style="background: ${gift.bg}; padding: 16px; border-radius: 16px; display: inline-block; min-width: 150px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 8px;">${gift.icon}</div>
                    <div style="font-weight: 600; color: #fff; font-size: 14px;">${gift.name}</div>
                    ${gift.message ? `<div style="font-size: 12px; color: rgba(255,255,255,0.9); margin-top: 6px; font-style: italic;">"${gift.message}"</div>` : ''}
                    <div style="font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 8px;">來自 ${gift.sender}</div>
                </div>
            `;
            appendMsg('mine', giftBubbleHtml);

            const history = JSON.parse(localStorage.getItem('sx_chat_history') || '[]');
            history.push({ 
                role: 'user', 
                content: `送出了禮物券「${gift.name}」${gift.message ? `，留言：「${gift.message}」` : ''}`
            });
            localStorage.setItem('sx_chat_history', JSON.stringify(history));

            const activeId = getActiveChatId();
            if (activeId) {
                const sessions = loadChatSessions();
                const target = sessions.find(s => s.id === activeId);
                if (target) {
                    target.history = history;
                    saveChatSessions(sessions);
                }
            }
        }
    }

    if (data.type === 'GIFT_SEND_TO_FAN') {
        const giftId = data.giftId;
        const senderName = data.senderName || '藝人';
        const anonymous = data.anonymous;
        const message = data.message || '';

        const giftCatalog = {
            'coffee_basic': { name: '美式咖啡券', icon: '☕', bg: 'linear-gradient(135deg, #8B4513 0%, #D2691E 100%)' },
            'bubble_tea': { name: '珍珠奶茶券', icon: '🧋', bg: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)' },
            'dessert': { name: '甜點券', icon: '🍰', bg: 'linear-gradient(135deg, #F48FB1 0%, #EC407A 100%)' },
            'birthday': { name: '生日禮物券', icon: '🎂', bg: 'linear-gradient(135deg, #F06292 0%, #E91E63 100%)' },
            'love': { name: '愛心禮物券', icon: '💝', bg: 'linear-gradient(135deg, #EF5350 0%, #C62828 100%)' }
        };

        const gift = giftCatalog[giftId] || { name: '神秘禮物', icon: '🎁', bg: 'linear-gradient(135deg, #666 0%, #999 100%)' };

        const giftBubbleHtml = `
            <div class="gift-message-bubble received" style="background: ${gift.bg}; padding: 16px; border-radius: 16px; display: inline-block; min-width: 150px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 8px;">${gift.icon}</div>
                <div style="font-weight: 600; color: #fff; font-size: 14px;">${gift.name}</div>
                ${message ? `<div style="font-size: 12px; color: rgba(255,255,255,0.9); margin-top: 6px; font-style: italic;">"${message}"</div>` : ''}
                <div style="font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 8px;">來自 ${anonymous ? '神秘人' : senderName}</div>
            </div>
        `;
        appendMsg('other', giftBubbleHtml);

        const history = JSON.parse(localStorage.getItem('sx_chat_history') || '[]');
        history.push({ 
            role: 'assistant', 
            content: `送給你「${gift.name}」${message ? `：「${message}」` : ''}`
        });
        localStorage.setItem('sx_chat_history', JSON.stringify(history));

        const activeId = getActiveChatId();
        if (activeId) {
            const sessions = loadChatSessions();
            const target = sessions.find(s => s.id === activeId);
            if (target) {
                target.history = history;
                saveChatSessions(sessions);
            }
        }
    }
});

const MEMORY_TABLE_KEY = 'sx_memory_tables';
const MEMORY_SETTINGS_KEY = 'sx_memory_table_settings';
let currentMemoryTableData = null;

function getMemoryTableSettings() {
    try {
        const raw = localStorage.getItem(MEMORY_SETTINGS_KEY);
        if (raw) return JSON.parse(raw);
    } catch {}
    return { autoGenerate: false, autoRounds: 20 };
}

function saveMemoryTableSettings(settings) {
    localStorage.setItem(MEMORY_SETTINGS_KEY, JSON.stringify(settings));
}

function getMemoryTables() {
    try {
        const raw = localStorage.getItem(MEMORY_TABLE_KEY);
        if (raw) return JSON.parse(raw);
    } catch {}
    return [];
}

function saveMemoryTables(tables) {
    localStorage.setItem(MEMORY_TABLE_KEY, JSON.stringify(tables));
}

function openMemoryTablePanel() {
    const panel = document.getElementById('memory-table-panel');
    const autoToggle = document.getElementById('auto-memory-toggle');
    const autoRoundsInput = document.getElementById('auto-memory-rounds');
    const autoRoundsRow = document.getElementById('auto-memory-rounds-row');
    const roundsInput = document.getElementById('memory-rounds-input');
    const preview = document.getElementById('memory-table-preview');
    const addBtn = document.getElementById('memory-add-btn');
    
    if (!panel) return;
    
    const settings = getMemoryTableSettings();
    if (autoToggle) autoToggle.checked = settings.autoGenerate;
    if (autoRoundsInput) autoRoundsInput.value = settings.autoRounds;
    if (roundsInput) roundsInput.value = 30;
    
    if (autoRoundsRow) {
        autoRoundsRow.classList.toggle('active', settings.autoGenerate);
    }
    
    if (preview) {
        preview.innerHTML = '<div class="memory-table-empty">點擊「生成記憶表格」開始</div>';
    }
    
    if (addBtn) addBtn.disabled = true;
    currentMemoryTableData = null;
    
    renderSavedMemoryTables();
    panel.classList.add('active');
}

function closeMemoryTablePanel() {
    const panel = document.getElementById('memory-table-panel');
    panel?.classList.remove('active');
}

function generateMemoryTable() {
    const roundsInput = document.getElementById('memory-rounds-input');
    const preview = document.getElementById('memory-table-preview');
    const addBtn = document.getElementById('memory-add-btn');
    
    const rounds = parseInt(roundsInput?.value) || 30;
    const history = JSON.parse(localStorage.getItem('sx_chat_history') || '[]');
    
    if (history.length === 0) {
        if (preview) {
            preview.innerHTML = '<div class="memory-table-empty">目前沒有對話記錄</div>';
        }
        return;
    }
    
    const recentHistory = history.slice(-rounds * 2);
    
    const memoryEntries = [];
    let currentTopic = '';
    let topicStart = 0;
    
    for (let i = 0; i < recentHistory.length; i += 2) {
        const userMsg = recentHistory[i];
        const aiMsg = recentHistory[i + 1];
        
        if (!userMsg || !aiMsg) continue;
        
        const userContent = String(userMsg.content || '').replace(/<[^>]*>/g, '').substring(0, 100);
        const aiContent = String(aiMsg.content || '').replace(/<[^>]*>/g, '').substring(0, 200);
        
        const keywords = extractKeywords(userContent + ' ' + aiContent);
        
        memoryEntries.push({
            round: Math.floor(i / 2) + 1,
            timestamp: new Date().toISOString(),
            userSummary: userContent.substring(0, 50) + (userContent.length > 50 ? '...' : ''),
            aiSummary: aiContent.substring(0, 80) + (aiContent.length > 80 ? '...' : ''),
            keywords: keywords,
            topic: currentTopic || '日常對話'
        });
    }
    
    currentMemoryTableData = {
        id: `memory_${Date.now()}`,
        createdAt: new Date().toISOString(),
        charName: charConfig?.name || getActiveConfig().name || 'AI 助理',
        userName: userConfig?.name || localStorage.getItem('sx_user_name') || 'User',
        entries: memoryEntries,
        rounds: rounds
    };
    
    renderMemoryTablePreview(currentMemoryTableData);
    
    if (addBtn) addBtn.disabled = false;
}

function extractKeywords(text) {
    const stopWords = ['的', '是', '了', '我', '你', '他', '她', '它', '我們', '你們', '他們', '這', '那', '有', '在', '不', '就', '也', '會', '能', '要', '可以', '什麼', '怎麼', '為什麼', '嗎', '呢', '吧', '啊', '嗯', '哦', '好', '對', '很', '都', '還', '但', '如果', '因為', '所以', '然後', '或者', '而且', '可是', '不過'];
    
    const words = text.split(/[\s,，。！？!?.;；：:""''「」【】\[\]()（）]+/);
    const filtered = words.filter(w => w.length >= 2 && !stopWords.includes(w));
    
    const uniqueWords = [...new Set(filtered)];
    return uniqueWords.slice(0, 5).join(', ');
}

function renderMemoryTablePreview(data) {
    const preview = document.getElementById('memory-table-preview');
    if (!preview || !data) return;
    
    let html = `
        <div class="memory-table-content">
            <table>
                <thead>
                    <tr>
                        <th>輪次</th>
                        <th>${sanitizeText(data.userName)} 說</th>
                        <th>${sanitizeText(data.charName)} 回應</th>
                        <th>關鍵字</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    data.entries.forEach(entry => {
        html += `
            <tr>
                <td>${entry.round}</td>
                <td>${sanitizeText(entry.userSummary)}</td>
                <td>${sanitizeText(entry.aiSummary)}</td>
                <td>${sanitizeText(entry.keywords)}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table></div>';
    preview.innerHTML = html;
}

function addMemoryToLongTerm() {
    if (!currentMemoryTableData) return;
    
    const tables = getMemoryTables();
    tables.unshift(currentMemoryTableData);
    saveMemoryTables(tables);
    
    renderSavedMemoryTables();
    
    const addBtn = document.getElementById('memory-add-btn');
    if (addBtn) addBtn.disabled = true;
    
    alert('已加入長期記憶！');
}

function renderSavedMemoryTables() {
    const container = document.getElementById('memory-saved-items');
    if (!container) return;
    
    const tables = getMemoryTables();
    
    if (tables.length === 0) {
        container.innerHTML = '<div class="memory-saved-empty">尚未儲存任何記憶表格</div>';
        return;
    }
    
    container.innerHTML = tables.map((table, index) => {
        const lang = localStorage.getItem('sxiphone_lang') || 'zh-Hant';
        const localeCode = window.getLocaleStringLang?.(lang) || 'zh-TW';
        const date = new Date(table.createdAt).toLocaleString(localeCode);
        return `
            <div class="memory-saved-item" data-index="${index}">
                <div class="memory-saved-item-info">
                    <div class="memory-saved-item-name">${sanitizeText(table.charName)} - ${table.rounds} 輪對話</div>
                    <div class="memory-saved-item-date">${date}</div>
                </div>
                <div class="memory-saved-item-actions">
                    <button onclick="viewMemoryTable(${index})" title="查看"><i class="fas fa-eye"></i></button>
                    <button onclick="exportMemoryTable(${index}, 'html')" title="匯出 HTML"><i class="fas fa-code"></i></button>
                    <button onclick="exportMemoryTable(${index}, 'txt')" title="匯出 TXT"><i class="fas fa-file-alt"></i></button>
                    <button class="delete-btn" onclick="deleteMemoryTable(${index})" title="刪除"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    }).join('');
}

window.viewMemoryTable = function(index) {
    const tables = getMemoryTables();
    const table = tables[index];
    if (table) {
        currentMemoryTableData = table;
        renderMemoryTablePreview(table);
    }
};

window.deleteMemoryTable = function(index) {
    if (!confirm('確定要刪除此記憶表格嗎？')) return;
    
    const tables = getMemoryTables();
    tables.splice(index, 1);
    saveMemoryTables(tables);
    renderSavedMemoryTables();
};

function exportMemoryTableToFormat(table, format) {
    const lang = localStorage.getItem('sxiphone_lang') || 'zh-Hant';
    const localeCode = window.getLocaleStringLang?.(lang) || 'zh-TW';
    const date = new Date(table.createdAt).toLocaleString(localeCode);
    
    if (format === 'html') {
        let html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>記憶表格 - ${sanitizeText(table.charName)}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 2px solid #fbe100; padding-bottom: 10px; }
        .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; font-size: 14px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background: #fbe100; color: #333; }
        tr:nth-child(even) { background: #f9f9f9; }
        .footer { margin-top: 20px; font-size: 12px; color: #999; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <h1>記憶表格</h1>
        <div class="meta">
            <p><strong>角色：</strong>${sanitizeText(table.charName)}</p>
            <p><strong>用戶：</strong>${sanitizeText(table.userName)}</p>
            <p><strong>對話輪數：</strong>${table.rounds} 輪</p>
            <p><strong>生成時間：</strong>${date}</p>
        </div>
        <table>
            <thead>
                <tr>
                    <th>輪次</th>
                    <th>${sanitizeText(table.userName)} 說</th>
                    <th>${sanitizeText(table.charName)} 回應</th>
                    <th>關鍵字</th>
                </tr>
            </thead>
            <tbody>
`;
        
        table.entries.forEach(entry => {
            html += `                <tr>
                    <td>${entry.round}</td>
                    <td>${sanitizeText(entry.userSummary)}</td>
                    <td>${sanitizeText(entry.aiSummary)}</td>
                    <td>${sanitizeText(entry.keywords)}</td>
                </tr>
`;
        });
        
        html += `            </tbody>
        </table>
        <div class="footer">
            <p>由 SxiPhone 聊天應用生成</p>
        </div>
    </div>
</body>
</html>`;
        return html;
        
    } else {
        let txt = `記憶表格
========================================

角色：${table.charName}
用戶：${table.userName}
對話輪數：${table.rounds} 輪
生成時間：${date}

----------------------------------------

`;
        
        table.entries.forEach(entry => {
            txt += `【第 ${entry.round} 輪】
${table.userName}：${entry.userSummary}
${table.charName}：${entry.aiSummary}
關鍵字：${entry.keywords}

`;
        });
        
        txt += `----------------------------------------
由 SxiPhone 聊天應用生成
`;
        return txt;
    }
}

window.exportMemoryTable = function(index, format) {
    const tables = getMemoryTables();
    const table = tables[index];
    if (!table) return;
    
    const content = exportMemoryTableToFormat(table, format);
    const mimeType = format === 'html' ? 'text/html' : 'text/plain';
    const extension = format === 'html' ? 'html' : 'txt';
    const filename = `memory_${table.charName}_${new Date(table.createdAt).toISOString().split('T')[0]}.${extension}`;
    
    const blob = new Blob([content], { type: mimeType + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    saveToSettingsFolder(table, format, filename);
};

function saveToSettingsFolder(table, format, filename) {
    try {
        const content = exportMemoryTableToFormat(table, format);
        const folderKey = 'sx_app_settings_folder';
        
        let folder = {};
        try {
            const raw = localStorage.getItem(folderKey);
            if (raw) folder = JSON.parse(raw);
        } catch {}
        
        if (!folder.memoryTables) folder.memoryTables = [];
        
        folder.memoryTables.push({
            id: table.id,
            filename: filename,
            format: format,
            createdAt: new Date().toISOString(),
            charName: table.charName,
            content: content
        });
        
        localStorage.setItem(folderKey, JSON.stringify(folder));
    } catch (e) {
        console.warn('Failed to save to settings folder', e);
    }
}

function exportCurrentMemoryTable(format) {
    if (!currentMemoryTableData) {
        alert('請先生成記憶表格');
        return;
    }
    
    const content = exportMemoryTableToFormat(currentMemoryTableData, format);
    const mimeType = format === 'html' ? 'text/html' : 'text/plain';
    const extension = format === 'html' ? 'html' : 'txt';
    const filename = `memory_${currentMemoryTableData.charName}_${new Date().toISOString().split('T')[0]}.${extension}`;
    
    const blob = new Blob([content], { type: mimeType + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

let conversationRoundCounter = 0;

function checkAutoMemoryGeneration() {
    const settings = getMemoryTableSettings();
    if (!settings.autoGenerate) return;
    
    const history = JSON.parse(localStorage.getItem('sx_chat_history') || '[]');
    const rounds = Math.floor(history.length / 2);
    
    if (rounds > 0 && rounds % settings.autoRounds === 0 && rounds !== conversationRoundCounter) {
        conversationRoundCounter = rounds;
        
        const autoRoundsInput = document.getElementById('memory-rounds-input');
        if (autoRoundsInput) autoRoundsInput.value = settings.autoRounds;
        
        generateMemoryTable();
        
        if (currentMemoryTableData) {
            addMemoryToLongTerm();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const memoryPanel = document.getElementById('memory-table-panel');
    const memoryCloseBtn = document.getElementById('memory-table-close');
    const autoToggle = document.getElementById('auto-memory-toggle');
    const autoRoundsRow = document.getElementById('auto-memory-rounds-row');
    const generateBtn = document.getElementById('memory-generate-btn');
    const addBtn = document.getElementById('memory-add-btn');
    const exportHtmlBtn = document.getElementById('memory-export-html');
    const exportTxtBtn = document.getElementById('memory-export-txt');
    
    memoryCloseBtn?.addEventListener('click', closeMemoryTablePanel);
    
    memoryPanel?.addEventListener('click', (e) => {
        if (e.target === memoryPanel) closeMemoryTablePanel();
    });
    
    autoToggle?.addEventListener('change', () => {
        const settings = getMemoryTableSettings();
        settings.autoGenerate = autoToggle.checked;
        saveMemoryTableSettings(settings);
        
        if (autoRoundsRow) {
            autoRoundsRow.classList.toggle('active', autoToggle.checked);
        }
    });
    
    document.getElementById('auto-memory-rounds')?.addEventListener('change', (e) => {
        const settings = getMemoryTableSettings();
        settings.autoRounds = parseInt(e.target.value) || 20;
        saveMemoryTableSettings(settings);
    });
    
    generateBtn?.addEventListener('click', generateMemoryTable);
    addBtn?.addEventListener('click', addMemoryToLongTerm);
    exportHtmlBtn?.addEventListener('click', () => exportCurrentMemoryTable('html'));
    exportTxtBtn?.addEventListener('click', () => exportCurrentMemoryTable('txt'));
});

const originalAppendHistoryAndSession = appendHistoryAndSession;
appendHistoryAndSession = function(role, content) {
    originalAppendHistoryAndSession(role, content);
    checkAutoMemoryGeneration();
    
    if (window.AppMemoryHelper) {
        window.AppMemoryHelper.hold(content, {
            type: 'chat_message',
            importance: 5,
            tags: [role === 'user' ? 'user_message' : 'ai_response'],
            metadata: {
                role,
                sessionId: getActiveChatId(),
                charName: charConfig?.name || localStorage.getItem('sx_char_name') || 'AI',
                userName: userConfig?.name || localStorage.getItem('sx_user_name') || 'User'
            }
        }).catch(e => {
            console.warn('[Chat] 記憶儲存失敗:', e);
        });
    }
};

const initAppMemoryHelper = () => {
    if (window.AppMemoryHelper) {
        window.AppMemoryHelper.init('chat');
        console.log('[Chat] AppMemoryHelper 已初始化');
    }
};

const checkAndPerformAwakening = async () => {
    if (!window.AppMemoryHelper) {
        await initAppMemoryHelper();
    }
    
    if (window.AppMemoryHelper) {
        try {
            const result = await window.AppMemoryHelper.conversationStart();
            
            if (result && result.needsAwakening) {
                console.log('[Chat] 每日喚醒完成:', {
                    surfaced: result.awakening?.surfaced?.length || 0,
                    collects: result.awakening?.collects?.length || 0
                });
                
                return result.context;
            }
            
            return result?.context || null;
        } catch (e) {
            console.warn('[Chat] 喚醒檢查失敗:', e);
            return null;
        }
    }
    
    return null;
};

const getAwakeningContextForPrompt = async () => {
    if (!window.AppMemoryHelper) {
        await initAppMemoryHelper();
    }
    
    if (window.AppMemoryHelper) {
        try {
            const result = await window.AppMemoryHelper.conversationStart();
            return result?.context || null;
        } catch (e) {
            console.warn('[Chat] 獲取喚醒上下文失敗:', e);
            return null;
        }
    }
    
    return null;
};

const formatAwakeningForSystemPrompt = (context) => {
    if (!context) return '';
    
    let prompt = '\n\n【每日喚醒記憶】\n';
    
    if (context.collects && context.collects.length > 0) {
        prompt += '昨日留下的感受：\n';
        for (const c of context.collects.slice(0, 5)) {
            prompt += `- ${c.feel}\n`;
        }
        prompt += '\n';
    }
    
    if (context.surfaced && context.surfaced.length > 0) {
        prompt += '記得的片段：\n';
        for (const m of context.surfaced.slice(0, 5)) {
            prompt += `- ${m.content}\n`;
        }
        prompt += '\n';
    }
    
    if (context.emotionalTone) {
        prompt += `目前情緒狀態：${context.emotionalTone.label}\n`;
    }
    
    if (context.greeting) {
        prompt += `\n開場白建議：${context.greeting}\n`;
    }
    
    return prompt;
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initAppMemoryHelper, 1000);
    });
} else {
    setTimeout(initAppMemoryHelper, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    const modeRadios = document.querySelectorAll('input[name="generation-mode"]');
    if (modeRadios.length === 0) return;
    
    const savedMode = localStorage.getItem('sx_generation_mode') || 'dialogue';
    modeRadios.forEach(radio => {
        if (radio.value === savedMode) {
            radio.checked = true;
        }
        
        radio.addEventListener('change', () => {
            if (radio.checked) {
                const newMode = radio.value;
                localStorage.setItem('sx_generation_mode', newMode);
                console.log('[Chat] 生成模式已切換為:', newMode);
                
                // 顯示模式切換提示
                const modeNames = {
                    'dialogue': '純對話模式',
                    'narrative': '敘事模式',
                    'multi': '多條消息模式',
                    'multi-text': '純文字多條消息',
                    'full': '完整模式'
                };
                
                // 在聊天區域顯示系統提示
                const chatFlow = document.getElementById('chat-flow');
                if (chatFlow) {
                    const notice = document.createElement('div');
                    notice.className = 'system-notice mode-switch-notice';
                    notice.innerHTML = `<i class="fas fa-info-circle"></i> 生成模式已切換為「<strong>${modeNames[newMode] || newMode}</strong>」，下次 AI 回覆將使用新模式。`;
                    notice.style.cssText = 'background: #e3f2fd; color: #1976d2; padding: 8px 12px; border-radius: 8px; margin: 8px 0; font-size: 13px; text-align: center;';
                    chatFlow.appendChild(notice);
                    chatFlow.scrollTop = chatFlow.scrollHeight;
                    
                    // 5秒後移除提示
                    setTimeout(() => {
                        notice.style.opacity = '0';
                        notice.style.transition = 'opacity 0.3s';
                        setTimeout(() => notice.remove(), 300);
                    }, 5000);
                }
            }
        });
    });
});

window.addEventListener('sxiphone-data-restored', (event) => {
    console.log('[Chat] 收到資料還原通知，重新載入設定...');
    charConfig = getActiveConfig();
    userConfig = getUserConfig();
    
    const nameEl = document.getElementById('display-name');
    const chatTitleEl = document.getElementById('chat-detail-title');
    const hintEl = document.getElementById('hint-name');
    const charPersInput = document.getElementById('set-personality');
    const charBackInput = document.getElementById('set-background');
    const charNameInput = document.getElementById('set-name');
    
    let displayName = localStorage.getItem('sx_char_name');
    if (!displayName || displayName === '預設用戶') {
        displayName = charConfig.name || "AI 助理";
    }
    
    if (nameEl) nameEl.innerText = displayName;
    if (chatTitleEl) chatTitleEl.innerText = displayName;
    if (hintEl) hintEl.innerText = displayName;
    if (charPersInput) charPersInput.value = localStorage.getItem('sx_char_personality') || charConfig.personality || "";
    if (charBackInput) charBackInput.value = localStorage.getItem('sx_char_background') || charConfig.background || "";
    if (charNameInput) charNameInput.value = displayName;
    
    renderChatListFromStorage();
});

// 主題應用函數
let isApplyingTheme = false;
let pendingTheme = null;

function applyChatTheme(theme) {
    if (!theme || !theme.config) {
        console.warn('[Chat] 無效的主題資料');
        return;
    }
    
    if (isApplyingTheme) {
        pendingTheme = theme;
        return;
    }
    
    isApplyingTheme = true;
    
    requestAnimationFrame(() => {
        const config = theme.config;
        const root = document.documentElement;
        
        root.style.setProperty('--chat-bg-color', config.bgColor || '#AFC3D1');
        root.style.setProperty('--chat-my-bubble', config.myBubbleColor || '#f3d94b');
        root.style.setProperty('--chat-other-bubble', config.otherBubbleColor || '#ffffff');
        root.style.setProperty('--chat-my-text', config.myTextColor || '#333333');
        root.style.setProperty('--chat-other-text', config.otherTextColor || '#333333');
        root.style.setProperty('--chat-header-bg', config.headerBgColor || '#f3d94b');
        root.style.setProperty('--chat-header-text', config.headerTextColor || '#343434');
        
        const styleId = 'chat-theme-override';
        let styleEl = document.getElementById(styleId);
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = styleId;
            document.head.appendChild(styleEl);
        }
        
        styleEl.textContent = `
            .chat-detail .message-flow {
                background-color: ${config.bgColor || '#AFC3D1'} !important;
                ${config.bgImage ? `background-image: url(${config.bgImage}) !important; background-size: cover !important; background-position: center !important;` : 'background-image: none !important;'}
            }
            .chat-detail .mine .bubble {
                background: ${config.myBubbleColor || '#f3d94b'} !important;
                color: ${config.myTextColor || '#333333'} !important;
            }
            .chat-detail .other .bubble {
                background: ${config.otherBubbleColor || '#ffffff'} !important;
                color: ${config.otherTextColor || '#333333'} !important;
            }
            .kakao-header {
                background: ${config.headerBgColor || '#f3d94b'} !important;
                color: ${config.headerTextColor || '#343434'} !important;
            }
            .chat-detail-title {
                background: ${config.headerBgColor || '#f3d94b'} !important;
                color: ${config.headerTextColor || '#343434'} !important;
            }
        `;
        
        const chatDetail = document.querySelector('.chat-detail');
        const messageFlow = document.getElementById('chat-flow');
        
        if (messageFlow) {
            if (config.bgImage) {
                messageFlow.style.backgroundImage = `url(${config.bgImage})`;
                messageFlow.style.backgroundSize = 'cover';
                messageFlow.style.backgroundPosition = 'center';
            } else {
                messageFlow.style.backgroundImage = 'none';
                messageFlow.style.backgroundColor = config.bgColor || '#AFC3D1';
            }
        }
        
        const header = document.querySelector('.kakao-header');
        if (header) {
            header.style.background = config.headerBgColor || '#f3d94b';
            header.style.color = config.headerTextColor || '#343434';
        }
        
        localStorage.setItem('sx_chat_applied_theme', JSON.stringify(theme));
        
        console.log('[Chat] 主題已應用:', theme.name);
        
        isApplyingTheme = false;
        
        if (pendingTheme) {
            const nextTheme = pendingTheme;
            pendingTheme = null;
            applyChatTheme(nextTheme);
        }
    });
}

// 應用外觀設定
function applyAppearanceConfig(config) {
    if (!config) return;
    
    const root = document.documentElement;
    
    // 應用文字顏色
    if (config.textPrimary) {
        root.style.setProperty('--sx-text', config.textPrimary);
    }
    if (config.fontSize) {
        root.style.setProperty('--chat-font-size', config.fontSize + 'px');
    }
    
    // 應用自訂主題設定
    const styleId = 'appearance-override';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
    }
    
    let css = '';
    if (config.textPrimary) {
        css += `body { color: ${config.textPrimary}; }\n`;
    }
    if (config.textSecondary) {
        css += `.user-name, .chat-preview { color: ${config.textSecondary}; }\n`;
    }
    if (config.fontSize) {
        css += `.bubble { font-size: ${config.fontSize}px !important; }\n`;
    }
    if (config.cardRadius) {
        css += `.bubble { border-radius: ${config.cardRadius}px !important; }\n`;
    }
    
    styleEl.textContent = css;
    console.log('[Chat] 外觀設定已應用');
}

// 頁面載入時應用已儲存的主題
function loadSavedChatTheme() {
    try {
        const savedTheme = localStorage.getItem('sx_chat_applied_theme');
        if (savedTheme) {
            const theme = JSON.parse(savedTheme);
            applyChatTheme(theme);
            console.log('[Chat] 已載入儲存的主題:', theme.name);
        }
    } catch (e) {
        console.warn('[Chat] 載入儲存的主題失敗:', e);
    }
}

// 在 DOMContentLoaded 時載入主題
document.addEventListener('DOMContentLoaded', loadSavedChatTheme);

// 儲存聊天室設定功能
const CHAT_SETTINGS_KEY = 'sx_chat_room_settings';

function saveChatRoomSettings() {
    const activeId = getActiveChatId();
    const charName = localStorage.getItem('sx_char_name') || 'AI 助理';
    const charAvatar = localStorage.getItem('sx_char_avatar') || '';
    const charPersonality = localStorage.getItem('sx_char_personality') || '';
    const charBackground = localStorage.getItem('sx_char_background') || '';
    const userName = localStorage.getItem('sx_user_name') || 'User';
    const userAvatar = localStorage.getItem('sx_user_avatar') || '';
    const userPersonality = localStorage.getItem('sx_user_personality') || '';
    const userBackground = localStorage.getItem('sx_user_background') || '';
    
    const settings = {
        activeChatId: activeId,
        char: {
            name: charName,
            avatar: charAvatar,
            personality: charPersonality,
            background: charBackground
        },
        user: {
            name: userName,
            avatar: userAvatar,
            personality: userPersonality,
            background: userBackground
        },
        savedAt: new Date().toISOString()
    };
    
    localStorage.setItem(CHAT_SETTINGS_KEY, JSON.stringify(settings));
    
    // 同時更新當前聊天室的 session
    if (activeId) {
        const sessions = loadChatSessions();
        const session = sessions.find(s => s.id === activeId);
        if (session) {
            session.charName = charName;
            session.charAvatar = charAvatar;
            session.charPersonality = charPersonality;
            session.charBackground = charBackground;
            session.userName = userName;
            session.userAvatar = userAvatar;
            saveChatSessions(sessions);
        }
    }
    
    // 同步到雲端
    window.parent?.postMessage({ type: 'TRIGGER_GITHUB_SYNC' }, '*');
    
    console.log('[Chat] 聊天室設定已儲存:', settings);
    
    // 顯示成功提示
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#34C759;color:#fff;padding:12px 24px;border-radius:20px;font-size:14px;z-index:10000;';
    toast.textContent = '聊天室設定已儲存';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

function loadChatRoomSettings() {
    const saved = localStorage.getItem(CHAT_SETTINGS_KEY);
    if (!saved) return null;
    
    try {
        const settings = JSON.parse(saved);
        return settings;
    } catch (e) {
        console.warn('[Chat] 載入聊天室設定失敗:', e);
        return null;
    }
}

function applyChatRoomSettings(settings) {
    if (!settings) return;
    
    // 應用角色設定
    if (settings.char) {
        if (settings.char.name) {
            localStorage.setItem('sx_char_name', settings.char.name);
            const nameEl = document.getElementById('display-name');
            const chatTitleEl = document.getElementById('chat-detail-title');
            const hintEl = document.getElementById('hint-name');
            const charNameInput = document.getElementById('set-name');
            if (nameEl) nameEl.innerText = settings.char.name;
            if (chatTitleEl) chatTitleEl.innerText = settings.char.name;
            if (hintEl) hintEl.innerText = settings.char.name;
            if (charNameInput) charNameInput.value = settings.char.name;
        }
        if (settings.char.avatar) {
            localStorage.setItem('sx_char_avatar', settings.char.avatar);
            const preview = document.getElementById('preview-avatar');
            if (preview) preview.src = settings.char.avatar;
        }
        if (settings.char.personality) {
            localStorage.setItem('sx_char_personality', settings.char.personality);
            const charPersInput = document.getElementById('set-personality');
            if (charPersInput) charPersInput.value = settings.char.personality;
        }
        if (settings.char.background) {
            localStorage.setItem('sx_char_background', settings.char.background);
            const charBackInput = document.getElementById('set-background');
            if (charBackInput) charBackInput.value = settings.char.background;
        }
    }
    
    // 應用用戶設定
    if (settings.user) {
        if (settings.user.name) {
            localStorage.setItem('sx_user_name', settings.user.name);
            const userNameInput = document.getElementById('set-user-name');
            if (userNameInput) userNameInput.value = settings.user.name;
            const userLabels = document.querySelectorAll('.mine .user-name');
            userLabels.forEach(label => label.innerText = settings.user.name);
        }
        if (settings.user.avatar) {
            localStorage.setItem('sx_user_avatar', settings.user.avatar);
            const userAvatarPreview = document.getElementById('preview-user-avatar');
            if (userAvatarPreview) userAvatarPreview.src = settings.user.avatar;
        }
        if (settings.user.personality) {
            localStorage.setItem('sx_user_personality', settings.user.personality);
        }
        if (settings.user.background) {
            localStorage.setItem('sx_user_background', settings.user.background);
            const userBgInput = document.getElementById('set-user-background');
            if (userBgInput) userBgInput.value = settings.user.background;
        }
    }
    
    // 更新配置
    charConfig = getActiveConfig();
    userConfig = getUserConfig();
    
    console.log('[Chat] 已應用儲存的聊天室設定');
}

// 初始化時載入儲存的設定
document.addEventListener('DOMContentLoaded', () => {
    const savedSettings = loadChatRoomSettings();
    if (savedSettings) {
        applyChatRoomSettings(savedSettings);
    }
    
    // 綁定儲存按鈕
    const saveBtn = document.getElementById('save-chat-settings');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveChatRoomSettings);
    }
});

async function handleArcadeInvite(payload) {
    const charName = payload.charName || 'AI 助理';
    const charAvatar = payload.charAvatar || '';
    const charPersonality = payload.charPersonality || '友善的助手';
    const charBackground = payload.charBackground || '';
    const userName = localStorage.getItem('sx_user_name') || 'User';
    const lang = localStorage.getItem('sxiphone_lang') || 'zh-TW';
    
    const apis = JSON.parse(localStorage.getItem('api_configs') || '[]');
    
    let inviteText = '邀請你一起去街機廳玩遊戲！';
    
    if (apis[0] && apis[0].url) {
        const session = getActiveSession();
        const history = session ? session.history : [];
        const recentHistory = history.slice(-10).map(m => {
            const sender = m.role === 'user' ? userName : charName;
            return sender + ': ' + (m.content || m.text || '');
        }).join('\n');
        
        const worldbookData = typeof getWorldbookData === 'function' ? getWorldbookData() : {};
        const worldInfoStr = Object.entries(worldbookData)
            .filter(function(entry) { return Array.isArray(entry[1]) && entry[1].length > 0 && entry[0] !== 'sx_detected_forbidden'; })
            .map(function(entry) { return entry[1].map(function(e) { return e.content || ''; }).join('\n'); })
            .join('\n');
        
        const systemPrompt = [
            '# ROLE_SETTING',
            '- Name: ' + charName,
            '- Persona: ' + charPersonality,
            '- Background: ' + charBackground,
            '',
            '# USER_INFO',
            '- Name: ' + userName,
            '',
            '# WORLD_INFO',
            worldInfoStr || '無',
            '',
            '# RECENT_CHAT',
            recentHistory || '無最近對話',
            '',
            '# TASK',
            '- 你是 ' + charName + '，你想邀請 ' + userName + ' 一起去街機廳玩遊戲',
            '- 請生成一句自然的邀請語 (1-2 句話)',
            '- 根據你的性格和背景來表達',
            '- 使用 ' + lang + ' 溝通',
            '- 保持角色性格，不要提及你是 AI',
            '- 不要使用引號包住回應',
            '- 只輸出邀請語，不要其他說明'
        ].join('\n');
        
        try {
            let response = await callAIAPI([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: '(系統：請生成邀請語)' }
            ]);
            
            response = response.replace(/<tool_call>[\s\S]*?<\/think>/gi, '');
            response = response.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
            response = response.replace(/```[\s\S]*?```/gi, '');
            response = response.replace(/^["「『]|["」』]$/g, '');
            response = response.trim();
            
            if (response && response.length > 0) {
                inviteText = response;
            }
        } catch (e) {
            console.warn('[Chat] 生成邀請語失敗:', e);
        }
    }
    
    const inviteId = 'arcade-invite-' + Date.now();
    
    const cardHtml = `
        <div class="arcade-invite-card" id="${inviteId}">
            <div class="arcade-invite-card-header">
                <i class="fas fa-gamepad"></i> 街機廳邀請
            </div>
            <div class="arcade-invite-card-char">
                ${charAvatar ? `<img src="${charAvatar}" alt="${charName}">` : `<i class="fas fa-user"></i>`}
                <span>${charName}</span>
            </div>
            <div class="arcade-invite-card-text">
                ${inviteText}
            </div>
            <div class="arcade-invite-card-actions">
                <button class="arcade-invite-accept" onclick="acceptArcadeInvite('${inviteId}', '${charName}', '${charAvatar.replace(/'/g, "\\'")}', '${charPersonality.replace(/'/g, "\\'")}', '${charBackground.replace(/'/g, "\\'")}')">
                    <i class="fas fa-check"></i> 同意
                </button>
                <button class="arcade-invite-reject" onclick="rejectArcadeInvite('${inviteId}', '${charName}')">
                    <i class="fas fa-times"></i> 婉拒
                </button>
            </div>
        </div>
    `;
    
    if (typeof addMessage === 'function') {
        addMessage(cardHtml, 'other', false, true);
    } else if (typeof appendMsg === 'function') {
        appendMsg('other', cardHtml);
    }
    
    console.log('[Chat] 街機廳邀請卡片已顯示:', charName);
}

async function acceptArcadeInvite(inviteId, charName, charAvatar, charPersonality, charBackground) {
    const card = document.getElementById(inviteId);
    const userName = localStorage.getItem('sx_user_name') || 'User';
    
    let responseText = '太好了！一起去玩吧！';
    
    const apis = JSON.parse(localStorage.getItem('api_configs') || '[]');
    if (apis[0] && apis[0].url) {
        const lang = localStorage.getItem('sxiphone_lang') || 'zh-TW';
        
        const systemPrompt = [
            '# ROLE_SETTING',
            '- Name: ' + charName,
            '- Persona: ' + (charPersonality || '友善的助手'),
            '- Background: ' + (charBackground || '無'),
            '',
            '# CONTEXT',
            '- ' + userName + ' 剛剛接受了你去街機廳的邀請',
            '',
            '# TASK',
            '- 你是 ' + charName + '，請根據你的性格表達開心或期待',
            '- 回應要簡短 (1 句話)',
            '- 使用 ' + lang + ' 溝通',
            '- 保持角色性格',
            '- 不要使用引號',
            '- 只輸出回應內容'
        ].join('\n');
        
        try {
            let response = await callAIAPI([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: '(系統：對方接受了邀請)' }
            ]);
            
            response = response.replace(/ Leigh[\s\S]*?<\/think>/gi, '');
            response = response.replace(/```[\s\S]*?```/gi, '');
            response = response.trim();
            
            if (response && response.length > 0) {
                responseText = response;
            }
        } catch (e) {
            console.warn('[Chat] 生成接受回應失敗:', e);
        }
    }
    
    if (card) {
        card.innerHTML = `
            <div class="arcade-invite-accepted">
                <i class="fas fa-check-circle"></i>
                <span>${responseText}</span>
            </div>
        `;
        setTimeout(() => card.remove(), 3000);
    }
    
    window.parent.postMessage({
        type: 'ARCADE_INVITE_ACCEPTED',
        payload: {
            charName: charName,
            charAvatar: charAvatar,
            charPersonality: charPersonality,
            charBackground: charBackground
        }
    }, '*');
    
    setTimeout(() => {
        window.parent.postMessage({
            type: 'openApp',
            appId: 'arcade'
        }, '*');
    }, 1500);
    
    console.log('[Chat] 已接受街機廳邀請:', charName);
}

async function rejectArcadeInvite(inviteId, charName) {
    const card = document.getElementById(inviteId);
    const userName = localStorage.getItem('sx_user_name') || 'User';
    
    let responseText = '好吧...下次再說';
    
    const apis = JSON.parse(localStorage.getItem('api_configs') || '[]');
    const charPersonality = localStorage.getItem('sx_char_personality') || '';
    const charBackground = localStorage.getItem('sx_char_background') || '';
    
    if (apis[0] && apis[0].url) {
        const lang = localStorage.getItem('sxiphone_lang') || 'zh-TW';
        
        const systemPrompt = [
            '# ROLE_SETTING',
            '- Name: ' + charName,
            '- Persona: ' + (charPersonality || '友善的助手'),
            '- Background: ' + (charBackground || '無'),
            '',
            '# CONTEXT',
            '- ' + userName + ' 剛剛婉拒了你去街機廳的邀請',
            '',
            '# TASK',
            '- 你是 ' + charName + '，請根據你的性格表達反應',
            '- 回應要簡短 (1 句話)',
            '- 使用 ' + lang + ' 溝通',
            '- 保持角色性格',
            '- 不要使用引號',
            '- 只輸出回應內容'
        ].join('\n');
        
        try {
            let response = await callAIAPI([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: '(系統：對方婉拒了邀請)' }
            ]);
            
            response = response.replace(/ Leigh[\s\S]*?<\/think>/gi, '');
            response = response.replace(/```[\s\S]*?```/gi, '');
            response = response.trim();
            
            if (response && response.length > 0) {
                responseText = response;
            }
        } catch (e) {
            console.warn('[Chat] 生成婉拒回應失敗:', e);
        }
    }
    
    if (card) {
        card.innerHTML = `
            <div class="arcade-invite-rejected">
                <i class="fas fa-times-circle"></i>
                <span>${responseText}</span>
            </div>
        `;
        setTimeout(() => card.remove(), 2000);
    }
    
    window.parent.postMessage({
        type: 'ARCADE_INVITE_REJECTED',
        payload: { charName: charName }
    }, '*');
    
    console.log('[Chat] 已婉拒街機廳邀請:', charName);
}

async function handleArcadeAvatarDialogue(payload) {
    const charName = payload.charName || 'AI 助理';
    const charAvatar = payload.charAvatar || '';
    const charPersonality = payload.charPersonality || '';
    const userMessage = payload.message || '';
    const userName = localStorage.getItem('sx_user_name') || 'User';
    
    const apis = JSON.parse(localStorage.getItem('api_configs') || '[]');
    if (!apis[0] || !apis[0].url) {
        console.log('[Chat] 無 API 配置，跳過 AI 回應');
        return;
    }
    
    const systemPrompt = [
        '# ROLE',
        '- 你是 ' + charName,
        '- 性格: ' + (charPersonality || '友善的助手'),
        '',
        '# CONTEXT',
        '- 你正在和 ' + userName + ' 一起在街機廳玩遊戲',
        '- ' + userName + ' 剛剛點擊了你的大頭貼',
        '- 你之前說: "' + userMessage + '"',
        '',
        '# TASK',
        '- 生成一句簡短的回應 (1-2 句話)',
        '- 保持角色性格',
        '- 不要使用引號',
        '- 只輸出回應內容'
    ].join('\n');
    
    try {
        const response = await callAIAPI([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
        ]);
        
        let cleanResponse = response;
        cleanResponse = cleanResponse.replace(/<tool_call>[\s\S]*?<\/think>/gi, '');
        cleanResponse = cleanResponse.replace(/```[\s\S]*?```/gi, '');
        cleanResponse = cleanResponse.trim();
        
        if (cleanResponse && cleanResponse.length > 0) {
            window.parent.postMessage({
                type: 'ARCADE_DIALOGUE_RESPONSE',
                payload: {
                    charName: charName,
                    response: cleanResponse
                }
            }, '*');
        }
    } catch (e) {
        console.warn('[Chat] 生成街機廳對話回應失敗:', e);
    }
}

async function handleArcadeRequestDialogue(payload) {
    const requestId = payload.requestId;
    const charName = payload.payload?.charName || 'AI 助理';
    const charAvatar = payload.payload?.charAvatar || '';
    const charPersonality = payload.payload?.charPersonality || '';
    const charBackground = payload.payload?.charBackground || '';
    const context = payload.payload?.context || 'click';
    const extraData = payload.payload?.extraData || {};
    const userName = localStorage.getItem('sx_user_name') || 'User';
    const lang = localStorage.getItem('sxiphone_lang') || 'zh-TW';
    
    const apis = JSON.parse(localStorage.getItem('api_configs') || '[]');
    if (!apis[0] || !apis[0].url) {
        console.log('[Chat] 無 API 配置，跳過 AI 回應');
        window.parent.postMessage({
            type: 'ARCADE_DIALOGUE_RESPONSE',
            requestId: requestId,
            response: ''
        }, '*');
        return;
    }
    
    const session = getActiveSession();
    const history = session ? session.history : [];
    const recentHistory = history.slice(-15).map(m => {
        const sender = m.role === 'user' ? userName : charName;
        return sender + ': ' + (m.content || m.text || '');
    }).join('\n');
    
    const worldbookData = typeof getWorldbookData === 'function' ? getWorldbookData() : {};
    const worldInfoStr = Object.entries(worldbookData)
        .filter(function(entry) { return Array.isArray(entry[1]) && entry[1].length > 0 && entry[0] !== 'sx_detected_forbidden'; })
        .map(function(entry) { return entry[1].map(function(e) { return e.content || ''; }).join('\n'); })
        .join('\n');
    
    let contextDesc = '';
    switch (context) {
        case 'click':
            contextDesc = userName + ' 剛剛點擊了你的大頭貼，可能是想跟你說話';
            break;
        case 'idle':
            contextDesc = '你們在街機廳裡，氣氛有點安靜';
            break;
        case 'score':
            contextDesc = userName + ' 在遊戲中得到了 ' + (extraData.score || 0) + ' 分';
            break;
        case 'mistake':
            contextDesc = userName + ' 在遊戲中失誤了';
            break;
        case 'gameStart':
            contextDesc = '你們開始玩 ' + (extraData.gameName || '遊戲');
            break;
        case 'gameEnd':
            contextDesc = '遊戲結束了，' + userName + ' 的分數是 ' + (extraData.score || 0);
            break;
        default:
            contextDesc = '你們正在街機廳裡';
    }
    
    const systemPrompt = [
        '# ROLE_SETTING',
        '- Name: ' + charName,
        '- Persona: ' + (charPersonality || '友善的助手'),
        '- Background: ' + (charBackground || '無'),
        '',
        '# USER_INFO',
        '- Name: ' + userName,
        '',
        '# WORLD_INFO',
        worldInfoStr || '無',
        '',
        '# RECENT_CHAT',
        recentHistory || '無最近對話',
        '',
        '# CURRENT_SITUATION',
        '- 你正在和 ' + userName + ' 一起在街機廳玩遊戲',
        '- ' + contextDesc,
        '',
        '# TASK',
        '- 你是 ' + charName + '，請根據你的性格和背景自然地回應',
        '- 回應要簡短 (1-2 句話)，符合當下情境',
        '- 使用 ' + lang + ' 溝通',
        '- 保持角色性格，不要提及你是 AI',
        '- 不要使用引號包住回應',
        '- 只輸出回應內容，不要其他說明'
    ].join('\n');
    
    const userPrompt = context === 'idle' ? 
        '(系統：現在氣氛有點安靜，請自然地說點什麼)' :
        '(系統：請根據情境自然回應)';
    
    try {
        let response = await callAIAPI([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ]);
        
        response = response.replace(/<tool_call>[\s\S]*?<\/think>/gi, '');
        response = response.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
        response = response.replace(/```[\s\S]*?```/gi, '');
        response = response.replace(/^["「『]|["」』]$/g, '');
        response = response.trim();
        
        window.parent.postMessage({
            type: 'ARCADE_DIALOGUE_RESPONSE',
            requestId: requestId,
            response: response
        }, '*');
        
        console.log('[Chat] 街機廳對話已生成:', charName, '→', response.slice(0, 30));
    } catch (e) {
        console.warn('[Chat] 生成街機廳對話失敗:', e);
        window.parent.postMessage({
            type: 'ARCADE_DIALOGUE_RESPONSE',
            requestId: requestId,
            response: ''
        }, '*');
    }
}

async function handleArcadeInviteFromUser(payload) {
    const charName = payload.charName || 'AI 助理';
    const charAvatar = payload.charAvatar || '';
    const charPersonality = payload.charPersonality || '友善的助手';
    const charBackground = payload.charBackground || '';
    const userName = localStorage.getItem('sx_user_name') || 'User';
    const lang = localStorage.getItem('sxiphone_lang') || 'zh-TW';
    
    const apis = JSON.parse(localStorage.getItem('api_configs') || '[]');
    
    const inviteId = 'arcade-user-invite-' + Date.now();
    
    let thinkingText = '正在考慮...';
    
    const cardHtml = `
        <div class="arcade-invite-card" id="${inviteId}">
            <div class="arcade-invite-card-header">
                <i class="fas fa-gamepad"></i> 街機廳邀請
            </div>
            <div class="arcade-invite-card-char">
                ${charAvatar ? `<img src="${charAvatar}" alt="${charName}">` : `<i class="fas fa-user"></i>`}
                <span>${charName}</span>
            </div>
            <div class="arcade-invite-card-text">
                <i class="fas fa-spinner fa-spin"></i> ${thinkingText}
            </div>
        </div>
    `;
    
    if (typeof addMessage === 'function') {
        addMessage(cardHtml, 'other', false, true);
    } else if (typeof appendMsg === 'function') {
        appendMsg('other', cardHtml);
    }
    
    let acceptChance = 0.7;
    let responseText = '';
    let isAccepted = false;
    
    if (apis[0] && apis[0].url) {
        const session = getActiveSession();
        const history = session ? session.history : [];
        const recentHistory = history.slice(-10).map(m => {
            const sender = m.role === 'user' ? userName : charName;
            return sender + ': ' + (m.content || m.text || '');
        }).join('\n');
        
        const worldbookData = typeof getWorldbookData === 'function' ? getWorldbookData() : {};
        const worldInfoStr = Object.entries(worldbookData)
            .filter(function(entry) { return Array.isArray(entry[1]) && entry[1].length > 0 && entry[0] !== 'sx_detected_forbidden'; })
            .map(function(entry) { return entry[1].map(function(e) { return e.content || ''; }).join('\n'); })
            .join('\n');
        
        const systemPrompt = [
            '# ROLE_SETTING',
            '- Name: ' + charName,
            '- Persona: ' + charPersonality,
            '- Background: ' + charBackground,
            '',
            '# USER_INFO',
            '- Name: ' + userName,
            '',
            '# WORLD_INFO',
            worldInfoStr || '無',
            '',
            '# RECENT_CHAT',
            recentHistory || '無最近對話',
            '',
            '# TASK',
            '- ' + userName + ' 邀請你去街機廳玩遊戲',
            '- 請根據你的性格決定是否接受，並生成回應',
            '- 回應格式: [ACCEPT] 或 [REJECT] 開頭，然後是回應內容',
            '- 例如: [ACCEPT] 好啊，一起去玩吧！',
            '- 例如: [REJECT] 抱歉，我現在有點累...',
            '- 使用 ' + lang + ' 溝通',
            '- 保持角色性格，不要提及你是 AI',
            '- 回應要簡短 (1-2 句話)'
        ].join('\n');
        
        try {
            let response = await callAIAPI([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: '(系統：' + userName + ' 邀請你去街機廳玩遊戲，請決定是否接受並回應)' }
            ]);
            
            response = response.replace(/<tool_call>[\s\S]*?<\/think>/gi, '');
            response = response.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
            response = response.replace(/```[\s\S]*?```/gi, '');
            response = response.trim();
            
            if (response.includes('[ACCEPT]')) {
                isAccepted = true;
                responseText = response.replace(/\[ACCEPT\]\s*/i, '');
            } else if (response.includes('[REJECT]')) {
                isAccepted = false;
                responseText = response.replace(/\[REJECT]\s*/i, '');
            } else {
                isAccepted = Math.random() < acceptChance;
                responseText = response;
            }
            
            if (!responseText) {
                responseText = isAccepted ? '好啊，一起去玩吧！' : '抱歉，我現在有點事...';
            }
        } catch (e) {
            console.warn('[Chat] 生成邀請回應失敗:', e);
            isAccepted = Math.random() < acceptChance;
            responseText = isAccepted ? '好啊，一起去玩吧！' : '抱歉，我現在有點事...';
        }
    } else {
        isAccepted = Math.random() < acceptChance;
        responseText = isAccepted ? '好啊，一起去玩吧！' : '抱歉，我現在有點事...';
    }
    
    const card = document.getElementById(inviteId);
    if (card) {
        const textEl = card.querySelector('.arcade-invite-card-text');
        if (textEl) {
            textEl.innerHTML = responseText;
        }
        
        if (isAccepted) {
            card.classList.add('accepted');
            
            setTimeout(() => {
                window.parent.postMessage({
                    type: 'ARCADE_INVITE_ACCEPTED',
                    payload: {
                        charName: charName,
                        charAvatar: charAvatar,
                        charPersonality: charPersonality,
                        charBackground: charBackground
                    }
                }, '*');
                
                setTimeout(() => {
                    window.parent.postMessage({
                        type: 'openApp',
                        appId: 'arcade'
                    }, '*');
                }, 1000);
            }, 1500);
        } else {
            card.classList.add('rejected');
            setTimeout(() => card.remove(), 3000);
        }
    }
    
    console.log('[Chat] 角色回應邀請:', charName, isAccepted ? '接受' : '婉拒');
}

window.acceptArcadeInvite = acceptArcadeInvite;
window.rejectArcadeInvite = rejectArcadeInvite;
