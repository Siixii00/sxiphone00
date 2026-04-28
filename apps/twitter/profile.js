const PROFILE_KEY = 'sx_twitter_profile';
const USER_TWEETS_KEY = 'sx_twitter_user_tweets';

function getDefaultProfile() {
  const userName = localStorage.getItem('sx_user_name') || 'User';
  return {
    name: userName,
    handle: '@' + userName.toLowerCase().replace(/\s+/g, '_'),
    bio: '',
    avatarGradient: 'linear-gradient(135deg, #2d89ef, #8ec5ff)'
  };
}

function getProfile() {
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return getDefaultProfile();
  try {
    return { ...getDefaultProfile(), ...JSON.parse(raw) };
  } catch {
    return getDefaultProfile();
  }
}

function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function getUserTweets() {
  const raw = localStorage.getItem(USER_TWEETS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}

function deleteUserTweet(timestamp) {
  let tweets = getUserTweets();
  tweets = tweets.filter(t => t.timestamp !== timestamp);
  localStorage.setItem(USER_TWEETS_KEY, JSON.stringify(tweets));
  renderMyTweets();
}

const avatarGradients = [
  'linear-gradient(135deg, #2d89ef, #8ec5ff)',
  'linear-gradient(135deg, #f093fb, #f5576c)',
  'linear-gradient(135deg, #4facfe, #00f2fe)',
  'linear-gradient(135deg, #43e97b, #38f9d7)',
  'linear-gradient(135deg, #fa709a, #fee140)',
  'linear-gradient(135deg, #a18cd1, #fbc2eb)',
  'linear-gradient(135deg, #ff9a9e, #fecfef)',
  'linear-gradient(135deg, #667eea, #764ba2)',
  'linear-gradient(135deg, #f6d365, #fda085)',
  'linear-gradient(135deg, #89f7fe, #66a6ff)',
  'linear-gradient(135deg, #cd9cf2, #f6f3ff)',
  'linear-gradient(135deg, #37ecba, #72afd3)'
];

function showAvatarPicker() {
  const profile = getProfile();
  const currentGradient = profile.avatarGradient || avatarGradients[0];
  
  const pickerHtml = `
    <div class="avatar-picker-overlay" id="avatar-picker-overlay">
      <div class="avatar-picker-modal">
        <div class="avatar-picker-header">
          <span>選擇頭貼</span>
          <button class="icon-btn" id="avatar-picker-close"><i class="fas fa-times"></i></button>
        </div>
        <div class="avatar-picker-preview" id="avatar-picker-preview" style="background: ${currentGradient}"></div>
        <div class="avatar-picker-grid">
          ${avatarGradients.map((g, i) => `
            <div class="avatar-picker-option ${g === currentGradient ? 'selected' : ''}" 
                 data-gradient="${g}" 
                 style="background: ${g}"></div>
          `).join('')}
        </div>
        <button class="primary-btn" id="avatar-picker-confirm">確認</button>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', pickerHtml);
  
  const overlay = document.getElementById('avatar-picker-overlay');
  const preview = document.getElementById('avatar-picker-preview');
  const options = overlay.querySelectorAll('.avatar-picker-option');
  const confirmBtn = document.getElementById('avatar-picker-confirm');
  const closeBtn = document.getElementById('avatar-picker-close');
  
  let selectedGradient = currentGradient;
  
  options.forEach(opt => {
    opt.addEventListener('click', () => {
      options.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedGradient = opt.dataset.gradient;
      preview.style.background = selectedGradient;
    });
  });
  
  confirmBtn.addEventListener('click', () => {
    const profile = getProfile();
    profile.avatarGradient = selectedGradient;
    saveProfile(profile);
    updateProfileAvatar(selectedGradient);
    overlay.remove();
  });
  
  closeBtn.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

function updateProfileAvatar(gradient) {
  const avatar = document.getElementById('profile-avatar');
  if (avatar) {
    avatar.style.background = gradient;
  }
}

function loadProfileForm() {
  const profile = getProfile();
  
  const nameInput = document.getElementById('profile-name');
  const handleInput = document.getElementById('profile-handle');
  const bioInput = document.getElementById('profile-bio');
  const avatar = document.getElementById('profile-avatar');
  
  if (nameInput) nameInput.value = profile.name;
  if (handleInput) handleInput.value = profile.handle;
  if (bioInput) bioInput.value = profile.bio || '';
  if (avatar) avatar.style.background = profile.avatarGradient || avatarGradients[0];
}

function saveProfileForm() {
  const nameInput = document.getElementById('profile-name');
  const handleInput = document.getElementById('profile-handle');
  const bioInput = document.getElementById('profile-bio');
  
  const profile = getProfile();
  profile.name = nameInput?.value?.trim() || profile.name;
  profile.handle = handleInput?.value?.trim() || profile.handle;
  profile.bio = bioInput?.value?.trim() || '';
  
  saveProfile(profile);
  
  const saveBtn = document.getElementById('profile-save-btn');
  if (saveBtn) {
    saveBtn.innerHTML = '<i class="fas fa-check"></i> 已儲存';
    setTimeout(() => {
      saveBtn.innerHTML = '<i class="fas fa-save"></i> 儲存個人資料';
    }, 1500);
  }
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('zh-TW', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function renderMyTweets() {
  const container = document.getElementById('my-tweets-list');
  if (!container) return;
  
  const tweets = getUserTweets();
  const profile = getProfile();
  
  if (tweets.length === 0) {
    container.innerHTML = '<div class="empty-state">尚未發布任何推文</div>';
    return;
  }
  
  container.innerHTML = tweets.map(tweet => `
    <article class="tweet my-tweet-item" data-timestamp="${tweet.timestamp}">
      <div class="avatar" style="background: ${profile.avatarGradient || avatarGradients[0]}"></div>
      <div>
        <div class="tweet-header">
          <div>
            <span class="tweet-author">${tweet.author}</span>
            <span>${tweet.handle} · ${formatTime(tweet.timestamp)}</span>
          </div>
          <button class="delete-tweet-btn" data-timestamp="${tweet.timestamp}" aria-label="刪除推文">
            <i class="fas fa-trash"></i>
          </button>
        </div>
        <div class="tweet-body">${tweet.content}</div>
        <div class="tweet-actions">
          <button type="button"><i class="far fa-comment"></i><span>${tweet.stats?.reply || 0}</span></button>
          <button type="button"><i class="fas fa-retweet"></i><span>${tweet.stats?.retweet || 0}</span></button>
          <button type="button"><i class="far fa-heart"></i><span>${tweet.stats?.like || 0}</span></button>
        </div>
      </div>
    </article>
  `).join('');
  
  container.querySelectorAll('.delete-tweet-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const timestamp = parseFloat(btn.dataset.timestamp);
      if (confirm('確定要刪除這則推文嗎？')) {
        deleteUserTweet(timestamp);
      }
    });
  });
}

function initProfile() {
  loadProfileForm();
  renderMyTweets();
  
  const avatarEditBtn = document.getElementById('avatar-edit-btn');
  if (avatarEditBtn) {
    avatarEditBtn.addEventListener('click', showAvatarPicker);
  }
  
  const saveBtn = document.getElementById('profile-save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveProfileForm);
  }
}

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
              (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

function saveProfileOnExit() {
  const nameInput = document.getElementById('profile-name');
  const handleInput = document.getElementById('profile-handle');
  const bioInput = document.getElementById('profile-bio');
  
  if (nameInput || handleInput || bioInput) {
    const profile = getProfile();
    if (nameInput?.value?.trim()) profile.name = nameInput.value.trim();
    if (handleInput?.value?.trim()) profile.handle = handleInput.value.trim();
    if (bioInput?.value?.trim()) profile.bio = bioInput.value.trim();
    saveProfile(profile);
  }
}

if (isIOS) {
  window.addEventListener('pagehide', saveProfileOnExit);
  window.addEventListener('pageshow', loadProfileForm);
}

window.addEventListener('pagehide', saveProfileOnExit);
window.addEventListener('beforeunload', saveProfileOnExit);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    saveProfileOnExit();
  }
});

window.addEventListener('message', (event) => {
  const data = event.data;
  if (data?.type === 'APP_WILL_CLOSE') {
    saveProfileOnExit();
  }
});

document.addEventListener('DOMContentLoaded', initProfile);
