const SxSocialAI = {
  getWorldbookData() {
    const categories = ['cot', 'style', 'global', 'keywords', 'backend', 'theater'];
    const result = {};
    categories.forEach(cat => {
      const key = `sx_worldbook_${cat}`;
      const raw = localStorage.getItem(key);
      if (!raw) return;
      try {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          result[cat] = list;
        }
      } catch (e) {}
    });
    return result;
  },

  getWorldbookContext() {
    const data = this.getWorldbookData();
    const entries = [];
    for (const [cat, list] of Object.entries(data)) {
      if (list && list.length > 0) {
        list.slice(0, 5).forEach(e => {
          if (e.title && e.content) {
            entries.push(`【${e.title}】${e.content.slice(0, 200)}`);
          }
        });
      }
    }
    return entries.length > 0 ? entries.join('\n') : '無世界書設定';
  },

  getCharacterData(name) {
    if (!name) return null;
    const raw = localStorage.getItem('sx_characters');
    if (!raw) return null;
    try {
      const list = JSON.parse(raw);
      return list.find(c => c.name === name) || null;
    } catch {
      return null;
    }
  },

  getActiveCharacter() {
    const activeName = localStorage.getItem('sx_char_name') || localStorage.getItem('sx_active_char');
    return this.getCharacterData(activeName);
  },

  getAllCharacters() {
    const raw = localStorage.getItem('sx_characters');
    if (!raw) return [];
    try {
      return JSON.parse(raw) || [];
    } catch {
      return [];
    }
  },

  getUserData() {
    return {
      name: localStorage.getItem('sx_user_name') || 'User',
      avatar: localStorage.getItem('sx_user_avatar') || '',
      personality: localStorage.getItem('sx_user_personality') || '',
      background: localStorage.getItem('sx_user_background') || ''
    };
  },

  getChatHistory(limit = 20) {
    const raw = localStorage.getItem('sx_chat_history');
    if (!raw) return [];
    try {
      const history = JSON.parse(raw);
      return history.slice(-limit);
    } catch {
      return [];
    }
  },

  getChatHistoryContext() {
    const history = this.getChatHistory(15);
    if (history.length === 0) return '無聊天記錄';
    const user = this.getUserData();
    return history.map(msg => {
      const role = msg.role === 'user' ? user.name : '角色';
      return `${role}: ${msg.content.slice(0, 100)}`;
    }).join('\n');
  },

  getApiConfig() {
    const raw = localStorage.getItem('api_configs');
    if (!raw) return null;
    try {
      const configs = JSON.parse(raw);
      const activeIndex = Number(localStorage.getItem('sx_active_api') || 0);
      return configs[activeIndex] || configs[0] || null;
    } catch {
      return null;
    }
  },

  async callAPI(messages, temperature = 0.85) {
    const config = this.getApiConfig();
    if (!config || !config.url) {
      throw new Error('尚未設定 API，請至設定頁面配置');
    }

    const endpoint = config.url.endsWith('/chat/completions')
      ? config.url
      : `${config.url.replace(/\/$/, '')}/chat/completions`;

    const headers = { 'Content-Type': 'application/json' };
    if (config.key) {
      headers.Authorization = `Bearer ${config.key}`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.model || 'gpt-3.5-turbo',
        messages,
        temperature
      })
    });

    if (!response.ok) {
      throw new Error(`API 錯誤 (${response.status})`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  },

  buildSocialContext(options = {}) {
    const { includeChat = true, charName = null } = options;
    
    const user = this.getUserData();
    const char = charName ? this.getCharacterData(charName) : this.getActiveCharacter();
    const worldbook = this.getWorldbookContext();
    const chatHistory = includeChat ? this.getChatHistoryContext() : '';

    let context = `# 使用者設定\n名稱: ${user.name}\n`;
    if (user.personality) context += `性格: ${user.personality}\n`;
    if (user.background) context += `背景: ${user.background}\n`;

    if (char) {
      context += `\n# 角色設定\n名稱: ${char.name}\n`;
      if (char.personality) context += `性格: ${char.personality}\n`;
      if (char.background) context += `背景: ${char.background}\n`;
    }

    context += `\n# 世界書\n${worldbook}\n`;

    if (includeChat && chatHistory !== '無聊天記錄') {
      context += `\n# 近期對話\n${chatHistory}\n`;
    }

    return context;
  },

  async generateContent(prompt, systemPrompt, options = {}) {
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ];
    return await this.callAPI(messages, options.temperature || 0.85);
  },

  async generateSocialPost(platform, options = {}) {
    const context = this.buildSocialContext(options);
    const lang = localStorage.getItem('sxiphone_lang') || 'zh-TW';

    const systemPrompt = `你是一位專業的社群媒體內容創作者，擅長根據角色設定和使用者背景創作符合人物性格的貼文。
請使用 ${window.getAIReadableLangName?.(lang) || '繁體中文'} 撰寫。
輸出格式為 JSON: {"posts": [{"content": "貼文內容", "likes": 隨機讚數}]}`;

    const prompt = `${context}

請為 ${platform} 平台生成 ${options.count || 3} 則貼文。
要求：
1. 符合角色性格和使用者設定
2. 自然融入世界書設定
3. 每則貼文 30-100 字
4. 語氣自然、有互動感

請輸出 JSON 格式。`;

    try {
      const result = await this.generateContent(prompt, systemPrompt);
      let parsed = null;
      try {
        parsed = JSON.parse(result);
      } catch {
        const match = result.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
      }
      return Array.isArray(parsed?.posts) ? parsed.posts : [];
    } catch (err) {
      console.error('生成失敗:', err);
      throw err;
    }
  },

  async generateComment(platform, postContent, options = {}) {
    const context = this.buildSocialContext(options);
    const lang = localStorage.getItem('sxiphone_lang') || 'zh-TW';

    const systemPrompt = `你是一位社群媒體使用者，會根據角色設定和使用者背景發表評論。
請使用 ${window.getAIReadableLangName?.(lang) || '繁體中文'} 撰寫。
輸出格式為 JSON: {"comments": [{"content": "評論內容"}]}`;

    const prompt = `${context}

平台: ${platform}
貼文內容: ${postContent}

請生成 1-3 則評論，符合角色性格。
輸出 JSON 格式。`;

    try {
      const result = await this.generateContent(prompt, systemPrompt);
      let parsed = null;
      try {
        parsed = JSON.parse(result);
      } catch {
        const match = result.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
      }
      return Array.isArray(parsed?.comments) ? parsed.comments : [];
    } catch (err) {
      console.error('生成評論失敗:', err);
      throw err;
    }
  }
};

if (typeof window !== 'undefined') {
  window.SxSocialAI = SxSocialAI;
}
