const app = document.querySelector('.chrome-mobile');
const viewToggle = document.getElementById('view-toggle');
const modeBtn = document.getElementById('mode-btn');
const panels = document.querySelectorAll('.panel');
const statusText = document.getElementById('status-text');
const homeBack = document.getElementById('home-back');
const bottomBack = document.getElementById('bottom-back');
const historyList = document.getElementById('history-list');
const historyRefresh = document.getElementById('history-refresh');
const charSelect = document.getElementById('char-select');
const historyDetailBack = document.getElementById('history-detail-back');
const detailSearchQuery = document.getElementById('detail-search-query');
const detailTime = document.getElementById('detail-time');
const detailSummary = document.getElementById('detail-summary');
const detailPageContent = document.getElementById('detail-page-content');
const quickTiles = Array.from(document.querySelectorAll('.quick-tile'));
const incognitoQuickGrid = document.getElementById('incognito-quick-grid');
const newTabBtn = document.getElementById('new-tab-btn');
const historyModal = document.getElementById('history-modal');
const historyModalClose = document.getElementById('history-modal-close');
const historyModalBackdrop = document.querySelector('.history-modal-backdrop');
const historyGenerateBtn = document.getElementById('history-generate-btn');
const historyManualBtn = document.getElementById('history-manual-btn');
const historyManual = document.getElementById('history-manual');
const historyManualQuery = document.getElementById('history-manual-query');
const historyManualSummary = document.getElementById('history-manual-summary');
const historyManualSave = document.getElementById('history-manual-save');
const profileTrigger = document.getElementById('profile-trigger');
const profileDrawer = document.getElementById('profile-drawer');
const profileClose = document.getElementById('profile-close');
const profileBackdrop = document.getElementById('profile-backdrop');
const chromeUserSelect = document.getElementById('chrome-user-select');
const chromeWorldbookList = document.getElementById('chrome-worldbook-list');
const profileApply = document.getElementById('profile-apply');
const bookmarkList = document.getElementById('bookmark-list');
const bookmarkSearch = document.getElementById('bookmark-search');
const addBookmarkBtn = document.getElementById('add-bookmark-btn');
const bookmarkModal = document.getElementById('bookmark-modal');
const bookmarkModalClose = document.getElementById('bookmark-modal-close');
const bookmarkNameInput = document.getElementById('bookmark-name');
const bookmarkUrlInput = document.getElementById('bookmark-url');
const bookmarkFolderSelect = document.getElementById('bookmark-folder');
const bookmarkSaveBtn = document.getElementById('bookmark-save');

let charProfiles = [];
let historyEntries = [];
let chromeUserProfiles = [];
let chromeWorldbookMounts = [];
let bookmarks = [];

const CHROME_BOOKMARKS_KEY = 'sx_chrome_bookmarks';

const saveChromeData = () => {
  try {
    localStorage.setItem('sx_chrome_user_profile', JSON.stringify(chromeUserProfiles));
    localStorage.setItem('sx_chrome_worldbooks', JSON.stringify(chromeWorldbookMounts));
    localStorage.setItem(CHROME_BOOKMARKS_KEY, JSON.stringify(bookmarks));
    console.log("Chrome數據已保存至 localStorage");
  } catch (e) {
    console.error("保存Chrome數據失敗:", e);
  }
};

const loadBookmarks = () => {
  try {
    const raw = localStorage.getItem(CHROME_BOOKMARKS_KEY);
    bookmarks = raw ? JSON.parse(raw) : [];
  } catch {
    bookmarks = [];
  }
};

const renderBookmarks = () => {
  if (!bookmarkList) return;
  
  const searchTerm = bookmarkSearch?.value?.toLowerCase() || '';
  const filtered = bookmarks.filter(b => 
    b.name.toLowerCase().includes(searchTerm) || 
    b.url.toLowerCase().includes(searchTerm)
  );
  
  if (filtered.length === 0) {
    bookmarkList.innerHTML = '<div class="chrome-wb-empty">尚未新增書籤</div>';
    return;
  }
  
  bookmarkList.innerHTML = filtered.map((b, i) => `
    <div class="bookmark-item" data-index="${i}">
      <div class="left">
        <i class="fas fa-globe"></i>
        <span>${escapeHTML(b.name)}</span>
      </div>
      <div class="bookmark-actions">
        <button class="icon-btn sm bookmark-open" data-url="${escapeHTML(b.url)}" title="開啟">
          <i class="fas fa-external-link-alt"></i>
        </button>
        <button class="icon-btn sm bookmark-delete" data-index="${i}" title="刪除">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
  
  bookmarkList.querySelectorAll('.bookmark-open').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const url = btn.dataset.url;
      if (url) {
        window.open(url, '_blank');
      }
    });
  });
  
  bookmarkList.querySelectorAll('.bookmark-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.index);
      if (!isNaN(index)) {
        bookmarks.splice(index, 1);
        saveChromeData();
        renderBookmarks();
      }
    });
  });
};

const openBookmarkModal = () => {
  bookmarkModal?.removeAttribute('hidden');
};

const closeBookmarkModal = () => {
  bookmarkModal?.setAttribute('hidden', '');
  bookmarkNameInput.value = '';
  bookmarkUrlInput.value = '';
};

const saveBookmark = () => {
  const name = bookmarkNameInput?.value?.trim();
  const url = bookmarkUrlInput?.value?.trim();
  
  if (!name || !url) {
    alert('請輸入網站名稱和網址');
    return;
  }
  
  bookmarks.push({
    name,
    url,
    createdAt: Date.now()
  });
  
  saveChromeData();
  closeBookmarkModal();
  renderBookmarks();
};

const escapeHTML = (str = '') => String(str)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

const saveToPersistentStorage = async () => {
  saveChromeData();
  if (typeof localforage !== 'undefined') {
    try {
      const existingData = await localforage.getItem('sx_app_persisted_data') || {};
      await localforage.setItem('sx_app_persisted_data', {
        ...existingData,
        sx_chrome_user_profile: chromeUserProfiles,
        sx_chrome_worldbooks: chromeWorldbookMounts
      });
      console.log("Chrome數據已保存至 IndexedDB");
    } catch (e) {
      console.error("IndexedDB 保存失敗:", e);
    }
  }
};

window.addEventListener('pagehide', () => {
  saveChromeData();
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    saveChromeData();
  }
});

window.addEventListener('message', (event) => {
  if (event.data?.type === 'APP_WILL_CLOSE') {
    saveChromeData();
  }
});

const INCOGNITO_SITES = [
  { label: 'nhentai', icon: 'NH' },
  { label: 'av.com', icon: 'AV' },
  { label: 'dreams', icon: 'DR' }
];

const storeQuickDefaults = () => {
  quickTiles.forEach(tile => {
    if (!tile.dataset.defaultTitle) {
      tile.dataset.defaultTitle = tile.querySelector('.tile-title')?.textContent || '';
    }
    if (!tile.dataset.defaultIcon) {
      tile.dataset.defaultIcon = tile.querySelector('.tile-icon')?.textContent || '';
    }
  });
};

const applyQuickTiles = (mode) => {
  if (incognitoQuickGrid) {
    incognitoQuickGrid.hidden = mode !== 'incognito';
  }
};

const ADULT_EXPLICIT_KEYWORDS = ['成年', '中年', '大叔', '姐姐', '人妻', '成熟', '情慾', '成人', '18+', 'AV', '情色', '尺度', '慾望', '放縱', '激情'];

const isIncognito = () => app?.dataset.mode === 'incognito';

const getAdultLevel = (char) => {
  if (!isIncognito()) return 'none';
  const persona = `${char?.name || ''} ${char?.personality || ''} ${char?.background || ''}`.toLowerCase();
  const explicit = ADULT_EXPLICIT_KEYWORDS.some(key => persona.includes(key.toLowerCase()));
  return explicit ? 'explicit' : 'suggestive';
};

function switchView(view) {
  app.dataset.view = view;
  panels.forEach(panel => {
    const match = panel.dataset.panel === view;
    panel.toggleAttribute('hidden', !match);
    if (match) panel.style.display = 'block'; else panel.style.display = 'none';
  });
  viewToggle.querySelectorAll('button').forEach(btn => btn.classList.toggle('active', btn.dataset.view === view));
}

function toggleMode() {
  const next = app.dataset.mode === 'normal' ? 'incognito' : 'normal';
  app.dataset.mode = next;
  modeBtn.textContent = next === 'incognito' ? '一般' : '無痕';
  if (statusText) {
    statusText.textContent = next === 'incognito' ? '' : '一般模式 • 已連線';
    statusText.toggleAttribute('hidden', next === 'incognito');
  }
  const hero = document.getElementById('incognito-hero');
  if (hero) hero.hidden = next !== 'incognito';
  applyQuickTiles(next);
  const active = charSelect?.value || '';
  if (active) generateHistoryForChar(active);
}

function bindEvents() {
  viewToggle?.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  modeBtn?.addEventListener('click', toggleMode);

  homeBack?.addEventListener('click', () => {
    window.parent?.postMessage({ type: 'closeApp' }, '*');
  });

  bottomBack?.addEventListener('click', () => {
    window.parent?.postMessage({ type: 'closeApp' }, '*');
  });

  historyRefresh?.addEventListener('click', () => {
    const active = charSelect?.value || '';
    if (active) generateHistoryForChar(active);
  });

  charSelect?.addEventListener('change', () => {
    generateHistoryForChar(charSelect.value);
  });

  historyDetailBack?.addEventListener('click', () => {
    switchView('history');
  });

  newTabBtn?.addEventListener('click', () => {
    if (isIncognito()) return;
    if (historyModal) {
      historyModal.hidden = false;
      historyManual.hidden = true;
    }
  });

  historyModalClose?.addEventListener('click', () => {
    if (historyModal) historyModal.hidden = true;
  });

  historyModalBackdrop?.addEventListener('click', () => {
    if (historyModal) historyModal.hidden = true;
  });

  historyGenerateBtn?.addEventListener('click', () => {
    const active = charSelect?.value || '';
    if (active) generateHistoryForChar(active);
    if (historyModal) historyModal.hidden = true;
  });

  historyManualBtn?.addEventListener('click', () => {
    if (historyManual) historyManual.hidden = false;
  });

  historyManualSave?.addEventListener('click', () => {
    const query = historyManualQuery?.value.trim();
    if (!query) return;
    const summary = historyManualSummary?.value.trim() || `搜尋了「${query}」相關資訊。`;
    const entry = {
      id: `history_${Date.now()}_${historyEntries.length}`,
      title: `${query} 是什麼？`,
      query,
      time: '剛剛',
      summary,
      incognito: false,
      adultLevel: 'none'
    };
    historyEntries.unshift(entry);
    renderHistoryList();
    pushHistoryToMemory([entry], charProfiles[Number(charSelect?.value || 0)]);
    if (historyModal) historyModal.hidden = true;
    if (historyManualQuery) historyManualQuery.value = '';
    if (historyManualSummary) historyManualSummary.value = '';
  });

  profileTrigger?.addEventListener('click', () => {
    if (!profileDrawer || !profileBackdrop) return;
    profileDrawer.classList.add('open');
    profileBackdrop.hidden = false;
  });

  profileClose?.addEventListener('click', () => {
    profileDrawer?.classList.remove('open');
    if (profileBackdrop) profileBackdrop.hidden = true;
  });

  profileBackdrop?.addEventListener('click', () => {
    profileDrawer?.classList.remove('open');
    profileBackdrop.hidden = true;
  });

  profileApply?.addEventListener('click', () => {
    if (chromeUserSelect) {
      localStorage.setItem('sx_chrome_user_profile', chromeUserSelect.value || '');
    }
    const selectedWorldbooks = Array.from(chromeWorldbookList?.querySelectorAll('input[type="checkbox"]:checked') || [])
      .map(input => input.value);
    localStorage.setItem('sx_chrome_worldbooks', JSON.stringify(selectedWorldbooks));
    profileDrawer?.classList.remove('open');
    if (profileBackdrop) profileBackdrop.hidden = true;
  });

  addBookmarkBtn?.addEventListener('click', openBookmarkModal);
  
  bookmarkModalClose?.addEventListener('click', closeBookmarkModal);
  
  bookmarkModal?.querySelector('.history-modal-backdrop')?.addEventListener('click', closeBookmarkModal);
  
  bookmarkSaveBtn?.addEventListener('click', saveBookmark);
  
  bookmarkSearch?.addEventListener('input', renderBookmarks);
}

function loadUserProfiles() {
  const raw = localStorage.getItem('sx_users') || '[]';
  try {
    const list = JSON.parse(raw) || [];
    chromeUserProfiles = Array.isArray(list) ? list : [];
  } catch {
    chromeUserProfiles = [];
  }
  if (chromeUserSelect) {
    const stored = localStorage.getItem('sx_chrome_user_profile') || '';
    chromeUserSelect.innerHTML = chromeUserProfiles.map((user, index) => {
      const name = user?.name || `User ${index + 1}`;
      const selected = stored === name ? 'selected' : '';
      return `<option value="${name}" ${selected}>${name}</option>`;
    }).join('');
  }
}

function loadWorldbookMounts() {
  const raw = localStorage.getItem('sx_worldbook_mounts') || '[]';
  try {
    const list = JSON.parse(raw) || [];
    chromeWorldbookMounts = Array.isArray(list) ? list : [];
  } catch {
    chromeWorldbookMounts = [];
  }
  
  const toggle = document.getElementById('chrome-wb-toggle');
  
  if (chromeWorldbookList) {
    const stored = JSON.parse(localStorage.getItem('sx_chrome_worldbooks') || '[]');
    
    if (chromeWorldbookMounts.length === 0) {
      chromeWorldbookList.innerHTML = '<div class="chrome-wb-empty">尚無可掛載的世界書</div>';
      if (toggle) toggle.innerHTML = '尚無世界書 <i class="fas fa-chevron-down"></i>';
      return;
    }
    
    chromeWorldbookList.innerHTML = chromeWorldbookMounts.map((mount, index) => {
      const name = mount?.name || `世界書 ${index + 1}`;
      const checked = stored.includes(name) ? 'checked' : '';
      return `<div class="chrome-wb-item"><input type="checkbox" value="${name}" ${checked}><span>${name}</span></div>`;
    }).join('');
    
    updateWorldbookToggleText();
  }
  
  if (toggle && chromeWorldbookList) {
    toggle.onclick = (e) => {
      e.stopPropagation();
      chromeWorldbookList.classList.toggle('active');
      toggle.classList.toggle('active');
    };
    
    document.addEventListener('click', (e) => {
      if (!chromeWorldbookList.contains(e.target) && !toggle.contains(e.target)) {
        chromeWorldbookList.classList.remove('active');
        toggle.classList.remove('active');
      }
    });
    
    chromeWorldbookList.addEventListener('change', () => {
      updateWorldbookToggleText();
    });
  }
}

function updateWorldbookToggleText() {
  const toggle = document.getElementById('chrome-wb-toggle');
  if (!toggle || !chromeWorldbookList) return;
  
  const checkedCount = chromeWorldbookList.querySelectorAll('input[type="checkbox"]:checked').length;
  const totalCount = chromeWorldbookList.querySelectorAll('input[type="checkbox"]').length;
  
  if (totalCount === 0) {
    toggle.innerHTML = '尚無世界書 <i class="fas fa-chevron-down"></i>';
  } else {
    toggle.innerHTML = `已選擇 ${checkedCount} / ${totalCount} 個世界書 <i class="fas fa-chevron-down"></i>`;
  }
}

function loadCharProfiles() {
  const raw = localStorage.getItem('sx_characters') || '[]';
  try {
    const list = JSON.parse(raw) || [];
    charProfiles = Array.isArray(list) ? list : [];
  } catch {
    charProfiles = [];
  }
  if (charSelect) {
    charSelect.innerHTML = charProfiles.map((char, index) => `
      <option value="${index}">${char.name || `角色 ${index + 1}`}</option>
    `).join('');
  }
  if (charProfiles.length === 0 && charSelect) {
    charSelect.innerHTML = '<option value="">尚未建立角色</option>';
  }
}

async function generateHistoryForChar(index) {
  const char = charProfiles[Number(index)];
  if (!char || !historyList) {
    if (historyList) historyList.innerHTML = '<div class="status">尚無角色資料</div>';
    return;
  }
  const charName = char.name || '角色';
  const charPersonality = char.personality || '';
  const charBackground = char.background || '';
  
  const panelTitle = document.querySelector('.history-panel .panel-title');
  if (panelTitle) {
    panelTitle.textContent = `${charName} 的搜尋紀錄`;
  }
  
  historyList.innerHTML = '<div class="status">正在生成搜尋紀錄...</div>';
  
  const recentChatHistory = getRecentChatHistory(10);
  
  const apis = JSON.parse(localStorage.getItem('api_configs') || '[]');
  const activeIndex = Number(localStorage.getItem('sx_active_api') || 0);
  const config = apis[activeIndex] || apis[0];
  
  if (!config || !config.url) {
    generateFallbackHistory(char, charName, charPersonality, charBackground);
    return;
  }
  
  const url = config.url.endsWith('/chat/completions') ? config.url : config.url.replace(/\/$/, '') + '/chat/completions';
  
  const chatContext = recentChatHistory.length > 0 
    ? recentChatHistory.map(m => `${m.role === 'user' ? '用戶' : charName}: ${m.content}`).join('\n')
    : '尚無聊天紀錄';
  
  const isAdult = isIncognito();
  const adultLevel = getAdultLevel(char);
  
  const systemPrompt = `你是一個模擬瀏覽器搜尋紀錄生成器。請根據角色的個性、背景和最近的聊天內容，生成符合該角色會感興趣並搜尋的內容。

角色名稱：${charName}
角色個性：${charPersonality}
角色背景：${charBackground}
${isAdult ? `模式：無痕模式（成人向，等級：${adultLevel}）` : '模式：一般模式'}

重要規則：
1. 搜尋內容必須符合角色的興趣和個性
2. 不要讓角色搜尋自己的名字
3. 搜尋內容應該是角色會感興趣的事物，而不是角色本身
4. 根據聊天內容推斷角色最近關注的話題

請用繁體中文輸出 JSON 陣列格式，每個項目包含：
- query: 搜尋關鍵字（簡短，2-6字）
- title: 搜尋標題（自然語句）
- summary: 簡短摘要（為什麼角色會搜尋這個，以角色視角描述）
- time: 時間（如「2 小時前」）

範例輸出：
[{"query":"古代文明研究","title":"古代文明研究資料","summary":"對歷史很感興趣，想了解更多古代文明的知識...","time":"2 小時前"}]

請生成 5-8 個搜尋紀錄，直接輸出 JSON 陣列，不要其他說明。`;

  const userPrompt = `最近的聊天內容：
${chatContext}

請根據以上聊天內容和角色個性，生成符合該角色會搜尋的瀏覽紀錄。`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': config.key ? `Bearer ${config.key}` : undefined
      },
      body: JSON.stringify({ 
        model: config.model || 'gpt-3.5-turbo', 
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ], 
        temperature: 0.8 
      })
    });
    
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '';
    
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      historyEntries = parsed.map((item, i) => ({
        id: `history_${Date.now()}_${i}`,
        title: item.title || `${item.query} 是什麼？`,
        query: item.query,
        time: item.time || `${i + 1} 小時前`,
        summary: item.summary || `搜尋了「${item.query}」相關資訊。`,
        incognito: isIncognito(),
        adultLevel,
        charName,
        perspective: `以${charName}的視角`
      }));
      renderHistoryList();
      pushHistoryToMemory(historyEntries, char);
    } else {
      generateFallbackHistory(char, charName, charPersonality, charBackground);
    }
  } catch (err) {
    console.error('生成搜尋紀錄失敗:', err);
    generateFallbackHistory(char, charName, charPersonality, charBackground);
  }
}

function getRecentChatHistory(limit = 10) {
  try {
    const raw = localStorage.getItem('sx_chat_history');
    if (!raw) return [];
    const history = JSON.parse(raw);
    if (!Array.isArray(history)) return [];
    return history.slice(-limit);
  } catch {
    return [];
  }
}

function generateFallbackHistory(char, charName, charPersonality, charBackground) {
  const adultLevel = getAdultLevel(char);
  const isAdult = isIncognito();
  
  const personaText = `${charPersonality} ${charBackground}`;
  const keywords = personaText
    .replace(/[，。、！？：「」『』（）【】\n\r]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 2 && word.length <= 6)
    .filter(word => !['喜歡', '興趣', '愛好', '喜愛', '擅長', '喜歡的', '興趣是'].includes(word))
    .slice(0, 10);
  
  const interests = [];
  
  if (keywords.length > 0) {
    keywords.forEach(keyword => {
      interests.push(keyword);
    });
  }
  
  if (interests.length < 5) {
    const commonInterests = ['研究', '學習', '閱讀', '探索', '發現', '了解', '分析'];
    commonInterests.forEach(interest => {
      if (interests.length < 8 && !interests.includes(interest)) {
        interests.push(interest);
      }
    });
  }
  
  historyEntries = interests.slice(0, 8).map((topic, i) => {
    const perspective = `以${charName}的視角`;
    const queries = [
      `${topic} 相關資訊`,
      `${topic} 研究`,
      `${topic} 介紹`,
      `關於 ${topic}`,
      `${topic} 是什麼`,
      `${topic} 推薦`,
      `${topic} 教學`,
      `${topic} 應用`
    ];
    const query = queries[i % queries.length];
    
    return {
      id: `history_${Date.now()}_${i}`,
      title: `${topic} 相關搜尋`,
      query: query,
      time: `${i + 1} 小時前`,
      summary: `${perspective}對「${topic}」感興趣，搜尋了相關資訊。`,
      incognito: isAdult,
      adultLevel,
      charName,
      perspective
    };
  });
  
  renderHistoryList();
  pushHistoryToMemory(historyEntries, char);
}

function renderHistoryList() {
  if (!historyList) return;
  if (historyEntries.length === 0) {
    historyList.innerHTML = '<div class="status">尚無搜尋紀錄</div>';
    return;
  }
  
  const activeCharName = charProfiles[Number(charSelect?.value || 0)]?.name || '角色';
  
  historyList.innerHTML = historyEntries.map(entry => `
    <div class="history-item" data-id="${entry.id}">
      <div class="history-item-icon">
        <i class="fas fa-search"></i>
      </div>
      <div class="history-item-content">
        <div class="title">${entry.title}</div>
        <div class="meta">${entry.time}</div>
      </div>
      <div class="history-item-arrow">
        <i class="fas fa-chevron-right"></i>
      </div>
    </div>
  `).join('');

  historyList.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', () => {
      const entry = historyEntries.find(e => e.id === item.dataset.id);
      if (entry) openHistoryDetail(entry);
    });
  });
}

function openHistoryDetail(entry) {
  if (!detailSearchQuery || !detailTime || !detailSummary || !detailPageContent) return;
  
  detailSearchQuery.textContent = entry.query;
  detailTime.textContent = entry.time;
  detailSummary.textContent = entry.summary;
  detailPageContent.innerHTML = `
    <div class="page-loading">
      <div class="loading-spinner"></div>
      <span>正在載入頁面...</span>
    </div>
  `;
  
  switchView('history-detail');
  
  fetchDetailContent(entry);
}

async function fetchDetailContent(entry) {
  if (!detailPageContent) return;
  
  const apis = JSON.parse(localStorage.getItem('api_configs') || '[]');
  const activeIndex = Number(localStorage.getItem('sx_active_api') || 0);
  const config = apis[activeIndex] || apis[0];
  if (!config || !config.url) {
    detailPageContent.innerHTML = '<div class="page-error">未偵測到 API 配置，請先在控制中心設定。</div>';
    return;
  }
  const url = config.url.endsWith('/chat/completions') ? config.url : config.url.replace(/\/$/, '') + '/chat/completions';
  const isAdult = entry?.incognito;
  const adultLevel = entry?.adultLevel || 'suggestive';
  const charName = entry?.charName || '角色';
  
  const systemPrompt = isAdult
    ? `你正在扮演${charName}，請以${charName}的視角和口吻來描述。你是一個模擬成人內容頁面生成器，請用繁體中文輸出條理分明的內容，模擬真實網頁的樣式。`
    : `你正在扮演${charName}，請以${charName}的視角和口吻來描述。你是一個模擬網頁內容生成器，請用繁體中文輸出條理分明的內容，模擬真實網頁的樣式。`;
  
  const userPrompt = isAdult
    ? `以「${entry.query}」為主題，生成一段模擬網頁內容。請模擬真實搜尋結果頁面，包含：
1. 頁面標題
2. 簡短描述
3. 3-5 個相關連結或段落

${adultLevel === 'explicit' ? '可使用露骨描述。' : '可以帶情慾氛圍但避免過度露骨。'}`
    : `以「${entry.query}」為主題，生成一段模擬網頁內容。請模擬真實搜尋結果頁面，包含：
1. 頁面標題
2. 簡短描述  
3. 3-5 個相關連結或段落`;

  const payload = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': config.key ? `Bearer ${config.key}` : undefined
      },
      body: JSON.stringify({ model: config.model || 'gpt-3.5-turbo', messages: payload, temperature: 0.7 })
    });
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '生成內容失敗。';
    
    detailPageContent.innerHTML = `
      <div class="page-result">
        <div class="page-result-content">${content.replace(/\n/g, '<br>')}</div>
      </div>
    `;
  } catch (err) {
    detailPageContent.innerHTML = `<div class="page-error">連線失敗：${err.message}</div>`;
  }
}

bindEvents();
switchView('home');
statusText.textContent = '一般模式 • 已連線';
storeQuickDefaults();
applyQuickTiles(app?.dataset.mode || 'normal');
const hero = document.getElementById('incognito-hero');
if (hero) hero.hidden = app?.dataset.mode !== 'incognito';
loadCharProfiles();
loadUserProfiles();
loadWorldbookMounts();
loadBookmarks();
renderBookmarks();
if (charProfiles.length > 0 && charSelect) {
  charSelect.value = '0';
  generateHistoryForChar('0');
}
console.log('Loaded app: chrome');
const pushHistoryToMemory = (entries, char) => {
  if (!entries || entries.length === 0) return;
  const name = char?.name || '角色';
  const topics = entries.map(item => item.query).join('、');
  const content = `Chrome 搜尋紀錄：以${name}的視角瀏覽，包含 ${topics}。`;
  window.parent?.postMessage({
    type: 'MEMORY_REQUEST_SUMMARY',
    payload: {
      source: 'chrome-history',
      messages: [{ role: 'user', content }],
      extra: { 
        topics: entries.map(item => item.query), 
        incognito: isIncognito(),
        charName: name,
        perspective: `以${name}的視角`
      }
    }
  }, '*');
};
