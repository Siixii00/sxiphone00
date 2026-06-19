const i18n = {
    'zh-Hant': {
        back: '返回',
        personalRecord: '個人紀錄',
        userWiki: 'User 百科',
        charWiki: 'Char 百科',
        sharedWiki: '雙人共同百科',
        searchPlaceholder: '搜尋記憶...',
        userWikiTitle: 'User 的個人百科',
        userWikiDesc: '記錄你的生活、工作、與 Char 的互動點滴。這是屬於你的圖像式記憶庫。',
        sharedWikiTitle: '雙人共同百科',
        sharedWikiDesc: '記錄 User 與 Char 共同的故事、互動與回憶。適合喜歡故事性強的用戶，建立屬於你們的共同歷史。',
        sharedEntries: '共同條目',
        sharedDaysLabel: '相處天數',
        sharedMemories: '共同回憶',
        sharedPlaces: '一起去過的地方',
        sharedMilestones: '重要里程碑',
        sharedStories: '故事篇章',
        sharedGifts: '互送的禮物',
        sharedDialogues: '經典對話',
        generateStory: '生成故事',
        storyGenerator: '故事生成器',
        storyType: '故事類型',
        storyRomance: '浪漫愛情',
        storyAdventure: '冒險旅程',
        storyDaily: '日常生活',
        storyFantasy: '奇幻世界',
        storyMystery: '懸疑推理',
        storyLength: '故事長度',
        storyShort: '短篇（1-2 段）',
        storyMedium: '中篇（3-5 段）',
        storyLong: '長篇（5+ 段）',
        storyPrompt: '額外提示（選填）',
        generateStoryNow: '立刻生成故事',
        importChatHistory: '導入聊天紀錄',
        importChatTimeline: '生成時間軸',
        importChatDesc: '從聊天紀錄導入並生成雙人時間軸',
        importChatSuccess: '已成功導入聊天紀錄並生成時間軸',
        importChatFailed: '導入聊天紀錄失敗',
        noChatHistory: '沒有找到聊天紀錄',
        selectChat: '選擇聊天紀錄',
        connectNotion: '連結 Notion',
        connectLLMService: '連結 AI 服務',
        notionConnectDesc: '將記憶同步到 Notion，自動生成圖文 Wiki',
        llmServiceDesc: '使用 AI 服務生成結構化記憶和圖片描述',
        notionSyncSuccess: '已成功同步到 Notion',
        notionSyncFailed: '同步到 Notion 失敗',
        llmProcessSuccess: 'AI 處理完成',
        llmProcessFailed: 'AI 處理失敗',
        autoSync: '自動同步',
        autoSyncDesc: '每次互動後自動同步到 Notion',
        autoCleanup: '自動清理',
        autoCleanupDesc: '同步成功後3天自動刪除本地資料',
        cleanupDays: '保留天數',
        cleanupNow: '立即清理',
        cleanupSuccess: '已清理過期資料',
        externalServices: '外部服務整合',
        selectLLMProvider: '選擇 AI 服務',
        geminiApi: 'Gemini API',
        openaiApi: 'OpenAI API',
        anthropicApi: 'Anthropic API',
        customApi: '自訂 API',
        apiEndpoint: 'API 端點',
        modelName: '模型名稱',
        connectSuccess: '連結成功',
        connectFailed: '連結失敗',
        newEntry: '新增條目',
        importNotebook: '導入 Notebook',
        syncMemory: '同步記憶',
        timeline: '時間軸',
        important: '重要記憶',
        relationships: '關係人物',
        events: '事件記錄',
        insights: '洞察與反思',
        index: '索引',
        log: '日誌',
        selectChar: '選擇角色：',
        selectCharPlaceholder: '請選擇角色',
        charMemories: '與 User 的記憶',
        conversations: '對話記錄',
        npcRelations: 'NPC 關係',
        worldView: '世界觀',
        dailyLife: '日常生活',
        memoryGraph: '記憶圖譜',
        editEntry: '編輯條目',
        entryTitle: '標題',
        entryCategory: '分類',
        entryTags: '標籤',
        entryContent: '內容',
        linkedMemories: '關聯記憶',
        linkMemory: '連結記憶',
        cancel: '取消',
        save: '保存',
        addChar: '新增角色',
        charName: '角色名稱',
        charDesc: '角色描述',
        charAvatar: '頭像',
        noCharSelected: '尚未選擇角色',
        noCharDesc: '選擇一個角色來查看他的個人紀錄百科，或新增一個角色開始記錄。',
        relationshipGraph: '關係圖譜',
        export: '匯出',
        delete: '刪除',
        confirmDelete: '確定要刪除此條目嗎？',
        noEntries: '尚無條目',
        noEntriesDesc: '點擊下方按鈕新增你的第一個記憶條目',
        importSuccess: '導入成功',
        importFailed: '導入失敗',
        syncSuccess: '同步成功',
        syncFailed: '同步失敗',
        saveSuccess: '保存成功',
        entryCreated: '條目已建立',
        entryUpdated: '條目已更新',
        llmWikiGenerator: 'LLM Wiki 生成器',
        wikiApiEndpoint: 'API 端點',
        wikiApiKey: 'API Key',
        wikiModel: '模型名稱',
        wikiPrompt: '生成提示詞',
        generateWikiNow: '立刻生成 Wiki',
        generating: '生成中...',
        generateSuccess: 'Wiki 生成成功',
        generateFailed: 'Wiki 生成失敗',
        noMemoryToGenerate: '沒有記憶可供生成',
        apiNotConfigured: '請先設定 API 端點和 Key',
        appearanceSettings: '外觀設定',
        appearanceCardDesc: '自訂此應用程式的外觀樣式',
        openAppearanceSettings: '開啟外觀設定',
        importFromSettings: '從設定導入',
        importCharFromSettings: '從設定導入角色',
        selectCharToImport: '選擇要導入的角色',
        importCharSuccess: '角色導入成功',
        importCharFailed: '角色導入失敗',
        noCharsInSettings: '設定中沒有角色資料',
        userData: 'User 資料',
        charData: 'Char 資料',
        chatHistory: '聊天紀錄',
        memoryData: '記憶資料',
        loadFromSettings: '從設定載入',
        settingsChar: '設定中的角色'
    },
    'zh-Hans': {
        back: '返回',
        personalRecord: '个人纪录',
        userWiki: 'User 百科',
        charWiki: 'Char 百科',
        sharedWiki: '双人共同百科',
        searchPlaceholder: '搜索记忆...',
        userWikiTitle: 'User 的个人百科',
        userWikiDesc: '记录你的生活、工作、与 Char 的互动点滴。这是属于你的图像式记忆库。',
        sharedWikiTitle: '双人共同百科',
        sharedWikiDesc: '记录 User 与 Char 共同的故事、互动与回忆。适合喜欢故事性强的用户，建立属于你们的共同历史。',
        sharedEntries: '共同条目',
        sharedDaysLabel: '相处天数',
        sharedMemories: '共同回忆',
        sharedPlaces: '一起去过的地方',
        sharedMilestones: '重要里程碑',
        sharedStories: '故事篇章',
        sharedGifts: '互送的礼物',
        sharedDialogues: '经典对话',
        generateStory: '生成故事',
        storyGenerator: '故事生成器',
        storyType: '故事类型',
        storyRomance: '浪漫爱情',
        storyAdventure: '冒险旅程',
        storyDaily: '日常生活',
        storyFantasy: '奇幻世界',
        storyMystery: '悬疑推理',
        storyLength: '故事长度',
        storyShort: '短篇（1-2 段）',
        storyMedium: '中篇（3-5 段）',
        storyLong: '长篇（5+ 段）',
        storyPrompt: '额外提示（选填）',
        generateStoryNow: '立刻生成故事',
        importChatHistory: '导入聊天纪录',
        importChatTimeline: '生成时间轴',
        importChatDesc: '从聊天纪录导入并生成双人时间轴',
        importChatSuccess: '已成功导入聊天纪录并生成时间轴',
        importChatFailed: '导入聊天纪录失败',
        noChatHistory: '没有找到聊天纪录',
        selectChat: '选择聊天纪录',
        newEntry: '新增条目',
        importNotebook: '导入 Notebook',
        syncMemory: '同步记忆',
        timeline: '时间轴',
        important: '重要记忆',
        relationships: '关系人物',
        events: '事件记录',
        insights: '洞察与反思',
        index: '索引',
        log: '日志',
        selectChar: '选择角色：',
        selectCharPlaceholder: '请选择角色',
        charMemories: '与 User 的记忆',
        conversations: '对话记录',
        npcRelations: 'NPC 关系',
        worldView: '世界观',
        dailyLife: '日常生活',
        memoryGraph: '记忆图谱',
        editEntry: '编辑条目',
        entryTitle: '标题',
        entryCategory: '分类',
        entryTags: '标签',
        entryContent: '内容',
        linkedMemories: '关联记忆',
        linkMemory: '连结记忆',
        cancel: '取消',
        save: '保存',
        addChar: '新增角色',
        charName: '角色名称',
        charDesc: '角色描述',
        charAvatar: '头像',
        noCharSelected: '尚未选择角色',
        noCharDesc: '选择一个角色来查看他的个人纪录百科，或新增一个角色开始记录。',
        relationshipGraph: '关系图谱',
        export: '导出',
        delete: '删除',
        confirmDelete: '确定要删除此条目吗？',
        noEntries: '尚无条目',
        noEntriesDesc: '点击下方按钮新增你的第一个记忆条目',
        importSuccess: '导入成功',
        importFailed: '导入失败',
        syncSuccess: '同步成功',
        syncFailed: '同步失败',
        saveSuccess: '保存成功',
        entryCreated: '条目已建立',
        entryUpdated: '条目已更新',
        llmWikiGenerator: 'LLM Wiki 生成器',
        wikiApiEndpoint: 'API 端点',
        wikiApiKey: 'API Key',
        wikiModel: '模型名称',
        wikiPrompt: '生成提示词',
        generateWikiNow: '立刻生成 Wiki',
        generating: '生成中...',
        generateSuccess: 'Wiki 生成成功',
        generateFailed: 'Wiki 生成失败',
        noMemoryToGenerate: '没有记忆可供生成',
        apiNotConfigured: '请先设置 API 端点和 Key',
        appearanceSettings: '外观设定',
        appearanceCardDesc: '自定义此应用程式的外观样式',
        openAppearanceSettings: '开启外观设定',
        importFromSettings: '从设定导入',
        importCharFromSettings: '从设定导入角色',
        selectCharToImport: '选择要导入的角色',
        importCharSuccess: '角色导入成功',
        importCharFailed: '角色导入失败',
        noCharsInSettings: '设定中没有角色资料',
        userData: 'User 资料',
        charData: 'Char 资料',
        chatHistory: '聊天记录',
        memoryData: '记忆资料',
        loadFromSettings: '从设定载入',
        settingsChar: '设定中的角色'
    },
    'en-US': {
        back: 'Back',
        personalRecord: 'Personal Record',
        userWiki: 'User Wiki',
        charWiki: 'Char Wiki',
        sharedWiki: 'Shared Wiki',
        searchPlaceholder: 'Search memories...',
        userWikiTitle: 'User\'s Personal Wiki',
        userWikiDesc: 'Record your life, work, and interactions with Char. This is your visual memory vault.',
        sharedWikiTitle: 'Shared Wiki',
        sharedWikiDesc: 'Record stories, interactions and memories between User and Char. Perfect for users who enjoy strong storytelling.',
        sharedEntries: 'Shared Entries',
        sharedDaysLabel: 'Days Together',
        sharedMemories: 'Shared Memories',
        sharedPlaces: 'Places Visited Together',
        sharedMilestones: 'Important Milestones',
        sharedStories: 'Story Chapters',
        sharedGifts: 'Gifts Exchanged',
        sharedDialogues: 'Classic Dialogues',
        generateStory: 'Generate Story',
        storyGenerator: 'Story Generator',
        storyType: 'Story Type',
        storyRomance: 'Romance',
        storyAdventure: 'Adventure',
        storyDaily: 'Daily Life',
        storyFantasy: 'Fantasy',
        storyMystery: 'Mystery',
        storyLength: 'Story Length',
        storyShort: 'Short (1-2 paragraphs)',
        storyMedium: 'Medium (3-5 paragraphs)',
        storyLong: 'Long (5+ paragraphs)',
        storyPrompt: 'Additional Prompt (Optional)',
        generateStoryNow: 'Generate Story Now',
        importChatHistory: 'Import Chat History',
        importChatTimeline: 'Generate Timeline',
        importChatDesc: 'Import from chat history and generate shared timeline',
        importChatSuccess: 'Successfully imported chat history and generated timeline',
        importChatFailed: 'Failed to import chat history',
        noChatHistory: 'No chat history found',
        selectChat: 'Select Chat History',
        newEntry: 'New Entry',
        importNotebook: 'Import Notebook',
        syncMemory: 'Sync Memory',
        timeline: 'Timeline',
        important: 'Important Memories',
        relationships: 'Relationships',
        events: 'Events',
        insights: 'Insights',
        index: 'Index',
        log: 'Log',
        selectChar: 'Select Character:',
        selectCharPlaceholder: 'Please select a character',
        charMemories: 'Memories with User',
        conversations: 'Conversations',
        npcRelations: 'NPC Relations',
        worldView: 'World View',
        dailyLife: 'Daily Life',
        memoryGraph: 'Memory Graph',
        editEntry: 'Edit Entry',
        entryTitle: 'Title',
        entryCategory: 'Category',
        entryTags: 'Tags',
        entryContent: 'Content',
        linkedMemories: 'Linked Memories',
        linkMemory: 'Link Memory',
        cancel: 'Cancel',
        save: 'Save',
        addChar: 'Add Character',
        charName: 'Character Name',
        charDesc: 'Character Description',
        charAvatar: 'Avatar',
        noCharSelected: 'No Character Selected',
        noCharDesc: 'Select a character to view their personal wiki, or add a new character to start recording.',
        relationshipGraph: 'Relationship Graph',
        export: 'Export',
        delete: 'Delete',
        confirmDelete: 'Are you sure you want to delete this entry?',
        noEntries: 'No Entries',
        noEntriesDesc: 'Click the button below to add your first memory entry',
        importSuccess: 'Import successful',
        importFailed: 'Import failed',
        syncSuccess: 'Sync successful',
        syncFailed: 'Sync failed',
        saveSuccess: 'Save successful',
        entryCreated: 'Entry created',
        entryUpdated: 'Entry updated',
        llmWikiGenerator: 'LLM Wiki Generator',
        wikiApiEndpoint: 'API Endpoint',
        wikiApiKey: 'API Key',
        wikiModel: 'Model Name',
        wikiPrompt: 'Generation Prompt',
        generateWikiNow: 'Generate Wiki Now',
        generating: 'Generating...',
        generateSuccess: 'Wiki generated successfully',
        generateFailed: 'Wiki generation failed',
        noMemoryToGenerate: 'No memories to generate',
        apiNotConfigured: 'Please configure API endpoint and Key first',
        appearanceSettings: 'Appearance Settings',
        appearanceCardDesc: 'Customize the appearance of this app',
        openAppearanceSettings: 'Open Appearance Settings'
    },
    'ja-JP': {
        back: '戻る',
        personalRecord: '個人記録',
        userWiki: 'User 百科',
        charWiki: 'Char 百科',
        sharedWiki: '共同百科',
        searchPlaceholder: '記憶を検索...',
        userWikiTitle: 'User の個人百科',
        userWikiDesc: 'あなたの生活、仕事、Charとの交流を記録。これはあなたの視覚的記憶庫です。',
        sharedWikiTitle: '共同百科',
        sharedWikiDesc: 'UserとCharの共同の物語、交流、思い出を記録。ストーリー性を重視するユーザーに最適です。',
        sharedEntries: '共同エントリ',
        sharedDaysLabel: '一緒に過ごした日数',
        sharedMemories: '共同の思い出',
        sharedPlaces: '一緒に行った場所',
        sharedMilestones: '重要なマイルストーン',
        sharedStories: '物語の章',
        sharedGifts: '交換したプレゼント',
        sharedDialogues: '名台詞',
        generateStory: '物語生成',
        storyGenerator: '物語ジェネレーター',
        storyType: '物語タイプ',
        storyRomance: 'ロマンス',
        storyAdventure: '冒険',
        storyDaily: '日常',
        storyFantasy: 'ファンタジー',
        storyMystery: 'ミステリー',
        storyLength: '物語の長さ',
        storyShort: '短編（1-2段落）',
        storyMedium: '中編（3-5段落）',
        storyLong: '長編（5段落以上）',
        storyPrompt: '追加プロンプト（任意）',
        generateStoryNow: '今すぐ物語を生成',
        newEntry: '新規エントリ',
        importNotebook: 'Notebookをインポート',
        syncMemory: '記憶を同期',
        timeline: 'タイムライン',
        important: '重要な記憶',
        relationships: '関係者',
        events: 'イベント記録',
        insights: '洞察と振り返り',
        index: 'インデックス',
        log: 'ログ',
        selectChar: 'キャラクターを選択：',
        selectCharPlaceholder: 'キャラクターを選択してください',
        charMemories: 'Userとの記憶',
        conversations: '会話記録',
        npcRelations: 'NPC関係',
        worldView: '世界観',
        dailyLife: '日常生活',
        memoryGraph: '記憶グラフ',
        editEntry: 'エントリを編集',
        entryTitle: 'タイトル',
        entryCategory: 'カテゴリ',
        entryTags: 'タグ',
        entryContent: '内容',
        linkedMemories: '関連記憶',
        linkMemory: '記憶をリンク',
        cancel: 'キャンセル',
        save: '保存',
        addChar: 'キャラクターを追加',
        charName: 'キャラクター名',
        charDesc: 'キャラクター説明',
        charAvatar: 'アバター',
        noCharSelected: 'キャラクター未選択',
        noCharDesc: 'キャラクターを選択して個人百科を見るか、新しいキャラクターを追加して記録を始めましょう。',
        relationshipGraph: '関係グラフ',
        export: 'エクスポート',
        delete: '削除',
        confirmDelete: 'このエントリを削除しますか？',
        noEntries: 'エントリなし',
        noEntriesDesc: '下のボタンをクリックして最初の記憶エントリを追加',
        importSuccess: 'インポート成功',
        importFailed: 'インポート失敗',
        syncSuccess: '同期成功',
        syncFailed: '同期失敗',
        saveSuccess: '保存成功',
        entryCreated: 'エントリ作成済み',
        entryUpdated: 'エントリ更新済み',
        llmWikiGenerator: 'LLM Wiki 生成器',
        wikiApiEndpoint: 'API エンドポイント',
        wikiApiKey: 'API Key',
        wikiModel: 'モデル名',
        wikiPrompt: '生成プロンプト',
        generateWikiNow: 'Wiki を生成',
        generating: '生成中...',
        generateSuccess: 'Wiki 生成成功',
        generateFailed: 'Wiki 生成失敗',
        noMemoryToGenerate: '生成する記憶がありません',
        apiNotConfigured: 'API エンドポイントと Key を設定してください',
        appearanceSettings: '外観設定',
        appearanceCardDesc: 'このアプリの外観をカスタマイズ',
        openAppearanceSettings: '外観設定を開く'
    },
    'ko-KR': {
        back: '뒤로',
        personalRecord: '개인 기록',
        userWiki: 'User 백과',
        charWiki: 'Char 백과',
        searchPlaceholder: '기억 검색...',
        userWikiTitle: 'User의 개인 백과',
        userWikiDesc: '당신의 삶, 일, Char와의 상호작용을 기록하세요. 당신만의 시각적 기억 저장소입니다.',
        newEntry: '새 항목',
        importNotebook: 'Notebook 가져오기',
        syncMemory: '기억 동기화',
        timeline: '타임라인',
        important: '중요한 기억',
        relationships: '관계 인물',
        events: '이벤트 기록',
        insights: '통찰과 성찰',
        index: '인덱스',
        log: '로그',
        selectChar: '캐릭터 선택:',
        selectCharPlaceholder: '캐릭터를 선택하세요',
        charMemories: 'User와의 기억',
        conversations: '대화 기록',
        npcRelations: 'NPC 관계',
        worldView: '세계관',
        dailyLife: '일상생활',
        memoryGraph: '기억 그래프',
        editEntry: '항목 편집',
        entryTitle: '제목',
        entryCategory: '카테고리',
        entryTags: '태그',
        entryContent: '내용',
        linkedMemories: '연결된 기억',
        linkMemory: '기억 연결',
        cancel: '취소',
        save: '저장',
        addChar: '캐릭터 추가',
        charName: '캐릭터 이름',
        charDesc: '캐릭터 설명',
        charAvatar: '아바타',
        noCharSelected: '캐릭터 미선택',
        noCharDesc: '캐릭터를 선택하여 개인 백과를 보거나 새 캐릭터를 추가하여 기록을 시작하세요.',
        relationshipGraph: '관계 그래프',
        export: '내보내기',
        delete: '삭제',
        confirmDelete: '이 항목을 삭제하시겠습니까?',
        noEntries: '항목 없음',
        noEntriesDesc: '아래 버튼을 클릭하여 첫 번째 기억 항목을 추가하세요',
        importSuccess: '가져오기 성공',
        importFailed: '가져오기 실패',
        syncSuccess: '동기화 성공',
        syncFailed: '동기화 실패',
        saveSuccess: '저장 성공',
        entryCreated: '항목 생성됨',
        entryUpdated: '항목 업데이트됨',
        llmWikiGenerator: 'LLM Wiki 생성기',
        wikiApiEndpoint: 'API 엔드포인트',
        wikiApiKey: 'API Key',
        wikiModel: '모델 이름',
        wikiPrompt: '생성 프롬프트',
        generateWikiNow: 'Wiki 생성',
        generating: '생성 중...',
        generateSuccess: 'Wiki 생성 성공',
        generateFailed: 'Wiki 생성 실패',
        noMemoryToGenerate: '생성할 기억이 없습니다',
        apiNotConfigured: 'API 엔드포인트와 Key를 설정하세요',
        appearanceSettings: '외관 설정',
        appearanceCardDesc: '이 앱의 외관을 사용자 정의',
        openAppearanceSettings: '외관 설정 열기'
    }
};

function getApiConfig() {
    if (typeof SxSettings !== 'undefined' && SxSettings.getActiveApiWithFallback) {
        try {
            const api = SxSettings.getActiveApiWithFallback();
            if (api && api.url && api.key) {
                return {
                    endpoint: api.url,
                    key: api.key,
                    model: api.model || 'gpt-4o'
                };
            }
        } catch (e) {
            console.warn('[PersonalWiki] SxSettings 讀取失敗:', e);
        }
    }
    try {
        const raw = localStorage.getItem('api_configs');
        if (!raw) {
            console.warn('[PersonalWiki] api_configs 不存在');
            return null;
        }
        const configs = JSON.parse(raw);
        if (!Array.isArray(configs) || configs.length === 0) {
            console.warn('[PersonalWiki] api_configs 空陣列');
            return null;
        }
        const idx = parseInt(localStorage.getItem('sx_active_api') || '0', 10);
        const api = configs[idx] || configs[0];
        if (!api || !api.url || !api.key) {
            console.warn('[PersonalWiki] API 配置不完整:', api);
            return null;
        }
        return {
            endpoint: api.url,
            key: api.key,
            model: api.model || 'gpt-4o'
        };
    } catch (e) {
        console.error('[PersonalWiki] 解析 api_configs 失敗:', e);
        return null;
    }
}

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

let currentWikiType = 'user';
let currentCharId = null;
let wikiEngine = null;
let editingEntryId = null;

const WIKI_DB_NAME = 'sx_personal_wiki';
const WIKI_DB_VERSION = 3;

class PersonalWikiDB {
    constructor() {
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(WIKI_DB_NAME, WIKI_DB_VERSION);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                const transaction = event.target.transaction;
                
                // user_entries
                if (!db.objectStoreNames.contains('user_entries')) {
                    const userStore = db.createObjectStore('user_entries', { keyPath: 'id' });
                    userStore.createIndex('category', 'category', { unique: false });
                    userStore.createIndex('createdAt', 'createdAt', { unique: false });
                    userStore.createIndex('importance', 'importance', { unique: false });
                } else if (event.oldVersion < 3) {
                    const userStore = transaction.objectStore('user_entries');
                    if (!userStore.indexNames.contains('category')) userStore.createIndex('category', 'category', { unique: false });
                    if (!userStore.indexNames.contains('createdAt')) userStore.createIndex('createdAt', 'createdAt', { unique: false });
                    if (!userStore.indexNames.contains('importance')) userStore.createIndex('importance', 'importance', { unique: false });
                }
                
                // char_entries
                if (!db.objectStoreNames.contains('char_entries')) {
                    const charStore = db.createObjectStore('char_entries', { keyPath: 'id' });
                    charStore.createIndex('charId', 'charId', { unique: false });
                    charStore.createIndex('category', 'category', { unique: false });
                    charStore.createIndex('createdAt', 'createdAt', { unique: false });
                } else if (event.oldVersion < 3) {
                    const charStore = transaction.objectStore('char_entries');
                    if (!charStore.indexNames.contains('charId')) charStore.createIndex('charId', 'charId', { unique: false });
                    if (!charStore.indexNames.contains('category')) charStore.createIndex('category', 'category', { unique: false });
                    if (!charStore.indexNames.contains('createdAt')) charStore.createIndex('createdAt', 'createdAt', { unique: false });
                }
                
                // shared_entries
                if (!db.objectStoreNames.contains('shared_entries')) {
                    const sharedStore = db.createObjectStore('shared_entries', { keyPath: 'id' });
                    sharedStore.createIndex('charId', 'charId', { unique: false });
                    sharedStore.createIndex('category', 'category', { unique: false });
                    sharedStore.createIndex('createdAt', 'createdAt', { unique: false });
                    sharedStore.createIndex('storyType', 'storyType', { unique: false });
                } else if (event.oldVersion < 3) {
                    const sharedStore = transaction.objectStore('shared_entries');
                    if (!sharedStore.indexNames.contains('charId')) sharedStore.createIndex('charId', 'charId', { unique: false });
                    if (!sharedStore.indexNames.contains('category')) sharedStore.createIndex('category', 'category', { unique: false });
                    if (!sharedStore.indexNames.contains('createdAt')) sharedStore.createIndex('createdAt', 'createdAt', { unique: false });
                    if (!sharedStore.indexNames.contains('storyType')) sharedStore.createIndex('storyType', 'storyType', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('chars')) {
                    db.createObjectStore('chars', { keyPath: 'id' });
                }
                
                // wiki_log
                if (!db.objectStoreNames.contains('wiki_log')) {
                    const logStore = db.createObjectStore('wiki_log', { keyPath: 'id' });
                    logStore.createIndex('type', 'type', { unique: false });
                    logStore.createIndex('timestamp', 'timestamp', { unique: false });
                } else if (event.oldVersion < 3) {
                    const logStore = transaction.objectStore('wiki_log');
                    if (!logStore.indexNames.contains('type')) logStore.createIndex('type', 'type', { unique: false });
                    if (!logStore.indexNames.contains('timestamp')) logStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('wiki_index')) {
                    db.createObjectStore('wiki_index', { keyPath: 'id' });
                }
            };
        });
    }

    async addEntry(storeName, entry) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(entry);
            request.onsuccess = () => resolve(entry);
            request.onerror = () => reject(request.error);
        });
    }

    async updateEntry(storeName, entry) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(entry);
            request.onsuccess = () => resolve(entry);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteEntry(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async getEntry(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllEntries(storeName, indexName = null, value = null) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            let request;
            
            if (indexName && value !== null) {
                const index = store.index(indexName);
                request = index.getAll(value);
            } else {
                request = store.getAll();
            }
            
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async addChar(char) {
        return this.addEntry('chars', char);
    }

    async updateChar(char) {
        return this.updateEntry('chars', char);
    }

    async deleteChar(id) {
        return this.deleteEntry('chars', id);
    }

    async getChar(id) {
        return this.getEntry('chars', id);
    }

    async getAllChars() {
        return this.getAllEntries('chars');
    }

    async addLog(logEntry) {
        return this.addEntry('wiki_log', {
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...logEntry,
            timestamp: new Date().toISOString()
        });
    }

    async getLogs(limit = 50) {
        const logs = await this.getAllEntries('wiki_log');
        return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);
    }
    
    async getSharedEntries(charId = null) {
        const entries = await this.getAllEntries('shared_entries');
        if (charId) {
            return entries.filter(e => e.charId === charId);
        }
        return entries;
    }
    
    async addSharedEntry(entry) {
        return this.addEntry('shared_entries', entry);
    }
    
    async updateSharedEntry(entry) {
        return this.updateEntry('shared_entries', entry);
    }
    
    async deleteSharedEntry(id) {
        return this.deleteEntry('shared_entries', id);
    }
}

const wikiDB = new PersonalWikiDB();

async function initApp() {
    await wikiDB.init();
    applyLanguage();
    setupEventListeners();
    loadWikiApiSettings();
    await loadUserSelectList();
    await loadChars();
    await loadUserWiki();
    await syncWithMemorySystem();
    
    if (localStorage.getItem('sx_auto_cleanup') === 'true') {
        AutoCleanup.cleanupExpiredEntries().then(result => {
            if (result.cleaned > 0) {
                console.log(`[PersonalWiki] 已自動清理 ${result.cleaned} 筆過期資料`);
            }
        });
    }
}

async function loadUserSelectList() {
    const select = document.getElementById('wiki-user-select');
    if (!select) return;
    
    let users = [];
    try {
        const raw = localStorage.getItem('sx_users');
        if (raw) {
            users = JSON.parse(raw);
        }
        if (users.length === 0 && typeof localforage !== 'undefined') {
            const idbData = await localforage.getItem('sx_users');
            if (idbData) {
                users = typeof idbData === 'string' ? JSON.parse(idbData) : idbData;
            }
        }
    } catch (e) {
        console.error('[PersonalWiki] 載入用戶列表失敗:', e);
    }
    
    const currentUserName = localStorage.getItem('sx_user_name') || 'User';
    const savedUserIndex = localStorage.getItem('sx_current_user_index');
    
    let optionsHtml = '';
    if (users.length > 0) {
        users.forEach((user, idx) => {
            let selected = '';
            if (savedUserIndex !== null) {
                selected = idx === parseInt(savedUserIndex, 10) ? 'selected' : '';
            } else {
                selected = user.name === currentUserName ? 'selected' : '';
            }
            optionsHtml += `<option value="${idx}" ${selected}>${user.name}</option>`;
        });
    } else {
        optionsHtml = `<option value="current" selected>${currentUserName}</option>`;
    }
    
    select.innerHTML = optionsHtml;
}

async function switchWikiUser(value) {
    if (value === 'current') return;
    
    let users = [];
    try {
        const raw = localStorage.getItem('sx_users');
        if (raw) {
            users = JSON.parse(raw);
        }
        if (users.length === 0 && typeof localforage !== 'undefined') {
            const idbData = await localforage.getItem('sx_users');
            if (idbData) {
                users = typeof idbData === 'string' ? JSON.parse(idbData) : idbData;
            }
        }
    } catch (e) {
        console.error('[PersonalWiki] 載入用戶列表失敗:', e);
        return;
    }
    
    const idx = parseInt(value, 10);
    if (isNaN(idx) || idx < 0 || idx >= users.length) return;
    
    const user = users[idx];
    if (user) {
        localStorage.setItem('sx_current_user_index', idx.toString());
        // 只有在有值時才更新，避免跳回 'User'
        if (user.name) {
            localStorage.setItem('sx_user_name', user.name);
        }
        if (user.avatar) {
            localStorage.setItem('sx_user_avatar', user.avatar);
        }
        if (user.personality) {
            localStorage.setItem('sx_user_personality', user.personality);
        }
        if (user.background) {
            localStorage.setItem('sx_user_background', user.background);
        }
        
        const introTitle = document.querySelector('.wiki-intro h2');
        if (introTitle) {
            introTitle.textContent = `${user.name} 的個人百科`;
        }
        
        await loadUserWiki();
        
        window.parent?.postMessage({
            type: 'USER_SWITCHED',
            payload: { name: user.name, avatar: user.avatar }
        }, '*');
    }
}

function applyLanguage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = t(key);
    });
}

function setupEventListeners() {
    document.querySelectorAll('.wiki-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    document.getElementById('searchInput').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    window.addEventListener('message', handleParentMessage);

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            saveWikiData();
        }
    });
}

function handleParentMessage(event) {
    const data = event.data;
    if (!data || typeof data !== 'object') return;

    if (data.type === 'LANGUAGE_CHANGED' && data.lang) {
        localStorage.setItem('sxiphone_lang', data.lang);
        applyLanguage();
    }

    if (data.type === 'APP_WILL_CLOSE') {
        saveWikiData();
    }

    if (data.type === 'MEMORY_UPDATED') {
        syncWithMemorySystem();
    }
}

function switchTab(tabId) {
    document.querySelectorAll('.wiki-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.wiki-section').forEach(section => section.classList.remove('active'));
    
    document.querySelector(`.wiki-tab[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
    
    if (tabId === 'shared-wiki') {
        currentWikiType = 'shared';
        loadSharedWiki();
    } else {
        currentWikiType = tabId === 'user-wiki' ? 'user' : 'char';
    }
}

async function loadChars() {
    const chars = await wikiDB.getAllChars();
    const select = document.getElementById('charSelect');
    select.innerHTML = `<option value="">${t('selectCharPlaceholder')}</option>`;
    
    chars.forEach(char => {
        const option = document.createElement('option');
        option.value = char.id;
        option.textContent = char.name;
        select.appendChild(option);
    });

    const settingsChars = await getCharsFromSettings();
    if (settingsChars.length > 0) {
        const settingsGroup = document.createElement('optgroup');
        settingsGroup.label = t('settingsChar');
        settingsChars.forEach((char, idx) => {
            const option = document.createElement('option');
            option.value = `settings_${idx}`;
            const sourceLabel = char.source === 'users' ? '(用戶)' : 
                               char.source === 'npcs' ? '(NPC)' : 
                               char.type === 'user' ? '(用戶)' :
                               char.type === 'npc' ? '(NPC)' : '';
            option.textContent = `${char.name} ${sourceLabel}`;
            option.dataset.settingsChar = 'true';
            option.dataset.charIndex = idx;
            settingsGroup.appendChild(option);
        });
        select.appendChild(settingsGroup);
    }

    if (chars.length > 0) {
        await selectChar(chars[0].id);
    } else {
        document.getElementById('char-wiki-content').classList.add('hidden');
        document.getElementById('char-empty-state').classList.remove('hidden');
        currentCharId = null;
    }
}

async function getCharsFromSettings() {
    const allChars = [];
    
    const loadFromStorage = async (key) => {
        let data = [];
        try {
            const raw = localStorage.getItem(key);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    data = parsed;
                }
            }
            
            if (data.length === 0 && typeof localforage !== 'undefined') {
                const idbData = await localforage.getItem(key);
                if (idbData) {
                    const parsed = typeof idbData === 'string' ? JSON.parse(idbData) : idbData;
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        data = parsed;
                    }
                }
            }
        } catch (e) {
            console.error(`[PersonalWiki] 讀取 ${key} 失敗:`, e);
        }
        return data;
    };
    
    const chars = await loadFromStorage('sx_characters');
    chars.forEach(c => allChars.push({ ...c, source: 'characters' }));
    
    const users = await loadFromStorage('sx_users');
    users.forEach(u => allChars.push({ ...u, source: 'users' }));
    
    const npcs = await loadFromStorage('sx_npcs');
    npcs.forEach(n => allChars.push({ ...n, source: 'npcs' }));
    
    const currentCharName = localStorage.getItem('sx_char_name');
    const currentCharAvatar = localStorage.getItem('sx_char_avatar');
    const currentCharPersonality = localStorage.getItem('sx_char_personality');
    const currentCharBackground = localStorage.getItem('sx_char_background');
    
    if (currentCharName && !allChars.find(c => c.name === currentCharName)) {
        allChars.push({
            name: currentCharName,
            avatar: currentCharAvatar || '',
            personality: currentCharPersonality || '',
            background: currentCharBackground || '',
            source: 'current_char'
        });
    }
    
    if (typeof SxSettings !== 'undefined' && SxSettings.getAllPersonas) {
        try {
            const personas = SxSettings.getAllPersonas();
            if (Array.isArray(personas) && personas.length > 0) {
                personas.forEach(p => {
                    if (!allChars.find(c => c.name === p.name)) {
                        allChars.push({ ...p, source: 'sxsettings' });
                    }
                });
            }
        } catch (e) {
            console.error('[PersonalWiki] 從 SxSettings 讀取失敗:', e);
        }
    }
    
    console.log('[PersonalWiki] 載入角色列表:', allChars.length, '個角色');
    return allChars;
}

function getUserFromSettings() {
    return {
        name: localStorage.getItem('sx_user_name') || 'User',
        avatar: localStorage.getItem('sx_user_avatar') || '',
        personality: localStorage.getItem('sx_user_personality') || '',
        background: localStorage.getItem('sx_user_background') || ''
    };
}

async function getChatHistory() {
    if (typeof localforage !== 'undefined') {
        try {
            const historyStore = localforage.createInstance({
                name: 'sxiphone',
                storeName: 'chatHistory'
            });
            const history = await historyStore.getItem('sx_chat_history');
            if (history && Array.isArray(history) && history.length > 0) {
                console.log('[PersonalWiki] 從 IndexedDB 載入聊天紀錄:', history.length, '筆');
                return history;
            }
        } catch (e) {
            console.warn('[PersonalWiki] 從 IndexedDB 讀取聊天紀錄失敗:', e);
        }
    }
    
    try {
        const raw = localStorage.getItem('sx_chat_history');
        if (!raw) {
            console.log('[PersonalWiki] sx_chat_history 不存在');
            return [];
        }
        const history = JSON.parse(raw);
        if (!Array.isArray(history)) {
            console.warn('[PersonalWiki] sx_chat_history 不是陣列');
            return [];
        }
        console.log('[PersonalWiki] 從 localStorage 載入聊天紀錄:', history.length, '筆');
        return history;
    } catch (e) {
        console.error('[PersonalWiki] 讀取聊天紀錄失敗:', e);
        return [];
    }
}

async function getAllMemoryData() {
    const memories = {
        user: getUserFromSettings(),
        chars: getCharsFromSettings(),
        chatHistory: getChatHistory(),
        wikiEntries: {
            user: await wikiDB.getAllEntries('user_entries'),
            char: await wikiDB.getAllEntries('char_entries')
        }
    };
    
    if (typeof localforage !== 'undefined') {
        try {
            const persistedData = await localforage.getItem('sx_app_persisted_data');
            if (persistedData) {
                memories.persistedData = persistedData;
            }
        } catch (e) {
            console.warn('[PersonalWiki] 讀取持久化資料失敗:', e);
        }
    }
    
    return memories;
}

async function importCharFromSettings(charIndex) {
    const settingsChars = await getCharsFromSettings();
    if (charIndex < 0 || charIndex >= settingsChars.length) {
        alert(t('importCharFailed'));
        return;
    }
    
    const settingsChar = settingsChars[charIndex];
    const sourceType = settingsChar.source || settingsChar.type || 'characters';
    
    const char = {
        id: `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: settingsChar.name || settingsChar.char_name || '匯入角色',
        description: settingsChar.personality || settingsChar.description || '',
        avatar: settingsChar.avatar || settingsChar.avatar_url || '',
        personality: settingsChar.personality || '',
        background: settingsChar.background || settingsChar.backstory || '',
        createdAt: new Date().toISOString(),
        source: sourceType
    };
    
    await wikiDB.addChar(char);
    
    if (settingsChar.personality || settingsChar.description) {
        const personalityEntry = {
            id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: `${char.name} 的性格`,
            content: settingsChar.personality || settingsChar.description,
            category: 'user-memories',
            tags: ['性格', '設定'],
            charId: char.id,
            createdAt: new Date().toISOString(),
            source: 'settings_import'
        };
        await wikiDB.addEntry('char_entries', personalityEntry);
    }
    
    if (settingsChar.background || settingsChar.backstory) {
        const backgroundEntry = {
            id: `entry_${Date.now() + 1}_${Math.random().toString(36).substr(2, 9)}`,
            title: `${char.name} 的背景`,
            content: settingsChar.background || settingsChar.backstory,
            category: 'world',
            tags: ['背景', '設定'],
            charId: char.id,
            createdAt: new Date().toISOString(),
            source: 'settings_import'
        };
        await wikiDB.addEntry('char_entries', backgroundEntry);
    }
    
    await wikiDB.addLog({
        type: 'char',
        action: 'import_from_settings',
        detail: `從設定導入角色: ${char.name} (來源: ${sourceType})`
    });
    
    await loadChars();
    await selectChar(char.id);
    
    alert(t('importCharSuccess'));
}

async function selectChar(charId) {
    if (!charId) {
        document.getElementById('char-wiki-content').classList.add('hidden');
        document.getElementById('char-empty-state').classList.remove('hidden');
        currentCharId = null;
        return;
    }

    if (charId.startsWith('settings_')) {
        const charIndex = parseInt(charId.replace('settings_', ''));
        await importCharFromSettings(charIndex);
        return;
    }

    currentCharId = charId;
    const char = await wikiDB.getChar(charId);
    
    if (char) {
        document.getElementById('charName').textContent = char.name;
        document.getElementById('charDesc').textContent = '';
        
        if (char.avatar) {
            document.getElementById('charAvatar').innerHTML = `<img src="${char.avatar}" alt="${char.name}">`;
        } else {
            document.getElementById('charAvatar').innerHTML = `<i class="fas fa-user-circle"></i>`;
        }
        
        const detailEl = document.getElementById('charProfileDetail');
        detailEl.innerHTML = `
            ${char.description ? `<div class="char-profile-detail-section">
                <div class="char-profile-detail-label">描述</div>
                <div class="char-profile-detail-value">${char.description}</div>
            </div>` : ''}
            ${char.personality ? `<div class="char-profile-detail-section">
                <div class="char-profile-detail-label">性格</div>
                <div class="char-profile-detail-value">${char.personality}</div>
            </div>` : ''}
            ${char.background ? `<div class="char-profile-detail-section">
                <div class="char-profile-detail-label">背景</div>
                <div class="char-profile-detail-value">${char.background}</div>
            </div>` : ''}
            ${char.worldbook ? `<div class="char-profile-detail-section">
                <div class="char-profile-detail-label">世界觀</div>
                <div class="char-profile-detail-value">${char.worldbook}</div>
            </div>` : ''}
            ${!char.description && !char.personality && !char.background && !char.worldbook ? '<div class="char-profile-detail-section"><div class="char-profile-detail-value" style="color: var(--text-tertiary);">尚無詳細設定</div></div>' : ''}
        `;
        
        document.getElementById('char-wiki-content').classList.remove('hidden');
        document.getElementById('char-empty-state').classList.add('hidden');
        
        await loadCharWiki(charId);
    }
}

function toggleCharProfileDetail() {
    const detailEl = document.getElementById('charProfileDetail');
    const toggleBtn = document.querySelector('.char-profile-toggle');
    detailEl.classList.toggle('hidden');
    toggleBtn.classList.toggle('expanded');
}

async function loadUserWiki() {
    const entries = await wikiDB.getAllEntries('user_entries');
    
    const categories = {
        important: document.getElementById('user-important-list'),
        people: document.getElementById('user-people-list'),
        events: document.getElementById('user-events-list'),
        insights: document.getElementById('user-insights-list')
    };
    
    Object.values(categories).forEach(list => list.innerHTML = '');
    
    const grouped = {
        important: [],
        people: [],
        events: [],
        insights: []
    };
    
    entries.forEach(entry => {
        const cat = entry.category || 'important';
        if (grouped[cat]) grouped[cat].push(entry);
    });
    
    Object.entries(grouped).forEach(([cat, items]) => {
        const list = categories[cat];
        if (items.length === 0) {
            list.innerHTML = `<div class="empty-list"><span>${t('noEntries')}</span></div>`;
        } else {
            items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            items.forEach(entry => {
                list.appendChild(createEntryElement(entry, 'user'));
            });
        }
    });
    
    await updateIndex('user');
    await updateLog('user');
}

async function loadCharWiki(charId) {
    const entries = await wikiDB.getAllEntries('char_entries', 'charId', charId);
    
    const categories = {
        'user-memories': document.getElementById('char-user-memories-list'),
        'conversations': document.getElementById('char-conversations-list'),
        'npc': document.getElementById('char-npc-list'),
        'world': document.getElementById('char-world-list'),
        'daily': document.getElementById('char-daily-list')
    };
    
    Object.values(categories).forEach(list => list.innerHTML = '');
    
    const grouped = {
        'user-memories': [],
        'conversations': [],
        'npc': [],
        'world': [],
        'daily': []
    };
    
    entries.forEach(entry => {
        const cat = entry.category || 'user-memories';
        if (grouped[cat]) grouped[cat].push(entry);
    });
    
    Object.entries(grouped).forEach(([cat, items]) => {
        const list = categories[cat];
        if (items.length === 0) {
            list.innerHTML = `<div class="empty-list"><span>${t('noEntries')}</span></div>`;
        } else {
            items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            items.forEach(entry => {
                list.appendChild(createEntryElement(entry, 'char'));
            });
        }
    });
    
    await updateIndex('char', charId);
    await updateLog('char', charId);
}

async function loadSharedWiki() {
    const user = getUserFromSettings();
    const charName = localStorage.getItem('sx_char_name') || 'Char';
    const charAvatar = localStorage.getItem('sx_char_avatar') || '';
    
    document.getElementById('sharedUserName').textContent = user.name || 'User';
    document.getElementById('sharedCharName').textContent = charName;
    
    if (user.avatar) {
        document.getElementById('sharedUserAvatar').innerHTML = `<img src="${user.avatar}" alt="${user.name}">`;
    }
    if (charAvatar) {
        document.getElementById('sharedCharAvatar').innerHTML = `<img src="${charAvatar}" alt="${charName}">`;
    }
    
    const entries = await wikiDB.getSharedEntries();
    
    const categories = {
        'shared-memories': document.getElementById('shared-memories-list'),
        'shared-places': document.getElementById('shared-places-list'),
        'shared-milestones': document.getElementById('shared-milestones-list'),
        'shared-stories': document.getElementById('shared-stories-list'),
        'shared-gifts': document.getElementById('shared-gifts-list'),
        'shared-dialogues': document.getElementById('shared-dialogues-list')
    };
    
    Object.values(categories).forEach(list => list.innerHTML = '');
    
    const grouped = {
        'shared-memories': [],
        'shared-places': [],
        'shared-milestones': [],
        'shared-stories': [],
        'shared-gifts': [],
        'shared-dialogues': []
    };
    
    entries.forEach(entry => {
        const cat = entry.category || 'shared-memories';
        if (grouped[cat]) grouped[cat].push(entry);
    });
    
    Object.entries(grouped).forEach(([cat, items]) => {
        const list = categories[cat];
        if (items.length === 0) {
            list.innerHTML = `<div class="empty-list"><span>${t('noEntries')}</span></div>`;
        } else {
            items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            items.forEach(entry => {
                list.appendChild(createEntryElement(entry, 'shared'));
            });
        }
    });
    
    document.getElementById('sharedEntryCount').textContent = entries.length;
    
    const firstEntry = entries.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
    if (firstEntry) {
        const firstDate = new Date(firstEntry.createdAt);
        const today = new Date();
        const days = Math.floor((today - firstDate) / (1000 * 60 * 60 * 24));
        document.getElementById('sharedDays').textContent = days;
    }
    
    await updateSharedIndex(entries);
    await updateLog('shared');
}

async function updateSharedIndex(entries) {
    const indexContent = document.getElementById('shared-index');
    if (entries.length === 0) {
        indexContent.innerHTML = `<div class="empty-list"><span>${t('noEntries')}</span></div>`;
        return;
    }
    
    const sorted = [...entries].sort((a, b) => a.title.localeCompare(b.title));
    indexContent.innerHTML = sorted.map(entry => `
        <div class="index-item" onclick="scrollToEntry('${entry.id}')">
            <span class="index-title">${entry.title}</span>
            <span class="index-date">${new Date(entry.createdAt).toLocaleDateString()}</span>
        </div>
    `).join('');
}

async function generateSharedStory() {
    const storyType = document.getElementById('sharedStoryType')?.value || 'romance';
    const storyLength = document.getElementById('sharedStoryLength')?.value || 'medium';
    const extraPrompt = document.getElementById('sharedStoryPrompt')?.value || '';
    
    await generateSharedStoryNow(storyType, storyLength, extraPrompt);
}

async function generateSharedStoryNow(storyType = 'romance', storyLength = 'medium', extraPrompt = '') {
    const user = getUserFromSettings();
    const charName = localStorage.getItem('sx_char_name') || 'Char';
    const charPersonality = localStorage.getItem('sx_char_personality') || '';
    
    const sharedEntries = await wikiDB.getSharedEntries();
    const recentEntries = sharedEntries.slice(0, 10);
    
    const lengthGuide = {
        short: '1-2 段，每段 100-150 字',
        medium: '3-5 段，每段 150-200 字',
        long: '5-7 段，每段 200-300 字'
    };
    
    const typeGuide = {
        romance: '浪漫愛情風格，強調情感交流和甜蜜時刻',
        adventure: '冒險旅程風格，強調共同經歷的挑戰和成長',
        daily: '日常生活風格，強調平凡中的溫馨和默契',
        fantasy: '奇幻世界風格，充滿想像力和魔法元素',
        mystery: '懸疑推理風格，強調解謎和智慧'
    };
    
    const prompt = `請根據以下資訊，創作一篇關於 ${user.name} 和 ${charName} 的${typeGuide[storyType]}故事。

角色資訊：
- User: ${user.name}
- Char: ${charName}
- Char 性格: ${charPersonality}

共同回憶摘要：
${recentEntries.map(e => `- ${e.title}: ${e.content?.substring(0, 100)}...`).join('\n')}

故事要求：
- 長度：${lengthGuide[storyLength]}
- 風格：${typeGuide[storyType]}
- 請以第三人稱敘事
- 包含對話和場景描寫
- 展現兩人的互動和情感
${extraPrompt ? `- 額外要求：${extraPrompt}` : ''}

請直接輸出故事內容，不需要標題。`;

    const config = getApiConfig();
    if (!config) {
        alert(t('apiNotConfigured'));
        return;
    }
    const apiEndpoint = config.endpoint;
    const apiKey = config.key;
    const model = config.model;
    
    try {
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: '你是一個擅長創作浪漫故事的作家，請根據用戶提供的資訊創作引人入勝的故事。' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.9
            })
        });
        
        const data = await response.json();
        const story = data.choices?.[0]?.message?.content;
        
        if (story) {
            const entry = {
                id: `shared_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                title: `${charName} 與 ${user.name} 的故事 - ${new Date().toLocaleDateString()}`,
                content: story,
                category: 'shared-stories',
                storyType,
                storyLength,
                tags: [storyType, 'AI生成'],
                createdAt: new Date().toISOString()
            };
            
            await wikiDB.addSharedEntry(entry);
            await wikiDB.addLog({
                type: 'shared',
                action: 'story_generated',
                detail: `生成 ${typeGuide[storyType]} 故事`
            });
            
            await loadSharedWiki();
            alert(t('generateSuccess'));
        }
    } catch (e) {
        console.error('[PersonalWiki] 生成故事失敗:', e);
        alert(t('generateFailed'));
    }
}

async function exportSharedWiki() {
    const entries = await wikiDB.getSharedEntries();
    const user = getUserFromSettings();
    const charName = localStorage.getItem('sx_char_name') || 'Char';
    
    const exportData = {
        title: `${user.name} & ${charName} 的共同百科`,
        exportedAt: new Date().toISOString(),
        entries
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shared_wiki_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

async function importChatHistoryToShared() {
    const sources = await getAvailableInteractionSources();
    
    if (sources.length === 0) {
        alert(t('noChatHistory'));
        return;
    }
    
    showSourceSelectionModal(sources);
}

async function getAvailableInteractionSources() {
    const sources = [];
    
    // Chat 應用程式
    const chatSessions = JSON.parse(localStorage.getItem('sx_chat_sessions') || '[]');
    if (chatSessions.length > 0) {
        chatSessions.forEach(session => {
            if (session.history && session.history.length > 0) {
                sources.push({
                    type: 'chat',
                    id: session.id,
                    name: session.title || session.charName || '聊天紀錄',
                    charName: session.charName,
                    count: session.history.length,
                    date: session.id.replace('chat_', ''),
                    data: session
                });
            }
        });
    }
    
    // 約會應用程式
    const datingHistory = JSON.parse(localStorage.getItem('sx_dating_history') || '[]');
    if (datingHistory.length > 0) {
        datingHistory.forEach((record, idx) => {
            sources.push({
                type: 'dating',
                id: `dating_${idx}`,
                name: record.scene || record.charName || '約會紀錄',
                charName: record.charName,
                count: record.interactions?.length || 1,
                date: record.date || record.timestamp,
                data: record
            });
        });
    }
    
    // 農場應用程式
    const farmSave = localStorage.getItem('sx_farm_save');
    if (farmSave) {
        try {
            const farmData = JSON.parse(farmSave);
            if (farmData.fields || farmData.inventory || farmData.members) {
                sources.push({
                    type: 'farm',
                    id: 'farm_main',
                    name: '農場經營紀錄',
                    charName: null,
                    count: (farmData.members?.length || 0) + (farmData.fields?.filter(f => f?.crop)?.length || 0),
                    date: new Date().toISOString(),
                    data: farmData
                });
            }
        } catch (e) {}
    }
    
    // Lofter 應用程式
    const lofterPosts = JSON.parse(localStorage.getItem('sx_lofter_posts') || '[]');
    if (lofterPosts.length > 0) {
        sources.push({
            type: 'lofter',
            id: 'lofter_posts',
            name: 'Lofter 創作紀錄',
            charName: null,
            count: lofterPosts.length,
            date: lofterPosts[0]?.createdAt || new Date().toISOString(),
            data: lofterPosts
        });
    }
    
    // Twitter 應用程式
    const tweets = JSON.parse(localStorage.getItem('sx_tweets') || '[]');
    if (tweets.length > 0) {
        sources.push({
            type: 'twitter',
            id: 'twitter_posts',
            name: 'Twitter 互動紀錄',
            charName: null,
            count: tweets.length,
            date: tweets[0]?.createdAt || new Date().toISOString(),
            data: tweets
        });
    }
    
    // Facebook 應用程式
    const fbPosts = JSON.parse(localStorage.getItem('sx_facebook_posts') || '[]');
    if (fbPosts.length > 0) {
        sources.push({
            type: 'facebook',
            id: 'facebook_posts',
            name: 'Facebook 互動紀錄',
            charName: null,
            count: fbPosts.length,
            date: fbPosts[0]?.createdAt || new Date().toISOString(),
            data: fbPosts
        });
    }
    
    return sources;
}

function showSourceSelectionModal(sources) {
    const existingModal = document.getElementById('sourceSelectionModal');
    if (existingModal) existingModal.remove();
    
    const typeIcons = {
        chat: 'fa-comments',
        dating: 'fa-heart',
        farm: 'fa-seedling',
        lofter: 'fa-pen-fancy',
        twitter: 'fa-twitter',
        facebook: 'fa-facebook'
    };
    
    const typeLabels = {
        chat: '聊天',
        dating: '約會',
        farm: '農場',
        lofter: '創作',
        twitter: 'Twitter',
        facebook: 'Facebook'
    };
    
    const modal = document.createElement('div');
    modal.id = 'sourceSelectionModal';
    modal.className = 'chat-selection-modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeSourceSelectionModal()"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3>${t('selectChat')}</h3>
                <button class="btn-close" onclick="closeSourceSelectionModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="source-list">
                    ${sources.map(source => `
                        <div class="source-item" onclick="selectInteractionSource('${source.type}', '${source.id}')">
                            <div class="source-icon">
                                <i class="fas ${typeIcons[source.type] || 'fa-file'}"></i>
                            </div>
                            <div class="source-info">
                                <div class="source-title">${source.name}</div>
                                <div class="source-meta">
                                    <span class="source-type">${typeLabels[source.type] || source.type}</span>
                                    <span class="source-count">${source.count} 則互動</span>
                                    ${source.charName ? `<span class="source-char">${source.charName}</span>` : ''}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function closeSourceSelectionModal() {
    const modal = document.getElementById('sourceSelectionModal');
    if (modal) modal.remove();
}

async function selectInteractionSource(type, id) {
    closeSourceSelectionModal();
    
    const sources = await getAvailableInteractionSources();
    const source = sources.find(s => s.type === type && s.id === id);
    
    if (!source) {
        alert(t('importChatFailed'));
        return;
    }
    
    switch (type) {
        case 'chat':
            await processChatHistoryForTimeline(source.data.history, source.data);
            break;
        case 'dating':
            await processDatingHistoryForTimeline(source.data);
            break;
        case 'farm':
            await processFarmHistoryForTimeline(source.data);
            break;
        case 'lofter':
            await processLofterHistoryForTimeline(source.data);
            break;
        case 'twitter':
            await processTwitterHistoryForTimeline(source.data);
            break;
        case 'facebook':
            await processFacebookHistoryForTimeline(source.data);
            break;
        default:
            alert(t('importChatFailed'));
    }
}

async function processChatHistoryForTimeline(history, session = null) {
    const user = getUserFromSettings();
    const charName = session?.charName || localStorage.getItem('sx_char_name') || 'Char';
    
    const timelineEntries = [];
    const groupedByDate = {};
    
    history.forEach(msg => {
        if (!msg.timestamp) {
            const dateKey = new Date().toISOString().split('T')[0];
            if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
            groupedByDate[dateKey].push(msg);
        } else {
            const dateKey = new Date(msg.timestamp).toISOString().split('T')[0];
            if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
            groupedByDate[dateKey].push(msg);
        }
    });
    
    Object.entries(groupedByDate).forEach(([date, msgs]) => {
        const userMsgs = msgs.filter(m => m.role === 'user');
        const charMsgs = msgs.filter(m => m.role === 'assistant' || m.role === 'char');
        
        if (userMsgs.length > 0 || charMsgs.length > 0) {
            const entry = {
                id: `timeline_chat_${date}_${Math.random().toString(36).substr(2, 9)}`,
                title: `${date} 的對話`,
                content: `User 說了 ${userMsgs.length} 次，${charName} 回應了 ${charMsgs.length} 次。\n\n摘要:\n${userMsgs.slice(0, 3).map(m => `User: ${m.content?.substring(0, 100)}...`).join('\n')}\n${charMsgs.slice(0, 3).map(m => `${charName}: ${m.content?.substring(0, 100)}...`).join('\n')}`,
                category: 'shared-memories',
                tags: ['聊天', '時間軸', date],
                createdAt: new Date(date).toISOString(),
                source: 'chat_import'
            };
            timelineEntries.push(entry);
        }
    });
    
    const firstMsg = history[0];
    if (firstMsg) {
        const milestoneEntry = {
            id: `milestone_chat_${Math.random().toString(36).substr(2, 9)}`,
            title: `第一次對話`,
            content: `${user.name} 和 ${charName} 第一次開始交談。\n\n${firstMsg.content?.substring(0, 200)}...`,
            category: 'shared-milestones',
            tags: ['里程碑', '第一次', '聊天'],
            createdAt: firstMsg.timestamp || new Date().toISOString(),
            source: 'chat_import'
        };
        timelineEntries.push(milestoneEntry);
    }
    
    await saveTimelineEntries(timelineEntries, '聊天');
}

async function processDatingHistoryForTimeline(data) {
    const user = getUserFromSettings();
    const charName = data.charName || 'Char';
    const timelineEntries = [];
    
    if (data.scene) {
        const sceneEntry = {
            id: `dating_scene_${Math.random().toString(36).substr(2, 9)}`,
            title: `${data.scene} 約會`,
            content: `${user.name} 和 ${charName} 在 ${data.scene} 度過了美好時光。`,
            category: 'shared-memories',
            tags: ['約會', data.scene],
            createdAt: data.date || data.timestamp || new Date().toISOString(),
            source: 'dating_import'
        };
        timelineEntries.push(sceneEntry);
    }
    
    if (data.interactions && data.interactions.length > 0) {
        data.interactions.forEach((interaction, idx) => {
            if (interaction.type || interaction.action) {
                const entry = {
                    id: `dating_interaction_${idx}_${Math.random().toString(36).substr(2, 9)}`,
                    title: `互動: ${interaction.type || interaction.action}`,
                    content: interaction.description || interaction.content || `${user.name} 和 ${charName} 進行了 ${interaction.type || interaction.action}`,
                    category: 'shared-dialogues',
                    tags: ['約會', '互動', interaction.type || interaction.action],
                    createdAt: interaction.timestamp || new Date().toISOString(),
                    source: 'dating_import'
                };
                timelineEntries.push(entry);
            }
        });
    }
    
    await saveTimelineEntries(timelineEntries, '約會');
}

async function processFarmHistoryForTimeline(data) {
    const user = getUserFromSettings();
    const timelineEntries = [];
    
    if (data.members && data.members.length > 0) {
        const membersEntry = {
            id: `farm_members_${Math.random().toString(36).substr(2, 9)}`,
            title: `農場成員`,
            content: `${user.name} 的農場有以下成員：\n${data.members.map(m => `- ${m.name} (${m.role || '成員'})`).join('\n')}`,
            category: 'shared-memories',
            tags: ['農場', '成員'],
            createdAt: new Date().toISOString(),
            source: 'farm_import'
        };
        timelineEntries.push(membersEntry);
    }
    
    if (data.fields) {
        const crops = data.fields.filter(f => f?.crop);
        if (crops.length > 0) {
            const cropTypes = {};
            crops.forEach(f => {
                cropTypes[f.crop] = (cropTypes[f.crop] || 0) + 1;
            });
            
            const harvestEntry = {
                id: `farm_harvest_${Math.random().toString(36).substr(2, 9)}`,
                title: `農場收成`,
                content: `種植了 ${crops.length} 塊作物：\n${Object.entries(cropTypes).map(([crop, count]) => `- ${crop}: ${count} 塊`).join('\n')}`,
                category: 'shared-milestones',
                tags: ['農場', '收成'],
                createdAt: new Date().toISOString(),
                source: 'farm_import'
            };
            timelineEntries.push(harvestEntry);
        }
    }
    
    await saveTimelineEntries(timelineEntries, '農場');
}

async function processLofterHistoryForTimeline(posts) {
    const user = getUserFromSettings();
    const timelineEntries = [];
    
    posts.forEach((post, idx) => {
        const entry = {
            id: `lofter_post_${idx}_${Math.random().toString(36).substr(2, 9)}`,
            title: post.title || `創作 #${idx + 1}`,
            content: post.content?.substring(0, 500) || post.summary || '',
            category: 'shared-stories',
            tags: ['創作', 'Lofter', ...(post.tags || [])],
            createdAt: post.createdAt || post.date || new Date().toISOString(),
            source: 'lofter_import'
        };
        timelineEntries.push(entry);
    });
    
    await saveTimelineEntries(timelineEntries, 'Lofter');
}

async function processTwitterHistoryForTimeline(tweets) {
    const user = getUserFromSettings();
    const timelineEntries = [];
    
    const groupedByDate = {};
    tweets.forEach(tweet => {
        const dateKey = (tweet.createdAt ? new Date(tweet.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
        if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
        groupedByDate[dateKey].push(tweet);
    });
    
    Object.entries(groupedByDate).forEach(([date, dayTweets]) => {
        const entry = {
            id: `twitter_${date}_${Math.random().toString(36).substr(2, 9)}`,
            title: `${date} 的推文`,
            content: `發布了 ${dayTweets.length} 則推文：\n${dayTweets.slice(0, 5).map(t => `- ${t.content?.substring(0, 100)}...`).join('\n')}`,
            category: 'shared-memories',
            tags: ['Twitter', '時間軸', date],
            createdAt: new Date(date).toISOString(),
            source: 'twitter_import'
        };
        timelineEntries.push(entry);
    });
    
    await saveTimelineEntries(timelineEntries, 'Twitter');
}

async function processFacebookHistoryForTimeline(posts) {
    const user = getUserFromSettings();
    const timelineEntries = [];
    
    const groupedByDate = {};
    posts.forEach(post => {
        const dateKey = (post.createdAt ? new Date(post.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
        if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
        groupedByDate[dateKey].push(post);
    });
    
    Object.entries(groupedByDate).forEach(([date, dayPosts]) => {
        const entry = {
            id: `facebook_${date}_${Math.random().toString(36).substr(2, 9)}`,
            title: `${date} 的動態`,
            content: `發布了 ${dayPosts.length} 則動態：\n${dayPosts.slice(0, 5).map(p => `- ${p.content?.substring(0, 100)}...`).join('\n')}`,
            category: 'shared-memories',
            tags: ['Facebook', '時間軸', date],
            createdAt: new Date(date).toISOString(),
            source: 'facebook_import'
        };
        timelineEntries.push(entry);
    });
    
    await saveTimelineEntries(timelineEntries, 'Facebook');
}

function createEntryElement(entry, type) {
    const div = document.createElement('div');
    div.className = 'entry-item';
    div.dataset.id = entry.id;
    
    const linkedCount = entry.linkedMemories?.length || 0;
    const weight = entry.weight || 0.5;
    const emphasisCount = entry.emphasisCount || 0;
    const depth = wikiEngine ? wikiEngine._calculateMemoryDepth(entry) : Math.round(weight * 100);
    
    let badges = '';
    if (entry.dislikeMarked) {
        badges += '<span class="emotional-badge dislike"><i class="fas fa-thumbs-down"></i> 討厭</span>';
    }
    if (entry.importantMarked) {
        badges += '<span class="emotional-badge important"><i class="fas fa-star"></i> 重要</span>';
    }
    if (emphasisCount >= 2) {
        badges += `<span class="emotional-badge emphasized"><i class="fas fa-exclamation"></i> 強調 ${emphasisCount} 次</span>`;
    }
    
    div.innerHTML = `
        <div class="entry-header">
            <h4 class="entry-title">${entry.title}</h4>
            <div class="entry-actions">
                <button class="btn-emphasize" onclick="event.stopPropagation(); emphasizeEntry('${entry.id}')" title="強調">
                    <i class="fas fa-exclamation"></i>
                </button>
                <button class="btn-important" onclick="event.stopPropagation(); markAsImportant('${entry.id}')" title="標記重要">
                    <i class="fas fa-star"></i>
                </button>
                <button class="btn-dislike" onclick="event.stopPropagation(); markAsDislike('${entry.id}')" title="標記討厭">
                    <i class="fas fa-thumbs-down"></i>
                </button>
                <button class="btn-edit" onclick="editEntry('${entry.id}', '${type}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete" onclick="deleteEntry('${entry.id}', '${type}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <p class="entry-content">${entry.content?.substring(0, 150)}${entry.content?.length > 150 ? '...' : ''}</p>
        <div class="memory-depth-indicator">
            <span class="depth-value">${depth}</span>
            <div class="depth-bar">
                <div class="depth-bar-fill" style="width: ${depth}%"></div>
            </div>
            <span class="depth-label">記憶深度</span>
        </div>
        <div class="entry-badges">${badges}</div>
        <div class="entry-meta">
            <span class="entry-date">${formatDate(entry.createdAt)}</span>
            <span class="entry-weight">權重: ${weight.toFixed(2)}</span>
            ${entry.tags?.length ? `<span class="entry-tags">${entry.tags.map(t => `#${t}`).join(' ')}</span>` : ''}
            ${linkedCount > 0 ? `<span class="entry-links"><i class="fas fa-link"></i> ${linkedCount}</span>` : ''}
            ${emphasisCount > 0 ? `<span class="emphasis-count"><i class="fas fa-exclamation-circle"></i> ${emphasisCount}</span>` : ''}
        </div>
    `;
    
    div.addEventListener('click', (e) => {
        if (!e.target.closest('.btn-edit') && !e.target.closest('.btn-delete') &&
            !e.target.closest('.btn-emphasize') && !e.target.closest('.btn-important') &&
            !e.target.closest('.btn-dislike')) {
            viewEntry(entry.id, type);
        }
    });
    
    return div;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString(getCurrentLang(), {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

async function updateIndex(type, charId = null) {
    const storeName = type === 'user' ? 'user_entries' : 'char_entries';
    let entries;
    
    if (type === 'char' && charId) {
        entries = await wikiDB.getAllEntries(storeName, 'charId', charId);
    } else {
        entries = await wikiDB.getAllEntries(storeName);
    }
    
    const indexContent = type === 'user' 
        ? document.getElementById('user-index')
        : document.getElementById('char-index');
    
    if (entries.length === 0) {
        indexContent.innerHTML = `<div class="empty-index">${t('noEntries')}</div>`;
        return;
    }
    
    const sorted = entries.sort((a, b) => a.title.localeCompare(b.title));
    
    indexContent.innerHTML = sorted.map(entry => `
        <div class="index-item" onclick="viewEntry('${entry.id}', '${type}')">
            <span class="index-title">${entry.title}</span>
            <span class="index-category">${entry.category}</span>
        </div>
    `).join('');
}

async function updateLog(type, charId = null) {
    const logs = await wikiDB.getLogs(20);
    const filtered = logs.filter(log => {
        if (type === 'user') return !log.charId;
        return log.charId === charId;
    });
    
    const logContent = type === 'user'
        ? document.getElementById('user-log')
        : document.getElementById('char-log');
    
    if (filtered.length === 0) {
        logContent.innerHTML = `<div class="empty-log">尚無日誌</div>`;
        return;
    }
    
    logContent.innerHTML = filtered.map(log => `
        <div class="log-item">
            <span class="log-time">${formatDate(log.timestamp)}</span>
            <span class="log-action">${log.action}</span>
            <span class="log-detail">${log.detail || ''}</span>
        </div>
    `).join('');
}

function createNewEntry(type) {
    editingEntryId = null;
    document.getElementById('entryTitle').value = '';
    document.getElementById('entryCategory').value = 'important';
    document.getElementById('entryTags').value = '';
    document.getElementById('entryContent').value = '';
    document.getElementById('linkedMemories').innerHTML = '';
    
    if (type === 'char') {
        document.getElementById('entryCategory').innerHTML = `
            <option value="user-memories">${t('charMemories')}</option>
            <option value="conversations">${t('conversations')}</option>
            <option value="npc">${t('npcRelations')}</option>
            <option value="world">${t('worldView')}</option>
            <option value="daily">${t('dailyLife')}</option>
        `;
    } else if (type === 'shared') {
        document.getElementById('entryCategory').innerHTML = `
            <option value="shared-memories">${t('sharedMemories')}</option>
            <option value="shared-places">${t('sharedPlaces')}</option>
            <option value="shared-milestones">${t('sharedMilestones')}</option>
            <option value="shared-stories">${t('sharedStories')}</option>
            <option value="shared-gifts">${t('sharedGifts')}</option>
            <option value="shared-dialogues">${t('sharedDialogues')}</option>
        `;
    } else {
        document.getElementById('entryCategory').innerHTML = `
            <option value="important">${t('important')}</option>
            <option value="people">${t('relationships')}</option>
            <option value="events">${t('events')}</option>
            <option value="insights">${t('insights')}</option>
        `;
    }
    
    document.getElementById('entryModal').classList.remove('hidden');
}

async function editEntry(entryId, type) {
    let storeName;
    if (type === 'user') {
        storeName = 'user_entries';
    } else if (type === 'shared') {
        storeName = 'shared_entries';
    } else {
        storeName = 'char_entries';
    }
    
    const entry = await wikiDB.getEntry(storeName, entryId);
    
    if (!entry) return;
    
    editingEntryId = entryId;
    document.getElementById('entryTitle').value = entry.title;
    document.getElementById('entryCategory').value = entry.category;
    document.getElementById('entryTags').value = entry.tags?.join(', ') || '';
    document.getElementById('entryContent').value = entry.content || '';
    
    const linkedDiv = document.getElementById('linkedMemories');
    linkedDiv.innerHTML = '';
    if (entry.linkedMemories?.length) {
        entry.linkedMemories.forEach(memId => {
            linkedDiv.innerHTML += `<span class="linked-tag">${memId}</span>`;
        });
    }
    
    document.getElementById('entryModal').classList.remove('hidden');
}

async function viewEntry(entryId, type) {
    let storeName;
    if (type === 'user') {
        storeName = 'user_entries';
    } else if (type === 'shared') {
        storeName = 'shared_entries';
    } else {
        storeName = 'char_entries';
    }
    
    const entry = await wikiDB.getEntry(storeName, entryId);
    
    if (entry) {
        editEntry(entryId, type);
    }
}

async function deleteEntry(entryId, type) {
    if (!confirm(t('confirmDelete'))) return;
    
    let storeName;
    if (type === 'user') {
        storeName = 'user_entries';
    } else if (type === 'shared') {
        storeName = 'shared_entries';
    } else {
        storeName = 'char_entries';
    }
    
    await wikiDB.deleteEntry(storeName, entryId);
    
    await wikiDB.addLog({
        type: type,
        charId: type === 'char' ? currentCharId : null,
        action: 'delete',
        detail: `刪除條目: ${entryId}`
    });
    
    if (type === 'user') {
        await loadUserWiki();
    } else if (type === 'shared') {
        await loadSharedWiki();
    } else {
        await loadCharWiki(currentCharId);
    }
}

async function saveEntry() {
    const title = document.getElementById('entryTitle').value.trim();
    const category = document.getElementById('entryCategory').value;
    const tags = document.getElementById('entryTags').value.split(',').map(t => t.trim()).filter(t => t);
    const content = document.getElementById('entryContent').value.trim();
    
    if (!title) {
        alert('請輸入標題');
        return;
    }
    
    const entry = {
        id: editingEntryId || `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title,
        category,
        tags,
        content,
        linkedMemories: [],
        createdAt: editingEntryId ? undefined : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        emphasisCount: 0,
        emotionalWeight: 0,
        dislikeMarked: false,
        importantMarked: false,
        reinforcementCount: 0,
        accessCount: 0,
        emphasisHistory: [],
        emotionHistory: []
    };

    let storeName;
    if (currentWikiType === 'user') {
        storeName = 'user_entries';
    } else if (currentWikiType === 'shared') {
        storeName = 'shared_entries';
    } else {
        storeName = 'char_entries';
    }
    
    if (currentWikiType === 'char') {
        entry.charId = currentCharId;
    }
    
    if (editingEntryId) {
        const existing = await wikiDB.getEntry(storeName, editingEntryId);
        entry.createdAt = existing.createdAt;
        entry.emphasisCount = existing.emphasisCount || 0;
        entry.emotionalWeight = existing.emotionalWeight || 0;
        entry.dislikeMarked = existing.dislikeMarked || false;
        entry.importantMarked = existing.importantMarked || false;
        entry.reinforcementCount = existing.reinforcementCount || 0;
        entry.accessCount = existing.accessCount || 0;
        entry.emphasisHistory = existing.emphasisHistory || [];
        entry.emotionHistory = existing.emotionHistory || [];
        await wikiDB.updateEntry(storeName, entry);
    } else {
        await wikiDB.addEntry(storeName, entry);
    }
    
    await wikiDB.addLog({
        type: currentWikiType,
        charId: currentWikiType === 'char' ? currentCharId : null,
        action: editingEntryId ? 'update' : 'create',
        detail: `${editingEntryId ? t('entryUpdated') : t('entryCreated')}: ${title}`
    });
    
    closeEntryModal();
    
    if (wikiEngine) {
        await wikiEngine.initialize();
    }
    
    if (currentWikiType === 'user') {
        await loadUserWiki();
    } else if (currentWikiType === 'shared') {
        await loadSharedWiki();
    } else {
        await loadCharWiki(currentCharId);
    }
}

async function emphasizeEntry(entryId) {
    if (wikiEngine) {
        const result = await wikiEngine.emphasize(entryId, 'user');
        console.log(`[PersonalWiki] 強調條目: ${entryId}`, result);
        
        if (currentWikiType === 'user') {
            await loadUserWiki();
        } else if (currentWikiType === 'shared') {
            await loadSharedWiki();
        } else {
            await loadCharWiki(currentCharId);
        }
    }
}

async function markAsDislike(entryId, reason = null) {
    if (wikiEngine) {
        const result = await wikiEngine.markDislike(entryId, 'user', reason);
        console.log(`[PersonalWiki] 標記討厭: ${entryId}`, result);
        
        if (currentWikiType === 'user') {
            await loadUserWiki();
        } else if (currentWikiType === 'shared') {
            await loadSharedWiki();
        } else {
            await loadCharWiki(currentCharId);
        }
    }
}

async function markAsImportant(entryId, level = 1) {
    if (wikiEngine) {
        const result = await wikiEngine.markImportant(entryId, 'user', level);
        console.log(`[PersonalWiki] 標記重要: ${entryId}`, result);
        
        if (currentWikiType === 'user') {
            await loadUserWiki();
        } else {
            await loadCharWiki(currentCharId);
        }
    }
}

async function recordEmotion(entryId, emotionType, intensity = 0.5) {
    if (wikiEngine) {
        const result = await wikiEngine.recordEmotion(entryId, {
            type: emotionType,
            intensity: intensity
        }, 'user');
        console.log(`[PersonalWiki] 記錄情感: ${entryId} - ${emotionType}`, result);
    }
}

function getMemoryDepth(entryId) {
    if (wikiEngine) {
        const depth = wikiEngine.getMemoryDepth(entryId);
        console.log(`[PersonalWiki] 記憶深度: ${entryId}`, depth);
        return depth;
    }
    return null;
}

function getDeepMemories() {
    if (wikiEngine) {
        const deep = wikiEngine.getDeepMemories({ minEmphasis: 2, minWeight: 0.7 });
        console.log('[PersonalWiki] 深度記憶:', deep);
        return deep;
    }
    return [];
}

function getEmotionalMemories(type = 'all') {
    if (wikiEngine) {
        const emotional = wikiEngine.getEmotionalMemories(type);
        console.log(`[PersonalWiki] 情感記憶 (${type}):`, emotional);
        return emotional;
    }
    return [];
}

function closeEntryModal() {
    document.getElementById('entryModal').classList.add('hidden');
    editingEntryId = null;
}

function addNewChar() {
    document.getElementById('newCharName').value = '';
    document.getElementById('newCharDesc').value = '';
    document.getElementById('avatarPreview').innerHTML = '<i class="fas fa-user-circle"></i>';
    document.getElementById('charModal').classList.remove('hidden');
}

function closeCharModal() {
    document.getElementById('charModal').classList.add('hidden');
}

function previewAvatar(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('avatarPreview').innerHTML = `<img src="${e.target.result}" alt="Avatar">`;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

async function saveChar() {
    const name = document.getElementById('newCharName').value.trim();
    const description = document.getElementById('newCharDesc').value.trim();
    const avatarPreview = document.getElementById('avatarPreview').querySelector('img');
    const avatar = avatarPreview ? avatarPreview.src : null;
    
    if (!name) {
        alert('請輸入角色名稱');
        return;
    }
    
    const char = {
        id: `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        description,
        avatar,
        createdAt: new Date().toISOString()
    };
    
    await wikiDB.addChar(char);
    
    await wikiDB.addLog({
        type: 'char',
        action: 'create_char',
        detail: `新增角色: ${name}`
    });
    
    closeCharModal();
    await loadChars();
}

function toggleSearch() {
    document.getElementById('searchBar').classList.toggle('hidden');
}

async function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;

    if (wikiEngine) {
        const thinkingProcess = await wikiEngine.think(query);
        console.log('[PersonalWiki] 思考過程:', thinkingProcess);

        const results = thinkingProcess.directMatches;
        const associations = thinkingProcess.associations;

        displaySearchResults(results, associations, thinkingProcess.summary);
    } else {
        const storeName = currentWikiType === 'user' ? 'user_entries' : 'char_entries';
        let entries = await wikiDB.getAllEntries(storeName);
        
        if (currentWikiType === 'char' && currentCharId) {
            entries = entries.filter(e => e.charId === currentCharId);
        }
        
        const results = entries.filter(entry => 
            entry.title.toLowerCase().includes(query) ||
            entry.content?.toLowerCase().includes(query) ||
            entry.tags?.some(t => t.toLowerCase().includes(query))
        );
        
        console.log('Search results:', results);
    }
}

function displaySearchResults(directMatches, associations, summary) {
    console.log('[PersonalWiki] 搜尋結果:', {
        directMatches: directMatches.length,
        associations: associations.length,
        summary: summary?.text
    });

    for (const match of directMatches) {
        console.log(`  直接匹配: ${match.title} (權重: ${match.weight.toFixed(2)})`);
        if (match.matchedKeywords) {
            console.log(`    關鍵詞: ${match.matchedKeywords.join(', ')}`);
        }
    }

    for (const assoc of associations) {
        console.log(`  聯想: ${assoc.title} (深度: ${assoc.spreadDepth}, 權重: ${assoc.weight.toFixed(2)})`);
    }
}

async function viewEntry(entryId, type) {
    if (wikiEngine) {
        const entryWithLinks = await wikiEngine.getEntryWithLinks(entryId);
        if (entryWithLinks) {
            console.log('[PersonalWiki] 查看條目:', entryWithLinks);
            console.log('  權重:', entryWithLinks.weight);
            console.log('  連結:', entryWithLinks.linkedEntries);
            console.log('  反向連結:', entryWithLinks.backLinks);
            console.log('  延伸連結:', entryWithLinks.extendedLinks);

            displayEntryDetail(entryWithLinks);
        }
    } else {
        const storeName = type === 'user' ? 'user_entries' : 'char_entries';
        const entry = await wikiDB.getEntry(storeName, entryId);
        
        if (entry) {
            editEntry(entryId, type);
        }
    }
}

function displayEntryDetail(entry) {
    editingEntryId = entry.id;
    document.getElementById('entryTitle').value = entry.title;
    document.getElementById('entryCategory').value = entry.category;
    document.getElementById('entryTags').value = entry.tags?.join(', ') || '';
    document.getElementById('entryContent').value = entry.content || '';

    const linkedDiv = document.getElementById('linkedMemories');
    linkedDiv.innerHTML = '';

    if (entry.linkedEntries) {
        for (const linked of entry.linkedEntries) {
            linkedDiv.innerHTML += `
                <span class="linked-tag" onclick="viewEntry('${linked.id}', '${linked.charId ? 'char' : 'user'}')">
                    ${linked.title} (權重: ${linked.weight.toFixed(2)})
                </span>
            `;
        }
    }

    if (entry.backLinks && entry.backLinks.length > 0) {
        linkedDiv.innerHTML += '<div class="backlinks-section"><strong>反向連結:</strong></div>';
        for (const back of entry.backLinks) {
            linkedDiv.innerHTML += `
                <span class="linked-tag backlink" onclick="viewEntry('${back.id}', '${back.charId ? 'char' : 'user'}')">
                    ← ${back.title} (${back.weight.toFixed(2)})
                </span>
            `;
        }
    }

    if (entry.extendedLinks && entry.extendedLinks.length > 0) {
        linkedDiv.innerHTML += '<div class="extended-section"><strong>延伸連結:</strong></div>';
        for (const ext of entry.extendedLinks.slice(0, 5)) {
            linkedDiv.innerHTML += `
                <span class="linked-tag extended">
                    ${ext.title} (深度: ${ext.depth}, 權重: ${ext.weight.toFixed(2)})
                </span>
            `;
        }
    }

    document.getElementById('entryModal').classList.remove('hidden');
}

async function reinforceEntry(entryId) {
    if (wikiEngine) {
        await wikiEngine.reinforceEntry(entryId);
        console.log(`[PersonalWiki] 強化條目: ${entryId}`);
    }
}

async function decayEntry(entryId) {
    if (wikiEngine) {
        await wikiEngine.decayEntry(entryId);
        console.log(`[PersonalWiki] 衰減條目: ${entryId}`);
    }
}

function getWikiStats() {
    if (wikiEngine) {
        const keywordStats = wikiEngine.getKeywordStats();
        const linkStats = wikiEngine.getLinkStats();
        console.log('[PersonalWiki] Wiki 統計:', {
            keywords: keywordStats,
            links: linkStats
        });
        return { keywordStats, linkStats };
    }
    return null;
}

function toggleGraphView() {
    const overlay = document.getElementById('graphOverlay');
    overlay.classList.toggle('hidden');
    
    if (!overlay.classList.contains('hidden')) {
        renderGraph();
    }
}

async function renderGraph() {
    const canvas = document.getElementById('graphCanvas');
    const storeName = currentWikiType === 'user' ? 'user_entries' : 'char_entries';
    let entries = await wikiDB.getAllEntries(storeName);
    
    if (currentWikiType === 'char' && currentCharId) {
        entries = entries.filter(e => e.charId === currentCharId);
    }
    
    if (typeof wikiEngine !== 'undefined' && wikiEngine.renderGraph) {
        wikiEngine.renderGraph(canvas, entries);
    } else {
        canvas.innerHTML = `<div class="graph-placeholder">圖譜視圖 (${entries.length} 個節點)</div>`;
    }
}

function zoomIn() {
    if (wikiEngine) wikiEngine.zoomIn();
}

function zoomOut() {
    if (wikiEngine) wikiEngine.zoomOut();
}

function resetGraph() {
    if (wikiEngine) wikiEngine.resetGraph();
}

async function syncWithMemorySystem() {
    try {
        const allData = await getAllMemoryData();
        console.log('[PersonalWiki] 同步記憶系統:', allData);
        
        if (allData.user && (allData.user.name || allData.user.personality)) {
            const userExists = await wikiDB.getEntry('user_entries', 'user_profile');
            if (!userExists) {
                const userProfile = {
                    id: 'user_profile',
                    title: `${allData.user.name} 的個人資料`,
                    content: allData.user.personality || allData.user.background || '',
                    category: 'important',
                    tags: ['User', '個人資料'],
                    createdAt: new Date().toISOString(),
                    source: 'settings_sync'
                };
                await wikiDB.addEntry('user_entries', userProfile);
            }
        }
        
        if (allData.chatHistory && allData.chatHistory.length > 0) {
            const recentChats = allData.chatHistory.slice(-20);
            let chatContent = recentChats.map(msg => {
                const role = msg.role || (msg.is_user ? 'User' : 'Char');
                return `【${role}】${msg.content || msg.text || ''}`;
            }).join('\n\n');
            
            if (chatContent) {
                const chatEntry = {
                    id: `chat_history_${Date.now()}`,
                    title: '最近對話紀錄',
                    content: chatContent,
                    category: 'events',
                    tags: ['對話', '聊天紀錄'],
                    createdAt: new Date().toISOString(),
                    source: 'chat_sync'
                };
                await wikiDB.addEntry('user_entries', chatEntry);
            }
        }
        
        if (window.MemoryHelper) {
            try {
                const memResult = await window.MemoryHelper.recall('', { limit: 10 });
                if (memResult?.memories?.length > 0) {
                    console.log('[PersonalWiki] 統一記憶系統:', memResult.memories.length, '條');
                }
            } catch (memErr) {
                console.warn('[PersonalWiki] MemoryHelper 調用失敗:', memErr);
            }
        } else if (window.parent?.unifiedMemory) {
            try {
                const memory = window.parent.unifiedMemory;
                const recentMemories = await memory.recall('', { limit: 10 });
                console.log('[PersonalWiki] 統一記憶系統:', recentMemories);
            } catch (memErr) {
                console.warn('[PersonalWiki] unifiedMemory 調用失敗:', memErr);
            }
        }
        
        await loadUserWiki();
        
    } catch (e) {
        console.warn('[PersonalWiki] 記憶系統同步失敗:', e);
    }
}

async function syncMemory() {
    try {
        await syncWithMemorySystem();
        alert(t('syncSuccess'));
        
        await wikiDB.addLog({
            type: currentWikiType,
            charId: currentWikiType === 'char' ? currentCharId : null,
            action: 'sync',
            detail: '同步記憶系統'
        });
    } catch (e) {
        alert(t('syncFailed'));
    }
}

async function importFromNotebook() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.md,.txt';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            let data;
            
            if (file.name.endsWith('.json')) {
                data = JSON.parse(text);
            } else {
                data = {
                    title: file.name.replace(/\.[^.]+$/, ''),
                    content: text
                };
            }
            
            const entry = {
                id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                title: data.title || '未命名',
                content: data.content || text,
                category: 'important',
                tags: [],
                linkedMemories: [],
                createdAt: new Date().toISOString(),
                source: 'notebook'
            };
            
            await wikiDB.addEntry('user_entries', entry);
            
            await wikiDB.addLog({
                type: 'user',
                action: 'import',
                detail: `導入: ${entry.title}`
            });
            
            await loadUserWiki();
            alert(t('importSuccess'));
        } catch (e) {
            console.error('Import error:', e);
            alert(t('importFailed'));
        }
    };
    
    input.click();
}

function viewTimeline(type) {
    console.log('View timeline for:', type);
}

function viewCharGraph() {
    currentWikiType = 'char';
    toggleGraphView();
}

function exportCharWiki() {
    console.log('Export char wiki');
}

function quickAdd() {
    createNewEntry(currentWikiType);
}

function openMemoryLinker() {
    console.log('Open memory linker');
}

async function handleBack() {
    await saveWikiData();
    
    if (window.parent && window.parent !== window) {
        window.parent.postMessage({
            type: 'closeApp',
            appId: 'personal-wiki'
        }, '*');
    } else {
        window.location.href = '../index.html';
    }
}

async function saveWikiData() {
    try {
        saveWikiApiSettings();
        console.log('[PersonalWiki] 資料已保存');
    } catch (e) {
        console.error('[PersonalWiki] 保存失敗:', e);
    }
}

document.addEventListener('DOMContentLoaded', initApp);

window.addEventListener('pagehide', saveWikiData);

async function generateWikiWithLLM() {
    const config = getApiConfig();
    if (!config) {
        alert(t('apiNotConfigured'));
        return;
    }
    const apiEndpoint = config.endpoint;
    const apiKey = config.key;
    const model = config.model;
    const prompt = document.getElementById('wikiPrompt').value.trim();
    
    const btn = document.querySelector('.btn-generate-wiki');
    const originalContent = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span><span>${t('generating')}</span>`;
    
    try {
        const entries = await wikiDB.getAllEntries('user_entries');
        
        if (entries.length === 0) {
            alert(t('noMemoryToGenerate'));
            btn.disabled = false;
            btn.innerHTML = originalContent;
            return;
        }
        
        const recentEntries = entries
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10);
        
        const memoryContent = recentEntries.map(entry => {
            return `【${entry.title}】\n分類: ${entry.category}\n標籤: ${entry.tags?.join(', ') || '無'}\n內容: ${entry.content || ''}\n`;
        }).join('\n---\n');
        
        const systemPrompt = `你是一個專業的 Wiki 條目生成助手。請根據用戶提供的記憶內容，生成一個結構化的 Wiki 條目。

輸出格式必須是 JSON：
{
    "title": "條目標題",
    "category": "important|people|events|insights",
    "tags": ["標籤1", "標籤2"],
    "content": "詳細內容（支援 Markdown）"
}

請確保：
1. 標題簡潔明瞭
2. 分類選擇最合適的類別
3. 標籤提取關鍵詞
4. 內容詳細且有結構`;

        const userPrompt = `${prompt}\n\n以下是記憶內容：\n\n${memoryContent}`;
        
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 2000
            })
        });
        
        if (!response.ok) {
            throw new Error(`API 錯誤: ${response.status}`);
        }
        
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        if (!content) {
            throw new Error('無法取得生成內容');
        }
        
        let wikiData;
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                wikiData = JSON.parse(jsonMatch[0]);
            } else {
                wikiData = JSON.parse(content);
            }
        } catch (e) {
            wikiData = {
                title: 'AI 生成的 Wiki',
                category: 'important',
                tags: ['AI生成'],
                content: content
            };
        }
        
        const entry = {
            id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: wikiData.title || '未命名',
            category: wikiData.category || 'important',
            tags: wikiData.tags || [],
            content: wikiData.content || '',
            linkedMemories: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            emphasisCount: 0,
            emotionalWeight: 0,
            dislikeMarked: false,
            importantMarked: false,
            reinforcementCount: 0,
            accessCount: 0,
            emphasisHistory: [],
            emotionHistory: [],
            source: 'llm_generated'
        };
        
        await wikiDB.addEntry('user_entries', entry);
        
        await wikiDB.addLog({
            type: 'user',
            action: 'llm_generate',
            detail: `AI 生成 Wiki: ${entry.title}`
        });
        
        if (wikiEngine) {
            await wikiEngine.initialize();
        }
        
        await loadUserWiki();
        
        alert(t('generateSuccess'));
        
    } catch (error) {
        console.error('[PersonalWiki] 生成失敗:', error);
        alert(t('generateFailed') + ': ' + error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalContent;
    }
}

function loadWikiApiSettings() {
    const savedEndpoint = localStorage.getItem('sx_wiki_api_endpoint');
    const savedKey = localStorage.getItem('sx_wiki_api_key');
    const savedModel = localStorage.getItem('sx_wiki_model');
    const savedPrompt = localStorage.getItem('sx_wiki_prompt');
    
    if (savedEndpoint) document.getElementById('wikiApiEndpoint').value = savedEndpoint;
    if (savedKey) document.getElementById('wikiApiKey').value = savedKey;
    if (savedModel) document.getElementById('wikiModel').value = savedModel;
    if (savedPrompt) document.getElementById('wikiPrompt').value = savedPrompt;
}

function saveWikiApiSettings() {
    const endpoint = document.getElementById('wikiApiEndpoint').value.trim();
    const key = document.getElementById('wikiApiKey').value.trim();
    const model = document.getElementById('wikiModel').value.trim();
    const prompt = document.getElementById('wikiPrompt').value.trim();
    
    localStorage.setItem('sx_wiki_api_endpoint', endpoint);
    localStorage.setItem('sx_wiki_api_key', key);
    localStorage.setItem('sx_wiki_model', model);
    localStorage.setItem('sx_wiki_prompt', prompt);
}

async function generateCharWikiNow() {
    if (!currentCharId) {
        alert('請先選擇角色');
        return;
    }
    
    const config = getApiConfig();
    if (!config) {
        alert(t('apiNotConfigured'));
        return;
    }
    const apiEndpoint = config.endpoint;
    const apiKey = config.key;
    const model = config.model;
    const scope = document.getElementById('charWikiScope').value;
    const extraPrompt = document.getElementById('charWikiExtraPrompt').value.trim();
    
    const btn = document.querySelector('#char-wiki-content .btn-generate-wiki');
    const originalContent = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span><span>生成中...</span>`;
    
    try {
        const char = await wikiDB.getChar(currentCharId);
        
        if (!char) {
            throw new Error('找不到角色資料');
        }
        
        const charInfo = {
            name: char.name || '未知',
            personality: char.personality || '',
            background: char.background || '',
            description: char.description || '',
            worldbook: char.worldbook || char.worldBook || ''
        };
        
        const charEntries = await wikiDB.getAllEntries('char_entries', 'charId', currentCharId);
        const existingWikiContent = charEntries.length > 0 
            ? charEntries.map(e => `【${e.title}】(${e.category})\n${e.content}`).join('\n\n')
            : '';
        
        let unifiedMemories = '';
        try {
            const memResult = await window.MemoryHelper?.recall(`${charInfo.name} 的相關記憶`, { limit: 10 });
            if (memResult?.memories?.length > 0) {
                unifiedMemories = memResult.memories.map(m => `- ${m.content || m.summary || JSON.stringify(m)}`).join('\n');
            }
        } catch (e) {
            console.warn('無法從統一記憶系統調取記憶:', e);
        }
        
        const chatHistory = getChatHistory();
        const recentChats = chatHistory.slice(-20).map(msg => {
            const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content || '');
            return `${msg.role === 'user' ? 'User' : charInfo.name}: ${content.substring(0, 200)}`;
        }).join('\n');
        
        let scopePrompt = '';
        switch (scope) {
            case 'personality':
                scopePrompt = '請專注生成角色的性格特質分析，包括性格優缺點、行為模式、情感表達方式等。';
                break;
            case 'background':
                scopePrompt = '請專注生成角色的背景故事，包括成長經歷、重要事件、人生轉折等。';
                break;
            case 'preferences':
                scopePrompt = '請專注生成角色的喜好與習慣，包括興趣愛好、生活習慣、飲食偏好等。';
                break;
            case 'relationships':
                scopePrompt = '請專注生成角色的人際關係，包括與 User 的關係、與他人的互動模式等。';
                break;
            default:
                scopePrompt = '請生成完整的角色個人紀錄，包括性格、背景、喜好、人際關係等各方面。';
        }
        
        const systemPrompt = `你是一個專業的角色設定分析助手。請根據提供的角色資料，生成結構化的個人紀錄 Wiki 條目。

${scopePrompt}

輸出格式必須是 JSON 陣列，每個條目格式如下：
[
    {
        "title": "條目標題",
        "category": "user_memories|conversations|npc|world|daily",
        "tags": ["標籤1", "標籤2"],
        "content": "詳細內容（支援 Markdown）"
    }
]

分類說明：
- user_memories: 與 User 的記憶
- conversations: 對話記錄相關
- npc: NPC 關係
- world: 世界觀設定
- daily: 日常生活

請確保：
1. 生成 3-5 個有意義的條目
2. 每個條目標題簡潔明瞭
3. 內容詳細且有結構
4. 根據角色設定合理推演`;

        const userPrompt = `角色名稱: ${charInfo.name}
角色性格: ${charInfo.personality || '未設定'}
角色背景: ${charInfo.background || '未設定'}
角色描述: ${charInfo.description || '未設定'}
世界觀設定: ${charInfo.worldbook || '未設定'}

${existingWikiContent ? `已有的 Wiki 紀錄:\n${existingWikiContent}\n` : ''}
最近對話記錄:
${recentChats || '無對話記錄'}

${unifiedMemories ? `統一記憶系統中的相關記憶:\n${unifiedMemories}\n` : ''}
${extraPrompt ? `額外提示: ${extraPrompt}` : ''}

請根據以上資料生成角色的個人紀錄 Wiki 條目。${existingWikiContent ? ' 請參考已有的 Wiki 紀錄，補充或延伸內容，避免重複。' : ''}`;
        
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 3000
            })
        });
        
        if (!response.ok) {
            throw new Error(`API 錯誤: ${response.status}`);
        }
        
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        if (!content) {
            throw new Error('無法取得生成內容');
        }
        
        let wikiEntries;
        try {
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                wikiEntries = JSON.parse(jsonMatch[0]);
            } else {
                const singleMatch = content.match(/\{[\s\S]*\}/);
                if (singleMatch) {
                    wikiEntries = [JSON.parse(singleMatch[0])];
                } else {
                    wikiEntries = [{
                        title: `${charInfo.name} 的個人紀錄`,
                        category: 'daily',
                        tags: ['AI生成'],
                        content: content
                    }];
                }
            }
        } catch (e) {
            wikiEntries = [{
                title: `${charInfo.name} 的個人紀錄`,
                category: 'daily',
                tags: ['AI生成'],
                content: content
            }];
        }
        
        const categoryMap = {
            'user_memories': 'user_memories',
            'conversations': 'conversations',
            'npc': 'npc',
            'world': 'world',
            'daily': 'daily',
            'important': 'user_memories',
            'people': 'npc',
            'events': 'daily',
            'insights': 'user_memories'
        };
        
        for (const wikiData of wikiEntries) {
            const entry = {
                id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                title: wikiData.title || '未命名',
                category: categoryMap[wikiData.category] || 'daily',
                tags: wikiData.tags || [],
                content: wikiData.content || '',
                linkedMemories: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                emphasisCount: 0,
                emotionalWeight: 0,
                dislikeMarked: false,
                importantMarked: false,
                reinforcementCount: 0,
                accessCount: 0,
                emphasisHistory: [],
                emotionHistory: [],
                source: 'llm_generated',
                charId: currentCharId
            };
            
            await wikiDB.addEntry('char_entries', entry);
        }
        
        await wikiDB.addLog({
            type: 'char',
            charId: currentCharId,
            action: 'llm_generate',
            detail: `AI 生成 ${wikiEntries.length} 個 Wiki 條目`
        });
        
        if (wikiEngine) {
            await wikiEngine.initialize();
        }
        
        await loadCharWiki(currentCharId);
        
        alert(`成功生成 ${wikiEntries.length} 個個人紀錄條目！`);
        
    } catch (error) {
        console.error('[PersonalWiki] Char Wiki 生成失敗:', error);
        alert('生成失敗: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalContent;
    }
}

function openAppearanceSettings(appId) {
    if (window.parent && window.parent !== window) {
        window.parent.postMessage({
            type: 'openAppearanceSettings',
            appId: appId || 'personal-wiki'
        }, '*');
    } else {
        console.log('[PersonalWiki] 開啟外觀設定:', appId);
    }
}

async function showImportCharModal() {
    const settingsChars = await getCharsFromSettings();
    const list = document.getElementById('importCharList');
    
    if (settingsChars.length === 0) {
        list.innerHTML = `<div class="empty-list"><span>${t('noCharsInSettings')}</span></div>`;
    } else {
        list.innerHTML = settingsChars.map((char, idx) => {
            const sourceLabel = char.source === 'users' ? '(用戶)' : 
                               char.source === 'npcs' ? '(NPC)' : 
                               char.type === 'user' ? '(用戶)' :
                               char.type === 'npc' ? '(NPC)' : '';
            return `
            <div class="import-char-item" onclick="importCharFromSettingsAndClose(${idx})">
                <div class="import-char-avatar">
                    ${char.avatar || char.avatar_url 
                        ? `<img src="${char.avatar || char.avatar_url}" alt="${char.name}">` 
                        : '<i class="fas fa-user-circle"></i>'}
                </div>
                <div class="import-char-info">
                    <h4>${char.name || char.char_name || '未命名角色'} ${sourceLabel}</h4>
                    <p>${(char.personality || char.description || '').substring(0, 100)}...</p>
                </div>
                <button class="btn-import">
                    <i class="fas fa-download"></i>
                </button>
            </div>
        `}).join('');
    }
    
    document.getElementById('importCharModal').classList.remove('hidden');
}

function closeImportCharModal() {
    document.getElementById('importCharModal').classList.add('hidden');
}

async function importCharFromSettingsAndClose(charIndex) {
    await importCharFromSettings(charIndex);
    closeImportCharModal();
}

// === 向量化壓縮功能 ===

const VectorCompressor = {
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    },
    
    extractKeywords(text) {
        const stopWords = ['的', '了', '是', '在', '和', '有', '這', '那', '我', '你', '他', '她', '它', '們', '要', '會', '能', '與', '或', '但', '如', '因', '所', '以', '及', '等', '到', '從', '被', '把', '讓', '使', '對', '於', '很', '好', '都', '也', '就', '才', '還', '又', '再', '很', '太', '最', '更', '可', '不', '沒', '去', '來', '做', '看', '說', '想', '聽', '問', '答', '給', '拿', '用', '找', '知道', '覺得', 'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or', 'because', 'until', 'while', 'although', 'though', 'after', 'before', 'when', 'whenever', 'unless', 'since', 'that', 'what', 'which', 'who', 'whom', 'whose', 'whatever', 'whichever', 'whoever', 'whomever'];
        
        const words = text.toLowerCase().split(/[\s\n\r,，。！？！？;；:：""''「」『』【】〔〕（）()（）、·•\-—_]+/);
        
        const wordFreq = {};
        words.forEach(word => {
            if (word.length > 1 && !stopWords.includes(word)) {
                wordFreq[word] = (wordFreq[word] || 0) + 1;
            }
        });
        
        return Object.entries(wordFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .map(([word, freq]) => word);
    },
    
    compressContent(content) {
        if (!content || content.length < 50) {
            return { compressed: content, vector: null, keywords: [] };
        }
        
        const keywords = this.extractKeywords(content);
        const vectorHash = this.simpleHash(content.substring(0, 500));
        
        const summaryLength = Math.min(200, Math.floor(content.length * 0.3));
        const compressed = content.substring(0, summaryLength) + '...';
        
        return {
            compressed,
            vector: vectorHash,
            keywords,
            originalLength: content.length,
            compressedLength: compressed.length,
            compressionRatio: Math.round((1 - compressed.length / content.length) * 100)
        };
    },
    
    async compressAllEntries(storeName) {
        let compressedCount = 0;
        const entries = await wikiDB.getAllEntries(storeName);
        
        for (const entry of entries) {
            if (entry.content && entry.content.length > 100 && !entry.compressed) {
                const result = this.compressContent(entry.content);
                entry.compressedContent = result.compressed;
                entry.vectorHash = result.vector;
                entry.keywords = result.keywords;
                entry.compressed = true;
                entry.compressionRatio = result.compressionRatio;
                
                await wikiDB.updateEntry(storeName, entry);
                compressedCount++;
            }
        }
        
        return compressedCount;
    }
};

// === 外部服務整合功能 ===

const ExternalServices = {
    notion: {
        async connect(apiKey, databaseId) {
            try {
                const response = await fetch('https://api.notion.com/v1/databases/' + databaseId, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Notion-Version': '2022-06-28'
                    }
                });
                
                if (response.ok) {
                    localStorage.setItem('sx_notion_api_key', apiKey);
                    localStorage.setItem('sx_notion_database_id', databaseId);
                    localStorage.setItem('sx_notion_connected', 'true');
                    return { success: true };
                }
                return { success: false, error: '連線失敗' };
            } catch (e) {
                return { success: false, error: e.message };
            }
        },
        
        isConnected() {
            return localStorage.getItem('sx_notion_connected') === 'true';
        },
        
        async createWikiPage(entry, charName, userName) {
            const apiKey = localStorage.getItem('sx_notion_api_key');
            const databaseId = localStorage.getItem('sx_notion_database_id');
            
            if (!apiKey || !databaseId) return null;
            
            const content = entry.compressedContent || entry.content;
            const blocks = await this.buildContentBlocks(content, entry, charName, userName);
            
            const response = await fetch('https://api.notion.com/v1/pages', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'Notion-Version': '2022-06-28'
                },
                body: JSON.stringify({
                    parent: { database_id: databaseId },
                    properties: {
                        Name: {
                            title: [{ text: { content: entry.title || '記憶' } }]
                        },
                        Category: {
                            select: { name: this.mapCategory(entry.category) }
                        },
                        Date: {
                            date: { start: entry.createdAt || new Date().toISOString() }
                        },
                        Tags: {
                            multi_select: (entry.tags || []).map(t => ({ name: t }))
                        },
                        Characters: {
                            rich_text: [{ text: { content: `${userName} & ${charName}` } }]
                        }
                    },
                    children: blocks
                })
            });
            
            return response.ok ? await response.json() : null;
        },
        
        async buildContentBlocks(content, entry, charName, userName) {
            const blocks = [];
            
            blocks.push({
                object: 'block',
                type: 'heading_2',
                heading_2: {
                    rich_text: [{ type: 'text', text: { content: '📜 故事摘要' } }]
                }
            });
            
            const chunks = this.splitText(content, 2000);
            chunks.forEach(chunk => {
                blocks.push({
                    object: 'block',
                    type: 'paragraph',
                    paragraph: {
                        rich_text: [{ type: 'text', text: { content: chunk } }]
                    }
                });
            });
            
            if (entry.keywords && entry.keywords.length > 0) {
                blocks.push({
                    object: 'block',
                    type: 'heading_3',
                    heading_3: {
                        rich_text: [{ type: 'text', text: { content: '🏷️ 關鍵字' } }]
                    }
                });
                blocks.push({
                    object: 'block',
                    type: 'paragraph',
                    paragraph: {
                        rich_text: entry.keywords.slice(0, 10).map(kw => ({
                            type: 'text',
                            text: { content: `#${kw} ` },
                            annotations: { color: 'blue' }
                        }))
                    }
                });
            }
            
            blocks.push({
                object: 'block',
                type: 'divider',
                divider: {}
            });
            
            blocks.push({
                object: 'block',
                type: 'paragraph',
                paragraph: {
                    rich_text: [
                        { type: 'text', text: { content: `👤 ${userName}` }, annotations: { bold: true } },
                        { type: 'text', text: { content: ' ❤️ ' } },
                        { type: 'text', text: { content: `${charName}` }, annotations: { bold: true } }
                    ]
                }
            });
            
            return blocks;
        },
        
        mapCategory(cat) {
            const map = {
                'shared-memories': '共同回憶',
                'shared-milestones': '里程碑',
                'shared-stories': '故事',
                'shared-dialogues': '對話',
                'shared-places': '地點',
                'shared-gifts': '禮物'
            };
            return map[cat] || '回憶';
        },
        
        splitText(text, maxLen) {
            if (!text) return [];
            const chunks = [];
            let current = '';
            const paras = text.split('\n');
            for (const p of paras) {
                if (current.length + p.length + 1 <= maxLen) {
                    current += (current ? '\n' : '') + p;
                } else {
                    if (current) chunks.push(current);
                    current = p;
                }
            }
            if (current) chunks.push(current);
            return chunks;
        },
        
        disconnect() {
            localStorage.removeItem('sx_notion_api_key');
            localStorage.removeItem('sx_notion_database_id');
            localStorage.removeItem('sx_notion_connected');
        }
    },
    
    llmService: {
        providers: {
            gemini: {
                name: 'Gemini',
                endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
                defaultModel: 'gemini-pro'
            },
            openai: {
                name: 'OpenAI',
                endpoint: 'https://api.openai.com/v1/chat/completions',
                defaultModel: 'gpt-4o'
            },
            anthropic: {
                name: 'Anthropic',
                endpoint: 'https://api.anthropic.com/v1/messages',
                defaultModel: 'claude-3-sonnet-20240229'
            },
            custom: {
                name: '自訂',
                endpoint: '',
                defaultModel: ''
            }
        },
        
        async processEntry(entry, provider, apiKey, endpoint, model, charName, userName) {
            const config = this.providers[provider] || this.providers.gemini;
            const apiUrl = endpoint || config.endpoint;
            const modelName = model || config.defaultModel;
            
            const prompt = `請將以下互動紀錄轉換為結構化的 Wiki 條目，包含：
1. 一段優美的敘述性文字（100-150字）
2. 3-5個關鍵詞
3. 情感標籤（如：溫馨、浪漫、有趣、感人等）
4. 建議的配圖描述（用於生成插圖）

角色: ${userName} 和 ${charName}
互動內容:
${entry.content}

請以 JSON 格式回應：
{
    "narrative": "敘述文字",
    "keywords": ["關鍵詞1", "關鍵詞2"],
    "emotionTags": ["情感標籤"],
    "imagePrompt": "配圖描述"
}`;

            try {
                if (provider === 'gemini') {
                    return await this.callGemini(apiUrl, apiKey, modelName, prompt);
                } else if (provider === 'openai') {
                    return await this.callOpenAI(apiUrl, apiKey, modelName, prompt);
                } else if (provider === 'anthropic') {
                    return await this.callAnthropic(apiUrl, apiKey, modelName, prompt);
                } else {
                    return await this.callCustom(apiUrl, apiKey, modelName, prompt);
                }
            } catch (e) {
                console.error('[LLMService] 處理失敗:', e);
                return null;
            }
        },
        
        async callGemini(endpoint, apiKey, model, prompt) {
            const url = `${endpoint}/${model}:generateContent?key=${apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
                })
            });
            
            if (!response.ok) return null;
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            return this.parseResponse(text);
        },
        
        async callOpenAI(endpoint, apiKey, model, prompt) {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: 'system', content: '你是一個專業的 Wiki 條目生成助手。' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 1024
                })
            });
            
            if (!response.ok) return null;
            const data = await response.json();
            const text = data.choices?.[0]?.message?.content || '';
            return this.parseResponse(text);
        },
        
        async callAnthropic(endpoint, apiKey, model, prompt) {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: model,
                    max_tokens: 1024,
                    messages: [{ role: 'user', content: prompt }]
                })
            });
            
            if (!response.ok) return null;
            const data = await response.json();
            const text = data.content?.[0]?.text || '';
            return this.parseResponse(text);
        },
        
        async callCustom(endpoint, apiKey, model, prompt) {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    prompt: prompt,
                    max_tokens: 1024
                })
            });
            
            if (!response.ok) return null;
            const data = await response.json();
            const text = data.choices?.[0]?.text || data.choices?.[0]?.message?.content || data.response || '';
            return this.parseResponse(text);
        },
        
        parseResponse(text) {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    return JSON.parse(jsonMatch[0]);
                } catch (e) {
                    return null;
                }
            }
            return null;
        },
        
        isConnected() {
            return localStorage.getItem('sx_llm_connected') === 'true';
        },
        
        connect(provider, apiKey, endpoint, model) {
            if (apiKey) {
                localStorage.setItem('sx_llm_provider', provider);
                localStorage.setItem('sx_llm_api_key', apiKey);
                localStorage.setItem('sx_llm_endpoint', endpoint || '');
                localStorage.setItem('sx_llm_model', model || '');
                localStorage.setItem('sx_llm_connected', 'true');
                return { success: true };
            }
            return { success: false };
        },
        
        disconnect() {
            localStorage.removeItem('sx_llm_provider');
            localStorage.removeItem('sx_llm_api_key');
            localStorage.removeItem('sx_llm_endpoint');
            localStorage.removeItem('sx_llm_model');
            localStorage.removeItem('sx_llm_connected');
        },
        
        getConfig() {
            return {
                provider: localStorage.getItem('sx_llm_provider') || 'gemini',
                apiKey: localStorage.getItem('sx_llm_api_key') || '',
                endpoint: localStorage.getItem('sx_llm_endpoint') || '',
                model: localStorage.getItem('sx_llm_model') || ''
            };
        }
    }
};

function showExternalServicesModal() {
    const existingModal = document.getElementById('externalServicesModal');
    if (existingModal) existingModal.remove();
    
    const notionConnected = ExternalServices.notion.isConnected();
    const llmConnected = ExternalServices.llmService.isConnected();
    const llmConfig = ExternalServices.llmService.getConfig();
    
    const modal = document.createElement('div');
    modal.id = 'externalServicesModal';
    modal.className = 'chat-selection-modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeExternalServicesModal()"></div>
        <div class="modal-content" style="max-width: 500px; max-height: 80vh; overflow-y: auto;">
            <div class="modal-header">
                <h3>${t('externalServices')}</h3>
                <button class="btn-close" onclick="closeExternalServicesModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <!-- Notion 區塊 -->
                <div class="service-section" style="margin-bottom: 24px; padding: 16px; background: var(--bg-tertiary); border-radius: 12px;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                        <div style="width: 40px; height: 40px; background: #fff; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M4 4h16v16H4V4z" fill="#000"/>
                                <path d="M8 8h8M8 12h8M8 16h4" stroke="#fff" stroke-width="1.5"/>
                            </svg>
                        </div>
                        <div>
                            <h4 style="margin: 0;">Notion</h4>
                            <p style="margin: 0; font-size: 12px; color: var(--text-secondary);">${t('notionConnectDesc')}</p>
                        </div>
                        <span style="margin-left: auto; padding: 4px 8px; border-radius: 4px; font-size: 12px; background: ${notionConnected ? 'var(--accent-success)' : 'var(--bg-primary)'};">
                            ${notionConnected ? '已連結' : '未連結'}
                        </span>
                    </div>
                    <div class="form-group" style="margin-bottom: 12px;">
                        <label style="font-size: 13px; color: var(--text-secondary);">API Key</label>
                        <input type="password" id="notionApiKey" placeholder="secret_xxx..." 
                               style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary); margin-top: 4px;">
                    </div>
                    <div class="form-group" style="margin-bottom: 12px;">
                        <label style="font-size: 13px; color: var(--text-secondary);">Database ID</label>
                        <input type="text" id="notionDbId" placeholder="資料庫 ID"
                               style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary); margin-top: 4px;">
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button onclick="connectNotion()" style="flex: 1; padding: 10px; border-radius: 6px; background: var(--accent-primary); color: white; border: none; cursor: pointer;">
                            ${notionConnected ? '更新連結' : '連結 Notion'}
                        </button>
                        ${notionConnected ? `<button onclick="syncToNotion()" style="flex: 1; padding: 10px; border-radius: 6px; background: var(--accent-success); color: white; border: none; cursor: pointer;">同步記憶</button>` : ''}
                    </div>
                </div>
                
                <!-- AI 服務區塊 -->
                <div class="service-section" style="padding: 16px; background: var(--bg-tertiary); border-radius: 12px;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                        <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                            <i class="fas fa-brain" style="color: white;"></i>
                        </div>
                        <div>
                            <h4 style="margin: 0;">AI 服務</h4>
                            <p style="margin: 0; font-size: 12px; color: var(--text-secondary);">${t('llmServiceDesc')}</p>
                        </div>
                        <span style="margin-left: auto; padding: 4px 8px; border-radius: 4px; font-size: 12px; background: ${ExternalServices.llmService.isConnected() ? 'var(--accent-success)' : 'var(--bg-primary)'};">
                            ${ExternalServices.llmService.isConnected() ? '已連結' : '未連結'}
                        </span>
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 12px;">
                        <label style="font-size: 13px; color: var(--text-secondary);">${t('selectLLMProvider')}</label>
                        <select id="llmProvider" onchange="updateLLMProviderFields()"
                                style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary); margin-top: 4px;">
                            <option value="gemini">Gemini API (Google)</option>
                            <option value="openai">OpenAI API</option>
                            <option value="anthropic">Anthropic API (Claude)</option>
                            <option value="custom">${t('customApi')}</option>
                        </select>
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 12px;">
                        <label style="font-size: 13px; color: var(--text-secondary);">API Key</label>
                        <input type="password" id="llmApiKey" placeholder="輸入 API Key"
                               style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary); margin-top: 4px;">
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 12px;" id="llmEndpointGroup">
                        <label style="font-size: 13px; color: var(--text-secondary);">${t('apiEndpoint')}（選填）</label>
                        <input type="text" id="llmEndpoint" placeholder="https://..."
                               style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary); margin-top: 4px;">
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 12px;">
                        <label style="font-size: 13px; color: var(--text-secondary);">${t('modelName')}（選填）</label>
                        <input type="text" id="llmModel" placeholder="gpt-4o / gemini-pro / claude-3-sonnet..."
                               style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary); margin-top: 4px;">
                    </div>
                    
                    <div style="display: flex; gap: 8px;">
                        <button onclick="connectLLMService()" style="flex: 1; padding: 10px; border-radius: 6px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; cursor: pointer;">
                            ${ExternalServices.llmService.isConnected() ? '更新連結' : '連結服務'}
                        </button>
                        ${ExternalServices.llmService.isConnected() ? `<button onclick="processWithLLMService()" style="flex: 1; padding: 10px; border-radius: 6px; background: var(--accent-warning); color: white; border: none; cursor: pointer;">處理記憶</button>` : ''}
                    </div>
                </div>
                
                <!-- 自動同步選項 -->
                <div style="margin-top: 16px; padding: 12px; background: var(--bg-tertiary); border-radius: 8px;">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; margin-bottom: 8px;">
                        <input type="checkbox" id="autoSyncEnabled" ${localStorage.getItem('sx_auto_sync') === 'true' ? 'checked' : ''} 
                               onchange="toggleAutoSync(this.checked)">
                        <span>${t('autoSync')}</span>
                    </label>
                    <p style="font-size: 12px; color: var(--text-secondary); margin: 0 0 12px 24px;">
                        ${t('autoSyncDesc')}
                    </p>
                    
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; margin-bottom: 8px;">
                        <input type="checkbox" id="autoCleanupEnabled" ${localStorage.getItem('sx_auto_cleanup') === 'true' ? 'checked' : ''} 
                               onchange="toggleAutoCleanup(this.checked, parseInt(document.getElementById('cleanupDaysInput')?.value || 3))">
                        <span>${t('autoCleanup')}</span>
                    </label>
                    <p style="font-size: 12px; color: var(--text-secondary); margin: 0 0 8px 24px;">
                        ${t('autoCleanupDesc')}
                    </p>
                    <div style="display: flex; align-items: center; gap: 8px; margin-left: 24px;">
                        <label style="font-size: 12px;">${t('cleanupDays')}:</label>
                        <input type="number" id="cleanupDaysInput" value="${localStorage.getItem('sx_cleanup_days') || '3'}" min="1" max="30"
                               style="width: 60px; padding: 4px 8px; border-radius: 4px; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary);"
                               onchange="toggleAutoCleanup(document.getElementById('autoCleanupEnabled').checked, parseInt(this.value))">
                        <span style="font-size: 12px;">天</span>
                    </div>
                    
                    <div style="margin-top: 12px; margin-left: 24px; display: flex; gap: 8px;">
                        <button onclick="runCleanupNow()" 
                                style="padding: 8px 16px; border-radius: 6px; background: var(--accent-danger); color: white; border: none; cursor: pointer; font-size: 12px;">
                            ${t('cleanupNow')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('notionApiKey').value = localStorage.getItem('sx_notion_api_key') || '';
    document.getElementById('notionDbId').value = localStorage.getItem('sx_notion_database_id') || '';
    
    document.getElementById('llmProvider').value = llmConfig.provider;
    document.getElementById('llmApiKey').value = llmConfig.apiKey;
    document.getElementById('llmEndpoint').value = llmConfig.endpoint;
    document.getElementById('llmModel').value = llmConfig.model;
    
    updateLLMProviderFields();
}

function closeExternalServicesModal() {
    const modal = document.getElementById('externalServicesModal');
    if (modal) modal.remove();
}

async function connectNotion() {
    const apiKey = document.getElementById('notionApiKey').value.trim();
    const dbId = document.getElementById('notionDbId').value.trim();
    
    if (!apiKey || !dbId) {
        alert('請填寫完整的 Notion設定');
        return;
    }
    
    const result = await ExternalServices.notion.connect(apiKey, dbId);
    if (result.success) {
        alert('Notion 連結成功！');
        showExternalServicesModal();
    } else {
        alert('連結失敗: ' + result.error);
    }
}

function updateLLMProviderFields() {
    const provider = document.getElementById('llmProvider').value;
    const endpointInput = document.getElementById('llmEndpoint');
    const modelInput = document.getElementById('llmModel');
    const config = ExternalServices.llmService.providers[provider];
    
    endpointInput.placeholder = config.endpoint || 'https://...';
    modelInput.placeholder = config.defaultModel || 'model-name';
}

async function connectLLMService() {
    const provider = document.getElementById('llmProvider').value;
    const apiKey = document.getElementById('llmApiKey').value.trim();
    const endpoint = document.getElementById('llmEndpoint').value.trim();
    const model = document.getElementById('llmModel').value.trim();
    
    if (!apiKey) {
        alert('請填寫 API Key');
        return;
    }
    
    ExternalServices.llmService.connect(provider, apiKey, endpoint, model);
    alert(t('connectSuccess'));
    showExternalServicesModal();
}

async function processWithLLMService() {
    const entries = await wikiDB.getSharedEntries();
    const config = ExternalServices.llmService.getConfig();
    const user = getUserFromSettings();
    const charName = localStorage.getItem('sx_char_name') || 'Char';
    
    if (!config.apiKey || entries.length === 0) {
        alert('請先連結 AI 服務');
        return;
    }
    
    let processed = 0;
    
    for (const entry of entries) {
        if (!entry.llmProcessed) {
            const result = await ExternalServices.llmService.processEntry(
                entry,
                config.provider,
                config.apiKey,
                config.endpoint,
                config.model,
                charName,
                user.name
            );
            
            if (result) {
                entry.narrative = result.narrative;
                entry.keywords = [...new Set([...(entry.keywords || []), ...result.keywords])];
                entry.emotionTags = result.emotionTags;
                entry.imagePrompt = result.imagePrompt;
                entry.llmProcessed = true;
                entry.exportedAt = Date.now();
                await wikiDB.updateSharedEntry(entry);
                
                if (localStorage.getItem('sx_auto_cleanup') === 'true') {
                    AutoCleanup.markAsExported(entry.id, 'shared_entries');
                }
                
                processed++;
            }
        }
    }
    
    alert(`${t('llmProcessSuccess')}！已處理 ${processed} 個記憶`);
    
    if (processed > 0 && localStorage.getItem('sx_auto_cleanup') === 'true') {
        AutoCleanup.cleanupExpiredEntries();
    }
    
    await loadSharedWiki();
    closeExternalServicesModal();
}

function toggleAutoSync(enabled) {
    localStorage.setItem('sx_auto_sync', enabled ? 'true' : 'false');
}

const AutoCleanup = {
    markAsExported(entryId, storeName) {
        const exported = JSON.parse(localStorage.getItem('sx_exported_entries') || '{}');
        exported[entryId] = {
            storeName,
            exportedAt: Date.now(),
            deleteAfter: Date.now() + (3 * 24 * 60 * 60 * 1000)
        };
        localStorage.setItem('sx_exported_entries', JSON.stringify(exported));
    },
    
    async cleanupExpiredEntries() {
        if (localStorage.getItem('sx_auto_cleanup') !== 'true') return { cleaned: 0 };
        
        const exported = JSON.parse(localStorage.getItem('sx_exported_entries') || '{}');
        const now = Date.now();
        let cleaned = 0;
        
        for (const [entryId, info] of Object.entries(exported)) {
            if (now >= info.deleteAfter) {
                try {
                    await wikiDB.deleteEntry(info.storeName, entryId);
                    delete exported[entryId];
                    cleaned++;
                } catch (e) {
                    console.warn('[AutoCleanup] 刪除失敗:', e);
                }
            }
        }
        
        localStorage.setItem('sx_exported_entries', JSON.stringify(exported));
        return { cleaned };
    },
    
    async forceCleanup(daysOld = 3) {
        const cutoff = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
        let cleaned = 0;
        
        const exported = JSON.parse(localStorage.getItem('sx_exported_entries') || '{}');
        
        for (const [entryId, info] of Object.entries(exported)) {
            if (info.exportedAt <= cutoff) {
                try {
                    await wikiDB.deleteEntry(info.storeName, entryId);
                    delete exported[entryId];
                    cleaned++;
                } catch (e) {}
            }
        }
        
        localStorage.setItem('sx_exported_entries', JSON.stringify(exported));
        return { cleaned };
    },
    
    getCleanupStats() {
        const exported = JSON.parse(localStorage.getItem('sx_exported_entries') || '{}');
        const now = Date.now();
        let pending = 0;
        let readyToDelete = 0;
        
        for (const info of Object.values(exported)) {
            if (now >= info.deleteAfter) {
                readyToDelete++;
            } else {
                pending++;
            }
        }
        
        return { pending, readyToDelete, total: Object.keys(exported).length };
    }
};

function toggleAutoCleanup(enabled, days = 3) {
    localStorage.setItem('sx_auto_cleanup', enabled ? 'true' : 'false');
    localStorage.setItem('sx_cleanup_days', days.toString());
}

async function runCleanupNow() {
    const days = parseInt(localStorage.getItem('sx_cleanup_days') || '3');
    const result = await AutoCleanup.forceCleanup(days);
    alert(t('cleanupSuccess') + `: ${result.cleaned} 筆`);
    await loadSharedWiki();
}

async function syncToNotion() {
    const entries = await wikiDB.getSharedEntries();
    const user = getUserFromSettings();
    const charName = localStorage.getItem('sx_char_name') || 'Char';
    
    if (entries.length === 0) {
        alert('沒有可同步的記憶');
        return;
    }
    
    let success = 0;
    let failed = 0;
    
    for (const entry of entries) {
        const result = await ExternalServices.notion.createWikiPage(entry, charName, user.name);
        if (result) {
            success++;
            entry.notionPageId = result.id;
            entry.exportedAt = Date.now();
            await wikiDB.updateSharedEntry(entry);
            
            if (localStorage.getItem('sx_auto_cleanup') === 'true') {
                AutoCleanup.markAsExported(entry.id, 'shared_entries');
            }
        } else {
            failed++;
        }
    }
    
    if (failed === 0) {
        alert(`${t('notionSyncSuccess')} (${success} 個條目)`);
        AutoCleanup.cleanupExpiredEntries();
    } else {
        alert(`同步完成！成功: ${success}, 失敗: ${failed}`);
    }
    
    closeExternalServicesModal();
    await loadSharedWiki();
}

async function processWithNotebookLLM() {
    const entries = await wikiDB.getSharedEntries();
    const apiKey = localStorage.getItem('sx_notebook_llm_key');
    const user = getUserFromSettings();
    const charName = localStorage.getItem('sx_char_name') || 'Char';
    
    if (!apiKey || entries.length === 0) {
        alert('請先連結 NotebookLLM');
        return;
    }
    
    let processed = 0;
    
    for (const entry of entries) {
        if (!entry.notebookProcessed) {
            const result = await ExternalServices.notebookLLM.processEntry(entry, apiKey, charName, user.name);
            if (result) {
                entry.narrative = result.narrative;
                entry.keywords = [...new Set([...(entry.keywords || []), ...result.keywords])];
                entry.emotionTags = result.emotionTags;
                entry.imagePrompt = result.imagePrompt;
                entry.notebookProcessed = true;
                entry.exportedAt = Date.now();
                await wikiDB.updateSharedEntry(entry);
                
                if (localStorage.getItem('sx_auto_cleanup') === 'true') {
                    AutoCleanup.markAsExported(entry.id, 'shared_entries');
                }
                
                processed++;
            }
        }
    }
    
    alert(`處理完成！已處理 ${processed} 個記憶`);
    
    if (processed > 0 && localStorage.getItem('sx_auto_cleanup') === 'true') {
        AutoCleanup.cleanupExpiredEntries();
    }
    
    await loadSharedWiki();
    closeExternalServicesModal();
}

async function autoSyncEntry(entry) {
    if (localStorage.getItem('sx_auto_sync') !== 'true') return;
    
    const user = getUserFromSettings();
    const charName = localStorage.getItem('sx_char_name') || 'Char';
    
    if (ExternalServices.notion.isConnected()) {
        await ExternalServices.notion.createWikiPage(entry, charName, user.name);
    }
    
    if (ExternalServices.notebookLLM.isConnected()) {
        const apiKey = localStorage.getItem('sx_notebook_llm_key');
        const result = await ExternalServices.notebookLLM.processEntry(entry, apiKey, charName, user.name);
        if (result) {
            entry.narrative = result.narrative;
            entry.keywords = [...new Set([...(entry.keywords || []), ...result.keywords])];
            entry.emotionTags = result.emotionTags;
            entry.imagePrompt = result.imagePrompt;
            entry.notebookProcessed = true;
            await wikiDB.updateSharedEntry(entry);
        }
    }
}

// 更新 saveTimelineEntries 以支援自動同步
async function saveTimelineEntries(entries, sourceName) {
    for (const entry of entries) {
        try {
            if (entry.content && entry.content.length > 100) {
                const compressed = VectorCompressor.compressContent(entry.content);
                entry.compressedContent = compressed.compressed;
                entry.vectorHash = compressed.vector;
                entry.keywords = compressed.keywords;
                entry.compressed = true;
            }
            
            await wikiDB.addSharedEntry(entry);
            
            if (localStorage.getItem('sx_auto_sync') === 'true') {
                autoSyncEntry(entry);
            }
        } catch (e) {
            console.warn('[PersonalWiki] 添加條目失敗:', e);
        }
    }
    
    await wikiDB.addLog({
        type: 'shared',
        action: 'interaction_imported',
        detail: `從 ${sourceName} 導入 ${entries.length} 個時間軸條目`
    });
    
    await loadSharedWiki();
    alert(t('importChatSuccess'));
}

// 保留舊的函式以向後相容
function showNotionConfigModal() {
    showExternalServicesModal();
}

function closeNotionConfigModal() {
    closeExternalServicesModal();
}

function saveNotionConfig() {
    connectNotion();
}

async function exportSharedWikiToNotion() {
    await syncToNotion();
}

async function compressWikiEntries() {
    try {
        const userCount = await VectorCompressor.compressAllEntries('user_entries');
        const charCount = await VectorCompressor.compressAllEntries('char_entries');
        const sharedCount = await VectorCompressor.compressAllEntries('shared_entries');
        
        const total = userCount + charCount + sharedCount;
        
        await wikiDB.addLog({
            type: 'system',
            action: 'compression',
            detail: `壓縮了 ${total} 個條目`
        });
        
        alert(t('vectorCompressSuccess'));
        return total;
    } catch (e) {
        console.error('[PersonalWiki] 壓縮失敗:', e);
        return 0;
    }
}
