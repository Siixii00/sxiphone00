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
  currentCommunity: null,
  canvas: null,
  ctx: null,
  mapCanvas: null,
  mapCtx: null,
  gridSize: 48,
  roomWidth: 12,
  roomHeight: 10,
  baseRoomWidth: 12,
  baseRoomHeight: 10,
  roomExpansions: {
    user: {
      living_room: { width: 0, height: 0 },
      bedroom: { width: 0, height: 0 },
      bathroom: { width: 0, height: 0 },
      study: { width: 0, height: 0 },
      kitchen: { width: 0, height: 0 },
      balcony: { width: 0, height: 0 }
    }
  },
  editMode: false,
  mapEditMode: false,
  selectedFurniture: null,
  draggedFurniture: null,
  dragOffset: { x: 0, y: 0 },
  roomStyle: 'modern',
  floorColor: '#4a4a6a',
  wallColor: '#3a3a5a',
  floorStyle: 'wood_light',
  wallStyle: 'paint_white',
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
  communityMap: null,
  communityBuildings: [],
  communityEmptyLots: [],
  communityDecorations: [],
  customPlacedBuildings: [],
  customPlacedDecorations: [],
  customTerrainMap: {},
  buildings: [],
  emptyLots: [],
  decorations: [],
  isDragging: false,
  dragStartX: null,
  dragStartY: null,
  lastMapOffsetX: 0,
  lastMapOffsetY: 0,
  selectedMapItem: null,
  draggedMapItem: null,
  brushSize: 1,
  showGrid: true
};

const MAP_CONFIG = {
  tileSize: 48,
  width: 20,
  height: 15
};

const COMMUNITY_MAP_CONFIG = {
  tileSize: 40,
  width: 40,
  height: 30
};

const COMMUNITIES = {
  residential: {
    id: 'residential',
    name: '溫馨住宅區',
    icon: 'home',
    description: '玩家和角色的家園',
    badge: '我的家',
    mapWidth: 40,
    mapHeight: 30,
    terrain: 'residential',
    bgColor: '#2d5a27',
    buildings: [
      { type: 'PLAYER_HOUSE', x: 18, y: 12, width: 3, height: 3 },
      { type: 'CONVENIENCE', x: 30, y: 8, width: 2, height: 2 },
      { type: 'CAFE', x: 8, y: 8, width: 2, height: 2 }
    ],
    emptyLots: [
      { x: 8, y: 18, width: 2, height: 2 },
      { x: 30, y: 18, width: 2, height: 2 },
      { x: 18, y: 22, width: 2, height: 2 }
    ],
    decorations: [
      { type: 'tree', positions: [[2, 2], [6, 3], [35, 2], [38, 4], [3, 25], [36, 26]] },
      { type: 'lamp', positions: [[10, 10], [25, 10], [10, 20], [25, 20]] },
      { type: 'flower', positions: [[4, 5], [34, 5], [5, 24], [34, 24]] },
      { type: 'mailbox', positions: [[17, 16], [21, 16]] },
      { type: 'garden', positions: [[12, 5], [28, 5]] }
    ]
  },
  commercial: {
    id: 'commercial',
    name: '繁華商業區',
    icon: 'store',
    description: '商店、餐廳、咖啡廳林立',
    mapWidth: 40,
    mapHeight: 30,
    terrain: 'commercial',
    bgColor: '#3a3a4a',
    buildings: [
      { type: 'SUPERMARKET', x: 5, y: 8, width: 3, height: 2 },
      { type: 'CAFE', x: 12, y: 8, width: 2, height: 2 },
      { type: 'CONVENIENCE', x: 18, y: 8, width: 2, height: 2 },
      { type: 'RESTAURANT', x: 25, y: 8, width: 3, height: 2 },
      { type: 'BOOKSTORE', x: 32, y: 8, width: 2, height: 2 },
      { type: 'BAKERY', x: 5, y: 18, width: 2, height: 2 }
    ],
    emptyLots: [],
    decorations: [
      { type: 'neon_sign', positions: [[7, 6], [14, 6], [27, 6]] },
      { type: 'billboard', positions: [[20, 2], [35, 3]] },
      { type: 'bus_stop', positions: [[38, 12], [2, 12]] },
      { type: 'vending_machine', positions: [[10, 15], [30, 15]] }
    ]
  },
  leisure: {
    id: 'leisure',
    name: '休閒公園區',
    icon: 'trees',
    description: '公園、遊樂場、運動場',
    mapWidth: 40,
    mapHeight: 30,
    terrain: 'leisure',
    bgColor: '#228B22',
    buildings: [
      { type: 'PARK', x: 5, y: 5, width: 8, height: 6 },
      { type: 'PLAYGROUND', x: 20, y: 8, width: 5, height: 4 },
      { type: 'SPORTS_FIELD', x: 30, y: 5, width: 6, height: 5 },
      { type: 'PICNIC_AREA', x: 10, y: 20, width: 4, height: 3 }
    ],
    emptyLots: [],
    decorations: [
      { type: 'fountain', positions: [[8, 8], [22, 10]] },
      { type: 'bench', positions: [[15, 12], [25, 12], [15, 22], [25, 22]] },
      { type: 'flower_bed', positions: [[3, 3], [37, 3], [3, 27], [37, 27]] },
      { type: 'tree', positions: [[2, 15], [38, 15], [15, 5], [25, 5]] }
    ]
  },
  nature: {
    id: 'nature',
    name: '自然森林區',
    icon: 'tree-pine',
    description: '森林步道、湖泊、山丘',
    mapWidth: 40,
    mapHeight: 30,
    terrain: 'nature',
    bgColor: '#1a4a1a',
    buildings: [
      { type: 'FOREST_CABIN', x: 5, y: 5, width: 2, height: 2 },
      { type: 'VIEWPOINT', x: 35, y: 3, width: 2, height: 2 },
      { type: 'LAKE_PAVILION', x: 18, y: 20, width: 3, height: 2 }
    ],
    emptyLots: [],
    decorations: [
      { type: 'big_tree', positions: [[2, 8], [8, 12], [15, 5], [25, 8], [32, 12], [38, 8]] },
      { type: 'stream', positions: [[0, 15, 40, 2]] },
      { type: 'rock', positions: [[10, 10], [30, 10], [20, 25]] },
      { type: 'lake', positions: [[15, 18, 10, 6]] },
      { type: 'wildflower', positions: [[5, 20], [35, 20], [12, 28], [28, 28]] }
    ]
  },
  seaside: {
    id: 'seaside',
    name: '海濱度假區',
    icon: 'umbrella',
    description: '海灘、碼頭、燈塔',
    mapWidth: 40,
    mapHeight: 30,
    terrain: 'seaside',
    bgColor: '#87CEEB',
    buildings: [
      { type: 'BEACH_HUT', x: 5, y: 20, width: 2, height: 2 },
      { type: 'DOCK', x: 35, y: 15, width: 3, height: 4 },
      { type: 'LIGHTHOUSE', x: 2, y: 5, width: 2, height: 3 },
      { type: 'SEAFOOD_RESTAURANT', x: 15, y: 20, width: 3, height: 2 }
    ],
    emptyLots: [],
    decorations: [
      { type: 'coconut_tree', positions: [[8, 18], [25, 18], [32, 22]] },
      { type: 'beach_chair', positions: [[10, 24], [20, 24], [30, 24]] },
      { type: 'wave', positions: [[0, 26, 40, 3]] },
      { type: 'shell', positions: [[5, 28], [15, 28], [25, 28], [35, 28]] },
      { type: 'boat', positions: [[36, 12]] }
    ]
  },
  cultural: {
    id: 'cultural',
    name: '文化藝術區',
    icon: 'landmark',
    description: '博物館、圖書館、學校',
    mapWidth: 40,
    mapHeight: 30,
    terrain: 'cultural',
    bgColor: '#4a3a2d',
    buildings: [
      { type: 'MUSEUM', x: 5, y: 5, width: 4, height: 3 },
      { type: 'LIBRARY', x: 15, y: 5, width: 3, height: 3 },
      { type: 'SCHOOL', x: 25, y: 5, width: 4, height: 3 },
      { type: 'ART_CENTER', x: 35, y: 5, width: 3, height: 3 }
    ],
    emptyLots: [],
    decorations: [
      { type: 'statue', positions: [[10, 12], [20, 12], [30, 12]] },
      { type: 'flag', positions: [[3, 3], [12, 3], [24, 3], [34, 3]] },
      { type: 'fountain', positions: [[18, 15]] },
      { type: 'flower_bed', positions: [[5, 10], [15, 10], [25, 10], [35, 10]] }
    ]
  }
};

const COMMUNITY_TILE_TYPES = {
  GRASS: 0,
  ROAD_H: 1,
  ROAD_V: 2,
  ROAD_CROSS: 3,
  SIDEWALK: 4,
  WATER: 5,
  SAND: 6,
  FOREST: 7,
  STONE_PATH: 8,
  CONCRETE: 9,
  GARDEN: 10,
  STREAM: 11,
  BEACH: 12
};

const COMMUNITY_BUILDINGS = {
  PLAYER_HOUSE: { id: 'player_house', name: '我的家', color: '#e94560', roofColor: '#c73e54', price: 0 },
  CHAR_HOUSE: { id: 'char_house', name: 'TA的家', color: '#4facfe', roofColor: '#3a8bc9', price: 15000 },
  SHARED_HOUSE: { id: 'shared_house', name: '共同的家', color: '#ff6b9d', roofColor: '#d94a7b', price: 25000 },
  CONVENIENCE: { id: 'convenience', name: '便利商店', color: '#2ecc71', roofColor: '#27ae60', price: 0, isShop: true },
  CAFE: { id: 'cafe', name: '咖啡廳', color: '#8B4513', roofColor: '#654321', price: 0, isShop: true },
  SUPERMARKET: { id: 'supermarket', name: '超市', color: '#e74c3c', roofColor: '#c0392b', price: 0, isShop: true },
  RESTAURANT: { id: 'restaurant', name: '餐廳', color: '#ff6b6b', roofColor: '#d63031', price: 0, isShop: true },
  BOOKSTORE: { id: 'bookstore', name: '書店', color: '#9b59b6', roofColor: '#8e44ad', price: 0, isShop: true },
  BAKERY: { id: 'bakery', name: '蛋糕店', color: '#f1c40f', roofColor: '#d4ac0d', price: 0, isShop: true },
  PARK: { id: 'park', name: '公園', color: '#228B22', roofColor: '#1a6b1a', price: 0, isPark: true },
  PLAYGROUND: { id: 'playground', name: '遊樂場', color: '#e91e63', roofColor: '#c2185b', price: 0, isPark: true },
  SPORTS_FIELD: { id: 'sports_field', name: '運動場', color: '#4CAF50', roofColor: '#388E3C', price: 0, isPark: true },
  PICNIC_AREA: { id: 'picnic_area', name: '野餐區', color: '#8BC34A', roofColor: '#689F38', price: 0, isPark: true },
  FOREST_CABIN: { id: 'forest_cabin', name: '森林小屋', color: '#5D4037', roofColor: '#4E342E', price: 0 },
  VIEWPOINT: { id: 'viewpoint', name: '觀景台', color: '#607D8B', roofColor: '#455A64', price: 0 },
  LAKE_PAVILION: { id: 'lake_pavilion', name: '湖畔亭', color: '#795548', roofColor: '#6D4C41', price: 0 },
  BEACH_HUT: { id: 'beach_hut', name: '海灘小屋', color: '#FF9800', roofColor: '#F57C00', price: 0 },
  DOCK: { id: 'dock', name: '碼頭', color: '#8D6E63', roofColor: '#6D4C41', price: 0 },
  LIGHTHOUSE: { id: 'lighthouse', name: '燈塔', color: '#ffffff', roofColor: '#e0e0e0', price: 0 },
  SEAFOOD_RESTAURANT: { id: 'seafood_restaurant', name: '海鮮餐廳', color: '#00BCD4', roofColor: '#0097A7', price: 0, isShop: true },
  MUSEUM: { id: 'museum', name: '博物館', color: '#9E9E9E', roofColor: '#757575', price: 0 },
  LIBRARY: { id: 'library', name: '圖書館', color: '#3F51B5', roofColor: '#303F9F', price: 0 },
  SCHOOL: { id: 'school', name: '學校', color: '#FF5722', roofColor: '#E64A19', price: 0 },
  ART_CENTER: { id: 'art_center', name: '藝術中心', color: '#E91E63', roofColor: '#C2185B', price: 0 }
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

const RARITY_CONFIG = {
  common: { name: '普通', color: '#9e9e9e', glow: 'rgba(158,158,158,0.3)', rate: 0.6, priceMultiplier: 1 },
  rare: { name: '稀有', color: '#2196f3', glow: 'rgba(33,150,243,0.4)', rate: 0.25, priceMultiplier: 1.5 },
  epic: { name: '史詩', color: '#9c27b0', glow: 'rgba(156,39,176,0.5)', rate: 0.12, priceMultiplier: 2.5 },
  legendary: { name: '傳說', color: '#ff9800', glow: 'rgba(255,152,0,0.6)', rate: 0.03, priceMultiplier: 5 }
};

const FLOOR_STYLES = [
  { id: 'wood_light', name: '淺色木地板', pattern: 'wood', baseColor: '#DEB887', accentColor: '#D2B48C', price: 0 },
  { id: 'wood_dark', name: '深色木地板', pattern: 'wood', baseColor: '#8B4513', accentColor: '#654321', price: 1000 },
  { id: 'tile_white', name: '白色磁磚', pattern: 'tile', baseColor: '#f5f5f5', accentColor: '#e0e0e0', price: 800 },
  { id: 'tile_marble', name: '大理石磁磚', pattern: 'marble', baseColor: '#f0f0f0', accentColor: '#d0d0d0', price: 2000 },
  { id: 'carpet_beige', name: '米色地毯', pattern: 'carpet', baseColor: '#F5F5DC', accentColor: '#FAEBD7', price: 600 },
  { id: 'concrete', name: '水泥地板', pattern: 'concrete', baseColor: '#808080', accentColor: '#696969', price: 500 },
  { id: 'parquet', name: '拼花地板', pattern: 'parquet', baseColor: '#CD853F', accentColor: '#8B4513', price: 1500 }
];

const WALL_STYLES = [
  { id: 'paint_white', name: '白色油漆', pattern: 'paint', baseColor: '#ffffff', price: 0 },
  { id: 'paint_pastel', name: '粉彩油漆', pattern: 'paint', baseColor: '#E6E6FA', price: 500 },
  { id: 'wallpaper_floral', name: '花卉壁紙', pattern: 'floral', baseColor: '#FFF0F5', accentColor: '#FF69B4', price: 1200 },
  { id: 'wallpaper_striped', name: '條紋壁紙', pattern: 'striped', baseColor: '#F5F5F5', accentColor: '#4169E1', price: 1000 },
  { id: 'wallpaper_geometric', name: '幾何壁紙', pattern: 'geometric', baseColor: '#2F4F4F', accentColor: '#00CED1', price: 1100 },
  { id: 'brick_exposed', name: '裸露磚牆', pattern: 'brick', baseColor: '#8B4513', accentColor: '#A0522D', price: 1500 },
  { id: 'wood_panel', name: '木質壁板', pattern: 'wood_panel', baseColor: '#DEB887', accentColor: '#D2B48C', price: 1800 }
];

const SEASONAL_EVENTS = [
  {
    id: 'christmas_2024',
    name: '聖誕佳節',
    type: 'holiday',
    startDate: '2024-12-01',
    endDate: '2024-12-25',
    furniture: [
      { id: 'christmas_tree', name: '聖誕樹', price: 2000, rarity: 'epic', width: 2, height: 3 },
      { id: 'christmas_wreath', name: '聖誕花圈', price: 800, rarity: 'rare', width: 2, height: 2 },
      { id: 'christmas_stocking', name: '聖誕襪', price: 300, rarity: 'common', width: 1, height: 1 },
      { id: 'snow_globe', name: '水晶雪球', price: 1500, rarity: 'epic', width: 1, height: 1 }
    ],
    discount: 0.9,
    banner: '聖誕限定家具登場！'
  },
  {
    id: 'valentine_2025',
    name: '情人節',
    type: 'holiday',
    startDate: '2025-02-01',
    endDate: '2025-02-14',
    furniture: [
      { id: 'heart_garland', name: '愛心掛飾', price: 600, rarity: 'rare', width: 2, height: 1 },
      { id: 'rose_bouquet', name: '玫瑰花束', price: 1200, rarity: 'epic', width: 1, height: 2 },
      { id: 'love_letter_frame', name: '情書相框', price: 500, rarity: 'common', width: 1, height: 1 }
    ],
    discount: 0.85,
    banner: '情人節限定，表達愛意'
  },
  {
    id: 'halloween_2025',
    name: '萬聖節',
    type: 'holiday',
    startDate: '2025-10-15',
    endDate: '2025-10-31',
    furniture: [
      { id: 'pumpkin_lamp', name: '南瓜燈', price: 800, rarity: 'rare', width: 1, height: 1 },
      { id: 'ghost_deco', name: '幽靈掛飾', price: 500, rarity: 'common', width: 1, height: 1 },
      { id: 'bat_garland', name: '蝙蝠掛飾', price: 600, rarity: 'rare', width: 2, height: 1 },
      { id: 'witch_hat', name: '巫師帽裝飾', price: 1000, rarity: 'epic', width: 1, height: 1 }
    ],
    discount: 0.9,
    banner: '萬聖節限定，搞怪登場'
  }
];

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

const FURNITURE_SHOP_CATALOG = [
  { id: 'wall_painting_1', name: '抽象掛畫', category: 'wall_decor', price: 500, width: 2, height: 2, description: '現代風格抽象藝術畫作', rarity: 'common', interactive: false },
  { id: 'wall_painting_2', name: '風景油畫', category: 'wall_decor', price: 800, width: 3, height: 2, description: '古典風格風景畫作', rarity: 'rare', interactive: false },
  { id: 'wall_photo_frame', name: '照片牆', category: 'wall_decor', price: 400, width: 2, height: 2, description: '可放角色照片', rarity: 'common', interactive: false },
  { id: 'wall_mirror_decor', name: '裝飾鏡', category: 'wall_decor', price: 600, width: 1, height: 2, description: '附邊框裝飾', rarity: 'common', interactive: false },
  { id: 'wall_tapestry', name: '掛毯', category: 'wall_decor', price: 700, width: 2, height: 3, description: '波西米亞風格', rarity: 'rare', interactive: false },
  { id: 'wall_clock', name: '掛鐘', category: 'wall_decor', price: 350, width: 1, height: 1, description: '顯示真實時間', rarity: 'common', interactive: true },
  { id: 'wall_shelf', name: '壁掛架', category: 'wall_decor', price: 450, width: 2, height: 1, description: '可放小物', rarity: 'common', interactive: false },
  { id: 'curtain_basic', name: '基本窗簾', category: 'curtain', price: 400, width: 2, height: 3, description: '素色款式', rarity: 'common', interactive: false },
  { id: 'curtain_lace', name: '蕾絲窗簾', category: 'curtain', price: 550, width: 2, height: 3, description: '浪漫風格', rarity: 'rare', interactive: false },
  { id: 'curtain_blackout', name: '遮光窗簾', category: 'curtain', price: 600, width: 2, height: 3, description: '深色系', rarity: 'common', interactive: false },
  { id: 'curtain_pattern', name: '圖案窗簾', category: 'curtain', price: 500, width: 2, height: 3, description: '幾何圖案', rarity: 'common', interactive: false },
  { id: 'blind_wooden', name: '木製百葉窗', category: 'curtain', price: 750, width: 2, height: 3, description: '自然風格', rarity: 'rare', interactive: false },
  { id: 'blind_roman', name: '羅馬簾', category: 'curtain', price: 650, width: 2, height: 3, description: '優雅款式', rarity: 'rare', interactive: false },
  { id: 'ceiling_light', name: '吸頂燈', category: 'lighting', price: 600, width: 2, height: 1, description: '基本照明', rarity: 'common', interactive: true },
  { id: 'chandelier', name: '水晶吊燈', category: 'lighting', price: 1500, width: 2, height: 2, description: '豪華款式', rarity: 'epic', interactive: true },
  { id: 'floor_lamp', name: '落地燈', category: 'lighting', price: 500, width: 1, height: 2, description: '立燈', rarity: 'common', interactive: true },
  { id: 'wall_sconce', name: '壁燈', category: 'lighting', price: 400, width: 1, height: 1, description: '牆面照明', rarity: 'common', interactive: true },
  { id: 'string_lights', name: '燈串', category: 'lighting', price: 350, width: 3, height: 1, description: '氣氛燈', rarity: 'rare', interactive: true },
  { id: 'desk_lamp_luxury', name: '設計師檯燈', category: 'lighting', price: 800, width: 1, height: 1, description: '高級款式', rarity: 'rare', interactive: true },
  { id: 'neon_sign', name: '霓虹燈牌', category: 'lighting', price: 900, width: 2, height: 1, description: '個性裝飾', rarity: 'epic', interactive: true },
  { id: 'throw_pillow_1', name: '抱枕組', category: 'textile', price: 200, width: 1, height: 1, description: '可疊加放置', rarity: 'common', interactive: false },
  { id: 'throw_blanket', name: '毛毯', category: 'textile', price: 350, width: 2, height: 1, description: '可放沙發上', rarity: 'common', interactive: false },
  { id: 'area_rug_round', name: '圓形地毯', category: 'textile', price: 500, width: 2, height: 2, description: '裝飾用', rarity: 'common', interactive: false },
  { id: 'area_rug_fuzzy', name: '毛茸地毯', category: 'textile', price: 600, width: 3, height: 2, description: '溫暖風格', rarity: 'rare', interactive: false },
  { id: 'bed_runner', name: '床尾巾', category: 'textile', price: 300, width: 2, height: 1, description: '床鋪裝飾', rarity: 'common', interactive: false },
  { id: 'cushion_set', name: '靠墊組', category: 'textile', price: 250, width: 1, height: 1, description: '地板坐墊', rarity: 'common', interactive: false },
  { id: 'curtain_valance', name: '窗簾頭', category: 'textile', price: 300, width: 2, height: 1, description: '搭配窗簾', rarity: 'common', interactive: false },
  { id: 'floor_vase_large', name: '大型落地花瓶', category: 'floor_decor', price: 600, width: 1, height: 2, description: '東方風格', rarity: 'rare', interactive: false },
  { id: 'floor_candle_set', name: '蠟燭組', category: 'floor_decor', price: 250, width: 1, height: 1, description: '氣氛營造', rarity: 'common', interactive: false },
  { id: 'floor_books_stack', name: '書籍堆疊', category: 'floor_decor', price: 150, width: 1, height: 1, description: '裝飾用', rarity: 'common', interactive: false },
  { id: 'floor_plant_tall', name: '高大盆栽', category: 'floor_decor', price: 450, width: 1, height: 2, description: '綠色植栽', rarity: 'common', interactive: false },
  { id: 'floor_statue', name: '小型雕像', category: 'floor_decor', price: 500, width: 1, height: 1, description: '藝術品', rarity: 'rare', interactive: false },
  { id: 'floor_basket', name: '收納籃', category: 'floor_decor', price: 300, width: 1, height: 1, description: '實用裝飾', rarity: 'common', interactive: false },
  { id: 'floor_mat_welcome', name: '歡迎地墊', category: 'floor_decor', price: 200, width: 2, height: 1, description: '入口用', rarity: 'common', interactive: false },
  { id: 'chandelier_crystal', name: '水晶吊燈(傳說)', category: 'lighting', price: 7500, width: 2, height: 2, description: '閃爍動畫效果', rarity: 'legendary', interactive: true },
  { id: 'wall_art_golden', name: '金箔藝術畫', category: 'wall_decor', price: 10000, width: 2, height: 2, description: '金色光暈', rarity: 'legendary', interactive: false },
  { id: 'curtain_silk', name: '絲綢窗簾', category: 'curtain', price: 5000, width: 2, height: 3, description: '流光效果', rarity: 'legendary', interactive: false },
  { id: 'neon_sign_custom', name: '客製化霓虹燈', category: 'lighting', price: 3000, width: 2, height: 1, description: '可自訂文字', rarity: 'epic', interactive: true },
  { id: 'floor_fountain', name: '室內噴泉', category: 'floor_decor', price: 4500, width: 2, height: 2, description: '水流動畫', rarity: 'epic', interactive: true },
  { id: 'wall_aquarium', name: '壁掛魚缸', category: 'wall_decor', price: 3500, width: 2, height: 2, description: '魚游動畫', rarity: 'epic', interactive: true }
];

// ============================================
// 進階家具繪製函數 - 32x32 高解析度像素藝術
// ============================================

function generateBedPixels(woodColor, sheetColor) {
  return (ctx, size) => {
    const p = size / PIXEL_RESOLUTION;
    
    drawFeatheredShadow(ctx, 2 * p, 30 * p, 28 * p, 4 * p, p);
    
    ctx.fillStyle = adjustColor(woodColor, -50);
    ctx.fillRect(0, 32 * p, 32 * p, 4 * p);
    ctx.fillStyle = adjustColor(woodColor, -60);
    ctx.fillRect(0, 32 * p, 2 * p, 4 * p);
    
    drawWoodGrain(ctx, 0, 0, 32 * p, 32 * p, '#5D3A1A', p);
    
    ctx.fillStyle = '#8B5A2B';
    ctx.fillRect(2 * p, 2 * p, 28 * p, 28 * p);
    
    ctx.fillStyle = adjustColor('#8B5A2B', 20);
    ctx.fillRect(2 * p, 2 * p, 2 * p, 28 * p);
    
    ctx.fillStyle = adjustColor('#8B5A2B', -20);
    ctx.fillRect(28 * p, 2 * p, 2 * p, 28 * p);
    
    drawFabricTexture(ctx, 4 * p, 4 * p, 24 * p, 20 * p, sheetColor, p);
    
    ctx.fillStyle = adjustColor(sheetColor, -10);
    ctx.fillRect(4 * p, 14 * p, 24 * p, 10 * p);
    
    ctx.fillStyle = adjustColor(sheetColor, -25);
    for (let i = 0; i < 5; i++) {
      const offsetX = (Math.floor(Math.random() * 3) - 1) * p;
      ctx.fillRect((6 + i * 4) * p + offsetX, (16 + i % 2) * p, 2 * p, 6 * p);
    }
    
    drawPillow(ctx, 6 * p, 6 * p, 10 * p, 6 * p, '#FFFEF0', p);
    drawPillow(ctx, 18 * p, 6 * p, 10 * p, 6 * p, '#FFFEF0', p);
    
    ctx.fillStyle = '#4A2F1A';
    ctx.fillRect(0, 0, 32 * p, 4 * p);
    ctx.fillStyle = adjustColor(woodColor, 20);
    ctx.fillRect(2 * p, p, 28 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#4A2F1A', 15);
    ctx.fillRect(0, 0, 32 * p, p);
    ctx.fillRect(0, 0, p, 4 * p);
    
    ctx.fillStyle = adjustColor('#4A2F1A', -15);
    ctx.fillRect(31 * p, 0, p, 4 * p);
  };
}

function generateDeskPixels(color) {
  return (ctx, size) => {
    const p = size / PIXEL_RESOLUTION;
    
    drawFeatheredShadow(ctx, 2 * p, 30 * p, 28 * p, 4 * p, p);
    
    ctx.fillStyle = adjustColor('#704820', -50);
    ctx.fillRect(0, 32 * p, 32 * p, 3 * p);
    ctx.fillStyle = adjustColor('#704820', -60);
    ctx.fillRect(0, 32 * p, 2 * p, 3 * p);
    
    drawWoodGrain(ctx, 0, 6 * p, 32 * p, 6 * p, '#A07840', p);
    
    ctx.fillStyle = adjustColor('#A07840', 25);
    ctx.fillRect(0, 6 * p, 32 * p, p);
    ctx.fillRect(0, 6 * p, p, 6 * p);
    
    ctx.fillStyle = adjustColor('#A07840', -20);
    ctx.fillRect(31 * p, 6 * p, p, 6 * p);
    ctx.fillRect(0, 11 * p, 32 * p, p);
    
    ctx.fillStyle = '#704820';
    ctx.fillRect(0, 6 * p, 32 * p, p);
    ctx.fillRect(0, 11 * p, 32 * p, p);
    
    ctx.fillStyle = '#8B5A2B';
    ctx.fillRect(4 * p, 12 * p, 24 * p, 18 * p);
    
    ctx.fillStyle = adjustColor('#8B5A2B', 15);
    ctx.fillRect(4 * p, 12 * p, 2 * p, 18 * p);
    
    ctx.fillStyle = adjustColor('#8B5A2B', -15);
    ctx.fillRect(26 * p, 12 * p, 2 * p, 18 * p);
    
    ctx.fillStyle = '#5D3A1A';
    ctx.fillRect(4 * p, 17 * p, 24 * p, p);
    ctx.fillRect(4 * p, 23 * p, 24 * p, p);
    
    ctx.fillStyle = '#C0C0C0';
    drawMetallicShine(ctx, 14 * p, 13 * p, 4 * p, 3 * p, '#A0A0A0');
    drawMetallicShine(ctx, 14 * p, 19 * p, 4 * p, 3 * p, '#A0A0A0');
    drawMetallicShine(ctx, 14 * p, 25 * p, 4 * p, 3 * p, '#A0A0A0');
    
    ctx.fillStyle = '#704820';
    ctx.fillRect(2 * p, 12 * p, 4 * p, 20 * p);
    ctx.fillRect(26 * p, 12 * p, 4 * p, 20 * p);
    
    ctx.fillStyle = adjustColor('#704820', 15);
    ctx.fillRect(2 * p, 12 * p, p, 20 * p);
    ctx.fillRect(26 * p, 12 * p, p, 20 * p);
    
    ctx.fillStyle = adjustColor('#704820', -20);
    ctx.fillRect(5 * p, 12 * p, p, 20 * p);
    ctx.fillRect(29 * p, 12 * p, p, 20 * p);
  };
}

function generateChairPixels(color) {
  return (ctx, size) => {
    const p = size / PIXEL_RESOLUTION;
    
    drawFeatheredShadow(ctx, 6 * p, 30 * p, 20 * p, 4 * p, p);
    
    ctx.fillStyle = adjustColor('#704820', -50);
    ctx.fillRect(8 * p, 32 * p, 3 * p, 3 * p);
    ctx.fillRect(21 * p, 32 * p, 3 * p, 3 * p);
    ctx.fillStyle = adjustColor('#704820', -60);
    ctx.fillRect(8 * p, 32 * p, p, 3 * p);
    ctx.fillRect(21 * p, 32 * p, p, 3 * p);
    
    drawWoodGrain(ctx, 8 * p, 0, 16 * p, 18 * p, '#8B5A2B', p);
    
    ctx.fillStyle = adjustColor('#8B5A2B', 20);
    ctx.fillRect(8 * p, 0, 2 * p, 18 * p);
    
    ctx.fillStyle = adjustColor('#8B5A2B', -20);
    ctx.fillRect(22 * p, 0, 2 * p, 18 * p);
    
    ctx.fillStyle = '#A07840';
    ctx.fillRect(10 * p, 2 * p, 12 * p, 14 * p);
    
    ctx.fillStyle = adjustColor('#A07840', 20);
    ctx.fillRect(10 * p, 2 * p, 2 * p, 14 * p);
    
    ctx.fillStyle = adjustColor('#A07840', -15);
    ctx.fillRect(20 * p, 2 * p, 2 * p, 14 * p);
    
    ctx.fillStyle = '#5D3A1A';
    ctx.fillRect(12 * p, 4 * p, 3 * p, 10 * p);
    ctx.fillRect(17 * p, 4 * p, 3 * p, 10 * p);
    
    drawFabricTexture(ctx, 6 * p, 18 * p, 20 * p, 8 * p, '#6B8E23', p);
    
    ctx.fillStyle = adjustColor('#6B8E23', 20);
    ctx.fillRect(6 * p, 18 * p, 2 * p, 8 * p);
    
    ctx.fillStyle = adjustColor('#6B8E23', -20);
    ctx.fillRect(24 * p, 18 * p, 2 * p, 8 * p);
    
    ctx.fillStyle = '#556B2F';
    ctx.fillRect(6 * p, 18 * p, 20 * p, p);
    ctx.fillRect(6 * p, 25 * p, 20 * p, p);
    
    ctx.fillStyle = '#704820';
    ctx.fillRect(8 * p, 26 * p, 3 * p, 6 * p);
    ctx.fillRect(21 * p, 26 * p, 3 * p, 6 * p);
    
    ctx.fillStyle = adjustColor('#704820', 15);
    ctx.fillRect(8 * p, 26 * p, p, 6 * p);
    ctx.fillRect(21 * p, 26 * p, p, 6 * p);
    
    ctx.fillStyle = adjustColor('#704820', -15);
    ctx.fillRect(10 * p, 26 * p, p, 6 * p);
    ctx.fillRect(23 * p, 26 * p, p, 6 * p);
  };
}

function generateSofaPixels(color) {
  return (ctx, size) => {
    const p = size / PIXEL_RESOLUTION;
    
    drawFeatheredShadow(ctx, 2 * p, 30 * p, 28 * p, 4 * p, p);
    
    ctx.fillStyle = adjustColor(color, -50);
    ctx.fillRect(0, 32 * p, 32 * p, 3 * p);
    ctx.fillStyle = adjustColor(color, -60);
    ctx.fillRect(0, 32 * p, 2 * p, 3 * p);
    
    ctx.fillStyle = adjustColor(color, -40);
    ctx.fillRect(0, 20 * p, 32 * p, 12 * p);
    
    ctx.fillStyle = adjustColor(color, -30);
    ctx.fillRect(0, 20 * p, 2 * p, 12 * p);
    ctx.fillRect(30 * p, 20 * p, 2 * p, 12 * p);
    
    drawFabricTexture(ctx, 2 * p, 12 * p, 28 * p, 18 * p, color, p);
    
    ctx.fillStyle = adjustColor(color, 25);
    ctx.fillRect(2 * p, 12 * p, 2 * p, 18 * p);
    
    ctx.fillStyle = adjustColor(color, -20);
    ctx.fillRect(28 * p, 12 * p, 2 * p, 18 * p);
    
    ctx.fillStyle = adjustColor(color, -30);
    ctx.fillRect(10 * p, 12 * p, p, 18 * p);
    ctx.fillRect(21 * p, 12 * p, p, 18 * p);
    
    ctx.fillStyle = adjustColor(color, -20);
    ctx.fillRect(0, 0, 6 * p, 32 * p);
    ctx.fillStyle = adjustColor(color, 30);
    ctx.fillRect(p, p, 4 * p, 30 * p);
    ctx.fillStyle = adjustColor(color, 20);
    ctx.fillRect(p, p, p, 30 * p);
    
    ctx.fillStyle = adjustColor(color, -20);
    ctx.fillRect(26 * p, 0, 6 * p, 32 * p);
    ctx.fillStyle = adjustColor(color, 30);
    ctx.fillRect(27 * p, p, 4 * p, 30 * p);
    ctx.fillStyle = adjustColor(color, 15);
    ctx.fillRect(27 * p, p, p, 30 * p);
    
    ctx.fillStyle = adjustColor(color, -15);
    ctx.fillRect(6 * p, 0, 20 * p, 12 * p);
    ctx.fillStyle = adjustColor(color, 20);
    ctx.fillRect(8 * p, 2 * p, 16 * p, 10 * p);
    
    ctx.fillStyle = adjustColor(color, 30);
    ctx.fillRect(8 * p, 2 * p, 2 * p, 10 * p);
    
    ctx.fillStyle = adjustColor(color, -25);
    ctx.fillRect(12 * p, 4 * p, p, 8 * p);
    ctx.fillRect(19 * p, 4 * p, p, 8 * p);
    
    drawPillow(ctx, 8 * p, 14 * p, 6 * p, 8 * p, adjustColor(color, 40), p);
    drawPillow(ctx, 18 * p, 14 * p, 6 * p, 8 * p, adjustColor(color, 50), p);
    
    ctx.fillStyle = '#505050';
    ctx.fillRect(4 * p, 30 * p, 3 * p, 2 * p);
    ctx.fillRect(25 * p, 30 * p, 3 * p, 2 * p);
  };
}

function generateTablePixels(color) {
  return (ctx, size) => {
    const p = size / PIXEL_RESOLUTION;
    
    drawFeatheredShadow(ctx, 2 * p, 30 * p, 28 * p, 4 * p, p);
    
    ctx.fillStyle = adjustColor('#704820', -50);
    ctx.fillRect(0, 32 * p, 32 * p, 3 * p);
    ctx.fillStyle = adjustColor('#704820', -60);
    ctx.fillRect(0, 32 * p, 2 * p, 3 * p);
    
    drawWoodGrain(ctx, 0, 0, 32 * p, 32 * p, '#704820', p);
    
    ctx.fillStyle = adjustColor('#704820', 20);
    ctx.fillRect(0, 0, 2 * p, 32 * p);
    ctx.fillRect(0, 0, 32 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#704820', -20);
    ctx.fillRect(30 * p, 0, 2 * p, 32 * p);
    ctx.fillRect(0, 30 * p, 32 * p, 2 * p);
    
    ctx.fillStyle = '#A07840';
    ctx.fillRect(2 * p, 2 * p, 28 * p, 28 * p);
    
    ctx.fillStyle = adjustColor('#A07840', 20);
    ctx.fillRect(2 * p, 2 * p, 2 * p, 28 * p);
    ctx.fillRect(2 * p, 2 * p, 28 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#A07840', -15);
    ctx.fillRect(28 * p, 2 * p, 2 * p, 28 * p);
    ctx.fillRect(2 * p, 28 * p, 28 * p, 2 * p);
    
    ctx.fillStyle = '#C9A66B';
    ctx.fillRect(4 * p, 4 * p, 24 * p, 24 * p);
    
    ctx.fillStyle = adjustColor('#C9A66B', 20);
    ctx.fillRect(4 * p, 4 * p, 2 * p, 24 * p);
    ctx.fillRect(4 * p, 4 * p, 24 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#C9A66B', -15);
    ctx.fillRect(26 * p, 4 * p, 2 * p, 24 * p);
    ctx.fillRect(4 * p, 26 * p, 24 * p, 2 * p);
    
    ctx.fillStyle = adjustColor(color, 20);
    ctx.fillRect(8 * p, 8 * p, 16 * p, 16 * p);
    
    ctx.fillStyle = adjustColor(color, 25);
    ctx.fillRect(8 * p, 8 * p, 2 * p, 16 * p);
    ctx.fillRect(8 * p, 8 * p, 16 * p, 2 * p);
    
    ctx.fillStyle = adjustColor(color, -20);
    ctx.fillRect(10 * p, 10 * p, 12 * p, 12 * p);
    
    ctx.fillStyle = adjustColor(color, 40);
    ctx.fillRect(12 * p, 12 * p, 8 * p, 8 * p);
    
    ctx.fillStyle = adjustColor(color, 50);
    ctx.fillRect(12 * p, 12 * p, 2 * p, 8 * p);
    ctx.fillRect(12 * p, 12 * p, 8 * p, 2 * p);
    
    ctx.fillStyle = '#5D3A1A';
    ctx.fillRect(14 * p, 14 * p, 4 * p, 4 * p);
  };
}

function generateBookshelfPixels() {
  return (ctx, size) => {
    const p = size / PIXEL_RESOLUTION;
    
    drawFeatheredShadow(ctx, 2 * p, 30 * p, 28 * p, 4 * p, p);
    
    ctx.fillStyle = adjustColor('#5D3A1A', -50);
    ctx.fillRect(0, 32 * p, 32 * p, 3 * p);
    ctx.fillStyle = adjustColor('#5D3A1A', -60);
    ctx.fillRect(0, 32 * p, 2 * p, 3 * p);
    
    drawWoodGrain(ctx, 0, 0, 32 * p, 32 * p, '#5D3A1A', p);
    
    ctx.fillStyle = adjustColor('#5D3A1A', 20);
    ctx.fillRect(0, 0, 2 * p, 32 * p);
    ctx.fillRect(0, 0, 32 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#5D3A1A', -20);
    ctx.fillRect(30 * p, 0, 2 * p, 32 * p);
    ctx.fillRect(0, 30 * p, 32 * p, 2 * p);
    
    ctx.fillStyle = '#8B5A2B';
    ctx.fillRect(2 * p, 2 * p, 28 * p, 28 * p);
    
    ctx.fillStyle = adjustColor('#8B5A2B', 15);
    ctx.fillRect(2 * p, 2 * p, 2 * p, 28 * p);
    
    ctx.fillStyle = adjustColor('#8B5A2B', -15);
    ctx.fillRect(28 * p, 2 * p, 2 * p, 28 * p);
    
    ctx.fillStyle = '#A07840';
    ctx.fillRect(2 * p, 10 * p, 28 * p, 2 * p);
    ctx.fillRect(2 * p, 20 * p, 28 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#A07840', 20);
    ctx.fillRect(2 * p, 10 * p, 28 * p, p);
    ctx.fillRect(2 * p, 20 * p, 28 * p, p);
    
    ctx.fillStyle = adjustColor('#A07840', -15);
    ctx.fillRect(2 * p, 11 * p, 28 * p, p);
    ctx.fillRect(2 * p, 21 * p, 28 * p, p);
    
    const bookColors = ['#C0392B', '#2980B9', '#27AE60', '#F39C12', '#8E44AD', '#16A085'];
    for (let i = 0; i < 6; i++) {
      const bookWidth = 3 + Math.floor(Math.random() * 2);
      const bookX = 4 + i * 4;
      ctx.fillStyle = bookColors[i];
      ctx.fillRect(bookX * p, 3 * p, bookWidth * p, 6 * p);
      
      ctx.fillStyle = adjustColor(bookColors[i], 30);
      ctx.fillRect(bookX * p, 3 * p, p, 6 * p);
      
      ctx.fillStyle = adjustColor(bookColors[i], -20);
      ctx.fillRect((bookX + bookWidth - 1) * p, 3 * p, p, 6 * p);
    }
    
    for (let i = 0; i < 5; i++) {
      const bookWidth = 3 + Math.floor(Math.random() * 2);
      const bookX = 5 + i * 5;
      ctx.fillStyle = bookColors[(i + 2) % 6];
      ctx.fillRect(bookX * p, 13 * p, bookWidth * p, 6 * p);
      
      ctx.fillStyle = adjustColor(bookColors[(i + 2) % 6], 30);
      ctx.fillRect(bookX * p, 13 * p, p, 6 * p);
    }
    
    for (let i = 0; i < 4; i++) {
      const bookWidth = 4 + Math.floor(Math.random() * 2);
      const bookX = 5 + i * 6;
      ctx.fillStyle = bookColors[(i + 4) % 6];
      ctx.fillRect(bookX * p, 23 * p, bookWidth * p, 6 * p);
      
      ctx.fillStyle = adjustColor(bookColors[(i + 4) % 6], 30);
      ctx.fillRect(bookX * p, 23 * p, p, 6 * p);
    }
  };
}

function generateLampPixels(lightColor) {
  return (ctx, size) => {
    const p = size / PIXEL_RESOLUTION;
    
    drawFeatheredShadow(ctx, 8 * p, 30 * p, 16 * p, 4 * p, p);
    
    ctx.fillStyle = adjustColor('#404040', -50);
    ctx.fillRect(10 * p, 32 * p, 12 * p, 2 * p);
    ctx.fillStyle = adjustColor('#404040', -60);
    ctx.fillRect(10 * p, 32 * p, 2 * p, 2 * p);
    
    const glowGradient = ctx.createRadialGradient(16 * p, 10 * p, 0, 16 * p, 10 * p, 14 * p);
    glowGradient.addColorStop(0, adjustColor(lightColor, 60));
    glowGradient.addColorStop(0.5, adjustColor(lightColor, 20));
    glowGradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glowGradient;
    ctx.fillRect(4 * p, 0, 24 * p, 20 * p);
    
    ctx.fillStyle = '#404040';
    ctx.fillRect(10 * p, 26 * p, 12 * p, 6 * p);
    
    ctx.fillStyle = adjustColor('#404040', 20);
    ctx.fillRect(10 * p, 26 * p, 2 * p, 6 * p);
    ctx.fillRect(10 * p, 26 * p, 12 * p, p);
    
    ctx.fillStyle = adjustColor('#404040', -20);
    ctx.fillRect(20 * p, 26 * p, 2 * p, 6 * p);
    
    ctx.fillStyle = '#606060';
    ctx.fillRect(11 * p, 26 * p, 10 * p, 2 * p);
    
    ctx.fillStyle = '#505050';
    ctx.fillRect(14 * p, 10 * p, 4 * p, 16 * p);
    
    ctx.fillStyle = adjustColor('#505050', 25);
    ctx.fillRect(14 * p, 10 * p, p, 16 * p);
    
    ctx.fillStyle = adjustColor('#505050', -20);
    ctx.fillRect(17 * p, 10 * p, p, 16 * p);
    
    ctx.fillStyle = '#707070';
    ctx.fillRect(14 * p, 10 * p, p, 16 * p);
    
    ctx.fillStyle = lightColor;
    ctx.fillRect(6 * p, 0, 20 * p, 12 * p);
    ctx.fillRect(8 * p, 0, 16 * p, 14 * p);
    
    ctx.fillStyle = adjustColor(lightColor, 20);
    ctx.fillRect(6 * p, 0, 2 * p, 12 * p);
    ctx.fillRect(8 * p, 0, 2 * p, 14 * p);
    
    ctx.fillStyle = adjustColor(lightColor, -15);
    ctx.fillRect(24 * p, 0, 2 * p, 12 * p);
    ctx.fillRect(22 * p, 0, 2 * p, 14 * p);
    
    ctx.fillStyle = adjustColor(lightColor, 40);
    ctx.fillRect(10 * p, 2 * p, 12 * p, 10 * p);
    
    ctx.fillStyle = adjustColor(lightColor, 50);
    ctx.fillRect(10 * p, 2 * p, 2 * p, 10 * p);
    
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(10 * p, 2 * p, 4 * p, 8 * p);
    
    ctx.fillStyle = adjustColor(lightColor, -20);
    ctx.fillRect(6 * p, 0, 20 * p, p);
    ctx.fillRect(6 * p, 11 * p, 20 * p, p);
  };
}

function generateRugPixels(color) {
  return (ctx, size) => {
    const p = size / PIXEL_RESOLUTION;
    
    // 地毯陰影
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(2 * p, 26 * p, 28 * p, 6 * p);
    
    // 地毯主體
    drawCarpetTexture(ctx, 0, 6 * p, 32 * p, 20 * p, color, p);
    
    // 地毯邊框裝飾
    ctx.fillStyle = adjustColor(color, -40);
    ctx.fillRect(2 * p, 8 * p, 28 * p, 2 * p);
    ctx.fillRect(2 * p, 22 * p, 28 * p, 2 * p);
    
    // 地毯中心圖案
    ctx.fillStyle = adjustColor(color, 50);
    ctx.fillRect(12 * p, 12 * p, 8 * p, 8 * p);
    
    // 中心裝飾
    ctx.fillStyle = adjustColor(color, 70);
    ctx.fillRect(14 * p, 14 * p, 4 * p, 4 * p);
    
    // 角落裝飾
    ctx.fillStyle = adjustColor(color, 30);
    ctx.fillRect(6 * p, 10 * p, 4 * p, 4 * p);
    ctx.fillRect(22 * p, 10 * p, 4 * p, 4 * p);
    ctx.fillRect(6 * p, 18 * p, 4 * p, 4 * p);
    ctx.fillRect(22 * p, 18 * p, 4 * p, 4 * p);
  };
}

function generatePosterPixels() {
  return (ctx, size) => {
    const p = size / PIXEL_RESOLUTION;
    
    // 海報框陰影
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(2 * p, 2 * p, 28 * p, 28 * p);
    
    // 海報框
    drawWoodGrain(ctx, 0, 0, 32 * p, 32 * p, '#4A4A4A', p);
    
    // 海報內框
    ctx.fillStyle = '#6A6A6A';
    ctx.fillRect(2 * p, 2 * p, 28 * p, 28 * p);
    
    // 海報背景
    ctx.fillStyle = '#E74C3C';
    ctx.fillRect(4 * p, 4 * p, 24 * p, 18 * p);
    
    // 海報漸層
    const posterGradient = ctx.createLinearGradient(4 * p, 4 * p, 28 * p, 22 * p);
    posterGradient.addColorStop(0, '#E74C3C');
    posterGradient.addColorStop(1, '#C0392B');
    ctx.fillStyle = posterGradient;
    ctx.fillRect(4 * p, 4 * p, 24 * p, 18 * p);
    
    // 海報底部
    ctx.fillStyle = '#922B21';
    ctx.fillRect(4 * p, 18 * p, 24 * p, 4 * p);
    
    // 海報圖案 - 白色區塊
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(8 * p, 8 * p, 16 * p, 10 * p);
    
    // 圖案內容
    ctx.fillStyle = '#3498DB';
    ctx.fillRect(10 * p, 10 * p, 12 * p, 6 * p);
    
    // 圖案高光
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(10 * p, 10 * p, 12 * p, 2 * p);
    
    // 框邊緣高光
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(0, 0, 32 * p, p);
    ctx.fillRect(0, 0, p, 32 * p);
  };
}

function generatePlantPixels(type) {
  return (ctx, size) => {
    const p = size / PIXEL_RESOLUTION;
    
    const isBig = type === 'big';
    const potHeight = isBig ? 8 : 10;
    const leafStart = isBig ? 20 : 18;
    
    drawFeatheredShadow(ctx, 6 * p, 30 * p, 20 * p, 4 * p, p);
    
    ctx.fillStyle = adjustColor('#8B4513', -50);
    ctx.fillRect(8 * p, 32 * p, 16 * p, 2 * p);
    ctx.fillStyle = adjustColor('#8B4513', -60);
    ctx.fillRect(8 * p, 32 * p, 2 * p, 2 * p);
    
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(8 * p, (32 - potHeight) * p, 16 * p, potHeight * p);
    
    ctx.fillStyle = adjustColor('#8B4513', 20);
    ctx.fillRect(8 * p, (32 - potHeight) * p, 2 * p, potHeight * p);
    
    ctx.fillStyle = adjustColor('#8B4513', -20);
    ctx.fillRect(22 * p, (32 - potHeight) * p, 2 * p, potHeight * p);
    
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(10 * p, (32 - potHeight) * p, 12 * p, potHeight * p);
    
    ctx.fillStyle = '#CD853F';
    ctx.fillRect(8 * p, (32 - potHeight) * p, 16 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#CD853F', 20);
    ctx.fillRect(8 * p, (32 - potHeight) * p, 2 * p, 2 * p);
    
    ctx.fillStyle = '#3D2817';
    ctx.fillRect(10 * p, (32 - potHeight + 2) * p, 12 * p, 2 * p);
    
    drawLeafTexture(ctx, 6 * p, leafStart * p, 20 * p, 10 * p, '#228B22', p);
    
    ctx.fillStyle = adjustColor('#228B22', 25);
    ctx.fillRect(6 * p, leafStart * p, 2 * p, 10 * p);
    
    ctx.fillStyle = adjustColor('#228B22', -20);
    ctx.fillRect(24 * p, leafStart * p, 2 * p, 10 * p);
    
    ctx.fillStyle = '#2E8B2E';
    ctx.fillRect(4 * p, (leafStart + 2) * p, 24 * p, 6 * p);
    
    ctx.fillStyle = adjustColor('#2E8B2E', 20);
    ctx.fillRect(4 * p, (leafStart + 2) * p, 2 * p, 6 * p);
    
    ctx.fillStyle = '#32CD32';
    ctx.fillRect(10 * p, (leafStart - 6) * p, 12 * p, 8 * p);
    
    ctx.fillStyle = adjustColor('#32CD32', 25);
    ctx.fillRect(10 * p, (leafStart - 6) * p, 2 * p, 8 * p);
    ctx.fillRect(10 * p, (leafStart - 6) * p, 12 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#32CD32', -15);
    ctx.fillRect(20 * p, (leafStart - 6) * p, 2 * p, 8 * p);
    ctx.fillRect(10 * p, (leafStart - 6 + 6) * p, 12 * p, 2 * p);
    
    ctx.fillStyle = '#3CB371';
    ctx.fillRect(8 * p, (leafStart + 3) * p, 6 * p, 6 * p);
    ctx.fillRect(18 * p, (leafStart + 3) * p, 6 * p, 6 * p);
    ctx.fillRect(12 * p, (leafStart - 4) * p, 8 * p, 4 * p);
    
    ctx.fillStyle = '#1B6B1B';
    ctx.fillRect(6 * p, (leafStart + 8) * p, 4 * p, 2 * p);
    ctx.fillRect(22 * p, (leafStart + 8) * p, 4 * p, 2 * p);
  };
}

function generateFlowerPixels() {
  return (ctx, size) => {
    const p = size / PIXEL_RESOLUTION;
    
    drawFeatheredShadow(ctx, 8 * p, 30 * p, 16 * p, 4 * p, p);
    
    ctx.fillStyle = adjustColor('#8B4513', -50);
    ctx.fillRect(10 * p, 32 * p, 12 * p, 2 * p);
    ctx.fillStyle = adjustColor('#8B4513', -60);
    ctx.fillRect(10 * p, 32 * p, 2 * p, 2 * p);
    
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(10 * p, 20 * p, 12 * p, 12 * p);
    
    ctx.fillStyle = adjustColor('#8B4513', 20);
    ctx.fillRect(10 * p, 20 * p, 2 * p, 12 * p);
    
    ctx.fillStyle = adjustColor('#8B4513', -20);
    ctx.fillRect(20 * p, 20 * p, 2 * p, 12 * p);
    
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(12 * p, 20 * p, 8 * p, 12 * p);
    
    ctx.fillStyle = '#CD853F';
    ctx.fillRect(10 * p, 20 * p, 12 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#CD853F', 20);
    ctx.fillRect(10 * p, 20 * p, 2 * p, 2 * p);
    
    ctx.fillStyle = '#3D2817';
    ctx.fillRect(12 * p, 22 * p, 8 * p, 2 * p);
    
    ctx.fillStyle = '#228B22';
    ctx.fillRect(14 * p, 8 * p, 4 * p, 14 * p);
    
    ctx.fillStyle = adjustColor('#228B22', 25);
    ctx.fillRect(14 * p, 8 * p, p, 14 * p);
    
    ctx.fillStyle = adjustColor('#228B22', -20);
    ctx.fillRect(17 * p, 8 * p, p, 14 * p);
    
    ctx.fillStyle = '#32CD32';
    ctx.fillRect(14 * p, 8 * p, p, 14 * p);
    
    ctx.fillStyle = '#2E8B2E';
    ctx.fillRect(10 * p, 12 * p, 4 * p, 6 * p);
    ctx.fillRect(18 * p, 10 * p, 4 * p, 6 * p);
    
    ctx.fillStyle = adjustColor('#2E8B2E', 25);
    ctx.fillRect(10 * p, 12 * p, p, 6 * p);
    ctx.fillRect(18 * p, 10 * p, p, 6 * p);
    
    ctx.fillStyle = adjustColor('#2E8B2E', -15);
    ctx.fillRect(13 * p, 12 * p, p, 6 * p);
    ctx.fillRect(21 * p, 10 * p, p, 6 * p);
    
    ctx.fillStyle = '#3CB371';
    ctx.fillRect(10 * p, 12 * p, 2 * p, 4 * p);
    ctx.fillRect(18 * p, 10 * p, 2 * p, 4 * p);
    
    ctx.fillStyle = '#FF69B4';
    ctx.fillRect(8 * p, 0, 16 * p, 10 * p);
    ctx.fillRect(6 * p, 2 * p, 20 * p, 6 * p);
    
    ctx.fillStyle = adjustColor('#FF69B4', 25);
    ctx.fillRect(6 * p, 2 * p, 2 * p, 6 * p);
    ctx.fillRect(8 * p, 0, 2 * p, 10 * p);
    
    ctx.fillStyle = adjustColor('#FF69B4', -20);
    ctx.fillRect(24 * p, 2 * p, 2 * p, 6 * p);
    ctx.fillRect(22 * p, 0, 2 * p, 10 * p);
    
    ctx.fillStyle = '#FF1493';
    ctx.fillRect(10 * p, 2 * p, 12 * p, 6 * p);
    ctx.fillRect(8 * p, 3 * p, 16 * p, 4 * p);
    
    ctx.fillStyle = adjustColor('#FF1493', 20);
    ctx.fillRect(8 * p, 3 * p, 2 * p, 4 * p);
    ctx.fillRect(10 * p, 2 * p, 2 * p, 6 * p);
    
    ctx.fillStyle = '#FFB6C1';
    ctx.fillRect(10 * p, 2 * p, 4 * p, 3 * p);
    
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(12 * p, 4 * p, 8 * p, 4 * p);
    
    ctx.fillStyle = adjustColor('#FFD700', 30);
    ctx.fillRect(12 * p, 4 * p, 2 * p, 4 * p);
    
    ctx.fillStyle = '#FFA500';
    ctx.fillRect(14 * p, 5 * p, 4 * p, 2 * p);
    
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(12 * p, 4 * p, 2 * p, 2 * p);
  };
}

function generateTVPixels() {
  return (ctx, size) => {
    const p = size / PIXEL_RESOLUTION;
    
    drawFeatheredShadow(ctx, 2 * p, 30 * p, 28 * p, 4 * p, p);
    
    ctx.fillStyle = adjustColor('#2A2A2A', -50);
    ctx.fillRect(10 * p, 32 * p, 12 * p, 2 * p);
    ctx.fillStyle = adjustColor('#2A2A2A', -60);
    ctx.fillRect(10 * p, 32 * p, 2 * p, 2 * p);
    
    ctx.fillStyle = '#2A2A2A';
    ctx.fillRect(0, 4 * p, 32 * p, 24 * p);
    
    ctx.fillStyle = adjustColor('#2A2A2A', 20);
    ctx.fillRect(0, 4 * p, 2 * p, 24 * p);
    ctx.fillRect(0, 4 * p, 32 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#2A2A2A', -20);
    ctx.fillRect(30 * p, 4 * p, 2 * p, 24 * p);
    ctx.fillRect(0, 26 * p, 32 * p, 2 * p);
    
    ctx.fillStyle = '#404040';
    ctx.fillRect(2 * p, 6 * p, 28 * p, 20 * p);
    
    ctx.fillStyle = adjustColor('#404040', 15);
    ctx.fillRect(2 * p, 6 * p, 2 * p, 20 * p);
    
    ctx.fillStyle = adjustColor('#404040', -15);
    ctx.fillRect(28 * p, 6 * p, 2 * p, 20 * p);
    
    drawScreenGlow(ctx, 4 * p, 8 * p, 24 * p, 16 * p, '#4A90D0', p);
    
    ctx.fillStyle = '#6EB5FF';
    ctx.fillRect(6 * p, 10 * p, 20 * p, 12 * p);
    
    ctx.fillStyle = adjustColor('#6EB5FF', 30);
    ctx.fillRect(6 * p, 10 * p, 2 * p, 12 * p);
    ctx.fillRect(6 * p, 10 * p, 20 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#6EB5FF', -20);
    ctx.fillRect(24 * p, 10 * p, 2 * p, 12 * p);
    ctx.fillRect(6 * p, 20 * p, 20 * p, 2 * p);
    
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(6 * p, 10 * p, 20 * p, 3 * p);
    
    ctx.fillStyle = '#2A60A0';
    ctx.fillRect(4 * p, 20 * p, 24 * p, 4 * p);
    
    ctx.fillStyle = '#505050';
    ctx.fillRect(10 * p, 28 * p, 12 * p, 4 * p);
    
    ctx.fillStyle = adjustColor('#505050', 20);
    ctx.fillRect(10 * p, 28 * p, 2 * p, 4 * p);
    ctx.fillRect(10 * p, 28 * p, 12 * p, p);
    
    ctx.fillStyle = adjustColor('#505050', -15);
    ctx.fillRect(20 * p, 28 * p, 2 * p, 4 * p);
    
    ctx.fillStyle = '#707070';
    ctx.fillRect(10 * p, 28 * p, 12 * p, p);
  };
}

function generateComputerPixels() {
  return (ctx, size) => {
    const p = size / PIXEL_RESOLUTION;
    
    drawFeatheredShadow(ctx, 6 * p, 30 * p, 20 * p, 4 * p, p);
    
    ctx.fillStyle = adjustColor('#606060', -50);
    ctx.fillRect(8 * p, 32 * p, 16 * p, 2 * p);
    ctx.fillStyle = adjustColor('#606060', -60);
    ctx.fillRect(8 * p, 32 * p, 2 * p, 2 * p);
    
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(6 * p, 18 * p, 20 * p, 2 * p);
    
    ctx.fillStyle = '#2A2A2A';
    ctx.fillRect(4 * p, 0, 24 * p, 20 * p);
    
    ctx.fillStyle = adjustColor('#2A2A2A', 20);
    ctx.fillRect(4 * p, 0, 2 * p, 20 * p);
    ctx.fillRect(4 * p, 0, 24 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#2A2A2A', -20);
    ctx.fillRect(26 * p, 0, 2 * p, 20 * p);
    ctx.fillRect(4 * p, 18 * p, 24 * p, 2 * p);
    
    ctx.fillStyle = '#404040';
    ctx.fillRect(6 * p, 2 * p, 20 * p, 16 * p);
    
    ctx.fillStyle = adjustColor('#404040', 15);
    ctx.fillRect(6 * p, 2 * p, 2 * p, 16 * p);
    
    ctx.fillStyle = adjustColor('#404040', -15);
    ctx.fillRect(24 * p, 2 * p, 2 * p, 16 * p);
    
    drawScreenGlow(ctx, 8 * p, 4 * p, 16 * p, 12 * p, '#4A90D0', p);
    
    ctx.fillStyle = '#6EB5FF';
    ctx.fillRect(10 * p, 6 * p, 12 * p, 8 * p);
    
    ctx.fillStyle = adjustColor('#6EB5FF', 30);
    ctx.fillRect(10 * p, 6 * p, 2 * p, 8 * p);
    ctx.fillRect(10 * p, 6 * p, 12 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#6EB5FF', -20);
    ctx.fillRect(20 * p, 6 * p, 2 * p, 8 * p);
    ctx.fillRect(10 * p, 12 * p, 12 * p, 2 * p);
    
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(8 * p, 4 * p, 16 * p, 2 * p);
    
    ctx.fillStyle = '#505050';
    ctx.fillRect(12 * p, 20 * p, 8 * p, 4 * p);
    
    ctx.fillStyle = adjustColor('#505050', 20);
    ctx.fillRect(12 * p, 20 * p, 2 * p, 4 * p);
    
    ctx.fillStyle = adjustColor('#505050', -15);
    ctx.fillRect(18 * p, 20 * p, 2 * p, 4 * p);
    
    ctx.fillStyle = '#606060';
    ctx.fillRect(8 * p, 24 * p, 16 * p, 8 * p);
    
    ctx.fillStyle = adjustColor('#606060', 20);
    ctx.fillRect(8 * p, 24 * p, 2 * p, 8 * p);
    ctx.fillRect(8 * p, 24 * p, 16 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#606060', -20);
    ctx.fillRect(22 * p, 24 * p, 2 * p, 8 * p);
    ctx.fillRect(8 * p, 30 * p, 16 * p, 2 * p);
    
    ctx.fillStyle = '#808080';
    ctx.fillRect(8 * p, 24 * p, 16 * p, 2 * p);
    
    ctx.fillStyle = '#404040';
    ctx.fillRect(6 * p, 28 * p, 20 * p, 3 * p);
    
    ctx.fillStyle = adjustColor('#404040', 15);
    ctx.fillRect(6 * p, 28 * p, 2 * p, 3 * p);
    
    ctx.fillStyle = adjustColor('#404040', -15);
    ctx.fillRect(24 * p, 28 * p, 2 * p, 3 * p);
    
    ctx.fillStyle = '#606060';
    for (let i = 0; i < 8; i++) {
      ctx.fillRect((8 + i * 2) * p, 28.5 * p, 1.5 * p, 2 * p);
      
      ctx.fillStyle = adjustColor('#606060', 25);
      ctx.fillRect((8 + i * 2) * p, 28.5 * p, 0.5 * p, 2 * p);
      
      ctx.fillStyle = '#606060';
    }
  };
}

function generateGamePixels() {
  return (ctx, size) => {
    const p = size / PIXEL_RESOLUTION;
    
    // 遊戲機陰影
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(4 * p, 22 * p, 24 * p, 2 * p);
    
    // 遊戲機主體
    ctx.fillStyle = '#2A2A2A';
    ctx.fillRect(4 * p, 8 * p, 24 * p, 14 * p);
    
    // 遊戲機內框
    ctx.fillStyle = '#404040';
    ctx.fillRect(6 * p, 10 * p, 20 * p, 10 * p);
    
    // 左側按鍵區
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(8 * p, 12 * p, 8 * p, 6 * p);
    
    // 十字鍵
    ctx.fillStyle = '#00FF88';
    ctx.fillRect(10 * p, 13 * p, 4 * p, 4 * p);
    ctx.fillRect(9 * p, 14 * p, 6 * p, 2 * p);
    
    // 十字鍵高光
    ctx.fillStyle = '#00CC66';
    ctx.fillRect(11 * p, 14 * p, 2 * p, 2 * p);
    
    // 右側按鍵區
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(18 * p, 12 * p, 8 * p, 6 * p);
    
    // AB按鍵
    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(19 * p, 13 * p, 3 * p, 3 * p);
    ctx.fillStyle = '#4ECDC4';
    ctx.fillRect(23 * p, 14 * p, 3 * p, 3 * p);
    
    // 按鍵高光
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(19 * p, 13 * p, 3 * p, p);
    ctx.fillRect(23 * p, 14 * p, 3 * p, p);
    
    // 遊戲機邊緣
    ctx.fillStyle = '#505050';
    ctx.fillRect(4 * p, 8 * p, 24 * p, p);
  };
}

function generateFridgePixels() {
  return (ctx, size) => {
    const p = size / PIXEL_RESOLUTION;
    
    drawFeatheredShadow(ctx, 2 * p, 30 * p, 28 * p, 4 * p, p);
    
    ctx.fillStyle = adjustColor('#D8D8D8', -50);
    ctx.fillRect(0, 32 * p, 32 * p, 3 * p);
    ctx.fillStyle = adjustColor('#D8D8D8', -60);
    ctx.fillRect(0, 32 * p, 2 * p, 3 * p);
    
    ctx.fillStyle = '#D8D8D8';
    ctx.fillRect(0, 0, 32 * p, 32 * p);
    
    ctx.fillStyle = adjustColor('#D8D8D8', 25);
    ctx.fillRect(0, 0, 3 * p, 32 * p);
    ctx.fillRect(0, 0, 32 * p, 3 * p);
    
    ctx.fillStyle = adjustColor('#D8D8D8', -25);
    ctx.fillRect(29 * p, 0, 3 * p, 32 * p);
    ctx.fillRect(0, 29 * p, 32 * p, 3 * p);
    
    ctx.fillStyle = '#E8E8E8';
    ctx.fillRect(2 * p, 2 * p, 28 * p, 28 * p);
    
    ctx.fillStyle = adjustColor('#E8E8E8', 15);
    ctx.fillRect(2 * p, 2 * p, 2 * p, 28 * p);
    
    ctx.fillStyle = adjustColor('#E8E8E8', -15);
    ctx.fillRect(28 * p, 2 * p, 2 * p, 28 * p);
    
    ctx.fillStyle = '#C8C8C8';
    ctx.fillRect(2 * p, 2 * p, 28 * p, 12 * p);
    
    ctx.fillStyle = adjustColor('#C8C8C8', 20);
    ctx.fillRect(2 * p, 2 * p, 2 * p, 12 * p);
    ctx.fillRect(2 * p, 2 * p, 28 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#C8C8C8', -20);
    ctx.fillRect(28 * p, 2 * p, 2 * p, 12 * p);
    ctx.fillRect(2 * p, 12 * p, 28 * p, 2 * p);
    
    ctx.fillStyle = '#D8D8D8';
    ctx.fillRect(4 * p, 4 * p, 24 * p, 8 * p);
    
    ctx.fillStyle = adjustColor('#D8D8D8', 20);
    ctx.fillRect(4 * p, 4 * p, 2 * p, 8 * p);
    ctx.fillRect(4 * p, 4 * p, 24 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#D8D8D8', -15);
    ctx.fillRect(26 * p, 4 * p, 2 * p, 8 * p);
    ctx.fillRect(4 * p, 10 * p, 24 * p, 2 * p);
    
    ctx.fillStyle = '#B8B8B8';
    ctx.fillRect(2 * p, 13 * p, 28 * p, p);
    
    ctx.fillStyle = '#E0E0E0';
    ctx.fillRect(2 * p, 14 * p, 28 * p, 16 * p);
    
    ctx.fillStyle = adjustColor('#E0E0E0', 20);
    ctx.fillRect(2 * p, 14 * p, 2 * p, 16 * p);
    
    ctx.fillStyle = adjustColor('#E0E0E0', -15);
    ctx.fillRect(28 * p, 14 * p, 2 * p, 16 * p);
    
    ctx.fillStyle = '#F0F0F0';
    ctx.fillRect(4 * p, 16 * p, 24 * p, 12 * p);
    
    ctx.fillStyle = adjustColor('#F0F0F0', 20);
    ctx.fillRect(4 * p, 16 * p, 2 * p, 12 * p);
    ctx.fillRect(4 * p, 16 * p, 24 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#F0F0F0', -15);
    ctx.fillRect(26 * p, 16 * p, 2 * p, 12 * p);
    ctx.fillRect(4 * p, 26 * p, 24 * p, 2 * p);
    
    drawMetallicShine(ctx, 24 * p, 6 * p, 4 * p, 6 * p, '#A0A0A0');
    drawMetallicShine(ctx, 24 * p, 20 * p, 4 * p, 6 * p, '#A0A0A0');
  };
}

function generateWardrobePixels() {
  return (ctx, size) => {
    const p = size / PIXEL_RESOLUTION;
    
    drawFeatheredShadow(ctx, 2 * p, 30 * p, 28 * p, 4 * p, p);
    
    ctx.fillStyle = adjustColor('#5D3A1A', -50);
    ctx.fillRect(0, 32 * p, 32 * p, 3 * p);
    ctx.fillStyle = adjustColor('#5D3A1A', -60);
    ctx.fillRect(0, 32 * p, 2 * p, 3 * p);
    
    drawWoodGrain(ctx, 0, 0, 32 * p, 32 * p, '#5D3A1A', p);
    
    ctx.fillStyle = adjustColor('#5D3A1A', 20);
    ctx.fillRect(0, 0, 2 * p, 32 * p);
    ctx.fillRect(0, 0, 32 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#5D3A1A', -20);
    ctx.fillRect(30 * p, 0, 2 * p, 32 * p);
    ctx.fillRect(0, 30 * p, 32 * p, 2 * p);
    
    ctx.fillStyle = '#8B5A2B';
    ctx.fillRect(2 * p, 2 * p, 28 * p, 28 * p);
    
    ctx.fillStyle = adjustColor('#8B5A2B', 15);
    ctx.fillRect(2 * p, 2 * p, 2 * p, 28 * p);
    
    ctx.fillStyle = adjustColor('#8B5A2B', -15);
    ctx.fillRect(28 * p, 2 * p, 2 * p, 28 * p);
    
    ctx.fillStyle = '#A07840';
    ctx.fillRect(3 * p, 3 * p, 12 * p, 26 * p);
    
    ctx.fillStyle = adjustColor('#A07840', 20);
    ctx.fillRect(3 * p, 3 * p, 2 * p, 26 * p);
    ctx.fillRect(3 * p, 3 * p, 12 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#A07840', -15);
    ctx.fillRect(13 * p, 3 * p, 2 * p, 26 * p);
    ctx.fillRect(3 * p, 27 * p, 12 * p, 2 * p);
    
    ctx.fillStyle = '#C9A66B';
    ctx.fillRect(5 * p, 5 * p, 8 * p, 22 * p);
    
    ctx.fillStyle = adjustColor('#C9A66B', 20);
    ctx.fillRect(5 * p, 5 * p, 2 * p, 22 * p);
    ctx.fillRect(5 * p, 5 * p, 8 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#C9A66B', -15);
    ctx.fillRect(11 * p, 5 * p, 2 * p, 22 * p);
    ctx.fillRect(5 * p, 25 * p, 8 * p, 2 * p);
    
    ctx.fillStyle = '#A07840';
    ctx.fillRect(17 * p, 3 * p, 12 * p, 26 * p);
    
    ctx.fillStyle = adjustColor('#A07840', 20);
    ctx.fillRect(17 * p, 3 * p, 2 * p, 26 * p);
    ctx.fillRect(17 * p, 3 * p, 12 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#A07840', -15);
    ctx.fillRect(27 * p, 3 * p, 2 * p, 26 * p);
    ctx.fillRect(17 * p, 27 * p, 12 * p, 2 * p);
    
    ctx.fillStyle = '#C9A66B';
    ctx.fillRect(19 * p, 5 * p, 8 * p, 22 * p);
    
    ctx.fillStyle = adjustColor('#C9A66B', 20);
    ctx.fillRect(19 * p, 5 * p, 2 * p, 22 * p);
    ctx.fillRect(19 * p, 5 * p, 8 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#C9A66B', -15);
    ctx.fillRect(25 * p, 5 * p, 2 * p, 22 * p);
    ctx.fillRect(19 * p, 25 * p, 8 * p, 2 * p);
    
    ctx.fillStyle = '#5D3A1A';
    ctx.fillRect(15 * p, 3 * p, 2 * p, 26 * p);
    
    drawMetallicShine(ctx, 11 * p, 14 * p, 3 * p, 4 * p, '#DAA520');
    drawMetallicShine(ctx, 18 * p, 14 * p, 3 * p, 4 * p, '#DAA520');
    
    ctx.fillStyle = '#4A2F1A';
    ctx.fillRect(0, 0, 32 * p, 3 * p);
    
    ctx.fillStyle = adjustColor('#4A2F1A', 20);
    ctx.fillRect(0, 0, 2 * p, 3 * p);
  };
}

function generateMirrorPixels() {
  return (ctx, size) => {
    const p = size / PIXEL_RESOLUTION;
    
    drawFeatheredShadow(ctx, 2 * p, 30 * p, 28 * p, 4 * p, p);
    
    ctx.fillStyle = adjustColor('#5D3A1A', -50);
    ctx.fillRect(0, 32 * p, 32 * p, 3 * p);
    ctx.fillStyle = adjustColor('#5D3A1A', -60);
    ctx.fillRect(0, 32 * p, 2 * p, 3 * p);
    
    drawWoodGrain(ctx, 0, 0, 32 * p, 32 * p, '#5D3A1A', p);
    
    ctx.fillStyle = adjustColor('#5D3A1A', 20);
    ctx.fillRect(0, 0, 2 * p, 32 * p);
    ctx.fillRect(0, 0, 32 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#5D3A1A', -20);
    ctx.fillRect(30 * p, 0, 2 * p, 32 * p);
    ctx.fillRect(0, 30 * p, 32 * p, 2 * p);
    
    ctx.fillStyle = '#8B5A2B';
    ctx.fillRect(2 * p, 2 * p, 28 * p, 28 * p);
    
    ctx.fillStyle = adjustColor('#8B5A2B', 15);
    ctx.fillRect(2 * p, 2 * p, 2 * p, 28 * p);
    
    ctx.fillStyle = adjustColor('#8B5A2B', -15);
    ctx.fillRect(28 * p, 2 * p, 2 * p, 28 * p);
    
    drawGlassEffect(ctx, 4 * p, 4 * p, 24 * p, 24 * p, '#6EB5FF');
    
    ctx.fillStyle = adjustColor('#6EB5FF', 30);
    ctx.fillRect(4 * p, 4 * p, 2 * p, 24 * p);
    ctx.fillRect(4 * p, 4 * p, 24 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#6EB5FF', -20);
    ctx.fillRect(26 * p, 4 * p, 2 * p, 24 * p);
    ctx.fillRect(4 * p, 26 * p, 24 * p, 2 * p);
    
    const mirrorGradient = ctx.createLinearGradient(4 * p, 4 * p, 28 * p, 28 * p);
    mirrorGradient.addColorStop(0, 'rgba(255,255,255,0.3)');
    mirrorGradient.addColorStop(0.3, 'rgba(255,255,255,0.1)');
    mirrorGradient.addColorStop(0.5, 'rgba(255,255,255,0.05)');
    mirrorGradient.addColorStop(1, 'rgba(255,255,255,0.2)');
    ctx.fillStyle = mirrorGradient;
    ctx.fillRect(4 * p, 4 * p, 24 * p, 24 * p);
    
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(6 * p, 6 * p, 8 * p, 12 * p);
    
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(8 * p, 8 * p, 4 * p, 8 * p);
  };
}

function generateWindowPixels() {
  return (ctx, size) => {
    const p = size / PIXEL_RESOLUTION;
    
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(0, 0, 32 * p, 32 * p);
    
    const skyGradient = ctx.createLinearGradient(0, 0, 0, 32 * p);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(0.5, '#6EB5FF');
    skyGradient.addColorStop(1, '#4A90D0');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, 32 * p, 32 * p);
    
    ctx.fillStyle = adjustColor('#87CEEB', 30);
    ctx.fillRect(0, 0, 32 * p, 4 * p);
    
    ctx.fillStyle = adjustColor('#4A90D0', -20);
    ctx.fillRect(0, 28 * p, 32 * p, 4 * p);
    
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillRect(4 * p, 4 * p, 8 * p, 4 * p);
    ctx.fillRect(6 * p, 6 * p, 6 * p, 3 * p);
    ctx.fillRect(20 * p, 8 * p, 8 * p, 3 * p);
    ctx.fillRect(22 * p, 6 * p, 5 * p, 3 * p);
    
    drawWoodGrain(ctx, 14 * p, 0, 4 * p, 32 * p, '#C9A66B', p);
    
    ctx.fillStyle = adjustColor('#C9A66B', 20);
    ctx.fillRect(14 * p, 0, p, 32 * p);
    
    ctx.fillStyle = adjustColor('#C9A66B', -20);
    ctx.fillRect(17 * p, 0, p, 32 * p);
    
    ctx.fillStyle = '#A07840';
    ctx.fillRect(14 * p, 0, p, 32 * p);
    ctx.fillRect(17 * p, 0, p, 32 * p);
    
    drawWoodGrain(ctx, 0, 14 * p, 32 * p, 4 * p, '#C9A66B', p);
    
    ctx.fillStyle = adjustColor('#C9A66B', 20);
    ctx.fillRect(0, 14 * p, 32 * p, p);
    
    ctx.fillStyle = adjustColor('#C9A66B', -20);
    ctx.fillRect(0, 17 * p, 32 * p, p);
    
    ctx.fillStyle = '#A07840';
    ctx.fillRect(0, 14 * p, 32 * p, p);
    ctx.fillRect(0, 17 * p, 32 * p, p);
    
    ctx.fillStyle = '#8B5A2B';
    ctx.fillRect(0, 0, 32 * p, 2 * p);
    ctx.fillRect(0, 30 * p, 32 * p, 2 * p);
    ctx.fillRect(0, 0, 2 * p, 32 * p);
    ctx.fillRect(30 * p, 0, 2 * p, 32 * p);
    
    ctx.fillStyle = adjustColor('#8B5A2B', 20);
    ctx.fillRect(0, 0, 2 * p, 2 * p);
    ctx.fillRect(0, 0, 2 * p, 32 * p);
    
    ctx.fillStyle = adjustColor('#8B5A2B', -20);
    ctx.fillRect(30 * p, 0, 2 * p, 32 * p);
    ctx.fillRect(0, 30 * p, 32 * p, 2 * p);
    
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(0, 0, 32 * p, p);
    ctx.fillRect(0, 0, p, 32 * p);
    
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(3 * p, 3 * p, 10 * p, 2 * p);
    ctx.fillRect(19 * p, 3 * p, 10 * p, 2 * p);
  };
}

function generateBathtubPixels() {
  return (ctx, size) => {
    const p = size / PIXEL_RESOLUTION;
    
    drawFeatheredShadow(ctx, 4 * p, 28 * p, 24 * p, 4 * p, p);
    
    ctx.fillStyle = adjustColor('#D0D0D0', -50);
    ctx.fillRect(2 * p, 32 * p, 28 * p, 3 * p);
    ctx.fillStyle = adjustColor('#D0D0D0', -60);
    ctx.fillRect(2 * p, 32 * p, 2 * p, 3 * p);
    
    ctx.fillStyle = '#D0D0D0';
    ctx.fillRect(4 * p, 8 * p, 24 * p, 18 * p);
    ctx.fillRect(2 * p, 10 * p, 28 * p, 14 * p);
    
    ctx.fillStyle = adjustColor('#D0D0D0', 20);
    ctx.fillRect(2 * p, 10 * p, 2 * p, 14 * p);
    ctx.fillRect(2 * p, 10 * p, 28 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#D0D0D0', -20);
    ctx.fillRect(28 * p, 10 * p, 2 * p, 14 * p);
    ctx.fillRect(2 * p, 22 * p, 28 * p, 2 * p);
    
    ctx.fillStyle = '#F8F8F8';
    ctx.fillRect(6 * p, 10 * p, 20 * p, 14 * p);
    ctx.fillRect(4 * p, 12 * p, 24 * p, 10 * p);
    
    ctx.fillStyle = adjustColor('#F8F8F8', 15);
    ctx.fillRect(4 * p, 12 * p, 2 * p, 10 * p);
    ctx.fillRect(4 * p, 12 * p, 24 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#F8F8F8', -15);
    ctx.fillRect(26 * p, 12 * p, 2 * p, 10 * p);
    ctx.fillRect(4 * p, 20 * p, 24 * p, 2 * p);
    
    const waterGradient = ctx.createLinearGradient(4 * p, 12 * p, 28 * p, 22 * p);
    waterGradient.addColorStop(0, '#6EB5FF');
    waterGradient.addColorStop(0.5, '#4A90D0');
    waterGradient.addColorStop(1, '#6EB5FF');
    ctx.fillStyle = waterGradient;
    ctx.fillRect(6 * p, 12 * p, 20 * p, 10 * p);
    
    ctx.fillStyle = adjustColor('#6EB5FF', 30);
    ctx.fillRect(6 * p, 12 * p, 2 * p, 10 * p);
    ctx.fillRect(6 * p, 12 * p, 20 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#6EB5FF', -20);
    ctx.fillRect(24 * p, 12 * p, 2 * p, 10 * p);
    ctx.fillRect(6 * p, 20 * p, 20 * p, 2 * p);
    
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(8 * p, 13 * p, 16 * p, 2 * p);
    
    ctx.fillStyle = 'rgba(160,216,255,0.5)';
    ctx.fillRect(10 * p, 16 * p, 12 * p, 2 * p);
    
    ctx.fillStyle = '#E8E8E8';
    ctx.fillRect(4 * p, 8 * p, 24 * p, 2 * p);
    ctx.fillRect(4 * p, 8 * p, 2 * p, 18 * p);
    ctx.fillRect(26 * p, 8 * p, 2 * p, 18 * p);
    
    ctx.fillStyle = adjustColor('#E8E8E8', 20);
    ctx.fillRect(4 * p, 8 * p, 2 * p, 2 * p);
    ctx.fillRect(4 * p, 8 * p, 24 * p, 2 * p);
    
    ctx.fillStyle = '#A0A0A0';
    ctx.fillRect(24 * p, 4 * p, 4 * p, 6 * p);
    drawMetallicShine(ctx, 24 * p, 4 * p, 4 * p, 6 * p, '#C0C0C0');
  };
}

function generateToiletPixels() {
  return (ctx, size) => {
    const p = size / PIXEL_RESOLUTION;
    
    drawFeatheredShadow(ctx, 6 * p, 30 * p, 20 * p, 4 * p, p);
    
    ctx.fillStyle = adjustColor('#D8D8D8', -50);
    ctx.fillRect(8 * p, 32 * p, 16 * p, 2 * p);
    ctx.fillStyle = adjustColor('#D8D8D8', -60);
    ctx.fillRect(8 * p, 32 * p, 2 * p, 2 * p);
    
    ctx.fillStyle = '#D8D8D8';
    ctx.fillRect(8 * p, 20 * p, 16 * p, 10 * p);
    
    ctx.fillStyle = adjustColor('#D8D8D8', 20);
    ctx.fillRect(8 * p, 20 * p, 2 * p, 10 * p);
    
    ctx.fillStyle = adjustColor('#D8D8D8', -20);
    ctx.fillRect(22 * p, 20 * p, 2 * p, 10 * p);
    
    ctx.fillStyle = '#E8E8E8';
    ctx.fillRect(6 * p, 12 * p, 20 * p, 12 * p);
    ctx.fillRect(4 * p, 14 * p, 24 * p, 8 * p);
    
    ctx.fillStyle = adjustColor('#E8E8E8', 20);
    ctx.fillRect(4 * p, 14 * p, 2 * p, 8 * p);
    ctx.fillRect(4 * p, 14 * p, 24 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#E8E8E8', -20);
    ctx.fillRect(26 * p, 14 * p, 2 * p, 8 * p);
    ctx.fillRect(4 * p, 20 * p, 24 * p, 2 * p);
    
    ctx.fillStyle = '#F5F5F5';
    ctx.fillRect(8 * p, 14 * p, 16 * p, 8 * p);
    ctx.fillRect(6 * p, 16 * p, 20 * p, 4 * p);
    
    ctx.fillStyle = adjustColor('#F5F5F5', 20);
    ctx.fillRect(6 * p, 16 * p, 2 * p, 4 * p);
    
    ctx.fillStyle = '#C8C8C8';
    ctx.fillRect(6 * p, 22 * p, 20 * p, 2 * p);
    
    ctx.fillStyle = '#E0E0E0';
    ctx.fillRect(8 * p, 0, 16 * p, 14 * p);
    
    ctx.fillStyle = adjustColor('#E0E0E0', 20);
    ctx.fillRect(8 * p, 0, 2 * p, 14 * p);
    ctx.fillRect(8 * p, 0, 16 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#E0E0E0', -20);
    ctx.fillRect(22 * p, 0, 2 * p, 14 * p);
    ctx.fillRect(8 * p, 12 * p, 16 * p, 2 * p);
    
    ctx.fillStyle = '#ECECEC';
    ctx.fillRect(10 * p, 2 * p, 12 * p, 10 * p);
    
    ctx.fillStyle = adjustColor('#ECECEC', 20);
    ctx.fillRect(10 * p, 2 * p, 2 * p, 10 * p);
    ctx.fillRect(10 * p, 2 * p, 12 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#ECECEC', -15);
    ctx.fillRect(20 * p, 2 * p, 2 * p, 10 * p);
    ctx.fillRect(10 * p, 10 * p, 12 * p, 2 * p);
    
    ctx.fillStyle = '#D0D0D0';
    ctx.fillRect(8 * p, 0, 16 * p, 3 * p);
    
    ctx.fillStyle = adjustColor('#D0D0D0', 20);
    ctx.fillRect(8 * p, 0, 2 * p, 3 * p);
    ctx.fillRect(8 * p, 0, 16 * p, p);
    
    ctx.fillStyle = adjustColor('#D0D0D0', -15);
    ctx.fillRect(22 * p, 0, 2 * p, 3 * p);
    
    ctx.fillStyle = '#A0A0A0';
    ctx.fillRect(14 * p, p, 4 * p, 2 * p);
    drawMetallicShine(ctx, 14 * p, p, 4 * p, 2 * p, '#C0C0C0');
  };
}

function generateSinkPixels() {
  return (ctx, size) => {
    const p = size / PIXEL_RESOLUTION;
    
    drawFeatheredShadow(ctx, 6 * p, 28 * p, 20 * p, 4 * p, p);
    
    ctx.fillStyle = adjustColor('#D8D8D8', -50);
    ctx.fillRect(4 * p, 32 * p, 24 * p, 2 * p);
    ctx.fillStyle = adjustColor('#D8D8D8', -60);
    ctx.fillRect(4 * p, 32 * p, 2 * p, 2 * p);
    
    ctx.fillStyle = '#D8D8D8';
    ctx.fillRect(4 * p, 8 * p, 24 * p, 16 * p);
    
    ctx.fillStyle = adjustColor('#D8D8D8', 20);
    ctx.fillRect(4 * p, 8 * p, 2 * p, 16 * p);
    ctx.fillRect(4 * p, 8 * p, 24 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#D8D8D8', -20);
    ctx.fillRect(26 * p, 8 * p, 2 * p, 16 * p);
    ctx.fillRect(4 * p, 22 * p, 24 * p, 2 * p);
    
    ctx.fillStyle = '#F0F0F0';
    ctx.fillRect(6 * p, 10 * p, 20 * p, 12 * p);
    
    ctx.fillStyle = adjustColor('#F0F0F0', 20);
    ctx.fillRect(6 * p, 10 * p, 2 * p, 12 * p);
    ctx.fillRect(6 * p, 10 * p, 20 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#F0F0F0', -15);
    ctx.fillRect(24 * p, 10 * p, 2 * p, 12 * p);
    ctx.fillRect(6 * p, 20 * p, 20 * p, 2 * p);
    
    ctx.fillStyle = '#E0E0E0';
    ctx.fillRect(8 * p, 12 * p, 16 * p, 8 * p);
    
    ctx.fillStyle = adjustColor('#E0E0E0', 15);
    ctx.fillRect(8 * p, 12 * p, 2 * p, 8 * p);
    
    ctx.fillStyle = adjustColor('#E0E0E0', -15);
    ctx.fillRect(22 * p, 12 * p, 2 * p, 8 * p);
    
    ctx.fillStyle = '#6EB5FF';
    ctx.fillRect(10 * p, 14 * p, 12 * p, 4 * p);
    
    ctx.fillStyle = adjustColor('#6EB5FF', 30);
    ctx.fillRect(10 * p, 14 * p, 2 * p, 4 * p);
    ctx.fillRect(10 * p, 14 * p, 12 * p, p);
    
    ctx.fillStyle = adjustColor('#6EB5FF', -20);
    ctx.fillRect(20 * p, 14 * p, 2 * p, 4 * p);
    ctx.fillRect(10 * p, 17 * p, 12 * p, p);
    
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(12 * p, 15 * p, 8 * p, 1 * p);
    
    ctx.fillStyle = '#A0A0A0';
    ctx.fillRect(14 * p, 2 * p, 4 * p, 8 * p);
    drawMetallicShine(ctx, 14 * p, 2 * p, 4 * p, 8 * p, '#C0C0C0');
    
    ctx.fillStyle = '#808080';
    ctx.fillRect(18 * p, 3 * p, 4 * p, 3 * p);
    
    ctx.fillStyle = adjustColor('#808080', 20);
    ctx.fillRect(18 * p, 3 * p, p, 3 * p);
    
    ctx.fillStyle = '#E8E8E8';
    ctx.fillRect(4 * p, 8 * p, 24 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#E8E8E8', 20);
    ctx.fillRect(4 * p, 8 * p, 2 * p, 2 * p);
  };
}

function generateStovePixels() {
  return (ctx, size) => {
    const p = size / PIXEL_RESOLUTION;
    
    drawFeatheredShadow(ctx, 2 * p, 30 * p, 28 * p, 4 * p, p);
    
    ctx.fillStyle = adjustColor('#2A2A2A', -50);
    ctx.fillRect(0, 32 * p, 32 * p, 3 * p);
    ctx.fillStyle = adjustColor('#2A2A2A', -60);
    ctx.fillRect(0, 32 * p, 2 * p, 3 * p);
    
    ctx.fillStyle = '#2A2A2A';
    ctx.fillRect(0, 0, 32 * p, 32 * p);
    
    ctx.fillStyle = adjustColor('#2A2A2A', 20);
    ctx.fillRect(0, 0, 2 * p, 32 * p);
    ctx.fillRect(0, 0, 32 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#2A2A2A', -20);
    ctx.fillRect(30 * p, 0, 2 * p, 32 * p);
    ctx.fillRect(0, 30 * p, 32 * p, 2 * p);
    
    ctx.fillStyle = '#404040';
    ctx.fillRect(2 * p, 2 * p, 28 * p, 28 * p);
    
    ctx.fillStyle = adjustColor('#404040', 15);
    ctx.fillRect(2 * p, 2 * p, 2 * p, 28 * p);
    
    ctx.fillStyle = adjustColor('#404040', -15);
    ctx.fillRect(28 * p, 2 * p, 2 * p, 28 * p);
    
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(4 * p, 4 * p, 24 * p, 16 * p);
    
    ctx.fillStyle = adjustColor('#1A1A1A', 15);
    ctx.fillRect(4 * p, 4 * p, 2 * p, 16 * p);
    ctx.fillRect(4 * p, 4 * p, 24 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#1A1A1A', -15);
    ctx.fillRect(26 * p, 4 * p, 2 * p, 16 * p);
    ctx.fillRect(4 * p, 18 * p, 24 * p, 2 * p);
    
    ctx.fillStyle = '#0D0D0D';
    ctx.fillRect(6 * p, 6 * p, 10 * p, 10 * p);
    
    ctx.fillStyle = adjustColor('#0D0D0D', 15);
    ctx.fillRect(6 * p, 6 * p, 2 * p, 10 * p);
    ctx.fillRect(6 * p, 6 * p, 10 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#0D0D0D', -15);
    ctx.fillRect(14 * p, 6 * p, 2 * p, 10 * p);
    ctx.fillRect(6 * p, 14 * p, 10 * p, 2 * p);
    
    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(8 * p, 8 * p, 6 * p, 6 * p);
    ctx.fillStyle = '#FF4444';
    ctx.fillRect(9 * p, 9 * p, 4 * p, 4 * p);
    ctx.fillStyle = '#FF8888';
    ctx.fillRect(10 * p, 10 * p, 2 * p, 2 * p);
    
    ctx.fillStyle = '#0D0D0D';
    ctx.fillRect(18 * p, 6 * p, 10 * p, 10 * p);
    
    ctx.fillStyle = adjustColor('#0D0D0D', 15);
    ctx.fillRect(18 * p, 6 * p, 2 * p, 10 * p);
    ctx.fillRect(18 * p, 6 * p, 10 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#0D0D0D', -15);
    ctx.fillRect(26 * p, 6 * p, 2 * p, 10 * p);
    ctx.fillRect(18 * p, 14 * p, 10 * p, 2 * p);
    
    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(20 * p, 8 * p, 6 * p, 6 * p);
    ctx.fillStyle = '#FF4444';
    ctx.fillRect(21 * p, 9 * p, 4 * p, 4 * p);
    ctx.fillStyle = '#FF8888';
    ctx.fillRect(22 * p, 10 * p, 2 * p, 2 * p);
    
    ctx.fillStyle = '#505050';
    ctx.fillRect(4 * p, 22 * p, 24 * p, 6 * p);
    
    ctx.fillStyle = adjustColor('#505050', 20);
    ctx.fillRect(4 * p, 22 * p, 2 * p, 6 * p);
    ctx.fillRect(4 * p, 22 * p, 24 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#505050', -15);
    ctx.fillRect(26 * p, 22 * p, 2 * p, 6 * p);
    ctx.fillRect(4 * p, 26 * p, 24 * p, 2 * p);
    
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = '#808080';
      ctx.fillRect((6 + i * 6) * p, 24 * p, 3 * p, 3 * p);
      ctx.fillStyle = '#A0A0A0';
      ctx.fillRect((6 + i * 6) * p, 24 * p, 3 * p, p);
      
      ctx.fillStyle = adjustColor('#808080', 20);
      ctx.fillRect((6 + i * 6) * p, 24 * p, p, 3 * p);
    }
  };
}

function generateKitchenCounterPixels() {
  return (ctx, size) => {
    const p = size / PIXEL_RESOLUTION;
    
    drawFeatheredShadow(ctx, 2 * p, 30 * p, 28 * p, 4 * p, p);
    
    ctx.fillStyle = adjustColor('#5D3A1A', -50);
    ctx.fillRect(0, 32 * p, 32 * p, 3 * p);
    ctx.fillStyle = adjustColor('#5D3A1A', -60);
    ctx.fillRect(0, 32 * p, 2 * p, 3 * p);
    
    drawWoodGrain(ctx, 0, 0, 32 * p, 32 * p, '#5D3A1A', p);
    
    ctx.fillStyle = adjustColor('#5D3A1A', 20);
    ctx.fillRect(0, 0, 2 * p, 32 * p);
    ctx.fillRect(0, 0, 32 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#5D3A1A', -20);
    ctx.fillRect(30 * p, 0, 2 * p, 32 * p);
    ctx.fillRect(0, 30 * p, 32 * p, 2 * p);
    
    ctx.fillStyle = '#8B5A2B';
    ctx.fillRect(2 * p, 2 * p, 28 * p, 28 * p);
    
    ctx.fillStyle = adjustColor('#8B5A2B', 15);
    ctx.fillRect(2 * p, 2 * p, 2 * p, 28 * p);
    
    ctx.fillStyle = adjustColor('#8B5A2B', -15);
    ctx.fillRect(28 * p, 2 * p, 2 * p, 28 * p);
    
    ctx.fillStyle = '#C9A66B';
    ctx.fillRect(4 * p, 4 * p, 24 * p, 12 * p);
    
    ctx.fillStyle = adjustColor('#C9A66B', 25);
    ctx.fillRect(4 * p, 4 * p, 2 * p, 12 * p);
    ctx.fillRect(4 * p, 4 * p, 24 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#C9A66B', -20);
    ctx.fillRect(26 * p, 4 * p, 2 * p, 12 * p);
    ctx.fillRect(4 * p, 14 * p, 24 * p, 2 * p);
    
    ctx.fillStyle = '#E8E8E8';
    ctx.fillRect(4 * p, 18 * p, 10 * p, 12 * p);
    
    ctx.fillStyle = adjustColor('#E8E8E8', 20);
    ctx.fillRect(4 * p, 18 * p, 2 * p, 12 * p);
    ctx.fillRect(4 * p, 18 * p, 10 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#E8E8E8', -15);
    ctx.fillRect(12 * p, 18 * p, 2 * p, 12 * p);
    ctx.fillRect(4 * p, 28 * p, 10 * p, 2 * p);
    
    ctx.fillStyle = '#F5F5F5';
    ctx.fillRect(6 * p, 20 * p, 6 * p, 8 * p);
    
    ctx.fillStyle = adjustColor('#F5F5F5', 20);
    ctx.fillRect(6 * p, 20 * p, 2 * p, 8 * p);
    ctx.fillRect(6 * p, 20 * p, 6 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#F5F5F5', -15);
    ctx.fillRect(10 * p, 20 * p, 2 * p, 8 * p);
    ctx.fillRect(6 * p, 26 * p, 6 * p, 2 * p);
    
    ctx.fillStyle = '#E8E8E8';
    ctx.fillRect(18 * p, 18 * p, 10 * p, 12 * p);
    
    ctx.fillStyle = adjustColor('#E8E8E8', 20);
    ctx.fillRect(18 * p, 18 * p, 2 * p, 12 * p);
    ctx.fillRect(18 * p, 18 * p, 10 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#E8E8E8', -15);
    ctx.fillRect(26 * p, 18 * p, 2 * p, 12 * p);
    ctx.fillRect(18 * p, 28 * p, 10 * p, 2 * p);
    
    ctx.fillStyle = '#F5F5F5';
    ctx.fillRect(20 * p, 20 * p, 6 * p, 8 * p);
    
    ctx.fillStyle = adjustColor('#F5F5F5', 20);
    ctx.fillRect(20 * p, 20 * p, 2 * p, 8 * p);
    ctx.fillRect(20 * p, 20 * p, 6 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#F5F5F5', -15);
    ctx.fillRect(24 * p, 20 * p, 2 * p, 8 * p);
    ctx.fillRect(20 * p, 26 * p, 6 * p, 2 * p);
    
    ctx.fillStyle = '#D0D0D0';
    ctx.fillRect(20 * p, 20 * p, 6 * p, 6 * p);
    
    ctx.fillStyle = adjustColor('#D0D0D0', 15);
    ctx.fillRect(20 * p, 20 * p, 2 * p, 6 * p);
    ctx.fillRect(20 * p, 20 * p, 6 * p, 2 * p);
    
    ctx.fillStyle = adjustColor('#D0D0D0', -15);
    ctx.fillRect(24 * p, 20 * p, 2 * p, 6 * p);
    ctx.fillRect(20 * p, 24 * p, 6 * p, 2 * p);
    
    ctx.fillStyle = '#6EB5FF';
    ctx.fillRect(22 * p, 22 * p, 2 * p, 2 * p);
    
    ctx.fillStyle = '#A0A0A0';
    ctx.fillRect(8 * p, 24 * p, 2 * p, 2 * p);
    drawMetallicShine(ctx, 8 * p, 24 * p, 2 * p, 2 * p, '#C0C0C0');
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

function drawNDSFurniture(ctx, x, y, w, h, baseColor, options = {}) {
  const { hasTop = true, hasDepth = true, depthHeight = 4, p = 1 } = options;
  
  ctx.fillStyle = baseColor;
  ctx.fillRect(x, y, w, h);
  
  if (hasTop) {
    ctx.fillStyle = adjustColor(baseColor, 30);
    ctx.fillRect(x, y, w, 2 * p);
    ctx.fillRect(x, y, 2 * p, h);
  }
  
  ctx.fillStyle = adjustColor(baseColor, -20);
  ctx.fillRect(x + w - 2 * p, y, 2 * p, h);
  
  ctx.fillStyle = adjustColor(baseColor, -30);
  ctx.fillRect(x, y + h - 2 * p, w, 2 * p);
  
  if (hasDepth) {
    ctx.fillStyle = adjustColor(baseColor, -50);
    ctx.fillRect(x, y + h, w, depthHeight * p);
    ctx.fillStyle = adjustColor(baseColor, -60);
    ctx.fillRect(x, y + h, 2 * p, depthHeight * p);
  }
}

function drawIrregularLines(ctx, x, y, w, count, color, p = 1) {
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    const lineY = y + i * 5 * p;
    const offsetX = (Math.floor(Math.random() * 3) - 1) * p;
    const lineWidth = w - Math.floor(Math.random() * 4) * p;
    ctx.fillRect(x + offsetX, lineY, lineWidth, p);
  }
}

function drawFeatheredShadow(ctx, x, y, w, h, p = 1) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
  ctx.fillRect(x, y, w, 2 * p);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
  ctx.fillRect(x + p, y + 2 * p, w - 2 * p, 2 * p);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
  ctx.fillRect(x + 2 * p, y + 4 * p, w - 4 * p, 2 * p);
}

function drawNDSWindow(ctx, x, y, size, p = 1) {
  const frameColor = '#5D4037';
  const glassColor = '#90CAF9';
  const glassHighlight = '#B3E5FC';
  const glassShadow = '#42A5F5';
  const reflectColor = '#E3F2FD';
  
  ctx.fillStyle = frameColor;
  ctx.fillRect(x, y, size, size);
  
  ctx.fillStyle = glassColor;
  ctx.fillRect(x + p, y + p, size - 2 * p, size - 2 * p);
  
  ctx.fillStyle = glassHighlight;
  ctx.fillRect(x + p, y + p, (size - 2 * p) / 2, (size - 2 * p) / 2);
  
  ctx.fillStyle = glassShadow;
  ctx.fillRect(x + size / 2, y + p, p, size - 2 * p);
  ctx.fillRect(x + p, y + size / 2, size - 2 * p, p);
  
  ctx.fillStyle = reflectColor;
  ctx.fillRect(x + 2 * p, y + 2 * p, 2 * p, 2 * p);
  
  ctx.fillStyle = '#8D6E63';
  ctx.fillRect(x, y + size, size, 2 * p);
}

function drawNDSDoor(ctx, x, y, w, h, p = 1) {
  const frameColor = '#3E2723';
  const doorColor = '#6D4C41';
  const handleColor = '#FDD835';
  const stepColor = '#BDBDBD';
  
  ctx.fillStyle = frameColor;
  ctx.fillRect(x, y, w, h);
  
  ctx.fillStyle = doorColor;
  ctx.fillRect(x + p, y + p, w - 2 * p, h - 2 * p);
  
  ctx.fillStyle = adjustColor(doorColor, 15);
  ctx.fillRect(x + p, y + p, 3 * p, h - 4 * p);
  
  ctx.fillStyle = adjustColor(doorColor, -15);
  ctx.fillRect(x + w - 4 * p, y + p, 3 * p, h - 4 * p);
  
  ctx.fillStyle = adjustColor(doorColor, -10);
  ctx.fillRect(x + 3 * p, y + 3 * p, 3 * p, 5 * p);
  ctx.fillRect(x + w - 6 * p, y + 3 * p, 3 * p, 5 * p);
  
  ctx.fillStyle = handleColor;
  ctx.fillRect(x + w - 3 * p, y + h / 2, 2 * p, 2 * p);
  
  ctx.fillStyle = stepColor;
  ctx.fillRect(x - p, y + h, w + 2 * p, 2 * p);
}

// ============================================
// 進階像素渲染工具函數 - 提升畫面精緻度
// ============================================

const PIXEL_RESOLUTION = 32; // 提升像素解析度從 16 到 32

/**
 * 繪製帶有立體陰影的矩形
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} x - X 座標（像素單位）
 * @param {number} y - Y 座標（像素單位）
 * @param {number} w - 寬度
 * @param {number} h - 高度
 * @param {string} color - 基礎顏色
 * @param {number} shadowDepth - 陰影深度（0-3）
 */
function drawPixelRectWithShadow(ctx, x, y, w, h, color, shadowDepth = 2) {
  // 主體
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  
  // 左上高光（光源來自左上角）
  ctx.fillStyle = adjustColor(color, 30);
  ctx.fillRect(x, y, w, 1);
  ctx.fillRect(x, y, 1, h);
  
  // 右下陰影
  ctx.fillStyle = adjustColor(color, -30);
  ctx.fillRect(x, y + h - 1, w, 1);
  ctx.fillRect(x + w - 1, y, 1, h);
  
  // 額外深層陰影
  if (shadowDepth >= 2) {
    ctx.fillStyle = adjustColor(color, -50);
    ctx.fillRect(x + w - 2, y + 2, 1, h - 2);
    ctx.fillRect(x + 2, y + h - 2, w - 2, 1);
  }
}

/**
 * 繪製木紋紋理
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} x 
 * @param {number} y 
 * @param {number} w 
 * @param {number} h 
 * @param {string} baseColor - 木頭基礎色
 * @param {number} p - 像素單位大小
 */
function drawWoodGrain(ctx, x, y, w, h, baseColor, p) {
  // 基底
  ctx.fillStyle = baseColor;
  ctx.fillRect(x, y, w, h);
  
  // 木紋線條
  const grainColor1 = adjustColor(baseColor, -15);
  const grainColor2 = adjustColor(baseColor, 15);
  
  for (let i = 0; i < h; i += 2) {
    const offset = Math.sin((y + i) * 0.3) * 1.5;
    ctx.fillStyle = i % 4 === 0 ? grainColor1 : grainColor2;
    ctx.fillRect(x + offset, y + i, w, 1);
  }
  
  // 木紋節點
  if (w > 4 * p && h > 4 * p) {
    const knotX = x + w * 0.3;
    const knotY = y + h * 0.4;
    ctx.fillStyle = adjustColor(baseColor, -40);
    ctx.beginPath();
    ctx.ellipse(knotX, knotY, p, p * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * 繪製布料皺褶紋理
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} x 
 * @param {number} y 
 * @param {number} w 
 * @param {number} h 
 * @param {string} color - 布料顏色
 * @param {number} p - 像素單位大小
 */
function drawFabricTexture(ctx, x, y, w, h, color, p) {
  // 基底
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  
  // 皺褶陰影
  const shadowColor = adjustColor(color, -25);
  const highlightColor = adjustColor(color, 20);
  
  // 水平皺褶
  for (let i = 0; i < 4; i++) {
    const foldY = y + (h * (0.2 + i * 0.2));
    ctx.fillStyle = shadowColor;
    ctx.fillRect(x + p, foldY, w - 2 * p, 1);
    ctx.fillStyle = highlightColor;
    ctx.fillRect(x + p, foldY + 1, w - 2 * p, 1);
  }
  
  // 垂直皺褶
  for (let i = 0; i < 3; i++) {
    const foldX = x + (w * (0.25 + i * 0.25));
    ctx.fillStyle = `rgba(0,0,0,0.1)`;
    ctx.fillRect(foldX, y + p, 1, h - 2 * p);
  }
}

/**
 * 繪製金屬光澤
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} x 
 * @param {number} y 
 * @param {number} w 
 * @param {number} h 
 * @param {string} baseColor - 金屬基礎色
 */
function drawMetallicShine(ctx, x, y, w, h, baseColor) {
  // 漸層基底
  const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
  gradient.addColorStop(0, adjustColor(baseColor, 40));
  gradient.addColorStop(0.3, adjustColor(baseColor, 60));
  gradient.addColorStop(0.5, adjustColor(baseColor, 20));
  gradient.addColorStop(0.7, adjustColor(baseColor, -10));
  gradient.addColorStop(1, adjustColor(baseColor, -30));
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, w, h);
  
  // 高光條紋
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillRect(x + w * 0.2, y + 1, w * 0.1, h - 2);
}

/**
 * 繪製玻璃/鏡面效果
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} x 
 * @param {number} y 
 * @param {number} w 
 * @param {number} h 
 * @param {string} tintColor - 玻璃色調
 */
function drawGlassEffect(ctx, x, y, w, h, tintColor) {
  // 玻璃基底
  ctx.fillStyle = tintColor;
  ctx.fillRect(x, y, w, h);
  
  // 反射高光
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(x + 2, y + 2, w * 0.3, h * 0.4);
  
  // 邊緣陰影
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(x + w - 2, y, 2, h);
  ctx.fillRect(x, y + h - 2, w, 2);
}

/**
 * 繪製螢幕發光效果
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} x 
 * @param {number} y 
 * @param {number} w 
 * @param {number} h 
 * @param {string} screenColor - 螢幕顏色
 * @param {number} p - 像素單位大小
 */
function drawScreenGlow(ctx, x, y, w, h, screenColor, p) {
  // 螢幕基底
  ctx.fillStyle = screenColor;
  ctx.fillRect(x, y, w, h);
  
  // 內部發光
  const gradient = ctx.createRadialGradient(
    x + w/2, y + h/2, 0,
    x + w/2, y + h/2, Math.max(w, h) * 0.7
  );
  gradient.addColorStop(0, adjustColor(screenColor, 40));
  gradient.addColorStop(0.5, screenColor);
  gradient.addColorStop(1, adjustColor(screenColor, -20));
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, w, h);
  
  // 掃描線效果
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  for (let i = 0; i < h; i += 2) {
    ctx.fillRect(x, y + i, w, 1);
  }
  
  // 邊框高光
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(x, y, w, 1);
  ctx.fillRect(x, y, 1, h);
}

/**
 * 繪製植物葉片紋理
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} x 
 * @param {number} y 
 * @param {number} w 
 * @param {number} h 
 * @param {string} leafColor - 葉片顏色
 * @param {number} p - 像素單位大小
 */
function drawLeafTexture(ctx, x, y, w, h, leafColor, p) {
  // 葉片基底
  ctx.fillStyle = leafColor;
  ctx.fillRect(x, y, w, h);
  
  // 葉脈
  const veinColor = adjustColor(leafColor, -20);
  ctx.fillStyle = veinColor;
  // 主葉脈
  ctx.fillRect(x + w/2 - 0.5, y, 1, h);
  // 側葉脈
  for (let i = 1; i < 4; i++) {
    const veinY = y + h * (i / 4);
    ctx.fillRect(x + w * 0.3, veinY, w * 0.2, 1);
    ctx.fillRect(x + w * 0.5, veinY, w * 0.2, 1);
  }
  
  // 光澤
  ctx.fillStyle = adjustColor(leafColor, 25);
  ctx.fillRect(x + 1, y + 1, w * 0.3, h * 0.2);
}

/**
 * 繪製枕頭
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} x 
 * @param {number} y 
 * @param {number} w 
 * @param {number} h 
 * @param {string} color - 枕頭顏色
 * @param {number} p - 像素單位大小
 */
function drawPillow(ctx, x, y, w, h, color, p) {
  // 枕頭主體（帶圓角效果）
  ctx.fillStyle = color;
  ctx.fillRect(x + p, y, w - 2*p, h);
  ctx.fillRect(x, y + p, w, h - 2*p);
  
  // 枕頭陰影
  ctx.fillStyle = adjustColor(color, -20);
  ctx.fillRect(x + w - 2*p, y + p, p, h - 2*p);
  ctx.fillRect(x + p, y + h - 2*p, w - 2*p, p);
  
  // 枕頭高光
  ctx.fillStyle = adjustColor(color, 30);
  ctx.fillRect(x + p, y + p, w - 3*p, p);
  ctx.fillRect(x + p, y + p, p, h - 3*p);
  
  // 皺褶細節
  ctx.fillStyle = adjustColor(color, -15);
  ctx.fillRect(x + w * 0.3, y + h * 0.4, w * 0.4, p * 0.5);
}

/**
 * 繪製地毯紋理
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} x 
 * @param {number} y 
 * @param {number} w 
 * @param {number} h 
 * @param {string} color - 地毯顏色
 * @param {number} p - 像素單位大小
 */
function drawCarpetTexture(ctx, x, y, w, h, color, p) {
  // 地毯基底
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  
  // 邊框
  ctx.fillStyle = adjustColor(color, -30);
  ctx.fillRect(x, y, w, p);
  ctx.fillRect(x, y + h - p, w, p);
  ctx.fillRect(x, y, p, h);
  ctx.fillRect(x + w - p, y, p, h);
  
  // 內框裝飾
  ctx.fillStyle = adjustColor(color, 20);
  ctx.fillRect(x + 2*p, y + 2*p, w - 4*p, p);
  ctx.fillRect(x + 2*p, y + h - 3*p, w - 4*p, p);
  
  // 圖案
  const patternColor = adjustColor(color, 40);
  ctx.fillStyle = patternColor;
  // 中心圖案
  ctx.fillRect(x + w/2 - p, y + h/2 - p, 2*p, 2*p);
  // 角落圖案
  ctx.fillRect(x + 3*p, y + 3*p, p, p);
  ctx.fillRect(x + w - 4*p, y + 3*p, p, p);
  ctx.fillRect(x + 3*p, y + h - 4*p, p, p);
  ctx.fillRect(x + w - 4*p, y + h - 4*p, p, p);
}

/**
 * 繪製稀有度光暈效果
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} x 
 * @param {number} y 
 * @param {number} w 
 * @param {number} h 
 * @param {string} rarity - 稀有度 (common/rare/epic/legendary)
 * @param {number} p - 像素單位大小
 */
function drawRarityGlow(ctx, x, y, w, h, rarity, p) {
  const glowColors = {
    common: null,
    rare: 'rgba(33, 150, 243, 0.3)',
    epic: 'rgba(156, 39, 176, 0.4)',
    legendary: 'rgba(255, 152, 0, 0.5)'
  };
  
  const glowColor = glowColors[rarity];
  if (!glowColor) return;
  
  // 外層光暈
  ctx.fillStyle = glowColor;
  ctx.fillRect(x - p, y - p, w + 2*p, p);
  ctx.fillRect(x - p, y + h, w + 2*p, p);
  ctx.fillRect(x - p, y, p, h);
  ctx.fillRect(x + w, y, p, h);
  
  // 角落強光
  if (rarity === 'legendary') {
    ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
    ctx.fillRect(x - p, y - p, p, p);
    ctx.fillRect(x + w, y - p, p, p);
    ctx.fillRect(x - p, y + h, p, p);
    ctx.fillRect(x + w, y + h, p, p);
  }
}

function generateShopFurniturePixels(id, ctx, size) {
  const s = size / PIXEL_RESOLUTION;
  ctx.imageSmoothingEnabled = false;
  
  switch(id) {
    case 'wall_painting_1':
      // 畫框陰影
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(2 * s, 2 * s, 28 * s, 28 * s);
      // 畫框
      drawWoodGrain(ctx, 0, 0, 32 * s, 32 * s, '#5D3A1A', s);
      ctx.fillStyle = '#8B5A2B';
      ctx.fillRect(2 * s, 2 * s, 28 * s, 28 * s);
      // 畫布
      ctx.fillStyle = '#E74C3C';
      ctx.fillRect(4 * s, 4 * s, 24 * s, 24 * s);
      // 畫作內容
      ctx.fillStyle = '#3498DB';
      ctx.fillRect(8 * s, 8 * s, 16 * s, 8 * s);
      ctx.fillStyle = '#F1C40F';
      ctx.fillRect(8 * s, 18 * s, 8 * s, 8 * s);
      // 高光
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(4 * s, 4 * s, 24 * s, 2 * s);
      break;
      
    case 'wall_painting_2':
      // 風景畫
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(2 * s, 2 * s, 28 * s, 28 * s);
      drawWoodGrain(ctx, 0, 0, 32 * s, 32 * s, '#4A3728', s);
      // 天空
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 14 * s);
      skyGrad.addColorStop(0, '#87CEEB');
      skyGrad.addColorStop(1, '#B0E0E6');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(2 * s, 2 * s, 28 * s, 12 * s);
      // 草地
      ctx.fillStyle = '#228B22';
      ctx.fillRect(2 * s, 14 * s, 14 * s, 16 * s);
      // 樹
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(14 * s, 10 * s, 4 * s, 20 * s);
      ctx.fillStyle = '#2E8B2E';
      ctx.fillRect(10 * s, 4 * s, 12 * s, 10 * s);
      // 雲
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillRect(6 * s, 4 * s, 8 * s, 4 * s);
      ctx.fillRect(20 * s, 6 * s, 6 * s, 3 * s);
      break;
      
    case 'wall_photo_frame':
      // 照片牆
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(2 * s, 2 * s, 28 * s, 28 * s);
      drawWoodGrain(ctx, 0, 0, 32 * s, 32 * s, '#5D3A1A', s);
      // 四張照片
      const photoPositions = [[4, 4], [18, 4], [4, 18], [18, 18]];
      photoPositions.forEach((pos, i) => {
        ctx.fillStyle = '#FFF';
        ctx.fillRect(pos[0] * s, pos[1] * s, 10 * s, 10 * s);
        ctx.fillStyle = i === 0 ? '#FDE8C8' : ['#FFB6C1', '#B0E0E6', '#98FB98'][i-1];
        ctx.fillRect((pos[0] + 2) * s, (pos[1] + 2) * s, 6 * s, 6 * s);
      });
      break;
      
    case 'wall_mirror_decor':
      // 裝飾鏡
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(2 * s, 2 * s, 28 * s, 28 * s);
      // 金色邊框
      drawMetallicShine(ctx, 0, 0, 32 * s, 32 * s, '#DAA520');
      // 鏡面
      drawGlassEffect(ctx, 4 * s, 4 * s, 24 * s, 24 * s, '#C0C0C0');
      // 反射高光
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(6 * s, 6 * s, 8 * s, 12 * s);
      break;
      
    case 'wall_tapestry':
      // 掛毯
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(0, 0, 4 * s, 32 * s);
      ctx.fillRect(28 * s, 0, 4 * s, 32 * s);
      // 織布
      drawFabricTexture(ctx, 4 * s, 0, 24 * s, 32 * s, '#FF6347', s);
      // 金色條紋
      ctx.fillStyle = '#FFD700';
      for (let i = 0; i < 6; i++) {
        ctx.fillRect(6 * s, (2 + i * 5) * s, 20 * s, 2 * s);
      }
      break;
      
    case 'wall_clock':
      // 掛鐘
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(2 * s, 2 * s, 28 * s, 28 * s);
      // 木框
      drawWoodGrain(ctx, 2 * s, 2 * s, 28 * s, 28 * s, '#5D3A1A', s);
      // 鐘面
      ctx.fillStyle = '#FFF';
      ctx.fillRect(6 * s, 6 * s, 20 * s, 20 * s);
      // 刻度
      ctx.fillStyle = '#333';
      for (let i = 0; i < 12; i++) {
        const angle = (i * 30 - 90) * Math.PI / 180;
        const x1 = 16 * s + Math.cos(angle) * 8 * s;
        const y1 = 16 * s + Math.sin(angle) * 8 * s;
        ctx.fillRect(x1, y1, 2 * s, 2 * s);
      }
      // 指針
      ctx.fillStyle = '#333';
      ctx.fillRect(15 * s, 6 * s, 2 * s, 10 * s); // 時針
      ctx.fillRect(15 * s, 16 * s, 6 * s, 2 * s); // 分針
      // 中心點
      ctx.fillStyle = '#C0C0C0';
      ctx.fillRect(15 * s, 15 * s, 2 * s, 2 * s);
      break;
      
    case 'wall_shelf':
      // 牆架
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(2 * s, 8 * s, 28 * s, 4 * s);
      // 架板
      drawWoodGrain(ctx, 0, 8 * s, 32 * s, 6 * s, '#8B4513', s);
      // 支架
      ctx.fillStyle = '#654321';
      ctx.fillRect(2 * s, 14 * s, 4 * s, 12 * s);
      ctx.fillRect(26 * s, 14 * s, 4 * s, 12 * s);
      // 架上物品
      ctx.fillStyle = '#3498DB';
      ctx.fillRect(8 * s, 2 * s, 6 * s, 6 * s);
      ctx.fillStyle = '#E74C3C';
      ctx.fillRect(18 * s, 2 * s, 6 * s, 6 * s);
      break;
      
    case 'curtain_basic':
      // 基礎窗簾
      ctx.fillStyle = '#D2691E';
      ctx.fillRect(0, 0, 6 * s, 32 * s);
      ctx.fillRect(26 * s, 0, 6 * s, 32 * s);
      // 窗簾布
      drawFabricTexture(ctx, 6 * s, 0, 10 * s, 32 * s, '#F5DEB3', s);
      drawFabricTexture(ctx, 16 * s, 0, 10 * s, 32 * s, '#F5DEB3', s);
      // 皺褶
      ctx.fillStyle = '#DEB887';
      ctx.fillRect(6 * s, 4 * s, 10 * s, 2 * s);
      ctx.fillRect(16 * s, 12 * s, 10 * s, 2 * s);
      break;
      
    case 'curtain_lace':
      // 蕾絲窗簾
      ctx.fillStyle = '#FFB6C1';
      ctx.fillRect(0, 0, 6 * s, 32 * s);
      ctx.fillRect(26 * s, 0, 6 * s, 32 * s);
      // 蕾絲
      ctx.fillStyle = '#FFF0F5';
      ctx.fillRect(6 * s, 0, 20 * s, 32 * s);
      // 蕾絲花紋
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      for (let i = 0; i < 8; i++) {
        ctx.fillRect(10 * s, (2 + i * 4) * s, 4 * s, 3 * s);
        ctx.fillRect(18 * s, (4 + i * 4) * s, 4 * s, 3 * s);
      }
      break;
      
    case 'curtain_blackout':
      // 遮光窗簾
      ctx.fillStyle = '#1A1A2E';
      ctx.fillRect(0, 0, 32 * s, 32 * s);
      ctx.fillStyle = '#16213E';
      ctx.fillRect(6 * s, 0, 20 * s, 32 * s);
      // 皺褶
      ctx.fillStyle = '#0D0D1A';
      ctx.fillRect(10 * s, 4 * s, 12 * s, 4 * s);
      ctx.fillRect(10 * s, 16 * s, 12 * s, 4 * s);
      break;
      
    case 'curtain_pattern':
      // 圖案窗簾
      ctx.fillStyle = '#4A4A6A';
      ctx.fillRect(0, 0, 32 * s, 32 * s);
      // 圖案
      ctx.fillStyle = '#E94560';
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          ctx.fillRect((4 + i * 6) * s, (j * 8) * s, 4 * s, 4 * s);
        }
      }
      break;
      
    case 'blind_wooden':
      // 木百葉窗
      for (let i = 0; i < 8; i++) {
        drawWoodGrain(ctx, 0, i * 4 * s, 32 * s, 3 * s, '#8B4513', s);
      }
      // 拉繩
      ctx.fillStyle = '#D2691E';
      ctx.fillRect(14 * s, 0, 4 * s, 32 * s);
      break;
      
    case 'blind_roman':
      // 羅馬簾
      ctx.fillStyle = '#F5F5DC';
      ctx.fillRect(0, 0, 32 * s, 32 * s);
      ctx.fillStyle = '#DEB887';
      for (let i = 0; i < 6; i++) {
        ctx.fillRect(0, (i * 5 + 4) * s, 32 * s, 2 * s);
      }
      break;
      
    case 'ceiling_light':
      // 吸頂燈
      ctx.fillStyle = '#A0A0A0';
      ctx.fillRect(0, 0, 32 * s, 8 * s);
      // 燈罩
      const lightGrad = ctx.createRadialGradient(16 * s, 16 * s, 0, 16 * s, 16 * s, 14 * s);
      lightGrad.addColorStop(0, '#FFF8DC');
      lightGrad.addColorStop(0.5, '#FFD700');
      lightGrad.addColorStop(1, '#FFA500');
      ctx.fillStyle = lightGrad;
      ctx.fillRect(4 * s, 8 * s, 24 * s, 20 * s);
      // 光暈
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(8 * s, 12 * s, 16 * s, 12 * s);
      break;
      
    case 'chandelier':
    case 'chandelier_crystal':
      // 水晶吊燈
      ctx.fillStyle = '#C0C0C0';
      ctx.fillRect(14 * s, 0, 4 * s, 8 * s);
      // 吊鏈
      ctx.fillStyle = '#A0A0A0';
      ctx.fillRect(15 * s, 8 * s, 2 * s, 4 * s);
      // 水晶燈罩
      for (let i = 0; i < 4; i++) {
        const crystalGrad = ctx.createLinearGradient((4 + i * 6) * s, 12 * s, (8 + i * 6) * s, 24 * s);
        crystalGrad.addColorStop(0, '#FFD700');
        crystalGrad.addColorStop(0.5, '#FFF8DC');
        crystalGrad.addColorStop(1, '#FFD700');
        ctx.fillStyle = crystalGrad;
        ctx.fillRect((4 + i * 6) * s, 12 * s, 4 * s, 12 * s);
      }
      // 光點
      ctx.fillStyle = '#FFF';
      for (let i = 0; i < 4; i++) {
        ctx.fillRect((6 + i * 6) * s, 18 * s, 2 * s, 4 * s);
      }
      break;
      
    case 'floor_lamp':
      // 落地燈
      ctx.fillStyle = '#505050';
      ctx.fillRect(12 * s, 20 * s, 8 * s, 12 * s);
      // 燈桿
      drawMetallicShine(ctx, 14 * s, 4 * s, 4 * s, 16 * s, '#707070');
      // 燈罩
      const lampGrad = ctx.createLinearGradient(8 * s, 0, 24 * s, 16 * s);
      lampGrad.addColorStop(0, '#FFD700');
      lampGrad.addColorStop(0.5, '#FFF8DC');
      lampGrad.addColorStop(1, '#FFD700');
      ctx.fillStyle = lampGrad;
      ctx.fillRect(8 * s, 0, 16 * s, 16 * s);
      ctx.fillRect(10 * s, 0, 12 * s, 20 * s);
      // 光暈
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(12 * s, 4 * s, 8 * s, 12 * s);
      break;
      
    case 'wall_sconce':
      // 壁燈
      ctx.fillStyle = '#704820';
      ctx.fillRect(8 * s, 4 * s, 16 * s, 4 * s);
      // 燈罩
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(8 * s, 8 * s, 16 * s, 16 * s);
      ctx.fillStyle = '#FFF';
      ctx.fillRect(12 * s, 12 * s, 8 * s, 8 * s);
      break;
      
    case 'string_lights':
      // 彩燈串
      ctx.fillStyle = '#505050';
      ctx.fillRect(0, 4 * s, 32 * s, 2 * s);
      const lightColors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'];
      for (let i = 0; i < 5; i++) {
        // 燈泡光暈
        ctx.fillStyle = lightColors[i] + '40';
        ctx.fillRect((2 + i * 6) * s, 6 * s, 6 * s, 6 * s);
        // 燈泡
        ctx.fillStyle = lightColors[i];
        ctx.fillRect((2 + i * 6) * s, 6 * s, 6 * s, 6 * s);
        // 高光
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect((3 + i * 6) * s, 7 * s, 2 * s, 2 * s);
      }
      break;
      
    case 'desk_lamp_luxury':
      // 豪華檯燈
      drawMetallicShine(ctx, 10 * s, 24 * s, 12 * s, 8 * s, '#A0A0A0');
      // 燈臂
      ctx.fillStyle = '#505050';
      ctx.fillRect(14 * s, 8 * s, 4 * s, 16 * s);
      // 燈罩
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(8 * s, 0, 16 * s, 10 * s);
      ctx.fillStyle = '#FFF8DC';
      ctx.fillRect(12 * s, 4 * s, 8 * s, 4 * s);
      break;
      
    case 'neon_sign':
    case 'neon_sign_custom':
      // 霓虹燈牌
      ctx.fillStyle = '#1A1A1A';
      ctx.fillRect(2 * s, 2 * s, 28 * s, 28 * s);
      // 霓虹光暈
      ctx.fillStyle = 'rgba(255,0,255,0.3)';
      ctx.fillRect(4 * s, 4 * s, 24 * s, 24 * s);
      // 霓虹燈管
      ctx.fillStyle = '#FF00FF';
      ctx.fillRect(6 * s, 6 * s, 20 * s, 20 * s);
      ctx.fillStyle = '#00FFFF';
      ctx.fillRect(10 * s, 10 * s, 12 * s, 12 * s);
      break;
      
    case 'throw_pillow_1':
      // 抱枕
      drawFabricTexture(ctx, 4 * s, 8 * s, 24 * s, 20 * s, '#FF6B6B', s);
      ctx.fillStyle = '#FFB6C1';
      ctx.fillRect(8 * s, 12 * s, 16 * s, 12 * s);
      // 高光
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(6 * s, 10 * s, 8 * s, 4 * s);
      break;
      
    case 'throw_blanket':
      // 毛毯
      drawFabricTexture(ctx, 0, 8 * s, 32 * s, 16 * s, '#6B8E23', s);
      ctx.fillStyle = '#556B2F';
      ctx.fillRect(4 * s, 12 * s, 24 * s, 8 * s);
      break;
      
    case 'area_rug_round':
      // 圓形地毯
      ctx.fillStyle = '#DC143C';
      ctx.fillRect(2 * s, 2 * s, 28 * s, 28 * s);
      ctx.fillRect(0, 6 * s, 32 * s, 20 * s);
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(8 * s, 8 * s, 16 * s, 16 * s);
      break;
      
    case 'area_rug_fuzzy':
      // 毛絨地毯
      ctx.fillStyle = '#F5DEB3';
      ctx.fillRect(0, 4 * s, 32 * s, 24 * s);
      ctx.fillStyle = '#DEB887';
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 4; j++) {
          ctx.fillRect((i * 4) * s, (6 + j * 5) * s, 2 * s, 4 * s);
        }
      }
      break;
      
    case 'bed_runner':
      // 床尾巾
      ctx.fillStyle = '#8B0000';
      ctx.fillRect(0, 12 * s, 32 * s, 12 * s);
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(4 * s, 14 * s, 24 * s, 8 * s);
      break;
      
    case 'cushion_set':
      // 靠墊組
      drawPillow(ctx, 2 * s, 10 * s, 14 * s, 12 * s, '#9370DB', s);
      drawPillow(ctx, 16 * s, 10 * s, 14 * s, 12 * s, '#8A2BE2', s);
      break;
      
    case 'curtain_valance':
      // 窗簾頭
      ctx.fillStyle = '#D2691E';
      ctx.fillRect(0, 0, 32 * s, 12 * s);
      ctx.fillStyle = '#F5DEB3';
      for (let i = 0; i < 4; i++) {
        ctx.fillRect((2 + i * 7) * s, 12 * s, 6 * s, 8 * s);
      }
      break;
      
    case 'floor_vase_large':
      // 大型落地花瓶
      ctx.fillStyle = '#704820';
      ctx.fillRect(8 * s, 8 * s, 16 * s, 24 * s);
      ctx.fillRect(12 * s, 4 * s, 8 * s, 4 * s);
      ctx.fillStyle = '#A07840';
      ctx.fillRect(10 * s, 10 * s, 12 * s, 20 * s);
      // 植物
      ctx.fillStyle = '#228B22';
      ctx.fillRect(6 * s, 0, 20 * s, 8 * s);
      ctx.fillStyle = '#32CD32';
      ctx.fillRect(10 * s, 2 * s, 6 * s, 4 * s);
      ctx.fillRect(16 * s, 0, 6 * s, 4 * s);
      break;
      
    case 'floor_candle_set':
      // 蠟燭組
      ctx.fillStyle = '#FFF8DC';
      ctx.fillRect(8 * s, 12 * s, 6 * s, 20 * s);
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.ellipse(11 * s, 10 * s, 3 * s, 4 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFF8DC';
      ctx.fillRect(18 * s, 16 * s, 6 * s, 16 * s);
      ctx.fillStyle = '#FF6347';
      ctx.beginPath();
      ctx.ellipse(21 * s, 14 * s, 3 * s, 4 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'floor_books_stack':
      // 書堆
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(6 * s, 16 * s, 20 * s, 16 * s);
      ctx.fillStyle = '#E74C3C';
      ctx.fillRect(8 * s, 12 * s, 16 * s, 4 * s);
      ctx.fillStyle = '#3498DB';
      ctx.fillRect(6 * s, 8 * s, 20 * s, 4 * s);
      ctx.fillStyle = '#2ECC71';
      ctx.fillRect(10 * s, 4 * s, 12 * s, 4 * s);
      break;
      
    case 'floor_plant_tall':
      // 高盆栽
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(10 * s, 24 * s, 12 * s, 8 * s);
      ctx.fillStyle = '#228B22';
      ctx.fillRect(14 * s, 4 * s, 4 * s, 20 * s);
      ctx.beginPath();
      ctx.arc(12 * s, 8 * s, 6 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(20 * s, 12 * s, 6 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(16 * s, 4 * s, 4 * s, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'floor_statue':
      // 雕像
      drawMetallicShine(ctx, 12 * s, 16 * s, 8 * s, 16 * s, '#C0C0C0');
      ctx.beginPath();
      ctx.arc(16 * s, 10 * s, 6 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#808080';
      ctx.fillRect(8 * s, 28 * s, 16 * s, 4 * s);
      break;
      
    case 'floor_basket':
      // 籃子
      ctx.fillStyle = '#D2691E';
      ctx.fillRect(6 * s, 8 * s, 20 * s, 24 * s);
      ctx.fillStyle = '#8B4513';
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(6 * s, (8 + i * 6) * s, 20 * s, 2 * s);
      }
      ctx.fillStyle = '#D2691E';
      ctx.beginPath();
      ctx.ellipse(16 * s, 8 * s, 10 * s, 4 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'floor_mat_welcome':
      // 歡迎地墊
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(0, 8 * s, 32 * s, 16 * s);
      ctx.fillStyle = '#DEB887';
      ctx.fillRect(4 * s, 12 * s, 24 * s, 8 * s);
      ctx.fillStyle = '#333';
      ctx.font = `${4 * s}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('WELCOME', 16 * s, 18 * s);
      break;
      
    case 'wall_art_golden':
      // 金色藝術品
      drawMetallicShine(ctx, 0, 0, 32 * s, 32 * s, '#FFD700');
      ctx.fillStyle = '#FFA500';
      ctx.fillRect(4 * s, 4 * s, 24 * s, 24 * s);
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(16 * s, 16 * s, 8 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.arc(16 * s, 16 * s, 4 * s, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'curtain_silk':
      // 絲綢窗簾
      ctx.fillStyle = '#9370DB';
      ctx.fillRect(0, 0, 32 * s, 32 * s);
      ctx.fillStyle = '#BA55D3';
      ctx.fillRect(6 * s, 0, 20 * s, 32 * s);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      for (let i = 0; i < 8; i++) {
        ctx.fillRect((4 + i * 3) * s, 0, 2 * s, 32 * s);
      }
      break;
      
    case 'floor_fountain':
      // 噴泉
      ctx.fillStyle = '#4169E1';
      ctx.beginPath();
      ctx.ellipse(16 * s, 20 * s, 14 * s, 8 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#87CEEB';
      ctx.beginPath();
      ctx.ellipse(16 * s, 20 * s, 10 * s, 6 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4169E1';
      ctx.fillRect(14 * s, 8 * s, 4 * s, 12 * s);
      ctx.fillStyle = '#ADD8E6';
      ctx.beginPath();
      ctx.arc(16 * s, 6 * s, 4 * s, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'wall_aquarium':
      // 水族箱
      ctx.fillStyle = '#4169E1';
      ctx.fillRect(0, 0, 32 * s, 32 * s);
      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(2 * s, 2 * s, 28 * s, 28 * s);
      // 魚
      ctx.fillStyle = '#FF6347';
      ctx.beginPath();
      ctx.ellipse(10 * s, 16 * s, 4 * s, 4 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.ellipse(22 * s, 20 * s, 4 * s, 4 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      // 水草
      ctx.fillStyle = '#228B22';
      ctx.fillRect(4 * s, 20 * s, 2 * s, 10 * s);
      ctx.fillRect(26 * s, 22 * s, 2 * s, 8 * s);
      break;
      
    default:
      ctx.fillStyle = '#9E9E9E';
      ctx.fillRect(4 * s, 4 * s, 24 * s, 24 * s);
      ctx.fillStyle = '#616161';
      ctx.fillRect(8 * s, 8 * s, 16 * s, 16 * s);
  }
}

function drawFloorPattern(ctx, x, y, width, height, style) {
  if (!style || style.pattern === 'solid') {
    ctx.fillStyle = style?.baseColor || '#4a4a6a';
    ctx.fillRect(x, y, width, height);
    return;
  }
  
  switch(style.pattern) {
    case 'wood':
      drawWoodFloor(ctx, x, y, width, height, style);
      break;
    case 'tile':
      drawTileFloor(ctx, x, y, width, height, style);
      break;
    case 'marble':
      drawMarbleFloor(ctx, x, y, width, height, style);
      break;
    case 'carpet':
      drawCarpetFloor(ctx, x, y, width, height, style);
      break;
    case 'concrete':
      drawConcreteFloor(ctx, x, y, width, height, style);
      break;
    case 'parquet':
      drawParquetFloor(ctx, x, y, width, height, style);
      break;
    default:
      ctx.fillStyle = style.baseColor;
      ctx.fillRect(x, y, width, height);
  }
}

function drawWoodFloor(ctx, x, y, width, height, style) {
  // 漸層基底
  const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
  gradient.addColorStop(0, style.baseColor);
  gradient.addColorStop(0.5, adjustColor(style.baseColor, 10));
  gradient.addColorStop(1, style.baseColor);
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width, height);
  
  const plankHeight = 20;
  const plankWidth = 80;
  
  // 木板紋理
  for (let py = y; py < y + height; py += plankHeight) {
    const offset = (Math.floor((py - y) / plankHeight) % 2) * (plankWidth / 2);
    for (let px = x - offset; px < x + width; px += plankWidth) {
      if (px < x) continue;
      
      // 木板邊緣陰影
      ctx.fillStyle = adjustColor(style.baseColor, -15);
      ctx.fillRect(px, py, Math.min(plankWidth, x + width - px), 1);
      ctx.fillRect(px, py, 1, Math.min(plankHeight, y + height - py));
      
      // 木板高光
      ctx.fillStyle = adjustColor(style.baseColor, 20);
      ctx.fillRect(px + 1, py + 1, Math.min(plankWidth - 2, x + width - px - 2), 1);
      
      // 木紋線條
      ctx.strokeStyle = adjustColor(style.baseColor, -8);
      ctx.lineWidth = 0.5;
      for (let i = 0; i < 3; i++) {
        const lineY = py + 5 + i * 5;
        if (lineY < y + height) {
          ctx.beginPath();
          ctx.moveTo(px, lineY);
          ctx.lineTo(Math.min(px + plankWidth, x + width), lineY);
          ctx.stroke();
        }
      }
    }
  }
  
  // 添加噪點紋理
  for (let i = 0; i < width * height * 0.01; i++) {
    const nx = x + Math.random() * width;
    const ny = y + Math.random() * height;
    ctx.fillStyle = `rgba(0,0,0,${0.03 + Math.random() * 0.05})`;
    ctx.fillRect(nx, ny, 1, 1);
  }
}

function drawTileFloor(ctx, x, y, width, height, style) {
  // 漸層基底
  const gradient = ctx.createRadialGradient(
    x + width/2, y + height/2, 0,
    x + width/2, y + height/2, Math.max(width, height) * 0.7
  );
  gradient.addColorStop(0, adjustColor(style.baseColor, 15));
  gradient.addColorStop(0.7, style.baseColor);
  gradient.addColorStop(1, adjustColor(style.baseColor, -10));
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width, height);
  
  const tileSize = 32;
  
  // 磁磚格子
  for (let ty = y; ty < y + height; ty += tileSize) {
    for (let tx = x; tx < x + width; tx += tileSize) {
      const actualWidth = Math.min(tileSize, x + width - tx);
      const actualHeight = Math.min(tileSize, y + height - ty);
      
      // 磁磚邊緣陰影
      ctx.fillStyle = adjustColor(style.baseColor, -20);
      ctx.fillRect(tx, ty + actualHeight - 1, actualWidth, 1);
      ctx.fillRect(tx + actualWidth - 1, ty, 1, actualHeight);
      
      // 磁磚高光
      ctx.fillStyle = adjustColor(style.baseColor, 25);
      ctx.fillRect(tx, ty, actualWidth, 1);
      ctx.fillRect(tx, ty, 1, actualHeight);
      
      // 磁磚接縫
      ctx.strokeStyle = style.accentColor || adjustColor(style.baseColor, -30);
      ctx.lineWidth = 1;
      ctx.strokeRect(tx, ty, actualWidth, actualHeight);
    }
  }
  
  // 添加細微紋理
  for (let i = 0; i < width * height * 0.005; i++) {
    const nx = x + Math.random() * width;
    const ny = y + Math.random() * height;
    ctx.fillStyle = `rgba(255,255,255,${0.02 + Math.random() * 0.03})`;
    ctx.fillRect(nx, ny, 1, 1);
  }
}

function drawMarbleFloor(ctx, x, y, width, height, style) {
  // 大理石漸層基底
  const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
  gradient.addColorStop(0, style.baseColor);
  gradient.addColorStop(0.3, adjustColor(style.baseColor, 20));
  gradient.addColorStop(0.6, style.baseColor);
  gradient.addColorStop(1, adjustColor(style.baseColor, -10));
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width, height);
  
  // 大理石紋理 - 雲狀紋路
  ctx.strokeStyle = style.accentColor || adjustColor(style.baseColor, -15);
  ctx.lineWidth = 1;
  
  for (let i = 0; i < 15; i++) {
    const startX = x + Math.random() * width;
    const startY = y + Math.random() * height;
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    
    for (let j = 0; j < 5; j++) {
      const cx = startX + (Math.random() - 0.5) * 80;
      const cy = startY + (Math.random() - 0.5) * 40;
      ctx.quadraticCurveTo(
        cx, cy,
        startX + (Math.random() - 0.5) * 100,
        startY + (Math.random() - 0.5) * 60
      );
    }
    ctx.stroke();
  }
  
  // 細微斑點
  for (let i = 0; i < 40; i++) {
    const mx = x + Math.random() * width;
    const my = y + Math.random() * height;
    const size = 1 + Math.floor(Math.random() * 3);
    ctx.fillStyle = `rgba(200,200,200,${0.3 + Math.random() * 0.3})`;
    ctx.fillRect(mx, my, size, size);
  }
  
  // 光澤效果
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillRect(x, y, width * 0.3, height);
}

function drawCarpetFloor(ctx, x, y, width, height, style) {
  // 地毯基底
  ctx.fillStyle = style.baseColor;
  ctx.fillRect(x, y, width, height);
  
  // 地毯邊框
  ctx.fillStyle = adjustColor(style.baseColor, -30);
  ctx.fillRect(x, y, width, 4);
  ctx.fillRect(x, y + height - 4, width, 4);
  ctx.fillRect(x, y, 4, height);
  ctx.fillRect(x + width - 4, y, 4, height);
  
  // 內框裝飾
  ctx.fillStyle = adjustColor(style.baseColor, 20);
  ctx.fillRect(x + 8, y + 8, width - 16, 2);
  ctx.fillRect(x + 8, y + height - 10, width - 16, 2);
  ctx.fillRect(x + 8, y + 8, 2, height - 16);
  ctx.fillRect(x + width - 10, y + 8, 2, height - 16);
  
  // 地毯毛絨紋理
  ctx.fillStyle = style.accentColor || adjustColor(style.baseColor, -15);
  for (let i = 0; i < 100; i++) {
    const cx = x + 10 + Math.random() * (width - 20);
    const cy = y + 10 + Math.random() * (height - 20);
    ctx.fillRect(cx, cy, 2, 3 + Math.random() * 2);
  }
  
  // 添加纖維紋理
  for (let fy = y + 12; fy < y + height - 12; fy += 8) {
    for (let fx = x + 12; fx < x + width - 12; fx += 8) {
      ctx.fillStyle = `rgba(255,255,255,${0.05 + Math.random() * 0.1})`;
      ctx.fillRect(fx, fy, 2, 2);
    }
  }
}

function drawConcreteFloor(ctx, x, y, width, height, style) {
  // 混凝土漸層
  const gradient = ctx.createLinearGradient(x, y, x, y + height);
  gradient.addColorStop(0, adjustColor(style.baseColor, 5));
  gradient.addColorStop(0.5, style.baseColor);
  gradient.addColorStop(1, adjustColor(style.baseColor, -5));
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width, height);
  
  // 混凝土裂縫和紋理
  ctx.fillStyle = style.accentColor || adjustColor(style.baseColor, -20);
  for (let i = 0; i < 20; i++) {
    const cx = x + Math.random() * width;
    const cy = y + Math.random() * height;
    const size = Math.random() * 4 + 1;
    ctx.fillRect(cx, cy, size, size);
  }
  
  // 細微顆粒紋理
  for (let i = 0; i < width * height * 0.02; i++) {
    const px = x + Math.random() * width;
    const py = y + Math.random() * height;
    const alpha = 0.05 + Math.random() * 0.1;
    ctx.fillStyle = Math.random() > 0.5 
      ? `rgba(255,255,255,${alpha})` 
      : `rgba(0,0,0,${alpha})`;
    ctx.fillRect(px, py, 1, 1);
  }
  
  // 混凝土接縫
  ctx.strokeStyle = adjustColor(style.baseColor, -15);
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(x + 2, y + 2, width - 4, height - 4);
  ctx.setLineDash([]);
}

function drawParquetFloor(ctx, x, y, width, height, style) {
  // 拼花地板基底
  const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
  gradient.addColorStop(0, style.baseColor);
  gradient.addColorStop(1, adjustColor(style.baseColor, 10));
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width, height);
  
  const blockSize = 16;
  
  // 拼花木塊
  for (let by = y; by < y + height; by += blockSize) {
    for (let bx = x; bx < x + width; bx += blockSize) {
      const actualWidth = Math.min(blockSize, x + width - bx);
      const actualHeight = Math.min(blockSize, y + height - by);
      const isAlternate = (Math.floor((bx - x) / blockSize) + Math.floor((by - y) / blockSize)) % 2;
      
      // 木塊顏色交替
      const blockColor = isAlternate ? style.baseColor : (style.accentColor || adjustColor(style.baseColor, 15));
      ctx.fillStyle = blockColor;
      ctx.fillRect(bx, by, actualWidth, actualHeight);
      
      // 木塊邊緣陰影
      ctx.fillStyle = adjustColor(blockColor, -20);
      ctx.fillRect(bx, by + actualHeight - 1, actualWidth, 1);
      ctx.fillRect(bx + actualWidth - 1, by, 1, actualHeight);
      
      // 木塊高光
      ctx.fillStyle = adjustColor(blockColor, 30);
      ctx.fillRect(bx, by, actualWidth, 1);
      ctx.fillRect(bx, by, 1, actualHeight);
      
      // 木紋線條
      ctx.strokeStyle = adjustColor(blockColor, -10);
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + actualWidth, by + actualHeight);
      ctx.stroke();
    }
  }
  
  // 添加光澤
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.fillRect(x, y, width, height * 0.3);
}

function drawWallPattern(ctx, x, y, width, height, style) {
  if (!style || style.pattern === 'paint') {
    ctx.fillStyle = style?.baseColor || '#3a3a5a';
    ctx.fillRect(x, y, width, height);
    return;
  }
  
  switch(style.pattern) {
    case 'floral':
      drawFloralWallpaper(ctx, x, y, width, height, style);
      break;
    case 'striped':
      drawStripedWallpaper(ctx, x, y, width, height, style);
      break;
    case 'geometric':
      drawGeometricWallpaper(ctx, x, y, width, height, style);
      break;
    case 'brick':
      drawBrickWall(ctx, x, y, width, height, style);
      break;
    case 'wood_panel':
      drawWoodPanelWall(ctx, x, y, width, height, style);
      break;
    default:
      ctx.fillStyle = style.baseColor;
      ctx.fillRect(x, y, width, height);
  }
}

function drawFloralWallpaper(ctx, x, y, width, height, style) {
  ctx.fillStyle = style.baseColor;
  ctx.fillRect(x, y, width, height);
  
  ctx.fillStyle = style.accentColor;
  for (let fy = y + 10; fy < y + height; fy += 30) {
    for (let fx = x + 10; fx < x + width; fx += 30) {
      ctx.beginPath();
      ctx.arc(fx, fy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(fx + 10, fy + 10, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawStripedWallpaper(ctx, x, y, width, height, style) {
  ctx.fillStyle = style.baseColor;
  ctx.fillRect(x, y, width, height);
  
  ctx.fillStyle = style.accentColor;
  const stripeWidth = 20;
  for (let sx = x; sx < x + width; sx += stripeWidth * 2) {
    ctx.fillRect(sx, y, stripeWidth, height);
  }
}

function drawGeometricWallpaper(ctx, x, y, width, height, style) {
  ctx.fillStyle = style.baseColor;
  ctx.fillRect(x, y, width, height);
  
  ctx.strokeStyle = style.accentColor;
  ctx.lineWidth = 2;
  
  const gridSize = 40;
  for (let gy = y; gy < y + height; gy += gridSize) {
    for (let gx = x; gx < x + width; gx += gridSize) {
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx + gridSize, gy + gridSize);
      ctx.moveTo(gx + gridSize, gy);
      ctx.lineTo(gx, gy + gridSize);
      ctx.stroke();
    }
  }
}

function drawBrickWall(ctx, x, y, width, height, style) {
  ctx.fillStyle = style.baseColor;
  ctx.fillRect(x, y, width, height);
  
  const brickWidth = 40;
  const brickHeight = 20;
  let offset = 0;
  
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  
  for (let by = y; by < y + height; by += brickHeight) {
    for (let bx = x + offset; bx < x + width; bx += brickWidth) {
      ctx.strokeRect(bx, by, brickWidth, brickHeight);
    }
    offset = offset === 0 ? -brickWidth / 2 : 0;
  }
}

function drawWoodPanelWall(ctx, x, y, width, height, style) {
  ctx.fillStyle = style.baseColor;
  ctx.fillRect(x, y, width, height);
  
  const panelHeight = 60;
  
  ctx.strokeStyle = style.accentColor;
  ctx.lineWidth = 3;
  
  for (let py = y; py < y + height; py += panelHeight) {
    ctx.beginPath();
    ctx.moveTo(x, py);
    ctx.lineTo(x + width, py);
    ctx.stroke();
  }
}

function getActiveEvents() {
  const now = new Date();
  const activeEvents = [];
  
  SEASONAL_EVENTS.forEach(event => {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    const nowYear = now.getFullYear();
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    
    const adjustedStart = new Date(nowYear, start.getMonth(), start.getDate());
    const adjustedEnd = new Date(nowYear, end.getMonth(), end.getDate());
    
    if (now >= adjustedStart && now <= adjustedEnd) {
      activeEvents.push({...event, startDate: adjustedStart, endDate: adjustedEnd});
    }
  });
  
  return activeEvents;
}

function isWeekendSale() {
  const now = new Date();
  const day = now.getDay();
  return day === 0 || day === 6;
}

function getWeekendDiscount() {
  return isWeekendSale() ? 0.8 : 1;
}

function getDiscountedPrice(furniture, event) {
  if (!furniture) return 0;
  
  let price = furniture.price;
  
  if (isWeekendSale()) {
    price = Math.floor(price * getWeekendDiscount());
  }
  
  if (event && event.discount) {
    price = Math.floor(price * event.discount);
  }
  
  return price;
}

function getShopFurniturePixels(id) {
  return (ctx, size) => generateShopFurniturePixels(id, ctx, size);
}

function renderSprite(sprite, canvas, size = 96) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, size, size);
  
  const scale = size / 96;
  const skin = sprite.skin || '#fde8c8';
  const skinShadow = adjustColor(skin, -20);
  const skinHighlight = adjustColor(skin, 15);
  const hair = sprite.haircolor || '#2d1b00';
  const hairShadow = adjustColor(hair, -15);
  const outfit = sprite.outfitcolor || '#ff6b9d';
  const outfitShadow = adjustColor(outfit, -25);
  const outfitHighlight = adjustColor(outfit, 20);
  
  ctx.save();
  ctx.scale(scale, scale);
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.beginPath();
  ctx.ellipse(48, 92, 20, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = outfit;
  if (sprite.body === 'slim') {
    ctx.fillRect(36, 32, 24, 44);
    ctx.fillRect(34, 76, 10, 16);
    ctx.fillRect(52, 76, 10, 16);
    ctx.fillRect(28, 34, 8, 28);
    ctx.fillRect(60, 34, 8, 28);
    
    ctx.fillStyle = outfitHighlight;
    ctx.fillRect(36, 32, 4, 44);
    ctx.fillRect(34, 76, 3, 16);
    ctx.fillRect(52, 76, 3, 16);
    ctx.fillRect(28, 34, 3, 28);
    ctx.fillRect(60, 34, 3, 28);
    
    ctx.fillStyle = outfitShadow;
    ctx.fillRect(56, 32, 4, 44);
    ctx.fillRect(41, 76, 3, 16);
    ctx.fillRect(59, 76, 3, 16);
    ctx.fillRect(33, 34, 3, 28);
    ctx.fillRect(65, 34, 3, 28);
  } else {
    ctx.fillRect(32, 32, 32, 44);
    ctx.fillRect(30, 76, 14, 16);
    ctx.fillRect(52, 76, 14, 16);
    ctx.fillRect(22, 34, 10, 28);
    ctx.fillRect(64, 34, 10, 28);
    
    ctx.fillStyle = outfitHighlight;
    ctx.fillRect(32, 32, 4, 44);
    ctx.fillRect(30, 76, 4, 16);
    ctx.fillRect(52, 76, 4, 16);
    ctx.fillRect(22, 34, 4, 28);
    ctx.fillRect(64, 34, 4, 28);
    
    ctx.fillStyle = outfitShadow;
    ctx.fillRect(60, 32, 4, 44);
    ctx.fillRect(40, 76, 4, 16);
    ctx.fillRect(62, 76, 4, 16);
    ctx.fillRect(28, 34, 4, 28);
    ctx.fillRect(70, 34, 4, 28);
  }
  
  ctx.fillStyle = skin;
  ctx.fillRect(32, 8, 32, 28);
  
  ctx.fillStyle = skinHighlight;
  ctx.fillRect(32, 8, 4, 28);
  
  ctx.fillStyle = skinShadow;
  ctx.fillRect(60, 8, 4, 28);
  
  ctx.fillStyle = '#1a0a00';
  ctx.fillRect(36, 20, 4, 4);
  ctx.fillRect(56, 20, 4, 4);
  
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(36, 20, 1, 1);
  ctx.fillRect(56, 20, 1, 1);
  
  ctx.fillStyle = '#ff9999';
  ctx.fillRect(40, 26, 16, 3);
  
  ctx.fillStyle = hair;
  ctx.fillRect(32, 4, 32, 16);
  ctx.fillRect(28, 8, 8, 16);
  ctx.fillRect(60, 8, 8, 16);
  
  ctx.fillStyle = hairShadow;
  ctx.fillRect(60, 4, 4, 16);
  ctx.fillRect(64, 8, 4, 16);
  
  ctx.restore();
  return canvas;
}

function init() {
  loadSavedData();
  renderWorldNav();
  renderFurnitureCatalog();
  updateBalance();
  
  if (window.lucide) lucide.createIcons();
}

function renderWorldNav() {
  const grid = document.getElementById('community-grid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  Object.values(COMMUNITIES).forEach(community => {
    const card = document.createElement('div');
    card.className = `community-card ${community.id}`;
    card.onclick = () => selectCommunity(community.id);
    
    card.innerHTML = `
      <div class="community-icon">
        <i data-lucide="${community.icon}"></i>
      </div>
      <div class="community-name">${community.name}</div>
      <div class="community-desc">${community.description}</div>
      ${community.badge ? `<div class="community-badge">${community.badge}</div>` : ''}
      <div class="community-preview">
        <canvas id="preview-${community.id}" width="160" height="80"></canvas>
      </div>
    `;
    
    grid.appendChild(card);
    
    setTimeout(() => {
      renderCommunityPreview(community.id);
    }, 50);
  });
  
  updateBalanceNav();
  
  if (window.lucide) lucide.createIcons();
}

function updateBalanceNav() {
  const el = document.getElementById('current-balance-nav');
  if (el) el.textContent = formatCurrency(getBalance());
}

function renderCommunityPreview(communityId) {
  const canvas = document.getElementById(`preview-${communityId}`);
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const community = COMMUNITIES[communityId];
  const p = 4;
  
  ctx.fillStyle = community.bgColor;
  ctx.fillRect(0, 0, 160, 80);
  
  for (let y = 0; y < 20; y++) {
    for (let x = 0; x < 40; x++) {
      const px = x * p;
      const py = y * p;
      
      if (community.terrain === 'seaside' && y > 16) {
        ctx.fillStyle = '#f4d03f';
        ctx.fillRect(px, py, p, p);
      } else if (community.terrain === 'nature') {
        if (Math.random() > 0.85) {
          ctx.fillStyle = '#1a5a1a';
          ctx.fillRect(px, py, p, p);
        } else if (Math.random() > 0.9) {
          ctx.fillStyle = '#2d7a2d';
          ctx.fillRect(px, py, p, p);
        }
      } else if (community.terrain === 'leisure') {
        if ((x + y) % 5 === 0) {
          ctx.fillStyle = '#3a8a3a';
          ctx.fillRect(px, py, p, p);
        }
      }
    }
  }
  
  community.decorations.forEach(dec => {
    dec.positions.forEach(pos => {
      const dx = Math.floor((pos[0] / 40) * 160 / p) * p;
      const dy = Math.floor((pos[1] / 30) * 80 / p) * p;
      
      if (dec.type === 'tree' || dec.type === 'big_tree') {
        ctx.fillStyle = '#1a5a1a';
        ctx.fillRect(dx - p, dy - p, 3 * p, 3 * p);
        ctx.fillStyle = '#228B22';
        ctx.fillRect(dx, dy, 2 * p, 2 * p);
        ctx.fillStyle = '#32CD32';
        ctx.fillRect(dx + p, dy, p, p);
      } else if (dec.type === 'fountain') {
        ctx.fillStyle = '#4a90d0';
        ctx.fillRect(dx - p, dy - p, 3 * p, 3 * p);
        ctx.fillStyle = '#6eb5ff';
        ctx.fillRect(dx, dy, p, p);
      } else if (dec.type === 'lamp') {
        ctx.fillStyle = '#505050';
        ctx.fillRect(dx, dy, p, p);
        ctx.fillStyle = '#ffeb3b';
        ctx.fillRect(dx, dy - p, p, p);
      } else if (dec.type === 'flower' || dec.type === 'wildflower') {
        ctx.fillStyle = '#FF69B4';
        ctx.fillRect(dx, dy, p, p);
      }
    });
  });
  
  community.buildings.forEach(building => {
    const buildingData = COMMUNITY_BUILDINGS[building.type];
    if (buildingData) {
      const bx = Math.floor((building.x / 40) * 160 / p) * p;
      const by = Math.floor((building.y / 30) * 80 / p) * p;
      const bw = Math.max(p, Math.floor((building.width / 40) * 160 / p) * p);
      const bh = Math.max(p, Math.floor((building.height / 30) * 80 / p) * p);
      
      ctx.fillStyle = buildingData.roofColor || '#a0522d';
      ctx.fillRect(bx, by, bw, bh);
      
      ctx.fillStyle = adjustColor(buildingData.roofColor || '#a0522d', 30);
      ctx.fillRect(bx, by, p, bh);
      ctx.fillRect(bx, by, bw, p);
      
      ctx.fillStyle = adjustColor(buildingData.roofColor || '#a0522d', -20);
      ctx.fillRect(bx + bw - p, by, p, bh);
      ctx.fillRect(bx, by + bh - p, bw, p);
      
      ctx.fillStyle = buildingData.color;
      ctx.fillRect(bx + p, by + p, bw - 2 * p, bh - 2 * p);
      
      ctx.fillStyle = '#4a90d0';
      ctx.fillRect(bx + 2 * p, by + 2 * p, p, p);
      ctx.fillRect(bx + bw - 3 * p, by + 2 * p, p, p);
    }
  });
}

function selectCommunity(communityId) {
  const community = COMMUNITIES[communityId];
  if (!community) return;
  
  HomeApp.currentCommunity = communityId;
  
  document.getElementById('world-nav-view').classList.add('hidden');
  document.getElementById('map-view').classList.remove('hidden');
  
  const titleEl = document.querySelector('#map-view .app-title');
  if (titleEl) titleEl.textContent = community.name;
  
  initCommunityMap();
}

function initCommunityMap() {
  HomeApp.mapCanvas = document.getElementById('map-canvas');
  if (!HomeApp.mapCanvas) {
    console.error('Map canvas not found');
    return;
  }
  HomeApp.mapCtx = HomeApp.mapCanvas.getContext('2d');
  
  const gridBtn = document.getElementById('grid-toggle-btn');
  if (gridBtn && HomeApp.showGrid) {
    gridBtn.style.background = 'rgba(233, 69, 96, 0.3)';
  }
  
  generateCommunityMap();
  
  setTimeout(() => {
    resizeMapCanvas();
  }, 50);
  
  window.addEventListener('resize', resizeMapCanvas);
  
  HomeApp.mapCanvas.addEventListener('click', handleCommunityMapClick);
  HomeApp.mapCanvas.addEventListener('mousedown', handleMapDragStart);
  HomeApp.mapCanvas.addEventListener('mousemove', handleCommunityMapDragMove);
  HomeApp.mapCanvas.addEventListener('mouseup', handleMapDragEnd);
  HomeApp.mapCanvas.addEventListener('mouseleave', handleMapDragEnd);
}

function generateCommunityMap() {
  const community = COMMUNITIES[HomeApp.currentCommunity];
  if (!community) return;
  
  const map = [];
  const config = COMMUNITY_MAP_CONFIG;
  
  for (let y = 0; y < config.height; y++) {
    map[y] = [];
    for (let x = 0; x < config.width; x++) {
      map[y][x] = getCommunityTile(community, x, y);
    }
  }
  
  HomeApp.communityMap = map;
  HomeApp.communityBuildings = [];
  HomeApp.communityEmptyLots = [];
  HomeApp.communityDecorations = [];
  
  community.buildings.forEach(building => {
    const buildingData = COMMUNITY_BUILDINGS[building.type];
    if (buildingData) {
      HomeApp.communityBuildings.push({
        type: building.type,
        x: building.x,
        y: building.y,
        width: building.width,
        height: building.height,
        data: buildingData
      });
    }
  });
  
  community.emptyLots.forEach(lot => {
    HomeApp.communityEmptyLots.push({
      x: lot.x,
      y: lot.y,
      width: lot.width,
      height: lot.height
    });
  });
  
  community.decorations.forEach(dec => {
    dec.positions.forEach(pos => {
      HomeApp.communityDecorations.push({
        type: dec.type,
        x: pos[0],
        y: pos[1],
        width: pos[2] || 1,
        height: pos[3] || 1
      });
    });
  });
}

function getCommunityTile(community, x, y) {
  const config = COMMUNITY_MAP_CONFIG;
  
  if (community.terrain === 'residential') {
    const roadY = Math.floor(config.height / 2);
    const roadX = Math.floor(config.width / 2);
    
    if (y >= roadY - 1 && y <= roadY + 2) {
      if (x >= roadX - 1 && x <= roadX + 2) {
        return COMMUNITY_TILE_TYPES.ROAD_CROSS;
      }
      return COMMUNITY_TILE_TYPES.ROAD_H;
    }
    if (x >= roadX - 1 && x <= roadX + 2) {
      return COMMUNITY_TILE_TYPES.ROAD_V;
    }
    if (y === roadY - 2 || y === roadY + 3) {
      return COMMUNITY_TILE_TYPES.SIDEWALK;
    }
    return COMMUNITY_TILE_TYPES.GRASS;
  }
  
  if (community.terrain === 'commercial') {
    const roadY = Math.floor(config.height / 2);
    
    if (y >= roadY - 1 && y <= roadY + 2) {
      return COMMUNITY_TILE_TYPES.ROAD_H;
    }
    if (y === roadY - 2 || y === roadY + 3) {
      return COMMUNITY_TILE_TYPES.SIDEWALK;
    }
    return COMMUNITY_TILE_TYPES.CONCRETE;
  }
  
  if (community.terrain === 'leisure') {
    if (Math.random() > 0.85) {
      return COMMUNITY_TILE_TYPES.GARDEN;
    }
    return COMMUNITY_TILE_TYPES.GRASS;
  }
  
  if (community.terrain === 'nature') {
    if (Math.random() > 0.9) {
      return COMMUNITY_TILE_TYPES.FOREST;
    }
    return COMMUNITY_TILE_TYPES.GRASS;
  }
  
  if (community.terrain === 'seaside') {
    if (y > config.height - 6) {
      return COMMUNITY_TILE_TYPES.BEACH;
    }
    if (y > config.height - 4) {
      return COMMUNITY_TILE_TYPES.SAND;
    }
    return COMMUNITY_TILE_TYPES.GRASS;
  }
  
  if (community.terrain === 'cultural') {
    const centerX = Math.floor(config.width / 2);
    const centerY = Math.floor(config.height / 2);
    
    if (Math.abs(x - centerX) < 8 && Math.abs(y - centerY) < 6) {
      return COMMUNITY_TILE_TYPES.STONE_PATH;
    }
    return COMMUNITY_TILE_TYPES.GRASS;
  }
  
  return COMMUNITY_TILE_TYPES.GRASS;
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
      HomeApp.floorStyle = data.floorStyle || 'wood_light';
      HomeApp.wallStyle = data.wallStyle || 'paint_white';
      if (data.characterSprite) {
        HomeApp.characterSprite = data.characterSprite;
      }
      HomeApp.properties = data.properties || [];
      
      if (data.roomExpansions) {
        HomeApp.roomExpansions = data.roomExpansions;
        updateRoomSize();
      }
      
      if (data.customPlacedBuildings) {
        HomeApp.customPlacedBuildings = data.customPlacedBuildings;
      }
      if (data.customPlacedDecorations) {
        HomeApp.customPlacedDecorations = data.customPlacedDecorations;
      }
      
      loadOwnedFurnitureToCatalog(data.ownedFurniture || []);
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

function loadOwnedFurnitureToCatalog(ownedIds) {
  ownedIds.forEach(itemId => {
    const shopItem = FURNITURE_SHOP_CATALOG.find(f => f.id === itemId);
    if (shopItem && !FURNITURE_CATALOG.find(f => f.id === itemId)) {
      FURNITURE_CATALOG.push({
        id: shopItem.id,
        name: shopItem.name,
        category: shopItem.category,
        width: shopItem.width,
        height: shopItem.height,
        pixels: getShopFurniturePixels(shopItem.id),
        interactive: shopItem.interactive
      });
    }
  });
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
    const existingData = JSON.parse(localStorage.getItem('sx_home_data') || '{}');
    const data = {
      placedFurniture: HomeApp.placedFurniture,
      roomStyle: HomeApp.roomStyle,
      floorColor: HomeApp.floorColor,
      wallColor: HomeApp.wallColor,
      floorStyle: HomeApp.floorStyle || existingData.floorStyle || 'wood_light',
      wallStyle: HomeApp.wallStyle || existingData.wallStyle || 'paint_white',
      characterSprite: HomeApp.characterSprite,
      properties: HomeApp.properties,
      ownedFurniture: existingData.ownedFurniture || [],
      ownedFloorStyles: existingData.ownedFloorStyles || ['wood_light'],
      ownedWallStyles: existingData.ownedWallStyles || ['paint_white'],
      roomExpansions: HomeApp.roomExpansions,
      customPlacedBuildings: HomeApp.customPlacedBuildings,
      customPlacedDecorations: HomeApp.customPlacedDecorations,
      customTerrainMap: HomeApp.customTerrainMap
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
  
  if (HomeApp.currentCommunity) {
    renderCommunityMap();
  } else {
    renderMap();
  }
}

function renderCommunityMap() {
  const ctx = HomeApp.mapCtx;
  const canvas = HomeApp.mapCanvas;
  
  if (!ctx || !canvas || canvas.width === 0 || canvas.height === 0) return;
  
  const community = COMMUNITIES[HomeApp.currentCommunity];
  if (!community) return;
  
  ctx.fillStyle = community.bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  const tileSize = COMMUNITY_MAP_CONFIG.tileSize * HomeApp.mapScale;
  const mapWidth = COMMUNITY_MAP_CONFIG.width * tileSize;
  const mapHeight = COMMUNITY_MAP_CONFIG.height * tileSize;
  const offsetX = (canvas.width - mapWidth) / 2 + HomeApp.mapOffset.x;
  const offsetY = (canvas.height - mapHeight) / 2 + HomeApp.mapOffset.y;
  
  renderCommunityTiles(ctx, offsetX, offsetY, tileSize, community);
  renderCustomTerrain(ctx, offsetX, offsetY, tileSize);
  renderCommunityDecorations(ctx, offsetX, offsetY, tileSize);
  renderCommunityBuildings(ctx, offsetX, offsetY, tileSize);
  renderCommunityEmptyLots(ctx, offsetX, offsetY, tileSize);
  renderCommunityProperties(ctx, offsetX, offsetY, tileSize);
  
  if (HomeApp.showGrid) {
    renderMapGrid(ctx, offsetX, offsetY, tileSize);
  }
}

function renderCustomTerrain(ctx, offsetX, offsetY, tileSize) {
  const customTerrain = HomeApp.customTerrainMap[HomeApp.currentCommunity];
  if (!customTerrain) return;
  
  const config = COMMUNITY_MAP_CONFIG;
  
  for (let y = 0; y < config.height; y++) {
    for (let x = 0; x < config.width; x++) {
      const terrainKey = `${x},${y}`;
      const terrainType = customTerrain[terrainKey];
      
      if (terrainType) {
        const px = offsetX + x * tileSize;
        const py = offsetY + y * tileSize;
        drawCustomTerrainTile(ctx, px, py, tileSize, terrainType);
      }
    }
  }
}

function drawCustomTerrainTile(ctx, x, y, size, terrainType) {
  switch (terrainType) {
    case 'grass':
      ctx.fillStyle = '#7CB342';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#8BC34A';
      for (let i = 0; i < 3; i++) {
        const gx = x + Math.random() * size;
        const gy = y + Math.random() * size;
        ctx.fillRect(gx, gy, 2, 3);
      }
      break;
      
    case 'dirt':
      ctx.fillStyle = '#8B7355';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#7B6345';
      for (let i = 0; i < 4; i++) {
        const dx = x + Math.random() * size;
        const dy = y + Math.random() * size;
        ctx.fillRect(dx, dy, 3, 2);
      }
      break;
      
    case 'stone':
      ctx.fillStyle = '#808080';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#909090';
      ctx.fillRect(x + size * 0.1, y + size * 0.1, size * 0.35, size * 0.35);
      ctx.fillRect(x + size * 0.55, y + size * 0.55, size * 0.35, size * 0.35);
      ctx.strokeStyle = '#606060';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
      break;
      
    case 'sand':
      ctx.fillStyle = '#f4d03f';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#e6c229';
      for (let i = 0; i < 5; i++) {
        const sx = x + Math.random() * size;
        const sy = y + Math.random() * size;
        ctx.fillRect(sx, sy, 2, 1);
      }
      break;
      
    case 'water':
      ctx.fillStyle = '#4682B4';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#5B92D4';
      ctx.fillRect(x + size * 0.1, y + size * 0.1, size * 0.3, size * 0.2);
      ctx.fillStyle = '#3B72A4';
      ctx.fillRect(x + size * 0.5, y + size * 0.6, size * 0.4, size * 0.3);
      break;
      
    case 'paved':
      ctx.fillStyle = '#5a5a5a';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#6a6a6a';
      ctx.fillRect(x + size * 0.05, y + size * 0.05, size * 0.45, size * 0.45);
      ctx.fillRect(x + size * 0.5, y + size * 0.5, size * 0.45, size * 0.45);
      ctx.strokeStyle = '#4a4a4a';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, size, size);
      break;
  }
}

function renderMapGrid(ctx, offsetX, offsetY, tileSize) {
  const config = COMMUNITY_MAP_CONFIG;
  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1;
  
  for (let x = 0; x <= config.width; x++) {
    ctx.beginPath();
    ctx.moveTo(offsetX + x * tileSize, offsetY);
    ctx.lineTo(offsetX + x * tileSize, offsetY + config.height * tileSize);
    ctx.stroke();
  }
  
  for (let y = 0; y <= config.height; y++) {
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY + y * tileSize);
    ctx.lineTo(offsetX + config.width * tileSize, offsetY + y * tileSize);
    ctx.stroke();
  }
  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.setLineDash([2, 4]);
  
  for (let x = 0; x <= config.width; x++) {
    ctx.beginPath();
    ctx.moveTo(offsetX + x * tileSize, offsetY);
    ctx.lineTo(offsetX + x * tileSize, offsetY + config.height * tileSize);
    ctx.stroke();
  }
  
  for (let y = 0; y <= config.height; y++) {
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY + y * tileSize);
    ctx.lineTo(offsetX + config.width * tileSize, offsetY + y * tileSize);
    ctx.stroke();
  }
  
  ctx.setLineDash([]);
}

function renderCommunityTiles(ctx, offsetX, offsetY, tileSize, community) {
  const map = HomeApp.communityMap;
  if (!map) return;
  
  const config = COMMUNITY_MAP_CONFIG;
  
  for (let y = 0; y < config.height; y++) {
    for (let x = 0; x < config.width; x++) {
      const px = offsetX + x * tileSize;
      const py = offsetY + y * tileSize;
      const tileType = map[y][x];
      
      drawCommunityTile(ctx, px, py, tileSize, tileType, community);
    }
  }
}

function drawCommunityTile(ctx, x, y, size, type, community) {
  switch (type) {
    case COMMUNITY_TILE_TYPES.GRASS:
      ctx.fillStyle = community.terrain === 'nature' ? '#1a4a1a' : '#2d5a27';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = community.terrain === 'nature' ? '#2a5a2a' : '#3a6b34';
      for (let i = 0; i < 3; i++) {
        const gx = x + Math.random() * size;
        const gy = y + Math.random() * size;
        ctx.fillRect(gx, gy, 2, 4);
      }
      break;
      
    case COMMUNITY_TILE_TYPES.ROAD_H:
    case COMMUNITY_TILE_TYPES.ROAD_V:
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#4a4a4a';
      ctx.fillRect(x + size * 0.1, y + size * 0.4, size * 0.8, size * 0.2);
      ctx.fillStyle = '#ffcc00';
      if (type === COMMUNITY_TILE_TYPES.ROAD_H) {
        ctx.fillRect(x + size * 0.2, y + size * 0.45, size * 0.3, size * 0.1);
      } else {
        ctx.fillRect(x + size * 0.45, y + size * 0.2, size * 0.1, size * 0.3);
      }
      break;
      
    case COMMUNITY_TILE_TYPES.ROAD_CROSS:
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#4a4a4a';
      ctx.fillRect(x + size * 0.1, y + size * 0.1, size * 0.8, size * 0.8);
      break;
      
    case COMMUNITY_TILE_TYPES.SIDEWALK:
      ctx.fillStyle = '#8a8a8a';
      ctx.fillRect(x, y, size, size);
      ctx.strokeStyle = '#7a7a7a';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
      break;
      
    case COMMUNITY_TILE_TYPES.CONCRETE:
      ctx.fillStyle = '#5a5a5a';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#6a6a6a';
      ctx.fillRect(x + size * 0.05, y + size * 0.05, size * 0.45, size * 0.45);
      ctx.fillRect(x + size * 0.5, y + size * 0.5, size * 0.45, size * 0.45);
      break;
      
    case COMMUNITY_TILE_TYPES.GARDEN:
      ctx.fillStyle = '#228B22';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#32CD32';
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(x + Math.random() * size * 0.8, y + Math.random() * size * 0.8, 3, 3);
      }
      break;
      
    case COMMUNITY_TILE_TYPES.FOREST:
      ctx.fillStyle = '#0d3a0d';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#1a5a1a';
      ctx.beginPath();
      ctx.arc(x + size * 0.5, y + size * 0.5, size * 0.3, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case COMMUNITY_TILE_TYPES.SAND:
    case COMMUNITY_TILE_TYPES.BEACH:
      ctx.fillStyle = type === COMMUNITY_TILE_TYPES.BEACH ? '#f4d03f' : '#e6c229';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#d4ac0d';
      for (let i = 0; i < 2; i++) {
        ctx.fillRect(x + Math.random() * size, y + Math.random() * size, 2, 2);
      }
      break;
      
    case COMMUNITY_TILE_TYPES.STONE_PATH:
      ctx.fillStyle = '#8B7355';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#9B8365';
      ctx.fillRect(x + size * 0.1, y + size * 0.1, size * 0.35, size * 0.35);
      ctx.fillRect(x + size * 0.55, y + size * 0.55, size * 0.35, size * 0.35);
      break;
      
    default:
      ctx.fillStyle = community.bgColor;
      ctx.fillRect(x, y, size, size);
  }
}

function renderCommunityDecorations(ctx, offsetX, offsetY, tileSize) {
  if (!HomeApp.communityDecorations) return;
  
  HomeApp.communityDecorations.forEach(dec => {
    const px = offsetX + dec.x * tileSize;
    const py = offsetY + dec.y * tileSize;
    
    drawCommunityDecoration(ctx, px, py, tileSize, dec.type, dec.width, dec.height);
  });
  
  if (HomeApp.customPlacedDecorations && HomeApp.customPlacedDecorations.length > 0) {
    HomeApp.customPlacedDecorations.forEach(dec => {
      const px = offsetX + dec.x * tileSize;
      const py = offsetY + dec.y * tileSize;
      
      drawCommunityDecoration(ctx, px, py, tileSize, dec.type || 'tree', dec.width, dec.height);
    });
  }
}

function drawCommunityDecoration(ctx, x, y, size, type, width = 1, height = 1) {
  switch (type) {
    case 'tree':
    case 'big_tree':
      const treeSize = type === 'big_tree' ? 1.5 : 1;
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(x + size * 0.4, y + size * 0.5, size * 0.2 * treeSize, size * 0.5);
      ctx.fillStyle = '#228B22';
      ctx.beginPath();
      ctx.arc(x + size * 0.5, y + size * 0.35, size * 0.35 * treeSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#32CD32';
      ctx.beginPath();
      ctx.arc(x + size * 0.35, y + size * 0.25, size * 0.15 * treeSize, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'lamp':
      ctx.fillStyle = '#333';
      ctx.fillRect(x + size * 0.45, y + size * 0.3, size * 0.1, size * 0.6);
      ctx.fillStyle = '#666';
      ctx.fillRect(x + size * 0.35, y + size * 0.25, size * 0.3, size * 0.1);
      ctx.fillStyle = '#ffeb3b';
      ctx.beginPath();
      ctx.arc(x + size * 0.5, y + size * 0.2, size * 0.1, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'flower':
    case 'wildflower':
      const colors = ['#FF69B4', '#FFD700', '#FF6347', '#9370DB'];
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = colors[i];
        ctx.beginPath();
        ctx.arc(x + size * (0.2 + i * 0.2), y + size * 0.5, size * 0.08, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
      
    case 'garden':
      ctx.fillStyle = '#228B22';
      ctx.fillRect(x, y, size * width, size * height);
      ctx.fillStyle = '#FF69B4';
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(x + Math.random() * size * width, y + Math.random() * size * height, size * 0.05, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
      
    case 'mailbox':
      ctx.fillStyle = '#c73e54';
      ctx.fillRect(x + size * 0.3, y + size * 0.4, size * 0.4, size * 0.3);
      ctx.fillStyle = '#333';
      ctx.fillRect(x + size * 0.45, y + size * 0.3, size * 0.1, size * 0.6);
      break;
      
    case 'fountain':
      ctx.fillStyle = '#4169E1';
      ctx.beginPath();
      ctx.ellipse(x + size * 0.5, y + size * 0.6, size * 0.4, size * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#87CEEB';
      ctx.beginPath();
      ctx.ellipse(x + size * 0.5, y + size * 0.6, size * 0.3, size * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4169E1';
      ctx.fillRect(x + size * 0.45, y + size * 0.2, size * 0.1, size * 0.4);
      break;
      
    case 'bench':
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(x, y + size * 0.4, size, size * 0.15);
      ctx.fillRect(x + size * 0.1, y + size * 0.55, size * 0.1, size * 0.3);
      ctx.fillRect(x + size * 0.8, y + size * 0.55, size * 0.1, size * 0.3);
      break;
      
    case 'flower_bed':
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#FF69B4';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(x + size * (0.25 + i * 0.25), y + size * 0.5, size * 0.12, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
      
    case 'coconut_tree':
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(x + size * 0.4, y + size * 0.3, size * 0.2, size * 0.7);
      ctx.fillStyle = '#228B22';
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(x + size * 0.5 + Math.cos(angle) * size * 0.3, y + size * 0.2 + Math.sin(angle) * size * 0.15, size * 0.25, size * 0.08, angle, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
      
    case 'beach_chair':
      ctx.fillStyle = '#ff6b6b';
      ctx.fillRect(x + size * 0.1, y + size * 0.3, size * 0.8, size * 0.4);
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + size * 0.15, y + size * 0.35, size * 0.7, size * 0.3);
      break;
      
    case 'wave':
      ctx.fillStyle = 'rgba(65, 105, 225, 0.5)';
      for (let i = 0; i < width; i++) {
        ctx.beginPath();
        ctx.arc(x + i * size + size * 0.5, y + size * 0.5, size * 0.3, 0, Math.PI);
        ctx.fill();
      }
      break;
      
    case 'shell':
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(x + size * 0.5, y + size * 0.5, size * 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f5f5dc';
      ctx.beginPath();
      ctx.arc(x + size * 0.5, y + size * 0.5, size * 0.1, 0, Math.PI);
      ctx.fill();
      break;
      
    case 'boat':
      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.moveTo(x + size * 0.1, y + size * 0.5);
      ctx.lineTo(x + size * 0.9, y + size * 0.5);
      ctx.lineTo(x + size * 0.7, y + size * 0.7);
      ctx.lineTo(x + size * 0.3, y + size * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + size * 0.45, y + size * 0.2, size * 0.1, size * 0.35);
      ctx.fillRect(x + size * 0.3, y + size * 0.35, size * 0.4, size * 0.15);
      break;
      
    case 'statue':
      ctx.fillStyle = '#9E9E9E';
      ctx.fillRect(x + size * 0.35, y + size * 0.2, size * 0.3, size * 0.6);
      ctx.beginPath();
      ctx.arc(x + size * 0.5, y + size * 0.15, size * 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#757575';
      ctx.fillRect(x + size * 0.3, y + size * 0.8, size * 0.4, size * 0.1);
      break;
      
    case 'flag':
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(x + size * 0.45, y + size * 0.2, size * 0.1, size * 0.7);
      ctx.fillStyle = '#e94560';
      ctx.fillRect(x + size * 0.55, y + size * 0.2, size * 0.35, size * 0.25);
      break;
      
    case 'neon_sign':
      ctx.fillStyle = '#ff00ff';
      ctx.fillRect(x, y + size * 0.3, size * 0.8, size * 0.4);
      ctx.fillStyle = '#00ffff';
      ctx.fillRect(x + size * 0.1, y + size * 0.35, size * 0.6, size * 0.3);
      break;
      
    case 'billboard':
      ctx.fillStyle = '#333';
      ctx.fillRect(x + size * 0.1, y, size * 0.8, size * 0.6);
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + size * 0.15, y + size * 0.1, size * 0.7, size * 0.4);
      ctx.fillStyle = '#666';
      ctx.fillRect(x + size * 0.4, y + size * 0.6, size * 0.2, size * 0.4);
      break;
      
    case 'bus_stop':
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(x + size * 0.2, y + size * 0.3, size * 0.6, size * 0.5);
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + size * 0.25, y + size * 0.35, size * 0.5, size * 0.1);
      break;
      
    case 'vending_machine':
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(x + size * 0.2, y, size * 0.6, size);
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + size * 0.25, y + size * 0.2, size * 0.5, size * 0.5);
      break;
      
    case 'rock':
      ctx.fillStyle = '#696969';
      ctx.beginPath();
      ctx.arc(x + size * 0.5, y + size * 0.6, size * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#808080';
      ctx.beginPath();
      ctx.arc(x + size * 0.4, y + size * 0.5, size * 0.2, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'lake':
      ctx.fillStyle = '#4169E1';
      ctx.beginPath();
      ctx.ellipse(x + size * width * 0.5, y + size * height * 0.5, size * width * 0.4, size * height * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#87CEEB';
      ctx.beginPath();
      ctx.ellipse(x + size * width * 0.5, y + size * height * 0.5, size * width * 0.3, size * height * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'stream':
      ctx.fillStyle = '#4169E1';
      ctx.fillRect(x, y + size * 0.3, size * width, size * height * 0.4);
      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(x + size * 0.1, y + size * 0.4, size * width * 0.8, size * height * 0.2);
      break;
  }
}

function renderCommunityBuildings(ctx, offsetX, offsetY, tileSize) {
  if (!HomeApp.communityBuildings) return;
  
  HomeApp.communityBuildings.forEach(building => {
    const px = offsetX + building.x * tileSize;
    const py = offsetY + building.y * tileSize;
    const width = building.width * tileSize;
    const height = building.height * tileSize;
    
    building.renderX = px;
    building.renderY = py;
    building.renderWidth = width;
    building.renderHeight = height;
    
    if (building.data.isPark) {
      drawCommunityPark(ctx, px, py, width, height, tileSize);
    } else if (building.type === 'LIGHTHOUSE') {
      drawLighthouse(ctx, px, py, width, height, tileSize);
    } else if (building.type === 'PLAYGROUND') {
      drawPlayground(ctx, px, py, width, height, tileSize);
    } else if (building.type === 'SPORTS_FIELD') {
      drawSportsField(ctx, px, py, width, height, tileSize);
    } else {
      drawCommunityBuilding(ctx, px, py, width, height, building.data, tileSize);
    }
  });
  
  if (HomeApp.customPlacedBuildings && HomeApp.customPlacedBuildings.length > 0) {
    HomeApp.customPlacedBuildings.forEach(building => {
      const px = offsetX + building.x * tileSize;
      const py = offsetY + building.y * tileSize;
      const width = building.width * tileSize;
      const height = building.height * tileSize;
      
      building.renderX = px;
      building.renderY = py;
      building.renderWidth = width;
      building.renderHeight = height;
      
      drawCommunityBuilding(ctx, px, py, width, height, {
        color: building.color || '#e94560',
        roofColor: building.roofColor || '#c73e54',
        name: building.name
      }, tileSize);
    });
  }
}

function drawCommunityBuilding(ctx, x, y, width, height, data, tileSize) {
  const wallColor = data.color || '#EFEBE9';
  const roofColor = data.roofColor || '#C62828';
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
  ctx.beginPath();
  ctx.ellipse(x + width / 2, y + height + 4, width * 0.4, height * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = roofColor;
  ctx.beginPath();
  ctx.moveTo(x + width * 0.5, y + height * 0.08);
  ctx.lineTo(x + width * 0.02, y + height * 0.35);
  ctx.lineTo(x + width * 0.98, y + height * 0.35);
  ctx.closePath();
  ctx.fill();
  
  ctx.fillStyle = adjustColor(roofColor, 30);
  ctx.beginPath();
  ctx.moveTo(x + width * 0.5, y + height * 0.08);
  ctx.lineTo(x + width * 0.02, y + height * 0.35);
  ctx.lineTo(x + width * 0.5, y + height * 0.35);
  ctx.closePath();
  ctx.fill();
  
  ctx.fillStyle = adjustColor(roofColor, -15);
  ctx.beginPath();
  ctx.moveTo(x + width * 0.5, y + height * 0.08);
  ctx.lineTo(x + width * 0.98, y + height * 0.35);
  ctx.lineTo(x + width * 0.5, y + height * 0.35);
  ctx.closePath();
  ctx.fill();
  
  ctx.fillStyle = adjustColor(roofColor, -30);
  for (let i = 0; i < 6; i++) {
    const lineY = y + height * (0.12 + i * 0.04);
    const offsetX = (Math.floor(Math.random() * 3) - 1);
    ctx.fillRect(x + width * 0.05 + offsetX, lineY, width * 0.9, 1);
  }
  
  ctx.fillStyle = wallColor;
  ctx.fillRect(x + width * 0.08, y + height * 0.35, width * 0.84, height * 0.57);
  
  ctx.fillStyle = adjustColor(wallColor, 15);
  ctx.fillRect(x + width * 0.08, y + height * 0.35, width * 0.06, height * 0.57);
  ctx.fillRect(x + width * 0.08, y + height * 0.35, width * 0.84, height * 0.05);
  
  ctx.fillStyle = adjustColor(wallColor, -15);
  ctx.fillRect(x + width * 0.86, y + height * 0.35, width * 0.06, height * 0.57);
  
  ctx.fillStyle = adjustColor(wallColor, -25);
  ctx.fillRect(x + width * 0.08, y + height * 0.87, width * 0.84, height * 0.05);
  
  ctx.fillStyle = adjustColor(wallColor, -50);
  ctx.fillRect(x + width * 0.08, y + height * 0.92, width * 0.84, height * 0.08);
  ctx.fillStyle = adjustColor(wallColor, -60);
  ctx.fillRect(x + width * 0.08, y + height * 0.92, width * 0.04, height * 0.08);
  
  const winWidth = width * 0.14;
  const winHeight = height * 0.18;
  const winX1 = x + width * 0.18;
  const winX2 = x + width * 0.68;
  const winY = y + height * 0.45;
  
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(winX1 - 2, winY - 2, winWidth + 4, winHeight + 4);
  ctx.fillRect(winX2 - 2, winY - 2, winWidth + 4, winHeight + 4);
  
  ctx.fillStyle = '#90CAF9';
  ctx.fillRect(winX1, winY, winWidth, winHeight);
  ctx.fillRect(winX2, winY, winWidth, winHeight);
  
  ctx.fillStyle = '#B3E5FC';
  ctx.fillRect(winX1, winY, winWidth * 0.5, winHeight * 0.5);
  ctx.fillRect(winX2, winY, winWidth * 0.5, winHeight * 0.5);
  
  ctx.fillStyle = '#42A5F5';
  ctx.fillRect(winX1 + winWidth / 2 - 1, winY, 2, winHeight);
  ctx.fillRect(winX1, winY + winHeight / 2 - 1, winWidth, 2);
  ctx.fillRect(winX2 + winWidth / 2 - 1, winY, 2, winHeight);
  ctx.fillRect(winX2, winY + winHeight / 2 - 1, winWidth, 2);
  
  ctx.fillStyle = '#E3F2FD';
  ctx.fillRect(winX1 + 2, winY + 2, 4, 4);
  ctx.fillRect(winX2 + 2, winY + 2, 4, 4);
  
  ctx.fillStyle = '#8D6E63';
  ctx.fillRect(winX1 - 2, winY + winHeight, winWidth + 4, 4);
  ctx.fillRect(winX2 - 2, winY + winHeight, winWidth + 4, 4);
  
  const doorWidth = width * 0.18;
  const doorHeight = height * 0.32;
  const doorX = x + width * 0.41;
  const doorY = y + height * 0.60;
  
  ctx.fillStyle = '#3E2723';
  ctx.fillRect(doorX - 2, doorY - 2, doorWidth + 4, doorHeight + 4);
  
  ctx.fillStyle = '#6D4C41';
  ctx.fillRect(doorX, doorY, doorWidth, doorHeight);
  
  ctx.fillStyle = adjustColor('#6D4C41', 15);
  ctx.fillRect(doorX, doorY, doorWidth * 0.2, doorHeight);
  
  ctx.fillStyle = adjustColor('#6D4C41', -15);
  ctx.fillRect(doorX + doorWidth * 0.8, doorY, doorWidth * 0.2, doorHeight);
  
  ctx.fillStyle = adjustColor('#6D4C41', -10);
  ctx.fillRect(doorX + doorWidth * 0.2, doorY + doorHeight * 0.15, doorWidth * 0.25, doorHeight * 0.35);
  ctx.fillRect(doorX + doorWidth * 0.55, doorY + doorHeight * 0.15, doorWidth * 0.25, doorHeight * 0.35);
  
  ctx.fillStyle = '#FDD835';
  ctx.fillRect(doorX + doorWidth * 0.75, doorY + doorHeight * 0.45, 4, 4);
  
  ctx.fillStyle = '#BDBDBD';
  ctx.fillRect(doorX - 4, doorY + doorHeight, doorWidth + 8, 4);
  
  ctx.fillStyle = '#eaeaea';
  ctx.font = `${Math.max(10, tileSize * 0.25)}px "Noto Sans TC"`;
  ctx.textAlign = 'center';
  ctx.fillText(data.name, x + width / 2, y + height + 15);
}

function drawCommunityPark(ctx, x, y, width, height, tileSize) {
  ctx.fillStyle = '#7CB342';
  ctx.fillRect(x, y, width, height);
  
  ctx.fillStyle = '#8BC34A';
  for (let i = 0; i < width; i += 20) {
    for (let j = 0; j < height; j += 20) {
      if ((i + j) % 40 === 0) {
        ctx.fillRect(x + i, y + j, 10, 10);
      }
    }
  }
  
  const treePositions = [
    [0.15, 0.25], [0.5, 0.2], [0.85, 0.3],
    [0.25, 0.7], [0.75, 0.75]
  ];
  
  treePositions.forEach(([tx, ty]) => {
    const treeX = x + width * tx;
    const treeY = y + height * ty;
    
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(treeX - width * 0.02, treeY + height * 0.1, width * 0.04, height * 0.15);
    
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.arc(treeX, treeY, width * 0.08, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#2E8B57';
    ctx.beginPath();
    ctx.arc(treeX - width * 0.05, treeY + height * 0.03, width * 0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(treeX + width * 0.05, treeY + height * 0.03, width * 0.06, 0, Math.PI * 2);
    ctx.fill();
  });
  
  ctx.fillStyle = '#4682B4';
  ctx.beginPath();
  ctx.ellipse(x + width * 0.5, y + height * 0.5, width * 0.15, height * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#87CEEB';
  ctx.beginPath();
  ctx.ellipse(x + width * 0.5, y + height * 0.48, width * 0.12, height * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(x + width * 0.2, y + height * 0.4, width * 0.15, height * 0.03);
  ctx.fillRect(x + width * 0.2, y + height * 0.43, width * 0.02, height * 0.08);
  ctx.fillRect(x + width * 0.33, y + height * 0.43, width * 0.02, height * 0.08);
  
  ctx.fillStyle = '#D2691E';
  ctx.fillRect(x + width * 0.2, y + height * 0.38, width * 0.15, height * 0.02);
  
  ctx.fillStyle = '#eaeaea';
  ctx.font = `${Math.max(10, tileSize * 0.25)}px "Noto Sans TC"`;
  ctx.textAlign = 'center';
  ctx.fillText('公園', x + width / 2, y + height + 15);
}

function drawLighthouse(ctx, x, y, width, height, tileSize) {
  ctx.fillStyle = '#E8E8E8';
  ctx.fillRect(x + width * 0.3, y + height * 0.25, width * 0.4, height * 0.75);
  
  ctx.fillStyle = '#C0C0C0';
  ctx.fillRect(x + width * 0.32, y + height * 0.25, width * 0.08, height * 0.75);
  
  ctx.fillStyle = '#A0A0A0';
  ctx.fillRect(x + width * 0.6, y + height * 0.25, width * 0.1, height * 0.75);
  
  for (let i = 0; i < 4; i++) {
    const stripeY = y + height * (0.25 + i * 0.18);
    const stripeH = height * 0.08;
    ctx.fillStyle = i % 2 === 0 ? '#CC0000' : '#F0F0F0';
    ctx.fillRect(x + width * 0.3, stripeY, width * 0.4, stripeH);
  }
  
  ctx.fillStyle = '#D8D8D8';
  ctx.fillRect(x + width * 0.35, y + height * 0.12, width * 0.3, height * 0.13);
  
  ctx.fillStyle = '#87CEEB';
  ctx.fillRect(x + width * 0.42, y + height * 0.15, width * 0.16, height * 0.06);
  ctx.strokeStyle = '#4682B4';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + width * 0.42, y + height * 0.15, width * 0.16, height * 0.06);
  
  ctx.fillStyle = '#CC0000';
  ctx.beginPath();
  ctx.arc(x + width * 0.5, y + height * 0.08, width * 0.15, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#FF0000';
  ctx.beginPath();
  ctx.arc(x + width * 0.5, y + height * 0.08, width * 0.1, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(x + width * 0.5, y + height * 0.08, width * 0.05, 0, Math.PI * 2);
  ctx.fill();
  
  const gradient = ctx.createRadialGradient(
    x + width * 0.5, y + height * 0.08, 0,
    x + width * 0.5, y + height * 0.08, width * 0.2
  );
  gradient.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
  gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x + width * 0.5, y + height * 0.08, width * 0.2, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#eaeaea';
  ctx.font = `${Math.max(10, tileSize * 0.25)}px "Noto Sans TC"`;
  ctx.textAlign = 'center';
  ctx.fillText('燈塔', x + width / 2, y + height + 15);
}

function drawPlayground(ctx, x, y, width, height, tileSize) {
  ctx.fillStyle = '#90EE90';
  ctx.fillRect(x, y, width, height);
  
  ctx.fillStyle = '#7CCD7C';
  for (let i = 0; i < width; i += 20) {
    for (let j = 0; j < height; j += 20) {
      if ((i + j) % 40 === 0) {
        ctx.fillRect(x + i, y + j, 10, 10);
      }
    }
  }
  
  ctx.fillStyle = '#FF69B4';
  ctx.fillRect(x + width * 0.1, y + height * 0.2, width * 0.35, height * 0.5);
  
  ctx.fillStyle = '#FF1493';
  ctx.fillRect(x + width * 0.1, y + height * 0.2, width * 0.35, height * 0.08);
  
  ctx.fillStyle = '#FFB6C1';
  ctx.fillRect(x + width * 0.15, y + height * 0.28, width * 0.25, height * 0.35);
  
  ctx.fillStyle = '#FFF0F5';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(x + width * (0.18 + i * 0.08), y + height * 0.32, width * 0.05, height * 0.25);
  }
  
  ctx.fillStyle = '#4169E1';
  ctx.fillRect(x + width * 0.55, y + height * 0.15, width * 0.08, height * 0.55);
  ctx.fillRect(x + width * 0.82, y + height * 0.15, width * 0.08, height * 0.55);
  ctx.fillRect(x + width * 0.55, y + height * 0.15, width * 0.35, height * 0.08);
  
  ctx.fillStyle = '#6495ED';
  ctx.fillRect(x + width * 0.55, y + height * 0.15, width * 0.08, height * 0.08);
  ctx.fillRect(x + width * 0.82, y + height * 0.15, width * 0.08, height * 0.08);
  
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(x + width * 0.65, y + height * 0.25, width * 0.02, height * 0.35);
  ctx.fillRect(x + width * 0.78, y + height * 0.25, width * 0.02, height * 0.35);
  
  ctx.fillStyle = '#D2691E';
  ctx.fillRect(x + width * 0.62, y + height * 0.55, width * 0.2, height * 0.08);
  
  ctx.fillStyle = '#eaeaea';
  ctx.font = `${Math.max(10, tileSize * 0.25)}px "Noto Sans TC"`;
  ctx.textAlign = 'center';
  ctx.fillText('遊樂場', x + width / 2, y + height + 15);
}

function drawSportsField(ctx, x, y, width, height, tileSize) {
  ctx.fillStyle = '#228B22';
  ctx.fillRect(x, y, width, height);
  
  ctx.fillStyle = '#2E8B57';
  for (let i = 0; i < width; i += 25) {
    for (let j = 0; j < height; j += 25) {
      if ((i + j) % 50 === 0) {
        ctx.fillRect(x + i, y + j, 12, 12);
      }
    }
  }
  
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 3;
  ctx.strokeRect(x + width * 0.05, y + height * 0.1, width * 0.9, height * 0.8);
  
  ctx.beginPath();
  ctx.moveTo(x + width * 0.5, y + height * 0.1);
  ctx.lineTo(x + width * 0.5, y + height * 0.9);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.arc(x + width * 0.5, y + height * 0.5, width * 0.12, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(x + width * 0.5, y + height * 0.5, width * 0.03, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(x + width * 0.02, y + height * 0.35, width * 0.03, height * 0.3);
  ctx.fillRect(x + width * 0.95, y + height * 0.35, width * 0.03, height * 0.3);
  
  ctx.fillStyle = '#eaeaea';
  ctx.font = `${Math.max(10, tileSize * 0.25)}px "Noto Sans TC"`;
  ctx.textAlign = 'center';
  ctx.fillText('運動場', x + width / 2, y + height + 15);
}

function renderCommunityEmptyLots(ctx, offsetX, offsetY, tileSize) {
  if (!HomeApp.communityEmptyLots) return;
  
  HomeApp.communityEmptyLots.forEach((lot, idx) => {
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

function renderCommunityProperties(ctx, offsetX, offsetY, tileSize) {
  const chars = JSON.parse(localStorage.getItem('sx_characters') || '[]');
  
  if (!HomeApp.properties) return;
  
  HomeApp.properties.forEach((property, idx) => {
    if (property.communityId !== HomeApp.currentCommunity) return;
    
    const lot = HomeApp.communityEmptyLots[idx];
    if (!lot) return;
    
    const char = chars[property.charIdx];
    const charName = char?.name || 'TA';
    
    const px = lot.renderX || (offsetX + lot.x * tileSize);
    const py = lot.renderY || (offsetY + lot.y * tileSize);
    const width = lot.renderWidth || (lot.width * tileSize);
    const height = lot.renderHeight || (lot.height * tileSize);
    
    const data = property.type === 'shared' ? COMMUNITY_BUILDINGS.SHARED_HOUSE : COMMUNITY_BUILDINGS.CHAR_HOUSE;
    
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

function handleCommunityMapClick(e) {
  if (HomeApp.isDragging) return;
  
  const rect = HomeApp.mapCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  const tileSize = COMMUNITY_MAP_CONFIG.tileSize * HomeApp.mapScale;
  const mapWidth = COMMUNITY_MAP_CONFIG.width * tileSize;
  const mapHeight = COMMUNITY_MAP_CONFIG.height * tileSize;
  const offsetX = (HomeApp.mapCanvas.width - mapWidth) / 2 + HomeApp.mapOffset.x;
  const offsetY = (HomeApp.mapCanvas.height - mapHeight) / 2 + HomeApp.mapOffset.y;
  
  const gridX = Math.floor((x - offsetX) / tileSize);
  const gridY = Math.floor((y - offsetY) / tileSize);
  
  if (HomeApp.mapEditMode) {
    if (HomeApp.selectedMapItem) {
      placeMapItem(gridX, gridY);
    } else {
      const clickedItem = findMapItemAt(gridX, gridY);
      if (clickedItem) {
        HomeApp.selectedMapItem = clickedItem;
        showMapContextMenu(e.clientX, e.clientY);
      }
    }
    return;
  }
  
  const playerHouse = HomeApp.communityBuildings.find(b => b.type === 'PLAYER_HOUSE');
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
    if (property.communityId === HomeApp.currentCommunity && property.renderX !== undefined) {
      if (x >= property.renderX && x <= property.renderX + property.renderWidth &&
          y >= property.renderY && y <= property.renderY + property.renderHeight) {
        enterProperty(HomeApp.properties.indexOf(property));
        return;
      }
    }
  }
  
  for (const lot of HomeApp.communityEmptyLots) {
    if (lot.renderX !== undefined) {
      if (x >= lot.renderX && x <= lot.renderX + lot.renderWidth &&
          y >= lot.renderY && y <= lot.renderY + lot.renderHeight) {
        openBuyModal(lot);
        return;
      }
    }
  }
  
  for (const building of HomeApp.communityBuildings) {
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

function handleCommunityMapDragMove(e) {
  if (HomeApp.dragStartX === null) return;
  
  const dx = e.clientX - HomeApp.dragStartX;
  const dy = e.clientY - HomeApp.dragStartY;
  
  if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
    HomeApp.isDragging = true;
  }
  
  HomeApp.mapOffset.x = HomeApp.lastMapOffsetX + dx;
  HomeApp.mapOffset.y = HomeApp.lastMapOffsetY + dy;
  
  renderCommunityMap();
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
  const p = Math.max(1, Math.floor(size / 16));
  
  switch (type) {
    case TILE_TYPES.GRASS:
      ctx.fillStyle = '#5ca830';
      ctx.fillRect(x, y, size, size);
      
      ctx.fillStyle = '#7ec850';
      for (let i = 0; i < 16; i++) {
        const gx = Math.floor(i / 4) * 4;
        const gy = (i % 4) * 4;
        if ((i + Math.floor(i / 4)) % 2 === 0) {
          ctx.fillRect(x + gx * p, y + gy * p, 4 * p, 4 * p);
        }
      }
      
      ctx.fillStyle = '#3d8020';
      for (let i = 0; i < 5; i++) {
        const gx = Math.floor(Math.random() * 14) + 1;
        const gy = Math.floor(Math.random() * 12) + 2;
        ctx.fillRect(x + gx * p, y + gy * p, 1 * p, 2 * p);
      }
      break;
      
    case TILE_TYPES.ROAD_H:
    case TILE_TYPES.ROAD_V:
      ctx.fillStyle = '#505050';
      ctx.fillRect(x, y, size, size);
      
      ctx.fillStyle = '#606060';
      if (type === TILE_TYPES.ROAD_H) {
        ctx.fillRect(x + 2 * p, y + 6 * p, 12 * p, 4 * p);
      } else {
        ctx.fillRect(x + 6 * p, y + 2 * p, 4 * p, 12 * p);
      }
      
      ctx.fillStyle = '#ffcc00';
      if (type === TILE_TYPES.ROAD_H) {
        ctx.fillRect(x + 3 * p, y + 7 * p, 2 * p, 2 * p);
        ctx.fillRect(x + 7 * p, y + 7 * p, 2 * p, 2 * p);
        ctx.fillRect(x + 11 * p, y + 7 * p, 2 * p, 2 * p);
      } else {
        ctx.fillRect(x + 7 * p, y + 3 * p, 2 * p, 2 * p);
        ctx.fillRect(x + 7 * p, y + 7 * p, 2 * p, 2 * p);
        ctx.fillRect(x + 7 * p, y + 11 * p, 2 * p, 2 * p);
      }
      break;
      
    case TILE_TYPES.ROAD_CROSS:
      ctx.fillStyle = '#505050';
      ctx.fillRect(x, y, size, size);
      
      ctx.fillStyle = '#606060';
      ctx.fillRect(x + 2 * p, y + 2 * p, 12 * p, 12 * p);
      
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(x + 7 * p, y + 3 * p, 2 * p, 2 * p);
      ctx.fillRect(x + 7 * p, y + 11 * p, 2 * p, 2 * p);
      ctx.fillRect(x + 3 * p, y + 7 * p, 2 * p, 2 * p);
      ctx.fillRect(x + 11 * p, y + 7 * p, 2 * p, 2 * p);
      break;
      
    case TILE_TYPES.SIDEWALK:
      ctx.fillStyle = '#a0a0a0';
      ctx.fillRect(x, y, size, size);
      
      ctx.fillStyle = '#909090';
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          if ((i + j) % 2 === 0) {
            ctx.fillRect(x + i * 4 * p, y + j * 4 * p, 4 * p, 4 * p);
          }
        }
      }
      
      ctx.fillStyle = '#787878';
      ctx.fillRect(x + p, y + p, 14 * p, 14 * p);
      break;
      
    case TILE_TYPES.CROSSWALK:
      ctx.fillStyle = '#505050';
      ctx.fillRect(x, y, size, size);
      
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(x + 2 * p, y + (2 + i * 3) * p, 12 * p, 2 * p);
      }
      break;
      
    default:
      ctx.fillStyle = '#5ca830';
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
  const p = size / 16;
  
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(x + 6 * p, y + 10 * p, 4 * p, 6 * p);
  
  ctx.fillStyle = '#228B22';
  ctx.fillRect(x + 2 * p, y + 2 * p, 12 * p, 8 * p);
  ctx.fillRect(x + 4 * p, y + 1 * p, 8 * p, 2 * p);
  ctx.fillRect(x + 5 * p, y, 6 * p, 1 * p);
  
  ctx.fillStyle = '#32CD32';
  ctx.fillRect(x + 3 * p, y + 3 * p, 3 * p, 3 * p);
  ctx.fillRect(x + 10 * p, y + 3 * p, 3 * p, 3 * p);
  ctx.fillRect(x + 6 * p, y + 2 * p, 4 * p, 2 * p);
  
  ctx.fillStyle = '#1a6b1a';
  ctx.fillRect(x + 5 * p, y + 7 * p, 6 * p, 2 * p);
  ctx.fillRect(x + 4 * p, y + 8 * p, 8 * p, 1 * p);
}

function drawLamp(ctx, x, y, size) {
  const p = size / 16;
  
  ctx.fillStyle = '#505050';
  ctx.fillRect(x + 7 * p, y + 5 * p, 2 * p, 10 * p);
  
  ctx.fillStyle = '#787878';
  ctx.fillRect(x + 5 * p, y + 4 * p, 6 * p, 2 * p);
  ctx.fillRect(x + 6 * p, y + 3 * p, 4 * p, 1 * p);
  
  ctx.fillStyle = '#ffeb3b';
  ctx.fillRect(x + 6 * p, y + 1 * p, 4 * p, 2 * p);
  
  ctx.fillStyle = '#fff8dc';
  ctx.fillRect(x + 7 * p, y + 1 * p, 2 * p, 1 * p);
}

function drawFlowerPatch(ctx, x, y, size) {
  const p = size / 16;
  const colors = ['#FF69B4', '#FFD700', '#FF6347', '#9370DB'];
  
  ctx.fillStyle = '#3a6b34';
  ctx.fillRect(x, y + 8 * p, 16 * p, 4 * p);
  
  for (let i = 0; i < 4; i++) {
    const fx = 2 + i * 3.5;
    ctx.fillStyle = colors[i];
    ctx.fillRect(x + fx * p, y + 4 * p, 3 * p, 4 * p);
    ctx.fillRect(x + (fx - 1) * p, y + 6 * p, 1 * p, 2 * p);
    ctx.fillRect(x + (fx + 3) * p, y + 6 * p, 1 * p, 2 * p);
    
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + (fx + 0.5) * p, y + 5 * p, 1 * p, 1 * p);
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
  const wallColor = data.color || '#EFEBE9';
  const roofColor = data.roofColor || '#C62828';
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
  ctx.beginPath();
  ctx.ellipse(x + width / 2, y + height + 4, width * 0.4, height * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = roofColor;
  ctx.beginPath();
  ctx.moveTo(x + width * 0.5, y + height * 0.05);
  ctx.lineTo(x, y + height * 0.32);
  ctx.lineTo(x + width, y + height * 0.32);
  ctx.closePath();
  ctx.fill();
  
  ctx.fillStyle = adjustColor(roofColor, 35);
  ctx.beginPath();
  ctx.moveTo(x + width * 0.5, y + height * 0.05);
  ctx.lineTo(x, y + height * 0.32);
  ctx.lineTo(x + width * 0.5, y + height * 0.32);
  ctx.closePath();
  ctx.fill();
  
  ctx.fillStyle = adjustColor(roofColor, -15);
  ctx.beginPath();
  ctx.moveTo(x + width * 0.5, y + height * 0.05);
  ctx.lineTo(x + width, y + height * 0.32);
  ctx.lineTo(x + width * 0.5, y + height * 0.32);
  ctx.closePath();
  ctx.fill();
  
  ctx.fillStyle = adjustColor(roofColor, -30);
  for (let i = 0; i < 5; i++) {
    const lineY = y + height * (0.1 + i * 0.04);
    const offsetX = (Math.floor(Math.random() * 3) - 1);
    ctx.fillRect(x + width * 0.05 + offsetX, lineY, width * 0.9, 1);
  }
  
  ctx.fillStyle = wallColor;
  ctx.fillRect(x + width * 0.08, y + height * 0.32, width * 0.84, height * 0.6);
  
  ctx.fillStyle = adjustColor(wallColor, 15);
  ctx.fillRect(x + width * 0.08, y + height * 0.32, width * 0.06, height * 0.6);
  ctx.fillRect(x + width * 0.08, y + height * 0.32, width * 0.84, height * 0.04);
  
  ctx.fillStyle = adjustColor(wallColor, -15);
  ctx.fillRect(x + width * 0.86, y + height * 0.32, width * 0.06, height * 0.6);
  
  ctx.fillStyle = adjustColor(wallColor, -25);
  ctx.fillRect(x + width * 0.08, y + height * 0.88, width * 0.84, height * 0.04);
  
  ctx.fillStyle = adjustColor(wallColor, -50);
  ctx.fillRect(x + width * 0.08, y + height * 0.92, width * 0.84, height * 0.08);
  ctx.fillStyle = adjustColor(wallColor, -60);
  ctx.fillRect(x + width * 0.08, y + height * 0.92, width * 0.04, height * 0.08);
  
  const winWidth = width * 0.12;
  const winHeight = height * 0.15;
  const winX1 = x + width * 0.18;
  const winX2 = x + width * 0.7;
  const winY = y + height * 0.42;
  
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(winX1 - 2, winY - 2, winWidth + 4, winHeight + 4);
  ctx.fillRect(winX2 - 2, winY - 2, winWidth + 4, winHeight + 4);
  
  ctx.fillStyle = '#90CAF9';
  ctx.fillRect(winX1, winY, winWidth, winHeight);
  ctx.fillRect(winX2, winY, winWidth, winHeight);
  
  ctx.fillStyle = '#B3E5FC';
  ctx.fillRect(winX1, winY, winWidth * 0.5, winHeight * 0.5);
  ctx.fillRect(winX2, winY, winWidth * 0.5, winHeight * 0.5);
  
  ctx.fillStyle = '#42A5F5';
  ctx.fillRect(winX1 + winWidth / 2 - 1, winY, 2, winHeight);
  ctx.fillRect(winX1, winY + winHeight / 2 - 1, winWidth, 2);
  ctx.fillRect(winX2 + winWidth / 2 - 1, winY, 2, winHeight);
  ctx.fillRect(winX2, winY + winHeight / 2 - 1, winWidth, 2);
  
  ctx.fillStyle = '#E3F2FD';
  ctx.fillRect(winX1 + 2, winY + 2, 3, 3);
  ctx.fillRect(winX2 + 2, winY + 2, 3, 3);
  
  ctx.fillStyle = '#8D6E63';
  ctx.fillRect(winX1 - 2, winY + winHeight, winWidth + 4, 3);
  ctx.fillRect(winX2 - 2, winY + winHeight, winWidth + 4, 3);
  
  const doorWidth = width * 0.16;
  const doorHeight = height * 0.28;
  const doorX = x + width * 0.42;
  const doorY = y + height * 0.64;
  
  ctx.fillStyle = '#3E2723';
  ctx.fillRect(doorX - 2, doorY - 2, doorWidth + 4, doorHeight + 4);
  
  ctx.fillStyle = '#6D4C41';
  ctx.fillRect(doorX, doorY, doorWidth, doorHeight);
  
  ctx.fillStyle = adjustColor('#6D4C41', 15);
  ctx.fillRect(doorX, doorY, doorWidth * 0.2, doorHeight);
  
  ctx.fillStyle = adjustColor('#6D4C41', -15);
  ctx.fillRect(doorX + doorWidth * 0.8, doorY, doorWidth * 0.2, doorHeight);
  
  ctx.fillStyle = adjustColor('#6D4C41', -10);
  ctx.fillRect(doorX + doorWidth * 0.2, doorY + doorHeight * 0.15, doorWidth * 0.25, doorHeight * 0.35);
  ctx.fillRect(doorX + doorWidth * 0.55, doorY + doorHeight * 0.15, doorWidth * 0.25, doorHeight * 0.35);
  
  ctx.fillStyle = '#FDD835';
  ctx.fillRect(doorX + doorWidth * 0.75, doorY + doorHeight * 0.45, 3, 3);
  
  ctx.fillStyle = '#BDBDBD';
  ctx.fillRect(doorX - 3, doorY + doorHeight, doorWidth + 6, 3);
  
  ctx.fillStyle = '#eaeaea';
  ctx.font = `${Math.max(10, tileSize * 0.25)}px "Noto Sans TC"`;
  ctx.textAlign = 'center';
  ctx.fillText(data.name, x + width / 2, y + height + 15);
}

function drawPark(ctx, x, y, width, height, tileSize) {
  ctx.fillStyle = '#7CB342';
  ctx.fillRect(x, y, width, height);
  
  ctx.fillStyle = '#8BC34A';
  for (let i = 0; i < width; i += 20) {
    for (let j = 0; j < height; j += 20) {
      if ((i + j) % 40 === 0) {
        ctx.fillRect(x + i, y + j, 10, 10);
      }
    }
  }
  
  const treePositions = [
    [0.15, 0.3], [0.5, 0.25], [0.85, 0.35],
    [0.3, 0.7], [0.7, 0.75]
  ];
  
  treePositions.forEach(([tx, ty]) => {
    const treeX = x + width * tx;
    const treeY = y + height * ty;
    
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(treeX - width * 0.015, treeY + height * 0.08, width * 0.03, height * 0.12);
    
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.arc(treeX, treeY, width * 0.06, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#2E8B57';
    ctx.beginPath();
    ctx.arc(treeX - width * 0.04, treeY + height * 0.02, width * 0.045, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(treeX + width * 0.04, treeY + height * 0.02, width * 0.045, 0, Math.PI * 2);
    ctx.fill();
  });
  
  ctx.fillStyle = '#4682B4';
  ctx.beginPath();
  ctx.ellipse(x + width * 0.5, y + height * 0.5, width * 0.12, height * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#87CEEB';
  ctx.beginPath();
  ctx.ellipse(x + width * 0.5, y + height * 0.48, width * 0.09, height * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(x + width * 0.15, y + height * 0.35, width * 0.12, height * 0.025);
  ctx.fillRect(x + width * 0.15, y + height * 0.375, width * 0.015, height * 0.06);
  ctx.fillRect(x + width * 0.255, y + height * 0.375, width * 0.015, height * 0.06);
  
  ctx.fillStyle = '#D2691E';
  ctx.fillRect(x + width * 0.15, y + height * 0.335, width * 0.12, height * 0.015);
  
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
  try {
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
    
    const roomView = document.getElementById('room-view');
    const mapView = document.getElementById('map-view');
    
    if (roomView) roomView.classList.add('hidden');
    if (mapView) mapView.classList.remove('hidden');
    
    if (HomeApp.currentCommunity) {
      renderCommunityMap();
    } else {
      renderMap();
    }
    updateBalance();
    
    if (window.lucide) lucide.createIcons();
  } catch (e) {
    console.error('exitRoom error:', e);
    const roomView = document.getElementById('room-view');
    const mapView = document.getElementById('map-view');
    if (roomView) roomView.classList.add('hidden');
    if (mapView) mapView.classList.remove('hidden');
  }
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
    
    const wallStyle = WALL_STYLES.find(s => s.id === HomeApp.wallStyle) || { pattern: 'paint', baseColor: HomeApp.wallColor };
    const floorStyle = FLOOR_STYLES.find(s => s.id === HomeApp.floorStyle) || { pattern: 'solid', baseColor: HomeApp.floorColor };
    
    drawWallPattern(ctx, offsetX, offsetY, HomeApp.roomWidth * gridSize, HomeApp.roomHeight * gridSize, wallStyle);
    drawFloorPattern(ctx, offsetX, offsetY + 2 * gridSize, HomeApp.roomWidth * gridSize, (HomeApp.roomHeight - 2) * gridSize, floorStyle);
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
  renderStylePickers();
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
  if (HomeApp.currentCommunity) {
    renderCommunityMap();
  } else {
    renderMap();
  }
}

function zoomOut() {
  HomeApp.mapScale = Math.max(0.5, HomeApp.mapScale - 0.25);
  if (HomeApp.currentCommunity) {
    renderCommunityMap();
  } else {
    renderMap();
  }
}

function centerMap() {
  HomeApp.mapOffset = { x: 0, y: 0 };
  HomeApp.mapScale = 1;
  if (HomeApp.currentCommunity) {
    renderCommunityMap();
  } else {
    renderMap();
  }
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
  try {
    const roomView = document.getElementById('room-view');
    const mapView = document.getElementById('map-view');
    const worldNavView = document.getElementById('world-nav-view');
    
    if (roomView && !roomView.classList.contains('hidden')) {
      exitRoom();
      return;
    }
    
    if (mapView && !mapView.classList.contains('hidden')) {
      mapView.classList.add('hidden');
      if (worldNavView) worldNavView.classList.remove('hidden');
      HomeApp.currentCommunity = null;
      updateBalanceNav();
      return;
    }
    
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'closeApp' }, '*');
    }
  } catch (e) {
    console.error('handleBack error:', e);
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'closeApp' }, '*');
    }
  }
}

let currentShopItem = null;
let currentShopCategory = 'all';

function openFurnitureShop() {
  document.getElementById('furniture-shop-modal').classList.remove('hidden');
  renderShopGrid();
  updateShopBalance();
  renderEventBanner();
  bindShopEvents();
  if (window.lucide) lucide.createIcons();
}

function closeFurnitureShop() {
  document.getElementById('furniture-shop-modal').classList.add('hidden');
}

function renderShopGrid() {
  const grid = document.getElementById('shop-grid');
  if (!grid) return;
  
  const ownedFurniture = getOwnedFurniture();
  const activeEvent = getActiveEvents()[0];
  
  const filtered = currentShopCategory === 'all' 
    ? FURNITURE_SHOP_CATALOG 
    : FURNITURE_SHOP_CATALOG.filter(f => f.category === currentShopCategory);
  
  grid.innerHTML = filtered.map(item => {
    const isOwned = ownedFurniture.includes(item.id);
    const discountedPrice = getDiscountedPrice(item, activeEvent);
    const hasDiscount = discountedPrice < item.price;
    const rarityClass = `rarity-${item.rarity}`;
    
    return `
      <div class="shop-item ${rarityClass} ${isOwned ? 'owned' : ''}" data-item-id="${item.id}">
        <canvas width="48" height="48"></canvas>
        <span class="shop-item-name">${item.name}</span>
        <span class="shop-item-price ${hasDiscount ? 'discounted' : ''}">NT$${discountedPrice}</span>
        ${hasDiscount ? `<span class="shop-item-original-price">NT$${item.price}</span>` : ''}
        ${isOwned ? '<span class="shop-item-owned">已擁有</span>' : ''}
      </div>
    `;
  }).join('');
  
  grid.querySelectorAll('.shop-item').forEach(el => {
    const itemId = el.dataset.itemId;
    const canvas = el.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    generateShopFurniturePixels(itemId, ctx, 48);
    
    el.addEventListener('click', () => showItemDetail(itemId));
  });
}

function renderEventBanner() {
  const banner = document.getElementById('shop-event-banner');
  const activeEvents = getActiveEvents();
  
  if (activeEvents.length === 0 && !isWeekendSale()) {
    banner.classList.add('hidden');
    return;
  }
  
  let bannerText = '';
  if (isWeekendSale()) {
    bannerText = '週末特賣！全場 8 折';
  }
  if (activeEvents.length > 0) {
    bannerText = activeEvents[0].banner;
  }
  
  banner.innerHTML = `
    <span class="shop-event-text">${bannerText}</span>
    <span class="shop-event-action">查看 <i data-lucide="chevron-right"></i></span>
  `;
  banner.classList.remove('hidden');
  banner.onclick = () => showEventDetails(activeEvents[0]);
  
  if (window.lucide) lucide.createIcons();
}

function showEventDetails(event) {
  if (event) {
    alert(`${event.name}\n${event.startDate.toLocaleDateString()} - ${event.endDate.toLocaleDateString()}\n\n折扣: ${Math.round(event.discount * 100)}%`);
  }
}

function bindShopEvents() {
  document.querySelectorAll('.shop-category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.shop-category-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentShopCategory = btn.dataset.category;
      renderShopGrid();
    });
  });
}

function updateShopBalance() {
  const el = document.getElementById('shop-balance');
  if (el) el.textContent = `NT$ ${formatCurrency(getBalance())}`;
}

function showItemDetail(itemId) {
  const item = FURNITURE_SHOP_CATALOG.find(f => f.id === itemId);
  if (!item) return;
  
  currentShopItem = item;
  
  const canvas = document.getElementById('item-preview-canvas');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, 96, 96);
  generateShopFurniturePixels(itemId, ctx, 96);
  
  document.getElementById('item-name').textContent = item.name;
  document.getElementById('item-description').textContent = item.description;
  document.getElementById('item-size').textContent = `尺寸: ${item.width}x${item.height}`;
  
  const rarityEl = document.getElementById('item-rarity');
  rarityEl.textContent = RARITY_CONFIG[item.rarity].name;
  rarityEl.className = `item-rarity ${item.rarity}`;
  
  const activeEvent = getActiveEvents()[0];
  const discountedPrice = getDiscountedPrice(item, activeEvent);
  const hasDiscount = discountedPrice < item.price;
  
  document.getElementById('item-price').textContent = `NT$${discountedPrice}`;
  document.getElementById('item-original-price').textContent = hasDiscount ? `NT$${item.price}` : '';
  
  const ownedFurniture = getOwnedFurniture();
  const buyBtn = document.getElementById('buy-item-btn');
  if (ownedFurniture.includes(item.id)) {
    buyBtn.textContent = '已擁有';
    buyBtn.disabled = true;
  } else {
    buyBtn.textContent = '購買';
    buyBtn.disabled = false;
  }
  
  document.getElementById('item-detail-modal').classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeItemDetail() {
  document.getElementById('item-detail-modal').classList.add('hidden');
  currentShopItem = null;
}

function buyShopItem() {
  if (!currentShopItem) return;
  
  const ownedFurniture = getOwnedFurniture();
  if (ownedFurniture.includes(currentShopItem.id)) {
    alert('您已擁有此家具！');
    return;
  }
  
  const activeEvent = getActiveEvents()[0];
  const price = getDiscountedPrice(currentShopItem, activeEvent);
  const balance = getBalance();
  
  if (balance < price) {
    alert('餘額不足！請到 kakaopay 充值');
    return;
  }
  
  closeItemDetail();
  openPaymentPinModal(price, currentShopItem.name);
}

function openPaymentPinModal(amount, itemName) {
  document.getElementById('payment-amount-display').textContent = `NT$ ${formatCurrency(amount)}`;
  document.getElementById('payment-details-display').innerHTML = `
    <div>商品: ${itemName}</div>
    <div>金額: NT$${formatCurrency(amount)}</div>
  `;
  
  const pinInputs = document.querySelectorAll('.pin-input');
  pinInputs.forEach(input => input.value = '');
  pinInputs[0]?.focus();
  
  document.getElementById('payment-pin-modal').classList.remove('hidden');
}

function closePaymentPinModal() {
  document.getElementById('payment-pin-modal').classList.add('hidden');
}

function confirmPaymentPin() {
  const pinInputs = document.querySelectorAll('.pin-input');
  const pin = Array.from(pinInputs).map(i => i.value).join('');
  
  if (pin.length !== 4) {
    alert('請輸入 4 位數密碼');
    return;
  }
  
  if (!currentShopItem) return;
  
  const activeEvent = getActiveEvents()[0];
  const price = getDiscountedPrice(currentShopItem, activeEvent);
  
  processShopPayment(price, currentShopItem.id, currentShopItem.name);
}

function processShopPayment(amount, itemId, itemName) {
  const ledgerRaw = localStorage.getItem('sxiphone.kakaopay.ledger.v1');
  let ledger;
  try {
    ledger = JSON.parse(ledgerRaw || '{}');
  } catch {
    ledger = {};
  }
  
  const transactions = Array.isArray(ledger?.transactions) ? ledger.transactions : [];
  
  transactions.unshift({
    id: `tx_${Date.now()}`,
    type: 'expense',
    category: '家具',
    amount: amount,
    note: `購買家具：${itemName}`,
    date: getTodayYMD(),
    createdAt: Date.now(),
    source: 'home-shop'
  });
  
  localStorage.setItem('sxiphone.kakaopay.ledger.v1', JSON.stringify({ 
    budget: ledger?.budget || 30000, 
    transactions 
  }));
  
  window.parent?.postMessage({
    type: 'KAKAOPAY_FURNITURE_PURCHASE',
    amount: amount,
    itemName: itemName,
    source: 'home-shop'
  }, '*');
  
  addOwnedFurniture(itemId);
  
  closePaymentPinModal();
  alert(`購買成功！${itemName} 已加入您的家具庫`);
  
  renderShopGrid();
  updateShopBalance();
  updateBalance();
}

function getTodayYMD() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getOwnedFurniture() {
  try {
    const data = JSON.parse(localStorage.getItem('sx_home_data') || '{}');
    return data.ownedFurniture || [];
  } catch {
    return [];
  }
}

function addOwnedFurniture(itemId) {
  try {
    const data = JSON.parse(localStorage.getItem('sx_home_data') || '{}');
    if (!data.ownedFurniture) data.ownedFurniture = [];
    if (!data.ownedFurniture.includes(itemId)) {
      data.ownedFurniture.push(itemId);
    }
    localStorage.setItem('sx_home_data', JSON.stringify(data));
    
    const shopItem = FURNITURE_SHOP_CATALOG.find(f => f.id === itemId);
    if (shopItem) {
      FURNITURE_CATALOG.push({
        id: shopItem.id,
        name: shopItem.name,
        category: shopItem.category,
        width: shopItem.width,
        height: shopItem.height,
        pixels: getShopFurniturePixels(shopItem.id),
        interactive: shopItem.interactive
      });
    }
    
    renderFurnitureCatalog();
  } catch (e) {
    console.error('Failed to add owned furniture:', e);
  }
}

function getOwnedFloorStyles() {
  try {
    const data = JSON.parse(localStorage.getItem('sx_home_data') || '{}');
    return data.ownedFloorStyles || ['wood_light'];
  } catch {
    return ['wood_light'];
  }
}

function getOwnedWallStyles() {
  try {
    const data = JSON.parse(localStorage.getItem('sx_home_data') || '{}');
    return data.ownedWallStyles || ['paint_white'];
  } catch {
    return ['paint_white'];
  }
}

function renderStylePickers() {
  const floorPicker = document.getElementById('floor-style-picker');
  const wallPicker = document.getElementById('wall-style-picker');
  
  if (floorPicker) {
    const ownedFloorStyles = getOwnedFloorStyles();
    const currentFloorStyle = HomeApp.floorStyle || 'wood_light';
    
    floorPicker.innerHTML = FLOOR_STYLES.map(style => {
      const isOwned = ownedFloorStyles.includes(style.id);
      const isActive = currentFloorStyle === style.id;
      return `
        <div class="style-option ${isActive ? 'active' : ''} ${!isOwned ? 'locked' : ''}" 
             data-style-id="${style.id}" data-pattern="floor">
          <canvas width="40" height="40"></canvas>
          ${!isOwned && style.price > 0 ? `<span class="style-option-price">NT$${style.price}</span>` : ''}
        </div>
      `;
    }).join('');
    
    floorPicker.querySelectorAll('.style-option').forEach(el => {
      const canvas = el.querySelector('canvas');
      const ctx = canvas.getContext('2d');
      const styleId = el.dataset.styleId;
      const style = FLOOR_STYLES.find(s => s.id === styleId);
      if (style) {
        ctx.fillStyle = style.baseColor;
        ctx.fillRect(0, 0, 40, 40);
        ctx.fillStyle = style.accentColor;
        ctx.fillRect(5, 5, 30, 30);
      }
      
      el.addEventListener('click', () => selectFloorStyle(styleId));
    });
  }
  
  if (wallPicker) {
    const ownedWallStyles = getOwnedWallStyles();
    const currentWallStyle = HomeApp.wallStyle || 'paint_white';
    
    wallPicker.innerHTML = WALL_STYLES.map(style => {
      const isOwned = ownedWallStyles.includes(style.id);
      const isActive = currentWallStyle === style.id;
      return `
        <div class="style-option ${isActive ? 'active' : ''} ${!isOwned ? 'locked' : ''}" 
             data-style-id="${style.id}" data-pattern="wall">
          <canvas width="40" height="40"></canvas>
          ${!isOwned && style.price > 0 ? `<span class="style-option-price">NT$${style.price}</span>` : ''}
        </div>
      `;
    }).join('');
    
    wallPicker.querySelectorAll('.style-option').forEach(el => {
      const canvas = el.querySelector('canvas');
      const ctx = canvas.getContext('2d');
      const styleId = el.dataset.styleId;
      const style = WALL_STYLES.find(s => s.id === styleId);
      if (style) {
        ctx.fillStyle = style.baseColor;
        ctx.fillRect(0, 0, 40, 40);
        if (style.accentColor) {
          ctx.fillStyle = style.accentColor;
          ctx.fillRect(5, 5, 30, 30);
        }
      }
      
      el.addEventListener('click', () => selectWallStyle(styleId));
    });
  }
}

function selectFloorStyle(styleId) {
  const style = FLOOR_STYLES.find(s => s.id === styleId);
  if (!style) return;
  
  const ownedFloorStyles = getOwnedFloorStyles();
  
  if (!ownedFloorStyles.includes(styleId)) {
    if (style.price > 0) {
      const balance = getBalance();
      if (balance < style.price) {
        alert('餘額不足！');
        return;
      }
      if (confirm(`購買「${style.name}」需要 NT$${style.price}，確定購買嗎？`)) {
        purchaseFloorStyle(style);
      }
      return;
    }
  }
  
  HomeApp.floorStyle = styleId;
  HomeApp.floorColor = style.baseColor;
  
  document.querySelectorAll('#floor-style-picker .style-option').forEach(el => {
    el.classList.toggle('active', el.dataset.styleId === styleId);
  });
  
  renderRoom();
  saveData();
}

function selectWallStyle(styleId) {
  const style = WALL_STYLES.find(s => s.id === styleId);
  if (!style) return;
  
  const ownedWallStyles = getOwnedWallStyles();
  
  if (!ownedWallStyles.includes(styleId)) {
    if (style.price > 0) {
      const balance = getBalance();
      if (balance < style.price) {
        alert('餘額不足！');
        return;
      }
      if (confirm(`購買「${style.name}」需要 NT$${style.price}，確定購買嗎？`)) {
        purchaseWallStyle(style);
      }
      return;
    }
  }
  
  HomeApp.wallStyle = styleId;
  HomeApp.wallColor = style.baseColor;
  
  document.querySelectorAll('#wall-style-picker .style-option').forEach(el => {
    el.classList.toggle('active', el.dataset.styleId === styleId);
  });
  
  renderRoom();
  saveData();
}

function purchaseFloorStyle(style) {
  const ledgerRaw = localStorage.getItem('sxiphone.kakaopay.ledger.v1');
  let ledger;
  try {
    ledger = JSON.parse(ledgerRaw || '{}');
  } catch {
    ledger = {};
  }
  
  const transactions = Array.isArray(ledger?.transactions) ? ledger.transactions : [];
  
  transactions.unshift({
    id: `tx_${Date.now()}`,
    type: 'expense',
    category: '裝潢',
    amount: style.price,
    note: `購買地板樣式：${style.name}`,
    date: getTodayYMD(),
    createdAt: Date.now(),
    source: 'home-shop'
  });
  
  localStorage.setItem('sxiphone.kakaopay.ledger.v1', JSON.stringify({ 
    budget: ledger?.budget || 30000, 
    transactions 
  }));
  
  const data = JSON.parse(localStorage.getItem('sx_home_data') || '{}');
  if (!data.ownedFloorStyles) data.ownedFloorStyles = ['wood_light'];
  if (!data.ownedFloorStyles.includes(style.id)) {
    data.ownedFloorStyles.push(style.id);
  }
  data.floorStyle = style.id;
  localStorage.setItem('sx_home_data', JSON.stringify(data));
  
  HomeApp.floorStyle = style.id;
  HomeApp.floorColor = style.baseColor;
  
  renderStylePickers();
  updateBalance();
  renderRoom();
  
  alert(`購買成功！已套用「${style.name}」`);
}

function purchaseWallStyle(style) {
  const ledgerRaw = localStorage.getItem('sxiphone.kakaopay.ledger.v1');
  let ledger;
  try {
    ledger = JSON.parse(ledgerRaw || '{}');
  } catch {
    ledger = {};
  }
  
  const transactions = Array.isArray(ledger?.transactions) ? ledger.transactions : [];
  
  transactions.unshift({
    id: `tx_${Date.now()}`,
    type: 'expense',
    category: '裝潢',
    amount: style.price,
    note: `購買牆壁樣式：${style.name}`,
    date: getTodayYMD(),
    createdAt: Date.now(),
    source: 'home-shop'
  });
  
  localStorage.setItem('sxiphone.kakaopay.ledger.v1', JSON.stringify({ 
    budget: ledger?.budget || 30000, 
    transactions 
  }));
  
  const data = JSON.parse(localStorage.getItem('sx_home_data') || '{}');
  if (!data.ownedWallStyles) data.ownedWallStyles = ['paint_white'];
  if (!data.ownedWallStyles.includes(style.id)) {
    data.ownedWallStyles.push(style.id);
  }
  data.wallStyle = style.id;
  localStorage.setItem('sx_home_data', JSON.stringify(data));
  
  HomeApp.wallStyle = style.id;
  HomeApp.wallColor = style.baseColor;
  
  renderStylePickers();
  updateBalance();
  renderRoom();
  
  alert(`購買成功！已套用「${style.name}」`);
}

function handleInteractiveFurniture(item) {
  const catalogItem = FURNITURE_CATALOG.find(f => f.id === item.id) || 
                      FURNITURE_SHOP_CATALOG.find(f => f.id === item.id);
  
  if (!catalogItem || !catalogItem.interactive) return false;
  
  const menu = document.getElementById('interactive-menu-modal');
  const optionsContainer = document.getElementById('interactive-menu-options');
  
  document.getElementById('interactive-item-name').textContent = catalogItem.name;
  
  let options = [];
  
  switch(catalogItem.id) {
    case 'wall_clock':
      const now = new Date();
      options = [
        { label: `現在時間: ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`, action: () => {} },
        { label: '報時', action: () => alert(`現在時間是 ${now.getHours()} 點 ${now.getMinutes()} 分`) }
      ];
      break;
    case 'ceiling_light':
    case 'floor_lamp':
    case 'wall_sconce':
    case 'desk_lamp_luxury':
      options = [
        { label: item.isOn ? '關燈' : '開燈', action: () => toggleLight(item) },
        { label: '調整亮度', action: () => adjustBrightness(item) }
      ];
      break;
    case 'chandelier':
    case 'chandelier_crystal':
      options = [
        { label: item.isOn ? '關燈' : '開燈', action: () => toggleLight(item) },
        { label: '閃爍模式', action: () => setLightMode(item, 'blink') }
      ];
      break;
    case 'neon_sign':
    case 'neon_sign_custom':
      options = [
        { label: item.isOn ? '關閉' : '開啟', action: () => toggleLight(item) },
        { label: '變換顏色', action: () => changeNeonColor(item) }
      ];
      break;
    case 'string_lights':
      options = [
        { label: item.isOn ? '關閉' : '開啟', action: () => toggleLight(item) },
        { label: '閃爍模式', action: () => setLightMode(item, 'twinkle') }
      ];
      break;
    case 'floor_fountain':
      options = [
        { label: item.isOn ? '關閉' : '開啟', action: () => toggleFountain(item) },
        { label: '水流模式', action: () => setFountainMode(item) }
      ];
      break;
    case 'wall_aquarium':
      options = [
        { label: '餵魚', action: () => feedFish(item) },
        { label: '新增魚', action: () => addFish(item) }
      ];
      break;
    case 'tv':
      options = [
        { label: '開啟', action: () => alert('電視已開啟') },
        { label: '切換頻道', action: () => alert('切換頻道...') }
      ];
      break;
    default:
      options = [
        { label: '互動', action: () => alert('與家具互動') }
      ];
  }
  
  options.push({ label: '取消', action: () => closeInteractiveMenu() });
  
  optionsContainer.innerHTML = options.map((opt, idx) => `
    <button class="interactive-menu-btn" data-option-idx="${idx}">
      ${opt.label}
    </button>
  `).join('');
  
  optionsContainer.querySelectorAll('.interactive-menu-btn').forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      options[idx].action();
      closeInteractiveMenu();
    });
  });
  
  menu.classList.remove('hidden');
  return true;
}

function closeInteractiveMenu() {
  document.getElementById('interactive-menu-modal').classList.add('hidden');
}

function toggleLight(item) {
  item.isOn = !item.isOn;
  renderRoom();
  saveData();
}

function adjustBrightness(item) {
  const brightness = prompt('請輸入亮度 (1-100):', '50');
  if (brightness) {
    item.brightness = Math.max(1, Math.min(100, parseInt(brightness)));
    renderRoom();
    saveData();
  }
}

function setLightMode(item, mode) {
  item.lightMode = mode;
  renderRoom();
  saveData();
}

function changeNeonColor(item) {
  const colors = ['#ff00ff', '#00ffff', '#ff0000', '#00ff00', '#ffff00'];
  const currentIdx = colors.indexOf(item.neonColor || '#ff00ff');
  item.neonColor = colors[(currentIdx + 1) % colors.length];
  renderRoom();
  saveData();
}

function toggleFountain(item) {
  item.isOn = !item.isOn;
  renderRoom();
  saveData();
}

function setFountainMode(item) {
  const modes = ['gentle', 'strong', 'pulse'];
  const currentIdx = modes.indexOf(item.fountainMode || 'gentle');
  item.fountainMode = modes[(currentIdx + 1) % modes.length];
  renderRoom();
  saveData();
}

function feedFish(item) {
  alert('魚兒們吃飽了！');
}

function addFish(item) {
  if (!item.fishCount) item.fishCount = 2;
  if (item.fishCount < 5) {
    item.fishCount++;
    renderRoom();
    saveData();
    alert('新增了一條魚！');
  } else {
    alert('魚缸已滿！');
  }
}

function initPinInputs() {
  const pinInputs = document.querySelectorAll('.pin-input');
  pinInputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      if (e.target.value && index < pinInputs.length - 1) {
        pinInputs[index + 1].focus();
      }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && index > 0) {
        pinInputs[index - 1].focus();
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initPinInputs();
});

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
window.selectCommunity = selectCommunity;
window.openFurnitureShop = openFurnitureShop;
window.closeFurnitureShop = closeFurnitureShop;
window.showItemDetail = showItemDetail;
window.closeItemDetail = closeItemDetail;
window.buyShopItem = buyShopItem;
window.closePaymentPinModal = closePaymentPinModal;
window.confirmPaymentPin = confirmPaymentPin;
window.closeInteractiveMenu = closeInteractiveMenu;

const EXPAND_PRICES = {
  width: 5000,
  height: 5000,
  both: 8000
};

const MAP_EDIT_CATALOG = {
  terrain: [
    { id: 'grass', name: '草地', width: 1, height: 1, price: 0, type: 'terrain', terrainType: 'grass' },
    { id: 'dirt', name: '泥土', width: 1, height: 1, price: 10, type: 'terrain', terrainType: 'dirt' },
    { id: 'stone', name: '石板', width: 1, height: 1, price: 30, type: 'terrain', terrainType: 'stone' },
    { id: 'sand', name: '沙地', width: 1, height: 1, price: 20, type: 'terrain', terrainType: 'sand' },
    { id: 'water', name: '水域', width: 1, height: 1, price: 100, type: 'terrain', terrainType: 'water' },
    { id: 'paved', name: '鋪路', width: 1, height: 1, price: 50, type: 'terrain', terrainType: 'paved' }
  ],
  buildings: [
    { id: 'small_house', name: '小屋', width: 2, height: 2, price: 10000, color: '#e94560', roofColor: '#c73e54' },
    { id: 'garden_shed', name: '花園小屋', width: 2, height: 2, price: 5000, color: '#8B4513', roofColor: '#654321' },
    { id: 'gazebo', name: '涼亭', width: 2, height: 2, price: 8000, color: '#DEB887', roofColor: '#D2691E' },
    { id: 'fountain', name: '噴泉', width: 2, height: 2, price: 12000, color: '#4169E1', roofColor: '#87CEEB' },
    { id: 'cafe', name: '咖啡廳', width: 2, height: 2, price: 15000, color: '#8B4513', roofColor: '#654321' },
    { id: 'shop', name: '商店', width: 2, height: 2, price: 12000, color: '#2ecc71', roofColor: '#27ae60' },
    { id: 'restaurant', name: '餐廳', width: 3, height: 2, price: 20000, color: '#ff6b6b', roofColor: '#d63031' },
    { id: 'library', name: '圖書館', width: 3, height: 3, price: 25000, color: '#3F51B5', roofColor: '#303F9F' }
  ],
  decorations: [
    { id: 'tree_oak', name: '橡樹', width: 1, height: 1, price: 500, type: 'tree' },
    { id: 'tree_pine', name: '松樹', width: 1, height: 1, price: 500, type: 'tree' },
    { id: 'tree_cherry', name: '櫻花樹', width: 1, height: 1, price: 800, type: 'tree', treeType: 'cherry' },
    { id: 'flower_bed', name: '花圃', width: 2, height: 1, price: 300, type: 'flower' },
    { id: 'flower_tulip', name: '鬱金香', width: 1, height: 1, price: 200, type: 'flower', flowerType: 'tulip' },
    { id: 'flower_rose', name: '玫瑰花', width: 1, height: 1, price: 250, type: 'flower', flowerType: 'rose' },
    { id: 'bench', name: '長椅', width: 2, height: 1, price: 400, type: 'bench' },
    { id: 'lamp_post', name: '路燈', width: 1, height: 1, price: 600, type: 'lamp' },
    { id: 'mailbox', name: '信箱', width: 1, height: 1, price: 200, type: 'mailbox' },
    { id: 'rock', name: '岩石', width: 1, height: 1, price: 100, type: 'rock' },
    { id: 'pond', name: '小池塘', width: 2, height: 2, price: 500, type: 'pond' },
    { id: 'fence_h', name: '柵欄', width: 1, height: 1, price: 50, type: 'fence_h' },
    { id: 'fence_v', name: '柵欄', width: 1, height: 1, price: 50, type: 'fence_v' }
  ],
  roads: [
    { id: 'road_h', name: '道路', width: 1, height: 1, price: 100, type: 'road_h' },
    { id: 'road_v', name: '道路', width: 1, height: 1, price: 100, type: 'road_v' },
    { id: 'road_cross', name: '十字路口', width: 1, height: 1, price: 150, type: 'road_cross' },
    { id: 'road_corner_tl', name: '轉角', width: 1, height: 1, price: 120, type: 'road_corner_tl' },
    { id: 'road_corner_tr', name: '轉角', width: 1, height: 1, price: 120, type: 'road_corner_tr' },
    { id: 'road_corner_bl', name: '轉角', width: 1, height: 1, price: 120, type: 'road_corner_bl' },
    { id: 'road_corner_br', name: '轉角', width: 1, height: 1, price: 120, type: 'road_corner_br' },
    { id: 'sidewalk', name: '人行道', width: 1, height: 1, price: 50, type: 'sidewalk' },
    { id: 'bridge_h', name: '橋樑', width: 2, height: 1, price: 500, type: 'bridge_h' },
    { id: 'bridge_v', name: '橋樑', width: 1, height: 2, price: 500, type: 'bridge_v' }
  ]
};

function getCurrentRoomSize() {
  const expansion = HomeApp.roomExpansions?.user?.[HomeApp.currentSubRoom] || { width: 0, height: 0 };
  return {
    width: HomeApp.baseRoomWidth + expansion.width,
    height: HomeApp.baseRoomHeight + expansion.height
  };
}

function updateRoomSize() {
  const size = getCurrentRoomSize();
  HomeApp.roomWidth = size.width;
  HomeApp.roomHeight = size.height;
}

function openRoomExpand() {
  const modal = document.getElementById('room-expand-modal');
  if (!modal) return;
  
  const currentSize = getCurrentRoomSize();
  document.getElementById('current-room-size').textContent = `${currentSize.width} x ${currentSize.height}`;
  document.getElementById('expanded-room-size').textContent = `${currentSize.width + 2} x ${currentSize.height + 2}`;
  
  const expansion = HomeApp.roomExpansions?.user?.[HomeApp.currentSubRoom] || { width: 0, height: 0 };
  const multiplier = 1 + expansion.width * 0.1 + expansion.height * 0.1;
  
  document.getElementById('expand-width-price').textContent = Math.floor(EXPAND_PRICES.width * multiplier);
  document.getElementById('expand-height-price').textContent = Math.floor(EXPAND_PRICES.height * multiplier);
  document.getElementById('expand-both-price').textContent = Math.floor(EXPAND_PRICES.both * multiplier);
  
  modal.classList.remove('hidden');
}

function closeRoomExpand() {
  const modal = document.getElementById('room-expand-modal');
  if (modal) modal.classList.add('hidden');
}

function expandRoom(type) {
  const expansion = HomeApp.roomExpansions?.user?.[HomeApp.currentSubRoom] || { width: 0, height: 0 };
  const multiplier = 1 + expansion.width * 0.1 + expansion.height * 0.1;
  
  let price = 0;
  if (type === 'width') {
    price = Math.floor(EXPAND_PRICES.width * multiplier);
  } else if (type === 'height') {
    price = Math.floor(EXPAND_PRICES.height * multiplier);
  } else if (type === 'both') {
    price = Math.floor(EXPAND_PRICES.both * multiplier);
  }
  
  const balance = getBalance();
  if (balance < price) {
    alert('金幣不足！');
    return;
  }
  
  if (!confirm(`確定要花費 ${price} 金幣擴建房間嗎？`)) return;
  
  updateBalance(-price);
  
  if (!HomeApp.roomExpansions) {
    HomeApp.roomExpansions = { user: {} };
  }
  if (!HomeApp.roomExpansions.user) {
    HomeApp.roomExpansions.user = {};
  }
  if (!HomeApp.roomExpansions.user[HomeApp.currentSubRoom]) {
    HomeApp.roomExpansions.user[HomeApp.currentSubRoom] = { width: 0, height: 0 };
  }
  
  if (type === 'width') {
    HomeApp.roomExpansions.user[HomeApp.currentSubRoom].width += 2;
  } else if (type === 'height') {
    HomeApp.roomExpansions.user[HomeApp.currentSubRoom].height += 2;
  } else if (type === 'both') {
    HomeApp.roomExpansions.user[HomeApp.currentSubRoom].width += 2;
    HomeApp.roomExpansions.user[HomeApp.currentSubRoom].height += 2;
  }
  
  updateRoomSize();
  resizeRoomCanvas();
  saveData();
  closeRoomExpand();
  
  alert('房間擴建成功！');
}

function toggleMapEditMode() {
  HomeApp.mapEditMode = !HomeApp.mapEditMode;
  
  const hint = document.getElementById('map-edit-hint');
  const panel = document.getElementById('map-edit-panel');
  const btn = document.getElementById('map-edit-btn');
  
  if (HomeApp.mapEditMode) {
    if (hint) hint.classList.remove('hidden');
    if (panel) panel.classList.add('open');
    if (btn) btn.style.background = 'rgba(233, 69, 96, 0.4)';
    renderMapEditCatalog('buildings');
  } else {
    if (hint) hint.classList.add('hidden');
    if (panel) panel.classList.remove('open');
    if (btn) btn.style.background = '';
  }
}

function exitMapEditMode() {
  HomeApp.mapEditMode = false;
  HomeApp.selectedMapItem = null;
  
  const hint = document.getElementById('map-edit-hint');
  const panel = document.getElementById('map-edit-panel');
  const btn = document.getElementById('map-edit-btn');
  
  if (hint) hint.classList.add('hidden');
  if (panel) panel.classList.remove('open');
  if (btn) btn.style.background = '';
}

function toggleMapEditPanel() {
  const panel = document.getElementById('map-edit-panel');
  if (panel) {
    panel.classList.toggle('open');
  }
}

function selectMapEditCategory(category) {
  document.querySelectorAll('.map-edit-categories .category-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.category === category) {
      btn.classList.add('active');
    }
  });
  renderMapEditCatalog(category);
}

function renderMapEditCatalog(category) {
  const grid = document.getElementById('map-edit-grid');
  if (!grid) return;
  
  grid.innerHTML = '';
  const items = MAP_EDIT_CATALOG[category] || [];
  
  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'map-edit-item';
    div.onclick = () => selectMapEditItem(item);
    
    const canvas = document.createElement('canvas');
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    
    drawMapEditItemPreview(ctx, item, 48);
    
    div.appendChild(canvas);
    
    const name = document.createElement('span');
    name.textContent = item.name;
    div.appendChild(name);
    
    const price = document.createElement('span');
    price.style.color = '#ffd700';
    price.style.fontSize = '10px';
    price.textContent = `$${item.price}`;
    div.appendChild(price);
    
    grid.appendChild(div);
  });
}

function drawMapEditItemPreview(ctx, item, size) {
  const s = size / 16;
  
  if (item.type === 'terrain') {
    switch (item.terrainType) {
      case 'grass':
        ctx.fillStyle = '#7CB342';
        ctx.fillRect(0, 0, 16 * s, 16 * s);
        ctx.fillStyle = '#8BC34A';
        ctx.fillRect(2 * s, 2 * s, 4 * s, 3 * s);
        ctx.fillRect(10 * s, 8 * s, 3 * s, 4 * s);
        break;
      case 'dirt':
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(0, 0, 16 * s, 16 * s);
        ctx.fillStyle = '#7B6345';
        ctx.fillRect(3 * s, 3 * s, 5 * s, 4 * s);
        ctx.fillRect(10 * s, 9 * s, 4 * s, 5 * s);
        break;
      case 'stone':
        ctx.fillStyle = '#808080';
        ctx.fillRect(0, 0, 16 * s, 16 * s);
        ctx.fillStyle = '#909090';
        ctx.fillRect(2 * s, 2 * s, 5 * s, 5 * s);
        ctx.fillRect(9 * s, 9 * s, 5 * s, 5 * s);
        break;
      case 'sand':
        ctx.fillStyle = '#f4d03f';
        ctx.fillRect(0, 0, 16 * s, 16 * s);
        ctx.fillStyle = '#e6c229';
        ctx.fillRect(3 * s, 4 * s, 6 * s, 4 * s);
        break;
      case 'water':
        ctx.fillStyle = '#4682B4';
        ctx.fillRect(0, 0, 16 * s, 16 * s);
        ctx.fillStyle = '#5B92D4';
        ctx.fillRect(2 * s, 2 * s, 4 * s, 3 * s);
        ctx.fillStyle = '#3B72A4';
        ctx.fillRect(10 * s, 10 * s, 4 * s, 4 * s);
        break;
      case 'paved':
        ctx.fillStyle = '#5a5a5a';
        ctx.fillRect(0, 0, 16 * s, 16 * s);
        ctx.fillStyle = '#6a6a6a';
        ctx.fillRect(1 * s, 1 * s, 6 * s, 6 * s);
        ctx.fillRect(9 * s, 9 * s, 6 * s, 6 * s);
        break;
    }
  } else if (item.type === 'tree') {
    ctx.fillStyle = item.treeType === 'cherry' ? '#FFB7C5' : '#228B22';
    ctx.beginPath();
    ctx.arc(8 * s, 6 * s, 5 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(7 * s, 10 * s, 2 * s, 4 * s);
  } else if (item.type === 'flower') {
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, 10 * s, 16 * s, 6 * s);
    const flowerColor = item.flowerType === 'tulip' ? '#FF6347' : item.flowerType === 'rose' ? '#DC143C' : '#FF69B4';
    ctx.fillStyle = flowerColor;
    ctx.beginPath();
    ctx.arc(4 * s, 8 * s, 3 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(12 * s, 8 * s, 3 * s, 0, Math.PI * 2);
    ctx.fill();
  } else if (item.type === 'bench') {
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, 6 * s, 16 * s, 4 * s);
    ctx.fillRect(2 * s, 10 * s, 2 * s, 4 * s);
    ctx.fillRect(12 * s, 10 * s, 2 * s, 4 * s);
  } else if (item.type === 'lamp') {
    ctx.fillStyle = '#333';
    ctx.fillRect(7 * s, 4 * s, 2 * s, 10 * s);
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(8 * s, 4 * s, 3 * s, 0, Math.PI * 2);
    ctx.fill();
  } else if (item.type === 'mailbox') {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(5 * s, 6 * s, 6 * s, 8 * s);
    ctx.fillStyle = '#e94560';
    ctx.fillRect(6 * s, 8 * s, 4 * s, 3 * s);
  } else if (item.type === 'rock') {
    ctx.fillStyle = '#696969';
    ctx.beginPath();
    ctx.arc(8 * s, 10 * s, 5 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#808080';
    ctx.beginPath();
    ctx.arc(6 * s, 8 * s, 3 * s, 0, Math.PI * 2);
    ctx.fill();
  } else if (item.type === 'pond') {
    ctx.fillStyle = '#4682B4';
    ctx.beginPath();
    ctx.ellipse(8 * s, 8 * s, 7 * s, 5 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#87CEEB';
    ctx.beginPath();
    ctx.ellipse(8 * s, 7 * s, 4 * s, 2 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (item.type === 'fence_h') {
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, 6 * s, 16 * s, 4 * s);
    ctx.fillRect(2 * s, 4 * s, 2 * s, 8 * s);
    ctx.fillRect(12 * s, 4 * s, 2 * s, 8 * s);
  } else if (item.type === 'fence_v') {
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(6 * s, 0, 4 * s, 16 * s);
    ctx.fillRect(4 * s, 2 * s, 8 * s, 2 * s);
    ctx.fillRect(4 * s, 12 * s, 8 * s, 2 * s);
  } else if (item.type && item.type.startsWith('road')) {
    ctx.fillStyle = '#555';
    ctx.fillRect(0, 0, 16 * s, 16 * s);
    if (item.type === 'road_h' || item.type === 'road_cross') {
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(6 * s, 7 * s, 4 * s, 2 * s);
    }
    if (item.type === 'road_v' || item.type === 'road_cross') {
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(7 * s, 6 * s, 2 * s, 4 * s);
    }
    if (item.type === 'road_corner_tl') {
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(7 * s, 7 * s, 2 * s, 2 * s);
      ctx.fillRect(0, 7 * s, 7 * s, 2 * s);
      ctx.fillRect(7 * s, 0, 2 * s, 7 * s);
    }
    if (item.type === 'road_corner_tr') {
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(7 * s, 7 * s, 2 * s, 2 * s);
      ctx.fillRect(9 * s, 7 * s, 7 * s, 2 * s);
      ctx.fillRect(7 * s, 0, 2 * s, 7 * s);
    }
    if (item.type === 'road_corner_bl') {
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(7 * s, 7 * s, 2 * s, 2 * s);
      ctx.fillRect(0, 7 * s, 7 * s, 2 * s);
      ctx.fillRect(7 * s, 9 * s, 2 * s, 7 * s);
    }
    if (item.type === 'road_corner_br') {
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(7 * s, 7 * s, 2 * s, 2 * s);
      ctx.fillRect(9 * s, 7 * s, 7 * s, 2 * s);
      ctx.fillRect(7 * s, 9 * s, 2 * s, 7 * s);
    }
  } else if (item.type === 'sidewalk') {
    ctx.fillStyle = '#999';
    ctx.fillRect(0, 0, 16 * s, 16 * s);
    ctx.fillStyle = '#aaa';
    ctx.fillRect(2 * s, 2 * s, 5 * s, 5 * s);
    ctx.fillRect(9 * s, 9 * s, 5 * s, 5 * s);
  } else if (item.type === 'bridge_h') {
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, 4 * s, 16 * s, 8 * s);
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(2 * s, 4 * s, 2 * s, 8 * s);
    ctx.fillRect(12 * s, 4 * s, 2 * s, 8 * s);
  } else if (item.type === 'bridge_v') {
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(4 * s, 0, 8 * s, 16 * s);
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(4 * s, 2 * s, 8 * s, 2 * s);
    ctx.fillRect(4 * s, 12 * s, 8 * s, 2 * s);
  } else {
    ctx.fillStyle = item.roofColor || '#8B4513';
    ctx.beginPath();
    ctx.moveTo(0, 6 * s);
    ctx.lineTo(8 * s, 0);
    ctx.lineTo(16 * s, 6 * s);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = item.color || '#e94560';
    ctx.fillRect(0, 6 * s, 16 * s, 10 * s);
    
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(3 * s, 8 * s, 4 * s, 4 * s);
    ctx.fillRect(9 * s, 8 * s, 4 * s, 4 * s);
    
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(6 * s, 11 * s, 4 * s, 5 * s);
  }
}

function selectMapEditItem(item) {
  HomeApp.selectedMapItem = item;
  
  document.querySelectorAll('.map-edit-item').forEach(el => {
    el.classList.remove('selected');
  });
  event.currentTarget.classList.add('selected');
}

function placeMapItem(gridX, gridY) {
  if (!HomeApp.selectedMapItem) return;
  
  const item = HomeApp.selectedMapItem;
  const balance = getBalance();
  
  if (balance < item.price) {
    alert('金幣不足！');
    return;
  }
  
  const communityId = HomeApp.currentCommunity;
  if (!communityId) return;
  
  if (item.type === 'terrain') {
    if (!HomeApp.customTerrainMap) {
      HomeApp.customTerrainMap = {};
    }
    if (!HomeApp.customTerrainMap[communityId]) {
      HomeApp.customTerrainMap[communityId] = {};
    }
    
    const brushSize = HomeApp.brushSize || 1;
    for (let dy = 0; dy < brushSize; dy++) {
      for (let dx = 0; dx < brushSize; dx++) {
        const tx = gridX + dx;
        const ty = gridY + dy;
        if (tx >= 0 && tx < COMMUNITY_MAP_CONFIG.width && ty >= 0 && ty < COMMUNITY_MAP_CONFIG.height) {
          HomeApp.customTerrainMap[communityId][`${tx},${ty}`] = item.terrainType;
        }
      }
    }
  } else {
    const newItem = {
      ...item,
      x: gridX,
      y: gridY,
      id: `${item.id}_${Date.now()}`
    };
    
    if (!HomeApp.customPlacedBuildings) {
      HomeApp.customPlacedBuildings = [];
    }
    
    if (item.id.includes('house') || item.id.includes('shed') || item.id.includes('gazebo') || 
        item.id === 'fountain' || item.id.includes('cafe') || item.id.includes('shop') || 
        item.id.includes('restaurant') || item.id.includes('library')) {
      HomeApp.customPlacedBuildings.push(newItem);
    } else {
      if (!HomeApp.customPlacedDecorations) {
        HomeApp.customPlacedDecorations = [];
      }
      HomeApp.customPlacedDecorations.push(newItem);
    }
  }
  
  updateBalance(-item.price);
  renderCommunityMap();
  saveData();
}

function moveMapItem() {
  const menu = document.getElementById('map-item-context-menu');
  if (!menu || !HomeApp.selectedMapItem) return;
  
  HomeApp.draggedMapItem = HomeApp.selectedMapItem;
  hideMapContextMenu();
}

function deleteMapItem() {
  if (!HomeApp.selectedMapItem) return;
  
  const idx = HomeApp.customPlacedBuildings?.findIndex(b => b.id === HomeApp.selectedMapItem.id);
  if (idx !== undefined && idx >= 0) {
    HomeApp.customPlacedBuildings.splice(idx, 1);
  } else {
    const decIdx = HomeApp.customPlacedDecorations?.findIndex(d => d.id === HomeApp.selectedMapItem.id);
    if (decIdx !== undefined && decIdx >= 0) {
      HomeApp.customPlacedDecorations.splice(decIdx, 1);
    }
  }
  
  hideMapContextMenu();
  renderCommunityMap();
  saveData();
}

function hideMapContextMenu() {
  const menu = document.getElementById('map-item-context-menu');
  if (menu) menu.classList.add('hidden');
  HomeApp.selectedMapItem = null;
}

function handleMapEditClick(e) {
  if (!HomeApp.mapEditMode) return;
  
  const rect = HomeApp.mapCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  const tileSize = COMMUNITY_MAP_CONFIG.tileSize * HomeApp.mapScale;
  const gridX = Math.floor((x - HomeApp.mapOffset.x) / tileSize);
  const gridY = Math.floor((y - HomeApp.mapOffset.y) / tileSize);
  
  if (HomeApp.selectedMapItem) {
    placeMapItem(gridX, gridY);
  } else {
    const clickedItem = findMapItemAt(gridX, gridY);
    if (clickedItem) {
      HomeApp.selectedMapItem = clickedItem;
      showMapContextMenu(e.clientX, e.clientY);
    }
  }
}

function findMapItemAt(gridX, gridY) {
  const allItems = [...(HomeApp.customPlacedBuildings || []), ...(HomeApp.customPlacedDecorations || [])];
  return allItems.find(item => {
    return gridX >= item.x && gridX < item.x + item.width &&
           gridY >= item.y && gridY < item.y + item.height;
  });
}

function showMapContextMenu(x, y) {
  const menu = document.getElementById('map-item-context-menu');
  if (!menu) return;
  
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
  menu.classList.remove('hidden');
}

function setBrushSize(size) {
  HomeApp.brushSize = size;
  
  document.querySelectorAll('.brush-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.currentTarget.classList.add('active');
}

function toggleGridDisplay() {
  HomeApp.showGrid = !HomeApp.showGrid;
  
  const checkbox = document.getElementById('show-grid-checkbox');
  if (checkbox) {
    checkbox.checked = HomeApp.showGrid;
  }
  
  const btn = document.getElementById('grid-toggle-btn');
  if (btn) {
    if (HomeApp.showGrid) {
      btn.style.background = 'rgba(233, 69, 96, 0.3)';
    } else {
      btn.style.background = '';
    }
  }
  
  renderCommunityMap();
}

function clearCustomTerrain() {
  const communityId = HomeApp.currentCommunity;
  if (!communityId) return;
  
  if (confirm('確定要清除所有自定義地形嗎？')) {
    if (HomeApp.customTerrainMap && HomeApp.customTerrainMap[communityId]) {
      HomeApp.customTerrainMap[communityId] = {};
    }
    renderCommunityMap();
    saveData();
  }
}

function clearAllCustomItems() {
  if (confirm('確定要清除所有自定義物品嗎？')) {
    HomeApp.customPlacedBuildings = [];
    HomeApp.customPlacedDecorations = [];
    const communityId = HomeApp.currentCommunity;
    if (communityId && HomeApp.customTerrainMap) {
      HomeApp.customTerrainMap[communityId] = {};
    }
    renderCommunityMap();
    saveData();
  }
}

window.openRoomExpand = openRoomExpand;
window.closeRoomExpand = closeRoomExpand;
window.expandRoom = expandRoom;
window.toggleMapEditMode = toggleMapEditMode;
window.exitMapEditMode = exitMapEditMode;
window.toggleMapEditPanel = toggleMapEditPanel;
window.selectMapEditCategory = selectMapEditCategory;
window.moveMapItem = moveMapItem;
window.deleteMapItem = deleteMapItem;
window.hideMapContextMenu = hideMapContextMenu;
window.setBrushSize = setBrushSize;
window.toggleGridDisplay = toggleGridDisplay;
window.clearCustomTerrain = clearCustomTerrain;
window.clearAllCustomItems = clearAllCustomItems;

document.addEventListener('DOMContentLoaded', init);
