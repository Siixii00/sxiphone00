const STORAGE_KEY = 'instagram:custom-settings';
const IG_STORIES_KEY = 'sx_instagram_stories';
const IG_POSTS_KEY = 'sx_instagram_posts';
const IG_USER_POSTS_KEY = 'sx_instagram_user_posts';
const IG_SAVED_POSTS_KEY = 'sx_instagram_saved_posts';
const IG_POST_MEMORIES_KEY = 'sx_instagram_post_memories';

const CHAR_LIST_KEY = 'sx_characters';
const USER_LIST_KEY = 'sx_users';
const ACTIVE_CHAR_KEY = 'sx_char_name';

function getPostMemories() {
  const raw = localStorage.getItem(IG_POST_MEMORIES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function savePostMemories(memories) {
  if (memories.length > 500) {
    memories = memories.slice(-500);
  }
  localStorage.setItem(IG_POST_MEMORIES_KEY, JSON.stringify(memories));
}

function addPostMemory(post) {
  if (post.isUserPost) return;
  
  const memories = getPostMemories();
  const existingMemory = memories.find(m => m.id === post.id);
  if (existingMemory) return;
  
  const date = new Date(post.timestamp || Date.now());
  const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  
  memories.push({
    id: post.id,
    user: post.user,
    caption: post.caption,
    date: dateStr,
    timestamp: post.timestamp
  });
  
  savePostMemories(memories);
}

function getSavedPosts() {
  const raw = localStorage.getItem(IG_SAVED_POSTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveSavedPosts(savedIds) {
  localStorage.setItem(IG_SAVED_POSTS_KEY, JSON.stringify(savedIds));
}

function getUserPosts() {
  const raw = localStorage.getItem(IG_USER_POSTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveUserPosts(posts) {
  posts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  localStorage.setItem(IG_USER_POSTS_KEY, JSON.stringify(posts));
}

function getStoredPosts() {
  const raw = localStorage.getItem(IG_POSTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveStoredPosts(posts) {
  const savedIds = new Set(getSavedPosts());
  const userIds = new Set(getUserPosts().map(p => p.id));
  const preservedIds = new Set([...savedIds, ...userIds]);
  
  const toRemove = posts.filter(p => !preservedIds.has(p.id));
  toRemove.forEach(post => addPostMemory(post));
  
  const preservedPosts = posts.filter(p => preservedIds.has(p.id));
  const regularPosts = posts.filter(p => !preservedIds.has(p.id));
  const trimmedRegular = regularPosts.slice(0, 50);
  const finalPosts = [...preservedPosts, ...trimmedRegular];
  finalPosts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  
  localStorage.setItem(IG_POSTS_KEY, JSON.stringify(finalPosts));
}

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
  const activeName = localStorage.getItem(ACTIVE_CHAR_KEY);
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

  const endpoint = config.url.endsWith('/chat/completions')
    ? config.url
    : `${config.url.replace(/\/$/, '')}/chat/completions`;

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

function buildInstagramContext() {
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

let isGeneratingPosts = false;

async function generateAIPosts() {
  if (isGeneratingPosts) {
    alert('正在生成中，請稍候...');
    return;
  }

  isGeneratingPosts = true;
  const generateBtn = document.getElementById('ai-generate-posts-btn');
  if (generateBtn) {
    generateBtn.disabled = true;
    generateBtn.textContent = '生成中...';
  }

  try {
    const context = buildInstagramContext();
    const lang = localStorage.getItem('sxiphone_lang') || 'zh-TW';

    const systemPrompt = `你是一位專業的社群媒體內容創作者，擅長根據角色設定和使用者背景創作符合人物性格的 Instagram 貼文。
請使用 ${window.getAIReadableLangName?.(lang) || '繁體中文'} 撰寫。
輸出格式為 JSON: {"posts": [{"user": "用戶名", "location": "地點", "caption": "貼文說明", "likes": 隨機讚數}]}`;

    const prompt = `${context}

請生成 3 則 Instagram 貼文，要求：
1. 符合角色性格和使用者設定
2. 自然融入世界書設定
3. 每則貼文說明 30-100 字
4. 可以包含適當的表情符號和標標籤

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

    const posts = Array.isArray(parsed?.posts) ? parsed.posts : [];

    const storedPosts = getStoredPosts();
    const user = getUserData();
    
    posts.forEach((post, index) => {
      if (post.caption) {
        const newPost = {
          id: `ai-post-${Date.now()}-${index}`,
          user: post.user || user.name,
          location: post.location || '',
          avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=60',
          image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=60',
          liked: false,
          likes: post.likes || Math.floor(Math.random() * 5000),
          caption: post.caption,
          time: '剛剛',
          timestamp: Date.now(),
          isUserPost: post.user === user.name
        };
        
        if (newPost.isUserPost) {
          const userPosts = getUserPosts();
          userPosts.unshift(newPost);
          saveUserPosts(userPosts);
        } else {
          storedPosts.unshift(newPost);
        }
      }
    });
    
    saveStoredPosts(storedPosts);

    if (posts.length > 0) {
      renderFeed();
    } else {
      alert('生成失敗，請稍後重試');
    }
  } catch (err) {
    alert(`生成失敗: ${err.message}`);
  } finally {
    isGeneratingPosts = false;
    if (generateBtn) {
      generateBtn.disabled = false;
      generateBtn.textContent = 'AI 生成貼文';
    }
  }
}

let isGeneratingStories = false;

async function generateAIStories() {
  if (isGeneratingStories) {
    alert('正在生成中，請稍候...');
    return;
  }

  isGeneratingStories = true;
  const generateBtn = document.getElementById('ai-generate-story-btn');
  if (generateBtn) {
    generateBtn.disabled = true;
    generateBtn.textContent = '生成中...';
  }

  try {
    const context = buildInstagramContext();
    const char = getActiveCharacter();
    const user = getUserData();
    const lang = localStorage.getItem('sxiphone_lang') || 'zh-TW';

    const authors = [user.name];
    if (char) authors.push(char.name);

    const systemPrompt = `你是一位專業的社群媒體內容創作者，擅長創作 Instagram 限時動態。
請使用 ${window.getAIReadableLangName?.(lang) || '繁體中文'} 撰寫。
輸出格式為 JSON: {"stories": [{"author": "作者名", "content": "限動內容"}]}

限時動態特點：
- 簡短、即時、生活化
- 20-50 字
- 可以是心情分享、生活片段、感想等`;

    const prompt = `${context}

請為以下作者各生成 1 則限時動態：${authors.join('、')}

要求：
1. 符合各角色性格和設定
2. 自然融入世界書內容
3. 簡短有趣、生活化
4. 語氣自然、有互動感

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

    const stories = Array.isArray(parsed?.stories) ? parsed.stories : [];

    stories.forEach(story => {
      if (story.author && story.content) {
        addIgStory(story.author, story.content);
      }
    });

    if (stories.length > 0) {
      renderStories();
    } else {
      alert('生成失敗，請稍後重試');
    }
  } catch (err) {
    alert(`生成失敗: ${err.message}`);
  } finally {
    isGeneratingStories = false;
    if (generateBtn) {
      generateBtn.disabled = false;
      generateBtn.textContent = 'AI 生成限動';
    }
  }
}

let storiesData = [
    {
        id: 'story-1',
        name: 'sunny._.lia',
        avatar: 'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?auto=format&fit=crop&w=200&q=60'
    },
    {
        id: 'story-2',
        name: 'studiochoco',
        avatar: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=200&q=60'
    },
    {
        id: 'story-3',
        name: 'coffee.ca',
        avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=200&q=60'
    },
    {
        id: 'story-4',
        name: 'voyager',
        avatar: 'https://images.unsplash.com/photo-1459257868276-5e65389e2722?auto=format&fit=crop&w=200&q=60'
    }
];

function getIgStories() {
    const raw = localStorage.getItem(IG_STORIES_KEY);
    if (!raw) return [];
    try {
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

function saveIgStory(story) {
    const stories = getIgStories();
    stories.unshift({
        ...story,
        id: `ig-story-${Date.now()}`,
        createdAt: Date.now()
    });
    const trimmed = stories.slice(0, 20);
    localStorage.setItem(IG_STORIES_KEY, JSON.stringify(trimmed));
}

function addIgStory(authorName, content) {
    const story = {
        name: authorName,
        content: content,
        avatar: ''
    };
    
    const charList = JSON.parse(localStorage.getItem(CHAR_LIST_KEY) || '[]');
    const charData = charList.find(c => c.name === authorName);
    if (charData?.avatar) {
        story.avatar = charData.avatar;
    }
    
    saveIgStory(story);
}

let postsData = [
    {
        id: 'post-1',
        user: 'circularstudio',
        location: 'Taipei, Taiwan',
        avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=60',
        image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=60',
        liked: false,
        likes: 1287,
        caption: 'Color grading session with gradient murals. #art #studio',
        time: '1 小時前'
    },
    {
        id: 'post-2',
        user: 'neon.night',
        location: 'Shibuya',
        avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=60',
        image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=60',
        liked: true,
        likes: 40211,
        caption: '雨後的霓虹總是讓人重啟靈感。',
        time: '4 小時前'
    },
    {
        id: 'post-3',
        user: 'nomad.eats',
        location: 'Lisbon',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=60',
        image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=60',
        liked: false,
        likes: 987,
        caption: '橄欖油、海鹽與太陽的味道。',
        time: '昨天'
    }
];

const feedEl = document.getElementById('feed');
const storiesTrack = document.getElementById('stories-track');

function formatLikes(num) {
    if (num >= 10000) return `${(num / 1000).toFixed(1)}k`;
    const lang = localStorage.getItem('sxiphone_lang') || 'zh-Hant';
    const localeCode = window.getLocaleStringLang?.(lang) || 'zh-TW';
    return num.toLocaleString(localeCode);
}

function renderStories() {
    if (!storiesTrack) return;
    storiesTrack.innerHTML = '';
    
    const igStories = getIgStories();
    igStories.forEach((story) => {
        const button = document.createElement('button');
        button.className = 'story';
        if (story.avatar) {
            button.innerHTML = `
                <div class="avatar">
                    <img src="${story.avatar}" alt="${story.name} story">
                </div>
                <span>${story.name}</span>
            `;
        } else {
            button.innerHTML = `
                <div class="avatar" style="background: linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);"></div>
                <span>${story.name}</span>
            `;
        }
        button.addEventListener('click', () => {
            button.classList.add('seen');
        });
        storiesTrack.appendChild(button);
    });
    
    storiesData.forEach((story) => {
        const button = document.createElement('button');
        button.className = 'story';
        button.innerHTML = `
            <div class="avatar">
                <img src="${story.avatar}" alt="${story.name} story">
            </div>
            <span>${story.name}</span>
        `;
        button.addEventListener('click', () => {
            button.classList.add('seen');
        });
        storiesTrack.appendChild(button);
    });
}

function createPost(post) {
    const savedIds = getSavedPosts();
    const isSaved = savedIds.includes(post.id);
    const bookmarkIcon = isSaved ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark';
    
    const article = document.createElement('article');
    article.className = 'post';
    article.dataset.postId = post.id;
    article.innerHTML = `
        <div class="post-header">
            <div class="post-user">
                <div class="avatar-ring"><img src="${post.avatar}" alt="${post.user}"></div>
                <div>
                    <strong>${post.user}</strong>
                    <div class="post-meta">${post.location}</div>
                </div>
            </div>
            <button class="icon-btn"><i class="fa-solid fa-ellipsis"></i></button>
        </div>
        <div class="post-image">
            <img src="${post.image}" alt="${post.user} post">
            <i class="fa-solid fa-heart like-heart"></i>
        </div>
        <div class="post-actions">
            <div>
                <button class="like-btn"><i class="fa${post.liked ? '-solid' : '-regular'} fa-heart"></i></button>
                <button><i class="fa-regular fa-comment"></i></button>
                <button><i class="fa-regular fa-paper-plane"></i></button>
            </div>
            <button class="bookmark-btn" data-post-id="${post.id}"><i class="${bookmarkIcon}"></i></button>
        </div>
        <div class="post-stats"><strong class="likes-count">${formatLikes(post.likes)} 個讚</strong></div>
        <div class="caption"><strong>${post.user}</strong>${post.caption}</div>
        <div class="view-comments">查看全部 37 則留言</div>
        <div class="view-comments">${post.time}</div>
    `;
    bindPostInteractions(article, post);
    return article;
}

function bindPostInteractions(article, post) {
    const likeBtn = article.querySelector('.like-btn');
    const likesCount = article.querySelector('.likes-count');
    const heartOverlay = article.querySelector('.like-heart');
    const image = article.querySelector('.post-image');
    const bookmarkBtn = article.querySelector('.bookmark-btn');

    const updateIcon = () => {
        likeBtn.innerHTML = `<i class="fa${post.liked ? '-solid' : '-regular'} fa-heart"></i>`;
        likeBtn.classList.toggle('active', post.liked);
        likesCount.textContent = `${formatLikes(post.likes)} 個讚`;
    };

    const toggleLike = (triggerOverlay = false) => {
        post.liked = !post.liked;
        post.likes += post.liked ? 1 : -1;
        updateIcon();
        if (triggerOverlay) {
            heartOverlay.classList.remove('active');
            void heartOverlay.offsetWidth;
            heartOverlay.classList.add('active');
        }
    };

    likeBtn.addEventListener('click', () => toggleLike(false));
    image.addEventListener('dblclick', () => {
        if (!post.liked) toggleLike(true);
        else {
            heartOverlay.classList.remove('active');
            void heartOverlay.offsetWidth;
            heartOverlay.classList.add('active');
        }
    });
    
    bookmarkBtn?.addEventListener('click', () => {
        const savedIds = getSavedPosts();
        const isSaved = savedIds.includes(post.id);
        
        if (isSaved) {
            const newSavedIds = savedIds.filter(id => id !== post.id);
            saveSavedPosts(newSavedIds);
            bookmarkBtn.innerHTML = '<i class="fa-regular fa-bookmark"></i>';
        } else {
            savedIds.push(post.id);
            saveSavedPosts(savedIds);
            bookmarkBtn.innerHTML = '<i class="fa-solid fa-bookmark"></i>';
        }
    });
}

function renderFeed() {
    if (!feedEl) return;
    
    const userPosts = getUserPosts();
    const storedPosts = getStoredPosts();
    const savedIds = new Set(getSavedPosts());
    
    let allPosts = [...userPosts, ...storedPosts];
    
    const userIds = new Set(userPosts.map(p => p.id));
    const preservedIds = new Set([...savedIds, ...userIds]);
    
    const preservedPosts = allPosts.filter(p => preservedIds.has(p.id));
    const regularPosts = allPosts.filter(p => !preservedIds.has(p.id));
    const displayPosts = [...preservedPosts, ...regularPosts.slice(0, 50)];
    displayPosts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
    if (displayPosts.length === 0) {
        displayPosts.push(...postsData);
    }
    
    feedEl.innerHTML = '';
    displayPosts.forEach(post => {
        feedEl.appendChild(createPost(post));
    });
}

function bindBottomNav() {
    const buttons = document.querySelectorAll('.bottom-nav .nav-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

function bindHeaderActions() {
    const backBtn = document.getElementById('open-camera');
    backBtn?.addEventListener('click', () => {
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'closeApp', appId: 'instagram' }, '*');
            return;
        }
        if (window.history.length > 1) {
            window.history.back();
        }
    });
}

const settingsSheet = document.getElementById('settings-sheet');
const profileBtn = document.getElementById('profile-btn');
const settingsUsername = document.getElementById('settings-username');
const settingsBio = document.getElementById('settings-bio');
const settingsAvatar = document.getElementById('settings-avatar');
const settingsStories = document.getElementById('settings-stories');
const customPostsList = document.getElementById('custom-posts-list');
const addCustomPostBtn = document.getElementById('add-custom-post');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const resetSettingsBtn = document.getElementById('reset-settings-btn');

let customPosts = [];

function openSettings() {
    settingsSheet?.classList.remove('is-hidden');
    settingsSheet?.setAttribute('aria-hidden', 'false');
    loadSettingsToForm();
}

function closeSettings() {
    settingsSheet?.classList.add('is-hidden');
    settingsSheet?.setAttribute('aria-hidden', 'true');
}

function loadSettingsToForm() {
    const settings = loadSettings();
    if (settingsUsername) settingsUsername.value = settings.username || '';
    if (settingsBio) settingsBio.value = settings.bio || '';
    if (settingsAvatar) settingsAvatar.value = settings.avatar || '';
    if (settingsStories) settingsStories.value = settings.stories?.join(', ') || '';
    customPosts = settings.posts || [];
    renderCustomPostsList();
}

function renderCustomPostsList() {
    if (!customPostsList) return;
    customPostsList.innerHTML = customPosts.map((post, idx) => `
        <div class="post-item" data-post-idx="${idx}">
            <div class="post-item-header">
                <span class="post-item-title">貼文 ${idx + 1}</span>
                <button class="post-item-remove" data-remove-idx="${idx}" type="button">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
            <label>
                使用者名稱
                <input type="text" class="post-user" value="${post.user || ''}" placeholder="user_name">
            </label>
            <label>
                地點
                <input type="text" class="post-location" value="${post.location || ''}" placeholder="Location">
            </label>
            <label>
                頭像圖片網址
                <input type="url" class="post-avatar" value="${post.avatar || ''}" placeholder="https://example.com/avatar.jpg">
            </label>
            <label>
                貼文圖片網址
                <input type="url" class="post-image" value="${post.image || ''}" placeholder="https://example.com/image.jpg">
            </label>
            <label>
                文字說明
                <textarea class="post-caption" rows="2" placeholder="寫點什麼...">${post.caption || ''}</textarea>
            </label>
        </div>
    `).join('');
}

function addCustomPost() {
    customPosts.push({
        user: '',
        location: '',
        avatar: '',
        image: '',
        caption: '',
        likes: 0,
        liked: false,
        time: '剛剛'
    });
    renderCustomPostsList();
}

function removeCustomPost(idx) {
    customPosts.splice(idx, 1);
    renderCustomPostsList();
}

function collectPostsFromForm() {
    const items = customPostsList?.querySelectorAll('.post-item') || [];
    return Array.from(items).map(item => {
        return {
            user: item.querySelector('.post-user')?.value || '',
            location: item.querySelector('.post-location')?.value || '',
            avatar: item.querySelector('.post-avatar')?.value || '',
            image: item.querySelector('.post-image')?.value || '',
            caption: item.querySelector('.post-caption')?.value || '',
            likes: Math.floor(Math.random() * 5000),
            liked: false,
            time: '剛剛'
        };
    });
}

function saveSettings() {
    const settings = {
        username: settingsUsername?.value || '',
        bio: settingsBio?.value || '',
        avatar: settingsAvatar?.value || '',
        stories: (settingsStories?.value || '').split(',').map(s => s.trim()).filter(Boolean),
        posts: collectPostsFromForm()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    applySettings(settings);
    closeSettings();
}

function loadSettings() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        return JSON.parse(raw);
    } catch {
        return {};
    }
}

function applySettings(settings) {
    if (settings.stories && settings.stories.length > 0) {
        storiesData = settings.stories.map((name, idx) => ({
            id: `story-custom-${idx}`,
            name: name,
            avatar: `https://images.unsplash.com/photo-${1500000000000 + idx}?auto=format&fit=crop&w=200&q=60`
        }));
    }
    
    if (settings.posts && settings.posts.length > 0) {
        postsData = settings.posts.map((post, idx) => ({
            id: `post-custom-${idx}`,
            user: post.user || 'user',
            location: post.location || '',
            avatar: post.avatar || 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=60',
            image: post.image || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=60',
            liked: false,
            likes: post.likes || Math.floor(Math.random() * 5000),
            caption: post.caption || '',
            time: post.time || '剛剛'
        }));
    }
    
    renderStories();
    renderFeed();
}

function resetSettings() {
    if (confirm('確定要重置為預設設定嗎？')) {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
    }
}

function bindSettingsEvents() {
    profileBtn?.addEventListener('click', openSettings);
    
    settingsSheet?.addEventListener('click', (event) => {
        if (event.target.closest('[data-close-settings]')) {
            closeSettings();
            return;
        }
        
        const removeBtn = event.target.closest('[data-remove-idx]');
        if (removeBtn) {
            const idx = parseInt(removeBtn.dataset.removeIdx);
            removeCustomPost(idx);
        }
    });
    
    addCustomPostBtn?.addEventListener('click', addCustomPost);
    saveSettingsBtn?.addEventListener('click', saveSettings);
    resetSettingsBtn?.addEventListener('click', resetSettings);
}

function loadSxSettings() {
    if (typeof SxSettings === 'undefined') return null;
    const settings = SxSettings.getSettingsSnapshot();
    
    console.log('[instagram] Loaded settings:', {
        characters: settings.characters.length,
        users: settings.users.length,
        npcs: settings.npcs.length,
        apis: settings.apis.length
    });
    
    return settings;
}

// iOS Safari / Android Chrome 儲存保護
const saveInstagramData = () => {
    try {
        localStorage.setItem('sx_instagram_settings', JSON.stringify({
            username: settingsUsername?.value || '',
            bio: settingsBio?.value || '',
            avatar: settingsAvatar?.value || '',
            stories: settingsStories?.value?.split(',').map(s => s.trim()) || [],
            posts: customPosts
        }));
        
        const storedPosts = getStoredPosts();
        saveStoredPosts(storedPosts);
        
        const userPosts = getUserPosts();
        saveUserPosts(userPosts);
    } catch (e) {
        console.warn('[instagram] 保存數據失敗:', e);
    }
};

window.addEventListener('pagehide', saveInstagramData);
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveInstagramData();
});
window.addEventListener('message', (event) => {
    if (event.data?.type === 'APP_WILL_CLOSE') saveInstagramData();
});

function init() {
    loadSxSettings();
    const settings = loadSettings();
    if (Object.keys(settings).length > 0) {
        applySettings(settings);
    } else {
        renderStories();
        renderFeed();
    }
    bindBottomNav();
    bindHeaderActions();
    bindSettingsEvents();

    const aiGenerateBtn = document.getElementById('ai-generate-posts-btn');
    aiGenerateBtn?.addEventListener('click', generateAIPosts);
    
    const aiStoryBtn = document.getElementById('ai-generate-story-btn');
    aiStoryBtn?.addEventListener('click', generateAIStories);
}

document.addEventListener('DOMContentLoaded', init);
