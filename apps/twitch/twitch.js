/**
 * Twitch App - SXI Phone
 * 一個仿 Twitch 的直播串流應用程式
 */

(function() {
  'use strict';

  // ==================== 模擬數據 ====================
  const mockData = {
    streams: [
      {
        id: 'stream-1',
        title: '【傳說對決】挑戰傳說段位！一起衝分！',
        streamer: '電競小王子',
        streamerAvatar: 'https://placehold.co/80x80/9146ff/ffffff?text=王',
        game: '傳說對決',
        viewers: 12580,
        thumbnail: 'https://placehold.co/640x360/1a1a2e/9146ff?text=傳說對決',
        isLive: true,
        category: 'gaming'
      },
      {
        id: 'stream-2',
        title: '【英雄聯盟】台服菁英之路 Day 3',
        streamer: 'LOL大師兄',
        streamerAvatar: 'https://placehold.co/80x80/ff6b6b/ffffff?text=L',
        game: '英雄聯盟',
        viewers: 8920,
        thumbnail: 'https://placehold.co/640x360/1a1a2e/ff6b6b?text=英雄聯盟',
        isLive: true,
        category: 'gaming'
      },
      {
        id: 'stream-3',
        title: '晚安聊天室～今天過得怎麼樣？',
        streamer: '甜心主播',
        streamerAvatar: 'https://placehold.co/80x80/ff9ff3/ffffff?text=甜',
        game: 'Just Chatting',
        viewers: 5630,
        thumbnail: 'https://placehold.co/640x360/1a1a2e/ff9ff3?text=聊天',
        isLive: true,
        category: 'irl'
      },
      {
        id: 'stream-4',
        title: '【原神】4.5版本新角色抽抽樂！',
        streamer: '原神攻略組',
        streamerAvatar: 'https://placehold.co/80x80/4ecdc4/ffffff?text=原',
        game: '原神',
        viewers: 7840,
        thumbnail: 'https://placehold.co/640x360/1a1a2e/4ecdc4?text=原神',
        isLive: true,
        category: 'gaming'
      },
      {
        id: 'stream-5',
        title: '深夜音樂電台～放鬆一下',
        streamer: 'DJ小夜',
        streamerAvatar: 'https://placehold.co/80x80/45b7d1/ffffff?text=D',
        game: 'Music',
        viewers: 3210,
        thumbnail: 'https://placehold.co/640x360/1a1a2e/45b7d1?text=音樂',
        isLive: true,
        category: 'music'
      },
      {
        id: 'stream-6',
        title: '【VALORANT】特戰英豪排位賽',
        streamer: 'FPS戰神',
        streamerAvatar: 'https://placehold.co/80x80/ff6348/ffffff?text=F',
        game: 'VALORANT',
        viewers: 6540,
        thumbnail: 'https://placehold.co/640x360/1a1a2e/ff6348?text=VALORANT',
        isLive: true,
        category: 'esports'
      },
      {
        id: 'stream-7',
        title: '繪圖直播～今天來畫風景畫',
        streamer: '繪師小櫻',
        streamerAvatar: 'https://placehold.co/80x80/ffa502/ffffff?text=繪',
        game: 'Art',
        viewers: 1890,
        thumbnail: 'https://placehold.co/640x360/1a1a2e/ffa502?text=繪圖',
        isLive: true,
        category: 'creative'
      },
      {
        id: 'stream-8',
        title: '【Minecraft】生存建築挑戰！',
        streamer: '麥塊達人',
        streamerAvatar: 'https://placehold.co/80x80/2ed573/ffffff?text=麥',
        game: 'Minecraft',
        viewers: 4320,
        thumbnail: 'https://placehold.co/640x360/1a1a2e/2ed573?text=Minecraft',
        isLive: true,
        category: 'gaming'
      }
    ],
    categories: [
      { id: 'cat-1', name: '傳說對決', viewers: 45680, cover: 'https://placehold.co/300x400/9146ff/ffffff?text=傳說對決' },
      { id: 'cat-2', name: '英雄聯盟', viewers: 38420, cover: 'https://placehold.co/300x400/ff6b6b/ffffff?text=英雄聯盟' },
      { id: 'cat-3', name: 'Just Chatting', viewers: 28930, cover: 'https://placehold.co/300x400/ff9ff3/ffffff?text=聊天' },
      { id: 'cat-4', name: '原神', viewers: 24560, cover: 'https://placehold.co/300x400/4ecdc4/ffffff?text=原神' },
      { id: 'cat-5', name: 'VALORANT', viewers: 19870, cover: 'https://placehold.co/300x400/ff6348/ffffff?text=VALORANT' },
      { id: 'cat-6', name: 'Minecraft', viewers: 16430, cover: 'https://placehold.co/300x400/2ed573/ffffff?text=Minecraft' }
    ],
    followedChannels: [
      { id: 'follow-1', name: '電競小王子', game: '傳說對決', viewers: 12580, avatar: 'https://placehold.co/60x60/9146ff/ffffff?text=王', isLive: true },
      { id: 'follow-2', name: '甜心主播', game: 'Just Chatting', viewers: 5630, avatar: 'https://placehold.co/60x60/ff9ff3/ffffff?text=甜', isLive: true },
      { id: 'follow-3', name: '遊戲實況主', game: '', viewers: 0, avatar: 'https://placehold.co/60x60/71717a/ffffff?text=遊', isLive: false }
    ],
    recommendedChannels: [
      { id: 'rec-1', name: 'LOL大師兄', game: '英雄聯盟', viewers: 8920, avatar: 'https://placehold.co/60x60/ff6b6b/ffffff?text=L', isLive: true },
      { id: 'rec-2', name: '原神攻略組', game: '原神', viewers: 7840, avatar: 'https://placehold.co/60x60/4ecdc4/ffffff?text=原', isLive: true },
      { id: 'rec-3', name: 'FPS戰神', game: 'VALORANT', viewers: 6540, avatar: 'https://placehold.co/60x60/ff6348/ffffff?text=F', isLive: true }
    ],
    featuredStreams: [
      {
        id: 'featured-1',
        title: '【電競錦標賽】總決賽直播',
        streamer: '官方直播',
        game: '電競賽事',
        viewers: 156780,
        thumbnail: 'https://placehold.co/1280x720/1a1a2e/9146ff?text=電競錦標賽'
      },
      {
        id: 'featured-2',
        title: '【新遊戲發表會】2024春季發表會',
        streamer: '遊戲官方',
        game: 'Special Events',
        viewers: 89340,
        thumbnail: 'https://placehold.co/1280x720/1a1a2e/ff6b6b?text=發表會'
      },
      {
        id: 'featured-3',
        title: '【音樂祭】線上演唱會直播',
        streamer: '音樂頻道',
        game: 'Music',
        viewers: 45620,
        thumbnail: 'https://placehold.co/1280x720/1a1a2e/45b7d1?text=音樂祭'
      }
    ],
    searchHistory: ['傳說對決', 'LOL', '原神', 'Just Chatting'],
    trendingSearches: ['電競錦標賽', '新遊戲發表會', '音樂祭', '抽卡實況', '生存挑戰']
  };

  // ==================== 狀態管理 ====================
  const state = {
    currentCategory: 'all',
    currentTab: 'home',
    currentStream: null,
    isFollowing: false,
    carouselIndex: 0,
    sidebarOpen: false,
    searchOpen: false,
    streamPageOpen: false
  };

  // ==================== DOM 元素 ====================
  const elements = {
    backBtn: document.getElementById('backBtn'),
    menuBtn: document.getElementById('menuBtn'),
    searchBtn: document.getElementById('searchBtn'),
    sidebar: document.getElementById('sidebar'),
    recommendedChannels: document.getElementById('recommendedChannels'),
    followedChannels: document.getElementById('followedChannels'),
    categorySelect: document.getElementById('categorySelect'),
    addCategoryBtn: document.getElementById('addCategoryBtn'),
    featuredCarousel: document.getElementById('featuredCarousel'),
    carouselDots: document.getElementById('carouselDots'),
    streamsGrid: document.getElementById('streamsGrid'),
    categoriesGrid: document.getElementById('categoriesGrid'),
    searchPanel: document.getElementById('searchPanel'),
    closeSearchBtn: document.getElementById('closeSearchBtn'),
    searchInput: document.getElementById('searchInput'),
    historyList: document.getElementById('historyList'),
    trendingList: document.getElementById('trendingList'),
    streamPage: document.getElementById('streamPage'),
    closeStreamBtn: document.getElementById('closeStreamBtn'),
    streamerName: document.getElementById('streamerName'),
    streamCategory: document.getElementById('streamCategory'),
    followBtn: document.getElementById('followBtn'),
    chatMessages: document.getElementById('chatMessages'),
    chatInput: document.getElementById('chatInput'),
    sendChatBtn: document.getElementById('sendChatBtn'),
    streamerAvatar: document.getElementById('streamerAvatar'),
    streamerTitle: document.getElementById('streamerTitle'),
    streamerBio: document.getElementById('streamerBio'),
    viewerCount: document.getElementById('viewerCount'),
    followerCount: document.getElementById('followerCount')
  };

  // ==================== 工具函數 ====================
  function formatViewers(num) {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '萬';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  // ==================== 渲染函數 ====================
  function renderChannels(container, channels) {
    container.innerHTML = '';
    
    channels.forEach(channel => {
      const item = document.createElement('div');
      item.className = 'channel-item';
      item.innerHTML = `
        <div class="channel-avatar">
          <img src="${channel.avatar}" alt="${channel.name}">
        </div>
        <div class="channel-info">
          <div class="channel-name">${channel.name}</div>
          <div class="channel-game">${channel.game || '離線'}</div>
        </div>
        ${channel.isLive ? `
          <div class="channel-viewers">
            <span class="live-indicator"></span>
            <span>${formatViewers(channel.viewers)}</span>
          </div>
        ` : ''}
      `;
      
      item.addEventListener('click', () => {
        if (channel.isLive) {
          const stream = mockData.streams.find(s => s.streamer === channel.name);
          if (stream) {
            openStreamPage(stream);
          }
        }
      });
      
      container.appendChild(item);
    });
  }

  function renderFeaturedCarousel() {
    elements.featuredCarousel.innerHTML = '';
    elements.carouselDots.innerHTML = '';
    
    mockData.featuredStreams.forEach((stream, index) => {
      const item = document.createElement('div');
      item.className = `featured-item ${index === 0 ? 'active' : ''}`;
      item.innerHTML = `
        <img class="featured-thumbnail" src="${stream.thumbnail}" alt="${stream.title}">
        <div class="featured-overlay">
          <div class="featured-live-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="6"/>
            </svg>
            直播中
          </div>
          <div class="featured-title">${stream.title}</div>
          <div class="featured-streamer">${stream.streamer}</div>
          <div class="featured-game">${stream.game} · ${formatViewers(stream.viewers)} 位觀眾</div>
        </div>
      `;
      
      item.addEventListener('click', () => {
        const fullStream = {
          ...stream,
          id: stream.id,
          streamerAvatar: 'https://placehold.co/80x80/9146ff/ffffff?text=官'
        };
        openStreamPage(fullStream);
      });
      
      elements.featuredCarousel.appendChild(item);
      
      const dot = document.createElement('button');
      dot.className = `carousel-dot ${index === 0 ? 'active' : ''}`;
      dot.addEventListener('click', () => goToSlide(index));
      elements.carouselDots.appendChild(dot);
    });
  }

  function goToSlide(index) {
    state.carouselIndex = index;
    
    const items = elements.featuredCarousel.querySelectorAll('.featured-item');
    const dots = elements.carouselDots.querySelectorAll('.carousel-dot');
    
    items.forEach((item, i) => {
      item.classList.toggle('active', i === index);
    });
    
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
  }

  function autoRotateCarousel() {
    setInterval(() => {
      const nextIndex = (state.carouselIndex + 1) % mockData.featuredStreams.length;
      goToSlide(nextIndex);
    }, 5000);
  }

  function renderStreams(category = 'all') {
    elements.streamsGrid.innerHTML = '';
    
    let streams = mockData.streams;
    if (category !== 'all') {
      streams = streams.filter(s => s.category === category);
    }
    
    streams.forEach(stream => {
      const card = document.createElement('div');
      card.className = 'stream-card';
      card.innerHTML = `
        <div class="stream-thumbnail">
          <img src="${stream.thumbnail}" alt="${stream.title}">
          <span class="stream-live-badge">直播中</span>
          <span class="stream-viewers">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="6"/>
            </svg>
            ${formatViewers(stream.viewers)}
          </span>
        </div>
        <div class="stream-info">
          <div class="streamer-avatar">
            <img src="${stream.streamerAvatar}" alt="${stream.streamer}">
          </div>
          <div class="stream-details">
            <div class="stream-title">${stream.title}</div>
            <div class="stream-channel">${stream.streamer}</div>
            <div class="stream-game">${stream.game}</div>
          </div>
        </div>
      `;
      
      card.addEventListener('click', () => openStreamPage(stream));
      elements.streamsGrid.appendChild(card);
    });
  }

  function renderCategories() {
    elements.categoriesGrid.innerHTML = '';
    
    mockData.categories.forEach(category => {
      const card = document.createElement('div');
      card.className = 'category-card';
      card.innerHTML = `
        <div class="category-cover">
          <img src="${category.cover}" alt="${category.name}">
        </div>
        <div class="category-name">${category.name}</div>
        <div class="category-viewers">${formatViewers(category.viewers)} 位觀眾</div>
      `;
      
      card.addEventListener('click', () => {
        // 點擊分類時篩選直播
        const categoryMap = {
          '傳說對決': 'gaming',
          '英雄聯盟': 'gaming',
          'Just Chatting': 'irl',
          '原神': 'gaming',
          'VALORANT': 'esports',
          'Minecraft': 'gaming'
        };
        renderStreams(categoryMap[category.name] || 'all');
      });
      
      elements.categoriesGrid.appendChild(card);
    });
  }

  function renderSearchHistory() {
    elements.historyList.innerHTML = '';
    
    mockData.searchHistory.forEach(term => {
      const item = document.createElement('div');
      item.className = 'history-item';
      item.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
        </svg>
        <span>${term}</span>
      `;
      
      item.addEventListener('click', () => {
        elements.searchInput.value = term;
        performSearch(term);
      });
      
      elements.historyList.appendChild(item);
    });
  }

  function renderTrendingSearches() {
    elements.trendingList.innerHTML = '';
    
    mockData.trendingSearches.forEach(term => {
      const item = document.createElement('div');
      item.className = 'trending-item';
      item.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
        </svg>
        <span>${term}</span>
      `;
      
      item.addEventListener('click', () => {
        elements.searchInput.value = term;
        performSearch(term);
      });
      
      elements.trendingList.appendChild(item);
    });
  }

  function renderChatMessages() {
    const messages = [
      { username: '小明', message: '主播好強！', type: 'normal' },
      { username: '管理員', message: '歡迎大家來到直播間～', type: 'moderator' },
      { username: '訂閱者A', message: '已訂閱三個月了！', type: 'subscriber' },
      { username: '路人甲', message: '第一次來看直播', type: 'normal' },
      { username: '粉絲B', message: '主播加油！', type: 'normal' }
    ];
    
    elements.chatMessages.innerHTML = '';
    
    messages.forEach(msg => {
      const messageEl = document.createElement('div');
      messageEl.className = 'chat-message';
      messageEl.innerHTML = `
        <span class="chat-username ${msg.type}">${msg.username}:</span>
        <span class="chat-text">${msg.message}</span>
      `;
      elements.chatMessages.appendChild(messageEl);
    });
    
    // 滾動到底部
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
  }

  // ==================== 頁面操作 ====================
  function openStreamPage(stream) {
    state.currentStream = stream;
    state.isFollowing = false;
    
    elements.streamerName.textContent = stream.streamer;
    elements.streamCategory.textContent = stream.game;
    elements.streamerTitle.textContent = stream.streamer;
    elements.streamerBio.textContent = `歡迎來到 ${stream.streamer} 的直播間！`;
    elements.streamerAvatar.src = stream.streamerAvatar;
    elements.viewerCount.textContent = `${formatViewers(stream.viewers)} 位觀眾`;
    elements.followerCount.textContent = `${Math.floor(Math.random() * 100 + 10)}K 位追蹤者`;
    
    updateFollowButton();
    renderChatMessages();
    
    elements.streamPage.classList.add('open');
    state.streamPageOpen = true;
  }

  function closeStreamPage() {
    elements.streamPage.classList.remove('open');
    state.streamPageOpen = false;
    state.currentStream = null;
  }

  function toggleFollow() {
    state.isFollowing = !state.isFollowing;
    updateFollowButton();
  }

  function updateFollowButton() {
    elements.followBtn.textContent = state.isFollowing ? '已追蹤' : '追蹤';
    elements.followBtn.classList.toggle('following', state.isFollowing);
  }

  function openSearch() {
    elements.searchPanel.classList.add('open');
    state.searchOpen = true;
    elements.searchInput.focus();
  }

  function closeSearch() {
    elements.searchPanel.classList.remove('open');
    state.searchOpen = false;
    elements.searchInput.value = '';
  }

  function performSearch(query) {
    if (!query.trim()) return;
    
    // 模擬搜尋結果
    const results = mockData.streams.filter(s => 
      s.title.toLowerCase().includes(query.toLowerCase()) ||
      s.streamer.toLowerCase().includes(query.toLowerCase()) ||
      s.game.toLowerCase().includes(query.toLowerCase())
    );
    
    closeSearch();
    
    if (results.length > 0) {
      renderStreams();
      // 滾動到直播區域
      document.querySelector('.streams-section').scrollIntoView({ behavior: 'smooth' });
    }
  }

  function toggleSidebar() {
    state.sidebarOpen = !state.sidebarOpen;
    elements.sidebar.classList.toggle('open', state.sidebarOpen);
  }

  function switchCategory(category) {
    state.currentCategory = category;
    if (elements.categorySelect) {
      elements.categorySelect.value = category;
    }
    renderStreams(category);
  }

  function addCategory() {
    const categoryName = prompt('請輸入新主題名稱：');
    if (!categoryName || !categoryName.trim()) return;
    
    const categoryId = categoryName.trim().toLowerCase().replace(/\s+/g, '-');
    const option = document.createElement('option');
    option.value = categoryId;
    option.textContent = categoryName.trim();
    
    if (elements.categorySelect) {
      elements.categorySelect.appendChild(option);
      elements.categorySelect.value = categoryId;
      switchCategory(categoryId);
      
      const categories = JSON.parse(localStorage.getItem('twitch_categories') || '[]');
      if (!categories.find(c => c.id === categoryId)) {
        categories.push({ id: categoryId, name: categoryName.trim() });
        localStorage.setItem('twitch_categories', JSON.stringify(categories));
      }
    }
  }

  function loadCustomCategories() {
    const categories = JSON.parse(localStorage.getItem('twitch_categories') || '[]');
    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.id;
      option.textContent = cat.name;
      if (elements.categorySelect) {
        elements.categorySelect.appendChild(option);
      }
    });
  }

  function switchTab(tab) {
    state.currentTab = tab;
    
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.tab === tab);
    });
    
    // 根據標籤顯示不同內容
    if (tab === 'following') {
      renderStreams('all');
    } else {
      renderStreams(state.currentCategory);
    }
  }

  function sendChatMessage() {
    const message = elements.chatInput.value.trim();
    if (!message) return;
    
    const messageEl = document.createElement('div');
    messageEl.className = 'chat-message';
    messageEl.innerHTML = `
      <span class="chat-username">我:</span>
      <span class="chat-text">${message}</span>
    `;
    elements.chatMessages.appendChild(messageEl);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    elements.chatInput.value = '';
  }

  // ==================== 事件綁定 ====================
  function bindEvents() {
    // 返回
    elements.backBtn.addEventListener('click', () => {
      window.parent?.postMessage({ type: 'closeApp' }, '*');
    });

    // 側邊欄
    elements.menuBtn.addEventListener('click', toggleSidebar);
    
    // 搜尋
    elements.searchBtn.addEventListener('click', openSearch);
    elements.closeSearchBtn.addEventListener('click', closeSearch);
    elements.searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        performSearch(e.target.value);
      }
    });
    
    // 直播頁面
    elements.closeStreamBtn.addEventListener('click', closeStreamPage);
    elements.followBtn.addEventListener('click', toggleFollow);
    elements.sendChatBtn.addEventListener('click', sendChatMessage);
    elements.chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendChatMessage();
      }
    });
    
    // 標籤切換
    document.querySelectorAll('.stream-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.stream-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        const tabName = tab.dataset.tab;
        document.getElementById('chatPanel').style.display = tabName === 'chat' ? 'flex' : 'none';
        document.getElementById('infoPanel').style.display = tabName === 'info' ? 'block' : 'none';
      });
    });
    
    // 分類標籤
    if (elements.categorySelect) {
      elements.categorySelect.addEventListener('change', (e) => {
        switchCategory(e.target.value);
      });
    }
    
    if (elements.addCategoryBtn) {
      elements.addCategoryBtn.addEventListener('click', addCategory);
    }
    
    loadCustomCategories();
    
    // 底部導航
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        switchTab(item.dataset.tab);
      });
    });
    
    // 點擊外部關閉側邊欄
    document.addEventListener('click', (e) => {
      if (state.sidebarOpen && 
          !elements.sidebar.contains(e.target) && 
          !elements.menuBtn.contains(e.target)) {
        toggleSidebar();
      }
    });
    
    // 鍵盤快捷鍵
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (state.streamPageOpen) {
          closeStreamPage();
        } else if (state.searchOpen) {
          closeSearch();
        } else if (state.sidebarOpen) {
          toggleSidebar();
        }
      }
    });
  }

  // ==================== Settings 整合 ====================
  function loadSxSettings() {
    if (typeof SxSettings === 'undefined') return null;
    return SxSettings.getSettingsSnapshot();
  }

  function getStreamerPersona(streamerName) {
    if (typeof SxSettings === 'undefined') return null;
    const char = SxSettings.getCharByName(streamerName);
    if (char) return char;
    const user = SxSettings.getUserByName(streamerName);
    if (user) return user;
    return SxSettings.getNpcByName(streamerName);
  }

  // ==================== iOS Safari / Android Chrome 儲存保護 ====================
  const saveTwitchData = () => {
    try {
      localStorage.setItem('sx_twitch_search_history', JSON.stringify(mockData.searchHistory));
    } catch (e) {
      console.warn('[twitch] 保存數據失敗:', e);
    }
  };

  window.addEventListener('pagehide', saveTwitchData);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveTwitchData();
  });
  window.addEventListener('message', (event) => {
    if (event.data?.type === 'APP_WILL_CLOSE') saveTwitchData();
  });

  // ==================== 初始化 ====================
  function init() {
    const settings = loadSxSettings();
    if (settings) {
      console.log('[twitch] Loaded settings:', {
        characters: settings.characters.length,
        users: settings.users.length,
        npcs: settings.npcs.length,
        apis: settings.apis.length
      });
    }
    
    renderChannels(elements.recommendedChannels, mockData.recommendedChannels);
    renderChannels(elements.followedChannels, mockData.followedChannels);
    renderFeaturedCarousel();
    renderStreams();
    renderCategories();
    renderSearchHistory();
    renderTrendingSearches();
    autoRotateCarousel();
    bindEvents();
    
    console.log('Twitch app initialized');
  }

  // 啟動應用
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ==================== AI 生成功能 ====================
  function getTwitchWorldbookData() {
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

  function getTwitchWorldbookContext() {
    const data = getTwitchWorldbookData();
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
  }

  function getTwitchCharacterData(name) {
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

  function getTwitchActiveCharacter() {
    const activeName = localStorage.getItem('sx_char_name');
    return getTwitchCharacterData(activeName);
  }

  function getTwitchUserData() {
    return {
      name: localStorage.getItem('sx_user_name') || 'User',
      personality: localStorage.getItem('sx_user_personality') || '',
      background: localStorage.getItem('sx_user_background') || ''
    };
  }

  function getTwitchChatHistory(limit = 15) {
    const raw = localStorage.getItem('sx_chat_history');
    if (!raw) return [];
    try {
      const history = JSON.parse(raw);
      return history.slice(-limit);
    } catch {
      return [];
    }
  }

  function getTwitchChatHistoryContext() {
    const history = getTwitchChatHistory(15);
    if (history.length === 0) return '無聊天記錄';
    const user = getTwitchUserData();
    return history.map(msg => {
      const role = msg.role === 'user' ? user.name : '角色';
      return `${role}: ${msg.content.slice(0, 100)}`;
    }).join('\n');
  }

  function getTwitchApiConfig() {
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

  async function callTwitchAIAPI(messages, temperature = 0.85) {
    const config = getTwitchApiConfig();
    if (!config || !config.url) {
      throw new Error('尚未設定 API');
    }

    const apiType = config.type || 'openai';
    
    // Gemini 原生 API 格式
    if (apiType === 'gemini') {
      const model = config.model || 'gemini-1.5-flash';
      const targetUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + config.key;
      
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
        throw new Error('Gemini API 錯誤 (' + response.status + ')');
      }
      
      const data = await response.json();
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
    
    // OpenAI 相容格式或自訂端點
    let endpoint;
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
      throw new Error(`API 錯誤 (${response.status})`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  function buildTwitchContext() {
    const user = getTwitchUserData();
    const char = getTwitchActiveCharacter();
    const worldbook = getTwitchWorldbookContext();
    const chatHistory = getTwitchChatHistoryContext();

    let context = `# 使用者設定\n名稱: ${user.name}\n`;
    if (user.personality) context += `性格: ${user.personality}\n`;
    if (user.background) context += `背景: ${user.background}\n`;

    if (char) {
      context += `\n# 角色設定\n名稱: ${char.name}\n`;
      if (char.personality) context += `性格: ${char.personality}\n`;
      if (char.background) context += `背景: ${char.background}\n`;
    }

    context += `\n# 世界書\n${worldbook}\n`;

    if (chatHistory !== '無聊天記錄') {
      context += `\n# 近期對話\n${chatHistory}\n`;
    }

    return context;
  }

  let isGeneratingStreams = false;

  async function generateAIStreams() {
    if (isGeneratingStreams) {
      alert('正在生成中，請稍候...');
      return;
    }

    isGeneratingStreams = true;

    try {
      const context = buildTwitchContext();
      const lang = localStorage.getItem('sxiphone_lang') || 'zh-TW';

      const systemPrompt = `你是一位專業的直播內容創作者，擅長根據角色設定和使用者背景創作符合人物性格的直播標題和描述。
請使用 ${window.getAIReadableLangName?.(lang) || '繁體中文'} 撰寫。
輸出格式為 JSON: {"streams": [{"title": "直播標題", "streamer": "實況主名稱", "game": "遊戲名稱", "viewers": 觀看人數}]}`;

      const prompt = `${context}

請生成 3 個 Twitch 直播，要求：
1. 符合角色性格和使用者設定
2. 自然融入世界書設定
3. 標題要有吸引力
4. 可以是遊戲、聊天、音樂等類型

輸出 JSON 格式。`;

      const result = await callTwitchAIAPI([
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

      const streams = Array.isArray(parsed?.streams) ? parsed.streams : [];

      streams.forEach((stream, index) => {
        if (stream.title) {
          mockData.streams.unshift({
            id: `ai-stream-${Date.now()}-${index}`,
            title: stream.title,
            streamer: stream.streamer || 'AI 實況主',
            streamerAvatar: 'https://placehold.co/80x80/9146ff/ffffff?text=AI',
            game: stream.game || 'Just Chatting',
            viewers: stream.viewers || Math.floor(Math.random() * 10000),
            thumbnail: 'https://placehold.co/640x360/1a1a2e/9146ff?text=AI',
            isLive: true,
            category: 'gaming'
          });
        }
      });

      if (streams.length > 0) {
        renderStreams();
      } else {
        alert('生成失敗，請稍後重試');
      }
    } catch (err) {
      alert(`生成失敗: ${err.message}`);
    } finally {
      isGeneratingStreams = false;
    }
  }

  document.addEventListener('click', (event) => {
    if (event.target.closest('#ai-generate-twitch-btn')) {
      generateAIStreams();
    }
  });
})();
