class MapEngine {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.tileSize = options.tileSize || TILE_SIZE;
    this.currentFloor = '1F';
    this.map = null;
    this.camera = { x: 0, y: 0 };
    this.animationFrame = null;
    this.lastRenderTime = 0;
    this.neonPhase = 0;
    this.players = [];
    this.interactionCallback = options.onInteraction || null;
    
    this.colors = {
      floor: '#1a1a2e',
      floorAlt: '#151520',
      wall: '#16213e',
      wallTop: '#1e2a4a',
      neon: {
        yellow: '#fbbf24',
        pink: '#ec4899',
        cyan: '#22d3ee',
        purple: '#a855f7',
        red: '#ef4444',
        green: '#22c55e'
      }
    };
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
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = FLOOR_CONFIGS[this.currentFloor].color;
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
    
    this.renderNeonEffects();
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
    this.ctx.fillStyle = isAlt ? this.colors.floor : this.colors.floorAlt;
    this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
    
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(screenX, screenY, this.tileSize, this.tileSize);
  }
  
  renderWall(screenX, screenY) {
    const gradient = this.ctx.createLinearGradient(
      screenX, screenY,
      screenX, screenY + this.tileSize
    );
    gradient.addColorStop(0, this.colors.wallTop);
    gradient.addColorStop(1, this.colors.wall);
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
    
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.fillRect(screenX, screenY, this.tileSize, 2);
    
    const neonColors = [this.colors.neon.yellow, this.colors.neon.pink, this.colors.neon.cyan];
    const neonIntensity = (Math.sin(this.neonPhase + screenX * 0.01) + 1) * 0.5;
    
    this.ctx.fillStyle = neonColors[Math.floor(screenX) % 3];
    this.ctx.globalAlpha = neonIntensity * 0.3;
    this.ctx.fillRect(screenX + 2, screenY + this.tileSize - 3, this.tileSize - 4, 2);
    this.ctx.globalAlpha = 1;
  }
  
  renderMachine(screenX, screenY, machineId) {
    const machine = MACHINES[machineId];
    if (!machine) return;
    
    this.ctx.fillStyle = '#0a0a0f';
    this.ctx.fillRect(screenX + 2, screenY + 2, this.tileSize - 4, this.tileSize - 4);
    
    const screenGradient = this.ctx.createLinearGradient(
      screenX + 4, screenY + 4,
      screenX + 4, screenY + this.tileSize / 2
    );
    screenGradient.addColorStop(0, machine.color);
    screenGradient.addColorStop(1, '#000000');
    
    this.ctx.fillStyle = screenGradient;
    this.ctx.fillRect(screenX + 4, screenY + 4, this.tileSize - 8, this.tileSize / 2 - 4);
    
    const glowIntensity = (Math.sin(this.neonPhase * 2) + 1) * 0.5;
    this.ctx.shadowColor = machine.color;
    this.ctx.shadowBlur = 10 * glowIntensity;
    this.ctx.strokeStyle = machine.color;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(screenX + 4, screenY + 4, this.tileSize - 8, this.tileSize / 2 - 4);
    this.ctx.shadowBlur = 0;
    
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(screenX + 6, screenY + this.tileSize - 10, this.tileSize - 12, 8);
    
    if (machine.restricted) {
      this.ctx.fillStyle = '#ef4444';
      this.ctx.beginPath();
      this.ctx.arc(screenX + this.tileSize - 8, screenY + 8, 4, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
  
  renderStairUp(screenX, screenY) {
    this.ctx.fillStyle = '#2a2a3a';
    
    for (let i = 0; i < 4; i++) {
      const stepHeight = 6;
      const stepY = screenY + this.tileSize - (i + 1) * stepHeight;
      this.ctx.fillRect(screenX + 2, stepY, this.tileSize - 4, stepHeight - 1);
    }
    
    this.ctx.fillStyle = this.colors.neon.cyan;
    this.ctx.globalAlpha = (Math.sin(this.neonPhase) + 1) / 2 * 0.5 + 0.5;
    this.ctx.beginPath();
    this.ctx.moveTo(screenX + this.tileSize / 2, screenY + 4);
    this.ctx.lineTo(screenX + this.tileSize - 6, screenY + 12);
    this.ctx.lineTo(screenX + 6, screenY + 12);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.globalAlpha = 1;
  }
  
  renderStairDown(screenX, screenY) {
    this.ctx.fillStyle = '#1a1a2a';
    
    for (let i = 0; i < 4; i++) {
      const stepHeight = 6;
      const stepY = screenY + i * stepHeight;
      this.ctx.fillRect(screenX + 2, stepY, this.tileSize - 4, stepHeight - 1);
    }
    
    this.ctx.fillStyle = this.colors.neon.pink;
    this.ctx.globalAlpha = (Math.sin(this.neonPhase) + 1) / 2 * 0.5 + 0.5;
    this.ctx.beginPath();
    this.ctx.moveTo(screenX + this.tileSize / 2, screenY + this.tileSize - 4);
    this.ctx.lineTo(screenX + this.tileSize - 6, screenY + this.tileSize - 12);
    this.ctx.lineTo(screenX + 6, screenY + this.tileSize - 12);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.globalAlpha = 1;
  }
  
  renderNPC(screenX, screenY, tile) {
    this.ctx.fillStyle = '#4a4a6a';
    this.ctx.beginPath();
    this.ctx.ellipse(
      screenX + this.tileSize / 2,
      screenY + this.tileSize - 8,
      this.tileSize / 3,
      this.tileSize / 4,
      0, 0, Math.PI * 2
    );
    this.ctx.fill();
    
    this.ctx.fillStyle = '#e0e0e0';
    this.ctx.beginPath();
    this.ctx.arc(
      screenX + this.tileSize / 2,
      screenY + this.tileSize / 3,
      this.tileSize / 4,
      0, Math.PI * 2
    );
    this.ctx.fill();
    
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(screenX + this.tileSize / 4, screenY + this.tileSize / 3 + 2, this.tileSize / 8, 3);
    this.ctx.fillRect(screenX + this.tileSize / 2, screenY + this.tileSize / 3 + 2, this.tileSize / 8, 3);
    
    this.ctx.fillStyle = this.colors.neon.pink;
    this.ctx.globalAlpha = (Math.sin(this.neonPhase * 1.5) + 1) / 2 * 0.8 + 0.2;
    this.ctx.beginPath();
    this.ctx.arc(
      screenX + this.tileSize - 4,
      screenY + 4,
      3, 0, Math.PI * 2
    );
    this.ctx.fill();
    this.ctx.globalAlpha = 1;
  }
  
  renderServiceDesk(screenX, screenY) {
    this.ctx.fillStyle = '#2a3a4a';
    this.ctx.fillRect(screenX + 2, screenY + 4, this.tileSize - 4, this.tileSize - 8);
    
    this.ctx.fillStyle = this.colors.neon.yellow;
    this.ctx.fillRect(screenX + 4, screenY + 6, this.tileSize - 8, 4);
    
    this.ctx.fillStyle = '#ffd700';
    this.ctx.beginPath();
    this.ctx.arc(screenX + this.tileSize / 2, screenY + this.tileSize / 2 + 2, 6, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#000';
    this.ctx.font = 'bold 8px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('$', screenX + this.tileSize / 2, screenY + this.tileSize / 2 + 5);
  }
  
  renderRestArea(screenX, screenY) {
    this.ctx.fillStyle = '#2a2a3a';
    this.ctx.fillRect(screenX + 4, screenY + 8, this.tileSize - 8, this.tileSize - 12);
    
    this.ctx.fillStyle = '#3a3a4a';
    this.ctx.fillRect(screenX + 2, screenY + 4, this.tileSize - 4, 6);
  }
  
  renderDecoration(screenX, screenY, tile) {
    if (tile.warning) {
      this.ctx.fillStyle = '#ef4444';
      this.ctx.globalAlpha = (Math.sin(this.neonPhase * 3) + 1) / 2 * 0.5 + 0.5;
      this.ctx.beginPath();
      this.ctx.moveTo(screenX + this.tileSize / 2, screenY + 4);
      this.ctx.lineTo(screenX + this.tileSize - 4, screenY + this.tileSize - 4);
      this.ctx.lineTo(screenX + 4, screenY + this.tileSize - 4);
      this.ctx.closePath();
      this.ctx.fill();
      
      this.ctx.fillStyle = '#000';
      this.ctx.font = 'bold 16px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('!', screenX + this.tileSize / 2, screenY + this.tileSize - 8);
      this.ctx.globalAlpha = 1;
    } else {
      this.ctx.fillStyle = '#22c55e';
      this.ctx.beginPath();
      this.ctx.ellipse(screenX + this.tileSize / 2, screenY + this.tileSize - 8, 8, 12, 0, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#166534';
      this.ctx.fillRect(screenX + this.tileSize / 2 - 1, screenY + this.tileSize - 20, 2, 12);
    }
  }
  
  renderTileOverlay(x, y) {
    if (!this.map || !this.map[y] || !this.map[y][x]) return;
    
    const tile = this.map[y][x];
    const screenX = x * this.tileSize - this.camera.x;
    const screenY = y * this.tileSize - this.camera.y;
    
    if (tile.type === TILE_TYPES.MACHINE || tile.type === TILE_TYPES.NPC || 
        tile.type === TILE_TYPES.STAIR_UP || tile.type === TILE_TYPES.STAIR_DOWN) {
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(screenX, screenY, this.tileSize, this.tileSize);
    }
  }
  
  renderNeonEffects() {
    this.neonPhase += 0.05;
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
