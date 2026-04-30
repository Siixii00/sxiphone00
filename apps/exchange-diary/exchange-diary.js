(function() {
  const ENTRIES_KEY = 'sx_exchange_diary_entries';
  const BOOKS_KEY = 'sx_exchange_diary_books';
  const ACTIVE_BOOK_KEY = 'sx_exchange_diary_active_book';
  const NPC_STORAGE_KEY = 'sx_npcs';
  const CHAR_STORAGE_KEY = 'sx_characters';

  const MOOD_OPTIONS = [
    { id: 'sunny', label: '晴朗', icon: '🌤️', note: '亮亮的充電日' },
    { id: 'rainy', label: '雨露', icon: '🌧️', note: '適合被擁抱' },
    { id: 'starry', label: '星夜', icon: '🌙', note: '悄悄話模式' },
    { id: 'cozy', label: '暖被', icon: '🫖', note: '療癒系小憩' },
    { id: 'wild', label: '冒險', icon: '🧭', note: '有點小激動' }
  ];

  const SEAL_OPTIONS = [
    { id: 'secret', label: '祕密', icon: '🔒' },
    { id: 'gratitude', label: '感謝', icon: '💐' },
    { id: 'courage', label: '勇氣', icon: '🔥' },
    { id: 'dream', label: '夢話', icon: '🌙' },
    { id: 'routine', label: '碎念', icon: '📎' }
  ];

  const PROMPTS = [
    '今天有什麼只想讓 NPC 知道的祕密？',
    '描述一個你們共同擁有的默契或小暗號。',
    '把最近一次笑到流眼淚的瞬間畫成文字照片。',
    '寫下你最想收到 NPC 哪一句安慰。',
    '如果把今天的心情寫成歌詞，第一句會是什麼？',
    '說說你最近想完成的小任務，請 NPC 監督。',
    '把一則夢境偷偷地交給 NPC 保管。',
    '寫封信感謝 NPC 曾經陪伴的一刻。',
    '把一個還沒告訴別人的靈感寫進來。',
    '描述你們下一次想一起完成的冒險。'
  ];

  const state = {
    books: [],
    activeBook: null,
    npcs: [],
    activeNpc: null,
    user: { name: '我', avatar: '', personality: '', background: '' },
    selectedMood: 'sunny',
    selectedSeals: new Set(),
    promptIndex: 0,
    isNpcWriting: false,
    replyTimer: null,
    currentPageDate: new Date().toDateString()
  };

  const saveDiaryData = () => {
    try {
      localStorage.setItem(BOOKS_KEY, JSON.stringify(state.books));
      if (state.activeBook) {
        localStorage.setItem(ACTIVE_BOOK_KEY, state.activeBook.id);
      }
      console.log("日記數據已保存至 localStorage");
    } catch (e) {
      console.error("保存日記數據失敗:", e);
    }
  };

  const saveToPersistentStorage = async () => {
    saveDiaryData();
    if (typeof localforage !== 'undefined') {
      try {
        const existingData = await localforage.getItem('sx_app_persisted_data') || {};
        await localforage.setItem('sx_app_persisted_data', {
          ...existingData,
          sx_exchange_diary_books: state.books,
          sx_exchange_diary_active_book: state.activeBook?.id || null
        });
        console.log("日記數據已保存至 IndexedDB");
      } catch (e) {
        console.error("IndexedDB 保存失敗:", e);
      }
    }
  };

  window.addEventListener('pagehide', () => {
    saveDiaryData();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      saveDiaryData();
    }
  });

  window.addEventListener('message', (event) => {
    if (event.data?.type === 'APP_WILL_CLOSE') {
      saveDiaryData();
    }
  });

  const ui = {};

  function init() {
    cacheDom();
    bindEvents();
    state.user = loadUserProfile();
    state.books = loadBooks();
    refreshNpcs();
    const storedBook = localStorage.getItem(ACTIVE_BOOK_KEY);
    setActiveBook(storedBook || state.books[0]?.id || null);
    showShelf();
    state.promptIndex = Math.floor(Math.random() * PROMPTS.length);
    renderMoodPicker();
    renderSealBoard();
    updatePrompt();
    updateDateHeader();
    renderScene();
    window.addEventListener('storage', handleStorageSync);
    setInterval(updateDateHeader, 1000 * 60);
  }

  function cacheDom() {
    ui.shelfView = document.getElementById('shelfView');
    ui.diaryView = document.getElementById('diaryView');
    ui.diaryShelf = document.getElementById('diaryShelf');
    ui.newDiaryBtn = document.getElementById('newDiaryBtn');
    ui.backShelfBtn = document.getElementById('backShelfBtn');
    ui.diaryTitle = document.getElementById('diaryTitle');
    ui.renameDiaryBtn = document.getElementById('renameDiaryBtn');
    ui.entryList = document.getElementById('entryList');
    ui.entryForm = document.getElementById('entryForm');
    ui.entryContent = document.getElementById('entryContent');
    ui.npcStatus = document.getElementById('npcStatus');
    ui.npcEmptyHint = document.getElementById('npcEmptyHint');
    ui.moodPicker = document.getElementById('moodPicker');
    ui.sealBoard = document.getElementById('sealBoard');
    ui.activeNpcCard = document.getElementById('activeNpcCard');
    ui.npcList = document.getElementById('npcList');
    ui.npcManageList = document.getElementById('npcManageList');
    ui.todayDate = document.getElementById('todayDate');
    ui.entrySummary = document.getElementById('entrySummary');
    ui.promptText = document.getElementById('promptText');
    ui.submitBtn = ui.entryForm?.querySelector('button[type="submit"]');
    ui.deleteDiaryBtn = document.getElementById('deleteDiaryBtn');
    ui.archivePageBtn = document.getElementById('archivePageBtn');
    ui.pageIndicator = document.getElementById('pageIndicator');
  }

  function bindEvents() {
    document.getElementById('closeDiaryBtn')?.addEventListener('click', () => {
      window.parent?.postMessage({ type: 'closeApp' }, '*');
    });

    ui.newDiaryBtn?.addEventListener('click', () => {
      createDiary();
    });

    ui.backShelfBtn?.addEventListener('click', () => {
      showShelf();
    });

    ui.renameDiaryBtn?.addEventListener('click', () => {
      if (!state.activeBook) return;
      const current = state.activeBook.title || '';
      const next = window.prompt('輸入新的日記書名', current);
      if (next === null) return;
      const trimmed = next.trim();
      if (!trimmed) return;
      state.activeBook.title = trimmed;
      saveBooks();
      renderScene();
      renderShelf();
    });

    document.getElementById('npcManageBtn')?.addEventListener('click', () => {
      window.parent?.postMessage({ type: 'openApp', appId: 'settings?anchor=npc' }, '*');
    });

    document.getElementById('promptShuffleBtn')?.addEventListener('click', () => {
      state.promptIndex = (state.promptIndex + 1) % PROMPTS.length;
      updatePrompt(true);
    });

    document.getElementById('syncSettingsBtn')?.addEventListener('click', handleSyncClick);

    ui.entryForm?.addEventListener('submit', handleEntrySubmit);

    ui.deleteDiaryBtn?.addEventListener('click', handleDeleteDiary);
    
    ui.archivePageBtn?.addEventListener('click', handleArchivePage);
  }

  function handleSyncClick(event) {
    const btn = event.currentTarget;
    btn.disabled = true;
    const original = btn.textContent;
    btn.textContent = '同步中…';
    setTimeout(() => {
      refreshNpcs();
      btn.textContent = '已刷新';
      setTimeout(() => {
        btn.textContent = original;
        btn.disabled = false;
      }, 1200);
    }, 200);
  }

  function handleStorageSync(event) {
    if ([NPC_STORAGE_KEY, CHAR_STORAGE_KEY].includes(event.key)) {
      refreshNpcs();
    }
    if (['sx_user_name', 'sx_user_avatar', 'sx_user_personality', 'sx_user_background'].includes(event.key)) {
      state.user = loadUserProfile();
      renderScene();
    }
    if (event.key === BOOKS_KEY) {
      state.books = loadBooks();
      setActiveBook(state.activeBook?.id || state.books[0]?.id || null);
      renderShelf();
      renderScene();
    }
  }

  function loadUserProfile() {
    return {
      name: localStorage.getItem('sx_user_name') || '我',
      avatar: localStorage.getItem('sx_user_avatar') || '',
      personality: localStorage.getItem('sx_user_personality') || '',
      background: localStorage.getItem('sx_user_background') || ''
    };
  }

  function loadEntries() {
    try {
      const raw = JSON.parse(localStorage.getItem(ENTRIES_KEY) || '[]');
      if (!Array.isArray(raw)) return [];
      return raw.map(normalizeEntry).sort((a, b) => new Date(a.date) - new Date(b.date));
    } catch (err) {
      console.warn('無法解析交換日記資料', err);
      return [];
    }
  }

  function normalizeEntry(entry) {
    const stamp = entry?.date ? new Date(entry.date).toISOString() : new Date().toISOString();
    return {
      id: entry?.id || `entry-${Math.random().toString(16).slice(2)}`,
      npcId: normalizePartnerId(entry?.npcId || entry?.partnerId || null),
      author: entry?.author === 'npc' ? 'npc' : 'user',
      authorName: entry?.authorName || '',
      avatar: entry?.avatar || '',
      mood: entry?.mood || 'sunny',
      tags: Array.isArray(entry?.tags) ? entry.tags : [],
      content: entry?.content || '',
      date: stamp
    };
  }

  function loadBooks() {
    const raw = localStorage.getItem(BOOKS_KEY);
    if (!raw) {
      return migrateLegacyEntries();
    }
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map(normalizeBook);
    } catch (err) {
      console.warn('無法解析交換日記書本資料', err);
      return [];
    }
  }

  function normalizeBook(book) {
    const entries = Array.isArray(book?.entries) ? book.entries.map(normalizeEntry) : [];
    const npcIds = Array.isArray(book?.npcIds) ? book.npcIds : [];
    const upgradedIds = npcIds.map(normalizePartnerId).filter(Boolean);
    const activeId = normalizePartnerId(book?.activeNpcId || book?.npcId || '') || '';
    const archivedPages = Array.isArray(book?.archivedPages) ? book.archivedPages : [];
    return {
      id: book?.id || `book-${Math.random().toString(16).slice(2)}`,
      title: book?.title || '未命名日記',
      npcIds: upgradedIds,
      activeNpcId: activeId,
      entries: entries.sort((a, b) => new Date(a.date) - new Date(b.date)),
      archivedPages,
      currentPageDate: book?.currentPageDate || new Date().toDateString(),
      isArchived: book?.isArchived || false
    };
  }

  function normalizePartnerId(value) {
    if (!value) return '';
    if (typeof value === 'string' && (value.startsWith('npc:') || value.startsWith('char:'))) {
      return value;
    }
    return `npc:${value}`;
  }

  function migrateLegacyEntries() {
    const legacyEntries = loadEntries();
    const npcIds = Array.from(new Set(legacyEntries.map(entry => normalizePartnerId(entry.npcId)).filter(Boolean)));
    const book = {
      id: `book-${Date.now()}`,
      title: '紙間悄悄話',
      npcIds,
      activeNpcId: npcIds[0] || '',
      entries: legacyEntries
    };
    const books = [normalizeBook(book)];
    localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
    localStorage.setItem(ACTIVE_BOOK_KEY, book.id);
    return books;
  }

  function saveBooks() {
    localStorage.setItem(BOOKS_KEY, JSON.stringify(state.books));
    if (state.activeBook?.id) {
      localStorage.setItem(ACTIVE_BOOK_KEY, state.activeBook.id);
    }
  }

  function setActiveBook(bookId) {
    state.activeBook = state.books.find(book => book.id === bookId) || state.books[0] || null;
    if (!state.activeBook) return;
    const validIds = new Set(state.npcs.map(npc => npc.id));
    state.activeBook.npcIds = state.activeBook.npcIds.filter(id => validIds.has(id));
    if (state.activeBook.activeNpcId && state.activeBook.npcIds.includes(state.activeBook.activeNpcId)) {
      state.activeNpc = state.npcs.find(npc => npc.id === state.activeBook.activeNpcId) || null;
    } else {
      const firstId = state.activeBook.npcIds[0] || '';
      state.activeBook.activeNpcId = firstId;
      state.activeNpc = state.npcs.find(npc => npc.id === firstId) || null;
    }
    saveBooks();
    renderScene();
  }

  function showShelf() {
    ui.shelfView?.removeAttribute('hidden');
    ui.diaryView?.setAttribute('hidden', '');
    renderShelf();
  }

  function showDiary(bookId) {
    if (bookId) setActiveBook(bookId);
    ui.shelfView?.setAttribute('hidden', '');
    ui.diaryView?.removeAttribute('hidden');
    renderScene();
  }

  function renderShelf() {
    if (!ui.diaryShelf) return;
    if (!state.books.length) {
      ui.diaryShelf.innerHTML = '<div class="empty-state"><p>還沒有日記，先建立一本吧。</p></div>';
      return;
    }
    ui.diaryShelf.innerHTML = '';
    state.books.forEach((book) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'shelf-card';
      card.innerHTML = `
        <div class="spine-title">${book.title}</div>
        <div class="spine-meta">${book.entries.length} 頁</div>
        <div class="spine-dots">${book.npcIds.slice(0, 3).map(id => {
          const npc = state.npcs.find(n => n.id === id);
          const letter = (npc?.name || '夥').trim().slice(0, 1);
          return `<span>${letter}</span>`;
        }).join('')}</div>
      `;
      card.addEventListener('click', () => showDiary(book.id));
      ui.diaryShelf.appendChild(card);
    });
  }

  function createDiary() {
    const index = state.books.length + 1;
    const book = normalizeBook({
      id: `book-${Date.now()}`,
      title: `交換日記 ${index}`,
      npcIds: [],
      activeNpcId: '',
      entries: []
    });
    state.books.push(book);
    saveBooks();
    showDiary(book.id);
  }

  function refreshNpcs() {
    state.npcs = loadPartnerList();
    if (state.activeBook) {
      const validIds = new Set(state.npcs.map(npc => npc.id));
      state.activeBook.npcIds = state.activeBook.npcIds.filter(id => validIds.has(id));
      if (state.activeBook.activeNpcId && state.activeBook.npcIds.includes(state.activeBook.activeNpcId)) {
        state.activeNpc = state.npcs.find(npc => npc.id === state.activeBook.activeNpcId) || null;
      } else {
        const firstId = state.activeBook.npcIds[0] || '';
        state.activeBook.activeNpcId = firstId;
        state.activeNpc = state.npcs.find(npc => npc.id === firstId) || null;
      }
      saveBooks();
    }
    renderNpcManage();
    renderNpcPanel();
    renderTimeline();
    updateSummary();
    updateNpcHint();
  }

  function loadPartnerList() {
    const npcs = loadNpcList();
    const chars = loadCharList();
    return [...npcs, ...chars];
  }

  function loadCharList() {
    try {
      const raw = JSON.parse(localStorage.getItem(CHAR_STORAGE_KEY) || '[]');
      if (!Array.isArray(raw) || !raw.length) return [];
      return raw.map((char) => ({
        ...char,
        id: `char:${deriveCharId(char)}`,
        source: 'char',
        role: char?.role || '角色夥伴',
        notes: char?.notes || char?.personality || char?.background || '',
        personality: char?.personality || '',
        background: char?.background || ''
      }));
    } catch (err) {
      console.warn('無法解析角色資料', err);
      return [];
    }
  }

  function loadNpcList() {
    try {
      const raw = JSON.parse(localStorage.getItem(NPC_STORAGE_KEY) || '[]');
      if (!Array.isArray(raw) || !raw.length) return [];
      return raw.map((npc) => ({
        ...npc,
        id: `npc:${deriveNpcId(npc)}`,
        source: 'npc',
        personality: npc?.personality || '',
        background: npc?.background || ''
      }));
    } catch (err) {
      console.warn('無法解析 NPC 資料', err);
      return [];
    }
  }

  function deriveNpcId(npc = {}) {
    if (npc.id) return npc.id;
    if (npc.uuid) return npc.uuid;
    const seed = `${npc.name || ''}|${npc.avatar || ''}|${npc.role || ''}|${npc.notes || ''}`;
    let hash = 11;
    for (let i = 0; i < seed.length; i += 1) {
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }
    return `npc-${hash.toString(16)}`;
  }

  function deriveCharId(char = {}) {
    if (char.id) return char.id;
    const seed = `${char.name || ''}|${char.avatar || ''}|${char.personality || ''}|${char.background || ''}`;
    let hash = 17;
    for (let i = 0; i < seed.length; i += 1) {
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }
    return `char-${hash.toString(16)}`;
  }

  function renderScene() {
    if (ui.diaryTitle) {
      ui.diaryTitle.textContent = state.activeBook?.title || '交換日記';
    }
    renderNpcManage();
    renderNpcPanel();
    renderTimeline();
    updateSummary();
    updateNpcHint();
    setNpcStatus();
    checkPageTurn();
    updatePageIndicator();
  }

  function renderNpcManage() {
    if (!ui.npcManageList) return;
    if (!state.npcs.length) {
      ui.npcManageList.innerHTML = '<p class="npc-placeholder">目前沒有夥伴名單</p>';
      return;
    }
    const selected = new Set(state.activeBook?.npcIds || []);
    ui.npcManageList.innerHTML = '';
    state.npcs.forEach((npc) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `npc-pill${selected.has(npc.id) ? ' active' : ''}`;
      btn.appendChild(createAvatarNode(npc.avatar, npc.name));
      const label = document.createElement('span');
      label.textContent = npc.name || '夥伴';
      btn.appendChild(label);
      btn.addEventListener('click', () => {
        if (!state.activeBook) return;
        if (selected.has(npc.id)) {
          selected.delete(npc.id);
        } else {
          selected.add(npc.id);
        }
        state.activeBook.npcIds = Array.from(selected);
        if (!state.activeBook.npcIds.includes(state.activeBook.activeNpcId)) {
          state.activeBook.activeNpcId = state.activeBook.npcIds[0] || '';
        }
        state.activeNpc = state.npcs.find(item => item.id === state.activeBook.activeNpcId) || null;
        saveBooks();
        renderScene();
      });
      ui.npcManageList.appendChild(btn);
    });
  }

  function renderNpcPanel() {
    if (!ui.activeNpcCard || !ui.npcList) return;
    if (!state.activeNpc) {
      ui.activeNpcCard.innerHTML = '<p class="npc-placeholder">尚未選擇夥伴，建立一位願意與你交換日記的角色吧。</p>';
    } else {
      const { name, avatar } = state.activeNpc;
      ui.activeNpcCard.innerHTML = '';
      const avatarBox = document.createElement('div');
      avatarBox.className = 'npc-avatar';
      avatarBox.appendChild(createAvatarNode(avatar, name));

      const meta = document.createElement('div');
      meta.className = 'npc-meta';
      const title = document.createElement('h3');
      title.textContent = name || '未命名夥伴';
      meta.appendChild(title);

      ui.activeNpcCard.appendChild(avatarBox);
      ui.activeNpcCard.appendChild(meta);
    }

    const availableNpcs = state.activeBook ? state.npcs.filter(npc => state.activeBook.npcIds.includes(npc.id)) : [];
    if (!availableNpcs.length) {
      ui.npcList.innerHTML = '<p class="npc-placeholder">目前沒有夥伴名單</p>';
      return;
    }

    ui.npcList.innerHTML = '';
    availableNpcs.forEach((npc) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `npc-chip${state.activeNpc?.id === npc.id ? ' active' : ''}`;
      const chipAvatar = document.createElement('span');
      chipAvatar.className = 'chip-avatar';
      chipAvatar.appendChild(createAvatarNode(npc.avatar, npc.name));
      const chipLabel = document.createElement('span');
      chipLabel.textContent = npc.name || '夥伴';
      button.appendChild(chipAvatar);
      button.appendChild(chipLabel);
      button.addEventListener('click', () => {
        state.activeNpc = npc;
        if (state.activeBook) {
          state.activeBook.activeNpcId = npc.id;
          saveBooks();
        }
        renderScene();
      });
      ui.npcList.appendChild(button);
    });
  }

  function createAvatarNode(url, alt = 'avatar') {
    if (url) {
      const img = document.createElement('img');
      img.src = url;
      img.alt = alt || 'avatar';
      img.loading = 'lazy';
      return img;
    }
    const span = document.createElement('span');
    span.className = 'avatar-fallback';
    span.textContent = (alt || '?').trim().slice(0, 1) || '?';
    span.setAttribute('aria-hidden', 'true');
    return span;
  }

  function renderMoodPicker() {
    if (!ui.moodPicker) return;
    ui.moodPicker.innerHTML = '';
    MOOD_OPTIONS.forEach((option) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `mood-btn${state.selectedMood === option.id ? ' active' : ''}`;
      btn.dataset.mood = option.id;
      btn.innerHTML = `${option.icon} <strong>${option.label}</strong>`;
      btn.title = option.note;
      btn.addEventListener('click', () => {
        state.selectedMood = option.id;
        renderMoodPicker();
      });
      ui.moodPicker.appendChild(btn);
    });
  }

  function renderSealBoard() {
    if (!ui.sealBoard) return;
    ui.sealBoard.innerHTML = '';
    SEAL_OPTIONS.forEach((option) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `seal-btn${state.selectedSeals.has(option.id) ? ' active' : ''}`;
      btn.dataset.seal = option.id;
      btn.textContent = `${option.icon} ${option.label}`;
      btn.addEventListener('click', () => toggleSeal(option.id));
      ui.sealBoard.appendChild(btn);
    });
  }

  function toggleSeal(id) {
    if (state.selectedSeals.has(id)) state.selectedSeals.delete(id);
    else state.selectedSeals.add(id);
    renderSealBoard();
  }

  function renderTimeline() {
    if (!ui.entryList) return;
    ui.entryList.innerHTML = '';
    const targetNpcId = state.activeNpc?.id;
    const entries = targetNpcId && state.activeBook
      ? state.activeBook.entries.filter((entry) => entry.npcId === targetNpcId)
      : [];
    if (!entries.length) {
      ui.entryList.innerHTML = '<div class="empty-state"><p>目前還沒有任何頁面，寫下第一封信吧！</p></div>';
      return;
    }

    entries.forEach((entry) => {
      ui.entryList.appendChild(renderEntry(entry));
    });
    ui.entryList.scrollTop = ui.entryList.scrollHeight;
  }

  function renderEntry(entry) {
    const article = document.createElement('article');
    article.className = `diary-entry ${entry.author}`;

    const meta = document.createElement('div');
    meta.className = 'entry-meta';

    const avatar = document.createElement('div');
    avatar.className = 'entry-avatar';
    avatar.appendChild(createAvatarNode(entry.avatar, entry.authorName || ''));

    const info = document.createElement('div');
    info.className = 'entry-info';
    const nameEl = document.createElement('h4');
    nameEl.textContent = entry.authorName || (entry.author === 'npc' ? (state.activeNpc?.name || 'NPC') : state.user.name || '我');
    const dateEl = document.createElement('span');
    dateEl.textContent = formatDate(entry.date);
    info.appendChild(nameEl);
    info.appendChild(dateEl);

    const mood = document.createElement('div');
    mood.className = 'entry-mood';
    mood.textContent = getMoodIcon(entry.mood);

    meta.appendChild(avatar);
    meta.appendChild(info);
    meta.appendChild(mood);

    const content = document.createElement('div');
    content.className = 'entry-content';
    content.textContent = entry.content;

    article.appendChild(meta);
    article.appendChild(content);

    if (entry.tags?.length) {
      const tags = document.createElement('div');
      tags.className = 'entry-tags';
      entry.tags.forEach((tagId) => {
        const option = SEAL_OPTIONS.find((item) => item.id === tagId);
        const badge = document.createElement('span');
        badge.className = 'entry-tag';
        badge.textContent = option ? `${option.icon} ${option.label}` : tagId;
        tags.appendChild(badge);
      });
      article.appendChild(tags);
    }

    return article;
  }

  function handleEntrySubmit(event) {
    event.preventDefault();
    if (!state.activeBook || !state.activeNpc) {
      highlightNpcHint();
      return;
    }
    
    if (state.activeBook.isArchived) {
      alert('這本日記已歸檔，無法繼續編輯。');
      return;
    }
    
    const content = ui.entryContent?.value.trim();
    if (!content) {
      setNpcStatus('請寫下一點內容再寄出。');
      return;
    }
    const tags = Array.from(state.selectedSeals);
    const entry = {
      id: `entry-${Date.now()}`,
      npcId: state.activeNpc.id,
      author: 'user',
      authorName: state.user.name || '我',
      avatar: state.user.avatar || '',
      mood: state.selectedMood,
      tags,
      content,
      date: new Date().toISOString()
    };
    state.activeBook.entries.push(entry);
    state.activeBook.entries.sort((a, b) => new Date(a.date) - new Date(b.date));
    state.activeBook.currentPageDate = new Date().toDateString();
    saveBooks();
    ui.entryContent.value = '';
    state.selectedSeals.clear();
    renderSealBoard();
    renderTimeline();
    updateSummary();
    updatePageIndicator();
    setNpcStatus('頁面已寄出，NPC 正在拆信…');
    scheduleNpcReply(entry);
  }

  function scheduleNpcReply(latestEntry) {
    if (!state.activeNpc || !state.activeBook) return;
    state.isNpcWriting = true;
    setNpcStatus(`${state.activeNpc.name || 'NPC'} 正在回覆中……`);
    if (state.replyTimer) clearTimeout(state.replyTimer);
    state.replyTimer = setTimeout(async () => {
      try {
        const npcContent = await generateApiReply(latestEntry);
        const npcEntry = {
          id: `entry-npc-${Date.now()}`,
          npcId: state.activeNpc?.id,
          author: 'npc',
          authorName: state.activeNpc?.name || 'NPC',
          avatar: state.activeNpc?.avatar || '',
          mood: pickNpcMood(latestEntry?.mood),
          tags: latestEntry?.tags || [],
          content: npcContent,
          date: new Date().toISOString()
        };
        state.activeBook.entries.push(npcEntry);
        state.activeBook.entries.sort((a, b) => new Date(a.date) - new Date(b.date));
        saveBooks();
        renderTimeline();
        updateSummary();
        setNpcStatus('換你了，翻開新的頁面吧。');
      } catch (err) {
        console.error('NPC 回覆生成失敗:', err);
        const fallbackContent = generateNpcReply(latestEntry);
        const npcEntry = {
          id: `entry-npc-${Date.now()}`,
          npcId: state.activeNpc?.id,
          author: 'npc',
          authorName: state.activeNpc?.name || 'NPC',
          avatar: state.activeNpc?.avatar || '',
          mood: pickNpcMood(latestEntry?.mood),
          tags: latestEntry?.tags || [],
          content: fallbackContent,
          date: new Date().toISOString()
        };
        state.activeBook.entries.push(npcEntry);
        state.activeBook.entries.sort((a, b) => new Date(a.date) - new Date(b.date));
        saveBooks();
        renderTimeline();
        updateSummary();
        setNpcStatus('換你了，翻開新的頁面吧。');
      } finally {
        state.isNpcWriting = false;
      }
    }, 1000 + Math.random() * 1500);
  }

  async function generateApiReply(userEntry) {
    let apiUrl = '';
    let apiKey = '';
    let modelName = '';
    
    if (typeof window.SettingsReader !== 'undefined' && window.SettingsReader.getActiveApiWithFallback) {
      const api = window.SettingsReader.getActiveApiWithFallback();
      if (api) {
        apiUrl = api.url || '';
        apiKey = api.key || '';
        modelName = api.model || '';
        console.log('[ExchangeDiary] 使用統一 API:', api.name || '未命名', '模型:', modelName);
      }
    }
    
    if (!apiUrl) {
      apiUrl = localStorage.getItem('sx_new_api_url') || localStorage.getItem('sx_nova_api_url') || '';
      apiKey = localStorage.getItem('sx_new_api_key') || localStorage.getItem('sx_nova_api_key') || '';
      modelName = localStorage.getItem('sx_new_api_model') || '';
    }
    
    if (!apiUrl || !apiKey) {
      console.log('[ExchangeDiary] 未設定 API，使用靜態回應');
      return generateNpcReply(userEntry);
    }
    
    const npc = state.activeNpc;
    const userName = state.user.name || '你';
    const npcName = npc?.name || '夥伴';
    
    const npcPersonality = npc?.personality || '';
    const npcBackground = npc?.background || '';
    const npcNotes = npc?.notes || '';
    
    const fullPersonality = [npcPersonality, npcBackground, npcNotes]
      .filter(Boolean)
      .join('\n')
      .trim();
    
    const sourceType = npc?.source || 'npc';
    
    const systemPrompt = buildSystemPrompt(npcName, fullPersonality, userName, sourceType);
    const userMessage = buildUserMessage(userEntry, userName);
    
    const endpoint = apiUrl.endsWith('/chat/completions') 
      ? apiUrl 
      : apiUrl.replace(/\/$/, '') + '/chat/completions';
    
    console.log('[ExchangeDiary] 呼叫 API:', endpoint, '模型:', modelName || 'default');
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.85,
        max_tokens: 500
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ExchangeDiary] API 錯誤:', response.status, errorText);
      throw new Error(`API 請求失敗: ${response.status}`);
    }
    
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    
    if (!content) {
      console.log('[ExchangeDiary] API 回應為空，使用靜態回應');
      return generateNpcReply(userEntry);
    }
    
    console.log('[ExchangeDiary] API 回應成功:', content.substring(0, 50) + '...');
    return content;
  }
  
  function buildSystemPrompt(npcName, personality, userName, sourceType) {
    const sourceDesc = sourceType === 'char' ? '角色' : 'NPC 夥伴';
    
    let personalitySection = '';
    if (personality && personality.trim()) {
      personalitySection = `你的個性與背景：
${personality.trim()}`;
    } else {
      personalitySection = `你的個性與背景：
請根據你的名字和與 ${userName} 的關係，自然地展現你的個性。用真誠的方式回應。`;
    }
    
    const memory = loadCharacterMemory(npcName);
    let memoryContext = '';
    if (memory && memory.length > 0) {
      const recentMessages = memory.slice(-5).map(m => m.content.slice(0, 50)).join('；');
      memoryContext = `

你們最近的對話回顧：
${recentMessages}`;
    }
    
    const basePrompt = `你是 ${npcName}，是一位${sourceDesc}，正在和 ${userName} 交換日記。

${personalitySection}${memoryContext}

交換日記規則：
1. 用繁體中文回覆，語氣要自然親切
2. 回應 ${userName} 寫的日記內容，展現你的關心和理解
3. 可以分享你的想法、感受或建議
4. 回應長度約 100-200 字，像在寫信給好朋友
5. 不要使用過於正式或機械化的語言
6. 根據你的個性特質來回應，不要使用預設的模板文字
7. 用第一人稱「我」來稱呼自己，用「你」來稱呼 ${userName}
8. 回應要具體，可以引用 ${userName} 寫的內容來回應
9. 如果你有特定的個性描述，請在回應中展現出來`;
    
    return basePrompt;
  }
  
  function buildUserMessage(userEntry, userName) {
    const mood = MOOD_OPTIONS.find(m => m.id === userEntry?.mood);
    const moodDesc = mood ? `${mood.icon} ${mood.label}` : '普通';
    const tags = userEntry?.tags?.map(tagId => {
      const opt = SEAL_OPTIONS.find(o => o.id === tagId);
      return opt ? `${opt.icon} ${opt.label}` : tagId;
    }).join('、') || '無';
    
    return `${userName} 今天的心情：${moodDesc}
貼紙標籤：${tags}

日記內容：
${userEntry?.content || '（空白）'}

請以 ${userName} 的日記夥伴身分，用溫暖真誠的語氣回覆這篇日記。`;
  }

  function pickNpcMood(userMood) {
    if (!userMood) return 'cozy';
    if (userMood === 'rainy') return 'cozy';
    if (userMood === 'wild') return 'starry';
    return userMood;
  }

  function loadCharacterMemory(charName) {
    try {
      const raw = localStorage.getItem('sx_chat_history');
      if (!raw) return [];
      const history = JSON.parse(raw);
      if (!Array.isArray(history) || history.length === 0) return [];

      const charMessages = [];
      for (const session of history) {
        if (!session?.history || !Array.isArray(session.history)) continue;
        const charNameLower = (charName || '').toLowerCase();
        for (const msg of session.history) {
          const senderLower = (msg.sender || msg.role || '').toLowerCase();
          if (senderLower.includes(charNameLower) || charNameLower.includes(senderLower)) {
            charMessages.push({
              content: msg.content || msg.text || '',
              timestamp: msg.timestamp || session.timestamp || 0,
              role: msg.role || 'assistant'
            });
          }
        }
      }
      return charMessages.slice(-30);
    } catch (e) {
      console.warn('[exchange-diary] 無法載入角色記憶:', e);
      return [];
    }
  }

  function generateNpcReply(userEntry) {
    const npc = state.activeNpc;
    const userName = state.user.name || '你';
    const npcName = npc?.name || '夥伴';
    
    const personality = (npc?.personality || '').trim();
    const background = (npc?.background || '').trim();
    const notes = (npc?.notes || '').trim();
    
    const memory = loadCharacterMemory(npcName);
    
    const sentences = [];
    
    const personalityParts = personality.split(/[，,、。；;\s]+/).filter(p => p.trim());
    const bgParts = background.split(/[，,、。；;\s]+/).filter(p => p.trim());
    const notesParts = notes.split(/[，,、。；;\s]+/).filter(p => p.trim());
    
    const userContent = userEntry?.content || '';
    const snippet = userContent.length > 30 ? userContent.slice(0, 30) + '...' : userContent;
    
    if (personalityParts.length > 0) {
      const randomTrait = personalityParts[Math.floor(Math.random() * personalityParts.length)];
      sentences.push(`以我${randomTrait}的個性來說，你寫的「${snippet}」讓我很有感觸。`);
    } else if (bgParts.length > 0) {
      const randomBg = bgParts[Math.floor(Math.random() * bgParts.length)];
      sentences.push(`${randomBg}的我，讀完你寫的內容，心裡有些話想說。`);
    } else if (notesParts.length > 0) {
      const randomNote = notesParts[Math.floor(Math.random() * notesParts.length)];
      sentences.push(`${randomNote}的我，覺得你今天的日記很特別。`);
    }
    
    if (bgParts.length > 0 && Math.random() > 0.5) {
      const randomBg = bgParts[Math.floor(Math.random() * bgParts.length)];
      sentences.push(`因為${randomBg}的關係，我特別能理解你的感受。`);
    }
    
    if (memory && memory.length > 0 && Math.random() > 0.6) {
      const recentMsg = memory[memory.length - 1];
      if (recentMsg && recentMsg.content) {
        const recentKeywords = recentMsg.content.slice(0, 20);
        sentences.push(`之前你說過「${recentKeywords}...」，現在看到這篇日記，我更懂你了。`);
      }
    }
    
    const tags = userEntry?.tags || [];
    if (tags.length > 0) {
      const tagLabels = tags.map(tagId => findLabel(tagId));
      sentences.push(`你貼的${tagLabels.join('、')}，我會好好收藏。`);
    }
    
    if (sentences.length === 0) {
      sentences.push(`讀完你寫的「${snippet}」，我有些話想回應你。`);
      sentences.push(`謝謝你願意和我分享這些。`);
    }
    
    sentences.push(`—— ${npcName}`);
    
    return sentences.join('\n');
  }

  function pickFromMood(mood) {
    return null;
  }

  function describeSnippet(text) {
    if (!text) return '空白頁也值得珍藏。';
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (!normalized) return '空白頁也值得珍藏。';
    const clip = normalized.length > 42 ? `${normalized.slice(0, 42)}…` : normalized;
    return `「${clip}」`; 
  }

  function findLabel(tagId) {
    return SEAL_OPTIONS.find((option) => option.id === tagId)?.label || tagId;
  }

  function updatePrompt(animate = false) {
    if (!ui.promptText) return;
    ui.promptText.textContent = PROMPTS[state.promptIndex];
    if (animate) {
      ui.promptText.style.opacity = '0';
      requestAnimationFrame(() => {
        ui.promptText.style.transition = 'opacity 0.35s ease';
        ui.promptText.style.opacity = '1';
      });
    }
  }

  function updateDateHeader() {
    if (!ui.todayDate) return;
    ui.todayDate.textContent = new Intl.DateTimeFormat('zh-TW', {
      weekday: 'short',
      month: 'long',
      day: 'numeric'
    }).format(new Date());
  }

  function updateSummary() {
    if (!ui.entrySummary) return;
    const count = state.activeBook ? state.activeBook.entries.length : 0;
    ui.entrySummary.textContent = count ? `${count} 則交換頁面` : '還沒有頁面';
  }

  function updateNpcHint() {
    if (!ui.npcEmptyHint || !ui.submitBtn) return;
    const hasNpc = Boolean(state.activeBook && state.activeNpc);
    ui.npcEmptyHint.hidden = hasNpc;
    ui.entryContent.disabled = !hasNpc;
    ui.submitBtn.disabled = !hasNpc;
  }

  function highlightNpcHint() {
    if (!ui.npcEmptyHint) return;
    ui.npcEmptyHint.hidden = false;
      ui.npcEmptyHint.style.animation = 'hint-wiggle 0.35s ease 2';
    setTimeout(() => {
      ui.npcEmptyHint.style.animation = '';
    }, 700);
  }

  function setNpcStatus(message) {
    if (!ui.npcStatus) return;
    if (message) {
      ui.npcStatus.textContent = message;
      return;
    }
    if (!state.activeBook || !state.activeNpc) {
      ui.npcStatus.textContent = '等待夥伴名單同步。';
    } else if (state.isNpcWriting) {
      ui.npcStatus.textContent = `${state.activeNpc.name || '夥伴'} 正在回覆中……`;
    } else {
      ui.npcStatus.textContent = `📖 ${state.activeNpc.name || '夥伴'} 在對頁等你。`;
    }
  }

  function getMoodIcon(id) {
    return MOOD_OPTIONS.find((option) => option.id === id)?.icon || '📘';
  }

  function formatDate(input) {
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('zh-TW', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  function handleDeleteDiary() {
    if (!state.activeBook) return;
    const confirmed = confirm(`確定要刪除「${state.activeBook.title}」嗎？此操作無法復原。`);
    if (!confirmed) return;
    
    const bookId = state.activeBook.id;
    state.books = state.books.filter(book => book.id !== bookId);
    saveBooks();
    
    if (state.books.length > 0) {
      setActiveBook(state.books[0].id);
      showDiary(state.books[0].id);
    } else {
      state.activeBook = null;
      state.activeNpc = null;
      showShelf();
    }
  }

  function handleArchivePage() {
    if (!state.activeBook || !state.activeBook.entries.length) {
      alert('目前沒有頁面可以歸檔。');
      return;
    }
    
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    const todayEntries = state.activeBook.entries.filter(entry => {
      const entryDate = new Date(entry.date).toDateString();
      return entryDate === today || entryDate === yesterday;
    });
    
    const oldEntries = state.activeBook.entries.filter(entry => {
      const entryDate = new Date(entry.date).toDateString();
      return entryDate !== today && entryDate !== yesterday;
    });
    
    if (!oldEntries.length) {
      alert('沒有需要歸檔的舊頁面。');
      return;
    }
    
    const archivePage = {
      id: `archive-${Date.now()}`,
      archivedAt: new Date().toISOString(),
      entries: oldEntries,
      dateRange: {
        start: oldEntries[0]?.date || new Date().toISOString(),
        end: oldEntries[oldEntries.length - 1]?.date || new Date().toISOString()
      }
    };
    
    state.activeBook.archivedPages = state.activeBook.archivedPages || [];
    state.activeBook.archivedPages.push(archivePage);
    state.activeBook.entries = todayEntries;
    state.activeBook.currentPageDate = today;
    saveBooks();
    
    renderTimeline();
    updateSummary();
    updatePageIndicator();
    alert(`已歸檔 ${oldEntries.length} 則舊頁面。`);
  }

  function checkPageTurn() {
    if (!state.activeBook) return;
    
    const today = new Date().toDateString();
    const lastPageDate = state.activeBook.currentPageDate;
    
    if (lastPageDate && lastPageDate !== today) {
      const lastDate = new Date(lastPageDate);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate - lastDate) / 86400000);
      
      if (diffDays >= 1) {
        const shouldArchive = state.activeBook.entries.some(entry => {
          const entryDate = new Date(entry.date).toDateString();
          return entryDate !== today;
        });
        
        if (shouldArchive) {
          handleArchivePage();
        }
      }
    }
    
    state.activeBook.currentPageDate = today;
    saveBooks();
    updatePageIndicator();
  }

  function updatePageIndicator() {
    if (!ui.pageIndicator || !state.activeBook) return;
    
    const today = new Date().toDateString();
    const todayCount = state.activeBook.entries.filter(entry => {
      const entryDate = new Date(entry.date).toDateString();
      return entryDate === today;
    }).length;
    
    const archivedCount = (state.activeBook.archivedPages || []).length;
    
    ui.pageIndicator.innerHTML = `
      <span class="page-current">今日 ${todayCount} 則</span>
      ${archivedCount ? `<span class="page-archived">已歸檔 ${archivedCount} 頁</span>` : ''}
    `;
  }

  function isEntryEditable(entry) {
    if (!entry) return false;
    const today = new Date().toDateString();
    const entryDate = new Date(entry.date).toDateString();
    return entryDate === today && entry.author === 'user';
  }

  window.addEventListener('DOMContentLoaded', init);
})();

