class MultiplayerManager {
  constructor() {
    this.isEnabled = false;
    this.playerId = null;
    this.playerName = '玩家';
    this.currentFloor = '1F';
    this.position = { x: 9, y: 12 };
    this.otherPlayers = new Map();
    this.messages = [];
    this.database = null;
    this.playerRef = null;
    this.playersRef = null;
    this.messagesRef = null;
    this.unsubscribePlayers = null;
    this.unsubscribeMessages = null;
    
    this.updateThrottle = 100;
    this.lastUpdate = 0;
    this.cleanupInterval = null;
  }
  
  drawPixelCircleLocal(ctx, cx, cy, radius, color) {
    ctx.fillStyle = color;
    const r = Math.floor(radius);
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        if (x * x + y * y <= r * r) {
          ctx.fillRect(cx + x, cy + y, 1, 1);
        }
      }
    }
  }
  
  async init(firebaseConfig) {
    try {
      if (typeof firebase !== 'undefined' && firebaseConfig) {
        if (!firebase.apps.length) {
          firebase.initializeApp(firebaseConfig);
        }
        
        this.database = firebase.database();
        this.playerId = this.generatePlayerId();
        
        this.playersRef = this.database.ref('arcade/players');
        this.messagesRef = this.database.ref('arcade/messages');
        
        console.log('Multiplayer initialized');
        return true;
      }
    } catch (e) {
      console.warn('Firebase initialization failed:', e);
    }
    return false;
  }
  
  generatePlayerId() {
    return 'player_' + Math.random().toString(36).substr(2, 9);
  }
  
  setPlayerInfo(name, avatar = 'default') {
    this.playerName = name || '玩家';
    
    if (this.isEnabled && this.playerRef) {
      this.playerRef.update({
        name: this.playerName,
        avatar: avatar
      });
    }
  }
  
  async connect() {
    if (!this.database) {
      console.warn('Database not initialized');
      return false;
    }
    
    try {
      this.playerRef = this.playersRef.child(this.playerId);
      
      await this.playerRef.set({
        name: this.playerName,
        avatar: 'default',
        position: this.position,
        floor: this.currentFloor,
        status: 'idle',
        currentGame: null,
        lastUpdate: firebase.database.ServerValue.TIMESTAMP
      });
      
      this.playerRef.onDisconnect().remove();
      
      this.unsubscribePlayers = this.playersRef.on('value', (snapshot) => {
        this.handlePlayersUpdate(snapshot);
      });
      
      this.unsubscribeMessages = this.messagesRef
        .orderByChild('timestamp')
        .limitToLast(50)
        .on('value', (snapshot) => {
          this.handleMessagesUpdate(snapshot);
        });
      
      this.cleanupInterval = setInterval(() => {
        this.cleanupInactivePlayers();
      }, 60000);
      
      this.isEnabled = true;
      return true;
    } catch (e) {
      console.error('Failed to connect:', e);
      return false;
    }
  }
  
  disconnect() {
    if (this.playerRef) {
      this.playerRef.remove();
    }
    
    if (this.unsubscribePlayers) {
      this.unsubscribePlayers();
    }
    
    if (this.unsubscribeMessages) {
      this.unsubscribeMessages();
    }
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.isEnabled = false;
    this.otherPlayers.clear();
  }
  
  handlePlayersUpdate(snapshot) {
    const data = snapshot.val();
    if (!data) return;
    
    this.otherPlayers.clear();
    
    Object.entries(data).forEach(([id, player]) => {
      if (id !== this.playerId) {
        this.otherPlayers.set(id, player);
      }
    });
    
    this.renderOtherPlayers();
  }
  
  handleMessagesUpdate(snapshot) {
    const data = snapshot.val();
    if (!data) {
      this.messages = [];
      return;
    }
    
    this.messages = Object.entries(data)
      .map(([id, msg]) => ({ id, ...msg }))
      .sort((a, b) => a.timestamp - b.timestamp);
    
    this.renderMessages();
  }
  
  updatePosition(x, y, floor) {
    if (!this.isEnabled || !this.playerRef) return;
    
    const now = Date.now();
    if (now - this.lastUpdate < this.updateThrottle) return;
    
    this.lastUpdate = now;
    this.position = { x, y };
    this.currentFloor = floor;
    
    this.playerRef.update({
      position: this.position,
      floor: this.currentFloor,
      lastUpdate: firebase.database.ServerValue.TIMESTAMP
    });
  }
  
  setStatus(status, currentGame = null) {
    if (!this.isEnabled || !this.playerRef) return;
    
    this.playerRef.update({
      status: status,
      currentGame: currentGame,
      lastUpdate: firebase.database.ServerValue.TIMESTAMP
    });
  }
  
  sendMessage(content) {
    if (!this.isEnabled || !this.messagesRef || !content.trim()) return;
    
    const messageRef = this.messagesRef.push();
    messageRef.set({
      sender: this.playerId,
      senderName: this.playerName,
      content: content.trim(),
      floor: this.currentFloor,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    });
  }
  
  sendEmoji(emoji) {
    if (!this.isEnabled || !this.messagesRef) return;
    
    const messageRef = this.messagesRef.push();
    messageRef.set({
      sender: this.playerId,
      senderName: this.playerName,
      content: emoji,
      type: 'emoji',
      floor: this.currentFloor,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    });
  }
  
  cleanupInactivePlayers() {
    if (!this.database) return;
    
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    
    this.playersRef.once('value', (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      
      Object.entries(data).forEach(([id, player]) => {
        if (player.lastUpdate < fiveMinutesAgo) {
          this.playersRef.child(id).remove();
        }
      });
    });
  }
  
  getPlayersOnFloor(floor) {
    const players = [];
    this.otherPlayers.forEach((player, id) => {
      if (player.floor === floor) {
        players.push({ id, ...player });
      }
    });
    return players;
  }
  
  renderOtherPlayers() {
    if (!window.arcadeGame || !window.arcadeGame.mapEngine) return;
    
    const mapEngine = window.arcadeGame.mapEngine;
    const currentFloor = window.arcadeGame.player?.floor;
    
    const playersOnFloor = this.getPlayersOnFloor(currentFloor);
    
    const ctx = mapEngine.ctx;
    const camera = mapEngine.camera;
    const tileSize = mapEngine.tileSize || 32;
    
    playersOnFloor.forEach(player => {
      const screenX = player.position.x * tileSize - camera.x;
      const screenY = player.position.y * tileSize - camera.y;
      
      ctx.globalAlpha = 0.7;
      
      ctx.fillStyle = '#60a5fa';
      const shadowW = Math.floor(tileSize * 0.8);
      const shadowH = Math.floor(tileSize * 0.3);
      const shadowX = Math.floor(screenX + (tileSize - shadowW) / 2);
      const shadowY = Math.floor(screenY + tileSize - shadowH - 2);
      ctx.fillRect(shadowX, shadowY, shadowW, shadowH);
      
      ctx.fillStyle = '#93c5fd';
      const bodySize = Math.floor(tileSize * 0.7);
      const bodyX = Math.floor(screenX + (tileSize - bodySize) / 2);
      const bodyY = Math.floor(screenY + (tileSize - bodySize) / 2);
      this.drawPixelCircleLocal(ctx, bodyX + bodySize/2, bodyY + bodySize/2, bodySize/2, '#93c5fd');
      
      ctx.fillStyle = '#60a5fa';
      ctx.fillRect(bodyX, bodyY, 2, bodySize);
      ctx.fillRect(bodyX, bodyY, bodySize, 2);
      
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(bodyX + bodySize - 2, bodyY, 2, bodySize);
      ctx.fillRect(bodyX, bodyY + bodySize - 2, bodySize, 2);
      
      ctx.globalAlpha = 1;
      
      ctx.fillStyle = '#000';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(player.name, screenX + tileSize / 2, screenY - 5);
      
      if (player.status === 'playing' && player.currentGame) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(screenX, screenY - 20, tileSize, 14);
        ctx.fillStyle = '#fbbf24';
        ctx.font = '8px sans-serif';
        ctx.fillText('遊玩中', screenX + tileSize / 2, screenY - 10);
      }
    });
  }
  
  renderMessages() {
    const chatContainer = document.getElementById('chat-messages');
    if (!chatContainer) return;
    
    const currentFloor = window.arcadeGame?.player?.floor;
    
    const floorMessages = this.messages.filter(msg => 
      msg.floor === currentFloor || !msg.floor
    ).slice(-20);
    
    chatContainer.innerHTML = floorMessages.map(msg => `
      <div class="chat-message ${msg.type === 'emoji' ? 'emoji' : ''}">
        <span class="sender">${msg.senderName}</span>
        <span class="content">${msg.content}</span>
      </div>
    `).join('');
    
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
  
  showChatPanel() {
    const panel = document.createElement('div');
    panel.className = 'chat-panel-overlay';
    panel.innerHTML = `
      <div class="chat-panel">
        <div class="chat-header">
          <h3><i class="fas fa-comments"></i> 聊天室</h3>
          <button class="close-btn" onclick="this.parentElement.parentElement.parentElement.remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="chat-messages" id="chat-messages"></div>
        <div class="chat-input-area">
          <input type="text" id="chat-input" placeholder="輸入訊息..." onkeypress="if(event.key==='Enter')multiplayerManager.sendChatMessage()">
          <button onclick="multiplayerManager.sendChatMessage()"><i class="fas fa-paper-plane"></i></button>
        </div>
        <div class="emoji-bar">
          <button onclick="multiplayerManager.sendEmojiMessage('👋')">👋</button>
          <button onclick="multiplayerManager.sendEmojiMessage('😊')">😊</button>
          <button onclick="multiplayerManager.sendEmojiMessage('🎮')">🎮</button>
          <button onclick="multiplayerManager.sendEmojiMessage('🏆')">🏆</button>
          <button onclick="multiplayerManager.sendEmojiMessage('🎉')">🎉</button>
          <button onclick="multiplayerManager.sendEmojiMessage('❤️')">❤️</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(panel);
    this.renderMessages();
  }
  
  sendChatMessage() {
    const input = document.getElementById('chat-input');
    if (!input) return;
    
    const content = input.value;
    if (content.trim()) {
      this.sendMessage(content);
      input.value = '';
    }
  }
  
  sendEmojiMessage(emoji) {
    this.sendEmoji(emoji);
  }
  
  getPlayerCount() {
    return this.otherPlayers.size + 1;
  }
  
  getPlayerCountOnFloor(floor) {
    return this.getPlayersOnFloor(floor).length + 1;
  }
}

const multiplayerManager = new MultiplayerManager();

window.multiplayerManager = multiplayerManager;