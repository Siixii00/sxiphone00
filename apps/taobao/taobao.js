const platformSelectEl = document.getElementById('platform-select');
const categorySelectEl = document.getElementById('category-select');
const productGridEl = document.getElementById('product-grid');
const productCountEl = document.getElementById('product-count');

const sortSelect = document.getElementById('sort-select');
const clearImportedBtn = document.getElementById('clear-imported-btn');

const cartBtn = document.getElementById('cart-btn');
const closeCartBtn = document.getElementById('close-cart-btn');
const cartDrawer = document.getElementById('cart-drawer');
const cartCountEl = document.getElementById('cart-count');
const cartListEl = document.getElementById('cart-list');
const cartTotalEl = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');

const importHelpBtn = document.getElementById('import-help-btn');
const helpModal = document.getElementById('help-modal');
const importModal = document.getElementById('import-modal');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalFooter = document.getElementById('modal-footer');

const importTabs = document.querySelectorAll('.import-tab');
const importUrlContent = document.getElementById('import-url');
const importManualContent = document.getElementById('import-manual');
const importBatchContent = document.getElementById('import-batch');

const importPlatformSelect = document.getElementById('import-platform-select');
const importUrlInput = document.getElementById('import-url-input');
const importUrlBtn = document.getElementById('import-url-btn');

const manualName = document.getElementById('manual-name');
const manualPrice = document.getElementById('manual-price');
const manualPlatform = document.getElementById('manual-platform');
const manualCategory = document.getElementById('manual-category');
const manualThumbPreview = document.getElementById('manual-thumb-preview');
const manualThumbFile = document.getElementById('manual-thumb-file');
const manualAddBtn = document.getElementById('manual-add-btn');

const batchTextarea = document.getElementById('batch-textarea');
const batchImportBtn = document.getElementById('batch-import-btn');

const charAdvice = document.getElementById('char-advice');
const adviceText = document.getElementById('advice-text');
const adviceTime = document.getElementById('advice-time');
const getAdviceBtn = document.getElementById('get-advice-btn');
const budgetBtn = document.getElementById('budget-btn');
const adviceFrequency = document.getElementById('advice-frequency');
const showAdultContent = document.getElementById('show-adult-content');
const allowAdultRecommend = document.getElementById('allow-adult-recommend');

const budgetModal = document.getElementById('budget-modal');
const checkoutConfirmModal = document.getElementById('checkout-confirm-modal');

const STORAGE_KEY_PRODUCTS = 'sx_shop_products';
const STORAGE_KEY_CART = 'sx_shop_cart';
const CHAR_LIST_KEY = 'sx_characters';
const KAKAOPAY_STORAGE_KEY = 'sxiphone.kakaopay.ledger.v1';
const WORLDBOOK_INDEX_KEY = 'sx_worldbook_index';
const CHAT_HISTORY_KEY = 'sx_chat_history';
const SHOP_SETTINGS_KEY = 'sx_shop_settings';

const platforms = [
  { id: 'all', name: '全部', color: '#5b6def' },
  { id: 'amazon', name: 'Amazon', color: '#ff9900' },
  { id: 'coupang', name: '酷彭', color: '#b2d236' },
  { id: 'mercari', name: 'Mercari', color: '#00b4a0' },
  { id: 'pinduoduo', name: '拼多多', color: '#e02e24' },
  { id: 'shopee', name: '蝦皮', color: '#ee4d2d' },
  { id: 'taobao', name: '淘寶', color: '#ff5000' },
  { id: 'xianyu', name: '閒魚', color: '#ffe14d' }
];

const categories = ['推薦', '服飾', '3C', '家居', '美妝', '食品', '書籍', '其他'];

const platformDomains = {
  taobao: ['taobao.com', 'tmall.com', 'tb.cn'],
  amazon: ['amazon.com', 'amazon.co.jp', 'amazon.co.uk', 'amzn.to'],
  coupang: ['coupang.com', 'coupa.ng'],
  shopee: ['shopee.tw', 'shopee.sg', 'shopee.my', 'shopee.co.id'],
  pinduoduo: ['pinduoduo.com', 'yangkeduo.com', 'pdd.com'],
  xianyu: ['xianyu.com', 'goofish.com', '2.taobao.com'],
  mercari: ['mercari.com', 'mercari.jp', 'mercari.co.jp']
};

const platformSettings = {
  amazon: { name: 'Amazon', rate: 1, shipping: 60, currency: 'NT$', color: '#ff9900' },
  coupang: { name: '酷彭', rate: 0.024, shipping: 80, currency: '₩', color: '#b2d236' },
  mercari: { name: 'Mercari', rate: 0.22, shipping: 120, currency: '¥', color: '#00b4a0' },
  pinduoduo: { name: '拼多多', rate: 4.3, shipping: 35, currency: '¥', color: '#e02e24' },
  shopee: { name: '蝦皮', rate: 0.042, shipping: 45, currency: 'NT$', color: '#ee4d2d' },
  taobao: { name: '淘寶', rate: 4.3, shipping: 40, currency: '¥', color: '#ff5000' },
  xianyu: { name: '閒魚', rate: 4.3, shipping: 0, currency: '¥', color: '#ffe14d' },
  other: { name: '其他', rate: 1, shipping: 50, currency: 'NT$', color: '#888888' }
};

const thumbGradients = [
  'linear-gradient(135deg,#667eea,#764ba2)',
  'linear-gradient(135deg,#f093fb,#f5576c)',
  'linear-gradient(135deg,#5ee7df,#b490ca)',
  'linear-gradient(135deg,#ffecd2,#fcb69f)',
  'linear-gradient(135deg,#a8edea,#fed6e3)',
  'linear-gradient(135deg,#ff9a9e,#fecfef)',
  'linear-gradient(135deg,#ffecd2,#fcb69f)',
  'linear-gradient(135deg,#667eea,#764ba2)',
  'linear-gradient(135deg,#6a11cb,#2575fc)',
  'linear-gradient(135deg,#3494e6,#ec6ead)'
];

let products = [];
let activePlatform = 'all';
let activeCategory = '推薦';
let searchText = '';
let sortOrder = 'hot';
let cart = new Map();
let manualThumbData = null;
let currentChars = [];
let charAdviceTimer = null;
let shopSettings = {
  adviceFrequency: 15000,
  showAdultContent: false,
  allowAdultRecommend: false
};

const adultKeywords = [
  '情趣', '成人', '性感', '內衣', '內褲', '情趣用品', '自慰', '按摩棒',
  '跳蛋', '潤滑', '保險套', '避孕', '性感內衣', '絲襪', '吊帶襪',
  '成人用品', '性玩具', '陰莖', '陰道', '肛塞', '飛機杯', '充氣娃娃',
  '情趣內衣', '開襠', '透明裝', '性感睡衣', '束縛', 'SM', '調教',
  '乳環', 'bdsm', '鞭子', '手銬', '眼罩', '蠟燭',
  'adult', 'sex', 'erotic', 'lingerie', 'vibrator', 'dildo', 'condom',
  'masturbat', 'intimate', 'sensual', ' bondage', 'fetish', 'toy',
  'nsfw', '18+', '色色', '做愛', '愛愛', '親熱', '床上', '晚上'
];

const nsfwConversationKeywords = [
  '情趣', '內衣', '性感', '睡衣', '絲襪', '床上', '親熱', '做愛', '愛愛',
  '晚上一起', '今晚', '脫', '摸', '舔', '咬', '敏感', '舒服',
  '想要你', '抱抱', '親親', '貼貼', '蹭蹭', '濕', '硬',
  '玩玩', '試試', '新花樣', '刺激', '興奮', '敏感帶',
  'nsfw', '18+', '色色', '開車', '飆車'
];

function isAdultProduct(product) {
  const title = (product.title || '').toLowerCase();
  const category = (product.category || '').toLowerCase();
  const combined = `${title} ${category}`;
  
  return adultKeywords.some(keyword => combined.includes(keyword.toLowerCase()));
}

function detectNSFWContext(chatContext, worldbookContext) {
  const combinedText = `${chatContext} ${worldbookContext}`.toLowerCase();
  
  return nsfwConversationKeywords.some(keyword => combinedText.includes(keyword.toLowerCase()));
}

function checkUserAdultConsent() {
  return shopSettings.allowAdultRecommend === true;
}

function fmt(price) {
  return `NT$ ${price}`;
}

function generateId() {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function randomThumb() {
  return thumbGradients[Math.floor(Math.random() * thumbGradients.length)];
}

function randomPick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

async function loadFromStorage() {
  try {
    const parsed = await sxGetJSON(STORAGE_KEY_PRODUCTS);
    if (Array.isArray(parsed) && parsed.length > 0) {
      products = parsed;
      return;
    }
  } catch (e) {
    console.warn('Failed to load products', e);
  }
  products = generateDefaultProducts();
}

function generateDefaultProducts() {
  const defaultItems = [
    { platform: 'amazon', category: '3C', title: '無線藍牙降噪耳機', price: 899 },
    { platform: 'shopee', category: '服飾', title: '日系休閒針織上衣', price: 328 },
    { platform: 'coupang', category: '美妝', title: '韓系氣墊粉餅組', price: 456 },
    { platform: 'pinduoduo', category: '食品', title: '零食大禮包組合', price: 168 },
    { platform: 'mercari', category: '服飾', title: '日本二手品牌服飾', price: 520 },
    { platform: 'xianyu', category: '3C', title: '二手 Switch 遊戲卡帶', price: 780 },
    { platform: 'taobao', category: '家居', title: '簡約收納盒組', price: 199 },
    { platform: 'amazon', category: '書籍', title: '暢銷小說套書', price: 650 },
    { platform: 'shopee', category: '3C', title: '手機保護殼組', price: 89 },
    { platform: 'coupang', category: '家居', title: '韓式生活用品', price: 245 }
  ];
  
  return defaultItems.map(item => ({
    id: generateId(),
    ...item,
    sold: `已售 ${(Math.floor(Math.random() * 9000) + 1000).toLocaleString()}+`,
    thumb: randomThumb(),
    imported: false
  }));
}

async function saveToStorage() {
  try {
    await sxSetJSON(STORAGE_KEY_PRODUCTS, products);
  } catch (e) {
    console.warn('Failed to save products', e);
  }
}

async function loadCartFromStorage() {
  try {
    const parsed = await sxGetJSON(STORAGE_KEY_CART);
    if (Array.isArray(parsed)) {
      cart = new Map(parsed.map(item => [item.id, item]));
    }
  } catch (e) {
    console.warn('Failed to load cart', e);
  }
}

async function saveCartToStorage() {
  try {
    await sxSetJSON(STORAGE_KEY_CART, [...cart.values()]);
  } catch (e) {
    console.warn('Failed to save cart', e);
  }
}

function getFilteredProducts() {
  return products
    .filter(item => activePlatform === 'all' || item.platform === activePlatform)
    .filter(item => activeCategory === '推薦' || item.category === activeCategory)
    .filter(item => {
      if (!searchText) return true;
      return `${item.title} ${item.platform} ${item.category}`.toLowerCase().includes(searchText.toLowerCase());
    })
    .sort((a, b) => {
      if (sortOrder === 'price-asc') return a.price - b.price;
      if (sortOrder === 'price-desc') return b.price - a.price;
      if (sortOrder === 'newest') return (b.importedAt || '').localeCompare(a.importedAt || '');
      const aSold = parseInt(a.sold?.replace(/[^0-9]/g, '') || '0');
      const bSold = parseInt(b.sold?.replace(/[^0-9]/g, '') || '0');
      return bSold - aSold;
    });
}

function renderProducts() {
  const data = getFilteredProducts();
  const importedCount = products.filter(p => p.imported).length;
  const showAdult = shopSettings.showAdultContent;
  
  if (productCountEl) {
    productCountEl.textContent = importedCount > 0 ? `(已導入 ${importedCount} 件)` : '';
  }
  
  if (data.length === 0) {
    productGridEl.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-box-open"></i>
        <p>沒有符合條件的商品</p>
      </div>
    `;
    return;
  }

  productGridEl.innerHTML = data.map(item => {
    const isAdult = isAdultProduct(item);
    const adultClass = isAdult && !showAdult ? 'adult-blur' : '';
    const adultBadge = isAdult ? '<span class="product-adult-badge">🔞</span>' : '';
    
    return `
      <article class="product-card ${item.imported ? 'imported' : ''} ${adultClass}">
        <div class="product-thumb" style="background:${item.thumb};">
          <span class="platform-badge ${item.platform}">${getPlatformName(item.platform)}</span>
          ${adultBadge}
        </div>
        <div class="product-body">
          <h4>${item.title}</h4>
          <p class="product-meta">${item.category} ${item.sold ? '· ' + item.sold : ''}</p>
          <div class="price-row">
            <strong>${fmt(item.price)}</strong>
            <button type="button" data-action="add" data-id="${item.id}">加入</button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function getPlatformName(platformId) {
  const platform = platforms.find(p => p.id === platformId);
  return platform ? platform.name : platformId;
}

function detectPlatformFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    for (const [platformId, domains] of Object.entries(platformDomains)) {
      if (domains.some(d => hostname.includes(d))) {
        return platformId;
      }
    }
  } catch (e) {}
  
  return 'other';
}

function findProduct(id) {
  return products.find(item => item.id === id) || null;
}

function addToCart(id) {
  const product = findProduct(id);
  if (!product) return;
  const item = cart.get(id);
  if (item) {
    item.qty += 1;
    cart.set(id, item);
  } else {
    cart.set(id, { ...product, qty: 1, platform: product.platform || 'other' });
  }
  saveCartToStorage();
  renderCart();
}

function changeQty(id, delta) {
  const item = cart.get(id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart.delete(id);
  else cart.set(id, item);
  saveCartToStorage();
  renderCart();
}

function renderCart() {
  const items = [...cart.values()];
  const count = items.reduce((sum, item) => sum + item.qty, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  cartCountEl.textContent = String(count);
  cartTotalEl.textContent = fmt(total);

  if (items.length === 0) {
    cartListEl.innerHTML = '<p style="color:var(--shop-muted);font-size:13px;text-align:center;padding:20px;">購物車是空的</p>';
    return;
  }

  cartListEl.innerHTML = items.map(item => `
    <article class="cart-item">
      <div class="cart-item-thumb" style="background:${item.thumb};"></div>
      <div class="cart-item-info">
        <strong>${item.title}</strong>
        <p>${fmt(item.price)}</p>
      </div>
      <div class="qty-row">
        <button type="button" data-action="minus" data-id="${item.id}">-</button>
        <span>${item.qty}</span>
        <button type="button" data-action="plus" data-id="${item.id}">+</button>
      </div>
    </article>
  `).join('');
}

function getCartTotal() {
  return [...cart.values()].reduce((sum, item) => sum + item.price * item.qty, 0);
}

function handleUrlImport() {
  const url = importUrlInput.value.trim();
  if (!url) {
    alert('請輸入商品網址');
    return;
  }
  
  const selectedPlatform = importPlatformSelect.value;
  const detectedPlatform = selectedPlatform === 'auto' ? detectPlatformFromUrl(url) : selectedPlatform;
  
  showImportModal('解析中...', `
    <div class="import-loading">
      <i class="fas fa-spinner fa-spin"></i>
      <span>正在解析 ${getPlatformName(detectedPlatform)} 網址...</span>
    </div>
  `);
  
  setTimeout(() => {
    const isShopOrCart = url.includes('shop') || url.includes('cart') || url.includes('store');
    const count = isShopOrCart ? Math.floor(Math.random() * 5) + 2 : 1;
    const newProducts = [];
    
    for (let i = 0; i < count; i++) {
      const product = generateProductFromUrl(url, detectedPlatform);
      newProducts.push(product);
      products.unshift(product);
    }
    
    saveToStorage();
    renderProducts();
    
    showImportModal('導入結果', `
      <div class="import-result">
        <p style="font-size:14px;margin-bottom:12px;">成功導入 ${count} 件商品</p>
        ${newProducts.slice(0, 4).map(p => `
          <div class="import-result-item">
            <div class="import-result-thumb" style="background:${p.thumb};"></div>
            <div class="import-result-info">
              <h4>${p.title}</h4>
              <p>${fmt(p.price)} · ${getPlatformName(p.platform)}</p>
            </div>
            <span class="import-result-badge">成功</span>
          </div>
        `).join('')}
        ${count > 4 ? `<p style="font-size:12px;color:var(--shop-muted);margin-top:8px;">還有 ${count - 4} 件商品...</p>` : ''}
      </div>
    `);
    if (modalFooter) modalFooter.hidden = false;
    importUrlInput.value = '';
  }, 1200);
}

function generateProductFromUrl(url, platform) {
  const productNames = {
    taobao: ['時尚服飾', '數位產品', '居家用品', '美妝護膚', '潮流配件'],
    amazon: ['電子產品', '書籍', '家居用品', '運動器材', '辦公用品'],
    coupang: ['韓式服飾', '美妝產品', '生活用品', '零食食品', '電子配件'],
    shopee: ['流行服飾', '手機配件', '美妝工具', '家居收納', '零食飲料'],
    pinduoduo: ['農產品', '日用品', '零食', '服飾配件', '家居用品'],
    xianyu: ['二手數位', '二手服飾', '二手書籍', '二手家電', '收藏品'],
    mercari: ['二手服飾', '二手配件', '二手電子', '二手書籍', '二手雜貨'],
    other: ['精選商品', '熱門商品', '推薦商品']
  };
  
  const names = productNames[platform] || productNames.other;
  
  return {
    id: generateId(),
    title: randomPick(names) + ` #${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
    platform,
    category: randomPick(categories),
    price: Math.floor(Math.random() * 2000) + 99,
    sold: '已售 ' + (Math.floor(Math.random() * 9000) + 1000).toLocaleString() + '+',
    thumb: randomThumb(),
    imported: true,
    sourceUrl: url,
    importedAt: new Date().toISOString()
  };
}

function handleManualAdd() {
  const name = manualName.value.trim();
  const price = parseInt(manualPrice.value, 10);
  const platform = manualPlatform.value;
  const category = manualCategory.value;
  
  if (!name) {
    alert('請輸入商品名稱');
    return;
  }
  
  if (!price || price <= 0) {
    alert('請輸入有效價格');
    return;
  }
  
  const product = {
    id: generateId(),
    title: name,
    platform,
    category,
    price: price,
    sold: '新上架',
    thumb: manualThumbData || randomThumb(),
    imported: true,
    importedAt: new Date().toISOString()
  };
  
  products.unshift(product);
  saveToStorage();
  renderProducts();
  
  manualName.value = '';
  manualPrice.value = '';
  manualThumbData = null;
  if (manualThumbPreview) {
    manualThumbPreview.style.backgroundImage = '';
    manualThumbPreview.classList.remove('has-image');
    manualThumbPreview.innerHTML = '<i class="fas fa-image"></i>';
  }
  
  showImportModal('新增成功', `
    <div class="import-result">
      <div class="import-result-item">
        <div class="import-result-thumb" style="background:${product.thumb};"></div>
        <div class="import-result-info">
          <h4>${product.title}</h4>
          <p>${fmt(product.price)} · ${getPlatformName(product.platform)}</p>
        </div>
        <span class="import-result-badge">成功</span>
      </div>
    </div>
  `);
  if (modalFooter) modalFooter.hidden = false;
}

function handleBatchImport() {
  const text = batchTextarea.value.trim();
  if (!text) {
    alert('請輸入商品資料');
    return;
  }
  
  const lines = text.split('\n').filter(line => line.trim());
  const newProducts = [];
  
  lines.forEach(line => {
    const parts = line.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      const name = parts[0];
      const price = parseInt(parts[1], 10);
      const platform = parts[2] || 'other';
      const category = parts[3] || '推薦';
      
      if (name && price > 0) {
        const product = {
          id: generateId(),
          title: name,
          platform: platforms.find(p => p.id === platform) ? platform : 'other',
          category: categories.includes(category) ? category : '推薦',
          price: price,
          sold: '新上架',
          thumb: randomThumb(),
          imported: true,
          importedAt: new Date().toISOString()
        };
        newProducts.push(product);
        products.unshift(product);
      }
    }
  });
  
  saveToStorage();
  renderProducts();
  
  showImportModal('批量導入結果', `
    <div class="import-result">
      <p style="font-size:14px;margin-bottom:12px;">成功導入 ${newProducts.length} 件商品</p>
      ${newProducts.slice(0, 4).map(p => `
        <div class="import-result-item">
          <div class="import-result-thumb" style="background:${p.thumb};"></div>
          <div class="import-result-info">
            <h4>${p.title}</h4>
            <p>${fmt(p.price)}</p>
          </div>
          <span class="import-result-badge">成功</span>
        </div>
      `).join('')}
    </div>
  `);
  if (modalFooter) modalFooter.hidden = false;
  batchTextarea.value = '';
}

function handleManualThumbUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  
  if (!file.type.startsWith('image/')) {
    alert('請選擇圖片檔案');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    manualThumbData = `url('${e.target.result}')`;
    if (manualThumbPreview) {
      manualThumbPreview.style.backgroundImage = `url('${e.target.result}')`;
      manualThumbPreview.classList.add('has-image');
      manualThumbPreview.innerHTML = '';
    }
  };
  reader.readAsDataURL(file);
}

function clearImported() {
  if (!confirm('確定要清除所有導入的商品嗎？')) return;
  products = products.filter(p => !p.imported);
  saveToStorage();
  renderProducts();
}

function switchImportTab(tabName) {
  importTabs.forEach(t => t.classList.remove('active'));
  document.querySelector(`[data-import-tab="${tabName}"]`)?.classList.add('active');
  
  importUrlContent?.classList.add('hidden');
  importManualContent?.classList.add('hidden');
  importBatchContent?.classList.add('hidden');
  
  if (tabName === 'url') importUrlContent?.classList.remove('hidden');
  if (tabName === 'manual') importManualContent?.classList.remove('hidden');
  if (tabName === 'batch') importBatchContent?.classList.remove('hidden');
}

function showImportModal(title, content) {
  if (modalTitle) modalTitle.textContent = title;
  if (modalBody) modalBody.innerHTML = content;
  if (modalFooter) modalFooter.hidden = true;
  importModal?.classList.remove('hidden');
}

function hideImportModal() {
  importModal?.classList.add('hidden');
}

function showHelpModal() {
  helpModal?.classList.remove('hidden');
}

function hideHelpModal() {
  helpModal?.classList.add('hidden');
}

async function loadChars() {
  try {
    const parsed = await sxGetJSON(CHAR_LIST_KEY);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function loadShopSettings() {
  try {
    const parsed = await sxGetJSON(SHOP_SETTINGS_KEY);
    if (parsed) {
      shopSettings = { ...shopSettings, ...parsed };
    }
  } catch {}
  
  if (adviceFrequency) adviceFrequency.value = shopSettings.adviceFrequency || 15000;
  if (showAdultContent) showAdultContent.checked = shopSettings.showAdultContent === true;
  if (allowAdultRecommend) allowAdultRecommend.checked = shopSettings.allowAdultRecommend === true;
}

async function saveShopSettings() {
  shopSettings.adviceFrequency = parseInt(adviceFrequency?.value || 15000, 10);
  shopSettings.showAdultContent = showAdultContent?.checked === true;
  shopSettings.allowAdultRecommend = allowAdultRecommend?.checked === true;
  
  try {
    await sxSetJSON(SHOP_SETTINGS_KEY, shopSettings);
  } catch {}
  
  renderProducts();
}

async function getWorldbookData() {
  const result = {
    global: [],
    cot: [],
    style: [],
    keywords: [],
    backend: []
  };
  
  const categories = ['global', 'cot', 'style', 'keywords', 'backend'];
  for (const cat of categories) {
    const key = `sx_worldBook_${cat}`;
    try {
      const data = await sxGetJSON(key);
      if (data) {
        result[cat] = data;
      }
    } catch {}
  }
  
  return result;
}
    } catch {}
  });
  
  return result;
}

async function getUserForbiddenWords() {
  const forbiddenWords = [];
  
  try {
    const parsed = await sxGetJSON('sx_detected_forbidden');
    if (Array.isArray(parsed)) {
      forbiddenWords.push(...parsed);
    }
  } catch {}
  
  try {
    const worldbook = await getWorldbookData();
    const categories = ['global', 'cot', 'style', 'keywords', 'backend'];
    
    categories.forEach(cat => {
      const entries = worldbook[cat] || [];
      entries.forEach(entry => {
        const title = (entry.title || '').toLowerCase();
        const content = (entry.content || '').toLowerCase();
        
        if (title.includes('禁止') || title.includes('forbidden') || 
            title.includes('討厭') || title.includes('hate') ||
            title.includes('不喜歡') || title.includes('dislike')) {
          
          const match = content.match(/<forbidden>([\s\S]*?)<\/forbidden>/i);
          if (match) {
            const words = match[1].split(/[,，\n]/).map(w => w.trim()).filter(w => w);
            forbiddenWords.push(...words);
          } else {
            const words = content.split(/[,，\n]/).map(w => w.trim()).filter(w => w && w.length < 20);
            forbiddenWords.push(...words);
          }
        }
        
        if (content.includes('<forbidden>')) {
          const matches = content.match(/<forbidden>([\s\S]*?)<\/forbidden>/gi) || [];
          matches.forEach(m => {
            const inner = m.replace(/<\/?forbidden>/gi, '');
            const words = inner.split(/[,，\n]/).map(w => w.trim()).filter(w => w);
            forbiddenWords.push(...words);
          });
        }
      });
    });
  } catch {}
  
  return [...new Set(forbiddenWords.map(w => w.toLowerCase()))];
}

async function getUserDislikesFromChat() {
  const dislikes = [];
  
  try {
    const history = await sxGetJSON(CHAT_HISTORY_KEY);
    if (!Array.isArray(history)) return dislikes;
    
    const dislikePatterns = [
      /我(不喜歡|討厭|不愛|不想|不要)[^\s]*/gi,
      /(不喜歡|討厭|不愛|不想|不要)[^\s]*/gi,
      /我不?想(買|要|看)[^\s]*/gi,
      /太(貴|醜|難看|差|爛)/gi,
      /不要這個/gi,
      /算了/gi
    ];
    
    history.forEach(msg => {
      if (msg.role === 'user' && msg.content) {
        dislikePatterns.forEach(pattern => {
          const matches = msg.content.match(pattern) || [];
          matches.forEach(m => {
            const cleaned = m.replace(/我(不喜歡|討厭|不愛|不想|不要|不?想(買|要|看))/gi, '').trim();
            if (cleaned && cleaned.length < 20 && cleaned.length > 0) {
              dislikes.push(cleaned.toLowerCase());
            }
          });
        });
      }
    });
  } catch {}
  
  return [...new Set(dislikes)];
}

function isProductForbidden(product, forbiddenWords, dislikes) {
  const title = (product.title || '').toLowerCase();
  const category = (product.category || '').toLowerCase();
  const reason = (product.reason || '').toLowerCase();
  const combined = `${title} ${category} ${reason}`;
  
  for (const word of forbiddenWords) {
    if (combined.includes(word.toLowerCase())) {
      return true;
    }
  }
  
  for (const dislike of dislikes) {
    if (combined.includes(dislike.toLowerCase())) {
      return true;
    }
  }
  
  return false;
}

async function filterRecommendationsByUserPreference(recommendations) {
  const forbiddenWords = await getUserForbiddenWords();
  const dislikes = await getUserDislikesFromChat();
  
  return recommendations.filter(product => !isProductForbidden(product, forbiddenWords, dislikes));
}

async function getWorldbookContextForChar(char) {
  const worldbook = await getWorldbookData();
  const charName = char?.name || '';
  const charPersonality = char?.personality || '';
  const searchTerms = [charName, ...charPersonality.split(/[,，、]/)].filter(t => t.trim());
  
  const relevantEntries = [];
  
  const categories = ['global', 'cot', 'style', 'keywords'];
  categories.forEach(cat => {
    const entries = worldbook[cat] || [];
    entries.forEach(entry => {
      if (!entry.content) return;
      const triggers = entry.triggers || [];
      const hasMatch = searchTerms.some(term => 
        triggers.some(trigger => trigger.toLowerCase().includes(term.toLowerCase())) ||
        entry.title?.toLowerCase().includes(term.toLowerCase()) ||
        entry.content?.toLowerCase().includes(term.toLowerCase())
      );
      if (hasMatch || cat === 'global') {
        relevantEntries.push(entry.content);
      }
    });
  });
  
  return relevantEntries.slice(0, 3).join('\n');
}

async function getChatHistoryForChar(char) {
  try {
    const history = await sxGetJSON(CHAT_HISTORY_KEY);
    if (!Array.isArray(history) || history.length === 0) return '';
    
    const charName = char?.name || '';
    const relevantMessages = history
      .filter(msg => {
        if (msg.role === 'user') return true;
        if (msg.role === 'assistant' && charName) {
          return msg.content?.includes(charName) || 
                 msg.sender?.includes(charName);
        }
        return false;
      })
      .slice(-5)
      .map(msg => `${msg.role === 'user' ? '用戶' : charName}: ${msg.content?.slice(0, 100)}`)
      .join('\n');
    
    return relevantMessages;
  } catch {
    return '';
  }
}

function getCharPersonality(char) {
  return char?.personality || char?.background || '';
}

async function generateContextAwareAdvice(char) {
  const personality = getCharPersonality(char);
  const charName = char?.name || '角色';
  const cartTotal = getCartTotal();
  const cartCount = cart.size;
  const filteredProducts = getFilteredProducts();
  const randomProduct = filteredProducts.length > 0 ? randomPick(filteredProducts) : null;
  
  const worldbookContext = await getWorldbookContextForChar(char);
  const chatContext = await getChatHistoryForChar(char);
  
  const contextInfo = {
    cartCount,
    cartTotal,
    randomProduct: randomProduct ? { title: randomProduct.title, price: randomProduct.price } : null,
    worldbookContext: worldbookContext ? worldbookContext.slice(0, 200) : null,
    chatContext: chatContext ? chatContext.slice(0, 150) : null
  };
  
  const baseAdvices = [
    contextInfo.randomProduct ? `這個「${contextInfo.randomProduct.title}」看起來不錯呢。` : '我們一起逛逛吧。',
    cartCount > 0 ? `購物車有 ${cartCount} 件商品，總共 ${fmt(cartTotal)}。` : '購物車是空的，看看有什麼喜歡的。',
    '喜歡的話就加入購物車吧。',
    '慢慢挑選適合你的商品。',
    '有需要我幫忙參考的嗎？'
  ];
  
  if (!personality) {
    return baseAdvices[Math.floor(Math.random() * baseAdvices.length)];
  }
  
  const personalityLower = personality.toLowerCase();
  
  const styleModifiers = [];
  
  if (personalityLower.includes('溫柔') || personalityLower.includes('體貼') || personalityLower.includes('溫和')) {
    styleModifiers.push(
      contextInfo.randomProduct ? `這個「${contextInfo.randomProduct.title}」看起來很適合你喔～要考慮看看嗎？` : '我們一起慢慢逛，看看有什麼喜歡的～',
      cartCount > 0 ? `購物車有 ${cartCount} 件商品，總共 ${fmt(cartTotal)}，這樣可以嗎？` : '購物車是空的，我們再逛逛吧～',
      '如果喜歡就加入購物車吧，我幫你記著。',
      '別急，慢慢挑選適合你的商品。',
      '我會幫你注意預算的，放心逛吧！'
    );
  }
  
  if (personalityLower.includes('傲嬌') || personalityLower.includes('tsundere') || personalityLower.includes('口是心非')) {
    styleModifiers.push(
      contextInfo.randomProduct ? `哼，「${contextInfo.randomProduct.title}」還算可以啦...才不是特意幫你看的！` : '哼，我才不想逛街呢...',
      cartCount > 0 ? `${cartCount} 件商品...才不是擔心你亂花錢！` : '購物車空的...關我什麼事！',
      '這、這個還算不錯啦...',
      '才不是想幫你挑！只是剛好看到...',
      '哼，隨便你啦！'
    );
  }
  
  if (personalityLower.includes('活潑') || personalityLower.includes('開朗') || personalityLower.includes('可愛') || personalityLower.includes('元氣')) {
    styleModifiers.push(
      contextInfo.randomProduct ? `哇！「${contextInfo.randomProduct.title}」超棒的！快加入購物車！` : '哇！好多好東西！我們買這個！',
      cartCount > 0 ? `哇！購物車有 ${cartCount} 件！總共 ${fmt(cartTotal)}！` : '快點加東西進購物車啦！',
      '這個超棒的！快加入！',
      '買買買！難得逛街嘛～',
      '快看快看！這個超可愛的！'
    );
  }
  
  if (personalityLower.includes('高冷') || personalityLower.includes('冷淡') || personalityLower.includes('冷靜')) {
    styleModifiers.push(
      contextInfo.randomProduct ? `「${contextInfo.randomProduct.title}」，${fmt(contextInfo.randomProduct.price)}。可以考慮。` : '嗯，隨便逛逛吧。',
      cartCount > 0 ? `購物車：${cartCount} 件，${fmt(cartTotal)}。` : '購物車空的。',
      '這個可以。',
      '價格合理。',
      '有需要的就買，沒需要的就走。'
    );
  }
  
  if (personalityLower.includes('腹黑') || personalityLower.includes('心機') || personalityLower.includes('狡猾')) {
    styleModifiers.push(
      contextInfo.randomProduct ? `「${contextInfo.randomProduct.title}」...呵呵，這個確實適合你呢～` : '呵呵，讓我們來看看有什麼有趣的～',
      cartCount > 0 ? `${fmt(cartTotal)}...這個金額，你確定負擔得起嗎？` : '購物車空空如也呢～',
      '這個價格...值得嗎？',
      '讓我幫你...好好把關一下吧～',
      '買這個...是有什麼打算呢？'
    );
  }
  
  if (personalityLower.includes('強勢') || personalityLower.includes('霸道') || personalityLower.includes('支配')) {
    styleModifiers.push(
      contextInfo.randomProduct ? `「${contextInfo.randomProduct.title}」這個不錯。買。` : '逛街。跟緊點。',
      cartCount > 0 ? `${cartCount} 件，${fmt(cartTotal)}。可以。` : '空的。買點東西。',
      '這個。買。',
      '喜歡就買。不用問我。',
      '快點決定。'
    );
  }
  
  if (personalityLower.includes('害羞') || personalityLower.includes('內向') || personalityLower.includes('膽小')) {
    styleModifiers.push(
      contextInfo.randomProduct ? `那個...「${contextInfo.randomProduct.title}」看起來...還不錯...` : '那個...我們去逛逛吧...',
      cartCount > 0 ? `購物車有 ${cartCount} 件...總共 ${fmt(cartTotal)}...` : '購物車...空的...',
      '如果...喜歡的話...',
      '那個...慢慢看...',
      '我...我可以幫你參考...'
    );
  }
  
  if (personalityLower.includes('成熟') || personalityLower.includes('穩重')) {
    styleModifiers.push(
      contextInfo.randomProduct ? `「${contextInfo.randomProduct.title}」，${fmt(contextInfo.randomProduct.price)}。品質不錯。` : '慢慢逛，別急。',
      cartCount > 0 ? `購物車 ${cartCount} 件，${fmt(cartTotal)}。合理。` : '購物車空的，看看有什麼需要的。',
      '這個實用。',
      '品質不錯，可以考慮。',
      '量力而為。'
    );
  }
  
  if (personalityLower.includes('病嬌') || personalityLower.includes('佔有') || personalityLower.includes('嫉妒')) {
    styleModifiers.push(
      contextInfo.randomProduct ? `「${contextInfo.randomProduct.title}」...買吧。我准了。` : '只准跟我逛街...不准看別人...',
      cartCount > 0 ? `${cartCount} 件...${fmt(cartTotal)}...都是你的...` : '空的...要買點什麼嗎...？',
      '買。我說買就買。',
      '這個...我喜歡你用。',
      '不准不買。'
    );
  }
  
  if (styleModifiers.length > 0) {
    return styleModifiers[Math.floor(Math.random() * styleModifiers.length)];
  }
  
  return baseAdvices[Math.floor(Math.random() * baseAdvices.length)];
}

async function renderCharSelect() {
  await renderCharSelectGrid();
  renderCharCompanionList();
}

async function renderCharSelectGrid() {
  const grid = document.getElementById('char-select-grid');
  if (!grid) return;
  
  const chars = await loadChars();
  if (chars.length === 0) {
    grid.innerHTML = '<p style="color:var(--shop-muted);font-size:12px;padding:10px;">沒有可用的角色，請先在設定中建立角色</p>';
    return;
  }
  
  grid.innerHTML = chars.map((char, index) => {
    const isSelected = currentChars.some(c => c.id === char.id || c.name === char.name);
    const desc = char.description || char.personality || '陪你逛街';
    return `
      <div class="char-select-item ${isSelected ? 'selected' : ''}" data-char-index="${index}">
        <div class="char-select-item-avatar" style="${char.avatar ? `background-image:url('${char.avatar}')` : ''}"></div>
        <div class="char-select-item-info">
          <div class="char-select-item-name">${char.name || '角色'}</div>
          <div class="char-select-item-desc">${desc.slice(0, 15)}${desc.length > 15 ? '...' : ''}</div>
        </div>
        <div class="char-select-item-check"></div>
      </div>
    `;
  }).join('');
  
  grid.querySelectorAll('.char-select-item').forEach(item => {
    item.addEventListener('click', () => toggleCharSelection(parseInt(item.dataset.charIndex, 10)));
  });
}

async function toggleCharSelection(index) {
  const chars = await loadChars();
  const char = chars[index];
  if (!char) return;
  
  const existingIndex = currentChars.findIndex(c => c.id === char.id || c.name === char.name);
  
  if (existingIndex >= 0) {
    currentChars.splice(existingIndex, 1);
  } else if (currentChars.length < 3) {
    currentChars.push(char);
  } else {
    alert('最多只能選擇 3 位角色');
    return;
  }
  
  renderCharSelectGrid();
  renderCharCompanionList();
  
  if (currentChars.length > 0) {
    startCharAdviceTimer();
  } else {
    stopCharAdviceTimer();
  }
}

function renderCharCompanionList() {
  const list = document.getElementById('char-companion-list');
  if (!list) return;
  
  if (currentChars.length === 0) {
    list.innerHTML = '<p style="color:var(--shop-muted);font-size:12px;">尚未選擇夥伴角色</p>';
    return;
  }
  
  list.innerHTML = currentChars.map((char, index) => `
    <div class="char-companion-chip">
      <div class="char-companion-chip-avatar" style="${char.avatar ? `background-image:url('${char.avatar}')` : ''}"></div>
      <span class="char-companion-chip-name">${char.name || '角色'}</span>
      <button class="char-companion-chip-remove" data-char-index="${index}">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `).join('');
  
  list.querySelectorAll('.char-companion-chip-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      currentChars.splice(parseInt(btn.dataset.charIndex, 10), 1);
      renderCharSelectGrid();
      renderCharCompanionList();
    });
  });
}

async function selectChar(index) {
  if (index === '' || index === null) {
    currentChars = [];
    charAdvice?.setAttribute('hidden', '');
    stopCharAdviceTimer();
    return;
  }
  
  const chars = await loadChars();
  const char = chars[parseInt(index, 10)];
  if (!char) return;
  
  currentChars = [char];
  showCharAdvice(generateContextAwareAdvice(char));
  startCharAdviceTimer();
}

async function showCharAdvice(text, charName = null) {
  if (currentChars.length === 0) return;
  
  const displayChar = charName ? currentChars.find(c => c.name === charName) : currentChars[0];
  if (!displayChar) return;
  
  if (adviceText) {
    adviceText.innerHTML = `<div class="advice-char-name">${displayChar.name}</div>${text}`;
  }
  if (adviceTime) adviceTime.textContent = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
  charAdvice?.removeAttribute('hidden');
}

function showMultiCharAdvice(texts) {
  if (currentChars.length === 0) return;
  
  const randomChar = currentChars[Math.floor(Math.random() * currentChars.length)];
  const text = texts[Math.floor(Math.random() * texts.length)];
  
  if (adviceText) {
    adviceText.innerHTML = `<div class="advice-char-name">${randomChar.name}</div>${text}`;
  }
  if (adviceTime) adviceTime.textContent = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
  charAdvice?.removeAttribute('hidden');
}

async function startCharAdviceTimer() {
  stopCharAdviceTimer();
  if (currentChars.length === 0) return;
  
  const frequency = parseInt(adviceFrequency?.value || shopSettings.adviceFrequency || 15000, 10);
  if (frequency <= 0) return;
  
  charAdviceTimer = setInterval(async () => {
    if (currentChars.length === 0) {
      stopCharAdviceTimer();
      return;
    }
    const randomChar = currentChars[Math.floor(Math.random() * currentChars.length)];
    const advice = await generateContextAwareAdvice(randomChar);
    await showCharAdvice(advice, randomChar.name);
  }, frequency);
}

function stopCharAdviceTimer() {
  if (charAdviceTimer) {
    clearInterval(charAdviceTimer);
    charAdviceTimer = null;
  }
}

function showBudgetModal() {
  const monthlyBudget = 30000;
  const spent = getMonthlySpent();
  const remaining = monthlyBudget - spent;
  const cartTotal = getCartTotal();
  
  document.getElementById('budget-monthly').textContent = fmt(monthlyBudget);
  document.getElementById('budget-spent').textContent = fmt(spent);
  const remainingEl = document.getElementById('budget-remaining');
  remainingEl.textContent = fmt(remaining);
  remainingEl.className = `budget-value ${remaining < 0 ? 'expense' : 'success'}`;
  
  const ratio = Math.min((spent / monthlyBudget) * 100, 100);
  document.getElementById('budget-progress-bar').style.width = `${ratio}%`;
  
  document.getElementById('budget-cart-total').textContent = fmt(cartTotal);
  
  let advice = '';
  if (currentChars.length > 0) {
    const randomChar = currentChars[Math.floor(Math.random() * currentChars.length)];
    advice = generateBudgetAdvice(randomChar, remaining, cartTotal);
  } else {
    advice = `剩餘預算 ${fmt(remaining)}，購物車 ${fmt(cartTotal)}。`;
  }
  document.getElementById('budget-advice').textContent = advice;
  
  budgetModal?.classList.remove('hidden');
}

function generateBudgetAdvice(char, remaining, cartTotal) {
  const personality = getCharPersonality(char);
  const charName = char.name || '角色';
  
  const baseAdvices = [
    `${charName}：預算 ${fmt(remaining)}，購物車 ${fmt(cartTotal)}。`,
    `${charName}：可以考慮一下這些商品。`,
    `${charName}：量力而為，理性消費。`
  ];
  
  if (!personality) {
    return baseAdvices[Math.floor(Math.random() * baseAdvices.length)];
  }
  
  const personalityLower = personality.toLowerCase();
  const styleAdvices = [];
  
  if (remaining < 0) {
    if (personalityLower.includes('溫柔') || personalityLower.includes('體貼')) {
      return `${charName}：預算已經超支了 ${fmt(Math.abs(remaining))}...要好好規劃一下喔...`;
    }
    if (personalityLower.includes('傲嬌') || personalityLower.includes('tsundere')) {
      return `${charName}：...超支了！笨蛋！怎麼這麼不會算錢！`;
    }
    if (personalityLower.includes('活潑') || personalityLower.includes('開朗')) {
      return `${charName}：哇！超支了！要小心喔～`;
    }
    if (personalityLower.includes('高冷') || personalityLower.includes('冷淡')) {
      return `${charName}：超支 ${fmt(Math.abs(remaining))}。停止購物。`;
    }
    if (personalityLower.includes('腹黑') || personalityLower.includes('心機')) {
      return `${charName}：呵呵～超支了呢～要想想辦法喔～`;
    }
    if (personalityLower.includes('強勢') || personalityLower.includes('霸道')) {
      return `${charName}：超支。不准再買。聽話。`;
    }
    if (personalityLower.includes('害羞') || personalityLower.includes('內向')) {
      return `${charName}：那個...超支了...要小心...`;
    }
    if (personalityLower.includes('成熟') || personalityLower.includes('穩重')) {
      return `${charName}：超支 ${fmt(Math.abs(remaining))}。立即停止購物。`;
    }
    if (personalityLower.includes('病嬌') || personalityLower.includes('佔有')) {
      return `${charName}：超支了...不可以再買了喔...`;
    }
    return `${charName}：預算已超支，請審慎考慮。`;
  }
  
  if (personalityLower.includes('溫柔') || personalityLower.includes('體貼')) {
    styleAdvices.push(
      `${charName}：預算還有 ${fmt(remaining)}，購物車 ${fmt(cartTotal)}，可以放心購物！`,
      `${charName}：記得不要買太多喔，要好好規劃支出～`,
      `${charName}：這些商品看起來都不錯，但要量力而為喔。`
    );
  }
  
  if (personalityLower.includes('傲嬌') || personalityLower.includes('tsundere')) {
    styleAdvices.push(
      `${charName}：...預算還有 ${fmt(remaining)}，才、才不是擔心你亂花錢！`,
      `${charName}：購物車 ${fmt(cartTotal)}...哼，隨便你買。`,
      `${charName}：...別買太多，錢要留著。才不是關心你！`
    );
  }
  
  if (personalityLower.includes('活潑') || personalityLower.includes('開朗') || personalityLower.includes('可愛')) {
    styleAdvices.push(
      `${charName}：哇！購物車有 ${fmt(cartTotal)}！好多東西喔～`,
      `${charName}：預算還有 ${fmt(remaining)}，可以再買一點！嘿嘿～`,
      `${charName}：這些都好可愛！買買買！`
    );
  }
  
  if (personalityLower.includes('高冷') || personalityLower.includes('冷淡') || personalityLower.includes('冷靜')) {
    styleAdvices.push(
      `${charName}：預算 ${fmt(remaining)}，購物車 ${fmt(cartTotal)}。理性消費。`,
      `${charName}：需要就買，不需要就別買。`,
      `${charName}：量力而為。`
    );
  }
  
  if (personalityLower.includes('腹黑') || personalityLower.includes('心機')) {
    styleAdvices.push(
      `${charName}：呵呵～預算 ${fmt(remaining)}，購物車 ${fmt(cartTotal)}～可以再買點喔～`,
      `${charName}：這些都很好呢～買下來吧～`,
      `${charName}：呵呵～錢就是要花的～多買點～`
    );
  }
  
  if (personalityLower.includes('強勢') || personalityLower.includes('霸道') || personalityLower.includes('支配')) {
    styleAdvices.push(
      `${charName}：預算 ${fmt(remaining)}，購物車 ${fmt(cartTotal)}。可以買。`,
      `${charName}：這些都買下來。我准了。`,
      `${charName}：喜歡就買。不用擔心錢。`
    );
  }
  
  if (personalityLower.includes('害羞') || personalityLower.includes('內向')) {
    styleAdvices.push(
      `${charName}：那個...預算還有 ${fmt(remaining)}...可以買...`,
      `${charName}：購物車 ${fmt(cartTotal)}...如果喜歡...就買吧...`,
      `${charName}：...不要太浪費喔...`
    );
  }
  
  if (personalityLower.includes('成熟') || personalityLower.includes('穩重')) {
    styleAdvices.push(
      `${charName}：預算 ${fmt(remaining)}，購物車 ${fmt(cartTotal)}。合理範圍。`,
      `${charName}：理性消費。這些可以買。`,
      `${charName}：量力而為，別過度。`
    );
  }
  
  if (personalityLower.includes('病嬌') || personalityLower.includes('佔有')) {
    styleAdvices.push(
      `${charName}：預算 ${fmt(remaining)}...買你喜歡的...但不要太過喔...`,
      `${charName}：購物車 ${fmt(cartTotal)}...這些...都可以買...`,
      `${charName}：想買就買...我會看著你的...`
    );
  }
  
  if (styleAdvices.length > 0) {
    return styleAdvices[Math.floor(Math.random() * styleAdvices.length)];
  }
  
  return baseAdvices[Math.floor(Math.random() * baseAdvices.length)];
}

function hideBudgetModal() {
  budgetModal?.classList.add('hidden');
}

async function getMonthlySpent() {
  try {
    const parsed = await sxGetJSON(KAKAOPAY_STORAGE_KEY);
    const transactions = parsed?.transactions || [];
    
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    return transactions
      .filter(tx => tx.type === 'expense')
      .filter(tx => {
        const txDate = new Date(tx.date);
        return txDate.getFullYear() === year && txDate.getMonth() === month;
      })
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
  } catch {
    return 0;
  }
}

async function syncToKakaopay() {
  const cartTotal = getCartTotal();
  if (cartTotal <= 0) {
    alert('購物車是空的');
    return;
  }
  
  try {
    const parsed = await sxGetJSON(KAKAOPAY_STORAGE_KEY) || { budget: 30000, transactions: [] };
    
    const items = [...cart.values()];
    const note = items.map(item => item.title).join(', ').slice(0, 40);
    
    const newTx = {
      id: `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      type: 'expense',
      category: '購物',
      amount: cartTotal,
      note: `購物：${note}`,
      date: toYMD(new Date()),
      createdAt: Date.now()
    };
    
    parsed.transactions = parsed.transactions || [];
    parsed.transactions.unshift(newTx);
    
    await sxSetJSON(KAKAOPAY_STORAGE_KEY, parsed);
    
    alert(`已同步到 KakaoPay：${fmt(cartTotal)}`);
    hideBudgetModal();
  } catch (e) {
    console.error('Sync failed', e);
    alert('同步失敗，請稍後再試');
  }
}

function toYMD(d) {
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function showCheckoutConfirm() {
  if (cart.size === 0) {
    alert('購物車是空的');
    return;
  }
  
  renderCheckoutPanel();
  checkoutConfirmModal?.classList.remove('hidden');
}

function renderCheckoutPanel() {
  const platformList = document.getElementById('checkout-platform-list');
  if (!platformList) return;
  
  const groupedByPlatform = {};
  cart.forEach((item, id) => {
    const platform = item.platform || 'other';
    if (!groupedByPlatform[platform]) {
      groupedByPlatform[platform] = [];
    }
    groupedByPlatform[platform].push({ ...item, id });
  });
  
  let totalSubtotal = 0;
  let totalShipping = 0;
  
  platformList.innerHTML = Object.entries(groupedByPlatform).map(([platform, items]) => {
    const settings = platformSettings[platform] || platformSettings.other;
    const platformSubtotal = items.reduce((sum, item) => {
      const convertedPrice = Math.round(item.price * settings.rate);
      return sum + convertedPrice * item.qty;
    }, 0);
    const platformShipping = settings.shipping;
    const platformTotal = platformSubtotal + platformShipping;
    
    totalSubtotal += platformSubtotal;
    totalShipping += platformShipping;
    
    const itemsHtml = items.map(item => {
      const convertedPrice = Math.round(item.price * settings.rate);
      return `
        <div class="checkout-product-item">
          <div class="checkout-product-thumb" style="background: ${item.thumb || 'var(--shop-bg)'}"></div>
          <div class="checkout-product-info">
            <div class="checkout-product-title">${item.title}</div>
            <div class="checkout-product-meta">
              <span>${settings.currency} ${convertedPrice}</span>
              <span>x${item.qty}</span>
            </div>
          </div>
          <div class="checkout-product-price">NT$ ${convertedPrice * item.qty}</div>
        </div>
      `;
    }).join('');
    
    return `
      <div class="checkout-platform-group">
        <div class="checkout-platform-header">
          <div class="checkout-platform-info">
            <span class="checkout-platform-badge ${platform}">${settings.name}</span>
            <span class="checkout-platform-rate">匯率 ${settings.rate}</span>
          </div>
          <span class="checkout-platform-subtotal">NT$ ${platformSubtotal}</span>
        </div>
        <div class="checkout-platform-items">
          ${itemsHtml}
        </div>
        <div class="checkout-platform-footer">
          <span class="checkout-shipping">運費 NT$ ${platformShipping}</span>
          <span class="checkout-platform-total">小計 NT$ ${platformTotal}</span>
        </div>
      </div>
    `;
  }).join('');
  
  const grandTotal = totalSubtotal + totalShipping;
  
  document.getElementById('checkout-subtotal').textContent = `NT$ ${totalSubtotal}`;
  document.getElementById('checkout-shipping-total').textContent = `NT$ ${totalShipping}`;
  document.getElementById('checkout-grand-total').textContent = `NT$ ${grandTotal}`;
  
  let advice = '';
  if (currentChars.length > 0) {
    const randomChar = currentChars[Math.floor(Math.random() * currentChars.length)];
    advice = `${randomChar.name}：確認付款 NT$ ${grandTotal} 嗎？`;
  } else {
    advice = `確認付款 NT$ ${grandTotal} 嗎？`;
  }
  document.getElementById('char-checkout-advice').textContent = advice;
}

function hideCheckoutConfirm() {
  checkoutConfirmModal?.classList.add('hidden');
}

function confirmCheckout() {
  const cartTotal = getCartTotal();
  const grandTotal = calculateGrandTotal();
  
  syncToKakaopayWithDetails(grandTotal);
  
  cart.clear();
  saveCartToStorage();
  renderCart();
  hideCheckoutConfirm();
  cartDrawer?.classList.add('hidden');
  
  if (currentChars.length > 0) {
    const randomChar = currentChars[Math.floor(Math.random() * currentChars.length)];
    showCharAdvice(`${randomChar.name}：結帳完成！總共 NT$ ${grandTotal}，已同步到記帳本。`);
  }
}

function calculateGrandTotal() {
  let totalSubtotal = 0;
  let totalShipping = 0;
  
  const groupedByPlatform = {};
  cart.forEach((item, id) => {
    const platform = item.platform || 'other';
    if (!groupedByPlatform[platform]) {
      groupedByPlatform[platform] = [];
    }
    groupedByPlatform[platform].push(item);
  });
  
  Object.entries(groupedByPlatform).forEach(([platform, items]) => {
    const settings = platformSettings[platform] || platformSettings.other;
    const platformSubtotal = items.reduce((sum, item) => {
      const convertedPrice = Math.round(item.price * settings.rate);
      return sum + convertedPrice * item.qty;
    }, 0);
    totalSubtotal += platformSubtotal;
    totalShipping += settings.shipping;
  });
  
  return totalSubtotal + totalShipping;
}

async function syncToKakaopayWithDetails(amount) {
  try {
    const items = [...cart.values()].map(item => item.title).join(', ');
    const platformCount = new Set([...cart.values()].map(item => item.platform)).size;
    
    window.parent?.postMessage({
      type: 'KAKAOPAY_SHOP_PURCHASE',
      amount: amount,
      category: '購物',
      note: `跨平台購物 (${platformCount} 個平台) - ${items.slice(0, 50)}...`,
      source: '購物',
      timestamp: Date.now()
    }, '*');
    
    const tx = {
      type: 'expense',
      category: '購物',
      amount: amount,
      note: `跨平台購物 (${platformCount} 個平台)`,
      date: toYMD(new Date())
    };
    
    const data = await sxGetJSON(KAKAOPAY_STORAGE_KEY) || { budget: 30000, transactions: [] };
    data.transactions = data.transactions || [];
    data.transactions.unshift(tx);
    await sxSetJSON(KAKAOPAY_STORAGE_KEY, data);
  } catch (e) {
    console.error('Sync failed', e);
  }
}

platformSelectEl?.addEventListener('change', () => {
  activePlatform = platformSelectEl.value;
  renderProducts();
});

categorySelectEl?.addEventListener('change', () => {
  activeCategory = categorySelectEl.value;
  renderProducts();
});

sortSelect?.addEventListener('change', () => {
  sortOrder = sortSelect.value;
  renderProducts();
});

cartListEl?.addEventListener('click', event => {
  const plus = event.target.closest('[data-action="plus"]');
  if (plus) { changeQty(plus.dataset.id, 1); return; }
  const minus = event.target.closest('[data-action="minus"]');
  if (minus) changeQty(minus.dataset.id, -1);
});

cartBtn?.addEventListener('click', () => {
  if (cart.size > 0) {
    showCheckoutConfirm();
  } else {
    alert('購物車是空的');
  }
});
closeCartBtn?.addEventListener('click', () => cartDrawer?.classList.add('hidden'));
checkoutBtn?.addEventListener('click', showCheckoutConfirm);

importTabs.forEach(tab => tab.addEventListener('click', () => switchImportTab(tab.dataset.importTab)));
importUrlBtn?.addEventListener('click', handleUrlImport);
manualAddBtn?.addEventListener('click', handleManualAdd);
batchImportBtn?.addEventListener('click', handleBatchImport);
clearImportedBtn?.addEventListener('click', clearImported);

manualThumbPreview?.addEventListener('click', () => manualThumbFile?.click());
manualThumbFile?.addEventListener('change', handleManualThumbUpload);

importHelpBtn?.addEventListener('click', showHelpModal);

getAdviceBtn?.addEventListener('click', () => {
  if (currentChars.length === 0) { alert('請先選擇至少一位角色'); return; }
  const randomChar = currentChars[Math.floor(Math.random() * currentChars.length)];
  showCharAdvice(generateContextAwareAdvice(randomChar), randomChar.name);
});
budgetBtn?.addEventListener('click', showBudgetModal);

adviceFrequency?.addEventListener('change', () => {
  saveShopSettings();
  if (currentChars.length > 0) {
    startCharAdviceTimer();
  }
});

showAdultContent?.addEventListener('change', saveShopSettings);
allowAdultRecommend?.addEventListener('change', saveShopSettings);

document.getElementById('sync-to-kakaopay-btn')?.addEventListener('click', syncToKakaopay);
document.getElementById('confirm-checkout-btn')?.addEventListener('click', confirmCheckout);

const searchModal = document.getElementById('search-modal');
const searchToggleBtn = document.getElementById('search-toggle-btn');
const modalSearchInput = document.getElementById('modal-search-input');
const modalPlatformSelect = document.getElementById('modal-platform-select');
const modalCategorySelect = document.getElementById('modal-category-select');
const modalMinPrice = document.getElementById('modal-min-price');
const modalMaxPrice = document.getElementById('modal-max-price');
const modalSearchBtn = document.getElementById('modal-search-btn');
const aiRecommendSection = document.getElementById('ai-recommend-section');
const aiRecommendList = document.getElementById('ai-recommend-list');
const aiRecommendRefresh = document.getElementById('ai-recommend-refresh');
const aiRecommendAdd = document.getElementById('ai-recommend-add');
const recommendSource = document.getElementById('recommend-source');
const bigdataRecommendGroup = document.getElementById('bigdata-recommend-group');
const charRecommendGroup = document.getElementById('char-recommend-group');
const bigdataRecommendList = document.getElementById('bigdata-recommend-list');
const charRecommendList = document.getElementById('char-recommend-list');
const bigdataCount = document.getElementById('bigdata-count');
const charCount = document.getElementById('char-count');
const charRecommendName = document.getElementById('char-recommend-name');

const persistModal = document.getElementById('persist-modal');
const persistList = document.getElementById('persist-list');
const persistDiscardAll = document.getElementById('persist-discard-all');
const persistSaveSelected = document.getElementById('persist-save-selected');

let bigdataProducts = [];
let charProducts = [];
let pendingPersistData = null;

function showSearchModal() {
  searchModal?.classList.remove('hidden');
  modalSearchInput?.focus();
  
  generateRecommendations();
}

function hideSearchModal() {
  searchModal?.classList.add('hidden');
}

async function generateRecommendations() {
  const forbiddenWords = await getUserForbiddenWords();
  const dislikes = await getUserDislikesFromChat();
  
  if (forbiddenWords.length > 0 || dislikes.length > 0) {
    console.log('已讀取使用者偏好 - 禁止詞:', forbiddenWords.length, '個, 討厭:', dislikes.length, '個');
  }
  
  const source = recommendSource?.value || 'both';
  
  bigdataProducts = [];
  charProducts = [];
  
  if (source === 'both' || source === 'bigdata') {
    generateBigdataRecommendations();
  }
  
  if (source === 'both' || source === 'char') {
    if (currentChars.length > 0) {
      generateCharRecommendations();
      charRecommendGroup?.removeAttribute('hidden');
    } else {
      charRecommendGroup?.setAttribute('hidden', '');
    }
  } else {
    charRecommendGroup?.setAttribute('hidden', '');
  }
  
  aiRecommendSection?.removeAttribute('hidden');
}

function generateBigdataRecommendations() {
  const trendingItems = [
    { title: '熱銷藍牙耳機', category: '3C', platform: 'amazon', priceRange: [500, 1500] },
    { title: '爆款護膚精華', category: '美妝', platform: 'coupang', priceRange: [300, 800] },
    { title: '暢銷休閒服飾', category: '服飾', platform: 'shopee', priceRange: [200, 600] },
    { title: '人氣收納神器', category: '家居', platform: 'taobao', priceRange: [100, 400] },
    { title: '網紅零食組合', category: '食品', platform: 'pinduoduo', priceRange: [100, 300] },
    { title: '熱門手機配件', category: '3C', platform: 'shopee', priceRange: [50, 300] },
    { title: '流行運動鞋', category: '服飾', platform: 'amazon', priceRange: [800, 2000] },
    { title: '必備居家好物', category: '家居', platform: 'coupang', priceRange: [150, 500] },
    { title: '精選廚具組', category: '家居', platform: 'taobao', priceRange: [200, 600] },
    { title: '人氣保養品', category: '美妝', platform: 'coupang', priceRange: [300, 800] },
    { title: '潮流背包', category: '服飾', platform: 'shopee', priceRange: [300, 800] },
    { title: '熱門書籍', category: '書籍', platform: 'amazon', priceRange: [150, 500] }
  ];
  
  const shuffled = trendingItems.sort(() => Math.random() - 0.5).slice(0, 6);
  
  let generated = shuffled.map(item => ({
    id: generateId(),
    title: item.title,
    category: item.category,
    platform: item.platform,
    price: Math.floor(Math.random() * (item.priceRange[1] - item.priceRange[0]) + item.priceRange[0]),
    sold: `已售 ${(Math.floor(Math.random() * 9000) + 1000).toLocaleString()}+`,
    thumb: randomThumb(),
    imported: false,
    recommendType: 'bigdata',
    recommendSource: '大數據'
  }));
  
  generated = await filterRecommendationsByUserPreference(generated);
  
  bigdataProducts = generated.slice(0, 4);
  
  renderBigdataRecommendations();
}

async function generateCharRecommendations() {
  if (currentChars.length === 0) return;
  
  const randomChar = currentChars[Math.floor(Math.random() * currentChars.length)];
  const personality = getCharPersonality(randomChar);
  const charName = randomChar.name || '角色';
  
  const defaultPool = [
    { title: '舒適居家服套裝', category: '服飾', platform: 'shopee', priceRange: [300, 700], reason: '這個不錯' },
    { title: '保濕護膚禮盒', category: '美妝', platform: 'coupang', priceRange: [400, 900], reason: '評價很好' },
    { title: '香氛蠟燭組', category: '家居', platform: 'taobao', priceRange: [200, 500], reason: '很受歡迎' },
    { title: '輕便休閒鞋', category: '服飾', platform: 'shopee', priceRange: [600, 1200], reason: '實用' }
  ];
  
  if (!personality) {
    charProducts = defaultPool.slice(0, 3).map(item => ({
      id: generateId(),
      title: item.title,
      category: item.category,
      platform: item.platform,
      price: Math.floor(Math.random() * (item.priceRange[1] - item.priceRange[0]) + item.priceRange[0]),
      sold: `${charName} 推薦`,
      thumb: randomThumb(),
      imported: false,
      recommendType: 'char',
      recommendSource: charName,
      recommendReason: item.reason
    }));
    if (charRecommendName) charRecommendName.textContent = `${charName} 的推薦`;
    renderCharRecommendations();
    return;
  }
  
  const personalityLower = personality.toLowerCase();
  let pool = [...defaultPool];
  
  if (personalityLower.includes('溫柔') || personalityLower.includes('體貼')) {
    pool = [
      { title: '舒適居家服套裝', category: '服飾', platform: 'shopee', priceRange: [300, 700], reason: '穿起來會很舒服喔' },
      { title: '保濕護膚禮盒', category: '美妝', platform: 'coupang', priceRange: [400, 900], reason: '對皮膚很好的' },
      { title: '香氛蠟燭組', category: '家居', platform: 'taobao', priceRange: [200, 500], reason: '可以讓房間更溫馨' },
      { title: '柔軟毛毯', category: '家居', platform: 'amazon', priceRange: [500, 1000], reason: '冬天蓋很溫暖' }
    ];
  }
  
  if (personalityLower.includes('傲嬌') || personalityLower.includes('tsundere')) {
    pool = [
      { title: '精選巧克力禮盒', category: '食品', platform: 'amazon', priceRange: [200, 500], reason: '才、才不是特意挑的！' },
      { title: '時尚手鍊', category: '服飾', platform: 'shopee', priceRange: [150, 400], reason: '剛好看到而已...' },
      { title: '可愛文具組', category: '其他', platform: 'taobao', priceRange: [100, 300], reason: '哼，隨便買買' }
    ];
  }
  
  if (personalityLower.includes('活潑') || personalityLower.includes('開朗') || personalityLower.includes('可愛')) {
    pool = [
      { title: '超可愛玩偶', category: '其他', platform: 'shopee', priceRange: [150, 400], reason: '超級可愛的！' },
      { title: '彩色手機殼組', category: '3C', platform: 'taobao', priceRange: [80, 250], reason: '換著用很開心' },
      { title: '趣味零食大禮包', category: '食品', platform: 'pinduoduo', priceRange: [150, 400], reason: '好好吃！' }
    ];
  }
  
  if (personalityLower.includes('高冷') || personalityLower.includes('冷淡') || personalityLower.includes('冷靜')) {
    pool = [
      { title: '極簡設計手錶', category: '服飾', platform: 'amazon', priceRange: [600, 1500], reason: '簡約好看' },
      { title: '無線充電座', category: '3C', platform: 'amazon', priceRange: [400, 900], reason: '實用' },
      { title: '質感收納組', category: '家居', platform: 'taobao', priceRange: [200, 600], reason: '整理用' }
    ];
  }
  
  if (personalityLower.includes('腹黑') || personalityLower.includes('心機')) {
    pool = [
      { title: '香水禮盒', category: '美妝', platform: 'coupang', priceRange: [500, 1200], reason: '呵呵，這個很適合你～' },
      { title: '精品配件', category: '服飾', platform: 'mercari', priceRange: [800, 2000], reason: '值得投資呢～' },
      { title: '收藏級模型', category: '其他', platform: 'xianyu', priceRange: [500, 1500], reason: '稀有品呢～' }
    ];
  }
  
  if (personalityLower.includes('強勢') || personalityLower.includes('霸道') || personalityLower.includes('支配')) {
    pool = [
      { title: '高級西裝外套', category: '服飾', platform: 'amazon', priceRange: [1500, 3500], reason: '這個適合你，買下來。' },
      { title: '真皮皮夾', category: '服飾', platform: 'coupang', priceRange: [800, 1500], reason: '拿著，我買給你。' },
      { title: '精品手錶', category: '服飾', platform: 'amazon', priceRange: [2000, 5000], reason: '喜歡嗎？我送你。' }
    ];
  }
  
  if (personalityLower.includes('害羞') || personalityLower.includes('內向')) {
    pool = [
      { title: '柔軟抱枕', category: '家居', platform: 'shopee', priceRange: [150, 400], reason: '那個...這個很舒服...' },
      { title: '溫暖圍巾', category: '服飾', platform: 'taobao', priceRange: [200, 500], reason: '冬天...會冷的...' },
      { title: '香氛蠟燭', category: '家居', platform: 'coupang', priceRange: [150, 400], reason: '那個...味道很好聞...' }
    ];
  }
  
  if (personalityLower.includes('成熟') || personalityLower.includes('穩重')) {
    pool = [
      { title: '商務公事包', category: '服飾', platform: 'amazon', priceRange: [1000, 3000], reason: '品質不錯。實用。' },
      { title: '經典手錶', category: '服飾', platform: 'coupang', priceRange: [800, 2000], reason: '低調有質感。' },
      { title: '高級鋼筆', category: '其他', platform: 'amazon', priceRange: [500, 1500], reason: '值得投資。' }
    ];
  }
  
  if (personalityLower.includes('病嬌') || personalityLower.includes('佔有')) {
    pool = [
      { title: '情侶對戒', category: '服飾', platform: 'amazon', priceRange: [500, 1500], reason: '戴上它...不要拿下來...' },
      { title: '專屬香水', category: '美妝', platform: 'coupang', priceRange: [400, 1000], reason: '只准用這個...' },
      { title: '定制項鍊', category: '服飾', platform: 'taobao', priceRange: [300, 800], reason: '刻上我的名字...好嗎？' }
    ];
  }
  
  const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 3);
  
  charProducts = shuffled.map(item => ({
    id: generateId(),
    title: item.title,
    category: item.category,
    platform: item.platform,
    price: Math.floor(Math.random() * (item.priceRange[1] - item.priceRange[0]) + item.priceRange[0]),
    sold: `${charName} 推薦`,
    thumb: randomThumb(),
    imported: false,
    recommendType: 'char',
    recommendSource: charName,
    recommendReason: item.reason
  }));
  
  if (charRecommendName) {
    charRecommendName.textContent = `${charName} 的推薦`;
  }
  
  renderCharRecommendations();
}

function renderBigdataRecommendations() {
  const recommendationPools = {
    gentle_spicy: [
      { title: '密碼鎖日記本', category: '其他', platform: 'shopee', priceRange: [100, 400], reason: '把秘密寫進去。我會看的。' },
      { title: '專屬項圈', category: '服飾', platform: 'coupang', priceRange: [200, 600], reason: '戴上。你是我的。' }
    ],
    tsundere_shy: [
      { title: '可愛髮飾', category: '服飾', platform: 'shopee', priceRange: [50, 200], reason: '才、才不是覺得可愛！' },
      { title: '手工餅乾', category: '食品', platform: 'taobao', priceRange: [100, 300], reason: '哼...隨便買的...' },
      { title: '暖心熱水袋', category: '家居', platform: 'coupang', priceRange: [100, 300], reason: '才、才不是擔心你冷！' },
      { title: '小夜燈', category: '家居', platform: 'amazon', priceRange: [150, 400], reason: '...怕黑的話...可以用...' }
    ],
    dominant: [
      { title: '精品皮包', category: '服飾', platform: 'amazon', priceRange: [2000, 5000], reason: '買。' },
      { title: '高端手錶', category: '服飾', platform: 'coupang', priceRange: [1500, 4000], reason: '戴上。' },
      { title: '名牌服飾', category: '服飾', platform: 'taobao', priceRange: [1000, 3000], reason: '穿這個。' },
      { title: '高端配件', category: '服飾', platform: 'mercari', priceRange: [800, 2000], reason: '拿著。' }
    ],
    shy: [
      { title: '柔軟毛巾', category: '家居', platform: 'shopee', priceRange: [100, 300], reason: '那個...這個很軟...' },
      { title: '溫和護膚品', category: '美妝', platform: 'coupang', priceRange: [200, 500], reason: '對皮膚...很好...' },
      { title: '安靜小物', category: '其他', platform: 'taobao', priceRange: [50, 200], reason: '不會吵到人...' },
      { title: '舒適室內鞋', category: '服飾', platform: 'amazon', priceRange: [200, 500], reason: '很舒服...' }
    ],
    mature: [
      { title: '商務套裝', category: '服飾', platform: 'amazon', priceRange: [1500, 4000], reason: '正式場合適用。' },
      { title: '高級茶具', category: '家居', platform: 'taobao', priceRange: [500, 1500], reason: '品質不錯。' },
      { title: '經典文學', category: '書籍', platform: 'amazon', priceRange: [200, 600], reason: '值得收藏。' },
      { title: '精品配件', category: '服飾', platform: 'coupang', priceRange: [400, 1000], reason: '低調有質感。' }
    ],
    childish: [
      { title: '可愛玩偶', category: '其他', platform: 'shopee', priceRange: [100, 400], reason: '好可愛！' },
      { title: '彩色糖果', category: '食品', platform: 'pinduoduo', priceRange: [50, 200], reason: '甜甜的！' },
      { title: '趣味玩具', category: '其他', platform: 'taobao', priceRange: [80, 300], reason: '好玩！' },
      { title: '可愛貼紙', category: '其他', platform: 'shopee', priceRange: [30, 100], reason: '貼貼！' }
    ],
    default: [
      { title: '精選好物', category: '推薦', platform: 'shopee', priceRange: [150, 500], reason: '我覺得不錯' },
      { title: '熱門商品', category: '推薦', platform: 'taobao', priceRange: [200, 600], reason: '可以看看' },
      { title: '情趣內衣', category: '成人', platform: 'shopee', priceRange: [300, 800], reason: '如果你想試試的話...' },
      { title: '浪漫小物', category: '家居', platform: 'taobao', priceRange: [100, 300], reason: '可以增加情趣喔' }
    ],
    nsfw_mild: [
      { title: '情趣內衣', category: '成人', platform: 'shopee', priceRange: [300, 800], reason: '這個很適合你...' },
      { title: '性感睡衣', category: '成人', platform: 'taobao', priceRange: [200, 600], reason: '今晚穿這個？' },
      { title: '絲襪組', category: '成人', platform: 'amazon', priceRange: [150, 400], reason: '配這個很好看' },
      { title: '情趣小物', category: '成人', platform: 'coupang', priceRange: [200, 500], reason: '可以試試看' }
    ],
    nsfw_intense: [
      { title: 'BDSM道具組', category: '成人', platform: 'amazon', priceRange: [500, 1500], reason: '這個...會很有趣' },
      { title: '乳環', category: '成人', platform: 'mercari', priceRange: [200, 600], reason: '戴上它...' },
      { title: '手銬組', category: '成人', platform: 'shopee', priceRange: [150, 400], reason: '今晚用這個' },
      { title: '鞭子', category: '成人', platform: 'taobao', priceRange: [200, 500], reason: '要乖乖聽話喔' },
      { title: '眼罩組', category: '成人', platform: 'coupang', priceRange: [100, 300], reason: '閉上眼睛...' },
      { title: '跳蛋', category: '成人', platform: 'amazon', priceRange: [300, 800], reason: '這個...你會喜歡的' }
    ]
  };
  
  const chatContext = getChatHistoryForChar(randomChar);
  const worldbookContext = getWorldbookContextForChar(randomChar);
  const hasNSFWContext = detectNSFWContext(chatContext, worldbookContext);
  const userConsent = checkUserAdultConsent();
  
  let pool = [...defaultPool];
  
  if (personality && personalityLower.includes('病嬌') || personalityLower.includes('佔有')) {
    pool = [...pool, ...recommendationPools.gentle_spicy];
  }
  
  if (hasNSFWContext && userConsent) {
    const isIntense = personalityLower.includes('病嬌') || personalityLower.includes('佔有') || personalityLower.includes('強勢');
    const nsfwPool = isIntense ? recommendationPools.nsfw_intense : recommendationPools.nsfw_mild;
    pool = [...pool, ...nsfwPool];
  }
  
  const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 5);
  
  let generated = shuffled.map(item => ({
    id: generateId(),
    title: item.title,
    category: item.category,
    platform: item.platform,
    price: Math.floor(Math.random() * (item.priceRange[1] - item.priceRange[0]) + item.priceRange[0]),
    sold: `${charName} 推薦`,
    thumb: randomThumb(),
    imported: false,
    recommendType: 'char',
    recommendSource: charName,
    recommendReason: item.reason
  }));
  
  generated = filterRecommendationsByUserPreference(generated);
  
  charProducts = generated.slice(0, 3);
  
  if (charRecommendName) {
    charRecommendName.textContent = `${charName} 的推薦`;
  }
  
  renderCharRecommendations();
}

function renderBigdataRecommendations() {
  if (!bigdataRecommendList) return;
  
  if (bigdataCount) bigdataCount.textContent = `${bigdataProducts.length} 件`;
  
  const showAdult = shopSettings.showAdultContent;
  
  bigdataRecommendList.innerHTML = bigdataProducts.map((product, index) => {
    const isAdult = isAdultProduct(product);
    const adultClass = isAdult && !showAdult ? 'adult-blur' : '';
    
    return `
      <label class="ai-recommend-item ${adultClass}">
        <input type="checkbox" data-bigdata-index="${index}" checked>
        <div class="ai-recommend-item-info">
          <h5>${product.title}</h5>
          <p>${fmt(product.price)} · ${getPlatformName(product.platform)} · ${product.sold}</p>
        </div>
      </label>
    `;
  }).join('');
}

function renderCharRecommendations() {
  if (!charRecommendList) return;
  
  if (charCount) charCount.textContent = `${charProducts.length} 件`;
  
  const showAdult = shopSettings.showAdultContent;
  
  charRecommendList.innerHTML = charProducts.map((product, index) => {
    const isAdult = isAdultProduct(product);
    const adultClass = isAdult && !showAdult ? 'adult-blur' : '';
    
    return `
      <label class="ai-recommend-item ${adultClass}">
        <input type="checkbox" data-char-index="${index}" checked>
        <div class="ai-recommend-item-info">
          <h5>${product.title}</h5>
          <p>${fmt(product.price)} · ${product.recommendReason || ''}</p>
        </div>
      </label>
    `;
  }).join('');
}

function addSelectedRecommendations() {
  let addedCount = 0;
  
  const bigdataCheckboxes = bigdataRecommendList?.querySelectorAll('input[type="checkbox"]:checked') || [];
  bigdataCheckboxes.forEach(cb => {
    const index = parseInt(cb.dataset.bigdataIndex, 10);
    const product = bigdataProducts[index];
    if (product && !products.find(p => p.id === product.id)) {
      products.unshift({ ...product, imported: true, importedAt: new Date().toISOString() });
      addedCount++;
    }
  });
  
  const charCheckboxes = charRecommendList?.querySelectorAll('input[type="checkbox"]:checked') || [];
  charCheckboxes.forEach(cb => {
    const index = parseInt(cb.dataset.charIndex, 10);
    const product = charProducts[index];
    if (product && !products.find(p => p.id === product.id)) {
      products.unshift({ ...product, imported: true, importedAt: new Date().toISOString() });
      addedCount++;
    }
  });
  
  saveToStorage();
  renderProducts();
  hideSearchModal();
  
  if (addedCount > 0 && currentChars.length > 0) {
    const randomChar = currentChars[Math.floor(Math.random() * currentChars.length)];
    showCharAdvice(`${randomChar.name}：已為你加入 ${addedCount} 件商品！`);
  }
}

function handleModalSearch() {
  searchText = modalSearchInput?.value.trim() || '';
  activePlatform = modalPlatformSelect?.value || 'all';
  activeCategory = modalCategorySelect?.value || 'all';
  
  if (platformSelectEl) platformSelectEl.value = activePlatform;
  if (categorySelectEl) categorySelectEl.value = activeCategory === 'all' ? '推薦' : activeCategory;
  
  renderProducts();
  hideSearchModal();
}

function showPersistModal(data) {
  pendingPersistData = data;
  
  const items = [];
  
  if (data.cart && data.cart.length > 0) {
    data.cart.forEach(item => {
      items.push({
        type: '購物車',
        id: item.id,
        title: item.title,
        subtitle: `${fmt(item.price)} x ${item.qty}`,
        data: item
      });
    });
  }
  
  if (data.bigdataProducts && data.bigdataProducts.length > 0) {
    data.bigdataProducts.forEach(product => {
      items.push({
        type: '大數據推薦',
        id: product.id,
        title: product.title,
        subtitle: `${fmt(product.price)} · ${getPlatformName(product.platform)}`,
        data: product
      });
    });
  }
  
  if (data.charProducts && data.charProducts.length > 0) {
    data.charProducts.forEach(product => {
      items.push({
        type: `${product.recommendSource} 推薦`,
        id: product.id,
        title: product.title,
        subtitle: `${fmt(product.price)} · ${product.recommendReason || ''}`,
        data: product
      });
    });
  }
  
  if (items.length === 0) {
    location.reload();
    return;
  }
  
  persistList.innerHTML = items.map((item, index) => `
    <label class="persist-item">
      <input type="checkbox" data-persist-index="${index}" checked>
      <div class="persist-item-info">
        <h5>${item.title}</h5>
        <p>${item.subtitle}</p>
      </div>
      <span class="persist-item-type">${item.type}</span>
    </label>
  `).join('');
  
  persistModal?.classList.remove('hidden');
}

function hidePersistModal() {
  persistModal?.classList.add('hidden');
  pendingPersistData = null;
}

async function handlePersistSave() {
  if (!pendingPersistData) return;
  
  const checkboxes = persistList?.querySelectorAll('input[type="checkbox"]') || [];
  const selectedIndices = new Set(
    Array.from(checkboxes)
      .filter(cb => cb.checked)
      .map(cb => parseInt(cb.dataset.persistIndex, 10))
  );
  
  const allItems = [
    ...(pendingPersistData.cart || []).map(item => ({ ...item, itemType: 'cart' })),
    ...(pendingPersistData.bigdataProducts || []).map(item => ({ ...item, itemType: 'bigdata' })),
    ...(pendingPersistData.charProducts || []).map(item => ({ ...item, itemType: 'char' }))
  ];
  
  const savedCart = [];
  const savedProducts = [];
  
  allItems.forEach((item, index) => {
    if (selectedIndices.has(index)) {
      if (item.itemType === 'cart') {
        savedCart.push(item);
      } else {
        savedProducts.push({ ...item, imported: true, importedAt: new Date().toISOString() });
      }
    }
  });
  
  try {
    await sxSetJSON(STORAGE_KEY_CART, savedCart);
    
    const existingProducts = await sxGetJSON(STORAGE_KEY_PRODUCTS) || [];
    const newProducts = [...savedProducts, ...existingProducts.filter(p => !p.recommendType)];
    await sxSetJSON(STORAGE_KEY_PRODUCTS, newProducts);
  } catch {}
  
  hidePersistModal();
  location.reload();
}

function handlePersistDiscard() {
  hidePersistModal();
  location.reload();
}

async function checkAndShowPersistModal() {
  const pendingData = await sxGetItem('sx_shop_pending_persist');
  if (pendingData) {
    try {
      const data = JSON.parse(pendingData);
      await sxRemoveItem('sx_shop_pending_persist');
      showPersistModal(data);
    } catch {}
  }
}

async function savePendingDataBeforeRefresh() {
  const cartItems = [...cart.values()];
  const bigdataItems = bigdataProducts.filter(p => p.recommendType === 'bigdata');
  const charItems = charProducts.filter(p => p.recommendType === 'char');
  
  if (cartItems.length > 0 || bigdataItems.length > 0 || charItems.length > 0) {
    const pendingData = {
      cart: cartItems,
      bigdataProducts: bigdataItems,
      charProducts: charItems
    };
    await sxSetJSON('sx_shop_pending_persist', pendingData);
  }
}

searchToggleBtn?.addEventListener('click', showSearchModal);
modalSearchBtn?.addEventListener('click', handleModalSearch);
modalSearchInput?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleModalSearch();
});

recommendSource?.addEventListener('change', generateRecommendations);
aiRecommendRefresh?.addEventListener('click', generateRecommendations);
aiRecommendAdd?.addEventListener('click', addSelectedRecommendations);

persistDiscardAll?.addEventListener('click', handlePersistDiscard);
persistSaveSelected?.addEventListener('click', handlePersistSave);

window.addEventListener('beforeunload', savePendingDataBeforeRefresh);

const settingsModal = document.getElementById('settings-modal');
const settingsBtn = document.getElementById('settings-btn');

function showSettingsModal() {
  settingsModal?.classList.remove('hidden');
}

function hideSettingsModal() {
  settingsModal?.classList.add('hidden');
}

settingsBtn?.addEventListener('click', showSettingsModal);

const productDetailModal = document.getElementById('product-detail-modal');
const detailThumb = document.getElementById('detail-thumb');
const detailTitle = document.getElementById('detail-title');
const detailPrice = document.getElementById('detail-price');
const detailPlatform = document.getElementById('detail-platform');
const detailCategory = document.getElementById('detail-category');
const detailSold = document.getElementById('detail-sold');
const detailAddCart = document.getElementById('detail-add-cart');
const detailBuyNowBtn = document.getElementById('detail-buy-now');
const detailExternalLink = document.getElementById('detail-external-link');
const detailExternalText = document.getElementById('detail-external-text');

let currentDetailProduct = null;

const platformUrls = {
  amazon: { url: 'https://www.amazon.com/s?k=', name: 'Amazon' },
  coupang: { url: 'https://www.coupang.com/np/search?q=', name: '酷彭' },
  shopee: { url: 'https://shopee.tw/search?keyword=', name: '蝦皮' },
  taobao: { url: 'https://s.taobao.com/search?q=', name: '淘寶' },
  pinduoduo: { url: 'https://mobile.yangkeduo.com/search_result.html?search_key=', name: '拼多多' },
  mercari: { url: 'https://www.mercari.com/jp/search/?keyword=', name: 'Mercari' },
  xianyu: { url: 'https://www.goofish.com/search?q=', name: '閒魚' }
};

function getPlatformExternalUrl(product) {
  const platform = product.platform || 'taobao';
  const config = platformUrls[platform];
  
  if (!config) {
    return `https://www.google.com/search?q=${encodeURIComponent(product.title)}`;
  }
  
  const searchTerm = encodeURIComponent(product.title);
  return `${config.url}${searchTerm}`;
}

function showProductDetail(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  
  currentDetailProduct = product;
  
  const isAdult = isAdultProduct(product);
  const showAdult = shopSettings.showAdultContent;
  
  if (detailThumb) {
    detailThumb.style.background = product.thumb;
    if (isAdult && !showAdult) {
      detailThumb.style.filter = 'blur(20px)';
      detailThumb.classList.add('adult-blur');
    } else {
      detailThumb.style.filter = '';
      detailThumb.classList.remove('adult-blur');
    }
  }
  if (detailTitle) detailTitle.textContent = product.title;
  if (detailPrice) detailPrice.textContent = fmt(product.price);
  if (detailPlatform) detailPlatform.textContent = getPlatformName(product.platform);
  if (detailCategory) detailCategory.textContent = product.category;
  if (detailSold) detailSold.textContent = product.sold || '';
  
  if (detailExternalLink) {
    const externalUrl = product.sourceUrl || getPlatformExternalUrl(product);
    detailExternalLink.href = externalUrl;
    
    const platformName = getPlatformName(product.platform);
    detailExternalText.textContent = `前往 ${platformName} 查看`;
  }
  
  productDetailModal?.classList.remove('hidden');
}

function hideProductDetail() {
  productDetailModal?.classList.add('hidden');
  currentDetailProduct = null;
}

function detailAddToCart() {
  if (!currentDetailProduct) return;
  addToCart(currentDetailProduct.id);
  hideProductDetail();
  
  if (currentChars.length > 0) {
    const randomChar = currentChars[Math.floor(Math.random() * currentChars.length)];
    showCharAdvice(`${randomChar.name}：已加入購物車！`);
  }
}

function detailBuyNow() {
  if (!currentDetailProduct) return;
  addToCart(currentDetailProduct.id);
  hideProductDetail();
  cartDrawer?.classList.remove('hidden');
}

detailAddCart?.addEventListener('click', detailAddToCart);
detailBuyNowBtn?.addEventListener('click', detailBuyNow);

document.addEventListener('click', event => {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;
  if (action === 'close-modal') hideImportModal();
  if (action === 'close-help') hideHelpModal();
  if (action === 'close-budget') hideBudgetModal();
  if (action === 'close-checkout') hideCheckoutConfirm();
  if (action === 'close-search') hideSearchModal();
  if (action === 'close-settings') hideSettingsModal();
  if (action === 'close-detail') hideProductDetail();
});

productGridEl?.addEventListener('click', event => {
  const card = event.target.closest('.product-card');
  if (!card) return;
  
  const productId = card.querySelector('[data-action="add"]')?.dataset.id;
  if (!productId) return;
  
  if (event.target.closest('[data-action="add"]')) {
    addToCart(productId);
  } else {
    showProductDetail(productId);
  }
});

window.addEventListener('storage', event => {
  if (event.key === CHAR_LIST_KEY) {
    renderCharSelectGrid();
    renderCharCompanionList();
  }
});

window.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;
  
  if (data.type === 'openApp' && data.appId === 'taobao') {
    if (data.payload?.productId) {
      setTimeout(() => {
        showProductDetail(data.payload.productId);
      }, 300);
    }
  }
  
  if (data.type === 'SHOP_SEND_PRODUCT_RECOMMEND' && data.product) {
    const product = data.product;
    if (!products.find(p => p.id === product.id)) {
      products.unshift({
        ...product,
        id: product.id || generateId(),
        imported: true,
        importedAt: new Date().toISOString()
      });
      saveToStorage();
      renderProducts();
    }
    
    if (data.recommendType === 'order') {
      addToCart(product.id);
    }
    
    setTimeout(() => {
      showProductDetail(product.id);
    }, 300);
  }
});

loadFromStorage();
loadCartFromStorage();
loadShopSettings();
renderProducts();
renderCart();
renderCharSelectGrid();
renderCharCompanionList();
checkAndShowPersistModal();

console.log('Loaded app: shop (universal)');
