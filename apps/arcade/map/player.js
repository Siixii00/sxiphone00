class Player {
  constructor(mapEngine, options = {}) {
    this.mapEngine = mapEngine;
    this.x = options.x || 9;
    this.y = options.y || 12;
    this.floor = options.floor || '1F';
    this.direction = 'down';
    this.isMoving = false;
    this.moveProgress = 0;
    this.targetX = this.x;
    this.targetY = this.y;
    this.speed = options.speed || 0.05;
    this.animationFrame = 0;
    this.animationTimer = 0;
    
    this.name = options.name || '玩家';
    this.avatar = options.avatar || 'default';
    this.status = 'idle';
    
    this.colors = this.loadSpriteColors();
  }
  
  loadSpriteColors() {
    const spriteId = localStorage.getItem('sx_arcade_player_sprite') || 'default';
    
    const spriteColors = {
      default: { body: '#4ade80', bodyLight: '#6ee8a0', bodyShadow: '#2ab060', bodyDepth: '#1a8040', skin: '#fcd34d', skinLight: '#fef3c7', skinShadow: '#d4a84d', hair: '#1e1e1e' },
      blue: { body: '#3b82f6', bodyLight: '#60a5fa', bodyShadow: '#2563eb', bodyDepth: '#1d4ed8', skin: '#fcd34d', skinLight: '#fef3c7', skinShadow: '#d4a84d', hair: '#1e1e1e' },
      purple: { body: '#a855f7', bodyLight: '#c084fc', bodyShadow: '#9333ea', bodyDepth: '#7c3aed', skin: '#fcd34d', skinLight: '#fef3c7', skinShadow: '#d4a84d', hair: '#ec4899' },
      red: { body: '#ef4444', bodyLight: '#f87171', bodyShadow: '#dc2626', bodyDepth: '#b91c1c', skin: '#fcd34d', skinLight: '#fef3c7', skinShadow: '#d4a84d', hair: '#1e1e1e' },
      yellow: { body: '#f59e0b', bodyLight: '#fbbf24', bodyShadow: '#d97706', bodyDepth: '#b45309', skin: '#fcd34d', skinLight: '#fef3c7', skinShadow: '#d4a84d', hair: '#1e1e1e' },
      pink: { body: '#ec4899', bodyLight: '#f472b6', bodyShadow: '#db2777', bodyDepth: '#be185d', skin: '#fcd34d', skinLight: '#fef3c7', skinShadow: '#d4a84d', hair: '#ec4899' },
      cyan: { body: '#06b6d4', bodyLight: '#22d3ee', bodyShadow: '#0891b2', bodyDepth: '#0e7490', skin: '#fcd34d', skinLight: '#fef3c7', skinShadow: '#d4a84d', hair: '#1e1e1e' }
    };
    
    if (spriteId === 'custom') {
      const savedColors = localStorage.getItem('sx_arcade_player_colors');
      if (savedColors) {
        try {
          const colors = JSON.parse(savedColors);
          return { 
            body: colors.body, 
            bodyLight: this.lightenColor(colors.body, 20),
            bodyShadow: this.darkenColor(colors.body, 20),
            bodyDepth: this.darkenColor(colors.body, 40),
            outline: colors.outline, 
            skin: '#fcd34d', 
            skinLight: '#fef3c7',
            skinShadow: '#d4a84d',
            hair: '#1e1e1e' 
          };
        } catch (e) {}
      }
    }
    
    return spriteColors[spriteId] || spriteColors.default;
  }
  
  lightenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }
  
  darkenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }
  
  setPosition(x, y, floor = null) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    if (floor) this.floor = floor;
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
    if (this.isMoving) {
      this.moveProgress += this.speed;
      
      if (this.moveProgress >= 1) {
        this.x = this.targetX;
        this.y = this.targetY;
        this.isMoving = false;
        this.moveProgress = 0;
        
        this.checkTileInteraction();
      }
    }
    
    this.animationTimer += deltaTime;
    if (this.animationTimer > 150) {
      this.animationTimer = 0;
      this.animationFrame = (this.animationFrame + 1) % 4;
    }
  }
  
  checkTileInteraction() {
    const map = MAP_DATA[this.floor];
    if (!map || !map[this.y] || !map[this.y][this.x]) return;
    
    const tile = map[this.y][this.x];
    
    if (tile.type === TILE_TYPES.STAIR_UP || tile.type === TILE_TYPES.STAIR_DOWN) {
      if (tile.targetFloor && tile.targetPos) {
        if (tile.restricted && !window.arcadeState?.adultModeEnabled) {
          return;
        }
        
        this.floor = tile.targetFloor;
        this.x = tile.targetPos.x;
        this.y = tile.targetPos.y;
        this.targetX = this.x;
        this.targetY = this.y;
        
        if (this.mapEngine) {
          this.mapEngine.setFloor(this.floor);
        }
        
        if (window.arcadeGame) {
          window.arcadeGame.onFloorChange(this.floor);
        }
      }
    }
  }
  
  getInteractableNearby() {
    const directions = [
      { dx: 0, dy: -1, dir: 'up' },
      { dx: 0, dy: 1, dir: 'down' },
      { dx: -1, dy: 0, dir: 'left' },
      { dx: 1, dy: 0, dir: 'right' }
    ];
    
    for (const { dx, dy, dir } of directions) {
      const checkX = this.x + dx;
      const checkY = this.y + dy;
      const interactable = getInteractableAtPosition(this.floor, checkX, checkY);
      
      if (interactable) {
        return { ...interactable, x: checkX, y: checkY, direction: dir };
      }
    }
    
    return null;
  }
  
  render(ctx, camera) {
    const tileSize = this.mapEngine?.tileSize || TILE_SIZE;
    
    let renderX = this.x;
    let renderY = this.y;
    
    if (this.isMoving) {
      renderX = this.x + (this.targetX - this.x) * this.moveProgress;
      renderY = this.y + (this.targetY - this.y) * this.moveProgress;
    }
    
    const screenX = renderX * tileSize - camera.x;
    const screenY = renderY * tileSize - camera.y;
    
    const pixelSize = 2;
    const headW = 8;
    const headH = 8;
    const bodyW = 8;
    const bodyH = 12;
    const legsH = 8;
    const totalH = headH + bodyH + legsH;
    
    const centerX = Math.floor(screenX + tileSize / 2);
    const baseY = Math.floor(screenY + tileSize - 6);
    const headX = centerX - (headW * pixelSize) / 2;
    const headY = baseY - totalH * pixelSize;
    const bodyX = centerX - (bodyW * pixelSize) / 2;
    const bodyY = headY + headH * pixelSize;
    const legsY = bodyY + bodyH * pixelSize;
    
    const hair = '#503820';
    const skin = '#e8d0b8';
    const skinLight = '#f0e0c8';
    const skinShadow = '#d0c0a8';
    const shirt = '#4070b0';
    const shirtLight = '#5080c0';
    const shirtShadow = '#305090';
    const pants = '#304060';
    const pantsShadow = '#203050';
    const shoes = '#202020';
    const outline = DP_ARCADE.outline;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(centerX - 6 * pixelSize, baseY - 2, 12 * pixelSize, 4);
    
    const drawPixelRect = (x, y, w, h, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.floor(x), Math.floor(y), w * pixelSize, h * pixelSize);
    };
    
    const drawOutline = (x, y, w, h) => {
      ctx.fillStyle = outline;
      ctx.fillRect(Math.floor(x) - pixelSize, Math.floor(y), pixelSize, h * pixelSize);
      ctx.fillRect(Math.floor(x) + w * pixelSize, Math.floor(y), pixelSize, h * pixelSize);
      ctx.fillRect(Math.floor(x), Math.floor(y) - pixelSize, w * pixelSize, pixelSize);
      ctx.fillRect(Math.floor(x), Math.floor(y) + h * pixelSize, w * pixelSize, pixelSize);
    };
    
    drawOutline(bodyX, bodyY, bodyW, bodyH);
    drawOutline(bodyX, legsY, bodyW, legsH / 2);
    drawOutline(headX, headY, headW, headH);
    
    drawPixelRect(bodyX, bodyY, bodyW, bodyH, shirt);
    drawPixelRect(bodyX, bodyY, 2, bodyH, shirtLight);
    drawPixelRect(bodyX + (bodyW - 2) * pixelSize, bodyY, 2, bodyH, shirtShadow);
    
    let legOffset = 0;
    if (this.isMoving) {
      legOffset = Math.sin(this.animationFrame * Math.PI / 2) * pixelSize * 2;
    }
    
    drawPixelRect(bodyX, legsY, bodyW / 2, legsH / 2, pants);
    drawPixelRect(bodyX + (bodyW / 2) * pixelSize, legsY + legOffset, bodyW / 2, legsH / 2, pantsShadow);
    
    drawPixelRect(bodyX, legsY + legsH / 2 * pixelSize, bodyW / 2, 2, shoes);
    drawPixelRect(bodyX + (bodyW / 2) * pixelSize, legsY + legsH / 2 * pixelSize + legOffset, bodyW / 2, 2, shoes);
    
    drawPixelRect(headX, headY, headW, headH, skin);
    drawPixelRect(headX, headY, 2, headH, skinLight);
    drawPixelRect(headX + (headW - 2) * pixelSize, headY, 2, headH, skinShadow);
    
    const hairStyle = this.direction;
    ctx.fillStyle = hair;
    
    switch (this.direction) {
      case 'down':
        ctx.fillRect(headX, headY, headW * pixelSize, 3 * pixelSize);
        ctx.fillRect(headX, headY + 2 * pixelSize, 2 * pixelSize, 2 * pixelSize);
        ctx.fillRect(headX + (headW - 2) * pixelSize, headY + 2 * pixelSize, 2 * pixelSize, 2 * pixelSize);
        break;
      case 'up':
        ctx.fillRect(headX + pixelSize, headY, (headW - 2) * pixelSize, 4 * pixelSize);
        ctx.fillRect(headX, headY + 2 * pixelSize, 2 * pixelSize, 2 * pixelSize);
        ctx.fillRect(headX + (headW - 2) * pixelSize, headY + 2 * pixelSize, 2 * pixelSize, 2 * pixelSize);
        break;
      case 'left':
        ctx.fillRect(headX, headY, headW * pixelSize, 3 * pixelSize);
        ctx.fillRect(headX, headY + 2 * pixelSize, 3 * pixelSize, 3 * pixelSize);
        ctx.fillRect(headX + (headW - 2) * pixelSize, headY + 2 * pixelSize, 2 * pixelSize, 2 * pixelSize);
        break;
      case 'right':
        ctx.fillRect(headX, headY, headW * pixelSize, 3 * pixelSize);
        ctx.fillRect(headX, headY + 2 * pixelSize, 2 * pixelSize, 2 * pixelSize);
        ctx.fillRect(headX + (headW - 3) * pixelSize, headY + 2 * pixelSize, 3 * pixelSize, 3 * pixelSize);
        break;
    }
    
    const eyeY = headY + 4 * pixelSize;
    ctx.fillStyle = outline;
    
    if (this.direction === 'up') {
      // No eyes visible from behind
    } else if (this.direction === 'left') {
      ctx.fillRect(headX + pixelSize, eyeY, 2 * pixelSize, 2 * pixelSize);
    } else if (this.direction === 'right') {
      ctx.fillRect(headX + (headW - 3) * pixelSize, eyeY, 2 * pixelSize, 2 * pixelSize);
    } else {
      ctx.fillRect(headX + 2 * pixelSize, eyeY, 2 * pixelSize, 2 * pixelSize);
      ctx.fillRect(headX + (headW - 4) * pixelSize, eyeY, 2 * pixelSize, 2 * pixelSize);
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(headX + 2 * pixelSize, eyeY, pixelSize, pixelSize);
      ctx.fillRect(headX + (headW - 4) * pixelSize, eyeY, pixelSize, pixelSize);
    }
  }
  
  getState() {
    return {
      x: this.x,
      y: this.y,
      floor: this.floor,
      direction: this.direction,
      status: this.status,
      name: this.name
    };
  }
  
  setState(state) {
    if (state.x !== undefined) this.x = state.x;
    if (state.y !== undefined) this.y = state.y;
    if (state.floor !== undefined) this.floor = state.floor;
    if (state.direction !== undefined) this.direction = state.direction;
    if (state.status !== undefined) this.status = state.status;
    if (state.name !== undefined) this.name = state.name;
    
    this.targetX = this.x;
    this.targetY = this.y;
  }
}
