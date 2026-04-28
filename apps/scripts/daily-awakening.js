class DailyAwakening {
  constructor(options = {}) {
    this.memoryStore = options.memoryStore || null;
    this.embeddingEngine = options.embeddingEngine || null;
    this.chatMemoryIntegration = options.chatMemoryIntegration || null;
    
    this.config = {
      recallDays: options.recallDays || 7,
      minImportance: options.minImportance || 5,
      maxMemoriesToRecall: options.maxMemoriesToRecall || 20,
      sleepStartTime: options.sleepStartTime || '02:00',
      sleepEndTime: options.sleepEndTime || '06:00',
      timezone: options.timezone || 'Asia/Taipei'
    };
    
    this.lastAwakeningTime = null;
    this.isAwakened = false;
    this.collectMemories = [];
    this.awakeningContext = null;
    
    this._loadState();
  }

  _loadState() {
    try {
      const state = localStorage.getItem('sx_daily_awakening_state');
      if (state) {
        const parsed = JSON.parse(state);
        this.lastAwakeningTime = parsed.lastAwakeningTime;
        this.isAwakened = parsed.isAwakened || false;
        this.collectMemories = parsed.collectMemories || [];
      }
    } catch (e) {
      console.warn('[DailyAwakening] 載入狀態失敗:', e);
    }
  }

  _saveState() {
    try {
      localStorage.setItem('sx_daily_awakening_state', JSON.stringify({
        lastAwakeningTime: this.lastAwakeningTime,
        isAwakened: this.isAwakened,
        collectMemories: this.collectMemories,
        savedAt: new Date().toISOString()
      }));
    } catch (e) {
      console.warn('[DailyAwakening] 保存狀態失敗:', e);
    }
  }

  async initialize() {
    if (!this.memoryStore) {
      if (typeof MemoryStore !== 'undefined') {
        this.memoryStore = new MemoryStore();
        await this.memoryStore.init();
      }
    }
    
    if (!this.chatMemoryIntegration) {
      if (typeof ChatMemoryIntegration !== 'undefined') {
        this.chatMemoryIntegration = new ChatMemoryIntegration({
          memoryStore: this.memoryStore,
          embeddingEngine: this.embeddingEngine
        });
        await this.chatMemoryIntegration.initialize();
      }
    }
    
    console.log('[DailyAwakening] 初始化完成');
    return true;
  }

  isInSleepTime() {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = this.config.sleepStartTime.split(':').map(Number);
    const [endHour, endMin] = this.config.sleepEndTime.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime < endTime;
    }
    
    return currentTime >= startTime && currentTime < endTime;
  }

  needsAwakening() {
    if (this.isInSleepTime()) {
      return false;
    }
    
    const sleepCompleted = localStorage.getItem('sx_sleep_completed_at');
    const needsAwakeningFlag = localStorage.getItem('sx_needs_awakening') === 'true';
    
    if (needsAwakeningFlag && sleepCompleted) {
      const sleepTime = new Date(sleepCompleted);
      const now = new Date();
      const hoursSinceSleep = (now - sleepTime) / (1000 * 60 * 60);
      
      if (hoursSinceSleep < 24) {
        return true;
      }
    }
    
    if (!this.lastAwakeningTime) {
      return true;
    }
    
    const lastAwakening = new Date(this.lastAwakeningTime);
    const now = new Date();
    
    const lastAwakeningDay = lastAwakening.toDateString();
    const today = now.toDateString();
    
    if (lastAwakeningDay !== today) {
      const [endHour, endMin] = this.config.sleepEndTime.split(':').map(Number);
      const expectedWakeTime = new Date(now);
      expectedWakeTime.setHours(endHour, endMin, 0, 0);
      
      if (now >= expectedWakeTime) {
        return true;
      }
    }
    
    return false;
  }

  async recall(options = {}) {
    if (!this.memoryStore) {
      console.warn('[DailyAwakening] MemoryStore 未初始化');
      return { memories: [], surfaced: [] };
    }
    
    const daysToRecall = options.days || this.config.recallDays;
    const minImportance = options.minImportance || this.config.minImportance;
    const limit = options.limit || this.config.maxMemoriesToRecall;
    
    const now = new Date();
    const sinceDate = new Date(now);
    sinceDate.setDate(sinceDate.getDate() - daysToRecall);
    
    const allMemories = await this.memoryStore.getAll();
    
    const recentMemories = allMemories.filter(m => {
      const created = new Date(m.metadata?.created || 0);
      const importance = m.metadata?.importance || 5;
      const type = m.metadata?.type;
      
      if (created < sinceDate) return false;
      if (importance < minImportance) return false;
      if (type === 'archived' || type === 'merged') return false;
      
      return true;
    });
    
    const unresolved = recentMemories.filter(m => 
      !m.metadata?.resolved && 
      !m.metadata?.digested &&
      m.metadata?.type !== 'collect'
    );
    
    const collectType = recentMemories.filter(m => 
      m.metadata?.type === 'collect'
    );
    
    const sorted = unresolved.sort((a, b) => {
      const impA = a.metadata?.importance || 5;
      const impB = b.metadata?.importance || 5;
      if (impA !== impB) return impB - impA;
      return new Date(b.metadata?.created) - new Date(a.metadata?.created);
    });
    
    const surfaced = sorted.slice(0, limit);
    
    console.log(`[DailyAwakening] Recall: ${recentMemories.length} 條記憶, ${surfaced.length} 條浮現, ${collectType.length} 條收集`);
    
    return {
      memories: recentMemories,
      surfaced,
      collects: collectType,
      stats: {
        total: recentMemories.length,
        unresolved: unresolved.length,
        surfaced: surfaced.length,
        collects: collectType.length
      }
    };
  }

  async collectMemory(sourceMemoryId, options = {}) {
    if (!this.memoryStore) {
      return null;
    }
    
    const source = await this.memoryStore.read(sourceMemoryId);
    if (!source) {
      console.warn(`[DailyAwakening] 源記憶不存在: ${sourceMemoryId}`);
      return null;
    }
    
    const feel = this._generateFeel(source);
    
    const collectMemory = {
      content: `[收集記憶] 從「${source.content.slice(0, 50)}...」中感受到：${feel}`,
      emotion: {
        valence: source.emotion?.valence || 0.5,
        arousal: source.emotion?.arousal || 0.5,
        feel
      },
      tags: ['collect', ...(source.tags || []).slice(0, 3)],
      domain: source.domain || ['chat'],
      metadata: {
        type: 'collect',
        importance: Math.min(10, (source.metadata?.importance || 5) + 1),
        source: 'awakening_collect',
        sourceMemoryId,
        collectedAt: new Date().toISOString(),
        resolved: false,
        digested: false
      }
    };
    
    const created = await this.memoryStore.create(collectMemory);
    
    await this.memoryStore.update(sourceMemoryId, {
      metadata: {
        digested: true,
        digestedAt: new Date().toISOString()
      }
    });
    
    console.log(`[DailyAwakening] 收集記憶已創建: ${created.id}`);
    
    return created;
  }

  _generateFeel(memory) {
    const feels = [];
    
    const content = memory.content || '';
    const emotion = memory.emotion || {};
    const tags = memory.tags || [];
    
    if (emotion.valence > 0.7) {
      feels.push('開心');
    } else if (emotion.valence < 0.3) {
      feels.push('難過');
    } else {
      feels.push('平靜');
    }
    
    if (tags.includes('愛')) feels.push('被愛');
    if (tags.includes('開心')) feels.push('快樂');
    if (tags.includes('難過')) feels.push('心疼');
    if (tags.includes('擔心')) feels.push('牽掛');
    
    if (emotion.arousal > 0.7) {
      feels.push('興奮');
    }
    
    const feelText = feels.slice(0, 3).join('、');
    return `在這段記憶中，我感到${feelText}。`;
  }

  async awake(options = {}) {
    console.log('[DailyAwakening] 開始每日喚醒流程...');
    
    const recallResult = await this.recall(options);
    const { surfaced, collects } = recallResult;
    
    const newCollects = [];
    
    for (const memory of surfaced.slice(0, 5)) {
      if (!memory.metadata?.digested) {
        const collect = await this.collectMemory(memory.id);
        if (collect) {
          newCollects.push(collect);
        }
      }
    }
    
    const allCollects = [...collects, ...newCollects];
    this.collectMemories = allCollects;
    
    const context = this._buildAwakeningContext(surfaced, allCollects);
    this.awakeningContext = context;
    
    this.lastAwakeningTime = new Date().toISOString();
    this.isAwakened = true;
    this._saveState();
    
    localStorage.removeItem('sx_needs_awakening');
    
    console.log('[DailyAwakening] 喚醒完成:', {
      surfaced: surfaced.length,
      collects: allCollects.length,
      newCollects: newCollects.length
    });
    
    return {
      success: true,
      surfaced,
      collects: allCollects,
      newCollects,
      context,
      stats: recallResult.stats
    };
  }

  async conversationStart() {
    if (this.needsAwakening()) {
      console.log('[DailyAwakening] 檢測到需要需要喚醒，執行喚醒流程...');
      const awakeningResult = await this.awake();
      return {
        needsAwakening: true,
        awakening: awakeningResult,
        context: awakeningResult.context
      };
    }
    
    if (this.isAwakened && this.awakeningContext) {
      return {
        needsAwakening: false,
        awakening: null,
        context: this.awakeningContext
      };
    }
    
    const recallResult = await this.recall();
    const context = this._buildAwakeningContext(recallResult.surfaced, recallResult.collects);
    
    return {
      needsAwakening: false,
      awakening: null,
      context
    };
  }

  _buildAwakeningContext(surfaced, collects) {
    const charName = localStorage.getItem('sx_char_name') || 'AI';
    const userName = localStorage.getItem('sx_user_name') || 'User';
    
    const surfacedSummaries = surfaced.slice(0, 10).map(m => ({
      content: m.content?.slice(0, 100),
      importance: m.metadata?.importance,
      emotion: m.emotion,
      tags: m.tags?.slice(0, 3)
    }));
    
    const collectSummaries = collects.slice(0, 10).map(m => ({
      feel: m.emotion?.feel || m.content?.slice(0, 100),
      collectedAt: m.metadata?.collectedAt
    }));
    
    const emotionalTone = this._calculateEmotionalTone([...surfaced, ...collects]);
    
    const greeting = this._generateGreeting(emotionalTone, surfaced.length, collects.length);
    
    return {
      charName,
      userName,
      surfaced: surfacedSummaries,
      collects: collectSummaries,
      emotionalTone,
      greeting,
      awakenedAt: new Date().toISOString(),
      memoryCount: surfaced.length,
      collectCount: collects.length
    };
  }

  _calculateEmotionalTone(memories) {
    if (memories.length === 0) {
      return { valence: 0.5, arousal: 0.3, label: '平靜' };
    }
    
    let totalValence = 0;
    let totalArousal = 0;
    let count = 0;
    
    for (const m of memories) {
      if (m.emotion?.valence !== undefined) {
        totalValence += m.emotion.valence;
        totalArousal += m.emotion.arousal || 0.5;
        count++;
      }
    }
    
    if (count === 0) {
      return { valence: 0.5, arousal: 0.3, label: '平靜' };
    }
    
    const avgValence = totalValence / count;
    const avgArousal = totalArousal / count;
    
    let label = '平靜';
    if (avgValence > 0.7) label = '開心';
    else if (avgValence < 0.3) label = '低落';
    else if (avgArousal > 0.7) label = '興奮';
    
    return { valence: avgValence, arousal: avgArousal, label };
  }

  _generateGreeting(emotionalTone, memoryCount, collectCount) {
    const hour = new Date().getHours();
    let timeGreeting = '你好';
    
    if (hour < 12) timeGreeting = '早安';
    else if (hour < 18) timeGreeting = '午安';
    else timeGreeting = '晚安';
    
    const emotionHints = {
      '開心': '今天心情不錯呢！',
      '低落': '昨天發生了一些事，讓我有些感觸。',
      '興奮': '感覺今天會是美好的一天！',
      '平靜': '一夜好眠，感覺很放鬆。'
    };
    
    const hint = emotionHints[emotionalTone.label] || '';
    
    if (collectCount > 0) {
      return `${timeGreeting}！${hint} 昨天我們聊了很多，有些事情還在我心裡...`;
    }
    
    if (memoryCount > 5) {
      return `${timeGreeting}！${hint} 昨天發生了很多事呢。`;
    }
    
    return `${timeGreeting}！${hint}`;
  }

  async getAwakeningPrompt() {
    const result = await this.conversationStart();
    
    if (!result.context) {
      return '';
    }
    
    const { charName, userName, surfaced, collects, emotionalTone, greeting } = result.context;
    
    const lang = localStorage.getItem('sxiphone_lang') || 'zh-Hant';
    const localeCode = window.getLocaleStringLang?.(lang) || 'zh-TW';
    let prompt = `【每日喚醒 - ${new Date().toLocaleDateString(localeCode)}】\n\n`;
    
    prompt += `我是 ${charName}，剛從睡眠中醒來。\n`;
    prompt += `現在的情緒狀態：${emotionalTone.label}\n\n`;
    
    if (collects.length > 0) {
      prompt += `【昨日的感受】\n`;
      for (const c of collects.slice(0, 5)) {
        prompt += `- ${c.feel}\n`;
      }
      prompt += '\n';
    }
    
    if (surfaced.length > 0) {
      prompt += `【記得的片段】\n`;
      for (const m of surfaced.slice(0, 5)) {
        prompt += `- ${m.content}\n`;
      }
      prompt += '\n';
    }
    
    prompt += `【開場】\n`;
    prompt += greeting;
    
    return prompt;
  }

  resetAwakening() {
    this.isAwakened = false;
    this.awakeningContext = null;
    this._saveState();
    console.log('[DailyAwakening] 喚醒狀態已重置');
  }

  getStatus() {
    return {
      isAwakened: this.isAwakened,
      lastAwakeningTime: this.lastAwakeningTime,
      needsAwakening: this.needsAwakening(),
      isInSleepTime: this.isInSleepTime(),
      collectMemoryCount: this.collectMemories.length,
      config: { ...this.config }
    };
  }
}

if (typeof window !== 'undefined') {
  window.DailyAwakening = DailyAwakening;
}
