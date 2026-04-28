const BOOKMARKS_KEY = 'sx_twitter_bookmarks';

function getBookmarks() {
  const raw = localStorage.getItem(BOOKMARKS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveBookmarks(bookmarks) {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
}

function isTweetBookmarked(tweetId) {
  const bookmarks = getBookmarks();
  return bookmarks.some(b => b.id === tweetId || b.timestamp === tweetId);
}

function addBookmark(tweet) {
  const bookmarks = getBookmarks();
  const bookmark = {
    id: tweet.id || tweet.timestamp,
    author: tweet.author,
    handle: tweet.handle,
    content: tweet.content,
    timestamp: tweet.timestamp,
    bookmarkedAt: Date.now(),
    stats: tweet.stats
  };
  if (!bookmarks.some(b => b.id === bookmark.id)) {
    bookmarks.unshift(bookmark);
    saveBookmarks(bookmarks);
  }
}

function removeBookmark(tweetId) {
  let bookmarks = getBookmarks();
  bookmarks = bookmarks.filter(b => b.id !== tweetId && b.timestamp !== tweetId);
  saveBookmarks(bookmarks);
}

function toggleBookmark(tweet) {
  const tweetId = tweet.id || tweet.timestamp;
  if (isTweetBookmarked(tweetId)) {
    removeBookmark(tweetId);
    return false;
  } else {
    addBookmark(tweet);
    return true;
  }
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('zh-TW', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function renderBookmarks() {
  const container = document.getElementById('bookmarks-list');
  if (!container) return;

  const bookmarks = getBookmarks();

  if (bookmarks.length === 0) {
    container.innerHTML = '<div class="empty-state">尚無書籤<br><span style="font-size:12px;color:var(--muted)">在首頁點擊推文的書籤圖示即可收藏</span></div>';
    return;
  }

  container.innerHTML = bookmarks.map(tweet => `
    <article class="tweet bookmark-item" data-id="${tweet.id || tweet.timestamp}">
      <div class="avatar"></div>
      <div>
        <div class="tweet-header">
          <div>
            <span class="tweet-author">${tweet.author}</span>
            <span>${tweet.handle} · ${formatTime(tweet.timestamp)}</span>
          </div>
          <button class="remove-bookmark-btn" data-id="${tweet.id || tweet.timestamp}" aria-label="移除書籤">
            <i class="fas fa-bookmark"></i>
          </button>
        </div>
        <div class="tweet-body">${tweet.content}</div>
        <div class="tweet-actions">
          <button type="button"><i class="far fa-comment"></i><span>${tweet.stats?.reply || 0}</span></button>
          <button type="button"><i class="fas fa-retweet"></i><span>${tweet.stats?.retweet || 0}</span></button>
          <button type="button"><i class="far fa-heart"></i><span>${tweet.stats?.like || 0}</span></button>
        </div>
      </div>
    </article>
  `).join('');

  container.querySelectorAll('.remove-bookmark-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseFloat(btn.dataset.id);
      removeBookmark(id);
      renderBookmarks();
    });
  });
}

function initBookmarks() {
  renderBookmarks();
}

document.addEventListener('DOMContentLoaded', initBookmarks);
