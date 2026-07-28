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

const hotTags = ['#同人文', '#原作補完', '#連載更新', '#角色獨白', '#世界觀考據', '#AU創作', '#接龍活動'];
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
  '夜貓子', '路人甲', '匿名用戶', '潛水員', '路人乙',
  '小透明', '吃瓜群眾', '佛系青年', '鹹魚一條', '摸魚達人',
  '社畜日常', '打工人', '搬磚人', '碼農一號', '設計師阿',
  '前端仔', '後端佬', '產品汪', '運營喵', '測試猿',
  '實習生小王', '老員工張叔', '新來的小李', '隔壁老王', '樓下小陳',
  '某不知名網友', '路過的', '隨便看看', '純路人', '吃瓜群眾',
  '圍觀群眾', '路人丙', '匿名發言', '不想取名', '隨便叫啥',
  '用戶12345', 'id已隱藏', '神秘人', '路人丁', '過客',
  '路人戊', '路人己', '路人庚', '路人辛', '路人壬'
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
    title: 'ABO 設定',
    desc: 'Alpha/Beta/Omega 三種第二性別，基於信息素與生理本能的階級社會。包含標記、發情期、成結等機制。',
    tags: ['#ABO', '#世界觀']
  },
  {
    title: '哨兵嚮導',
    desc: '感官極端敏銳的哨兵與精神力量強大的嚮導。包含精神體、精神圖景、結合等設定。',
    tags: ['#哨兵嚮導', '#世界觀']
  },
  {
    title: '哈利波特',
    desc: '隱藏在現代倫敦之下的魔法世界。霍格華茲學院制、魔杖、血統歧視與黑魔法防禦。',
    tags: ['#HP', '#魔法校園']
  },
  {
    title: '日式高中校園',
    desc: '青春曖昧的校園生活。學長姐制度、社團活動、文化祭、屋頂告白。',
    tags: ['#校園', '#青春']
  },
  {
    title: '美國大學生活',
    desc: '兄弟會姊妹會文化、派對、校園運動賽事、宿舍生活與獨立探索。',
    tags: ['#大學', '#美式']
  },
  {
    title: '辦公室職場',
    desc: '權力等級與禁止戀愛的辦公室。上下級關係、茶水間八卦、加班與秘密戀情。',
    tags: ['#職場', '#辦公室']
  },
  {
    title: '韓國 Idol',
    desc: '華麗舞臺背後的殘酷。練習生制度、戀愛禁令、宿舍生活與私生飯困擾。',
    tags: ['#K-Pop', '#偶像']
  },
  {
    title: '現代搖滾樂團',
    desc: '叛逆與夢想的音樂世界。地下Live House、巡迴旅程、成員間的羈絆與矛盾。',
    tags: ['#樂團', '#搖滾']
  },
  {
    title: '歐洲中世紀宮廷',
    desc: '繁文縟節下的權力鬥爭。貴族等級、政治聯姻、舞會密謀與騎士精神。',
    tags: ['#中世紀', '#宮廷']
  },
  {
    title: '靈魂伴侶設定',
    desc: '每個人出生時就註定有一個完美的另一半。色盲模式、文字標記、傷痕共享、倒計時等表現形式。',
    tags: ['#Soulmate', '#宿命']
  },
  {
    title: '花吐症',
    desc: '單戀時肺部會生長出花朵，隨咳嗽吐出花瓣。唯有對方的愛能治癒，或手術移除但失去愛意。',
    tags: ['#花吐症', '#虐心']
  },
  {
    title: '賽博龐克',
    desc: '高科技但腐敗的未來世界。義體改造、神經連接、企業高層與底層傭兵的階級對立。',
    tags: ['#賽博龐克', '#科幻']
  },
  {
    title: '無限流',
    desc: '被拉入神秘副本，必須遵守特定規則才能生存。生存壓力下的信任與依賴。',
    tags: ['#無限流', '#生存']
  },
  {
    title: '荒島求生',
    desc: '文明毀滅後的世界或受困無人地帶。物資匱乏、高度依賴、在絕望中建立小小樂園。',
    tags: ['#末世', '#求生']
  }
];

const interactionTropes = [
  {
    title: '重逢',
    desc: '多年後再次相遇，彼此都變了卻又沒變。',
    tags: ['#重逢', '#情感']
  },
  {
    title: '誤會解開',
    desc: '一直以來的誤會終於解開，但似乎太遲了。',
    tags: ['#誤會', '#虐心']
  },
  {
    title: '雨中',
    desc: '下雨天的偶遇，改變了兩個人的命運。',
    tags: ['#雨', '#浪漫']
  },
  {
    title: '告白',
    desc: '終於鼓起勇氣說出心意。',
    tags: ['#告白', '#甜']
  },
  {
    title: '分離',
    desc: '不得不分開，但約定會再見。',
    tags: ['#分離', '#約定']
  },
  {
    title: '守護',
    desc: '默默守護在身邊，不求回報。',
    tags: ['#守護', '#暗戀']
  },
  {
    title: '回憶',
    desc: '回憶起過去的點點滴滴。',
    tags: ['#回憶', '#過去']
  },
  {
    title: '契約關係',
    desc: '因利益被迫假扮情侶或夫妻。同居生活、公眾演出，日久生情的甜蜜過程。',
    tags: ['#假戲真做', '#契約']
  },
  {
    title: '死對頭',
    desc: '雙方處於完全對立的立場。針鋒相對的張力、被迫合作時的糾結、隱藏的吸引力。',
    tags: ['#宿敵', '#對立']
  },
  {
    title: '嚮往平凡的怪物',
    desc: '非人類（AI、吸血鬼、外星人、人魚）試圖理解人類情感。跨物種的溝通障礙與笨拙溫情。',
    tags: ['#非人類', '#跨物種']
  },
  {
    title: '身體互換',
    desc: '因意外或詛咒交換靈魂/身體。必須代替對方生活，發現隱藏的秘密與傷痛。',
    tags: ['#身體互換', '#靈魂']
  },
  {
    title: '只有一張床',
    desc: '旅店客滿或受困避難所，只剩一個房間一張床。誰睡地板？還是擠在一起？背對背的僵硬到半夜翻身入懷。',
    tags: ['#被迫近距離', '#一張床']
  },
  {
    title: '狹小空間受困',
    desc: '電梯故障、躲避敵人的衣櫃、狹窄巷弄。必須緊貼對方，感受呼吸、心跳與體溫。',
    tags: ['#被迫近距離', '#密閉空間']
  },
  {
    title: '取暖',
    desc: '暴風雪受困、掉入冰冷湖水。為了生存必須緊擁傳遞體溫，從生存本能轉化為性張力。',
    tags: ['#被迫近距離', '#生存']
  },
  {
    title: '誰弄傷你的',
    desc: '一方受傷回來，另一方雖平時冷淡，看到傷口瞬間暴怒或極度心疼。包紮傷口的細膩與佔有欲。',
    tags: ['#照顧', '#保護欲']
  },
  {
    title: '病弱照顧',
    desc: '發高燒、意識模糊，平時強勢的角色變得像小孩一樣依賴。餵藥、擦汗、半夢半醒間的真情流露。',
    tags: ['#照顧', '#脆弱']
  },
  {
    title: '噩夢與安撫',
    desc: '深夜因創傷驚醒。另一方給予擁抱、摸頭、輕聲安慰，展現只給對方的柔軟面。',
    tags: ['#照顧', '#安撫']
  },
  {
    title: '酒後吐真言',
    desc: '微醺或大醉。平時不敢說的話、不敢做的親暱行為全都爆發。隔天醒來後的尷尬期。',
    tags: ['#失控', '#告白']
  },
  {
    title: '真言劑/詛咒',
    desc: '被迫必須說真話，或必須進行親密舉動才能解除的詛咒。拼命忍耐但最終失敗的掙扎感。',
    tags: ['#失控', '#魔法']
  },
  {
    title: '那個「噢」的時刻',
    desc: '好友或死對頭在某個平凡瞬間（如陽光下回頭一笑），突然意識到：「糟了，我愛上他了。」',
    tags: ['#失控', '#覺醒']
  },
  {
    title: '手把手教學',
    desc: '教射箭、鋼琴、撞球、寫字。從背後環繞的姿勢，手掌覆蓋在手背上，耳邊的低聲指導。',
    tags: ['#肢體張力', '#教學']
  },
  {
    title: '整理衣物',
    desc: '出席正式場合前，幫對方打領帶、翻領子、撥開額前碎髮。極近距離的眼神交織，呼吸交錯。',
    tags: ['#肢體張力', '#親密']
  },
  {
    title: '身高差/體型差',
    desc: '拿不到高處東西、衣服太過寬大。高的一方從後方幫忙拿東西，或一方穿著另一方寬大的襯衫。',
    tags: ['#肢體張力', '#體型差']
  },
  {
    title: '雙向暗戀',
    desc: '兩個人都覺得對方不喜歡自己，都在瘋狂試探。刻意避開的眼神、對他人接近的微小嫉妒。',
    tags: ['#暗潮洶湧', '#暗戀']
  },
  {
    title: '秘密盟友',
    desc: '眾人面前裝作不熟或敵對，私底下卻有深厚聯繫。桌子底下的勾腳、只有兩人懂的暗號。',
    tags: ['#暗潮洶湧', '#秘密']
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
  return await sxGetJSON(key);
}

async function setStorageItem(key, value) {
  return await sxSetJSON(key, value);
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
  const followList = await loadListFromStorage(FOLLOW_POST_KEY);
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
            <div class="meta">${escapeHTML(post.category)} · ${escapeHTML(post.time)}</div>
          </div>
          <button class="more-btn" type="button" aria-label="更多選項"><i class="fas fa-ellipsis"></i></button>
        </header>
        <div class="post-full-content">${escapeHTML(post.fullContent || post.excerpt || post.text)}</div>
        <div class="post-tags">${post.tags.map(tag => `<span class="post-tag">${escapeHTML(tag)}</span>`).join('')}</div>
        <footer class="post-actions">
          <button class="action like-action" type="button">
            <i class="far fa-heart"></i><span>${post.likes}</span>
          </button>
          <button class="action" type="button"><i class="far fa-comment"></i><span>${post.comments}</span></button>
          <button class="action follow-action ${isFollowed ? 'is-followed' : ''}" type="button"><i class="${isFollowed ? 'fas' : 'far'} fa-star"></i><span>${isFollowed ? '已追蹤' : '追蹤'}</span></button>
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
  const followLabel = post.isFollowed ? '已追蹤' : '追蹤';
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
            <div class="meta">${escapeHTML(post.category)} · ${escapeHTML(post.time)}</div>
          </div>
          <button class="more-btn" type="button" aria-label="更多選項"><i class="fas fa-ellipsis"></i></button>
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
    viewToggleBtn.innerHTML = '<i class="fas fa-list"></i><span>列表流</span>';
  } else {
    viewToggleBtn.dataset.view = 'list';
    viewToggleBtn.classList.remove('is-waterfall');
    viewToggleBtn.setAttribute('aria-pressed', 'false');
    viewToggleBtn.innerHTML = '<i class="fas fa-grip"></i><span>瀑布流</span>';
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
  container?.addEventListener('click', async (event) => {
    const followBtn = event.target.closest('.follow-action');
    if (!followBtn) return;
    const card = event.target.closest('.post-card');
    if (!card) return;
    
    const title = card.querySelector('.post-title')?.textContent || '未命名文章';
    const author = card.querySelector('.author')?.textContent || '匿名作者';
    const fullContent = card.querySelector('.post-full-content')?.textContent || '';
    const category = card.querySelector('.meta')?.textContent?.split('·')[0]?.trim() || '同人文';
    
    const list = await loadListFromStorage(FOLLOW_POST_KEY);
    const exists = list.find(item => item.title === title && item.author === author);
    
    if (exists) {
      const index = list.findIndex(item => item.title === title && item.author === author);
      if (index >= 0) {
        list.splice(index, 1);
        await setStorageItem(FOLLOW_POST_KEY, list);
        followBtn.classList.remove('is-followed');
        followBtn.querySelector('i').className = 'far fa-star';
        followBtn.querySelector('span').textContent = '追蹤';
      }
    } else {
      list.unshift({ 
        title, 
        author, 
        time: '剛剛', 
        status: '連載中',
        fullContent,
        category
      });
      await setStorageItem(FOLLOW_POST_KEY, list);
      followBtn.classList.add('is-followed');
      followBtn.querySelector('i').className = 'fas fa-star';
      followBtn.querySelector('span').textContent = '已追蹤';
    }
    
    await renderFollowFeed();
  });
}

async function callAIAPI(payload) {
  const apisRaw = await sxGetItem('api_configs');
  console.log('[Lofter] api_configs raw:', apisRaw);
  
  const apis = JSON.parse(apisRaw || '[]');
  console.log('[Lofter] parsed apis:', apis);
  console.log('[Lofter] apis count:', apis.length);
  
  const activeIndex = parseInt(await sxGetItem('sx_active_api') || '0', 10);
  console.log('[Lofter] active index:', activeIndex);
  
  const config = apis[activeIndex] || apis[0];
  console.log('[Lofter] selected config:', config);
  
  if (!config) {
    throw new Error('未設定 API，請至設定頁面配置（沒有找到任何 API 設定）');
  }
  if (!config.url && config.type !== 'gemini') {
    throw new Error('API URL 未設定，請至設定頁面配置');
  }
  if (!config.key) {
    throw new Error('API Key 未設定，請至設定頁面配置');
  }
  
  const apiType = config.type || 'openai';
  
  // Gemini 原生 API 格式
  if (apiType === 'gemini') {
    const model = config.model || 'gemini-1.5-flash';
    const targetUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + config.key;
    
    console.log('[Lofter] 調用 Gemini API, 模型:', model);
    
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
      throw new Error('Gemini API 錯誤: ' + response.status + ' - ' + errorText);
    }
    
    const data = await response.json();
    if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
  
  // OpenAI 相容格式或自訂端點
  let targetUrl;
  if (apiType === 'custom') {
    targetUrl = config.url;
  } else {
    targetUrl = config.url.endsWith('/chat/completions') ? config.url : config.url.replace(/\/$/, '') + '/chat/completions';
  }
  
  console.log('[Lofter] 調用 API:', targetUrl);
  console.log('[Lofter] Payload:', JSON.stringify(payload, null, 2));
  
  const fetchWithTimeout = (url, options, timeoutMs) => {
    return new Promise((resolve, reject) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        reject(new Error(`請求逾時 (${timeoutMs / 1000}秒)`));
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
      console.log(`[Lofter] 嘗試生成 (第 ${retryCount + 1} 次)，逾時: ${timeoutMs / 1000}秒`);

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
            errorDetail = '無法讀取錯誤內容';
          }
        }
        const errorMsg = `API 請求失敗
狀態碼: ${response.status} ${response.statusText}
URL: ${targetUrl}
錯誤詳情: ${errorDetail}`;
        console.error('[Lofter] API 錯誤:', errorMsg);
        throw new Error(errorMsg);
      }
      
      const data = await response.json();
      if (data.error) {
        const errorMsg = `API 回傳錯錯誤
錯誤類型: ${data.error.type || '未知'}
錯誤訊息: ${data.error.message || JSON.stringify(data.error)}`;
        console.error('[Lofter] API 回傳錯誤:', errorMsg);
        throw new Error(errorMsg);
      }
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        const errorMsg = `API 回應格式錯誤
回應內容: ${JSON.stringify(data, null, 2)}`;
        console.error('[Lofter] API 回應格式錯誤:', errorMsg);
        throw new Error(errorMsg);
      }
      
      console.log('[Lofter] 生成成功');
      return data.choices[0].message.content;

    } catch (err) {
      lastError = err;
      retryCount++;
      console.warn(`[Lofter] 第 ${retryCount} 次嘗試失敗:`, err.message);
      
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        const errorMsg = `網路請求失敗
錯誤類型: 網路錯誤
URL: ${targetUrl}
可能原因: 
1. API URL 不正確
2. CORS 跨域問題
3. 網路連線異常
4. API 伺服器無回應
原始錯誤: ${err.message}`;
        console.error('[Lofter] 網路錯誤:', errorMsg);
      }
      
      if (retryCount < maxRetries) {
        console.log(`[Lofter] 等待 2 秒後重試...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  throw new Error(`${lastError?.message || '未知錯誤'}（已嘗試 ${maxRetries} 次）`);
}

async function getWorldbookData() {
  const selectedIds = await getSelectedWorldbookIds();
  const selectedSet = new Set(selectedIds);
  
  const categories = ['cot', 'style', 'global', 'keywords', 'backend'];
  const result = {};
  
  for (const cat of categories) {
    const key = `sx_worldbook_${cat}`;
    const list = await sxGetJSON(key);
    if (!list) continue;
    try {
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
  }
  return result;
}

async function getWorldbookDataForPrompt() {
  const worldbook = await getWorldbookData();
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

async function getCotDataForPrompt() {
  const key = 'sx_worldbook_cot';
  const list = await sxGetJSON(key);
  if (!list) return '';
  
  try {
    if (!Array.isArray(list) || list.length === 0) return '';
    
    let cotContent = '\n# 思考參考（以下內容僅供你思考參考，嚴禁在文章中提及或引用）\n';
    list.slice(0, 5).forEach(item => {
      if (item && item.content) {
        cotContent += `${item.content.slice(0, 500)}\n`;
      }
    });
    cotContent += '\n**重要提醒：以上思考內容僅供你理解創作方向，絕對不可在文章中出現任何相關內容或提及。**\n';
    
    return cotContent;
  } catch (e) {
    return '';
  }
}

async function getCharacterData(name) {
  const list = await sxGetJSON('sx_characters');
  if (!list) {
    const charName = await sxGetItem('sx_char_name');
    if (name === charName || !name) {
      return {
        name: charName || 'AI 助理',
        personality: await sxGetItem('sx_char_personality') || '',
        background: await sxGetItem('sx_char_background') || '',
        avatar: await sxGetItem('sx_char_avatar') || ''
      };
    }
    return null;
  }
  try {
    const found = list.find(c => c.name === name);
    if (found) return found;
    
    const charName = await sxGetItem('sx_char_name');
    if (name === charName || !name) {
      return {
        name: charName || 'AI 助理',
        personality: await sxGetItem('sx_char_personality') || '',
        background: await sxGetItem('sx_char_background') || '',
        avatar: await sxGetItem('sx_char_avatar') || ''
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function getUserData() {
  return {
    name: await sxGetItem('sx_user_name') || 'User',
    personality: await sxGetItem('sx_user_personality') || '',
    background: await sxGetItem('sx_user_background') || ''
  };
}

async function getChatHistory(limit = 20) {
  const history = await sxGetJSON('sx_chat_history');
  if (!history) return [];
  try {
    return history.slice(-limit);
  } catch {
    return [];
  }
}

async function buildFanficPrompt(cp, worldSettings, interactions, npcs, style, styleRef, isR18, topBodytype, bottomBodytype, bodytypeNote, topGender, bottomGender) {
  const [topName, bottomName] = cp.split(' × ');
  const topChar = await getCharacterData(topName);
  const bottomChar = await getCharacterData(bottomName);
  const user = await getUserData();
  const worldbook = await getWorldbookDataForPrompt();
  const cotContent = await getCotDataForPrompt();
  const chatHistory = await getChatHistory(20);
  
  const memoryRaw = await sxGetItem('sx_memory_tables') || await sxGetItem('sx_chat_memory');
  let memoryContext = '';
  if (memoryRaw) {
    try {
      const memory = JSON.parse(memoryRaw);
      if (Array.isArray(memory) && memory.length > 0) {
        memoryContext = '\n# 記憶摘要\n';
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
    worldbookContext = '\n# 參考資料（僅供創作參考，請勿在文章中直接引用或提及這些內容）\n';
    for (const [cat, entries] of Object.entries(worldbook)) {
      if (entries && entries.length > 0) {
        entries.slice(0, 8).forEach(e => {
          if (e.title && e.content) {
            worldbookContext += `- ${e.content.slice(0, 300)}\n`;
          }
        });
      }
    }
    worldbookContext += '\n注意：以上資料僅供你理解角色與世界觀，請將其自然融入故事中，不要在文章中提及「世界書」、「設定」等詞彙。\n';
  }

  let characterContext = '\n# 角色設定\n';
  if (topChar) {
    characterContext += `\n## ${topName}（攻方）\n- 性別: ${topGender || '未指定'}\n- 性格: ${topChar.personality || '未知'}\n- 背景: ${topChar.background || '未知'}\n`;
    if (topChar.worldBook) {
      characterContext += `- 世界書參考: ${topChar.worldBook}\n`;
    }
  } else {
    characterContext += `\n## ${topName}（攻方）\n- 性別: ${topGender || '未指定'}\n- 請根據角色名稱推測性格與背景\n`;
  }
  if (bottomChar) {
    characterContext += `\n## ${bottomName}（受方）\n- 性別: ${bottomGender || '未指定'}\n- 性格: ${bottomChar.personality || '未知'}\n- 背景: ${bottomChar.background || '未知'}\n`;
    if (bottomChar.worldBook) {
      characterContext += `- 世界書參考: ${bottomChar.worldBook}\n`;
    }
  } else {
    characterContext += `\n## ${bottomName}（受方）\n- 性別: ${bottomGender || '未指定'}\n- 請根據角色名稱推測性格與背景\n`;
  }

  let bodytypeContext = '';
  const hasBodytypeSetting = topBodytype || bottomBodytype || bodytypeNote || topGender || bottomGender;
  
  if (hasBodytypeSetting) {
    bodytypeContext = '\n# 角色體型與性別設定（重要）\n';
    bodytypeContext += '- 預設角色體型為勻稱有肉，不是骨感或過瘦的身材\n';
    bodytypeContext += '- 請根據以下設定描寫角色體型，不要將角色過度瘦化或弱化\n';
    bodytypeContext += '- 請嚴格遵守角色性別設定，避免混淆男女性角色\n\n';
    
    if (topGender) {
      bodytypeContext += `- ${topName}（攻方）性別: ${topGender}\n`;
    }
    
    if (topBodytype) {
      bodytypeContext += `- ${topName}（攻方）體型: ${topBodytype}\n`;
      if (topBodytype.includes('骨感') || topBodytype.includes('瘦削')) {
        bodytypeContext += `  - 注意：此為較瘦體型，但仍需保持健康感，避免過度病態描寫\n`;
      }
      if (topBodytype === '圓潤柔軟') {
        bodytypeContext += `  - 圓潤柔軟體型特徵：看不到鎖骨、沒有腰窩、有手臂肉、肚子肉、小腹\n`;
      }
    } else {
      bodytypeContext += `- ${topName}（攻方）體型: 勻稱有肉（默認）\n`;
    }
    
    if (bottomGender) {
      bodytypeContext += `- ${bottomName}（受方）性別: ${bottomGender}\n`;
    }
    
    if (bottomBodytype) {
      bodytypeContext += `- ${bottomName}（受方）體型: ${bottomBodytype}\n`;
      if (bottomBodytype.includes('骨感') || bottomBodytype.includes('瘦削')) {
        bodytypeContext += `  - 注意：此為較瘦體型，但仍需保持健康感，避免過度病態描寫\n`;
      }
      if (bottomBodytype === '圓潤柔軟') {
        bodytypeContext += `  - 圓潤柔軟體型特徵：看不到鎖骨、沒有腰窩、有手臂肉、肚子肉、小腹\n`;
      }
    } else {
      bodytypeContext += `- ${bottomName}（受方）體型: 勻稱有肉（默認）\n`;
    }
    
    if (bodytypeNote) {
      bodytypeContext += `- 體型備註: ${bodytypeNote}\n`;
    }
    bodytypeContext += '\n請嚴格遵守以上體型與性別設定進行描寫。\n';
  } else {
    bodytypeContext = '\n# 角色體型與性別設定（重要）\n';
    bodytypeContext += '- 兩位角色皆為勻稱有肉的正常體型，不是骨感或過瘦的身材\n';
    bodytypeContext += '- 請勿將角色描寫成過於骨感、瘦弱或弱化任何一方\n';
    bodytypeContext += '- 女性角色應有自然的曲線與肉感，不是紙片人身材\n';
    bodytypeContext += '- 男性角色應有適度的肌肉與體格，不是過度瘦弱的身材\n';
    bodytypeContext += '- 請根據角色名稱判斷性別，並在描寫時保持一致\n';
  }

  let npcContext = '';
  if (npcs && npcs.length > 0) {
    npcContext = '\n# NPC 角色\n';
    npcs.forEach(npc => {
      npcContext += `\n## ${npc.name}\n- 與 User 的關係: ${npc.relationship || '好友'}\n- 互動性質: 友情向，不涉及愛情或曖昧\n`;
    });
  }

  let historyContext = '';
  if (chatHistory.length > 0) {
    historyContext = '\n# 近期對話紀錄（可作為互動參考）\n';
    chatHistory.forEach(msg => {
      const role = msg.role === 'user' ? user.name : (msg.role === 'assistant' ? '角色' : msg.role);
      historyContext += `${role}: ${msg.content.slice(0, 150)}\n`;
    });
  }

  let worldSettingList = '';
  if (worldSettings && worldSettings.length > 0) {
    worldSettingList = '\n# 世界觀設定\n' + worldSettings.map(s => `- ${s.title}: ${s.desc}`).join('\n');
  }

  let interactionList = '';
  if (interactions && interactions.length > 0) {
    interactionList = '\n# 互動梗\n' + interactions.map(i => `- ${i.title}: ${i.desc}`).join('\n');
  }

  const lang = await sxGetItem('sxiphone_lang') || 'zh-TW';
  const contentLength = getCurrentContentLength();
  
  let lengthInstruction = '';
  let wordCountRequirement = '';
  
  if (contentLength === 'short') {
    lengthInstruction = '這是一篇短篇同人文，請精簡但完整地敘述故事。';
    wordCountRequirement = '**字數約 1000 字左右**';
  } else if (contentLength === 'medium') {
    lengthInstruction = '這是一篇長篇同人文，請詳細描寫場景、對話與心理活動。';
    wordCountRequirement = '**字數必須 2000-5000 字**';
  } else if (contentLength === 'series') {
    lengthInstruction = '這是一個連載系列的開篇，請為後續發展埋下伏筆，故事要有延續性。';
    wordCountRequirement = '**字數約 1500-2000 字，作為連載的第一章**';
  }
  
  let r18Instruction = '';
  if (isR18) {
    r18Instruction = `
# 成人內容創作要求（R18，必須執行）
**這是一篇成人向同人創作，你必須包含以下內容：**

## 必須包含的描寫
1. **完整的性愛場景**：必須有從前戲到結束的完整過程，不能跳過或模糊帶過
2. **感官細節**：觸感、溫度、聲音、氣味、視覺的細膩描寫
3. **身體反應**：生理反應如顫抖、喘息、出汗、肌肉緊繃等
4. **心理活動**：角色在親密過程中的情感波動和內心想法
5. **對話與互動**：親密過程中的對話、呻吟、請求等

## 描寫要求
- 使用具體、露骨但不低俗的詞彙
- 每個性愛場景至少 500 字以上
- 必須有至少一個完整的性愛場景
- 描寫要符合角色性格，保持人物一致性
- 包含安全性行為（如使用保險套等）

## 禁止事項
- 禁止使用「然後他們...」等模糊跳過
- 禁止只描寫親吻和擁抱就結束
- 禁止用「春宵一刻」等成語帶過
- 必須實際描寫性愛過程的細節`;
  }

  let npcInstruction = '';
  if (npcs && npcs.length > 0) {
    npcInstruction = `
# NPC 互動指引
- NPC 是 User 的好友，與 User 有良好的友情互動
- NPC 不會介入 CP 之間的愛情關係，不會有曖昧或愛情向的互動
- NPC 可以作為旁觀者、助攻者、或共同經歷事件的夥伴
- NPC 與 CP 角色的互動要自然，符合友情關係`;
  }

  return `你是一位專業的同人文作家，擅長根據角色設定和世界觀創作符合人物性格的同人文。請根據以下設定創作一篇同人文。
${cotContent}
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

# 使用者
- 名稱: ${user.name}
- 性格: ${user.personality || '未知'}
- 背景: ${user.background || '未知'}

# CP 配對
${topName} × ${bottomName}

# 創作要求
- 文風: ${style}
${styleRef ? `- 參考文風: ${styleRef}` : ''}
- ${lengthInstruction}

# 輸出規範（非常重要）
1. 使用 ${lang} 撰寫
2. 保持角色性格一致，嚴格符合角色設定
3. 自然融入世界觀設定，讓世界觀細節豐富故事
4. ${wordCountRequirement}
5. 包含標題、正文
6. 需要有完整的場景描寫、對話、心理活動
7. 情節要有起承轉合，不能只是片段
8. 角色互動要自然，符合 CP 關係
9. **嚴格禁止在文章中提及或引用任何 COT、思維鏈、思考參考的內容**
10. **禁止在文章中提及任何設定資料來源，包括但不限於：世界書、設定檔、參考資料等**
11. **禁止使用「根據設定」、「如世界書所述」等元敘述，所有設定都應自然融入故事中**

請直接輸出同人文內容，格式如下：
【標題】...
【正文】...`;
}

async function generateFanfic(cp, worldSettings, interactions, npcs, style, styleRef, isR18, topBodytype, bottomBodytype, bodytypeNote, topGender, bottomGender) {
  const prompt = await buildFanficPrompt(cp, worldSettings, interactions, npcs, style, styleRef, isR18, topBodytype, bottomBodytype, bodytypeNote, topGender, bottomGender);
  const payload = [
    { role: 'system', content: '你是一位專業的同人文作家，擅長根據角色設定和世界觀創作符合人物性格的同人文。' },
    { role: 'user', content: prompt }
  ];
  return await callAIAPI(payload);
}

function parseGeneratedContent(text) {
  const titleMatch = text.match(/【標題】([^\n]+)/);
  const contentMatch = text.match(/【正文】([\s\S]*)/);
  const title = titleMatch ? titleMatch[1].trim() : '無標題';
  let content = contentMatch ? contentMatch[1].trim() : text;
  
  content = content
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\[監控[^\]]*\][\s\S]*?(?=\n\n|\n【|$)/gi, '')
    .replace(/教授[ABＡＢ]（[^）]+）[：:][\s\S]*?(?=\n\n|\n教授|\n【|$)/gi, '')
    .replace(/教授[ABＡＢ][：:][\s\S]*?(?=\n\n|\n教授|\n【|$)/gi, '')
    .replace(/（美學）[：:][\s\S]*?(?=\n\n|\n（|\n【|$)/gi, '')
    .replace(/（心理）[：:][\s\S]*?(?=\n\n|\n（|\n【|$)/gi, '')
    .replace(/邏輯與禁令[：:][\s\S]*?(?=\n\n|\n-|\n【|$)/gi, '')
    .replace(/^\s*[-•·]\s*[^\n]*?(?:霸總|語氣|侵略性|中性|物理|動詞|明喻|擬人|信息素|腺體|記憶|衰退|水漬|鏡面|污染)[^\n]*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  const wordCount = content.replace(/\s/g, '').length;
  const contentLength = getCurrentContentLength();
  
  if (contentLength === 'short' && wordCount < 800) {
    console.warn(`生成的同人文字數不足 800 字（目前 ${wordCount} 字）`);
  } else if (contentLength === 'medium' && wordCount < 1500) {
    console.warn(`生成的同人文字數不足 1500 字（目前 ${wordCount} 字）`);
  } else if (contentLength === 'series' && wordCount < 1000) {
    console.warn(`生成的同人文字數不足 1000 字（目前 ${wordCount} 字）`);
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
    alert('正在生成中，請稍候...');
    return;
  }

  const selectedCpList = await getSelectedCpList();
  console.log('[Lofter] 選擇的 CP:', selectedCpList);
  
  if (selectedCpList.length === 0) {
    alert('請先選擇至少一組 CP');
    return;
  }

  const selectedWorldSettings = await getSelectedWorldSettings();
  const selectedInteractions = await getSelectedInteractions();
  console.log('[Lofter] 選擇的世界觀:', selectedWorldSettings);
  console.log('[Lofter] 選擇的互動梗:', selectedInteractions);
  
  if (selectedWorldSettings.length === 0 && selectedInteractions.length === 0) {
    alert('請先選擇至少一個世界觀或互動梗');
    return;
  }

  const selectedNpcs = await getSelectedNpcs();
  console.log('[Lofter] 選擇的 NPC:', selectedNpcs);

  const style = likesStyleSelect?.value || '細膩';
  let styleRef = likesStyleRef?.value.trim();

  if (style === 'custom-worldbook') {
    const entries = await loadListFromStorage('sx_worldbook_style');
    const selectedIndex = parseInt(worldbookStyleSelect?.value, 10);
    if (entries[selectedIndex]) {
      styleRef = entries[selectedIndex].content || styleRef;
    }
  }

  const isR18 = await getCurrentContentRating() === 'r18';
  
  const topBodytype = topBodytypeSelect?.value || '';
  const bottomBodytype = bottomBodytypeSelect?.value || '';
  const bodytypeNote = bodytypeNoteInput?.value.trim() || '';
  
  const topGenderSelect = document.getElementById('lofter-top-gender');
  const bottomGenderSelect = document.getElementById('lofter-bottom-gender');
  const topGender = topGenderSelect?.value || '';
  const bottomGender = bottomGenderSelect?.value || '';
  
  await saveCurrentCpBodytypes();

  isGenerating = true;
  if (likesGenerateBtn) {
    likesGenerateBtn.disabled = true;
    likesGenerateBtn.textContent = '生成中...';
  }
  
  const publishBtn = document.querySelector('.publish-btn');
  if (publishBtn) {
    publishBtn.disabled = true;
    publishBtn.classList.add('generating');
    publishBtn.innerHTML = '<i class="fas fa-pen-nib"></i><span>生成中...</span>';
  }

  try {
    const generatedPosts = [];
    const contentLength = await getCurrentContentLength();
    const lengthLabel = contentLength === 'short' ? '短篇' : (contentLength === 'medium' ? '長篇' : '連載');
    
    for (const cp of selectedCpList) {
      const cpBodytypeData = await getCpBodytypes(cp);
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
        tags.push('#車文');
      }
      if (selectedNpcs.length > 0) {
        tags.push('#多人互動');
      }

      const post = {
        author: getRandomAuthorName(),
        category: `同人文 · ${cp} · ${style} · ${lengthLabel}${isR18 ? ' · R18' : ''}`,
        title: parsed.title,
        summary: isR18 ? `⚠️ 車文 - ${parsed.content.slice(0, 70)}` : parsed.content.slice(0, 100),
        text: parsed.content.slice(0, 200) + '...',
        excerpt: parsed.content.slice(0, 300),
        fullContent: parsed.content,
        tags,
        time: '剛剛',
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
    
    const cpNames = selectedCpList.join('、');
    alert(`✅ 已為 ${cpNames} 生成 ${generatedPosts.length} 篇同人文`);
  } catch (err) {
    console.error('[Lofter] 生成失敗完整錯誤:', err);
    const errorInfo = `❌ 生成失敗

${err.message}

請檢查:
1. API URL 是否正確
2. API Key 是否有效
3. 模型名稱是否支援
4. 網路連線是否正常`;
    alert(errorInfo);
  } finally {
    isGenerating = false;
    if (likesGenerateBtn) {
      likesGenerateBtn.disabled = false;
      likesGenerateBtn.textContent = '生成同人文';
    }
    if (publishBtn) {
      publishBtn.disabled = false;
      publishBtn.classList.remove('generating');
      publishBtn.innerHTML = '<i class="fas fa-pen-nib"></i><span>發佈</span>';
    }
  }
}

const originalLikesGenerateHandler = likesGenerateBtn?.onclick;
likesGenerateBtn?.removeEventListener('click', originalLikesGenerateHandler);
likesGenerateBtn?.addEventListener('click', handleGenerateFanfic);

async function renderFollowFeed() {
  if (!followFeedEl) return;
  const list = await loadListFromStorage(FOLLOW_POST_KEY);
  if (list.length === 0) {
    followFeedEl.innerHTML = '<div class="empty-state"><i class="far fa-star"></i><p>尚未追蹤任何文章</p><p class="empty-hint">在文章中點擊「追蹤」按鈕即可追蹤</p></div>';
    return;
  }
  
  const generated = list.map((item, index) => ({
    author: item.author,
    category: item.category || `追蹤中 · ${item.status}`,
    title: item.title,
    summary: item.fullContent ? item.fullContent.slice(0, 100) + '...' : 'AI 續寫已準備，點擊可生成下一篇章。',
    text: item.fullContent || 'AI 續寫已準備，點擊可生成下一篇章。',
    excerpt: item.fullContent || '追蹤此作品後，系統會依據文筆與設定自動延伸續集。',
    fullContent: item.fullContent || '',
    tags: ['#連載', '#追蹤中'],
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

async function renderLikesIdeas() {
  renderWorldSettings();
  renderInteractionTropes();
  await renderNpcCheckboxList();
}

async function renderNpcCheckboxList() {
  const npcList = document.getElementById('lofter-npc-checkbox-list');
  if (!npcList) return;
  
  const npcPool = await loadListFromStorage('sx_npcs') || [];
  const characters = await loadListFromStorage('sx_characters') || [];
  const allNpcs = [...npcPool, ...characters.filter(c => c.isNpc)];
  
  if (allNpcs.length === 0) {
    npcList.innerHTML = '<div class="npc-empty">尚無 NPC 資料，請先到設定頁面新增 NPC</div>';
    return;
  }
  
  const selectedNpcs = await loadListFromStorage('sx_lofter_selected_npcs') || [];
  const selectedSet = new Set(selectedNpcs.map(n => n.name));
  
  npcList.innerHTML = allNpcs.map((npc, index) => {
    const isSelected = selectedSet.has(npc.name);
    return `
      <div class="cp-checkbox-item ${isSelected ? 'selected' : ''}" data-npc-index="${index}">
        <input type="checkbox" id="npc-${index}" ${isSelected ? 'checked' : ''}>
        <label for="npc-${index}">${escapeHTML(npc.name)}</label>
        <span class="npc-relationship">好友</span>
      </div>
    `;
  }).join('');
  
  bindNpcCheckboxEvents();
}

function bindWorldSettingEvents() {
  const worldGrid = document.getElementById('worldsetting-grid');
  if (!worldGrid) return;
  
  worldGrid.querySelectorAll('.idea-card').forEach(card => {
    card.addEventListener('click', async () => {
      card.classList.toggle('selected');
      card.setAttribute('aria-pressed', card.classList.contains('selected'));
      await saveWorldSettingSelection();
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
    card.addEventListener('click', async () => {
      card.classList.toggle('selected');
      card.setAttribute('aria-pressed', card.classList.contains('selected'));
      await saveInteractionSelection();
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
    item.addEventListener('click', async (e) => {
      if (e.target.tagName === 'INPUT') return;
      const checkbox = item.querySelector('input[type="checkbox"]');
      checkbox.checked = !checkbox.checked;
      item.classList.toggle('selected', checkbox.checked);
      await saveNpcSelection();
    });
    
    const checkbox = item.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', async () => {
      item.classList.toggle('selected', checkbox.checked);
      await saveNpcSelection();
    });
  });
}

async function saveWorldSettingSelection() {
  const worldGrid = document.getElementById('worldsetting-grid');
  if (!worldGrid) return;
  
  const selected = [];
  worldGrid.querySelectorAll('.idea-card.selected').forEach(card => {
    const index = parseInt(card.dataset.index);
    selected.push(index);
  });
  
  await sxSetJSON('sx_lofter_worldsetting_selection', selected);
}

async function loadWorldSettingSelection() {
  const worldGrid = document.getElementById('worldsetting-grid');
  if (!worldGrid) return;
  
  const selected = await sxGetJSON('sx_lofter_worldsetting_selection') || [];
  const selectedSet = new Set(selected);
  
  worldGrid.querySelectorAll('.idea-card').forEach(card => {
    const index = parseInt(card.dataset.index);
    if (selectedSet.has(index)) {
      card.classList.add('selected');
      card.setAttribute('aria-pressed', 'true');
    }
  });
}

async function saveInteractionSelection() {
  const interactionGrid = document.getElementById('interaction-grid');
  if (!interactionGrid) return;
  
  const selected = [];
  interactionGrid.querySelectorAll('.idea-card.selected').forEach(card => {
    const index = parseInt(card.dataset.index);
    selected.push(index);
  });
  
  await sxSetJSON('sx_lofter_interaction_selection', selected);
}

async function loadInteractionSelection() {
  const interactionGrid = document.getElementById('interaction-grid');
  if (!interactionGrid) return;
  
  const selected = await sxGetJSON('sx_lofter_interaction_selection') || [];
  const selectedSet = new Set(selected);
  
  interactionGrid.querySelectorAll('.idea-card').forEach(card => {
    const index = parseInt(card.dataset.index);
    if (selectedSet.has(index)) {
      card.classList.add('selected');
      card.setAttribute('aria-pressed', 'true');
    }
  });
}

async function saveNpcSelection() {
  const npcList = document.getElementById('lofter-npc-checkbox-list');
  if (!npcList) return;
  
  const npcPool = await loadListFromStorage('sx_npcs') || [];
  const characters = await loadListFromStorage('sx_characters') || [];
  const allNpcs = [...npcPool, ...characters.filter(c => c.isNpc)];
  
  const selected = [];
  npcList.querySelectorAll('.cp-checkbox-item input[type="checkbox"]:checked').forEach(checkbox => {
    const index = parseInt(checkbox.id.replace('npc-', ''));
    if (allNpcs[index]) {
      selected.push({
        name: allNpcs[index].name,
        relationship: '好友'
      });
    }
  });
  
  await sxSetJSON('sx_lofter_selected_npcs', selected);
}

async function getSelectedWorldSettings() {
  const selected = await sxGetJSON('sx_lofter_worldsetting_selection') || [];
  return selected.map(index => worldSettings[index]).filter(Boolean);
}

async function getSelectedInteractions() {
  const selected = await sxGetJSON('sx_lofter_interaction_selection') || [];
  return selected.map(index => interactionTropes[index]).filter(Boolean);
}

async function getSelectedNpcs() {
  return await sxGetJSON('sx_lofter_selected_npcs') || [];
}

function updateIdeaSelection(targetCard, selected) {
  targetCard.classList.toggle('selected', selected);
  targetCard.setAttribute('aria-pressed', String(selected));
}

async function getStoredIdeaSelection() {
  const list = await loadListFromStorage(IDEA_SELECTION_KEY);
  return Array.isArray(list) ? list.map(item => Number(item)).filter(Number.isFinite) : [];
}

async function setStoredIdeaSelection(selection) {
  const normalized = Array.from(new Set(selection))
    .map(item => Number(item))
    .filter(index => Number.isFinite(index) && index >= 0 && index < ideaData.length);
  await sxSetJSON(IDEA_SELECTION_KEY, normalized);
}

async function applyIdeaSelection() {
  const selectedSet = new Set(await getStoredIdeaSelection());
  [ideaGridEl, likesIdeaGridEl].forEach((grid) => {
    if (!grid) return;
    grid.querySelectorAll('.idea-card').forEach(card => {
      const index = Number(card.dataset.index);
      updateIdeaSelection(card, selectedSet.has(index));
    });
  });
}

async function syncIdeaSelectionFromGrid(grid) {
  if (!grid) return;
  const selected = Array.from(grid.querySelectorAll('.idea-card.selected'))
    .map(card => Number(card.dataset.index))
    .filter(Number.isFinite);
  await setStoredIdeaSelection(selected);
  await applyIdeaSelection();
}

async function setAllIdeaSelection(selected) {
  if (selected) {
    await setStoredIdeaSelection(ideaData.map((_, index) => index));
  } else {
    await setStoredIdeaSelection([]);
  }
  await applyIdeaSelection();
}

function bindIdeaEvents() {
  ideaGridEl?.addEventListener('click', async (event) => {
    const card = event.target.closest('.idea-card');
    if (!card) return;
    const isSelected = card.classList.contains('selected');
    updateIdeaSelection(card, !isSelected);
    await syncIdeaSelectionFromGrid(ideaGridEl);
  });

  ideaGridEl?.addEventListener('keydown', async (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const card = event.target.closest('.idea-card');
    if (!card) return;
    event.preventDefault();
    const isSelected = card.classList.contains('selected');
    updateIdeaSelection(card, !isSelected);
    await syncIdeaSelectionFromGrid(ideaGridEl);
  });

  ideaSelectAllBtn?.addEventListener('click', async () => {
    await setAllIdeaSelection(true);
  });

  ideaClearBtn?.addEventListener('click', async () => {
    await setAllIdeaSelection(false);
  });

  ideaGenerateBtn?.addEventListener('click', () => {
    const selected = Array.from(ideaGridEl?.querySelectorAll('.idea-card.selected') || []);
    if (selected.length === 0) {
      alert('請先選擇至少一個梗再生成同人文');
      return;
    }
    alert(`已選擇 ${selected.length} 個梗，可用於生成同人文草稿。`);
  });
}

async function bindLikesIdeaEvents() {
  likesSelectAllBtn?.addEventListener('click', async () => {
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
    
    await saveWorldSettingSelection();
    await saveInteractionSelection();
  });

  likesClearBtn?.addEventListener('click', async () => {
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
    
    await saveWorldSettingSelection();
    await saveInteractionSelection();
  });
}

const WORLDBOOK_SELECTION_KEY = 'sx_lofter_worldbook_selection';

async function renderWorldbookCheckboxList() {
  if (!worldbookCheckboxList) return;
  
  const categories = ['style', 'global', 'keywords', 'backend'];
  const allEntries = [];
  
  for (const cat of categories) {
    const key = `sx_worldbook_${cat}`;
    const list = await sxGetJSON(key);
    if (!list) continue;
    try {
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
  }
  
  if (allEntries.length === 0) {
    worldbookCheckboxList.innerHTML = '<div class="cp-empty">尚無世界書條目，請先到世界書頁面新增</div>';
    return;
  }
  
  const selectedWorldbooks = await loadListFromStorage(WORLDBOOK_SELECTION_KEY);
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
  worldbookCheckboxList?.addEventListener('click', async (event) => {
    const item = event.target.closest('.cp-checkbox-item');
    if (!item) return;
    
    const checkbox = item.querySelector('input[type="checkbox"]');
    
    if (event.target.tagName !== 'INPUT') {
      checkbox.checked = !checkbox.checked;
    }
    
    item.classList.toggle('selected', checkbox.checked);
    
    await saveWorldbookSelection();
  });
}

async function saveWorldbookSelection() {
  const checkboxes = worldbookCheckboxList?.querySelectorAll('input[type="checkbox"]:checked') || [];
  const selected = Array.from(checkboxes).map(cb => {
    const item = cb.closest('.cp-checkbox-item');
    return item?.dataset.worldbookId;
  }).filter(Boolean);
  
  await sxSetJSON(WORLDBOOK_SELECTION_KEY, selected);
}

async function getSelectedWorldbookIds() {
  return await loadListFromStorage(WORLDBOOK_SELECTION_KEY);
}

async function loadWorldbookEntries() {
  const categories = ['style', 'global', 'keywords', 'backend'];
  const entries = [];

  for (const cat of categories) {
    const key = `sx_worldbook_${cat}`;
    const list = await sxGetJSON(key);
    if (!list) continue;
    try {
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
  }

  if (!worldbookListEl) return;
  if (entries.length === 0) {
    worldbookListEl.innerHTML = '<div class="worldbook-item"><div class="worldbook-title">尚未建立世界書條目</div><div class="worldbook-meta">請先到設定頁建立世界書內容</div></div>';
    return;
  }

  worldbookListEl.innerHTML = entries.slice(0, 4).map(entry => `
    <div class="worldbook-item">
      <div class="worldbook-title">${escapeHTML(entry.title)}</div>
      <div class="worldbook-meta">${escapeHTML(entry.triggers.join('、') || '尚未設定關鍵字')}</div>
    </div>
  `).join('');
}

async function loadListFromStorage(key) {
  try {
    const parsed = await sxGetJSON(key);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function getWorldbookStyleSample() {
  const entries = await loadListFromStorage('sx_worldbook_style');
  if (!entries.length) return null;
  const pick = entries[Math.floor(Math.random() * entries.length)];
  const title = pick?.title || '世界書文風';
  const content = pick?.content || '';
  return {
    title,
    content: content.trim()
  };
}

async function loadWorldbookStyleOptions() {
  const entries = await loadListFromStorage('sx_worldbook_style');
  if (!worldbookStyleSelect) return;
  
  if (entries.length === 0) {
    worldbookStyleSelect.innerHTML = '<option value="">尚無世界書文風條目</option>';
    return;
  }
  
  worldbookStyleSelect.innerHTML = entries.map((entry, index) => 
    `<option value="${index}">${escapeHTML(entry.title || '未命名文風')}</option>`
  ).join('');
}

async function bindStyleSelectEvents() {
  likesStyleSelect?.addEventListener('change', async () => {
    const value = likesStyleSelect.value;
    if (value === 'custom-worldbook') {
      if (worldbookStyleContainer) {
        worldbookStyleContainer.style.display = 'grid';
      }
      await loadWorldbookStyleOptions();
    } else {
      if (worldbookStyleContainer) {
        worldbookStyleContainer.style.display = 'none';
      }
    }
  });
  
  worldbookStyleSelect?.addEventListener('change', async () => {
    const index = parseInt(worldbookStyleSelect.value, 10);
    const entries = await loadListFromStorage('sx_worldbook_style');
    if (entries[index] && likesStyleRef) {
      likesStyleRef.value = entries[index].content || '';
    }
  });
}

function renderSelectOptions(selectEl, list, placeholder) {
  if (!selectEl) return;
  const options = [`<option value="">${placeholder}</option>`];
  list.forEach((item, index) => {
    const label = item?.name || item?.title || item?.id || `項目 ${index + 1}`;
    options.push(`<option value="${escapeHTML(String(label))}">${escapeHTML(String(label))}</option>`);
  });
  selectEl.innerHTML = options.join('');
}

async function renderCpCheckboxList() {
  if (!likesCpCheckboxList) return;
  const list = await loadListFromStorage(CP_FOLLOW_KEY);
  
  if (list.length === 0) {
    likesCpCheckboxList.innerHTML = '<div class="cp-empty">尚未設定關注 CP，請先到「發現」頁面設定</div>';
    return;
  }
  
  const selectedCp = await loadListFromStorage(SELECTED_CP_KEY);
  const selectedSet = new Set(selectedCp);
  
  likesCpCheckboxList.innerHTML = list.map((item, index) => {
    const cpName = `${item.top} × ${item.bottom}`;
    const isSelected = selectedSet.has(cpName);
    return `
      <div class="cp-checkbox-item ${isSelected ? 'selected' : ''}" data-cp="${escapeHTML(cpName)}">
        <input type="checkbox" id="cp-${index}" ${isSelected ? 'checked' : ''}>
        <label for="cp-${index}">${escapeHTML(cpName)}</label>
      </div>
    `;
  }).join('');
}

async function getCpBodytypes(cpName) {
  const allBodytypes = await loadListFromStorage(CP_BODYTYPES_KEY);
  return allBodytypes.find(item => item.cp === cpName) || null;
}

async function saveCpBodytypes(cpName, topBodytype, bottomBodytype, bodytypeNote, topGender, bottomGender) {
  const allBodytypes = await loadListFromStorage(CP_BODYTYPES_KEY);
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
  
  await sxSetJSON(CP_BODYTYPES_KEY, allBodytypes);
}

async function loadCpBodytypeToUI(cpName) {
  const bodytypeData = await getCpBodytypes(cpName);
  
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

async function saveCurrentCpBodytypes() {
  const selectedCpList = await getSelectedCpList();
  if (selectedCpList.length === 0) return;
  
  const cpName = selectedCpList[0];
  const topBodytype = topBodytypeSelect?.value || '';
  const bottomBodytype = bottomBodytypeSelect?.value || '';
  const bodytypeNote = bodytypeNoteInput?.value.trim() || '';
  
  const topGenderSelect = document.getElementById('lofter-top-gender');
  const bottomGenderSelect = document.getElementById('lofter-bottom-gender');
  const topGender = topGenderSelect?.value || '';
  const bottomGender = bottomGenderSelect?.value || '';
  
  await saveCpBodytypes(cpName, topBodytype, bottomBodytype, bodytypeNote, topGender, bottomGender);
}

function bindCpCheckboxEvents() {
  likesCpCheckboxList?.addEventListener('click', async (event) => {
    const item = event.target.closest('.cp-checkbox-item');
    if (!item) return;
    
    const checkbox = item.querySelector('input[type="checkbox"]');
    const cpName = item.dataset.cp;
    
    if (event.target.tagName !== 'INPUT') {
      checkbox.checked = !checkbox.checked;
    }
    
    item.classList.toggle('selected', checkbox.checked);
    
    await saveSelectedCp();
    
    if (checkbox.checked) {
      await loadCpBodytypeToUI(cpName);
    }
  });
}

async function saveSelectedCp() {
  const checkboxes = likesCpCheckboxList?.querySelectorAll('input[type="checkbox"]:checked') || [];
  const selected = Array.from(checkboxes).map(cb => {
    const item = cb.closest('.cp-checkbox-item');
    return item?.dataset.cp;
  }).filter(Boolean);
  
  await sxSetJSON(SELECTED_CP_KEY, selected);
}

async function getSelectedCpList() {
  return await loadListFromStorage(SELECTED_CP_KEY);
}

async function getCurrentContentRating() {
  return await sxGetItem(CONTENT_RATING_KEY) || 'general';
}

async function setContentRating(rating) {
  await sxSetItem(CONTENT_RATING_KEY, rating);
}

async function getCurrentContentLength() {
  return await sxGetItem(CONTENT_LENGTH_KEY) || 'medium';
}

async function setContentLength(length) {
  await sxSetItem(CONTENT_LENGTH_KEY, length);
}

async function bindRatingEvents() {
  const ratingBtns = document.querySelectorAll('.rating-btn');
  
  ratingBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      ratingBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      await setContentRating(btn.dataset.rating);
    });
  });
  
  const savedRating = await getCurrentContentRating();
  ratingBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.rating === savedRating);
  });
}

function bindBodytypeEvents() {
  topBodytypeSelect?.addEventListener('change', async () => {
    await saveCurrentCpBodytypes();
  });
  bottomBodytypeSelect?.addEventListener('change', async () => {
    await saveCurrentCpBodytypes();
  });
  bodytypeNoteInput?.addEventListener('blur', async () => {
    await saveCurrentCpBodytypes();
  });
  
  const topGenderSelect = document.getElementById('lofter-top-gender');
  const bottomGenderSelect = document.getElementById('lofter-bottom-gender');
  topGenderSelect?.addEventListener('change', async () => {
    await saveCurrentCpBodytypes();
  });
  bottomGenderSelect?.addEventListener('change', async () => {
    await saveCurrentCpBodytypes();
  });
}

async function bindLengthEvents() {
  const lengthBtns = document.querySelectorAll('.length-btn');
  
  lengthBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      lengthBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      await setContentLength(btn.dataset.length);
    });
  });
  
  const savedLength = await getCurrentContentLength();
  lengthBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.length === savedLength);
  });
}

async function renderCpList() {
  if (!cpListEl) return;
  const list = await loadListFromStorage(CP_FOLLOW_KEY);
  if (list.length === 0) {
    cpListEl.innerHTML = '<div class="cp-item">尚未設定關注 CP</div>';
    return;
  }
  
  const htmlParts = [];
  for (let index = 0; index < list.length; index++) {
    const item = list[index];
    const cpName = `${item.top} × ${item.bottom}`;
    const bodytypeData = await getCpBodytypes(cpName);
    let infoText = '';
    if (bodytypeData) {
      const parts = [];
      if (bodytypeData.topGender) parts.push(`攻:${bodytypeData.topGender}`);
      if (bodytypeData.bottomGender) parts.push(`受:${bodytypeData.bottomGender}`);
      if (bodytypeData.topBodytype) parts.push(`攻體型:${bodytypeData.topBodytype}`);
      if (bodytypeData.bottomBodytype) parts.push(`受體型:${bodytypeData.bottomBodytype}`);
      if (parts.length > 0) infoText = ` <small>(${parts.join('、')})</small>`;
    }
    htmlParts.push(`
    <div class="cp-item">
      <span>${escapeHTML(item.top)} × ${escapeHTML(item.bottom)}${infoText}</span>
      <button type="button" data-remove-index="${index}">移除</button>
    </div>
  `);
  }
  cpListEl.innerHTML = htmlParts.join('');
}

async function bindCpEvents() {
  cpAddBtn?.addEventListener('click', async () => {
    const topName = cpTopSelect?.value || '';
    const bottomName = cpBottomSelect?.value || '';
    if (!topName || !bottomName) {
      alert('請先選擇攻方與受方角色');
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
    
    const cpName = `${topName} × ${bottomName}`;
    
    await saveCpBodytypes(cpName, topBodytype, bottomBodytype, bodytypeNote, topGender, bottomGender);
    
    const list = await loadListFromStorage(CP_FOLLOW_KEY);
    list.unshift({ top: topName, bottom: bottomName });
    await sxSetJSON(CP_FOLLOW_KEY, list);
    await renderCpList();
    await renderCpCheckboxList();
    
    if (discoverTopGender) discoverTopGender.value = '';
    if (discoverBottomGender) discoverBottomGender.value = '';
    if (discoverTopBodytype) discoverTopBodytype.value = '';
    if (discoverBottomBodytype) discoverBottomBodytype.value = '';
    if (discoverBodytypeNote) discoverBodytypeNote.value = '';
  });

  cpListEl?.addEventListener('click', async (event) => {
    const btn = event.target.closest('button[data-remove-index]');
    if (!btn) return;
    const index = Number(btn.dataset.removeIndex);
    const list = await loadListFromStorage(CP_FOLLOW_KEY);
    if (Number.isNaN(index)) return;
    list.splice(index, 1);
    await sxSetJSON(CP_FOLLOW_KEY, list);
    await renderCpList();
    await renderCpCheckboxList();
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

async function initApp() {
  updateViewToggleUI();
  updatePageView();
  await initPostData().then(() => renderFeed());
  renderRandomCpFeed();
  await loadWorldbookEntries();
  renderIdeas();
  await renderLikesIdeas();
  const cpPool = [
    ...(await loadListFromStorage('sx_users')),
    ...(await loadListFromStorage('sx_characters')),
    ...(await loadListFromStorage('sx_npcs'))
  ];
  renderSelectOptions(cpTopSelect, cpPool, '選擇攻方角色');
  renderSelectOptions(cpBottomSelect, cpPool, '選擇受方角色');
  await renderCpList();
  await renderCpCheckboxList();
  await loadWorldbookStyleOptions();
  bindTabs();
  bindViewToggle();
  bindFeedEvents();
  bindNavEvents();
  bindIdeaEvents();
  await bindLikesIdeaEvents();
  await bindCpEvents();
  bindCpCheckboxEvents();
  bindWorldbookCheckboxEvents();
  bindStyleSelectEvents();
  await bindRatingEvents();
  await bindLengthEvents();
  bindBodytypeEvents();
  bindFollowEvents(feedEl);
  bindFollowEvents(likesFeedEl);
  bindFollowEvents(followFeedEl);
  await renderWorldbookCheckboxList();
  console.log('Loaded app: lofter');
}

initApp();

window.addEventListener('message', async (event) => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;
  if (data.type === 'WORLD_BOOK_UPDATED' || data.type === 'WORLD_BOOK_SYNC_READY') {
    await loadWorldbookEntries();
  }
  if (data.type === 'settingsUpdated') {
    console.log('[Lofter] 收到 settingsUpdated 事件，重新讀取 API 設定');
    await reloadApiConfig();
  }
});

async function reloadApiConfig() {
  const apisRaw = await sxGetItem('api_configs');
  console.log('[Lofter] 重新載入 api_configs:', apisRaw);
  
  if (apisRaw) {
    try {
      const apis = JSON.parse(apisRaw);
      console.log('[Lofter] 解析後的 API 配置數量:', apis.length);
      if (apis.length > 0) {
        console.log('[Lofter] 第一個配置:', apis[0]);
      }
    } catch (e) {
      console.error('[Lofter] 解析 api_configs 失敗:', e);
    }
  } else {
    console.warn('[Lofter] api_configs 不存在或為空');
  }
}

if (window.parent && window.parent !== window) {
  window.parent.postMessage({ type: 'REQUEST_WORLD_BOOK_SYNC' }, '*');
}

window.addEventListener('storage', async (event) => {
  if (event.key === 'api_configs' || event.key === 'sx_active_api') {
    console.log('[Lofter] storage 事件觸發，key:', event.key);
    console.log('[Lofter] 新值:', event.newValue);
    await reloadApiConfig();
  }
});

// 初始化時檢查 API 配置
setTimeout(async () => {
  await reloadApiConfig();
}, 500);

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
  const selectedCpList = await getSelectedCpList();
  if (selectedCpList.length === 0) {
    alert('請先到「喜歡」頁面選擇要生成的 CP');
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
    alert('無法選擇梗題，請到「喜歡」頁面手動選擇');
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

profileSaveBtn?.addEventListener('click', async () => {
  const nickname = profileNicknameInput?.value.trim();
  if (nickname) {
    await sxSetItem('sx_lofter_nickname', nickname);
    if (profileAuthorEl) {
      profileAuthorEl.textContent = nickname;
    }
    alert('已儲存暱稱');
  }
});

(async () => {
  const savedNickname = await sxGetItem('sx_lofter_nickname');
  if (savedNickname && profileAuthorEl) {
    profileAuthorEl.textContent = savedNickname;
  }
  if (savedNickname && profileNicknameInput) {
    profileNicknameInput.value = savedNickname;
  }
})();

// 監聽資料還原事件
window.addEventListener('sxiphone-data-restored', async (event) => {
  console.log('[Lofter] 收到資料還原通知，刷新 UI...');
  
  const cpPool = [
    ...(await loadListFromStorage('sx_users')),
    ...(await loadListFromStorage('sx_characters')),
    ...(await loadListFromStorage('sx_npcs'))
  ];
  renderSelectOptions(cpTopSelect, cpPool, '選擇攻方角色');
  renderSelectOptions(cpBottomSelect, cpPool, '選擇受方角色');
  await renderCpList();
  await renderCpCheckboxList();
  await loadWorldbookEntries();
  await renderFollowFeed();
  await initPostData().then(() => renderFeed());
  
  const nickname = await sxGetItem('sx_lofter_nickname');
  if (nickname && profileAuthorEl) {
    profileAuthorEl.textContent = nickname;
  }
  if (nickname && profileNicknameInput) {
    profileNicknameInput.value = nickname;
  }
});

