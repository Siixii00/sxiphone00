const EXPLORE_TRENDS_KEY = 'sx_twitter_explore_trends';
const EXPLORE_REGION_KEY = 'sx_twitter_explore_region';

function getRegion() {
  return localStorage.getItem('sxiphone_region') || '';
}

function getExploreRegion() {
  return localStorage.getItem(EXPLORE_REGION_KEY) || '';
}

function saveExploreRegion(region) {
  localStorage.setItem(EXPLORE_REGION_KEY, region);
}

function getExploreTrends() {
  const raw = localStorage.getItem(EXPLORE_TRENDS_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    return null;
  }
}

function saveExploreTrends(trends) {
  localStorage.setItem(EXPLORE_TRENDS_KEY, JSON.stringify(trends));
}

function getWorldbookData() {
  const categories = ['cot', 'style', 'global', 'keywords', 'backend'];
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
}

function getWorldbookContext() {
  const data = getWorldbookData();
  const entries = [];
  for (const [cat, list] of Object.entries(data)) {
    if (list && list.length > 0) {
      list.slice(0, 5).forEach(e => {
        if (e.enabled && e.title && e.content) {
          entries.push(`【${e.title}】${e.content.slice(0, 200)}`);
        }
      });
    }
  }
  return entries.length > 0 ? entries.join('\n') : '無世界書設定';
}

function getCharacterData(name) {
  if (!name) return null;
  const raw = localStorage.getItem('sx_characters');
  if (!raw) return null;
  try {
    const list = JSON.parse(raw);
    return list.find(c => c.name === name) || null;
  } catch {
    return null;
  }
}

function getActiveCharacter() {
  const activeName = localStorage.getItem('sx_char_name');
  return getCharacterData(activeName);
}

function getUserData() {
  return {
    name: localStorage.getItem('sx_user_name') || 'User',
    personality: localStorage.getItem('sx_user_personality') || '',
    background: localStorage.getItem('sx_user_background') || ''
  };
}

function getNpcList() {
  const raw = localStorage.getItem('sx_npc_list');
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getChatHistory(limit = 15) {
  const raw = localStorage.getItem('sx_chat_history');
  if (!raw) return [];
  try {
    const history = JSON.parse(raw);
    return history.slice(-limit);
  } catch {
    return [];
  }
}

function getChatHistoryContext() {
  const history = getChatHistory(15);
  if (history.length === 0) return '無聊天記錄';
  const user = getUserData();
  return history.map(msg => {
    const role = msg.role === 'user' ? user.name : '角色';
    return `${role}: ${msg.content.slice(0, 100)}`;
  }).join('\n');
}

function getWorldviewSetting() {
  return localStorage.getItem('sx_twitter_worldview') || '';
}

function getApiConfig() {
  const raw = localStorage.getItem('api_configs');
  if (!raw) return null;
  try {
    const configs = JSON.parse(raw);
    const activeIndex = Number(localStorage.getItem('sx_active_api') || 0);
    return configs[activeIndex] || configs[0] || null;
  } catch {
    return null;
  }
}

async function callAIAPI(messages, temperature = 0.85) {
  const config = getApiConfig();
  if (!config || !config.url) {
    throw new Error('尚未設定 API');
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
}

function buildExploreContext() {
  const user = getUserData();
  const char = getActiveCharacter();
  const worldbook = getWorldbookContext();
  const chatHistory = getChatHistoryContext();
  const worldview = getWorldviewSetting();
  const region = getRegion();
  const npcList = getNpcList();

  let context = `# 使用者設定\n名稱: ${user.name}\n`;
  if (user.personality) context += `性格: ${user.personality}\n`;
  if (user.background) context += `背景: ${user.background}\n`;
  if (region) context += `所在地區: ${region}\n`;

  if (char) {
    context += `\n# 角色設定\n名稱: ${char.name}\n`;
    if (char.personality) context += `性格: ${char.personality}\n`;
    if (char.background) context += `背景: ${char.background}\n`;
  }

  context += `\n# 世界書\n${worldbook}\n`;

  if (worldview) {
    context += `\n# 世界觀設定\n${worldview}\n`;
  }

  if (npcList.length > 0) {
    context += `\n# NPC 列表\n${npcList.map(n => n.name).join('、')}\n`;
  }

  if (chatHistory !== '無聊天記錄') {
    context += `\n# 近期對話\n${chatHistory}\n`;
  }

  return context;
}

let isGeneratingTrends = false;

async function generateExploreTrends() {
  if (isGeneratingTrends) return;
  
  isGeneratingTrends = true;
  const container = document.getElementById('trending-topics');
  if (container) {
    container.innerHTML = '<div class="loading-state">正在生成推薦內容...</div>';
  }

  try {
    const context = buildExploreContext();
    const region = getRegion();
    const lang = localStorage.getItem('sxiphone_lang') || 'zh-TW';

    const systemPrompt = `你是一位專業的社群媒體趨勢分析師，擅長根據使用者興趣、地區和背景生成個人化的趨勢話題。
請使用 ${window.getAIReadableLangName?.(lang) || '繁體中文'} 撰寫。
輸出格式為 JSON: {"region": "地區名稱", "trends": [{"category": "分類", "title": "話題標題", "hashtag": "#標籤", "tweets": 推文數, "description": "簡短描述"}]}`;

    const prompt = `${context}

請根據以上資訊，生成使用者可能會感興趣的 5-8 個趨勢話題。
${region ? `使用者所在地區為「${region}」，請優先推薦與該地區相關的話題。` : '請推薦全球性的熱門話題。'}

要求：
1. 話題要與使用者的性格、背景、興趣相關
2. 融入世界書和世界觀設定
3. 包含不同類型：新聞、娛樂、生活、科技等
4. 每個話題要有吸引人的標題和標籤
5. 推文數要合理（幾千到幾十萬）

輸出 JSON 格式。`;

    const result = await callAIAPI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ]);

    let parsed = null;
    try {
      parsed = JSON.parse(result);
    } catch {
      const match = result.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }

    if (parsed && parsed.trends && Array.isArray(parsed.trends)) {
      saveExploreTrends(parsed);
      if (parsed.region) {
        saveExploreRegion(parsed.region);
      }
      renderTrends(parsed);
    } else {
      throw new Error('解析失敗');
    }
  } catch (err) {
    console.error('生成趨勢失敗:', err);
    if (container) {
      container.innerHTML = `<div class="error-state">生成失敗，請稍後重試<br><button class="primary-btn" onclick="generateExploreTrends()">重試</button></div>`;
    }
  } finally {
    isGeneratingTrends = false;
  }
}

function renderTrends(data) {
  const container = document.getElementById('trending-topics');
  if (!container) return;

  const region = data.region || getRegion() || '全球';
  const trends = data.trends || [];

  if (trends.length === 0) {
    container.innerHTML = '<div class="empty-state">尚無趨勢話題</div>';
    return;
  }

  let html = `<section class="card">
    <div class="tweet-header">
      <div>
        <span class="tweet-author">${region}的趨勢</span>
      </div>
    </div>
  </section>`;

  trends.forEach((trend, index) => {
    const tweets = trend.tweets || Math.floor(Math.random() * 50000) + 1000;
    const tweetsStr = tweets >= 10000 ? `${(tweets / 10000).toFixed(1)}萬` : tweets.toLocaleString();
    
    html += `<section class="card trend-card" data-index="${index}">
      <div class="tweet-header">
        <div>
          <span class="trend-category">${trend.category || '趨勢'}</span>
          <span class="trend-rank">第 ${index + 1} 名</span>
        </div>
      </div>
      <div class="trend-title">${trend.title || trend.hashtag || '熱門話題'}</div>
      ${trend.hashtag ? `<div class="trend-hashtag">${trend.hashtag}</div>` : ''}
      ${trend.description ? `<div class="trend-desc">${trend.description}</div>` : ''}
      <div class="trend-stats">${tweetsStr} 推文</div>
    </section>`;
  });

  html += `<button class="refresh-btn" onclick="generateExploreTrends()">
    <i class="fas fa-rotate"></i> 重新生成
  </button>`;

  container.innerHTML = html;
}

function loadCachedTrends() {
  const cached = getExploreTrends();
  if (cached && cached.trends && cached.trends.length > 0) {
    renderTrends(cached);
    return true;
  }
  return false;
}

function initExplore() {
  if (!loadCachedTrends()) {
    generateExploreTrends();
  }
}

document.addEventListener('DOMContentLoaded', initExplore);
