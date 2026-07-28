const feedEl = document.getElementById('feed');
const postInput = document.getElementById('post-input');
const postBtn = document.getElementById('post-btn');
const composeModal = document.getElementById('compose-modal');
const composeInput = document.getElementById('compose-input');
const composeCloseBtn = document.getElementById('compose-close');

const FB_PROFILE_KEY = 'sx_fb_profile';
const FB_WB_MOUNTS_KEY = 'sx_fb_worldbook_mounts';
const FB_GENERATED_POSTS_KEY = 'sx_fb_generated_posts';
const FB_USER_POSTS_KEY = 'sx_fb_user_posts';
const FB_FRIENDS_KEY = 'sx_fb_friends';
const FB_NPC_FRIENDS_KEY = 'sx_fb_npc_friends';
const FB_POST_SETTINGS_KEY = 'sx_fb_post_settings';
const FB_COMMUNITY_TONE_KEY = 'sx_fb_community_tone';
const FB_COMMUNITY_FLAGS_KEY = 'sx_fb_community_flags';
const FB_NPC_PERSONALITY_KEY = 'sx_fb_npc_personality';
const FB_HATER_PROFILES_KEY = 'sx_fb_hater_profiles';
const FB_ENABLE_HATERS_KEY = 'sx_fb_enable_haters';
const FB_SAVED_POSTS_KEY = 'sx_fb_saved_posts';
const FB_POST_MEMORIES_KEY = 'sx_fb_post_memories';
const FB_USER_PROFILES_KEY = 'sx_fb_user_profiles';
const FB_CHAR_PROFILES_KEY = 'sx_fb_char_profiles';
const FB_POST_REACTIONS_KEY = 'sx_fb_post_reactions';
const FB_POST_COMMENTS_KEY = 'sx_fb_post_comments';
const FB_SPONSORED_KEY = 'sx_fb_sponsored';
const IG_STORIES_KEY = 'sx_instagram_stories';
const CHAR_LIST_KEY = 'sx_characters';
const USER_LIST_KEY = 'sx_users';
const NPC_LIST_KEY = 'sx_npc_list';
const ACTIVE_CHAR_KEY = 'sx_char_name';
const ACTIVE_USER_KEY = 'sx_user_name';

const state = {
  profile: {
    userName: '你',
    avatar: ''
  },
  charProfile: null,
  userProfile: null,
  mountedWorldbooks: [],
  generatedPosts: [],
  userPosts: [],
  savedPosts: [],
  postMemories: [],
  postReactions: {},
  postComments: {},
  friends: [],
  npcFriends: [],
  postSettings: {
    generateUserPosts: true,
    generateFriendPosts: true,
    generateNpcPosts: false
  },
  communitySettings: {
    tone: 'neutral',
    flags: { criticism: true, sarcasm: true, arguments: false, trolling: false },
    npcPersonality: '',
    haterProfiles: '',
    enableHaters: false
  },
  currentAccount: 'user',
  isCharView: window.isCharView || false,
  charViewName: window.charViewName || ''
};

const saveFacebookData = async () => {
  try {
    await sxSetJSON(FB_PROFILE_KEY, state.profile);
    await sxSetJSON(FB_GENERATED_POSTS_KEY, state.generatedPosts);
    await sxSetJSON(FB_USER_POSTS_KEY, state.userPosts);
    await sxSetJSON(FB_SAVED_POSTS_KEY, state.savedPosts);
    await sxSetJSON(FB_POST_MEMORIES_KEY, state.postMemories);
    await sxSetJSON(FB_FRIENDS_KEY, state.friends);
    await sxSetJSON(FB_NPC_FRIENDS_KEY, state.npcFriends);
    await sxSetJSON(FB_POST_SETTINGS_KEY, state.postSettings);
    await sxSetItem(FB_COMMUNITY_TONE_KEY, state.communitySettings.tone);
    await sxSetJSON(FB_COMMUNITY_FLAGS_KEY, state.communitySettings.flags);
    await sxSetItem(FB_NPC_PERSONALITY_KEY, state.communitySettings.npcPersonality);
    await sxSetItem(FB_HATER_PROFILES_KEY, state.communitySettings.haterProfiles);
    await sxSetItem(FB_ENABLE_HATERS_KEY, String(state.communitySettings.enableHaters));
    await sxSetJSON(FB_POST_REACTIONS_KEY, state.postReactions);
    await sxSetJSON(FB_POST_COMMENTS_KEY, state.postComments);
  } catch (e) {
    console.error('保存 Facebook 數據失敗:', e);
  }
};

window.addEventListener('pagehide', () => { (async () => { await saveFacebookData(); })(); });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') { (async () => { await saveFacebookData(); })(); }
});
window.addEventListener('message', (event) => {
  if (event.data?.type === 'APP_WILL_CLOSE') { (async () => { await saveFacebookData(); })(); }
});

async function loadJSON(key, fallback) {
  const raw = await sxGetItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function saveJSON(key, value) {
  await sxSetItem(key, JSON.stringify(value));
}

const escapeHTML = (str = '') => String(str)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

function normalizePost(post) {
  return {
    id: post?.id || `post_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    author: post?.author || '匿名',
    authorType: post?.authorType || 'user',
    time: post?.time || '剛剛',
    text: post?.text || '',
    visibility: post?.visibility || 'public',
    stats: {
      like: Number(post?.stats?.like || 0),
      comment: Number(post?.stats?.comment || 0),
      share: Number(post?.stats?.share || 0)
    }
  };
}

async function getCharacterList() {
  return await loadJSON(CHAR_LIST_KEY, []);
}

async function getNpcList() {
  return await loadJSON(NPC_LIST_KEY, []);
}

async function getActiveCharacter() {
  const activeName = await sxGetItem(ACTIVE_CHAR_KEY);
  const charList = await getCharacterList();
  return charList.find(c => c.name === activeName) || null;
}

async function getUserData() {
  return {
    name: await sxGetItem('sx_user_name') || 'User',
    personality: await sxGetItem('sx_user_personality') || '',
    background: await sxGetItem('sx_user_background') || '',
    avatar: await sxGetItem('sx_user_avatar') || ''
  };
}

async function getCommunityTone() {
  return await sxGetItem(FB_COMMUNITY_TONE_KEY) || 'neutral';
}

async function getCommunityFlags() {
  const raw = await sxGetItem(FB_COMMUNITY_FLAGS_KEY);
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
  return await sxGetItem(FB_NPC_PERSONALITY_KEY) || '';
}

async function getHaterProfiles() {
  return await sxGetItem(FB_HATER_PROFILES_KEY) || '';
}

async function isHatersEnabled() {
  return await sxGetItem(FB_ENABLE_HATERS_KEY) === 'true';
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

async function loadProfile() {
  const rawProfile = await loadJSON(FB_PROFILE_KEY, null);
  if (rawProfile && typeof rawProfile === 'object') {
    state.profile.userName = rawProfile.userName || state.profile.userName;
    state.profile.avatar = rawProfile.avatar || state.profile.avatar;
  }

  state.generatedPosts = ((await loadJSON(FB_GENERATED_POSTS_KEY, [])) || []).map(normalizePost);
  state.userPosts = ((await loadJSON(FB_USER_POSTS_KEY, [])) || []).map(normalizePost);
  state.savedPosts = (await loadJSON(FB_SAVED_POSTS_KEY, [])) || [];
  state.postMemories = (await loadJSON(FB_POST_MEMORIES_KEY, [])) || [];
  state.friends = await loadJSON(FB_FRIENDS_KEY, []);
  state.npcFriends = await loadJSON(FB_NPC_FRIENDS_KEY, []);
  state.postSettings = { ...state.postSettings, ...(await loadJSON(FB_POST_SETTINGS_KEY, {})) };
  
  state.communitySettings.tone = await getCommunityTone();
  state.communitySettings.flags = await getCommunityFlags();
  state.communitySettings.npcPersonality = await getNpcPersonality();
  state.communitySettings.haterProfiles = await getHaterProfiles();
  state.communitySettings.enableHaters = await isHatersEnabled();

  state.postReactions = await loadJSON(FB_POST_REACTIONS_KEY, {});
  state.postComments = await loadJSON(FB_POST_COMMENTS_KEY, {});

  const activeCharName = await sxGetItem(ACTIVE_CHAR_KEY) || '';
  const activeUserName = await sxGetItem(ACTIVE_USER_KEY) || '';
  const charList = await loadJSON(CHAR_LIST_KEY, []);
  const userList = await loadJSON(USER_LIST_KEY, []);

  state.charProfile = (Array.isArray(charList) ? charList : []).find((item) => item?.name === activeCharName) || null;
  state.userProfile = (Array.isArray(userList) ? userList : []).find((item) => item?.name === activeUserName) || null;

  if (state.userProfile?.name) {
    state.profile.userName = state.userProfile.name;
    if (state.userProfile.avatar) state.profile.avatar = state.userProfile.avatar;
  }

  const mounts = await loadJSON(FB_WB_MOUNTS_KEY, []);
  state.mountedWorldbooks = (Array.isArray(mounts) ? mounts : []).filter((item) => item?.enabled !== false);
  
  if (state.isCharView && state.charViewName) {
    const charList = await getCharacterList();
    const charData = charList.find(c => c.name === state.charViewName);
    if (charData) {
      state.currentAccount = state.charViewName;
    }
  }
}

async function getCharacterData(name) {
  const charList = await getCharacterList();
  return charList.find(c => c.name === name) || null;
}

async function updateAccountSelectors() {
  const accountSelect = document.getElementById('account-select');
  if (!accountSelect) return;

  const user = await getUserData();
  const userProfile = await loadJSON(FB_USER_PROFILES_KEY, {});
  const charProfiles = await loadJSON(FB_CHAR_PROFILES_KEY, {});
  
  const userName = userProfile?.name || user.name || '你';
  const options = [`<option value="user">${escapeHTML(userName)}</option>`];

  state.friends.forEach(friendName => {
    const charProfile = charProfiles[friendName] || {};
    const displayName = charProfile.name || friendName;
    options.push(`<option value="${escapeHTML(friendName)}">${escapeHTML(displayName)}</option>`);
  });

  accountSelect.innerHTML = options.join('');
  accountSelect.value = state.currentAccount;

  if (state.isCharView && state.charViewName) {
    accountSelect.value = 'user';
    state.currentAccount = 'user';
  }

  accountSelect.addEventListener('change', () => {
    state.currentAccount = accountSelect.value;
    (async () => { await updateComposerAvatar(); })();
  });
}

function getCurrentPostingAccount() {
  const accountSelect = document.getElementById('account-select');
  return accountSelect?.value || state.currentAccount;
}

async function getAccountInfo(accountValue) {
  const userProfile = await loadJSON(FB_USER_PROFILES_KEY, {});
  const charProfiles = await loadJSON(FB_CHAR_PROFILES_KEY, {});
  
  if (accountValue === 'user') {
    const user = await getUserData();
    const profile = userProfile || {};
    return {
      name: profile.name || user.name || '你',
      avatar: profile.avatar || user.avatar || '',
      type: 'user'
    };
  }
  
  const charProfile = charProfiles[accountValue] || {};
  const charData = await getCharacterData(accountValue);
  if (charData) {
    return {
      name: charProfile.name || charData.name,
      avatar: charProfile.avatar || charData.avatar || '',
      type: 'friend'
    };
  }
  
  return {
    name: charProfile.name || accountValue,
    avatar: charProfile.avatar || '',
    type: 'friend'
  };
}

async function updateComposerAvatar() {
  const accountValue = getCurrentPostingAccount();
  const accountInfo = await getAccountInfo(accountValue);
  
  const composerAvatar = document.getElementById('composer-avatar');
  const composeAvatar = document.getElementById('compose-avatar');
  const drawerProfileAvatar = document.querySelector('.drawer-profile .avatar');
  
  [composerAvatar, composeAvatar, drawerProfileAvatar].forEach(avatar => {
    if (avatar) {
      if (accountInfo.avatar) {
        avatar.style.backgroundImage = `url(${accountInfo.avatar})`;
        avatar.style.backgroundSize = 'cover';
        avatar.style.backgroundPosition = 'center';
      } else {
        avatar.style.backgroundImage = '';
      }
    }
  });
  
  if (postInput) {
    postInput.placeholder = `${accountInfo.name}，想說些什麼？`;
  }
  if (composeInput) {
    composeInput.placeholder = `${accountInfo.name}，想說些什麼？`;
  }
  
  const drawerUserName = document.getElementById('drawer-user-name');
  if (drawerUserName) {
    drawerUserName.textContent = accountInfo.name;
  }
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
  const drawerUserName = document.getElementById('drawer-user-name');
  if (drawerUserName) {
    drawerUserName.textContent = state.profile.userName || '你';
  }
}

async function renderSponsored() {
  const container = document.getElementById('sponsored-list');
  const card = document.getElementById('sponsored-card');
  if (!container) return;

  const sponsored = await loadJSON(FB_SPONSORED_KEY, []);
  
  if (sponsored.length === 0) {
    if (card) card.style.display = 'none';
    return;
  }
  
  if (card) card.style.display = '';

  container.innerHTML = sponsored.map(item => {
    const thumbStyle = item.image 
      ? `style="background-image: url(${item.image}); background-size: cover; background-position: center;"`
      : 'style="background: linear-gradient(135deg, #8ac7ff, #3f6ae0);"';
    return `
      <div class="sponsored-item">
        <div class="thumb" ${thumbStyle}></div>
        <div>
          <div class="title">${escapeHTML(item.title)}</div>
          <div class="link">${escapeHTML(item.link)}</div>
        </div>
      </div>
    `;
  }).join('');
}

function renderFriendsSidebar() {
  const container = document.getElementById('friends-sidebar-list');
  if (!container) return;

  const allFriends = [...state.friends, ...state.npcFriends];
  if (allFriends.length === 0) {
    container.innerHTML = '<div class="muted-text">尚未新增好友</div>';
    return;
  }

  container.innerHTML = allFriends.map(name => `
    <div class="friend-item" data-friend="${escapeHTML(name)}">
      <div class="avatar-sm"></div>
      <span>${escapeHTML(name)}</span>
    </div>
  `).join('');
}

function renderOnlineFriends() {
  const container = document.getElementById('online-friends-list');
  if (!container) return;

  const allFriends = [...state.friends, ...state.npcFriends];
  if (allFriends.length === 0) {
    container.innerHTML = '<div class="muted-text">沒有線上好友</div>';
    return;
  }

  const onlineCount = Math.min(Math.floor(Math.random() * 3) + 1, allFriends.length);
  const onlineFriends = allFriends.slice(0, onlineCount);

  container.innerHTML = onlineFriends.map(name => `
    <div class="contact">
      <div class="avatar-sm online"></div>
      <span>${escapeHTML(name)}</span>
    </div>
  `).join('');
}

async function renderStories() {
  const container = document.getElementById('stories-track');
  if (!container) return;

  const igStories = await getIgStories();
  
  let storiesHtml = `
    <div class="story create" id="create-story-btn">
      <div class="story-bg"></div>
      <div class="story-add"><i class="fas fa-plus"></i></div>
      <div class="story-label">建立限時動態</div>
    </div>
  `;

  igStories.slice(0, 10).forEach(story => {
    const avatarStyle = story.avatar 
      ? `style="background-image: url(${story.avatar}); background-size: cover; background-position: center;"`
      : 'style="background: linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);"';
    storiesHtml += `
      <div class="story" data-name="${escapeHTML(story.name)}" data-from-ig="true">
        <div class="story-bg"></div>
        <div class="story-avatar" ${avatarStyle}></div>
        <div class="story-label">${escapeHTML(story.name)}</div>
      </div>
    `;
  });

  container.innerHTML = storiesHtml;
  
  const createBtn = document.getElementById('create-story-btn');
  createBtn?.addEventListener('click', () => {
    window.parent?.postMessage({ type: 'openApp', appId: 'instagram' }, '*');
  });
}

async function getIgStories() {
  const raw = await sxGetItem(IG_STORIES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function canViewPost(post, viewerType = 'user') {
  if (post.visibility === 'public') return true;
  if (post.visibility === 'private') {
    return post.authorType === 'user' && viewerType === 'user';
  }
  if (post.visibility === 'friends') {
    if (viewerType === 'user') return true;
    if (viewerType === 'friend') {
      return state.friends.includes(post.author) || post.author === state.profile.userName;
    }
    if (viewerType === 'npc') {
      return post.authorType === 'user' || state.friends.includes(post.author);
    }
  }
  return false;
}

function addPostMemory(post) {
  if (post.authorType === 'user') return;
  
  const existingMemory = state.postMemories.find(m => m.id === post.id);
  if (existingMemory) return;
  
  const date = new Date(post.timestamp || Date.now());
  const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  
  state.postMemories.push({
    id: post.id,
    author: post.author,
    authorType: post.authorType,
    text: post.text,
    date: dateStr,
    timestamp: post.timestamp
  });
  
  if (state.postMemories.length > 500) {
    state.postMemories = state.postMemories.slice(-500);
  }
}

function cleanupPosts() {
  const savedIds = new Set(state.savedPosts);
  const userIds = new Set(state.userPosts.map(p => p.id));
  
  const preservedIds = new Set([...savedIds, ...userIds]);
  
  const toRemove = state.generatedPosts.filter(p => !preservedIds.has(p.id));
  toRemove.forEach(post => addPostMemory(post));
  
  const regularPosts = state.generatedPosts.filter(p => !preservedIds.has(p.id));
  if (regularPosts.length > 50) {
    const keepPosts = regularPosts.slice(0, 50);
    const removePosts = regularPosts.slice(50);
    removePosts.forEach(post => addPostMemory(post));
    state.generatedPosts = [
      ...state.generatedPosts.filter(p => preservedIds.has(p.id)),
      ...keepPosts
    ];
  }
}

function renderPosts() {
  if (!feedEl) return;

  cleanupPosts();

  const allPosts = [...state.userPosts, ...state.generatedPosts];
  const visiblePosts = allPosts.filter(post => canViewPost(post, 'user'));

  const userPosts = visiblePosts.filter(post => post.authorType === 'user');
  const savedPosts = visiblePosts.filter(post => state.savedPosts.includes(post.id));
  const otherPosts = visiblePosts.filter(post => post.authorType !== 'user' && !state.savedPosts.includes(post.id));
  
  const displayPosts = [...userPosts, ...savedPosts, ...otherPosts.slice(0, 50)];
  displayPosts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  if (displayPosts.length === 0) {
    feedEl.innerHTML = '<div class="card muted">尚無貼文，請在設定中加入好友或生成貼文</div>';
    return;
  }

  feedEl.innerHTML = displayPosts.map(post => {
    const isUserPost = post.authorType === 'user';
    const isSaved = state.savedPosts.includes(post.id);
    const avatarStyle = isUserPost && state.profile.avatar 
      ? `style="background-image: url(${state.profile.avatar}); background-size: cover; background-position: center;"`
      : '';
    
    const visibilityIcon = post.visibility === 'friends' 
      ? '<i class="fas fa-user-friends" title="好友限定"></i>'
      : post.visibility === 'private'
      ? '<i class="fas fa-lock" title="僅自己"></i>'
      : '';

    const bookmarkIcon = isSaved 
      ? '<i class="fas fa-bookmark"></i>'
      : '<i class="far fa-bookmark"></i>';

    const reactions = state.postReactions[post.id] || {};
    const userReaction = reactions[state.currentAccount] || '';
    const reactionCounts = {
      like: Object.values(reactions).filter(r => r === 'like').length,
      love: Object.values(reactions).filter(r => r === 'love').length,
      care: Object.values(reactions).filter(r => r === 'care').length,
      haha: Object.values(reactions).filter(r => r === 'haha').length,
      wow: Object.values(reactions).filter(r => r === 'wow').length,
      sad: Object.values(reactions).filter(r => r === 'sad').length,
      angry: Object.values(reactions).filter(r => r === 'angry').length
    };
    const totalReactions = Object.values(reactionCounts).reduce((a, b) => a + b, 0);

    const comments = state.postComments[post.id] || [];
    const commentCount = comments.length;

    const reactionBtnClass = userReaction ? 'has-reaction' : '';
    const reactionIcon = userReaction 
      ? `<i class="fas fa-${getReactionIcon(userReaction)}"></i>`
      : '<i class="far fa-thumbs-up"></i>';

    return `
      <article class="post card" data-post-id="${post.id}">
        <div class="avatar-sm" ${avatarStyle}></div>
        <div class="post-content">
          <div class="post-header">
            <div>
              <div class="post-author">${escapeHTML(post.author)} ${visibilityIcon}</div>
              <div class="post-meta">${escapeHTML(post.time)}</div>
            </div>
            <button class="icon-btn" aria-label="更多"><i class="fas fa-ellipsis-h"></i></button>
          </div>
          <div class="post-body">${escapeHTML(post.text)}</div>
          ${totalReactions > 0 ? `<div class="post-reactions-summary">${renderReactionSummary(reactionCounts)}</div>` : ''}
          <div class="post-actions">
            <button type="button" class="reaction-btn ${reactionBtnClass}" data-action="reaction" data-reaction="${userReaction || 'like'}">${reactionIcon}<span>${totalReactions || ''}</span></button>
            <button type="button" data-action="comment"><i class="far fa-comment"></i><span>${commentCount}</span></button>
            <button type="button" data-action="share"><i class="fas fa-share"></i><span>${post.stats.share}</span></button>
            <button type="button" data-action="bookmark" data-saved="${isSaved}">${bookmarkIcon}</button>
          </div>
          <div class="reaction-picker hidden" data-post-id="${post.id}">
            <button type="button" data-reaction-type="like" title="讚"><i class="fas fa-thumbs-up"></i></button>
            <button type="button" data-reaction-type="love" title="愛心"><i class="fas fa-heart"></i></button>
            <button type="button" data-reaction-type="care" title="關心"><i class="fas fa-hand-holding-heart"></i></button>
            <button type="button" data-reaction-type="haha" title="哈哈"><i class="fas fa-laugh-squint"></i></button>
            <button type="button" data-reaction-type="wow" title="哇"><i class="fas fa-surprise"></i></button>
            <button type="button" data-reaction-type="sad" title="傷心"><i class="fas fa-sad-tear"></i></button>
            <button type="button" data-reaction-type="angry" title="生氣"><i class="fas fa-angry"></i></button>
          </div>
          <div class="comments-section hidden" data-post-id="${post.id}">
            <div class="comments-list">${renderComments(comments)}</div>
            <div class="comment-input-row">
              <input type="text" class="comment-input" placeholder="留言..." data-post-id="${post.id}">
              <button class="comment-submit-btn" data-post-id="${post.id}"><i class="fas fa-paper-plane"></i></button>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join('');
  
  bindPostEvents();
}

function getReactionIcon(reaction) {
  const icons = {
    like: 'thumbs-up',
    love: 'heart',
    care: 'hand-holding-heart',
    haha: 'laugh-squint',
    wow: 'surprise',
    sad: 'sad-tear',
    angry: 'angry'
  };
  return icons[reaction] || 'thumbs-up';
}

function renderReactionSummary(counts) {
  let html = '<div class="reaction-icons">';
  if (counts.like > 0) html += '<span class="reaction-icon like"><i class="fas fa-thumbs-up"></i></span>';
  if (counts.love > 0) html += '<span class="reaction-icon love"><i class="fas fa-heart"></i></span>';
  if (counts.care > 0) html += '<span class="reaction-icon care"><i class="fas fa-hand-holding-heart"></i></span>';
  if (counts.haha > 0) html += '<span class="reaction-icon haha"><i class="fas fa-laugh-squint"></i></span>';
  if (counts.wow > 0) html += '<span class="reaction-icon wow"><i class="fas fa-surprise"></i></span>';
  if (counts.sad > 0) html += '<span class="reaction-icon sad"><i class="fas fa-sad-tear"></i></span>';
  if (counts.angry > 0) html += '<span class="reaction-icon angry"><i class="fas fa-angry"></i></span>';
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  html += `<span class="reaction-count">${total}</span></div>`;
  return html;
}

function renderComments(comments) {
  if (!comments || comments.length === 0) return '';
  return comments.slice(-10).map(c => `
    <div class="comment-item">
      <div class="comment-author">${escapeHTML(c.author)}</div>
      <div class="comment-text">${escapeHTML(c.text)}</div>
      <div class="comment-time">${escapeHTML(c.time || '剛剛')}</div>
    </div>
  `).join('');
}

function bindPostEvents() {
  feedEl?.querySelectorAll('[data-action="reaction"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const postEl = btn.closest('.post');
      const picker = postEl?.querySelector('.reaction-picker');
      document.querySelectorAll('.reaction-picker').forEach(p => {
        if (p !== picker) p.classList.add('hidden');
      });
      picker?.classList.toggle('hidden');
    });
  });

  feedEl?.querySelectorAll('.reaction-picker button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const postId = btn.closest('.reaction-picker')?.dataset.postId;
      const reactionType = btn.dataset.reactionType;
      if (!postId || !reactionType) return;
      
      if (!state.postReactions[postId]) state.postReactions[postId] = {};
      const currentReaction = state.postReactions[postId][state.currentAccount];
      if (currentReaction === reactionType) {
        delete state.postReactions[postId][state.currentAccount];
      } else {
        state.postReactions[postId][state.currentAccount] = reactionType;
      }
      (async () => { await saveFacebookData(); renderPosts(); })();
    });
  });

  feedEl?.querySelectorAll('[data-action="comment"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const postEl = btn.closest('.post');
      const commentsSection = postEl?.querySelector('.comments-section');
      commentsSection?.classList.toggle('hidden');
    });
  });

  feedEl?.querySelectorAll('.comment-submit-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const postId = btn.dataset.postId;
      const input = btn.closest('.comments-section')?.querySelector('.comment-input');
      const text = input?.value?.trim();
      if (!postId || !text) return;
      
      if (!state.postComments[postId]) state.postComments[postId] = [];
      const accountInfo = await getAccountInfo(state.currentAccount);
      state.postComments[postId].push({
        id: `comment_${Date.now()}`,
        author: accountInfo.name,
        authorType: accountInfo.type,
        text,
        time: '剛剛',
        timestamp: Date.now()
      });
      await saveFacebookData();
      input.value = '';
      renderPosts();
    });
  });

  feedEl?.querySelectorAll('.comment-input').forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const postId = input.dataset.postId;
        const btn = input.nextElementSibling;
        btn?.click();
      }
    });
  });

  feedEl?.querySelectorAll('[data-action="share"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const postEl = btn.closest('.post');
      const postId = postEl?.dataset.postId;
      if (!postId) return;
      
      const allPosts = [...state.userPosts, ...state.generatedPosts];
      const originalPost = allPosts.find(p => p.id === postId);
      if (!originalPost) return;
      
      const accountInfo = await getAccountInfo(state.currentAccount);
      const sharedPost = normalizePost({
        author: accountInfo.name,
        authorType: accountInfo.type,
        time: '剛剛',
        text: `${originalPost.text}\n\n—— 分享自 ${originalPost.author}`,
        visibility: 'public',
        stats: { like: 0, comment: 0, share: 0 },
        timestamp: Date.now(),
        sharedFrom: originalPost.author
      });
      
      state.userPosts.unshift(sharedPost);
      originalPost.stats.share = (originalPost.stats.share || 0) + 1;
      await saveFacebookData();
      renderPosts();
    });
  });

  feedEl?.querySelectorAll('[data-action="bookmark"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const postEl = btn.closest('.post');
      const postId = postEl?.dataset.postId;
      if (!postId) return;
      
      const isSaved = state.savedPosts.includes(postId);
      if (isSaved) {
        state.savedPosts = state.savedPosts.filter(id => id !== postId);
        btn.innerHTML = '<i class="far fa-bookmark"></i>';
        btn.dataset.saved = 'false';
      } else {
        state.savedPosts.push(postId);
        btn.innerHTML = '<i class="fas fa-bookmark"></i>';
        btn.dataset.saved = 'true';
      }
      (async () => { await saveFacebookData(); })();
    });
  });
}

function renderSavedPosts() {
  if (!feedEl) return;

  const allPosts = [...state.userPosts, ...state.generatedPosts];
  const savedPosts = allPosts.filter(post => state.savedPosts.includes(post.id));

  if (savedPosts.length === 0) {
    feedEl.innerHTML = '<div class="card muted">尚未儲存任何貼文</div>';
    return;
  }

  savedPosts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  feedEl.innerHTML = savedPosts.map(post => {
    const isUserPost = post.authorType === 'user';
    const avatarStyle = isUserPost && state.profile.avatar 
      ? `style="background-image: url(${state.profile.avatar}); background-size: cover; background-position: center;"`
      : '';
    
    const visibilityIcon = post.visibility === 'friends' 
      ? '<i class="fas fa-user-friends" title="好友限定"></i>'
      : post.visibility === 'private'
      ? '<i class="fas fa-lock" title="僅自己"></i>'
      : '';

    return `
      <article class="post card" data-post-id="${post.id}">
        <div class="avatar-sm" ${avatarStyle}></div>
        <div class="post-content">
          <div class="post-header">
            <div>
              <div class="post-author">${escapeHTML(post.author)} ${visibilityIcon}</div>
              <div class="post-meta">${escapeHTML(post.time)}</div>
            </div>
            <button class="icon-btn" aria-label="更多"><i class="fas fa-ellipsis-h"></i></button>
          </div>
          <div class="post-body">${escapeHTML(post.text)}</div>
          <div class="post-actions">
            <button type="button" data-action="like"><i class="far fa-thumbs-up"></i><span>${post.stats.like}</span></button>
            <button type="button" data-action="comment"><i class="far fa-comment"></i><span>${post.stats.comment}</span></button>
            <button type="button" data-action="share"><i class="fas fa-share"></i><span>${post.stats.share}</span></button>
            <button type="button" data-action="bookmark" data-saved="true"><i class="fas fa-bookmark"></i></button>
          </div>
        </div>
      </article>
    `;
  }).join('');
  
  bindPostEvents();
}

async function addPost(content, visibility = 'public') {
  const trimmed = content.trim();
  if (!trimmed) return;
  
  const accountValue = getCurrentPostingAccount();
  const accountInfo = await getAccountInfo(accountValue);
  
  const post = normalizePost({
    author: accountInfo.name,
    authorType: accountInfo.type,
    time: '剛剛',
    text: trimmed,
    visibility,
    stats: { like: 0, comment: 0, share: 0 },
    timestamp: Date.now()
  });
  
  state.userPosts.unshift(post);
  await saveFacebookData();
  renderPosts();
}

function openComposeModal() {
  if (!composeModal) return;
  composeModal.classList.remove('hidden');
  if (composeInput) {
    composeInput.value = '';
    setTimeout(() => composeInput.focus(), 20);
  }
}

function closeComposeModal() {
  composeModal?.classList.add('hidden');
}

async function renderCharFriendsList() {
  const container = document.getElementById('char-friends-list');
  if (!container) return;

  const charList = await getCharacterList();
  if (charList.length === 0) {
    container.innerHTML = '<div class="muted-text">尚未建立角色，請先到設定建立</div>';
    return;
  }

  container.innerHTML = charList.map(char => {
    const name = char.name || '未命名';
    const isFriend = state.friends.includes(name);
    return `
      <div class="friend-select-item">
        <label>
          <input type="checkbox" class="char-friend-check" data-char-name="${escapeHTML(name)}" ${isFriend ? 'checked' : ''}>
          <span>${escapeHTML(name)}</span>
        </label>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.char-friend-check').forEach(check => {
    check.addEventListener('change', () => {
      const charName = check.dataset.charName;
      if (check.checked) {
        if (!state.friends.includes(charName)) {
          state.friends.push(charName);
        }
      } else {
        state.friends = state.friends.filter(n => n !== charName);
      }
      (async () => {
        await saveFacebookData();
        renderFriendsSidebar();
        renderOnlineFriends();
        await renderStories();
        await updateAccountSelectors();
      })();
    });
  });
}

async function renderNpcFriendsList() {
  const container = document.getElementById('npc-friends-list');
  if (!container) return;

  const npcList = await getNpcList();
  if (npcList.length === 0) {
    container.innerHTML = '<div class="muted-text">尚未建立 NPC，請先到設定建立</div>';
    return;
  }

  container.innerHTML = npcList.map(npc => {
    const name = npc.name || '未命名';
    const isFriend = state.npcFriends.includes(name);
    return `
      <div class="friend-select-item">
        <label>
          <input type="checkbox" class="npc-friend-check" data-npc-name="${escapeHTML(name)}" ${isFriend ? 'checked' : ''}>
          <span>${escapeHTML(name)}</span>
        </label>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.npc-friend-check').forEach(check => {
    check.addEventListener('change', () => {
      const npcName = check.dataset.npcName;
      if (check.checked) {
        if (!state.npcFriends.includes(npcName)) {
          state.npcFriends.push(npcName);
        }
      } else {
        state.npcFriends = state.npcFriends.filter(n => n !== npcName);
      }
      (async () => {
        await saveFacebookData();
        renderFriendsSidebar();
        renderOnlineFriends();
        await renderStories();
        await updateAccountSelectors();
      })();
    });
  });
}

async function getWorldbookIndex() {
  return await loadJSON(WORLD_BOOK_INDEX_KEY, []);
}

async function getWorldbookMounts() {
  return await loadJSON(WORLD_BOOK_MOUNTS_KEY, []);
}

async function renderWorldbookMountList() {
  const container = document.getElementById('wb-mount-list');
  if (!container) return;

  const index = await getWorldbookIndex();
  const mounts = await getWorldbookMounts();
  const mountMap = new Map(mounts.map(item => [item.name, item]));
  const items = index.length ? index : [{ title: '通用常識庫' }];

  container.innerHTML = items.map(entry => {
    const name = entry.title || entry.name || '未命名世界書';
    const mount = mountMap.get(name) || {};
    const enabled = mount.enabled ?? false;
    const position = mount.position || 'mid';
    return `
      <div class="wb-mount-item">
        <label>
          <input type="checkbox" class="wb-enable" data-wb-name="${escapeHTML(name)}" ${enabled ? 'checked' : ''}>
          <span>${escapeHTML(name)}</span>
        </label>
        <select class="wb-mount-position" data-wb-name="${escapeHTML(name)}">
          <option value="top" ${position === 'top' ? 'selected' : ''}>前</option>
          <option value="mid" ${position === 'mid' ? 'selected' : ''}>中</option>
          <option value="bottom" ${position === 'bottom' ? 'selected' : ''}>後</option>
        </select>
      </div>
    `;
  }).join('');
}

async function saveWorldbookMounts() {
  const container = document.getElementById('wb-mount-list');
  if (!container) return;

  const rows = container.querySelectorAll('.wb-mount-item');
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
  await sxSetJSON(FB_WB_MOUNTS_KEY, mounts);
  
  const saveBtn = document.getElementById('wb-save');
  if (saveBtn) {
    saveBtn.textContent = '已儲存';
    setTimeout(() => { saveBtn.textContent = '儲存掛載設定'; }, 1200);
  }
}

async function collectMountedWorldbookEntries() {
  const mountedNameSet = new Set(state.mountedWorldbooks.map((item) => item.name));
  if (!mountedNameSet.size) return [];

  const entries = [];
  for (const key of WORLD_BOOK_KEYS) {
    const data = await loadJSON(key, []);
    if (!Array.isArray(data)) continue;
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
  }

  return entries;
}

async function getActiveApiConfig() {
  const configs = await loadJSON('api_configs', []);
  const list = Array.isArray(configs) ? configs : [];
  const activeIndex = Number(await sxGetItem('sx_active_api') || 0);
  return list[activeIndex] || list[0] || null;
}

async function getChatHistoryContext() {
  const raw = await sxGetItem('sx_chat_history');
  if (!raw) return '無聊天記錄';
  try {
    const history = JSON.parse(raw);
    const recent = history.slice(-15);
    if (recent.length === 0) return '無聊天記錄';
    const userName = await sxGetItem('sx_user_name') || 'User';
    return recent.map(msg => {
      const role = msg.role === 'user' ? userName : '角色';
      return `${role}: ${msg.content.slice(0, 100)}`;
    }).join('\n');
  } catch {
    return '無聊天記錄';
  }
}

async function generateAIPosts() {
  const apiConfig = await getActiveApiConfig();
  if (!apiConfig?.url) {
    alert('尚未設定 API，請先到設定頁面配置');
    return;
  }

  const generateBtn = document.getElementById('ai-generate-btn');
  if (generateBtn) {
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 生成中...';
  }

  try {
    const user = await getUserData();
    const char = await getActiveCharacter();
    const worldbooks = await collectMountedWorldbookEntries();
    const chatHistory = await getChatHistoryContext();

    const authors = [];
    if (state.postSettings.generateUserPosts) {
      authors.push({ name: user.name, type: 'user' });
    }
    state.friends.forEach(friendName => {
      if (state.postSettings.generateFriendPosts) {
        authors.push({ name: friendName, type: 'friend' });
      }
    });
    state.npcFriends.forEach(npcName => {
      if (state.postSettings.generateNpcPosts) {
        authors.push({ name: npcName, type: 'npc' });
      }
    });

    if (authors.length === 0) {
      alert('請至少選擇一個要生成貼文的對象');
      return;
    }

    const apiType = apiConfig.type || 'openai';
    const lang = await sxGetItem('sxiphone_lang') || 'zh-TW';
    const communityContext = await getCommunityContext();
    const systemPrompt = `你是一位專業的社群媒體內容創作者，擅長根據角色設定創作符合人物性格的 Facebook 貼文。
請使用 ${window.getAIReadableLangName?.(lang) || '繁體中文'} 撰撰寫。
輸出格式為 JSON: {"posts":[{"author":"","text":"","visibility":"public|friends","like":0,"comment":0,"share":0}]}

visibility 說明：
- public: 公開貼文，所有人可見
- friends: 好友限定貼文，只有好友可見

請為每個作者生成 1-2 則貼文。`;

    const contextStr = `使用者: ${JSON.stringify(user, null, 2)}
${char ? `角色: ${JSON.stringify(char, null, 2)}` : ''}
世界書: ${worldbooks.length > 0 ? worldbooks.map(w => `【${w.title}】${w.content}`).join('\n') : '無'}
聊天記錄: ${chatHistory}

${communityContext}

要生成貼文的作者: ${authors.map(a => a.name).join('、')}

要求：
1. 符合各角色性格和設定
2. 自然融入世界書內容
3. 每則貼文 30-100 字
4. 語氣自然、有互動感
5. 好友的貼文可以設定為 friends 限制
6. 根據社群氛圍調整回應風格`;

    let content = '';
    
    // Gemini 原生 API 格式
    if (apiType === 'gemini') {
      const model = apiConfig.model || 'gemini-1.5-flash';
      const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiConfig.key}`;
      
      const geminiPayload = {
        contents: [{
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\n${contextStr}` }]
        }],
        generationConfig: { temperature: 0.85, maxOutputTokens: 4096 },
        systemInstruction: { parts: [{ text: systemPrompt }] }
      };
      
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
      content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else {
      // OpenAI 相容格式或自訂端點
      let endpoint;
      if (apiType === 'custom') {
        endpoint = apiConfig.url;
      } else {
        endpoint = apiConfig.url.endsWith('/chat/completions')
          ? apiConfig.url
          : `${apiConfig.url.replace(/\/$/, '')}/chat/completions`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiConfig.key ? { Authorization: `Bearer ${apiConfig.key}` } : {})
        },
        body: JSON.stringify({
          model: apiConfig.model || 'gpt-4o-mini',
          temperature: 0.85,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: contextStr }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API 錯誤 (${response.status})`);
      }

      const data = await response.json();
      content = data?.choices?.[0]?.message?.content || '';
    }

    let parsed = null;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }

    const posts = Array.isArray(parsed?.posts) ? parsed.posts : [];

    posts.forEach(p => {
      if (p.text) {
        const authorInfo = authors.find(a => a.name === p.author) || { type: 'user' };
        const post = normalizePost({
          author: p.author || user.name,
          authorType: authorInfo.type,
          time: '剛剛',
          text: p.text,
          visibility: p.visibility || 'public',
          stats: {
            like: Number(p.like || Math.floor(20 + Math.random() * 100)),
            comment: Number(p.comment || Math.floor(2 + Math.random() * 20)),
            share: Number(p.share || Math.floor(1 + Math.random() * 10))
          },
          timestamp: Date.now()
        });
        state.generatedPosts.unshift(post);
      }
    });

    state.generatedPosts = state.generatedPosts.slice(0, 100);
    await saveFacebookData();
    renderPosts();

    if (posts.length === 0) {
      alert('生成失敗，請稍後重試');
    }
  } catch (err) {
    alert(`生成失敗: ${err.message}`);
  } finally {
    if (generateBtn) {
      generateBtn.disabled = false;
      generateBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> AI 生成貼文';
    }
  }
}

function loadPostSettings() {
  const generateUserPosts = document.getElementById('generate-user-posts');
  const generateFriendPosts = document.getElementById('generate-friend-posts');
  const generateNpcPosts = document.getElementById('generate-npc-posts');

  if (generateUserPosts) {
    generateUserPosts.checked = state.postSettings.generateUserPosts !== false;
    generateUserPosts.addEventListener('change', () => {
      state.postSettings.generateUserPosts = generateUserPosts.checked;
      (async () => { await saveFacebookData(); })();
    });
  }

  if (generateFriendPosts) {
    generateFriendPosts.checked = state.postSettings.generateFriendPosts !== false;
    generateFriendPosts.addEventListener('change', () => {
      state.postSettings.generateFriendPosts = generateFriendPosts.checked;
      (async () => { await saveFacebookData(); })();
    });
  }

  if (generateNpcPosts) {
    generateNpcPosts.checked = state.postSettings.generateNpcPosts === true;
    generateNpcPosts.addEventListener('change', () => {
      state.postSettings.generateNpcPosts = generateNpcPosts.checked;
      (async () => { await saveFacebookData(); })();
    });
  }
}

function loadCommunitySettings() {
  const communityToneSelect = document.getElementById('community-tone');
  if (communityToneSelect) {
    communityToneSelect.value = state.communitySettings.tone;
    communityToneSelect.addEventListener('change', () => {
      state.communitySettings.tone = communityToneSelect.value;
      (async () => { await saveFacebookData(); })();
    });
  }

  const criticismCheck = document.getElementById('allow-criticism');
  const sarcasmCheck = document.getElementById('allow-sarcasm');
  const argumentsCheck = document.getElementById('allow-arguments');
  const trollingCheck = document.getElementById('allow-trolling');
  
  if (criticismCheck) criticismCheck.checked = state.communitySettings.flags.criticism;
  if (sarcasmCheck) sarcasmCheck.checked = state.communitySettings.flags.sarcasm;
  if (argumentsCheck) argumentsCheck.checked = state.communitySettings.flags.arguments;
  if (trollingCheck) trollingCheck.checked = state.communitySettings.flags.trolling;

  const saveCommunityFlags = async () => {
    state.communitySettings.flags = {
      criticism: criticismCheck?.checked || false,
      sarcasm: sarcasmCheck?.checked || false,
      arguments: argumentsCheck?.checked || false,
      trolling: trollingCheck?.checked || false
    };
    await saveFacebookData();
  };

  criticismCheck?.addEventListener('change', () => { (async () => { await saveCommunityFlags(); })(); });
  sarcasmCheck?.addEventListener('change', () => { (async () => { await saveCommunityFlags(); })(); });
  argumentsCheck?.addEventListener('change', () => { (async () => { await saveCommunityFlags(); })(); });
  trollingCheck?.addEventListener('change', () => { (async () => { await saveCommunityFlags(); })(); });

  const npcPersonalityInput = document.getElementById('npc-personality');
  if (npcPersonalityInput) {
    npcPersonalityInput.value = state.communitySettings.npcPersonality;
  }

  const haterProfilesInput = document.getElementById('hater-profiles');
  if (haterProfilesInput) {
    haterProfilesInput.value = state.communitySettings.haterProfiles;
  }

  const enableHatersToggle = document.getElementById('enable-haters');
  const haterSettingsPanel = document.getElementById('hater-settings');
  
  if (enableHatersToggle) {
    enableHatersToggle.checked = state.communitySettings.enableHaters;
    if (haterSettingsPanel) {
      haterSettingsPanel.classList.toggle('hidden', !enableHatersToggle.checked);
    }
    enableHatersToggle.addEventListener('change', () => {
      state.communitySettings.enableHaters = enableHatersToggle.checked;
      if (haterSettingsPanel) {
        haterSettingsPanel.classList.toggle('hidden', !enableHatersToggle.checked);
      }
      (async () => { await saveFacebookData(); })();
    });
  }

  const communitySaveBtn = document.getElementById('community-save');
  communitySaveBtn?.addEventListener('click', async () => {
    if (npcPersonalityInput) {
      state.communitySettings.npcPersonality = npcPersonalityInput.value.trim();
    }
    if (haterProfilesInput) {
      state.communitySettings.haterProfiles = haterProfilesInput.value.trim();
    }
    await saveFacebookData();
    communitySaveBtn.textContent = '已儲存';
    setTimeout(() => { communitySaveBtn.textContent = '儲存社群設定'; }, 1200);
  });
}

function bindEvents() {
  postBtn?.addEventListener('click', async () => {
    const visibility = document.getElementById('compose-visibility')?.value || 'public';
    await addPost(composeInput?.value || '', visibility);
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

  const settingsBtn = document.getElementById('settings-btn');
  settingsBtn?.addEventListener('click', () => {
    window.parent?.postMessage({ type: 'openApp', appId: 'facebook-settings' }, '*');
  });

  const toggleRightSidebar = document.getElementById('toggle-right-sidebar');
  const fbRight = document.getElementById('fb-right');
  const backdrop = document.getElementById('right-sidebar-backdrop');
  
  const openRightSidebar = () => {
    fbRight?.classList.add('open');
    backdrop?.classList.add('show');
  };
  
  const closeRightSidebar = () => {
    fbRight?.classList.remove('open');
    backdrop?.classList.remove('show');
  };
  
  toggleRightSidebar?.addEventListener('click', () => {
    if (fbRight?.classList.contains('open')) {
      closeRightSidebar();
    } else {
      openRightSidebar();
    }
  });
  
  backdrop?.addEventListener('click', closeRightSidebar);

  const rightSidebarSettings = document.getElementById('right-sidebar-settings');
  rightSidebarSettings?.addEventListener('click', () => {
    closeRightSidebar();
    window.parent?.postMessage({ type: 'openApp', appId: 'facebook-settings' }, '*');
  });

  const rightSidebarAppearance = document.getElementById('right-sidebar-appearance');
  rightSidebarAppearance?.addEventListener('click', () => {
    closeRightSidebar();
    if (typeof SxAppAppearance !== 'undefined') {
      SxAppAppearance.openAppearancePanel('facebook', document.body, function() {
        var panel = document.getElementById('sx-app-appearance-panel');
        if (panel) panel.remove();
      });
    }
  });

  const aiGenerateBtn = document.getElementById('ai-generate-btn');
  aiGenerateBtn?.addEventListener('click', generateAIPosts);

  const profileEntryBtn = document.getElementById('profile-entry-btn');
  profileEntryBtn?.addEventListener('click', () => {
    showProfilePage(state.currentAccount);
  });

  document.querySelectorAll('.nav-item[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-item[data-tab]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const tab = btn.dataset.tab;
      if (tab === 'saved') {
        renderSavedPosts();
      } else if (tab === 'newsfeed') {
        renderPosts();
      }
    });
  });

  window.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || typeof data !== 'object') return;
    
    if (data.type === 'APP_FOLDER_SYNC' && data.appId === 'settings' && data.data?.storage) {
      const storage = data.data.storage;
      (async () => {
        if (storage.sx_characters) await sxSetJSON(CHAR_LIST_KEY, storage.sx_characters);
        if (storage.sx_users) await sxSetJSON(USER_LIST_KEY, storage.sx_users);
        if (storage.sx_npc_list) await sxSetJSON(NPC_LIST_KEY, storage.sx_npc_list);
        await renderCharFriendsList();
        await renderNpcFriendsList();
        await updateAccountSelectors();
      })();
    }
  });

  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: 'REQUEST_APP_FOLDER_SYNC', appId: 'settings' }, '*');
  }
}

async function showProfilePage(accountValue) {
  const feedSection = document.querySelector('.fb-feed');
  if (!feedSection) return;

  const accountInfo = await getAccountInfo(accountValue);
  const userProfile = await loadJSON(FB_USER_PROFILES_KEY, {});
  const charProfiles = await loadJSON(FB_CHAR_PROFILES_KEY, {});
  
  let profile = {};
  if (accountValue === 'user') {
    profile = userProfile || {};
  } else {
    profile = charProfiles[accountValue] || {};
  }

  const name = profile.name || accountInfo.name || '未知';
  const avatar = profile.avatar || accountInfo.avatar || '';
  const cover = profile.cover || '';
  const bio = profile.bio || '';
  const relationship = profile.relationship || '';
  const relationshipWith = profile.relationshipWith || '';
  const location = profile.location || '';
  const work = profile.work || '';
  const education = profile.education || '';

  const allPosts = [...state.userPosts, ...state.generatedPosts];
  const userPosts = allPosts.filter(post => post.author === name);

  const relationshipLabels = {
    'single': '單身',
    'in-relationship': '交往中',
    'engaged': '已訂婚',
    'married': '已婚',
    'complicated': '關係複雜',
    'separated': '分居中',
    'divorced': '已離婚',
    'widowed': '喪偶'
  };

  let relationshipText = '';
  if (relationship && relationshipLabels[relationship]) {
    relationshipText = relationshipLabels[relationship];
    if (relationshipWith && relationship !== 'single') {
      relationshipText += ` - 與 ${relationshipWith}`;
    }
  }

  feedSection.innerHTML = `
    <div class="profile-page">
      <div class="profile-header card">
        <div class="profile-cover" ${cover ? `style="background-image: url(${cover});"` : ''}></div>
        <div class="profile-avatar-large" ${avatar ? `style="background-image: url(${avatar});"` : ''}></div>
        <div class="profile-info">
          <div class="profile-name">${escapeHTML(name)}</div>
          ${bio ? `<div class="profile-bio">${escapeHTML(bio)}</div>` : ''}
          <div class="profile-details">
            ${relationshipText ? `<div class="profile-detail-item"><i class="fas fa-heart"></i> ${escapeHTML(relationshipText)}</div>` : ''}
            ${location ? `<div class="profile-detail-item"><i class="fas fa-map-marker-alt"></i> ${escapeHTML(location)}</div>` : ''}
            ${work ? `<div class="profile-detail-item"><i class="fas fa-briefcase"></i> ${escapeHTML(work)}</div>` : ''}
            ${education ? `<div class="profile-detail-item"><i class="fas fa-graduation-cap"></i> ${escapeHTML(education)}</div>` : ''}
          </div>
        </div>
      </div>
      <div class="profile-posts-section">
        <div class="card">
          <div class="section-title">貼文</div>
        </div>
        <div class="profile-posts-list" id="profile-posts-list"></div>
      </div>
    </div>
  `;

  const postsList = document.getElementById('profile-posts-list');
  if (userPosts.length === 0) {
    postsList.innerHTML = '<div class="card muted">尚無貼文</div>';
  } else {
    userPosts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    postsList.innerHTML = userPosts.map(post => {
      const isSaved = state.savedPosts.includes(post.id);
      const bookmarkIcon = isSaved ? '<i class="fas fa-bookmark"></i>' : '<i class="far fa-bookmark"></i>';
      const visibilityIcon = post.visibility === 'friends' 
        ? '<i class="fas fa-user-friends" title="好友限定"></i>'
        : post.visibility === 'private'
        ? '<i class="fas fa-lock" title="僅自己"></i>'
        : '';

      const reactions = state.postReactions[post.id] || {};
      const totalReactions = Object.keys(reactions).length;

      return `
        <article class="post card" data-post-id="${post.id}">
          <div class="avatar-sm" ${avatar ? `style="background-image: url(${avatar}); background-size: cover; background-position: center;"` : ''}></div>
          <div class="post-content">
            <div class="post-header">
              <div>
                <div class="post-author">${escapeHTML(post.author)} ${visibilityIcon}</div>
                <div class="post-meta">${escapeHTML(post.time)}</div>
              </div>
            </div>
            <div class="post-body">${escapeHTML(post.text)}</div>
            <div class="post-actions">
              <button type="button" data-action="like"><i class="far fa-thumbs-up"></i><span>${totalReactions || post.stats.like}</span></button>
              <button type="button" data-action="comment"><i class="far fa-comment"></i><span>${post.stats.comment}</span></button>
              <button type="button" data-action="bookmark" data-saved="${isSaved}">${bookmarkIcon}</button>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  const backBtn = document.createElement('button');
  backBtn.className = 'icon-btn';
  backBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
  backBtn.style.cssText = 'position: fixed; top: 70px; left: 16px; z-index: 20;';
  backBtn.addEventListener('click', () => {
    renderPosts();
    backBtn.remove();
  });
  document.body.appendChild(backBtn);
}

async function init() {
  await loadProfile();
  
  state.profile.userName = await sxGetItem('sx_user_name') || '你';
  state.profile.avatar = await sxGetItem('sx_user_avatar') || '';
  
  updateProfileAvatars();
  bindEvents();
  renderPosts();
  renderFriendsSidebar();
  renderOnlineFriends();
  await renderStories();
  await renderSponsored();
  await updateAccountSelectors();
  await updateComposerAvatar();
  
  if (state.isCharView && state.charViewName) {
    document.title = `${state.charViewName} 查看臉書`;
  }
  
  console.log('Loaded app: facebook');
}

init();
