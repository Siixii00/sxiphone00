// Wiki 資料測試腳本
// 在瀏覽器 Console 中執行此腳本來檢查資料狀況

async function testWikiData() {
    console.log('=== Wiki 資料測試開始 ===');
    
    // 1. 檢查 localStorage 資料
    console.log('\n--- localStorage 檢查 ---');
    const localStorageKeys = [
        'sx_characters',
        'sx_users',
        'sx_npcs',
        'sx_chat_history',
        'sx_chat_sessions',
        'sx_char_name',
        'sx_char_avatar',
        'sx_char_personality',
        'sx_char_background',
        'sx_user_name',
        'sx_user_avatar',
        'sx_user_personality',
        'sx_user_background'
    ];
    
    for (const key of localStorageKeys) {
        const value = localStorage.getItem(key);
        if (value) {
            try {
                const parsed = JSON.parse(value);
                console.log(`${key}:`, Array.isArray(parsed) ? `${parsed.length} 個項目` : parsed);
            } catch (e) {
                console.log(`${key}:`, value.substring(0, 100));
            }
        } else {
            console.log(`${key}: (不存在)`);
        }
    }
    
    // 2. 檢查 IndexedDB - chatHistory store
    console.log('\n--- IndexedDB chatHistory store 檢查 ---');
    if (typeof localforage !== 'undefined') {
        try {
            const historyStore = localforage.createInstance({
                name: 'sxiphone',
                storeName: 'chatHistory'
            });
            const chatHistory = await historyStore.getItem('sx_chat_history');
            console.log('sx_chat_history:', chatHistory ? `${chatHistory.length} 條` : '(不存在)');
            if (chatHistory && chatHistory.length > 0) {
                console.log('第一條聊天:', chatHistory[0]);
                console.log('最後一條聊天:', chatHistory[chatHistory.length - 1]);
            }
        } catch (e) {
            console.log('chatHistory store 錯誤:', e.message);
        }
        
        // 3. 檢查 IndexedDB - chatData store
        console.log('\n--- IndexedDB chatData store 檢查 ---');
        try {
            const chatDataStore = localforage.createInstance({
                name: 'sxiphone',
                storeName: 'chatData'
            });
            const persistedData = await chatDataStore.getItem('sx_app_persisted_data');
            if (persistedData) {
                console.log('sx_app_persisted_data 存在');
                console.log('sx_chat_sessions:', persistedData.sx_chat_sessions ? `${persistedData.sx_chat_sessions.length} 個 session` : '(不存在)');
                console.log('sx_characters:', persistedData.sx_characters ? `${persistedData.sx_characters.length} 個角色` : '(不存在)');
                console.log('sx_users:', persistedData.sx_users ? `${persistedData.sx_users.length} 個用戶` : '(不存在)');
                console.log('sx_npcs:', persistedData.sx_npcs ? `${persistedData.sx_npcs.length} 個 NPC` : '(不存在)');
                
                if (persistedData.sx_chat_sessions && persistedData.sx_chat_sessions.length > 0) {
                    const firstSession = persistedData.sx_chat_sessions[0];
                    console.log('第一個 session:', {
                        id: firstSession.id,
                        charName: firstSession.charName,
                        historyLength: firstSession.history ? firstSession.history.length : 0
                    });
                    if (firstSession.history && firstSession.history.length > 0) {
                        console.log('第一個 session 第一條消息:', firstSession.history[0]);
                    }
                }
                
                if (persistedData.sx_characters && persistedData.sx_characters.length > 0) {
                    console.log('第一個角色:', persistedData.sx_characters[0]);
                }
            } else {
                console.log('sx_app_persisted_data: (不存在)');
            }
        } catch (e) {
            console.log('chatData store 錯誤:', e.message);
        }
    } else {
        console.log('localforage 未載入');
    }
    
    // 4. 檢查 Wiki IndexedDB
    console.log('\n--- Wiki IndexedDB 檢查 ---');
    try {
        const WIKI_DB_NAME = 'sx_personal_wiki';
        const WIKI_DB_VERSION = 3;
        
        const db = await new Promise((resolve, reject) => {
            const request = indexedDB.open(WIKI_DB_NAME, WIKI_DB_VERSION);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
        
        console.log('Wiki DB 已開啟');
        
        // 檢查 chars
        const chars = await new Promise((resolve, reject) => {
            const transaction = db.transaction('chars', 'readonly');
            const store = transaction.objectStore('chars');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
        console.log('Wiki chars:', chars.length, '個角色');
        if (chars.length > 0) {
            console.log('Wiki 第一個角色:', chars[0]);
        }
        
        // 檢查 user_entries
        const userEntries = await new Promise((resolve, reject) => {
            const transaction = db.transaction('user_entries', 'readonly');
            const store = transaction.objectStore('user_entries');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
        console.log('Wiki user_entries:', userEntries.length, '條');
        if (userEntries.length > 0) {
            console.log('Wiki 第一條 user entry:', userEntries[0]);
        }
        
        // 檢查 char_entries
        const charEntries = await new Promise((resolve, reject) => {
            const transaction = db.transaction('char_entries', 'readonly');
            const store = transaction.objectStore('char_entries');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
        console.log('Wiki char_entries:', charEntries.length, '條');
        if (charEntries.length > 0) {
            console.log('Wiki 第一條 char entry:', charEntries[0]);
            // 檢查 charId 分布
            const charIdCounts = {};
            charEntries.forEach(entry => {
                const charId = entry.charId || 'no_charId';
                charIdCounts[charId] = (charIdCounts[charId] || 0) + 1;
            });
            console.log('char_entries charId 分布:', charIdCounts);
        }
        
        // 檢查 shared_entries
        if (db.objectStoreNames.contains('shared_entries')) {
            const sharedEntries = await new Promise((resolve, reject) => {
                const transaction = db.transaction('shared_entries', 'readonly');
                const store = transaction.objectStore('shared_entries');
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
            console.log('Wiki shared_entries:', sharedEntries.length, '條');
        }
        
        db.close();
    } catch (e) {
        console.log('Wiki DB 錯誤:', e.message);
    }
    
    // 5. 測試 getCharsFromSettings
    console.log('\n--- getCharsFromSettings 測試 ---');
    if (typeof getCharsFromSettings !== 'undefined') {
        try {
            const chars = await getCharsFromSettings();
            console.log('getCharsFromSettings 返回:', chars.length, '個角色');
            chars.forEach((char, idx) => {
                console.log(`角色 ${idx}:`, {
                    name: char.name,
                    source: char.source,
                    type: char.type,
                    personality: char.personality ? char.personality.substring(0, 50) + '...' : '(無)',
                    background: char.background ? char.background.substring(0, 50) + '...' : '(無)'
                });
            });
        } catch (e) {
            console.log('getCharsFromSettings 錯誤:', e.message);
        }
    } else {
        console.log('getCharsFromSettings 函數不存在（可能需要先開啟 Wiki 應用）');
    }
    
    // 6. 測試 getChatHistory
    console.log('\n--- getChatHistory 測試 ---');
    if (typeof getChatHistory !== 'undefined') {
        try {
            const history = await getChatHistory();
            console.log('getChatHistory 返回:', history.length, '條');
            if (history.length > 0) {
                // 分析角色分布
                const roleCounts = {};
                const charNameCounts = {};
                history.forEach(msg => {
                    roleCounts[msg.role] = (roleCounts[msg.role] || 0) + 1;
                    if (msg.char_name) {
                        charNameCounts[msg.char_name] = (charNameCounts[msg.char_name] || 0) + 1;
                    }
                });
                console.log('角色分布:', roleCounts);
                console.log('char_name 分布:', charNameCounts);
            }
        } catch (e) {
            console.log('getChatHistory 錯誤:', e.message);
        }
    } else {
        console.log('getChatHistory 函數不存在（可能需要先開啟 Wiki 應用）');
    }
    
    console.log('\n=== Wiki 資料測試完成 ===');
}

// 執行測試
testWikiData();