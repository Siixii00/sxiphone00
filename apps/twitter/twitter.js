const feedEl = document.getElementById('feed');
const tabs = document.querySelectorAll('.tab');
const menuToggle = document.getElementById('menu-toggle');
const drawer = document.getElementById('right-drawer');
const drawerClose = document.getElementById('drawer-close');
const backdrop = document.getElementById('drawer-backdrop');
const fabTweetBtn = document.getElementById('fab-tweet');
const fabMenu = document.getElementById('fab-menu');
const fabComposeBtn = document.getElementById('fab-compose');
const fabAIGenerateBtn = document.getElementById('fab-ai-generate');
const replyGuidelinesInput = document.getElementById('reply-guidelines');
const replyGuidelinesSaveBtn = document.getElementById('reply-guidelines-save');
const wbMountList = document.getElementById('wb-mount-list');
const wbSaveBtn = document.getElementById('wb-save');
const wbRefreshBtn = document.getElementById('wb-refresh');
const mountCharSelect = document.getElementById('mount-char');
const mountUserSelect = document.getElementById('mount-user');

const REPLY_GUIDELINES_KEY = 'sx_twitter_reply_guidelines';
const WORLD_BOOK_MOUNTS_KEY = 'sx_worldbook_mounts';
const WORLD_BOOK_INDEX_KEY = 'sx_worldbook_index';
const CHAR_LIST_KEY = 'sx_characters';
const USER_LIST_KEY = 'sx_users';
const ACTIVE_CHAR_KEY = 'sx_char_name';
const ACTIVE_USER_KEY = 'sx_user_name';
const WORLDVIEW_KEY = 'sx_twitter_worldview';
const COMMUNITY_TONE_KEY = 'sx_twitter_community_tone';
const COMMUNITY_FLAGS_KEY = 'sx_twitter_community_flags';
const NPC_PERSONALITY_KEY = 'sx_twitter_npc_personality';
const HATER_PROFILES_KEY = 'sx_twitter_hater_profiles';
const ENABLE_HATERS_KEY = 'sx_twitter_enable_haters';
const NPC_FOLLOWS_KEY = 'sx_twitter_npc_follows';
const NPC_TWEETS_KEY = 'sx_twitter_npc_tweets';
const GENERATE_USER_TWEETS_KEY = 'sx_twitter_generate_user_tweets';

async function getWorldbookData() {
  const categories = ['cot', 'style', 'global', 'keywords', 'backend'];
  const result = {};
  for (const cat of categories) {
    const key = `sx_worldbook_${cat}`;
    const raw = await sxGetItem(key);
    if (!raw) continue;
    try {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        result[cat] = list;
      }
    } catch (e) {}
  }
  return result;
}

async function getWorldbookContext() {
  const data = await getWorldbookData();
  const entries = [];
  for (const [cat, list] of Object.entries(data)) {
    if (list && list.length > 0) {
      list.slice(0, 5).forEach(e => {
        if (e.enabled && e.title && e.content) {
          entries.push(`【${e.title}】${e.content.slice(0, 200)}`);
        }
      });
    }
  }
  return entries.length > 0 ? entries.join('\n') : '無世界書設定';
}

async function getWorldviewSetting() {
  return await sxGetItem(WORLDVIEW_KEY) || '';
}

async function getCommunityTone() {
  return await sxGetItem(COMMUNITY_TONE_KEY) || 'neutral';
}

async function getCommunityFlags() {
  const raw = await sxGetItem(COMMUNITY_FLAGS_KEY);
  if (!raw) {
    return { criticism: true, sarcasm: true, arguments: false, trolling: false };
  }
  try {
    return JSON.parse(raw);
  } catch {
    return { criticism: true, sarcasm: true, arguments: false, trolling: false };
  }
}

async function getNpcPersonality() {
  return await sxGetItem(NPC_PERSONALITY_KEY) || '';
}

async function getHaterProfiles() {
  return await sxGetItem(HATER_PROFILES_KEY) || '';
}

async function isHatersEnabled() {
  const raw = await sxGetItem(ENABLE_HATERS_KEY);
  return raw === 'true';
}

async function getCommunityContext() {
  const tone = await getCommunityTone();
  const flags = await getCommunityFlags();
  const npcPersonality = await getNpcPersonality();
  const hatersEnabled = await isHatersEnabled();
  const haterProfiles = await getHaterProfiles();
  
  const toneMap = {
    friendly: '社群氛圍友善溫和，大多數用戶禮貌互動',
    neutral: '社群氛圍中立正常，混合各種態度',
    hostile: '社群氛圍充滿爭議，容易引發筆戰和攻擊',
    toxic: '社群氛圍惡意，會有罵人、攻擊性言論'
  };
  
  let context = `# 社群氛圍\n${toneMap[tone] || toneMap.neutral}\n`;
  
  const allowedTypes = [];
  if (flags.criticism) allowedTypes.push('批評言論');
  if (flags.sarcasm) allowedTypes.push('諷刺嘲諷');
  if (flags.arguments) allowedTypes.push('筆戰爭吵');
  if (flags.trolling) allowedTypes.push('釣魚引戰');
  
  if (allowedTypes.length > 0) {
    context += `允許的內容類型: ${allowedTypes.join('、')}\n`;
  }
  
  if (npcPersonality) {
    context += `\n# NPC 回應者個性\n${npcPersonality}\n`;
  }
  
  if (hatersEnabled && haterProfiles) {
    context += `\n# 負面回應者設定\n${haterProfiles}\n`;
  } else if (!hatersEnabled) {
    context += `\n# 負面回應者設定\n已關閉，不會出現罵人或攻擊性用戶\n`;
  }
  
  return context;
}

async function getCharacterData(name) {
  if (!name) return null;
  const raw = await sxGetItem(CHAR_LIST_KEY);
  if (!raw) return null;
  try {
    const list = JSON.parse(raw);
    return list.find(c => c.name === name) || null;
  } catch {
    return null;
  }
}

async function getActiveCharacter() {
  const activeName = await sxGetItem(ACTIVE_CHAR_KEY);
  return await getCharacterData(activeName);
}

async function getUserData() {
  return {
    name: await sxGetItem('sx_user_name') || 'User',
    personality: await sxGetItem('sx_user_personality') || '',
    background: await sxGetItem('sx_user_background') || ''
  };
}

async function getNpcList() {
  const raw = await sxGetItem('sx_npc_list');
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function getNpcFollows() {
  const raw = await sxGetItem(NPC_FOLLOWS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveNpcFollows(follows) {
  await sxSetJSON(NPC_FOLLOWS_KEY, follows);
}

async function getNpcTweets() {
  const raw = await sxGetItem(NPC_TWEETS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveNpcTweets(tweets) {
  const bookmarks = await getBookmarks();
  const bookmarkIds = bookmarks.map(b => b.id || b.timestamp);
  const preservedTweets = tweets.filter(t => bookmarkIds.includes(t.id || t.timestamp));
  const regularTweets = tweets.filter(t => !bookmarkIds.includes(t.id || t.timestamp));
  const maxRegularTweets = 50;
  const trimmedRegular = regularTweets.slice(0, maxRegularTweets);
  const finalTweets = [...preservedTweets, ...trimmedRegular];
  finalTweets.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  await sxSetJSON(NPC_TWEETS_KEY, finalTweets);
}

async function cleanupOldTweets() {
  const bookmarks = await getBookmarks();
  const bookmarkIds = bookmarks.map(b => b.id || b.timestamp);
  
  const npcTweets = await getNpcTweets();
  const npcTweetsToRemove = npcTweets.filter(t => !bookmarkIds.includes(t.id || t.timestamp));
  for (const tweet of npcTweetsToRemove) {
    await addTweetMemory(tweet);
  }
  
  const preservedNpcTweets = npcTweets.filter(t => bookmarkIds.includes(t.id || t.timestamp));
  const regularNpcTweets = npcTweets.filter(t => !bookmarkIds.includes(t.id || t.timestamp));
  const trimmedNpcTweets = regularNpcTweets.slice(0, 50);
  const finalNpcTweets = [...preservedNpcTweets, ...trimmedNpcTweets];
  finalNpcTweets.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  await sxSetJSON(NPC_TWEETS_KEY, finalNpcTweets);
  
  userTweets.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  await saveUserTweets();
}

async function shouldGenerateUserTweets() {
  const raw = await sxGetItem(GENERATE_USER_TWEETS_KEY);
  return raw !== 'false';
}

async function getChatHistory(limit = 15) {
  const raw = await sxGetItem('sx_chat_history');
  if (!raw) return [];
  try {
    const history = JSON.parse(raw);
    return history.slice(-limit);
  } catch {
    return [];
  }
}

async function getChatHistoryContext() {
  const history = await getChatHistory(15);
  if (history.length === 0) return '無聊天記錄';
  const user = await getUserData();
  return history.map(msg => {
    const role = msg.role === 'user' ? user.name : '角色';
    return `${role}: ${msg.content.slice(0, 100)}`;
  }).join('\n');
}

async function getApiConfig() {
  const raw = await sxGetItem('api_configs');
  if (!raw) return null;
  try {
    const configs = JSON.parse(raw);
    const activeIndex = Number(await sxGetItem('sx_active_api') || 0);
    return configs[activeIndex] || configs[0] || null;
  } catch {
    return null;
  }
}

async function callAIAPI(messages, temperature = 0.85) {
  const config = await getApiConfig();
  if (!config || !config.url) {
    throw new Error('尚未設定 API');
  }

  const apiType = config.type || 'openai';
  
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

async function buildTwitterContext() {
  const user = await getUserData();
  const char = await getActiveCharacter();
  const worldbook = await getWorldbookContext();
  const chatHistory = await getChatHistoryContext();
  const worldview = await getWorldviewSetting();
  const communityContext = await getCommunityContext();

  let context = `# 使用者設定\n名稱: ${user.name}\n`;
  if (user.personality) context += `性格: ${user.personality}\n`;
  if (user.background) context += `背景: ${user.background}\n`;

  if (char) {
    context += `\n# 角色設定\n名稱: ${char.name}\n`;
    if (char.personality) context += `性格: ${char.personality}\n`;
    if (char.background) context += `背景: ${char.background}\n`;
  }

  context += `\n# 世界書\n${worldbook}\n`;

  if (worldview) {
    context += `\n# 世界觀設定\n${worldview}\n`;
  }

  context += `\n${communityContext}\n`;

  if (chatHistory !== '無聊天記錄') {
    context += `\n# 近期對話\n${chatHistory}\n`;
  }

  return context;
}

let isGeneratingTweets = false;

async function generateAITweets() {
  if (isGeneratingTweets) {
    alert('正在生成中，請稍候...');
    return;
  }

  isGeneratingTweets = true;
  const generateBtn = document.getElementById('ai-generate-btn');
  const fabAiBtn = document.getElementById('fab-ai-generate');
  if (generateBtn) {
    generateBtn.disabled = true;
    generateBtn.textContent = '生成中...';
  }
  if (fabAiBtn) {
    fabAiBtn.disabled = true;
  }

  try {
    const context = await buildTwitterContext();
    const char = await getActiveCharacter();
    const npcFollows = await getNpcFollows();
    const generateUserTweets = await shouldGenerateUserTweets();
    const lang = await sxGetItem('sxiphone_lang') || 'zh-TW';

    const systemPrompt = `你是一位專業的社群媒體內容創作者，擅長根據角色設定和使用者背景創作符合人物性格的推文。
請使用 ${window.getAIReadableLangName?.(lang) || '繁體中文'} 撰寫。
輸出格式為 JSON: {"tweets": [{"author": "作者名稱", "content": "推文內容", "likes": 隨機讚數, "retweets": 隨機轉推數, "replies": 隨機回覆數}]}`;

    let authors = [];
    if (generateUserTweets) authors.push('你');
    if (char) authors.push(char.name);
    if (npcFollows.length > 0) authors.push(...npcFollows);

    if (authors.length === 0) {
      alert('請至少選擇一個角色或 NPC');
      isGeneratingTweets = false;
      return;
    }

    const prompt = `${context}

請為以下作者各生成 1-2 則推文：${authors.join('、')}
要求：
1. 符合各角色性格和設定
2. 自然融入世界書和世界觀設定
3. 根據社群氛圍調整語氣和風格
4. 每則推文 30-100 字
5. 語氣自然、有互動感

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

    const tweets = Array.isArray(parsed?.tweets) ? parsed.tweets : [];

    for (const tweet of tweets) {
      if (tweet.content) {
        const author = tweet.author || '你';
        if (author === '你') {
          await addTweet(tweet.content);
        } else {
          await addNpcTweet(author, tweet.content);
        }
      }
    }

    if (tweets.length === 0) {
      alert('生成失敗，請稍後重試');
    }
  } catch (err) {
    alert(`生成失敗: ${err.message}`);
  } finally {
    isGeneratingTweets = false;
    if (generateBtn) {
      generateBtn.disabled = false;
      generateBtn.textContent = 'AI 生成推文';
    }
    if (fabAiBtn) {
      fabAiBtn.disabled = false;
    }
  }
}

async function getWorldbookIndex() {
  const raw = await sxGetItem(WORLD_BOOK_INDEX_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function getWorldbookMounts() {
  const raw = await sxGetItem(WORLD_BOOK_MOUNTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function renderWorldbookMountList() {
  if (!wbMountList) return;
  const index = await getWorldbookIndex();
  const mounts = await getWorldbookMounts();
  const mountMap = new Map(mounts.map(item => [item.name, item]));
  const items = index.length ? index : [{ title: '通用常識庫' }];

  wbMountList.innerHTML = items.map(entry => {
    const name = entry.title || entry.name || '未命名世界書';
    const mount = mountMap.get(name) || {};
    const enabled = mount.enabled ?? false;
    const position = mount.position || 'mid';
    return `
      <div class="wb-mount-item">
        <label>
          <input type="checkbox" class="wb-enable" data-wb-name="${name}" ${enabled ? 'checked' : ''}>
          <span>${name}</span>
        </label>
        <select class="wb-mount-position" data-wb-name="${name}">
          <option value="top" ${position === 'top' ? 'selected' : ''}>前</option>
          <option value="mid" ${position === 'mid' ? 'selected' : ''}>中</option>
          <option value="bottom" ${position === 'bottom' ? 'selected' : ''}>後</option>
        </select>
      </div>
    `;
  }).join('');
}

async function saveWorldbookMounts() {
  if (!wbMountList) return;
  const rows = wbMountList.querySelectorAll('.wb-mount-item');
  const mounts = [];
  rows.forEach(row => {
    const checkbox = row.querySelector('.wb-enable');
    const select = row.querySelector('.wb-mount-position');
    const name = checkbox?.dataset.wbName || select?.dataset.wbName;
    if (!name) return;
    mounts.push({
      name,
      enabled: checkbox?.checked || false,
      position: select?.value || 'mid'
    });
  });
  await sxSetJSON(WORLD_BOOK_MOUNTS_KEY, mounts);
  if (wbSaveBtn) {
    wbSaveBtn.textContent = '已儲存';
    setTimeout(() => {
      wbSaveBtn.textContent = '儲存掛載設定';
    }, 1200);
  }
}

async function loadListFromStorage(key) {
  const raw = await sxGetItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function renderMountSelect(selectEl, list, activeName, placeholder) {
  if (!selectEl) return;
  const options = [];
  options.push(`<option value="">${placeholder}</option>`);
  list.forEach(item => {
    const name = item.name || '未命名';
    const selected = activeName && activeName === name ? 'selected' : '';
    options.push(`<option value="${name}" ${selected}>${name}</option>`);
  });
  selectEl.innerHTML = options.join('');
}

async function renderMountLists() {
  const charList = await loadListFromStorage(CHAR_LIST_KEY);
  const userList = await loadListFromStorage(USER_LIST_KEY);
  const activeChar = await sxGetItem(ACTIVE_CHAR_KEY) || '';
  const activeUser = await sxGetItem(ACTIVE_USER_KEY) || '';
  renderMountSelect(mountCharSelect, charList, activeChar, '選擇角色');
  renderMountSelect(mountUserSelect, userList, activeUser, '選擇用戶');
  await renderNpcFollowList();
}

async function renderNpcFollowList() {
  const container = document.getElementById('npc-follow-list');
  if (!container) return;
  
  const npcList = await getNpcList();
  const follows = await getNpcFollows();
  
  if (npcList.length === 0) {
    container.innerHTML = '<div class="settings-hint">尚未建立 NPC</div>';
    return;
  }
  
  container.innerHTML = npcList.map(npc => {
    const name = npc.name || '未命名';
    const isFollowed = follows.includes(name);
    return `
      <div class="npc-follow-item">
        <span class="npc-name">${name}</span>
        <label>
          <input type="checkbox" class="npc-follow-check" data-npc-name="${name}" ${isFollowed ? 'checked' : ''}>
          <span>關注</span>
        </label>
      </div>
    `;
  }).join('');
  
  container.querySelectorAll('.npc-follow-check').forEach(check => {
    check.addEventListener('change', async () => {
      const npcName = check.dataset.npcName;
      let currentFollows = await getNpcFollows();
      if (check.checked) {
        if (!currentFollows.includes(npcName)) {
          currentFollows.push(npcName);
        }
      } else {
        currentFollows = currentFollows.filter(n => n !== npcName);
      }
      await saveNpcFollows(currentFollows);
    });
  });
}

const BOOKMARKS_KEY = 'sx_twitter_bookmarks';
const PROFILE_KEY = 'sx_twitter_profile';
const TWEET_MEMORIES_KEY = 'sx_twitter_tweet_memories';

async function getTweetMemories() {
  const raw = await sxGetItem(TWEET_MEMORIES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function saveTweetMemories(memories) {
  if (memories.length > 500) {
    memories = memories.slice(-500);
  }
  await sxSetJSON(TWEET_MEMORIES_KEY, memories);
}

async function addTweetMemory(tweet) {
  if (tweet.author === '你') return;
  
  const memories = await getTweetMemories();
  const existingMemory = memories.find(m => m.id === tweet.id || m.timestamp === tweet.timestamp);
  if (existingMemory) return;
  
  const date = new Date(tweet.timestamp || Date.now());
  const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  
  memories.push({
    id: tweet.id || tweet.timestamp,
    author: tweet.author,
    content: tweet.content,
    date: dateStr,
    timestamp: tweet.timestamp
  });
  
  await saveTweetMemories(memories);
}

async function getTwitterProfile() {
  const raw = await sxGetItem(PROFILE_KEY);
  const userName = await sxGetItem('sx_user_name') || 'User';
  const defaultProfile = {
    name: userName,
    handle: '@' + userName.toLowerCase().replace(/\s+/g, '_'),
    bio: '',
    avatarGradient: 'linear-gradient(135deg, #2d89ef, #8ec5ff)'
  };
  if (!raw) return defaultProfile;
  try {
    return { ...defaultProfile, ...JSON.parse(raw) };
  } catch {
    return defaultProfile;
  }
}

async function getBookmarks() {
  const raw = await sxGetItem(BOOKMARKS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function saveBookmarks(bookmarks) {
  await sxSetJSON(BOOKMARKS_KEY, bookmarks);
}

async function isTweetBookmarked(tweetId) {
  const bookmarks = await getBookmarks();
  return bookmarks.some(b => b.id === tweetId || b.timestamp === tweetId);
}

async function toggleTweetBookmark(tweet) {
  const bookmarks = await getBookmarks();
  const tweetId = tweet.id || tweet.timestamp;
  const existingIndex = bookmarks.findIndex(b => b.id === tweetId || b.timestamp === tweetId);
  
  if (existingIndex >= 0) {
    bookmarks.splice(existingIndex, 1);
    await saveBookmarks(bookmarks);
    return false;
  } else {
    bookmarks.unshift({
      id: tweetId,
      author: tweet.author,
      handle: tweet.handle,
      content: tweet.content,
      timestamp: tweet.timestamp,
      bookmarkedAt: Date.now(),
      stats: tweet.stats
    });
    await saveBookmarks(bookmarks);
    return true;
  }
}

const sampleTweets = {
  forYou: [],
  following: []
};

let activeTab = 'forYou';
let userTweets = [];
const USER_TWEETS_KEY = 'sx_twitter_user_tweets';

async function saveUserTweets() {
  userTweets.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  const data = JSON.stringify(userTweets);
  try {
    await sxSetItem(USER_TWEETS_KEY, data);
  } catch (e) {
    console.warn('[twitter] localStorage 儲存失敗:', e);
  }
  try {
    sessionStorage.setItem(USER_TWEETS_KEY, data);
  } catch (e) {
    console.warn('[twitter] sessionStorage 儲存失敗:', e);
  }
}

async function saveNpcTweets(tweets) {
  const bookmarks = await getBookmarks();
  const bookmarkIds = bookmarks.map(b => b.id || b.timestamp);
  
  const tweetsToRemove = tweets.filter(t => !bookmarkIds.includes(t.id || t.timestamp));
  for (const tweet of tweetsToRemove) {
    await addTweetMemory(tweet);
  }
  
  const preservedTweets = tweets.filter(t => bookmarkIds.includes(t.id || t.timestamp));
  const regularTweets = tweets.filter(t => !bookmarkIds.includes(t.id || t.timestamp));
  const trimmedRegular = regularTweets.slice(0, 50);
  const finalTweets = [...preservedTweets, ...trimmedRegular];
  finalTweets.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  await sxSetJSON(NPC_TWEETS_KEY, finalTweets);
}

async function loadUserTweets() {
  let raw = null;
  try {
    raw = await sxGetItem(USER_TWEETS_KEY);
  } catch (e) {
    console.warn('[twitter] localStorage 讀取失敗:', e);
  }
  if (!raw) {
    try {
      raw = sessionStorage.getItem(USER_TWEETS_KEY);
    } catch (e) {
      console.warn('[twitter] sessionStorage 讀取失敗:', e);
    }
  }
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('[twitter] JSON 解析失敗:', e);
    }
  }
  return [];
}

async function renderTweets() {
  if (!feedEl) return;
  
  await cleanupOldTweets();
  
  const char = await getActiveCharacter();
  const npcFollows = await getNpcFollows();
  const npcTweets = await getNpcTweets();
  const profile = await getTwitterProfile();
  
  let all = [...userTweets];
  
  if (char) {
    const charTweets = npcTweets.filter(t => t.author === char.name);
    all = [...all, ...charTweets];
  }
  
  if (npcFollows.length > 0) {
    const followedNpcTweets = npcTweets.filter(t => npcFollows.includes(t.author));
    all = [...all, ...followedNpcTweets];
  }
  
  const bookmarkIds = new Set((await getBookmarks()).map(b => b.id || b.timestamp));
  const userIds = new Set(userTweets.map(t => t.id || t.timestamp));
  const preservedIds = new Set([...bookmarkIds, ...userIds]);
  
  const preservedTweets = all.filter(t => preservedIds.has(t.id || t.timestamp));
  const regularTweets = all.filter(t => !preservedIds.has(t.id || t.timestamp));
  const displayTweets = [...preservedTweets, ...regularTweets.slice(0, 50)];
  
  displayTweets.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  if (displayTweets.length === 0) {
    feedEl.innerHTML = '<div class="empty-state">歡迎使用推特</div>';
    return;
  }

  feedEl.innerHTML = displayTweets.map(tweet => {
    const tweetId = tweet.id || tweet.timestamp;
    const isUserTweet = tweet.author === '你';
    const avatarStyle = isUserTweet ? `style="background: ${profile.avatarGradient || 'linear-gradient(135deg, #2d89ef, #8ec5ff)'}"` : '';
    const displayName = isUserTweet ? profile.name : tweet.author;
    const displayHandle = isUserTweet ? profile.handle : tweet.handle;
    
    return `
    <article class="tweet" data-tweet-id="${tweetId}">
      <div class="avatar" ${avatarStyle}></div>
      <div>
        <div class="tweet-header">
          <div>
            <span class="tweet-author">${displayName}</span>
            <span>${displayHandle} · ${tweet.time}</span>
          </div>
          <i class="fas fa-ellipsis"></i>
        </div>
        <div class="tweet-body">${tweet.content}</div>
        <div class="tweet-actions">
          <button type="button" data-action="reply"><i class="far fa-comment"></i><span>${tweet.stats.reply}</span></button>
          <button type="button" data-action="retweet"><i class="fas fa-retweet"></i><span>${tweet.stats.retweet}</span></button>
          <button type="button" data-action="like"><i class="far fa-heart"></i><span>${tweet.stats.like}</span></button>
          <button type="button" data-action="bookmark" class="tweet-bookmark-btn" data-tweet-id="${tweetId}"><i class="far fa-bookmark"></i></button>
        </div>
      </div>
    </article>
  `}).join('');
  
  updateBookmarkIcons();
}

async function updateBookmarkIcons() {
  const bookmarkBtns = feedEl.querySelectorAll('.tweet-bookmark-btn');
  for (const btn of bookmarkBtns) {
    const tweetId = parseFloat(btn.dataset.tweetId);
    const isBookmarked = await isTweetBookmarked(tweetId);
    const icon = btn.querySelector('i');
    icon.className = isBookmarked ? 'fas fa-bookmark' : 'far fa-bookmark';
    btn.classList.toggle('bookmarked', isBookmarked);
  }
}

async function switchTab(tab) {
  activeTab = tab;
  tabs.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
  await renderTweets();
}

async function addTweet(content) {
  const trimmed = content.trim();
  if (!trimmed) return;
  const tweet = {
    author: '你',
    handle: '@you',
    time: '現在',
    content: trimmed.replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    stats: { reply: 0, retweet: 0, like: 0 },
    timestamp: Date.now()
  };
  userTweets.unshift(tweet);
  await saveUserTweets();
  await renderTweets();
  await scheduleReactionsForTweet(tweet);
}

async function addNpcTweet(npcName, content) {
  const trimmed = content.trim();
  if (!trimmed) return;
  const npcTweets = await getNpcTweets();
  const tweet = {
    author: npcName,
    handle: `@${npcName.toLowerCase().replace(/\s+/g, '_')}`,
    time: '現在',
    content: trimmed.replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    stats: { reply: 0, retweet: 0, like: 0 },
    timestamp: Date.now()
  };
  npcTweets.unshift(tweet);
  await saveNpcTweets(npcTweets);
  await renderTweets();
}

async function addRetweetToFeed(retweeterName, tweetContent, originalAuthor) {
  const npcTweets = await getNpcTweets();
  npcTweets.unshift({
    author: retweeterName,
    handle: `@${retweeterName.toLowerCase().replace(/\s+/g, '_')}`,
    time: '現在',
    content: `轉發了 @${originalAuthor} 的推文\n${tweetContent}`,
    stats: { reply: 0, retweet: 0, like: 0 },
    timestamp: Date.now(),
    isRetweet: true,
    originalAuthor
  });
  await saveNpcTweets(npcTweets);
  await renderTweets();
}

function toggleDrawer(open) {
  console.log('[Twitter] toggleDrawer called, open:', open);
  console.log('[Twitter] drawer element:', drawer);
  console.log('[Twitter] backdrop element:', backdrop);
  
  if (!drawer) {
    console.error('[Twitter] drawer element not found!');
    return;
  }
  if (!backdrop) {
    console.error('[Twitter] backdrop element not found!');
    return;
  }
  
  drawer.classList.toggle('open', open);
  backdrop.classList.toggle('show', open);
  console.log('[Twitter] drawer classes:', drawer.className);
  console.log('[Twitter] backdrop classes:', backdrop.className);
}

async function showComposeModal() {
  const content = prompt('有什麼新鮮事？');
  if (content && content.trim()) {
    await addTweet(content.trim());
  }
  closeFabMenu();
}

let fabMenuOpen = false;

function toggleFabMenu() {
  fabMenuOpen = !fabMenuOpen;
  fabMenu?.classList.toggle('show', fabMenuOpen);
  fabTweetBtn?.classList.toggle('open', fabMenuOpen);
}

function closeFabMenu() {
  fabMenuOpen = false;
  fabMenu?.classList.remove('show');
  fabTweetBtn?.classList.remove('open');
}

async function bindEvents() {
  tabs.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  fabTweetBtn?.addEventListener('click', toggleFabMenu);
  fabComposeBtn?.addEventListener('click', showComposeModal);
  fabAIGenerateBtn?.addEventListener('click', async () => {
    closeFabMenu();
    await generateAITweets();
  });

  document.addEventListener('click', (e) => {
    if (fabMenuOpen && !fabMenu?.contains(e.target) && !fabTweetBtn?.contains(e.target)) {
      closeFabMenu();
    }
  });

  menuToggle?.addEventListener('click', () => toggleDrawer(true));
  drawerClose?.addEventListener('click', () => toggleDrawer(false));
  backdrop?.addEventListener('click', () => toggleDrawer(false));

  document.querySelectorAll('[data-open-app]')?.forEach(btn => {
    btn.addEventListener('click', () => {
      const appId = btn.dataset.openApp;
      const anchor = btn.dataset.settingsAnchor;
      if (!appId) return;
      const targetApp = anchor && appId === 'settings' ? `${appId}?anchor=${anchor}` : appId;
      window.parent?.postMessage({ type: 'openApp', appId: targetApp }, '*');
      toggleDrawer(false);
    });
  });

  if (replyGuidelinesInput) {
    const saved = await sxGetItem(REPLY_GUIDELINES_KEY);
    replyGuidelinesInput.value = saved || '';
  }

  replyGuidelinesSaveBtn?.addEventListener('click', async () => {
    if (!replyGuidelinesInput) return;
    const value = replyGuidelinesInput.value.trim();
    await sxSetItem(REPLY_GUIDELINES_KEY, value);
    replyGuidelinesSaveBtn.textContent = '已儲存';
    setTimeout(() => {
      replyGuidelinesSaveBtn.textContent = '儲存注意事項';
    }, 1200);
  });

  if (wbMountList) {
    await renderWorldbookMountList();
  }
  await renderMountLists();
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: 'REQUEST_APP_FOLDER_SYNC', appId: 'settings' }, '*');
  }
  wbSaveBtn?.addEventListener('click', async () => {
    await saveWorldbookMounts();
  });
  wbRefreshBtn?.addEventListener('click', async () => {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'REQUEST_WORLD_BOOK_SYNC' }, '*');
    }
    await renderWorldbookMountList();
  });

  mountCharSelect?.addEventListener('change', async () => {
    const value = mountCharSelect.value;
    if (!value) return;
    await sxSetItem(ACTIVE_CHAR_KEY, value);
    mountCharSelect.blur();
  });

  mountUserSelect?.addEventListener('change', async () => {
    const value = mountUserSelect.value;
    if (!value) return;
    await sxSetItem(ACTIVE_USER_KEY, value);
    mountUserSelect.blur();
  });

  const worldviewInput = document.getElementById('worldview-setting');
  const worldviewSaveBtn = document.getElementById('worldview-save');
  if (worldviewInput) {
    worldviewInput.value = await getWorldviewSetting();
  }
  worldviewSaveBtn?.addEventListener('click', async () => {
    if (!worldviewInput) return;
    const value = worldviewInput.value.trim();
    await sxSetItem(WORLDVIEW_KEY, value);
    worldviewSaveBtn.textContent = '已儲存';
    setTimeout(() => {
      worldviewSaveBtn.textContent = '儲存世界觀';
    }, 1200);
  });

  const communityToneSelect = document.getElementById('community-tone');
  if (communityToneSelect) {
    communityToneSelect.value = await getCommunityTone();
    communityToneSelect.addEventListener('change', async () => {
      await sxSetItem(COMMUNITY_TONE_KEY, communityToneSelect.value);
    });
  }

  const criticismCheck = document.getElementById('allow-criticism');
  const sarcasmCheck = document.getElementById('allow-sarcasm');
  const argumentsCheck = document.getElementById('allow-arguments');
  const trollingCheck = document.getElementById('allow-trolling');
  
  const savedFlags = await getCommunityFlags();
  if (criticismCheck) criticismCheck.checked = savedFlags.criticism;
  if (sarcasmCheck) sarcasmCheck.checked = savedFlags.sarcasm;
  if (argumentsCheck) argumentsCheck.checked = savedFlags.arguments;
  if (trollingCheck) trollingCheck.checked = savedFlags.trolling;

  const saveCommunityFlags = async () => {
    const flags = {
      criticism: criticismCheck?.checked || false,
      sarcasm: sarcasmCheck?.checked || false,
      arguments: argumentsCheck?.checked || false,
      trolling: trollingCheck?.checked || false
    };
    await sxSetJSON(COMMUNITY_FLAGS_KEY, flags);
  };

  criticismCheck?.addEventListener('change', saveCommunityFlags);
  sarcasmCheck?.addEventListener('change', saveCommunityFlags);
  argumentsCheck?.addEventListener('change', saveCommunityFlags);
  trollingCheck?.addEventListener('change', saveCommunityFlags);

  const npcPersonalityInput = document.getElementById('npc-personality');
  if (npcPersonalityInput) {
    npcPersonalityInput.value = await getNpcPersonality();
  }

  const haterProfilesInput = document.getElementById('hater-profiles');
  if (haterProfilesInput) {
    haterProfilesInput.value = await getHaterProfiles();
  }

  const enableHatersToggle = document.getElementById('enable-haters');
  const haterSettingsPanel = document.getElementById('hater-settings');
  
  if (enableHatersToggle) {
    enableHatersToggle.checked = await isHatersEnabled();
    if (haterSettingsPanel) {
      haterSettingsPanel.style.display = enableHatersToggle.checked ? 'block' : 'none';
    }
    enableHatersToggle.addEventListener('change', async () => {
      const enabled = enableHatersToggle.checked;
      await sxSetItem(ENABLE_HATERS_KEY, String(enabled));
      if (haterSettingsPanel) {
        haterSettingsPanel.style.display = enabled ? 'block' : 'none';
      }
    });
  }

  const communitySaveBtn = document.getElementById('community-save');
  communitySaveBtn?.addEventListener('click', async () => {
    await saveCommunityFlags();
    if (npcPersonalityInput) {
      await sxSetItem(NPC_PERSONALITY_KEY, npcPersonalityInput.value.trim());
    }
    if (haterProfilesInput) {
      await sxSetItem(HATER_PROFILES_KEY, haterProfilesInput.value.trim());
    }
    communitySaveBtn.textContent = '已儲存';
    setTimeout(() => {
      communitySaveBtn.textContent = '儲存社群設定';
    }, 1200);
  });

  const generateUserTweetsToggle = document.getElementById('generate-user-tweets');
  if (generateUserTweetsToggle) {
    generateUserTweetsToggle.checked = await shouldGenerateUserTweets();
    generateUserTweetsToggle.addEventListener('change', async () => {
      await sxSetItem(GENERATE_USER_TWEETS_KEY, String(generateUserTweetsToggle.checked));
    });
  }
  
  feedEl?.addEventListener('click', async (e) => {
    const bookmarkBtn = e.target.closest('[data-action="bookmark"]');
    if (bookmarkBtn) {
      const article = bookmarkBtn.closest('.tweet');
      const tweetId = parseFloat(article.dataset.tweetId);
      const tweets = await getNpcTweets();
      const userTweetsList = userTweets;
      const allTweets = [...tweets, ...userTweetsList];
      const tweet = allTweets.find(t => (t.id || t.timestamp) === tweetId);
      if (tweet) {
        const nowBookmarked = await toggleTweetBookmark(tweet);
        bookmarkBtn.classList.toggle('bookmarked', nowBookmarked);
        const icon = bookmarkBtn.querySelector('i');
        icon.className = nowBookmarked ? 'fas fa-bookmark' : 'far fa-bookmark';
      }
    }
  });
}

const saveTwitterData = async () => {
  try {
    const guidelines = replyGuidelinesInput?.value || '';
    await sxSetItem(REPLY_GUIDELINES_KEY, guidelines);
  } catch (e) {
    console.warn('[twitter] 保存數據失敗:', e);
  }
  await saveUserTweets();
};

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
              (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

if (isIOS) {
  window.addEventListener('pagehide', async (e) => {
    await saveUserTweets();
    await saveTwitterData();
  });
  window.addEventListener('pageshow', async () => {
    userTweets = await loadUserTweets();
    await renderTweets();
  });
}

window.addEventListener('pagehide', saveTwitterData);
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'hidden') {
    await saveUserTweets();
    await saveTwitterData();
  }
});

window.addEventListener('beforeunload', async () => {
  await saveUserTweets();
  await saveTwitterData();
});

window.addEventListener('message', async (event) => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;
  if (data.type === 'WORLD_BOOK_SYNC_READY') {
    await renderWorldbookMountList();
  }
  if (data.type === 'APP_FOLDER_SYNC' && data.appId === 'settings' && data.data?.storage) {
    const storage = data.data.storage;
    if (storage.sx_characters) await sxSetItem(CHAR_LIST_KEY, storage.sx_characters);
    if (storage.sx_users) await sxSetItem(USER_LIST_KEY, storage.sx_users);
    await renderMountLists();
  }
  if (data.type === 'settingsUpdated') {
    await renderMountLists();
  }
  if (data.type === 'APP_WILL_CLOSE') {
    await saveUserTweets();
    await saveTwitterData();
  }
});

(async () => {
  await bindEvents();
  userTweets = await loadUserTweets();
  await renderTweets();
})();

const PENDING_REACTIONS_KEY = 'sx_twitter_pending_reactions';
const NOTIFICATIONS_KEY = 'sx_twitter_notifications';

let notificationInterval = null;

async function startNotificationSystem() {
  if (notificationInterval) return;
  notificationInterval = setInterval(processPendingReactions, 10000);
  await processPendingReactions();
}

function stopNotificationSystem() {
  if (notificationInterval) {
    clearInterval(notificationInterval);
    notificationInterval = null;
  }
}

window.addEventListener('pagehide', stopNotificationSystem);

startNotificationSystem();

async function getPendingReactions() {
  const raw = await sxGetItem(PENDING_REACTIONS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function savePendingReactions(reactions) {
  await sxSetJSON(PENDING_REACTIONS_KEY, reactions);
}

async function addNotification(notification) {
  const raw = await sxGetItem(NOTIFICATIONS_KEY);
  let notifications = [];
  try {
    notifications = JSON.parse(raw) || [];
  } catch {}
  notifications.unshift({
    ...notification,
    id: Date.now() + Math.random(),
    timestamp: Date.now(),
    read: false
  });
  if (notifications.length > 100) notifications.length = 100;
  await sxSetJSON(NOTIFICATIONS_KEY, notifications);
}

async function scheduleReactionsForTweet(tweet) {
  const npcFollows = await getNpcFollows();
  const npcList = await getNpcList();
  if (npcFollows.length === 0) return;
  
  const reactions = await getPendingReactions();
  
  for (const npcName of npcFollows) {
    const npc = npcList.find(n => n.name === npcName);
    if (!npc) continue;
    
    if (Math.random() > 0.5) continue;
    
    const reactionType = Math.random();
    const minDelay = 30000;
    const maxDelay = 28800000;
    const delay = Math.random() * (maxDelay - minDelay) + minDelay;
    const scheduledTime = Date.now() + delay;
    
    if (reactionType < 0.4) {
      reactions.push({
        type: 'like',
        fromName: npcName,
        tweetContent: tweet.content,
        tweetAuthor: tweet.author,
        scheduledTime
      });
    } else if (reactionType < 0.7) {
      reactions.push({
        type: 'retweet',
        fromName: npcName,
        tweetContent: tweet.content,
        tweetAuthor: tweet.author,
        scheduledTime
      });
    } else {
      reactions.push({
        type: 'reply',
        fromName: npcName,
        tweetContent: tweet.content,
        tweetAuthor: tweet.author,
        scheduledTime
      });
    }
  }
  
  await savePendingReactions(reactions);
}

async function processPendingReactions() {
  const reactions = await getPendingReactions();
  const now = Date.now();
  const remaining = [];
  
  for (const reaction of reactions) {
    if (now >= reaction.scheduledTime) {
      await executeReaction(reaction);
    } else {
      remaining.push(reaction);
    }
  }
  
  await savePendingReactions(remaining);
}

async function executeReaction(reaction) {
  const { type, fromName, tweetContent, tweetAuthor } = reaction;
  
  switch (type) {
    case 'like':
      await addNotification({
        type: 'like',
        fromName,
        tweetContent,
        tweetAuthor
      });
      break;
      
    case 'retweet':
      await addNotification({
        type: 'retweet',
        fromName,
        tweetContent,
        tweetAuthor
      });
      await addRetweetToFeed(fromName, tweetContent, tweetAuthor);
      break;
      
    case 'reply':
      const replies = ['這個觀點很有趣！', '同意！', '說得好', '推一個', '真的假的？', '哈哈沒錯', '我也這麼覺得', '太扯了吧', '感謝分享！', '學到了新東西'];
      const replyContent = replies[Math.floor(Math.random() * replies.length)];
      await addNotification({
        type: 'reply',
        fromName,
        tweetContent,
        replyContent
      });
      await addNpcTweet(fromName, replyContent);
      break;
  }
}

async function updateNotificationBadge() {
  const raw = await sxGetItem(NOTIFICATIONS_KEY);
  let notifications = [];
  try {
    notifications = JSON.parse(raw) || [];
  } catch {}
  const count = notifications.filter(n => !n.read).length;
  const badge = document.getElementById('notification-badge');
  if (badge) {
    badge.textContent = count > 99 ? '99+' : count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

setInterval(updateNotificationBadge, 30000);
setTimeout(updateNotificationBadge, 1000);