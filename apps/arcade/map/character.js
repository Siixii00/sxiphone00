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
    
    this.colors = this.loadSpriteColors(options.spriteColors);
    
    this.visible = true;
    this.dialogueBubble = null;
  }
  
  loadSpriteColors(customColors) {
    if (customColors) {
      return { body: customColors.body, outline: customColors.outline || '#484848', skin: '#fcd34d', hair: '#f89090' };
    }
    
    const spriteId = localStorage.getItem('sx_arcade_char_sprite') || 'default';
    
    const spriteColors = {
      default: { body: '#a040a0', outline: '#484848', skin: '#fcd34d', hair: '#f89090' },
      blue: { body: '#4080c0', outline: '#484848', skin: '#fcd34d', hair: '#f89090' },
      purple: { body: '#a040a0', outline: '#484848', skin: '#fcd34d', hair: '#f89090' },
      red: { body: '#e83030', outline: '#484848', skin: '#fcd34d', hair: '#f89090' },
      yellow: { body: '#f8b040', outline: '#484848', skin: '#fcd34d', hair: '#f89090' },
      pink: { body: '#f89090', outline: '#484848', skin: '#fcd34d', hair: '#f89090' },
      cyan: { body: '#40b8c0', outline: '#484848', skin: '#fcd34d', hair: '#f89090' }
    };
    
    if (spriteId === 'custom') {
      const savedColors = localStorage.getItem('sx_arcade_char_colors');
      if (savedColors) {
        try {
          const colors = JSON.parse(savedColors);
          return { body: colors.body, outline: colors.outline || '#484848', skin: '#fcd34d', hair: '#f89090' };
        } catch (e) {}
      }
    }
    
    return spriteColors[spriteId] || spriteColors.default;
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

    this.renderShadow(ctx, screenX, screenY, tileSize);

    this.renderBody(ctx, screenX, screenY, tileSize);

    this.renderHead(ctx, screenX, screenY, tileSize);

    this.renderFace(ctx, screenX, screenY, tileSize);

    if (this.isMoving) {
      this.renderLegs(ctx, screenX, screenY, tileSize);
    }

    this.renderNameTag(ctx, screenX, screenY, tileSize);
  }

  renderShadow(ctx, screenX, screenY, tileSize) {
    const shadowWidth = Math.floor(tileSize * 0.5);
    const shadowHeight = Math.floor(tileSize * 0.15);
    const shadowX = screenX + (tileSize - shadowWidth) / 2;
    const shadowY = screenY + tileSize - shadowHeight - 2;

    ctx.fillStyle = DP_ARCADE.shadow_cast;
    ctx.fillRect(Math.floor(shadowX), Math.floor(shadowY), shadowWidth, shadowHeight);
  }

  renderBody(ctx, screenX, screenY, tileSize) {
    const bodyWidth = Math.floor(tileSize * 0.45);
    const bodyHeight = Math.floor(tileSize * 0.5);
    const bodyX = Math.floor(screenX + (tileSize - bodyWidth) / 2);
    const bodyY = Math.floor(screenY + tileSize - bodyHeight - 6);

    ctx.fillStyle = DP_ARCADE.outline;
    ctx.fillRect(bodyX - 1, bodyY - 1, bodyWidth + 2, bodyHeight + 2);

    ctx.fillStyle = this.colors.body;
    ctx.fillRect(bodyX, bodyY, bodyWidth, bodyHeight);

    ctx.fillStyle = this.colors.outline;
    ctx.fillRect(bodyX, bodyY, 2, bodyHeight);
    ctx.fillRect(bodyX + bodyWidth - 2, bodyY, 2, bodyHeight);
  }

  renderHead(ctx, screenX, screenY, tileSize) {
    const headSize = Math.floor(tileSize * 0.35);
    const headX = Math.floor(screenX + (tileSize - headSize) / 2);
    const headY = Math.floor(screenY + tileSize * 0.15);

    ctx.fillStyle = DP_ARCADE.outline;
    ctx.fillRect(headX - 1, headY - 1, headSize + 2, headSize + 2);

    ctx.fillStyle = this.colors.skin;
    ctx.fillRect(headX, headY, headSize, headSize);

    ctx.fillStyle = this.colors.hair;
    ctx.fillRect(headX, headY, headSize, Math.floor(headSize * 0.4));

    ctx.fillStyle = this.colors.outline;
    ctx.fillRect(headX, headY, headSize, 1);
    ctx.fillRect(headX, headY, 1, headSize);
    ctx.fillRect(headX + headSize - 1, headY, 1, headSize);
  }

  renderFace(ctx, screenX, screenY, tileSize) {
    const headSize = Math.floor(tileSize * 0.35);
    const headX = Math.floor(screenX + (tileSize - headSize) / 2);
    const headY = Math.floor(screenY + tileSize * 0.15);

    const eyeY = headY + Math.floor(headSize * 0.55);
    const eyeSize = 2;

    let leftEyeX, rightEyeX;

    switch (this.direction) {
      case 'left':
        leftEyeX = headX + Math.floor(headSize * 0.2);
        rightEyeX = headX + Math.floor(headSize * 0.4);
        break;
      case 'right':
        leftEyeX = headX + Math.floor(headSize * 0.6);
        rightEyeX = headX + Math.floor(headSize * 0.8);
        break;
      default:
        leftEyeX = headX + Math.floor(headSize * 0.25);
        rightEyeX = headX + Math.floor(headSize * 0.65);
    }

    ctx.fillStyle = DP_ARCADE.outline;
    ctx.fillRect(leftEyeX, eyeY, eyeSize, eyeSize);
    ctx.fillRect(rightEyeX, eyeY, eyeSize, eyeSize);
  }

  renderLegs(ctx, screenX, screenY, tileSize) {
    const bodyWidth = Math.floor(tileSize * 0.45);
    const bodyHeight = Math.floor(tileSize * 0.5);
    const bodyX = Math.floor(screenX + (tileSize - bodyWidth) / 2);
    const bodyY = Math.floor(screenY + tileSize - bodyHeight - 6);

    const legOffset = Math.sin(this.animationFrame * Math.PI) * 2;
    const legWidth = 4;
    const legHeight = 4;

    ctx.fillStyle = this.colors.outline;
    ctx.fillRect(bodyX + 3, bodyY + bodyHeight, legWidth, Math.floor(legHeight + legOffset));
    ctx.fillRect(bodyX + bodyWidth - 7, bodyY + bodyHeight, legWidth, Math.floor(legHeight - legOffset));
  }
  
  renderNameTag(ctx, screenX, screenY, tileSize) {
    ctx.font = 'bold 10px sans-serif';
    const textWidth = ctx.measureText(this.name).width;
    const padding = 6;
    const tagWidth = Math.floor(textWidth + padding * 2);
    const tagHeight = 14;
    const tagX = Math.floor(screenX + (tileSize - tagWidth) / 2);
    const tagY = Math.floor(screenY - 12);

    ctx.fillStyle = DP_ARCADE.ui_border_out;
    ctx.fillRect(tagX - 2, tagY - tagHeight - 2, tagWidth + 4, tagHeight + 4);

    ctx.fillStyle = DP_ARCADE.ui_border_in;
    ctx.fillRect(tagX - 1, tagY - tagHeight - 1, tagWidth + 2, tagHeight + 2);

    ctx.fillStyle = DP_ARCADE.ui_bg;
    ctx.fillRect(tagX, tagY - tagHeight, tagWidth, tagHeight);

    ctx.fillStyle = DP_ARCADE.ui_text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.name, screenX + tileSize / 2, tagY - tagHeight / 2);
  }
  
  showDialogue(text, duration = 3000) {
    this.hideDialogue();

    const container = document.getElementById('map-container');
    if (!container) return;

    const canvas = this.mapEngine?.canvas;
    const canvasRect = canvas ? canvas.getBoundingClientRect() : { width: 400, height: 300 };

    const boxWidth = Math.floor(canvasRect.width * 0.85);
    const boxHeight = 80;
    const boxX = Math.floor((canvasRect.width - boxWidth) / 2);
    const boxY = Math.floor(canvasRect.height - boxHeight - 20);

    this.dialogueBubble = document.createElement('div');
    this.dialogueBubble.className = 'character-dialogue-nds';
    this.dialogueBubble.innerHTML = `
      <div class="nds-dialogue-speaker">${this.name}</div>
      <div class="nds-dialogue-text">${text}</div>
    `;
    this.dialogueBubble.style.cssText = `
      position: absolute;
      left: ${boxX}px;
      top: ${boxY}px;
      width: ${boxWidth}px;
      z-index: 100;
      font-family: 'Press Start 2P', monospace;
      pointer-events: none;
    `;

    const style = document.createElement('style');
    style.id = 'nds-dialogue-style';
    style.textContent = `
      .character-dialogue-nds {
        background: ${DP_ARCADE.ui_card_bg};
        border: 2px solid ${DP_ARCADE.ui_border_out};
        padding: 8px;
        box-sizing: border-box;
        box-shadow: inset 0 0 0 2px ${DP_ARCADE.ui_border_in};
      }
      .nds-dialogue-speaker {
        color: ${DP_ARCADE.ui_highlight};
        font-size: 10px;
        font-weight: bold;
        margin-bottom: 6px;
      }
      .nds-dialogue-text {
        color: ${DP_ARCADE.ui_text};
        font-size: 11px;
        line-height: 1.5;
      }
    `;

    if (!document.getElementById('nds-dialogue-style')) {
      document.head.appendChild(style);
    }

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
