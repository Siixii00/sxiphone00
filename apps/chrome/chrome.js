const app = document.querySelector('.chrome-mobile');
const viewToggle = document.getElementById('view-toggle');
const modeBtn = document.getElementById('mode-btn');
const panels = document.querySelectorAll('.panel');
const statusText = document.getElementById('status-text');
const homeBack = document.getElementById('home-back');
const historyList = document.getElementById('history-list');
const historyRefresh = document.getElementById('history-refresh');
const charSelect = document.getElementById('char-select');
const historyDetailBack = document.getElementById('history-detail-back');
const detailSearchQuery = document.getElementById('detail-search-query');
const detailTime = document.getElementById('detail-time');
const detailSummary = document.getElementById('detail-summary');
const detailPageContent = document.getElementById('detail-page-content');
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

const normalQuickGrid = document.getElementById('normal-quick-grid');
const incognitoQuickGrid = document.getElementById('incognito-quick-grid');

let charProfiles = [];
let historyEntries = [];
let chromeUserProfiles = [];
let chromeWorldbookMounts = [];
let bookmarks = [];

const CHROME_BOOKMARKS_KEY = 'sx_chrome_bookmarks';
const CHROME_HISTORY_KEY = 'sx_chrome_history';

const INCOGNITO_SITES = [
  { id: 'nhentai', label: 'nhentai', icon: 'NH', query: 'nhentai 同人誌 漫畫', title: 'nhentai 同人誌' },
  { id: 'av.com', label: 'av.com', icon: 'AV', query: 'av.com 成人影片', title: 'av.com 影片' },
  { id: 'dreams', label: 'dreams', icon: 'DR', query: 'dreams 夢境 幻想', title: 'dreams 幻想世界' }
];

const USER_INTEREST_SITES = [
  { id: 'user-interest-0', label: '為你推薦', icon: '推', type: 'recommend' },
  { id: 'user-interest-1', label: '熱門內容', icon: '熱', type: 'trending' },
  { id: 'user-interest-2', label: '新鮮事', icon: '新', type: 'fresh' },
  { id: 'user-interest-3', label: '趣味發現', icon: '趣', type: 'fun' }
];

const saveChromeData = () => {
  try {
    localStorage.setItem('sx_chrome_user_profile', JSON.stringify(chromeUserProfiles));
    localStorage.setItem('sx_chrome_worldbooks', JSON.stringify(chromeWorldbookMounts));
    localStorage.setItem(CHROME_BOOKMARKS_KEY, JSON.stringify(bookmarks));
    localStorage.setItem(CHROME_HISTORY_KEY, JSON.stringify(historyEntries));
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

const loadHistoryEntries = () => {
  try {
    const raw = localStorage.getItem(CHROME_HISTORY_KEY);
    historyEntries = raw ? JSON.parse(raw) : [];
  } catch {
    historyEntries = [];
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

const ADULT_EXPLICIT_KEYWORDS = ['成年', '中年', '大叔', '姐姐', '人妻', '成熟', '情慾', '成人', '18+', 'AV', '情色', '尺度', '慾望', '放縱', '激情'];

const isIncognito = () => app?.dataset.mode === 'incognito';

const getAdultLevel = (char) => {
  if (!isIncognito()) return 'none';
  const persona = `${char?.name || ''} ${char?.personality || ''} ${char?.background || ''}`.toLowerCase();
  const explicit = ADULT_EXPLICIT_KEYWORDS.some(key => persona.includes(key.toLowerCase()));
  return explicit ? 'explicit' : 'suggestive';
};

function getUserConfig() {
  const userName = localStorage.getItem('sx_user_name') || 'User';
  const userPersonality = localStorage.getItem('sx_user_personality') || '';
  const userBackground = localStorage.getItem('sx_user_background') || '';
  
  return {
    name: userName,
    personality: userPersonality,
    background: userBackground
  };
}

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
  
  if (normalQuickGrid) normalQuickGrid.hidden = next === 'incognito';
  if (incognitoQuickGrid) incognitoQuickGrid.hidden = next !== 'incognito';
  
  bindQuickTileEvents();
}

function bindQuickTileEvents() {
  if (!isIncognito()) {
    const normalTiles = normalQuickGrid?.querySelectorAll('.quick-tile');
    normalTiles?.forEach((tile, index) => {
      tile.onclick = () => {
        const site = USER_INTEREST_SITES[index];
        if (site) {
          openUserInterestSite(site);
        }
      };
    });
  } else {
    const incognitoTiles = incognitoQuickGrid?.querySelectorAll('.quick-tile');
    incognitoTiles?.forEach((tile, index) => {
      tile.onclick = () => {
        const site = INCOGNITO_SITES[index];
        if (site) {
          openIncognitoSite(site);
        }
      };
    });
  }
}

function getApiConfig() {
  const apis = JSON.parse(localStorage.getItem('api_configs') || '[]');
  const activeIndex = Number(localStorage.getItem('sx_active_api') || 0);
  return apis[activeIndex] || apis[0];
}

async function openUserInterestSite(site) {
  if (!site) return;
  
  const config = getApiConfig();
  if (!config || !config.url) {
    alert('請先設定 API 才能生成內容');
    return;
  }
  
  const userConfig = getUserConfig();
  const userName = userConfig.name || 'User';
  const userPersonality = userConfig.personality || '';
  const userBackground = userConfig.background || '';
  
  switchView('history');
  historyList.innerHTML = '<div class="status">正在載入內容...</div>';
  
  const url = config.url.endsWith('/chat/completions') ? config.url : config.url.replace(/\/$/, '') + '/chat/completions';
  
  const typePrompts = {
    recommend: `根據用戶的興趣和個性，推薦他們可能感興趣的內容`,
    trending: `生成目前熱門的話題和趨勢內容`,
    fresh: `生成新穎、有趣、剛出現的新鮮事`,
    fun: `生成趣味、娛樂性的發現和內容`
  };
  
  const systemPrompt = `你是一個模擬瀏覽器內容生成器。請根據用戶的個性、興趣和背景，生成符合該用戶會感興趣的內容。

用戶名稱：${userName}
用戶個性：${userPersonality}
用戶背景：${userBackground}

內容類型：${typePrompts[site.type] || typePrompts.recommend}

重要規則：
1. 內容必須符合用戶的興趣和個性
2. 內容應該多樣化，包含不同領域
3. 每個項目都要有標題和簡短描述
4. 可以包含新聞、娛樂、知識、生活等不同類型

請用繁體中文輸出 JSON 陣列格式，每個項目包含：
- title: 內容標題
- description: 簡短描述（為什麼用戶會感興趣）
- category: 分類（如：新聞、娛樂、知識、生活等）

請生成 4-6 個內容項目，直接輸出 JSON 陣列，不要其他說明。`;

  const userPrompt = `請為用戶「${userName}」生成${site.label}內容。`;

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
        temperature: 0.9 
      })
    });
    
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '生成內容失敗';
    
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    let items = [];
    
    if (jsonMatch) {
      try {
        items = JSON.parse(jsonMatch[0]);
      } catch (e) {
        items = [];
      }
    }
    
    if (items.length > 0) {
      historyList.innerHTML = `
        <div class="incognito-content-page">
          <div class="incognito-site-header">
            <div class="site-icon">${site.icon}</div>
            <div class="site-title">${site.label}</div>
          </div>
          <div class="interest-items">
            ${items.map(item => `
              <div class="interest-item">
                <div class="interest-category">${item.category || '推薦'}</div>
                <div class="interest-title">${item.title}</div>
                <div class="interest-desc">${item.description}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else {
      historyList.innerHTML = `
        <div class="incognito-content-page">
          <div class="incognito-site-header">
            <div class="site-icon">${site.icon}</div>
            <div class="site-title">${site.label}</div>
          </div>
          <div class="incognito-site-content">
            ${content.replace(/\n/g, '<br>')}
          </div>
        </div>
      `;
    }
    
  } catch (err) {
    historyList.innerHTML = `<div class="status error">載入失敗：${err.message}</div>`;
  }
}

async function openIncognitoSite(site) {
  if (!site) return;
  
  const config = getApiConfig();
  if (!config || !config.url) {
    alert('請先設定 API 才能生成內容');
    return;
  }
  
  const char = charProfiles[Number(charSelect?.value || 0)] || {};
  const charName = char.name || '角色';
  const charPersonality = char.personality || '';
  
  switchView('history');
  historyList.innerHTML = '<div class="status">正在載入內容...</div>';
  
  const url = config.url.endsWith('/chat/completions') ? config.url : config.url.replace(/\/$/, '') + '/chat/completions';
  const adultLevel = getAdultLevel(char);
  
  const systemPrompt = `你正在扮演${charName}，請以${charName}的視角和口吻來描述。
你是一個模擬成人內容頁面生成器。角色個性：${charPersonality}

請用繁體中文輸出網頁內容，模擬真實網站的樣式，包含：
1. 網站標題
2. 分類或標籤
3. 3-5 個內容項目（標題和簡短描述）
4. 每個項目都要有以${charName}視角的評論或感受

可以帶有情慾氛圍，根據角色性格決定程度。${adultLevel === 'explicit' ? '可以使用較露骨的描述。' : '保持情趣但不過度露骨。'}`;

  const userPrompt = `請生成「${site.label}」網站的模擬內容。
搜尋關鍵字：${site.query}

請模擬一個成人向網站的首頁內容，以${charName}的視角呈現。${charName}正在瀏覽這個網站，請展現${charName}的反應和感受。`;

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
        temperature: 0.9 
      })
    });
    
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '生成內容失敗';
    
    historyList.innerHTML = `
      <div class="incognito-content-page">
        <div class="incognito-site-header">
          <div class="site-icon">${site.icon}</div>
          <div class="site-title">${site.label}</div>
        </div>
        <div class="incognito-site-content">
          ${content.replace(/\n/g, '<br>')}
        </div>
      </div>
    `;
    
  } catch (err) {
    historyList.innerHTML = `<div class="status error">載入失敗：${err.message}</div>`;
  }
}

function bindEvents() {
  viewToggle?.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  modeBtn?.addEventListener('click', toggleMode);

  homeBack?.addEventListener('click', () => {
    window.parent?.postMessage({ type: 'closeApp' }, '*');
  });

  historyRefresh?.addEventListener('click', () => {
    if (isIncognito()) {
      const active = charSelect?.value || '';
      if (active) generateHistoryForChar(active);
    }
  });

  charSelect?.addEventListener('change', () => {
    if (isIncognito()) {
      generateHistoryForChar(charSelect.value);
    }
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
    if (isIncognito()) {
      const active = charSelect?.value || '';
      if (active) generateHistoryForChar(active);
    }
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
    saveChromeData();
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
  
  if (chromeWorldbookList) {
    const stored = JSON.parse(localStorage.getItem('sx_chrome_worldbooks') || '[]');
    
    if (chromeWorldbookMounts.length === 0) {
      chromeWorldbookList.innerHTML = '<div class="chrome-wb-empty">尚無可掛載的世界書</div>';
      return;
    }
    
    chromeWorldbookList.innerHTML = chromeWorldbookMounts.map((mount, index) => {
      const name = mount?.name || `世界書 ${index + 1}`;
      const checked = stored.includes(name) ? 'checked' : '';
      return `<div class="chrome-wb-item"><input type="checkbox" value="${name}" ${checked}><span>${name}</span></div>`;
    }).join('');
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
    panelTitle.textContent = `${charName} 的瀏覽紀錄`;
  }
  
  historyList.innerHTML = '<div class="status">正在生成瀏覽紀錄...</div>';
  
  const config = getApiConfig();
  if (!config || !config.url) {
    generateFallbackHistory(char, charName, charPersonality, charBackground);
    return;
  }
  
  const url = config.url.endsWith('/chat/completions') ? config.url : config.url.replace(/\/$/, '') + '/chat/completions';
  const adultLevel = getAdultLevel(char);
  
  const systemPrompt = `你是一個模擬瀏覽器搜尋紀錄生成器。請根據角色的個性、背景，生成符合該角色在無痕模式下會感興趣的成人向內容。

角色名稱：${charName}
角色個性：${charPersonality}
角色背景：${charBackground}
模式：無痕模式（成人向，等級：${adultLevel}）

重要規則：
1. 搜尋內容必須符合角色的興趣和個性
2. 內容應該是角色在私密模式下會瀏覽的成人向內容
3. 可以從三個網站類型來源：nhentai（同人誌）、av.com（影片）、dreams（幻想）
4. 根據角色性格決定內容的露骨程度

請用繁體中文輸出 JSON 陣列格式，每個項目包含：
- query: 搜尋關鍵字
- title: 標題
- summary: 簡短描述（為什麼角色會搜尋這個，以角色視角描述）
- site: 網站來源（nhentai / av.com / dreams）
- time: 時間

請生成 5-8 個搜尋紀錄，直接輸出 JSON 陣列。`;

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
          { role: 'user', content: `請為${charName}生成無痕模式下的瀏覽紀錄。` }
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
        title: item.title || `${item.query} 相關`,
        query: item.query,
        time: item.time || `${i + 1} 小時前`,
        summary: item.summary || `瀏覽了「${item.query}」`,
        site: item.site || 'nhentai',
        incognito: true,
        adultLevel,
        charName
      }));
      saveChromeData();
      renderHistoryList();
    } else {
      generateFallbackHistory(char, charName, charPersonality, charBackground);
    }
  } catch (err) {
    console.error('生成搜尋紀錄失敗:', err);
    generateFallbackHistory(char, charName, charPersonality, charBackground);
  }
}

function generateFallbackHistory(char, charName, charPersonality, charBackground) {
  const adultLevel = getAdultLevel(char);
  
  const sites = ['nhentai', 'av.com', 'dreams'];
  const topics = ['浪漫', '幻想', '故事', '藝術', '角色', '創作'];
  
  historyEntries = topics.slice(0, 6).map((topic, i) => {
    const site = sites[i % 3];
    return {
      id: `history_${Date.now()}_${i}`,
      title: `${topic} 相關內容`,
      query: `${topic} ${site}`,
      time: `${i + 1} 小時前`,
      summary: `${charName}在${site}瀏覽了${topic}相關內容`,
      site,
      incognito: true,
      adultLevel,
      charName
    };
  });
  
  saveChromeData();
  renderHistoryList();
}

function renderHistoryList() {
  if (!historyList) return;
  if (historyEntries.length === 0) {
    historyList.innerHTML = '<div class="status">尚無搜尋紀錄</div>';
    return;
  }
  
  historyList.innerHTML = historyEntries.map(entry => `
    <div class="history-item" data-id="${entry.id}">
      <div class="history-item-icon">
        <i class="fas fa-search"></i>
      </div>
      <div class="history-item-content">
        <div class="title">${entry.title}</div>
        <div class="meta">${entry.site ? `[${entry.site}] ` : ''}${entry.time}</div>
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
  
  const config = getApiConfig();
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

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': config.key ? `Bearer ${config.key}` : undefined
      },
      body: JSON.stringify({ model: config.model || 'gpt-3.5-turbo', messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], temperature: 0.7 })
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
loadCharProfiles();
loadUserProfiles();
loadWorldbookMounts();
loadBookmarks();
loadHistoryEntries();
renderBookmarks();
bindQuickTileEvents();

if (historyEntries.length > 0) {
  renderHistoryList();
}

console.log('Loaded app: chrome');