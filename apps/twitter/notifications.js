if (typeof window.NOTIFICATIONS_KEY === 'undefined') {
  window.NOTIFICATIONS_KEY = 'sx_twitter_notifications';
  window.PENDING_REACTIONS_KEY = 'sx_twitter_pending_reactions';
}
const NOTIFICATIONS_KEY = window.NOTIFICATIONS_KEY;
const PENDING_REACTIONS_KEY = window.PENDING_REACTIONS_KEY;

function getNotifications() {
  const raw = localStorage.getItem(NOTIFICATIONS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveNotifications(notifications) {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
}

function addNotification(notification) {
  const notifications = getNotifications();
  notifications.unshift({
    ...notification,
    id: Date.now() + Math.random(),
    timestamp: Date.now(),
    read: false
  });
  if (notifications.length > 100) {
    notifications.length = 100;
  }
  saveNotifications(notifications);
  updateNotificationBadge();
}

function markNotificationRead(id) {
  const notifications = getNotifications();
  const notif = notifications.find(n => n.id === id);
  if (notif) {
    notif.read = true;
    saveNotifications(notifications);
    updateNotificationBadge();
  }
}

function markAllNotificationsRead() {
  const notifications = getNotifications();
  notifications.forEach(n => n.read = true);
  saveNotifications(notifications);
  updateNotificationBadge();
}

function getUnreadCount() {
  return getNotifications().filter(n => !n.read).length;
}

function updateNotificationBadge() {
  const count = getUnreadCount();
  const badge = document.getElementById('notification-badge');
  if (badge) {
    badge.textContent = count > 99 ? '99+' : count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
  if (window.parent) {
    window.parent.postMessage({
      type: 'TWITTER_NOTIFICATION_UPDATE',
      count
    }, '*');
  }
}

function formatTimeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return '剛剛';
  if (minutes < 60) return `${minutes}分鐘前`;
  if (hours < 24) return `${hours}小時前`;
  if (days < 7) return `${days}天前`;
  const lang = localStorage.getItem('sxiphone_lang') || 'zh-Hant';
  const localeCode = window.getLocaleStringLang?.(lang) || 'zh-TW';
  return new Date(timestamp).toLocaleDateString(localeCode);
}

function renderNotifications() {
  const container = document.getElementById('notifications-list');
  if (!container) return;

  const notifications = getNotifications();

  if (notifications.length === 0) {
    container.innerHTML = '<div class="empty-state">沒有通知</div>';
    return;
  }

  container.innerHTML = notifications.map(notif => {
    const timeStr = formatTimeAgo(notif.timestamp);
    const unreadClass = notif.read ? '' : 'unread';
    
    let icon = 'fa-bell';
    let iconColor = 'var(--accent)';
    let actionText = '';
    
    switch (notif.type) {
      case 'like':
        icon = 'fa-heart';
        iconColor = '#f91880';
        actionText = '喜歡了你的推文';
        break;
      case 'retweet':
        icon = 'fa-retweet';
        iconColor = '#00ba7c';
        actionText = '轉發了你的推文';
        break;
      case 'reply':
        icon = 'fa-comment';
        iconColor = 'var(--accent)';
        actionText = '回覆了你的推文';
        break;
      case 'follow':
        icon = 'fa-user-plus';
        iconColor = 'var(--accent)';
        actionText = '開始追蹤你';
        break;
      case 'mention':
        icon = 'fa-at';
        iconColor = 'var(--accent)';
        actionText = '提到了你';
        break;
    }

    return `
      <section class="card notification-card ${unreadClass}" data-id="${notif.id}">
        <div class="notification-icon" style="color: ${iconColor}">
          <i class="fas ${icon}"></i>
        </div>
        <div class="notification-content">
          <div class="notification-header">
            <span class="notification-author">${notif.fromName}</span>
            <span class="notification-action">${actionText}</span>
          </div>
          ${notif.tweetContent ? `<div class="notification-tweet">${notif.tweetContent.slice(0, 80)}${notif.tweetContent.length > 80 ? '...' : ''}</div>` : ''}
          ${notif.replyContent ? `<div class="notification-reply">${notif.replyContent}</div>` : ''}
          <div class="notification-time">${timeStr}</div>
        </div>
      </section>
    `;
  }).join('');

  container.querySelectorAll('.notification-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = parseFloat(card.dataset.id);
      markNotificationRead(id);
      card.classList.remove('unread');
    });
  });
}

function getPendingReactions() {
  const raw = localStorage.getItem(PENDING_REACTIONS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function savePendingReactions(reactions) {
  localStorage.setItem(PENDING_REACTIONS_KEY, JSON.stringify(reactions));
}

function addPendingReaction(reaction) {
  const reactions = getPendingReactions();
  reactions.push(reaction);
  savePendingReactions(reactions);
}

function processPendingReactions() {
  const reactions = getPendingReactions();
  const now = Date.now();
  const remaining = [];
  
  reactions.forEach(reaction => {
    if (now >= reaction.scheduledTime) {
      executeReaction(reaction);
    } else {
      remaining.push(reaction);
    }
  });
  
  savePendingReactions(remaining);
}

function executeReaction(reaction) {
  const { type, fromName, tweetId, tweetContent, tweetAuthor } = reaction;
  
  switch (type) {
    case 'like':
      addNotification({
        type: 'like',
        fromName,
        tweetContent,
        tweetAuthor
      });
      break;
      
    case 'retweet':
      addNotification({
        type: 'retweet',
        fromName,
        tweetContent,
        tweetAuthor
      });
      if (typeof addRetweetToFeed === 'function') {
        addRetweetToFeed(fromName, tweetContent, tweetAuthor);
      }
      break;
      
    case 'reply':
      const replyContent = reaction.replyContent || generateAutoReply(fromName, tweetContent);
      addNotification({
        type: 'reply',
        fromName,
        tweetContent,
        replyContent
      });
      if (typeof addNpcTweet === 'function') {
        addNpcTweet(fromName, replyContent);
      }
      break;
      
    case 'follow':
      addNotification({
        type: 'follow',
        fromName
      });
      break;
  }
}

function generateAutoReply(authorName, originalTweet) {
  const replies = [
    '這個觀點很有趣！',
    '同意！',
    '說得好',
    '推一個',
    '真的假的？',
    '哈哈沒錯',
    '我也這麼覺得',
    '太扯了吧',
    '感謝分享！',
    '學到了新東西'
  ];
  return replies[Math.floor(Math.random() * replies.length)];
}

function scheduleReaction(options) {
  const { type, fromName, tweetId, tweetContent, tweetAuthor, minDelay, maxDelay } = options;
  
  const minMs = minDelay || 60000;
  const maxMs = maxDelay || 3600000;
  const delay = Math.random() * (maxMs - minMs) + minMs;
  const scheduledTime = Date.now() + delay;
  
  addPendingReaction({
    type,
    fromName,
    tweetId,
    tweetContent,
    tweetAuthor,
    scheduledTime
  });
}

function scheduleReactionsForTweet(tweet) {
  const npcFollows = getNpcFollows();
  const npcList = getNpcList();
  
  if (npcFollows.length === 0) return;
  
  npcFollows.forEach(npcName => {
    const npc = npcList.find(n => n.name === npcName);
    if (!npc) return;
    
    const personality = npc.personality || '';
    const shouldReact = Math.random() > 0.3;
    if (!shouldReact) return;
    
    const reactionType = Math.random();
    
    if (reactionType < 0.4) {
      scheduleReaction({
        type: 'like',
        fromName: npcName,
        tweetContent: tweet.content,
        tweetAuthor: tweet.author,
        minDelay: 30000,
        maxDelay: 7200000
      });
    } else if (reactionType < 0.7) {
      scheduleReaction({
        type: 'retweet',
        fromName: npcName,
        tweetContent: tweet.content,
        tweetAuthor: tweet.author,
        minDelay: 60000,
        maxDelay: 14400000
      });
    } else {
      scheduleReaction({
        type: 'reply',
        fromName: npcName,
        tweetContent: tweet.content,
        tweetAuthor: tweet.author,
        minDelay: 120000,
        maxDelay: 28800000
      });
    }
  });
}

function getNpcFollows() {
  const raw = localStorage.getItem('sx_twitter_npc_follows');
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function getNpcList() {
  const raw = localStorage.getItem('sx_npc_list');
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

let reactionCheckInterval = null;

function startReactionChecker() {
  if (reactionCheckInterval) return;
  
  reactionCheckInterval = setInterval(() => {
    processPendingReactions();
  }, 10000);
  
  processPendingReactions();
}

function stopReactionChecker() {
  if (reactionCheckInterval) {
    clearInterval(reactionCheckInterval);
    reactionCheckInterval = null;
  }
}

function initNotifications() {
  renderNotifications();
  updateNotificationBadge();
  startReactionChecker();
}

document.addEventListener('DOMContentLoaded', initNotifications);

window.addEventListener('pagehide', () => {
  stopReactionChecker();
});
