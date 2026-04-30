const KINASTRO_API_BASE = 'http://localhost:8000/api';

const SYSTEMS_CONFIG = {
  east: [
    { key: 'ziwei', label: '紫微斗數', endpoint: '/ziwei', desc: '14 主星、12 宮位、五行局', needsLunar: true, supportsDual: false },
    { key: 'chinese', label: '七政四餘', endpoint: '/chinese', desc: '七政 + 四餘、二十八宿、神煞', needsLunar: false, supportsDual: false },
    { key: 'cetian', label: '策天飛星', endpoint: '/cetian_ziwei', desc: '18 飛星、飛星四化', needsLunar: true, supportsDual: false },
    { key: 'wanhua', label: '萬化仙禽', endpoint: '/chinstar', desc: '28 宿禽星、12 宮', needsLunar: true, supportsDual: false },
    { key: 'vedic', label: '印度占星', endpoint: '/vedic', desc: 'Dasha、Ashtakavarga、Yogas', needsLunar: false, supportsDual: true },
    { key: 'jaimini', label: 'Jaimini', endpoint: '/jaimini', desc: 'Chara Karaka、Rashi Drishti', needsLunar: false, supportsDual: false },
    { key: 'nadi', label: '納迪', endpoint: '/nadi', desc: '三大脈輪、27 星宿', needsLunar: false, supportsDual: false },
    { key: 'sukkayodo', label: '宿曜道', endpoint: '/sukkayodo', desc: '28 宿、六曜', needsLunar: false, supportsDual: false }
  ],
  west: [
    { key: 'western', label: '西洋占星', endpoint: '/western', desc: '本命盤、過運、合盤、太陽回歸', needsLunar: false, supportsDual: true },
    { key: 'hellenistic', label: '希臘占星', endpoint: '/hellenistic', desc: 'Greek Lots、Profections', needsLunar: false, supportsDual: false },
    { key: 'kabbalah', label: '卡巴拉', endpoint: '/kabbalistic', desc: '生命之樹、希伯來字母', needsLunar: false, supportsDual: false },
    { key: 'arabic', label: '阿拉伯', endpoint: '/arabic', desc: '阿拉伯點、Picatrix', needsLunar: false, supportsDual: false },
    { key: 'yemeni', label: '也門', endpoint: '/yemeni', desc: '28 月宿、Firdaria', needsLunar: false, supportsDual: false },
    { key: 'maya', label: '瑪雅', endpoint: '/maya', desc: 'Tzolkin、Haab、Long Count', needsLunar: false, supportsDual: false },
    { key: 'aztec', label: '阿茲特克', endpoint: '/aztec', desc: 'Tonalpohualli', needsLunar: false, supportsDual: false },
    { key: 'decans', label: '古埃及', endpoint: '/decans', desc: '36 Decans', needsLunar: false, supportsDual: false },
    { key: 'babylonian', label: '巴比倫', endpoint: '/babylonian', desc: 'MUL.APIN 星表', needsLunar: false, supportsDual: false },
    { key: 'tibetan', label: '藏傳時輪', endpoint: '/tibetan', desc: 'Mewa、Parkha、五力', needsLunar: false, supportsDual: false }
  ]
};

const ALL_SYSTEMS = [...SYSTEMS_CONFIG.east, ...SYSTEMS_CONFIG.west];

function getSystemConfig(systemKey) {
  return ALL_SYSTEMS.find(s => s.key === systemKey) || null;
}

function buildKinastroPayload(params) {
  const { year, month, day, hour, minute, timezone, latitude, longitude, locationName, gender, isLunar, isLeap, chartType, personB } = params;
  
  const payload = {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour || 12),
    minute: Number(minute || 0),
    timezone: Number(timezone || 8.0),
    latitude: Number(latitude || 25.033),
    longitude: Number(longitude || 121.565),
    location_name: locationName || 'Taipei',
    gender: gender === 'M' ? 'male' : 'female'
  };

  if (isLunar !== undefined) {
    payload.is_lunar = Boolean(isLunar);
  }
  if (isLeap !== undefined) {
    payload.is_leap = Boolean(isLeap);
  }
  if (chartType) {
    payload.chart_type = chartType;
  }
  if (personB) {
    payload.person_b = {
      year: Number(personB.year),
      month: Number(personB.month),
      day: Number(personB.day),
      hour: Number(personB.hour || 12),
      minute: Number(personB.minute || 0),
      timezone: Number(personB.timezone || 8.0),
      latitude: Number(personB.latitude || 25.033),
      longitude: Number(personB.longitude || 121.565),
      location_name: personB.locationName || 'Taipei',
      gender: personB.gender === 'M' ? 'male' : 'female'
    };
  }

  return payload;
}

async function calculateSystem(systemKey, params) {
  const config = getSystemConfig(systemKey);
  if (!config) {
    return { ok: false, error: `Unknown system: ${systemKey}` };
  }

  const payload = buildKinastroPayload(params);
  const url = `${KINASTRO_API_BASE}${config.endpoint}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      return { ok: false, error: data?.error || `HTTP ${response.status}`, system: systemKey };
    }

    return { ok: true, data, system: systemKey };
  } catch (err) {
    return { ok: false, error: String(err?.message || err), system: systemKey };
  }
}

async function calculateAllSystems(params) {
  const results = {};
  const promises = ALL_SYSTEMS.map(async (sys) => {
    const result = await calculateSystem(sys.key, params);
    results[sys.key] = result;
    return result;
  });

  await Promise.all(promises);
  return results;
}

async function fetchSupportedSystems() {
  try {
    const response = await fetch(`${KINASTRO_API_BASE}/systems`);
    const data = await response.json();
    return data?.systems || ALL_SYSTEMS.map(s => s.key);
  } catch {
    return ALL_SYSTEMS.map(s => s.key);
  }
}

function getActiveApiConfig() {
  const apis = JSON.parse(localStorage.getItem('api_configs') || '[]');
  if (!Array.isArray(apis) || !apis.length) return null;
  const activeIndex = Number.parseInt(localStorage.getItem('sx_active_api') || '0', 10);
  const safeIndex = Number.isFinite(activeIndex) && activeIndex >= 0 ? activeIndex : 0;
  return apis[safeIndex] || apis[0] || null;
}

function buildChatCompletionsUrl(rawUrl = '') {
  if (!rawUrl) return '';
  if (rawUrl.endsWith('/chat/completions')) return rawUrl;
  return `${rawUrl.replace(/\/$/, '')}/chat/completions`;
}

async function analyzeWithAI({ systemKey, chartData, question = '' }) {
  const config = getActiveApiConfig();
  if (!config?.url) {
    return { ok: false, error: '未設定 AI API' };
  }

  const systemConfig = getSystemConfig(systemKey);
  const systemName = systemConfig?.label || systemKey;

  const targetUrl = buildChatCompletionsUrl(config.url);
  const prompt = [
    `你是${systemName}專業占星師。請根據以下命盤資料進行分析。`,
    question ? `使用者提問：${question}` : '',
    '命盤資料：',
    '```json',
    JSON.stringify(chartData, null, 2),
    '```',
    '請提供：1) 整體命盤特質 2) 重要宮位與星曜解讀 3) 近期運勢建議'
  ].filter(Boolean).join('\n');

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.key ? { Authorization: `Bearer ${config.key}` } : {})
      },
      body: JSON.stringify({
        model: config.model || 'gpt-4o-mini',
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;

    if (!response.ok) {
      return { ok: false, error: data?.error?.message || `HTTP ${response.status}` };
    }

    return { ok: true, analysis: text };
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
}

export {
  KINASTRO_API_BASE,
  SYSTEMS_CONFIG,
  ALL_SYSTEMS,
  getSystemConfig,
  buildKinastroPayload,
  calculateSystem,
  calculateAllSystems,
  fetchSupportedSystems,
  analyzeWithAI
};
