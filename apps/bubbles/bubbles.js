const roleButtons = document.querySelectorAll('.role-btn');
const artistView = document.getElementById('artist-view');
const userView = document.getElementById('user-view');

const artistFeed = document.getElementById('artist-feed');
const userFeed = document.getElementById('user-feed');

const artistInput = document.getElementById('artist-input');
const userSendBtn = document.getElementById('user-send');

const artistSendBtn = document.getElementById('artist-send');
const refreshBtn = document.getElementById('refresh-btn');
const settingsBtn = document.getElementById('settings-btn');
const settingsSheet = document.getElementById('settings-sheet');
const settingsOverlay = document.getElementById('settings-overlay');
const closeSettingsBtn = document.getElementById('close-settings');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const settingsArtistName = document.getElementById('settings-artist-name');
const settingsArtistAvatar = document.getElementById('settings-artist-avatar');
const settingsArtistStatus = document.getElementById('settings-artist-status');
const settingsArtistImport = document.getElementById('settings-artist-import');
const settingsSubscribedImport = document.getElementById('settings-subscribed-import');
const subscribedArtistsList = document.getElementById('subscribed-artists-list');
const subscribedArtistsGrid = document.getElementById('subscribed-artists-grid');
const userChatView = document.getElementById('user-chat-view');
const backToArtistsBtn = document.getElementById('back-to-artists');
const chatArtistAvatar = document.getElementById('chat-artist-avatar');
const chatArtistName = document.getElementById('chat-artist-name');
const userChatFeed = document.getElementById('user-chat-feed');
const userChatInput = document.getElementById('user-chat-input');
const userChatSendBtn = document.getElementById('user-chat-send');
const fanNameInput = document.getElementById('settings-fan-name');
const fanLanguageSelect = document.getElementById('settings-fan-language');
const antiFanToggle = document.getElementById('settings-anti-fan');
const generateFanReplyBtn = document.getElementById('generate-fan-reply');

const artistBgColor = document.getElementById('artist-bg-color');
const artistPrimaryColor = document.getElementById('artist-primary-color');
const artistTextColor = document.getElementById('artist-text-color');
const artistBubbleColor = document.getElementById('artist-bubble-color');
const userBgColor = document.getElementById('user-bg-color');
const userPrimaryColor = document.getElementById('user-primary-color');
const userTextColor = document.getElementById('user-text-color');
const userCardColor = document.getElementById('user-card-color');

const BUBBLE_MONTHLY_FEE = 4500;
const STORAGE_KEY = 'sx_bubbles_data';

const KPOP_WORLDBOOK = {
  context: `# K-POP Bubble 服務背景
Bubble 是韓國 Kakao Entertainment 提供的付費粉絲聊天服務。
粉絲可以訂閱喜愛的藝人，接收藝人的私密訊息並發送回覆。
藝人會分享日常、工作花絮、心情點滴等內容。
粉絲可以回覆藝人的訊息，藝人會看到所有粉絲的回覆。

# 韓國娛樂圈文化
- 粉絲稱呼藝人為「오빠」（oppa，哥哥）或「언니」（unnie，姐姐）
- 粉絲經常使用「ㅠㅠ」表示哭泣、「ㅋㅋ」表示笑
- 應援色、應援棒是粉絲文化重要元素
- 打歌節目、回歸、安可場等是常見活動
- 粉絲會追蹤藝人的 Instagram、Weverse、Bubble 等
- 藝人會分享練習、錄音、拍攝的花絮
- 簽售會、粉絲見面會是重要互動場合`,
  
  idolPars: [
    '剛結束今天的練習，身體有點痠痛但很充實',
    '今天錄音錄了很久，希望你們會喜歡新歌',
    '剛拍完 MV，這次的造型很帥！',
    '正在去拍攝現場的路上',
    '今天天氣很好，心情也不錯',
    '剛吃完晚餐，是我喜歡的韓食',
    '明天有打歌節目，要早點休息',
    '收到粉絲的信了，謝謝你們的應援',
    '今天舞台表現還滿意嗎？',
    '正在準備回歸，很忙但很期待',
    '剛結束簽售會，見到很多粉絲',
    '今天有綜藝錄影，很有趣',
    '正在寫歌詞，靈感來了',
    '剛健身完，要維持身材',
    '今天穿了新衣服，你們覺得怎麼樣？'
  ],
  
  fanGreetings: [
    '오빠 안녕하세요! 오늘도 화이팅이에요 💜',
    '언니 오늘 스케줄 수고했어요 ㅠㅠ',
    '오늘 무대 너무 좋았어요! 최고예요',
    '방금 인스타 봤어요! 예뻐요 ㅠㅠ',
    '새 앨범 진짜 기대돼요!',
    '오늘도 응원하고 있어요 💜'
  ],
  
  antiFanReplies: [
    '오늘 무대 별로였어요',
    '노래 연습 더 하세요',
    '다른 멤버가 훨씬 낫네요',
    '요즘 인기 떨어진 것 같아요',
    '얼굴 변한 것 같아요',
    '방송 지루해요'
  ]
};

const state = {
  artistMessages: [],
  userMessages: [],
  currentChatArtist: null,
  artistChats: {},
  fanName: '팬',
  fanLanguage: 'ko',
  antiFanMode: false,
  artistPersona: null,
  isFirstMessage: true,
  artistAppearance: {
    bgColor: '#0f1420',
    primaryColor: '#867bff',
    textColor: '#e9efff',
    bubbleColor: '#182132'
  },
  userAppearance: {
    bgColor: '#0a0e14',
    primaryColor: '#6c63ff',
    textColor: '#e9efff',
    cardColor: '#151e2d'
  }
};

let subscribedArtists = [];

function saveToStorage() {
  const data = {
    artistMessages: state.artistMessages,
    userMessages: state.userMessages,
    artistChats: state.artistChats,
    fanName: state.fanName,
    fanLanguage: state.fanLanguage,
    antiFanMode: state.antiFanMode,
    subscribedArtists: subscribedArtists,
    isFirstMessage: state.isFirstMessage,
    artistAppearance: state.artistAppearance,
    userAppearance: state.userAppearance,
    savedAt: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  
  window.parent?.postMessage({
    type: 'BUBBLES_DATA_SAVED',
    data: data
  }, '*');
}

function loadFromStorage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    const data = JSON.parse(saved);
    state.artistMessages = data.artistMessages || [];
    state.userMessages = data.userMessages || [];
    state.artistChats = data.artistChats || {};
    state.fanName = data.fanName || '팬';
    state.fanLanguage = data.fanLanguage || 'ko';
    state.antiFanMode = data.antiFanMode || false;
    subscribedArtists = data.subscribedArtists || [];
    state.isFirstMessage = data.isFirstMessage !== undefined ? data.isFirstMessage : true;
    state.artistAppearance = data.artistAppearance || state.artistAppearance;
    state.userAppearance = data.userAppearance || state.userAppearance;
    return true;
  }
  return false;
}

function applyAppearance(viewType) {
  const appearance = viewType === 'artist' ? state.artistAppearance : state.userAppearance;
  const root = document.documentElement;
  
  if (viewType === 'artist') {
    root.style.setProperty('--bubble-bg', appearance.bgColor);
    root.style.setProperty('--bubble-primary', appearance.primaryColor);
    root.style.setProperty('--bubble-text', appearance.textColor);
    root.style.setProperty('--bubble-surface', appearance.bubbleColor);
  } else {
    root.style.setProperty('--bubble-bg', appearance.bgColor);
    root.style.setProperty('--bubble-primary', appearance.primaryColor);
    root.style.setProperty('--bubble-text', appearance.textColor);
    root.style.setProperty('--bubble-surface', appearance.cardColor);
  }
}

function getWorldbookData() {
  const worldbookData = {};
  const categories = ['cot', 'style', 'global', 'keywords', 'backend'];
  
  categories.forEach(cat => {
    const key = `sx_worldbook_${cat}`;
    const data = localStorage.getItem(key);
    if (data) {
      try {
        worldbookData[cat] = JSON.parse(data);
      } catch (e) {
        worldbookData[cat] = [];
      }
    }
  });
  
  return worldbookData;
}

function getWorldbookMounts() {
  const raw = localStorage.getItem('sx_worldbook_mounts');
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }
  return [];
}

function buildWorldbookContext() {
  const mounts = getWorldbookMounts();
  const enabledMounts = mounts.filter(m => m.enabled);
  const worldbookData = getWorldbookData();
  
  let context = KPOP_WORLDBOOK.context;
  
  if (enabledMounts.length > 0) {
    context += '\n\n# 已掛載世界書\n';
    enabledMounts.forEach(mount => {
      const cat = mount.category;
      const title = mount.title;
      if (worldbookData[cat]) {
        const entries = Array.isArray(worldbookData[cat]) 
          ? worldbookData[cat].filter(e => e.title === title)
          : [];
        if (entries.length > 0) {
          context += `\n## ${title}\n${entries.map(e => e.content || e.text || '').join('\n')}\n`;
        }
      }
    });
  }
  
  return context;
}

async function callAIAPI(messages) {
  let config = null;
  
  if (typeof window.SxSettings !== 'undefined' && window.SxSettings.getActiveApiWithFallback) {
    config = window.SxSettings.getActiveApiWithFallback();
  } else {
    const apis = JSON.parse(localStorage.getItem('api_configs') || '[]');
    const activeIndex = parseInt(localStorage.getItem('sx_active_api'), 10);
    const validIndex = (!isNaN(activeIndex) && activeIndex >= 0 && activeIndex < apis.length) ? activeIndex : 0;
    config = apis[validIndex] || apis[0];
  }
  
  if (!config || !config.url) {
    console.warn('[bubbles] 未設定 API');
    return null;
  }

  const apiType = config.type || 'openai';
  
  // OpenAI 相容格式或自訂端點
  let targetUrl;
  if (apiType === 'custom') {
    targetUrl = config.url;
  } else {
    targetUrl = config.url.endsWith('/chat/completions') ? config.url : config.url.replace(/\/$/, '') + '/chat/completions';
  }
  
  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': config.key ? `Bearer ${config.key}` : undefined
      },
      body: JSON.stringify({ 
        model: config.model || 'gpt-3.5-turbo', 
        messages, 
        temperature: 0.8 
      })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.choices[0].message.content;
  } catch (err) {
    console.error('[bubbles] API 呼叫失敗:', err);
    return null;
  }
}

function getArtistPersona() {
  const artistName = settingsArtistName?.value || '';
  if (!artistName) return null;
  
  if (typeof SxSettings !== 'undefined') {
    const persona = SxSettings.getPersonaByName(artistName);
    if (persona) return persona;
  }
  
  return {
    name: artistName,
    avatar: settingsArtistAvatar?.value || '',
    personality: '韓國偶像，親切友善，喜歡和粉絲互動',
    background: settingsArtistStatus?.value || '正在活動中'
  };
}

function renderFeed(element, messages) {
  if (!element) return;

  element.innerHTML = messages.map(message => `
    <article class="msg ${message.role}">
      ${message.fanName ? `<span class="fan-name">${message.fanName}</span>` : ''}
      ${message.text}
    </article>
  `).join('');

  element.scrollTop = element.scrollHeight;
}

function renderAll() {
  renderFeed(artistFeed, state.artistMessages);
  renderFeed(userFeed, state.userMessages);
}

function switchView(viewName) {
  const isArtist = viewName === 'artist';

  artistView.classList.toggle('active', isArtist);
  userView.classList.toggle('active', !isArtist);

  roleButtons.forEach(button => {
    const active = button.dataset.view === viewName;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  
  applyAppearance(viewName);
  
  if (!isArtist) {
    renderSubscribedArtistsGrid();
    closeUserChat();
  }
}

function renderSubscribedArtistsGrid() {
  if (!subscribedArtistsGrid) return;
  
  if (subscribedArtists.length === 0) {
    subscribedArtistsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--bubble-muted);">
        <i class="fas fa-user-plus" style="font-size: 32px; margin-bottom: 12px; opacity: 0.5;"></i>
        <p style="font-size: 14px;">尚未訂閱任何藝人</p>
        <p style="font-size: 12px; margin-top: 6px;">請從設定中加入已訂閱的藝人</p>
      </div>
    `;
    return;
  }
  
  subscribedArtistsGrid.innerHTML = subscribedArtists.map((artist, idx) => `
    <article class="artist-card" data-artist-idx="${idx}">
      ${artist.avatar 
        ? `<img class="artist-card-avatar" src="${artist.avatar}" alt="${artist.name}">` 
        : `<div class="artist-card-avatar"></div>`}
      <span class="artist-card-name">${artist.name}</span>
      <span class="artist-card-status">${artist.status || '正在回覆粉絲'}</span>
      <div class="artist-card-badge">
        <i class="fas fa-comment-dots"></i>
        <span>私訊中</span>
      </div>
    </article>
  `).join('');
  
  subscribedArtistsGrid.querySelectorAll('.artist-card').forEach(card => {
    card.addEventListener('click', () => {
      const idx = parseInt(card.dataset.artistIdx, 10);
      openUserChat(subscribedArtists[idx]);
    });
  });
}

function openUserChat(artist) {
  if (!artist) return;
  
  state.currentChatArtist = artist;
  
  if (chatArtistAvatar) {
    chatArtistAvatar.src = artist.avatar || '';
    chatArtistAvatar.style.display = artist.avatar ? 'block' : 'none';
  }
  if (chatArtistName) chatArtistName.textContent = artist.name;
  
  if (subscribedArtistsGrid) subscribedArtistsGrid.style.display = 'none';
  if (userChatView) userChatView.classList.add('active');
  
  const chatKey = artist.name;
  if (!state.artistChats[chatKey]) {
    state.artistChats[chatKey] = [];
  }
  renderFeed(userChatFeed, state.artistChats[chatKey]);
}

function closeUserChat() {
  state.currentChatArtist = null;
  if (userChatView) userChatView.classList.remove('active');
  if (subscribedArtistsGrid) subscribedArtistsGrid.style.display = 'grid';
}

function sendArtistMessage() {
  const text = artistInput.value.trim();
  if (!text) return;
  
  const artistPersona = getArtistPersona();
  const artistName = artistPersona?.name || settingsArtistName?.value || '';

  state.artistMessages.push({ role: 'artist', text, artistName });
  artistInput.value = '';
  renderFeed(artistFeed, state.artistMessages);
  saveToStorage();
  
  subscribedArtists.forEach(artist => {
    if (!state.artistChats[artist.name]) {
      state.artistChats[artist.name] = [];
    }
    state.artistChats[artist.name].push({ role: 'artist', text });
  });
  
  if (artistName && subscribedArtists.some(a => a.name === artistName)) {
    if (!state.artistChats[artistName]) {
      state.artistChats[artistName] = [];
    }
    state.artistChats[artistName].push({ role: 'artist', text });
    if (state.currentChatArtist?.name === artistName) {
      renderFeed(userChatFeed, state.artistChats[artistName]);
    }
  }
}

async function generateFanReply() {
  const artistPersona = getArtistPersona();
  const artistName = artistPersona?.name || '아티스트';
  const isAntiFan = antiFanToggle?.checked || false;
  const fanName = fanNameInput?.value?.trim() || state.fanName || '팬';
  const fanLanguage = fanLanguageSelect?.value || state.fanLanguage || 'ko';
  
  const generateBtn = document.getElementById('generate-fan-reply');
  if (generateBtn) {
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 生成中...';
  }
  
  try {
    const worldbookContext = buildWorldbookContext();
    
    const languageInstructions = {
      'ko': '使用韓文回覆',
      'ja': '使用日文回覆',
      'zh': '使用繁體中文回覆',
      'en': '使用英文回覆',
      'ko-ja': '使用韓文（70%）和日文（30%）混合回覆',
      'ko-zh': '使用韓文（70%）和繁體中文（30%）混合回覆',
      'mixed': '使用韓文、日文、中文、英文混合回覆'
    };
    
    const languageExamples = {
      'ko': `韓文範例：
- 오빠 오늘도 수고했어요 💜
- 방금 무대 봤는데 진짜 좋았어요!
- 항상 응원하고 있어요!`,
      'ja': `日文範例：
- 今日もお疲れ様でした！大好きです 💜
- ステージ最高でした！
- 応援してます！`,
      'zh': `中文範例：
- 今天也辛苦了！最喜歡你了 💜
- 剛剛的舞台超棒的！
- 會一直支持你的！`,
      'en': `英文範例：
- You did great today! Love you 💜
- The stage was amazing!
- Always supporting you!`,
      'ko-ja': `韓文範例：
- 오빠 오늘도 수고했어요 💜
- 항상 응원하고 있어요!

日文範例：
- 今日もお疲れ様でした！
- 応援してます！`,
      'ko-zh': `韓文範例：
- 오빠 오늘도 수고했어요 💜
- 항상 응원하고 있어요!

中文範例：
- 今天也辛苦了！
- 會一直支持你的！`,
      'mixed': `韓文範例：
- 오빠 오늘도 수고했어요 💜

日文範例：
- 今日もお疲れ様でした！

中文範例：
- 今天也辛苦了！

英文範例：
- You did great today!`
    };
    
    const systemPrompt = `# Bubble 粉絲回覆生成系統

${worldbookContext}

# 當前情境
- 藝人: ${artistName}
- 藝人性格: ${artistPersona?.personality || '親切友善的韓國偶像'}
- 粉絲名稱: ${fanName}
- 是否為黑粉: ${isAntiFan ? '是' : '否'}

# 任務
生成一條粉絲在 Bubble 上回覆藝人的訊息。

${isAntiFan ? `# 黑粉模式
生成一條負面、批評性的回覆。語言使用韓文。
範例：
- 오늘 무대 별로였어요
- 노래 연습 더 하세요
- 다른 멤버가 훨씬 낫네요` : `# 正常粉絲模式
生成一條支持、鼓勵性的回覆。
- ${languageInstructions[fanLanguage] || '使用韓文回覆'}
- 可以使用表情符號如 💜、✨、ㅠㅠ、ㅋㅋ
- 語氣要親切、支持

${languageExamples[fanLanguage] || languageExamples['ko']}`}
`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: '請生成一條粉絲回覆。' }
    ];
    
    const aiReply = await callAIAPI(messages);
    
    let replyText = aiReply;
    if (!replyText) {
      if (isAntiFan) {
        replyText = KPOP_WORLDBOOK.antiFanReplies[Math.floor(Math.random() * KPOP_WORLDBOOK.antiFanReplies.length)];
      } else {
        replyText = KPOP_WORLDBOOK.fanGreetings[Math.floor(Math.random() * KPOP_WORLDBOOK.fanGreetings.length)];
      }
    }
    
    state.artistMessages.push({ 
      role: 'fan', 
      text: replyText, 
      fanName,
      isAntiFan 
    });
    
    const artistPersona = getArtistPersona();
    const artistName = artistPersona?.name || settingsArtistName?.value || '';
    
    if (artistName && subscribedArtists.some(a => a.name === artistName)) {
      if (!state.artistChats[artistName]) {
        state.artistChats[artistName] = [];
      }
      state.artistChats[artistName].push({ role: 'user', text: replyText, fanName });
      if (state.currentChatArtist?.name === artistName) {
        renderFeed(userChatFeed, state.artistChats[artistName]);
      }
    }
    
    renderFeed(artistFeed, state.artistMessages);
    saveToStorage();
    
  } catch (error) {
    console.error('[bubbles] 生成回覆失敗:', error);
  } finally {
    if (generateBtn) {
      generateBtn.disabled = false;
      generateBtn.innerHTML = '<i class="fas fa-paper-plane"></i> 生成回覆';
    }
  }
}

async function generateArtistAutoReply(chatKey) {
  const artistPersona = getArtistPersona();
  const artistName = artistPersona?.name || chatKey;
  
  const chatHistory = state.artistChats[chatKey] || [];
  const lastUserMsg = [...chatHistory].reverse().find(m => m.role === 'user');
  if (!lastUserMsg) return;
  
  const worldbookContext = buildWorldbookContext();
  
  const systemPrompt = `# Bubble 藝人自動回覆系統

${worldbookContext}

# 角色設定
- 名字: ${artistName}
- 性格: ${artistPersona?.personality || '親切友善的韓國偶像'}
- 背景: ${artistPersona?.background || '正在活動中的韓國偶像'}

# 任務
你是一位韓國偶像，正在使用 Bubble 回覆粉絲的訊息。
- 用親切、溫暖的語氣回覆
- 可以使用表情符號
- 回覆要簡短自然，像即時通訊
- 如果是第一次回覆，可以用韓文打招呼
- 之後的回覆使用粉絲的語言（繁體中文）

# 回覆範例
- 봤어요! 고마워요 💜
- ㅋㅋㅋ 귀여워요
- 謝謝你的支持！今天也加油 ✨
- 收到了！很開心你喜歡
`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: lastUserMsg.text }
  ];
  
  const aiReply = await callAIAPI(messages);
  
  let replyText = aiReply;
  if (!replyText) {
    const autoReplies = [
      '봤어요! 고마워요 💜',
      '나중에 또 올게요~',
      '읽었어요! 힘낼게요 ✨',
      '謝謝！今天也加油',
      '收到了 💜'
    ];
    replyText = autoReplies[Math.floor(Math.random() * autoReplies.length)];
  }
  
  return replyText;
}

async function sendUserChatMessage() {
  const text = userChatInput.value.trim();
  if (!text || !state.currentChatArtist) return;

  const chatKey = state.currentChatArtist.name;
  state.artistChats[chatKey].push({ role: 'user', text });
  userChatInput.value = '';
  renderFeed(userChatFeed, state.artistChats[chatKey]);
  saveToStorage();
  
  const artistPersona = getArtistPersona();
  const currentArtistName = artistPersona?.name || settingsArtistName?.value || '';
  
  if (chatKey === currentArtistName) {
    state.artistMessages.push({ role: 'user', text, fromChat: chatKey });
    renderFeed(artistFeed, state.artistMessages);
    saveToStorage();
  }

  setTimeout(async () => {
    const reply = await generateArtistAutoReply(chatKey);
    if (reply) {
      state.artistChats[chatKey].push({ role: 'artist', text: reply });
      renderFeed(userChatFeed, state.artistChats[chatKey]);
      
      if (chatKey === currentArtistName) {
        state.artistMessages.push({ role: 'artist', text: reply });
        renderFeed(artistFeed, state.artistMessages);
      }
      
      saveToStorage();
    }
  }, 900);
}

function chargeBubbleSubscription(artistName) {
  window.parent?.postMessage({
    type: 'KAKAOPAY_SUBSCRIPTION',
    amount: BUBBLE_MONTHLY_FEE,
    planName: `Bubble - ${artistName}`,
    source: 'bubbles'
  }, '*');
}

function getPersonasFromSxSettings() {
  if (typeof SxSettings === 'undefined') return [];
  return SxSettings.getAllPersonas() || [];
}

function populateImportSelects() {
  const personas = getPersonasFromSxSettings();
  
  const optionsHtml = '<option value="">-- 選擇藝人 --</option>' + 
    personas.map(p => `<option value="${p.name}">${p.name}</option>`).join('');
  
  if (settingsArtistImport) settingsArtistImport.innerHTML = optionsHtml;
  if (settingsSubscribedImport) settingsSubscribedImport.innerHTML = optionsHtml;
}

function renderSubscribedArtistsList() {
  if (!subscribedArtistsList) return;
  
  if (subscribedArtists.length === 0) {
    subscribedArtistsList.innerHTML = '<span style="color: var(--bubble-muted); font-size: 12px;">尚未訂閱任何藝人</span>';
    return;
  }
  
  subscribedArtistsList.innerHTML = subscribedArtists.map((artist, idx) => `
    <div class="subscribed-artist-item" data-idx="${idx}">
      ${artist.avatar ? `<img src="${artist.avatar}" alt="${artist.name}">` : '<div style="width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg, #7f73ff, #7bd6ff);"></div>'}
      <span>${artist.name}</span>
      <button type="button" data-remove="${idx}" aria-label="移除">×</button>
    </div>
  `).join('');
  
  subscribedArtistsList.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.remove, 10);
      subscribedArtists.splice(idx, 1);
      renderSubscribedArtistsList();
      saveToStorage();
    });
  });
}

function bindEvents() {
  roleButtons.forEach(button => {
    button.addEventListener('click', () => {
      switchView(button.dataset.view || 'artist');
    });
  });

  artistSendBtn?.addEventListener('click', sendArtistMessage);
  userChatSendBtn?.addEventListener('click', sendUserChatMessage);
  generateFanReplyBtn?.addEventListener('click', generateFanReply);

  artistInput?.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendArtistMessage();
    }
  });

  userChatInput?.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendUserChatMessage();
    }
  });
  
  fanNameInput?.addEventListener('input', () => {
    state.fanName = fanNameInput.value.trim() || '팬';
  });
  
  fanLanguageSelect?.addEventListener('change', () => {
    state.fanLanguage = fanLanguageSelect.value;
  });
  
  antiFanToggle?.addEventListener('change', () => {
    state.antiFanMode = antiFanToggle.checked;
  });

  refreshBtn?.addEventListener('click', () => {
    renderAll();
    saveToStorage();
  });
  settingsBtn?.addEventListener('click', openSettings);
  closeSettingsBtn?.addEventListener('click', closeSettings);
  settingsOverlay?.addEventListener('click', closeSettings);
  saveSettingsBtn?.addEventListener('click', saveSettings);
  backToArtistsBtn?.addEventListener('click', closeUserChat);
  
  settingsArtistImport?.addEventListener('change', () => {
    const name = settingsArtistImport.value;
    if (!name) return;
    const personas = getPersonasFromSxSettings();
    const persona = personas.find(p => p.name === name);
    if (persona) {
      if (settingsArtistName) settingsArtistName.value = persona.name || '';
      if (settingsArtistAvatar) settingsArtistAvatar.value = persona.avatar || '';
      state.artistPersona = persona;
    }
  });
  
  settingsSubscribedImport?.addEventListener('change', () => {
    const name = settingsSubscribedImport.value;
    if (!name) return;
    if (subscribedArtists.some(a => a.name === name)) {
      settingsSubscribedImport.value = '';
      return;
    }
    const personas = getPersonasFromSxSettings();
    const persona = personas.find(p => p.name === name);
    subscribedArtists.push({
      name: persona?.name || name,
      avatar: persona?.avatar || '',
      status: persona?.background || '',
      personality: persona?.personality || ''
    });
    chargeBubbleSubscription(persona?.name || name);
    renderSubscribedArtistsList();
    settingsSubscribedImport.value = '';
    saveToStorage();
  });
}

function openSettings() {
  settingsSheet?.classList.add('open');
  settingsOverlay?.classList.add('open');
  populateImportSelects();
  loadSettingsToForm();
}

function closeSettings() {
  settingsSheet?.classList.remove('open');
  settingsOverlay?.classList.remove('open');
}

function loadSettings() {
  const saved = localStorage.getItem('sx_bubbles_settings');
  return saved ? JSON.parse(saved) : {
    artistName: '',
    artistAvatar: '',
    artistStatus: '',
    subscribedArtists: [],
    fanName: '팬',
    fanLanguage: 'ko',
    antiFanMode: false
  };
}

function saveSettingsToStorage(settings) {
  localStorage.setItem('sx_bubbles_settings', JSON.stringify(settings));
}

function loadSettingsToForm() {
  const settings = loadSettings();
  if (settingsArtistName) settingsArtistName.value = settings.artistName || '';
  if (settingsArtistAvatar) settingsArtistAvatar.value = settings.artistAvatar || '';
  if (settingsArtistStatus) settingsArtistStatus.value = settings.artistStatus || '';
  if (fanNameInput) fanNameInput.value = state.fanName || '팬';
  if (fanLanguageSelect) fanLanguageSelect.value = state.fanLanguage || 'ko';
  if (antiFanToggle) antiFanToggle.checked = state.antiFanMode;
  
  if (artistBgColor) artistBgColor.value = state.artistAppearance.bgColor;
  if (artistPrimaryColor) artistPrimaryColor.value = state.artistAppearance.primaryColor;
  if (artistTextColor) artistTextColor.value = state.artistAppearance.textColor;
  if (artistBubbleColor) artistBubbleColor.value = state.artistAppearance.bubbleColor;
  if (userBgColor) userBgColor.value = state.userAppearance.bgColor;
  if (userPrimaryColor) userPrimaryColor.value = state.userAppearance.primaryColor;
  if (userTextColor) userTextColor.value = state.userAppearance.textColor;
  if (userCardColor) userCardColor.value = state.userAppearance.cardColor;
  
  subscribedArtists = settings.subscribedArtists || [];
  renderSubscribedArtistsList();
}

function saveSettings() {
  state.artistAppearance = {
    bgColor: artistBgColor?.value || '#0f1420',
    primaryColor: artistPrimaryColor?.value || '#867bff',
    textColor: artistTextColor?.value || '#e9efff',
    bubbleColor: artistBubbleColor?.value || '#182132'
  };
  
  state.userAppearance = {
    bgColor: userBgColor?.value || '#0a0e14',
    primaryColor: userPrimaryColor?.value || '#6c63ff',
    textColor: userTextColor?.value || '#e9efff',
    cardColor: userCardColor?.value || '#151e2d'
  };
  
  const settings = {
    artistName: settingsArtistName?.value || '',
    artistAvatar: settingsArtistAvatar?.value || '',
    artistStatus: settingsArtistStatus?.value || '',
    subscribedArtists: subscribedArtists,
    fanName: state.fanName,
    fanLanguage: state.fanLanguage,
    antiFanMode: state.antiFanMode
  };
  saveSettingsToStorage(settings);
  closeSettings();
  applyAppearance('artist');
  renderSubscribedArtistsGrid();
  saveToStorage();
}

function loadSxSettings() {
  if (typeof SxSettings === 'undefined') return null;
  const settings = SxSettings.getSettingsSnapshot();
  console.log('[bubbles] Loaded settings:', {
    characters: settings.characters.length,
    users: settings.users.length,
    npcs: settings.npcs.length,
    worldbookMounts: settings.worldbookMounts?.length || 0
  });
  return settings;
}

loadFromStorage();
loadSxSettings();
applyAppearance('artist');
renderAll();
bindEvents();
console.log('Loaded app: bubbles');
