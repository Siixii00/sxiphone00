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
    
    this.colors = {
      body: '#4ade80',
      outline: '#166534',
      skin: '#fcd34d',
      hair: '#1e1e1e'
    };
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
    
    const shadowSize = tileSize * 0.4;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(
      screenX + tileSize / 2,
      screenY + tileSize - 4,
      shadowSize,
      shadowSize * 0.4,
      0, 0, Math.PI * 2
    );
    ctx.fill();
    
    const bodyWidth = tileSize * 0.5;
    const bodyHeight = tileSize * 0.6;
    const bodyX = screenX + (tileSize - bodyWidth) / 2;
    const bodyY = screenY + tileSize - bodyHeight - 4;
    
    ctx.fillStyle = this.colors.body;
    ctx.strokeStyle = this.colors.outline;
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    ctx.roundRect(bodyX, bodyY, bodyWidth, bodyHeight, 4);
    ctx.fill();
    ctx.stroke();
    
    const headSize = tileSize * 0.4;
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
      ctx.fillRect(bodyX + 4, bodyY + bodyHeight - 2, 4, 6 + legOffset);
      ctx.fillRect(bodyX + bodyWidth - 8, bodyY + bodyHeight - 2, 4, 6 - legOffset);
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
