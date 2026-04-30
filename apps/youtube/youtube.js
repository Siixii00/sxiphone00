const feedEl = document.getElementById('yt-feed');
const charBtn = document.getElementById('yt-char-btn');
const charView = document.getElementById('yt-char-view');
const charSelect = document.getElementById('yt-char-select');
const charList = document.getElementById('yt-char-list');
const collectionsView = document.getElementById('yt-collections');
const collectionsList = document.getElementById('yt-collections-list');
const meView = document.getElementById('yt-me-view');
const meName = document.getElementById('yt-me-name');
const meSub = document.getElementById('yt-me-sub');
const meAvatar = document.getElementById('yt-me-avatar');
const meVideos = document.getElementById('yt-me-videos');
const playerPage = document.getElementById('yt-player-page');
const playerFrame = document.querySelector('#yt-player-video iframe');
const playerTitleMain = document.getElementById('yt-player-title-main');
const playerSub = document.getElementById('yt-player-sub');
const playerChannelName = document.getElementById('yt-player-channel-name');
const playerDesc = document.getElementById('yt-player-desc');

const videoModal = document.getElementById('yt-video-modal');
const videoUrlInput = document.getElementById('yt-video-url');
const addModal = document.getElementById('yt-add-modal');
const addTitleInput = document.getElementById('add-video-title');
const addUrlInput = document.getElementById('add-video-url');
const addThumbFileInput = document.getElementById('add-video-thumb-file');
const addThumbPreview = document.getElementById('yt-thumb-preview');
const addTagSelect = document.getElementById('add-video-tag');
const collectionModal = document.getElementById('yt-collection-modal');
const collectionNameInput = document.getElementById('collection-name');
const saveModal = document.getElementById('yt-save-modal');
const saveList = document.getElementById('yt-save-list');

const STORAGE_KEY_FEED = 'sx_youtube_feed';
const STORAGE_KEY_COLLECTIONS = 'sx_youtube_collections';
const STORAGE_KEY_MY_VIDEOS = 'sx_youtube_my_videos';
const STORAGE_KEY_LIKED = 'sx_youtube_liked';
const STORAGE_KEY_CHAR_WATCH = 'sx_youtube_char_watch_history';
const CHAR_LIST_KEY = 'sx_characters';

const titlePool = [];
const channelPool = [];

const thumbnailColors = [
  ['#ff6b6b', '#feca57'],
  ['#48dbfb', '#0abde3'],
  ['#ff9ff3', '#f368e0'],
  ['#54a0ff', '#2e86de'],
  ['#5f27cd', '#341f97'],
  ['#00d2d3', '#01a3a4'],
  ['#ff6b6b', '#ee5a24'],
  ['#1dd1a1', '#10ac84'],
  ['#ffeaa7', '#fdcb6e'],
  ['#dfe6e9', '#b2bec3'],
  ['#fd79a8', '#e84393'],
  ['#a29bfe', '#6c5ce7'],
  ['#fab1a0', '#e17055'],
  ['#81ecec', '#00cec9'],
  ['#74b9ff', '#0984e3']
];

const CHAR_RECO = [];

let currentFeed = [];
let currentCollections = [];
let myVideos = [];
let likedVideos = [];
let charWatchHistory = [];
let currentChip = 'all';
let pendingVideoData = null;
let currentWatchingChar = null;
let charCommentTimer = null;
let charCommentInterval = 8000;
let adTimer = null;
let adCountdown = 0;
let adShowing = false;

const saveYoutubeData = () => {
    try {
        saveToStorage(STORAGE_KEY_FEED, currentFeed);
        saveToStorage(STORAGE_KEY_COLLECTIONS, currentCollections);
        saveToStorage(STORAGE_KEY_MY_VIDEOS, myVideos);
        saveToStorage(STORAGE_KEY_LIKED, likedVideos);
        console.log("YouTube?∏Ê?Â∑≤‰?Â≠òËá≥ localStorage");
    } catch (e) {
        console.error("‰øùÂ?YouTube?∏Ê?Â§±Ê?:", e);
    }
};

const saveToPersistentStorage = async () => {
    saveYoutubeData();
    if (typeof localforage !== 'undefined') {
        try {
            const existingData = await localforage.getItem('sx_app_persisted_data') || {};
            await localforage.setItem('sx_app_persisted_data', {
                ...existingData,
                sx_youtube_feed: currentFeed,
                sx_youtube_collections: currentCollections,
                sx_youtube_my_videos: myVideos,
                sx_youtube_liked: likedVideos
            });
            console.log("YouTube?∏Ê?Â∑≤‰?Â≠òËá≥ IndexedDB");
        } catch (e) {
            console.error("IndexedDB ‰øùÂ?Â§±Ê?:", e);
        }
    }
};

window.addEventListener('pagehide', () => {
    saveYoutubeData();
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        saveYoutubeData();
    }
});

window.addEventListener('message', (event) => {
    if (event.data?.type === 'APP_WILL_CLOSE') {
        saveYoutubeData();
    }
});
let uploadedThumbData = null;

function randomPick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomViews() {
  const values = ['1.2??, '3.8??, '7.6??, '10.2??, '18.8??, '25.6??, '32??, '56??, '102??];
  return randomPick(values);
}

function randomTime() {
  const values = ['?õÂ?', '1 Â∞èÊ???, '3 Â∞èÊ???, '6 Â∞èÊ???, '1 Â§©Â?', '2 Â§©Â?', '3 Â§©Â?', '1 ?±Â?'];
  return randomPick(values);
}

function randomDuration() {
  const mins = Math.floor(Math.random() * 15) + 1;
  const secs = Math.floor(Math.random() * 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function generateThumbnail() {
  const colors = randomPick(thumbnailColors);
  const patterns = [
    `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
    `linear-gradient(45deg, ${colors[0]}, ${colors[1]})`,
    `linear-gradient(90deg, ${colors[0]}, ${colors[1]})`,
    `linear-gradient(180deg, ${colors[0]}, ${colors[1]})`,
    `linear-gradient(225deg, ${colors[0]}, ${colors[1]})`,
    `radial-gradient(circle at 30% 30%, ${colors[0]}, ${colors[1]})`,
    `radial-gradient(circle at 70% 70%, ${colors[0]}, ${colors[1]})`,
    `conic-gradient(from 45deg, ${colors[0]}, ${colors[1]}, ${colors[0]})`
  ];
  return randomPick(patterns);
}

function generateVideo() {
  return null;
}

function generateFeed(count = 6) {
  return [];
}

function loadFromStorage(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function loadAllData() {
  currentFeed = [];
  currentCollections = loadFromStorage(STORAGE_KEY_COLLECTIONS);
  myVideos = loadFromStorage(STORAGE_KEY_MY_VIDEOS);
  likedVideos = loadFromStorage(STORAGE_KEY_LIKED);
  charWatchHistory = loadFromStorage(STORAGE_KEY_CHAR_WATCH);
}

function renderFeed() {
  if (!feedEl) return;
  const filtered = currentChip === 'all' 
    ? currentFeed 
    : currentFeed.filter(v => v.tag === currentChip);
  
  if (filtered.length === 0) {
    feedEl.innerHTML = `
      <div class="yt-empty-state">
        <i class="fas fa-video-slash"></i>
        <div class="yt-empty-state-title">Â∞öÁÑ°ÂΩ±Á??ßÂÆπ</div>
        <div class="yt-empty-state-desc">ÈªûÊ?‰∏ãÊñπ?âÈ?ËÆ?AI ?üÊ?Á¨¶Â?ËßíËâ≤?àË∂£?ÑÂΩ±??/div>
        <button class="yt-primary-btn" id="yt-ai-generate-btn">
          <i class="fas fa-magic"></i> AI ?üÊ?ÂΩ±Á?
        </button>
      </div>
    `;
    return;
  }
  
  feedEl.innerHTML = filtered.map(video => {
    const bgStyle = video.thumb 
      ? `background-image: url('${video.thumb}'); background-size: cover; background-position: center;`
      : `background: ${video.thumbGradient || 'linear-gradient(135deg, #2c2c2e, #1f1f21)'}`;
    return `
    <article class="yt-card" data-video-id="${video.id}">
      <div class="yt-thumb" style="${bgStyle}">
        <span class="yt-duration">${video.duration}</span>
      </div>
      <div class="yt-meta">
        <div class="yt-channel"></div>
        <div>
          <div class="yt-title">${video.title}</div>
          <div class="yt-info">${video.channel} ¬∑ ${video.views} ¬∑ ${video.time}</div>
        </div>
        <button class="yt-more" type="button" aria-label="?¥Â?">
          <i class="fas fa-ellipsis-v"></i>
        </button>
      </div>
    </article>
  `}).join('');
}

function renderCollections() {
  if (!collectionsList) return;
  if (currentCollections.length === 0) {
    collectionsList.innerHTML = `
      <div class="yt-collection-empty">
        <i class="fas fa-folder-open"></i>
        <div>Â∞öÊú™Âª∫Á??∂Ë?Â§?/div>
        <div style="font-size:12px;margin-top:8px;">ÈªûÊ??≥‰?Ëß?+ ?∞Â??∂Ë?Â§?/div>
      </div>
    `;
    return;
  }
  collectionsList.innerHTML = currentCollections.map((col, index) => `
    <div class="yt-collection-item" data-collection-index="${index}">
      <div>
        <div class="yt-collection-name">${col.name}</div>
        <div class="yt-collection-count">${col.videos.length} ?®ÂΩ±??/div>
      </div>
      <button class="yt-collection-delete" data-action="delete-collection" data-index="${index}" aria-label="?™Èô§">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `).join('');
}

function renderMeView() {
  const userName = localStorage.getItem('sx_user_name') || 'SXi User';
  const userAvatar = localStorage.getItem('sx_user_avatar') || '';
  
  if (meName) meName.textContent = userName;
  if (meSub) meSub.textContent = `@${userName.toLowerCase().replace(/\s+/g, '')}`;
  if (meAvatar) {
    if (userAvatar) {
      meAvatar.style.backgroundImage = `url('${userAvatar}')`;
      meAvatar.style.backgroundSize = 'cover';
      meAvatar.style.backgroundPosition = 'center';
    } else {
      meAvatar.style.backgroundImage = '';
    }
  }
  
  if (meVideos) {
    if (myVideos.length === 0) {
      meVideos.innerHTML = `<div style="color:var(--muted);font-size:12px;padding:20px;text-align:center;">Â∞öÊú™?µÂª∫ÂΩ±Á?</div>`;
    } else {
      meVideos.innerHTML = myVideos.slice(0, 4).map(v => `
        <div class="yt-me-video">
          ${v.thumb ? `<img class="yt-me-video-thumb" src="${v.thumb}" alt="">` : ''}
          <span class="yt-me-video-duration">${v.duration}</span>
        </div>
      `).join('');
    }
  }
}

function renderSaveList(videoId) {
  if (!saveList) return;
  saveList.innerHTML = currentCollections.map(col => {
    const isSaved = col.videos.some(v => v.id === videoId);
    return `
      <div class="yt-save-item ${isSaved ? 'saved' : ''}" data-collection-id="${col.id}">
        <span class="yt-save-item-name">${col.name}</span>
        ${isSaved ? '<i class="fas fa-check yt-save-item-check"></i>' : ''}
      </div>
    `;
  }).join('');
}

function loadChars() {
  const raw = localStorage.getItem(CHAR_LIST_KEY) || '[]';
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function renderCharSelect() {
  if (!charSelect) return;
  const chars = loadChars();
  if (!chars.length) {
    charSelect.innerHTML = '<option value="">Â∞öÊú™Âª∫Á?ËßíËâ≤</option>';
    return;
  }
  charSelect.innerHTML = chars.map((char, index) => {
    const name = char?.name || `ËßíËâ≤ ${index + 1}`;
    return `<option value="${index}">${name}</option>`;
  }).join('');
}

let isGeneratingCharFeed = false;

async function buildCharFeed(char, count = 5) {
  if (!char) {
    return [];
  }

  if (isGeneratingCharFeed) {
    return [];
  }

  isGeneratingCharFeed = true;

  try {
    const context = buildYouTubeContext();
    const lang = localStorage.getItem('sxiphone_lang') || 'zh-TW';

    const systemPrompt = `‰Ω†ÊòØ‰∏Ä‰ΩçÂ?Ê•≠Á? YouTube ?ßÂÆπ?ÜÊ?Â∏´Ô??ÖÈï∑?πÊ?ËßíËâ≤?ßÊ†º?ÅË??ØÂ??àË∂£ÔºåÊé®Ê∏¨Ë©≤ËßíËâ≤?ØËÉΩ?ÉÊ?Â∞ãÂ?ËßÄ?ãÁ?ÂΩ±Á?È°ûÂ???Ë´ã‰Ωø??${window.getAIReadableLangName?.(lang) || 'ÁπÅÈ?‰∏≠Ê?'} ?∞ÂØ´??Ëº∏Âá∫?ºÂ???JSON: {"history": [{"title": "?úÂ?Ê®ôÈ?", "query": "?úÂ??úÈçµÂ≠?, "summary": "Á∞°Áü≠?èËø∞"}]}`;

    const prompt = `${context}

Ë´ãÊ†π?ö‰ª•‰∏äË??≤Ë®≠ÂÆöÔ??üÊ? ${count} ?ãË©≤ËßíËâ≤?ØËÉΩ?ÉÊ?Â∞ãÁ? YouTube ÂΩ±Á??èË¶ΩÁ¥Ä?ÑÔ?Ë¶ÅÊ?Ôº?1. Á¨¶Â?ËßíËâ≤?ÑÊÄßÊ†º?ÅË??ØÂ??àË∂£
2. ?úÂ?Ê®ôÈ?Ë¶ÅÊ??∏Â??õ‰?Á¨¶Â?ËßíËâ≤?ÉÈ?Ê≥®Á?‰∏ªÈ?
3. ?Ø‰ª•??VLOG?ÅÈü≥Ê®Ç„ÄÅÈ??≤„ÄÅÁ??Ä?ÅÊ?Â≠∏„ÄÅÁ?Ê¥ªÁ?È°ûÂ?
4. ÊØèÂÄãÊ?Â∞ãÁ??ÑÈÉΩË¶ÅÊ??àÁ??ÑÊ?Â∞ãÈ??µÂ??åÁ∞°?≠Ê?Ëø?
Ëº∏Âá∫ JSON ?ºÂ??Ç`;

    const result = await callAIAPI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ], 0.9);

    let parsed = null;
    try {
      parsed = JSON.parse(result);
    } catch {
      const match = result.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }

    const history = Array.isArray(parsed?.history) ? parsed.history : [];

    return history.map((item, index) => ({
      id: `char-feed-${char.name}-${Date.now()}-${index}`,
      title: item.title || '?™Áü•?úÂ?',
      query: item.query || '',
      summary: item.summary || '',
      time: '?õÂ?'
    }));
  } catch (err) {
    console.error('?üÊ?ËßíËâ≤Ë¶ñË?Â§±Ê?:', err);
    return [];
  } finally {
    isGeneratingCharFeed = false;
  }
}

async function renderCharFeed(index) {
  if (!charList) return;
  const chars = loadChars();
  const char = chars[Number(index)];
  if (!char) {
    charList.innerHTML = '<div class="yt-char-empty">Â∞öÊú™Âª∫Á?ËßíËâ≤?ñÊâæ‰∏çÂà∞ËßíËâ≤Ë≥áÊ???/div>';
    return;
  }
  
  charList.innerHTML = '<div class="yt-char-loading"><i class="fas fa-spinner fa-spin"></i> AI Ê≠?ú®?üÊ?ËßíËâ≤Ë¶ñË?...</div>';
  
  const items = await buildCharFeed(char);
  
  if (items.length === 0) {
    charList.innerHTML = '<div class="yt-char-empty">?°Ê??üÊ?ËßíËâ≤Ë¶ñË?ÔºåË?Á¢∫Ë? API Ë®≠Â?Ê≠?¢∫??/div>';
    return;
  }
  
  charList.innerHTML = items.map(item => `
    <article class="yt-char-card">
      <div class="yt-char-card-title">${item.title}</div>
      <div class="yt-char-card-meta">
        <span><i class="fas fa-search"></i> ${item.query}</span>
        <span><i class="far fa-clock"></i> ${item.time}</span>
      </div>
      <div class="yt-char-card-desc">${item.summary}</div>
    </article>
  `).join('');
}

function renderCharWatchSelect() {
  const select = document.getElementById('yt-char-watch-select');
  if (!select) return;
  const chars = loadChars();
  if (!chars.length) {
    select.innerHTML = '<option value="">Â∞öÊú™Âª∫Á?ËßíËâ≤</option>';
    return;
  }
  select.innerHTML = '<option value="">?∏Ê?ËßíËâ≤</option>' + 
    chars.map((char, index) => {
      const name = char?.name || `ËßíËâ≤ ${index + 1}`;
      return `<option value="${index}">${name}</option>`;
    }).join('');
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
    return charMessages.slice(-30);
  } catch (e) {
    console.warn('[youtube] ?°Ê?ËºâÂÖ•ËßíËâ≤Ë®òÊÜ∂:', e);
    return [];
  }
}

function getCharReaction(char, video) {
  const personality = (char?.personality || '').trim();
  const background = (char?.background || '').trim();
  const name = char?.name || 'ËßíËâ≤';
  const title = video?.title || '?ôÈÉ®ÂΩ±Á?';

  if (!personality && !background) {
    return `${title}?ãËµ∑‰æÜ‰??ØÂë¢?Ç`;
  }

  const combinedText = `${personality} ${background}`.toLowerCase();

  const memory = loadCharacterMemory(name);

  const sentences = [];

  const personalityParts = personality.split(/[Ôº??Å„ÄÇÔ?;\s]+/).filter(p => p.trim());
  const bgParts = background.split(/[Ôº??Å„ÄÇÔ?;\s]+/).filter(p => p.trim());

  if (personalityParts.length > 0) {
    const randomTrait = personalityParts[Math.floor(Math.random() * personalityParts.length)];
    sentences.push(`‰ª•Ê?${randomTrait}?ÑÂÄãÊÄß‰??ãÔ?${title}?∫Ê??èÊÄùÁ??Ç`);
  }

  if (bgParts.length > 0 && Math.random() > 0.5) {
    const randomBg = bgParts[Math.floor(Math.random() * bgParts.length)];
    sentences.push(`${randomBg}?ÑÊ?ÔºåË¶∫ÂæóÈÄôÂΩ±?áÂ??âÊ?Ë¶∫„ÄÇ`);
  }

  if (memory && memory.length > 0 && Math.random() > 0.6) {
    const recentMsg = memory[memory.length - 1];
    if (recentMsg && recentMsg.content) {
      const recentKeywords = recentMsg.content.slice(0, 15);
      sentences.push(`?õÊ?‰Ω†Ë™™??{recentKeywords}...?çÔ??ôÂΩ±?áÊ?ËÆì‰??≥Âà∞‰ªÄÈ∫ºÂ?Ôºü`);
    }
  }

  if (sentences.length === 0) {
    sentences.push(`${title}?ãËµ∑‰æÜÊå∫?âË∂£?Ñ„ÄÇ`);
  }

  return sentences.join(' ');
}

function getCharLiveComment(char, video) {
  const personality = (char?.personality || '').trim();
  const background = (char?.background || '').trim();
  const name = char?.name || 'ËßíËâ≤';

  if (!personality && !background) {
    return '?ôÂÄãÂΩ±?á‰??ØÂë¢??;
  }

  const combinedText = `${personality} ${background}`.toLowerCase();

  const memory = loadCharacterMemory(name);

  const sentences = [];

  const personalityParts = personality.split(/[Ôº??Å„ÄÇÔ?;\s]+/).filter(p => p.trim());
  const bgParts = background.split(/[Ôº??Å„ÄÇÔ?;\s]+/).filter(p => p.trim());

  const videoKeywords = ['?´Èù¢', '?ßÂÆπ', '?≥Ê?', '?áÊ?', 'ÁØÄÂ•?, 'È¢®Ê†º', 'Ê∞õÂ?', '‰∏ªÈ?', 'Ëß?™™', '?àÁèæ'];
  const reactions = ['‰∏çÈåØ', '?âË∂£', '?πÂà•', 'Á≤æÂΩ©', '?∏Â?‰∫?, '?âÊ???, 'ÂæàÊ?', '?âÊ∑±Â∫?];

  if (personalityParts.length > 0) {
    const randomTrait = personalityParts[Math.floor(Math.random() * personalityParts.length)];
    const randomKeyword = videoKeywords[Math.floor(Math.random() * videoKeywords.length)];
    const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
    sentences.push(`‰ª•Ê?${randomTrait}?ÑÂÄãÊÄß‰??ãÔ???{randomKeyword}??{randomReaction}?Ñ„ÄÇ`);
  }

  if (bgParts.length > 0 && Math.random() > 0.5) {
    const randomBg = bgParts[Math.floor(Math.random() * bgParts.length)];
    sentences.push(`${randomBg}?ÑÊ?ÔºåË¶∫ÂæóÈÄôÈÉ®?ÜÂ??âÊ?Ë¶∫„ÄÇ`);
  }

  if (memory && memory.length > 0 && Math.random() > 0.6) {
    const recentMsg = memory[memory.length - 1];
    if (recentMsg && recentMsg.content) {
      const recentKeywords = recentMsg.content.slice(0, 15);
      sentences.push(`?õÊ?‰Ω†Ë™™??{recentKeywords}...?çÔ??ôË£°?âË?‰Ω†ÊÉ≥?∞‰?È∫ºÂ?Ôºü`);
    }
  }

  if (sentences.length === 0) {
    const randomKeyword = videoKeywords[Math.floor(Math.random() * videoKeywords.length)];
    const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
    sentences.push(`??{randomKeyword}${randomReaction}?¢„ÄÇ`);
  }

  return sentences.join(' ');
}

function calculateCommentInterval(char) {
  const personality = (char?.personality || '').toLowerCase();

  let baseInterval = 10000;

  if (personality.includes('Ê¥ªÊ?') || personality.includes('Ë™øÁöÆ') || personality.includes('?ãÊ?') || personality.includes('?±Ê?')) {
    baseInterval = 6000;
  } else if (personality.includes('È´òÂÜ∑') || personality.includes('?∑Ê∑°') || personality.includes('??) || personality.includes('?∑È?')) {
    baseInterval = 15000;
  } else if (personality.includes('?ÖÂ?') || personality.includes('‰ΩîÊ?') || personality.includes('Â´âÂ?') || personality.includes('?πÈ?')) {
    baseInterval = 7000;
  } else if (personality.includes('Ê∫´Ê?') || personality.includes('È´îË≤º') || personality.includes('?ÑËâØ')) {
    baseInterval = 9000;
  } else if (personality.includes('ÊøÄ??) || personality.includes('?±Ë?')) {
    baseInterval = 5000;
  }

  const variance = baseInterval * 0.3;
  return baseInterval + (Math.random() * variance * 2 - variance);
}

function showCharCommentBubble(text) {
  const bubble = document.getElementById('yt-char-comment-bubble');
  const textEl = document.getElementById('yt-char-comment-text');
  
  if (!bubble || !textEl) return;
  
  textEl.textContent = text;
  bubble.removeAttribute('hidden');
  
  setTimeout(() => {
    bubble.setAttribute('hidden', '');
  }, 4000);
}

function startCharCompanion(char, video) {
  const companion = document.getElementById('yt-char-companion');
  const avatar = document.getElementById('yt-char-companion-avatar');
  const nameEl = document.getElementById('yt-char-companion-name');
  
  if (!companion || !char) return;
  
  if (avatar) {
    if (char.avatar) {
      avatar.style.backgroundImage = `url('${char.avatar}')`;
    } else {
      avatar.style.backgroundImage = '';
      avatar.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
    }
  }
  if (nameEl) nameEl.textContent = char.name || 'ËßíËâ≤';
  
  companion.removeAttribute('hidden');
  
  if (charCommentTimer) clearInterval(charCommentTimer);
  
  charCommentInterval = calculateCommentInterval(char);
  
  setTimeout(() => {
    const initialComment = getCharLiveComment(char, video);
    showCharCommentBubble(initialComment);
  }, 2000);
  
  charCommentTimer = setInterval(() => {
    if (!pendingVideoData) return;
    const comment = getCharLiveComment(char, pendingVideoData);
    showCharCommentBubble(comment);
    charCommentInterval = calculateCommentInterval(char);
  }, charCommentInterval);
}

function stopCharCompanion() {
  const companion = document.getElementById('yt-char-companion');
  const bubble = document.getElementById('yt-char-comment-bubble');
  
  companion?.setAttribute('hidden', '');
  bubble?.setAttribute('hidden', '');
  
  if (charCommentTimer) {
    clearInterval(charCommentTimer);
    charCommentTimer = null;
  }
}

const adTexts = [
  '?î• ?êÊ??™Ê?ÔºÅÁ??≥È??äÊü•?ãÔ?',
  '?? ?®ÂÆ∂?òÊâ£Á¢ºÔ?YOUTUBE2026',
  '?°Ô? ?±Èä∑?ÜÂ?ÔºåÈåØ?é‰??çÔ?',
  '?? VIP ?ÉÂì°Â∞àÂ±¨Á¶èÂà©Á≠â‰???,
  '?? Á´ãÂç≥‰∏ãË? APP ‰∫´Â??¥Â??™Ê?',
  '?í∞ Ë≥∫Èå¢ÁßòË®£Â§ßÂÖ¨?ãÔ?ÈªûÊ?‰∫ÜËß£Ôº?,
  '?ì± ?®Êñ∞?äÊà≤‰∏äÁ?ÔºåÈ??≤ÈÄÅÂ§ß?éÔ?',
  '?è• ?•Â∫∑‰øùÂÅ•ÔºåÂ?ÂÆ∂Êé®?¶Ô?'
];

const adPopupMessages = [
  { icon: '??', title: '?≠Â?‰Ω†‰∏≠?é‰?Ôº?, text: '‰Ω†ÊòØ‰ªäÊó•Á¨?1000 ‰ΩçË®™ÂÆ¢Ô??≤Â??πÂà•?éÂãµÔº? },
  { icon: '?†Ô?', title: 'Ë≠¶Â?Ôº?, text: '‰Ω†Á?Ë£ùÁΩÆ?ØËÉΩÂ≠òÂú®È¢®Èö™ÔºåË?Á´ãÂç≥?ÉÊ?Ôº? },
  { icon: '?ì±', title: '?¥Êñ∞?ØÁî®', text: '?âÊñ∞?àÊú¨?Ø‰?‰∏ãË?ÔºåÁ??≥Êõ¥?∞‰∫´?óÊñ∞?üËÉΩÔº? },
  { icon: '??', title: '?êÈ?', text: '‰Ω†Ê? 3 ?áÊú™ËÆÄ?öÁü•ÔºåÈ??äÊü•?ãË©≥?Ö„Ä? },
  { icon: '?í∞', title: 'Ë≥∫Èå¢Ê©üÊ?', text: '?®ÂÆ∂Â∑•‰??àÂÖ• 10 ?¨Ô?Á´ãÂç≥‰∫ÜËß£?¥Â?Ôº? }
];

function showAd() {
  const overlay = document.getElementById('yt-ad-overlay');
  const skipBtn = document.getElementById('yt-ad-skip-btn');
  const skipText = document.getElementById('yt-ad-skip');
  const countdownEl = document.getElementById('yt-ad-countdown');
  const bannerText = document.getElementById('yt-ad-banner-text');
  const banner = document.getElementById('yt-ad-banner');
  const progressBar = document.getElementById('yt-ad-progress-bar');
  
  if (!overlay) return;
  
  overlay.removeAttribute('hidden');
  adShowing = true;
  
  if (bannerText) bannerText.textContent = randomPick(adTexts);
  if (banner) banner.removeAttribute('hidden');
  if (skipBtn) skipBtn.setAttribute('hidden', '');
  if (skipText) skipText.removeAttribute('hidden');
  
  adCountdown = 5 + Math.floor(Math.random() * 10);
  if (countdownEl) countdownEl.textContent = adCountdown;
  
  let progress = 0;
  const totalDuration = adCountdown * 1000;
  const progressInterval = 100;
  
  const progressTimer = setInterval(() => {
    progress += (progressInterval / totalDuration) * 100;
    if (progressBar) progressBar.style.width = `${Math.min(progress, 100)}%`;
  }, progressInterval);
  
  adTimer = setInterval(() => {
    adCountdown--;
    if (countdownEl) countdownEl.textContent = adCountdown;
    
    if (Math.random() < 0.3) {
      showAdPopup();
    }
    
    if (adCountdown <= 0) {
      clearInterval(adTimer);
      clearInterval(progressTimer);
      adTimer = null;
      if (skipBtn) {
        skipBtn.removeAttribute('hidden');
        skipBtn.onclick = skipAd;
      }
      if (skipText) skipText.setAttribute('hidden', '');
    }
  }, 1000);
}

function skipAd() {
  const overlay = document.getElementById('yt-ad-overlay');
  if (overlay) overlay.setAttribute('hidden', '');
  adShowing = false;
  
  if (Math.random() < 0.5) {
    showAdPopup();
  }
}

function closeAdBanner() {
  const banner = document.getElementById('yt-ad-banner');
  if (banner) banner.setAttribute('hidden', '');
}

function showAdPopup() {
  const existingPopup = document.querySelector('.yt-ad-popup');
  if (existingPopup) return;
  
  const msg = randomPick(adPopupMessages);
  const popup = document.createElement('div');
  popup.className = 'yt-ad-popup';
  popup.innerHTML = `
    <div class="yt-ad-popup-card">
      <div class="yt-ad-popup-icon">${msg.icon}</div>
      <div class="yt-ad-popup-title">${msg.title}</div>
      <div class="yt-ad-popup-text">${msg.text}</div>
      <div class="yt-ad-popup-actions">
        <button class="yt-ad-popup-btn primary" data-action="ad-continue">ÁπºÁ?ËßÄ??/button>
        <button class="yt-ad-popup-btn secondary" data-action="ad-learn-more">‰∫ÜËß£?¥Â?</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(popup);
}

function closeAdPopup() {
  const popup = document.querySelector('.yt-ad-popup');
  if (popup) popup.remove();
}

function clickAd() {
  showAdPopup();
}

function updateCharWatchUI(char, video) {
  const nameEl = document.getElementById('yt-char-watch-name');
  const statusEl = document.getElementById('yt-char-watch-status');
  const avatarEl = document.getElementById('yt-char-watch-avatar');
  
  if (char) {
    if (nameEl) nameEl.textContent = char.name || 'ËßíËâ≤';
    if (statusEl) statusEl.textContent = `Ê≠?ú®ËßÄ?ã„Ä?{video?.title || 'ÂΩ±Á?'}?ç`;
    if (avatarEl && char.avatar) {
      avatarEl.style.backgroundImage = `url('${char.avatar}')`;
      avatarEl.style.backgroundSize = 'cover';
      avatarEl.style.backgroundPosition = 'center';
    }
  } else {
    if (nameEl) nameEl.textContent = '?∏Ê?ËßíËâ≤';
    if (statusEl) statusEl.textContent = 'ÈªûÊ?‰∏äÊñπ?∏Ê?ËßíËâ≤‰∏ÄËµ∑Ë???;
    if (avatarEl) avatarEl.style.backgroundImage = '';
  }
}

function showCharReaction(char, video) {
  const reactionEl = document.getElementById('yt-char-watch-reaction');
  const textEl = document.getElementById('yt-char-reaction-text');
  const timeEl = document.getElementById('yt-char-reaction-time');
  
  if (!char || !video) {
    reactionEl?.setAttribute('hidden', '');
    return;
  }
  
  const reaction = getCharReaction(char, video);
  if (textEl) textEl.textContent = reaction;
  if (timeEl) timeEl.textContent = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
  reactionEl?.removeAttribute('hidden');
  
  const historyEntry = {
    id: `watch_${Date.now()}`,
    charId: currentWatchingChar,
    charName: char.name,
    videoId: video.id,
    videoTitle: video.title,
    reaction,
    watchedAt: new Date().toISOString()
  };
  
  charWatchHistory.unshift(historyEntry);
  if (charWatchHistory.length > 50) {
    charWatchHistory = charWatchHistory.slice(0, 50);
  }
  saveToStorage(STORAGE_KEY_CHAR_WATCH, charWatchHistory);
}

function renderCharWatchHistory() {
  const list = document.querySelector('.yt-char-history-list');
  if (!list) return;
  
  if (charWatchHistory.length === 0) {
    list.innerHTML = '<div class="yt-char-empty">Â∞öÁÑ°ËßÄ?ãÁ???/div>';
    return;
  }
  
  list.innerHTML = charWatchHistory.slice(0, 20).map(entry => `
    <div class="yt-char-history-item">
      <div class="yt-char-history-item-video">${entry.videoTitle}</div>
      <div class="yt-char-history-item-meta">
        <span><i class="far fa-user"></i> ${entry.charName}</span>
        <span><i class="far fa-clock"></i> ${new Date(entry.watchedAt).toLocaleString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <div class="yt-char-history-item-reaction">${entry.reaction}</div>
    </div>
  `).join('');
}

function openCharWatchHistory() {
  let historyView = document.getElementById('yt-char-watch-history-view');
  if (!historyView) {
    historyView = document.createElement('section');
    historyView.id = 'yt-char-watch-history-view';
    historyView.className = 'yt-char-watch-history';
    historyView.innerHTML = `
      <header class="yt-char-history-topbar">
        <button class="yt-icon" data-action="close-char-history" aria-label="ËøîÂ?">
          <i class="fas fa-chevron-left"></i>
        </button>
        <div class="yt-char-history-title">ËßíËâ≤ËßÄ?ãÁ???/div>
        <button class="yt-icon" aria-label="?¥Â?"><i class="fas fa-ellipsis-v"></i></button>
      </header>
      <div class="yt-char-history-list"></div>
    `;
    playerPage?.appendChild(historyView);
  }
  historyView?.removeAttribute('hidden');
  renderCharWatchHistory();
}

function closeCharWatchHistory() {
  const historyView = document.getElementById('yt-char-watch-history-view');
  historyView?.setAttribute('hidden', '');
}

function openPlayerPage(video) {
  pendingVideoData = video;
  document.querySelector('.yt-main')?.setAttribute('hidden', '');
  playerPage?.removeAttribute('hidden');
  
  if (playerTitleMain) playerTitleMain.textContent = video.title;
  if (playerSub) playerSub.textContent = `${video.views} ¬∑ ${video.time}`;
  if (playerChannelName) playerChannelName.textContent = video.channel;
  if (playerDesc) playerDesc.textContent = video.title;
  
  if (playerFrame && video.url) {
    playerFrame.src = video.url;
  }
  
  const likeBtn = document.querySelector('[data-action="like-video"]');
  if (likeBtn) {
    likeBtn.classList.toggle('liked', likedVideos.some(v => v.id === video.id));
  }
  
  renderCharWatchSelect();
  updateCharWatchUI(null, video);
  document.getElementById('yt-char-watch-reaction')?.setAttribute('hidden', '');
  
  const charSelect = document.getElementById('yt-char-watch-select');
  if (charSelect) charSelect.value = '';
  
  stopCharCompanion();
  currentWatchingChar = null;
  
  if (Math.random() < 0.8) {
    showAd();
  }
}

function closePlayerPage() {
  playerPage?.setAttribute('hidden', '');
  document.querySelector('.yt-main')?.removeAttribute('hidden');
  if (playerFrame) playerFrame.src = '';
  stopCharCompanion();
  currentWatchingChar = null;
  
  const overlay = document.getElementById('yt-ad-overlay');
  if (overlay) overlay.setAttribute('hidden', '');
  if (adTimer) {
    clearInterval(adTimer);
    adTimer = null;
  }
  adShowing = false;
  
  closeAdPopup();
}

function openVideoModal(video) {
  pendingVideoData = video;
  videoModal?.removeAttribute('hidden');
  if (videoUrlInput && video.url) {
    videoUrlInput.value = video.url;
  }
}

function closeVideoModal() {
  videoModal?.setAttribute('hidden', '');
  videoUrlInput.value = '';
  pendingVideoData = null;
}

function openAddModal() {
  addModal?.removeAttribute('hidden');
  addTitleInput.value = '';
  addUrlInput.value = '';
  addTagSelect.value = currentChip === 'all' ? 'all' : currentChip;
  uploadedThumbData = null;
  if (addThumbPreview) {
    addThumbPreview.style.backgroundImage = '';
    addThumbPreview.classList.remove('has-image');
    addThumbPreview.innerHTML = '<i class="fas fa-image"></i><span>ÈªûÊ?‰∏äÂÇ≥Â∞ÅÈù¢</span>';
  }
  addTitleInput.focus();
}

function closeAddModal() {
  addModal?.setAttribute('hidden', '');
  uploadedThumbData = null;
}

function handleThumbUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  
  if (!file.type.startsWith('image/')) {
    alert('Ë´ãÈÅ∏?áÂ??áÊ?Ê°?);
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    uploadedThumbData = e.target.result;
    if (addThumbPreview) {
      addThumbPreview.style.backgroundImage = `url('${uploadedThumbData}')`;
      addThumbPreview.classList.add('has-image');
      addThumbPreview.innerHTML = '';
    }
  };
  reader.readAsDataURL(file);
}

function clearThumbUpload() {
  uploadedThumbData = null;
  if (addThumbFileInput) addThumbFileInput.value = '';
  if (addThumbPreview) {
    addThumbPreview.style.backgroundImage = '';
    addThumbPreview.classList.remove('has-image');
    addThumbPreview.innerHTML = '<i class="fas fa-image"></i><span>ÈªûÊ?‰∏äÂÇ≥Â∞ÅÈù¢</span>';
  }
}

function openCollectionModal() {
  collectionModal?.removeAttribute('hidden');
  collectionNameInput.value = '';
  collectionNameInput.focus();
}

function closeCollectionModal() {
  collectionModal?.setAttribute('hidden', '');
}

function openSaveModal(videoId) {
  pendingVideoData = currentFeed.find(v => v.id === videoId) || myVideos.find(v => v.id === videoId);
  renderSaveList(videoId);
  saveModal?.removeAttribute('hidden');
}

function closeSaveModal() {
  saveModal?.setAttribute('hidden', '');
  pendingVideoData = null;
}

function addVideo() {
  const title = addTitleInput.value.trim() || '?ëÁ?ÂΩ±Á?';
  const url = addUrlInput.value.trim();
  const tag = addTagSelect.value;
  
  const newVideo = {
    id: `vid_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title,
    channel: localStorage.getItem('sx_user_name') || '?ëÁ??ªÈ?',
    views: '?∞‰???,
    time: '?õÂ?',
    duration: randomDuration(),
    tag: tag === 'all' ? randomPick(['live', 'music', 'game', 'tech', 'diy']) : tag,
    url,
    thumb: uploadedThumbData || '',
    thumbGradient: uploadedThumbData ? '' : generateThumbnail(),
    createdAt: new Date().toISOString(),
    isMyVideo: true
  };
  
  myVideos.unshift(newVideo);
  currentFeed.unshift(newVideo);
  
  saveToStorage(STORAGE_KEY_MY_VIDEOS, myVideos);
  saveToStorage(STORAGE_KEY_FEED, currentFeed);
  
  renderFeed();
  closeAddModal();
}

function createCollection() {
  const name = collectionNameInput.value.trim() || '?ëÁ??∂Ë?';
  const newCollection = {
    id: `col_${Date.now()}`,
    name,
    videos: [],
    createdAt: new Date().toISOString()
  };
  
  currentCollections.push(newCollection);
  saveToStorage(STORAGE_KEY_COLLECTIONS, currentCollections);
  renderCollections();
  closeCollectionModal();
}

function deleteCollection(index) {
  if (index >= 0 && index < currentCollections.length) {
    currentCollections.splice(index, 1);
    saveToStorage(STORAGE_KEY_COLLECTIONS, currentCollections);
    renderCollections();
  }
}

function toggleSaveToCollection(collectionId) {
  if (!pendingVideoData) return;
  
  const collection = currentCollections.find(c => c.id === collectionId);
  if (!collection) return;
  
  const existingIndex = collection.videos.findIndex(v => v.id === pendingVideoData.id);
  if (existingIndex >= 0) {
    collection.videos.splice(existingIndex, 1);
  } else {
    collection.videos.push(pendingVideoData);
  }
  
  saveToStorage(STORAGE_KEY_COLLECTIONS, currentCollections);
  renderSaveList(pendingVideoData.id);
}

function toggleLike() {
  if (!pendingVideoData) return;
  
  const existingIndex = likedVideos.findIndex(v => v.id === pendingVideoData.id);
  if (existingIndex >= 0) {
    likedVideos.splice(existingIndex, 1);
  } else {
    likedVideos.push(pendingVideoData);
  }
  
  saveToStorage(STORAGE_KEY_LIKED, likedVideos);
  
  const likeBtn = document.querySelector('[data-action="like-video"]');
  if (likeBtn) {
    likeBtn.classList.toggle('liked', likedVideos.some(v => v.id === pendingVideoData.id));
  }
}

function generateAIContent() {
  const newVideos = generateFeed(4);
  currentFeed = [...newVideos, ...currentFeed];
  saveToStorage(STORAGE_KEY_FEED, currentFeed);
  renderFeed();
  closeVideoModal();
}

function generateAITitle() {
  addTitleInput.value = '';
}

function generateAIDescription() {
  const descriptions = [
    '?®ÈÄôÈÉ®ÂΩ±Á?‰∏≠Ô??ëÂ??Ü‰∫´‰∏Ä‰∫õÂØ¶?®Á??ÄÂ∑ßÂ?ÂøÉÂ?ÔºåÂ??õËÉΩÂπ´Âä©?∞Â§ßÂÆ∂Ô?',
    '?ôÊòØ?ëÊ?ËøëÁ?‰∏Ä‰∫õÁôº?æÂ?È´îÈ?ÔºåÊ≠°ËøéÂú®?ôË??Ä?Ü‰∫´‰Ω†Á??≥Ê?Ôº?,
    '?üË?Â§ßÂÆ∂?ÑÊîØ?ÅÔ??ôÈÉ®ÂΩ±Á??±‰?ÂæàÂ??ÇÈ?Ë£Ω‰?ÔºåÂ??õ‰??ëÂ?Ê≠°„Ä?,
    '‰ªäÂ§©Ë¶Å‰?Ë∑üÂ§ßÂÆ∂Ë??ä‰??ãÊ?Ë∂??Ë©±È?Ôºå‰?Ëµ∑‰??ãÁ??ßÔ?'
  ];
}

function playUrl() {
  const url = videoUrlInput.value.trim();
  if (!url) return;
  
  const video = {
    id: `vid_${Date.now()}`,
    title: '?™Ë?ÂΩ±Á?',
    channel: '?™Áü•?ªÈ?',
    views: '??,
    time: '?õÂ?',
    duration: '??,
    tag: 'all',
    url,
    thumb: '',
    createdAt: new Date().toISOString()
  };
  
  closeVideoModal();
  openPlayerPage(video);
}

function showView(viewName) {
  document.querySelector('.yt-main')?.setAttribute('hidden', '');
  collectionsView?.setAttribute('hidden', '');
  meView?.setAttribute('hidden', '');
  charView?.setAttribute('hidden', '');
  playerPage?.setAttribute('hidden', '');
  
  if (viewName === 'home') {
    document.querySelector('.yt-main')?.removeAttribute('hidden');
  } else if (viewName === 'collections') {
    collectionsView?.removeAttribute('hidden');
    renderCollections();
  } else if (viewName === 'me') {
    meView?.removeAttribute('hidden');
    renderMeView();
  }
}

function bindEvents() {
  const filterSelect = document.getElementById('yt-filter-select');
  filterSelect?.addEventListener('change', () => {
    currentChip = filterSelect.value;
    renderFeed();
  });
  
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const view = tab.dataset.view;
      const action = tab.dataset.action;
      
      if (action === 'open-add-modal') {
        openAddModal();
        return;
      }
      
      if (view) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        showView(view);
      }
    });
  });
  
  charBtn?.addEventListener('click', async () => {
    charView?.removeAttribute('hidden');
    document.querySelector('.yt-main')?.setAttribute('hidden', '');
    renderCharSelect();
    await renderCharFeed(charSelect?.value || '0');
  });
  
  charSelect?.addEventListener('change', async () => {
    await renderCharFeed(charSelect.value);
  });
  
  feedEl?.addEventListener('click', event => {
    const card = event.target.closest('.yt-card');
    const moreBtn = event.target.closest('.yt-more');
    
    if (moreBtn && card) {
      const videoId = card.dataset.videoId;
      const video = currentFeed.find(v => v.id === videoId);
      if (video) openVideoModal(video);
      return;
    }
    
    if (card) {
      const videoId = card.dataset.videoId;
      const video = currentFeed.find(v => v.id === videoId);
      if (video) {
        if (video.url) {
          openPlayerPage(video);
        } else {
          openVideoModal(video);
        }
      }
    }
  });
  
  collectionsList?.addEventListener('click', event => {
    const deleteBtn = event.target.closest('[data-action="delete-collection"]');
    if (deleteBtn) {
      event.stopPropagation();
      const index = parseInt(deleteBtn.dataset.index, 10);
      deleteCollection(index);
      return;
    }
    
    const item = event.target.closest('.yt-collection-item');
    if (item) {
      const index = parseInt(item.dataset.collectionIndex, 10);
      const collection = currentCollections[index];
      if (collection && collection.videos.length > 0) {
        currentFeed = collection.videos;
        showView('home');
        renderFeed();
      }
    }
  });
  
  document.addEventListener('click', async (event) => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    
    const action = target.dataset.action;
    
    switch (action) {
      case 'close-char':
        charView?.setAttribute('hidden', '');
        document.querySelector('.yt-main')?.removeAttribute('hidden');
        break;
      case 'refresh-char':
        await renderCharFeed(charSelect?.value || '0');
        break;
      case 'close-collections':
        showView('home');
        break;
      case 'add-collection':
        openCollectionModal();
        break;
      case 'close-me':
        showView('home');
        break;
      case 'open-collections':
        showView('collections');
        break;
      case 'close-player':
        closePlayerPage();
        break;
      case 'like-video':
        toggleLike();
        break;
      case 'save-video':
        if (pendingVideoData) openSaveModal(pendingVideoData.id);
        break;
      case 'close-modal':
        closeVideoModal();
        break;
      case 'generate-content':
        generateAIContent();
        break;
      case 'play-url':
        playUrl();
        break;
      case 'close-add-modal':
        closeAddModal();
        break;
      case 'add-video':
        addVideo();
        break;
      case 'upload-thumb':
        addThumbFileInput?.click();
        break;
      case 'clear-thumb':
        clearThumbUpload();
        break;
      case 'ai-title':
        generateAITitle();
        break;
      case 'ai-desc':
        generateAIDescription();
        break;
      case 'close-collection-modal':
        closeCollectionModal();
        break;
      case 'create-collection':
        createCollection();
        break;
      case 'close-save-modal':
        closeSaveModal();
        break;
      case 'char-react':
        if (currentWatchingChar !== null && pendingVideoData) {
          const chars = loadChars();
          const char = chars[currentWatchingChar];
          showCharReaction(char, pendingVideoData);
        }
        break;
      case 'char-watch-history':
        openCharWatchHistory();
        break;
      case 'close-char-history':
        closeCharWatchHistory();
        break;
      case 'remove-companion':
        stopCharCompanion();
        const charWatchSelect = document.getElementById('yt-char-watch-select');
        if (charWatchSelect) charWatchSelect.value = '';
        currentWatchingChar = null;
        updateCharWatchUI(null, pendingVideoData);
        break;
      case 'skip-ad':
        skipAd();
        break;
      case 'close-ad-banner':
        closeAdBanner();
        break;
      case 'click-ad':
        clickAd();
        break;
      case 'ad-continue':
        closeAdPopup();
        break;
      case 'ad-learn-more':
        closeAdPopup();
        showAd();
        break;
    }
  });
  
  const charWatchSelectEl = document.getElementById('yt-char-watch-select');
  charWatchSelectEl?.addEventListener('change', () => {
    const index = charWatchSelectEl.value;
    if (index === '') {
      currentWatchingChar = null;
      updateCharWatchUI(null, pendingVideoData);
      document.getElementById('yt-char-watch-reaction')?.setAttribute('hidden', '');
      stopCharCompanion();
    } else {
      currentWatchingChar = parseInt(index, 10);
      const chars = loadChars();
      const char = chars[currentWatchingChar];
      updateCharWatchUI(char, pendingVideoData);
      if (char && pendingVideoData) {
        startCharCompanion(char, pendingVideoData);
      }
    }
  });

  addThumbFileInput?.addEventListener('change', handleThumbUpload);
  
  addThumbPreview?.addEventListener('click', () => {
    addThumbFileInput?.click();
  });
  
  saveList?.addEventListener('click', event => {
    const item = event.target.closest('.yt-save-item');
    if (item) {
      const collectionId = item.dataset.collectionId;
      toggleSaveToCollection(collectionId);
    }
  });
  
  window.addEventListener('storage', event => {
    if (event.key === CHAR_LIST_KEY) {
      renderCharSelect();
    }
    if (['sx_user_name', 'sx_user_avatar'].includes(event.key)) {
      renderMeView();
    }
  });
}

function loadSxSettings() {
  if (typeof SxSettings === 'undefined') return null;
  const settings = SxSettings.getSettingsSnapshot();
  console.log('[youtube] Loaded settings:', {
    characters: settings.characters.length,
    users: settings.users.length,
    apis: settings.apis.length
  });
  return settings;
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
        if (e.title && e.content) {
          entries.push(`??{e.title}??{e.content.slice(0, 200)}`);
        }
      });
    }
  }
  return entries.length > 0 ? entries.join('\n') : '?°‰??åÊõ∏Ë®≠Â?';
}

function getCharacterData(name) {
  if (!name) return null;
  const raw = localStorage.getItem(CHAR_LIST_KEY);
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
  if (history.length === 0) return '?°Ë?Â§©Ë???;
  const user = getUserData();
  return history.map(msg => {
    const role = msg.role === 'user' ? user.name : 'ËßíËâ≤';
    return `${role}: ${msg.content.slice(0, 100)}`;
  }).join('\n');
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
    throw new Error('Â∞öÊú™Ë®≠Â? API');
  }

  const apiType = config.type || 'openai';
  
  // Gemini ?üÁ? API ?ºÂ?
  if (apiType === 'gemini') {
    const model = config.model || 'gemini-1.5-flash';
    const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.key}`;
    
    const contents = [];
    let systemInstruction = '';
    
    for (const msg of messages) {
      if (msg.role === 'system') {
        systemInstruction = msg.content;
      } else {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      }
    }
    
    const geminiPayload = {
      contents,
      generationConfig: { temperature, maxOutputTokens: 2048 }
    };
    
    if (systemInstruction) {
      geminiPayload.systemInstruction = { parts: [{ text: systemInstruction }] };
    }
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload)
    });
    
    if (!response.ok) {
      throw new Error(`Gemini API ?ØË™§ (${response.status})`);
    }
    
    const data = await response.json();
    if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
  
  // OpenAI ?∏ÂÆπ?ºÂ??ñËá™Ë®ÇÁ´ØÈª?  let endpoint;
  if (apiType === 'custom') {
    endpoint = config.url;
  } else {
    endpoint = config.url.endsWith('/chat/completions')
      ? config.url
      : `${config.url.replace(/\/$/, '')}/chat/completions`;
  }

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
    throw new Error(`API ?ØË™§ (${response.status})`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

function buildYouTubeContext() {
  const user = getUserData();
  const char = getActiveCharacter();
  const worldbook = getWorldbookContext();
  const chatHistory = getChatHistoryContext();

  let context = `# ‰ΩøÁî®?ÖË®≠ÂÆö\n?çÁ®±: ${user.name}\n`;
  if (user.personality) context += `?ßÊ†º: ${user.personality}\n`;
  if (user.background) context += `?åÊôØ: ${user.background}\n`;

  if (char) {
    context += `\n# ËßíËâ≤Ë®≠Â?\n?çÁ®±: ${char.name}\n`;
    if (char.personality) context += `?ßÊ†º: ${char.personality}\n`;
    if (char.background) context += `?åÊôØ: ${char.background}\n`;
  }

  context += `\n# ‰∏ñÁ??∏\n${worldbook}\n`;

  if (chatHistory !== '?°Ë?Â§©Ë???) {
    context += `\n# ËøëÊ?Â∞çË©±\n${chatHistory}\n`;
  }

  return context;
}

let isGeneratingVideos = false;

async function generateAIVideos() {
  if (isGeneratingVideos) {
    alert('Ê≠?ú®?üÊ?‰∏≠Ô?Ë´ãÁ???..');
    return;
  }

  isGeneratingVideos = true;

  try {
    const context = buildYouTubeContext();
    const lang = localStorage.getItem('sxiphone_lang') || 'zh-TW';

    const systemPrompt = `‰Ω†ÊòØ‰∏Ä‰ΩçÂ?Ê•≠Á?ÂΩ±Á??ßÂÆπ?µ‰??ÖÔ??ÖÈï∑?πÊ?ËßíËâ≤Ë®≠Â??å‰Ωø?®ËÄÖË??ØÂâµ‰ΩúÁ¨¶?à‰∫∫?©ÊÄßÊ†º?ÑÂΩ±?áÊ?È°åÂ??èËø∞??Ë´ã‰Ωø??${window.getAIReadableLangName?.(lang) || 'ÁπÅÈ?‰∏≠Ê?'} ?∞ÂØ´??Ëº∏Âá∫?ºÂ???JSON: {"videos": [{"title": "ÂΩ±Á?Ê®ôÈ?", "channel": "?ªÈ??çÁ®±", "views": "ËßÄ?ãÊ¨°??, "duration": "?ÇÈï∑"}]}`;

    const prompt = `${context}

Ë´ãÁ???3 ??YouTube ÂΩ±Á?ÔºåË?Ê±ÇÔ?
1. Á¨¶Â?ËßíËâ≤?ßÊ†º?å‰Ωø?®ËÄÖË®≠ÂÆ?2. ?™ÁÑ∂?çÂÖ•‰∏ñÁ??∏Ë®≠ÂÆ?3. Ê®ôÈ?Ë¶ÅÊ??∏Â???4. ?Ø‰ª•?ØÈü≥Ê®Ç„ÄÅÈ??≤„ÄÅÊ?Â≠∏„ÄÅVlog Á≠âÈ???
Ëº∏Âá∫ JSON ?ºÂ??Ç`;

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

    const videos = Array.isArray(parsed?.videos) ? parsed.videos : [];

    videos.forEach((video, index) => {
      if (video.title) {
        currentFeed.unshift({
          id: `ai-vid-${Date.now()}-${index}`,
          title: video.title,
          channel: video.channel || randomPick(channelPool),
          views: video.views || randomViews(),
          time: randomTime(),
          duration: video.duration || randomDuration(),
          tag: currentChip === 'all' ? randomPick(['live', 'music', 'game', 'tech', 'diy']) : currentChip,
          url: '',
          thumb: '',
          thumbGradient: generateThumbnail(),
          createdAt: new Date().toISOString()
        });
      }
    });

    if (videos.length > 0) {
      renderFeed();
      saveToStorage(STORAGE_KEY_FEED, currentFeed);
    } else {
      alert('?üÊ?Â§±Ê?ÔºåË?Á®çÂ??çË©¶');
    }
  } catch (err) {
    alert(`?üÊ?Â§±Ê?: ${err.message}`);
  } finally {
    isGeneratingVideos = false;
  }
}

loadSxSettings();
loadAllData();
renderFeed();
bindEvents();

document.addEventListener('click', (event) => {
  if (event.target.closest('#ai-generate-yt-btn') || event.target.closest('#yt-ai-generate-btn')) {
    generateAIVideos();
  }
});
console.log('Loaded app: youtube (enhanced)');
