const platformSelect = document.getElementById('platform-select');
const playlistUrlInput = document.getElementById('playlist-url');
const importBtn = document.getElementById('import-btn');
const refreshBtn = document.getElementById('refresh-btn');
const playlistList = document.getElementById('playlist-list');
const queueCount = document.getElementById('queue-count');
const importNotice = document.getElementById('import-notice');

const spotifyClientIdInput = document.getElementById('spotify-client-id');
const spotifyRedirectInput = document.getElementById('spotify-redirect');
const spotifyLoginBtn = document.getElementById('spotify-login');
const spotifyTokenInput = document.getElementById('spotify-token');
const spotifySaveTokenBtn = document.getElementById('spotify-save-token');

const userNameInput = document.getElementById('user-name');
const charSelect = document.getElementById('char-select');
const charDescEl = document.getElementById('char-desc');
const listenStatusEl = document.getElementById('listen-status');

const audio = document.getElementById('audio-player');
const coverArt = document.getElementById('cover-art');
const trackTitleEl = document.getElementById('track-title');
const trackMetaEl = document.getElementById('track-meta');

const progressEl = document.getElementById('progress');
const currentTimeEl = document.getElementById('current-time');
const totalTimeEl = document.getElementById('total-time');

const prevBtn = document.getElementById('prev-btn');
const playBtn = document.getElementById('play-btn');
const nextBtn = document.getElementById('next-btn');
const danmakuLayer = document.getElementById('danmaku-layer');

const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonic: [0, 2, 4, 7, 9],
  blues: [0, 3, 5, 6, 7, 10]
};

const DRUM_PATTERNS = {
  rock: { kick: [1, 0, 0, 1, 0, 0, 1, 0], snare: [0, 0, 1, 0, 0, 0, 1, 0], hihat: [1, 1, 1, 1, 1, 1, 1, 1] },
  hiphop: { kick: [1, 0, 0, 1, 0, 1, 0, 0], snare: [0, 0, 1, 0, 0, 0, 1, 0], hihat: [1, 0, 1, 0, 1, 0, 1, 0] },
  electronic: { kick: [1, 0, 0, 0, 1, 0, 0, 0], snare: [0, 0, 0, 0, 1, 0, 0, 0], hihat: [1, 1, 1, 1, 1, 1, 1, 1] },
  jazz: { kick: [1, 0, 0, 0, 0, 0, 1, 0], snare: [0, 0, 0, 1, 0, 0, 0, 0], hihat: [1, 0, 1, 1, 0, 1, 1, 0] }
};

let aiMelody = [];
let interpMelodyA = [];
let interpMelodyB = [];
let audioCtx = null;
let aiPlaybackTimeout = null;
let currentPublishTrack = null;

const MOOD_CONFIGS = {
  calm: { tempo: 70, scale: 'pentatonic', noteDensity: 0.4, avgPitch: 62 },
  happy: { tempo: 120, scale: 'major', noteDensity: 0.7, avgPitch: 66 },
  sad: { tempo: 60, scale: 'minor', noteDensity: 0.3, avgPitch: 58 },
  energetic: { tempo: 140, scale: 'blues', noteDensity: 0.8, avgPitch: 68 },
  romantic: { tempo: 80, scale: 'major', noteDensity: 0.5, avgPitch: 64 },
  mysterious: { tempo: 90, scale: 'minor', noteDensity: 0.45, avgPitch: 60 }
};

const STYLE_CONFIGS = {
  pop: { rhythmVariation: 0.3, syncopation: 0.4 },
  ballad: { rhythmVariation: 0.1, syncopation: 0.1 },
  rnb: { rhythmVariation: 0.5, syncopation: 0.6 },
  electronic: { rhythmVariation: 0.7, syncopation: 0.5 },
  acoustic: { rhythmVariation: 0.2, syncopation: 0.2 },
  jazz: { rhythmVariation: 0.6, syncopation: 0.7 }
};

const WORD_BANKS = {
  zh: {
    subjects: ['我', '你', '我們', '回憶', '夢想', '時間', '心情', '故事', '明天', '昨天', '星星', '月亮', '大海', '風', '雨'],
    verbs: ['等待', '想念', '追逐', '擁抱', '守護', '相信', '忘記', '遇見', '離開', '留下', '飛翔', '墜落', '綻放', '沉睡'],
    adjectives: ['溫柔', '勇敢', '脆弱', '堅強', '孤獨', '幸福', '悲傷', '快樂', '安靜', '喧嘩', '燦爛', '黯淡', '真實', '虛幻'],
    nouns: ['光芒', '影子', '淚水', '笑容', '約定', '秘密', '奇蹟', '永恆', '瞬間', '旅程', '終點', '起點', '翅膀', '海洋'],
    connectors: ['在', '的', '著', '了', '與', '和', '像', '是', '讓', '把', '被', '從', '到', '直到'],
    endings: ['呢', '吧', '啊', '喔', '呀', '']
  },
  ko: {
    subjects: ['나', '너', '우리', '추억', '꿈', '시간', '마음', '이야기', '내일', '어제', '별', '달', '바다', '바람', '비'],
    verbs: ['기다려', '그리워', '쫓아', '안아', '지켜', '믿어', '잊어', '만나', '떠나', '남아', '날아', '떨어져', '피어나', '잠들어'],
    adjectives: ['따뜻해', '용감해', '약해', '강해', '외로워', '행복해', '슬퍼', '즐거워', '조용해', '시끄러워', '찬란해', '어두워', '진짜', '가짜'],
    nouns: ['빛', '그림자', '눈물', '미소', '약속', '비밀', '기적', '영원', '순간', '여정', '끝', '시작', '날개', '바다'],
    connectors: ['에', '의', '고', '는', '와', '랑', '처럼', '이', '게', '을', '를', '부터', '까지', '동안'],
    endings: ['요', '죠', '네요', '군요', '구나', '']
  },
  ja: {
    subjects: ['私', '君', '僕ら', '思い出', '夢', '時間', '心', '物語', '明日', '昨日', '星', '月', '海', '風', '雨'],
    verbs: ['待つ', '想う', '追う', '抱く', '守る', '信じる', '忘れる', '会う', '去る', '残る', '飛ぶ', '落ちる', '咲く', '眠る'],
    adjectives: ['温かい', '勇気', '弱い', '強い', '孤独', '幸せ', '悲しい', '楽しい', '静か', '賑やか', '輝く', '暗い', '本当', '嘘'],
    nouns: ['光', '影', '涙', '笑顔', '約束', '秘密', '奇跡', '永遠', '瞬間', '旅', '終わり', '始まり', '翼', '海'],
    connectors: ['で', 'の', 'て', 'は', 'と', 'も', 'よう', 'が', 'を', 'に', 'から', 'まで', 'うちに'],
    endings: ['ね', 'よ', 'さ', 'な', 'かしら', '']
  },
  en: {
    subjects: ['I', 'you', 'we', 'memories', 'dreams', 'time', 'heart', 'stories', 'tomorrow', 'yesterday', 'stars', 'moon', 'ocean', 'wind', 'rain'],
    verbs: ['wait', 'miss', 'chase', 'hold', 'protect', 'believe', 'forget', 'meet', 'leave', 'stay', 'fly', 'fall', 'bloom', 'sleep'],
    adjectives: ['warm', 'brave', 'fragile', 'strong', 'lonely', 'happy', 'sad', 'joyful', 'quiet', 'loud', 'bright', 'dark', 'real', 'fake'],
    nouns: ['light', 'shadow', 'tears', 'smile', 'promise', 'secret', 'miracle', 'forever', 'moment', 'journey', 'end', 'beginning', 'wings', 'sea'],
    connectors: ['in', 'of', 'with', 'the', 'and', 'like', 'is', 'to', 'from', 'until', 'through', 'beneath', 'beyond'],
    endings: ['', '', '', '', '', '']
  }
};

const trackLibrary = {
  spotify: [
    {
      title: 'Neon Drive',
      artist: 'Synthia Lane',
      duration: '3:12',
      mood: 'energetic',
      cover: 'linear-gradient(135deg,#6f83ff,#4cd6ff)',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
    },
    {
      title: 'Cloud Letters',
      artist: 'Mika Harbor',
      duration: '4:01',
      mood: 'soft',
      cover: 'linear-gradient(135deg,#7e74ff,#be83ff)',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
    },
    {
      title: 'Pulse Bloom',
      artist: 'Rin Kairo',
      duration: '2:45',
      mood: 'hype',
      cover: 'linear-gradient(135deg,#4adfbe,#7f99ff)',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
    }
  ],
  apple: [
    {
      title: 'Moonlit Harbor',
      artist: 'Ari Moore',
      duration: '3:36',
      mood: 'soft',
      cover: 'linear-gradient(135deg,#5bb2ff,#77f3d6)',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
    },
    {
      title: 'Crystal Tape',
      artist: 'Nova Echo',
      duration: '3:58',
      mood: 'emotional',
      cover: 'linear-gradient(135deg,#6f7fff,#a176ff)',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'
    },
    {
      title: 'Afterglow Sprint',
      artist: 'Kite Theory',
      duration: '2:52',
      mood: 'energetic',
      cover: 'linear-gradient(135deg,#5ec8ff,#4de3bc)',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3'
    }
  ]
};

const defaultProfiles = [];

let companionProfiles = [];

let playlist = [];
let currentIndex = -1;
let isPlaying = false;
let danmakuTimer = null;
let activePlatform = 'spotify';

const saveMusicData = () => {
    try {
        localStorage.setItem('sx_music_playlist', JSON.stringify(playlist));
        localStorage.setItem('sx_music_platform', activePlatform);
        console.log("音樂數據已保存至 localStorage");
    } catch (e) {
        console.error("保存音樂數據失敗:", e);
    }
};

const saveToPersistentStorage = async () => {
    saveMusicData();
    if (typeof localforage !== 'undefined') {
        try {
            const existingData = await localforage.getItem('sx_app_persisted_data') || {};
            await localforage.setItem('sx_app_persisted_data', {
                ...existingData,
                sx_music_playlist: playlist,
                sx_music_platform: activePlatform
            });
            console.log("音樂數據已保存至 IndexedDB");
        } catch (e) {
            console.error("IndexedDB 保存失敗:", e);
        }
    }
};

window.addEventListener('pagehide', () => {
    saveMusicData();
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        saveMusicData();
    }
});

window.addEventListener('message', (event) => {
    if (event.data?.type === 'APP_WILL_CLOSE') {
        saveMusicData();
    }
});

function parseJSON(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeProfile(raw, fallbackId = 'custom') {
  const name = String(raw?.name || '').trim();
  if (!name) return null;

  return {
    id: String(raw?.id || `${fallbackId}-${name}`),
    name,
    personality: String(raw?.personality || '').trim(),
    background: String(raw?.background || '').trim(),
    avatar: String(raw?.avatar || '').trim()
  };
}

function loadProfilesFromSettings() {
  const profiles = [];
  const seen = new Set();

  const masks = parseJSON(localStorage.getItem('sx_masks') || '[]', []);
  const activeMask = normalizeProfile(masks[0], 'mask');
  if (activeMask && !seen.has(activeMask.name)) {
    profiles.push(activeMask);
    seen.add(activeMask.name);
  }

  const chars = parseJSON(localStorage.getItem('sx_characters') || '[]', []);
  chars.forEach((char, index) => {
    const normalized = normalizeProfile(char, `char-${index}`);
    if (!normalized || seen.has(normalized.name)) return;
    profiles.push(normalized);
    seen.add(normalized.name);
  });

  if (profiles.length === 0) {
    companionProfiles = [...defaultProfiles];
  } else {
    companionProfiles = profiles;
  }
}

function loadCharacterMemory(charName) {
  try {
    const raw = localStorage.getItem('sx_chat_history');
    if (!raw) return [];
    const history = JSON.parse(raw);
    if (!Array.isArray(history) || history.length === 0) return [];

    const charMessages = [];
    for (const session of history) {
      if (!session?.history || !Array.isArray(session.history)) continue;
      const charNameLower = (charName || '').toLowerCase();
      for (const msg of session.history) {
        const senderLower = (msg.sender || msg.role || '').toLowerCase();
        if (senderLower.includes(charNameLower) || charNameLower.includes(senderLower)) {
          charMessages.push({
            content: msg.content || msg.text || '',
            timestamp: msg.timestamp || session.timestamp || 0,
            role: msg.role || 'assistant'
          });
        }
      }
    }
    return charMessages.slice(-50);
  } catch (e) {
    console.warn('[music] 無法載入角色記憶:', e);
    return [];
  }
}

function loadCharacterSettings(charId) {
  try {
    const masks = parseJSON(localStorage.getItem('sx_masks') || '[]', []);
    const chars = parseJSON(localStorage.getItem('sx_characters') || '[]', []);
    const users = parseJSON(localStorage.getItem('sx_users') || '[]', []);

    const allPersonas = [
      ...masks.map((m, i) => ({ ...m, id: `mask-${i}`, source: 'mask' })),
      ...chars.map((c, i) => ({ ...c, id: `char-${i}`, source: 'char' })),
      ...users.map((u, i) => ({ ...u, id: `user-${i}`, source: 'user' }))
    ];

    const found = allPersonas.find(p => p.id === charId);
    if (found) {
      return {
        id: found.id,
        name: found.name || '未知角色',
        personality: found.personality || found.persona || '',
        background: found.background || found.story || '',
        avatar: found.avatar || '',
        source: found.source
      };
    }
    return null;
  } catch (e) {
    console.warn('[music] 無法載入角色設定:', e);
    return null;
  }
}

function buildCharacterContext(charId) {
  const settings = loadCharacterSettings(charId);
  if (!settings) return null;

  const memory = loadCharacterMemory(settings.name);

  return {
    ...settings,
    memory,
    memorySummary: summarizeMemory(memory)
  };
}

function summarizeMemory(memory) {
  if (!memory || memory.length === 0) return '';

  const recentTopics = new Set();
  const emotions = [];
  const keywords = [];

  for (const msg of memory.slice(-20)) {
    const text = (msg.content || '').toLowerCase();

    if (/喜歡|愛|開心|快樂|幸福/.test(text)) emotions.push('positive');
    if (/難過|悲傷|難過|哭|淚/.test(text)) emotions.push('sad');
    if (/生氣|憤怒|討厭|煩/.test(text)) emotions.push('angry');
    if (/想念|思念|懷念/.test(text)) emotions.push('missing');
    if (/擔心|害怕|焦慮/.test(text)) emotions.push('anxious');

    const musicKeywords = text.match(/(音樂|歌|旋律|節奏|作曲|唱歌|聽歌|專輯|演唱會|樂器|吉他|鋼琴)/g);
    if (musicKeywords) keywords.push(...musicKeywords);

    const moodKeywords = text.match(/(心情|情緒|感受|感覺|狀態)/g);
    if (moodKeywords) keywords.push(...moodKeywords);
  }

  const emotionCounts = {};
  emotions.forEach(e => emotionCounts[e] = (emotionCounts[e] || 0) + 1);
  const dominantEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0];

  const uniqueKeywords = [...new Set(keywords)].slice(0, 5);

  let summary = '';
  if (dominantEmotion) {
    const emotionLabels = {
      positive: '正向開心',
      sad: '悲傷低落',
      angry: '生氣不滿',
      missing: '思念懷念',
      anxious: '擔心焦慮'
    };
    summary += `近期情緒傾向：${emotionLabels[dominantEmotion[0]] || dominantEmotion[0]}。`;
  }
  if (uniqueKeywords.length > 0) {
    summary += `常談論：${uniqueKeywords.join('、')}。`;
  }

  return summary;
}

function generateContextAwareComment(charContext, track) {
  const { name, personality, background, memorySummary, memory } = charContext;

  const personalityText = (personality || '').trim();
  const backgroundText = (background || '').trim();
  const combinedText = `${personalityText} ${backgroundText}`.toLowerCase();

  const trackMood = track?.mood || 'soft';

  const moodDescriptions = {
    energetic: ['節奏感很強', '很有活力', '讓人想動起來', '能量滿滿'],
    soft: ['很溫柔', '很放鬆', '讓人平靜', '很舒服'],
    emotional: ['很有感情', '觸動人心', '情緒豐富', '很有深度'],
    hype: ['很嗨', '讓人興奮', '很有爆發力', '讓人熱血沸騰']
  };

  const moodWords = moodDescriptions[trackMood] || moodDescriptions.soft;

  const sentences = [];

  const personalityParts = personalityText.split(/[，,、。；;\s]+/).filter(p => p.trim());
  const bgParts = backgroundText.split(/[，,、。；;\s]+/).filter(p => p.trim());

  if (personalityParts.length > 0) {
    const randomTrait = personalityParts[Math.floor(Math.random() * personalityParts.length)];
    sentences.push(`以我${randomTrait}的個性來看，這首歌${moodWords[Math.floor(Math.random() * moodWords.length)]}。`);
  }

  if (bgParts.length > 0 && Math.random() > 0.5) {
    const randomBg = bgParts[Math.floor(Math.random() * bgParts.length)];
    sentences.push(`${randomBg}的我，覺得這旋律很特別。`);
  }

  if (memory && memory.length > 0) {
    const recentMsg = memory[memory.length - 1];
    if (recentMsg && recentMsg.content && Math.random() > 0.6) {
      const recentKeywords = recentMsg.content.slice(0, 20);
      sentences.push(`剛才你說「${recentKeywords}...」，聽這首有感覺嗎？`);
    }
  }

  if (memorySummary && Math.random() > 0.7) {
    sentences.push(`這種氛圍好像很適合你最近的心情呢。`);
  }

  if (sentences.length === 0) {
    sentences.push(`這首歌${moodWords[Math.floor(Math.random() * moodWords.length)]}，我喜歡。`);
  }

  return sentences.join(' ');
}

function renderProfileOptions() {
  if (!charSelect) return;

  const currentValue = charSelect.value;
  charSelect.innerHTML = '<option value="">-- 從設定載入角色 --</option>' +
    companionProfiles.map(profile => `
      <option value="${profile.id}">${profile.name}</option>
    `).join('');

  const hasCurrent = companionProfiles.some(profile => profile.id === currentValue);
  charSelect.value = hasCurrent ? currentValue : (companionProfiles[0]?.id || '');
}

function getCurrentProfile() {
  const selectedId = charSelect?.value;
  if (!selectedId) {
    return null;
  }
  const selected = companionProfiles.find(profile => profile.id === selectedId);
  return selected || null;
}

function detectTone(personality = '') {
  const toneText = personality.toLowerCase();
  if (/(毒舌|挑剔|犀利|冷淡|批判)/.test(toneText)) return 'sharp';
  if (/(詩|文藝|浪漫|意象|感性)/.test(toneText)) return 'poetic';
  if (/(激動|爆發|熱血|瘋|亢奮)/.test(toneText)) return 'chaotic';
  if (/(溫柔|療癒|鼓勵|貼心|安撫)/.test(toneText)) return 'sweet';
  return 'neutral';
}

function generatePersonalityComment(profile, track) {
  const personality = (profile.personality || '').trim();
  const background = (profile.background || '').trim();
  const name = profile.name || '角色';

  if (!personality && !background) {
    return `這首歌聽起來不錯呢。`;
  }

  const combinedText = `${personality} ${background}`.toLowerCase();
  const trackMood = track?.mood || 'soft';

  const moodDescriptions = {
    energetic: ['節奏感很強', '很有活力', '讓人想動起來', '能量滿滿'],
    soft: ['很溫柔', '很放鬆', '讓人平靜', '很舒服'],
    emotional: ['很有感情', '觸動人心', '情緒豐富', '很有深度'],
    hype: ['很嗨', '讓人興奮', '很有爆發力', '讓人熱血沸騰']
  };

  const moodWords = moodDescriptions[trackMood] || moodDescriptions.soft;

  const personalityKeywords = [];

  if (/(溫柔|溫暖|貼心|療癒|安撫|柔和|善良|體貼)/.test(combinedText)) {
    personalityKeywords.push('溫柔地說');
  }
  if (/(毒舌|挑剔|犀利|批判|直接|嚴格|嚴厲)/.test(combinedText)) {
    personalityKeywords.push('直接地說');
  }
  if (/(詩|文藝|浪漫|意象|感性|細膩|優雅)/.test(combinedText)) {
    personalityKeywords.push('詩意地說');
  }
  if (/(激動|爆發|熱血|瘋|亢奮|活潑|熱情|開朗)/.test(combinedText)) {
    personalityKeywords.push('興奮地說');
  }
  if (/(冷靜|沉穩|理性|理智|冷靜|沉著)/.test(combinedText)) {
    personalityKeywords.push('冷靜地說');
  }
  if (/(幽默|有趣|可愛|俏皮|調皮|風趣)/.test(combinedText)) {
    personalityKeywords.push('俏皮地說');
  }
  if (/(神秘|高冷|酷|冷淡|疏離)/.test(combinedText)) {
    personalityKeywords.push('淡淡地說');
  }
  if (/(認真|嚴肅|專注|執著|堅持)/.test(combinedText)) {
    personalityKeywords.push('認真地說');
  }

  const sentences = [];

  const personalityParts = personality.split(/[，,、。；;\s]+/).filter(p => p.trim());
  const bgParts = background.split(/[，,、。；;\s]+/).filter(p => p.trim());

  if (personalityParts.length > 0) {
    const randomTrait = personalityParts[Math.floor(Math.random() * personalityParts.length)];
    sentences.push(`以我${randomTrait}的個性來看，這首歌${moodWords[Math.floor(Math.random() * moodWords.length)]}。`);
  }

  if (bgParts.length > 0) {
    const randomBg = bgParts[Math.floor(Math.random() * bgParts.length)];
    if (Math.random() > 0.5) {
      sentences.push(`${randomBg}的我，覺得這旋律很特別。`);
    }
  }

  if (sentences.length === 0) {
    sentences.push(`這首歌${moodWords[Math.floor(Math.random() * moodWords.length)]}，我喜歡。`);
  }

  return sentences.join(' ');
}

function formatTime(sec = 0) {
  const value = Number.isFinite(sec) ? sec : 0;
  const mins = Math.floor(value / 60);
  const secs = Math.floor(value % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function getCurrentTrack() {
  return playlist[currentIndex] || null;
}

function updateCompanionStatus() {
  const userName = userNameInput.value.trim() || '你';
  const profile = getCurrentProfile();

  if (!profile) {
    charDescEl.textContent = '請從設定中載入角色，或到設定新增角色。';
    listenStatusEl.textContent = '請選擇角色開始一起聽歌';
    return;
  }

  const charContext = buildCharacterContext(profile.id);

  let descText = profile.personality || profile.background || '這個角色還沒有設定個性描述。';

  if (charContext && charContext.memorySummary) {
    descText += ` ${charContext.memorySummary}`;
  }

  charDescEl.textContent = descText.slice(0, 100) + (descText.length > 100 ? '...' : '');
  listenStatusEl.textContent = `${userName} 與 ${profile.name} 正在一起聽歌`;
}

function renderPlaylist() {
  queueCount.textContent = `${playlist.length} 首`;

  if (playlist.length === 0) {
    playlistList.innerHTML = '<li class="playlist-item"><div><div class="title">尚未匯入歌單</div><div class="meta">請先貼上 Spotify / Apple Music 連結</div></div></li>';
    return;
  }

  playlistList.innerHTML = playlist.map((track, index) => `
    <li>
      <button class="playlist-item ${index === currentIndex ? 'active' : ''}" data-index="${index}" type="button">
        <div>
          <div class="title">${track.title}</div>
          <div class="meta">${track.artist} · ${track.duration}</div>
        </div>
        <i class="fas ${index === currentIndex ? 'fa-volume-high' : 'fa-play'}"></i>
      </button>
    </li>
  `).join('');
}

function updateTrackUI(track) {
  if (!track) {
    trackTitleEl.textContent = '尚未播放';
    trackMetaEl.textContent = '請先匯入歌單';
    coverArt.style.background = 'linear-gradient(135deg,#6f83ff,#52e0c8)';
    return;
  }

  trackTitleEl.textContent = track.title;
  trackMetaEl.textContent = `${track.artist} · ${track.duration}`;
  coverArt.style.background = track.cover;
}

function stopDanmaku() {
  if (danmakuTimer) {
    clearInterval(danmakuTimer);
    danmakuTimer = null;
  }
}

function pushDanmaku(text) {
  if (!text) return;
  const msg = document.createElement('span');
  msg.className = 'danmaku-msg';
  msg.textContent = text;
  msg.style.top = `${Math.floor(Math.random() * 66) + 6}%`;
  msg.style.animationDuration = `${Math.random() * 4 + 7}s`;
  danmakuLayer.appendChild(msg);

  msg.addEventListener('animationend', () => {
    msg.remove();
  });
}

function triggerCharComment() {
  const track = getCurrentTrack();
  if (!track) return;

  const profile = getCurrentProfile();
  if (!profile) {
    pushDanmaku('系統：請先選擇一個角色開始一起聽歌。');
    return;
  }

  const charContext = buildCharacterContext(profile.id);

  let comment;
  if (charContext && charContext.memory && charContext.memory.length > 0) {
    comment = generateContextAwareComment(charContext, track);
  } else {
    comment = generatePersonalityComment(profile, track);
  }

  pushDanmaku(`${profile.name}：${comment}`);
}

function startDanmaku() {
  stopDanmaku();
  triggerCharComment();
  danmakuTimer = setInterval(() => {
    if (!isPlaying) return;
    triggerCharComment();
  }, 5200);
}

async function loadTrack(index, autoPlay = false) {
  if (!playlist[index]) return;

  currentIndex = index;
  const track = playlist[index];
  audio.src = track.url;
  audio.load();
  updateTrackUI(track);
  renderPlaylist();

  if (autoPlay) {
    try {
      await audio.play();
      isPlaying = true;
      playBtn.innerHTML = '<i class="fas fa-pause"></i>';
      startDanmaku();
    } catch (error) {
      isPlaying = false;
      playBtn.innerHTML = '<i class="fas fa-play"></i>';
      pushDanmaku('系統：瀏覽器阻擋了自動播放，請手動點播放。');
    }
  }
}

function togglePlay() {
  if (currentIndex < 0) {
    if (playlist.length > 0) {
      loadTrack(0, true);
    }
    return;
  }

  if (audio.paused) {
    audio.play().then(() => {
      isPlaying = true;
      playBtn.innerHTML = '<i class="fas fa-pause"></i>';
      startDanmaku();
    }).catch(() => {
      pushDanmaku('系統：無法播放這首歌，請換一首試試。');
    });
  } else {
    audio.pause();
    isPlaying = false;
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    stopDanmaku();
  }
}

function playNext() {
  if (playlist.length === 0) return;
  const next = (currentIndex + 1) % playlist.length;
  loadTrack(next, true);
}

function playPrev() {
  if (playlist.length === 0) return;
  const prev = (currentIndex - 1 + playlist.length) % playlist.length;
  loadTrack(prev, true);
}

function validateImportURL(platform, url) {
  if (!url.trim()) return true;
  if (platform === 'spotify') return url.includes('spotify.com');
  if (platform === 'apple') return url.includes('music.apple.com');
  return true;
}

function isExternalPlatform(platform) {
  return platform === 'netease' || platform === 'soundcloud';
}

function updateImportNotice() {
  if (!importNotice) return;
  importNotice.hidden = !isExternalPlatform(platformSelect?.value || '');
}

function importPlaylist() {
  const platform = platformSelect.value;
  const url = playlistUrlInput.value.trim();
  activePlatform = platform;

  updateImportNotice();
  if (isExternalPlatform(platform)) {
    if (!url) {
      pushDanmaku('系統：請先貼上歌單連結。');
      return;
    }
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('連結無法取得');
        return res.json();
      })
      .then(data => {
        const list = Array.isArray(data) ? data : data?.tracks;
        if (!Array.isArray(list)) throw new Error('清單格式錯誤');
        playlist = list.map(item => ({
          title: item.title || '未知歌曲',
          artist: item.artist || '未知作者',
          duration: item.duration || '--:--',
          mood: item.mood || 'soft',
          cover: item.cover || 'linear-gradient(135deg,#6f83ff,#4cd6ff)',
          url: item.url
        })).filter(item => item.url);

        localStorage.setItem('sx_music_playlist', JSON.stringify(playlist));
        localStorage.setItem('sx_music_platform', platform);

        currentIndex = -1;
        isPlaying = false;
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
        progressEl.value = 0;
        currentTimeEl.textContent = '0:00';
        totalTimeEl.textContent = '0:00';
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        renderPlaylist();
        updateTrackUI(null);
        stopDanmaku();
        pushDanmaku(`系統：已從 JSON 匯入 ${playlist.length} 首歌曲。`);
        if (playlist.length > 0) {
          loadTrack(0, false);
        }
      })
      .catch(() => {
        pushDanmaku('系統：無法載入清單，請確認 JSON 格式與 CORS。');
      });
    return;
  }

  if (!validateImportURL(platform, url)) {
    pushDanmaku('系統：連結平台不一致，請確認 Spotify / Apple Music。');
    return;
  }

  playlist = (trackLibrary[platform] || []).map(track => ({ ...track }));
  localStorage.setItem('sx_music_playlist', JSON.stringify(playlist));
  localStorage.setItem('sx_music_platform', platform);
  currentIndex = -1;
  isPlaying = false;

  audio.pause();
  audio.removeAttribute('src');
  audio.load();
  progressEl.value = 0;
  currentTimeEl.textContent = '0:00';
  totalTimeEl.textContent = '0:00';
  playBtn.innerHTML = '<i class="fas fa-play"></i>';

  renderPlaylist();
  updateTrackUI(null);
  stopDanmaku();
  pushDanmaku(`系統：已從 ${platform === 'spotify' ? 'Spotify' : 'Apple Music'} 匯入 ${playlist.length} 首歌曲。`);

  if (playlist.length > 0) {
    loadTrack(0, false);
  }
}

function bindEvents() {
  platformSelect?.addEventListener('change', updateImportNotice);
  importBtn?.addEventListener('click', importPlaylist);
  refreshBtn?.addEventListener('click', importPlaylist);

  spotifyLoginBtn?.addEventListener('click', () => {
    const clientId = spotifyClientIdInput?.value.trim();
    const redirect = spotifyRedirectInput?.value.trim();
    if (!clientId || !redirect) {
      alert('請先填入 Client ID 與 Redirect URI');
      return;
    }
    const scope = encodeURIComponent('playlist-read-private user-read-email');
    const url = `https://accounts.spotify.com/authorize?response_type=token&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirect)}&scope=${scope}`;
    window.open(url, '_blank');
  });

  spotifySaveTokenBtn?.addEventListener('click', () => {
    const token = spotifyTokenInput?.value.trim();
    if (!token) {
      alert('請先貼上 Access Token');
      return;
    }
    localStorage.setItem('sx_spotify_access_token', token);
    alert('✅ 已儲存 Access Token（示範用途）');
  });

  userNameInput?.addEventListener('input', updateCompanionStatus);
  charSelect?.addEventListener('change', () => {
    updateCompanionStatus();
    triggerCharComment();
  });

  playlistList?.addEventListener('click', (event) => {
    const button = event.target.closest('.playlist-item');
    if (!button) return;
    const index = Number.parseInt(button.dataset.index || '-1', 10);
    if (index >= 0) loadTrack(index, true);
  });

  playBtn?.addEventListener('click', togglePlay);
  prevBtn?.addEventListener('click', playPrev);
  nextBtn?.addEventListener('click', playNext);

  audio?.addEventListener('loadedmetadata', () => {
    totalTimeEl.textContent = formatTime(audio.duration);
  });

  audio?.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    progressEl.value = (audio.currentTime / audio.duration) * 100;
    currentTimeEl.textContent = formatTime(audio.currentTime);
  });

  progressEl?.addEventListener('input', () => {
    if (!audio.duration) return;
    audio.currentTime = (Number(progressEl.value) / 100) * audio.duration;
  });

  audio?.addEventListener('ended', playNext);
}

function loadPlaylistFromStorage() {
  const raw = localStorage.getItem('sx_music_playlist');
  const stored = parseJSON(raw || '[]', []);
  if (Array.isArray(stored) && stored.length) {
    playlist = stored;
    currentIndex = -1;
    isPlaying = false;
    renderPlaylist();
    updateTrackUI(null);
  }
  const storedPlatform = localStorage.getItem('sx_music_platform');
  if (storedPlatform) {
    activePlatform = storedPlatform;
    if (platformSelect) platformSelect.value = storedPlatform;
  }
}

function handleExternalPlay() {
  if (playlist.length === 0) {
    loadPlaylistFromStorage();
  }
  if (playlist.length === 0) {
    playlist = (trackLibrary[activePlatform] || trackLibrary.spotify || []).map(track => ({ ...track }));
    renderPlaylist();
  }
  if (currentIndex < 0) {
    loadTrack(0, true);
  } else if (audio.paused) {
    togglePlay();
  }
}

window.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;
  if (data.type === 'MUSIC_PLAY') {
    handleExternalPlay();
  }
});

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function generateMelody(bars = 4, scale = 'major', temperature = 1) {
  const scaleNotes = SCALES[scale] || SCALES.major;
  const baseNote = 60;
  const notesPerBar = 8;
  const totalNotes = bars * notesPerBar;
  const melody = [];

  let lastNote = baseNote + scaleNotes[Math.floor(scaleNotes.length / 2)];

  for (let i = 0; i < totalNotes; i++) {
    const rand = Math.random();
    if (rand < 0.15 * temperature) {
      melody.push({ pitch: null, duration: 1, time: i });
      continue;
    }

    const interval = scaleNotes[Math.floor(Math.random() * scaleNotes.length)];
    const octaveJump = Math.floor(Math.random() * 3) - 1;
    const targetNote = baseNote + (octaveJump * 12) + interval;

    const smoothFactor = 0.7 - (temperature * 0.2);
    const pitch = Math.round(lastNote * smoothFactor + targetNote * (1 - smoothFactor));
    lastNote = pitch;

    const duration = Math.random() < 0.3 ? 0.5 : 1;
    const velocity = 0.6 + Math.random() * 0.4;

    melody.push({ pitch, duration, time: i, velocity });
  }

  return melody;
}

function continueMelody(existingMelody, bars = 4, variation = 0.5) {
  if (!existingMelody || existingMelody.length === 0) {
    return generateMelody(bars, 'major', variation + 0.5);
  }

  const lastNote = existingMelody[existingMelody.length - 1];
  const basePitch = lastNote.pitch || 60;
  const newMelody = generateMelody(bars, 'major', variation + 0.5);

  const pitchDiff = basePitch - (newMelody[0]?.pitch || 60);
  return newMelody.map(n => ({
    ...n,
    pitch: n.pitch ? n.pitch + pitchDiff : null
  }));
}

function interpolateMelodies(melodyA, melodyB, steps = 8) {
  if (!melodyA.length || !melodyB.length) return [];

  const result = [];
  const maxLen = Math.max(melodyA.length, melodyB.length);

  for (let s = 0; s < steps; s++) {
    const t = s / (steps - 1);
    const interpMelody = [];

    for (let i = 0; i < maxLen; i++) {
      const noteA = melodyA[i % melodyA.length];
      const noteB = melodyB[i % melodyB.length];

      if (!noteA?.pitch && !noteB?.pitch) {
        interpMelody.push({ pitch: null, duration: 1, time: i });
        continue;
      }

      const pitchA = noteA?.pitch || noteB?.pitch || 60;
      const pitchB = noteB?.pitch || noteA?.pitch || 60;
      const pitch = Math.round(pitchA * (1 - t) + pitchB * t);

      const velA = noteA?.velocity || 0.7;
      const velB = noteB?.velocity || 0.7;
      const velocity = velA * (1 - t) + velB * t;

      interpMelody.push({ pitch, duration: 1, time: i, velocity });
    }

    result.push(interpMelody);
  }

  return result.flat();
}

function applyGroove(melody, swing = 0.5, velocityVar = 0.3) {
  return melody.map((note, i) => {
    if (!note.pitch) return note;

    const swingOffset = (i % 2 === 1) ? swing * 0.1 : 0;
    const timeOffset = note.time + swingOffset;
    const newVelocity = note.velocity * (1 - velocityVar * 0.5 + Math.random() * velocityVar);

    return {
      ...note,
      time: timeOffset,
      velocity: Math.max(0.3, Math.min(1, newVelocity))
    };
  });
}

function generateDrums(style = 'rock', complexity = 3, bars = 4) {
  const pattern = DRUM_PATTERNS[style] || DRUM_PATTERNS.rock;
  const drums = [];
  const stepsPerBar = 8;
  const totalSteps = bars * stepsPerBar;

  for (let i = 0; i < totalSteps; i++) {
    const step = i % 8;
    const variation = Math.random() < (complexity * 0.1);

    if (pattern.kick[step] || (variation && Math.random() < 0.3)) {
      drums.push({ pitch: 36, time: i, duration: 0.5, velocity: 0.8 + Math.random() * 0.2 });
    }
    if (pattern.snare[step] || (variation && Math.random() < 0.2)) {
      drums.push({ pitch: 38, time: i, duration: 0.5, velocity: 0.7 + Math.random() * 0.3 });
    }
    if (pattern.hihat[step] || variation) {
      drums.push({ pitch: 42, time: i, duration: 0.25, velocity: 0.4 + Math.random() * 0.3 });
    }
  }

  return drums;
}

function transformMelody(melody, mode = 'invert') {
  if (!melody.length) return [];

  const pitches = melody.filter(n => n.pitch).map(n => n.pitch);
  const avgPitch = pitches.reduce((a, b) => a + b, 0) / pitches.length;

  switch (mode) {
    case 'invert':
      return melody.map(n => ({
        ...n,
        pitch: n.pitch ? Math.round(2 * avgPitch - n.pitch) : null
      }));
    case 'retrograde':
      return [...melody].reverse().map((n, i) => ({ ...n, time: i }));
    case 'augment':
      return melody.flatMap(n => [
        { ...n, duration: n.duration * 2, time: n.time * 2 },
        { pitch: null, duration: n.duration, time: n.time * 2 + 1 }
      ]);
    case 'diminish':
      return melody.map(n => ({
        ...n,
        duration: n.duration / 2,
        time: n.time / 2
      })).filter(n => n.time < melody.length);
    default:
      return melody;
  }
}

function drawPianoRoll(melody) {
  const canvas = document.getElementById('piano-roll-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  ctx.fillStyle = '#060a10';
  ctx.fillRect(0, 0, width, height);

  if (!melody || melody.length === 0) {
    ctx.fillStyle = '#4a5568';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('尚未生成旋律', width / 2, height / 2);
    return;
  }

  const pitches = melody.filter(n => n.pitch).map(n => n.pitch);
  if (pitches.length === 0) return;

  const minPitch = Math.min(...pitches) - 2;
  const maxPitch = Math.max(...pitches) + 2;
  const pitchRange = maxPitch - minPitch;

  const maxTime = Math.max(...melody.map(n => n.time)) + 1;
  const cellWidth = width / maxTime;
  const cellHeight = height / pitchRange;

  ctx.strokeStyle = '#1a2332';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= maxTime; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cellWidth, 0);
    ctx.lineTo(i * cellWidth, height);
    ctx.stroke();
  }

  melody.forEach(note => {
    if (!note.pitch) return;

    const x = note.time * cellWidth;
    const y = height - (note.pitch - minPitch) * cellHeight;
    const w = (note.duration || 1) * cellWidth * 0.9;
    const h = cellHeight * 0.85;

    const gradient = ctx.createLinearGradient(x, y, x + w, y);
    gradient.addColorStop(0, '#6366f1');
    gradient.addColorStop(1, '#8b5cf6');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(x + 1, y - h, w - 2, h, 3);
    ctx.fill();

    ctx.fillStyle = `rgba(255, 255, 255, ${note.velocity || 0.7})`;
    ctx.fillRect(x + 2, y - h + 1, w - 4, 2);
  });
}

async function playMelody(melody, tempo = 120) {
  if (!melody || melody.length === 0) return;

  const ctx = getAudioContext();
  if (ctx.state === 'suspended') await ctx.resume();

  const beatDuration = 60 / tempo;
  const sixteenthNote = beatDuration / 2;

  if (aiPlaybackTimeout) {
    clearTimeout(aiPlaybackTimeout);
    aiPlaybackTimeout = null;
  }

  const sortedNotes = [...melody].filter(n => n.pitch).sort((a, b) => a.time - b.time);

  sortedNotes.forEach(note => {
    const startTime = note.time * sixteenthNote;
    const duration = (note.duration || 1) * sixteenthNote;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = midiToFreq(note.pitch);

    gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
    gain.gain.linearRampToValueAtTime(0.15 * (note.velocity || 0.7), ctx.currentTime + startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration * 0.9);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + startTime);
    osc.stop(ctx.currentTime + startTime + duration);
  });

  const totalTime = (Math.max(...melody.map(n => n.time)) + 2) * sixteenthNote * 1000;
  return new Promise(resolve => {
    aiPlaybackTimeout = setTimeout(resolve, totalTime);
  });
}

function addAIToPlaylist(melody) {
  if (!melody || melody.length === 0) return;

  const track = {
    title: `AI 生成 #${playlist.length + 1}`,
    artist: 'Magenta 靈感',
    duration: `${Math.ceil(melody.length / 8)}:00`,
    mood: 'generated',
    cover: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    url: null,
    aiMelody: melody
  };

  playlist.push(track);
  localStorage.setItem('sx_music_playlist', JSON.stringify(playlist));
  renderPlaylist();
  pushDanmaku(`系統：已將 AI 生成旋律加入播放清單。`);
}

function loadCharactersForMusic() {
  const charMusicSelect = document.getElementById('char-music-select');
  if (!charMusicSelect) return;

  const characters = [];
  
  try {
    const masks = parseJSON(localStorage.getItem('sx_masks') || '[]', []);
    const chars = parseJSON(localStorage.getItem('sx_characters') || '[]', []);
    const users = parseJSON(localStorage.getItem('sx_users') || '[]', []);
    
    masks.forEach((mask, i) => {
      if (mask?.name) {
        characters.push({
          id: `mask-${i}`,
          name: mask.name,
          personality: mask.personality || mask.persona || '神秘角色',
          source: 'mask'
        });
      }
    });
    
    chars.forEach((char, i) => {
      if (char?.name) {
        characters.push({
          id: `char-${i}`,
          name: char.name,
          personality: char.personality || char.persona || '自訂角色',
          source: 'char'
        });
      }
    });
    
    users.forEach((user, i) => {
      if (user?.name) {
        characters.push({
          id: `user-${i}`,
          name: user.name,
          personality: user.personality || user.persona || '使用者',
          source: 'user'
        });
      }
    });
  } catch (e) {
    console.warn('Failed to load characters:', e);
  }

  if (characters.length === 0) {
    characters.push(
      { id: 'default-sweet', name: '暖心療癒型', personality: '溫柔、會安撫情緒，偏正向鼓勵。', source: 'default' },
      { id: 'default-sharp', name: '毒舌樂評型', personality: '直接、挑剔，重視編曲與人聲細節。', source: 'default' },
      { id: 'default-poetic', name: '詩意感性型', personality: '文藝、意象化，喜歡把音樂轉成畫面。', source: 'default' },
      { id: 'default-chaotic', name: '情緒爆發型', personality: '反應激烈、即時吐槽，情緒外放。', source: 'default' }
    );
  }

  charMusicSelect.innerHTML = '<option value="">-- 選擇角色 --</option>' + 
    characters.map(char => `<option value="${char.id}">${char.name}</option>`).join('');
  
  return characters;
}

function getCharacterById(charId) {
  const characters = loadCharactersForMusic();
  return characters?.find(c => c.id === charId) || null;
}

function analyzePersonalityForMusic(personality) {
  const text = (personality || '').toLowerCase();
  
  let energy = 0.5;
  let warmth = 0.5;
  let complexity = 0.5;
  let playfulness = 0.5;
  
  if (/(溫柔|療癒|貼心|安撫|溫暖|柔和)/.test(text)) {
    warmth = 0.8;
    energy = 0.3;
  }
  if (/(毒舌|挑剔|犀利|批判|直接)/.test(text)) {
    warmth = 0.3;
    complexity = 0.7;
  }
  if (/(詩|文藝|浪漫|意象|感性|細膩)/.test(text)) {
    complexity = 0.8;
    warmth = 0.6;
  }
  if (/(激動|爆發|熱血|瘋|亢奮|活力)/.test(text)) {
    energy = 0.9;
    playfulness = 0.7;
  }
  if (/(幽默|有趣|可愛|俏皮)/.test(text)) {
    playfulness = 0.8;
    warmth = 0.6;
  }
  if (/(冷靜|沉穩|安定|理性)/.test(text)) {
    energy = 0.3;
    complexity = 0.6;
  }
  if (/(熱情|開朗|活潑)/.test(text)) {
    energy = 0.7;
    warmth = 0.7;
    playfulness = 0.6;
  }
  
  return { energy, warmth, complexity, playfulness };
}

function generateMelodyByCharacter(char, mood, style, lang, bars = 8, theme = '') {
  const moodConfig = MOOD_CONFIGS[mood] || MOOD_CONFIGS.calm;
  const styleConfig = STYLE_CONFIGS[style] || STYLE_CONFIGS.pop;
  const personality = analyzePersonalityForMusic(char?.personality || '');
  
  const scaleNotes = SCALES[moodConfig.scale] || SCALES.major;
  const baseNote = moodConfig.avgPitch;
  const notesPerBar = 8;
  const totalNotes = bars * notesPerBar;
  const melody = [];
  
  const density = moodConfig.noteDensity * (0.8 + personality.energy * 0.4);
  const variation = styleConfig.rhythmVariation * (0.7 + personality.playfulness * 0.6);
  
  let lastPitch = baseNote;
  
  for (let i = 0; i < totalNotes; i++) {
    const rand = Math.random();
    
    if (rand > density) {
      melody.push({ pitch: null, duration: 1, time: i });
      continue;
    }
    
    const scaleIndex = Math.floor(Math.random() * scaleNotes.length);
    const octaveShift = Math.floor(Math.random() * 3) - 1;
    const targetPitch = baseNote + (octaveShift * 12) + scaleNotes[scaleIndex];
    
    const smoothFactor = 0.6 - variation * 0.3;
    const pitch = Math.round(lastPitch * smoothFactor + targetPitch * (1 - smoothFactor));
    lastPitch = pitch;
    
    const durationRand = Math.random();
    let duration = 1;
    if (durationRand < 0.2 * personality.complexity) {
      duration = 0.5;
    } else if (durationRand > 0.85 - 0.1 * personality.warmth) {
      duration = 2;
    }
    
    const velocity = 0.5 + 
      (personality.energy * 0.2) + 
      (Math.sin(i * 0.5) * 0.1 * variation) +
      (Math.random() * 0.2);
    
    melody.push({
      pitch,
      duration: Math.min(duration, 2),
      time: i,
      velocity: Math.max(0.3, Math.min(1, velocity))
    });
  }
  
  const lyrics = generateLyrics(mood, lang, bars, personality, theme, char?.name);
  
  return { melody, lyrics };
}

function generateLyrics(mood, lang, bars, personality, theme, charName) {
  if (lang === 'instrumental') {
    return null;
  }
  
  const wordBank = WORD_BANKS[lang] || WORD_BANKS.zh;
  const lines = [];
  const linesNeeded = Math.min(bars, 4);
  
  const themeWords = theme ? theme.split(/[,\s，、]+/).filter(w => w.trim()) : [];
  
  const moodModifiers = {
    calm: { pace: 0.3, repetition: 0.6, abstraction: 0.5 },
    happy: { pace: 0.5, repetition: 0.3, abstraction: 0.3 },
    sad: { pace: 0.2, repetition: 0.7, abstraction: 0.6 },
    energetic: { pace: 0.8, repetition: 0.2, abstraction: 0.2 },
    romantic: { pace: 0.4, repetition: 0.5, abstraction: 0.4 },
    mysterious: { pace: 0.3, repetition: 0.4, abstraction: 0.8 }
  };
  
  const moodMod = moodModifiers[mood] || moodModifiers.calm;
  
  for (let i = 0; i < linesNeeded; i++) {
    const line = generateLyricLine(
      wordBank, 
      personality, 
      moodMod, 
      themeWords, 
      lang,
      i,
      linesNeeded
    );
    lines.push(line);
  }
  
  return lines;
}

function generateLyricLine(wordBank, personality, moodMod, themeWords, lang, lineIndex, totalLines) {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  
  let line = '';
  const structure = Math.random();
  
  const warmth = personality.warmth || 0.5;
  const energy = personality.energy || 0.5;
  const complexity = personality.complexity || 0.5;
  const playfulness = personality.playfulness || 0.5;
  
  if (lang === 'zh') {
    if (structure < 0.4) {
      const subj = themeWords.length > 0 && Math.random() > 0.5 ? pick(themeWords) : pick(wordBank.subjects);
      const verb = pick(wordBank.verbs);
      const adj = pick(wordBank.adjectives);
      line = `${subj}${pick(wordBank.connectors)}${adj}${verb}`;
    } else if (structure < 0.7) {
      const subj = pick(wordBank.subjects);
      const verb = pick(wordBank.verbs);
      const noun = pick(wordBank.nouns);
      line = `${subj}${verb}${pick(wordBank.connectors)}${noun}`;
    } else {
      const adj = pick(wordBank.adjectives);
      const noun = pick(wordBank.nouns);
      const verb = pick(wordBank.verbs);
      line = `${adj}${pick(wordBank.connectors)}${noun}${verb}`;
    }
    
    if (warmth > 0.6 && Math.random() > 0.6) {
      const warmWords = ['溫柔', '輕輕', '靜靜', '慢慢'];
      line = pick(warmWords) + line;
    }
    
    if (energy > 0.7 && Math.random() > 0.7) {
      const energyWords = ['燃燒', '衝破', '飛越', '吶喊'];
      line = pick(energyWords) + line.slice(0, Math.floor(line.length / 2));
    }
    
    if (playfulness > 0.6 && Math.random() > 0.8) {
      line += pick(['～', '♪', '☆', '★']);
    }
    
  } else if (lang === 'ko') {
    if (structure < 0.4) {
      const subj = themeWords.length > 0 && Math.random() > 0.5 ? pick(themeWords) : pick(wordBank.subjects);
      const verb = pick(wordBank.verbs);
      const adj = pick(wordBank.adjectives);
      line = `${subj}${pick(wordBank.connectors)}${adj} ${verb}`;
    } else if (structure < 0.7) {
      const subj = pick(wordBank.subjects);
      const verb = pick(wordBank.verbs);
      const noun = pick(wordBank.nouns);
      line = `${subj} ${verb} ${pick(wordBank.connectors)} ${noun}`;
    } else {
      const adj = pick(wordBank.adjectives);
      const noun = pick(wordBank.nouns);
      line = `${adj} ${pick(wordBank.connectors)} ${noun}`;
    }
    
    if (warmth > 0.6 && Math.random() > 0.6) {
      const warmWords = ['따뜻하게', '조용히', '천천히'];
      line = pick(warmWords) + ' ' + line;
    }
    
  } else if (lang === 'ja') {
    if (structure < 0.4) {
      const subj = themeWords.length > 0 && Math.random() > 0.5 ? pick(themeWords) : pick(wordBank.subjects);
      const verb = pick(wordBank.verbs);
      line = `${subj}${pick(wordBank.connectors)}${verb}`;
    } else if (structure < 0.7) {
      const adj = pick(wordBank.adjectives);
      const noun = pick(wordBank.nouns);
      line = `${adj}${pick(wordBank.connectors)}${noun}`;
    } else {
      const subj = pick(wordBank.subjects);
      const verb = pick(wordBank.verbs);
      line = `${subj}を${verb}`;
    }
    
  } else if (lang === 'en') {
    if (structure < 0.4) {
      const subj = themeWords.length > 0 && Math.random() > 0.5 ? pick(themeWords) : pick(wordBank.subjects);
      const verb = pick(wordBank.verbs);
      const noun = pick(wordBank.nouns);
      line = `${subj} ${verb} ${pick(wordBank.connectors)} ${noun}`;
    } else if (structure < 0.7) {
      const adj = pick(wordBank.adjectives);
      const noun = pick(wordBank.nouns);
      const verb = pick(wordBank.verbs);
      line = `${adj} ${noun} ${verb}`;
    } else {
      const subj = pick(wordBank.subjects);
      const verb = pick(wordBank.verbs);
      const adj = pick(wordBank.adjectives);
      line = `${subj} ${verb} so ${adj}`;
    }
    
  } else if (lang === 'mixed') {
    const langs = ['zh', 'ko', 'ja', 'en'];
    const chosenLang = pick(langs);
    const mixedBank = WORD_BANKS[chosenLang];
    return generateLyricLine(mixedBank, personality, moodMod, themeWords, chosenLang, lineIndex, totalLines);
  }
  
  if (complexity > 0.6 && Math.random() > 0.5) {
    const extraNoun = pick(wordBank.nouns);
    const connector = pick(wordBank.connectors);
    line += ` ${connector} ${extraNoun}`;
  }
  
  return line.trim();
}

function formatLyricsDisplay(lyrics, lang) {
  if (!lyrics) return '（純音樂演奏）';
  
  const langNames = {
    zh: '中文',
    ko: '韓文',
    ja: '日文',
    en: '英文',
    mixed: '混合語言',
    instrumental: '純音樂'
  };
  
  return `【${langNames[lang] || '歌詞'}】\n` + lyrics.map((line, i) => `${i + 1}. ${line}`).join('\n');
}

function generateCharacterMusicDescription(char, mood, style, lang, melodyData) {
  const moodNames = {
    calm: '平靜放鬆',
    happy: '開心愉悅',
    sad: '憂鬱感性',
    energetic: '活力充沛',
    romantic: '浪漫溫馨',
    mysterious: '神秘夢幻'
  };
  
  const styleNames = {
    pop: '流行',
    ballad: '抒情',
    rnb: 'R&B',
    electronic: '電子',
    acoustic: '木吉他',
    jazz: '爵士'
  };
  
  const langNames = {
    zh: '中文',
    ko: '韓文',
    ja: '日文',
    en: '英文',
    mixed: '混合語言',
    instrumental: '純音樂'
  };
  
  const melody = melodyData?.melody || melodyData || [];
  const noteCount = melody.filter(n => n.pitch).length;
  const avgVelocity = melody.filter(n => n.velocity).reduce((a, b) => a + b.velocity, 0) / noteCount || 0.7;
  
  const energyDesc = avgVelocity > 0.7 ? '充滿能量' : avgVelocity > 0.5 ? '溫和流暢' : '輕柔細膩';
  const langDesc = lang === 'instrumental' ? '純音樂演奏' : `${langNames[lang] || '中文'}歌詞`;
  
  return `${char?.name || '角色'}為你創作了一段${moodNames[mood] || '獨特'}的${styleNames[style] || '風格'}旋律，` +
    `共 ${noteCount} 個音符，${energyDesc}。${langDesc}。` +
    `這段音樂融合了角色的個性：「${(char?.personality || '獨特風格').slice(0, 30)}...」`;
}

async function publishToBubbles(track, message) {
  const publishStatus = document.getElementById('publish-status');
  const publishStatusText = document.getElementById('publish-status-text');
  const publishStatusIcon = document.getElementById('publish-status-icon');
  
  publishStatus?.classList.remove('hidden');
  publishStatusText.textContent = '發布中...';
  publishStatusIcon.textContent = '⏳';
  
  await new Promise(r => setTimeout(r, 800));
  
  const musicPost = {
    type: 'MUSIC_POST_TO_BUBBLES',
    track: {
      title: track.title,
      artist: track.artist,
      duration: track.duration,
      cover: track.cover,
      aiMelody: track.aiMelody,
      lyrics: track.lyrics,
      lang: track.lang
    },
    message: message || '',
    timestamp: Date.now()
  };
  
  if (window.parent && window.parent !== window) {
    window.parent.postMessage(musicPost, '*');
  }
  
  localStorage.setItem('sx_bubbles_music_post', JSON.stringify(musicPost));
  
  publishStatusText.textContent = '已發布到 bubbles！';
  publishStatusIcon.textContent = '✓';
  pushDanmaku(`系統：已將「${track.title}」發布到 bubbles。`);
  
  setTimeout(() => {
    publishStatus?.classList.add('hidden');
  }, 3000);
}

async function publishToWeverse(track, message) {
  const publishStatus = document.getElementById('publish-status');
  const publishStatusText = document.getElementById('publish-status-text');
  const publishStatusIcon = document.getElementById('publish-status-icon');
  
  publishStatus?.classList.remove('hidden');
  publishStatusText.textContent = '發布中...';
  publishStatusIcon.textContent = '⏳';
  
  await new Promise(r => setTimeout(r, 800));
  
  const musicPost = {
    type: 'MUSIC_POST_TO_WEVERSE',
    track: {
      title: track.title,
      artist: track.artist,
      duration: track.duration,
      cover: track.cover,
      aiMelody: track.aiMelody,
      lyrics: track.lyrics,
      lang: track.lang
    },
    message: message || '',
    timestamp: Date.now()
  };
  
  if (window.parent && window.parent !== window) {
    window.parent.postMessage(musicPost, '*');
  }
  
  localStorage.setItem('sx_weverse_music_post', JSON.stringify(musicPost));
  
  publishStatusText.textContent = '已發布到 weverse！';
  publishStatusIcon.textContent = '✓';
  pushDanmaku(`系統：已將「${track.title}」發布到 weverse。`);
  
  setTimeout(() => {
    publishStatus?.classList.add('hidden');
  }, 3000);
}

function updatePublishPreview(track) {
  const publishTitle = document.getElementById('publish-title');
  const publishMeta = document.getElementById('publish-meta');
  const publishCover = document.getElementById('publish-cover');
  
  if (!track) {
    publishTitle.textContent = '尚未選擇要發布的音樂';
    publishMeta.textContent = '請先生成或選擇一段旋律';
    publishCover.style.background = 'linear-gradient(135deg, #374151, #1f2937)';
    return;
  }
  
  publishTitle.textContent = track.title;
  publishMeta.textContent = `${track.artist} · ${track.duration}`;
  publishCover.style.background = track.cover || 'linear-gradient(135deg,#6366f1,#8b5cf6)';
}

function bindAIEvents() {
  const genTempSlider = document.getElementById('gen-temp');
  const genTempVal = document.getElementById('gen-temp-val');
  const genScaleSelect = document.getElementById('gen-scale');
  const generateBtn = document.getElementById('generate-btn');

  const contBarsSelect = document.getElementById('cont-bars');
  const contVarSlider = document.getElementById('cont-var');
  const continueBtn = document.getElementById('continue-btn');

  const interpStepsSelect = document.getElementById('interp-steps');
  const interpSetABtn = document.getElementById('interp-set-a');
  const interpSetBBtn = document.getElementById('interp-set-b');
  const interpolateBtn = document.getElementById('interpolate-btn');

  const grooveSwingSlider = document.getElementById('groove-swing');
  const grooveVelSlider = document.getElementById('groove-vel');
  const grooveBtn = document.getElementById('groove-btn');

  const drumStyleSelect = document.getElementById('drum-style');
  const drumComplexSlider = document.getElementById('drum-complex');
  const drumifyBtn = document.getElementById('drumify-btn');

  const transformModeSelect = document.getElementById('transform-mode');
  const transformBtn = document.getElementById('transform-btn');

  const playAIBtn = document.getElementById('play-ai-btn');
  const addToPlaylistBtn = document.getElementById('add-to-playlist-btn');
  const clearAIBtn = document.getElementById('clear-ai-btn');

  if (genTempSlider && genTempVal) {
    genTempSlider.addEventListener('input', () => {
      genTempVal.textContent = parseFloat(genTempSlider.value).toFixed(1);
    });
  }

  if (generateBtn) {
    generateBtn.addEventListener('click', () => {
      const temp = parseFloat(genTempSlider?.value || 1);
      const scale = genScaleSelect?.value || 'major';
      aiMelody = generateMelody(4, scale, temp);
      drawPianoRoll(aiMelody);
      currentPublishTrack = {
        title: `AI 生成旋律 #${playlist.length + 1}`,
        artist: 'Magenta 靈感',
        duration: `${Math.ceil(aiMelody.length / 8)}:00`,
        cover: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        aiMelody: aiMelody
      };
      updatePublishPreview(currentPublishTrack);
      pushDanmaku(`AI：已生成 4 小節 ${scale === 'major' ? '大調' : scale === 'minor' ? '小調' : scale} 旋律。`);
    });
  }

  if (continueBtn) {
    continueBtn.addEventListener('click', () => {
      const bars = parseInt(contBarsSelect?.value || 4);
      const variation = parseFloat(contVarSlider?.value || 0.5);
      aiMelody = continueMelody(aiMelody, bars, variation);
      drawPianoRoll(aiMelody);
      if (currentPublishTrack) {
        currentPublishTrack.aiMelody = aiMelody;
        currentPublishTrack.duration = `${Math.ceil(aiMelody.length / 8)}:00`;
        updatePublishPreview(currentPublishTrack);
      }
      pushDanmaku(`AI：已延伸 ${bars} 小節旋律。`);
    });
  }

  if (interpSetABtn) {
    interpSetABtn.addEventListener('click', () => {
      interpMelodyA = aiMelody.length > 0 ? [...aiMelody] : generateMelody(4);
      pushDanmaku('AI：已設為旋律 A。');
    });
  }

  if (interpSetBBtn) {
    interpSetBBtn.addEventListener('click', () => {
      interpMelodyB = aiMelody.length > 0 ? [...aiMelody] : generateMelody(4);
      pushDanmaku('AI：已設為旋律 B。');
    });
  }

  if (interpolateBtn) {
    interpolateBtn.addEventListener('click', () => {
      const steps = parseInt(interpStepsSelect?.value || 8);
      if (interpMelodyA.length === 0 || interpMelodyB.length === 0) {
        pushDanmaku('AI：請先設定旋律 A 與 B。');
        return;
      }
      aiMelody = interpolateMelodies(interpMelodyA, interpMelodyB, steps);
      drawPianoRoll(aiMelody);
      if (currentPublishTrack) {
        currentPublishTrack.aiMelody = aiMelody;
        updatePublishPreview(currentPublishTrack);
      }
      pushDanmaku(`AI：已融合兩段旋律，共 ${steps} 步。`);
    });
  }

  if (grooveBtn) {
    grooveBtn.addEventListener('click', () => {
      const swing = parseFloat(grooveSwingSlider?.value || 0.5);
      const velVar = parseFloat(grooveVelSlider?.value || 0.3);
      aiMelody = applyGroove(aiMelody, swing, velVar);
      drawPianoRoll(aiMelody);
      if (currentPublishTrack) {
        currentPublishTrack.aiMelody = aiMelody;
        updatePublishPreview(currentPublishTrack);
      }
      pushDanmaku('AI：已應用 Groove 人性化處理。');
    });
  }

  if (drumifyBtn) {
    drumifyBtn.addEventListener('click', () => {
      const style = drumStyleSelect?.value || 'rock';
      const complexity = parseInt(drumComplexSlider?.value || 3);
      aiMelody = generateDrums(style, complexity);
      drawPianoRoll(aiMelody);
      if (currentPublishTrack) {
        currentPublishTrack.aiMelody = aiMelody;
        currentPublishTrack.title = `AI 鼓點 #${playlist.length + 1}`;
        updatePublishPreview(currentPublishTrack);
      }
      pushDanmaku(`AI：已生成 ${style === 'rock' ? '搖滾' : style === 'hiphop' ? '嘻哈' : style} 風格鼓點。`);
    });
  }

  if (transformBtn) {
    transformBtn.addEventListener('click', () => {
      const mode = transformModeSelect?.value || 'invert';
      aiMelody = transformMelody(aiMelody, mode);
      drawPianoRoll(aiMelody);
      if (currentPublishTrack) {
        currentPublishTrack.aiMelody = aiMelody;
        updatePublishPreview(currentPublishTrack);
      }
      const modeNames = { invert: '倒轉', retrograde: '逆行', augment: '增值', diminish: '減值' };
      pushDanmaku(`AI：已應用 ${modeNames[mode]} 變換。`);
    });
  }

  if (playAIBtn) {
    playAIBtn.addEventListener('click', async () => {
      if (aiMelody.length === 0) {
        pushDanmaku('AI：尚未生成旋律。');
        return;
      }
      playAIBtn.innerHTML = '<i class="fas fa-stop"></i>';
      await playMelody(aiMelody);
      playAIBtn.innerHTML = '<i class="fas fa-play"></i>';
    });
  }

  if (addToPlaylistBtn) {
    addToPlaylistBtn.addEventListener('click', () => {
      addAIToPlaylist(aiMelody);
    });
  }

  if (clearAIBtn) {
    clearAIBtn.addEventListener('click', () => {
      aiMelody = [];
      interpMelodyA = [];
      interpMelodyB = [];
      drawPianoRoll([]);
      currentPublishTrack = null;
      updatePublishPreview(null);
      pushDanmaku('AI：已清除生成內容。');
    });
  }
}

function bindCharMusicEvents() {
  const charMusicSelect = document.getElementById('char-music-select');
  const charMoodSelect = document.getElementById('char-mood-select');
  const charStyleSelect = document.getElementById('char-style-select');
  const charLangSelect = document.getElementById('char-lang-select');
  const charBarsSelect = document.getElementById('char-bars-select');
  const charThemeInput = document.getElementById('char-theme-input');
  const charPersonalityText = document.getElementById('char-personality-text');
  const charGenerateBtn = document.getElementById('char-generate-music-btn');
  const charMusicResult = document.getElementById('char-music-result');
  const charMusicTitle = document.getElementById('char-music-title');
  const charMusicMood = document.getElementById('char-music-mood');
  const charMusicDesc = document.getElementById('char-music-desc');
  const charPlayBtn = document.getElementById('char-play-btn');
  const charAddBtn = document.getElementById('char-add-btn');
  
  let charMelody = [];
  
  loadCharactersForMusic();
  
  if (charMusicSelect) {
    charMusicSelect.addEventListener('change', () => {
      const char = getCharacterById(charMusicSelect.value);
      if (char) {
        charPersonalityText.textContent = char.personality || '這個角色還沒有設定個性描述。';
      } else {
        charPersonalityText.textContent = '請選擇角色以查看個性描述';
      }
    });
  }
  
  if (charGenerateBtn) {
    charGenerateBtn.addEventListener('click', async () => {
      const charId = charMusicSelect?.value;
      if (!charId) {
        pushDanmaku('請先選擇一個角色。');
        return;
      }
      
      const char = getCharacterById(charId);
      const mood = charMoodSelect?.value || 'calm';
      const style = charStyleSelect?.value || 'pop';
      const lang = charLangSelect?.value || 'zh';
      const bars = parseInt(charBarsSelect?.value || 8);
      const theme = charThemeInput?.value?.trim() || '';
      
      charGenerateBtn.disabled = true;
      charGenerateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 創作中...';
      
      await new Promise(r => setTimeout(r, 1200));
      
      const result = generateMelodyByCharacter(char, mood, style, lang, bars, theme);
      const charMelodyArr = result.melody || result;
      const lyrics = result.lyrics || null;
      
      charMelody = charMelodyArr;
      const description = generateCharacterMusicDescription(char, mood, style, lang, result);
      
      const moodNames = {
        calm: '平靜', happy: '愉悅', sad: '感性',
        energetic: '活力', romantic: '浪漫', mysterious: '神秘'
      };
      
      const langNames = {
        zh: '中文', ko: '韓文', ja: '日文', en: '英文',
        mixed: '混合', instrumental: '純音樂'
      };
      
      charMusicResult?.classList.remove('hidden');
      charMusicTitle.textContent = `${char?.name || '角色'}的創作`;
      charMusicMood.textContent = `${moodNames[mood] || mood} · ${langNames[lang] || lang}`;
      charMusicDesc.textContent = description;
      
      if (lyrics) {
        const lyricsEl = document.getElementById('char-lyrics-display');
        if (lyricsEl) {
          lyricsEl.textContent = formatLyricsDisplay(lyrics, lang);
          lyricsEl.classList.remove('hidden');
        }
      } else {
        const lyricsEl = document.getElementById('char-lyrics-display');
        if (lyricsEl) {
          lyricsEl.textContent = '（純音樂演奏）';
          lyricsEl.classList.remove('hidden');
        }
      }
      
      aiMelody = charMelodyArr;
      drawPianoRoll(charMelodyArr);
      
      currentPublishTrack = {
        title: `${char?.name || '角色'}的創作`,
        artist: char?.name || '角色',
        duration: `${Math.ceil(charMelodyArr.length / 8)}:00`,
        cover: `linear-gradient(135deg,${getCharacterGradient(char?.personality)})`,
        aiMelody: charMelodyArr,
        lyrics,
        lang,
        mood,
        style,
        theme
      };
      updatePublishPreview(currentPublishTrack);
      
      charGenerateBtn.disabled = false;
      charGenerateBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> 讓角色為我創作';
      
      pushDanmaku(`${char?.name || '角色'}：為你創作了一段旋律！`);
    });
  }
  
  if (charPlayBtn) {
    charPlayBtn.addEventListener('click', async () => {
      if (charMelody.length === 0) {
        pushDanmaku('尚未生成角色音樂。');
        return;
      }
      charPlayBtn.innerHTML = '<i class="fas fa-stop"></i> 播放中';
      await playMelody(charMelody);
      charPlayBtn.innerHTML = '<i class="fas fa-play"></i> 播放';
    });
  }
  
  if (charAddBtn) {
    charAddBtn.addEventListener('click', () => {
      if (charMelody.length === 0) {
        pushDanmaku('尚未生成角色音樂。');
        return;
      }
      addAIToPlaylist(charMelody);
    });
  }
}

function getCharacterGradient(personality) {
  const text = (personality || '').toLowerCase();
  
  if (/(溫柔|療癒|貼心|安撫)/.test(text)) return '#ec4899,#f472b6';
  if (/(毒舌|挑剔|犀利)/.test(text)) return '#ef4444,#f97316';
  if (/(詩|文藝|浪漫|感性)/.test(text)) return '#8b5cf6,#a855f7';
  if (/(激動|爆發|熱血)/.test(text)) return '#f59e0b,#ef4444';
  if (/(冷靜|沉穩|理性)/.test(text)) return '#3b82f6,#6366f1';
  if (/(熱情|開朗|活潑)/.test(text)) return '#10b981,#34d399';
  
  return '#6366f1,#8b5cf6';
}

function bindPublishEvents() {
  const publishMessage = document.getElementById('publish-message');
  const publishBubblesBtn = document.getElementById('publish-bubbles-btn');
  const publishWeverseBtn = document.getElementById('publish-weverse-btn');
  
  if (publishBubblesBtn) {
    publishBubblesBtn.addEventListener('click', () => {
      if (!currentPublishTrack || !currentPublishTrack.aiMelody) {
        pushDanmaku('請先生成一段音樂再發布。');
        return;
      }
      const message = publishMessage?.value || '';
      publishToBubbles(currentPublishTrack, message);
    });
  }
  
  if (publishWeverseBtn) {
    publishWeverseBtn.addEventListener('click', () => {
      if (!currentPublishTrack || !currentPublishTrack.aiMelody) {
        pushDanmaku('請先生成一段音樂再發布。');
        return;
      }
      const message = publishMessage?.value || '';
      publishToWeverse(currentPublishTrack, message);
    });
  }
}

bindEvents();
bindAIEvents();
bindCharMusicEvents();
bindPublishEvents();
bindYuEEvents();
updateImportNotice();
loadPlaylistFromStorage();
loadProfilesFromSettings();
renderProfileOptions();
updateCompanionStatus();
renderPlaylist();
drawPianoRoll([]);
updatePublishPreview(null);
console.log('Loaded app: music');

const YUE_API_URL = localStorage.getItem('sx_yue_api_url') || 'http://localhost:8000';

let yueCurrentTaskId = null;
let yuePollingInterval = null;
let yueGeneratedTracks = [];

async function checkYuEHealth() {
  try {
    const response = await fetch(`${YUE_API_URL}/health`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('YuE API not available:', error);
    return null;
  }
}

async function generateYuELyrics(theme, language, mood, style, segments = 4) {
  try {
    const response = await fetch(`${YUE_API_URL}/api/yue/lyrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        theme,
        language,
        mood,
        style,
        segments,
      }),
    });
    
    if (!response.ok) throw new Error('Failed to generate lyrics');
    return await response.json();
  } catch (error) {
    console.error('YuE lyrics generation error:', error);
    return null;
  }
}

async function startYuEGeneration(params) {
  try {
    const response = await fetch(`${YUE_API_URL}/api/yue/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    
    if (!response.ok) throw new Error('Failed to start generation');
    return await response.json();
  } catch (error) {
    console.error('YuE generation error:', error);
    return null;
  }
}

async function checkYuETaskStatus(taskId) {
  try {
    const response = await fetch(`${YUE_API_URL}/api/yue/status/${taskId}`);
    if (!response.ok) throw new Error('Failed to check status');
    return await response.json();
  } catch (error) {
    console.error('YuE status check error:', error);
    return null;
  }
}

function stopYuEPolling() {
  if (yuePollingInterval) {
    clearInterval(yuePollingInterval);
    yuePollingInterval = null;
  }
}

function startYuEPolling(taskId, onProgress, onComplete, onError) {
  stopYuEPolling();
  
  yuePollingInterval = setInterval(async () => {
    const status = await checkYuETaskStatus(taskId);
    
    if (!status) {
      stopYuEPolling();
      onError?.('無法連接到 YuE API');
      return;
    }
    
    onProgress?.(status);
    
    if (status.status === 'completed') {
      stopYuEPolling();
      onComplete?.(status);
    } else if (status.status === 'failed') {
      stopYuEPolling();
      onError?.(status.error || '生成失敗');
    }
  }, 2000);
}

function bindYuEEvents() {
  const yueApiUrlInput = document.getElementById('yue-api-url');
  const yueSaveApiBtn = document.getElementById('yue-save-api-btn');
  const yueCheckBtn = document.getElementById('yue-check-btn');
  const yueStatusEl = document.getElementById('yue-api-status');
  
  const yueThemeInput = document.getElementById('yue-theme-input');
  const yueLangSelect = document.getElementById('yue-lang-select');
  const yueMoodSelect = document.getElementById('yue-mood-select');
  const yueStyleSelect = document.getElementById('yue-style-select');
  const yueSegmentsSelect = document.getElementById('yue-segments-select');
  const yueLyricsInput = document.getElementById('yue-lyrics-input');
  const yueGenreInput = document.getElementById('yue-genre-input');
  
  const yueGenerateLyricsBtn = document.getElementById('yue-generate-lyrics-btn');
  const yueGenerateBtn = document.getElementById('yue-generate-btn');
  const yueProgressEl = document.getElementById('yue-progress');
  const yueProgressBar = document.getElementById('yue-progress-bar');
  const yueProgressText = document.getElementById('yue-progress-text');
  const yueResultEl = document.getElementById('yue-result');
  const yueResultTitle = document.getElementById('yue-result-title');
  const yueResultAudio = document.getElementById('yue-result-audio');
  const yueAddToPlaylistBtn = document.getElementById('yue-add-to-playlist-btn');
  
  if (yueApiUrlInput) {
    yueApiUrlInput.value = YUE_API_URL;
  }
  
  if (yueSaveApiBtn) {
    yueSaveApiBtn.addEventListener('click', () => {
      const url = yueApiUrlInput?.value?.trim();
      if (url) {
        localStorage.setItem('sx_yue_api_url', url);
        pushDanmaku('YuE：API URL 已儲存。');
      }
    });
  }
  
  if (yueCheckBtn) {
    yueCheckBtn.addEventListener('click', async () => {
      if (yueStatusEl) {
        yueStatusEl.textContent = '檢查中...';
        yueStatusEl.className = 'yue-status checking';
      }
      
      const health = await checkYuEHealth();
      
      if (health && health.status === 'healthy') {
        if (yueStatusEl) {
          const gpuInfo = health.gpu_available 
            ? `GPU: ${health.gpu_name || 'Unknown'}` 
            : 'CPU Mode';
          yueStatusEl.textContent = `已連接 (${gpuInfo})`;
          yueStatusEl.className = 'yue-status connected';
        }
        pushDanmaku('YuE：API 連接成功！');
      } else {
        if (yueStatusEl) {
          yueStatusEl.textContent = '未連接';
          yueStatusEl.className = 'yue-status disconnected';
        }
        pushDanmaku('YuE：無法連接到 API 伺服器。');
      }
    });
  }
  
  if (yueGenerateLyricsBtn) {
    yueGenerateLyricsBtn.addEventListener('click', async () => {
      const theme = yueThemeInput?.value?.trim() || '夢想與希望';
      const language = yueLangSelect?.value || 'zh';
      const mood = yueMoodSelect?.value || 'calm';
      const style = yueStyleSelect?.value || 'pop';
      const segments = parseInt(yueSegmentsSelect?.value || 2);
      
      yueGenerateLyricsBtn.disabled = true;
      yueGenerateLyricsBtn.textContent = '生成中...';
      
      const result = await generateYuELyrics(theme, language, mood, style, segments);
      
      if (result) {
        if (yueLyricsInput) yueLyricsInput.value = result.lyrics;
        if (yueGenreInput) yueGenreInput.value = result.genre_tags;
        pushDanmaku('YuE：已生成歌詞與風格標籤！');
      } else {
        pushDanmaku('YuE：歌詞生成失敗，請確認 API 連接。');
      }
      
      yueGenerateLyricsBtn.disabled = false;
      yueGenerateLyricsBtn.textContent = '生成歌詞';
    });
  }
  
  if (yueGenerateBtn) {
    yueGenerateBtn.addEventListener('click', async () => {
      const lyrics = yueLyricsInput?.value?.trim();
      const genreTags = yueGenreInput?.value?.trim();
      
      if (!lyrics) {
        pushDanmaku('YuE：請先輸入或生成歌詞。');
        return;
      }
      
      if (!genreTags) {
        pushDanmaku('YuE：請先輸入或生成風格標籤。');
        return;
      }
      
      yueGenerateBtn.disabled = true;
      yueGenerateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 生成中...';
      
      if (yueProgressEl) yueProgressEl.classList.remove('hidden');
      if (yueProgressBar) yueProgressBar.style.width = '0%';
      if (yueProgressText) yueProgressText.textContent = '正在啟動生成任務...';
      if (yueResultEl) yueResultEl.classList.add('hidden');
      
      const params = {
        lyrics,
        genre_tags: genreTags,
        language: yueLangSelect?.value || 'zh',
        style: yueStyleSelect?.value || 'pop',
        mood: yueMoodSelect?.value || 'calm',
        run_n_segments: parseInt(yueSegmentsSelect?.value || 2),
        max_new_tokens: 3000,
        repetition_penalty: 1.1,
      };
      
      const response = await startYuEGeneration(params);
      
      if (!response || !response.task_id) {
        pushDanmaku('YuE：無法啟動生成任務，請確認 API 連接。');
        yueGenerateBtn.disabled = false;
        yueGenerateBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> 開始生成音樂';
        return;
      }
      
      yueCurrentTaskId = response.task_id;
      pushDanmaku(`YuE：已啟動生成任務 (${response.task_id.slice(0, 8)}...)`);
      
      startYuEPolling(
        response.task_id,
        (status) => {
          if (yueProgressBar) {
            yueProgressBar.style.width = `${status.progress * 100}%`;
          }
          if (yueProgressText) {
            yueProgressText.textContent = status.message || `處理中... ${Math.round(status.progress * 100)}%`;
          }
        },
        (status) => {
          yueGenerateBtn.disabled = false;
          yueGenerateBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> 開始生成音樂';
          
          if (yueProgressEl) yueProgressEl.classList.add('hidden');
          if (yueResultEl) yueResultEl.classList.remove('hidden');
          
          if (yueResultTitle) {
            yueResultTitle.textContent = `YuE 生成 #${yueGeneratedTracks.length + 1}`;
          }
          
          if (yueResultAudio && status.output_path) {
            const audioUrl = `${YUE_API_URL}/api/yue/download/${yueCurrentTaskId}/mixed`;
            yueResultAudio.src = audioUrl;
            yueResultAudio.load();
          }
          
          const track = {
            title: `YuE 生成 #${yueGeneratedTracks.length + 1}`,
            artist: 'YuE AI',
            duration: '--:--',
            mood: yueMoodSelect?.value || 'generated',
            cover: 'linear-gradient(135deg,#ff6b9d,#c44dff)',
            url: status.output_path ? `${YUE_API_URL}/api/yue/download/${yueCurrentTaskId}/mixed` : null,
            taskId: yueCurrentTaskId,
            vocalPath: status.vocal_path,
            instrumentalPath: status.instrumental_path,
          };
          
          yueGeneratedTracks.push(track);
          currentPublishTrack = track;
          updatePublishPreview(track);
          
          pushDanmaku('YuE：音樂生成完成！');
        },
        (error) => {
          yueGenerateBtn.disabled = false;
          yueGenerateBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> 開始生成音樂';
          
          if (yueProgressEl) yueProgressEl.classList.add('hidden');
          
          pushDanmaku(`YuE：生成失敗 - ${error}`);
        }
      );
    });
  }
  
  if (yueAddToPlaylistBtn) {
    yueAddToPlaylistBtn.addEventListener('click', () => {
      if (!currentPublishTrack || !currentPublishTrack.url) {
        pushDanmaku('YuE：尚未生成可加入的音樂。');
        return;
      }
      
      playlist.push(currentPublishTrack);
      localStorage.setItem('sx_music_playlist', JSON.stringify(playlist));
      renderPlaylist();
      pushDanmaku(`YuE：已將「${currentPublishTrack.title}」加入播放清單。`);
    });
  }
}

