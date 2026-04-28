class ArcadeAvatar {
  constructor(charData) {
    this.charData = charData;
    this.element = null;
    this.dialogueBubble = null;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    this.position = charData.position || { 
      x: window.innerWidth - 100, 
      y: window.innerHeight - 200 
    };
    this.idleTimer = null;
    this.dialogueCooldown = 0;
    this.isLoading = false;
  }
  
  render() {
    if (this.element) {
      this.element.remove();
    }
    
    this.element = document.createElement('div');
    this.element.className = 'arcade-avatar';
    this.element.id = 'arcade-avatar';
    this.element.style.left = `${this.position.x}px`;
    this.element.style.top = `${this.position.y}px`;
    
    const avatarUrl = this.charData.charAvatar || this.charData.avatar || '';
    const charName = this.charData.charName || this.charData.name || '角色';
    
    this.element.innerHTML = `
      <div class="arcade-avatar-dialogue" id="arcade-avatar-dialogue"></div>
      <div class="arcade-avatar-container">
        <div class="arcade-avatar-image">
          ${avatarUrl ? 
            `<img src="${avatarUrl}" alt="${charName}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><i class="fas fa-user" style="display:none"></i>` : 
            `<i class="fas fa-user"></i>`
          }
        </div>
        <div class="arcade-avatar-name">${charName}</div>
      </div>
      <button class="arcade-avatar-leave" onclick="window.arcadeAvatar.leave()" title="讓角色離開">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    document.body.appendChild(this.element);
    
    this.dialogueBubble = document.getElementById('arcade-avatar-dialogue');
    
    this.setupDrag();
    this.setupClick();
    this.startIdleTimer();
    
    setTimeout(() => {
      this.showDialogue('我來了！一起玩吧！', 3000);
    }, 500);
    
    console.log('[ArcadeAvatar] 已渲染:', charName, '頭貼:', avatarUrl ? '有' : '無');
  }
  
  setupDrag() {
    const container = this.element.querySelector('.arcade-avatar-container');
    
    container.addEventListener('mousedown', (e) => this.startDrag(e));
    container.addEventListener('touchstart', (e) => this.startDrag(e), { passive: false });
    
    document.addEventListener('mousemove', (e) => this.drag(e));
    document.addEventListener('touchmove', (e) => this.drag(e), { passive: false });
    
    document.addEventListener('mouseup', () => this.endDrag());
    document.addEventListener('touchend', () => this.endDrag());
  }
  
  startDrag(e) {
    if (e.target.closest('.arcade-avatar-leave')) return;
    
    e.preventDefault();
    this.isDragging = true;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const rect = this.element.getBoundingClientRect();
    this.dragOffset = {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
    
    this.element.classList.add('dragging');
  }
  
  drag(e) {
    if (!this.isDragging) return;
    
    e.preventDefault();
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    let newX = clientX - this.dragOffset.x;
    let newY = clientY - this.dragOffset.y;
    
    const maxX = window.innerWidth - this.element.offsetWidth;
    const maxY = window.innerHeight - this.element.offsetHeight;
    
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));
    
    this.position = { x: newX, y: newY };
    this.element.style.left = `${newX}px`;
    this.element.style.top = `${newY}px`;
  }
  
  endDrag() {
    if (this.isDragging) {
      this.isDragging = false;
      this.element.classList.remove('dragging');
      
      this.savePosition();
    }
  }
  
  savePosition() {
    const saved = localStorage.getItem('sx_arcade_guest');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        data.position = this.position;
        localStorage.setItem('sx_arcade_guest', JSON.stringify(data));
      } catch (e) {}
    }
  }
  
  setupClick() {
    const container = this.element.querySelector('.arcade-avatar-container');
    
    container.addEventListener('click', (e) => {
      if (!this.isDragging && !e.target.closest('.arcade-avatar-leave')) {
        this.onAvatarClick();
      }
    });
  }
  
  onAvatarClick() {
    const now = Date.now();
    if (now - this.dialogueCooldown < 3000 || this.isLoading) return;
    
    this.dialogueCooldown = now;
    this.requestAIDialogue('click');
  }
  
  async requestAIDialogue(context, extraData = {}) {
    if (this.isLoading) return;
    this.isLoading = true;
    
    this.showDialogue('...', 30000);
    
    try {
      const response = await new Promise((resolve, reject) => {
        const requestId = 'arcade-dialogue-' + Date.now();
        
        const handler = (event) => {
          const data = event.data;
          if (data && data.type === 'ARCADE_DIALOGUE_RESPONSE' && data.requestId === requestId) {
            window.removeEventListener('message', handler);
            resolve(data.response);
          }
        };
        
        window.addEventListener('message', handler);
        
        setTimeout(() => {
          window.removeEventListener('message', handler);
          reject(new Error('Timeout'));
        }, 30000);
        
        window.parent.postMessage({
          type: 'ARCADE_REQUEST_DIALOGUE',
          requestId: requestId,
          payload: {
            charName: this.charData.charName,
            charAvatar: this.charData.charAvatar,
            charPersonality: this.charData.charPersonality,
            charBackground: this.charData.charBackground,
            context: context,
            extraData: extraData
          }
        }, '*');
      });
      
      if (response && response.trim()) {
        this.showDialogue(response.trim(), 5000);
      } else {
        this.hideDialogue();
      }
    } catch (e) {
      console.warn('[ArcadeAvatar] AI 對話請求失敗:', e);
      this.hideDialogue();
    } finally {
      this.isLoading = false;
    }
  }
  
  showDialogue(text, duration = 3000) {
    if (!this.dialogueBubble) return;
    
    this.dialogueBubble.textContent = text;
    this.dialogueBubble.classList.add('visible');
    
    if (this.dialogueTimeout) {
      clearTimeout(this.dialogueTimeout);
    }
    
    if (duration > 0) {
      this.dialogueTimeout = setTimeout(() => {
        this.hideDialogue();
      }, duration);
    }
  }
  
  hideDialogue() {
    if (this.dialogueBubble) {
      this.dialogueBubble.classList.remove('visible');
    }
  }
  
  startIdleTimer() {
    if (this.idleTimer) {
      clearInterval(this.idleTimer);
    }
    
    this.idleTimer = setInterval(() => {
      if (Math.random() < 0.15 && !this.isLoading) {
        this.requestAIDialogue('idle');
      }
    }, 60000);
  }
  
  onGameEvent(event, data) {
    const now = Date.now();
    if (now - this.dialogueCooldown < 2000 || this.isLoading) return;
    
    this.dialogueCooldown = now;
    this.requestAIDialogue(event, data);
  }
  
  leave() {
    if (confirm(`確定要讓 ${this.charData.charName} 離開嗎？`)) {
      this.remove();
      localStorage.removeItem('sx_arcade_guest');
      
      console.log('[ArcadeAvatar] 角色已離開:', this.charData.charName);
    }
  }
  
  remove() {
    if (this.idleTimer) {
      clearInterval(this.idleTimer);
    }
    if (this.dialogueTimeout) {
      clearTimeout(this.dialogueTimeout);
    }
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    window.arcadeAvatar = null;
  }
}

window.ArcadeAvatar = ArcadeAvatar;