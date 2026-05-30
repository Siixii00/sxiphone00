(() => {
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
  let isGeneratingMessage = false;

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

  function getCharConfig() {
    let charName = localStorage.getItem('sx_char_name');
    let charPersonality = localStorage.getItem('sx_char_personality');
    let charBackground = localStorage.getItem('sx_char_background');
    let charAvatar = localStorage.getItem('sx_char_avatar');
    
    const savedId = config.companionCharId;
    if (savedId) {
      const raw = localStorage.getItem('sx_characters');
      if (raw) {
        try {
          const chars = JSON.parse(raw);
          const found = chars.find(c => c.id === savedId || c.name === savedId);
          if (found) {
            return {
              id: found.id || found.name,
              name: found.name,
              personality: found.personality || '',
              background: found.background || '',
              avatar: found.avatar || ''
            };
          }
        } catch (e) {}
      }
    }
    
    if (charName && charName !== '預設用戶') {
      const raw = localStorage.getItem('sx_characters');
      if (raw) {
        try {
          const chars = JSON.parse(raw);
          const found = chars.find(c => c.name === charName);
          if (found) {
            return {
              id: found.id || found.name,
              name: found.name,
              personality: found.personality || '',
              background: found.background || '',
              avatar: found.avatar || ''
            };
          }
        } catch (e) {}
      }
      return {
        id: charName,
        name: charName,
        personality: charPersonality || '',
        background: charBackground || '',
        avatar: charAvatar || ''
      };
    }
    
    const masks = JSON.parse(localStorage.getItem('sx_masks') || '[]');
    if (masks.length > 0 && masks[0]) {
      return {
        id: masks[0].name,
        name: masks[0].name,
        personality: masks[0].personality || '',
        background: masks[0].background || '',
        avatar: masks[0].avatar || ''
      };
    }
    
    return { id: 'default', name: 'AI 夥伴', personality: '', background: '', avatar: '' };
  }

  function getUserConfig() {
    return {
      name: localStorage.getItem('sx_user_name') || 'User',
      personality: localStorage.getItem('sx_user_personality') || ''
    };
  }

  function getApiConfig() {
    if (typeof window.SettingsReader !== 'undefined' && window.SettingsReader.getActiveApiWithFallback) {
      return window.SettingsReader.getActiveApiWithFallback();
    }
    
    const raw = localStorage.getItem('api_configs');
    if (!raw) return null;
    
    try {
      const configs = JSON.parse(raw);
      const activeIndexStr = localStorage.getItem('sx_active_api');
      const activeIndex = activeIndexStr !== null ? parseInt(activeIndexStr, 10) : 0;
      const validIndex = (!isNaN(activeIndex) && activeIndex >= 0 && activeIndex < configs.length) ? activeIndex : 0;
      return configs[validIndex] || configs[0] || null;
    } catch {
      return null;
    }
  }

  function loadSelectedCompanion(){
    const charConfig = getCharConfig();
    return {
      id: charConfig.id,
      name: charConfig.name,
      avatar: charConfig.avatar,
      personality: charConfig.personality,
      background: charConfig.background
    };
  }

  function getDefaultEncouragement(charName, userName, phase) {
    const templates = {
      focus: [
        `${userName}加油！專注時間，${charName}陪你一起努力！`,
        `專注中！${userName}做得很好，繼續保持！`,
        `${charName}相信${userName}可以做到！加油！`,
        `專注時間！${userName}再堅持一下！`,
        `${charName}在這裡陪著${userName}，一起加油！`
      ],
      short: [
        `${userName}休息一下！${charName}覺得你做得很好！`,
        `短休時間！${userName}喝口水吧～`,
        `${charName}提醒${userName}休息一下，放鬆眼睛！`,
        `做得好！${userName}稍微休息一下吧！`,
        `${charName}說：${userName}辛苦了，休息一下！`
      ],
      long: [
        `${userName}長休息時間！${charName}覺得你今天很棒！`,
        `做得太棒了！${userName}好好休息一下！`,
        `${charName}恭喜${userName}完成一個循環！休息一下吧！`,
        `太厲害了！${userName}值得好好休息！`,
        `${charName}為${userName}感到驕傲！休息時間到！`
      ]
    };
    const msgs = templates[phase] || templates.focus;
    return msgs[Math.floor(Math.random() * msgs.length)];
  }

  async function generateAIEncouragement(charConfig, userConfig, phase, elapsedMinutes, remainingMinutes) {
    const apiConfig = getApiConfig();
    
    if (!apiConfig || !apiConfig.url) {
      return null;
    }

    const charName = charConfig.name || '角色';
    const charPersonality = charConfig.personality || '';
    const charBackground = charConfig.background || '';
    const userName = userConfig.name || 'User';
    
    const lang = localStorage.getItem('sxiphone_lang') || 'zh-TW';
    
    const phaseDesc = phase === 'focus' ? '專注時間' : phase === 'short' ? '短休息' : '長休息';

    const systemPrompt = `# CHARACTER_PROFILE
## 角色資訊
- 名字: ${charName}
- 性格特質: ${charPersonality || '友善、溫柔'}
- 背景故事: ${charBackground || '無'}

## 角色扮演指南
你現在要扮演 ${charName} 這個角色。請完全沉浸在這個角色中，用角色的視角、語氣和說話方式來生成番茄鐘鼓勵訊息。

# USER_CONTEXT
- 用戶名稱: ${userName}

# RESPONSE_GUIDELINES
1. **角色一致性**: 始終保持 ${charName} 的角色特質，包括說話方式、用詞習慣、情感表達。
2. **語言**: 使用 ${lang} 進行交流。
3. **身分保密**: 絕對不要提及你是 AI 或語言模型。
4. **語氣**: 根據角色性格決定語氣（溫柔/冷淡/活潑/嚴厲等）。
5. **長度**: 簡短自然，15-50字。

輸出格式為 JSON: {"message": "你的鼓勵訊息"}`;

    let contextPrompt = `# 番茄鐘狀態
- 目前階段: ${phaseDesc}
- 已經過時間: ${elapsedMinutes} 分鐘
- 剩餘時間: ${remainingMinutes} 分鐘

請以 ${charName} 的身分，根據上述狀態生成一句鼓勵訊息給 ${userName}。
要求：
1. 必須完全符合角色性格設定
2. 根據階段給出適當的鼓勵（專注時加油、休息時提醒放鬆）
3. 語氣和用詞要符合角色特質
4. 自然親切，像朋友間的提醒`;

    if (phase === 'focus' && remainingMinutes <= 5) {
      contextPrompt += `\n\n注意：專注時間快結束了，可以加強鼓勵${userName}堅持到底。`;
    } else if (phase !== 'focus') {
      contextPrompt += `\n\n注意：這是休息時間，提醒${userName}好好放鬆休息。`;
    }

    try {
      const endpoint = apiConfig.url.endsWith('/chat/completions')
        ? apiConfig.url
        : `${apiConfig.url.replace(/\/$/, '')}/chat/completions`;

      const headers = { 'Content-Type': 'application/json' };
      if (apiConfig.key) {
        headers.Authorization = `Bearer ${apiConfig.key}`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: apiConfig.model || 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: contextPrompt }
          ],
          temperature: 0.9,
          max_tokens: 100
        })
      });

      if (!response.ok) {
        console.warn('[Pomodoro] API 請求失敗:', response.status);
        return null;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      let parsed = null;
      try {
        parsed = JSON.parse(content);
      } catch {
        const match = content.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            parsed = JSON.parse(match[0]);
          } catch {
            return content.trim().replace(/^["']|["']$/g, '');
          }
        }
      }

      return parsed?.message || content.trim().replace(/^["']|["']$/g, '');
    } catch (err) {
      console.warn('[Pomodoro] AI 生成失敗:', err);
      return null;
    }
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
      return { 
        name: currentCompanion.name, 
        avatar: currentCompanion.avatar || '',
        personality: currentCompanion.personality || '',
        background: currentCompanion.background || ''
      };
    }
    
    const charConfig = getCharConfig();
    return {
      name: charConfig.name,
      avatar: charConfig.avatar || '',
      personality: charConfig.personality || '',
      background: charConfig.background || ''
    };
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

  async function pushCompanionLine(){
    if (isGeneratingMessage) return;
    isGeneratingMessage = true;
    
    const charConfig = getCharConfig();
    const userConfig = getUserConfig();
    
    const totalSeconds = config[mode] * 60;
    const elapsedSeconds = totalSeconds - remaining;
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    const remainingMinutes = Math.ceil(remaining / 60);
    
    let message = await generateAIEncouragement(charConfig, userConfig, mode, elapsedMinutes, remainingMinutes);
    
    if (!message) {
      message = getDefaultEncouragement(charConfig.name, userConfig.name, mode);
    }
    
    if (message) {
      showCompanionDialog(message);
    }
    
    isGeneratingMessage = false;
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
              chars.push({ 
                id: c.id || c.name, 
                name: c.name, 
                avatar: c.avatar || '',
                personality: c.personality || '',
                background: c.background || ''
              });
            }
          });
        }
      } catch (e) {}
    }
    const charName = localStorage.getItem('sx_char_name');
    if (charName && !chars.find(c => c.name === charName)) {
      const charAvatar = localStorage.getItem('sx_char_avatar');
      const charPersonality = localStorage.getItem('sx_char_personality') || '';
      const charBackground = localStorage.getItem('sx_char_background') || '';
      chars.push({ 
        id: charName, 
        name: charName, 
        avatar: charAvatar || '',
        personality: charPersonality,
        background: charBackground
      });
    }
    const masks = JSON.parse(localStorage.getItem('sx_masks') || '[]');
    masks.forEach(m => {
      if (m && m.name && !chars.find(c => c.name === m.name)) {
        chars.push({ 
          id: m.name, 
          name: m.name, 
          avatar: m.avatar || '',
          personality: m.personality || '',
          background: m.background || ''
        });
      }
    });
    if (chars.length === 0) {
      chars.push({ id: 'default', name: 'AI 夥伴', avatar: '', personality: '', background: '' });
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
        currentCompanion = { 
          id: char.id, 
          name: char.name, 
          avatar: char.avatar,
          personality: char.personality,
          background: char.background
        };
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
  dialogInput?.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && dialogInput.value.trim()) {
      const userMsg = dialogInput.value.trim();
      addChatMessage(userMsg, false);
      dialogInput.value = '';
      
      const charConfig = getCharConfig();
      const userConfig = getUserConfig();
      
      let response = await generateAIResponse(charConfig, userConfig, userMsg);
      
      if (!response) {
        const responses = ['加油！繼續保持！', '你做得很棒！', '專注得很好！', '再堅持一下！', '太棒了！'];
        response = responses[Math.floor(Math.random() * responses.length)];
      }
      
      setTimeout(() => {
        addChatMessage(response, true);
      }, 800);
    }
  });

  async function generateAIResponse(charConfig, userConfig, userMessage) {
    const apiConfig = getApiConfig();
    if (!apiConfig || !apiConfig.url) return null;
    
    const charName = charConfig.name || '角色';
    const charPersonality = charConfig.personality || '';
    const userName = userConfig.name || 'User';
    const lang = localStorage.getItem('sxiphone_lang') || 'zh-TW';

    const systemPrompt = `# CHARACTER_PROFILE
- 名字: ${charName}
- 性格特質: ${charPersonality || '友善、溫柔'}

你是 ${charName}，正在陪伴 ${userName} 使用番茄鐘專注。
用角色特有的語氣和方式回應用戶，保持角色一致性。
輸出 JSON: {"message": "回應內容"}`;

    try {
      const endpoint = apiConfig.url.endsWith('/chat/completions')
        ? apiConfig.url
        : `${apiConfig.url.replace(/\/$/, '')}/chat/completions`;

      const headers = { 'Content-Type': 'application/json' };
      if (apiConfig.key) headers.Authorization = `Bearer ${apiConfig.key}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: apiConfig.model || 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.9,
          max_tokens: 80
        })
      });

      if (!response.ok) return null;
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      
      try {
        return JSON.parse(content).message;
      } catch {
        const match = content.match(/\{[\s\S]*\}/);
        if (match) {
          try { return JSON.parse(match[0]).message; } catch {}
        }
        return content.trim().replace(/^["']|["']$/g, '').slice(0, 60);
      }
    } catch (e) {
      return null;
    }
  }

  const dialogOverlay = document.getElementById('companion-dialog-overlay');
  dialogOverlay?.addEventListener('click', (e) => {
    if (e.target === dialogOverlay) {
      dialogOverlay.classList.remove('show');
      setTimeout(() => dialogOverlay.classList.add('hidden'), 300);
    }
  });

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