console.log('Loaded app: home');

const ROOM_TYPES = {
  living_room: { name: '客廳', icon: 'tv', defaultFurniture: ['sofa', 'tv', 'table', 'lamp', 'rug'] },
  bedroom: { name: '房間', icon: 'bed', defaultFurniture: ['bed_double', 'wardrobe', 'mirror', 'lamp', 'rug'] },
  bathroom: { name: '衛浴', icon: 'bath', defaultFurniture: [], floorColor: '#e0e0e0', wallColor: '#f5f5f5' },
  study: { name: '書房', icon: 'book', defaultFurniture: ['desk', 'chair', 'bookshelf', 'computer', 'lamp'] },
  kitchen: { name: '廚房', icon: 'cooking', defaultFurniture: ['fridge', 'table'], floorColor: '#8B7355', wallColor: '#D2691E' },
  balcony: { name: '陽台', icon: 'sun', defaultFurniture: ['plant_big', 'plant_small', 'flower'], floorColor: '#8B7355', wallColor: '#87CEEB', isOutdoor: true }
};

const HomeApp = {
  currentRoom: 'user',
  currentSubRoom: 'living_room',
  canvas: null,
  ctx: null,
  mapCanvas: null,
  mapCtx: null,
  gridSize: 32,
  roomWidth: 16,
  roomHeight: 12,
  editMode: false,
  selectedFurniture: null,
  draggedFurniture: null,
  dragOffset: { x: 0, y: 0 },
  roomStyle: 'modern',
  floorColor: '#4a4a6a',
  wallColor: '#3a3a5a',
  placedFurniture: { 
    user: {
      living_room: [],
      bedroom: [],
      bathroom: [],
      study: [],
      kitchen: [],
      balcony: []
    }
  },
  characterSprite: { user: null },
  properties: [],
  mapScale: 1,
  mapOffset: { x: 0, y: 0 },
  pendingBuy: null,
  pendingCharIdx: null,
  townMap: null,
  buildings: [],
  emptyLots: [],
  decorations: [],
  isDragging: false,
  dragStartX: null,
  dragStartY: null,
  lastMapOffsetX: 0,
  lastMapOffsetY: 0
};

const MAP_CONFIG = {
  tileSize: 48,
  width: 20,
  height: 15
};

const TILE_TYPES = {
  GRASS: 0,
  ROAD_H: 1,
  ROAD_V: 2,
  ROAD_CROSS: 3,
  ROAD_CORNER_TL: 4,
  ROAD_CORNER_TR: 5,
  ROAD_CORNER_BL: 6,
  ROAD_CORNER_BR: 7,
  SIDEWALK: 8,
  CROSSWALK: 9,
  WATER: 10,
  TREE: 11,
  FLOWER: 12,
  BUSH: 13,
  LAMP: 14,
  BENCH: 15,
  FOUNTAIN: 16
};

const BUILDINGS = {
  PLAYER_HOUSE: { id: 'player_house', name: '我的家', color: '#e94560', roofColor: '#c73e54', price: 0 },
  CHAR_HOUSE: { id: 'char_house', name: 'TA的家', color: '#4facfe', roofColor: '#3a8bc9', price: 15000 },
  SHARED_HOUSE: { id: 'shared_house', name: '共同的家', color: '#ff6b9d', roofColor: '#d94a7b', price: 25000 },
  CONVENIENCE: { id: 'convenience', name: '便利商店', color: '#2ecc71', roofColor: '#27ae60', price: 0, isShop: true },
  CAFE: { id: 'cafe', name: '咖啡廳', color: '#8B4513', roofColor: '#654321', price: 0, isShop: true },
  PARK: { id: 'park', name: '公園', color: '#228B22', roofColor: '#1a6b1a', price: 0, isPark: true },
  SUPERMARKET: { id: 'supermarket', name: '超市', color: '#e74c3c', roofColor: '#c0392b', price: 0, isShop: true }
};

const HOUSE_PRICES = {
  myHouse: 0,
  charHouse: 15000,
  sharedHouse: 25000,
  upgrade: 8000
};

const ROOM_STYLES = {
  modern: { floor: '#4a4a6a', wall: '#3a3a5a', accent: '#e94560' },
  cozy: { floor: '#8B7355', wall: '#D2691E', accent: '#FF6347' },
  minimal: { floor: '#e0e0e0', wall: '#f5f5f5', accent: '#333333' },
  gaming: { floor: '#1a1a2e', wall: '#16213e', accent: '#00ff88' }
};

const FLOOR_COLORS = ['#4a4a6a', '#8B7355', '#e0e0e0', '#1a1a2e', '#2d4a3e', '#4a3a2d', '#3a2d4a', '#4a2d3a'];
const WALL_COLORS = ['#3a3a5a', '#D2691E', '#f5f5f5', '#16213e', '#1a3a2e', '#3a2d1a', '#2d1a3a', '#3a1a2d'];

const FURNITURE_CATALOG = [
  { id: 'bed_single', name: '單人床', category: 'bed', width: 2, height: 3, pixels: generateBedPixels('#8B4513', '#DEB887') },
  { id: 'bed_double', name: '雙人床', category: 'bed', width: 3, height: 3, pixels: generateBedPixels('#654321', '#FFDAB9') },
  { id: 'desk', name: '書桌', category: 'desk', width: 2, height: 1, pixels: generateDeskPixels('#8B4513') },
  { id: 'chair', name: '椅子', category: 'desk', width: 1, height: 1, pixels: generateChairPixels('#4a4a4a') },
  { id: 'sofa', name: '沙發', category: 'desk', width: 3, height: 1, pixels: generateSofaPixels('#6B8E23') },
  { id: 'table', name: '桌子', category: 'desk', width: 2, height: 2, pixels: generateTablePixels('#8B4513') },
  { id: 'bookshelf', name: '書架', category: 'decor', width: 1, height: 2, pixels: generateBookshelfPixels() },
  { id: 'lamp', name: '檯燈', category: 'decor', width: 1, height: 1, pixels: generateLampPixels('#FFD700') },
  { id: 'rug', name: '地毯', category: 'decor', width: 3, height: 2, pixels: generateRugPixels('#DC143C') },
  { id: 'poster', name: '海報', category: 'decor', width: 1, height: 2, pixels: generatePosterPixels() },
  { id: 'plant_small', name: '小盆栽', category: 'plant', width: 1, height: 1, pixels: generatePlantPixels('small') },
  { id: 'plant_big', name: '大盆栽', category: 'plant', width: 1, height: 2, pixels: generatePlantPixels('big') },
  { id: 'flower', name: '花瓶', category: 'plant', width: 1, height: 1, pixels: generateFlowerPixels() },
  { id: 'tv', name: '電視', category: 'electronic', width: 2, height: 1, pixels: generateTVPixels() },
  { id: 'computer', name: '電腦', category: 'electronic', width: 1, height: 1, pixels: generateComputerPixels() },
  { id: 'game_console', name: '遊戲機', category: 'electronic', width: 1, height: 1, pixels: generateGamePixels() },
  { id: 'fridge', name: '冰箱', category: 'electronic', width: 1, height: 2, pixels: generateFridgePixels() },
  { id: 'wardrobe', name: '衣櫃', category: 'decor', width: 2, height: 2, pixels: generateWardrobePixels() },
  { id: 'mirror', name: '鏡子', category: 'decor', width: 1, height: 2, pixels: generateMirrorPixels() },
  { id: 'window', name: '窗戶', category: 'decor', width: 2, height: 1, pixels: generateWindowPixels() },
  { id: 'bathtub', name: '浴缸', category: 'bath', width: 3, height: 2, pixels: generateBathtubPixels() },
  { id: 'toilet', name: '馬桶', category: 'bath', width: 1, height: 1, pixels: generateToiletPixels() },
  { id: 'sink', name: '洗手台', category: 'bath', width: 1, height: 1, pixels: generateSinkPixels() },
  { id: 'stove', name: '爐灶', category: 'kitchen', width: 2, height: 1, pixels: generateStovePixels() },
  { id: 'kitchen_counter', name: '流理台', category: 'kitchen', width: 2, height: 1, pixels: generateKitchenCounterPixels() }
];

function generateBedPixels(woodColor, sheetColor) {
  return (ctx, size) => {
    const s = size / 16;
    ctx.fillStyle = woodColor;
    ctx.fillRect(0, 0, 16 * s, 16 * s);
    ctx.fillStyle = sheetColor;
    ctx.fillRect(1 * s, 1 * s, 14 * s, 12 * s);
    ctx.fillStyle = '#fff';
    ctx.fillRect(1 * s, 1 * s, 14 * s, 3 * s);
  };
}

function generateDeskPixels(color) {
  return (ctx, size) => {
    const s = size / 16;
    ctx.fillStyle = color;
    ctx.fillRect(0, 4 * s, 16 * s, 3 * s);
    ctx.fillRect(1 * s, 7 * s, 2 * s, 9 * s);
    ctx.fillRect(13 * s, 7 * s, 2 * s, 9 * s);
    ctx.fillStyle = '#666';
    ctx.fillRect(3 * s, 0, 10 * s, 4 * s);
  };
}

function generateChairPixels(color) {
  return (ctx, size) => {
    const s = size / 16;
    ctx.fillStyle = color;
    ctx.fillRect(3 * s, 0, 10 * s, 10 * s);
    ctx.fillRect(1 * s, 10 * s, 14 * s, 3 * s);
    ctx.fillRect(4 * s, 13 * s, 3 * s, 3 * s);
    ctx.fillRect(9 * s, 13 * s, 3 * s, 3 * s);
  };
}

function generateSofaPixels(color) {
  return (ctx, size) => {
    const s = size / 16;
    ctx.fillStyle = color;
    ctx.fillRect(0, 4 * s, 16 * s, 10 * s);
    ctx.fillStyle = adjustColor(color, 20);
    ctx.fillRect(0, 0, 3 * s, 16 * s);
    ctx.fillRect(13 * s, 0, 3 * s, 16 * s);
    ctx.fillRect(3 * s, 0, 10 * s, 4 * s);
  };
}

function generateTablePixels(color) {
  return (ctx, size) => {
    const s = size / 16;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 16 * s, 16 * s);
    ctx.fillStyle = adjustColor(color, -30);
    ctx.fillRect(2 * s, 2 * s, 12 * s, 12 * s);
  };
}

function generateBookshelfPixels() {
  return (ctx, size) => {
    const s = size / 16;
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, 0, 16 * s, 16 * s);
    ctx.fillStyle = '#654321';
    ctx.fillRect(1 * s, 1 * s, 14 * s, 4 * s);
    ctx.fillRect(1 * s, 6 * s, 14 * s, 4 * s);
    ctx.fillRect(1 * s, 11 * s, 14 * s, 4 * s);
    const bookColors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6'];
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = bookColors[(row + i) % 5];
        ctx.fillRect((2 + i * 2.5) * s, (2 + row * 5) * s, 2 * s, 3 * s);
      }
    }
  };
}

function generateLampPixels(lightColor) {
  return (ctx, size) => {
    const s = size / 16;
    ctx.fillStyle = '#333';
    ctx.fillRect(6 * s, 12 * s, 4 * s, 4 * s);
    ctx.fillRect(7 * s, 4 * s, 2 * s, 8 * s);
    ctx.fillStyle = lightColor;
    ctx.beginPath();
    ctx.arc(8 * s, 4 * s, 5 * s, Math.PI, 0);
    ctx.fill();
  };
}

function generateRugPixels(color) {
  return (ctx, size) => {
    const s = size / 16;
    ctx.fillStyle = color;
    ctx.fillRect(0, 2 * s, 16 * s, 12 * s);
    ctx.fillStyle = adjustColor(color, 30);
    ctx.fillRect(2 * s, 4 * s, 12 * s, 8 * s);
    ctx.fillStyle = adjustColor(color, -30);
    ctx.fillRect(4 * s, 6 * s, 8 * s, 4 * s);
  };
}

function generatePosterPixels() {
  return (ctx, size) => {
    const s = size / 16;
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, 16 * s, 16 * s);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(2 * s, 2 * s, 12 * s, 8 * s);
    ctx.fillStyle = '#fff';
    ctx.fillRect(4 * s, 4 * s, 8 * s, 4 * s);
  };
}

function generatePlantPixels(type) {
  return (ctx, size) => {
    const s = size / 16;
    ctx.fillStyle = '#8B4513';
    const potHeight = type === 'big' ? 4 : 5;
    ctx.fillRect(4 * s, (16 - potHeight) * s, 8 * s, potHeight * s);
    ctx.fillStyle = '#228B22';
    const leafStart = type === 'big' ? 12 : 11;
    ctx.beginPath();
    ctx.arc(8 * s, leafStart * s, 6 * s, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#32CD32';
    ctx.beginPath();
    ctx.arc(6 * s, (leafStart - 2) * s, 3 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(10 * s, (leafStart - 2) * s, 3 * s, 0, Math.PI * 2);
    ctx.fill();
  };
}

function generateFlowerPixels() {
  return (ctx, size) => {
    const s = size / 16;
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(5 * s, 10 * s, 6 * s, 6 * s);
    ctx.fillStyle = '#228B22';
    ctx.fillRect(7 * s, 4 * s, 2 * s, 6 * s);
    ctx.fillStyle = '#FF69B4';
    ctx.beginPath();
    ctx.arc(8 * s, 3 * s, 4 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(8 * s, 3 * s, 1.5 * s, 0, Math.PI * 2);
    ctx.fill();
  };
}

function generateTVPixels() {
  return (ctx, size) => {
    const s = size / 16;
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 2 * s, 16 * s, 12 * s);
    ctx.fillStyle = '#4a90d9';
    ctx.fillRect(1 * s, 3 * s, 14 * s, 10 * s);
    ctx.fillStyle = '#333';
    ctx.fillRect(6 * s, 14 * s, 4 * s, 2 * s);
  };
}

function generateComputerPixels() {
  return (ctx, size) => {
    const s = size / 16;
    ctx.fillStyle = '#333';
    ctx.fillRect(2 * s, 0, 12 * s, 10 * s);
    ctx.fillStyle = '#4a90d9';
    ctx.fillRect(3 * s, 1 * s, 10 * s, 8 * s);
    ctx.fillStyle = '#666';
    ctx.fillRect(6 * s, 10 * s, 4 * s, 2 * s);
    ctx.fillRect(4 * s, 12 * s, 8 * s, 4 * s);
  };
}

function generateGamePixels() {
  return (ctx, size) => {
    const s = size / 16;
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(2 * s, 4 * s, 12 * s, 8 * s);
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(4 * s, 6 * s, 3 * s, 4 * s);
    ctx.fillRect(9 * s, 6 * s, 3 * s, 4 * s);
  };
}

function generateFridgePixels() {
  return (ctx, size) => {
    const s = size / 16;
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(0, 0, 16 * s, 16 * s);
    ctx.fillStyle = '#bbb';
    ctx.fillRect(0, 0, 16 * s, 8 * s);
    ctx.fillStyle = '#666';
    ctx.fillRect(12 * s, 3 * s, 2 * s, 2 * s);
    ctx.fillRect(12 * s, 11 * s, 2 * s, 2 * s);
  };
}

function generateWardrobePixels() {
  return (ctx, size) => {
    const s = size / 16;
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, 0, 16 * s, 16 * s);
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, 0, 7 * s, 16 * s);
    ctx.fillRect(9 * s, 0, 7 * s, 16 * s);
    ctx.fillStyle = '#DAA520';
    ctx.fillRect(5 * s, 7 * s, 2 * s, 2 * s);
    ctx.fillRect(9 * s, 7 * s, 2 * s, 2 * s);
  };
}

function generateMirrorPixels() {
  return (ctx, size) => {
    const s = size / 16;
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, 0, 16 * s, 16 * s);
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(2 * s, 2 * s, 12 * s, 12 * s);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(4 * s, 4 * s, 4 * s, 6 * s);
  };
}

function generateWindowPixels() {
  return (ctx, size) => {
    const s = size / 16;
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, 16 * s, 16 * s);
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(7 * s, 0, 2 * s, 16 * s);
    ctx.fillRect(0, 7 * s, 16 * s, 2 * s);
    ctx.fillStyle = '#fff';
    ctx.fillRect(3 * s, 3 * s, 2 * s, 2 * s);
    ctx.fillRect(11 * s, 3 * s, 2 * s, 2 * s);
  };
}

function generateBathtubPixels() {
  return (ctx, size) => {
    const s = size / 16;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(8 * s, 8 * s, 7 * s, 5 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e0e0e0';
    ctx.beginPath();
    ctx.ellipse(8 * s, 8 * s, 5 * s, 3 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#87CEEB';
    ctx.beginPath();
    ctx.ellipse(8 * s, 8 * s, 4 * s, 2 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ccc';
    ctx.fillRect(12 * s, 2 * s, 2 * s, 3 * s);
  };
}

function generateToiletPixels() {
  return (ctx, size) => {
    const s = size / 16;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(8 * s, 10 * s, 5 * s, 4 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(4 * s, 2 * s, 8 * s, 5 * s);
    ctx.fillStyle = '#ddd';
    ctx.fillRect(5 * s, 3 * s, 6 * s, 3 * s);
  };
}

function generateSinkPixels() {
  return (ctx, size) => {
    const s = size / 16;
    ctx.fillStyle = '#fff';
    ctx.fillRect(2 * s, 4 * s, 12 * s, 8 * s);
    ctx.fillStyle = '#e0e0e0';
    ctx.beginPath();
    ctx.ellipse(8 * s, 8 * s, 4 * s, 3 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#87CEEB';
    ctx.beginPath();
    ctx.ellipse(8 * s, 8 * s, 2 * s, 1.5 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ccc';
    ctx.fillRect(7 * s, 1 * s, 2 * s, 4 * s);
  };
}

function generateStovePixels() {
  return (ctx, size) => {
    const s = size / 16;
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, 16 * s, 16 * s);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(2 * s, 2 * s, 5 * s, 5 * s);
    ctx.fillRect(9 * s, 2 * s, 5 * s, 5 * s);
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(4.5 * s, 4.5 * s, 1.5 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(11.5 * s, 4.5 * s, 1.5 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#666';
    ctx.fillRect(2 * s, 10 * s, 12 * s, 4 * s);
  };
}

function generateKitchenCounterPixels() {
  return (ctx, size) => {
    const s = size / 16;
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, 0, 16 * s, 16 * s);
    ctx.fillStyle = '#654321';
    ctx.fillRect(1 * s, 1 * s, 14 * s, 6 * s);
    ctx.fillStyle = '#ddd';
    ctx.fillRect(2 * s, 8 * s, 4 * s, 6 * s);
    ctx.fillRect(8 * s, 8 * s, 6 * s, 6 * s);
    ctx.fillStyle = '#87CEEB';
    ctx.beginPath();
    ctx.arc(11 * s, 11 * s, 2 * s, 0, Math.PI * 2);
    ctx.fill();
  };
}

function adjustColor(hex, amt) {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  r = Math.max(0, Math.min(255, r + amt));
  g = Math.max(0, Math.min(255, g + amt));
  b = Math.max(0, Math.min(255, b + amt));
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function renderSprite(sprite, canvas, size = 96) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, size, size);
  
  const scale = size / 96;
  const skin = sprite.skin || '#fde8c8';
  const hair = sprite.haircolor || '#2d1b00';
  const outfit = sprite.outfitcolor || '#ff6b9d';
  
  ctx.save();
  ctx.scale(scale, scale);
  
  ctx.fillStyle = skin;
  if (sprite.body === 'slim') {
    ctx.fillRect(36, 32, 24, 44);
    ctx.fillRect(34, 76, 10, 16);
    ctx.fillRect(52, 76, 10, 16);
    ctx.fillRect(28, 34, 8, 28);
    ctx.fillRect(60, 34, 8, 28);
  } else {
    ctx.fillRect(32, 32, 32, 44);
    ctx.fillRect(30, 76, 14, 16);
    ctx.fillRect(52, 76, 14, 16);
    ctx.fillRect(22, 34, 10, 28);
    ctx.fillRect(64, 34, 10, 28);
  }
  
  ctx.fillStyle = skin;
  ctx.fillRect(32, 8, 32, 28);
  ctx.fillStyle = '#1a0a00';
  ctx.fillRect(36, 20, 4, 4);
  ctx.fillRect(56, 20, 4, 4);
  ctx.fillStyle = '#ff9999';
  ctx.fillRect(40, 26, 16, 3);
  
  ctx.fillStyle = outfit;
  ctx.fillRect(32, 44, 32, 28);
  ctx.fillStyle = adjustColor(outfit, 20);
  ctx.fillRect(32, 72, 32, 20);
  
  ctx.fillStyle = hair;
  ctx.fillRect(32, 4, 32, 16);
  ctx.fillRect(28, 8, 8, 16);
  ctx.fillRect(60, 8, 8, 16);
  
  ctx.restore();
  return canvas;
}

function init() {
  loadSavedData();
  initMap();
  renderFurnitureCatalog();
  updateBalance();
  
  if (window.lucide) lucide.createIcons();
}

function loadSavedData() {
  try {
    const saved = localStorage.getItem('sx_home_data');
    if (saved) {
      const data = JSON.parse(saved);
      
      if (data.placedFurniture) {
        if (Array.isArray(data.placedFurniture.user)) {
          HomeApp.placedFurniture = {
            user: {
              living_room: data.placedFurniture.user || [],
              bedroom: [],
              bathroom: [],
              study: [],
              kitchen: [],
              balcony: []
            }
          };
        } else {
          HomeApp.placedFurniture = data.placedFurniture;
        }
      }
      
      if (!HomeApp.placedFurniture.user) {
        HomeApp.placedFurniture.user = {
          living_room: [],
          bedroom: [],
          bathroom: [],
          study: [],
          kitchen: [],
          balcony: []
        };
      }
      
      Object.keys(ROOM_TYPES).forEach(room => {
        if (!HomeApp.placedFurniture.user[room]) {
          HomeApp.placedFurniture.user[room] = [];
        }
      });
      
      HomeApp.roomStyle = data.roomStyle || 'modern';
      HomeApp.floorColor = data.floorColor || ROOM_STYLES[HomeApp.roomStyle].floor;
      HomeApp.wallColor = data.wallColor || ROOM_STYLES[HomeApp.roomStyle].wall;
      if (data.characterSprite) {
        HomeApp.characterSprite = data.characterSprite;
      }
      HomeApp.properties = data.properties || [];
    }
    
    const userSprite = localStorage.getItem('sx_user_sprite');
    if (userSprite && !HomeApp.characterSprite.user) {
      HomeApp.characterSprite.user = JSON.parse(userSprite);
    }
    
    initializeDefaultFurniture();
  } catch (e) {
    console.warn('載入儲存資料失敗:', e);
  }
}

function initializeDefaultFurniture() {
  Object.keys(ROOM_TYPES).forEach(roomKey => {
    const room = ROOM_TYPES[roomKey];
    const furniture = HomeApp.placedFurniture.user[roomKey];
    
    if (!furniture || furniture.length === 0) {
      const defaultItems = room.defaultFurniture || [];
      let offsetX = 1;
      let offsetY = 1;
      
      defaultItems.forEach(itemId => {
        const catalogItem = FURNITURE_CATALOG.find(f => f.id === itemId);
        if (catalogItem) {
          furniture.push({
            id: itemId,
            x: offsetX,
            y: offsetY,
            rotation: 0
          });
          offsetX += catalogItem.width + 1;
          if (offsetX > HomeApp.roomWidth - 3) {
            offsetX = 1;
            offsetY += 3;
          }
        }
      });
    }
  });
}

function saveData() {
  try {
    const data = {
      placedFurniture: HomeApp.placedFurniture,
      roomStyle: HomeApp.roomStyle,
      floorColor: HomeApp.floorColor,
      wallColor: HomeApp.wallColor,
      characterSprite: HomeApp.characterSprite,
      properties: HomeApp.properties
    };
    localStorage.setItem('sx_home_data', JSON.stringify(data));
  } catch (e) {
    console.warn('儲存資料失敗:', e);
  }
}

function updateBalance() {
  const balance = getBalance();
  const el = document.getElementById('current-balance');
  if (el) el.textContent = formatCurrency(balance);
}

function getBalance() {
  try {
    const raw = localStorage.getItem('sxiphone.kakaopay.ledger.v1');
    if (!raw) return 30000;
    const data = JSON.parse(raw);
    const income = data.transactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) || 0;
    const expense = data.transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) || 0;
    return 30000 + income - expense;
  } catch (e) {
    return 30000;
  }
}

function formatCurrency(n) {
  const lang = localStorage.getItem('sxiphone_lang') || 'zh-Hant';
  const localeCode = window.getLocaleStringLang?.(lang) || 'zh-TW';
  return n.toLocaleString(localeCode);
}

function initMap() {
  HomeApp.mapCanvas = document.getElementById('map-canvas');
  if (!HomeApp.mapCanvas) {
    console.error('Map canvas not found');
    return;
  }
  HomeApp.mapCtx = HomeApp.mapCanvas.getContext('2d');
  
  generateTownMap();
  
  setTimeout(() => {
    resizeMapCanvas();
  }, 50);
  
  window.addEventListener('resize', resizeMapCanvas);
  
  HomeApp.mapCanvas.addEventListener('click', handleMapClick);
  HomeApp.mapCanvas.addEventListener('mousedown', handleMapDragStart);
  HomeApp.mapCanvas.addEventListener('mousemove', handleMapDragMove);
  HomeApp.mapCanvas.addEventListener('mouseup', handleMapDragEnd);
  HomeApp.mapCanvas.addEventListener('mouseleave', handleMapDragEnd);
}

function generateTownMap() {
  const map = [];
  for (let y = 0; y < MAP_CONFIG.height; y++) {
    map[y] = [];
    for (let x = 0; x < MAP_CONFIG.width; x++) {
      map[y][x] = TILE_TYPES.GRASS;
    }
  }
  
  const roadY = Math.floor(MAP_CONFIG.height / 2);
  for (let x = 0; x < MAP_CONFIG.width; x++) {
    map[roadY][x] = TILE_TYPES.ROAD_H;
    map[roadY + 1][x] = TILE_TYPES.ROAD_H;
  }
  
  const roadX = Math.floor(MAP_CONFIG.width / 2);
  for (let y = 0; y < MAP_CONFIG.height; y++) {
    if (y >= roadY && y <= roadY + 1) {
      map[y][roadX] = TILE_TYPES.ROAD_CROSS;
      map[y][roadX + 1] = TILE_TYPES.ROAD_CROSS;
    } else {
      map[y][roadX] = TILE_TYPES.ROAD_V;
      map[y][roadX + 1] = TILE_TYPES.ROAD_V;
    }
  }
  
  for (let x = 0; x < MAP_CONFIG.width; x++) {
    if (x === roadX || x === roadX + 1) continue;
    map[roadY - 1][x] = TILE_TYPES.SIDEWALK;
    map[roadY + 2][x] = TILE_TYPES.SIDEWALK;
  }
  
  for (let y = 0; y < MAP_CONFIG.height; y++) {
    if (y >= roadY - 1 && y <= roadY + 2) continue;
    map[y][roadX - 1] = TILE_TYPES.SIDEWALK;
    map[y][roadX + 2] = TILE_TYPES.SIDEWALK;
  }
  
  map[roadY][roadX - 2] = TILE_TYPES.CROSSWALK;
  map[roadY + 1][roadX - 2] = TILE_TYPES.CROSSWALK;
  map[roadY][roadX + 3] = TILE_TYPES.CROSSWALK;
  map[roadY + 1][roadX + 3] = TILE_TYPES.CROSSWALK;
  
  HomeApp.townMap = map;
  HomeApp.buildings = [];
  
  HomeApp.buildings.push({
    type: 'PLAYER_HOUSE',
    x: roadX - 4,
    y: roadY - 4,
    width: 2,
    height: 2,
    data: BUILDINGS.PLAYER_HOUSE
  });
  
  HomeApp.buildings.push({
    type: 'CONVENIENCE',
    x: roadX + 3,
    y: roadY - 4,
    width: 2,
    height: 2,
    data: BUILDINGS.CONVENIENCE
  });
  
  HomeApp.buildings.push({
    type: 'CAFE',
    x: roadX - 7,
    y: roadY - 4,
    width: 2,
    height: 2,
    data: BUILDINGS.CAFE
  });
  
  HomeApp.buildings.push({
    type: 'SUPERMARKET',
    x: roadX + 6,
    y: roadY - 4,
    width: 3,
    height: 2,
    data: BUILDINGS.SUPERMARKET
  });
  
  HomeApp.buildings.push({
    type: 'PARK',
    x: roadX - 7,
    y: roadY + 3,
    width: 4,
    height: 3,
    data: BUILDINGS.PARK
  });
  
  HomeApp.emptyLots = [];
  HomeApp.emptyLots.push({ x: roadX - 4, y: roadY + 3, width: 2, height: 2 });
  HomeApp.emptyLots.push({ x: roadX + 3, y: roadY + 3, width: 2, height: 2 });
  HomeApp.emptyLots.push({ x: roadX + 6, y: roadY + 3, width: 2, height: 2 });
  
  addDecorations(map, roadY);
}

function addDecorations(map, roadY) {
  HomeApp.decorations = [];
  
  const treePositions = [
    { x: 2, y: 2 }, { x: 5, y: 1 }, { x: 15, y: 2 }, { x: 18, y: 1 },
    { x: 1, y: 10 }, { x: 4, y: 12 }, { x: 16, y: 11 }, { x: 18, y: 13 }
  ];
  
  treePositions.forEach(pos => {
    if (pos.x < MAP_CONFIG.width && pos.y < MAP_CONFIG.height) {
      HomeApp.decorations.push({ type: 'tree', x: pos.x, y: pos.y });
    }
  });
  
  const lampPositions = [
    { x: 4, y: roadY - 2 }, { x: 10, y: roadY - 2 },
    { x: 4, y: roadY + 3 }, { x: 10, y: roadY + 3 }
  ];
  
  lampPositions.forEach(pos => {
    if (pos.x < MAP_CONFIG.width && pos.y < MAP_CONFIG.height) {
      HomeApp.decorations.push({ type: 'lamp', x: pos.x, y: pos.y });
    }
  });
  
  const flowerPositions = [
    { x: 3, y: 3 }, { x: 14, y: 3 }, { x: 17, y: 12 }
  ];
  
  flowerPositions.forEach(pos => {
    if (pos.x < MAP_CONFIG.width && pos.y < MAP_CONFIG.height) {
      HomeApp.decorations.push({ type: 'flower', x: pos.x, y: pos.y });
    }
  });
}

function resizeMapCanvas() {
  const container = document.querySelector('.map-container');
  if (!container) return;
  
  const rect = container.getBoundingClientRect();
  
  if (rect.width === 0 || rect.height === 0) {
    setTimeout(() => resizeMapCanvas(), 100);
    return;
  }
  
  HomeApp.mapCanvas.width = rect.width;
  HomeApp.mapCanvas.height = rect.height;
  
  renderMap();
}

function renderMap() {
  const ctx = HomeApp.mapCtx;
  const canvas = HomeApp.mapCanvas;
  
  if (!ctx || !canvas || canvas.width === 0 || canvas.height === 0) return;
  
  ctx.fillStyle = '#1a3d1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  const tileSize = MAP_CONFIG.tileSize * HomeApp.mapScale;
  const mapWidth = MAP_CONFIG.width * tileSize;
  const mapHeight = MAP_CONFIG.height * tileSize;
  const offsetX = (canvas.width - mapWidth) / 2 + HomeApp.mapOffset.x;
  const offsetY = (canvas.height - mapHeight) / 2 + HomeApp.mapOffset.y;
  
  renderTiles(ctx, offsetX, offsetY, tileSize);
  renderDecorations(ctx, offsetX, offsetY, tileSize);
  renderBuildings(ctx, offsetX, offsetY, tileSize);
  renderEmptyLots(ctx, offsetX, offsetY, tileSize);
  renderPlayerProperties(ctx, offsetX, offsetY, tileSize);
}

function renderTiles(ctx, offsetX, offsetY, tileSize) {
  const map = HomeApp.townMap;
  if (!map) return;
  
  for (let y = 0; y < MAP_CONFIG.height; y++) {
    for (let x = 0; x < MAP_CONFIG.width; x++) {
      const px = offsetX + x * tileSize;
      const py = offsetY + y * tileSize;
      const tileType = map[y][x];
      
      drawTile(ctx, px, py, tileSize, tileType);
    }
  }
}

function drawTile(ctx, x, y, size, type) {
  switch (type) {
    case TILE_TYPES.GRASS:
      ctx.fillStyle = '#2d5a27';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#3a6b34';
      for (let i = 0; i < 3; i++) {
        const gx = x + Math.random() * size;
        const gy = y + Math.random() * size;
        ctx.fillRect(gx, gy, 2, 4);
      }
      break;
      
    case TILE_TYPES.ROAD_H:
    case TILE_TYPES.ROAD_V:
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#4a4a4a';
      ctx.fillRect(x + size * 0.1, y + size * 0.4, size * 0.8, size * 0.2);
      ctx.fillStyle = '#ffcc00';
      if (type === TILE_TYPES.ROAD_H) {
        ctx.fillRect(x + size * 0.2, y + size * 0.45, size * 0.3, size * 0.1);
      } else {
        ctx.fillRect(x + size * 0.45, y + size * 0.2, size * 0.1, size * 0.3);
      }
      break;
      
    case TILE_TYPES.ROAD_CROSS:
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#4a4a4a';
      ctx.fillRect(x + size * 0.1, y + size * 0.1, size * 0.8, size * 0.8);
      break;
      
    case TILE_TYPES.SIDEWALK:
      ctx.fillStyle = '#8a8a8a';
      ctx.fillRect(x, y, size, size);
      ctx.strokeStyle = '#7a7a7a';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
      break;
      
    case TILE_TYPES.CROSSWALK:
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(x + size * 0.15, y + size * (0.1 + i * 0.25), size * 0.7, size * 0.15);
      }
      break;
      
    default:
      ctx.fillStyle = '#2d5a27';
      ctx.fillRect(x, y, size, size);
  }
}

function renderDecorations(ctx, offsetX, offsetY, tileSize) {
  if (!HomeApp.decorations) return;
  
  HomeApp.decorations.forEach(dec => {
    const px = offsetX + dec.x * tileSize;
    const py = offsetY + dec.y * tileSize;
    
    if (dec.type === 'tree') {
      drawTree(ctx, px, py, tileSize);
    } else if (dec.type === 'lamp') {
      drawLamp(ctx, px, py, tileSize);
    } else if (dec.type === 'flower') {
      drawFlowerPatch(ctx, px, py, tileSize);
    }
  });
}

function drawTree(ctx, x, y, size) {
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(x + size * 0.4, y + size * 0.6, size * 0.2, size * 0.4);
  
  ctx.fillStyle = '#228B22';
  ctx.beginPath();
  ctx.arc(x + size * 0.5, y + size * 0.4, size * 0.35, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#32CD32';
  ctx.beginPath();
  ctx.arc(x + size * 0.35, y + size * 0.3, size * 0.15, 0, Math.PI * 2);
  ctx.fill();
}

function drawLamp(ctx, x, y, size) {
  ctx.fillStyle = '#333';
  ctx.fillRect(x + size * 0.45, y + size * 0.3, size * 0.1, size * 0.6);
  
  ctx.fillStyle = '#666';
  ctx.fillRect(x + size * 0.35, y + size * 0.25, size * 0.3, size * 0.1);
  
  ctx.fillStyle = '#ffeb3b';
  ctx.beginPath();
  ctx.arc(x + size * 0.5, y + size * 0.2, size * 0.1, 0, Math.PI * 2);
  ctx.fill();
}

function drawFlowerPatch(ctx, x, y, size) {
  const colors = ['#FF69B4', '#FFD700', '#FF6347', '#9370DB'];
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = colors[i];
    ctx.beginPath();
    ctx.arc(x + size * (0.2 + i * 0.2), y + size * 0.5, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderBuildings(ctx, offsetX, offsetY, tileSize) {
  if (!HomeApp.buildings) return;
  
  HomeApp.buildings.forEach(building => {
    const px = offsetX + building.x * tileSize;
    const py = offsetY + building.y * tileSize;
    const width = building.width * tileSize;
    const height = building.height * tileSize;
    
    if (building.data.isPark) {
      drawPark(ctx, px, py, width, height, tileSize);
    } else {
      drawBuilding(ctx, px, py, width, height, building.data, tileSize);
    }
  });
}

function drawBuilding(ctx, x, y, width, height, data, tileSize) {
  ctx.fillStyle = data.roofColor || '#8B4513';
  ctx.beginPath();
  ctx.moveTo(x, y + height * 0.3);
  ctx.lineTo(x + width / 2, y);
  ctx.lineTo(x + width, y + height * 0.3);
  ctx.closePath();
  ctx.fill();
  
  ctx.fillStyle = data.color;
  ctx.fillRect(x, y + height * 0.3, width, height * 0.7);
  
  ctx.fillStyle = '#87CEEB';
  const winWidth = width * 0.15;
  const winHeight = height * 0.2;
  ctx.fillRect(x + width * 0.15, y + height * 0.4, winWidth, winHeight);
  ctx.fillRect(x + width * 0.55, y + height * 0.4, winWidth, winHeight);
  
  ctx.fillStyle = '#8B4513';
  const doorWidth = width * 0.2;
  const doorHeight = height * 0.35;
  ctx.fillRect(x + width * 0.4, y + height * 0.65, doorWidth, doorHeight);
  
  ctx.fillStyle = '#eaeaea';
  ctx.font = `${Math.max(10, tileSize * 0.25)}px "Noto Sans TC"`;
  ctx.textAlign = 'center';
  ctx.fillText(data.name, x + width / 2, y + height + 15);
}

function drawPark(ctx, x, y, width, height, tileSize) {
  ctx.fillStyle = '#228B22';
  ctx.fillRect(x, y, width, height);
  
  ctx.fillStyle = '#1a6b1a';
  for (let i = 0; i < 3; i++) {
    const tx = x + width * (0.2 + i * 0.3);
    const ty = y + height * 0.5;
    ctx.beginPath();
    ctx.arc(tx, ty, tileSize * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.fillStyle = '#4169E1';
  ctx.beginPath();
  ctx.ellipse(x + width * 0.7, y + height * 0.7, tileSize * 0.4, tileSize * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#eaeaea';
  ctx.font = `${Math.max(10, tileSize * 0.25)}px "Noto Sans TC"`;
  ctx.textAlign = 'center';
  ctx.fillText('公園', x + width / 2, y + height + 15);
}

function renderEmptyLots(ctx, offsetX, offsetY, tileSize) {
  if (!HomeApp.emptyLots) return;
  
  HomeApp.emptyLots.forEach((lot, idx) => {
    const px = offsetX + lot.x * tileSize;
    const py = offsetY + lot.y * tileSize;
    const width = lot.width * tileSize;
    const height = lot.height * tileSize;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(px, py, width, height);
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(px, py, width, height);
    ctx.setLineDash([]);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = `${Math.max(10, tileSize * 0.25)}px "Noto Sans TC"`;
    ctx.textAlign = 'center';
    ctx.fillText('空地', px + width / 2, py + height / 2 - 5);
    ctx.fillText('點擊購買', px + width / 2, py + height / 2 + 15);
    
    lot.renderX = px;
    lot.renderY = py;
    lot.renderWidth = width;
    lot.renderHeight = height;
  });
}

function renderPlayerProperties(ctx, offsetX, offsetY, tileSize) {
  const chars = JSON.parse(localStorage.getItem('sx_characters') || '[]');
  
  HomeApp.properties.forEach((property, idx) => {
    const char = chars[property.charIdx];
    const charName = char?.name || 'TA';
    
    const lot = HomeApp.emptyLots[idx];
    if (!lot) return;
    
    const px = lot.renderX || (offsetX + lot.x * tileSize);
    const py = lot.renderY || (offsetY + lot.y * tileSize);
    const width = lot.renderWidth || (lot.width * tileSize);
    const height = lot.renderHeight || (lot.height * tileSize);
    
    const data = property.type === 'shared' ? BUILDINGS.SHARED_HOUSE : BUILDINGS.CHAR_HOUSE;
    
    ctx.fillStyle = data.roofColor;
    ctx.beginPath();
    ctx.moveTo(px, py + height * 0.3);
    ctx.lineTo(px + width / 2, py);
    ctx.lineTo(px + width, py + height * 0.3);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = data.color;
    ctx.fillRect(px, py + height * 0.3, width, height * 0.7);
    
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(px + width * 0.15, py + height * 0.4, width * 0.15, height * 0.2);
    ctx.fillRect(px + width * 0.55, py + height * 0.4, width * 0.15, height * 0.2);
    
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(px + width * 0.4, py + height * 0.65, width * 0.2, height * 0.35);
    
    const label = property.type === 'shared' ? `與${charName}的家` : `${charName}的家`;
    ctx.fillStyle = '#eaeaea';
    ctx.font = `${Math.max(10, tileSize * 0.22)}px "Noto Sans TC"`;
    ctx.textAlign = 'center';
    ctx.fillText(label, px + width / 2, py + height + 15);
    
    property.renderX = px;
    property.renderY = py;
    property.renderWidth = width;
    property.renderHeight = height;
  });
}

function handleMapClick(e) {
  if (HomeApp.isDragging) return;
  
  const rect = HomeApp.mapCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  const tileSize = MAP_CONFIG.tileSize * HomeApp.mapScale;
  const mapWidth = MAP_CONFIG.width * tileSize;
  const mapHeight = MAP_CONFIG.height * tileSize;
  const offsetX = (HomeApp.mapCanvas.width - mapWidth) / 2 + HomeApp.mapOffset.x;
  const offsetY = (HomeApp.mapCanvas.height - mapHeight) / 2 + HomeApp.mapOffset.y;
  
  const playerHouse = HomeApp.buildings.find(b => b.type === 'PLAYER_HOUSE');
  if (playerHouse) {
    const px = offsetX + playerHouse.x * tileSize;
    const py = offsetY + playerHouse.y * tileSize;
    const pw = playerHouse.width * tileSize;
    const ph = playerHouse.height * tileSize;
    
    if (x >= px && x <= px + pw && y >= py && y <= py + ph) {
      enterRoom('user');
      return;
    }
  }
  
  for (const property of HomeApp.properties) {
    if (property.renderX !== undefined) {
      if (x >= property.renderX && x <= property.renderX + property.renderWidth &&
          y >= property.renderY && y <= property.renderY + property.renderHeight) {
        enterProperty(HomeApp.properties.indexOf(property));
        return;
      }
    }
  }
  
  for (const lot of HomeApp.emptyLots) {
    if (lot.renderX !== undefined) {
      if (x >= lot.renderX && x <= lot.renderX + lot.renderWidth &&
          y >= lot.renderY && y <= lot.renderY + lot.renderHeight) {
        openBuyModal(lot);
        return;
      }
    }
  }
  
  for (const building of HomeApp.buildings) {
    if (building.data.isShop) {
      const bx = offsetX + building.x * tileSize;
      const by = offsetY + building.y * tileSize;
      const bw = building.width * tileSize;
      const bh = building.height * tileSize;
      
      if (x >= bx && x <= bx + bw && y >= by && y <= by + bh) {
        showShopInfo(building);
        return;
      }
    }
  }
}

function handleMapDragStart(e) {
  HomeApp.isDragging = false;
  HomeApp.dragStartX = e.clientX;
  HomeApp.dragStartY = e.clientY;
  HomeApp.lastMapOffsetX = HomeApp.mapOffset.x;
  HomeApp.lastMapOffsetY = HomeApp.mapOffset.y;
}

function handleMapDragMove(e) {
  if (HomeApp.dragStartX === null) return;
  
  const dx = e.clientX - HomeApp.dragStartX;
  const dy = e.clientY - HomeApp.dragStartY;
  
  if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
    HomeApp.isDragging = true;
  }
  
  HomeApp.mapOffset.x = HomeApp.lastMapOffsetX + dx;
  HomeApp.mapOffset.y = HomeApp.lastMapOffsetY + dy;
  
  renderMap();
}

function handleMapDragEnd() {
  HomeApp.dragStartX = null;
  HomeApp.dragStartY = null;
  setTimeout(() => { HomeApp.isDragging = false; }, 100);
}

function showShopInfo(building) {
  alert(`${building.data.name}\n營業中！`);
}

function enterRoom(roomKey) {
  HomeApp.currentRoom = roomKey;
  HomeApp.currentSubRoom = 'living_room';
  
  const titleEl = document.querySelector('#room-view .app-title');
  if (titleEl) titleEl.textContent = '我的小屋';
  
  document.getElementById('map-view').classList.add('hidden');
  document.getElementById('room-view').classList.remove('hidden');
  
  renderRoomTabs();
  initRoomCanvas();
  renderRoom();
  renderCharacter();
  
  if (window.lucide) lucide.createIcons();
}

function renderRoomTabs() {
  const tabsContainer = document.getElementById('room-tabs');
  if (!tabsContainer) return;
  
  tabsContainer.innerHTML = '';
  
  Object.keys(ROOM_TYPES).forEach(roomKey => {
    const room = ROOM_TYPES[roomKey];
    const tab = document.createElement('button');
    tab.className = `room-tab ${roomKey === HomeApp.currentSubRoom ? 'active' : ''}`;
    tab.dataset.room = roomKey;
    tab.onclick = () => switchSubRoom(roomKey);
    
    tab.innerHTML = `
      <i data-lucide="${room.icon}"></i>
      <span>${room.name}</span>
    `;
    
    tabsContainer.appendChild(tab);
  });
  
  if (window.lucide) lucide.createIcons();
}

function switchSubRoom(roomKey) {
  HomeApp.currentSubRoom = roomKey;
  
  document.querySelectorAll('.room-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.room === roomKey);
  });
  
  const room = ROOM_TYPES[roomKey];
  if (room.floorColor) {
    HomeApp.floorColor = room.floorColor;
  } else {
    HomeApp.floorColor = ROOM_STYLES[HomeApp.roomStyle].floor;
  }
  
  if (room.wallColor) {
    HomeApp.wallColor = room.wallColor;
  } else {
    HomeApp.wallColor = ROOM_STYLES[HomeApp.roomStyle].wall;
  }
  
  renderRoom();
  renderCharacter();
}

function enterProperty(idx) {
  const property = HomeApp.properties[idx];
  if (!property) return;
  
  HomeApp.currentRoom = property.roomKey;
  HomeApp.currentSubRoom = 'living_room';
  
  const chars = JSON.parse(localStorage.getItem('sx_characters') || '[]');
  const char = chars[property.charIdx];
  
  const charName = char?.name || 'TA';
  const title = property.type === 'shared' ? `與${charName}的家` : `${charName}的家`;
  
  document.getElementById('map-view').classList.add('hidden');
  document.getElementById('room-view').classList.remove('hidden');
  
  const titleEl = document.querySelector('#room-view .app-title');
  if (titleEl) titleEl.textContent = title;
  
  if (!HomeApp.placedFurniture[property.roomKey]) {
    HomeApp.placedFurniture[property.roomKey] = {
      living_room: [],
      bedroom: [],
      bathroom: [],
      study: [],
      kitchen: [],
      balcony: []
    };
  }
  
  renderRoomTabs();
  initRoomCanvas();
  renderRoom();
  renderCharacter();
  
  if (window.lucide) lucide.createIcons();
}

function initRoomCanvas() {
  HomeApp.canvas = document.getElementById('room-canvas');
  HomeApp.ctx = HomeApp.canvas.getContext('2d');
  
  resizeRoomCanvas();
  
  HomeApp.canvas.addEventListener('click', handleCanvasClick);
  HomeApp.canvas.addEventListener('mousedown', handleMouseDown);
  HomeApp.canvas.addEventListener('mousemove', handleMouseMove);
  HomeApp.canvas.addEventListener('mouseup', handleMouseUp);
  HomeApp.canvas.addEventListener('contextmenu', handleContextMenu);
  
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.context-menu') && !e.target.closest('#room-canvas')) {
      hideContextMenu();
    }
  });
}

function resizeRoomCanvas() {
  const container = document.getElementById('room-container');
  if (!container) return;
  
  const rect = container.getBoundingClientRect();
  HomeApp.canvas.width = rect.width;
  HomeApp.canvas.height = rect.height;
  renderRoom();
}

function exitRoom() {
  if (HomeApp.editMode) {
    exitEditMode();
    return;
  }
  
  const panel = document.getElementById('furniture-panel');
  if (panel && panel.classList.contains('open')) {
    panel.classList.remove('open');
    return;
  }
  
  HomeApp.currentSubRoom = 'living_room';
  
  document.getElementById('room-view').classList.add('hidden');
  document.getElementById('map-view').classList.remove('hidden');
  
  renderMap();
  updateBalance();
  
  if (window.lucide) lucide.createIcons();
}

function renderRoom() {
  const ctx = HomeApp.ctx;
  const canvas = HomeApp.canvas;
  if (!ctx || !canvas) return;
  
  const gridSize = HomeApp.gridSize;
  const offsetX = (canvas.width - HomeApp.roomWidth * gridSize) / 2;
  const offsetY = (canvas.height - HomeApp.roomHeight * gridSize) / 2;
  
  const room = ROOM_TYPES[HomeApp.currentSubRoom];
  
  if (room.isOutdoor) {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.3, '#e0f0ff');
    gradient.addColorStop(1, '#8B7355');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(offsetX, offsetY + 2 * gridSize, HomeApp.roomWidth * gridSize, (HomeApp.roomHeight - 2) * gridSize);
  } else {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = HomeApp.wallColor;
    ctx.fillRect(offsetX, offsetY, HomeApp.roomWidth * gridSize, HomeApp.roomHeight * gridSize);
    
    ctx.fillStyle = HomeApp.floorColor;
    ctx.fillRect(offsetX, offsetY + 2 * gridSize, HomeApp.roomWidth * gridSize, (HomeApp.roomHeight - 2) * gridSize);
  }
  
  for (let x = 0; x <= HomeApp.roomWidth; x++) {
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.moveTo(offsetX + x * gridSize, offsetY);
    ctx.lineTo(offsetX + x * gridSize, offsetY + HomeApp.roomHeight * gridSize);
    ctx.stroke();
  }
  for (let y = 0; y <= HomeApp.roomHeight; y++) {
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY + y * gridSize);
    ctx.lineTo(offsetX + HomeApp.roomWidth * gridSize, offsetY + y * gridSize);
    ctx.stroke();
  }
  
  renderPlacedFurniture();
}

function getCurrentFurniture() {
  if (HomeApp.currentRoom === 'user') {
    return HomeApp.placedFurniture.user[HomeApp.currentSubRoom] || [];
  }
  
  if (!HomeApp.placedFurniture[HomeApp.currentRoom]) {
    HomeApp.placedFurniture[HomeApp.currentRoom] = {
      living_room: [],
      bedroom: [],
      bathroom: [],
      study: [],
      kitchen: [],
      balcony: []
    };
  }
  
  return HomeApp.placedFurniture[HomeApp.currentRoom][HomeApp.currentSubRoom] || [];
}

function renderPlacedFurniture() {
  const ctx = HomeApp.ctx;
  const canvas = HomeApp.canvas;
  const gridSize = HomeApp.gridSize;
  const offsetX = (canvas.width - HomeApp.roomWidth * gridSize) / 2;
  const offsetY = (canvas.height - HomeApp.roomHeight * gridSize) / 2;
  
  const furniture = getCurrentFurniture();
  
  furniture.forEach(item => {
    const catalogItem = FURNITURE_CATALOG.find(f => f.id === item.id);
    if (!catalogItem) return;
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = catalogItem.width * gridSize;
    tempCanvas.height = catalogItem.height * gridSize;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.imageSmoothingEnabled = false;
    
    if (catalogItem.pixels) {
      catalogItem.pixels(tempCtx, Math.max(catalogItem.width, catalogItem.height) * gridSize);
    }
    
    const x = offsetX + item.x * gridSize;
    const y = offsetY + item.y * gridSize;
    
    ctx.save();
    if (item.rotation) {
      ctx.translate(x + tempCanvas.width / 2, y + tempCanvas.height / 2);
      ctx.rotate((item.rotation * Math.PI) / 180);
      ctx.drawImage(tempCanvas, -tempCanvas.width / 2, -tempCanvas.height / 2);
    } else {
      ctx.drawImage(tempCanvas, x, y);
    }
    ctx.restore();
  });
}

function renderCharacter() {
  const layer = document.getElementById('character-layer');
  layer.innerHTML = '';
  
  const gridSize = HomeApp.gridSize;
  const offsetX = (HomeApp.canvas.width - HomeApp.roomWidth * gridSize) / 2;
  const offsetY = (HomeApp.canvas.height - HomeApp.roomHeight * gridSize) / 2;
  
  const sprite = HomeApp.characterSprite.user;
  if (!sprite) return;
  
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  canvas.style.position = 'absolute';
  canvas.style.imageRendering = 'pixelated';
  canvas.style.left = (offsetX + (HomeApp.roomWidth / 2 - 1) * gridSize) + 'px';
  canvas.style.top = (offsetY + (HomeApp.roomHeight / 2 - 1) * gridSize) + 'px';
  renderSprite(sprite, canvas, 64);
  layer.appendChild(canvas);
}

function renderFurnitureCatalog() {
  const grid = document.getElementById('furniture-grid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  FURNITURE_CATALOG.forEach(item => {
    const div = document.createElement('div');
    div.className = 'furniture-item';
    div.dataset.id = item.id;
    div.onclick = () => selectFurnitureToAdd(item.id);
    
    const canvas = document.createElement('canvas');
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    
    if (item.pixels) {
      item.pixels(ctx, 48);
    }
    
    const name = document.createElement('span');
    name.textContent = item.name;
    
    div.appendChild(canvas);
    div.appendChild(name);
    grid.appendChild(div);
  });
}

function selectCategory(category) {
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === category);
  });
  
  const items = document.querySelectorAll('.furniture-item');
  items.forEach(item => {
    const furniture = FURNITURE_CATALOG.find(f => f.id === item.dataset.id);
    if (category === 'all' || furniture?.category === category) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
}

function selectFurnitureToAdd(id) {
  const furniture = FURNITURE_CATALOG.find(f => f.id === id);
  if (!furniture) return;
  
  const newFurniture = {
    id: id,
    x: Math.floor(HomeApp.roomWidth / 2 - furniture.width / 2),
    y: Math.floor(HomeApp.roomHeight / 2 - furniture.height / 2),
    rotation: 0
  };
  
  const currentFurniture = getCurrentFurniture();
  currentFurniture.push(newFurniture);
  
  renderRoom();
  saveData();
  
  toggleFurniturePanel();
}

function toggleFurniturePanel() {
  const panel = document.getElementById('furniture-panel');
  panel.classList.toggle('open');
}

function enterEditMode() {
  HomeApp.editMode = true;
  document.getElementById('edit-mode-hint').classList.remove('hidden');
  
  const layer = document.getElementById('character-layer');
  layer.style.pointerEvents = 'auto';
  
  HomeApp.canvas.style.cursor = 'pointer';
}

function exitEditMode() {
  HomeApp.editMode = false;
  document.getElementById('edit-mode-hint').classList.add('hidden');
  
  const layer = document.getElementById('character-layer');
  layer.style.pointerEvents = 'none';
  
  HomeApp.canvas.style.cursor = 'default';
  hideContextMenu();
}

function handleCanvasClick(e) {
  if (!HomeApp.editMode) return;
  
  const rect = HomeApp.canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  const gridSize = HomeApp.gridSize;
  const offsetX = (HomeApp.canvas.width - HomeApp.roomWidth * gridSize) / 2;
  const offsetY = (HomeApp.canvas.height - HomeApp.roomHeight * gridSize) / 2;
  
  const gridX = Math.floor((x - offsetX) / gridSize);
  const gridY = Math.floor((y - offsetY) / gridSize);
  
  const furniture = getCurrentFurniture();
  
  const clickedIdx = furniture.findIndex(item => {
    const w = FURNITURE_CATALOG.find(f => f.id === item.id)?.width || 1;
    const h = FURNITURE_CATALOG.find(f => f.id === item.id)?.height || 1;
    return gridX >= item.x && gridX < item.x + w && gridY >= item.y && gridY < item.y + h;
  });
  
  if (clickedIdx !== -1) {
    HomeApp.selectedFurniture = clickedIdx;
    showContextMenu(e.clientX, e.clientY);
  }
}

function handleMouseDown(e) {
  if (!HomeApp.editMode || HomeApp.selectedFurniture === null) return;
  
  const furniture = getCurrentFurniture();
  
  const item = furniture[HomeApp.selectedFurniture];
  if (!item) return;
  
  const rect = HomeApp.canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  const gridSize = HomeApp.gridSize;
  const offsetX = (HomeApp.canvas.width - HomeApp.roomWidth * gridSize) / 2;
  const offsetY = (HomeApp.canvas.height - HomeApp.roomHeight * gridSize) / 2;
  
  HomeApp.draggedFurniture = HomeApp.selectedFurniture;
  HomeApp.dragOffset = {
    x: x - (offsetX + item.x * gridSize),
    y: y - (offsetY + item.y * gridSize)
  };
}

function handleMouseMove(e) {
  if (HomeApp.draggedFurniture === null) return;
  
  const rect = HomeApp.canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  const gridSize = HomeApp.gridSize;
  const offsetX = (HomeApp.canvas.width - HomeApp.roomWidth * gridSize) / 2;
  const offsetY = (HomeApp.canvas.height - HomeApp.roomHeight * gridSize) / 2;
  
  const furniture = getCurrentFurniture();
  
  const item = furniture[HomeApp.draggedFurniture];
  if (!item) return;
  
  const catalogItem = FURNITURE_CATALOG.find(f => f.id === item.id);
  const w = catalogItem?.width || 1;
  const h = catalogItem?.height || 1;
  
  let newX = Math.floor((x - HomeApp.dragOffset.x - offsetX) / gridSize);
  let newY = Math.floor((y - HomeApp.dragOffset.y - offsetY) / gridSize);
  
  newX = Math.max(0, Math.min(HomeApp.roomWidth - w, newX));
  newY = Math.max(0, Math.min(HomeApp.roomHeight - h, newY));
  
  item.x = newX;
  item.y = newY;
  
  renderRoom();
}

function rotateFurniture() {
  if (HomeApp.selectedFurniture === null) return;
  
  const furniture = getCurrentFurniture();
  
  const item = furniture[HomeApp.selectedFurniture];
  if (!item) return;
  
  item.rotation = ((item.rotation || 0) + 90) % 360;
  renderRoom();
  saveData();
  hideContextMenu();
}

function deleteFurniture() {
  if (HomeApp.selectedFurniture === null) return;
  
  const furniture = getCurrentFurniture();
  furniture.splice(HomeApp.selectedFurniture, 1);
  
  renderRoom();
  saveData();
  hideContextMenu();
}
}

function handleMouseDown(e) {
  if (!HomeApp.editMode || HomeApp.selectedFurniture === null) return;
  
  const furniture = HomeApp.placedFurniture[HomeApp.currentRoom] || [];
  
  const item = furniture[HomeApp.selectedFurniture];
  if (!item) return;
  
  const rect = HomeApp.canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  const gridSize = HomeApp.gridSize;
  const offsetX = (HomeApp.canvas.width - HomeApp.roomWidth * gridSize) / 2;
  const offsetY = (HomeApp.canvas.height - HomeApp.roomHeight * gridSize) / 2;
  
  HomeApp.draggedFurniture = HomeApp.selectedFurniture;
  HomeApp.dragOffset = {
    x: x - (offsetX + item.x * gridSize),
    y: y - (offsetY + item.y * gridSize)
  };
}

function handleMouseMove(e) {
  if (HomeApp.draggedFurniture === null) return;
  
  const rect = HomeApp.canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  const gridSize = HomeApp.gridSize;
  const offsetX = (HomeApp.canvas.width - HomeApp.roomWidth * gridSize) / 2;
  const offsetY = (HomeApp.canvas.height - HomeApp.roomHeight * gridSize) / 2;
  
  const furniture = HomeApp.placedFurniture[HomeApp.currentRoom] || [];
  
  const item = furniture[HomeApp.draggedFurniture];
  if (!item) return;
  
  const catalogItem = FURNITURE_CATALOG.find(f => f.id === item.id);
  const w = catalogItem?.width || 1;
  const h = catalogItem?.height || 1;
  
  let newX = Math.floor((x - HomeApp.dragOffset.x - offsetX) / gridSize);
  let newY = Math.floor((y - HomeApp.dragOffset.y - offsetY) / gridSize);
  
  newX = Math.max(0, Math.min(HomeApp.roomWidth - w, newX));
  newY = Math.max(0, Math.min(HomeApp.roomHeight - h, newY));
  
  item.x = newX;
  item.y = newY;
  
  renderRoom();
}

function handleMouseUp() {
  if (HomeApp.draggedFurniture !== null) {
    saveData();
  }
  HomeApp.draggedFurniture = null;
}

function handleContextMenu(e) {
  e.preventDefault();
  handleCanvasClick(e);
}

function showContextMenu(x, y) {
  const menu = document.getElementById('furniture-context-menu');
  menu.classList.remove('hidden');
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
}

function hideContextMenu() {
  document.getElementById('furniture-context-menu').classList.add('hidden');
  HomeApp.selectedFurniture = null;
}

function rotateFurniture() {
  if (HomeApp.selectedFurniture === null) return;
  
  const furniture = HomeApp.placedFurniture[HomeApp.currentRoom] || [];
  
  const item = furniture[HomeApp.selectedFurniture];
  if (!item) return;
  
  item.rotation = ((item.rotation || 0) + 90) % 360;
  renderRoom();
  saveData();
  hideContextMenu();
}

function deleteFurniture() {
  if (HomeApp.selectedFurniture === null) return;
  
  HomeApp.placedFurniture[HomeApp.currentRoom].splice(HomeApp.selectedFurniture, 1);
  
  renderRoom();
  saveData();
  hideContextMenu();
}

function saveRoom() {
  saveData();
  alert('房間已儲存！');
}

function openSettings() {
  document.getElementById('settings-modal').classList.remove('hidden');
  renderColorPickers();
  if (window.lucide) lucide.createIcons();
}

function closeSettings() {
  document.getElementById('settings-modal').classList.add('hidden');
}

function setRoomStyle(style) {
  HomeApp.roomStyle = style;
  
  document.querySelectorAll('.style-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.style === style);
  });
  
  const styleConfig = ROOM_STYLES[style];
  HomeApp.floorColor = styleConfig.floor;
  HomeApp.wallColor = styleConfig.wall;
  
  renderRoom();
  saveData();
}

function renderColorPickers() {
  const floorPicker = document.getElementById('floor-color-picker');
  const wallPicker = document.getElementById('wall-color-picker');
  
  floorPicker.innerHTML = '';
  wallPicker.innerHTML = '';
  
  FLOOR_COLORS.forEach(color => {
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch' + (color === HomeApp.floorColor ? ' active' : '');
    swatch.style.background = color;
    swatch.onclick = () => {
      HomeApp.floorColor = color;
      floorPicker.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      renderRoom();
      saveData();
    };
    floorPicker.appendChild(swatch);
  });
  
  WALL_COLORS.forEach(color => {
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch' + (color === HomeApp.wallColor ? ' active' : '');
    swatch.style.background = color;
    swatch.onclick = () => {
      HomeApp.wallColor = color;
      wallPicker.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      renderRoom();
      saveData();
    };
    wallPicker.appendChild(swatch);
  });
}

function zoomIn() {
  HomeApp.mapScale = Math.min(2, HomeApp.mapScale + 0.25);
  renderMap();
}

function zoomOut() {
  HomeApp.mapScale = Math.max(0.5, HomeApp.mapScale - 0.25);
  renderMap();
}

function centerMap() {
  HomeApp.mapOffset = { x: 0, y: 0 };
  HomeApp.mapScale = 1;
  renderMap();
}

function openBuyModal(lot) {
  HomeApp.pendingBuy = lot;
  
  const chars = JSON.parse(localStorage.getItem('sx_characters') || '[]');
  
  const preview = document.getElementById('buy-preview');
  preview.innerHTML = `
    <div class="buy-preview-house">
      <div class="house-icon">🏠</div>
    </div>
  `;
  
  const options = document.getElementById('buy-options');
  options.innerHTML = `
    <div class="buy-option" onclick="selectBuyType('char')">
      <div class="buy-option-icon">🏡</div>
      <div class="buy-option-info">
        <h4>為 TA 買房</h4>
        <p>給 TA 一個專屬的空間</p>
        <span class="buy-option-price">${formatCurrency(HOUSE_PRICES.charHouse)}</span>
      </div>
    </div>
    <div class="buy-option" onclick="selectBuyType('shared')">
      <div class="buy-option-icon">💑</div>
      <div class="buy-option-info">
        <h4>一起買房</h4>
        <p>共同經營溫馨小窩</p>
        <span class="buy-option-price">${formatCurrency(HOUSE_PRICES.sharedHouse)}</span>
      </div>
    </div>
  `;
  
  document.getElementById('buy-modal-title').textContent = '購買房產';
  document.getElementById('buy-description').textContent = '選擇你想要的房屋類型';
  document.getElementById('buy-price-amount').textContent = '選擇類型查看價格';
  document.getElementById('buy-confirm-btn').classList.add('hidden');
  
  document.getElementById('buy-modal').classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeBuyModal() {
  document.getElementById('buy-modal').classList.add('hidden');
  HomeApp.pendingBuy = null;
  HomeApp.pendingBuyType = null;
}

function selectBuyType(type) {
  HomeApp.pendingBuyType = type;
  
  document.querySelectorAll('.buy-option').forEach(opt => opt.classList.remove('selected'));
  event.currentTarget.classList.add('selected');
  
  const price = type === 'char' ? HOUSE_PRICES.charHouse : HOUSE_PRICES.sharedHouse;
  const balance = getBalance();
  
  document.getElementById('buy-price-amount').textContent = formatCurrency(price);
  document.getElementById('buy-confirm-btn').classList.remove('hidden');
  
  if (balance < price) {
    document.getElementById('buy-confirm-btn').disabled = true;
    document.getElementById('buy-confirm-btn').textContent = '餘額不足';
  } else {
    document.getElementById('buy-confirm-btn').disabled = false;
    document.getElementById('buy-confirm-btn').textContent = '確認購買';
  }
}

function confirmBuy() {
  if (!HomeApp.pendingBuyType) {
    alert('請選擇房屋類型');
    return;
  }
  
  const price = HomeApp.pendingBuyType === 'char' ? HOUSE_PRICES.charHouse : HOUSE_PRICES.sharedHouse;
  const balance = getBalance();
  
  if (balance < price) {
    alert('餘額不足！請到 kakaopay 充值');
    return;
  }
  
  closeBuyModal();
  
  if (HomeApp.pendingBuyType === 'shared') {
    openCharSelectModal(true);
  } else {
    openCharSelectModal(false);
  }
}

function openCharSelectModal(isShared) {
  const chars = JSON.parse(localStorage.getItem('sx_characters') || '[]');
  
  const list = document.getElementById('char-list');
  
  if (chars.length === 0) {
    list.innerHTML = '<div class="empty-hint">尚未建立任何角色\n請先到設定建立角色</div>';
  } else {
    list.innerHTML = '';
    chars.forEach((char, idx) => {
      const item = document.createElement('div');
      item.className = 'char-item';
      item.dataset.idx = idx;
      item.onclick = () => selectChar(idx);
      
      if (char.sprite) {
        const avatar = document.createElement('div');
        avatar.className = 'char-avatar';
        const canvas = document.createElement('canvas');
        canvas.width = 40;
        canvas.height = 40;
        renderSprite(char.sprite, canvas, 40);
        avatar.appendChild(canvas);
        item.appendChild(avatar);
      }
      
      const name = document.createElement('span');
      name.textContent = char.name || '未命名';
      item.appendChild(name);
      
      list.appendChild(item);
    });
  }
  
  HomeApp.isSharedBuy = isShared;
  document.getElementById('char-select-modal').classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeCharSelectModal() {
  document.getElementById('char-select-modal').classList.add('hidden');
  HomeApp.pendingCharIdx = null;
}

function selectChar(idx) {
  HomeApp.pendingCharIdx = idx;
  
  document.querySelectorAll('.char-item').forEach(item => {
    item.classList.toggle('selected', parseInt(item.dataset.idx) === idx);
  });
}

function confirmCharSelect() {
  if (HomeApp.pendingCharIdx === null) {
    alert('請選擇角色');
    return;
  }
  
  closeCharSelectModal();
  
  if (HomeApp.isSharedBuy) {
    openInviteModal();
  } else {
    processPurchase();
  }
}

function openInviteModal() {
  const chars = JSON.parse(localStorage.getItem('sx_characters') || '[]');
  const char = chars[HomeApp.pendingCharIdx];
  const charName = char?.name || 'TA';
  
  const preview = document.getElementById('invite-message-preview');
  preview.textContent = `嗨 ${charName}，我想和你一起買一棟房子，\n我們可以一起佈置、一起經營這個家，\n你願意嗎？`;
  
  document.getElementById('invite-custom-message').value = '';
  document.getElementById('invite-modal').classList.remove('hidden');
  
  if (window.lucide) lucide.createIcons();
}

function closeInviteModal() {
  document.getElementById('invite-modal').classList.add('hidden');
}

function sendInvite() {
  const chars = JSON.parse(localStorage.getItem('sx_characters') || '[]');
  const char = chars[HomeApp.pendingCharIdx];
  const charName = char?.name || 'TA';
  
  const customMessage = document.getElementById('invite-custom-message').value.trim();
  const baseMessage = `我想和你一起買一棟房子，我們可以一起佈置、一起經營這個家，你願意嗎？`;
  const fullMessage = customMessage ? `${baseMessage}\n\n${customMessage}` : baseMessage;
  
  const history = JSON.parse(localStorage.getItem('sx_chat_history') || '[]');
  
  history.push({
    role: 'user',
    content: fullMessage,
    timestamp: Date.now(),
    type: 'house_invite'
  });
  
  localStorage.setItem('sx_chat_history', JSON.stringify(history));
  
  localStorage.setItem('sx_pending_house_invite', JSON.stringify({
    charIdx: HomeApp.pendingCharIdx,
    charName: charName,
    timestamp: Date.now()
  }));
  
  processPayment(HOUSE_PRICES.sharedHouse, '共同房產');
  
  closeInviteModal();
  
  alert(`已發送邀請給 ${charName}！\n請到聊天 app 查看 ${charName} 的回覆。`);
}

function processPurchase() {
  const chars = JSON.parse(localStorage.getItem('sx_characters') || '[]');
  const char = chars[HomeApp.pendingCharIdx];
  const charName = char?.name || 'TA';
  
  const price = HOUSE_PRICES.charHouse;
  
  processPayment(price, `${charName} 的小屋`);
  
  const roomKey = `char_${HomeApp.pendingCharIdx}_${Date.now()}`;
  
  const property = {
    type: 'char',
    charIdx: HomeApp.pendingCharIdx,
    roomKey: roomKey,
    createdAt: Date.now()
  };
  
  HomeApp.properties.push(property);
  HomeApp.placedFurniture[roomKey] = {
    living_room: [],
    bedroom: [],
    bathroom: [],
    study: [],
    kitchen: [],
    balcony: []
  };
  saveData();
  
  renderMap();
  
  alert(`已為 ${charName} 買了一棟房子！`);
}

function processPayment(amount, itemName) {
  window.parent?.postMessage({
    type: 'KAKAOPAY_PAYMENT_REQUEST',
    amount: amount,
    itemName: itemName,
    category: '應用',
    source: 'home'
  }, '*');
  
  setTimeout(updateBalance, 500);
}

function handleBack() {
  if (!document.getElementById('room-view').classList.contains('hidden')) {
    exitRoom();
    return;
  }
  
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: 'closeApp' }, '*');
  }
}

window.selectCategory = selectCategory;
window.toggleFurniturePanel = toggleFurniturePanel;
window.enterEditMode = enterEditMode;
window.exitEditMode = exitEditMode;
window.saveRoom = saveRoom;
window.openSettings = openSettings;
window.closeSettings = closeSettings;
window.setRoomStyle = setRoomStyle;
window.rotateFurniture = rotateFurniture;
window.deleteFurniture = deleteFurniture;
window.hideContextMenu = hideContextMenu;
window.handleBack = handleBack;
window.exitRoom = exitRoom;
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.centerMap = centerMap;
window.openBuyModal = openBuyModal;
window.closeBuyModal = closeBuyModal;
window.selectBuyType = selectBuyType;
window.confirmBuy = confirmBuy;
window.openCharSelectModal = openCharSelectModal;
window.closeCharSelectModal = closeCharSelectModal;
window.selectChar = selectChar;
window.confirmCharSelect = confirmCharSelect;
window.openInviteModal = openInviteModal;
window.closeInviteModal = closeInviteModal;
window.sendInvite = sendInvite;
window.switchSubRoom = switchSubRoom;

document.addEventListener('DOMContentLoaded', init);
