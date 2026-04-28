(function() {
  const STORAGE_KEY = 'sx_theater_content';
  const WATCH_PROGRESS_KEY = 'sx_theater_progress';
  const MY_LIST_KEY = 'sx_theater_mylist';
  const CHAT_HISTORY_KEY = 'sx_chat_history';

  let contentData = [];
  let watchProgress = {};
  let myList = [];
  let currentContentId = null;
  let isPlaying = false;
  let playProgress = 0;
  let playInterval = null;
  let selectedParticipants = [];
  let currentParticipantTab = 'chars';
  let worldbookData = [];
  let charactersData = [];
  let usersData = [];
  let npcsData = [];
  let chatHistory = [];

  const defaultContent = [
    {
      id: 'demo1',
      title: '星際迷航',
      desc: '一段跨越星系的冒險故事，探索未知的宇宙奧秘。',
      category: 'movie',
      year: 2024,
      cover: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=400',
      html: `<div class="scene-box" style="background: linear-gradient(135deg, #0a0a1a, #1a1a3a);">
        <h2 style="color: #e50914; margin-bottom: 16px;">序幕：啟航</h2>
        <p style="color: #b3b3b3; line-height: 1.8;">在無垠的宇宙深處，一艘星艦緩緩駛離了太空站...</p>
        <div class="dialogue-box">
          <span class="speaker">艦長</span>
          <p class="line">全體船員注意，我們即將進入超空間跳躍。</p>
        </div>
        <div class="choice-box">
          <button class="choice-btn" onclick="this.parentElement.innerHTML='<p style=\\'color:#4ade80\\'>你選擇了前進，星艦進入超空間...</p>'">啟動超空間引擎</button>
          <button class="choice-btn" onclick="this.parentElement.innerHTML='<p style=\\'color:#f87171\\'>你選擇等待，觀察周圍的星象...</p>'">先觀察周圍環境</button>
        </div>
      </div>`,
      rating: 4.8,
      duration: '120 分鐘',
      orientation: 'general',
      contentRating: 'pg12',
      tags: ['科幻', '冒險'],
      world: '未來宇宙時代，人類已掌握超空間航行技術。'
    },
    {
      id: 'demo2',
      title: '校園戀曲',
      desc: '青春校園裡的浪漫故事，關於友情與愛情的成長。',
      category: 'series',
      year: 2024,
      cover: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400',
      html: `<div class="scene-box" style="background: linear-gradient(135deg, #fce4ec, #f8bbd9);">
        <h2 style="color: #c2185b; margin-bottom: 16px;">第一章：相遇</h2>
        <div class="char-card">
          <div class="avatar" style="background: linear-gradient(135deg, #ec407a, #f48fb1);"></div>
          <div class="info">
            <h4 style="color: #880e4f;">櫻井美雪</h4>
            <p style="color: #ad1457;">高二學生，個性開朗活潑</p>
          </div>
        </div>
        <div class="dialogue-box" style="border-left-color: #ec407a;">
          <span class="speaker" style="color: #c2185b;">美雪</span>
          <p class="line">那個...請問這個位置有人嗎？</p>
        </div>
        <div class="choice-box">
          <button class="choice-btn" onclick="this.parentElement.innerHTML='<p style=\\'color:#ec407a\\'>「沒有哦，請坐。」你微笑著說。</p>'">微笑點頭</button>
          <button class="choice-btn" onclick="this.parentElement.innerHTML='<p style=\\'color:#ab47bc\\'>「...」你假裝沒聽到。</p>'">假裝沒聽到</button>
        </div>
      </div>`,
      rating: 4.5,
      duration: '45 分鐘/集',
      orientation: 'bg',
      contentRating: 'pg6',
      tags: ['愛情', '校園', '青春'],
      world: '現代日本高中，櫻花盛開的春季學期。'
    }
  ];

  const htmlTemplates = {
    scene: `<div class="scene-box" style="background: linear-gradient(135deg, #1a1a2e, #16213e);">
  <h2 style="color: #e50914;">場景標題</h2>
  <p style="color: #b3b3b3; line-height: 1.8;">場景描述文字...</p>
</div>`,
    dialogue: `<div class="dialogue-box">
  <span class="speaker">角色名</span>
  <p class="line">對話內容...</p>
</div>`,
    choice: `<div class="choice-box">
  <button class="choice-btn" onclick="alert('選項1')">選項 1</button>
  <button class="choice-btn" onclick="alert('選項2')">選項 2</button>
</div>`,
    character: `<div class="char-card">
  <div class="avatar"></div>
  <div class="info">
    <h4>角色名稱</h4>
    <p>角色描述...</p>
  </div>
</div>`,
    interactive: `<div class="interactive-area">
  <p>互動區域 - 可以添加按鈕、輸入框等</p>
  <button class="choice-btn" onclick="this.textContent='已點擊!'">點擊互動</button>
</div>`
  };

  const ratingLabels = {
    general: '普遍級',
    pg6: '保護級',
    pg12: '輔12級',
    pg15: '輔15級',
    r18: '限制級'
  };

  const orientationLabels = {
    general: '一般',
    bl: 'BL',
    gl: 'GL',
    bg: 'BG',
    harem: '後宮',
    'reverse-harem': '逆後宮'
  };

  const loadData = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      contentData = raw ? JSON.parse(raw) : [...defaultContent];
    } catch {
      contentData = [...defaultContent];
    }

    try {
      const progressRaw = localStorage.getItem(WATCH_PROGRESS_KEY);
      watchProgress = progressRaw ? JSON.parse(progressRaw) : {};
    } catch {
      watchProgress = {};
    }

    try {
      const listRaw = localStorage.getItem(MY_LIST_KEY);
      myList = listRaw ? JSON.parse(listRaw) : [];
    } catch {
      myList = [];
    }

    loadExternalData();
  };

  const loadExternalData = () => {
    console.log('[Theater] 載入外部資料...');
    
    // 優先讀取新架構的劇場專用內容
    try {
      const theaterRaw = localStorage.getItem('sx_worldbook_theater');
      if (theaterRaw) {
        const theaterParsed = JSON.parse(theaterRaw);
        // 支援兩種格式：直接陣列 或 包裝物件
        if (Array.isArray(theaterParsed)) {
          worldbookData = theaterParsed;
          console.log('[Theater] 劇場內容（陣列格式），數量:', worldbookData.length);
        } else if (theaterParsed.sx_worldbook_theater) {
          worldbookData = theaterParsed.sx_worldbook_theater;
          console.log('[Theater] 劇場內容（物件格式），數量:', worldbookData.length);
        }
      }
    } catch {
      console.warn('[Theater] 解析劇場內容失敗');
    }
    
    // 如果沒有劇場專用資料，嘗試讀取全域世界書
    if (!worldbookData || worldbookData.length === 0) {
      try {
        const wbRaw = localStorage.getItem('sx_worldbook_global');
        worldbookData = wbRaw ? JSON.parse(wbRaw) : [];
        console.log('[Theater] 全域世界書資料，數量:', worldbookData.length);
      } catch {
        worldbookData = [];
      }
    }

    try {
      const charRaw = localStorage.getItem('sx_characters');
      charactersData = charRaw ? JSON.parse(charRaw) : [];
      console.log('[Theater] 角色資料，數量:', charactersData.length);
    } catch {
      charactersData = [];
    }

    try {
      const userRaw = localStorage.getItem('sx_users');
      usersData = userRaw ? JSON.parse(userRaw) : [];
      console.log('[Theater] 用戶資料，數量:', usersData.length);
    } catch {
      usersData = [];
    }

    try {
      const npcRaw = localStorage.getItem('sx_npcs');
      npcsData = npcRaw ? JSON.parse(npcRaw) : [];
      console.log('[Theater] NPC 資料，數量:', npcsData.length);
    } catch {
      npcsData = [];
    }

    try {
      const chatRaw = localStorage.getItem(CHAT_HISTORY_KEY);
      chatHistory = chatRaw ? JSON.parse(chatRaw) : [];
      console.log('[Theater] 聊天歷史，數量:', chatHistory.length);
    } catch {
      chatHistory = [];
    }
  };

  const saveData = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contentData));
    localStorage.setItem(WATCH_PROGRESS_KEY, JSON.stringify(watchProgress));
    localStorage.setItem(MY_LIST_KEY, JSON.stringify(myList));
  };

  const generateId = () => `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const showToast = (message) => {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    if (toast && toastMsg) {
      toastMsg.textContent = message;
      toast.hidden = false;
      setTimeout(() => {
        toast.hidden = true;
      }, 2500);
    }
  };

  const renderCard = (content, showProgress = false) => {
    const card = document.createElement('div');
    card.className = 'theater-card';
    card.dataset.id = content.id;

    const progress = watchProgress[content.id] || 0;
    const ratingBadge = content.contentRating === 'r18' ? '<span class="card-rating-badge r18">18+</span>' : '';

    card.innerHTML = `
      <div class="theater-card-poster">
        ${content.cover 
          ? `<img src="${content.cover}" alt="${content.title}" loading="lazy">`
          : `<div class="placeholder-icon"><span class="material-symbols-rounded">theater_comedy</span></div>`
        }
        ${ratingBadge}
        ${showProgress && progress > 0 ? `
          <div class="theater-card-progress">
            <div class="theater-card-progress-bar" style="width: ${progress}%"></div>
          </div>
        ` : ''}
      </div>
      <div class="theater-card-title">${content.title}</div>
    `;

    card.addEventListener('click', () => openDetail(content.id));

    return card;
  };

  const renderRow = (containerId, contents, showProgress = false) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    if (contents.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-film"></i>
          <p>尚無內容</p>
        </div>
      `;
      return;
    }

    contents.forEach(content => {
      container.appendChild(renderCard(content, showProgress));
    });
  };

  const renderContinueWatching = () => {
    const continueIds = Object.keys(watchProgress).filter(id => watchProgress[id] > 0 && watchProgress[id] < 95);
    const continueContent = continueIds
      .map(id => contentData.find(c => c.id === id))
      .filter(Boolean)
      .slice(0, 10);

    renderRow('continue-row', continueContent, true);
  };

  const renderMyList = () => {
    const listContent = myList
      .map(id => contentData.find(c => c.id === id))
      .filter(Boolean);

    renderRow('my-list-row', listContent);
  };

  const renderTrending = () => {
    const trending = [...contentData].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 10);
    renderRow('trending-row', trending);
  };

  const renderNewReleases = () => {
    const newReleases = [...contentData].sort((a, b) => (b.year || 0) - (a.year || 0)).slice(0, 10);
    renderRow('new-releases-row', newReleases);
  };

  const updateHero = () => {
    const featured = contentData[Math.floor(Math.random() * contentData.length)] || defaultContent[0];
    const heroBg = document.getElementById('hero-bg');
    const heroTitle = document.getElementById('hero-title');
    const heroDesc = document.getElementById('hero-desc');

    if (heroBg && featured.cover) {
      heroBg.style.backgroundImage = `url('${featured.cover}')`;
    }
    if (heroTitle) heroTitle.textContent = featured.title;
    if (heroDesc) heroDesc.textContent = featured.desc;

    const playBtn = document.getElementById('hero-play-btn');
    const infoBtn = document.getElementById('hero-info-btn');

    if (playBtn) {
      playBtn.onclick = () => openPlaySettings(featured.id);
    }
    if (infoBtn) {
      infoBtn.onclick = () => openDetail(featured.id);
    }
  };

  const renderAll = () => {
    updateHero();
    renderContinueWatching();
    renderMyList();
    renderTrending();
    renderNewReleases();
  };

  const openDetail = (contentId) => {
    const content = contentData.find(c => c.id === contentId);
    if (!content) return;

    currentContentId = contentId;

    const detailSection = document.getElementById('detail-section');
    const detailBackdrop = document.getElementById('detail-backdrop');
    const detailPoster = document.getElementById('detail-poster');
    const detailTitle = document.getElementById('detail-title');
    const detailYear = document.getElementById('detail-year');
    const detailRating = document.getElementById('detail-rating');
    const detailDuration = document.getElementById('detail-duration');
    const detailRatingBadge = document.getElementById('detail-rating-badge');
    const detailTags = document.getElementById('detail-tags');
    const detailDesc = document.getElementById('detail-desc');
    const detailWorldDesc = document.getElementById('detail-world-desc');
    const participantList = document.getElementById('participant-list');
    const previewContainer = document.getElementById('preview-container');

    if (detailBackdrop && content.cover) {
      detailBackdrop.style.backgroundImage = `url('${content.cover}')`;
    }

    if (detailPoster) {
      detailPoster.innerHTML = content.cover
        ? `<img src="${content.cover}" alt="${content.title}">`
        : `<div class="placeholder-icon"><span class="material-symbols-rounded">theater_comedy</span></div>`;
    }

    if (detailTitle) detailTitle.textContent = content.title;
    if (detailYear) detailYear.textContent = content.year || '-';
    if (detailRating) detailRating.innerHTML = `<i class="fas fa-star"></i> ${content.rating || '-'}`;
    if (detailDuration) detailDuration.textContent = content.duration || '-';

    if (detailRatingBadge) {
      detailRatingBadge.textContent = ratingLabels[content.contentRating] || '普遍級';
      detailRatingBadge.className = 'detail-rating-badge' + (content.contentRating === 'r18' ? ' r18' : '');
    }

    if (detailTags) {
      const tags = [...(content.tags || [])];
      if (content.orientation && content.orientation !== 'general') {
        tags.unshift(orientationLabels[content.orientation]);
      }
      detailTags.innerHTML = tags.map(tag => `<span class="detail-tag">${tag}</span>`).join('');
    }

    if (detailDesc) detailDesc.textContent = content.desc;
    if (detailWorldDesc) detailWorldDesc.textContent = content.world || '未設定';

    if (participantList) {
      const participants = content.participants || [];
      if (participants.length > 0) {
        participantList.innerHTML = participants.map(p => `
          <div class="participant-tag">
            <div class="avatar"></div>
            <span>${p.name}</span>
          </div>
        `).join('');
      } else {
        participantList.innerHTML = '<span style="color: var(--theater-text-secondary); font-size: 12px;">未設定參與者</span>';
      }
    }

    if (previewContainer && content.html) {
      previewContainer.innerHTML = content.html;
    } else if (previewContainer) {
      previewContainer.innerHTML = '<p style="color: #888;">無預覽內容</p>';
    }

    if (detailSection) detailSection.hidden = false;
  };

  const closeDetail = () => {
    const detailSection = document.getElementById('detail-section');
    if (detailSection) detailSection.hidden = true;
    currentContentId = null;
  };

  const openPlaySettings = (contentId) => {
    const content = contentData.find(c => c.id === contentId);
    if (!content) return;

    currentContentId = contentId;
    selectedParticipants = content.participants || [];
    loadExternalData();

    const modal = document.getElementById('play-settings-modal');
    const previewCard = document.getElementById('settings-preview-card');
    const settingsTitle = document.getElementById('settings-title');
    const settingsDesc = document.getElementById('settings-desc');
    const worldbookSelect = document.getElementById('play-worldbook-select');
    const customWorld = document.getElementById('play-custom-world');
    const ratingSelect = document.getElementById('play-rating');
    const ageConfirmGroup = document.getElementById('age-confirm-group');

    if (previewCard && content.cover) {
      previewCard.innerHTML = `<img src="${content.cover}" alt="${content.title}">`;
    }
    if (settingsTitle) settingsTitle.textContent = content.title;
    if (settingsDesc) settingsDesc.textContent = content.desc;
    if (customWorld) customWorld.value = content.world || '';

    if (worldbookSelect) {
      worldbookSelect.innerHTML = '<option value="">選擇世界書條目</option>';
      worldbookData.forEach((entry, index) => {
        worldbookSelect.innerHTML += `<option value="${index}">${entry.title || `條目 ${index + 1}`}</option>`;
      });
    }

    if (ratingSelect) {
      ratingSelect.value = content.contentRating || 'general';
      if (ageConfirmGroup) {
        ageConfirmGroup.hidden = content.contentRating !== 'r18';
      }
    }

    renderParticipantSelect();
    renderSelectedParticipants();

    if (modal) {
      modal.removeAttribute('hidden');
    }
    closeDetail();
  };

  const closePlaySettings = () => {
    const modal = document.getElementById('play-settings-modal');
    if (modal) {
      modal.setAttribute('hidden', '');
    }
  };

  const renderParticipantSelect = () => {
    const container = document.getElementById('participant-select-list');
    if (!container) {
      console.warn('[Theater] participant-select-list 容器不存在');
      return;
    }

    let data = [];
    if (currentParticipantTab === 'chars') {
      data = charactersData;
      console.log('[Theater] 使用角色資料，數量:', charactersData.length);
    } else if (currentParticipantTab === 'users') {
      data = usersData;
      console.log('[Theater] 使用用戶資料，數量:', usersData.length);
    } else if (currentParticipantTab === 'npcs') {
      data = npcsData;
      console.log('[Theater] 使用 NPC 資料，數量:', npcsData.length);
    }

    if (data.length === 0) {
      container.innerHTML = '<span style="color: var(--theater-text-secondary); font-size: 12px; padding: 8px;">無可用資料，請先在設定中新增角色</span>';
      console.warn('[Theater] 當前分類無可用資料:', currentParticipantTab);
      return;
    }

    container.innerHTML = data.map((item, index) => {
      const isSelected = selectedParticipants.some(p => p.id === item.name && p.type === currentParticipantTab);
      return `
        <div class="participant-item ${isSelected ? 'selected' : ''}" 
             data-id="${item.name}" 
             data-type="${currentParticipantTab}"
             data-name="${item.name}">
          <div class="participant-avatar"></div>
          <span>${item.name}</span>
        </div>
      `;
    }).join('');
  };

  const renderSelectedParticipants = () => {
    const container = document.getElementById('selected-participants');
    if (!container) {
      console.warn('[Theater] selected-participants 容器不存在');
      return;
    }

    console.log('[Theater] 渲染已選擇參與者，數量:', selectedParticipants.length);

    if (selectedParticipants.length === 0) {
      container.innerHTML = '<span class="hint">點擊上方角色加入演出（可選）</span>';
      return;
    }

    container.innerHTML = selectedParticipants.map((p, index) => `
      <div class="selected-participant-tag">
        <span>${p.name}</span>
        <button onclick="window.removeParticipant(${index})">×</button>
      </div>
    `).join('');
  };

  window.removeParticipant = (index) => {
    selectedParticipants.splice(index, 1);
    renderSelectedParticipants();
    renderParticipantSelect();
  };

  const startPlay = async () => {
    console.log('[Theater] startPlay 被調用');
    console.log('[Theater] currentContentId:', currentContentId);
    console.log('[Theater] selectedParticipants:', selectedParticipants);
    
    const content = contentData.find(c => c.id === currentContentId);
    if (!content) {
      showToast('找不到劇目內容');
      console.error('[Theater] 找不到劇目內容，currentContentId:', currentContentId);
      return;
    }

    console.log('[Theater] 找到劇目內容:', content.title);

    const rating = document.getElementById('play-rating')?.value;
    console.log('[Theater] 分級:', rating);
    
    if (rating === 'r18') {
      const confirmed = document.getElementById('age-confirm-checkbox')?.checked;
      if (!confirmed) {
        showToast('請確認您已年滿 18 歲');
        return;
      }
    }

    const worldSource = document.getElementById('play-world-source')?.value;
    console.log('[Theater] 世界來源:', worldSource);
    
    let worldDesc = '';

    if (worldSource === 'worldbook') {
      const wbIndex = document.getElementById('play-worldbook-select')?.value;
      if (wbIndex !== '' && worldbookData[wbIndex]) {
        worldDesc = worldbookData[wbIndex].content || '';
      }
    } else if (worldSource === 'chat') {
      const chatOption = document.getElementById('play-chat-select')?.value;
      if (chatOption === 'recent' && chatHistory.length > 0) {
        const recent = chatHistory.slice(-10);
        worldDesc = recent.map(m => {
          const role = m.role === 'user' ? '用戶' : m.role === 'assistant' ? '角色' : m.role;
          return `${role}: ${m.content || ''}`;
        }).join('\n');
      } else if (chatOption === 'all' && chatHistory.length > 0) {
        worldDesc = chatHistory.map(m => {
          const role = m.role === 'user' ? '用戶' : m.role === 'assistant' ? '角色' : m.role;
          return `${role}: ${m.content || ''}`;
        }).join('\n');
      }
    } else {
      worldDesc = document.getElementById('play-custom-world')?.value || content.world || '';
    }

    const orientation = document.getElementById('play-orientation')?.value || content.orientation || 'general';

    console.log('[Theater] 準備生成，參與者數量:', selectedParticipants.length);
    console.log('[Theater] 世界設定長度:', worldDesc.length);
    
    closePlaySettings();
    
    showPreparingModal(content, selectedParticipants);

    try {
      const generatedContent = await generateTheaterContent(content, {
        world: worldDesc,
        participants: selectedParticipants,
        orientation,
        rating
      });

      hidePreparingModal();

      const playerSection = document.getElementById('player-section');
      const playerTitle = document.getElementById('player-title');
      const playerContentTitle = document.getElementById('player-content-title');
      const playerContentDesc = document.getElementById('player-content-desc');
      const playerContent = document.getElementById('player-content');

      if (playerSection) playerSection.hidden = false;
      if (playerTitle) playerTitle.textContent = content.title;
      if (playerContentTitle) playerContentTitle.textContent = content.title;
      if (playerContentDesc) playerContentDesc.textContent = content.desc;

      if (playerContent && generatedContent) {
        playerContent.innerHTML = generatedContent;
      } else if (playerContent) {
        playerContent.innerHTML = `
          <div class="player-placeholder">
            <span class="material-symbols-rounded">error</span>
            <p>內容生成失敗，請稍後再試</p>
          </div>
        `;
      }
    } catch (err) {
      hidePreparingModal();
      showToast(`生成失敗: ${err.message}`);
      console.error('劇場生成錯誤:', err);
    }
  };

  const showPreparingModal = (content, participants) => {
    let existingModal = document.getElementById('preparing-modal');
    if (existingModal) existingModal.remove();

    const participantNames = participants.map(p => p.name).join('、') || '無';
    
    const modal = document.createElement('div');
    modal.id = 'preparing-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;
    
    modal.innerHTML = `
      <div class="preparing-card" style="
        background: linear-gradient(145deg, #1a1a2e, #16213e);
        border-radius: 20px;
        padding: 32px;
        max-width: 360px;
        width: 90%;
        text-align: center;
        box-shadow: 0 20px 60px rgba(229, 9, 20, 0.3);
      ">
        <div class="preparing-animation" style="
          width: 80px;
          height: 80px;
          margin: 0 auto 24px;
          position: relative;
        ">
          <div style="
            width: 100%;
            height: 100%;
            border: 3px solid rgba(229, 9, 20, 0.2);
            border-top-color: #e50914;
            border-radius: 50%;
            animation: preparing-spin 1s linear infinite;
          "></div>
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 28px;
          ">🎭</div>
        </div>
        
        <h3 style="
          color: #fff;
          font-size: 20px;
          margin-bottom: 8px;
          font-weight: 600;
        ">演員正在準備中...</h3>
        
        <p style="
          color: #b3b3b3;
          font-size: 14px;
          margin-bottom: 16px;
        ">正在為您生成「${content.title}」的劇場內容</p>
        
        <div style="
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 12px;
          margin-bottom: 16px;
        ">
          <div style="
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #888;
            margin-bottom: 8px;
          ">
            <span>參演角色</span>
            <span style="color: #e50914;">${participants.length} 位</span>
          </div>
          <div style="
            font-size: 13px;
            color: #e5e5e5;
            text-align: left;
            line-height: 1.5;
          ">${participantNames}</div>
        </div>
        
        <div class="preparing-steps" style="
          text-align: left;
          font-size: 12px;
          color: #888;
        ">
          <div class="step" style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span style="color: #4ade80;">✓</span> 載入劇本設定
          </div>
          <div class="step" style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span style="color: #4ade80;">✓</span> 準備角色資料
          </div>
          <div class="step" style="display: flex; align-items: center; gap: 8px;">
            <span class="loading-dot" style="
              display: inline-block;
              width: 8px;
              height: 8px;
              background: #e50914;
              border-radius: 50%;
              animation: pulse 1s ease-in-out infinite;
            "></span>
            <span>生成互動內容中...</span>
          </div>
        </div>
        
        <style>
          @keyframes preparing-spin {
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(0.8); }
          }
        </style>
      </div>
    `;
    
    document.body.appendChild(modal);
  };

  const hidePreparingModal = () => {
    const modal = document.getElementById('preparing-modal');
    if (modal) {
      modal.style.opacity = '0';
      modal.style.transition = 'opacity 0.3s ease';
      setTimeout(() => modal.remove(), 300);
    }
  };

  const generateTheaterContent = async (content, settings) => {
    console.log('[Theater] generateTheaterContent 開始');
    console.log('[Theater] content:', content?.title);
    console.log('[Theater] settings:', settings);
    
    let config = null;
    
    if (typeof window.SettingsReader !== 'undefined' && window.SettingsReader.getActiveApiWithFallback) {
      config = window.SettingsReader.getActiveApiWithFallback();
      console.log('[Theater] 從 SettingsReader 獲取 API 配置');
    } else {
      const apis = JSON.parse(localStorage.getItem('api_configs') || '[]');
      const activeIndex = parseInt(localStorage.getItem('sx_active_api'), 10);
      const validIndex = (!isNaN(activeIndex) && activeIndex >= 0 && activeIndex < apis.length) ? activeIndex : 0;
      config = apis[validIndex] || apis[0];
      
      console.log('[Theater] API 配置:', {
        totalApis: apis.length,
        activeIndex,
        validIndex,
        selectedApi: config?.name || '未命名'
      });
    }

    if (!config) {
      showToast('未設定 API，請先到設定頁面配置');
      console.error('[Theater] 沒有可用的 API 配置 - config 為 null');
      return null;
    }
    
    if (!config.url) {
      showToast('未設定 API URL，請先到設定頁面配置');
      console.error('[Theater] API 配置缺少 URL');
      return null;
    }

    console.log('[Theater] 使用 API:', config.name || '未命名', config.url);

    console.log('[Theater] 開始生成劇場內容:', {
      title: content.title,
      participants: settings.participants,
      worldLength: settings.world?.length || 0
    });

    const url = config.url.endsWith('/chat/completions') 
      ? config.url 
      : config.url.replace(/\/$/, '') + '/chat/completions';

    const participantNames = settings.participants.map(p => p.name).join('、');
    const orientationLabel = orientationLabels[settings.orientation] || '一般';
    const ratingLabel = ratingLabels[settings.rating] || '普遍級';

    console.log('[Theater] 參與者名稱:', participantNames || '未指定');
    console.log('[Theater] 性向:', orientationLabel);
    console.log('[Theater] 分級:', ratingLabel);

    const isAdult = settings.rating === 'r18';
    
    let participantDetails = '';
    if (settings.participants && settings.participants.length > 0) {
      participantDetails = '\n\n【參演角色詳情】\n' + settings.participants.map(p => {
        const typeLabel = p.type === 'chars' ? '角色' : p.type === 'npcs' ? 'NPC' : '用戶';
        return `- ${p.name}（${typeLabel}）`;
      }).join('\n');
    }
    
    const systemPrompt = isAdult 
      ? '你是一個成人向互動劇場內容生成器。請生成具有情慾氛圍的內容，可以包含成人元素但保持藝術性。輸出格式為 HTML。'
      : '你是一個互動劇場內容生成器。請生成引人入勝的劇場內容，包含場景描述、角色對話和互動選項。輸出格式為 HTML。';

    const userPrompt = `請為以下劇目生成互動式劇場內容：

【劇目標題】${content.title}
【劇目描述】${content.desc}
【世界設定】${settings.world || '未設定'}
【參與角色】${participantNames || '未指定'}${participantDetails}
【性向】${orientationLabel}
【內容分級】${ratingLabel}

請生成一段互動式劇場內容，必須包含：
1. 場景描述（使用 <div class="scene-box"> 包裹）
2. 角色對話（使用 <div class="dialogue-box"> 包裹，包含 <span class="speaker"> 和 <p class="line">）
3. 互動選項（使用 <div class="choice-box"> 包裹，包含 2-4 個 <button class="choice-btn">）
4. 適當的 CSS 樣式（內聯或在 <style> 標籤中）

每個選項按鈕應該有 onclick 事件，點擊後顯示不同的結果。
請確保內容豐富、互動性強，並符合 ${ratingLabel} 的內容尺度。

直接輸出 HTML 代碼，不要有其他說明文字。`;

    const payload = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    console.log('[Theater] API 請求:', url);

    const fetchWithTimeout = (url, options, timeoutMs = 120000) => {
      return new Promise((resolve, reject) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
          reject(new Error(`請求逾時 (${timeoutMs / 1000}秒)`));
        }, timeoutMs);

        fetch(url, {
          ...options,
          signal: controller.signal
        })
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
        console.log(`[Theater] 嘗試生成劇場內容 (第 ${retryCount + 1} 次)，逾時: ${timeoutMs / 1000}秒`);

        const response = await fetchWithTimeout(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(config.key ? { 'Authorization': `Bearer ${config.key}` } : {})
          },
          body: JSON.stringify({
            model: config.model || 'gpt-3.5-turbo',
            messages: payload,
            temperature: 0.8,
            max_tokens: 2000
          })
        }, timeoutMs);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Theater] API 錯誤:', response.status, errorText);
        throw new Error(`API 請求失敗: ${response.status}`);
      }

      const data = await response.json();
      let html = data?.choices?.[0]?.message?.content || '';
      
      console.log('[Theater] 生成成功，內容長度:', html.length);

      const styleBlock = `
        <style>
          .player-world-info {
            padding: 12px;
            margin-bottom: 16px;
            background: rgba(229, 9, 20, 0.1);
            border-radius: 8px;
            border-left: 3px solid #e50914;
          }
          .player-world-info h4 {
            font-size: 12px;
            color: #e50914;
            margin-bottom: 6px;
          }
          .player-world-info p {
            font-size: 13px;
            color: #b3b3b3;
            line-height: 1.5;
          }
          .player-participants {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 16px;
          }
          .player-participant-badge {
            padding: 4px 10px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            font-size: 12px;
          }
          .player-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 20px;
            color: #b3b3b3;
          }
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(229, 9, 20, 0.2);
            border-top-color: #e50914;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .scene-box {
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 16px;
          }
          .dialogue-box {
            padding: 12px 16px;
            margin-bottom: 12px;
            border-left: 3px solid #e50914;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 0 8px 8px 0;
          }
          .dialogue-box .speaker {
            font-weight: 700;
            color: #e50914;
            margin-right: 8px;
          }
          .dialogue-box .line {
            color: #e5e5e5;
            line-height: 1.6;
          }
          .choice-box {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-top: 20px;
            padding: 16px;
            background: rgba(229, 9, 20, 0.1);
            border-radius: 12px;
          }
          .choice-btn {
            padding: 12px 16px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            color: #fff;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
            text-align: left;
          }
          .choice-btn:hover {
            background: rgba(229, 9, 20, 0.3);
            border-color: #e50914;
          }
          .char-card {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            margin-bottom: 12px;
          }
          .char-card .avatar {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: linear-gradient(135deg, #e50914, #b20710);
          }
          .char-card .info h4 {
            margin: 0 0 4px;
            color: #fff;
          }
          .char-card .info p {
            margin: 0;
            font-size: 12px;
            color: #b3b3b3;
          }
        </style>
      `;

      let infoHtml = '';
      if (settings.world) {
        infoHtml += `<div class="player-world-info"><h4>世界設定</h4><p>${settings.world}</p></div>`;
      }
      if (settings.participants && settings.participants.length > 0) {
        infoHtml += `<div class="player-participants">
          <span style="font-size: 12px; color: #888;">參與者：</span>
          ${settings.participants.map(p => `<span class="player-participant-badge">${p.name}</span>`).join('')}
        </div>`;
      }

      return styleBlock + infoHtml + html;

      } catch (err) {
        lastError = err;
        retryCount++;
        console.warn(`[Theater] 第 ${retryCount} 次嘗試失敗:`, err.message);
        
        if (retryCount < maxRetries) {
          showToast(`生成失敗，正在重試 (${retryCount}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    console.error('生成劇場內容失敗:', lastError);
    showToast(`生成失敗: ${lastError?.message || '未知錯誤'}（已嘗試 ${maxRetries} 次）`);
    return null;
  };

  const closePlayer = () => {
    const playerSection = document.getElementById('player-section');
    if (playerSection) playerSection.hidden = true;

    if (playInterval) {
      clearInterval(playInterval);
      playInterval = null;
    }

    if (currentContentId && playProgress > 0) {
      watchProgress[currentContentId] = playProgress;
      saveData();
    }

    isPlaying = false;
    renderAll();
  };

  const updatePlayButton = () => {
    const btn = document.getElementById('play-pause-btn');
    if (btn) {
      btn.innerHTML = isPlaying 
        ? '<i class="fas fa-pause"></i>' 
        : '<i class="fas fa-play"></i>';
    }
  };

  const togglePlay = () => {
    isPlaying = !isPlaying;
    updatePlayButton();

    if (isPlaying) {
      playInterval = setInterval(() => {
        playProgress = Math.min(100, playProgress + 0.5);
        const progressFill = document.getElementById('progress-fill');
        if (progressFill) progressFill.style.width = `${playProgress}%`;

        if (playProgress >= 100) {
          isPlaying = false;
          updatePlayButton();
          clearInterval(playInterval);
          playInterval = null;
          watchProgress[currentContentId] = 0;
          saveData();
        }
      }, 100);
    } else {
      if (playInterval) {
        clearInterval(playInterval);
        playInterval = null;
      }
    }
  };

  const openAddModal = () => {
    const modal = document.getElementById('add-modal');
    if (modal) {
      modal.removeAttribute('hidden');
    }

    const titleEl = document.getElementById('content-title');
    const descEl = document.getElementById('content-desc');
    const categoryEl = document.getElementById('content-category');
    const yearEl = document.getElementById('content-year');
    const coverEl = document.getElementById('content-cover');
    const htmlEl = document.getElementById('content-html');
    const orientationEl = document.getElementById('content-orientation');
    const ratingEl = document.getElementById('content-rating');
    const previewEl = document.getElementById('add-preview-box');

    if (titleEl) titleEl.value = '';
    if (descEl) descEl.value = '';
    if (categoryEl) categoryEl.value = 'movie';
    if (yearEl) yearEl.value = new Date().getFullYear();
    if (coverEl) coverEl.value = '';
    if (htmlEl) htmlEl.value = '';
    if (orientationEl) orientationEl.value = 'general';
    if (ratingEl) ratingEl.value = 'general';
    if (previewEl) previewEl.innerHTML = '';
  };

  const closeAddModal = () => {
    const modal = document.getElementById('add-modal');
    if (modal) {
      modal.setAttribute('hidden', '');
    }
  };

  const saveContent = () => {
    const title = document.getElementById('content-title').value.trim();
    const desc = document.getElementById('content-desc').value.trim();
    const category = document.getElementById('content-category').value;
    const year = parseInt(document.getElementById('content-year').value) || new Date().getFullYear();
    const cover = document.getElementById('content-cover').value.trim();
    const html = document.getElementById('content-html').value;
    const orientation = document.getElementById('content-orientation').value;
    const contentRating = document.getElementById('content-rating').value;

    if (!title) {
      showToast('請輸入標題');
      return;
    }

    const newContent = {
      id: generateId(),
      title,
      desc,
      category,
      year,
      cover,
      html,
      rating: 4.0,
      duration: '-',
      orientation,
      contentRating,
      tags: [getCategoryName(category)],
      participants: [],
      world: ''
    };

    contentData.unshift(newContent);
    saveData();
    closeAddModal();
    renderAll();
    showToast('已新增劇目');
  };

  const openEditModal = (contentId) => {
    const content = contentData.find(c => c.id === contentId);
    if (!content) return;

    const modal = document.getElementById('edit-modal');
    if (modal) {
      modal.removeAttribute('hidden');
    }

    const editIdEl = document.getElementById('edit-content-id');
    const editTitleEl = document.getElementById('edit-title');
    const editDescEl = document.getElementById('edit-desc');
    const editCategoryEl = document.getElementById('edit-category');
    const editYearEl = document.getElementById('edit-year');
    const editCoverEl = document.getElementById('edit-cover');
    const editHtmlEl = document.getElementById('edit-html');
    const editOrientationEl = document.getElementById('edit-orientation');
    const editRatingEl = document.getElementById('edit-rating');

    if (editIdEl) editIdEl.value = contentId;
    if (editTitleEl) editTitleEl.value = content.title;
    if (editDescEl) editDescEl.value = content.desc || '';
    if (editCategoryEl) editCategoryEl.value = content.category || 'movie';
    if (editYearEl) editYearEl.value = content.year || new Date().getFullYear();
    if (editCoverEl) editCoverEl.value = content.cover || '';
    if (editHtmlEl) editHtmlEl.value = content.html || '';
    if (editOrientationEl) editOrientationEl.value = content.orientation || 'general';
    if (editRatingEl) editRatingEl.value = content.contentRating || 'general';

    updateEditPreview();
  };

  const closeEditModal = () => {
    const modal = document.getElementById('edit-modal');
    if (modal) {
      modal.setAttribute('hidden', '');
    }
  };

  const updateContent = () => {
    const contentId = document.getElementById('edit-content-id').value;
    const content = contentData.find(c => c.id === contentId);
    if (!content) return;

    content.title = document.getElementById('edit-title').value.trim();
    content.desc = document.getElementById('edit-desc').value.trim();
    content.category = document.getElementById('edit-category').value;
    content.year = parseInt(document.getElementById('edit-year').value) || new Date().getFullYear();
    content.cover = document.getElementById('edit-cover').value.trim();
    content.html = document.getElementById('edit-html').value;
    content.orientation = document.getElementById('edit-orientation').value;
    content.contentRating = document.getElementById('edit-rating').value;
    content.tags = [getCategoryName(content.category)];

    saveData();
    closeEditModal();
    closeDetail();
    renderAll();
    showToast('已更新劇目');
  };

  const deleteContent = (contentId) => {
    const index = contentData.findIndex(c => c.id === contentId);
    if (index > -1) {
      contentData.splice(index, 1);
      delete watchProgress[contentId];
      myList = myList.filter(id => id !== contentId);
      saveData();
      closeDetail();
      renderAll();
      showToast('已刪除劇目');
    }
  };

  const addToList = (contentId) => {
    if (!myList.includes(contentId)) {
      myList.push(contentId);
      saveData();
      showToast('已加入片單');
      renderMyList();
    } else {
      showToast('已在片單中');
    }
  };

  const getCategoryName = (category) => {
    const names = {
      movie: '電影',
      series: '影集',
      anime: '動漫',
      documentary: '紀錄片',
      variety: '綜藝'
    };
    return names[category] || '電影';
  };

  const filterByCategory = (category) => {
    if (category === 'all') {
      renderRow('trending-row', contentData.slice(0, 10));
    } else {
      const filtered = contentData.filter(c => c.category === category);
      renderRow('trending-row', filtered);
    }

    document.getElementById('trending').scrollIntoView({ behavior: 'smooth' });
  };

  const searchContent = (query) => {
    const q = query.toLowerCase().trim();
    if (!q) {
      renderAll();
      return;
    }

    const results = contentData.filter(c => 
      c.title.toLowerCase().includes(q) || 
      (c.desc && c.desc.toLowerCase().includes(q))
    );

    renderRow('trending-row', results);
    document.getElementById('trending').scrollIntoView({ behavior: 'smooth' });
  };

  const updateAddPreview = () => {
    const html = document.getElementById('content-html').value;
    const previewBox = document.getElementById('add-preview-box');
    if (previewBox) {
      previewBox.innerHTML = html || '<p style="color: #888;">輸入 HTML 預覽</p>';
    }
  };

  const updateEditPreview = () => {
    const html = document.getElementById('edit-html').value;
    const previewBox = document.getElementById('edit-preview-box');
    if (previewBox) {
      previewBox.innerHTML = html || '<p style="color: #888;">輸入 HTML 預覽</p>';
    }
  };

  const initEventListeners = () => {
    console.log('[Theater] 初始化事件監聽器');
    
    document.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      const category = e.target.closest('[data-category]')?.dataset.category;
      const template = e.target.closest('[data-template]')?.dataset.template;
      const tab = e.target.closest('[data-tab]')?.dataset.tab;
      const participantItem = e.target.closest('.participant-item');

      if (category) {
        filterByCategory(category);
      }

      if (template && htmlTemplates[template]) {
        const textarea = document.querySelector('.html-editor textarea');
        if (textarea) {
          textarea.value += htmlTemplates[template];
          textarea.dispatchEvent(new Event('input'));
        }
      }

      if (tab) {
        currentParticipantTab = tab;
        document.querySelectorAll('.participant-tab').forEach(t => t.classList.remove('active'));
        e.target.closest('.participant-tab').classList.add('active');
        renderParticipantSelect();
      }

      if (participantItem) {
        const id = participantItem.dataset.id;
        const type = participantItem.dataset.type;
        const name = participantItem.dataset.name;

        console.log('[Theater] 點擊參與者:', { id, type, name });

        const existingIndex = selectedParticipants.findIndex(p => p.id === id && p.type === type);
        if (existingIndex > -1) {
          selectedParticipants.splice(existingIndex, 1);
          console.log('[Theater] 移除參與者:', name);
        } else {
          selectedParticipants.push({ id, type, name });
          console.log('[Theater] 新增參與者:', name);
        }
        renderParticipantSelect();
        renderSelectedParticipants();
      }

      switch (action) {
        case 'close-player':
          closePlayer();
          break;
        case 'close-detail':
          closeDetail();
          break;
        case 'toggle-play':
          togglePlay();
          break;
        case 'open-play-settings':
          if (currentContentId) openPlaySettings(currentContentId);
          break;
        case 'close-play-settings':
          closePlaySettings();
          break;
        case 'add-to-list':
          if (currentContentId) addToList(currentContentId);
          break;
        case 'edit-content':
          if (currentContentId) openEditModal(currentContentId);
          break;
        case 'delete-content':
          if (currentContentId) {
            const modal = document.getElementById('confirm-modal');
            if (modal) {
              modal.removeAttribute('hidden');
            }
          }
          break;
        case 'close-add-modal':
          closeAddModal();
          break;
        case 'save-content':
          saveContent();
          break;
        case 'close-edit-modal':
          closeEditModal();
          break;
        case 'update-content':
          updateContent();
          break;
        case 'close-confirm-modal':
          document.getElementById('confirm-modal')?.setAttribute('hidden', '');
          break;
        case 'close-settings-modal':
          closeSettingsModal();
          break;
        case 'close-text-result':
          closeTextTheaterResult();
          break;
      }
    });

    const textTheaterGenerateBtn = document.getElementById('text-theater-generate-btn');
    if (textTheaterGenerateBtn) {
      textTheaterGenerateBtn.addEventListener('click', generateTextTheater);
    }

    const saveTextTheaterBtn = document.getElementById('save-text-theater-btn');
    if (saveTextTheaterBtn) {
      saveTextTheaterBtn.addEventListener('click', saveTextTheater);
    }

    const startPlayBtn = document.getElementById('start-play-btn');
    if (startPlayBtn) {
      startPlayBtn.addEventListener('click', startPlay);
    }

    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', () => {
        if (currentContentId) {
          deleteContent(currentContentId);
          document.getElementById('confirm-modal')?.setAttribute('hidden', '');
        }
      });
    }

    const addContentBtn = document.getElementById('add-content-btn');
    if (addContentBtn) {
      addContentBtn.addEventListener('click', openAddModal);
    }

    const searchBtn = document.getElementById('search-btn');
    const searchBar = document.getElementById('search-bar');
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear');

    if (searchBtn && searchBar) {
      searchBtn.addEventListener('click', () => {
        searchBar.hidden = !searchBar.hidden;
        if (!searchBar.hidden && searchInput) {
          searchInput.focus();
        }
      });
    }

    if (searchClear && searchInput) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchContent('');
      });
    }

    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          searchContent(e.target.value);
        }, 300);
      });
    }

    const contentHtml = document.getElementById('content-html');
    if (contentHtml) {
      contentHtml.addEventListener('input', updateAddPreview);
    }

    const editHtml = document.getElementById('edit-html');
    if (editHtml) {
      editHtml.addEventListener('input', updateEditPreview);
    }

    const worldSource = document.getElementById('play-world-source');
    if (worldSource) {
      worldSource.addEventListener('change', (e) => {
        const worldbookWrap = document.getElementById('worldbook-select-wrap');
        const customWrap = document.getElementById('custom-world-wrap');
        const chatWrap = document.getElementById('chat-select-wrap');
        
        if (worldbookWrap) worldbookWrap.hidden = e.target.value !== 'worldbook';
        if (customWrap) customWrap.hidden = e.target.value !== 'custom';
        if (chatWrap) chatWrap.hidden = e.target.value !== 'chat';
      });
    }

    const playRating = document.getElementById('play-rating');
    if (playRating) {
      playRating.addEventListener('change', (e) => {
        const ageConfirmGroup = document.getElementById('age-confirm-group');
        if (ageConfirmGroup) {
          ageConfirmGroup.hidden = e.target.value !== 'r18';
        }
      });
    }

    document.querySelectorAll('.html-tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const insert = btn.dataset.insert;
        const textarea = btn.closest('.html-editor').querySelector('textarea');
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const text = textarea.value;
          textarea.value = text.substring(0, start) + insert + text.substring(end);
          textarea.focus();
          textarea.dispatchEvent(new Event('input'));
        }
      });
    });

    const main = document.getElementById('theater-main');
    const header = document.querySelector('.theater-header');
    if (main && header) {
      main.addEventListener('scroll', () => {
        if (main.scrollTop > 50) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      });
    }

    const progressBars = document.querySelectorAll('.progress-bar');
    progressBars.forEach(bar => {
      bar.addEventListener('click', (e) => {
        const rect = bar.getBoundingClientRect();
        const percent = ((e.clientX - rect.left) / rect.width) * 100;
        playProgress = Math.max(0, Math.min(100, percent));
        const fill = bar.querySelector('.progress-fill');
        if (fill) fill.style.width = `${playProgress}%`;
      });
    });

    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', openSettingsModal);
    }

    const worldbookCategorySelect = document.getElementById('settings-worldbook-category');
    if (worldbookCategorySelect) {
      worldbookCategorySelect.addEventListener('change', loadWorldbookEntriesForSettings);
    }

    const selectAllBtn = document.getElementById('select-all-entries-btn');
    if (selectAllBtn) {
      selectAllBtn.addEventListener('click', selectAllEntries);
    }

    const deselectAllBtn = document.getElementById('deselect-all-entries-btn');
    if (deselectAllBtn) {
      deselectAllBtn.addEventListener('click', deselectAllEntries);
    }

    const batchImportBtn = document.getElementById('batch-import-btn');
    if (batchImportBtn) {
      batchImportBtn.addEventListener('click', batchImportFromWorldbook);
    }

    const clearAllBtn = document.getElementById('clear-all-content-btn');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', clearAllContent);
    }
  };

  const generateTextTheater = async () => {
    const input = document.getElementById('text-theater-input')?.value?.trim();
    const style = document.getElementById('text-theater-style')?.value || 'interactive';
    
    if (!input) {
      showToast('請輸入小劇場描述');
      return;
    }

    let config = null;
    if (typeof window.SettingsReader !== 'undefined' && window.SettingsReader.getActiveApiWithFallback) {
      config = window.SettingsReader.getActiveApiWithFallback();
    } else {
      const apis = JSON.parse(localStorage.getItem('api_configs') || '[]');
      const activeIndex = parseInt(localStorage.getItem('sx_active_api'), 10);
      const validIndex = (!isNaN(activeIndex) && activeIndex >= 0 && activeIndex < apis.length) ? activeIndex : 0;
      config = apis[validIndex] || apis[0];
    }

    if (!config || !config.url) {
      showToast('未設定 API，請先到設定頁面配置');
      return;
    }

    showPreparingModal({ title: '文字小劇場' }, []);

    const stylePrompts = {
      interactive: `生成一個互動式劇場，包含：
1. 場景描述區塊（.scene-box）
2. 角色對話區塊（.dialogue-box）
3. 多個互動選項按鈕（.choice-btn），每個按鈕有 onclick 事件顯示不同結果
4. 可點擊的互動元素
5. 狀態變化效果`,
      visual: `生成一個視覺化卡片劇場，包含：
1. 精美的視覺卡片設計
2. 角色資訊展示
3. 漸層背景和陰影效果
4. 動畫過渡效果
5. 懸浮互動效果`,
      dialogue: `生成一個對話式劇場，包含：
1. 多輪角色對話
2. 對話框樣式（不同角色不同顏色）
3. 對話動畫效果
4. 情緒標籤
5. 可展開的對話內容`,
      game: `生成一個小遊戲模式劇場，包含：
1. 遊戲開始介面
2. 遊戲進行中的互動元素
3. 分數或進度顯示
4. 結果結算頁面
5. 重新開始按鈕`
    };

    const systemPrompt = `你是一個專業的互動劇場內容生成器。你會根據用戶的描述生成精美的 HTML+CSS+JavaScript 互動內容。

嚴格遵循以下規範：
1. 輸出格式：完整的 HTML 代碼，包含內聯 <style> 標籤
2. 響應式設計：使用 max-width: 500px-800px，百分比寬度
3. 背景：body 背景設為 transparent，所有背景樣式應用在 .container 上
4. 滾動條：隱藏滾動條 (scrollbar-width: none)
5. 標題：使用 <p class="title-custom">，禁用 h1-h4 標籤
6. 動畫：使用 @keyframes，禁用 transition 屬性
7. 互動：所有可點擊元素必須有 :active { transform: scale(0.95); } 效果
8. 語言：簡體中文
9. 主題色：可使用 #e50914（紅色）作為強調色

${stylePrompts[style]}`;

    const userPrompt = `請根據以下描述生成一個${style === 'interactive' ? '互動式' : style === 'visual' ? '視覺化卡片' : style === 'dialogue' ? '對話式' : '小遊'小遊戲'}劇場：

【劇場描述】
${input}

【要求】
1. 內容必須與描述高度相關
2. 包含豐富的互動元素
3. 視覺效果精美
4. 適合手機和桌面端瀏覽
5. 直接輸出 HTML 代碼，不要有其他說明文字`;

    const url = config.url.endsWith('/chat/completions') 
      ? config.url 
      : config.url.replace(/\/$/, '') + '/chat/completions';

    const fetchWithTimeout = (url, options, timeoutMs = 120000) => {
      return new Promise((resolve, reject) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
          reject(new Error(`請求逾時 (${timeoutMs / 1000}秒)`));
        }, timeoutMs);

        fetch(url, {
          ...options,
          signal: controller.signal
        })
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
        console.log(`[Theater] 嘗試生成 (第 ${retryCount + 1} 次)，逾時: ${timeoutMs / 1000}秒`);

        const response = await fetchWithTimeout(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(config.key ? { 'Authorization': `Bearer ${config.key}` } : {})
          },
          body: JSON.stringify({
            model: config.model || 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.9,
            max_tokens: 3000
          })
        }, timeoutMs);

        if (!response.ok) {
          throw new Error(`API 請求失敗: ${response.status}`);
        }

        const data = await response.json();
        let html = data?.choices?.[0]?.message?.content || '';

        hidePreparingModal();

        const resultSection = document.getElementById('text-theater-result-section');
        const resultContent = document.getElementById('text-theater-result-content');

        if (resultSection && resultContent) {
          resultContent.innerHTML = html;
          resultSection.hidden = false;
        }

        console.log('[Theater] 生成成功');
        return;

      } catch (err) {
        lastError = err;
        retryCount++;
        console.warn(`[Theater] 第 ${retryCount} 次嘗試失敗:`, err.message);
        
        if (retryCount < maxRetries) {
          showToast(`生成失敗，正在重試 (${retryCount}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    hidePreparingModal();
    showToast(`生成失敗: ${lastError?.message || '未知錯誤'}（已嘗試 ${maxRetries} 次）`);
    console.error('文字劇場生成錯誤:', lastError);
  };

  const closeTextTheaterResult = () => {
    const resultSection = document.getElementById('text-theater-result-section');
    if (resultSection) resultSection.hidden = true;
  };

  const saveTextTheater = () => {
    const input = document.getElementById('text-theater-input')?.value?.trim();
    const html = document.getElementById('text-theater-result-content')?.innerHTML;
    
    if (!html) {
      showToast('沒有可保存的內容');
      return;
    }

    const newContent = {
      id: generateId(),
      title: input.substring(0, 30) + (input.length > 30 ? '...' : ''),
      desc: input,
      category: 'series',
      year: new Date().getFullYear(),
      cover: '',
      html: html,
      rating: 4.0,
      duration: '-',
      orientation: 'general',
      contentRating: 'general',
      tags: ['文字劇場', 'AI生成'],
      participants: [],
      world: input
    };

    contentData.unshift(newContent);
    saveData();
    closeTextTheaterResult();
    renderAll();
    showToast('已保存到劇目列表');
  };

  const openSettingsModal = () => {
    const modal = document.getElementById('settings-modal');
    if (modal) {
      modal.removeAttribute('hidden');
    }
    loadWorldbookEntriesForSettings();
  };

  const closeSettingsModal = () => {
    const modal = document.getElementById('settings-modal');
    if (modal) {
      modal.setAttribute('hidden', '');
    }
  };

  const loadWorldbookEntriesForSettings = () => {
    const category = document.getElementById('settings-worldbook-category')?.value || 'theater';
    const container = document.getElementById('settings-worldbook-entries');
    if (!container) return;

    try {
      const raw = localStorage.getItem(`sx_worldbook_${category}`);
      const entries = raw ? JSON.parse(raw) : [];
      
      if (!Array.isArray(entries) || entries.length === 0) {
        container.innerHTML = '<div class="empty-entries">此類別沒有條目</div>';
        return;
      }

      container.innerHTML = entries.map((entry, index) => `
        <div class="worldbook-entry-item" data-index="${index}">
          <label class="entry-checkbox">
            <input type="checkbox" data-entry-index="${index}">
            <span class="checkmark"></span>
          </label>
          <div class="entry-info">
            <h4 class="entry-title">${entry.title || `條目 ${index + 1}`}</h4>
            <p class="entry-preview">${(entry.content || '').substring(0, 100)}${entry.content?.length > 100 ? '...' : ''}</p>
            ${entry.triggers?.length ? `<span class="entry-triggers">觸發詞: ${entry.triggers.join(', ')}</span>` : ''}
          </div>
        </div>
      `).join('');

    } catch (e) {
      console.error('[Theater] 載入世界書條目失敗:', e);
      container.innerHTML = '<div class="error-message">載入失敗</div>';
    }
  };

  const selectAllEntries = () => {
    const checkboxes = document.querySelectorAll('#settings-worldbook-entries input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = true);
  };

  const deselectAllEntries = () => {
    const checkboxes = document.querySelectorAll('#settings-worldbook-entries input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
  };

  const batchImportFromWorldbook = () => {
    const category = document.getElementById('settings-worldbook-category')?.value || 'theater';
    const checkboxes = document.querySelectorAll('#settings-worldbook-entries input[type="checkbox"]:checked');
    
    if (checkboxes.length === 0) {
      showToast('請選擇要導入的條目');
      return;
    }

    try {
      const raw = localStorage.getItem(`sx_worldbook_${category}`);
      const entries = raw ? JSON.parse(raw) : [];
      
      let importCount = 0;
      checkboxes.forEach(cb => {
        const index = parseInt(cb.dataset.entryIndex);
        const entry = entries[index];
        if (!entry) return;

        const newContent = {
          id: generateId(),
          title: entry.title || `劇場 ${importCount + 1}`,
          desc: entry.content?.substring(0, 200) || '',
          category: 'series',
          year: new Date().getFullYear(),
          cover: '',
          html: `<div class="scene-box" style="background: linear-gradient(135deg, #1a1a2e, #16213e);">
            <h2 style="color: #e50914;">${entry.title || '場景'}</h2>
            <p style="color: #b3b3b3; line-height: 1.8;">${entry.content || ''}</p>
          </div>`,
          rating: 4.0,
          duration: '-',
          orientation: 'general',
          contentRating: 'general',
          tags: ['世界書導入', category],
          participants: [],
          world: entry.content || '',
          source: `worldbook_${category}`,
          sourceIndex: index
        };

        contentData.unshift(newContent);
        importCount++;
      });

      saveData();
      renderAll();
      closeSettingsModal();
      showToast(`已導入 ${importCount} 個劇場`);

    } catch (e) {
      console.error('[Theater] 批量導入失敗:', e);
      showToast('導入失敗');
    }
  };

  const clearAllContent = () => {
    if (!confirm('確定要清除所有劇場內容嗎？此操作無法復原。')) return;
    
    contentData = [...defaultContent];
    watchProgress = {};
    myList = [];
    saveData();
    renderAll();
    closeSettingsModal();
    showToast('已清除所有自訂內容');
  };

  const init = () => {
    loadData();
    renderAll();
    initEventListeners();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
