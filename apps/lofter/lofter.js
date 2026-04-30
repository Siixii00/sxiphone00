const feedEl = document.getElementById('lofter-feed');
const tagRowEl = document.getElementById('tag-row');
const tabButtons = document.querySelectorAll('.tab-btn');
const viewToggleBtn = document.getElementById('view-toggle');
const pageSections = document.querySelectorAll('.page');
const navItems = document.querySelectorAll('.bottom-nav .nav-item');
const worldbookListEl = document.getElementById('lofter-worldbook-list');
const ideaGridEl = document.getElementById('idea-grid');
const ideaSelectAllBtn = document.getElementById('idea-select-all');
const ideaClearBtn = document.getElementById('idea-clear');
const ideaGenerateBtn = document.getElementById('idea-generate');
const cpTopSelect = document.getElementById('lofter-cp-top');
const cpBottomSelect = document.getElementById('lofter-cp-bottom');
const cpAddBtn = document.getElementById('lofter-cp-add');
const cpListEl = document.getElementById('lofter-cp-list');
const likesFeedEl = document.getElementById('likes-feed');
const likesIdeaGridEl = null;
const likesCpCheckboxList = document.getElementById('lofter-cp-checkbox-list');
const likesSelectAllBtn = document.getElementById('likes-select-all');
const likesClearBtn = document.getElementById('likes-clear');
const likesGenerateBtn = document.getElementById('likes-generate');
const likesCountSelect = document.getElementById('lofter-likes-count');
const likesStyleSelect = document.getElementById('lofter-style-tone');
const likesStyleRef = document.getElementById('lofter-style-ref');
const worldbookStyleContainer = document.getElementById('worldbook-style-container');
const worldbookStyleSelect = document.getElementById('lofter-worldbook-style');
const topBodytypeSelect = document.getElementById('lofter-top-bodytype');
const bottomBodytypeSelect = document.getElementById('lofter-bottom-bodytype');
const bodytypeNoteInput = document.getElementById('lofter-bodytype-note');
const followFeedEl = document.getElementById('follow-feed');
const worldbookCheckboxList = document.getElementById('lofter-worldbook-checkbox-list');

const postData = {
  recommend: [],
  follow: [],
  latest: []
};

const hotTags = ['#?Œäºº??, '#?Ÿä?è£œå?', '#????´æ–°', '#è§’è‰²?¨ç™½', '#ä¸–ç?è§€?ƒæ?', '#AU?µä?', '#?¥é?æ´»å?'];
let currentTab = 'recommend';
let currentTag = hotTags[0];
let currentView = 'list';
let currentPage = 'home';
const CP_FOLLOW_KEY = 'sx_lofter_cp_follow';
const FOLLOW_POST_KEY = 'sx_lofter_follow_posts';
const IDEA_SELECTION_KEY = 'sx_lofter_idea_selection';
const SELECTED_CP_KEY = 'sx_lofter_selected_cp';
const CONTENT_RATING_KEY = 'sx_lofter_content_rating';
const CONTENT_LENGTH_KEY = 'sx_lofter_content_length';
const BOOKMARKS_KEY = 'sx_lofter_bookmarks';
const CP_BODYTYPES_KEY = 'sx_lofter_cp_bodytypes';
const GENERATED_POSTS_KEY = 'sx_lofter_generated_posts';

const AUTHOR_NAMES = [
  'å¤œè?å­?, 'è·¯äºº??, '?¿å??¨æˆ¶', 'æ½›æ°´??, 'è·¯äººä¹?,
  'å°é€æ?', '?ƒç?ç¾¤çœ¾', 'ä½›ç³»?’å¹´', 'é¹¹é?ä¸€æ¢?, '?¸é??”äºº',
  'ç¤¾ç??¥å¸¸', '?“å·¥äº?, '?¬ç?äº?, 'ç¢¼è¾²ä¸€??, 'è¨­è?å¸«é˜¿',
  '?ç«¯ä»?, 'å¾Œç«¯ä½?, '?¢å?æ±?, '?‹ç???, 'æ¸¬è©¦??,
  'å¯¦ç??Ÿå???, '?å“¡å·¥å¼µ??, '?°ä??„å???, '?”å??ç?', 'æ¨“ä?å°é™³',
  '?ä??¥å?ç¶²å?', 'è·¯é???, '?¨ä¾¿?‹ç?', 'ç´”è·¯äº?, '?ƒç?ç¾¤çœ¾',
  '?è?ç¾¤çœ¾', 'è·¯äººä¸?, '?¿å??¼è?', 'ä¸æƒ³?–å?', '?¨ä¾¿?«å•¥',
  '?¨æˆ¶12345', 'idå·²éš±??, 'ç¥ç?äº?, 'è·¯äººä¸?, '?å®¢',
  'è·¯äºº??, 'è·¯äººå·?, 'è·¯äººåº?, 'è·¯äººè¾?, 'è·¯äººå£?
];

function getRandomAuthorName() {
  return AUTHOR_NAMES[Math.floor(Math.random() * AUTHOR_NAMES.length)];
}

async function loadGeneratedPosts() {
  const data = await getStorageItem(GENERATED_POSTS_KEY);
  return Array.isArray(data) ? data : [];
}

async function saveGeneratedPost(post) {
  const posts = await loadGeneratedPosts();
  posts.unshift(post);
  const maxPosts = 50;
  const trimmedPosts = posts.slice(0, maxPosts);
  await setStorageItem(GENERATED_POSTS_KEY, trimmedPosts);
}

async function initPostData() {
  const savedPosts = await loadGeneratedPosts();
  postData.recommend = [...savedPosts];
  postData.follow = [...savedPosts];
}

const worldSettings = [
  {
    title: 'ABO è¨­å?',
    desc: 'Alpha/Beta/Omega ä¸‰ç¨®ç¬¬ä??§åˆ¥ï¼ŒåŸº?¼ä¿¡?¯ç??‡ç??†æœ¬?½ç??ç?ç¤¾æ??‚å??«æ?è¨˜ã€ç™¼?…æ??æ?çµç?æ©Ÿåˆ¶??,
    tags: ['#ABO', '#ä¸–ç?è§€']
  },
  {
    title: '?¨å…µ?®å?',
    desc: '?Ÿå?æ¥µç«¯?éŠ³?„å“¨?µè?ç²¾ç??›é?å¼·å¤§?„åš®å°ã€‚å??«ç²¾ç¥é??ç²¾ç¥å??¯ã€ç??ˆç?è¨­å???,
    tags: ['#?¨å…µ?®å?', '#ä¸–ç?è§€']
  },
  {
    title: '?ˆåˆ©æ³¢ç‰¹',
    desc: '?±è??¨ç¾ä»?€«æ•¦ä¹‹ä??„é?æ³•ä??Œã€‚é??¼è¯?²å­¸?¢åˆ¶?é??–ã€è?çµ±æ­§è¦–è?é»‘é?æ³•é˜²ç¦¦ã€?,
    tags: ['#HP', '#é­”æ??¡å?']
  },
  {
    title: '?¥å?é«˜ä¸­?¡å?',
    desc: '?’æ˜¥?–æ˜§?„æ ¡?’ç?æ´»ã€‚å­¸?·å??¶åº¦?ç¤¾?˜æ´»?•ã€æ??–ç¥­?å??‚å??½ã€?,
    tags: ['#?¡å?', '#?’æ˜¥']
  },
  {
    title: 'ç¾å?å¤§å­¸?Ÿæ´»',
    desc: '?„å??ƒå?å¦¹æ??‡å??æ´¾å°ã€æ ¡?’é??•è³½äº‹ã€å®¿?ç?æ´»è??¨ç??¢ç´¢??,
    tags: ['#å¤§å­¸', '#ç¾å?']
  },
  {
    title: 'è¾¦å…¬å®¤è·??,
    desc: 'æ¬Šå?ç­‰ç??‡ç?æ­¢æ??›ç?è¾¦å…¬å®¤ã€‚ä?ä¸‹ç??œä??èŒ¶æ°´é??«å¦?å??­è?ç§˜å??€?…ã€?,
    tags: ['#?·å ´', '#è¾¦å…¬å®?]
  },
  {
    title: '?“å? Idol',
    desc: '?¯é??è‡º?Œå??„æ??·ã€‚ç·´ç¿’ç??¶åº¦?æ??›ç?ä»¤ã€å®¿?ç?æ´»è?ç§ç?é£¯å›°?¾ã€?,
    tags: ['#K-Pop', '#?¶å?']
  },
  {
    title: '?¾ä»£?–æ»¾æ¨‚å?',
    desc: '?›é€†è?å¤¢æƒ³?„éŸ³æ¨‚ä??Œã€‚åœ°ä¸‹Live House?å·¡è¿´æ?ç¨‹ã€æ??¡é??„ç?çµ†è??›ç›¾??,
    tags: ['#æ¨‚å?', '#?–æ»¾']
  },
  {
    title: 'æ­æ´²ä¸­ä?ç´€å®®å»·',
    desc: 'ç¹æ?ç¸Ÿç?ä¸‹ç?æ¬Šå?é¬¥çˆ­?‚è²´?ç?ç´šã€æ”¿æ²»è¯å§»ã€è??ƒå?è¬€?‡é?å£«ç²¾ç¥ã€?,
    tags: ['#ä¸­ä?ç´€', '#å®®å»·']
  },
  {
    title: '?ˆé?ä¼´ä¾¶è¨­å?',
    desc: 'æ¯å€‹äºº?ºç??‚å°±è¨»å??‰ä??‹å?ç¾ç??¦ä??Šã€‚è‰²?²æ¨¡å¼ã€æ?å­—æ?è¨˜ã€å‚·?•å…±äº«ã€å€’è??‚ç?è¡¨ç¾å½¢å???,
    tags: ['#Soulmate', '#å®¿å‘½']
  },
  {
    title: '?±å???,
    desc: '?®æ??‚è‚º?¨æ??Ÿé•·?ºèŠ±?µï??¨å’³?½å??ºèŠ±??€‚å”¯?‰å??¹ç??›èƒ½æ²»ç?ï¼Œæ??‹è?ç§»é™¤ä½†å¤±?»æ??ã€?,
    tags: ['#?±å???, '#?å?']
  },
  {
    title: 'è³½å?é¾å?',
    desc: 'é«˜ç??€ä½†è??—ç??ªä?ä¸–ç??‚ç¾©é«”æ”¹? ã€ç?ç¶“é€?¥?ä?æ¥­é?å±¤è?åº•å±¤?­å…µ?„é?ç´šå?ç«‹ã€?,
    tags: ['#è³½å?é¾å?', '#ç§‘å¹»']
  },
  {
    title: '?¡é?æµ?,
    desc: 'è¢«æ??¥ç?ç§˜å‰¯?¬ï?å¿…é??µå??¹å?è¦å??èƒ½?Ÿå??‚ç?å­˜å??›ä??„ä¿¡ä»»è?ä¾è³´??,
    tags: ['#?¡é?æµ?, '#?Ÿå?']
  },
  {
    title: '?’å³¶æ±‚ç?',
    desc: '?‡æ?æ¯€æ»…å??„ä??Œæ??—å›°?¡äºº?°å¸¶?‚ç‰©è³‡åŒ±ä¹ã€é?åº¦ä?è³´ã€åœ¨çµ•æ?ä¸­å»ºç«‹å?å°æ??’ã€?,
    tags: ['#?«ä?', '#æ±‚ç?']
  }
];

const interactionTropes = [
  {
    title: '?é€?,
    desc: 'å¤šå¹´å¾Œå?æ¬¡ç›¸?‡ï?å½¼æ­¤?½è?äº†å»?ˆæ?è®Šã€?,
    tags: ['#?é€?, '#?…æ?']
  },
  {
    title: 'èª¤æ?è§??',
    desc: 'ä¸€?´ä»¥ä¾†ç?èª¤æ?çµ‚æ–¼è§??ï¼Œä?ä¼¼ä?å¤ªé²äº†ã€?,
    tags: ['#èª¤æ?', '#?å?']
  },
  {
    title: '?¨ä¸­',
    desc: 'ä¸‹é›¨å¤©ç??¶é?ï¼Œæ”¹è®Šä??©å€‹äºº?„å‘½?‹ã€?,
    tags: ['#??, '#æµªæ¼«']
  },
  {
    title: '?Šç™½',
    desc: 'çµ‚æ–¼é¼“èµ·?‡æ°£èªªå‡ºå¿ƒæ???,
    tags: ['#?Šç™½', '#??]
  },
  {
    title: '?†é›¢',
    desc: 'ä¸å?ä¸å??‹ï?ä½†ç?å®šæ??è???,
    tags: ['#?†é›¢', '#ç´„å?']
  },
  {
    title: 'å®ˆè­·',
    desc: 'é»˜é?å®ˆè­·?¨èº«?Šï?ä¸æ??å ±??,
    tags: ['#å®ˆè­·', '#?—æ?']
  },
  {
    title: '?æ†¶',
    desc: '?æ†¶èµ·é??»ç?é»é?æ»´æ»´??,
    tags: ['#?æ†¶', '#?å»']
  },
  {
    title: 'å¥‘ç??œä?',
    desc: '? åˆ©?Šè¢«è¿«å??®æ?ä¾¶æ?å¤«å¦»?‚å?å±…ç?æ´»ã€å…¬?¾æ??ºï??¥ä??Ÿæ??„ç??œé?ç¨‹ã€?,
    tags: ['#?‡æˆ²?Ÿå?', '#å¥‘ç?']
  },
  {
    title: 'æ­»å???,
    desc: '?™æ–¹?•æ–¼å®Œå…¨å°ç??„ç??´ã€‚é??’ç›¸å°ç?å¼µå??è¢«è¿«å?ä½œæ??„ç³¾çµã€éš±?ç??¸å??›ã€?,
    tags: ['#å®¿æ•µ', '#å°ç?']
  },
  {
    title: '?®å?å¹³å‡¡?„æ€ªç‰©',
    desc: '?äººé¡ï?AI?å¸è¡€é¬¼ã€å??Ÿäºº?äººé­šï?è©¦å??†è§£äººé??…æ??‚è·¨?©ç¨®?„æ??šé?ç¤™è?ç¬¨æ?æº«æ???,
    tags: ['#?äººé¡?, '#è·¨ç‰©ç¨?]
  },
  {
    title: 'èº«é?äº’æ?',
    desc: '? æ?å¤–æ?è©›å?äº¤æ??ˆé?/èº«é??‚å??ˆä»£?¿å??¹ç?æ´»ï??¼ç¾?±è??„ç?å¯†è??·ç???,
    tags: ['#èº«é?äº’æ?', '#?ˆé?']
  },
  {
    title: '?ªæ?ä¸€å¼µå?',
    desc: '?…å?å®¢æ»¿?–å??°é¿???ï¼Œåª?©ä??‹æˆ¿?“ä?å¼µå??‚èª°?¡åœ°?¿ï??„æ˜¯? åœ¨ä¸€èµ·ï??Œå??Œç??µç¡¬?°å?å¤œç¿»èº«å…¥?·ã€?,
    tags: ['#è¢«è¿«è¿‘è???, '#ä¸€å¼µå?']
  },
  {
    title: '?¹å?ç©ºé??—å›°',
    desc: '?»æ¢¯?…é??èº²?¿æ•µäººç?è¡???ç‹¹çª„å··å¼„ã€‚å??ˆç?è²¼å??¹ï??Ÿå??¼å¸?å?è·³è?é«”æº«??,
    tags: ['#è¢«è¿«è¿‘è???, '#å¯†é?ç©ºé?']
  },
  {
    title: '?–æ?',
    desc: '?´é¢¨?ªå??°ã€æ??¥å†°?·æ?æ°´ã€‚ç‚ºäº†ç?å­˜å??ˆç??å‚³?é?æº«ï?å¾ç?å­˜æœ¬?½è??–ç‚º?§å¼µ?›ã€?,
    tags: ['#è¢«è¿«è¿‘è???, '#?Ÿå?']
  },
  {
    title: 'èª°å??·ä???,
    desc: 'ä¸€?¹å??·å?ä¾†ï??¦ä??¹é?å¹³æ??·æ·¡ï¼Œç??°å‚·??¬?“æš´?’æ?æ¥µåº¦å¿ƒç–¼?‚å?ç´®å‚·???ç´°è†©?‡ä??‰æ¬²??,
    tags: ['#?§é¡§', '#ä¿è­·æ¬?]
  },
  {
    title: '?…å¼±?§é¡§',
    desc: '?¼é??’ã€æ?è­˜æ¨¡ç³Šï?å¹³æ?å¼·å‹¢?„è??²è?å¾—å?å°å­©ä¸€æ¨??è³´ã€‚é¤µ?¥ã€æ“¦æ±—ã€å?å¤¢å??’é??„ç??…æ??²ã€?,
    tags: ['#?§é¡§', '#?†å¼±']
  },
  {
    title: '?©å¤¢?‡å???,
    desc: 'æ·±å?? å‰µ?·é??’ã€‚å¦ä¸€?¹çµ¦äºˆæ??±ã€æ‘¸?­ã€è??²å??°ï?å±•ç¾?ªçµ¦å°æ–¹?„æ?è»Ÿé¢??,
    tags: ['#?§é¡§', '#å®‰æ’«']
  },
  {
    title: '?’å??ç?è¨€',
    desc: 'å¾®é†º?–å¤§?‰ã€‚å¹³?‚ä??¢èªª?„è©±?ä??¢å??„è¦ª?±è??ºå…¨?½ç??¼ã€‚é?å¤©é?ä¾†å??„å°·å°¬æ???,
    tags: ['#å¤±æ§', '#?Šç™½']
  },
  {
    title: '?Ÿè???è©›å?',
    desc: 'è¢«è¿«å¿…é?èªªç?è©±ï??–å??ˆé€²è?è¦ªå??‰å??èƒ½è§?™¤?„è??’ã€‚æ‹¼?½å??ä??€çµ‚å¤±?—ç??™æ??Ÿã€?,
    tags: ['#å¤±æ§', '#é­”æ?']
  },
  {
    title: '??€‹ã€Œå™¢?ç??‚åˆ»',
    desc: 'å¥½å??–æ­»å°é ­?¨æ??‹å¹³?¡ç¬?“ï?å¦‚é™½?‰ä??é ­ä¸€ç¬‘ï?ï¼Œç??¶æ?è­˜åˆ°ï¼šã€Œç?äº†ï??‘æ?ä¸Šä?äº†ã€‚ã€?,
    tags: ['#å¤±æ§', '#è¦ºé?']
  },
  {
    title: '?‹æ??‹æ?å­?,
    desc: '?™å?ç®­ã€é‹¼?´ã€æ??ƒã€å¯«å­—ã€‚å??Œå??°ç??„å§¿?¢ï??‹æ?è¦†è??¨æ??Œä?ï¼Œè€³é??„ä??²æ?å°ã€?,
    tags: ['#?¢é?å¼µå?', '#?™å­¸']
  },
  {
    title: '?´ç?è¡?‰©',
    desc: '?ºå¸­æ­???´å??ï?å¹«å??¹æ??˜å¸¶?ç¿»?˜å??æ’¥?‹é??ç?é«®ã€‚æ¥µè¿‘è??¢ç??¼ç?äº¤ç?ï¼Œå‘¼?¸äº¤?¯ã€?,
    tags: ['#?¢é?å¼µå?', '#è¦ªå?']
  },
  {
    title: 'èº«é?å·?é«”å?å·?,
    desc: '?¿ä??°é??•æ±è¥¿ã€è¡£?å¤ª?å¯¬å¤§ã€‚é??„ä??¹å?å¾Œæ–¹å¹«å??¿æ±è¥¿ï??–ä??¹ç©¿?—å¦ä¸€?¹å¯¬å¤§ç?è¥¯è¡«??,
    tags: ['#?¢é?å¼µå?', '#é«”å?å·?]
  },
  {
    title: '?™å??—æ?',
    desc: '?©å€‹äºº?½è¦ºå¾—å??¹ä??œæ­¡?ªå·±ï¼Œéƒ½?¨ç??‚è©¦?¢ã€‚åˆ»?é¿?‹ç??¼ç??å?ä»–äºº?¥è??„å¾®å°å?å¦’ã€?,
    tags: ['#?—æ½®æ´¶æ¹§', '#?—æ?']
  },
  {
    title: 'ç§˜å??Ÿå?',
    desc: '?¾äºº?¢å?è£ä?ä¸ç??–æ•µå°ï?ç§å?ä¸‹å»?‰æ·±?šè¯ç¹«ã€‚æ?å­å?ä¸‹ç??¾è…³?åª?‰å…©äººæ??„æ??Ÿã€?,
    tags: ['#?—æ½®æ´¶æ¹§', '#ç§˜å?']
  }
];

const ideaData = interactionTropes;

const escapeHTML = (str = '') => str
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

function toggleCollapsible(headerEl) {
  const card = headerEl.closest('.collapsible-card');
  if (!card) return;
  const content = card.querySelector('.collapsible-content');
  const icon = headerEl.querySelector('.collapsible-icon i');
  if (!content) return;
  
  const isCollapsed = content.classList.contains('collapsed');
  content.classList.toggle('collapsed', !isCollapsed);
  if (icon) {
    icon.classList.toggle('fa-chevron-down', isCollapsed);
    icon.classList.toggle('fa-chevron-up', !isCollapsed);
  }
}

window.toggleCollapsible = toggleCollapsible;

async function getStorageItem(key) {
  if (typeof localforage !== 'undefined') {
    try {
      const value = await localforage.getItem(key);
      if (value !== null) return value;
    } catch (e) {
      console.warn('[Lofter] localforage è®€?–å¤±?—ï?ä½¿ç”¨ localStorage:', e);
    }
  }
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function setStorageItem(key, value) {
  if (typeof localforage !== 'undefined') {
    try {
      await localforage.setItem(key, value);
    } catch (e) {
      console.warn('[Lofter] localforage å¯«å…¥å¤±æ?:', e);
    }
  }
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('[Lofter] localStorage å¯«å…¥å¤±æ?:', e);
  }
}

let bookmarksCache = null;

async function getBookmarks() {
  if (bookmarksCache !== null) return bookmarksCache;
  const data = await getStorageItem(BOOKMARKS_KEY);
  bookmarksCache = Array.isArray(data) ? data : [];
  return bookmarksCache;
}

async function saveBookmarks(bookmarks) {
  bookmarksCache = bookmarks;
  await setStorageItem(BOOKMARKS_KEY, bookmarks);
}

async function isPostBookmarked(postId) {
  const bookmarks = await getBookmarks();
  return bookmarks.some(b => b.id === postId);
}

async function toggleBookmark(post) {
  const bookmarks = await getBookmarks();
  const postId = post.id || `${post.title}-${post.author}-${post.time}`;
  const existingIndex = bookmarks.findIndex(b => b.id === postId);
  
  if (existingIndex >= 0) {
    bookmarks.splice(existingIndex, 1);
    await saveBookmarks(bookmarks);
    return false;
  } else {
    bookmarks.unshift({
      id: postId,
      ...post,
      bookmarkedAt: Date.now()
    });
    await saveBookmarks(bookmarks);
    return true;
  }
}

function generatePostId(post, index) {
  return post.id || `lofter-${post.title}-${post.author}-${index}-${Date.now()}`;
}

async function renderFeed() {
  if (!feedEl || currentPage !== 'home') return;

  const list = postData[currentTab] || [];
  feedEl.classList.toggle('waterfall', currentView === 'waterfall');

  if (list.length === 0) {
    feedEl.innerHTML = '';
    return;
  }

  const bookmarks = await getBookmarks();
  const bookmarkIds = new Set(bookmarks.map(b => b.id));
  const followList = loadListFromStorage(FOLLOW_POST_KEY);
  const followSet = new Set(followList.map(item => `${item.title}-${item.author}`));

  feedEl.innerHTML = list.map((post, index) => {
    const postId = generatePostId(post, index);
    if (!post.id) post.id = postId;
    const isBookmarked = bookmarkIds.has(postId);
    const isFollowed = followSet.has(`${post.title}-${post.author}`);
    return `
    <article class="post-card post-card-compact" data-index="${index}" data-post-id="${escapeHTML(postId)}">
      <div class="post-card-header" onclick="togglePostExpand(this)">
        <h2 class="post-title">${escapeHTML(post.title)}</h2>
        <p class="post-summary">${escapeHTML(post.summary || post.excerpt?.slice(0, 80) || post.text?.slice(0, 80))}${(post.summary || post.excerpt || post.text)?.length > 80 ? '...' : ''}</p>
        <div class="post-card-meta">
          <span class="post-author">${escapeHTML(post.author)}</span>
          <span class="post-time">${escapeHTML(post.time)}</span>
          <i class="fas fa-chevron-down post-expand-icon"></i>
        </div>
      </div>
      <div class="post-card-content">
        <header class="post-head">
          <div class="avatar" aria-hidden="true"></div>
          <div>
            <div class="author">${escapeHTML(post.author)}</div>
            <div class="meta">${escapeHTML(post.category)} Â· ${escapeHTML(post.time)}</div>
          </div>
          <button class="more-btn" type="button" aria-label="?´å??¸é?"><i class="fas fa-ellipsis"></i></button>
        </header>
        <div class="post-full-content">${escapeHTML(post.fullContent || post.excerpt || post.text)}</div>
        <div class="post-tags">${post.tags.map(tag => `<span class="post-tag">${escapeHTML(tag)}</span>`).join('')}</div>
        <footer class="post-actions">
          <button class="action like-action" type="button">
            <i class="far fa-heart"></i><span>${post.likes}</span>
          </button>
          <button class="action" type="button"><i class="far fa-comment"></i><span>${post.comments}</span></button>
          <button class="action follow-action ${isFollowed ? 'is-followed' : ''}" type="button"><i class="${isFollowed ? 'fas' : 'far'} fa-star"></i><span>${isFollowed ? 'å·²è¿½è¹? : 'è¿½è¹¤'}</span></button>
          <button class="action bookmark-action ${isBookmarked ? 'bookmarked' : ''}" type="button"><i class="${isBookmarked ? 'fas' : 'far'} fa-bookmark"></i></button>
        </footer>
      </div>
    </article>
  `}).join('');
}

function togglePostExpand(headerEl) {
  const card = headerEl.closest('.post-card');
  if (!card) return;
  card.classList.toggle('is-expanded');
}

window.togglePostExpand = togglePostExpand;

function buildPostHTML(post, index) {
  const followLabel = post.isFollowed ? 'å·²è¿½è¹? : 'è¿½è¹¤';
  return `
    <article class="post-card post-card-compact" data-index="${index}">
      <div class="post-card-header" onclick="togglePostExpand(this)">
        <h2 class="post-title">${escapeHTML(post.title)}</h2>
        <p class="post-summary">${escapeHTML(post.summary || post.excerpt?.slice(0, 80) || post.text?.slice(0, 80))}${(post.summary || post.excerpt || post.text)?.length > 80 ? '...' : ''}</p>
        <div class="post-card-meta">
          <span class="post-author">${escapeHTML(post.author)}</span>
          <span class="post-time">${escapeHTML(post.time)}</span>
          <i class="fas fa-chevron-down post-expand-icon"></i>
        </div>
      </div>
      <div class="post-card-content">
        <header class="post-head">
          <div class="avatar" aria-hidden="true"></div>
          <div>
            <div class="author">${escapeHTML(post.author)}</div>
            <div class="meta">${escapeHTML(post.category)} Â· ${escapeHTML(post.time)}</div>
          </div>
          <button class="more-btn" type="button" aria-label="?´å??¸é?"><i class="fas fa-ellipsis"></i></button>
        </header>
        <div class="post-full-content">${escapeHTML(post.fullContent || post.excerpt || post.text)}</div>
        <div class="post-tags">${post.tags.map(tag => `<span class="post-tag">${escapeHTML(tag)}</span>`).join('')}</div>
        <footer class="post-actions">
          <button class="action like-action" type="button">
            <i class="far fa-heart"></i><span>${post.likes}</span>
          </button>
          <button class="action" type="button"><i class="far fa-comment"></i><span>${post.comments}</span></button>
          <button class="action follow-action" type="button"><i class="far fa-star"></i><span>${followLabel}</span></button>
          <button class="action" type="button"><i class="fas fa-share-nodes"></i><span>${post.shares}</span></button>
        </footer>
      </div>
    </article>
  `;
}

function renderRandomCpFeed() {
  if (!feedEl) return;
}

function updatePageView() {
  pageSections.forEach(section => {
    section.classList.toggle('is-active', section.dataset.page === currentPage);
  });

  navItems.forEach(item => {
    const active = item.dataset.page === currentPage;
    item.classList.toggle('active', active);
  });

  const showFeed = currentPage === 'home';
  document.querySelector('.tab-strip')?.classList.toggle('is-hidden', !showFeed);
  viewToggleBtn?.classList.toggle('is-hidden', !showFeed);
}

function updateViewToggleUI() {
  if (!viewToggleBtn) return;

  if (currentView === 'waterfall') {
    viewToggleBtn.dataset.view = 'waterfall';
    viewToggleBtn.classList.add('is-waterfall');
    viewToggleBtn.setAttribute('aria-pressed', 'true');
    viewToggleBtn.innerHTML = '<i class="fas fa-list"></i><span>?—è¡¨æµ?/span>';
  } else {
    viewToggleBtn.dataset.view = 'list';
    viewToggleBtn.classList.remove('is-waterfall');
    viewToggleBtn.setAttribute('aria-pressed', 'false');
    viewToggleBtn.innerHTML = '<i class="fas fa-grip"></i><span>?‘å?æµ?/span>';
  }
}

function bindTabs() {
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (currentPage !== 'home') return;
      currentTab = btn.dataset.tab || 'recommend';
      tabButtons.forEach(node => {
        const active = node === btn;
        node.classList.toggle('active', active);
        node.setAttribute('aria-selected', String(active));
      });
      renderFeed();
    });
  });
}

function bindViewToggle() {
  viewToggleBtn?.addEventListener('click', () => {
    if (currentPage !== 'home') return;
    currentView = currentView === 'list' ? 'waterfall' : 'list';
    updateViewToggleUI();
    feedEl?.classList.toggle('waterfall', currentView === 'waterfall');
  });
}

function bindFeedEvents() {
  feedEl?.addEventListener('click', async (event) => {
    if (currentPage !== 'home') return;
    
    const likeBtn = event.target.closest('.like-action');
    if (likeBtn) {
      const countEl = likeBtn.querySelector('span');
      const iconEl = likeBtn.querySelector('i');
      const liked = likeBtn.classList.toggle('liked');
      const count = Number.parseInt(countEl?.textContent || '0', 10);

      if (countEl) countEl.textContent = String(liked ? count + 1 : Math.max(0, count - 1));
      if (iconEl) {
        iconEl.classList.toggle('far', !liked);
        iconEl.classList.toggle('fas', liked);
      }
      return;
    }
    
    const bookmarkBtn = event.target.closest('.bookmark-action');
    if (bookmarkBtn) {
      const card = event.target.closest('.post-card');
      const index = parseInt(card?.dataset?.index, 10);
      const postId = card?.dataset?.postId;
      
      if (!Number.isNaN(index) && postData[currentTab] && postData[currentTab][index]) {
        const post = postData[currentTab][index];
        const isBookmarked = await toggleBookmark(post);
        
        const iconEl = bookmarkBtn.querySelector('i');
        bookmarkBtn.classList.toggle('bookmarked', isBookmarked);
        if (iconEl) {
          iconEl.classList.toggle('far', !isBookmarked);
          iconEl.classList.toggle('fas', isBookmarked);
        }
      }
      return;
    }
  });
}

function bindFollowEvents(container) {
  container?.addEventListener('click', (event) => {
    const followBtn = event.target.closest('.follow-action');
    if (!followBtn) return;
    const card = event.target.closest('.post-card');
    if (!card) return;
    
    const title = card.querySelector('.post-title')?.textContent || '?ªå‘½?æ?ç«?;
    const author = card.querySelector('.author')?.textContent || '?¿å?ä½œè€?;
    const fullContent = card.querySelector('.post-full-content')?.textContent || '';
    const category = card.querySelector('.meta')?.textContent?.split('Â·')[0]?.trim() || '?Œäºº??;
    
    const list = loadListFromStorage(FOLLOW_POST_KEY);
    const exists = list.find(item => item.title === title && item.author === author);
    
    if (exists) {
      // å·²è¿½è¹¤ï??–æ?è¿½è¹¤
      const index = list.findIndex(item => item.title === title && item.author === author);
      if (index >= 0) {
        list.splice(index, 1);
        localStorage.setItem(FOLLOW_POST_KEY, JSON.stringify(list));
        followBtn.classList.remove('is-followed');
        followBtn.querySelector('i').className = 'far fa-star';
        followBtn.querySelector('span').textContent = 'è¿½è¹¤';
      }
    } else {
      // ?°å?è¿½è¹¤
      list.unshift({ 
        title, 
        author, 
        time: '?›å?', 
        status: '???ä¸?,
        fullContent,
        category
      });
      localStorage.setItem(FOLLOW_POST_KEY, JSON.stringify(list));
      followBtn.classList.add('is-followed');
      followBtn.querySelector('i').className = 'fas fa-star';
      followBtn.querySelector('span').textContent = 'å·²è¿½è¹?;
    }
    
    renderFollowFeed();
  });
}

async function callAIAPI(payload) {
  const apis = JSON.parse(localStorage.getItem('api_configs') || '[]');
  const activeIndex = parseInt(localStorage.getItem('sx_active_api') || '0', 10);
  const config = apis[activeIndex] || apis[0];
  if (!config || !config.url) {
    throw new Error('?ªè¨­å®?APIï¼Œè??³è¨­å®šé??¢é?ç½?);
  }
  
  const apiType = config.type || 'openai';
  
  // Gemini ?Ÿç? API ?¼å?
  if (apiType === 'gemini') {
    const model = config.model || 'gemini-1.5-flash';
    const targetUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + config.key;
    
    console.log('[Lofter] èª¿ç”¨ Gemini API, æ¨¡å?:', model);
    
    const contents = [];
    let systemInstruction = '';
    
    for (const msg of payload) {
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
      generationConfig: { temperature: 0.85, maxOutputTokens: 4000 }
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
      const errorText = await response.text();
      throw new Error('Gemini API ?¯èª¤: ' + response.status + ' - ' + errorText);
    }
    
    const data = await response.json();
    if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
  
  // OpenAI ?¸å®¹?¼å??–è‡ªè¨‚ç«¯é»?  let targetUrl;
  if (apiType === 'custom') {
    targetUrl = config.url;
  } else {
    targetUrl = config.url.endsWith('/chat/completions') ? config.url : config.url.replace(/\/$/, '') + '/chat/completions';
  }
  
  console.log('[Lofter] èª¿ç”¨ API:', targetUrl);
  console.log('[Lofter] Payload:', JSON.stringify(payload, null, 2));
  
  const fetchWithTimeout = (url, options, timeoutMs) => {
    return new Promise((resolve, reject) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        reject(new Error(`è«‹æ??¾æ? (${timeoutMs / 1000}ç§?`));
      }, timeoutMs);

      fetch(url, { ...options, signal: controller.signal })
        .then(response => {
          clearTimeout(timeoutId);
          resolve(response);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  };

  const maxRetries = 3;
  let retryCount = 0;
  let lastError = null;

  while (retryCount < maxRetries) {
    try {
      const timeoutMs = 120000 + (retryCount * 60000);
      console.log(`[Lofter] ?—è©¦?Ÿæ? (ç¬?${retryCount + 1} æ¬?ï¼Œé€¾æ?: ${timeoutMs / 1000}ç§’`);

      const response = await fetchWithTimeout(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': config.key ? `Bearer ${config.key}` : undefined
        },
        body: JSON.stringify({ 
          model: config.model || 'gpt-3.5-turbo', 
          messages: payload, 
          temperature: 0.85,
          max_tokens: 4000
        })
      }, timeoutMs);
      
      if (!response.ok) {
        let errorDetail = '';
        try {
          const errorJson = await response.json();
          errorDetail = JSON.stringify(errorJson, null, 2);
        } catch {
          try {
            errorDetail = await response.text();
          } catch {
            errorDetail = '?¡æ?è®€?–éŒ¯èª¤å…§å®?;
          }
        }
        const errorMsg = `API è«‹æ?å¤±æ?
?€?‹ç¢¼: ${response.status} ${response.statusText}
URL: ${targetUrl}
?¯èª¤è©³æ?: ${errorDetail}`;
        console.error('[Lofter] API ?¯èª¤:', errorMsg);
        throw new Error(errorMsg);
      }
      
      const data = await response.json();
      if (data.error) {
        const errorMsg = `API ?å‚³?¯éŒ¯èª??¯èª¤é¡å?: ${data.error.type || '?ªçŸ¥'}
?¯èª¤è¨Šæ¯: ${data.error.message || JSON.stringify(data.error)}`;
        console.error('[Lofter] API ?å‚³?¯èª¤:', errorMsg);
        throw new Error(errorMsg);
      }
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        const errorMsg = `API ?æ??¼å??¯èª¤
?æ??§å®¹: ${JSON.stringify(data, null, 2)}`;
        console.error('[Lofter] API ?æ??¼å??¯èª¤:', errorMsg);
        throw new Error(errorMsg);
      }
      
      console.log('[Lofter] ?Ÿæ??å?');
      return data.choices[0].message.content;

    } catch (err) {
      lastError = err;
      retryCount++;
      console.warn(`[Lofter] ç¬?${retryCount} æ¬¡å?è©¦å¤±??`, err.message);
      
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        const errorMsg = `ç¶²è·¯è«‹æ?å¤±æ?
?¯èª¤é¡å?: ç¶²è·¯?¯èª¤
URL: ${targetUrl}
?¯èƒ½?Ÿå?: 
1. API URL ä¸æ­£ç¢?2. CORS è·¨å??é?
3. ç¶²è·¯????°å¸¸
4. API ä¼ºæ??¨ç„¡?æ?
?Ÿå??¯èª¤: ${err.message}`;
        console.error('[Lofter] ç¶²è·¯?¯èª¤:', errorMsg);
      }
      
      if (retryCount < maxRetries) {
        console.log(`[Lofter] ç­‰å? 2 ç§’å??è©¦...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  throw new Error(`${lastError?.message || '?ªçŸ¥?¯èª¤'}ï¼ˆå·²?—è©¦ ${maxRetries} æ¬¡ï?`);
}

function getWorldbookData() {
  const selectedIds = getSelectedWorldbookIds();
  const selectedSet = new Set(selectedIds);
  
  const categories = ['cot', 'style', 'global', 'keywords', 'backend'];
  const result = {};
  
  categories.forEach(cat => {
    const key = `sx_worldbook_${cat}`;
    const raw = localStorage.getItem(key);
    if (!raw) return;
    try {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        const filteredList = list.filter(item => {
          const id = `${cat}-${item.title}`;
          return selectedSet.size === 0 || selectedSet.has(id);
        });
        if (filteredList.length > 0) {
          result[cat] = filteredList;
        }
      }
    } catch (e) {}
  });
  return result;
}

function getWorldbookDataForPrompt() {
  const worldbook = getWorldbookData();
  const result = {};
  
  for (const [cat, entries] of Object.entries(worldbook)) {
    if (entries && entries.length > 0) {
      result[cat] = entries.map(e => ({
        title: e.title,
        content: e.content
      }));
    }
  }
  
  return result;
}

function getCotDataForPrompt() {
  const key = 'sx_worldbook_cot';
  const raw = localStorage.getItem(key);
  if (!raw) return '';
  
  try {
    const list = JSON.parse(raw);
    if (!Array.isArray(list) || list.length === 0) return '';
    
    let cotContent = '\n# ?è€ƒå??ƒï?ä»¥ä??§å®¹?…ä?ä½ æ€è€ƒå??ƒï??´ç??¨æ?ç« ä¸­?å??–å??¨ï?\n';
    list.slice(0, 5).forEach(item => {
      if (item && item.content) {
        cotContent += `${item.content.slice(0, 500)}\n`;
      }
    });
    cotContent += '\n**?è??é?ï¼šä»¥ä¸Šæ€è€ƒå…§å®¹å?ä¾›ä??†è§£?µä??¹å?ï¼Œç?å°ä??¯åœ¨?‡ç?ä¸­å‡º?¾ä»»ä½•ç›¸?œå…§å®¹æ??å???*\n';
    
    return cotContent;
  } catch (e) {
    return '';
  }
}

function getCharacterData(name) {
  const raw = localStorage.getItem('sx_characters');
  if (!raw) {
    const charName = localStorage.getItem('sx_char_name');
    if (name === charName || !name) {
      return {
        name: charName || 'AI ?©ç?',
        personality: localStorage.getItem('sx_char_personality') || '',
        background: localStorage.getItem('sx_char_background') || '',
        avatar: localStorage.getItem('sx_char_avatar') || ''
      };
    }
    return null;
  }
  try {
    const list = JSON.parse(raw);
    const found = list.find(c => c.name === name);
    if (found) return found;
    
    const charName = localStorage.getItem('sx_char_name');
    if (name === charName || !name) {
      return {
        name: charName || 'AI ?©ç?',
        personality: localStorage.getItem('sx_char_personality') || '',
        background: localStorage.getItem('sx_char_background') || '',
        avatar: localStorage.getItem('sx_char_avatar') || ''
      };
    }
    return null;
  } catch {
    return null;
  }
}

function getUserData() {
  return {
    name: localStorage.getItem('sx_user_name') || 'User',
    personality: localStorage.getItem('sx_user_personality') || '',
    background: localStorage.getItem('sx_user_background') || ''
  };
}

function getChatHistory(limit = 20) {
  const raw = localStorage.getItem('sx_chat_history');
  if (!raw) return [];
  try {
    const history = JSON.parse(raw);
    return history.slice(-limit);
  } catch {
    return [];
  }
}

function buildFanficPrompt(cp, worldSettings, interactions, npcs, style, styleRef, isR18, topBodytype, bottomBodytype, bodytypeNote, topGender, bottomGender) {
  const [topName, bottomName] = cp.split(' ? ');
  const topChar = getCharacterData(topName);
  const bottomChar = getCharacterData(bottomName);
  const user = getUserData();
  const worldbook = getWorldbookDataForPrompt();
  const cotContent = getCotDataForPrompt();
  const chatHistory = getChatHistory(20);
  
  const memoryRaw = localStorage.getItem('sx_memory_tables') || localStorage.getItem('sx_chat_memory');
  let memoryContext = '';
  if (memoryRaw) {
    try {
      const memory = JSON.parse(memoryRaw);
      if (Array.isArray(memory) && memory.length > 0) {
        memoryContext = '\n# è¨˜æ†¶?˜è?\n';
        memory.slice(0, 5).forEach(m => {
          if (m.summary || m.content) {
            memoryContext += `- ${m.summary || m.content}\n`;
          }
        });
      }
    } catch (e) {}
  }

  let worldbookContext = '';
  if (Object.keys(worldbook).length > 0) {
    worldbookContext = '\n# ?ƒè€ƒè??™ï??…ä??µä??ƒè€ƒï?è«‹å‹¿?¨æ?ç« ä¸­?´æ¥å¼•ç”¨?–æ??Šé€™ä??§å®¹ï¼‰\n';
    for (const [cat, entries] of Object.entries(worldbook)) {
      if (entries && entries.length > 0) {
        entries.slice(0, 8).forEach(e => {
          if (e.title && e.content) {
            worldbookContext += `- ${e.content.slice(0, 300)}\n`;
          }
        });
      }
    }
    worldbookContext += '\næ³¨æ?ï¼šä»¥ä¸Šè??™å?ä¾›ä??†è§£è§’è‰²?‡ä??Œè?ï¼Œè?å°‡å…¶?ªç„¶?å…¥?…ä?ä¸­ï?ä¸è??¨æ?ç« ä¸­?å??Œä??Œæ›¸?ã€ã€Œè¨­å®šã€ç?è©å??‚\n';
  }

  let characterContext = '\n# è§’è‰²è¨­å?\n';
  if (topChar) {
    characterContext += `\n## ${topName}ï¼ˆæ”»?¹ï?\n- ?§åˆ¥: ${topGender || '?ªæ?å®?}\n- ?§æ ¼: ${topChar.personality || '?ªçŸ¥'}\n- ?Œæ™¯: ${topChar.background || '?ªçŸ¥'}\n`;
    if (topChar.worldBook) {
      characterContext += `- ä¸–ç??¸å??? ${topChar.worldBook}\n`;
    }
  } else {
    characterContext += `\n## ${topName}ï¼ˆæ”»?¹ï?\n- ?§åˆ¥: ${topGender || '?ªæ?å®?}\n- è«‹æ ¹?šè??²å?ç¨±æ¨æ¸¬æ€§æ ¼?‡è??¯\n`;
  }
  if (bottomChar) {
    characterContext += `\n## ${bottomName}ï¼ˆå??¹ï?\n- ?§åˆ¥: ${bottomGender || '?ªæ?å®?}\n- ?§æ ¼: ${bottomChar.personality || '?ªçŸ¥'}\n- ?Œæ™¯: ${bottomChar.background || '?ªçŸ¥'}\n`;
    if (bottomChar.worldBook) {
      characterContext += `- ä¸–ç??¸å??? ${bottomChar.worldBook}\n`;
    }
  } else {
    characterContext += `\n## ${bottomName}ï¼ˆå??¹ï?\n- ?§åˆ¥: ${bottomGender || '?ªæ?å®?}\n- è«‹æ ¹?šè??²å?ç¨±æ¨æ¸¬æ€§æ ¼?‡è??¯\n`;
  }

  let bodytypeContext = '';
  const hasBodytypeSetting = topBodytype || bottomBodytype || bodytypeNote || topGender || bottomGender;
  
  if (hasBodytypeSetting) {
    bodytypeContext = '\n# è§’è‰²é«”å??‡æ€§åˆ¥è¨­å?ï¼ˆé?è¦ï?\n';
    bodytypeContext += '- ?è¨­è§’è‰²é«”å??ºå‹»ç¨±æ??‰ï?ä¸æ˜¯éª¨æ??–é??¦ç?èº«æ?\n';
    bodytypeContext += '- è«‹æ ¹?šä»¥ä¸‹è¨­å®šæ?å¯«è??²é??‹ï?ä¸è?å°‡è??²é?åº¦ç˜¦?–æ?å¼±å?\n';
    bodytypeContext += '- è«‹åš´?¼éµå®ˆè??²æ€§åˆ¥è¨­å?ï¼Œé¿?æ··æ·†ç”·å¥³æ€§è??²\n\n';
    
    if (topGender) {
      bodytypeContext += `- ${topName}ï¼ˆæ”»?¹ï??§åˆ¥: ${topGender}\n`;
    }
    
    if (topBodytype) {
      bodytypeContext += `- ${topName}ï¼ˆæ”»?¹ï?é«”å?: ${topBodytype}\n`;
      if (topBodytype.includes('éª¨æ?') || topBodytype.includes('?¦å?')) {
        bodytypeContext += `  - æ³¨æ?ï¼šæ­¤?ºè??¦é??‹ï?ä½†ä??€ä¿æ??¥åº·?Ÿï??¿å??åº¦?…æ??å¯«\n`;
      }
      if (topBodytype === '?“æ½¤?”è?') {
        bodytypeContext += `  - ?“æ½¤?”è?é«”å??¹å¾µï¼šç?ä¸åˆ°?–éª¨?æ??‰è…°çª©ã€æ??‹è??‰ã€è?å­è??å??¹\n`;
      }
    } else {
      bodytypeContext += `- ${topName}ï¼ˆæ”»?¹ï?é«”å?: ?»ç¨±?‰è?ï¼ˆé?èªï?\n`;
    }
    
    if (bottomGender) {
      bodytypeContext += `- ${bottomName}ï¼ˆå??¹ï??§åˆ¥: ${bottomGender}\n`;
    }
    
    if (bottomBodytype) {
      bodytypeContext += `- ${bottomName}ï¼ˆå??¹ï?é«”å?: ${bottomBodytype}\n`;
      if (bottomBodytype.includes('éª¨æ?') || bottomBodytype.includes('?¦å?')) {
        bodytypeContext += `  - æ³¨æ?ï¼šæ­¤?ºè??¦é??‹ï?ä½†ä??€ä¿æ??¥åº·?Ÿï??¿å??åº¦?…æ??å¯«\n`;
      }
      if (bottomBodytype === '?“æ½¤?”è?') {
        bodytypeContext += `  - ?“æ½¤?”è?é«”å??¹å¾µï¼šç?ä¸åˆ°?–éª¨?æ??‰è…°çª©ã€æ??‹è??‰ã€è?å­è??å??¹\n`;
      }
    } else {
      bodytypeContext += `- ${bottomName}ï¼ˆå??¹ï?é«”å?: ?»ç¨±?‰è?ï¼ˆé?èªï?\n`;
    }
    
    if (bodytypeNote) {
      bodytypeContext += `- é«”å??™è¨»: ${bodytypeNote}\n`;
    }
    bodytypeContext += '\nè«‹åš´?¼éµå®ˆä»¥ä¸Šé??‹è??§åˆ¥è¨­å??²è??å¯«?‚\n';
  } else {
    bodytypeContext = '\n# è§’è‰²é«”å??‡æ€§åˆ¥è¨­å?ï¼ˆé?è¦ï?\n';
    bodytypeContext += '- ?©ä?è§’è‰²?†ç‚º?»ç¨±?‰è??„æ­£å¸¸é??‹ï?ä¸æ˜¯éª¨æ??–é??¦ç?èº«æ?\n';
    bodytypeContext += '- è«‹å‹¿å°‡è??²æ?å¯«æ??æ–¼éª¨æ??ç˜¦å¼±æ?å¼±å?ä»»ä?ä¸€?¹\n';
    bodytypeContext += '- å¥³æ€§è??²æ??‰è‡ª?¶ç??²ç??‡è??Ÿï?ä¸æ˜¯ç´™ç?äººèº«?\n';
    bodytypeContext += '- ?·æ€§è??²æ??‰é©åº¦ç??Œè??‡é??¼ï?ä¸æ˜¯?åº¦?¦å¼±?„èº«?\n';
    bodytypeContext += '- è«‹æ ¹?šè??²å?ç¨±åˆ¤?·æ€§åˆ¥ï¼Œä¸¦?¨æ?å¯«æ?ä¿æ?ä¸€?´\n';
  }

  let npcContext = '';
  if (npcs && npcs.length > 0) {
    npcContext = '\n# NPC è§’è‰²\n';
    npcs.forEach(npc => {
      npcContext += `\n## ${npc.name}\n- ??User ?„é?ä¿? ${npc.relationship || 'å¥½å?'}\n- äº’å??§è³ª: ?‹æ??‘ï?ä¸æ??Šæ??…æ??–æ˜§\n`;
    });
  }

  let historyContext = '';
  if (chatHistory.length > 0) {
    historyContext = '\n# è¿‘æ?å°è©±ç´€?„ï??¯ä??ºä??•å??ƒï?\n';
    chatHistory.forEach(msg => {
      const role = msg.role === 'user' ? user.name : (msg.role === 'assistant' ? 'è§’è‰²' : msg.role);
      historyContext += `${role}: ${msg.content.slice(0, 150)}\n`;
    });
  }

  let worldSettingList = '';
  if (worldSettings && worldSettings.length > 0) {
    worldSettingList = '\n# ä¸–ç?è§€è¨­å?\n' + worldSettings.map(s => `- ${s.title}: ${s.desc}`).join('\n');
  }

  let interactionList = '';
  if (interactions && interactions.length > 0) {
    interactionList = '\n# äº’å?æ¢—\n' + interactions.map(i => `- ${i.title}: ${i.desc}`).join('\n');
  }

  const lang = localStorage.getItem('sxiphone_lang') || 'zh-TW';
  const contentLength = getCurrentContentLength();
  
  let lengthInstruction = '';
  let wordCountRequirement = '';
  
  if (contentLength === 'short') {
    lengthInstruction = '?™æ˜¯ä¸€ç¯‡çŸ­ç¯‡å?äººæ?ï¼Œè?ç²¾ç°¡ä½†å??´åœ°?˜è¿°?…ä???;
    wordCountRequirement = '**å­—æ•¸ç´?1000 å­—å·¦??*';
  } else if (contentLength === 'medium') {
    lengthInstruction = '?™æ˜¯ä¸€ç¯‡é•·ç¯‡å?äººæ?ï¼Œè?è©³ç´°?å¯«?´æ™¯?å?è©±è?å¿ƒç?æ´»å???;
    wordCountRequirement = '**å­—æ•¸å¿…é? 2000-5000 å­?*';
  } else if (contentLength === 'series') {
    lengthInstruction = '?™æ˜¯ä¸€?‹é€??ç³»å??„é?ç¯‡ï?è«‹ç‚ºå¾Œç??¼å??‹ä?ä¼ç?ï¼Œæ?äº‹è??‰å»¶çºŒæ€§ã€?;
    wordCountRequirement = '**å­—æ•¸ç´?1500-2000 å­—ï?ä½œç‚º????„ç¬¬ä¸€ç«?*';
  }
  
  let r18Instruction = '';
  if (isR18) {
    r18Instruction = `
# ?äºº?§å®¹?µä?è¦æ?ï¼ˆR18ï¼Œå??ˆåŸ·è¡Œï?
**?™æ˜¯ä¸€ç¯‡æ?äººå??Œäºº?µä?ï¼Œä?å¿…é??…å«ä»¥ä??§å®¹ï¼?*

## å¿…é??…å«?„æ?å¯?1. **å®Œæ•´?„æ€§æ??´æ™¯**ï¼šå??ˆæ?å¾å??²åˆ°çµæ??„å??´é?ç¨‹ï?ä¸èƒ½è·³é??–æ¨¡ç³Šå¸¶??2. **?Ÿå?ç´°ç?**ï¼šè§¸?Ÿã€æº«åº¦ã€è²?³ã€æ°£?³ã€è?è¦ºç?ç´°è†©?å¯«
3. **èº«é??æ?**ï¼šç??†å??‰å?é¡«æ??å??¯ã€å‡ºæ±—ã€è??‰ç?ç¹ƒç?
4. **å¿ƒç?æ´»å?**ï¼šè??²åœ¨è¦ªå??ç?ä¸­ç??…æ?æ³¢å??Œå…§å¿ƒæƒ³æ³?5. **å°è©±?‡ä???*ï¼šè¦ªå¯†é?ç¨‹ä¸­?„å?è©±ã€å‘»?Ÿã€è?æ±‚ç?

## ?å¯«è¦æ?
- ä½¿ç”¨?·é??éœ²éª¨ä?ä¸ä?ä¿—ç?è©å?
- æ¯å€‹æ€§æ??´æ™¯?³å? 500 å­—ä»¥ä¸?- å¿…é??‰è‡³å°‘ä??‹å??´ç??§æ??´æ™¯
- ?å¯«è¦ç¬¦?ˆè??²æ€§æ ¼ï¼Œä??äºº?©ä??´æ€?- ?…å«å®‰å…¨?§è??ºï?å¦‚ä½¿?¨ä??ªå?ç­‰ï?

## ç¦æ­¢äº‹é?
- ç¦æ­¢ä½¿ç”¨?Œç„¶å¾Œä???..?ç?æ¨¡ç?è·³é?
- ç¦æ­¢?ªæ?å¯«è¦ª?»å??æŠ±å°±ç???- ç¦æ­¢?¨ã€Œæ˜¥å®µä??»ã€ç??è?å¸¶é?
- å¿…é?å¯¦é??å¯«?§æ??ç??„ç´°ç¯€`;
  }

  let npcInstruction = '';
  if (npcs && npcs.length > 0) {
    npcInstruction = `
# NPC äº’å??‡å?
- NPC ??User ?„å¥½?‹ï???User ?‰è‰¯å¥½ç??‹æ?äº’å?
- NPC ä¸æ?ä»‹å…¥ CP ä¹‹é??„æ??…é?ä¿‚ï?ä¸æ??‰æ??§æ??›æ??‘ç?äº’å?
- NPC ?¯ä»¥ä½œç‚º?è??…ã€åŠ©?»è€…ã€æ??±å?ç¶“æ­·äº‹ä»¶?„å¤¥ä¼?- NPC ??CP è§’è‰²?„ä??•è??ªç„¶ï¼Œç¬¦?ˆå??…é?ä¿‚`;
  }

  return `ä½ æ˜¯ä¸€ä½å?æ¥­ç??Œäºº?‡ä?å®¶ï??…é•·?¹æ?è§’è‰²è¨­å??Œä??Œè??µä?ç¬¦å?äººç‰©?§æ ¼?„å?äººæ??‚è??¹æ?ä»¥ä?è¨­å??µä?ä¸€ç¯‡å?äººæ???${cotContent}
${characterContext}
${bodytypeContext}
${npcContext}
${worldbookContext}
${worldSettingList}
${interactionList}
${memoryContext}
${historyContext}
${r18Instruction}
${npcInstruction}

# ä½¿ç”¨??- ?ç¨±: ${user.name}
- ?§æ ¼: ${user.personality || '?ªçŸ¥'}
- ?Œæ™¯: ${user.background || '?ªçŸ¥'}

# CP ?å?
${topName} ? ${bottomName}

# ?µä?è¦æ?
- ?‡é¢¨: ${style}
${styleRef ? `- ?ƒè€ƒæ?é¢? ${styleRef}` : ''}
- ${lengthInstruction}

# è¼¸å‡ºè¦ç?ï¼ˆé?å¸¸é?è¦ï?
1. ä½¿ç”¨ ${lang} ?°å¯«
2. ä¿æ?è§’è‰²?§æ ¼ä¸€?´ï??´æ ¼ç¬¦å?è§’è‰²è¨­å?
3. ?ªç„¶?å…¥ä¸–ç?è§€è¨­å?ï¼Œè?ä¸–ç?è§€ç´°ç?è±å??…ä?
4. ${wordCountRequirement}
5. ?…å«æ¨™é??æ­£??6. ?€è¦æ?å®Œæ•´?„å ´?¯æ?å¯«ã€å?è©±ã€å??†æ´»??7. ?…ç?è¦æ?èµ·æ‰¿è½‰å?ï¼Œä??½åª?¯ç?æ®?8. è§’è‰²äº’å?è¦è‡ª?¶ï?ç¬¦å? CP ?œä?
9. **?´æ ¼ç¦æ­¢?¨æ?ç« ä¸­?å??–å??¨ä»»ä½?COT?æ€ç¶­?ˆã€æ€è€ƒå??ƒç??§å®¹**
10. **ç¦æ­¢?¨æ?ç« ä¸­?å?ä»»ä?è¨­å?è³‡æ?ä¾†æ?ï¼Œå??¬ä?ä¸é??¼ï?ä¸–ç??¸ã€è¨­å®šæ??å??ƒè??™ç?**
11. **ç¦æ­¢ä½¿ç”¨?Œæ ¹?šè¨­å®šã€ã€ã€Œå?ä¸–ç??¸æ?è¿°ã€ç??ƒæ?è¿°ï??€?‰è¨­å®šéƒ½?‰è‡ª?¶è??¥æ?äº‹ä¸­**

è«‹ç›´?¥è¼¸?ºå?äººæ??§å®¹ï¼Œæ ¼å¼å?ä¸‹ï?
?æ?é¡Œã€?..
?æ­£?‡ã€?..`;
}

async function generateFanfic(cp, worldSettings, interactions, npcs, style, styleRef, isR18, topBodytype, bottomBodytype, bodytypeNote, topGender, bottomGender) {
  const prompt = buildFanficPrompt(cp, worldSettings, interactions, npcs, style, styleRef, isR18, topBodytype, bottomBodytype, bodytypeNote, topGender, bottomGender);
  const payload = [
    { role: 'system', content: 'ä½ æ˜¯ä¸€ä½å?æ¥­ç??Œäºº?‡ä?å®¶ï??…é•·?¹æ?è§’è‰²è¨­å??Œä??Œè??µä?ç¬¦å?äººç‰©?§æ ¼?„å?äººæ??? },
    { role: 'user', content: prompt }
  ];
  return await callAIAPI(payload);
}

function parseGeneratedContent(text) {
  const titleMatch = text.match(/?æ?é¡Œã€?[^\n]+)/);
  const contentMatch = text.match(/?æ­£?‡ã€?[\s\S]*)/);
  const title = titleMatch ? titleMatch[1].trim() : '?¡æ?é¡?;
  let content = contentMatch ? contentMatch[1].trim() : text;
  
  content = content
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\[??§[^\]]*\][\s\S]*?(?=\n\n|\n?|$)/gi, '')
    .replace(/?™æ?[ABï¼¡ï¼¢]ï¼ˆ[^ï¼‰]+ï¼‰[ï¼?][\s\S]*?(?=\n\n|\n?™æ?|\n?|$)/gi, '')
    .replace(/?™æ?[ABï¼¡ï¼¢][ï¼?][\s\S]*?(?=\n\n|\n?™æ?|\n?|$)/gi, '')
    .replace(/ï¼ˆç?å­¸ï?[ï¼?][\s\S]*?(?=\n\n|\nï¼ˆ|\n?|$)/gi, '')
    .replace(/ï¼ˆå??†ï?[ï¼?][\s\S]*?(?=\n\n|\nï¼ˆ|\n?|$)/gi, '')
    .replace(/?è¼¯?‡ç?ä»¤[ï¼?][\s\S]*?(?=\n\n|\n-|\n?|$)/gi, '')
    .replace(/^\s*[-?¢Â·]\s*[^\n]*?(?:?¸ç¸½|èªæ°£|ä¾µç•¥?§|ä¸­æ€§|?©ç?|?•è?|?å–»|?¬äºº|ä¿¡æ¯ç´ |?ºé?|è¨˜æ†¶|è¡°é€€|æ°´æ¼¬|?¡é¢|æ±¡æ?)[^\n]*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  const wordCount = content.replace(/\s/g, '').length;
  const contentLength = getCurrentContentLength();
  
  if (contentLength === 'short' && wordCount < 800) {
    console.warn(`?Ÿæ??„å?äººæ?å­—æ•¸ä¸è¶³ 800 å­—ï??®å? ${wordCount} å­—ï?`);
  } else if (contentLength === 'medium' && wordCount < 1500) {
    console.warn(`?Ÿæ??„å?äººæ?å­—æ•¸ä¸è¶³ 1500 å­—ï??®å? ${wordCount} å­—ï?`);
  } else if (contentLength === 'series' && wordCount < 1000) {
    console.warn(`?Ÿæ??„å?äººæ?å­—æ•¸ä¸è¶³ 1000 å­—ï??®å? ${wordCount} å­—ï?`);
  }
  
  return {
    title,
    content,
    wordCount
  };
}

let isGenerating = false;

async function handleGenerateFanfic() {
  if (isGenerating) {
    alert('æ­?œ¨?Ÿæ?ä¸­ï?è«‹ç???..');
    return;
  }

  const selectedCpList = getSelectedCpList();
  console.log('[Lofter] ?¸æ???CP:', selectedCpList);
  
  if (selectedCpList.length === 0) {
    alert('è«‹å??¸æ??³å?ä¸€çµ?CP');
    return;
  }

  const selectedWorldSettings = getSelectedWorldSettings();
  const selectedInteractions = getSelectedInteractions();
  console.log('[Lofter] ?¸æ??„ä??Œè?:', selectedWorldSettings);
  console.log('[Lofter] ?¸æ??„ä??•æ?:', selectedInteractions);
  
  if (selectedWorldSettings.length === 0 && selectedInteractions.length === 0) {
    alert('è«‹å??¸æ??³å?ä¸€?‹ä??Œè??–ä??•æ?');
    return;
  }

  const selectedNpcs = getSelectedNpcs();
  console.log('[Lofter] ?¸æ???NPC:', selectedNpcs);

  const style = likesStyleSelect?.value || 'ç´°è†©';
  let styleRef = likesStyleRef?.value.trim();

  if (style === 'custom-worldbook') {
    const entries = loadListFromStorage('sx_worldbook_style');
    const selectedIndex = parseInt(worldbookStyleSelect?.value, 10);
    if (entries[selectedIndex]) {
      styleRef = entries[selectedIndex].content || styleRef;
    }
  }

  const isR18 = getCurrentContentRating() === 'r18';
  
  const topBodytype = topBodytypeSelect?.value || '';
  const bottomBodytype = bottomBodytypeSelect?.value || '';
  const bodytypeNote = bodytypeNoteInput?.value.trim() || '';
  
  const topGenderSelect = document.getElementById('lofter-top-gender');
  const bottomGenderSelect = document.getElementById('lofter-bottom-gender');
  const topGender = topGenderSelect?.value || '';
  const bottomGender = bottomGenderSelect?.value || '';
  
  saveCurrentCpBodytypes();

  isGenerating = true;
  if (likesGenerateBtn) {
    likesGenerateBtn.disabled = true;
    likesGenerateBtn.textContent = '?Ÿæ?ä¸?..';
  }
  
  const publishBtn = document.querySelector('.publish-btn');
  if (publishBtn) {
    publishBtn.disabled = true;
    publishBtn.classList.add('generating');
    publishBtn.innerHTML = '<i class="fas fa-pen-nib"></i><span>?Ÿæ?ä¸?..</span>';
  }

  try {
    const generatedPosts = [];
    const contentLength = getCurrentContentLength();
    const lengthLabel = contentLength === 'short' ? '?­ç?' : (contentLength === 'medium' ? '?·ç?' : '???');
    
    for (const cp of selectedCpList) {
      const cpBodytypeData = getCpBodytypes(cp);
      const effectiveTopBodytype = topBodytype || cpBodytypeData?.topBodytype || '';
      const effectiveBottomBodytype = bottomBodytype || cpBodytypeData?.bottomBodytype || '';
      const effectiveBodytypeNote = bodytypeNote || cpBodytypeData?.bodytypeNote || '';
      const effectiveTopGender = topGender || cpBodytypeData?.topGender || '';
      const effectiveBottomGender = bottomGender || cpBodytypeData?.bottomGender || '';
      
      const result = await generateFanfic(cp, selectedWorldSettings, selectedInteractions, selectedNpcs, style, styleRef, isR18, effectiveTopBodytype, effectiveBottomBodytype, effectiveBodytypeNote, effectiveTopGender, effectiveBottomGender);
      const parsed = parseGeneratedContent(result);

      const tags = [`#${cp}`];
      selectedWorldSettings.slice(0, 2).forEach(s => tags.push(`#${s.title}`));
      selectedInteractions.slice(0, 2).forEach(i => tags.push(`#${i.title}`));
      if (isR18) {
        tags.push('#è»Šæ?');
      }
      if (selectedNpcs.length > 0) {
        tags.push('#å¤šäººäº’å?');
      }

      const post = {
        author: getRandomAuthorName(),
        category: `?Œäºº??Â· ${cp} Â· ${style} Â· ${lengthLabel}${isR18 ? ' Â· R18' : ''}`,
        title: parsed.title,
        summary: isR18 ? `? ï? è»Šæ? - ${parsed.content.slice(0, 70)}` : parsed.content.slice(0, 100),
        text: parsed.content.slice(0, 200) + '...',
        excerpt: parsed.content.slice(0, 300),
        fullContent: parsed.content,
        tags,
        time: '?›å?',
        likes: 0,
        comments: 0,
        shares: 0,
        isFollowed: false,
        isR18,
        contentLength
      };

      postData.recommend.unshift(post);
      postData.follow.unshift(post);
      await saveGeneratedPost(post);
      generatedPosts.push(post);
    }
    
    if (likesFeedEl) {
      likesFeedEl.innerHTML = generatedPosts.map((post, index) => buildPostHTML(post, index)).join('');
    }
    
    currentPage = 'home';
    updatePageView();
    renderFeed();
    
    const cpNames = selectedCpList.join('??);
    alert(`??å·²ç‚º ${cpNames} ?Ÿæ? ${generatedPosts.length} ç¯‡å?äººæ?`);
  } catch (err) {
    console.error('[Lofter] ?Ÿæ?å¤±æ?å®Œæ•´?¯èª¤:', err);
    const errorInfo = `???Ÿæ?å¤±æ?

${err.message}

è«‹æª¢??
1. API URL ?¯å¦æ­?¢º
2. API Key ?¯å¦?‰æ?
3. æ¨¡å??ç¨±?¯å¦?¯æ´
4. ç¶²è·¯????¯å¦æ­?¸¸`;
    alert(errorInfo);
  } finally {
    isGenerating = false;
    if (likesGenerateBtn) {
      likesGenerateBtn.disabled = false;
      likesGenerateBtn.textContent = '?Ÿæ??Œäºº??;
    }
    if (publishBtn) {
      publishBtn.disabled = false;
      publishBtn.classList.remove('generating');
      publishBtn.innerHTML = '<i class="fas fa-pen-nib"></i><span>?¼ä?</span>';
    }
  }
}

const originalLikesGenerateHandler = likesGenerateBtn?.onclick;
likesGenerateBtn?.removeEventListener('click', originalLikesGenerateHandler);
likesGenerateBtn?.addEventListener('click', handleGenerateFanfic);

function renderFollowFeed() {
  if (!followFeedEl) return;
  const list = loadListFromStorage(FOLLOW_POST_KEY);
  if (list.length === 0) {
    followFeedEl.innerHTML = '<div class="empty-state"><i class="far fa-star"></i><p>å°šæœªè¿½è¹¤ä»»ä??‡ç?</p><p class="empty-hint">?¨æ?ç« ä¸­é»æ??Œè¿½è¹¤ã€æ??•å³?¯è¿½è¹?/p></div>';
    return;
  }
  
  const generated = list.map((item, index) => ({
    author: item.author,
    category: item.category || `è¿½è¹¤ä¸?Â· ${item.status}`,
    title: item.title,
    summary: item.fullContent ? item.fullContent.slice(0, 100) + '...' : 'AI çºŒå¯«å·²æ??™ï?é»æ??¯ç??ä?ä¸€ç¯‡ç???,
    text: item.fullContent || 'AI çºŒå¯«å·²æ??™ï?é»æ??¯ç??ä?ä¸€ç¯‡ç???,
    excerpt: item.fullContent || 'è¿½è¹¤æ­¤ä??å?ï¼Œç³»çµ±æ?ä¾æ??‡ç??‡è¨­å®šè‡ª?•å»¶ä¼¸ç??†ã€?,
    fullContent: item.fullContent || '',
    tags: ['#???', '#è¿½è¹¤ä¸?],
    time: item.time,
    likes: 0,
    comments: 0,
    shares: 0,
    isFollowed: true
  }));
  
  followFeedEl.innerHTML = generated.map((post, index) => buildPostHTML(post, index)).join('');
}

function renderIdeas() {
  if (!ideaGridEl) return;
  ideaGridEl.innerHTML = ideaData.map((idea, index) => `
    <article class="idea-card" data-index="${index}" tabindex="0" role="button" aria-pressed="false">
      <h3>${escapeHTML(idea.title)}</h3>
      <p>${escapeHTML(idea.desc)}</p>
      <div class="idea-tags">${idea.tags.map(tag => `<span class="idea-tag">${escapeHTML(tag)}</span>`).join('')}</div>
    </article>
  `).join('');
  applyIdeaSelection();
}

function renderWorldSettings() {
  const worldGrid = document.getElementById('worldsetting-grid');
  if (!worldGrid) return;
  worldGrid.innerHTML = worldSettings.map((setting, index) => `
    <article class="idea-card worldsetting-card" data-index="${index}" data-type="world" tabindex="0" role="button" aria-pressed="false">
      <h3>${escapeHTML(setting.title)}</h3>
      <p>${escapeHTML(setting.desc)}</p>
      <div class="idea-tags">${setting.tags.map(tag => `<span class="idea-tag">${escapeHTML(tag)}</span>`).join('')}</div>
    </article>
  `).join('');
  bindWorldSettingEvents();
}

function renderInteractionTropes() {
  const interactionGrid = document.getElementById('interaction-grid');
  if (!interactionGrid) return;
  interactionGrid.innerHTML = interactionTropes.map((trope, index) => `
    <article class="idea-card interaction-card" data-index="${index}" data-type="interaction" tabindex="0" role="button" aria-pressed="false">
      <h3>${escapeHTML(trope.title)}</h3>
      <p>${escapeHTML(trope.desc)}</p>
      <div class="idea-tags">${trope.tags.map(tag => `<span class="idea-tag">${escapeHTML(tag)}</span>`).join('')}</div>
    </article>
  `).join('');
  bindInteractionEvents();
}

function renderLikesIdeas() {
  renderWorldSettings();
  renderInteractionTropes();
  renderNpcCheckboxList();
}

function renderNpcCheckboxList() {
  const npcList = document.getElementById('lofter-npc-checkbox-list');
  if (!npcList) return;
  
  const npcPool = loadListFromStorage('sx_npcs') || [];
  const characters = loadListFromStorage('sx_characters') || [];
  const allNpcs = [...npcPool, ...characters.filter(c => c.isNpc)];
  
  if (allNpcs.length === 0) {
    npcList.innerHTML = '<div class="npc-empty">å°šç„¡ NPC è³‡æ?ï¼Œè??ˆåˆ°è¨­å??é¢?°å? NPC</div>';
    return;
  }
  
  const selectedNpcs = loadListFromStorage('sx_lofter_selected_npcs') || [];
  const selectedSet = new Set(selectedNpcs.map(n => n.name));
  
  npcList.innerHTML = allNpcs.map((npc, index) => {
    const isSelected = selectedSet.has(npc.name);
    return `
      <div class="cp-checkbox-item ${isSelected ? 'selected' : ''}" data-npc-index="${index}">
        <input type="checkbox" id="npc-${index}" ${isSelected ? 'checked' : ''}>
        <label for="npc-${index}">${escapeHTML(npc.name)}</label>
        <span class="npc-relationship">å¥½å?</span>
      </div>
    `;
  }).join('');
  
  bindNpcCheckboxEvents();
}

function bindWorldSettingEvents() {
  const worldGrid = document.getElementById('worldsetting-grid');
  if (!worldGrid) return;
  
  worldGrid.querySelectorAll('.idea-card').forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('selected');
      card.setAttribute('aria-pressed', card.classList.contains('selected'));
      saveWorldSettingSelection();
    });
    
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });
  
  loadWorldSettingSelection();
}

function bindInteractionEvents() {
  const interactionGrid = document.getElementById('interaction-grid');
  if (!interactionGrid) return;
  
  interactionGrid.querySelectorAll('.idea-card').forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('selected');
      card.setAttribute('aria-pressed', card.classList.contains('selected'));
      saveInteractionSelection();
    });
    
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });
  
  loadInteractionSelection();
}

function bindNpcCheckboxEvents() {
  const npcList = document.getElementById('lofter-npc-checkbox-list');
  if (!npcList) return;
  
  npcList.querySelectorAll('.cp-checkbox-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.tagName === 'INPUT') return;
      const checkbox = item.querySelector('input[type="checkbox"]');
      checkbox.checked = !checkbox.checked;
      item.classList.toggle('selected', checkbox.checked);
      saveNpcSelection();
    });
    
    const checkbox = item.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', () => {
      item.classList.toggle('selected', checkbox.checked);
      saveNpcSelection();
    });
  });
}

function saveWorldSettingSelection() {
  const worldGrid = document.getElementById('worldsetting-grid');
  if (!worldGrid) return;
  
  const selected = [];
  worldGrid.querySelectorAll('.idea-card.selected').forEach(card => {
    const index = parseInt(card.dataset.index);
    selected.push(index);
  });
  
  localStorage.setItem('sx_lofter_worldsetting_selection', JSON.stringify(selected));
}

function loadWorldSettingSelection() {
  const worldGrid = document.getElementById('worldsetting-grid');
  if (!worldGrid) return;
  
  const selected = JSON.parse(localStorage.getItem('sx_lofter_worldsetting_selection') || '[]');
  const selectedSet = new Set(selected);
  
  worldGrid.querySelectorAll('.idea-card').forEach(card => {
    const index = parseInt(card.dataset.index);
    if (selectedSet.has(index)) {
      card.classList.add('selected');
      card.setAttribute('aria-pressed', 'true');
    }
  });
}

function saveInteractionSelection() {
  const interactionGrid = document.getElementById('interaction-grid');
  if (!interactionGrid) return;
  
  const selected = [];
  interactionGrid.querySelectorAll('.idea-card.selected').forEach(card => {
    const index = parseInt(card.dataset.index);
    selected.push(index);
  });
  
  localStorage.setItem('sx_lofter_interaction_selection', JSON.stringify(selected));
}

function loadInteractionSelection() {
  const interactionGrid = document.getElementById('interaction-grid');
  if (!interactionGrid) return;
  
  const selected = JSON.parse(localStorage.getItem('sx_lofter_interaction_selection') || '[]');
  const selectedSet = new Set(selected);
  
  interactionGrid.querySelectorAll('.idea-card').forEach(card => {
    const index = parseInt(card.dataset.index);
    if (selectedSet.has(index)) {
      card.classList.add('selected');
      card.setAttribute('aria-pressed', 'true');
    }
  });
}

function saveNpcSelection() {
  const npcList = document.getElementById('lofter-npc-checkbox-list');
  if (!npcList) return;
  
  const npcPool = loadListFromStorage('sx_npcs') || [];
  const characters = loadListFromStorage('sx_characters') || [];
  const allNpcs = [...npcPool, ...characters.filter(c => c.isNpc)];
  
  const selected = [];
  npcList.querySelectorAll('.cp-checkbox-item input[type="checkbox"]:checked').forEach(checkbox => {
    const index = parseInt(checkbox.id.replace('npc-', ''));
    if (allNpcs[index]) {
      selected.push({
        name: allNpcs[index].name,
        relationship: 'å¥½å?'
      });
    }
  });
  
  localStorage.setItem('sx_lofter_selected_npcs', JSON.stringify(selected));
}

function getSelectedWorldSettings() {
  const selected = JSON.parse(localStorage.getItem('sx_lofter_worldsetting_selection') || '[]');
  return selected.map(index => worldSettings[index]).filter(Boolean);
}

function getSelectedInteractions() {
  const selected = JSON.parse(localStorage.getItem('sx_lofter_interaction_selection') || '[]');
  return selected.map(index => interactionTropes[index]).filter(Boolean);
}

function getSelectedNpcs() {
  return JSON.parse(localStorage.getItem('sx_lofter_selected_npcs') || '[]');
}

function updateIdeaSelection(targetCard, selected) {
  targetCard.classList.toggle('selected', selected);
  targetCard.setAttribute('aria-pressed', String(selected));
}

function getStoredIdeaSelection() {
  const list = loadListFromStorage(IDEA_SELECTION_KEY);
  return Array.isArray(list) ? list.map(item => Number(item)).filter(Number.isFinite) : [];
}

function setStoredIdeaSelection(selection) {
  const normalized = Array.from(new Set(selection))
    .map(item => Number(item))
    .filter(index => Number.isFinite(index) && index >= 0 && index < ideaData.length);
  localStorage.setItem(IDEA_SELECTION_KEY, JSON.stringify(normalized));
}

function applyIdeaSelection() {
  const selectedSet = new Set(getStoredIdeaSelection());
  [ideaGridEl, likesIdeaGridEl].forEach((grid) => {
    if (!grid) return;
    grid.querySelectorAll('.idea-card').forEach(card => {
      const index = Number(card.dataset.index);
      updateIdeaSelection(card, selectedSet.has(index));
    });
  });
}

function syncIdeaSelectionFromGrid(grid) {
  if (!grid) return;
  const selected = Array.from(grid.querySelectorAll('.idea-card.selected'))
    .map(card => Number(card.dataset.index))
    .filter(Number.isFinite);
  setStoredIdeaSelection(selected);
  applyIdeaSelection();
}

function setAllIdeaSelection(selected) {
  if (selected) {
    setStoredIdeaSelection(ideaData.map((_, index) => index));
  } else {
    setStoredIdeaSelection([]);
  }
  applyIdeaSelection();
}

function bindIdeaEvents() {
  ideaGridEl?.addEventListener('click', (event) => {
    const card = event.target.closest('.idea-card');
    if (!card) return;
    const isSelected = card.classList.contains('selected');
    updateIdeaSelection(card, !isSelected);
    syncIdeaSelectionFromGrid(ideaGridEl);
  });

  ideaGridEl?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const card = event.target.closest('.idea-card');
    if (!card) return;
    event.preventDefault();
    const isSelected = card.classList.contains('selected');
    updateIdeaSelection(card, !isSelected);
    syncIdeaSelectionFromGrid(ideaGridEl);
  });

  ideaSelectAllBtn?.addEventListener('click', () => {
    setAllIdeaSelection(true);
  });

  ideaClearBtn?.addEventListener('click', () => {
    setAllIdeaSelection(false);
  });

  ideaGenerateBtn?.addEventListener('click', () => {
    const selected = Array.from(ideaGridEl?.querySelectorAll('.idea-card.selected') || []);
    if (selected.length === 0) {
      alert('è«‹å??¸æ??³å?ä¸€?‹æ??ç??å?äººæ?');
      return;
    }
    alert(`å·²é¸??${selected.length} ?‹æ?ï¼Œå¯?¨æ–¼?Ÿæ??Œäºº?‡è?ç¨¿ã€‚`);
  });
}

function bindLikesIdeaEvents() {
  likesSelectAllBtn?.addEventListener('click', () => {
    const worldGrid = document.getElementById('worldsetting-grid');
    const interactionGrid = document.getElementById('interaction-grid');
    
    worldGrid?.querySelectorAll('.idea-card').forEach(card => {
      card.classList.add('selected');
      card.setAttribute('aria-pressed', 'true');
    });
    
    interactionGrid?.querySelectorAll('.idea-card').forEach(card => {
      card.classList.add('selected');
      card.setAttribute('aria-pressed', 'true');
    });
    
    saveWorldSettingSelection();
    saveInteractionSelection();
  });

  likesClearBtn?.addEventListener('click', () => {
    const worldGrid = document.getElementById('worldsetting-grid');
    const interactionGrid = document.getElementById('interaction-grid');
    
    worldGrid?.querySelectorAll('.idea-card').forEach(card => {
      card.classList.remove('selected');
      card.setAttribute('aria-pressed', 'false');
    });
    
    interactionGrid?.querySelectorAll('.idea-card').forEach(card => {
      card.classList.remove('selected');
      card.setAttribute('aria-pressed', 'false');
    });
    
    saveWorldSettingSelection();
    saveInteractionSelection();
  });
}

const WORLDBOOK_SELECTION_KEY = 'sx_lofter_worldbook_selection';

function renderWorldbookCheckboxList() {
  if (!worldbookCheckboxList) return;
  
  const categories = ['style', 'global', 'keywords', 'backend'];
  const allEntries = [];
  
  categories.forEach(cat => {
    const key = `sx_worldbook_${cat}`;
    const raw = localStorage.getItem(key);
    if (!raw) return;
    try {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        list.forEach(item => {
          if (!item || !item.title) return;
          allEntries.push({
            title: item.title,
            category: cat,
            id: `${cat}-${item.title}`
          });
        });
      }
    } catch (e) {}
  });
  
  if (allEntries.length === 0) {
    worldbookCheckboxList.innerHTML = '<div class="cp-empty">å°šç„¡ä¸–ç??¸æ??®ï?è«‹å??°ä??Œæ›¸?é¢?°å?</div>';
    return;
  }
  
  const selectedWorldbooks = loadListFromStorage(WORLDBOOK_SELECTION_KEY);
  const selectedSet = new Set(selectedWorldbooks);
  
  worldbookCheckboxList.innerHTML = allEntries.map((entry, index) => {
    const isSelected = selectedSet.has(entry.id);
    return `
      <div class="cp-checkbox-item ${isSelected ? 'selected' : ''}" data-worldbook-id="${escapeHTML(entry.id)}">
        <input type="checkbox" id="worldbook-${index}" ${isSelected ? 'checked' : ''}>
        <label for="worldbook-${index}">${escapeHTML(entry.title)}</label>
        <span class="worldbook-category">${entry.category}</span>
      </div>
    `;
  }).join('');
}

function bindWorldbookCheckboxEvents() {
  worldbookCheckboxList?.addEventListener('click', (event) => {
    const item = event.target.closest('.cp-checkbox-item');
    if (!item) return;
    
    const checkbox = item.querySelector('input[type="checkbox"]');
    
    if (event.target.tagName !== 'INPUT') {
      checkbox.checked = !checkbox.checked;
    }
    
    item.classList.toggle('selected', checkbox.checked);
    
    saveWorldbookSelection();
  });
}

function saveWorldbookSelection() {
  const checkboxes = worldbookCheckboxList?.querySelectorAll('input[type="checkbox"]:checked') || [];
  const selected = Array.from(checkboxes).map(cb => {
    const item = cb.closest('.cp-checkbox-item');
    return item?.dataset.worldbookId;
  }).filter(Boolean);
  
  localStorage.setItem(WORLDBOOK_SELECTION_KEY, JSON.stringify(selected));
}

function getSelectedWorldbookIds() {
  return loadListFromStorage(WORLDBOOK_SELECTION_KEY);
}

function loadWorldbookEntries() {
  const categories = ['style', 'global', 'keywords', 'backend'];
  const entries = [];

  categories.forEach(cat => {
    const key = `sx_worldbook_${cat}`;
    const raw = localStorage.getItem(key);
    if (!raw) return;
    try {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        list.forEach(item => {
          if (!item || !item.title) return;
          entries.push({
            title: item.title,
            triggers: Array.isArray(item.triggers) ? item.triggers : [],
            category: cat
          });
        });
      }
    } catch (e) {
      console.warn('worldbook parse failed', key, e);
    }
  });

  if (!worldbookListEl) return;
  if (entries.length === 0) {
    worldbookListEl.innerHTML = '<div class="worldbook-item"><div class="worldbook-title">å°šæœªå»ºç?ä¸–ç??¸æ???/div><div class="worldbook-meta">è«‹å??°è¨­å®šé?å»ºç?ä¸–ç??¸å…§å®?/div></div>';
    return;
  }

  worldbookListEl.innerHTML = entries.slice(0, 4).map(entry => `
    <div class="worldbook-item">
      <div class="worldbook-title">${escapeHTML(entry.title)}</div>
      <div class="worldbook-meta">${escapeHTML(entry.triggers.join('??) || 'å°šæœªè¨­å??œéµå­?)}</div>
    </div>
  `).join('');
}

function loadListFromStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getWorldbookStyleSample() {
  const entries = loadListFromStorage('sx_worldbook_style');
  if (!entries.length) return null;
  const pick = entries[Math.floor(Math.random() * entries.length)];
  const title = pick?.title || 'ä¸–ç??¸æ?é¢?;
  const content = pick?.content || '';
  return {
    title,
    content: content.trim()
  };
}

function loadWorldbookStyleOptions() {
  const entries = loadListFromStorage('sx_worldbook_style');
  if (!worldbookStyleSelect) return;
  
  if (entries.length === 0) {
    worldbookStyleSelect.innerHTML = '<option value="">å°šç„¡ä¸–ç??¸æ?é¢¨æ???/option>';
    return;
  }
  
  worldbookStyleSelect.innerHTML = entries.map((entry, index) => 
    `<option value="${index}">${escapeHTML(entry.title || '?ªå‘½?æ?é¢?)}</option>`
  ).join('');
}

function bindStyleSelectEvents() {
  likesStyleSelect?.addEventListener('change', () => {
    const value = likesStyleSelect.value;
    if (value === 'custom-worldbook') {
      if (worldbookStyleContainer) {
        worldbookStyleContainer.style.display = 'grid';
      }
      loadWorldbookStyleOptions();
    } else {
      if (worldbookStyleContainer) {
        worldbookStyleContainer.style.display = 'none';
      }
    }
  });
  
  worldbookStyleSelect?.addEventListener('change', () => {
    const index = parseInt(worldbookStyleSelect.value, 10);
    const entries = loadListFromStorage('sx_worldbook_style');
    if (entries[index] && likesStyleRef) {
      likesStyleRef.value = entries[index].content || '';
    }
  });
}

function renderSelectOptions(selectEl, list, placeholder) {
  if (!selectEl) return;
  const options = [`<option value="">${placeholder}</option>`];
  list.forEach((item, index) => {
    const label = item?.name || item?.title || item?.id || `?…ç›® ${index + 1}`;
    options.push(`<option value="${escapeHTML(String(label))}">${escapeHTML(String(label))}</option>`);
  });
  selectEl.innerHTML = options.join('');
}

function renderCpCheckboxList() {
  if (!likesCpCheckboxList) return;
  const list = loadListFromStorage(CP_FOLLOW_KEY);
  
  if (list.length === 0) {
    likesCpCheckboxList.innerHTML = '<div class="cp-empty">å°šæœªè¨­å??œæ³¨ CPï¼Œè??ˆåˆ°?Œç™¼?¾ã€é??¢è¨­å®?/div>';
    return;
  }
  
  const selectedCp = loadListFromStorage(SELECTED_CP_KEY);
  const selectedSet = new Set(selectedCp);
  
  likesCpCheckboxList.innerHTML = list.map((item, index) => {
    const cpName = `${item.top} ? ${item.bottom}`;
    const isSelected = selectedSet.has(cpName);
    return `
      <div class="cp-checkbox-item ${isSelected ? 'selected' : ''}" data-cp="${escapeHTML(cpName)}">
        <input type="checkbox" id="cp-${index}" ${isSelected ? 'checked' : ''}>
        <label for="cp-${index}">${escapeHTML(cpName)}</label>
      </div>
    `;
  }).join('');
}

function getCpBodytypes(cpName) {
  const allBodytypes = loadListFromStorage(CP_BODYTYPES_KEY);
  return allBodytypes.find(item => item.cp === cpName) || null;
}

function saveCpBodytypes(cpName, topBodytype, bottomBodytype, bodytypeNote, topGender, bottomGender) {
  const allBodytypes = loadListFromStorage(CP_BODYTYPES_KEY);
  const existingIndex = allBodytypes.findIndex(item => item.cp === cpName);
  
  const bodytypeData = {
    cp: cpName,
    topBodytype: topBodytype || '',
    bottomBodytype: bottomBodytype || '',
    bodytypeNote: bodytypeNote || '',
    topGender: topGender || '',
    bottomGender: bottomGender || '',
    updatedAt: Date.now()
  };
  
  if (existingIndex >= 0) {
    allBodytypes[existingIndex] = bodytypeData;
  } else {
    allBodytypes.push(bodytypeData);
  }
  
  localStorage.setItem(CP_BODYTYPES_KEY, JSON.stringify(allBodytypes));
}

function loadCpBodytypeToUI(cpName) {
  const bodytypeData = getCpBodytypes(cpName);
  
  if (bodytypeData) {
    if (topBodytypeSelect) topBodytypeSelect.value = bodytypeData.topBodytype || '';
    if (bottomBodytypeSelect) bottomBodytypeSelect.value = bodytypeData.bottomBodytype || '';
    if (bodytypeNoteInput) bodytypeNoteInput.value = bodytypeData.bodytypeNote || '';
    
    const topGenderSelect = document.getElementById('lofter-top-gender');
    const bottomGenderSelect = document.getElementById('lofter-bottom-gender');
    if (topGenderSelect) topGenderSelect.value = bodytypeData.topGender || '';
    if (bottomGenderSelect) bottomGenderSelect.value = bodytypeData.bottomGender || '';
  } else {
    if (topBodytypeSelect) topBodytypeSelect.value = '';
    if (bottomBodytypeSelect) bottomBodytypeSelect.value = '';
    if (bodytypeNoteInput) bodytypeNoteInput.value = '';
    
    const topGenderSelect = document.getElementById('lofter-top-gender');
    const bottomGenderSelect = document.getElementById('lofter-bottom-gender');
    if (topGenderSelect) topGenderSelect.value = '';
    if (bottomGenderSelect) bottomGenderSelect.value = '';
  }
}

function saveCurrentCpBodytypes() {
  const selectedCpList = getSelectedCpList();
  if (selectedCpList.length === 0) return;
  
  const cpName = selectedCpList[0];
  const topBodytype = topBodytypeSelect?.value || '';
  const bottomBodytype = bottomBodytypeSelect?.value || '';
  const bodytypeNote = bodytypeNoteInput?.value.trim() || '';
  
  const topGenderSelect = document.getElementById('lofter-top-gender');
  const bottomGenderSelect = document.getElementById('lofter-bottom-gender');
  const topGender = topGenderSelect?.value || '';
  const bottomGender = bottomGenderSelect?.value || '';
  
  saveCpBodytypes(cpName, topBodytype, bottomBodytype, bodytypeNote, topGender, bottomGender);
}

function bindCpCheckboxEvents() {
  likesCpCheckboxList?.addEventListener('click', (event) => {
    const item = event.target.closest('.cp-checkbox-item');
    if (!item) return;
    
    const checkbox = item.querySelector('input[type="checkbox"]');
    const cpName = item.dataset.cp;
    
    if (event.target.tagName !== 'INPUT') {
      checkbox.checked = !checkbox.checked;
    }
    
    item.classList.toggle('selected', checkbox.checked);
    
    saveSelectedCp();
    
    if (checkbox.checked) {
      loadCpBodytypeToUI(cpName);
    }
  });
}

function saveSelectedCp() {
  const checkboxes = likesCpCheckboxList?.querySelectorAll('input[type="checkbox"]:checked') || [];
  const selected = Array.from(checkboxes).map(cb => {
    const item = cb.closest('.cp-checkbox-item');
    return item?.dataset.cp;
  }).filter(Boolean);
  
  localStorage.setItem(SELECTED_CP_KEY, JSON.stringify(selected));
}

function getSelectedCpList() {
  return loadListFromStorage(SELECTED_CP_KEY);
}

function getCurrentContentRating() {
  return localStorage.getItem(CONTENT_RATING_KEY) || 'general';
}

function setContentRating(rating) {
  localStorage.setItem(CONTENT_RATING_KEY, rating);
}

function getCurrentContentLength() {
  return localStorage.getItem(CONTENT_LENGTH_KEY) || 'medium';
}

function setContentLength(length) {
  localStorage.setItem(CONTENT_LENGTH_KEY, length);
}

function bindRatingEvents() {
  const ratingBtns = document.querySelectorAll('.rating-btn');
  
  ratingBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      ratingBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setContentRating(btn.dataset.rating);
    });
  });
  
  const savedRating = getCurrentContentRating();
  ratingBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.rating === savedRating);
  });
}

function bindBodytypeEvents() {
  topBodytypeSelect?.addEventListener('change', saveCurrentCpBodytypes);
  bottomBodytypeSelect?.addEventListener('change', saveCurrentCpBodytypes);
  bodytypeNoteInput?.addEventListener('blur', saveCurrentCpBodytypes);
  
  const topGenderSelect = document.getElementById('lofter-top-gender');
  const bottomGenderSelect = document.getElementById('lofter-bottom-gender');
  topGenderSelect?.addEventListener('change', saveCurrentCpBodytypes);
  bottomGenderSelect?.addEventListener('change', saveCurrentCpBodytypes);
}

function bindLengthEvents() {
  const lengthBtns = document.querySelectorAll('.length-btn');
  
  lengthBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      lengthBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setContentLength(btn.dataset.length);
    });
  });
  
  const savedLength = getCurrentContentLength();
  lengthBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.length === savedLength);
  });
}

function renderCpList() {
  if (!cpListEl) return;
  const list = loadListFromStorage(CP_FOLLOW_KEY);
  if (list.length === 0) {
    cpListEl.innerHTML = '<div class="cp-item">å°šæœªè¨­å??œæ³¨ CP</div>';
    return;
  }
  cpListEl.innerHTML = list.map((item, index) => {
    const cpName = `${item.top} ? ${item.bottom}`;
    const bodytypeData = getCpBodytypes(cpName);
    let infoText = '';
    if (bodytypeData) {
      const parts = [];
      if (bodytypeData.topGender) parts.push(`??${bodytypeData.topGender}`);
      if (bodytypeData.bottomGender) parts.push(`??${bodytypeData.bottomGender}`);
      if (bodytypeData.topBodytype) parts.push(`?»é???${bodytypeData.topBodytype}`);
      if (bodytypeData.bottomBodytype) parts.push(`?—é???${bodytypeData.bottomBodytype}`);
      if (parts.length > 0) infoText = ` <small>(${parts.join('??)})</small>`;
    }
    return `
    <div class="cp-item">
      <span>${escapeHTML(item.top)} ? ${escapeHTML(item.bottom)}${infoText}</span>
      <button type="button" data-remove-index="${index}">ç§»é™¤</button>
    </div>
  `}).join('');
}

function bindCpEvents() {
  cpAddBtn?.addEventListener('click', () => {
    const topName = cpTopSelect?.value || '';
    const bottomName = cpBottomSelect?.value || '';
    if (!topName || !bottomName) {
      alert('è«‹å??¸æ??»æ–¹?‡å??¹è???);
      return;
    }
    
    const discoverTopGender = document.getElementById('lofter-discover-top-gender');
    const discoverBottomGender = document.getElementById('lofter-discover-bottom-gender');
    const discoverTopBodytype = document.getElementById('lofter-discover-top-bodytype');
    const discoverBottomBodytype = document.getElementById('lofter-discover-bottom-bodytype');
    const discoverBodytypeNote = document.getElementById('lofter-discover-bodytype-note');
    
    const topGender = discoverTopGender?.value || '';
    const bottomGender = discoverBottomGender?.value || '';
    const topBodytype = discoverTopBodytype?.value || '';
    const bottomBodytype = discoverBottomBodytype?.value || '';
    const bodytypeNote = discoverBodytypeNote?.value?.trim() || '';
    
    const cpName = `${topName} ? ${bottomName}`;
    
    saveCpBodytypes(cpName, topBodytype, bottomBodytype, bodytypeNote, topGender, bottomGender);
    
    const list = loadListFromStorage(CP_FOLLOW_KEY);
    list.unshift({ top: topName, bottom: bottomName });
    localStorage.setItem(CP_FOLLOW_KEY, JSON.stringify(list));
    renderCpList();
    renderCpCheckboxList();
    
    if (discoverTopGender) discoverTopGender.value = '';
    if (discoverBottomGender) discoverBottomGender.value = '';
    if (discoverTopBodytype) discoverTopBodytype.value = '';
    if (discoverBottomBodytype) discoverBottomBodytype.value = '';
    if (discoverBodytypeNote) discoverBodytypeNote.value = '';
  });

  cpListEl?.addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-remove-index]');
    if (!btn) return;
    const index = Number(btn.dataset.removeIndex);
    const list = loadListFromStorage(CP_FOLLOW_KEY);
    if (Number.isNaN(index)) return;
    list.splice(index, 1);
    localStorage.setItem(CP_FOLLOW_KEY, JSON.stringify(list));
    renderCpList();
    renderCpCheckboxList();
  });
}

function bindNavEvents() {
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      currentPage = item.dataset.page || 'home';
      updatePageView();
      updateViewToggleUI();
      renderFeed();
      if (currentPage === 'home') {
        renderRandomCpFeed();
      }
    });
  });
}

updateViewToggleUI();
updatePageView();
initPostData().then(() => renderFeed());
renderRandomCpFeed();
loadWorldbookEntries();
renderIdeas();
renderLikesIdeas();
const cpPool = [
  ...loadListFromStorage('sx_users'),
  ...loadListFromStorage('sx_characters'),
  ...loadListFromStorage('sx_npcs')
];
renderSelectOptions(cpTopSelect, cpPool, '?¸æ??»æ–¹è§’è‰²');
renderSelectOptions(cpBottomSelect, cpPool, '?¸æ??—æ–¹è§’è‰²');
renderCpList();
renderCpCheckboxList();
loadWorldbookStyleOptions();
bindTabs();
bindViewToggle();
bindFeedEvents();
bindNavEvents();
bindIdeaEvents();
bindLikesIdeaEvents();
bindCpEvents();
bindCpCheckboxEvents();
bindWorldbookCheckboxEvents();
bindStyleSelectEvents();
bindRatingEvents();
bindLengthEvents();
bindBodytypeEvents();
bindFollowEvents(feedEl);
bindFollowEvents(likesFeedEl);
bindFollowEvents(followFeedEl);
renderWorldbookCheckboxList();
console.log('Loaded app: lofter');

window.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;
  if (data.type === 'WORLD_BOOK_UPDATED' || data.type === 'WORLD_BOOK_SYNC_READY') {
    loadWorldbookEntries();
  }
});

if (window.parent && window.parent !== window) {
  window.parent.postMessage({ type: 'REQUEST_WORLD_BOOK_SYNC' }, '*');
}

renderFollowFeed();

document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-page-target]');
  if (!target) return;
  const page = target.dataset.pageTarget;
  if (!page) return;
  currentPage = page;
  updatePageView();
});

const publishBtn = document.querySelector('.publish-btn');
publishBtn?.addEventListener('click', async () => {
  const selectedCpList = getSelectedCpList();
  if (selectedCpList.length === 0) {
    alert('è«‹å??°ã€Œå?æ­¡ã€é??¢é¸?‡è??Ÿæ???CP');
    currentPage = 'likes';
    updatePageView();
    return;
  }
  
  const likesPage = document.querySelector('.page-likes');
  let selectedIdeas = Array.from(likesPage?.querySelectorAll('.idea-card.selected') || []);
  
  if (selectedIdeas.length === 0) {
    const interactionGrid = document.getElementById('interaction-grid');
    const worldsettingGrid = document.getElementById('worldsetting-grid');
    const allCards = [
      ...Array.from(interactionGrid?.querySelectorAll('.idea-card') || []),
      ...Array.from(worldsettingGrid?.querySelectorAll('.idea-card') || [])
    ];
    
    if (allCards.length > 0) {
      const randomCount = Math.min(2, allCards.length);
      const shuffled = allCards.sort(() => Math.random() - 0.5);
      for (let i = 0; i < randomCount; i++) {
        shuffled[i].classList.add('selected');
        shuffled[i].setAttribute('aria-pressed', 'true');
      }
      selectedIdeas = Array.from(likesPage?.querySelectorAll('.idea-card.selected') || []);
    }
  }
  
  if (selectedIdeas.length === 0) {
    alert('?¡æ??¸æ?æ¢—é?ï¼Œè??°ã€Œå?æ­¡ã€é??¢æ??•é¸??);
    currentPage = 'likes';
    updatePageView();
    return;
  }
  
  await handleGenerateFanfic();
});

const worldbookOpenBtn = document.querySelector('.discover-card .discover-action');
worldbookOpenBtn?.addEventListener('click', () => {
  window.parent?.postMessage({ type: 'launchApp', app: 'worldbook' }, '*');
});

const profileSaveBtn = document.querySelector('.page-profile .idea-primary');
const profileNicknameInput = document.querySelector('.page-profile input[type="text"]');
const profileAuthorEl = document.querySelector('.page-profile .author');

profileSaveBtn?.addEventListener('click', () => {
  const nickname = profileNicknameInput?.value.trim();
  if (nickname) {
    localStorage.setItem('sx_lofter_nickname', nickname);
    if (profileAuthorEl) {
      profileAuthorEl.textContent = nickname;
    }
    alert('å·²å„²å­˜æš±ç¨?);
  }
});

const savedNickname = localStorage.getItem('sx_lofter_nickname');
if (savedNickname && profileAuthorEl) {
  profileAuthorEl.textContent = savedNickname;
}
if (savedNickname && profileNicknameInput) {
  profileNicknameInput.value = savedNickname;
}

// ??½è³‡æ??„å?äº‹ä»¶
window.addEventListener('sxiphone-data-restored', (event) => {
  console.log('[Lofter] ?¶åˆ°è³‡æ??„å??šçŸ¥ï¼Œåˆ·??UI...');
  
  const cpPool = [
    ...loadListFromStorage('sx_users'),
    ...loadListFromStorage('sx_characters'),
    ...loadListFromStorage('sx_npcs')
  ];
  renderSelectOptions(cpTopSelect, cpPool, '?¸æ??»æ–¹è§’è‰²');
  renderSelectOptions(cpBottomSelect, cpPool, '?¸æ??—æ–¹è§’è‰²');
  renderCpList();
  renderCpCheckboxList();
  loadWorldbookEntries();
  renderFollowFeed();
  initPostData().then(() => renderFeed());
  
  const nickname = localStorage.getItem('sx_lofter_nickname');
  if (nickname && profileAuthorEl) {
    profileAuthorEl.textContent = nickname;
  }
  if (nickname && profileNicknameInput) {
    profileNicknameInput.value = nickname;
  }
});

