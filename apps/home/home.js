(function (global) {
  'use strict';

  const SAVE_KEY = 'sx_home_data';
  const DEFAULT_PIN = '1234';

  const HomeApp = {
    mapEngine: null,
    player: null,
    building: null,
    teleport: null,
    dialogue: null,
    currentView: 'world',
    isInitialized: false,
    animFrame: 0,
    lastFrameTime: 0,
    targetFPS: 30,
    worldMap: null,
    discoveredRegions: new Set(['residential']),
    currentRegion: 'residential',
    pendingPurchase: null,
    roomEditMode: false,
    selectedFurniture: null,
    editCursorX: 5,
    editCursorY: 5,
    selectedSpriteId: 'default',
    selectedSpriteColors: null,
    customSpriteImage: null,

    init() {
      if (this.isInitialized) return;

      const worldCanvas = document.getElementById('world-canvas');
      const miniCanvas = document.getElementById('minimap-canvas');
      const dialogueContainer = document.getElementById('dialogue-container');
      const teleportOverlay = document.getElementById('teleport-overlay');
      const teleportMapCanvas = document.getElementById('teleport-map-canvas');
      const teleportInfo = document.getElementById('teleport-info');

      this._resizeWorldCanvas(worldCanvas);
      window.addEventListener('resize', () => this._resizeWorldCanvas(worldCanvas));

      this.worldMap = HomeData.generateWorldMap();
      this.mapEngine = new WorldMapEngine(worldCanvas, this.worldMap);
      this.dialogue = new DialogueSystem(dialogueContainer);
      this.player = new WorldPlayer({ mapData: this.worldMap });

      this.building = new HomeBuildingSystem({
        dialogue: this.dialogue,
        onEnterBuilding: (buildingId) => this.switchToRoom(buildingId),
        onNeedPurchase: (building) => this.openBuyModal(building),
        onOpenShop: () => this.openShopModal(),
        onOpenMirror: () => this.openMirrorModal()
      });
      this.player.setBuildingFootprints(this.building.getBuildingFootprints());

      this.teleport = new HomeTeleportSystem({
        overlayEl: teleportOverlay,
        mapCanvas: teleportMapCanvas,
        infoEl: teleportInfo,
        dialogue: this.dialogue,
        onUnlock: (tp) => {
          this.discoveredRegions.add(tp.region);
          this.saveGame();
        },
        onTeleport: (point) => {
          this._playTeleportEffect(() => {
            this.player.x = point.x;
            this.player.y = point.y;
            this.player.targetX = point.x;
            this.player.targetY = point.y;
            this.mapEngine.centerOnPlayer(point.x, point.y);
            this._updateRegionState();
          });
        }
      });

      this.loadGame();
      this.bindEvents(miniCanvas);
      this._introThenStart();
      this.updateBalance();
      this._updateRegionState(true);

      window.addEventListener('message', (event) => {
        if (event?.data?.type === 'APP_WILL_CLOSE') this.saveGame();
      });

      if (typeof onLanguageChange === 'function') {
        onLanguageChange(() => this._refreshLocalizedLabels());
      }
      this._refreshLocalizedLabels();

      this.isInitialized = true;
      global.HomeApp = this;
    },

    bindEvents(miniCanvas) {
      const btnMap = document.getElementById('btn-map');
      const btnRun = document.getElementById('btn-run');
      const btnAction = document.getElementById('btn-action');
      const btnCloseTeleport = document.getElementById('btn-close-teleport');
      const btnRoomBack = document.getElementById('btn-room-back');
      const btnMenu = document.getElementById('btn-menu');
      const btnRoomEdit = document.getElementById('btn-room-edit');

      btnMap?.addEventListener('click', () => this.teleport.open({ x: this.player.x, y: this.player.y }));
      btnCloseTeleport?.addEventListener('click', () => this.teleport.close());
      btnRoomBack?.addEventListener('click', () => this.switchToWorld());
      btnMenu?.addEventListener('click', () => this._toggleSettingsModal(true));
      document.getElementById('btn-settings-close')?.addEventListener('click', () => this._toggleSettingsModal(false));

      btnRun?.addEventListener('pointerdown', () => { this.player.isRunning = true; });
      btnRun?.addEventListener('pointerup', () => { this.player.isRunning = false; });
      btnRun?.addEventListener('pointercancel', () => { this.player.isRunning = false; });

      btnAction?.addEventListener('click', () => this.building.interact(this.player));

      btnRoomEdit?.addEventListener('click', () => this._toggleRoomEditMode());

      this._bindJoystick();
      this._bindKeyboard();
      this._bindPurchaseModal();
      this._bindShopModal();
      this._bindMirrorModal();
      this._bindRoomCanvas();

      miniCanvas.addEventListener('click', () => this.teleport.open({ x: this.player.x, y: this.player.y }));

      document.getElementById('btn-room-save')?.addEventListener('click', () => {
        this.saveGame();
        this.dialogue.show('系統', '室內配置已儲存。');
      });
      document.getElementById('btn-room-store')?.addEventListener('click', () => this.openShopModal());
    },

    _bindRoomCanvas() {
      const canvas = document.getElementById('room-canvas');
      if (!canvas) return;
      canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const ts = 48;
        const x = Math.floor((e.clientX - rect.left) / ts);
        const y = Math.floor((e.clientY - rect.top) / ts);
        
        if (this.roomEditMode) {
          this._placeFurnitureAt(x, y);
        } else {
          this._interactWithFurnitureAt(x, y);
        }
      });
    },

    _interactWithFurnitureAt(x, y) {
      const roomKey = this.building.roomState.currentRoom;
      const items = this.building.roomState.furnitureByRoom[roomKey] || [];
      for (const item of items) {
        if (item.x === x && item.y === y && item.id === 'mirror') {
          this.openMirrorModal();
          return;
        }
      }
    },

    _toggleRoomEditMode() {
      this.roomEditMode = !this.roomEditMode;
      const btn = document.getElementById('btn-room-edit');
      if (this.roomEditMode) {
        btn.textContent = 'DONE';
        btn.classList.add('active');
        this._showFurnitureSelector();
      } else {
        btn.textContent = 'EDIT';
        btn.classList.remove('active');
        this.selectedFurniture = null;
        this._renderRoom();
      }
    },

    _showFurnitureSelector() {
      const owned = this.building.roomState.ownedFurniture || {};
      const available = Object.entries(owned).filter(([id, count]) => count > 0);
      if (available.length === 0) {
        this.dialogue.show('系統', '沒有可放置的家具，請先購買。');
        this._toggleRoomEditMode();
        return;
      }
      const item = available[0][0];
      this.selectedFurniture = item;
      this.editCursorX = 5;
      this.editCursorY = 5;
      this.dialogue.show('系統', '點擊格子放置家具，再按 EDIT 結束。');
      this._renderRoom();
    },

    _placeFurnitureAt(x, y) {
      if (!this.selectedFurniture) return;
      const roomKey = this.building.roomState.currentRoom;
      if (!this.building.roomState.furnitureByRoom[roomKey]) {
        this.building.roomState.furnitureByRoom[roomKey] = [];
      }
      const owned = this.building.roomState.ownedFurniture || {};
      if ((owned[this.selectedFurniture] || 0) <= 0) {
        this.dialogue.show('系統', '庫存不足！');
        return;
      }
      this.building.roomState.furnitureByRoom[roomKey].push({
        id: this.selectedFurniture,
        x: x,
        y: y
      });
      this.building.roomState.ownedFurniture[this.selectedFurniture]--;
      this._renderRoom();
      this.saveGame();
    },

    gameLoop(timestamp) {
      const frameInterval = 1000 / this.targetFPS;
      if (timestamp - this.lastFrameTime < frameInterval) {
        requestAnimationFrame((ts) => this.gameLoop(ts));
        return;
      }
      this.lastFrameTime = timestamp;

      if (this.currentView === 'world') {
        this.player.update();
        this.teleport.unlockAt(this.player.x, this.player.y);
        this.mapEngine.centerOnPlayer(this.player.getRenderPos().x, this.player.getRenderPos().y);
        this.mapEngine.render(this.player, this._ownedBuildingMap());
        this._renderMinimap();
        this._updateInteractionButton();
        this._updateRegionState();
      } else {
        this._renderRoom();
      }

      this.animFrame += 1;
      requestAnimationFrame((ts) => this.gameLoop(ts));
    },

    switchToRoom(buildingId) {
      this._fadeTransition(() => {
        this.currentView = 'room';
        this.building.roomState.currentBuildingId = buildingId;
        document.getElementById('world-view')?.classList.add('hidden');
        document.getElementById('room-view')?.classList.remove('hidden');
        const b = HomeData.BUILDINGS.find((x) => x.id === buildingId);
        document.getElementById('room-title').textContent = b ? b.name : 'ROOM';
        this._renderRoomTabs();
      });
    },

    switchToWorld() {
      this._fadeTransition(() => {
        this.currentView = 'world';
        document.getElementById('room-view')?.classList.add('hidden');
        document.getElementById('world-view')?.classList.remove('hidden');
      });
    },

    saveGame() {
      const data = {
        world: {
          playerPosition: { x: this.player.x, y: this.player.y },
          playerDirection: this.player.direction,
          currentRegion: this.currentRegion,
          discoveredRegions: Array.from(this.discoveredRegions)
        },
        properties: Array.from(this.building.ownedBuildingIds),
        teleportPoints: this.teleport.points.map((p) => ({ id: p.id, unlocked: p.unlocked })),
        roomState: this.building.roomState
      };
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) {}
    },

    loadGame() {
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return;
        const data = JSON.parse(raw);
        if (data?.world?.playerPosition) {
          const p = data.world.playerPosition;
          this.player.x = p.x; this.player.y = p.y;
          this.player.targetX = p.x; this.player.targetY = p.y;
          this.player.direction = data.world.playerDirection || 'down';
          this.currentRegion = data.world.currentRegion || this.currentRegion;
          this.discoveredRegions = new Set(data.world.discoveredRegions || ['residential']);
        }
        if (Array.isArray(data?.properties)) this.building.ownedBuildingIds = new Set(data.properties);
        if (Array.isArray(data?.teleportPoints)) {
          for (let i = 0; i < data.teleportPoints.length; i++) {
            const savedPoint = data.teleportPoints[i];
            const point = this.teleport.points.find((p) => p.id === savedPoint.id);
            if (point) point.unlocked = !!savedPoint.unlocked;
          }
        }
        if (data?.roomState) {
        const saved = data.roomState;
        if (saved.ownedFurniture) {
          this.building.roomState.ownedFurniture = { ...this.building.roomState.ownedFurniture, ...saved.ownedFurniture };
        }
        if (saved.furnitureByRoom) {
          Object.keys(saved.furnitureByRoom).forEach((key) => {
            if (!this.building.roomState.furnitureByRoom[key]) {
              this.building.roomState.furnitureByRoom[key] = [];
            }
            const savedItems = saved.furnitureByRoom[key] || [];
            const existingIds = new Set(this.building.roomState.furnitureByRoom[key].map(i => `${i.id}-${i.x}-${i.y}`));
            savedItems.forEach((item) => {
              if (!existingIds.has(`${item.id}-${item.x}-${item.y}`)) {
                this.building.roomState.furnitureByRoom[key].push(item);
              }
            });
          });
        }
        this.building.roomState.currentBuildingId = saved.currentBuildingId || null;
        this.building.roomState.currentRoom = saved.currentRoom || 'living_room';
        if (saved.playerSpriteColors) {
          this.player.setSpriteColors(saved.playerSpriteColors);
          this.selectedSpriteId = saved.playerSpriteId || 'default';
          this.selectedSpriteColors = saved.playerSpriteColors;
        }
      }
      
      const bedroomItems = this.building.roomState.furnitureByRoom['bedroom'] || [];
      const hasMirror = bedroomItems.some(item => item.id === 'mirror');
      if (!hasMirror) {
        this.building.roomState.furnitureByRoom['bedroom'].push({ id: 'mirror', x: 2, y: 3 });
      }
      } catch (e) {}
    },

    getBalance() {
      const raw = localStorage.getItem('sxiphone.kakaopay.ledger.v1');
      if (!raw) return 0;
      try {
        const ledger = JSON.parse(raw);
        if (Array.isArray(ledger)) return ledger.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
        if (Array.isArray(ledger.transactions)) return ledger.transactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
        if (typeof ledger.balance === 'number') return ledger.balance;
      } catch (e) {}
      return 0;
    },

    updateBalance() {
      const el = document.getElementById('hud-balance');
      if (el) el.textContent = String(this.getBalance());
    },

    openBuyModal(building) {
      this.pendingPurchase = building;
      const modal = document.getElementById('buy-modal');
      modal.classList.remove('hidden');
      document.getElementById('buy-name').textContent = building.name;
      document.getElementById('buy-price').textContent = `G ${building.price}`;
      this._renderBuyPreview(building);
    },

    openShopModal() {
      const modal = document.getElementById('shop-modal');
      const list = document.getElementById('shop-list');
      list.innerHTML = '';
      const ownedFurniture = this.building.roomState.ownedFurniture || {};
      HomeData.FURNITURE_CATALOG.forEach((item) => {
        const owned = ownedFurniture[item.id] || 0;
        const row = document.createElement('div');
        row.className = 'shop-item';
        row.innerHTML = `<span>${item.name}</span><span>庫存: ${owned}</span><span>G ${item.price}</span>`;
        row.addEventListener('click', () => this._buyFurniture(item));
        list.appendChild(row);
      });
      modal.classList.remove('hidden');
    },

    _buyFurniture(item) {
      const balance = this.getBalance();
      if (balance < item.price) {
        this.dialogue.show('店員', '餘額不足！');
        return;
      }
      if (!this.building.roomState.ownedFurniture) {
        this.building.roomState.ownedFurniture = {};
      }
      this.building.roomState.ownedFurniture[item.id] = (this.building.roomState.ownedFurniture[item.id] || 0) + 1;
      this._deductMoney(item.price);
      this.dialogue.show('店員', `已購買 ${item.name}！可在房間內放置。`);
      this.openShopModal();
      this.saveGame();
    },

    _deductMoney(amount) {
      try {
        const raw = localStorage.getItem('sxiphone.kakaopay.ledger.v1');
        let ledger = raw ? JSON.parse(raw) : { transactions: [], balance: 0 };
        if (Array.isArray(ledger)) {
          ledger = { transactions: ledger, balance: ledger.reduce((s, t) => s + Number(t.amount || 0), 0) };
        }
        ledger.transactions = ledger.transactions || [];
        ledger.transactions.push({ type: 'expense', amount: -amount, desc: '家具購買', date: new Date().toISOString() });
        ledger.balance = (ledger.balance || 0) - amount;
        localStorage.setItem('sxiphone.kakaopay.ledger.v1', JSON.stringify(ledger));
      } catch (e) {}
      this.updateBalance();
    },

    _bindPurchaseModal() {
      const buyModal = document.getElementById('buy-modal');
      const pinModal = document.getElementById('pin-modal');

      document.getElementById('btn-buy-cancel')?.addEventListener('click', () => {
        buyModal.classList.add('hidden');
        this.pendingPurchase = null;
      });
      document.getElementById('btn-buy-confirm')?.addEventListener('click', () => {
        pinModal.classList.remove('hidden');
        document.getElementById('pin-input').value = '';
      });
      document.getElementById('btn-pin-cancel')?.addEventListener('click', () => pinModal.classList.add('hidden'));
      document.getElementById('btn-pin-confirm')?.addEventListener('click', () => {
        const pin = document.getElementById('pin-input').value.trim();
        if (pin !== DEFAULT_PIN) {
          this.dialogue.show('系統', 'PIN 錯誤。');
          return;
        }
        pinModal.classList.add('hidden');
        this._completePurchase();
      });
    },

    _bindShopModal() {
      document.getElementById('btn-shop-close')?.addEventListener('click', () => {
        document.getElementById('shop-modal').classList.add('hidden');
      });
    },

    _bindMirrorModal() {
      document.getElementById('btn-mirror-close')?.addEventListener('click', () => {
        document.getElementById('mirror-modal').classList.add('hidden');
      });
      document.getElementById('btn-mirror-apply')?.addEventListener('click', () => {
        this._applyMirrorSelection();
      });
      document.getElementById('mirror-file-input')?.addEventListener('change', (e) => {
        this._handleMirrorFileUpload(e);
      });
    },

    openMirrorModal() {
      const modal = document.getElementById('mirror-modal');
      const presetsContainer = document.getElementById('mirror-presets');
      presetsContainer.innerHTML = '';
      
      HomeData.PRESET_SPRITES.forEach((preset) => {
        const btn = document.createElement('button');
        btn.className = 'mirror-preset-btn' + (this.selectedSpriteId === preset.id ? ' selected' : '');
        btn.textContent = preset.name;
        btn.addEventListener('click', () => this._selectPreset(preset));
        presetsContainer.appendChild(btn);
      });
      
      this._renderMirrorPreview();
      modal.classList.remove('hidden');
    },

    _selectPreset(preset) {
      this.selectedSpriteId = preset.id;
      this.selectedSpriteColors = preset.colors || null;
      document.querySelectorAll('.mirror-preset-btn').forEach((btn) => {
        btn.classList.toggle('selected', btn.textContent === preset.name);
      });
      this._renderMirrorPreview();
    },

    _renderMirrorPreview() {
      const canvas = document.getElementById('mirror-preview-canvas');
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#78b858';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const tempPlayer = new WorldPlayer({});
      if (this.selectedSpriteColors) {
        tempPlayer.setSpriteColors(this.selectedSpriteColors);
      }
      tempPlayer.direction = 'down';
      tempPlayer.render(ctx, { x: 0, y: 0 }, 32);
    },

    _handleMirrorFileUpload(e) {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          this.selectedSpriteId = 'custom';
          this.selectedSpriteColors = null;
          this.customSpriteImage = img;
          this._renderMirrorPreview();
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    },

    _applyMirrorSelection() {
      if (this.selectedSpriteId === 'default') {
        this.player.resetToDefault();
      } else if (this.selectedSpriteColors) {
        this.player.setSpriteColors(this.selectedSpriteColors);
      }
      this.building.roomState.playerSpriteId = this.selectedSpriteId;
      this.building.roomState.playerSpriteColors = this.selectedSpriteColors;
      document.getElementById('mirror-modal').classList.add('hidden');
      this.dialogue.show('系統', '外觀已更新！');
      this.saveGame();
    },

    _completePurchase() {
      if (!this.pendingPurchase) return;
      const building = this.pendingPurchase;
      const balance = this.getBalance();
      if (balance < building.price) {
        this.dialogue.show('系統', '餘額不足。');
        return;
      }
      this.building.markOwned(building.id);
      this.pendingPurchase = null;
      document.getElementById('buy-modal').classList.add('hidden');
      this.dialogue.show('系統', `已購買 ${building.name}！`);
      this.saveGame();
    },

    _ownedBuildingMap() {
      const map = {};
      this.building.ownedBuildingIds.forEach((id) => { map[id] = true; });
      return map;
    },

    _renderBuyPreview(building) {
      const canvas = document.getElementById('buy-preview');
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#7fb473';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#b74a4a';
      ctx.fillRect(20, 24, canvas.width - 40, 24);
      ctx.fillStyle = '#efe3c8';
      ctx.fillRect(24, 48, canvas.width - 48, 36);
      ctx.fillStyle = '#804020';
      ctx.fillRect(canvas.width / 2 - 10, 62, 20, 22);
      ctx.fillStyle = '#78c8e8';
      ctx.fillRect(35, 56, 16, 12);
      ctx.fillRect(canvas.width - 51, 56, 16, 12);
      ctx.fillStyle = '#222';
      ctx.font = '9px "Press Start 2P"';
      ctx.fillText(building.name.slice(0, 10), 10, 14);
    },

    _resizeWorldCanvas(canvas) {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(320, Math.floor(rect.width));
      canvas.height = Math.max(480, Math.floor(rect.height));
      canvas.getContext('2d').imageSmoothingEnabled = false;
    },

    _renderMinimap() {
      const canvas = document.getElementById('minimap-canvas');
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const scaleX = canvas.width / HomeData.MAP_CONFIG.worldWidth;
      const scaleY = canvas.height / HomeData.MAP_CONFIG.worldHeight;

      for (let y = 0; y < HomeData.MAP_CONFIG.worldHeight; y += 2) {
        for (let x = 0; x < HomeData.MAP_CONFIG.worldWidth; x += 2) {
          const t = this.worldMap[y][x];
          if (t === HomeData.TILE_TYPES.WATER) ctx.fillStyle = '#3860a0';
          else if (t === HomeData.TILE_TYPES.ROAD || t === HomeData.TILE_TYPES.PATH_STONE) ctx.fillStyle = '#a89060';
          else if (t === HomeData.TILE_TYPES.SAND) ctx.fillStyle = '#c8a860';
          else if (t === HomeData.TILE_TYPES.FOREST) ctx.fillStyle = '#507840';
          else ctx.fillStyle = '#6a9850';
          ctx.fillRect(Math.floor(x * scaleX), Math.floor(y * scaleY), Math.ceil(scaleX * 2), Math.ceil(scaleY * 2));
        }
      }

      HomeData.TELEPORT_POINTS.forEach((tp) => {
        const unlocked = this.teleport.points.find((p) => p.id === tp.id)?.unlocked;
        ctx.fillStyle = unlocked ? '#ffe070' : '#666';
        ctx.fillRect(Math.floor(tp.x * scaleX), Math.floor(tp.y * scaleY), 2, 2);
      });

      ctx.fillStyle = this.animFrame % 20 < 10 ? '#fff' : '#ffd447';
      ctx.fillRect(Math.floor(this.player.x * scaleX) - 1, Math.floor(this.player.y * scaleY) - 1, 3, 3);
    },

    _updateInteractionButton() {
      const btnAction = document.getElementById('btn-action');
      const target = this.building.findInteractableNear(this.player) || this.building.findNpcNear(this.player);
      if (target) btnAction.classList.remove('hidden');
      else btnAction.classList.add('hidden');
    },

    _updateRegionState(forceBanner) {
      const regionId = HomeData.regionFor(this.player.x, this.player.y);
      if (!regionId) return;
      if (regionId !== this.currentRegion || forceBanner) {
        this.currentRegion = regionId;
        this.discoveredRegions.add(regionId);
        this._showRegionBanner();
      }
      const regionName = HomeData.WORLD_REGIONS.find((r) => r.id === regionId)?.name || regionId;
      const regionEl = document.getElementById('hud-region');
      if (regionEl) regionEl.textContent = regionName;
    },

    _showRegionBanner() {
      const banner = document.getElementById('region-banner');
      const regionName = HomeData.WORLD_REGIONS.find((r) => r.id === this.currentRegion)?.name || this.currentRegion;
      banner.textContent = regionName;
      banner.classList.remove('hidden');
      setTimeout(() => banner.classList.add('hidden'), 1800);
    },

    _bindKeyboard() {
      window.addEventListener('keydown', (ev) => {
        const key = ev.key.toLowerCase();
        if (this.dialogue.isActive && (key === 'enter' || key === 'z' || key === ' ')) return;

        if (key === 'arrowup' || key === 'w') this.player.move('up');
        else if (key === 'arrowdown' || key === 's') this.player.move('down');
        else if (key === 'arrowleft' || key === 'a') this.player.move('left');
        else if (key === 'arrowright' || key === 'd') this.player.move('right');
        else if (key === 'b') this.player.isRunning = true;
        else if (key === 'm') this.teleport.open({ x: this.player.x, y: this.player.y });
        else if (key === 'z' || key === ' ') this.building.interact(this.player);
        else if (key === 'escape') {
          this.teleport.close();
          this._toggleSettingsModal(false);
          document.getElementById('buy-modal').classList.add('hidden');
          document.getElementById('shop-modal').classList.add('hidden');
          document.getElementById('pin-modal').classList.add('hidden');
        }
      });
      window.addEventListener('keyup', (ev) => {
        if (ev.key.toLowerCase() === 'b') this.player.isRunning = false;
      });
    },

    _bindJoystick() {
      const joystick = document.getElementById('joystick');
      const knob = document.getElementById('joystick-knob');
      if (!joystick || !knob) return;
      let active = false;
      const radius = 34;

      const moveByTouch = (clientX, clientY) => {
        const rect = joystick.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = clientX - cx;
        const dy = clientY - cy;
        const dist = Math.hypot(dx, dy);
        const clamp = Math.min(radius, dist);
        const nx = dist ? (dx / dist) * clamp : 0;
        const ny = dist ? (dy / dist) * clamp : 0;
        knob.style.transform = `translate(calc(-50% + ${nx}px), calc(-50% + ${ny}px))`;

        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
        if (Math.abs(dx) > Math.abs(dy)) this.player.move(dx > 0 ? 'right' : 'left');
        else this.player.move(dy > 0 ? 'down' : 'up');
      };

      joystick.addEventListener('pointerdown', (e) => { active = true; moveByTouch(e.clientX, e.clientY); });
      window.addEventListener('pointermove', (e) => { if (active) moveByTouch(e.clientX, e.clientY); });
      const up = () => { active = false; knob.style.transform = 'translate(-50%, -50%)'; };
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
    },

    _renderRoomTabs() {
      const tabs = document.getElementById('room-tabs');
      if (!tabs) return;
      tabs.innerHTML = '';
      Object.keys(HomeData.ROOM_TYPES).forEach((key) => {
        const btn = document.createElement('button');
        btn.className = 'room-tab' + (key === this.building.roomState.currentRoom ? ' active' : '');
        btn.textContent = HomeData.ROOM_TYPES[key].name;
        btn.addEventListener('click', () => {
          this.building.roomState.currentRoom = key;
          this._renderRoomTabs();
          this._renderRoom();
        });
        tabs.appendChild(btn);
      });
      this._renderRoom();
    },

    _renderRoom() {
      const canvas = document.getElementById('room-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const ts = 48;
      const cols = 12;
      const rows = 10;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          ctx.fillStyle = (x + y) % 2 ? '#c8b890' : '#d8c8a0';
          ctx.fillRect(x * ts, y * ts, ts, ts);
        }
      }
      ctx.fillStyle = '#9a8a6a';
      ctx.fillRect(0, 0, canvas.width, 24);

      const roomKey = this.building.roomState.currentRoom;
      ctx.fillStyle = '#222';
      ctx.font = '16px DotGothic16';
      ctx.fillText(`房間: ${HomeData.ROOM_TYPES[roomKey]?.name || roomKey}`, 16, 18);

      const items = this.building.roomState.furnitureByRoom[roomKey] || [];
      items.forEach((item) => this._drawFurniture(ctx, item, ts));

      if (this.roomEditMode && this.selectedFurniture) {
        ctx.strokeStyle = '#f8d878';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.editCursorX * ts, this.editCursorY * ts, ts * 2, ts);
        this._drawFurniturePreview(ctx, this.selectedFurniture, this.editCursorX * ts, this.editCursorY * ts, ts);
      }
    },

    _drawFurniturePreview(ctx, itemId, x, y, ts) {
      ctx.globalAlpha = 0.6;
      const item = HomeData.FURNITURE_CATALOG.find(f => f.id === itemId);
      if (item) {
        this._drawFurniture(ctx, { id: itemId, x: Math.floor(x / ts), y: Math.floor(y / ts) }, ts);
      }
      ctx.globalAlpha = 1;
    },

    _drawFurniture(ctx, item, ts) {
      const x = item.x * ts;
      const y = item.y * ts;
      switch (item.id) {
        case 'sofa_basic':
          ctx.fillStyle = '#5a3a28';
          ctx.fillRect(x, y, ts * 2, ts * 0.7);
          ctx.fillStyle = '#7a4a32';
          ctx.fillRect(x + 2, y + 2, ts * 2 - 4, ts * 0.7 - 4);
          ctx.fillStyle = '#9a6a52';
          ctx.fillRect(x + 4, y + 4, ts * 2 - 8, ts * 0.3);
          ctx.fillStyle = '#4a2a18';
          ctx.fillRect(x, y + ts * 0.7 - 2, ts * 2, 2);
          break;
        case 'tv_basic':
          ctx.fillStyle = '#222';
          ctx.fillRect(x, y, ts * 1.4, ts * 0.9);
          ctx.fillStyle = '#333';
          ctx.fillRect(x + 2, y + 2, ts * 1.4 - 4, ts * 0.9 - 4);
          ctx.fillStyle = '#4888d8';
          ctx.fillRect(x + 4, y + 4, ts * 1.4 - 8, ts * 0.9 - 10);
          ctx.fillStyle = '#60a0f8';
          ctx.fillRect(x + 6, y + 6, 8, 6);
          break;
        case 'table_tea':
          ctx.fillStyle = '#6a4a30';
          ctx.fillRect(x + 4, y + 4, ts * 1.1 - 8, ts * 0.7 - 8);
          ctx.fillStyle = '#8e6a45';
          ctx.fillRect(x + 6, y + 6, ts * 1.1 - 12, ts * 0.7 - 12);
          ctx.fillStyle = '#5a3a20';
          ctx.fillRect(x + 8, y + ts * 0.7 - 6, 4, 6);
          ctx.fillRect(x + ts * 1.1 - 12, y + ts * 0.7 - 6, 4, 6);
          break;
        case 'bed_double':
          ctx.fillStyle = '#5c3a38';
          ctx.fillRect(x, y, ts * 2.2, ts * 1.4);
          ctx.fillStyle = '#7c5a48';
          ctx.fillRect(x + 2, y + 2, ts * 2.2 - 4, ts * 1.4 - 4);
          ctx.fillStyle = '#f8f8f8';
          ctx.fillRect(x + 4, y + 4, ts * 2.2 - 8, ts * 0.6);
          ctx.fillStyle = '#d8d8d8';
          ctx.fillRect(x + 6, y + 6, ts * 2.2 - 12, ts * 0.5);
          break;
        case 'wardrobe':
          ctx.fillStyle = '#6a4930';
          ctx.fillRect(x, y, ts * 1.2, ts * 1.6);
          ctx.fillStyle = '#8a694e';
          ctx.fillRect(x + 2, y + 2, ts * 1.2 - 4, ts * 1.6 - 4);
          ctx.fillStyle = '#6a4930';
          ctx.fillRect(x + ts * 0.6 - 1, y + 2, 2, ts * 1.6 - 4);
          ctx.fillStyle = '#a08060';
          ctx.fillRect(x + ts * 0.3, y + ts * 0.8, 4, 4);
          ctx.fillRect(x + ts * 0.9, y + ts * 0.8, 4, 4);
          break;
        case 'desk_set':
          ctx.fillStyle = '#634530';
          ctx.fillRect(x, y, ts * 1.6, ts * 0.8);
          ctx.fillStyle = '#836548';
          ctx.fillRect(x + 2, y + 2, ts * 1.6 - 4, ts * 0.8 - 4);
          ctx.fillStyle = '#534028';
          ctx.fillRect(x + 4, y + ts * 0.8 - 6, 4, 6);
          ctx.fillRect(x + ts * 1.6 - 8, y + ts * 0.8 - 6, 4, 6);
          break;
        case 'bookshelf':
          ctx.fillStyle = '#5d4230';
          ctx.fillRect(x, y, ts * 1.2, ts * 1.5);
          ctx.fillStyle = '#6d5238';
          ctx.fillRect(x + 2, y + 2, ts * 1.2 - 4, ts * 1.5 - 4);
          ctx.fillStyle = '#8a6050';
          ctx.fillRect(x + 4, y + 4, ts * 1.2 - 8, 12);
          ctx.fillStyle = '#5080a0';
          ctx.fillRect(x + 4, y + 20, ts * 1.2 - 8, 10);
          ctx.fillStyle = '#70a080';
          ctx.fillRect(x + 4, y + 34, ts * 1.2 - 8, 8);
          break;
        case 'fridge':
          ctx.fillStyle = '#8090a0';
          ctx.fillRect(x, y, ts * 1.1, ts * 1.6);
          ctx.fillStyle = '#aab3bc';
          ctx.fillRect(x + 2, y + 2, ts * 1.1 - 4, ts * 1.6 - 4);
          ctx.fillStyle = '#c0c8d0';
          ctx.fillRect(x + 4, y + 4, ts * 1.1 - 8, ts * 0.5);
          ctx.fillStyle = '#606870';
          ctx.fillRect(x + ts * 1.1 - 8, y + ts * 0.6, 4, 8);
          break;
        case 'dining_table':
          ctx.fillStyle = '#6c4730';
          ctx.fillRect(x + 4, y + 4, ts * 1.8 - 8, ts * 1 - 8);
          ctx.fillStyle = '#8c6748';
          ctx.fillRect(x + 6, y + 6, ts * 1.8 - 12, ts * 1 - 12);
          ctx.fillStyle = '#5c3720';
          ctx.fillRect(x + 8, y + ts * 1 - 6, 4, 6);
          ctx.fillRect(x + ts * 1.8 - 12, y + ts * 1 - 6, 4, 6);
          break;
        case 'plant_large':
          ctx.fillStyle = '#5f4f2e';
          ctx.fillRect(x + 14, y + 28, 20, 18);
          ctx.fillStyle = '#6f4f2e';
          ctx.fillRect(x + 12, y + 26, 24, 16);
          ctx.fillStyle = '#3a7a3a';
          ctx.fillRect(x + 8, y + 8, 32, 20);
          ctx.fillStyle = '#4b8f42';
          ctx.fillRect(x + 10, y + 6, 28, 18);
          ctx.fillStyle = '#5aa050';
          ctx.fillRect(x + 14, y + 8, 20, 12);
          break;
        case 'mirror':
          ctx.fillStyle = '#5a4030';
          ctx.fillRect(x + 4, y + 4, ts * 0.8, ts * 1.4);
          ctx.fillStyle = '#7a6050';
          ctx.fillRect(x + 6, y + 6, ts * 0.8 - 4, ts * 1.4 - 8);
          ctx.fillStyle = '#c8e0f8';
          ctx.fillRect(x + 8, y + 8, ts * 0.8 - 8, ts * 1.4 - 12);
          ctx.fillStyle = '#e8f4ff';
          ctx.fillRect(x + 10, y + 10, 8, 12);
          ctx.fillStyle = '#a0c0e0';
          ctx.fillRect(x + 8, y + ts * 1.4 - 16, ts * 0.8 - 8, 4);
          break;
        default:
          ctx.fillStyle = '#888';
          ctx.fillRect(x + 4, y + 4, ts - 8, ts - 8);
          ctx.fillStyle = '#aaa';
          ctx.fillRect(x + 6, y + 6, ts - 12, ts - 12);
          break;
      }
    },

    _playTeleportEffect(onMidpoint) {
      this._fadeTransition(() => {
        if (typeof onMidpoint === 'function') onMidpoint();
      });
    },

    _fadeTransition(onSwitch) {
      const layer = document.getElementById('fade-layer');
      layer.classList.remove('hidden');
      layer.classList.add('active');
      setTimeout(() => {
        if (typeof onSwitch === 'function') onSwitch();
        setTimeout(() => {
          layer.classList.remove('active');
          setTimeout(() => layer.classList.add('hidden'), 280);
        }, 140);
      }, 220);
    },

    _toggleSettingsModal(show) {
      const modal = document.getElementById('settings-modal');
      modal.classList.toggle('hidden', !show);
    },

    _refreshLocalizedLabels() {
      const lang = (typeof getCurrentLang === 'function' ? getCurrentLang() : 'zh-TW') || 'zh-TW';
      if (lang.startsWith('en')) {
        const mapBtn = document.getElementById('btn-map'); if (mapBtn) mapBtn.textContent = 'MAP';
        const backBtn = document.getElementById('btn-room-back'); if (backBtn) backBtn.textContent = 'BACK';
      }
    },

    _introThenStart() {
      const intro = document.getElementById('intro-overlay');
      setTimeout(() => {
        intro?.classList.add('done');
        requestAnimationFrame((ts) => this.gameLoop(ts));
      }, 520);
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (typeof SxAppAppearance !== 'undefined') {
      SxAppAppearance.initAppearanceForApp('home');
    }
    HomeApp.init();
  });

  global.HomeApp = HomeApp;
})(window);
