class ArcadeGame {
  constructor() {
    this.canvas = null;
    this.mapEngine = null;
    this.player = null;
    this.character = null;
    this.characterDialogue = null;
    this.isRunning = false;
    this.lastTime = 0;
    this.currentGame = null;
    this.isInGame = false;
    
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false,
      interact: false
    };
    
    this.touchControls = {
      joystick: { active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 },
      button: false
    };
    
    this.interactionPrompt = null;
    this.virtualJoystick = null;
    this.idleDialogueTimer = 0;
    this.idleDialogueInterval = 30000;
  }
  
  init() {
    this.setupCanvas();
    this.setupMapEngine();
    this.setupPlayer();
    this.setupCharacter();
    this.setupControls();
    this.loadState();
    this.start();
  }
  
  setupCanvas() {
    const container = document.getElementById('map-container');
    if (!container) return;
    
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'game-canvas';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    container.appendChild(this.canvas);
  }
  
  setupMapEngine() {
    if (!this.canvas) return;
    
    this.mapEngine = new MapEngine(this.canvas, {
      tileSize: TILE_SIZE,
      onInteraction: (data) => this.handleInteraction(data)
    });
    this.mapEngine.init('1F');
  }
  
  setupPlayer() {
    const spawnPos = getSpawnPosition('1F');
    
    this.player = new Player(this.mapEngine, {
      x: spawnPos.x,
      y: spawnPos.y,
      floor: '1F',
      name: window.arcadeState?.playerName || '玩家'
    });
  }
  
  setupCharacter() {
    if (!Character.hasCharacter()) {
      this.character = null;
      return;
    }
    
    const charData = Character.getCharacterData();
    if (!charData) {
      this.character = null;
      return;
    }
    
    const spawnPos = getSpawnPosition('1F');
    
    this.character = new Character(this.mapEngine, {
      x: spawnPos.x - 1,
      y: spawnPos.y + 1,
      floor: '1F',
      name: charData.name,
      avatar: charData.avatar,
      personality: charData.personality,
      background: charData.background
    });
    
    this.character.setFollowTarget(this.player);
    
    if (typeof CharacterDialogue !== 'undefined') {
      this.characterDialogue = new CharacterDialogue(this.character);
    }
  }
  
  setupControls() {
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    
    this.setupTouchControls();
  }
  
  setupTouchControls() {
    const joystick = document.getElementById('virtual-joystick');
    const joystickKnob = document.getElementById('joystick-knob');
    const actionBtn = document.getElementById('action-button');
    
    if (joystick && joystickKnob) {
      const handleStart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const touch = e.touches ? e.touches[0] : e;
        const rect = joystick.getBoundingClientRect();
        this.touchControls.joystick.active = true;
        this.touchControls.joystick.startX = rect.left + rect.width / 2;
        this.touchControls.joystick.startY = rect.top + rect.height / 2;
        this.touchControls.joystick.currentX = touch.clientX;
        this.touchControls.joystick.currentY = touch.clientY;
      };
      
      const handleMove = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!this.touchControls.joystick.active) return;
        
        const touch = e.touches ? e.touches[0] : e;
        this.touchControls.joystick.currentX = touch.clientX;
        this.touchControls.joystick.currentY = touch.clientY;
        
        const dx = this.touchControls.joystick.currentX - this.touchControls.joystick.startX;
        const dy = this.touchControls.joystick.currentY - this.touchControls.joystick.startY;
        
        const maxDist = 35;
        const dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxDist);
        const angle = Math.atan2(dy, dx);
        
        const knobX = Math.cos(angle) * dist;
        const knobY = Math.sin(angle) * dist;
        
        joystickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;
      };
      
      const handleEnd = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.touchControls.joystick.active = false;
        joystickKnob.style.transform = 'translate(0, 0)';
      };
      
      joystick.addEventListener('touchstart', handleStart, { passive: false });
      joystick.addEventListener('touchmove', handleMove, { passive: false });
      joystick.addEventListener('touchend', handleEnd, { passive: false });
      joystick.addEventListener('touchcancel', handleEnd, { passive: false });
      
      joystick.addEventListener('mousedown', handleStart);
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleEnd);
    }
    
    if (actionBtn) {
      actionBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.keys.interact = true;
        this.tryInteract();
      }, { passive: false });
      
      actionBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.keys.interact = false;
      }, { passive: false });
      
      actionBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this.keys.interact = true;
        this.tryInteract();
      });
      
      actionBtn.addEventListener('mouseup', (e) => {
        this.keys.interact = false;
      });
    }
  }
  
  handleKeyDown(e) {
    if (this.isInGame) return;
    
    const keyMap = {
      'ArrowUp': 'up',
      'ArrowDown': 'down',
      'ArrowLeft': 'left',
      'ArrowRight': 'right',
      'w': 'up',
      's': 'down',
      'a': 'left',
      'd': 'right',
      'W': 'up',
      'S': 'down',
      'A': 'left',
      'D': 'right',
      ' ': 'interact',
      'Enter': 'interact',
      'e': 'interact',
      'E': 'interact'
    };
    
    if (keyMap[e.key]) {
      e.preventDefault();
      this.keys[keyMap[e.key]] = true;
      
      if (keyMap[e.key] === 'interact') {
        this.tryInteract();
      }
    }
    
    if (e.key === 'Escape') {
      this.openMenu();
    }
  }
  
  handleKeyUp(e) {
    const keyMap = {
      'ArrowUp': 'up',
      'ArrowDown': 'down',
      'ArrowLeft': 'left',
      'ArrowRight': 'right',
      'w': 'up',
      's': 'down',
      'a': 'left',
      'd': 'right',
      'W': 'up',
      'S': 'down',
      'A': 'left',
      'D': 'right',
      ' ': 'interact',
      'Enter': 'interact',
      'e': 'interact',
      'E': 'interact'
    };
    
    if (keyMap[e.key]) {
      this.keys[keyMap[e.key]] = false;
    }
  }
  
  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.mapEngine.startAnimation();
    this.gameLoop();
  }
  
  stop() {
    this.isRunning = false;
    this.mapEngine.stopAnimation();
  }
  
  gameLoop() {
    if (!this.isRunning) return;
    
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    if (!this.isInGame) {
      this.update(deltaTime);
      this.render();
    }
    
    requestAnimationFrame(() => this.gameLoop());
  }
  
  update(deltaTime) {
    this.updatePlayerMovement(deltaTime);
    this.player.update(deltaTime);
    
    if (this.character) {
      this.character.recordPlayerMovement(this.player);
      this.character.update(deltaTime);
    }
    
    this.mapEngine.centerOnPlayer(this.player.x, this.player.y);
    
    this.updateInteractionPrompt();
    
    this.updateIdleDialogue(deltaTime);
  }
  
  updateIdleDialogue(deltaTime) {
    if (!this.characterDialogue || !this.character) return;
    
    this.idleDialogueTimer += deltaTime;
    
    if (this.idleDialogueTimer >= this.idleDialogueInterval) {
      this.idleDialogueTimer = 0;
      this.characterDialogue.onMapIdle();
    }
  }
  
  updatePlayerMovement(deltaTime) {
    if (this.player.isMoving) return;
    
    let direction = null;
    
    if (this.touchControls.joystick.active) {
      const dx = this.touchControls.joystick.currentX - this.touchControls.joystick.startX;
      const dy = this.touchControls.joystick.currentY - this.touchControls.joystick.startY;
      
      if (Math.abs(dx) > 20 || Math.abs(dy) > 20) {
        if (Math.abs(dx) > Math.abs(dy)) {
          direction = dx > 0 ? 'right' : 'left';
        } else {
          direction = dy > 0 ? 'down' : 'up';
        }
      }
    } else {
      if (this.keys.up) direction = 'up';
      else if (this.keys.down) direction = 'down';
      else if (this.keys.left) direction = 'left';
      else if (this.keys.right) direction = 'right';
    }
    
    if (direction) {
      this.player.move(direction);
    }
  }
  
  updateInteractionPrompt() {
    const interactable = this.player.getInteractableNearby();
    
    if (interactable) {
      this.showInteractionPrompt(interactable);
    } else {
      this.hideInteractionPrompt();
    }
  }
  
  showInteractionPrompt(interactable) {
    let promptEl = document.getElementById('interaction-prompt');
    
    if (!promptEl) {
      promptEl = document.createElement('div');
      promptEl.id = 'interaction-prompt';
      promptEl.className = 'interaction-prompt';
      document.getElementById('map-container').appendChild(promptEl);
    }
    
    let promptText = '';
    let promptIcon = '';
    
    if (interactable.type === TILE_TYPES.MACHINE) {
      const machine = MACHINES[interactable.machineId];
      if (machine) {
        promptText = `${machine.name} - ${machine.cost} 金幣`;
        promptIcon = '<i class="fas fa-gamepad"></i>';
      }
    } else if (interactable.type === TILE_TYPES.NPC) {
      promptText = `與 ${interactable.name} 對話`;
      promptIcon = '<i class="fas fa-comment"></i>';
    } else if (interactable.type === TILE_TYPES.STAIR_UP) {
      promptText = `前往 ${interactable.targetFloor}`;
      promptIcon = '<i class="fas fa-arrow-up"></i>';
    } else if (interactable.type === TILE_TYPES.STAIR_DOWN) {
      promptText = `前往 ${interactable.targetFloor}`;
      promptIcon = '<i class="fas fa-arrow-down"></i>';
    }
    
    promptEl.innerHTML = `${promptIcon} <span>${promptText}</span> <kbd>A</kbd>`;
    promptEl.classList.add('visible');
  }
  
  hideInteractionPrompt() {
    const promptEl = document.getElementById('interaction-prompt');
    if (promptEl) {
      promptEl.classList.remove('visible');
    }
  }
  
  tryInteract() {
    const interactable = this.player.getInteractableNearby();
    
    if (!interactable) return;
    
    if (interactable.type === TILE_TYPES.MACHINE) {
      this.startGame(interactable.machineId);
    } else if (interactable.type === TILE_TYPES.NPC) {
      this.showNPCDialogue(interactable);
    } else if (interactable.type === TILE_TYPES.STAIR_UP || interactable.type === TILE_TYPES.STAIR_DOWN) {
      this.useStairs(interactable);
    }
  }
  
  startGame(machineId) {
    const machine = MACHINES[machineId];
    if (!machine) return;
    
    if (window.coins !== undefined && window.coins < machine.cost) {
      alert(`金幣不足！需要 ${machine.cost} 金幣`);
      return;
    }
    
    this.isInGame = true;
    this.currentGame = machineId;
    
    window.openGameFromMap(machineId, machine);
  }
  
  showNPCDialogue(npc) {
    const dialogueEl = document.createElement('div');
    dialogueEl.className = 'npc-dialogue-overlay';
    
    if (npc.isAdultGate) {
      dialogueEl.innerHTML = `
        <div class="npc-dialogue-box adult-gate">
          <div class="npc-name">${npc.name}</div>
          <div class="npc-text">上面是成人遊戲間，僅限18歲以上進入。</div>
          <div class="adult-gate-buttons">
            <button class="gate-btn confirm" onclick="arcadeGame.confirmAdultGate()">好，我要進去</button>
            <button class="gate-btn cancel" onclick="arcadeGame.cancelAdultGate()">取消</button>
          </div>
        </div>
      `;
    } else {
      dialogueEl.innerHTML = `
        <div class="npc-dialogue-box">
          <div class="npc-name">${npc.name}</div>
          <div class="npc-text">${npc.dialogue}</div>
          <button class="npc-close-btn" onclick="this.parentElement.parentElement.remove()">關閉</button>
        </div>
      `;
    }
    document.body.appendChild(dialogueEl);
  }
  
  confirmAdultGate() {
    const overlay = document.querySelector('.npc-dialogue-overlay');
    if (overlay) overlay.remove();
    
    if (window.arcadeState) {
      window.arcadeState.adultModeEnabled = true;
      window.arcadeState.ageVerified = true;
      window.saveArcadeState();
    }
    
    this.player.floor = 'B1';
    this.player.x = 9;
    this.player.y = 2;
    this.player.targetX = 9;
    this.player.targetY = 2;
    
    this.mapEngine.setFloor('B1');
    this.updateFloorIndicator();
    this.saveState();
  }
  
  cancelAdultGate() {
    const overlay = document.querySelector('.npc-dialogue-overlay');
    if (overlay) overlay.remove();
  }
  
  useStairs(stair) {
    if (stair.restricted && !window.arcadeState?.adultModeEnabled) {
      this.showAgeVerificationPrompt(stair);
      return;
    }
    
    this.player.floor = stair.targetFloor;
    this.player.x = stair.targetPos.x;
    this.player.y = stair.targetPos.y;
    this.player.targetX = this.player.x;
    this.player.targetY = this.player.y;
    
    this.mapEngine.setFloor(this.player.floor);
    this.updateFloorIndicator();
    this.saveState();
  }
  
  showAgeVerificationPrompt(stair) {
    this.pendingStair = stair;
    const overlay = document.createElement('div');
    overlay.className = 'age-verification-overlay';
    overlay.innerHTML = `
      <div class="age-verification-box">
        <div class="age-warning-icon"><i class="fas fa-exclamation-triangle"></i></div>
        <h3>年齡驗證</h3>
        <p>此區域包含成人內容，僅限18歲以上進入。</p>
        <div class="age-buttons">
          <button class="age-btn confirm" onclick="arcadeGame.confirmAge()">我已已滿18歲</button>
          <button class="age-btn cancel" onclick="arcadeGame.cancelAge()">取消</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }
  
  confirmAge() {
    const overlay = document.querySelector('.age-verification-overlay');
    if (overlay) overlay.remove();
    
    if (window.arcadeState) {
      window.arcadeState.adultModeEnabled = true;
      window.arcadeState.ageVerified = true;
      window.saveArcadeState();
    }
    
    if (this.pendingStair) {
      this.player.floor = this.pendingStair.targetFloor;
      this.player.x = this.pendingStair.targetPos.x;
      this.player.y = this.pendingStair.targetPos.y;
      this.player.targetX = this.player.x;
      this.player.targetY = this.player.y;
      
      this.mapEngine.setFloor(this.player.floor);
      this.updateFloorIndicator();
      this.saveState();
      this.pendingStair = null;
    }
  }
  
  cancelAge() {
    const overlay = document.querySelector('.age-verification-overlay');
    if (overlay) overlay.remove();
  }
  
  openMenu() {
    const menuEl = document.createElement('div');
    menuEl.className = 'game-menu-overlay';
    menuEl.innerHTML = `
      <div class="game-menu">
        <h3>選單</h3>
        <div class="menu-items">
          <button onclick="arcadeGame.closeMenu(); arcadeGame.showMap();">
            <i class="fas fa-map"></i> 地圖
          </button>
          <button onclick="arcadeGame.closeMenu(); arcadeGame.showAchievements();">
            <i class="fas fa-trophy"></i> 成就
          </button>
          <button onclick="arcadeGame.closeMenu(); arcadeGame.showSettings();">
            <i class="fas fa-cog"></i> 設定
          </button>
          <button onclick="arcadeGame.closeMenu();">
            <i class="fas fa-times"></i> 關閉
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(menuEl);
  }
  
  closeMenu() {
    const menuEl = document.querySelector('.game-menu-overlay');
    if (menuEl) menuEl.remove();
  }
  
  showMap() {
    const mapEl = document.createElement('div');
    mapEl.className = 'floor-map-overlay';
    mapEl.innerHTML = `
      <div class="floor-map">
        <h3>樓層地圖</h3>
        <div class="floor-list">
          ${Object.entries(FLOOR_CONFIGS).map(([floor, config]) => `
            <div class="floor-item ${this.player.floor === floor ? 'current' : ''}" onclick="arcadeGame.goToFloor('${floor}')">
              <div class="floor-name">${floor} - ${config.name}</div>
              <div class="floor-desc">${config.description}</div>
            </div>
          `).join('')}
        </div>
        <button class="close-map-btn" onclick="this.parentElement.parentElement.remove()">關閉</button>
      </div>
    `;
    document.body.appendChild(mapEl);
  }
  
  goToFloor(floor) {
    if (floor === this.player.floor) return;
    
    const config = FLOOR_CONFIGS[floor];
    if (config.restricted && !window.arcadeState?.adultModeEnabled) {
      this.showAgeVerificationPrompt();
      return;
    }
    
    const spawnPos = getSpawnPosition(floor);
    this.player.floor = floor;
    this.player.x = spawnPos.x;
    this.player.y = spawnPos.y;
    this.player.targetX = spawnPos.x;
    this.player.targetY = spawnPos.y;
    
    this.mapEngine.setFloor(floor);
    this.updateFloorIndicator();
    
    const mapEl = document.querySelector('.floor-map-overlay');
    if (mapEl) mapEl.remove();
  }
  
  showAchievements() {
    if (window.achievementEngine) {
      window.achievementEngine.showAchievementsPanel();
    }
  }
  
  showSettings() {
    if (window.arcadeSettings) {
      window.arcadeSettings.showSettingsPanel();
    }
  }
  
  updateFloorIndicator() {
    const indicator = document.getElementById('floor-indicator');
    if (indicator) {
      const config = FLOOR_CONFIGS[this.player.floor];
      indicator.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${this.player.floor} ${config.name}`;
    }
  }
  
  onFloorChange(newFloor) {
    this.updateFloorIndicator();
    
    if (this.character) {
      this.character.floor = newFloor;
      this.character.x = this.player.x - 1;
      this.character.y = this.player.y + 1;
      this.character.targetX = this.character.x;
      this.character.targetY = this.character.y;
      this.character.pathQueue = [];
    }
    
    this.saveState();
  }
  
  endGame() {
    this.isInGame = false;
    this.currentGame = null;
  }
  
  render() {
    if (!this.mapEngine || !this.player) return;
    
    this.mapEngine.render();
    
    const ctx = this.mapEngine.ctx;
    
    if (this.character) {
      this.character.render(ctx, this.mapEngine.camera);
    }
    
    this.player.render(ctx, this.mapEngine.camera);
  }
  
  saveState() {
    if (!window.arcadeState) return;
    
    window.arcadeState.playerPosition = {
      x: this.player.x,
      y: this.player.y,
      floor: this.player.floor
    };
    
    window.saveArcadeState();
  }
  
  loadState() {
    if (!window.arcadeState?.playerPosition) return;
    
    const pos = window.arcadeState.playerPosition;
    this.player.setPosition(pos.x, pos.y, pos.floor);
    this.mapEngine.setFloor(pos.floor);
    this.updateFloorIndicator();
  }
}

let arcadeGame = null;

function initArcadeGame() {
  arcadeGame = new ArcadeGame();
  arcadeGame.init();
  window.arcadeGame = arcadeGame;
}
