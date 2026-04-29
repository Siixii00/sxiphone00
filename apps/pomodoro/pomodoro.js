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
    showCompanionCard();
    companionTimer = setInterval(pushCompanionLine, (config.companionInterval || 5) * 60 * 1000);
    // 立即推一句，避免等待間隔
    pushCompanionLine();
  }

  function stopCompanion(){
    if (companionTimer) clearInterval(companionTimer);
    companionTimer = null;
  }

  function getActiveMask(){
    // 優先從 sx_char_name / sx_char_avatar 讀取當前激活角色
    const charName = localStorage.getItem('sx_char_name');
    const charAvatar = localStorage.getItem('sx_char_avatar');
    
    if (charName && charName !== '預設用戶') {
      return { name: charName, avatar: charAvatar || '' };
    }
    
    // 其次檢查 sx_masks
    const masks = JSON.parse(localStorage.getItem('sx_masks') || '[]');
    if (masks.length > 0 && masks[0] && masks[0].name) {
      return { 
        name: masks[0].name, 
        avatar: masks[0].avatar || '' 
      };
    }
    
    // 最後使用預設值
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

  function pushCompanionLine(){
    const line = pickLine();
    companionLine.textContent = line;
    if (line) {
      companionBubble.textContent = line;
      companionBubble.classList.remove('hidden');
      setTimeout(() => companionBubble.classList.add('hidden'), 5000);
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

  setMode('focus');
  updateDisplay();
})();

