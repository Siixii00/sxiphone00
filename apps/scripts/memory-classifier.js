class MemoryClassifier {
  constructor(options = {}) {
    this.apiConfig = options.apiConfig || null;
    this.config = {
      useLLM: options.useLLM !== false,
      confidenceThreshold: options.confidenceThreshold || 0.7
    };

    this.patterns = {
      sensory: {
        visual: ['看到', '看見', '顏色', '形狀', '夕陽', '風景', '畫面', '影像', '視覺', '明亮', '黑暗', '色彩', '橘紅', '藍色', '綠色', '美麗', '漂亮', '看到', 'look', 'see', 'color', 'bright', 'dark', 'beautiful'],
        auditory: ['聽到', '聽見', '聲音', '音樂', '歌', '旋律', '噪音', '安靜', '吵雜', '聽覺', 'hear', 'sound', 'music', 'song', 'noise', 'quiet'],
        olfactory: ['聞到', '氣味', '香味', '臭味', '香氣', '味道', '嗅覺', 'smell', 'scent', 'fragrance', 'odor'],
        tactile: ['摸到', '觸感', '溫度', '冷', '熱', '軟', '硬', '粗糙', '光滑', '觸覺', 'touch', 'feel', 'warm', 'cold', 'soft', 'hard'],
        gustatory: ['吃到', '味道', '好吃', '難吃', '甜', '酸', '苦', '辣', '鹹', '味覺', 'taste', 'delicious', 'sweet', 'sour', 'bitter']
      },
      procedural: {
        actions: ['如何', '怎麼', '步驟', '方法', '操作', '設定', '配置', '安裝', '使用', '執行', '點擊', '輸入', '選擇', 'how to', 'step', 'method', 'click', 'input', 'select', 'run'],
        sequences: ['首先', '然後', '接著', '最後', '第一步', '第二步', '第一', '第二', '之後', 'before', 'after', 'first', 'second', 'then', 'finally'],
        skills: ['學會', '練習', '熟練', '技巧', '技能', '習慣', '每天', '例行', 'learn', 'practice', 'skill', 'habit', 'daily', 'routine']
      },
      episodic: {
        people: ['我', '你', '他', '她', '我們', '你們', '他們', '朋友', '家人', '同事', '老闆', '老師', '小明', '小華', 'i', 'you', 'he', 'she', 'we', 'friend', 'family', 'colleague'],
        places: ['家', '公司', '學校', '咖啡館', '餐廳', '公園', '辦公室', '會議室', 'home', 'office', 'school', 'cafe', 'restaurant', 'park'],
        times: ['昨天', '今天', '明天', '上週', '下週', '早上', '中午', '下午', '晚上', '小時前', 'yesterday', 'today', 'tomorrow', 'morning', 'afternoon', 'evening', 'hour ago'],
        events: ['會議', '約會', '聚會', '派對', '生日', '節日', '旅行', 'meeting', 'date', 'party', 'birthday', 'holiday', 'trip']
      },
      semantic: {
        concepts: ['概念', '理論', '原理', '定義', '意思是', '是指', '代表', 'concept', 'theory', 'principle', 'definition', 'means'],
        facts: ['是', '有', '存在', '事實', '數據', '統計', '研究', '結果', 'is', 'are', 'fact', 'data', 'statistic', 'research', 'result'],
        knowledge: ['知識', '學習', '了解', '知道', '理解', '明白', 'knowledge', 'learn', 'understand', 'know'],
        rules: ['規則', '法律', '規定', '原則', '應該', '必須', '不能', 'rule', 'law', 'regulation', 'should', 'must', 'cannot']
      }
    };
  }

  async classify(content, options = {}) {
    if (!content || typeof content !== 'string') {
      return this._defaultClassification();
    }

    const features = this.detectFeatures(content);
    const scores = this._calculateRegionScores(features);
    const ruleBasedResult = this._determinePrimaryRegion(scores);

    if (!this.config.useLLM || options.skipLLM) {
      return ruleBasedResult;
    }

    if (ruleBasedResult.confidence >= this.confidenceThreshold && !options.forceLLM) {
      return ruleBasedResult;
    }

    try {
      const llmResult = await this._classifyWithLLM(content, features);
      return this._mergeResults(ruleBasedResult, llmResult);
    } catch (e) {
      console.warn('[MemoryClassifier] LLM 分類失敗，使用規則結果:', e);
      return ruleBasedResult;
    }
  }

  detectFeatures(content) {
    const lowerContent = content.toLowerCase();
    const features = {
      sensory: {
        visual: [],
        auditory: [],
        olfactory: [],
        tactile: [],
        gustatory: []
      },
      procedural: {
        actions: [],
        sequences: [],
        skills: []
      },
      episodic: {
        people: [],
        places: [],
        times: [],
        events: []
      },
      semantic: {
        concepts: [],
        facts: [],
        knowledge: [],
        rules: []
      }
    };

    for (const [region, categories] of Object.entries(this.patterns)) {
      for (const [category, keywords] of Object.entries(categories)) {
        for (const keyword of keywords) {
          if (lowerContent.includes(keyword.toLowerCase())) {
            features[region][category].push(keyword);
          }
        }
      }
    }

    return features;
  }

  _calculateRegionScores(features) {
    const scores = {
      sensory: 0,
      procedural: 0,
      episodic: 0,
      semantic: 0
    };

    for (const [region, categories] of Object.entries(features)) {
      let totalMatches = 0;
      let categoryCount = 0;

      for (const matches of Object.values(categories)) {
        totalMatches += matches.length;
        if (matches.length > 0) categoryCount++;
      }

      scores[region] = totalMatches > 0 
        ? (totalMatches * 0.5 + categoryCount * 1.5) 
        : 0;
    }

    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    if (total > 0) {
      for (const region of Object.keys(scores)) {
        scores[region] = scores[region] / total;
      }
    }

    return scores;
  }

  _determinePrimaryRegion(scores) {
    const sorted = Object.entries(scores)
      .sort((a, b) => b[1] - a[1]);

    const [primary, primaryScore] = sorted[0];
    const secondary = sorted
      .slice(1, 3)
      .filter(([, score]) => score > 0.1)
      .map(([region]) => region);

    const confidence = primaryScore > 0.4 ? 0.9 
      : primaryScore > 0.25 ? 0.75 
      : primaryScore > 0.1 ? 0.6 
      : 0.4;

    return {
      primary,
      secondary,
      confidence,
      reasoning: this._generateReasoning(primary, scores),
      distribution: {
        sensory: Math.round(scores.sensory * 100) / 100,
        procedural: Math.round(scores.procedural * 100) / 100,
        episodic: Math.round(scores.episodic * 100) / 100,
        semantic: Math.round(scores.semantic * 100) / 100
      }
    };
  }

  _generateReasoning(primary, scores) {
    const reasons = {
      sensory: '包含感官體驗描述',
      procedural: '包含操作步驟或技能相關內容',
      episodic: '包含人物、地點、時間等事件元素',
      semantic: '包含概念、知識或事實性內容'
    };

    const parts = [reasons[primary] || '一般內容'];

    const secondary = Object.entries(scores)
      .filter(([r, s]) => r !== primary && s > 0.15)
      .map(([r]) => reasons[r]);

    if (secondary.length > 0) {
      parts.push(`同時${secondary.join('，')}`);
    }

    return parts.join('；');
  }

  _defaultClassification() {
    return {
      primary: 'episodic',
      secondary: [],
      confidence: 0.3,
      reasoning: '無法分析內容，使用預設分類',
      distribution: {
        sensory: 0,
        procedural: 0,
        episodic: 1,
        semantic: 0
      }
    };
  }

  async _classifyWithLLM(content, features) {
    if (!this.apiConfig || !this.apiConfig.key) {
      throw new Error('API 配置缺失');
    }

    const { provider, url, key, model } = this.apiConfig;

    const systemPrompt = `你是一個記憶分類專家。請分析給定內容並判斷它屬於哪個記憶區域。

記憶區域定義：
- sensory（感覺記憶）：視覺、聽覺、嗅嗅覺、觸覺、味覺等感官體驗
- procedural（動作記憶）：操作步驟、技能、習慣、動作序列
- episodic（情節記憶）：特定事件、人物、地點、時間、經歷
- semantic（語義記憶）：概念、知識、事實、規則

返回 JSON 格式：
{
  "primary": "主要區域（sensory/procedural/episodic/semantic）",
  "secondary": ["次要區域"],
  "confidence": 0.0-1.0,
  "reasoning": "分類理由"
}`;

    const detectedFeatures = this._formatFeaturesForLLM(features);
    const userPrompt = `分析以下內容的記憶類型：

內容："${content.slice(0, 500)}"

已檢測到的特徵：
${detectedFeatures}

請返回 JSON 格式的分類結果。`;

    let response;

    if (provider === 'openai' || provider === 'custom') {
      const endpoint = provider === 'openai' 
        ? 'https://api.openai.com/v1/chat/completions' 
        : url;

      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: model || 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
          max_tokens: 300
        })
      });

      if (!response.ok) {
        throw new Error(`API 錯誤: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      return this._parseLLMResponse(content);
    }

    throw new Error(`不支持的 API 提供者: ${provider}`);
  }

  _formatFeaturesForLLM(features) {
    const parts = [];

    for (const [region, categories] of Object.entries(features)) {
      const matches = [];
      for (const [category, items] of Object.entries(categories)) {
        if (items.length > 0) {
          matches.push(`${category}: ${items.join(', ')}`);
        }
      }
      if (matches.length > 0) {
        parts.push(`${region}: ${matches.join('; ')}`);
      }
    }

    return parts.length > 0 ? parts.join('\n') : '無明顯特徵';
  }

  _parseLLMResponse(content) {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const validRegions = ['sensory', 'procedural', 'episodic', 'semantic'];

        return {
          primary: validRegions.includes(parsed.primary) ? parsed.primary : 'episodic',
          secondary: Array.isArray(parsed.secondary) 
            ? parsed.secondary.filter(r => validRegions.includes(r))
            : [],
          confidence: Math.max(0, Math.min(1, parsed.confidence || 0.7)),
          reasoning: parsed.reasoning || ''
        };
      }
    } catch (e) {
      console.warn('[MemoryClassifier] 解析 LLM 回應失敗:', e);
    }

    return {
      primary: 'episodic',
      secondary: [],
      confidence: 0.5,
      reasoning: 'LLM 解析失敗，使用預設值'
    };
  }

  _mergeResults(ruleResult, llmResult) {
    if (llmResult.confidence > ruleResult.confidence) {
      return {
        ...llmResult,
        distribution: ruleResult.distribution
      };
    }

    return {
      primary: ruleResult.primary,
      secondary: [...new Set([...ruleResult.secondary, ...llmResult.secondary])].slice(0, 2),
      confidence: (ruleResult.confidence + llmResult.confidence) / 2,
      reasoning: `${ruleResult.reasoning}（LLM 確認）`,
      distribution: ruleResult.distribution
    };
  }

  setApiConfig(config) {
    this.apiConfig = config;
    console.log('[MemoryClassifier] API 配置已更新');
  }
}

if (typeof window !== 'undefined') {
  window.MemoryClassifier = MemoryClassifier;
}
