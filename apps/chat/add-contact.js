let selectedCharForContact = null;

async function loadCharactersFromDB() {
    if (typeof sxGetAllCharacters === 'function') {
        const chars = await sxGetAllCharacters();
        console.log('[AddContact] 從 IndexedDB 載入角色:', chars?.length || 0, '個');
        return chars || [];
    }
    console.warn('[AddContact] sxGetAllCharacters 不可用');
    return [];
}

async function loadUsersFromDB() {
    if (typeof sxGetAllUsers === 'function') {
        const users = await sxGetAllUsers();
        console.log('[AddContact] 從 IndexedDB 載入用戶:', users?.length || 0, '個');
        return users || [];
    }
    console.warn('[AddContact] sxGetAllUsers 不可用');
    return [];
}

async function showAddContactPanel() {
    const panel = document.getElementById('add-contact-panel');
    const boundUserSection = document.getElementById('add-contact-bound-user');
    const confirmBtn = document.getElementById('add-contact-confirm');
    
    if (panel) panel.classList.add('active');
    if (boundUserSection) boundUserSection.classList.add('hidden');
    if (confirmBtn) confirmBtn.disabled = true;
    selectedCharForContact = null;
    
    await loadAndRenderCharList();
}

function hideAddContactPanel() {
    const panel = document.getElementById('add-contact-panel');
    if (panel) panel.classList.remove('active');
    selectedCharForContact = null;
}

async function loadAndRenderCharList() {
    const charListEl = document.getElementById('add-contact-char-list');
    if (!charListEl) return;
    
    charListEl.innerHTML = '<div class="loading-tip">載入中...</div>';
    
    try {
        const chars = await loadCharactersFromDB();
        
        if (!chars.length) {
            charListEl.innerHTML = '<div class="empty-tip">尚未建立角色，請先到 Settings 建立角色</div>';
            return;
        }
        
        charListEl.innerHTML = chars.map((char, idx) => `
            <div class="char-item" data-char-index="${idx}" data-char-id="${char.id || ''}">
                <div class="char-avatar">
                    ${char.avatar ? `<img src="${char.avatar}" alt="${char.name}">` : '<i class="fas fa-user"></i>'}
                </div>
                <div class="char-info">
                    <div class="char-name">${char.name || '未命名角色'}</div>
                    <div class="char-desc">${(char.personality || '').slice(0, 50)}${(char.personality || '').length > 50 ? '...' : ''}</div>
                </div>
            </div>
        `).join('');
        
        charListEl.querySelectorAll('.char-item').forEach(item => {
            item.addEventListener('click', async () => {
                charListEl.querySelectorAll('.char-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                
                const idx = Number(item.dataset.charIndex);
                const chars = await loadCharactersFromDB();
                selectedCharForContact = chars[idx];
                
                await updateBoundUserDisplay(selectedCharForContact);
            });
        });
    } catch (e) {
        console.error('[Chat] 載入角色列表失敗:', e);
        charListEl.innerHTML = '<div class="error-tip">載入失敗</div>';
    }
}

async function updateBoundUserDisplay(char) {
    const boundUserSection = document.getElementById('add-contact-bound-user');
    const boundUserInfo = document.getElementById('bound-user-info');
    const confirmBtn = document.getElementById('add-contact-confirm');
    
    if (!char) {
        if (boundUserSection) boundUserSection.classList.add('hidden');
        if (confirmBtn) confirmBtn.disabled = true;
        return;
    }
    
    const boundUserId = char.boundUserId;
    let user = null;
    
    if (boundUserId) {
        try {
            const users = await loadUsersFromDB();
            user = users.find(u => (u.id || u.name) === boundUserId);
        } catch (e) {
            console.warn('[Chat] 查找綁定用戶失敗:', e);
        }
    }
    
    if (boundUserSection) boundUserSection.classList.remove('hidden');
    if (confirmBtn) confirmBtn.disabled = false;
    
    if (boundUserInfo) {
        if (user) {
            boundUserInfo.innerHTML = `
                <div class="bound-user-avatar">
                    ${user.avatar ? `<img src="${user.avatar}" alt="${user.name}">` : '<i class="fas fa-user"></i>'}
                </div>
                <div class="bound-user-details">
                    <div class="bound-user-name">${user.name || '未命名用戶'}</div>
                    <div class="bound-user-bg">${(user.background || '無背景設定').slice(0, 50)}</div>
                </div>
            `;
        } else {
            boundUserInfo.innerHTML = `
                <div class="bound-user-avatar">
                    <i class="fas fa-user-slash"></i>
                </div>
                <div class="bound-user-details">
                    <div class="bound-user-name">使用預設用戶</div>
                    <div class="bound-user-bg">此角色未綁定特定用戶面具</div>
                </div>
            `;
        }
    }
}

function confirmAddContact() {
    if (!selectedCharForContact) return;
    
    const char = selectedCharForContact;
    const charName = char.name || 'AI 助理';
    
    if (typeof createSessionData === 'function') {
        const newSession = createSessionData({ 
            charName,
            charAvatar: char.avatar || '',
            charPersonality: char.personality || '',
            charBackground: char.background || '',
            boundUserId: char.boundUserId || ''
        });
        
        if (typeof loadChatSessions === 'function') {
            const sessions = loadChatSessions();
            sessions.unshift(newSession);
            if (typeof saveChatSessions === 'function') saveChatSessions(sessions);
        }
        
        if (typeof setActiveChatId === 'function') setActiveChatId(newSession.id);
        
        if (char.boundUserId) {
            applyBoundUserToSession(char.boundUserId);
        }
        
        if (typeof renderChatListFromStorage === 'function') renderChatListFromStorage();
        if (typeof renderFriendsList === 'function') renderFriendsList();
        if (typeof setChatHistorySync === 'function') setChatHistorySync(newSession.history);
        
        const chatTitleEl = document.getElementById('chat-detail-title');
        if (chatTitleEl) chatTitleEl.innerText = charName;
    }
    
    hideAddContactPanel();
    
    if (typeof showChatDetail === 'function') showChatDetail();
    if (typeof renderHistory === 'function') renderHistory();
    
    (async () => {
        if (typeof sxSetItem === 'function') {
            await sxSetItem('sx_char_name', charName);
            if (char.avatar) await sxSetItem('sx_char_avatar', char.avatar);
            if (char.personality) await sxSetItem('sx_char_personality', char.personality);
            if (char.background) await sxSetItem('sx_char_background', char.background);
        }
    })();
}

async function applyBoundUserToSession(boundUserId) {
    if (!boundUserId) return;
    
    const users = await loadUsersFromDB();
    const user = users.find(u => (u.id || u.name) === boundUserId);
    
    if (user && typeof sxSetItem === 'function') {
        await sxSetItem('sx_user_name', user.name || 'User');
        if (user.avatar) await sxSetItem('sx_user_avatar', user.avatar);
        if (user.background) await sxSetItem('sx_user_background', user.background);
        if (user.personality) await sxSetItem('sx_user_personality', user.personality);
        console.log('[Chat] 已套用綁定用戶:', user.name);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('add-contact-close');
    const cancelBtn = document.getElementById('add-contact-cancel');
    const confirmBtn = document.getElementById('add-contact-confirm');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', hideAddContactPanel);
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideAddContactPanel);
    }
    if (confirmBtn) {
        confirmBtn.addEventListener('click', confirmAddContact);
    }
});
