const UserEnv = {
    ua: navigator.userAgent || navigator.vendor || window.opera,
    isIOS() { return /iPad|iPhone|iPod/.test(this.ua) && !window.MSStream; },
    envName() { return this.isIOS() ? 'iOS' : 'Desktop/Android'; }
};

const BUILTIN_WORLDBOOKS = [
    { id: 'ivory_tower', file: 'ivory_tower_worldbook.json', name: '象牙塔預設', desc: '完整的創作心錨與文風設定', lang: 'zh' },
    { id: 'sx_core', file: '象牙塔_核心預設_worldbook.json', name: '象牙塔 核心預設', desc: 'SxiPhone 核心世界書', lang: 'zh' },
    { id: 'sx_theater', file: '象牙塔_劇場預設_worldbook.json', name: '象牙塔 劇場預設', desc: '劇場模式專用設定', lang: 'zh' },
    { id: 'sx_conditional', file: '象牙塔_條件預設_worldbook.json', name: '象牙塔 條件預設', desc: '條件觸發式設定', lang: 'zh' },
    { id: 'tsukuyomi_chat', file: '月讀_chat_worldbook.json', name: '月讀 Chat預設', desc: '日常聊天對話場景', lang: 'zh' },
    { id: 'tsukuyomi_lofter', file: '月讀_lofter_worldbook.json', name: '月讀 Lofter預設', desc: '文學創作場景', lang: 'zh' },
    { id: 'tsukuyomi_theater', file: '月讀_theater_worldbook.json', name: '月讀 Theater預設', desc: '劇場生成場景', lang: 'zh' },
    { id: 'gomorrah_chat', file: '蛾摩拉_chat_worldbook.json', name: '蛾摩拉 Chat預設', desc: '日常聊天對話場景', lang: 'zh' },
    { id: 'gomorrah_lofter', file: '蛾摩拉_lofter_worldbook.json', name: '蛾摩拉 Lofter預設', desc: '文學創作場景', lang: 'zh' },
    { id: 'claude42', file: 'claude42_worldbook.json', name: 'Claude 4.2 預設', desc: 'Claude 4.2 專用優化', lang: 'zh' },
    { id: 'claude46', file: 'claude46_worldbook.json', name: 'Claude 4.6 預設', desc: 'Claude 4.6 專用優化', lang: 'zh' },
    { id: 'opus', file: 'opus_worldbook.json', name: 'Claude Opus 預設', desc: 'Claude Opus 專用優化', lang: 'zh' },
    { id: 'sonnet', file: 'sonnet_worldbook.json', name: 'Claude Sonnet 預設', desc: 'Claude Sonnet 專用優化', lang: 'zh' },
    { id: '4o', file: '4o_worldbook.json', name: 'GPT-4o 預設', desc: 'GPT-4o 專用優化', lang: 'zh' },
    { id: '5_2', file: '5.2_worldbook.json', name: 'GPT-5.2 預設', desc: 'GPT-5.2 專用優化', lang: 'zh' },
    { id: 'gemini31', file: 'gemini31_worldbook.json', name: 'Gemini 3.1 預設', desc: 'Gemini 3.1 專用優化', lang: 'zh' },
    { id: 'deepseek', file: 'deepseek_worldbook.json', name: 'DeepSeek 預設', desc: 'DeepSeek 專用優化', lang: 'zh' },
    { id: 'deepseek2', file: 'deepseek2_worldbook.json', name: 'DeepSeek 2 預設', desc: 'DeepSeek 2 專用優化', lang: 'zh' },
    { id: 'glm', file: 'glm_worldbook.json', name: '智譜 GLM 預設', desc: 'GLM 專用優化', lang: 'zh' },
    { id: 'kimi', file: 'kimi_worldbook.json', name: 'Kimi 預設', desc: 'Kimi 專用優化', lang: 'zh' },
    { id: 'kimi25', file: 'kimi25_worldbook.json', name: 'Kimi 2.5 預設', desc: 'Kimi 2.5 專用優化', lang: 'zh' },
    { id: 'minimax', file: 'minimax_worldbook.json', name: 'MiniMax 預設', desc: 'MiniMax 專用優化', lang: 'zh' },
    { id: 'grok42', file: 'grok42_worldbook.json', name: 'Grok 4.2 預設', desc: 'Grok 4.2 專用優化', lang: 'zh' },
    { id: 'mino', file: 'mino_worldbook.json', name: 'Mino 預設', desc: 'Mino 專用優化', lang: 'zh' },
    { id: 'literary_style', file: 'literary_style_worldbook.json', name: '文學風格預設', desc: '文學寫作風格設定', lang: 'zh' },
    { id: 'eating', file: 'eating_worldbook.json', name: '飲食預設', desc: '飲食相關設定', lang: 'zh' },
    { id: 'universal_reset', file: 'universal_reset_worldbook.json', name: '通用重置預設', desc: '通用重置設定', lang: 'zh' }
];

let selectedWorldbooks = [];

function loadSelectedWorldbooks() {
    try {
        const saved = localStorage.getItem('sx_worldbook_selected_builtins');
        if (saved) {
            selectedWorldbooks = JSON.parse(saved);
        }
    } catch (e) {
        selectedWorldbooks = [];
    }
    return selectedWorldbooks;
}

function saveSelectedWorldbooks(selections) {
    selectedWorldbooks = selections;
    localStorage.setItem('sx_worldbook_selected_builtins', JSON.stringify(selections));
}

window.openImportModal = function() {
    const modal = document.getElementById('import-modal');
    const list = document.getElementById('builtin-list');
    if (!modal || !list) return;
    
    loadSelectedWorldbooks();
    
    list.innerHTML = BUILTIN_WORLDBOOKS.map(wb => {
        const isSelected = selectedWorldbooks.includes(wb.id);
        return `
            <div class="builtin-item ${isSelected ? 'selected' : ''}" data-id="${wb.id}">
                <div class="builtin-item-checkbox"></div>
                <div class="builtin-item-info">
                    <div class="builtin-item-name">${wb.name}</div>
                    <div class="builtin-item-desc">${wb.desc}</div>
                </div>
                ${isSelected ? '<span class="builtin-item-badge">已選</span>' : ''}
            </div>
        `;
    }).join('');
    
    list.querySelectorAll('.builtin-item').forEach(item => {
        item.addEventListener('click', () => {
            item.classList.toggle('selected');
            const badge = item.querySelector('.builtin-item-badge');
            if (item.classList.contains('selected')) {
                if (!badge) {
                    const newBadge = document.createElement('span');
                    newBadge.className = 'builtin-item-badge';
                    newBadge.textContent = '已選';
                    item.appendChild(newBadge);
                }
            } else if (badge) {
                badge.remove();
            }
        });
    });
    
    modal.classList.remove('hidden');
};

window.closeImportModal = function() {
    const modal = document.getElementById('import-modal');
    if (modal) modal.classList.add('hidden');
};

window.confirmImportSelection = async function() {
    const selectedItems = document.querySelectorAll('.builtin-item.selected');
    const selectedIds = Array.from(selectedItems).map(item => item.dataset.id);
    
    if (selectedIds.length === 0) {
        alert(t('selectAtLeastOne') || '請至少選擇一個預設');
        return;
    }
    
    saveSelectedWorldbooks(selectedIds);
    
    const categories = ['cot', 'style', 'global', 'keywords', 'backend', 'theater'];
    const mergedData = {
        sx_worldbook_cot: [],
        sx_worldbook_style: [],
        sx_worldbook_global: [],
        sx_worldbook_keywords: [],
        sx_worldbook_backend: []
    };
    
    let importCount = 0;
    for (const id of selectedIds) {
        const wb = BUILTIN_WORLDBOOKS.find(w => w.id === id);
        if (!wb) continue;
        
        try {
            const response = await fetch(wb.file);
            if (!response.ok) continue;
            
            const data = await response.json();
            categories.forEach(cat => {
                const key = `sx_worldbook_${cat}`;
                if (data[key] && Array.isArray(data[key])) {
                    mergedData[key] = mergedData[key].concat(data[key]);
                }
            });
            importCount++;
        } catch (e) {
            console.error(`Failed to load ${wb.file}:`, e);
        }
    }
    
    categories.forEach(cat => {
        const key = `sx_worldbook_${cat}`;
        const container = document.querySelector(`#${cat} .list-container`);
        
        if (container && mergedData[key].length > 0) {
            container.innerHTML = '';
            mergedData[key].forEach(entry => {
                const isEnabled = entry.enabled !== undefined ? entry.enabled : true;
                container.insertAdjacentHTML('beforeend', createDrawerItemHTML(
                    entry.title,
                    entry.triggers.join(', '),
                    entry.content,
                    isEnabled
                ));
            });
        }
    });
    
    const parts = window.getSerializedWorldbookParts();
    window.persistWorldbookIndex?.(parts);
    
    if (window.parent && typeof window.parent.saveAll === 'function') {
        await window.parent.saveAll();
    }
    
    if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'WORLD_BOOK_UPDATED' }, '*');
    }
    
    closeImportModal();
    await saveToPersistentStorage();
    alert((t('importSuccessCount') || '已成功導入 {count} 個預設').replace('{count}', importCount));
};

const i18n = {
    'zh-Hant': {
        back: '返回',
        worldbook: '世界書',
        cot: '思維鏈',
        style: '文風',
        global: '全域',
        keywords: '關鍵字',
        backend: '後端',
        newEntry: '新條目',
        enterKeyword: '請輸入關鍵字',
        keywordLabel: '關鍵字：',
        enterContent: '請輸入細項內容...',
        saveChanges: '保存更動',
        syncSuccess: '同步成功 ✓',
        importIvory: '導入象牙塔預設',
        confirmImport: '確定要導入象牙塔預設嗎？這將覆蓋現有資料。',
        importSuccess: '象牙塔預設導入成功！',
        importFailed: '導入失敗: ',
        cannotLoad: '無法載入象牙塔預設文件',
        confirmDelete: '確定要刪除此條目嗎？',
        modelSelector: '模型選擇器',
        largeModel: '大型模型',
        mediumModel: '中型模型',
        localModel: '本地模型',
        custom: '自定義',
        noDataImport: '未檢測到現有資料，自動導入象牙塔預設...',
        autoImportSuccess: '象牙塔預設自動導入成功',
        uiRestored: '世界書 UI 還原完成',
        selectBuiltin: '選擇要導入的內建預設',
        selectAtLeastOne: '請至少選擇一個預設',
        importSuccessCount: '已成功導入 {count} 個預設',
        builtinPresets: '內建預設'
    },
    'zh-Hans': {
        back: '返回',
        worldbook: '世界书',
        cot: '思维链',
        style: '文风',
        global: '全域',
        keywords: '关键字',
        backend: '后端',
        newEntry: '新条目',
        enterKeyword: '请输入关键字',
        keywordLabel: '关键字：',
        enterContent: '请输入细项内容...',
        saveChanges: '保存更动',
        syncSuccess: '同步成功 ✓',
        importIvory: '导入象牙塔预设',
        confirmImport: '确定要导入象牙塔预设吗？这将覆盖现有数据。',
        importSuccess: '象牙塔预设导入成功！',
        importFailed: '导入失败: ',
        cannotLoad: '无法载入象牙塔预设文件',
        confirmDelete: '确定要删除此条目吗？',
        modelSelector: '模型选择器',
        largeModel: '大型模型',
        mediumModel: '中型模型',
        localModel: '本地模型',
        custom: '自定义',
        noDataImport: '未检测到现有数据，自动导入象牙塔预设...',
        autoImportSuccess: '象牙塔预设自动导入成功',
        uiRestored: '世界书 UI 还原完成',
        selectBuiltin: '选择要导入的内建预设',
        selectAtLeastOne: '请至少选择一个预设',
        importSuccessCount: '已成功导入 {count} 个预设',
        builtinPresets: '内建预设'
    },
    'en-US': {
        back: 'Back',
        worldbook: 'Worldbook',
        cot: 'CoT',
        style: 'Style',
        global: 'Global',
        keywords: 'Keywords',
        backend: 'Backend',
        newEntry: 'New Entry',
        enterKeyword: 'Enter keywords',
        keywordLabel: 'Keywords: ',
        enterContent: 'Enter content...',
        saveChanges: 'Save',
        syncSuccess: 'Synced ✓',
        importIvory: 'Import Ivory Tower Preset',
        confirmImport: 'Import Ivory Tower preset? This will overwrite existing data.',
        importSuccess: 'Ivory Tower preset imported!',
        importFailed: 'Import failed: ',
        cannotLoad: 'Cannot load Ivory Tower preset file',
        confirmDelete: 'Delete this entry?',
        modelSelector: 'Model Selector',
        largeModel: 'Large Models',
        mediumModel: 'Medium Models',
        localModel: 'Local Models',
        custom: 'Custom',
        noDataImport: 'No data found, auto-importing Ivory Tower preset...',
        autoImportSuccess: 'Ivory Tower preset auto-imported',
        uiRestored: 'Worldbook UI restored',
        selectBuiltin: 'Select built-in presets to import',
        selectAtLeastOne: 'Please select at least one preset',
        importSuccessCount: 'Successfully imported {count} preset(s)',
        builtinPresets: 'Built-in Presets'
    },
    'ja-JP': {
        back: '戻る',
        worldbook: 'ワールドブック',
        cot: '思考チェーン',
        style: '文体',
        global: 'グローバル',
        keywords: 'キーワード',
        backend: 'バックエンド',
        newEntry: '新規エントリ',
        enterKeyword: 'キーワードを入力',
        keywordLabel: 'キーワード：',
        enterContent: '内容を入力...',
        saveChanges: '保存',
        syncSuccess: '同期完了 ✓',
        importIvory: '象牙塔プリセットをインポート',
        confirmImport: '象牙塔プリセットをインポートしますか？既存のデータは上書きされます。',
        importSuccess: '象牙塔プリセットのインポートに成功！',
        importFailed: 'インポート失敗: ',
        cannotLoad: '象牙塔プリセットファイルを読み込めません',
        confirmDelete: 'このエントリを削除しますか？',
        modelSelector: 'モデル選択',
        largeModel: '大型モデル',
        mediumModel: '中型モデル',
        localModel: 'ローカルモデル',
        custom: 'カスタム',
        noDataImport: 'データが見つかりません。象牙塔プリセットを自動インポート...',
        autoImportSuccess: '象牙塔プリセットの自動インポートに成功',
        uiRestored: 'ワールドブックUI復元完了',
        selectBuiltin: 'インポートするビルトインプリセットを選択',
        selectAtLeastOne: '少なくとも1つのプリセットを選択してください',
        importSuccessCount: '{count}個のプリセットを正常にインポートしました',
        builtinPresets: 'ビルトインプリセット'
    },
    'ko-KR': {
        back: '뒤로',
        worldbook: '월드북',
        cot: '사고체인',
        style: '문체',
        global: '글로벌',
        keywords: '키워드',
        backend: '백엔드',
        newEntry: '새 항목',
        enterKeyword: '키워드 입력',
        keywordLabel: '키워드: ',
        enterContent: '내용 입력...',
        saveChanges: '저장',
        syncSuccess: '동기화 완료 ✓',
        importIvory: '상아탑 프리셋 가져오기',
        confirmImport: '상아탑 프리셋을 가져오시겠습니까? 기존 데이터가 덮어씌워집니다.',
        importSuccess: '상아탑 프리셋 가져오기 성공!',
        importFailed: '가져오기 실패: ',
        cannotLoad: '상아탑 프리셋 파일을 로드할 수 없습니다',
        confirmDelete: '이 항목을 삭제하시겠습니까?',
        modelSelector: '모델 선택',
        largeModel: '대형 모델',
        mediumModel: '중형 모델',
        localModel: '로컬 모델',
        custom: '커스텀',
        noDataImport: '데이터가 없습니다. 상아탑 프리셋 자동 가져오기...',
        autoImportSuccess: '상아탑 프리셋 자동 가져오기 성공',
        uiRestored: '월드북 UI 복원 완료',
        selectBuiltin: '가져올 빌트인 프리셋 선택',
        selectAtLeastOne: '최소 하나의 프리셋을 선택하세요',
        importSuccessCount: '{count}개의 프리셋을 성공적으로 가져왔습니다',
        builtinPresets: '빌트인 프리셋'
    }
};

function getCurrentLang() {
    const rawLang = localStorage.getItem('sxiphone_lang') || 'zh-Hant';
    const aliasMap = {
        'zh-TW': 'zh-Hant', 'zh-HK': 'zh-Hant', 'zh-MO': 'zh-Hant',
        'zh-CN': 'zh-Hans', 'zh-SG': 'zh-Hans'
    };
    const normalized = aliasMap[rawLang] || rawLang;
    return i18n[normalized] ? normalized : 'zh-Hant';
}

function t(key) {
    const lang = getCurrentLang();
    return i18n[lang]?.[key] || i18n['zh-Hant'][key] || key;
}

function applyLanguageToUI() {
    document.querySelector('.nav-title').textContent = t('worldbook');
    document.querySelector('.btn-back').innerHTML = `<i class="fas fa-chevron-left"></i> ${t('back')}`;
    
    document.querySelectorAll('.tab-item').forEach((tab, idx) => {
        const keys = ['cot', 'style', 'global', 'keywords', 'backend'];
        if (keys[idx]) tab.textContent = t(keys[idx]);
    });
    
    const fabImport = document.querySelector('.fab-import');
    if (fabImport) fabImport.title = t('selectBuiltin');
    
    const importModalTitle = document.getElementById('import-modal-title');
    if (importModalTitle) importModalTitle.textContent = t('selectBuiltin');
    
    const modelLabel = document.querySelector('.model-selector-label');
    if (modelLabel) modelLabel.textContent = t('modelSelector');
    
    const optgroups = document.querySelectorAll('#modelSelector optgroup');
    if (optgroups.length >= 3) {
        optgroups[0].label = t('largeModel');
        optgroups[1].label = t('mediumModel');
        optgroups[2].label = t('localModel');
    }
    
    const customOption = document.querySelector('#modelSelector option[value="custom"]');
    if (customOption) customOption.textContent = t('custom');
}

/**
 * 序列化世界書：將各分頁拆解為獨立條目，供 saveAll 調用
 * 這是為了對接 settings.js 的細分存儲需求
 */
window.getSerializedWorldbookParts = function() {
    const categories = ['cot', 'style', 'global', 'keywords', 'backend', 'theater'];
    const serialized = {};
    let autoForbiddenWords = []; // 用於存放自動偵測到的禁止詞

    categories.forEach((cat) => {
        const page = document.getElementById(cat);
        if (!page) return;

        const items = page.querySelectorAll('.drawer-item');
        serialized[`sx_worldbook_${cat}`] = Array.from(items).map(item => {
            // 1. 先提取基本資料
            const title = item.querySelector('.world-title').innerText;
            const content = item.querySelector('.ios-textarea').value;
            const triggers = item.querySelector('.trigger-hint').innerText
                                .replace(t('keywordLabel'), '')
                                .replace('關鍵字：', '')
                                .replace('关键字：', '')
                                .replace('Keywords: ', '')
                                .replace('キーワード：', '')
                                .replace('키워드: ', '')
                                .split(/[,，]/)
                                .map(t => t.trim())
                                .filter(t => t);

            // 2. 執行禁止詞自動偵測邏輯
            if (title.includes('禁止') || title.toLowerCase().includes('forbidden') || content.includes('<forbidden>')) {
                // 提取內容：優先找標籤，若無則取整段內容
                let words = "";
                const match = content.match(/<forbidden>([\s\S]*?)<\/forbidden>/i);
                words = match ? match[1] : content;

                const cleanedWords = words.split(/[,\n，]/).map(w => w.trim()).filter(w => w);
                autoForbiddenWords = autoForbiddenWords.concat(cleanedWords);
            }

            // 3. 回傳標準化的條目物件
            return {
                title: title,
                triggers: triggers,
                content: content,
                enabled: item.classList.contains('enabled')
            };
        }).filter(entry => entry.content.trim() !== "");
    });

    // 存入去重後的自動偵測禁止詞清單
    serialized['sx_detected_forbidden'] = [...new Set(autoForbiddenWords)];
    return serialized;
};

window.buildWorldbookIndexFromParts = function(parts) {
    const categories = ['cot', 'style', 'global', 'keywords', 'backend', 'theater'];
    const index = [];

    categories.forEach(cat => {
        const key = `sx_worldbook_${cat}`;
        const entries = parts?.[key] || [];
        if (!Array.isArray(entries)) return;
        entries.forEach((entry, idx) => {
            if (!entry || !entry.title) return;
            index.push({
                id: `${cat}_${idx}_${entry.title}`,
                title: entry.title,
                category: cat
            });
        });
    });

    return index;
};

window.persistWorldbookIndex = function(parts) {
    const index = window.buildWorldbookIndexFromParts(parts || {});
    localStorage.setItem('sx_worldbook_index', JSON.stringify(index));
    return index;
};

window.getWorldbookIndex = function() {
    const parts = window.getSerializedWorldbookParts ? window.getSerializedWorldbookParts() : {};
    return window.persistWorldbookIndex(parts);
};
/**
 * 產生條目 HTML 模板 (包含刪除按鈕與 iOS 風格結構)
 */
function createDrawerItemHTML(title, triggers, content = "", enabled = true) {
    title = title || t('newEntry');
    triggers = triggers || t('enterKeyword');
    const enabledClass = enabled ? 'enabled' : 'disabled';
    const enabledIcon = enabled ? 'fa-toggle-on' : 'fa-toggle-off';
    return `
        <div class="drawer-item ${enabledClass}">
            <header class="drawer-header">
                <div class="title-group">
                    <h3 class="world-title" contenteditable="true">${title}</h3>
                    <p class="trigger-hint" contenteditable="true">${t('keywordLabel')}${triggers}</p>
                </div>
                <div class="header-controls">
                    <span class="btn-toggle" data-enabled="${enabled}"><i class="fas ${enabledIcon}"></i></span>
                    <span class="btn-delete"><i class="fas fa-trash-alt"></i></span>
                    <span class="chevron"></span>
                </div>
            </header>
            <div class="drawer-body">
                <textarea class="ios-textarea" placeholder="${t('enterContent')}">${content}</textarea>
                <button class="btn-save">${t('saveChanges')}</button>
            </div>
        </div>
    `;
}

/**
 * UI 還原函式：優先從 LocalForage (iOS 持久層) 讀取細分條目
 */
async function hydrateWorldbookUI() {
    const categories = ['cot', 'style', 'global', 'keywords', 'backend', 'theater'];
    let persistedData = null;

    if (typeof localforage !== 'undefined') {
        try {
            persistedData = await localforage.getItem('sx_app_persisted_data');
        } catch (e) { console.error("LocalForage 讀取失敗", e); }
    }

    const savedSelections = loadSelectedWorldbooks();
    let hasExistingData = false;
    
    for (const cat of categories) {
        const key = `sx_worldbook_${cat}`;
        if (persistedData && persistedData[key] && persistedData[key].length > 0) {
            hasExistingData = true;
            break;
        }
        const raw = localStorage.getItem(key);
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                if (parsed && parsed.length > 0) {
                    hasExistingData = true;
                    break;
                }
            } catch(e) {}
        }
    }

    if (!hasExistingData && savedSelections.length > 0) {
        const mergedData = {
            sx_worldbook_cot: [],
            sx_worldbook_style: [],
            sx_worldbook_global: [],
            sx_worldbook_keywords: [],
            sx_worldbook_backend: []
        };
        
        for (const id of savedSelections) {
            const wb = BUILTIN_WORLDBOOKS.find(w => w.id === id);
            if (!wb) continue;
            
            try {
                const response = await fetch(wb.file);
                if (!response.ok) continue;
                
                const data = await response.json();
                categories.forEach(cat => {
                    const key = `sx_worldbook_${cat}`;
                    if (data[key] && Array.isArray(data[key])) {
                        mergedData[key] = mergedData[key].concat(data[key]);
                    }
                });
            } catch (e) {
                console.error(`Failed to load ${wb.file}:`, e);
            }
        }
        
        for (const cat of categories) {
            const key = `sx_worldbook_${cat}`;
            if (mergedData[key] && mergedData[key].length > 0) {
                localStorage.setItem(key, JSON.stringify(mergedData[key]));
                hasExistingData = true;
            }
        }
    }

    if (!hasExistingData) {
        const importFlag = localStorage.getItem('sx_worldbook_ivory_imported');
        if (!importFlag) {
            console.log(t('noDataImport'));
            await window.importIvoryTower(true);
            localStorage.setItem('sx_worldbook_ivory_imported', 'true');
        }
        return;
    }
    
    localStorage.setItem('sx_worldbook_ivory_imported', 'true');

    for (const cat of categories) {
        const key = `sx_worldbook_${cat}`;
        let entries = [];

        if (persistedData && persistedData[key]) {
            entries = persistedData[key];
        } else {
            const raw = localStorage.getItem(key);
            if (raw) {
                try { entries = JSON.parse(raw); } catch(e) {}
            }
        }

        const container = document.querySelector(`#${cat} .list-container`);
        if (container && entries.length > 0) {
            container.innerHTML = '';
            entries.forEach(entry => {
                const isEnabled = entry.enabled !== undefined ? entry.enabled : true;
                container.insertAdjacentHTML('beforeend', createDrawerItemHTML(entry.title, entry.triggers.join(', '), entry.content, isEnabled));
            });
        }
    }
    console.log(t('uiRestored') + " (環境: " + UserEnv.envName() + ")");
}

document.addEventListener('DOMContentLoaded', () => {
    
    // 啟動時還原 UI
    hydrateWorldbookUI().then(() => {
        const parts = window.getSerializedWorldbookParts();
        window.persistWorldbookIndex?.(parts);
    });

    window.addEventListener('message', (event) => {
        const data = event.data;
        if (!data || typeof data !== 'object') return;
        if (data.type === 'REQUEST_WORLD_BOOK_SYNC') {
            const parts = window.getSerializedWorldbookParts();
            window.persistWorldbookIndex?.(parts);
            if (window.parent && window.parent !== window) {
                window.parent.postMessage({ type: 'WORLD_BOOK_SYNC_READY' }, '*');
            }
        }
        if (data.type === 'LANGUAGE_CHANGED' && data.lang) {
            localStorage.setItem('sxiphone_lang', data.lang);
            if (document.documentElement) {
                document.documentElement.lang = data.lang;
            }
            applyLanguageToUI();
        }
        if (data.type === 'WORLD_BOOK_UPDATED') {
            const parts = window.getSerializedWorldbookParts();
            window.persistWorldbookIndex?.(parts);
            if (window.parent && window.parent !== window) {
                window.parent.postMessage({ type: 'WORLD_BOOK_SYNC_READY' }, '*');
            }
        }
        if (data.type === 'APP_WILL_CLOSE') {
            saveWorldbookData();
        }
    });

    // 1. 分頁切換邏輯
    const tabs = document.querySelectorAll('.tab-item');
    const pages = document.querySelectorAll('.page-content');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.getAttribute('data-target');
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            pages.forEach(p => {
                p.classList.toggle('active', p.id === targetId);
            });
        });
    });

    // 2. 抽屜展開與刪除 (事件委託)
    document.addEventListener('click', (e) => {
        const header = e.target.closest('.drawer-header');
        const deleteBtn = e.target.closest('.btn-delete');
        const toggleBtn = e.target.closest('.btn-toggle');

        if (toggleBtn) {
            const item = toggleBtn.closest('.drawer-item');
            const isEnabled = toggleBtn.dataset.enabled === 'true';
            toggleBtn.dataset.enabled = (!isEnabled).toString();
            item.classList.toggle('enabled', !isEnabled);
            item.classList.toggle('disabled', isEnabled);
            const icon = toggleBtn.querySelector('i');
            icon.className = isEnabled ? 'fas fa-toggle-off' : 'fas fa-toggle-on';
            return;
        }

        // 處理刪除
        if (deleteBtn && confirm(t('confirmDelete'))) {
            const item = deleteBtn.closest('.drawer-item');
            item.style.opacity = '0';
            setTimeout(async () => {
                item.remove();
                // 刪除後連動 saveAll 更新持久層
                if (window.parent && typeof window.parent.saveAll === 'function') {
                    await window.parent.saveAll();
                }
            }, 300);
            return;
        }

        // 處理展開/收合
        if (header) {
            header.parentElement.classList.toggle('open');
        }
    });

    // 3. 懸浮新增 (FAB)
    const fabAdd = document.querySelector('.fab-add');
    if (fabAdd) {
        fabAdd.addEventListener('click', () => {
            const activeList = document.querySelector('.page-content.active .list-container');
            if (activeList) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = createDrawerItemHTML();
                const newItem = tempDiv.firstElementChild;
                newItem.classList.add('open');
                activeList.prepend(newItem);
                const parts = window.getSerializedWorldbookParts();
                window.persistWorldbookIndex?.(parts);
                if (window.parent && window.parent !== window) {
                    window.parent.postMessage({ type: 'WORLD_BOOK_UPDATED' }, '*');
                }
            }
        });
    }

    // 4. 保存按鈕：連動全域 saveAll 或獨立存儲
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('btn-save')) {
            const btn = e.target;
            
            // 優先執行全域保存 (會觸發 IndexedDB 寫入)
            if (window.parent && typeof window.parent.saveAll === 'function') {
                await window.parent.saveAll();
            } else {
                // 獨立運行時的保險邏輯
                const parts = window.getSerializedWorldbookParts();
                Object.keys(parts).forEach(key => {
                    localStorage.setItem(key, JSON.stringify(parts[key]));
                });
                window.persistWorldbookIndex?.(parts);
            }

            if (window.parent && window.parent !== window) {
                window.parent.postMessage({
                    type: 'WORLD_BOOK_UPDATED'
                }, '*');
            }

            // UI 反饋
            btn.innerText = t('syncSuccess');
            btn.style.backgroundColor = '#30D158';
            setTimeout(() => {
                btn.innerText = t('saveChanges');
                btn.style.backgroundColor = '';
                btn.closest('.drawer-item').classList.remove('open');
            }, 800);
        }
    });
});
const saveWorldbookData = () => {
    try {
        const parts = window.getSerializedWorldbookParts();
        Object.keys(parts).forEach(key => {
            if (key !== 'sx_detected_forbidden') {
                localStorage.setItem(key, JSON.stringify(parts[key]));
            }
        });
        window.persistWorldbookIndex?.(parts);
        console.log("世界書數據已保存至 localStorage");
    } catch (e) {
        console.error("保存世界書數據失敗:", e);
    }
};

const saveToPersistentStorage = async () => {
    saveWorldbookData();
    
    if (typeof localforage !== 'undefined') {
        try {
            const parts = window.getSerializedWorldbookParts();
            const existingData = await localforage.getItem('sx_app_persisted_data') || {};
            await localforage.setItem('sx_app_persisted_data', {
                ...existingData,
                sx_worldbook_cot: parts.sx_worldbook_cot || [],
                sx_worldbook_style: parts.sx_worldbook_style || [],
                sx_worldbook_global: parts.sx_worldbook_global || [],
                sx_worldbook_keywords: parts.sx_worldbook_keywords || [],
                sx_worldbook_backend: parts.sx_worldbook_backend || []
            });
            console.log("世界書數據已保存至 IndexedDB (iOS 持久化)");
        } catch (e) {
            console.error("IndexedDB 保存失敗:", e);
        }
    }
};

window.addEventListener('pagehide', (event) => {
    saveWorldbookData();
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        saveWorldbookData();
    }
});

async function handleBack() {
    console.log("正在執行返回邏輯...");

    await saveToPersistentStorage();

    if (window.parent && typeof window.parent.saveAll === 'function') {
        await window.parent.saveAll();
    }

    const isIframe = window.parent && window.parent !== window;

    if (isIframe) {
        try {
            window.parent.postMessage({
                type: 'closeApp',
                appId: 'worldbook' 
            }, '*');
            console.log("已透過 postMessage 發送關閉指令");
            return; 
        } catch (e) {
            console.warn("postMessage 發送失敗:", e);
        }
    }

    const modal = document.getElementById('albumModal');
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

window.importIvoryTower = async function(silent = false) {
    if (!silent && !confirm(t('confirmImport'))) {
        return;
    }
    
    try {
        const response = await fetch('ivory_tower_worldbook.json');
        if (!response.ok) throw new Error(t('cannotLoad'));
        
        const data = await response.json();
        const categories = ['cot', 'style', 'global', 'keywords', 'backend', 'theater'];
        
        categories.forEach(cat => {
            const key = `sx_worldbook_${cat}`;
            const entries = data[key] || [];
            const container = document.querySelector(`#${cat} .list-container`);
            
            if (container && entries.length > 0) {
                container.innerHTML = '';
                entries.forEach(entry => {
                    const isEnabled = entry.enabled !== undefined ? entry.enabled : true;
                    container.insertAdjacentHTML('beforeend', createDrawerItemHTML(
                        entry.title, 
                        entry.triggers.join(', '), 
                        entry.content, 
                        isEnabled
                    ));
                });
            }
        });
        
        const parts = window.getSerializedWorldbookParts();
        window.persistWorldbookIndex?.(parts);
        
        if (window.parent && typeof window.parent.saveAll === 'function') {
            await window.parent.saveAll();
        }
        
        if (!silent) {
            alert(t('importSuccess'));
        } else {
            console.log(t('autoImportSuccess'));
        }
    } catch (error) {
        console.error(t('importFailed'), error);
        if (!silent) {
            alert(t('importFailed') + error.message);
        }
    }
};

window.getModelSelector = function() {
    const selector = document.getElementById('modelSelector');
    return selector ? selector.value : 'claude';
};

window.setModelSelector = function(model) {
    const selector = document.getElementById('modelSelector');
    if (selector) {
        selector.value = model;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    applyLanguageToUI();
    
    const modelSelector = document.getElementById('modelSelector');
    if (modelSelector) {
        const savedModel = localStorage.getItem('sx_worldbook_model');
        if (savedModel) {
            modelSelector.value = savedModel;
        }
        
        modelSelector.addEventListener('change', () => {
            localStorage.setItem('sx_worldbook_model', modelSelector.value);
        });
    }
});

// 監聽資料還原事件
window.addEventListener('sxiphone-data-restored', async (event) => {
    console.log('[Worldbook] 收到資料還原通知，刷新 UI...');
    setTimeout(async () => {
        await hydrateWorldbookUI();
        const parts = window.getSerializedWorldbookParts();
        window.persistWorldbookIndex?.(parts);
    }, 100);
});