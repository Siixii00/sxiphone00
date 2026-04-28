const ARCADE_GUEST_KEY = 'sx_arcade_guest';
const ArcadeInvite = {
  modal: null,
  selectedCharacter: null
};

function loadAllCharacters() {
  const characters = JSON.parse(localStorage.getItem('sx_characters') || '[]');
  const masks = JSON.parse(localStorage.getItem('sx_masks') || '[]');
  const allChars = [...characters, ...masks];
  return allChars.filter(c => c && c.name && c.name !== '預設用戶');
}

function showCharacterSelectModal() {
  const characters = loadAllCharacters();
  
  if (characters.length === 0) {
    alert('沒有可邀請的角色。請先在設定中建立角色。');
    return;
  }
  
  ArcadeInvite.selectedCharacter = null;
  
  const modalHtml = `
    <div class="arcade-invite-modal" id="arcade-invite-modal">
      <div class="arcade-invite-content">
        <div class="arcade-invite-header">
          <h3><i class="fas fa-user-friends"></i> 邀請角色一起玩</h3>
          <button class="arcade-invite-close" onclick="closeArcadeInviteModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="arcade-invite-characters">
          ${characters.map(char => `
            <div class="arcade-char-option" data-char-name="${char.name}" onclick="selectArcadeCharacter('${char.name}', '${char.avatar || ''}', '${char.personality || ''}', '${char.background || ''}')">
              <div class="arcade-char-avatar">
                ${char.avatar ? `<img src="${char.avatar}" alt="${char.name}">` : `<i class="fas fa-user"></i>`}
              </div>
              <div class="arcade-char-name">${char.name}</div>
            </div>
          `).join('')}
        </div>
        <div class="arcade-invite-actions">
          <button class="arcade-invite-btn" id="arcade-send-invite-btn" onclick="sendArcadeInvite()" disabled>
            <i class="fas fa-paper-plane"></i> 發送邀請
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  ArcadeInvite.modal = document.getElementById('arcade-invite-modal');
}

function closeArcadeInviteModal() {
  if (ArcadeInvite.modal) {
    ArcadeInvite.modal.remove();
    ArcadeInvite.modal = null;
  }
  ArcadeInvite.selectedCharacter = null;
}

function selectArcadeCharacter(name, avatar, personality, background) {
  ArcadeInvite.selectedCharacter = {
    name: name,
    avatar: avatar,
    personality: personality,
    background: background
  };
  
  document.querySelectorAll('.arcade-char-option').forEach(el => {
    el.classList.remove('selected');
  });
  
  const selectedEl = document.querySelector(`.arcade-char-option[data-char-name="${name}"]`);
  if (selectedEl) {
    selectedEl.classList.add('selected');
  }
  
  const sendBtn = document.getElementById('arcade-send-invite-btn');
  if (sendBtn) {
    sendBtn.disabled = false;
  }
}

function sendArcadeInvite() {
  if (!ArcadeInvite.selectedCharacter) {
    alert('請先選擇一個角色');
    return;
  }
  
  const charData = ArcadeInvite.selectedCharacter;
  
  window.parent.postMessage({
    type: 'openApp',
    appId: 'chat'
  }, '*');
  
  setTimeout(() => {
    window.parent.postMessage({
      type: 'ARCADE_INVITE',
      payload: {
        charName: charData.name,
        charAvatar: charData.avatar,
        charPersonality: charData.personality,
        charBackground: charData.background,
        timestamp: Date.now()
      }
    }, '*');
  }, 500);
  
  closeArcadeInviteModal();
  
  console.log('[ArcadeInvite] 邀請已發送:', charData.name);
}

function loadArcadeGuest() {
  const saved = localStorage.getItem(ARCADE_GUEST_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.warn('[ArcadeInvite] 解析已保存的 guest 失敗:', e);
    }
  }
  return null;
}

function saveArcadeGuest(charData, position) {
  localStorage.setItem(ARCADE_GUEST_KEY, JSON.stringify({
    ...charData,
    position: position || { x: window.innerWidth - 100, y: window.innerHeight - 200 },
    joinedAt: Date.now()
  }));
}

function clearArcadeGuest() {
  localStorage.removeItem(ARCADE_GUEST_KEY);
}

window.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;
  
  if (data.type === 'ARCADE_INVITE_ACCEPTED' && data.payload) {
    console.log('[ArcadeInvite] 收到邀請接受:', data.payload);
    
    const charData = data.payload;
    
    if (window.arcadeAvatar) {
      window.arcadeAvatar.remove();
    }
    
    window.arcadeAvatar = new ArcadeAvatar(charData);
    window.arcadeAvatar.render();
    
    saveArcadeGuest(charData, window.arcadeAvatar.position);
    
    if (window.characterDialogue) {
      window.characterDialogue.showDialogue('gameStart', { gameName: '街機廳' });
    }
  }
  
  if (data.type === 'ARCADE_INVITE_REJECTED') {
    console.log('[ArcadeInvite] 邀請被婉拒');
    alert('角色婉拒了邀請');
  }
});

window.addEventListener('beforeunload', () => {
  clearArcadeGuest();
});

function initArcadeInvite() {
  const savedGuest = loadArcadeGuest();
  if (savedGuest) {
    const joinedAt = savedGuest.joinedAt || 0;
    const now = Date.now();
    if (now - joinedAt < 30 * 60 * 1000) {
      window.arcadeAvatar = new ArcadeAvatar(savedGuest);
      window.arcadeAvatar.render();
      console.log('[ArcadeInvite] 已恢復之前的 guest:', savedGuest.name);
    } else {
      clearArcadeGuest();
    }
  }
}

window.ArcadeInvite = ArcadeInvite;
window.showCharacterSelectModal = showCharacterSelectModal;
window.closeArcadeInviteModal = closeArcadeInviteModal;
window.selectArcadeCharacter = selectArcadeCharacter;
window.sendArcadeInvite = sendArcadeInvite;
window.initArcadeInvite = initArcadeInvite;