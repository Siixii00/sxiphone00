const STORAGE_KEY = 'ao3_drafts';

const ratingMap = {
    G: 'General Audiences',
    T: 'Teen & Up',
    M: 'Mature',
    E: 'Explicit',
    NR: 'Not Rated'
};

const languageOptions = [
    { code: 'en', label: 'English' },
    { code: 'zh-Hant', label: '繁體中文' },
    { code: 'zh-Hans', label: '简体中文' },
    { code: 'ja', label: '日本語' },
    { code: 'ko', label: '한국어' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'th', label: 'ไทย' },
    { code: 'ru', label: 'Русский' }
];

const tagLimits = {
    fandom: 20,
    relationship: 30,
    characters: 50,
    additional: 60
};

const snippetLibrary = {
    fluff: [
        '{PAIRING} find themselves lingering under {SETTING}, trading soft jokes until the language barrier dissolves into laughter.',
        'In {FANDOM}, {PAIRING} write on napkins, swapping translations of their favorite lyrics before the morning rush returns.'
    ],
    angst: [
        '{PAIRING} hear the last train depart {SETTING}, each syllable of goodbye falling in a different language.',
        'The confession arrives as a voicemail where {CHAR} cycles through English, Mandarin, and shaky Japanese just to say they are sorry.'
    ],
    action: [
        '{CHAR} switches comm-channels mid-fight, barking orders in English, Korean, then Spanish as the mission in {FANDOM} spirals.',
        'Sirens paint the harbor red while {PAIRING} trade cover-fire and code words, translating strategy on the fly.'
    ],
    hurt: [
        '{PAIRING} patch wounds beside the galley sink, writing 「你還好嗎？」 next to “Are you okay?” on gauze tape.',
        '{CHAR} reads every language tag scrawled across the hospital flowers, wondering which one will finally make them stay.'
    ]
};

const saveAO3Data = () => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.drafts));
        console.log("AO3數據已保存至 localStorage");
    } catch (e) {
        console.error("保存AO3數據失敗:", e);
    }
};

const saveToPersistentStorage = async () => {
    saveAO3Data();
    if (typeof localforage !== 'undefined') {
        try {
            const existingData = await localforage.getItem('sx_app_persisted_data') || {};
            await localforage.setItem('sx_app_persisted_data', {
                ...existingData,
                ao3_drafts: state.drafts
            });
            console.log("AO3數據已保存至 IndexedDB");
        } catch (e) {
            console.error("IndexedDB 保存失敗:", e);
        }
    }
};

window.addEventListener('pagehide', () => {
    saveAO3Data();
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        saveAO3Data();
    }
});

window.addEventListener('message', (event) => {
    if (event.data?.type === 'APP_WILL_CLOSE') {
        saveAO3Data();
    }
});

const state = {
    tags: {
        fandom: [],
        relationship: [],
        characters: [],
        additional: []
    },
    languages: [],
    drafts: loadDrafts(),
    statusTimer: null
};

const els = {
    title: document.getElementById('work-title'),
    rating: document.getElementById('work-rating'),
    languagePrimary: document.getElementById('language-select'),
    languageGrid: document.getElementById('language-grid'),
    summary: document.getElementById('work-summary'),
    notes: document.getElementById('work-notes'),
    body: document.getElementById('work-body'),
    toolbar: document.getElementById('format-toolbar'),
    mood: document.getElementById('mood-select'),
    snippet: document.getElementById('generate-snippet'),
    saveDraft: document.getElementById('save-draft'),
    clearDrafts: document.getElementById('clear-drafts'),
    draftList: document.getElementById('draft-list'),
    previewTitle: document.getElementById('preview-title'),
    previewMeta: document.getElementById('preview-meta'),
    previewSummary: document.getElementById('preview-summary'),
    previewNotes: document.getElementById('preview-notes'),
    previewBody: document.getElementById('work-preview'),
    stats: document.getElementById('body-stats'),
    composerStatus: document.getElementById('composer-status')
};

function loadDrafts() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function persistDrafts() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.drafts));
}

function getLanguageLabel(code) {
    return languageOptions.find(item => item.code === code)?.label || code;
}

function renderLanguageChips() {
    if (!els.languageGrid) return;
    els.languageGrid.innerHTML = '';
    languageOptions.forEach(option => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'language-chip' + (state.languages.includes(option.code) ? ' active' : '');
        chip.textContent = option.label;
        chip.dataset.code = option.code;
        chip.addEventListener('click', () => toggleLanguage(option.code));
        els.languageGrid.appendChild(chip);
    });
}

function toggleLanguage(code) {
    if (state.languages.includes(code)) {
        state.languages = state.languages.filter(lang => lang !== code);
    } else {
        state.languages = [...state.languages, code];
    }
    renderLanguageChips();
    updatePreview();
}

function normalizeTag(tag) {
    return tag.replace(/\s+/g, ' ').trim();
}

function addTag(type, value) {
    const normalized = normalizeTag(value);
    if (!normalized) return;
    const current = state.tags[type];
    if (current.length >= tagLimits[type]) {
        setStatus(`「${type}」已達上限 (${tagLimits[type]})`);
        return;
    }
    const exists = current.some(tag => tag.toLowerCase() === normalized.toLowerCase());
    if (exists) {
        setStatus('標籤已存在');
        return;
    }
    state.tags[type] = [...current, normalized];
    renderTags(type);
}

function removeTag(type, index) {
    state.tags[type].splice(index, 1);
    renderTags(type);
}

function renderTags(type) {
    const container = document.getElementById(`tags-${type}`);
    if (!container) return;
    container.innerHTML = '';
    state.tags[type].forEach((tag, index) => {
        const chip = document.createElement('span');
        chip.className = 'tag-chip';
        chip.innerHTML = `${tag}<button type="button" aria-label="移除">×</button>`;
        chip.querySelector('button')?.addEventListener('click', () => removeTag(type, index));
        container.appendChild(chip);
    });
}

function renderAllTags() {
    Object.keys(state.tags).forEach(renderTags);
}

function applyInlineFormatting(text) {
    if (!text) return '';
    const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    return escaped
        .replace(/==(.+?)==/g, '<mark>$1</mark>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code>$1</code>');
}

function formatMarkdown(text) {
    if (!text.trim()) return '';
    const lines = text.split(/\n/);
    const html = lines.map(rawLine => {
        const line = rawLine.trim();
        if (!line) return '';
        if (line.startsWith('### ')) {
            return `<h3>${applyInlineFormatting(line.slice(4))}</h3>`;
        }
        if (line.startsWith('>')) {
            return `<blockquote>${applyInlineFormatting(line.replace(/^>\s?/, ''))}</blockquote>`;
        }
        return `<p>${applyInlineFormatting(rawLine)}</p>`;
    });
    return html.join('');
}

function updatePreview() {
    const title = els.title?.value.trim() || '未命名作品';
    const rating = ratingMap[els.rating?.value || 'NR'] || 'Not Rated';
    const primaryLang = getLanguageLabel(els.languagePrimary?.value || 'en');
    const secondary = state.languages.filter(code => code !== els.languagePrimary?.value);
    const languageMeta = secondary.length ? `${primaryLang} + ${secondary.length} 語系` : primaryLang;
    if (els.previewTitle) els.previewTitle.textContent = title;
    if (els.previewMeta) els.previewMeta.textContent = `${rating} · ${languageMeta}`;
    if (els.previewSummary) {
        const sum = els.summary?.value.trim();
        els.previewSummary.textContent = sum || '輸入摘要後會顯示於此。';
    }
    if (els.previewNotes) {
        const notes = els.notes?.value.trim();
        els.previewNotes.textContent = notes || '';
        els.previewNotes.style.display = notes ? 'block' : 'none';
    }
    if (els.previewBody) {
        const body = els.body?.value || '';
        const html = formatMarkdown(body) || '<p>開始書寫或使用內容產生器，即可看到排版效果。</p>';
        els.previewBody.innerHTML = html;
    }
}

function updateStats() {
    if (!els.stats) return;
    const text = els.body?.value || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    els.stats.textContent = `${words} words · ${chars} chars`;
}

function setStatus(message) {
    if (!els.composerStatus) return;
    els.composerStatus.textContent = message;
    clearTimeout(state.statusTimer);
    state.statusTimer = window.setTimeout(() => {
        if (els.composerStatus) els.composerStatus.textContent = '';
    }, 2000);
}

function wrapSelection(before = '', after = '', placeholder = 'text') {
    if (!els.body) return;
    const textarea = els.body;
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? start;
    const selection = textarea.value.slice(start, end) || placeholder;
    const nextValue = textarea.value.slice(0, start) + before + selection + after + textarea.value.slice(end);
    textarea.value = nextValue;
    const newCursor = start + before.length + selection.length + after.length;
    textarea.focus();
    textarea.setSelectionRange(newCursor, newCursor);
    updateStats();
    updatePreview();
}

function handleToolbar(action) {
    switch (action) {
        case 'bold':
            wrapSelection('**', '**', 'bold text');
            break;
        case 'italic':
            wrapSelection('*', '*', 'italic text');
            break;
        case 'highlight':
            wrapSelection('==', '==', 'highlight');
            break;
        case 'blockquote':
            wrapSelection('\n> ', '', 'quote');
            break;
        case 'heading':
            wrapSelection('\n### ', '\n', 'Section title');
            break;
        default:
            break;
    }
}

function composeSnippet() {
    const mood = els.mood?.value || 'fluff';
    const templates = snippetLibrary[mood] || snippetLibrary.fluff;
    const template = templates[Math.floor(Math.random() * templates.length)];
    const fandom = state.tags.fandom[0] || 'Original Verse';
    const relationship = state.tags.relationship[0] || 'two travelers';
    const character = state.tags.characters[0] || 'the protagonist';
    const setting = state.tags.additional[0] || 'the empty station';
    return template
        .replace('{FANDOM}', fandom)
        .replace('{PAIRING}', relationship)
        .replace('{CHAR}', character)
        .replace('{SETTING}', setting);
}

function generateSnippet() {
    if (!els.body) return;
    setStatus('產生段落中...');
    setTimeout(() => {
        const snippet = composeSnippet();
        const prefix = els.body.value && !els.body.value.endsWith('\n') ? '\n\n' : '';
        els.body.value += `${prefix}${snippet}`;
        updateStats();
        updatePreview();
        setStatus('已插入段落');
    }, 500);
}

function buildDraftPayload() {
    return {
        id: `draft-${Date.now()}`,
        title: els.title?.value.trim() || 'Untitled',
        rating: els.rating?.value || 'NR',
        language: els.languagePrimary?.value || 'en',
        languages: [...state.languages],
        summary: els.summary?.value || '',
        notes: els.notes?.value || '',
        body: els.body?.value || '',
        tags: JSON.parse(JSON.stringify(state.tags)),
        createdAt: new Date().toISOString()
    };
}

function saveDraft() {
    const body = els.body?.value.trim();
    const summary = els.summary?.value.trim();
    if (!body && !summary) {
        setStatus('至少輸入內文或摘要才能儲存');
        return;
    }
    const payload = buildDraftPayload();
    state.drafts = [payload, ...state.drafts].slice(0, 12);
    persistDrafts();
    renderDrafts();
    setStatus('草稿已儲存');
}

function loadDraft(draft) {
    if (!draft) return;
    if (els.title) els.title.value = draft.title;
    if (els.rating) els.rating.value = draft.rating;
    if (els.languagePrimary) els.languagePrimary.value = draft.language;
    state.languages = draft.languages || [];
    Object.keys(state.tags).forEach(key => {
        state.tags[key] = [...(draft.tags?.[key] || [])];
    });
    if (els.summary) els.summary.value = draft.summary || '';
    if (els.notes) els.notes.value = draft.notes || '';
    if (els.body) els.body.value = draft.body || '';
    renderLanguageChips();
    renderAllTags();
    updateStats();
    updatePreview();
    setStatus('已載入草稿');
}

function deleteDraft(id) {
    state.drafts = state.drafts.filter(draft => draft.id !== id);
    persistDrafts();
    renderDrafts();
    setStatus('草稿已刪除');
}

function clearDrafts() {
    if (!state.drafts.length) {
        setStatus('沒有草稿可清除');
        return;
    }
    state.drafts = [];
    persistDrafts();
    renderDrafts();
    setStatus('草稿列表已清空');
}

function formatDraftMeta(draft) {
    const date = new Date(draft.createdAt);
    return `${date.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })} ${date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}`;
}

function renderDrafts() {
    if (!els.draftList) return;
    els.draftList.innerHTML = '';
    if (!state.drafts.length) {
        const empty = document.createElement('li');
        empty.textContent = '尚未儲存任何草稿';
        empty.style.opacity = '0.6';
        els.draftList.appendChild(empty);
        return;
    }
    state.drafts.forEach(draft => {
        const item = document.createElement('li');
        item.className = 'draft-item';
        const meta = document.createElement('div');
        meta.innerHTML = `<strong>${draft.title}</strong><div>${formatDraftMeta(draft)}</div>`;
        const actions = document.createElement('div');
        actions.className = 'draft-actions';
        const loadBtn = document.createElement('button');
        loadBtn.textContent = '載入';
        loadBtn.addEventListener('click', () => loadDraft(draft));
        const delBtn = document.createElement('button');
        delBtn.textContent = '刪除';
        delBtn.addEventListener('click', () => deleteDraft(draft.id));
        actions.append(loadBtn, delBtn);
        item.append(meta, actions);
        els.draftList.appendChild(item);
    });
}

function bindTagInputs() {
    document.querySelectorAll('[data-tag-input]').forEach(input => {
        input.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            const type = input.dataset.tagInput;
            addTag(type, input.value);
            input.value = '';
        });
    });
}

function attachEvents() {
    els.title?.addEventListener('input', updatePreview);
    els.summary?.addEventListener('input', updatePreview);
    els.notes?.addEventListener('input', updatePreview);
    els.body?.addEventListener('input', () => {
        updateStats();
        updatePreview();
    });
    els.rating?.addEventListener('change', updatePreview);
    els.languagePrimary?.addEventListener('change', updatePreview);
    els.toolbar?.addEventListener('click', (event) => {
        const btn = event.target.closest('button[data-format]');
        if (!btn) return;
        handleToolbar(btn.dataset.format);
    });
    els.snippet?.addEventListener('click', generateSnippet);
    els.saveDraft?.addEventListener('click', saveDraft);
    els.clearDrafts?.addEventListener('click', clearDrafts);
    document.getElementById('ao3-close')?.addEventListener('click', () => {
        window.parent?.postMessage({ type: 'closeApp' }, '*');
    });
    document.getElementById('ao3-menu')?.addEventListener('click', toggleMenuDropdown);
    document.getElementById('menu-export-txt')?.addEventListener('click', exportAsTxt);
    document.getElementById('menu-export-md')?.addEventListener('click', exportAsMarkdown);
    document.getElementById('menu-import')?.addEventListener('click', importDraft);
    document.getElementById('menu-clear-form')?.addEventListener('click', clearForm);
    document.getElementById('menu-help')?.addEventListener('click', showHelp);
    
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('ao3-menu-dropdown');
        const menuBtn = document.getElementById('ao3-menu');
        if (dropdown && !dropdown.contains(e.target) && !menuBtn?.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });
    bindTagInputs();
}

function loadCharactersForInspiration() {
    if (typeof SxSettings === 'undefined') return null;
    const settings = SxSettings.getSettingsSnapshot();
    
    const personas = [];
    settings.characters.forEach(char => {
        personas.push({
            name: char.name,
            type: 'character',
            personality: char.personality || '',
            background: char.background || '',
            avatar: char.avatar || ''
        });
    });
    settings.users.forEach(user => {
        personas.push({
            name: user.name,
            type: 'user',
            personality: user.personality || '',
            background: user.background || '',
            avatar: user.avatar || ''
        });
    });
    settings.npcs.forEach(npc => {
        personas.push({
            name: npc.name,
            type: 'npc',
            personality: npc.personality || '',
            background: npc.background || '',
            avatar: npc.avatar || ''
        });
    });
    
    if (personas.length > 0) {
        console.log('[ao3] Loaded personas for inspiration:', personas.length);
    }
    
    return personas;
}

function init() {
    loadCharactersForInspiration();
    renderLanguageChips();
    renderAllTags();
    renderDrafts();
    updateStats();
    updatePreview();
    attachEvents();
}

function getAO3WorldbookData() {
  const categories = ['cot', 'style', 'global', 'keywords', 'backend'];
  const result = {};
  categories.forEach(cat => {
    const key = `sx_worldbook_${cat}`;
    const raw = localStorage.getItem(key);
    if (!raw) return;
    try {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        result[cat] = list;
      }
    } catch (e) {}
  });
  return result;
}

function getAO3WorldbookContext() {
  const data = getAO3WorldbookData();
  const entries = [];
  for (const [cat, list] of Object.entries(data)) {
    if (list && list.length > 0) {
      list.slice(0, 5).forEach(e => {
        if (e.title && e.content) {
          entries.push(`【${e.title}】${e.content.slice(0, 200)}`);
        }
      });
    }
  }
  return entries.length > 0 ? entries.join('\n') : '無世界書設定';
}

function getAO3CharacterData(name) {
  if (!name) return null;
  const raw = localStorage.getItem('sx_characters');
  if (!raw) return null;
  try {
    const list = JSON.parse(raw);
    return list.find(c => c.name === name) || null;
  } catch {
    return null;
  }
}

function getAO3ActiveCharacter() {
  const activeName = localStorage.getItem('sx_char_name');
  return getAO3CharacterData(activeName);
}

function getAO3UserData() {
  return {
    name: localStorage.getItem('sx_user_name') || 'User',
    personality: localStorage.getItem('sx_user_personality') || '',
    background: localStorage.getItem('sx_user_background') || ''
  };
}

function getAO3ChatHistory(limit = 15) {
  const raw = localStorage.getItem('sx_chat_history');
  if (!raw) return [];
  try {
    const history = JSON.parse(raw);
    return history.slice(-limit);
  } catch {
    return [];
  }
}

function getAO3ChatHistoryContext() {
  const history = getAO3ChatHistory(15);
  if (history.length === 0) return '無聊天記錄';
  const user = getAO3UserData();
  return history.map(msg => {
    const role = msg.role === 'user' ? user.name : '角色';
    return `${role}: ${msg.content.slice(0, 100)}`;
  }).join('\n');
}

function getAO3ApiConfig() {
  const raw = localStorage.getItem('api_configs');
  if (!raw) return null;
  try {
    const configs = JSON.parse(raw);
    const activeIndex = Number(localStorage.getItem('sx_active_api') || 0);
    return configs[activeIndex] || configs[0] || null;
  } catch {
    return null;
  }
}

async function callAO3AIAPI(messages, temperature = 0.85) {
  const config = getAO3ApiConfig();
  if (!config || !config.url) {
    throw new Error('尚未設定 API');
  }

  const endpoint = config.url.endsWith('/chat/completions')
    ? config.url
    : `${config.url.replace(/\/$/, '')}/chat/completions`;

  const headers = { 'Content-Type': 'application/json' };
  if (config.key) {
    headers.Authorization = `Bearer ${config.key}`;
  }

  const fetchWithTimeout = (url, options, timeoutMs) => {
    return new Promise((resolve, reject) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        reject(new Error(`請求逾時 (${timeoutMs / 1000}秒)`));
      }, timeoutMs);

      fetch(url, { ...options, signal: controller.signal })
        .then(response => {
          clearTimeout(timeoutId);
          resolve(response);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  };

  const maxRetries = 3;
  let retryCount = 0;
  let lastError = null;

  while (retryCount < maxRetries) {
    try {
      const timeoutMs = 120000 + (retryCount * 60000);
      console.log(`[AO3] 嘗試生成 (第 ${retryCount + 1} 次)，逾時: ${timeoutMs / 1000}秒`);

      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: config.model || 'gpt-3.5-turbo',
          messages,
          temperature,
          max_tokens: 4000
        })
      }, timeoutMs);

      if (!response.ok) {
        throw new Error(`API 錯誤 (${response.status})`);
      }

      const data = await response.json();
      console.log('[AO3] 生成成功');
      return data.choices?.[0]?.message?.content || '';

    } catch (err) {
      lastError = err;
      retryCount++;
      console.warn(`[AO3] 第 ${retryCount} 次嘗試失敗:`, err.message);
      
      if (retryCount < maxRetries) {
        console.log(`[AO3] 等待 2 秒後重試...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  throw new Error(`${lastError?.message || '未知錯誤'}（已嘗試 ${maxRetries} 次）`);
}

function buildAO3Context() {
  const user = getAO3UserData();
  const char = getAO3ActiveCharacter();
  const worldbook = getAO3WorldbookContext();
  const chatHistory = getAO3ChatHistoryContext();

  let context = `# 使用者設定\n名稱: ${user.name}\n`;
  if (user.personality) context += `性格: ${user.personality}\n`;
  if (user.background) context += `背景: ${user.background}\n`;

  if (char) {
    context += `\n# 角色設定\n名稱: ${char.name}\n`;
    if (char.personality) context += `性格: ${char.personality}\n`;
    if (char.background) context += `背景: ${char.background}\n`;
  }

  context += `\n# 世界書\n${worldbook}\n`;

  if (chatHistory !== '無聊天記錄') {
    context += `\n# 近期對話\n${chatHistory}\n`;
  }

  return context;
}

let isGeneratingAO3 = false;

async function generateAO3Content() {
  if (isGeneratingAO3) {
    alert('正在生成中，請稍候...');
    return;
  }

  isGeneratingAO3 = true;

  try {
    const context = buildAO3Context();
    
    // 使用 AO3 應用內的語言選擇器
    const selectedLang = els.languagePrimary?.value || 'zh-Hant';
    
    // 語言代碼轉換為 AI 可讀的名稱
    const langNames = {
      'en': 'English',
      'zh-Hant': '繁體中文',
      'zh-Hans': '简体中文',
      'ja': '日本語',
      'ko': '한국어',
      'es': 'Español',
      'fr': 'Français',
      'de': 'Deutsch',
      'th': 'ไทย',
      'ru': 'Русский'
    };
    const langName = langNames[selectedLang] || '繁體中文';

    const fandom = state.tags.fandom.join(', ') || '未指定';
    const relationship = state.tags.relationship.join(', ') || '未指定';
    const characters = state.tags.characters.join(', ') || '未指定';

    const systemPrompt = `你是一位專業的同人文作家，擅長根據角色設定和使用者背景創作符合人物性格的同人文。
請使用 ${langName} 撰撰寫。
輸出格式為 JSON: {"title": "標題", "content": "正文內容", "tags": ["標籤1", "標籤2"]}`;

    const prompt = `${context}

Fandom: ${fandom}
CP: ${relationship}
角色: ${characters}

請生成一篇同人文，要求：
1. 符合角色性格和使用者設定
2. 自然融入世界書設定
3. 字數約 500-1000 字
4. 包含標題和正文

輸出 JSON 格式。`;

    const result = await callAO3AIAPI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ]);

    let parsed = null;
    try {
      parsed = JSON.parse(result);
    } catch {
      const match = result.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }

    if (parsed && parsed.content) {
      const titleInput = document.getElementById('titleInput');
      const contentInput = document.getElementById('contentInput');
      
      if (titleInput) titleInput.value = parsed.title || 'AI 生成的同人文';
      if (contentInput) contentInput.value = parsed.content;
      
      if (parsed.tags && Array.isArray(parsed.tags)) {
        parsed.tags.forEach(tag => {
          if (!state.tags.additional.includes(tag)) {
            state.tags.additional.push(tag);
          }
        });
        renderAllTags();
      }
      
      updatePreview();
      setStatus('已生成同人文內容');
    } else {
      alert('生成失敗，請稍後重試');
    }
  } catch (err) {
    alert(`生成失敗: ${err.message}`);
  } finally {
    isGeneratingAO3 = false;
  }
}

function toggleMenuDropdown() {
    const dropdown = document.getElementById('ao3-menu-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
    }
}

function exportAsTxt() {
    const title = els.title?.value || '未命名作品';
    const summary = els.summary?.value || '';
    const notes = els.notes?.value || '';
    const body = els.body?.value || '';
    const tags = Object.entries(state.tags).map(([type, items]) => 
        `${type}: ${items.join(', ')}`
    ).join('\n');
    
    const content = `${title}\n${'='.repeat(title.length)}\n\nTags:\n${tags}\n\nSummary:\n${summary}\n\nNotes:\n${notes}\n\n---\n\n${body}`;
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    setStatus('已匯出為 TXT');
    toggleMenuDropdown();
}

function exportAsMarkdown() {
    const title = els.title?.value || '未命名作品';
    const rating = els.rating?.value || 'G';
    const lang = els.languagePrimary?.value || 'en';
    const summary = els.summary?.value || '';
    const notes = els.notes?.value || '';
    const body = els.body?.value || '';
    
    const fandomTags = state.tags.fandom.map(t => `[[${t}]]`).join(', ');
    const relTags = state.tags.relationship.map(t => `[[${t}]]`).join(', ');
    const charTags = state.tags.characters.map(t => `[[${t}]]`).join(', ');
    const addTags = state.tags.additional.map(t => `[[${t}]]`).join(', ');
    
    const content = `# ${title}\n\n**Rating:** ${ratingMap[rating] || rating}\n**Language:** ${getLanguageLabel(lang)}\n\n## Tags\n- **Fandoms:** ${fandomTags || 'None'}\n- **Relationships:** ${relTags || 'None'}\n- **Characters:** ${charTags || 'None'}\n- **Additional:** ${addTags || 'None'}\n\n## Summary\n${summary || '_No summary_'}\n\n## Notes\n${notes || '_No notes_'}\n\n---\n\n${body || '_No content yet_'}`;
    
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    
    setStatus('已匯出為 Markdown');
    toggleMenuDropdown();
}

function importDraft() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.md,.json';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            
            if (file.name.endsWith('.json')) {
                const data = JSON.parse(text);
                if (data.title) els.title.value = data.title;
                if (data.summary) els.summary.value = data.summary;
                if (data.notes) els.notes.value = data.notes;
                if (data.body) els.body.value = data.body;
                if (data.tags) {
                    Object.keys(data.tags).forEach(type => {
                        state.tags[type] = data.tags[type];
                    });
                    renderAllTags();
                }
            } else {
                els.body.value = text;
            }
            
            updatePreview();
            setStatus('已匯入草稿');
        } catch (err) {
            setStatus('匯入失敗: ' + err.message);
        }
        
        toggleMenuDropdown();
    };
    
    input.click();
}

function clearForm() {
    if (confirm('確定要清空所有欄位嗎？')) {
        els.title.value = '';
        els.summary.value = '';
        els.notes.value = '';
        els.body.value = '';
        state.tags = {
            fandom: [],
            relationship: [],
            characters: [],
            additional: []
        };
        state.languages = [];
        renderAllTags();
        renderLanguageChips();
        updatePreview();
        setStatus('已清空表單');
    }
    toggleMenuDropdown();
}

function showHelp() {
    alert(`AO3 行動寫作工作室使用說明：

1. 填寫作品標題、分級和語言
2. 使用標籤欄位加入 Fandom、CP、角色等
3. 在編輯器中撰寫正文（支援 Markdown）
4. 使用「產生段落」獲得靈感
5. 儲存草稿避免遺失
6. 完成後可匯出為 TXT 或 Markdown

快捷鍵：
- Ctrl/Cmd + S：儲存草稿
- Ctrl/Cmd + B：粗體
- Ctrl/Cmd + I：斜體`);
    toggleMenuDropdown();
}

document.addEventListener('DOMContentLoaded', init);

document.addEventListener('click', (event) => {
  if (event.target.closest('#ai-generate-ao3-btn')) {
    generateAO3Content();
  }
});
