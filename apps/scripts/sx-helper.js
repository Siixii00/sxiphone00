let _storage = null;
let _initPromise = null;
let _cache = new Map();

async function initStorage() {
    if (_storage) return _storage;
    if (_initPromise) return _initPromise;
    
    _initPromise = (async () => {
        if (typeof sxStorage !== 'undefined') {
            await sxStorage.init();
            _storage = sxStorage;
            console.log('[SxHelper] sxStorage 初始化完成');
            return _storage;
        }
        
        if (typeof SXStorage !== 'undefined') {
            _storage = new SXStorage();
            await _storage.init();
            console.log('[SxHelper] SXStorage 初始化完成');
            return _storage;
        }
        
        console.error('[SxHelper] 無可用的 IndexedDB 儲存');
        return null;
    })();
    
    return _initPromise;
}

async function sxSetItem(key, value) {
    const storage = await initStorage();
    if (!storage) {
        console.error('[SxHelper] 儲存不可用，無法寫入:', key);
        return false;
    }
    
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    _cache.set(key, stringValue);
    
    try {
        await storage.setItem(key, stringValue);
        return true;
    } catch (e) {
        console.error('[SxHelper] 寫入失敗:', key, e);
        return false;
    }
}

async function sxGetItem(key) {
    const cached = _cache.get(key);
    if (cached !== undefined) return cached;
    
    const storage = await initStorage();
    if (!storage) {
        console.error('[SxHelper] 儲存不可用，無法讀取:', key);
        return null;
    }
    
    try {
        const value = await storage.getItem(key);
        if (value !== null) {
            _cache.set(key, value);
        }
        return value;
    } catch (e) {
        console.error('[SxHelper] 讀取失敗:', key, e);
        return null;
    }
}

async function sxGetJSON(key) {
    const value = await sxGetItem(key);
    if (value === null) return null;
    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
}

async function sxSetJSON(key, value) {
    return sxSetItem(key, JSON.stringify(value));
}

async function sxRemoveItem(key) {
    _cache.delete(key);
    
    const storage = await initStorage();
    if (!storage) return false;
    
    try {
        await storage.removeItem(key);
        return true;
    } catch (e) {
        console.error('[SxHelper] 刪除失敗:', key, e);
        return false;
    }
}

async function sxGetAllCharacters() {
    const storage = await initStorage();
    if (!storage || typeof storage.getAllCharacters !== 'function') {
        return [];
    }
    
    try {
        return await storage.getAllCharacters() || [];
    } catch (e) {
        console.error('[SxHelper] 讀取角色失敗:', e);
        return [];
    }
}

async function sxSaveCharacter(char) {
    const storage = await initStorage();
    if (!storage || typeof storage.saveCharacter !== 'function') {
        return false;
    }
    
    try {
        await storage.saveCharacter(char);
        return true;
    } catch (e) {
        console.error('[SxHelper] 儲存角色失敗:', e);
        return false;
    }
}

async function sxDeleteCharacter(id) {
    const storage = await initStorage();
    if (!storage || typeof storage.deleteCharacter !== 'function') {
        return false;
    }
    
    try {
        await storage.deleteCharacter(id);
        return true;
    } catch (e) {
        console.error('[SxHelper] 刪除角色失敗:', e);
        return false;
    }
}

async function sxGetAllUsers() {
    const users = await sxGetJSON('sx_users');
    return Array.isArray(users) ? users : [];
}

async function sxSaveUsers(users) {
    return sxSetJSON('sx_users', users);
}

async function sxGetAllChatSessions() {
    const storage = await initStorage();
    if (!storage || typeof storage.getAllChatSessions !== 'function') {
        const sessions = await sxGetJSON('sx_chat_sessions');
        return Array.isArray(sessions) ? sessions : [];
    }
    
    try {
        return await storage.getAllChatSessions() || [];
    } catch (e) {
        console.error('[SxHelper] 讀取聊天 sessions 失敗:', e);
        return [];
    }
}

async function sxSaveChatSession(session) {
    const storage = await initStorage();
    if (!storage || typeof storage.saveChatSession !== 'function') {
        return false;
    }
    
    try {
        await storage.saveChatSession(session);
        return true;
    } catch (e) {
        console.error('[SxHelper] 儲存聊天 session 失敗:', e);
        return false;
    }
}

async function sxDeleteChatSession(id) {
    const storage = await initStorage();
    if (!storage || typeof storage.deleteChatSession !== 'function') {
        return false;
    }
    
    try {
        await storage.deleteChatSession(id);
        return true;
    } catch (e) {
        console.error('[SxHelper] 刪除聊天 session 失敗:', e);
        return false;
    }
}

function sxClearCache() {
    _cache.clear();
}

if (typeof window !== 'undefined') {
    window.sxSetItem = sxSetItem;
    window.sxGetItem = sxGetItem;
    window.sxGetJSON = sxGetJSON;
    window.sxSetJSON = sxSetJSON;
    window.sxRemoveItem = sxRemoveItem;
    window.sxGetAllCharacters = sxGetAllCharacters;
    window.sxSaveCharacter = sxSaveCharacter;
    window.sxDeleteCharacter = sxDeleteCharacter;
    window.sxGetAllUsers = sxGetAllUsers;
    window.sxSaveUsers = sxSaveUsers;
    window.sxGetAllChatSessions = sxGetAllChatSessions;
    window.sxSaveChatSession = sxSaveChatSession;
    window.sxDeleteChatSession = sxDeleteChatSession;
    window.sxClearCache = sxClearCache;
    window.initStorage = initStorage;
}