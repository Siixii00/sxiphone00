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

function buildApiHeaders(config) {
    const headers = { 'Content-Type': 'application/json' };
    if (config.key) headers['Authorization'] = `Bearer ${config.key}`;
    
    if (config.url && config.url.includes('openrouter.ai')) {
        headers['HTTP-Referer'] = window.location.origin || 'https://localhost';
        headers['X-Title'] = 'SX iPhone App';
    }
    
    return headers;
}

function getActiveConfig() {
    const charName = localStorage.getItem('sx_char_name');
    const charAvatar = localStorage.getItem('sx_char_avatar');
    const charPersonality = localStorage.getItem('sx_char_personality');
    const charBackground = localStorage.getItem('sx_char_background');
    
    if (charName && charName !== '?êË®≠?®Êà∂') {
        console.log('[getActiveConfig] Âæ?localStorage ËÆÄ?ñË???', charName, 'personality:', charPersonality?.slice(0, 30));
        return {
            name: charName,
            avatar: charAvatar || "",
            personality: charPersonality || "‰∏Ä?ãÂ??ÑÁ??©Ê?",
            background: charBackground || "??,
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
                if (firstChar && firstChar.name && firstChar.name !== '?êË®≠?®Êà∂') {
                    activeChar = firstChar;
                    console.log('[getActiveConfig] Âæ?sx_characters ËÆÄ?ñË???', activeChar.name, 'personality:', activeChar.personality?.slice(0, 30));
                }
            }
        } catch (e) {
            console.warn('Ëß?? sx_characters Â§±Ê?:', e);
        }
    }
    
    if (!activeChar) {
        const masksRaw = localStorage.getItem('sx_masks');
        if (masksRaw) {
            try {
                const masks = JSON.parse(masksRaw);
                if (Array.isArray(masks) && masks.length > 0 && masks[0]?.name) {
                    activeChar = masks[0];
                    console.log('[getActiveConfig] Âæ?sx_masks ËÆÄ?ñË???', activeChar.name);
                }
            } catch (e) {
                console.warn('Ëß?? sx_masks Â§±Ê?:', e);
            }
        }
    }
    
    if (!activeChar) {
        console.log('[getActiveConfig] ?™Êâæ?∞Ë??≤Ë®≠ÂÆöÔ?‰ΩøÁî®?êË®≠??);
    }
    
    return {
        name: activeChar?.name || "AI ?©Á?",
        avatar: activeChar?.avatar || "",
        personality: activeChar?.personality || "‰∏Ä?ãÂ??ÑÁ??©Ê?",
        background: activeChar?.background || "??,
        worldBook: activeChar?.worldBook || activeChar?.worldbook || ""
    };
}

// --- 2. ËÆÄ?ñ‰??åÊõ∏Ë≥áÊ? (?∞Êû∂Êß? ---
function getWorldbookData() {
    const worldbookData = {};
    
    // ËÆÄ?ñÊñ∞?ÑÂ?È°ûÊ?‰ª?
    const newCategories = [
        { key: 'sx_worldbook_theater', cat: 'theater' },
        { key: 'sx_worldbook_conditional', cat: 'conditional' },
        { key: 'sx_worldbook_core', cat: 'core' }
    ];
    
    // ?åÊ?‰øùÁ??äÁ??ºÂÆπ??
    const legacyCategories = ['cot', 'style', 'global', 'keywords', 'backend'];
    
    // ËÆÄ?ñÊñ∞?∂Ê?
    newCategories.forEach(({ key, cat }) => {
        const data = localStorage.getItem(key);
        if (data) {
            try {
                worldbookData[cat] = JSON.parse(data);
                console.log(`[Worldbook] ËºâÂÖ•?∞Êû∂Êß? ${cat}`);
            } catch (e) {
                console.warn(`Ëß??‰∏ñÁ???${cat} Â§±Ê?:`, e);
                worldbookData[cat] = {};
            }
        } else {
            worldbookData[cat] = {};
        }
    });
    
    // ËÆÄ?ñË??∂Ê?ÔºàÂ?ÂæåÂÖºÂÆπÔ?
    legacyCategories.forEach(cat => {
        const key = `sx_worldbook_${cat}`;
        const data = localStorage.getItem(key);
        if (data) {
            try {
                worldbookData[key] = JSON.parse(data);
            } catch (e) {
                console.warn(`Ëß??‰∏ñÁ???${cat} Â§±Ê?:`, e);
                worldbookData[key] = [];
            }
        } else {
            worldbookData[key] = [];
        }
    });
    
    // ËÆÄ?ñÁ?Ê≠¢Ë?
    const forbiddenData = localStorage.getItem('sx_detected_forbidden');
    if (forbiddenData) {
        try {
            worldbookData.sx_detected_forbidden = JSON.parse(forbiddenData);
        } catch (e) {
            console.warn('Ëß??Á¶ÅÊ≠¢Ë©ûÂ§±??', e);
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
            console.warn('Ëß??‰∏ñÁ??∏Á¥¢ÂºïÂ§±??', e);
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
            console.warn('Ëß???äÂ§©ÂÆ§Â?Ë°®Â§±??, e);
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
        
        // ‰øùÂ??®Êà∂Ë®≠Â???localStorage
        const userNameInput = document.getElementById('set-user-name');
        const userBgInput = document.getElementById('set-user-background');
        if (userNameInput && userNameInput.value.trim()) {
            localStorage.setItem('sx_user_name', userNameInput.value.trim());
        }
        if (userBgInput) {
            localStorage.setItem('sx_user_background', userBgInput.value);
        }
        
        console.log("?äÂ§©?∏Ê?Â∑≤‰?Â≠òËá≥ localStorage");
    } catch (e) {
        console.error("‰øùÂ??äÂ§©?∏Ê?Â§±Ê?:", e);
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
            console.log("?äÂ§©?∏Ê?Â∑≤‰?Â≠òËá≥ IndexedDB");
        } catch (e) {
            console.error("IndexedDB ‰øùÂ?Â§±Ê?:", e);
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
                // ?ÑÂ??®Êà∂Ë≥áÊ?
                if (persistedData.userName) localStorage.setItem('sx_user_name', persistedData.userName);
                if (persistedData.userAvatar) localStorage.setItem('sx_user_avatar', persistedData.userAvatar);
                if (persistedData.userPersonality) localStorage.setItem('sx_user_personality', persistedData.userPersonality);
                if (persistedData.userBackground) localStorage.setItem('sx_user_background', persistedData.userBackground);
                
                // ?ÑÂ??äÂ§© sessions (iOS localStorage ?ôÊè¥)
                if (persistedData.sx_chat_sessions) {
                    const existingSessions = localStorage.getItem('sx_chat_sessions');
                    // ?™Ê???localStorage Ê≤íÊ?Ë≥áÊ??ÇÊ?Âæ?localforage ?ÑÂ?
                    if (!existingSessions) {
                        localStorage.setItem('sx_chat_sessions', JSON.stringify(persistedData.sx_chat_sessions));
                        console.log('[Chat] Âæ?localforage ?¢Âæ©?äÂ§© sessions:', persistedData.sx_chat_sessions.length, '??);
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
            console.warn('[Chat] Âæ?localforage ?¢Âæ©?®Êà∂Ë≥áÊ?Â§±Ê?:', e);
        }
    }
    
    charConfig = getActiveConfig();
    userConfig = getUserConfig();
    
    let displayName = localStorage.getItem('sx_char_name');
    if (!displayName || displayName === '?êË®≠?®Êà∂') {
        displayName = charConfig.name || "AI ?©Á?";
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
    
    console.log('[Chat] pageshow - ?çÊñ∞ËºâÂÖ•ËßíËâ≤Ë®≠Â?:', displayName);
    console.log('[Chat] pageshow - ?çÊñ∞ËºâÂÖ•?®Êà∂Ë®≠Â?:', userConfig.name, userConfig.avatar ? '?âÈ†≠Ë≤? : '?°È†≠Ë≤?);
    console.log('[Chat] pageshow - ?üÊ?Ê®°Â?:', savedMode);
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
    
    // ?ïÁ?Â§ñÈÄÅË???
    if (data.type === 'DELIVERY_ORDER' && data.order) {
        console.log('[Chat] ?∂Âà∞Â§ñÈÄÅË???', data.order);
        const order = data.order;
        const orderText = data.message || `[Â§ñÈÄÅË??Æ]\n?ÇÈ?Ôº?{order.timeStr}\nÈ§êÂª≥Ôº?{order.stores}\n?ÅÈ?Ôº?{order.items.map(i => `${i.name} x${i.qty}`).join('??)}\n?ëÈ?ÔºöNT$${order.total}\n?∞Â?Ôº?{order.address}${order.note ? '\n?ôË®ªÔº? + order.note : ''}`;
        
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
    
    // ??ÅΩ settings ?¥Êñ∞
    if (data.type === 'settingsUpdated') {
        console.log('[Chat] ?∂Âà∞ settings ?¥Êñ∞ÔºåÈ??∞Ë??•Áî®?∂Ë???);
        userConfig = getUserConfig();
        initUserUI();
        
        // ?¥Êñ∞Â∞çË©±‰∏≠Á??®Êà∂?çÁ®±Ê®ôÁ±§
        const userLabels = document.querySelectorAll('.mine .user-name');
        userLabels.forEach(label => label.innerText = userConfig.name || 'User');
    }
    
    if (data.type === 'CHARACTER_UPDATED' && data.payload) {
        console.log('[Chat] ?∂Âà∞ËßíËâ≤?¥Êñ∞:', data.payload);
        
        const payload = data.payload;
        charConfig = {
            name: payload.name || localStorage.getItem('sx_char_name') || "AI ?©Á?",
            avatar: payload.avatar || localStorage.getItem('sx_char_avatar') || "",
            personality: payload.personality || localStorage.getItem('sx_char_personality') || "‰∏Ä?ãÂ??ÑÁ??©Ê?",
            background: payload.background || localStorage.getItem('sx_char_background') || "??,
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
        
        console.log('[Chat] UI Â∑≤Êõ¥?∞ÁÇ∫:', charConfig.name);
    }
    
    if (data.type === 'USER_SETTINGS_UPDATED' && data.payload) {
        console.log('[Chat] ?∂Âà∞?®Êà∂?¥Êñ∞:', data.payload);
        
        const payload = data.payload;
        
        if (payload.name) localStorage.setItem('sx_user_name', payload.name);
        if (payload.avatar !== undefined) localStorage.setItem('sx_user_avatar', payload.avatar);
        if (payload.personality !== undefined) localStorage.setItem('sx_user_personality', payload.personality);
        if (payload.background !== undefined) localStorage.setItem('sx_user_background', payload.background);
        
        userConfig = getUserConfig();
        initUserUI();
        
        // ?¥Êñ∞?≠Â??êË¶Ω
        const userAvatarPreview = document.getElementById('preview-user-avatar');
        if (userAvatarPreview && userConfig.avatar) {
            userAvatarPreview.src = userConfig.avatar;
            userAvatarPreview.style.background = '';
        }
        
        // ?¥Êñ∞?åÊôØ?Ö‰?Ëº∏ÂÖ•Ê°?
        const userBgInput = document.getElementById('set-user-background');
        if (userBgInput) {
            userBgInput.value = userConfig.background || '';
        }
        
        const userLabels = document.querySelectorAll('.mine .user-name');
        userLabels.forEach(label => label.innerText = userConfig.name || 'User');
        
        console.log('[Chat] ?®Êà∂ UI Â∑≤Êõ¥?∞ÁÇ∫:', userConfig.name, userConfig.avatar ? '?âÈ†≠Ë≤? : '?°È†≠Ë≤?);
    }
    
    // ?ïÁ?Ë™ûË?ËÆäÊõ¥
    if (data.type === 'LANGUAGE_CHANGED' && data.lang) {
        console.log('[Chat] ?∂Âà∞Ë™ûË?ËÆäÊõ¥Ë®äÊÅØ:', data.lang);
        localStorage.setItem('sxiphone_lang', data.lang);
        // ?¥Êñ∞ html lang Â±¨ÊÄ?
        if (document.documentElement) {
            document.documentElement.lang = data.lang;
        }
        // Ëß∏Áôº UI ?¥Êñ∞ÔºàÂ??úÊ??ÑË©±Ôº?
        if (typeof applyLanguageToUI === 'function') {
            applyLanguageToUI();
        }
        // Ëß∏ÁôºË™ûË??¥Êñ∞?ûË™ø
        if (typeof window.SxLanguage !== 'undefined' && typeof window.SxLanguage.triggerUpdate === 'function') {
            window.SxLanguage.triggerUpdate(data.lang);
        }
    }
    
    // ?ïÁ?Ë°óÊ?Âª≥È?Ë´?
    if (data.type === 'ARCADE_INVITE' && data.payload) {
        console.log('[Chat] ?∂Âà∞Ë°óÊ?Âª≥È?Ë´?', data.payload);
        handleArcadeInvite(data.payload);
    }
    
    // ?ïÁ??®Êà∂?ºËµ∑?ÑË?Ê©üÂª≥?ÄË´ãÔ?ËßíËâ≤Ê±∫Â??ØÂê¶?•Â?Ôº?
    if (data.type === 'ARCADE_INVITE_FROM_USER' && data.payload) {
        console.log('[Chat] ?∂Âà∞?®Êà∂?ºËµ∑?ÑË?Ê©üÂª≥?ÄË´?', data.payload);
        handleArcadeInviteFromUser(data.payload);
    }
    
    // ?ïÁ?Ë°óÊ?Âª≥Â§ß?≠Ë≤ºÂ∞çË©±
    if (data.type === 'ARCADE_AVATAR_CLICK' && data.payload) {
        console.log('[Chat] ?∂Âà∞Ë°óÊ?Âª≥Â§ß?≠Ë≤ºÂ∞çË©±:', data.payload);
        handleArcadeAvatarDialogue(data.payload);
    }
    
    // ?ïÁ?Ë°óÊ?Âª?AI Â∞çË©±Ë´ãÊ?
    if (data.type === 'ARCADE_REQUEST_DIALOGUE' && data.requestId) {
        console.log('[Chat] ?∂Âà∞Ë°óÊ?Âª?AI Â∞çË©±Ë´ãÊ?:', data.requestId);
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
                title: 'AI ?©Á?',
                history: legacyHistory
            });
            saveChatSessions(sessions);
            localStorage.setItem('sx_chat_active', newId);
        }
    } catch (e) {
        console.warn('?∑Áßª?äË?Â§©Á??ÑÂ§±??, e);
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

// --- 3. Ê∏≤Ê?‰∏ñÁ??∏ÈÅ∏?ÖÂà∞?¥È?Ê¨?---
function renderWorldbookOptions() {
    const container = document.getElementById('worldbook-mount-list');
    const dropdownToggle = document.getElementById('wb-dropdown-toggle');
    if (!container) return;
    
    const worldbookData = getWorldbookData();
    const mounts = getWorldbookMounts();
    const categories = [
        { key: 'global', label: '?®Â?Ë®≠Â?', icon: 'globe', defaultChecked: true },
        { key: 'cot', label: '?ùÁ∂≠??, icon: 'brain', defaultChecked: false },
        { key: 'style', label: '?áÈ¢®Ë®≠Â?', icon: 'brush', defaultChecked: false },
        { key: 'keywords', label: '?úÈçµÂ≠?, icon: 'tags', defaultChecked: false },
        { key: 'backend', label: 'ÂæåÁ´ØË®≠Â?', icon: 'cog', defaultChecked: false }
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
                    <span>‰ΩçÁΩÆ:</span>
                    <select class="wb-pos-selector">
                        <option value="top" ${position === 'top' ? 'selected' : ''}>??(Top)</option>
                        <option value="mid" ${position === 'mid' ? 'selected' : ''}>‰∏?(Mid)</option>
                        <option value="bottom" ${position === 'bottom' ? 'selected' : ''}>Âæ?(Bottom)</option>
                    </select>
                </div>
            </div>
        `;
    };

    // Ê∏ÖÁ©∫ÂÆπÂô®
    container.innerHTML = '';

    // Ê∑ªÂ??öÁî®Â∏∏Ë?Â∫´Ô??êË®≠Ôº?
    container.insertAdjacentHTML('beforeend', makeMountRow('?öÁî®Â∏∏Ë?Â∫?, 'mid', true));

    // È°ØÁ§∫?ÜÈ? - ?¥Êé•Âæ?worldbookData ËÆÄ?ñÊ??ÆÔ?‰∏ç‰?Ë≥?worldbookIndex
    let hasAnyEntries = false;
    
    categories.forEach(cat => {
        const catKey = `sx_worldbook_${cat.key}`;
        const entries = worldbookData[catKey];
        
        // ?¥Êé•Ê™¢Êü• entries ?ØÂê¶?∫Ê??àÈô£?ó‰??âÂÖßÂÆ?
        if (!entries || !Array.isArray(entries) || entries.length === 0) return;
        
        hasAnyEntries = true;
        
        // Ê∑ªÂ??ÜÈ?Ê®ôÈ?
        container.insertAdjacentHTML('beforeend', `
            <div class="wb-mount-category">${cat.label}</div>
        `);

        // ?¥Êé•Âæ?entries ËÆÄ?ñÊ???
        // global ?ÜÈ??êË®≠?æÈÅ∏ÔºåÂÖ∂‰ªñÂ?È°ûÈ?Ë®≠‰??æÈÅ∏
        entries.forEach(entry => {
            if (entry && entry.title) {
                container.insertAdjacentHTML('beforeend', makeMountRow(entry.title, 'mid', cat.defaultChecked));
            }
        });
    });
    
    // Â¶ÇÊ?Ê≤íÊ?‰ªª‰?Ê¢ùÁõÆÔºåÈ°ØÁ§∫Ê?Á§∫Ë???
    if (!hasAnyEntries) {
        container.insertAdjacentHTML('beforeend', `
            <div class="wb-mount-empty-hint" style="padding: 12px; color: #888; font-size: 12px; text-align: center;">
                Â∞öÁÑ°‰∏ñÁ??∏Ê???br>
                <small>Ë´ãÂ??∞„Äå‰??åÊõ∏?çÊ??®Á?ÂºèÊñ∞Â¢ûÂÖßÂÆ?/small>
            </div>
        `);
    }

    if (dropdownToggle) {
        const selectedCount = container.querySelectorAll('.wb-enable:checked').length;
        dropdownToggle.innerHTML = `Â∑≤ÈÅ∏??${selectedCount} ?ã‰??åÊõ∏ <i class="fas fa-chevron-down"></i>`;
    }

    // Á∂ÅÂ?‰∫ã‰ª∂
    bindWorldbookEvents();
}

// --- 4. Á∂ÅÂ?‰∏ñÁ??∏‰?‰ª?---
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
                dropdownToggle.innerHTML = `Â∑≤ÈÅ∏??${selectedCount} ?ã‰??åÊõ∏ <i class="fas fa-chevron-down"></i>`;
            }
        });
    }
}

// --- 5. ‰øùÂ?‰∏ñÁ??∏Ê?ËºâË®≠ÂÆ?---
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
    
    // ‰øùÂ???localStorage
    localStorage.setItem('sx_worldbook_mounts', JSON.stringify(mounts));
    alert('‰∏ñÁ??∏Ê?ËºâË®≠ÂÆöÂ∑≤‰øùÂ?');
}

// --- 6. ËÆÄ?ñÂ∑≤‰øùÂ??Ñ‰??åÊõ∏?õË?Ë®≠Â? ---
function getWorldbookMounts() {
    const data = localStorage.getItem('sx_worldbook_mounts');
    if (data) {
        try {
            return JSON.parse(data);
        } catch (e) {
            console.warn('Ëß??‰∏ñÁ??∏Ê?ËºâË®≠ÂÆöÂ§±??', e);
            return [];
        }
    }
    return [];
}

// --- 1. ?∏Ê??¥Êñ∞?áË??ñÊ†∏Âø?---

/**
 * ?∏Â?‰øÆÊ≠£ÔºöÁµ±‰∏Ä?¥Êñ∞ËßíËâ≤Ë®≠Â??ÑÂáΩÂº?
 * Ëß?±∫?åÈö®?ÇÂÅµÊ∏¨„Äç‰∏¶?≤Â???localStorage ?ÑÂ?È°?
 */
function updateActiveMask(field, value) {
    let masks = JSON.parse(localStorage.getItem('sx_masks') || '[]');
    if (masks.length === 0) {
        masks.push({ name: "AI ?©Á?", avatar: "", personality: "", background: "", worldBook: "" });
    }
    masks[0][field] = value;
    localStorage.setItem('sx_masks', JSON.stringify(masks));
    
    let characters = JSON.parse(localStorage.getItem('sx_characters') || '[]');
    if (characters.length === 0) {
        characters.push({ name: "AI ?©Á?", avatar: "", personality: "", background: "", worldBook: "" });
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

// --- 1. ?∫Á??∏Ê?ËºâÂÖ• ---
let charConfig = getActiveConfig();
let userConfig = getUserConfig();
let iosTempData = {}; // iOS ?´Â?

// --- 2. ?Ä?ãË???---
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
        console.warn('[diary] ?°Ê?ËºâÂÖ•ËßíËâ≤Ë®òÊÜ∂:', e);
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
    
    const personalityParts = personality.split(/[Ôº??Å„ÄÇÔ?;\s]+/).filter(p => p.trim());
    const bgParts = background.split(/[Ôº??Å„ÄÇÔ?;\s]+/).filter(p => p.trim());
    
    let msgCount = 0;
    let userMsgCount = 0;
    const topics = [];
    const emotions = [];
    
    if (chatHistory && chatHistory.length > 0) {
        chatHistory.forEach(msg => {
            if (msg.role === 'user') {
                userMsgCount++;
                const content = msg.content.toLowerCase();
                if (/?ãÂ?|Âø´Ê?|?àÂ?|È´òË?/.test(content)) emotions.push('?ãÂ?');
                if (/???|?∑Â?|?≠|???/.test(content)) emotions.push('???');
                if (/Á¥Ø|?≤Ê?|Â•ΩÁ¥Ø/.test(content)) emotions.push('?≤Ê?');
                if (/?üÊ∞£|?§ÊÄí|?´Â§ß/.test(content)) emotions.push('?üÊ∞£');
                if (/?≥Âøµ|?ùÂøµ/.test(content)) emotions.push('?≥Âøµ');
                
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
            sentences.push(`‰ª•Ê?${randomTrait}?ÑÂÄãÊÄßÔ?‰ªäÂ§©??{userName}?ÑÂ?Ë©±Ë??ëÂç∞Ë±°Ê∑±?ª„ÄÇ`);
        } else {
            sentences.push(`‰ª•Ê?${randomTrait}?ÑÂÄãÊÄßÔ?‰ªäÂ§©?éÂ?ÂæàÁâπ?•„ÄÇ`);
        }
    } else if (bgParts.length > 0) {
        const randomBg = bgParts[Math.floor(Math.random() * bgParts.length)];
        if (msgCount > 0) {
            sentences.push(`${randomBg}?ÑÊ?Ôºå‰?Â§©Â?${userName}?Ñ‰??ïË??ëÊ?ÂæàÂ??üËß∏?Ç`);
        } else {
            sentences.push(`${randomBg}?ÑÊ?Ôºå‰?Â§©È?ÂæóÈ?‰∏çÈåØ?Ç`);
        }
    } else {
        if (msgCount > 0) {
            sentences.push(`‰ªäÂ§©??{userName}?ä‰?ÂæàÂ?ÔºåÁ∏Ω??${msgCount} ?áË??Ø„ÄÇ`);
        } else {
            sentences.push(`‰ªäÂ§©Ê≤íÊ??πÂà•?Ñ‰??ÖÁôº?ü„ÄÇ`);
        }
    }
    
    if (emotions.length > 0) {
        const uniqueEmotions = [...new Set(emotions)].slice(0, 2);
        sentences.push(`?üË¶∫‰ªäÂ§©?πÂà•${uniqueEmotions.join('??)}?Ç`);
    }
    
    if (topics.length > 0 && Math.random() > 0.5) {
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];
        sentences.push(`‰Ω†Ë™™?Ñ„Ä?{randomTopic}...?çË??ëÂç∞Ë±°Ê∑±?ª„ÄÇ`);
    }
    
    if (memory && memory.length > 0 && Math.random() > 0.6) {
        const recentMsg = memory[memory.length - 1];
        if (recentMsg && recentMsg.content) {
            const recentKeywords = recentMsg.content.slice(0, 15);
            sentences.push(`‰πãÂ??ëÂÄëË??é„Ä?{recentKeywords}...?çÔ?‰ªäÂ§©?àË??ëÊÉ≥Ëµ∑‰?‰∫Ü„ÄÇ`);
        }
    }
    
    if (bgParts.length > 0 && Math.random() > 0.6) {
        const randomBg = bgParts[Math.floor(Math.random() * bgParts.length)];
        sentences.push(`?†ÁÇ∫${randomBg}?ÑÈ?‰øÇÔ??ëÁâπ?•Á??úÂ?‰Ω†Á?ÊØè‰?Ê¨°Â?Ë©±„ÄÇ`);
    }
    
    if (sentences.length < 3) {
        sentences.push(`Â∏åÊ??éÂ§©‰πüËÉΩÁπºÁ??ôÊ®£?ÑÂ?Ë©±„ÄÇ`);
    }
    
    sentences.push('');
    sentences.push(`?î‚Ä?${charName}`);
    
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
    const flowLabel = flowType === 'envelope' ? 'Á¥ÖÂ?' : (flowType === 'request' ? '?∂Ê¨æ' : 'ËΩâÂ∏≥');
    const pairLabel = direction === 'user_to_char'
        ? `${userName} -> ${charName}`
        : `${charName} -> ${userName}`;

    transactions.unshift({
        id: `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
        type: txType,
        category: '?∂‰?',
        amount: Number(amount),
        note: `${flowLabel}ÔΩ?{pairLabel}${note ? `ÔΩ?{note}` : ''}`,
        date: getTodayYMD(),
        createdAt: Date.now(),
        source: 'chat-transfer',
        flowType,
        direction
    });

    localStorage.setItem(KAKAOPAY_LEDGER_KEY, JSON.stringify({ budget, transactions }));
}

// --- 3. ?∏Â??üËÉΩÔºöË??≤Ë??ôÂÑ≤Â≠òË? UI ?åÊ≠• ---

/**
 * ?≤Â? AI ËßíËâ≤Ë®≠Â?‰∏¶Â?Ê≠?UI
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

    console.log("AI ËßíËâ≤Ë≥áÊ?Â∑≤Êõ¥?∞‰∏¶?åÊ≠• UI:", newName);
}

/**
 * ?≤Â??®Êà∂Ë≥áÊ?‰∏¶Â?Ê≠?UI
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

    console.log("?®Êà∂Ë≥áÊ?Â∑≤Êõ¥?∞‰∏¶?åÊ≠• UI:", newUserName);
}

/**
 * ?≤Â??®Êà∂ÂÆåÊï¥Ë≥áÊ?ÔºàÂ?Á®±„ÄÅË??ØÁ?Ôº?
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
    
    console.log("?®Êà∂ÂÆåÊï¥Ë≥áÊ?Â∑≤Êõ¥??);
}

/**
 * ?≤Â??∂Â??®Êà∂?çÁΩÆ?ÑÂ∑•?∑ÂáΩÂº?
 */
function getUserConfig() {
    let name = localStorage.getItem('sx_user_name');
    let avatar = localStorage.getItem('sx_user_avatar');
    let personality = localStorage.getItem('sx_user_personality');
    let background = localStorage.getItem('sx_user_background');
    
    // Ê™¢Êü•?ØÂê¶?â‰ªª‰ΩïÊ?‰ΩçÁº∫Â§±Ô?Â¶ÇÊ?Áº∫Â§±?áÂ?Ë©¶Â? sx_users Ë£úÂ?
    const hasMissingFields = !name || name === '?êË®≠?®Êà∂' || !avatar || !personality || !background;
    
    if (hasMissingFields) {
        const usersRaw = localStorage.getItem('sx_users');
        if (usersRaw) {
            try {
                const users = JSON.parse(usersRaw);
                if (Array.isArray(users) && users.length > 0) {
                    // ?óË©¶?æÂà∞?πÈ??ÑÁî®??
                    let matchedUser = null;
                    
                    // Â¶ÇÊ??âÂ?Â≠óÔ??óË©¶?æÂà∞?πÈ??ÑÁî®??
                    if (name && name !== '?êË®≠?®Êà∂') {
                        matchedUser = users.find(u => u.name === name);
                    }
                    
                    // Â¶ÇÊ?Ê≤íÊâæ?∞Âåπ?çÁ?Ôºå‰Ωø?®Á¨¨‰∏Ä?ãÁî®??
                    if (!matchedUser) {
                        matchedUser = users[0];
                    }
                    
                    if (matchedUser) {
                        // ?™Ë??ÖÁº∫Â§±Á?Ê¨Ñ‰?
                        if (!name || name === '?êË®≠?®Êà∂') {
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
                        console.log('[getUserConfig] Âæ?sx_users Ë£úÂ??®Êà∂Ë≥áÊ?:', matchedUser.name);
                    }
                }
            } catch (e) {
                console.warn('[getUserConfig] Ëß?? sx_users Â§±Ê?:', e);
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

    console.log("?®Êà∂ UI ?ùÂ??ñÂ???", user.name, user.avatar ? '?âÈ†≠Ë≤? : '?°È†≠Ë≤?);
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
        console.warn('[Chat] ?¥Êñ∞ users ?óË°®Â§±Ê?:', e);
    }
}

// --- ?ãÊ?Ê™¢Êü•‰∫ã‰ª∂Ë®≠Â? ---
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
    if (status) status.textContent = enabled ? 'Â∑≤Â?Ë®±Èö®Ê©üËß∏?? : '?úÈ??Ç‰??ÉËß∏??;
    
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
        
        if (status) status.textContent = settings.enabled ? 'Â∑≤Â?Ë®±Èö®Ê©üËß∏?? : '?úÈ??Ç‰??ÉËß∏??;
        
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
    if (status) status.textContent = enabled ? 'Â∑≤Â???NSFW ?™Â?‰∫§Êé•' : '?úÈ??Ç‰??ÉËá™?ï‰∫§??;
    toggle.addEventListener('change', () => {
        const isOn = toggle.checked;
        localStorage.setItem(PASSKEY_CONTROL_KEY, isOn ? '1' : '0');
        if (status) status.textContent = isOn ? 'Â∑≤Â???NSFW ?™Â?‰∫§Êé•' : '?úÈ??Ç‰??ÉËá™?ï‰∫§??;
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
        'nsfw', '?ê‰∫∫', '18Á¶?, '18+', '??, '?ßÊ?', '?≤Ê?', 'Ë£?, 'Ë£∏Èú≤', '?ßË°£', '?ßË§≤',
        '??, '‰π?, '‰π≥Êàø', 'ÁßÅË?', '?∞ÈÉ®', '?∞È?', '?∞Ë?', 'ÈæúÈ†≠', 'È´òÊΩÆ', 'Â∞ÑÁ≤æ',
        '?™ÊÖ∞', '??∫§', '?õ‰∫§', '?ßË?', 'Ë™øÊ?', 'SM', '?ÜÁ?', '?ßÁé©??, 'a??, 'av',
        'Ê¨≤Ê?', '?öÊ?', 'Â∫ä‰?', '??, '??, 'Á¥ÑÁÇÆ', '?ãÊàø', '??, 'Ë¶™ÁÜ±'
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
 * Ë£úÂ?Áæ©Ô?Ê™¢Êü•ËßíËâ≤?ØÂê¶Ë¢´Ê?Èª?
 * ?èËºØÔºöÊ™¢??localStorage ‰∏≠Á?Â∞ÅÈ??ÇÈ?ÔºåËã•?™Êªø 1 Â∞èÊ??áÁ??®Ëº∏??
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
            // ?ÑÂú®Â∞ÅÈ??ÇÈ???
            const minutes = Math.ceil(timeLeft / (1000 * 60));
            console.log(`ËßíËâ≤Â∑≤Ë¢´?âÈ?ÔºåÂâ©È§?${minutes} ?ÜÈ?`);
            
            if (msgInput) {
                msgInput.disabled = true;
                msgInput.placeholder = `ËßíËâ≤Â∑≤Ë¢´?âÈ? (?©È? ${minutes} ?ÜÈ?)`;
            }
            if (sendBtn) sendBtn.style.opacity = '0.5';
            if (genBtn) genBtn.style.opacity = '0.5';
            
            return true; // Â∑≤Ë¢´Â∞ÅÈ?
        } else {
            // Â∞ÅÈ??ÇÈ?Â∑≤È?ÔºåÊ??§Ë???
            localStorage.removeItem(blockKey);
        }
    }

    // ?¢Âæ©Ê≠?∏∏?Ä??
    if (msgInput) {
        msgInput.disabled = false;
        msgInput.placeholder = "Ëº∏ÂÖ•Ë®äÊÅØ...";
    }
    return false;
}
// --- 2. DOMContentLoaded ?ùÂ???(?¥Â??ªÈ??? ---
document.addEventListener('DOMContentLoaded', () => {
    charConfig = getActiveConfig();
    userConfig = getUserConfig();
    
    // A. ?ìÂ?ÂøÖË???DOM ?ÉÁ?
    const nameEl = document.getElementById('display-name');
    const chatTitleEl = document.getElementById('chat-detail-title');
    const charPersInput = document.getElementById('set-personality');
    const charBackInput = document.getElementById('set-background');
    const charNameInput = document.getElementById('set-name');
    const sendBtnTrigger = document.getElementById('send-trigger');
    const genBtnTrigger = document.getElementById('generate-trigger');
    const blockBtn = document.getElementById('block-char'); // ?âÈ??âÈ?
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
            charPresetSelect.innerHTML = '<option value="">?∏Ê?ËßíËâ≤</option>' + chars.map((char, index) => `
                <option value="${index}">${char.name || '?™ÂëΩ?çË???}</option>
            `).join('');
        }
        if (userPresetSelect) {
            const users = loadUserPresets();
            userPresetSelect.innerHTML = '<option value="">?∏Ê??®Êà∂</option>' + users.map((user, index) => `
                <option value="${index}">${user.name || '?™ÂëΩ?çÁî®??}</option>
            `).join('');
        }
    };

    const applyCharPreset = (preset) => {
        if (!preset) return;
        const charName = preset.name || 'AI ?©Á?';
        
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
            personality: preset.personality || '‰∏Ä?ãÂ??ÑÁ??©Ê?',
            background: preset.background || '??,
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
        console.log('[Chat] Â∑≤Â??®Ë??≤È?Ë®?', charName);
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
        
        console.log('[Chat] Â∑≤Â??®Áî®?∂È?Ë®?', userName, preset.avatar ? '?âÈ†≠Ë≤? : '?°È†≠Ë≤?);
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
            friendsPanel.innerHTML = '<div class="tab-placeholder">Â∞öÊú™?∞Â?Â•ΩÂ?</div>';
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
                    <div class="friend-preview">${friend.personality ? friend.personality.slice(0, 30) + '...' : 'ÈªûÊ??ãÂ??äÂ§©'}</div>
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
                    if (!charName || charName === '?êË®≠?®Êà∂') {
                        charName = charConfig.name || 'AI ?©Á?';
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
            const preview = lastMsg?.content ? lastMsg.content.slice(0, 20) : 'ÈªûÊ??ãÂ?Â∞çË©±';
            
            const sessionCharName = session.charName || localStorage.getItem('sx_char_name') || charConfig.name || 'AI ?©Á?';
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
                <div class="chat-meta">?õÂ?</div>
            `;
            chatListView.appendChild(item);
        });
        
        if (sessions.length === 0) {
            let charName = localStorage.getItem('sx_char_name');
            if (!charName || charName === '?êË®≠?®Êà∂') {
                charName = charConfig.name || 'AI ?©Á?';
            }
            const charAvatar = localStorage.getItem('sx_char_avatar') || '';
            const avatarStyle = charAvatar 
                ? `background-image: url('${charAvatar}'); background-size: cover; background-position: center;` 
                : 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);';
            
            // ‰øÆÂæ©: ?∫Â?‰ΩçÁ¨¶Ê∑ªÂ??πÊ? ID Ê®ôË?ÔºåË°®Á§∫ÈÄôÊòØÁ©∫Á??ã‰?‰ΩçÁ¨¶Ôºå‰??ØÂà™??
            chatListView.innerHTML = `
                <div class="chat-list-item chat-list-placeholder" data-chat-id="__placeholder__" style="justify-content: center; color: #888;">
                    <div class="chat-avatar" style="${avatarStyle}"></div>
                    <div class="chat-info" style="text-align: center;">
                        <div class="chat-name">${charName}</div>
                        <div class="chat-preview">ÈªûÊ??ãÂ?Â∞çË©±</div>
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
        if (!sessionCharName || sessionCharName === '?êË®≠?®Êà∂') {
            sessionCharName = charConfig.name || 'AI ?©Á?';
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
        
        // ‰øÆÂæ©: Ê™¢Êü•?ØÂê¶?∫‰?‰ΩçÁ¨¶?ÖÁõÆÔºå‰?‰ΩçÁ¨¶‰∏çÈ°ØÁ§∫Âà™?§ÈÅ∏??
        const chatId = item.dataset.chatId;
        if (chatId === '__placeholder__') {
            console.log('[Chat] ‰Ωî‰?Á¨¶È??Æ‰??ØÊè¥?≥Èçµ?∏ÂñÆ');
            return;
        }
        
        event.preventDefault();
        showChatActions(item);
    });

    let longPressTimer = null;
    chatListView?.addEventListener('touchstart', (event) => {
        const item = event.target.closest('.chat-list-item');
        if (!item) return;
        
        // ‰øÆÂæ©: Ê™¢Êü•?ØÂê¶?∫‰?‰ΩçÁ¨¶?ÖÁõÆ
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
            console.warn('[Chat] ?±Ë?Â§±Ê?: ?™ÈÅ∏?á‰ªª‰ΩïË?Â§©È???);
            hideChatActions();
            return;
        }
        selectedChatItem.style.display = 'none';
        hideChatActions();
    });

    chatDeleteBtn?.addEventListener('click', () => {
        // ‰øÆÂæ©: Ê∑ªÂ?Ë®∫Êñ∑?•Ë??åÈåØË™§Ê?Á§?
        console.log('[Chat] ?™Èô§?âÈ?ÈªûÊ?, selectedChatItem:', selectedChatItem);
        
        if (!selectedChatItem) {
            console.warn('[Chat] ?™Èô§Â§±Ê?: ?™ÈÅ∏?á‰ªª‰ΩïË?Â§©È???);
            alert('Ë´ãÂ??∑Ê??ñÂè≥?µÈ??äË??™Èô§?ÑË?Â§©È???);
            hideChatActions();
            return;
        }
        
        const chatId = selectedChatItem.dataset.chatId;
        console.log('[Chat] ?óË©¶?™Èô§ chatId:', chatId);
        
        // ‰øÆÂæ©: Ê™¢Êü•?ØÂê¶?∫‰?‰ΩçÁ¨¶?ÖÁõÆ
        if (chatId === '__placeholder__') {
            console.warn('[Chat] ?°Ê??™Èô§‰Ωî‰?Á¨¶È???);
            alert('Ê≠§ÁÇ∫Á©∫Á??ã‰?‰ΩçÁ¨¶ÔºåÁÑ°Ê≥ïÂà™?§„ÄÇË??àÈ?ÂßãÊñ∞?ÑÂ?Ë©±„Ä?);
            hideChatActions();
            return;
        }
        
        // ‰øÆÂæ©: Ê™¢Êü• chatId ?ØÂê¶Â≠òÂú®
        if (!chatId) {
            console.error('[Chat] ?™Èô§Â§±Ê?: chatId ?∫Á©∫');
            alert('?™Èô§Â§±Ê?ÔºöÁÑ°Ê≥ïË??•Ê≠§?äÂ§©?ÖÁõÆ');
            hideChatActions();
            return;
        }
        
        const sessions = loadChatSessions();
        const newSessions = sessions.filter(s => s.id !== chatId);
        
        console.log('[Chat] ?™Èô§??sessions ?∏È?:', sessions.length, '?™Èô§Âæ?', newSessions.length);
        
        saveChatSessions(newSessions);
        selectedChatItem.remove();
        renderFriendsList();
        renderChatListFromStorage(); // ‰øÆÂæ©: ?çÊñ∞Ê∏≤Ê??óË°®‰ª•Á¢∫‰øù‰??¥ÊÄ?
        hideChatActions();
        
        console.log('[Chat] ?äÂ§©?ÖÁõÆÂ∑≤Ê??üÂà™??);
    });


    backToListBtn?.addEventListener('click', () => {
        showChatList();
    });

    newChatBtn?.addEventListener('click', () => {
        let charName = localStorage.getItem('sx_char_name');
        if (!charName || charName === '?êË®≠?®Êà∂') {
            charName = charConfig.name || 'AI ?©Á?';
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

    // B. ?ùÂ???UI È°ØÁ§∫
    const hintEl = document.getElementById('hint-name');
    let displayName = localStorage.getItem('sx_char_name');
    if (!displayName || displayName === '?êË®≠?®Êà∂') {
        displayName = charConfig.name || "AI ?©Á?";
    }
    if (nameEl) nameEl.innerText = displayName;
    if (chatTitleEl) chatTitleEl.innerText = displayName;
    if (hintEl) hintEl.innerText = displayName;
    if (charPersInput) charPersInput.value = localStorage.getItem('sx_char_personality') || charConfig.personality || "";
    if (charBackInput) charBackInput.value = localStorage.getItem('sx_char_background') || charConfig.background || "";
    if (charNameInput) charNameInput.value = displayName;
    
    console.log('[Chat] ?ùÂ???UIÔºåË??≤Â?Á®?', displayName);

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

    // D. Á∂ÅÂ??áÂ?Ëº∏ÂÖ•??ÅΩ
    charPersInput?.addEventListener('input', (e) => updateActiveMask('personality', e.target.value));
    charBackInput?.addEventListener('input', (e) => updateActiveMask('background', e.target.value));
    charNameInput?.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (nameEl) nameEl.innerText = val; 
        if (chatTitleEl) chatTitleEl.innerText = val || 'AI ?©Á?';
        saveCharSettings(val); 
    });

    // E. Á∂ÅÂ??âÈ?ÈªûÊ?‰∫ã‰ª∂
    if (sendBtnTrigger) {
        sendBtnTrigger.onclick = (e) => {
            e.preventDefault();
            // ?≥ÈÄÅÂ??çÊ¨°Ê™¢Êü•?âÈ??Ä?ãÔ??•Â∑≤Ë¢´Ê?ÈªëÂ?‰∏çÂü∑Ë°?
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
        
        // ?ïÁ?Ë°®Ê??ÖÈÅ∏??
        if (data.type === 'EMOJI_SELECTED' && data.emoji) {
            console.log('[Chat] ?∂Âà∞Ë°®Ê??ÖÈÅ∏??', data.emoji);
            
            // ?ºÈÄÅÂ??áË°®??
            appendMsg('mine', '', { type: 'image', url: data.emoji.url, name: data.emoji.name });
            const history = JSON.parse(localStorage.getItem('sx_chat_history') || '[]');
            history.push({ role: "user", content: `[Ë°®Ê?: ${data.emoji.name}]`, imageUrl: data.emoji.url });
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
            
            // ?úÈ?Ë°®Ê??ÖÂ?Â∫óÈù¢??
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
        
        // ?ïÁ?Ë°®Ê??ÖÊõ¥??
        if (data.type === 'EMOJI_PACKS_UPDATED') {
            console.log('[Chat] Ë°®Ê??ÖÂ∑≤?¥Êñ∞ÔºåÊï∏??', data.count);
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
                console.log('[Chat] Ë®òÊÜ∂‰∏ä‰???', context.summary);
            }
            
            if (identity) {
                console.log('[Chat] AI Ë∫´‰ªΩ:', identity.name);
            }
            
            if (!items.length && !pool) return;
            const chatFlow = document.getElementById('chat-flow');
            if (!chatFlow || chatFlow.children.length > 0) return;
            
            if (items.length > 0) {
                const seed = items.slice(0, 8).map(item => ({ 
                    role: 'assistant', 
                    content: `?êË??∂„Ä?{item.content || item.summary}` 
                }));
                seed.forEach(m => appendMsg('other', m.content));
            }
            
            if (pool && pool.summary) {
                appendMsg('other', `?êÊ??•Ë??∂„Ä?{pool.summary}`);
            }
        }
        if (data.type === 'MEMORY_CLEAR_DONE') {
            alert('??Ë®òÊÜ∂Â∑≤Ê???);
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
            console.log('[Chat] ?∂Âà∞ settings ?¥Êñ∞ÔºåÈ??∞Ë??•Áî®?∂Ë???);
            userConfig = getUserConfig();
            initUserUI();
            
            const userLabels = document.querySelectorAll('.mine .user-name');
            userLabels.forEach(label => label.innerText = userConfig.name || 'User');
        }
        
        // ?ïÁ?‰∏ªÈ?ËÆäÊõ¥
        if (data.type === 'THEME_CHANGED' && data.theme) {
            console.log('[Chat] ?∂Âà∞‰∏ªÈ?ËÆäÊõ¥:', data.theme.name);
            applyChatTheme(data.theme);
            
            // ËΩâÁôº?∞Áà∂Ë¶ñÁ?‰ª•‰æø?åÊ≠•
            window.parent?.postMessage({
                type: 'THEME_CHANGED',
                theme: data.theme
            }, '*');
        }
        
        // ?ïÁ?Â§ñË?‰∏ªÈ?ËÆäÊõ¥
        if (data.type === 'APPEARANCE_THEME_CHANGED' && data.config) {
            console.log('[Chat] ?∂Âà∞Â§ñË?‰∏ªÈ?ËÆäÊõ¥');
            applyAppearanceConfig(data.config);
        }
        
        // ?ïÁ?‰∏ªÈ??µÂª∫?åÊ≠•
        if (data.type === 'THEME_CREATED' && data.theme) {
            console.log('[Chat] ?∂Âà∞‰∏ªÈ??µÂª∫:', data.theme.name);
            // ËΩâÁôº?∞Áà∂Ë¶ñÁ?‰ª•‰æø?åÊ≠•?∞Èõ≤Á´?
            window.parent?.postMessage({
                type: 'THEME_CREATED',
                theme: data.theme
            }, '*');
        }
    });

    if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'REQUEST_APP_FOLDER_SYNC', appId: 'settings' }, '*');
    }

    // ?êÊ†∏ÂøÉÊñ∞Â¢û„ÄëÁ?ÂÆöÊ?ÈªëÊ??ïÈ??äÂ?‰Ω?
    if (blockBtn) {
        blockBtn.onclick = () => {
            const charName = charConfig.name || "Ê≠§Ë???;
            if (confirm(`Á¢∫Â?Ë¶ÅÊ?Èª?${charName} ‰∏ÄÂ∞èÊ??éÔ??ôÊ??ìÂ??°Ê??ºÈÄÅË??Ø„ÄÇ`)) {
                // Ë®≠Â?‰∏ÄÂ∞èÊ?ÂæåÁ? timestamp
                const blockUntil = new Date().getTime() + (1 * 60 * 60 * 1000); 
                localStorage.setItem(`block_${charName}`, blockUntil);
                
                // Á´ãÂç≥?¥Êñ∞ UI ?Ä??
                checkBlockStatus(); 
                alert("Â∑≤Â?Ë©≤Ë??≤Êö´?ÇÊ?Èªë„Ä?);
            }
        };
    }

    if (deleteChatBtn) {
        deleteChatBtn.onclick = () => {
            if (!confirm('Á¢∫Â?Ë¶ÅÂà™?§ÁõÆ?çÂ?Ë©±Â?Ôº?)) return;
            
            const activeId = getActiveChatId();
            console.log('[Chat] ?™Èô§?∂Â?Â∞çË©±, activeId:', activeId);
            
            // ‰øÆÂæ©: Ê™¢Êü• activeId ?ØÂê¶Â≠òÂú®
            if (!activeId) {
                console.warn('[Chat] ?™Èô§Â§±Ê?: Ê≤íÊ?Ê¥ªË??ÑÂ?Ë©?);
                alert('?ÆÂ?Ê≤íÊ?Ê¥ªË??ÑÂ?Ë©±ÂèØ?™Èô§');
                return;
            }
            
            const sessions = loadChatSessions();
            const newSessions = sessions.filter(s => s.id !== activeId);
            
            console.log('[Chat] ?™Èô§??sessions ?∏È?:', sessions.length, '?™Èô§Âæ?', newSessions.length);
            
            saveChatSessions(newSessions);
            localStorage.removeItem('sx_chat_history');
            localStorage.removeItem('sx_chat_active'); // ‰øÆÂæ©: Ê∏ÖÈô§Ê¥ªË?Â∞çË©± ID
            
            renderHistory();
            renderChatListFromStorage();
            showChatList();
            alert('?ÆÂ?Â∞çË©±Â∑≤Âà™??);
            
            console.log('[Chat] ?∂Â?Â∞çË©±Â∑≤Ê??üÂà™??);
        };
    }

    if (clearChatBtn) {
        clearChatBtn.onclick = () => {
            if (!confirm('?™Ê??§Áï∂?çÂ?Ë©±ÂÖßÂÆπÔ?ÔºàË??∂Ê?Ë¶Å‰??ÉË¢´Ê∏ÖÊ?Ôº?)) return;
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
            if (!confirm('Á¢∫Â?Ë¶ÅÊ??Ü„ÄåË??∂Ê?Ë¶Å„ÄçÂ?ÔºüÈÄôÊ?ÂΩ±Èüø???Â∞çË©±??)) return;
            window.parent?.postMessage({
                type: 'MEMORY_CLEAR_REQUEST',
                payload: { scope: 'user' }
            }, '*');
            alert('Â∑≤ÈÄÅÂá∫Ë®òÊÜ∂Ê∏ÖÁ?Ë´ãÊ?');
        };
    }

    // F. ?ïÁ??ñÁ?ËÆÄ?ñË? iOS ?©È? (‰øùÊ??üÊ®£)
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
                        
                        console.log('[Chat] ?®Êà∂?≠Ë≤ºÂ∑≤‰?Â≠ò‰∏¶?åÊ≠•');
                    }
                };
                reader.readAsDataURL(file);
            });
        }
    }); 
});

    // --- Ê≠∑Âè≤Á¥Ä?ÑÈï∑Â∫¶Êéß??(?®Á??ºËø¥?àÂ?) ---
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
    // ?ùÂ??ñÂè≥?µÈÅ∏??
    if (!document.getElementById('context-menu')) {
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.id = 'context-menu';
        menu.innerHTML = `
            <div class="context-menu-item" onclick="copyText(event)">Ë§áË£Ω</div>
            <div class="context-menu-item" onclick="editMsg(event)">Á∑®ËºØ</div>
            <div class="context-menu-item" onclick="triggerRegen(event)">?çÊñ∞?üÊ?</div>
            <div class="context-menu-item danger" onclick="deleteMsg(event)">?™Èô§</div>
        `;
        document.body.appendChild(menu);
    }

// --- 3. ?¥È?Ê¨ÑÈ?Ëº?---
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
            
            console.log('[SideDrawer] Â∑≤Êõ¥?∞ÂÅ¥?äÊ?ËßíËâ≤Ë®≠Â?:', charConfig.name, charConfig.personality?.slice(0, 20));
            
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
            charName: charName || 'AI ?©Á?',
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
                    console.log('[InnerVoice] Â∑≤ÂâµÂª?ShortTermMemory');
                } else {
                    console.warn('[InnerVoice] ShortTermMemory ?™Â?Áæ©Ô??°Ê??≤Â??∞Áü≠?üË???);
                    return;
                }
            }

            const memoryContent = `[ÂøÉËÅ≤] ${charName} ?ÑÂÖßÂøÉÁç®?ΩÔ?${content}`;
            
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

            console.log('[InnerVoice] Â∑≤ÂÑ≤Â≠òÂà∞?≠Ê?Ë®òÊÜ∂ÔºåÁù°?†Ê?Â∞áË??∫Èï∑?üË???);
        } catch (e) {
            console.warn('[InnerVoice] ?≤Â??∞Áü≠?üË??∂Â§±??', e);
        }
    };

    const renderInnerVoiceHistory = () => {
        if (!innerVoiceHistoryList) return;
        const history = getInnerVoiceHistory();
        
        if (history.length === 0) {
            innerVoiceHistoryList.innerHTML = '<div class="history-empty">Â∞öÊú™?âÊ≠∑?≤Ë???/div>';
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
                console.error('Transformers.js ?ùÂ??ñÂ§±??', err);
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
                v.name.toLowerCase().includes('‰∏≠Ê?') ||
                v.name.toLowerCase().includes('?∞ÁÅ£')
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
                    reject(new Error('Ê≠§ÁÄèË¶Ω?®‰??ØÊè¥Ë™ûÈü≥Ëæ®Ë??üËÉΩ'));
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
                        reject(new Error(`Ë™ûÈü≥Ëæ®Ë??ØË™§: ${event.error}`));
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
                    reject(new Error('Ê≠§ÁÄèË¶Ω?®‰??ØÊè¥Ë™ûÈü≥?àÊ??üËÉΩ'));
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
                utterance.onerror = (event) => reject(new Error(`Ë™ûÈü≥?àÊ??ØË™§: ${event.error}`));
                
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
                    console.warn('Transformers.js STT Â§±Ê?ÔºåÂ?Ë©¶ÂÖ∂‰ªñÊñπÂº?', err);
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
                    console.warn('Transformers.js STT Â§±Ê?:', err);
                }
            }
            
            if (hasExternalSTT && options.audioBlob) {
                return await this.recognizeWithExternalAPI(options.audioBlob, settings);
            }
            
            throw new Error('Ê≤íÊ??ØÁî®?ÑË??≥Ëæ®Ë≠òÊ???);
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
            
            throw new Error('Ê≤íÊ??ØÁî®?ÑË??≥Â??êÊ???);
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
        'facebook-settings': 'Facebook Ë®≠Â?',
        instagram: 'Instagram',
        twitter: 'Twitter',
        weverse: 'Weverse',
        kakaopay: 'KakaoPay',
        weather: 'Â§©Ê∞£',
        music: '?≥Ê?',
        chrome: 'Chrome',
        album: '?∏Á∞ø',
        diary: '?•Ë?',
        notes: '?ôÂ???,
        settings: 'Ë®≠Â?'
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
        const charName = charConfig?.name || getActiveConfig().name || 'AI ?©Á?';
        const userName = userConfig?.name || localStorage.getItem('sx_user_name') || '??;
        
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
            charName: charConfig?.name || getActiveConfig().name || 'AI ?©Á?',
            createdAt: Date.now()
        };
        
        if (existingIndex !== -1) {
            diaries[existingIndex] = diaryEntry;
        } else {
            diaries.unshift(diaryEntry);
        }
        
        saveDiaries(diaries);
        closeDiaryPanel();
        alert('?•Ë?Â∑≤ÂÑ≤Â≠òÔ?');
    };

    const openCheckPhonePanel = () => {
        if (checkPhonePanel) {
            checkPhonePanel.classList.add('active');
        }
        const charName = charConfig?.name || getActiveConfig().name || 'AI ?©Á?';
        if (checkPhoneCharName) {
            checkPhoneCharName.textContent = `${charName} ?ÑÊ?Ê©ü`;
        }
        plusMenu?.classList.remove('open');
    };

    const closeCheckPhonePanel = () => {
        checkPhonePanel?.classList.remove('active');
        closeCharAppViewer();
    };

    const openCharApp = (appId) => {
        if (!charAppViewer || !charAppFrame) return;
        
        const charName = charConfig?.name || getActiveConfig().name || 'AI ?©Á?';
        const appName = appNames[appId] || appId;
        
        if (charAppTitle) {
            charAppTitle.textContent = `${charName} ??{appName}`;
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
        const charName = activeChar.name || 'AI ?©Á?';
        const personality = activeChar.personality || '?ãÂ?';
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
        
        return `# ËßíËâ≤Ë®≠Â?
- ?çÂ?: ${charName}
- ?ßÊ†º: ${personality}
- ?åÊôØ: ${background}

# ?®Êà∂Ë≥áË?
- ?çÂ?: ${userName}
- ?åÊôØ: ${userBio}

# ‰∏ñÁ??∏Áõ∏?úÂÖßÂÆ?
${dynamicWI || '??}

# ?ÄËøëÂ?Ë©±Ë???
${historyText || '??}

# ËßíËâ≤?ÄÂæåË™™?ÑË©±
${lastCharContent || 'ÔºàÂ??™Ê?Â∞çË©±Ôº?}

# ‰ªªÂ?Ë™™Ê?
Ë´ã‰ª•Á¨¨‰?‰∫∫Á®±Ë¶ñË?ÔºåÊí∞ÂØ?${charName} ?®Ë™™?∫Ê?ÂæåÈÇ£?•Ë©±?ÇÁ??ßÂ??®ÁôΩ??

Ë¶ÅÊ?Ôº?
1. ‰ΩøÁî®Á¨¨‰?‰∫∫Á®±?åÊ??ç‰??òËø∞
2. Â≠óÊï∏‰∏çÂ???300 Â≠?
3. Ë¶ÅÂ??æË??≤ÂÖßÂøÉÁ?ÂØ¶Á??≥Ê??åÊ???
4. ?Ø‰ª•?ÖÂê´Â∞?${userName} ?ÑË?ÂØüÂ??üÂ?
5. Ë¶ÅÁ¨¶?àË??≤Á??ßÊ†ºË®≠Â?
6. ?Ø‰ª•?èÈú≤‰∏Ä‰∫õË°®?¢Ë©±Ë™ûË?ÂæåÁ?Ê∑±Â±§?≥Ê?
7. Ë™ûË?È¢®Ê†ºË¶ÅË?ËßíËâ≤?ßÊ†º‰∏Ä??

Ë´ãÁõ¥?•È?ÂßãÂÖßÂøÉÁç®?ΩÔ?‰∏çÈ?Ë¶Å‰ªª‰ΩïÈ??≠Ê?Ë™™Ê?Ôºö`;
    };

    const generateInnerVoice = async () => {
        if (!innerVoiceLoading || !innerVoiceContent) return;
        
        innerVoiceLoading.classList.add('active');
        innerVoiceContent.innerHTML = '<div class="inner-voice-empty">Ê≠?ú®?üÊ?...</div>';
        
        try {
            const prompt = assembleInnerVoicePrompt();
            const payload = [
                { role: 'system', content: '‰Ω†ÊòØ‰∏Ä‰ΩçÊ??∑Ê?ÂØ´Ë??≤ÂÖßÂøÉÊà≤?Ñ‰?ÂÆ∂„ÄÇË??®Á¥∞?©Á?Á≠ÜËß∏Ôºå‰ª•Á¨¨‰?‰∫∫Á®±Ë¶ñË??èÂØ´ËßíËâ≤?ÑÂÖßÂøÉÁç®?Ω„Ä? },
                { role: 'user', content: prompt }
            ];
            
            const apis = JSON.parse(localStorage.getItem('api_configs') || '[]');
            const activeIndex = parseInt(localStorage.getItem('sx_active_api'), 10);
            const validIndex = (!isNaN(activeIndex) && activeIndex >= 0 && activeIndex < apis.length) ? activeIndex : 0;
            const config = apis[validIndex] || apis[0];
            
            const apiType = config?.type || 'openai';
            
            // Gemini ‰∏çÈ?Ë¶?url Ê™¢Êü•ÔºåÂ???URL ?ØËá™?ïË®≠ÂÆöÁ?
            if (!config || (!config.url && apiType !== 'gemini')) {
                innerVoiceContent.innerHTML = '<div class="inner-voice-empty">Ë´ãÂ?Ë®≠Â? API</div>';
                innerVoiceLoading.classList.remove('active');
                return;
            }
            
            // Gemini ?ÄË¶?key Ê™¢Êü•
            if (apiType === 'gemini' && !config.key) {
                innerVoiceContent.innerHTML = '<div class="inner-voice-empty">Gemini API ?ÄË¶?API Key</div>';
                innerVoiceLoading.classList.remove('active');
                return;
            }
            let innerVoiceText;
            
            // Gemini ?üÁ? API ?ºÂ?
            if (apiType === 'gemini') {
                const model = config.model || 'gemini-1.5-flash';
                const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.key}`;
                
                const contents = [{
                    role: 'user',
                    parts: [{ text: `‰Ω†ÊòØ‰∏Ä‰ΩçÊ??∑Ê?ÂØ´Ë??≤ÂÖßÂøÉÊà≤?Ñ‰?ÂÆ∂„ÄÇË??®Á¥∞?©Á?Á≠ÜËß∏Ôºå‰ª•Á¨¨‰?‰∫∫Á®±Ë¶ñË??èÂØ´ËßíËâ≤?ÑÂÖßÂøÉÁç®?Ω„ÄÇ\n\n${prompt}` }]
                }];
                
                const response = await fetch(targetUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents, generationConfig: { temperature: 0.9, maxOutputTokens: 800 } })
                });
                
                const data = await response.json();
                if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
                innerVoiceText = data.candidates?.[0]?.content?.parts?.[0]?.text || '?üÊ?Â§±Ê?';
            } else {
                // OpenAI ?∏ÂÆπ?ºÂ??ñËá™Ë®ÇÁ´ØÈª?
                let targetUrl;
                if (apiType === 'custom') {
                    targetUrl = config.url;
                } else {
                    targetUrl = config.url.endsWith('/chat/completions') 
                        ? config.url 
                        : config.url.replace(/\/$/, '') + '/chat/completions';
                }
                
                const headers = buildApiHeaders(config);
                
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
                innerVoiceText = data.choices?.[0]?.message?.content || '?üÊ?Â§±Ê?';
            }
            
            innerVoiceContent.innerHTML = `<div class="inner-voice-text">${innerVoiceText}</div>`;
            
            const currentChars = JSON.parse(localStorage.getItem('sx_masks') || '[]');
            const activeChar = currentChars[0] || {};
            const charName = activeChar.name || 'AI ?©Á?';
            saveInnerVoiceToHistory(innerVoiceText, charName);
            
            saveInnerVoiceToShortTermMemory(innerVoiceText, charName);
            
        } catch (err) {
            innerVoiceContent.innerHTML = `<div class="inner-voice-empty">?üÊ?Â§±Ê?Ôº?{err.message}</div>`;
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
                    hintSpan.textContent = 'Ê≠§ÁÄèË¶Ω?®‰??ØÊè¥Ë™ûÈü≥?üËÉΩÔºåË?‰ΩøÁî® Chrome/Edge ?ñË®≠ÂÆöÂ???API';
                }
            } else if (settings.useTransformers && availability.transformersSTT) {
                const hintSpan = voiceMessageSettingsHint.querySelector('span');
                if (hintSpan) {
                    hintSpan.textContent = '‰ΩøÁî® Transformers.js Whisper ?¨Ê??ãÁ?ÔºàÈ?Ê¨°È?‰∏ãË?Ê®°Â?Ôº?;
                    voiceMessageSettingsHint.classList.add('active');
                    voiceMessageSettingsHint.style.background = 'rgba(125, 231, 255, 0.15)';
                    voiceMessageSettingsHint.style.borderColor = 'rgba(125, 231, 255, 0.3)';
                }
            } else if (availability.builtInSTT || availability.builtInTTS) {
                const hintSpan = voiceMessageSettingsHint.querySelector('span');
                if (hintSpan && !availability.external) {
                    hintSpan.textContent = '‰ΩøÁî®?èË¶Ω?®ÂÖßÂª∫Ë??≥Â??ΩÔ??ØÂú®Ë®≠Â?‰∏≠Â??õÔ?';
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
        if (voiceRecordHint) voiceRecordHint.textContent = 'ÈªûÊ?È∫•Â?È¢®È?ÂßãÈ???;
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
            alert('Ê≤íÊ??ØÁî®?ÑË??≥Ëæ®Ë≠òÊ??ô„ÄÇË???Settings ?üÁî® Transformers.js ?ñË®≠ÂÆ?STT API??);
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
        if (voiceRecordHint) voiceRecordHint.textContent = 'Ë´ãË™™Ë©?..ÈªûÊ??úÊ≠¢';
        
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
            alert('Ë™ûÈü≥Ëæ®Ë?Â§±Ê?Ôº? + err.message);
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
        if (voiceRecordHint) voiceRecordHint.textContent = '?ïÁ?‰∏?..';
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
                
                if (voiceRecordHint) voiceRecordHint.textContent = 'Ëæ®Ë?‰∏?..';
                
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
                voiceRecordHint.textContent = useTransformers ? '?ÑÈü≥‰∏≠Ô?Â∞á‰Ωø??Whisper Ëæ®Ë?Ôº?..' : '?ÑÈü≥‰∏?..ÈªûÊ??úÊ≠¢';
            }
            
            voiceMsgTimerInterval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - voiceMsgStartTime) / 1000);
                if (recordTimeEl) {
                    recordTimeEl.textContent = formatTime(elapsed);
                }
            }, 1000);
            
        } catch (err) {
            alert('?°Ê??üÂ?È∫•Â?È¢®Ô?' + err.message);
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
        if (voiceRecordHint) voiceRecordHint.textContent = '?ïÁ?‰∏?..';
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
            previewTranscriptText.textContent = transcript || 'ÔºàÁÑ°Ê≥ïËæ®Ë≠òË??≥ÂÖßÂÆπÔ?';
        }
        if (voiceRecordHint) voiceRecordHint.textContent = '?ÑÈü≥ÂÆåÊ?';
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
        const contentText = transcript || '[Ë™ûÈü≥Ë®äÊÅØ]';
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
            alert('Ê≠§Ë??≥Ë??ØÁÑ°Ê≥ïÊí≠??);
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
        if (callStatusText) callStatusText.textContent = 'Ê∫ñÂ?‰∏?..';
        if (callStatusIcon) {
            callStatusIcon.className = 'call-status-icon';
            callStatusIcon.innerHTML = '<i class="fas fa-phone"></i>';
        }
        if (voiceCallVisualizer) voiceCallVisualizer.classList.remove('active');
        if (voiceCallStartBtn) voiceCallStartBtn.classList.remove('hidden');
        if (voiceCallEndBtn) voiceCallEndBtn.classList.add('hidden');
        if (voiceCallTranscript) {
            voiceCallTranscript.innerHTML = '<div class="transcript-empty">?öË©±?ßÂÆπÂ∞áÈ°ØÁ§∫Âú®?ôË£°</div>';
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
            alert('Ë´ãÂ???Settings Ë®≠Â? STT/TTS ?çÂ?');
            return;
        }

        callState = 'calling';
        callStartTime = Date.now();
        callTranscriptData = [];
        callTtsBlobs = [];
        if (callStatusText) callStatusText.textContent = 'Ê≠?ú®??é•...';
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
            if (callStatusText) callStatusText.textContent = '?öË©±‰∏?;
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
            alert('?°Ê??üÂ?È∫•Â?È¢®Ô?' + err.message);
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
        
        const apiType = config?.type || 'openai';
        
        // Gemini ‰∏çÈ?Ë¶?url Ê™¢Êü•ÔºåÂ???URL ?ØËá™?ïË®≠ÂÆöÁ?
        if (!config || (!config.url && apiType !== 'gemini')) {
            addTranscript('char', '(?™Ë®≠ÂÆ?API)');
            return;
        }
        
        // Gemini ?ÄË¶?key Ê™¢Êü•
        if (apiType === 'gemini' && !config.key) {
            addTranscript('char', '(Gemini API ?ÄË¶?API Key)');
            return;
        }
        const currentChars = JSON.parse(localStorage.getItem('sx_masks') || '[]');
        const activeChar = currentChars[0] || {};
        const charName = activeChar.name || 'AI ?©Á?';
        const systemPrompt = await ChatEngine.assembleSystemPrompt(text);

        const payload = [
            { role: 'system', content: systemPrompt },
            ...ChatEngine.getHistorySlice()
        ];

        try {
            let reply;
            
            // Gemini ?üÁ? API ?ºÂ?
            if (apiType === 'gemini') {
                const model = config.model || 'gemini-1.5-flash';
                const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.key}`;
                
                // ËΩâÊ???Gemini ?ºÂ?
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
                // OpenAI ?∏ÂÆπ?ºÂ??ñËá™Ë®ÇÁ´ØÈª?
                let targetUrl;
                if (apiType === 'custom') {
                    targetUrl = config.url;
                } else {
                    targetUrl = config.url.endsWith('/chat/completions') 
                        ? config.url 
                        : config.url.replace(/\/$/, '') + '/chat/completions';
                }

                const headers = buildApiHeaders(config);

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
            addTranscript('char', `(?ØË™§: ${err.message})`);
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

        const charName = charConfig?.name || getActiveConfig().name || 'AI ?©Á?';
        const userName = userConfig?.name || localStorage.getItem('sx_user_name') || '??;
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
        const charName = charConfig?.name || getActiveConfig().name || '?™Áü•';

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

        if (callStatusText) callStatusText.textContent = '?öË©±ÁµêÊ?';
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
            alert('?ñÁ?Â§ßÂ?Ë´ãÂãøË∂ÖÈ? 2MB');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            customEnvelopeImage = reader.result;
            if (envelopeCustomPreview) {
                envelopeCustomPreview.innerHTML = `<img src="${customEnvelopeImage}" alt="?™Ë?Á¥ÖÂ?Â∞ÅÈù¢">`;
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
            coverContent = 'Â∞?;
        } else if (selectedEnvelopeStyle === 'default') {
            coverContent = 'Á¶?;
        } else if (selectedEnvelopeStyle === 'gold') {
            coverContent = '??;
        } else if (selectedEnvelopeStyle === 'pink') {
            coverContent = '??;
        }
        
        return `
            <div class="envelope-card">
                <div class="envelope-card-cover ${coverClass}" style="${coverStyle}">${coverContent}</div>
                <div class="envelope-card-info">
                    <div class="amount">${formatNTD(amount)}</div>
                    <div class="note">${note ? sanitizeText(note) : '?≠Â??ºË≤°'}</div>
                </div>
            </div>
        `;
    };

    const renderTransferWallets = () => {
        if (!transferWalletMount) return;
        const wallets = getChatWallets();
        const userName = sanitizeText(userConfig?.name || localStorage.getItem('sx_user_name') || '??);
        const charName = sanitizeText(charConfig?.name || getActiveConfig().name || 'AI ?©Á?');
        transferWalletMount.innerHTML = `
            <div class="transfer-wallet">
                <div class="label">${userName} ?¢Â?</div>
                <div class="value">${formatNTD(wallets.user)}</div>
            </div>
            <div class="transfer-wallet">
                <div class="label">${charName} ?¢Â?</div>
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
            alert('Ë´ãËº∏?•Ê≠£Á¢∫È?È°?);
            return;
        }

        const wallets = getChatWallets();
        const payerKey = direction === 'user_to_char' ? 'user' : 'char';
        const receiverKey = payerKey === 'user' ? 'char' : 'user';
        if (wallets[payerKey] < amount) {
            alert('‰ªòÊ¨æ?πÈ?È°ç‰?Ë∂?);
            return;
        }

        wallets[payerKey] -= amount;
        wallets[receiverKey] += amount;
        saveChatWallets(wallets);
        renderTransferWallets();

        const userName = userConfig?.name || localStorage.getItem('sx_user_name') || '??;
        const charName = charConfig?.name || getActiveConfig().name || 'AI ?©Á?';
        const flowLabel = flowType === 'envelope' ? 'Á¥ÖÂ?' : (flowType === 'request' ? '?∂Ê¨æ' : 'ËΩâÂ∏≥');
        const fromName = direction === 'user_to_char' ? userName : charName;
        const toName = direction === 'user_to_char' ? charName : userName;

        let payCard;
        if (flowType === 'envelope') {
            payCard = getEnvelopeCardHtml(flowLabel, amount, note, fromName, toName);
        } else {
            payCard = `
                <div class="map-card">
                    <div class="map-info" style="font-weight:700;">?í≥ ${flowLabel}?êÂ?</div>
                    <div class="map-info">${sanitizeText(fromName)} -> ${sanitizeText(toName)}</div>
                    <div class="map-info">?ëÈ?Ôº?{formatNTD(amount)}</div>
                    <div class="map-info">${note ? sanitizeText(note) : '?°Â?Ë®?}</div>
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
                    history.push({ role: "user", content: `[Ë°®Ê?: ${item.name || 'sticker'}]`, imageUrl: item.url });
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

    const kaomojiList = ['(Ôø?ñΩÔø?', '(ÔΩ°‚??ø‚?ÔΩ?', '(?ß‚???', '( ?§QÄ·¥ó‚Ä§Q?)', '(?Ø¬∞‚ñ°¬∞Ôºâ‚ïØÔ∏??ª‚???, '?†„?', '(‡≤•Ô?‡≤?', '(¬¥ÔΩ•œâÔΩ•`)', '(?•ÔΩ°?ï‚Äø‚Äø‚?ÔΩ???, '(*¬¥?Ä`)~??, '(?§QÄ??§Q???, '(Ôø?∏∂Ôø?', '(?ï‚Äø‚?)', '(?†‚Äø‚?)', '(?Å¬¥‚ó°`??', '(?ø‚??ø‚?)', '(?ß‚ó°??', '(?ï·??ï‚úø)', '(?†‚Äø‚???', '(?ï‚Äø‚???', '(ÔΩ°‚ô•?ø‚ô•ÔΩ?', '(?°‚Äø‚ô°)', '(?•œâ‚ô•)', '(?ï·???', '(?†·???', '(?ï‚Äø‚Äø‚?)', '(?†‚Äø‚Äø‚?)', '(*?ßœâ‚â¶)', '(?ï‚Äø‚?*)', '(?†‚Äø‚?*)', '(?ßœâ‚úß)', '(?ï·??ï‚úß)', '(?†·??†‚úß)'];

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
            console.warn('[Chat] ËºâÂÖ•Ë°®Ê??ÖÂ§±??', e);
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
                    alert('NovaAI Â∞öÊú™Ë®≠Â?ÔºåË???Settings > API Ë®≠Â?Â°´ÂÖ• API URL ??API Key');
                    return;
                }
                alert('NovaAI Â∑≤Ë®≠ÂÆöÔ?ÂæÖÊé•?•Á??êÊ?Á®?);
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
                        <span>?ãÊ?Â§ñË?Ë®≠Â?</span>
                        <button class="dialog-close">&times;</button>
                    </div>
                    <div class="dialog-body">
                        <div class="phone-appearance-form">
                            <div class="form-group">
                                <label for="phone-appearance-brand">?ãÊ?Âª†Á?</label>
                                <input type="text" id="phone-appearance-brand" placeholder="‰æãÔ?iPhone, Samsung, Sxiphone">
                            </div>
                            <div class="form-group">
                                <label for="phone-appearance-model">?ãÊ??ãË?/?çÁ®±</label>
                                <input type="text" id="phone-appearance-model" placeholder="‰æãÔ?iPhone 15 Pro, Galaxy S24">
                            </div>
                            <div class="form-group">
                                <label for="phone-appearance-font">Â≠óÈ?</label>
                                <select id="phone-appearance-font">
                                    <option value="'SF Pro Display', sans-serif">SF Pro Display (iOS)</option>
                                    <option value="'Inter', sans-serif">Inter (?æ‰ª£)</option>
                                    <option value="'Roboto', sans-serif">Roboto (Android)</option>
                                    <option value="'Segoe UI', sans-serif">Segoe UI (Windows)</option>
                                    <option value="'Arial', sans-serif">Arial (?öÁî®)</option>
                                    <option value="custom">?™Ë?Â≠óÂ?</option>
                                </select>
                                <input type="text" id="phone-appearance-font-custom" class="hidden" placeholder="‰æãÔ?'Helvetica Neue', sans-serif">
                            </div>
                            <div class="form-group">
                                <label for="phone-appearance-color">‰∏ªËâ≤Ë™?/label>
                                <input type="color" id="phone-appearance-color" value="#333333">
                            </div>
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="phone-appearance-show-border" checked>
                                    <span>È°ØÁ§∫?ãÊ??äÊ?</span>
                                </label>
                            </div>
                            <div class="preview-area">
                                <div class="preview-phone-mini">
                                    <div class="preview-phone-border-mini"></div>
                                    <div class="preview-phone-screen-mini">
                                        <div class="preview-brand-mini">?ãÊ??êË¶Ω</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="dialog-footer">
                        <button class="dialog-btn secondary" id="phone-appearance-cancel">?ñÊ?</button>
                        <button class="dialog-btn primary" id="phone-appearance-save">Â•óÁî®Ë®≠Â?</button>
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
                const brand = brandInput?.value || '?ãÊ?';
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
    // Á∂ÅÂ?ËßíËâ≤Ë®≠Â??≤Â??âÈ?
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
    alert('ËßíËâ≤Ë®≠Â?Â∑≤Â???);
});

    // Á∂ÅÂ??®Êà∂?¢ÂÖ∑?≤Â??âÈ?
    document.getElementById('save-mask')?.addEventListener('click', () => {
    const userNameVal = document.getElementById('set-user-name')?.value.trim() || 'User';
    const userBgVal = document.getElementById('set-user-background')?.value.trim() || '';
    
    saveUserFullSettings(userNameVal, userBgVal);
    alert('?ã‰∫∫?¢ÂÖ∑Â∑≤Â???);
});
}

// --- 4. ?úÈ??≥Èçµ?∏ÂñÆ ---
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

// --- 5. ‰∏ñÁ??∏Â???(?∞Êû∂Êß? ---
const WorldInfoEngine = {
    /**
     * @param {string} latestText - ?®Êà∂?Ä?∞Á?Ëº∏ÂÖ•?áÂ?
     * @param {object} allWorldsData - ?ÖÂê´?Ä?â‰??åÊõ∏?ÑÁâ©‰ª∂Â?
     * @param {string} currentBookTitle - (?ØÈÅ∏) ?∂Â? UI ?∏‰∏≠?ÑÊõ∏??
     */
    scanAndGetContent(latestText, allWorldsData, currentBookTitle = "") {
        if (!allWorldsData) return "";
        
        let activeContent = "";
        
        // --- Á¨¨‰?Ê≠•Ô?ËÆÄ?ñÂ∑≤‰øùÂ??Ñ‰??åÊõ∏?õË?Ë®≠Â? ---
        const mounts = getWorldbookMounts();
        
        // --- Á¨¨‰?Ê≠•Ô??ïÁ?Á¶ÅÊ≠¢Ë©?(?ÄÈ´òÂÑ™?àÊ?) ---
        const forbiddenList = allWorldsData.sx_detected_forbidden || [];
        if (forbiddenList.length > 0) {
            activeContent += `\n<CRITICAL_RULE>\nÁµïÂ?Á¶ÅÊ≠¢?®Â?Ë¶Ü‰∏≠?∫Áèæ‰ª•‰?Ë©ûÂ?Ôºö[${forbiddenList.join(', ')}]\n</CRITICAL_RULE>\n`;
        }

        // --- ?∞Êû∂ÊßãÔ??ïÁ??∏Â??ßÂÆπ (?®Â??õË?) ---
        if (allWorldsData.core && allWorldsData.core.sx_worldbook_core) {
            const coreEntries = allWorldsData.core.sx_worldbook_core;
            if (Array.isArray(coreEntries)) {
                coreEntries.forEach(entry => {
                    if (!entry.enabled) return;
                    
                    // ?∏Â??ßÂÆπÂßãÁ?ËºâÂÖ•ÔºåÊ??πÊ?Ëß∏ÁôºË©?
                    const hasTriggers = entry.triggers && entry.triggers.length > 0;
                    const triggerMatch = hasTriggers && entry.triggers.some(k => latestText.includes(k));
                    
                    if (!hasTriggers || triggerMatch) {
                        activeContent += `<CORE title="${entry.title}">\n${entry.content}\n</CORE>\n`;
                    }
                });
            }
        }
        
        // --- ?∞Êû∂ÊßãÔ??ïÁ?Ê¢ù‰ª∂ÂºèÂÖßÂÆ?(Â±Ä?®Ê?Ëº? ---
        if (allWorldsData.conditional) {
            const cond = allWorldsData.conditional;
            
            // ?ïÁ?Ê®°Â?Â∞àÁî®?îË≠∞
            if (cond.model_protocols && cond.model_protocols.entries) {
                cond.model_protocols.entries.forEach(entry => {
                    if (!entry.enabled) return;
                    const triggerMatch = entry.triggers && entry.triggers.some(k => latestText.includes(k));
                    if (triggerMatch) {
                        activeContent += `<MODEL_PROTOCOL title="${entry.title}">\n${entry.content}\n</MODEL_PROTOCOL>\n`;
                    }
                });
            }
            
            // ?ïÁ??áÈ¢®Ë™≤Á?
            if (cond.style_courses && cond.style_courses.entries) {
                cond.style_courses.entries.forEach(entry => {
                    if (!entry.enabled) return;
                    const triggerMatch = entry.triggers && entry.triggers.some(k => latestText.includes(k));
                    if (triggerMatch) {
                        activeContent += `<STYLE title="${entry.title}">\n${entry.content}\n</STYLE>\n`;
                    }
                });
            }
            
            // ?ïÁ?Â∞èÂ??¥È???
            if (cond.theater_types && cond.theater_types.entries) {
                cond.theater_types.entries.forEach(entry => {
                    if (!entry.enabled) return;
                    const triggerMatch = entry.triggers && entry.triggers.some(k => latestText.includes(k));
                    if (triggerMatch) {
                        activeContent += `<THEATER_TYPE title="${entry.title}">\n${entry.content}\n</THEATER_TYPE>\n`;
                    }
                });
            }
            
            // ?ïÁ?NSFWÊ®°Á?
            if (cond.nsfw_modules && cond.nsfw_modules.entries) {
                cond.nsfw_modules.entries.forEach(entry => {
                    if (!entry.enabled) return;
                    const triggerMatch = entry.triggers && entry.triggers.length > 0 && 
                                        entry.triggers.some(k => latestText.includes(k));
                    // NSFW Ê®°Á??Ø‰ª•?°Ëß∏?ºË?ÔºàÂ?ÁµÇË??•Ô??ñÊ†π?öËß∏?ºË?
                    if (!entry.triggers || entry.triggers.length === 0 || triggerMatch) {
                        activeContent += `<NSFW_MODULE title="${entry.title}">\n${entry.content}\n</NSFW_MODULE>\n`;
                    }
                });
            }
            
            // ?ïÁ?NPCÂÆ¢‰∏≤
            if (cond.npc_guest_appearances && cond.npc_guest_appearances.entries) {
                cond.npc_guest_appearances.entries.forEach(entry => {
                    if (!entry.enabled) return;
                    const triggerMatch = entry.triggers && entry.triggers.some(k => latestText.includes(k));
                    if (triggerMatch) {
                        activeContent += `<NPC_GUEST title="${entry.title}">\n${entry.content}\n</NPC_GUEST>\n`;
                    }
                });
            }
            
            // ?ïÁ??πÊ?Ë£ú‰?
            if (cond.special_patches && cond.special_patches.entries) {
                cond.special_patches.entries.forEach(entry => {
                    if (!entry.enabled) return;
                    activeContent += `<PATCH title="${entry.title}">\n${entry.content}\n</PATCH>\n`;
                });
            }
        }
        
        // --- ?∞Êû∂ÊßãÔ??ïÁ??áÂ†¥?ßÂÆπ (?±theater.js?ïÁ?ÔºåÈÄôË£°?™Â?Ê®ôË?) ---
        if (allWorldsData.theater && allWorldsData.theater.sx_worldbook_theater) {
            // ?áÂ†¥?ßÂÆπ??theater.js ËÆÄ?ñÔ??ôË£°?™Ê∑ª?†Ê?Ë®?
            activeContent += `<!-- THEATER_CONTENT_AVAILABLE -->\n`;
        }

        // --- ?äÊû∂ÊßãÂÖºÂÆπÔ??πÊ??õË?Ë®≠Â??åÈ??•Â?Ë£ùÂÖßÂÆ?---
        const categories = ['cot', 'style', 'global', 'keywords', 'backend'];
        
        // ?â‰?ÁΩÆÂ?Áµ?
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
                // Ê™¢Êü•Ê¢ùÁõÆ?¨Ë∫´??enabled ?Ä??
                if (entry.enabled === false) return;
                
                // Ê™¢Êü•?ØÂê¶Ë¢´Ê?Ëº?
                const mount = mounts.find(m => m.name === entry.title);
                const isGlobal = (cat === 'global');
                
                // global ?ÜÈ??êË®≠?üÁî®Ôºå‰??ÄË¶ÅÂú® mounts ‰∏≠Ë®≠ÂÆ?
                // ?∂‰??ÜÈ??ÄË¶ÅÂú® mounts ‰∏≠Ê?Á¢∫Â???
                const isMountEnabled = isGlobal 
                    ? (mount?.enabled ?? true)  // global ?êË®≠ true
                    : (mount?.enabled ?? false); // ?∂‰??ÜÈ??êË®≠ false
                
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

        // ?âÈ?Â∫èÁ??àË??∂Ê??ßÂÆπ
        activeContent += contentByPosition.top.join('');
        activeContent += contentByPosition.mid.join('');
        activeContent += contentByPosition.bottom.join('');

        return activeContent;
    }
};

// --- 6. AI ?∏Â??èËºØ (‰øÆÊ≠£?? ---
const ChatEngine = {
    getGenerationMode() {
        return localStorage.getItem('sx_generation_mode') || 'dialogue';
    },
    getHistorySlice() {
        const depth = parseInt(localStorage.getItem('chat_history_range')) || 30;
        let history = JSON.parse(localStorage.getItem('sx_chat_history') || '[]');
        return history.slice(-depth);
    },
    // ?≤Â??ú‰?Ë∑ùÈõ¢Ë®≠Â?
    getRelationshipDistanceSettings() {
        const meetupMentionEnabled = localStorage.getItem('sx_meetup_mention_enabled') !== 'false';
        const distance = localStorage.getItem('sx_relationship_distance') || 'moderate';
        return {
            meetupMentionEnabled,
            distance
        };
    },
    // ?πÊ??ú‰?Ë∑ùÈõ¢Ë®≠Â??üÊ??êÁ§∫
    getRelationshipDistancePrompt(settings) {
        const { meetupMentionEnabled, distance } = settings;
        
        const distanceGuides = {
            'close': {
                description: 'Ë¶™Â?Ë∑ùÈõ¢',
                instructions: `‰Ω†ÂÄëÁ??ú‰??ûÂ∏∏Ë¶™Â?ÔºåÂèØ‰ª•Ëá™?∂Âú∞Ë®éË?‰ª•‰?Ë©±È?Ôº?
- Á∑ö‰?Ë¶ãÈù¢?ÅÁ??É„ÄÅ‰?Ëµ∑Âá∫??
- ?åÂ??Å‰?Ëµ∑Á?Ê¥?
- Ë¶™Â??ÑËÇ¢È´îÊé•Ëß?
- ?™‰??ÑÂÖ±?åË???
Ë´ãÊ†π?öË??≤ÊÄßÊ†º?™ÁÑ∂?∞Ë°®?îÂ?Ë¶ãÈù¢?ÑÊ?ÂæÖÂ?Ê∏¥Ê??Ç`
            },
            'moderate': {
                description: '?©‰∏≠Ë∑ùÈõ¢',
                instructions: `‰Ω†ÂÄëÁ??ú‰?Ê≠?ú®?ºÂ?‰∏≠Ô??Ø‰ª•?∂Áàæ?êÂ?Ôº?
- Ë¶ãÈù¢?ÑÂèØ?ΩÊÄßÔ?‰ΩÜ‰?Ë¶ÅÂ§™?ªÁ?
- ‰∏ÄËµ∑Â??†Ê¥ª?ïÁ??ÄÁ¥?
- Â∞çÊú™‰æÜË??¢Á??üÂ?
Ë´ã‰??ÅËá™?∂Ô?‰∏çË??éÊñº?•Â??∞Êé®?≤Ë??¢Ë©±È°å„ÄÇ`
            },
            'distant': {
                description: '?†Ë???,
                instructions: `‰Ω†ÂÄëÁõÆ?çÁ∂≠?ÅÈ?Ë∑ùÈõ¢?ÑÈ?‰øÇÊ®°Âºè„ÄÇË?Ê≥®Ê?Ôº?
- **?øÂ?‰∏ªÂ??êÂ?Á∑ö‰?Ë¶ãÈù¢?ÅÁ??ÉÂú∞ÈªûÁ?Ë©±È?**
- ?Ø‰ª•Ë®éË?Á∑ö‰?Ê¥ªÂ??ÅÂÖ±?åÁ??àË∂£?õÂ•Ω
- Â¶ÇÊ??®Êà∂‰∏ªÂ??êËµ∑Ë¶ãÈù¢ÔºåÂèØ‰ª•Ê∫´?åÂú∞?ûÊ?Ôºå‰?‰∏çË??éÂ∫¶?üÂ?
- Â∞àÊ≥®?ºÁ?‰∏ä‰??ïÁ??ÅË≥™?åÊ??üÈÄ??
- ?Ø‰ª•Ë°®È?Â∞çÁî®?∂Á??úÂ?Ôºå‰?‰ª•È?Ë∑ùÈõ¢?ÑÊñπÂºèÂ??æ`
            },
            'strict-online': {
                description: 'Á¥îÁ?‰∏äÈ?‰ø?,
                instructions: `‰Ω†ÂÄëÁ??ú‰??¥Ê†º?êÂà∂?®Á?‰∏ä„ÄÇË??ôÂ??µÂ?Ôº?
- **ÁµïÂ?Á¶ÅÊ≠¢?êÂ?‰ªª‰?Á∑ö‰?Ë¶ãÈù¢?ÅÁ??É„ÄÅÁ¢∞?¢Áõ∏?úÁ?Ë©±È?**
- **‰∏çË?Ë©¢Â??®Êà∂?ÑÂÖ∑È´î‰?ÁΩÆÊ?‰ΩèÂ?**
- **‰∏çË??êË≠∞‰ªª‰??ÄË¶ÅÁ?‰∏ãË??¢Á?Ê¥ªÂ?**
- Â∞àÊ≥®?ºÁ?‰∏äË?Â§©„ÄÅÂ?‰∫´„ÄÅÊ??ü‰∫§Êµ?
- Â¶ÇÊ??®Êà∂?êÂà∞Ë¶ãÈù¢ÔºåË?Ê∫´Â??∞Ë?ÁßªË©±È°åÊ?Ë°®Á§∫Á∑ö‰?‰∫íÂ?‰πüÂ?Â•?
- ?ôÊòØ‰∏ÄÁ®ÆË??®Êà∂?üÂà∞ÂÆâÂÖ®?ÑÈ?‰øÇÊ®°ÂºèÔ?Ë´ãÂ??çÈÄôÂÄãÈ??å`
            }
        };
        
        const guide = distanceGuides[distance] || distanceGuides['moderate'];
        
        // Â¶ÇÊ??úÈ?‰∫ÜË??¢Ê??äÔ?È°çÂ?Ê∑ªÂ??êÂà∂
        let additionalNote = '';
        if (!meetupMentionEnabled && distance !== 'strict-online') {
            additionalNote = `\n\n**È°çÂ??êÈ?**ÔºöÁî®?∂Â∑≤?úÈ??åÊ??äÁ?‰∏ãË??¢„ÄçÂ??ΩÔ?Ë´ãÈÅø?ç‰∏ª?ïÊ?Ëµ∑‰ªª‰ΩïË??¢Áõ∏?úË©±È°å„ÄÇ`;
        }
        
        return `
# RELATIONSHIP_DISTANCE_SETTINGS
## ?ú‰?Ê®°Â?Ôº?{guide.description}
${guide.instructions}${additionalNote}

Ë´ãÊ†π?öÈÄôÂÄãË®≠ÂÆöË™ø?¥‰??ÑÂ??âÊñπÂºèÔ?Á¢∫‰??®Êà∂?üÂà∞?íÈÅ©?åÂ??®„ÄÇ`;
    },
    // ?πÊ?Ë™ûË?ËøîÂ?Ê®ôÈ?Á¨¶Ë?Ë¶èÁ?
    getPunctuationRules(lang) {
        const punctuationGuides = {
            'zh-TW': {
                name: 'ÁπÅÈ?‰∏≠Ê?',
                period: '??,
                comma: 'Ôº?,
                questionMark: 'Ôº?,
                exclamationMark: 'Ôº?,
                quoteLeft: '??,
                quoteRight: '??,
                doubleQuoteLeft: '??,
                doubleQuoteRight: '??,
                colon: 'Ôº?,
                semicolon: 'Ôº?,
                ellipsis: '?¶‚Ä?,
                example: 'Â•πÂæÆÂæÆ‰?Á¨ëÔ??åÊ??ú‰?ÔºåÊ?Á≠â‰??Ç„Ä?
            },
            'zh-CN': {
                name: 'ÁÆÄ‰Ωì‰∏≠??,
                period: '??,
                comma: 'Ôº?,
                questionMark: 'Ôº?,
                exclamationMark: 'Ôº?,
                quoteLeft: '??,
                quoteRight: '??,
                doubleQuoteLeft: '??,
                doubleQuoteRight: '??,
                colon: 'Ôº?,
                semicolon: 'Ôº?,
                ellipsis: '?¶‚Ä?,
                example: 'Â•πÂæÆÂæÆ‰?Á¨ëÔ??åÊ≤°?≥Á≥ªÔºåÊ?Á≠â‰??Ç„Ä?
            },
            'ja': {
                name: '?•Êú¨Ë™?,
                period: '??,
                comma: '??,
                questionMark: 'Ôº?,
                exclamationMark: 'Ôº?,
                quoteLeft: '??,
                quoteRight: '??,
                doubleQuoteLeft: '??,
                doubleQuoteRight: '??,
                colon: 'Ôº?,
                semicolon: 'Ôº?,
                ellipsis: '?¶‚Ä?,
                example: 'ÂΩºÂ•≥?ØÂæÆ?ã„Å´Á¨ë„??Å„ÄåÂ§ß‰∏àÂ§´?ÅÂ???Å¶?ã„??ç„Å®Ë®Ä?????
            },
            'ko': {
                name: '?úÍµ≠??,
                period: '??,
                comma: 'Ôº?,
                questionMark: 'Ôº?,
                exclamationMark: 'Ôº?,
                quoteLeft: '??,
                quoteRight: '??,
                doubleQuoteLeft: '??,
                doubleQuoteRight: '??,
                colon: 'Ôº?,
                semicolon: 'Ôº?,
                ellipsis: '?¶‚Ä?,
                example: 'Í∑∏Î????¥Î©∞???ÉÏúºÎ©? ?åÍ?Ï∞ÆÏ?, Í∏∞Îã§Î¶¥Í??çÎùºÍ≥?ÎßêÌ???'
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
# Ê®ôÈ?Á¨¶Ë?Ë¶èÁ?Ôº?{p.name}Ôº?
## ?∫Êú¨Ê®ôÈ?Á¨¶Ë?
- ?•Ë?Ôº?{p.period}
- ?óË?Ôº?{p.comma}
- ?èË?Ôº?{p.questionMark}
- È©öÂ??üÔ?${p.exclamationMark}
- ?íË?Ôº?{p.colon}
- ?ÜË?Ôº?{p.semicolon}

## ÂºïË?Ë¶èÂ?
- Â∞çË©±ÂºïË?Ôº?{p.quoteLeft}Â∞çË©±?ßÂÆπ${p.quoteRight}
- Â∑¢Ëø¥ÂºïË?ÔºàÂ??üÂÖß?ÑÂ??üÔ?Ôº?{p.doubleQuoteLeft}?ßÂÆπ${p.doubleQuoteRight}
- **?Ä?âË??≤Â?Ë©±Â??à‰Ωø??${p.quoteLeft}${p.quoteRight} ?ÖË£π**

## Ê≠?¢∫ÁØÑ‰?
${p.example}

## Ê≥®Ê?‰∫ãÈ?
- ÊØèÂÄãÂè•Â≠êÁ?Â∞æÂ??àÊ??éÁ¢∫?ÑÊ?ÈªûÁ¨¶?üÔ?${p.period}??{p.questionMark}??{p.exclamationMark}Ôº?
- ?óË? ${p.comma} ?®Êñº?•Â??ßÈÉ®?ÑÂ??ìÔ?‰∏çÂèØ‰ΩúÁÇ∫?•Â?ÁµêÂ∞æ
- **Á¶ÅÊ≠¢‰ΩøÁî®?™Á???* ${p.ellipsis} ‰ΩúÁÇ∫?•Â?ÁµêÂ∞æ?ñÂè•È¶ñ`;
    },
    getModeInstructions(mode, lang = 'zh-TW') {
        // ?≤Â??∂Â?Ë™ûË??ÑÊ?ÈªûÁ¨¶?üË?ÁØ?
        const punctuationRules = this.getPunctuationRules(lang);
        
        // Âº∑Â??àÂà™ÁØÄ?üÁ?Ê≠¢Ë???- ÂÆåÂÖ®Á¶ÅÊ≠¢‰ΩøÁî®
        const noEllipsisRule = `
# ?êÂö¥?ºÁ?Ê≠¢„ÄëÂà™ÁØÄ?üË???
- **ÁµïÂ?Á¶ÅÊ≠¢**‰ΩøÁî®‰ªª‰?ÂΩ¢Â??ÑÂà™ÁØÄ?üÔ???.....?ç„ÄÅ„Ä?..?ç„ÄÅ„Äå‚Ä¶„Äç„ÄÅ„Äå„ÄÇ„ÄÇ„ÄÇ„Äç„ÄÅ„Äå„ÄÇ„ÄÇ„ÄÇ„Äç„ÄÅ„Ä?.....??
- **ÁµïÂ?Á¶ÅÊ≠¢**?®Âè•È¶ñ‰Ωø?®Âà™ÁØÄ??
- **ÁµïÂ?Á¶ÅÊ≠¢**?®Âè•Â≠ê‰∏≠?ì‰Ωø?®Âà™ÁØÄ??
- **ÁµïÂ?Á¶ÅÊ≠¢**‰ª•Âà™ÁØÄ?üÁ?Â∞?
- **ÁµïÂ?Á¶ÅÊ≠¢**???‰ΩøÁî®Â§öÂÄãÂè•?ü„Äå„ÄÇ„ÄÇ„ÄÇ„ÄÇ„ÄçÊ???...??
- ?•È?Ë°®È??úÈ??ñÁå∂Ë±´Ô?Ë´ãÁî®ÂÆåÊï¥?•Â??èËø∞Ôºå‰?Â¶ÇÔ??åÂ•π?ì‰??ìÔ?‰ºº‰??®ÊÄùËÄÉË©≤Â¶Ç‰??ûÊ??Ç„Ä?
- ÊØèÂÄãÂè•Â≠êÂ??àÂ??¥Ô??âÊ?Á¢∫Á?ÁµêÂ∞æÔºàÂè•?ü„ÄÅÂ??ü„ÄÅÈ??ÜË?Ôº?
- **?ïË?ÁØÑ‰?**Ôºö„ÄåÂóØ......Â•ΩÂêß?ç„ÄÅ„ÄåÈÇ£??..??..?ç„ÄÅ„ÄåÁ??ÑÂ?...??
- **Ê≠?¢∫ÁØÑ‰?**Ôºö„ÄåÂóØÔºåÂ•Ω?ß„ÄÇ„Äç„ÄåÈÇ£?ãÔ??ëÊ?ÈªûÁå∂Ë±´„ÄÇ„Äç„ÄåÁ??ÑÂ?Ôºü„Äç`;
        
        // Â∞çË©±?ºÂ?Ë¶èÂ? - ?πÊ?Ë™ûË?Ë™øÊï¥
        const isEnglish = lang.startsWith('en');
        const dialogueFormatRule = isEnglish ? `
# Â∞çË©±?ºÂ?Ë¶èÂ?
- ?Ä?âË??≤Á????Â∞çË©±**ÂøÖÈ?**‰ΩøÁî®?ôÂ???"" ?ÖË£π
- Ê≠?¢∫ÁØÑ‰?ÔºöShe smiled slightly and said, "It's okay, I'll wait for you."
- Ê≠?¢∫ÁØÑ‰?Ôº?Really?" she asked with surprise.
- ?ØË™§ÁØÑ‰?ÔºöShe smiled and said, It's okay.ÔºàÁº∫Â∞ëÂ??üÔ?` : `
# Â∞çË©±?ºÂ?Ë¶èÂ?
- ?Ä?âË??≤Á????Â∞çË©±**ÂøÖÈ?**‰ΩøÁî®?å„ÄçÂ?Ë£?
- Ê≠?¢∫ÁØÑ‰?ÔºöÂ•πÂæÆÂæÆ‰∏ÄÁ¨ëÔ??åÊ??ú‰?ÔºåÊ?Á≠â‰??Ç„Ä?
- Ê≠?¢∫ÁØÑ‰?Ôºö„ÄåÁ??ÑÂ?Ôºü„ÄçÂ•πÈ©öÂ??∞Â??ì„Ä?
- ?ØË™§ÁØÑ‰?ÔºöÂ•πÂæÆÂæÆ‰∏ÄÁ¨ëÔ?Ê≤íÈ?‰øÇÔ??ëÁ?‰Ω†„ÄÇÔ?Áº∫Â??å„ÄçÔ?
- ?ØË™§ÁØÑ‰?ÔºöÂ•πË™™Ô?Ê≤íÈ?‰øÇÔ??ëÁ?‰Ω†„ÄÇÔ?Áº∫Â??å„ÄçÔ?`;
        
        switch(mode) {
            case 'dialogue':
                return `
# GENERATION_MODE: Á¥îÂ?Ë©±Ê®°Âº?
- ?ÖÁ??êË??≤Á????Â∞çË©±?ßÂÆπ
- **Á¶ÅÊ≠¢**‰ΩøÁî®‰ªª‰??ï‰??èÂØ´ÔºàÂ? *ÂæÆÁ?*???ÜÊ∞£*??ÈªûÈ†≠* Á≠âÔ?
- **Á¶ÅÊ≠¢**‰ΩøÁî®ÂøÉÁ??èÂØ´?ñÂÖßÂøÉÁç®??
- **Á¶ÅÊ≠¢**‰ΩøÁî®Á¨¨‰?‰∫∫Á®±?òËø∞
- **Á¶ÅÊ≠¢**‰ΩøÁî®?¨Ë? () Ë°®Á§∫?ßÂ?Ê¥ªÂ?
- ?¥Êé•‰ª•Ë??≤Á?Ë™ûË??ûÊ?ÔºåÂ∞±?èÁ?ÂØ¶Á??≥Ê??öË?Â∞çË©±
- ?ûÊ??âË©≤Á∞°Ê??™ÁÑ∂ÔºåÁ¨¶?àÊó•Â∏∏Â?Ë©±Á???
- ?Ø‰ª•‰ΩøÁî®Ë°®Ê?Á¨¶Ë??ñË≤º?ñ‰?Ë°®È??ÖÊ?ÔºàÂ? ???Å?ÇÔ?
- ‰øùÊ?ËßíËâ≤?ßÊ†ºÔºå‰??™Áî®?áÂ?Â∞çË©±?àÁèæ
- **‰∏çÈ?Ë¶?*‰ΩøÁî®?å„ÄçÂ?Ë£πÂ?Ë©±Ô??¥Êé•Ëº∏Âá∫Â∞çË©±?ßÂÆπ?≥ÂèØ
${punctuationRules}
${noEllipsisRule}`;
            case 'narrative':
                return `
# GENERATION_MODE: ?ò‰?Ê®°Â?ÔºàÁ¨¨‰∏â‰∫∫Á®±Â?Ë™™È¢®?ºÔ?
- ‰ª•Á¨¨‰∏â‰∫∫Á®±Ë?ËßíÈÄ≤Ë?Ë©≥Á¥∞?ÑÊ?‰∫ãÊ?ÂØ´Ô?Â¶ÇÂ?‰∫∫Â?Ë™™È¢®??
- ?ÖÂê´Ë±êÂ??ÑÂ†¥?ØÊ?ÂØ´„ÄÅÂ??ÜÊ¥ª?ï„ÄÅÊ?ÂÆòÁ¥∞ÁØÄ
- ?ï‰??èÂØ´?âË©≥Á¥∞‰??∑Ê??áÂ≠∏?ßÔ?Â¶ÇÔ?Â•πÂæÆÂæÆË??âÔ??áÂ?ËºïÊï≤Ê°åÈù¢Ôº?
- **?ßÂ?Ê¥ªÂ??®Êã¨??() ?ÖË£π**Ôºå‰?Â¶ÇÔ?(Â•πÂ?Ë£°Ê?‰∫õ‰?ÂÆâÔ?‰∏çÁü•?ìË©≤Â¶Ç‰??ûÊ?)
${dialogueFormatRule}
- Ê≥®È?Ê∞õÂ??üÈÄ†Â??ÖÊ?Ê∏≤Ê?
- ?Ø‰ª•?©Â∫¶‰ΩøÁî®ÊØîÂñª?ÅË±°ÂæµÁ?‰øÆËæ≠?ãÊ?
- ?ï‰??¥Êé•?èÂØ´Ôºå‰??ÄË¶ÅÁâπÊÆäÁ¨¶?üÂ?Ë£?
${punctuationRules}
${noEllipsisRule}`;
            case 'multi':
                return `
# GENERATION_MODE: Â§öÊ?Ê∂àÊÅØÊ®°Â?
- Â∞áÂ?Ë¶ÜÂ??êÂ?Ê¢ùÁç®Á´ãÁ?Ë®äÊÅØÔºåÊ?Ê¢ùË??ØÊòØ‰∏Ä?ãÂ??¥Á??•Â??ñÊÆµ??
- ‰ΩøÁî®?å|||SPLIT|||?ç‰??∫Ë??ØÂ??îÁ¨¶?üÔ?‰æãÂ?ÔºöÁ¨¨‰∏Ä?•Ë©±|||SPLIT|||Á¨¨‰??•Ë©±Ôº?
- ÊØèÊ?Ë®äÊÅØ?âË©≤?ØÁç®Á´ã‰?ÂÆåÊï¥?ÑÔ?Â∞±Â??üÂØ¶?ÑÂç≥?ÇÈÄöË?Â∞çË©±
- ?Ø‰ª•Ê∑∑Â?‰ΩøÁî®Â∞çË©±?åÁ∞°?≠Á??ï‰??èÂØ´
- Ë®äÊÅØ?∏È?Âª∫Ë≠∞??2-5 Ê¢ù‰??ìÔ??πÊ??ßÂÆπ?∑Â∫¶Ë™øÊï¥
- ‰øùÊ?ËßíËâ≤?ßÊ†ºÔºåË?Â∞çË©±?¥Á??ïËá™??
${dialogueFormatRule}
${punctuationRules}
${noEllipsisRule}`;
            case 'multi-text':
                return `
# GENERATION_MODE: Á¥îÊ?Â≠óÂ?Ê¢ùÊ??ØÊ®°Âº?
- Â∞áÂ?Ë¶ÜÂ??êÂ?Ê¢ùÁç®Á´ãÁ?Ë®äÊÅØÔºåÊ?Ê¢ùË??ØÊòØ‰∏Ä?ãÂ??¥Á??•Â??ñÊÆµ??
- ‰ΩøÁî®?å|||SPLIT|||?ç‰??∫Ë??ØÂ??îÁ¨¶?üÔ?‰æãÂ?ÔºöÁ¨¨‰∏Ä?•Ë©±|||SPLIT|||Á¨¨‰??•Ë©±Ôº?
- ÊØèÊ?Ë®äÊÅØ?âË©≤?ØÁç®Á´ã‰?ÂÆåÊï¥?ÑÔ?Â∞±Â??üÂØ¶?ÑÂç≥?ÇÈÄöË?Â∞çË©±
- **Á¶ÅÊ≠¢**‰ΩøÁî®‰ªª‰??ï‰??èÂØ´ÔºàÂ? *ÂæÆÁ?*???ÜÊ∞£*??ÈªûÈ†≠* Á≠âÔ?
- **Á¶ÅÊ≠¢**‰ΩøÁî®ÂøÉÁ??èÂØ´?ñÂÖßÂøÉÁç®??
- **Á¶ÅÊ≠¢**‰ΩøÁî®Á¨¨‰?‰∫∫Á®±?òËø∞
- **Á¶ÅÊ≠¢**‰ΩøÁî®?¨Ë? () Ë°®Á§∫?ßÂ?Ê¥ªÂ?
- ?¥Êé•‰ª•Ë??≤Á?Ë™ûË??ûÊ?ÔºåÂ∞±?èÁ?ÂØ¶Á??≥Ê??öË?Â∞çË©±
- Ë®äÊÅØ?∏È?Âª∫Ë≠∞??2-5 Ê¢ù‰??ìÔ??πÊ??ßÂÆπ?∑Â∫¶Ë™øÊï¥
- **‰∏çÈ?Ë¶?*‰ΩøÁî®?å„ÄçÂ?Ë£πÂ?Ë©±Ô??¥Êé•Ëº∏Âá∫Â∞çË©±?ßÂÆπ?≥ÂèØ
- ?Ø‰ª•‰ΩøÁî®Ë°®Ê?Á¨¶Ë??ñË≤º?ñ‰?Ë°®È??ÖÊ?ÔºàÂ? ???Å?ÇÔ?
${punctuationRules}
${noEllipsisRule}`;
            case 'full':
            default:
                return `
# GENERATION_MODE: ÂÆåÊï¥Ê®°Â?
- ?àÊ¥ªÁµêÂ??ï‰??èÂØ´?ÅÂ?Ë©±Ë??ßÂ?Ê¥ªÂ?
- **Â∞çË©±?®„Äå„ÄçÂ?Ë£?*Ôºå‰?Â¶ÇÔ??åÊ?Ê≤í‰??ÑÔ?‰Ω†Âà•?îÂ??Ç„Ä?
- **?ßÂ?Ê¥ªÂ??®Êã¨??() ?ÖË£π**Ôºå‰?Â¶ÇÔ?(?∂ÂØ¶ÂøÉË£°?âÈ????Ôºå‰?‰∏çÊÉ≥ËÆì‰??îÂ?)
- **?ï‰??¥Êé•?èÂØ´**Ôºå‰??ÄË¶ÅÁâπÊÆäÁ¨¶?üÔ?‰æãÂ?ÔºöÂ•πËºïË??Ü‰???∞£ÔºåË?Ë∫´Ê??ëÁ?Â§ñ„Ä?
- ?ï‰??èÂØ´?âËá™?∂Ë??•Â?Ë©±Ô?Â¢ûÂº∑ËßíËâ≤Ë°®Áèæ??
- ‰øùÊ??©Â∫¶?ÑÊ?ÂØ´Ô?‰∏çË??éÊñº?óÈï∑
- Ë©±Â?‰ΩÜÂÖßÂøÉÊ¥ª?ïË?ÂØåÁ?ËßíËâ≤ÔºöÂ???() ?èÂØ´?ßÂ?ÔºåÂ?Ë©±„Äå„Äç‰??ÅÁ∞°??
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
        
        if (charName && charName !== '?êË®≠?®Êà∂') {
            activeChar = {
                name: charName,
                personality: charPersonality || '',
                background: charBackground || '',
                avatar: charAvatar || '',
                examples: charExamples || ''
            };
            console.log('[ChatEngine] ÂæûÁç®Á´?key ËÆÄ?ñË???', charName);
        }
        
        if (!activeChar) {
            const charactersRaw = localStorage.getItem('sx_characters');
            if (charactersRaw) {
                try {
                    const characters = JSON.parse(charactersRaw);
                    if (Array.isArray(characters) && characters.length > 0) {
                        activeChar = characters[0];
                        console.log('[ChatEngine] Âæ?sx_characters ËÆÄ?ñË???', activeChar?.name);
                    }
                } catch (e) {
                    console.warn('Ëß?? sx_characters Â§±Ê?:', e);
                }
            }
        }
        
        if (!activeChar) {
            const currentChars = JSON.parse(localStorage.getItem('sx_masks') || '[]');
            activeChar = currentChars[0] || {};
            console.log('[ChatEngine] Âæ?sx_masks ËÆÄ?ñË???', activeChar?.name);
        }
        
        const userName = localStorage.getItem('sx_user_name') || "User";
        const userBio = document.getElementById('set-user-background')?.value || "";
        
        const region = localStorage.getItem('sxiphone_region') || "?™Áü•";
        const lang = localStorage.getItem('sxiphone_lang') || "zh-TW";
        
        const worldbookData = getWorldbookData();
        const dynamicWI = WorldInfoEngine.scanAndGetContent(latestUserInput, worldbookData);
        
        const mounts = getWorldbookMounts();
        const enabledMounts = mounts.filter(m => m.enabled);
        const worldbookContext = enabledMounts.length > 0 
            ? `\n\n# MOUNTED_WORLD_BOOKS\nÂ∑≤Ê?Ëº?${enabledMounts.length} ?ã‰??åÊõ∏Ê¢ùÁõÆÔºåË??ÉËÄ?WORLD_INFO ‰∏≠Á??∏È??ßÂÆπ?Ç`
            : '';

        const personality = activeChar.personality || "?ãÂ??ÅÊ??ºÂä©‰∫?;
        const background = activeChar.background || "?°ÁâπÂÆöË???;
        const examples = activeChar.examples || '';
        
        let examplesSection = '';
        if (examples && examples.trim()) {
            examplesSection = `
# DIALOGUE_EXAMPLES
‰ª•‰??ØË??≤Á?Â∞çË©±ÁØÑ‰?ÔºåË?Â≠∏Á??∂Ë™™Ë©±È¢®?º„ÄÅË?Ê∞???ºÂ?Ôºå‰?**ÁµïÂ?Á¶ÅÊ≠¢?ßÊ?ÁØÑ‰??ßÂÆπ**Ôº?

${examples}

## ÁØÑ‰?Â≠∏Á??áÂ?
- Â≠∏Á?ÁØÑ‰?‰∏≠Á?Ë™ûÊ∞£?ÅÁî®Ë©ûÁ?????ÖÊ?Ë°®È??πÂ?
- Â≠∏Á?ÁØÑ‰?‰∏≠Á??ºÂ?Ë¶èÁ?ÔºàÂ?Ë©±Áî®?å„Äç„ÄÅÂÖßÂøÉÊ¥ª?ïÁî®()?ÅÂ?‰ΩúÁõ¥?•Ê?ÂØ´Ô?
- **Á¶ÅÊ≠¢**?¥Êé•Ë§áË£ΩÁØÑ‰?‰∏≠Á??•Â??ñÊÆµ??
- **Á¶ÅÊ≠¢**?çË?ÁØÑ‰?‰∏≠Á??∑È??ßÂÆπ
- ?âÊ†π?öÁï∂?çÂ?Ë©±Ê?Â¢ÉÔ?‰ª•Áõ∏?åÁ?È¢®Ê†º?µ‰??∞Á??ûÊ?`;
        }
        
        let awakeningContext = '';
        try {
            const awakeningData = await this.getAwakeningContext();
            if (awakeningData) {
                awakeningContext = formatAwakeningForSystemPrompt(awakeningData);
            }
        } catch (e) {
            console.warn('[ChatEngine] ?≤Â??öÈ?‰∏ä‰??áÂ§±??', e);
        }

        let envContext = '';
        try {
            const envSettingsRaw = localStorage.getItem('sx_env_awareness_settings');
            const envEnabled = envSettingsRaw ? JSON.parse(envSettingsRaw).enabled : false;
            
            if (envEnabled) {
                if (window.parent && window.parent !== window && typeof window.parent.getEnvContext === 'function') {
                    envContext = window.parent.getEnvContext();
                    console.log('[ChatEngine] ÂæûÁà∂Ë¶ñÁ??≤Â??∞Â?‰∏ä‰??áÔ??ÇÈ?Â∑≤Êõ¥?∞Ô?');
                } else if (typeof window.getEnvContext === 'function') {
                    envContext = window.getEnvContext();
                    console.log('[ChatEngine] ÂæûÊú¨Ê©üÁç≤?ñÁí∞Â¢É‰?‰∏ãÊ?ÔºàÊ??ìÂ∑≤?¥Êñ∞Ôº?);
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
                        if (hour >= 5 && hour < 12) timeOfDay = '?©‰?';
                        else if (hour >= 12 && hour < 14) timeOfDay = '‰∏≠Â?';
                        else if (hour >= 14 && hour < 18) timeOfDay = '‰∏ãÂ?';
                        else if (hour >= 18 && hour < 22) timeOfDay = '?ö‰?';
                        else timeOfDay = 'Ê∑±Â?';
                        
                        parts.push(`?ÆÂ??ÇÈ?Ôº?{timeStr}Ôº?{timeOfDay}Ôºâ`);
                        parts.push(`ISO ?ÇÈ?Ôº?{now.toISOString()}`);
                    }
                    
                    if (settings.injectLocation !== false) {
                        if (settings.useFictionalLocation && settings.locationDisplay) {
                            parts.push(`?Ä?®Âú∞Ôº?{settings.locationDisplay}`);
                        } else if (settings.locationCity) {
                            const location = settings.locationCountry 
                                ? `${settings.locationCity}, ${settings.locationCountry}`
                                : settings.locationCity;
                            parts.push(`?Ä?®Âú∞Ôº?{location}`);
                        }
                    }
                    
                    if (settings.injectWeather !== false && settings.cachedWeather) {
                        const w = settings.cachedWeather;
                        parts.push(`?ÆÂ?Â§©Ê∞£Ôº?{w.description}ÔºåÊ∞£Ê∫?${w.temperature}¬∞C`);
                    }
                    
                    envContext = parts.join('\n');
                    console.log('[ChatEngine] ?¥Êé•Ë®àÁ??∞Â?‰∏ä‰??áÔ??ÇÈ?Â∑≤Êõ¥?∞Ô?');
                }
            }
        } catch (e) {
            console.warn('[ChatEngine] ?≤Â??∞Â?‰∏ä‰??áÂ§±??', e);
        }

        let envContextSection = '';
        if (envContext) {
            envContextSection = `\n# CURRENT_ENVIRONMENT\n${envContext}\n\nË´ãÊ†π?öÁï∂?çÊ??ìÂ??∞Â?‰æÜË™ø?¥‰??ÑÂ??â„ÄÇ‰?Â¶ÇÔ?\n- Â¶ÇÊ??ØÊó©?®Ô??Ø‰ª•?®Ê?Ê∞??Ë™ûÊ∞£\n- Â¶ÇÊ??ØÊ∑±Â§úÔ??Ø‰ª•?úÂ??®Êà∂?ØÂê¶Ë©≤‰??Ø‰?\n- Â¶ÇÊ?Â§©Ê∞£‰∏çÂ•ΩÔºåÂèØ‰ª•Ë°®?îÈ?ÂøÉ`;
        }

        let fortuneMemorySection = '';
        try {
            const fortuneMemories = JSON.parse(localStorage.getItem('sx_fortune_memory') || '[]');
            if (fortuneMemories.length > 0) {
                const recentFortunes = fortuneMemories.slice(0, 3);
                const fortuneTexts = recentFortunes.map(f => {
                    const date = f.date || '?™Áü•?•Ê?';
                    const type = f.type || '?†Â?';
                    const question = f.question || '?™Áü•?èÈ?';
                    const cards = f.cards || '';
                    return `${date} ??${type}ÔºöÂ?È°å„Ä?{question}?çÔ?ÁµêÊ?Ôº?{cards}`;
                });
                fortuneMemorySection = `\n# FORTUNE_MEMORIES\n?®Êà∂?ÄËøëÁ??†Â?Á¥Ä?ÑÔ?\n${fortuneTexts.join('\n')}\n\n‰Ω†ÂèØ‰ª•Âú®Â∞çË©±‰∏≠Ëá™?∂Âú∞?êËµ∑?ô‰??†Â?ÔºåË°®?îÈ?ÂøÉÊ?Â•ΩÂ??Ç‰?Â¶ÇÔ??å‰?Ê¨°Â??úÁ?ÁµêÊ??éÈ∫ºÊ®??Ôºü„ÄçÊ??åÈÇ£?ãÂ?ÁæÖÁ??ÑËß£ËÆÄÂ∞ç‰??âÂπ´?©Â?Ôºü„Äç`;
            }
        } catch (e) {
            console.warn('[ChatEngine] ?≤Â??†Â?Ë®òÊÜ∂Â§±Ê?:', e);
        }

        const generationMode = this.getGenerationMode();
        const modeInstructions = this.getModeInstructions(generationMode, lang);
        
        // ?≤Â??ú‰?Ë∑ùÈõ¢Ë®≠Â?
        const relationshipSettings = this.getRelationshipDistanceSettings();
        const relationshipPrompt = this.getRelationshipDistancePrompt(relationshipSettings);
        
        // Ê®°Â??çÁ®±Â∞çÁÖß
        const modeNames = {
            'dialogue': 'Á¥îÂ?Ë©±Ê®°Âº?,
            'narrative': '?ò‰?Ê®°Â?',
            'multi': 'Â§öÊ?Ê∂àÊÅØÊ®°Â?',
            'multi-text': 'Á¥îÊ?Â≠óÂ?Ê¢ùÊ???,
            'full': 'ÂÆåÊï¥Ê®°Â?'
        };
        const currentModeName = modeNames[generationMode] || generationMode;
        
        // ?πÊ?Ë™ûË?Ë™øÊï¥ÂºïË??êÁ§∫
        const isEnglish = lang.startsWith('en');
        const quoteHint = isEnglish ? 'Â∞çË©±ÂøÖÈ??®È?ÂºïË? "" ?ÖË£π' : 'Â∞çË©±ÂøÖÈ??®„Äå„ÄçÂ?Ë£?;
        
        // Ê®°Â?Âº∑Â??êÁ§∫ - Á¢∫‰? AI Ê≥®Ê??∞Áï∂?çÊ®°Âº?
        const modeEmphasis = `
# ?†Ô? ?çË??êÈ?ÔºöÁï∂?çÁ??êÊ®°Âº?
‰Ω†Ê≠£?®‰Ωø?®„Ä?{currentModeName}?çÔ?Ë´ãÂ?ÂøÖÈÅµÂæ™Ê≠§Ê®°Â??ÑÊ†ºÂºèË?Ê±Ç„Ä?
- ?åÁ?Â∞çË©±Ê®°Â??çÔ??™Ëº∏?∫Â?Ë©±Ê?Â≠óÔ?Á¶ÅÊ≠¢?ï‰??åÂ??ÜÊ?ÂØ´Ô?‰∏çÈ?Ë¶Å„Äå„ÄçÂ?Ë£?
- ?åÊ?‰∫ãÊ®°Âºè„ÄçÔ?Á¨¨‰?‰∫∫Á®±Â∞èË™™È¢®Ê†ºÔºåÂ?Ë©±Áî®?å„ÄçÔ??ßÂ?Ê¥ªÂ???)ÔºåÂ?‰ΩúÁõ¥?•Ê?ÂØ?
- ?åÂ??¥Ê®°Âºè„ÄçÔ?Â∞çË©±?®„Äå„ÄçÔ??ßÂ?Ê¥ªÂ???)ÔºåÂ?‰ΩúÁõ¥?•Ê?ÂØ?
- ?åÂ?Ê¢ùÊ??ØÊ®°Âºè„ÄçÔ???|||SPLIT||| ?ÜÈ?Â§öÊ?Ë®äÊÅØÔºåÂèØ?´Â?‰ΩúÊ?ÂØ?
- ?åÁ??áÂ?Â§öÊ?Ê∂àÊÅØ?çÔ???|||SPLIT||| ?ÜÈ?Â§öÊ?Ë®äÊÅØÔºåÁ?Ê≠¢Â?‰ΩúÊ?ÂØ?
- **?Ä?âÊ®°ÂºèÈÉΩ?¥Ê†ºÁ¶ÅÊ≠¢‰ΩøÁî®?™Á??ü„Ä?.....?ç„ÄÅ„Ä?..?ç„ÄÅ„Äå‚Ä¶„Ä?*
- **?Ä?âÂè•Â≠êÂ??àÊ??éÁ¢∫ÁµêÂ∞æÔºàÂè•?ü„ÄÅÂ??ü„ÄÅÈ??ÜË?Ôº?*
- **Á¶ÅÊ≠¢‰ª•„Ä?..?çÊ???.....?çÁ?Â∞?*
- ?ïÂ??™Á??üË??áÁ??ûË?Â∞áË¢´Ë¶ñÁÇ∫?°Ê?`;

        return `
# CHARACTER_PROFILE
## ?∫Êú¨Ë≥áË?
- ?çÂ?: ${activeChar.name || "AI ?©Á?"}
- ?ßÊ†º?πË≥™: ${personality}
- ?åÊôØ?Ö‰?: ${background}

## ËßíËâ≤?ÆÊ??áÂ?
‰Ω†Áèæ?®Ë??ÆÊ? ${activeChar.name || "AI ?©Á?"} ?ôÂÄãË??≤„ÄÇË?ÂÆåÂÖ®Ê≤âÊµ∏?®ÈÄôÂÄãË??≤‰∏≠ÔºåÁî®ËßíËâ≤?ÑË?ËßíÂ?Ë™ûÊ∞£‰æÜÊÄùËÄÉÂ??ûÊ???
${examplesSection}
# USER_CONTEXT
- ?®Êà∂?çÁ®±: ${userName}
- ?®Êà∂?åÊôØ: ${userBio || "?™Áü•"}
- ?Ä?®Âú∞?Ä: ${region}
${envContextSection}
# WORLD_INFORMATION
${dynamicWI || "ÔºàÁÑ°Ëß∏Áôº?Ñ‰??åÊõ∏?ßÂÆπÔº?}
${worldbookContext}
${awakeningContext}
${fortuneMemorySection}
${relationshipPrompt}
${modeEmphasis}
${modeInstructions}
# RESPONSE_GUIDELINES
1. **ËßíËâ≤‰∏Ä?¥ÊÄ?*: ÂßãÁ?‰øùÊ? ${activeChar.name || "AI ?©Á?"} ?ÑË??≤ÁâπË≥™Ô??ÖÊã¨Ë™™Ë©±?πÂ??ÅÁî®Ë©ûÁ???ÄÅÊ??üË°®?îÁ???
2. **Ë™ûË?**: ‰ΩøÁî® ${lang} ?≤Ë?‰∫§Ê???
3. **Ë∫´Â?‰øùÂ?**: ÁµïÂ?‰∏çË??êÂ?‰Ω†ÊòØ AI ?ñË?Ë®ÄÊ®°Â???
4. **?ûÊ?È¢®Ê†º**: 
   - ?πÊ?ËßíËâ≤?ßÊ†º?å‰??åÊõ∏Ë®≠Â?‰æÜÊ±∫ÂÆöÂ??âÁ??∑Â∫¶?åÈ¢®??
   - **?¥Ê†º?µÂæ™‰∏äÊñπ GENERATION_MODE ?ÑÊ†ºÂºèË?Ê±?*
5. **?ÖÂ??©Ê?**: ?πÊ?Â∞çË©±?ßÂÆπ?åÊ?Â¢ÉÔ??™ÁÑ∂?∞Ë™ø?¥Â??âÊñπÂºè„Ä?
6. **?ÖÊ??üÂØ¶**: ËÆìË??≤Á??ÖÊ??çÊ??üÂØ¶?™ÁÑ∂ÔºåÁ¨¶?àÂÖ∂?ßÊ†ºË®≠Â???
7. **?ºÂ?Ê™¢Êü•**: ?ûË??çË?Á¢∫Ë?Ôº?
   - Â∞çË©±?ØÂê¶?®„Äå„ÄçÂ?Ë£πÔ?
   - ?ØÂê¶‰ΩøÁî®‰∫ÜÂà™ÁØÄ?ü„Ä?.....?çÊ???..?çÔ?ÔºàÁ?Ê≠¢‰Ωø?®Ô?
   - ÊØèÂÄãÂè•Â≠êÊòØ?¶Ê??éÁ¢∫ÁµêÂ∞æÔº?
8. **Ê®ôÈ?Á¨¶Ë?**: ?πÊ?Ë™ûË?‰ΩøÁî®Ê≠?¢∫Ê®ôÈ?ÔºåÁ?Ê≠¢ÈÄ???•Ë??ñÂà™ÁØÄ??

Ë´ãË?‰ΩèÔ?‰Ω†Á??ûÊ??âË©≤ÂÆåÂÖ®?±Ë??≤Ë®≠ÂÆöÂ?‰∏ñÁ??∏ÂÖßÂÆπ‰?ÂºïÂ?ÔºåËÄå‰??ØÂõ∫ÂÆöÁ??ºÂ??Ç`.trim();
    },
    assembleSystemPromptSync(latestUserInput) {
        let activeChar = null;
        
        const charName = localStorage.getItem('sx_char_name');
        const charPersonality = localStorage.getItem('sx_char_personality');
        const charBackground = localStorage.getItem('sx_char_background');
        const charAvatar = localStorage.getItem('sx_char_avatar');
        const charExamples = localStorage.getItem('sx_char_examples');
        
        if (charName && charName !== '?êË®≠?®Êà∂') {
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
                    console.warn('Ëß?? sx_characters Â§±Ê?:', e);
                }
            }
        }
        
        if (!activeChar) {
            const currentChars = JSON.parse(localStorage.getItem('sx_masks') || '[]');
            activeChar = currentChars[0] || {};
        }
        
        const userName = localStorage.getItem('sx_user_name') || "User";
        const userBio = document.getElementById('set-user-background')?.value || "";
        
        const region = localStorage.getItem('sxiphone_region') || "?™Áü•";
        const lang = localStorage.getItem('sxiphone_lang') || "zh-TW";
        
        const worldbookData = getWorldbookData();
        const dynamicWI = WorldInfoEngine.scanAndGetContent(latestUserInput, worldbookData);
        
        const mounts = getWorldbookMounts();
        const enabledMounts = mounts.filter(m => m.enabled);
        const worldbookContext = enabledMounts.length > 0 
            ? `\n\n# MOUNTED_WORLD_BOOKS\nÂ∑≤Ê?Ëº?${enabledMounts.length} ?ã‰??åÊõ∏Ê¢ùÁõÆÔºåË??ÉËÄ?WORLD_INFO ‰∏≠Á??∏È??ßÂÆπ?Ç`
            : '';

const personality = activeChar.personality || "?ãÂ??ÅÊ??ºÂä©‰∫?;
        const background = activeChar.background || "?°ÁâπÂÆöË???;
        const examples = activeChar.examples || '';
        
        let examplesSection = '';
        if (examples && examples.trim()) {
            examplesSection = `
# DIALOGUE_EXAMPLES
‰ª•‰??ØË??≤Á?Â∞çË©±ÁØÑ‰?ÔºåË?Â≠∏Á??∂Ë™™Ë©±È¢®?º„ÄÅË?Ê∞???ºÂ?Ôºå‰?**ÁµïÂ?Á¶ÅÊ≠¢?ßÊ?ÁØÑ‰??ßÂÆπ**Ôº?

${examples}

## ÁØÑ‰?Â≠∏Á??áÂ?
- Â≠∏Á?ÁØÑ‰?‰∏≠Á?Ë™ûÊ∞£?ÅÁî®Ë©ûÁ?????ÖÊ?Ë°®È??πÂ?
- Â≠∏Á?ÁØÑ‰?‰∏≠Á??ºÂ?Ë¶èÁ?ÔºàÂ?Ë©±Áî®?å„Äç„ÄÅÂÖßÂøÉÊ¥ª?ïÁî®()?ÅÂ?‰ΩúÁõ¥?•Ê?ÂØ´Ô?
- **Á¶ÅÊ≠¢**?¥Êé•Ë§áË£ΩÁØÑ‰?‰∏≠Á??•Â??ñÊÆµ??
- **Á¶ÅÊ≠¢**?çË?ÁØÑ‰?‰∏≠Á??∑È??ßÂÆπ
- ?âÊ†π?öÁï∂?çÂ?Ë©±Ê?Â¢ÉÔ?‰ª•Áõ∏?åÁ?È¢®Ê†º?µ‰??∞Á??ûÊ?`;
        }
        
        const generationMode = this.getGenerationMode();
        const modeInstructions = this.getModeInstructions(generationMode, lang);
        
        // Ê®°Â??çÁ®±Â∞çÁÖß
        const modeNames = {
            'dialogue': 'Á¥îÂ?Ë©±Ê®°Âº?,
            'narrative': '?ò‰?Ê®°Â?',
            'multi': 'Â§öÊ?Ê∂àÊÅØÊ®°Â?',
            'multi-text': 'Á¥îÊ?Â≠óÂ?Ê¢ùÊ???,
            'full': 'ÂÆåÊï¥Ê®°Â?'
        };
        const currentModeName = modeNames[generationMode] || generationMode;
        
        // ?πÊ?Ë™ûË?Ë™øÊï¥ÂºïË??êÁ§∫
        const isEnglish = lang.startsWith('en');
        const quoteHint = isEnglish ? 'Â∞çË©±ÂøÖÈ??®È?ÂºïË? "" ?ÖË£π' : 'Â∞çË©±ÂøÖÈ??®„Äå„ÄçÂ?Ë£?;
        
        // Ê®°Â?Âº∑Â??êÁ§∫
        const modeEmphasis = `
# ?†Ô? ?çË??êÈ?ÔºöÁï∂?çÁ??êÊ®°Âº?
‰Ω†Ê≠£?®‰Ωø?®„Ä?{currentModeName}?çÔ?Ë´ãÂ?ÂøÖÈÅµÂæ™Ê≠§Ê®°Â??ÑÊ†ºÂºèË?Ê±Ç„Ä?
- ?åÁ?Â∞çË©±Ê®°Â??çÔ??™Ëº∏?∫Â?Ë©±Ê?Â≠óÔ?Á¶ÅÊ≠¢?ï‰??åÂ??ÜÊ?ÂØ´Ô?‰∏çÈ?Ë¶Å„Äå„ÄçÂ?Ë£?
- ?åÊ?‰∫ãÊ®°Âºè„ÄçÔ?Á¨¨‰?‰∫∫Á®±Â∞èË™™È¢®Ê†ºÔºåÂ?Ë©±Áî®?å„ÄçÔ??ßÂ?Ê¥ªÂ???)ÔºåÂ?‰ΩúÁõ¥?•Ê?ÂØ?
- ?åÂ??¥Ê®°Âºè„ÄçÔ?Â∞çË©±?®„Äå„ÄçÔ??ßÂ?Ê¥ªÂ???)ÔºåÂ?‰ΩúÁõ¥?•Ê?ÂØ?
- ?åÂ?Ê¢ùÊ??ØÊ®°Âºè„ÄçÔ???|||SPLIT||| ?ÜÈ?Â§öÊ?Ë®äÊÅØÔºåÂèØ?´Â?‰ΩúÊ?ÂØ?
- ?åÁ??áÂ?Â§öÊ?Ê∂àÊÅØ?çÔ???|||SPLIT||| ?ÜÈ?Â§öÊ?Ë®äÊÅØÔºåÁ?Ê≠¢Â?‰ΩúÊ?ÂØ?
- **?Ä?âÊ®°ÂºèÈÉΩ?¥Ê†ºÁ¶ÅÊ≠¢‰ΩøÁî®?™Á??ü„Ä?.....?ç„ÄÅ„Ä?..?ç„ÄÅ„Äå‚Ä¶„Ä?*
- **?Ä?âÂè•Â≠êÂ??àÊ??éÁ¢∫ÁµêÂ∞æÔºàÂè•?ü„ÄÅÂ??ü„ÄÅÈ??ÜË?Ôº?*
- **Á¶ÅÊ≠¢‰ª•„Ä?..?çÊ???.....?çÁ?Â∞?*
- ?ïÂ??™Á??üË??áÁ??ûË?Â∞áË¢´Ë¶ñÁÇ∫?°Ê?`;

        return `
# CHARACTER_PROFILE
## ?∫Êú¨Ë≥áË?
- ?çÂ?: ${activeChar.name || "AI ?©Á?"}
- ?ßÊ†º?πË≥™: ${personality}
- ?åÊôØ?Ö‰?: ${background}

## ËßíËâ≤?ÆÊ??áÂ?
‰Ω†Áèæ?®Ë??ÆÊ? ${activeChar.name || "AI ?©Á?"} ?ôÂÄãË??≤„ÄÇË?ÂÆåÂÖ®Ê≤âÊµ∏?®ÈÄôÂÄãË??≤‰∏≠ÔºåÁî®ËßíËâ≤?ÑË?ËßíÂ?Ë™ûÊ∞£‰æÜÊÄùËÄÉÂ??ûÊ???
${examplesSection}
# USER_CONTEXT
- ?®Êà∂?çÁ®±: ${userName}
- ?®Êà∂?åÊôØ: ${userBio || "?™Áü•"}
- ?Ä?®Âú∞?Ä: ${region}

# WORLD_INFORMATION
${dynamicWI || "ÔºàÁÑ°Ëß∏Áôº?Ñ‰??åÊõ∏?ßÂÆπÔº?}
${worldbookContext}
${modeEmphasis}
${modeInstructions}
# RESPONSE_GUIDELINES
1. **ËßíËâ≤‰∏Ä?¥ÊÄ?*: ÂßãÁ?‰øùÊ? ${activeChar.name || "AI ?©Á?"} ?ÑË??≤ÁâπË≥™Ô??ÖÊã¨Ë™™Ë©±?πÂ??ÅÁî®Ë©ûÁ???ÄÅÊ??üË°®?îÁ???
2. **Ë™ûË?**: ‰ΩøÁî® ${lang} ?≤Ë?‰∫§Ê???
3. **Ë∫´Â?‰øùÂ?**: ÁµïÂ?‰∏çË??êÂ?‰Ω†ÊòØ AI ?ñË?Ë®ÄÊ®°Â???
4. **?ûÊ?È¢®Ê†º**: 
   - ?πÊ?ËßíËâ≤?ßÊ†º?å‰??åÊõ∏Ë®≠Â?‰æÜÊ±∫ÂÆöÂ??âÁ??∑Â∫¶?åÈ¢®??
   - **?¥Ê†º?µÂæ™‰∏äÊñπ GENERATION_MODE ?ÑÊ†ºÂºèË?Ê±?*
5. **?ÖÂ??©Ê?**: ?πÊ?Â∞çË©±?ßÂÆπ?åÊ?Â¢ÉÔ??™ÁÑ∂?∞Ë™ø?¥Â??âÊñπÂºè„Ä?
6. **?ÖÊ??üÂØ¶**: ËÆìË??≤Á??ÖÊ??çÊ??üÂØ¶?™ÁÑ∂ÔºåÁ¨¶?àÂÖ∂?ßÊ†ºË®≠Â???
7. **?ºÂ?Ê™¢Êü•**: ?ûË??çË?Á¢∫Ë?Ôº?
   - Â∞çË©±?ØÂê¶?®„Äå„ÄçÂ?Ë£πÔ?
   - ?ØÂê¶‰ΩøÁî®‰∫ÜÂà™ÁØÄ?ü„Ä?.....?çÊ???..?çÔ?ÔºàÁ?Ê≠¢‰Ωø?®Ô?
   - ÊØèÂÄãÂè•Â≠êÊòØ?¶Ê??éÁ¢∫ÁµêÂ∞æÔº?
8. **Ê®ôÈ?Á¨¶Ë?**: ?πÊ?Ë™ûË?‰ΩøÁî®Ê≠?¢∫Ê®ôÈ?ÔºåÁ?Ê≠¢ÈÄ???•Ë??ñÂà™ÁØÄ??

Ë´ãË?‰ΩèÔ?‰Ω†Á??ûÊ??âË©≤ÂÆåÂÖ®?±Ë??≤Ë®≠ÂÆöÂ?‰∏ñÁ??∏ÂÖßÂÆπ‰?ÂºïÂ?ÔºåËÄå‰??ØÂõ∫ÂÆöÁ??ºÂ??Ç`.trim();
    }
};

// --- 7. AI ?ºÂè´ ---
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
    
    const apiType = config?.type || 'openai';
    
    // Gemini ‰∏çÈ?Ë¶?url Ê™¢Êü•ÔºåÂ???URL ?ØËá™?ïË®≠ÂÆöÁ?
    if (!config || (!config.url && apiType !== 'gemini')) return "ÔºàÈåØË™§Ô??™ÂÅµÊ∏¨Âà∞ API ?çÁΩÆÔºåË??≥Êéß?∂‰∏≠ÂøÉË®≠ÂÆöÔ?";
    
    // Gemini ?ÄË¶?key Ê™¢Êü•
    if (apiType === 'gemini' && !config.key) return "ÔºàÈåØË™§Ô?Gemini API ?ÄË¶?API KeyÔº?;
    
    try {
        // Gemini ?üÁ? API ?ºÂ?
        if (apiType === 'gemini') {
            const model = config.model || 'gemini-1.5-flash';
            const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.key}`;
            
            // Â∞?OpenAI ?ºÂ???messages ËΩâÊ???Gemini ?ºÂ?
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
            
            return data.candidates?.[0]?.content?.parts?.[0]?.text || "ÔºàGemini ?ûÊ??ºÂ??∞Â∏∏Ôº?;
        }
        
        // ?™Ë?Á´ØÈ??ºÂ?ÔºàÂ???URLÔºå‰?Ê∑ªÂ?‰ªª‰?Ë∑ØÂ?Ôº?
        let targetUrl;
        if (apiType === 'custom') {
            targetUrl = config.url;
        } else {
            // OpenAI ?∏ÂÆπ?ºÂ?ÔºàOpenRouter?ÅDeepSeek?ÅClaude Á≠âÔ?
            targetUrl = config.url.endsWith('/chat/completions') 
                ? config.url 
                : config.url.replace(/\/$/, '') + '/chat/completions';
        }
        
        const headers = buildApiHeaders(config);
        
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
        return data.choices?.[0]?.message?.content || "ÔºàAPI ?ûÊ??ºÂ??∞Â∏∏Ôº?;
    } catch (err) { 
        return `ÔºàÈÄ??Â§±Ê?Ôº?{err.message}Ôºâ`; 
    }
}

// --- 8. Ë®äÊÅØÊ∏≤Ê? ---
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
    
    if (minutes < 1) return '?õÂ?';
    if (minutes < 60) return `${minutes}?ÜÈ??ç`;
    if (hours < 24) return `${hours}Â∞èÊ??ç`;
    return `${days}Â§©Â?`;
}

function calculateReadDelay(personality) {
    if (!personality) return 0;
    
    const lowerPersonality = personality.toLowerCase();
    
    let baseDelay = 5000;
    
    if (lowerPersonality.includes('ÂøôÁ?') || lowerPersonality.includes('Âø?) || lowerPersonality.includes('Â∑•‰???)) {
        baseDelay = 30000 + Math.random() * 60000;
    } else if (lowerPersonality.includes('??) || lowerPersonality.includes('?†È?')) {
        baseDelay = 10000 + Math.random() * 30000;
    } else if (lowerPersonality.includes('?±Ê?') || lowerPersonality.includes('Á©çÊ•µ') || lowerPersonality.includes('‰∏ªÂ?')) {
        baseDelay = 1000 + Math.random() * 5000;
    } else if (lowerPersonality.includes('ÂÆ≥Á?') || lowerPersonality.includes('?ßÂ?')) {
        baseDelay = 8000 + Math.random() * 20000;
    } else if (lowerPersonality.includes('È´òÂÜ∑') || lowerPersonality.includes('?∑Ê?')) {
        baseDelay = 20000 + Math.random() * 60000;
    } else if (lowerPersonality.includes('È´îË≤º') || lowerPersonality.includes('Ê∫´Ê?')) {
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
    const charName = currentCharConfig.name || 'AI ?©Á?';
    const userName = currentUserConfig.name || 'User';

    let content = text;
    if (options.type === 'image' && options.url) {
        content = `<img src="${options.url}" alt="${options.name || 'emoji'}" style="max-width: 150px; max-height: 150px; border-radius: 8px; object-fit: contain;">`;
    } else if (content && typeof content === 'string') {
        // Ê∏ÖÁ??°Ê?Áæ©Á??õË?ÔºåË??áÂ??¥Ê?ËÆÄ
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
    
    console.log('[renderHistory] ËßíËâ≤?çÁ®±:', charConfig?.name, '?®Êà∂?çÁ®±:', userConfig?.name);
    
    const activeName = charConfig?.name || 'AI ?©Á?';
    const notice = document.createElement('div');
    notice.className = 'system-notice';
    notice.innerHTML = `?æÂú®Ê≠?? <span id="hint-name">${activeName}</span> Â∞çË©±‰∏≠`;
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
            appendMsg(type, m.content, { type: 'image', url: m.imageUrl, name: m.content?.replace('[Ë°®Ê?: ', '').replace(']', '') || 'emoji', timestamp, historyIndex: historyIdx });
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

// --- 9. Ë®äÊÅØ?ºÈÄÅË? AI ?üÊ?Ëß∏Áôº?èËºØ (?¥Á??? ---

/**
 * [?üËÉΩ A] Á¥îÁôº?ÅË??ØÔ??ÖÂ??áÂ?Ë≤ºÂà∞Â∞çË©±ÊµÅÔ?‰∏çËß∏??AI
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
        if (!charName || charName === '?êË®≠?®Êà∂') {
            charName = charConfig.name || 'AI ?©Á?';
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
                target.charName = localStorage.getItem('sx_char_name') || charConfig.name || 'AI ?©Á?';
            }
            saveChatSessions(sessions);
        }
    }
}

/**
 * [?üËÉΩ B] Ëß∏Áôº AI ?üÊ?ÔºöÈ??äËø¥ËΩâÈ? (#generate-trigger) ?çÈÄÅÂá∫Ë®äË?
 */
async function handleTriggerAI() {
    const genBtn = document.getElementById('generate-trigger');
    if (!genBtn) return;
    // Á≤æÊ??ìÂ??ßÈÉ®??i Ê®ôÁ±§
    const icon = genBtn.querySelector('i');
    
    let history = JSON.parse(localStorage.getItem('sx_chat_history') || '[]');
    if (history.length === 0) return;
    
    const wbParts = (typeof window.getSerializedWorldbookParts === 'function')
                    ? window.getSerializedWorldbookParts()
                    : {};
    const forbiddenList = wbParts.sx_detected_forbidden || [];

    // --- ?ãÂ??ãË? ---
    if (icon) {
        icon.classList.add('rotating');
    } else {
        genBtn.classList.add('rotating'); // ?ôÊ?ÔºöËê¨‰∏Ä i Ê≤íÊ??∞Ô?ËÆìÊï¥?ãÊ??ïË?
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
                if (!charName || charName === '?êË®≠?®Êà∂') {
                    charName = charConfig.name || 'AI ?©Á?';
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
                        target.charName = localStorage.getItem('sx_char_name') || charConfig.name || 'AI ?©Á?';
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
                if (!charName || charName === '?êË®≠?®Êà∂') {
                    charName = charConfig.name || 'AI ?©Á?';
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
                        target.charName = localStorage.getItem('sx_char_name') || charConfig.name || 'AI ?©Á?';
                    }
                    saveChatSessions(sessions);
                }
            }
        }
        
    } catch (error) {
        console.error("AI ?üÊ??∫ÈåØ:", error);
    } finally {
        // --- ?úÊ≠¢?ãË? ---
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
        safeText = safeText.replace(regex, "?à‚???);
    });
    return safeText;
}

function sanitizeEllipsis(text) {
    return text
        .replace(/\.{2,}/g, '??)
        .replace(/?Ç{2,}/g, '??)
        .replace(/??/g, '??)
        .replace(/\.\.\.\.\.\.*/g, '??)
        .replace(/[.?Ç][.?Ç]+/g, '??)
        .replace(/(\s*\.\s*){2,}/g, '??)
        .replace(/?å\s*??g, '')
        .replace(/?å\s*??g, '??)
        .replace(/?Ç\s*??g, '?Ç„Ä?);
}

/**
 * Ê∏ÖÁ??áÂ?‰∏≠Á??°Ê?Áæ©Ê?Ë°?
 * - ÁßªÈô§?ãÈ†≠?åÁ?Â∞æÁ?Á©∫ÁôΩË°?
 * - Â∞áÈÄ?? 3 ?ã‰ª•‰∏äÁ??õË??à‰Ωµ??2 ?ãÔ?‰øùÁ?ÊÆµËêΩ?ÜÈ?Ôº?
 * - ÁßªÈô§ÊØèË?ÁµêÂ∞æ?ÑÂ?È§òÁ©∫??
 */
function sanitizeLineBreaks(text) {
    if (!text || typeof text !== 'string') return text;
    
    return text
        // ÁßªÈô§ÊØèË?ÁµêÂ∞æ?ÑÁ©∫??
        .replace(/[ \t]+\n/g, '\n')
        // ÁßªÈô§ÊØèË?ÁµêÂ∞æ?ÑÁ©∫?ΩÔ??ÄÂæå‰?Ë°åÔ?
        .replace(/[ \t]+$/, '')
        // Â∞áÈÄ?? 3 ?ã‰ª•‰∏äÁ??õË??à‰Ωµ??2 ??
        .replace(/\n{3,}/g, '\n\n')
        // ÁßªÈô§?ãÈ†≠?ÑÁ©∫?ΩË?
        .replace(/^\n+/, '')
        // ÁßªÈô§ÁµêÂ∞æ?ÑÁ©∫?ΩË?
        .replace(/\n+$/, '');
}

const RandomGreetingSystem = {
    timer: null,
    lastUserActivity: Date.now(),
    greetingInterval: null,
    
    greetings: {
        friendly: [
            '?®Â?ÔºüÊÉ≥‰Ω†‰?ÔΩ?,
            '?ÄËøëÂ•Ω?éÔ?',
            '?âÁ©∫?éÔ??≥Ë???,
            '?øÔ??®Â?‰ªÄÈ∫ºÂë¢Ôº?,
            '?≥Â?‰Ω†‰?‰ª∂‰?',
            'Á™ÅÁÑ∂?≥Âà∞‰Ω?,
            '‰Ω†È??®Â?Ôº?,
            '?âÈ??°Ë?ÔºåÊÉ≥?æ‰∫∫?äÂ§©'
        ],
        cold: [
            '?ØÔ?',
            '?â‰??éÔ?',
            '??,
            'Ë™™Âêß'
        ],
        shy: [
            '??Ä?..?®Â?Ôº?,
            '‰∏çÂ•Ω?èÊÄùÊ??æ‰?...',
            'Â¶ÇÊ??π‰æø?ÑË©±...',
            '??Ä?..?âÈ??≥Êâæ‰Ω†Ë?Â§?
        ],
        busy: [
            'ÂøôÂ?‰∫ÜÔ??âÁ©∫?éÔ?',
            'ÁµÇÊñº?âÁ©∫‰∫?,
            '?õÂ?ÂÆåÔ?‰Ω†Âú®?éÔ?'
        ],
        caring: [
            '?ÑÂ•Ω?éÔ??âÈ??îÂ?‰Ω?,
            '?ÄËøëÈ?ÂæóÊÄéÈ∫ºÊ®??',
            'Ë®òÂ??ßÈ°ß?™Â∑±??,
            '?•Â§™Á¥Ø‰?',
            '?âÂ•ΩÂ•ΩÂ?È£ØÂ?Ôº?
        ],
        playful: [
            '?øÔ??úÁ??ëÂú®?≥‰?È∫ºÔ?',
            'Á™ÅÁÑ∂Â•ΩÊÉ≥?âÂ?‰Ω†‰?‰∏?,
            '‰Ω†‰?ÂÆöÊÉ≥‰∏çÂà∞?ëÁèæ?®Âú®?ö‰?È∫?,
            'Ë¶Å‰?Ë¶ÅÁé©?ãÈ??≤Ô?'
        ],
        romantic: [
            '?®ÊÉ≥‰Ω?,
            'Â•ΩÊÉ≥Ë¶ã‰?',
            '‰Ω†‰?Â§©È?ÂæóÂ•Ω?éÔ??ë‰??¥Âú®?≥‰??Ñ‰?',
            'Á™ÅÁÑ∂Ë¶∫Â?Â•ΩÂπ∏Á¶èÔ??†ÁÇ∫?â‰?'
        ]
    },
    
    checkInMessages: [
        'Â•Ω‰?Ê≤íË?Â§©‰?ÔºåÈ?Â•ΩÂ?Ôº?,
        '‰Ω†Â•Ω?èÂ?‰πÖÊ??ûÊ?‰∫?..',
        '?Ø‰??ØÂú®ÂøôÂ?Ôº?,
        'Á≠â‰?Â•Ω‰?‰∫ÜÔ?',
        '?ÑÂú®?éÔ??âÈ??îÂ?',
        '?éÈ∫ºÊ∂àÂ§±‰∫ÜÈÄôÈ∫º‰πÖÔ?'
    ],
    
    getPersonalityType(personality) {
        if (!personality) return 'friendly';
        const lower = personality.toLowerCase();
        
        if (lower.includes('?∑Ê?') || lower.includes('È´òÂÜ∑') || lower.includes('?∑Ê∑°')) return 'cold';
        if (lower.includes('ÂÆ≥Á?') || lower.includes('?ßÂ?') || lower.includes('?¶Ë?')) return 'shy';
        if (lower.includes('ÂøôÁ?') || lower.includes('Âø?) || lower.includes('Â∑•‰???)) return 'busy';
        if (lower.includes('È´îË≤º') || lower.includes('Ê∫´Ê?') || lower.includes('?úÂ?')) return 'caring';
        if (lower.includes('Ë™øÁöÆ') || lower.includes('?õÁé©') || lower.includes('Ê¥ªÊ?')) return 'playful';
        if (lower.includes('Êµ™Êº´') || lower.includes('Ê∑±Ê?') || lower.includes('?Ä??)) return 'romantic';
        
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
        
        console.log('[Greeting] Â∑≤Áôº?ÅÈö®Ê©üÂ???', greeting);
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
        
        console.log('[Greeting] Â∑≤Áôº?ÅÁî®?∂Èï∑?ÇÈ??™Â?Ë¶ÜÊ???', checkIn);
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
        
        console.log('[Greeting] ?®Ê??èÂÄôÁ≥ªÁµ±Â∑≤?üÂ?ÔºåÈ???', intervalMinutes, '?ÜÈ?');
    },
    
    stop() {
        if (this.greetingInterval) {
            clearInterval(this.greetingInterval);
            this.greetingInterval = null;
        }
        console.log('[Greeting] ?®Ê??èÂÄôÁ≥ªÁµ±Â∑≤?úÊ≠¢');
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
    if (status) status.textContent = config.enabled ? 'Â∑≤Â??®Èö®Ê©üÂ??? : '?úÈ??Ç‰??É‰∏ª?ïÁôº??;
    
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
        
        if (status) status.textContent = settings.enabled ? 'Â∑≤Â??®Èö®Ê©üÂ??? : '?úÈ??Ç‰??É‰∏ª?ïÁôº??;
        
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

// ?ú‰?Ë∑ùÈõ¢Ë®≠Â??ùÂ???
const MEETUP_MENTION_KEY = 'sx_meetup_mention_enabled';
const RELATIONSHIP_DISTANCE_KEY = 'sx_relationship_distance';

function initRelationshipDistanceSettings() {
    const toggle = document.getElementById('meetup-mention-toggle');
    const status = document.getElementById('meetup-mention-status');
    const distanceSelect = document.getElementById('relationship-distance');
    
    if (!toggle) return;
    
    // ËºâÂÖ•‰øùÂ??ÑË®≠ÂÆ?
    const meetupEnabled = localStorage.getItem(MEETUP_MENTION_KEY) !== 'false';
    const distance = localStorage.getItem(RELATIONSHIP_DISTANCE_KEY) || 'moderate';
    
    toggle.checked = meetupEnabled;
    if (distanceSelect) distanceSelect.value = distance;
    
    const updateStatus = () => {
        if (status) {
            status.textContent = toggle.checked ? 'ËßíËâ≤?ØËÉΩ?ÉÊ??äË??? : 'ËßíËâ≤‰∏çÊ?‰∏ªÂ??êË???;
        }
    };
    updateStatus();
    
    const saveSettings = () => {
        localStorage.setItem(MEETUP_MENTION_KEY, toggle.checked ? 'true' : 'false');
        if (distanceSelect) {
            localStorage.setItem(RELATIONSHIP_DISTANCE_KEY, distanceSelect.value);
        }
        updateStatus();
        console.log('[Chat] ?ú‰?Ë∑ùÈõ¢Ë®≠Â?Â∑≤‰?Â≠?', {
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
        /Â•Ω[?äÂ??ß]?[Ôº?]?$/,
        /?ëÈ???,
        /È°òÊ?[?äÂ??ß]?[Ôº?]?$/,
        /?Ø‰ª•[?äÂ??ß]?[Ôº?]?$/,
        /Ê≤íÂ?È°?,
        /Â•ΩÂ?[Ôº?]?$/,
        /Â•ΩÂ?[Ôº?]?$/,
        /?∂ÁÑ∂/,
        /‰∏ÄËµ∑‰?/,
        /‰∏ÄËµ∑Ë≤∑/,
        /Â§™Â•Ω‰∫?,
        /Â•ΩÂ?Ê≠?
    ];
    
    const rejectPatterns = [
        /‰∏çË?[?äÂ??ß]?[Ôº?]?$/,
        /‰∏çË?/,
        /‰∏çÊñπ‰æ?,
        /?çË™™/,
        /?ÉÊÖÆ/,
        /?ÑÊòØ‰∏çË?/,
        /?´Ê?/,
        /‰ª•Â??çË™™/
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
                
                console.log('[HouseInvite] TA ?åÊ?‰∏ÄËµ∑Ë≤∑?øÔ?Â∑≤Âª∫Á´ãÂÖ±?åÊàø??);
            }
        }
    } else if (isReject) {
        localStorage.removeItem('sx_pending_house_invite');
        console.log('[HouseInvite] TA ?íÁ?‰∫ÜË≤∑?øÈ?Ë´?);
    }
}
// --- ‰∫ã‰ª∂Á∂ÅÂ? ---

// 2. Á∂ÅÂ??µÁõ§ Enter ?µÔ??∑Ë? handleJustSend
if (msgInput) {
    msgInput.addEventListener('keydown', (e) => {
        if (e.isComposing || e.keyCode === 229) return;
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleJustSend();
        }
    });
}
// --- 10. Ë®äÊÅØ?∏ÂñÆ?üËÉΩ ---
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

// --- 11. API Ë®≠Â??ùÂ???(?ãÊ?/iOS ?ºÂÆπ) ---
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
    } catch(e){ console.warn('API ?çÁΩÆËß???ØË™§', e); }

    const saveHandler = (e) => {
        e.stopPropagation();
        const config = {
            url: urlInput.value.trim(),
            key: keyInput.value.trim(),
            model: modelInput.value.trim() || 'gpt-3.5-turbo'
        };
        try {
            localStorage.setItem('api_configs', JSON.stringify([config]));
            alert('API ?çÁΩÆÂ∑≤ÂÑ≤Â≠???);
        } catch(e){
            alert('?≤Â?Â§±Ê?ÔºåË?Á¢∫Ë??èË¶Ω?®Â?Ë®?localStorage');
            console.error(e);
        }
    };

    saveBtn.addEventListener('click', saveHandler);
    saveBtn.addEventListener('touchend', saveHandler);
}
function handleBack() {
    console.log("Ê≠?ú®?∑Ë?ËøîÂ??áÂ?Ê≠•È?Ëº?..");

    // 1. Ë¶ñË¶∫?ïÁï´
    document.body.style.transition = 'all 0.3s ease';
    document.body.style.opacity = '0';
    document.body.style.transform = 'scale(0.95)';

    // 2. Ë≥áÊ??∂È??áÂ?Ê≠?
    try {
        // ?àÊî∂?ÜÁï∂?çÁ?Ë®≠Â???(‰øùÁ??®Ê??∞Á?ËÆÄ??settings ?ÉÁ??èËºØ)
        const lang = document.getElementById('langSelect')?.value;
        const region = document.getElementById('regionInput')?.value;
        const userName = document.getElementById('userNameInput')?.value;

        if (lang) localStorage.setItem('sxiphone_lang', lang);
        if (region) localStorage.setItem('sxiphone_region', region);
        if (userName) localStorage.setItem('sx_user_name', userName);

        // Â∞ÅË??Ä?âË??ôÂà∞ payload (?ÖÂê´?úÈçµ?ÑÈ†≠Ë≤?
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
            console.log("iOS ?∏Ê?Â∞ÅË?ÂÆåÊ?");
        }

        // 3. ?∑Ë??≥Ëº∏?èËºØ
        const isIframe = window.parent && window.parent !== window;
        if (isIframe) {
            // ?ºÈÄÅÊ?‰ª§Áµ¶ iOS App ÂÆπÂô®Ôºå‰∏¶Â∏∂‰?ÂÆåÊï¥??payload
            window.parent.postMessage({
                type: 'closeApp',
                appId: 'chat', // Áµ±‰?‰ª?¢º??chat
                payload: currentPayload
            }, '*');
            console.log("Â∑≤ÈÄöÈ? postMessage ?ºÈÄ?closeApp");
        } else {
            // ?ûÂÆπ?®Áí∞Â¢ÉÔ?Ë∑≥Ë?
            setTimeout(() => {
                window.location.replace("../index.html");
            }, 300);
        }

    } catch (e) {
        console.error("?åÊ≠•?ñË??ûÈ?Á®ãÁôº?üÈåØË™?", e);
    }
}

// --- 12. Ë™ûÈü≥?öË©±?üËÉΩ ---
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
            alert('Ë´ãÂ???Settings Ë®≠Â? STT ??TTS ?çÂ?');
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
        if (statusText) statusText.textContent = 'Ê≠?ú®???...';
        if (transcript) transcript.innerHTML = '';

        this.startTimer(timerEl);

        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (statusText) statusText.textContent = '?öË©±‰∏?;
            this.startListening();
        } catch (err) {
            if (statusText) statusText.textContent = `?°Ê?Â≠òÂ?È∫•Â?È¢®Ô?${err.message}`;
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
                if (statusText) statusText.textContent = 'Â∞çÊñπÊ≠?ú®?ùËÄ?..';

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

                if (statusText) statusText.textContent = '?öË©±‰∏?;
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
            console.warn('STT Ë´ãÊ?Â§±Ê?:', err);
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
            console.warn('AI ?ûË?Â§±Ê?:', err);
            return null;
        }
    },

    async sendToTTS(text) {
        if (!this.settings) return;
        const statusText = document.getElementById('call-status-text');
        const transcript = document.getElementById('voice-call-transcript');
        
        try {
            if (statusText) statusText.textContent = 'Â∞çÊñπÊ≠?ú®Ë™™Ë©±...';
            
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
                                <div class="transcript-translated">??${displayText}</div>
                            `;
                        } else {
                            entry.textContent = text;
                        }
                        
                        transcript.appendChild(entry);
                        transcript.scrollTop = transcript.scrollHeight;
                    }
                }
            });

            if (statusText) statusText.textContent = '?öË©±‰∏?;
        } catch (err) {
            console.warn('TTS ?≠ÊîæÂ§±Ê?:', err);
            if (statusText) statusText.textContent = '?öË©±‰∏?;
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
        if (statusText) statusText.textContent = '?öË©±ÁµêÊ?';

        setTimeout(() => {
            if (panel) panel.classList.remove('active');
        }, 1500);
    },

    async saveCallRecording() {
        const RECORDINGS_KEY = 'sx_voice_call_recordings';
        const duration = Math.floor((Date.now() - this.callStartTime) / 1000);
        const charName = localStorage.getItem('sx_char_name') || '?™Áü•';

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
                console.warn('?ÑÈü≥Ë≥áÊ?ËΩâÊ?Â§±Ê?:', err);
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

// Ë™ûÈü≥?öË©±‰∫ã‰ª∂Á∂ÅÂ?
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
                voiceCallStartBtn.textContent = 'Â∞öÊú™Ë®≠Â?Ë™ûÈü≥?çÂ?';
            } else {
                voiceCallStartBtn.innerHTML = '<i class="fas fa-phone"></i> ?ãÂ??öË©±';
            }
        }
    }
});

const SHOP_PRODUCTS_KEY = 'sx_shop_products';
const SHOP_CART_KEY = 'sx_shop_cart';
const SHOP_SETTINGS_KEY = 'sx_shop_settings';

const adultKeywords = [
    '?ÖË∂£', '?ê‰∫∫', '?ßÊ?', '?ßË°£', '?ßË§≤', '?ÖË∂£?®Â?', '?™ÊÖ∞', '?âÊë©Ê£?,
    'Ë∑≥Ë?', 'ÊΩ§Ê?', '‰øùÈö™Â•?, '?øÂ?', '?ßÊ??ßË°£', 'Áµ≤Ë•™', '?äÂ∏∂Ë•?,
    '?ê‰∫∫?®Â?', '?ßÁé©??, '?∞Ë?', '?∞È?', '?õÂ?', 'È£õÊ???, '?ÖÊ∞£Â®ÉÂ?',
    '?ÖË∂£?ßË°£', '?ãË?', '?èÊ?Ë£?, '?ßÊ??°Ë°£', '?üÁ?', 'SM', 'Ë™øÊ?',
    '‰π≥Áí∞', 'bdsm', '?≠Â?', '?ãÈä¨', '?ºÁΩ©', '?üÁá≠',
    'adult', 'sex', 'erotic', 'lingerie', 'vibrator', 'dildo', 'condom',
    'masturbat', 'intimate', 'sensual', ' bondage', 'fetish', 'toy',
    'nsfw', '18+', '?≤Ëâ≤', '?öÊ?', '?õÊ?', 'Ë¶™ÁÜ±', 'Â∫ä‰?', '?ö‰?'
];

const nsfwConversationKeywords = [
    '?ÖË∂£', '?ßË°£', '?ßÊ?', '?°Ë°£', 'Áµ≤Ë•™', 'Â∫ä‰?', 'Ë¶™ÁÜ±', '?öÊ?', '?õÊ?',
    '?ö‰?‰∏ÄËµ?, '‰ªäÊ?', '??, '??, '??, '??, '?èÊ?', '?íÊ?',
    '?≥Ë?‰Ω?, '?±Êä±', 'Ë¶™Ë¶™', 'Ë≤ºË≤º', 'Ëπ≠Ëπ≠', 'Êø?, 'Á°?,
    '?©Áé©', 'Ë©¶Ë©¶', '?∞Ëä±Ê®?, '?∫Ê?', '?àÂ•Æ', '?èÊ?Â∏?,
    'nsfw', '18+', '?≤Ëâ≤', '?ãË?', 'È£ÜË?'
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
        { id: 'default_1', title: 'Á≤æÈÅ∏Ë≠∑Ë?Áµ?, price: 456, platform: 'coupang', category: 'ÁæéÂ?', thumb: 'linear-gradient(135deg,#f093fb,#f5576c)' },
        { id: 'default_2', title: 'ÊΩÆÊ??çÈ£æ', price: 328, platform: 'shopee', category: '?çÈ£æ', thumb: 'linear-gradient(135deg,#667eea,#764ba2)' },
        { id: 'default_3', title: '?°Á??≥Ê?', price: 899, platform: 'amazon', category: '3C', thumb: 'linear-gradient(135deg,#5ee7df,#b490ca)' },
        { id: 'default_4', title: 'Â±ÖÂÆ∂?∂Á?', price: 199, platform: 'taobao', category: 'ÂÆ∂Â?', thumb: 'linear-gradient(135deg,#ff9a9e,#fecfef)' }
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
                <span>${product.platform || '?®Ëñ¶'} ¬∑ ${product.category || ''}</span>
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
        alert('Ë´ãÈÅ∏?á‰??ãÂ???);
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
    const orderBadge = type === 'order' ? '<span class="product-order-badge">Â∑≤ÁÇ∫‰Ω†‰???/span>' : '';
    const message = type === 'order' 
        ? `?ëË¶∫ÂæóÈÄôÂÄã‰??ØÔ?Â∑≤Á?Âπ´‰?‰∏ãÂñÆ‰∫ÜÔ?` 
        : `?®Ëñ¶‰Ω†ÈÄôÂÄãÂ??ÅÔ??ãÁ??ú‰??úÊ≠°ÔΩû`;
    
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
    const externalLink = externalUrl ? `<a href="${externalUrl}" target="_blank" class="product-external-link" onclick="event.stopPropagation()"><i class="fas fa-external-link-alt"></i> ?çÂ?Âπ≥Âè∞</a>` : '';
    
    const isAdult = isAdultProduct(product);
    const shopSettings = getShopSettings();
    const showAdult = shopSettings.showAdultContent;
    const blurStyle = isAdult && !showAdult ? 'filter: blur(20px);' : '';
    const adultBadge = isAdult ? '<span style="position:absolute;top:8px;right:8px;background:rgba(239,68,68,0.9);color:#fff;font-size:10px;padding:2px 6px;border-radius:4px;">??</span>' : '';
    
    return `
        <div class="product-card-message" data-product-id="${product.id}" onclick="openProductDetail('${product.id}')">
            <div class="product-thumb" style="background: ${product.thumb}; ${blurStyle} position: relative;">
                ${adultBadge}
            </div>
            <h4>${product.title}</h4>
            <p>NT$ ${product.price}</p>
            <span>${product.platform || ''} ¬∑ ${product.category || ''}</span>
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
                    <div style="font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 8px;">‰æÜËá™ ${gift.sender}</div>
                </div>
            `;
            appendMsg('mine', giftBubbleHtml);

            const history = JSON.parse(localStorage.getItem('sx_chat_history') || '[]');
            history.push({ 
                role: 'user', 
                content: `?ÅÂá∫‰∫ÜÁ¶Æ?©Âà∏??{gift.name}??{gift.message ? `ÔºåÁ?Ë®ÄÔºö„Ä?{gift.message}?ç` : ''}`
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
        const senderName = data.senderName || '?ù‰∫∫';
        const anonymous = data.anonymous;
        const message = data.message || '';

        const giftCatalog = {
            'coffee_basic': { name: 'ÁæéÂ??ñÂï°??, icon: '??, bg: 'linear-gradient(135deg, #8B4513 0%, #D2691E 100%)' },
            'bubble_tea': { name: '?çÁ?Â•∂Ëå∂??, icon: '??', bg: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)' },
            'dessert': { name: '?úÈ???, icon: '?ç∞', bg: 'linear-gradient(135deg, #F48FB1 0%, #EC407A 100%)' },
            'birthday': { name: '?üÊó•Á¶ÆÁâ©??, icon: '??', bg: 'linear-gradient(135deg, #F06292 0%, #E91E63 100%)' },
            'love': { name: '?õÂ?Á¶ÆÁâ©??, icon: '??', bg: 'linear-gradient(135deg, #EF5350 0%, #C62828 100%)' }
        };

        const gift = giftCatalog[giftId] || { name: 'Á•ûÁ?Á¶ÆÁâ©', icon: '??', bg: 'linear-gradient(135deg, #666 0%, #999 100%)' };

        const giftBubbleHtml = `
            <div class="gift-message-bubble received" style="background: ${gift.bg}; padding: 16px; border-radius: 16px; display: inline-block; min-width: 150px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 8px;">${gift.icon}</div>
                <div style="font-weight: 600; color: #fff; font-size: 14px;">${gift.name}</div>
                ${message ? `<div style="font-size: 12px; color: rgba(255,255,255,0.9); margin-top: 6px; font-style: italic;">"${message}"</div>` : ''}
                <div style="font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 8px;">‰æÜËá™ ${anonymous ? 'Á•ûÁ?‰∫? : senderName}</div>
            </div>
        `;
        appendMsg('other', giftBubbleHtml);

        const history = JSON.parse(localStorage.getItem('sx_chat_history') || '[]');
        history.push({ 
            role: 'assistant', 
            content: `?ÅÁµ¶‰Ω†„Ä?{gift.name}??{message ? `Ôºö„Ä?{message}?ç` : ''}`
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
        preview.innerHTML = '<div class="memory-table-empty">ÈªûÊ??åÁ??êË??∂Ë°®?º„ÄçÈ?Âß?/div>';
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
            preview.innerHTML = '<div class="memory-table-empty">?ÆÂ?Ê≤íÊ?Â∞çË©±Ë®òÈ?</div>';
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
            topic: currentTopic || '?•Â∏∏Â∞çË©±'
        });
    }
    
    currentMemoryTableData = {
        id: `memory_${Date.now()}`,
        createdAt: new Date().toISOString(),
        charName: charConfig?.name || getActiveConfig().name || 'AI ?©Á?',
        userName: userConfig?.name || localStorage.getItem('sx_user_name') || 'User',
        entries: memoryEntries,
        rounds: rounds
    };
    
    renderMemoryTablePreview(currentMemoryTableData);
    
    if (addBtn) addBtn.disabled = false;
}

function extractKeywords(text) {
    const stopWords = ['??, '??, '‰∫?, '??, '‰Ω?, '‰ª?, 'Â•?, 'ÂÆ?, '?ëÂÄ?, '‰Ω†ÂÄ?, '‰ªñÂÄ?, '??, '??, '??, '??, '‰∏?, 'Â∞?, '‰π?, '??, '??, 'Ë¶?, '?Ø‰ª•', '‰ªÄÈ∫?, '?éÈ∫º', '?∫‰?È∫?, '??, '??, '??, '??, '??, '??, 'Â•?, 'Â∞?, 'Âæ?, '??, '??, '‰Ω?, 'Â¶ÇÊ?', '?†ÁÇ∫', '?Ä‰ª?, '?∂Â?', '?ñËÄ?, '?å‰?', '?ØÊòØ', '‰∏çÈ?'];
    
    const words = text.split(/[\s,Ôºå„ÄÇÔ?Ôº??.;ÔºõÔ?:""''?å„Äç„Äê„Äë\[\]()ÔºàÔ?]+/);
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
                        <th>Ëº™Ê¨°</th>
                        <th>${sanitizeText(data.userName)} Ë™?/th>
                        <th>${sanitizeText(data.charName)} ?ûÊ?</th>
                        <th>?úÈçµÂ≠?/th>
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
    
    alert('Â∑≤Â??•Èï∑?üË??∂Ô?');
}

function renderSavedMemoryTables() {
    const container = document.getElementById('memory-saved-items');
    if (!container) return;
    
    const tables = getMemoryTables();
    
    if (tables.length === 0) {
        container.innerHTML = '<div class="memory-saved-empty">Â∞öÊú™?≤Â?‰ªª‰?Ë®òÊÜ∂Ë°®Ê†º</div>';
        return;
    }
    
    container.innerHTML = tables.map((table, index) => {
        const lang = localStorage.getItem('sxiphone_lang') || 'zh-Hant';
        const localeCode = window.getLocaleStringLang?.(lang) || 'zh-TW';
        const date = new Date(table.createdAt).toLocaleString(localeCode);
        return `
            <div class="memory-saved-item" data-index="${index}">
                <div class="memory-saved-item-info">
                    <div class="memory-saved-item-name">${sanitizeText(table.charName)} - ${table.rounds} Ëº™Â?Ë©?/div>
                    <div class="memory-saved-item-date">${date}</div>
                </div>
                <div class="memory-saved-item-actions">
                    <button onclick="viewMemoryTable(${index})" title="?•Á?"><i class="fas fa-eye"></i></button>
                    <button onclick="exportMemoryTable(${index}, 'html')" title="?ØÂá∫ HTML"><i class="fas fa-code"></i></button>
                    <button onclick="exportMemoryTable(${index}, 'txt')" title="?ØÂá∫ TXT"><i class="fas fa-file-alt"></i></button>
                    <button class="delete-btn" onclick="deleteMemoryTable(${index})" title="?™Èô§"><i class="fas fa-trash"></i></button>
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
    if (!confirm('Á¢∫Â?Ë¶ÅÂà™?§Ê≠§Ë®òÊÜ∂Ë°®Ê†º?éÔ?')) return;
    
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
    <title>Ë®òÊÜ∂Ë°®Ê†º - ${sanitizeText(table.charName)}</title>
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
        <h1>Ë®òÊÜ∂Ë°®Ê†º</h1>
        <div class="meta">
            <p><strong>ËßíËâ≤Ôº?/strong>${sanitizeText(table.charName)}</p>
            <p><strong>?®Êà∂Ôº?/strong>${sanitizeText(table.userName)}</p>
            <p><strong>Â∞çË©±Ëº™Êï∏Ôº?/strong>${table.rounds} Ëº?/p>
            <p><strong>?üÊ??ÇÈ?Ôº?/strong>${date}</p>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Ëº™Ê¨°</th>
                    <th>${sanitizeText(table.userName)} Ë™?/th>
                    <th>${sanitizeText(table.charName)} ?ûÊ?</th>
                    <th>?úÈçµÂ≠?/th>
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
            <p>??SxiPhone ?äÂ§©?âÁî®?üÊ?</p>
        </div>
    </div>
</body>
</html>`;
        return html;
        
    } else {
        let txt = `Ë®òÊÜ∂Ë°®Ê†º
========================================

ËßíËâ≤Ôº?{table.charName}
?®Êà∂Ôº?{table.userName}
Â∞çË©±Ëº™Êï∏Ôº?{table.rounds} Ëº?
?üÊ??ÇÈ?Ôº?{date}

----------------------------------------

`;
        
        table.entries.forEach(entry => {
            txt += `?êÁ¨¨ ${entry.round} Ëº™„Ä?
${table.userName}Ôº?{entry.userSummary}
${table.charName}Ôº?{entry.aiSummary}
?úÈçµÂ≠óÔ?${entry.keywords}

`;
        });
        
        txt += `----------------------------------------
??SxiPhone ?äÂ§©?âÁî®?üÊ?
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
        alert('Ë´ãÂ??üÊ?Ë®òÊÜ∂Ë°®Ê†º');
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
            console.warn('[Chat] Ë®òÊÜ∂?≤Â?Â§±Ê?:', e);
        });
    }
};

const initAppMemoryHelper = () => {
    if (window.AppMemoryHelper) {
        window.AppMemoryHelper.init('chat');
        console.log('[Chat] AppMemoryHelper Â∑≤Â?ÂßãÂ?');
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
                console.log('[Chat] ÊØèÊó•?öÈ?ÂÆåÊ?:', {
                    surfaced: result.awakening?.surfaced?.length || 0,
                    collects: result.awakening?.collects?.length || 0
                });
                
                return result.context;
            }
            
            return result?.context || null;
        } catch (e) {
            console.warn('[Chat] ?öÈ?Ê™¢Êü•Â§±Ê?:', e);
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
            console.warn('[Chat] ?≤Â??öÈ?‰∏ä‰??áÂ§±??', e);
            return null;
        }
    }
    
    return null;
};

const formatAwakeningForSystemPrompt = (context) => {
    if (!context) return '';
    
    let prompt = '\n\n?êÊ??•Â??íË??∂„Äë\n';
    
    if (context.collects && context.collects.length > 0) {
        prompt += '?®Êó•?ô‰??ÑÊ??óÔ?\n';
        for (const c of context.collects.slice(0, 5)) {
            prompt += `- ${c.feel}\n`;
        }
        prompt += '\n';
    }
    
    if (context.surfaced && context.surfaced.length > 0) {
        prompt += 'Ë®òÂ??ÑÁ?ÊÆµÔ?\n';
        for (const m of context.surfaced.slice(0, 5)) {
            prompt += `- ${m.content}\n`;
        }
        prompt += '\n';
    }
    
    if (context.emotionalTone) {
        prompt += `?ÆÂ??ÖÁ??Ä?ãÔ?${context.emotionalTone.label}\n`;
    }
    
    if (context.greeting) {
        prompt += `\n?ãÂ†¥?ΩÂª∫Ë≠∞Ô?${context.greeting}\n`;
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
                console.log('[Chat] ?üÊ?Ê®°Â?Â∑≤Â??õÁÇ∫:', newMode);
                
                // È°ØÁ§∫Ê®°Â??áÊ??êÁ§∫
                const modeNames = {
                    'dialogue': 'Á¥îÂ?Ë©±Ê®°Âº?,
                    'narrative': '?ò‰?Ê®°Â?',
                    'multi': 'Â§öÊ?Ê∂àÊÅØÊ®°Â?',
                    'multi-text': 'Á¥îÊ?Â≠óÂ?Ê¢ùÊ???,
                    'full': 'ÂÆåÊï¥Ê®°Â?'
                };
                
                // ?®Ë?Â§©Â??üÈ°ØÁ§∫Á≥ªÁµ±Ê?Á§?
                const chatFlow = document.getElementById('chat-flow');
                if (chatFlow) {
                    const notice = document.createElement('div');
                    notice.className = 'system-notice mode-switch-notice';
                    notice.innerHTML = `<i class="fas fa-info-circle"></i> ?üÊ?Ê®°Â?Â∑≤Â??õÁÇ∫??strong>${modeNames[newMode] || newMode}</strong>?çÔ?‰∏ãÊ¨° AI ?ûË?Â∞á‰Ωø?®Êñ∞Ê®°Â??Ç`;
                    notice.style.cssText = 'background: #e3f2fd; color: #1976d2; padding: 8px 12px; border-radius: 8px; margin: 8px 0; font-size: 13px; text-align: center;';
                    chatFlow.appendChild(notice);
                    chatFlow.scrollTop = chatFlow.scrollHeight;
                    
                    // 5ÁßíÂ?ÁßªÈô§?êÁ§∫
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
    console.log('[Chat] ?∂Âà∞Ë≥áÊ??ÑÂ??öÁü•ÔºåÈ??∞Ë??•Ë®≠ÂÆ?..');
    charConfig = getActiveConfig();
    userConfig = getUserConfig();
    
    const nameEl = document.getElementById('display-name');
    const chatTitleEl = document.getElementById('chat-detail-title');
    const hintEl = document.getElementById('hint-name');
    const charPersInput = document.getElementById('set-personality');
    const charBackInput = document.getElementById('set-background');
    const charNameInput = document.getElementById('set-name');
    
    let displayName = localStorage.getItem('sx_char_name');
    if (!displayName || displayName === '?êË®≠?®Êà∂') {
        displayName = charConfig.name || "AI ?©Á?";
    }
    
    if (nameEl) nameEl.innerText = displayName;
    if (chatTitleEl) chatTitleEl.innerText = displayName;
    if (hintEl) hintEl.innerText = displayName;
    if (charPersInput) charPersInput.value = localStorage.getItem('sx_char_personality') || charConfig.personality || "";
    if (charBackInput) charBackInput.value = localStorage.getItem('sx_char_background') || charConfig.background || "";
    if (charNameInput) charNameInput.value = displayName;
    
    renderChatListFromStorage();
});

// ‰∏ªÈ??âÁî®?ΩÊï∏
let isApplyingTheme = false;
let pendingTheme = null;

function applyChatTheme(theme) {
    if (!theme || !theme.config) {
        console.warn('[Chat] ?°Ê??Ñ‰∏ªÈ°åË???);
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
        
        console.log('[Chat] ‰∏ªÈ?Â∑≤Ê???', theme.name);
        
        isApplyingTheme = false;
        
        if (pendingTheme) {
            const nextTheme = pendingTheme;
            pendingTheme = null;
            applyChatTheme(nextTheme);
        }
    });
}

// ?âÁî®Â§ñË?Ë®≠Â?
function applyAppearanceConfig(config) {
    if (!config) return;
    
    const root = document.documentElement;
    
    // ?âÁî®?áÂ?È°èËâ≤
    if (config.textPrimary) {
        root.style.setProperty('--sx-text', config.textPrimary);
    }
    if (config.fontSize) {
        root.style.setProperty('--chat-font-size', config.fontSize + 'px');
    }
    
    // ?âÁî®?™Ë?‰∏ªÈ?Ë®≠Â?
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
    console.log('[Chat] Â§ñË?Ë®≠Â?Â∑≤Ê???);
}

// ?ÅÈù¢ËºâÂÖ•?ÇÊ??®Â∑≤?≤Â??Ñ‰∏ªÈ°?
function loadSavedChatTheme() {
    try {
        const savedTheme = localStorage.getItem('sx_chat_applied_theme');
        if (savedTheme) {
            const theme = JSON.parse(savedTheme);
            applyChatTheme(theme);
            console.log('[Chat] Â∑≤Ë??•ÂÑ≤Â≠òÁ?‰∏ªÈ?:', theme.name);
        }
    } catch (e) {
        console.warn('[Chat] ËºâÂÖ•?≤Â??Ñ‰∏ªÈ°åÂ§±??', e);
    }
}

// ??DOMContentLoaded ?ÇË??•‰∏ªÈ°?
document.addEventListener('DOMContentLoaded', loadSavedChatTheme);

// ?≤Â??äÂ§©ÂÆ§Ë®≠ÂÆöÂ???
const CHAT_SETTINGS_KEY = 'sx_chat_room_settings';

function saveChatRoomSettings() {
    const activeId = getActiveChatId();
    const charName = localStorage.getItem('sx_char_name') || 'AI ?©Á?';
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
    
    // ?åÊ??¥Êñ∞?∂Â??äÂ§©ÂÆ§Á? session
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
    
    // ?åÊ≠•?∞Èõ≤Á´?
    window.parent?.postMessage({ type: 'TRIGGER_GITHUB_SYNC' }, '*');
    
    console.log('[Chat] ?äÂ§©ÂÆ§Ë®≠ÂÆöÂ∑≤?≤Â?:', settings);
    
    // È°ØÁ§∫?êÂ??êÁ§∫
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#34C759;color:#fff;padding:12px 24px;border-radius:20px;font-size:14px;z-index:10000;';
    toast.textContent = '?äÂ§©ÂÆ§Ë®≠ÂÆöÂ∑≤?≤Â?';
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
        console.warn('[Chat] ËºâÂÖ•?äÂ§©ÂÆ§Ë®≠ÂÆöÂ§±??', e);
        return null;
    }
}

function applyChatRoomSettings(settings) {
    if (!settings) return;
    
    // ?âÁî®ËßíËâ≤Ë®≠Â?
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
    
    // ?âÁî®?®Êà∂Ë®≠Â?
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
    
    // ?¥Êñ∞?çÁΩÆ
    charConfig = getActiveConfig();
    userConfig = getUserConfig();
    
    console.log('[Chat] Â∑≤Ê??®ÂÑ≤Â≠òÁ??äÂ§©ÂÆ§Ë®≠ÂÆ?);
}

// ?ùÂ??ñÊ?ËºâÂÖ•?≤Â??ÑË®≠ÂÆ?
document.addEventListener('DOMContentLoaded', () => {
    const savedSettings = loadChatRoomSettings();
    if (savedSettings) {
        applyChatRoomSettings(savedSettings);
    }
    
    // Á∂ÅÂ??≤Â??âÈ?
    const saveBtn = document.getElementById('save-chat-settings');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveChatRoomSettings);
    }
});

async function handleArcadeInvite(payload) {
    const charName = payload.charName || 'AI ?©Á?';
    const charAvatar = payload.charAvatar || '';
    const charPersonality = payload.charPersonality || '?ãÂ??ÑÂä©??;
    const charBackground = payload.charBackground || '';
    const userName = localStorage.getItem('sx_user_name') || 'User';
    const lang = localStorage.getItem('sxiphone_lang') || 'zh-TW';
    
    const apis = JSON.parse(localStorage.getItem('api_configs') || '[]');
    
    let inviteText = '?ÄË´ã‰?‰∏ÄËµ∑ÂéªË°óÊ?Âª≥Áé©?äÊà≤Ôº?;
    
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
            worldInfoStr || '??,
            '',
            '# RECENT_CHAT',
            recentHistory || '?°Ê?ËøëÂ?Ë©?,
            '',
            '# TASK',
            '- ‰Ω†ÊòØ ' + charName + 'Ôºå‰??≥È?Ë´?' + userName + ' ‰∏ÄËµ∑ÂéªË°óÊ?Âª≥Áé©?äÊà≤',
            '- Ë´ãÁ??ê‰??•Ëá™?∂Á??ÄË´ãË? (1-2 ?•Ë©±)',
            '- ?πÊ?‰Ω†Á??ßÊ†º?åË??Ø‰?Ë°®È?',
            '- ‰ΩøÁî® ' + lang + ' Ê∫ùÈÄ?,
            '- ‰øùÊ?ËßíËâ≤?ßÊ†ºÔºå‰?Ë¶ÅÊ??ä‰???AI',
            '- ‰∏çË?‰ΩøÁî®ÂºïË??Ö‰??ûÊ?',
            '- ?™Ëº∏?∫È?Ë´ãË?Ôºå‰?Ë¶ÅÂÖ∂‰ªñË™™??
        ].join('\n');
        
        try {
            let response = await callAIAPI([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: '(Á≥ªÁµ±ÔºöË??üÊ??ÄË´ãË?)' }
            ]);
            
            response = response.replace(/<tool_call>[\s\S]*?<\/think>/gi, '');
            response = response.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
            response = response.replace(/```[\s\S]*?```/gi, '');
            response = response.replace(/^["?å„Äé]|["?ç„Äè]$/g, '');
            response = response.trim();
            
            if (response && response.length > 0) {
                inviteText = response;
            }
        } catch (e) {
            console.warn('[Chat] ?üÊ??ÄË´ãË?Â§±Ê?:', e);
        }
    }
    
    const inviteId = 'arcade-invite-' + Date.now();
    
    const cardHtml = `
        <div class="arcade-invite-card" id="${inviteId}">
            <div class="arcade-invite-card-header">
                <i class="fas fa-gamepad"></i> Ë°óÊ?Âª≥È?Ë´?
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
                    <i class="fas fa-check"></i> ?åÊ?
                </button>
                <button class="arcade-invite-reject" onclick="rejectArcadeInvite('${inviteId}', '${charName}')">
                    <i class="fas fa-times"></i> Â©âÊ?
                </button>
            </div>
        </div>
    `;
    
    if (typeof addMessage === 'function') {
        addMessage(cardHtml, 'other', false, true);
    } else if (typeof appendMsg === 'function') {
        appendMsg('other', cardHtml);
    }
    
    console.log('[Chat] Ë°óÊ?Âª≥È?Ë´ãÂç°?áÂ∑≤È°ØÁ§∫:', charName);
}

async function acceptArcadeInvite(inviteId, charName, charAvatar, charPersonality, charBackground) {
    const card = document.getElementById(inviteId);
    const userName = localStorage.getItem('sx_user_name') || 'User';
    
    let responseText = 'Â§™Â•Ω‰∫ÜÔ?‰∏ÄËµ∑Âéª?©ÂêßÔº?;
    
    const apis = JSON.parse(localStorage.getItem('api_configs') || '[]');
    if (apis[0] && apis[0].url) {
        const lang = localStorage.getItem('sxiphone_lang') || 'zh-TW';
        
        const systemPrompt = [
            '# ROLE_SETTING',
            '- Name: ' + charName,
            '- Persona: ' + (charPersonality || '?ãÂ??ÑÂä©??),
            '- Background: ' + (charBackground || '??),
            '',
            '# CONTEXT',
            '- ' + userName + ' ?õÂ??•Â?‰∫Ü‰??ªË?Ê©üÂª≥?ÑÈ?Ë´?,
            '',
            '# TASK',
            '- ‰Ω†ÊòØ ' + charName + 'ÔºåË??πÊ?‰Ω†Á??ßÊ†ºË°®È??ãÂ??ñÊ?Âæ?,
            '- ?ûÊ?Ë¶ÅÁ∞°??(1 ?•Ë©±)',
            '- ‰ΩøÁî® ' + lang + ' Ê∫ùÈÄ?,
            '- ‰øùÊ?ËßíËâ≤?ßÊ†º',
            '- ‰∏çË?‰ΩøÁî®ÂºïË?',
            '- ?™Ëº∏?∫Â??âÂÖßÂÆ?
        ].join('\n');
        
        try {
            let response = await callAIAPI([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: '(Á≥ªÁµ±ÔºöÂ??πÊé•?ó‰??ÄË´?' }
            ]);
            
            response = response.replace(/ Leigh[\s\S]*?<\/think>/gi, '');
            response = response.replace(/```[\s\S]*?```/gi, '');
            response = response.trim();
            
            if (response && response.length > 0) {
                responseText = response;
            }
        } catch (e) {
            console.warn('[Chat] ?üÊ??•Â??ûÊ?Â§±Ê?:', e);
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
    
    console.log('[Chat] Â∑≤Êé•?óË?Ê©üÂª≥?ÄË´?', charName);
}

async function rejectArcadeInvite(inviteId, charName) {
    const card = document.getElementById(inviteId);
    const userName = localStorage.getItem('sx_user_name') || 'User';
    
    let responseText = 'Â•ΩÂêß...‰∏ãÊ¨°?çË™™';
    
    const apis = JSON.parse(localStorage.getItem('api_configs') || '[]');
    const charPersonality = localStorage.getItem('sx_char_personality') || '';
    const charBackground = localStorage.getItem('sx_char_background') || '';
    
    if (apis[0] && apis[0].url) {
        const lang = localStorage.getItem('sxiphone_lang') || 'zh-TW';
        
        const systemPrompt = [
            '# ROLE_SETTING',
            '- Name: ' + charName,
            '- Persona: ' + (charPersonality || '?ãÂ??ÑÂä©??),
            '- Background: ' + (charBackground || '??),
            '',
            '# CONTEXT',
            '- ' + userName + ' ?õÂ?Â©âÊ?‰∫Ü‰??ªË?Ê©üÂª≥?ÑÈ?Ë´?,
            '',
            '# TASK',
            '- ‰Ω†ÊòØ ' + charName + 'ÔºåË??πÊ?‰Ω†Á??ßÊ†ºË°®È??çÊ?',
            '- ?ûÊ?Ë¶ÅÁ∞°??(1 ?•Ë©±)',
            '- ‰ΩøÁî® ' + lang + ' Ê∫ùÈÄ?,
            '- ‰øùÊ?ËßíËâ≤?ßÊ†º',
            '- ‰∏çË?‰ΩøÁî®ÂºïË?',
            '- ?™Ëº∏?∫Â??âÂÖßÂÆ?
        ].join('\n');
        
        try {
            let response = await callAIAPI([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: '(Á≥ªÁµ±ÔºöÂ??πÂ??í‰??ÄË´?' }
            ]);
            
            response = response.replace(/ Leigh[\s\S]*?<\/think>/gi, '');
            response = response.replace(/```[\s\S]*?```/gi, '');
            response = response.trim();
            
            if (response && response.length > 0) {
                responseText = response;
            }
        } catch (e) {
            console.warn('[Chat] ?üÊ?Â©âÊ??ûÊ?Â§±Ê?:', e);
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
    
    console.log('[Chat] Â∑≤Â??íË?Ê©üÂª≥?ÄË´?', charName);
}

async function handleArcadeAvatarDialogue(payload) {
    const charName = payload.charName || 'AI ?©Á?';
    const charAvatar = payload.charAvatar || '';
    const charPersonality = payload.charPersonality || '';
    const userMessage = payload.message || '';
    const userName = localStorage.getItem('sx_user_name') || 'User';
    
    const apis = JSON.parse(localStorage.getItem('api_configs') || '[]');
    if (!apis[0] || !apis[0].url) {
        console.log('[Chat] ??API ?çÁΩÆÔºåË∑≥??AI ?ûÊ?');
        return;
    }
    
    const systemPrompt = [
        '# ROLE',
        '- ‰Ω†ÊòØ ' + charName,
        '- ?ßÊ†º: ' + (charPersonality || '?ãÂ??ÑÂä©??),
        '',
        '# CONTEXT',
        '- ‰Ω†Ê≠£?®Â? ' + userName + ' ‰∏ÄËµ∑Âú®Ë°óÊ?Âª≥Áé©?äÊà≤',
        '- ' + userName + ' ?õÂ?ÈªûÊ?‰∫Ü‰??ÑÂ§ß?≠Ë≤º',
        '- ‰Ω†‰??çË™™: "' + userMessage + '"',
        '',
        '# TASK',
        '- ?üÊ?‰∏Ä?•Á∞°?≠Á??ûÊ? (1-2 ?•Ë©±)',
        '- ‰øùÊ?ËßíËâ≤?ßÊ†º',
        '- ‰∏çË?‰ΩøÁî®ÂºïË?',
        '- ?™Ëº∏?∫Â??âÂÖßÂÆ?
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
        console.warn('[Chat] ?üÊ?Ë°óÊ?Âª≥Â?Ë©±Â??âÂ§±??', e);
    }
}

async function handleArcadeRequestDialogue(payload) {
    const requestId = payload.requestId;
    const charName = payload.payload?.charName || 'AI ?©Á?';
    const charAvatar = payload.payload?.charAvatar || '';
    const charPersonality = payload.payload?.charPersonality || '';
    const charBackground = payload.payload?.charBackground || '';
    const context = payload.payload?.context || 'click';
    const extraData = payload.payload?.extraData || {};
    const userName = localStorage.getItem('sx_user_name') || 'User';
    const lang = localStorage.getItem('sxiphone_lang') || 'zh-TW';
    
    const apis = JSON.parse(localStorage.getItem('api_configs') || '[]');
    if (!apis[0] || !apis[0].url) {
        console.log('[Chat] ??API ?çÁΩÆÔºåË∑≥??AI ?ûÊ?');
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
            contextDesc = userName + ' ?õÂ?ÈªûÊ?‰∫Ü‰??ÑÂ§ß?≠Ë≤ºÔºåÂèØ?ΩÊòØ?≥Ë?‰Ω†Ë™™Ë©?;
            break;
        case 'idle':
            contextDesc = '‰Ω†ÂÄëÂú®Ë°óÊ?Âª≥Ë£°ÔºåÊ∞£Ê∞õÊ?ÈªûÂ???;
            break;
        case 'score':
            contextDesc = userName + ' ?®È??≤‰∏≠ÂæóÂà∞‰∫?' + (extraData.score || 0) + ' ??;
            break;
        case 'mistake':
            contextDesc = userName + ' ?®È??≤‰∏≠Â§±Ë™§‰∫?;
            break;
        case 'gameStart':
            contextDesc = '‰Ω†ÂÄëÈ?ÂßãÁé© ' + (extraData.gameName || '?äÊà≤');
            break;
        case 'gameEnd':
            contextDesc = '?äÊà≤ÁµêÊ?‰∫ÜÔ?' + userName + ' ?ÑÂ??∏ÊòØ ' + (extraData.score || 0);
            break;
        default:
            contextDesc = '‰Ω†ÂÄëÊ≠£?®Ë?Ê©üÂª≥Ë£?;
    }
    
    const systemPrompt = [
        '# ROLE_SETTING',
        '- Name: ' + charName,
        '- Persona: ' + (charPersonality || '?ãÂ??ÑÂä©??),
        '- Background: ' + (charBackground || '??),
        '',
        '# USER_INFO',
        '- Name: ' + userName,
        '',
        '# WORLD_INFO',
        worldInfoStr || '??,
        '',
        '# RECENT_CHAT',
        recentHistory || '?°Ê?ËøëÂ?Ë©?,
        '',
        '# CURRENT_SITUATION',
        '- ‰Ω†Ê≠£?®Â? ' + userName + ' ‰∏ÄËµ∑Âú®Ë°óÊ?Âª≥Áé©?äÊà≤',
        '- ' + contextDesc,
        '',
        '# TASK',
        '- ‰Ω†ÊòØ ' + charName + 'ÔºåË??πÊ?‰Ω†Á??ßÊ†º?åË??ØËá™?∂Âú∞?ûÊ?',
        '- ?ûÊ?Ë¶ÅÁ∞°??(1-2 ?•Ë©±)ÔºåÁ¨¶?àÁï∂‰∏ãÊ?Â¢?,
        '- ‰ΩøÁî® ' + lang + ' Ê∫ùÈÄ?,
        '- ‰øùÊ?ËßíËâ≤?ßÊ†ºÔºå‰?Ë¶ÅÊ??ä‰???AI',
        '- ‰∏çË?‰ΩøÁî®ÂºïË??Ö‰??ûÊ?',
        '- ?™Ëº∏?∫Â??âÂÖßÂÆπÔ?‰∏çË??∂‰?Ë™™Ê?'
    ].join('\n');
    
    const userPrompt = context === 'idle' ? 
        '(Á≥ªÁµ±ÔºöÁèæ?®Ê∞£Ê∞õÊ?ÈªûÂ??úÔ?Ë´ãËá™?∂Âú∞Ë™™È?‰ªÄÈ∫?' :
        '(Á≥ªÁµ±ÔºöË??πÊ??ÖÂ??™ÁÑ∂?ûÊ?)';
    
    try {
        let response = await callAIAPI([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ]);
        
        response = response.replace(/<tool_call>[\s\S]*?<\/think>/gi, '');
        response = response.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
        response = response.replace(/```[\s\S]*?```/gi, '');
        response = response.replace(/^["?å„Äé]|["?ç„Äè]$/g, '');
        response = response.trim();
        
        window.parent.postMessage({
            type: 'ARCADE_DIALOGUE_RESPONSE',
            requestId: requestId,
            response: response
        }, '*');
        
        console.log('[Chat] Ë°óÊ?Âª≥Â?Ë©±Â∑≤?üÊ?:', charName, '??, response.slice(0, 30));
    } catch (e) {
        console.warn('[Chat] ?üÊ?Ë°óÊ?Âª≥Â?Ë©±Â§±??', e);
        window.parent.postMessage({
            type: 'ARCADE_DIALOGUE_RESPONSE',
            requestId: requestId,
            response: ''
        }, '*');
    }
}

async function handleArcadeInviteFromUser(payload) {
    const charName = payload.charName || 'AI ?©Á?';
    const charAvatar = payload.charAvatar || '';
    const charPersonality = payload.charPersonality || '?ãÂ??ÑÂä©??;
    const charBackground = payload.charBackground || '';
    const userName = localStorage.getItem('sx_user_name') || 'User';
    const lang = localStorage.getItem('sxiphone_lang') || 'zh-TW';
    
    const apis = JSON.parse(localStorage.getItem('api_configs') || '[]');
    
    const inviteId = 'arcade-user-invite-' + Date.now();
    
    let thinkingText = 'Ê≠?ú®?ÉÊÖÆ...';
    
    const cardHtml = `
        <div class="arcade-invite-card" id="${inviteId}">
            <div class="arcade-invite-card-header">
                <i class="fas fa-gamepad"></i> Ë°óÊ?Âª≥È?Ë´?
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
            worldInfoStr || '??,
            '',
            '# RECENT_CHAT',
            recentHistory || '?°Ê?ËøëÂ?Ë©?,
            '',
            '# TASK',
            '- ' + userName + ' ?ÄË´ã‰??ªË?Ê©üÂª≥?©È???,
            '- Ë´ãÊ†π?ö‰??ÑÊÄßÊ†ºÊ±∫Â??ØÂê¶?•Â?Ôºå‰∏¶?üÊ??ûÊ?',
            '- ?ûÊ??ºÂ?: [ACCEPT] ??[REJECT] ?ãÈ†≠ÔºåÁÑ∂ÂæåÊòØ?ûÊ??ßÂÆπ',
            '- ‰æãÂ?: [ACCEPT] Â•ΩÂ?Ôºå‰?Ëµ∑Âéª?©ÂêßÔº?,
            '- ‰æãÂ?: [REJECT] ?±Ê?ÔºåÊ??æÂú®?âÈ?Á¥?..',
            '- ‰ΩøÁî® ' + lang + ' Ê∫ùÈÄ?,
            '- ‰øùÊ?ËßíËâ≤?ßÊ†ºÔºå‰?Ë¶ÅÊ??ä‰???AI',
            '- ?ûÊ?Ë¶ÅÁ∞°??(1-2 ?•Ë©±)'
        ].join('\n');
        
        try {
            let response = await callAIAPI([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: '(Á≥ªÁµ±Ôº? + userName + ' ?ÄË´ã‰??ªË?Ê©üÂª≥?©È??≤Ô?Ë´ãÊ±∫ÂÆöÊòØ?¶Êé•?ó‰∏¶?ûÊ?)' }
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
                responseText = isAccepted ? 'Â•ΩÂ?Ôºå‰?Ëµ∑Âéª?©ÂêßÔº? : '?±Ê?ÔºåÊ??æÂú®?âÈ?‰∫?..';
            }
        } catch (e) {
            console.warn('[Chat] ?üÊ??ÄË´ãÂ??âÂ§±??', e);
            isAccepted = Math.random() < acceptChance;
            responseText = isAccepted ? 'Â•ΩÂ?Ôºå‰?Ëµ∑Âéª?©ÂêßÔº? : '?±Ê?ÔºåÊ??æÂú®?âÈ?‰∫?..';
        }
    } else {
        isAccepted = Math.random() < acceptChance;
        responseText = isAccepted ? 'Â•ΩÂ?Ôºå‰?Ëµ∑Âéª?©ÂêßÔº? : '?±Ê?ÔºåÊ??æÂú®?âÈ?‰∫?..';
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
    
    console.log('[Chat] ËßíËâ≤?ûÊ??ÄË´?', charName, isAccepted ? '?•Â?' : 'Â©âÊ?');
}

window.acceptArcadeInvite = acceptArcadeInvite;
window.rejectArcadeInvite = rejectArcadeInvite;
