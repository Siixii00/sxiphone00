const TILE_SIZE = 32;
const MAP_WIDTH = 20;
const MAP_HEIGHT = 15;

const TILE_TYPES = {
  EMPTY: 0,
  FLOOR: 1,
  WALL: 2,
  MACHINE: 3,
  STAIR_UP: 4,
  STAIR_DOWN: 5,
  NPC: 6,
  DECORATION: 7,
  SERVICE_DESK: 8,
  REST_AREA: 9
};

const FLOOR_CONFIGS = {
  '1F': {
    name: '大廳',
    color: '#1a1a2e',
    accentColor: '#fbbf24',
    description: '入口大廳，可兌換金幣'
  },
  '2F': {
    name: '休閒遊戲區',
    color: '#0d2818',
    accentColor: '#22c55e',
    description: '經典街機遊戲'
  },
  '3F': {
    name: '抽卡模擬區',
    color: '#1a0a2e',
    accentColor: '#a855f7',
    description: '各大遊戲抽卡模擬'
  },
  'B1': {
    name: '限制級遊戲區',
    color: '#2a0a0a',
    accentColor: '#ef4444',
    description: '僅限18歲以上',
    restricted: true
  }
};

const MACHINES = {
  snake: { name: '貪吃蛇', type: 'game', cost: 10, icon: 'fa-worm', color: '#22c55e', floor: '2F' },
  slot: { name: '拉霸機', type: 'game', cost: 5, icon: 'fa-coins', color: '#f59e0b', floor: '2F' },
  tetris: { name: '俄羅斯方塊', type: 'game', cost: 10, icon: 'fa-cube', color: '#3b82f6', floor: '2F' },
  whackamole: { name: '打地鼠', type: 'game', cost: 8, icon: 'fa-hand-fist', color: '#8b5cf6', floor: '2F' },
  memory: { name: '記憶翻牌', type: 'game', cost: 5, icon: 'fa-layer-group', color: '#ec4899', floor: '2F' },
  pinball: { name: '彈珠台', type: 'game', cost: 15, icon: 'fa-circle-dot', color: '#06b6d4', floor: '2F' },
  pachinko: { name: '柏青哥', type: 'game', cost: 20, icon: 'fa-star', color: '#fbbf24', floor: '2F' },
  pachislot: { name: '柏青嫂', type: 'game', cost: 25, icon: 'fa-diamond', color: '#ec4899', floor: '2F' },
  dart: { name: '射飛鏢', type: 'game', cost: 10, icon: 'fa-crosshairs', color: '#ef4444', floor: '2F' },
  
  // 一般抽卡遊戲
  gacha_genshin: { name: '原神祈願', type: 'gacha', cost: 0, icon: 'fa-gem', color: '#fbbf24', floor: '3F', gameKey: 'genshin' },
  gacha_starrail: { name: '星穹鐵道', type: 'gacha', cost: 0, icon: 'fa-gem', color: '#a855f7', floor: '3F', gameKey: 'starrail' },
  gacha_zzz: { name: '絕區零', type: 'gacha', cost: 0, icon: 'fa-gem', color: '#22d3ee', floor: '3F', gameKey: 'zzz' },
  gacha_fgo: { name: 'FGO召喚', type: 'gacha', cost: 0, icon: 'fa-gem', color: '#f43f5e', floor: '3F', gameKey: 'fgo' },
  gacha_wuwa: { name: '鳴潮', type: 'gacha', cost: 0, icon: 'fa-gem', color: '#14b8a6', floor: '3F', gameKey: 'wuwa' },
  gacha_es: { name: '偶像夢幻祭', type: 'gacha', cost: 0, icon: 'fa-gem', color: '#f472b6', floor: '3F', gameKey: 'es' },
  gacha_pjsk: { name: '世界計畫', type: 'gacha', cost: 0, icon: 'fa-gem', color: '#60a5fa', floor: '3F', gameKey: 'pjsk' },
  
  // 乙女遊戲區
  gacha_lightandnight: { name: '光與夜之戀', type: 'gacha', cost: 0, icon: 'fa-heart', color: '#ec4899', floor: '3F', gameKey: 'lightandnight', isOtome: true },
  gacha_lovedeepspace: { name: '戀與深空', type: 'gacha', cost: 0, icon: 'fa-heart', color: '#8b5cf6', floor: '3F', gameKey: 'lovedeepspace', isOtome: true },
  gacha_loveproducer: { name: '戀與製作人', type: 'gacha', cost: 0, icon: 'fa-heart', color: '#f472b6', floor: '3F', gameKey: 'loveproducer', isOtome: true },
  gacha_worldoutside: { name: '世界之外', type: 'gacha', cost: 0, icon: 'fa-heart', color: '#06b6d4', floor: '3F', gameKey: 'worldoutside', isOtome: true },
  gacha_shiningname: { name: '以閃亮之名', type: 'gacha', cost: 0, icon: 'fa-heart', color: '#fbbf24', floor: '3F', gameKey: 'shiningname', isOtome: true },
  gacha_hell: { name: '地獄有甚麼不好', type: 'gacha', cost: 0, icon: 'fa-heart', color: '#ef4444', floor: '3F', gameKey: 'hell', isOtome: true },
  
  yellowcard: { name: '黃牌', type: 'adult', cost: 20, icon: 'fa-cards', color: '#ef4444', floor: 'B1', restricted: true },
  truthdare: { name: '真心話大冒險', type: 'adult', cost: 15, icon: 'fa-comments', color: '#f97316', floor: 'B1', restricted: true },
  roulette: { name: '命運輪盤', type: 'adult', cost: 25, icon: 'fa-circle-notch', color: '#a855f7', floor: 'B1', restricted: true },
  kinggame: { name: '國王遊戲', type: 'adult', cost: 20, icon: 'fa-crown', color: '#eab308', floor: 'B1', restricted: true },
  oldmaid: { name: '抽鬼牌', type: 'adult', cost: 10, icon: 'fa-ghost', color: '#6366f1', floor: 'B1', restricted: true },
  drunkpoker: { name: '酒鬼撲克', type: 'adult', cost: 30, icon: 'fa-wine-glass', color: '#ec4899', floor: 'B1', restricted: true }
};

const MAP_DATA = {
  '1F': generateFloor1F(),
  '2F': generateFloor2F(),
  '3F': generateFloor3F(),
  'B1': generateFloorB1()
};

function generateFloor1F() {
  const map = [];
  for (let y = 0; y < MAP_HEIGHT; y++) {
    map[y] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1) {
        map[y][x] = { type: TILE_TYPES.WALL };
      } else {
        map[y][x] = { type: TILE_TYPES.FLOOR };
      }
    }
  }
  
  map[2][2] = { type: TILE_TYPES.SERVICE_DESK, name: '服務台', interaction: 'exchange' };
  map[2][3] = { type: TILE_TYPES.DECORATION, name: '植物' };
  map[2][16] = { type: TILE_TYPES.DECORATION, name: '植物' };
  map[2][17] = { type: TILE_TYPES.DECORATION, name: '植物' };
  
  map[7][4] = { type: TILE_TYPES.REST_AREA, name: '休息區' };
  map[7][5] = { type: TILE_TYPES.REST_AREA, name: '休息區' };
  map[8][4] = { type: TILE_TYPES.REST_AREA, name: '休息區' };
  map[8][5] = { type: TILE_TYPES.REST_AREA, name: '休息區' };
  
  map[7][14] = { type: TILE_TYPES.REST_AREA, name: '休息區' };
  map[7][15] = { type: TILE_TYPES.REST_AREA, name: '休息區' };
  map[8][14] = { type: TILE_TYPES.REST_AREA, name: '休息區' };
  map[8][15] = { type: TILE_TYPES.REST_AREA, name: '休息區' };
  
  map[MAP_HEIGHT - 2][9] = { type: TILE_TYPES.STAIR_UP, targetFloor: '2F', targetPos: { x: 9, y: 1 } };
  map[MAP_HEIGHT - 2][10] = { type: TILE_TYPES.STAIR_UP, targetFloor: '2F', targetPos: { x: 10, y: 1 } };
  
  map[MAP_HEIGHT - 2][16] = { type: TILE_TYPES.STAIR_DOWN, targetFloor: 'B1', targetPos: { x: 9, y: 1 }, restricted: true };
  map[MAP_HEIGHT - 2][17] = { type: TILE_TYPES.STAIR_DOWN, targetFloor: 'B1', targetPos: { x: 10, y: 1 }, restricted: true };
  
  map[MAP_HEIGHT - 3][15] = { type: TILE_TYPES.NPC, name: '守門人', dialogue: 'adult_gate', isAdultGate: true };
  map[MAP_HEIGHT - 3][16] = { type: TILE_TYPES.DECORATION, name: '警告標誌', warning: true };
  map[MAP_HEIGHT - 3][17] = { type: TILE_TYPES.DECORATION, name: '警告標誌', warning: true };
  
  map[5][9] = { type: TILE_TYPES.NPC, name: '導覽員', dialogue: '歡迎來到街機廳！上樓可以玩各種遊戲喔！' };
  
  map[1][9] = { type: TILE_TYPES.EMPTY };
  map[1][10] = { type: TILE_TYPES.EMPTY };
  
  return map;
}

function generateFloor2F() {
  const map = [];
  for (let y = 0; y < MAP_HEIGHT; y++) {
    map[y] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1) {
        map[y][x] = { type: TILE_TYPES.WALL };
      } else {
        map[y][x] = { type: TILE_TYPES.FLOOR };
      }
    }
  }
  
  map[1][9] = { type: TILE_TYPES.STAIR_DOWN, targetFloor: '1F', targetPos: { x: 9, y: MAP_HEIGHT - 3 } };
  map[1][10] = { type: TILE_TYPES.STAIR_DOWN, targetFloor: '1F', targetPos: { x: 10, y: MAP_HEIGHT - 3 } };
  
  map[MAP_HEIGHT - 2][9] = { type: TILE_TYPES.STAIR_UP, targetFloor: '3F', targetPos: { x: 9, y: 1 } };
  map[MAP_HEIGHT - 2][10] = { type: TILE_TYPES.STAIR_UP, targetFloor: '3F', targetPos: { x: 10, y: 1 } };
  
  map[3][3] = { type: TILE_TYPES.MACHINE, machineId: 'snake' };
  map[3][4] = { type: TILE_TYPES.MACHINE, machineId: 'snake' };
  map[3][7] = { type: TILE_TYPES.MACHINE, machineId: 'snake' };
  map[3][8] = { type: TILE_TYPES.MACHINE, machineId: 'snake' };
  
  map[6][3] = { type: TILE_TYPES.MACHINE, machineId: 'slot' };
  map[6][4] = { type: TILE_TYPES.MACHINE, machineId: 'slot' };
  map[6][7] = { type: TILE_TYPES.MACHINE, machineId: 'slot' };
  map[6][8] = { type: TILE_TYPES.MACHINE, machineId: 'slot' };
  
  map[9][3] = { type: TILE_TYPES.MACHINE, machineId: 'tetris' };
  map[9][4] = { type: TILE_TYPES.MACHINE, machineId: 'tetris' };
  map[9][7] = { type: TILE_TYPES.MACHINE, machineId: 'whackamole' };
  map[9][8] = { type: TILE_TYPES.MACHINE, machineId: 'whackamole' };
  
  map[3][12] = { type: TILE_TYPES.MACHINE, machineId: 'memory' };
  map[3][13] = { type: TILE_TYPES.MACHINE, machineId: 'memory' };
  map[3][16] = { type: TILE_TYPES.MACHINE, machineId: 'pinball' };
  map[3][17] = { type: TILE_TYPES.MACHINE, machineId: 'pinball' };
  
  map[9][16] = { type: TILE_TYPES.MACHINE, machineId: 'dart' };
  map[9][17] = { type: TILE_TYPES.MACHINE, machineId: 'dart' };
  
  map[12][3] = { type: TILE_TYPES.MACHINE, machineId: 'pachinko' };
  map[12][4] = { type: TILE_TYPES.MACHINE, machineId: 'pachinko' };
  map[12][7] = { type: TILE_TYPES.MACHINE, machineId: 'pachislot' };
  map[12][8] = { type: TILE_TYPES.MACHINE, machineId: 'pachislot' };
  
  map[6][12] = { type: TILE_TYPES.MACHINE, machineId: 'slot' };
  map[6][13] = { type: TILE_TYPES.MACHINE, machineId: 'slot' };
  
  map[5][16] = { type: TILE_TYPES.NPC, name: '遊戲達人', dialogue: '貪吃蛇和拉霸機都很經典喔！試試看吧！' };
  
  return map;
}

function generateFloor3F() {
  const map = [];
  for (let y = 0; y < MAP_HEIGHT; y++) {
    map[y] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1) {
        map[y][x] = { type: TILE_TYPES.WALL };
      } else {
        map[y][x] = { type: TILE_TYPES.FLOOR };
      }
    }
  }
  
  map[1][9] = { type: TILE_TYPES.STAIR_DOWN, targetFloor: '2F', targetPos: { x: 9, y: MAP_HEIGHT - 3 } };
  map[1][10] = { type: TILE_TYPES.STAIR_DOWN, targetFloor: '2F', targetPos: { x: 10, y: MAP_HEIGHT - 3 } };
  
  // 一般抽卡遊戲區 (左側)
  map[3][3] = { type: TILE_TYPES.MACHINE, machineId: 'gacha_genshin' };
  map[3][4] = { type: TILE_TYPES.MACHINE, machineId: 'gacha_genshin' };
  map[3][7] = { type: TILE_TYPES.MACHINE, machineId: 'gacha_starrail' };
  map[3][8] = { type: TILE_TYPES.MACHINE, machineId: 'gacha_starrail' };
  
  map[6][3] = { type: TILE_TYPES.MACHINE, machineId: 'gacha_zzz' };
  map[6][4] = { type: TILE_TYPES.MACHINE, machineId: 'gacha_zzz' };
  map[6][7] = { type: TILE_TYPES.MACHINE, machineId: 'gacha_fgo' };
  map[6][8] = { type: TILE_TYPES.MACHINE, machineId: 'gacha_fgo' };
  
  map[9][3] = { type: TILE_TYPES.MACHINE, machineId: 'gacha_wuwa' };
  map[9][4] = { type: TILE_TYPES.MACHINE, machineId: 'gacha_wuwa' };
  map[9][7] = { type: TILE_TYPES.MACHINE, machineId: 'gacha_es' };
  map[9][8] = { type: TILE_TYPES.MACHINE, machineId: 'gacha_es' };
  
  map[3][12] = { type: TILE_TYPES.MACHINE, machineId: 'gacha_pjsk' };
  map[3][13] = { type: TILE_TYPES.MACHINE, machineId: 'gacha_pjsk' };
  
  // 乙女遊戲區 (右側)
  map[6][12] = { type: TILE_TYPES.MACHINE, machineId: 'gacha_lightandnight' };
  map[6][13] = { type: TILE_TYPES.MACHINE, machineId: 'gacha_lightandnight' };
  map[6][16] = { type: TILE_TYPES.MACHINE, machineId: 'gacha_lovedeepspace' };
  map[6][17] = { type: TILE_TYPES.MACHINE, machineId: 'gacha_lovedeepspace' };
  
  map[9][12] = { type: TILE_TYPES.MACHINE, machineId: 'gacha_loveproducer' };
  map[9][13] = { type: TILE_TYPES.MACHINE, machineId: 'gacha_loveproducer' };
  map[9][16] = { type: TILE_TYPES.MACHINE, machineId: 'gacha_worldoutside' };
  map[9][17] = { type: TILE_TYPES.MACHINE, machineId: 'gacha_worldoutside' };
  
  map[11][3] = { type: TILE_TYPES.MACHINE, machineId: 'gacha_shiningname' };
  map[11][4] = { type: TILE_TYPES.MACHINE, machineId: 'gacha_shiningname' };
  map[11][7] = { type: TILE_TYPES.MACHINE, machineId: 'gacha_hell' };
  map[11][8] = { type: TILE_TYPES.MACHINE, machineId: 'gacha_hell' };
  
  map[5][16] = { type: TILE_TYPES.NPC, name: '抽卡大師', dialogue: '每個池都有不同的保底機制，祝你好運！' };
  map[11][16] = { type: TILE_TYPES.NPC, name: '乙女攻略員', dialogue: '右下角是乙女遊戲區，歡迎來抽老公！' };
  
  return map;
}

function generateFloorB1() {
  const map = [];
  for (let y = 0; y < MAP_HEIGHT; y++) {
    map[y] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1) {
        map[y][x] = { type: TILE_TYPES.WALL };
      } else {
        map[y][x] = { type: TILE_TYPES.FLOOR };
      }
    }
  }
  
  map[1][9] = { type: TILE_TYPES.STAIR_DOWN, targetFloor: '3F', targetPos: { x: 9, y: MAP_HEIGHT - 3 } };
  map[1][10] = { type: TILE_TYPES.STAIR_DOWN, targetFloor: '3F', targetPos: { x: 10, y: MAP_HEIGHT - 3 } };
  
  map[3][3] = { type: TILE_TYPES.MACHINE, machineId: 'yellowcard' };
  map[3][4] = { type: TILE_TYPES.MACHINE, machineId: 'yellowcard' };
  map[3][7] = { type: TILE_TYPES.MACHINE, machineId: 'truthdare' };
  map[3][8] = { type: TILE_TYPES.MACHINE, machineId: 'truthdare' };
  
  map[6][3] = { type: TILE_TYPES.MACHINE, machineId: 'roulette' };
  map[6][4] = { type: TILE_TYPES.MACHINE, machineId: 'roulette' };
  map[6][7] = { type: TILE_TYPES.MACHINE, machineId: 'kinggame' };
  map[6][8] = { type: TILE_TYPES.MACHINE, machineId: 'kinggame' };
  
  map[9][3] = { type: TILE_TYPES.MACHINE, machineId: 'oldmaid' };
  map[9][4] = { type: TILE_TYPES.MACHINE, machineId: 'oldmaid' };
  map[9][7] = { type: TILE_TYPES.MACHINE, machineId: 'drunkpoker' };
  map[9][8] = { type: TILE_TYPES.MACHINE, machineId: 'drunkpoker' };
  
  map[5][16] = { type: TILE_TYPES.NPC, name: '神秘服務員', dialogue: '這裡的遊戲比較...特別。請注意分寸。' };
  
  return map;
}

function getSpawnPosition(floor) {
  switch (floor) {
    case '1F': return { x: 9, y: 12 };
    case '2F': return { x: 9, y: 2 };
    case '3F': return { x: 9, y: 2 };
    case 'B1': return { x: 9, y: 2 };
    default: return { x: 9, y: 12 };
  }
}

function getMachineAtPosition(floor, x, y) {
  const map = MAP_DATA[floor];
  if (!map || !map[y] || !map[y][x]) return null;
  
  const tile = map[y][x];
  if (tile.type === TILE_TYPES.MACHINE && tile.machineId) {
    return MACHINES[tile.machineId];
  }
  return null;
}

function getInteractableAtPosition(floor, x, y) {
  const map = MAP_DATA[floor];
  if (!map || !map[y] || !map[y][x]) return null;
  
  const tile = map[y][x];
  const interactableTypes = [TILE_TYPES.MACHINE, TILE_TYPES.NPC, TILE_TYPES.STAIR_UP, TILE_TYPES.STAIR_DOWN, TILE_TYPES.SERVICE_DESK];
  
  if (interactableTypes.includes(tile.type)) {
    return tile;
  }
  return null;
}
