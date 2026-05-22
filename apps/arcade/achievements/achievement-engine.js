const ACHIEVEMENTS = [
  {
    id: 'first_game',
    name: '初次遊玩',
    description: '第一次玩遊戲',
    icon: 'fa-gamepad',
    reward: 50,
    condition: { type: 'games_played', value: 1 }
  },
  {
    id: 'snake_master',
    name: '貪吃蛇大師',
    description: '貪吃蛇累積 1000 分',
    icon: 'fa-worm',
    reward: 100,
    condition: { type: 'game_score', game: 'snake', value: 1000 }
  },
  {
    id: 'slot_lucky',
    name: '幸運兒',
    description: '拉霸機中獎 10 次',
    icon: 'fa-coins',
    reward: 50,
    condition: { type: 'slot_wins', value: 10 }
  },
  {
    id: 'gacha_5star',
    name: '歐皇降臨',
    description: '抽卡獲得 5 星 10 次',
    icon: 'fa-star',
    reward: 200,
    condition: { type: 'gacha_5star', value: 10 }
  },
  {
    id: 'gacha_100',
    name: '抽卡狂人',
    description: '累積抽卡 100 次',
    icon: 'fa-gem',
    reward: 100,
    condition: { type: 'gacha_total', value: 100 }
  },
  {
    id: 'floor_visitor',
    name: '街機廳漫遊者',
    description: '走遍所有樓層',
    icon: 'fa-map',
    reward: 50,
    condition: { type: 'floors_visited', value: 4 }
  },
  {
    id: 'machine_collector',
    name: '機台收藏家',
    description: '遊玩過所有機台',
    icon: 'fa-robot',
    reward: 100,
    condition: { type: 'machines_played', value: 19 }
  },
  {
    id: 'coin_1000',
    name: '小富翁',
    description: '累積獲得 1000 金幣',
    icon: 'fa-coins',
    reward: 50,
    condition: { type: 'coins_earned', value: 1000 }
  },
  {
    id: 'coin_10000',
    name: '金幣大亨',
    description: '累積獲得 10000 金幣',
    icon: 'fa-crown',
    reward: 200,
    condition: { type: 'coins_earned', value: 10000 }
  },
  {
    id: 'play_10',
    name: '遊戲新手',
    description: '遊玩 10 次遊戲',
    icon: 'fa-play',
    reward: 30,
    condition: { type: 'games_played', value: 10 }
  },
  {
    id: 'play_50',
    name: '遊戲達人',
    description: '遊玩 50 次遊戲',
    icon: 'fa-medal',
    reward: 100,
    condition: { type: 'games_played', value: 50 }
  },
  {
    id: 'play_100',
    name: '遊戲大師',
    description: '遊玩 100 次遊戲',
    icon: 'fa-trophy',
    reward: 200,
    condition: { type: 'games_played', value: 100 }
  },
  {
    id: 'tetris_clear',
    name: '方塊消除者',
    description: '俄羅斯方塊消除 50 行',
    icon: 'fa-cube',
    reward: 100,
    condition: { type: 'tetris_lines', value: 50 }
  },
  {
    id: 'memory_master',
    name: '記憶大師',
    description: '記憶翻牌完成 10 次',
    icon: 'fa-layer-group',
    reward: 80,
    condition: { type: 'memory_complete', value: 10 }
  },
  {
    id: 'whack_pro',
    name: '地鼠獵人',
    description: '打地鼠累積 500 分',
    icon: 'fa-hand-fist',
    reward: 100,
    condition: { type: 'whack_score', value: 500 }
  },
  {
    id: 'pinball_ace',
    name: '彈珠王牌',
    description: '彈珠台累積 2000 分',
    icon: 'fa-circle-dot',
    reward: 150,
    condition: { type: 'pinball_score', value: 2000 }
  },
  {
    id: 'adult_enter',
    name: '勇者',
    description: '進入限制級區域',
    icon: 'fa-eye',
    reward: 0,
    condition: { type: 'adult_entered', value: 1 }
  },
  {
    id: 'all_gacha',
    name: '抽卡全制霸',
    description: '玩過所有抽卡遊戲',
    icon: 'fa-gem',
    reward: 150,
    condition: { type: 'gacha_games', value: 7 }
  }
];

class AchievementEngine {
  constructor() {
    this.achievements = {};
    this.stats = {};
    this.unlocked = [];
    
    this.load();
  }
  
  load() {
    const saved = localStorage.getItem('sx_arcade_achievements');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.achievements = data.achievements || {};
        this.stats = data.stats || {};
        this.unlocked = data.unlocked || [];
      } catch (e) {
        console.warn('Failed to load achievements');
      }
    }
    
    ACHIEVEMENTS.forEach(a => {
      if (!this.achievements[a.id]) {
        this.achievements[a.id] = { unlocked: false, progress: 0 };
      }
    });
  }
  
  save() {
    localStorage.setItem('sx_arcade_achievements', JSON.stringify({
      achievements: this.achievements,
      stats: this.stats,
      unlocked: this.unlocked
    }));
  }
  
  updateStat(statType, value, increment = true) {
    if (increment) {
      this.stats[statType] = (this.stats[statType] || 0) + value;
    } else {
      this.stats[statType] = value;
    }
    
    this.checkAllAchievements();
    this.save();
  }
  
  checkAllAchievements() {
    ACHIEVEMENTS.forEach(achievement => {
      this.checkAchievement(achievement.id);
    });
  }
  
  checkAchievement(achievementId) {
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) return;
    
    const state = this.achievements[achievementId];
    if (state.unlocked) return;
    
    const condition = achievement.condition;
    let current = 0;
    
    switch (condition.type) {
      case 'games_played':
        current = Object.values(window.arcadeState?.gamesPlayed || {})
          .reduce((sum, g) => sum + (g.plays || 0), 0);
        break;
      case 'game_score':
        current = window.arcadeState?.gamesPlayed?.[condition.game]?.highScore || 0;
        break;
      case 'slot_wins':
        current = this.stats.slot_wins || 0;
        break;
      case 'gacha_5star':
        current = this.stats.gacha_5star || 0;
        break;
      case 'gacha_total':
        current = this.stats.gacha_total || 0;
        break;
      case 'floors_visited':
        current = this.stats.floors_visited || 0;
        break;
      case 'machines_played':
        current = Object.keys(window.arcadeState?.gamesPlayed || {}).length;
        break;
      case 'coins_earned':
        current = window.arcadeState?.totalCoinsEarned || 0;
        break;
      case 'tetris_lines':
        current = this.stats.tetris_lines || 0;
        break;
      case 'memory_complete':
        current = this.stats.memory_complete || 0;
        break;
      case 'whack_score':
        current = this.stats.whack_score || 0;
        break;
      case 'pinball_score':
        current = this.stats.pinball_score || 0;
        break;
      case 'adult_entered':
        current = this.stats.adult_entered || 0;
        break;
      case 'gacha_games':
        const gachaGames = ['gacha_genshin', 'gacha_starrail', 'gacha_zzz', 'gacha_fgo', 'gacha_wuwa', 'gacha_es', 'gacha_pjsk'];
        current = gachaGames.filter(g => window.arcadeState?.gamesPlayed?.[g]).length;
        break;
      default:
        current = this.stats[condition.type] || 0;
    }
    
    state.progress = current;
    
    if (current >= condition.value) {
      this.unlockAchievement(achievementId);
    }
  }
  
  unlockAchievement(achievementId) {
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) return;
    
    const state = this.achievements[achievementId];
    if (state.unlocked) return;
    
    state.unlocked = true;
    this.unlocked.push(achievementId);
    
    if (achievement.reward > 0) {
      window.coins += achievement.reward;
      window.saveCoins();
      window.updateCoinsDisplay();
    }
    
    this.showUnlockNotification(achievement);
    this.save();
  }
  
  showUnlockNotification(achievement) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
      <div class="achievement-icon">
        <i class="fas ${achievement.icon}"></i>
      </div>
      <div class="achievement-info">
        <div class="achievement-title">成就解鎖！</div>
        <div class="achievement-name">${achievement.name}</div>
        <div class="achievement-reward">+${achievement.reward} 金幣</div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
    
    if (window.audioManager) {
      window.audioManager.playWinSound();
    }
  }
  
  showAchievementsPanel() {
    const panel = document.createElement('div');
    panel.className = 'achievements-panel-overlay';
    panel.innerHTML = `
      <div class="achievements-panel">
        <div class="panel-header">
          <h3><i class="fas fa-trophy"></i> 成就</h3>
          <button class="close-btn" onclick="this.parentElement.parentElement.parentElement.remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="achievements-stats">
          <div class="stat">
            <span class="stat-value">${this.unlocked.length}</span>
            <span class="stat-label">已解鎖</span>
          </div>
          <div class="stat">
            <span class="stat-value">${ACHIEVEMENTS.length}</span>
            <span class="stat-label">總數</span>
          </div>
        </div>
        <div class="achievements-list">
          ${ACHIEVEMENTS.map(a => {
            const state = this.achievements[a.id];
            const progress = Math.min(100, (state.progress / a.condition.value) * 100);
            return `
              <div class="achievement-item ${state.unlocked ? 'unlocked' : ''}">
                <div class="achievement-icon-box">
                  <i class="fas ${a.icon}"></i>
                </div>
                <div class="achievement-details">
                  <div class="achievement-name">${a.name}</div>
                  <div class="achievement-desc">${a.description}</div>
                  <div class="achievement-progress">
                    <div class="progress-bar" style="width: ${progress}%"></div>
                  </div>
                  <div class="achievement-meta">
                    <span>${state.progress}/${a.condition.value}</span>
                    <span>+${a.reward} 金幣</span>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
    
    document.body.appendChild(panel);
  }
  
  getUnlockedCount() {
    return this.unlocked.length;
  }
  
  getTotalAchievements() {
    return ACHIEVEMENTS.length;
  }
  
  getCompletionRate() {
    return (this.unlocked.length / ACHIEVEMENTS.length) * 100;
  }
}

const achievementEngine = new AchievementEngine();

window.achievementEngine = achievementEngine;