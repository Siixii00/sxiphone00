class DecayEngine {
  constructor(options = {}) {
    this.memoryStore = options.memoryStore || null;

    this.config = {
      lambda: options.lambda || 0.03,
      threshold: options.threshold || 0.3,
      archiveThreshold: options.archiveThreshold || 0.15,
      autoResolveDays: options.autoResolveDays || 60,
      checkIntervalHours: options.checkIntervalHours || 24,
      shortTermDays: options.shortTermDays || 7,
      freshHalfLife: options.freshHalfLife || 48
    };

    this.lastCheckTime = null;
    this.isRunning = false;
  }

  calculateScore(memory) {
    if (!memory || !memory.metadata) {
      return 0;
    }

    const now = Date.now();
    const lastActive = memory.metadata.lastActive
      ? new Date(memory.metadata.lastActive).getTime()
      : now;
    const created = memory.metadata.created
      ? new Date(memory.metadata.created).getTime()
      : now;

    const daysSinceActive = (now - lastActive) / (1000 * 60 * 60 * 24);
    const hoursSinceActive = (now - lastActive) / (1000 * 60 * 60);

    const importance = memory.metadata.importance || 5;
    const activationCount = memory.metadata.activationCount || 1;
    const reinforcementCount = memory.metadata.reinforcementCount || 0;
    const memoryStrength = memory.metadata.memoryStrength || 0.5;

    const reinforcementFactor = 1 + Math.min(reinforcementCount * 0.15, 1.5);

    const strengthFactor = 0.5 + memoryStrength * 0.5;

    const timeWeight = Math.exp(-0.1 * daysSinceActive);

    const arousal = memory.emotion?.arousal || 0.5;
    const emotionWeight = 1.0 + arousal * 0.8;

    let combinedWeight;
    if (daysSinceActive <= this.config.shortTermDays) {
      combinedWeight = timeWeight * 0.7 + emotionWeight * 0.3;
    } else {
      combinedWeight = emotionWeight * 0.7 + timeWeight * 0.3;
    }

    const freshness = 1.0 + Math.exp(-hoursSinceActive / this.config.freshnessHalfLife);

    let score = importance *
      Math.pow(activationCount, 0.3) *
      Math.exp(-this.config.lambda * daysSinceActive) *
      combinedWeight *
      freshness *
      reinforcementFactor *
      strengthFactor;

    if (memory.metadata.resolved) {
      score *= 0.05;
    }
    if (memory.metadata.pinned) {
      score = 999.0;
    }
    if (memory.metadata.type === 'feel') {
      score = Math.max(score, 50.0);
    }
    if (memory.metadata.type === 'permanent') {
      score = Math.max(score, 100.0);
    }

    return score;
  }

  calculateDecayFactor(memory) {
    if (!memory || !memory.metadata) {
      return 1;
    }

    const now = Date.now();
    const lastActive = memory.metadata.lastActive
      ? new Date(memory.metadata.lastActive).getTime()
      : now;

    const daysSinceActive = (now - lastActive) / (1000 * 60 * 60 * 24);

    const baseDecay = Math.exp(-this.config.lambda * daysSinceActive);

    const memoryStrength = memory.metadata.memoryStrength || 0.5;
    const reinforcementCount = memory.metadata.reinforcementCount || 0;

    const strengthProtection = 0.5 + memoryStrength * 0.5;
    const reinforcementProtection = 1 + Math.min(reinforcementCount * 0.1, 0.5);

    return baseDecay * strengthProtection * reinforcementProtection;
  }

  async executeCycle(options = {}) {
    if (!this.memoryStore) {
      console.warn('[DecayEngine] MemoryStore 未設置');
      return { archived: 0, resolved: 0 };
    }

    if (this.isRunning) {
      console.log('[DecayEngine] 衰減週期正在執行中');
      return { archived: 0, resolved: 0 };
    }

    this.isRunning = true;
    console.log('[DecayEngine] 開始執行衰減週期...');

    try {
      const memories = await this.memoryStore.getAll();
      let archivedCount = 0;
      let resolvedCount = 0;

      for (const memory of memories) {
        if (memory.metadata?.type === 'archived') {
          continue;
        }

        const score = this.calculateScore(memory);

        if (score < this.config.archiveThreshold && memory.metadata?.type !== 'permanent') {
          await this.memoryStore.update(memory.id, {
            metadata: { type: 'archived' },
            score
          });
          archivedCount++;
          console.log(`[DecayEngine] 歸檔記憶: ${memory.id} (score: ${score.toFixed(3)})`);
          continue;
        }

        if (!memory.metadata?.resolved && memory.metadata?.type === 'dynamic') {
          const created = memory.metadata.created
            ? new Date(memory.metadata.created).getTime()
            : Date.now();
          const daysSinceCreated = (Date.now() - created) / (1000 * 60 * 60 * 24);

          if (daysSinceCreated > this.config.autoResolveDays && memory.metadata.importance <= 4) {
            await this.memoryStore.update(memory.id, {
              metadata: { resolved: true },
              score
            });
            resolvedCount++;
            console.log(`[DecayEngine] 結案記憶: ${memory.id} (${daysSinceCreated.toFixed(1)} 天)`);
          }
        }

        if (options.updateScores !== false) {
          await this.memoryStore.update(memory.id, { score });
        }
      }

      this.lastCheckTime = new Date().toISOString();

      console.log(`[DecayEngine] 衰減週期完成: 歸檔 ${archivedCount}, 結案 ${resolvedCount}`);

      return {
        archived: archivedCount,
        resolved: resolvedCount,
        total: memories.length,
        timestamp: this.lastCheckTime
      };
    } catch (error) {
      console.error('[DecayEngine] 衰減週期執行失敗:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  async startAutoCycle(intervalHours = null) {
    const interval = intervalHours || this.config.checkIntervalHours;
    
    if (this._autoCycleInterval) {
      clearInterval(this._autoCycleInterval);
    }

    this._autoCycleInterval = setInterval(async () => {
      try {
        await this.executeCycle();
      } catch (e) {
        console.error('[DecayEngine] 自動週期執行失敗:', e);
      }
    }, interval * 60 * 60 * 1000);

    console.log(`[DecayEngine] 自動衰減週期已啟動 (每 ${interval} 小時)`);
  }

  stopAutoCycle() {
    if (this._autoCycleInterval) {
      clearInterval(this._autoCycleInterval);
      this._autoCycleInterval = null;
      console.log('[DecayEngine] 自動衰減週期已停止');
    }
  }

  async getDecayStats() {
    if (!this.memoryStore) {
      return null;
    }

    const memories = await this.memoryStore.getAll();
    
    const stats = {
      total: memories.length,
      byType: {},
      byImportance: {},
      lowScore: 0,
      needsArchive: 0,
      needsResolve: 0,
      avgScore: 0
    };

    let totalScore = 0;

    for (const memory of memories) {
      const score = this.calculateScore(memory);
      totalScore += score;

      const type = memory.metadata?.type || 'unknown';
      stats.byType[type] = (stats.byType[type] || 0) + 1;

      const importance = memory.metadata?.importance || 5;
      stats.byImportance[importance] = (stats.byImportance[importance] || 0) + 1;

      if (score < this.config.threshold) {
        stats.lowScore++;
      }
      if (score < this.config.archiveThreshold && type !== 'permanent') {
        stats.needsArchive++;
      }

      if (!memory.metadata?.resolved && type === 'dynamic') {
        const created = memory.metadata.created
          ? new Date(memory.metadata.created).getTime()
          : Date.now();
        const daysSinceCreated = (Date.now() - created) / (1000 * 60 * 60 * 24);
        if (daysSinceCreated > this.config.autoResolveDays && importance <= 4) {
          stats.needsResolve++;
        }
      }
    }

    stats.avgScore = memories.length > 0 ? totalScore / memories.length : 0;
    stats.lastCheckTime = this.lastCheckTime;

    return stats;
  }

  async boostMemory(id, factor = 2.0) {
    if (!this.memoryStore) {
      throw new Error('MemoryStore 未設置');
    }

    const memory = await this.memoryStore.read(id);
    if (!memory) {
      throw new Error(`記憶不存在: ${id}`);
    }

    const currentScore = memory.score || this.calculateScore(memory);
    const newScore = currentScore * factor;

    await this.memoryStore.update(id, {
      metadata: {
        lastActive: new Date().toISOString(),
        activationCount: (memory.metadata?.activationCount || 1) + 1
      },
      score: newScore
    });

    console.log(`[DecayEngine] 提升記憶: ${id} (${currentScore.toFixed(3)} -> ${newScore.toFixed(3)})`);
    return newScore;
  }

  async pinMemory(id) {
    if (!this.memoryStore) {
      throw new Error('MemoryStore 未設置');
    }

    await this.memoryStore.update(id, {
      metadata: { pinned: true },
      score: 999.0
    });

    console.log(`[DecayEngine] 固定記憶: ${id}`);
  }

  async unpinMemory(id) {
    if (!this.memoryStore) {
      throw new Error('MemoryStore 未設置');
    }

    const memory = await this.memoryStore.read(id);
    if (!memory) {
      throw new Error(`記憶不存在: ${id}`);
    }

    const score = this.calculateScore({ ...memory, metadata: { ...memory.metadata, pinned: false } });
    await this.memoryStore.update(id, {
      metadata: { pinned: false },
      score
    });

    console.log(`[DecayEngine] 解除固定記憶: ${id}`);
  }

  setConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('[DecayEngine] 配置已更新:', this.config);
  }

  getConfig() {
    return { ...this.config };
  }
}

if (typeof window !== 'undefined') {
  window.DecayEngine = DecayEngine;
}
