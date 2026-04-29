class DimensionEncoder {
  constructor(options = {}) {
    this.emotionTagger = options.emotionTagger || null;
    this.config = {
      autoEmotion: options.autoEmotion !== false
    };

    this.timeKeywords = {
      morning: ['早上', '早晨', '上午', 'morning'],
      noon: ['中午', '正午', 'noon'],
      afternoon: ['下午', '午後', 'afternoon'],
      evening: ['傍晚', '黃昏', 'evening'],
      night: ['晚上', '夜晚', '夜間', 'night'],
      lateNight: ['深夜', '凌晨', 'midnight', 'late night']
    };

    this.seasonKeywords = {
      spring: ['春天', '春季', 'spring'],
      summer: ['夏天', '夏季', 'summer'],
      autumn: ['秋天', '秋季', 'autumn', 'fall'],
      winter: ['冬天', '冬季', 'winter']
    };

    this.domainKeywords = {
      work: ['工作', '公司', '會議', '專案', '報告', 'office', 'work', 'meeting', 'project', 'report'],
      life: ['生活', '日常', '家', '家人', '朋友', 'life', 'home', 'family', 'friend'],
      learning: ['學習', '讀書', '課程', '知識', 'learn', 'study', 'course', 'knowledge'],
      entertainment: ['娛樂', '遊戲', '電影', '音樂', 'entertainment', 'game', 'movie', 'music'],
      health: ['健康', '運動', '醫院', '健身', 'health', 'exercise', 'hospital', 'fitness']
    };

    this.locationPatterns = [
      { pattern: /在(.{2,10})[，。、]/g, type: 'extracted' },
      { pattern: /去(.{2,10})[，。、]/g, type: 'extracted' },
      { pattern: /到(.{2,10})[，。、]/g, type: 'extracted' }
    ];
  }

  async encode(content, options = {}) {
    if (!content || typeof content !== 'string') {
      return this._defaultDimensions();
    }

    const timestamp = options.timestamp || new Date().toISOString();

    const temporal = this._encodeTemporal(content, timestamp);
    const spatial = this._encodeSpatial(content, options);
    const emotional = await this._encodeEmotional(content, options);

    return {
      temporal,
      spatial,
      emotional
    };
  }

  _encodeTemporal(content, timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    const absolute = {
      timestamp,
      date: date.toISOString().split('T')[0],
      time: date.toTimeString().slice(0, 5),
      weekday: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()],
      weekdayZh: ['週日', '週一', '週二', '週三', '週四', '週五', '週六'][date.getDay()]
    };

    const relative = {
      fromNow: this._formatFromNow(diffMins, diffHours, diffDays),
      timeOfDay: this._detectTimeOfDay(content, date),
      season: this._detectSeason(content, date),
      period: this._detectPeriod(date)
    };

    return {
      absolute,
      relative,
      sequence: {
        before: [],
        after: [],
        concurrent: []
      }
    };
  }

  _formatFromNow(mins, hours, days) {
    if (mins < 1) return '剛剛';
    if (mins < 60) return `${mins} 分鐘前`;
    if (hours < 24) return `${hours} 小時前`;
    if (days < 7) return `${days} 天前`;
    if (days < 30) return `${Math.floor(days / 7)} 週前`;
    if (days < 365) return `${Math.floor(days / 30)} 個月前`;
    return `${Math.floor(days / 365)} 年前`;
  }

  _detectTimeOfDay(content, date) {
    const lowerContent = content.toLowerCase();

    for (const [period, keywords] of Object.entries(this.timeKeywords)) {
      for (const keyword of keywords) {
        if (lowerContent.includes(keyword.toLowerCase())) {
          return period;
        }
      }
    }

    const hour = date.getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 14) return 'noon';
    if (hour >= 14 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 21) return 'evening';
    if (hour >= 21 || hour < 2) return 'night';
    return 'lateNight';
  }

  _detectSeason(content, date) {
    const lowerContent = content.toLowerCase();

    for (const [season, keywords] of Object.entries(this.seasonKeywords)) {
      for (const keyword of keywords) {
        if (lowerContent.includes(keyword.toLowerCase())) {
          return season;
        }
      }
    }

    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  _detectPeriod(date) {
    const hour = date.getHours();
    const day = date.getDay();

    if (day === 0 || day === 6) return 'leisure';

    if (hour >= 9 && hour < 18) return 'working_hours';
    if (hour >= 6 && hour < 9) return 'morning_routine';
    if (hour >= 18 && hour < 22) return 'evening_leisure';
    return 'rest_time';
  }

  _encodeSpatial(content, options) {
    const physical = this._detectPhysicalSpace(content, options);
    const contextual = this._detectContextualSpace(content, options);
    const abstract = this._detectAbstractSpace(content, options);

    return {
      physical,
      contextual,
      abstract
    };
  }

  _detectPhysicalSpace(content, options) {
    const result = {
      location: options.location || null,
      coordinates: options.coordinates || null,
      environment: 'unknown',
      setting: 'unknown'
    };

    const locationKeywords = {
      indoor: ['家裡', '辦公室', '公司', '餐廳', '咖啡館', '學校', '教室', '室內', 'indoor', 'office', 'home', 'restaurant', 'cafe'],
      outdoor: ['公園', '街道', '戶外', '山上', '海邊', '室外', 'outdoor', 'park', 'street', 'beach', 'mountain'],
      virtual: ['線上', '網路', '虛擬', '視訊', 'online', 'virtual', 'video call', 'zoom']
    };

    const lowerContent = content.toLowerCase();
    for (const [env, keywords] of Object.entries(locationKeywords)) {
      for (const keyword of keywords) {
        if (lowerContent.includes(keyword.toLowerCase())) {
          result.environment = env;
          break;
        }
      }
      if (result.environment !== 'unknown') break;
    }

    const extractedLocations = [];
    for (const { pattern } of this.locationPatterns) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      while ((match = regex.exec(content)) !== null) {
        if (match[1] && match[1].length >= 2 && match[1].length <= 10) {
          extractedLocations.push(match[1].trim());
        }
      }
    }

    if (extractedLocations.length > 0 && !result.location) {
      result.location = extractedLocations[0];
    }

    const settingKeywords = {
      home: ['家', '房間', '客廳', 'home', 'room', 'living room'],
      office: ['辦公室', '會議室', '公司', 'office', 'meeting room'],
      cafe: ['咖啡館', '咖啡廳', 'cafe', 'coffee shop'],
      restaurant: ['餐廳', '飯店', 'restaurant'],
      school: ['學校', '教室', '圖書館', 'school', 'classroom', 'library'],
      park: ['公園', '綠地', 'park'],
      transport: ['捷運', '公車', '火車', '飛機', 'subway', 'bus', 'train', 'plane']
    };

    for (const [setting, keywords] of Object.entries(settingKeywords)) {
      for (const keyword of keywords) {
        if (lowerContent.includes(keyword.toLowerCase())) {
          result.setting = setting;
          break;
        }
      }
      if (result.setting !== 'unknown') break;
    }

    return result;
  }

  _detectContextualSpace(content, options) {
    const result = {
      domain: options.domain || 'unknown',
      platform: options.platform || 'unknown',
      context: 'general'
    };

    const lowerContent = content.toLowerCase();

    for (const [domain, keywords] of Object.entries(this.domainKeywords)) {
      for (const keyword of keywords) {
        if (lowerContent.includes(keyword.toLowerCase())) {
          result.domain = domain;
          break;
        }
      }
      if (result.domain !== 'unknown') break;
    }

    const platformKeywords = {
      chat_app: ['聊天', '訊息', 'chat', 'message'],
      social_media: ['貼文', '分享', 'post', 'share'],
      email: ['郵件', '信件', 'email', 'mail'],
      video_call: ['視訊', '會議', 'video', 'call', 'zoom', 'meet']
    };

    for (const [platform, keywords] of Object.entries(platformKeywords)) {
      for (const keyword of keywords) {
        if (lowerContent.includes(keyword.toLowerCase())) {
          result.platform = platform;
          break;
        }
      }
      if (result.platform !== 'unknown') break;
    }

    const contextKeywords = {
      meeting_discussion: ['會議', '討論', 'meeting', 'discussion'],
      casual_chat: ['閒聊', '聊天', 'casual', 'chat'],
      problem_solving: ['問題', '解決', 'problem', 'solve', 'fix'],
      planning: ['計劃', '規劃', 'plan', 'schedule'],
      learning_session: ['學習', '課程', 'learn', 'course', 'lesson']
    };

    for (const [context, keywords] of Object.entries(contextKeywords)) {
      for (const keyword of keywords) {
        if (lowerContent.includes(keyword.toLowerCase())) {
          result.context = context;
          break;
        }
      }
      if (result.context !== 'general') break;
    }

    return result;
  }

  _detectAbstractSpace(content, options) {
    const result = {
      topic: options.topic || null,
      category: options.category || 'general',
      scope: options.scope || 'personal'
    };

    const lowerContent = content.toLowerCase();

    const categoryKeywords = {
      technology: ['程式', '科技', '技術', '軟體', 'programming', 'tech', 'software', 'code'],
      business: ['商業', '生意', '投資', 'business', 'investment'],
      relationship: ['關係', '感情', '愛情', '友情', 'relationship', 'love', 'friendship'],
      health: ['健康', '運動', '飲食', 'health', 'exercise', 'diet'],
      finance: ['金錢', '財務', '理財', 'money', 'finance', 'budget'],
      travel: ['旅行', '旅遊', '出行', 'travel', 'trip'],
      food: ['美食', '料理', '餐廳', 'food', 'cooking', 'restaurant']
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (lowerContent.includes(keyword.toLowerCase())) {
          result.category = category;
          break;
        }
      }
      if (result.category !== 'general') break;
    }

    const scopeKeywords = {
      personal: ['我', '自己', '個人', 'i', 'my', 'personal', 'myself'],
      team: ['我們', '團隊', '小組', 'we', 'team', 'group'],
      public: ['大家', '公開', '公眾', 'everyone', 'public']
    };

    for (const [scope, keywords] of Object.entries(scopeKeywords)) {
      for (const keyword of keywords) {
        if (lowerContent.includes(keyword.toLowerCase())) {
          result.scope = scope;
          break;
        }
      }
      if (result.scope !== 'personal') break;
    }

    return result;
  }

  async _encodeEmotional(content, options) {
    const basic = {
      valence: options.emotion?.valence || 0.5,
      arousal: options.emotion?.arousal || 0.5
    };

    if (this.config.autoEmotion && this.emotionTagger && !options.emotion) {
      try {
        const emotionResult = await this.emotionTagger.analyzeAuto(content);
        basic.valence = emotionResult.valence;
        basic.arousal = emotionResult.arousal;
      } catch (e) {
        console.warn('[DimensionEncoder] 情感分析失敗:', e);
      }
    }

    const nuanced = this._detectNuancedEmotion(content, basic);

    const context = this._detectEmotionalContext(content);

    return {
      basic,
      nuanced,
      context,
      associations: {
        relatedEmotions: [],
        sentimentTrend: 'stable',
        emotionalMemory: []
      }
    };
  }

  _detectNuancedEmotion(content, basic) {
    const emotionKeywords = {
      joy: ['開心', '快樂', '高興', '幸福', 'happy', 'joy', 'glad'],
      sadness: ['難過', '傷心', '悲傷', '沮喪', 'sad', 'sorrow', 'depressed'],
      anger: ['生氣', '憤怒', '火大', '惱怒', 'angry', 'mad', 'furious'],
      fear: ['害怕', '恐懼', '擔心', '焦慮', 'fear', 'scared', 'anxious'],
      surprise: ['驚訝', '意外', '震驚', 'surprised', 'shocked'],
      disgust: ['噁心', '厭惡', '討厭', 'disgust', 'dislike'],
      anticipation: ['期待', '盼望', '興奮', 'anticipation', 'excited'],
      trust: ['信任', '相信', '依賴', 'trust', 'believe'],
      love: ['愛', '喜歡', '愛慕', 'love', 'like', 'adore'],
      shame: ['羞愧', '尷尬', '不好意思', 'shame', 'embarrassed'],
      pride: ['驕傲', '自豪', '成就感', 'pride', 'proud'],
      gratitude: ['感謝', '感恩', '謝謝', 'gratitude', 'thankful', 'grateful']
    };

    const lowerContent = content.toLowerCase();
    const detected = [];

    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      for (const keyword of keywords) {
        if (lowerContent.includes(keyword.toLowerCase())) {
          detected.push(emotion);
          break;
        }
      }
    }

    const primary = detected.length > 0 ? detected[0] : 'neutral';
    const secondary = detected.slice(1, 3);

    const intensity = basic.arousal;

    return {
      primary,
      secondary,
      intensity,
      mixed: detected.length > 2
    };
  }

  _detectEmotionalContext(content) {
    const triggerKeywords = {
      good_news: ['好消息', '成功了', '達成', 'good news', 'success'],
      bad_news: ['壞消息', '失敗', '出問題', 'bad news', 'failed'],
      achievement: ['完成', '達成', '成就', 'achieved', 'accomplished'],
      conflict: ['爭吵', '衝突', '矛盾', 'conflict', 'argument'],
      social_interaction: ['見面', '聊天', '聚會', 'meeting', 'gathering'],
      personal_reflection: ['思考', '反省', '回顧', 'reflect', 'think']
    };

    const lowerContent = content.toLowerCase();
    let trigger = 'unknown';

    for (const [t, keywords] of Object.entries(triggerKeywords)) {
      for (const keyword of keywords) {
        if (lowerContent.includes(keyword.toLowerCase())) {
          trigger = t;
          break;
        }
      }
      if (trigger !== 'unknown') break;
    }

    return {
      trigger,
      target: null,
      expression: 'verbal'
    };
  }

  _defaultDimensions() {
    const now = new Date();

    return {
      temporal: {
        absolute: {
          timestamp: now.toISOString(),
          date: now.toISOString().split('T')[0],
          time: now.toTimeString().slice(0, 5),
          weekday: 'unknown',
          weekdayZh: '未知'
        },
        relative: {
          fromNow: '剛剛',
          timeOfDay: 'unknown',
          season: 'unknown',
          period: 'unknown'
        },
        sequence: {
          before: [],
          after: [],
          concurrent: []
        }
      },
      spatial: {
        physical: {
          location: null,
          coordinates: null,
          environment: 'unknown',
          setting: 'unknown'
        },
        contextual: {
          domain: 'unknown',
          platform: 'unknown',
          context: 'general'
        },
        abstract: {
          topic: null,
          category: 'general',
          scope: 'personal'
        }
      },
      emotional: {
        basic: {
          valence: 0.5,
          arousal: 0.5
        },
        nuanced: {
          primary: 'neutral',
          secondary: [],
          intensity: 0.5,
          mixed: false
        },
        context: {
          trigger: 'unknown',
          target: null,
          expression: 'verbal'
        },
        associations: {
          relatedEmotions: [],
          sentimentTrend: 'stable',
          emotionalMemory: []
        }
      }
    };
  }

  setEmotionTagger(tagger) {
    this.emotionTagger = tagger;
    console.log('[DimensionEncoder] EmotionTagger 已設置');
  }
}

if (typeof window !== 'undefined') {
  window.DimensionEncoder = DimensionEncoder;
}
