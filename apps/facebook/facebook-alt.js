const feedEl = document.getElementById('feed');
const postInput = document.getElementById('post-input');
const postBtn = document.getElementById('post-btn');
const composeModal = document.getElementById('compose-modal');
const composeInput = document.getElementById('compose-input');
const composeCloseBtn = document.getElementById('compose-close');
const profileEntryBtn = document.getElementById('profile-entry-btn');

const FB_PROFILE_KEY = 'sx_fb_profile_alt';
const FB_WB_MOUNTS_KEY = 'sx_fb_worldbook_mounts_alt';
const FB_GENERATED_POSTS_KEY = 'sx_fb_generated_posts_alt';
const CHAR_LIST_KEY = 'sx_characters';
const USER_LIST_KEY = 'sx_users';
const ACTIVE_CHAR_KEY = 'sx_char_name';
const ACTIVE_USER_KEY = 'sx_user_name';

const WORLD_BOOK_KEYS = [
  'sx_worldbook_cot',
  'sx_worldbook_style',
  'sx_worldbook_global',
  'sx_worldbook_keywords',
  'sx_worldbook_backend'
];

const samplePosts = [];

const userPosts = [];

const state = {
  profile: {
    userName: localStorage.getItem('sx_user_name') || '小帳',
    avatar: localStorage.getItem('sx_user_avatar') || ''
  },
  charProfile: null,
  userProfile: null,
  mountedWorldbooks: [],
  generatedPosts: []
};

const escapeHTML = (str = '') => String(str)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

function loadJSON(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function persistGeneratedPosts() {
  saveJSON(FB_GENERATED_POSTS_KEY, state.generatedPosts);
}

function normalizePost(post) {
  return {
    author: post?.author || '匿名',
    time: post?.time || '剛剛',
    text: post?.text || '',
    stats: {
      like: Number(post?.stats?.like || 0),
      comment: Number(post?.stats?.comment || 0),
      share: Number(post?.stats?.share || 0)
    }
  };
}

function loadProfile() {
  const rawProfile = loadJSON(FB_PROFILE_KEY, null);
  if (rawProfile && typeof rawProfile === 'object') {
    state.profile.userName = rawProfile.userName || state.profile.userName;
    state.profile.avatar = rawProfile.avatar || state.profile.avatar;
  }

  state.generatedPosts = (loadJSON(FB_GENERATED_POSTS_KEY, []) || []).map(normalizePost);

  const activeCharName = localStorage.getItem(ACTIVE_CHAR_KEY) || '';
  const activeUserName = localStorage.getItem(ACTIVE_USER_KEY) || '';
  const charList = loadJSON(CHAR_LIST_KEY, []);
  const userList = loadJSON(USER_LIST_KEY, []);

  state.charProfile = (Array.isArray(charList) ? charList : []).find((item) => item?.name === activeCharName) || null;
  state.userProfile = (Array.isArray(userList) ? userList : []).find((item) => item?.name === activeUserName) || null;

  if (state.userProfile?.name) {
    state.profile.userName = state.userProfile.name;
    if (state.userProfile.avatar) state.profile.avatar = state.userProfile.avatar;
  }

  const mounts = loadJSON(FB_WB_MOUNTS_KEY, []);
  state.mountedWorldbooks = (Array.isArray(mounts) ? mounts : []).filter((item) => item?.enabled !== false);
}

function updateProfileAvatars() {
  const avatar = state.profile.avatar?.trim();
  document.querySelectorAll('.profile-avatar-bind').forEach((el) => {
    if (avatar) {
      el.style.backgroundImage = `url(${avatar})`;
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
    } else {
      el.style.backgroundImage = '';
      el.style.backgroundSize = '';
      el.style.backgroundPosition = '';
    }
  });

  if (postInput) {
    postInput.placeholder = `${state.profile.userName || '你'}，想說些什麼？`;
  }
  if (composeInput) {
    composeInput.placeholder = `${state.profile.userName || '你'}，想說些什麼？`;
  }
}

function openComposeModal() {
  if (!composeModal) return;
  composeModal.classList.remove('hidden');
  if (composeInput) {
    composeInput.value = '';
    window.setTimeout(() => composeInput.focus(), 20);
  }
}

function closeComposeModal() {
  composeModal?.classList.add('hidden');
}

function renderPosts() {
  if (!feedEl) return;
  const all = [...userPosts, ...state.generatedPosts, ...samplePosts];

  if (all.length === 0) {
    feedEl.innerHTML = '<div class="card muted">尚無貼文</div>';
    return;
  }

  feedEl.innerHTML = all.map(post => `
    <article class="post card">
      <div class="avatar-sm"></div>
      <div class="post-content">
        <div class="post-header">
          <div>
            <div class="post-author">${escapeHTML(post.author)}</div>
            <div class="post-meta">${escapeHTML(post.time)}</div>
          </div>
          <button class="icon-btn" aria-label="更多"><i class="fas fa-ellipsis-h"></i></button>
        </div>
        <div class="post-body">${escapeHTML(post.text)}</div>
        <div class="post-actions">
          <button type="button"><i class="far fa-thumbs-up"></i><span>${post.stats.like}</span></button>
          <button type="button"><i class="far fa-comment"></i><span>${post.stats.comment}</span></button>
          <button type="button"><i class="fas fa-share"></i><span>${post.stats.share}</span></button>
          <button type="button"><i class="far fa-bookmark"></i></button>
        </div>
      </div>
    </article>
  `).join('');
}

function addPost(content) {
  const trimmed = content.trim();
  if (!trimmed) return;
  userPosts.unshift({
    author: state.profile.userName || '你',
    time: '剛剛',
    text: trimmed,
    stats: { like: 0, comment: 0, share: 0 }
  });
  renderPosts();
}

function collectMountedWorldbookEntries() {
  const mountedNameSet = new Set(state.mountedWorldbooks.map((item) => item.name));
  if (!mountedNameSet.size) return [];

  const entries = [];
  WORLD_BOOK_KEYS.forEach((key) => {
    const data = loadJSON(key, []);
    if (!Array.isArray(data)) return;
    data.forEach((entry) => {
      const title = entry?.title || '';
      if (!entry?.enabled) return;
      if (!title || !mountedNameSet.has(title)) return;
      entries.push({
        title,
        triggers: Array.isArray(entry?.triggers) ? entry.triggers : [],
        content: entry?.content || ''
      });
    });
  });

  return entries;
}

function getActiveApiConfig() {
  const configs = loadJSON('api_configs', []);
  const list = Array.isArray(configs) ? configs : [];
  const activeIndex = Number(localStorage.getItem('sx_active_api') || 0);
  return list[activeIndex] || list[0] || null;
}

async function requestAiGeneratedPosts(context) {
  const apiConfig = getActiveApiConfig();
  if (!apiConfig?.url) {
    throw new Error('尚未設定 API');
  }

  const endpoint = apiConfig.url.endsWith('/chat/completions')
    ? apiConfig.url
    : `${apiConfig.url.replace(/\/$/, '')}/chat/completions`;

  const mountedSummary = context.worldbooks.length
    ? context.worldbooks.map((item) => `【${item.title}】${item.content}`).join('\n')
    : '未掛載世界書';

  const payload = {
    model: apiConfig.model || 'gpt-4o-mini',
    temperature: 0.9,
    messages: [
      {
        role: 'system',
        content: '你是小帳的情緒貼文文案助手，請輸出 JSON。請嚴格輸出 {"posts":[{"author":"","text":"","like":0,"comment":0,"share":0}]} 且 posts 長度 3。'
      },
      {
        role: 'user',
        content: `請依據以下人物設定與世界書資料，生成小帳 Facebook 貼文，偏向抒發、抱怨、日常低潮。\n` +
          `User: ${JSON.stringify(context.user || {}, null, 2)}\n` +
          `Char: ${JSON.stringify(context.char || {}, null, 2)}\n` +
          `Worldbook: ${mountedSummary}\n` +
          `要求：語氣自然、繁體中文、每篇 25~80 字。`
      }
    ]
  };

  const headers = { 'Content-Type': 'application/json' };
  if (apiConfig.key) headers.Authorization = `Bearer ${apiConfig.key}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`API 錯誤 (${response.status})`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || '';

  let parsed = null;
  try {
    parsed = JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) parsed = JSON.parse(match[0]);
  }

  const posts = Array.isArray(parsed?.posts) ? parsed.posts : [];
  return posts.slice(0, 3).map((item) => normalizePost({
    author: item.author || context.user?.name || context.char?.name || '小帳',
    time: '剛剛',
    text: item.text || '',
    stats: {
      like: Number(item.like || Math.floor(10 + Math.random() * 60)),
      comment: Number(item.comment || Math.floor(1 + Math.random() * 20)),
      share: Number(item.share || Math.floor(1 + Math.random() * 8))
    }
  })).filter((item) => item.text);
}

function generateFallbackPosts(context) {
  const personaTone = context.user?.personality || context.char?.personality || '壓抑';
  const wbHints = context.worldbooks.map((item) => item.title).join('、') || '日常生活';
  const author = context.user?.name || context.char?.name || state.profile.userName || '你';
  const seeds = [
    `今天真的很累，${wbHints} 相關的事讓人有點喘不過氣。`,
    `如果可以，我想暫時離開一下。${personaTone} 的心情誰懂。`,
    `有些情緒只能留在小帳，晚點再整理吧。`
  ];

  return seeds.map((text, idx) => normalizePost({
    author,
    time: '剛剛',
    text,
    stats: {
      like: 12 + idx * 5,
      comment: 2 + idx * 2,
      share: 1 + idx
    }
  }));
}

async function handleGenerateAiContent() {
  const context = {
    user: state.userProfile || {
      name: state.profile.userName,
      avatar: state.profile.avatar,
      personality: localStorage.getItem('sx_user_personality') || '',
      background: localStorage.getItem('sx_user_background') || ''
    },
    char: state.charProfile || null,
    worldbooks: collectMountedWorldbookEntries()
  };

  let newlyGenerated = [];
  try {
    const generated = await requestAiGeneratedPosts(context);
    newlyGenerated = generated.length ? generated : generateFallbackPosts(context);
  } catch (error) {
    console.warn('AI 生成失敗，改用本地生成', error);
    newlyGenerated = generateFallbackPosts(context);
  }

  const merged = [...newlyGenerated, ...state.generatedPosts]
    .filter((post) => post?.text)
    .slice(0, 120);
  state.generatedPosts = merged;
  persistGeneratedPosts();
  renderPosts();
}

function bindEvents() {
  postBtn?.addEventListener('click', () => {
    addPost(composeInput?.value || '');
    if (composeInput) composeInput.value = '';
    closeComposeModal();
  });

  composeInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      postBtn.click();
    }
  });

  postInput?.addEventListener('click', openComposeModal);
  composeCloseBtn?.addEventListener('click', closeComposeModal);
  composeModal?.addEventListener('click', (event) => {
    if (event.target === composeModal) closeComposeModal();
  });

  profileEntryBtn?.addEventListener('click', () => {
    window.location.href = 'facebook-profile-alt.html';
  });
}

function init() {
  loadProfile();
  updateProfileAvatars();
  renderPosts();
  bindEvents();
  handleGenerateAiContent();
}

init();
