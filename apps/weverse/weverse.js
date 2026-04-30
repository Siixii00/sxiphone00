const groupListEl = document.getElementById('group-list');
const feedEl = document.getElementById('community-feed');
const storyStripEl = document.getElementById('story-strip');
const memberCountEl = document.getElementById('member-count');
const onlineCountEl = document.getElementById('online-count');

const activeNameEl = document.getElementById('active-group-name');
const activeBioEl = document.getElementById('active-group-bio');
const activeTypeEl = document.getElementById('active-group-type');
const rolePillEl = document.getElementById('role-pill');

const postInput = document.getElementById('post-input');
const postBtn = document.getElementById('post-btn');

const simulateMemberPostBtn = document.getElementById('simulate-member-post-btn');

const appRootEl = document.querySelector('.weverse-app');
const mainViewEl = document.querySelector('.wv-main');
const roleToggleBtn = document.getElementById('role-toggle');
const userSettingsBtn = document.getElementById('user-settings-btn');
const artistSettingsBtn = document.getElementById('artist-settings-btn');
const resetBtn = document.getElementById('reset-btn');

const userSettingsPage = document.getElementById('user-settings-page');
const userSettingsBack = document.getElementById('user-settings-back');
const userSettingsApply = document.getElementById('user-settings-apply');
const userGroupSelect = document.getElementById('user-group-select');
const userCustomGroupFields = document.getElementById('user-custom-group-fields');
const userCustomGroupName = document.getElementById('user-custom-group-name');
const userCustomGroupType = document.getElementById('user-custom-group-type');
const userCustomGroupBio = document.getElementById('user-custom-group-bio');
const userAiSourceType = document.getElementById('user-ai-source-type');
const importAiMembersBtn = document.getElementById('import-ai-members-btn');
const userSettingsStatus = document.getElementById('user-settings-status');
const publicPostSourceUrlInput = document.getElementById('public-post-source-url');
const publicPostSourceFormatInput = document.getElementById('public-post-source-format');
const importPublicPostsBtn = document.getElementById('import-public-posts-btn');
const publicPostsStatus = document.getElementById('public-posts-status');

const artistSettingsPage = document.getElementById('artist-settings-page');
const artistSettingsBack = document.getElementById('artist-settings-back');
const artistSettingsSave = document.getElementById('artist-settings-save');
const settingsSaveStatusEl = document.getElementById('settings-save-status');
const exportSettingsBtn = document.getElementById('export-settings-btn');

const artistGroupNameInput = document.getElementById('artist-group-name');
const artistGroupBioInput = document.getElementById('artist-group-bio');
const aiSourceTypeInput = document.getElementById('ai-source-type');
const newMemberNameInput = document.getElementById('new-member-name');
const newMemberSourceTypeInput = document.getElementById('new-member-source-type');
const newMemberPersonaInput = document.getElementById('new-member-persona');
const newMemberAvatarInput = document.getElementById('new-member-avatar');
const newMemberAvatarFileInput = document.getElementById('new-member-avatar-file');
const avatarUploadPreviewEl = document.getElementById('avatar-upload-preview');
const addMemberBtn = document.getElementById('add-member-btn');
const memberEditorListEl = document.getElementById('member-editor-list');

let pendingAvatarImageData = '';
let saveTimer = null;
let viewerSettings = {
  selectedGroupId: '',
  aiSourceType: 'all'
};

const WEVERSE_SETTINGS_KEY = 'weverse_artist_settings_v1';

const saveWeverseData = () => {
    try {
        const settings = localStorage.getItem(WEVERSE_SETTINGS_KEY);
        console.log("Weverse?¸æ?å·²ä?å­˜è‡³ localStorage");
    } catch (e) {
        console.error("ä¿å?Weverse?¸æ?å¤±æ?:", e);
    }
};

const saveToPersistentStorage = async () => {
    saveWeverseData();
    if (typeof localforage !== 'undefined') {
        try {
            const existingData = await localforage.getItem('sx_app_persisted_data') || {};
            const settings = localStorage.getItem(WEVERSE_SETTINGS_KEY);
            if (settings) {
                await localforage.setItem('sx_app_persisted_data', {
                    ...existingData,
                    weverse_artist_settings_v1: JSON.parse(settings)
                });
            }
            console.log("Weverse?¸æ?å·²ä?å­˜è‡³ IndexedDB");
        } catch (e) {
            console.error("IndexedDB ä¿å?å¤±æ?:", e);
        }
    }
};

window.addEventListener('pagehide', () => {
    saveWeverseData();
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        saveWeverseData();
    }
});

window.addEventListener('message', (event) => {
    if (event.data?.type === 'APP_WILL_CLOSE') {
        saveWeverseData();
    }
});

function loadJoinedGroups() {
  try {
    const raw = localStorage.getItem(WEVERSE_JOINED_GROUPS_KEY);
    if (raw) {
      joinedGroupIds = JSON.parse(raw);
    }
  } catch (e) {
    joinedGroupIds = [];
  }
}

function saveJoinedGroups() {
  try {
    localStorage.setItem(WEVERSE_JOINED_GROUPS_KEY, JSON.stringify(joinedGroupIds));
  } catch (e) {
    console.error('ä¿å?å·²å??¥å?é«”å¤±??', e);
  }
}

function joinGroup(groupId) {
  if (!joinedGroupIds.includes(groupId)) {
    joinedGroupIds.push(groupId);
    saveJoinedGroups();
  }
}

function leaveGroup(groupId) {
  joinedGroupIds = joinedGroupIds.filter(id => id !== groupId);
  saveJoinedGroups();
}

function isGroupJoined(groupId) {
  return joinedGroupIds.includes(groupId);
}

function loadArtistGroups() {
  try {
    const raw = localStorage.getItem(ARTIST_GROUPS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('è¼‰å…¥?äºº?˜é?å¤±æ?:', e);
  }
  return [];
}

function saveArtistGroups() {
  try {
    localStorage.setItem(ARTIST_GROUPS_KEY, JSON.stringify(groups));
  } catch (e) {
    console.error('ä¿å??äºº?˜é?å¤±æ?:', e);
  }
}

function createArtistGroup(name, type, bio) {
  const newGroup = {
    id: `artist-${Date.now()}`,
    name: name.trim(),
    type: type || 'K-POP',
    bio: bio.trim() || `${name} ?„å??¹ç¤¾ç¾¤`,
    members: 0,
    online: 0,
    artistProfile: {
      name: `${name} Official`,
      bio: '',
      members: []
    },
    stories: [],
    posts: []
  };
  groups.push(newGroup);
  saveArtistGroups();
  return newGroup;
}

function deleteArtistGroup(groupId) {
  groups = groups.filter(g => g.id !== groupId);
  saveArtistGroups();
  if (activeGroupId === groupId) {
    activeGroupId = '';
  }
}

const baseGroups = [];

const ARTIST_GROUPS_KEY = 'weverse_artist_groups_v1';

const aiPostStarters = ['ä»Šå¤©ç·´ç?çµæ?äº?, '?›å?å½©æ??ä?', '?³ä??“å€‹æ???, '?šå??ç??‹è???];
const aiPostClosers = ['ä½ å€‘ä?å¤©ä?è¾›è‹¦äº?, 'ç­‰ç?è¦?, 'è¨˜å??ƒé£¯', '?‘æ??ä?'];

let groups = JSON.parse(JSON.stringify(baseGroups));
let activeGroupId = '';
let isArtistMode = false;
let joinedGroupIds = [];

const WEVERSE_JOINED_GROUPS_KEY = 'weverse_joined_groups_v1';

function formatCompact(num) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${Math.round(num / 100) / 10}K`;
  return `${num}`;
}

function getActiveGroup() {
  return groups.find((group) => group.id === activeGroupId) || null;
}

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function setSaveStatus(text) {
  if (settingsSaveStatusEl) {
    settingsSaveStatusEl.textContent = text;
  }
}

function buildSettingsSnapshot() {
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    viewerSettings,
    groups: groups.map((group) => ({
      id: group.id,
      name: group.name,
      bio: group.bio,
      artistProfile: group.artistProfile || { name: `${group.name} Official`, bio: '', members: [], aiSourceType: 'all' }
    }))
  };
}

function saveSettingsToStorage() {
  try {
    const payload = buildSettingsSnapshot();
    localStorage.setItem(WEVERSE_SETTINGS_KEY, JSON.stringify(payload));
    const lang = localStorage.getItem('sxiphone_lang') || 'zh-Hant';
    const localeCode = window.getLocaleStringLang?.(lang) || 'zh-TW';
    setSaveStatus(`å·²å„²å­?${new Date(payload.savedAt).toLocaleString(localeCode)}`);
  } catch (error) {
    setSaveStatus('?²å?å¤±æ?ï¼Œè??è©¦');
  }
}

function scheduleSettingsSave() {
  setSaveStatus('?‰æœª?²å?è®Šæ›´...');
  if (saveTimer) {
    clearTimeout(saveTimer);
  }
  saveTimer = setTimeout(() => {
    saveSettingsToStorage();
  }, 260);
}

function applySavedSettings(snapshot) {
  if (!snapshot || !Array.isArray(snapshot.groups)) return;

  if (snapshot.viewerSettings && typeof snapshot.viewerSettings === 'object') {
    viewerSettings = {
      selectedGroupId: snapshot.viewerSettings.selectedGroupId || '',
      aiSourceType: snapshot.viewerSettings.aiSourceType || 'all'
    };
  }

  snapshot.groups.forEach((savedGroup) => {
    const target = groups.find((group) => group.id === savedGroup.id);
    if (!target) {
      groups.push(savedGroup);
      return;
    }

    if (typeof savedGroup.name === 'string') {
      target.name = savedGroup.name;
    }
    if (typeof savedGroup.bio === 'string') {
      target.bio = savedGroup.bio;
    }
    if (savedGroup.artistProfile) {
      target.artistProfile = savedGroup.artistProfile;
    }
  });
}

function loadSettingsFromStorage() {
  try {
    const raw = localStorage.getItem(WEVERSE_SETTINGS_KEY);
    if (!raw) {
      setSaveStatus('?®å?ä½¿ç”¨?è¨­è¨­å?');
      return;
    }

    const parsed = JSON.parse(raw);
    applySavedSettings(parsed);

    if (parsed.savedAt) {
      const lang = localStorage.getItem('sxiphone_lang') || 'zh-Hant';
      const localeCode = window.getLocaleStringLang?.(lang) || 'zh-TW';
      setSaveStatus(`å·²è??¥å?ä»?${new Date(parsed.savedAt).toLocaleString(localeCode)}`);
    } else {
      setSaveStatus('å·²è??¥æœ¬æ©Ÿè¨­å®?);
    }
  } catch (error) {
    setSaveStatus('è¼‰å…¥?™ä»½å¤±æ?ï¼Œæ”¹?¨é?è¨­è¨­å®?);
  }
}

function exportSettingsBackup() {
  const snapshot = buildSettingsSnapshot();
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const stamp = snapshot.savedAt.slice(0, 19).replace(/[:T]/g, '-');
  link.href = url;
  link.download = `weverse-settings-backup-${stamp}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  const lang = localStorage.getItem('sxiphone_lang') || 'zh-Hant';
  const localeCode = window.getLocaleStringLang?.(lang) || 'zh-TW';
  setSaveStatus(`å·²åŒ¯?ºå?ä»?${new Date(snapshot.savedAt).toLocaleString(localeCode)}`);
}

function ensureArtistProfile(group) {
  if (!group.artistProfile) {
    group.artistProfile = {
      name: `${group.name} Official`,
      bio: '',
      members: []
    };
  }
  if (!Array.isArray(group.artistProfile.members)) {
    group.artistProfile.members = [];
  }
}

function getArtistMembersText(group) {
  ensureArtistProfile(group);
  if (!group.artistProfile.members.length) return 'å°šæœªè¨­å??å“¡';
  return group.artistProfile.members.map((member) => member.name).join(' / ');
}

function renderGroupList() {
  if (!groupListEl) return;
  
  if (isArtistMode) {
    if (activeGroupId) {
      const group = getActiveGroup();
      groupListEl.innerHTML = `
        <button class="group-chip back-btn" id="artist-back-to-cards-btn" type="button">
          <i class="fas fa-chevron-left"></i> è¿”å??—è¡¨
        </button>
        <button class="group-chip active" type="button">${group?.name || ''}</button>
      `;
    } else {
      groupListEl.innerHTML = '';
    }
  } else {
    const joinedGroups = groups.filter((group) => joinedGroupIds.includes(group.id));
    
    if (joinedGroups.length === 0) {
      groupListEl.innerHTML = `<button class="group-chip explore-btn" id="explore-groups-btn" type="button">?¢ç´¢ç¤¾ç¾¤</button>`;
    } else {
      groupListEl.innerHTML = joinedGroups.map((group) => `
        <button class="group-chip ${group.id === activeGroupId ? 'active' : ''}" data-group-id="${group.id}" type="button">
          ${group.name}
        </button>
      `).join('') + `<button class="group-chip explore-btn" id="explore-groups-btn" type="button">+ ?¢ç´¢</button>`;
    }
  }
}

function renderStories(group) {
  if (!storyStripEl) return;
  
  ensureArtistProfile(group);
  const members = group?.artistProfile?.members || [];
  const posts = group?.posts || [];
  
  const storyItems = members.map((member) => {
    const memberPosts = posts.filter(p => p.author && p.author.includes(member.name));
    const latestPost = memberPosts[0];
    return {
      id: member.id,
      name: member.name,
      avatar: member.avatar || member.name.slice(0, 2).toUpperCase(),
      avatarImage: member.avatarImage || '',
      color: member.color || 'var(--wv-accent)',
      hasContent: !!latestPost,
      content: latestPost
    };
  }).filter(s => s.hasContent);
  
  if (storyItems.length === 0) {
    const defaultStories = [
      { id: 'default-1', name: 'å®˜æ–¹', avatar: 'å®?, avatarImage: '', color: 'var(--wv-accent)', hasContent: true, content: null },
      { id: 'default-2', name: '?å“¡', avatar: '??, avatarImage: '', color: '#f09433', hasContent: true, content: null }
    ];
    storyStripEl.innerHTML = defaultStories.map((story) => `
      <article class="story-item" data-story-id="${story.id}" data-story-name="${story.name}">
        <span class="avatar" style="background:${story.color}">${story.avatar}</span>
        <span class="name">${story.name}</span>
      </article>
    `).join('');
    return;
  }
  
  storyStripEl.innerHTML = storyItems.map((story) => `
    <article class="story-item" data-story-id="${story.id}" data-story-name="${story.name}" data-has-content="${story.hasContent}">
      <span class="avatar ${story.avatarImage ? 'has-image' : ''}" ${story.avatarImage ? `style="background-image:url('${story.avatarImage}')"` : `style="background:${story.color}"`}>${story.avatarImage ? '' : story.avatar}</span>
      <span class="name">${story.name}</span>
    </article>
  `).join('');
}

function renderFeed(group) {
  if (!isArtistMode && !isGroupJoined(group.id)) {
    feedEl.innerHTML = `
      <div class="join-prompt">
        <p>? å…¥æ­¤ç¤¾ç¾¤å??èƒ½?¥ç??¼æ??§å®¹</p>
        <button class="join-group-btn" data-group-id="${group.id}" type="button">? å…¥ç¤¾ç¾¤</button>
      </div>
    `;
    feedEl.scrollTop = 0;
    return;
  }
  
  if (!group.posts || group.posts.length === 0) {
    feedEl.innerHTML = `
      <div class="empty-feed">
        <p>?®å??„æ??‰ç™¼??/p>
      </div>
    `;
    feedEl.scrollTop = 0;
    return;
  }
  
  feedEl.innerHTML = group.posts.map((post) => `
    <article class="post">
      <div class="post-head">
        <span>${post.author}</span>
        <span>${post.time}</span>
      </div>
      <div class="post-text">${post.text}</div>
      <div class="post-actions">
        <span>è®?${formatCompact(post.likes || 0)}</span>
        <span>?™è? ${formatCompact(post.comments || 0)}</span>
      </div>
    </article>
  `).join('');
  feedEl.scrollTop = 0;
}

function renderArtistPreview(group) {
}

function renderMemberEditorList(group) {
  ensureArtistProfile(group);
  if (!group.artistProfile.members.length) {
    memberEditorListEl.innerHTML = '<div class="empty-members">?®å?æ²’æ??å“¡ï¼Œå??°å??³å?ä¸€ä½æ??¡ã€?/div>';
    return;
  }

  memberEditorListEl.innerHTML = group.artistProfile.members.map((member) => `
    <article class="member-item" data-member-id="${member.id}">
      <span class="member-avatar ${member.avatarImage ? 'has-image' : ''}" ${member.avatarImage ? `style="background-image:url('${member.avatarImage}')"` : ''}>${(member.avatar || member.name || '?').slice(0, 2).toUpperCase()}</span>
      <div class="member-text">
        <strong>${member.name}<span class="member-source">${member.sourceType || 'char'}</span></strong>
        <span>${member.persona || '?ªè¨­å®šå€‹æ€?}</span>
      </div>
      <button class="remove-member-btn" type="button" data-remove-member-id="${member.id}">ç§»é™¤</button>
    </article>
  `).join('');
}

function renderActiveCommunity() {
  const group = getActiveGroup();
  
  if (isArtistMode) {
    if (!activeGroupId) {
      activeNameEl.textContent = '?äººå·¥ä???;
      activeBioEl.textContent = 'å»ºç?ä¸¦ç®¡?†ä??„å?é«”ç¤¾ç¾?;
      activeTypeEl.textContent = '';
      memberCountEl.textContent = '';
      onlineCountEl.textContent = '';
      storyStripEl.innerHTML = '';
      feedEl.innerHTML = '';
      renderArtistGroupCards();
      return;
    }
    
    if (!group) {
      activeGroupId = '';
      renderActiveCommunity();
      return;
    }
    
    activeNameEl.textContent = group.name;
    activeBioEl.textContent = group.bio;
    activeTypeEl.textContent = group.type;
    memberCountEl.textContent = `${formatCompact(group.members || 0)} ?å“¡`;
    onlineCountEl.textContent = `${formatCompact(group.online || 0)} ?¨ç?`;
    renderStories(group);
    renderFeed(group);
    renderArtistPreview(group);
    return;
  }
  
  if (joinedGroupIds.length === 0) {
    activeNameEl.textContent = 'æ­¡è?ä¾†åˆ° Weverse';
    activeBioEl.textContent = '?¢ç´¢ä¸¦å??¥ä??œæ­¡?„è?äººç¤¾ç¾¤ï??‹å?è¿½è¹¤ä»–å€‘ç??•æ?ï¼?;
    activeTypeEl.textContent = '';
    memberCountEl.textContent = '';
    onlineCountEl.textContent = '';
    storyStripEl.innerHTML = '';
    feedEl.innerHTML = `
      <div class="welcome-prompt">
        <p>?¸æ?ä½ å?æ­¡ç??äººç¤¾ç¾¤? å…¥?§ï?</p>
        <button class="primary-btn" id="welcome-explore-btn" type="button">?¢ç´¢ç¤¾ç¾¤</button>
      </div>
    `;
    return;
  }
  
  if (!group) {
    if (joinedGroupIds.length > 0) {
      activeGroupId = joinedGroupIds[0];
    } else {
      return;
    }
  }

  activeNameEl.textContent = group.name;
  activeBioEl.textContent = group.bio;
  activeTypeEl.textContent = group.type;

  memberCountEl.textContent = `${formatCompact(group.members || 0)} ?å“¡`;
  onlineCountEl.textContent = `${formatCompact(group.online || 0)} ?¨ç?`;

  renderStories(group);
  renderFeed(group);
  renderArtistPreview(group);
}

function renderArtistGroupCards() {
  if (groups.length === 0) {
    feedEl.innerHTML = `
      <div class="artist-empty-state">
        <p>å°šæœªå»ºç?ä»»ä??˜é?</p>
        <button class="primary-btn" id="create-artist-group-btn" type="button">å»ºç??°å?é«?/button>
      </div>
    `;
    return;
  }
  
  const cardsHtml = groups.map((group) => `
    <article class="artist-group-card" data-group-id="${group.id}">
      <div class="artist-card-header">
        <span class="artist-card-type">${group.type}</span>
        <h4>${group.name}</h4>
      </div>
      <p class="artist-card-bio">${group.bio}</p>
      <div class="artist-card-meta">
        <span>${formatCompact(group.members || 0)} ?å“¡</span>
        <span>${formatCompact(group.online || 0)} ?¨ç?</span>
      </div>
      <div class="artist-card-members">
        ${group.artistProfile?.members?.length > 0 
          ? `å·²è¨­å®?${group.artistProfile.members.length} ä½æ??¡` 
          : 'å°šæœªè¨­å??å“¡'}
      </div>
      <button class="delete-group-btn" data-group-id="${group.id}" type="button">
        <i class="fas fa-trash"></i>
      </button>
    </article>
  `).join('');
  
  feedEl.innerHTML = `
    <div class="artist-group-cards">${cardsHtml}</div>
    <button class="secondary-btn create-group-btn" id="create-artist-group-btn" type="button">
      <i class="fas fa-plus"></i> å»ºç??°å?é«?    </button>
  `;
}

function selectArtistGroup(groupId) {
  activeGroupId = groupId;
  renderGroupList();
  renderActiveCommunity();
}

function renderRoleUI() {
  if (isArtistMode) {
    appRootEl?.classList.add('artist-mode');
    rolePillEl.textContent = 'Artist Mode';
    postInput.placeholder = 'ä»¥è?äººèº«?†å?ç²‰çµ²?¼æ?...';
    postBtn.textContent = 'å®˜æ–¹?¼å?';
    roleToggleBtn?.setAttribute('aria-label', '?‡æ??ç?çµ²ä???);
    userSettingsBtn?.classList.add('hidden');
    artistSettingsBtn?.classList.remove('hidden');
    closeUserSettingsPage();
    closeExploreGroupsPage();
    return;
  }

  appRootEl?.classList.remove('artist-mode');
  rolePillEl.textContent = 'Fan Mode';
  postInput.placeholder = '?¨ç¤¾ç¾¤è£¡?¼å?è²¼æ?...';
  postBtn.textContent = '?¼å?';
  roleToggleBtn?.setAttribute('aria-label', '?‡æ??è?äººä???);
  userSettingsBtn?.classList.remove('hidden');
  artistSettingsBtn?.classList.add('hidden');
  closeArtistSettingsPage();
}

function openExploreGroupsPage() {
  const explorePage = document.getElementById('explore-groups-page');
  if (!explorePage) return;
  
  renderExploreGroupsList();
  appRootEl?.classList.add('show-explore');
  explorePage?.classList.remove('hidden');
  explorePage?.setAttribute('aria-hidden', 'false');
  mainViewEl?.setAttribute('aria-hidden', 'true');
}

function closeExploreGroupsPage() {
  const explorePage = document.getElementById('explore-groups-page');
  appRootEl?.classList.remove('show-explore');
  explorePage?.classList.add('hidden');
  explorePage?.setAttribute('aria-hidden', 'true');
  mainViewEl?.setAttribute('aria-hidden', 'false');
}

function renderExploreGroupsList() {
  const exploreListEl = document.getElementById('explore-groups-list');
  if (!exploreListEl) return;
  
  exploreListEl.innerHTML = groups.map((group) => {
    const isJoined = joinedGroupIds.includes(group.id);
    return `
      <article class="explore-group-item" data-group-id="${group.id}">
        <div class="explore-group-info">
          <h4>${group.name}</h4>
          <span class="explore-group-type">${group.type}</span>
          <p>${group.bio}</p>
          <div class="explore-group-meta">
            <span>${formatCompact(group.members || 0)} ?å“¡</span>
          </div>
        </div>
        <button class="${isJoined ? 'leave-btn' : 'join-btn'}" data-group-id="${group.id}" type="button">
          ${isJoined ? 'å·²å??? : '? å…¥'}
        </button>
      </article>
    `;
  }).join('');
}

function setUserSettingsStatus(text) {
  if (userSettingsStatus) {
    userSettingsStatus.textContent = text;
  }
}

function setPublicPostsStatus(text) {
  if (publicPostsStatus) {
    publicPostsStatus.textContent = text;
  }
}

function ensureViewerTargetGroup() {
  if (isArtistMode) {
    return;
  }
  
  if (joinedGroupIds.length === 0) {
    activeGroupId = '';
    return;
  }
  
  const hasActive = joinedGroupIds.includes(activeGroupId);
  if (!hasActive) {
    activeGroupId = joinedGroupIds[0] || '';
  }
}

function buildUserGroupSelect() {
  if (!userGroupSelect) return;

  const options = groups
    .filter((group) => group.id !== 'custom-viewer-group')
    .map((group) => `<option value="${group.id}">${group.name}</option>`)
    .join('');

  userGroupSelect.innerHTML = `${options}<option value="custom">?ªè??˜é?</option>`;

  if (viewerSettings.selectedGroupId === 'custom-viewer-group') {
    userGroupSelect.value = 'custom';
  } else {
    userGroupSelect.value = viewerSettings.selectedGroupId || groups[0]?.id || 'custom';
  }
}

function toggleCustomGroupFields() {
  const isCustom = userGroupSelect?.value === 'custom';
  userCustomGroupFields?.classList.toggle('hidden', !isCustom);
}

function hydrateUserSettingsPage() {
  buildUserGroupSelect();
  toggleCustomGroupFields();
  userAiSourceType.value = viewerSettings.aiSourceType || 'all';

  const customGroup = groups.find((group) => group.id === 'custom-viewer-group');
  userCustomGroupName.value = customGroup?.name || '';
  userCustomGroupType.value = customGroup?.type || 'K-POP';
  userCustomGroupBio.value = customGroup?.bio || '';
  setUserSettingsStatus('?¯èª¿?´è??‹å?é«”è? AI ?å“¡ä¾†æ?');
}

function openUserSettingsPage() {
  if (isArtistMode) return;
  closeArtistSettingsPage();
  hydrateUserSettingsPage();
  appRootEl?.classList.add('show-user-settings');
  userSettingsPage?.classList.remove('hidden');
  userSettingsPage?.setAttribute('aria-hidden', 'false');
  mainViewEl?.setAttribute('aria-hidden', 'true');
}

function closeUserSettingsPage() {
  appRootEl?.classList.remove('show-user-settings');
  userSettingsPage?.classList.add('hidden');
  userSettingsPage?.setAttribute('aria-hidden', 'true');
  mainViewEl?.setAttribute('aria-hidden', 'false');
}

function upsertCustomViewerGroup() {
  const name = userCustomGroupName.value.trim();
  if (!name) return '';

  const existing = groups.find((group) => group.id === 'custom-viewer-group');
  const payload = {
    id: 'custom-viewer-group',
    name,
    type: userCustomGroupType.value || 'K-POP',
    bio: userCustomGroupBio.value.trim() || '?ªè?è§€?‹å?é«?,
    members: 0,
    online: 0,
    artistProfile: {
      name: `${name} Official`,
      bio: userCustomGroupBio.value.trim() || '',
      aiSourceType: viewerSettings.aiSourceType || 'all',
      members: []
    },
    stories: [],
    posts: []
  };

  if (existing) {
    Object.assign(existing, payload);
  } else {
    groups.unshift(payload);
  }
  return payload.id;
}

function applyUserSettings() {
  const selected = userGroupSelect?.value || groups[0]?.id || '';
  viewerSettings.aiSourceType = userAiSourceType?.value || 'all';

  if (selected === 'custom') {
    const customId = upsertCustomViewerGroup();
    if (!customId) {
      setUserSettingsStatus('è«‹å?è¼¸å…¥?ªè??˜é??ç¨±');
      return;
    }
    viewerSettings.selectedGroupId = customId;
  } else {
    viewerSettings.selectedGroupId = selected;
  }

  ensureViewerTargetGroup();
  renderGroupList();
  renderActiveCommunity();
  scheduleSettingsSave();
  setUserSettingsStatus('å·²å??¨è??‹å?é«”è¨­å®?);
  closeUserSettingsPage();
}

function buildAIMembersBySource(sourceType) {
  const templates = {
    char: [
      { name: 'Ari', persona: 'ç´°è†©ä¸”æ??†äº«?’ç·´å¿ƒæ?' },
      { name: 'Nox', persona: '?·é?é¢¨æ ¼ï¼Œè?æ°?°¡?­æ??? }
    ],
    user: [
      { name: 'FanHost', persona: 'äº’å??Ÿå¼·ï¼Œå¸¸?è?ç²‰çµ²?™è?' },
      { name: 'Mina', persona: 'è¦ªå??ªç„¶ï¼Œå?æ­¡ç”¨?Ÿæ´»èªæ°£' }
    ],
    npc: [
      { name: 'Manager Kim', persona: '?¬å?å°å?ï¼Œè?è¨Šæ•´?†æ?æ¥? },
      { name: 'Staff Lee', persona: 'æº«å??é?ï¼Œå¸¸çµ¦æ´»?•é??? }
    ]
  };

  if (sourceType === 'all') {
    return [...templates.char, ...templates.user, ...templates.npc].map((member, idx) => ({
      ...member,
      sourceType: idx < 2 ? 'char' : idx < 4 ? 'user' : 'npc'
    }));
  }

  return (templates[sourceType] || []).map((member) => ({ ...member, sourceType }));
}

function importAIMembersToCurrentGroup() {
  const group = getActiveGroup();
  if (!group) return;
  ensureArtistProfile(group);

  const sourceType = userAiSourceType?.value || 'all';
  const imported = buildAIMembersBySource(sourceType);
  if (!imported.length) {
    setUserSettingsStatus('æ²’æ??¯å??¥ç? AI ?å“¡è³‡æ?');
    return;
  }

  imported.forEach((item, index) => {
    const exists = group.artistProfile.members.some((member) => member.name === item.name && (member.sourceType || 'char') === item.sourceType);
    if (exists) return;
    group.artistProfile.members.push({
      id: `ai-${Date.now()}-${index}`,
      name: item.name,
      sourceType: item.sourceType,
      persona: item.persona,
      avatar: item.name.slice(0, 2).toUpperCase(),
      avatarImage: ''
    });
  });

  viewerSettings.aiSourceType = sourceType;
  renderArtistPreview(group);
  scheduleSettingsSave();
  setUserSettingsStatus(`å·²å???${sourceType} ?å“¡è³‡æ?`);
}

function normalizeImportedPosts(rawItems, groupName) {
  return rawItems
    .map((item, index) => {
      if (typeof item === 'string') {
        return {
          author: `${groupName} Public`,
          text: item.trim(),
          time: 'å°å…¥',
          likes: 0,
          comments: 0
        };
      }

      if (!item || typeof item !== 'object') return null;
      const text = String(item.text || item.content || item.body || '').trim();
      if (!text) return null;

      return {
        author: String(item.author || item.writer || `${groupName} Public`),
        text,
        time: String(item.time || item.createdAt || 'å°å…¥'),
        likes: Number(item.likes || item.likeCount || 0),
        comments: Number(item.comments || item.commentCount || 0),
        _order: index
      };
    })
    .filter(Boolean);
}

function parseTextLinesToPosts(text, groupName) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({
      author: `${groupName} Public`,
      text: line,
      time: 'å°å…¥',
      likes: 0,
      comments: 0
    }));
}

async function importPublicPosts() {
  const group = getActiveGroup();
  if (!group) return;

  const url = (publicPostSourceUrlInput?.value || '').trim();
  const format = publicPostSourceFormatInput?.value || 'json';

  if (!url) {
    setPublicPostsStatus('è«‹å?å¡«å…¥?¬é?ä¾†æ? URL');
    return;
  }

  if (!/^https?:\/\//i.test(url)) {
    setPublicPostsStatus('URL ?¼å??¯èª¤ï¼Œé?ä»?http:// ??https:// ?‹é ­');
    return;
  }

  setPublicPostsStatus('å°å…¥ä¸?..');

  try {
    const response = await fetch(url);
    if (!response.ok) {
      setPublicPostsStatus(`å°å…¥å¤±æ?ï¼šHTTP ${response.status}`);
      return;
    }

    let importedPosts = [];

    if (format === 'json') {
      const data = await response.json();
      const items = Array.isArray(data) ? data : Array.isArray(data.posts) ? data.posts : [];
      importedPosts = normalizeImportedPosts(items, group.name);
    } else {
      const text = await response.text();
      importedPosts = parseTextLinesToPosts(text, group.name);
    }

    if (!importedPosts.length) {
      setPublicPostsStatus('æ²’æ??¯å??¥ç??¬é?è²¼æ?');
      return;
    }

    group.posts = [...importedPosts, ...group.posts].slice(0, 120);
    renderFeed(group);
    scheduleSettingsSave();
    setPublicPostsStatus(`å·²å???${importedPosts.length} ?‡å…¬?‹è²¼?‡`);
  } catch (error) {
    setPublicPostsStatus('å°å…¥å¤±æ?ï¼Œè?ç¢ºè?ä¾†æ??¯å…¬?‹å??–ä??¯æ´ CORS');
  }
}

function addPost() {
  const group = getActiveGroup();
  const text = postInput.value.trim();
  if (!group || !text) return;

  ensureArtistProfile(group);

  group.posts.unshift({
    author: isArtistMode ? (group.artistProfile.name || `${group.name} Official`) : 'ä½?,
    text,
    time: '?›å?',
    likes: 0,
    comments: 0
  });

  postInput.value = '';
  renderFeed(group);
}

function simulateMemberPost() {
  const group = getActiveGroup();
  if (!group || !isArtistMode) return;

  ensureArtistProfile(group);
  if (!group.artistProfile.members.length) return;

  const selectedSource = aiSourceTypeInput?.value || 'all';
  const candidateMembers = selectedSource === 'all'
    ? group.artistProfile.members
    : group.artistProfile.members.filter((member) => (member.sourceType || 'char') === selectedSource);

  if (!candidateMembers.length) return;

  const member = randomFrom(candidateMembers);
  const moodText = member.persona ? `ï¼?{member.persona.split('ï¼?)[0]}ï¼‰` : '';
  const text = `${randomFrom(aiPostStarters)} ${moodText}ï¼?{randomFrom(aiPostClosers)}?‚`;

  group.posts.unshift({
    author: `${member.name} Â· ${group.artistProfile.name}`,
    text,
    time: '?›å?',
    likes: Math.floor(Math.random() * 80),
    comments: Math.floor(Math.random() * 20)
  });

  renderFeed(group);
}

function resetCommunities() {
  groups = [];
  activeGroupId = '';
  saveArtistGroups();
  renderGroupList();
  renderActiveCommunity();
  if (!artistSettingsPage?.classList.contains('hidden')) {
    closeArtistSettingsPage();
  }
}

function syncSettingsDraftToGroup() {
  const group = getActiveGroup();
  if (!group) return;
  ensureArtistProfile(group);

  const customName = artistGroupNameInput.value.trim();
  const customBio = artistGroupBioInput.value.trim();

  group.artistProfile.name = customName || `${group.name} Official`;
  group.artistProfile.bio = customBio;
  group.artistProfile.aiSourceType = aiSourceTypeInput?.value || 'all';

  if (typeof customBio === 'string') {
    group.bio = customBio || group.bio;
  }

  renderGroupList();
  renderArtistPreview(group);
}

function toggleRoleMode() {
  isArtistMode = !isArtistMode;
  renderRoleUI();
  ensureViewerTargetGroup();
  renderActiveCommunity();
}

function hydrateSettingsPage(group) {
  ensureArtistProfile(group);
  artistGroupNameInput.value = group.artistProfile.name || '';
  artistGroupBioInput.value = group.artistProfile.bio || '';
  aiSourceTypeInput.value = group.artistProfile.aiSourceType || 'all';
  newMemberSourceTypeInput.value = 'char';
  resetAvatarUploadPreview();
  renderMemberEditorList(group);
}

function openArtistSettingsPage() {
  if (!isArtistMode) return;
  const group = getActiveGroup();
  if (!group) return;

  closeUserSettingsPage();
  hydrateSettingsPage(group);
  appRootEl?.classList.add('show-settings');
  artistSettingsPage?.classList.remove('hidden');
  artistSettingsPage?.setAttribute('aria-hidden', 'false');
  mainViewEl?.setAttribute('aria-hidden', 'true');
}

function closeArtistSettingsPage() {
  appRootEl?.classList.remove('show-settings');
  artistSettingsPage?.classList.add('hidden');
  artistSettingsPage?.setAttribute('aria-hidden', 'true');
  mainViewEl?.setAttribute('aria-hidden', 'false');
}

function resetAvatarUploadPreview() {
  pendingAvatarImageData = '';
  if (newMemberAvatarFileInput) {
    newMemberAvatarFileInput.value = '';
  }
  if (avatarUploadPreviewEl) {
    avatarUploadPreviewEl.classList.remove('has-image');
    avatarUploadPreviewEl.style.backgroundImage = '';
    avatarUploadPreviewEl.textContent = '?ªä??³é ­è²?;
  }
}

function handleAvatarFileChange() {
  const file = newMemberAvatarFileInput?.files?.[0];
  if (!file) {
    resetAvatarUploadPreview();
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    pendingAvatarImageData = typeof reader.result === 'string' ? reader.result : '';
    if (!pendingAvatarImageData) return;
    avatarUploadPreviewEl.classList.add('has-image');
    avatarUploadPreviewEl.style.backgroundImage = `url('${pendingAvatarImageData}')`;
    avatarUploadPreviewEl.textContent = 'å·²ä???;
  };
  reader.readAsDataURL(file);
}

function addMemberToActiveGroup() {
  const group = getActiveGroup();
  if (!group) return;
  ensureArtistProfile(group);

  const name = newMemberNameInput.value.trim();
  const sourceType = newMemberSourceTypeInput.value;
  const persona = newMemberPersonaInput.value.trim();
  const avatar = newMemberAvatarInput.value.trim();
  if (!name) return;

  group.artistProfile.members.push({
    id: `member-${Date.now()}`,
    name,
    sourceType: sourceType || 'char',
    persona,
    avatar: (avatar || name).slice(0, 2),
    avatarImage: pendingAvatarImageData || ''
  });

  newMemberNameInput.value = '';
  newMemberPersonaInput.value = '';
  newMemberAvatarInput.value = '';
  newMemberSourceTypeInput.value = 'char';
  resetAvatarUploadPreview();

  renderMemberEditorList(group);
  renderArtistPreview(group);
  scheduleSettingsSave();
}

function removeMemberFromActiveGroup(memberId) {
  const group = getActiveGroup();
  if (!group || !memberId) return;
  ensureArtistProfile(group);
  group.artistProfile.members = group.artistProfile.members.filter((member) => member.id !== memberId);
  renderMemberEditorList(group);
  renderArtistPreview(group);
  scheduleSettingsSave();
}

function saveArtistSettings() {
  syncSettingsDraftToGroup();
  saveSettingsToStorage();
  renderActiveCommunity();
  closeArtistSettingsPage();
}

loadSettingsFromStorage();
loadJoinedGroups();
groups = loadArtistGroups();

function openCreateGroupModal() {
  const existing = document.getElementById('create-group-modal');
  if (existing) return;
  
  const modal = document.createElement('div');
  modal.id = 'create-group-modal';
  modal.className = 'create-group-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>å»ºç??°å?é«?/h3>
      <label>
        <span>?˜é??ç¨±</span>
        <input type="text" id="new-group-name" placeholder="ä¾‹å?ï¼šLUMEN">
      </label>
      <label>
        <span>é¡å?</span>
        <select id="new-group-type">
          <option value="K-POP">K-POP</option>
          <option value="J-POP">J-POP</option>
          <option value="Band">Band</option>
          <option value="Solo">Solo</option>
          <option value="Creator">Creator</option>
        </select>
      </label>
      <label>
        <span>ç°¡ä?</span>
        <textarea id="new-group-bio" rows="2" placeholder="è¼¸å…¥?˜é?ä»‹ç´¹"></textarea>
      </label>
      <div class="modal-actions">
        <button class="secondary-btn" id="cancel-create-group" type="button">?–æ?</button>
        <button class="primary-btn" id="confirm-create-group" type="button">å»ºç?</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  modal.querySelector('#cancel-create-group')?.addEventListener('click', () => {
    modal.remove();
  });
  
  modal.querySelector('#confirm-create-group')?.addEventListener('click', () => {
    const name = modal.querySelector('#new-group-name')?.value.trim();
    const type = modal.querySelector('#new-group-type')?.value;
    const bio = modal.querySelector('#new-group-bio')?.value.trim();
    
    if (!name) {
      alert('è«‹è¼¸?¥å?é«”å?ç¨?);
      return;
    }
    
    const newGroup = createArtistGroup(name, type, bio);
    modal.remove();
    renderActiveCommunity();
    selectArtistGroup(newGroup.id);
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

function bindEvents() {
  groupListEl?.addEventListener('click', (event) => {
    const exploreBtn = event.target.closest('#explore-groups-btn');
    if (exploreBtn) {
      openExploreGroupsPage();
      return;
    }
    
    const backBtn = event.target.closest('#artist-back-to-cards-btn');
    if (backBtn) {
      activeGroupId = '';
      renderGroupList();
      renderActiveCommunity();
      return;
    }
    
    const button = event.target.closest('.group-chip');
    if (!button) return;
    activeGroupId = button.dataset.groupId || activeGroupId;
    renderGroupList();
    renderActiveCommunity();
    const active = getActiveGroup();
    if (active && !artistSettingsPage?.classList.contains('hidden')) {
      hydrateSettingsPage(active);
    }
  });

  feedEl?.addEventListener('click', (event) => {
    const joinBtn = event.target.closest('.join-group-btn');
    if (joinBtn) {
      const groupId = joinBtn.dataset.groupId;
      if (groupId) {
        joinGroup(groupId);
        renderGroupList();
        renderActiveCommunity();
      }
      return;
    }
    
    const artistCard = event.target.closest('.artist-group-card');
    if (artistCard && isArtistMode) {
      const groupId = artistCard.dataset.groupId;
      if (groupId) {
        selectArtistGroup(groupId);
      }
      return;
    }
    
    const createGroupBtn = event.target.closest('#create-artist-group-btn');
    if (createGroupBtn) {
      openCreateGroupModal();
      return;
    }
    
    const deleteGroupBtn = event.target.closest('.delete-group-btn');
    if (deleteGroupBtn) {
      const groupId = deleteGroupBtn.dataset.groupId;
      if (groupId && confirm('ç¢ºå?è¦åˆª?¤æ­¤?˜é??ï?')) {
        deleteArtistGroup(groupId);
        renderActiveCommunity();
      }
      return;
    }
  });

  document.addEventListener('click', (event) => {
    const exploreBackBtn = event.target.closest('#explore-groups-back');
    if (exploreBackBtn) {
      closeExploreGroupsPage();
      return;
    }
    
    const joinBtn = event.target.closest('.join-btn');
    if (joinBtn) {
      const groupId = joinBtn.dataset.groupId;
      if (groupId) {
        joinGroup(groupId);
        renderExploreGroupsList();
        renderGroupList();
        renderActiveCommunity();
      }
      return;
    }
    
    const leaveBtn = event.target.closest('.leave-btn');
    if (leaveBtn) {
      const groupId = leaveBtn.dataset.groupId;
      if (groupId) {
        leaveGroup(groupId);
        renderExploreGroupsList();
        renderGroupList();
        if (activeGroupId === groupId) {
          activeGroupId = joinedGroupIds[0] || '';
        }
        renderActiveCommunity();
      }
      return;
    }
    
    const welcomeExploreBtn = event.target.closest('#welcome-explore-btn');
    if (welcomeExploreBtn) {
      openExploreGroupsPage();
      return;
    }
  });

  postBtn?.addEventListener('click', addPost);
  postInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addPost();
    }
  });

  simulateMemberPostBtn?.addEventListener('click', simulateMemberPost);

  roleToggleBtn?.addEventListener('click', toggleRoleMode);
  userSettingsBtn?.addEventListener('click', openUserSettingsPage);
  artistSettingsBtn?.addEventListener('click', openArtistSettingsPage);
  resetBtn?.addEventListener('click', resetCommunities);

  userSettingsBack?.addEventListener('click', closeUserSettingsPage);
  userSettingsApply?.addEventListener('click', applyUserSettings);
  userGroupSelect?.addEventListener('change', toggleCustomGroupFields);
  importAiMembersBtn?.addEventListener('click', importAIMembersToCurrentGroup);
  importPublicPostsBtn?.addEventListener('click', importPublicPosts);

  artistSettingsBack?.addEventListener('click', closeArtistSettingsPage);
  artistSettingsSave?.addEventListener('click', saveArtistSettings);
  exportSettingsBtn?.addEventListener('click', exportSettingsBackup);
  addMemberBtn?.addEventListener('click', addMemberToActiveGroup);
  newMemberAvatarFileInput?.addEventListener('change', handleAvatarFileChange);

  artistGroupNameInput?.addEventListener('input', () => {
    syncSettingsDraftToGroup();
    scheduleSettingsSave();
  });
  artistGroupBioInput?.addEventListener('input', () => {
    syncSettingsDraftToGroup();
    scheduleSettingsSave();
  });
  aiSourceTypeInput?.addEventListener('change', () => {
    syncSettingsDraftToGroup();
    scheduleSettingsSave();
  });

  memberEditorListEl?.addEventListener('click', (event) => {
    const button = event.target.closest('.remove-member-btn');
    if (!button) return;
    removeMemberFromActiveGroup(button.dataset.removeMemberId);
  });
}

ensureViewerTargetGroup();
renderGroupList();
renderActiveCommunity();
renderRoleUI();
bindEvents();

function loadCharactersFromSettings() {
  if (typeof SxSettings === 'undefined') return;
  const chars = SxSettings.getCharacters();
  const users = SxSettings.getUsers();
  const npcs = SxSettings.getNpcs();
  const apis = SxSettings.getApiConfigs();
  
  if (chars.length > 0) {
    console.log('[weverse] Loaded characters from settings:', chars.length);
  }
  if (users.length > 0) {
    console.log('[weverse] Loaded users from settings:', users.length);
  }
  if (npcs.length > 0) {
    console.log('[weverse] Loaded NPCs from settings:', npcs.length);
  }
  if (apis.length > 0) {
    console.log('[weverse] Loaded API configs from settings:', apis.length);
  }
  
  return { chars, users, npcs, apis };
}

function getCharPersonaForWeverse(charName) {
  if (typeof SxSettings === 'undefined') return null;
  const char = SxSettings.getCharByName(charName);
  if (char) {
    return {
      name: char.name,
      persona: char.personality || char.persona || '',
      avatar: char.avatar || '',
      background: char.background || ''
    };
  }
  return null;
}

window.getSxSettingsForWeverse = function() {
  if (typeof SxSettings === 'undefined') return null;
  return SxSettings.getSettingsSnapshot();
};

function getWeverseWorldbookData() {
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

function getWeverseWorldbookContext() {
  const data = getWeverseWorldbookData();
  const entries = [];
  for (const [cat, list] of Object.entries(data)) {
    if (list && list.length > 0) {
      list.slice(0, 5).forEach(e => {
        if (e.title && e.content) {
          entries.push(`??{e.title}??{e.content.slice(0, 200)}`);
        }
      });
    }
  }
  return entries.length > 0 ? entries.join('\n') : '?¡ä??Œæ›¸è¨­å?';
}

function getWeverseCharacterData(name) {
  if (!name) return null;
  const raw = localStorage.getItem('sx_characters');
  if (!raw) return null;
  try {
    const list = JSON.parse(raw);
    return list.find(c => c.name === name) || null;
  } catch {
    return null;
  }
}

function getWeverseActiveCharacter() {
  const activeName = localStorage.getItem('sx_char_name');
  return getWeverseCharacterData(activeName);
}

function getWeverseUserData() {
  return {
    name: localStorage.getItem('sx_user_name') || 'User',
    personality: localStorage.getItem('sx_user_personality') || '',
    background: localStorage.getItem('sx_user_background') || ''
  };
}

function getWeverseChatHistory(limit = 15) {
  const raw = localStorage.getItem('sx_chat_history');
  if (!raw) return [];
  try {
    const history = JSON.parse(raw);
    return history.slice(-limit);
  } catch {
    return [];
  }
}

function getWeverseChatHistoryContext() {
  const history = getWeverseChatHistory(15);
  if (history.length === 0) return '?¡è?å¤©è???;
  const user = getWeverseUserData();
  return history.map(msg => {
    const role = msg.role === 'user' ? user.name : 'è§’è‰²';
    return `${role}: ${msg.content.slice(0, 100)}`;
  }).join('\n');
}

function getWeverseApiConfig() {
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

async function callWeverseAIAPI(messages, temperature = 0.85) {
  const config = getWeverseApiConfig();
  if (!config || !config.url) {
    throw new Error('å°šæœªè¨­å? API');
  }

  const apiType = config.type || 'openai';
  
  // Gemini ?Ÿç? API ?¼å?
  if (apiType === 'gemini') {
    const model = config.model || 'gemini-1.5-flash';
    const targetUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + config.key;
    
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
      throw new Error('Gemini API ?¯èª¤ (' + response.status + ')');
    }
    
    const data = await response.json();
    if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
  
  // OpenAI ?¸å®¹?¼å??–è‡ªè¨‚ç«¯é»?  let endpoint;
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
    throw new Error(`API ?¯èª¤ (${response.status})`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

function buildWeverseContext() {
  const user = getWeverseUserData();
  const char = getWeverseActiveCharacter();
  const worldbook = getWeverseWorldbookContext();
  const chatHistory = getWeverseChatHistoryContext();

  let context = `# ä½¿ç”¨?…è¨­å®š\n?ç¨±: ${user.name}\n`;
  if (user.personality) context += `?§æ ¼: ${user.personality}\n`;
  if (user.background) context += `?Œæ™¯: ${user.background}\n`;

  if (char) {
    context += `\n# è§’è‰²è¨­å?\n?ç¨±: ${char.name}\n`;
    if (char.personality) context += `?§æ ¼: ${char.personality}\n`;
    if (char.background) context += `?Œæ™¯: ${char.background}\n`;
  }

  context += `\n# ä¸–ç??¸\n${worldbook}\n`;

  if (chatHistory !== '?¡è?å¤©è???) {
    context += `\n# è¿‘æ?å°è©±\n${chatHistory}\n`;
  }

  return context;
}

let isGeneratingWeversePosts = false;

async function generateWeverseAIPosts() {
  if (isGeneratingWeversePosts) {
    alert('æ­?œ¨?Ÿæ?ä¸­ï?è«‹ç???..');
    return;
  }

  isGeneratingWeversePosts = true;

  try {
    const group = getActiveGroup();
    if (!group) {
      alert('è«‹å??¸æ?ä¸€?‹ç¤¾ç¾?);
      return;
    }

    const context = buildWeverseContext();
    const lang = localStorage.getItem('sxiphone_lang') || 'zh-TW';

    const systemPrompt = `ä½ æ˜¯ä¸€ä½?K-POP ç¤¾ç¾¤?§å®¹?µä??…ï??…é•·?¹æ?è§’è‰²è¨­å??Œä½¿?¨è€…è??¯å‰µä½œç¬¦?ˆäºº?©æ€§æ ¼?„ç¤¾ç¾¤è²¼?‡ã€?è«‹ä½¿??${window.getAIReadableLangName?.(lang) || 'ç¹é?ä¸­æ?'} ?°å¯«??è¼¸å‡º?¼å???JSON: {"posts": [{"author": "ä½œè€…å?ç¨?, "text": "è²¼æ??§å®¹", "likes": ?¨æ?è®šæ•¸, "comments": ?¨æ??™è??¸}]}`;

    const prompt = `${context}

ç¤¾ç¾¤: ${group.name}
è«‹ç???3 ??Weverse ç¤¾ç¾¤è²¼æ?ï¼Œè?æ±‚ï?
1. ç¬¦å?è§’è‰²?§æ ¼?Œä½¿?¨è€…è¨­å®?2. ?ªç„¶?å…¥ä¸–ç??¸è¨­å®?3. ?¯ä»¥?¯è?äººç™¼?‡æ?ç²‰çµ²?™è?é¢¨æ ¼
4. èªæ°£è¦ªå??æ?äº’å???
è¼¸å‡º JSON ?¼å??‚`;

    const result = await callWeverseAIAPI([
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

    posts.forEach(post => {
      if (post.text) {
        group.posts.unshift({
          author: post.author || 'AI ?§å®¹',
          text: post.text,
          time: '?›å?',
          likes: post.likes || Math.floor(Math.random() * 100),
          comments: post.comments || Math.floor(Math.random() * 30)
        });
      }
    });

    if (posts.length > 0) {
      renderFeed(group);
      scheduleSettingsSave();
    } else {
      alert('?Ÿæ?å¤±æ?ï¼Œè?ç¨å??è©¦');
    }
  } catch (err) {
    alert(`?Ÿæ?å¤±æ?: ${err.message}`);
  } finally {
    isGeneratingWeversePosts = false;
  }
}

document.addEventListener('click', (event) => {
  if (event.target.closest('#ai-generate-weverse-btn')) {
    generateWeverseAIPosts();
  }
});

const storyViewerEl = document.getElementById('story-viewer');
const storyViewerAvatar = document.getElementById('story-viewer-avatar');
const storyViewerName = document.getElementById('story-viewer-name');
const storyViewerTime = document.getElementById('story-viewer-time');
const storyViewerContent = document.getElementById('story-viewer-content');
const storyViewerClose = document.getElementById('story-viewer-close');
const storyProgressFill = document.getElementById('story-progress-fill');

let storyProgressTimer = null;

function openStoryViewer(storyName, storyId) {
  const group = getActiveGroup();
  if (!group) return;
  
  ensureArtistProfile(group);
  const member = group.artistProfile.members.find(m => m.id === storyId || m.name === storyName);
  const memberPosts = group.posts.filter(p => p.author && p.author.includes(storyName));
  const latestPost = memberPosts[0];
  
  if (!latestPost) {
    return;
  }
  
  if (member?.avatarImage) {
    storyViewerAvatar.style.backgroundImage = `url('${member.avatarImage}')`;
    storyViewerAvatar.textContent = '';
  } else {
    storyViewerAvatar.style.backgroundImage = '';
    storyViewerAvatar.textContent = member?.avatar || storyName.slice(0, 2).toUpperCase();
  }
  
  storyViewerName.textContent = storyName;
  storyViewerTime.textContent = latestPost.time || '?›å?';
  
  storyViewerContent.innerHTML = `
    <div class="story-viewer-text">
      <p>${latestPost.text}</p>
      <div class="story-author">ä¾†è‡ª ${latestPost.author}</div>
    </div>
  `;
  
  storyViewerEl?.classList.add('active');
  
  startStoryProgress();
}

function closeStoryViewer() {
  storyViewerEl?.classList.remove('active');
  stopStoryProgress();
}

function startStoryProgress() {
  if (storyProgressTimer) clearInterval(storyProgressTimer);
  
  let progress = 0;
  storyProgressFill.style.width = '0%';
  
  storyProgressTimer = setInterval(() => {
    progress += 2;
    storyProgressFill.style.width = `${progress}%`;
    
    if (progress >= 100) {
      closeStoryViewer();
    }
  }, 100);
}

function stopStoryProgress() {
  if (storyProgressTimer) {
    clearInterval(storyProgressTimer);
    storyProgressTimer = null;
  }
}

storyStripEl?.addEventListener('click', (event) => {
  const storyItem = event.target.closest('.story-item');
  if (!storyItem) return;
  
  const storyId = storyItem.dataset.storyId;
  const storyName = storyItem.dataset.storyName;
  
  if (storyId && storyName) {
    openStoryViewer(storyName, storyId);
  }
});

storyViewerClose?.addEventListener('click', closeStoryViewer);

storyViewerEl?.addEventListener('click', (event) => {
  if (event.target === storyViewerEl) {
    closeStoryViewer();
  }
});

loadCharactersFromSettings();
console.log('Loaded app: weverse');
