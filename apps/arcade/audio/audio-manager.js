class AudioManager {
  constructor() {
    this.bgmEnabled = true;
    this.sfxEnabled = true;
    this.currentBGM = null;
    this.bgmVolume = 0.5;
    this.sfxVolume = 0.7;
    this.audioContext = null;
    this.sounds = {};
    this.bgmAudio = null;
    
    this.musicFiles = [];
    this.currentTrackIndex = 0;
    this.playMode = 'loop';
    this.isPlaying = false;
    this.musicPath = './music/';
    
    this.floorBGM = {
      '1F': 'lobby',
      '2F': 'casual',
      '3F': 'gacha',
      'B1': 'adult'
    };
    
    this.gameBGM = {
      snake: 'arcade',
      slot: 'casino',
      gacha: 'gacha',
      tetris: 'arcade',
      whackamole: 'arcade',
      memory: 'arcade',
      pinball: 'arcade',
      adult: 'adult'
    };
  }
  
  async init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      this.loadSettings();
      await this.loadMusicFiles();
      
      console.log('Audio Manager initialized');
    } catch (e) {
      console.warn('Audio context not supported:', e);
    }
  }
  
  async loadMusicFiles() {
    this.musicFiles = [];
    
    // 尝试加载实际存在的音乐文件
    const existingFiles = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'];
    
    for (const fileNum of existingFiles) {
      const fileName = fileNum + '.mp3';
      this.musicFiles.push({
        id: parseInt(fileNum),
        name: `Track ${fileNum}`,
        file: fileName,
        path: this.musicPath + fileName
      });
    }
    
    this.loadMusicSettings();
  }
  
  loadMusicSettings() {
    const saved = localStorage.getItem('sx_arcade_music');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        this.currentTrackIndex = settings.currentTrackIndex ?? 0;
        this.playMode = settings.playMode ?? 'loop';
      } catch (e) {}
    }
  }
  
  saveMusicSettings() {
    localStorage.setItem('sx_arcade_music', JSON.stringify({
      currentTrackIndex: this.currentTrackIndex,
      playMode: this.playMode
    }));
  }
  
  setTrack(index) {
    if (index >= 0 && index < this.musicFiles.length) {
      this.currentTrackIndex = index;
      this.saveMusicSettings();
      if (this.isPlaying) {
        this.playCurrentTrack();
      }
    }
  }
  
  setPlayMode(mode) {
    this.playMode = mode;
    this.saveMusicSettings();
  }
  
  async playCurrentTrack() {
    if (this.musicFiles.length === 0) {
      console.warn('No music files loaded');
      return;
    }
    
    // 确保 AudioContext 已初始化并处于运行状态
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (e) {
        console.warn('Failed to resume AudioContext:', e);
      }
    }
    
    this.stopBGM();
    
    const track = this.musicFiles[this.currentTrackIndex];
    if (!track) {
      console.warn('Track not found at index:', this.currentTrackIndex);
      return;
    }
    
    console.log('Playing track:', track.name, 'from', track.path);
    
    this.bgmAudio = new Audio(track.path);
    this.bgmAudio.volume = this.bgmVolume;
    this.bgmAudio.loop = this.playMode === 'loop';
    
    this.bgmAudio.addEventListener('canplaythrough', () => {
      console.log('Track loaded and ready to play');
    });
    
    this.bgmAudio.addEventListener('ended', () => {
      console.log('Track ended, playMode:', this.playMode);
      if (this.playMode === 'playlist') {
        this.nextTrack();
      } else if (this.playMode === 'random') {
        this.randomTrack();
      }
    });
    
    this.bgmAudio.addEventListener('error', (e) => {
      console.warn('Failed to load track:', track.name, e);
      // 尝试播放下一首
      if (this.playMode === 'playlist' || this.playMode === 'random') {
        setTimeout(() => this.nextTrack(), 500);
      }
    });
    
    try {
      await this.bgmAudio.play();
      this.isPlaying = true;
      this.currentBGM = 'custom';
      console.log('Track playing successfully');
    } catch (e) {
      console.warn('Audio play failed:', e);
      this.isPlaying = false;
    }
  }
  
  async nextTrack() {
    if (this.playMode === 'random') {
      await this.randomTrack();
    } else {
      this.currentTrackIndex = (this.currentTrackIndex + 1) % this.musicFiles.length;
      this.saveMusicSettings();
      await this.playCurrentTrack();
    }
  }
  
  async prevTrack() {
    this.currentTrackIndex = (this.currentTrackIndex - 1 + this.musicFiles.length) % this.musicFiles.length;
    this.saveMusicSettings();
    await this.playCurrentTrack();
  }
  
  async randomTrack() {
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * this.musicFiles.length);
    } while (newIndex === this.currentTrackIndex && this.musicFiles.length > 1);
    
    this.currentTrackIndex = newIndex;
    this.saveMusicSettings();
    await this.playCurrentTrack();
  }
  
  async previewTrack(index, callback) {
    const track = this.musicFiles[index];
    if (!track) {
      console.warn('Preview track not found at index:', index);
      return;
    }
    
    if (this.previewAudio) {
      this.previewAudio.pause();
      this.previewAudio = null;
    }
    
    // 确保 AudioContext 已初始化
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (e) {
        console.warn('Failed to resume AudioContext for preview:', e);
      }
    }
    
    console.log('Previewing track:', track.name);
    
    this.previewAudio = new Audio(track.path);
    this.previewAudio.volume = this.bgmVolume;
    this.previewAudio.currentTime = 0;
    
    this.previewAudio.addEventListener('error', (e) => {
      console.warn('Preview failed to load:', track.name, e);
    });
    
    try {
      await this.previewAudio.play();
      console.log('Preview playing');
    } catch (e) {
      console.warn('Preview play failed:', e);
    }
    
    if (callback) {
      this.previewAudio.addEventListener('ended', callback);
    }
  }
  
  stopPreview() {
    if (this.previewAudio) {
      this.previewAudio.pause();
      this.previewAudio = null;
    }
  }
  
  loadSettings() {
    const saved = localStorage.getItem('sx_arcade_audio');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        this.bgmEnabled = settings.bgmEnabled ?? true;
        this.sfxEnabled = settings.sfxEnabled ?? true;
        this.bgmVolume = settings.bgmVolume ?? 0.5;
        this.sfxVolume = settings.sfxVolume ?? 0.7;
      } catch (e) {
        console.warn('Failed to load audio settings');
      }
    }
  }
  
  saveSettings() {
    localStorage.setItem('sx_arcade_audio', JSON.stringify({
      bgmEnabled: this.bgmEnabled,
      sfxEnabled: this.sfxEnabled,
      bgmVolume: this.bgmVolume,
      sfxVolume: this.sfxVolume
    }));
  }
  
  toggleBGM() {
    this.bgmEnabled = !this.bgmEnabled;
    this.saveSettings();
    
    if (!this.bgmEnabled) {
      if (this.bgmAudio) {
        this.bgmAudio.pause();
      }
      this.stop8BitBGM();
      this.isPlaying = false;
    } else if (this.currentBGM === 'custom' || this.isPlaying) {
      this.playCurrentTrack();
    } else if (this.currentBGM) {
      this.playBGM(this.currentBGM);
    }
    
    return this.bgmEnabled;
  }
  
  toggleSFX() {
    this.sfxEnabled = !this.sfxEnabled;
    this.saveSettings();
    return this.sfxEnabled;
  }
  
  setBGMVolume(volume) {
    this.bgmVolume = Math.max(0, Math.min(1, volume));
    if (this.bgmAudio) {
      this.bgmAudio.volume = this.bgmVolume;
    }
    this.saveSettings();
  }
  
  setSFXVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    this.saveSettings();
  }
  
  playAmbient(floor) {
    if (!this.bgmEnabled) return;
    
    const bgmType = this.floorBGM[floor] || 'lobby';
    this.playBGM(bgmType);
  }
  
  playGameBGM(game) {
    if (!this.bgmEnabled) return;
    
    const bgmType = this.gameBGM[game] || 'arcade';
    this.playBGM(bgmType);
  }
  
  stopGameBGM() {
    this.stopBGM();
  }
  
  playBGM(type) {
    if (!this.bgmEnabled) return;
    
    if (this.currentBGM === type && this.bgmAudio && !this.bgmAudio.paused) {
      return;
    }
    
    this.stopBGM();
    
    this.play8BitBGM(type);
    this.currentBGM = type;
  }
  
  play8BitBGM(type) {
    if (!this.audioContext || !this.bgmEnabled) return;
    
    this.stop8BitBGM();
    
    const melodies = {
      lobby: [
        { freq: 262, duration: 0.2 },
        { freq: 330, duration: 0.2 },
        { freq: 392, duration: 0.2 },
        { freq: 330, duration: 0.2 },
        { freq: 262, duration: 0.2 },
        { freq: 294, duration: 0.2 },
        { freq: 330, duration: 0.2 },
        { freq: 294, duration: 0.2 }
      ],
      casual: [
        { freq: 392, duration: 0.15 },
        { freq: 440, duration: 0.15 },
        { freq: 494, duration: 0.15 },
        { freq: 523, duration: 0.15 },
        { freq: 494, duration: 0.15 },
        { freq: 440, duration: 0.15 },
        { freq: 392, duration: 0.15 },
        { freq: 330, duration: 0.15 }
      ],
      gacha: [
        { freq: 523, duration: 0.1 },
        { freq: 587, duration: 0.1 },
        { freq: 659, duration: 0.1 },
        { freq: 698, duration: 0.1 },
        { freq: 784, duration: 0.2 },
        { freq: 698, duration: 0.1 },
        { freq: 659, duration: 0.1 },
        { freq: 587, duration: 0.1 }
      ],
      arcade: [
        { freq: 330, duration: 0.1 },
        { freq: 392, duration: 0.1 },
        { freq: 330, duration: 0.1 },
        { freq: 392, duration: 0.1 },
        { freq: 440, duration: 0.15 },
        { freq: 392, duration: 0.1 },
        { freq: 330, duration: 0.1 },
        { freq: 294, duration: 0.15 }
      ],
      casino: [
        { freq: 262, duration: 0.15 },
        { freq: 330, duration: 0.15 },
        { freq: 392, duration: 0.15 },
        { freq: 523, duration: 0.3 },
        { freq: 392, duration: 0.15 },
        { freq: 330, duration: 0.15 },
        { freq: 262, duration: 0.15 },
        { freq: 196, duration: 0.3 }
      ],
      adult: [
        { freq: 196, duration: 0.2 },
        { freq: 220, duration: 0.2 },
        { freq: 247, duration: 0.2 },
        { freq: 262, duration: 0.2 },
        { freq: 247, duration: 0.15 },
        { freq: 220, duration: 0.15 },
        { freq: 196, duration: 0.15 },
        { freq: 165, duration: 0.2 }
      ]
    };
    
    const melody = melodies[type] || melodies.lobby;
    this.bgmMelody = melody;
    this.bgmNoteIndex = 0;
    this.bgmInterval = setInterval(() => {
      if (!this.bgmEnabled) {
        this.stop8BitBGM();
        return;
      }
      this.playNote(melody[this.bgmNoteIndex].freq, melody[this.bgmNoteIndex].duration);
      this.bgmNoteIndex = (this.bgmNoteIndex + 1) % melody.length;
    }, 300);
  }
  
  stop8BitBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
  
  playNote(frequency, duration) {
    if (!this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(this.bgmVolume * 0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }
  
  stopBGM() {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio = null;
    }
    this.stop8BitBGM();
    this.currentBGM = null;
  }
  
  playSFX(name) {
    if (!this.sfxEnabled || !this.audioContext) return;
    
    const sfxConfig = {
      coin: { freq: 880, duration: 0.1, type: 'square' },
      click: { freq: 440, duration: 0.05, type: 'square' },
      win: { freq: 660, duration: 0.15, type: 'square' },
      lose: { freq: 220, duration: 0.2, type: 'sawtooth' },
      pull: { freq: 330, duration: 0.1, type: 'square' },
      rarity5: { freq: 880, duration: 0.3, type: 'sine' },
      rarity4: { freq: 660, duration: 0.2, type: 'sine' },
      move: { freq: 220, duration: 0.05, type: 'square' },
      interact: { freq: 440, duration: 0.08, type: 'square' },
      spin: { freq: 330, duration: 0.15, type: 'triangle' },
      jackpot: { freq: 523, duration: 0.4, type: 'square' }
    };
    
    const config = sfxConfig[name];
    if (!config) return;
    
    this.playSFXNote(config.freq, config.duration, config.type);
  }
  
  playSFXNote(frequency, duration, waveType) {
    if (!this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.type = waveType || 'square';
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(this.sfxVolume * 0.4, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }
  
  playCoinSound() {
    this.playSFX('coin');
  }
  
  playWinSound() {
    this.playSFX('win');
  }
  
  playLoseSound() {
    this.playSFX('lose');
  }
  
  playClickSound() {
    this.playSFX('click');
  }
  
  playPullSound() {
    this.playSFX('pull');
  }
  
  playRaritySound(rarity) {
    if (rarity === 5) {
      this.playSFX('rarity5');
    } else if (rarity === 4) {
      this.playSFX('rarity4');
    }
  }
  
  playMoveSound() {
    this.playSFX('move');
  }
  
  playInteractSound() {
    this.playSFX('interact');
  }
  
  playSpinSound() {
    this.playSFX('spin');
  }
  
  playJackpotSound() {
    this.playSFX('jackpot');
  }
  
  resumeContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

const audioManager = new AudioManager();

document.addEventListener('click', () => {
  audioManager.resumeContext();
}, { once: true });

document.addEventListener('touchstart', () => {
  audioManager.resumeContext();
}, { once: true });

audioManager.init();

window.audioManager = audioManager;
