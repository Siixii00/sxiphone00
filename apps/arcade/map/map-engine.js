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
        yellowLight: '#ffd54f',
        yellowDark: '#f9a825',
        pink: '#ec4899',
        pinkLight: '#f472b6',
        pinkDark: '#db2777',
        cyan: '#22d3ee',
        cyanLight: '#67e8f9',
        cyanDark: '#06b6d4',
        purple: '#a855f7',
        purpleLight: '#c084fc',
        purpleDark: '#9333ea',
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
    const baseColor = isAlt ? this.colors.floor : this.colors.floorAlt;
    
    this.ctx.fillStyle = baseColor;
    this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
    
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    this.ctx.fillRect(screenX, screenY, this.tileSize, 2);
    this.ctx.fillRect(screenX, screenY, 2, this.tileSize);
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    this.ctx.fillRect(screenX, screenY + this.tileSize - 2, this.tileSize, 2);
    this.ctx.fillRect(screenX + this.tileSize - 2, screenY, 2, this.tileSize);
    
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    this.ctx.fillRect(screenX + 2, screenY + 2, 4, 4);
  }
  
  renderWall(screenX, screenY) {
    const topColor = '#2a3a5a';
    const frontColor = '#1e2a4a';
    const shadowColor = '#16213e';
    const depthColor = '#0a0a1a';
    
    this.ctx.fillStyle = topColor;
    this.ctx.fillRect(screenX, screenY, this.tileSize, 6);
    
    this.ctx.fillStyle = frontColor;
    this.ctx.fillRect(screenX, screenY + 6, this.tileSize, this.tileSize - 10);
    
    this.ctx.fillStyle = shadowColor;
    this.ctx.fillRect(screenX + this.tileSize - 4, screenY + 6, 4, this.tileSize - 10);
    
    this.ctx.fillStyle = depthColor;
    this.ctx.fillRect(screenX, screenY + this.tileSize - 4, this.tileSize, 4);
    
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    this.ctx.fillRect(screenX, screenY, 3, this.tileSize);
    
    const neonColors = [this.colors.neon.yellow, this.colors.neon.pink, this.colors.neon.cyan];
    const neonIntensity = (Math.sin(this.neonPhase + screenX * 0.01) + 1) * 0.5;
    
    this.ctx.fillStyle = neonColors[Math.floor(screenX) % 3];
    this.ctx.globalAlpha = neonIntensity * 0.4;
    this.ctx.fillRect(screenX + 2, screenY + this.tileSize - 3, this.tileSize - 4, 2);
    this.ctx.globalAlpha = neonIntensity * 0.2;
    this.ctx.fillRect(screenX + 1, screenY + this.tileSize - 5, this.tileSize - 2, 1);
    this.ctx.globalAlpha = 1;
  }
  
  renderMachine(screenX, screenY, machineId) {
    const machine = MACHINES[machineId];
    if (!machine) return;
    
    const shellTop = '#1a1a2a';
    const shellFront = '#0a0a0f';
    const shellShadow = '#050508';
    const shellDepth = '#020204';
    
    this.ctx.fillStyle = shellTop;
    this.ctx.fillRect(screenX + 2, screenY + 2, this.tileSize - 4, 4);
    
    this.ctx.fillStyle = shellFront;
    this.ctx.fillRect(screenX + 2, screenY + 6, this.tileSize - 4, this.tileSize - 12);
    
    this.ctx.fillStyle = shellShadow;
    this.ctx.fillRect(screenX + this.tileSize - 6, screenY + 6, 4, this.tileSize - 12);
    
    this.ctx.fillStyle = shellDepth;
    this.ctx.fillRect(screenX + 2, screenY + this.tileSize - 6, this.tileSize - 4, 4);
    
    const screenGradient = this.ctx.createLinearGradient(
      screenX + 4, screenY + 4,
      screenX + 4, screenY + this.tileSize / 2
    );
    screenGradient.addColorStop(0, machine.color);
    screenGradient.addColorStop(1, '#000000');
    
    this.ctx.fillStyle = screenGradient;
    this.ctx.fillRect(screenX + 4, screenY + 4, this.tileSize - 8, this.tileSize / 2 - 4);
    
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    this.ctx.fillRect(screenX + 5, screenY + 5, 3, 3);
    this.ctx.fillRect(screenX + 5, screenY + 6, this.tileSize / 4, 2);
    
    const glowIntensity = (Math.sin(this.neonPhase * 2) + 1) * 0.5;
    this.ctx.shadowColor = machine.color;
    this.ctx.shadowBlur = 10 * glowIntensity;
    this.ctx.strokeStyle = machine.color;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(screenX + 4, screenY + 4, this.tileSize - 8, this.tileSize / 2 - 4);
    this.ctx.shadowBlur = 0;
    
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(screenX + 6, screenY + this.tileSize - 10, this.tileSize - 12, 4);
    
    this.ctx.fillStyle = '#555';
    this.ctx.fillRect(screenX + 8, screenY + this.tileSize - 12, 4, 2);
    this.ctx.fillRect(screenX + this.tileSize - 12, screenY + this.tileSize - 12, 4, 2);
    
    if (machine.restricted) {
      this.ctx.fillStyle = '#ef4444';
      this.ctx.fillRect(screenX + this.tileSize - 10, screenY + 6, 4, 4);
    }
  }
  
  renderStairUp(screenX, screenY) {
    const stepTop = '#3a3a4a';
    const stepFront = '#2a2a3a';
    const stepShadow = '#1a1a2a';
    
    for (let i = 0; i < 4; i++) {
      const stepHeight = 6;
      const stepY = screenY + this.tileSize - (i + 1) * stepHeight;
      
      this.ctx.fillStyle = stepTop;
      this.ctx.fillRect(screenX + 2, stepY, this.tileSize - 4, 2);
      
      this.ctx.fillStyle = stepFront;
      this.ctx.fillRect(screenX + 2, stepY + 2, this.tileSize - 4, stepHeight - 3);
      
      this.ctx.fillStyle = stepShadow;
      this.ctx.fillRect(screenX + this.tileSize - 6, stepY + 2, 4, stepHeight - 3);
    }
    
    this.ctx.fillStyle = this.colors.neon.cyan;
    this.ctx.globalAlpha = (Math.sin(this.neonPhase) + 1) / 2 * 0.5 + 0.5;
    
    this.ctx.fillRect(screenX + this.tileSize / 2 - 4, screenY + 4, 8, 2);
    this.ctx.fillRect(screenX + this.tileSize / 2 - 6, screenY + 6, 12, 2);
    this.ctx.fillRect(screenX + this.tileSize / 2 - 4, screenY + 8, 8, 2);
    
    this.ctx.globalAlpha = 1;
  }
  
  renderStairDown(screenX, screenY) {
    const stepTop = '#2a2a3a';
    const stepFront = '#1a1a2a';
    const stepShadow = '#0a0a1a';
    
    for (let i = 0; i < 4; i++) {
      const stepHeight = 6;
      const stepY = screenY + i * stepHeight;
      
      this.ctx.fillStyle = stepTop;
      this.ctx.fillRect(screenX + 2, stepY, this.tileSize - 4, 2);
      
      this.ctx.fillStyle = stepFront;
      this.ctx.fillRect(screenX + 2, stepY + 2, this.tileSize - 4, stepHeight - 3);
      
      this.ctx.fillStyle = stepShadow;
      this.ctx.fillRect(screenX + this.tileSize - 6, stepY + 2, 4, stepHeight - 3);
    }
    
    this.ctx.fillStyle = this.colors.neon.pink;
    this.ctx.globalAlpha = (Math.sin(this.neonPhase) + 1) / 2 * 0.5 + 0.5;
    
    this.ctx.fillRect(screenX + this.tileSize / 2 - 4, screenY + this.tileSize - 10, 8, 2);
    this.ctx.fillRect(screenX + this.tileSize / 2 - 6, screenY + this.tileSize - 8, 12, 2);
    this.ctx.fillRect(screenX + this.tileSize / 2 - 4, screenY + this.tileSize - 6, 8, 2);
    
    this.ctx.globalAlpha = 1;
  }
  
  renderNPC(screenX, screenY, tile) {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    this.ctx.beginPath();
    this.ctx.ellipse(
      screenX + this.tileSize / 2,
      screenY + this.tileSize - 4,
      this.tileSize / 3,
      this.tileSize / 5,
      0, 0, Math.PI * 2
    );
    this.ctx.fill();
    
    const bodyWidth = 12;
    const bodyHeight = 16;
    const bodyX = screenX + this.tileSize / 2 - bodyWidth / 2;
    const bodyY = screenY + this.tileSize / 2;
    
    this.ctx.fillStyle = '#e0e0e0';
    this.ctx.fillRect(bodyX, bodyY, bodyWidth, bodyHeight);
    
    this.ctx.fillStyle = '#f5f5f5';
    this.ctx.fillRect(bodyX, bodyY, 3, bodyHeight);
    
    this.ctx.fillStyle = '#c0c0c0';
    this.ctx.fillRect(bodyX + bodyWidth - 3, bodyY, 3, bodyHeight);
    
    this.ctx.fillStyle = '#a0a0a0';
    this.ctx.fillRect(bodyX, bodyY + bodyHeight - 2, bodyWidth, 2);
    
    const headSize = 10;
    const headX = screenX + this.tileSize / 2 - headSize / 2;
    const headY = bodyY - headSize + 2;
    
    this.ctx.fillStyle = '#fcd34d';
    this.ctx.fillRect(headX, headY, headSize, headSize);
    
    this.ctx.fillStyle = '#fef3c7';
    this.ctx.fillRect(headX, headY, 3, headSize);
    
    this.ctx.fillStyle = '#d4a84d';
    this.ctx.fillRect(headX + headSize - 3, headY, 3, headSize);
    
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(headX + 2, headY + 4, 2, 2);
    this.ctx.fillRect(headX + 6, headY + 4, 2, 2);
    
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(headX + 3, headY + 7, 4, 1);
    
    this.ctx.fillStyle = this.colors.neon.pink;
    this.ctx.globalAlpha = (Math.sin(this.neonPhase * 1.5) + 1) / 2 * 0.8 + 0.2;
    this.ctx.fillRect(screenX + this.tileSize - 6, screenY + 4, 4, 4);
    this.ctx.globalAlpha = 1;
  }
  
  renderServiceDesk(screenX, screenY) {
    const topColor = '#3a4a5a';
    const frontColor = '#2a3a4a';
    const shadowColor = '#1a2a3a';
    const depthColor = '#0a1a2a';
    
    this.ctx.fillStyle = topColor;
    this.ctx.fillRect(screenX + 2, screenY + 4, this.tileSize - 4, 4);
    
    this.ctx.fillStyle = frontColor;
    this.ctx.fillRect(screenX + 2, screenY + 8, this.tileSize - 4, this.tileSize - 12);
    
    this.ctx.fillStyle = shadowColor;
    this.ctx.fillRect(screenX + this.tileSize - 6, screenY + 8, 4, this.tileSize - 12);
    
    this.ctx.fillStyle = depthColor;
    this.ctx.fillRect(screenX + 2, screenY + this.tileSize - 4, this.tileSize - 4, 4);
    
    this.ctx.fillStyle = this.colors.neon.yellow;
    this.ctx.fillRect(screenX + 4, screenY + 6, this.tileSize - 8, 2);
    
    this.ctx.fillStyle = '#ffd700';
    this.ctx.fillRect(screenX + this.tileSize / 2 - 6, screenY + this.tileSize / 2 - 2, 12, 12);
    
    this.ctx.fillStyle = '#ffec80';
    this.ctx.fillRect(screenX + this.tileSize / 2 - 6, screenY + this.tileSize / 2 - 2, 3, 12);
    
    this.ctx.fillStyle = '#c9a000';
    this.ctx.fillRect(screenX + this.tileSize / 2 + 3, screenY + this.tileSize / 2 - 2, 3, 12);
    
    this.ctx.fillStyle = '#000';
    this.ctx.font = 'bold 8px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('$', screenX + this.tileSize / 2, screenY + this.tileSize / 2 + 7);
  }
  
  renderRestArea(screenX, screenY) {
    const topColor = '#3a3a4a';
    const frontColor = '#2a2a3a';
    const shadowColor = '#1a1a2a';
    
    this.ctx.fillStyle = topColor;
    this.ctx.fillRect(screenX + 4, screenY + 8, this.tileSize - 8, 4);
    
    this.ctx.fillStyle = frontColor;
    this.ctx.fillRect(screenX + 4, screenY + 12, this.tileSize - 8, this.tileSize - 16);
    
    this.ctx.fillStyle = shadowColor;
    this.ctx.fillRect(screenX + this.tileSize - 8, screenY + 12, 4, this.tileSize - 16);
    
    this.ctx.fillStyle = '#4a4a5a';
    this.ctx.fillRect(screenX + 2, screenY + 4, this.tileSize - 4, 4);
    
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.fillRect(screenX + 4, screenY + 4, this.tileSize - 8, 2);
  }
  
  renderDecoration(screenX, screenY, tile) {
    if (tile.warning) {
      this.ctx.fillStyle = '#ef4444';
      this.ctx.globalAlpha = (Math.sin(this.neonPhase * 3) + 1) / 2 * 0.5 + 0.5;
      
      this.ctx.fillRect(screenX + this.tileSize / 2 - 6, screenY + 4, 12, 4);
      this.ctx.fillRect(screenX + this.tileSize / 2 - 8, screenY + 8, 16, 4);
      this.ctx.fillRect(screenX + this.tileSize / 2 - 10, screenY + 12, 20, this.tileSize - 20);
      
      this.ctx.fillStyle = '#000';
      this.ctx.font = 'bold 14px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('!', screenX + this.tileSize / 2, screenY + this.tileSize - 8);
      this.ctx.globalAlpha = 1;
    } else {
      const topColor = '#4ade80';
      const frontColor = '#22c55e';
      const shadowColor = '#166534';
      
      this.ctx.fillStyle = topColor;
      this.ctx.fillRect(screenX + this.tileSize / 2 - 6, screenY + 4, 12, 4);
      
      this.ctx.fillStyle = frontColor;
      this.ctx.fillRect(screenX + this.tileSize / 2 - 8, screenY + 8, 16, 8);
      this.ctx.fillRect(screenX + this.tileSize / 2 - 6, screenY + 16, 12, 6);
      
      this.ctx.fillStyle = shadowColor;
      this.ctx.fillRect(screenX + this.tileSize / 2 + 4, screenY + 8, 4, 14);
      
      this.ctx.fillStyle = '#15803d';
      this.ctx.fillRect(screenX + this.tileSize / 2 - 2, screenY + this.tileSize - 12, 4, 12);
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
