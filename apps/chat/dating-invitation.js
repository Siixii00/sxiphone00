// --- 12. 約會邀請系統 ---
const DatingInvitation = {
  timer: null,
  lastInviteTime: 0,
  scheduledDates: [],
  countdownTimer: null,
  currentInvitation: null
};

const DATING_INVITE_SETTINGS_KEY = 'sx_dating_invite_settings';

function getDatingInviteSettings() {
  const cache = typeof sxStorage !== 'undefined' && sxStorage._cache;
  if (cache && cache.has(DATING_INVITE_SETTINGS_KEY)) {
    try {
      return JSON.parse(cache.get(DATING_INVITE_SETTINGS_KEY));
    } catch (e) {}
  }
  return {
    enabled: true,
    minInterval: 30,
    maxInterval: 120,
    probability: 30
  };
}

async function getDatingInviteSettingsAsync() {
  try {
    const raw = await sxGetItem(DATING_INVITE_SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {
    enabled: true,
    minInterval: 30,
    maxInterval: 120,
    probability: 30
  };
}

function saveDatingInviteSettings(settings) {
  const cache = typeof sxStorage !== 'undefined' && sxStorage._cache;
  if (cache) {
    cache.set(DATING_INVITE_SETTINGS_KEY, JSON.stringify(settings));
  }
}

async function saveDatingInviteSettingsAsync(settings) {
  await sxSetJSON(DATING_INVITE_SETTINGS_KEY, settings);
}

function cleanCOTFromText(text) {
  if (!text) return text;
  let cleaned = text;
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');
  cleaned = cleaned.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
  cleaned = cleaned.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');
  cleaned = cleaned.replace(/\[思考\][\s\S]*?\[\/思考\]/gi, '');
  cleaned = cleaned.replace(/\[THOUGHT\][\s\S]*?\[\/THOUGHT\]/gi, '');
  cleaned = cleaned.replace(/```thinking[\s\S]*?```/gi, '');
  cleaned = cleaned.replace(/```thought[\s\S]*?```/gi, '');
  cleaned = cleaned.replace(/^Let me think.*?\n/i, '');
  cleaned = cleaned.replace(/^Thinking\.\.\..*?\n/i, '');
  cleaned = cleaned.trim();
  const lines = cleaned.split('\n');
  const contentLines = lines.filter(line => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    if (trimmed.startsWith('#') || trimmed.startsWith('-') || trimmed.startsWith('*')) return false;
    if (/^(step|步驟|首先|然後|接著|最後|因此|所以|總結)/i.test(trimmed)) return false;
    return true;
  });
  if (contentLines.length > 0 && contentLines.length < lines.length) {
    cleaned = contentLines.join(' ').trim();
  }
  return cleaned;
}

// 場景對應表
const SCENE_MAP = {
  '咖啡廳': 'cafe',
  '公園': 'park',
  '電影院': 'cinema',
  '餐廳': 'restaurant',
  '海灘': 'beach',
  '圖書館': 'library'
};

// 初始化約會邀請系統
async function initDatingInvitation() {
  const apis = await sxGetJSON('api_configs') || [];
  if (!apis[0] || !apis[0].url) {
    console.log('約會邀請系統：未偵測到 API 配置，跳過初始化');
    return;
  }
  
  const settings = await getDatingInviteSettingsAsync();
  if (!settings.enabled) {
    console.log('約會邀請系統：已停用');
    return;
  }
  
  await loadScheduledDates();
  checkScheduledDates();
  
  const initialDelay = (2 + Math.random() * 3) * 60 * 1000;
  DatingInvitation.timer = setTimeout(() => {
    tryTriggerDatingInvitation();
  }, initialDelay);
  console.log('約會邀請系統已初始化，將在約 ' + Math.round(initialDelay / 60000) + ' 分鐘後檢查');
}

// 載入已排程的約會
function loadScheduledDates() {
  try {
    const stored = await sxGetItem('sx_scheduled_dates');
    if (stored) {
      DatingInvitation.scheduledDates = JSON.parse(stored);
    }
  } catch (e) {
    console.warn('載入已排程約會失敗:', e);
    DatingInvitation.scheduledDates = [];
  }
}

// 儲存已排程的約會
function saveScheduledDates() {
  await sxSetJSON('sx_scheduled_dates', DatingInvitation.scheduledDates);
}

// 檢查是否有到期的約會
function checkScheduledDates() {
  const now = Date.now();
  DatingInvitation.scheduledDates = DatingInvitation.scheduledDates.filter(date => {
    // 如果約會時間已到，發送通知
    if (date.scheduledTime <= now && !date.notified) {
      showDateReminder(date);
      date.notified = true;
    }
    // 移除超過 1 小時的已結束約會
    return date.scheduledTime > now - 60 * 60 * 1000;
  });
  saveScheduledDates();
  
  // 啟動倒數計時更新
  startCountdownTimer();
}

// 顯示約會提醒
async function showDateReminder(date) {
  const reminderHtml = buildDateReminderCard(date);
  appendMsg('other', reminderHtml);
  
  // 存入歷史紀錄（使用 IndexedDB）
  const history = getChatHistory();
  history.push({ role: 'assistant', content: `🔔 約會提醒：與 ${date.charName} 的約會時間到了！` });
  await saveChatHistoryToIndexedDB(history);
  
  // 更新 session
  const activeId = getActiveChatId();
  if (activeId) {
    const sessions = loadChatSessions();
    const target = sessions.find(s => s.id === activeId);
    if (target) {
      target.history = history;
      await saveChatSessionsAsync(sessions);
    }
  }
}

// 嘗試觸發約會邀請
async function tryTriggerDatingInvitation() {
  const settings = getDatingInviteSettings();
  if (!settings.enabled) {
    return;
  }
  
  const now = Date.now();
  const lastTime = DatingInvitation.lastInviteTime;
  const minIntervalMs = settings.minInterval * 60 * 1000;
  
  if (now - lastTime < minIntervalMs) {
    scheduleNextCheck();
    return;
  }

  const probability = settings.probability / 100;
  if (Math.random() > probability) {
    scheduleNextCheck();
    return;
  }

  const session = getActiveSession();
  const history = session ? session.history : [];
  if (history.length < 4) {
    scheduleNextCheck();
    return;
  }

  if (checkBlockStatus()) {
    scheduleNextCheck();
    return;
  }

  await generateDatingInvitation();
  scheduleNextCheck();
}

// 排程下次檢查
function scheduleNextCheck() {
  const settings = getDatingInviteSettings();
  const minDelay = settings.minInterval * 60 * 1000;
  const maxDelay = settings.maxInterval * 60 * 1000;
  const delay = minDelay + Math.random() * (maxDelay - minDelay);
  DatingInvitation.timer = setTimeout(() => {
    tryTriggerDatingInvitation();
  }, delay);
}

// 生成約會邀請
async function generateDatingInvitation() {
  const currentChars = JSON.parse(await sxGetItem('sx_masks') || '[]');
  const activeChar = currentChars[0] || {};
  const charName = activeChar.name || 'AI 助理';
  const charPersonality = activeChar.personality || '友善的助手';
  const charBackground = activeChar.background || '無';
  const userName = await sxGetItem('sx_user_name') || 'User';
  const lang = await sxGetItem('sxiphone_lang') || 'zh-TW';

  // 讀取最近聊天內容作為上下文
  const session = getActiveSession();
  const history = session ? session.history : [];
  const recentHistory = history.slice(-10).map(m => (m.role === 'user' ? userName : charName) + ': ' + m.content).join('\n');

  // 讀取世界書
  const worldbookData = typeof getWorldbookData === 'function' ? getWorldbookData() : {};
  const worldInfoStr = Object.entries(worldbookData)
    .filter(function(entry) { return Array.isArray(entry[1]) && entry[1].length > 0 && entry[0] !== 'sx_detected_forbidden'; })
    .map(function(entry) { return entry[1].map(function(e) { return e.content || ''; }).join('\n'); })
    .join('\n');

  const sceneOptions = ['咖啡廳', '公園', '電影院', '餐廳', '海灘', '圖書館'];
  const randomScene = sceneOptions[Math.floor(Math.random() * sceneOptions.length)];

  const systemPrompt = [
    '# ROLE_SETTING',
    '- Name: ' + charName,
    '- Persona: ' + charPersonality,
    '- Background: ' + charBackground,
    '',
    '# USER_INFO',
    '- Name: ' + userName,
    '',
    '# WORLD_INFO',
    worldInfoStr,
    '',
    '# RECENT_CHAT',
    recentHistory,
    '',
    '# TASK',
    'You are ' + charName + '. You want to invite ' + userName + ' on a date to a ' + randomScene + '.',
    'Generate a natural, in-character message inviting them.',
    'The message should:',
    '- Be 1-3 sentences long',
    '- Feel natural and spontaneous, as if you just thought of it',
    '- Reference your personality and relationship with ' + userName,
    '- Optionally mention the scene (' + randomScene + ') naturally',
    '- Use ' + lang + ' for communication',
    '- Stay in character, never mention you are an AI',
    '- Do NOT use quotes around the message',
    '- Output ONLY the invitation message, nothing else'
  ].join('\n');

  const payload = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: '(系統觸發：請自然地發出約會邀請)' }
  ];

  try {
    let invitationText = await callAIAPI(payload);
    invitationText = cleanCOTFromText(invitationText);
    invitationText = invitationText.trim();
    
    if (!invitationText || invitationText.length < 5) {
      throw new Error('生成的邀請內容過短或為空');
    }

    DatingInvitation.currentInvitation = {
      scene: randomScene,
      charName: charName,
      invitationText: invitationText,
      timestamp: Date.now()
    };

    const cardHtml = buildDatingInvitationCard(invitationText, randomScene, charName);
    appendMsg('other', cardHtml);

    const fullContent = '💌 約會邀請：' + invitationText;
    history.push({ role: 'assistant', content: fullContent });
    await saveChatHistoryToIndexedDB(history);

    const activeId = getActiveChatId();
    if (activeId) {
      const sessions = loadChatSessions();
      const target = sessions.find(function(s) { return s.id === activeId; });
      if (target) {
        target.history = history;
        await saveChatSessionsAsync(sessions);
      }
    }

    window.parent?.postMessage({
      type: 'MEMORY_CHAT_EVENT',
      payload: { role: 'assistant', content: fullContent, source: 'chat:dating-invite' }
    }, '*');

    DatingInvitation.lastInviteTime = Date.now();
    console.log('約會邀請已發送：', invitationText);
  } catch (err) {
    console.error('生成約會邀請失敗：', err);
    // 使用預設邀請
    const fallbackInvitations = [
      '嘿 ' + userName + '，要不要一起去約會？我找到了一個不錯的地方！',
      userName + '，最近好嗎？要不要一起出去走走？',
      '我好久沒見到你了，要不要一起去' + randomScene + '坐坐？'
    ];
    const fallbackText = fallbackInvitations[Math.floor(Math.random() * fallbackInvitations.length)];
    
    DatingInvitation.currentInvitation = {
      scene: randomScene,
      charName: charName,
      invitationText: fallbackText,
      timestamp: Date.now()
    };
    
    const cardHtml = buildDatingInvitationCard(fallbackText, randomScene, charName);
    appendMsg('other', cardHtml);
    const fullContent = '💌 約會邀請：' + fallbackText;
    history.push({ role: 'assistant', content: fullContent });
    await saveChatHistoryToIndexedDB(history);
    
    const activeId = getActiveChatId();
    if (activeId) {
      const sessions = loadChatSessions();
      const target = sessions.find(function(s) { return s.id === activeId; });
      if (target) {
        target.history = history;
        await saveChatSessionsAsync(sessions);
      }
    }
    
    DatingInvitation.lastInviteTime = Date.now();
  }
}

// 建立約會邀請卡片
function buildDatingInvitationCard(text, scene, charName) {
  const sceneEmojis = {
    '咖啡廳': '☕',
    '公園': '🌳',
    '電影院': '🎬',
    '餐廳': '🍽️',
    '海灘': '🏖️',
    '圖書館': '📚'
  };
  const emoji = sceneEmojis[scene] || '💕';
  const inviteId = 'invite-' + Date.now();
  
  return '<div class="dating-invite-card" id="' + inviteId + '">' +
    '<div class="dating-invite-header">' + emoji + ' 約會邀請</div>' +
    '<div class="dating-invite-char">' + charName + ' 邀請你去約會</div>' +
    '<div class="dating-invite-text">' + text + '</div>' +
    '<div class="dating-invite-scene">📍 地點：' + scene + '</div>' +
    '<div class="dating-invite-actions">' +
      '<button class="dating-invite-accept-btn" onclick="acceptDatingInvite(\'' + scene + '\', \'' + inviteId + '\')">✓ 接受邀請</button>' +
      '<button class="dating-invite-reject-btn" onclick="rejectDatingInvite(\'' + inviteId + '\')">✗ 婉拒</button>' +
    '</div>' +
    '<div class="dating-invite-time-select" id="time-select-' + inviteId + '" style="display:none;">' +
      '<div class="time-select-label">選擇約會時間：</div>' +
      '<div class="time-options">' +
        '<button class="time-option-btn" onclick="scheduleDate(\'' + scene + '\', 5, \'' + inviteId + '\')">5 分鐘後</button>' +
        '<button class="time-option-btn" onclick="scheduleDate(\'' + scene + '\', 15, \'' + inviteId + '\')">15 分鐘後</button>' +
        '<button class="time-option-btn" onclick="scheduleDate(\'' + scene + '\', 30, \'' + inviteId + '\')">30 分鐘後</button>' +
        '<button class="time-option-btn" onclick="scheduleDate(\'' + scene + '\', 60, \'' + inviteId + '\')">1 小時後</button>' +
      '</div>' +
    '</div>' +
  '</div>';
}

// 接受約會邀請
function acceptDatingInvite(scene, inviteId) {
  const card = document.getElementById(inviteId);
  if (!card) return;
  
  // 顯示時間選擇區
  const timeSelect = document.getElementById('time-select-' + inviteId);
  if (timeSelect) {
    timeSelect.style.display = 'block';
  }
  
  // 隱藏接受/拒絕按鈕
  const actions = card.querySelector('.dating-invite-actions');
  if (actions) {
    actions.style.display = 'none';
  }
}

// 排程約會
function scheduleDate(scene, minutes, inviteId) {
  const scheduledTime = Date.now() + minutes * 60 * 1000;
  const currentChars = JSON.parse(await sxGetItem('sx_masks') || '[]');
  const activeChar = currentChars[0] || {};
  const charName = activeChar.name || 'AI 助理';
  
  const dateInfo = {
    id: 'date-' + Date.now(),
    scene: scene,
    sceneId: SCENE_MAP[scene] || 'cafe',
    charName: charName,
    scheduledTime: scheduledTime,
    createdAt: Date.now(),
    notified: false
  };
  
  DatingInvitation.scheduledDates.push(dateInfo);
  saveScheduledDates();
  
  // 更新卡片顯示
  const card = document.getElementById(inviteId);
  if (card) {
    card.innerHTML = buildScheduledDateCard(dateInfo);
  }
  
  // 發送確認訊息
  const timeStr = formatTimeRemaining(scheduledTime);
  const confirmMsg = '好的！我們約定在 ' + timeStr + ' 去' + scene + '約會吧！期待見到你～ 💕';
  appendMsg('mine', confirmMsg);
  
  // 存入歷史（使用 IndexedDB）
  const history = getChatHistory();
  history.push({ role: 'user', content: confirmMsg });
  await saveChatHistoryToIndexedDB(history);
  
  // 更新 session
  const activeId = getActiveChatId();
  if (activeId) {
    const sessions = loadChatSessions();
    const target = sessions.find(s => s.id === activeId);
    if (target) {
      target.history = history;
      await saveChatSessionsAsync(sessions);
    }
  }
  
  // 啟動倒數計時
  startCountdownTimer();
  
  console.log('約會已排程：', dateInfo);
}

// 建立已排程約會卡片
function buildScheduledDateCard(dateInfo) {
  const sceneEmojis = {
    '咖啡廳': '☕',
    '公園': '🌳',
    '電影院': '🎬',
    '餐廳': '🍽️',
    '海灘': '🏖️',
    '圖書館': '📚'
  };
  const emoji = sceneEmojis[dateInfo.scene] || '💕';
  
  return '<div class="dating-scheduled-card" id="' + dateInfo.id + '">' +
    '<div class="scheduled-header">' + emoji + ' 已排程約會</div>' +
    '<div class="scheduled-info">' +
      '<div class="scheduled-char">與 ' + dateInfo.charName + ' 的約會</div>' +
      '<div class="scheduled-scene">📍 ' + dateInfo.scene + '</div>' +
      '<div class="scheduled-time">🕐 約會時間：<span class="countdown" data-time="' + dateInfo.scheduledTime + '"></span></div>' +
    '</div>' +
    '<div class="scheduled-actions">' +
      '<button class="start-date-btn" onclick="startDateNow(\'' + dateInfo.id + '\')">🚀 立即開始</button>' +
      '<button class="cancel-date-btn" onclick="cancelDate(\'' + dateInfo.id + '\')">取消約會</button>' +
    '</div>' +
  '</div>';
}

// 建立約會提醒卡片
function buildDateReminderCard(dateInfo) {
  const sceneEmojis = {
    '咖啡廳': '☕',
    '公園': '🌳',
    '電影院': '🎬',
    '餐廳': '🍽️',
    '海灘': '🏖️',
    '圖書館': '📚'
  };
  const emoji = sceneEmojis[dateInfo.scene] || '💕';
  
  return '<div class="dating-reminder-card">' +
    '<div class="reminder-header">🔔 約會時間到了！</div>' +
    '<div class="reminder-info">' +
      '<div class="reminder-char">' + dateInfo.charName + ' 正在等你</div>' +
      '<div class="reminder-scene">' + emoji + ' ' + dateInfo.scene + '</div>' +
    '</div>' +
    '<button class="start-date-btn urgent" onclick="startDateNow(\'' + dateInfo.id + '\')">💕 立即赴約</button>' +
  '</div>';
}

// 立即開始約會
function startDateNow(dateId) {
  const dateInfo = DatingInvitation.scheduledDates.find(d => d.id === dateId);
  const sceneId = dateInfo ? dateInfo.sceneId : 'cafe';
  
  // 從已排程列表中移除
  DatingInvitation.scheduledDates = DatingInvitation.scheduledDates.filter(d => d.id !== dateId);
  saveScheduledDates();
  
  // 通知主框架開啟約會 App
  window.parent?.postMessage({
    type: 'openApp',
    appId: 'dating',
    scene: sceneId,
    source: 'chat-invitation'
  }, '*');
  
  console.log('開始約會，場景：', sceneId);
}

// 取消約會
function cancelDate(dateId) {
  DatingInvitation.scheduledDates = DatingInvitation.scheduledDates.filter(d => d.id !== dateId);
  saveScheduledDates();
  
  // 移除卡片
  const card = document.getElementById(dateId);
  if (card) {
    card.innerHTML = '<div class="date-cancelled">約會已取消</div>';
    setTimeout(() => card.remove(), 2000);
  }
  
  console.log('約會已取消：', dateId);
}

// 婉拒約會邀請
async function rejectDatingInvite(inviteId) {
  const card = document.getElementById(inviteId);
  if (card) {
    card.innerHTML = '<div class="invite-rejected">已婉拒邀請</div>';
    setTimeout(() => card.remove(), 2000);
  }
  
  // 發送婉拒訊息
  const rejectMsg = '抱歉，我現在不太方便...下次再說好嗎？';
  appendMsg('mine', rejectMsg);
  
  // 存入歷史（使用 IndexedDB）
  const history = getChatHistory();
  history.push({ role: 'user', content: rejectMsg });
  await saveChatHistoryToIndexedDB(history);
  
  // 更新 session
  const activeId = getActiveChatId();
  if (activeId) {
    const sessions = loadChatSessions();
    const target = sessions.find(s => s.id === activeId);
    if (target) {
      target.history = history;
      await saveChatSessionsAsync(sessions);
    }
  }
  
  DatingInvitation.currentInvitation = null;
  console.log('已婉拒約會邀請');
}

// 啟動倒數計時器
function startCountdownTimer() {
  if (DatingInvitation.countdownTimer) {
    clearInterval(DatingInvitation.countdownTimer);
  }
  
  DatingInvitation.countdownTimer = setInterval(() => {
    updateCountdowns();
    checkScheduledDates();
  }, 1000);
}

// 更新所有倒數計時顯示
function updateCountdowns() {
  const countdowns = document.querySelectorAll('.countdown');
  const now = Date.now();
  
  countdowns.forEach(el => {
    const targetTime = parseInt(el.dataset.time);
    if (!targetTime) return;
    
    const remaining = targetTime - now;
    if (remaining <= 0) {
      el.textContent = '現在！';
    } else {
      el.textContent = formatTimeRemaining(targetTime);
    }
  });
}

// 格式化剩餘時間
function formatTimeRemaining(targetTime) {
  const now = Date.now();
  const remaining = targetTime - now;
  
  if (remaining <= 0) return '現在！';
  
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  
  if (minutes > 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours + ' 小時 ' + mins + ' 分鐘後';
  } else if (minutes > 0) {
    return minutes + ' 分 ' + seconds + ' 秒後';
  } else {
    return seconds + ' 秒後';
  }
}

// 監聽來自 dating app 的訊息
window.addEventListener('message', async (event) => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;
  
  if (data.type === 'DATING_ENDED') {
    // 存入歷史（使用 IndexedDB）
    const history = getChatHistory();
    history.push({ role: 'assistant', content: '💕 約會結束了，期待下次再一起出去玩！' });
    await saveChatHistoryToIndexedDB(history);
    
    // 更新 session
    const activeId = getActiveChatId();
    if (activeId) {
      const sessions = loadChatSessions();
      const target = sessions.find(s => s.id === activeId);
      if (target) {
        target.history = history;
        await saveChatSessionsAsync(sessions);
      }
    }
    
    renderHistory();
  }
});

function initDatingInviteSettings() {
  const toggle = document.getElementById('dating-invite-toggle');
  const status = document.getElementById('dating-invite-status');
  const probabilityInput = document.getElementById('dating-invite-probability');
  const minIntervalInput = document.getElementById('dating-invite-min-interval');
  const maxIntervalInput = document.getElementById('dating-invite-max-interval');
  
  const settings = getDatingInviteSettings();
  
  if (toggle) toggle.checked = settings.enabled;
  if (status) status.textContent = settings.enabled ? '已啟用自動發起' : '關閉時不會自動發起';
  if (probabilityInput) probabilityInput.value = settings.probability;
  if (minIntervalInput) minIntervalInput.value = settings.minInterval;
  if (maxIntervalInput) maxIntervalInput.value = settings.maxInterval;
  
  const saveSettings = () => {
    const newSettings = {
      enabled: toggle?.checked ?? true,
      probability: parseInt(probabilityInput?.value) || 30,
      minInterval: parseInt(minIntervalInput?.value) || 30,
      maxInterval: parseInt(maxIntervalInput?.value) || 120
    };
    
    if (newSettings.minInterval > newSettings.maxInterval) {
      newSettings.maxInterval = newSettings.minInterval;
      if (maxIntervalInput) maxIntervalInput.value = newSettings.maxInterval;
    }
    
    saveDatingInviteSettings(newSettings);
    if (status) status.textContent = newSettings.enabled ? '已啟用自動發起' : '關閉時不會自動發起';
  };
  
  toggle?.addEventListener('change', saveSettings);
  probabilityInput?.addEventListener('change', saveSettings);
  minIntervalInput?.addEventListener('change', saveSettings);
  maxIntervalInput?.addEventListener('change', saveSettings);
}
