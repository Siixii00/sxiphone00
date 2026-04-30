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

const FRUITS = ['??', '??', '??', '??', '??', '??'];
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
  { id: 1, title: 'ä¸–ç? 1', theme: 'æ°´æ??œç›¤', icon: '??', levels: 1 },
  { id: 2, title: 'ä¸–ç? 2', theme: '?¬è?æ¨‚å?', icon: '?¥¦', levels: 1 },
  { id: 3, title: 'ä¸–ç? 3', theme: '?±å¸¶æµ·å³¶', icon: '??', levels: 1 },
  { id: 4, title: 'ä¸–ç? 4', theme: '?œé?å·¥å?', icon: '??', levels: 1 }
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
      if (cell.special === SPECIAL_TYPES.BOMB) content = '?’£';
      else if (cell.special === SPECIAL_TYPES.LINE_H) content = '?¡ï?';
      else if (cell.special === SPECIAL_TYPES.LINE_V) content = 'â¬‡ï?';
      else if (cell.special === SPECIAL_TYPES.COLOR_BOMB) content = '??';
      
      tile.textContent = content;
      
      if (cell.ice > 0) {
        tile.classList.add('ice');
        tile.innerHTML = `<span class="ice-overlay">??</span>${content}`;
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
      const starText = '??.repeat(stars) + '??.repeat(3 - stars);
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
            <div class="world-theme">ä¸»é?ï¼?{world.theme}</div>
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
    statusText = '?? ?”æ??®æ?ï¼?;
  } else if (moves <= 0) {
    statusText = '?˜¢ æ­¥æ•¸?¨ç›¡ï¼Œå?è©¦ä?æ¬¡ï?';
  }
  
  const goalsText = levelGoals.map(g => {
    const collected = collectedGoals[g.fruit] || 0;
    return `${g.fruit}${collected}/${g.count}`;
  }).join(' ');
  
  levelStatus.innerHTML = `${statusText}${goalsText ? '<br>?¶é??®æ?ï¼? + goalsText : ''}`;
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
  levelSelect.innerHTML = levelData.map(data => `<option value="${data.level}">ç¬?${data.level} ??/option>`).join('');
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
    fruit: { theme: 'æ°´æ??œç›¤', icon: '??' },
    veggie: { theme: '?¬è?æ¨‚å?', icon: '?¥¦' },
    tropical: { theme: '?±å¸¶æµ·å³¶', icon: '??' },
    dessert: { theme: '?œé?å·¥å?', icon: '??' }
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

  const apiType = config.type || 'openai';
  const char = getCharData();
  const charName = char?.name || 'è§’è‰²';
  const charPersonality = char?.personality || '';
  const charBackground = char?.background || '';

  const lang = localStorage.getItem('sxiphone_lang') || 'zh-TW';

  const systemPrompt = `ä½ æ˜¯ä¸€?‹æ­£?¨é™ª?©å®¶?©æ?æ¶ˆæ??Šæˆ²?„è??²ï?è«‹æ ¹?šè??²æ€§æ ¼?Ÿæ?ä¸€?¥ç°¡?­ç?è©•è??–é??µã€?è«‹ä½¿??${window.getAIReadableLangName?.(lang) || 'ç¹é?ä¸­æ?'} ?°å¯«??è¼¸å‡º?¼å???JSON: {"comment": "ä¸€?¥è©±"}`;

  let contextText = `# è§’è‰²è¨­å?\n?ç¨±: ${charName}\n`;
  if (charPersonality) contextText += `?§æ ¼: ${charPersonality}\n`;
  if (charBackground) contextText += `?Œæ™¯: ${charBackground}\n`;
  contextText += `\n# ?Šæˆ²?€æ³\n`;
  contextText += `?œå¡: ${context.level || 1}\n`;
  contextText += `?†æ•¸: ${context.score || 0}\n`;
  contextText += `?®æ?: ${context.target || 800}\n`;
  contextText += `?©é?æ­¥æ•¸: ${context.moves || 0}\n`;
  if (context.combo) contextText += `????? ${context.combo}\n`;
  contextText += `äº‹ä»¶: ${context.event || '?²è?ä¸?}\n`;

  const prompt = `${contextText}

è«‹ç??ä??¥è??²åœ¨?‹åˆ°?™å€‹é??²ç?æ³æ??ƒèªª?„è©±ï¼Œè?æ±‚ï?
1. ç¬¦å?è§’è‰²?§æ ¼
2. ç°¡çŸ­?ªç„¶ï¼?0-30å­—ï?
3. ?¯ä»¥?¯é??µã€è?è«–ã€é??†æ??æ§½

è¼¸å‡º JSON ?¼å??‚`;

  try {
    let content = '';
    
    // Gemini ?Ÿç? API ?¼å?
    if (apiType === 'gemini') {
      const model = config.model || 'gemini-1.5-flash';
      const targetUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + config.key;
      
      const geminiPayload = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9 },
        systemInstruction: { parts: [{ text: systemPrompt }] }
      };
      
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiPayload)
      });
      
      if (!response.ok) return generateFallbackComment(context);
      const data = await response.json();
      if (data.error) return generateFallbackComment(context);
      content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else {
      // OpenAI ?¸å®¹?¼å??–è‡ªè¨‚ç«¯é»?      let endpoint;
      if (apiType === 'custom') {
        endpoint = config.url;
      } else {
        endpoint = config.url.endsWith('/chat/completions')
          ? config.url
          : `${config.url.replace(/\/$/, '')}/chat/completions`;
      }

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
      content = data.choices?.[0]?.message?.content || '';
    }

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
  const charName = char?.name || 'è§’è‰²';
  const personality = (char?.personality || '').toLowerCase();
  
  const comments = {
    combo: [
      '?‡ï????ï¼ç¹¼çºŒå?æ²¹ï?',
      'å¤ªåŽ²å®³ä?ï¼é€??ï¼?,
      '?™å€‹é€??ä¸éŒ¯?”ï?',
      'ç¹¼ç?ä¿æ?ï¼?
    ],
    pass: [
      '?­å??Žé?ï¼ä??ŸåŽ²å®³ï?',
      'å¤ªæ?äº†ï??™é??Žä?ï¼?,
      '?‘å°±?¥é?ä½ å¯ä»¥ç?ï¼?,
      'ä¸‹ä??œä?æ²’å?é¡Œç?ï¼?
    ],
    fail: [
      'æ²’é?ä¿‚ï??è©¦ä¸€æ¬¡ï?',
      '?¥ç°å¿ƒï?ä½ å¯ä»¥ç?ï¼?,
      '?™é??‰é????? æ²¹ï¼?,
      '?‘ç›¸ä¿¡ä?ä¸‹æ¬¡ä¸€å®šè?ï¼?
    ],
    progress: [
      '?™æ­¥ä¸éŒ¯ï¼?,
      'ç¹¼ç?? æ²¹ï¼?,
      'å¿«é??ç›®æ¨™ä?ï¼?,
      '?„æ?æ©Ÿæ?ï¼?
    ],
    start: [
      '?‹å??§ï??‘ç?å¥½ä?ï¼?,
      '?™é??‰è©²????’ä?ï¼?,
      'ä¸€èµ·å?æ²¹ï?',
      'æº–å?å¥½ä??Žï?'
    ]
  };

  const spicy = ['ä½”æ?', '?§åˆ¶', '?…å?', 'å«‰å?', '?·æ·¡', '?¹é?', 'å¼·å‹¢', '?¸é?'];
  const gentle = ['æº«æ?', 'é«”è²¼', '?„è‰¯', '??, '?¯æ?', 'æ¨‚è?'];
  const playful = ['èª¿çš®', '?›é¬§', '?žç?', 'æ´»æ?', 'ä¿çš®'];

  let pool = comments[context.event] || comments.progress;

  if (spicy.some(key => personality.includes(key))) {
    pool = {
      combo: ['?¼ï??„ä??¯å???, '?™é?ç¨‹åº¦?Œå·²ï¼?, '?¥å??å¤ª?©ã€?, 'ç¹¼ç???],
      pass: ['?‰å¼·?Žé?äº†ã€?, '?¼ï??‘å°±èªªä??¯ä»¥??, '?¥é??²ï?ä¸‹ä??œæ›´??€?, '?„ç??¯ä»¥??],
      fail: ['?™æ¨£å°±ä?è¡Œä?ï¼?, '?è©¦ä¸€æ¬¡ï??¥è??‘å¤±?›ã€?, 'ä½ æ?è©²èƒ½?šå??´å¥½??, '?¥æ”¾æ£„ã€?],
      progress: ['ç¹¼ç???, '?„å·®å¾—é???, 'å°ˆå?é»žã€?, '?¥å?å¿ƒã€?],
      start: ['?‹å??§ã€?, '?¥æ??–æ??‰ã€?, 'æº–å?å¥½ä??Žï?', '?‘ç??—ç?ä½ ç?è¡¨ç¾??]
    }[context.event] || comments.progress;
  } else if (gentle.some(key => personality.includes(key))) {
    pool = {
      combo: ['?‡ï?å¥½åŽ²å®³ï?', '???ï¼å¤ªæ£’ä?ï¼?, 'ä½ ç?æ£’ï?', 'ç¹¼ç?? æ²¹?”ï?'],
      pass: ['?­å??Žé?ï¼è??¦ä?ï¼?, 'å¤ªå¥½äº†ï?ä½ å??°ä?ï¼?, '?‘å°±?¥é?ä½ è??„ï?', 'ä¼‘æ¯ä¸€ä¸‹å?ç¹¼ç?ï¼?],
      fail: ['æ²’é?ä¿‚ï??¢æ…¢ä¾†ã€?, '?¥é›£?Žï??è©¦ä¸€æ¬¡ï?', '?™é??‰é???‘¢??, '?‘ç›¸ä¿¡ä??„ï?'],
      progress: ['? æ²¹ï¼ä?å¿«åˆ°äº†ï?', 'ä¸éŒ¯?”ï?ç¹¼ç?ï¼?, '?åŠª?›ä?ä¸‹ï?', 'ä½ å¯ä»¥ç?ï¼?],
      start: ['? æ²¹?”ï?', '?‘æ??ªè?ä½ ç?ï¼?, 'ä¸€èµ·åŠª?›å§ï¼?, 'æº–å?å¥½ä??Žï?']
    }[context.event] || comments.progress;
  } else if (playful.some(key => personality.includes(key))) {
    pool = {
      combo: ['?¿å˜¿ï¼Œé€??ï¼?, '?‡å?ï¼å¥½?²å®³ï¼?, '?™å€‹ä??¯ï?', '?ä??ä?ï¼?],
      pass: ['?Žé??¦ï??¶ï?', 'å¤ªæ?äº†ï??¶ç?ä¸€ä¸‹ï?', 'ä¸‹ä??œï?ä¸‹ä??œï?', 'ä½ è?å¼·ç?ï¼?],
      fail: ['?Žå?ï¼Œå·®ä¸€é»žï?', 'æ²’ä?æ²’ä?ï¼Œå?ä¾†ï?', '?™æ¬¡?‹æ°£ä¸å¥½?¦ï?', 'ä¸‹æ¬¡ä¸€å®šè?ï¼?],
      progress: ['å¿«å¿«å¿«ï?', '? æ²¹? æ²¹ï¼?, 'è¡å?ï¼?, 'ä½ å¯ä»¥ç?ï¼?],
      start: ['?‹å??‹å?ï¼?, 'å¥½æ?å¾…å?ï¼?, 'ä¾†çŽ©?§ï?', 'è¡è?è¡ï?']
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
  
  // è¼‰å…¥è§’è‰²?—è¡¨
  const loadCharList = () => {
    const raw = localStorage.getItem('sx_characters') || '[]';
    try {
      const list = JSON.parse(raw);
      if (!Array.isArray(list) || list.length === 0) {
        if (charSelect) charSelect.innerHTML = '<option value="">å°šæœªå»ºç?è§’è‰²</option>';
        panel?.classList.add('hidden');
        return;
      }
      
      const currentCharName = localStorage.getItem('sx_char_name') || '';
      if (charSelect) {
        charSelect.innerHTML = list.map((char, index) => 
          `<option value="${index}" ${char.name === currentCharName ? 'selected' : ''}>${char.name}</option>`
        ).join('');
      }
      
      // ?´æ–°?¶å?è§’è‰²è³‡æ?
      updateCharDisplay();
    } catch (e) {
      if (charSelect) charSelect.innerHTML = '<option value="">è¼‰å…¥å¤±æ?</option>';
    }
  };
  
  // ?´æ–°è§’è‰²é¡¯ç¤º
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
    
    // æ¸…ç©º?è¨­è©•è?ï¼Œç?å¾?AI ?Ÿæ?
    if (charCommentEl) charCommentEl.textContent = '';
    
    updateCharProgressUI();
  };
  
  // è§’è‰²?¸æ?è®Šæ›´
  charSelect?.addEventListener('change', () => {
    const index = parseInt(charSelect.value);
    const raw = localStorage.getItem('sx_characters') || '[]';
    try {
      const list = JSON.parse(raw);
      if (list[index]) {
        localStorage.setItem('sx_char_name', list[index].name);
        updateCharDisplay();
        // ?Ÿæ??°ç?è©•è?
        if (charCompanionEnabled) {
          showCharComment({ event: 'start', level: currentLevel });
        }
      }
    } catch (e) {
      console.error('[match-3] ?‡æ?è§’è‰²å¤±æ?:', e);
    }
  });
  
  loadCharList();
  
  if (!charCompanionEnabled) {
    panel?.classList.add('hidden');
  }
  
  // è¼‰å…¥ä¸Šæ¬¡ä¿å??„ä?ç½?  const savedPosition = localStorage.getItem(CHAR_PANEL_POSITION_KEY);
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
      console.warn('[match-3] ?¡æ?è§??ä¿å??„ä?ç½?', e);
    }
  }
  
  // ?–æ›³?Ÿèƒ½
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let panelStartX = 0;
  let panelStartY = 0;
  
  const handleDragStart = (e) => {
    // å¦‚æ?é»žæ??„æ˜¯è¨­å??‰é?ï¼Œä??Ÿå??–æ›³
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
    
    // ?‡æ??°ç?å°å?ä½?    panel.style.right = 'auto';
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
    
    // ?åˆ¶?¨è?çª—ç??å…§
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
    
    // ä¿å?ä½ç½®
    localStorage.setItem(CHAR_PANEL_POSITION_KEY, JSON.stringify({
      left: panel.style.left,
      top: panel.style.top
    }));
  };
  
  // ç¶å??–æ›³äº‹ä»¶
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
