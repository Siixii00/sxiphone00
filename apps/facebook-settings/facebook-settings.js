const FB_PROFILE_KEY = 'sx_fb_profile';
const FB_WB_MOUNTS_KEY = 'sx_fb_worldbook_mounts';
const FB_FRIENDS_KEY = 'sx_fb_friends';
const FB_NPC_FRIENDS_KEY = 'sx_fb_npc_friends';
const FB_POST_SETTINGS_KEY = 'sx_fb_post_settings';
const FB_COMMUNITY_TONE_KEY = 'sx_fb_community_tone';
const FB_COMMUNITY_FLAGS_KEY = 'sx_fb_community_flags';
const FB_NPC_PERSONALITY_KEY = 'sx_fb_npc_personality';
const FB_HATER_PROFILES_KEY = 'sx_fb_hater_profiles';
const FB_ENABLE_HATERS_KEY = 'sx_fb_enable_haters';
const CHAR_LIST_KEY = 'sx_characters';
const NPC_LIST_KEY = 'sx_npc_list';
const WORLD_BOOK_INDEX_KEY = 'sx_worldbook_index';
const WORLD_BOOK_MOUNTS_KEY = 'sx_worldbook_mounts';
const FB_USER_PROFILES_KEY = 'sx_fb_user_profiles';
const FB_CHAR_PROFILES_KEY = 'sx_fb_char_profiles';
const FB_SPONSORED_KEY = 'sx_fb_sponsored';

const state = {
  profile: {
    userName: '你',
    avatar: ''
  },
  accountProfiles: {},
  friends: [],
  npcFriends: [],
  sponsored: [],
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

async function loadJSON(key, fallback) {
  const raw = await sxGetItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

const escapeHTML = (str = '') => String(str)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

async function getCharacterList() {
  return loadJSON(CHAR_LIST_KEY, []);
}

async function getNpcList() {
  return loadJSON(NPC_LIST_KEY, []);
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

async function saveFacebookData() {
  try {
    await sxSetJSON(FB_FRIENDS_KEY, state.friends);
    await sxSetJSON(FB_NPC_FRIENDS_KEY, state.npcFriends);
    await sxSetJSON(FB_POST_SETTINGS_KEY, state.postSettings);
    await sxSetItem(FB_COMMUNITY_TONE_KEY, state.communitySettings.tone);
    await sxSetJSON(FB_COMMUNITY_FLAGS_KEY, state.communitySettings.flags);
    await sxSetItem(FB_NPC_PERSONALITY_KEY, state.communitySettings.npcPersonality);
    await sxSetItem(FB_HATER_PROFILES_KEY, state.communitySettings.haterProfiles);
    await sxSetItem(FB_ENABLE_HATERS_KEY, String(state.communitySettings.enableHaters));
  } catch (e) {
    console.error('保存 Facebook 數據失敗:', e);
  }
}

async function loadSettings() {
  state.profile.userName = await sxGetItem('sx_user_name') || '你';
  state.profile.avatar = await sxGetItem('sx_user_avatar') || '';
  state.friends = await loadJSON(FB_FRIENDS_KEY, []);
  state.npcFriends = await loadJSON(FB_NPC_FRIENDS_KEY, []);
  state.postSettings = { ...state.postSettings, ...await loadJSON(FB_POST_SETTINGS_KEY, {}) };
  state.communitySettings.tone = await getCommunityTone();
  state.communitySettings.flags = await getCommunityFlags();
  state.communitySettings.npcPersonality = await getNpcPersonality();
  state.communitySettings.haterProfiles = await getHaterProfiles();
  state.communitySettings.enableHaters = await isHatersEnabled();
  
  state.accountProfiles = {
    user: await loadJSON(FB_USER_PROFILES_KEY, {}),
    char: await loadJSON(FB_CHAR_PROFILES_KEY, {})
  };
  
  state.sponsored = await loadJSON(FB_SPONSORED_KEY, []);
  
  if (state.isCharView && state.charViewName) {
    state.currentAccount = 'user';
  }
}

function getAccountProfile(accountValue) {
  if (accountValue === 'user') {
    return state.accountProfiles.user || {};
  }
  return state.accountProfiles.char[accountValue] || {};
}

async function saveAccountProfile(accountValue, profile) {
  if (accountValue === 'user') {
    state.accountProfiles.user = profile;
    await sxSetJSON(FB_USER_PROFILES_KEY, profile);
  } else {
    state.accountProfiles.char[accountValue] = profile;
    await sxSetJSON(FB_CHAR_PROFILES_KEY, state.accountProfiles.char);
  }
}

async function loadProfileEditForm() {
  const accountValue = state.currentAccount;
  const profile = getAccountProfile(accountValue);
  
  const editName = document.getElementById('edit-name');
  const editAvatar = document.getElementById('edit-avatar');
  const editCover = document.getElementById('edit-cover');
  const editBio = document.getElementById('edit-bio');
  const editRelationship = document.getElementById('edit-relationship');
  const editRelationshipWith = document.getElementById('edit-relationship-with');
  const editLocation = document.getElementById('edit-location');
  const editWork = document.getElementById('edit-work');
  const editEducation = document.getElementById('edit-education');
  
  if (accountValue === 'user') {
    const user = await getUserData();
    editName.value = profile.name || user.name || '';
    editAvatar.value = profile.avatar || user.avatar || '';
  } else {
    const charList = await getCharacterList();
    const charData = charList.find(c => c.name === accountValue);
    editName.value = profile.name || (charData ? charData.name : '') || '';
    editAvatar.value = profile.avatar || (charData ? charData.avatar : '') || '';
  }
  
  editCover.value = profile.cover || '';
  editBio.value = profile.bio || '';
  editRelationship.value = profile.relationship || '';
  editLocation.value = profile.location || '';
  editWork.value = profile.work || '';
  editEducation.value = profile.education || '';
  
  const relationshipWithGroup = document.getElementById('relationship-with-group');
  if (profile.relationship && profile.relationship !== 'single' && profile.relationship !== '') {
    relationshipWithGroup?.classList.remove('hidden');
    editRelationshipWith.value = profile.relationshipWith || '';
  } else {
    relationshipWithGroup?.classList.add('hidden');
    editRelationshipWith.value = '';
  }
}

function bindProfileEditEvents() {
  const editRelationship = document.getElementById('edit-relationship');
  const relationshipWithGroup = document.getElementById('relationship-with-group');
  
  editRelationship?.addEventListener('change', () => {
    const val = editRelationship.value;
    if (val && val !== 'single' && val !== '') {
      relationshipWithGroup?.classList.remove('hidden');
    } else {
      relationshipWithGroup?.classList.add('hidden');
    }
  });
  
  const saveProfileBtn = document.getElementById('save-profile-btn');
  saveProfileBtn?.addEventListener('click', async () => {
    const accountValue = state.currentAccount;
    const profile = {
      name: document.getElementById('edit-name')?.value?.trim() || '',
      avatar: document.getElementById('edit-avatar')?.value?.trim() || '',
      cover: document.getElementById('edit-cover')?.value?.trim() || '',
      bio: document.getElementById('edit-bio')?.value?.trim() || '',
      relationship: document.getElementById('edit-relationship')?.value || '',
      relationshipWith: document.getElementById('edit-relationship-with')?.value?.trim() || '',
      location: document.getElementById('edit-location')?.value?.trim() || '',
      work: document.getElementById('edit-work')?.value?.trim() || '',
      education: document.getElementById('edit-education')?.value?.trim() || ''
    };
    
    await saveAccountProfile(accountValue, profile);
    
    if (accountValue === 'user') {
      await sxSetItem('sx_user_name', profile.name || '你');
      if (profile.avatar) await sxSetItem('sx_user_avatar', profile.avatar);
    }
    
    await updateProfileDisplay();
    await updateAccountSelector();
    
    saveProfileBtn.textContent = '已儲存';
    setTimeout(() => { saveProfileBtn.textContent = '儲存個人資料'; }, 1200);
  });
}

async function updateProfileDisplay() {
  const accountValue = state.currentAccount;
  const profile = getAccountProfile(accountValue);
  let displayName = profile.name;
  let avatar = profile.avatar;
  
  if (!displayName || !avatar) {
    const user = await getUserData();
    if (accountValue === 'user') {
      displayName = displayName || user.name || '你';
      avatar = avatar || user.avatar || '';
    } else {
      const charList = await getCharacterList();
      const charData = charList.find(c => c.name === accountValue);
      displayName = displayName || (charData ? charData.name : accountValue);
      avatar = avatar || (charData ? charData.avatar : '') || '';
    }
  }
  
  const settingsAvatar = document.getElementById('settings-avatar');
  if (settingsAvatar) {
    if (avatar) {
      settingsAvatar.style.backgroundImage = `url(${avatar})`;
      settingsAvatar.style.backgroundSize = 'cover';
      settingsAvatar.style.backgroundPosition = 'center';
    } else {
      settingsAvatar.style.backgroundImage = '';
    }
  }
  
  const settingsUserName = document.getElementById('settings-user-name');
  if (settingsUserName) {
    settingsUserName.textContent = displayName;
  }
}

async function updateAccountSelector() {
  const accountSelect = document.getElementById('account-select');
  if (!accountSelect) return;
  
  const user = await getUserData();
  const userProfile = getAccountProfile('user');
  const userName = userProfile.name || user.name || '你';
  const options = [`<option value="user">${escapeHTML(userName)}</option>`];
  
  state.friends.forEach(friendName => {
    const charProfile = getAccountProfile(friendName);
    const displayName = charProfile.name || friendName;
    options.push(`<option value="${escapeHTML(friendName)}">${escapeHTML(displayName)}</option>`);
  });
  
  accountSelect.innerHTML = options.join('');
  accountSelect.value = state.currentAccount;
  
  if (state.isCharView && state.charViewName) {
    accountSelect.value = 'user';
    state.currentAccount = 'user';
  }
  
  accountSelect.addEventListener('change', async () => {
    state.currentAccount = accountSelect.value;
    await updateProfileDisplay();
    await loadProfileEditForm();
  });
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
    check.addEventListener('change', async () => {
      const charName = check.dataset.charName;
      if (check.checked) {
        if (!state.friends.includes(charName)) {
          state.friends.push(charName);
        }
      } else {
        state.friends = state.friends.filter(n => n !== charName);
      }
      await saveFacebookData();
      await updateAccountSelector();
    });
  });
}
      updateAccountSelector();
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
    check.addEventListener('change', async () => {
      const npcName = check.dataset.npcName;
      if (check.checked) {
        if (!state.npcFriends.includes(npcName)) {
          state.npcFriends.push(npcName);
        }
      } else {
        state.npcFriends = state.npcFriends.filter(n => n !== npcName);
      }
      await saveFacebookData();
    });
  });
}

async function getWorldbookIndex() {
  return loadJSON(WORLD_BOOK_INDEX_KEY, []);
}

async function getWorldbookMounts() {
  return loadJSON(WORLD_BOOK_MOUNTS_KEY, []);
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

function loadPostSettings() {
  const generateUserPosts = document.getElementById('generate-user-posts');
  const generateFriendPosts = document.getElementById('generate-friend-posts');
  const generateNpcPosts = document.getElementById('generate-npc-posts');

  if (generateUserPosts) {
    generateUserPosts.checked = state.postSettings.generateUserPosts !== false;
    generateUserPosts.addEventListener('change', async () => {
      state.postSettings.generateUserPosts = generateUserPosts.checked;
      await saveFacebookData();
    });
  }

  if (generateFriendPosts) {
    generateFriendPosts.checked = state.postSettings.generateFriendPosts !== false;
    generateFriendPosts.addEventListener('change', async () => {
      state.postSettings.generateFriendPosts = generateFriendPosts.checked;
      await saveFacebookData();
    });
  }

  if (generateNpcPosts) {
    generateNpcPosts.checked = state.postSettings.generateNpcPosts === true;
    generateNpcPosts.addEventListener('change', async () => {
      state.postSettings.generateNpcPosts = generateNpcPosts.checked;
      await saveFacebookData();
    });
  }
}

function loadCommunitySettings() {
  const communityToneSelect = document.getElementById('community-tone');
  if (communityToneSelect) {
    communityToneSelect.value = state.communitySettings.tone;
    communityToneSelect.addEventListener('change', async () => {
      state.communitySettings.tone = communityToneSelect.value;
      await saveFacebookData();
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

  criticismCheck?.addEventListener('change', saveCommunityFlags);
  sarcasmCheck?.addEventListener('change', saveCommunityFlags);
  argumentsCheck?.addEventListener('change', saveCommunityFlags);
  trollingCheck?.addEventListener('change', saveCommunityFlags);

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
    enableHatersToggle.addEventListener('change', async () => {
      state.communitySettings.enableHaters = enableHatersToggle.checked;
      if (haterSettingsPanel) {
        haterSettingsPanel.classList.toggle('hidden', !enableHatersToggle.checked);
      }
      await saveFacebookData();
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

async function getWorldbookContext() {
  const categories = ['cot', 'style', 'global', 'keywords', 'backend'];
  const entries = [];
  for (const cat of categories) {
    const key = `sx_worldbook_${cat}`;
    const raw = await sxGetItem(key);
    if (!raw) continue;
    try {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        list.slice(0, 5).forEach(e => {
          if (e.title && e.content) {
            entries.push(`【${e.title}】${e.content.slice(0, 200)}`);
          }
        });
      }
    } catch (e) {}
  }
  return entries.length > 0 ? entries.join('\n') : '無世界書設定';
}

function getCommunityContext() {
  const tone = state.communitySettings.tone;
  const flags = state.communitySettings.flags;
  const npcPersonality = state.communitySettings.npcPersonality;
  const hatersEnabled = state.communitySettings.enableHaters;
  const haterProfiles = state.communitySettings.haterProfiles;
  
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
    const worldbooks = await getWorldbookContext();
    const chatHistory = await getChatHistoryContext();
    const communityContext = getCommunityContext();

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

    const endpoint = apiConfig.url.endsWith('/chat/completions')
      ? apiConfig.url
      : `${apiConfig.url.replace(/\/$/, '')}/chat/completions`;

    const lang = await sxGetItem('sxiphone_lang') || 'zh-TW';
    const systemPrompt = `你是一位專業的社群媒體內容創作者，擅長根據角色設定創作符合人物性格的 Facebook 貼文。
請使用 ${window.getAIReadableLangName?.(lang) || '繁體中文'} 撰寫。
輸出格式為 JSON: {"posts":[{"author":"","text":"","visibility":"public|friends","like":0,"comment":0,"share":0}]}

visibility 說明：
- public: 公開貼文，所有人可見
- friends: 好友限定貼文，只有好友可見

請為每個作者生成 1-2 則貼文。`;

    const contextStr = `使用者: ${JSON.stringify(user, null, 2)}
世界書: ${worldbooks}
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
    const content = data?.choices?.[0]?.message?.content || '';

    let parsed = null;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }

    const posts = Array.isArray(parsed?.posts) ? parsed.posts : [];
    
    const FB_GENERATED_POSTS_KEY = 'sx_fb_generated_posts';
    const generatedPosts = await loadJSON(FB_GENERATED_POSTS_KEY, []);

    posts.forEach(p => {
      if (p.text) {
        const authorInfo = authors.find(a => a.name === p.author) || { type: 'user' };
        generatedPosts.unshift({
          id: `post_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
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
      }
    });

    await sxSetJSON(FB_GENERATED_POSTS_KEY, generatedPosts.slice(0, 100));
    alert(`已生成 ${posts.length} 則貼文`);
  } catch (err) {
    alert(`生成失敗: ${err.message}`);
  } finally {
    if (generateBtn) {
      generateBtn.disabled = false;
      generateBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> AI 生成貼文';
    }
  }
}

function bindEvents() {
  const accountSelect = document.getElementById('account-select');
  accountSelect?.addEventListener('change', async () => {
    state.currentAccount = accountSelect.value;
    await updateProfileDisplay();
    await loadProfileEditForm();
  });

  bindProfileEditEvents();

  const wbSaveBtn = document.getElementById('wb-save');
  const wbRefreshBtn = document.getElementById('wb-refresh');
  const aiGenerateBtn = document.getElementById('ai-generate-btn');

  wbSaveBtn?.addEventListener('click', saveWorldbookMounts);
  wbRefreshBtn?.addEventListener('click', async () => {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'REQUEST_WORLD_BOOK_SYNC' }, '*');
    }
    await renderWorldbookMountList();
  });
  aiGenerateBtn?.addEventListener('click', generateAIPosts);

  window.addEventListener('message', async (event) => {
    const data = event.data;
    if (!data || typeof data !== 'object') return;
    
    if (data.type === 'WORLD_BOOK_SYNC_READY') {
      await renderWorldbookMountList();
    }
  });

  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: 'REQUEST_WORLD_BOOK_SYNC' }, '*');
  }
}

function renderSponsoredList() {
  const container = document.getElementById('sponsored-list');
  if (!container) return;

  if (state.sponsored.length === 0) {
    container.innerHTML = '<div class="muted-text">尚未新增贊助內容</div>';
    return;
  }

  container.innerHTML = state.sponsored.map((item, index) => `
    <div class="sponsored-item-edit">
      <div class="sponsored-item-info">
        <div class="sponsored-item-title">${escapeHTML(item.title)}</div>
        <div class="sponsored-item-link">${escapeHTML(item.link)}</div>
      </div>
      <button class="icon-btn sm" data-index="${index}" data-action="delete-sponsored"><i class="fas fa-trash"></i></button>
    </div>
  `).join('');

  container.querySelectorAll('[data-action="delete-sponsored"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index);
      if (!isNaN(index)) {
        state.sponsored.splice(index, 1);
        renderSponsoredList();
      }
    });
  });
}

function bindSponsoredEvents() {
  const addBtn = document.getElementById('add-sponsored-btn');
  const saveBtn = document.getElementById('save-sponsored-btn');
  const titleInput = document.getElementById('sponsored-title');
  const linkInput = document.getElementById('sponsored-link');
  const imageInput = document.getElementById('sponsored-image');

  addBtn?.addEventListener('click', () => {
    const title = titleInput?.value?.trim();
    const link = linkInput?.value?.trim();
    const image = imageInput?.value?.trim();

    if (!title || !link) {
      alert('請輸入標題和連結');
      return;
    }

    state.sponsored.push({ title, link, image });
    titleInput.value = '';
    linkInput.value = '';
    imageInput.value = '';
    renderSponsoredList();
  });

  saveBtn?.addEventListener('click', async () => {
    await sxSetJSON(FB_SPONSORED_KEY, state.sponsored);
    saveBtn.textContent = '已儲存';
    setTimeout(() => { saveBtn.textContent = '儲存贊助內容'; }, 1200);
  });
}

(async () => {
  await loadSettings();
  await updateProfileDisplay();
  await updateAccountSelector();
  await loadProfileEditForm();
  await renderCharFriendsList();
  await renderNpcFriendsList();
  await renderWorldbookMountList();
  loadPostSettings();
  loadCommunitySettings();
  renderSponsoredList();
  bindEvents();
  bindSponsoredEvents();
  console.log('Loaded app: facebook-settings');
})();
