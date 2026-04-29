const profileNameInput = document.getElementById('profile-user-name');
const profileAvatarInput = document.getElementById('profile-avatar-url');
const profilePersonalityInput = document.getElementById('profile-personality');
const profileBackgroundInput = document.getElementById('profile-background');
const profileSaveBtn = document.getElementById('profile-save-btn');
const profileBindBtn = document.getElementById('profile-bind-btn');
const profileSwitchAltBtn = document.getElementById('fb-switch-alt');
const profileSwitchCharBtn = document.getElementById('fb-switch-char');
const profileBackBtn = document.getElementById('profile-back');
const profileCharSelect = document.getElementById('profile-char-select');
const profileUserSelect = document.getElementById('profile-user-select');

const friendNameInput = document.getElementById('friend-name-input');
const friendAddBtn = document.getElementById('friend-add-btn');
const friendListEl = document.getElementById('friend-list');

const worldbookSelect = document.getElementById('fb-worldbook-select');
const worldbookPositionSelect = document.getElementById('fb-worldbook-position');
const worldbookAddBtn = document.getElementById('fb-worldbook-add');
const worldbookListEl = document.getElementById('fb-worldbook-list');

const FB_PROFILE_KEY = 'sx_fb_profile';
const FB_FRIENDS_KEY = 'sx_fb_friends';
const FB_WB_MOUNTS_KEY = 'sx_fb_worldbook_mounts';
const WORLD_BOOK_INDEX_KEY = 'sx_worldbook_index';
const WORLD_BOOK_MOUNTS_KEY = 'sx_worldbook_mounts';
const CHAR_LIST_KEY = 'sx_characters';
const USERS_KEY = 'sx_users';
const ACTIVE_CHAR_KEY = 'sx_char_name';
const ACTIVE_USER_KEY = 'sx_user_name';

const state = {
  profile: {
    userName: localStorage.getItem('sx_user_name') || '你',
    avatar: localStorage.getItem('sx_user_avatar') || '',
    personality: localStorage.getItem('sx_user_personality') || '',
    background: localStorage.getItem('sx_user_background') || ''
  },
  activeCharName: localStorage.getItem(ACTIVE_CHAR_KEY) || '',
  activeUserName: localStorage.getItem(ACTIVE_USER_KEY) || '',
  charList: [],
  userList: [],
  friends: [],
  worldbookMounts: []
};

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

function getWorldbookName(entry) {
  return entry?.title || entry?.name || '';
}

function hydrateState() {
  const profile = loadJSON(FB_PROFILE_KEY, null);
  if (profile && typeof profile === 'object') {
    state.profile.userName = profile.userName || state.profile.userName;
    state.profile.avatar = profile.avatar || state.profile.avatar;
    state.profile.personality = profile.personality || state.profile.personality;
    state.profile.background = profile.background || state.profile.background;
  }

  const friends = loadJSON(FB_FRIENDS_KEY, []);
  state.friends = Array.isArray(friends) ? friends : [];

  const mounts = loadJSON(FB_WB_MOUNTS_KEY, []);
  state.worldbookMounts = Array.isArray(mounts) ? mounts : [];
}

function bindProfileToUI() {
  if (profileNameInput) profileNameInput.value = state.profile.userName || '';
  if (profileAvatarInput) profileAvatarInput.value = state.profile.avatar || '';
  if (profilePersonalityInput) profilePersonalityInput.value = state.profile.personality || '';
  if (profileBackgroundInput) profileBackgroundInput.value = state.profile.background || '';
}

function renderPersonaSelects() {
  state.charList = loadJSON(CHAR_LIST_KEY, []);
  state.userList = loadJSON(USERS_KEY, []);

  if (profileCharSelect) {
    const options = ['<option value="">不套用角色</option>'];
    (Array.isArray(state.charList) ? state.charList : []).forEach((item) => {
      const name = item?.name || '未命名角色';
      const selected = state.activeCharName === name ? 'selected' : '';
      options.push(`<option value="${name}" ${selected}>${name}</option>`);
    });
    profileCharSelect.innerHTML = options.join('');
  }

  if (profileUserSelect) {
    const options = ['<option value="">不套用 user</option>'];
    (Array.isArray(state.userList) ? state.userList : []).forEach((item) => {
      const name = item?.name || '未命名用戶';
      const selected = state.activeUserName === name ? 'selected' : '';
      options.push(`<option value="${name}" ${selected}>${name}</option>`);
    });
    profileUserSelect.innerHTML = options.join('');
  }
}

function applyPersonaBinding() {
  const selectedCharName = profileCharSelect?.value || '';
  const selectedUserName = profileUserSelect?.value || '';

  state.activeCharName = selectedCharName;
  state.activeUserName = selectedUserName;

  if (selectedCharName) {
    const selectedChar = (Array.isArray(state.charList) ? state.charList : []).find((char) => char?.name === selectedCharName);
    if (selectedChar) {
      localStorage.setItem(ACTIVE_CHAR_KEY, selectedCharName);
      localStorage.setItem('sx_char_avatar', selectedChar.avatar || '');
    }
  } else {
    localStorage.removeItem(ACTIVE_CHAR_KEY);
  }

  if (selectedUserName) {
    const selectedUser = (Array.isArray(state.userList) ? state.userList : []).find((user) => user?.name === selectedUserName);
    if (selectedUser) {
      localStorage.setItem(ACTIVE_USER_KEY, selectedUserName);
      state.profile.userName = selectedUser.name || state.profile.userName;
      state.profile.avatar = selectedUser.avatar || state.profile.avatar;
      state.profile.personality = selectedUser.personality || state.profile.personality;
      state.profile.background = selectedUser.background || state.profile.background;
      bindProfileToUI();
      saveJSON(FB_PROFILE_KEY, state.profile);
    }
  } else {
    localStorage.removeItem(ACTIVE_USER_KEY);
  }

  if (profileBindBtn) {
    profileBindBtn.textContent = '已套用';
    setTimeout(() => {
      profileBindBtn.textContent = '套用人物設定到 Facebook';
    }, 1200);
  }
}

function upsertGlobalUser() {
  const users = loadJSON(USERS_KEY, []);
  const list = Array.isArray(users) ? users : [];
  const payload = {
    name: state.profile.userName || '你',
    avatar: state.profile.avatar || '',
    personality: state.profile.personality || '',
    background: state.profile.background || ''
  };
  const idx = list.findIndex((item) => item?.name === payload.name);
  if (idx >= 0) list[idx] = { ...(list[idx] || {}), ...payload };
  else list.unshift(payload);
  saveJSON(USERS_KEY, list);
}

function saveProfile() {
  state.profile = {
    userName: profileNameInput?.value.trim() || '你',
    avatar: profileAvatarInput?.value.trim() || '',
    personality: profilePersonalityInput?.value.trim() || '',
    background: profileBackgroundInput?.value.trim() || ''
  };

  saveJSON(FB_PROFILE_KEY, state.profile);
  localStorage.setItem('sx_user_name', state.profile.userName);
  localStorage.setItem('sx_user_avatar', state.profile.avatar);
  localStorage.setItem('sx_user_personality', state.profile.personality);
  localStorage.setItem('sx_user_background', state.profile.background);
  upsertGlobalUser();

  if (profileSaveBtn) {
    profileSaveBtn.textContent = '已儲存';
    setTimeout(() => {
      profileSaveBtn.textContent = '儲存 User 設定';
    }, 1200);
  }
}

function renderFriendList() {
  if (!friendListEl) return;
  if (!state.friends.length) {
    friendListEl.innerHTML = '<li class="empty">尚未加入好友</li>';
    return;
  }

  friendListEl.innerHTML = state.friends.map((friend, index) => `
    <li>
      <span>${friend.name || `好友 ${index + 1}`}</span>
      <button type="button" data-index="${index}" class="friend-remove">移除</button>
    </li>
  `).join('');
}

function addFriend() {
  const name = friendNameInput?.value.trim();
  if (!name) return;
  if (state.friends.some(item => item.name === name)) {
    friendNameInput.value = '';
    return;
  }
  state.friends.unshift({ name, addedAt: Date.now() });
  saveJSON(FB_FRIENDS_KEY, state.friends);
  renderFriendList();
  friendNameInput.value = '';
}

function renderWorldbookSelect() {
  if (!worldbookSelect) return;
  const index = loadJSON(WORLD_BOOK_INDEX_KEY, []);
  const options = ['<option value="">選擇世界書</option>'];
  (Array.isArray(index) ? index : []).forEach((entry) => {
    const name = getWorldbookName(entry);
    if (!name) return;
    options.push(`<option value="${name}">${name}</option>`);
  });
  worldbookSelect.innerHTML = options.join('');
}

function syncGlobalWorldbookMounts() {
  const globalMounts = loadJSON(WORLD_BOOK_MOUNTS_KEY, []);
  const map = new Map((Array.isArray(globalMounts) ? globalMounts : []).map((item) => [item.name, item]));

  state.worldbookMounts.forEach((item) => {
    map.set(item.name, {
      name: item.name,
      enabled: item.enabled !== false,
      position: item.position || 'mid',
      source: 'facebook'
    });
  });

  saveJSON(WORLD_BOOK_MOUNTS_KEY, Array.from(map.values()));
}

function saveWorldbookMounts() {
  saveJSON(FB_WB_MOUNTS_KEY, state.worldbookMounts);
  syncGlobalWorldbookMounts();
}

function renderWorldbookMountList() {
  if (!worldbookListEl) return;
  if (!state.worldbookMounts.length) {
    worldbookListEl.innerHTML = '<li class="empty">尚未掛載世界書</li>';
    return;
  }

  worldbookListEl.innerHTML = state.worldbookMounts.map((item, index) => `
    <li>
      <label class="inline">
        <input type="checkbox" class="wb-enabled" data-index="${index}" ${item.enabled !== false ? 'checked' : ''}>
        <span>${item.name}</span>
      </label>
      <div class="inline">
        <select class="wb-position" data-index="${index}">
          <option value="top" ${item.position === 'top' ? 'selected' : ''}>前</option>
          <option value="mid" ${item.position === 'mid' ? 'selected' : ''}>中</option>
          <option value="bottom" ${item.position === 'bottom' ? 'selected' : ''}>後</option>
        </select>
        <button type="button" class="wb-remove" data-index="${index}">移除</button>
      </div>
    </li>
  `).join('');
}

function addWorldbookMount() {
  const name = worldbookSelect?.value || '';
  const position = worldbookPositionSelect?.value || 'mid';
  if (!name) return;

  const existing = state.worldbookMounts.find(item => item.name === name);
  if (existing) {
    existing.enabled = true;
    existing.position = position;
  } else {
    state.worldbookMounts.unshift({ name, enabled: true, position });
  }

  saveWorldbookMounts();
  renderWorldbookMountList();
}

function bindEvents() {
  profileSaveBtn?.addEventListener('click', saveProfile);
  profileBindBtn?.addEventListener('click', applyPersonaBinding);

  friendAddBtn?.addEventListener('click', addFriend);
  friendNameInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addFriend();
    }
  });

  friendListEl?.addEventListener('click', (event) => {
    const target = event.target.closest('.friend-remove');
    if (!target) return;
    const index = Number(target.dataset.index);
    if (Number.isNaN(index)) return;
    state.friends.splice(index, 1);
    saveJSON(FB_FRIENDS_KEY, state.friends);
    renderFriendList();
  });

  worldbookAddBtn?.addEventListener('click', addWorldbookMount);

  worldbookListEl?.addEventListener('change', (event) => {
    const enabledInput = event.target.closest('.wb-enabled');
    const positionSelect = event.target.closest('.wb-position');
    if (enabledInput) {
      const index = Number(enabledInput.dataset.index);
      if (!Number.isNaN(index) && state.worldbookMounts[index]) {
        state.worldbookMounts[index].enabled = enabledInput.checked;
        saveWorldbookMounts();
      }
      return;
    }
    if (positionSelect) {
      const index = Number(positionSelect.dataset.index);
      if (!Number.isNaN(index) && state.worldbookMounts[index]) {
        state.worldbookMounts[index].position = positionSelect.value;
        saveWorldbookMounts();
      }
    }
  });

  worldbookListEl?.addEventListener('click', (event) => {
    const target = event.target.closest('.wb-remove');
    if (!target) return;
    const index = Number(target.dataset.index);
    if (Number.isNaN(index)) return;
    state.worldbookMounts.splice(index, 1);
    saveWorldbookMounts();
    renderWorldbookMountList();
  });

  profileBackBtn?.addEventListener('click', () => {
    window.location.href = 'facebook.html';
  });

  profileSwitchAltBtn?.addEventListener('click', () => {
    if (profileUserSelect) {
      profileUserSelect.value = '';
    }
    localStorage.setItem(ACTIVE_USER_KEY, '');
    applyPersonaBinding();
    window.location.replace('facebook-profile-alt.html');
  });

  profileSwitchCharBtn?.addEventListener('click', () => {
    if (profileCharSelect) {
      profileCharSelect.value = profileCharSelect.options?.[0]?.value || '';
    }
    localStorage.setItem(ACTIVE_CHAR_KEY, profileCharSelect?.value || '');
    applyPersonaBinding();
    window.location.replace('facebook-char.html');
  });

  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: 'REQUEST_WORLD_BOOK_SYNC' }, '*');
    window.parent.postMessage({ type: 'REQUEST_APP_FOLDER_SYNC', appId: 'settings' }, '*');
  }

  window.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || typeof data !== 'object') return;
    if (data.type === 'WORLD_BOOK_UPDATED' || data.type === 'WORLD_BOOK_SYNC_READY') {
      renderWorldbookSelect();
    }
    if (data.type === 'APP_FOLDER_SYNC' && data.appId === 'settings' && data.data?.storage) {
      const storage = data.data.storage;
      if (storage.sx_characters) localStorage.setItem(CHAR_LIST_KEY, storage.sx_characters);
      if (storage.sx_users) localStorage.setItem(USERS_KEY, storage.sx_users);
      renderPersonaSelects();
    }
    if (data.type === 'settingsUpdated') {
      renderPersonaSelects();
    }
  });
}

hydrateState();
bindProfileToUI();
renderPersonaSelects();
renderFriendList();
renderWorldbookSelect();
renderWorldbookMountList();
bindEvents();

