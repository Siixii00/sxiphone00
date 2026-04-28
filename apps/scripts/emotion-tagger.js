const EMOTION_DICT = {
  positive: {
    highArousal: ['興奮', '激動', '開心', '快樂', '喜悅', '歡喜', '興奮', '激動', '興高采烈', '欣喜若狂', 'exited', 'thrilled', 'ecstatic', 'elated', 'excited', 'happy', 'joyful', 'delighted'],
    lowArousal: ['平靜', '安詳', '滿足', '幸福', '舒適', '放鬆', '安心', '溫馨', '甜蜜', '愉快', 'calm', 'peaceful', 'content', 'satisfied', 'relaxed', 'serene']
  },
  negative: {
    highArousal: ['憤怒', '生氣', '焦慮', '緊張', '恐懼', '害怕', '驚恐', '恐慌', '激動', '憤慨', 'angry', 'furious', 'anxious', 'nervous', 'scared', 'terrified', 'panicked'],
    lowArousal: ['難過', '悲傷', '沮喪', '失落', '憂鬱', '無聊', '疲倦', '疲憊', '空虛', '孤獨', 'sad', 'depressed', 'lonely', 'bored', 'tired', 'exhausted', 'melancholy']
  },
  neutral: {
    words: ['正常', '普通', '一般', '平常', '例行', '日常', 'normal', 'regular', 'ordinary', 'routine']
  },
  modifiers: {
    intensifiers: ['非常', '很', '極其', '超級', '特別', '十分', '相當', '非常', 'really', 'very', 'extremely', 'super', 'so'],
    diminishers: ['有點', '稍微', '一些', '一點', '略', 'kind of', 'a bit', 'slightly', 'somewhat']
  }
};

class EmotionTagger {
  constructor(options = {}) {
    this.dict = EMOTION_DICT;
    this.apiConfig = {
      enabled: options.apiEnabled || false,
      provider: options.apiProvider || null,
      url: options.apiUrl || '',
      key: options.apiKey || '',
      model: options.apiModel || ''
    };
    this.localFirst = options.localFirst !== false;
    this.cache = new Map();
  }

  analyze(text) {
    if (!text || typeof text !== 'string') {
      return { valence: 0.5, arousal: 0.5, confidence: 0 };
    }

    const cacheKey = this._hashText(text);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const result = this._analyzeWithDict(text);
    this.cache.set(cacheKey, result);
    return result;
  }

  _analyzeWithDict(text) {
    const lowerText = text.toLowerCase();
    const words = this._tokenize(text);

    let positiveCount = 0;
    let negativeCount = 0;
    let highArousalCount = 0;
    let lowArousalCount = 0;
    let totalEmotionalWords = 0;

    const positiveHigh = this.dict.positive.highArousal;
    const positiveLow = this.dict.positive.lowArousal;
    const negativeHigh = this.dict.negative.highArousal;
    const negativeLow = this.dict.negative.lowArousal;

    let intensifierMultiplier = 1;

    for (const word of words) {
      const lowerWord = word.toLowerCase();

      if (this.dict.modifiers.intensifiers.some(i => lowerText.includes(i))) {
        intensifierMultiplier = 1.3;
      }
      if (this.dict.modifiers.diminishers.some(d => lowerText.includes(d))) {
        intensifierMultiplier = 0.7;
      }

      if (positiveHigh.some(w => lowerWord.includes(w) || lowerText.includes(w))) {
        positiveCount += 1.5 * intensifierMultiplier;
        highArousalCount += 1.5 * intensifierMultiplier;
        totalEmotionalWords++;
      } else if (positiveLow.some(w => lowerWord.includes(w) || lowerText.includes(w))) {
        positiveCount += 1 * intensifierMultiplier;
        lowArousalCount += 1 * intensifierMultiplier;
        totalEmotionalWords++;
      } else if (negativeHigh.some(w => lowerWord.includes(w) || lowerText.includes(w))) {
        negativeCount += 1.5 * intensifierMultiplier;
        highArousalCount += 1.5 * intensifierMultiplier;
        totalEmotionalWords++;
      } else if (negativeLow.some(w => lowerWord.includes(w) || lowerText.includes(w))) {
        negativeCount += 1 * intensifierMultiplier;
        lowArousalCount += 1 * intensifierMultiplier;
        totalEmotionalWords++;
      }
    }

    const totalSentiment = positiveCount + negativeCount;
    const totalArousal = highArousalCount + lowArousalCount;

    let valence = 0.5;
    let arousal = 0.5;
    let confidence = 0;

    if (totalSentiment > 0) {
      valence = positiveCount / totalSentiment;
      confidence = Math.min(totalSentiment / 5, 1);
    }

    if (totalArousal > 0) {
      arousal = highArousalCount / totalArousal;
    }

    const punctuationBoost = this._analyzePunctuation(text);
    arousal = Math.min(arousal + punctuationBoost, 1);

    const emojiBoost = this._analyzeEmojis(text);
    if (emojiBoost.valence !== 0) {
      valence = (valence + emojiBoost.valence + 1) / 2;
      confidence = Math.max(confidence, 0.3);
    }
    if (emojiBoost.arousal !== 0) {
      arousal = (arousal + emojiBoost.arousal + 1) / 2;
    }

    return {
      valence: Math.max(0, Math.min(1, valence)),
      arousal: Math.max(0, Math.min(1, arousal)),
      confidence,
      method: 'dict',
      wordCount: totalEmotionalWords
    };
  }

  _tokenize(text) {
    const chinese = text.match(/[\u4e00-\u9fa5]+/g) || [];
    const english = text.match(/[a-zA-Z]+/g) || [];
    return [...chinese.join('').split(''), ...english];
  }

  _analyzePunctuation(text) {
    let boost = 0;
    const exclamations = (text.match(/[!！]{1,}/g) || []).length;
    const questions = (text.match(/[?？]{1,}/g) || []).length;
    const caps = (text.match(/[A-Z]{2,}/g) || []).length;

    boost += exclamations * 0.05;
    boost += questions * 0.03;
    boost += caps * 0.02;

    return Math.min(boost, 0.3);
  }

  _analyzeEmojis(text) {
    const result = { valence: 0, arousal: 0 };

    const positiveEmojis = ['😊', '😄', '😁', '😆', '🥰', '😍', '🤩', '😊', '🙂', '😋', '🤗', '💕', '❤️', '💖', '✨', '🎉', '👍', '👏'];
    const negativeEmojis = ['😢', '😭', '😤', '😠', '😡', '🤬', '😰', '😨', '😱', '😞', '😔', '💔', '👎'];
    const highArousalEmojis = ['😱', '🤩', '😆', '🔥', '💥', '⚡', '🎉', '🎊'];

    for (const emoji of positiveEmojis) {
      if (text.includes(emoji)) {
        result.valence += 0.3;
        break;
      }
    }

    for (const emoji of negativeEmojis) {
      if (text.includes(emoji)) {
        result.valence -= 0.3;
        break;
      }
    }

    for (const emoji of highArousalEmojis) {
      if (text.includes(emoji)) {
        result.arousal += 0.3;
        break;
      }
    }

    return result;
  }

  async analyzeWithLLM(text, options = {}) {
    if (!this.apiConfig.enabled || !this.apiConfig.provider) {
      console.warn('[EmotionTagger] API 未啟用，使用本地分析');
      return this.analyze(text);
    }

    try {
      const result = await this._callLLMForEmotion(text, options);
      return {
        valence: result.valence,
        arousal: result.arousal,
        confidence: result.confidence || 0.8,
        method: 'llm',
        reasoning: result.reasoning
      };
    } catch (error) {
      console.error('[EmotionTagger] LLM 分析失敗:', error);
      return this.analyze(text);
    }
  }

  async _callLLMForEmotion(text, options = {}) {
    const { provider, url, key, model } = this.apiConfig;

    const systemPrompt = `你是一個情感分析專家。請分析給定文本的情感坐標。
返回 JSON 格式：
{
  "valence": 0.0-1.0 (效價：0=負面，1=正面),
  "arousal": 0.0-1.0 (喚醒度：0=平靜，1=激動),
  "confidence": 0.0-1.0,
  "reasoning": "簡短說明"
}`;

    const userPrompt = `分析以下文本的情感：
"${text.slice(0, 500)}"

請返回 JSON 格式的情感分析結果。`;

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
          max_tokens: 200
        })
      });

      if (!response.ok) {
        throw new Error(`API 錯誤: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      return this._parseLLMResponse(content);
    }

    if (provider === 'gemini') {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-pro'}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API 錯誤: ${response.status}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return this._parseLLMResponse(content);
    }

    throw new Error(`不支持的 API 提供者: ${provider}`);
  }

  _parseLLMResponse(content) {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          valence: Math.max(0, Math.min(1, parsed.valence || 0.5)),
          arousal: Math.max(0, Math.min(1, parsed.arousal || 0.5)),
          confidence: parsed.confidence || 0.8,
          reasoning: parsed.reasoning || ''
        };
      }
    } catch (e) {
      console.warn('[EmotionTagger] 解析 LLM 回應失敗:', e);
    }

    return { valence: 0.5, arousal: 0.5, confidence: 0.5 };
  }

  async analyzeAuto(text, options = {}) {
    if (this.localFirst) {
      const localResult = this.analyze(text);
      if (localResult.confidence >= 0.5) {
        return localResult;
      }
    }

    if (this.apiConfig.enabled) {
      return await this.analyzeWithLLM(text, options);
    }

    return this.analyze(text);
  }

  _hashText(text) {
    let hash = 5381;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) + hash) + text.charCodeAt(i);
    }
    return `emo_${Math.abs(hash).toString(36)}`;
  }

  setApiConfig(config) {
    this.apiConfig = {
      enabled: config.enabled || false,
      provider: config.provider || null,
      url: config.url || '',
      key: config.key || '',
      model: config.model || ''
    };
    console.log('[EmotionTagger] API 配置已更新');
  }

  clearCache() {
    this.cache.clear();
    console.log('[EmotionTagger] 緩存已清除');
  }

  getEmotionLabel(valence, arousal) {
    if (valence > 0.6 && arousal > 0.6) return '興奮/喜悅';
    if (valence > 0.6 && arousal <= 0.6) return '滿足/平靜';
    if (valence <= 0.4 && arousal > 0.6) return '憤怒/焦慮';
    if (valence <= 0.4 && arousal <= 0.6) return '悲傷/疲憊';
    return '中性';
  }
}

if (typeof window !== 'undefined') {
  window.EmotionTagger = EmotionTagger;
  window.EMOTION_DICT = EMOTION_DICT;
}
