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
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(
      screenX + tileSize / 2,
      screenY + tileSize - 4,
      tileSize * 0.35,
      tileSize * 0.15,
      0, 0, Math.PI * 2
    );
    ctx.fill();
    
    const headSize = 10;
    const bodyWidth = 12;
    const bodyHeight = 14;
    const legWidth = 4;
    const legHeight = 6;
    
    const centerX = screenX + tileSize / 2;
    const bodyX = centerX - bodyWidth / 2;
    const bodyY = screenY + tileSize / 2 - 2;
    const headX = centerX - headSize / 2;
    const headY = bodyY - headSize + 2;
    
    ctx.fillStyle = this.colors.body;
    ctx.fillRect(bodyX, bodyY, bodyWidth, bodyHeight);
    
    ctx.fillStyle = this.colors.bodyLight;
    ctx.fillRect(bodyX, bodyY, 3, bodyHeight);
    
    ctx.fillStyle = this.colors.bodyShadow;
    ctx.fillRect(bodyX + bodyWidth - 3, bodyY, 3, bodyHeight);
    
    ctx.fillStyle = this.colors.bodyDepth;
    ctx.fillRect(bodyX, bodyY + bodyHeight - 2, bodyWidth, 2);
    
    if (this.isMoving) {
      const legOffset = Math.sin(this.animationFrame * Math.PI / 2) * 2;
      
      ctx.fillStyle = this.colors.bodyShadow;
      ctx.fillRect(bodyX + 2, bodyY + bodyHeight, legWidth, legHeight + legOffset);
      ctx.fillRect(bodyX + bodyWidth - 6, bodyY + bodyHeight, legWidth, legHeight - legOffset);
      
      ctx.fillStyle = this.colors.bodyDepth;
      ctx.fillRect(bodyX + 2, bodyY + bodyHeight + legHeight + legOffset - 2, legWidth, 2);
      ctx.fillRect(bodyX + bodyWidth - 6, bodyY + bodyHeight + legHeight - legOffset - 2, legWidth, 2);
    } else {
      ctx.fillStyle = this.colors.bodyShadow;
      ctx.fillRect(bodyX + 2, bodyY + bodyHeight, legWidth, legHeight);
      ctx.fillRect(bodyX + bodyWidth - 6, bodyY + bodyHeight, legWidth, legHeight);
      
      ctx.fillStyle = this.colors.bodyDepth;
      ctx.fillRect(bodyX + 2, bodyY + bodyHeight + legHeight - 2, legWidth, 2);
      ctx.fillRect(bodyX + bodyWidth - 6, bodyY + bodyHeight + legHeight - 2, legWidth, 2);
    }
    
    ctx.fillStyle = this.colors.skin;
    ctx.fillRect(headX, headY, headSize, headSize);
    
    ctx.fillStyle = this.colors.skinLight;
    ctx.fillRect(headX, headY, 3, headSize);
    
    ctx.fillStyle = this.colors.skinShadow;
    ctx.fillRect(headX + headSize - 3, headY, 3, headSize);
    
    ctx.fillStyle = this.colors.hair;
    ctx.fillRect(headX, headY, headSize, 4);
    ctx.fillRect(headX, headY + 2, 2, 3);
    ctx.fillRect(headX + headSize - 2, headY + 2, 2, 3);
    
    const eyeY = headY + 5;
    ctx.fillStyle = '#000';
    ctx.fillRect(headX + 2, eyeY, 2, 2);
    ctx.fillRect(headX + 6, eyeY, 2, 2);
    
    ctx.fillStyle = '#fff';
    ctx.fillRect(headX + 2, eyeY, 1, 1);
    ctx.fillRect(headX + 6, eyeY, 1, 1);
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
