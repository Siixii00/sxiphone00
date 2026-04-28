class Character {
  constructor(mapEngine, options = {}) {
    this.mapEngine = mapEngine;
    this.x = options.x || 8;
    this.y = options.y || 12;
    this.floor = options.floor || '1F';
    this.direction = 'down';
    this.isMoving = false;
    this.moveProgress = 0;
    this.targetX = this.x;
    this.targetY = this.y;
    this.speed = options.speed || 0.04;
    this.animationFrame = 0;
    this.animationTimer = 0;
    
    this.name = options.name || 'AI 助理';
    this.avatar = options.avatar || '';
    this.personality = options.personality || '';
    this.background = options.background || '';
    
    this.followTarget = null;
    this.followDelay = 2;
    this.pathQueue = [];
    this.lastPlayerPos = null;
    
    this.colors = {
      body: '#a855f7',
      outline: '#7c3aed',
      skin: '#fcd34d',
      hair: '#ec4899'
    };
    
    this.visible = true;
    this.dialogueBubble = null;
  }
  
  static getCharacterData() {
    const charName = localStorage.getItem('sx_char_name');
    const charAvatar = localStorage.getItem('sx_char_avatar');
    const charPersonality = localStorage.getItem('sx_char_personality');
    const charBackground = localStorage.getItem('sx_char_background');
    
    if (charName && charName !== '預設用戶') {
      return {
        name: charName,
        avatar: charAvatar || '',
        personality: charPersonality || '',
        background: charBackground || ''
      };
    }
    
    const charactersRaw = localStorage.getItem('sx_characters');
    if (charactersRaw) {
      try {
        const characters = JSON.parse(charactersRaw);
        if (Array.isArray(characters) && characters.length > 0) {
          const firstChar = characters[0];
          if (firstChar && firstChar.name && firstChar.name !== '預設用戶') {
            return {
              name: firstChar.name,
              avatar: firstChar.avatar || '',
              personality: firstChar.personality || '',
              background: firstChar.background || ''
            };
          }
        }
      } catch (e) {
        console.warn('解析角色資料失敗:', e);
      }
    }
    
    return null;
  }
  
  static hasCharacter() {
    const data = Character.getCharacterData();
    return data !== null;
  }
  
  setPosition(x, y, floor = null) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    if (floor) this.floor = floor;
  }
  
  setFollowTarget(player) {
    this.followTarget = player;
    this.lastPlayerPos = { x: player.x, y: player.y, floor: player.floor };
  }
  
  recordPlayerMovement(player) {
    if (!this.followTarget) return;
    
    if (player.floor !== this.floor) {
      this.floor = player.floor;
      this.x = player.x;
      this.y = player.y - 1;
      this.targetX = this.x;
      this.targetY = this.y;
      return;
    }
    
    if (this.lastPlayerPos && 
        (player.x !== this.lastPlayerPos.x || player.y !== this.lastPlayerPos.y)) {
      this.pathQueue.push({
        x: this.lastPlayerPos.x,
        y: this.lastPlayerPos.y,
        direction: player.direction
      });
      
      if (this.pathQueue.length > this.followDelay + 2) {
        this.pathQueue.shift();
      }
    }
    
    this.lastPlayerPos = { x: player.x, y: player.y, floor: player.floor };
  }
  
  move(direction) {
    if (this.isMoving) return false;
    
    this.direction = direction;
    
    let newX = this.x;
    let newY = this.y;
    
    switch (direction) {
      case 'up': newY--; break;
      case 'down': newY++; break;
      case 'left': newX--; break;
      case 'right': newX++; break;
    }
    
    if (this.canMoveTo(newX, newY)) {
      this.targetX = newX;
      this.targetY = newY;
      this.isMoving = true;
      this.moveProgress = 0;
      return true;
    }
    
    return false;
  }
  
  canMoveTo(x, y) {
    const map = MAP_DATA[this.floor];
    if (!map) return false;
    
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) {
      return false;
    }
    
    const tile = map[y][x];
    if (!tile) return false;
    
    const walkableTypes = [
      TILE_TYPES.FLOOR,
      TILE_TYPES.STAIR_UP,
      TILE_TYPES.STAIR_DOWN,
      TILE_TYPES.REST_AREA,
      TILE_TYPES.EMPTY
    ];
    
    return walkableTypes.includes(tile.type);
  }
  
  update(deltaTime) {
    if (this.pathQueue.length > this.followDelay && !this.isMoving) {
      const nextPos = this.pathQueue.shift();
      if (nextPos) {
        const dx = nextPos.x - this.x;
        const dy = nextPos.y - this.y;
        
        if (Math.abs(dx) + Math.abs(dy) > 2) {
          this.x = nextPos.x;
          this.y = nextPos.y;
          this.targetX = this.x;
          this.targetY = this.y;
        } else {
          let direction = null;
          if (Math.abs(dx) > Math.abs(dy)) {
            direction = dx > 0 ? 'right' : 'left';
          } else if (dy !== 0) {
            direction = dy > 0 ? 'down' : 'up';
          }
          
          if (direction) {
            this.move(direction);
          }
        }
      }
    }
    
    if (this.isMoving) {
      this.moveProgress += this.speed;
      
      if (this.moveProgress >= 1) {
        this.x = this.targetX;
        this.y = this.targetY;
        this.isMoving = false;
        this.moveProgress = 0;
      }
    }
    
    this.animationTimer += deltaTime;
    if (this.animationTimer > 150) {
      this.animationTimer = 0;
      this.animationFrame = (this.animationFrame + 1) % 4;
    }
  }
  
  render(ctx, camera) {
    if (!this.visible) return;
    
    const tileSize = this.mapEngine?.tileSize || TILE_SIZE;
    
    let renderX = this.x;
    let renderY = this.y;
    
    if (this.isMoving) {
      renderX = this.x + (this.targetX - this.x) * this.moveProgress;
      renderY = this.y + (this.targetY - this.y) * this.moveProgress;
    }
    
    const screenX = renderX * tileSize - camera.x;
    const screenY = renderY * tileSize - camera.y;
    
    const shadowSize = tileSize * 0.35;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(
      screenX + tileSize / 2,
      screenY + tileSize - 4,
      shadowSize,
      shadowSize * 0.4,
      0, 0, Math.PI * 2
    );
    ctx.fill();
    
    const bodyWidth = tileSize * 0.45;
    const bodyHeight = tileSize * 0.55;
    const bodyX = screenX + (tileSize - bodyWidth) / 2;
    const bodyY = screenY + tileSize - bodyHeight - 4;
    
    ctx.fillStyle = this.colors.body;
    ctx.strokeStyle = this.colors.outline;
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    ctx.roundRect(bodyX, bodyY, bodyWidth, bodyHeight, 4);
    ctx.fill();
    ctx.stroke();
    
    const headSize = tileSize * 0.38;
    const headX = screenX + (tileSize - headSize) / 2;
    const headY = bodyY - headSize + 4;
    
    ctx.fillStyle = this.colors.skin;
    ctx.beginPath();
    ctx.arc(headX + headSize / 2, headY + headSize / 2, headSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = this.colors.hair;
    ctx.beginPath();
    ctx.arc(headX + headSize / 2, headY + headSize / 3, headSize / 2.2, Math.PI, 0);
    ctx.fill();
    
    const eyeOffset = this.isMoving ? Math.sin(this.animationFrame * Math.PI / 2) * 1 : 0;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(headX + headSize / 3, headY + headSize / 2 + eyeOffset, 2, 0, Math.PI * 2);
    ctx.arc(headX + headSize * 2 / 3, headY + headSize / 2 + eyeOffset, 2, 0, Math.PI * 2);
    ctx.fill();
    
    if (this.isMoving) {
      const legOffset = Math.sin(this.animationFrame * Math.PI) * 3;
      ctx.fillStyle = this.colors.outline;
      ctx.fillRect(bodyX + 3, bodyY + bodyHeight - 2, 4, 5 + legOffset);
      ctx.fillRect(bodyX + bodyWidth - 7, bodyY + bodyHeight - 2, 4, 5 - legOffset);
    }
    
    this.renderNameTag(ctx, screenX, screenY, tileSize);
  }
  
  renderNameTag(ctx, screenX, screenY, tileSize) {
    const nameTagY = screenY - 8;
    ctx.font = 'bold 10px sans-serif';
    const textWidth = ctx.measureText(this.name).width;
    const padding = 4;
    const tagWidth = textWidth + padding * 2;
    const tagHeight = 14;
    const tagX = screenX + (tileSize - tagWidth) / 2;
    
    ctx.fillStyle = 'rgba(168, 85, 247, 0.9)';
    ctx.beginPath();
    ctx.roundRect(tagX, nameTagY - tagHeight, tagWidth, tagHeight, 4);
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.name, screenX + tileSize / 2, nameTagY - tagHeight / 2);
  }
  
  showDialogue(text, duration = 3000) {
    this.hideDialogue();
    
    const container = document.getElementById('map-container');
    if (!container) return;
    
    const tileSize = this.mapEngine?.tileSize || TILE_SIZE;
    const camera = this.mapEngine?.camera || { x: 0, y: 0 };
    
    const screenX = this.x * tileSize - camera.x + tileSize / 2;
    const screenY = this.y * tileSize - camera.y - 30;
    
    this.dialogueBubble = document.createElement('div');
    this.dialogueBubble.className = 'character-dialogue-bubble';
    this.dialogueBubble.innerHTML = `<span>${text}</span>`;
    this.dialogueBubble.style.cssText = `
      position: absolute;
      left: ${screenX}px;
      top: ${screenY}px;
      transform: translateX(-50%);
      z-index: 100;
    `;
    
    container.appendChild(this.dialogueBubble);
    
    setTimeout(() => {
      this.hideDialogue();
    }, duration);
  }
  
  hideDialogue() {
    if (this.dialogueBubble) {
      this.dialogueBubble.remove();
      this.dialogueBubble = null;
    }
  }
  
  getState() {
    return {
      x: this.x,
      y: this.y,
      floor: this.floor,
      direction: this.direction,
      name: this.name
    };
  }
  
  setState(state) {
    if (state.x !== undefined) this.x = state.x;
    if (state.y !== undefined) this.y = state.y;
    if (state.floor !== undefined) this.floor = state.floor;
    if (state.direction !== undefined) this.direction = state.direction;
    if (state.name !== undefined) this.name = state.name;
    
    this.targetX = this.x;
    this.targetY = this.y;
  }
}
