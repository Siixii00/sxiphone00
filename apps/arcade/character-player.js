class CharacterPlayer {
  constructor(character, gameType) {
    this.character = character;
    this.gameType = gameType;
    this.skill = this.calculateSkillFromPersonality();
    this.isPlaying = false;
    this.actionInterval = null;
  }
  
  calculateSkillFromPersonality() {
    const personality = (this.character?.personality || '').toLowerCase();
    
    if (personality.includes('認真') || personality.includes('完美主義') || personality.includes('聰明')) {
      return { accuracy: 0.85, reaction: 0.8, style: 'careful' };
    } else if (personality.includes('活潑') || personality.includes('衝動') || personality.includes('熱血')) {
      return { accuracy: 0.6, reaction: 0.9, style: 'aggressive' };
    } else if (personality.includes('冷靜') || personality.includes('沉著') || personality.includes('理智')) {
      return { accuracy: 0.75, reaction: 0.7, style: 'balanced' };
    } else if (personality.includes('笨拙') || personality.includes('迷糊') || personality.includes('天然')) {
      return { accuracy: 0.4, reaction: 0.5, style: 'clumsy' };
    } else if (personality.includes('傲嬌')) {
      return { accuracy: 0.7, reaction: 0.75, style: 'tsundere' };
    }
    
    return { accuracy: 0.65, reaction: 0.65, style: 'balanced' };
  }
  
  startPlaying(gameState, onAction) {
    this.isPlaying = true;
    
    switch (this.gameType) {
      case 'snake':
        this.playSnake(gameState, onAction);
        break;
      case 'slot':
        this.playSlot(gameState, onAction);
        break;
      case 'tetris':
        this.playTetris(gameState, onAction);
        break;
      case 'whackamole':
        this.playWhackAMole(gameState, onAction);
        break;
      case 'memory':
        this.playMemory(gameState, onAction);
        break;
      default:
        this.playGeneric(gameState, onAction);
    }
  }
  
  stopPlaying() {
    this.isPlaying = false;
    if (this.actionInterval) {
      clearInterval(this.actionInterval);
      this.actionInterval = null;
    }
  }
  
  playSnake(gameState, onAction) {
    const actionDelay = Math.max(100, 300 - this.skill.reaction * 200);
    
    this.actionInterval = setInterval(() => {
      if (!this.isPlaying) return;
      
      const { snake, food, direction } = gameState;
      if (!snake || snake.length === 0 || !food) return;
      
      const head = snake[0];
      const dx = food.x - head.x;
      const dy = food.y - head.y;
      
      let bestDirection = direction;
      
      if (Math.random() < this.skill.accuracy) {
        if (Math.abs(dx) > Math.abs(dy)) {
          bestDirection = dx > 0 ? 'right' : 'left';
        } else {
          bestDirection = dy > 0 ? 'down' : 'up';
        }
      } else {
        const directions = ['up', 'down', 'left', 'right'];
        bestDirection = directions[Math.floor(Math.random() * directions.length)];
      }
      
      const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
      if (opposites[bestDirection] !== direction) {
        onAction({ type: 'direction', direction: bestDirection });
      }
    }, actionDelay);
  }
  
  playSlot(gameState, onAction) {
    const spinDelay = 2000 + Math.random() * 3000;
    
    setTimeout(() => {
      if (!this.isPlaying) return;
      onAction({ type: 'spin' });
    }, spinDelay);
  }
  
  playTetris(gameState, onAction) {
    const actionDelay = Math.max(200, 500 - this.skill.reaction * 300);
    
    this.actionInterval = setInterval(() => {
      if (!this.isPlaying) return;
      
      const { currentPiece, board } = gameState;
      if (!currentPiece) return;
      
      let action = 'down';
      
      if (Math.random() < this.skill.accuracy) {
        const actions = ['left', 'right', 'rotate', 'down'];
        action = actions[Math.floor(Math.random() * actions.length)];
        
        if (this.skill.style === 'aggressive' && Math.random() < 0.3) {
          action = 'drop';
        }
      } else {
        action = 'down';
      }
      
      onAction({ type: action });
    }, actionDelay);
  }
  
  playWhackAMole(gameState, onAction) {
    const checkDelay = Math.max(100, 300 - this.skill.reaction * 200);
    
    this.actionInterval = setInterval(() => {
      if (!this.isPlaying) return;
      
      const { activeHoles } = gameState;
      if (!activeHoles || activeHoles.length === 0) return;
      
      if (Math.random() < this.skill.accuracy) {
        const targetHole = activeHoles[Math.floor(Math.random() * activeHoles.length)];
        onAction({ type: 'whack', hole: targetHole });
      }
    }, checkDelay);
  }
  
  playMemory(gameState, onAction) {
    const { flippedCards, matchedPairs } = gameState;
    
    if (flippedCards && flippedCards.length < 2) {
      const availableCards = gameState.availableCards || [];
      if (availableCards.length > 0) {
        const cardIndex = availableCards[Math.floor(Math.random() * availableCards.length)];
        onAction({ type: 'flip', card: cardIndex });
      }
    }
  }
  
  playGeneric(gameState, onAction) {
    this.actionInterval = setInterval(() => {
      if (!this.isPlaying) return;
      onAction({ type: 'tick' });
    }, 1000);
  }
}

class DualModeController {
  constructor(character, dialogue) {
    this.character = character;
    this.dialogue = dialogue;
    this.characterPlayer = null;
    this.mode = 'single';
    this.currentTurn = 'player';
    this.turnStartTime = 0;
    this.turnDuration = 30000;
    this.onTurnChange = null;
    this.onModeChange = null;
  }
  
  setMode(mode) {
    this.mode = mode;
    this.currentTurn = 'player';
    this.turnStartTime = Date.now();
    
    if (this.characterPlayer) {
      this.characterPlayer.stopPlaying();
    }
    
    if (this.onModeChange) {
      this.onModeChange(mode);
    }
  }
  
  startGame(gameType, gameState, onCharacterAction) {
    if (this.mode === 'single') {
      return;
    }
    
    this.characterPlayer = new CharacterPlayer(this.character, gameType);
    this.currentTurn = 'player';
    this.turnStartTime = Date.now();
    
    if (this.dialogue) {
      this.dialogue.onGameStart(gameType);
    }
  }
  
  endGame() {
    if (this.characterPlayer) {
      this.characterPlayer.stopPlaying();
      this.characterPlayer = null;
    }
    
    if (this.dialogue) {
      this.dialogue.onGameEnd();
    }
  }
  
  checkTurnChange() {
    if (this.mode === 'single') return false;
    
    const elapsed = Date.now() - this.turnStartTime;
    if (elapsed >= this.turnDuration) {
      this.switchTurn();
      return true;
    }
    
    return false;
  }
  
  switchTurn() {
    if (this.characterPlayer) {
      this.characterPlayer.stopPlaying();
    }
    
    this.currentTurn = this.currentTurn === 'player' ? 'character' : 'player';
    this.turnStartTime = Date.now();
    
    if (this.onTurnChange) {
      this.onTurnChange(this.currentTurn);
    }
    
    if (this.currentTurn === 'character' && this.dialogue) {
      this.dialogue.onCharacterPlay();
    }
  }
  
  onPlayerScore(score) {
    if (this.dialogue) {
      this.dialogue.onPlayerScore(score);
    }
  }
  
  onPlayerMistake() {
    if (this.dialogue) {
      this.dialogue.onPlayerMistake();
    }
  }
  
  onCharacterScore(score) {
    if (this.dialogue) {
      this.dialogue.onCharacterScore(score);
    }
  }
  
  onCharacterMistake() {
    if (this.dialogue) {
      this.dialogue.onCharacterMistake();
    }
  }
  
  getTurnTimeRemaining() {
    return Math.max(0, this.turnDuration - (Date.now() - this.turnStartTime));
  }
  
  renderModeSelector(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const selector = document.createElement('div');
    selector.className = 'game-mode-selector';
    selector.innerHTML = `
      <button class="mode-btn ${this.mode === 'single' ? 'active' : ''}" data-mode="single">
        <i class="fas fa-user"></i> 單人模式
      </button>
      <button class="mode-btn ${this.mode === 'dual' ? 'active' : ''}" data-mode="dual">
        <i class="fas fa-users"></i> 雙人模式
      </button>
    `;
    
    selector.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        this.setMode(mode);
        selector.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
    
    container.insertBefore(selector, container.firstChild);
  }
  
  renderTurnIndicator(containerId) {
    if (this.mode === 'single') return;
    
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const existing = container.querySelector('.turn-indicator');
    if (existing) existing.remove();
    
    const indicator = document.createElement('div');
    indicator.className = 'turn-indicator';
    
    const timeRemaining = Math.ceil(this.getTurnTimeRemaining() / 1000);
    const playerName = this.currentTurn === 'player' ? '你' : (this.character?.name || 'AI 助理');
    const playerClass = this.currentTurn === 'player' ? 'turn-player' : 'turn-character';
    
    indicator.innerHTML = `
      <span class="turn-label">當前回合：</span>
      <span class="${playerClass}">${playerName}</span>
      <span class="turn-label">(${timeRemaining}秒)</span>
    `;
    
    container.insertBefore(indicator, container.firstChild);
  }
  
  renderCharacterStatus(containerId) {
    if (this.mode === 'single') return;
    
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const existing = container.querySelector('.character-game-status');
    if (existing) existing.remove();
    
    const status = document.createElement('div');
    status.className = 'character-game-status';
    
    const action = this.currentTurn === 'character' ? '正在遊玩中...' : '等待中';
    
    status.innerHTML = `
      <div class="character-avatar">
        ${this.character?.name?.charAt(0) || 'A'}
      </div>
      <div class="character-name">${this.character?.name || 'AI 助理'}</div>
      <div class="character-action">${action}</div>
    `;
    
    container.insertBefore(status, container.firstChild);
  }
}

window.CharacterPlayer = CharacterPlayer;
window.DualModeController = DualModeController;
