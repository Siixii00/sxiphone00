const COINS_KEY = 'sx_arcade_coins';
const SCORES_KEY = 'sx_arcade_scores';
const ANIMATION_KEY = 'sx_arcade_animation';
const STATE_KEY = 'sx_arcade_state';

let coins = 0;
let highScores = {};
let currentGame = null;
let animationEnabled = true;
let dualModeController = null;
let characterDialogue = null;
let arcadeState = {
  playerName: '玩家',
  playerPosition: { x: 9, y: 12, floor: '1F' },
  adultModeEnabled: false,
  ageVerified: false,
  soundEnabled: true,
  bgmEnabled: true,
  achievements: [],
  gamesPlayed: {},
  totalCoinsEarned: 0,
  totalCoinsSpent: 0
};

const coinsDisplay = document.getElementById('coins-count');
const scoresList = document.getElementById('scores-list');
const gameModal = document.getElementById('game-modal');
const gameModalContent = document.getElementById('game-modal-content');
const gamesGrid = document.getElementById('games-grid');

window.coins = coins;

function getGameModal() {
  return document.getElementById('game-modal');
}

function getGameModalContent() {
  return document.getElementById('game-modal-content');
}

function loadCoins() {
  const saved = localStorage.getItem(COINS_KEY);
  return saved ? parseInt(saved, 10) : 100;
}

function saveCoins() {
  localStorage.setItem(COINS_KEY, String(coins));
}

function loadScores() {
  const saved = localStorage.getItem(SCORES_KEY);
  return saved ? JSON.parse(saved) : {};
}

function saveScores() {
  localStorage.setItem(SCORES_KEY, JSON.stringify(highScores));
}

function loadAnimationSetting() {
  const saved = localStorage.getItem(ANIMATION_KEY);
  return saved !== null ? saved === 'true' : true;
}

function saveAnimationSetting() {
  localStorage.setItem(ANIMATION_KEY, String(animationEnabled));
}

function loadArcadeState() {
  const saved = localStorage.getItem(STATE_KEY);
  if (saved) {
    try {
      const state = JSON.parse(saved);
      arcadeState = { ...arcadeState, ...state };
    } catch (e) {
      console.warn('載入街機狀態失敗', e);
    }
  }
}

function saveArcadeState() {
  localStorage.setItem(STATE_KEY, JSON.stringify(arcadeState));
}

function updateAnimationToggle() {
  const toggle = document.getElementById('animation-toggle');
  if (toggle) {
    toggle.classList.toggle('active', animationEnabled);
  }
}

function toggleAnimationSetting() {
  animationEnabled = !animationEnabled;
  saveAnimationSetting();
  updateAnimationToggle();
}

function playNeonIntro() {
  const intro = document.getElementById('neon-intro');
  const neonText = document.getElementById('neon-text');
  
  if (!intro || !animationEnabled) {
    if (intro) intro.classList.add('hidden');
    return;
  }
  
  // 設定超時保護，確保動畫不會無限執行
  const maxDuration = 3000;
  let introTimeout = null;
  
  const cleanupIntro = () => {
    if (introTimeout) clearTimeout(introTimeout);
    if (intro) intro.classList.add('hidden');
  };
  
  // 設定最大持續時間
  introTimeout = setTimeout(cleanupIntro, maxDuration);
  
  setTimeout(() => {
    if (neonText) {
      neonText.classList.add('flicker');
    }
  }, 1000);
  
  setTimeout(() => {
    intro.classList.add('fade-out');
    setTimeout(() => {
      cleanupIntro();
    }, 500);
  }, 2000);
}

function skipIntro() {
  const intro = document.getElementById('neon-intro');
  if (intro) {
    // 立即隱藏，不使用動畫
    intro.style.display = 'none';
    intro.classList.add('hidden');
  }
}

function updateCoinsDisplay() {
  if (coinsDisplay) {
    coinsDisplay.textContent = coins;
  }
}

function updateScoresDisplay() {
  if (!scoresList) return;
  
  const games = {
    snake: '貪吃蛇',
    slot: '吃角子老虎'
  };
  
  scoresList.innerHTML = Object.entries(highScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([game, score]) => `
      <div class="score-item">
        <span class="game-name">${games[game] || game}</span>
        <span class="score-value">${score}</span>
      </div>
    `).join('') || '<div class="score-item" style="justify-content: center; color: var(--muted);">尚無記錄</div>';
}

function openGame(game) {
  currentGame = game;
  
  if (!gameModal || !gameModalContent) {
    console.error('Game modal elements not found');
    return;
  }
  
  gameModal.classList.remove('hidden');
  gameModal.classList.add('fullscreen');
  
  const gameConfigs = {
    snake: { title: '貪吃蛇', cost: 10, render: renderSnakeGame },
    gacha: { title: '抽卡模擬器', cost: 0, render: renderGachaGame },
    slot: { title: '吃角子老虎', cost: 5, render: renderSlotGame }
  };
  
  const config = gameConfigs[game];
  if (!config) return;
  
  if (coins < config.cost) {
    alert(`金幣不足！需要 ${config.cost} 金幣`);
    closeGame();
    return;
  }
  
  coins -= config.cost;
  arcadeState.totalCoinsSpent += config.cost;
  saveCoins();
  saveArcadeState();
  updateCoinsDisplay();
  
  gameModalContent.innerHTML = `
    <div class="game-fullscreen">
      <div class="game-bg-layer ${game}-bg"></div>
      <div class="game-header-fullscreen">
        <button class="back-btn" onclick="closeGame()">
          <i class="fas fa-arrow-left"></i> 返回
        </button>
        <div class="game-title-fullscreen">${config.title}</div>
        <div class="game-stats-fullscreen">
          <i class="fas fa-coins"></i>
          <span id="game-coins-display">${coins}</span>
        </div>
      </div>
      <div class="game-content-fullscreen" id="game-area"></div>
    </div>
  `;
  
  config.render();
  
  if (window.audioManager) {
    window.audioManager.playGameBGM(game);
  }
}

function closeGame() {
  const modal = document.getElementById('game-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('fullscreen');
  }
  currentGame = null;
  if (snakeInterval) clearInterval(snakeInterval);
  if (snake2Interval) clearInterval(snake2Interval);
  snakeMultiplayerMode = null;
  snake2 = [];
  
  if (dualModeController) {
    dualModeController.endGame();
  }
  
  if (window.audioManager) {
    window.audioManager.stopGameBGM();
    window.audioManager.playAmbient(arcadeGame?.player?.floor || '1F');
  }
  
  if (window.arcadeGame) {
    window.arcadeGame.endGame();
  }
}

function openGameFromMap(machineId, machine) {
  console.log('openGameFromMap called:', machineId, machine);
  
  currentGame = machineId;
  
  const modal = document.getElementById('game-modal');
  const modalContent = document.getElementById('game-modal-content');
  
  if (!modal || !modalContent) {
    console.error('Game modal not found');
    return;
  }
  
  modal.classList.remove('hidden');
  modal.classList.add('fullscreen');
  
  if (coins < machine.cost) {
    alert(`金幣不足！需要 ${machine.cost} 金幣`);
    closeGame();
    return;
  }
  
  coins -= machine.cost;
  arcadeState.totalCoinsSpent += machine.cost;
  if (!arcadeState.gamesPlayed[machineId]) {
    arcadeState.gamesPlayed[machineId] = { plays: 0, highScore: 0 };
  }
  arcadeState.gamesPlayed[machineId].plays++;
  
  saveCoins();
  saveArcadeState();
  updateCoinsDisplay();
  
  const hasCharacter = window.arcadeGame?.character && Character.hasCharacter();
  
  if (hasCharacter && !dualModeController) {
    const character = window.arcadeGame.character;
    characterDialogue = new CharacterDialogue(character);
    dualModeController = new DualModeController(character, characterDialogue);
  }
  
  const gameRenderers = {
    snake: renderSnakeGame,
    slot: renderSlotGame,
    tetris: renderTetrisGame,
    whackamole: renderWhackAMoleGame,
    memory: renderMemoryGame,
    pinball: renderPinballGame,
    dart: renderDartGame,
    gacha_genshin: () => renderGachaGameForMachine('genshin'),
    gacha_starrail: () => renderGachaGameForMachine('starrail'),
    gacha_zzz: () => renderGachaGameForMachine('zzz'),
    gacha_fgo: () => renderGachaGameForMachine('fgo'),
    gacha_wuwa: () => renderGachaGameForMachine('wuwa'),
    gacha_es: () => renderGachaGameForMachine('es'),
    gacha_pjsk: () => renderGachaGameForMachine('pjsk'),
    gacha_lightandnight: () => renderGachaGameForMachine('lightandnight'),
    gacha_lovedeepspace: () => renderGachaGameForMachine('lovedeepspace'),
    gacha_loveproducer: () => renderGachaGameForMachine('loveproducer'),
    gacha_worldoutside: () => renderGachaGameForMachine('worldoutside'),
    gacha_shiningname: () => renderGachaGameForMachine('shiningname'),
    gacha_hell: () => renderGachaGameForMachine('hell'),
    yellowcard: renderYellowCardGame,
    truthdare: renderTruthDareGame,
    roulette: renderRouletteGame,
    kinggame: renderKingGame,
    oldmaid: renderOldMaidGame,
    drunkpoker: renderDrunkPokerGame
  };
  
  const bgClass = machine.type === 'gacha' ? 'gacha-bg' : 
                  machine.type === 'adult' ? 'adult-bg' : 
                  machineId + '-bg';
  
  const modeSelectorHTML = hasCharacter && dualModeController ? `
      <div class="game-mode-selector" id="game-mode-selector">
        <button class="mode-btn active" data-mode="single">
          <i class="fas fa-user"></i> 單人模式
        </button>
        <button class="mode-btn" data-mode="dual">
          <i class="fas fa-users"></i> 雙人模式
        </button>
      </div>
  ` : '';
  
  modalContent.innerHTML = `
    <div class="game-fullscreen">
      <div class="game-bg-layer ${bgClass}"></div>
      <div class="game-header-fullscreen">
        <button class="back-btn" onclick="closeGame()">
          <i class="fas fa-arrow-left"></i> 返回
        </button>
        <div class="game-title-fullscreen">${machine.name}</div>
        <div class="game-stats-fullscreen">
          <i class="fas fa-coins"></i>
          <span id="game-coins-display">${coins}</span>
        </div>
      </div>
      <div class="game-content-fullscreen" id="game-area">
        ${modeSelectorHTML}
      </div>
    </div>
  `;
  
  if (hasCharacter && dualModeController) {
    setupModeSelector();
  }
  
  const renderer = gameRenderers[machineId];
  if (renderer) {
    renderer();
  } else {
    document.getElementById('game-area').innerHTML += `
      <div class="coming-soon">
        <i class="fas fa-tools"></i>
        <h3>遊戲開發中</h3>
        <p>${machine.name} 即將推出！</p>
      </div>
    `;
  }
  
  if (window.audioManager) {
    window.audioManager.playGameBGM(machine.type);
  }
  
  if (window.achievementEngine) {
    window.achievementEngine.checkAchievement('first_game');
    window.achievementEngine.checkAchievement(`play_${machineId}`);
  }
  
  if (hasCharacter && characterDialogue && ['snake', 'slot', 'tetris', 'whackamole', 'memory', 'dart'].includes(machineId)) {
    characterDialogue.onGameStart(machine.name);
  }
}

function setupModeSelector() {
  const selector = document.getElementById('game-mode-selector');
  if (!selector) return;
  
  selector.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      if (dualModeController) {
        dualModeController.setMode(mode);
      }
      selector.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

function renderGachaGameForMachine(gameKey) {
  // 直接设置当前游戏，不显示游戏选择器
  gachaState.currentGame = gameKey;
  gachaState.currentPoolType = Object.keys(GACHA_CONFIGS[gameKey].poolTypes)[0];
  gachaState.pity5 = 0;
  gachaState.pity4 = 0;
  gachaState.guarantee = false;
  gachaState.consecutiveOffRate = 0;
  gachaState.customUp = [];
  gachaState.customUp4 = [];
  saveGachaState();
  
  // 渲染单一游戏的抽卡界面
  renderSingleGameGacha(gameKey);
}

function updateHighScore(game, score) {
  if (!highScores[game] || score > highScores[game]) {
    highScores[game] = score;
    saveScores();
    updateScoresDisplay();
  }
}

// ============ 貪吃蛇遊戲 ============
let snakeInterval = null;
let snake = [];
let snakeFood = { x: 0, y: 0 };
let snakeDirection = 'right';
let snakeScore = 0;
let snakeSize = 18;
let snakeMultiplayerMode = null;
let snake2 = [];
let snake2Direction = 'left';
let snake2Score = 0;
let snake2Interval = null;

function renderSnakeGame() {
  const area = document.getElementById('game-area');
  const hasCharacter = window.arcadeGame?.character && Character.hasCharacter();
  
  let modeSelectorHTML = '';
  if (hasCharacter && !snakeMultiplayerMode) {
    modeSelectorHTML = `
      <div class="snake-mode-prompt" id="snake-mode-prompt">
        <div class="snake-mode-title">🎮 偵測到已邀請角色</div>
        <div class="snake-mode-subtitle">選擇遊戲模式</div>
        <div class="snake-mode-buttons">
          <button class="snake-mode-btn" onclick="startSnakeMode('single')">
            <i class="fas fa-user"></i>
            <span>單人模式</span>
          </button>
          <button class="snake-mode-btn" onclick="startSnakeMode('coop')">
            <i class="fas fa-handshake"></i>
            <span>合作模式</span>
          </button>
          <button class="snake-mode-btn" onclick="startSnakeMode('versus')">
            <i class="fas fa-swords"></i>
            <span>對戰模式</span>
          </button>
        </div>
      </div>
    `;
  }
  
  area.innerHTML = `
    <div class="snake-game-container">
      ${modeSelectorHTML}
      <div class="game-score" id="snake-score-container">
        <span>玩家: <span id="snake-score">0</span></span>
        <span id="snake-score-2-container" class="hidden"> | 角色: <span id="snake-score-2">0</span></span>
      </div>
      <div class="snake-grid" id="snake-grid" style="grid-template-columns: repeat(${snakeSize}, 1fr);"></div>
      <div class="game-controls">
        <button class="game-btn secondary" onclick="changeSnakeDirection('up')"><i class="fas fa-arrow-up"></i></button>
      </div>
      <div class="game-controls">
        <button class="game-btn secondary" onclick="changeSnakeDirection('left')"><i class="fas fa-arrow-left"></i></button>
        <button class="game-btn secondary" onclick="changeSnakeDirection('down')"><i class="fas fa-arrow-down"></i></button>
        <button class="game-btn secondary" onclick="changeSnakeDirection('right')"><i class="fas fa-arrow-right"></i></button>
      </div>
      <div class="game-message">使用按鈕或鍵盤方向鍵控制</div>
    </div>
  `;
  
  if (!hasCharacter) {
    initSnake();
  }
}

function startSnakeMode(mode) {
  snakeMultiplayerMode = mode;
  const prompt = document.getElementById('snake-mode-prompt');
  if (prompt) prompt.classList.add('hidden');
  
  if (mode === 'coop' || mode === 'versus') {
    document.getElementById('snake-score-2-container').classList.remove('hidden');
    snake2 = [{ x: snakeSize - 8, y: snakeSize - 8 }];
    snake2Direction = 'left';
    snake2Score = 0;
    document.getElementById('snake-score-2').textContent = '0';
    
    // 角色自動控制
    if (window.arcadeGame?.character) {
      snake2Interval = setInterval(() => {
        if (!snake2.length) return;
        const head = snake2[0];
        const dx = snakeFood.x - head.x;
        const dy = snakeFood.y - head.y;
        let bestDir = snake2Direction;
        
        if (Math.abs(dx) > Math.abs(dy)) {
          bestDir = dx > 0 ? 'right' : 'left';
        } else {
          bestDir = dy > 0 ? 'down' : 'up';
        }
        
        const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
        if (opposites[bestDir] !== snake2Direction) {
          snake2Direction = bestDir;
        }
      }, 400);
    }
  }
  
  initSnake();
}

function initSnake() {
  snake = [{ x: 7, y: 7 }];
  snakeDirection = 'right';
  snakeScore = 0;
  document.getElementById('snake-score').textContent = '0';
  spawnSnakeFood();
  renderSnakeGrid();
  
  if (snakeInterval) clearInterval(snakeInterval);
  snakeInterval = setInterval(moveSnake, 350);
}

function spawnSnakeFood() {
  do {
    snakeFood = {
      x: Math.floor(Math.random() * snakeSize),
      y: Math.floor(Math.random() * snakeSize)
    };
  } while (snake.some(s => s.x === snakeFood.x && s.y === snakeFood.y) || 
           snake2.some(s => s.x === snakeFood.x && s.y === snakeFood.y));
}

function renderSnakeGrid() {
  const grid = document.getElementById('snake-grid');
  if (!grid) return;
  
  let html = '';
  for (let y = 0; y < snakeSize; y++) {
    for (let x = 0; x < snakeSize; x++) {
      const isSnake1 = snake.some(s => s.x === x && s.y === y);
      const isSnake2 = snake2.some(s => s.x === x && s.y === y);
      const isFood = snakeFood.x === x && snakeFood.y === y;
      html += `<div class="snake-cell ${isSnake1 ? 'snake' : ''} ${isSnake2 ? 'snake2' : ''} ${isFood ? 'food' : ''}"></div>`;
    }
  }
  grid.innerHTML = html;
}

function moveSnake() {
  const head = { ...snake[0] };
  
  switch (snakeDirection) {
    case 'up': head.y--; break;
    case 'down': head.y++; break;
    case 'left': head.x--; break;
    case 'right': head.x++; break;
  }
  
  // 對戰模式：撞到對方蛇身
  if (snakeMultiplayerMode === 'versus' && snake2.some(s => s.x === head.x && s.y === head.y)) {
    clearInterval(snakeInterval);
    if (snake2Interval) clearInterval(snake2Interval);
    updateHighScore('snake', snakeScore);
    alert(`遊戲結束！玩家得分: ${snakeScore}，角色得分: ${snake2Score}`);
    return;
  }
  
  if (head.x < 0 || head.x >= snakeSize || head.y < 0 || head.y >= snakeSize ||
      snake.some(s => s.x === head.x && s.y === head.y)) {
    clearInterval(snakeInterval);
    if (snake2Interval) clearInterval(snake2Interval);
    updateHighScore('snake', snakeScore);
    
    if (snakeMultiplayerMode === 'versus') {
      alert(`遊戲結束！玩家得分: ${snakeScore}，角色得分: ${snake2Score}`);
    } else {
      alert(`遊戲結束！得分: ${snakeScore}`);
    }
    return;
  }
  
  snake.unshift(head);
  
  if (head.x === snakeFood.x && head.y === snakeFood.y) {
    snakeScore += 10;
    document.getElementById('snake-score').textContent = snakeScore;
    spawnSnakeFood();
  } else {
    snake.pop();
  }
  
  // 移動第二條蛇（合作/對戰模式）
  if ((snakeMultiplayerMode === 'coop' || snakeMultiplayerMode === 'versus') && snake2.length > 0) {
    moveSnake2();
  }
  
  renderSnakeGrid();
}

function moveSnake2() {
  const head = { ...snake2[0] };
  
  switch (snake2Direction) {
    case 'up': head.y--; break;
    case 'down': head.y++; break;
    case 'left': head.x--; break;
    case 'right': head.x++; break;
  }
  
  // 對戰模式：撞到玩家蛇身
  if (snakeMultiplayerMode === 'versus' && snake.some(s => s.x === head.x && s.y === head.y)) {
    clearInterval(snakeInterval);
    if (snake2Interval) clearInterval(snake2Interval);
    updateHighScore('snake', snake2Score);
    alert(`角色撞到玩家！玩家得分: ${snakeScore}，角色得分: ${snake2Score}`);
    return;
  }
  
  if (head.x < 0 || head.x >= snakeSize || head.y < 0 || head.y >= snakeSize ||
      snake2.some(s => s.x === head.x && s.y === head.y)) {
    clearInterval(snake2Interval);
    snake2 = [];
    if (snakeMultiplayerMode === 'coop') {
      // 合作模式：角色蛇死亡，玩家繼續
      return;
    } else {
      clearInterval(snakeInterval);
      alert(`角色撞牆！玩家得分: ${snakeScore}，角色得分: ${snake2Score}`);
    }
    return;
  }
  
  snake2.unshift(head);
  
  if (head.x === snakeFood.x && head.y === snakeFood.y) {
    snake2Score += 10;
    document.getElementById('snake-score-2').textContent = snake2Score;
    spawnSnakeFood();
  } else {
    snake2.pop();
  }
}

function moveSnake() {
  if (!snake.length) return;
  
  const head = { x: snake[0].x, y: snake[0].y };
  
  switch (snakeDirection) {
    case 'up': head.y--; break;
    case 'down': head.y++; break;
    case 'left': head.x--; break;
    case 'right': head.x++; break;
  }
  
  if (head.x < 0 || head.x >= snakeSize || head.y < 0 || head.y >= snakeSize ||
      snake.some(s => s.x === head.x && s.y === head.y)) {
    clearInterval(snakeInterval);
    if (snake2Interval) clearInterval(snake2Interval);
    updateHighScore('snake', snakeScore);
    alert(`遊戲結束！得分: ${snakeScore}`);
    return;
  }
  
  snake.unshift(head);
  
  if (head.x === snakeFood.x && head.y === snakeFood.y) {
    snakeScore += 10;
    document.getElementById('snake-score').textContent = snakeScore;
    spawnSnakeFood();
  } else {
    snake.pop();
  }
  
  renderSnakeGrid();
}

function changeSnakeDirection(dir) {
  const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
  if (opposites[dir] !== snakeDirection) {
    snakeDirection = dir;
  }
}

// ============ 抽卡模擬器 ============
const GACHA_CONFIGS = {
  genshin: {
    name: '原神',
    currency: '原石',
    pullCost: 160,
    pity: 90,
    softPity: 74,
    rates: { rarity5: 0.006, rarity4: 0.051, rarity3: 0.943 },
    guarantee4: 10,
    rarityNames: { 5: '5星', 4: '4星', 3: '3星' },
    offRateGuarantee: 2,
    milestones: [
      { spent: 6480, reward: '相遇之緣 x10', claimed: false },
      { spent: 12800, reward: '糾纏之緣 x10', claimed: false },
      { spent: 25600, reward: '5星自選券 x1', claimed: false }
    ],
    poolTypes: {
      character: {
        name: '角色祈願',
        hasOffRate: true,
        pool: {
          rarity5: ['刻晴', '莫娜', '七七', '迪盧克', '琴', '提納里', '迪希雅', '優菈', '可莉', '鍾離', '溫迪', '魈', '甘雨', '胡桃', '神里綾華', '雷電將軍', '納西妲', '芙寧娜', '那維萊特'],
          rarity4: ['芭芭拉', '菲謝爾', '香菱', '行秋', '諾艾爾', '凝光', '雷澤', '班尼特', '砂糖', '迪奧娜', '重雲', '北斗', '羅莎莉亞', '煙緋', '辛焱', '雲堇', '五郎', '九條裟羅', '早柚', '托馬'],
          rarity3: ['冷刃', '黎明神劍', '鴉羽弓', '神射手之誓', '黑纓槍', '討龍英傑譚', '魔導緒論', '流放者', '教官', '戰狂', '幸運兒', '遊醫']
        }
      },
      weapon: {
        name: '武器祈願',
        hasOffRate: true,
        pool: {
          rarity5: ['天空之刃', '天空之傲', '天空之翼', '天空之卷', '天空之脊', '阿莫斯之弓', '四風原典', '和璞鳶', '狼的末路', '風鷹劍', '塵世之鎖', '無工之劍', '息壤', '若水', '霧切之回光', '葦海標尺'],
          rarity4: ['笛劍', '西風劍', '西風大劍', '西風長弓', '西風獵弓', '西風秘典', '西風長槍', '祭禮劍', '祭禮大劍', '祭禮殘章', '祭禮弓', '流浪樂章', '弓藏', '絕弦', '匣里滅辰', '雨裁'],
          rarity3: ['冷刃', '黎明神劍', '鴉羽弓', '神射手之誓', '黑纓槍', '討龍英傑譚', '魔導緒論', '流放者', '教官', '戰狂', '幸運兒', '遊醫']
        }
      }
    }
  },
  starrail: {
    name: '崩壞：星穹鐵道',
    currency: '星瓊',
    pullCost: 160,
    pity: 90,
    softPity: 74,
    rates: { rarity5: 0.006, rarity4: 0.051, rarity3: 0.943 },
    guarantee4: 10,
    rarityNames: { 5: '5星', 4: '4星', 3: '3星' },
    offRateGuarantee: 2,
    milestones: [
      { spent: 6480, reward: '星軌票券 x10', claimed: false },
      { spent: 12800, reward: '星軌專票 x10', claimed: false },
      { spent: 25600, reward: '5星自選券 x1', claimed: false }
    ],
    poolTypes: {
      character: {
        name: '角色躍遷',
        hasOffRate: true,
        pool: {
          rarity5: ['姬子', '瓦爾特', '布洛妮婭', '傑帕德', '彈卿', '白露', '克拉拉', '符玄', '銀狼', '羅剎', '景元', '刃', '鏡流', '黃泉', '砂金', '知更鳥', '波提歐'],
          rarity4: ['艾絲妲', '黑塔', '丹恆', '希兒', '娜塔莎', '佩拉', '素裳', '虎克', '青雀', '停雲', '桑博', '三月七', '艾絲妲', '黑塔', '娜塔莎', '佩拉', '素裳'],
          rarity3: ['琥珀', '鋒鏑', '天傾', '樂團', '蕃息', '嘉果', '物穰', '同一種心情', '餘生的第一天', '記憶中的模樣', '獵物的視線']
        }
      },
      weapon: {
        name: '光錐躍遷',
        hasOffRate: true,
        pool: {
          rarity5: ['星海輝煌', '銀河鐵道之夜', '春水初生', '但戰鬥還未結束', '制勝的瞬間', '如泥酣眠', '棺材的迴響', '無名客的榮光', '鏡中行者', '拂曉之前', '此時恰好', '漫遊指引'],
          rarity4: ['別讓世界停下來', '決心如汗珠般閃耀', '獵物的視線', '餘生的第一天', '記憶中的模樣', '舞！舞！舞！', '此時恰好', '銀河淪陷', '點個關注', '無處可逃', '我們終將重逢', '星火璀璨'],
          rarity3: ['琥珀', '鋒鏑', '天傾', '樂團', '蕃息', '嘉果', '物穰', '同一種心情', '餘生的第一天', '記憶中的模樣', '獵物的視線']
        }
      }
    }
  },
  zzz: {
    name: '絕區零',
    currency: '菲林',
    pullCost: 160,
    pity: 90,
    softPity: 74,
    rates: { rarity5: 0.006, rarity4: 0.051, rarity3: 0.943 },
    guarantee4: 10,
    rarityNames: { 5: 'S級', 4: 'A級', 3: 'B級' },
    offRateGuarantee: 2,
    milestones: [
      { spent: 6480, reward: '菲林 x1600', claimed: false },
      { spent: 12800, reward: 'S級音擎自選 x1', claimed: false },
      { spent: 25600, reward: 'S級代理人自選 x1', claimed: false }
    ],
    poolTypes: {
      character: {
        name: '代理人祈願',
        hasOffRate: true,
        pool: {
          rarity5: ['艾蓮', '萊卡恩', '格莉絲', '貓又', '珂蕾妲', '麗娜', '11號', '朱鳶', '安比', '萊特', '雅', '星見雅'],
          rarity4: ['妮可', '安比', '比利', '珂蕾妲', '萊卡恩', '蒼角', '本', '格莉絲', '麗娜', '貓又', '11號', '安東', '索倫'],
          rarity3: ['都市街頭球', '新手刀', '基礎音擎', '入門電鑽', '普通球拍', '訓練手套']
        }
      },
      weapon: {
        name: '音擎祈願',
        hasOffRate: true,
        pool: {
          rarity5: ['深海訪客', '鋼鐵肉墊', '硫磺石', '燃獄驅動', '嵌合編譯器', '自由落體', '雷鳴音擎', '加農轉軸', '轟鳴座艙', '時光切片', '殘心十三式', '潰散電震'],
          rarity4: ['大保底', '旋轉球棒', '燃燒瓶', '彈簧緩衝', '發射器', '光陰碎片', '情緒儀', '寶藏刀', '充能音擎', '鐳射音擎', '彈射音擎', '聚爆音擎'],
          rarity3: ['都市街頭球', '新手刀', '基礎音擎', '入門電鑽', '普通球拍', '訓練手套']
        }
      }
    }
  },
  fgo: {
    name: 'FGO',
    currency: '聖晶石',
    pullCost: 3,
    pity: 330,
    softPity: 300,
    rates: { rarity5: 0.01, rarity4: 0.03, rarity3: 0.40, rarity2: 0.03, rarity1: 0.53 },
    guarantee4: 10,
    rarityNames: { 5: 'SSR', 4: 'SR', 3: 'R', 2: 'HC', 1: 'C' },
    offRateGuarantee: 0,
    milestones: [
      { spent: 300, reward: '聖晶石 x30', claimed: false },
      { spent: 600, reward: '呼符 x10', claimed: false },
      { spent: 1200, reward: 'SSR確定券 x1', claimed: false }
    ],
    poolTypes: {
      character: {
        name: '從者召喚',
        hasOffRate: false,
        pool: {
          rarity5: ['阿爾托莉雅', '吉爾伽美什', '庫夫林', '斯卡哈', '沖田總司', '阿周那', '迦爾納', '奧德修斯', '太公望', '徐福', '紫式部', '清少納言', '卑彌呼', '女王梅芙'],
          rarity4: ['阿斯托爾福', '蘭斯洛特', '高文', '特里斯坦', '莫德雷德', '尼祿', '阿爾托利亞', '伊麗莎白', '瑪爾達', '卡米拉', '切斯特頓'],
          rarity3: ['庫夫林', '羅賓漢', '尤瑞艾莉', '荊軻', '呂布', '清姬', '美杜莎', '亞歷山大', '凱撒', '伊麗莎白'],
          rarity2: ['齊格飛', '菲爾吉斯', 'Leonidas', '安徒生', '莎士比亞', '莫札特'],
          rarity1: ['阿拉什', '斯巴達克斯', '荊軻', '陳宮', '小次郎', '瑪塔哈麗']
        }
      }
    }
  },
  wuwa: {
    name: '鳴潮',
    currency: '星聲',
    pullCost: 160,
    pity: 80,
    softPity: 66,
    rates: { rarity5: 0.008, rarity4: 0.06, rarity3: 0.932 },
    guarantee4: 10,
    rarityNames: { 5: '5星', 4: '4星', 3: '3星' },
    offRateGuarantee: 2,
    milestones: [
      { spent: 6400, reward: '星聲 x800', claimed: false },
      { spent: 12800, reward: '5星武器自選 x1', claimed: false },
      { spent: 25600, reward: '5星角色自選 x1', claimed: false }
    ],
    poolTypes: {
      character: {
        name: '角色祈願',
        hasOffRate: true,
        pool: {
          rarity5: ['忌炎', '吟霖', '維里奈', '安可', '凌陽', '卡卡羅', '鑒心', '淵武', '白芷', '秧秧', '桃祈', '散華', '熾霞', '丹瑾'],
          rarity4: ['白芷', '秧秧', '桃祈', '散華', '熾霞', '丹瑾', '淵武', '卡卡羅', '凌陽', '安可', '維里奈', '吟霖', '忌炎'],
          rarity3: ['行板', '永夜', '虎嘯', '紫晶', '隕星', '寒霜', '烈焰', '颶風', '雷霆']
        }
      },
      weapon: {
        name: '武器祈願',
        hasOffRate: true,
        pool: {
          rarity5: ['浩境粼光', '擎天', '時光之翼', '飛逝', '驚雷', '永夜之聲', '嘯動長天', '不滅之航', '星輝共鳴', '蒼鱗碎珠', '瞬息殘響', '淵靜長鳴'],
          rarity4: ['飛振', '今州長刀', '暗夜獵手', '永夜長夜', '喚聲的回響', '行進序曲', '鎮壓者', '重破刃', '淵夜寂靜', '遠古稜光', '穿擊槍', '千古洑流'],
          rarity3: ['行板', '永夜', '虎嘯', '紫晶', '隕星', '寒霜', '烈焰', '颶風', '雷霆']
        }
      }
    }
  },
  es: {
    name: '偶像夢幻祭',
    currency: '鑽石',
    pullCost: 250,
    pity: 250,
    softPity: 200,
    rates: { rarity5: 0.015, rarity4: 0.10, rarity3: 0.885 },
    guarantee4: 10,
    rarityNames: { 5: '5星', 4: '4星', 3: '3星' },
    offRateGuarantee: 0,
    milestones: [
      { spent: 5000, reward: '鑽石 x500', claimed: false },
      { spent: 10000, reward: '5星確定券 x1', claimed: false },
      { spent: 25000, reward: '限定5星自選 x1', claimed: false }
    ],
    poolTypes: {
      character: {
        name: '招募',
        hasOffRate: false,
        pool: {
          rarity5: ['明星昂輝', '蓮巳敬人', '月永雷歐', '朔間凜月', '鳴上嵐', '衣木更', '朱櫻司', '天祥院英智', '日日樹涉', '姬宮桃李', '伏見弓弦', '逆先夏目', '春川宙', '南雲鐵虎', '高峯翠'],
          rarity4: ['冰鷹誠矢', '明星昂輝', '遊木真', '衣木更', '天祥院英智', '日日樹涉', '姬宮桃李', '伏見弓弦', '朔間零', '月永雷歐', '瀨名泉', '朱櫻司'],
          rarity3: ['明星昂輝', '遊木真', '衣木更', '冰鷹誠矢', '真白友也', '紫之創', '葵日向', '葵裕太', '天滿光', '朱櫻司', '春川宙', '南雲鐵虎']
        }
      },
      costume: {
        name: '服裝招募',
        hasOffRate: false,
        pool: {
          rarity5: ['夢之咲制服', 'ES制服', '騎士禮服', '哥特風格', '和風浴衣', '運動套裝', '舞台服', '偶像西裝', '休閒穿搭', '冬季大衣', '夏日泳裝', '萬聖節裝', '聖誕裝', '新年和服'],
          rarity4: ['練習服', '日常便服', '學校制服', '舞台便服', '活動服裝', '限定服裝', '合作服裝', '特別紀念'],
          rarity3: ['基本服裝', '普通穿搭', '日常風格', '簡約設計', '經典款式', '休閒風格']
        }
      }
    }
  },
  pjsk: {
    name: '世界計畫',
    currency: '水晶',
    pullCost: 300,
    pity: 300,
    softPity: 250,
    rates: { rarity5: 0.0254, rarity4: 0.1146, rarity3: 0.86 },
    guarantee4: 10,
    rarityNames: { 5: '4星', 4: '3星', 3: '2星' },
    offRateGuarantee: 0,
    milestones: [
      { spent: 6000, reward: '水晶 x600', claimed: false },
      { spent: 12000, reward: '4星確定券 x1', claimed: false },
      { spent: 30000, reward: '限定4星自選 x1', claimed: false }
    ],
    poolTypes: {
      character: {
        name: '招募',
        hasOffRate: false,
        pool: {
          rarity5: ['星乃一歌', '天馬咲希', '望月穗波', '日野森志步', '宵崎奏', '朝比奈真冬', '東雲繪名', '曉山瑞希', '鳳笑夢', '草薙寧寧', '神代類', '天馬司', '小豆澤心羽', '白石杏', '青柳冬彌', '東雲彰人'],
          rarity4: ['星乃一歌', '天馬咲希', '望月穗波', '日野森志步', '宵崎奏', '朝比奈真冬', '東雲繪名', '曉山瑞希', '鳳笑夢', '草薙寧寧', '神代類', '天馬司'],
          rarity3: ['初音未來', '鏡音連', '鏡音鈴', '巡音流歌', 'KAITO', 'MEIKO', '星乃一歌', '天馬咲希', '望月穗波', '日野森志步']
        }
      },
      costume: {
        name: '服裝招募',
        hasOffRate: false,
        pool: {
          rarity5: ['虛擬歌手', '原創服裝', '活動限定', '合作服裝', '週年紀念', '聖誕限定', '新年和服', '夏日泳裝', '萬聖節', '情人節'],
          rarity4: ['日常服裝', '舞台服裝', '活動服裝', '限定服裝', '特別款式', '紀念服裝'],
          rarity3: ['基本服裝', '普通款式', '日常風格', '簡約設計', '經典款式', '休閒穿搭']
        }
      }
    }
  },
  lightandnight: {
    name: '光與夜之戀',
    currency: '北極星',
    pullCost: 180,
    pity: 70,
    softPity: 60,
    rates: { rarity5: 0.02, rarity4: 0.08, rarity3: 0.90 },
    guarantee4: 10,
    rarityNames: { 5: '6星', 4: '5星', 3: '4星' },
    offRateGuarantee: 4,
    milestones: [
      { spent: 3600, reward: '小熊星座 x500', claimed: false },
      { spent: 7200, reward: '6星靈犀自選 x1', claimed: false },
      { spent: 18000, reward: '限定6星自選 x1', claimed: false }
    ],
    poolTypes: {
      character: {
        name: '限定卡池',
        hasOffRate: true,
        pool: {
          rarity5: ['蕭逸', '陸沉', '齊司禮', '查理蘇', '夏鳴星', '蕭逸·白夜', '陸沉·深淵', '齊司禮·永恆', '查理蘇·璀璨', '夏鳴星·星河'],
          rarity4: ['蕭逸', '陸沉', '齊司禮', '查理蘇', '夏鳴星', '蕭逸·初心', '陸沉·初心', '齊司禮·初心', '查理蘇·初心', '夏鳴星·初心'],
          rarity3: ['小熊星座', '星光碎片', '月光結晶', '晨曦之露', '暮色微光', '銀河塵埃']
        }
      },
      memory: {
        name: '靈犀卡池',
        hasOffRate: true,
        pool: {
          rarity5: ['永恆之約', '星光璀璨', '深海之戀', '花語心動', '月下邂逅', '晨曦約定', '暮色溫柔', '星河漫步'],
          rarity4: ['甜蜜時光', '浪漫邂逅', '溫馨日常', '驚喜相遇', '暖心陪伴', '甜蜜約會'],
          rarity3: ['普通靈犀', '日常回憶', '簡約時光', '平凡幸福', '溫馨片段', '美好瞬間']
        }
      }
    }
  },
  loveanddeepspace: {
    name: '戀與深空',
    currency: '深空許願券',
    pullCost: 150,
    pity: 70,
    softPity: 60,
    rates: { rarity5: 0.015, rarity4: 0.085, rarity3: 0.90 },
    guarantee4: 10,
    rarityNames: { 5: 'UR', 4: 'SSR', 3: 'SR' },
    offRateGuarantee: 3,
    milestones: [
      { spent: 3000, reward: '深空許願券 x10', claimed: false },
      { spent: 6000, reward: 'UR思念自選 x1', claimed: false },
      { spent: 15000, reward: '限定UR自選 x1', claimed: false }
    ],
    poolTypes: {
      character: {
        name: '限定卡池',
        hasOffRate: true,
        pool: {
          rarity5: ['沈星回', '黎深', '祁煜', '秦徹', '沈星回·光之軌跡', '黎深·深海之約', '祁煜·星際漫遊', '秦徹·暗夜守護'],
          rarity4: ['沈星回', '黎深', '祁煜', '秦徹', '沈星回·初心', '黎深·初心', '祁煜·初心', '秦徹·初心'],
          rarity3: ['深空碎片', '星際塵埃', '能量核心', '數據晶片', '量子微粒', '暗物質']
        }
      },
      memory: {
        name: '思念卡池',
        hasOffRate: true,
        pool: {
          rarity5: ['星河之約', '深海誓言', '光之守護', '暗夜溫柔', '永恆承諾', '時光倒影'],
          rarity4: ['甜蜜回憶', '浪漫時刻', '溫馨日常', '驚喜相遇', '暖心陪伴'],
          rarity3: ['普通思念', '日常片段', '簡約時光', '平凡幸福', '溫馨瞬間']
        }
      }
    }
  },
  mrlove: {
    name: '戀與製作人',
    currency: '鑽石',
    pullCost: 200,
    pity: 80,
    softPity: 70,
    rates: { rarity5: 0.018, rarity4: 0.082, rarity3: 0.90 },
    guarantee4: 10,
    rarityNames: { 5: 'UR', 4: 'SSR', 3: 'SR' },
    offRateGuarantee: 3,
    milestones: [
      { spent: 4000, reward: '鑽石 x400', claimed: false },
      { spent: 8000, reward: 'UR羈絆自選 x1', claimed: false },
      { spent: 16000, reward: '限定UR自選 x1', claimed: false }
    ],
    poolTypes: {
      character: {
        name: '限定卡池',
        hasOffRate: true,
        pool: {
          rarity5: ['李澤言', '許墨', '白起', '周棋洛', '凌肖', '李澤言·時間管理者', '許墨·天才科學家', '白起·風之守護', '周棋洛·陽光少年', '凌肖·叛逆少年'],
          rarity4: ['李澤言', '許墨', '白起', '周棋洛', '凌肖', '李澤言·初心', '許墨·初心', '白起·初心', '周棋洛·初心', '凌肖·初心'],
          rarity3: ['城市碎片', '時光印記', '記憶塵埃', '情感微粒', '日常點滴', '平凡瞬間']
        }
      },
      card: {
        name: '羈絆卡池',
        hasOffRate: true,
        pool: {
          rarity5: ['時間的承諾', '風的誓言', '光的溫柔', '星的守護', '暗的溫暖', '永恆之約'],
          rarity4: ['甜蜜約會', '浪漫邂逅', '溫馨時光', '驚喜相遇', '暖心陪伴'],
          rarity3: ['普通羈絆', '日常回憶', '簡約幸福', '平凡溫暖', '溫馨片段']
        }
      }
    }
  },
  tearend: {
    name: '未定事件簿',
    currency: '未定晶片',
    pullCost: 180,
    pity: 80,
    softPity: 70,
    rates: { rarity5: 0.018, rarity4: 0.082, rarity3: 0.90 },
    guarantee4: 10,
    rarityNames: { 5: 'UR', 4: 'SSR', 3: 'SR' },
    offRateGuarantee: 3,
    milestones: [
      { spent: 3600, reward: '未定晶片 x180', claimed: false },
      { spent: 7200, reward: 'UR思緒自選 x1', claimed: false },
      { spent: 14400, reward: '限定UR自選 x1', claimed: false }
    ],
    poolTypes: {
      character: {
        name: '限定卡池',
        hasOffRate: true,
        pool: {
          rarity5: ['陸景和', '莫弈', '夏彥', '左然', '陸景和·溫柔守護', '莫弈·神秘律師', '夏彥·熱血偵探', '左然·冷靜檢察官'],
          rarity4: ['陸景和', '莫弈', '夏彥', '左然', '陸景和·初心', '莫弈·初心', '夏彥·初心', '左然·初心'],
          rarity3: ['案件線索', '證據碎片', '調查筆記', '法律條文', '委託記錄', '日常檔案']
        }
      },
      card: {
        name: '思緒卡池',
        hasOffRate: true,
        pool: {
          rarity5: ['正義的誓言', '真相的守護', '愛的判決', '溫柔的證詞', '永恆的承諾', '時光的見證'],
          rarity4: ['甜蜜調查', '浪漫案件', '溫馨委託', '驚喜發現', '暖心陪伴'],
          rarity3: ['普通思緒', '日常調查', '簡約案件', '平凡委託', '溫馨記錄']
        }
      }
    }
  },
  beyondworld: {
    name: '世界之外',
    currency: '世界幣',
    pullCost: 160,
    pity: 70,
    softPity: 60,
    rates: { rarity5: 0.02, rarity4: 0.08, rarity3: 0.90 },
    guarantee4: 10,
    rarityNames: { 5: 'UR', 4: 'SSR', 3: 'SR' },
    offRateGuarantee: 4,
    milestones: [
      { spent: 3200, reward: '世界幣 x320', claimed: false },
      { spent: 6400, reward: 'UR命運自選 x1', claimed: false },
      { spent: 12800, reward: '限定UR自選 x1', claimed: false }
    ],
    poolTypes: {
      character: {
        name: '限定卡池',
        hasOffRate: true,
        pool: {
          rarity5: ['顧時夜', '易遇', '柏源', '夏蕭因', '顧時夜·暗夜守護', '易遇·神秘旅人', '柏源·溫柔醫者', '夏蕭因·星光引路人'],
          rarity4: ['顧時夜', '易遇', '柏源', '夏蕭因', '顧時夜·初心', '易遇·初心', '柏源·初心', '夏蕭因·初心'],
          rarity3: ['世界碎片', '時空塵埃', '記憶微粒', '命運線索', '平行印記', '日常痕跡']
        }
      },
      card: {
        name: '命運卡池',
        hasOffRate: true,
        pool: {
          rarity5: ['命運的交織', '時空的約定', '世界的盡頭', '永恆的誓言', '星河的守護', '暗夜的溫柔'],
          rarity4: ['甜蜜時空', '浪漫邂逅', '溫馨旅程', '驚喜相遇', '暖心陪伴'],
          rarity3: ['普通命運', '日常旅程', '簡約時空', '平凡幸福', '溫馨瞬間']
        }
      }
    }
  },
  shiningnikki: {
    name: '以閃亮之名',
    currency: '粉鑽',
    pullCost: 120,
    pity: 60,
    softPity: 50,
    rates: { rarity5: 0.025, rarity4: 0.095, rarity3: 0.88 },
    guarantee4: 10,
    rarityNames: { 5: 'UR', 4: 'SSR', 3: 'SR' },
    offRateGuarantee: 3,
    milestones: [
      { spent: 2400, reward: '粉鑽 x240', claimed: false },
      { spent: 4800, reward: 'UR服裝自選 x1', claimed: false },
      { spent: 9600, reward: '限定UR自選 x1', claimed: false }
    ],
    poolTypes: {
      outfit: {
        name: '限定服裝池',
        hasOffRate: true,
        pool: {
          rarity5: ['星河禮服', '夢幻婚紗', '璀璨晚裝', '華麗古風', '優雅旗袍', '甜美洛麗塔', '帥氣西裝', '浪漫泳裝'],
          rarity4: ['優雅連衣裙', '休閒套裝', '運動風格', '學院風', '街頭潮流', '復古風情'],
          rarity3: ['日常T恤', '簡約牛仔', '舒適運動', '清新碎花', '純色基礎', '百搭外套']
        }
      },
      accessory: {
        name: '飾品卡池',
        hasOffRate: true,
        pool: {
          rarity5: ['璀璨皇冠', '夢幻翅膀', '星光項鍊', '華麗頭飾', '優雅手套', '精緻耳飾'],
          rarity4: ['甜美髮飾', '優雅項鍊', '時尚手鍊', '精緻胸針', '浪漫花環'],
          rarity3: ['簡約髮圈', '基礎項鍊', '日常手鍊', '普通耳環', '百搭髮夾']
        }
      }
    }
  },
  lovedeepspace: {
    name: '戀與深空',
    currency: '深空許願券',
    pullCost: 150,
    pity: 70,
    softPity: 60,
    rates: { rarity5: 0.015, rarity4: 0.085, rarity3: 0.90 },
    guarantee4: 10,
    rarityNames: { 5: 'UR', 4: 'SSR', 3: 'SR' },
    offRateGuarantee: 3,
    milestones: [
      { spent: 3000, reward: '深空許願券 x10', claimed: false },
      { spent: 6000, reward: 'UR思念自選 x1', claimed: false },
      { spent: 15000, reward: '限定UR自選 x1', claimed: false }
    ],
    poolTypes: {
      character: {
        name: '限定卡池',
        hasOffRate: true,
        pool: {
          rarity5: ['沈星回', '黎深', '祁煜', '秦徹', '沈星回·光之軌跡', '黎深·深海之約', '祁煜·星際漫遊', '秦徹·暗夜守護'],
          rarity4: ['沈星回', '黎深', '祁煜', '秦徹', '沈星回·初心', '黎深·初心', '祁煜·初心', '秦徹·初心'],
          rarity3: ['深空碎片', '星際塵埃', '能量核心', '數據晶片', '量子微粒', '暗物質']
        }
      },
      memory: {
        name: '思念卡池',
        hasOffRate: true,
        pool: {
          rarity5: ['星河之約', '深海誓言', '光之守護', '暗夜溫柔', '永恆承諾', '時光倒影'],
          rarity4: ['甜蜜回憶', '浪漫時刻', '溫馨日常', '驚喜相遇', '暖心陪伴'],
          rarity3: ['普通思念', '日常片段', '簡約時光', '平凡幸福', '溫馨瞬間']
        }
      }
    }
  },
  loveproducer: {
    name: '戀與製作人',
    currency: '鑽石',
    pullCost: 200,
    pity: 80,
    softPity: 70,
    rates: { rarity5: 0.018, rarity4: 0.082, rarity3: 0.90 },
    guarantee4: 10,
    rarityNames: { 5: 'UR', 4: 'SSR', 3: 'SR' },
    offRateGuarantee: 3,
    milestones: [
      { spent: 4000, reward: '鑽石 x400', claimed: false },
      { spent: 8000, reward: 'UR羈絆自選 x1', claimed: false },
      { spent: 16000, reward: '限定UR自選 x1', claimed: false }
    ],
    poolTypes: {
      character: {
        name: '限定卡池',
        hasOffRate: true,
        pool: {
          rarity5: ['李澤言', '許墨', '白起', '周棋洛', '凌肖', '李澤言·時間管理者', '許墨·天才科學家', '白起·風之守護', '周棋洛·陽光少年', '凌肖·叛逆少年'],
          rarity4: ['李澤言', '許墨', '白起', '周棋洛', '凌肖', '李澤言·初心', '許墨·初心', '白起·初心', '周棋洛·初心', '凌肖·初心'],
          rarity3: ['城市碎片', '時光印記', '記憶塵埃', '情感微粒', '日常點滴', '平凡瞬間']
        }
      },
      card: {
        name: '羈絆卡池',
        hasOffRate: true,
        pool: {
          rarity5: ['時間的承諾', '風的誓言', '光的溫柔', '星的守護', '暗的溫暖', '永恆之約'],
          rarity4: ['甜蜜約會', '浪漫邂逅', '溫馨時光', '驚喜相遇', '暖心陪伴'],
          rarity3: ['普通羈絆', '日常回憶', '簡約幸福', '平凡溫暖', '溫馨片段']
        }
      }
    }
  },
  worldoutside: {
    name: '世界之外',
    currency: '世界幣',
    pullCost: 160,
    pity: 70,
    softPity: 60,
    rates: { rarity5: 0.02, rarity4: 0.08, rarity3: 0.90 },
    guarantee4: 10,
    rarityNames: { 5: 'UR', 4: 'SSR', 3: 'SR' },
    offRateGuarantee: 4,
    milestones: [
      { spent: 3200, reward: '世界幣 x320', claimed: false },
      { spent: 6400, reward: 'UR命運自選 x1', claimed: false },
      { spent: 12800, reward: '限定UR自選 x1', claimed: false }
    ],
    poolTypes: {
      character: {
        name: '限定卡池',
        hasOffRate: true,
        pool: {
          rarity5: ['顧時夜', '易遇', '柏源', '夏蕭因', '顧時夜·暗夜守護', '易遇·神秘旅人', '柏源·溫柔醫者', '夏蕭因·星光引路人'],
          rarity4: ['顧時夜', '易遇', '柏源', '夏蕭因', '顧時夜·初心', '易遇·初心', '柏源·初心', '夏蕭因·初心'],
          rarity3: ['世界碎片', '時空塵埃', '記憶微粒', '命運線索', '平行印記', '日常痕跡']
        }
      },
      card: {
        name: '命運卡池',
        hasOffRate: true,
        pool: {
          rarity5: ['命運的交織', '時空的約定', '世界的盡頭', '永恆的誓言', '星河的守護', '暗夜的溫柔'],
          rarity4: ['甜蜜時空', '浪漫邂逅', '溫馨旅程', '驚喜相遇', '暖心陪伴'],
          rarity3: ['普通命運', '日常旅程', '簡約時空', '平凡幸福', '溫馨瞬間']
        }
      }
    }
  },
  shiningname: {
    name: '以閃亮之名',
    currency: '粉鑽',
    pullCost: 120,
    pity: 60,
    softPity: 50,
    rates: { rarity5: 0.025, rarity4: 0.095, rarity3: 0.88 },
    guarantee4: 10,
    rarityNames: { 5: 'UR', 4: 'SSR', 3: 'SR' },
    offRateGuarantee: 3,
    milestones: [
      { spent: 2400, reward: '粉鑽 x240', claimed: false },
      { spent: 4800, reward: 'UR服裝自選 x1', claimed: false },
      { spent: 9600, reward: '限定UR自選 x1', claimed: false }
    ],
    poolTypes: {
      outfit: {
        name: '限定服裝池',
        hasOffRate: true,
        pool: {
          rarity5: ['星河禮服', '夢幻婚紗', '璀璨晚裝', '華麗古風', '優雅旗袍', '甜美洛麗塔', '帥氣西裝', '浪漫泳裝'],
          rarity4: ['優雅連衣裙', '休閒套裝', '運動風格', '學院風', '街頭潮流', '復古風情'],
          rarity3: ['日常T恤', '簡約牛仔', '舒適運動', '清新碎花', '純色基礎', '百搭外套']
        }
      },
      accessory: {
        name: '飾品卡池',
        hasOffRate: true,
        pool: {
          rarity5: ['璀璨皇冠', '夢幻翅膀', '星光項鍊', '華麗頭飾', '優雅手套', '精緻耳飾'],
          rarity4: ['甜美髮飾', '優雅項鍊', '時尚手鍊', '精緻胸針', '浪漫花環'],
          rarity3: ['簡約髮圈', '基礎項鍊', '日常手鍊', '普通耳環', '百搭髮夾']
        }
      }
    }
  },
  hell: {
    name: '地獄有甚麼不好',
    currency: '惡魔幣',
    pullCost: 180,
    pity: 80,
    softPity: 65,
    rates: { rarity5: 0.018, rarity4: 0.082, rarity3: 0.90 },
    guarantee4: 10,
    rarityNames: { 5: 'UR', 4: 'SSR', 3: 'SR' },
    offRateGuarantee: 3,
    milestones: [
      { spent: 3600, reward: '惡魔幣 x360', claimed: false },
      { spent: 7200, reward: 'UR惡魔自選 x1', claimed: false },
      { spent: 14400, reward: '限定UR自選 x1', claimed: false }
    ],
    poolTypes: {
      character: {
        name: '惡魔卡池',
        hasOffRate: true,
        pool: {
          rarity5: ['路西法', '別西卜', '阿斯莫德', '利維坦', '瑪門', '撒旦', '路西法·墮落之王', '別西卜·暴食之主', '阿斯莫德·慾望之魔'],
          rarity4: ['路西法', '別西卜', '阿斯莫德', '利維坦', '瑪門', '撒旦', '貝利亞', '阿斯塔羅特'],
          rarity3: ['小惡魔', '地獄犬', '魅魔', '夢魔', '惡靈', '暗影']
        }
      },
      card: {
        name: '契約卡池',
        hasOffRate: true,
        pool: {
          rarity5: ['靈魂契約', '永恆誓言', '墮落之約', '黑暗盟約', '血之契約', '地獄婚約'],
          rarity4: ['惡魔契約', '靈魂綁定', '黑暗交易', '血之盟約', '墮落誓言'],
          rarity3: ['普通契約', '簡約約定', '基礎盟約', '臨時契約', '弱小誓言']
        }
      }
    }
  }
};

let gachaState = {
  currentGame: 'genshin',
  currentPoolType: 'character',
  pity5: 0,
  pity4: 0,
  guarantee: false,
  consecutiveOffRate: 0,
  currency: 16000,
  totalSpent: 0,
  claimedMilestones: [],
  stats: { total: 0, rarity5: 0, rarity4: 0, rarity3: 0 },
  history: [],
  customUp: [],
  customUp4: []
};

function loadGachaState() {
  const saved = localStorage.getItem('sx_arcade_gacha');
  if (saved) {
    try {
      const state = JSON.parse(saved);
      gachaState = { ...gachaState, ...state };
    } catch (e) {
      console.warn('載入抽卡狀態失敗', e);
    }
  }
}

function saveGachaState() {
  localStorage.setItem('sx_arcade_gacha', JSON.stringify({
    ...gachaState,
    history: gachaState.history.slice(0, 50)
  }));
}

function renderGachaGame() {
  loadGachaState();
  
  const area = document.getElementById('game-area');
  // 保留原有的 game-content-fullscreen 类，添加 gacha-area 类
  area.className = 'game-content-fullscreen gacha-area';
  
  const config = GACHA_CONFIGS[gachaState.currentGame];
  const poolTypes = config.poolTypes;
  const availablePoolTypes = Object.keys(poolTypes);
  
  if (!availablePoolTypes.includes(gachaState.currentPoolType)) {
    gachaState.currentPoolType = availablePoolTypes[0];
  }
  
  const currentPool = poolTypes[gachaState.currentPoolType];
  
  area.innerHTML = `
    <div class="gacha-container">
      <div class="game-selector">
        <div class="selector-label">選擇遊戲</div>
        <div class="game-tabs" id="game-tabs">
          ${Object.entries(GACHA_CONFIGS).map(([key, cfg]) => `
            <button class="game-tab ${key === gachaState.currentGame ? 'active' : ''}" data-game="${key}">${cfg.name}</button>
          `).join('')}
        </div>
      </div>

      <div class="pool-selector">
        <div class="selector-label">選擇池類型</div>
        <div class="pool-tabs" id="pool-tabs">
          ${Object.entries(poolTypes).map(([key, pool]) => `
            <button class="pool-tab ${key === gachaState.currentPoolType ? 'active' : ''}" data-pool="${key}">${pool.name}</button>
          `).join('')}
        </div>
      </div>

      <div class="config-section">
        <div class="config-header">
          <h3><i class="fas fa-cog"></i> 卡池設定</h3>
          <button class="config-toggle-btn" onclick="toggleConfigPanel()">
            <i class="fas fa-chevron-down" id="config-toggle-icon"></i>
          </button>
        </div>
        <div class="config-panel" id="config-panel">
          <div class="config-row">
            <div class="config-label">當期UP (5星)</div>
            <div class="char-select-area">
              <div class="char-tags" id="up-char-tags">
                ${gachaState.customUp.map(char => `
                  <span class="char-tag up-tag" onclick="removeUpChar('${char}')">${char} <i class="fas fa-times"></i></span>
                `).join('')}
              </div>
              <div class="char-input-row">
                <input type="text" id="up-char-input" class="char-input" placeholder="輸入UP名稱">
                <button class="add-char-btn" onclick="addUpChar()">新增</button>
              </div>
            </div>
          </div>
          
          <div class="config-row">
            <div class="config-label">陪跑 (4星UP)</div>
            <div class="char-select-area">
              <div class="char-tags" id="up4-char-tags">
                ${gachaState.customUp4.map(char => `
                  <span class="char-tag up4-tag" onclick="removeUp4Char('${char}')">${char} <i class="fas fa-times"></i></span>
                `).join('')}
              </div>
              <div class="char-input-row">
                <input type="text" id="up4-char-input" class="char-input" placeholder="輸入4星陪跑">
                <button class="add-char-btn" onclick="addUp4Char()">新增</button>
              </div>
            </div>
          </div>
          
          <div class="config-info">
            <i class="fas fa-info-circle"></i>
            <span>${currentPool.hasOffRate ? '此池有歪池機制：50%機率抽到UP，歪了則進入大保底' : '此池無歪池機制'}</span>
          </div>
        </div>
      </div>

      <div class="banner-section">
        <div class="banner-card">
          <div class="banner-image">
            <div class="banner-placeholder">
              <i class="fas fa-star"></i>
              <span id="banner-title">${getBannerTitle()}</span>
            </div>
          </div>
          <div class="banner-info">
            <div class="currency-info">
              <i class="fas fa-gem"></i>
              <span id="gacha-currency">${gachaState.currency}</span>
            </div>
            <div class="pity-info">
              <span>保底: <strong id="pity-count">${gachaState.pity5}</strong>/${config.pity}</span>
              <span class="guarantee-status" id="guarantee-status">${gachaState.guarantee ? '大保底' : ''}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="gacha-buttons">
        <button class="gacha-btn single" onclick="doGacha(1)">
          <span class="btn-label">單抽</span>
          <span class="btn-cost"><i class="fas fa-gem"></i> ${config.pullCost}</span>
        </button>
        <button class="gacha-btn ten" onclick="doGacha(10)">
          <span class="btn-label">十連</span>
          <span class="btn-cost"><i class="fas fa-gem"></i> ${config.pullCost * 10}</span>
        </button>
      </div>

      <div class="stats-section">
        <div class="stats-header">
          <h3><i class="fas fa-chart-pie"></i> 統計</h3>
          <button class="reset-btn" onclick="resetGachaStats()"><i class="fas fa-rotate-right"></i> 重置</button>
        </div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value" id="total-pulls">${gachaState.stats.total}</div>
            <div class="stat-label">總抽數</div>
          </div>
          <div class="stat-card rarity-5">
            <div class="stat-value" id="count-5">${gachaState.stats.rarity5}</div>
            <div class="stat-label">${config.rarityNames[5]}</div>
          </div>
          <div class="stat-card rarity-4">
            <div class="stat-value" id="count-4">${gachaState.stats.rarity4}</div>
            <div class="stat-label">${config.rarityNames[4]}</div>
          </div>
          <div class="stat-card rarity-3">
            <div class="stat-value" id="count-3">${gachaState.stats.rarity3}</div>
            <div class="stat-label">${config.rarityNames[3]}</div>
          </div>
        </div>
        <div class="rate-info">
          <span>5星: <strong id="rate-5">${gachaState.stats.total > 0 ? ((gachaState.stats.rarity5 / gachaState.stats.total) * 100).toFixed(2) : '0.00'}%</strong></span>
          <span>4星: <strong id="rate-4">${gachaState.stats.total > 0 ? ((gachaState.stats.rarity4 / gachaState.stats.total) * 100).toFixed(2) : '0.00'}%</strong></span>
        </div>
      </div>

      <div class="milestone-section" id="milestone-progress">
      </div>

      <div class="history-section">
        <h3><i class="fas fa-history"></i> 最近</h3>
        <div class="history-list" id="history-list">
          ${gachaState.history.length === 0 ? '<div class="history-empty">尚無記錄</div>' : 
            gachaState.history.slice(0, 10).map(item => `
              <div class="history-item rarity-${item.rarity}">
                <div class="history-icon"><i class="fas fa-star"></i></div>
                <div class="history-info">
                  <div class="history-name">${item.name}${item.isUp ? ' UP' : ''}${item.isOffRate ? ' 歪' : ''}</div>
                  <div class="history-meta">${item.rarityName}</div>
                </div>
              </div>
            `).join('')}
        </div>
      </div>
    </div>

    <div class="result-modal hidden" id="gacha-result-modal">
      <div class="result-content">
        <div class="result-header">
          <h2 id="result-title">抽卡結果</h2>
          <button class="close-btn" onclick="closeGachaResult()"><i class="fas fa-times"></i></button>
        </div>
        <div class="result-items" id="result-items"></div>
        <button class="continue-btn" onclick="closeGachaResult()">繼續</button>
      </div>
    </div>
  `;
  
  document.getElementById('game-tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.game-tab');
    if (tab) {
      selectGachaGame(tab.dataset.game);
    }
  });
  
  document.getElementById('pool-tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.pool-tab');
    if (tab) {
      selectPoolType(tab.dataset.pool);
    }
  });
  
  document.getElementById('up-char-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addUpChar();
  });
  
  document.getElementById('up4-char-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addUp4Char();
  });
}

// 渲染单一游戏的抽卡界面（从机台进入）
function renderSingleGameGacha(gameKey) {
  loadGachaState();
  
  const area = document.getElementById('game-area');
  area.className = 'game-content-fullscreen gacha-area';
  
  const config = GACHA_CONFIGS[gameKey];
  const poolTypes = config.poolTypes;
  const availablePoolTypes = Object.keys(poolTypes);
  
  if (!availablePoolTypes.includes(gachaState.currentPoolType)) {
    gachaState.currentPoolType = availablePoolTypes[0];
  }
  
  const currentPool = poolTypes[gachaState.currentPoolType];
  
  area.innerHTML = `
    <div class="gacha-container">
      <div class="game-title-display">
        <h2>${config.name}</h2>
      </div>
      
      <div class="pool-selector">
        <div class="selector-label">選擇池類型</div>
        <div class="pool-tabs" id="pool-tabs">
          ${Object.entries(poolTypes).map(([key, pool]) => `
            <button class="pool-tab ${key === gachaState.currentPoolType ? 'active' : ''}" data-pool="${key}">${pool.name}</button>
          `).join('')}
        </div>
      </div>

      <div class="config-section">
        <div class="config-header">
          <h3><i class="fas fa-cog"></i> 卡池設定</h3>
          <button class="config-toggle-btn" onclick="toggleConfigPanel()">
            <i class="fas fa-chevron-down" id="config-toggle-icon"></i>
          </button>
        </div>
        <div class="config-panel" id="config-panel">
          <div class="config-row">
            <div class="config-label">當期UP (5星)</div>
            <div class="char-select-area">
              <div class="char-tags" id="up-char-tags">
                ${gachaState.customUp.map(char => `
                  <span class="char-tag up-tag" onclick="removeUpChar('${char}')">${char} <i class="fas fa-times"></i></span>
                `).join('')}
              </div>
              <div class="char-input-row">
                <input type="text" id="up-char-input" class="char-input" placeholder="輸入UP名稱">
                <button class="add-char-btn" onclick="addUpChar()">新增</button>
              </div>
            </div>
          </div>
          
          <div class="config-row">
            <div class="config-label">陪跑 (4星UP)</div>
            <div class="char-select-area">
              <div class="char-tags" id="up4-char-tags">
                ${gachaState.customUp4.map(char => `
                  <span class="char-tag up4-tag" onclick="removeUp4Char('${char}')">${char} <i class="fas fa-times"></i></span>
                `).join('')}
              </div>
              <div class="char-input-row">
                <input type="text" id="up4-char-input" class="char-input" placeholder="輸入4星陪跑">
                <button class="add-char-btn" onclick="addUp4Char()">新增</button>
              </div>
            </div>
          </div>
          
          <div class="config-info">
            <i class="fas fa-info-circle"></i>
            <span>${currentPool.hasOffRate ? '此池有歪池機制：50%機率抽到UP，歪了則進入大保底' : '此池無歪池機制'}</span>
          </div>
        </div>
      </div>

      <div class="banner-section">
        <div class="banner-card">
          <div class="banner-image">
            <div class="banner-placeholder">
              <i class="fas fa-star"></i>
              <span id="banner-title">${getBannerTitle()}</span>
            </div>
          </div>
          <div class="banner-info">
            <div class="currency-info">
              <i class="fas fa-gem"></i>
              <span id="gacha-currency">${gachaState.currency}</span>
            </div>
            <div class="pity-info">
              <span>保底: <strong id="pity-count">${gachaState.pity5}</strong>/${config.pity}</span>
              <span class="guarantee-status" id="guarantee-status">${gachaState.guarantee ? '大保底' : ''}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="gacha-buttons">
        <button class="gacha-btn single" onclick="doGacha(1)">
          <span class="btn-label">單抽</span>
          <span class="btn-cost"><i class="fas fa-gem"></i> ${config.pullCost}</span>
        </button>
        <button class="gacha-btn ten" onclick="doGacha(10)">
          <span class="btn-label">十連</span>
          <span class="btn-cost"><i class="fas fa-gem"></i> ${config.pullCost * 10}</span>
        </button>
      </div>

      <div class="stats-section">
        <div class="stats-header">
          <h3><i class="fas fa-chart-pie"></i> 統計</h3>
          <button class="reset-btn" onclick="resetGachaStats()"><i class="fas fa-rotate-right"></i> 重置</button>
        </div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value" id="total-pulls">${gachaState.stats.total}</div>
            <div class="stat-label">總抽數</div>
          </div>
          <div class="stat-card rarity-5">
            <div class="stat-value" id="count-5">${gachaState.stats.rarity5}</div>
            <div class="stat-label">${config.rarityNames[5]}</div>
          </div>
          <div class="stat-card rarity-4">
            <div class="stat-value" id="count-4">${gachaState.stats.rarity4}</div>
            <div class="stat-label">${config.rarityNames[4]}</div>
          </div>
          <div class="stat-card rarity-3">
            <div class="stat-value" id="count-3">${gachaState.stats.rarity3}</div>
            <div class="stat-label">${config.rarityNames[3]}</div>
          </div>
        </div>
        <div class="rate-info">
          <span>5星: <strong id="rate-5">${gachaState.stats.total > 0 ? ((gachaState.stats.rarity5 / gachaState.stats.total) * 100).toFixed(2) : '0.00'}%</strong></span>
          <span>4星: <strong id="rate-4">${gachaState.stats.total > 0 ? ((gachaState.stats.rarity4 / gachaState.stats.total) * 100).toFixed(2) : '0.00'}%</strong></span>
        </div>
      </div>

      <div class="milestone-section" id="milestone-progress">
      </div>

      <div class="history-section">
        <h3><i class="fas fa-history"></i> 最近</h3>
        <div class="history-list" id="history-list">
          ${gachaState.history.length === 0 ? '<div class="history-empty">尚無記錄</div>' : 
            gachaState.history.slice(0, 10).map(item => `
              <div class="history-item rarity-${item.rarity}">
                <div class="history-icon"><i class="fas fa-star"></i></div>
                <div class="history-info">
                  <div class="history-name">${item.name}${item.isUp ? ' UP' : ''}${item.isOffRate ? ' 歪' : ''}</div>
                  <div class="history-meta">${item.rarityName}</div>
                </div>
              </div>
            `).join('')}
        </div>
      </div>
    </div>

    <div class="result-modal hidden" id="gacha-result-modal">
      <div class="result-content">
        <div class="result-header">
          <h2 id="result-title">抽卡結果</h2>
          <button class="close-btn" onclick="closeGachaResult()"><i class="fas fa-times"></i></button>
        </div>
        <div class="result-items" id="result-items"></div>
        <button class="continue-btn" onclick="closeGachaResult()">繼續</button>
      </div>
    </div>
  `;
  
  document.getElementById('pool-tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.pool-tab');
    if (tab) {
      selectPoolType(tab.dataset.pool);
    }
  });
  
  document.getElementById('up-char-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addUpChar();
  });
  
  document.getElementById('up4-char-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addUp4Char();
  });
}

function getBannerTitle() {
  const config = GACHA_CONFIGS[gachaState.currentGame];
  const poolTypes = config.poolTypes;
  const currentPool = poolTypes[gachaState.currentPoolType] || Object.values(poolTypes)[0];
  
  if (gachaState.customUp.length > 0) {
    return gachaState.customUp.join(' / ') + ' UP';
  }
  return currentPool.name;
}

function selectPoolType(poolType) {
  gachaState.currentPoolType = poolType;
  gachaState.pity5 = 0;
  gachaState.pity4 = 0;
  gachaState.guarantee = false;
  gachaState.consecutiveOffRate = 0;
  gachaState.customUp = [];
  gachaState.customUp4 = [];
  
  document.querySelectorAll('.pool-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.pool === poolType);
  });
  
  const config = GACHA_CONFIGS[gachaState.currentGame];
  const currentPool = config.poolTypes[poolType];
  
  document.getElementById('banner-title').textContent = currentPool.name;
  document.getElementById('pity-count').textContent = `0/${config.pity}`;
  document.getElementById('guarantee-status').textContent = '';
  
  const offRateGuarantee = config.offRateGuarantee || 0;
  const configInfo = document.querySelector('.config-info span');
  if (configInfo) {
    let infoText = currentPool.hasOffRate ? '此池有歪池機制：50%機率抽到UP，歪了則進入大保底' : '此池無歪池機制';
    if (offRateGuarantee > 0) {
      infoText += ` | 連續歪${offRateGuarantee}次強制UP`;
    }
    configInfo.textContent = infoText;
  }
  
  updateCharTags();
  saveGachaState();
}

function toggleConfigPanel() {
  const panel = document.getElementById('config-panel');
  const icon = document.getElementById('config-toggle-icon');
  panel.classList.toggle('collapsed');
  icon.classList.toggle('fa-chevron-down');
  icon.classList.toggle('fa-chevron-up');
}

function addUpChar() {
  const input = document.getElementById('up-char-input');
  const char = input.value.trim();
  if (char && !gachaState.customUp.includes(char)) {
    gachaState.customUp.push(char);
    input.value = '';
    updateCharTags();
    saveGachaState();
  }
}

function removeUpChar(char) {
  gachaState.customUp = gachaState.customUp.filter(c => c !== char);
  updateCharTags();
  saveGachaState();
}

function addUp4Char() {
  const input = document.getElementById('up4-char-input');
  const char = input.value.trim();
  if (char && !gachaState.customUp4.includes(char)) {
    gachaState.customUp4.push(char);
    input.value = '';
    updateCharTags();
    saveGachaState();
  }
}

function removeUp4Char(char) {
  gachaState.customUp4 = gachaState.customUp4.filter(c => c !== char);
  updateCharTags();
  saveGachaState();
}

function updateCharTags() {
  const upTags = document.getElementById('up-char-tags');
  if (upTags) {
    upTags.innerHTML = gachaState.customUp.map(char => `
      <span class="char-tag up-tag" onclick="removeUpChar('${char}')">${char} <i class="fas fa-times"></i></span>
    `).join('');
  }
  
  const up4Tags = document.getElementById('up4-char-tags');
  if (up4Tags) {
    up4Tags.innerHTML = gachaState.customUp4.map(char => `
      <span class="char-tag up4-tag" onclick="removeUp4Char('${char}')">${char} <i class="fas fa-times"></i></span>
    `).join('');
  }
  
  document.getElementById('banner-title').textContent = getBannerTitle();
}

function selectGachaGame(game) {
  gachaState.currentGame = game;
  gachaState.currentPoolType = Object.keys(GACHA_CONFIGS[game].poolTypes)[0];
  gachaState.pity5 = 0;
  gachaState.pity4 = 0;
  gachaState.guarantee = false;
  gachaState.consecutiveOffRate = 0;
  gachaState.customUp = [];
  gachaState.customUp4 = [];
  
  document.querySelectorAll('.game-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.game === game);
  });
  
  const config = GACHA_CONFIGS[game];
  const poolTypes = config.poolTypes;
  const firstPoolType = Object.keys(poolTypes)[0];
  const firstPool = poolTypes[firstPoolType];
  
  const poolTabsContainer = document.getElementById('pool-tabs');
  if (poolTabsContainer) {
    poolTabsContainer.innerHTML = Object.entries(poolTypes).map(([key, pool]) => `
      <button class="pool-tab ${key === gachaState.currentPoolType ? 'active' : ''}" data-pool="${key}">${pool.name}</button>
    `).join('');
  }
  
  document.getElementById('banner-title').textContent = firstPool.name;
  document.getElementById('pity-count').textContent = `0/${config.pity}`;
  document.getElementById('guarantee-status').textContent = '';
  
  document.querySelectorAll('.stat-card.rarity-5 .stat-label').forEach(el => el.textContent = config.rarityNames[5]);
  document.querySelectorAll('.stat-card.rarity-4 .stat-label').forEach(el => el.textContent = config.rarityNames[4]);
  document.querySelectorAll('.stat-card.rarity-3 .stat-label').forEach(el => el.textContent = config.rarityNames[3]);
  
  document.querySelector('.gacha-btn.single .btn-cost').innerHTML = `<i class="fas fa-gem"></i> ${config.pullCost}`;
  document.querySelector('.gacha-btn.ten .btn-cost').innerHTML = `<i class="fas fa-gem"></i> ${config.pullCost * 10}`;
  
  const offRateGuarantee = config.offRateGuarantee || 0;
  const configInfo = document.querySelector('.config-info span');
  if (configInfo) {
    let infoText = firstPool.hasOffRate ? '此池有歪池機制：50%機率抽到UP，歪了則進入大保底' : '此池無歪池機制';
    if (offRateGuarantee > 0) {
      infoText += ` | 連續歪${offRateGuarantee}次強制UP`;
    }
    configInfo.textContent = infoText;
  }
  
  updateCharTags();
  updateMilestoneDisplay();
  saveGachaState();
}

function calculateRarity(config) {
  gachaState.pity5++;
  gachaState.pity4++;
  
  let adjusted5Rate = config.rates.rarity5;
  if (gachaState.pity5 >= config.softPity) {
    const extraRate = (gachaState.pity5 - config.softPity + 1) * 0.06;
    adjusted5Rate = Math.min(adjusted5Rate + extraRate, 1);
  }
  
  if (gachaState.pity5 >= config.pity) {
    return 5;
  }
  
  if (Math.random() < adjusted5Rate) {
    return 5;
  }
  
  if (gachaState.pity4 >= config.guarantee4) {
    return 4;
  }
  
  let adjusted4Rate = config.rates.rarity4;
  if (gachaState.pity4 > 1) {
    adjusted4Rate += (gachaState.pity4 - 1) * 0.02;
  }
  
  if (Math.random() < adjusted4Rate) {
    return 4;
  }
  
  return 3;
}

function pullGacha() {
  const config = GACHA_CONFIGS[gachaState.currentGame];
  const currentPool = config.poolTypes[gachaState.currentPoolType] || Object.values(config.poolTypes)[0];
  const rarity = calculateRarity(config);
  
  let pool;
  let rarityName;
  let isUp = false;
  let isOffRate = false;
  let isHardPity = false;
  
  if (rarity === 5) {
    rarityName = config.rarityNames[5];
    gachaState.stats.rarity5++;
    gachaState.pity5 = 0;
    
    const hasCustomUp = gachaState.customUp.length > 0;
    const hasOffRate = currentPool.hasOffRate;
    const offRateGuarantee = config.offRateGuarantee || 0;
    
    if (hasCustomUp) {
      if (hasOffRate) {
        const triggerHardPity = offRateGuarantee > 0 && gachaState.consecutiveOffRate >= offRateGuarantee;
        
        if (gachaState.guarantee || triggerHardPity) {
          pool = gachaState.customUp;
          isUp = true;
          isHardPity = triggerHardPity;
          gachaState.guarantee = false;
          gachaState.consecutiveOffRate = 0;
        } else {
          if (Math.random() < 0.5) {
            pool = gachaState.customUp;
            isUp = true;
            gachaState.consecutiveOffRate = 0;
          } else {
            pool = currentPool.pool.rarity5;
            isOffRate = true;
            gachaState.guarantee = true;
            gachaState.consecutiveOffRate++;
          }
        }
      } else {
        pool = gachaState.customUp;
        isUp = true;
      }
    } else {
      pool = currentPool.pool.rarity5;
      if (hasOffRate) {
        const triggerHardPity = offRateGuarantee > 0 && gachaState.consecutiveOffRate >= offRateGuarantee;
        
        if (gachaState.guarantee || triggerHardPity) {
          gachaState.guarantee = false;
          gachaState.consecutiveOffRate = 0;
          isHardPity = triggerHardPity;
        } else if (Math.random() < 0.5) {
          gachaState.guarantee = true;
          gachaState.consecutiveOffRate++;
        } else {
          gachaState.consecutiveOffRate = 0;
        }
      }
    }
  } else if (rarity === 4) {
    rarityName = config.rarityNames[4];
    gachaState.stats.rarity4++;
    gachaState.pity4 = 0;
    
    if (gachaState.customUp4.length > 0 && Math.random() < 0.5) {
      pool = gachaState.customUp4;
      isUp = true;
    } else {
      pool = currentPool.pool.rarity4;
    }
  } else {
    pool = currentPool.pool.rarity3;
    rarityName = config.rarityNames[3];
    gachaState.stats.rarity3++;
  }
  
  const name = pool[Math.floor(Math.random() * pool.length)];
  gachaState.stats.total++;
  
  const item = { name, rarity, rarityName, isUp, isOffRate, isHardPity };
  gachaState.history.unshift(item);
  
  return item;
}

function doGacha(count) {
  const config = GACHA_CONFIGS[gachaState.currentGame];
  const cost = config.pullCost * count;
  
  if (gachaState.currency < cost) {
    alert('貨幣不足！');
    return;
  }
  
  gachaState.currency -= cost;
  gachaState.totalSpent += cost;
  
  const results = [];
  for (let i = 0; i < count; i++) {
    results.push(pullGacha());
  }
  
  checkMilestones();
  updateGachaDisplay();
  showGachaResult(results);
  saveGachaState();
}

function checkMilestones() {
  const config = GACHA_CONFIGS[gachaState.currentGame];
  const milestones = config.milestones || [];
  
  for (let i = 0; i < milestones.length; i++) {
    const milestone = milestones[i];
    const key = `${gachaState.currentGame}_${i}`;
    
    if (gachaState.totalSpent >= milestone.spent && !gachaState.claimedMilestones.includes(key)) {
      gachaState.claimedMilestones.push(key);
      showMilestoneReward(milestone);
    }
  }
}

function showMilestoneReward(milestone) {
  const modal = document.createElement('div');
  modal.className = 'milestone-modal';
  modal.innerHTML = `
    <div class="milestone-content">
      <div class="milestone-icon"><i class="fas fa-gift"></i></div>
      <div class="milestone-title">累儲獎勵達成！</div>
      <div class="milestone-desc">累計消費 ${milestone.spent} 獲得</div>
      <div class="milestone-reward">${milestone.reward}</div>
      <button class="milestone-btn" onclick="this.parentElement.parentElement.remove()">領取</button>
    </div>
  `;
  document.body.appendChild(modal);
}

function getMilestoneProgress() {
  const config = GACHA_CONFIGS[gachaState.currentGame];
  const milestones = config.milestones || [];
  
  if (milestones.length === 0) return null;
  
  let currentMilestone = null;
  let progress = 0;
  let nextMilestone = null;
  
  for (let i = 0; i < milestones.length; i++) {
    const key = `${gachaState.currentGame}_${i}`;
    if (!gachaState.claimedMilestones.includes(key)) {
      nextMilestone = milestones[i];
      progress = Math.min(gachaState.totalSpent / nextMilestone.spent * 100, 100);
      break;
    }
    currentMilestone = milestones[i];
  }
  
  return { currentMilestone, nextMilestone, progress, totalSpent: gachaState.totalSpent };
}

function updateGachaDisplay() {
  const config = GACHA_CONFIGS[gachaState.currentGame];
  
  document.getElementById('gacha-currency').textContent = gachaState.currency;
  document.getElementById('pity-count').textContent = `${gachaState.pity5}/${config.pity}`;
  
  const offRateGuarantee = config.offRateGuarantee || 0;
  let statusText = gachaState.guarantee ? '大保底' : '';
  if (offRateGuarantee > 0 && gachaState.consecutiveOffRate > 0) {
    statusText += ` 歪${gachaState.consecutiveOffRate}/${offRateGuarantee}`;
  }
  document.getElementById('guarantee-status').textContent = statusText;
  
  document.getElementById('total-pulls').textContent = gachaState.stats.total;
  document.getElementById('count-5').textContent = gachaState.stats.rarity5;
  document.getElementById('count-4').textContent = gachaState.stats.rarity4;
  document.getElementById('count-3').textContent = gachaState.stats.rarity3;
  
  const rate5 = gachaState.stats.total > 0 ? ((gachaState.stats.rarity5 / gachaState.stats.total) * 100).toFixed(2) : '0.00';
  const rate4 = gachaState.stats.total > 0 ? ((gachaState.stats.rarity4 / gachaState.stats.total) * 100).toFixed(2) : '0.00';
  document.getElementById('rate-5').textContent = `${rate5}%`;
  document.getElementById('rate-4').textContent = `${rate4}%`;
  
  const historyList = document.getElementById('history-list');
  historyList.innerHTML = gachaState.history.slice(0, 10).map(item => `
    <div class="history-item rarity-${item.rarity}">
      <div class="history-icon"><i class="fas fa-star"></i></div>
      <div class="history-info">
        <div class="history-name">${item.name}${item.isUp ? ' UP' : ''}${item.isOffRate ? ' 歪' : ''}${item.isHardPity ? ' 強制' : ''}</div>
        <div class="history-meta">${item.rarityName}</div>
      </div>
    </div>
  `).join('') || '<div class="history-empty">尚無記錄</div>';
  
  updateMilestoneDisplay();
}

function updateMilestoneDisplay() {
  const progress = getMilestoneProgress();
  const container = document.getElementById('milestone-progress');
  
  if (!container) return;
  
  if (!progress || !progress.nextMilestone) {
    container.innerHTML = '<div class="milestone-complete">所有累儲獎勵已領取！</div>';
    return;
  }
  
  container.innerHTML = `
    <div class="milestone-header">
      <span class="milestone-label">累儲進度</span>
      <span class="milestone-spent">${progress.totalSpent} / ${progress.nextMilestone.spent}</span>
    </div>
    <div class="milestone-bar">
      <div class="milestone-fill" style="width: ${progress.progress}%"></div>
    </div>
    <div class="milestone-reward-preview">下一獎勵: ${progress.nextMilestone.reward}</div>
  `;
}

function showGachaResult(results) {
  results.sort((a, b) => b.rarity - a.rarity);
  
  const resultItems = document.getElementById('result-items');
  resultItems.innerHTML = results.map(item => `
    <div class="result-item rarity-${item.rarity}">
      <div class="result-item-icon"><i class="fas fa-star"></i></div>
      <div class="result-item-name">${item.name}${item.isUp ? ' UP' : ''}${item.isOffRate ? ' 歪' : ''}${item.isHardPity ? ' 強制' : ''}</div>
    </div>
  `).join('');
  
  const hasUp = results.some(r => r.isUp && r.rarity === 5);
  const has5Star = results.some(r => r.rarity === 5);
  const hasOffRate = results.some(r => r.isOffRate);
  const hasHardPity = results.some(r => r.isHardPity);
  
  let title = '抽卡結果';
  if (hasHardPity) title = '★ 上課佬觸發！強制UP！';
  else if (hasUp) title = '★ 獲得 UP！';
  else if (hasOffRate) title = '★ 歪了...';
  else if (has5Star) title = '★ 獲得 5星！';
  
  document.getElementById('result-title').textContent = title;
  
  document.getElementById('gacha-result-modal').classList.remove('hidden');
}

function closeGachaResult() {
  document.getElementById('gacha-result-modal').classList.add('hidden');
}

function resetGachaStats() {
  if (!confirm('確定要重置所有統計嗎？')) return;
  
  gachaState = {
    currentGame: gachaState.currentGame,
    currentPoolType: gachaState.currentPoolType,
    pity5: 0,
    pity4: 0,
    guarantee: false,
    consecutiveOffRate: 0,
    currency: 16000,
    totalSpent: 0,
    claimedMilestones: [],
    stats: { total: 0, rarity5: 0, rarity4: 0, rarity3: 0 },
    history: [],
    customUp: gachaState.customUp,
    customUp4: gachaState.customUp4
  };
  
  updateGachaDisplay();
  saveGachaState();
}

// ============ 吃角子老虎機 ============
const SLOT_ICONS = [
  'apple', 'apricot', 'banana', 'big_win', 'cherry', 'grapes', 
  'lemon', 'lucky_seven', 'orange', 'pear', 'strawberry', 'watermelon'
];

const SLOT_PAYOUTS = {
  'lucky_seven': { three: 100, two: 10 },
  'big_win': { three: 50, two: 5 },
  'cherry': { three: 30, two: 3 },
  'grapes': { three: 20, two: 2 },
  'watermelon': { three: 15, two: 2 },
  'strawberry': { three: 12, two: 1 },
  'banana': { three: 10, two: 1 },
  'orange': { three: 8, two: 1 },
  'apple': { three: 6, two: 0 },
  'pear': { three: 5, two: 0 },
  'lemon': { three: 4, two: 0 },
  'apricot': { three: 3, two: 0 }
};

const SLOT_WEIGHTS = {
  'lucky_seven': 1,
  'big_win': 2,
  'cherry': 4,
  'grapes': 6,
  'watermelon': 8,
  'strawberry': 10,
  'banana': 12,
  'orange': 14,
  'apple': 16,
  'pear': 18,
  'lemon': 20,
  'apricot': 22
};

let slotState = {
  cols: null,
  spinning: false,
  bet: 10,
  totalWin: 0,
  totalSpins: 0,
  lastWin: 0
};

function loadSlotState() {
  const saved = localStorage.getItem('sx_arcade_slot');
  if (saved) {
    try {
      const state = JSON.parse(saved);
      slotState = { ...slotState, ...state, spinning: false };
    } catch (e) {
      console.warn('載入老虎機狀態失敗', e);
    }
  }
}

function saveSlotState() {
  localStorage.setItem('sx_arcade_slot', JSON.stringify({
    bet: slotState.bet,
    totalWin: slotState.totalWin,
    totalSpins: slotState.totalSpins
  }));
}

function renderSlotGame() {
  loadSlotState();
  
  const area = document.getElementById('game-area');
  area.className = 'game-content-fullscreen slot-area';
  
  area.innerHTML = `
    <div class="slot-container">
      <div class="slot-stats">
        <div class="slot-stat">
          <span class="stat-label">總轉動</span>
          <span class="stat-value" id="slot-total-spins">${slotState.totalSpins}</span>
        </div>
        <div class="slot-stat">
          <span class="stat-label">總贏得</span>
          <span class="stat-value" id="slot-total-win">${slotState.totalWin}</span>
        </div>
      </div>
      
      <div class="slot-machine" id="slot-machine">
        <div class="slot-window">
          <div class="slot-border">
            <div class="slot-reels">
              <div class="reel-spacer"></div>
              <div class="reel-outer"><div class="reel"></div></div>
              <div class="reel-spacer"></div>
              <div class="reel-outer"><div class="reel"></div></div>
              <div class="reel-spacer"></div>
              <div class="reel-outer"><div class="reel"></div></div>
              <div class="reel-spacer"></div>
              <div class="reel-outer"><div class="reel"></div></div>
              <div class="reel-spacer"></div>
              <div class="reel-outer"><div class="reel"></div></div>
              <div class="reel-spacer"></div>
            </div>
          </div>
        </div>
        
        <div class="slot-win-display" id="slot-win-display">
          <span class="win-label">贏得</span>
          <span class="win-value" id="slot-last-win">0</span>
        </div>
      </div>
      
      <div class="slot-controls">
        <div class="bet-control">
          <button class="bet-btn" onclick="changeSlotBet(-5)">-5</button>
          <div class="bet-display">
            <span class="bet-label">下注</span>
            <span class="bet-value" id="slot-bet">${slotState.bet}</span>
          </div>
          <button class="bet-btn" onclick="changeSlotBet(5)">+5</button>
        </div>
        
        <button class="spin-btn" id="spin-btn" onclick="spinSlot()">
          <i class="fas fa-sync-alt"></i>
          <span>轉動</span>
        </button>
      </div>
      
      <div class="slot-paytable">
        <h4><i class="fas fa-list"></i> 賠率表</h4>
        <div class="paytable-grid">
          <div class="paytable-item top">
            <div class="pay-icon">7</div>
            <div class="pay-multi">x100</div>
            <div class="pay-chance">0.3%</div>
          </div>
          <div class="paytable-item">
            <div class="pay-icon">★</div>
            <div class="pay-multi">x50</div>
            <div class="pay-chance">0.6%</div>
          </div>
          <div class="paytable-item">
            <div class="pay-icon">🍒</div>
            <div class="pay-multi">x30</div>
            <div class="pay-chance">1.2%</div>
          </div>
          <div class="paytable-item">
            <div class="pay-icon">🍇</div>
            <div class="pay-multi">x20</div>
            <div class="pay-chance">1.8%</div>
          </div>
          <div class="paytable-item">
            <div class="pay-icon">🍉</div>
            <div class="pay-multi">x15</div>
            <div class="pay-chance">2.4%</div>
          </div>
          <div class="paytable-item">
            <div class="pay-icon">🍓</div>
            <div class="pay-multi">x12</div>
            <div class="pay-chance">3.0%</div>
          </div>
          <div class="paytable-item">
            <div class="pay-icon">🍌</div>
            <div class="pay-multi">x10</div>
            <div class="pay-chance">3.6%</div>
          </div>
          <div class="paytable-item">
            <div class="pay-icon">🍊</div>
            <div class="pay-multi">x8</div>
            <div class="pay-chance">4.2%</div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  initSlotReels();
}

function initSlotReels() {
  slotState.cols = document.querySelectorAll('.slot-reels .reel');
  const baseItemAmount = 40;
  
  for (let i = 0; i < slotState.cols.length; ++i) {
    let col = slotState.cols[i];
    let amountOfItems = baseItemAmount + (i * 3);
    let elms = '';
    let firstThreeElms = '';
    
    for (let x = 0; x < amountOfItems; x++) {
      let icon = getRandomSlotIcon();
      let item = `<div class="slot-icon" data-item="${icon}"><img src="slot-items/${icon}.png"></div>`;
      elms += item;
      if (x < 3) firstThreeElms += item;
    }
    col.innerHTML = elms + firstThreeElms;
  }
}

function getRandomSlotIcon() {
  const totalWeight = Object.values(SLOT_WEIGHTS).reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  
  for (const [icon, weight] of Object.entries(SLOT_WEIGHTS)) {
    random -= weight;
    if (random <= 0) {
      return icon;
    }
  }
  
  return SLOT_ICONS[SLOT_ICONS.length - 1];
}

function changeSlotBet(delta) {
  const newBet = slotState.bet + delta;
  if (newBet >= 5 && newBet <= 100) {
    slotState.bet = newBet;
    document.getElementById('slot-bet').textContent = slotState.bet;
    saveSlotState();
  }
}

function spinSlot() {
  if (slotState.spinning) return;
  
  const spinBtn = document.getElementById('spin-btn');
  const machine = document.getElementById('slot-machine');
  
  if (coins < slotState.bet) {
    alert('金幣不足！');
    return;
  }
  
  coins -= slotState.bet;
  saveCoins();
  updateCoinsDisplay();
  
  slotState.spinning = true;
  spinBtn.disabled = true;
  machine.classList.add('spinning');
  
  const BASE_DURATION = 2.0;
  const COLUMN_DELAY = 0.4;
  
  const durations = [];
  for (let i = 0; i < slotState.cols.length; i++) {
    const duration = BASE_DURATION + (i * COLUMN_DELAY) + (Math.random() * 0.3);
    durations.push(duration);
    slotState.cols[i].style.animationDuration = duration + 's';
  }
  
  const maxDuration = Math.max(...durations);
  
  setTimeout(setSlotResult, 1000);
  
  setTimeout(() => {
    machine.classList.remove('spinning');
    spinBtn.disabled = false;
    slotState.spinning = false;
    
    const win = calculateSlotWin();
    if (win > 0) {
      coins += win;
      slotState.totalWin += win;
      saveCoins();
      updateCoinsDisplay();
    }
    
    slotState.totalSpins++;
    slotState.lastWin = win;
    saveSlotState();
    
    document.getElementById('slot-last-win').textContent = win;
    document.getElementById('slot-total-spins').textContent = slotState.totalSpins;
    document.getElementById('slot-total-win').textContent = slotState.totalWin;
    
    if (win > 0) {
      const winDisplay = document.getElementById('slot-win-display');
      winDisplay.classList.add('winning');
      setTimeout(() => winDisplay.classList.remove('winning'), 1000);
    }
  }, maxDuration * 1000 + 200);
}

function setSlotResult() {
  for (let col of slotState.cols) {
    let results = [
      getRandomSlotIcon(),
      getRandomSlotIcon(),
      getRandomSlotIcon()
    ];
    
    let icons = col.querySelectorAll('.slot-icon');
    for (let x = 0; x < 3; x++) {
      const img = icons[x].querySelector('img');
      if (img) {
        img.setAttribute('src', `slot-items/${results[x]}.png`);
      }
      icons[x].dataset.item = results[x];
      
      const lastImg = icons[icons.length - 3 + x].querySelector('img');
      if (lastImg) {
        lastImg.setAttribute('src', `slot-items/${results[x]}.png`);
      }
      icons[icons.length - 3 + x].dataset.item = results[x];
    }
  }
}

function calculateSlotWin() {
  const results = [];
  
  for (let col of slotState.cols) {
    const icons = col.querySelectorAll('.slot-icon');
    const middleIcon = icons[icons.length - 2];
    results.push(middleIcon.dataset.item);
  }
  
  const counts = {};
  for (let icon of results) {
    counts[icon] = (counts[icon] || 0) + 1;
  }
  
  let totalWin = 0;
  
  for (let [icon, count] of Object.entries(counts)) {
    const payout = SLOT_PAYOUTS[icon];
    if (payout) {
      if (count >= 3) {
        totalWin += payout.three * slotState.bet;
      } else if (count === 2) {
        totalWin += payout.two * slotState.bet;
      }
    }
  }
  
  return totalWin;
}

// ============ 俄羅斯方塊 ============
let tetrisInterval = null;
let tetrisBoard = [];
let tetrisPiece = null;
let tetrisScore = 0;
let tetrisLines = 0;
let tetrisLevel = 1;
const TETRIS_COLS = 10;
const TETRIS_ROWS = 20;
const TETRIS_SHAPES = {
  I: [[1,1,1,1]],
  O: [[1,1],[1,1]],
  T: [[0,1,0],[1,1,1]],
  S: [[0,1,1],[1,1,0]],
  Z: [[1,1,0],[0,1,1]],
  J: [[1,0,0],[1,1,1]],
  L: [[0,0,1],[1,1,1]]
};

function renderTetrisGame() {
  const area = document.getElementById('game-area');
  area.innerHTML = `
    <div class="tetris-container">
      <div class="tetris-info">
        <div class="tetris-stat">
          <span class="label">分數</span>
          <span class="value" id="tetris-score">0</span>
        </div>
        <div class="tetris-stat">
          <span class="label">消除</span>
          <span class="value" id="tetris-lines">0</span>
        </div>
        <div class="tetris-stat">
          <span class="label">等級</span>
          <span class="value" id="tetris-level">1</span>
        </div>
      </div>
      <div class="tetris-board" id="tetris-board"></div>
      <div class="tetris-controls">
        <div class="control-row">
          <button class="control-btn" onclick="moveTetrisPiece('left')"><i class="fas fa-arrow-left"></i></button>
          <button class="control-btn" onclick="rotateTetrisPiece()"><i class="fas fa-rotate"></i></button>
          <button class="control-btn" onclick="moveTetrisPiece('right')"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="control-row">
          <button class="control-btn down" onclick="moveTetrisPiece('down')"><i class="fas fa-arrow-down"></i></button>
          <button class="control-btn drop" onclick="dropTetrisPiece()"><i class="fas fa-angles-down"></i></button>
        </div>
      </div>
    </div>
  `;
  
  initTetris();
}

function initTetris() {
  tetrisBoard = Array(TETRIS_ROWS).fill(null).map(() => Array(TETRIS_COLS).fill(0));
  tetrisScore = 0;
  tetrisLines = 0;
  tetrisLevel = 1;
  
  spawnTetrisPiece();
  renderTetrisBoard();
  
  if (tetrisInterval) clearInterval(tetrisInterval);
  tetrisInterval = setInterval(tetrisGameLoop, 1000 - (tetrisLevel - 1) * 100);
}

function spawnTetrisPiece() {
  const shapes = Object.keys(TETRIS_SHAPES);
  const shape = shapes[Math.floor(Math.random() * shapes.length)];
  tetrisPiece = {
    shape: TETRIS_SHAPES[shape],
    type: shape,
    x: Math.floor(TETRIS_COLS / 2) - Math.floor(TETRIS_SHAPES[shape][0].length / 2),
    y: 0
  };
  
  if (checkTetrisCollision(tetrisPiece.x, tetrisPiece.y, tetrisPiece.shape)) {
    clearInterval(tetrisInterval);
    alert(`遊戲結束！得分: ${tetrisScore}`);
    updateHighScore('tetris', tetrisScore);
  }
}

function checkTetrisCollision(x, y, shape) {
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const newX = x + col;
        const newY = y + row;
        if (newX < 0 || newX >= TETRIS_COLS || newY >= TETRIS_ROWS) return true;
        if (newY >= 0 && tetrisBoard[newY][newX]) return true;
      }
    }
  }
  return false;
}

function moveTetrisPiece(dir) {
  if (!tetrisPiece) return;
  
  let newX = tetrisPiece.x;
  let newY = tetrisPiece.y;
  
  switch (dir) {
    case 'left': newX--; break;
    case 'right': newX++; break;
    case 'down': newY++; break;
  }
  
  if (!checkTetrisCollision(newX, newY, tetrisPiece.shape)) {
    tetrisPiece.x = newX;
    tetrisPiece.y = newY;
    renderTetrisBoard();
  } else if (dir === 'down') {
    lockTetrisPiece();
  }
}

function rotateTetrisPiece() {
  if (!tetrisPiece) return;
  
  const rotated = tetrisPiece.shape[0].map((_, i) =>
    tetrisPiece.shape.map(row => row[i]).reverse()
  );
  
  if (!checkTetrisCollision(tetrisPiece.x, tetrisPiece.y, rotated)) {
    tetrisPiece.shape = rotated;
    renderTetrisBoard();
  }
}

function dropTetrisPiece() {
  if (!tetrisPiece) return;
  
  while (!checkTetrisCollision(tetrisPiece.x, tetrisPiece.y + 1, tetrisPiece.shape)) {
    tetrisPiece.y++;
  }
  lockTetrisPiece();
}

function lockTetrisPiece() {
  for (let row = 0; row < tetrisPiece.shape.length; row++) {
    for (let col = 0; col < tetrisPiece.shape[row].length; col++) {
      if (tetrisPiece.shape[row][col]) {
        tetrisBoard[tetrisPiece.y + row][tetrisPiece.x + col] = tetrisPiece.type;
      }
    }
  }
  
  clearTetrisLines();
  spawnTetrisPiece();
  renderTetrisBoard();
}

function clearTetrisLines() {
  let linesCleared = 0;
  
  for (let row = TETRIS_ROWS - 1; row >= 0; row--) {
    if (tetrisBoard[row].every(cell => cell !== 0)) {
      tetrisBoard.splice(row, 1);
      tetrisBoard.unshift(Array(TETRIS_COLS).fill(0));
      linesCleared++;
      row++;
    }
  }
  
  if (linesCleared > 0) {
    const points = [0, 100, 300, 500, 800];
    tetrisScore += points[linesCleared] * tetrisLevel;
    tetrisLines += linesCleared;
    tetrisLevel = Math.floor(tetrisLines / 10) + 1;
    
    document.getElementById('tetris-score').textContent = tetrisScore;
    document.getElementById('tetris-lines').textContent = tetrisLines;
    document.getElementById('tetris-level').textContent = tetrisLevel;
    
    if (window.achievementEngine) {
      window.achievementEngine.updateStat('tetris_lines', linesCleared);
    }
    
    clearInterval(tetrisInterval);
    tetrisInterval = setInterval(tetrisGameLoop, Math.max(100, 1000 - (tetrisLevel - 1) * 100));
  }
}

function tetrisGameLoop() {
  moveTetrisPiece('down');
}

function renderTetrisBoard() {
  const board = document.getElementById('tetris-board');
  if (!board) return;
  
  const colors = {
    I: '#00f0f0', O: '#f0f000', T: '#a000f0',
    S: '#00f000', Z: '#f00000', J: '#0000f0', L: '#f0a000'
  };
  
  let html = '';
  for (let row = 0; row < TETRIS_ROWS; row++) {
    for (let col = 0; col < TETRIS_COLS; col++) {
      let cell = tetrisBoard[row][col];
      
      if (tetrisPiece) {
        const pieceRow = row - tetrisPiece.y;
        const pieceCol = col - tetrisPiece.x;
        if (pieceRow >= 0 && pieceRow < tetrisPiece.shape.length &&
            pieceCol >= 0 && pieceCol < tetrisPiece.shape[0].length &&
            tetrisPiece.shape[pieceRow][pieceCol]) {
          cell = tetrisPiece.type;
        }
      }
      
      const color = cell ? colors[cell] : 'transparent';
      html += `<div class="tetris-cell" style="background: ${color}"></div>`;
    }
  }
  board.innerHTML = html;
}

// ============ 打地鼠 ============
let whackInterval = null;
let whackScore = 0;
let whackTimeLeft = 30;
let whackMoles = [];
const WHACK_HOLES = 9;

function renderWhackAMoleGame() {
  const area = document.getElementById('game-area');
  area.innerHTML = `
    <div class="whack-container">
      <div class="whack-header">
        <div class="whack-stat">
          <span class="label">分數</span>
          <span class="value" id="whack-score">0</span>
        </div>
        <div class="whack-stat">
          <span class="label">時間</span>
          <span class="value" id="whack-time">30</span>
        </div>
      </div>
      <div class="whack-board" id="whack-board">
        ${Array(WHACK_HOLES).fill(0).map((_, i) => `
          <div class="whack-hole" id="hole-${i}" onclick="whackMole(${i})">
            <div class="mole"></div>
          </div>
        `).join('')}
      </div>
      <button class="whack-start-btn" id="whack-start-btn" onclick="startWhackGame()">開始遊戲</button>
    </div>
  `;
}

function startWhackGame() {
  whackScore = 0;
  whackTimeLeft = 30;
  whackMoles = Array(WHACK_HOLES).fill(false);
  
  document.getElementById('whack-score').textContent = '0';
  document.getElementById('whack-time').textContent = '30';
  document.getElementById('whack-start-btn').disabled = true;
  
  if (whackInterval) clearInterval(whackInterval);
  
  whackInterval = setInterval(() => {
    whackTimeLeft--;
    document.getElementById('whack-time').textContent = whackTimeLeft;
    
    if (whackTimeLeft <= 0) {
      endWhackGame();
    }
  }, 1000);
  
  spawnMole();
}

function spawnMole() {
  if (whackTimeLeft <= 0) return;
  
  const availableHoles = whackMoles.map((hasMole, i) => hasMole ? -1 : i).filter(i => i >= 0);
  if (availableHoles.length === 0) return;
  
  const holeIndex = availableHoles[Math.floor(Math.random() * availableHoles.length)];
  whackMoles[holeIndex] = true;
  
  const hole = document.getElementById(`hole-${holeIndex}`);
  hole.classList.add('active');
  
  setTimeout(() => {
    hole.classList.remove('active');
    whackMoles[holeIndex] = false;
    
    if (whackTimeLeft > 0) {
      setTimeout(spawnMole, Math.random() * 500 + 200);
    }
  }, Math.random() * 800 + 400);
}

function whackMole(index) {
  if (!whackMoles[index] || whackTimeLeft <= 0) return;
  
  whackMoles[index] = false;
  whackScore += 10;
  
  document.getElementById('whack-score').textContent = whackScore;
  document.getElementById(`hole-${index}`).classList.remove('active');
  document.getElementById(`hole-${index}`).classList.add('hit');
  
  setTimeout(() => {
    document.getElementById(`hole-${index}`).classList.remove('hit');
  }, 200);
  
  if (window.audioManager) {
    window.audioManager.playClickSound();
  }
}

function endWhackGame() {
  clearInterval(whackInterval);
  document.getElementById('whack-start-btn').disabled = false;
  
  updateHighScore('whackamole', whackScore);
  
  if (window.achievementEngine) {
    window.achievementEngine.updateStat('whack_score', whackScore);
  }
  
  alert(`遊戲結束！得分: ${whackScore}`);
}

// ============ 記憶翻牌 ============
let memoryCards = [];
let memoryFlipped = [];
let memoryMatched = [];
let memoryMoves = 0;
let memoryCanFlip = true;

function renderMemoryGame() {
  const area = document.getElementById('game-area');
  area.innerHTML = `
    <div class="memory-container">
      <div class="memory-header">
        <div class="memory-stat">
          <span class="label">移動次數</span>
          <span class="value" id="memory-moves">0</span>
        </div>
        <div class="memory-stat">
          <span class="label">配對</span>
          <span class="value" id="memory-pairs">0/8</span>
        </div>
      </div>
      <div class="memory-board" id="memory-board"></div>
      <button class="memory-restart-btn" onclick="initMemoryGame()">重新開始</button>
    </div>
  `;
  
  initMemoryGame();
}

function initMemoryGame() {
  const symbols = ['🎮', '🎲', '🎯', '🎪', '🎨', '🎭', '🎵', '🎸'];
  memoryCards = [...symbols, ...symbols].sort(() => Math.random() - 0.5);
  memoryFlipped = [];
  memoryMatched = [];
  memoryMoves = 0;
  memoryCanFlip = true;
  
  document.getElementById('memory-moves').textContent = '0';
  document.getElementById('memory-pairs').textContent = '0/8';
  
  const board = document.getElementById('memory-board');
  board.innerHTML = memoryCards.map((symbol, i) => `
    <div class="memory-card" id="card-${i}" onclick="flipMemoryCard(${i})">
      <div class="card-front">?</div>
      <div class="card-back">${symbol}</div>
    </div>
  `).join('');
}

function flipMemoryCard(index) {
  if (!memoryCanFlip) return;
  if (memoryFlipped.includes(index)) return;
  if (memoryMatched.includes(index)) return;
  
  memoryFlipped.push(index);
  document.getElementById(`card-${index}`).classList.add('flipped');
  
  if (window.audioManager) {
    window.audioManager.playClickSound();
  }
  
  if (memoryFlipped.length === 2) {
    memoryMoves++;
    document.getElementById('memory-moves').textContent = memoryMoves;
    
    memoryCanFlip = false;
    
    const [first, second] = memoryFlipped;
    
    if (memoryCards[first] === memoryCards[second]) {
      memoryMatched.push(first, second);
      memoryFlipped = [];
      memoryCanFlip = true;
      
      document.getElementById('memory-pairs').textContent = `${memoryMatched.length / 2}/8`;
      
      if (memoryMatched.length === memoryCards.length) {
        setTimeout(() => {
          alert(`恭喜完成！移動次數: ${memoryMoves}`);
          
          if (window.achievementEngine) {
            window.achievementEngine.updateStat('memory_complete', 1);
          }
        }, 500);
      }
    } else {
      setTimeout(() => {
        document.getElementById(`card-${first}`).classList.remove('flipped');
        document.getElementById(`card-${second}`).classList.remove('flipped');
        memoryFlipped = [];
        memoryCanFlip = true;
      }, 1000);
    }
  }
}

// ============ 彈珠台 ============
let pinballCanvas = null;
let pinballCtx = null;
let pinballBall = { x: 0, y: 0, vx: 0, vy: 0, r: 10 };
let pinballPaddle = { left: 30, right: 30 };
let pinballScore = 0;
let pinballBalls = 3;
let pinballAnimationId = null;

function renderPinballGame() {
  const area = document.getElementById('game-area');
  area.innerHTML = `
    <div class="pinball-container">
      <div class="pinball-header">
        <div class="pinball-stat">
          <span class="label">分數</span>
          <span class="value" id="pinball-score">0</span>
        </div>
        <div class="pinball-stat">
          <span class="label">球數</span>
          <span class="value" id="pinball-balls">3</span>
        </div>
      </div>
      <canvas id="pinball-canvas" width="300" height="500"></canvas>
      <div class="pinball-controls">
        <button class="pinball-btn" id="left-paddle" onmousedown="pinballPaddleDown('left')" onmouseup="pinballPaddleUp('left')" ontouchstart="pinballPaddleDown('left')" ontouchend="pinballPaddleUp('left')">左</button>
        <button class="pinball-btn launch" onclick="launchPinball()">發射</button>
        <button class="pinball-btn" id="right-paddle" onmousedown="pinballPaddleDown('right')" onmouseup="pinballPaddleUp('right')" ontouchstart="pinballPaddleDown('right')" ontouchend="pinballPaddleUp('right')">右</button>
      </div>
    </div>
  `;
  
  initPinball();
}

function initPinball() {
  pinballCanvas = document.getElementById('pinball-canvas');
  pinballCtx = pinballCanvas.getContext('2d');
  pinballScore = 0;
  pinballBalls = 3;
  
  resetPinballBall();
  pinballGameLoop();
}

function resetPinballBall() {
  pinballBall = {
    x: 280,
    y: 450,
    vx: 0,
    vy: 0,
    r: 8,
    launched: false
  };
}

function launchPinball() {
  if (pinballBall.launched || pinballBalls <= 0) return;
  
  pinballBall.vx = -3 - Math.random() * 2;
  pinballBall.vy = -10 - Math.random() * 3;
  pinballBall.launched = true;
}

function pinballPaddleDown(side) {
  pinballPaddle[side] = 60;
}

function pinballPaddleUp(side) {
  pinballPaddle[side] = 30;
}

function pinballGameLoop() {
  if (!pinballCtx) return;
  
  pinballCtx.fillStyle = '#1a1a2e';
  pinballCtx.fillRect(0, 0, 300, 500);
  
  pinballCtx.strokeStyle = '#fbbf24';
  pinballCtx.lineWidth = 3;
  pinballCtx.strokeRect(5, 5, 290, 490);
  
  pinballCtx.fillStyle = '#a855f7';
  pinballCtx.beginPath();
  pinballCtx.arc(100, 100, 15, 0, Math.PI * 2);
  pinballCtx.fill();
  
  pinballCtx.beginPath();
  pinballCtx.arc(200, 100, 15, 0, Math.PI * 2);
  pinballCtx.fill();
  
  pinballCtx.beginPath();
  pinballCtx.arc(150, 180, 15, 0, Math.PI * 2);
  pinballCtx.fill();
  
  pinballCtx.fillStyle = '#22c55e';
  pinballCtx.save();
  pinballCtx.translate(50, 420);
  pinballCtx.rotate(-pinballPaddle.left * Math.PI / 180);
  pinballCtx.fillRect(0, -5, 40, 10);
  pinballCtx.restore();
  
  pinballCtx.save();
  pinballCtx.translate(250, 420);
  pinballCtx.rotate(pinballPaddle.right * Math.PI / 180);
  pinballCtx.fillRect(-40, -5, 40, 10);
  pinballCtx.restore();
  
  if (pinballBall.launched) {
    pinballBall.vy += 0.3;
    pinballBall.x += pinballBall.vx;
    pinballBall.y += pinballBall.vy;
    
    if (pinballBall.x < 15 || pinballBall.x > 285) {
      pinballBall.vx *= -0.8;
      pinballBall.x = Math.max(15, Math.min(285, pinballBall.x));
    }
    
    if (pinballBall.y < 15) {
      pinballBall.vy *= -0.8;
      pinballBall.y = 15;
    }
    
    if (pinballBall.y > 490) {
      pinballBalls--;
      document.getElementById('pinball-balls').textContent = pinballBalls;
      
      if (pinballBalls <= 0) {
        alert(`遊戲結束！得分: ${pinballScore}`);
        updateHighScore('pinball', pinballScore);
        
        if (window.achievementEngine) {
          window.achievementEngine.updateStat('pinball_score', pinballScore);
        }
        
        cancelAnimationFrame(pinballAnimationId);
        return;
      }
      
      resetPinballBall();
    }
    
    const bumpers = [
      { x: 100, y: 100, r: 15 },
      { x: 200, y: 100, r: 15 },
      { x: 150, y: 180, r: 15 }
    ];
    
    bumpers.forEach(b => {
      const dx = pinballBall.x - b.x;
      const dy = pinballBall.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < pinballBall.r + b.r) {
        const angle = Math.atan2(dy, dx);
        pinballBall.vx = Math.cos(angle) * 8;
        pinballBall.vy = Math.sin(angle) * 8;
        
        pinballScore += 100;
        document.getElementById('pinball-score').textContent = pinballScore;
      }
    });
  }
  
  pinballCtx.fillStyle = '#ef4444';
  pinballCtx.beginPath();
  pinballCtx.arc(pinballBall.x, pinballBall.y, pinballBall.r, 0, Math.PI * 2);
  pinballCtx.fill();
  
  pinballAnimationId = requestAnimationFrame(pinballGameLoop);
}

// ============ 射飛鏢 ============
let dartCanvas = null;
let dartCtx = null;
let dartScore = 0;
let dartDartsLeft = 5;
let dartRound = 1;
let dartAim = { x: 150, y: 200 };
let dartThrown = [];
let dartAnimating = false;
let dartLastScore = 0;
let dartCharacterScore = 0;
let dartDualMode = null;
let dartAnimationId = null;

const DART_SCORES = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

function renderDartGame() {
  const area = document.getElementById('game-area');
  const hasCharacter = window.arcadeGame?.character && Character.hasCharacter();
  
  let modeSelectorHTML = '';
  if (hasCharacter && !dartDualMode) {
    modeSelectorHTML = `
      <div class="dart-mode-prompt" id="dart-mode-prompt">
        <div class="dart-mode-title">🎯 偵測到已邀請角色</div>
        <div class="dart-mode-subtitle">選擇遊戲模式</div>
        <div class="dart-mode-buttons">
          <button class="dart-mode-btn" onclick="startDartMode('single')">
            <i class="fas fa-user"></i>
            <span>單人模式</span>
          </button>
          <button class="dart-mode-btn" onclick="startDartMode('versus')">
            <i class="fas fa-swords"></i>
            <span>對戰模式</span>
          </button>
        </div>
      </div>
    `;
  }
  
  area.innerHTML = `
    <div class="dart-container">
      ${modeSelectorHTML}
      <div class="dart-header">
        <div class="dart-stat">
          <span class="label">回合</span>
          <span class="value" id="dart-round">1</span>
        </div>
        <div class="dart-stat">
          <span class="label">飛鏢</span>
          <span class="value" id="dart-left">5</span>
        </div>
        <div class="dart-stat">
          <span class="label">玩家</span>
          <span class="value" id="dart-score">0</span>
        </div>
        <div class="dart-stat hidden" id="dart-character-stat">
          <span class="label">角色</span>
          <span class="value" id="dart-character-score">0</span>
        </div>
      </div>
      <div class="dart-board-area">
        <canvas id="dart-canvas" width="300" height="400"></canvas>
        <div class="dart-last-score hidden" id="dart-last-score"></div>
      </div>
      <div class="dart-controls">
        <button class="dart-throw-btn" id="dart-throw-btn" onclick="throwDart()">
          <i class="fas fa-crosshairs"></i> 發射
        </button>
      </div>
      <div class="dart-hint">移動滑鼠或觸控瞄準，點擊發射</div>
    </div>
  `;
  
  if (!hasCharacter) {
    initDartGame();
  }
}

function startDartMode(mode) {
  dartDualMode = mode;
  const prompt = document.getElementById('dart-mode-prompt');
  if (prompt) prompt.classList.add('hidden');
  
  if (mode === 'versus') {
    document.getElementById('dart-character-stat').classList.remove('hidden');
  }
  
  initDartGame();
}

function initDartGame() {
  dartCanvas = document.getElementById('dart-canvas');
  dartCtx = dartCanvas.getContext('2d');
  dartScore = 0;
  dartCharacterScore = 0;
  dartDartsLeft = 5;
  dartRound = 1;
  dartThrown = [];
  dartAim = { x: 150, y: 200 };
  dartAnimating = false;
  
  document.getElementById('dart-score').textContent = '0';
  document.getElementById('dart-left').textContent = '5';
  document.getElementById('dart-round').textContent = '1';
  
  dartCanvas.addEventListener('mousemove', handleDartAim);
  dartCanvas.addEventListener('touchmove', handleDartTouch);
  dartCanvas.addEventListener('click', throwDart);
  
  renderDartBoard();
}

function handleDartAim(e) {
  if (dartAnimating || dartDartsLeft <= 0) return;
  
  const rect = dartCanvas.getBoundingClientRect();
  dartAim.x = e.clientX - rect.left;
  dartAim.y = e.clientY - rect.top;
  
  renderDartBoard();
}

function handleDartTouch(e) {
  e.preventDefault();
  if (dartAnimating || dartDartsLeft <= 0) return;
  
  const rect = dartCanvas.getBoundingClientRect();
  const touch = e.touches[0];
  dartAim.x = touch.clientX - rect.left;
  dartAim.y = touch.clientY - rect.top;
  
  renderDartBoard();
}

function renderDartBoard() {
  if (!dartCtx) return;
  
  const cx = 150;
  const cy = 180;
  const outerRadius = 140;
  
  dartCtx.fillStyle = '#1a1a2e';
  dartCtx.fillRect(0, 0, 300, 400);
  
  dartCtx.fillStyle = '#0d0d15';
  dartCtx.beginPath();
  dartCtx.arc(cx, cy, outerRadius + 5, 0, Math.PI * 2);
  dartCtx.fill();
  
  const colors = ['#1a1a1a', '#e8dcc4'];
  for (let i = 0; i < 20; i++) {
    const startAngle = (i * 18 - 99) * Math.PI / 180;
    const endAngle = ((i + 1) * 18 - 99) * Math.PI / 180;
    
    dartCtx.fillStyle = colors[i % 2];
    dartCtx.beginPath();
    dartCtx.moveTo(cx, cy);
    dartCtx.arc(cx, cy, outerRadius, startAngle, endAngle);
    dartCtx.closePath();
    dartCtx.fill();
  }
  
  for (let i = 0; i < 20; i++) {
    const startAngle = (i * 18 - 99) * Math.PI / 180;
    const endAngle = ((i + 1) * 18 - 99) * Math.PI / 180;
    
    dartCtx.fillStyle = i % 2 === 0 ? '#22c55e' : '#ef4444';
    dartCtx.beginPath();
    dartCtx.moveTo(cx, cy);
    dartCtx.arc(cx, cy, outerRadius * 0.9, startAngle, endAngle);
    dartCtx.closePath();
    dartCtx.fill();
    
    dartCtx.fillStyle = colors[i % 2];
    dartCtx.beginPath();
    dartCtx.moveTo(cx, cy);
    dartCtx.arc(cx, cy, outerRadius * 0.54, startAngle, endAngle);
    dartCtx.closePath();
    dartCtx.fill();
    
    dartCtx.fillStyle = i % 2 === 0 ? '#22c55e' : '#ef4444';
    dartCtx.beginPath();
    dartCtx.moveTo(cx, cy);
    dartCtx.arc(cx, cy, outerRadius * 0.48, startAngle, endAngle);
    dartCtx.closePath();
    dartCtx.fill();
    
    dartCtx.fillStyle = colors[i % 2];
    dartCtx.beginPath();
    dartCtx.moveTo(cx, cy);
    dartCtx.arc(cx, cy, outerRadius * 0.16, startAngle, endAngle);
    dartCtx.closePath();
    dartCtx.fill();
  }
  
  dartCtx.fillStyle = '#22c55e';
  dartCtx.beginPath();
  dartCtx.arc(cx, cy, outerRadius * 0.07, 0, Math.PI * 2);
  dartCtx.fill();
  
  dartCtx.fillStyle = '#ef4444';
  dartCtx.beginPath();
  dartCtx.arc(cx, cy, outerRadius * 0.03, 0, Math.PI * 2);
  dartCtx.fill();
  
  dartCtx.strokeStyle = '#333';
  dartCtx.lineWidth = 1;
  for (let i = 0; i < 20; i++) {
    const angle = (i * 18 - 99) * Math.PI / 180;
    dartCtx.beginPath();
    dartCtx.moveTo(cx, cy);
    dartCtx.lineTo(cx + Math.cos(angle) * outerRadius, cy + Math.sin(angle) * outerRadius);
    dartCtx.stroke();
  }
  
  dartCtx.font = '10px Arial';
  dartCtx.fillStyle = '#fbbf24';
  dartCtx.textAlign = 'center';
  dartCtx.textBaseline = 'middle';
  for (let i = 0; i < 20; i++) {
    const angle = (i * 18 - 90) * Math.PI / 180;
    const x = cx + Math.cos(angle) * (outerRadius + 12);
    const y = cy + Math.sin(angle) * (outerRadius + 12);
    dartCtx.fillText(DART_SCORES[i].toString(), x, y);
  }
  
  dartThrown.forEach(dart => {
    dartCtx.fillStyle = '#fbbf24';
    dartCtx.beginPath();
    dartCtx.arc(dart.x, dart.y, 4, 0, Math.PI * 2);
    dartCtx.fill();
    
    dartCtx.strokeStyle = '#f59e0b';
    dartCtx.lineWidth = 2;
    dartCtx.beginPath();
    dartCtx.moveTo(dart.x, dart.y);
    dartCtx.lineTo(dart.x, dart.y - 8);
    dartCtx.stroke();
  });
  
  if (!dartAnimating && dartDartsLeft > 0) {
    dartCtx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
    dartCtx.lineWidth = 1;
    dartCtx.setLineDash([5, 5]);
    dartCtx.beginPath();
    dartCtx.arc(dartAim.x, dartAim.y, 15, 0, Math.PI * 2);
    dartCtx.stroke();
    dartCtx.beginPath();
    dartCtx.moveTo(dartAim.x - 20, dartAim.y);
    dartCtx.lineTo(dartAim.x + 20, dartAim.y);
    dartCtx.stroke();
    dartCtx.beginPath();
    dartCtx.moveTo(dartAim.x, dartAim.y - 20);
    dartCtx.lineTo(dartAim.x, dartAim.y + 20);
    dartCtx.stroke();
    dartCtx.setLineDash([]);
  }
  
  dartCtx.fillStyle = '#333';
  dartCtx.fillRect(0, 350, 300, 50);
  dartCtx.fillStyle = '#fbbf24';
  dartCtx.font = '14px Arial';
  dartCtx.textAlign = 'center';
  dartCtx.fillText('得分區域: 靶心50分 | 內圈25分 | 雙倍環/三倍環加乘', 150, 375);
}

function throwDart() {
  if (dartAnimating || dartDartsLeft <= 0) return;
  
  dartAnimating = true;
  const btn = document.getElementById('dart-throw-btn');
  if (btn) btn.disabled = true;
  
  const cx = 150;
  const cy = 180;
  const outerRadius = 140;
  
  const accuracy = 0.85 + Math.random() * 0.15;
  const targetX = cx + (dartAim.x - cx) * accuracy + (Math.random() - 0.5) * 20;
  const targetY = cy + (dartAim.y - cy) * accuracy + (Math.random() - 0.5) * 20;
  
  const dx = targetX - cx;
  const dy = targetY - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  let score = calculateDartScore(dist, dx, dy, outerRadius);
  
  dartThrown.push({ x: targetX, y: targetY, score: score });
  dartLastScore = score;
  dartScore += score;
  
  dartDartsLeft--;
  document.getElementById('dart-score').textContent = dartScore;
  document.getElementById('dart-left').textContent = dartDartsLeft;
  
  showDartScore(score, targetX, targetY);
  
  renderDartBoard();
  
  setTimeout(() => {
    dartAnimating = false;
    if (btn) btn.disabled = false;
    
    if (dartDartsLeft <= 0) {
      if (dartDualMode === 'versus') {
        characterThrowDart();
      } else {
        endDartRound();
      }
    }
  }, 500);
}

function calculateDartScore(dist, dx, dy, outerRadius) {
  const cx = 150;
  const cy = 180;
  
  if (dist <= outerRadius * 0.03) return 50;
  if (dist <= outerRadius * 0.07) return 25;
  if (dist > outerRadius) return 0;
  
  let angle = Math.atan2(dy, dx) * 180 / Math.PI + 99;
  if (angle < 0) angle += 360;
  const segmentIndex = Math.floor(angle / 18) % 20;
  const baseScore = DART_SCORES[segmentIndex];
  
  const normalizedDist = dist / outerRadius;
  
  if (normalizedDist > 0.9 && normalizedDist <= 1.0) {
    return baseScore * 2;
  }
  if (normalizedDist > 0.48 && normalizedDist <= 0.54) {
    return baseScore * 3;
  }
  
  return baseScore;
}

function showDartScore(score, x, y) {
  const lastScoreEl = document.getElementById('dart-last-score');
  if (lastScoreEl) {
    lastScoreEl.textContent = score > 0 ? `+${score}` : 'Miss!';
    lastScoreEl.className = 'dart-last-score';
    lastScoreEl.style.left = `${x}px`;
    lastScoreEl.style.top = `${y}px`;
    
    setTimeout(() => {
      lastScoreEl.classList.add('hidden');
    }, 1000);
  }
}

function characterThrowDart() {
  const cx = 150;
  const cy = 180;
  const outerRadius = 140;
  
  let charScore = 0;
  for (let i = 0; i < 5; i++) {
    const targetX = cx + (Math.random() - 0.5) * 100;
    const targetY = cy + (Math.random() - 0.5) * 100;
    const dx = targetX - cx;
    const dy = targetY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    charScore += calculateDartScore(dist, dx, dy, outerRadius);
  }
  
  dartCharacterScore = charScore;
  document.getElementById('dart-character-score').textContent = dartCharacterScore;
  
  setTimeout(() => {
    const winner = dartScore > dartCharacterScore ? '玩家' : 
                   dartScore < dartCharacterScore ? '角色' : '平手';
    alert(`遊戲結束！\n玩家: ${dartScore} 分\n角色: ${dartCharacterScore} 分\n\n${winner === '平手' ? '平手！' : winner + ' 獲勝！'}`);
    updateHighScore('dart', dartScore);
    dartDualMode = null;
  }, 500);
}

function endDartRound() {
  dartRound++;
  
  if (dartRound > 3) {
    alert(`遊戲結束！總分: ${dartScore}`);
    updateHighScore('dart', dartScore);
    
    if (window.achievementEngine) {
      window.achievementEngine.updateStat('dart_score', dartScore);
    }
    return;
  }
  
  dartDartsLeft = 5;
  dartThrown = [];
  document.getElementById('dart-left').textContent = '5';
  document.getElementById('dart-round').textContent = dartRound;
  
  renderDartBoard();
}

// ============ 成人遊戲 ============
const ADULT_QUESTIONS = {
  truth: [
    '說出你最大的秘密',
    '你最尷尬的經歷是什麼？',
    '你有什麼不為人知的癖好？',
    '說出你最近的一個幻想',
    '你做過最瘋狂的事是什麼？'
  ],
  dare: [
    '模仿一個動物叫聲',
    '做一個搞笑的表情',
    '說一個諧音梗笑話',
    '表演一段即興舞蹈',
    '用奇怪的聲音說一句話'
  ]
};

const YELLOW_CARDS = [
  { text: '說出一個你最想嘗試的事', type: 'talk' },
  { text: '分享一個秘密', type: 'secret' },
  { text: '做一個搞笑動作', type: 'action' },
  { text: '模仿一個名人', type: 'action' },
  { text: '說出你的初戀故事', type: 'talk' },
  { text: '表演一個才藝', type: 'action' }
];

function renderYellowCardGame() {
  const area = document.getElementById('game-area');
  area.innerHTML = `
    <div class="adult-game-container">
      <div class="adult-warning">
        <i class="fas fa-exclamation-triangle"></i>
        <span>此遊戲包含成人內容</span>
      </div>
      <div class="card-deck" id="card-deck">
        <div class="card-back" onclick="drawYellowCard()">
          <i class="fas fa-hand-pointer"></i>
          <span>點擊抽牌</span>
        </div>
      </div>
      <div class="drawn-card hidden" id="drawn-card">
        <div class="card-content" id="card-content"></div>
        <button class="next-btn" onclick="resetYellowCard()">再抽一張</button>
      </div>
    </div>
  `;
}

function drawYellowCard() {
  const card = YELLOW_CARDS[Math.floor(Math.random() * YELLOW_CARDS.length)];
  
  document.getElementById('card-deck').classList.add('hidden');
  document.getElementById('drawn-card').classList.remove('hidden');
  document.getElementById('card-content').innerHTML = `
    <div class="card-type">${card.type === 'talk' ? '💬 對話' : card.type === 'secret' ? '🤫 秘密' : '🎬 動作'}</div>
    <div class="card-text">${card.text}</div>
  `;
}

function resetYellowCard() {
  document.getElementById('card-deck').classList.remove('hidden');
  document.getElementById('drawn-card').classList.add('hidden');
}

function renderTruthDareGame() {
  const area = document.getElementById('game-area');
  area.innerHTML = `
    <div class="adult-game-container">
      <div class="adult-warning">
        <i class="fas fa-exclamation-triangle"></i>
        <span>此遊戲包含成人內容</span>
      </div>
      <div class="truth-dare-buttons">
        <button class="truth-btn" onclick="selectTruthDare('truth')">
          <i class="fas fa-comments"></i>
          <span>真心話</span>
        </button>
        <button class="dare-btn" onclick="selectTruthDare('dare')">
          <i class="fas fa-running"></i>
          <span>大冒險</span>
        </button>
      </div>
      <div class="result-box hidden" id="truth-dare-result">
        <div class="result-text" id="result-text"></div>
        <button class="next-btn" onclick="resetTruthDare()">再選一次</button>
      </div>
    </div>
  `;
}

function selectTruthDare(type) {
  const questions = ADULT_QUESTIONS[type];
  const question = questions[Math.floor(Math.random() * questions.length)];
  
  document.querySelector('.truth-dare-buttons').classList.add('hidden');
  document.getElementById('truth-dare-result').classList.remove('hidden');
  document.getElementById('result-text').textContent = question;
}

function resetTruthDare() {
  document.querySelector('.truth-dare-buttons').classList.remove('hidden');
  document.getElementById('truth-dare-result').classList.add('hidden');
}

function renderRouletteGame() {
  const area = document.getElementById('game-area');
  area.innerHTML = `
    <div class="adult-game-container">
      <div class="adult-warning">
        <i class="fas fa-exclamation-triangle"></i>
        <span>此遊戲包含成人內容</span>
      </div>
      <div class="roulette-wheel" id="roulette-wheel">
        <div class="wheel-pointer"></div>
        <div class="wheel-segments">
          <div class="segment seg-1">飲酒</div>
          <div class="segment seg-2">唱歌</div>
          <div class="segment seg-3">跳舞</div>
          <div class="segment seg-4">真心話</div>
          <div class="segment seg-5">大冒險</div>
          <div class="segment seg-6">跳過</div>
        </div>
      </div>
      <button class="spin-roulette-btn" onclick="spinRoulette()">轉動輪盤</button>
      <div class="roulette-result hidden" id="roulette-result">
        <div class="result-text" id="roulette-result-text"></div>
        <button class="next-btn" onclick="resetRoulette()">再轉一次</button>
      </div>
    </div>
  `;
}

function spinRoulette() {
  const results = ['飲酒', '唱歌', '跳舞', '真心話', '大冒險', '跳過'];
  const result = results[Math.floor(Math.random() * results.length)];
  
  const wheel = document.getElementById('roulette-wheel');
  const rotation = 1800 + Math.random() * 360;
  wheel.style.transform = `rotate(${rotation}deg)`;
  
  setTimeout(() => {
    document.querySelector('.spin-roulette-btn').classList.add('hidden');
    document.getElementById('roulette-result').classList.remove('hidden');
    document.getElementById('roulette-result-text').textContent = `結果: ${result}`;
  }, 3000);
}

function resetRoulette() {
  document.getElementById('roulette-wheel').style.transform = 'rotate(0deg)';
  document.querySelector('.spin-roulette-btn').classList.remove('hidden');
  document.getElementById('roulette-result').classList.add('hidden');
}

function renderKingGame() {
  const area = document.getElementById('game-area');
  area.innerHTML = `
    <div class="adult-game-container">
      <div class="adult-warning">
        <i class="fas fa-exclamation-triangle"></i>
        <span>此遊戲包含成人內容</span>
      </div>
      <div class="king-game">
        <div class="king-card" id="king-card">
          <div class="king-icon"><i class="fas fa-crown"></i></div>
          <div class="king-title">國王遊戲</div>
          <div class="king-desc">抽籤決定國王與命令</div>
        </div>
        <div class="king-actions">
          <button class="king-btn" onclick="drawKing()">
            <i class="fas fa-random"></i> 抽籤
          </button>
        </div>
        <div class="king-result hidden" id="king-result">
          <div class="king-announcement" id="king-announcement"></div>
          <div class="king-order" id="king-order"></div>
          <button class="next-btn" onclick="resetKing()">重新開始</button>
        </div>
      </div>
    </div>
  `;
}

function drawKing() {
  const kingNum = Math.floor(Math.random() * 4) + 1;
  const orders = [
    '做一個搞笑動作',
    '說一個笑話',
    '模仿一個動物',
    '唱一首歌',
    '跳一支舞'
  ];
  const order = orders[Math.floor(Math.random() * orders.length)];
  
  document.querySelector('.king-card').classList.add('hidden');
  document.querySelector('.king-actions').classList.add('hidden');
  document.getElementById('king-result').classList.remove('hidden');
  document.getElementById('king-announcement').textContent = `${kingNum} 號是國王！`;
  document.getElementById('king-order').textContent = `命令: ${order}`;
}

function resetKing() {
  document.querySelector('.king-card').classList.remove('hidden');
  document.querySelector('.king-actions').classList.remove('hidden');
  document.getElementById('king-result').classList.add('hidden');
}

function renderOldMaidGame() {
  const area = document.getElementById('game-area');
  area.innerHTML = `
    <div class="adult-game-container">
      <div class="adult-warning">
        <i class="fas fa-exclamation-triangle"></i>
        <span>此遊戲包含成人內容</span>
      </div>
      <div class="old-maid-game">
        <div class="game-info">
          <h3>抽鬼牌</h3>
          <p>輪流抽牌，配對消除，最後拿到鬼牌的人輸</p>
        </div>
        <div class="cards-area" id="cards-area">
          <div class="player-cards" id="player-cards"></div>
          <div class="opponent-cards" id="opponent-cards"></div>
        </div>
        <button class="start-game-btn" onclick="startOldMaid()">開始遊戲</button>
        <div class="game-result hidden" id="old-maid-result">
          <div class="result-text" id="old-maid-result-text"></div>
          <button class="next-btn" onclick="resetOldMaid()">再玩一次</button>
        </div>
      </div>
    </div>
  `;
}

let oldMaidDeck = [];
let playerHand = [];
let opponentHand = [];

function startOldMaid() {
  oldMaidDeck = [];
  for (let i = 1; i <= 13; i++) {
    oldMaidDeck.push({ value: i, suit: 'hearts' });
    oldMaidDeck.push({ value: i, suit: 'diamonds' });
    oldMaidDeck.push({ value: i, suit: 'clubs' });
    oldMaidDeck.push({ value: i, suit: 'spades' });
  }
  oldMaidDeck.push({ value: 0, suit: 'joker' });
  
  oldMaidDeck.sort(() => Math.random() - 0.5);
  
  playerHand = oldMaidDeck.slice(0, 27);
  opponentHand = oldMaidDeck.slice(27);
  
  removePairs(playerHand);
  removePairs(opponentHand);
  
  document.querySelector('.start-game-btn').classList.add('hidden');
  renderOldMaidHands();
  
  setTimeout(() => {
    const playerWon = Math.random() > 0.5;
    document.getElementById('old-maid-result').classList.remove('hidden');
    document.getElementById('old-maid-result-text').textContent = playerWon ? '你贏了！' : '你輸了...拿到鬼牌';
  }, 2000);
}

function removePairs(hand) {
  const counts = {};
  hand.forEach(card => {
    counts[card.value] = (counts[card.value] || 0) + 1;
  });
  
  hand = hand.filter(card => counts[card.value] < 2);
  return hand;
}

function renderOldMaidHands() {
  document.getElementById('player-cards').innerHTML = `
    <div class="hand-label">你的牌 (${playerHand.length}張)</div>
    <div class="cards">${playerHand.map(c => `<div class="card">🎴</div>`).join('')}</div>
  `;
  document.getElementById('opponent-cards').innerHTML = `
    <div class="hand-label">對手的牌 (${opponentHand.length}張)</div>
    <div class="cards">${opponentHand.map(c => `<div class="card">🎴</div>`).join('')}</div>
  `;
}

function resetOldMaid() {
  document.querySelector('.start-game-btn').classList.remove('hidden');
  document.getElementById('old-maid-result').classList.add('hidden');
  document.getElementById('player-cards').innerHTML = '';
  document.getElementById('opponent-cards').innerHTML = '';
}

function renderDrunkPokerGame() {
  const area = document.getElementById('game-area');
  area.innerHTML = `
    <div class="adult-game-container">
      <div class="adult-warning">
        <i class="fas fa-exclamation-triangle"></i>
        <span>此遊戲包含成人內容 - 請理性飲酒</span>
      </div>
      <div class="drunk-poker">
        <div class="poker-table">
          <div class="dealer-area">
            <div class="dealer-cards" id="dealer-cards">
              <div class="card back">?</div>
              <div class="card back">?</div>
            </div>
          </div>
          <div class="player-area">
            <div class="player-cards-poker" id="player-cards-poker">
              <div class="card">🂡</div>
              <div class="card">🂱</div>
            </div>
          </div>
        </div>
        <div class="poker-score">
          <span>你的點數: <strong id="player-score">21</strong></span>
        </div>
        <div class="poker-actions">
          <button class="poker-btn hit" onclick="drunkPokerHit()">要牌</button>
          <button class="poker-btn stand" onclick="drunkPokerStand()">停牌</button>
        </div>
        <div class="drunk-penalty hidden" id="drunk-penalty">
          <div class="penalty-text" id="penalty-text"></div>
          <button class="next-btn" onclick="resetDrunkPoker()">再玩一局</button>
        </div>
      </div>
    </div>
  `;
}

let drunkPokerPlayerScore = 21;
let drunkPokerDealerScore = 17;

function drunkPokerHit() {
  drunkPokerPlayerScore += Math.floor(Math.random() * 10) + 1;
  document.getElementById('player-score').textContent = drunkPokerPlayerScore;
  
  if (drunkPokerPlayerScore > 21) {
    endDrunkPoker(false);
  }
}

function drunkPokerStand() {
  drunkPokerDealerScore = 17 + Math.floor(Math.random() * 4);
  endDrunkPoker(drunkPokerPlayerScore > drunkPokerDealerScore || drunkPokerDealerScore > 21);
}

function endDrunkPoker(playerWon) {
  document.querySelector('.poker-actions').classList.add('hidden');
  document.getElementById('drunk-penalty').classList.remove('hidden');
  
  if (playerWon) {
    document.getElementById('penalty-text').textContent = '你贏了！對手喝一杯！';
  } else {
    const penalties = ['喝一杯', '喝半杯', '喝兩杯', '說一個笑話代替'];
    document.getElementById('penalty-text').textContent = penalties[Math.floor(Math.random() * penalties.length)];
  }
}

function resetDrunkPoker() {
  drunkPokerPlayerScore = 21;
  document.getElementById('player-score').textContent = '21';
  document.querySelector('.poker-actions').classList.remove('hidden');
  document.getElementById('drunk-penalty').classList.add('hidden');
}

// ============ 事件綁定 ============
gamesGrid.addEventListener('click', (e) => {
  const card = e.target.closest('.game-card');
  if (card) {
    openGame(card.dataset.game);
  }
});

document.addEventListener('keydown', (e) => {
  if (currentGame === 'snake') {
    const keyMap = {
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right'
    };
    if (keyMap[e.key]) {
      e.preventDefault();
      changeSnakeDirection(keyMap[e.key]);
    }
  }
});

// ============ 初始化 ============
animationEnabled = loadAnimationSetting();
updateAnimationToggle();
playNeonIntro();

coins = loadCoins();
window.coins = coins;
highScores = loadScores();
loadArcadeState();
updateCoinsDisplay();
updateScoresDisplay();

function initMapMode() {
  const mapContainer = document.getElementById('map-container');
  const gamesGrid = document.getElementById('games-grid');
  const welcomeBanner = document.querySelector('.welcome-banner');
  
  if (mapContainer) {
    mapContainer.classList.remove('hidden');
    if (gamesGrid) gamesGrid.classList.add('hidden');
    if (welcomeBanner) welcomeBanner.classList.add('hidden');
    
    initArcadeGame();
    
    if (window.audioManager) {
      window.audioManager.playAmbient(arcadeState.playerPosition.floor);
    }
  }
}

function initClassicMode() {
  const mapContainer = document.getElementById('map-container');
  if (mapContainer) {
    mapContainer.classList.add('hidden');
  }
}

function getPlayerSpriteOptionsHtml() {
  var savedPlayerSprite = localStorage.getItem('sx_arcade_player_sprite') || 'default';
  var spriteOptions = [
    { id: 'default', name: '預設', colors: { body: '#4ade80', outline: '#166534' } },
    { id: 'blue', name: '藍色', colors: { body: '#3b82f6', outline: '#1d4ed8' } },
    { id: 'purple', name: '紫色', colors: { body: '#a855f7', outline: '#7c3aed' } },
    { id: 'red', name: '紅色', colors: { body: '#ef4444', outline: '#dc2626' } },
    { id: 'yellow', name: '黃色', colors: { body: '#f59e0b', outline: '#d97706' } },
    { id: 'pink', name: '粉色', colors: { body: '#ec4899', outline: '#db2777' } },
    { id: 'cyan', name: '青色', colors: { body: '#06b6d4', outline: '#0891b2' } }
  ];
  
  return spriteOptions.map(opt => `
    <div class="sprite-option-mini ${savedPlayerSprite === opt.id ? 'selected' : ''}" 
         onclick="selectSettingsPlayerSprite('${opt.id}')"
         title="${opt.name}">
      <div class="sprite-preview-mini" style="background: ${opt.colors.body}; border: 2px solid ${opt.colors.outline};"></div>
    </div>
  `).join('');
}

function selectSettingsPlayerSprite(spriteId) {
  localStorage.setItem('sx_arcade_player_sprite', spriteId);
  document.querySelectorAll('#settings-player-sprite-options .sprite-option-mini').forEach(function(el) {
    el.classList.remove('selected');
  });
  event.target.closest('.sprite-option-mini').classList.add('selected');
}

function openSettingsPanel() {
  var audioSettings = {};
  try {
    var saved = localStorage.getItem('sx_arcade_audio');
    if (saved) {
      audioSettings = JSON.parse(saved);
    }
  } catch (e) {}
  
  var bgmEnabled = audioSettings.bgmEnabled ?? true;
  var sfxEnabled = audioSettings.sfxEnabled ?? true;
  
  var musicSettings = {};
  try {
    var musicSaved = localStorage.getItem('sx_arcade_music');
    if (musicSaved) {
      musicSettings = JSON.parse(musicSaved);
    }
  } catch (e) {}
  
  var currentTrack = musicSettings.currentTrackIndex ?? 0;
  var playMode = musicSettings.playMode ?? 'loop';
  
  var musicFiles = window.audioManager ? window.audioManager.musicFiles : [];
  var trackOptions = musicFiles.map((track, idx) => 
    `<option value="${idx}" ${idx === currentTrack ? 'selected' : ''}>${track.name}</option>`
  ).join('');
  
  var overlay = document.createElement('div');
  overlay.className = 'settings-panel-overlay';
  overlay.innerHTML = `
    <div class="settings-panel">
      <div class="settings-panel-header">
        <h3><i class="fas fa-cog"></i> 設定</h3>
        <button class="close-btn" onclick="closeSettingsPanel()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="settings-panel-content">
        <div class="settings-section">
          <div class="section-title">
            <i class="fas fa-user-friends"></i> 邀請角色
          </div>
          <button class="invite-btn" onclick="closeSettingsPanel(); showCharacterSelectModal();">
            <i class="fas fa-user-plus"></i> 邀請角色一起玩
          </button>
        </div>
        <div class="settings-section">
          <div class="section-title">
            <i class="fas fa-coins"></i> 金幣餘額
          </div>
          <div class="coins-balance">
            <span class="balance-value">${coins}</span>
            <span class="balance-label">金幣</span>
          </div>
          <div class="topup-options">
            <button class="topup-btn" onclick="topupCoins(100)">+100</button>
            <button class="topup-btn" onclick="topupCoins(500)">+500</button>
            <button class="topup-btn" onclick="topupCoins(1000)">+1000</button>
          </div>
          <div class="kakaopay-section">
            <button class="kakaopay-btn" onclick="topupFromKakaopayAmount(100)">
              <i class="fas fa-wallet"></i> 儲值 100金幣 (NT$10)
            </button>
            <button class="kakaopay-btn" onclick="topupFromKakaopayAmount(500)">
              <i class="fas fa-wallet"></i> 儲值 500金幣 (NT$50)
            </button>
            <button class="kakaopay-btn" onclick="topupFromKakaopayAmount(1000)">
              <i class="fas fa-wallet"></i> 儲值 1000金幣 (NT$100)
            </button>
          </div>
        </div>
        <div class="settings-section">
          <div class="section-title">
            <i class="fas fa-music"></i> 音樂播放器
          </div>
          <div class="music-player-section">
            <div class="music-track-select">
              <label>選擇曲目</label>
              <select id="music-track-select" onchange="selectMusicTrack(this.value)">
                ${trackOptions}
              </select>
            </div>
            <div class="music-play-mode">
              <label>播放模式</label>
              <div class="play-mode-buttons">
                <button class="mode-btn ${playMode === 'loop' ? 'active' : ''}" onclick="setMusicPlayMode('loop')">
                  <i class="fas fa-redo"></i> 單曲循環
                </button>
                <button class="mode-btn ${playMode === 'playlist' ? 'active' : ''}" onclick="setMusicPlayMode('playlist')">
                  <i class="fas fa-list"></i> 歌單循環
                </button>
                <button class="mode-btn ${playMode === 'random' ? 'active' : ''}" onclick="setMusicPlayMode('random')">
                  <i class="fas fa-random"></i> 隨機播放
                </button>
              </div>
            </div>
            <div class="music-controls">
              <button class="music-btn" onclick="prevMusicTrack()">
                <i class="fas fa-step-backward"></i>
              </button>
              <button class="music-btn play-btn" id="music-play-btn" onclick="toggleMusicPlay()">
                <i class="fas fa-play"></i>
              </button>
              <button class="music-btn" onclick="nextMusicTrack()">
                <i class="fas fa-step-forward"></i>
              </button>
            </div>
            <div class="music-preview-section">
              <button class="preview-btn" onclick="previewCurrentTrack()">
                <i class="fas fa-headphones"></i> 試聽當前曲目
              </button>
              <button class="preview-btn stop-btn" onclick="stopMusicPreview()">
                <i class="fas fa-stop"></i> 停止試聽
              </button>
            </div>
          </div>
        </div>
        <div class="settings-section">
          <div class="section-title">
            <i class="fas fa-volume-up"></i> 聲音設定
          </div>
          <div class="audio-settings">
            <div class="audio-row" onclick="toggleBGM()">
              <span class="audio-label">
                <i class="fas fa-music"></i> 背景音樂
              </span>
              <div class="toggle-switch ${bgmEnabled ? 'active' : ''}" id="bgm-toggle"></div>
            </div>
            <div class="audio-row" onclick="toggleSFX()">
              <span class="audio-label">
                <i class="fas fa-volume-up"></i> 音效
              </span>
              <div class="toggle-switch ${sfxEnabled ? 'active' : ''}" id="sfx-toggle"></div>
            </div>
          </div>
        </div>
        <div class="settings-section">
          <div class="section-title">
            <i class="fas fa-user"></i> 小人物外觀
          </div>
          <div class="sprite-settings-inline">
            <div class="sprite-label">你的小人物：</div>
            <div class="sprite-options-inline" id="settings-player-sprite-options">
              ${getPlayerSpriteOptionsHtml()}
            </div>
          </div>
        </div>
        <div class="settings-section">
          <div class="section-title">
            <i class="fas fa-palette"></i> 外觀設定
          </div>
          <button class="appearance-btn" onclick="openAppearanceSettings()">
            <i class="fas fa-brush"></i> 調整外觀
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  
  updateMusicPlayButton();
}

function closeSettingsPanel() {
  var overlay = document.querySelector('.settings-panel-overlay');
  if (overlay) overlay.remove();
}

function selectMusicTrack(index) {
  if (window.audioManager) {
    window.audioManager.setTrack(parseInt(index));
  }
}

function setMusicPlayMode(mode) {
  if (window.audioManager) {
    window.audioManager.setPlayMode(mode);
    
    document.querySelectorAll('.mode-btn').forEach(function(btn) {
      btn.classList.remove('active');
    });
    event.target.closest('.mode-btn').classList.add('active');
  }
}

async function toggleMusicPlay() {
  if (window.audioManager) {
    if (window.audioManager.isPlaying) {
      window.audioManager.stopBGM();
    } else {
      await window.audioManager.playCurrentTrack();
    }
    updateMusicPlayButton();
  }
}

function updateMusicPlayButton() {
  var btn = document.getElementById('music-play-btn');
  if (btn && window.audioManager) {
    btn.innerHTML = window.audioManager.isPlaying ? 
      '<i class="fas fa-pause"></i>' : 
      '<i class="fas fa-play"></i>';
  }
}

async function prevMusicTrack() {
  if (window.audioManager) {
    await window.audioManager.prevTrack();
    updateTrackSelect();
    updateMusicPlayButton();
  }
}

async function nextMusicTrack() {
  if (window.audioManager) {
    await window.audioManager.nextTrack();
    updateTrackSelect();
    updateMusicPlayButton();
  }
}

function updateTrackSelect() {
  var select = document.getElementById('music-track-select');
  if (select && window.audioManager) {
    select.value = window.audioManager.currentTrackIndex;
  }
}

async function previewCurrentTrack() {
  if (window.audioManager) {
    var select = document.getElementById('music-track-select');
    var trackIndex = select ? parseInt(select.value) : 0;
    await window.audioManager.previewTrack(trackIndex);
  }
}

function stopMusicPreview() {
  if (window.audioManager) {
    window.audioManager.stopPreview();
  }
}

function toggleBGM() {
  if (window.audioManager) {
    var enabled = window.audioManager.toggleBGM();
    var toggle = document.getElementById('bgm-toggle');
    if (toggle) {
      toggle.classList.toggle('active', enabled);
    }
  }
}

function toggleSFX() {
  if (window.audioManager) {
    var enabled = window.audioManager.toggleSFX();
    var toggle = document.getElementById('sfx-toggle');
    if (toggle) {
      toggle.classList.toggle('active', enabled);
    }
  }
}

function topupCoins(amount) {
  coins += amount;
  window.coins = coins;
  arcadeState.totalCoinsEarned += amount;
  saveCoins();
  saveArcadeState();
  updateCoinsDisplay();
  
  var balanceValue = document.querySelector('.balance-value');
  if (balanceValue) {
    balanceValue.textContent = coins;
  }
}

function openKakaopay() {
  var overlay = document.querySelector('.settings-panel-overlay');
  if (overlay) overlay.remove();
  
  window.parent?.postMessage({
    type: 'openApp',
    appId: 'kakaopay'
  }, '*');
}

function topupFromKakaopayAmount(coinsAmount) {
  var twdAmount = Math.round(coinsAmount * 0.1);
  
  console.log('[Arcade] topupFromKakaopayAmount called, coins:', coinsAmount, 'twd:', twdAmount);
  
  showTopupWaiting();
  
  var msg = {
    type: 'KAKAOPAY_ARCADE_TOPUP',
    amount: twdAmount,
    coins: coinsAmount,
    source: '街機廳'
  };
  console.log('[Arcade] Sending message to parent:', msg);
  
  // 確保 parent 存在
  if (window.parent && window.parent !== window) {
    window.parent.postMessage(msg, '*');
  } else if (window.top) {
    window.top.postMessage(msg, '*');
  } else {
    console.error('[Arcade] No parent or top window available');
    hideTopupWaiting();
    showTopupFailed();
    return;
  }
  
  // 延長 timeout 到 30 秒
  window.topupTimeout = setTimeout(function() {
    console.log('[Arcade] Timeout reached, showing failed');
    hideTopupWaiting();
    showTopupFailed();
  }, 30000);
}

function showTopupWaiting() {
  var settingsOverlay = document.querySelector('.settings-panel-overlay');
  if (settingsOverlay) settingsOverlay.remove();
  
  var existing = document.querySelector('.topup-waiting-overlay');
  if (existing) existing.remove();
  
  var overlay = document.createElement('div');
  overlay.className = 'topup-waiting-overlay';
  overlay.innerHTML = `
    <div class="topup-waiting-box">
      <div class="topup-spinner"></div>
      <div class="topup-waiting-text">支付中...</div>
    </div>
  `;
  document.body.appendChild(overlay);
  console.log('showTopupWaiting called');
}

function hideTopupWaiting() {
  var overlay = document.querySelector('.topup-waiting-overlay');
  if (overlay) overlay.remove();
}

function showTopupSuccess(amount) {
  hideTopupWaiting();
  
  var existing = document.querySelector('.topup-result-overlay');
  if (existing) existing.remove();
  
  var overlay = document.createElement('div');
  overlay.className = 'topup-result-overlay';
  overlay.innerHTML = `
    <div class="topup-result-box success">
      <div class="topup-result-icon"><i class="fas fa-check-circle"></i></div>
      <div class="topup-result-title">儲值成功</div>
      <div class="topup-result-amount">+${amount} 金幣</div>
      <button class="topup-result-btn" onclick="this.parentElement.parentElement.remove()">關閉</button>
    </div>
  `;
  document.body.appendChild(overlay);
}

function showTopupFailed() {
  hideTopupWaiting();
  
  var existing = document.querySelector('.topup-result-overlay');
  if (existing) existing.remove();
  
  var overlay = document.createElement('div');
  overlay.className = 'topup-result-overlay';
  overlay.innerHTML = `
    <div class="topup-result-box failed">
      <div class="topup-result-icon"><i class="fas fa-times-circle"></i></div>
      <div class="topup-result-title">儲值失敗</div>
      <div class="topup-result-text">請確認 Kakaopay 餘額是否充足</div>
      <button class="topup-result-btn" onclick="this.parentElement.parentElement.remove()">確定</button>
    </div>
  `;
  document.body.appendChild(overlay);
}

window.addEventListener('message', function(event) {
  var data = event.data;
  if (!data || typeof data !== 'object') return;
  
  // 調試：記錄所有收到的訊息
  if (data.type && data.type.includes('TOPUP')) {
    console.log('[Arcade] Received message:', data.type, data);
  }
  
  if (data.type === 'KAKAOPAY_ARCADE_TOPUP_SUCCESS') {
    console.log('[Arcade] Topup success received:', data);
    
    if (window.topupTimeout) {
      clearTimeout(window.topupTimeout);
      window.topupTimeout = null;
      console.log('[Arcade] Timeout cleared');
    }
    
    var topupAmount = data.coins || data.amount || 0;
    console.log('[Arcade] Adding coins:', topupAmount, 'current coins:', coins);
    coins += topupAmount;
    window.coins = coins;
    arcadeState.totalCoinsEarned += topupAmount;
    saveCoins();
    saveArcadeState();
    updateCoinsDisplay();
    
    var balanceValue = document.querySelector('.balance-value');
    if (balanceValue) {
      balanceValue.textContent = coins;
    }
    
    console.log('[Arcade] New coins balance:', coins);
    showTopupSuccess(topupAmount);
  }
});

function openAppearanceSettings() {
  var overlay = document.querySelector('.settings-panel-overlay');
  if (overlay) overlay.remove();
  
  if (typeof SxAppAppearance !== 'undefined') {
    SxAppAppearance.openAppearancePanel('arcade', document.body, function() {
      var panel = document.getElementById('sx-app-appearance-panel');
      if (panel) panel.remove();
    });
  }
}

window.openGameFromMap = openGameFromMap;
window.arcadeState = arcadeState;
window.saveArcadeState = saveArcadeState;
window.openSettingsPanel = openSettingsPanel;
window.topupCoins = topupCoins;
window.openKakaopay = openKakaopay;
window.openAppearanceSettings = openAppearanceSettings;
window.topupFromKakaopayAmount = topupFromKakaopayAmount;
window.toggleBGM = toggleBGM;
window.toggleSFX = toggleSFX;
window.coins = coins;
window.selectSettingsPlayerSprite = selectSettingsPlayerSprite;
