class MemoryStandardizer {
  constructor(options = {}) {
    this.version = '2.0';
    this.config = {
      maxSummaryLength: options.maxSummaryLength || 200,
      includeEmbedding: options.includeEmbedding !== false
    };
  }

  async standardize(memory) {
    if (!memory) {
      return null;
    }

    const structured = this.toStructuredJSON(memory);
    const naturalLanguage = this.toNaturalLanguage(memory);
    const summary = this.generateSummary(memory);

    return {
      structured,
      naturalLanguage,
      summary,
      embedding: this.config.includeEmbedding ? memory.embedding : null,
      meta: {
        id: memory.id,
        region: memory.region?.primary || 'unknown',
        importance: memory.metadata?.importance || 5,
        created: memory.metadata?.created,
        consolidated: memory.metadata?.consolidated || false
      }
    };
  }

  toStructuredJSON(memory) {
    const dims = memory.dimensions || {};

    return {
      version: this.version,
      type: 'memory',
      id: memory.id,
      region: memory.region?.primary || 'episodic',
      dimensions: {
        when: {
          timestamp: dims.temporal?.absolute?.timestamp || memory.metadata?.created,
          relative: dims.temporal?.relative?.fromNow || 'unknown',
          period: dims.temporal?.relative?.period || 'unknown',
          timeOfDay: dims.temporal?.relative?.timeOfDay || 'unknown',
          season: dims.temporal?.relative?.season || 'unknown'
        },
        where: {
          location: dims.spatial?.physical?.location || null,
          environment: dims.spatial?.physical?.environment || 'unknown',
          setting: dims.spatial?.physical?.setting || 'unknown',
          context: dims.spatial?.contextual?.context || 'general',
          domain: dims.spatial?.contextual?.domain || 'unknown'
        },
        emotion: {
          primary: dims.emotional?.nuanced?.primary || 'neutral',
          valence: dims.emotional?.basic?.valence || 0.5,
          arousal: dims.emotional?.basic?.arousal || 0.5,
          intensity: dims.emotional?.nuanced?.intensity || 0.5
        }
      },
      content: {
        original: memory.content,
        summary: memory.standardized?.summary || null,
        entities: {
          people: dims.temporal?.episodic?.people || [],
          places: dims.temporal?.episodic?.places || [],
          objects: dims.temporal?.episodic?.objects || []
        }
      },
      metadata: {
        importance: memory.metadata?.importance || 5,
        type: memory.metadata?.type || 'dynamic',
        source: memory.metadata?.source || 'unknown',
        consolidated: memory.metadata?.consolidated || false,
        pinned: memory.metadata?.pinned || false
      },
      tags: memory.tags || [],
      domain: memory.domain || []
    };
  }

  toNaturalLanguage(memory) {
    const parts = [];
    const dims = memory.dimensions || {};

    const time = dims.temporal?.relative?.fromNow || '未知時間';
    parts.push(`時間：${time}`);

    const place = dims.spatial?.physical?.location;
    const setting = dims.spatial?.physical?.setting;
    if (place) {
      parts.push(`地點：${place}`);
    } else if (setting && setting !== 'unknown') {
      parts.push(`場景：${this._translateSetting(setting)}`);
    }

    const emotion = dims.emotional?.nuanced?.primary || 'neutral';
    const intensity = dims.emotional?.nuanced?.intensity || 0.5;
    const valence = dims.emotional?.basic?.valence || 0.5;

    const emotionLabel = this._translateEmotion(emotion);
    const intensityLabel = intensity > 0.7 ? '強烈' : intensity > 0.4 ? '中等' : '輕微';
    const valenceLabel = valence > 0.6 ? '正面' : valence < 0.4 ? '負面' : '中性';

    parts.push(`情感：${emotionLabel}（${valenceLabel}，${intensityLabel}）`);

    const domain = dims.spatial?.contextual?.domain;
    if (domain && domain !== 'unknown') {
      parts.push(`領域：${this._translateDomain(domain)}`);
    }

    const summary = memory.standardized?.summary || this._truncateContent(memory.content, 100);
    parts.push(`內容：${summary}`);

    const region = memory.region?.primary || 'episodic';
    parts.push(`類型：${this.regionToLabel(region)}`);

    const importance = memory.metadata?.importance || 5;
    if (importance >= 8) {
      parts.push(`重要性：★★★（${importance}/10）`);
    } else if (importance >= 6) {
      parts.push(`重要性：★★（${importance}/10）`);
    } else {
      parts.push(`重要性：★（${importance}/10）`);
    }

    return parts.join('\n');
  }

  generateSummary(memory) {
    const content = memory.content;

    if (content.length <= this.config.maxSummaryLength) {
      return content;
    }

    const sentences = content.match(/[^。！？.!?]+[。！？.!?]+/g) || [content];

    if (sentences.length === 1) {
      return this._truncateContent(content, this.config.maxSummaryLength);
    }

    let summary = '';
    for (const sentence of sentences) {
      if ((summary + sentence).length <= this.config.maxSummaryLength) {
        summary += sentence;
      } else {
        break;
      }
    }

    if (!summary) {
      summary = this._truncateContent(content, this.config.maxSummaryLength);
    }

    return summary;
  }

  regionToLabel(region) {
    const labels = {
      sensory: '感覺記憶',
      procedural: '動作記憶',
      episodic: '情節記憶',
      semantic: '語義記憶'
    };
    return labels[region] || '一般記憶';
  }

  _translateSetting(setting) {
    const translations = {
      home: '家中',
      office: '辦公室',
      cafe: '咖啡館',
      restaurant: '餐廳',
      school: '學校',
      park: '公園',
      transport: '交通工具',
      indoor: '室內',
      outdoor: '戶外',
      virtual: '線上',
      unknown: '未知'
    };
    return translations[setting] || setting;
  }

  _translateEmotion(emotion) {
    const translations = {
      joy: '喜悅',
      sadness: '悲傷',
      anger: '憤怒',
      fear: '恐懼',
      surprise: '驚訝',
      disgust: '厭惡',
      anticipation: '期待',
      trust: '信任',
      love: '愛',
      shame: '羞愧',
      pride: '自豪',
      gratitude: '感激',
      neutral: '平靜'
    };
    return translations[emotion] || emotion;
  }

  _translateDomain(domain) {
    const translations = {
      work: '工作',
      life: '生活',
      learning: '學習',
      entertainment: '娛樂',
      health: '健康',
      unknown: '未知'
    };
    return translations[domain] || domain;
  }

  _truncateContent(content, maxLength) {
    if (content.length <= maxLength) {
      return content;
    }
    return content.slice(0, maxLength - 3) + '...';
  }

  async generateReport(memories, options = {}) {
    const report = {
      header: {
        version: this.version,
        generatedAt: new Date().toISOString(),
        totalMemories: memories.length,
        format: 'standardized'
      },
      byRegion: {
        sensory: [],
        procedural: [],
        episodic: [],
        semantic: []
      },
      timeline: [],
      emotionSummary: {},
      highlights: [],
      statistics: {}
    };

    for (const memory of memories) {
      const standardized = await this.standardize(memory);

      const region = memory.region?.primary || 'episodic';
      if (report.byRegion[region]) {
        report.byRegion[region].push(standardized);
      }

      report.timeline.push({
        id: memory.id,
        timestamp: memory.dimensions?.temporal?.absolute?.timestamp || memory.metadata?.created,
        summary: standardized.summary,
        region
      });
    }

    report.timeline.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );

    report.emotionSummary = this._analyzeEmotions(memories);

    report.highlights = memories
      .filter(m => (m.metadata?.importance || 5) >= 7)
      .sort((a, b) => (b.metadata?.importance || 5) - (a.metadata?.importance || 5))
      .slice(0, 10)
      .map(m => ({
        id: m.id,
        summary: m.standardized?.summary || this.generateSummary(m),
        importance: m.metadata?.importance,
        region: m.region?.primary
      }));

    report.statistics = this._calculateStatistics(memories);

    return report;
  }

  _analyzeEmotions(memories) {
    const summary = {
      total: memories.length,
      avgValence: 0,
      avgArousal: 0,
      distribution: {},
      trends: []
    };

    let totalValence = 0;
    let totalArousal = 0;
    let validCount = 0;

    for (const memory of memories) {
      const dims = memory.dimensions || {};
      const basic = dims.emotional?.basic || {};

      if (basic.valence !== undefined) {
        totalValence += basic.valence;
        totalArousal += basic.arousal || 0.5;
        validCount++;
      }

      const emotion = dims.emotional?.nuanced?.primary || 'neutral';
      summary.distribution[emotion] = (summary.distribution[emotion] || 0) + 1;
    }

    if (validCount > 0) {
      summary.avgValence = Math.round((totalValence / validCount) * 100) / 100;
      summary.avgArousal = Math.round((totalArousal / validCount) * 100) / 100;
    }

    return summary;
  }

  _calculateStatistics(memories) {
    const stats = {
      byType: {},
      byImportance: {},
      byRegion: {},
      consolidated: 0,
      pinned: 0,
      archived: 0
    };

    for (const memory of memories) {
      const type = memory.metadata?.type || 'dynamic';
      stats.byType[type] = (stats.byType[type] || 0) + 1;

      const importance = memory.metadata?.importance || 5;
      stats.byImportance[importance] = (stats.byImportance[importance] || 0) + 1;

      const region = memory.region?.primary || 'episodic';
      stats.byRegion[region] = (stats.byRegion[region] || 0) + 1;

      if (memory.metadata?.consolidated) stats.consolidated++;
      if (memory.metadata?.pinned) stats.pinned++;
      if (memory.metadata?.type === 'archived') stats.archived++;
    }

    return stats;
  }

  toMarkdown(memory) {
    const standardized = this.toStructuredJSON(memory);
    const nl = this.toNaturalLanguage(memory);

    let md = `# 記憶 ${memory.id}\n\n`;
    md += `**類型**：${this.regionToLabel(standardized.region)}\n`;
    md += `**重要性**：${standardized.metadata.importance}/10\n`;
    md += `**時間**：${standardized.dimensions.when.timestamp}\n\n`;
    md += `---\n\n`;
    md += `## 內容\n\n${memory.content}\n\n`;
    md += `---\n\n`;
    md += `## 維度分析\n\n`;
    md += `\`\`\`\n${nl}\n\`\`\`\n\n`;

    if (memory.tags && memory.tags.length > 0) {
      md += `**標籤**：${memory.tags.join(', ')}\n`;
    }

    return md;
  }

  async batchStandardize(memories) {
    const results = [];

    for (const memory of memories) {
      try {
        const standardized = await this.standardize(memory);
        results.push(standardized);
      } catch (e) {
        console.warn(`[MemoryStandardizer] 標準化失敗: ${memory.id}`, e);
      }
    }

    return results;
  }
}

if (typeof window !== 'undefined') {
  window.MemoryStandardizer = MemoryStandardizer;
}
