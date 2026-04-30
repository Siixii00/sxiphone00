const STORAGE_KEY = 'sx_pub_poc_v3';

const defaultCharacter = {
    id: 'char-default',
    name: 'Silly Assistant',
    tags: ['default', 'chat'],
    avatar: '',
    systemPrompt: '你是一位專業的角色扮演聊天助手。使用繁體中文回覆。'
};

const defaults = {
    characters: [defaultCharacter],
    activeCharacterId: defaultCharacter.id,
    chats: {
        [defaultCharacter.id]: []
    },
    worldbookEntries: [],
    settings: {
        provider: 'openai',
        connectionMode: 'direct',
        proxyEndpoint: '',
        baseUrl: 'https://api.openai.com/v1/chat/completions',
        apiKey: '',
        model: 'gpt-4o-mini',
        generation: {
            temperature: 0.8,
            maxTokens: 512,
            maxContext: 4096
        }
    }
};

const els = {
    pubBack: document.getElementById('pub-back'),
    toolPanel: document.getElementById('tool-panel'),
    toggleSettings: document.getElementById('toggle-settings'),
    chatLog: document.getElementById('chat-log'),
    composer: document.getElementById('composer-input'),
    sendBtn: document.getElementById('send-btn'),
    regenBtn: document.getElementById('regen-btn'),
    regenBtnIcon: document.getElementById('regen-btn-icon'),
    addCharacter: document.getElementById('add-character'),

    charName: document.getElementById('char-name'),
    charTags: document.getElementById('char-tags'),
    charAvatar: document.getElementById('char-avatar'),
    charPrompt: document.getElementById('character-prompt'),
    saveCharacterPrompt: document.getElementById('save-character-prompt'),

    characterList: document.getElementById('character-list'),
    newCharacter: document.getElementById('new-character'),
    deleteCharacter: document.getElementById('delete-character'),
    exportCharacters: document.getElementById('export-characters'),
    importCharacters: document.getElementById('import-characters'),
    characterFile: document.getElementById('character-file'),

    wbKeyword: document.getElementById('wb-keyword'),
    wbContent: document.getElementById('wb-content'),
    addWorldbookEntry: document.getElementById('add-worldbook-entry'),
    worldbookList: document.getElementById('worldbook-list'),

    apiProvider: document.getElementById('api-provider'),
    connectionMode: document.getElementById('connection-mode'),
    proxyEndpoint: document.getElementById('proxy-endpoint'),
    apiBase: document.getElementById('api-base'),
    apiKey: document.getElementById('api-key'),
    modelName: document.getElementById('model-name'),
    saveApiConfig: document.getElementById('save-api-config'),

    genTemperature: document.getElementById('gen-temperature'),
    genTemperatureVal: document.getElementById('gen-temperature-val'),
    genMaxTokens: document.getElementById('gen-max-tokens'),
    genMaxTokensVal: document.getElementById('gen-max-tokens-val'),
    genMaxContext: document.getElementById('gen-max-context'),
    genMaxContextVal: document.getElementById('gen-max-context-val'),

    activeModel: document.getElementById('active-model'),
    connState: document.getElementById('conn-state'),

    clearChat: document.getElementById('clear-chat'),
    exportChat: document.getElementById('export-chat'),
    importChat: document.getElementById('import-chat'),
    chatFile: document.getElementById('chat-file')
};

const state = structuredClone(defaults);

function uid(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function getActiveCharacter() {
    return state.characters.find((c) => c.id === state.activeCharacterId) || state.characters[0];
}

function ensureActiveChat() {
    const char = getActiveCharacter();
    if (!char) return;
    if (!Array.isArray(state.chats[char.id])) state.chats[char.id] = [];
}

function getActiveMessages() {
    ensureActiveChat();
    const char = getActiveCharacter();
    return char ? state.chats[char.id] : [];
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function migrateLegacy(parsed) {
    if (parsed.character && Array.isArray(parsed.messages)) {
        const char = {
            id: uid('char'),
            name: parsed.character.name || 'Imported Character',
            tags: Array.isArray(parsed.character.tags) ? parsed.character.tags : ['imported'],
            avatar: parsed.character.avatar || '',
            systemPrompt: parsed.character.systemPrompt || ''
        };
        state.characters = [char];
        state.activeCharacterId = char.id;
        state.chats = { [char.id]: parsed.messages };
        state.settings = { ...state.settings, ...(parsed.settings || {}) };
        return true;
    }
    return false;
}

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);

        if (migrateLegacy(parsed)) {
            saveState();
            return;
        }

        state.characters = Array.isArray(parsed.characters) && parsed.characters.length
            ? parsed.characters
            : structuredClone(defaults.characters);
        state.activeCharacterId = parsed.activeCharacterId || state.characters[0].id;
        state.chats = parsed.chats && typeof parsed.chats === 'object' ? parsed.chats : {};
        state.worldbookEntries = Array.isArray(parsed.worldbookEntries) ? parsed.worldbookEntries : [];
        state.settings = {
            ...defaults.settings,
            ...(parsed.settings || {}),
            generation: {
                ...defaults.settings.generation,
                ...(parsed.settings?.generation || {})
            }
        };

        if (!state.characters.find((c) => c.id === state.activeCharacterId)) {
            state.activeCharacterId = state.characters[0].id;
        }

        ensureActiveChat();
    } catch {
        // ignore corrupted data
    }
}

function renderWorldbookEntries() {
    if (!els.worldbookList) return;
    els.worldbookList.innerHTML = '';

    if (!state.worldbookEntries.length) {
        const empty = document.createElement('div');
        empty.className = 'worldbook-item';
        empty.style.opacity = '0.7';
        empty.textContent = '尚無條目';
        els.worldbookList.appendChild(empty);
        return;
    }

    state.worldbookEntries.forEach((entry, index) => {
        const item = document.createElement('div');
        item.className = 'worldbook-item';
        item.innerHTML = `
            <div class="worldbook-item-head">
                <strong>${(entry.keywords || []).join(', ')}</strong>
                <button type="button" class="worldbook-delete" data-index="${index}">刪除</button>
            </div>
            <div>${entry.content}</div>
        `;
        item.querySelector('.worldbook-delete')?.addEventListener('click', () => {
            state.worldbookEntries.splice(index, 1);
            saveState();
            renderWorldbookEntries();
        });
        els.worldbookList.appendChild(item);
    });
}

function getWorldbookContext() {
    if (!state.worldbookEntries.length) return '';
    const activeMessages = getActiveMessages();
    const recentText = activeMessages.slice(-6).map((m) => m.content).join('\n').toLowerCase();
    const hits = [];

    state.worldbookEntries.forEach((entry) => {
        const keywords = Array.isArray(entry.keywords) ? entry.keywords : [];
        if (!keywords.length || !entry.content) return;
        const matched = keywords.some((kw) => recentText.includes(String(kw).toLowerCase()));
        if (matched) hits.push(entry.content);
    });

    if (!hits.length) return '';
    return `World Info:\n${hits.join('\n\n')}`;
}

function setAppVh() {
    const vh = (window.visualViewport?.height || window.innerHeight) * 0.01;
    document.documentElement.style.setProperty('--app-vh', `${vh}px`);
}

function renderCharacterList() {
    if (!els.characterList) return;
    const active = getActiveCharacter();
    els.characterList.innerHTML = '';

    state.characters.forEach((char) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `character-item${active && active.id === char.id ? ' active' : ''}`;
        btn.textContent = `${char.name} · ${(char.tags || []).join(', ')}`;
        btn.addEventListener('click', () => {
            state.activeCharacterId = char.id;
            ensureActiveChat();
            updateHeader();
            renderCharacterList();
            renderMessages();
            saveState();
        });
        els.characterList.appendChild(btn);
    });
}

function updateHeader() {
    const active = getActiveCharacter();
    if (!active) return;
    if (els.charName) els.charName.textContent = active.name;
    if (els.charTags) els.charTags.textContent = `@${(active.tags || []).join(' · ')}`;
    if (els.charAvatar && active.avatar) {
        els.charAvatar.style.backgroundImage = `url('${active.avatar}')`;
        els.charAvatar.style.backgroundSize = 'cover';
        els.charAvatar.style.backgroundPosition = 'center';
    }
    if (els.activeModel) els.activeModel.textContent = state.settings.model || '未設定模型';
    if (els.charPrompt) els.charPrompt.value = active.systemPrompt || '';
}

function setConnState(text) {
    if (els.connState) els.connState.textContent = text;
}

function renderMessages() {
    if (!els.chatLog) return;
    const messages = getActiveMessages();
    els.chatLog.innerHTML = '';
    if (!messages.length) {
        const empty = document.createElement('div');
        empty.className = 'bubble bot';
        empty.textContent = '角色已就緒，輸入第一句開始。';
        empty.style.opacity = '0.72';
        els.chatLog.appendChild(empty);
        return;
    }

    for (const msg of messages) {
        const bubble = document.createElement('div');
        bubble.className = `bubble ${msg.role === 'user' ? 'user' : 'bot'}`;
        bubble.textContent = msg.content;
        els.chatLog.appendChild(bubble);
    }
    els.chatLog.scrollTop = els.chatLog.scrollHeight;
}

function appendMessage(role, content) {
    const messages = getActiveMessages();
    messages.push({
        id: uid('msg'),
        role,
        content,
        createdAt: Date.now()
    });
    saveState();
    renderMessages();
}

function syncSettingsForm() {
    if (els.apiProvider) els.apiProvider.value = state.settings.provider;
    if (els.connectionMode) els.connectionMode.value = state.settings.connectionMode || 'direct';
    if (els.proxyEndpoint) els.proxyEndpoint.value = state.settings.proxyEndpoint || '';
    if (els.apiBase) els.apiBase.value = state.settings.baseUrl;
    if (els.apiKey) els.apiKey.value = state.settings.apiKey;
    if (els.modelName) els.modelName.value = state.settings.model;

    if (els.genTemperature) els.genTemperature.value = state.settings.generation.temperature;
    if (els.genTemperatureVal) els.genTemperatureVal.textContent = String(state.settings.generation.temperature);
    if (els.genMaxTokens) els.genMaxTokens.value = state.settings.generation.maxTokens;
    if (els.genMaxTokensVal) els.genMaxTokensVal.textContent = String(state.settings.generation.maxTokens);
    if (els.genMaxContext) els.genMaxContext.value = state.settings.generation.maxContext;
    if (els.genMaxContextVal) els.genMaxContextVal.textContent = String(state.settings.generation.maxContext);

    setConnState(state.settings.apiKey ? '已配置' : '離線');
}

function getModelPayloadMessages() {
    const active = getActiveCharacter();
    const source = getActiveMessages();
    const contextWindow = source.slice(-Math.max(4, Math.floor(state.settings.generation.maxContext / 256)));
    const messages = [];
    if (active?.systemPrompt) {
        messages.push({ role: 'system', content: active.systemPrompt });
    }
    const wbContext = getWorldbookContext();
    if (wbContext) {
        messages.push({ role: 'system', content: wbContext });
    }
    for (const msg of contextWindow) {
        messages.push({ role: msg.role === 'user' ? 'user' : 'assistant', content: msg.content });
    }
    return messages;
}

async function requestCompletion() {
    const apiType = state.settings.apiType || 'openai';
    
    // Gemini 原生 API 格式
    if (apiType === 'gemini') {
        if (!state.settings.apiKey) {
            return '尚未設定 API Key，請先於左側設定。';
        }
        
        const model = state.settings.model || 'gemini-1.5-flash';
        const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${state.settings.apiKey}`;
        
        const messages = getModelPayloadMessages();
        const contents = [];
        let systemInstruction = '';
        
        for (const msg of messages) {
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
                temperature: Number(state.settings.generation.temperature),
                maxOutputTokens: Number(state.settings.generation.maxTokens)
            }
        };
        
        if (systemInstruction) {
            geminiPayload.systemInstruction = { parts: [{ text: systemInstruction }] };
        }
        
        const res = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiPayload)
        });
        
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Gemini API ${res.status}: ${errText.slice(0, 220)}`);
        }
        
        const data = await res.json();
        if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
        return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '模型未回傳可顯示內容。';
    }
    
    // OpenAI 相容格式或自訂端點
    if (!state.settings.apiKey) {
        return '尚未設定 API Key，請先於左側設定。';
    }

    const payload = {
        model: state.settings.model,
        messages: getModelPayloadMessages(),
        temperature: Number(state.settings.generation.temperature),
        max_tokens: Number(state.settings.generation.maxTokens)
    };

    const isProxy = state.settings.connectionMode === 'proxy' && state.settings.proxyEndpoint;
    let requestUrl = isProxy ? state.settings.proxyEndpoint : state.settings.baseUrl;
    
    // 自訂端點使用完整 URL，否則自動加上 /chat/completions
    if (apiType !== 'custom' && !isProxy) {
        requestUrl = requestUrl.endsWith('/chat/completions')
            ? requestUrl
            : requestUrl.replace(/\/$/, '') + '/chat/completions';
    }
    
    const requestBody = isProxy
        ? {
            target: state.settings.baseUrl,
            payload,
            apiKey: state.settings.apiKey
        }
        : payload;

    const headers = {
        'Content-Type': 'application/json'
    };

    if (!isProxy) {
        headers.Authorization = `Bearer ${state.settings.apiKey}`;
    }

    const res = await fetch(requestUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API ${res.status}: ${errText.slice(0, 220)}`);
    }

    const data = await res.json();
    const source = data?.choices ? data : data?.result || data?.data || {};
    return source?.choices?.[0]?.message?.content?.trim() || '模型未回傳可顯示內容。';
}

async function sendMessage() {
    const text = els.composer?.value.trim();
    if (!text) return;

    appendMessage('user', text);
    if (els.composer) els.composer.value = '';

    if (els.sendBtn) els.sendBtn.disabled = true;
    setConnState('連線中...');

    try {
        const reply = await requestCompletion();
        appendMessage('bot', reply);
        setConnState('已連線');
    } catch (error) {
        appendMessage('bot', `⚠️ 回覆失敗：${error.message}`);
        setConnState('錯誤');
    } finally {
        if (els.sendBtn) els.sendBtn.disabled = false;
    }
}

async function regenLast() {
    const messages = getActiveMessages();
    if (!messages.some((m) => m.role === 'user')) {
        appendMessage('bot', '沒有可重寫的使用者訊息。');
        return;
    }
    if (els.sendBtn) els.sendBtn.disabled = true;
    setConnState('重寫中...');
    try {
        const reply = await requestCompletion();
        appendMessage('bot', reply);
        setConnState('已連線');
    } catch (error) {
        appendMessage('bot', `⚠️ 重寫失敗：${error.message}`);
        setConnState('錯誤');
    } finally {
        if (els.sendBtn) els.sendBtn.disabled = false;
    }
}

function createCharacter() {
    const name = prompt('角色名稱');
    if (!name) return;
    const tagsRaw = prompt('角色標籤（逗號分隔）', 'rp, custom') || '';
    const newChar = {
        id: uid('char'),
        name: name.trim(),
        tags: tagsRaw.split(',').map((v) => v.trim()).filter(Boolean),
        avatar: '',
        systemPrompt: `你是 ${name.trim()}，請以角色口吻回覆。`
    };
    state.characters.push(newChar);
    state.activeCharacterId = newChar.id;
    state.chats[newChar.id] = [];
    saveState();
    updateHeader();
    renderCharacterList();
    renderMessages();
}

function deleteActiveCharacter() {
    if (state.characters.length <= 1) {
        appendMessage('bot', '至少要保留一個角色。');
        return;
    }
    const active = getActiveCharacter();
    if (!active) return;
    state.characters = state.characters.filter((c) => c.id !== active.id);
    delete state.chats[active.id];
    state.activeCharacterId = state.characters[0].id;
    ensureActiveChat();
    saveState();
    updateHeader();
    renderCharacterList();
    renderMessages();
}

function bindEvents() {
    els.pubBack?.addEventListener('click', () => {
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'closeApp', appId: 'pub' }, '*');
            return;
        }
        if (window.history.length > 1) {
            window.history.back();
        }
    });

    els.toggleSettings?.addEventListener('click', () => {
        els.toolPanel?.classList.toggle('open');
    });

    els.sendBtn?.addEventListener('click', sendMessage);
    els.regenBtn?.addEventListener('click', regenLast);
    els.regenBtnIcon?.addEventListener('click', regenLast);
    els.composer?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });

    els.addCharacter?.addEventListener('click', createCharacter);
    els.newCharacter?.addEventListener('click', createCharacter);
    els.deleteCharacter?.addEventListener('click', deleteActiveCharacter);

    els.exportCharacters?.addEventListener('click', () => {
        const blob = new Blob([JSON.stringify(state.characters, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'pub-characters.json';
        a.click();
        URL.revokeObjectURL(a.href);
    });

    els.importCharacters?.addEventListener('click', () => els.characterFile?.click());
    els.characterFile?.addEventListener('change', async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const text = await file.text();
        const data = JSON.parse(text);
        if (Array.isArray(data) && data.length) {
            state.characters = data.map((char, idx) => ({
                id: char.id || uid(`char-${idx}`),
                name: char.name || `Character ${idx + 1}`,
                tags: Array.isArray(char.tags) ? char.tags : ['imported'],
                avatar: char.avatar || '',
                systemPrompt: char.systemPrompt || ''
            }));
            if (!state.characters.find((c) => c.id === state.activeCharacterId)) {
                state.activeCharacterId = state.characters[0].id;
            }
            state.characters.forEach((char) => {
                if (!Array.isArray(state.chats[char.id])) state.chats[char.id] = [];
            });
            saveState();
            updateHeader();
            renderCharacterList();
            renderMessages();
        }
        event.target.value = '';
    });

    els.saveCharacterPrompt?.addEventListener('click', () => {
        const active = getActiveCharacter();
        if (!active) return;
        active.systemPrompt = (els.charPrompt?.value || '').trim();
        saveState();
    });

    els.saveApiConfig?.addEventListener('click', () => {
        state.settings.provider = els.apiProvider?.value || 'openai';
        state.settings.connectionMode = els.connectionMode?.value || 'direct';
        state.settings.proxyEndpoint = (els.proxyEndpoint?.value || '').trim();
        state.settings.baseUrl = (els.apiBase?.value || '').trim() || defaults.settings.baseUrl;
        state.settings.apiKey = (els.apiKey?.value || '').trim();
        state.settings.model = (els.modelName?.value || '').trim() || defaults.settings.model;
        saveState();
        updateHeader();
        setConnState(state.settings.apiKey ? '已配置' : '離線');
    });

    const bindRange = (inputEl, valueEl, key) => {
        inputEl?.addEventListener('input', () => {
            const num = Number(inputEl.value);
            state.settings.generation[key] = num;
            if (valueEl) valueEl.textContent = String(num);
            saveState();
        });
    };

    bindRange(els.genTemperature, els.genTemperatureVal, 'temperature');
    bindRange(els.genMaxTokens, els.genMaxTokensVal, 'maxTokens');
    bindRange(els.genMaxContext, els.genMaxContextVal, 'maxContext');

    els.addWorldbookEntry?.addEventListener('click', () => {
        const keywordRaw = (els.wbKeyword?.value || '').trim();
        const content = (els.wbContent?.value || '').trim();
        if (!keywordRaw || !content) return;
        state.worldbookEntries.push({
            id: uid('wb'),
            keywords: keywordRaw.split(',').map((v) => v.trim()).filter(Boolean),
            content
        });
        if (els.wbKeyword) els.wbKeyword.value = '';
        if (els.wbContent) els.wbContent.value = '';
        saveState();
        renderWorldbookEntries();
    });

    els.clearChat?.addEventListener('click', () => {
        const active = getActiveCharacter();
        if (!active) return;
        state.chats[active.id] = [];
        saveState();
        renderMessages();
    });

    els.exportChat?.addEventListener('click', () => {
        const active = getActiveCharacter();
        if (!active) return;
        const blob = new Blob([JSON.stringify(getActiveMessages(), null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `pub-chat-${active.id}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
    });

    els.importChat?.addEventListener('click', () => els.chatFile?.click());
    els.chatFile?.addEventListener('change', async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const text = await file.text();
        const data = JSON.parse(text);
        if (Array.isArray(data)) {
            const active = getActiveCharacter();
            if (!active) return;
            state.chats[active.id] = data;
            saveState();
            renderMessages();
        }
        event.target.value = '';
    });

    window.addEventListener('resize', setAppVh);
    window.visualViewport?.addEventListener('resize', setAppVh);
}

function init() {
    loadState();
    loadSettingsFromSxSettings();
    setAppVh();
    ensureActiveChat();
    updateHeader();
    renderCharacterList();
    renderWorldbookEntries();
    syncSettingsForm();
    renderMessages();
    bindEvents();
}

function loadSettingsFromSxSettings() {
    if (typeof SxSettings === 'undefined') return;
    
    const settings = SxSettings.getSettingsSnapshot();
    
    if (settings.apis && settings.apis.length > 0) {
        const activeApi = settings.activeApi;
        if (activeApi) {
            state.settings.baseUrl = activeApi.url || state.settings.baseUrl;
            state.settings.apiKey = activeApi.key || state.settings.apiKey;
            state.settings.model = activeApi.model || state.settings.model;
            state.settings.apiType = activeApi.type || 'openai';
            console.log('[pub] Loaded API config from settings:', activeApi.name || 'default', 'type:', activeApi.type);
        }
    }
    
    if (settings.characters && settings.characters.length > 0) {
        const existingIds = new Set(state.characters.map(c => c.id));
        settings.characters.forEach(char => {
            if (!existingIds.has(`char-${char.name}`)) {
                state.characters.push({
                    id: `char-${char.name}`,
                    name: char.name,
                    tags: ['imported', 'character'],
                    avatar: char.avatar || '',
                    systemPrompt: char.personality || char.persona || ''
                });
            }
        });
        console.log('[pub] Imported characters from settings:', settings.characters.length);
    }
    
    if (settings.worldbook && settings.worldbook.global && settings.worldbook.global.length > 0) {
        settings.worldbook.global.forEach(entry => {
            if (entry.keywords && entry.content) {
                state.worldbookEntries.push({
                    keywords: Array.isArray(entry.keywords) ? entry.keywords : [entry.keywords],
                    content: entry.content
                });
            }
        });
        console.log('[pub] Imported worldbook from settings');
    }
    
    saveState();
}

document.addEventListener('DOMContentLoaded', init);
