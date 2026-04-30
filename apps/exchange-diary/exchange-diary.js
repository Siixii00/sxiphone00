(function() {
  const ENTRIES_KEY = 'sx_exchange_diary_entries';
  const BOOKS_KEY = 'sx_exchange_diary_books';
  const ACTIVE_BOOK_KEY = 'sx_exchange_diary_active_book';
  const NPC_STORAGE_KEY = 'sx_npcs';
  const CHAR_STORAGE_KEY = 'sx_characters';

  const MOOD_OPTIONS = [
    { id: 'sunny', label: '?¥Ê?', icon: '?å§Ô∏?, note: '‰∫Æ‰∫Æ?ÑÂ??ªÊó•' },
    { id: 'rainy', label: '?®Èú≤', icon: '?åßÔ∏?, note: '?©Â?Ë¢´Ê??? },
    { id: 'starry', label: '?üÂ?', icon: '??', note: '?ÑÊ?Ë©±Ê®°Âº? },
    { id: 'cozy', label: '?ñË¢´', icon: '??', note: '?ÇÁ?Á≥ªÂ??? },
    { id: 'wild', label: '?íÈö™', icon: '?ß≠', note: '?âÈ?Â∞èÊ??? }
  ];

  const SEAL_OPTIONS = [
    { id: 'secret', label: 'Á•ïÂ?', icon: '??' },
    { id: 'gratitude', label: '?üË?', icon: '??' },
    { id: 'courage', label: '?áÊ∞£', icon: '?î•' },
    { id: 'dream', label: 'Â§¢Ë©±', icon: '??' },
    { id: 'routine', label: 'Á¢éÂøµ', icon: '??' }
  ];

  const PROMPTS = [
    '‰ªäÂ§©?â‰?È∫ºÂè™?≥Ë? NPC ?•È??ÑÁ?ÂØÜÔ?',
    '?èËø∞‰∏Ä?ã‰??ëÂÖ±?åÊ??âÁ?ÈªòÂ??ñÂ??óË???,
    '?äÊ?Ëøë‰?Ê¨°Á??∞Ê??ºÊ??ÑÁû¨?ìÁï´?êÊ?Â≠óÁÖß?á„Ä?,
    'ÂØ´‰?‰Ω†Ê??≥Êî∂??NPC ?™‰??•Â??∞„Ä?,
    'Â¶ÇÊ??ä‰?Â§©Á?ÂøÉÊ?ÂØ´Ê?Ê≠åË?ÔºåÁ¨¨‰∏Ä?•Ê??Ø‰?È∫ºÔ?',
    'Ë™™Ë™™‰Ω†Ê?ËøëÊÉ≥ÂÆåÊ??ÑÂ?‰ªªÂ?ÔºåË? NPC ??ù£??,
    '?ä‰??áÂ§¢Â¢ÉÂÅ∑?∑Âú∞‰∫§Áµ¶ NPC ‰øùÁÆ°??,
    'ÂØ´Â?‰ø°Ê?Ë¨?NPC ?æÁ??™‰º¥?Ñ‰??ª„Ä?,
    '?ä‰??ãÈ?Ê≤íÂ?Ë®¥Âà•‰∫∫Á??àÊ?ÂØ´ÈÄ≤‰???,
    '?èËø∞‰Ω†ÂÄë‰?‰∏ÄÊ¨°ÊÉ≥‰∏ÄËµ∑Â??êÁ??íÈö™??
  ];

  const state = {
    books: [],
    activeBook: null,
    npcs: [],
    activeNpc: null,
    user: { name: '??, avatar: '', personality: '', background: '' },
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
      console.log("?•Ë??∏Ê?Â∑≤‰?Â≠òËá≥ localStorage");
    } catch (e) {
      console.error("‰øùÂ??•Ë??∏Ê?Â§±Ê?:", e);
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
        console.log("?•Ë??∏Ê?Â∑≤‰?Â≠òËá≥ IndexedDB");
      } catch (e) {
        console.error("IndexedDB ‰øùÂ?Â§±Ê?:", e);
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
      const next = window.prompt('Ëº∏ÂÖ•?∞Á??•Ë??∏Â?', current);
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
    btn.textContent = '?åÊ≠•‰∏≠‚Ä?;
    setTimeout(() => {
      refreshNpcs();
      btn.textContent = 'Â∑≤Âà∑??;
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
      name: localStorage.getItem('sx_user_name') || '??,
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
      console.warn('?°Ê?Ëß??‰∫§Ê??•Ë?Ë≥áÊ?', err);
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
      console.warn('?°Ê?Ëß??‰∫§Ê??•Ë??∏Êú¨Ë≥áÊ?', err);
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
      title: book?.title || '?™ÂëΩ?çÊó•Ë®?,
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
      title: 'Á¥ôÈ??ÑÊ?Ë©?,
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
      ui.diaryShelf.innerHTML = '<div class="empty-state"><p>?ÑÊ??âÊó•Ë®òÔ??àÂª∫Á´ã‰??¨Âêß??/p></div>';
      return;
    }
    ui.diaryShelf.innerHTML = '';
    state.books.forEach((book) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'shelf-card';
      card.innerHTML = `
        <div class="spine-title">${book.title}</div>
        <div class="spine-meta">${book.entries.length} ??/div>
        <div class="spine-dots">${book.npcIds.slice(0, 3).map(id => {
          const npc = state.npcs.find(n => n.id === id);
          const letter = (npc?.name || 'Â§?).trim().slice(0, 1);
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
      title: `‰∫§Ê??•Ë? ${index}`,
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
        role: char?.role || 'ËßíËâ≤Â§•‰º¥',
        notes: char?.notes || char?.personality || char?.background || '',
        personality: char?.personality || '',
        background: char?.background || ''
      }));
    } catch (err) {
      console.warn('?°Ê?Ëß??ËßíËâ≤Ë≥áÊ?', err);
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
      console.warn('?°Ê?Ëß?? NPC Ë≥áÊ?', err);
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
      ui.diaryTitle.textContent = state.activeBook?.title || '‰∫§Ê??•Ë?';
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
      ui.npcManageList.innerHTML = '<p class="npc-placeholder">?ÆÂ?Ê≤íÊ?Â§•‰º¥?çÂñÆ</p>';
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
      label.textContent = npc.name || 'Â§•‰º¥';
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
      ui.activeNpcCard.innerHTML = '<p class="npc-placeholder">Â∞öÊú™?∏Ê?Â§•‰º¥ÔºåÂª∫Á´ã‰?‰ΩçÈ??èË?‰Ω†‰∫§?õÊó•Ë®òÁ?ËßíËâ≤?ß„Ä?/p>';
    } else {
      const { name, avatar } = state.activeNpc;
      ui.activeNpcCard.innerHTML = '';
      const avatarBox = document.createElement('div');
      avatarBox.className = 'npc-avatar';
      avatarBox.appendChild(createAvatarNode(avatar, name));

      const meta = document.createElement('div');
      meta.className = 'npc-meta';
      const title = document.createElement('h3');
      title.textContent = name || '?™ÂëΩ?çÂ§•‰º?;
      meta.appendChild(title);

      ui.activeNpcCard.appendChild(avatarBox);
      ui.activeNpcCard.appendChild(meta);
    }

    const availableNpcs = state.activeBook ? state.npcs.filter(npc => state.activeBook.npcIds.includes(npc.id)) : [];
    if (!availableNpcs.length) {
      ui.npcList.innerHTML = '<p class="npc-placeholder">?ÆÂ?Ê≤íÊ?Â§•‰º¥?çÂñÆ</p>';
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
      chipLabel.textContent = npc.name || 'Â§•‰º¥';
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
      ui.entryList.innerHTML = '<div class="empty-state"><p>?ÆÂ??ÑÊ??â‰ªª‰ΩïÈ??¢Ô?ÂØ´‰?Á¨¨‰?Â∞Å‰ø°?ßÔ?</p></div>';
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
    nameEl.textContent = entry.authorName || (entry.author === 'npc' ? (state.activeNpc?.name || 'NPC') : state.user.name || '??);
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
      alert('?ôÊú¨?•Ë?Â∑≤Ê≠∏Ê™îÔ??°Ê?ÁπºÁ?Á∑®ËºØ??);
      return;
    }
    
    const content = ui.entryContent?.value.trim();
    if (!content) {
      setNpcStatus('Ë´ãÂØ´‰∏ã‰?ÈªûÂÖßÂÆπÂ?ÂØÑÂá∫??);
      return;
    }
    const tags = Array.from(state.selectedSeals);
    const entry = {
      id: `entry-${Date.now()}`,
      npcId: state.activeNpc.id,
      author: 'user',
      authorName: state.user.name || '??,
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
    setNpcStatus('?ÅÈù¢Â∑≤Â??∫Ô?NPC Ê≠?ú®?Ü‰ø°??);
    scheduleNpcReply(entry);
  }

  function scheduleNpcReply(latestEntry) {
    if (!state.activeNpc || !state.activeBook) return;
    state.isNpcWriting = true;
    setNpcStatus(`${state.activeNpc.name || 'NPC'} Ê≠?ú®?ûË?‰∏≠‚Ä¶‚Ä¶`);
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
        setNpcStatus('?õ‰?‰∫ÜÔ?ÁøªÈ??∞Á??ÅÈù¢?ß„Ä?);
      } catch (err) {
        console.error('NPC ?ûË??üÊ?Â§±Ê?:', err);
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
        setNpcStatus('?õ‰?‰∫ÜÔ?ÁøªÈ??∞Á??ÅÈù¢?ß„Ä?);
      } finally {
        state.isNpcWriting = false;
      }
    }, 1000 + Math.random() * 1500);
  }

  async function generateApiReply(userEntry) {
    let apiUrl = '';
    let apiKey = '';
    let modelName = '';
    let apiType = 'openai';
    
    if (typeof window.SettingsReader !== 'undefined' && window.SettingsReader.getActiveApiWithFallback) {
      const api = window.SettingsReader.getActiveApiWithFallback();
      if (api) {
        apiUrl = api.url || '';
        apiKey = api.key || '';
        modelName = api.model || '';
        apiType = api.type || 'openai';
        console.log('[ExchangeDiary] ‰ΩøÁî®Áµ±‰? API:', api.name || '?™ÂëΩ??, 'Ê®°Â?:', modelName, 'È°ûÂ?:', apiType);
      }
    }
    
    if (!apiUrl) {
      apiUrl = localStorage.getItem('sx_new_api_url') || localStorage.getItem('sx_nova_api_url') || '';
      apiKey = localStorage.getItem('sx_new_api_key') || localStorage.getItem('sx_nova_api_key') || '';
      modelName = localStorage.getItem('sx_new_api_model') || '';
    }
    
    if (!apiUrl || !apiKey) {
      console.log('[ExchangeDiary] ?™Ë®≠ÂÆ?APIÔºå‰Ωø?®È??ãÂ???);
      return generateNpcReply(userEntry);
    }
    
    const npc = state.activeNpc;
    const userName = state.user.name || '‰Ω?;
    const npcName = npc?.name || 'Â§•‰º¥';
    
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
    
    let content = '';
    
    // Gemini ?üÁ? API ?ºÂ?
    if (apiType === 'gemini') {
      const model = modelName || 'gemini-1.5-flash';
      const targetUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + apiKey;
      
      console.log('[ExchangeDiary] ?ºÂè´ Gemini API, Ê®°Â?:', model);
      
      const geminiPayload = {
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        generationConfig: { temperature: 0.85, maxOutputTokens: 500 },
        systemInstruction: { parts: [{ text: systemPrompt }] }
      };
      
      const geminiRes = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiPayload)
      });
      
      if (!geminiRes.ok) {
        const errorText = await geminiRes.text();
        console.error('[ExchangeDiary] Gemini API ?ØË™§:', geminiRes.status, errorText);
        throw new Error('Gemini API Ë´ãÊ?Â§±Ê?: ' + geminiRes.status);
      }
      
      const geminiData = await geminiRes.json();
      if (geminiData.error) throw new Error(geminiData.error.message || JSON.stringify(geminiData.error));
      content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    } else {
      // OpenAI ?∏ÂÆπ?ºÂ??ñËá™Ë®ÇÁ´ØÈª?      let endpoint;
      if (apiType === 'custom') {
        endpoint = apiUrl;
      } else {
        endpoint = apiUrl.endsWith('/chat/completions') ? apiUrl : apiUrl.replace(/\/$/, '') + '/chat/completions';
      }
      
      console.log('[ExchangeDiary] ?ºÂè´ API:', endpoint, 'Ê®°Â?:', modelName || 'default');
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey
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
        console.error('[ExchangeDiary] API ?ØË™§:', response.status, errorText);
        throw new Error('API Ë´ãÊ?Â§±Ê?: ' + response.status);
      }
      
      const data = await response.json();
      content = data?.choices?.[0]?.message?.content?.trim();
    }
    
    if (!content) {
      console.log('[ExchangeDiary] API ?ûÊ??∫Á©∫Ôºå‰Ωø?®È??ãÂ???);
      return generateNpcReply(userEntry);
    }
    
    console.log('[ExchangeDiary] API ?ûÊ??êÂ?:', content.substring(0, 50) + '...');
    return content;
  }
  
  function buildSystemPrompt(npcName, personality, userName, sourceType) {
    const sourceDesc = sourceType === 'char' ? 'ËßíËâ≤' : 'NPC Â§•‰º¥';
    
    let personalitySection = '';
    if (personality && personality.trim()) {
      personalitySection = `‰Ω†Á??ãÊÄßË??åÊôØÔº?${personality.trim()}`;
    } else {
      personalitySection = `‰Ω†Á??ãÊÄßË??åÊôØÔº?Ë´ãÊ†π?ö‰??ÑÂ?Â≠óÂ???${userName} ?ÑÈ?‰øÇÔ??™ÁÑ∂?∞Â??æ‰??ÑÂÄãÊÄß„ÄÇÁî®?üË??ÑÊñπÂºèÂ??â„ÄÇ`;
    }
    
    const memory = loadCharacterMemory(npcName);
    let memoryContext = '';
    if (memory && memory.length > 0) {
      const recentMessages = memory.slice(-5).map(m => m.content.slice(0, 50)).join('Ôº?);
      memoryContext = `

‰Ω†ÂÄëÊ?ËøëÁ?Â∞çË©±?ûÈ°ßÔº?${recentMessages}`;
    }
    
    const basePrompt = `‰Ω†ÊòØ ${npcName}ÔºåÊòØ‰∏Ä‰Ω?{sourceDesc}ÔºåÊ≠£?®Â? ${userName} ‰∫§Ê??•Ë???
${personalitySection}${memoryContext}

‰∫§Ê??•Ë?Ë¶èÂ?Ôº?1. ?®Á?È´î‰∏≠?áÂ?Ë¶ÜÔ?Ë™ûÊ∞£Ë¶ÅËá™?∂Ë¶™??2. ?ûÊ? ${userName} ÂØ´Á??•Ë??ßÂÆπÔºåÂ??æ‰??ÑÈ?ÂøÉÂ??ÜËß£
3. ?Ø‰ª•?Ü‰∫´‰Ω†Á??≥Ê??ÅÊ??óÊ?Âª∫Ë≠∞
4. ?ûÊ??∑Â∫¶Á¥?100-200 Â≠óÔ??èÂú®ÂØ´‰ø°Áµ¶Â•Ω?ãÂ?
5. ‰∏çË?‰ΩøÁî®?éÊñºÊ≠???ñÊ?Ê¢∞Â??ÑË?Ë®Ä
6. ?πÊ?‰Ω†Á??ãÊÄßÁâπË≥™‰??ûÊ?Ôºå‰?Ë¶Å‰Ωø?®È?Ë®≠Á?Ê®°Êùø?áÂ?
7. ?®Á¨¨‰∏Ä‰∫∫Á®±?åÊ??ç‰?Á®±Âëº?™Â∑±ÔºåÁî®?å‰??ç‰?Á®±Âëº ${userName}
8. ?ûÊ?Ë¶ÅÂÖ∑È´îÔ??Ø‰ª•ÂºïÁî® ${userName} ÂØ´Á??ßÂÆπ‰æÜÂ???9. Â¶ÇÊ?‰Ω†Ê??πÂ??ÑÂÄãÊÄßÊ?Ëø∞Ô?Ë´ãÂú®?ûÊ?‰∏≠Â??æÂá∫‰æÜ`;
    
    return basePrompt;
  }
  
  function buildUserMessage(userEntry, userName) {
    const mood = MOOD_OPTIONS.find(m => m.id === userEntry?.mood);
    const moodDesc = mood ? `${mood.icon} ${mood.label}` : '?ÆÈÄ?;
    const tags = userEntry?.tags?.map(tagId => {
      const opt = SEAL_OPTIONS.find(o => o.id === tagId);
      return opt ? `${opt.icon} ${opt.label}` : tagId;
    }).join('??) || '??;
    
    return `${userName} ‰ªäÂ§©?ÑÂ??ÖÔ?${moodDesc}
Ë≤ºÁ?Ê®ôÁ±§Ôº?{tags}

?•Ë??ßÂÆπÔº?${userEntry?.content || 'ÔºàÁ©∫?ΩÔ?'}

Ë´ã‰ª• ${userName} ?ÑÊó•Ë®òÂ§•‰º¥Ë∫´?ÜÔ??®Ê∫´?ñÁ?Ë™†Á?Ë™ûÊ∞£?ûË??ôÁ??•Ë??Ç`;
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
      console.warn('[exchange-diary] ?°Ê?ËºâÂÖ•ËßíËâ≤Ë®òÊÜ∂:', e);
      return [];
    }
  }

  function generateNpcReply(userEntry) {
    const npc = state.activeNpc;
    const userName = state.user.name || '‰Ω?;
    const npcName = npc?.name || 'Â§•‰º¥';
    
    const personality = (npc?.personality || '').trim();
    const background = (npc?.background || '').trim();
    const notes = (npc?.notes || '').trim();
    
    const memory = loadCharacterMemory(npcName);
    
    const sentences = [];
    
    const personalityParts = personality.split(/[Ôº??Å„ÄÇÔ?;\s]+/).filter(p => p.trim());
    const bgParts = background.split(/[Ôº??Å„ÄÇÔ?;\s]+/).filter(p => p.trim());
    const notesParts = notes.split(/[Ôº??Å„ÄÇÔ?;\s]+/).filter(p => p.trim());
    
    const userContent = userEntry?.content || '';
    const snippet = userContent.length > 30 ? userContent.slice(0, 30) + '...' : userContent;
    
    if (personalityParts.length > 0) {
      const randomTrait = personalityParts[Math.floor(Math.random() * personalityParts.length)];
      sentences.push(`‰ª•Ê?${randomTrait}?ÑÂÄãÊÄß‰?Ë™™Ô?‰Ω†ÂØ´?Ñ„Ä?{snippet}?çË??ëÂ??âÊ?Ëß∏„ÄÇ`);
    } else if (bgParts.length > 0) {
      const randomBg = bgParts[Math.floor(Math.random() * bgParts.length)];
      sentences.push(`${randomBg}?ÑÊ?ÔºåË?ÂÆå‰?ÂØ´Á??ßÂÆπÔºåÂ?Ë£°Ê?‰∫õË©±?≥Ë™™?Ç`);
    } else if (notesParts.length > 0) {
      const randomNote = notesParts[Math.floor(Math.random() * notesParts.length)];
      sentences.push(`${randomNote}?ÑÊ?ÔºåË¶∫Âæó‰?‰ªäÂ§©?ÑÊó•Ë®òÂ??πÂà•?Ç`);
    }
    
    if (bgParts.length > 0 && Math.random() > 0.5) {
      const randomBg = bgParts[Math.floor(Math.random() * bgParts.length)];
      sentences.push(`?†ÁÇ∫${randomBg}?ÑÈ?‰øÇÔ??ëÁâπ?•ËÉΩ?ÜËß£‰Ω†Á??üÂ??Ç`);
    }
    
    if (memory && memory.length > 0 && Math.random() > 0.6) {
      const recentMsg = memory[memory.length - 1];
      if (recentMsg && recentMsg.content) {
        const recentKeywords = recentMsg.content.slice(0, 20);
        sentences.push(`‰πãÂ?‰Ω†Ë™™?é„Ä?{recentKeywords}...?çÔ??æÂú®?ãÂà∞?ôÁ??•Ë?ÔºåÊ??¥Ê?‰Ω†‰??Ç`);
      }
    }
    
    const tags = userEntry?.tags || [];
    if (tags.length > 0) {
      const tagLabels = tags.map(tagId => findLabel(tagId));
      sentences.push(`‰Ω†Ë≤º??{tagLabels.join('??)}ÔºåÊ??ÉÂ•ΩÂ•ΩÊî∂?è„ÄÇ`);
    }
    
    if (sentences.length === 0) {
      sentences.push(`ËÆÄÂÆå‰?ÂØ´Á???{snippet}?çÔ??ëÊ?‰∫õË©±?≥Â??â‰??Ç`);
      sentences.push(`Ë¨ùË?‰Ω†È??èÂ??ëÂ?‰∫´ÈÄô‰??Ç`);
    }
    
    sentences.push(`?î‚Ä?${npcName}`);
    
    return sentences.join('\n');
  }

  function pickFromMood(mood) {
    return null;
  }

  function describeSnippet(text) {
    if (!text) return 'Á©∫ÁôΩ?Å‰??ºÂ??çË???;
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (!normalized) return 'Á©∫ÁôΩ?Å‰??ºÂ??çË???;
    const clip = normalized.length > 42 ? `${normalized.slice(0, 42)}?¶` : normalized;
    return `??{clip}?ç`; 
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
    ui.entrySummary.textContent = count ? `${count} ?á‰∫§?õÈ??¢` : '?ÑÊ??âÈ???;
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
      ui.npcStatus.textContent = 'Á≠âÂ?Â§•‰º¥?çÂñÆ?åÊ≠•??;
    } else if (state.isNpcWriting) {
      ui.npcStatus.textContent = `${state.activeNpc.name || 'Â§•‰º¥'} Ê≠?ú®?ûË?‰∏≠‚Ä¶‚Ä¶`;
    } else {
      ui.npcStatus.textContent = `?? ${state.activeNpc.name || 'Â§•‰º¥'} ?®Â??ÅÁ?‰Ω†„ÄÇ`;
    }
  }

  function getMoodIcon(id) {
    return MOOD_OPTIONS.find((option) => option.id === id)?.icon || '??';
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
    const confirmed = confirm(`Á¢∫Â?Ë¶ÅÂà™?§„Ä?{state.activeBook.title}?çÂ?ÔºüÊ≠§?ç‰??°Ê?Âæ©Â??Ç`);
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
      alert('?ÆÂ?Ê≤íÊ??ÅÈù¢?Ø‰ª•Ê≠∏Ê???);
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
      alert('Ê≤íÊ??ÄË¶ÅÊ≠∏Ê™îÁ??äÈ??¢„Ä?);
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
    alert(`Â∑≤Ê≠∏Ê™?${oldEntries.length} ?áË??ÅÈù¢?Ç`);
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
      <span class="page-current">‰ªäÊó• ${todayCount} ??/span>
      ${archivedCount ? `<span class="page-archived">Â∑≤Ê≠∏Ê™?${archivedCount} ??/span>` : ''}
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

