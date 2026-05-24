const promptInput = document.getElementById('prompt-input');
const negativeInput = document.getElementById('negative-input');
const promptCount = document.getElementById('prompt-count');
const negativeCount = document.getElementById('negative-count');

const styleGrid = document.getElementById('style-grid');
const galleryTabs = document.getElementById('gallery-tabs');

const loraInput = document.getElementById('lora-input');
const importLoraBtn = document.getElementById('import-lora');
const loraListEl = document.getElementById('lora-list');

const stepsRange = document.getElementById('steps-range');
const stepsLabel = document.getElementById('steps-label');
const cfgRange = document.getElementById('cfg-range');
const cfgLabel = document.getElementById('cfg-label');
const sizeGroup = document.getElementById('size-group');
const seedInput = document.getElementById('seed-input');
const diceBtn = document.getElementById('dice-btn');
const hiresCheckbox = document.getElementById('hires-checkbox');
const modelSelect = document.getElementById('model-select');

const generateBtn = document.getElementById('generate-btn');
const clearHistoryBtn = document.getElementById('clear-history');
const historyGrid = document.getElementById('history-grid');
const settingsBtn = document.getElementById('settings-btn');
const settingsDrawer = document.getElementById('settings-drawer');
const closeSettingsBtn = document.getElementById('close-settings');

const SETTINGS_FOCUS_CLASS = 'settings-open';

const STYLE_PRESETS = [
  {
    id: 'pokemon-diamond-nds',
    name: '鑽石版 NDS',
    category: '風景',
    gradient: 'linear-gradient(135deg,#7f93b7,#4c5f86)',
    colors: ['#7f93b7', '#4c5f86'],
    desc: '低彩度冷色、低多邊形場景與像素精靈疊合',
    prompt: 'Nintendo DS era, low-poly background, pixel sprite overlay, matte cool palette, foggy sinnoh atmosphere, 2006 handheld game look',
    negative: 'photorealistic, modern PBR, high gloss, ultra sharp 4k, chibi remake style',
  },
  {
    id: 'anime-bokeh',
    name: '劇場版動畫',
    category: '角色',
    gradient: 'linear-gradient(135deg,#ff9a9e,#fad0c4)',
    colors: ['#ff9a9e', '#fad0c4'],
    desc: '霓虹戲院打光、細節豐富的二次元分鏡',
    prompt: 'cinematic anime illustration, volumetric lighting, ultra detailed bokeh',
  },
  {
    id: 'photo-dream',
    name: '夢幻寫實',
    category: '角色',
    gradient: 'linear-gradient(135deg,#a18cd1,#fbc2eb)',
    colors: ['#a18cd1', '#fbc2eb'],
    desc: '柔焦皮膚質感、85mm 鏡頭光暈',
    prompt: 'photorealistic portrait, dreamy tonality, shallow depth of field, 85mm lens, high dynamic range',
  },
  {
    id: 'ink-vogue',
    name: '墨染潮流',
    category: '時尚',
    gradient: 'linear-gradient(135deg,#f6d365,#fda085)',
    colors: ['#f6d365', '#fda085'],
    desc: '水墨線條搭配街頭服飾與潑灑質感',
    prompt: 'ink wash fashion illustration, splash texture, minimal palette, bold silhouette',
  },
  {
    id: 'nova-mecha',
    name: 'Nova 機甲',
    category: '設計',
    gradient: 'linear-gradient(135deg,#5ee7df,#b490ca)',
    colors: ['#5ee7df', '#b490ca'],
    desc: '未來裝甲、體積光與細節重重的材質',
    prompt: 'futuristic mecha design, novaAI inspired lighting, subsurface scattering, intricate armor',
  },
  {
    id: 'silk-idol',
    name: '絲緞偶像',
    category: '角色',
    gradient: 'linear-gradient(135deg,#ffecd2,#fcb69f)',
    colors: ['#ffecd2', '#fcb69f'],
    desc: '柔光棚拍、絲緞服裝與細緻飾品',
    prompt: 'k-pop idol, silk costume, studio soft light, sparkling accessories, 4k portrait',
  },
  {
    id: 'mist-land',
    name: '晨霧山谷',
    category: '風景',
    gradient: 'linear-gradient(135deg,#84fab0,#8fd3f4)',
    colors: ['#84fab0', '#8fd3f4'],
    desc: '廣角鏡、山谷晨霧與薄光',
    prompt: 'wide angle landscape, valley covered by early morning mist, sun beams, cinematic grading',
  },
  {
    id: 'retro-city',
    name: '復古霓虹',
    category: '風景',
    gradient: 'linear-gradient(135deg,#f093fb,#f5576c)',
    colors: ['#f093fb', '#f5576c'],
    desc: '80s 合成波城市、霓虹雨夜',
    prompt: 'retro neon cityscape, synthwave palette, rainy reflections, cyberpunk street photography',
  },
  {
    id: 'aero-product',
    name: '空氣感產品',
    category: '設計',
    gradient: 'linear-gradient(135deg,#d4fc79,#96e6a1)',
    colors: ['#d4fc79', '#96e6a1'],
    desc: '高級產品渲染、漂浮展示櫥窗',
    prompt: 'premium product render, floating stage, diffused rim light, ultra clean presentation',
  },
];

const STORAGE_KEYS = {
  lora: 'smartPainterLoras',
  history: 'smartPainterHistory',
};

let activeStyle = null;
let activeFilter = 'all';
let loraBank = loadFromStorage(STORAGE_KEYS.lora, []);
let history = loadFromStorage(STORAGE_KEYS.history, []);

function loadFromStorage(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (error) {
    console.warn('storage parse error', error);
    return fallback;
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('storage write error', error);
  }
}

function updateCharCount(target, counter, max) {
  const len = target.value.length;
  counter.textContent = `${len} / ${max}`;
}

function renderStyles() {
  const dataset = activeFilter === 'all'
    ? STYLE_PRESETS
    : STYLE_PRESETS.filter(item => item.category === activeFilter);

  styleGrid.innerHTML = dataset.map(style => `
    <article class="style-card" data-style="${style.id}" aria-label="套用 ${style.name}">
      <div class="style-thumb" style="background:${style.gradient}">
        <span class="style-badge">${style.category}</span>
      </div>
      <h3>${style.name}</h3>
      <p>${style.desc}</p>
    </article>
  `).join('');

  if (activeStyle) {
    const card = styleGrid.querySelector(`[data-style="${activeStyle.id}"]`);
    card?.classList.add('active');
  }
}

function setActiveStyle(styleId) {
  activeStyle = STYLE_PRESETS.find(item => item.id === styleId) || null;
  document.querySelectorAll('.style-card').forEach(card => {
    card.classList.toggle('active', card.dataset.style === styleId);
  });
  if (activeStyle) {
    if (!promptInput.value.trim()) {
      promptInput.value = activeStyle.prompt;
      updateCharCount(promptInput, promptCount, promptInput.maxLength);
    }
    if (!negativeInput.value.trim() && activeStyle.negative) {
      negativeInput.value = activeStyle.negative;
      updateCharCount(negativeInput, negativeCount, negativeInput.maxLength);
    }
  }
}

function renderLoraList() {
  if (loraBank.length === 0) {
    loraListEl.innerHTML = '<p style="color:var(--sp-muted);font-size:13px;">尚未導入 LoRA</p>';
    return;
  }

  loraListEl.innerHTML = loraBank.map(item => `
    <div class="lora-item">
      <div>
        <strong>${item.name}</strong>
        <p style="font-size:12px;color:var(--sp-muted);">強度 ${item.strength}</p>
      </div>
      <button class="remove-btn" data-remove="${item.id}" aria-label="移除 ${item.name}"><i class="fas fa-xmark"></i></button>
    </div>
  `).join('');
}

function addLora(files) {
  const newItems = [...files].map(file => ({
    id: `${file.name}-${Date.now()}`,
    name: file.name.replace(/\.[^.]+$/, ''),
    strength: 0.8,
  }));
  loraBank = [...loraBank, ...newItems];
  saveToStorage(STORAGE_KEYS.lora, loraBank);
  renderLoraList();
}

function removeLora(id) {
  loraBank = loraBank.filter(item => item.id !== id);
  saveToStorage(STORAGE_KEYS.lora, loraBank);
  renderLoraList();
}

function setSize(size) {
  document.querySelectorAll('.chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.size === size);
  });
}

function randomSeed() {
  const seed = Math.floor(Math.random() * 999999999);
  seedInput.value = seed;
}

function renderHistory() {
  if (history.length === 0) {
    historyGrid.innerHTML = '<p style="color:var(--sp-muted);font-size:13px;">尚無紀錄</p>';
    return;
  }

  historyGrid.innerHTML = history
    .slice()
    .reverse()
    .map(item => `
      <article class="history-card">
        <img src="${item.preview}" alt="生成結果">
        <p>${item.prompt.slice(0, 32)}${item.prompt.length > 32 ? '…' : ''}</p>
      </article>
    `)
    .join('');
}

function fakePreviewImage(styleId) {
  const base = STYLE_PRESETS.find(item => item.id === styleId);
  const [start, end] = base?.colors || ['#434c7a', '#151925'];
  const title = base?.id === 'pokemon-diamond-nds' ? 'NDS Diamond' : 'NovaAI';
  const svg = `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' width='512' height='384' viewBox='0 0 512 384'>
      <defs>
        <linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'>
          <stop offset='0%' stop-color='${start}' />
          <stop offset='100%' stop-color='${end}' />
        </linearGradient>
      </defs>
      <rect width='512' height='384' fill='url(#g)'/>
      <rect x='0' y='0' width='512' height='384' fill='rgba(70,88,130,0.14)'/>
      <g opacity='0.28'>
        <rect y='0' width='512' height='1' fill='#fff'/>
        <rect y='4' width='512' height='1' fill='#fff'/>
        <rect y='8' width='512' height='1' fill='#fff'/>
        <rect y='12' width='512' height='1' fill='#fff'/>
      </g>
      <text x='50%' y='50%' font-size='30' fill='rgba(236,242,255,0.9)' dominant-baseline='middle' text-anchor='middle'>${title}</text>
    </svg>
  `)}`;
  return svg;
}

const ImageHostService = {
    isEnabled() {
        return localStorage.getItem('sx_image_host_enabled') === 'true';
    },
    
    async uploadToCatbox(dataUrl) {
        try {
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const ext = dataUrl.includes('svg') ? 'svg' : 'png';
            const file = new File([blob], `image.${ext}`, { type: blob.type || 'image/png' });
            
            const formData = new FormData();
            formData.append('reqtype', 'fileupload');
            formData.append('fileToUpload', file);
            
            const userhash = localStorage.getItem('sx_catbox_userhash') || '';
            if (userhash) formData.append('userhash', userhash);
            
            const res = await fetch('https://catbox.moe/user/api.php', {
                method: 'POST',
                body: formData
            });
            
            if (!res.ok) return null;
            const url = await res.text();
            return url && url.startsWith('https://') ? url.trim() : null;
        } catch (e) {
            console.warn('[SmartPainter] 圖床上傳失敗:', e);
            return null;
        }
    }
};

function simulateGeneration() {
  const promptText = promptInput.value.trim();
  if (!promptText) {
    promptInput.focus();
    return;
  }

  const originalLabel = generateBtn.dataset.label || generateBtn.innerHTML;
  generateBtn.dataset.label = originalLabel;
  generateBtn.disabled = true;
  generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 合成中…';

  setTimeout(async () => {
    const preview = fakePreviewImage(activeStyle?.id);
    const record = {
      timestamp: Date.now(),
      prompt: promptText,
      preview,
    };
    history.push(record);
    history = history.slice(-8);
    saveToStorage(STORAGE_KEYS.history, history);
    renderHistory();
    
    let imageUrl = preview;
    if (ImageHostService.isEnabled()) {
        const uploadedUrl = await ImageHostService.uploadToCatbox(preview);
        if (uploadedUrl) {
            imageUrl = uploadedUrl;
            console.log('[SmartPainter] 圖片已上傳到圖床:', uploadedUrl);
        }
    }
    
    window.parent?.postMessage({
      type: 'ALBUM_ADD_IMAGE',
      url: imageUrl,
      source: 'painter'
    }, '*');
    
    // 發送付款通知到 kakaopay
    window.parent?.postMessage({
      type: 'KAKAOPAY_PAYMENT_REQUEST',
      amount: 5,
      itemName: `照相館生成：${promptText.slice(0, 20)}...`,
      category: '應用',
      source: 'smart-painter'
    }, '*');
    
    generateBtn.disabled = false;
    generateBtn.innerHTML = originalLabel;
  }, 1400);
}

function clearHistory() {
  history = [];
  saveToStorage(STORAGE_KEYS.history, history);
  renderHistory();
}

function openSettings() {
  settingsDrawer.classList.remove('hidden');
  document.body.classList.add(SETTINGS_FOCUS_CLASS);
}

function closeSettings() {
  settingsDrawer.classList.add('hidden');
  document.body.classList.remove(SETTINGS_FOCUS_CLASS);
}

function loadApiFromSettings() {
  if (typeof SxSettings === 'undefined') return;
  const settings = SxSettings.getSettingsSnapshot();
  
  if (settings.activeApi) {
    const api = settings.activeApi;
    console.log('[smart-painter] Loaded API config:', api.name || 'default');
    return {
      baseUrl: api.baseUrl || '',
      apiKey: api.apiKey || '',
      model: api.model || ''
    };
  }
  
  if (settings.characters && settings.characters.length > 0) {
    console.log('[smart-painter] Available characters:', settings.characters.length);
  }
  
  return null;
}

function init() {
  loadApiFromSettings();
  renderStyles();
  renderLoraList();
  renderHistory();
  updateCharCount(promptInput, promptCount, promptInput.maxLength);
  updateCharCount(negativeInput, negativeCount, negativeInput.maxLength);
  setSize('512x384');
  setActiveStyle('pokemon-diamond-nds');

  styleGrid.addEventListener('click', event => {
    const card = event.target.closest('[data-style]');
    if (!card) return;
    setActiveStyle(card.dataset.style);
  });

  galleryTabs.addEventListener('click', event => {
    const tab = event.target.closest('[data-filter]');
    if (!tab) return;
    galleryTabs.querySelectorAll('.tab-chip').forEach(btn => btn.classList.remove('active'));
    tab.classList.add('active');
    activeFilter = tab.dataset.filter;
    renderStyles();
  });

  promptInput.addEventListener('input', () => updateCharCount(promptInput, promptCount, promptInput.maxLength));
  negativeInput.addEventListener('input', () => updateCharCount(negativeInput, negativeCount, negativeInput.maxLength));

  importLoraBtn.addEventListener('click', () => loraInput.click());
  loraInput.addEventListener('change', () => {
    if (loraInput.files?.length) {
      addLora(loraInput.files);
      loraInput.value = '';
    }
  });

  loraListEl.addEventListener('click', event => {
    const btn = event.target.closest('[data-remove]');
    if (!btn) return;
    removeLora(btn.dataset.remove);
  });

  stepsRange.addEventListener('input', () => {
    stepsLabel.textContent = `${stepsRange.value} steps`;
  });

  cfgRange.addEventListener('input', () => {
    cfgLabel.textContent = cfgRange.value;
  });

  sizeGroup.addEventListener('click', event => {
    const chip = event.target.closest('[data-size]');
    if (!chip) return;
    setSize(chip.dataset.size);
  });

  diceBtn.addEventListener('click', randomSeed);
  generateBtn.addEventListener('click', simulateGeneration);
  clearHistoryBtn.addEventListener('click', clearHistory);

  settingsBtn.addEventListener('click', openSettings);
  closeSettingsBtn.addEventListener('click', closeSettings);
  settingsDrawer.addEventListener('click', event => {
    if (event.target === settingsDrawer) {
      closeSettings();
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
