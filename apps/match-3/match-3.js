const boardEl = document.getElementById('board');
const worldsScreen = document.getElementById('worlds-screen');
const worldsGrid = document.getElementById('worlds-grid');
const enterLatestBtn = document.getElementById('enter-latest');
const gameStatus = document.getElementById('game-status');
const gameControls = document.getElementById('game-controls');
const gameBoard = document.getElementById('game-board');
const gameFooter = document.getElementById('game-footer');
const levelSelect = document.getElementById('level-select');
const difficultySelect = document.getElementById('difficulty-select');
const generateBtn = document.getElementById('generate-level');
const genDifficultySelect = document.getElementById('gen-difficulty');
const genThemeSelect = document.getElementById('gen-theme');
const genCountInput = document.getElementById('gen-count');
const restartBtn = document.getElementById('restart-level');
const levelLabel = document.getElementById('level-label');
const targetLabel = document.getElementById('target-label');
const scoreLabel = document.getElementById('score-label');
const movesLabel = document.getElementById('moves-label');
const levelStatus = document.getElementById('level-status');

const LEVEL_COUNT = 100;
const BOARD_SIZE = 7;
const SHAPES = [
  [
    [1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1]
  ],
  [
    [0,1,1,1,1,1,0],
    [1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1],
    [0,1,1,1,1,1,0]
  ],
  [
    [0,0,1,1,1,0,0],
    [0,1,1,1,1,1,0],
    [1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1],
    [0,1,1,1,1,1,0],
    [0,0,1,1,1,0,0]
  ]
];

const FRUITS = ['🍎', '🍌', '🍇', '🍓', '🍊', '🍐'];
const SPECIAL_TYPES = {
  NONE: 0,
  BOMB: 1,
  LINE_H: 2,
  LINE_V: 3,
  COLOR_BOMB: 4
};

const LEVEL_STORAGE_KEY = 'sx_match3_levels';
const LAST_LEVEL_KEY = 'sx_match3_last_level';
const LEVEL_SCORE_KEY = 'sx_match3_level_scores';
const CHAR_COMPANION_KEY = 'sx_match3_char_companion';
const CHAR_PROGRESS_KEY = 'sx_match3_char_progress';
const COMMENT_FREQUENCY_KEY = 'sx_match3_comment_frequency';
const CHAR_PANEL_POSITION_KEY = 'sx_match3_char_panel_position';

let board = [];
let activeShape = SHAPES[0];
let selectedIndex = null;
let currentLevel = 1;
let score = 0;
let moves = 0;
let target = 0;
let combo = 0;
let isAnimating = false;
let levelGoals = [];
let collectedGoals = {};
let powerUps = { shuffle: 3, hint: 3, bomb: 2 };

let charCompanionEnabled = true;
let charCommentFrequency = 'normal';
let charProgress = 1;
let lastCommentTime = 0;
let charData = null;

const difficultyConfig = {
  easy: { moves: 30, target: 650, fruitCount: 4 },
  normal: { moves: 25, target: 820, fruitCount: 5 },
  hard: { moves: 20, target: 1000, fruitCount: 6 }
};

const WORLDS = [
  { id: 1, title: '世界 1', theme: '水果果盤', icon: '🍓', levels: 1 },
  { id: 2, title: '世界 2', theme: '蔬菜樂園', icon: '🥦', levels: 1 },
  { id: 3, title: '世界 3', theme: '熱帶海島', icon: '🍍', levels: 1 },
  { id: 4, title: '世界 4', theme: '甜點工坊', icon: '🧁', levels: 1 }
];

function getRandomFruit(fruitCount) {
  return FRUITS[Math.floor(Math.random() * fruitCount)];
}

function generateEmptyBoard() {
  return Array.from({ length: BOARD_SIZE * BOARD_SIZE }, () => ({ fruit: null, special: SPECIAL_TYPES.NONE, ice: 0 }));
}

function getShapeValue(index) {
  const row = Math.floor(index / BOARD_SIZE);
  const col = index % BOARD_SIZE;
  return activeShape?.[row]?.[col] === 1;
}

function hasMatchAt(index, tempBoard = board) {
  const row = Math.floor(index / BOARD_SIZE);
  const col = index % BOARD_SIZE;
  const cell = tempBoard[index];
  if (!cell || !cell.fruit) return false;

  const fruit = cell.fruit;
  let count = 1;
  let left = col - 1;
  while (left >= 0 && tempBoard[row * BOARD_SIZE + left]?.fruit === fruit) {
    count += 1;
    left -= 1;
  }
  let right = col + 1;
  while (right < BOARD_SIZE && tempBoard[row * BOARD_SIZE + right]?.fruit === fruit) {
    count += 1;
    right += 1;
  }
  if (count >= 3) return true;

  count = 1;
  let up = row - 1;
  while (up >= 0 && tempBoard[up * BOARD_SIZE + col]?.fruit === fruit) {
    count += 1;
    up -= 1;
  }
  let down = row + 1;
  while (down < BOARD_SIZE && tempBoard[down * BOARD_SIZE + col]?.fruit === fruit) {
    count += 1;
    down += 1;
  }
  return count >= 3;
}

function createBoard(config) {
  const tempBoard = generateEmptyBoard();
  for (let i = 0; i < tempBoard.length; i += 1) {
    if (!getShapeValue(i)) {
      tempBoard[i] = { fruit: null, special: SPECIAL_TYPES.NONE, ice: 0 };
      continue;
    }
    let fruit = getRandomFruit(config.fruitCount);
    tempBoard[i] = { fruit, special: SPECIAL_TYPES.NONE, ice: 0 };
    let safety = 0;
    while (hasMatchAt(i, tempBoard) && safety < 10) {
      fruit = getRandomFruit(config.fruitCount);
      tempBoard[i].fruit = fruit;
      safety += 1;
    }
  }
  
  if (currentLevel > 10) {
    const iceCount = Math.min(5, Math.floor(currentLevel / 10));
    let placed = 0;
    while (placed < iceCount) {
      const idx = Math.floor(Math.random() * tempBoard.length);
      if (getShapeValue(idx) && tempBoard[idx].fruit && tempBoard[idx].ice === 0) {
        tempBoard[idx].ice = 1;
        placed += 1;
      }
    }
  }
  
  return tempBoard;
}

function renderBoard() {
  if (!boardEl) return;
  boardEl.innerHTML = '';
  board.forEach((cell, index) => {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'tile';
    
    if (!getShapeValue(index)) {
      tile.classList.add('blocked');
      tile.disabled = true;
    } else {
      let content = cell.fruit || '';
      if (cell.special === SPECIAL_TYPES.BOMB) content = '💣';
      else if (cell.special === SPECIAL_TYPES.LINE_H) content = '➡️';
      else if (cell.special === SPECIAL_TYPES.LINE_V) content = '⬇️';
      else if (cell.special === SPECIAL_TYPES.COLOR_BOMB) content = '🌈';
      
      tile.textContent = content;
      
      if (cell.ice > 0) {
        tile.classList.add('ice');
        tile.innerHTML = `<span class="ice-overlay">🧊</span>${content}`;
      }
      
      if (cell.special !== SPECIAL_TYPES.NONE) {
        tile.classList.add('special');
      }
    }
    
    if (selectedIndex === index) tile.classList.add('selected');
    tile.addEventListener('click', () => handleTileClick(index));
    boardEl.appendChild(tile);
  });
}

function loadScoreMap() {
  const raw = localStorage.getItem(LEVEL_SCORE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

function saveScoreMap(map) {
  localStorage.setItem(LEVEL_SCORE_KEY, JSON.stringify(map));
}

function calcStars(scoreValue, targetValue) {
  if (scoreValue >= targetValue) return 3;
  if (scoreValue >= targetValue * 0.7) return 2;
  if (scoreValue >= targetValue * 0.4) return 1;
  return 0;
}

function buildWorlds() {
  if (!worldsGrid) return;
  const scoreMap = loadScoreMap();
  const levelsPerWorld = Math.ceil(LEVEL_COUNT / WORLDS.length);
  worldsGrid.innerHTML = WORLDS.map((world, idx) => {
    const startLevel = idx * levelsPerWorld + 1;
    const endLevel = Math.min(LEVEL_COUNT, startLevel + levelsPerWorld - 1);
    const levelButtons = [];
    for (let level = startLevel; level <= endLevel; level += 1) {
      const subIndex = level - startLevel + 1;
      const bestScore = scoreMap[level]?.score || 0;
      const levelTarget = scoreMap[level]?.target || (difficultyConfig.normal.target + level * 5);
      const stars = calcStars(bestScore, levelTarget);
      const starText = '★'.repeat(stars) + '☆'.repeat(3 - stars);
      levelButtons.push(`
        <button class="world-level-btn" type="button" data-level="${level}" data-stars="${stars}">
          <div class="level-label">${world.id}-${subIndex}</div>
          <div class="stars">${starText}</div>
        </button>
      `);
    }
    return `
      <div class="world-card">
        <div class="world-header">
          <div>
            <div class="world-title">${world.icon} ${world.title}</div>
            <div class="world-theme">主題：${world.theme}</div>
          </div>
          <span class="world-theme">${startLevel}-${endLevel}</span>
        </div>
        <div class="world-levels">${levelButtons.join('')}</div>
      </div>
    `;
  }).join('');

  worldsGrid.querySelectorAll('[data-level]').forEach(btn => {
    btn.addEventListener('click', () => {
      const level = Number(btn.dataset.level);
      startLevel(level);
    });
  });
}

function toggleGameView(showGame) {
  const hide = !showGame;
  worldsScreen?.classList.toggle('hidden', showGame);
  gameStatus?.classList.toggle('hidden', hide);
  gameControls?.classList.toggle('hidden', hide);
  gameBoard?.classList.toggle('hidden', hide);
  gameFooter?.classList.toggle('hidden', hide);
}

function updateStatus() {
  levelLabel.textContent = String(currentLevel);
  targetLabel.textContent = String(target);
  scoreLabel.textContent = String(score);
  movesLabel.textContent = String(moves);
  
  let statusText = '';
  if (score >= target) {
    statusText = '🎉 達成目標！';
  } else if (moves <= 0) {
    statusText = '😢 步數用盡，再試一次！';
  }
  
  const goalsText = levelGoals.map(g => {
    const collected = collectedGoals[g.fruit] || 0;
    return `${g.fruit}${collected}/${g.count}`;
  }).join(' ');
  
  levelStatus.innerHTML = `${statusText}${goalsText ? '<br>收集目標：' + goalsText : ''}`;
}

function loadLevels() {
  const raw = localStorage.getItem(LEVEL_STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= LEVEL_COUNT) return parsed;
    } catch {
      return null;
    }
  }
  return null;
}

function generateLevels() {
  const levels = [];
  for (let i = 1; i <= LEVEL_COUNT; i += 1) {
    const tier = i <= 30 ? 'easy' : i <= 70 ? 'normal' : 'hard';
    const config = difficultyConfig[tier];
    levels.push({
      level: i,
      difficulty: tier,
      moves: config.moves,
      target: config.target + i * 5
    });
  }
  localStorage.setItem(LEVEL_STORAGE_KEY, JSON.stringify(levels));
  return levels;
}

const levelData = loadLevels() || generateLevels();

function populateLevelSelect() {
  if (!levelSelect) return;
  levelSelect.innerHTML = levelData.map(data => `<option value="${data.level}">第 ${data.level} 關</option>`).join('');
}

function generateLevelGoals(level) {
  if (level < 5) return [];
  
  const goalCount = Math.min(3, Math.floor(level / 20) + 1);
  const goals = [];
  const usedFruits = new Set();
  
  for (let i = 0; i < goalCount; i += 1) {
    let fruit;
    do {
      fruit = FRUITS[Math.floor(Math.random() * FRUITS.length)];
    } while (usedFruits.has(fruit));
    usedFruits.add(fruit);
    
    goals.push({
      fruit,
      count: 10 + Math.floor(level / 5) * 2
    });
  }
  
  return goals;
}

function setupLevel(level) {
  const data = levelData.find(item => item.level === level) || levelData[0];
  const difficulty = difficultySelect?.value || data.difficulty;
  const config = difficultyConfig[difficulty];
  activeShape = SHAPES[(level - 1) % SHAPES.length];
  currentLevel = data.level;
  score = 0;
  moves = config.moves;
  target = config.target + data.level * 5;
  combo = 0;
  isAnimating = false;
  levelGoals = generateLevelGoals(level);
  collectedGoals = {};
  levelGoals.forEach(g => { collectedGoals[g.fruit] = 0; });
  powerUps = { shuffle: 3, hint: 3, bomb: 2 };
  board = createBoard(config);
  selectedIndex = null;
  updateStatus();
  updatePowerUpUI();
  renderBoard();
  localStorage.setItem(LAST_LEVEL_KEY, String(currentLevel));
}

function getMatches(tempBoard = board) {
  const matches = new Set();
  const matchInfo = [];
  
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    let run = 1;
    const runStart = [0];
    for (let col = 1; col <= BOARD_SIZE; col += 1) {
      const current = tempBoard[row * BOARD_SIZE + col]?.fruit;
      const prev = tempBoard[row * BOARD_SIZE + col - 1]?.fruit;
      if (current && current === prev) {
        run += 1;
      } else {
        if (run >= 3) {
          const indices = [];
          for (let k = 0; k < run; k += 1) {
            const idx = row * BOARD_SIZE + col - 1 - k;
            matches.add(idx);
            indices.push(idx);
          }
          matchInfo.push({ type: 'horizontal', indices, length: run });
        }
        run = 1;
      }
    }
  }

  for (let col = 0; col < BOARD_SIZE; col += 1) {
    let run = 1;
    for (let row = 1; row <= BOARD_SIZE; row += 1) {
      const current = tempBoard[row * BOARD_SIZE + col]?.fruit;
      const prev = tempBoard[(row - 1) * BOARD_SIZE + col]?.fruit;
      if (current && current === prev) {
        run += 1;
      } else {
        if (run >= 3) {
          const indices = [];
          for (let k = 0; k < run; k += 1) {
            const idx = (row - 1 - k) * BOARD_SIZE + col;
            matches.add(idx);
            indices.push(idx);
          }
          matchInfo.push({ type: 'vertical', indices, length: run });
        }
        run = 1;
      }
    }
  }
  
  return { indices: Array.from(matches), matchInfo };
}

function determineSpecialType(matchInfo, swapIndex) {
  for (const match of matchInfo) {
    if (match.length >= 5) {
      return SPECIAL_TYPES.COLOR_BOMB;
    }
    if (match.length === 4) {
      return match.type === 'horizontal' ? SPECIAL_TYPES.LINE_V : SPECIAL_TYPES.LINE_H;
    }
  }
  
  const hasHorizontal = matchInfo.some(m => m.type === 'horizontal' && m.length >= 3);
  const hasVertical = matchInfo.some(m => m.type === 'vertical' && m.length >= 3);
  if (hasHorizontal && hasVertical) {
    return SPECIAL_TYPES.BOMB;
  }
  
  return SPECIAL_TYPES.NONE;
}

function activateSpecial(index, config) {
  const cell = board[index];
  if (!cell || cell.special === SPECIAL_TYPES.NONE) return [];
  
  const affected = new Set();
  const row = Math.floor(index / BOARD_SIZE);
  const col = index % BOARD_SIZE;
  
  if (cell.special === SPECIAL_TYPES.BOMB) {
    for (let r = row - 1; r <= row + 1; r += 1) {
      for (let c = col - 1; c <= col + 1; c += 1) {
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
          affected.add(r * BOARD_SIZE + c);
        }
      }
    }
  } else if (cell.special === SPECIAL_TYPES.LINE_H) {
    for (let c = 0; c < BOARD_SIZE; c += 1) {
      affected.add(row * BOARD_SIZE + c);
    }
  } else if (cell.special === SPECIAL_TYPES.LINE_V) {
    for (let r = 0; r < BOARD_SIZE; r += 1) {
      affected.add(r * BOARD_SIZE + col);
    }
  } else if (cell.special === SPECIAL_TYPES.COLOR_BOMB) {
    const targetFruit = cell.fruit;
    board.forEach((c, i) => {
      if (c.fruit === targetFruit) affected.add(i);
    });
  }
  
  return Array.from(affected);
}

function collapseBoard(config) {
  for (let col = 0; col < BOARD_SIZE; col += 1) {
    const column = [];
    for (let row = BOARD_SIZE - 1; row >= 0; row -= 1) {
      const idx = row * BOARD_SIZE + col;
      if (board[idx].fruit) column.push(board[idx]);
    }
    for (let row = BOARD_SIZE - 1; row >= 0; row -= 1) {
      const idx = row * BOARD_SIZE + col;
      if (!getShapeValue(idx)) {
        board[idx] = { fruit: null, special: SPECIAL_TYPES.NONE, ice: 0 };
      } else {
        const existing = column[BOARD_SIZE - 1 - row];
        if (existing) {
          board[idx] = existing;
        } else {
          board[idx] = { 
            fruit: getRandomFruit(config.fruitCount), 
            special: SPECIAL_TYPES.NONE, 
            ice: 0 
          };
        }
      }
    }
  }
}

function resolveMatches(config, swapIndex = null) {
  let { indices: matches, matchInfo } = getMatches();
  
  while (matches.length > 0) {
    combo += 1;
    const comboMultiplier = 1 + (combo - 1) * 0.5;
    
    if (combo >= 2 && shouldShowComment()) {
      showCharComment({ 
        event: 'combo', 
        level: currentLevel, 
        score, 
        target, 
        moves, 
        combo 
      });
    }
    
    const specialToCreate = swapIndex !== null ? determineSpecialType(matchInfo, swapIndex) : SPECIAL_TYPES.NONE;
    let specialCreated = false;
    
    matches.forEach(idx => {
      const cell = board[idx];
      if (!cell) return;
      
      if (cell.ice > 0) {
        cell.ice -= 1;
        if (cell.ice === 0) {
          score += 20;
        }
        return;
      }
      
      if (cell.fruit && collectedGoals[cell.fruit] !== undefined) {
        collectedGoals[cell.fruit] += 1;
      }
      
      const specialAffected = activateSpecial(idx, config);
      specialAffected.forEach(sIdx => {
        if (board[sIdx] && board[sIdx].fruit) {
          if (collectedGoals[board[sIdx].fruit] !== undefined) {
            collectedGoals[board[sIdx].fruit] += 1;
          }
          board[sIdx] = { fruit: null, special: SPECIAL_TYPES.NONE, ice: 0 };
          score += 30;
        }
      });
      
      if (!specialCreated && specialToCreate !== SPECIAL_TYPES.NONE && matchInfo.some(m => m.indices.includes(idx))) {
        board[idx] = { fruit: cell.fruit, special: specialToCreate, ice: 0 };
        specialCreated = true;
      } else {
        board[idx] = { fruit: null, special: SPECIAL_TYPES.NONE, ice: 0 };
      }
    });
    
    const baseScore = matches.length * 30;
    score += Math.floor(baseScore * comboMultiplier);
    
    collapseBoard(config);
    const nextResult = getMatches();
    matches = nextResult.indices;
    matchInfo = nextResult.matchInfo;
  }
  
  if (score >= target) {
    const scoreMap = loadScoreMap();
    const prevBest = scoreMap[currentLevel]?.score || 0;
    if (score > prevBest) {
      scoreMap[currentLevel] = { score, target };
      saveScoreMap(scoreMap);
      buildWorlds();
    }
    
    if (currentLevel >= charProgress) {
      charProgress = Math.min(LEVEL_COUNT, currentLevel + 1);
      localStorage.setItem(CHAR_PROGRESS_KEY, String(charProgress));
      updateCharProgressUI();
    }
    
    showCharComment({ 
      event: 'pass', 
      level: currentLevel, 
      score, 
      target, 
      moves 
    });
  } else if (moves <= 0) {
    showCharComment({ 
      event: 'fail', 
      level: currentLevel, 
      score, 
      target, 
      moves: 0 
    });
  }
}

function areAdjacent(a, b) {
  const rowA = Math.floor(a / BOARD_SIZE);
  const colA = a % BOARD_SIZE;
  const rowB = Math.floor(b / BOARD_SIZE);
  const colB = b % BOARD_SIZE;
  const rowDiff = Math.abs(rowA - rowB);
  const colDiff = Math.abs(colA - colB);
  return rowDiff + colDiff === 1;
}

function handleTileClick(index) {
  if (isAnimating || moves <= 0) return;
  if (!board[index].fruit) return;
  
  if (selectedIndex === null) {
    selectedIndex = index;
    renderBoard();
    return;
  }

  if (selectedIndex === index) {
    selectedIndex = null;
    renderBoard();
    return;
  }

  if (!areAdjacent(selectedIndex, index)) {
    selectedIndex = index;
    renderBoard();
    return;
  }

  const temp = board[selectedIndex];
  board[selectedIndex] = board[index];
  board[index] = temp;

  const config = difficultyConfig[difficultySelect.value];
  const { indices } = getMatches();
  
  if (indices.length === 0) {
    board[index] = board[selectedIndex];
    board[selectedIndex] = temp;
    selectedIndex = null;
    renderBoard();
    return;
  }

  isAnimating = true;
  moves -= 1;
  combo = 0;
  resolveMatches(config, selectedIndex);
  selectedIndex = null;
  isAnimating = false;
  updateStatus();
  renderBoard();
  
  if (moves > 0 && score < target && Math.random() < 0.15) {
    showCharComment({ 
      event: 'progress', 
      level: currentLevel, 
      score, 
      target, 
      moves 
    });
  }
}

function startLevel(level) {
  if (levelSelect) levelSelect.value = String(level);
  toggleGameView(true);
  setupLevel(level);
  
  if (charCompanionEnabled) {
    showCharComment({ event: 'start', level });
  }
}

function usePowerUp(type) {
  if (powerUps[type] <= 0) return;
  
  if (type === 'shuffle') {
    const fruits = [];
    board.forEach((cell, idx) => {
      if (getShapeValue(idx) && cell.fruit) {
        fruits.push({ fruit: cell.fruit, special: cell.special });
      }
    });
    
    for (let i = fruits.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [fruits[i], fruits[j]] = [fruits[j], fruits[i]];
    }
    
    let fruitIdx = 0;
    board.forEach((cell, idx) => {
      if (getShapeValue(idx) && cell.fruit) {
        board[idx].fruit = fruits[fruitIdx].fruit;
        board[idx].special = fruits[fruitIdx].special;
        fruitIdx += 1;
      }
    });
    
    powerUps.shuffle -= 1;
    renderBoard();
  } else if (type === 'hint') {
    for (let i = 0; i < board.length; i += 1) {
      if (!getShapeValue(i) || !board[i].fruit) continue;
      
      const adjacent = [
        i - 1, i + 1, i - BOARD_SIZE, i + BOARD_SIZE
      ].filter(j => j >= 0 && j < board.length && getShapeValue(j) && areAdjacent(i, j));
      
      for (const adj of adjacent) {
        const temp = board[i];
        board[i] = board[adj];
        board[adj] = temp;
        
        const { indices } = getMatches();
        
        board[adj] = board[i];
        board[i] = temp;
        
        if (indices.length > 0) {
          const tiles = boardEl.querySelectorAll('.tile');
          tiles[i]?.classList.add('hint');
          tiles[adj]?.classList.add('hint');
          powerUps.hint -= 1;
          setTimeout(() => {
            tiles[i]?.classList.remove('hint');
            tiles[adj]?.classList.remove('hint');
          }, 1500);
          return;
        }
      }
    }
  } else if (type === 'bomb') {
    selectedIndex = null;
    const handleBombClick = (e) => {
      const tile = e.target.closest('.tile');
      if (!tile) return;
      const idx = Number(tile.dataset.index);
      if (!getShapeValue(idx) || !board[idx].fruit) return;
      
      board[idx] = { fruit: null, special: SPECIAL_TYPES.NONE, ice: 0 };
      score += 50;
      powerUps.bomb -= 1;
      boardEl.removeEventListener('click', handleBombClick);
      updateStatus();
      renderBoard();
    };
    
    boardEl.addEventListener('click', handleBombClick);
  }
}

generateBtn?.addEventListener('click', () => {
  const difficulty = genDifficultySelect?.value || 'normal';
  const config = difficultyConfig[difficulty] || difficultyConfig.normal;
  const count = Math.max(1, Math.min(30, Number(genCountInput?.value || 1)));
  const theme = genThemeSelect?.value || 'fruit';
  const themeMap = {
    fruit: { theme: '水果果盤', icon: '🍓' },
    veggie: { theme: '蔬菜樂園', icon: '🥦' },
    tropical: { theme: '熱帶海島', icon: '🍍' },
    dessert: { theme: '甜點工坊', icon: '🧁' }
  };
  const targetWorld = WORLDS.find(world => world.theme === themeMap[theme]?.theme);
  const startLevel = currentLevel;

  for (let i = 0; i < count; i += 1) {
    const levelNumber = Math.min(LEVEL_COUNT, startLevel + i);
    const existing = levelData.find(item => item.level === levelNumber);
    if (existing) {
      existing.difficulty = difficulty;
      existing.moves = config.moves;
      existing.target = config.target + levelNumber * 5;
    }
  }
  localStorage.setItem(LEVEL_STORAGE_KEY, JSON.stringify(levelData));

  if (targetWorld) {
    targetWorld.theme = themeMap[theme].theme;
    targetWorld.icon = themeMap[theme].icon;
  }

  score = 0;
  moves = config.moves;
  target = config.target + currentLevel * 5;
  activeShape = SHAPES[(currentLevel - 1) % SHAPES.length];
  board = createBoard(config);
  updateStatus();
  renderBoard();
  buildWorlds();
  toggleGameView(true);
});

restartBtn?.addEventListener('click', () => {
  setupLevel(currentLevel);
});

difficultySelect?.addEventListener('change', () => {
  setupLevel(currentLevel);
});

levelSelect?.addEventListener('change', () => {
  const level = Number(levelSelect.value || 1);
  setupLevel(level);
});

enterLatestBtn?.addEventListener('click', () => {
  const last = Number(localStorage.getItem(LAST_LEVEL_KEY) || '1');
  startLevel(last);
});

function loadSxSettings() {
  if (typeof SxSettings === 'undefined') return null;
  const settings = SxSettings.getSettingsSnapshot();
  console.log('[match-3] Loaded settings:', {
    characters: settings.characters.length,
    users: settings.users.length
  });
  return settings;
}

function updatePowerUpUI() {
  const shuffleCount = document.getElementById('shuffle-count');
  const hintCount = document.getElementById('hint-count');
  const bombCount = document.getElementById('bomb-count');
  const shuffleBtn = document.getElementById('shuffle-btn');
  const hintBtn = document.getElementById('hint-btn');
  const bombBtn = document.getElementById('bomb-btn');
  
  if (shuffleCount) shuffleCount.textContent = powerUps.shuffle;
  if (hintCount) hintCount.textContent = powerUps.hint;
  if (bombCount) bombCount.textContent = powerUps.bomb;
  
  if (shuffleBtn) shuffleBtn.disabled = powerUps.shuffle <= 0;
  if (hintBtn) hintBtn.disabled = powerUps.hint <= 0;
  if (bombBtn) bombBtn.disabled = powerUps.bomb <= 0;
}

const getApiConfig = () => {
  const raw = localStorage.getItem('api_configs');
  if (!raw) return null;
  try {
    const configs = JSON.parse(raw);
    const activeIndexStr = localStorage.getItem('sx_active_api');
    const activeIndex = activeIndexStr !== null ? parseInt(activeIndexStr, 10) : 0;
    const validIndex = (!isNaN(activeIndex) && activeIndex >= 0 && activeIndex < configs.length) ? activeIndex : 0;
    return configs[validIndex] || configs[0] || null;
  } catch {
    return null;
  }
};

const getCharData = () => {
  const charName = localStorage.getItem('sx_char_name');
  if (!charName) return null;
  const raw = localStorage.getItem('sx_characters');
  if (!raw) return { name: charName, personality: '', background: '' };
  try {
    const list = JSON.parse(raw);
    const found = list.find(c => c.name === charName);
    return found || { name: charName, personality: '', background: '' };
  } catch {
    return { name: charName, personality: '', background: '' };
  }
};

const generateCharComment = async (context) => {
  const config = getApiConfig();
  if (!config || !config.url) {
    return generateFallbackComment(context);
  }

  const char = getCharData();
  const charName = char?.name || '角色';
  const charPersonality = char?.personality || '';
  const charBackground = char?.background || '';

  const lang = localStorage.getItem('sxiphone_lang') || 'zh-TW';

  const systemPrompt = `你是一個正在陪玩家玩消消樂遊戲的角色，請根據角色性格生成一句簡短的評論或鼓勵。
請使用 ${window.getAIReadableLangName?.(lang) || '繁體中文'} 撰寫。
輸出格式為 JSON: {"comment": "一句話"}`;

  let contextText = `# 角色設定\n名稱: ${charName}\n`;
  if (charPersonality) contextText += `性格: ${charPersonality}\n`;
  if (charBackground) contextText += `背景: ${charBackground}\n`;
  contextText += `\n# 遊戲狀況\n`;
  contextText += `關卡: ${context.level || 1}\n`;
  contextText += `分數: ${context.score || 0}\n`;
  contextText += `目標: ${context.target || 800}\n`;
  contextText += `剩餘步數: ${context.moves || 0}\n`;
  if (context.combo) contextText += `連擊數: ${context.combo}\n`;
  contextText += `事件: ${context.event || '進行中'}\n`;

  const prompt = `${contextText}

請生成一句角色在看到這個遊戲狀況時會說的話，要求：
1. 符合角色性格
2. 簡短自然（10-30字）
3. 可以是鼓勵、評論、驚嘆或吐槽

輸出 JSON 格式。`;

  try {
    const endpoint = config.url.endsWith('/chat/completions')
      ? config.url
      : `${config.url.replace(/\/$/, '')}/chat/completions`;

    const headers = { 'Content-Type': 'application/json' };
    if (config.key) {
      headers.Authorization = `Bearer ${config.key}`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.model || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.9
      })
    });

    if (!response.ok) return generateFallbackComment(context);

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    let parsed = null;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }

    return parsed?.comment || generateFallbackComment(context);
  } catch (err) {
    console.warn('[match-3] AI comment generation failed:', err);
    return generateFallbackComment(context);
  }
};

const generateFallbackComment = (context) => {
  const char = getCharData();
  const charName = char?.name || '角色';
  const personality = (char?.personality || '').toLowerCase();
  
  const comments = {
    combo: [
      '哇！連擊！繼續加油！',
      '太厲害了！連消！',
      '這個連擊不錯喔！',
      '繼續保持！'
    ],
    pass: [
      '恭喜過關！你真厲害！',
      '太棒了！這關過了！',
      '我就知道你可以的！',
      '下一關也沒問題的！'
    ],
    fail: [
      '沒關係，再試一次！',
      '別灰心，你可以的！',
      '這關有點難，加油！',
      '我相信你下次一定行！'
    ],
    progress: [
      '這步不錯！',
      '繼續加油！',
      '快達成目標了！',
      '還有機會！'
    ],
    start: [
      '開始吧！我看好你！',
      '這關應該難不倒你！',
      '一起加油！',
      '準備好了嗎？'
    ]
  };

  const spicy = ['佔有', '控制', '病嬌', '嫉妒', '冷淡', '腹黑', '強勢', '霸道'];
  const gentle = ['溫柔', '體貼', '善良', '暖', '可愛', '樂觀'];
  const playful = ['調皮', '愛鬧', '搞笑', '活潑', '俏皮'];

  let pool = comments[context.event] || comments.progress;

  if (spicy.some(key => personality.includes(key))) {
    pool = {
      combo: ['哼，還不錯嘛。', '這點程度而已？', '別得意太早。', '繼續。'],
      pass: ['勉強過關了。', '哼，我就說你可以。', '別驕傲，下一關更難。', '還算可以。'],
      fail: ['這樣就不行了？', '再試一次，別讓我失望。', '你應該能做得更好。', '別放棄。'],
      progress: ['繼續。', '還差得遠。', '專心點。', '別分心。'],
      start: ['開始吧。', '別拖拖拉拉。', '準備好了嗎？', '我等著看你的表現。']
    }[context.event] || comments.progress;
  } else if (gentle.some(key => personality.includes(key))) {
    pool = {
      combo: ['哇！好厲害！', '連擊！太棒了！', '你真棒！', '繼續加油喔！'],
      pass: ['恭喜過關！辛苦了！', '太好了！你做到了！', '我就知道你行的！', '休息一下再繼續？'],
      fail: ['沒關係，慢慢來。', '別難過，再試一次？', '這關有點難呢。', '我相信你的！'],
      progress: ['加油！你快到了！', '不錯喔！繼續！', '再努力一下！', '你可以的！'],
      start: ['加油喔！', '我會陪著你的！', '一起努力吧！', '準備好了嗎？']
    }[context.event] || comments.progress;
  } else if (playful.some(key => personality.includes(key))) {
    pool = {
      combo: ['嘿嘿，連擊！', '哇喔！好厲害！', '這個不錯！', '再來再來！'],
      pass: ['過關啦！耶！', '太棒了！慶祝一下！', '下一關！下一關！', '你超強的！'],
      fail: ['哎呀，差一點！', '沒事沒事，再來！', '這次運氣不好啦！', '下次一定行！'],
      progress: ['快快快！', '加油加油！', '衝啊！', '你可以的！'],
      start: ['開始開始！', '好期待喔！', '來玩吧！', '衝衝衝！']
    }[context.event] || comments.progress;
  }

  return pool[Math.floor(Math.random() * pool.length)];
};

const shouldShowComment = () => {
  if (!charCompanionEnabled) return false;
  
  const now = Date.now();
  const cooldown = {
    low: 15000,
    normal: 8000,
    high: 4000
  }[charCommentFrequency] || 8000;
  
  return now - lastCommentTime > cooldown;
};

const showCharComment = async (context) => {
  if (!shouldShowComment()) return;
  
  const commentEl = document.getElementById('char-comment');
  if (!commentEl) return;
  
  lastCommentTime = Date.now();
  const comment = await generateCharComment(context);
  commentEl.textContent = comment;
  commentEl.style.animation = 'none';
  void commentEl.offsetWidth;
  commentEl.style.animation = 'fadeInUp 0.3s ease';
};

const updateCharProgressUI = () => {
  const progressFill = document.getElementById('char-progress-fill');
  const currentLevelEl = document.getElementById('char-current-level');
  const charLevelNum = document.getElementById('char-level-num');
  
  const progressPercent = Math.min(100, (charProgress / LEVEL_COUNT) * 100);
  
  if (progressFill) progressFill.style.width = `${progressPercent}%`;
  if (currentLevelEl) currentLevelEl.textContent = charProgress;
  if (charLevelNum) charLevelNum.textContent = charProgress;
};

const initCharCompanion = () => {
  const panel = document.getElementById('char-companion-panel');
  const settingsPanel = document.getElementById('char-settings-panel');
  const toggleBtn = document.getElementById('char-toggle-btn');
  const closeSettingsBtn = document.getElementById('close-char-settings');
  const companionToggle = document.getElementById('char-companion-toggle');
  const frequencySelect = document.getElementById('comment-frequency');
  const charSelect = document.getElementById('char-select');
  
  charCompanionEnabled = localStorage.getItem(CHAR_COMPANION_KEY) !== 'false';
  charCommentFrequency = localStorage.getItem(COMMENT_FREQUENCY_KEY) || 'normal';
  charProgress = parseInt(localStorage.getItem(CHAR_PROGRESS_KEY)) || 1;
  
  if (companionToggle) companionToggle.checked = charCompanionEnabled;
  if (frequencySelect) frequencySelect.value = charCommentFrequency;
  
  // 載入角色列表
  const loadCharList = () => {
    const raw = localStorage.getItem('sx_characters') || '[]';
    try {
      const list = JSON.parse(raw);
      if (!Array.isArray(list) || list.length === 0) {
        if (charSelect) charSelect.innerHTML = '<option value="">尚未建立角色</option>';
        panel?.classList.add('hidden');
        return;
      }
      
      const currentCharName = localStorage.getItem('sx_char_name') || '';
      if (charSelect) {
        charSelect.innerHTML = list.map((char, index) => 
          `<option value="${index}" ${char.name === currentCharName ? 'selected' : ''}>${char.name}</option>`
        ).join('');
      }
      
      // 更新當前角色資料
      updateCharDisplay();
    } catch (e) {
      if (charSelect) charSelect.innerHTML = '<option value="">載入失敗</option>';
    }
  };
  
  // 更新角色顯示
  const updateCharDisplay = () => {
    const char = getCharData();
    charData = char;
    
    const charNameEl = document.getElementById('char-name');
    const charAvatarEl = document.getElementById('char-avatar');
    const charCommentEl = document.getElementById('char-comment');
    
    if (char?.name) {
      if (charNameEl) charNameEl.textContent = char.name;
      if (charAvatarEl && char.avatar) {
        charAvatarEl.style.backgroundImage = `url('${char.avatar}')`;
        charAvatarEl.style.backgroundColor = 'transparent';
      } else if (charAvatarEl) {
        charAvatarEl.style.backgroundImage = '';
        charAvatarEl.style.backgroundColor = 'var(--muted)';
      }
    } else {
      if (charNameEl) charNameEl.textContent = '';
      if (charAvatarEl) {
        charAvatarEl.style.backgroundImage = '';
        charAvatarEl.style.backgroundColor = 'var(--muted)';
      }
    }
    
    // 清空預設評論，等待 AI 生成
    if (charCommentEl) charCommentEl.textContent = '';
    
    updateCharProgressUI();
  };
  
  // 角色選擇變更
  charSelect?.addEventListener('change', () => {
    const index = parseInt(charSelect.value);
    const raw = localStorage.getItem('sx_characters') || '[]';
    try {
      const list = JSON.parse(raw);
      if (list[index]) {
        localStorage.setItem('sx_char_name', list[index].name);
        updateCharDisplay();
        // 生成新的評論
        if (charCompanionEnabled) {
          showCharComment({ event: 'start', level: currentLevel });
        }
      }
    } catch (e) {
      console.error('[match-3] 切換角色失敗:', e);
    }
  });
  
  loadCharList();
  
  if (!charCompanionEnabled) {
    panel?.classList.add('hidden');
  }
  
  // 載入上次保存的位置
  const savedPosition = localStorage.getItem(CHAR_PANEL_POSITION_KEY);
  if (savedPosition && panel) {
    try {
      const pos = JSON.parse(savedPosition);
      if (pos.left !== undefined && pos.top !== undefined) {
        panel.style.left = pos.left;
        panel.style.top = pos.top;
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
      }
    } catch (e) {
      console.warn('[match-3] 無法解析保存的位置:', e);
    }
  }
  
  // 拖曳功能
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let panelStartX = 0;
  let panelStartY = 0;
  
  const handleDragStart = (e) => {
    // 如果點擊的是設定按鈕，不啟動拖曳
    if (e.target.closest('.char-toggle-btn')) return;
    
    isDragging = true;
    panel.classList.add('dragging');
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    dragStartX = clientX;
    dragStartY = clientY;
    
    const rect = panel.getBoundingClientRect();
    panelStartX = rect.left;
    panelStartY = rect.top;
    
    // 切換到絕對定位
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
    panel.style.left = `${panelStartX}px`;
    panel.style.top = `${panelStartY}px`;
    
    e.preventDefault();
  };
  
  const handleDragMove = (e) => {
    if (!isDragging) return;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - dragStartX;
    const deltaY = clientY - dragStartY;
    
    let newX = panelStartX + deltaX;
    let newY = panelStartY + deltaY;
    
    // 限制在視窗範圍內
    const panelRect = panel.getBoundingClientRect();
    const maxX = window.innerWidth - panelRect.width;
    const maxY = window.innerHeight - panelRect.height;
    
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));
    
    panel.style.left = `${newX}px`;
    panel.style.top = `${newY}px`;
    
    e.preventDefault();
  };
  
  const handleDragEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    panel.classList.remove('dragging');
    
    // 保存位置
    localStorage.setItem(CHAR_PANEL_POSITION_KEY, JSON.stringify({
      left: panel.style.left,
      top: panel.style.top
    }));
  };
  
  // 綁定拖曳事件
  panel?.addEventListener('mousedown', handleDragStart);
  panel?.addEventListener('touchstart', handleDragStart, { passive: false });
  
  document.addEventListener('mousemove', handleDragMove);
  document.addEventListener('touchmove', handleDragMove, { passive: false });
  
  document.addEventListener('mouseup', handleDragEnd);
  document.addEventListener('touchend', handleDragEnd);
  
  toggleBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    settingsPanel?.classList.toggle('hidden');
  });
  
  closeSettingsBtn?.addEventListener('click', () => {
    settingsPanel?.classList.add('hidden');
  });
  
  companionToggle?.addEventListener('change', () => {
    charCompanionEnabled = companionToggle.checked;
    localStorage.setItem(CHAR_COMPANION_KEY, charCompanionEnabled ? 'true' : 'false');
    panel?.classList.toggle('hidden', !charCompanionEnabled);
  });
  
  frequencySelect?.addEventListener('change', () => {
    charCommentFrequency = frequencySelect.value;
    localStorage.setItem(COMMENT_FREQUENCY_KEY, charCommentFrequency);
  });
  
  if (charCompanionEnabled && charData?.name) {
    showCharComment({ event: 'start', level: currentLevel });
  }
};

document.getElementById('shuffle-btn')?.addEventListener('click', () => usePowerUp('shuffle'));
document.getElementById('hint-btn')?.addEventListener('click', () => usePowerUp('hint'));
document.getElementById('bomb-btn')?.addEventListener('click', () => usePowerUp('bomb'));

loadSxSettings();
populateLevelSelect();
buildWorlds();
toggleGameView(false);
updatePowerUpUI();
initCharCompanion();
