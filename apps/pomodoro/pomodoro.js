(()=>{
  console.log('Loaded app: pomodoro');

  const timeDisplay = document.getElementById('time-display');
  const statusEl = document.getElementById('status');
  const startBtn = document.getElementById('start-btn');
  const resetBtn = document.getElementById('reset-btn');
  const tabs = document.querySelectorAll('.mode-tabs .tab');
  const completedEl = document.getElementById('completed-count');
  const cycleInfoEl = document.getElementById('cycle-info');
  const settingsBtn = document.getElementById('settings-btn');
  const settingsPanel = document.getElementById('settings-panel');
  const closeSettings = document.getElementById('close-settings');
  const saveSettings = document.getElementById('save-settings');
  const focusMinInput = document.getElementById('focus-min');
  const shortMinInput = document.getElementById('short-min');
  const longMinInput = document.getElementById('long-min');
  const longGapInput = document.getElementById('long-gap');
  const companionIntervalInput = document.getElementById('companion-interval');
  const companionCard = document.getElementById('companion-card');
  const companionAvatar = document.getElementById('companion-avatar');
  const companionName = document.getElementById('companion-name');
  const companionLine = document.getElementById('companion-line');
  const companionBubble = document.getElementById('companion-bubble');
  const uploadBtn = document.getElementById('upload-avatar-btn');
  const uploadInput = document.getElementById('companion-upload');

  const defaultConfig = {
    focus: 25,
    short: 5,
    long: 15,
    longGap: 4,
    companionInterval: 5,
    companionCharId: null,
  };

  let config = {...defaultConfig, ...loadConfig()};
  applyInputs(config);

  let mode = 'focus';
  let remaining = config.focus * 60;
  let timerId = null;
  let running = false;
  let completed = 0;
  let cycle = 1;
  let companionTimer = null;
  let currentCompanion = null;

  function loadConfig(){
    try {
      const raw = localStorage.getItem('pomodoro_config');
      return raw ? JSON.parse(raw) : {};
    } catch(_) { return {}; }
  }

  function saveConfig(newCfg){
    localStorage.setItem('pomodoro_config', JSON.stringify(newCfg));
  }

  function applyInputs(cfg){
    focusMinInput.value = cfg.focus;
    shortMinInput.value = cfg.short;
    longMinInput.value = cfg.long;
    longGapInput.value = cfg.longGap;
    companionIntervalInput.value = cfg.companionInterval;
  }

  function loadSelectedCompanion(){
    const savedId = config.companionCharId;
    if (savedId) {
      const raw = localStorage.getItem('sx_characters');
      if (raw) {
        try {
          const chars = JSON.parse(raw);
          const found = chars.find(c => c.id === savedId || c.name === savedId);
          if (found) return { id: found.id || found.name, name: found.name, avatar: found.avatar || '' };
        } catch (e) {
          console.warn('[pomodoro] 解析 sx_characters 失敗:', e);
        }
      }
    }
    const charName = localStorage.getItem('sx_char_name');
    if (charName) {
      const raw = localStorage.getItem('sx_characters');
      if (raw) {
        try {
          const chars = JSON.parse(raw);
          const found = chars.find(c => c.name === charName);
          if (found) return { id: found.id || found.name, name: found.name, avatar: found.avatar || '' };
        } catch (e) {}
      }
      const charAvatar = localStorage.getItem('sx_char_avatar');
      return { id: charName, name: charName, avatar: charAvatar || '' };
    }
    const masks = JSON.parse(localStorage.getItem('sx_masks') || '[]');
    if (masks.length > 0 && masks[0] && masks[0].name) {
      return { id: masks[0].name, name: masks[0].name, avatar: masks[0].avatar || '' };
    }
    return null;
  }

  function setMode(next){
    mode = next;
    tabs.forEach(tab=>tab.classList.toggle('active', tab.dataset.mode===mode));
    const mins = config[mode];
    remaining = mins * 60;
    updateDisplay();
    statusEl.textContent = modeLabel(mode) + ' ready';
  }

  function modeLabel(m){
    return m==='focus' ? '專注' : m==='short' ? '短休' : '長休';
  }

  function format(sec){
    const m = Math.floor(sec/60).toString().padStart(2,'0');
    const s = Math.floor(sec%60).toString().padStart(2,'0');
    return `${m}:${s}`;
  }

  function updateDisplay(){
    timeDisplay.textContent = format(remaining);
    completedEl.textContent = completed;
    cycleInfoEl.textContent = `${cycle} / ${config.longGap}`;
  }

  function tick(){
    if (!running) return;
    if (remaining <= 0){
      nextStage();
      return;
    }
    remaining -= 1;
    updateDisplay();
  }

  function start(){
    if (running) return pause();
    running = true;
    startBtn.textContent = '暫停';
    statusEl.textContent = modeLabel(mode) + ' 中';
    timerId = setInterval(tick, 1000);
    startCompanion();
  }

  function pause(){
    running = false;
    startBtn.textContent = '開始';
    statusEl.textContent = '已暫停';
    clearInterval(timerId);
    stopCompanion();
  }

  function reset(){
    pause();
    setMode(mode);
    statusEl.textContent = 'Ready';
  }

  function nextStage(){
    pause();
    if (mode === 'focus') {
      completed += 1;
      if (completed % config.longGap === 0) {
        mode = 'long';
        cycle = 1;
      } else {
        mode = 'short';
        cycle = (cycle % config.longGap) + 1;
      }
    } else {
      mode = 'focus';
    }
    setMode(mode);
    statusEl.textContent = modeLabel(mode) + ' ready';
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      pause();
      setMode(tab.dataset.mode || 'focus');
    });
  });

  startBtn.addEventListener('click', start);
  resetBtn.addEventListener('click', reset);

    settingsBtn.addEventListener('click', () => settingsPanel.classList.remove('hidden'));
    closeSettings.addEventListener('click', () => settingsPanel.classList.add('hidden'));
  saveSettings.addEventListener('click', () => {
    const nextCfg = {
      focus: clampNum(focusMinInput.value, 1, 90),
      short: clampNum(shortMinInput.value, 1, 30),
      long: clampNum(longMinInput.value, 1, 60),
      longGap: clampNum(longGapInput.value, 1, 12),
      companionInterval: clampNum(companionIntervalInput.value, 1, 30),
    };
    config = nextCfg;
    saveConfig(config);
    pause();
      setMode('focus');
    settingsPanel.classList.add('hidden');
  });

  function clampNum(v, min, max){
    const n = Number(v) || min;
    return Math.min(max, Math.max(min, n));
  }

  // --- 伴聊邏輯 ---
  function startCompanion(){
    stopCompanion();
    currentCompanion = loadSelectedCompanion();
    showCompanionCard();
    companionTimer = setInterval(pushCompanionLine, (config.companionInterval || 5) * 60 * 1000);
    setTimeout(pushCompanionLine, 2000);
  }

  function stopCompanion(){
    if (companionTimer) clearInterval(companionTimer);
    companionTimer = null;
  }

  function getActiveMask(){
    if (currentCompanion) {
      return { name: currentCompanion.name, avatar: currentCompanion.avatar || '' };
    }
    
    const charName = localStorage.getItem('sx_char_name');
    
    if (charName) {
      const raw = localStorage.getItem('sx_characters');
      if (raw) {
        try {
          const chars = JSON.parse(raw);
          const found = chars.find(c => c.name === charName);
          if (found) {
            return { 
              name: found.name, 
              avatar: found.avatar || '' 
            };
          }
        } catch (e) {
          console.warn('[pomodoro] 解析 sx_characters 失敗:', e);
        }
      }
      const charAvatar = localStorage.getItem('sx_char_avatar');
      return { name: charName, avatar: charAvatar || '' };
    }
    
    const masks = JSON.parse(localStorage.getItem('sx_masks') || '[]');
    if (masks.length > 0 && masks[0] && masks[0].name) {
      return { 
        name: masks[0].name, 
        avatar: masks[0].avatar || '' 
      };
    }
    
    return { name: 'AI 夥伴', avatar: '' };
  }

  function getHistorySlice(depth=30){
    const history = JSON.parse(localStorage.getItem('sx_chat_history') || '[]');
    return history.slice(-depth).filter(m => typeof m.content === 'string');
  }

  function pickLine(){
    const history = getHistorySlice();
    if (history.length === 0) return '一起專注吧！';
    // 優先選助手語氣
    const assistants = history.filter(m => m.role === 'assistant' && m.content.trim());
    const pool = assistants.length ? assistants : history;
    const picked = pool[Math.floor(Math.random() * pool.length)];
    return picked.content.replace(/<[^>]+>/g, '').slice(0, 80) || '一起專注吧！';
  }

  function showCompanionCard(){
    const mask = getActiveMask();
    companionName.textContent = mask.name || 'AI 夥伴';
    if (mask.avatar) {
      companionAvatar.style.backgroundImage = `url('${mask.avatar}')`;
    } else {
      companionAvatar.style.backgroundImage = 'linear-gradient(135deg,#4f8bff,#8ec5ff)';
    }
    companionLine.textContent = '開始後將定時送上鼓勵';
    companionBubble.classList.add('hidden');
  }

  let chatMessages = [];
  const MAX_CHAT_MESSAGES = 10;

  function addChatMessage(text, isCompanion = true){
    chatMessages.push({ text, isCompanion, time: Date.now() });
    if (chatMessages.length > MAX_CHAT_MESSAGES) {
      chatMessages.shift();
    }
    renderChatMessages();
  }

  function renderChatMessages(){
    const container = document.getElementById('companion-chat');
    if (!container) return;
    container.innerHTML = '';
    chatMessages.forEach(msg => {
      const div = document.createElement('div');
      div.className = `chat-msg ${msg.isCompanion ? 'companion' : 'user'}`;
      div.textContent = msg.text;
      container.appendChild(div);
    });
    container.scrollTop = container.scrollHeight;
  }

  function showCompanionDialog(text){
    const mask = getActiveMask();
    const dialogOverlay = document.getElementById('companion-dialog-overlay');
    const dialogAvatar = document.getElementById('companion-dialog-avatar');
    const dialogName = document.getElementById('companion-dialog-name');
    const dialogText = document.getElementById('companion-dialog-text');
    const dialogInput = document.getElementById('companion-dialog-input');
    
    if (!dialogOverlay) {
      addChatMessage(text, true);
      companionLine.textContent = text;
      return;
    }
    
    dialogName.textContent = mask.name || 'AI 夥伴';
    if (mask.avatar) {
      dialogAvatar.style.backgroundImage = `url('${mask.avatar}')`;
    } else {
      dialogAvatar.style.backgroundImage = 'linear-gradient(135deg,#4f8bff,#8ec5ff)';
    }
    dialogText.textContent = text;
    
    addChatMessage(text, true);
    
    dialogOverlay.classList.remove('hidden');
    dialogOverlay.classList.add('show');
    
    if (dialogInput) {
      dialogInput.value = '';
      dialogInput.focus();
    }
    
    setTimeout(() => {
      dialogOverlay.classList.remove('show');
      setTimeout(() => dialogOverlay.classList.add('hidden'), 300);
    }, 8000);
  }

  function pushCompanionLine(){
    const line = pickLine();
    if (line) {
      showCompanionDialog(line);
    }
  }

  uploadBtn?.addEventListener('click', () => uploadInput?.click());
  uploadInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result;
      const masks = JSON.parse(localStorage.getItem('sx_masks') || '[]');
      if (masks.length === 0) masks.push({ name: 'AI 夥伴' });
      masks[0].avatar = url;
      localStorage.setItem('sx_masks', JSON.stringify(masks));
      companionAvatar.style.backgroundImage = `url('${url}')`;
    };
    reader.readAsDataURL(file);
  });

  const selectCompanionBtn = document.getElementById('select-companion-btn');
  const companionSelectPanel = document.getElementById('companion-select-panel');
  const companionList = document.getElementById('companion-list');
  const closeCompanionSelect = document.getElementById('close-companion-select');

  function loadAvailableCharacters(){
    const chars = [];
    const raw = localStorage.getItem('sx_characters');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach(c => {
            if (c && c.name) {
              chars.push({ id: c.id || c.name, name: c.name, avatar: c.avatar || '' });
            }
          });
        }
      } catch (e) {}
    }
    const charName = localStorage.getItem('sx_char_name');
    if (charName && !chars.find(c => c.name === charName)) {
      const charAvatar = localStorage.getItem('sx_char_avatar');
      chars.push({ id: charName, name: charName, avatar: charAvatar || '' });
    }
    const masks = JSON.parse(localStorage.getItem('sx_masks') || '[]');
    masks.forEach(m => {
      if (m && m.name && !chars.find(c => c.name === m.name)) {
        chars.push({ id: m.name, name: m.name, avatar: m.avatar || '' });
      }
    });
    if (chars.length === 0) {
      chars.push({ id: 'default', name: 'AI 夥伴', avatar: '' });
    }
    return chars;
  }

  function renderCompanionList(){
    if (!companionList) return;
    const chars = loadAvailableCharacters();
    companionList.innerHTML = '';
    chars.forEach(char => {
      const item = document.createElement('div');
      item.className = 'companion-select-item';
      if (currentCompanion && currentCompanion.id === char.id) {
        item.classList.add('selected');
      }
      item.innerHTML = `
        <div class="companion-select-avatar" style="${char.avatar ? `background-image:url('${char.avatar}')` : 'background:linear-gradient(135deg,#4f8bff,#8ec5ff)'}"></div>
        <div class="companion-select-name">${char.name}</div>
      `;
      item.addEventListener('click', () => {
        currentCompanion = { id: char.id, name: char.name, avatar: char.avatar };
        config.companionCharId = char.id;
        saveConfig(config);
        showCompanionCard();
        if (companionSelectPanel) companionSelectPanel.classList.add('hidden');
      });
      companionList.appendChild(item);
    });
  }

  selectCompanionBtn?.addEventListener('click', () => {
    renderCompanionList();
    if (companionSelectPanel) companionSelectPanel.classList.remove('hidden');
  });
  closeCompanionSelect?.addEventListener('click', () => {
    if (companionSelectPanel) companionSelectPanel.classList.add('hidden');
  });

  const dialogInput = document.getElementById('companion-dialog-input');
  dialogInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && dialogInput.value.trim()) {
      addChatMessage(dialogInput.value.trim(), false);
      dialogInput.value = '';
      const dialogOverlay = document.getElementById('companion-dialog-overlay');
      setTimeout(() => {
        const responses = ['加油！繼續保持！', '你做得很棒！', '專注得很好！', '再堅持一下！', '太棒了！'];
        const resp = responses[Math.floor(Math.random() * responses.length)];
        addChatMessage(resp, true);
      }, 800);
    }
  });

  const dialogOverlay = document.getElementById('companion-dialog-overlay');
  dialogOverlay?.addEventListener('click', (e) => {
    if (e.target === dialogOverlay) {
      dialogOverlay.classList.remove('show');
      setTimeout(() => dialogOverlay.classList.add('hidden'), 300);
    }
  });

  // iOS Safari / Android Chrome 儲存保護
  const savePomodoroData = () => {
    try {
      localStorage.setItem('pomodoro_config', JSON.stringify(config));
      localStorage.setItem('pomodoro_completed', String(completed));
    } catch (e) {
      console.warn('[pomodoro] 保存數據失敗:', e);
    }
  };

  window.addEventListener('pagehide', savePomodoroData);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') savePomodoroData();
  });
  window.addEventListener('message', (event) => {
    if (event.data?.type === 'APP_WILL_CLOSE') savePomodoroData();
  });

  currentCompanion = loadSelectedCompanion();
  showCompanionCard();

  setMode('focus');
  updateDisplay();
})();

