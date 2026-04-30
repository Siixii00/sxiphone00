const tabs = document.querySelectorAll('.tab');
const feed = document.getElementById('feed');
const modal = document.getElementById('video-modal');
const modalPlayer = document.getElementById('video-player');
const modalUrlInput = document.getElementById('video-url');
const addModal = document.getElementById('add-video-modal');
const addTitleInput = document.getElementById('add-video-title');
const addUrlInput = document.getElementById('add-video-url');
const addThumbFileInput = document.getElementById('add-video-thumb-file');
const addThumbPreview = document.getElementById('bili-thumb-preview');
const addTagSelect = document.getElementById('add-video-tag');
const homeView = document.getElementById('home-view');
const playerPage = document.getElementById('player-page');
const playerFrame = document.querySelector('#player-video iframe');
const playerTitle = document.getElementById('player-title');
const playerSub = document.getElementById('player-sub');
const meView = document.getElementById('me-view');
const searchRow = document.querySelector('.search-row');
const tabsBar = document.getElementById('tabs');
const meName = document.getElementById('me-name');
const meSub = document.getElementById('me-sub');
const meAvatar = document.getElementById('me-avatar');
const charHistoryBtn = document.getElementById('char-history-btn');
const charHistoryView = document.getElementById('char-history');
const charHistorySelect = document.getElementById('char-history-select');
const charHistoryList = document.getElementById('char-history-list');
const danmuLayer = document.getElementById('danmu-layer');
const danmuToggle = document.getElementById('danmu-toggle');
const charWatchSelect = document.getElementById('char-watch-select');
const npcList = document.getElementById('npc-list');
const npcCount = document.getElementById('npc-count');

const messagesView = document.getElementById('messages-view');
const messagesContent = document.getElementById('messages-content');
const chatView = document.getElementById('chat-view');
const chatMessages = document.getElementById('chat-messages');
const chatTitle = document.getElementById('chat-title');
const chatInput = document.getElementById('chat-input');

// 全域狀態變數
let uploadedThumbData = null;
let pendingVideoData = null;
let currentWatchingChar = null;
let danmuEnabled = true;
let danmuTimer = null;
let activeNPCs = [];
let charCommentTimer = null;

const thumbnailColors = [
    ['#ffd5e5', '#ff8fb1'],
    ['#a8edea', '#fed6e3'],
    ['#667eea', '#764ba2'],
    ['#f093fb', '#f5576c'],
    ['#4facfe', '#00f2fe'],
    ['#43e97b', '#38f9d7']
];

const titlePool = [];
const tagPool = [];

const sample = {
    recommend: [],
    anime: [],
    live: [],
    hot: [],
    games: []
};

const CHAR_LIST_KEY = 'sx_characters';
const NPC_LIST_KEY = 'sx_npcs';
const MESSAGES_STORAGE_KEY = 'sx_bili_messages';
const CHAT_STORAGE_KEY = 'sx_bili_chats';

const saveBiliData = () => {
    try {
        const messages = loadMessagesData();
        const chats = loadChatData();
        localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chats));
        console.log("B站數據已保存至 localStorage");
    } catch (e) {
        console.error("保存B站數據失敗:", e);
    }
};

const saveToPersistentStorage = async () => {
    saveBiliData();
    if (typeof localforage !== 'undefined') {
        try {
            const messages = loadMessagesData();
            const chats = loadChatData();
            const existingData = await localforage.getItem('sx_app_persisted_data') || {};
            await localforage.setItem('sx_app_persisted_data', {
                ...existingData,
                sx_bili_messages: messages,
                sx_bili_chats: chats
            });
            console.log("B站數據已保存至 IndexedDB");
        } catch (e) {
            console.error("IndexedDB 保存失敗:", e);
        }
    }
};

window.addEventListener('pagehide', () => {
    saveBiliData();
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        saveBiliData();
    }
});

window.addEventListener('message', (event) => {
    if (event.data?.type === 'APP_WILL_CLOSE') {
        saveBiliData();
    }
});

let currentMsgTab = 'notifications';
let currentChatUser = null;
let chatData = {};

const editProfileModal = document.getElementById('edit-profile-modal');
const editNameInput = document.getElementById('edit-user-name');
const editSubInput = document.getElementById('edit-user-sub');
const editBackgroundInput = document.getElementById('edit-user-background');
const editAvatarFileInput = document.getElementById('edit-avatar-file');
const editAvatarPreview = document.getElementById('edit-avatar-preview');

let uploadedAvatarData = null;

const notificationTemplates = [
  { type: 'subscribe', icon: 'user-plus', title: '新粉絲', templates: ['關注了你', '成為了你的粉絲', '開始追蹤你'] },
  { type: 'like', icon: 'heart', title: '收穫讚', templates: ['讚了你的影片', '喜歡了你的動態', '給你的評論點讚'] },
  { type: 'comment', icon: 'comment', title: '新留言', templates: ['評論了你的影片', '回覆了你的評論', '在你的影片下留言'] },
  { type: 'at', icon: 'at', title: '@提醒', templates: ['在評論中提到了你', '在影片中@了你', '邀請你一起觀看'] },
  { type: 'system', icon: 'bell', title: '系統通知', templates: ['你的影片已通過審核', '會員即將到期', '活動獎勵已發放', '新功能上線通知'] }
];

const chatUserNames = [
  '小櫻', '阿明', '美琪', '大偉', '小雪', '阿傑', '小芳', '阿豪',
  '琪琪', '小龍', '阿寶', '小美', '阿強', '小玲', '阿輝', '小君',
  '星空', '月光', '流星', '彩虹', '白雲', '微風', '晨曦', '晚霞'
];

const chatMessageTemplates = {
  received: [
    '你好呀～最近在追什麼番？',
    '那個影片超好看的！',
    '明天要一起看直播嗎？',
    '推薦你一部新番！',
    '你的影片做得好棒！',
    '最近有什麼好看的嗎？',
    '哈哈那個梗太笑了',
    '這週末有空嗎？',
    '我找到一個超讚的MAD',
    '你追的那部番更新了！'
  ],
  sent: [
    '好喔！',
    '真的假的',
    '我看看',
    '不錯耶',
    '推推',
    '好笑死',
    '謝啦',
    '晚點回你',
    '收到',
    'OK'
  ]
};

const HISTORY_TOPICS = [];

function randomPick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function getUserProfile() {
  const name = localStorage.getItem('sx_user_name') || 'SXi User';
  const avatar = localStorage.getItem('sx_user_avatar') || '';
  const background = localStorage.getItem('sx_user_background') || '';
  return { name, avatar, background };
}

function renderUserProfile() {
  if (!meView) return;
  const { name, avatar, background } = getUserProfile();
  if (meName) meName.textContent = name;
  if (meSub) meSub.textContent = background || 'Lv.5 · 追番中';
  if (meAvatar) {
    if (avatar) {
      meAvatar.style.backgroundImage = `url('${avatar}')`;
      meAvatar.style.backgroundSize = 'cover';
      meAvatar.style.backgroundPosition = 'center';
    } else {
      meAvatar.style.backgroundImage = '';
    }
  }
}

function openEditProfileModal() {
  const { name, avatar, background } = getUserProfile();
  editProfileModal?.removeAttribute('hidden');
  if (editNameInput) editNameInput.value = name;
  if (editBackgroundInput) editBackgroundInput.value = background || '';
  if (editSubInput) editSubInput.value = background || 'Lv.5 · 追番中';
  uploadedAvatarData = avatar || null;
  
  if (editAvatarPreview) {
    if (avatar) {
      editAvatarPreview.style.backgroundImage = `url('${avatar}')`;
      editAvatarPreview.classList.add('has-image');
      editAvatarPreview.innerHTML = '';
    } else {
      editAvatarPreview.style.backgroundImage = '';
      editAvatarPreview.classList.remove('has-image');
      editAvatarPreview.innerHTML = '<i class="fas fa-user"></i><span>點擊上傳頭像</span>';
    }
  }
  editNameInput?.focus();
}

function closeEditProfileModal() {
  editProfileModal?.setAttribute('hidden', '');
  uploadedAvatarData = null;
}

function handleAvatarUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  
  if (!file.type.startsWith('image/')) {
    alert('請選擇圖片檔案');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    uploadedAvatarData = e.target.result;
    if (editAvatarPreview) {
      editAvatarPreview.style.backgroundImage = `url('${uploadedAvatarData}')`;
      editAvatarPreview.classList.add('has-image');
      editAvatarPreview.innerHTML = '';
    }
  };
  reader.readAsDataURL(file);
}

function clearAvatarUpload() {
  uploadedAvatarData = null;
  if (editAvatarFileInput) editAvatarFileInput.value = '';
  if (editAvatarPreview) {
    editAvatarPreview.style.backgroundImage = '';
    editAvatarPreview.classList.remove('has-image');
    editAvatarPreview.innerHTML = '<i class="fas fa-user"></i><span>點擊上傳頭像</span>';
  }
}

function saveProfile() {
  const name = editNameInput?.value.trim() || 'SXi User';
  const background = editBackgroundInput?.value.trim() || editSubInput?.value.trim() || '';
  
  localStorage.setItem('sx_user_name', name);
  localStorage.setItem('sx_user_background', background);
  
  if (uploadedAvatarData) {
    localStorage.setItem('sx_user_avatar', uploadedAvatarData);
  } else if (!editAvatarPreview?.classList.contains('has-image')) {
    localStorage.removeItem('sx_user_avatar');
  }
  
  renderUserProfile();
  closeEditProfileModal();
}

function loadMessagesData() {
  try {
    const raw = localStorage.getItem(MESSAGES_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { notifications: [], chats: [], system: [] };
}

function saveMessagesData(data) {
  localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(data));
}

function loadChatData() {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveChatData(data) {
  localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(data));
}

function generateRandomTime() {
  const units = ['分鐘', '小時', '天'];
  const unit = randomPick(units);
  const value = Math.floor(Math.random() * 12) + 1;
  return `${value} ${unit}前`;
}

function generateNotifications(count = 8) {
  const notifications = [];
  for (let i = 0; i < count; i++) {
    const template = randomPick(notificationTemplates);
    notifications.push({
      id: `notif_${Date.now()}_${i}`,
      type: template.type,
      icon: template.icon,
      title: template.title,
      desc: `${randomPick(chatUserNames)} ${randomPick(template.templates)}`,
      time: generateRandomTime(),
      read: Math.random() > 0.3
    });
  }
  return notifications;
}

function generateSystemNotifications(count = 5) {
  const systemMessages = [
    { title: '會員提醒', desc: '你的大會員將在 7 天後到期，續費享 9 折優惠！', icon: 'crown' },
    { title: '創作激勵', desc: '本月創作激勵金已發放，共 ¥128.50', icon: 'coins' },
    { title: '活動通知', desc: '「夏日祭」活動已開始，參與贏取限定頭像框！', icon: 'gift' },
    { title: '安全提醒', desc: '你的帳號在新裝置登入，如非本人操作請修改密碼', icon: 'shield-alt' },
    { title: '更新通知', desc: 'App 已更新至最新版本，體驗全新功能', icon: 'download' },
    { title: '審核通過', desc: '你投稿的影片「夏日VLOG」已通過審核', icon: 'check-circle' },
    { title: '粉絲成就', desc: '恭喜！你的粉絲數突破 1000 大關！', icon: 'users' }
  ];
  
  return systemMessages.slice(0, count).map((msg, i) => ({
    id: `sys_${Date.now()}_${i}`,
    type: 'system',
    icon: msg.icon,
    title: msg.title,
    desc: msg.desc,
    time: generateRandomTime(),
    read: Math.random() > 0.5
  }));
}

function generateChatUsers(count = 6) {
  const users = [];
  const shuffledNames = [...chatUserNames].sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < count; i++) {
    const name = shuffledNames[i];
    users.push({
      id: `user_${Date.now()}_${i}`,
      name,
      avatar: '',
      lastMessage: randomPick(chatMessageTemplates.received),
      time: generateRandomTime(),
      unread: Math.floor(Math.random() * 5)
    });
  }
  return users;
}

function generateChatHistory(userId, count = 10) {
  const messages = [];
  for (let i = 0; i < count; i++) {
    const isReceived = Math.random() > 0.4;
    messages.push({
      id: `msg_${Date.now()}_${i}`,
      type: isReceived ? 'received' : 'sent',
      text: randomPick(isReceived ? chatMessageTemplates.received : chatMessageTemplates.sent),
      time: new Date(Date.now() - (count - i) * 60000 * Math.random() * 30).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
    });
  }
  return messages.sort((a, b) => new Date(a.time) - new Date(b.time));
}

function refreshMessages() {
  const data = {
    notifications: generateNotifications(8),
    chats: generateChatUsers(6),
    system: generateSystemNotifications(5)
  };
  saveMessagesData(data);
  return data;
}

function renderNotifications(notifications) {
  if (!messagesContent) return;
  
  if (!notifications || notifications.length === 0) {
    messagesContent.innerHTML = `
      <div class="empty-state">
        <i class="far fa-bell"></i>
        <div class="empty-state-title">暫無通知</div>
        <div class="empty-state-desc">新的通知會顯示在這裡</div>
      </div>
    `;
    return;
  }
  
  messagesContent.innerHTML = notifications.map(notif => `
    <div class="notification-item" data-notif-id="${notif.id}">
      <div style="display:flex;align-items:center;gap:10px;">
        <div class="notification-icon ${notif.type}">
          <i class="fas fa-${notif.icon}"></i>
        </div>
        <div class="notification-content">
          <div class="notification-title">${notif.title}</div>
          <div class="notification-desc">${notif.desc}</div>
        </div>
      </div>
      <div class="notification-time">${notif.time}</div>
    </div>
  `).join('');
}

function renderChats(chats) {
  if (!messagesContent) return;
  
  if (!chats || chats.length === 0) {
    messagesContent.innerHTML = `
      <div class="empty-state">
        <i class="far fa-comment-dots"></i>
        <div class="empty-state-title">暫無私訊</div>
        <div class="empty-state-desc">開始和好友聊天吧</div>
      </div>
    `;
    return;
  }
  
  messagesContent.innerHTML = chats.map(chat => `
    <div class="message-item" data-chat-user-id="${chat.id}" data-chat-name="${chat.name}">
      <div class="message-avatar"></div>
      <div class="message-info">
        <div class="message-name">${chat.name}</div>
        <div class="message-preview">${chat.lastMessage}</div>
      </div>
      <div class="message-meta">
        <div class="message-time">${chat.time}</div>
        ${chat.unread > 0 ? `<div class="message-badge">${chat.unread}</div>` : ''}
      </div>
    </div>
  `).join('');
}

function renderSystemNotifications(system) {
  if (!messagesContent) return;
  
  if (!system || system.length === 0) {
    messagesContent.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-cog"></i>
        <div class="empty-state-title">暫無系統通知</div>
      </div>
    `;
    return;
  }
  
  messagesContent.innerHTML = system.map(notif => `
    <div class="notification-item" data-sys-id="${notif.id}">
      <div style="display:flex;align-items:center;gap:10px;">
        <div class="notification-icon system">
          <i class="fas fa-${notif.icon}"></i>
        </div>
        <div class="notification-content">
          <div class="notification-title">${notif.title}</div>
          <div class="notification-desc">${notif.desc}</div>
        </div>
      </div>
      <div class="notification-time">${notif.time}</div>
    </div>
  `).join('');
}

function renderMessagesTab(tab) {
  currentMsgTab = tab;
  
  document.querySelectorAll('.msg-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.msg-tab[data-msg-tab="${tab}"]`)?.classList.add('active');
  
  let data = loadMessagesData();
  if (!data.notifications || data.notifications.length === 0) {
    data = refreshMessages();
  }
  
  switch (tab) {
    case 'notifications':
      renderNotifications(data.notifications);
      break;
    case 'chats':
      renderChats(data.chats);
      break;
    case 'system':
      renderSystemNotifications(data.system);
      break;
  }
}

function openMessagesView() {
  homeView?.setAttribute('hidden', '');
  playerPage?.setAttribute('hidden', '');
  meView?.setAttribute('hidden', '');
  charHistoryView?.setAttribute('hidden', '');
  chatView?.setAttribute('hidden', '');
  searchRow?.setAttribute('hidden', '');
  tabsBar?.setAttribute('hidden', '');
  messagesView?.removeAttribute('hidden');
  
  refreshMessages();
  renderMessagesTab('notifications');
}

function closeMessagesView() {
  messagesView?.setAttribute('hidden', '');
  homeView?.removeAttribute('hidden');
  searchRow?.removeAttribute('hidden');
  tabsBar?.removeAttribute('hidden');
}

function openChatView(userId, userName) {
  currentChatUser = { id: userId, name: userName };
  
  chatData = loadChatData();
  if (!chatData[userId]) {
    chatData[userId] = generateChatHistory(userId, 8);
    saveChatData(chatData);
  }
  
  messagesView?.setAttribute('hidden', '');
  chatView?.removeAttribute('hidden');
  
  if (chatTitle) chatTitle.textContent = userName;
  renderChatMessages(chatData[userId]);
  
  if (chatInput) chatInput.focus();
}

function closeChatView() {
  chatView?.setAttribute('hidden', '');
  messagesView?.removeAttribute('hidden');
  currentChatUser = null;
}

function renderChatMessages(messages) {
  if (!chatMessages) return;
  
  chatMessages.innerHTML = messages.map(msg => `
    <div class="chat-bubble ${msg.type}">
      <div>${msg.text}</div>
      <div class="chat-bubble-time">${msg.time}</div>
    </div>
  `).join('');
  
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sendMessage() {
  if (!chatInput || !currentChatUser) return;
  
  const text = chatInput.value.trim();
  if (!text) return;
  
  const userId = currentChatUser.id;
  chatData = loadChatData();
  
  if (!chatData[userId]) {
    chatData[userId] = [];
  }
  
  const newMessage = {
    id: `msg_${Date.now()}`,
    type: 'sent',
    text,
    time: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
  };
  
  chatData[userId].push(newMessage);
  saveChatData(chatData);
  
  renderChatMessages(chatData[userId]);
  chatInput.value = '';
  
  setTimeout(() => {
    const reply = {
      id: `msg_${Date.now()}_reply`,
      type: 'received',
      text: randomPick(chatMessageTemplates.received),
      time: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
    };
    chatData[userId].push(reply);
    saveChatData(chatData);
    renderChatMessages(chatData[userId]);
  }, 1000 + Math.random() * 2000);
}

function randomViews() {
  const values = ['12萬', '38萬', '76萬', '102萬', '188萬', '256萬', '320萬'];
  return randomPick(values);
}

function randomDanmu() {
  const values = ['1,120', '2,580', '6,200', '9,450', '1.3萬', '2.1萬'];
  return randomPick(values);
}

function generateThumbnail() {
  const colors = randomPick(thumbnailColors);
  const patterns = [
    `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
    `linear-gradient(45deg, ${colors[0]}, ${colors[1]})`,
    `linear-gradient(90deg, ${colors[0]}, ${colors[1]})`,
    `radial-gradient(circle at 30% 30%, ${colors[0]}, ${colors[1]})`,
    `radial-gradient(circle at 70% 70%, ${colors[0]}, ${colors[1]})`,
    `conic-gradient(from 90deg, ${colors[0]}, ${colors[1]}, ${colors[0]})`
  ];
  return randomPick(patterns);
}

function generateFreshFeed(tab) {
  return [];
}

function loadCharList() {
  const raw = localStorage.getItem(CHAR_LIST_KEY) || '[]';
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function renderCharHistorySelect() {
  if (!charHistorySelect) return;
  const chars = loadCharList();
  if (!chars.length) {
    charHistorySelect.innerHTML = '<option value="">尚未建立角色</option>';
    return;
  }
  charHistorySelect.innerHTML = chars.map((char, index) => {
    const name = char?.name || `角色 ${index + 1}`;
    return `<option value="${index}">${name}</option>`;
  }).join('');
}

let isGeneratingCharHistory = false;

async function generateCharHistory(char, count = 6) {
  if (!char) {
    return [];
  }

  if (isGeneratingCharHistory) {
    return [];
  }

  isGeneratingCharHistory = true;

  try {
    const context = buildBilibiliContext();
    const lang = localStorage.getItem('sxiphone_lang') || 'zh-TW';

    const systemPrompt = `你是一位專業的 B站內容分析師，擅長根據角色性格、背景和興趣，推測該角色可能會搜尋和觀看的影片類型。
請使用 ${window.getAIReadableLangName?.(lang) || '繁體中文'} 撰寫。
輸出格式為 JSON: {"history": [{"title": "搜尋標題", "query": "搜尋關鍵字", "summary": "簡短描述"}]}`;

    const prompt = `${context}

請根據以上角色設定，生成 ${count} 個該角色可能會搜尋的 B站影片瀏覽紀錄，要求：
1. 符合角色的性格、背景和興趣
2. 搜尋標題要有吸引力且符合角色會關注的主題
3. 可以是動漫、遊戲、音樂、生活、科技、美食等類型
4. 每個搜尋紀錄都要有合理的搜尋關鍵字和簡短描述

輸出 JSON 格式。`;

    const result = await callAIAPI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ], 0.9);

    let parsed = null;
    try {
      parsed = JSON.parse(result);
    } catch {
      const match = result.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }

    const history = Array.isArray(parsed?.history) ? parsed.history : [];

    return history.map((item, index) => ({
      id: `char-history-${char.name}-${Date.now()}-${index}`,
      title: item.title || '未知搜尋',
      query: item.query || '',
      summary: item.summary || '',
      time: '剛剛'
    }));
  } catch (err) {
    console.error('生成角色瀏覽紀錄失敗:', err);
    return [];
  } finally {
    isGeneratingCharHistory = false;
  }
}

async function renderCharHistoryList(index) {
  if (!charHistoryList) return;
  const chars = loadCharList();
  const char = chars[Number(index)];
  if (!char) {
    charHistoryList.innerHTML = '<div class="char-history-empty">尚未建立角色或找不到角色資料。</div>';
    return;
  }
  
  charHistoryList.innerHTML = '<div class="char-history-loading"><i class="fas fa-spinner fa-spin"></i> AI 正在生成瀏覽紀錄...</div>';
  
  const entries = await generateCharHistory(char);
  
  if (entries.length === 0) {
    charHistoryList.innerHTML = '<div class="char-history-empty">無法生成瀏覽紀錄，請確認 API 設定正確。</div>';
    return;
  }
  
  charHistoryList.innerHTML = entries.map(entry => `
    <article class="char-history-item">
      <div class="char-history-item-title">${entry.title}</div>
      <div class="char-history-item-meta">
        <span><i class="fas fa-search"></i> ${entry.query}</span>
        <span><i class="far fa-clock"></i> ${entry.time}</span>
      </div>
      <div class="char-history-item-desc">${entry.summary}</div>
    </article>
  `).join('');
}

function render(tab = 'recommend') {
  const list = sample[tab] || [];
  
  if (list.length === 0) {
    feed.innerHTML = `
      <section class="card">
        <div class="empty-feed">
          <i class="fas fa-video"></i>
          <div class="empty-feed-title">尚無影片內容</div>
          <div class="empty-feed-desc">點擊下方按鈕讓 AI 生成符合角色興趣的影片</div>
          <button class="primary-btn" id="ai-generate-videos-btn">
            <i class="fas fa-magic"></i> AI 生成影片
          </button>
        </div>
      </section>
    `;
    return;
  }
  
  feed.innerHTML = `
    <section class="card">
      <div class="video-list">
        ${list.map(item => `
          <article class="video-card" data-action="open-video" ${item.url ? `data-url="${item.url}"` : ''}>
            <div class="thumb" style="background: ${item.thumb || item.thumbGradient || 'linear-gradient(135deg, #ffd5e5, #ff8fb1)'}"><span class="tag">${item.tag}</span></div>
            <div class="video-body">
              <div class="video-title">${item.title}</div>
              <div class="video-meta">
                <span><i class="fas fa-play"></i> ${item.views}</span>
                <span><i class="fas fa-comment-dots"></i> ${item.danmu}</span>
              </div>
            </div>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function persistGeneratedTitles(tab) {
  const payload = {
    tab,
    updatedAt: new Date().toISOString(),
    titles: (sample[tab] || []).map(item => item.title)
  };
  localStorage.setItem('sx_bili_generated_titles', JSON.stringify(payload, null, 2));
}

function persistFeed(tab) {
  localStorage.setItem('sx_bili_feed_custom', JSON.stringify(sample));
  localStorage.setItem('sx_bili_feed_custom_meta', JSON.stringify({ tab, updatedAt: new Date().toISOString() }));
}

function loadPersistedFeed() {
}

function refreshFeed(tab) {
  sample[tab] = generateFreshFeed(tab);
  render(tab);
  persistGeneratedTitles(tab);
  persistFeed(tab);
}

function getActiveTab() {
  return document.querySelector('.tab.active')?.dataset.tab || 'recommend';
}

function openModal() {
  modal?.removeAttribute('hidden');
}

function closeModal() {
  modal?.setAttribute('hidden', '');
  modalUrlInput.value = '';
  modalPlayer.setAttribute('hidden', '');
  const iframe = modalPlayer.querySelector('iframe');
  if (iframe) iframe.src = '';
}

function openAddModal() {
  addModal?.removeAttribute('hidden');
  addTitleInput.value = '';
  addUrlInput.value = '';
  addTagSelect.value = 'current';
  uploadedThumbData = null;
  if (addThumbPreview) {
    addThumbPreview.style.backgroundImage = '';
    addThumbPreview.classList.remove('has-image');
    addThumbPreview.innerHTML = '<i class="fas fa-image"></i><span>點擊上傳封面</span>';
  }
  addTitleInput.focus();
}

function closeAddModal() {
  addModal?.setAttribute('hidden', '');
  uploadedThumbData = null;
}

function handleThumbUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  
  if (!file.type.startsWith('image/')) {
    alert('請選擇圖片檔案');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    uploadedThumbData = e.target.result;
    if (addThumbPreview) {
      addThumbPreview.style.backgroundImage = `url('${uploadedThumbData}')`;
      addThumbPreview.classList.add('has-image');
      addThumbPreview.innerHTML = '';
    }
  };
  reader.readAsDataURL(file);
}

function clearThumbUpload() {
  uploadedThumbData = null;
  if (addThumbFileInput) addThumbFileInput.value = '';
  if (addThumbPreview) {
    addThumbPreview.style.backgroundImage = '';
    addThumbPreview.classList.remove('has-image');
    addThumbPreview.innerHTML = '<i class="fas fa-image"></i><span>點擊上傳封面</span>';
  }
}

function addCustomVideo() {
  const title = addTitleInput.value.trim() || '自訂影片';
  const url = addUrlInput.value.trim();
  const chosen = addTagSelect.value;
  const targetTab = chosen === 'current' ? getActiveTab() : chosen;
  if (!sample[targetTab]) sample[targetTab] = [];

  const newItem = {
    title,
    tag: targetTab === 'recommend' ? '推薦' : targetTab,
    views: '新上架',
    danmu: '—',
    url: url || '',
    thumb: uploadedThumbData || '',
    thumbGradient: uploadedThumbData ? '' : generateThumbnail()
  };

  sample[targetTab] = [newItem, ...sample[targetTab]];
  render(targetTab);
  tabs.forEach(b => b.classList.remove('active'));
  const targetBtn = document.querySelector(`.tab[data-tab="${targetTab}"]`);
  targetBtn?.classList.add('active');
  persistFeed(targetTab);
  closeAddModal();
}

function openPlayerPage({ title, url } = {}) {
  pendingVideoData = { title, url };
  homeView?.setAttribute('hidden', '');
  playerPage?.removeAttribute('hidden');
  if (playerTitle) playerTitle.textContent = title || '影片標題';
  if (playerFrame) playerFrame.src = url || '';
  
  renderCharWatchSelect();
  renderNPCs();
  startDanmu();
  stopCharCompanion();
  currentWatchingChar = null;
  if (charWatchSelect) charWatchSelect.value = '';
}

function closePlayerPage() {
  playerPage?.setAttribute('hidden', '');
  homeView?.removeAttribute('hidden');
  if (playerFrame) playerFrame.src = '';
  stopDanmu();
  stopCharCompanion();
  currentWatchingChar = null;
  pendingVideoData = null;
}

function playUrl() {
  const url = modalUrlInput.value.trim();
  if (!url) return;
  closeModal();
  openPlayerPage({ title: '自訂播放網址', url });
}

function openCustomFromModal() {
  const title = modal.dataset.pendingTitle || '自訂影片';
  const url = modalUrlInput.value.trim();
  closeModal();
  openPlayerPage({ title, url });
}

const danmuPool = [
  '哈哈哈太好笑了', '笑死', 'www', '這段絕了', '前方高能',
  '爺青回', '爺青結', 'awsl', '好可愛', '太強了',
  '淚目', '破防了', '這波操作絕了', '學到了', '臥槽',
  '牛逼', '太神了', '絕絕子', '愛了愛了', '下次一定',
  '下次不一定的', '投幣了', '三連走起', '催更', '快更新',
  '這才是真正的技術', '學廢了', '我好了', '名場面', '經典'
];

const npcNames = [
  '小櫻', '阿明', '美琪', '大偉', '小雪', '阿傑', '小芳', '阿豪',
  '琪琪', '小龍', '阿寶', '小美', '阿強', '小玲', '阿輝', '小君'
];

function loadNPCs() {
  const raw = localStorage.getItem(NPC_LIST_KEY) || '[]';
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function generateNPCs(count = 8) {
  const npcs = [];
  for (let i = 0; i < count; i++) {
    npcs.push({
      id: `npc_${Date.now()}_${i}`,
      name: randomPick(npcNames),
      avatar: '',
      watching: true
    });
  }
  return npcs;
}

function renderNPCs() {
  if (!npcList || !npcCount) return;
  
  activeNPCs = generateNPCs(5 + Math.floor(Math.random() * 8));
  npcCount.textContent = `${activeNPCs.length} 人在看`;
  
  npcList.innerHTML = activeNPCs.map(npc => `
    <div class="npc-item">
      <div class="npc-avatar"></div>
      <span class="npc-name">${npc.name}</span>
    </div>
  `).join('');
}

function renderCharWatchSelect() {
  if (!charWatchSelect) return;
  const chars = loadCharList();
  charWatchSelect.innerHTML = '<option value="">選擇角色</option>' +
    chars.map((char, index) => {
      const name = char?.name || `角色 ${index + 1}`;
      return `<option value="${index}">${name}</option>`;
    }).join('');
}

function createDanmu(text, color = '#fff') {
  if (!danmuLayer || !danmuEnabled) return;
  
  const danmu = document.createElement('div');
  danmu.className = 'danmu-item';
  danmu.textContent = text;
  danmu.style.color = color;
  danmu.style.top = `${Math.random() * 70 + 10}%`;
  danmu.style.right = '0';
  danmu.style.animationDuration = `${6 + Math.random() * 4}s`;
  
  danmuLayer.appendChild(danmu);
  
  // 動畫結束後移除
  danmu.addEventListener('animationend', () => {
    danmu.remove();
  });
}

function startDanmu() {
  if (danmuTimer) clearInterval(danmuTimer);
  
  createDanmu(randomPick(danmuPool), '#fff');
  
  danmuTimer = setInterval(() => {
    if (!danmuEnabled) return;
    createDanmu(randomPick(danmuPool));
    
    if (Math.random() < 0.3 && activeNPCs.length > 0) {
      const npc = randomPick(activeNPCs);
      createDanmu(`${npc.name}：${randomPick(danmuPool)}`, '#fb7299');
    }
  }, 1500 + Math.random() * 2000);
}

function stopDanmu() {
  if (danmuTimer) {
    clearInterval(danmuTimer);
    danmuTimer = null;
  }
  if (danmuLayer) danmuLayer.innerHTML = '';
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
    console.warn('[bilibili] 無法載入角色記憶:', e);
    return [];
  }
}

function getCharLiveComment(char, video) {
  const personality = (char?.personality || '').trim();
  const background = (char?.background || '').trim();
  const name = char?.name || '角色';

  if (!personality && !background) {
    return '這個影片不錯呢。';
  }

  const combinedText = `${personality} ${background}`.toLowerCase();

  const memory = loadCharacterMemory(name);

  const sentences = [];

  const personalityParts = personality.split(/[，,、。；;\s]+/).filter(p => p.trim());
  const bgParts = background.split(/[，,、。；;\s]+/).filter(p => p.trim());

  const videoKeywords = ['畫面', '內容', '音樂', '劇情', '節奏', '風格', '氛圍', '主題'];
  const reactions = ['不錯', '有趣', '特別', '精彩', '吸引人', '有意思'];

  if (personalityParts.length > 0) {
    const randomTrait = personalityParts[Math.floor(Math.random() * personalityParts.length)];
    const randomKeyword = videoKeywords[Math.floor(Math.random() * videoKeywords.length)];
    const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
    sentences.push(`以我${randomTrait}的個性來看，這${randomKeyword}挺${randomReaction}的。`);
  }

  if (bgParts.length > 0 && Math.random() > 0.5) {
    const randomBg = bgParts[Math.floor(Math.random() * bgParts.length)];
    sentences.push(`${randomBg}的我，覺得這影片很有感覺。`);
  }

  if (memory && memory.length > 0 && Math.random() > 0.6) {
    const recentMsg = memory[memory.length - 1];
    if (recentMsg && recentMsg.content) {
      const recentKeywords = recentMsg.content.slice(0, 15);
      sentences.push(`剛才你說「${recentKeywords}...」，這影片有讓你想到什麼嗎？`);
    }
  }

  if (sentences.length === 0) {
    const randomKeyword = videoKeywords[Math.floor(Math.random() * videoKeywords.length)];
    const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
    sentences.push(`這${randomKeyword}${randomReaction}呢。`);
  }

  return sentences.join(' ');
}

function calculateCommentInterval(char) {
  const personality = (char?.personality || '').toLowerCase();

  let baseInterval = 10000;

  if (personality.includes('活潑') || personality.includes('調皮') || personality.includes('開朗')) {
    baseInterval = 6000;
  } else if (personality.includes('高冷') || personality.includes('冷淡') || personality.includes('冷靜')) {
    baseInterval = 15000;
  } else if (personality.includes('病嬌') || personality.includes('佔有') || personality.includes('嫉妒')) {
    baseInterval = 7000;
  } else if (personality.includes('溫柔') || personality.includes('體貼')) {
    baseInterval = 9000;
  } else if (personality.includes('熱情') || personality.includes('激動')) {
    baseInterval = 5000;
  }

  return baseInterval + Math.random() * 3000;
}

function showCharCommentBubble(text) {
  const bubble = document.getElementById('char-comment-bubble');
  const textEl = document.getElementById('char-comment-text');
  
  if (!bubble || !textEl) return;
  
  textEl.textContent = text;
  bubble.removeAttribute('hidden');
  
  setTimeout(() => {
    bubble.setAttribute('hidden', '');
  }, 4000);
}

function startCharCompanion(char, video) {
  const companion = document.getElementById('char-companion');
  const avatar = document.getElementById('char-companion-avatar');
  const nameEl = document.getElementById('char-companion-name');
  
  if (!companion || !char) return;
  
  if (avatar) {
    if (char.avatar) {
      avatar.style.backgroundImage = `url('${char.avatar}')`;
    } else {
      avatar.style.backgroundImage = '';
      avatar.style.background = 'linear-gradient(135deg, #fb7299, #f25285)';
    }
  }
  if (nameEl) nameEl.textContent = char.name || '角色';
  
  companion.removeAttribute('hidden');
  
  if (charCommentTimer) clearInterval(charCommentTimer);
  
  setTimeout(() => {
    const initialComment = getCharLiveComment(char, video);
    showCharCommentBubble(initialComment);
  }, 2000);
  
  charCommentTimer = setInterval(() => {
    if (!pendingVideoData) return;
    const comment = getCharLiveComment(char, pendingVideoData);
    showCharCommentBubble(comment);
  }, calculateCommentInterval(char));
}

function stopCharCompanion() {
  const companion = document.getElementById('char-companion');
  const bubble = document.getElementById('char-comment-bubble');
  
  companion?.setAttribute('hidden', '');
  bubble?.setAttribute('hidden', '');
  
  if (charCommentTimer) {
    clearInterval(charCommentTimer);
    charCommentTimer = null;
  }
}

function bind() {
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      render(btn.dataset.tab);
      persistFeed(btn.dataset.tab);
    });
  });

  feed?.addEventListener('click', event => {
    const card = event.target.closest('[data-action="open-video"]');
    if (!card) return;
    const title = card.querySelector('.video-title')?.textContent || '影片標題';
    const url = card.dataset.url || '';
    openModal();
    modal.dataset.pendingTitle = title;
    if (url) {
      modalUrlInput.value = url;
    }
  });

  modal?.addEventListener('click', event => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    if (action === 'close') closeModal();
    if (action === 'refresh') {
      const activeTab = getActiveTab();
      refreshFeed(activeTab);
      const title = modal.dataset.pendingTitle || '影片標題';
      closeModal();
      openPlayerPage({ title });
    }
    if (action === 'play') {
      openCustomFromModal();
    }
  });

  addModal?.addEventListener('click', event => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    if (action === 'close-add') closeAddModal();
    if (action === 'add-video') addCustomVideo();
    if (action === 'upload-thumb') addThumbFileInput?.click();
    if (action === 'clear-thumb') clearThumbUpload();
  });

  addThumbFileInput?.addEventListener('change', handleThumbUpload);
  
  addThumbPreview?.addEventListener('click', () => {
    addThumbFileInput?.click();
  });

  const postBtn = document.querySelector('.nav-btn.post');
  postBtn?.addEventListener('click', () => {
    openAddModal();
  });

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (view === 'me') {
        homeView?.setAttribute('hidden', '');
        playerPage?.setAttribute('hidden', '');
        meView?.removeAttribute('hidden');
        charHistoryView?.setAttribute('hidden', '');
        messagesView?.setAttribute('hidden', '');
        chatView?.setAttribute('hidden', '');
        searchRow?.setAttribute('hidden', '');
        tabsBar?.setAttribute('hidden', '');
        renderUserProfile();
      } else if (view === 'messages') {
        openMessagesView();
      } else if (view === 'home') {
        meView?.setAttribute('hidden', '');
        charHistoryView?.setAttribute('hidden', '');
        messagesView?.setAttribute('hidden', '');
        chatView?.setAttribute('hidden', '');
        homeView?.removeAttribute('hidden');
        searchRow?.removeAttribute('hidden');
        tabsBar?.removeAttribute('hidden');
      }
    });
  });

  charHistoryBtn?.addEventListener('click', async () => {
    homeView?.setAttribute('hidden', '');
    playerPage?.setAttribute('hidden', '');
    meView?.setAttribute('hidden', '');
    searchRow?.setAttribute('hidden', '');
    tabsBar?.setAttribute('hidden', '');
    charHistoryView?.removeAttribute('hidden');
    renderCharHistorySelect();
    await renderCharHistoryList(charHistorySelect?.value || '0');
  });

  charHistoryView?.addEventListener('click', async (event) => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    if (action === 'close-char-history') {
      charHistoryView?.setAttribute('hidden', '');
      homeView?.removeAttribute('hidden');
      searchRow?.removeAttribute('hidden');
      tabsBar?.removeAttribute('hidden');
    }
    if (action === 'refresh-char-history') {
      await renderCharHistoryList(charHistorySelect?.value || '0');
    }
  });

  charHistorySelect?.addEventListener('change', async () => {
    await renderCharHistoryList(charHistorySelect.value);
  });

  danmuToggle?.addEventListener('click', () => {
    danmuEnabled = !danmuEnabled;
    danmuToggle.classList.toggle('active', danmuEnabled);
    if (!danmuEnabled && danmuLayer) {
      danmuLayer.innerHTML = '';
    }
  });

  charWatchSelect?.addEventListener('change', () => {
    const index = charWatchSelect.value;
    if (index === '') {
      currentWatchingChar = null;
      stopCharCompanion();
    } else {
      currentWatchingChar = parseInt(index, 10);
      const chars = loadCharList();
      const char = chars[currentWatchingChar];
      if (char && pendingVideoData) {
        startCharCompanion(char, pendingVideoData);
      }
    }
  });

  playerPage?.addEventListener('click', event => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    if (action === 'back-home') closePlayerPage();
    if (action === 'remove-companion') {
      stopCharCompanion();
      currentWatchingChar = null;
      if (charWatchSelect) charWatchSelect.value = '';
    }
  });

  window.addEventListener('storage', event => {
    if (['sx_user_name', 'sx_user_avatar', 'sx_user_background'].includes(event.key)) {
      renderUserProfile();
    }
    if (event.key === CHAR_LIST_KEY) {
      renderCharHistorySelect();
    }
  });

  document.addEventListener('click', event => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    
    if (action === 'open-edit-profile') openEditProfileModal();
    if (action === 'close-edit-profile') closeEditProfileModal();
    if (action === 'save-profile') saveProfile();
    if (action === 'upload-avatar') editAvatarFileInput?.click();
    if (action === 'clear-avatar') clearAvatarUpload();
    if (action === 'close-messages') closeMessagesView();
    if (action === 'refresh-messages') {
      refreshMessages();
      renderMessagesTab(currentMsgTab);
    }
    if (action === 'close-chat') closeChatView();
    if (action === 'send-message') sendMessage();
  });

  messagesView?.addEventListener('click', event => {
    const msgTab = event.target.closest('.msg-tab');
    if (msgTab) {
      renderMessagesTab(msgTab.dataset.msgTab);
      return;
    }
    
    const chatItem = event.target.closest('.message-item[data-chat-user-id]');
    if (chatItem) {
      const userId = chatItem.dataset.chatUserId;
      const userName = chatItem.dataset.chatName;
      openChatView(userId, userName);
    }
  });

  chatInput?.addEventListener('keypress', event => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  });

  editAvatarFileInput?.addEventListener('change', handleAvatarUpload);
  
  editAvatarPreview?.addEventListener('click', () => {
    editAvatarFileInput?.click();
  });
}

loadPersistedFeed();
bind();
render();
renderUserProfile();

function getWorldbookData() {
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

function getWorldbookContext() {
  const data = getWorldbookData();
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

function getCharacterData(name) {
  if (!name) return null;
  const raw = localStorage.getItem(CHAR_LIST_KEY);
  if (!raw) return null;
  try {
    const list = JSON.parse(raw);
    return list.find(c => c.name === name) || null;
  } catch {
    return null;
  }
}

function getActiveCharacter() {
  const activeName = localStorage.getItem('sx_char_name');
  return getCharacterData(activeName);
}

function getUserData() {
  return {
    name: localStorage.getItem('sx_user_name') || 'User',
    personality: localStorage.getItem('sx_user_personality') || '',
    background: localStorage.getItem('sx_user_background') || ''
  };
}

function getChatHistory(limit = 15) {
  const raw = localStorage.getItem('sx_chat_history');
  if (!raw) return [];
  try {
    const history = JSON.parse(raw);
    return history.slice(-limit);
  } catch {
    return [];
  }
}

function getChatHistoryContext() {
  const history = getChatHistory(15);
  if (history.length === 0) return '無聊天記錄';
  const user = getUserData();
  return history.map(msg => {
    const role = msg.role === 'user' ? user.name : '角色';
    return `${role}: ${msg.content.slice(0, 100)}`;
  }).join('\n');
}

function getApiConfig() {
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

async function callAIAPI(messages, temperature = 0.85) {
  const config = getApiConfig();
  if (!config || !config.url) {
    throw new Error('尚未設定 API');
  }

  const apiType = config.type || 'openai';
  
  // Gemini 原生 API 格式
  if (apiType === 'gemini') {
    const model = config.model || 'gemini-1.5-flash';
    const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.key}`;
    
    const contents = [];
    let systemInstruction = '';
    
    for (const msg of messages) {
      if (msg.role === 'system') {
        systemInstruction = msg.content;
      } else {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      }
    }
    
    const geminiPayload = {
      contents,
      generationConfig: { temperature, maxOutputTokens: 2048 }
    };
    
    if (systemInstruction) {
      geminiPayload.systemInstruction = { parts: [{ text: systemInstruction }] };
    }
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload)
    });
    
    if (!response.ok) {
      throw new Error(`Gemini API 錯誤 (${response.status})`);
    }
    
    const data = await response.json();
    if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
  
  // OpenAI 相容格式或自訂端點
  let endpoint;
  if (apiType === 'custom') {
    endpoint = config.url;
  } else {
    endpoint = config.url.endsWith('/chat/completions')
      ? config.url
      : `${config.url.replace(/\/$/, '')}/chat/completions`;
  }

  const headers = { 'Content-Type': 'application/json' };
  if (config.key) {
    headers.Authorization = `Bearer ${config.key}`;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: config.model || 'gpt-3.5-turbo',
      messages,
      temperature
    })
  });

  if (!response.ok) {
    throw new Error(`API 錯誤 (${response.status})`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

function buildBilibiliContext() {
  const user = getUserData();
  const char = getActiveCharacter();
  const worldbook = getWorldbookContext();
  const chatHistory = getChatHistoryContext();

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

let isGeneratingVideos = false;

async function generateAIVideos() {
  if (isGeneratingVideos) {
    alert('正在生成中，請稍候...');
    return;
  }

  isGeneratingVideos = true;

  try {
    const context = buildBilibiliContext();
    const lang = localStorage.getItem('sxiphone_lang') || 'zh-TW';

    const systemPrompt = `你是一位專業的影片內容創作者，擅長根據角色設定和使用者背景創作符合人物性格的影片標題和描述。
請使用 ${window.getAIReadableLangName?.(lang) || '繁體中文'} 撰寫。
輸出格式為 JSON: {"videos": [{"title": "影片標題", "tag": "標籤", "views": "觀看次數", "danmu": "彈幕數"}]}`;

    const prompt = `${context}

請生成 3 個 B站影片，要求：
1. 符合角色性格和使用者設定
2. 自然融入世界書設定
3. 標題要有吸引力
4. 可以是動漫、遊戲、音樂、生活等類型

輸出 JSON 格式。`;

    const result = await callAIAPI([
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

    const videos = Array.isArray(parsed?.videos) ? parsed.videos : [];

    videos.forEach((video, index) => {
      if (video.title) {
        sample.recommend.unshift({
          title: video.title,
          tag: video.tag || '推薦',
          views: video.views || randomViews(),
          danmu: video.danmu || randomDanmu(),
          thumbGradient: generateThumbnail()
        });
      }
    });

    if (videos.length > 0) {
      render('recommend');
      persistFeed('recommend');
    } else {
      alert('生成失敗，請稍後重試');
    }
  } catch (err) {
    alert(`生成失敗: ${err.message}`);
  } finally {
    isGeneratingVideos = false;
  }
}

document.addEventListener('click', (event) => {
  if (event.target.closest('#ai-generate-videos-btn')) {
    generateAIVideos();
  }
});

console.log('Loaded app: bilibili');

