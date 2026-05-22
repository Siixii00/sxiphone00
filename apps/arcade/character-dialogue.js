const DIALOGUE_TEMPLATES = {
  gameStart: [
    "這遊戲看起來很有趣！",
    "一起加油吧！",
    "我準備好了！",
    "來玩吧！",
    "好期待！"
  ],
  playerScore: [
    "太厲害了！",
    "哇！好棒！",
    "繼續保持！",
    "你真強！",
    "好厲害～"
  ],
  playerMistake: [
    "沒關係，再試一次！",
    "加油！你可以的！",
    "別灰心～",
    "下次會更好的！",
    "繼續努力！"
  ],
  characterPlay: [
    "換我試試看！",
    "讓我來！",
    "看我的！",
    "換手！",
    "交給我吧！"
  ],
  characterScore: [
    "耶！我做到了！",
    "怎麼樣？不錯吧！",
    "嘿嘿～",
    "我也可以！",
    "成功了！"
  ],
  characterMistake: [
    "哎呀...失敗了",
    "嗚...好難",
    "下次會更好的！",
    "有點難呢...",
    "再試一次！"
  ],
  gameEnd: [
    "謝謝你陪我玩！",
    "下次再一起玩吧！",
    "好開心！",
    "真好玩！",
    "還想再玩！"
  ],
  encouragement: [
    "加油！",
    "你可以的！",
    "別放棄！",
    "繼續！",
    "快成功了！"
  ],
  mapIdle: [
    "要去哪裡呢？",
    "今天想玩什麼？",
    "跟緊我喔～",
    "這裡好多遊戲！",
    "我們去那邊看看！"
  ]
};

const PERSONALITY_MODIFIERS = {
  '認真': { prefix: '', suffix: '', exclamationRate: 0.3 },
  '活潑': { prefix: '', suffix: '！', exclamationRate: 0.8 },
  '冷靜': { prefix: '', suffix: '', exclamationRate: 0.2 },
  '傲嬌': { prefix: '哼，', suffix: '...', exclamationRate: 0.4 },
  '溫柔': { prefix: '', suffix: '～', exclamationRate: 0.5 },
  '天然': { prefix: '咦？', suffix: '', exclamationRate: 0.6 },
  '熱血': { prefix: '', suffix: '！！', exclamationRate: 0.9 },
  '害羞': { prefix: '那個...', suffix: '', exclamationRate: 0.3 }
};

class CharacterDialogue {
  constructor(character) {
    this.character = character;
    this.lastDialogueTime = 0;
    this.cooldown = 3000;
    this.currentDialogue = null;
    this.personalityType = this.detectPersonality();
  }
  
  detectPersonality() {
    const personality = (this.character?.personality || '').toLowerCase();
    
    if (personality.includes('認真') || personality.includes('完美主義') || personality.includes('聰明')) {
      return '認真';
    } else if (personality.includes('活潑') || personality.includes('開朗') || personality.includes('元氣')) {
      return '活潑';
    } else if (personality.includes('冷靜') || personality.includes('沉著') || personality.includes('理智')) {
      return '冷靜';
    } else if (personality.includes('傲嬌') || personality.includes('ツンデレ')) {
      return '傲嬌';
    } else if (personality.includes('溫柔') || personality.includes('溫和') || personality.includes('體貼')) {
      return '溫柔';
    } else if (personality.includes('天然') || personality.includes('迷糊') || personality.includes('呆萌')) {
      return '天然';
    } else if (personality.includes('熱血') || personality.includes('衝動') || personality.includes('激情')) {
      return '熱血';
    } else if (personality.includes('害羞') || personality.includes('內向') || personality.includes('靦腆')) {
      return '害羞';
    }
    
    return '活潑';
  }
  
  canShowDialogue() {
    const now = Date.now();
    return now - this.lastDialogueTime >= this.cooldown;
  }
  
  generateDialogue(situation, context = {}) {
    if (!this.canShowDialogue()) return null;
    
    const templates = DIALOGUE_TEMPLATES[situation];
    if (!templates || templates.length === 0) return null;
    
    const baseDialogue = templates[Math.floor(Math.random() * templates.length)];
    const modifiedDialogue = this.applyPersonality(baseDialogue);
    
    this.lastDialogueTime = Date.now();
    
    return {
      text: modifiedDialogue,
      situation: situation,
      context: context
    };
  }
  
  applyPersonality(text) {
    const modifier = PERSONALITY_MODIFIERS[this.personalityType] || PERSONALITY_MODIFIERS['活潑'];
    
    let result = text;
    
    if (modifier.prefix) {
      result = modifier.prefix + result;
    }
    
    if (modifier.suffix && !result.endsWith('！') && !result.endsWith('。') && !result.endsWith('～') && !result.endsWith('...')) {
      result = result + modifier.suffix;
    }
    
    if (modifier.exclamationRate > 0.5 && !result.includes('！') && !result.includes('。')) {
      if (Math.random() < modifier.exclamationRate) {
        result = result.replace(/[！。]?$/, '！');
      }
    }
    
    return result;
  }
  
  showDialogue(situation, context = {}) {
    const dialogue = this.generateDialogue(situation, context);
    if (!dialogue) return;
    
    if (this.character && typeof this.character.showDialogue === 'function') {
      this.character.showDialogue(dialogue.text);
    }
    
    this.currentDialogue = dialogue;
    
    return dialogue;
  }
  
  showInGameDialogue(situation, context = {}) {
    const dialogue = this.generateDialogue(situation, context);
    if (!dialogue) return;
    
    const gameArea = document.getElementById('game-area');
    if (!gameArea) return;
    
    const existingBubble = document.querySelector('.character-in-game-dialogue');
    if (existingBubble) {
      existingBubble.remove();
    }
    
    const bubble = document.createElement('div');
    bubble.className = 'character-in-game-dialogue';
    bubble.innerHTML = `
      <div class="dialogue-name">${this.character?.name || 'AI 助理'}</div>
      <div class="dialogue-text">${dialogue.text}</div>
    `;
    
    gameArea.style.position = 'relative';
    gameArea.appendChild(bubble);
    
    setTimeout(() => {
      bubble.remove();
    }, 3000);
    
    this.currentDialogue = dialogue;
    
    return dialogue;
  }
  
  hideDialogue() {
    if (this.character && typeof this.character.hideDialogue === 'function') {
      this.character.hideDialogue();
    }
    
    const existingBubble = document.querySelector('.character-in-game-dialogue');
    if (existingBubble) {
      existingBubble.remove();
    }
    
    this.currentDialogue = null;
  }
  
  onGameStart(gameName) {
    return this.showInGameDialogue('gameStart', { gameName });
  }
  
  onPlayerScore(score) {
    return this.showInGameDialogue('playerScore', { score });
  }
  
  onPlayerMistake() {
    return this.showInGameDialogue('playerMistake', {});
  }
  
  onCharacterPlay() {
    return this.showInGameDialogue('characterPlay', {});
  }
  
  onCharacterScore(score) {
    return this.showInGameDialogue('characterScore', { score });
  }
  
  onCharacterMistake() {
    return this.showInGameDialogue('characterMistake', {});
  }
  
  onGameEnd() {
    return this.showInGameDialogue('gameEnd', {});
  }
  
  onMapIdle() {
    if (Math.random() < 0.3) {
      return this.showDialogue('mapIdle', {});
    }
    return null;
  }
}

window.CharacterDialogue = CharacterDialogue;
window.DIALOGUE_TEMPLATES = DIALOGUE_TEMPLATES;
