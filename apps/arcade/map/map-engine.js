class MapEngine {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.tileSize = options.tileSize || TILE_SIZE;
    this.currentFloor = '1F';
    this.map = null;
    this.camera = { x: 0, y: 0 };
    this.animationFrame = null;
    this.lastRenderTime = 0;
    this.blinkFrame = 0;
    this.players = [];
    this.interactionCallback = options.onInteraction || null;
  }
  
  init(floor = '1F') {
    this.currentFloor = floor;
    this.map = MAP_DATA[floor];
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }
  
  resize() {
    const container = this.canvas.parentElement;
    const rect = container.getBoundingClientRect();
    
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.ctx.imageSmoothingEnabled = false;
    
    this.render();
  }
  
  setFloor(floor) {
    if (MAP_DATA[floor]) {
      this.currentFloor = floor;
      this.map = MAP_DATA[floor];
      this.render();
    }
  }
  
  setCamera(x, y) {
    const mapPixelWidth = MAP_WIDTH * this.tileSize;
    const mapPixelHeight = MAP_HEIGHT * this.tileSize;
    
    this.camera.x = Math.max(0, Math.min(x, mapPixelWidth - this.canvas.width));
    this.camera.y = Math.max(0, Math.min(y, mapPixelHeight - this.canvas.height));
  }
  
  centerOnPlayer(playerX, playerY) {
    const centerX = playerX * this.tileSize - this.canvas.width / 2 + this.tileSize / 2;
    const centerY = playerY * this.tileSize - this.canvas.height / 2 + this.tileSize / 2;
    this.setCamera(centerX, centerY);
  }
  
  render() {
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = DP_ARCADE.floor_base;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const startTileX = Math.floor(this.camera.x / this.tileSize);
    const startTileY = Math.floor(this.camera.y / this.tileSize);
    const endTileX = Math.min(startTileX + Math.ceil(this.canvas.width / this.tileSize) + 1, MAP_WIDTH);
    const endTileY = Math.min(startTileY + Math.ceil(this.canvas.height / this.tileSize) + 1, MAP_HEIGHT);
    
    for (let y = startTileY; y < endTileY; y++) {
      for (let x = startTileX; x < endTileX; x++) {
        this.renderTile(x, y);
      }
    }
    
    for (let y = startTileY; y < endTileY; y++) {
      for (let x = startTileX; x < endTileX; x++) {
        this.renderTileOverlay(x, y);
      }
    }
    
    this.blinkFrame = (this.blinkFrame + 1) % 60;
  }
  
  renderTile(x, y) {
    if (!this.map || !this.map[y] || !this.map[y][x]) return;
    
    const tile = this.map[y][x];
    const screenX = x * this.tileSize - this.camera.x;
    const screenY = y * this.tileSize - this.camera.y;
    
    this.renderFloor(screenX, screenY, x, y);
    
    switch (tile.type) {
      case TILE_TYPES.WALL:
        this.renderWall(screenX, screenY);
        break;
      case TILE_TYPES.MACHINE:
        this.renderMachine(screenX, screenY, tile.machineId);
        break;
      case TILE_TYPES.STAIR_UP:
        this.renderStairUp(screenX, screenY);
        break;
      case TILE_TYPES.STAIR_DOWN:
        this.renderStairDown(screenX, screenY);
        break;
      case TILE_TYPES.NPC:
        this.renderNPC(screenX, screenY, tile);
        break;
      case TILE_TYPES.SERVICE_DESK:
        this.renderServiceDesk(screenX, screenY);
        break;
      case TILE_TYPES.REST_AREA:
        this.renderRestArea(screenX, screenY);
        break;
      case TILE_TYPES.DECORATION:
        this.renderDecoration(screenX, screenY, tile);
        break;
    }
  }
  
  renderFloor(screenX, screenY, tileX, tileY) {
    const isAlt = (tileX + tileY) % 2 === 0;
    const baseColor = isAlt ? DP_ARCADE.floor_base : DP_ARCADE.floor_alt;
    
    this.ctx.fillStyle = baseColor;
    this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
    
    this.ctx.fillStyle = DP_ARCADE.floor_grout;
    this.ctx.fillRect(screenX, screenY, this.tileSize, 1);
    this.ctx.fillRect(screenX, screenY, 1, this.tileSize);
    
    this.ctx.fillStyle = DP_ARCADE.floor_light;
    this.ctx.fillRect(screenX + 1, screenY + 1, 4, 2);
    this.ctx.fillRect(screenX + 1, screenY + 1, 2, 4);
    
    this.ctx.fillStyle = DP_ARCADE.floor_dark;
    this.ctx.fillRect(screenX + this.tileSize - 3, screenY + this.tileSize - 2, 2, 1);
    this.ctx.fillRect(screenX + this.tileSize - 2, screenY + this.tileSize - 3, 1, 2);
    
    this.ctx.fillStyle = DP_ARCADE.shadow_cast;
    this.ctx.fillRect(screenX + 2, screenY + 2, 3, 3);
  }
  
  renderWall(screenX, screenY) {
    this.ctx.fillStyle = DP_ARCADE.wall_light;
    this.ctx.fillRect(screenX, screenY, this.tileSize, 8);
    
    this.ctx.fillStyle = DP_ARCADE.wall_base;
    this.ctx.fillRect(screenX, screenY + 8, this.tileSize, this.tileSize - 12);
    
    this.ctx.fillStyle = DP_ARCADE.wall_dark;
    this.ctx.fillRect(screenX + this.tileSize - 4, screenY + 8, 4, this.tileSize - 12);
    
    this.ctx.fillStyle = DP_ARCADE.outline;
    this.ctx.fillRect(screenX, screenY + this.tileSize - 4, this.tileSize, 4);
    
    this.ctx.fillStyle = DP_ARCADE.wall_trim;
    this.ctx.fillRect(screenX, screenY, 2, this.tileSize);
    this.ctx.fillRect(screenX, screenY + 6, this.tileSize, 2);
    
    this.ctx.fillStyle = DP_ARCADE.wall_trim_dark;
    this.ctx.fillRect(screenX + this.tileSize - 2, screenY + 8, 2, this.tileSize - 12);
  }
  
  renderMachine(screenX, screenY, machineId) {
    const machine = MACHINES[machineId];
    if (!machine) return;
    
    this.ctx.fillStyle = DP_ARCADE.cabinet_light;
    this.ctx.fillRect(screenX + 2, screenY + 2, this.tileSize - 4, 6);
    
    this.ctx.fillStyle = DP_ARCADE.cabinet_base;
    this.ctx.fillRect(screenX + 2, screenY + 8, this.tileSize - 4, this.tileSize - 14);
    
    this.ctx.fillStyle = DP_ARCADE.cabinet_dark;
    this.ctx.fillRect(screenX + this.tileSize - 6, screenY + 8, 4, this.tileSize - 14);
    
    this.ctx.fillStyle = DP_ARCADE.cabinet_edge;
    this.ctx.fillRect(screenX + 2, screenY + this.tileSize - 6, this.tileSize - 4, 4);
    
    this.ctx.fillStyle = DP_ARCADE.cabinet_screen;
    this.ctx.fillRect(screenX + 4, screenY + 4, this.tileSize - 8, Math.floor(this.tileSize / 2) - 4);
    
    this.ctx.fillStyle = DP_ARCADE.cabinet_screen_light;
    this.ctx.fillRect(screenX + 5, screenY + 5, 3, 3);
    this.ctx.fillRect(screenX + 5, screenY + 6, Math.floor(this.tileSize / 4), 2);
    
    this.ctx.fillStyle = DP_ARCADE.cabinet_screen_dark;
    this.ctx.fillRect(screenX + this.tileSize - 7, screenY + Math.floor(this.tileSize / 2) - 5, 2, 2);
    
    const isBlinkOn = this.blinkFrame < 30;
    if (isBlinkOn) {
      this.ctx.fillStyle = DP_ARCADE.neon_yellow;
      this.ctx.fillRect(screenX + 4, screenY + 3, this.tileSize - 8, 1);
    }
    
    this.ctx.fillStyle = DP_ARCADE.outline;
    this.ctx.fillRect(screenX + 4, screenY + 4, this.tileSize - 8, 1);
    this.ctx.fillRect(screenX + 4, screenY + 4, 1, Math.floor(this.tileSize / 2) - 4);
    this.ctx.fillRect(screenX + this.tileSize - 5, screenY + 4, 1, Math.floor(this.tileSize / 2) - 4);
    this.ctx.fillRect(screenX + 4, screenY + Math.floor(this.tileSize / 2) - 1, this.tileSize - 8, 1);
    
    this.ctx.fillStyle = '#333333';
    this.ctx.fillRect(screenX + 6, screenY + this.tileSize - 10, this.tileSize - 12, 4);
    
    this.ctx.fillStyle = '#555555';
    this.ctx.fillRect(screenX + 8, screenY + this.tileSize - 12, 4, 2);
    this.ctx.fillRect(screenX + this.tileSize - 12, screenY + this.tileSize - 12, 4, 2);
    
    if (machine.restricted) {
      this.ctx.fillStyle = DP_ARCADE.neon_red;
      this.ctx.fillRect(screenX + this.tileSize - 10, screenY + 6, 4, 4);
    }
    
    this.ctx.fillStyle = DP_ARCADE.shadow_cast;
    this.ctx.fillRect(screenX + this.tileSize - 2, screenY + 8, 2, this.tileSize - 10);
  }
  
  renderStairUp(screenX, screenY) {
    for (let i = 0; i < 4; i++) {
      const stepHeight = 6;
      const stepY = screenY + this.tileSize - (i + 1) * stepHeight;
      
      this.ctx.fillStyle = DP_ARCADE.stair_top;
      this.ctx.fillRect(screenX + 2, stepY, this.tileSize - 4, 2);
      
      this.ctx.fillStyle = DP_ARCADE.stair_front;
      this.ctx.fillRect(screenX + 2, stepY + 2, this.tileSize - 4, stepHeight - 3);
      
      this.ctx.fillStyle = DP_ARCADE.stair_shadow;
      this.ctx.fillRect(screenX + this.tileSize - 6, stepY + 2, 4, stepHeight - 3);
      
      this.ctx.fillStyle = DP_ARCADE.outline;
      this.ctx.fillRect(screenX + 2, stepY + stepHeight - 1, this.tileSize - 4, 1);
    }
    
    const isBlinkOn = this.blinkFrame < 30;
    if (isBlinkOn) {
      this.ctx.fillStyle = DP_ARCADE.neon_cyan;
      this.ctx.fillRect(screenX + Math.floor(this.tileSize / 2) - 4, screenY + 4, 8, 2);
      this.ctx.fillRect(screenX + Math.floor(this.tileSize / 2) - 6, screenY + 6, 12, 2);
      this.ctx.fillRect(screenX + Math.floor(this.tileSize / 2) - 4, screenY + 8, 8, 2);
    }
  }
  
  renderStairDown(screenX, screenY) {
    for (let i = 0; i < 4; i++) {
      const stepHeight = 6;
      const stepY = screenY + i * stepHeight;
      
      this.ctx.fillStyle = DP_ARCADE.stair_top;
      this.ctx.fillRect(screenX + 2, stepY, this.tileSize - 4, 2);
      
      this.ctx.fillStyle = DP_ARCADE.stair_front;
      this.ctx.fillRect(screenX + 2, stepY + 2, this.tileSize - 4, stepHeight - 3);
      
      this.ctx.fillStyle = DP_ARCADE.stair_shadow;
      this.ctx.fillRect(screenX + this.tileSize - 6, stepY + 2, 4, stepHeight - 3);
      
      this.ctx.fillStyle = DP_ARCADE.outline;
      this.ctx.fillRect(screenX + 2, stepY + stepHeight - 1, this.tileSize - 4, 1);
    }
    
    const isBlinkOn = this.blinkFrame < 30;
    if (isBlinkOn) {
      this.ctx.fillStyle = DP_ARCADE.neon_pink;
      this.ctx.fillRect(screenX + Math.floor(this.tileSize / 2) - 4, screenY + this.tileSize - 10, 8, 2);
      this.ctx.fillRect(screenX + Math.floor(this.tileSize / 2) - 6, screenY + this.tileSize - 8, 12, 2);
      this.ctx.fillRect(screenX + Math.floor(this.tileSize / 2) - 4, screenY + this.tileSize - 6, 8, 2);
    }
  }
  
  renderNPC(screenX, screenY, tile) {
    this.ctx.fillStyle = DP_ARCADE.shadow_cast;
    this.ctx.fillRect(screenX + 6, screenY + this.tileSize - 4, this.tileSize - 12, 4);
    
    const bodyWidth = 12;
    const bodyHeight = 16;
    const bodyX = screenX + Math.floor(this.tileSize / 2) - Math.floor(bodyWidth / 2);
    const bodyY = screenY + Math.floor(this.tileSize / 2);
    
    this.ctx.fillStyle = '#e0e0e0';
    this.ctx.fillRect(bodyX, bodyY, bodyWidth, bodyHeight);
    
    this.ctx.fillStyle = '#f5f5f5';
    this.ctx.fillRect(bodyX, bodyY, 3, bodyHeight);
    
    this.ctx.fillStyle = '#c0c0c0';
    this.ctx.fillRect(bodyX + bodyWidth - 3, bodyY, 3, bodyHeight);
    
    this.ctx.fillStyle = '#a0a0a0';
    this.ctx.fillRect(bodyX, bodyY + bodyHeight - 2, bodyWidth, 2);
    
    const headSize = 10;
    const headX = screenX + Math.floor(this.tileSize / 2) - Math.floor(headSize / 2);
    const headY = bodyY - headSize + 2;
    
    this.ctx.fillStyle = '#fcd34d';
    this.ctx.fillRect(headX, headY, headSize, headSize);
    
    this.ctx.fillStyle = '#fef3c7';
    this.ctx.fillRect(headX, headY, 3, headSize);
    
    this.ctx.fillStyle = '#d4a84d';
    this.ctx.fillRect(headX + headSize - 3, headY, 3, headSize);
    
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(headX + 2, headY + 4, 2, 2);
    this.ctx.fillRect(headX + 6, headY + 4, 2, 2);
    
    this.ctx.fillStyle = '#333333';
    this.ctx.fillRect(headX + 3, headY + 7, 4, 1);
    
    const isBlinkOn = this.blinkFrame < 30;
    if (isBlinkOn) {
      this.ctx.fillStyle = DP_ARCADE.neon_pink;
      this.ctx.fillRect(screenX + this.tileSize - 6, screenY + 4, 4, 4);
    }
  }
  
  renderServiceDesk(screenX, screenY) {
    this.ctx.fillStyle = DP_ARCADE.desk_top;
    this.ctx.fillRect(screenX + 2, screenY + 4, this.tileSize - 4, 6);
    
    this.ctx.fillStyle = DP_ARCADE.desk_front;
    this.ctx.fillRect(screenX + 2, screenY + 10, this.tileSize - 4, this.tileSize - 14);
    
    this.ctx.fillStyle = DP_ARCADE.desk_shadow;
    this.ctx.fillRect(screenX + this.tileSize - 6, screenY + 10, 4, this.tileSize - 14);
    
    this.ctx.fillStyle = DP_ARCADE.outline;
    this.ctx.fillRect(screenX + 2, screenY + this.tileSize - 4, this.tileSize - 4, 4);
    
    this.ctx.fillStyle = DP_ARCADE.wall_trim;
    this.ctx.fillRect(screenX + 4, screenY + 8, this.tileSize - 8, 2);
    
    this.ctx.fillStyle = DP_ARCADE.coin_gold;
    this.ctx.fillRect(screenX + Math.floor(this.tileSize / 2) - 6, screenY + Math.floor(this.tileSize / 2) - 2, 12, 12);
    
    this.ctx.fillStyle = '#ffec80';
    this.ctx.fillRect(screenX + Math.floor(this.tileSize / 2) - 6, screenY + Math.floor(this.tileSize / 2) - 2, 3, 12);
    
    this.ctx.fillStyle = DP_ARCADE.coin_shadow;
    this.ctx.fillRect(screenX + Math.floor(this.tileSize / 2) + 3, screenY + Math.floor(this.tileSize / 2) - 2, 3, 12);
    
    this.ctx.fillStyle = DP_ARCADE.outline;
    this.ctx.fillRect(screenX + Math.floor(this.tileSize / 2) - 6, screenY + Math.floor(this.tileSize / 2) - 2, 12, 1);
    this.ctx.fillRect(screenX + Math.floor(this.tileSize / 2) - 6, screenY + Math.floor(this.tileSize / 2) - 2, 1, 12);
    this.ctx.fillRect(screenX + Math.floor(this.tileSize / 2) + 5, screenY + Math.floor(this.tileSize / 2) - 2, 1, 12);
    this.ctx.fillRect(screenX + Math.floor(this.tileSize / 2) - 6, screenY + Math.floor(this.tileSize / 2) + 9, 12, 1);
    
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(screenX + Math.floor(this.tileSize / 2) - 2, screenY + Math.floor(this.tileSize / 2) + 1, 4, 6);
  }
  
  renderRestArea(screenX, screenY) {
    this.ctx.fillStyle = DP_ARCADE.bench_frame;
    this.ctx.fillRect(screenX + 4, screenY + 10, this.tileSize - 8, this.tileSize - 14);
    
    this.ctx.fillStyle = DP_ARCADE.desk_shadow;
    this.ctx.fillRect(screenX + this.tileSize - 8, screenY + 10, 4, this.tileSize - 14);
    
    this.ctx.fillStyle = DP_ARCADE.bench_seat;
    this.ctx.fillRect(screenX + 2, screenY + 6, this.tileSize - 4, 6);
    
    this.ctx.fillStyle = '#e05050';
    this.ctx.fillRect(screenX + 4, screenY + 6, this.tileSize - 8, 2);
    
    this.ctx.fillStyle = DP_ARCADE.outline;
    this.ctx.fillRect(screenX + 2, screenY + 6, this.tileSize - 4, 1);
    this.ctx.fillRect(screenX + 2, screenY + 6, 1, this.tileSize - 10);
    this.ctx.fillRect(screenX + this.tileSize - 3, screenY + 6, 1, this.tileSize - 10);
    
    this.ctx.fillStyle = DP_ARCADE.shadow_cast;
    this.ctx.fillRect(screenX + 4, screenY + this.tileSize - 2, this.tileSize - 6, 2);
  }
  
  renderDecoration(screenX, screenY, tile) {
    if (tile.warning) {
      this.ctx.fillStyle = DP_ARCADE.neon_red;
      this.ctx.fillRect(screenX + Math.floor(this.tileSize / 2) - 6, screenY + 4, 12, 4);
      this.ctx.fillRect(screenX + Math.floor(this.tileSize / 2) - 8, screenY + 8, 16, 4);
      this.ctx.fillRect(screenX + Math.floor(this.tileSize / 2) - 10, screenY + 12, 20, this.tileSize - 20);
      
      this.ctx.fillStyle = '#000000';
      this.ctx.fillRect(screenX + Math.floor(this.tileSize / 2) - 2, screenY + this.tileSize - 12, 4, 8);
      
      const isBlinkOn = this.blinkFrame < 30;
      if (isBlinkOn) {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(screenX + Math.floor(this.tileSize / 2) - 1, screenY + this.tileSize - 18, 2, 6);
      }
    } else {
      this.ctx.fillStyle = DP_ARCADE.neon_green;
      this.ctx.fillRect(screenX + Math.floor(this.tileSize / 2) - 6, screenY + 4, 12, 4);
      
      this.ctx.fillStyle = '#22c55e';
      this.ctx.fillRect(screenX + Math.floor(this.tileSize / 2) - 8, screenY + 8, 16, 8);
      this.ctx.fillRect(screenX + Math.floor(this.tileSize / 2) - 6, screenY + 16, 12, 6);
      
      this.ctx.fillStyle = '#166534';
      this.ctx.fillRect(screenX + Math.floor(this.tileSize / 2) + 4, screenY + 8, 4, 14);
      
      this.ctx.fillStyle = '#15803d';
      this.ctx.fillRect(screenX + Math.floor(this.tileSize / 2) - 2, screenY + this.tileSize - 12, 4, 12);
      
      this.ctx.fillStyle = DP_ARCADE.shadow_cast;
      this.ctx.fillRect(screenX + Math.floor(this.tileSize / 2), screenY + this.tileSize - 2, 4, 2);
    }
  }
  
  renderTileOverlay(x, y) {
    if (!this.map || !this.map[y] || !this.map[y][x]) return;
    
    const tile = this.map[y][x];
    const screenX = x * this.tileSize - this.camera.x;
    const screenY = y * this.tileSize - this.camera.y;
    
    if (tile.type === TILE_TYPES.MACHINE || tile.type === TILE_TYPES.NPC || 
        tile.type === TILE_TYPES.STAIR_UP || tile.type === TILE_TYPES.STAIR_DOWN) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      this.ctx.fillRect(screenX, screenY, this.tileSize, 1);
      this.ctx.fillRect(screenX, screenY, 1, this.tileSize);
    }
  }
  
  startAnimation() {
    const animate = (timestamp) => {
      if (timestamp - this.lastRenderTime >= 33) {
        this.render();
        this.lastRenderTime = timestamp;
      }
      this.animationFrame = requestAnimationFrame(animate);
    };
    this.animationFrame = requestAnimationFrame(animate);
  }
  
  stopAnimation() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }
  
  screenToTile(screenX, screenY) {
    return {
      x: Math.floor((screenX + this.camera.x) / this.tileSize),
      y: Math.floor((screenY + this.camera.y) / this.tileSize)
    };
  }
  
  tileToScreen(tileX, tileY) {
    return {
      x: tileX * this.tileSize - this.camera.x,
      y: tileY * this.tileSize - this.camera.y
    };
  }
}
