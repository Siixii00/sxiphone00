const homeView = document.getElementById('fortune-home');
const introOverlay = document.getElementById('drift-intro');
const categoryButtons = document.querySelectorAll('.segment');
const methodGrid = document.getElementById('method-grid');
const homeRefreshBtn = document.getElementById('home-refresh-btn');
const oceanToneSelect = document.getElementById('ocean-tone');
const oceanVolumeInput = document.getElementById('ocean-volume');
const noiseToggleSelect = document.getElementById('noise-toggle');
const noiseVolumeInput = document.getElementById('noise-volume');
const eastBirthCard = document.getElementById('east-birth-card');
const westBirthCard = document.getElementById('west-birth-card');
const eastBirthGenderSelect = document.getElementById('east-birth-gender');
const eastLunarNote = document.getElementById('east-lunar-note');
const eastSaveProfileBtn = document.getElementById('east-save-profile');
const eastBirthDateInput = document.getElementById('east-birth-date');
const eastBirthTimeInput = document.getElementById('east-birth-time');
const eastCalendarTypeSelect = document.getElementById('east-calendar-type');
const eastLunarLeapSelect = document.getElementById('east-lunar-leap');
const ziweiResultEl = document.getElementById('r-ziwei');
const ziweiDetailEl = document.getElementById('r-ziwei-detail');
const ziweiExternalLink = document.getElementById('ziwei-external-link');
const ziweiResultImageInput = document.getElementById('ziwei-result-image');
const ziweiResultNoteInput = document.getElementById('ziwei-result-note');
const ziweiSaveExternalBtn = document.getElementById('ziwei-save-external');
const ziweiExternalPreview = document.getElementById('ziwei-external-preview');
const ziweiPreviewImage = document.getElementById('ziwei-preview-image');
const ziweiPreviewNote = document.getElementById('ziwei-preview-note');
const ziweiAnalysisNote = document.getElementById('ziwei-analysis-note');
const ziweiAnalysisResult = document.getElementById('ziwei-analysis-result');
const ziweiBuildChartBtn = document.getElementById('ziwei-build-chart');
const ziweiDownloadChartBtn = document.getElementById('ziwei-download-chart');
const ziweiChartNote = document.getElementById('ziwei-chart-note');
const ziweiChartImage = document.getElementById('ziwei-chart-image');
const meihuaQuestionInput = document.getElementById('q-meihua');
const meihuaCastModeSelect = document.getElementById('meihua-cast-mode');
const meihuaMovingModeSelect = document.getElementById('meihua-moving-mode');
const meihuaNumberInputsWrap = document.getElementById('meihua-number-inputs');
const meihuaManualMovingWrap = document.getElementById('meihua-moving-manual-wrap');
const meihuaNumberAInput = document.getElementById('meihua-number-a');
const meihuaNumberBInput = document.getElementById('meihua-number-b');
const meihuaMovingLineInput = document.getElementById('meihua-moving-line');
const meihuaCastBtn = document.getElementById('meihua-cast-btn');
const meihuaCastNote = document.getElementById('meihua-cast-note');
const meihuaResultEl = document.getElementById('r-meihua');
const meihuaDetailEl = document.getElementById('r-meihua-detail');
const openFlowAlmanacBtn = document.getElementById('open-flow-almanac');
const flowAlmanacBackBtn = document.getElementById('flow-almanac-back');
const flowAlmanacQuestionInput = document.getElementById('flow-almanac-question');
const flowAlmanacDateInput = document.getElementById('flow-almanac-date');
const flowAlmanacYearInput = document.getElementById('flow-almanac-year');
const flowAlmanacGenerateBtn = document.getElementById('flow-almanac-generate');
const flowAlmanacNoteEl = document.getElementById('flow-almanac-note');
const flowAlmanacResultEl = document.getElementById('r-flow-almanac');
const flowAlmanacDetailEl = document.getElementById('r-flow-almanac-detail');

let lunarToolkitModule = null;

async function loadLunarToolkit() {
  if (lunarToolkitModule) return lunarToolkitModule;

  const candidates = [
    '../../node_modules/lunar-ts/dist/index.js',
    '/node_modules/lunar-ts/dist/index.js'
  ];

  for (const specifier of candidates) {
    try {
      lunarToolkitModule = await import(specifier);
      return lunarToolkitModule;
    } catch (error) {
      // try next candidate
    }
  }

  return null;
}

const methodPages = {
  ziwei: document.getElementById('page-ziwei'),
  meihua: document.getElementById('page-meihua'),
  flow: document.getElementById('page-flow'),
  'flow-almanac': document.getElementById('page-flow-almanac'),
  tarot: document.getElementById('page-tarot'),
  'tarot-settings': document.getElementById('page-tarot-settings'),
  astrology: document.getElementById('page-astrology'),
  audio: document.getElementById('page-audio')
};

const pageBackButtons = document.querySelectorAll('.page-back');
const generateButtons = document.querySelectorAll('.generate-btn');

const tarotSpreadSelect = document.getElementById('tarot-spread');
const tarotQuestionInput = document.getElementById('q-tarot');

const methods = {
  east: [
    { key: 'ziwei', label: '紫微斗數' },
    { key: 'meihua', label: '梅花易數' },
    { key: 'flow', label: '流年流月流日' }
  ],
  west: [
    { key: 'tarot', label: '塔羅' },
    { key: 'astrology', label: '占星' }
  ]
};

const fortuneTemplates = {
  ziwei: [
    '紫微盤意象顯示：先整合資源，再推進目標，穩健會比速度更重要。',
    '命宮訊號偏向整理期，先把節奏排好，本月下旬會更順。'
  ],
  meihua: [
    '卦象呈現「動中取穩」，建議先確認關鍵前提再出手。',
    '象意偏吉，但需避免情緒性決策，按計畫推進最有利。'
  ],
  flow: [
    '流年流月流日訊號提醒：近期適合先做減法，再做加法。',
    '運勢曲線為漸進上升，持續累積可在下階段看到成果。'
  ],
  astrology: [
    '星象顯示目前是重整週期，先穩住核心生活節奏。',
    '行運指向新的合作機會，主動溝通會帶來轉機。'
  ],
  tarot: [
    '牌面整體顯示你正站在轉換點，重點是明確下一步的優先序。',
    '本次牌陣提醒你：保持彈性，但不要放棄原先的長期方向。'
  ]
};

const tarotBaseDeck = [
  '愚者', '魔術師', '女祭司', '皇后', '皇帝', '教皇', '戀人', '戰車', '力量', '隱者', '命運之輪',
  '正義', '倒吊人', '死神', '節制', '惡魔', '高塔', '星星', '月亮', '太陽', '審判', '世界'
];

const baguaByIndex = {
  1: { key: 'qian', symbol: '乾', name: '天', lines: [1, 1, 1], element: '金' },
  2: { key: 'dui', symbol: '兌', name: '澤', lines: [1, 1, 0], element: '金' },
  3: { key: 'li', symbol: '離', name: '火', lines: [1, 0, 1], element: '火' },
  4: { key: 'zhen', symbol: '震', name: '雷', lines: [1, 0, 0], element: '木' },
  5: { key: 'xun', symbol: '巽', name: '風', lines: [0, 1, 1], element: '木' },
  6: { key: 'kan', symbol: '坎', name: '水', lines: [0, 1, 0], element: '水' },
  7: { key: 'gen', symbol: '艮', name: '山', lines: [0, 0, 1], element: '土' },
  8: { key: 'kun', symbol: '坤', name: '地', lines: [0, 0, 0], element: '土' }
};

let selectedCategory = 'east';
let oceanAudioContext = null;
let oceanSource = null;
let oceanGain = null;
let oceanFilter = null;
let oceanNoiseBuffer = null;

let noiseSource = null;
let noiseGain = null;
let noiseBuffer = null;

let ziweiLib = null;
let ziweiLibError = null;

const TAROT_API_URL = 'https://tarotapi.dev/api/v1/cards';

const tarotDeckConfigs = {
  rws: {
    name: '偉特塔羅',
    nameEn: 'Rider-Waite-Smith',
    description: '最經典的塔羅牌系，適合初學者',
    suits: {
      wands: { name: '權杖', nameEn: 'Wands', symbol: '🔥', element: '火' },
      cups: { name: '聖杯', nameEn: 'Cups', symbol: '💧', element: '水' },
      swords: { name: '寶劍', nameEn: 'Swords', symbol: '🗡️', element: '風' },
      pentacles: { name: '錢幣', nameEn: 'Pentacles', symbol: '💰', element: '土' }
    },
    courts: ['侍衛', '騎士', '皇后', '國王'],
    courtsEn: ['Page', 'Knight', 'Queen', 'King']
  },
  thoth: {
    name: '托特塔羅',
    nameEn: 'Thoth',
    description: '由 Aleister Crowley 設計，圖像豐富象徵',
    suits: {
      wands: { name: '權杖', nameEn: 'Wands', symbol: '🔥', element: '火' },
      cups: { name: '聖杯', nameEn: 'Cups', symbol: '💧', element: '水' },
      swords: { name: '寶劍', nameEn: 'Swords', symbol: '🗡️', element: '風' },
      disks: { name: '圓盤', nameEn: 'Disks', symbol: '💰', element: '土' }
    },
    courts: ['公主', '王子', '皇后', '騎士'],
    courtsEn: ['Princess', 'Prince', 'Queen', 'Knight']
  },
  marseille: {
    name: '馬賽塔羅',
    nameEn: 'Marseille',
    description: '法國傳統塔羅牌，圖案簡潔古典',
    suits: {
      batons: { name: '權杖', nameEn: 'Batons', symbol: '🪵', element: '火' },
      cups: { name: '聖杯', nameEn: 'Cups', symbol: '💧', element: '水' },
      swords: { name: '寶劍', nameEn: 'Swords', symbol: '🗡️', element: '風' },
      coins: { name: '金幣', nameEn: 'Coins', symbol: '💰', element: '土' }
    },
    courts: ['侍從', '騎士', '皇后', '國王'],
    courtsEn: ['Valet', 'Cavalier', 'Reine', 'Roi']
  }
};

const majorArcanaBase = [
  { num: 0, name: '愚者', nameEn: 'The Fool', symbol: '🃏' },
  { num: 1, name: '魔術師', nameEn: 'The Magician', symbol: '✨' },
  { num: 2, name: '女祭司', nameEn: 'The High Priestess', symbol: '🌙' },
  { num: 3, name: '皇后', nameEn: 'The Empress', symbol: '👑' },
  { num: 4, name: '皇帝', nameEn: 'The Emperor', symbol: '🏛️' },
  { num: 5, name: '教皇', nameEn: 'The Hierophant', symbol: '📿' },
  { num: 6, name: '戀人', nameEn: 'The Lovers', symbol: '💕' },
  { num: 7, name: '戰車', nameEn: 'The Chariot', symbol: '⚔️' },
  { num: 8, name: '力量', nameEn: 'Strength', symbol: '🦁' },
  { num: 9, name: '隱者', nameEn: 'The Hermit', symbol: '🏔️' },
  { num: 10, name: '命運之輪', nameEn: 'Wheel of Fortune', symbol: '☸️' },
  { num: 11, name: '正義', nameEn: 'Justice', symbol: '⚖️' },
  { num: 12, name: '倒吊人', nameEn: 'The Hanged Man', symbol: '🙃' },
  { num: 13, name: '死神', nameEn: 'Death', symbol: '💀' },
  { num: 14, name: '節制', nameEn: 'Temperance', symbol: '⚗️' },
  { num: 15, name: '惡魔', nameEn: 'The Devil', symbol: '😈' },
  { num: 16, name: '高塔', nameEn: 'The Tower', symbol: '🗼' },
  { num: 17, name: '星星', nameEn: 'The Star', symbol: '⭐' },
  { num: 18, name: '月亮', nameEn: 'The Moon', symbol: '🌕' },
  { num: 19, name: '太陽', nameEn: 'The Sun', symbol: '☀️' },
  { num: 20, name: '審判', nameEn: 'Judgement', symbol: '📯' },
  { num: 21, name: '世界', nameEn: 'The World', symbol: '🌍' }
];

const thothMajorVariants = [
  { num: 8, name: '調整', nameEn: 'Adjustment' },
  { num: 11, name: '慾望', nameEn: 'Lust' },
  { num: 14, name: '藝術', nameEn: 'Art' },
  { num: 20, name: '永恆', nameEn: 'The Aeon' }
];

const marseilleMajorVariants = [
  { num: 8, name: '正義', nameEn: 'Justice' },
  { num: 11, name: '力量', nameEn: 'La Force' }
];

let cachedTarotApiData = null;

async function fetchTarotApiData() {
  if (cachedTarotApiData) return cachedTarotApiData;
  
  try {
    const response = await fetch(TAROT_API_URL);
    const data = await response.json();
    cachedTarotApiData = data.cards || [];
    return cachedTarotApiData;
  } catch (err) {
    console.warn('Failed to fetch tarot API data:', err);
    return [];
  }
}

function generateMajorArcana(deckType) {
  return majorArcanaBase.map(card => {
    let finalName = card.name;
    let finalNameEn = card.nameEn;
    
    if (deckType === 'thoth') {
      const variant = thothMajorVariants.find(v => v.num === card.num);
      if (variant) {
        finalName = variant.name;
        finalNameEn = variant.nameEn;
      }
    } else if (deckType === 'marseille') {
      const variant = marseilleMajorVariants.find(v => v.num === card.num);
      if (variant) {
        finalName = variant.name;
        finalNameEn = variant.nameEn;
      }
    }
    
    return {
      id: `major-${card.num}`,
      type: 'major',
      number: card.num,
      name: finalName,
      nameEn: finalNameEn,
      symbol: card.symbol,
      keywords: getMajorKeywords(card.num)
    };
  });
}

function getMajorKeywords(num) {
  const keywords = {
    0: ['開始', '冒險', '純真', '自由'],
    1: ['創造', '意志', '技能', '資源'],
    2: ['直覺', '神秘', '潛意識', '智慧'],
    3: ['豐盛', '母性', '創造力', '自然'],
    4: ['權威', '結構', '控制', '穩定'],
    5: ['傳統', '信仰', '教導', '精神'],
    6: ['愛情', '選擇', '和諧', '價值觀'],
    7: ['意志', '決心', '勝利', '控制'],
    8: ['力量', '勇氣', '耐心', '慈悲'],
    9: ['內省', '指引', '孤獨', '智慧'],
    10: ['命運', '轉變', '週期', '機會'],
    11: ['公正', '真理', '因果', '平衡'],
    12: ['犧牲', '等待', '新視角', '放下'],
    13: ['結束', '轉變', '重生', '轉化'],
    14: ['平衡', '調和', '耐心', '中庸'],
    15: ['束縛', '慾望', '物質', '陰影'],
    16: ['崩塌', '突變', '啟示', '解放'],
    17: ['希望', '靈感', '平靜', '更新'],
    18: ['幻覺', '恐懼', '潛意識', '直覺'],
    19: ['喜悅', '成功', '活力', '樂觀'],
    20: ['重生', '覺醒', '召喚', '反思'],
    21: ['完成', '整合', '成就', '圓滿']
  };
  return keywords[num] || [];
}

function generateMinorArcana(deckType) {
  const config = tarotDeckConfigs[deckType];
  const deck = [];
  const suitEntries = Object.entries(config.suits);
  
  suitEntries.forEach(([suitKey, suit]) => {
    for (let i = 1; i <= 10; i++) {
      deck.push({
        id: `${suitKey}-${i}`,
        type: 'minor',
        suit: suitKey,
        suitName: suit.name,
        suitNameEn: suit.nameEn,
        number: i,
        name: `${suit.name}${i}`,
        nameEn: `${i} of ${suit.nameEn}`,
        symbol: suit.symbol,
        element: suit.element,
        keywords: getMinorKeywords(suitKey, i)
      });
    }
    
    config.courts.forEach((courtName, idx) => {
      deck.push({
        id: `${suitKey}-${courtName}`,
        type: 'court',
        suit: suitKey,
        suitName: suit.name,
        suitNameEn: suit.nameEn,
        court: courtName,
        courtEn: config.courtsEn[idx],
        name: `${suit.name}${courtName}`,
        nameEn: `${config.courtsEn[idx]} of ${suit.nameEn}`,
        symbol: suit.symbol,
        element: suit.element,
        keywords: getCourtKeywords(courtName)
      });
    });
  });
  
  return deck;
}

function getMinorKeywords(suit, num) {
  const suitThemes = {
    wands: ['行動', '熱情', '創造', '事業'],
    cups: ['情感', '直覺', '關係', '靈性'],
    swords: ['思想', '溝通', '衝突', '真相'],
    pentacles: ['物質', '資源', '實踐', '財富'],
    disks: ['物質', '資源', '實踐', '財富'],
    batons: ['行動', '熱情', '創造', '事業'],
    coins: ['物質', '資源', '實踐', '財富']
  };
  
  const numMeanings = {
    1: ['新開始', '機會'],
    2: ['選擇', '平衡'],
    3: ['成長', '合作'],
    4: ['穩定', '控制'],
    5: ['衝突', '挑戰'],
    6: ['成功', '分享'],
    7: ['評估', '堅持'],
    8: ['移動', '速度'],
    9: ['堅持', '獨立'],
    10: ['完成', '負擔']
  };
  
  const themes = suitThemes[suit] || suitThemes.wands;
  const nums = numMeanings[num] || [];
  return [...themes.slice(0, 2), ...nums];
}

function getCourtKeywords(court) {
  const keywords = {
    '侍衛': ['訊息', '學習', '年輕'],
    '騎士': ['行動', '追求', '熱情'],
    '皇后': ['直覺', '養育', '內在'],
    '國王': ['權威', '控制', '成熟'],
    '公主': ['訊息', '學習', '新開始'],
    '王子': ['行動', '追求', '活力'],
    '侍從': ['訊息', '學習', '年輕']
  };
  return keywords[court] || ['人物', '特質'];
}

function generateFullDeck(deckType) {
  const major = generateMajorArcana(deckType);
  const minor = generateMinorArcana(deckType);
  return [...major, ...minor];
}

const fullTarotDeck = generateFullDeck('rws');

const thothMajorMeanings = {
  0: {
    name: '愚者',
    nameEn: 'The Fool',
    upright: '純真、新開始、自由、冒險、自發性、潛力無限',
    reversed: '魯莽、不負責任、逃避現實、缺乏方向、幼稚',
    thothNote: '托特塔羅的愚者呈現綠色皮膚，象徵生命力與自然狀態，代表宇宙的原始能量。'
  },
  1: {
    name: '魔術師',
    nameEn: 'The Magus',
    upright: '意志力、創造力、技能展現、資源運用、自信',
    reversed: '操控、欺騙、才能誤用、缺乏專注',
    thothNote: '托特稱為「魔術師」而非「魔術師」，強調意志與意識的力量。'
  },
  2: {
    name: '女祭司',
    nameEn: 'The Priestess',
    upright: '直覺、神秘、潛意識智慧、內在知識、靈性連結',
    reversed: '隱藏真相、表面化、忽略直覺、情緒壓抑',
    thothNote: '代表月亮與潛意識的深層連結，是通往內在智慧的門戶。'
  },
  3: {
    name: '皇后',
    nameEn: 'The Empress',
    upright: '豐盛、母性、創造力、自然、養育、感官享受',
    reversed: '依賴、過度保護、創意阻塞、缺乏成長',
    thothNote: '象徵金星與自然的豐饒，代表物質與精神層面的創造力。'
  },
  4: {
    name: '皇帝',
    nameEn: 'The Emperor',
    upright: '權威、結構、控制、領導、穩定、秩序',
    reversed: '專制、僵化、控制欲、缺乏彈性',
    thothNote: '代表火元素與權威力量，是秩序與結構的建立者。'
  },
  5: {
    name: '教皇',
    nameEn: 'The Hierophant',
    upright: '傳統、精神教導、信仰、儀式、神聖智慧',
    reversed: '教條主義、盲從、打破傳統、精神危機',
    thothNote: '托特中稱為「教皇」，代表精神傳承與神聖知識的傳遞者。'
  },
  6: {
    name: '戀人',
    nameEn: 'The Lovers',
    upright: '愛情、選擇、和諧、價值觀、關係、吸引力',
    reversed: '不和諧、失衡、錯誤選擇、價值衝突',
    thothNote: '托特的戀人牌呈現煉金術的結合，象徵對立面的統一。'
  },
  7: {
    name: '戰車',
    nameEn: 'The Chariot',
    upright: '意志力、決心、勝利、控制、方向明確',
    reversed: '失控、缺乏方向、挫折、內在衝突',
    thothNote: '代表聖杯的聖杯，象徵情感與意志的結合。'
  },
  8: {
    name: '調整',
    nameEn: 'Adjustment',
    upright: '平衡、公正、因果、真理、調整、和諧',
    reversed: '不公正、失衡、逃避責任、判斷錯誤',
    thothNote: '托特將正義改為「調整」，強調動態平衡與宇宙法則。'
  },
  9: {
    name: '隱者',
    nameEn: 'The Hermit',
    upright: '內省、智慧、指引、孤獨、尋找真理',
    reversed: '孤立、封閉、逃避、缺乏指引',
    thothNote: '代表內在的光與智慧，是自我探索的旅程。'
  },
  10: {
    name: '命運之輪',
    nameEn: 'Fortune',
    upright: '命運、轉變、週期、機會、循環、業力',
    reversed: '厄運、抗拒改變、失控、惡性循環',
    thothNote: '托特稱為「命運」，代表宇宙的循環法則與業力運作。'
  },
  11: {
    name: '慾望',
    nameEn: 'Lust',
    upright: '熱情、生命力、勇氣、本能、創造力',
    reversed: '失控、執著、貪婪、自我毀滅',
    thothNote: '托特將力量改為「慾望」，強調生命能量的原始力量而非馴服。'
  },
  12: {
    name: '倒吊人',
    nameEn: 'The Hanged Man',
    upright: '犧牲、等待、新視角、放下、懸置',
    reversed: '拖延、徒勞、抗拒改變、僵持',
    thothNote: '代表自願的犧牲與視角的轉換，是通往覺醒的途徑。'
  },
  13: {
    name: '死神',
    nameEn: 'Death',
    upright: '結束、轉變、重生、轉化、放下過去',
    reversed: '抗拒改變、停滯、恐懼、無法放手',
    thothNote: '托特的死神牌呈現骷髏形態，強調轉化而非終結。'
  },
  14: {
    name: '藝術',
    nameEn: 'Art',
    upright: '創造、融合、轉化、煉金術、完美',
    reversed: '失衡、不協調、創意阻塞、混亂',
    thothNote: '托特將節制改為「藝術」，代表煉金術的融合與轉化過程。'
  },
  15: {
    name: '惡魔',
    nameEn: 'The Devil',
    upright: '束縛、慾望、物質執著、陰影、誘惑',
    reversed: '解放、面對陰影、打破束縛、覺察',
    thothNote: '代表物質世界的誘惑與靈魂的陰影面，需覺察而非逃避。'
  },
  16: {
    name: '高塔',
    nameEn: 'The Tower',
    upright: '崩塌、突變、啟示、解放、劇變',
    reversed: '抗拒改變、延遲崩潰、內在轉化',
    thothNote: '托特的高塔稱為「高塔」，代表舊結構的必然崩解。'
  },
  17: {
    name: '星星',
    nameEn: 'The Star',
    upright: '希望、靈感、平靜、更新、療癒、信心',
    reversed: '絕望、失去信心、幻滅、缺乏連結',
    thothNote: '代表努伊特女神的宇宙能量，是靈性啟迪的象徵。'
  },
  18: {
    name: '月亮',
    nameEn: 'The Moon',
    upright: '幻覺、潛意識、恐懼、直覺、夢境、迷霧',
    reversed: '清晰、走出迷惘、面對恐懼、釋放',
    thothNote: '托特的月亮牌充滿埃及象徵，代表潛意識的深層探索。'
  },
  19: {
    name: '太陽',
    nameEn: 'The Sun',
    upright: '喜悅、成功、活力、樂觀、光明、顯化',
    reversed: '暫時陰霾、過度樂觀、缺乏熱情',
    thothNote: '代表拉神的能量，是生命與意識的終極光源。'
  },
  20: {
    name: '永恆',
    nameEn: 'The Aeon',
    upright: '重生、覺醒、新時代、審判、召喚',
    reversed: '抗拒轉變、無法放下、自我設限',
    thothNote: '托特將審判改為「永恆」，代表霍魯斯的新時代與靈魂進化。'
  },
  21: {
    name: '世界',
    nameEn: 'The Universe',
    upright: '完成、整合、成就、圓滿、宇宙意識',
    reversed: '未完成、缺乏整合、延遲完成',
    thothNote: '托特稱為「宇宙」，代表存在的整體與靈魂的圓滿狀態。'
  }
};

const thothMinorMeanings = {
  wands: {
    name: '權杖',
    element: '火',
    cards: {
      1: { upright: '創造力的源頭、新事業、靈感爆發、原始能量', reversed: '能量阻塞、延遲、缺乏方向' },
      2: { upright: '支配、意志力、選擇、等待中的能量', reversed: '優柔寡斷、受阻、缺乏計劃' },
      3: { upright: '美德、擴張、合作成功、力量展現', reversed: '驕傲、自負、過度擴張' },
      4: { upright: '完成、慶祝、和諧、穩固基礎', reversed: '過度安逸、停滯、缺乏進展' },
      5: { upright: '鬥爭、衝突、競爭、挑戰', reversed: '和解、避免衝突、內在鬥爭' },
      6: { upright: '勝利、成功、進展、自信', reversed: '驕傲、失敗、自大' },
      7: { upright: '勇氣、堅持、防衛、面對挑戰', reversed: '退縮、缺乏信心、猶豫' },
      8: { upright: '迅速、行動、快速進展、直接', reversed: '延遲、阻礙、缺乏行動' },
      9: { upright: '力量、決心、韌性、不屈不撓', reversed: '軟弱、放棄、缺乏堅持' },
      10: { upright: '壓迫、負擔、責任過重、力量耗盡', reversed: '釋放負擔、卸下責任、逃避' }
    }
  },
  cups: {
    name: '聖杯',
    element: '水',
    cards: {
      1: { upright: '情感的源頭、靈感、新關係、直覺開啟', reversed: '情感阻塞、壓抑、缺乏靈感' },
      2: { upright: '愛情、和諧、連結、伴侶關係', reversed: '不和諧、分離、情感失衡' },
      3: { upright: '豐盛、歡慶、友誼、情感滿足', reversed: '過度享樂、放縱、缺乏深度' },
      4: { upright: '奢華、穩定、舒適、情感滿足', reversed: '厭倦、不滿足、情感麻木' },
      5: { upright: '失望、悲傷、情感失落、痛苦', reversed: '恢復、接受、走出悲傷' },
      6: { upright: '愉悅、滿足、情感和諧、美好回憶', reversed: '沉溺過去、不切實際、幻滅' },
      7: { upright: '幻象、迷惑、選擇困難、不切實際', reversed: '清醒、面對現實、做出選擇' },
      8: { upright: '失敗、失望、放棄、情感枯竭', reversed: '重新開始、恢復希望、走出低谷' },
      9: { upright: '幸福、願望實現、情感滿足', reversed: '不滿足、貪婪、情感空虛' },
      10: { upright: '滿足、圓滿、情感豐盛、和諧', reversed: '情感失落、不滿、關係破裂' }
    }
  },
  swords: {
    name: '寶劍',
    element: '風',
    cards: {
      1: { upright: '智慧的源頭、清晰、真理、心智突破', reversed: '混亂、誤解、思維阻塞' },
      2: { upright: '和平、平衡、選擇、心靈和諧', reversed: '衝突、不和諧、優柔寡斷' },
      3: { upright: '悲傷、痛苦、心碎、失去', reversed: '療癒、釋放、走出痛苦' },
      4: { upright: '休戰、休息、和平、恢復', reversed: '不安、焦慮、無法放鬆' },
      5: { upright: '失敗、衝突、挫折、損失', reversed: '和解、恢復、接受失敗' },
      6: { upright: '科學、理性、成功、智慧運用', reversed: '缺乏邏輯、計劃失敗、短視' },
      7: { upright: '徒勞、無效、計劃失敗、浪費', reversed: '重新評估、改變方向、接受現實' },
      8: { upright: '干擾、阻礙、限制、困境', reversed: '突破、釋放、找到出路' },
      9: { upright: '殘酷、痛苦、絕望、折磨', reversed: '希望、解脫、走出黑暗' },
      10: { upright: '毀滅、結束、崩潰、徹底失敗', reversed: '重生、恢復、避免災難' }
    }
  },
  disks: {
    name: '圓盤',
    element: '土',
    cards: {
      1: { upright: '物質的源頭、新財富、機會、具體化', reversed: '物質缺乏、錯失機會、貧乏' },
      2: { upright: '變化、適應、靈活、平衡', reversed: '不穩定、失衡、無法適應' },
      3: { upright: '工作、技能、創作、實現', reversed: '缺乏技能、工作失敗、不滿' },
      4: { upright: '權力、穩定、控制、物質安全', reversed: '貪婪、控制欲、物質執著' },
      5: { upright: '憂慮、困難、貧乏、挑戰', reversed: '改善、希望、克服困難' },
      6: { upright: '成功、物質豐盛、收穫、分享', reversed: '自私、貪婪、不願分享' },
      7: { upright: '失敗、未完成、失望、延遲', reversed: '重新開始、恢復、找到新方向' },
      8: { upright: '謹慎、技能、專注、細節', reversed: '粗心、缺乏專注、倉促' },
      9: { upright: '收穫、成果、物質成功、享受', reversed: '不滿足、貪婪、缺乏成果' },
      10: { upright: '財富、圓滿、物質成就、傳承', reversed: '物質損失、家庭問題、遺產糾紛' }
    }
  }
};

const thothCourtMeanings = {
  wands: {
    princess: { upright: '新機會、創意靈感、年輕熱情、訊息', reversed: '缺乏方向、幼稚、延遲' },
    prince: { upright: '行動、追求、冒險、熱情追求', reversed: '衝動、魯莽、不穩定' },
    queen: { upright: '自信、魅力、熱情、創造力', reversed: '專制、嫉妒、控制欲' },
    knight: { upright: '領導、權威、遠見、事業成功', reversed: '專橫、獨斷、過度控制' }
  },
  cups: {
    princess: { upright: '情感訊息、新關係、直覺、溫柔', reversed: '情緒化、不成熟、缺乏方向' },
    prince: { upright: '浪漫追求、魅力、情感行動', reversed: '不切實際、情緒不穩、逃避' },
    queen: { upright: '直覺、情感智慧、養育、同理心', reversed: '情緒依賴、過度敏感、封閉' },
    knight: { upright: '情感成熟、外交、和諧、藝術性', reversed: '虛偽、情感操控、不和諧' }
  },
  swords: {
    princess: { upright: '新想法、清晰訊息、分析、學習', reversed: '淺薄、八卦、缺乏深度' },
    prince: { upright: '快速行動、果斷、智力追求', reversed: '衝動、魯莽、缺乏思考' },
    queen: { upright: '清晰、理性、獨立思考、直率', reversed: '冷酷、過度批判、情感疏離' },
    knight: { upright: '權威、理性領導、正義、原則', reversed: '專制、僵化、過度理性' }
  },
  disks: {
    princess: { upright: '新機會、學習、實踐、物質訊息', reversed: '缺乏野心、懶惰、浪費' },
    prince: { upright: '勤奮、實踐、追求目標、行動', reversed: '無聊、缺乏動力、停滯' },
    queen: { upright: '務實、物質智慧、豐盛、養育', reversed: '過度物質、工作狂、缺乏靈性' },
    knight: { upright: '成功、財富、事業成就、穩固', reversed: '物質執著、保守、缺乏彈性' }
  }
};

const marseilleMajorMeanings = {
  0: {
    name: '愚者',
    nameEn: 'Le Mat',
    upright: '純真、自由、新開始、冒險、自發性',
    reversed: '魯莽、不負責任、瘋狂、缺乏方向',
    marseilleNote: '馬賽塔羅的愚者稱為「Le Mat」，代表流浪者與瘋子，是自由的象徵。'
  },
  1: {
    name: '魔術師',
    nameEn: 'Le Bateleur',
    upright: '技能、創造、意志力、新開始、機智',
    reversed: '欺騙、操控、才能誤用、缺乏專注',
    marseilleNote: '馬賽稱為「Le Bateleur」，意為街頭表演者，代表技能與創造力。'
  },
  2: {
    name: '女祭司',
    nameEn: 'La Papesse',
    upright: '直覺、神秘、潛意識、智慧、內在知識',
    reversed: '隱藏真相、表面化、忽略直覺、秘密',
    marseilleNote: '馬賽稱為「La Papesse」（女教皇），代表靈性智慧與直覺。'
  },
  3: {
    name: '皇后',
    nameEn: 'L\'Impératrice',
    upright: '豐盛、母性、創造力、自然、養育',
    reversed: '依賴、過度保護、創意阻塞、缺乏成長',
    marseilleNote: '代表金星與自然的豐饒，是物質與情感的創造者。'
  },
  4: {
    name: '皇帝',
    nameEn: 'L\'Empereur',
    upright: '權威、結構、控制、領導、穩定',
    reversed: '專制、僵化、控制欲、缺乏彈性',
    marseilleNote: '代表權威與秩序，是結構與穩定的建立者。'
  },
  5: {
    name: '教皇',
    nameEn: 'Le Pape',
    upright: '傳統、精神教導、信仰、儀式、神聖智慧',
    reversed: '教條主義、盲從、打破傳統、精神危機',
    marseilleNote: '馬賽稱為「Le Pape」，代表宗教權威與精神傳承。'
  },
  6: {
    name: '戀人',
    nameEn: 'L\'Amoureux',
    upright: '愛情、選擇、和諧、價值觀、關係',
    reversed: '不和諧、失衡、錯誤選擇、價值衝突',
    marseilleNote: '馬賽的戀人牌呈現選擇的場景，強調抉擇而非單純的愛情。'
  },
  7: {
    name: '戰車',
    nameEn: 'Le Chariot',
    upright: '意志力、決心、勝利、控制、方向明確',
    reversed: '失控、缺乏方向、挫折、內在衝突',
    marseilleNote: '代表意志的勝利與方向的控制，是行動與決心的象徵。'
  },
  8: {
    name: '正義',
    nameEn: 'La Justice',
    upright: '公正、真理、因果、平衡、判斷',
    reversed: '不公正、失衡、逃避責任、判斷錯誤',
    marseilleNote: '馬賽塔羅中正義為8號牌，代表宇宙的法則與公正。'
  },
  9: {
    name: '隱者',
    nameEn: 'L\'Hermite',
    upright: '內省、智慧、指引、孤獨、尋找真理',
    reversed: '孤立、封閉、逃避、缺乏指引',
    marseilleNote: '代表內在的光與智慧，是自我探索的旅程。'
  },
  10: {
    name: '命運之輪',
    nameEn: 'La Roue de Fortune',
    upright: '命運、轉變、週期、機會、循環',
    reversed: '厄運、抗拒改變、失控、惡性循環',
    marseilleNote: '代表命運的無常與宇宙的循環法則。'
  },
  11: {
    name: '力量',
    nameEn: 'La Force',
    upright: '力量、勇氣、耐心、慈悲、內在力量',
    reversed: '軟弱、缺乏自信、自我懷疑、失控',
    marseilleNote: '馬賽塔羅中力量為11號牌，代表內在的勇氣與韌性。'
  },
  12: {
    name: '倒吊人',
    nameEn: 'Le Pendu',
    upright: '犧牲、等待、新視角、放下、懸置',
    reversed: '拖延、徒勞、抗拒改變、僵持',
    marseilleNote: '代表自願的犧牲與視角的轉換。'
  },
  13: {
    name: '死神',
    nameEn: 'La Mort',
    upright: '結束、轉變、重生、轉化、放下過去',
    reversed: '抗拒改變、停滯、恐懼、無法放手',
    marseilleNote: '馬賽塔羅的死神牌無名名稱，僅以數字13表示，代表轉化。'
  },
  14: {
    name: '節制',
    nameEn: 'Tempérance',
    upright: '平衡、調和、耐心、中庸、融合',
    reversed: '失衡、極端、缺乏耐心、不協調',
    marseilleNote: '代表調和與平衡，是煉金術的融合過程。'
  },
  15: {
    name: '惡魔',
    nameEn: 'Le Diable',
    upright: '束縛、慾望、物質執著、陰影、誘惑',
    reversed: '解放、面對陰影、打破束束縛、覺察',
    marseilleNote: '代表物質世界的誘惑與靈魂的陰影面。'
  },
  16: {
    name: '高塔',
    nameEn: 'La Maison Dieu',
    upright: '崩塌、突變、啟示、解放、劇變',
    reversed: '抗拒改變、延遲崩潰、內在轉化',
    marseilleNote: '馬賽稱為「La Maison Dieu」（神之屋），代表舊結構的崩解。'
  },
  17: {
    name: '星星',
    nameEn: 'L\'Étoile',
    upright: '希望、靈感、平靜、更新、療癒',
    reversed: '絕望、失去信心、幻滅、缺乏連結',
    marseilleNote: '代表希望與靈性啟迪，是宇宙的指引之光。'
  },
  18: {
    name: '月亮',
    nameEn: 'La Lune',
    upright: '幻覺、潛意識、恐懼、直覺、夢境',
    reversed: '清晰、走出迷惘、面對恐懼、釋放',
    marseilleNote: '代表潛意識的深層探索與直覺的引導。'
  },
  19: {
    name: '太陽',
    nameEn: 'Le Soleil',
    upright: '喜悅、成功、活力、樂觀、光明',
    reversed: '暫時陰霾、過度樂觀、缺乏熱情',
    marseilleNote: '代表生命與意識的光源，是成功與喜悅的象徵。'
  },
  20: {
    name: '審判',
    nameEn: 'Le Jugement',
    upright: '重生、覺醒、審判、召喚、反思',
    reversed: '抗拒轉變、無法放下、自我設限',
    marseilleNote: '代表最終的審判與靈魂的覺醒。'
  },
  21: {
    name: '世界',
    nameEn: 'Le Monde',
    upright: '完成、整合、成就、圓滿、宇宙意識',
    reversed: '未完成、缺乏整合、延遲完成',
    marseilleNote: '代表存在的整體與靈魂的圓滿狀態。'
  }
};

const marseilleMinorMeanings = {
  batons: {
    name: '權杖',
    nameEn: 'Bâtons',
    element: '火',
    cards: {
      1: { upright: '新開始、創造力、機會、事業起步', reversed: '延遲、缺乏方向、能量阻塞' },
      2: { upright: '計劃、選擇、等待、決策', reversed: '優柔寡斷、受阻、缺乏計劃' },
      3: { upright: '合作、成長、擴張、成功', reversed: '驕傲、自負、過度擴張' },
      4: { upright: '穩定、慶祝、和諧、完成', reversed: '過度安逸、停滯、缺乏進展' },
      5: { upright: '衝突、競爭、挑戰、鬥爭', reversed: '和解、避免衝突、內在鬥爭' },
      6: { upright: '勝利、成功、進展、自信', reversed: '驕傲、失敗、自大' },
      7: { upright: '勇氣、堅持、防衛、面對挑戰', reversed: '退縮、缺乏信心、猶豫' },
      8: { upright: '迅速、行動、快速進展', reversed: '延遲、阻礙、缺乏行動' },
      9: { upright: '力量、決心、韌性、不屈不撓', reversed: '軟弱、放棄、缺乏堅持' },
      10: { upright: '負擔、責任、壓力、力量耗盡', reversed: '釋放負擔、卸下責任、逃避' }
    }
  },
  cups: {
    name: '聖杯',
    nameEn: 'Coupes',
    element: '水',
    cards: {
      1: { upright: '新感情、靈感、直覺、情感開始', reversed: '情感阻塞、壓抑、缺乏靈感' },
      2: { upright: '愛情、和諧、連結、伴侶關係', reversed: '不和諧、分離、情感失衡' },
      3: { upright: '歡慶、友誼、情感滿足、豐盛', reversed: '過度享樂、放縱、缺乏深度' },
      4: { upright: '穩定、舒適、情感滿足', reversed: '厭倦、不滿足、情感麻木' },
      5: { upright: '悲傷、失落、痛苦、情感挫折', reversed: '恢復、接受、走出悲傷' },
      6: { upright: '愉悅、滿足、美好回憶、和諧', reversed: '沉溺過去、不切實際、幻滅' },
      7: { upright: '幻象、迷惑、選擇困難', reversed: '清醒、面對現實、做出選擇' },
      8: { upright: '失望、放棄、情感枯竭', reversed: '重新開始、恢復希望、走出低谷' },
      9: { upright: '幸福、願望實現、情感滿足', reversed: '不滿足、貪婪、情感空虛' },
      10: { upright: '圓滿、情感豐盛、和諧家庭', reversed: '情感失落、不滿、關係破裂' }
    }
  },
  swords: {
    name: '寶劍',
    nameEn: 'Épées',
    element: '風',
    cards: {
      1: { upright: '清晰、真理、心智突破、決斷', reversed: '混亂、誤解、思維阻塞' },
      2: { upright: '和平、平衡、選擇、心靈和諧', reversed: '衝突、不和諧、優柔寡斷' },
      3: { upright: '悲傷、痛苦、心碎、失去', reversed: '療癒、釋放、走出痛苦' },
      4: { upright: '休息、和平、恢復、休戰', reversed: '不安、焦慮、無法放鬆' },
      5: { upright: '失敗、衝突、挫折、損失', reversed: '和解、恢復、接受失敗' },
      6: { upright: '理性、成功、智慧運用', reversed: '缺乏邏輯、計劃失敗、短視' },
      7: { upright: '徒勞、無效、計劃失敗', reversed: '重新評估、改變方向、接受現實' },
      8: { upright: '阻礙、限制、困境', reversed: '突破、釋放、找到出路' },
      9: { upright: '痛苦、絕望、折磨', reversed: '希望、解脫、走出黑暗' },
      10: { upright: '毀滅、結束、崩潰', reversed: '重生、恢復、避免災難' }
    }
  },
  coins: {
    name: '金幣',
    nameEn: 'Deniers',
    element: '土',
    cards: {
      1: { upright: '新財富、機會、物質開始', reversed: '物質缺乏、錯失機會、貧乏' },
      2: { upright: '變化、適應、靈活、平衡', reversed: '不穩定、失衡、無法適應' },
      3: { upright: '工作、技能、創作、實現', reversed: '缺乏技能、工作失敗、不滿' },
      4: { upright: '權力、穩定、物質安全', reversed: '貪婪、控制欲、物質執著' },
      5: { upright: '困難、貧乏、挑戰', reversed: '改善、希望、克服困難' },
      6: { upright: '成功、物質豐盛、收穫', reversed: '自私、貪婪、不願分享' },
      7: { upright: '失敗、未完成、失望', reversed: '重新開始、恢復、找到新方向' },
      8: { upright: '謹慎、技能、專注', reversed: '粗心、缺乏專注、倉促' },
      9: { upright: '收穫、成果、物質成功', reversed: '不滿足、貪婪、缺乏成果' },
      10: { upright: '財富、圓滿、物質成就', reversed: '物質損失、家庭問題、遺產糾紛' }
    }
  }
};

const marseilleCourtMeanings = {
  batons: {
    valet: { upright: '訊息、學習、年輕熱情', reversed: '缺乏方向、幼稚、延遲' },
    cavalier: { upright: '行動、追求、冒險、熱情', reversed: '衝動、魯莽、不穩定' },
    reine: { upright: '自信、魅力、熱情、創造力', reversed: '專制、嫉妒、控制欲' },
    roi: { upright: '領導、權威、遠見、事業成功', reversed: '專橫、獨斷、過度控制' }
  },
  cups: {
    valet: { upright: '情感訊息、新關係、溫柔', reversed: '情緒化、不成熟、缺乏方向' },
    cavalier: { upright: '浪漫追求、魅力、情感行動', reversed: '不切實際、情緒不穩、逃避' },
    reine: { upright: '直覺、情感智慧、養育', reversed: '情緒依賴、過度敏感、封閉' },
    roi: { upright: '情感成熟、外交、和諧', reversed: '虛偽、情感操控、不和諧' }
  },
  swords: {
    valet: { upright: '新想法、清晰訊息、分析', reversed: '淺薄、八卦、缺乏深度' },
    cavalier: { upright: '快速行動、果斷、智力追求', reversed: '衝動、魯莽、缺乏思考' },
    reine: { upright: '清晰、理性、獨立思考', reversed: '冷酷、過度批判、情感疏離' },
    roi: { upright: '權威、理性領導、正義', reversed: '專制、僵化、過度理性' }
  },
  coins: {
    valet: { upright: '新機會、學習、實踐', reversed: '缺乏野心、懶惰、浪費' },
    cavalier: { upright: '勤奮、實踐、追求目標', reversed: '無聊、缺乏動力、停滯' },
    reine: { upright: '務實、物質智慧、豐盛', reversed: '過度物質、工作狂、缺乏靈性' },
    roi: { upright: '成功、財富、事業成就', reversed: '物質執著、保守、缺乏彈性' }
  }
};

function getMarseilleCardMeaning(card) {
  if (!card) return null;
  
  if (card.type === 'major') {
    const num = card.number;
    const meaning = marseilleMajorMeanings[num];
    if (!meaning) return null;
    return {
      upright: meaning.upright,
      reversed: meaning.reversed,
      note: meaning.marseilleNote
    };
  }
  
  if (card.type === 'minor' && card.suit) {
    const suitKey = card.suit === 'batons' ? 'batons' 
                  : card.suit === 'cups' ? 'cups'
                  : card.suit === 'swords' ? 'swords'
                  : card.suit === 'coins' ? 'coins' : null;
    if (!suitKey) return null;
    const suitMeanings = marseilleMinorMeanings[suitKey];
    if (!suitMeanings) return null;
    const cardMeaning = suitMeanings.cards[card.number];
    if (!cardMeaning) return null;
    return {
      upright: cardMeaning.upright,
      reversed: cardMeaning.reversed,
      element: suitMeanings.element
    };
  }
  
  if (card.type === 'court' && card.suit) {
    const suitKey = card.suit === 'batons' ? 'batons' 
                  : card.suit === 'cups' ? 'cups'
                  : card.suit === 'swords' ? 'swords'
                  : card.suit === 'coins' ? 'coins' : null;
    if (!suitKey) return null;
    const suitCourts = marseilleCourtMeanings[suitKey];
    if (!suitCourts) return null;
    const courtKey = card.court === '侍從' ? 'valet' 
                   : card.court === '騎士' ? 'cavalier'
                   : card.court === '皇后' ? 'reine'
                   : card.court === '國王' ? 'roi' : null;
    if (!courtKey) return null;
    const courtMeaning = suitCourts[courtKey];
    if (!courtMeaning) return null;
    return {
      upright: courtMeaning.upright,
      reversed: courtMeaning.reversed
    };
  }
  
  return null;
}

function getThothCardMeaning(card) {
  if (!card) return null;
  
  if (card.type === 'major') {
    const num = card.number;
    const meaning = thothMajorMeanings[num];
    if (!meaning) return null;
    return {
      upright: meaning.upright,
      reversed: meaning.reversed,
      note: meaning.thothNote
    };
  }
  
  if (card.type === 'minor' && card.suit) {
    const suitMeanings = thothMinorMeanings[card.suit];
    if (!suitMeanings) return null;
    const cardMeaning = suitMeanings.cards[card.number];
    if (!cardMeaning) return null;
    return {
      upright: cardMeaning.upright,
      reversed: cardMeaning.reversed,
      element: suitMeanings.element
    };
  }
  
  if (card.type === 'court' && card.suit) {
    const suitCourts = thothCourtMeanings[card.suit];
    if (!suitCourts) return null;
    const courtKey = card.court === '公主' ? 'princess' 
                   : card.court === '王子' ? 'prince'
                   : card.court === '皇后' ? 'queen'
                   : card.court === '騎士' ? 'knight' : null;
    if (!courtKey) return null;
    const courtMeaning = suitCourts[courtKey];
    if (!courtMeaning) return null;
    return {
      upright: courtMeaning.upright,
      reversed: courtMeaning.reversed
    };
  }
  
  return null;
}

function getDeckCardMeaning(card, deckType) {
  if (deckType === 'thoth') return getThothCardMeaning(card);
  if (deckType === 'marseille') return getMarseilleCardMeaning(card);
  return null;
}

function getDeckCardImageUrl(card, deckType) {
  if (deckType === 'thoth') return getThothCardImageUrl(card);
  if (deckType === 'marseille') return getMarseilleCardImageUrl(card);
  return null;
}

const thothCardImages = {
  baseUrl: 'assets/tarot/thoth/',
  major: {
    0: 'major-0-fool.jpg',
    1: 'major-1-magus.jpg',
    2: 'major-2-priestess.jpg',
    3: 'major-3-empress.jpg',
    4: 'major-4-emperor.jpg',
    5: 'major-5-hierophant.jpg',
    6: 'major-6-lovers.jpg',
    7: 'major-7-chariot.jpg',
    8: 'major-8-adjustment.jpg',
    9: 'major-9-hermit.jpg',
    10: 'major-10-fortune.jpg',
    11: 'major-11-lust.jpg',
    12: 'major-12-hanged-man.jpg',
    13: 'major-13-death.jpg',
    14: 'major-14-art.jpg',
    15: 'major-15-devil.jpg',
    16: 'major-16-tower.jpg',
    17: 'major-17-star.jpg',
    18: 'major-18-moon.jpg',
    19: 'major-19-sun.jpg',
    20: 'major-20-aeon.jpg',
    21: 'major-21-universe.jpg'
  },
  suits: {
    wands: {
      1: 'wands-1.jpg',
      2: 'wands-2.jpg',
      3: 'wands-3.jpg',
      4: 'wands-4.jpg',
      5: 'wands-5.jpg',
      6: 'wands-6.jpg',
      7: 'wands-7.jpg',
      8: 'wands-8.jpg',
      9: 'wands-9.jpg',
      10: 'wands-10.jpg',
      princess: 'wands-princess.jpg',
      prince: 'wands-prince.jpg',
      queen: 'wands-queen.jpg',
      knight: 'wands-knight.jpg'
    },
    cups: {
      1: 'cups-1.jpg',
      2: 'cups-2.jpg',
      3: 'cups-3.jpg',
      4: 'cups-4.jpg',
      5: 'cups-5.jpg',
      6: 'cups-6.jpg',
      7: 'cups-7.jpg',
      8: 'cups-8.jpg',
      9: 'cups-9.jpg',
      10: 'cups-10.jpg',
      princess: 'cups-princess.jpg',
      prince: 'cups-prince.jpg',
      queen: 'cups-queen.jpg',
      knight: 'cups-knight.jpg'
    },
    swords: {
      1: 'swords-1.jpg',
      2: 'swords-2.jpg',
      3: 'swords-3.jpg',
      4: 'swords-4.jpg',
      5: 'swords-5.jpg',
      6: 'swords-6.jpg',
      7: 'swords-7.jpg',
      8: 'swords-8.jpg',
      9: 'swords-9.jpg',
      10: 'swords-10.jpg',
      princess: 'swords-princess.jpg',
      prince: 'swords-prince.jpg',
      queen: 'swords-queen.jpg',
      knight: 'swords-knight.jpg'
    },
    disks: {
      1: 'disks-1.jpg',
      2: 'disks-2.jpg',
      3: 'disks-3.jpg',
      4: 'disks-4.jpg',
      5: 'disks-5.jpg',
      6: 'disks-6.jpg',
      7: 'disks-7.jpg',
      8: 'disks-8.jpg',
      9: 'disks-9.jpg',
      10: 'disks-10.jpg',
      princess: 'disks-princess.jpg',
      prince: 'disks-prince.jpg',
      queen: 'disks-queen.jpg',
      knight: 'disks-knight.jpg'
    }
  }
};

const marseilleCardImages = {
  baseUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/',
  major: {
    0: '3/37/Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_Excuse.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_Excuse.jpg',
    1: '5/52/Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_01.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_01.jpg',
    2: 'c/cd/Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_02.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_02.jpg',
    3: '5/5a/Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_03.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_03.jpg',
    4: '9/9d/Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_04.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_04.jpg',
    5: 'e/e1/Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_05.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_05.jpg',
    6: '5/5c/Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_06.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_06.jpg',
    7: '9/91/Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_07.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_07.jpg',
    8: '9/9d/Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_08.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_08.jpg',
    9: '0/03/Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_09.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_09.jpg',
    10: '2/23/Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_10.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_10.jpg',
    11: 'f/f3/Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_11.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_11.jpg',
    12: '0/04/Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_12.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_12.jpg',
    13: '3/31/Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_13.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_13.jpg',
    14: 'b/b3/Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_14.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_14.jpg',
    15: 'e/e3/Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_15.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_15.jpg',
    16: '8/87/Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_16.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_16.jpg',
    17: '3/3d/Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_17.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_17.jpg',
    18: 'd/d0/Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_18.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_18.jpg',
    19: '6/66/Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_19.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_19.jpg',
    20: 'e/e6/Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_20.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_20.jpg',
    21: 'a/ae/Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_21.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Trumps_-_21.jpg'
  },
  suits: {
    batons: {
      1: '9/93/Tarot_nouveau_-_Grimaud_-_1898_-_Clubs_-_Ace.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Clubs_-_Ace.jpg',
      2: '0/01/Tarot_nouveau_-_Grimaud_-_1898_-_Clubs_-_02.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Clubs_-_02.jpg',
      3: 'f/f6/Tarot_nouveau_-_Grimaud_-_1898_-_Clubs_-_03.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Clubs_-_03.jpg',
      4: 'd/df/Tarot_nouveau_-_Grimaud_-_1898_-_Clubs_-_04.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Clubs_-_04.jpg',
      5: 'd/da/Tarot_nouveau_-_Grimaud_-_1898_-_Clubs_-_05.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Clubs_-_05.jpg',
      6: '5/59/Tarot_nouveau_-_Grimaud_-_1898_-_Clubs_-_06.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Clubs_-_06.jpg',
      7: '3/39/Tarot_nouveau_-_Grimaud_-_1898_-_Clubs_-_07.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Clubs_-_07.jpg',
      8: 'b/b1/Tarot_nouveau_-_Grimaud_-_1898_-_Clubs_-_08.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Clubs_-_08.jpg',
      9: '2/24/Tarot_nouveau_-_Grimaud_-_1898_-_Clubs_-_09.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Clubs_-_09.jpg',
      10: 'e/e0/Tarot_nouveau_-_Grimaud_-_1898_-_Clubs_-_10.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Clubs_-_10.jpg',
      valet: 'd/d2/Tarot_nouveau_-_Grimaud_-_1898_-_Clubs_-_Jack.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Clubs_-_Jack.jpg',
      cavalier: 'e/ee/Tarot_nouveau_-_Grimaud_-_1898_-_Clubs_-_Knight.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Clubs_-_Knight.jpg',
      reine: '1/11/Tarot_nouveau_-_Grimaud_-_1898_-_Clubs_-_Queen.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Clubs_-_Queen.jpg',
      roi: '5/52/Tarot_nouveau_-_Grimaud_-_1898_-_Clubs_-_King.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Clubs_-_King.jpg'
    },
    cups: {
      1: 'b/b1/Tarot_nouveau_-_Grimaud_-_1898_-_Hearts_-_Ace.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Hearts_-_Ace.jpg',
      2: '4/48/Tarot_nouveau_-_Grimaud_-_1898_-_Hearts_-_02.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Hearts_-_02.jpg',
      3: '1/17/Tarot_nouveau_-_Grimaud_-_1898_-_Hearts_-_03.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Hearts_-_03.jpg',
      4: '1/13/Tarot_nouveau_-_Grimaud_-_1898_-_Hearts_-_04.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Hearts_-_04.jpg',
      5: '0/01/Tarot_nouveau_-_Grimaud_-_1898_-_Hearts_-_05.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Hearts_-_05.jpg',
      6: '9/99/Tarot_nouveau_-_Grimaud_-_1898_-_Hearts_-_06.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Hearts_-_06.jpg',
      7: '1/11/Tarot_nouveau_-_Grimaud_-_1898_-_Hearts_-_07.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Hearts_-_07.jpg',
      8: 'f/f1/Tarot_nouveau_-_Grimaud_-_1898_-_Hearts_-_08.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Hearts_-_08.jpg',
      9: 'a/ae/Tarot_nouveau_-_Grimaud_-_1898_-_Hearts_-_09.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Hearts_-_09.jpg',
      10: '7/7b/Tarot_nouveau_-_Grimaud_-_1898_-_Hearts_-_10.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Hearts_-_10.jpg',
      valet: '4/41/Tarot_nouveau_-_Grimaud_-_1898_-_Hearts_-_Jack.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Hearts_-_Jack.jpg',
      cavalier: '8/81/Tarot_nouveau_-_Grimaud_-_1898_-_Hearts_-_Knight.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Hearts_-_Knight.jpg',
      reine: 'b/bf/Tarot_nouveau_-_Grimaud_-_1898_-_Hearts_-_Queen.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Hearts_-_Queen.jpg',
      roi: 'a/a4/Tarot_nouveau_-_Grimaud_-_1898_-_Hearts_-_King.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Hearts_-_King.jpg'
    },
    swords: {
      1: 'e/ef/Tarot_nouveau_-_Grimaud_-_1898_-_Spades_-_Ace.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Spades_-_Ace.jpg',
      2: 'd/d6/Tarot_nouveau_-_Grimaud_-_1898_-_Spades_-_02.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Spades_-_02.jpg',
      3: 'c/c3/Tarot_nouveau_-_Grimaud_-_1898_-_Spades_-_03.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Spades_-_03.jpg',
      4: 'e/eb/Tarot_nouveau_-_Grimaud_-_1898_-_Spades_-_04.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Spades_-_04.jpg',
      5: '9/99/Tarot_nouveau_-_Grimaud_-_1898_-_Spades_-_05.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Spades_-_05.jpg',
      6: 'a/a2/Tarot_nouveau_-_Grimaud_-_1898_-_Spades_-_06.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Spades_-_06.jpg',
      7: '2/20/Tarot_nouveau_-_Grimaud_-_1898_-_Spades_-_07.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Spades_-_07.jpg',
      8: 'e/ee/Tarot_nouveau_-_Grimaud_-_1898_-_Spades_-_08.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Spades_-_08.jpg',
      9: '9/9c/Tarot_nouveau_-_Grimaud_-_1898_-_Spades_-_09.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Spades_-_09.jpg',
      10: '7/75/Tarot_nouveau_-_Grimaud_-_1898_-_Spades_-_10.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Spades_-_10.jpg',
      valet: 'b/b1/Tarot_nouveau_-_Grimaud_-_1898_-_Spades_-_Jack.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Spades_-_Jack.jpg',
      cavalier: '9/91/Tarot_nouveau_-_Grimaud_-_1898_-_Spades_-_Knight.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Spades_-_Knight.jpg',
      reine: '8/88/Tarot_nouveau_-_Grimaud_-_1898_-_Spades_-_Queen.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Spades_-_Queen.jpg',
      roi: '2/24/Tarot_nouveau_-_Grimaud_-_1898_-_Spades_-_King.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Spades_-_King.jpg'
    },
    coins: {
      1: '6/6e/Tarot_nouveau_-_Grimaud_-_1898_-_Diamonds_-_Ace.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Diamonds_-_Ace.jpg',
      2: '2/25/Tarot_nouveau_-_Grimaud_-_1898_-_Diamonds_-_02.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Diamonds_-_02.jpg',
      3: '2/29/Tarot_nouveau_-_Grimaud_-_1898_-_Diamonds_-_03.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Diamonds_-_03.jpg',
      4: '2/28/Tarot_nouveau_-_Grimaud_-_1898_-_Diamonds_-_04.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Diamonds_-_04.jpg',
      5: 'a/aa/Tarot_nouveau_-_Grimaud_-_1898_-_Diamonds_-_05.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Diamonds_-_05.jpg',
      6: '6/65/Tarot_nouveau_-_Grimaud_-_1898_-_Diamonds_-_06.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Diamonds_-_06.jpg',
      7: '4/4e/Tarot_nouveau_-_Grimaud_-_1898_-_Diamonds_-_07.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Diamonds_-_07.jpg',
      8: '8/87/Tarot_nouveau_-_Grimaud_-_1898_-_Diamonds_-_08.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Diamonds_-_08.jpg',
      9: '0/0b/Tarot_nouveau_-_Grimaud_-_1898_-_Diamonds_-_09.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Diamonds_-_09.jpg',
      10: '8/8e/Tarot_nouveau_-_Grimaud_-_1898_-_Diamonds_-_10.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Diamonds_-_10.jpg',
      valet: 'c/c7/Tarot_nouveau_-_Grimaud_-_1898_-_Diamonds_-_Jack.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Diamonds_-_Jack.jpg',
      cavalier: '9/9e/Tarot_nouveau_-_Grimaud_-_1898_-_Diamonds_-_Knight.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Diamonds_-_Knight.jpg',
      reine: '7/77/Tarot_nouveau_-_Grimaud_-_1898_-_Diamonds_-_Queen.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Diamonds_-_Queen.jpg',
      roi: 'd/dd/Tarot_nouveau_-_Grimaud_-_1898_-_Diamonds_-_King.jpg/250px-Tarot_nouveau_-_Grimaud_-_1898_-_Diamonds_-_King.jpg'
    }
  }
};

function getMarseilleCardImageUrl(card) {
  if (!card) return null;
  
  if (card.type === 'major') {
    const path = marseilleCardImages.major[card.number];
    if (path) return marseilleCardImages.baseUrl + path;
  }
  
  if (card.type === 'minor' && card.suit) {
    const suitKey = card.suit === 'batons' ? 'batons' 
                  : card.suit === 'cups' ? 'cups'
                  : card.suit === 'swords' ? 'swords'
                  : card.suit === 'coins' ? 'coins' : null;
    if (suitKey) {
      const suitImages = marseilleCardImages.suits[suitKey];
      if (suitImages && suitImages[card.number]) {
        return marseilleCardImages.baseUrl + suitImages[card.number];
      }
    }
  }
  
  if (card.type === 'court' && card.suit) {
    const suitKey = card.suit === 'batons' ? 'batons' 
                  : card.suit === 'cups' ? 'cups'
                  : card.suit === 'swords' ? 'swords'
                  : card.suit === 'coins' ? 'coins' : null;
    if (suitKey) {
      const suitImages = marseilleCardImages.suits[suitKey];
      const courtKey = card.court === '侍從' ? 'valet' 
                     : card.court === '騎士' ? 'cavalier'
                     : card.court === '皇后' ? 'reine'
                     : card.court === '國王' ? 'roi' : null;
      if (suitImages && courtKey && suitImages[courtKey]) {
        return marseilleCardImages.baseUrl + suitImages[courtKey];
      }
    }
  }
  
  return null;
}

function getThothCardImageUrl(card) {
  return null;
}

const spreadConfigs = {
  single: {
    name: '單張指引',
    slots: [{ position: 'center', label: '指引' }],
    description: '單張牌提供當下的指引與建議'
  },
  three: {
    name: '三張牌陣',
    slots: [
      { position: 'left', label: '過去' },
      { position: 'center', label: '現在' },
      { position: 'right', label: '未來' }
    ],
    description: '時間流牌陣，看事情的發展脈絡'
  },
  celtic: {
    name: '塞爾特十字',
    slots: [
      { position: 'center', label: '現狀' },
      { position: 'top', label: '挑戰' },
      { position: 'right', label: '意識' },
      { position: 'bottom', label: '根基' },
      { position: 'left', label: '過去' },
      { position: 'far-right', label: '近期未來' },
      { position: 'row-1', label: '自我' },
      { position: 'row-2', label: '環境' },
      { position: 'row-3', label: '希望與恐懼' },
      { position: 'row-4', label: '結果' }
    ],
    description: '經典全面分析牌陣'
  },
  relationship: {
    name: '關係牌陣',
    slots: [
      { position: 'left', label: '你' },
      { position: 'right', label: '對方' },
      { position: 'top', label: '關係現狀' },
      { position: 'center', label: '關係基礎' },
      { position: 'bottom', label: '挑戰' },
      { position: 'far-left', label: '你的需求' },
      { position: 'far-right', label: '對方需求' }
    ],
    description: '分析雙方關係的互動與發展'
  },
  decision: {
    name: '二選一牌陣',
    slots: [
      { position: 'top', label: '現狀' },
      { position: 'left-1', label: '選項A' },
      { position: 'left-2', label: 'A的結果' },
      { position: 'right-1', label: '選項B' },
      { position: 'right-2', label: 'B的結果' },
      { position: 'bottom', label: '建議' }
    ],
    description: '幫助在兩個選項間做決定'
  }
};

let tarotGameState = {
  phase: 'setup',
  deckType: 'rws',
  deck: [],
  shuffleCount: 0,
  cutPosition: null,
  spreadCards: [],
  selectedCards: [],
  cardBack: 'default',
  customCardBack: null,
  showReversed: true
};

const timeBranchMap = {
  子: '子時',
  丑: '丑時',
  寅: '寅時',
  卯: '卯時',
  辰: '辰時',
  巳: '巳時',
  午: '午時',
  未: '未時',
  申: '申時',
  酉: '酉時',
  戌: '戌時',
  亥: '亥時'
};

async function loadZiweiLibrary() {
  if (ziweiLib || ziweiLibError) return ziweiLib;
  try {
    ziweiLib = await import('fortel-ziweidoushu');
    return ziweiLib;
  } catch (error) {
    ziweiLibError = error;
    return null;
  }
}

function resolveBornTimeGround(branchValue, DayTimeGround) {
  const groundLabel = timeBranchMap[branchValue] || '子時';
  return DayTimeGround.getByName(groundLabel);
}

function getGanzhiOrError(label, value) {
  if (!value) return `${label}未填寫。`;
  if (value.length !== 2) return `${label}格式需為兩字（天干+地支）。`;
  return null;
}

const ziweiZenithApiEndpoint = 'http://localhost:8083/api/v1/calculate';

const ziweiPalaceOrder = [
  '命宮', '兄弟宮', '夫妻宮', '子女宮',
  '財帛宮', '疾厄宮', '遷移宮', '交友宮',
  '官祿宮', '田宅宮', '福德宮', '父母宮'
];

function buildZiweiZenithPayload({ dateText, timeText, gender, calendarType, isLeap }) {
  if (!dateText || !timeText) return null;
  const [yearText, monthText, dayText] = dateText.split('-');
  const [hourText, minuteText] = timeText.split(':');
  const year = Number.parseInt(yearText, 10);
  const month = Number.parseInt(monthText, 10);
  const day = Number.parseInt(dayText, 10);
  const hour = Number.parseInt(hourText, 10);
  const minute = Number.parseInt(minuteText || '0', 10);
  if (!year || !month || !day || Number.isNaN(hour)) return null;
  return {
    year,
    month,
    day,
    hour,
    minute,
    gender: gender === 'M' ? 'male' : 'female',
    is_lunar: calendarType === 'lunar',
    is_leap: Boolean(isLeap),
    is_dst: false
  };
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

async function analyzeZiweiByImage({ imageUrl, profileText = '', externalNote = '' }) {
  if (!ziweiAnalysisNote || !ziweiAnalysisResult) return false;
  if (!imageUrl) return false;

  const config = getActiveApiConfig();
  if (!config?.url) {
    ziweiAnalysisNote.textContent = '圖片辨識分析失敗：未設定可用 API。';
    ziweiAnalysisResult.textContent = '請先到設定中配置可用的 AI API（支援圖像辨識）。';
    return false;
  }

  const targetUrl = buildChatCompletionsUrl(config.url);
  const prompt = [
    '你是紫微斗數助手。請讀取這張命盤圖片並輸出重點分析。',
    '請依序給出：1) 命宮重點 2) 事業財運 3) 感情人際 4) 近期待辦建議（3點）',
    profileText ? `已知出生資訊：${profileText}` : '',
    externalNote ? `使用者補充：${externalNote}` : ''
  ].filter(Boolean).join('\n');

  ziweiAnalysisNote.textContent = '圖片辨識分析中...';
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
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ]
      })
    });

    let data = null;
    try {
      data = await response.json();
    } catch (parseError) {
      data = null;
    }

    const apiErrorMessage = data?.error?.message || data?.message || '';
    if (!response.ok) {
      throw new Error(apiErrorMessage || `HTTP ${response.status}`);
    }
    if (apiErrorMessage) {
      throw new Error(apiErrorMessage);
    }

    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error('模型未回傳可讀內容');

    ziweiAnalysisNote.textContent = '已完成圖片辨識分析。';
    ziweiAnalysisResult.textContent = String(text);
    return true;
  } catch (error) {
    const errorText = String(error?.message || error || '');
    const isVisionUnsupported = /does not support image input|vision|image input|cannot read image/i.test(errorText);

    if (isVisionUnsupported) {
      ziweiAnalysisNote.textContent = '目前模型不支援圖片辨識。';
      ziweiAnalysisResult.textContent = '請在 Settings 改用支援 Vision 的模型；或直接把命盤每一格文字（含宮位）貼到「排盤文字摘要」後再分析。';
      return false;
    }

    ziweiAnalysisNote.textContent = '圖片辨識分析失敗。';
    ziweiAnalysisResult.textContent = `錯誤：${errorText}`;
    return false;
  }
}

async function analyzeZiweiProfile({ dateText, timeText, gender, calendarType, isLeap }) {
  if (!ziweiAnalysisNote || !ziweiAnalysisResult) return;

  ziweiAnalysisNote.textContent = '分析中...';
  ziweiAnalysisResult.textContent = '';

  const payload = buildZiweiZenithPayload({ dateText, timeText, gender, calendarType, isLeap });
  if (!payload) {
    ziweiAnalysisNote.textContent = '請先填寫完整的出生日期與時間。';
    return;
  }

  try {
    const response = await fetch(ziweiZenithApiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const summary = data?.interpretation?.summary || '';
    ziweiAnalysisNote.textContent = '已完成紫微斗數分析摘要。';
    ziweiAnalysisResult.textContent = summary || '已收到排盤資料，但沒有摘要內容。';
  } catch (error) {
    const imageUrl = ziweiResultImageInput?.value?.trim() || '';
    const profileText = `${dateText} ${timeText} / ${gender === 'M' ? '男' : '女'} / ${calendarType === 'lunar' ? '農曆' : '國曆'}${isLeap ? '閏月' : ''}`;
    const fallbackOk = await analyzeZiweiByImage({
      imageUrl,
      profileText,
      externalNote: ziweiResultNoteInput?.value?.trim() || ''
    });
    if (!fallbackOk) {
      ziweiAnalysisNote.textContent = '排盤分析失敗，請確認已啟動本機 ziwei-zenith 服務或提供可辨識的命盤圖片。';
      ziweiAnalysisResult.textContent = String(error);
    }
  }
}

async function buildZiweiBoardFromInputs() {
  const dateText = eastBirthDateInput?.value;
  const timeText = eastBirthTimeInput?.value;
  if (!dateText || !timeText || !eastBirthGenderSelect || !eastCalendarTypeSelect || !eastLunarLeapSelect) {
    return { error: '請先填寫完整的出生日期與時間。' };
  }

  const payload = buildZiweiZenithPayload({
    dateText,
    timeText,
    gender: eastBirthGenderSelect.value,
    calendarType: eastCalendarTypeSelect.value,
    isLeap: eastLunarLeapSelect.value === 'true'
  });

  if (!payload) {
    return { error: '請先填寫完整的出生日期與時間。' };
  }

  return { apiPayload: payload };
}

async function renderZiweiBoard() {
  if (!ziweiResultEl || !ziweiDetailEl) return;
  const board = await buildZiweiBoardFromInputs();
  if (!board || board.error) {
    const message = board?.error || '請先填寫完整的出生日期與時間。';
    ziweiResultEl.textContent = message;
    ziweiDetailEl.textContent = '尚未排盤';
    return;
  }

  ziweiResultEl.textContent = '已取得排盤請求資料，可進行分析。';
  ziweiDetailEl.textContent = JSON.stringify(board.apiPayload, null, 2);
}

function getDisplayStars(palaceData = {}) {
  const stars = Array.isArray(palaceData.stars) ? palaceData.stars : [];
  const assistants = Array.isArray(palaceData.assistant_stars) ? palaceData.assistant_stars : [];
  const secondary = Array.isArray(palaceData.secondary_stars) ? palaceData.secondary_stars : [];
  return [...stars, ...assistants, ...secondary].filter(Boolean);
}

function drawZiweiChartImage(chartData, profile) {
  const palaces = chartData?.palaces || {};
  const width = 1320;
  const height = 1800;
  const margin = 52;
  const cols = 3;
  const rows = 4;
  const headerHeight = 210;
  const gridTop = margin + headerHeight;
  const gridHeight = height - gridTop - margin;
  const cellW = (width - margin * 2) / cols;
  const cellH = gridHeight / rows;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#1a1d3c');
  grad.addColorStop(1, '#0f1129');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#f4f6ff';
  ctx.font = '700 46px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
  ctx.fillText('紫微斗數內建排盤', margin, margin + 52);

  const metaLines = [
    `生日：${profile.dateText} ${profile.timeText}`,
    `性別：${profile.gender === 'M' ? '男' : '女'}　曆法：${profile.calendarType === 'lunar' ? '農曆' : '國曆'}${profile.isLeap ? '（閏月）' : ''}`,
    `生成時間：${new Date().toLocaleString('zh-Hant')}`
  ];
  ctx.font = '500 25px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
  ctx.fillStyle = '#c9d1ff';
  metaLines.forEach((line, i) => {
    ctx.fillText(line, margin, margin + 102 + i * 34);
  });

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const idx = r * cols + c;
      const palaceName = ziweiPalaceOrder[idx];
      const data = palaces[palaceName] || {};
      const x = margin + c * cellW;
      const y = gridTop + r * cellH;

      ctx.fillStyle = 'rgba(42, 47, 95, 0.88)';
      ctx.fillRect(x + 4, y + 4, cellW - 8, cellH - 8);
      ctx.strokeStyle = 'rgba(131, 146, 255, 0.45)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 4, y + 4, cellW - 8, cellH - 8);

      const branch = data.branch || '—';
      const palaceGan = data.palace_gan || '—';
      const stars = getDisplayStars(data);

      ctx.fillStyle = '#ffffff';
      ctx.font = '700 28px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
      ctx.fillText(palaceName, x + 18, y + 38);

      ctx.fillStyle = '#b9c4ff';
      ctx.font = '500 20px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
      ctx.fillText(`${palaceGan}・${branch}`, x + 18, y + 68);

      ctx.fillStyle = '#e8ecff';
      ctx.font = '500 20px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
      const lines = stars.length ? stars : ['（無星曜資料）'];
      let lineY = y + 100;
      lines.slice(0, 8).forEach((star) => {
        ctx.fillText(`• ${star}`, x + 18, lineY);
        lineY += 26;
      });
    }
  }

  return canvas.toDataURL('image/png');
}

async function buildZiweiChartImage() {
  if (!ziweiChartNote || !ziweiChartImage) return;

  const dateText = eastBirthDateInput?.value || '';
  const timeText = eastBirthTimeInput?.value || '';
  const gender = eastBirthGenderSelect?.value || 'F';
  const calendarType = eastCalendarTypeSelect?.value || 'solar';
  const isLeap = eastLunarLeapSelect?.value === 'true';

  const payload = buildZiweiZenithPayload({ dateText, timeText, gender, calendarType, isLeap });
  if (!payload) {
    ziweiChartNote.textContent = '請先填寫完整的出生日期與時間，再產生內建排盤。';
    return;
  }

  ziweiChartNote.textContent = '內建排盤生成中...';
  try {
    const response = await fetch(ziweiZenithApiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const imageData = drawZiweiChartImage(data, { dateText, timeText, gender, calendarType, isLeap });
    if (!imageData) {
      throw new Error('無法建立圖片畫布');
    }

    ziweiChartImage.src = imageData;
    ziweiChartImage.classList.remove('is-hidden');
    ziweiChartImage.dataset.fileName = `ziwei-${dateText || 'chart'}-${timeText?.replace(':', '') || '0000'}.png`;
    ziweiChartNote.textContent = '已生成內建排盤圖片，可直接下載。';
  } catch (error) {
    ziweiChartNote.textContent = '內建排盤失敗，請確認本機 ziwei-zenith 服務已啟動。';
    console.warn('Failed to build built-in ziwei chart image', error);
  }
}

function downloadZiweiChartImage() {
  if (!ziweiChartImage?.src) {
    if (ziweiChartNote) ziweiChartNote.textContent = '尚未有可下載的排盤圖片。';
    return;
  }
  const a = document.createElement('a');
  a.href = ziweiChartImage.src;
  a.download = ziweiChartImage.dataset.fileName || `ziwei-chart-${Date.now()}.png`;
  a.click();
}

const oceanTonePresets = {
  soft: { frequency: 620, q: 0.6, gain: 0.12 },
  deep: { frequency: 420, q: 0.85, gain: 0.14 },
  bright: { frequency: 920, q: 0.5, gain: 0.1 }
};

function setOceanTone(toneKey) {
  if (!oceanFilter || !oceanGain) return;
  const preset = oceanTonePresets[toneKey] || oceanTonePresets.soft;
  oceanFilter.frequency.setTargetAtTime(preset.frequency, oceanAudioContext.currentTime, 0.2);
  oceanFilter.Q.setTargetAtTime(preset.q, oceanAudioContext.currentTime, 0.2);
  oceanGain.gain.setTargetAtTime(preset.gain * getVolumeScale(oceanVolumeInput?.value), oceanAudioContext.currentTime, 0.2);
}

function getVolumeScale(value) {
  const numeric = Number.parseInt(value, 10);
  if (Number.isNaN(numeric)) return 1;
  return Math.min(Math.max(numeric / 100, 0), 1);
}

function setOceanVolume(value) {
  if (!oceanGain) return;
  const toneKey = oceanToneSelect?.value || 'soft';
  const preset = oceanTonePresets[toneKey] || oceanTonePresets.soft;
  oceanGain.gain.setTargetAtTime(preset.gain * getVolumeScale(value), oceanAudioContext.currentTime, 0.15);
}

function setNoiseEnabled(enabled) {
  if (!noiseGain) return;
  const target = enabled ? 0.08 * getVolumeScale(noiseVolumeInput?.value) : 0;
  noiseGain.gain.setTargetAtTime(target, oceanAudioContext.currentTime, 0.2);
}

function setNoiseVolume(value) {
  if (!noiseGain) return;
  const enabled = noiseToggleSelect?.value === 'on';
  const target = enabled ? 0.08 * getVolumeScale(value) : 0;
  noiseGain.gain.setTargetAtTime(target, oceanAudioContext.currentTime, 0.15);
}

function startOceanSound() {
  if (oceanAudioContext) return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  oceanAudioContext = new AudioCtx();

  const bufferSize = 2 * oceanAudioContext.sampleRate;
  oceanNoiseBuffer = oceanAudioContext.createBuffer(1, bufferSize, oceanAudioContext.sampleRate);
  const output = oceanNoiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    output[i] = Math.random() * 2 - 1;
  }

  oceanSource = oceanAudioContext.createBufferSource();
  oceanSource.buffer = oceanNoiseBuffer;
  oceanSource.loop = true;

  oceanFilter = oceanAudioContext.createBiquadFilter();
  oceanFilter.type = 'lowpass';

  oceanGain = oceanAudioContext.createGain();
  oceanGain.gain.value = 0;

  oceanSource.connect(oceanFilter);
  oceanFilter.connect(oceanGain);
  oceanGain.connect(oceanAudioContext.destination);
  oceanSource.start(0);

  noiseBuffer = oceanAudioContext.createBuffer(1, bufferSize, oceanAudioContext.sampleRate);
  const noiseOutput = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    noiseOutput[i] = Math.random() * 2 - 1;
  }

  noiseSource = oceanAudioContext.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  noiseSource.loop = true;

  noiseGain = oceanAudioContext.createGain();
  noiseGain.gain.value = 0;

  noiseSource.connect(noiseGain);
  noiseGain.connect(oceanAudioContext.destination);
  noiseSource.start(0);

  setOceanTone(oceanToneSelect?.value || 'soft');
  setOceanVolume(oceanVolumeInput?.value ?? 45);
  setNoiseEnabled(noiseToggleSelect?.value === 'on');
  setNoiseVolume(noiseVolumeInput?.value ?? 25);
}

function getSpreadCount() {
  const spread = tarotSpreadSelect?.value || 'single';
  if (spread === 'five') return 5;
  if (spread === 'three') return 3;
  return 1;
}

function showHome() {
  homeView.classList.remove('hidden');
  Object.values(methodPages).forEach(page => page?.classList.add('hidden'));
}

function showMethodPage(methodKey) {
  const target = methodPages[methodKey];
  if (!target) return;
  homeView.classList.add('hidden');
  Object.values(methodPages).forEach(page => page?.classList.add('hidden'));
  target.classList.remove('hidden');
}

function renderMethods() {}

function computeSeed(text = '') {
  return [...text].reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function pickBySeed(list, seed) {
  if (!list.length) return '';
  return list[seed % list.length];
}

function generateSimpleReading(methodKey, question) {
  const seed = computeSeed(`${methodKey}|${question}|${new Date().toDateString()}`);
  const score = 52 + (seed % 45);
  const text = pickBySeed(fortuneTemplates[methodKey], seed);
  return `運勢指數 ${score}/100。${text}`;
}

const flowYearHints = [
  '今年節奏偏「先整合後擴張」，宜先穩住核心目標。',
  '今年屬於佈局年，前期打底會直接影響下半年成果。',
  '今年運勢重點在「調整方向」，主動修正可避開耗損。'
];

const flowMonthHints = [
  '本月適合整理人際與合作分工，減少資訊噪音。',
  '本月容易出現節點機會，建議先做小規模試行。',
  '本月宜保守前進，先把資源配置到最關鍵的事情。'
];

const flowDayHints = [
  '今日行動重點是「先確認邊界」，再投入執行。',
  '今日宜先處理待辦中的卡點，避免情緒化決策。',
  '今日適合收斂目標，聚焦一件事最容易看到進展。'
];

function toNoonDateFromText(dateText) {
  if (!dateText) return null;
  const d = new Date(`${dateText}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function getSolarTermMarkers(year, targetDate, getAllTermsFn) {
  const terms = getAllTermsFn(new Date(year, 0, 1, 12, 0, 0).getTime()) || [];
  const markers = terms
    .map((item) => {
      const date = new Date(year, (item.month || 1) - 1, item.day || 1, 12, 0, 0);
      return { ...item, ts: date.getTime() };
    })
    .sort((a, b) => a.ts - b.ts);

  if (!markers.length || !targetDate) {
    return { currentTerm: null, nextTerm: null, terms: markers };
  }

  const ts = targetDate.getTime();
  let currentTerm = markers[0];
  let nextTerm = markers[0];
  for (let i = 0; i < markers.length; i += 1) {
    const item = markers[i];
    if (item.ts <= ts) currentTerm = item;
    if (item.ts > ts) {
      nextTerm = item;
      break;
    }
    if (i === markers.length - 1) {
      nextTerm = markers[0];
    }
  }
  return { currentTerm, nextTerm, terms: markers };
}

async function renderFlowAlmanacReading() {
  if (!flowAlmanacResultEl || !flowAlmanacDetailEl || !flowAlmanacNoteEl) return;

  const lunarToolkit = await loadLunarToolkit();
  if (!lunarToolkit?.lunar || !lunarToolkit?.getAllTerms) {
    flowAlmanacNoteEl.textContent = '農民曆功能載入失敗（lunar-ts unavailable）。';
    flowAlmanacResultEl.textContent = '尚未分析';
    flowAlmanacDetailEl.textContent = '請檢查 lunar-ts 是否可從本頁面路徑載入。';
    return;
  }

  const dateText = flowAlmanacDateInput?.value || '';
  const yearText = flowAlmanacYearInput?.value || '';
  const question = flowAlmanacQuestionInput?.value?.trim() || '近期整體流運如何？';

  const targetDate = toNoonDateFromText(dateText);
  const targetYear = Number.parseInt(yearText, 10);
  if (!targetDate || !Number.isFinite(targetYear) || targetYear < 1900 || targetYear > 2100) {
    flowAlmanacNoteEl.textContent = '請先填入有效的參考日期與參考年度（1900-2100）。';
    flowAlmanacResultEl.textContent = '尚未分析';
    flowAlmanacDetailEl.textContent = '尚未分析';
    return;
  }

  const dayLunar = lunarToolkit.lunar(targetDate);
  const yearLunar = lunarToolkit.lunar(new Date(targetYear, 0, 1, 12, 0, 0));
  if (!dayLunar?.isValid || !yearLunar?.isValid) {
    flowAlmanacNoteEl.textContent = '農民曆資料取得失敗，請調整日期。';
    flowAlmanacResultEl.textContent = '尚未分析';
    flowAlmanacDetailEl.textContent = '尚未分析';
    return;
  }

  const { currentTerm, nextTerm, terms } = getSolarTermMarkers(targetYear, targetDate, lunarToolkit.getAllTerms);
  const dayTermText = dayLunar.term || (currentTerm?.name ? `當前節令：${currentTerm.name}` : '當日無節氣交接');

  const yearSeed = computeSeed(`${question}|year|${targetYear}|${yearLunar.ganzhi.year || ''}`);
  const monthSeed = computeSeed(`${question}|month|${targetDate.getFullYear()}-${targetDate.getMonth() + 1}|${dayTermText}`);
  const daySeed = computeSeed(`${question}|day|${dateText}|${dayLunar.ganzhi.year || ''}`);

  const yearScore = 58 + (yearSeed % 38);
  const monthScore = 55 + (monthSeed % 40);
  const dayScore = 52 + (daySeed % 42);

  const yearHint = pickBySeed(flowYearHints, yearSeed);
  const monthHint = pickBySeed(flowMonthHints, monthSeed);
  const dayHint = pickBySeed(flowDayHints, daySeed);

  flowAlmanacNoteEl.textContent = '已依據農民曆（農曆日期 / 歲次 / 節氣）完成流運分析。';
  flowAlmanacResultEl.textContent = `流年 ${yearScore}/100、流月 ${monthScore}/100、流日 ${dayScore}/100。`; 

  const termsPreview = terms.slice(0, 8).map(item => `${item.name}(${item.month}/${item.day})`).join('、');
  flowAlmanacDetailEl.textContent = [
    `分析主題：${question}`,
    `參考日期：${dateText}（農曆 ${dayLunar.year}年${dayLunar.month}月${dayLunar.day}日${dayLunar.isLeap ? '・閏月' : ''}）`,
    `流日歲次：${dayLunar.ganzhi.year || '—'}年`,
    `當日/當前節令：${dayTermText}`,
    `下一節氣：${nextTerm?.name ? `${nextTerm.name}（${nextTerm.month}/${nextTerm.day}）` : '—'}`,
    '',
    `流年（${targetYear}）：${yearScore}/100`,
    `- ${yearHint}`,
    `流月（${targetDate.getMonth() + 1}月）：${monthScore}/100`,
    `- ${monthHint}`,
    `流日（${targetDate.getDate()}日）：${dayScore}/100`,
    `- ${dayHint}`,
    '',
    `年度節氣摘要：${termsPreview || '無'}`
  ].join('\n');
}

function seedFlowAlmanacDefaults() {
  const now = new Date();
  const nowDateText = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (flowAlmanacDateInput && !flowAlmanacDateInput.value) flowAlmanacDateInput.value = nowDateText;
  if (flowAlmanacYearInput && !flowAlmanacYearInput.value) flowAlmanacYearInput.value = String(now.getFullYear());
}

function modToOneBased(value, base) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  const r = n % base;
  return r === 0 ? base : r;
}

function getBaguaByNumber(value) {
  const idx = modToOneBased(value, 8);
  if (!idx) return null;
  return baguaByIndex[idx] || null;
}

function findBaguaByLines(lines) {
  const values = Object.values(baguaByIndex);
  return values.find(item => item.lines.join(',') === lines.join(',')) || null;
}

function formatYaoLine(isYang) {
  return isYang ? '──────' : '──  ──';
}

function getElementRelation(upperElement, lowerElement) {
  const generateMap = {
    木: '火',
    火: '土',
    土: '金',
    金: '水',
    水: '木'
  };
  const controlMap = {
    木: '土',
    土: '水',
    水: '火',
    火: '金',
    金: '木'
  };

  if (upperElement === lowerElement) {
    return {
      title: '比和',
      message: '上下卦五行同氣，事情可穩步推進，重點在持續。'
    };
  }
  if (generateMap[upperElement] === lowerElement) {
    return {
      title: '上生下',
      message: '外在條件支持你，適合主動推進。'
    };
  }
  if (generateMap[lowerElement] === upperElement) {
    return {
      title: '下生上',
      message: '需先打好內部基礎，再向外發展。'
    };
  }
  if (controlMap[upperElement] === lowerElement) {
    return {
      title: '上剋下',
      message: '壓力偏大，先避開正面衝突，調整策略更有利。'
    };
  }
  if (controlMap[lowerElement] === upperElement) {
    return {
      title: '下剋上',
      message: '內外目標拉扯，先統一方向再行動。'
    };
  }
  return {
    title: '中平',
    message: '卦象訊號中性，建議保守觀察。'
  };
}

function buildMeihuaFromInputs() {
  const mode = meihuaCastModeSelect?.value || 'time';
  const movingMode = meihuaMovingModeSelect?.value || 'auto';
  const question = meihuaQuestionInput?.value.trim() || '近期此事發展如何？';

  let upperSource = 0;
  let lowerSource = 0;
  let movingSource = 0;
  let basisText = '';

  if (mode === 'number') {
    const a = Number.parseInt(meihuaNumberAInput?.value || '', 10);
    const b = Number.parseInt(meihuaNumberBInput?.value || '', 10);
    if (!Number.isFinite(a) || a <= 0 || !Number.isFinite(b) || b <= 0) {
      return { error: '數字起卦需填寫有效的上卦數與下卦數（正整數）。' };
    }
    upperSource = a;
    lowerSource = b;
    movingSource = a + b + computeSeed(question);
    basisText = `數字起卦（上卦數 ${a}、下卦數 ${b}）`;
  } else {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const d = now.getDate();
    const h = now.getHours();
    const min = now.getMinutes();
    upperSource = y + m + d;
    lowerSource = y + m + d + h;
    movingSource = y + m + d + h + min;
    basisText = `時間起卦（${now.toLocaleString('zh-Hant')})`;
  }

  const upper = getBaguaByNumber(upperSource);
  const lower = getBaguaByNumber(lowerSource);
  if (!upper || !lower) {
    return { error: '起卦失敗，請檢查輸入條件。' };
  }

  let movingLine = modToOneBased(movingSource, 6);
  if (movingMode === 'manual') {
    const manual = Number.parseInt(meihuaMovingLineInput?.value || '', 10);
    if (!Number.isFinite(manual) || manual < 1 || manual > 6) {
      return { error: '手動指定動爻時，請輸入 1 到 6。' };
    }
    movingLine = manual;
  }

  const baseLines = [...lower.lines, ...upper.lines];
  const changedLines = [...baseLines];
  changedLines[movingLine - 1] = changedLines[movingLine - 1] ? 0 : 1;

  const changedLower = findBaguaByLines(changedLines.slice(0, 3));
  const changedUpper = findBaguaByLines(changedLines.slice(3, 6));
  if (!changedLower || !changedUpper) {
    return { error: '變卦推算失敗，請重新起卦。' };
  }

  const relation = getElementRelation(upper.element, lower.element);
  return {
    question,
    basisText,
    movingLine,
    upper,
    lower,
    changedUpper,
    changedLower,
    baseLines,
    changedLines,
    relation
  };
}

function renderMeihuaReading() {
  if (!meihuaResultEl || !meihuaDetailEl || !meihuaCastNote) return;

  const result = buildMeihuaFromInputs();
  if (result.error) {
    meihuaCastNote.textContent = result.error;
    meihuaResultEl.textContent = '尚未起卦';
    meihuaDetailEl.textContent = '尚未起卦';
    return;
  }

  const baseHexagram = `${result.upper.symbol}${result.lower.symbol}（${result.upper.name}上${result.lower.name}下）`;
  const changedHexagram = `${result.changedUpper.symbol}${result.changedLower.symbol}（${result.changedUpper.name}上${result.changedLower.name}下）`;
  meihuaCastNote.textContent = `${result.basisText}，第 ${result.movingLine} 爻動。`;
  meihuaResultEl.textContent = `本卦 ${baseHexagram}，變卦 ${changedHexagram}。${result.relation.message}`;

  const baseVisual = [
    formatYaoLine(result.baseLines[5]),
    formatYaoLine(result.baseLines[4]),
    formatYaoLine(result.baseLines[3]),
    formatYaoLine(result.baseLines[2]),
    formatYaoLine(result.baseLines[1]),
    formatYaoLine(result.baseLines[0])
  ];
  const changedVisual = [
    formatYaoLine(result.changedLines[5]),
    formatYaoLine(result.changedLines[4]),
    formatYaoLine(result.changedLines[3]),
    formatYaoLine(result.changedLines[2]),
    formatYaoLine(result.changedLines[1]),
    formatYaoLine(result.changedLines[0])
  ];

  meihuaDetailEl.textContent = [
    `問題：${result.question}`,
    `起卦：${result.basisText}`,
    `本卦：${baseHexagram}`,
    `變卦：${changedHexagram}`,
    `動爻：第 ${result.movingLine} 爻`,
    `五行關係：${result.relation.title}（上卦 ${result.upper.element} / 下卦 ${result.lower.element}）`,
    '',
    '本卦（上 -> 下）',
    ...baseVisual,
    '',
    '變卦（上 -> 下）',
    ...changedVisual
  ].join('\n');
}

function updateMeihuaInputVisibility() {
  const mode = meihuaCastModeSelect?.value || 'time';
  const movingMode = meihuaMovingModeSelect?.value || 'auto';
  meihuaNumberInputsWrap?.classList.toggle('is-hidden', mode !== 'number');
  meihuaManualMovingWrap?.classList.toggle('is-hidden', movingMode !== 'manual');
}

function initTarotGame() {
  const deckTypeSelect = document.getElementById('tarot-deck-type');
  const savedDeckType = localStorage.getItem('tarot-deck-type') || 'rws';
  const deckType = deckTypeSelect?.value || savedDeckType;
  
  if (deckTypeSelect && deckTypeSelect.value !== deckType) {
    deckTypeSelect.value = deckType;
  }
  
  const deck = generateFullDeck(deckType);
  
  tarotGameState = {
    phase: 'setup',
    deckType: deckType,
    deck: deck.map(card => ({
      ...card,
      reversed: Math.random() < 0.5
    })),
    shuffleCount: 0,
    cutPosition: null,
    spreadCards: [],
    selectedCards: [],
    cardBack: localStorage.getItem('tarot-card-back') || 'default',
    customCardBack: localStorage.getItem('tarot-custom-back') || null,
    showReversed: localStorage.getItem('tarot-show-reversed') !== 'false'
  };
  
  const gameArea = document.getElementById('tarot-game-area');
  const resultArea = document.getElementById('tarot-result-area');
  const setupCard = document.querySelector('.tarot-setup-card');
  
  if (gameArea) gameArea.classList.add('hidden');
  if (resultArea) resultArea.classList.add('hidden');
  if (setupCard) setupCard.classList.remove('hidden');
}

function startTarotGame() {
  initTarotGame();
  
  const gameArea = document.getElementById('tarot-game-area');
  const setupCard = document.querySelector('.tarot-setup-card');
  
  if (setupCard) setupCard.classList.add('hidden');
  if (gameArea) gameArea.classList.remove('hidden');
  
  tarotGameState.phase = 'shuffle';
  showShufflePhase();
  
  const question = tarotQuestionInput?.value?.trim() || '近期整體運勢';
  window.showCharComment({ event: 'start', type: '塔羅', question, phase: '洗牌' });
}

function showShufflePhase() {
  updateInstruction(1, '點擊牌組開始順時針洗牌');
  
  const deckArea = document.getElementById('tarot-deck-area');
  const cutArea = document.getElementById('tarot-cut-area');
  const spreadArea = document.getElementById('tarot-spread-area');
  
  if (deckArea) deckArea.classList.remove('hidden');
  if (cutArea) cutArea.classList.add('hidden');
  if (spreadArea) spreadArea.classList.add('hidden');
  
  renderDeck();
  setupShuffleInteraction();
  
  document.getElementById('tarot-reset-btn')?.classList.remove('hidden');
  document.getElementById('tarot-reveal-btn')?.classList.add('hidden');
  document.getElementById('tarot-reading-btn')?.classList.add('hidden');
}

function renderDeck() {
  const deckEl = document.getElementById('tarot-deck');
  if (!deckEl) return;
  
  deckEl.innerHTML = '';
  
  const cardCount = Math.min(12, tarotGameState.deck.length);
  const centerX = deckEl.offsetWidth / 2;
  const centerY = 100;
  const radius = 80;
  const angleRange = 120;
  const startAngle = -angleRange / 2;
  
  for (let i = 0; i < cardCount; i++) {
    const cardEl = document.createElement('div');
    cardEl.className = 'tarot-deck-card';
    cardEl.dataset.cardIndex = i;
    
    const angle = startAngle + (angleRange / (cardCount - 1)) * i;
    const radians = (angle * Math.PI) / 180;
    const x = centerX + Math.sin(radians) * radius - 35;
    const y = centerY - Math.cos(radians) * radius * 0.3;
    
    cardEl.style.left = `${x}px`;
    cardEl.style.top = `${y}px`;
    cardEl.style.transform = `rotate(${angle * 0.8}deg)`;
    cardEl.style.zIndex = i;
    cardEl.style.setProperty('--fan-transform', `rotate(${angle * 0.8}deg)`);
    
    const backStyle = getCardBackStyle();
    Object.assign(cardEl.style, backStyle);
    
    cardEl.classList.add('fan-out');
    cardEl.style.animationDelay = `${i * 0.03}s`;
    
    deckEl.appendChild(cardEl);
  }
  
  const progressEl = document.createElement('div');
  progressEl.className = 'shuffle-progress';
  progressEl.id = 'shuffle-progress';
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('div');
    dot.className = 'shuffle-dot';
    if (i < tarotGameState.shuffleCount) dot.classList.add('active');
    progressEl.appendChild(dot);
  }
  deckEl.appendChild(progressEl);
}

function getCardBackStyle() {
  const { cardBack, customCardBack } = tarotGameState;
  
  if (customCardBack) {
    return {
      backgroundImage: `url(${customCardBack})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    };
  }
  
  const backStyles = {
    default: {
      background: 'linear-gradient(135deg, #2a3a8a 0%, #1a2a6a 100%)',
      border: '2px solid #4a5abb'
    },
    navy: {
      background: 'linear-gradient(135deg, #1a2a4a 0%, #0a1a3a 100%)',
      border: '2px solid #3a4a7a'
    },
    crimson: {
      background: 'linear-gradient(135deg, #4a1a2a 0%, #3a0a1a 100%)',
      border: '2px solid #7a3a4a'
    },
    mystic: {
      background: 'linear-gradient(135deg, #2a1a4a 0%, #1a0a3a 100%)',
      border: '2px solid #5a3a8a'
    }
  };
  
  return backStyles[cardBack] || backStyles.default;
}

function setupShuffleInteraction() {
  const deckEl = document.getElementById('tarot-deck');
  if (!deckEl) return;
  
  let isShuffling = false;
  
  const handleShuffle = () => {
    if (isShuffling) return;
    isShuffling = true;
    
    animateClockwiseShuffle().then(() => {
      isShuffling = false;
      tarotGameState.shuffleCount++;
      shuffleDeck();
      
      if (tarotGameState.shuffleCount >= 3) {
        setTimeout(() => showCutPhase(), 500);
      }
    });
  };
  
  deckEl.addEventListener('click', handleShuffle);
  deckEl.addEventListener('touchend', (e) => {
    e.preventDefault();
    handleShuffle();
  });
}

async function animateClockwiseShuffle() {
  const deckEl = document.getElementById('tarot-deck');
  if (!deckEl) return;
  
  const cards = deckEl.querySelectorAll('.tarot-deck-card');
  const cardCount = cards.length;
  const centerX = deckEl.offsetWidth / 2;
  const centerY = 100;
  const radius = 80;
  
  for (let round = 0; round < 2; round++) {
    for (let i = 0; i < cardCount; i++) {
      const card = cards[i];
      const startAngle = parseFloat(card.style.transform.replace(/rotate\(([^)]+)\)/, '$1')) || 0;
      const endAngle = startAngle + 360;
      
      const duration = 400;
      const startTime = performance.now();
      
      await new Promise(resolve => {
        const animate = (currentTime) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easeProgress = 1 - Math.pow(1 - progress, 3);
          
          const currentAngle = startAngle + (endAngle - startAngle) * easeProgress;
          const radians = (currentAngle * Math.PI) / 180;
          const x = centerX + Math.sin(radians) * radius - 35;
          const y = centerY - Math.cos(radians) * radius * 0.3;
          
          card.style.left = `${x}px`;
          card.style.top = `${y}px`;
          card.style.transform = `rotate(${currentAngle * 0.8}deg)`;
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            resolve();
          }
        };
        requestAnimationFrame(animate);
      });
    }
  }
}

function shuffleDeck() {
  for (let i = tarotGameState.deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tarotGameState.deck[i], tarotGameState.deck[j]] = [tarotGameState.deck[j], tarotGameState.deck[i]];
    
    if (Math.random() < 0.3) {
      tarotGameState.deck[i].reversed = !tarotGameState.deck[i].reversed;
    }
  }
  
  updateInstruction(1, `已洗牌 ${tarotGameState.shuffleCount} 次${tarotGameState.shuffleCount < 3 ? '，請繼續點擊牌組' : '，準備切牌'}`);
  
  const progressDots = document.querySelectorAll('.shuffle-dot');
  progressDots.forEach((dot, idx) => {
    if (idx < tarotGameState.shuffleCount) {
      dot.classList.add('active');
    }
  });
}

function showCutPhase() {
  tarotGameState.phase = 'cut';
  updateInstruction(2, '請點擊選擇切牌位置');
  
  const deckArea = document.getElementById('tarot-deck-area');
  const cutArea = document.getElementById('tarot-cut-area');
  
  if (deckArea) deckArea.classList.add('hidden');
  if (cutArea) cutArea.classList.remove('hidden');
  
  renderCutOptions();
  
  window.showCharComment({ event: 'cut', type: '塔羅', phase: '切牌' });
}

function renderCutOptions() {
  const cutDecks = document.getElementById('cut-decks');
  if (!cutDecks) return;
  
  cutDecks.innerHTML = '';
  
  const cutPoints = [3, 5, 7];
  
  cutPoints.forEach((point, idx) => {
    const pile = document.createElement('div');
    pile.className = 'cut-deck-pile';
    pile.innerHTML = `
      <div class="tarot-deck-card" style="transform: translateY(-10px)"></div>
      <div class="tarot-deck-card" style="transform: translateY(-5px)"></div>
      <div class="tarot-deck-card"></div>
      <span class="cut-deck-pile-label">${idx === 0 ? '前段' : idx === 1 ? '中段' : '後段'}</span>
    `;
    
    const backStyle = getCardBackStyle();
    pile.querySelectorAll('.tarot-deck-card').forEach(card => {
      Object.assign(card.style, backStyle);
    });
    
    pile.addEventListener('click', () => cutDeckAt(point));
    cutDecks.appendChild(pile);
  });
}

function cutDeckAt(position) {
  const cutIndex = Math.floor(tarotGameState.deck.length * (position / 10));
  const top = tarotGameState.deck.slice(0, cutIndex);
  const bottom = tarotGameState.deck.slice(cutIndex);
  tarotGameState.deck = [...bottom, ...top];
  tarotGameState.cutPosition = position;
  
  showSpreadPhase();
}

function showSpreadPhase() {
  tarotGameState.phase = 'spread';
  updateInstruction(3, '請從牌堆中選牌，拖曳到牌陣位置');
  
  const cutArea = document.getElementById('tarot-cut-area');
  const spreadArea = document.getElementById('tarot-spread-area');
  
  if (cutArea) cutArea.classList.add('hidden');
  if (spreadArea) spreadArea.classList.remove('hidden');
  
  renderSpreadLayout();
  renderDrawPile();
  
  window.showCharComment({ event: 'draw', type: '塔羅', phase: '選牌' });
}

function renderSpreadLayout() {
  const container = document.getElementById('spread-container');
  if (!container) return;
  
  const spreadType = tarotSpreadSelect?.value || 'single';
  const config = spreadConfigs[spreadType];
  
  if (!config) return;
  
  container.innerHTML = '';
  container.style.display = 'flex';
  container.style.flexWrap = 'wrap';
  container.style.justifyContent = 'center';
  container.style.gap = '12px';
  
  config.slots.forEach((slot, idx) => {
    const slotEl = document.createElement('div');
    slotEl.className = 'spread-slot';
    slotEl.dataset.slotIndex = idx;
    slotEl.dataset.position = slot.position;
    
    const label = document.createElement('span');
    label.className = 'spread-slot-label';
    label.textContent = slot.label;
    slotEl.appendChild(label);
    
    slotEl.addEventListener('dragover', handleDragOver);
    slotEl.addEventListener('drop', handleDrop);
    slotEl.addEventListener('click', () => handleSlotClick(idx));
    
    container.appendChild(slotEl);
  });
}

function renderDrawPile() {
  const pileContainer = document.getElementById('draw-pile-cards');
  if (!pileContainer) return;
  
  pileContainer.innerHTML = '';
  
  const displayCount = Math.min(15, tarotGameState.deck.length);
  
  for (let i = 0; i < displayCount; i++) {
    const cardEl = document.createElement('div');
    cardEl.className = 'pile-card';
    cardEl.dataset.cardIndex = i;
    cardEl.draggable = true;
    
    const backStyle = getCardBackStyle();
    Object.assign(cardEl.style, backStyle);
    
    cardEl.addEventListener('dragstart', handleDragStart);
    cardEl.addEventListener('click', () => handlePileCardClick(i));
    
    pileContainer.appendChild(cardEl);
  }
}

let draggedCardIndex = null;

function handleDragStart(e) {
  draggedCardIndex = parseInt(e.target.dataset.cardIndex);
  e.target.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add('drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  const slotEl = e.currentTarget;
  slotEl.classList.remove('drag-over');
  
  const slotIndex = parseInt(slotEl.dataset.slotIndex);
  
  if (draggedCardIndex !== null) {
    placeCardInSlot(draggedCardIndex, slotIndex);
    draggedCardIndex = null;
  }
}

function handlePileCardClick(cardIndex) {
  const spreadType = tarotSpreadSelect?.value || 'single';
  const config = spreadConfigs[spreadType];
  const filledSlots = tarotGameState.spreadCards.filter(c => c !== null).length;
  
  if (filledSlots < config.slots.length) {
    const nextEmptySlot = tarotGameState.spreadCards.findIndex(c => c === null);
    if (nextEmptySlot === -1) {
      placeCardInSlot(cardIndex, filledSlots);
    } else {
      placeCardInSlot(cardIndex, nextEmptySlot);
    }
  }
}

function handleSlotClick(slotIndex) {
  if (tarotGameState.spreadCards[slotIndex]) return;
  
  const firstAvailableCard = tarotGameState.deck.findIndex((card, idx) => 
    !tarotGameState.spreadCards.some(s => s && s.deckIndex === idx)
  );
  
  if (firstAvailableCard !== -1) {
    placeCardInSlot(firstAvailableCard, slotIndex);
  }
}

function placeCardInSlot(cardIndex, slotIndex) {
  const card = tarotGameState.deck[cardIndex];
  if (!card) return;
  
  tarotGameState.spreadCards[slotIndex] = {
    ...card,
    deckIndex: cardIndex,
    revealed: false
  };
  
  updateSpreadDisplay();
  renderDrawPile();
  
  const spreadType = tarotSpreadSelect?.value || 'single';
  const config = spreadConfigs[spreadType];
  const filledSlots = tarotGameState.spreadCards.filter(c => c !== null).length;
  
  if (filledSlots >= config.slots.length) {
    document.getElementById('tarot-reveal-btn')?.classList.remove('hidden');
  }
}

function updateSpreadDisplay() {
  const slots = document.querySelectorAll('.spread-slot');
  
  slots.forEach((slot, idx) => {
    const card = tarotGameState.spreadCards[idx];
    if (card) {
      slot.classList.add('has-card');
      slot.innerHTML = '';
      
      const cardEl = document.createElement('div');
      cardEl.className = 'placed-card';
      
      const backStyle = getCardBackStyle();
      Object.assign(cardEl.style, backStyle);
      
      slot.appendChild(cardEl);
    }
  });
}

function revealAllCards() {
  tarotGameState.spreadCards.forEach((card, idx) => {
    if (card) card.revealed = true;
  });
  
  showRevealedCards();
  document.getElementById('tarot-reveal-btn')?.classList.add('hidden');
  document.getElementById('tarot-reading-btn')?.classList.remove('hidden');
  
  const cards = tarotGameState.spreadCards.filter(c => c).map(c => c.name).join('、');
  window.showCharComment({ event: 'reveal', type: '塔羅', cards, phase: '翻牌' });
}

function showRevealedCards() {
  const slots = document.querySelectorAll('.spread-slot');
  const deckType = tarotGameState.deckType;
  const useCustomImages = deckType === 'thoth' || deckType === 'marseille';
  
  slots.forEach((slot, idx) => {
    const card = tarotGameState.spreadCards[idx];
    if (!card) return;
    
    slot.innerHTML = '';
    
    const cardEl = document.createElement('div');
    cardEl.className = `card-face ${card.id < 22 ? 'major' : ''} ${card.reversed && tarotGameState.showReversed ? 'reversed' : ''}`;
    
    if (useCustomImages) {
      const imgUrl = getDeckCardImageUrl(card, deckType);
      if (imgUrl) {
        cardEl.innerHTML = `
          <img class="card-image-thoth" src="${imgUrl}" alt="${card.name}" loading="lazy">
          <span class="card-title-text">${card.name}</span>
        `;
      } else {
        cardEl.innerHTML = `
          <span class="card-symbol">${card.symbol}</span>
          <span class="card-title-text">${card.name}</span>
        `;
      }
    } else {
      cardEl.innerHTML = `
        ${card.id < 22 ? `<span class="card-number">${card.id}</span>` : ''}
        <span class="card-symbol">${card.symbol}</span>
        <span class="card-title-text">${card.name}</span>
      `;
    }
    
    slot.appendChild(cardEl);
    
    const label = document.createElement('span');
    label.className = 'spread-slot-label';
    label.textContent = slot.dataset.position;
    slot.appendChild(label);
  });
}

async function showTarotReading() {
  const gameArea = document.getElementById('tarot-game-area');
  const resultArea = document.getElementById('tarot-result-area');
  const spreadDisplay = document.getElementById('tarot-spread-display');
  const readingContent = document.getElementById('tarot-reading-content');
  
  if (gameArea) gameArea.classList.add('hidden');
  if (resultArea) resultArea.classList.remove('hidden');
  
  renderResultSpread();
  
  if (readingContent) {
    readingContent.innerHTML = '<p class="result-note">正在解讀中...</p>';
    await generateTarotReading();
  }
  
  const question = tarotQuestionInput?.value?.trim() || '近期整體運勢';
  const spreadType = tarotSpreadSelect?.value || 'single';
  const cards = tarotGameState.spreadCards.filter(c => c).map(c => `${c.name}${c.reversed ? '(逆)' : ''}`).join('、');
  
  window.saveFortuneToMemory({
    type: '塔羅占卜',
    question,
    spread: spreadConfigs[spreadType]?.name || spreadType,
    cards,
    deckType: tarotGameState.deckType
  });
  
  window.showCharComment({ event: 'reading', type: '塔羅', cards, question, phase: '解讀完成' });
}

function renderResultSpread() {
  const spreadDisplay = document.getElementById('tarot-spread-display');
  if (!spreadDisplay) return;
  
  spreadDisplay.innerHTML = '';
  
  const spreadType = tarotSpreadSelect?.value || 'single';
  const config = spreadConfigs[spreadType];
  const deckType = tarotGameState.deckType;
  const useCustomImages = deckType === 'thoth' || deckType === 'marseille';
  
  tarotGameState.spreadCards.forEach((card, idx) => {
    if (!card) return;
    
    const cardEl = document.createElement('div');
    cardEl.className = 'tarot-result-card';
    
    let cardImageHtml = '';
    if (useCustomImages) {
      const imgUrl = getDeckCardImageUrl(card, deckType);
      if (imgUrl) {
        cardImageHtml = `
          <div class="card-image ${card.reversed && tarotGameState.showReversed ? 'reversed' : ''}">
            <img class="card-image-thoth" src="${imgUrl}" alt="${card.name}" loading="lazy">
          </div>`;
      } else {
        cardImageHtml = `
          <div class="card-image ${card.reversed && tarotGameState.showReversed ? 'reversed' : ''}">
            <span class="card-symbol">${card.symbol}</span>
          </div>`;
      }
    } else {
      cardImageHtml = `
        <div class="card-image ${card.reversed && tarotGameState.showReversed ? 'reversed' : ''}">
          <span class="card-symbol">${card.symbol}</span>
        </div>`;
    }
    
    cardEl.innerHTML = `
      ${cardImageHtml}
      <span class="card-name">${card.name}${card.reversed ? '（逆位）' : ''}</span>
      <span class="card-position">${config.slots[idx]?.label || ''}</span>
    `;
    
    spreadDisplay.appendChild(cardEl);
  });
}

async function generateTarotReading() {
  const readingContent = document.getElementById('tarot-reading-content');
  if (!readingContent) return;
  
  const question = tarotQuestionInput?.value?.trim() || '近期整體運勢';
  const spreadType = tarotSpreadSelect?.value || 'single';
  const config = spreadConfigs[spreadType];
  const deckConfig = tarotDeckConfigs[tarotGameState.deckType] || tarotDeckConfigs.rws;
  
  const cardDescriptions = tarotGameState.spreadCards.map((card, idx) => {
    if (!card) return '';
    const position = config.slots[idx]?.label || `位置${idx + 1}`;
    const orientation = card.reversed ? '逆位' : '正位';
    
    const deckMeaning = getDeckCardMeaning(card, tarotGameState.deckType);
    if (deckMeaning) {
      const meaning = card.reversed ? deckMeaning.reversed : deckMeaning.upright;
      return `【${position}】${card.name}（${orientation}）：${meaning}`;
    }
    
    return `【${position}】${card.name}（${orientation}）：關鍵字 ${card.keywords.join('、')}`;
  }).join('\n');
  
  const config_api = getActiveApiConfig();
  
  if (!config_api?.url) {
    readingContent.innerHTML = generateLocalReading(question, cardDescriptions, config, deckConfig);
    return;
  }
  
  try {
    const targetUrl = buildChatCompletionsUrl(config_api.url);
    const prompt = `你是一位專業塔羅牌占卜師，使用${deckConfig.name}（${deckConfig.nameEn}）進行解讀。請根據以下占卜結果提供詳細解讀。

問題：${question}
牌系：${deckConfig.name}
牌陣：${config.name}
${cardDescriptions}

請提供：
1. 整體牌面分析
2. 每張牌在對應位置的意義
3. 綜合解讀與建議
4. 未來發展方向

請用溫和專業的語氣回答，大約 300-500 字。`;

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config_api.key ? { Authorization: `Bearer ${config_api.key}` } : {})
      },
      body: JSON.stringify({
        model: config_api.model || 'gpt-4o-mini',
        temperature: 0.8,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    
    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content || generateLocalReading(question, cardDescriptions, config, deckConfig);
    
    readingContent.innerHTML = formatReadingText(text);
  } catch (err) {
    readingContent.innerHTML = generateLocalReading(question, cardDescriptions, config, deckConfig);
  }
}

function generateLocalReading(question, cardDescriptions, config, deckConfig) {
  const cards = tarotGameState.spreadCards.filter(c => c);
  const mainCard = cards[0];
  const deckType = tarotGameState.deckType;
  const hasCustomMeaning = deckType === 'thoth' || deckType === 'marseille';
  
  let mainMeaning = '';
  let cardDetails = '';
  
  if (hasCustomMeaning && mainCard) {
    const deckMeaning = getDeckCardMeaning(mainCard, deckType);
    if (deckMeaning) {
      const orientation = mainCard.reversed ? '逆位' : '正位';
      mainMeaning = mainCard.reversed ? deckMeaning.reversed : deckMeaning.upright;
      cardDetails = `<p><strong>${mainCard.name}（${orientation}）</strong>：${mainMeaning}</p>`;
      if (deckMeaning.note) {
        const noteLabel = deckType === 'thoth' ? '托特註記' : '馬賽註記';
        cardDetails += `<p class="thoth-note"><em>${noteLabel}：${deckMeaning.note}</em></p>`;
      }
    }
  }
  
  const keywordBase = mainMeaning || mainCard?.keywords?.join('、') || '轉變';
  
  const readings = [
    `這組牌顯示目前的能量流動趨向於${keywordBase.split('、')[0] || '轉變'}。`,
    `牌面核心訊息是「${mainCard?.name || '未知'}」，提示你要${mainMeaning ? mainMeaning.split('、').slice(0, 2).join('與') : (mainCard?.keywords?.slice(0, 2).join('與') || '保持開放')}。`,
    `在${config.name}牌陣中，整體趨勢指向內在的轉化與成長。`
  ];
  
  const deckName = deckConfig?.name || '偉特塔羅';
  
  let detailSection = '';
  if (hasCustomMeaning && cards.length > 0) {
    detailSection = '<h4>牌意詳解</h4>';
    cards.forEach((card, idx) => {
      const deckMeaning = getDeckCardMeaning(card, deckType);
      if (deckMeaning) {
        const orientation = card.reversed ? '逆位' : '正位';
        const meaning = card.reversed ? deckMeaning.reversed : deckMeaning.upright;
        const position = config.slots[tarotGameState.spreadCards.indexOf(card)]?.label || `位置${idx + 1}`;
        detailSection += `<p><strong>【${position}】${card.name}（${orientation}）</strong>：${meaning}</p>`;
      }
    });
  }
  
  return `
    <h4>占卜問題</h4>
    <p>${question}</p>
    <h4>牌系</h4>
    <p>${deckName}</p>
    <h4>牌面配置</h4>
    <p style="white-space: pre-line">${cardDescriptions}</p>
    ${cardDetails}
    <h4>解讀</h4>
    <p>${readings.join('</p><p>')}</p>
    ${detailSection}
    <h4>建議</h4>
    <p>保持開放的心態，順應當下的能量流動。記住，塔羅牌是指引而非命定的答案。</p>
  `;
}

function formatReadingText(text) {
  return text
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/【(.+?)】/g, '<h4>$1</h4>')
    .replace(/(\d+\.)\s/g, '<br><strong>$1</strong> ');
}

function updateInstruction(step, text) {
  const instruction = document.getElementById('tarot-instruction');
  if (!instruction) return;
  
  instruction.innerHTML = `
    <span class="instruction-step">步驟 ${step}/3</span>
    <span class="instruction-text">${text}</span>
  `;
}

function resetTarotGame() {
  initTarotGame();
}

function bindEvents() {
  function updateBirthCardVisibility() {
    if (eastBirthCard) {
      eastBirthCard.classList.toggle('is-hidden', selectedCategory !== 'east');
    }
    document.querySelectorAll('.east-method-card').forEach(card => {
      card.classList.toggle('is-hidden', selectedCategory !== 'east');
    });
    if (westBirthCard) {
      westBirthCard.classList.toggle('is-hidden', selectedCategory !== 'west');
    }
    document.querySelectorAll('.west-method-card').forEach(card => {
      card.classList.toggle('is-hidden', selectedCategory !== 'west');
    });
  }

  async function saveZiweiExternalRecord() {
    if (!ziweiResultImageInput || !ziweiResultNoteInput) return;
    const payload = {
      imageUrl: ziweiResultImageInput.value.trim(),
      note: ziweiResultNoteInput.value.trim()
    };
    localStorage.setItem('drift-bottle:ziwei-external', JSON.stringify(payload));
    if (ziweiPreviewImage && payload.imageUrl) {
      ziweiPreviewImage.src = payload.imageUrl;
      ziweiPreviewImage.classList.toggle('is-hidden', false);
    }
    if (ziweiPreviewNote) ziweiPreviewNote.textContent = payload.note || '（未填寫摘要）';
    ziweiExternalPreview?.classList.remove('is-hidden');

    await analyzeZiweiProfile({
      dateText: eastBirthDateInput?.value || '',
      timeText: eastBirthTimeInput?.value || '',
      gender: eastBirthGenderSelect?.value || 'F',
      calendarType: eastCalendarTypeSelect?.value || 'solar',
      isLeap: eastLunarLeapSelect?.value === 'true'
    });
  }

  function loadZiweiExternalRecord() {
    const raw = localStorage.getItem('drift-bottle:ziwei-external');
    if (!raw) return;
    try {
      const payload = JSON.parse(raw);
      if (ziweiResultImageInput) ziweiResultImageInput.value = payload.imageUrl || '';
      if (ziweiResultNoteInput) ziweiResultNoteInput.value = payload.note || '';
      if (ziweiPreviewImage) {
        ziweiPreviewImage.src = payload.imageUrl || '';
        ziweiPreviewImage.classList.toggle('is-hidden', !payload.imageUrl);
      }
      if (ziweiPreviewNote) ziweiPreviewNote.textContent = payload.note || '（未填寫摘要）';
      ziweiExternalPreview?.classList.toggle('is-hidden', !payload.imageUrl && !payload.note);
      if (ziweiAnalysisNote) ziweiAnalysisNote.textContent = '尚未分析';
      if (ziweiAnalysisResult) ziweiAnalysisResult.textContent = '';
    } catch (error) {
      console.warn('Failed to load ziwei external record', error);
    }
  }

  function openAudioPage() {
    showMethodPage('audio');
  }

  function openFlowAlmanacPage() {
    seedFlowAlmanacDefaults();
    showMethodPage('flow-almanac');
  }

  categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
      selectedCategory = button.dataset.category || 'east';
      categoryButtons.forEach(node => node.classList.toggle('active', node === button));
      renderMethods();
      updateBirthCardVisibility();
    });
  });

  function handleMethodEntry(event) {
    const target = event.target.closest('[data-method-key]');
    if (!target) return;
    const methodKey = target.dataset.methodKey;

    if (methodKey === 'flow') {
      openFlowAlmanacPage();
      return;
    }

    if (methodKey === 'tarot') {
      showMethodPage('tarot');
      initTarotGame();
      return;
    }

    showMethodPage(methodKey);
    if (methodKey === 'ziwei') renderZiweiBoard();
    if (methodKey === 'meihua') {
      updateMeihuaInputVisibility();
      renderMeihuaReading();
    }
  }

  document.querySelectorAll('.east-method-card').forEach(card => {
    card.addEventListener('click', handleMethodEntry);
  });

  document.querySelectorAll('.west-method-card').forEach(card => {
    card.addEventListener('click', handleMethodEntry);
  });

  pageBackButtons.forEach(button => {
    button.addEventListener('click', showHome);
  });

  generateButtons.forEach(button => {
    button.addEventListener('click', () => {
      const methodKey = button.dataset.method;
      if (methodKey === 'ziwei') {
        renderZiweiBoard();
        void buildZiweiChartImage();
        return;
      }
      const inputEl = document.getElementById(`q-${methodKey}`);
      const resultEl = document.getElementById(`r-${methodKey}`);
      if (!resultEl) return;
      const question = inputEl?.value?.trim() || '近期整體運勢如何？';
      resultEl.textContent = generateSimpleReading(methodKey, question);
    });
  });

  document.querySelectorAll('.page-back[data-target]').forEach(button => {
    button.addEventListener('click', () => {
      const target = button.dataset.target;
      showMethodPage(target);
    });
  });

  function saveEastProfile() {
    if (!eastBirthDateInput || !eastBirthTimeInput || !eastBirthGenderSelect || !eastCalendarTypeSelect || !eastLunarLeapSelect) return;
    const payload = {
      birthDate: eastBirthDateInput.value,
      birthTime: eastBirthTimeInput.value,
      calendarType: eastCalendarTypeSelect.value,
      isLeap: eastLunarLeapSelect.value,
      gender: eastBirthGenderSelect.value
    };
    localStorage.setItem('drift-bottle:east-profile', JSON.stringify(payload));
    if (eastLunarNote) eastLunarNote.textContent = '已儲存出生資訊。';
  }

  function loadEastProfile() {
    const raw = localStorage.getItem('drift-bottle:east-profile');
    if (!raw) return;
    try {
      const payload = JSON.parse(raw);
      if (eastBirthDateInput) eastBirthDateInput.value = payload.birthDate || '';
      if (eastBirthTimeInput) eastBirthTimeInput.value = payload.birthTime || '';
      if (eastCalendarTypeSelect) eastCalendarTypeSelect.value = payload.calendarType || 'solar';
      if (eastLunarLeapSelect) eastLunarLeapSelect.value = payload.isLeap || 'false';
      if (eastBirthGenderSelect) eastBirthGenderSelect.value = payload.gender || 'F';
    } catch (error) {
      console.warn('Failed to load east profile', error);
    }
  }

  eastSaveProfileBtn?.addEventListener('click', saveEastProfile);
  ziweiSaveExternalBtn?.addEventListener('click', saveZiweiExternalRecord);
  ziweiBuildChartBtn?.addEventListener('click', buildZiweiChartImage);
  ziweiDownloadChartBtn?.addEventListener('click', downloadZiweiChartImage);
  meihuaCastBtn?.addEventListener('click', renderMeihuaReading);
  meihuaCastModeSelect?.addEventListener('change', () => {
    updateMeihuaInputVisibility();
  });
  meihuaMovingModeSelect?.addEventListener('change', () => {
    updateMeihuaInputVisibility();
  });
  openFlowAlmanacBtn?.addEventListener('click', openFlowAlmanacPage);
  flowAlmanacBackBtn?.addEventListener('click', showHome);
  flowAlmanacGenerateBtn?.addEventListener('click', renderFlowAlmanacReading);
  eastBirthDateInput?.addEventListener('change', renderZiweiBoard);
  eastBirthTimeInput?.addEventListener('change', renderZiweiBoard);
  eastCalendarTypeSelect?.addEventListener('change', renderZiweiBoard);
  eastLunarLeapSelect?.addEventListener('change', renderZiweiBoard);
  eastBirthGenderSelect?.addEventListener('change', renderZiweiBoard);

  const tarotStartBtn = document.getElementById('tarot-start-btn');
  const tarotResetBtn = document.getElementById('tarot-reset-btn');
  const tarotRevealBtn = document.getElementById('tarot-reveal-btn');
  const tarotReadingBtn = document.getElementById('tarot-reading-btn');
  const tarotNewReadingBtn = document.getElementById('tarot-new-reading-btn');
  const tarotSettingsBtn = document.getElementById('tarot-settings-btn');
  
  tarotStartBtn?.addEventListener('click', startTarotGame);
  tarotResetBtn?.addEventListener('click', resetTarotGame);
  tarotRevealBtn?.addEventListener('click', revealAllCards);
  tarotReadingBtn?.addEventListener('click', showTarotReading);
  tarotNewReadingBtn?.addEventListener('click', initTarotGame);
  
  tarotSettingsBtn?.addEventListener('click', () => {
    showMethodPage('tarot-settings');
  });
  
  const tarotDeckTypeSelect = document.getElementById('tarot-deck-type');
  tarotDeckTypeSelect?.addEventListener('change', () => {
    tarotGameState.deckType = tarotDeckTypeSelect.value;
    localStorage.setItem('tarot-deck-type', tarotDeckTypeSelect.value);
  });
  
  const savedDeckType = localStorage.getItem('tarot-deck-type');
  if (savedDeckType && tarotDeckTypeSelect) {
    tarotDeckTypeSelect.value = savedDeckType;
  }
  
  const cardBackOptions = document.querySelectorAll('input[name="card-back"]');
  cardBackOptions.forEach(option => {
    option.addEventListener('change', () => {
      tarotGameState.cardBack = option.value;
      localStorage.setItem('tarot-card-back', option.value);
    });
  });
  
  const uploadCardBackBtn = document.getElementById('upload-card-back-btn');
  const customCardBackInput = document.getElementById('custom-card-back-input');
  const customBackPreview = document.getElementById('custom-back-preview');
  const customBackImg = document.getElementById('custom-back-img');
  const removeCustomBackBtn = document.getElementById('remove-custom-back-btn');
  
  uploadCardBackBtn?.addEventListener('click', () => {
    customCardBackInput?.click();
  });
  
  customCardBackInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      tarotGameState.customCardBack = reader.result;
      localStorage.setItem('tarot-custom-back', reader.result);
      
      if (customBackImg) customBackImg.src = reader.result;
      if (customBackPreview) customBackPreview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  });
  
  removeCustomBackBtn?.addEventListener('click', () => {
    tarotGameState.customCardBack = null;
    localStorage.removeItem('tarot-custom-back');
    if (customBackPreview) customBackPreview.classList.add('hidden');
  });
  
  const showReversedSelect = document.getElementById('show-reversed');
  showReversedSelect?.addEventListener('change', () => {
    tarotGameState.showReversed = showReversedSelect.value === 'yes';
    localStorage.setItem('tarot-show-reversed', showReversedSelect.value);
  });
  
  const savedCardBack = localStorage.getItem('tarot-card-back');
  if (savedCardBack) {
    const savedOption = document.querySelector(`input[name="card-back"][value="${savedCardBack}"]`);
    if (savedOption) savedOption.checked = true;
  }
  
  const savedCustomBack = localStorage.getItem('tarot-custom-back');
  if (savedCustomBack && customBackImg && customBackPreview) {
    customBackImg.src = savedCustomBack;
    customBackPreview.classList.remove('hidden');
  }

  homeRefreshBtn?.addEventListener('click', () => {
    openAudioPage();
  });

  oceanToneSelect?.addEventListener('change', () => {
    startOceanSound();
    setOceanTone(oceanToneSelect.value);
  });

  oceanVolumeInput?.addEventListener('input', () => {
    startOceanSound();
    setOceanVolume(oceanVolumeInput.value);
  });

  noiseToggleSelect?.addEventListener('change', () => {
    startOceanSound();
    setNoiseEnabled(noiseToggleSelect.value === 'on');
  });

  noiseVolumeInput?.addEventListener('input', () => {
    startOceanSound();
    setNoiseVolume(noiseVolumeInput.value);
  });

  updateBirthCardVisibility();
  updateMeihuaInputVisibility();
  seedFlowAlmanacDefaults();
  loadEastProfile();
  loadZiweiExternalRecord();
  renderZiweiBoard();

  document.addEventListener('pointerdown', () => {
    if (oceanAudioContext?.state === 'suspended') {
      oceanAudioContext.resume();
    }
    startOceanSound();
  }, { once: true });
}

function playIntroAnimation() {
  if (!introOverlay) return;
  introOverlay.classList.add('is-active');
  window.setTimeout(() => {
    introOverlay.classList.remove('is-active');
  }, 1700);
}

renderMethods();
showHome();
bindEvents();
playIntroAnimation();
startOceanSound();
initCharCompanion();
console.log('Loaded app: drift-bottle');

const FORTUNE_MEMORY_KEY = 'sx_fortune_memory';
const CHAR_COMPANION_ENABLED_KEY = 'sx_fortune_char_enabled';
const FORTUNE_MEMORY_ENABLED_KEY = 'sx_fortune_memory_enabled';
const SELECTED_CHAR_KEY = 'sx_fortune_selected_char';

let charCompanionEnabled = true;
let fortuneMemoryEnabled = true;
let selectedCharData = null;
let lastCommentTime = 0;

function getCharacters() {
  const raw = localStorage.getItem('sx_characters');
  if (!raw) return [];
  try {
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}

function getApiConfig() {
  const apis = JSON.parse(localStorage.getItem('api_configs') || '[]');
  if (!Array.isArray(apis) || !apis.length) return null;
  const activeIndex = Number.parseInt(localStorage.getItem('sx_active_api') || '0', 10);
  return apis[activeIndex] || apis[0] || null;
}

async function generateCharComment(context) {
  const config = getApiConfig();
  const char = selectedCharData;
  
  if (!char) {
    return generateFallbackComment(context);
  }
  
  if (!config?.url) {
    return generateFallbackComment(context);
  }
  
  const lang = localStorage.getItem('sxiphone_lang') || 'zh-TW';
  
  const systemPrompt = `你是一個正在陪使用者進行占卜的角色，請根據角色性格生成一句簡短的評論或感想。
請使用 ${window.getAIReadableLangName?.(lang) || '繁體中文'} 撰寫。
輸出格式為 JSON: {"comment": "一句話"}`;

  let contextText = `# 角色設定\n名稱: ${char.name}\n`;
  if (char.personality) contextText += `性格: ${char.personality}\n`;
  if (char.background) contextText += `背景: ${char.background}\n`;
  contextText += `\n# 占卜狀況\n`;
  contextText += `占卜類型: ${context.type || '塔羅'}\n`;
  if (context.question) contextText += `問題: ${context.question}\n`;
  if (context.cards) contextText += `抽到的牌: ${context.cards}\n`;
  if (context.phase) contextText += `階段: ${context.phase}\n`;
  contextText += `事件: ${context.event || '進行中'}\n`;

  const prompt = `${contextText}

請生成一句角色在看到這個占卜狀況時會說的話，要求：
1. 符合角色性格
2. 簡短自然（10-30字）
3. 可以是好奇、期待、評論或鼓勵

輸出 JSON 格式。`;

  try {
    const targetUrl = config.url.endsWith('/chat/completions')
      ? config.url
      : `${config.url.replace(/\/$/, '')}/chat/completions`;

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.key ? { Authorization: `Bearer ${config.key}` } : {})
      },
      body: JSON.stringify({
        model: config.model || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.9
      })
    });

    if (!response.ok) return generateFallbackComment(context);

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '';

    let parsed = null;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }

    return parsed?.comment || generateFallbackComment(context);
  } catch (err) {
    return generateFallbackComment(context);
  }
}

function generateFallbackComment(context) {
  const char = selectedCharData;
  const personality = (char?.personality || '').toLowerCase();
  
  const comments = {
    shuffle: ['洗牌的時候要專心喔！', '讓我看看你會抽到什麼牌...', '專注在你的問題上。'],
    cut: ['切牌是重要的儀式。', '選擇你感覺對的位置。', '相信你的直覺。'],
    draw: ['這張牌看起來很有意思！', '嗯...這張牌...', '有趣的選擇。'],
    reveal: ['哇！這張牌！', '結果出來了！', '讓我看看...'],
    reading: ['這個解讀很準呢！', '原來是這樣啊...', '牌面很有意思。'],
    start: ['開始占卜吧！', '我陪你一起看。', '專注在你的問題上。']
  };

  const spicy = ['佔有', '控制', '病嬌', '嫉妒', '冷淡', '腹黑', '強勢', '霸道'];
  const gentle = ['溫柔', '體貼', '善良', '暖', '可愛', '樂觀'];
  const playful = ['調皮', '愛鬧', '搞笑', '活潑', '俏皮'];

  let pool = comments[context.event] || comments.start;

  if (spicy.some(key => personality.includes(key))) {
    pool = {
      shuffle: ['洗好一點。', '別心不在焉。', '專心點。'],
      cut: ['選吧。', '別猶豫。', '相信你的直覺。'],
      draw: ['這張？', '嗯。', '有趣的選擇。'],
      reveal: ['哼，果然。', '結果出來了。', '看吧。'],
      reading: ['解讀還行。', '差不多是這樣。', '記住了。'],
      start: ['開始吧。', '我等著看結果。', '專心點。']
    }[context.event] || comments.start;
  } else if (gentle.some(key => personality.includes(key))) {
    pool = {
      shuffle: ['慢慢來，別急。', '專注在你的問題上喔！', '我陪你一起。'],
      cut: ['選你感覺對的位置。', '相信直覺就好。', '慢慢選。'],
      draw: ['這張牌不錯！', '嗯，有意思。', '很好的選擇。'],
      reveal: ['結果出來了！', '讓我看看...', '哇！'],
      reading: ['這個解讀很溫暖呢！', '很有幫助的訊息。', '牌面給了很好的指引。'],
      start: ['開始吧！我陪著你。', '放輕鬆，專注在你的問題。', '一起來看看吧！']
    }[context.event] || comments.start;
  } else if (playful.some(key => personality.includes(key))) {
    pool = {
      shuffle: ['洗牌洗牌！', '快點快點！', '好期待！'],
      cut: ['選哪個呢？', '快選快選！', '嘿嘿...'],
      draw: ['這張！', '喔喔喔！', '好有趣！'],
      reveal: ['哇！結果！', '看看看看！', '出來了出來了！'],
      reading: ['好準好準！', '原來是這樣！', '太有趣了！'],
      start: ['開始開始！', '好興奮！', '來占卜吧！']
    }[context.event] || comments.start;
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

function showCharComment(context) {
  const commentEl = document.getElementById('char-comment');
  if (!commentEl || !charCompanionEnabled || !selectedCharData) return;
  
  const now = Date.now();
  if (now - lastCommentTime < 3000) return;
  lastCommentTime = now;
  
  generateCharComment(context).then(comment => {
    commentEl.textContent = comment;
    commentEl.style.animation = 'none';
    void commentEl.offsetWidth;
    commentEl.style.animation = 'fadeInUp 0.3s ease';
  });
}

function saveFortuneToMemory(fortuneData) {
  if (!fortuneMemoryEnabled) return;
  
  const memories = JSON.parse(localStorage.getItem(FORTUNE_MEMORY_KEY) || '[]');
  const lang = localStorage.getItem('sxiphone_lang') || 'zh-Hant';
  const localeCode = window.getLocaleStringLang?.(lang) || 'zh-TW';
  const entry = {
    id: `fortune_${Date.now()}`,
    timestamp: Date.now(),
    date: new Date().toLocaleDateString(localeCode),
    charName: selectedCharData?.name || '未知',
    ...fortuneData
  };
  
  memories.unshift(entry);
  if (memories.length > 50) memories.pop();
  
  localStorage.setItem(FORTUNE_MEMORY_KEY, JSON.stringify(memories));
  
  window.parent?.postMessage({
    type: 'FORTUNE_MEMORY_UPDATED',
    payload: entry
  }, '*');
}

function getFortuneMemories() {
  return JSON.parse(localStorage.getItem(FORTUNE_MEMORY_KEY) || '[]');
}

function updateCharPanelUI() {
  const panel = document.getElementById('char-companion-panel');
  const avatarEl = document.getElementById('char-avatar');
  const nameEl = document.getElementById('char-name');
  
  if (selectedCharData) {
    if (nameEl) nameEl.textContent = selectedCharData.name;
    if (avatarEl && selectedCharData.avatar) {
      avatarEl.style.backgroundImage = `url('${selectedCharData.avatar}')`;
    }
    panel?.classList.remove('hidden');
  } else {
    panel?.classList.add('hidden');
  }
}

function renderCharList() {
  const charListEl = document.getElementById('char-list');
  if (!charListEl) return;
  
  const characters = getCharacters();
  
  if (characters.length === 0) {
    charListEl.innerHTML = '<div class="no-chars" style="text-align:center;color:var(--fortune-muted);padding:20px;">尚未建立角色<br>請先到設定新增角色</div>';
    return;
  }
  
  charListEl.innerHTML = characters.map(char => `
    <div class="char-item ${selectedCharData?.name === char.name ? 'selected' : ''}" data-char-name="${char.name}">
      <div class="item-avatar" style="${char.avatar ? `background-image:url('${char.avatar}')` : ''}"></div>
      <div class="item-info">
        <div class="item-name">${char.name}</div>
        <div class="item-personality">${char.personality || '尚未設定性格'}</div>
      </div>
    </div>
  `).join('');
  
  charListEl.querySelectorAll('.char-item').forEach(item => {
    item.addEventListener('click', () => {
      const charName = item.dataset.charName;
      const char = characters.find(c => c.name === charName);
      if (char) {
        selectedCharData = char;
        localStorage.setItem(SELECTED_CHAR_KEY, JSON.stringify(char));
        renderCharList();
        updateCharPanelUI();
        showCharComment({ event: 'start', type: '占卜' });
      }
    });
  });
}

function initCharCompanion() {
  const panel = document.getElementById('char-companion-panel');
  const selectBtn = document.getElementById('char-select-btn');
  const modal = document.getElementById('char-select-modal');
  const closeBtn = document.getElementById('close-char-select');
  const companionToggle = document.getElementById('char-companion-toggle');
  const memoryToggle = document.getElementById('fortune-memory-toggle');
  
  charCompanionEnabled = localStorage.getItem(CHAR_COMPANION_ENABLED_KEY) !== 'false';
  fortuneMemoryEnabled = localStorage.getItem(FORTUNE_MEMORY_ENABLED_KEY) !== 'false';
  
  if (companionToggle) companionToggle.checked = charCompanionEnabled;
  if (memoryToggle) memoryToggle.checked = fortuneMemoryEnabled;
  
  const savedChar = localStorage.getItem(SELECTED_CHAR_KEY);
  if (savedChar) {
    try {
      selectedCharData = JSON.parse(savedChar);
    } catch {
      selectedCharData = null;
    }
  }
  
  updateCharPanelUI();
  renderCharList();
  
  selectBtn?.addEventListener('click', () => {
    modal?.classList.remove('hidden');
    renderCharList();
  });
  
  closeBtn?.addEventListener('click', () => {
    modal?.classList.add('hidden');
  });
  
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
    }
  });
  
  companionToggle?.addEventListener('change', () => {
    charCompanionEnabled = companionToggle.checked;
    localStorage.setItem(CHAR_COMPANION_ENABLED_KEY, charCompanionEnabled ? 'true' : 'false');
    if (!charCompanionEnabled) {
      panel?.classList.add('hidden');
    } else {
      updateCharPanelUI();
    }
  });
  
  memoryToggle?.addEventListener('change', () => {
    fortuneMemoryEnabled = memoryToggle.checked;
    localStorage.setItem(FORTUNE_MEMORY_ENABLED_KEY, fortuneMemoryEnabled ? 'true' : 'false');
  });
}

window.showCharComment = showCharComment;
window.saveFortuneToMemory = saveFortuneToMemory;
window.getFortuneMemories = getFortuneMemories;

