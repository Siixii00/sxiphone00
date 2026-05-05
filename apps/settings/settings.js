/* =========================================================
   核心資料初始化與環境偵測
========================================================= */
const UserEnv = {
    ua: navigator.userAgent || navigator.vendor || window.opera,
    isIOS() { return /iPad|iPhone|iPod/.test(this.ua) && !window.MSStream; },
    isAndroid() { return /Android/.test(this.ua); },
    isDesktop() { return !this.isIOS() && !this.isAndroid(); },
    envName() { return this.isIOS() ? 'iOS' : this.isAndroid() ? 'Android' : 'Desktop'; }
};

let iosTempData = null;

const APP_FOLDER_PREFIX = 'sx_app_';
const APP_FOLDER_SUFFIX = '_folder';

const i18n = {
    'zh-Hant': {
        back: '返回',
        controlCenter: '控制中心',
        charManagement: '角色管理 (char)',
        addChar: '新增角色',
        charList: '角色清單',
        setAvatar: '設定頭貼',
        charName: '角色名稱',
        charAvatarUrl: '頭貼 URL',
        charPersonality: '個性 / Persona',
        charBackground: '背景 / Story',
        charWorldbook: 'WorldBook 參考 (可留空)',
        charExamples: '對話範例 / Examples',
        charSleepStart: '睡眠時間（開始）',
        charSleepEnd: '睡眠時間（結束）',
        saveChar: '儲存角色',
        deleteChar: '刪除角色',
        userManager: '用戶管理 (user)',
        addUser: '新增用戶',
        userList: '用戶清單',
        userName: '用戶名稱',
        userAvatarUrl: '頭貼 URL',
        userPersonality: '個性 / Persona',
        userBackground: '背景 / Story',
        saveUser: '儲存用戶',
        deleteUser: '刪除用戶',
        apiSettings: 'API 設定',
        apiUrl: 'API URL',
        apiKey: 'API Key',
        model: '模型',
        saveApi: '儲存 API',
        language: '語言',
        theme: '主題',
        darkMode: '深色模式',
        lightMode: '淺色模式',
        appearance: '外觀設定',
        fontSize: '字體大小',
        accentColor: '強調色',
        memory: '記憶系統',
        memoryInterval: '記憶間隔',
        worldbook: '世界書',
        importExport: '匯入/匯出',
        import: '匯入',
        export: '匯出',
        reset: '重置',
        confirmReset: '確定要重置所有設定嗎？',
        yes: '是',
        no: '否',
        cancel: '取消',
        confirm: '確定',
        save: '儲存',
        delete: '刪除',
        edit: '編輯',
        add: '新增',
        search: '搜尋',
        loading: '載入中...',
        success: '成功',
        error: '錯誤',
        warning: '警告',
        info: '資訊',
        noData: '無資料',
        selectChar: '選擇角色',
        selectUser: '選擇用戶',
        activeChar: '目前角色',
        activeUser: '目前用戶',
        presetManagement: '預設管理',
        charPresets: '角色預設',
        userPresets: '用戶預設',
        applyPreset: '套用預設',
        saveAsPreset: '儲存為預設',
        presetName: '預設名稱',
        presetDesc: '預設描述',
        examplePlaceholder: '輸入對話範例，讓 AI 學習角色的說話風格。\n\n格式說明：\n- 完整模式：對話用「」、內心活動用()、動作直接描寫\n- 純對話模式：只輸出對話文字\n- 敘事模式：第三人稱小說風格',
        exampleHint: '提供對話範例可讓 AI 更準確地模仿角色的語氣和風格，但 AI 不會照抄範例內容。'
    },
    'zh-Hans': {
        back: '返回',
        controlCenter: '控制中心',
        charManagement: '角色管理 (char)',
        addChar: '新增角色',
        charList: '角色清单',
        setAvatar: '设定头像',
        charName: '角色名称',
        charAvatarUrl: '头像 URL',
        charPersonality: '个性 / Persona',
        charBackground: '背景 / Story',
        charWorldbook: 'WorldBook 参考 (可留空)',
        charExamples: '对话范例 / Examples',
        charSleepStart: '睡眠时间（开始）',
        charSleepEnd: '睡眠时间（结束）',
        saveChar: '储存角色',
        deleteChar: '删除角色',
        userManager: '用户管理 (user)',
        addUser: '新增用户',
        userList: '用户清单',
        userName: '用户名称',
        userAvatarUrl: '头像 URL',
        userPersonality: '个性 / Persona',
        userBackground: '背景 / Story',
        saveUser: '储存用户',
        deleteUser: '删除用户',
        apiSettings: 'API 设定',
        apiUrl: 'API URL',
        apiKey: 'API Key',
        model: '模型',
        saveApi: '储存 API',
        language: '语言',
        theme: '主题',
        darkMode: '深色模式',
        lightMode: '浅色模式',
        appearance: '外观设定',
        fontSize: '字体大小',
        accentColor: '强调色',
        memory: '记忆系统',
        memoryInterval: '记忆间隔',
        worldbook: '世界书',
        importExport: '汇入/汇出',
        import: '汇入',
        export: '汇出',
        reset: '重置',
        confirmReset: '确定要重置所有设定吗？',
        yes: '是',
        no: '否',
        cancel: '取消',
        confirm: '确定',
        save: '储存',
        delete: '删除',
        edit: '编辑',
        add: '新增',
        search: '搜寻',
        loading: '载入中...',
        success: '成功',
        error: '错误',
        warning: '警告',
        info: '资讯',
        noData: '无资料',
        selectChar: '选择角色',
        selectUser: '选择用户',
        activeChar: '目前角色',
        activeUser: '目前用户',
        presetManagement: '预设管理',
        charPresets: '角色预设',
        userPresets: '用户预设',
        applyPreset: '套用预设',
        saveAsPreset: '储存为预设',
        presetName: '预设名称',
        presetDesc: '预设描述',
        examplePlaceholder: '输入对话范例，让 AI 学习角色的说话风格。\n\n格式说明：\n- 完整模式：对话用「」、内心活动用()、动作直接描写\n- 纯对话模式：只输出对话文字\n- 叙事模式：第三人称小说风格',
        exampleHint: '提供对话范例可让 AI 更准确地模仿角色的语气和风格，但 AI 不会照抄范例内容。'
    }
};

function t(key) {
    const lang = localStorage.getItem('sxiphone_lang') || 'zh-Hant';
    const normalizedLang = lang === 'zh-CN' || lang === 'zh-SG' ? 'zh-Hans' : lang;
    return i18n[normalizedLang]?.[key] || i18n['zh-Hant'][key] || key;
}

function applyLanguageToUI() {
    const lang = localStorage.getItem('sxiphone_lang') || 'zh-Hant';
    document.documentElement.lang = lang === 'zh-CN' || lang === 'zh-SG' ? 'zh-Hans' : lang;
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (el.tagName === 'INPUT' && el.placeholder !== undefined) {
            el.placeholder = t(key);
        } else {
            el.textContent = t(key);
        }
    });
    
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = t(el.dataset.i18nPlaceholder);
    });
    
    const navTitle = document.querySelector('.nav-title');
    if (navTitle) navTitle.textContent = t('controlCenter');
    
    const backBtn = document.querySelector('.back-button span');
    if (backBtn) backBtn.textContent = t('back');
}

const collectAppFolders = () => {
    const folders = {};
    for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (!key.startsWith(APP_FOLDER_PREFIX) || !key.endsWith(APP_FOLDER_SUFFIX)) continue;
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        try {
            folders[key] = JSON.parse(raw);
        } catch (e) {
            folders[key] = { __raw: raw };
        }
    }
    return folders;
};

const restoreAppFolders = (folders = {}) => {
    if (!folders || typeof folders !== 'object') return;
    Object.entries(folders).forEach(([key, value]) => {
        if (!key.startsWith(APP_FOLDER_PREFIX) || !key.endsWith(APP_FOLDER_SUFFIX)) return;
        if (value && typeof value === 'object' && '__raw' in value) {
            localStorage.setItem(key, value.__raw);
            return;
        }
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.warn('app-folder 匯入失敗', key, e);
        }
    });
};

// 核心資料加載
let masks = JSON.parse(localStorage.getItem('sx_masks')) || [
    { name: '', personality: '', appearance: '', worldBook: '', avatar: '' }
];
let apis = [];
let activeApiIndex = 0;

const CHARACTERS_KEY = 'sx_characters';
const USERS_KEY = 'sx_users';
const NPCS_KEY = 'sx_npcs';

const loadCharList = () => {
    try {
        const raw = localStorage.getItem(CHARACTERS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) {
            console.log('[Settings] loadCharList: 載入', parsed.length, '個角色');
            return parsed;
        }
        console.warn('[Settings] loadCharList: 資料不是陣列');
        return [];
    } catch (e) {
        console.error('[Settings] loadCharList 解析失敗:', e);
        return [];
    }
};

const saveCharList = (list) => {
    try {
        const serialized = JSON.stringify(list);
        localStorage.setItem(CHARACTERS_KEY, serialized);
        
        const verify = localStorage.getItem(CHARACTERS_KEY);
        if (verify === serialized) {
            console.log('[Settings] saveCharList: 成功儲存', list.length, '個角色');
        } else {
            console.error('[Settings] saveCharList: 驗證失敗，資料不一致');
        }
    } catch (e) {
        console.error('[Settings] saveCharList 儲存失敗:', e);
    }
};

const loadUserList = () => {
    try {
        const raw = localStorage.getItem(USERS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) {
            console.log('[Settings] loadUserList: 載入', parsed.length, '個用戶');
            return parsed;
        }
        return [];
    } catch (e) {
        console.error('[Settings] loadUserList 解析失敗:', e);
        return [];
    }
};

const saveUserList = (list) => {
    try {
        const serialized = JSON.stringify(list);
        localStorage.setItem(USERS_KEY, serialized);
        console.log('[Settings] saveUserList: 成功儲存', list.length, '個用戶');
    } catch (e) {
        console.error('[Settings] saveUserList 儲存失敗:', e);
    }
};

const loadNpcList = () => {
    try {
        const raw = localStorage.getItem(NPCS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const saveNpcList = (list) => {
    localStorage.setItem(NPCS_KEY, JSON.stringify(list));
};

/* =========================================================
   1. 統一保存函式 (同步至 sx_user_name, sx_user_avatar, sx_masks)
   ========================================================= */
async function saveAll() {
    let wbParts = {};
    const wbFrame = document.getElementById('worldbookFrame'); // 這裡請確認你的 iframe ID 是否正確
    if (wbFrame && wbFrame.contentWindow && wbFrame.contentWindow.getSerializedWorldbookParts) {
        wbParts = wbFrame.contentWindow.getSerializedWorldbookParts();
    } else if (typeof window.getSerializedWorldbookParts === 'function') {
        wbParts = window.getSerializedWorldbookParts();
    }
    const lang = document.getElementById('langSelect')?.value || 'zh-Hant';
    const region = document.getElementById('regionInput')?.value || '';
    // 自定義 CSS 欄位已移除
    const newUserPers = document.getElementById('maskPersonality')?.value || '';
    const newUserBG = document.getElementById('maskBackground')?.value || '';
    const newUserName = document.getElementById('maskNameInput')?.value || '';
    const newUserAvatar = document.getElementById('avatarUrlInput')?.value || '';

    const currentUserName = newUserName || localStorage.getItem('sx_user_name') || 'User';
    const currentUserAvatar = newUserAvatar || localStorage.getItem('sx_user_avatar') || '';

    // 1. 強制寫入 LocalStorage (供其他應用調用)
    localStorage.setItem('sx_masks', JSON.stringify(masks));
    localStorage.setItem('api_configs', JSON.stringify(apis));
    localStorage.setItem('sx_active_api', activeApiIndex.toString());
    localStorage.setItem('sxiphone_lang', lang);
    localStorage.setItem('sxiphone_region', region);
    // 自定義 CSS 已移除，不再保存
    localStorage.setItem('sx_user_name', currentUserName);
    localStorage.setItem('sx_user_avatar', currentUserAvatar);
    localStorage.setItem('sx_user_personality', newUserPers); // 新增
    localStorage.setItem('sx_user_background', newUserBG);    // 新增
    localStorage.setItem('sx_worldbook_cot', JSON.stringify(wbParts.sx_worldbook_cot || []));
    localStorage.setItem('sx_worldbook_style', JSON.stringify(wbParts.sx_worldbook_style || []));
    localStorage.setItem('sx_worldbook_global', JSON.stringify(wbParts.sx_worldbook_global || []));
    localStorage.setItem('sx_worldbook_keywords', JSON.stringify(wbParts.sx_worldbook_keywords || []));
    localStorage.setItem('sx_worldbook_backend', JSON.stringify(wbParts.sx_worldbook_backend || []));
    localStorage.setItem('sx_worldbook_theater', JSON.stringify(wbParts.sx_worldbook_theater || []));

    if (typeof window.persistWorldbookIndex === 'function') {
        window.persistWorldbookIndex(wbParts);
    }

    // 2. 針對 iOS 強制持久化至 IndexedDB (防止系統清理)
    try {
        await localforage.setItem('sx_app_persisted_data', {
            masks: masks, 
            apis: apis, 
            activeApiIndex: activeApiIndex, 
            lang: lang, 
            region: region, 
            // 自定義 CSS 已移除
            userName: currentUserName, 
            userAvatar: currentUserAvatar,
            userPersonality: newUserPers,
            userBackground: newUserBG,
            sx_worldbook_cot: wbParts.sx_worldbook_cot || [],
            sx_worldbook_style: wbParts.sx_worldbook_style || [],
            sx_worldbook_global: wbParts.sx_worldbook_global || [],
            sx_worldbook_keywords: wbParts.sx_worldbook_keywords || [],
            sx_worldbook_backend: wbParts.sx_worldbook_backend || [],
            sx_worldbook_theater: wbParts.sx_worldbook_theater || []
        });
        await localforage.setItem('api_configs_new', apis);
        await localforage.setItem('sx_active_api_new', activeApiIndex);
        console.log("iOS 持久化儲存成功");
    } catch (e) {
        console.error("IndexedDB 寫入失敗", e);
    }
    // 3. 跨應用通知：若在 iframe 則通知父視窗更新
    if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'settingsUpdated' }, '*');
        window.parent.postMessage({ type: 'WORLD_BOOK_UPDATED' }, '*');
        window.parent.postMessage({ type: 'LANGUAGE_CHANGED', lang }, '*');
    }
}
/* =========================================================
   2. 面具管理邏輯 (對應 HTML 與 CSS)
   ========================================================= */

// 初始化渲染 (目前僅初始化圖標)
function renderMasks() {
    if (window.lucide) lucide.createIcons();
}

// 即時頭像預覽
function updateAvatarPreview(url) {
    const preview = document.getElementById('avatarPreview');
    if (!preview) return;
    if (url && (url.startsWith('http') || url.startsWith('data:'))) {
        preview.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover;">`;
    } else {
        preview.innerHTML = `<i data-lucide="user" style="color:var(--ios-gray);"></i>`;
        if (window.lucide) lucide.createIcons();
    }
}

function updateCharAvatarPreview(url) {
    const preview = document.getElementById('charAvatarPreview');
    if (!preview) return;
    if (url && (url.startsWith('http') || url.startsWith('data:'))) {
        preview.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover;">`;
    } else {
        preview.innerHTML = `<i data-lucide="bot" style="color:var(--ios-gray);"></i>`;
        if (window.lucide) lucide.createIcons();
    }
}

// 儲存面具並觸發同步
function saveUserMask() {
    // 1. 取得輸入欄位
    const nameInput = document.getElementById('maskNameInput'); 
    const avatarInput = document.getElementById('avatarUrlInput');
    const personalityInput = document.getElementById('maskPersonality');
    const backgroundInput = document.getElementById('maskBackground');

    const name = nameInput?.value || '';
    const avatar = avatarInput?.value || '';
    const personality = personalityInput?.value || '';
    const background = backgroundInput?.value || '';

    // 檢查是否至少有輸入名稱或頭像
    if (!name && !avatar) {
        alert("請輸入用戶名稱或頭貼 URL");
        return;
    }

    // 2. 【核心修正】直接儲存為 User 專屬資料，不存入 masks 陣列
    // 這樣 Chat App 的 getUserConfig() 就能抓到正確的 User 資料
    localStorage.setItem('sx_user_name', name || 'User');
    localStorage.setItem('sx_user_avatar', avatar);
    
    // 如果有輸入人設或背景，可以選擇存入另一個專屬 Key（選填）
    if (personality) localStorage.setItem('sx_user_personality', personality);

    // 同步到 users 列表
    const list = loadUserList();
    const payload = { name, avatar, personality, background };
    const existingIdx = list.findIndex(item => item.name === name && name);
    if (existingIdx >= 0) list[existingIdx] = payload;
    else list.unshift(payload);
    saveUserList(list);

    // 3. 執行全域同步 (同步語言、地區等環境變數)
    // 注意：此時 saveAll 內部不應再處理 masks.push
    saveAll();
    
    // 呼叫原本的預覽更新函式歸零
    if (typeof updateAvatarPreview === 'function') {
        updateAvatarPreview('');
    }
    
    alert(`✅ 用戶「${name || 'User'}」的預設人設已更新並儲存`);
}
document.addEventListener('DOMContentLoaded', async () => {
    // 0. 套用語言到 UI
    applyLanguageToUI();
    
    // 1. 初始化圖標與清單
    if (window.lucide) lucide.createIcons();
    await initStorage(); // 確保先讀取資料

    // 2. 設定要自動回填的欄位對照表 (ID : LocalStorage Key)
    // 注意：環境感知相關欄位由 EnvAwarenessManager 統一處理，不在此處回填
    const fields = {
        'regionInput': 'sxiphone_region',
        'langSelect': 'sxiphone_lang',
        'user-name-input': 'sx_user_name',
        'user-avatar-input': 'sx_user_avatar',
        'user-personality-input': 'sx_user_personality',
        'user-background-input': 'sx_user_background',
        'novaApiUrl': 'sx_nova_api_url',
        'novaApiKey': 'sx_nova_api_key',
        'memory-interval': 'sx_memory_interval',
        'github-pat': 'sx_github_pat',
        'github-repo': 'sx_github_repo',
        'github-file': 'sx_github_backup_file',
        'newApiUrl': 'sx_new_api_url',
        'newApiKey': 'sx_new_api_key'
    };

    // 3. 執行自動回填邏輯
    for (let id in fields) {
        const el = document.getElementById(id);
        if (el) {
            const savedValue = localStorage.getItem(fields[id]);
            if (id === 'langSelect') {
                el.value = savedValue || 'zh-Hant';
            } else if (id === 'memory-interval') {
                el.value = savedValue || '15';
            } else {
                el.value = savedValue || '';
            }
            
            // 如果是頭像欄位，同步更新預覽
            if (id === 'user-avatar-input' && savedValue) {
                updateAvatarPreview(savedValue);
            }
        }
    }

    // 4. 回填角色設定
    const charFields = {
        'char-name-input': 'sx_char_name',
        'char-avatar-input': 'sx_char_avatar',
        'char-personality-input': 'sx_char_personality',
        'char-background-input': 'sx_char_background',
        'char-worldbook-input': 'sx_char_worldbook',
        'char-examples-input': 'sx_char_examples'
    };
    for (let id in charFields) {
        const el = document.getElementById(id);
        if (el) {
            const savedValue = localStorage.getItem(charFields[id]);
            el.value = savedValue || '';
        }
    }
    // 回填角色頭像預覽
    const charAvatarPreview = document.getElementById('char-avatar-preview');
    if (charAvatarPreview) {
        const charAvatar = localStorage.getItem('sx_char_avatar');
        if (charAvatar) {
            charAvatarPreview.src = charAvatar;
        }
    }

    // 語言選擇器即時同步
    const langSelectEl = document.getElementById('langSelect');
    if (langSelectEl) {
        langSelectEl.addEventListener('change', (e) => {
            const newLang = e.target.value;
            localStorage.setItem('sxiphone_lang', newLang);
            document.documentElement.lang = newLang;
            window.parent?.postMessage({ type: 'LANGUAGE_CHANGED', lang: newLang }, '*');
            console.log('[Settings] 語言已變更為:', newLang);
        });
    }

    const memoryInterval = document.getElementById('memory-interval');
    const memoryIntervalValue = document.getElementById('memory-interval-value');
    if (memoryInterval && memoryIntervalValue) {
        memoryIntervalValue.textContent = memoryInterval.value || '15';
        memoryInterval.addEventListener('input', (e) => {
            memoryIntervalValue.textContent = e.target.value;
            localStorage.setItem('sx_memory_interval', e.target.value);
            window.parent?.postMessage({ type: 'MEMORY_INTERVAL_UPDATED', payload: { interval: Number(e.target.value) } }, '*');
        });
    }

    // AI 睡眠時間設定
    const aiSleepStart = document.getElementById('ai-sleep-start');
    const aiSleepEnd = document.getElementById('ai-sleep-end');
    const aiSleepEnabled = document.getElementById('ai-sleep-enabled');
    const aiSleepSaveBtn = document.getElementById('ai-sleep-save-btn');
    const aiSleepTriggerBtn = document.getElementById('ai-sleep-trigger-btn');
    const aiSleepNextTime = document.getElementById('ai-sleep-next-time');
    const aiSleepLastTime = document.getElementById('ai-sleep-last-time');
    const aiSleepCount = document.getElementById('ai-sleep-count');
    const sleepTaskConsolidate = document.getElementById('sleep-task-consolidate');
    const sleepTaskVectorize = document.getElementById('sleep-task-vectorize');
    const sleepTaskAssociate = document.getElementById('sleep-task-associate');
    const sleepTaskDecay = document.getElementById('sleep-task-decay');

    const loadSleepSettings = () => {
        const savedStart = localStorage.getItem('sx_ai_sleep_start') || '23:00';
        const savedEnd = localStorage.getItem('sx_ai_sleep_end') || '07:00';
        const savedEnabled = localStorage.getItem('sx_ai_sleep_enabled') !== 'false';
        const savedTasks = JSON.parse(localStorage.getItem('sx_ai_sleep_tasks') || '{"consolidate":true,"vectorize":true,"associate":true,"decay":true}');
        
        if (aiSleepStart) aiSleepStart.value = savedStart;
        if (aiSleepEnd) aiSleepEnd.value = savedEnd;
        if (aiSleepEnabled) aiSleepEnabled.checked = savedEnabled;
        if (sleepTaskConsolidate) sleepTaskConsolidate.checked = savedTasks.consolidate !== false;
        if (sleepTaskVectorize) sleepTaskVectorize.checked = savedTasks.vectorize !== false;
        if (sleepTaskAssociate) sleepTaskAssociate.checked = savedTasks.associate !== false;
        if (sleepTaskDecay) sleepTaskDecay.checked = savedTasks.decay !== false;
        
        updateSleepStatus();
    };

    const updateSleepStatus = () => {
        const schedulerState = JSON.parse(localStorage.getItem('sx_sleep_scheduler_state') || '{}');
        const lastSleep = schedulerState.lastNightlySleep || localStorage.getItem('sx_sleep_completed_at');
        const totalSleeps = schedulerState.totalSleeps || 0;
        
        if (aiSleepLastTime) {
            aiSleepLastTime.textContent = `上次睡眠：${lastSleep ? new Date(lastSleep).toLocaleString() : '尚未執行'}`;
        }
        if (aiSleepCount) {
            aiSleepCount.textContent = `總睡眠次數：${totalSleeps}`;
        }
        
        const sleepStart = localStorage.getItem('sx_ai_sleep_start') || '23:00';
        const [hour, minute] = sleepStart.split(':').map(Number);
        const now = new Date();
        const nextSleep = new Date();
        nextSleep.setHours(hour, minute, 0, 0);
        if (nextSleep <= now) {
            nextSleep.setDate(nextSleep.getDate() + 1);
        }
        
        if (aiSleepNextTime) {
            const enabled = localStorage.getItem('sx_ai_sleep_enabled') !== 'false';
            if (enabled) {
                aiSleepNextTime.textContent = `下次睡眠時間：${nextSleep.toLocaleString()}`;
            } else {
                aiSleepNextTime.textContent = '自動睡眠已停用';
            }
        }
    };

    const saveSleepSettings = () => {
        if (aiSleepStart) localStorage.setItem('sx_ai_sleep_start', aiSleepStart.value);
        if (aiSleepEnd) localStorage.setItem('sx_ai_sleep_end', aiSleepEnd.value);
        if (aiSleepEnabled) localStorage.setItem('sx_ai_sleep_enabled', aiSleepEnabled.checked ? 'true' : 'false');
        
        const tasks = {
            consolidate: sleepTaskConsolidate?.checked !== false,
            vectorize: sleepTaskVectorize?.checked !== false,
            associate: sleepTaskAssociate?.checked !== false,
            decay: sleepTaskDecay?.checked !== false
        };
        localStorage.setItem('sx_ai_sleep_tasks', JSON.stringify(tasks));
        
        window.parent?.postMessage({
            type: 'AI_SLEEP_SETTINGS_UPDATED',
            payload: {
                sleepStart: aiSleepStart?.value || '23:00',
                sleepEnd: aiSleepEnd?.value || '07:00',
                enabled: aiSleepEnabled?.checked !== false,
                tasks
            }
        }, '*');
        
        updateSleepStatus();
        alert('✅ AI 睡眠設定已儲存');
    };

    const triggerManualSleep = () => {
        if (!confirm('確定要立即執行睡眠嗎？這將進行記憶整理與向量化，可能需要一些時間。')) return;
        
        const statusEl = document.getElementById('ai-sleep-next-time');
        if (statusEl) {
            statusEl.textContent = '睡眠執行中...';
            statusEl.style.color = '#FFD60A';
        }
        
        window.parent?.postMessage({
            type: 'TRIGGER_AI_SLEEP',
            payload: { reason: 'manual' }
        }, '*');
        
        const sleepResultHandler = (event) => {
            if (event.data?.type === 'GLOBAL_MEMORY_SLEEP_RESULT') {
                const result = event.data.result;
                window.removeEventListener('message', sleepResultHandler);
                
                if (statusEl) {
                    statusEl.style.color = '';
                }
                
                if (result && !result.skipped) {
                    const shortToLong = result.phases?.shortToLong || {};
                    const chatMemories = result.phases?.chatMemories || {};
                    
                    let message = '✅ 睡眠完成！\n\n';
                    message += `短期記憶 → 長期記憶：\n`;
                    message += `  - 載入：${shortToLong.loaded || 0} 條\n`;
                    message += `  - 新建：${shortToLong.stored || 0} 條\n`;
                    message += `  - 強化：${shortToLong.reinforced || 0} 條\n`;
                    message += `  - 向量化：${shortToLong.vectorized || 0} 條\n\n`;
                    message += `聊天記憶處理：\n`;
                    message += `  - 向量化：${chatMemories.vectorized || 0} 條\n`;
                    message += `  - 分類：${chatMemories.classified || 0} 條\n`;
                    message += `\n耗時：${result.duration || 0} ms`;
                    
                    alert(message);
                    updateSleepStatus();
                } else if (result?.skipped) {
                    alert('⚠️ 睡眠已跳過：' + (result.reason === 'already_running' ? '正在執行中' : '記憶系統未初始化'));
                    if (statusEl) {
                        statusEl.textContent = '睡眠已跳過';
                    }
                }
            }
        };
        
        window.addEventListener('message', sleepResultHandler);
        
        setTimeout(() => {
            window.removeEventListener('message', sleepResultHandler);
            if (statusEl && statusEl.textContent === '睡眠執行中...') {
                statusEl.textContent = '睡眠指令已發送，請查看主控台';
            }
        }, 30000);
    };

    loadSleepSettings();

    aiSleepSaveBtn?.addEventListener('click', saveSleepSettings);
    aiSleepTriggerBtn?.addEventListener('click', triggerManualSleep);

    [aiSleepStart, aiSleepEnd, aiSleepEnabled, sleepTaskConsolidate, sleepTaskVectorize, sleepTaskAssociate, sleepTaskDecay].forEach(el => {
        el?.addEventListener('change', () => {
            updateSleepStatus();
        });
    });

    setInterval(updateSleepStatus, 60000);

    const githubPat = document.getElementById('github-pat');
    const githubRepo = document.getElementById('github-repo');
    const githubFile = document.getElementById('github-file');
    const githubSaveBtn = document.getElementById('github-save-token');
    const githubBackupBtn = document.getElementById('github-backup');
    const githubRestoreBtn = document.getElementById('github-restore');
    const githubStatus = document.getElementById('github-status');
    const githubConnectedSection = document.getElementById('github-connected-section');
    const githubNotconnectedSection = document.getElementById('github-notconnected-section');
    const githubConnectedUser = document.getElementById('github-connected-user');
    const githubConnectedRepo = document.getElementById('github-connected-repo');
    const githubSyncPushBtn = document.getElementById('github-sync-push');
    const githubSyncPullBtn = document.getElementById('github-sync-pull');
    const githubSyncStatus = document.getElementById('github-sync-status');
    const githubDisconnectBtn = document.getElementById('github-disconnect');
    const githubAvatarEl = document.getElementById('github-avatar');
    const githubDetailUsername = document.getElementById('github-detail-username');
    const githubDetailRepoLink = document.getElementById('github-detail-repo-link');
    const githubDetailLastSync = document.getElementById('github-detail-last-sync');
    const githubDetailMode = document.getElementById('github-detail-mode');

    const setGithubStatus = (text) => {
        if (githubStatus) githubStatus.textContent = text;
    };

    const updateStorageUI = async () => {
        if (typeof UnifiedStorageManager === 'undefined') return;
        
        const manager = new UnifiedStorageManager();
        
        try {
            const detailed = await manager.getDetailedEstimate();
            const iosWarning = manager.checkIOSStorageWarning();
            
            const totalKB = Math.round(detailed.total.size / 1024);
            const lsKB = Math.round(detailed.localStorage.size / 1024);
            const idbKB = Math.round(detailed.indexedDB.size / 1024);
            
            const usageText = document.getElementById('storage-usage-text');
            const usageBar = document.getElementById('storage-usage-bar');
            const lsSize = document.getElementById('ls-size');
            const idbSize = document.getElementById('idb-size');
            const warningEl = document.getElementById('storage-warning');
            
            if (usageText) {
                usageText.textContent = `${totalKB} KB`;
            }
            
            if (lsSize) lsSize.textContent = `${lsKB} KB`;
            if (idbSize) idbSize.textContent = `${idbKB} KB`;
            
            if (iosWarning.isIOS && usageBar) {
                const percentage = Math.min(iosWarning.usagePercentage * 100, 100);
                usageBar.style.width = `${percentage}%`;
                
                if (iosWarning.warning === 'critical') {
                    usageBar.style.background = '#FF453A';
                } else if (iosWarning.warning === 'warning') {
                    usageBar.style.background = '#FF9500';
                } else {
                    usageBar.style.background = 'var(--ios-blue)';
                }
            } else if (usageBar) {
                const maxDisplay = 5 * 1024 * 1024;
                const percentage = Math.min((detailed.total.size / maxDisplay) * 100, 100);
                usageBar.style.width = `${percentage}%`;
            }
            
            if (warningEl && iosWarning.warning) {
                warningEl.classList.remove('hidden');
                if (iosWarning.warning === 'critical') {
                    warningEl.textContent = '⚠️ 儲存空間嚴重不足，可能導致資料遺失！建議立即清理。';
                } else {
                    warningEl.textContent = '⚠️ 儲存空間使用率較高，建議清理舊資料。';
                }
            } else if (warningEl) {
                warningEl.classList.add('hidden');
            }
        } catch (e) {
            console.warn('[Settings] 更新儲存 UI 失敗:', e);
        }
    };

    const storageCleanupBtn = document.getElementById('storage-cleanup-btn');
    storageCleanupBtn?.addEventListener('click', async () => {
        if (typeof UnifiedStorageManager === 'undefined') {
            alert('UnifiedStorageManager 未載入');
            return;
        }
        
        const manager = new UnifiedStorageManager();
        
        if (!confirm('確定要清理舊資料嗎？\n\n將會：\n- 清除 30 天前的聊天快取\n- 清除 Service Worker 快取\n\n此操作無法復原。')) {
            return;
        }
        
        try {
            const result = await manager.cleanup({
                clearOldChatCache: true,
                clearCache: true
            });
            
            let msg = '清理完成！\n';
            if (result.localStorageCleared > 0) {
                msg += `- 已清理 ${result.localStorageCleared} 個舊聊天室\n`;
            }
            if (result.cacheCleared) {
                msg += '- 已清除 Service Worker 快取\n';
            }
            
            alert(msg);
            await updateStorageUI();
            await updateIOSStoragePressure();
        } catch (e) {
            alert('清理失敗: ' + e.message);
        }
    });

    const updateIOSStoragePressure = async () => {
        const pressureEl = document.getElementById('ios-storage-pressure');
        const pressureValueEl = document.getElementById('ios-pressure-value');
        const pressureBarEl = document.getElementById('ios-pressure-bar');
        const pressureRecommendationEl = document.getElementById('ios-pressure-recommendation');

        if (!pressureEl || typeof UnifiedStorageManager === 'undefined') return;

        try {
            const manager = new UnifiedStorageManager();
            const pressure = await manager.checkIOSStoragePressure();

            if (!pressure.isIOS) {
                pressureEl.classList.add('hidden');
                return;
            }

            pressureEl.classList.remove('hidden');

            const percentage = Math.round(pressure.usagePercentage * 100);
            if (pressureValueEl) {
                pressureValueEl.textContent = `${percentage}%`;
            }

            if (pressureBarEl) {
                pressureBarEl.style.width = `${percentage}%`;
                if (pressure.pressure === 'critical') {
                    pressureBarEl.style.background = '#FF453A';
                } else if (pressure.pressure === 'high') {
                    pressureBarEl.style.background = '#FF9500';
                } else if (pressure.pressure === 'moderate') {
                    pressureBarEl.style.background = '#FFCC00';
                } else {
                    pressureBarEl.style.background = '#34C759';
                }
            }

            if (pressureRecommendationEl) {
                pressureRecommendationEl.textContent = pressure.recommendation;
            }

            const cleanupStats = manager.getCleanupStats();
            if (cleanupStats && pressureRecommendationEl) {
                pressureRecommendationEl.textContent += ` (上次清理: ${cleanupStats.lastCleanup ? new Date(cleanupStats.lastCleanup).toLocaleDateString() : '無'})`;
            }
        } catch (e) {
            console.warn('[Settings] 更新 iOS 儲存壓力失敗:', e);
        }
    };

    updateIOSStoragePressure();

    const updateBackupPipelineStatus = () => {
        const migrateStatusEl = document.getElementById('pipeline-migrate-status');
        const supabaseStatusEl = document.getElementById('pipeline-supabase-status');
        const nightlyStatusEl = document.getElementById('pipeline-nightly-status');
        const failWarningEl = document.getElementById('backup-fail-warning');
        const failMessageEl = document.getElementById('backup-fail-message');
        const manualBackupBtn = document.getElementById('manual-backup-btn');

        if (!migrateStatusEl) return;

        const lastMigrate = localStorage.getItem('sx_last_pipeline_migrate');
        if (lastMigrate) {
            const migrateTime = new Date(parseInt(lastMigrate));
            const minutesAgo = Math.round((Date.now() - parseInt(lastMigrate)) / 60000);
            migrateStatusEl.textContent = `✅ ${minutesAgo}分鐘前`;
            migrateStatusEl.style.color = '#34C759';
        } else {
            migrateStatusEl.textContent = '⏳ 待執行';
            migrateStatusEl.style.color = '#FF9500';
        }

        const lastSupabaseAuto = localStorage.getItem('sx_supabase_last_auto_backup');
        const supabaseEnabled = localStorage.getItem('sx_supabase_auto_backup') === 'true';
        if (supabaseEnabled && lastSupabaseAuto) {
            const minutesAgo = Math.round((Date.now() - parseInt(lastSupabaseAuto)) / 60000);
            supabaseStatusEl.textContent = `✅ ${minutesAgo}分鐘前`;
            supabaseStatusEl.style.color = '#34C759';
        } else if (!supabaseEnabled) {
            supabaseStatusEl.textContent = '⚠️ 未啟用';
            supabaseStatusEl.style.color = '#FF9500';
        } else {
            supabaseStatusEl.textContent = '⏳ 待執行';
            supabaseStatusEl.style.color = '#FF9500';
        }

        const lastNightly = localStorage.getItem('sx_last_nightly_backup');
        if (lastNightly) {
            nightlyStatusEl.textContent = `✅ ${lastNightly}`;
            nightlyStatusEl.style.color = '#34C759';
        } else {
            nightlyStatusEl.textContent = '⏳ 待執行';
            nightlyStatusEl.style.color = '#FF9500';
        }

        const pendingFail = localStorage.getItem('sx_backup_fail_pending') === 'true';
        if (pendingFail && failWarningEl) {
            failWarningEl.classList.remove('hidden');
            const details = localStorage.getItem('sx_backup_fail_details');
            if (details && failMessageEl) {
                try {
                    const parsed = JSON.parse(details);
                    const errors = parsed.results?.errors || [];
                    failMessageEl.textContent = `時間: ${new Date(parsed.time).toLocaleString()}\n錯誤: ${errors.join(', ') || '未知錯誤'}`;
                } catch {
                    failMessageEl.textContent = '備份失敗，請手動備份資料';
                }
            }
        } else if (failWarningEl) {
            failWarningEl.classList.add('hidden');
        }

        if (manualBackupBtn) {
            manualBackupBtn.onclick = () => {
                if (typeof UnifiedStorageManager !== 'undefined') {
                    const manager = new UnifiedStorageManager();
                    manager.collectAllStorageData().then(data => {
                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `sxiphone-backup-${new Date().toISOString().slice(0,10)}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                        manager.clearBackupNotification();
                        updateBackupPipelineStatus();
                        alert('✅ 本地備份已完成！');
                    });
                }
            };
        }
    };

    updateBackupPipelineStatus();
    setInterval(updateBackupPipelineStatus, 60000);

    window.addEventListener('sxiphone-backup-failed', (e) => {
        console.warn('[Settings] 收到備份失敗事件:', e.detail);
        updateBackupPipelineStatus();
        
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('SxiPhone 備份失敗', {
                body: '雲端備份失敗，請前往設定頁面進行手動備份',
                icon: '/icons/icon-192.png'
            });
        }
    });

    const refreshGitHubSection = async () => {
        const loginToken = localStorage.getItem('sx_github_token') || localStorage.getItem('sx_github_pat');
        const loginUser = localStorage.getItem('sx_github_user');
        const loginRepo = localStorage.getItem('sx_github_repo_name') || localStorage.getItem('sx_github_repo');
        const isConnected = !!loginToken;

        if (githubConnectedSection) githubConnectedSection.classList.toggle('hidden', !isConnected);
        if (githubNotconnectedSection) githubNotconnectedSection.classList.toggle('hidden', isConnected);

        if (isConnected) {
            if (githubConnectedUser) githubConnectedUser.textContent = loginUser || '—';
            if (githubConnectedRepo) githubConnectedRepo.textContent = loginRepo || 'sxiphone-backup';
            if (githubDetailUsername) githubDetailUsername.textContent = loginUser || '—';
            if (githubDetailRepoLink) {
                githubDetailRepoLink.textContent = `${loginUser || 'user'}/${loginRepo || 'sxiphone-backup'}`;
                githubDetailRepoLink.href = `https://github.com/${loginUser || 'user'}/${loginRepo || 'sxiphone-backup'}`;
            }
            const lastSync = localStorage.getItem('sx_github_last_sync');
            if (githubDetailLastSync) githubDetailLastSync.textContent = lastSync || '未知';
            const isGuest = localStorage.getItem('sx_guest_mode');
            if (githubDetailMode) githubDetailMode.textContent = isGuest ? '遊客' : 'GitHub';

            let avatarUrl = localStorage.getItem('sx_github_avatar_url');
            if (!avatarUrl && loginToken) {
                try {
                    const resp = await fetch('https://api.github.com/user', {
                        headers: { Authorization: `token ${loginToken}` }
                    });
                    if (resp.ok) {
                        const userData = await resp.json();
                        avatarUrl = userData.avatar_url || '';
                        if (avatarUrl) localStorage.setItem('sx_github_avatar_url', avatarUrl);
                        if (userData.login) localStorage.setItem('sx_github_user', userData.login);
                    }
                } catch {}
            }
            if (githubAvatarEl) {
                if (avatarUrl) {
                    githubAvatarEl.src = avatarUrl;
                    githubAvatarEl.style.display = '';
                } else {
                    githubAvatarEl.style.display = 'none';
                }
            }
        }
        
        await updateStorageUI();
    };

    const memorySyncPushBtn = document.getElementById('memory-sync-push');
    const memorySyncPullBtn = document.getElementById('memory-sync-pull');
    const memorySyncStatus = document.getElementById('memory-sync-status');

    memorySyncPushBtn?.addEventListener('click', async () => {
        if (typeof UnifiedStorageManager === 'undefined') {
            if (memorySyncStatus) memorySyncStatus.textContent = '❌ 管理器未載入';
            return;
        }

        const manager = new UnifiedStorageManager();
        if (memorySyncStatus) memorySyncStatus.textContent = '同步中...';

        try {
            const result = await manager.syncAllMemories('push');
            if (result.shortTerm?.success) {
                if (memorySyncStatus) memorySyncStatus.textContent = '✅ 記憶已同步到 IndexedDB';
            } else {
                if (memorySyncStatus) memorySyncStatus.textContent = '⚠️ ' + (result.shortTerm?.reason || '同步失敗');
            }
        } catch (e) {
            if (memorySyncStatus) memorySyncStatus.textContent = '❌ 同步失敗: ' + e.message;
        }
    });

    memorySyncPullBtn?.addEventListener('click', async () => {
        if (typeof UnifiedStorageManager === 'undefined') {
            if (memorySyncStatus) memorySyncStatus.textContent = '❌ 管理器未載入';
            return;
        }

        const manager = new UnifiedStorageManager();
        if (memorySyncStatus) memorySyncStatus.textContent = '拉取中...';

        try {
            const result = await manager.syncAllMemories('pull');
            if (result.shortTerm?.success) {
                const count = result.shortTerm.count || 0;
                if (memorySyncStatus) memorySyncStatus.textContent = '✅ 已拉取 ' + count + ' 條記憶';
                
                if (typeof ShortTermMemory !== 'undefined') {
                    const stm = new ShortTermMemory();
                    stm.initialize();
                }
            } else {
                if (memorySyncStatus) memorySyncStatus.textContent = '⚠️ ' + (result.shortTerm?.reason || '拉取失敗');
            }
        } catch (e) {
            if (memorySyncStatus) memorySyncStatus.textContent = '❌ 拉取失敗: ' + e.message;
        }
    });

    refreshGitHubSection();

    const arrayBufferToBase64 = (buffer) => {
        const bytes = new Uint8Array(buffer);
        const chunkSize = 8192;
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i += chunkSize) {
            const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.byteLength));
            binary += String.fromCharCode.apply(null, Array.from(chunk));
        }
        return btoa(binary);
    };

    const base64ToArrayBuffer = (base64) => {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    };

    const encodeToBase64 = (str) => {
        try {
            const encoder = new TextEncoder();
            const uint8Array = encoder.encode(str);
            return arrayBufferToBase64(uint8Array.buffer);
        } catch (e) {
            console.error('[encodeToBase64] Error:', e);
            return btoa(unescape(encodeURIComponent(str)));
        }
    };

    const decodeFromBase64 = (base64) => {
        const uint8Array = base64ToArrayBuffer(base64);
        const decoder = new TextDecoder();
        return decoder.decode(uint8Array);
    };

    // 檢測是否為函式字串（可能污染備份的代碼）
    const isFunctionString = (value) => {
        if (typeof value !== 'string' || !value.trim()) return false;
        const trimmed = value.trim();
        
        // 檢測各種函式定義模式
        const functionPatterns = [
            /^\s*\([^)]*\)\s*=>/,                    // 箭頭函式: () => ...
            /^\s*async\s*\([^)]*\)\s*=>/,           // async 箭頭函式: async () => ...
            /^\s*async\s+function\s*[\w]*\s*\(/,    // async function
            /^\s*function\s*[\w]*\s*\(/,            // function name() 或 function()
            /^\s*class\s+[\w]+\s*[\{]/,             // class 定義
            /^\s*class\s+[\w]+\s+extends\s+/,       // class extends
            /^\s*export\s+(function|class|async)/,  // export function/class
            /^\s*import\s+/,                         // import 語句
            /^\s*const\s+[\w]+\s*=\s*\([^)]*\)\s*=>/, // const x = () =>
            /^\s*let\s+[\w]+\s*=\s*\([^)]*\)\s*=>/,   // let x = () =>
            /^\s*var\s+[\w]+\s*=\s*function/,         // var x = function
        ];
        
        return functionPatterns.some(pattern => pattern.test(trimmed));
    };

    // 檢測是否為 localStorage 原生方法名稱（這些 key 不應存在）
    const isNativeMethodKey = (key) => {
        const nativeMethods = ['setItem', 'getItem', 'removeItem', 'clear', 'key', 'length'];
        return nativeMethods.includes(key);
    };

    const collectAllStorageData = async () => {
        const data = {
            localStorage: {},
            localforage: {}
        };

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;
            // 只備份 sx_、api_、sxiphone 相關的 key
            if (!(key.startsWith('sx_') || key.startsWith('api_') || key.startsWith('sxiphone'))) continue;
            // 排除原生方法名稱的 key（這些是污染）
            if (isNativeMethodKey(key)) {
                console.warn('[GitHub 備份] 排除原生方法 key:', key);
                continue;
            }
            try {
                const value = localStorage.getItem(key);
                if (value === null) continue;
                // 過濾掉被污染的函式字串
                if (isFunctionString(value)) {
                    console.warn('[GitHub 備份] 排除函式字串 key:', key);
                    continue;
                }
                data.localStorage[key] = value;
            } catch (e) {
                console.warn('無法讀取 localStorage:', key);
            }
        }

        if (typeof localforage !== 'undefined') {
            try {
                await localforage.iterate((value, key) => {
                    if (key.startsWith('sx_') || key.startsWith('api_') || key.startsWith('sxiphone')) {
                        // 也檢查 localforage 資料是否為函式字串
                        if (typeof value === 'string' && isFunctionString(value)) {
                            console.warn('[GitHub 備份] 排除 localforage 函式字串 key:', key);
                            return;
                        }
                        data.localforage[key] = value;
                    }
                });
            } catch (e) {
                console.warn('無法讀取 localforage:', e);
            }
        }

        console.log(`[GitHub 備份] 收集 localStorage ${Object.keys(data.localStorage).length} 筆, localforage ${Object.keys(data.localforage).length} 筆`);
        
        return data;
    };

    const restoreAllStorageData = async (data) => {
        let count = 0;

        if (data.localStorage) {
            for (const [key, value] of Object.entries(data.localStorage)) {
                try {
                    localStorage.setItem(key, value);
                    count++;
                } catch (e) {
                    console.warn('無法還原 localStorage:', key);
                }
            }
        }

        if (data.localforage && typeof localforage !== 'undefined') {
            for (const [key, value] of Object.entries(data.localforage)) {
                try {
                    await localforage.setItem(key, value);
                    count++;
                } catch (e) {
                    console.warn('無法還原 localforage:', key);
                }
            }
        }

        window.dispatchEvent(new CustomEvent('sxiphone-data-restored', { 
            detail: { count, source: 'github-pull' } 
        }));
        
        window.parent?.postMessage({
            type: 'DATA_RESTORED',
            count
        }, '*');

        console.log('[GitHub 還原] 已還原 ' + count + ' 筆資料');

        if (typeof ShortTermMemory !== 'undefined') {
            try {
                const stm = new ShortTermMemory();
                stm.initialize();
                console.log('[GitHub 還原] 短期記憶已重新初始化');
            } catch (e) {
                console.warn('[GitHub 還原] 短期記憶初始化失敗:', e);
            }
        }
        
        return count;
    };

    const githubPushBackup = async (statusEl) => {
        if (typeof UnifiedStorageManager === 'undefined') {
            if (statusEl) statusEl.textContent = '❌ UnifiedStorageManager 未載入';
            return false;
        }

        const manager = new UnifiedStorageManager();
        
        try {
            const result = await manager.backupToGitHub({
                onStatus: (msg) => {
                    if (statusEl) statusEl.textContent = msg;
                }
            });

            if (result.success) {
                const syncMsg = result.isSplit 
                    ? `✅ 推送完成 (分割 ${result.partCount} 部分)`
                    : '✅ 推送備份完成';
                if (statusEl) statusEl.textContent = syncMsg;
                return true;
            }
            return false;
        } catch (err) {
            console.error('GitHub 備份錯誤:', err);
            if (statusEl) statusEl.textContent = `❌ 推送失敗：${err.message}`;
            return false;
        }
    };

    const githubPullBackup = async (statusEl) => {
        if (typeof UnifiedStorageManager === 'undefined') {
            if (statusEl) statusEl.textContent = '❌ UnifiedStorageManager 未載入';
            return false;
        }

        const manager = new UnifiedStorageManager();
        
        try {
            const result = await manager.restoreFromGitHub({
                onStatus: (msg) => {
                    if (statusEl) statusEl.textContent = msg;
                },
                onProgress: (current, total) => {
                    if (statusEl) statusEl.textContent = `正在下載分割 ${current}/${total}...`;
                }
            });

            if (result.success) {
                const syncMsg = result.restoredFrom === 'split'
                    ? `✅ 還原完成 (分割 ${result.partCount} 部分)`
                    : '✅ 拉取還原完成';
                if (statusEl) statusEl.textContent = syncMsg;
                
                refreshGitHubSection();
                updateCharListUI();
                updateUserListUI();
                updateNpcListUI();
                
                return true;
            }
            return false;
        } catch (err) {
            console.error('GitHub 還原錯誤:', err);
            if (statusEl) statusEl.textContent = `❌ 拉取失敗：${err.message}`;
            return false;
        }
    };

    githubSyncPushBtn?.addEventListener('click', async () => {
        await githubPushBackup(githubSyncStatus);
        refreshGitHubSection();
    });

    githubSyncPullBtn?.addEventListener('click', async () => {
        await githubPullBackup(githubSyncStatus);
        refreshGitHubSection();
    });

    window.addEventListener('message', (event) => {
        const data = event.data;
        if (!data || typeof data !== 'object') return;
        if (data.type === 'GITHUB_SYNC_RESULT') {
            if (data.direction === 'push') {
                if (githubSyncStatus) githubSyncStatus.textContent = data.success ? '推送備份完成' : `推送失敗：${data.error || '未知錯誤'}`;
            } else if (data.direction === 'pull') {
                if (githubSyncStatus) githubSyncStatus.textContent = data.success ? `拉取還原完成（${data.count || 0} 筆資料）` : `拉取失敗：${data.error || '未知錯誤'}`;
            }
        }
    });

    githubDisconnectBtn?.addEventListener('click', () => {
        if (!confirm('確定要中斷 GitHub 連接？備份資料仍保留在 GitHub 上，但此裝置將不再同步。')) return;
        localStorage.removeItem('sx_github_token');
        localStorage.removeItem('sx_github_user');
        localStorage.removeItem('sx_github_repo_name');
        localStorage.removeItem('sx_github_avatar_url');
        localStorage.removeItem('sx_github_last_sync');
        localStorage.removeItem('sx_guest_mode');
        refreshGitHubSection();
    });

    githubSaveBtn?.addEventListener('click', async () => {
        if (githubPat?.value) {
            localStorage.setItem('sx_github_pat', githubPat.value.trim());
        }
        if (githubRepo?.value) localStorage.setItem('sx_github_repo', githubRepo.value.trim());
        if (githubFile?.value) localStorage.setItem('sx_github_backup_file', githubFile.value.trim());
        
        const token = localStorage.getItem('sx_github_pat');
        if (token) {
            setGithubStatus('正在驗證 Token...');
            try {
                const userResp = await fetch('https://api.github.com/user', {
                    headers: { Authorization: `token ${token}` }
                });
                if (userResp.ok) {
                    const userData = await userResp.json();
                    localStorage.setItem('sx_github_token', token);
                    localStorage.setItem('sx_github_user', userData.login);
                    localStorage.setItem('sx_github_repo_name', localStorage.getItem('sx_github_repo') || 'sxiphone-backup');
                    if (userData.avatar_url) localStorage.setItem('sx_github_avatar_url', userData.avatar_url);
                    setGithubStatus('✅ Token 驗證成功，已連接 GitHub');
                    refreshGitHubSection();
                } else {
                    setGithubStatus('❌ Token 無效或已過期');
                }
            } catch (err) {
                setGithubStatus(`❌ 驗證失敗：${err.message}`);
            }
        } else {
            setGithubStatus('已儲存設定');
        }
    });

    githubBackupBtn?.addEventListener('click', async () => {
        const success = await githubPushBackup(githubStatus);
        if (success) refreshGitHubSection();
    });

    githubRestoreBtn?.addEventListener('click', async () => {
        const success = await githubPullBackup(githubStatus);
        if (success) refreshGitHubSection();
    });

    // ==================== 雲端備份 (Supabase / Xata) ====================
    const BACKUP_PROVIDER_KEY = 'sx_backup_provider';
    const SUPABASE_URL_KEY = 'sx_supabase_url';
    const SUPABASE_KEY_KEY = 'sx_supabase_key';
    const XATA_URL_KEY = 'sx_xata_url';
    const XATA_KEY_KEY = 'sx_xata_key';
    const BACKUP_TABLE_KEY = 'sx_backup_table';

    const backupProviderSelect = document.getElementById('backup-provider');
    const supabaseConfigDiv = document.getElementById('supabase-config');
    const xataConfigDiv = document.getElementById('xata-config');
    const supabaseUrlInput = document.getElementById('supabase-url');
    const supabaseKeyInput = document.getElementById('supabase-key');
    const xataUrlInput = document.getElementById('xata-url');
    const xataKeyInput = document.getElementById('xata-key');
    const backupTableInput = document.getElementById('backup-table');
    const backupSaveBtn = document.getElementById('backup-save');
    const backupPushBtn = document.getElementById('backup-push');
    const backupPullBtn = document.getElementById('backup-pull');
    const backupTestBtn = document.getElementById('backup-test');
    const backupClearBtn = document.getElementById('backup-clear');
    const backupStatusEl = document.getElementById('backup-status');

    const loadBackupSettings = () => {
        const provider = localStorage.getItem(BACKUP_PROVIDER_KEY) || 'supabase';
        const supabaseUrl = localStorage.getItem(SUPABASE_URL_KEY);
        const supabaseKey = localStorage.getItem(SUPABASE_KEY_KEY);
        const xataUrl = localStorage.getItem(XATA_URL_KEY);
        const xataKey = localStorage.getItem(XATA_KEY_KEY);
        const table = localStorage.getItem(BACKUP_TABLE_KEY) || 'sxiphone_backups';
        
        if (backupProviderSelect) backupProviderSelect.value = provider;
        if (supabaseUrlInput) supabaseUrlInput.value = supabaseUrl || '';
        if (supabaseKeyInput) supabaseKeyInput.value = supabaseKey || '';
        if (xataUrlInput) xataUrlInput.value = xataUrl || '';
        if (xataKeyInput) xataKeyInput.value = xataKey || '';
        if (backupTableInput) backupTableInput.value = table;
        
        toggleBackupProviderUI(provider);
        updateBackupStatus();
    };

    const toggleBackupProviderUI = (provider) => {
        if (supabaseConfigDiv) supabaseConfigDiv.style.display = provider === 'supabase' ? 'block' : 'none';
        if (xataConfigDiv) xataConfigDiv.style.display = provider === 'xata' ? 'block' : 'none';
    };

    const updateBackupStatus = () => {
        if (!backupStatusEl) return;
        const provider = localStorage.getItem(BACKUP_PROVIDER_KEY) || 'supabase';
        const hasSupabase = localStorage.getItem(SUPABASE_URL_KEY) && localStorage.getItem(SUPABASE_KEY_KEY);
        const hasXata = localStorage.getItem(XATA_URL_KEY) && localStorage.getItem(XATA_KEY_KEY);
        
        if ((provider === 'supabase' && hasSupabase) || (provider === 'xata' && hasXata)) {
            backupStatusEl.textContent = `✅ ${provider === 'supabase' ? 'Supabase' : 'Xata'} 已設定`;
        } else {
            backupStatusEl.textContent = '尚未設定';
        }
    };

    const setBackupStatus = (text) => {
        if (backupStatusEl) backupStatusEl.textContent = text;
    };

    const parseXataConnectionString = (connStr) => {
        if (!connStr) return null;
        
        if (connStr.startsWith('http://') || connStr.startsWith('https://')) {
            const match = connStr.match(/^(https?:\/\/[^\/]+\/db\/[^:]+)(?::(.+))?$/);
            if (match) {
                return {
                    baseUrl: match[1],
                    branch: match[2] || 'main'
                };
            }
            return { baseUrl: connStr.replace(/\/$/, ''), branch: 'main' };
        }
        
        const match = connStr.match(/^xata:\/\/([^:]+):([^@]+)@([^\/]+)\/db:([^:]+)(?::(.+))?$/);
        if (match) {
            const [, workspace, branch, region, dbName, explicitBranch] = match;
            const actualBranch = explicitBranch || branch;
            return {
                baseUrl: `https://${workspace}.${region}/db/${dbName}`,
                branch: actualBranch
            };
        }
        
        const simpleMatch = connStr.match(/^([^:]+):([^@]+)@([^\/]+)\/([^:]+):(.+)$/);
        if (simpleMatch) {
            const [, workspace, branch, region, , dbName] = simpleMatch;
            return {
                baseUrl: `https://${workspace}.${region}/db/${dbName}`,
                branch: branch
            };
        }
        
        return null;
    };

    const getBackupHeaders = () => {
        const provider = localStorage.getItem(BACKUP_PROVIDER_KEY) || 'supabase';
        const key = provider === 'supabase' 
            ? localStorage.getItem(SUPABASE_KEY_KEY)
            : localStorage.getItem(XATA_KEY_KEY);
        
        if (provider === 'supabase') {
            return {
                'apikey': key,
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            };
        } else {
            return {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            };
        }
    };

    const getBackupApiUrl = (action = 'list') => {
        const provider = localStorage.getItem(BACKUP_PROVIDER_KEY) || 'supabase';
        const table = localStorage.getItem(BACKUP_TABLE_KEY) || 'sxiphone_backups';
        
        if (provider === 'supabase') {
            const baseUrl = localStorage.getItem(SUPABASE_URL_KEY);
            switch (action) {
                case 'insert': return `${baseUrl}/rest/v1/${table}`;
                case 'list': return `${baseUrl}/rest/v1/${table}?select=*&order=exported_at.desc&limit=1`;
                default: return `${baseUrl}/rest/v1/${table}`;
            }
        } else {
            const xataConfig = parseXataConnectionString(localStorage.getItem(XATA_URL_KEY));
            if (!xataConfig) return null;
            const { baseUrl, branch } = xataConfig;
            switch (action) {
                case 'insert': return `${baseUrl}:${branch}/tables/${table}/data`;
                case 'list': return `${baseUrl}:${branch}/tables/${table}/query`;
                default: return `${baseUrl}:${branch}/tables/${table}/data`;
            }
        }
    };

    const testBackupConnection = async () => {
        const provider = localStorage.getItem(BACKUP_PROVIDER_KEY) || 'supabase';
        setBackupStatus('正在測試連線...');
        
        try {
            if (provider === 'supabase') {
                const url = localStorage.getItem(SUPABASE_URL_KEY);
                const key = localStorage.getItem(SUPABASE_KEY_KEY);
                if (!url || !key) {
                    setBackupStatus('❌ 請先設定 URL 和 Key');
                    return false;
                }
                const table = localStorage.getItem(BACKUP_TABLE_KEY) || 'sxiphone_backups';
                const resp = await fetch(`${url}/rest/v1/${table}?select=count&limit=1`, {
                    headers: getBackupHeaders()
                });
                if (resp.ok) {
                    setBackupStatus('✅ Supabase 連線成功');
                    return true;
                } else if (resp.status === 404) {
                    setBackupStatus('⚠️ 資料表不存在，需手動建立');
                    return true;
                }
                throw new Error(`連線失敗 (${resp.status})`);
            } else {
                const xataConfig = parseXataConnectionString(localStorage.getItem(XATA_URL_KEY));
                const key = localStorage.getItem(XATA_KEY_KEY);
                if (!xataConfig || !key) {
                    setBackupStatus('❌ 請先設定 Connection String 和 Key');
                    return false;
                }
                const table = localStorage.getItem(BACKUP_TABLE_KEY) || 'sxiphone_backups';
                const resp = await fetch(`${xataConfig.baseUrl}:${xataConfig.branch}/tables/${table}/query`, {
                    method: 'POST',
                    headers: getBackupHeaders(),
                    body: JSON.stringify({ page: { size: 1 } })
                });
                if (resp.ok) {
                    setBackupStatus('✅ Xata 連線成功');
                    return true;
                }
                throw new Error(`連線失敗 (${resp.status})`);
            }
        } catch (err) {
            setBackupStatus(`❌ 連線錯誤: ${err.message}`);
            return false;
        }
    };

    const pushBackup = async () => {
        const provider = localStorage.getItem(BACKUP_PROVIDER_KEY) || 'supabase';
        setBackupStatus('正在收集資料...');
        
        try {
            const allData = await collectAllStorageData();
            const dataHash = await generateDataHash(allData);
            const lastHash = localStorage.getItem('sx_backup_last_data_hash');
            
            if (dataHash === lastHash) {
                setBackupStatus('資料無變動，跳過備份');
                return true;
            }

            const payload = {
                id: `backup_${Date.now()}`,
                version: '3.0',
                exported_at: new Date().toISOString(),
                device: navigator.userAgent,
                data: allData,
                data_hash: dataHash,
                user_id: localStorage.getItem('sx_user_name') || 'default'
            };

            setBackupStatus('正在上傳備份...');
            
            if (provider === 'supabase') {
                const url = localStorage.getItem(SUPABASE_URL_KEY);
                const key = localStorage.getItem(SUPABASE_KEY_KEY);
                if (!url || !key) {
                    setBackupStatus('❌ 請先設定 URL 和 Key');
                    return false;
                }
                const table = localStorage.getItem(BACKUP_TABLE_KEY) || 'sxiphone_backups';
                const resp = await fetch(`${url}/rest/v1/${table}`, {
                    method: 'POST',
                    headers: getBackupHeaders(),
                    body: JSON.stringify(payload)
                });
                if (!resp.ok) {
                    if (resp.status === 404) {
                        setBackupStatus('資料表不存在，請先建立');
                        return false;
                    }
                    throw new Error(`上傳失敗 (${resp.status})`);
                }
            } else {
                const xataConfig = parseXataConnectionString(localStorage.getItem(XATA_URL_KEY));
                const key = localStorage.getItem(XATA_KEY_KEY);
                if (!xataConfig || !key) {
                    setBackupStatus('❌ 請先設定 Connection String 和 Key');
                    return false;
                }
                const table = localStorage.getItem(BACKUP_TABLE_KEY) || 'sxiphone_backups';
                const resp = await fetch(`${xataConfig.baseUrl}:${xataConfig.branch}/tables/${table}/data`, {
                    method: 'POST',
                    headers: getBackupHeaders(),
                    body: JSON.stringify(payload)
                });
                if (!resp.ok) {
                    const errData = await resp.json().catch(() => ({}));
                    throw new Error(errData.message || `上傳失敗 (${resp.status})`);
                }
            }

            localStorage.setItem('sx_backup_last_data_hash', dataHash);
            localStorage.setItem('sx_backup_last_sync', new Date().toLocaleString());
            setBackupStatus(`✅ ${provider === 'supabase' ? 'Supabase' : 'Xata'} 備份完成`);
            return true;
        } catch (err) {
            console.error('[Backup] 錯誤:', err);
            setBackupStatus(`❌ 備份失敗: ${err.message}`);
            return false;
        }
    };

    const pullBackup = async () => {
        const provider = localStorage.getItem(BACKUP_PROVIDER_KEY) || 'supabase';
        setBackupStatus('正在下載備份...');
        
        try {
            let latestBackup;
            
            if (provider === 'supabase') {
                const url = localStorage.getItem(SUPABASE_URL_KEY);
                const key = localStorage.getItem(SUPABASE_KEY_KEY);
                if (!url || !key) {
                    setBackupStatus('❌ 請先設定 URL 和 Key');
                    return false;
                }
                const table = localStorage.getItem(BACKUP_TABLE_KEY) || 'sxiphone_backups';
                const resp = await fetch(`${url}/rest/v1/${table}?select=*&order=exported_at.desc&limit=1`, {
                    headers: getBackupHeaders()
                });
                if (!resp.ok) throw new Error(`下載失敗 (${resp.status})`);
                const backups = await resp.json();
                if (!backups || backups.length === 0) {
                    setBackupStatus('❌ 找不到備份資料');
                    return false;
                }
                latestBackup = backups[0];
            } else {
                const xataConfig = parseXataConnectionString(localStorage.getItem(XATA_URL_KEY));
                const key = localStorage.getItem(XATA_KEY_KEY);
                if (!xataConfig || !key) {
                    setBackupStatus('❌ 請先設定 Connection String 和 Key');
                    return false;
                }
                const table = localStorage.getItem(BACKUP_TABLE_KEY) || 'sxiphone_backups';
                const resp = await fetch(`${xataConfig.baseUrl}:${xataConfig.branch}/tables/${table}/query`, {
                    method: 'POST',
                    headers: getBackupHeaders(),
                    body: JSON.stringify({
                        sort: { column: 'exported_at', direction: 'desc' },
                        page: { size: 1 }
                    })
                });
                if (!resp.ok) throw new Error(`下載失敗 (${resp.status})`);
                const result = await resp.json();
                if (!result.records || result.records.length === 0) {
                    setBackupStatus('❌ 找不到備份資料');
                    return false;
                }
                latestBackup = result.records[0];
            }

            setBackupStatus('正在還原資料...');
            const dataToRestore = latestBackup.data;
            if (!dataToRestore) throw new Error('備份格式不正確');
            
            const count = await restoreAllStorageData(dataToRestore);
            localStorage.setItem('sx_backup_last_sync', new Date().toLocaleString());
            setBackupStatus(`✅ 還原完成 (${count} 筆資料)`);
            alert(`✅ 已成功還原 ${count} 筆資料！\n\n建議重新整理頁面以確保所有資料正確載入。`);
            return true;
        } catch (err) {
            console.error('[Backup] 還原錯誤:', err);
            setBackupStatus(`❌ 還原失敗: ${err.message}`);
            return false;
        }
    };

    const generateDataHash = async (data) => {
        const sortedData = JSON.stringify(data, Object.keys(data).sort());
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(sortedData);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    backupProviderSelect?.addEventListener('change', (e) => {
        const provider = e.target.value;
        localStorage.setItem(BACKUP_PROVIDER_KEY, provider);
        toggleBackupProviderUI(provider);
        updateBackupStatus();
    });

    backupSaveBtn?.addEventListener('click', () => {
        const provider = backupProviderSelect?.value || 'supabase';
        localStorage.setItem(BACKUP_PROVIDER_KEY, provider);
        
        if (provider === 'supabase') {
            if (supabaseUrlInput?.value) localStorage.setItem(SUPABASE_URL_KEY, supabaseUrlInput.value.trim());
            if (supabaseKeyInput?.value) localStorage.setItem(SUPABASE_KEY_KEY, supabaseKeyInput.value.trim());
        } else {
            if (xataUrlInput?.value) localStorage.setItem(XATA_URL_KEY, xataUrlInput.value.trim());
            if (xataKeyInput?.value) localStorage.setItem(XATA_KEY_KEY, xataKeyInput.value.trim());
        }
        if (backupTableInput?.value) localStorage.setItem(BACKUP_TABLE_KEY, backupTableInput.value.trim());
        
        setBackupStatus('✅ 設定已儲存');
    });

    backupTestBtn?.addEventListener('click', testBackupConnection);
    backupPushBtn?.addEventListener('click', pushBackup);
    backupPullBtn?.addEventListener('click', pullBackup);

    backupClearBtn?.addEventListener('click', () => {
        if (!confirm('確定要清除備份設定？')) return;
        localStorage.removeItem(BACKUP_PROVIDER_KEY);
        localStorage.removeItem(SUPABASE_URL_KEY);
        localStorage.removeItem(SUPABASE_KEY_KEY);
        localStorage.removeItem(XATA_URL_KEY);
        localStorage.removeItem(XATA_KEY_KEY);
        localStorage.removeItem(BACKUP_TABLE_KEY);
        localStorage.removeItem('sx_backup_last_sync');
        localStorage.removeItem('sx_backup_last_data_hash');
        
        if (supabaseUrlInput) supabaseUrlInput.value = '';
        if (supabaseKeyInput) supabaseKeyInput.value = '';
        if (xataUrlInput) xataUrlInput.value = '';
        if (xataKeyInput) xataKeyInput.value = '';
        if (backupProviderSelect) backupProviderSelect.value = 'supabase';
        toggleBackupProviderUI('supabase');
        setBackupStatus('已清除設定');
    });

    loadBackupSettings();

    // ==================== 圖床設定 ====================
    const imageHostEnabledToggle = document.getElementById('image-host-enabled');
    const imageHostProviderSelect = document.getElementById('image-host-provider');
    const imageHostStatusEl = document.getElementById('image-host-status');
    const catboxUserhashInput = document.getElementById('catbox-userhash');

    const IMAGE_HOST_ENABLED_KEY = 'sx_image_host_enabled';
    const IMAGE_HOST_PROVIDER_KEY = 'sx_image_host_provider';
    const CATBOX_USERHASH_KEY = 'sx_catbox_userhash';

    const loadImageHostSettings = () => {
        const enabled = localStorage.getItem(IMAGE_HOST_ENABLED_KEY) === 'true';
        const provider = localStorage.getItem(IMAGE_HOST_PROVIDER_KEY) || 'catbox';
        const userhash = localStorage.getItem(CATBOX_USERHASH_KEY) || '';

        if (imageHostEnabledToggle) imageHostEnabledToggle.checked = enabled;
        if (imageHostProviderSelect) imageHostProviderSelect.value = provider;
        if (catboxUserhashInput) catboxUserhashInput.value = userhash;

        updateImageHostStatus();
    };

    const updateImageHostStatus = () => {
        if (!imageHostStatusEl) return;

        const enabled = localStorage.getItem(IMAGE_HOST_ENABLED_KEY) === 'true';
        const provider = localStorage.getItem(IMAGE_HOST_PROVIDER_KEY) || 'catbox';
        const userhash = localStorage.getItem(CATBOX_USERHASH_KEY);

        if (enabled) {
            const hasAccount = userhash && userhash.length > 0;
            if (hasAccount) {
                imageHostStatusEl.textContent = `✅ 已啟用 (${provider}，已登入帳號)`;
                imageHostStatusEl.style.color = '#34C759';
            } else {
                imageHostStatusEl.textContent = `✅ 已啟用 (${provider}，匿名模式)`;
                imageHostStatusEl.style.color = '#34C759';
            }
        } else {
            imageHostStatusEl.textContent = '狀態：未啟用';
            imageHostStatusEl.style.color = '#666';
        }
    };

    if (imageHostEnabledToggle) {
        imageHostEnabledToggle.addEventListener('change', () => {
            localStorage.setItem(IMAGE_HOST_ENABLED_KEY, imageHostEnabledToggle.checked);
            updateImageHostStatus();
            console.log('[ImageHost] 設定已更新:', imageHostEnabledToggle.checked);
        });
    }

    if (imageHostProviderSelect) {
        imageHostProviderSelect.addEventListener('change', () => {
            localStorage.setItem(IMAGE_HOST_PROVIDER_KEY, imageHostProviderSelect.value);
            updateImageHostStatus();
            console.log('[ImageHost] 服務已切換:', imageHostProviderSelect.value);
        });
    }

    if (catboxUserhashInput) {
        catboxUserhashInput.addEventListener('change', () => {
            localStorage.setItem(CATBOX_USERHASH_KEY, catboxUserhashInput.value.trim());
            updateImageHostStatus();
            console.log('[ImageHost] Userhash 已更新');
        });
    }

    loadImageHostSettings();

    // ==================== Supabase 一鍵設定 ====================
    const supabaseQuickUrlInput = document.getElementById('supabase-quick-url');
    const supabaseQuickKeyInput = document.getElementById('supabase-quick-key');
    const supabaseAutoToggle = document.getElementById('supabase-auto-toggle');
    const supabaseQuickEnableBtn = document.getElementById('supabase-quick-enable');
    const supabaseQuickTestBtn = document.getElementById('supabase-quick-test');
    const supabaseQuickStatusEl = document.getElementById('supabase-quick-status');
    const supabaseLastSyncEl = document.getElementById('supabase-last-sync');
    const supabaseBackupCountEl = document.getElementById('supabase-backup-count');

    const SUPABASE_AUTO_BACKUP_KEY = 'sx_supabase_auto_backup';
    const SUPABASE_BACKUP_COUNT_KEY = 'sx_supabase_backup_count';
    const SUPABASE_LAST_SYNC_KEY = 'sx_supabase_last_sync';

    const loadSupabaseQuickSettings = () => {
        const savedUrl = localStorage.getItem(SUPABASE_URL_KEY);
        const savedKey = localStorage.getItem(SUPABASE_KEY_KEY);
        const autoEnabled = localStorage.getItem(SUPABASE_AUTO_BACKUP_KEY) === 'true';
        const lastSync = localStorage.getItem(SUPABASE_LAST_SYNC_KEY);
        const backupCount = localStorage.getItem(SUPABASE_BACKUP_COUNT_KEY) || '0';

        if (supabaseQuickUrlInput) supabaseQuickUrlInput.value = savedUrl || '';
        if (supabaseQuickKeyInput) supabaseQuickKeyInput.value = savedKey || '';
        if (supabaseAutoToggle) supabaseAutoToggle.checked = autoEnabled;
        if (supabaseLastSyncEl) supabaseLastSyncEl.textContent = lastSync || '-';
        if (supabaseBackupCountEl) supabaseBackupCountEl.textContent = backupCount;

        updateSupabaseQuickStatus();
    };

    const updateSupabaseQuickStatus = () => {
        if (!supabaseQuickStatusEl) return;

        const url = localStorage.getItem(SUPABASE_URL_KEY);
        const key = localStorage.getItem(SUPABASE_KEY_KEY);
        const autoEnabled = localStorage.getItem(SUPABASE_AUTO_BACKUP_KEY) === 'true';

        if (!url || !key) {
            supabaseQuickStatusEl.textContent = '尚未設定';
            supabaseQuickStatusEl.style.color = '#666';
        } else if (autoEnabled) {
            supabaseQuickStatusEl.textContent = '✅ 已啟用，每 10 則對話自動備份';
            supabaseQuickStatusEl.style.color = '#34C759';
        } else {
            supabaseQuickStatusEl.textContent = '已設定，尚未啟用自動備份';
            supabaseQuickStatusEl.style.color = '#007AFF';
        }
    };

    const createSupabaseTableSQL = `
CREATE TABLE sxiphone_backups (
  id TEXT PRIMARY KEY,
  version TEXT,
  exported_at TIMESTAMPTZ,
  device TEXT,
  data JSONB,
  user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (optional)
ALTER TABLE sxiphone_backups ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust as needed)
CREATE POLICY "Allow all operations" ON sxiphone_backups
  FOR ALL USING (true) WITH CHECK (true);
`;

    const attemptCreateSupabaseTable = async (url, key, table) => {
        try {
            const testPayload = {
                id: `test_${Date.now()}`,
                version: '3.0',
                exported_at: new Date().toISOString(),
                device: 'test',
                data: { test: true },
                user_id: 'test'
            };

            const resp = await fetch(`${url}/rest/v1/${table}`, {
                method: 'POST',
                headers: {
                    'apikey': key,
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(testPayload)
            });

            if (resp.ok) {
                return { success: true };
            } else if (resp.status === 404) {
                return { 
                    success: false, 
                    needManualCreate: true,
                    sql: createSupabaseTableSQL
                };
            } else {
                const errData = await resp.json().catch(() => ({}));
                return { 
                    success: false, 
                    error: errData.message || `HTTP ${resp.status}`
                };
            }
        } catch (e) {
            return { success: false, error: e.message };
        }
    };

    const enableSupabaseQuickBackup = async () => {
        const url = supabaseQuickUrlInput?.value?.trim();
        const key = supabaseQuickKeyInput?.value?.trim();

        if (!url || !key) {
            if (supabaseQuickStatusEl) {
                supabaseQuickStatusEl.textContent = '❌請填入 URL 和 Key';
                supabaseQuickStatusEl.style.color = '#FF453A';
            }
            return;
        }

        if (!url.includes('supabase.co')) {
            if (supabaseQuickStatusEl) {
                supabaseQuickStatusEl.textContent = '❌ URL 格式不正確';
                supabaseQuickStatusEl.style.color = '#FF453A';
            }
            return;
        }

        if (supabaseQuickStatusEl) {
            supabaseQuickStatusEl.textContent = '正在設定...';
            supabaseQuickStatusEl.style.color = '#007AFF';
        }

        localStorage.setItem(SUPABASE_URL_KEY, url);
        localStorage.setItem(SUPABASE_KEY_KEY, key);
        localStorage.setItem(SUPABASE_TABLE_KEY, 'sxiphone_backups');

        const tableResult = await attemptCreateSupabaseTable(url, key, 'sxiphone_backups');

        if (tableResult.success) {
            localStorage.setItem(SUPABASE_AUTO_BACKUP_KEY, 'true');
            localStorage.setItem(SUPABASE_BACKUP_COUNT_KEY, '0');
            
            if (supabaseAutoToggle) supabaseAutoToggle.checked = true;
            updateSupabaseQuickStatus();
            
            if (supabaseQuickStatusEl) {
                supabaseQuickStatusEl.textContent = '✅ 已啟用，每 10 則對話自動備份';
                supabaseQuickStatusEl.style.color = '#34C759';
            }
        } else if (tableResult.needManualCreate) {
            if (supabaseQuickStatusEl) {
                supabaseQuickStatusEl.textContent = '⚠️ 資料表不存在，需手動建立';
                supabaseQuickStatusEl.style.color = '#FF9500';
            }
            
            const shouldCopySQL = confirm(
                'Supabase 資料表不存在。\n\n' +
                '請到 Supabase Dashboard → SQL Editor 建立資料表。\n\n' +
                '是否複製 SQL 語句到剪貼板？'
            );
            
            if (shouldCopySQL) {
                try {
                    await navigator.clipboard.writeText(createSupabaseTableSQL);
                    alert('SQL 語句已複製！\n\n請到 Supabase SQL Editor 貼上並執行，然後再點擊「一鍵啟用」。');
                } catch (e) {
                    alert('無法複製到剪貼板，請手動複製以下 SQL：\n\n' + createSupabaseTableSQL);
                }
            }
        } else {
            if (supabaseQuickStatusEl) {
                supabaseQuickStatusEl.textContent = `❌ 設定失敗: ${tableResult.error}`;
                supabaseQuickStatusEl.style.color = '#FF453A';
            }
        }
    };

    const testSupabaseQuickConnection = async () => {
        const url = localStorage.getItem(SUPABASE_URL_KEY);
        const key = localStorage.getItem(SUPABASE_KEY_KEY);

        if (!url || !key) {
            if (supabaseQuickStatusEl) {
                supabaseQuickStatusEl.textContent = '❌請先設定 URL 和 Key';
                supabaseQuickStatusEl.style.color = '#FF453A';
            }
            return;
        }

        if (supabaseQuickStatusEl) {
            supabaseQuickStatusEl.textContent = '正在測試連線...';
            supabaseQuickStatusEl.style.color = '#007AFF';
        }

        const result = await testSupabaseConnection();

        if (result) {
            if (supabaseQuickStatusEl) {
                supabaseQuickStatusEl.textContent = '✅連線成功';
                supabaseQuickStatusEl.style.color = '#34C759';
                setTimeout(updateSupabaseQuickStatus, 2000);
            }
        }
    };

    supabaseQuickEnableBtn?.addEventListener('click', enableSupabaseQuickBackup);
    supabaseQuickTestBtn?.addEventListener('click', testSupabaseQuickConnection);

    supabaseAutoToggle?.addEventListener('change', () => {
        const url = localStorage.getItem(SUPABASE_URL_KEY);
        const key = localStorage.getItem(SUPABASE_KEY_KEY);

        if (!url || !key && supabaseAutoToggle.checked) {
            supabaseAutoToggle.checked = false;
            if (supabaseQuickStatusEl) {
                supabaseQuickStatusEl.textContent = '❌請先設定 URL 和 Key';
                supabaseQuickStatusEl.style.color = '#FF453A';
            }
            return;
        }

        localStorage.setItem(SUPABASE_AUTO_BACKUP_KEY, supabaseAutoToggle.checked ? 'true' : 'false');
        updateSupabaseQuickStatus();
    });

    loadSupabaseQuickSettings();

    const supabaseMemorySyncPushBtn = document.getElementById('supabase-memory-sync-push');
    const supabaseMemorySyncPullBtn = document.getElementById('supabase-memory-sync-pull');
    const supabaseMemorySyncStatusEl = document.getElementById('supabase-memory-sync-status');

    const pushMemoryToSupabase = async () => {
        const url = localStorage.getItem(SUPABASE_URL_KEY);
        const key = localStorage.getItem(SUPABASE_KEY_KEY);
        const table = localStorage.getItem(SUPABASE_TABLE_KEY) || 'sxiphone_memories';

        if (!url || !key) {
            if (supabaseMemorySyncStatusEl) supabaseMemorySyncStatusEl.textContent = '❌ 請先設定 Supabase';
            return false;
        }

        if (supabaseMemorySyncStatusEl) supabaseMemorySyncStatusEl.textContent = '正在推送記憶...';

        try {
            const memories = [];
            const shortTermMemory = localStorage.getItem('sx_short_term_memory');
            if (shortTermMemory) {
                const parsed = JSON.parse(shortTermMemory);
                if (Array.isArray(parsed)) {
                    memories.push(...parsed);
                }
            }

            if (typeof localforage !== 'undefined') {
                const longTermMemories = [];
                await localforage.iterate((value, key) => {
                    if (key.startsWith('sx_memory_') || key.startsWith('sx_long_term_memory')) {
                        longTermMemories.push({ key, value });
                    }
                });
                if (longTermMemories.length > 0) {
                    memories.push({ type: 'long_term', items: longTermMemories });
                }
            }

            if (memories.length === 0) {
                if (supabaseMemorySyncStatusEl) supabaseMemorySyncStatusEl.textContent = '⚠️ 沒有記憶可同步';
                return false;
            }

            const payload = {
                id: `memory_${Date.now()}`,
                type: 'memory_sync',
                user_id: localStorage.getItem('sx_user_name') || 'default',
                device: navigator.userAgent,
                memories: memories,
                exported_at: new Date().toISOString()
            };

            const resp = await fetch(`${url}/rest/v1/${table}`, {
                method: 'POST',
                headers: {
                    'apikey': key,
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(payload)
            });

            if (!resp.ok) {
                if (resp.status === 404) {
                    if (supabaseMemorySyncStatusEl) supabaseMemorySyncStatusEl.textContent = '❌ 資料表不存在，請先建立';
                    return false;
                }
                throw new Error(`推送失敗 (${resp.status})`);
            }

            localStorage.setItem('sx_supabase_memory_last_sync', new Date().toLocaleString());
            if (supabaseMemorySyncStatusEl) supabaseMemorySyncStatusEl.textContent = `✅ 已推送 ${memories.length} 條記憶`;
            return true;
        } catch (e) {
            console.error('[Supabase] 記憶推送錯誤:', e);
            if (supabaseMemorySyncStatusEl) supabaseMemorySyncStatusEl.textContent = `❌ 推送失敗: ${e.message}`;
            return false;
        }
    };

    const pullMemoryFromSupabase = async () => {
        const url = localStorage.getItem(SUPABASE_URL_KEY);
        const key = localStorage.getItem(SUPABASE_KEY_KEY);
        const table = localStorage.getItem(SUPABASE_TABLE_KEY) || 'sxiphone_memories';

        if (!url || !key) {
            if (supabaseMemorySyncStatusEl) supabaseMemorySyncStatusEl.textContent = '❌ 請先設定 Supabase';
            return false;
        }

        if (supabaseMemorySyncStatusEl) supabaseMemorySyncStatusEl.textContent = '正在拉取記憶...';

        try {
            const resp = await fetch(`${url}/rest/v1/${table}?select=*&order=exported_at.desc&limit=1&type=eq.memory_sync`, {
                headers: {
                    'apikey': key,
                    'Authorization': `Bearer ${key}`
                }
            });

            if (!resp.ok) {
                throw new Error(`拉取失敗 (${resp.status})`);
            }

            const records = await resp.json();
            if (!records || records.length === 0) {
                if (supabaseMemorySyncStatusEl) supabaseMemorySyncStatusEl.textContent = '⚠️ 找不到記憶資料';
                return false;
            }

            const latestRecord = records[0];
            const memories = latestRecord.memories;
            if (!memories) {
                if (supabaseMemorySyncStatusEl) supabaseMemorySyncStatusEl.textContent = '❌ 記憶格式不正確';
                return false;
            }

            let mergedCount = 0;

            const shortTermMemories = memories.filter(m => !m.type || m.type !== 'long_term');
            if (shortTermMemories.length > 0) {
                const existing = localStorage.getItem('sx_short_term_memory');
                let existingMemories = [];
                if (existing) {
                    try {
                        existingMemories = JSON.parse(existing);
                    } catch {}
                }

                const existingIds = new Set(existingMemories.map(m => m.id));
                const newMemories = shortTermMemories.filter(m => !existingIds.has(m.id));
                const merged = [...existingMemories, ...newMemories];
                merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                
                localStorage.setItem('sx_short_term_memory', JSON.stringify(merged.slice(-100)));
                mergedCount += newMemories.length;
            }

            const longTermData = memories.find(m => m.type === 'long_term');
            if (longTermData && longTermData.items && typeof localforage !== 'undefined') {
                for (const item of longTermData.items) {
                    await localforage.setItem(item.key, item.value);
                    mergedCount++;
                }
            }

            localStorage.setItem('sx_supabase_memory_last_sync', new Date().toLocaleString());
            if (supabaseMemorySyncStatusEl) supabaseMemorySyncStatusEl.textContent = `✅ 已拉取並合併 ${mergedCount} 條記憶`;

            window.dispatchEvent(new CustomEvent('sxiphone-data-restored', {
                detail: { count: mergedCount, source: 'supabase-memory-pull' }
            }));

            return true;
        } catch (e) {
            console.error('[Supabase] 記憶拉取錯誤:', e);
            if (supabaseMemorySyncStatusEl) supabaseMemorySyncStatusEl.textContent = `❌ 拉取失敗: ${e.message}`;
            return false;
        }
    };

    supabaseMemorySyncPushBtn?.addEventListener('click', pushMemoryToSupabase);
    supabaseMemorySyncPullBtn?.addEventListener('click', pullMemoryFromSupabase);

    const lastMemorySync = localStorage.getItem('sx_supabase_memory_last_sync');
    if (lastMemorySync && supabaseMemorySyncStatusEl) {
        supabaseMemorySyncStatusEl.textContent = `上次同步: ${lastMemorySync}`;
    }

    // ==================== 自動備份設定 ====================
    const autoBackupEnabledToggle = document.getElementById('auto-backup-enabled');
    const autoBackupGithubToggle = document.getElementById('auto-backup-github');
    const autoBackupSupabaseToggle = document.getElementById('auto-backup-supabase');
    const autoBackupLocalToggle = document.getElementById('auto-backup-local');
    const autoBackupSaveBtn = document.getElementById('auto-backup-save');
    const autoBackupNowBtn = document.getElementById('auto-backup-now');
    const autoBackupStatusEl = document.getElementById('auto-backup-status');

    const loadAutoBackupSettings = () => {
        const enabled = localStorage.getItem('sx_auto_backup_enabled') !== 'false';
        const github = localStorage.getItem('sx_auto_backup_github') === 'true';
        const supabase = localStorage.getItem('sx_auto_backup_supabase') === 'true';
        const local = localStorage.getItem('sx_auto_backup_local') === 'true';

        if (autoBackupEnabledToggle) autoBackupEnabledToggle.checked = enabled;
        if (autoBackupGithubToggle) autoBackupGithubToggle.checked = github;
        if (autoBackupSupabaseToggle) autoBackupSupabaseToggle.checked = supabase;
        if (autoBackupLocalToggle) autoBackupLocalToggle.checked = local;

        updateAutoBackupStatus();
    };

    const updateAutoBackupStatus = () => {
        if (!autoBackupStatusEl) return;

        const enabled = localStorage.getItem('sx_auto_backup_enabled') !== 'false';
        const targets = [];
        
        if (localStorage.getItem('sx_auto_backup_github') === 'true') targets.push('GitHub');
        if (localStorage.getItem('sx_auto_backup_supabase') === 'true') targets.push('Supabase');
        if (localStorage.getItem('sx_auto_backup_local') === 'true') targets.push('本地');

        if (!enabled) {
            autoBackupStatusEl.textContent = '自動備份已停用';
        } else if (targets.length === 0) {
            autoBackupStatusEl.textContent = '已啟用，但未選擇備份目標';
        } else {
            autoBackupStatusEl.textContent = `已啟用，備份到: ${targets.join(', ')}`;
        }
    };

    autoBackupSaveBtn?.addEventListener('click', () => {
        localStorage.setItem('sx_auto_backup_enabled', autoBackupEnabledToggle?.checked ? 'true' : 'false');
        localStorage.setItem('sx_auto_backup_github', autoBackupGithubToggle?.checked ? 'true' : 'false');
        localStorage.setItem('sx_auto_backup_supabase', autoBackupSupabaseToggle?.checked ? 'true' : 'false');
        localStorage.setItem('sx_auto_backup_local', autoBackupLocalToggle?.checked ? 'true' : 'false');

        updateAutoBackupStatus();
        if (autoBackupStatusEl) {
            autoBackupStatusEl.textContent = '✅ 設定已儲存';
            setTimeout(updateAutoBackupStatus, 2000);
        }
    });

    autoBackupNowBtn?.addEventListener('click', async () => {
        if (autoBackupStatusEl) autoBackupStatusEl.textContent = '正在執行備份...';

        const results = { github: null, supabase: null, local: null };

        if (localStorage.getItem('sx_auto_backup_github') === 'true') {
            try {
                results.github = await githubPushBackup(autoBackupStatusEl);
            } catch (e) {
                results.github = false;
            }
        }

        if (localStorage.getItem('sx_auto_backup_supabase') === 'true') {
            try {
                results.supabase = await supabasePushBackup();
            } catch (e) {
                results.supabase = false;
            }
        }

        if (localStorage.getItem('sx_auto_backup_local') === 'true') {
            try {
                await quickBackupFull();
                results.local = true;
            } catch (e) {
                results.local = false;
            }
        }

        const successCount = Object.values(results).filter(v => v === true).length;
        const totalTargets = Object.values(results).filter(v => v !== null).length;

        if (autoBackupStatusEl) {
            autoBackupStatusEl.textContent = `✅ 備份完成 (${successCount}/${totalTargets} 成功)`;
        }
    });

    loadAutoBackupSettings();

    // ==================== 本地檔案備援 ====================
    const localFolderExportBtn = document.getElementById('local-folder-export');
    const localFolderImportBtn = document.getElementById('local-folder-import');
    const localFolderStatusEl = document.getElementById('local-folder-status');
    const quickBackupFullBtn = document.getElementById('quick-backup-full');
    const quickBackupMinimalBtn = document.getElementById('quick-backup-minimal');

    const exportToFolder = async () => {
        if (!('showSaveFilePicker' in window)) {
            if (localFolderStatusEl) localFolderStatusEl.textContent = '瀏覽器不支援 File System API';
            return false;
        }

        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: `sxiphone_backup_${new Date().toISOString().slice(0, 10)}.json`,
                types: [{
                    description: 'JSON Backup',
                    accept: { 'application/json': ['.json'] }
                }]
            });

            const writable = await handle.createWritable();
            
            const allData = await collectAllStorageData();
            const payload = {
                version: '3.0',
                exportedAt: new Date().toISOString(),
                device: navigator.userAgent,
                data: allData
            };

            await writable.write(JSON.stringify(payload, null, 2));
            await writable.close();

            if (localFolderStatusEl) localFolderStatusEl.textContent = '✅ 已匯出到本地檔案';
            return true;
        } catch (err) {
            if (err.name === 'AbortError') {
                if (localFolderStatusEl) localFolderStatusEl.textContent = '已取消';
            } else {
                if (localFolderStatusEl) localFolderStatusEl.textContent = `❌ 匯出失敗: ${err.message}`;
            }
            return false;
        }
    };

    const importFromFolder = async () => {
        if (!('showOpenFilePicker' in window)) {
            if (localFolderStatusEl) localFolderStatusEl.textContent = '瀏覽器不支援 File System API';
            return false;
        }

        try {
            const [handle] = await window.showOpenFilePicker({
                types: [{
                    description: 'JSON Backup',
                    accept: { 'application/json': ['.json'] }
                }]
            });

            const file = await handle.getFile();
            const content = await file.text();
            const payload = JSON.parse(content);

            if (!payload.data && !payload.localStorage) {
                throw new Error('備份格式不正確');
            }

            let dataToRestore = payload.data || { localStorage: payload.localStorage || {}, localforage: payload.localforage || {} };
            const count = await restoreAllStorageData(dataToRestore);

            if (localFolderStatusEl) localFolderStatusEl.textContent = `✅ 已從本地檔案還原 (${count} 筆資料)`;
            alert(`✅ 已成功還原 ${count} 筆資料！\n\n建議重新整理頁面以確保所有資料正確載入。`);
            return true;
        } catch (err) {
            if (err.name === 'AbortError') {
                if (localFolderStatusEl) localFolderStatusEl.textContent = '已取消';
            } else {
                if (localFolderStatusEl) localFolderStatusEl.textContent = `❌ 匯入失敗: ${err.message}`;
            }
            return false;
        }
    };

    const quickBackupFull = async () => {
        const allData = await collectAllStorageData();
        const payload = {
            version: '3.0',
            exportedAt: new Date().toISOString(),
            device: navigator.userAgent,
            data: allData
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `sxiphone_full_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);

        if (localFolderStatusEl) localFolderStatusEl.textContent = '✅ 完整備份已下載';
    };

    const quickBackupMinimal = async () => {
        const minimalData = {
            masks: JSON.parse(localStorage.getItem('sx_masks') || '[]'),
            characters: JSON.parse(localStorage.getItem('sx_characters') || '[]'),
            users: JSON.parse(localStorage.getItem('sx_users') || '[]'),
            activeCharName: localStorage.getItem('sx_char_name'),
            userName: localStorage.getItem('sx_user_name'),
            apiConfigs: JSON.parse(localStorage.getItem('api_configs') || '[]')
        };

        const payload = {
            version: '3.0-minimal',
            exportedAt: new Date().toISOString(),
            data: { localStorage: {}, localforage: {} }
        };

        for (const [key, value] of Object.entries(minimalData)) {
            if (value !== null && value !== undefined) {
                payload.data.localStorage[key] = typeof value === 'string' ? value : JSON.stringify(value);
            }
        }

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `sxiphone_minimal_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);

        if (localFolderStatusEl) localFolderStatusEl.textContent = '✅ 最小備份已下載';
    };

    localFolderExportBtn?.addEventListener('click', exportToFolder);
    localFolderImportBtn?.addEventListener('click', importFromFolder);
    quickBackupFullBtn?.addEventListener('click', quickBackupFull);
    quickBackupMinimalBtn?.addEventListener('click', quickBackupMinimal);

    const applySelectedChar = (char) => {
        if (!char) {
            console.warn('[Settings] applySelectedChar: char is null');
            return;
        }
        console.log('[Settings] applySelectedChar:', char.name, 'personality:', char.personality?.slice(0, 30));
        
        const nameInput = document.getElementById('char-name-input');
        const avatarInput = document.getElementById('char-avatar-input');
        const personalityInput = document.getElementById('char-personality-input');
        const backgroundInput = document.getElementById('char-background-input');
        const worldbookInput = document.getElementById('char-worldbook-input');
        const examplesInput = document.getElementById('char-examples-input');
        const sleepStartInput = document.getElementById('char-sleep-start');
        const sleepEndInput = document.getElementById('char-sleep-end');
        const memoryApiSelect = document.getElementById('char-memory-api-select');
        
        if (nameInput) nameInput.value = char.name || '';
        if (avatarInput) avatarInput.value = char.avatar || '';
        if (personalityInput) personalityInput.value = char.personality || '';
        if (backgroundInput) backgroundInput.value = char.background || '';
        if (worldbookInput) worldbookInput.value = char.worldBook || char.worldbook || '';
        if (examplesInput) examplesInput.value = char.examples || '';
        if (sleepStartInput) sleepStartInput.value = char.sleepStart || localStorage.getItem('sx_ai_sleep_start') || '23:00';
        if (sleepEndInput) sleepEndInput.value = char.sleepEnd || localStorage.getItem('sx_ai_sleep_end') || '07:00';
        if (memoryApiSelect) memoryApiSelect.value = char.memoryApi || '';
        if (typeof updateCharAvatarPreview === 'function') {
            updateCharAvatarPreview(char.avatar || '');
        }
        
        try {
            localStorage.setItem('sx_char_name', char.name || '');
            localStorage.setItem('sx_char_avatar', char.avatar || '');
            localStorage.setItem('sx_char_personality', char.personality || '');
            localStorage.setItem('sx_char_background', char.background || '');
            localStorage.setItem('sx_char_examples', char.examples || '');
            
            const verify = {
                name: localStorage.getItem('sx_char_name'),
                personality: localStorage.getItem('sx_char_personality'),
                background: localStorage.getItem('sx_char_background'),
                examples: localStorage.getItem('sx_char_examples')
            };
            console.log('[Settings] 驗證 localStorage 寫入:', verify);
        } catch (e) {
            console.error('[Settings] localStorage 寫入失敗:', e);
        }
        
        window.parent?.postMessage({ 
            type: 'CHARACTER_UPDATED', 
            payload: { 
                name: char.name, 
                avatar: char.avatar, 
                personality: char.personality, 
                background: char.background,
                examples: char.examples
            }
        }, '*');
    };

    const refreshMemoryApiSelect = () => {
        const select = document.getElementById('char-memory-api-select');
        if (!select) return;
        const currentApis = JSON.parse(localStorage.getItem('api_configs') || '[]');
        select.innerHTML = '<option value="">使用主要 API</option>' +
            currentApis.map((api, idx) => `<option value="${idx}">${api.name} (${api.model})</option>`).join('');
    };

    refreshMemoryApiSelect();

    const applySelectedUser = (user) => {
        if (!user) {
            console.warn('[Settings] applySelectedUser: user is null');
            return;
        }
        console.log('[Settings] applySelectedUser:', user.name);
        
        const nameInput = document.getElementById('user-name-input');
        const avatarInput = document.getElementById('user-avatar-input');
        const personalityInput = document.getElementById('user-personality-input');
        const backgroundInput = document.getElementById('user-background-input');
        
        if (nameInput) nameInput.value = user.name || '';
        if (avatarInput) avatarInput.value = user.avatar || '';
        if (personalityInput) personalityInput.value = user.personality || '';
        if (backgroundInput) backgroundInput.value = user.background || '';
        
        try {
            localStorage.setItem('sx_user_name', user.name || 'User');
            localStorage.setItem('sx_user_avatar', user.avatar || '');
            localStorage.setItem('sx_user_personality', user.personality || '');
            localStorage.setItem('sx_user_background', user.background || '');
            console.log('[Settings] 已更新用戶 localStorage');
            
            // 發送消息通知 Chat 更新
            window.parent?.postMessage({ 
                type: 'USER_SETTINGS_UPDATED', 
                payload: { 
                    name: user.name || 'User', 
                    avatar: user.avatar || '', 
                    personality: user.personality || '', 
                    background: user.background || '' 
                }
            }, '*');
            console.log('[Settings] 已發送 USER_SETTINGS_UPDATED 消息');
        } catch (e) {
            console.error('[Settings] 用戶 localStorage 寫入失敗:', e);
        }
    };

    const applySelectedNpc = (npc) => {
        if (!npc) return;
        const nameInput = document.getElementById('npc-name-input');
        const avatarInput = document.getElementById('npc-avatar-input');
        const roleInput = document.getElementById('npc-role-input');
        const notesInput = document.getElementById('npc-notes-input');
        if (nameInput) nameInput.value = npc.name || '';
        if (avatarInput) avatarInput.value = npc.avatar || '';
        if (roleInput) roleInput.value = npc.role || '';
        if (notesInput) notesInput.value = npc.notes || '';
    };

    const renderCharList = () => {
        const listEl = document.getElementById('char-list');
        if (!listEl) return;
        const chars = loadCharList();
        console.log('[Settings] renderCharList: 共', chars.length, '個角色', chars.map(c => c.name));
        if (!chars.length) {
            listEl.innerHTML = '<div class="empty-tip">尚未新增角色</div>';
            return;
        }
        listEl.innerHTML = chars.map((char, idx) => `
            <button class="ios-pill" type="button" data-char-index="${idx}">${char.name || '未命名角色'}</button>
        `).join('');
        listEl.querySelectorAll('[data-char-index]').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = Number(btn.dataset.charIndex);
                const chars = loadCharList();
                const selected = chars[index];
                console.log('[Settings] 點擊角色按鈕，索引:', index, '角色:', selected?.name);
                if (selected) {
                    applySelectedChar(selected);
                } else {
                    console.warn('[Settings] 找不到索引', index, '的角色');
                }
            });
        });
    };

    const renderUserList = () => {
        const listEl = document.getElementById('user-list');
        if (!listEl) return;
        const users = loadUserList();
        console.log('[Settings] renderUserList: 共', users.length, '個用戶');
        if (!users.length) {
            listEl.innerHTML = '<div class="empty-tip">尚未新增用戶</div>';
            return;
        }
        listEl.innerHTML = users.map((user, idx) => `
            <button class="ios-pill" type="button" data-user-index="${idx}">${user.name || '未命名用戶'}</button>
        `).join('');
        listEl.querySelectorAll('[data-user-index]').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = Number(btn.dataset.userIndex);
                const users = loadUserList();
                const selected = users[index];
                console.log('[Settings] 點擊用戶按鈕，索引:', index, '用戶:', selected?.name);
                if (selected) {
                    applySelectedUser(selected);
                }
            });
        });
    };

    const renderNpcList = () => {
        const listEl = document.getElementById('npc-list');
        if (!listEl) return;
        const npcs = loadNpcList();
        if (!npcs.length) {
            listEl.innerHTML = '<div class="empty-tip">尚未新增 NPC</div>';
            return;
        }
        listEl.innerHTML = npcs.map((npc, idx) => `
            <button class="ios-pill" type="button" data-npc-index="${idx}">${npc.name || '未命名 NPC'}</button>
        `).join('');
        listEl.querySelectorAll('[data-npc-index]').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = Number(btn.dataset.npcIndex);
                const selected = loadNpcList()[index];
                applySelectedNpc(selected);
            });
        });
    };

    const updateCharListUI = () => {
        renderCharList();
        renderUserList();
        renderNpcList();
    };

    const updateUserListUI = () => {
        renderUserList();
    };

    const updateNpcListUI = () => {
        renderNpcList();
    };

    const charSaveBtn = document.getElementById('char-save-btn');
    const charCancelBtn = document.getElementById('char-cancel-btn');
    const userAddBtn = document.getElementById('user-add-btn');
    const userSaveBtn = document.getElementById('user-save-btn');
    const userCancelBtn = document.getElementById('user-cancel-btn');
    const npcAddBtn = document.getElementById('npc-add-btn');
    const npcSaveBtn = document.getElementById('npc-save-btn');
    const npcCancelBtn = document.getElementById('npc-cancel-btn');

    charSaveBtn?.addEventListener('click', async () => {
        const name = document.getElementById('char-name-input')?.value.trim() || '';
        const avatar = document.getElementById('char-avatar-input')?.value.trim() || '';
        const personality = document.getElementById('char-personality-input')?.value.trim() || '';
        const background = document.getElementById('char-background-input')?.value.trim() || '';
        const worldBook = document.getElementById('char-worldbook-input')?.value.trim() || '';
        const examples = document.getElementById('char-examples-input')?.value.trim() || '';
        const sleepStart = document.getElementById('char-sleep-start')?.value || '';
        const sleepEnd = document.getElementById('char-sleep-end')?.value || '';
        const memoryApi = document.getElementById('char-memory-api-select')?.value || '';
        
        console.log('[Settings] 準備儲存角色:', { name, avatar: avatar?.slice(0, 30), personality: personality?.slice(0, 30), background: background?.slice(0, 30), examples: examples?.slice(0, 30) });
        
        if (!name && !avatar) {
            alert('請輸入角色名稱或頭貼');
            return;
        }
        
        const list = loadCharList();
        const existingIdx = list.findIndex(item => item.name === name && name);
        const payload = { name, avatar, personality, background, worldBook, examples, sleepStart, sleepEnd, memoryApi };
        
        if (existingIdx >= 0) {
            list[existingIdx] = payload;
            console.log('[Settings] 更新現有角色，索引:', existingIdx);
        } else {
            list.unshift(payload);
            console.log('[Settings] 新增角色到列表開頭');
        }
        
        saveCharList(list);
        console.log('[Settings] 已儲存到 sx_characters，共', list.length, '個角色');
        
        try {
            localStorage.setItem('sx_char_name', payload.name || '');
            localStorage.setItem('sx_char_avatar', payload.avatar || '');
            localStorage.setItem('sx_char_personality', payload.personality || '');
            localStorage.setItem('sx_char_background', payload.background || '');
            localStorage.setItem('sx_char_examples', payload.examples || '');
            
            const verifyName = localStorage.getItem('sx_char_name');
            const verifyPers = localStorage.getItem('sx_char_personality');
            const verifyBack = localStorage.getItem('sx_char_background');
            const verifyExamples = localStorage.getItem('sx_char_examples');
            console.log('[Settings] 驗證獨立 key 儲存:', { verifyName, verifyPers: verifyPers?.slice(0, 30), verifyBack: verifyBack?.slice(0, 30), verifyExamples: verifyExamples?.slice(0, 30) });
        } catch (e) {
            console.error('[Settings] localStorage 寫入失敗:', e);
            alert('儲存失敗：' + e.message);
            return;
        }
        
        if (payload.sleepStart) {
            localStorage.setItem('sx_ai_sleep_start', payload.sleepStart);
        }
        if (payload.sleepEnd) {
            localStorage.setItem('sx_ai_sleep_end', payload.sleepEnd);
        }
        
        let currentMasks = JSON.parse(localStorage.getItem('sx_masks') || '[]');
        if (currentMasks.length === 0) {
            currentMasks.push({ name: payload.name, avatar: payload.avatar, personality: payload.personality, background: payload.background, worldBook: payload.worldBook, examples: payload.examples });
        } else {
            currentMasks[0] = { ...currentMasks[0], name: payload.name, avatar: payload.avatar, personality: payload.personality, background: payload.background, worldBook: payload.worldBook, examples: payload.examples };
        }
        localStorage.setItem('sx_masks', JSON.stringify(currentMasks));
        masks = currentMasks;
        
        updateCharListUI();
        
        window.parent?.postMessage({ 
            type: 'CHARACTER_UPDATED', 
            payload: { name: payload.name, avatar: payload.avatar, personality: payload.personality, background: payload.background, examples: payload.examples }
        }, '*');
        
        console.log('[Settings] 角色儲存完成');
        alert('✅ 角色已儲存');
    });

    charCancelBtn?.addEventListener('click', () => {
        applySelectedChar({ name: '', avatar: '', personality: '', background: '', worldBook: '', examples: '', sleepStart: '', sleepEnd: '', memoryApi: '' });
    });

    userAddBtn?.addEventListener('click', () => {
        applySelectedUser({ name: '', avatar: '', personality: '', background: '' });
    });

    userSaveBtn?.addEventListener('click', async () => {
        const name = document.getElementById('user-name-input')?.value.trim() || '';
        const avatar = document.getElementById('user-avatar-input')?.value.trim() || '';
        const personality = document.getElementById('user-personality-input')?.value.trim() || '';
        const background = document.getElementById('user-background-input')?.value.trim() || '';
        if (!name && !avatar) {
            alert('請輸入用戶名稱或頭貼');
            return;
        }
        const list = loadUserList();
        const existingIdx = list.findIndex(item => item.name === name && name);
        const payload = { name, avatar, personality, background };
        if (existingIdx >= 0) list[existingIdx] = payload;
        else list.unshift(payload);
        saveUserList(list);
        
        localStorage.setItem('sx_user_name', payload.name || 'User');
        localStorage.setItem('sx_user_avatar', payload.avatar || '');
        localStorage.setItem('sx_user_personality', payload.personality || '');
        localStorage.setItem('sx_user_background', payload.background || '');
        
        updateCharListUI();
        
        window.parent?.postMessage({ 
            type: 'USER_SETTINGS_UPDATED', 
            payload: { name: payload.name, avatar: payload.avatar, personality: payload.personality, background: payload.background }
        }, '*');
        
        alert('✅ 用戶已儲存');
    });

    userCancelBtn?.addEventListener('click', () => {
        applySelectedUser({ name: '', avatar: '', personality: '', background: '' });
    });

    npcAddBtn?.addEventListener('click', () => {
        applySelectedNpc({ name: '', avatar: '', role: '', notes: '' });
    });

    npcSaveBtn?.addEventListener('click', async () => {
        const name = document.getElementById('npc-name-input')?.value.trim() || '';
        const avatar = document.getElementById('npc-avatar-input')?.value.trim() || '';
        const role = document.getElementById('npc-role-input')?.value.trim() || '';
        const notes = document.getElementById('npc-notes-input')?.value.trim() || '';
        if (!name && !avatar) {
            alert('請輸入 NPC 名稱或頭貼');
            return;
        }
        const list = loadNpcList();
        const existingIdx = list.findIndex(item => item.name === name && name);
        const payload = { name, avatar, role, notes };
        if (existingIdx >= 0) list[existingIdx] = payload;
        else list.unshift(payload);
        saveNpcList(list);
        await saveAll();
        updateCharListUI();
        alert('✅ NPC 已儲存');
    });

    npcCancelBtn?.addEventListener('click', () => {
        applySelectedNpc({ name: '', avatar: '', role: '', notes: '' });
    });

    updateCharListUI();

    const scrollToAnchor = (anchor) => {
        const map = {
            user: '#settings-user',
            char: '#settings-char',
            npc: '#settings-npc'
        };
        const target = map[anchor];
        if (!target) return;
        const el = document.querySelector(target);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            const details = el.querySelector('details');
            if (details) details.open = true;
        }
    };

    const params = new URLSearchParams(window.location.search);
    const anchor = params.get('anchor');
    if (anchor) {
        setTimeout(() => scrollToAnchor(anchor), 300);
    }

    // 4. 綁定按鈕與檔案事件
    const importFile = document.getElementById('importFile');
    if (importFile) importFile.onchange = handleImport;

    // 5. 修正導出備份邏輯
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.onclick = async () => {
            const allStorageData = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!key) continue;
                if (key.startsWith('sx_') || key.startsWith('api_') || key.startsWith('sxiphone')) {
                    const value = localStorage.getItem(key);
                    if (value && !isFunctionString(value)) {
                        allStorageData[key] = value;
                    }
                }
            }

            const dataToExport = {
                version: '3.0',
                exportedAt: new Date().toISOString(),
                device: navigator.userAgent,
                localStorage: allStorageData,
                masks, 
                apis, 
                activeApiIndex
            };

            if (typeof localforage !== 'undefined') {
                try {
                    const persistedData = await localforage.getItem('sx_app_persisted_data');
                    if (persistedData) {
                        dataToExport.localforage = persistedData;
                    }
                } catch (e) {
                    console.warn('[Export] localforage read failed:', e);
                }
            }
            
            const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `sx_backup_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
        };
    }

    loadBiliGeneratedTitles();

    initVoiceSettings();

    // 6. 執行返回處理器初始化
    initSettingsHandlers();
});

function loadBiliGeneratedTitles() {
    const target = document.getElementById('biliGeneratedTitles');
    if (!target) return;
    const raw = localStorage.getItem('sx_bili_generated_titles');
    if (!raw) {
        target.value = '';
        return;
    }
    try {
        const data = JSON.parse(raw);
        const header = data.updatedAt ? `更新時間：${data.updatedAt}\n\n` : '';
        const tabInfo = data.tab ? `分頁：${data.tab}\n\n` : '';
        const titles = Array.isArray(data.titles) ? data.titles.map((title, index) => `${index + 1}. ${title}`).join('\n') : '';
        target.value = `${header}${tabInfo}${titles}`.trim();
    } catch (e) {
        target.value = raw;
    }
}

function clearBiliGeneratedTitles() {
    localStorage.removeItem('sx_bili_generated_titles');
    loadBiliGeneratedTitles();
}
/* =========================================================
   3. 返回鍵與設定關閉 (核心邏輯)
========================================================= */

const saveSettingsData = () => {
    try {
        localStorage.setItem('sx_masks', JSON.stringify(masks));
        localStorage.setItem('api_configs', JSON.stringify(apis));
        localStorage.setItem('sx_active_api', activeApiIndex.toString());
        console.log("設定數據已保存至 localStorage");
    } catch (e) {
        console.error("保存設定數據失敗:", e);
    }
};

const saveToPersistentStorage = async () => {
    saveSettingsData();
    if (typeof localforage !== 'undefined') {
        try {
            const existingData = await localforage.getItem('sx_app_persisted_data') || {};
            await localforage.setItem('sx_app_persisted_data', {
                ...existingData,
                masks: masks,
                apis: apis,
                activeApiIndex: activeApiIndex
            });
            await localforage.setItem('api_configs_new', apis);
            await localforage.setItem('sx_active_api_new', activeApiIndex);
            console.log("設定數據已保存至 IndexedDB");
        } catch (e) {
            console.error("IndexedDB 保存失敗:", e);
        }
    }
};

window.addEventListener('pagehide', async () => {
    await saveToPersistentStorage();
});

document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'hidden') {
        await saveToPersistentStorage();
    }
});

window.addEventListener('beforeunload', async () => {
    await saveToPersistentStorage();
});

window.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || typeof data !== 'object') return;
    
    if (data.type === 'APP_WILL_CLOSE') {
        saveSettingsData();
    }
    
    // 處理語言變更
    if (data.type === 'LANGUAGE_CHANGED' && data.lang) {
        console.log('[Settings] 收到語言變更訊息:', data.lang);
        localStorage.setItem('sxiphone_lang', data.lang);
        // 更新語言選擇器
        const langSelect = document.getElementById('langSelect');
        if (langSelect) {
            langSelect.value = data.lang;
        }
        // 更新 html lang 屬性
        if (document.documentElement) {
            document.documentElement.lang = data.lang;
        }
        // 套用語言到 UI
        applyLanguageToUI();
        // 觸發語言更新回調
        if (typeof window.SxLanguage !== 'undefined' && typeof window.SxLanguage.triggerUpdate === 'function') {
            window.SxLanguage.triggerUpdate(data.lang);
        }
    }
});

async function handleBack() {
    console.log("正在執行返回邏輯...");
    
    await saveToPersistentStorage();

    const isIframe = window.parent && window.parent !== window;

    if (isIframe) {
        try {
            window.parent.postMessage({
                type: 'closeApp',
                appId: 'settings'
            }, '*');
            console.log("已透過 postMessage 發送關閉指令");
            return;
        } catch (e) {
            console.warn("postMessage 發送失敗:", e);
        }
    }

    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.style.display = 'none';
        return;
    }

    console.log("非容器環境，執行路徑跳轉回桌面...");
    const homePath = "../index.html"; 
    
    setTimeout(() => {
        window.location.replace(homePath);
    }, 100);
}

function initSettingsHandlers() {
    // 返回按鈕綁定
    const backBtn = document.querySelector('.back-button');
    if (backBtn) backBtn.onclick = handleBack;

    // 背景點擊關閉
    const container = document.querySelector('.settings-container');
    if (container) {
        container.addEventListener('click', (e) => {
            if (e.target === container) handleBack();
        });
    }

    // ESC 鍵關閉
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') handleBack();
    });
}

window.closeSettingsModal = handleBack;

/* =========================================================
   4. 面具管理功能
========================================================= */
/* =========================================================
   全域面具管理邏輯 (已移除上方預覽清單)
========================================================= */

/**
 * 刪除面具 (保留邏輯供其他功能調用)
 */
function deleteMask(i) {
    if (masks.length <= 1) {
        alert('請至少保留一個預設面具');
        return;
    }
    if (confirm('確定要刪除此面具設定嗎？')) {
        masks.splice(i, 1);
        saveAll();
        renderMasks();
    }
}

/* =========================================================
   5. API 管理功能
========================================================= */
async function initStorage() {
    try {
        // 1) 主資料來源：新 key
        let savedApis = await localforage.getItem('api_configs_new');
        let savedIndex = await localforage.getItem('sx_active_api_new');

        // 2) 輔助資料來源：舊整包 persisted
        const saved = await localforage.getItem('sx_app_persisted_data');
        if (saved) {
            masks = saved.masks || masks;
            localStorage.setItem('sx_user_name', saved.userName || 'User');
            localStorage.setItem('sx_user_avatar', saved.userAvatar || '');
            localStorage.setItem('sx_user_personality', saved.userPersonality || '');
            localStorage.setItem('sx_user_background', saved.userBackground || '');

            // 新 key 沒值時，沿用舊整包裡的 API 設定
            if (!Array.isArray(savedApis)) {
                savedApis = Array.isArray(saved.apis) ? saved.apis : [];
            }
            if (savedIndex === null || savedIndex === undefined) {
                savedIndex = Number(saved.activeApiIndex) || 0;
            }
        } else {
            masks = JSON.parse(localStorage.getItem('sx_masks')) || masks;
        }

        // 3) 自動遷移：若新 key 仍無值，讀 localStorage 備份
        if (!Array.isArray(savedApis)) {
            const oldApisRaw = localStorage.getItem('api_configs');
            savedApis = oldApisRaw ? JSON.parse(oldApisRaw) : [];
            await localforage.setItem('api_configs_new', savedApis);
        }
        if (savedIndex === null || savedIndex === undefined) {
            const oldIndexRaw = localStorage.getItem('sx_active_api');
            savedIndex = Number(oldIndexRaw) || 0;
            await localforage.setItem('sx_active_api_new', savedIndex);
        }

        // 4) 回填全域與 localStorage
        apis = Array.isArray(savedApis) ? savedApis : [];
        activeApiIndex = Number(savedIndex) || 0;
        localStorage.setItem('api_configs', JSON.stringify(apis));
        localStorage.setItem('sx_active_api', activeApiIndex.toString());

        console.log("資料加載成功:", apis.length, "個配置");
        renderApis();
    } catch (err) {
        console.error("儲存讀取錯誤:", err);
        // 保底機制：如果出錯仍嘗試讀取 localStorage
        apis = JSON.parse(localStorage.getItem('api_configs')) || [];
        activeApiIndex = Number(localStorage.getItem('sx_active_api')) || 0;
        renderApis();
    }
    try {
        // 同時存儲到 localforage (主要) 和 localStorage (備份)
        await localforage.setItem('api_configs_new', apis);
        await localforage.setItem('sx_active_api_new', activeApiIndex);
        
        // 保持 localStorage 同步，增加雙重保險
        localStorage.setItem('api_configs', JSON.stringify(apis));
        localStorage.setItem('sx_active_api', activeApiIndex);
    } catch (e) {
        console.error("儲存失敗", e);
    }
}

// --- 3. 介面渲染函式 ---
function renderApis() {
    const container = document.getElementById('apiList');
    if (!container) return;
    if (apis.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:gray;padding:20px;">尚未添加 API</p>';
        return;
    }
    
    const getTypeLabel = (type) => {
        switch(type) {
            case 'gemini': return '<span style="background:#4285f4;color:white;padding:2px 6px;border-radius:4px;font-size:10px;">Gemini</span>';
            case 'custom': return '<span style="background:#ff9800;color:white;padding:2px 6px;border-radius:4px;font-size:10px;">自訂</span>';
            default: return '<span style="background:#10a37f;color:white;padding:2px 6px;border-radius:4px;font-size:10px;">OpenAI</span>';
        }
    };
    
    container.innerHTML = apis.map((api, i) => `
        <div class="list-card" style="margin:10px;padding:12px;border-radius:12px;border:${i === activeApiIndex ? '2px solid #007AFF' : '1px solid #333'}">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="color:white;font-weight:600;">${api.name}</span>
                    ${getTypeLabel(api.type)}
                </div>
                <button onclick="setActiveApi(${i})" style="color:${i === activeApiIndex ? '#34C759' : '#007AFF'};background:none;border:none;cursor:pointer;">
                    ${i === activeApiIndex ? '● 使用中' : '啟用'}
                </button>
            </div>
            <div style="font-size:12px;color:gray;margin-top:8px;display:flex;justify-content:space-between;">
                <span>模型: ${api.model}</span>
                <button onclick="deleteApi(${i})" style="color:#FF3B30;background:none;border:none;cursor:pointer;">刪除</button>
            </div>
        </div>
    `).join('');
}

// --- 4. 修改後的 API 操作函式 ---
    // 切換 API 類型提示
    window.toggleApiUrlHint = function() {
        const typeSelect = document.getElementById('newApiType');
        const hintEl = document.getElementById('apiUrlHint');
        const urlInput = document.getElementById('newApiUrl');
        
        if (!typeSelect || !hintEl || !urlInput) return;
        
        const type = typeSelect.value;
        
        if (type === 'openai') {
            hintEl.innerHTML = '<span style="font-size:12px;color:#aaa;">OpenAI 相容格式：輸入 Base URL（如 https://openrouter.ai/api/v1），系統會自動加上 /chat/completions</span>';
            urlInput.placeholder = 'https://api.openai.com/v1';
        } else if (type === 'custom') {
            hintEl.innerHTML = '<span style="font-size:12px;color:#aaa;">自訂端點：輸入完整的 API URL，系統不會自動添加任何路徑</span>';
            urlInput.placeholder = 'https://your-api.com/your-endpoint';
        }
    };

    window.handleApiActions = async function(action) {
        const urlInput = document.getElementById('newApiUrl');
        const keyInput = document.getElementById('newApiKey');
        const modelSelect = document.getElementById('newApiModel');
        const typeSelect = document.getElementById('newApiType');
        
        const type = typeSelect?.value || 'openai';
        let url = urlInput.value.trim().replace(/\/$/, '');
        const key = keyInput.value.trim();

        if (!url) return alert("請輸入 API 網址");

        if (action === 'fetchModels' || action === 'test') {
            try {
                // OpenAI 相容格式的處理
                const headers = { 'Content-Type': 'application/json' };
                if (key) headers['Authorization'] = `Bearer ${key}`;
                
                // OpenRouter 需要額外的 headers
                if (url && url.includes('openrouter.ai')) {
                    headers['HTTP-Referer'] = window.location.origin || 'https://localhost';
                    headers['X-Title'] = 'SX iPhone App';
                }
                
                // 自訂端點可能不支援 /models
                let modelsUrl = type === 'custom' ? url : `${url}/models`;
                
                console.log('[API] 請求:', modelsUrl);
                const res = await fetch(modelsUrl, { method: 'GET', headers });
                console.log('[API] 狀態:', res.status, res.statusText);
                
                if (!res.ok) {
                    const errText = await res.text().catch(() => '');
                    throw new Error(`連線失敗 (${res.status}): ${errText.slice(0, 100)}`);
                }
                const data = await res.json();
                console.log('[API] 回應:', data);
                
                if (action === 'fetchModels') {
                    const list = data.data || data.models || (Array.isArray(data) ? data : []);
                    if (!list.length) {
                        throw new Error("未找到模型，回應格式可能不支援");
                    }
                    modelSelect.innerHTML = list.map(m => `<option value="${m.id || m.name || m}">${m.id || m.name || m}</option>`).join('');
                    alert(`✅ 成功拉取 ${list.length} 個模型！`);
                } else alert("✅ 連接測試成功！");
            } catch (err) {
                console.error('[API] 錯誤:', err);
                alert(`❌ 錯誤: ${err.message}\n\n可能原因:\n1. CORS 被攔截\n2. API 不支援 /models\n3. 網址格式錯誤\n4. API Key 不正確`);
            }
        }

        if (action === 'save') {
            if (!modelSelect.value && type !== 'custom') return alert("請選擇模型");
            try {
                let host;
                if (type === 'gemini') {
                    host = 'Gemini API';
                } else {
                    host = new URL(url).hostname;
                }
                apis.push({ 
                    name: host, 
                    url, 
                    key, 
                    model: modelSelect.value || 'custom',
                    type: type  // 新增 type 欄位標記 API 類型
                });
                await saveAll();
                localStorage.removeItem('sx_new_api_url');
                localStorage.removeItem('sx_new_api_key');
                urlInput.value = '';
                keyInput.value = '';
                modelSelect.innerHTML = '<option value="">請先拉取模型</option>';
                renderApis();
                alert("✅ 配置已成功保存");
            } catch (e) {
                alert("網址格式錯誤");
            }
        }
    }

// --- 5. 刪除與切換 ---
window.deleteApi = async function(i) {
    if(!confirm("確定刪除？")) return;
    apis.splice(i, 1);
    if (activeApiIndex >= apis.length) activeApiIndex = 0;
    await saveAll();
    renderApis();
}

window.setActiveApi = async function(i) {
    activeApiIndex = i;
    await saveAll();
    renderApis();
}

// --- 6. 啟動 ---
initStorage();
initSettingsHandlers();
/* =========================================================
   6. 備份導入與其他功能
========================================================= */
function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async evt => {
        try {
            const data = JSON.parse(evt.target.result);
            
            if (data.localStorage) {
                for (const [key, value] of Object.entries(data.localStorage)) {
                    if (key.startsWith('sx_') || key.startsWith('api_') || key.startsWith('sxiphone')) {
                        localStorage.setItem(key, value);
                    }
                }
            }
            
            if (data.localforage && typeof localforage !== 'undefined') {
                try {
                    await localforage.setItem('sx_app_persisted_data', data.localforage);
                } catch (lfErr) {
                    console.warn('[Import] localforage restore failed:', lfErr);
                }
            }
            
            masks = data.masks || masks;
            apis = data.apis || apis;
            activeApiIndex = data.activeApiIndex ?? 0;
            
            if (data.appFolders) {
                restoreAppFolders(data.appFolders);
            }
            
            saveAll();
            renderMasks(); 
            renderApis();
            
            alert('✅ 備份已導入！\n\n建議重新整理頁面以確保所有資料正確載入。');
        } catch (err) { 
            console.error('[Import] 解析失敗:', err);
            alert('❌ 解析失敗：' + err.message); 
        }
    };
    reader.readAsText(file);
}

function saveEnv() { saveAll(); alert('✅ 設定已儲存！'); }
function saveAppearance() { saveAll(); alert('✅ 視覺設定已套用！'); }

function saveNovaApi() {
    const url = document.getElementById('novaApiUrl')?.value.trim() || '';
    const key = document.getElementById('novaApiKey')?.value.trim() || '';
    localStorage.setItem('sx_nova_api_url', url);
    localStorage.setItem('sx_nova_api_key', key);
    alert('✅ NovaAI 設定已儲存');
}

window.clearChat = function () {
    if (confirm('確定清空對話？')) {
        if (UserEnv.isIOS()) iosTempData.chat_history = [];
        else localStorage.removeItem('sx_chat_history');
        alert('已清空');
    }
};

window.handleUserAvatar = function (input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = e => {
            if (UserEnv.isIOS()) { if(!iosTempData) iosTempData={}; iosTempData.sx_user_avatar = e.target.result; }
            else localStorage.setItem('sx_user_avatar', e.target.result);
            alert('頭像已更新');
        };
        reader.readAsDataURL(file);
    }
};
/* =========================================================
   語音服務設定 (STT/TTS/Voice Call)
   ========================================================= */
const VOICE_SETTINGS_KEY = 'sx_voice_settings';

const getDefaultVoiceSettings = () => ({
    sttApiUrl: '',
    sttApiKey: '',
    sttModel: 'whisper-1',
    sttLanguage: 'zh-TW',
    ttsLanguage: 'zh-TW',
    ttsApiUrl: '',
    ttsApiKey: '',
    ttsModel: 'tts-1',
    ttsVoice: 'alloy',
    ttsSpeed: 1.0,
    voiceAutoTts: true,
    voiceThinkDelay: 1.5,
    voiceProvider: '',
    thirdPartyVoiceUrl: '',
    thirdPartyVoiceKey: '',
    thirdPartyGroupId: '',
    thirdPartySttPath: '/audio/transcriptions',
    thirdPartyTtsPath: '/text_to_speech',
    thirdPartyVoiceName: '',
    thirdPartyRequestFormat: 'openai',
    thirdPartyAudioFormat: 'binary',
    audioResponsePath: 'data.audio',
    customTtsBody: '',
    useBuiltIn: true,
    builtInVoice: '',
    useTransformers: false,
    transformersModel: 'Xenova/whisper-small',
    enableTranslation: true,
    translateApiUrl: '',
    translateApiKey: ''
});

const loadVoiceSettings = () => {
    try {
        const raw = localStorage.getItem(VOICE_SETTINGS_KEY);
        if (!raw) return getDefaultVoiceSettings();
        const parsed = JSON.parse(raw);
        return { ...getDefaultVoiceSettings(), ...parsed };
    } catch {
        return getDefaultVoiceSettings();
    }
};

const saveVoiceSettings = (settings) => {
    const merged = { ...getDefaultVoiceSettings(), ...settings };
    localStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify(merged));
    updateVoiceServiceStatus();
    return merged;
};

const updateVoiceServiceStatus = () => {
    const settings = loadVoiceSettings();
    const sttReady = !!(settings.sttApiUrl && settings.sttApiKey);
    const ttsReady = !!(settings.ttsApiUrl && settings.ttsApiKey);
    const thirdPartyReady = !!(settings.voiceProvider && settings.thirdPartyVoiceUrl && settings.thirdPartyVoiceKey);
    const callReady = (sttReady && ttsReady) || thirdPartyReady;
    
    const hasBuiltInSTT = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    const hasBuiltInTTS = 'speechSynthesis' in window;
    const hasTransformers = true;

    const sttIndicator = document.getElementById('voice-stt-status-indicator');
    const ttsIndicator = document.getElementById('voice-tts-status-indicator');
    const callIndicator = document.getElementById('voice-call-ready-indicator');
    const builtInIndicator = document.getElementById('builtin-voice-status-indicator');
    const transformersIndicator = document.getElementById('transformers-status-indicator');

    if (builtInIndicator) {
        const sttStatus = hasBuiltInSTT ? '✅' : '❌';
        const ttsStatus = hasBuiltInTTS ? '✅' : '❌';
        builtInIndicator.innerHTML = `瀏覽器內建語音：STT ${sttStatus} / TTS ${ttsStatus}`;
        builtInIndicator.style.color = (hasBuiltInSTT || hasBuiltInTTS) ? '#34C759' : '#FF453A';
    }
    
    if (transformersIndicator) {
        transformersIndicator.innerHTML = `Transformers.js Whisper：✅ 可用（本機運算）`;
        transformersIndicator.style.color = '#34C759';
    }

    if (sttIndicator) {
        if (sttReady) {
            sttIndicator.textContent = `STT：✅ 已設定外部 API`;
            sttIndicator.style.color = '#34C759';
        } else if (settings.useTransformers) {
            sttIndicator.textContent = `STT：✅ 使用 Transformers.js`;
            sttIndicator.style.color = '#34C759';
        } else if (hasBuiltInSTT) {
            sttIndicator.textContent = `STT：⚠️ 使用瀏覽器內建`;
            sttIndicator.style.color = '#FF9500';
        } else {
            sttIndicator.textContent = `STT：❌ 尚未設定`;
            sttIndicator.style.color = '#FF453A';
        }
    }
    if (ttsIndicator) {
        if (ttsReady) {
            ttsIndicator.textContent = `TTS：✅ 已設定外部 API`;
            ttsIndicator.style.color = '#34C759';
        } else if (hasBuiltInTTS) {
            ttsIndicator.textContent = `TTS：⚠️ 使用瀏覽器內建`;
            ttsIndicator.style.color = '#FF9500';
        } else {
            ttsIndicator.textContent = `TTS：❌ 尚未設定`;
            ttsIndicator.style.color = '#FF453A';
        }
    }
    if (callIndicator) {
        if (thirdPartyReady) {
            const providerName = settings.voiceProvider === 'moss' ? 'MOSS Audio'
                : settings.voiceProvider === 'minimax' ? 'MiniMax' 
                : settings.voiceProvider === 'huggingface' ? 'HuggingFace' 
                : settings.voiceProvider === 'custom' ? '自訂 API' : '第三方';
            callIndicator.textContent = `撥打電話功能：✅ 已就緒（${providerName}）`;
            callIndicator.style.color = '#34C759';
        } else if (sttReady && ttsReady) {
            callIndicator.textContent = '撥打電話功能：✅ 已就緒';
            callIndicator.style.color = '#34C759';
        } else if (settings.useTransformers && hasBuiltInTTS) {
            callIndicator.textContent = '撥打電話功能：✅ Transformers.js + 內建 TTS';
            callIndicator.style.color = '#34C759';
        } else if (hasBuiltInSTT && hasBuiltInTTS) {
            callIndicator.textContent = '撥打電話功能：⚠️ 使用瀏覽器內建（功能有限）';
            callIndicator.style.color = '#FF9500';
        } else {
            callIndicator.textContent = '撥打電話功能：❌ 需設定 STT 與 TTS 或第三方服務';
            callIndicator.style.color = '#FF453A';
        }
    }

    return callReady || (hasBuiltInSTT && hasBuiltInTTS);
};

const testSttService = async () => {
    const statusEl = document.getElementById('stt-test-status');
    if (statusEl) statusEl.textContent = '正在錄音...';

    const settings = loadVoiceSettings();
    if (!settings.sttApiUrl || !settings.sttApiKey) {
        if (statusEl) statusEl.textContent = '❌ 請先設定 STT API 網址與 Key';
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        const audioChunks = [];

        mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);

        mediaRecorder.onstop = async () => {
            if (statusEl) statusEl.textContent = '正在辨識...';

            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const formData = new FormData();
            formData.append('file', audioBlob, 'test.webm');
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
                if (result.text) {
                    if (statusEl) statusEl.textContent = `✅ 辨識成功：${result.text}`;
                } else {
                    if (statusEl) statusEl.textContent = `❌ 辨識失敗：${result.error?.message || '未知錯誤'}`;
                }
            } catch (err) {
                if (statusEl) statusEl.textContent = `❌ 請求失敗：${err.message}`;
            }

            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setTimeout(() => mediaRecorder.stop(), 3000);

    } catch (err) {
        if (statusEl) statusEl.textContent = `❌ 無法錄音：${err.message}`;
    }
};

const testTtsService = async () => {
    const statusEl = document.getElementById('tts-test-status');
    if (statusEl) statusEl.textContent = '正在合成語音...';

    const settings = loadVoiceSettings();
    if (!settings.ttsApiUrl || !settings.ttsApiKey) {
        if (statusEl) statusEl.textContent = '❌ 請先設定 TTS API 網址與 Key';
        return;
    }

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
                input: '這是一段測試語音，如果你聽到了，代表 TTS 設定成功。',
                speed: settings.ttsSpeed || 1.0
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || `HTTP ${response.status}`);
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            if (statusEl) statusEl.textContent = '✅ 播放完畢';
        };

        audio.onerror = () => {
            if (statusEl) statusEl.textContent = '❌ 音訊播放失敗';
        };

        await audio.play();
        if (statusEl) statusEl.textContent = '🔊 正在播放...';

    } catch (err) {
        if (statusEl) statusEl.textContent = `❌ 請求失敗：${err.message}`;
    }
};

const initVoiceSettings = () => {
    const settings = loadVoiceSettings();

    const fields = {
        'sttApiUrl': settings.sttApiUrl,
        'sttApiKey': settings.sttApiKey,
        'sttModel': settings.sttModel,
        'sttLanguage': settings.sttLanguage,
        'ttsApiUrl': settings.ttsApiUrl,
        'ttsApiKey': settings.ttsApiKey,
        'ttsModel': settings.ttsModel,
        'ttsVoice': settings.ttsVoice,
        'ttsSpeed': settings.ttsSpeed,
        'voiceAutoTts': settings.voiceAutoTts,
        'voiceThinkDelay': settings.voiceThinkDelay,
        'voiceProvider': settings.voiceProvider,
        'thirdPartyVoiceUrl': settings.thirdPartyVoiceUrl,
        'thirdPartyVoiceKey': settings.thirdPartyVoiceKey,
        'thirdPartyGroupId': settings.thirdPartyGroupId,
        'thirdPartySttPath': settings.thirdPartySttPath,
        'thirdPartyTtsPath': settings.thirdPartyTtsPath,
        'thirdPartyVoiceName': settings.thirdPartyVoiceName,
        'thirdPartyRequestFormat': settings.thirdPartyRequestFormat,
        'thirdPartyAudioFormat': settings.thirdPartyAudioFormat,
        'audioResponsePath': settings.audioResponsePath,
        'customTtsBody': settings.customTtsBody
    };

    Object.entries(fields).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (!el) return;

        if (el.type === 'checkbox') {
            el.checked = !!value;
        } else if (el.type === 'range') {
            el.value = value;
            const output = document.getElementById(`${id}-output`);
            if (output) output.textContent = value;
        } else {
            el.value = value || '';
        }
    });

    const ttsSpeedEl = document.getElementById('ttsSpeed');
    const ttsSpeedOutput = document.getElementById('tts-speed-output');
    if (ttsSpeedEl && ttsSpeedOutput) {
        ttsSpeedEl.addEventListener('input', () => {
            ttsSpeedOutput.textContent = ttsSpeedEl.value;
        });
    }

    const thinkDelayEl = document.getElementById('voice-think-delay');
    const thinkDelayOutput = document.getElementById('voice-think-delay-output');
    if (thinkDelayEl && thinkDelayOutput) {
        thinkDelayEl.addEventListener('input', () => {
            thinkDelayOutput.textContent = thinkDelayEl.value;
        });
    }

    const sttTestBtn = document.getElementById('stt-test-btn');
    if (sttTestBtn) {
        sttTestBtn.addEventListener('click', testSttService);
    }

    const ttsTestBtn = document.getElementById('tts-test-btn');
    if (ttsTestBtn) {
        ttsTestBtn.addEventListener('click', testTtsService);
    }

    const sttSaveBtn = document.getElementById('stt-save-btn');
    if (sttSaveBtn) {
        sttSaveBtn.addEventListener('click', () => {
            const newSettings = {
                sttApiUrl: document.getElementById('sttApiUrl')?.value.trim() || '',
                sttApiKey: document.getElementById('sttApiKey')?.value.trim() || '',
                sttModel: document.getElementById('sttModel')?.value.trim() || 'whisper-1',
                sttLanguage: document.getElementById('sttLanguage')?.value.trim() || ''
            };
            saveVoiceSettings(newSettings);
            alert('✅ STT 設定已儲存');
        });
    }

    const ttsSaveBtn = document.getElementById('tts-save-btn');
    if (ttsSaveBtn) {
        ttsSaveBtn.addEventListener('click', () => {
            const newSettings = {
                ttsApiUrl: document.getElementById('ttsApiUrl')?.value.trim() || '',
                ttsApiKey: document.getElementById('ttsApiKey')?.value.trim() || '',
                ttsModel: document.getElementById('ttsModel')?.value.trim() || 'tts-1',
                ttsVoice: document.getElementById('ttsVoice')?.value || 'alloy',
                ttsSpeed: parseFloat(document.getElementById('ttsSpeed')?.value || '1.0')
            };
            saveVoiceSettings(newSettings);
            alert('✅ TTS 設定已儲存');
        });
    }

    const voiceGeneralSaveBtn = document.getElementById('voice-general-save-btn');
    if (voiceGeneralSaveBtn) {
        voiceGeneralSaveBtn.addEventListener('click', () => {
            const newSettings = {
                voiceAutoTts: document.getElementById('voice-auto-tts')?.checked ?? true,
                voiceThinkDelay: parseFloat(document.getElementById('voice-think-delay')?.value || '1.5')
            };
            saveVoiceSettings(newSettings);
            alert('✅ 通話設定已儲存');
        });
    }

    const useBuiltInToggle = document.getElementById('use-built-in-voice');
    if (useBuiltInToggle) {
        const settings = loadVoiceSettings();
        useBuiltInToggle.checked = settings.useBuiltIn !== false;
        
        useBuiltInToggle.addEventListener('change', () => {
            saveVoiceSettings({ useBuiltIn: useBuiltInToggle.checked });
        });
    }

    const builtinVoiceSelect = document.getElementById('builtin-voice-select');
    const refreshVoicesBtn = document.getElementById('refresh-voices-btn');
    
    const loadVoices = () => {
        if (!window.speechSynthesis) return;
        
        const voices = window.speechSynthesis.getVoices();
        if (builtinVoiceSelect) {
            builtinVoiceSelect.innerHTML = '<option value="">自動選擇</option>';
            
            const chineseVoices = voices.filter(v => 
                v.lang.startsWith('zh') || 
                v.lang.startsWith('cmn') ||
                v.name.toLowerCase().includes('chinese') ||
                v.name.toLowerCase().includes('中文')
            );
            
            const otherVoices = voices.filter(v => !chineseVoices.includes(v));
            
            if (chineseVoices.length > 0) {
                const optgroup = document.createElement('optgroup');
                optgroup.label = '中文語音';
                chineseVoices.forEach(voice => {
                    const option = document.createElement('option');
                    option.value = voice.name;
                    option.textContent = `${voice.name} (${voice.lang})`;
                    optgroup.appendChild(option);
                });
                builtinVoiceSelect.appendChild(optgroup);
            }
            
            if (otherVoices.length > 0) {
                const optgroup = document.createElement('optgroup');
                optgroup.label = '其他語音';
                otherVoices.slice(0, 20).forEach(voice => {
                    const option = document.createElement('option');
                    option.value = voice.name;
                    option.textContent = `${voice.name} (${voice.lang})`;
                    optgroup.appendChild(option);
                });
                builtinVoiceSelect.appendChild(optgroup);
            }
            
            const settings = loadVoiceSettings();
            if (settings.builtInVoice) {
                builtinVoiceSelect.value = settings.builtInVoice;
            }
        }
    };
    
    if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices();
    }
    
    if (refreshVoicesBtn) {
        refreshVoicesBtn.addEventListener('click', () => {
            loadVoices();
            alert('語音列表已重新載入');
        });
    }
    
    if (builtinVoiceSelect) {
        builtinVoiceSelect.addEventListener('change', () => {
            saveVoiceSettings({ builtInVoice: builtinVoiceSelect.value });
        });
    }

    const useTransformersToggle = document.getElementById('use-transformers-stt');
    const transformersModelSelect = document.getElementById('transformers-model-select');
    
    if (useTransformersToggle) {
        useTransformersToggle.checked = settings.useTransformers || false;
        
        useTransformersToggle.addEventListener('change', () => {
            saveVoiceSettings({ useTransformers: useTransformersToggle.checked });
            updateVoiceServiceStatus();
        });
    }
    
    if (transformersModelSelect) {
        transformersModelSelect.value = settings.transformersModel || 'Xenova/whisper-small';
        
        transformersModelSelect.addEventListener('change', () => {
            saveVoiceSettings({ transformersModel: transformersModelSelect.value });
        });
    }

    const sttLanguageSelect = document.getElementById('stt-language-select');
    const ttsLanguageSelect = document.getElementById('tts-language-select');
    
    if (sttLanguageSelect) {
        sttLanguageSelect.value = settings.sttLanguage || 'zh-TW';
        
        sttLanguageSelect.addEventListener('change', () => {
            saveVoiceSettings({ sttLanguage: sttLanguageSelect.value });
        });
    }
    
    if (ttsLanguageSelect) {
        ttsLanguageSelect.value = settings.ttsLanguage || 'zh-TW';
        
        ttsLanguageSelect.addEventListener('change', () => {
            saveVoiceSettings({ ttsLanguage: ttsLanguageSelect.value });
        });
    }

    const enableTranslationToggle = document.getElementById('enable-translation');
    const translateApiUrlInput = document.getElementById('translate-api-url');
    const translateApiKeyInput = document.getElementById('translate-api-key');
    
    if (enableTranslationToggle) {
        enableTranslationToggle.checked = settings.enableTranslation !== false;
        
        enableTranslationToggle.addEventListener('change', () => {
            saveVoiceSettings({ enableTranslation: enableTranslationToggle.checked });
        });
    }
    
    if (translateApiUrlInput) {
        translateApiUrlInput.value = settings.translateApiUrl || '';
        
        translateApiUrlInput.addEventListener('change', () => {
            saveVoiceSettings({ translateApiUrl: translateApiUrlInput.value.trim() });
        });
    }
    
    if (translateApiKeyInput) {
        translateApiKeyInput.value = settings.translateApiKey || '';
        
        translateApiKeyInput.addEventListener('change', () => {
            saveVoiceSettings({ translateApiKey: translateApiKeyInput.value.trim() });
        });
    }

    initThirdPartyVoiceSettings();

    updateVoiceServiceStatus();
};

const initThirdPartyVoiceSettings = () => {
    const providerSelect = document.getElementById('voiceProvider');
    const configSection = document.getElementById('third-party-voice-config');
    const requestFormatSelect = document.getElementById('thirdPartyRequestFormat');
    const customBodySection = document.getElementById('custom-request-body-section');
    const audioFormatSelect = document.getElementById('thirdPartyAudioFormat');
    const audioPathSection = document.getElementById('audio-response-path-section');

    const toggleConfigSection = () => {
        const provider = providerSelect?.value || '';
        if (configSection) {
            configSection.classList.toggle('hidden', !provider);
        }

        if (provider === 'moss') {
            const urlInput = document.getElementById('thirdPartyVoiceUrl');
            const sttPathInput = document.getElementById('thirdPartySttPath');
            const ttsPathInput = document.getElementById('thirdPartyTtsPath');
            const voiceNameInput = document.getElementById('thirdPartyVoiceName');
            if (urlInput && !urlInput.value) urlInput.placeholder = 'http://localhost:8080';
            if (sttPathInput) sttPathInput.value = '';
            if (ttsPathInput && !ttsPathInput.value) ttsPathInput.value = '/tts';
            if (voiceNameInput && !voiceNameInput.value) voiceNameInput.value = 'default';
        } else if (provider === 'minimax') {
            const urlInput = document.getElementById('thirdPartyVoiceUrl');
            const sttPathInput = document.getElementById('thirdPartySttPath');
            const ttsPathInput = document.getElementById('thirdPartyTtsPath');
            if (urlInput && !urlInput.value) urlInput.placeholder = 'https://api.minimax.chat/v1';
            if (sttPathInput && !sttPathInput.value) sttPathInput.value = '/audio/transcriptions';
            if (ttsPathInput && !ttsPathInput.value) ttsPathInput.value = '/text_to_speech';
        } else if (provider === 'huggingface') {
            const urlInput = document.getElementById('thirdPartyVoiceUrl');
            if (urlInput && !urlInput.value) urlInput.placeholder = 'https://api-inference.huggingface.co/models';
        }
    };

    const toggleCustomSections = () => {
        const format = requestFormatSelect?.value || 'openai';
        const audioFormat = audioFormatSelect?.value || 'binary';

        if (customBodySection) {
            customBodySection.classList.toggle('hidden', format !== 'custom');
        }

        if (audioPathSection) {
            audioPathSection.classList.toggle('hidden', audioFormat === 'binary');
        }
    };

    if (providerSelect) {
        providerSelect.addEventListener('change', toggleConfigSection);
        toggleConfigSection();
    }

    if (requestFormatSelect) {
        requestFormatSelect.addEventListener('change', toggleCustomSections);
    }

    if (audioFormatSelect) {
        audioFormatSelect.addEventListener('change', toggleCustomSections);
    }

    toggleCustomSections();

    const thirdPartyTestBtn = document.getElementById('third-party-test-btn');
    if (thirdPartyTestBtn) {
        thirdPartyTestBtn.addEventListener('click', testThirdPartyVoiceService);
    }

    const thirdPartySaveBtn = document.getElementById('third-party-save-btn');
    if (thirdPartySaveBtn) {
        thirdPartySaveBtn.addEventListener('click', () => {
            const newSettings = {
                voiceProvider: document.getElementById('voiceProvider')?.value || '',
                thirdPartyVoiceUrl: document.getElementById('thirdPartyVoiceUrl')?.value.trim() || '',
                thirdPartyVoiceKey: document.getElementById('thirdPartyVoiceKey')?.value.trim() || '',
                thirdPartyGroupId: document.getElementById('thirdPartyGroupId')?.value.trim() || '',
                thirdPartySttPath: document.getElementById('thirdPartySttPath')?.value.trim() || '/audio/transcriptions',
                thirdPartyTtsPath: document.getElementById('thirdPartyTtsPath')?.value.trim() || '/text_to_speech',
                thirdPartyVoiceName: document.getElementById('thirdPartyVoiceName')?.value.trim() || '',
                thirdPartyRequestFormat: document.getElementById('thirdPartyRequestFormat')?.value || 'openai',
                thirdPartyAudioFormat: document.getElementById('thirdPartyAudioFormat')?.value || 'binary',
                audioResponsePath: document.getElementById('audioResponsePath')?.value.trim() || 'data.audio',
                customTtsBody: document.getElementById('customTtsBody')?.value.trim() || ''
            };
            saveVoiceSettings(newSettings);
            alert('✅ 第三方語音服務設定已儲存');
        });
    }
};

const testThirdPartyVoiceService = async () => {
    const statusEl = document.getElementById('third-party-test-status');
    if (statusEl) statusEl.textContent = '正在測試 TTS 連接...';

    const provider = document.getElementById('voiceProvider')?.value;
    const baseUrl = document.getElementById('thirdPartyVoiceUrl')?.value.trim();
    const apiKey = document.getElementById('thirdPartyVoiceKey')?.value.trim();
    const ttsPath = document.getElementById('thirdPartyTtsPath')?.value.trim() || '/text_to_speech';
    const voiceName = document.getElementById('thirdPartyVoiceName')?.value.trim();
    const requestFormat = document.getElementById('thirdPartyRequestFormat')?.value || 'openai';
    const audioFormat = document.getElementById('thirdPartyAudioFormat')?.value || 'binary';
    const audioPath = document.getElementById('audioResponsePath')?.value.trim() || 'data.audio';
    const customBody = document.getElementById('customTtsBody')?.value.trim();
    const groupId = document.getElementById('thirdPartyGroupId')?.value.trim();

    if (!provider || !baseUrl || !apiKey) {
        if (statusEl) statusEl.textContent = '❌ 請先選擇服務類型並填寫 API 網址與 Key';
        return;
    }

    const testText = '這是一段測試語音。';

    try {
        let url = baseUrl.replace(/\/$/, '') + ttsPath;
        let headers = {};
        let body = {};

        if (provider === 'moss') {
            headers = {
                'Content-Type': 'application/json'
            };
            if (apiKey) {
                headers['Authorization'] = `Bearer ${apiKey}`;
            }
            body = {
                text: testText,
                speaker: voiceName || 'default'
            };
        } else if (provider === 'minimax') {
            headers = {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            };
            if (groupId) {
                url = `${baseUrl.replace(/\/$/, '')}/text_to_speech?GroupId=${groupId}`;
            }
            body = {
                text: testText,
                voice_id: voiceName || 'male-qn-qingse',
                model: 'speech-01',
                audio_format: 'mp3'
            };
        } else if (provider === 'huggingface') {
            headers = {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            };
            body = {
                inputs: testText
            };
        } else if (requestFormat === 'openai') {
            headers = {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            };
            body = {
                model: 'tts-1',
                voice: voiceName || 'alloy',
                input: testText,
                speed: 1.0
            };
        } else if (requestFormat === 'custom' && customBody) {
            headers = {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            };
            try {
                body = JSON.parse(customBody.replace(/\{\{TEXT\}\}/g, testText).replace(/\{\{VOICE\}\}/g, voiceName || 'default'));
            } catch {
                throw new Error('自訂 JSON 格式錯誤');
            }
        } else {
            headers = {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            };
            body = {
                text: testText,
                voice: voiceName || 'default'
            };
        }

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || errData.message || `HTTP ${response.status}`);
        }

        let audioBlob;
        let audioUrl;

        if (audioFormat === 'binary') {
            audioBlob = await response.blob();
            audioUrl = URL.createObjectURL(audioBlob);
        } else if (audioFormat === 'json_base64') {
            const data = await response.json();
            const audioData = getNestedValue(data, audioPath);
            if (!audioData) throw new Error('無法在回應中找到音訊資料');
            const binaryString = atob(audioData);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            audioBlob = new Blob([bytes], { type: 'audio/mp3' });
            audioUrl = URL.createObjectURL(audioBlob);
        } else if (audioFormat === 'json_url') {
            const data = await response.json();
            const audioData = getNestedValue(data, audioPath);
            if (!audioData) throw new Error('無法在回應中找到音訊 URL');
            audioUrl = audioData;
        }

        const audio = new Audio(audioUrl);
        audio.onended = () => {
            if (audioFormat !== 'json_url') URL.revokeObjectURL(audioUrl);
            if (statusEl) statusEl.textContent = '✅ 測試成功，播放完畢';
        };
        audio.onerror = () => {
            if (statusEl) statusEl.textContent = '❌ 音訊播放失敗';
        };

        await audio.play();
        if (statusEl) statusEl.textContent = '🔊 正在播放測試語音...';

    } catch (err) {
        if (statusEl) statusEl.textContent = `❌ 測試失敗：${err.message}`;
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

window.isVoiceCallReady = function() {
    const settings = loadVoiceSettings();
    const basicReady = !!(settings.sttApiUrl && settings.sttApiKey && settings.ttsApiUrl && settings.ttsApiKey);
    const thirdPartyReady = !!(settings.voiceProvider && settings.thirdPartyVoiceUrl && settings.thirdPartyVoiceKey);
    return basicReady || thirdPartyReady;
};

window.getVoiceSettings = loadVoiceSettings;

const MEMORY_TABLE_KEY = 'sx_memory_tables';
const MEMORY_SETTINGS_KEY = 'sx_memory_table_settings';

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

function getMemoryTableSettings() {
    try {
        const raw = localStorage.getItem(MEMORY_SETTINGS_KEY);
        if (raw) return JSON.parse(raw);
    } catch {}
    return { autoGenerate: false, autoRounds: 20 };
}

function saveMemoryTableSettingsToStorage(settings) {
    localStorage.setItem(MEMORY_SETTINGS_KEY, JSON.stringify(settings));
}

function sanitizeText(text) {
    return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderMemoryTablesList() {
    const container = document.getElementById('settings-memory-tables-list');
    if (!container) return;
    
    const tables = getMemoryTables();
    
    if (tables.length === 0) {
        container.innerHTML = '<div class="memory-tables-empty">尚未儲存任何記憶表格</div>';
        return;
    }
    
    container.innerHTML = tables.map((table, index) => {
        const date = new Date(table.createdAt).toLocaleString('zh-TW');
        return `
            <div class="memory-table-item" data-index="${index}">
                <div class="memory-table-item-info">
                    <div class="memory-table-item-name">${sanitizeText(table.charName)} - ${table.rounds} 輪對話</div>
                    <div class="memory-table-item-meta">${date} · ${table.entries?.length || 0} 條記錄</div>
                </div>
                <div class="memory-table-item-actions">
                    <button onclick="viewMemoryTableInSettings(${index})" title="查看"><i data-lucide="eye"></i></button>
                    <button onclick="exportSingleMemoryTable(${index}, 'html')" title="匯出 HTML"><i data-lucide="code"></i></button>
                    <button onclick="exportSingleMemoryTable(${index}, 'txt')" title="匯出 TXT"><i data-lucide="file-text"></i></button>
                    <button class="danger-btn" onclick="deleteMemoryTableFromSettings(${index})" title="刪除"><i data-lucide="trash-2"></i></button>
                </div>
            </div>
        `;
    }).join('');
    
    if (window.lucide) lucide.createIcons();
}

window.viewMemoryTableInSettings = function(index) {
    const tables = getMemoryTables();
    const table = tables[index];
    if (!table) return;
    
    let modal = document.getElementById('memory-table-preview-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'memory-table-preview-modal';
        modal.className = 'memory-table-preview-modal';
        modal.innerHTML = `
            <div class="memory-table-preview-content">
                <div class="memory-table-preview-header">
                    <h3>記憶表格預覽</h3>
                    <button class="memory-table-preview-close" onclick="closeMemoryTablePreview()">&times;</button>
                </div>
                <div class="memory-table-preview-body" id="memory-table-preview-body"></div>
            </div>
        `;
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeMemoryTablePreview();
        });
    }
    
    const body = document.getElementById('memory-table-preview-body');
    const lang = localStorage.getItem('sxiphone_lang') || 'zh-Hant';
    const localeCode = window.getLocaleStringLang?.(lang) || 'zh-TW';
    const date = new Date(table.createdAt).toLocaleString(localeCode);
    
    let html = `
        <div style="margin-bottom:16px;">
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
    
    table.entries?.forEach(entry => {
        html += `
            <tr>
                <td>${entry.round}</td>
                <td>${sanitizeText(entry.userSummary)}</td>
                <td>${sanitizeText(entry.aiSummary)}</td>
                <td>${sanitizeText(entry.keywords)}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    body.innerHTML = html;
    modal.classList.add('active');
};

window.closeMemoryTablePreview = function() {
    const modal = document.getElementById('memory-table-preview-modal');
    if (modal) modal.classList.remove('active');
};

window.deleteMemoryTableFromSettings = function(index) {
    if (!confirm('確定要刪除此記憶表格嗎？')) return;
    
    const tables = getMemoryTables();
    tables.splice(index, 1);
    saveMemoryTables(tables);
    renderMemoryTablesList();
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
        
        table.entries?.forEach(entry => {
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
        
    } else if (format === 'txt') {
        let txt = `記憶表格
========================================

角色：${table.charName}
用戶：${table.userName}
對話輪數：${table.rounds} 輪
生成時間：${date}

----------------------------------------

`;
        
        table.entries?.forEach(entry => {
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
        
    } else {
        return JSON.stringify(table, null, 2);
    }
}

window.exportSingleMemoryTable = function(index, format) {
    const tables = getMemoryTables();
    const table = tables[index];
    if (!table) return;
    
    const content = exportMemoryTableToFormat(table, format);
    const mimeType = format === 'html' ? 'text/html' : format === 'txt' ? 'text/plain' : 'application/json';
    const extension = format;
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
};

function exportAllMemoryTables(format) {
    const tables = getMemoryTables();
    if (tables.length === 0) {
        alert('沒有可匯出的記憶表格');
        return;
    }
    
    const lang = localStorage.getItem('sxiphone_lang') || 'zh-Hant';
    const localeCode = window.getLocaleStringLang?.(lang) || 'zh-TW';
    
    if (format === 'json') {
        const content = JSON.stringify(tables, null, 2);
        const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `memory_tables_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } else if (format === 'html') {
        let html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>記憶表格備份</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; background: #f5f5f5; }
        .container { max-width: 900px; margin: 0 auto; }
        .table-card { background: #fff; padding: 20px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; text-align: center; }
        h2 { color: #333; border-bottom: 2px solid #fbe100; padding-bottom: 8px; font-size: 18px; }
        .meta { color: #666; font-size: 13px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #fbe100; color: #333; }
        tr:nth-child(even) { background: #f9f9f9; }
    </style>
</head>
<body>
    <div class="container">
        <h1>記憶表格備份</h1>
        <p style="text-align:center;color:#666;margin-bottom:30px;">共 ${tables.length} 個記憶表格 · 匯出時間：${new Date().toLocaleString(localeCode)}</p>
`;
        
        tables.forEach((table, i) => {
            const date = new Date(table.createdAt).toLocaleString(localeCode);
            html += `
        <div class="table-card">
            <h2>${i + 1}. ${sanitizeText(table.charName)} - ${table.rounds} 輪對話</h2>
            <div class="meta">
                <span>用戶：${sanitizeText(table.userName)}</span> · 
                <span>生成時間：${date}</span> · 
                <span>${table.entries?.length || 0} 條記錄</span>
            </div>
            <table>
                <thead><tr><th>輪次</th><th>${sanitizeText(table.userName)} 說</th><th>${sanitizeText(table.charName)} 回應</th><th>關鍵字</th></tr></thead>
                <tbody>
`;
            table.entries?.forEach(entry => {
                html += `<tr><td>${entry.round}</td><td>${sanitizeText(entry.userSummary)}</td><td>${sanitizeText(entry.aiSummary)}</td><td>${sanitizeText(entry.keywords)}</td></tr>`;
            });
            html += `                </tbody>
            </table>
        </div>
`;
        });
        
        html += `    </div>
</body>
</html>`;
        
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `memory_tables_backup_${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
    } else if (format === 'txt') {
        let txt = `記憶表格備份
========================================
共 ${tables.length} 個記憶表格
匯出時間：${new Date().toLocaleString(localeCode)}

`;
        
        tables.forEach((table, i) => {
            const date = new Date(table.createdAt).toLocaleString(localeCode);
            txt += `\n${'='.repeat(50)}\n`;
            txt += `${i + 1}. ${table.charName} - ${table.rounds} 輪對話\n`;
            txt += `用戶：${table.userName}\n`;
            txt += `生成時間：${date}\n`;
            txt += `${'='.repeat(50)}\n\n`;
            
            table.entries?.forEach(entry => {
                txt += `【第 ${entry.round} 輪】
${table.userName}：${entry.userSummary}
${table.charName}：${entry.aiSummary}
關鍵字：${entry.keywords}

`;
            });
        });
        
        txt += `\n${'='.repeat(50)}\n由 SxiPhone 聊天應用生成\n`;
        
        const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `memory_tables_backup_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

function importMemoryTablesFromJSON(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            const tables = Array.isArray(data) ? data : [data];
            
            const existingTables = getMemoryTables();
            let importedCount = 0;
            
            tables.forEach(table => {
                if (table.id && table.charName && table.entries) {
                    const exists = existingTables.findIndex(t => t.id === table.id);
                    if (exists === -1) {
                        existingTables.push(table);
                        importedCount++;
                    } else {
                        existingTables[exists] = table;
                        importedCount++;
                    }
                }
            });
            
            saveMemoryTables(existingTables);
            renderMemoryTablesList();
            alert(`成功匯入 ${importedCount} 個記憶表格`);
        } catch (err) {
            alert('匯入失敗：' + err.message);
        }
    };
    reader.readAsText(file);
}

function initMemoryTableSettings() {
    const settings = getMemoryTableSettings();
    
    const autoToggle = document.getElementById('settings-auto-memory-toggle');
    const autoRoundsInput = document.getElementById('settings-auto-memory-rounds');
    const saveBtn = document.getElementById('settings-memory-save-btn');
    
    if (autoToggle) autoToggle.checked = settings.autoGenerate;
    if (autoRoundsInput) autoRoundsInput.value = settings.autoRounds;
    
    saveBtn?.addEventListener('click', () => {
        const newSettings = {
            autoGenerate: autoToggle?.checked || false,
            autoRounds: parseInt(autoRoundsInput?.value) || 20
        };
        saveMemoryTableSettingsToStorage(newSettings);
        alert('自動生成設定已儲存');
    });
    
    renderMemoryTablesList();
    
    document.getElementById('settings-memory-export-html')?.addEventListener('click', () => exportAllMemoryTables('html'));
    document.getElementById('settings-memory-export-txt')?.addEventListener('click', () => exportAllMemoryTables('txt'));
    document.getElementById('settings-memory-export-json')?.addEventListener('click', () => exportAllMemoryTables('json'));
    
    const importBtn = document.getElementById('settings-memory-import-btn');
    const importFile = document.getElementById('settings-memory-import-file');
    
    importBtn?.addEventListener('click', () => importFile?.click());
    importFile?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) importMemoryTablesFromJSON(file);
        e.target.value = '';
    });
    
    document.getElementById('settings-memory-clear-btn')?.addEventListener('click', () => {
        if (!confirm('確定要清除所有記憶表格嗎？此操作無法復原！')) return;
        if (!confirm('再次確認：清除所有記憶表格？')) return;
        saveMemoryTables([]);
        renderMemoryTablesList();
        alert('所有記憶表格已清除');
    });
}

window.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || typeof data !== 'object') return;
    
    if (data.type === 'GITHUB_SYNC_RESULT' && data.success && data.direction === 'pull') {
        setTimeout(() => {
            renderMemoryTablesList();
        }, 500);
    }
});

window.addEventListener('sxiphone-data-restored', (event) => {
    console.log('[Settings] 收到資料還原通知，刷新 UI...');
    setTimeout(() => {
        renderMemoryTablesList();
        renderCharList();
        renderUserList();
        renderNpcList();
        refreshGitHubSection();
        console.log('[Settings] UI 已刷新');
    }, 100);
});

let pendingImportData = null;
let importProgressCallback = null;

const ExternalChatImporter = {
    parsers: {
        chatgpt: (data) => {
            const messages = [];
            if (Array.isArray(data)) {
                data.forEach(conv => {
                    const convName = conv.title || 'ChatGPT 對話';
                    if (conv.mapping) {
                        Object.values(conv.mapping).forEach(node => {
                            if (node.message && node.message.content) {
                                const role = node.message.author?.role === 'user' ? 'user' : 'assistant';
                                const content = node.message.content.parts?.join('\n') || node.message.content.text || '';
                                if (content && role !== 'system') {
                                    messages.push({ role, content, source: convName });
                                }
                            }
                        });
                    } else if (conv.messages) {
                        conv.messages.forEach(msg => {
                            const role = msg.author?.role === 'user' ? 'user' : 'assistant';
                            const content = msg.text || msg.content || '';
                            if (content && role !== 'system') {
                                messages.push({ role, content, source: convName });
                            }
                        });
                    }
                });
            }
            return messages;
        },
        
        claude: (data) => {
            const messages = [];
            if (data.conversation) {
                data.conversation.forEach(msg => {
                    messages.push({
                        role: msg.sender === 'human' ? 'user' : 'assistant',
                        content: msg.text || msg.content || '',
                        source: data.name || 'Claude 對話'
                    });
                });
            } else if (data.messages) {
                data.messages.forEach(msg => {
                    messages.push({
                        role: msg.role === 'user' ? 'user' : 'assistant',
                        content: msg.content || '',
                        source: 'Claude 對話'
                    });
                });
            } else if (Array.isArray(data)) {
                data.forEach(item => {
                    if (item.human || item.user) {
                        messages.push({ role: 'user', content: item.human || item.user, source: 'Claude 對話' });
                    }
                    if (item.assistant || item.ai) {
                        messages.push({ role: 'assistant', content: item.assistant || item.ai, source: 'Claude 對話' });
                    }
                });
            }
            return messages;
        },
        
        gemini: (data) => {
            const messages = [];
            
            if (data.chats) {
                data.chats.forEach(chat => {
                    const chatName = chat.title || chat.name || 'Gemini 對話';
                    if (chat.messages) {
                        chat.messages.forEach(msg => {
                            const role = msg.role === 'user' ? 'user' : 'assistant';
                            let content = '';
                            
                            if (msg.parts && Array.isArray(msg.parts)) {
                                content = msg.parts.map(part => {
                                    if (typeof part === 'string') return part;
                                    if (part.text) return part.text;
                                    return '';
                                }).join('\n');
                            } else if (msg.content) {
                                content = msg.content;
                            } else if (msg.text) {
                                content = msg.text;
                            }
                            
                            if (content) {
                                messages.push({ role, content, source: chatName });
                            }
                        });
                    }
                });
            } else if (data.conversations) {
                data.conversations.forEach(conv => {
                    const convName = conv.title || conv.name || 'Gemini 對話';
                    if (conv.messages || conv.contents) {
                        const msgs = conv.messages || conv.contents;
                        msgs.forEach(msg => {
                            const role = msg.role === 'user' ? 'user' : 'assistant';
                            let content = '';
                            
                            if (msg.parts && Array.isArray(msg.parts)) {
                                content = msg.parts.map(part => part.text || part || '').join('\n');
                            } else {
                                content = msg.content || msg.text || '';
                            }
                            
                            if (content) {
                                messages.push({ role, content, source: convName });
                            }
                        });
                    }
                });
            } else if (data.contents || data.messages) {
                const msgs = data.contents || data.messages;
                msgs.forEach(msg => {
                    const role = msg.role === 'user' ? 'user' : 'assistant';
                    let content = '';
                    
                    if (msg.parts && Array.isArray(msg.parts)) {
                        content = msg.parts.map(part => {
                            if (typeof part === 'string') return part;
                            if (part.text) return part.text;
                            return '';
                        }).join('\n');
                    } else {
                        content = msg.content || msg.text || '';
                    }
                    
                    if (content) {
                        messages.push({ role, content, source: 'Gemini' });
                    }
                });
            } else if (data.history) {
                data.history.forEach(item => {
                    if (item.user || item.question) {
                        messages.push({ role: 'user', content: item.user || item.question, source: 'Gemini' });
                    }
                    if (item.model || item.response || item.answer) {
                        messages.push({ role: 'assistant', content: item.model || item.response || item.answer, source: 'Gemini' });
                    }
                });
            } else if (Array.isArray(data)) {
                data.forEach(item => {
                    if (item.role && (item.parts || item.content)) {
                        const role = item.role === 'user' ? 'user' : 'assistant';
                        let content = '';
                        if (item.parts && Array.isArray(item.parts)) {
                            content = item.parts.map(p => p.text || p || '').join('\n');
                        } else {
                            content = item.content || item.text || '';
                        }
                        if (content) {
                            messages.push({ role, content, source: 'Gemini' });
                        }
                    }
                });
            }
            
            return messages;
        },
        
        characterai: (data) => {
            const messages = [];
            if (data.history) {
                data.history.forEach(msg => {
                    messages.push({
                        role: msg.is_user ? 'user' : 'assistant',
                        content: msg.text || msg.message || '',
                        source: data.character?.name || 'Character.AI'
                    });
                });
            } else if (data.messages) {
                data.messages.forEach(msg => {
                    messages.push({
                        role: msg.role === 'user' || msg.is_user ? 'user' : 'assistant',
                        content: msg.content || msg.text || '',
                        source: data.character_name || 'Character.AI'
                    });
                });
            } else if (Array.isArray(data)) {
                data.forEach(msg => {
                    const isUser = msg.from === 'user' || msg.is_user || msg.role === 'user';
                    messages.push({
                        role: isUser ? 'user' : 'assistant',
                        content: msg.text || msg.content || msg.message || '',
                        source: 'Character.AI'
                    });
                });
            }
            return messages;
        },
        
        sillytavern: (data) => {
            const messages = [];
            if (data.messages) {
                data.messages.forEach(msg => {
                    messages.push({
                        role: msg.is_user ? 'user' : 'assistant',
                        content: msg.mes || msg.content || '',
                        source: data.name || data.character || 'SillyTavern'
                    });
                });
            } else if (Array.isArray(data)) {
                data.forEach(msg => {
                    const isUser = msg.is_user || msg.role === 'user';
                    messages.push({
                        role: isUser ? 'user' : 'assistant',
                        content: msg.mes || msg.content || msg.text || '',
                        source: 'SillyTavern'
                    });
                });
            }
            return messages;
        },
        
        flat_ai: (data) => {
            const result = { messages: [], char: null, worldbook: null, user: null };
            
            if (data.conversations || data.chats) {
                const convs = data.conversations || data.chats;
                convs.forEach(conv => {
                    const convName = conv.title || conv.name || 'Flat.AI 對話';
                    
                    if (conv.messages) {
                        conv.messages.forEach(msg => {
                            result.messages.push({
                                role: msg.role || (msg.sender === 'user' ? 'user' : 'assistant') || 'user',
                                content: msg.content || msg.text || msg.body || '',
                                source: convName
                            });
                        });
                    }
                });
            } else if (data.messages) {
                data.messages.forEach(msg => {
                    result.messages.push({
                        role: msg.role || (msg.is_user ? 'user' : 'assistant') || 'user',
                        content: msg.content || msg.text || '',
                        source: 'Flat.AI'
                    });
                });
            } else if (data.history) {
                data.history.forEach(msg => {
                    result.messages.push({
                        role: msg.role || (msg.from === 'user' ? 'user' : 'assistant') || 'user',
                        content: msg.content || msg.message || msg.text || '',
                        source: 'Flat.AI'
                    });
                });
            }
            
            if (data.character || data.bot || data.agent) {
                const charData = data.character || data.bot || data.agent;
                result.char = {
                    name: charData.name || charData.bot_name || 'Flat.AI 角色',
                    personality: charData.personality || charData.description || '',
                    background: charData.background || charData.backstory || '',
                    avatar: charData.avatar || charData.image || ''
                };
            }
            
            if (data.worldbook || data.knowledge || data.memory) {
                const wbData = data.worldbook || data.knowledge || data.memory;
                result.worldbook = Array.isArray(wbData) ? wbData : 
                    (wbData.entries ? wbData.entries : wbData);
            }
            
            if (data.user || data.user_profile) {
                const userData = data.user || data.user_profile;
                result.user = {
                    name: userData.name || userData.username || 'User',
                    avatar: userData.avatar || userData.image || '',
                    background: userData.bio || userData.background || ''
                };
            }
            
            return result;
        },
        
        mufy: (data) => {
            const result = { messages: [], char: null, worldbook: null, user: null };
            
            if (data.chat_history || data.history) {
                const history = data.chat_history || data.history;
                history.forEach(msg => {
                    result.messages.push({
                        role: msg.role || (msg.type === 'user' ? 'user' : 'assistant') || 'user',
                        content: msg.content || msg.text || msg.message || '',
                        source: msg.character || data.character_name || 'Mufy'
                    });
                });
            } else if (data.conversations) {
                data.conversations.forEach(conv => {
                    const convName = conv.name || conv.title || 'Mufy 對話';
                    if (conv.messages) {
                        conv.messages.forEach(msg => {
                            result.messages.push({
                                role: msg.role || (msg.is_user ? 'user' : 'assistant') || 'user',
                                content: msg.content || msg.text || '',
                                source: convName
                            });
                        });
                    }
                });
            } else if (data.dialogue || data.dialog) {
                const dialogue = data.dialogue || data.dialog;
                dialogue.forEach(turn => {
                    if (turn.user || turn.human || turn.input) {
                        result.messages.push({
                            role: 'user',
                            content: turn.user || turn.human || turn.input,
                            source: 'Mufy'
                        });
                    }
                    if (turn.ai || turn.assistant || turn.output || turn.response) {
                        result.messages.push({
                            role: 'assistant',
                            content: turn.ai || turn.assistant || turn.output || turn.response,
                            source: 'Mufy'
                        });
                    }
                });
            } else if (Array.isArray(data)) {
                data.forEach(msg => {
                    const isUser = msg.role === 'user' || msg.from === 'user' || msg.type === 'user' || msg.is_user;
                    result.messages.push({
                        role: isUser ? 'user' : 'assistant',
                        content: msg.content || msg.text || msg.message || msg.mes || '',
                        source: msg.source || 'Mufy'
                    });
                });
            }
            
            if (data.character || data.char || data.bot_info) {
                const charData = data.character || data.char || data.bot_info;
                result.char = {
                    name: charData.name || data.character_name || 'Mufy 角色',
                    personality: charData.personality || charData.persona || charData.description || '',
                    background: charData.background || charData.backstory || '',
                    avatar: charData.avatar || charData.avatar_url || ''
                };
            }
            
            if (data.worldbook || data.world_info || data.lore) {
                const wbData = data.worldbook || data.world_info || data.lore;
                result.worldbook = Array.isArray(wbData) ? wbData : 
                    (wbData.entries || wbData.data || wbData);
            }
            
            if (data.user_settings || data.user) {
                const userData = data.user_settings || data.user;
                result.user = {
                    name: userData.name || userData.username || 'User',
                    avatar: userData.avatar || '',
                    background: userData.background || userData.bio || ''
                };
            }
            
            return result;
        },
        
        generic: (data) => {
            const messages = [];
            if (data.messages && Array.isArray(data.messages)) {
                data.messages.forEach(msg => {
                    if (typeof msg === 'string') {
                        messages.push({ role: 'user', content: msg, source: '匯入' });
                    } else {
                        messages.push({
                            role: msg.role || 'user',
                            content: msg.content || msg.text || msg.message || '',
                            source: msg.source || '匯入'
                        });
                    }
                });
            } else if (Array.isArray(data)) {
                data.forEach(msg => {
                    if (typeof msg === 'string') {
                        messages.push({ role: 'user', content: msg, source: '匯入' });
                    } else if (msg.role && msg.content) {
                        messages.push({
                            role: msg.role,
                            content: msg.content,
                            source: msg.source || '匯入'
                        });
                    }
                });
            }
            return messages;
        },
        
        txt: (text) => {
            const messages = [];
            const lines = text.split('\n').filter(line => line.trim());
            
            const rolePatterns = [
                /^([^:：]+)[：:]\s*(.+)$/,
                /^【([^】]+)】\s*(.+)$/,
                /^\[([^\]]+)\]\s*(.+)$/
            ];
            
            let currentRole = 'user';
            
            lines.forEach(line => {
                let matched = false;
                for (const pattern of rolePatterns) {
                    const match = line.match(pattern);
                    if (match) {
                        const roleText = match[1].toLowerCase();
                        const content = match[2].trim();
                        
                        if (roleText.includes('user') || roleText.includes('用戶') || roleText.includes('我') || roleText.includes('你') || roleText === 'human') {
                            currentRole = 'user';
                        } else if (roleText.includes('ai') || roleText.includes('assistant') || roleText.includes('角色') || roleText.includes('bot') || roleText === 'assistant') {
                            currentRole = 'assistant';
                        }
                        
                        if (content) {
                            messages.push({ role: currentRole, content, source: '文字匯入' });
                            currentRole = currentRole === 'user' ? 'assistant' : 'user';
                        }
                        matched = true;
                        break;
                    }
                }
                
                if (!matched && line.trim()) {
                    messages.push({ role: currentRole, content: line.trim(), source: '文字匯入' });
                    currentRole = currentRole === 'user' ? 'assistant' : 'user';
                }
            });
            
            return messages;
        },
        
        csv: (text) => {
            const messages = [];
            const lines = text.split('\n').filter(line => line.trim());
            
            const header = lines[0]?.split(',').map(h => h.trim().toLowerCase()) || [];
            const roleIndex = header.findIndex(h => h === 'role' || h === 'sender' || h === 'from');
            const contentIndex = header.findIndex(h => h === 'content' || h === 'text' || h === 'message');
            
            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(',');
                if (cols.length > 0) {
                    let role = 'user';
                    let content = '';
                    
                    if (roleIndex >= 0 && cols[roleIndex]) {
                        const roleText = cols[roleIndex].trim().toLowerCase();
                        role = roleText.includes('user') || roleText.includes('human') ? 'user' : 'assistant';
                    }
                    
                    if (contentIndex >= 0 && cols[contentIndex]) {
                        content = cols[contentIndex].trim();
                    } else if (cols.length > 1) {
                        content = cols[cols.length - 1].trim();
                    }
                    
                    if (content) {
                        messages.push({ role, content, source: 'CSV 匯入' });
                    }
                }
            }
            
            return messages;
        },
        
        markdown: (text) => {
            const messages = [];
            const sections = text.split(/\n#{1,3}\s+/);
            
            sections.forEach(section => {
                if (!section.trim()) return;
                
                const lines = section.split('\n').filter(l => l.trim());
                let currentRole = 'user';
                let currentContent = [];
                
                lines.forEach(line => {
                    const roleMatch = line.match(/^(?:\*{2}|\_{2})?([^*_:：]+)(?:\*{2}|\_{2})?[：:]\s*(.+)$/);
                    
                    if (roleMatch) {
                        if (currentContent.length > 0) {
                            messages.push({
                                role: currentRole,
                                content: currentContent.join('\n').trim(),
                                source: 'Markdown 匯入'
                            });
                            currentContent = [];
                        }
                        
                        const roleText = roleMatch[1].toLowerCase();
                        currentRole = roleText.includes('user') || roleText.includes('用戶') || roleText.includes('我') ? 'user' : 'assistant';
                        currentContent.push(roleMatch[2]);
                    } else if (line.startsWith('> ') || line.startsWith('- ') || line.startsWith('* ')) {
                        currentContent.push(line.substring(2));
                    } else if (line.trim() && !line.startsWith('#')) {
                        currentContent.push(line);
                    }
                });
                
                if (currentContent.length > 0) {
                    messages.push({
                        role: currentRole,
                        content: currentContent.join('\n').trim(),
                        source: 'Markdown 匯入'
                    });
                }
            });
            
            return messages;
        },
        
        sxiphone_like: (data) => {
            const result = { messages: [], char: null, worldbook: null, user: null };
            
            if (data.sx_chat_history || data.chat_history) {
                const history = data.sx_chat_history || data.chat_history;
                result.messages = history.map(msg => ({
                    role: msg.role,
                    content: msg.content,
                    source: 'SxiPhone 匯入'
                }));
            }
            
            if (data.sx_masks || data.masks || data.character) {
                const charData = data.sx_masks?.[0] || data.masks?.[0] || data.character;
                result.char = {
                    name: charData.name || '匯入角色',
                    personality: charData.personality || charData.persona || '',
                    background: charData.background || charData.description || '',
                    avatar: charData.avatar || charData.avatar_url || ''
                };
            }
            
            if (data.sx_world_book || data.worldbook || data.world_info) {
                const wbData = data.sx_world_book || data.worldbook || data.world_info;
                result.worldbook = wbData;
            }
            
            if (data.sx_user_name || data.user) {
                const userData = typeof data.user === 'object' ? data.user : {};
                result.user = {
                    name: data.sx_user_name || userData.name || 'User',
                    avatar: data.sx_user_avatar || userData.avatar || '',
                    background: data.sx_user_background || userData.background || ''
                };
            }
            
            return result;
        },
        
        webapp_json: (data) => {
            const result = { messages: [], char: null, worldbook: null, user: null };
            
            const msgPaths = ['messages', 'chat.messages', 'data.messages', 'history', 'conversation', 'chats'];
            for (const path of msgPaths) {
                const msgs = getNestedValue(data, path);
                if (Array.isArray(msgs) && msgs.length > 0) {
                    result.messages = msgs.map(msg => ({
                        role: msg.role || (msg.is_user ? 'user' : 'assistant') || 'user',
                        content: msg.content || msg.text || msg.message || msg.mes || '',
                        source: msg.source || '網頁應用'
                    }));
                    break;
                }
            }
            
            const charPaths = ['character', 'char', 'charConfig', 'data.character', 'settings.character'];
            for (const path of charPaths) {
                const charData = getNestedValue(data, path);
                if (charData) {
                    result.char = {
                        name: charData.name || charData.char_name || '匯入角色',
                        personality: charData.personality || charData.persona || charData.description || '',
                        background: charData.background || charData.backstory || '',
                        avatar: charData.avatar || charData.avatar_url || charData.image || ''
                    };
                    break;
                }
            }
            
            const wbPaths = ['worldbook', 'worldInfo', 'world_book', 'data.worldbook', 'lorebook'];
            for (const path of wbPaths) {
                const wbData = getNestedValue(data, path);
                if (wbData) {
                    result.worldbook = wbData;
                    break;
                }
            }
            
            const userPaths = ['user', 'userConfig', 'data.user', 'settings.user'];
            for (const path of userPaths) {
                const userData = getNestedValue(data, path);
                if (userData) {
                    result.user = {
                        name: userData.name || userData.username || 'User',
                        avatar: userData.avatar || userData.avatar_url || '',
                        background: userData.background || userData.bio || ''
                    };
                    break;
                }
            }
            
            return result;
        },
        
        agregore: (data) => {
            const result = { messages: [], char: null, worldbook: null, user: null };
            
            if (data.conversations || data.chats) {
                const convs = data.conversations || data.chats;
                convs.forEach(conv => {
                    if (conv.messages) {
                        conv.messages.forEach(msg => {
                            result.messages.push({
                                role: msg.role || msg.sender || 'user',
                                content: msg.content || msg.text || msg.body || '',
                                source: conv.title || conv.name || 'Agregore'
                            });
                        });
                    }
                });
            }
            
            if (data.config?.character) {
                result.char = {
                    name: data.config.character.name || '匯入角色',
                    personality: data.config.character.personality || '',
                    background: data.config.character.background || '',
                    avatar: data.config.character.avatar || ''
                };
            }
            
            if (data.config?.worldbook || data.worldbook) {
                result.worldbook = data.config?.worldbook || data.worldbook;
            }
            
            return result;
        },
        
        custom_webapp: (data, customPaths) => {
            const result = { messages: [], char: null, worldbook: null, user: null };
            
            if (customPaths.messages) {
                const msgs = getNestedValue(data, customPaths.messages);
                if (Array.isArray(msgs)) {
                    result.messages = msgs.map(msg => ({
                        role: msg.role || (msg.is_user ? 'user' : 'assistant') || 'user',
                        content: msg.content || msg.text || msg.message || '',
                        source: '自訂應用'
                    }));
                }
            }
            
            if (customPaths.char) {
                const charData = getNestedValue(data, customPaths.char);
                if (charData) {
                    result.char = {
                        name: charData.name || '匯入角色',
                        personality: charData.personality || charData.persona || '',
                        background: charData.background || '',
                        avatar: charData.avatar || ''
                    };
                }
            }
            
            if (customPaths.worldbook) {
                result.worldbook = getNestedValue(data, customPaths.worldbook);
            }
            
            if (customPaths.user) {
                const userData = getNestedValue(data, customPaths.user);
                if (userData) {
                    result.user = {
                        name: userData.name || 'User',
                        avatar: userData.avatar || '',
                        background: userData.background || ''
                    };
                }
            }
            
            return result;
        },
        
        tavo: (data) => {
            const result = { messages: [], char: null, worldbook: null, user: null };
            
            if (data.conversations && Array.isArray(data.conversations)) {
                data.conversations.forEach(conv => {
                    const convName = conv.title || conv.name || conv.character_name || 'Tavo 對話';
                    
                    if (conv.messages && Array.isArray(conv.messages)) {
                        conv.messages.forEach(msg => {
                            const isUser = msg.role === 'user' || msg.sender === 'user' || msg.is_user === true;
                            result.messages.push({
                                role: isUser ? 'user' : 'assistant',
                                content: msg.content || msg.text || msg.message || msg.body || '',
                                source: convName,
                                timestamp: msg.timestamp || msg.created_at || msg.time || null
                            });
                        });
                    }
                });
            } else if (data.chats && Array.isArray(data.chats)) {
                data.chats.forEach(chat => {
                    const chatName = chat.title || chat.name || chat.character?.name || 'Tavo 對話';
                    
                    if (chat.messages && Array.isArray(chat.messages)) {
                        chat.messages.forEach(msg => {
                            const isUser = msg.role === 'user' || msg.sender === 'user' || msg.is_user === true;
                            result.messages.push({
                                role: isUser ? 'user' : 'assistant',
                                content: msg.content || msg.text || msg.message || '',
                                source: chatName,
                                timestamp: msg.timestamp || msg.created_at || null
                            });
                        });
                    }
                });
            } else if (data.messages && Array.isArray(data.messages)) {
                data.messages.forEach(msg => {
                    const isUser = msg.role === 'user' || msg.sender === 'user' || msg.is_user === true;
                    result.messages.push({
                        role: isUser ? 'user' : 'assistant',
                        content: msg.content || msg.text || msg.message || '',
                        source: data.character?.name || data.character_name || 'Tavo',
                        timestamp: msg.timestamp || msg.created_at || null
                    });
                });
            } else if (data.history && Array.isArray(data.history)) {
                data.history.forEach(msg => {
                    const isUser = msg.role === 'user' || msg.from === 'user' || msg.is_user === true || msg.type === 'user';
                    result.messages.push({
                        role: isUser ? 'user' : 'assistant',
                        content: msg.content || msg.text || msg.message || msg.body || '',
                        source: data.character?.name || 'Tavo'
                    });
                });
            } else if (data.dialogue && Array.isArray(data.dialogue)) {
                data.dialogue.forEach(turn => {
                    if (turn.user || turn.human || turn.input || turn.question) {
                        result.messages.push({
                            role: 'user',
                            content: turn.user || turn.human || turn.input || turn.question,
                            source: 'Tavo'
                        });
                    }
                    if (turn.assistant || turn.ai || turn.output || turn.response || turn.answer) {
                        result.messages.push({
                            role: 'assistant',
                            content: turn.assistant || turn.ai || turn.output || turn.response || turn.answer,
                            source: data.character?.name || 'Tavo'
                        });
                    }
                });
            }
            
            if (data.character || data.char || data.bot || data.agent) {
                const charData = data.character || data.char || data.bot || data.agent;
                result.char = {
                    name: charData.name || data.character_name || 'Tavo 角色',
                    personality: charData.personality || charData.persona || charData.description || '',
                    background: charData.background || charData.backstory || charData.scenario || '',
                    avatar: charData.avatar || charData.avatar_url || charData.image || ''
                };
            } else if (data.character_name || data.bot_name) {
                result.char = {
                    name: data.character_name || data.bot_name || 'Tavo 角色',
                    personality: data.character_personality || data.personality || '',
                    background: data.character_background || data.background || '',
                    avatar: data.character_avatar || data.avatar || ''
                };
            }
            
            if (data.worldbook || data.world_info || data.knowledge || data.memory) {
                const wbData = data.worldbook || data.world_info || data.knowledge || data.memory;
                result.worldbook = Array.isArray(wbData) ? wbData : 
                    (wbData.entries ? wbData.entries : wbData);
            }
            
            if (data.user || data.user_profile || data.user_settings) {
                const userData = data.user || data.user_profile || data.user_settings;
                result.user = {
                    name: userData.name || userData.username || 'User',
                    avatar: userData.avatar || userData.avatar_url || userData.image || '',
                    background: userData.background || userData.bio || userData.description || ''
                };
            }
            
            if (data.usage_stats || data.statistics) {
                const stats = data.usage_stats || data.statistics;
                result.usageStats = {
                    totalMessages: stats.total_messages || stats.message_count || result.messages.length,
                    totalTokens: stats.total_tokens || stats.token_count || 0,
                    totalRounds: stats.total_rounds || Math.floor(result.messages.length / 2),
                    firstMessageTime: stats.first_message || stats.start_date || null,
                    lastMessageTime: stats.last_message || stats.end_date || null
                };
            }
            
            return result;
        }
    },
    
    detectFormat(data, filename) {
        if (filename.endsWith('.txt')) return 'txt';
        if (filename.endsWith('.csv')) return 'csv';
        if (filename.endsWith('.md') || filename.endsWith('.markdown')) return 'markdown';
        
        try {
            const parsed = JSON.parse(data);
            
            if (Array.isArray(parsed) && parsed[0]?.mapping) return 'chatgpt';
            if (parsed.conversation || parsed.messages?.[0]?.sender) return 'claude';
            
            if (parsed.chats?.[0]?.messages?.[0]?.parts || 
                parsed.contents?.[0]?.parts || 
                parsed.messages?.[0]?.parts ||
                parsed.history?.[0]?.user) return 'gemini';
            
            if (parsed.history || parsed.character || parsed.character_name) return 'characterai';
            if (parsed.messages?.[0]?.is_user !== undefined || parsed.messages?.[0]?.mes) return 'sillytavern';
            
            if (parsed.chat_history || parsed.dialogue || parsed.dialog || parsed.mufy) return 'mufy';
            if (parsed.conversations?.[0]?.messages && (parsed.bot || parsed.agent)) return 'flat_ai';
            
            if (parsed.tavo || parsed.app_name === 'tavo' || parsed.source === 'tavo') return 'tavo';
            if (parsed.conversations?.[0]?.messages && (parsed.character || parsed.character_name || parsed.usage_stats)) return 'tavo';
            if (parsed.chats?.[0]?.messages && (parsed.character || parsed.character_name || parsed.user_profile)) return 'tavo';
            if (parsed.dialogue && (parsed.character || parsed.character_name)) return 'tavo';
            
            if (parsed.sx_chat_history || parsed.sx_masks || parsed.sx_characters) return 'sxiphone_like';
            if (parsed.conversations || parsed.chats?.[0]?.messages) return 'agregore';
            if (parsed.character || parsed.worldbook || parsed.charConfig) return 'webapp_json';
            
            return 'generic';
        } catch {
            return 'txt';
        }
    },
    
    parse(data, format, filename, customPaths = {}) {
        const actualFormat = format === 'auto' ? this.detectFormat(data, filename) : format;
        
        if (actualFormat === 'txt') {
            return { messages: this.parsers.txt(data), char: null, worldbook: null, user: null };
        }
        if (actualFormat === 'csv') {
            return { messages: this.parsers.csv(data), char: null, worldbook: null, user: null };
        }
        if (actualFormat === 'markdown') {
            return { messages: this.parsers.markdown(data), char: null, worldbook: null, user: null };
        }
        
        try {
            const parsed = JSON.parse(data);
            
            if (actualFormat === 'sxiphone_like') {
                return this.parsers.sxiphone_like(parsed);
            }
            if (actualFormat === 'webapp_json') {
                return this.parsers.webapp_json(parsed);
            }
            if (actualFormat === 'agregore') {
                return this.parsers.agregore(parsed);
            }
            if (actualFormat === 'custom_webapp') {
                return this.parsers.custom_webapp(parsed, customPaths);
            }
            if (actualFormat === 'flat_ai') {
                return this.parsers.flat_ai(parsed);
            }
            if (actualFormat === 'mufy') {
                return this.parsers.mufy(parsed);
            }
            if (actualFormat === 'tavo') {
                return this.parsers.tavo(parsed);
            }
            if (actualFormat === 'gemini') {
                return { messages: this.parsers.gemini(parsed), char: null, worldbook: null, user: null };
            }
            
            const messages = this.parsers[actualFormat]?.(parsed) || this.parsers.generic(parsed);
            return { messages, char: null, worldbook: null, user: null };
        } catch (err) {
            console.warn('JSON 解析失敗，嘗試文字解析:', err);
            return { messages: this.parsers.txt(data), char: null, worldbook: null, user: null };
        }
    }
};

const AIClassifier = {
    async classifyMessages(messages, onProgress) {
        const apis = JSON.parse(localStorage.getItem('api_configs') || '[]');
        const config = apis[0];
        
        if (!config || !config.url) {
            return messages.map(msg => ({ ...msg, classification: null }));
        }
        
        const batchSize = 10;
        const results = [];
        
        for (let i = 0; i < messages.length; i += batchSize) {
            const batch = messages.slice(i, i + batchSize);
            
            if (onProgress) {
                onProgress(Math.round((i / messages.length) * 100));
            }
            
            const batchText = batch.map((msg, idx) => 
                `[${idx}] ${msg.role}: ${msg.content.substring(0, 200)}`
            ).join('\n');
            
            try {
                const prompt = `分析以下對話片段，為每則訊息提供分類。請以 JSON 陣列格式回應，每個元素包含 index, topic（話題）, emotion（情感）, isImportant（是否重要）, keywords（關鍵字陣列）。

對話內容：
${batchText}

請直接回傳 JSON 陣列，不要有其他說明：`;

                const targetUrl = config.url.endsWith('/chat/completions') 
                    ? config.url 
                    : config.url.replace(/\/$/, '') + '/chat/completions';
                
                const response = await fetch(targetUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': config.key ? `Bearer ${config.key}` : ''
                    },
                    body: JSON.stringify({
                        model: config.model || 'gpt-3.5-turbo',
                        messages: [
                            { role: 'system', content: '你是一個對話分析助手，負責分類和標記對話內容。請只回傳 JSON 陣列。' },
                            { role: 'user', content: prompt }
                        ],
                        temperature: 0.3
                    })
                });
                
                const data = await response.json();
                let classifications = [];
                
                try {
                    const content = data.choices?.[0]?.message?.content || '[]';
                    const jsonMatch = content.match(/\[[\s\S]*\]/);
                    if (jsonMatch) {
                        classifications = JSON.parse(jsonMatch[0]);
                    }
                } catch (parseErr) {
                    console.warn('分類解析失敗:', parseErr);
                }
                
                batch.forEach((msg, idx) => {
                    const classification = classifications.find(c => c.index === idx) || {
                        topic: '一般對話',
                        emotion: '中性',
                        isImportant: false,
                        keywords: []
                    };
                    results.push({ ...msg, classification });
                });
                
            } catch (err) {
                console.warn('AI 分類失敗:', err);
                batch.forEach(msg => {
                    results.push({ ...msg, classification: null });
                });
            }
            
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        if (onProgress) {
            onProgress(100);
        }
        
        return results;
    },
    
    async detectCharacter(messages) {
        const assistantMsgs = messages.filter(m => m.role === 'assistant');
        if (assistantMsgs.length === 0) return 'AI 助理';
        
        const sampleText = assistantMsgs.slice(0, 5).map(m => m.content.substring(0, 100)).join(' ');
        
        const apis = JSON.parse(localStorage.getItem('api_configs') || '[]');
        const config = apis[0];
        
        if (!config || !config.url) {
            const sources = [...new Set(assistantMsgs.map(m => m.source))];
            return sources[0] || 'AI 助理';
        }
        
        try {
            const targetUrl = config.url.endsWith('/chat/completions') 
                ? config.url 
                : config.url.replace(/\/$/, '') + '/chat/completions';
            
            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': config.key ? `Bearer ${config.key}` : ''
                },
                body: JSON.stringify({
                    model: config.model || 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: '你是一個角色識別助手。根據對話內容判斷角色名稱。只回傳角色名稱，不要有其他說明。' },
                        { role: 'user', content: `根據以下對話內容，判斷 AI 角色的名稱或身分：\n\n${sampleText}` }
                    ],
                    temperature: 0.3,
                    max_tokens: 50
                })
            });
            
            const data = await response.json();
            return data.choices?.[0]?.message?.content?.trim() || 'AI 助理';
        } catch {
            const sources = [...new Set(assistantMsgs.map(m => m.source))];
            return sources[0] || 'AI 助理';
        }
    }
};

function renderImportPreview(messages, charName, importData = null) {
    const container = document.getElementById('import-preview-content');
    const stats = document.getElementById('import-preview-stats');
    
    if (!container) return;
    
    const userCount = messages.filter(m => m.role === 'user').length;
    const aiCount = messages.filter(m => m.role === 'assistant').length;
    const rounds = Math.min(userCount, aiCount);
    
    let html = '';
    const previewMessages = messages.slice(0, 20);
    
    previewMessages.forEach(msg => {
        const roleLabel = msg.role === 'user' ? '用戶' : charName;
        html += `
            <div class="import-preview-message ${msg.role}">
                <div class="import-preview-role">${roleLabel}</div>
                <div class="import-preview-text">${sanitizeText(msg.content.substring(0, 300))}${msg.content.length > 300 ? '...' : ''}</div>
                ${msg.classification ? `
                    <div>
                        <span class="import-classification-tag topic">${sanitizeText(msg.classification.topic)}</span>
                        ${msg.classification.isImportant ? '<span class="import-classification-tag important">重要</span>' : ''}
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    if (messages.length > 20) {
        html += `<div style="text-align:center;color:var(--ios-gray);padding:12px;">... 還有 ${messages.length - 20} 則訊息</div>`;
    }
    
    container.innerHTML = html;
    
    if (stats) {
        let statsHtml = `
            <p>偵測到角色：<strong>${sanitizeText(charName)}</strong></p>
            <p>總訊息數：${messages.length} 則（用戶 ${userCount} 則，AI ${aiCount} 則）</p>
            <p>對話輪數：約 ${rounds} 輪</p>
        `;
        
        if (importData?.char) {
            statsHtml += `<p style="color:var(--ios-green);">✓ 包含角色設定：${sanitizeText(importData.char.name)}</p>`;
        }
        if (importData?.worldbook) {
            const wbCount = Array.isArray(importData.worldbook) ? importData.worldbook.length : 
                (typeof importData.worldbook === 'object' ? Object.keys(importData.worldbook).length : 1);
            statsHtml += `<p style="color:var(--ios-green);">✓ 包含世界書：${wbCount} 條</p>`;
        }
        if (importData?.user) {
            statsHtml += `<p style="color:var(--ios-green);">✓ 包含用戶設定：${sanitizeText(importData.user.name)}</p>`;
        }
        
        stats.innerHTML = statsHtml;
    }
    
    document.getElementById('import-preview-area')?.classList.remove('hidden');
}

async function handleExternalImport(file) {
    const formatSelect = document.getElementById('import-format-select');
    const aiClassifyToggle = document.getElementById('import-ai-classify');
    const charNameInput = document.getElementById('import-char-name');
    
    const format = formatSelect?.value || 'auto';
    const useAIClassify = aiClassifyToggle?.checked !== false;
    const manualCharName = charNameInput?.value?.trim();
    
    const progressArea = document.getElementById('import-progress-area');
    const progressFill = document.getElementById('import-progress-fill');
    const progressText = document.getElementById('import-progress-text');
    
    progressArea?.classList.remove('hidden');
    if (progressFill) progressFill.style.width = '0%';
    if (progressText) progressText.textContent = '正在解析檔案...';
    
    const reader = new FileReader();
    
    reader.onload = async (e) => {
        try {
            const data = e.target.result;
            
            if (progressFill) progressFill.style.width = '20%';
            if (progressText) progressText.textContent = '正在解析格式...';
            
            const customPaths = {
                messages: document.getElementById('custom-path-messages')?.value?.trim(),
                char: document.getElementById('custom-path-char')?.value?.trim(),
                worldbook: document.getElementById('custom-path-worldbook')?.value?.trim(),
                user: document.getElementById('custom-path-user')?.value?.trim()
            };
            
            const parseResult = ExternalChatImporter.parse(data, format, file.name, customPaths);
            let messages = parseResult.messages || [];
            const charData = parseResult.char;
            const worldbookData = parseResult.worldbook;
            const userData = parseResult.user;
            
            if (messages.length === 0) {
                throw new Error('無法從檔案中解析出對話內容');
            }
            
            if (progressFill) progressFill.style.width = '40%';
            if (progressText) progressText.textContent = '正在偵測角色...';
            
            let charName = manualCharName || charData?.name;
            if (!charName) {
                charName = await AIClassifier.detectCharacter(messages);
            }
            
            if (useAIClassify) {
                if (progressFill) progressFill.style.width = '50%';
                if (progressText) progressText.textContent = '正在使用 AI 分類內容...';
                
                messages = await AIClassifier.classifyMessages(messages, (percent) => {
                    if (progressFill) progressFill.style.width = `${50 + percent * 0.4}%`;
                    if (progressText) progressText.textContent = `正在分類內容... ${percent}%`;
                });
            }
            
            if (progressFill) progressFill.style.width = '100%';
            if (progressText) progressText.textContent = '解析完成！';
            
            pendingImportData = {
                messages,
                charName,
                char: charData,
                worldbook: worldbookData,
                user: userData,
                userName: userData?.name || localStorage.getItem('sx_user_name') || 'User',
                source: file.name
            };
            
            setTimeout(() => {
                progressArea?.classList.add('hidden');
                renderImportPreview(messages, charName, pendingImportData);
            }, 500);
            
        } catch (err) {
            progressArea?.classList.add('hidden');
            alert('匯入失敗：' + err.message);
            console.error('匯入錯誤:', err);
        }
    };
    
    reader.readAsText(file);
}

function confirmImport() {
    if (!pendingImportData) return;
    
    const includeChat = document.getElementById('import-include-chat')?.checked !== false;
    const includeChar = document.getElementById('import-include-char')?.checked !== false;
    const includeWorldbook = document.getElementById('import-include-worldbook')?.checked !== false;
    const includeUser = document.getElementById('import-include-user')?.checked;
    
    const { messages, charName, char, worldbook, user, userName, source } = pendingImportData;
    
    if (includeChar && char) {
        const charList = loadCharList();
        const existingIndex = charList.findIndex(c => c.name === char.name);
        
        const newChar = {
            id: char.id || `imported_${Date.now()}`,
            name: char.name || charName,
            personality: char.personality || '',
            background: char.background || '',
            avatar: char.avatar || '',
            imported: true,
            importedAt: new Date().toISOString()
        };
        
        if (existingIndex >= 0) {
            if (confirm(`已存在名為「${char.name}」的角色，是否覆蓋？`)) {
                charList[existingIndex] = { ...charList[existingIndex], ...newChar };
            }
        } else {
            charList.push(newChar);
        }
        saveCharList(charList);
    }
    
    if (includeWorldbook && worldbook) {
        try {
            let wbEntries = [];
            
            if (Array.isArray(worldbook)) {
                wbEntries = worldbook;
            } else if (worldbook.entries && Array.isArray(worldbook.entries)) {
                wbEntries = worldbook.entries;
            } else if (typeof worldbook === 'object') {
                wbEntries = Object.entries(worldbook).map(([key, value]) => ({
                    title: key,
                    content: typeof value === 'string' ? value : JSON.stringify(value),
                    triggers: []
                }));
            }
            
            wbEntries.forEach((entry, index) => {
                const wbKey = `sx_worldbook_keywords`;
                const existing = JSON.parse(localStorage.getItem(wbKey) || '[]');
                
                const newEntry = {
                    title: entry.title || entry.name || entry.key || `匯入條目 ${index + 1}`,
                    content: entry.content || entry.text || entry.value || '',
                    triggers: entry.triggers || entry.keys || entry.keywords || [],
                    enabled: entry.enabled !== false
                };
                
                existing.push(newEntry);
                localStorage.setItem(wbKey, JSON.stringify(existing));
            });
        } catch (err) {
            console.warn('世界書匯入失敗:', err);
        }
    }
    
    if (includeUser && user) {
        if (user.name) localStorage.setItem('sx_user_name', user.name);
        if (user.avatar) localStorage.setItem('sx_user_avatar', user.avatar);
        if (user.background) localStorage.setItem('sx_user_background', user.background);
    }
    
    if (includeChat) {
        const entries = [];
        
        for (let i = 0; i < messages.length - 1; i += 2) {
            const userMsg = messages[i];
            const aiMsg = messages[i + 1];
            
            if (userMsg?.role === 'user' && aiMsg?.role === 'assistant') {
                const keywords = userMsg.classification?.keywords?.join(', ') || 
                    extractKeywordsSimple(userMsg.content + ' ' + aiMsg.content);
                
                entries.push({
                    round: Math.floor(i / 2) + 1,
                    timestamp: new Date().toISOString(),
                    userSummary: userMsg.content.substring(0, 50) + (userMsg.content.length > 50 ? '...' : ''),
                    aiSummary: aiMsg.content.substring(0, 80) + (aiMsg.content.length > 80 ? '...' : ''),
                    keywords,
                    topic: userMsg.classification?.topic || '一般對話',
                    isImportant: userMsg.classification?.isImportant || false
                });
            }
        }
        
        const memoryTable = {
            id: `imported_${Date.now()}`,
            createdAt: new Date().toISOString(),
            charName,
            userName,
            entries,
            rounds: entries.length,
            source,
            imported: true
        };
        
        const tables = getMemoryTables();
        tables.unshift(memoryTable);
        saveMemoryTables(tables);
        
        const chatHistory = messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));
        localStorage.setItem('sx_chat_history', JSON.stringify(chatHistory));
    }
    
    renderMemoryTablesList();
    
    document.getElementById('import-preview-area')?.classList.add('hidden');
    document.getElementById('import-external-file').value = '';
    pendingImportData = null;
    
    let summary = `成功匯入！\n來源：${source}\n角色：${charName}\n訊息數：${messages.length}`;
    if (char) summary += `\n✓ 角色設定`;
    if (worldbook) summary += `\n✓ 世界書`;
    if (user) summary += `\n✓ 用戶設定`;
    
    alert(summary);
    
    const githubToken = localStorage.getItem('github_token');
    if (githubToken) {
        setTimeout(() => {
            window.parent?.postMessage({ type: 'GITHUB_SYNC_PUSH' }, '*');
        }, 500);
    }
}

function extractKeywordsSimple(text) {
    const stopWords = ['的', '是', '了', '我', '你', '他', '她', '它', '我們', '你們', '他們', '這', '那', '有', '在', '不', '就', '也', '會', '能', '要', '可以', '什麼', '怎麼', '嗎', '呢', '吧', '啊', '嗯', '哦', '好', '對', '很', '都', '還', '但', '如果', '因為', '所以'];
    
    const words = text.split(/[\s,，。！？!?.;；：:""''「」【】\[\]()（）]+/);
    const filtered = words.filter(w => w.length >= 2 && !stopWords.includes(w));
    const uniqueWords = [...new Set(filtered)];
    return uniqueWords.slice(0, 5).join(', ');
}

function initExternalImporter() {
    const importBtn = document.getElementById('import-external-btn');
    const importFile = document.getElementById('import-external-file');
    const previewBtn = document.getElementById('import-external-preview-btn');
    const confirmBtn = document.getElementById('import-confirm-btn');
    const cancelBtn = document.getElementById('import-cancel-preview-btn');
    const formatSelect = document.getElementById('import-format-select');
    const customConfig = document.getElementById('custom-webapp-config');
    
    importBtn?.addEventListener('click', () => importFile?.click());
    
    importFile?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleExternalImport(file);
    });
    
    previewBtn?.addEventListener('click', () => importFile?.click());
    
    confirmBtn?.addEventListener('click', confirmImport);
    
    cancelBtn?.addEventListener('click', () => {
        document.getElementById('import-preview-area')?.classList.add('hidden');
        pendingImportData = null;
    });
    
    formatSelect?.addEventListener('change', (e) => {
        if (customConfig) {
            customConfig.classList.toggle('hidden', e.target.value !== 'custom_webapp');
        }
    });
}

function initKeepaliveSettings() {
    const enabledToggle = document.getElementById('keepalive-enabled');
    const intervalRange = document.getElementById('keepalive-interval');
    const intervalOutput = document.getElementById('keepalive-interval-value');
    const greetingEnabledToggle = document.getElementById('keepalive-greeting-enabled');
    const greetingIntervalRange = document.getElementById('keepalive-greeting-interval');
    const greetingIntervalOutput = document.getElementById('keepalive-greeting-interval-value');
    const contextModeSelect = document.getElementById('keepalive-context-mode');
    const customPromptInput = document.getElementById('keepalive-custom-prompt');
    const saveBtn = document.getElementById('keepalive-save-btn');
    const triggerBtn = document.getElementById('keepalive-trigger-btn');
    const statusText = document.getElementById('keepalive-status-text');
    const lastPingText = document.getElementById('keepalive-last-ping');
    const lastGreetingText = document.getElementById('keepalive-last-greeting');
    const pendingCountText = document.getElementById('keepalive-pending-count');

    const loadKeepaliveSettings = () => {
        const enabled = localStorage.getItem('sx_keepalive_enabled') === '1';
        const interval = Number(localStorage.getItem('sx_keepalive_interval')) || 5 * 60 * 1000;
        const greetingEnabled = localStorage.getItem('sx_keepalive_greeting_enabled') !== '0';
        const greetingInterval = Number(localStorage.getItem('sx_keepalive_greeting_interval')) || 30 * 60 * 1000;
        const contextMode = localStorage.getItem('sx_keepalive_context_mode') || 'smart';
        const customPrompt = localStorage.getItem('sx_keepalive_custom_prompt') || '';

        if (enabledToggle) enabledToggle.checked = enabled;
        if (intervalRange) intervalRange.value = Math.round(interval / 60000);
        if (intervalOutput) intervalOutput.textContent = Math.round(interval / 60000);
        if (greetingEnabledToggle) greetingEnabledToggle.checked = greetingEnabled;
        if (greetingIntervalRange) greetingIntervalRange.value = Math.round(greetingInterval / 60000);
        if (greetingIntervalOutput) greetingIntervalOutput.textContent = Math.round(greetingInterval / 60000);
        if (contextModeSelect) contextModeSelect.value = contextMode;
        if (customPromptInput) customPromptInput.value = customPrompt;
    };

    const updateKeepaliveStatus = () => {
        const enabled = localStorage.getItem('sx_keepalive_enabled') === '1';
        const lastPing = Number(localStorage.getItem('sx_keepalive_last_ping')) || 0;
        const lastGreeting = Number(localStorage.getItem('sx_keepalive_last_greeting')) || 0;
        
        let queueCount = 0;
        try {
            const queueRaw = localStorage.getItem('sx_keepalive_queue');
            const queue = queueRaw ? JSON.parse(queueRaw) : [];
            queueCount = Array.isArray(queue) ? queue.length : 0;
        } catch {}

        if (statusText) {
            const apiConfigs = localStorage.getItem('api_configs');
            const hasApi = apiConfigs && JSON.parse(apiConfigs).length > 0;
            
            if (!hasApi) {
                statusText.textContent = '⚠️ 尚未設定 API';
                statusText.style.color = '#FF9500';
            } else if (enabled) {
                statusText.textContent = '✅ 已啟用';
                statusText.style.color = '#34C759';
            } else {
                statusText.textContent = '❌ 未啟用';
                statusText.style.color = '#FF453A';
            }
        }

        if (lastPingText) {
            if (lastPing > 0) {
                const date = new Date(lastPing);
                const lang = localStorage.getItem('sxiphone_lang') || 'zh-Hant';
                const localeCode = window.getLocaleStringLang?.(lang) || 'zh-TW';
                lastPingText.textContent = `上次 Ping：${date.toLocaleTimeString(localeCode)}`;
            } else {
                lastPingText.textContent = '上次 Ping：—';
            }
        }

        if (lastGreetingText) {
            if (lastGreeting > 0) {
                const date = new Date(lastGreeting);
                const lang = localStorage.getItem('sxiphone_lang') || 'zh-Hant';
                const localeCode = window.getLocaleStringLang?.(lang) || 'zh-TW';
                lastGreetingText.textContent = `上次問候：${date.toLocaleTimeString(localeCode)}`;
            } else {
                lastGreetingText.textContent = '上次問候：—';
            }
        }

        if (pendingCountText) {
            pendingCountText.textContent = `待處理訊息：${queueCount}`;
        }
    };

    const saveKeepaliveSettings = () => {
        const enabled = enabledToggle?.checked || false;
        const interval = (Number(intervalRange?.value) || 5) * 60 * 1000;
        const greetingEnabled = greetingEnabledToggle?.checked !== false;
        const greetingInterval = (Number(greetingIntervalRange?.value) || 30) * 60 * 1000;
        const contextMode = contextModeSelect?.value || 'smart';
        const customPrompt = customPromptInput?.value || '';
        const pushEnabled = document.getElementById('background-push-enabled')?.checked || false;
        const notificationType = document.getElementById('notification-type')?.value || 'auto';

        localStorage.setItem('sx_keepalive_enabled', enabled ? '1' : '0');
        localStorage.setItem('sx_keepalive_interval', String(interval));
        localStorage.setItem('sx_keepalive_greeting_enabled', greetingEnabled ? '1' : '0');
        localStorage.setItem('sx_keepalive_greeting_interval', String(greetingInterval));
        localStorage.setItem('sx_keepalive_context_mode', contextMode);
        localStorage.setItem('sx_keepalive_custom_prompt', customPrompt);
        localStorage.setItem('sx_background_push_enabled', pushEnabled ? '1' : '0');
        localStorage.setItem('sx_notification_type', notificationType);

        if (window.parent && window.parent !== window) {
            window.parent.postMessage({
                type: 'KEEPALIVE_SET_CONFIG',
                payload: {
                    enabled,
                    interval,
                    greetingEnabled,
                    greetingInterval,
                    contextMode,
                    customPrompt,
                    pushEnabled,
                    notificationType
                }
            }, '*');
        }

        updateKeepaliveStatus();
        alert('✅ 背景連線設定已儲存');
    };

    const triggerGreeting = () => {
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({
                type: 'KEEPALIVE_TRIGGER_GREETING'
            }, '*');
            alert('已觸發問候訊息生成');
        } else if (window.BackgroundKeepalive) {
            window.BackgroundKeepalive.triggerImmediateGreeting();
            alert('已觸發問候訊息生成');
        } else {
            alert('背景連線模組尚未載入');
        }
    };

    if (intervalRange && intervalOutput) {
        intervalRange.addEventListener('input', () => {
            intervalOutput.textContent = intervalRange.value;
        });
    }

    if (greetingIntervalRange && greetingIntervalOutput) {
        greetingIntervalRange.addEventListener('input', () => {
            greetingIntervalOutput.textContent = greetingIntervalRange.value;
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', saveKeepaliveSettings);
    }

    if (triggerBtn) {
        triggerBtn.addEventListener('click', triggerGreeting);
    }

    loadKeepaliveSettings();
    updateKeepaliveStatus();

    setInterval(updateKeepaliveStatus, 5000);

    window.addEventListener('message', (event) => {
        const data = event.data;
        if (data?.type === 'KEEPALIVE_STATUS') {
            updateKeepaliveStatus();
        }
    });
}

function initChatNotificationSettings() {
    const enabledToggle = document.getElementById('chat-notification-enabled');
    const idleRange = document.getElementById('chat-notification-idle');
    const idleOutput = document.getElementById('chat-notification-idle-value');
    const maxRange = document.getElementById('chat-notification-max');
    const maxOutput = document.getElementById('chat-notification-max-value');
    const quietEnabledToggle = document.getElementById('chat-notification-quiet-enabled');
    const quietStartRange = document.getElementById('chat-notification-quiet-start');
    const quietStartOutput = document.getElementById('chat-notification-quiet-start-value');
    const quietEndRange = document.getElementById('chat-notification-quiet-end');
    const quietEndOutput = document.getElementById('chat-notification-quiet-end-value');
    const styleSelect = document.getElementById('chat-notification-style');
    const testBtn = document.getElementById('test-chat-notification-btn');

    const loadSettings = () => {
        try {
            const raw = localStorage.getItem('sx_chat_notification_config');
            const config = raw ? JSON.parse(raw) : {};
            
            if (enabledToggle) enabledToggle.checked = config.enabled !== false;
            if (idleRange) idleRange.value = config.idleMinutes || 30;
            if (idleOutput) idleOutput.textContent = config.idleMinutes || 30;
            if (maxRange) maxRange.value = config.maxNotificationsPerDay || 5;
            if (maxOutput) maxOutput.textContent = config.maxNotificationsPerDay || 5;
            if (quietEnabledToggle) quietEnabledToggle.checked = config.quietHoursEnabled || false;
            if (quietStartRange) quietStartRange.value = config.quietHoursStart || 23;
            if (quietStartOutput) quietStartOutput.textContent = `${String(config.quietHoursStart || 23).padStart(2, '0')}:00`;
            if (quietEndRange) quietEndRange.value = config.quietHoursEnd || 8;
            if (quietEndOutput) quietEndOutput.textContent = `${String(config.quietHoursEnd || 8).padStart(2, '0')}:00`;
            if (styleSelect) styleSelect.value = config.notificationStyle || 'contextual';
        } catch (e) {
            console.warn('載入聊天通知設定失敗:', e);
        }
    };

    const saveSettings = () => {
        const config = {
            enabled: enabledToggle?.checked !== false,
            idleMinutes: Number(idleRange?.value) || 30,
            maxNotificationsPerDay: Number(maxRange?.value) || 5,
            quietHoursEnabled: quietEnabledToggle?.checked || false,
            quietHoursStart: Number(quietStartRange?.value) || 23,
            quietHoursEnd: Number(quietEndRange?.value) || 8,
            notificationStyle: styleSelect?.value || 'contextual'
        };

        localStorage.setItem('sx_chat_notification_config', JSON.stringify(config));

        const engine = window.ChatNotificationEngine || window.parent?.ChatNotificationEngine;
        if (engine) {
            engine.setConfig(config);
        }

        if (window.parent && window.parent !== window) {
            window.parent.postMessage({
                type: 'CHAT_NOTIFICATION_CONFIG',
                payload: config
            }, '*');
        }

        alert('✅ 聊天通知設定已儲存');
    };

    if (idleRange && idleOutput) {
        idleRange.addEventListener('input', () => {
            idleOutput.textContent = idleRange.value;
        });
    }

    if (maxRange && maxOutput) {
        maxRange.addEventListener('input', () => {
            maxOutput.textContent = maxRange.value;
        });
    }

    if (quietStartRange && quietStartOutput) {
        quietStartRange.addEventListener('input', () => {
            quietStartOutput.textContent = `${String(quietStartRange.value).padStart(2, '0')}:00`;
        });
    }

    if (quietEndRange && quietEndOutput) {
        quietEndRange.addEventListener('input', () => {
            quietEndOutput.textContent = `${String(quietEndRange.value).padStart(2, '0')}:00`;
        });
    }

    if (enabledToggle) {
        enabledToggle.addEventListener('change', saveSettings);
    }

    if (quietEnabledToggle) {
        quietEnabledToggle.addEventListener('change', saveSettings);
    }

    if (styleSelect) {
        styleSelect.addEventListener('change', saveSettings);
    }

    // 保存按鈕
    const saveBtn = document.getElementById('chat-notification-save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveSettings);
    }

    if (testBtn) {
        testBtn.addEventListener('click', async () => {
            if (window.SxNotification) {
                const result = await window.SxNotification.requestSystemPermission();
                if (!result.granted) {
                    alert('請先授予通知權限');
                    return;
                }
            }

            const engine = window.ChatNotificationEngine || window.parent?.ChatNotificationEngine;
            if (engine) {
                engine.testNotification();
                alert('測試通知已發送');
            } else {
                alert('聊天通知引擎尚未載入，請重新整理頁面');
            }
        });
    }

    loadSettings();
    
    const floatingEnabledToggle = document.getElementById('floating-messenger-enabled');
    const floatingScreenshareToggle = document.getElementById('floating-messenger-screenshare');
    const floatingTestBtn = document.getElementById('test-floating-messenger-btn');
    const floatingPlatformInfo = document.getElementById('floating-messenger-platform-info');
    const floatingCharSelect = document.getElementById('floating-messenger-char');
    const floatingFrequencySelect = document.getElementById('floating-messenger-frequency');
    const floatingStyleSelect = document.getElementById('floating-messenger-style');
    const floatingPersonalityToggle = document.getElementById('floating-messenger-personality-based');
    const floatingSaveBtn = document.getElementById('floating-messenger-save-btn');
    
    const loadCharacterList = () => {
        if (!floatingCharSelect) return;
        
        const charactersRaw = localStorage.getItem('sx_characters');
        const masksRaw = localStorage.getItem('sx_masks');
        let characters = [];
        
        try {
            if (charactersRaw) {
                characters = [...characters, ...JSON.parse(charactersRaw)];
            }
            if (masksRaw) {
                characters = [...characters, ...JSON.parse(masksRaw)];
            }
        } catch (e) {
            console.warn('載入角色列表失敗:', e);
        }
        
        const currentCharName = localStorage.getItem('sx_char_name');
        
        if (characters.length === 0) {
            floatingCharSelect.innerHTML = '<option value="">目前沒有角色</option>';
            return;
        }
        
        floatingCharSelect.innerHTML = characters.map(char => {
            const selected = char.name === currentCharName ? 'selected' : '';
            const personality = char.personality ? ` (${char.personality.slice(0, 20)}...)` : '';
            return `<option value="${char.name}" ${selected}>${char.name}${personality}</option>`;
        }).join('');
        
        floatingCharSelect.innerHTML += '<option value="__current__">使用當前聊天角色</option>';
    };
    
    const loadFloatingSettings = () => {
        try {
            const raw = localStorage.getItem('sx_floating_messenger_config');
            const config = raw ? JSON.parse(raw) : {};
            
            if (floatingEnabledToggle) floatingEnabledToggle.checked = config.enabled === true;
            if (floatingScreenshareToggle) floatingScreenshareToggle.checked = config.screenshare === true;
            if (floatingFrequencySelect) floatingFrequencySelect.value = config.frequency || 'medium';
            if (floatingStyleSelect) floatingStyleSelect.value = config.style || 'contextual';
            if (floatingPersonalityToggle) floatingPersonalityToggle.checked = config.personalityBased !== false;
            if (floatingCharSelect && config.selectedChar) {
                floatingCharSelect.value = config.selectedChar;
            }
        } catch (e) {
            console.warn('載入懸浮窗設定失敗:', e);
        }
    };
    
    const saveFloatingSettings = () => {
        const config = {
            enabled: floatingEnabledToggle?.checked || false,
            screenshare: floatingScreenshareToggle?.checked || false,
            selectedChar: floatingCharSelect?.value || '__current__',
            frequency: floatingFrequencySelect?.value || 'medium',
            style: floatingStyleSelect?.value || 'contextual',
            personalityBased: floatingPersonalityToggle?.checked !== false
        };
        
        localStorage.setItem('sx_floating_messenger_config', JSON.stringify(config));
        
        if (config.enabled && window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'OPEN_FLOATING_MESSENGER' }, '*');
        } else if (!config.enabled && window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'CLOSE_FLOATING_MESSENGER' }, '*');
        }
        
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ 
                type: 'FLOATING_MESSENGER_CONFIG', 
                config: config 
            }, '*');
        }
        
        alert('✅ 懸浮窗設定已儲存');
    };
    
    const getFrequencyRange = (frequency, personality) => {
        const baseRanges = {
            low: { min: 1, max: 2 },
            medium: { min: 3, max: 5 },
            high: { min: 6, max: 10 },
            always: { min: 20, max: 30 }
        };
        
        let range = baseRanges[frequency] || baseRanges.medium;
        
        if (personality && floatingPersonalityToggle?.checked !== false) {
            const p = personality.toLowerCase();
            if (p.includes('活潑') || p.includes('熱情') || p.includes('外向') || p.includes('energetic')) {
                range = { min: Math.min(range.min * 1.5, 15), max: Math.min(range.max * 1.5, 20) };
            } else if (p.includes('安靜') || p.includes('內向') || p.includes('害羞') || p.includes('shy') || p.includes('quiet')) {
                range = { min: Math.max(range.min * 0.5, 1), max: Math.max(range.max * 0.5, 3) };
            } else if (p.includes('黏人') || p.includes('依賴') || p.includes('clingy')) {
                range = { min: range.min * 1.3, max: range.max * 1.5 };
            } else if (p.includes('獨立') || p.includes('冷淡') || p.includes('independent')) {
                range = { min: range.min * 0.7, max: range.max * 0.8 };
            }
        }
        
        return {
            min: Math.round(range.min),
            max: Math.round(range.max)
        };
    };
    
    const getStylePrompt = (style, personality) => {
        const stylePrompts = {
            contextual: '根據當前時間、天氣或最近對話內容生成情境相關的通知',
            greeting: '生成簡單溫暖的問候，例如「早安」、「吃飯了嗎」等',
            reminder: '提醒用戶重要事項，例如喝水、休息、記得做某事',
            random: '隨機選擇話題，可以是任何角色想說的話'
        };
        
        let prompt = stylePrompts[style] || stylePrompts.contextual;
        
        if (personality && floatingPersonalityToggle?.checked !== false) {
            prompt += `\n\n角色個性：${personality}`;
            prompt += '\n請根據角色個性調整語氣和內容風格。';
        }
        
        return prompt;
    };
    
    const updateFloatingPlatformInfo = () => {
        if (!floatingPlatformInfo) return;
        
        const isIOS = /iP(ad|hone|od)/.test(navigator.userAgent);
        const isAndroid = /Android/.test(navigator.userAgent);
        const isDesktop = !isIOS && !isAndroid;
        const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
        const supportsScreenShare = !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
        const supportsBadge = 'setAppBadge' in navigator;
        
        let platformText = '';
        let canFloating = false;
        let iosWarning = '';
        
        if (isDesktop) {
            platformText = '電腦版：支援懸浮窗';
            canFloating = true;
        } else if (isAndroid) {
            platformText = 'Android：支援懸浮窗';
            canFloating = true;
            if (!isPWA) {
                platformText += '（建議安裝為 PWA 獲得更好體驗）';
            }
        } else if (isIOS) {
            const iosMatch = navigator.userAgent.match(/OS (\d+)_?(\d+)?/);
            const iosMajor = iosMatch ? parseInt(iosMatch[1], 10) : 0;
            const iosMinor = iosMatch ? parseInt(iosMatch[2] || 0, 10) : 0;
            const supportsWebPush = iosMajor >= 16 && iosMinor >= 4;
            
            if (!isPWA) {
                platformText = 'iOS：請加入主屏幕以啟用功能';
                iosWarning = '分享 → 加入主屏幕';
            } else if (!supportsWebPush) {
                platformText = `iOS ${iosMajor}.${iosMinor}：需 iOS 16.4+ 才支援推送`;
                iosWarning = '背景通知僅支援 iOS 16.4+';
            } else {
                platformText = 'iOS PWA：應用內通知';
                iosWarning = 'iOS 限制：僅在開啟 App 時可收到通知';
            }
            
            if (supportsBadge) {
                platformText += ' | 支援圖示角標';
            }
        }
        
        if (supportsScreenShare && !isIOS) {
            platformText += ' | 支援螢幕分享';
            if (floatingScreenshareToggle) floatingScreenshareToggle.disabled = false;
        } else {
            if (floatingScreenshareToggle) floatingScreenshareToggle.disabled = true;
        }
        
        floatingPlatformInfo.innerHTML = platformText + (iosWarning ? `<br><span style="color:#ff9500;font-size:12px;">⚠️ ${iosWarning}</span>` : '');
        
        if (floatingEnabledToggle) {
            floatingEnabledToggle.disabled = !canFloating && !isIOS;
        }
    };
    
    if (floatingEnabledToggle) {
        floatingEnabledToggle.addEventListener('change', saveFloatingSettings);
    }
    
    if (floatingScreenshareToggle) {
        floatingScreenshareToggle.addEventListener('change', saveFloatingSettings);
    }
    
    if (floatingCharSelect) {
        floatingCharSelect.addEventListener('change', saveFloatingSettings);
    }
    
    if (floatingFrequencySelect) {
        floatingFrequencySelect.addEventListener('change', saveFloatingSettings);
    }
    
    if (floatingStyleSelect) {
        floatingStyleSelect.addEventListener('change', saveFloatingSettings);
    }
    
    if (floatingPersonalityToggle) {
        floatingPersonalityToggle.addEventListener('change', saveFloatingSettings);
    }
    
    if (floatingSaveBtn) {
        floatingSaveBtn.addEventListener('click', saveFloatingSettings);
    }
    
    if (floatingTestBtn) {
        floatingTestBtn.addEventListener('click', () => {
            if (window.parent && window.parent !== window) {
                window.parent.postMessage({ type: 'TOGGLE_FLOATING_MESSENGER' }, '*');
            } else if (window.FloatingMessenger) {
                window.FloatingMessenger.toggle();
            }
        });
    }
    
    loadCharacterList();
    loadFloatingSettings();
    updateFloatingPlatformInfo();
}

const BackgroundPushManager = {
    state: {
        enabled: false,
        permissionGranted: false,
        deviceType: 'unknown',
        notificationType: 'auto',
        serviceWorkerSupported: false,
        notificationSupported: false
    },

    init() {
        this.detectDevice();
        this.checkSupport();
        this.loadSettings();
        this.updateUI();
        this.bindEvents();
    },

    detectDevice() {
        const ua = navigator.userAgent;
        const platform = navigator.platform || '';
        
        if (/iPhone|iPad|iPod/.test(ua) || /iPhone|iPad|iPod/.test(platform)) {
            this.state.deviceType = 'ios';
        } else if (/Android/.test(ua)) {
            this.state.deviceType = 'android';
        } else if (/Win/.test(platform)) {
            this.state.deviceType = 'windows';
        } else if (/Mac/.test(platform)) {
            this.state.deviceType = 'macos';
        } else if (/Linux/.test(platform)) {
            this.state.deviceType = 'linux';
        } else {
            this.state.deviceType = 'unknown';
        }

        const deviceText = document.getElementById('device-type-text');
        if (deviceText) {
            const deviceNames = {
                'ios': 'iOS (iPhone/iPad)',
                'android': 'Android',
                'windows': 'Windows 桌面',
                'macos': 'macOS 桌面',
                'linux': 'Linux 桌面',
                'unknown': '未知設備'
            };
            deviceText.textContent = deviceNames[this.state.deviceType] || '未知設備';
        }
    },

    checkSupport() {
        this.state.serviceWorkerSupported = 'serviceWorker' in navigator;
        this.state.notificationSupported = 'Notification' in window;

        if (this.state.notificationSupported) {
            this.state.permissionGranted = Notification.permission === 'granted';
        }
    },

    loadSettings() {
        this.state.enabled = localStorage.getItem('sx_background_push_enabled') === '1';
        this.state.notificationType = localStorage.getItem('sx_notification_type') || 'auto';
    },

    saveSettings() {
        localStorage.setItem('sx_background_push_enabled', this.state.enabled ? '1' : '0');
        localStorage.setItem('sx_notification_type', this.state.notificationType);
    },

    async requestPermission() {
        if (!this.state.notificationSupported) {
            alert('此設備不支援通知功能');
            return false;
        }

        if (Notification.permission === 'granted') {
            this.state.permissionGranted = true;
            return true;
        }

        if (Notification.permission === 'denied') {
            alert('通知權限已被拒絕，請在瀏覽器設定中手動開啟');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            this.state.permissionGranted = permission === 'granted';
            
            if (permission === 'granted') {
                this.showTestNotification();
            } else {
                alert('通知權限被拒絕，後台推送功能將無法正常運作');
            }
            
            return this.state.permissionGranted;
        } catch (err) {
            console.error('請求通知權限失敗:', err);
            alert('請求通知權限失敗: ' + err.message);
            return false;
        }
    },

    showTestNotification() {
        if (!this.state.permissionGranted) return;

        const notification = new Notification('測試通知', {
            body: '後台推送功能已啟用！',
            icon: '/icons/icon-192.png',
            tag: 'test-notification',
            requireInteraction: false
        });

        setTimeout(() => notification.close(), 3000);
    },

    getPermissionStatusText() {
        if (!this.state.notificationSupported) {
            return { text: '此設備不支援通知', color: '#8E8E93', showButton: false };
        }

        switch (Notification.permission) {
            case 'granted':
                return { text: '✅ 已授權', color: '#34C759', showButton: false };
            case 'denied':
                return { text: '❌ 已拒絕（需手動開啟）', color: '#FF453A', showButton: false };
            default:
                return { text: '⚠️ 尚未授權', color: '#FF9500', showButton: true };
        }
    },

    getPlatformRequirements() {
        const requirements = {
            ios: {
                title: 'iOS 裝置需求',
                items: [
                    '需要 iOS 16.4 或更新版本',
                    '需要將網站加入主畫面（PWA 模式）',
                    '需要在系統設定中開啟通知權限',
                    '背景執行可能受限'
                ]
            },
            android: {
                title: 'Android 裝置需求',
                items: [
                    '需要 Android 6.0 或更新版本',
                    '需要在瀏覽器設定中開啟通知權限',
                    '建議將網站加入主畫面以獲得最佳體驗',
                    '部分瀏覽器可能限制背景執行'
                ]
            },
            windows: {
                title: 'Windows 桌面需求',
                items: [
                    '需要現代瀏覽器（Chrome、Edge、Firefox）',
                    '需要在瀏覽器設定中開啟通知權限',
                    '背景執行需要瀏覽器保持開啟'
                ]
            },
            macos: {
                title: 'macOS 桌面需求',
                items: [
                    '需要 macOS 10.15 或更新版本',
                    '需要在系統偏好設定中開啟通知權限',
                    '需要在瀏覽器設定中開啟通知權限'
                ]
            },
            linux: {
                title: 'Linux 桌面需求',
                items: [
                    '需要現代瀏覽器',
                    '需要在瀏覽器設定中開啟通知權限',
                    '背景執行需要瀏覽器保持開啟'
                ]
            },
            unknown: {
                title: '裝置需求',
                items: [
                    '需要支援通知功能的瀏覽器',
                    '需要開啟通知權限'
                ]
            }
        };

        return requirements[this.state.deviceType] || requirements.unknown;
    },

    updateUI() {
        const pushToggle = document.getElementById('background-push-enabled');
        const permissionText = document.getElementById('permission-status-text');
        const requestBtn = document.getElementById('request-permission-btn');
        const notificationTypeSelect = document.getElementById('notification-type');

        if (pushToggle) {
            pushToggle.checked = this.state.enabled;
        }

        if (permissionText) {
            const status = this.getPermissionStatusText();
            permissionText.textContent = status.text;
            permissionText.style.color = status.color;
        }

        if (requestBtn) {
            const status = this.getPermissionStatusText();
            requestBtn.style.display = status.showButton ? 'block' : 'none';
        }

        if (notificationTypeSelect) {
            notificationTypeSelect.value = this.state.notificationType;
        }
    },

    bindEvents() {
        const pushToggle = document.getElementById('background-push-enabled');
        const requestBtn = document.getElementById('request-permission-btn');
        const notificationTypeSelect = document.getElementById('notification-type');

        if (pushToggle) {
            pushToggle.addEventListener('change', async (e) => {
                this.state.enabled = e.target.checked;
                
                if (this.state.enabled && !this.state.permissionGranted) {
                    const granted = await this.requestPermission();
                    if (!granted) {
                        pushToggle.checked = false;
                        this.state.enabled = false;
                    }
                }
                
                this.saveSettings();
                this.updateUI();
            });
        }

        if (requestBtn) {
            requestBtn.addEventListener('click', async () => {
                await this.requestPermission();
                this.updateUI();
            });
        }

        if (notificationTypeSelect) {
            notificationTypeSelect.addEventListener('change', (e) => {
                this.state.notificationType = e.target.value;
                this.saveSettings();
            });
        }
    },

    async sendNotification(title, body, options = {}) {
        if (!this.state.enabled || !this.state.permissionGranted) {
            return false;
        }

        try {
            const notification = new Notification(title, {
                body,
                icon: options.icon || '/icons/icon-192.png',
                tag: options.tag || 'background-message',
                requireInteraction: options.requireInteraction || false,
                data: options.data || {}
            });

            if (options.onClick) {
                notification.onclick = options.onClick;
            }

            return true;
        } catch (err) {
            console.error('發送通知失敗:', err);
            return false;
        }
    }
};

/* =========================================================
   AI 環境感知設定
   ========================================================= */
const ENV_AWARENESS_KEY = 'sx_env_awareness_settings';

const getDefaultEnvSettings = () => ({
    enabled: false,
    locationDisplay: '',
    locationCity: '',
    locationCountry: '',
    useFictionalLocation: false,
    autoTimezone: true,
    manualTimezone: 'Asia/Taipei',
    weatherProvider: '',
    weatherApiKey: '',
    customWeatherUrl: '',
    customWeatherKey: '',
    weatherResponseFormat: 'json',
    injectTime: true,
    injectWeather: true,
    injectLocation: true,
    injectPosition: 'system',
    lastWeatherUpdate: null,
    cachedWeather: null
});

const loadEnvAwarenessSettings = () => {
    try {
        const raw = localStorage.getItem(ENV_AWARENESS_KEY);
        if (!raw) return getDefaultEnvSettings();
        const parsed = JSON.parse(raw);
        return { ...getDefaultEnvSettings(), ...parsed };
    } catch {
        return getDefaultEnvSettings();
    }
};

const saveEnvAwarenessSettings = (settings) => {
    const merged = { ...getDefaultEnvSettings(), ...settings };
    localStorage.setItem(ENV_AWARENESS_KEY, JSON.stringify(merged));
    return merged;
};

const EnvAwarenessManager = {
    settings: null,
    weatherCache: null,
    
    init() {
        this.settings = loadEnvAwarenessSettings();
        this.bindEvents();
        this.updateUI();
        this.refreshEnvStatus();
    },
    
    bindEvents() {
        const enabledToggle = document.getElementById('env-awareness-enabled');
        const autoTimezoneToggle = document.getElementById('env-auto-timezone');
        const useFictionalToggle = document.getElementById('env-use-fictional-location');
        const weatherProvider = document.getElementById('env-weather-provider');
        const refreshBtn = document.getElementById('env-refresh-btn');
        const saveBtn = document.getElementById('env-save-btn');
        
        enabledToggle?.addEventListener('change', (e) => {
            this.settings.enabled = e.target.checked;
            this.updateUI();
        });
        
        autoTimezoneToggle?.addEventListener('change', (e) => {
            this.settings.autoTimezone = e.target.checked;
            this.updateUI();
        });
        
        useFictionalToggle?.addEventListener('change', (e) => {
            this.settings.useFictionalLocation = e.target.checked;
            this.updateUI();
        });
        
        weatherProvider?.addEventListener('change', (e) => {
            this.settings.weatherProvider = e.target.value;
            this.updateUI();
        });
        
        refreshBtn?.addEventListener('click', () => this.refreshEnvStatus());
        saveBtn?.addEventListener('click', () => this.saveSettings());
    },
    
    updateUI() {
        const settings = this.settings;
        
        const enabledToggle = document.getElementById('env-awareness-enabled');
        const locationDisplay = document.getElementById('env-location-display');
        const locationCity = document.getElementById('env-location-city');
        const locationCountry = document.getElementById('env-location-country');
        const useFictionalLocation = document.getElementById('env-use-fictional-location');
        const autoTimezoneToggle = document.getElementById('env-auto-timezone');
        const manualTimezone = document.getElementById('env-manual-timezone');
        const manualTimezoneSection = document.getElementById('manual-timezone-section');
        const weatherProvider = document.getElementById('env-weather-provider');
        const weatherApiKeySection = document.getElementById('weather-api-key-section');
        const customWeatherSection = document.getElementById('custom-weather-section');
        const weatherApiKey = document.getElementById('env-weather-api-key');
        const customWeatherUrl = document.getElementById('env-custom-weather-url');
        const customWeatherKey = document.getElementById('env-custom-weather-key');
        const weatherResponseFormat = document.getElementById('env-weather-response-format');
        const injectTime = document.getElementById('env-inject-time');
        const injectWeather = document.getElementById('env-inject-weather');
        const injectLocation = document.getElementById('env-inject-location');
        const injectPosition = document.getElementById('env-inject-position');
        
        if (enabledToggle) enabledToggle.checked = settings.enabled;
        if (locationDisplay) locationDisplay.value = settings.locationDisplay || '';
        if (locationCity) locationCity.value = settings.locationCity || '';
        if (locationCountry) locationCountry.value = settings.locationCountry || '';
        if (useFictionalLocation) useFictionalLocation.checked = settings.useFictionalLocation;
        if (autoTimezoneToggle) autoTimezoneToggle.checked = settings.autoTimezone;
        if (manualTimezone) manualTimezone.value = settings.manualTimezone || 'Asia/Taipei';
        if (weatherProvider) weatherProvider.value = settings.weatherProvider || '';
        if (weatherApiKey) weatherApiKey.value = settings.weatherApiKey || '';
        if (customWeatherUrl) customWeatherUrl.value = settings.customWeatherUrl || '';
        if (customWeatherKey) customWeatherKey.value = settings.customWeatherKey || '';
        if (weatherResponseFormat) weatherResponseFormat.value = settings.weatherResponseFormat || 'json';
        if (injectTime) injectTime.checked = settings.injectTime;
        if (injectWeather) injectWeather.checked = settings.injectWeather;
        if (injectLocation) injectLocation.checked = settings.injectLocation;
        if (injectPosition) injectPosition.value = settings.injectPosition || 'system';
        
        if (manualTimezoneSection) {
            manualTimezoneSection.style.display = settings.autoTimezone ? 'none' : 'block';
        }
        
        if (weatherApiKeySection) {
            const needsKey = ['openweathermap', 'weatherapi'].includes(settings.weatherProvider);
            weatherApiKeySection.classList.toggle('hidden', !needsKey);
        }
        
        if (customWeatherSection) {
            customWeatherSection.classList.toggle('hidden', settings.weatherProvider !== 'custom');
        }
    },
    
    async refreshEnvStatus() {
        const timeEl = document.getElementById('env-current-time');
        const timezoneEl = document.getElementById('env-current-timezone');
        const weatherEl = document.getElementById('env-current-weather');
        const locationEl = document.getElementById('env-current-location');
        
        const now = new Date();
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const timeStr = now.toLocaleString('zh-TW', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        });
        
        if (timeEl) timeEl.textContent = `時間：${timeStr}`;
        if (timezoneEl) timezoneEl.textContent = `時區：${timezone}`;
        
        const displayLocation = document.getElementById('env-location-display')?.value || this.settings.locationDisplay;
        const actualCity = document.getElementById('env-location-city')?.value || this.settings.locationCity;
        const country = document.getElementById('env-location-country')?.value || this.settings.locationCountry;
        const useFictional = document.getElementById('env-use-fictional-location')?.checked ?? this.settings.useFictionalLocation;
        
        if (locationEl) {
            if (displayLocation) {
                locationEl.textContent = `顯示地點：${displayLocation}`;
                if (actualCity && !useFictional) {
                    locationEl.textContent += `（實際：${country ? `${actualCity}, ${country}` : actualCity}）`;
                }
            } else if (actualCity) {
                locationEl.textContent = `地點：${country ? `${actualCity}, ${country}` : actualCity}`;
            } else {
                locationEl.textContent = '地點：尚未設定';
            }
        }
        
        if (this.settings.weatherProvider && actualCity) {
            if (weatherEl) weatherEl.textContent = '天氣：獲取中...';
            try {
                const weather = await this.fetchWeather(actualCity);
                if (weather && weatherEl) {
                    weatherEl.textContent = `天氣：${weather.description}，${weather.temperature}°C`;
                }
            } catch (err) {
                if (weatherEl) weatherEl.textContent = `天氣：獲取失敗 (${err.message})`;
            }
        } else if (weatherEl) {
            weatherEl.textContent = '天氣：尚未設定';
        }
    },
    
    async fetchWeather(city) {
        const provider = this.settings.weatherProvider;
        const apiKey = this.settings.weatherApiKey;
        
        if (!provider) return null;
        
        let url = '';
        let headers = {};
        
        switch (provider) {
            case 'openweathermap':
                if (!apiKey) throw new Error('需要 API Key');
                url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=zh_tw`;
                break;
            case 'weatherapi':
                if (!apiKey) throw new Error('需要 API Key');
                url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(city)}&lang=zh`;
                break;
            case 'openmeteo':
                const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
                const geoRes = await fetch(geoUrl);
                const geoData = await geoRes.json();
                if (!geoData.results?.length) throw new Error('找不到城市');
                const { latitude, longitude } = geoData.results[0];
                url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`;
                break;
            case 'custom':
                url = this.settings.customWeatherUrl?.replace('{city}', encodeURIComponent(city)) || '';
                if (this.settings.customWeatherKey) {
                    headers['Authorization'] = `Bearer ${this.settings.customWeatherKey}`;
                }
                break;
            default:
                return null;
        }
        
        const response = await fetch(url, { headers });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        
        return this.parseWeatherResponse(data, provider);
    },
    
    parseWeatherResponse(data, provider) {
        switch (provider) {
            case 'openweathermap':
                return {
                    temperature: Math.round(data.main?.temp || 0),
                    description: data.weather?.[0]?.description || '未知',
                    humidity: data.main?.humidity,
                    windSpeed: data.wind?.speed
                };
            case 'weatherapi':
                return {
                    temperature: Math.round(data.current?.temp_c || 0),
                    description: data.current?.condition?.text || '未知',
                    humidity: data.current?.humidity,
                    windSpeed: data.current?.wind_kph
                };
            case 'openmeteo':
                const weatherCode = data.current?.weather_code || 0;
                const weatherDescriptions = {
                    0: '晴朗', 1: '晴朗', 2: '多雲', 3: '陰天',
                    45: '霧', 48: '霧', 51: '毛毛雨', 53: '毛毛雨', 55: '毛毛雨',
                    61: '小雨', 63: '中雨', 65: '大雨',
                    71: '小雪', 73: '中雪', 75: '大雪',
                    80: '陣雨', 81: '陣雨', 82: '豪雨',
                    95: '雷雨', 96: '雷雨', 99: '雷雨'
                };
                return {
                    temperature: Math.round(data.current?.temperature_2m || 0),
                    description: weatherDescriptions[weatherCode] || '未知',
                    humidity: null,
                    windSpeed: null
                };
            default:
                return {
                    temperature: data.temperature || data.temp || 0,
                    description: data.description || data.weather || '未知',
                    humidity: data.humidity,
                    windSpeed: data.windSpeed || data.wind_speed
                };
        }
    },
    
    saveSettings() {
        const settings = {
            enabled: document.getElementById('env-awareness-enabled')?.checked || false,
            locationDisplay: document.getElementById('env-location-display')?.value?.trim() || '',
            locationCity: document.getElementById('env-location-city')?.value?.trim() || '',
            locationCountry: document.getElementById('env-location-country')?.value?.trim() || '',
            useFictionalLocation: document.getElementById('env-use-fictional-location')?.checked || false,
            autoTimezone: document.getElementById('env-auto-timezone')?.checked ?? true,
            manualTimezone: document.getElementById('env-manual-timezone')?.value || 'Asia/Taipei',
            weatherProvider: document.getElementById('env-weather-provider')?.value || '',
            weatherApiKey: document.getElementById('env-weather-api-key')?.value?.trim() || '',
            customWeatherUrl: document.getElementById('env-custom-weather-url')?.value?.trim() || '',
            customWeatherKey: document.getElementById('env-custom-weather-key')?.value?.trim() || '',
            weatherResponseFormat: document.getElementById('env-weather-response-format')?.value || 'json',
            injectTime: document.getElementById('env-inject-time')?.checked ?? true,
            injectWeather: document.getElementById('env-inject-weather')?.checked ?? true,
            injectLocation: document.getElementById('env-inject-location')?.checked ?? true,
            injectPosition: document.getElementById('env-inject-position')?.value || 'system'
        };
        
        this.settings = saveEnvAwarenessSettings(settings);
        
        // 同步到獨立的 localStorage key，供其他應用快速存取
        localStorage.setItem('sx_env_awareness_enabled', settings.enabled ? 'true' : 'false');
        localStorage.setItem('sx_env_location_display', settings.locationDisplay);
        localStorage.setItem('sx_env_location_city', settings.locationCity);
        localStorage.setItem('sx_env_location_country', settings.locationCountry);
        localStorage.setItem('sx_env_weather_provider', settings.weatherProvider);
        
        // 通知父視窗設定已更新
        window.parent?.postMessage({
            type: 'ENV_AWARENESS_UPDATED',
            payload: settings
        }, '*');
        
        const statusEl = document.getElementById('env-status-text');
        if (statusEl) {
            statusEl.textContent = '✅ 設定已儲存';
            statusEl.style.color = '#34C759';
            setTimeout(() => { statusEl.textContent = ''; }, 2000);
        }
        
        this.refreshEnvStatus();
    },
    
getEnvContext() {
        if (!this.settings?.enabled) return '';
        
        const parts = [];
        const now = new Date();
        const timezone = this.settings.autoTimezone 
            ? Intl.DateTimeFormat().resolvedOptions().timeZone 
            : this.settings.manualTimezone;
        
        if (this.settings.injectTime !== false) {
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
        
        if (this.settings.injectLocation !== false) {
            const displayLocation = this.settings.locationDisplay;
            const actualCity = this.settings.locationCity;
            
            if (this.settings.useFictionalLocation && displayLocation) {
                parts.push(`所在地：${displayLocation}`);
            } else if (actualCity) {
                const location = this.settings.locationCountry 
                    ? `${actualCity}, ${this.settings.locationCountry}`
                    : actualCity;
                parts.push(`所在地：${location}`);
            } else if (displayLocation) {
                parts.push(`所在地：${displayLocation}`);
            }
        }
        
        if (this.settings.injectWeather && this.weatherCache) {
            parts.push(`目前天氣：${this.weatherCache.description}，氣溫 ${this.weatherCache.temperature}°C`);
        }
        
        console.log('[EnvAwareness] 環境上下文已更新（Settings）:', parts.join('\n').substring(0, 100) + '...');
        return parts.join('\n');
    },
    
    async updateWeatherCache() {
        if (!this.settings?.enabled || !this.settings.weatherProvider || !this.settings.locationCity) {
            return;
        }
        
        try {
            this.weatherCache = await this.fetchWeather(this.settings.locationCity);
            this.settings.lastWeatherUpdate = new Date().toISOString();
            this.settings.cachedWeather = this.weatherCache;
            saveEnvAwarenessSettings(this.settings);
        } catch (err) {
            console.warn('更新天氣快取失敗:', err);
        }
    }
};

window.getEnvContext = () => EnvAwarenessManager.getEnvContext();
window.getEnvSettings = () => EnvAwarenessManager.settings;
window.inferUserActivity = (timeSinceLast, lastMessage) => {
    const now = new Date();
    const hour = now.getHours();
    const minutesSinceLast = Math.floor(timeSinceLast / 60000);
    
    const activities = [];
    
    if (hour >= 6 && hour < 9) {
        activities.push({ type: 'morning', desc: '早晨時段，可能剛起床或準備上班/上學' });
    } else if (hour >= 9 && hour < 12) {
        activities.push({ type: 'work', desc: '上午時段，可能正在工作或上課' });
    } else if (hour >= 12 && hour < 14) {
        activities.push({ type: 'lunch', desc: '中午時段，可能在用餐或休息' });
    } else if (hour >= 14 && hour < 18) {
        activities.push({ type: 'work', desc: '下午時段，可能正在工作或上課' });
    } else if (hour >= 18 && hour < 21) {
        activities.push({ type: 'evening', desc: '傍晚時段，可能剛下班/放學或在用餐' });
    } else if (hour >= 21 && hour < 24) {
        activities.push({ type: 'night', desc: '晚間時段，可能在家休息或準備睡覺' });
    } else if (hour >= 0 && hour < 6) {
        activities.push({ type: 'sleep', desc: '深夜時段，可能正在睡覺' });
    }
    
    if (minutesSinceLast > 480) {
        activities.push({ type: 'long_absence', desc: '已超過8小時未回應，可能在睡覺或長時間工作' });
    } else if (minutesSinceLast > 120) {
        activities.push({ type: 'medium_absence', desc: '已超過2小時未回應，可能專注於某件事' });
    } else if (minutesSinceLast > 60) {
        activities.push({ type: 'short_absence', desc: '已超過1小時未回應，可能在忙其他事情' });
    }
    
    if (lastMessage) {
        const lowerMsg = lastMessage.toLowerCase();
        if (lowerMsg.includes('睡') || lowerMsg.includes('晚安')) {
            activities.push({ type: 'sleep_hint', desc: '用戶提到睡覺相關，可能去休息了' });
        }
        if (lowerMsg.includes('上班') || lowerMsg.includes('工作')) {
            activities.push({ type: 'work_hint', desc: '用戶提到工作相關，可能正在工作' });
        }
        if (lowerMsg.includes('上學') || lowerMsg.includes('學校') || lowerMsg.includes('課')) {
            activities.push({ type: 'school_hint', desc: '用戶提到學校相關，可能在上課' });
        }
        if (lowerMsg.includes('吃') || lowerMsg.includes('餐')) {
            activities.push({ type: 'meal_hint', desc: '用戶提到用餐相關，可能在吃飯' });
        }
        if (lowerMsg.includes('出門') || lowerMsg.includes('外出') || lowerMsg.includes('離開')) {
            activities.push({ type: 'out_hint', desc: '用戶提到外出，可能不在家' });
        }
    }
    
    return activities;
};

window.getTimeBasedGreeting = () => {
    return '';
};

const FullscreenManager = {
    init() {
        this.bindEvents();
        this.updateStatus();
        this.listenForChanges();
    },

    bindEvents() {
        const toggleBtn = document.getElementById('fullscreen-toggle-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggle());
        }

        const helpBtn = document.getElementById('ios-fullscreen-help-btn');
        if (helpBtn) {
            helpBtn.addEventListener('click', () => this.showIOSHelp());
        }
    },

    async toggle() {
        if (!window.parent || window.parent === window) {
            if (window.SxBrowserCompat) {
                try {
                    await window.SxBrowserCompat.toggleFullscreen();
                    this.updateStatus();
                } catch (e) {
                    console.warn('[Fullscreen] 切換失敗:', e);
                    this.updateStatus('不支援全螢幕');
                }
            } else {
                this.fallbackToggle();
            }
        } else {
            window.parent.postMessage({ type: 'TOGGLE_FULLSCREEN' }, '*');
        }
    },

    fallbackToggle() {
        const el = document.documentElement;
        const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || 
                                document.mozFullScreenElement || document.msFullscreenElement);
        
        if (isFullscreen) {
            if (document.exitFullscreen) document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
            else if (document.msExitFullscreen) document.msExitFullscreen();
        } else {
            if (el.requestFullscreen) el.requestFullscreen();
            else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
            else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
            else if (el.msRequestFullscreen) el.msRequestFullscreen();
            else {
                this.showIOSHelp();
            }
        }
    },

    isFullscreen() {
        return !!(document.fullscreenElement || document.webkitFullscreenElement || 
                  document.mozFullScreenElement || document.msFullscreenElement);
    },

    updateStatus(message) {
        const statusEl = document.getElementById('fullscreen-status');
        if (!statusEl) return;

        if (message) {
            statusEl.textContent = message;
            return;
        }

        const isFS = this.isFullscreen();
        const browser = this.detectBrowser();
        
        if (browser.isIOS && browser.isSafari) {
            statusEl.innerHTML = '<span style="color:#ff9500;">⚠️ iOS Safari 需加入主畫面才能全螢幕</span>';
        } else if (isFS) {
            statusEl.innerHTML = '<span style="color:#34c759;">✓ 目前為全螢幕模式</span>';
        } else {
            statusEl.textContent = '點擊上方按鈕進入全螢幕';
        }
    },

    detectBrowser() {
        const ua = navigator.userAgent;
        return {
            isIOS: /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
            isSafari: /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua),
            isAndroid: /Android/.test(ua),
            isChrome: /Chrome/.test(ua),
            isFirefox: /Firefox/.test(ua),
            isEdge: /Edg/.test(ua)
        };
    },

    showIOSHelp() {
        const modal = document.createElement('div');
        modal.className = 'ios-fullscreen-help-modal';
        modal.innerHTML = `
            <div class="ios-help-content">
                <h3>📱 iOS Safari 全螢幕教學</h3>
                <p>iOS Safari 不支援網頁全螢幕 API，但您可以透過以下方式獲得全螢幕體驗：</p>
                <ol>
                    <li>點擊 Safari 底部的「分享」按鈕 <span style="font-size:18px;">⬆️</span></li>
                    <li>在選單中找到並點擊「加入主畫面」</li>
                    <li>輸入名稱後點擊「新增」</li>
                    <li>從主畫面點擊圖示開啟</li>
                </ol>
                <p style="margin-top:12px;color:#888;">加入主畫面後，App 將以獨立視窗執行，隱藏 Safari 的網址列和工具列。</p>
                <button class="ios-help-close">知道了</button>
            </div>
        `;
        modal.style.cssText = `
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
        const content = modal.querySelector('.ios-help-content');
        content.style.cssText = `
            background: #1c1c1e;
            border-radius: 16px;
            padding: 24px;
            max-width: 340px;
            color: white;
            text-align: left;
        `;
        const closeBtn = modal.querySelector('.ios-help-close');
        closeBtn.style.cssText = `
            margin-top: 16px;
            padding: 12px 24px;
            background: #0a84ff;
            border: none;
            border-radius: 8px;
            color: white;
            font-size: 16px;
            cursor: pointer;
            width: 100%;
        `;
        closeBtn.onclick = () => modal.remove();
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        document.body.appendChild(modal);
    },

    listenForChanges() {
        ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(event => {
            document.addEventListener(event, () => this.updateStatus());
        });
    }
};

setInterval(() => {
    EnvAwarenessManager.updateWeatherCache();
}, 30 * 60 * 1000);

function initEncryptedCardImport() {
    const cardApiUrlInput = document.getElementById('card-api-url');
    const cardApiTestBtn = document.getElementById('card-api-test-btn');
    const cardApiSaveBtn = document.getElementById('card-api-save-btn');
    const cardApiStatus = document.getElementById('card-api-status');
    const encryptedCodeInput = document.getElementById('encrypted-code-input');
    const requestKeyBtn = document.getElementById('request-key-btn');
    const importEncryptedCardBtn = document.getElementById('import-encrypted-card-btn');
    const encryptedCardStatus = document.getElementById('encrypted-card-status');
    const encryptedCardPreview = document.getElementById('encrypted-card-preview');
    const deviceIdDisplay = document.getElementById('device-id-display');
    
    let currentCardData = null;
    let currentUsageId = null;
    
    if (deviceIdDisplay && window.CharacterCardCrypto) {
        deviceIdDisplay.textContent = CharacterCardCrypto.getDeviceId();
    }
    
    const savedApiUrl = localStorage.getItem('sx_card_api_url') || '';
    if (cardApiUrlInput) {
        cardApiUrlInput.value = savedApiUrl;
    }
    
    if (cardApiSaveBtn) {
        cardApiSaveBtn.addEventListener('click', () => {
            const url = cardApiUrlInput?.value.trim() || '';
            if (url) {
                localStorage.setItem('sx_card_api_url', url);
                if (cardApiStatus) cardApiStatus.textContent = '✅ API 網址已儲存';
            } else {
                localStorage.removeItem('sx_card_api_url');
                if (cardApiStatus) cardApiStatus.textContent = '已清除 API 網址';
            }
        });
    }
    
    if (cardApiTestBtn) {
        cardApiTestBtn.addEventListener('click', async () => {
            const url = cardApiUrlInput?.value.trim();
            if (!url) {
                if (cardApiStatus) cardApiStatus.textContent = '❌ 請輸入 API 網址';
                return;
            }
            
            if (cardApiStatus) cardApiStatus.textContent = '測試連接中...';
            
            try {
                const response = await fetch(`${url}/health`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                if (response.ok) {
                    if (cardApiStatus) cardApiStatus.textContent = '✅ 連接成功';
                } else {
                    if (cardApiStatus) cardApiStatus.textContent = `⚠️ 伺服器回應 ${response.status}`;
                }
            } catch (e) {
                if (cardApiStatus) cardApiStatus.textContent = `❌ 連接失敗：${e.message}`;
            }
        });
    }
    
    if (requestKeyBtn) {
        requestKeyBtn.addEventListener('click', async () => {
            const code = encryptedCodeInput?.value.trim();
            if (!code) {
                if (encryptedCardStatus) encryptedCardStatus.textContent = '❌ 請輸入加密代碼';
                return;
            }
            
            if (!window.CharacterCardCrypto) {
                if (encryptedCardStatus) encryptedCardStatus.textContent = '❌ 加密模組未載入';
                return;
            }
            
            if (encryptedCardStatus) encryptedCardStatus.textContent = '解析加密代碼中...';
            
            try {
                const parsedCode = CharacterCardCrypto.parseEncryptedCode(code);
                if (encryptedCardStatus) encryptedCardStatus.textContent = '申請一次性金鑰中...';
                
                const apiUrl = localStorage.getItem('sx_card_api_url') || '';
                if (!apiUrl) {
                    if (encryptedCardStatus) encryptedCardStatus.textContent = '❌ 請先設定後端 API 網址';
                    return;
                }
                
                const keyResult = await CharacterCardCrypto.requestOneTimeKey(
                    parsedCode.cardId,
                    parsedCode.creatorId,
                    apiUrl
                );
                
                if (encryptedCardStatus) encryptedCardStatus.textContent = '解密角色卡中...';
                
                const characterData = await CharacterCardCrypto.decryptCharacterCard(
                    parsedCode.encryptedData,
                    keyResult.oneTimeKey,
                    parsedCode.iv,
                    parsedCode.tag
                );
                
                currentCardData = characterData;
                currentUsageId = keyResult.usageId;
                
                if (encryptedCardPreview) {
                    encryptedCardPreview.classList.remove('hidden');
                    
                    const nameEl = document.getElementById('preview-card-name');
                    const creatorEl = document.getElementById('preview-card-creator');
                    const personalityEl = document.getElementById('preview-card-personality');
                    const backgroundEl = document.getElementById('preview-card-background');
                    const avatarEl = document.getElementById('preview-card-avatar');
                    
                    if (nameEl) nameEl.textContent = characterData.name || '未命名角色';
                    if (creatorEl) creatorEl.textContent = `創作者：${parsedCode.creatorId}`;
                    if (personalityEl) personalityEl.textContent = characterData.personality ? `個性：${characterData.personality.slice(0, 100)}...` : '';
                    if (backgroundEl) backgroundEl.textContent = characterData.background ? `背景：${characterData.background.slice(0, 100)}...` : '';
                    
                    if (avatarEl && characterData.avatar) {
                        avatarEl.innerHTML = `<img src="${characterData.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
                    }
                    
                    if (window.lucide) lucide.createIcons();
                }
                
                if (importEncryptedCardBtn) importEncryptedCardBtn.disabled = false;
                if (encryptedCardStatus) encryptedCardStatus.textContent = '✅ 解密成功，請確認預覽後導入';
                
            } catch (e) {
                console.error('[EncryptedCard] Error:', e);
                if (encryptedCardStatus) encryptedCardStatus.textContent = `❌ ${e.message}`;
                if (encryptedCardPreview) encryptedCardPreview.classList.add('hidden');
                if (importEncryptedCardBtn) importEncryptedCardBtn.disabled = true;
            }
        });
    }
    
    if (importEncryptedCardBtn) {
        importEncryptedCardBtn.addEventListener('click', async () => {
            if (!currentCardData) {
                if (encryptedCardStatus) encryptedCardStatus.textContent = '❌ 沒有可導入的角色卡資料';
                return;
            }
            
            if (encryptedCardStatus) encryptedCardStatus.textContent = '儲存角色卡中...';
            
            try {
                const savedChar = await CharacterCardCrypto.saveCharacterToLocalStorage(currentCardData);
                
                if (currentUsageId) {
                    const apiUrl = localStorage.getItem('sx_card_api_url') || '';
                    try {
                        await CharacterCardCrypto.confirmImport(currentUsageId, apiUrl);
                    } catch (e) {
                        console.warn('[EncryptedCard] Failed to confirm import:', e);
                    }
                }
                
                if (encryptedCardStatus) encryptedCardStatus.textContent = `✅ 角色「${savedChar.name}」已成功導入`;
                if (importEncryptedCardBtn) importEncryptedCardBtn.disabled = true;
                if (encryptedCodeInput) encryptedCodeInput.value = '';
                if (encryptedCardPreview) encryptedCardPreview.classList.add('hidden');
                
                currentCardData = null;
                currentUsageId = null;
                
                if (typeof updateCharListUI === 'function') {
                    updateCharListUI();
                }
                
            } catch (e) {
                console.error('[EncryptedCard] Save error:', e);
                if (encryptedCardStatus) encryptedCardStatus.textContent = `❌ 儲存失敗：${e.message}`;
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initMemoryTableSettings();
        initExternalImporter();
        initKeepaliveSettings();
        initChatNotificationSettings();
        BackgroundPushManager.init();
        EnvAwarenessManager.init();
        FullscreenManager.init();
        initEncryptedCardImport();
    }, 100);
});

// 確保函式在全域範圍，這樣 HTML 的 oninput 才能找到它
window.updateAvatarPreview = function(url) {
    const previewImg = document.getElementById('userAvatarPreview'); // 確保 HTML 有這個 ID 的 img
    if (previewImg) {
        // 如果 url 是空的，給一個預設的頭像或隱藏
        previewImg.src = url || 'https://via.placeholder.com/100?text=User';
        previewImg.onerror = () => { previewImg.src = 'https://via.placeholder.com/100?text=Error'; };
    }}
