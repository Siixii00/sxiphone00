/**
 * Twitch App - SXI Phone
 * ‰∏Ä?ã‰ªø Twitch ?ÑÁõ¥?≠‰∏≤ÊµÅÊ??®Á?Âº? */

(function() {
  'use strict';

  // ==================== Ê®°Êì¨?∏Ê? ====================
  const mockData = {
    streams: [
      {
        id: 'stream-1',
        title: '?êÂÇ≥Ë™™Â?Ê±∫„ÄëÊ??∞ÂÇ≥Ë™™ÊÆµ‰ΩçÔ?‰∏ÄËµ∑Ë??ÜÔ?',
        streamer: '?ªÁ´∂Â∞èÁ?Â≠?,
        streamerAvatar: 'https://placehold.co/80x80/9146ff/ffffff?text=??,
        game: '?≥Ë™™Â∞çÊ±∫',
        viewers: 12580,
        thumbnail: 'https://placehold.co/640x360/1a1a2e/9146ff?text=?≥Ë™™Â∞çÊ±∫',
        isLive: true,
        category: 'gaming'
      },
      {
        id: 'stream-2',
        title: '?êËã±?ÑËÅØ?ü„ÄëÂè∞?çË??±‰?Ë∑?Day 3',
        streamer: 'LOLÂ§ßÂ∏´??,
        streamerAvatar: 'https://placehold.co/80x80/ff6b6b/ffffff?text=L',
        game: '?±È??ØÁ?',
        viewers: 8920,
        thumbnail: 'https://placehold.co/640x360/1a1a2e/ff6b6b?text=?±È??ØÁ?',
        isLive: true,
        category: 'gaming'
      },
      {
        id: 'stream-3',
        title: '?öÂ??äÂ§©ÂÆ§Ô?‰ªäÂ§©?éÂ??éÈ∫ºÊ®??',
        streamer: '?úÂ?‰∏ªÊí≠',
        streamerAvatar: 'https://placehold.co/80x80/ff9ff3/ffffff?text=??,
        game: 'Just Chatting',
        viewers: 5630,
        thumbnail: 'https://placehold.co/640x360/1a1a2e/ff9ff3?text=?äÂ§©',
        isLive: true,
        category: 'irl'
      },
      {
        id: 'stream-4',
        title: '?êÂ?Á•û„Ä?.5?àÊú¨?∞Ë??≤ÊäΩ?ΩÊ?Ôº?,
        streamer: '?üÁ??ªÁï•Áµ?,
        streamerAvatar: 'https://placehold.co/80x80/4ecdc4/ffffff?text=??,
        game: '?üÁ?',
        viewers: 7840,
        thumbnail: 'https://placehold.co/640x360/1a1a2e/4ecdc4?text=?üÁ?',
        isLive: true,
        category: 'gaming'
      },
      {
        id: 'stream-5',
        title: 'Ê∑±Â??≥Ê??ªÂè∞ÔΩûÊîæÈ¨Ü‰?‰∏?,
        streamer: 'DJÂ∞èÂ?',
        streamerAvatar: 'https://placehold.co/80x80/45b7d1/ffffff?text=D',
        game: 'Music',
        viewers: 3210,
        thumbnail: 'https://placehold.co/640x360/1a1a2e/45b7d1?text=?≥Ê?',
        isLive: true,
        category: 'music'
      },
      {
        id: 'stream-6',
        title: '?êVALORANT?ëÁâπ?∞Ëã±Ë±™Ê?‰ΩçË≥Ω',
        streamer: 'FPS?∞Á?',
        streamerAvatar: 'https://placehold.co/80x80/ff6348/ffffff?text=F',
        game: 'VALORANT',
        viewers: 6540,
        thumbnail: 'https://placehold.co/640x360/1a1a2e/ff6348?text=VALORANT',
        isLive: true,
        category: 'esports'
      },
      {
        id: 'stream-7',
        title: 'Áπ™Â??¥Êí≠ÔΩû‰?Â§©‰??´È¢®?ØÁï´',
        streamer: 'Áπ™Â∏´Â∞èÊ´ª',
        streamerAvatar: 'https://placehold.co/80x80/ffa502/ffffff?text=Áπ?,
        game: 'Art',
        viewers: 1890,
        thumbnail: 'https://placehold.co/640x360/1a1a2e/ffa502?text=Áπ™Â?',
        isLive: true,
        category: 'creative'
      },
      {
        id: 'stream-8',
        title: '?êMinecraft?ëÁ?Â≠òÂª∫ÁØâÊ??∞Ô?',
        streamer: 'È∫•Â??î‰∫∫',
        streamerAvatar: 'https://placehold.co/80x80/2ed573/ffffff?text=È∫?,
        game: 'Minecraft',
        viewers: 4320,
        thumbnail: 'https://placehold.co/640x360/1a1a2e/2ed573?text=Minecraft',
        isLive: true,
        category: 'gaming'
      }
    ],
    categories: [
      { id: 'cat-1', name: '?≥Ë™™Â∞çÊ±∫', viewers: 45680, cover: 'https://placehold.co/300x400/9146ff/ffffff?text=?≥Ë™™Â∞çÊ±∫' },
      { id: 'cat-2', name: '?±È??ØÁ?', viewers: 38420, cover: 'https://placehold.co/300x400/ff6b6b/ffffff?text=?±È??ØÁ?' },
      { id: 'cat-3', name: 'Just Chatting', viewers: 28930, cover: 'https://placehold.co/300x400/ff9ff3/ffffff?text=?äÂ§©' },
      { id: 'cat-4', name: '?üÁ?', viewers: 24560, cover: 'https://placehold.co/300x400/4ecdc4/ffffff?text=?üÁ?' },
      { id: 'cat-5', name: 'VALORANT', viewers: 19870, cover: 'https://placehold.co/300x400/ff6348/ffffff?text=VALORANT' },
      { id: 'cat-6', name: 'Minecraft', viewers: 16430, cover: 'https://placehold.co/300x400/2ed573/ffffff?text=Minecraft' }
    ],
    followedChannels: [
      { id: 'follow-1', name: '?ªÁ´∂Â∞èÁ?Â≠?, game: '?≥Ë™™Â∞çÊ±∫', viewers: 12580, avatar: 'https://placehold.co/60x60/9146ff/ffffff?text=??, isLive: true },
      { id: 'follow-2', name: '?úÂ?‰∏ªÊí≠', game: 'Just Chatting', viewers: 5630, avatar: 'https://placehold.co/60x60/ff9ff3/ffffff?text=??, isLive: true },
      { id: 'follow-3', name: '?äÊà≤ÂØ¶Ê?‰∏?, game: '', viewers: 0, avatar: 'https://placehold.co/60x60/71717a/ffffff?text=??, isLive: false }
    ],
    recommendedChannels: [
      { id: 'rec-1', name: 'LOLÂ§ßÂ∏´??, game: '?±È??ØÁ?', viewers: 8920, avatar: 'https://placehold.co/60x60/ff6b6b/ffffff?text=L', isLive: true },
      { id: 'rec-2', name: '?üÁ??ªÁï•Áµ?, game: '?üÁ?', viewers: 7840, avatar: 'https://placehold.co/60x60/4ecdc4/ffffff?text=??, isLive: true },
      { id: 'rec-3', name: 'FPS?∞Á?', game: 'VALORANT', viewers: 6540, avatar: 'https://placehold.co/60x60/ff6348/ffffff?text=F', isLive: true }
    ],
    featuredStreams: [
      {
        id: 'featured-1',
        title: '?êÈõªÁ´∂Èå¶Ê®ôË≥Ω?ëÁ∏ΩÊ±∫Ë≥Ω?¥Êí≠',
        streamer: 'ÂÆòÊñπ?¥Êí≠',
        game: '?ªÁ´∂Ë≥Ω‰?',
        viewers: 156780,
        thumbnail: 'https://placehold.co/1280x720/1a1a2e/9146ff?text=?ªÁ´∂?¶Ê?Ë≥?
      },
      {
        id: 'featured-2',
        title: '?êÊñ∞?äÊà≤?ºË°®?É„Ä?024?•Â≠£?ºË°®??,
        streamer: '?äÊà≤ÂÆòÊñπ',
        game: 'Special Events',
        viewers: 89340,
        thumbnail: 'https://placehold.co/1280x720/1a1a2e/ff6b6b?text=?ºË°®??
      },
      {
        id: 'featured-3',
        title: '?êÈü≥Ê®ÇÁ•≠?ëÁ?‰∏äÊ??±Ê??¥Êí≠',
        streamer: '?≥Ê??ªÈ?',
        game: 'Music',
        viewers: 45620,
        thumbnail: 'https://placehold.co/1280x720/1a1a2e/45b7d1?text=?≥Ê?Á•?
      }
    ],
    searchHistory: ['?≥Ë™™Â∞çÊ±∫', 'LOL', '?üÁ?', 'Just Chatting'],
    trendingSearches: ['?ªÁ´∂?¶Ê?Ë≥?, '?∞È??≤ÁôºË°®Ê?', '?≥Ê?Á•?, '?ΩÂç°ÂØ¶Ê?', '?üÂ??ëÊà∞']
  };

  // ==================== ?Ä?ãÁÆ°??====================
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

  // ==================== DOM ?ÉÁ? ====================
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

  // ==================== Â∑•ÂÖ∑?ΩÊï∏ ====================
  function formatViewers(num) {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '??;
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

  // ==================== Ê∏≤Ê??ΩÊï∏ ====================
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
          <div class="channel-game">${channel.game || '?¢Á?'}</div>
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
            ?¥Êí≠‰∏?          </div>
          <div class="featured-title">${stream.title}</div>
          <div class="featured-streamer">${stream.streamer}</div>
          <div class="featured-game">${stream.game} ¬∑ ${formatViewers(stream.viewers)} ‰ΩçË???/div>
        </div>
      `;
      
      item.addEventListener('click', () => {
        const fullStream = {
          ...stream,
          id: stream.id,
          streamerAvatar: 'https://placehold.co/80x80/9146ff/ffffff?text=ÂÆ?
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
          <span class="stream-live-badge">?¥Êí≠‰∏?/span>
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
        <div class="category-viewers">${formatViewers(category.viewers)} ‰ΩçË???/div>
      `;
      
      card.addEventListener('click', () => {
        // ÈªûÊ??ÜÈ??ÇÁØ©?∏Áõ¥??        const categoryMap = {
          '?≥Ë™™Â∞çÊ±∫': 'gaming',
          '?±È??ØÁ?': 'gaming',
          'Just Chatting': 'irl',
          '?üÁ?': 'gaming',
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
      { username: 'Â∞èÊ?', message: '‰∏ªÊí≠Â•ΩÂº∑Ôº?, type: 'normal' },
      { username: 'ÁÆ°Á???, message: 'Ê≠°Ë?Â§ßÂÆ∂‰æÜÂà∞?¥Êí≠?ìÔ?', type: 'moderator' },
      { username: 'Ë®ÇÈñ±?ÖA', message: 'Â∑≤Ë??±‰??ãÊ?‰∫ÜÔ?', type: 'subscriber' },
      { username: 'Ë∑Ø‰∫∫??, message: 'Á¨¨‰?Ê¨°‰??ãÁõ¥??, type: 'normal' },
      { username: 'Á≤âÁµ≤B', message: '‰∏ªÊí≠?†Ê≤πÔº?, type: 'normal' }
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
    
    // ÊªæÂ??∞Â???    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
  }

  // ==================== ?ÅÈù¢?ç‰? ====================
  function openStreamPage(stream) {
    state.currentStream = stream;
    state.isFollowing = false;
    
    elements.streamerName.textContent = stream.streamer;
    elements.streamCategory.textContent = stream.game;
    elements.streamerTitle.textContent = stream.streamer;
    elements.streamerBio.textContent = `Ê≠°Ë?‰æÜÂà∞ ${stream.streamer} ?ÑÁõ¥?≠È?ÔºÅ`;
    elements.streamerAvatar.src = stream.streamerAvatar;
    elements.viewerCount.textContent = `${formatViewers(stream.viewers)} ‰ΩçË??æ`;
    elements.followerCount.textContent = `${Math.floor(Math.random() * 100 + 10)}K ‰ΩçËøΩËπ§ËÄÖ`;
    
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
    elements.followBtn.textContent = state.isFollowing ? 'Â∑≤ËøΩËπ? : 'ËøΩËπ§';
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
    
    // Ê®°Êì¨?úÂ?ÁµêÊ?
    const results = mockData.streams.filter(s => 
      s.title.toLowerCase().includes(query.toLowerCase()) ||
      s.streamer.toLowerCase().includes(query.toLowerCase()) ||
      s.game.toLowerCase().includes(query.toLowerCase())
    );
    
    closeSearch();
    
    if (results.length > 0) {
      renderStreams();
      // ÊªæÂ??∞Áõ¥?≠Â???      document.querySelector('.streams-section').scrollIntoView({ behavior: 'smooth' });
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
    const categoryName = prompt('Ë´ãËº∏?•Êñ∞‰∏ªÈ??çÁ®±Ôº?);
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
    
    // ?πÊ?Ê®ôÁ±§È°ØÁ§∫‰∏çÂ??ßÂÆπ
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
      <span class="chat-username">??</span>
      <span class="chat-text">${message}</span>
    `;
    elements.chatMessages.appendChild(messageEl);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    elements.chatInput.value = '';
  }

  // ==================== ‰∫ã‰ª∂Á∂ÅÂ? ====================
  function bindEvents() {
    // ËøîÂ?
    elements.backBtn.addEventListener('click', () => {
      window.parent?.postMessage({ type: 'closeApp' }, '*');
    });

    // ?¥È?Ê¨?    elements.menuBtn.addEventListener('click', toggleSidebar);
    
    // ?úÂ?
    elements.searchBtn.addEventListener('click', openSearch);
    elements.closeSearchBtn.addEventListener('click', closeSearch);
    elements.searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        performSearch(e.target.value);
      }
    });
    
    // ?¥Êí≠?ÅÈù¢
    elements.closeStreamBtn.addEventListener('click', closeStreamPage);
    elements.followBtn.addEventListener('click', toggleFollow);
    elements.sendChatBtn.addEventListener('click', sendChatMessage);
    elements.chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendChatMessage();
      }
    });
    
    // Ê®ôÁ±§?áÊ?
    document.querySelectorAll('.stream-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.stream-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        const tabName = tab.dataset.tab;
        document.getElementById('chatPanel').style.display = tabName === 'chat' ? 'flex' : 'none';
        document.getElementById('infoPanel').style.display = tabName === 'info' ? 'block' : 'none';
      });
    });
    
    // ?ÜÈ?Ê®ôÁ±§
    if (elements.categorySelect) {
      elements.categorySelect.addEventListener('change', (e) => {
        switchCategory(e.target.value);
      });
    }
    
    if (elements.addCategoryBtn) {
      elements.addCategoryBtn.addEventListener('click', addCategory);
    }
    
    loadCustomCategories();
    
    // Â∫ïÈÉ®Â∞éËà™
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        switchTab(item.dataset.tab);
      });
    });
    
    // ÈªûÊ?Â§ñÈÉ®?úÈ??¥È?Ê¨?    document.addEventListener('click', (e) => {
      if (state.sidebarOpen && 
          !elements.sidebar.contains(e.target) && 
          !elements.menuBtn.contains(e.target)) {
        toggleSidebar();
      }
    });
    
    // ?µÁõ§Âø´Êç∑??    document.addEventListener('keydown', (e) => {
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

  // ==================== Settings ?¥Â? ====================
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

  // ==================== iOS Safari / Android Chrome ?≤Â?‰øùË≠∑ ====================
  const saveTwitchData = () => {
    try {
      localStorage.setItem('sx_twitch_search_history', JSON.stringify(mockData.searchHistory));
    } catch (e) {
      console.warn('[twitch] ‰øùÂ??∏Ê?Â§±Ê?:', e);
    }
  };

  window.addEventListener('pagehide', saveTwitchData);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveTwitchData();
  });
  window.addEventListener('message', (event) => {
    if (event.data?.type === 'APP_WILL_CLOSE') saveTwitchData();
  });

  // ==================== ?ùÂ???====================
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

  // ?üÂ??âÁî®
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ==================== AI ?üÊ??üËÉΩ ====================
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
            entries.push(`??{e.title}??{e.content.slice(0, 200)}`);
          }
        });
      }
    }
    return entries.length > 0 ? entries.join('\n') : '?°‰??åÊõ∏Ë®≠Â?';
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
    if (history.length === 0) return '?°Ë?Â§©Ë???;
    const user = getTwitchUserData();
    return history.map(msg => {
      const role = msg.role === 'user' ? user.name : 'ËßíËâ≤';
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
      throw new Error('Â∞öÊú™Ë®≠Â? API');
    }

    const apiType = config.type || 'openai';
    
    // Gemini ?üÁ? API ?ºÂ?
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
        throw new Error('Gemini API ?ØË™§ (' + response.status + ')');
      }
      
      const data = await response.json();
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
    
    // OpenAI ?∏ÂÆπ?ºÂ??ñËá™Ë®ÇÁ´ØÈª?    let endpoint;
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

  function buildTwitchContext() {
    const user = getTwitchUserData();
    const char = getTwitchActiveCharacter();
    const worldbook = getTwitchWorldbookContext();
    const chatHistory = getTwitchChatHistoryContext();

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

  let isGeneratingStreams = false;

  async function generateAIStreams() {
    if (isGeneratingStreams) {
      alert('Ê≠?ú®?üÊ?‰∏≠Ô?Ë´ãÁ???..');
      return;
    }

    isGeneratingStreams = true;

    try {
      const context = buildTwitchContext();
      const lang = localStorage.getItem('sxiphone_lang') || 'zh-TW';

      const systemPrompt = `‰Ω†ÊòØ‰∏Ä‰ΩçÂ?Ê•≠Á??¥Êí≠?ßÂÆπ?µ‰??ÖÔ??ÖÈï∑?πÊ?ËßíËâ≤Ë®≠Â??å‰Ωø?®ËÄÖË??ØÂâµ‰ΩúÁ¨¶?à‰∫∫?©ÊÄßÊ†º?ÑÁõ¥?≠Ê?È°åÂ??èËø∞??Ë´ã‰Ωø??${window.getAIReadableLangName?.(lang) || 'ÁπÅÈ?‰∏≠Ê?'} ?∞ÂØ´??Ëº∏Âá∫?ºÂ???JSON: {"streams": [{"title": "?¥Êí≠Ê®ôÈ?", "streamer": "ÂØ¶Ê?‰∏ªÂ?Á®?, "game": "?äÊà≤?çÁ®±", "viewers": ËßÄ?ã‰∫∫?∏}]}`;

      const prompt = `${context}

Ë´ãÁ???3 ??Twitch ?¥Êí≠ÔºåË?Ê±ÇÔ?
1. Á¨¶Â?ËßíËâ≤?ßÊ†º?å‰Ωø?®ËÄÖË®≠ÂÆ?2. ?™ÁÑ∂?çÂÖ•‰∏ñÁ??∏Ë®≠ÂÆ?3. Ê®ôÈ?Ë¶ÅÊ??∏Â???4. ?Ø‰ª•?ØÈ??≤„ÄÅË?Â§©„ÄÅÈü≥Ê®ÇÁ?È°ûÂ?

Ëº∏Âá∫ JSON ?ºÂ??Ç`;

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
            streamer: stream.streamer || 'AI ÂØ¶Ê?‰∏?,
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
        alert('?üÊ?Â§±Ê?ÔºåË?Á®çÂ??çË©¶');
      }
    } catch (err) {
      alert(`?üÊ?Â§±Ê?: ${err.message}`);
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
