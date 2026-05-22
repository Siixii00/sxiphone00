const categoryRow = document.getElementById('category-row');
const restaurantList = document.getElementById('restaurant-list');
const searchInput = document.getElementById('search-input');
const sortBtn = document.getElementById('sort-btn');

const cartToggleBtn = document.getElementById('cart-toggle-btn');
const cartCloseBtn = document.getElementById('cart-close-btn');
const cartSheet = document.getElementById('cart-sheet');
const cartItemsEl = document.getElementById('cart-items');
const cartTotalEl = document.getElementById('cart-total');
const cartBadgeEl = document.getElementById('cart-badge');
const checkoutBtn = document.getElementById('checkout-btn');

// 地址相關元素
const addressWrap = document.getElementById('address-wrap');
const addressDisplay = document.getElementById('address-display');
const addressPanel = document.getElementById('address-panel');
const addressCloseBtn = document.getElementById('address-close-btn');
const cityInput = document.getElementById('city-input');
const districtInput = document.getElementById('district-input');
const streetInput = document.getElementById('street-input');
const noteInput = document.getElementById('note-input');
const addressSaveBtn = document.getElementById('address-save-btn');

// 餐廳詳情相關元素
const detailPanel = document.getElementById('restaurant-detail-panel');
const detailCloseBtn = document.getElementById('detail-close-btn');
const detailTitle = document.getElementById('detail-title');
const detailCover = document.getElementById('detail-cover');
const detailRating = document.getElementById('detail-rating');
const detailMeta = document.getElementById('detail-meta');
const detailDishes = document.getElementById('detail-dishes');

// 結帳相關元素
const checkoutPanel = document.getElementById('checkout-panel');
const checkoutCloseBtn = document.getElementById('checkout-close-btn');
const checkoutAddress = document.getElementById('checkout-address');
const checkoutItems = document.getElementById('checkout-items');
const checkoutSubtotal = document.getElementById('checkout-subtotal');
const checkoutFee = document.getElementById('checkout-fee');
const checkoutTotal = document.getElementById('checkout-total');
const checkoutNote = document.getElementById('checkout-note');
const checkoutConfirmBtn = document.getElementById('checkout-confirm-btn');

// 付款成功頁面元素
const paymentSuccessPanel = document.getElementById('payment-success-panel');
const successDetails = document.getElementById('success-details');
const successCloseBtn = document.getElementById('success-close-btn');

const categories = ['全部', '便當', '早午餐', '炸物', '麵食', '甜點', '飲料', '日式', '韓式', '美式', '義式', '泰式', '港式', '火鍋', '燒烤', '咖啡'];

const districts = {
  '台北市': ['信義區', '大安區', '中山區', '松山區', '中正區', '大同區', '萬華區', '文山區', '南港區', '內湖區', '士林區', '北投區'],
  '新北市': ['板橋區', '三重區', '中和區', '永和區', '新莊區', '新店區', '土城區', '蘆洲區', '汐止區', '樹林區'],
  '桃園市': ['桃園區', '中壢區', '平鎮區', '八德區', '楊梅區', '蘆竹區', '龜山區'],
  '台中市': ['西屯區', '南屯區', '北屯區', '西區', '南區', '北區', '東區', '中區', '太平區', '大里區'],
  '台南市': ['中西區', '東區', '南區', '北區', '安平區', '安南區', '永康區'],
  '高雄市': ['左營區', '鼓山區', '三民區', '鹽埕區', '前金區', '新興區', '苓雅區', '前鎮區', '楠梓區']
};

const allStores = [
  // 便當類
  {
    id: 'taipei-bento-lab',
    name: '台北便當研究所',
    category: '便當',
    rating: 4.8,
    eta: '18-28 分鐘',
    fee: 15,
    distance: '1.3 km',
    cover: 'linear-gradient(135deg,#ffd89b,#19547b)',
    description: '堅持使用台灣在地食材，每日新鮮現做',
    dishes: [
      { id: 'bento-1', name: '炙燒雞腿便當', price: 165, description: '去骨雞腿肉，搭配三樣配菜' },
      { id: 'bento-2', name: '椒鹽排骨便當', price: 170, description: '酥炸排骨，椒鹽調味' },
      { id: 'bento-3', name: '香煎鮭魚便當', price: 198, description: '挪威鮭魚，香煎料理' },
      { id: 'bento-4', name: '滷雞腿便當', price: 155, description: '傳統滷味，入味軟嫩' },
      { id: 'bento-5', name: '素食養生便當', price: 145, description: '全素料理，健康首選' }
    ]
  },
  {
    id: 'farm-bento',
    name: '農家便當屋',
    category: '便當',
    rating: 4.6,
    eta: '20-30 分鐘',
    fee: 10,
    distance: '0.8 km',
    cover: 'linear-gradient(135deg,#a8e063,#56ab2f)',
    description: '來自雲林的農家好味道',
    dishes: [
      { id: 'fb-1', name: '古早味排骨便當', price: 135, description: '懷舊口味' },
      { id: 'fb-2', name: '爌肉便當', price: 145, description: '肥瘦適中' },
      { id: 'fb-3', name: '雞排便當', price: 140, description: '大塊雞排' }
    ]
  },
  // 早午餐類
  {
    id: 'morning-room',
    name: '晨間房間 Morning Room',
    category: '早午餐',
    rating: 4.9,
    eta: '25-35 分鐘',
    fee: 0,
    distance: '2.1 km',
    cover: 'linear-gradient(135deg,#84fab0,#8fd3f4)',
    description: '網美風早午餐，適合悠閒週末',
    dishes: [
      { id: 'brunch-1', name: '嫩蛋酪梨吐司', price: 180, description: '清爽健康' },
      { id: 'brunch-2', name: '煙燻鮭魚貝果', price: 210, description: '經典組合' },
      { id: 'brunch-3', name: '蜂蜜優格碗', price: 150, description: '水果燕麥' },
      { id: 'brunch-4', name: '美式經典早餐', price: 195, description: '蛋、培根、薯餅、吐司' },
      { id: 'brunch-5', name: '法式吐司套餐', price: 185, description: '楓糖、奶油、水果' }
    ]
  },
  {
    id: 'sunny-brunch',
    name: '陽光早午餐',
    category: '早午餐',
    rating: 4.7,
    eta: '20-30 分鐘',
    fee: 0,
    distance: '1.5 km',
    cover: 'linear-gradient(135deg,#f5af19,#f12711)',
    description: '活力滿滿的一天從這裡開始',
    dishes: [
      { id: 'sb-1', name: '班尼迪克蛋', price: 195, description: '荷蘭醬、火腿、英式馬芬' },
      { id: 'sb-2', name: '歐姆蛋套餐', price: 175, description: '起司、蘑菇、番茄' },
      { id: 'sb-3', name: '鬆餅組合', price: 165, description: '藍莓、奶油、楓糖' }
    ]
  },
  // 炸物類
  {
    id: 'crispy-lab',
    name: '酥炸研究室',
    category: '炸物',
    rating: 4.6,
    eta: '15-25 分鐘',
    fee: 20,
    distance: '0.9 km',
    cover: 'linear-gradient(135deg,#f093fb,#f5576c)',
    description: '獨家麵衣配方，酥脆不油膩',
    dishes: [
      { id: 'fried-1', name: '無骨鹽酥雞', price: 95, description: '小份' },
      { id: 'fried-2', name: '黃金地瓜條', price: 70, description: '香甜酥脆' },
      { id: 'fried-3', name: '酥炸杏鮑菇', price: 80, description: '素食可食' },
      { id: 'fried-4', name: '炸雞排', price: 85, description: '招牌商品' },
      { id: 'fried-5', name: '甜不辣', price: 60, description: '經典台式' }
    ]
  },
  {
    id: 'korean-fried',
    name: '韓式炸雞屋',
    category: '炸物',
    rating: 4.8,
    eta: '25-35 分鐘',
    fee: 25,
    distance: '1.8 km',
    cover: 'linear-gradient(135deg,#ff416c,#ff4b2b)',
    description: '道地韓式炸雞，多種口味',
    dishes: [
      { id: 'kf-1', name: '韓式炸雞(原味)', price: 280, description: '8塊' },
      { id: 'kf-2', name: '韓式炸雞(辣味)', price: 280, description: '8塊' },
      { id: 'kf-3', name: '韓式炸雞(蜂蜜)', price: 290, description: '8塊' },
      { id: 'kf-4', name: '起司炸雞', price: 310, description: '8塊，起司粉' }
    ]
  },
  // 麵食類
  {
    id: 'soul-noodle',
    name: '麵魂 SOUL Noodle',
    category: '麵食',
    rating: 4.7,
    eta: '20-30 分鐘',
    fee: 10,
    distance: '1.8 km',
    cover: 'linear-gradient(135deg,#f6d365,#fda085)',
    description: '手工拉麵，湯頭濃郁',
    dishes: [
      { id: 'noodle-1', name: '紅燒牛肉麵', price: 210, description: '招牌必點' },
      { id: 'noodle-2', name: '麻醬拌麵', price: 130, description: '香濃芝麻醬' },
      { id: 'noodle-3', name: '炸醬麵', price: 120, description: '傳統口味' },
      { id: 'noodle-4', name: '擔擔麵', price: 145, description: '微辣' },
      { id: 'noodle-5', name: '酸辣麵', price: 135, description: '開胃首選' }
    ]
  },
  {
    id: 'ramen-master',
    name: '拉麵職人',
    category: '麵食',
    rating: 4.9,
    eta: '25-35 分鐘',
    fee: 15,
    distance: '2.3 km',
    cover: 'linear-gradient(135deg,#3a1c71,#d76d77)',
    description: '日本職人精神，每日限量湯頭',
    dishes: [
      { id: 'rm-1', name: '豚骨拉麵', price: 220, description: '濃厚豚骨湯' },
      { id: 'rm-2', name: '味噌拉麵', price: 210, description: '北海道風味' },
      { id: 'rm-3', name: '醬油拉麵', price: 200, description: '清爽湯頭' },
      { id: 'rm-4', name: '辣味噌拉麵', price: 230, description: '辛香夠味' }
    ]
  },
  // 甜點類
  {
    id: 'sugar-cloud',
    name: '糖霧甜點店',
    category: '甜點',
    rating: 4.5,
    eta: '20-30 分鐘',
    fee: 25,
    distance: '2.6 km',
    cover: 'linear-gradient(135deg,#fbc2eb,#a6c1ee)',
    description: '法式甜點，精緻美味',
    dishes: [
      { id: 'dessert-1', name: '海鹽焦糖生乳卷', price: 140, description: '招牌必點' },
      { id: 'dessert-2', name: '提拉米蘇盒子', price: 160, description: '義式經典' },
      { id: 'dessert-3', name: '草莓奶酪', price: 120, description: '新鮮草莓' },
      { id: 'dessert-4', name: '抹茶千層', price: 180, description: '日本抹茶' },
      { id: 'dessert-5', name: '芒果慕斯', price: 150, description: '季節限定' }
    ]
  },
  {
    id: 'sweet-dream',
    name: '甜夢烘焙坊',
    category: '甜點',
    rating: 4.7,
    eta: '15-25 分鐘',
    fee: 20,
    distance: '1.2 km',
    cover: 'linear-gradient(135deg,#ffecd2,#fcb69f)',
    description: '每日現烤，香氣四溢',
    dishes: [
      { id: 'sd-1', name: '可頌', price: 55, description: '酥脆奶香' },
      { id: 'sd-2', name: '巧克力丹麥', price: 65, description: '濃郁巧克力' },
      { id: 'sd-3', name: '肉桂捲', price: 75, description: '香氣迷人' },
      { id: 'sd-4', name: '戚風蛋糕', price: 180, description: '6吋' }
    ]
  },
  // 飲料類
  {
    id: 'tea-wave',
    name: '茶浪 Tea Wave',
    category: '飲料',
    rating: 4.7,
    eta: '10-18 分鐘',
    fee: 0,
    distance: '0.7 km',
    cover: 'linear-gradient(135deg,#a1c4fd,#c2e9fb)',
    description: '手搖飲料，新鮮現泡',
    dishes: [
      { id: 'drink-1', name: '黑糖珍珠鮮奶', price: 75, description: '招牌必點' },
      { id: 'drink-2', name: '青檸四季春', price: 65, description: '清爽解渴' },
      { id: 'drink-3', name: '焙茶拿鐵', price: 90, description: '濃郁茶香' },
      { id: 'drink-4', name: '芋頭鮮奶', price: 85, description: '真材實料' },
      { id: 'drink-5', name: '葡萄柚綠茶', price: 70, description: '酸甜好滋味' }
    ]
  },
  {
    id: 'coffee-lab',
    name: '咖啡實驗室',
    category: '飲料',
    rating: 4.8,
    eta: '15-25 分鐘',
    fee: 0,
    distance: '1.1 km',
    cover: 'linear-gradient(135deg,#4e342e,#795548)',
    description: '精品咖啡，專業沖煮',
    dishes: [
      { id: 'cl-1', name: '美式咖啡', price: 95, description: '中焙' },
      { id: 'cl-2', name: '拿鐵', price: 115, description: '香醇濃郁' },
      { id: 'cl-3', name: '卡布奇諾', price: 120, description: '綿密奶泡' },
      { id: 'cl-4', name: '摩卡', price: 135, description: '巧克力風味' },
      { id: 'cl-5', name: '冰滴咖啡', price: 150, description: '限量供應' }
    ]
  },
  // 日式類
  {
    id: 'sushi-master',
    name: '壽司職人',
    category: '日式',
    rating: 4.8,
    eta: '25-35 分鐘',
    fee: 20,
    distance: '1.5 km',
    cover: 'linear-gradient(135deg,#ff6b6b,#feca57)',
    description: '新鮮漁獲，職人手藝',
    dishes: [
      { id: 'sushi-1', name: '綜合握壽司', price: 320, description: '8貫' },
      { id: 'sushi-2', name: '鮭魚握壽司', price: 180, description: '6貫' },
      { id: 'sushi-3', name: '散壽司', price: 280, description: '多種魚料' },
      { id: 'sushi-4', name: '鰻魚飯', price: 350, description: '蒲燒鰻魚' }
    ]
  },
  {
    id: 'donburi-house',
    name: '丼飯屋',
    category: '日式',
    rating: 4.6,
    eta: '20-30 分鐘',
    fee: 15,
    distance: '1.2 km',
    cover: 'linear-gradient(135deg,#2d3436,#636e72)',
    description: '大碗滿足，日式丼飯',
    dishes: [
      { id: 'don-1', name: '牛丼', price: 160, description: '經典口味' },
      { id: 'don-2', name: '親子丼', price: 170, description: '雞肉滑蛋' },
      { id: 'don-3', name: '豬排丼', price: 185, description: '酥炸豬排' },
      { id: 'don-4', name: '天婦羅丼', price: 220, description: '炸物拼盤' }
    ]
  },
  // 韓式類
  {
    id: 'seoul-kitchen',
    name: '首爾廚房',
    category: '韓式',
    rating: 4.7,
    eta: '25-35 分鐘',
    fee: 20,
    distance: '1.8 km',
    cover: 'linear-gradient(135deg,#c0392b,#e74c3c)',
    description: '道地韓式料理',
    dishes: [
      { id: 'sk-1', name: '韓式烤肉便當', price: 220, description: '銅盤烤肉風味' },
      { id: 'sk-2', name: '泡菜炒飯', price: 160, description: '酸辣開胃' },
      { id: 'sk-3', name: '海鮮煎餅', price: 180, description: '酥脆外皮' },
      { id: 'sk-4', name: '石鍋拌飯', price: 190, description: '多種配菜' },
      { id: 'sk-5', name: '部隊鍋', price: 320, description: '2人份' }
    ]
  },
  {
    id: 'korean-bbq',
    name: '韓式烤肉店',
    category: '韓式',
    rating: 4.5,
    eta: '30-40 分鐘',
    fee: 30,
    distance: '2.5 km',
    cover: 'linear-gradient(135deg,#8e44ad,#9b59b6)',
    description: '正宗韓式烤肉',
    dishes: [
      { id: 'kb-1', name: '五花肉套餐', price: 450, description: '2人份' },
      { id: 'kb-2', name: '牛小排套餐', price: 580, description: '2人份' },
      { id: 'kb-3', name: '綜合烤肉', price: 680, description: '3人份' }
    ]
  },
  // 美式類
  {
    id: 'burger-joint',
    name: '漢堡工坊',
    category: '美式',
    rating: 4.6,
    eta: '20-30 分鐘',
    fee: 15,
    distance: '1.4 km',
    cover: 'linear-gradient(135deg,#f39c12,#e67e22)',
    description: '手工漢堡，多汁美味',
    dishes: [
      { id: 'bj-1', name: '經典牛肉漢堡', price: 165, description: '招牌必點' },
      { id: 'bj-2', name: '起司培根漢堡', price: 185, description: '濃郁起司' },
      { id: 'bj-3', name: '雞腿漢堡', price: 155, description: '酥炸雞腿' },
      { id: 'bj-4', name: '薯條', price: 65, description: '大份' }
    ]
  },
  {
    id: 'pizza-factory',
    name: '披薩工廠',
    category: '美式',
    rating: 4.5,
    eta: '30-40 分鐘',
    fee: 25,
    distance: '2.0 km',
    cover: 'linear-gradient(135deg,#27ae60,#2ecc71)',
    description: '手工披薩，現點現烤',
    dishes: [
      { id: 'pf-1', name: '瑪格麗特披薩', price: 280, description: '9吋' },
      { id: 'pf-2', name: '夏威夷披薩', price: 300, description: '9吋' },
      { id: 'pf-3', name: '海鮮披薩', price: 340, description: '9吋' },
      { id: 'pf-4', name: '綜合披薩', price: 320, description: '9吋' }
    ]
  },
  // 義式類
  {
    id: 'pasta-house',
    name: '義大利麵屋',
    category: '義式',
    rating: 4.7,
    eta: '25-35 分鐘',
    fee: 20,
    distance: '1.6 km',
    cover: 'linear-gradient(135deg,#16a085,#1abc9c)',
    description: '道地義式風味',
    dishes: [
      { id: 'ph-1', name: '奶油培根義大利麵', price: 195, description: '經典口味' },
      { id: 'ph-2', name: '番茄肉醬義大利麵', price: 185, description: '酸甜番茄' },
      { id: 'ph-3', name: '海鮮義大利麵', price: 245, description: '多種海鮮' },
      { id: 'ph-4', name: '青醬雞肉義大利麵', price: 215, description: '羅勒青醬' }
    ]
  },
  {
    id: 'risotto-lab',
    name: '燉飯實驗室',
    category: '義式',
    rating: 4.6,
    eta: '30-40 分鐘',
    fee: 25,
    distance: '2.2 km',
    cover: 'linear-gradient(135deg,#f1c40f,#f39c12)',
    description: '米蘭風味燉飯',
    dishes: [
      { id: 'rl-1', name: '松露野菇燉飯', price: 280, description: '香氣迷人' },
      { id: 'rl-2', name: '海鮮燉飯', price: 260, description: '鮮美海味' },
      { id: 'rl-3', name: '米蘭燉飯', price: 220, description: '經典口味' }
    ]
  },
  // 泰式類
  {
    id: 'thai-kitchen',
    name: '泰式小館',
    category: '泰式',
    rating: 4.6,
    eta: '25-35 分鐘',
    fee: 20,
    distance: '1.7 km',
    cover: 'linear-gradient(135deg,#e74c3c,#c0392b)',
    description: '酸辣夠味，泰式風情',
    dishes: [
      { id: 'tk-1', name: '打拋豬肉飯', price: 165, description: '香辣下飯' },
      { id: 'tk-2', name: '綠咖哩雞飯', price: 175, description: '濃郁椰香' },
      { id: 'tk-3', name: '泰式炒河粉', price: 155, description: '經典料理' },
      { id: 'tk-4', name: '酸辣海鮮湯', price: 220, description: '冬陰功' }
    ]
  },
  {
    id: 'pad-thai',
    name: '泰式河粉專賣',
    category: '泰式',
    rating: 4.5,
    eta: '20-30 分鐘',
    fee: 15,
    distance: '1.3 km',
    cover: 'linear-gradient(135deg,#d35400,#e67e22)',
    description: '現炒河粉，香氣十足',
    dishes: [
      { id: 'pt-1', name: '泰式炒河粉(豬肉)', price: 145, description: '經典口味' },
      { id: 'pt-2', name: '泰式炒河粉(海鮮)', price: 175, description: '多種海鮮' },
      { id: 'pt-3', name: '泰式炒河粉(雞肉)', price: 145, description: '嫩滑雞肉' }
    ]
  },
  // 港式類
  {
    id: 'hk-dim-sum',
    name: '港式飲茶',
    category: '港式',
    rating: 4.7,
    eta: '25-35 分鐘',
    fee: 20,
    distance: '1.9 km',
    cover: 'linear-gradient(135deg,#34495e,#2c3e50)',
    description: '正宗港式點心',
    dishes: [
      { id: 'hk-1', name: '蝦仁燒賣', price: 95, description: '4顆' },
      { id: 'hk-2', name: '叉燒包', price: 75, description: '3顆' },
      { id: 'hk-3', name: '蝦餃', price: 95, description: '4顆' },
      { id: 'hk-4', name: '腸粉', price: 85, description: '鮮蝦/牛肉' },
      { id: 'hk-5', name: '港式蘿蔔糕', price: 70, description: '外酥內軟' }
    ]
  },
  {
    id: 'hk-cafe',
    name: '港式茶餐廳',
    category: '港式',
    rating: 4.4,
    eta: '20-30 分鐘',
    fee: 15,
    distance: '1.5 km',
    cover: 'linear-gradient(135deg,#7f8c8d,#95a5a6)',
    description: '懷舊茶餐廳風味',
    dishes: [
      { id: 'hc-1', name: '乾炒牛河', price: 145, description: '鑊氣十足' },
      { id: 'hc-2', name: '叉燒飯', price: 125, description: '蜜汁叉燒' },
      { id: 'hc-3', name: '絲襪奶茶', price: 55, description: '香滑濃郁' },
      { id: 'hc-4', name: '菠蘿油', price: 45, description: '酥脆外皮' }
    ]
  },
  // 火鍋類
  {
    id: 'hotpot-master',
    name: '火鍋達人',
    category: '火鍋',
    rating: 4.8,
    eta: '35-45 分鐘',
    fee: 30,
    distance: '2.8 km',
    cover: 'linear-gradient(135deg,#c0392b,#e74c3c)',
    description: '各式湯底，新鮮食材',
    dishes: [
      { id: 'hp-1', name: '麻辣鍋(2人份)', price: 580, description: '香麻夠勁' },
      { id: 'hp-2', name: '酸菜白肉鍋(2人份)', price: 520, description: '酸香開胃' },
      { id: 'hp-3', name: '壽喜燒(2人份)', price: 480, description: '日式風味' },
      { id: 'hp-4', name: '個人小火鍋', price: 220, description: '單人獨享' }
    ]
  },
  {
    id: 'shabu-shabu',
    name: '涮涮鍋專賣',
    category: '火鍋',
    rating: 4.6,
    eta: '30-40 分鐘',
    fee: 25,
    distance: '2.3 km',
    cover: 'linear-gradient(135deg,#9b59b6,#8e44ad)',
    description: '個人鍋物，精緻享受',
    dishes: [
      { id: 'ss-1', name: '牛肉涮涮鍋', price: 280, description: '美國牛' },
      { id: 'ss-2', name: '豬肉涮涮鍋', price: 230, description: '台灣豬' },
      { id: 'ss-3', name: '海鮮涮涮鍋', price: 320, description: '多種海鮮' },
      { id: 'ss-4', name: '蔬菜鍋', price: 200, description: '素食可食' }
    ]
  },
  // 燒烤類
  {
    id: 'bbq-house',
    name: '燒烤屋',
    category: '燒烤',
    rating: 4.5,
    eta: '30-40 分鐘',
    fee: 30,
    distance: '2.5 km',
    cover: 'linear-gradient(135deg,#d35400,#e74c3c)',
    description: '炭火燒烤，香氣四溢',
    dishes: [
      { id: 'bbq-1', name: '綜合烤串(10串)', price: 350, description: '多種口味' },
      { id: 'bbq-2', name: '烤雞翅(6支)', price: 180, description: '蜜汁風味' },
      { id: 'bbq-3', name: '烤玉米', price: 60, description: '奶油香' },
      { id: 'bbq-4', name: '烤甜不辣', price: 50, description: '經典台式' }
    ]
  },
  // 咖啡廳類
  {
    id: 'cozy-cafe',
    name: '溫馨咖啡館',
    category: '咖啡',
    rating: 4.8,
    eta: '15-25 分鐘',
    fee: 0,
    distance: '0.9 km',
    cover: 'linear-gradient(135deg,#6c5ce7,#a29bfe)',
    description: '悠閒午後，香醇咖啡',
    dishes: [
      { id: 'cc-1', name: '手沖咖啡', price: 120, description: '單品豆' },
      { id: 'cc-2', name: '焦糖瑪奇朵', price: 135, description: '香甜濃郁' },
      { id: 'cc-3', name: '提拉米蘇', price: 150, description: '招牌甜點' },
      { id: 'cc-4', name: '起司蛋糕', price: 120, description: '濃郁綿密' }
    ]
  }
];

// 根據地區生成推薦餐廳
function getStoresByDistrict(city, district) {
  const cityLower = city.toLowerCase();
  
  // 判斷地區
  const regionConfig = detectRegion(cityLower);
  
  const seed = (city + district).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const shuffled = [...allStores].sort((a, b) => {
    const aVal = (seed * a.id.length) % 100;
    const bVal = (seed * b.id.length) % 100;
    return bVal - aVal;
  });
  
  const count = 8 + (seed % 5);
  const selectedStores = shuffled.slice(0, count);
  
  return selectedStores.map((store, idx) => {
    const localizedStore = localizeStore(store, regionConfig, idx);
    return {
      ...localizedStore,
      distance: `${(0.5 + idx * 0.4).toFixed(1)} km`,
      eta: `${15 + idx * 3}-${25 + idx * 3} ${regionConfig.timeUnit}`,
      fee: idx < 2 ? 0 : Math.round((10 + idx * 3) * regionConfig.priceMultiplier)
    };
  });
}

function detectRegion(cityLower) {
  // 日本城市
  const japanCities = ['東京', 'tokyo', '大阪', 'osaka', '京都', 'kyoto', '橫濱', 'yokohama', '名古屋', 'nagoya', '札幌', 'sapporo', '福岡', 'fukuoka', '澀谷', 'shibuya', '新宿', 'shinjuku'];
  // 韓國城市
  const koreaCities = ['首爾', 'seoul', '釜山', 'busan', '仁川', 'incheon', '大邱', 'daegu', '大田', 'daejeon'];
  // 美國城市
  const usCities = ['紐約', 'new york', '洛杉磯', 'los angeles', 'la', '舊金山', 'san francisco', '西雅圖', 'seattle', '芝加哥', 'chicago', '休士頓', 'houston'];
  // 英國城市
  const ukCities = ['倫敦', 'london', '曼徹斯特', 'manchester', '伯明翰', 'birmingham', '利物浦', 'liverpool'];
  // 法國城市
  const franceCities = ['巴黎', 'paris', '里昂', 'lyon', '馬賽', 'marseille'];
  // 泰國城市
  const thailandCities = ['曼谷', 'bangkok', '清邗', 'chiang mai', '普吉', 'phuket'];
  // 越南城市
  const vietnamCities = ['河內', 'hanoi', '胡志明', 'ho chi minh', '峴港', 'da nang'];
  // 香港城市
  const hkCities = ['香港', 'hong kong', 'hongkong', 'hk', '九龍', 'kowloon'];
  // 中國城市
  const chinaCities = ['上海', 'shanghai', '北京', 'beijing', '廣州', 'guangzhou', '深圳', 'shenzhen', '成都', 'chengdu', '杭州', 'hangzhou'];
  // 新加坡
  const sgCities = ['新加坡', 'singapore', 'sg'];
  // 馬來西亞
  const myCities = ['吉隆坡', 'kuala lumpur', '檳城', 'penang'];
  
  if (japanCities.some(c => cityLower.includes(c))) {
    return { region: 'japan', currency: '¥', priceMultiplier: 4, lang: 'ja', timeUnit: '分' };
  }
  if (koreaCities.some(c => cityLower.includes(c))) {
    return { region: 'korea', currency: '₩', priceMultiplier: 35, lang: 'ko', timeUnit: '분' };
  }
  if (usCities.some(c => cityLower.includes(c))) {
    return { region: 'us', currency: '$', priceMultiplier: 0.03, lang: 'en', timeUnit: 'min' };
  }
  if (ukCities.some(c => cityLower.includes(c))) {
    return { region: 'uk', currency: '£', priceMultiplier: 0.025, lang: 'en', timeUnit: 'min' };
  }
  if (franceCities.some(c => cityLower.includes(c))) {
    return { region: 'france', currency: '€', priceMultiplier: 0.03, lang: 'fr', timeUnit: 'min' };
  }
  if (thailandCities.some(c => cityLower.includes(c))) {
    return { region: 'thailand', currency: '฿', priceMultiplier: 1, lang: 'th', timeUnit: 'นาที' };
  }
  if (vietnamCities.some(c => cityLower.includes(c))) {
    return { region: 'vietnam', currency: '₫', priceMultiplier: 750, lang: 'vi', timeUnit: 'phút' };
  }
  if (hkCities.some(c => cityLower.includes(c))) {
    return { region: 'hongkong', currency: 'HK$', priceMultiplier: 0.25, lang: 'zh-hk', timeUnit: '分鐘' };
  }
  if (chinaCities.some(c => cityLower.includes(c))) {
    return { region: 'china', currency: '¥', priceMultiplier: 0.23, lang: 'zh-cn', timeUnit: '分钟' };
  }
  if (sgCities.some(c => cityLower.includes(c))) {
    return { region: 'singapore', currency: 'S$', priceMultiplier: 0.04, lang: 'en', timeUnit: 'min' };
  }
  if (myCities.some(c => cityLower.includes(c))) {
    return { region: 'malaysia', currency: 'RM', priceMultiplier: 0.15, lang: 'ms', timeUnit: 'minit' };
  }
  
  // 預設台灣
  return { region: 'taiwan', currency: 'NT$', priceMultiplier: 1, lang: 'zh-tw', timeUnit: '分鐘' };
}

function localizeStore(store, regionConfig, index) {
  const { region, currency, priceMultiplier, lang } = regionConfig;
  
  // 地區特定的餐廳名稱翻譯
  const storeNames = {
    japan: {
      '台北便當研究所': '台北弁当研究所',
      '農家便當屋': '農家弁当屋',
      '晨間房間 Morning Room': 'モーニングルーム',
      '陽光早午餐': 'サニーブランチ',
      '酥炸研究室': 'フライ研究所',
      '韓式炸雞屋': '韓国風フライドチキン',
      '麵魂 SOUL Noodle': '麺魂',
      '拉麵職人': 'ラーメン職人',
      '糖霧甜點店': 'シュガーミスト',
      '甜夢烘焙坊': 'スイートドリーム',
      '茶浪 Tea Wave': '茶波',
      '咖啡實驗室': 'コーヒー研究所',
      '壽司職人': '寿司職人',
      '丼飯屋': '丼屋',
      '首爾廚房': 'ソウルキッチン',
      '韓式烤肉店': '韓国焼肉店',
      '漢堡工坊': 'バーガーワークス',
      '披薩工廠': 'ピザファクトリー',
      '義大利麵屋': 'パスタハウス',
      '燉飯實驗室': 'リゾット研究所',
      '泰式小館': 'タイ料理店',
      '泰式河粉專賣': 'タイ風麺専門店',
      '港式飲茶': '広東式飲茶',
      '港式茶餐廳': '香港茶餐廳',
      '火鍋達人': '火鍋達人',
      '涮涮鍋專賣': 'しゃぶしゃぶ専門店',
      '燒烤屋': '焼肉屋',
      '溫馨咖啡館': '居心地の良いカフェ'
    },
    korea: {
      '台北便當研究所': '타이페이 도시락 연구소',
      '農家便當屋': '농가 도시락집',
      '晨間房間 Morning Room': '모닝룸',
      '陽光早午餐': '써니 브런치',
      '酥炸研究室': '튀김 연구소',
      '韓式炸雞屋': '한식 치킨집',
      '麵魂 SOUL Noodle': '면혼',
      '拉麵職人': '라멘 장인',
      '糖霧甜點店': '슈가 미스트',
      '甜夢烘焙坊': '스위트 드림',
      '茶浪 Tea Wave': '티웨이브',
      '咖啡實驗室': '커피 연구소',
      '壽司職人': '스시 장인',
      '丼飯屋': '돈부리집',
      '首爾廚房': '서울 키친',
      '韓式烤肉店': '한식 고기집',
      '漢堡工坊': '버거 웍스',
      '披薩工廠': '피자 팩토리',
      '義大利麵屋': '파스타 하우스',
      '燉飯實驗室': '리조또 연구소',
      '泰式小館': '타이 레스토랑',
      '泰式河粉專賣': '타이 국수 전문점',
      '港式飲茶': '홍콩식 딤섬',
      '港式茶餐廳': '홍콩 차집',
      '火鍋達人': '훠궈 달인',
      '涮涮鍋專賣': '샤브샤브 전문점',
      '燒烤屋': '구이집',
      '溫馨咖啡館': '아늑한 카페'
    },
    us: {
      '台北便當研究所': 'Taipei Bento Lab',
      '農家便當屋': 'Farm Bento House',
      '晨間房間 Morning Room': 'Morning Room',
      '陽光早午餐': 'Sunny Brunch',
      '酥炸研究室': 'Crispy Lab',
      '韓式炸雞屋': 'Korean Fried Chicken',
      '麵魂 SOUL Noodle': 'Soul Noodle',
      '拉麵職人': 'Ramen Master',
      '糖霧甜點店': 'Sugar Cloud Desserts',
      '甜夢烘焙坊': 'Sweet Dream Bakery',
      '茶浪 Tea Wave': 'Tea Wave',
      '咖啡實驗室': 'Coffee Lab',
      '壽司職人': 'Sushi Master',
      '丼飯屋': 'Donburi House',
      '首爾廚房': 'Seoul Kitchen',
      '韓式烤肉店': 'Korean BBQ House',
      '漢堡工坊': 'Burger Joint',
      '披薩工廠': 'Pizza Factory',
      '義大利麵屋': 'Pasta House',
      '燉飯實驗室': 'Risotto Lab',
      '泰式小館': 'Thai Kitchen',
      '泰式河粉專賣': 'Pad Thai Shop',
      '港式飲茶': 'Hong Kong Dim Sum',
      '港式茶餐廳': 'HK Cafe',
      '火鍋達人': 'Hotpot Master',
      '涮涮鍋專賣': 'Shabu Shabu',
      '燒烤屋': 'BBQ House',
      '溫馨咖啡館': 'Cozy Cafe'
    },
    thailand: {
      '台北便當研究所': 'ไทเป เบนโตะ',
      '農家便當屋': 'บ้านข้าวกล่อง',
      '晨間房間 Morning Room': 'ห้องอาหารเช้า',
      '陽光早午餐': 'ซันนี่ บรันช์',
      '酥炸研究室': 'ร้านทอด',
      '韓式炸雞屋': 'ไก่ทอดเกาหลี',
      '麵魂 SOUL Noodle': 'ซูล นู้ดเดิ้ล',
      '拉麵職人': 'ราเมงมาสเตอร์',
      '糖霧甜點店': 'ชูการ์ คลาวด์',
      '甜夢烘焙坊': 'เบเกอรี่',
      '茶浪 Tea Wave': 'ที เวฟ',
      '咖啡實驗室': 'คอฟฟี่ แล็บ',
      '壽司職人': 'ซูชิมาสเตอร์',
      '丼飯屋': 'ดงบุริ',
      '首爾廚房': 'โซล คิทเช่น',
      '韓式烤肉店': 'บาร์บีคิวเกาหลี',
      '漢堡工坊': 'เบอร์เกอร์',
      '披薩工廠': 'พิซซ่าแฟคตอรี่',
      '義大利麵屋': 'พาสต้า เฮาส์',
      '燉飯實驗室': 'ริซอตโต้ แล็บ',
      '泰式小館': 'อาหารไทย',
      '泰式河粉專賣': 'ผัดไทย',
      '港式飲茶': 'ติ่มซำฮ่องกง',
      '港式茶餐廳': 'ชาฮ่องกง',
      '火鍋達人': 'หม้อไฟ',
      '涮涮鍋專賣': 'ชาบูชาบู',
      '燒烤屋': 'บาร์บีคิว',
      '溫馨咖啡館': 'คาเฟ่อบอุ่น'
    },
    hongkong: {
      '台北便當研究所': '台北飯盒研究所',
      '農家便當屋': '農家飯盒屋',
      '晨間房間 Morning Room': '晨間房間',
      '陽光早午餐': '陽光早午餐',
      '酥炸研究室': '酥炸研究室',
      '韓式炸雞屋': '韓式炸雞屋',
      '麵魂 SOUL Noodle': '麵魂',
      '拉麵職人': '拉麵職人',
      '糖霧甜點店': '糖霧甜點店',
      '甜夢烘焙坊': '甜夢烘焙坊',
      '茶浪 Tea Wave': '茶浪',
      '咖啡實驗室': '咖啡實驗室',
      '壽司職人': '壽司職人',
      '丼飯屋': '丼飯屋',
      '首爾廚房': '首爾廚房',
      '韓式烤肉店': '韓式烤肉店',
      '漢堡工坊': '漢堡工坊',
      '披薩工廠': '披薩工廠',
      '義大利麵屋': '意大利麵屋',
      '燉飯實驗室': '燉飯實驗室',
      '泰式小館': '泰式小館',
      '泰式河粉專賣': '泰式河粉專賣',
      '港式飲茶': '港式飲茶',
      '港式茶餐廳': '港式茶餐廳',
      '火鍋達人': '火鍋達人',
      '涮涮鍋專賣': '涮涮鍋專賣',
      '燒烤屋': '燒烤屋',
      '溫馨咖啡館': '溫馨咖啡館'
    },
    china: {
      '台北便當研究所': '台北便当研究所',
      '農家便當屋': '农家便当屋',
      '晨間房間 Morning Room': '晨间房间',
      '陽光早午餐': '阳光早午餐',
      '酥炸研究室': '酥炸研究室',
      '韓式炸雞屋': '韩式炸鸡屋',
      '麵魂 SOUL Noodle': '面魂',
      '拉麵職人': '拉面职人',
      '糖霧甜點店': '糖雾甜品店',
      '甜夢烘焙坊': '甜梦烘焙坊',
      '茶浪 Tea Wave': '茶浪',
      '咖啡實驗室': '咖啡实验室',
      '壽司職人': '寿司职人',
      '丼飯屋': '盖饭店',
      '首爾廚房': '首尔厨房',
      '韓式烤肉店': '韩式烤肉店',
      '漢堡工坊': '汉堡工坊',
      '披薩工廠': '披萨工厂',
      '義大利麵屋': '意大利面屋',
      '燉飯實驗室': '炖饭实验室',
      '泰式小館': '泰式小馆',
      '泰式河粉專賣': '泰式河粉专卖',
      '港式飲茶': '港式饮茶',
      '港式茶餐廳': '港式茶餐厅',
      '火鍋達人': '火锅达人',
      '涮涮鍋專賣': '涮涮锅专卖',
      '燒烤屋': '烧烤屋',
      '溫馨咖啡館': '温馨咖啡馆'
    },
    vietnam: {
      '台北便當研究所': 'Bento Đài Bắc',
      '農家便當屋': 'Cơm hộp nông gia',
      '晨間房間 Morning Room': 'Phòng Sáng',
      '陽光早午餐': 'Brunch Nắng',
      '酥炸研究室': 'Tiệm Chiên',
      '韓式炸雞屋': 'Gà rán Hàn Quốc',
      '麵魂 SOUL Noodle': 'Mì Soul',
      '拉麵職人': 'Bậc thầy Ramen',
      '糖霧甜點店': 'Tiệm bánh ngọt',
      '甜夢烘焙坊': 'Tiệm bánh Sweet Dream',
      '茶浪 Tea Wave': 'Trà Wave',
      '咖啡實驗室': 'Phòng thí nghiệm Cà phê',
      '壽司職人': 'Bậc thầy Sushi',
      '丼飯屋': 'Tiệm Donburi',
      '首爾廚房': 'Bếp Seoul',
      '韓式烤肉店': 'BBQ Hàn Quốc',
      '漢堡工坊': 'Tiệm Burger',
      '披薩工廠': 'Nhà máy Pizza',
      '義大利麵屋': 'Tiệm Pasta',
      '燉飯實驗室': 'Phòng thí nghiệm Risotto',
      '泰式小館': 'Quán Thái',
      '泰式河粉專賣': 'Tiệm Pad Thái',
      '港式飲茶': 'Dim Sum Hồng Kông',
      '港式茶餐廳': 'Quán trà Hồng Kông',
      '火鍋達人': 'Bậc thầy Lẩu',
      '涮涮鍋專賣': 'Tiệm Shabu Shabu',
      '燒烤屋': 'Tiệm BBQ',
      '溫馨咖啡館': 'Quán cà phê ấm cúng'
    },
    singapore: {
      '台北便當研究所': 'Taipei Bento Lab',
      '農家便當屋': 'Farm Bento House',
      '晨間房間 Morning Room': 'Morning Room',
      '陽光早午餐': 'Sunny Brunch',
      '酥炸研究室': 'Crispy Lab',
      '韓式炸雞屋': 'Korean Fried Chicken',
      '麵魂 SOUL Noodle': 'Soul Noodle',
      '拉麵職人': 'Ramen Master',
      '糖霧甜點店': 'Sugar Cloud Desserts',
      '甜夢烘焙坊': 'Sweet Dream Bakery',
      '茶浪 Tea Wave': 'Tea Wave',
      '咖啡實驗室': 'Coffee Lab',
      '壽司職人': 'Sushi Master',
      '丼飯屋': 'Donburi House',
      '首爾廚房': 'Seoul Kitchen',
      '韓式烤肉店': 'Korean BBQ House',
      '漢堡工坊': 'Burger Joint',
      '披薩工廠': 'Pizza Factory',
      '義大利麵屋': 'Pasta House',
      '燉飯實驗室': 'Risotto Lab',
      '泰式小館': 'Thai Kitchen',
      '泰式河粉專賣': 'Pad Thai Shop',
      '港式飲茶': 'Hong Kong Dim Sum',
      '港式茶餐廳': 'HK Cafe',
      '火鍋達人': 'Hotpot Master',
      '涮涮鍋專賣': 'Shabu Shabu',
      '燒烤屋': 'BBQ House',
      '溫馨咖啡館': 'Cozy Cafe'
    }
  };
  
  // 地區特定的餐點名稱翻譯
  const dishNames = {
    japan: {
      '炙燒雞腿便當': '炙りチキン弁当',
      '椒鹽排骨便當': '胡椒塩排骨弁当',
      '香煎鮭魚便當': '焼き鮭弁当',
      '滷雞腿便當': '照り焼きチキン弁当',
      '素食養生便當': 'ベジタリアン弁当',
      '古早味排骨便當': '昔ながらの排骨弁当',
      '爌肉便當': '角煮弁当',
      '雞排便當': 'チキンカツ弁当',
      '嫩蛋酪梨吐司': 'アボカドエッグトースト',
      '煙燻鮭魚貝果': 'スモークサーモンベーグル',
      '蜂蜜優格碗': 'ハニーヨーグルトボウル',
      '美式經典早餐': 'アメリカンブレックファスト',
      '法式吐司套餐': 'フレンチトーストセット',
      '班尼迪克蛋': 'エッグベネディクト',
      '歐姆蛋套餐': 'オムレツセット',
      '鬆餅組合': 'パンケーキセット',
      '無骨鹽酥雞': '骨なし塩胡椒チキン',
      '黃金地瓜條': '黄金さつまいもフライ',
      '酥炸杏鮑菇': 'エリンギの天ぷら',
      '炸雞排': 'チキンカツ',
      '甜不辣': '天ぷら',
      '韓式炸雞(原味)': '韓国風フライドチキン（プレーン）',
      '韓式炸雞(辣味)': '韓国風フライドチキン（辛口）',
      '韓式炸雞(蜂蜜)': '韓国風フライドチキン（はちみつ）',
      '起司炸雞': 'チーズフライドチキン',
      '紅燒牛肉麵': '紅焼牛肉麺',
      '麻醬拌麵': '胡麻和え麺',
      '炸醬麵': 'ジャージャー麺',
      '擔擔麵': '担々麺',
      '酸辣麵': '酸辣麺',
      '豚骨拉麵': '豚骨ラーメン',
      '味噌拉麵': '味噌ラーメン',
      '醬油拉麵': '醤油ラーメン',
      '辣味噌拉麵': '辛味噌ラーメン',
      '海鹽焦糖生乳卷': '塩キャラメルロールケーキ',
      '提拉米蘇盒子': 'ティラミスボックス',
      '草莓奶酪': 'いちごのプリン',
      '抹茶千層': '抹茶ミルフィーユ',
      '芒果慕斯': 'マンゴームース',
      '可頌': 'クロワッサン',
      '巧克力丹麥': 'チョコデニッシュ',
      '肉桂捲': 'シナモンロール',
      '戚風蛋糕': 'シフォンケーキ',
      '黑糖珍珠鮮奶': '黒糖タピオカミルク',
      '青檸四季春': 'ライム四季春',
      '焙茶拿鐵': 'ほうじ茶ラテ',
      '芋頭鮮奶': 'タロイモミルク',
      '葡萄柚綠茶': 'グレープフルーツ緑茶',
      '美式咖啡': 'アメリカーノ',
      '拿鐵': 'カフェラテ',
      '卡布奇諾': 'カプチーノ',
      '摩卡': 'カフェモカ',
      '冰滴咖啡': 'コールドブリュー',
      '綜合握壽司': 'にぎり寿司盛り合わせ',
      '鮭魚握壽司': 'サーモンにぎり',
      '散壽司': 'ちらし寿司',
      '鰻魚飯': 'うなぎ丼',
      '牛丼': '牛丼',
      '親子丼': '親子丼',
      '豬排丼': 'カツ丼',
      '天婦羅丼': '天丼',
      '韓式烤肉便當': '韓国風焼肉弁当',
      '泡菜炒飯': 'キムチチャーハン',
      '海鮮煎餅': '海鮮チヂミ',
      '石鍋拌飯': 'ビビンバ',
      '部隊鍋': 'プデチゲ',
      '五花肉套餐': '豚バラ焼肉セット',
      '牛小排套餐': '牛カルビセット',
      '綜合烤肉': '焼肉盛り合わせ',
      '經典牛肉漢堡': 'クラシックビーフバーガー',
      '起司培根漢堡': 'チーズベーコンバーガー',
      '雞腿漢堡': 'チキンバーガー',
      '薯條': 'フライドポテト',
      '瑪格麗特披薩': 'マルゲリータピザ',
      '夏威夷披薩': 'ハワイアンピザ',
      '海鮮披薩': 'シーフードピザ',
      '綜合披薩': 'ミックスピザ',
      '奶油培根義大利麵': 'カルボナーラ',
      '番茄肉醬義大利麵': 'ボロネーゼ',
      '海鮮義大利麵': 'シーフードパスタ',
      '青醬雞肉義大利麵': 'ジェノベーゼ',
      '松露野菇燉飯': 'トリュフキノコリゾット',
      '海鮮燉飯': 'シーフードリゾット',
      '米蘭燉飯': 'ミラノ風リゾット',
      '打拋豬肉飯': 'ガパオライス',
      '綠咖哩雞飯': 'グリーンカレーライス',
      '泰式炒河粉': 'パッタイ',
      '酸辣海鮮湯': 'トムヤムクン',
      '泰式炒河粉(豬肉)': 'パッタイ（豚肉）',
      '泰式炒河粉(海鮮)': 'パッタイ（シーフード）',
      '泰式炒河粉(雞肉)': 'パッタイ（チキン）',
      '蝦仁燒賣': 'エビ焼売',
      '叉燒包': 'チャーシューマン',
      '蝦餃': 'エビ餃子',
      '腸粉': '腸粉',
      '港式蘿蔔糕': '大根餅',
      '乾炒牛河': '乾炒牛河',
      '叉燒飯': 'チャーシュー飯',
      '絲襪奶茶': '香港ミルクティー',
      '菠蘿油': 'パイナップルバンズ',
      '麻辣鍋(2人份)': 'マーラー鍋（2人前）',
      '酸菜白肉鍋(2人份)': '酸菜白肉鍋（2人前）',
      '壽喜燒(2人份)': 'すき焼き（2人前）',
      '個人小火鍋': '一人鍋',
      '牛肉涮涮鍋': '牛しゃぶしゃぶ',
      '豬肉涮涮鍋': '豚しゃぶしゃぶ',
      '海鮮涮涮鍋': 'シーフードしゃぶしゃぶ',
      '蔬菜鍋': '野菜鍋',
      '綜合烤串(10串)': '串焼き盛り合わせ（10本）',
      '烤雞翅(6支)': '手羽先焼き（6本）',
      '烤玉米': '焼きとうもろこし',
      '烤甜不辣': '焼き天ぷら',
      '手沖咖啡': 'ハンドドリップコーヒー',
      '焦糖瑪奇朵': 'キャラメルマキアート',
      '起司蛋糕': 'チーズケーキ'
    },
    korea: {
      '炙燒雞腿便當': '숯불 닭다리 도시락',
      '椒鹽排骨便當': '후추 소금 갈비 도시락',
      '香煎鮭魚便當': '구운 연어 도시락',
      '滷雞腿便當': '조림 닭다리 도시락',
      '素食養生便當': '채식 건강 도시락',
      '古早味排骨便當': '고전 갈비 도시락',
      '爌肉便當': '동파육 도시락',
      '雞排便當': '치킨까스 도시락',
      '嫩蛋酪梨吐司': '에그 아보카도 토스트',
      '煙燻鮭魚貝果': '훈제 연어 베이글',
      '蜂蜜優格碗': '꿀 요거트 볼',
      '美式經典早餐': '아메리칸 브렉퍼스트',
      '法式吐司套餐': '프렌치 토스트 세트',
      '班尼迪克蛋': '에그 베네딕트',
      '歐姆蛋套餐': '오믈렛 세트',
      '鬆餅組合': '팬케이크 세트',
      '無骨鹽酥雞': '뼈없는 닭튀김',
      '黃金地瓜條': '황금 고구마 튀김',
      '酥炸杏鮑菇': '튀긴 느타리버섯',
      '炸雞排': '닭가슴살 튀김',
      '甜不辣': '어묵',
      '韓式炸雞(原味)': '한식 치킨 (오리지널)',
      '韓式炸雞(辣味)': '한식 치킨 (매운맛)',
      '韓式炸雞(蜂蜜)': '한식 치킨 (꿀맛)',
      '起司炸雞': '치즈 치킨',
      '紅燒牛肉麵': '홍소 소고기 면',
      '麻醬拌麵': '참깨 비빔면',
      '炸醬麵': '짜장면',
      '擔擔麵': '탄탄면',
      '酸辣麵': '마라탕면',
      '豚骨拉麵': '돼지고기 라멘',
      '味噌拉麵': '미소 라멘',
      '醬油拉麵': '간장 라멘',
      '辣味噌拉麵': '매운 미소 라멘',
      '海鹽焦糖生乳卷': '소금 카라멜 롤케이크',
      '提拉米蘇盒子': '티라미수 박스',
      '草莓奶酪': '딸기 푸딩',
      '抹茶千層': '말차 밀푀유',
      '芒果慕斯': '망고 무스',
      '可頌': '크루아상',
      '巧克力丹麥': '초코 데이니쉬',
      '肉桂捲': '시나몬 롤',
      '戚風蛋糕': '시폰 케이크',
      '黑糖珍珠鮮奶': '흑당 타피오카 밀크티',
      '青檸四季春': '라임 사계절 차',
      '焙茶拿鐵': '현미차 라떼',
      '芋頭鮮奶': '토란 밀크티',
      '葡萄柚綠茶': '자몽 녹차',
      '美式咖啡': '아메리카노',
      '拿鐵': '카페라떼',
      '卡布奇諾': '카푸치노',
      '摩卡': '카페모카',
      '冰滴咖啡': '콜드브루',
      '綜合握壽司': '모듬 초밥',
      '鮭魚握壽司': '연어 초밥',
      '散壽司': '해산물 덮밥',
      '鰻魚飯': '장어 덮밥',
      '牛丼': '소고기 덮밥',
      '親子丼': '오야코동',
      '豬排丼': '돈까스 덮밥',
      '天婦羅丼': '튀김 덮밥',
      '韓式烤肉便當': '한식 불고기 도시락',
      '泡菜炒飯': '김치 볶음밥',
      '海鮮煎餅': '해물 파전',
      '石鍋拌飯': '돌솥 비빔밥',
      '部隊鍋': '부대찌개',
      '五花肉套餐': '삼겹살 세트',
      '牛小排套餐': '갈비살 세트',
      '綜合烤肉': '모듬 고기',
      '經典牛肉漢堡': '클래식 비프 버거',
      '起司培根漢堡': '치즈 베이컨 버거',
      '雞腿漢堡': '치킨 버거',
      '薯條': '감자튀김',
      '瑪格麗特披薩': '마르게리타 피자',
      '夏威夷披薩': '하와이안 피자',
      '海鮮披薩': '해산물 피자',
      '綜合披薩': '콤비네이션 피자',
      '奶油培根義大利麵': '까르보나라',
      '番茄肉醬義大利麵': '볼로네제',
      '海鮮義大利麵': '해산물 파스타',
      '青醬雞肉義大利麵': '제노베제',
      '松露野菇燉飯': '트러플 버섯 리조또',
      '海鮮燉飯': '해산물 리조또',
      '米蘭燉飯': '밀라노 리조또',
      '打拋豬肉飯': '팟타이 라이스',
      '綠咖哩雞飯': '그린 커리 라이스',
      '泰式炒河粉': '팟타이',
      '酸辣海鮮湯': '똠양꿍',
      '泰式炒河粉(豬肉)': '팟타이 (돼지고기)',
      '泰式炒河粉(海鮮)': '팟타이 (해산물)',
      '泰式炒河粉(雞肉)': '팟타이 (닭고기)',
      '蝦仁燒賣': '새우 슈마이',
      '叉燒包': '차슈바오',
      '蝦餃': '새우 만두',
      '腸粉': '창펀',
      '港式蘿蔔糕': '무떡',
      '乾炒牛河': '건초우하',
      '叉燒飯': '차슈 덮밥',
      '絲襪奶茶': '홍콩 밀크티',
      '菠蘿油': '파인애플 번',
      '麻辣鍋(2人份)': '마라탕 (2인분)',
      '酸菜白肉鍋(2人份)': '신채 백육탕 (2인분)',
      '壽喜燒(2人份)': '스키야키 (2인분)',
      '個人小火鍋': '1인용 샤브샤브',
      '牛肉涮涮鍋': '소고기 샤브샤브',
      '豬肉涮涮鍋': '돼지고기 샤브샤브',
      '海鮮涮涮鍋': '해산물 샤브샤브',
      '蔬菜鍋': '야채탕',
      '綜合烤串(10串)': '모듬 꼬치 (10개)',
      '烤雞翅(6支)': '닭날개 구이 (6개)',
      '烤玉米': '구운 옥수수',
      '烤甜不辣': '구운 어묵',
      '手沖咖啡': '핸드드립 커피',
      '焦糖瑪奇朵': '카라멜 마키아토',
      '起司蛋糕': '치즈케이크'
    },
    us: {
      '炙燒雞腿便當': 'Grilled Chicken Thigh Bento',
      '椒鹽排骨便當': 'Pepper Salt Pork Ribs Bento',
      '香煎鮭魚便當': 'Pan-Seared Salmon Bento',
      '滷雞腿便當': 'Braised Chicken Leg Bento',
      '素食養生便當': 'Vegetarian Bento',
      '古早味排骨便當': 'Classic Pork Ribs Bento',
      '爌肉便當': 'Braised Pork Belly Bento',
      '雞排便當': 'Chicken Cutlet Bento',
      '嫩蛋酪梨吐司': 'Soft Egg & Avocado Toast',
      '煙燻鮭魚貝果': 'Smoked Salmon Bagel',
      '蜂蜜優格碗': 'Honey Yogurt Bowl',
      '美式經典早餐': 'Classic American Breakfast',
      '法式吐司套餐': 'French Toast Set',
      '班尼迪克蛋': 'Eggs Benedict',
      '歐姆蛋套餐': 'Omelette Set',
      '鬆餅組合': 'Pancake Combo',
      '無骨鹽酥雞': 'Boneless Salt & Pepper Chicken',
      '黃金地瓜條': 'Golden Sweet Potato Fries',
      '酥炸杏鮑菇': 'Crispy King Oyster Mushrooms',
      '炸雞排': 'Fried Chicken Cutlet',
      '甜不辣': 'Taiwanese Tempura',
      '韓式炸雞(原味)': 'Korean Fried Chicken (Original)',
      '韓式炸雞(辣味)': 'Korean Fried Chicken (Spicy)',
      '韓式炸雞(蜂蜜)': 'Korean Fried Chicken (Honey)',
      '起司炸雞': 'Cheese Fried Chicken',
      '紅燒牛肉麵': 'Braised Beef Noodles',
      '麻醬拌麵': 'Sesame Noodles',
      '炸醬麵': 'Zhajiang Noodles',
      '擔擔麵': 'Dan Dan Noodles',
      '酸辣麵': 'Hot & Sour Noodles',
      '豚骨拉麵': 'Tonkotsu Ramen',
      '味噌拉麵': 'Miso Ramen',
      '醬油拉麵': 'Shoyu Ramen',
      '辣味噌拉麵': 'Spicy Miso Ramen',
      '海鹽焦糖生乳卷': 'Sea Salt Caramel Swiss Roll',
      '提拉米蘇盒子': 'Tiramisu Box',
      '草莓奶酪': 'Strawberry Panna Cotta',
      '抹茶千層': 'Matcha Mille Crepe',
      '芒果慕斯': 'Mango Mousse',
      '可頌': 'Croissant',
      '巧克力丹麥': 'Chocolate Danish',
      '肉桂捲': 'Cinnamon Roll',
      '戚風蛋糕': 'Chiffon Cake',
      '黑糖珍珠鮮奶': 'Brown Sugar Bubble Milk',
      '青檸四季春': 'Lime Four Seasons Tea',
      '焙茶拿鐵': 'Hojicha Latte',
      '芋頭鮮奶': 'Taro Milk Tea',
      '葡萄柚綠茶': 'Grapefruit Green Tea',
      '美式咖啡': 'Americano',
      '拿鐵': 'Cafe Latte',
      '卡布奇諾': 'Cappuccino',
      '摩卡': 'Cafe Mocha',
      '冰滴咖啡': 'Cold Brew Coffee',
      '綜合握壽司': 'Assorted Nigiri Sushi',
      '鮭魚握壽司': 'Salmon Nigiri',
      '散壽司': 'Chirashi Bowl',
      '鰻魚飯': 'Unagi Rice Bowl',
      '牛丼': 'Gyudon Beef Bowl',
      '親子丼': 'Oyakodon Chicken Bowl',
      '豬排丼': 'Katsudon Pork Bowl',
      '天婦羅丼': 'Tempura Rice Bowl',
      '韓式烤肉便當': 'Korean BBQ Bento',
      '泡菜炒飯': 'Kimchi Fried Rice',
      '海鮮煎餅': 'Seafood Pancake',
      '石鍋拌飯': 'Bibimbap',
      '部隊鍋': 'Army Stew',
      '五花肉套餐': 'Pork Belly Set',
      '牛小排套餐': 'Beef Short Rib Set',
      '綜合烤肉': 'Assorted BBQ',
      '經典牛肉漢堡': 'Classic Beef Burger',
      '起司培根漢堡': 'Cheese Bacon Burger',
      '雞腿漢堡': 'Chicken Burger',
      '薯條': 'French Fries',
      '瑪格麗特披薩': 'Margherita Pizza',
      '夏威夷披薩': 'Hawaiian Pizza',
      '海鮮披薩': 'Seafood Pizza',
      '綜合披薩': 'Combination Pizza',
      '奶油培根義大利麵': 'Carbonara',
      '番茄肉醬義大利麵': 'Bolognese',
      '海鮮義大利麵': 'Seafood Pasta',
      '青醬雞肉義大利麵': 'Chicken Pesto Pasta',
      '松露野菇燉飯': 'Truffle Mushroom Risotto',
      '海鮮燉飯': 'Seafood Risotto',
      '米蘭燉飯': 'Milanese Risotto',
      '打拋豬肉飯': 'Pad Kra Pao Rice',
      '綠咖哩雞飯': 'Green Curry Chicken Rice',
      '泰式炒河粉': 'Pad Thai',
      '酸辣海鮮湯': 'Tom Yum Soup',
      '泰式炒河粉(豬肉)': 'Pad Thai (Pork)',
      '泰式炒河粉(海鮮)': 'Pad Thai (Seafood)',
      '泰式炒河粉(雞肉)': 'Pad Thai (Chicken)',
      '蝦仁燒賣': 'Shrimp Siu Mai',
      '叉燒包': 'BBQ Pork Bun',
      '蝦餃': 'Shrimp Dumpling',
      '腸粉': 'Rice Noodle Roll',
      '港式蘿蔔糕': 'Turnip Cake',
      '乾炒牛河': 'Beef Chow Fun',
      '叉燒飯': 'BBQ Pork Rice',
      '絲襪奶茶': 'Silk Stocking Milk Tea',
      '菠蘿油': 'Pineapple Bun',
      '麻辣鍋(2人份)': 'Spicy Hot Pot (2 servings)',
      '酸菜白肉鍋(2人份)': 'Sour Cabbage Pork Pot (2 servings)',
      '壽喜燒(2人份)': 'Sukiyaki (2 servings)',
      '個人小火鍋': 'Individual Hot Pot',
      '牛肉涮涮鍋': 'Beef Shabu Shabu',
      '豬肉涮涮鍋': 'Pork Shabu Shabu',
      '海鮮涮涮鍋': 'Seafood Shabu Shabu',
      '蔬菜鍋': 'Vegetable Hot Pot',
      '綜合烤串(10串)': 'Assorted Skewers (10 pcs)',
      '烤雞翅(6支)': 'Grilled Chicken Wings (6 pcs)',
      '烤玉米': 'Grilled Corn',
      '烤甜不辣': 'Grilled Tempura',
      '手沖咖啡': 'Pour Over Coffee',
      '焦糖瑪奇朵': 'Caramel Macchiato',
      '起司蛋糕': 'Cheesecake'
    },
    thailand: {
      '炙燒雞腿便當': 'ข้าวกล่องไก่ย่าง',
      '椒鹽排骨便當': 'ข้าวกล่องซี่โครงหมือเกลือพริกไทย',
      '香煎鮭魚便當': 'ข้าวกล่องปลาแซลมอนทอด',
      '滷雞腿便當': 'ข้าวกล่องไก่ตุ๋น',
      '素食養生便當': 'ข้าวกล่องมังสวิรัติ',
      '嫩蛋酪梨吐司': 'ขนมปังอโวคาโดไข่นุ่ม',
      '煙燻鮭魚貝果': 'เบเกิลแซลมอนรมควัน',
      '蜂蜜優格碗': 'โยเกิร์ตราดน้ำผึ้ง',
      '無骨鹽酥雞': 'ไก่ทอดกรอบไร้กระดูก',
      '黃金地瓜條': 'มันเทศทอด',
      '酥炸杏鮑菇': 'เห็ดนางรมทอด',
      '炸雞排': 'ไก่ทอด',
      '甜不辣': 'ทะโมะ',
      '紅燒牛肉麵': 'เส้นเนื้อตุ๋น',
      '麻醬拌麵': 'เส้นงา',
      '炸醬麵': 'เส้นจ้าจั้ง',
      '黑糖珍珠鮮奶': 'ชานมไข่มุกน้ำตาลทรายแดง',
      '青檸四季春': 'ชาสี่ฤดูมะนาว',
      '焙茶拿鐵': 'ลาเต้ชาคั่ว',
      '芋頭鮮奶': 'ชานมเผือก',
      '葡萄柚綠茶': 'ชาเขียวเกรปฟรุต',
      '美式咖啡': 'อเมริกาโน่',
      '拿鐵': 'ลาเต้',
      '打拋豬肉飯': 'ผัดกะเพราหมู',
      '綠咖哩雞飯': 'ข้าวแกงเขียวหวานไก่',
      '泰式炒河粉': 'ผัดไทย',
      '酸辣海鮮湯': 'ต้มยำทะเล',
      '泰式炒河粉(豬肉)': 'ผัดไทยหมู',
      '泰式炒河粉(海鮮)': 'ผัดไทยทะเล',
      '泰式炒河粉(雞肉)': 'ผัดไทยไก่'
    },
    hongkong: {
      '炙燒雞腿便當': '燒雞脾飯盒',
      '椒鹽排骨便當': '椒鹽排骨飯盒',
      '香煎鮭魚便當': '香煎三文魚飯盒',
      '滷雞腿便當': '滷水雞脾飯盒',
      '素食養生便當': '素食飯盒',
      '嫩蛋酪梨吐司': '牛油果滑蛋多士',
      '煙燻鮭魚貝果': '煙三文魚貝果',
      '蜂蜜優格碗': '蜜糖乳酪碗',
      '無骨鹽酥雞': '無骨鹽酥雞',
      '黃金地瓜條': '黃金番薯條',
      '酥炸杏鮑菇': '酥炸杏鮑菇',
      '炸雞排': '炸雞排',
      '甜不辣': '甜不辣',
      '紅燒牛肉麵': '紅燒牛肉麵',
      '麻醬拌麵': '麻醬拌麵',
      '炸醬麵': '炸醬麵',
      '黑糖珍珠鮮奶': '黑糖珍珠鮮奶',
      '青檸四季春': '青檸四季春',
      '焙茶拿鐵': '焙茶拿鐵',
      '芋頭鮮奶': '芋頭鮮奶',
      '葡萄柚綠茶': '西柚綠茶',
      '美式咖啡': '美式咖啡',
      '拿鐵': '拿鐵',
      '蝦仁燒賣': '蝦仁燒賣',
      '叉燒包': '叉燒包',
      '蝦餃': '蝦餃',
      '腸粉': '腸粉',
      '港式蘿蔔糕': '蘿蔔糕',
      '乾炒牛河': '乾炒牛河',
      '叉燒飯': '叉燒飯',
      '絲襪奶茶': '絲襪奶茶',
      '菠蘿油': '菠蘿油',
      '打拋豬肉飯': '打拋豬肉飯',
      '綠咖哩雞飯': '綠咖哩雞飯',
      '泰式炒河粉': '泰式炒河粉',
      '酸辣海鮮湯': '酸辣海鮮湯'
    },
    china: {
      '炙燒雞腿便當': '炙烧鸡腿便当',
      '椒鹽排骨便當': '椒盐排骨便当',
      '香煎鮭魚便當': '香煎三文鱼便当',
      '滷雞腿便當': '卤鸡腿便当',
      '素食養生便當': '素食养生便当',
      '嫩蛋酪梨吐司': '牛油果滑蛋吐司',
      '煙燻鮭魚貝果': '烟熏三文鱼贝果',
      '蜂蜜優格碗': '蜂蜜酸奶碗',
      '無骨鹽酥雞': '无骨盐酥鸡',
      '黃金地瓜條': '黄金红薯条',
      '酥炸杏鮑菇': '酥炸杏鲍菇',
      '炸雞排': '炸鸡排',
      '甜不辣': '甜不辣',
      '紅燒牛肉麵': '红烧牛肉面',
      '麻醬拌麵': '麻酱拌面',
      '炸醬麵': '炸酱面',
      '黑糖珍珠鮮奶': '黑糖珍珠鲜奶',
      '青檸四季春': '青柠四季春',
      '焙茶拿鐵': '焙茶拿铁',
      '芋頭鮮奶': '芋头鲜奶',
      '葡萄柚綠茶': '西柚绿茶',
      '美式咖啡': '美式咖啡',
      '拿鐵': '拿铁',
      '蝦仁燒賣': '虾仁烧卖',
      '叉燒包': '叉烧包',
      '蝦餃': '虾饺',
      '腸粉': '肠粉',
      '港式蘿蔔糕': '萝卜糕',
      '乾炒牛河': '干炒牛河',
      '叉燒飯': '叉烧饭',
      '絲襪奶茶': '丝袜奶茶',
      '菠蘿油': '菠萝油',
      '打拋豬肉飯': '打抛猪肉饭',
      '綠咖哩雞飯': '绿咖喱鸡饭',
      '泰式炒河粉': '泰式炒河粉',
      '酸辣海鮮湯': '酸辣海鲜汤'
    },
    vietnam: {
      '炙燒雞腿便當': 'Cơm gà nướng',
      '椒鹽排骨便當': 'Cơm sườn tiêu mặn',
      '香煎鮭魚便當': 'Cơm cá hồi chiên',
      '滷雞腿便當': 'Cơm gà kho',
      '素食養生便當': 'Cơm chay',
      '嫩蛋酪梨吐司': 'Bánh mì bơ trứng',
      '煙燻鮭魚貝果': 'Bánh mì tròn cá hồi xông khói',
      '蜂蜜優格碗': 'Bát sữa chua mật ong',
      '無骨鹽酥雞': 'Gà rán không xương',
      '黃金地瓜條': 'Khoai lang chiên',
      '酥炸杏鮑菇': 'Nấm rơm chiên giòn',
      '炸雞排': 'Gà rán',
      '甜不辣': 'Tempura',
      '紅燒牛肉麵': 'Mì bò hầm',
      '麻醬拌麵': 'Mì trộn tương mè',
      '炸醬麵': 'Mì tương đen',
      '黑糖珍珠鮮奶': 'Trà sữa trân châu đường đen',
      '青檸四季春': 'Trà chanh bốn mùa',
      '焙茶拿鐵': 'Latte trà xanh rang',
      '芋頭鮮奶': 'Trà sữa khoai môn',
      '葡萄柚綠茶': 'Trà xanh bưởi',
      '美式咖啡': 'Cà phê Americano',
      '拿鐵': 'Cà phê Latte',
      '打拋豬肉飯': 'Cơm heo xào lá húng quế',
      '綠咖哩雞飯': 'Cơm cà ri xanh gà',
      '泰式炒河粉': 'Phở xào Thái',
      '酸辣海鮮湯': 'Canh chua hải sản',
      '泰式炒河粉(豬肉)': 'Phở xào Thái heo',
      '泰式炒河粉(海鮮)': 'Phở xào Thái hải sản',
      '泰式炒河粉(雞肉)': 'Phở xào Thái gà'
    },
    singapore: {
      '炙燒雞腿便當': 'Grilled Chicken Thigh Bento',
      '椒鹽排骨便當': 'Pepper Salt Pork Ribs Bento',
      '香煎鮭魚便當': 'Pan-Seared Salmon Bento',
      '滷雞腿便當': 'Braised Chicken Leg Bento',
      '素食養生便當': 'Vegetarian Bento',
      '嫩蛋酪梨吐司': 'Soft Egg & Avocado Toast',
      '煙燻鮭魚貝果': 'Smoked Salmon Bagel',
      '蜂蜜優格碗': 'Honey Yogurt Bowl',
      '無骨鹽酥雞': 'Boneless Salt & Pepper Chicken',
      '黃金地瓜條': 'Golden Sweet Potato Fries',
      '酥炸杏鮑菇': 'Crispy King Oyster Mushrooms',
      '炸雞排': 'Fried Chicken Cutlet',
      '甜不辣': 'Taiwanese Tempura',
      '紅燒牛肉麵': 'Braised Beef Noodles',
      '麻醬拌麵': 'Sesame Noodles',
      '炸醬麵': 'Zhajiang Noodles',
      '黑糖珍珠鮮奶': 'Brown Sugar Bubble Milk',
      '青檸四季春': 'Lime Four Seasons Tea',
      '焙茶拿鐵': 'Hojicha Latte',
      '芋頭鮮奶': 'Taro Milk Tea',
      '葡萄柚綠茶': 'Grapefruit Green Tea',
      '美式咖啡': 'Americano',
      '拿鐵': 'Cafe Latte',
      '蝦仁燒賣': 'Shrimp Siu Mai',
      '叉燒包': 'BBQ Pork Bun',
      '蝦餃': 'Shrimp Dumpling',
      '腸粉': 'Rice Noodle Roll',
      '港式蘿蔔糕': 'Turnip Cake',
      '乾炒牛河': 'Beef Chow Fun',
      '叉燒飯': 'BBQ Pork Rice',
      '絲襪奶茶': 'Silk Stocking Milk Tea',
      '菠蘿油': 'Pineapple Bun',
      '打拋豬肉飯': 'Pad Kra Pao Rice',
      '綠咖哩雞飯': 'Green Curry Chicken Rice',
      '泰式炒河粉': 'Pad Thai',
      '酸辣海鮮湯': 'Tom Yum Soup'
    }
  };
  
  // 獲取本地化的餐廳名稱
  let localizedName = store.name;
  if (storeNames[region] && storeNames[region][store.name]) {
    localizedName = storeNames[region][store.name];
  }
  
  // 本地化餐點
  const localizedDishes = store.dishes.map(dish => {
    let localDishName = dish.name;
    if (dishNames[region] && dishNames[region][dish.name]) {
      localDishName = dishNames[region][dish.name];
    }
    
    const localizedPrice = Math.round(dish.price * priceMultiplier);
    
    return {
      ...dish,
      name: localDishName,
      originalName: dish.name,
      price: localizedPrice,
      originalPrice: dish.price
    };
  });
  
  return {
    ...store,
    name: localizedName,
    originalName: store.name,
    dishes: localizedDishes
  };
}

let stores = [...allStores.slice(0, 6)];

let activeCategory = '全部';
let sortMode = 'rating';
let keyword = '';
const cart = new Map();

function formatPrice(price) {
  const saved = localStorage.getItem('sx_delivery_address');
  let currency = 'NT$';
  if (saved) {
    try {
      const data = JSON.parse(saved);
      if (data.city) {
        const regionConfig = detectRegion(data.city.toLowerCase());
        currency = regionConfig.currency;
      }
    } catch (e) {}
  }
  return `${currency}${Number(price || 0).toLocaleString()}`;
}

function getFilteredStores() {
  return stores
    .filter(store => activeCategory === '全部' || store.category === activeCategory)
    .filter(store => {
      if (!keyword) return true;
      const merged = `${store.name} ${store.category} ${store.dishes.map(d => d.name).join(' ')}`.toLowerCase();
      return merged.includes(keyword.toLowerCase());
    })
    .sort((a, b) => {
      if (sortMode === 'delivery') return a.fee - b.fee;
      return b.rating - a.rating;
    });
}

function renderCategories() {
  categoryRow.innerHTML = categories
    .map(category => `<button class="chip-btn ${category === activeCategory ? 'active' : ''}" data-category="${category}">${category}</button>`)
    .join('');
}

function renderStores() {
  const data = getFilteredStores();
  if (data.length === 0) {
    restaurantList.innerHTML = `<div class="restaurant-card"><div class="restaurant-body">找不到符合條件的餐廳，試試其他分類或關鍵字。</div></div>`;
    return;
  }

  restaurantList.innerHTML = data
    .map(store => {
      return `
        <article class="restaurant-card" data-store-id="${store.id}" style="cursor:pointer;">
          <div class="cover" style="background:${store.cover};">
            <span class="eta-badge">${store.eta}</span>
          </div>
          <div class="restaurant-body">
            <div class="restaurant-head">
              <h4>${store.name}</h4>
              <strong>⭐ ${store.rating.toFixed(1)}</strong>
            </div>
            <p class="restaurant-meta">${store.category} · ${store.distance} · 運費 ${store.fee === 0 ? '免費' : formatPrice(store.fee)}</p>
            <p class="restaurant-hint">點擊查看菜單</p>
          </div>
        </article>
      `;
    })
    .join('');
}

function openStoreDetail(storeId) {
  const store = stores.find(s => s.id === storeId);
  if (!store) return;

  detailTitle.textContent = store.name;
  detailCover.style.background = store.cover;
  detailRating.textContent = `⭐ ${store.rating.toFixed(1)}`;
  detailMeta.textContent = `${store.category} · ${store.distance} · 運費 ${store.fee === 0 ? '免費' : formatPrice(store.fee)}`;

  detailDishes.innerHTML = store.dishes
    .map(dish => `
      <div class="detail-dish-item">
        <div class="detail-dish-info">
          <h5>${dish.name}</h5>
          <p class="dish-price">${formatPrice(dish.price)}</p>
          ${dish.description ? `<p class="dish-desc">${dish.description}</p>` : ''}
        </div>
        <button class="detail-dish-add" data-action="add" data-store-id="${store.id}" data-dish-id="${dish.id}">
          <i class="fas fa-plus"></i>
        </button>
      </div>
    `)
    .join('');

  detailPanel?.classList.remove('hidden');
}

function closeStoreDetail() {
  detailPanel?.classList.add('hidden');
}

function getDishById(storeId, dishId) {
  const store = stores.find(item => item.id === storeId);
  if (!store) return null;
  const dish = store.dishes.find(item => item.id === dishId);
  if (!dish) return null;
  return { ...dish, storeId, storeName: store.name };
}

function addToCart(storeId, dishId) {
  console.log('addToCart called:', storeId, dishId);
  const dish = getDishById(storeId, dishId);
  if (!dish) {
    console.log('Dish not found');
    return;
  }
  const key = `${storeId}:${dishId}`;
  const item = cart.get(key);
  if (item) {
    item.qty += 1;
    cart.set(key, item);
  } else {
    cart.set(key, { ...dish, qty: 1 });
  }
  console.log('Cart updated:', cart);
  renderCart();
}

function updateCartItem(key, delta) {
  const item = cart.get(key);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart.delete(key);
  } else {
    cart.set(key, item);
  }
  renderCart();
}

function renderCart() {
  const items = [...cart.entries()];
  const totalQty = items.reduce((sum, [, item]) => sum + item.qty, 0);
  const total = items.reduce((sum, [, item]) => sum + (item.price * item.qty), 0);

  cartBadgeEl.textContent = String(totalQty);
  cartTotalEl.textContent = formatPrice(total);

  if (items.length === 0) {
    cartItemsEl.innerHTML = '<p style="color:#8b8d92;font-size:13px;">購物車是空的，去選幾道餐點吧。</p>';
    return;
  }

  cartItemsEl.innerHTML = items
    .map(([key, item]) => `
      <article class="cart-item">
        <div>
          <strong>${item.name}</strong>
          <p>${item.storeName} · ${formatPrice(item.price)}</p>
        </div>
        <div class="qty-control">
          <button type="button" data-action="qty-minus" data-key="${key}">-</button>
          <span>${item.qty}</span>
          <button type="button" data-action="qty-plus" data-key="${key}">+</button>
        </div>
      </article>
    `)
    .join('');
}

categoryRow?.addEventListener('click', event => {
  const btn = event.target.closest('[data-category]');
  if (!btn) return;
  activeCategory = btn.dataset.category;
  renderCategories();
  renderStores();
});

restaurantList?.addEventListener('click', event => {
  const addBtn = event.target.closest('[data-action="add"]');
  if (addBtn) {
    addToCart(addBtn.dataset.storeId, addBtn.dataset.dishId);
    return;
  }
  
  const card = event.target.closest('.restaurant-card');
  if (card) {
    const storeId = card.dataset.storeId;
    if (storeId) {
      openStoreDetail(storeId);
    }
  }
});

detailCloseBtn?.addEventListener('click', closeStoreDetail);

detailPanel?.addEventListener('click', event => {
  const addBtn = event.target.closest('[data-action="add"]');
  if (addBtn) {
    event.stopPropagation();
    addToCart(addBtn.dataset.storeId, addBtn.dataset.dishId);
  }
});

cartItemsEl?.addEventListener('click', event => {
  const plus = event.target.closest('[data-action="qty-plus"]');
  if (plus) {
    updateCartItem(plus.dataset.key, 1);
    return;
  }
  const minus = event.target.closest('[data-action="qty-minus"]');
  if (minus) {
    updateCartItem(minus.dataset.key, -1);
  }
});

searchInput?.addEventListener('input', () => {
  keyword = searchInput.value.trim();
  renderStores();
});

sortBtn?.addEventListener('click', () => {
  sortMode = sortMode === 'rating' ? 'delivery' : 'rating';
  sortBtn.textContent = sortMode === 'rating' ? '依評分' : '依運費';
  renderStores();
});

cartToggleBtn?.addEventListener('click', () => {
  cartSheet?.classList.toggle('hidden');
});

cartCloseBtn?.addEventListener('click', () => {
  cartSheet?.classList.add('hidden');
});

checkoutBtn?.addEventListener('click', () => {
  if (cart.size === 0) {
    checkoutBtn.textContent = '請先加入餐點';
    setTimeout(() => {
      checkoutBtn.textContent = '前往結帳';
    }, 900);
    return;
  }
  
  openCheckoutPanel();
});

function openCheckoutPanel() {
  const items = [...cart.entries()];
  const subtotal = items.reduce((sum, [, item]) => sum + (item.price * item.qty), 0);
  
  const savedAddress = localStorage.getItem('sx_delivery_address');
  let addressText = '尚未設定地址';
  if (savedAddress) {
    try {
      const data = JSON.parse(savedAddress);
      if (data.city) {
        addressText = `${data.city}${data.district ? '・' + data.district : ''}${data.street ? ' ' + data.street : ''}${data.note ? ' (' + data.note + ')' : ''}`;
      }
    } catch (e) {}
  }
  checkoutAddress.textContent = addressText;
  
  checkoutItems.innerHTML = items
    .map(([key, item]) => `
      <div class="checkout-item">
        <div class="checkout-item-info">
          <div class="checkout-item-name">${item.name}</div>
          <div class="checkout-item-store">${item.storeName}</div>
        </div>
        <span class="checkout-item-qty">x${item.qty}</span>
        <span class="checkout-item-price">${formatPrice(item.price * item.qty)}</span>
      </div>
    `)
    .join('');
  
  checkoutSubtotal.textContent = formatPrice(subtotal);
  checkoutFee.textContent = 'NT$ 0';
  checkoutTotal.textContent = formatCurrency(subtotal);
  
  cartSheet?.classList.add('hidden');
  checkoutPanel?.classList.remove('hidden');
}

function closeCheckoutPanel() {
  checkoutPanel?.classList.add('hidden');
}

checkoutCloseBtn?.addEventListener('click', closeCheckoutPanel);

checkoutConfirmBtn?.addEventListener('click', () => {
  processPayment();
});

function processPayment() {
  const items = [...cart.entries()];
  const subtotal = items.reduce((sum, [, item]) => sum + (item.price * item.qty), 0);
  const itemNames = items.map(([, item]) => `${item.name} x${item.qty}`).join('、');
  const storeNames = [...new Set(items.map(([, item]) => item.storeName))].join('、');
  const note = checkoutNote?.value?.trim() || '';
  
  const savedAddress = localStorage.getItem('sx_delivery_address');
  let addressText = '未設定';
  if (savedAddress) {
    try {
      const data = JSON.parse(savedAddress);
      if (data.city) {
        addressText = `${data.city}${data.district ? ' ' + data.district : ''}${data.street ? ' ' + data.street : ''}`;
      }
    } catch (e) {}
  }
  
  const orderTime = new Date();
  const timeStr = `${orderTime.getFullYear()}/${orderTime.getMonth() + 1}/${orderTime.getDate()} ${orderTime.getHours().toString().padStart(2, '0')}:${orderTime.getMinutes().toString().padStart(2, '0')}`;
  
  window.parent?.postMessage({
    type: 'KAKAOPAY_DELIVERY',
    amount: subtotal,
    storeName: storeNames,
    items: itemNames,
    source: 'delivery'
  }, '*');
  
  const orderRecord = {
    type: 'delivery_order',
    timestamp: Date.now(),
    timeStr: timeStr,
    stores: storeNames,
    items: items.map(([, item]) => ({
      name: item.name,
      store: item.storeName,
      price: item.price,
      qty: item.qty
    })),
    total: subtotal,
    address: addressText,
    note: note
  };
  
  saveOrderToHistory(orderRecord);
  
  sendOrderToChat(orderRecord);
  
  successDetails.innerHTML = `
    <p><strong>訂單時間：</strong>${timeStr}</p>
    <p><strong>餐廳：</strong>${storeNames}</p>
    <p><strong>品項：</strong>${itemNames}</p>
    <p><strong>金額：</strong>${formatCurrency(subtotal)}</p>
    <p><strong>地址：</strong>${addressText}</p>
    ${note ? `<p><strong>備註：</strong>${note}</p>` : ''}
  `;
  
  closeCheckoutPanel();
  paymentSuccessPanel?.classList.remove('hidden');
  
  cart.clear();
  renderCart();
}

function saveOrderToHistory(order) {
  try {
    const historyKey = 'sx_delivery_order_history';
    let history = [];
    const saved = localStorage.getItem(historyKey);
    if (saved) {
      try {
        history = JSON.parse(saved);
      } catch (e) {}
    }
    history.unshift(order);
    if (history.length > 50) history = history.slice(0, 50);
    localStorage.setItem(historyKey, JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save order history:', e);
  }
}

function sendOrderToChat(order) {
  const orderMessage = `[外送訂單]\n時間：${order.timeStr}\n餐廳：${order.stores}\n品項：${order.items.map(i => `${i.name} x${i.qty}`).join('、')}\n金額：NT$${order.total}\n地址：${order.address}${order.note ? '\n備註：' + order.note : ''}`;
  
  window.parent?.postMessage({
    type: 'DELIVERY_ORDER_TO_CHAT',
    message: orderMessage,
    order: order
  }, '*');
}

successCloseBtn?.addEventListener('click', () => {
  paymentSuccessPanel?.classList.add('hidden');
});

function formatCurrency(value) {
  const saved = localStorage.getItem('sx_delivery_address');
  let currency = 'NT$';
  if (saved) {
    try {
      const data = JSON.parse(saved);
      if (data.city) {
        const regionConfig = detectRegion(data.city.toLowerCase());
        currency = regionConfig.currency;
      }
    } catch (e) {}
  }
  return `${currency}${Number(value || 0).toLocaleString()}`;
}

function loadSxSettings() {
  if (typeof SxSettings === 'undefined') return null;
  const settings = SxSettings.getSettingsSnapshot();
  console.log('[delivery] Loaded settings:', {
    characters: settings.characters.length,
    users: settings.users.length,
    apis: settings.apis.length
  });
  return settings;
}

function applyTheme() {
  const mode = localStorage.getItem('sx_theme_mode') || 'dark';
  document.documentElement.dataset.theme = mode;
}

applyTheme();

if (typeof SxAppearance !== 'undefined') {
  SxAppearance.onUpdate(() => applyTheme());
}

window.addEventListener('message', (event) => {
  const data = event.data;
  if (data?.type === 'THEME_MODE_CHANGED' && data.mode) {
    document.documentElement.dataset.theme = data.mode;
  }
});

loadSxSettings();
renderCategories();
renderStores();
renderCart();

// 地址功能
function loadAddress() {
  const saved = localStorage.getItem('sx_delivery_address');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      updateAddressDisplay(data);
      if (data.city) cityInput.value = data.city;
      if (data.district) districtInput.value = data.district;
      if (data.street) streetInput.value = data.street;
      if (data.note) noteInput.value = data.note;
      
      if (data.city && data.district) {
        stores = getStoresByDistrict(data.city, data.district);
        renderStores();
      }
    } catch (e) {
      console.error('Failed to load address:', e);
    }
  }
}

function updateAddressDisplay(data) {
  if (!data || !data.city) {
    addressDisplay.textContent = '點擊選擇地區';
    return;
  }
  let display = `${data.city}`;
  if (data.district) display += `・${data.district}`;
  if (data.street) display += ` ${data.street}`;
  if (data.note) display += ` (${data.note})`;
  addressDisplay.textContent = display;
}

function openAddressPanel() {
  addressPanel?.classList.remove('hidden');
}

function closeAddressPanel() {
  addressPanel?.classList.add('hidden');
}

function saveAddress() {
  const city = cityInput?.value?.trim() || '';
  const district = districtInput?.value?.trim() || '';
  const street = streetInput?.value?.trim() || '';
  const note = noteInput?.value?.trim() || '';
  
  if (!city) {
    alert('請輸入城市');
    return;
  }
  
  if (!district) {
    alert('請輸入行政區');
    return;
  }
  
  const data = { city, district, street, note };
  localStorage.setItem('sx_delivery_address', JSON.stringify(data));
  updateAddressDisplay(data);
  
  stores = getStoresByDistrict(city, district);
  renderStores();
  
  closeAddressPanel();
}

addressWrap?.addEventListener('click', openAddressPanel);
addressCloseBtn?.addEventListener('click', closeAddressPanel);
addressSaveBtn?.addEventListener('click', saveAddress);

loadAddress();

console.log('Loaded app: delivery');

