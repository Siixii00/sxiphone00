const ARCADE_GUEST_KEY = 'sx_arcade_guest';
const ArcadeInvite = {
  modal: null,
  selectedCharacter: null
};

function loadAllCharacters() {
  const characters = JSON.parse(localStorage.getItem('sx_characters') || '[]');
  const masks = JSON.parse(localStorage.getItem('sx_masks') || '[]');
  const npcs = JSON.parse(localStorage.getItem('sx_npcs') || '[]');
  const allChars = [...characters, ...masks, ...npcs];
  return allChars.filter(c => c && c.name && c.name !== '預設用戶');
}

function showCharacterSelectModal() {
  const characters = loadAllCharacters();
  
  if (characters.length === 0) {
    alert('沒有可邀請的角色。請先在設定中建立角色。');
    return;
  }
  
  ArcadeInvite.selectedCharacter = null;
  
  // 取得已保存的外觀設定
  const savedPlayerSprite = localStorage.getItem('sx_arcade_player_sprite') || 'default';
  const savedCharSprite = localStorage.getItem('sx_arcade_char_sprite') || 'default';
  
  const spriteOptions = [
    { id: 'default', name: '預設', icon: 'fa-user', colors: { body: '#4ade80', outline: '#166534' } },
    { id: 'blue', name: '藍色', icon: 'fa-user', colors: { body: '#3b82f6', outline: '#1d4ed8' } },
    { id: 'purple', name: '紫色', icon: 'fa-user', colors: { body: '#a855f7', outline: '#7c3aed' } },
    { id: 'red', name: '紅色', icon: 'fa-user', colors: { body: '#ef4444', outline: '#dc2626' } },
    { id: 'yellow', name: '黃色', icon: 'fa-user', colors: { body: '#f59e0b', outline: '#d97706' } },
    { id: 'pink', name: '粉色', icon: 'fa-user', colors: { body: '#ec4899', outline: '#db2777' } },
    { id: 'cyan', name: '青色', icon: 'fa-user', colors: { body: '#06b6d4', outline: '#0891b2' } },
    { id: 'custom', name: '自訂', icon: 'fa-palette', colors: null }
  ];
  
  const modalHtml = `
    <div class="arcade-invite-modal" id="arcade-invite-modal">
      <div class="arcade-invite-content">
        <div class="arcade-invite-header">
          <h3><i class="fas fa-user-friends"></i> 邀請角色一起玩</h3>
          <button class="arcade-invite-close" onclick="closeArcadeInviteModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="arcade-sprite-section">
          <div class="arcade-sprite-title"><i class="fas fa-user"></i> 你的小人物外觀</div>
          <div class="arcade-sprite-options" id="player-sprite-options">
            ${spriteOptions.map(opt => `
              <div class="arcade-sprite-option ${savedPlayerSprite === opt.id ? 'selected' : ''}" 
                   data-sprite-id="${opt.id}" 
                   onclick="selectPlayerSprite('${opt.id}')"
                   title="${opt.name}">
                <div class="arcade-sprite-preview" style="background: ${opt.colors?.body || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}">
                  <i class="fas ${opt.icon}"></i>
                </div>
                <span>${opt.name}</span>
              </div>
            `).join('')}
          </div>
          <div class="arcade-custom-color hidden" id="player-custom-color">
            <label>身體顏色：<input type="color" id="player-body-color" value="#4ade80"></label>
            <label>輪廓顏色：<input type="color" id="player-outline-color" value="#166534"></label>
          </div>
        </div>
        
        <div class="arcade-invite-characters">
          ${characters.map(char => `
            <div class="arcade-char-option" data-char-name="${char.name}" onclick="selectArcadeCharacter('${char.name}', '${char.avatar || ''}', '${(char.personality || '').replace(/'/g, "\\'")}', '${(char.background || '').replace(/'/g, "\\'")}')">
              <div class="arcade-char-avatar">
                ${char.avatar ? `<img src="${char.avatar}" alt="${char.name}">` : `<i class="fas fa-user"></i>`}
              </div>
              <div class="arcade-char-name">${char.name}</div>
            </div>
          `).join('')}
        </div>
        
        <div class="arcade-sprite-section" id="char-sprite-section" style="display: none;">
          <div class="arcade-sprite-title"><i class="fas fa-user-friends"></i> 角色小人物外觀</div>
          <div class="arcade-sprite-options" id="char-sprite-options">
            ${spriteOptions.map(opt => `
              <div class="arcade-sprite-option ${savedCharSprite === opt.id ? 'selected' : ''}" 
                   data-sprite-id="${opt.id}" 
                   onclick="selectCharSprite('${opt.id}')"
                   title="${opt.name}">
                <div class="arcade-sprite-preview" style="background: ${opt.colors?.body || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}">
                  <i class="fas ${opt.icon}"></i>
                </div>
                <span>${opt.name}</span>
              </div>
            `).join('')}
          </div>
          <div class="arcade-custom-color hidden" id="char-custom-color">
            <label>身體顏色：<input type="color" id="char-body-color" value="#a855f7"></label>
            <label>輪廓顏色：<input type="color" id="char-outline-color" value="#7c3aed"></label>
          </div>
        </div>
        
        <div class="arcade-custom-appearance" id="arcade-custom-appearance" style="display: none; margin-top: 12px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 12px;">
          <div style="font-size: 12px; color: var(--text); margin-bottom: 8px;">自定義外觀（可選）</div>
          <input type="text" id="arcade-custom-avatar" placeholder="自定義頭貼 URL（留空使用原頭貼）" 
            style="width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border); background: rgba(0,0,0,0.3); color: var(--text); font-size: 12px;">
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
  
  // 載入已保存的自訂顏色
  const savedPlayerColors = localStorage.getItem('sx_arcade_player_colors');
  if (savedPlayerColors) {
    try {
      const colors = JSON.parse(savedPlayerColors);
      document.getElementById('player-body-color').value = colors.body || '#4ade80';
      document.getElementById('player-outline-color').value = colors.outline || '#166534';
    } catch (e) {}
  }
  
  const savedCharColors = localStorage.getItem('sx_arcade_char_colors');
  if (savedCharColors) {
    try {
      const colors = JSON.parse(savedCharColors);
      document.getElementById('char-body-color').value = colors.body || '#a855f7';
      document.getElementById('char-outline-color').value = colors.outline || '#7c3aed';
    } catch (e) {}
  }
}

function selectPlayerSprite(spriteId) {
  document.querySelectorAll('#player-sprite-options .arcade-sprite-option').forEach(el => {
    el.classList.remove('selected');
  });
  document.querySelector(`#player-sprite-options .arcade-sprite-option[data-sprite-id="${spriteId}"]`)?.classList.add('selected');
  
  const customColorEl = document.getElementById('player-custom-color');
  if (spriteId === 'custom') {
    customColorEl.classList.remove('hidden');
  } else {
    customColorEl.classList.add('hidden');
  }
  
  localStorage.setItem('sx_arcade_player_sprite', spriteId);
}

function selectCharSprite(spriteId) {
  document.querySelectorAll('#char-sprite-options .arcade-sprite-option').forEach(el => {
    el.classList.remove('selected');
  });
  document.querySelector(`#char-sprite-options .arcade-sprite-option[data-sprite-id="${spriteId}"]`)?.classList.add('selected');
  
  const customColorEl = document.getElementById('char-custom-color');
  if (spriteId === 'custom') {
    customColorEl.classList.remove('hidden');
  } else {
    customColorEl.classList.add('hidden');
  }
  
  localStorage.setItem('sx_arcade_char_sprite', spriteId);
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
  
  const customAppearance = document.getElementById('arcade-custom-appearance');
  if (customAppearance) {
    customAppearance.style.display = 'block';
  }
  
  const charSpriteSection = document.getElementById('char-sprite-section');
  if (charSpriteSection) {
    charSpriteSection.style.display = 'block';
  }
  
  const sendBtn = document.getElementById('arcade-send-invite-btn');
  if (sendBtn) {
    sendBtn.disabled = false;
  }
}

function getPlayerSpriteColors() {
  const spriteId = localStorage.getItem('sx_arcade_player_sprite') || 'default';
  
  const spriteColors = {
    default: { body: '#4ade80', outline: '#166534' },
    blue: { body: '#3b82f6', outline: '#1d4ed8' },
    purple: { body: '#a855f7', outline: '#7c3aed' },
    red: { body: '#ef4444', outline: '#dc2626' },
    yellow: { body: '#f59e0b', outline: '#d97706' },
    pink: { body: '#ec4899', outline: '#db2777' },
    cyan: { body: '#06b6d4', outline: '#0891b2' }
  };
  
  if (spriteId === 'custom') {
    const savedColors = localStorage.getItem('sx_arcade_player_colors');
    if (savedColors) {
      try {
        return JSON.parse(savedColors);
      } catch (e) {}
    }
    const bodyColor = document.getElementById('player-body-color')?.value || '#4ade80';
    const outlineColor = document.getElementById('player-outline-color')?.value || '#166534';
    const colors = { body: bodyColor, outline: outlineColor };
    localStorage.setItem('sx_arcade_player_colors', JSON.stringify(colors));
    return colors;
  }
  
  return spriteColors[spriteId] || spriteColors.default;
}

function getCharSpriteColors() {
  const spriteId = localStorage.getItem('sx_arcade_char_sprite') || 'default';
  
  const spriteColors = {
    default: { body: '#a855f7', outline: '#7c3aed' },
    blue: { body: '#3b82f6', outline: '#1d4ed8' },
    purple: { body: '#a855f7', outline: '#7c3aed' },
    red: { body: '#ef4444', outline: '#dc2626' },
    yellow: { body: '#f59e0b', outline: '#d97706' },
    pink: { body: '#ec4899', outline: '#db2777' },
    cyan: { body: '#06b6d4', outline: '#0891b2' }
  };
  
  if (spriteId === 'custom') {
    const savedColors = localStorage.getItem('sx_arcade_char_colors');
    if (savedColors) {
      try {
        return JSON.parse(savedColors);
      } catch (e) {}
    }
    const bodyColor = document.getElementById('char-body-color')?.value || '#a855f7';
    const outlineColor = document.getElementById('char-outline-color')?.value || '#7c3aed';
    const colors = { body: bodyColor, outline: outlineColor };
    localStorage.setItem('sx_arcade_char_colors', JSON.stringify(colors));
    return colors;
  }
  
  return spriteColors[spriteId] || spriteColors.default;
}

function sendArcadeInvite() {
  if (!ArcadeInvite.selectedCharacter) {
    alert('請先選擇一個角色');
    return;
  }
  
  const charData = { ...ArcadeInvite.selectedCharacter };
  
  const customAvatar = document.getElementById('arcade-custom-avatar');
  if (customAvatar && customAvatar.value.trim()) {
    charData.avatar = customAvatar.value.trim();
  }
  
  // 保存自訂顏色
  const playerSprite = localStorage.getItem('sx_arcade_player_sprite');
  const charSprite = localStorage.getItem('sx_arcade_char_sprite');
  
  if (playerSprite === 'custom') {
    const bodyColor = document.getElementById('player-body-color')?.value;
    const outlineColor = document.getElementById('player-outline-color')?.value;
    if (bodyColor && outlineColor) {
      localStorage.setItem('sx_arcade_player_colors', JSON.stringify({ body: bodyColor, outline: outlineColor }));
    }
  }
  
  if (charSprite === 'custom') {
    const bodyColor = document.getElementById('char-body-color')?.value;
    const outlineColor = document.getElementById('char-outline-color')?.value;
    if (bodyColor && outlineColor) {
      localStorage.setItem('sx_arcade_char_colors', JSON.stringify({ body: bodyColor, outline: outlineColor }));
    }
  }
  
  const charSpriteColors = getCharSpriteColors();
  
  window.parent.postMessage({
    type: 'openApp',
    appId: 'chat'
  }, '*');
  
  setTimeout(() => {
    window.parent.postMessage({
      type: 'ARCADE_INVITE_FROM_USER',
      payload: {
        charName: charData.name,
        charAvatar: charData.avatar,
        charPersonality: charData.personality,
        charBackground: charData.background,
        charSpriteColors: charSpriteColors,
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
    
    const charData = {
      charName: data.payload.charName || data.payload.name,
      charAvatar: data.payload.charAvatar || data.payload.avatar,
      charPersonality: data.payload.charPersonality || data.payload.personality,
      charBackground: data.payload.charBackground || data.payload.background,
      charSpriteColors: data.payload.charSpriteColors || null,
      name: data.payload.charName || data.payload.name,
      avatar: data.payload.charAvatar || data.payload.avatar,
      personality: data.payload.charPersonality || data.payload.personality,
      background: data.payload.charBackground || data.payload.background
    };
    
    // 保存角色的外觀顏色
    if (charData.charSpriteColors) {
      localStorage.setItem('sx_arcade_char_sprite', 'custom');
      localStorage.setItem('sx_arcade_char_colors', JSON.stringify(charData.charSpriteColors));
    }
    
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
window.selectPlayerSprite = selectPlayerSprite;
window.selectCharSprite = selectCharSprite;
window.getPlayerSpriteColors = getPlayerSpriteColors;
window.getCharSpriteColors = getCharSpriteColors;