const fs = require('fs');
const path = require('path');

const SOURCE_FILE = path.join(__dirname, '..', '【请先解压】象牙塔 v2.3.0 @电波系', '【请先解压】象牙塔 v2.3.0 @电波系', '0.预设本体', '【MoM】象牙塔 v2.3.0 @电波系.json');
const OUTPUT_FILE = path.join(__dirname, 'ivory_tower_worldbook.json');

// 模型特化世界書檔案列表
const MODEL_WORLDBOOK_FILES = [
    'claude42_worldbook.json',
    'claude46_worldbook.json',
    'sonnet_worldbook.json',
    'opus_worldbook.json',
    '4o_worldbook.json',
    '5.2_worldbook.json',
    'gemini31_worldbook.json',
    'deepseek_worldbook.json',
    'deepseek2_worldbook.json',
    'kimi_worldbook.json',
    'kimi25_worldbook.json',
    'glm_worldbook.json',
    'minimax_worldbook.json',
    'grok42_worldbook.json',
    'mino_worldbook.json'
];

const CATEGORIES = {
    cot: [],
    style: [],
    global: [],
    keywords: [],
    backend: []
};

const STYLE_COURSES = [
    '🍁叙事动力学', '🍁烟火摄影学', '🍁复调群像学', '🍁共时生态学', '🍁禁忌关系学',
    '🍁怪诞式美学', '🍁悬疑构筑学', '🍁记忆迷宫学', '🎟️生活喜剧', '🎟️黑色幽默',
    '🎟️抒情现实', '🎟️东方古典', '🎟️幻想文学', '🎟️悬疑推理', '🎟️中式恐怖',
    '🎟️扭曲情感', '🎟️理想主义', '🎟️女性主义', '🎟️感官主义', '🎟️虚无主义',
    '🎟️极繁主义', '🎟️超现实主义', '🎟️自定义文风'
];

const TOWERS = [
    '🎁盲盒之塔', '🎁涩涩之塔', '🎁游戏之塔', '🎁群聊之塔', '🎁恋爱之塔',
    '🎁论坛之塔', '🎁同人之塔', '🎁八卦之塔', '🎁回忆之塔', '🎁平行之塔',
    '🎁美食之塔', '🎁广告之塔', '🎁报告之塔', '🎁每日之塔', '🎁文学之塔',
    '🎁哀伤之塔', '🎁幸福之塔'
];

const GOSSIP_GROUPS = [
    '🛟海底小纵队', '💥AI也疯狂', '🎲博德之门', '⚔️武林外传', '👩\u200d🏫回声教研室',
    '💖恋爱观察员', '💅宫斗甄嬛传', '🌸大观园之旅', '🚗疯狂动物城', '🥊日漫大乱斗',
    '🥊漫威DC大乱斗', '🥊综英美大乱斗', '🥊卡普空大乱斗', '🥊任天堂大乱斗',
    '🥊中国文学大乱斗', '🥊外国文学大乱斗'
];

const NSFW_MODULES = [
    '❤️\u200d🔥英抓色情指导', '💘温柔性爱前置', '💘粗暴性爱前置', '💘BDSM前置',
    '🔥M4A', '🔥M4F', '🔥M4M', '🔥F4A', '🔥F4M', '🔥F4F', '🔥多人', '🔥双性', '🔥人外',
    '💗保护屁股', '💗不許睡了', '💗安全措施', '💓澀個不停', '💓不許澀了',
    '💋凝视主导方', '💋凝视被动方'
];

const CORE_MODULES = [
    '🏛️象牙塔的回声', '🕸️方尖碑', '🌍世界公理', '🕹️全局写作', '📜获取变量',
    '💎写作规范', '💖好感指南', '🧭内在罗盘·常规', '🔗关系引力·自然',
    '⛔综合禁令', '🚫防男同', '🚫防短句泛滥', '🚫防修罗场', '🚫防转折', '🚫防昇华',
    '✅适当比喻', '✅加强对白', '✅回复扩写'
];

const COT_MODULES = [
    '📍常规创作思维', '📍简化创作思维', '✂️评审草稿', '❄️字数检测', '❄️防抢检测',
    '❄️文笔加强', '❄️创作心锚', '❄️禁词检测'
];

const SKIP_ENTRIES = [
    '×┈┈┈୨୧┈┈┈×', '✉️入学须知', '🌱 新生指南', '🔒防429 by 果实',
    '˙⟡🪄选修课程选修课程₊˚⊹', '˙⟡📚文学工坊₊˚⊹', '✧─叙事节奏─✧', '📸自由变奏',
    '📸慢板舒缓', '📸急板快叙', '╔文风指导开启╗', '╚文风指导结束╝',
    '✦✦背景信息开启✦✦', '✦✦读取用户信息✦✦', '✦✦读取角色信息✦✦',
    '✦✦背景信息结束✦✦', '✦✦历史前文开启✦✦', '✦✦历史前文结束✦✦',
    '˙⟡💕禁忌报告厅₊˚⊹', '╔NSFW特化开启╗', '✧─三选一指导─✧', '✧─多选一标签─✧',
    '✧─可选补丁─✧', '╔小剧场开启╗', '✧─二选一头部─✧', '✧─小剧场内容─✧',
    '╚小剧场结束╝', '╔文末吐槽开启╗', '🎉NPC乱入', '🎉NPC不乱入',
    '✧─令行禁止─✧', '✧─字数控制─✧', '✧─语言选择─✧', '˙⟡🔭课外活动₊˚⊹',
    '✧─神秘补丁─✧', '✧─摘要定制─✧', '📌常规正文要求', '📌评审正文要求',
    '📎长段落补丁', '📎自由段落补丁', '💜强制中文', '💜双语对话'
];

const MARKER_ENTRIES = [
    '🌐世界书·前', '🌐世界书·后', '🪶用户描述', '🪶角色描述', '🪶角色设定',
    '🪶场景描述', 'Chat Examples', 'Chat History'
];

function generateTriggers(name) {
    const triggers = [];
    const cleanName = name.replace(/^[^\s]+\s*/, '').replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ' ').trim();
    
    if (cleanName.includes('塔')) {
        triggers.push('小劇場');
        const towerName = cleanName.replace('之塔', '');
        triggers.push(towerName);
    } else if (cleanName.includes('吐槽')) {
        triggers.push('吐槽');
    } else if (STYLE_COURSES.some(s => name.includes(s.replace(/^[^\s]+\s*/, '')))) {
        const styleName = cleanName;
        triggers.push(styleName);
        if (styleName.includes('喜劇')) triggers.push('日常', '幽默');
        if (styleName.includes('黑色')) triggers.push('諷刺', '都市');
        if (styleName.includes('抒情')) triggers.push('溫柔', '詩意');
        if (styleName.includes('古典')) triggers.push('古風', '意境');
        if (styleName.includes('幻想')) triggers.push('奇幻', '科幻');
        if (styleName.includes('懸疑')) triggers.push('推理', '謎題');
        if (styleName.includes('恐怖')) triggers.push('民俗', '陰森');
        if (styleName.includes('扭曲')) triggers.push('病嬌', '黑泥');
        if (styleName.includes('理想')) triggers.push('純愛', '治癒');
        if (styleName.includes('女性')) triggers.push('獨立', '主體');
        if (styleName.includes('感官')) triggers.push('慾望', '張力');
        if (styleName.includes('虛無')) triggers.push('崩壞', '荒謬');
        if (styleName.includes('極繁')) triggers.push('巴洛克', '繁複');
        if (styleName.includes('超現實')) triggers.push('夢境', '潛意識');
        if (styleName.includes('敘事')) triggers.push('節奏', '張力');
        if (styleName.includes('煙火')) triggers.push('生活流', '細節');
        if (styleName.includes('復調')) triggers.push('群像', '多角色');
        if (styleName.includes('共時')) triggers.push('景深', '環境');
        if (styleName.includes('禁忌')) triggers.push('禁忌', '權力');
        if (styleName.includes('怪誕')) triggers.push('怪誕', '氛圍');
        if (styleName.includes('記憶')) triggers.push('記憶', '碎片');
    } else if (NSFW_MODULES.some(s => name.includes(s.replace(/^[^\s]+\s*/, '')))) {
        triggers.push('NSFW');
        if (name.includes('M4F') || name.includes('F4M')) triggers.push('異性');
        if (name.includes('BDSM')) triggers.push('BDSM');
        if (name.includes('溫柔')) triggers.push('溫柔');
        if (name.includes('粗暴')) triggers.push('粗暴');
    }
    
    if (triggers.length === 0) {
        const words = cleanName.split(/[\s,，、]+/).filter(w => w.length > 0);
        triggers.push(...words.slice(0, 3));
    }
    
    return [...new Set(triggers)].slice(0, 5);
}

function getDefaultEnabled(name) {
    // 預設全部關閉，只有最基本的條目啟用
    if (name === '©️作者声明') return true;
    // 其他全部預設關閉，讓用戶自行選擇啟用
    return false;
}

function classifyEntry(entry) {
    const name = entry.name;
    
    if (SKIP_ENTRIES.includes(name) || MARKER_ENTRIES.includes(name)) {
        return null;
    }
    
    if (name === '©️作者声明') {
        return { category: 'global', priority: 0 };
    }
    
    if (COT_MODULES.some(m => name.includes(m.replace(/^[^\s]+\s*/, '')))) {
        return { category: 'cot', priority: 100 };
    }
    
    if (STYLE_COURSES.some(s => name.includes(s.replace(/^[^\s]+\s*/, '')))) {
        return { category: 'style', priority: 100 };
    }
    
    if (TOWERS.some(t => name.includes(t.replace(/^[^\s]+\s*/, '')))) {
        return { category: 'keywords', priority: 100 };
    }
    
    if (GOSSIP_GROUPS.some(g => name.includes(g.replace(/^[^\s]+\s*/, '')))) {
        return { category: 'keywords', priority: 200 };
    }
    
    if (NSFW_MODULES.some(n => name.includes(n.replace(/^[^\s]+\s*/, '')))) {
        return { category: 'keywords', priority: 300 };
    }
    
    if (CORE_MODULES.some(m => name.includes(m.replace(/^[^\s]+\s*/, '')))) {
        return { category: 'global', priority: 100 };
    }
    
    if (name.includes('內在羅盤') || name.includes('关系引力')) {
        return { category: 'global', priority: 100 };
    }
    
    if (name.includes('禁') || name.includes('防') || name.includes('✅')) {
        return { category: 'global', priority: 100 };
    }
    
    if (name.includes('神秘补丁') || name.includes('🧸')) {
        return { category: 'keywords', priority: 400 };
    }
    
    if (name.includes('🔮') || name.includes('角色关系') || name.includes('绝密档案') || name.includes('摘要伏笔')) {
        return { category: 'keywords', priority: 500 };
    }
    
    if (name.includes('状态栏') || name.includes('顶部栏') || name.includes('心绪回响') || name.includes('有求必应')) {
        return { category: 'keywords', priority: 600 };
    }
    
    return { category: 'global', priority: 200 };
}

function createModelConfigs() {
    const models = [
        {
            title: '模型配置：Claude',
            triggers: ['Claude', 'Anthropic'],
            content: `[模型特性：Claude]
- 擅長：文學性寫作、情感細節、心理描寫
- 觸發詞：roleplay, narrative, immersive, creative writing
- 系統提示詞前綴：You are an expert creative writer engaging in immersive roleplay...
- 思維鏈格式：<thinking>...</thinking>
- 建議溫度：1.0-1.2
- 建議 top_p：0.9-0.95
- 特殊指令：支持 XML 標籤、支持長上下文`,
            enabled: false
        },
        {
            title: '模型配置：GPT',
            triggers: ['GPT', 'OpenAI'],
            content: `[模型特性：GPT]
- 擅長：對話流暢、邏輯推理、多角色互動
- 觸發詞：roleplay, character, dialogue, storytelling
- 系統提示詞前綴：You are a skilled roleplay partner...
- 思維鏈格式：無特定格式要求
- 建議溫度：0.8-1.0
- 建議 top_p：0.9-1.0
- 特殊指令：支持 function calling、支持 JSON mode`,
            enabled: false
        },
        {
            title: '模型配置：Gemini',
            triggers: ['Gemini', 'Google'],
            content: `[模型特性：Gemini]
- 擅長：創意寫作、場景描寫、節奏控制
- 觸發詞：creative writing, storytelling, immersive
- 系統提示詞前綴：You are a creative storyteller...
- 思維鏈格式：<thinking>...</thinking>
- 建議溫度：1.2-1.5
- 建議 top_p：0.88-0.95
- 特殊指令：支持多模態、支持長上下文`,
            enabled: false
        },
        {
            title: '模型配置：DeepSeek',
            triggers: ['DeepSeek', '深度求索'],
            content: `[模型特性：DeepSeek]
- 擅長：邏輯推理、技術細節、代碼相關
- 觸發詞：roleplay, narrative, reasoning
- 系統提示詞前綴：You are an AI assistant engaging in creative roleplay...
- 思維鏈格式：自由格式
- 建議溫度：0.9-1.1
- 建議 top_p：0.9-0.95
- 特殊指令：支持代碼執行、支持推理模式`,
            enabled: false
        },
        {
            title: '模型配置：智譜GLM',
            triggers: ['智譜', 'GLM'],
            content: `[模型特性：智譜 GLM]
- 擅長：中文寫作、對話、知識問答
- 觸發詞：角色扮演, 創作, 敘事
- 系統提示詞前綴：你是一位專業的創作者，正在進行沉浸式角色扮演...
- 思維鏈格式：自由格式
- 建議溫度：0.9-1.2
- 建議 top_p：0.9-0.95
- 特殊指令：支持中文優化、支持長文本`,
            enabled: false
        },
        {
            title: '模型配置：Kimi',
            triggers: ['Kimi', '月之暗面'],
            content: `[模型特性：Kimi]
- 擅長：長文本處理、文檔理解、中文寫作
- 觸發詞：角色扮演, 創作, 敘事
- 系統提示詞前綴：你是一位專業的創作者...
- 思維鏈格式：自由格式
- 建議溫度：0.9-1.1
- 建議 top_p：0.9-0.95
- 特殊指令：支持超長上下文（200K）`,
            enabled: false
        },
        {
            title: '模型配置：MiniMax',
            triggers: ['MiniMax'],
            content: `[模型特性：MiniMax]
- 擅長：創意寫作、多輪對話、語音合成
- 觸發詞：角色扮演, 創作, 敘事
- 系統提示詞前綴：你是一位專業的創作者...
- 思維鏈格式：自由格式
- 建議溫度：1.0-1.3
- 建議 top_p：0.9-0.95
- 特殊指令：支持語音合成、支持多模態`,
            enabled: false
        },
        {
            title: '模型配置：本地模型',
            triggers: ['本地', 'Llama', 'Mistral', 'Qwen', 'Yi'],
            content: `[模型特性：本地模型]
- 擅長：通用寫作、對話
- 觸發詞：roleplay, narrative
- 系統提示詞前綴：You are a creative writer...
- 思維鏈格式：自由格式
- 建議溫度：0.8-1.2
- 建議 top_p：0.9-1.0
- 特殊指令：無`,
            enabled: false
        },
        {
            title: '模型配置：自定義',
            triggers: ['自定義', 'custom'],
            content: `[模型特性：自定義模型]
請根據您的模型特性自行調整以下參數：
- 擅長：[請填寫]
- 觸發詞：[請填寫]
- 系統提示詞前綴：[請填寫]
- 思維鏈格式：[請填寫]
- 建議溫度：[請填寫]
- 建議 top_p：[請填寫]
- 特殊指令：[請填寫]`,
            enabled: false
        }
    ];
    
    return models;
}

function loadModelWorldbooks() {
    const modelEntries = {
        cot: [],
        style: [],
        global: [],
        keywords: [],
        backend: []
    };
    
    MODEL_WORLDBOOK_FILES.forEach(filename => {
        const filepath = path.join(__dirname, filename);
        if (!fs.existsSync(filepath)) {
            console.log(`  跳過不存在的檔案：${filename}`);
            return;
        }
        
        try {
            const rawData = fs.readFileSync(filepath, 'utf-8');
            const data = JSON.parse(rawData);
            
            // 將所有條目設為預設關閉
            ['cot', 'style', 'global', 'keywords', 'backend'].forEach(cat => {
                const key = `sx_worldbook_${cat}`;
                const entries = data[key] || [];
                entries.forEach(entry => {
                    // 強制設為預設關閉
                    entry.enabled = false;
                    // 添加模型標籤到標題
                    if (!entry.title.startsWith('🔮')) {
                        entry.title = `🔮${entry.title}`;
                    }
                    modelEntries[cat].push({
                        ...entry,
                        priority: 50, // 較低優先級
                        source: filename.replace('_worldbook.json', '')
                    });
                });
            });
            
            console.log(`  載入 ${filename} 成功`);
        } catch (err) {
            console.log(`  載入 ${filename} 失敗：${err.message}`);
        }
    });
    
    return modelEntries;
}

function convertEntry(entry) {
    const classification = classifyEntry(entry);
    if (!classification) return null;
    
    return {
        title: entry.name,
        triggers: generateTriggers(entry.name),
        content: entry.content || '',
        enabled: getDefaultEnabled(entry.name),
        category: classification.category,
        priority: classification.priority
    };
}

function main() {
    console.log('讀取象牙塔預設文件...');
    const rawData = fs.readFileSync(SOURCE_FILE, 'utf-8');
    const sourceData = JSON.parse(rawData);
    
    console.log(`找到 ${sourceData.prompts.length} 個條目`);
    
    const convertedEntries = [];
    
    sourceData.prompts.forEach(entry => {
        const converted = convertEntry(entry);
        if (converted) {
            convertedEntries.push(converted);
        }
    });
    
    convertedEntries.forEach(entry => {
        CATEGORIES[entry.category].push(entry);
    });
    
    // 載入模型特化世界書
    console.log('\n載入模型特化世界書...');
    const modelWorldbooks = loadModelWorldbooks();
    
    // 合併模型特化條目到對應分類
    Object.keys(modelWorldbooks).forEach(cat => {
        modelWorldbooks[cat].forEach(entry => {
            CATEGORIES[cat].push(entry);
        });
    });
    
    Object.keys(CATEGORIES).forEach(cat => {
        CATEGORIES[cat].sort((a, b) => (a.priority || 100) - (b.priority || 100));
    });
    
    const modelConfigs = createModelConfigs();
    modelConfigs.forEach(config => {
        CATEGORIES.backend.push({
            ...config,
            priority: 100
        });
    });
    
    const output = {
        sx_worldbook_cot: CATEGORIES.cot.map(e => ({
            title: e.title,
            triggers: e.triggers,
            content: e.content,
            enabled: e.enabled
        })),
        sx_worldbook_style: CATEGORIES.style.map(e => ({
            title: e.title,
            triggers: e.triggers,
            content: e.content,
            enabled: e.enabled
        })),
        sx_worldbook_global: CATEGORIES.global.map(e => ({
            title: e.title,
            triggers: e.triggers,
            content: e.content,
            enabled: e.enabled
        })),
        sx_worldbook_keywords: CATEGORIES.keywords.map(e => ({
            title: e.title,
            triggers: e.triggers,
            content: e.content,
            enabled: e.enabled
        })),
        sx_worldbook_backend: CATEGORIES.backend.map(e => ({
            title: e.title,
            triggers: e.triggers,
            content: e.content,
            enabled: e.enabled
        }))
    };
    
    console.log('\n轉換統計：');
    console.log(`  思維鏈 (cot): ${output.sx_worldbook_cot.length} 條`);
    console.log(`  文風 (style): ${output.sx_worldbook_style.length} 條`);
    console.log(`  全域 (global): ${output.sx_worldbook_global.length} 條`);
    console.log(`  關鍵字 (keywords): ${output.sx_worldbook_keywords.length} 條`);
    console.log(`  後端 (backend): ${output.sx_worldbook_backend.length} 條`);
    
    const enabledCount = [
        ...output.sx_worldbook_cot,
        ...output.sx_worldbook_style,
        ...output.sx_worldbook_global,
        ...output.sx_worldbook_keywords,
        ...output.sx_worldbook_backend
    ].filter(e => e.enabled).length;
    
    const totalCount = [
        ...output.sx_worldbook_cot,
        ...output.sx_worldbook_style,
        ...output.sx_worldbook_global,
        ...output.sx_worldbook_keywords,
        ...output.sx_worldbook_backend
    ].length;
    
    console.log(`\n總條目：${totalCount} 條`);
    console.log(`默認啟用條目：${enabledCount} 條`);
    console.log(`默認關閉條目：${totalCount - enabledCount} 條`);
    
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`\n輸出文件：${OUTPUT_FILE}`);
}

main();
