(function (global) {
  'use strict';

  // ══════════════════════════════════════════════════════════════
  //  Section 2-1: Ground Palette (exact DP colors from guide)
  // ══════════════════════════════════════════════════════════════
  var DP_PALETTE = {
    // ── Grass (Sinnoh cool-green) ──
    grass_base:     '#78b858',
    grass_light:    '#90d070',
    grass_dark:     '#589040',
    grass_shadow:   '#407830',
    grass_tall:     '#50a038',
    grass_tall_tip: '#68c050',

    // ── Path (Route beige) ──
    path_base:      '#d8c890',
    path_light:     '#e8d8a0',
    path_dark:      '#b8a870',
    path_stone:     '#c0b880',

    // ── Dirt ──
    dirt_base:      '#c09060',
    dirt_light:     '#d0a870',
    dirt_dark:      '#a07848',

    // ── Water ──
    water_deep:     '#3870c0',
    water_mid:      '#4888d8',
    water_light:    '#60a0e8',
    water_foam:     '#a8d0f0',
    water_shore:    '#80c0e8',

    // ── Snow (Sinnoh) ──
    snow_base:      '#e8eef8',
    snow_shadow:    '#c8d4e8',
    snow_deep:      '#d8e4f0',

    // ── Rock / Stone wall ──
    rock_base:      '#909090',
    rock_light:     '#b0b0b0',
    rock_dark:      '#686868',
    rock_shadow:    '#484848',

    // ── Sand ──
    sand_base:      '#d8c878',
    sand_light:     '#e8d890'
  };

  // ══════════════════════════════════════════════════════════════
  //  Section 2-2: Building Palette
  // ══════════════════════════════════════════════════════════════
  var DP_BUILDINGS = {
    // ── Common house (white wall, blue roof) ──
    house_wall:         '#f0ece0',
    house_wall_shadow:  '#c8c4b0',
    house_wall_window:  '#d8d4c0',
    house_roof_light:   '#5890d0',
    house_roof_mid:     '#4070b0',
    house_roof_dark:    '#305090',
    house_roof_edge:    '#203870',
    house_chimney:      '#808080',
    house_chimney_top:  '#606060',

    // ── Pokémon Center (red/white) ──
    pc_roof_light:      '#e84040',
    pc_roof_mid:        '#c02828',
    pc_roof_dark:       '#901818',
    pc_cross:           '#f0f0f0',
    pc_sign_red:        '#e03030',

    // ── Mart (blue/white) ──
    mart_roof_light:    '#4898e0',
    mart_roof_mid:      '#3070b8',
    mart_roof_dark:     '#204888',
    mart_sign:          '#f0f080',

    // ── Wood buildings ──
    wood_light:         '#c89858',
    wood_mid:           '#a87840',
    wood_dark:          '#806030',
    wood_edge:          '#604820',

    // ── Shared details ──
    window_glass:       '#a8d0f0',
    window_glow:        '#f8d878',
    window_frame:       '#806840',
    door_wood:          '#986838',
    door_dark:          '#704820',
    door_knob:          '#d0a040',
    outline:            '#202020',
    shadow_cast:        'rgba(0,0,20,0.22)'
  };

  // ══════════════════════════════════════════════════════════════
  //  Section 2-3: Vegetation Palette
  // ══════════════════════════════════════════════════════════════
  var DP_VEGETATION = {
    // ── Round-crown tree ──
    tree_top_light:   '#68c040',
    tree_top_mid:     '#50a030',
    tree_top_dark:    '#388020',
    tree_top_shadow:  '#286010',
    tree_trunk_light: '#906030',
    tree_trunk_dark:  '#604010',

    // ── Pine tree (Sinnoh mountains) ──
    pine_top:         '#287030',
    pine_mid:         '#388040',
    pine_dark:        '#205028',
    pine_trunk:       '#704830',

    // ── Bush ──
    bush_light:       '#60b840',
    bush_dark:        '#408828',

    // ── Flowers ──
    flower_white:     '#f0f0e8',
    flower_yellow:    '#f0d040',
    flower_pink:      '#f080a0',
    flower_stem:      '#609040'
  };

  // ══════════════════════════════════════════════════════════════
  //  UI Palette
  // ══════════════════════════════════════════════════════════════
  var DP_UI = {
    dialog_bg:        '#f0f0f0',
    dialog_border:    '#183060',
    dialog_border_in: '#6090d0',
    text_color:       '#181818',
    arrow_color:      '#183060',
    accent_gold:      '#f8d878',
    accent_red:       '#e84040'
  };

  // ══════════════════════════════════════════════════════════════
  //  Deterministic tile hash (no Math.random)
  // ══════════════════════════════════════════════════════════════
  function tileHash(x, y, seed) {
    seed = seed || 0;
    var h = seed + x * 374761393 + y * 668265263;
    h = (h ^ (h >> 13)) * 1274126177;
    return (h ^ (h >> 16)) & 0xff;
  }

  // ══════════════════════════════════════════════════════════════
  //  Map Configuration
  // ══════════════════════════════════════════════════════════════
  var MAP_CONFIG = { worldWidth: 200, worldHeight: 150, tileSize: 32, viewportTiles: { x: 12, y: 18 } };

  // ══════════════════════════════════════════════════════════════
  //  Tile Types
  // ══════════════════════════════════════════════════════════════
  var TILE_TYPES = {
    GRASS: 0, GRASS_TALL: 1, PATH_DIRT: 2, PATH_STONE: 3, ROAD: 4, SIDEWALK: 5,
    WATER: 6, WATER_EDGE: 7, SAND: 8, FOREST: 9, TREE: 10, FLOWER: 11,
    FENCE: 12, BRIDGE: 13, STAIRS: 14, SNOW: 15, ICE: 16
  };

  // ══════════════════════════════════════════════════════════════
  //  World Regions
  // ══════════════════════════════════════════════════════════════
  var WORLD_REGIONS = [
    { id: 'nature', x0: 0, y0: 0, x1: 200, y1: 30, name: '自然森林區' },
    { id: 'cultural', x0: 0, y0: 30, x1: 70, y1: 70, name: '文化藝術區' },
    { id: 'seaside', x0: 130, y0: 30, x1: 200, y1: 70, name: '海濱度假區' },
    { id: 'residential', x0: 0, y0: 70, x1: 70, y1: 110, name: '溫馨住宅區' },
    { id: 'leisure', x0: 130, y0: 70, x1: 200, y1: 110, name: '休閒娛樂區' },
    { id: 'commercial', x0: 0, y0: 110, x1: 200, y1: 150, name: '繁華商業區' }
  ];

  // ══════════════════════════════════════════════════════════════
  //  Buildings (20 buildings, each with roofStyle)
  // ══════════════════════════════════════════════════════════════
  var BUILDINGS = [
    { id: 'player_house', name: '我的家', type: 'residential', footprint: { width: 4, height: 3 }, height: 5, position: { x: 48, y: 73 }, region: 'residential', interactable: true, enterable: true, owned: true, interiorType: 'full_house', roofStyle: 'blue' },
    { id: 'convenience_store', name: '便利商店', type: 'commercial', footprint: { width: 3, height: 2 }, height: 4, position: { x: 55, y: 70 }, region: 'residential', interactable: true, enterable: true, shopType: 'furniture', npcText: '歡迎光臨！今天有新家具喔。', roofStyle: 'mart' },
    { id: 'cafe_resident', name: '晨光咖啡', type: 'commercial', footprint: { width: 3, height: 2 }, height: 4, position: { x: 60, y: 76 }, region: 'residential', interactable: true, enterable: true, npcText: '先喝一杯再出發吧。', roofStyle: 'wood' },
    { id: 'town_house_a', name: '小宅 A', type: 'residential', footprint: { width: 3, height: 2 }, height: 4, position: { x: 40, y: 82 }, region: 'residential', interactable: true, enterable: true, purchasable: true, price: 18000, roofStyle: 'blue' },
    { id: 'town_house_b', name: '小宅 B', type: 'residential', footprint: { width: 3, height: 2 }, height: 4, position: { x: 34, y: 88 }, region: 'residential', interactable: true, enterable: true, purchasable: true, price: 22000, roofStyle: 'blue' },
    { id: 'super_market', name: '超市', type: 'commercial', footprint: { width: 5, height: 3 }, height: 5, position: { x: 84, y: 126 }, region: 'commercial', interactable: true, enterable: true, npcText: '這裡什麼都買得到。', roofStyle: 'mart' },
    { id: 'book_store', name: '書店', type: 'commercial', footprint: { width: 4, height: 3 }, height: 5, position: { x: 98, y: 122 }, region: 'commercial', interactable: true, enterable: true, npcText: '每一天都值得閱讀。', roofStyle: 'blue' },
    { id: 'bakery', name: '烘焙坊', type: 'commercial', footprint: { width: 4, height: 3 }, height: 5, position: { x: 113, y: 128 }, region: 'commercial', interactable: true, enterable: true, npcText: '剛出爐麵包香氣十足。', roofStyle: 'wood' },
    { id: 'department_store', name: '百貨公司', type: 'commercial', footprint: { width: 6, height: 4 }, height: 6, position: { x: 130, y: 120 }, region: 'commercial', interactable: true, enterable: true, purchasable: true, price: 90000, roofStyle: 'red' },
    { id: 'museum', name: '博物館', type: 'cultural', footprint: { width: 5, height: 3 }, height: 5, position: { x: 18, y: 42 }, region: 'cultural', interactable: true, enterable: true, npcText: '歷史就在每塊磚裡。', roofStyle: 'blue' },
    { id: 'library', name: '圖書館', type: 'cultural', footprint: { width: 4, height: 3 }, height: 5, position: { x: 30, y: 48 }, region: 'cultural', interactable: true, enterable: true, npcText: '保持安靜，知識會說話。', roofStyle: 'blue' },
    { id: 'art_center', name: '藝術中心', type: 'cultural', footprint: { width: 4, height: 3 }, height: 5, position: { x: 46, y: 44 }, region: 'cultural', interactable: true, enterable: true, npcText: '創作讓城市有靈魂。', roofStyle: 'red' },
    { id: 'forest_hut', name: '森林小屋', type: 'nature', footprint: { width: 3, height: 2 }, height: 4, position: { x: 76, y: 18 }, region: 'nature', interactable: true, enterable: true, npcText: '樹葉聲是最好的音樂。', roofStyle: 'wood' },
    { id: 'watch_tower', name: '瞭望台', type: 'nature', footprint: { width: 3, height: 2 }, height: 5, position: { x: 105, y: 12 }, region: 'nature', interactable: true, enterable: true, npcText: '從這裡能看見全城。', roofStyle: 'wood' },
    { id: 'beach_villa_a', name: '海景別墅 A', type: 'residential', footprint: { width: 5, height: 4 }, height: 6, position: { x: 156, y: 50 }, region: 'seaside', interactable: true, enterable: true, purchasable: true, price: 50000, roofStyle: 'blue' },
    { id: 'beach_villa_b', name: '海景別墅 B', type: 'residential', footprint: { width: 5, height: 4 }, height: 6, position: { x: 167, y: 59 }, region: 'seaside', interactable: true, enterable: true, purchasable: true, price: 65000, roofStyle: 'blue' },
    { id: 'lighthouse', name: '燈塔', type: 'seaside', footprint: { width: 3, height: 3 }, height: 7, position: { x: 182, y: 36 }, region: 'seaside', interactable: true, enterable: true, npcText: '夜晚由我守護。', roofStyle: 'red' },
    { id: 'park_pavilion', name: '公園涼亭', type: 'leisure', footprint: { width: 4, height: 3 }, height: 4, position: { x: 146, y: 84 }, region: 'leisure', interactable: true, enterable: true, npcText: '休息一下，風吹很舒服。', roofStyle: 'wood' },
    { id: 'sports_center', name: '運動場', type: 'leisure', footprint: { width: 5, height: 3 }, height: 4, position: { x: 162, y: 92 }, region: 'leisure', interactable: true, enterable: true, npcText: '今天也來動一動吧。', roofStyle: 'mart' },
    { id: 'funfair', name: '遊樂設施', type: 'leisure', footprint: { width: 4, height: 3 }, height: 5, position: { x: 180, y: 85 }, region: 'leisure', interactable: true, enterable: true, npcText: '歡迎來玩，別忘了笑！', roofStyle: 'red' }
  ];

  // ══════════════════════════════════════════════════════════════
  //  Teleport Points
  // ══════════════════════════════════════════════════════════════
  var TELEPORT_POINTS = [
    { id: 'tp_residential', name: '住宅區', region: 'residential', x: 50, y: 75, unlocked: true },
    { id: 'tp_commercial', name: '商業區', region: 'commercial', x: 103, y: 131, unlocked: false },
    { id: 'tp_leisure', name: '娛樂區', region: 'leisure', x: 160, y: 87, unlocked: false },
    { id: 'tp_nature', name: '森林區', region: 'nature', x: 100, y: 15, unlocked: false },
    { id: 'tp_seaside', name: '海濱區', region: 'seaside', x: 171, y: 47, unlocked: false },
    { id: 'tp_cultural', name: '文化區', region: 'cultural', x: 30, y: 45, unlocked: false }
  ];

  // ══════════════════════════════════════════════════════════════
  //  NPC List
  // ══════════════════════════════════════════════════════════════
  var NPC_LIST = [
    { id: 'npc_guide', x: 52, y: 76, speaker: '導覽員', text: '使用 MAP 可以快速移動。' },
    { id: 'npc_elder', x: 44, y: 80, speaker: '居民', text: '這裡的生活很安穩。' },
    { id: 'npc_runner', x: 157, y: 90, speaker: '跑者', text: '娛樂區的路線很適合練跑。' },
    { id: 'npc_artist', x: 42, y: 46, speaker: '藝術家', text: '文化區每個角落都能取景。' }
  ];

  // ══════════════════════════════════════════════════════════════
  //  Furniture Catalog
  // ══════════════════════════════════════════════════════════════
  var FURNITURE_CATALOG = [
    { id: 'sofa_basic', name: '基本沙發', category: 'living', price: 1200 },
    { id: 'tv_basic', name: '基本電視', category: 'living', price: 1800 },
    { id: 'table_tea', name: '茶几', category: 'living', price: 800 },
    { id: 'bed_double', name: '雙人床', category: 'bedroom', price: 2400 },
    { id: 'wardrobe', name: '衣櫃', category: 'bedroom', price: 1600 },
    { id: 'desk_set', name: '書桌組', category: 'study', price: 1900 },
    { id: 'bookshelf', name: '書架', category: 'study', price: 1500 },
    { id: 'fridge', name: '冰箱', category: 'kitchen', price: 1700 },
    { id: 'dining_table', name: '餐桌', category: 'kitchen', price: 1400 },
    { id: 'plant_large', name: '大盆栽', category: 'balcony', price: 600 }
  ];

  // ══════════════════════════════════════════════════════════════
  //  Room Types
  // ══════════════════════════════════════════════════════════════
  var ROOM_TYPES = {
    living_room: { name: '客廳', baseSize: { w: 12, h: 10 } },
    bedroom:     { name: '臥室', baseSize: { w: 12, h: 10 } },
    bathroom:    { name: '衛浴', baseSize: { w: 12, h: 10 } },
    study:       { name: '書房', baseSize: { w: 12, h: 10 } },
    kitchen:     { name: '廚房', baseSize: { w: 12, h: 10 } },
    balcony:     { name: '陽台', baseSize: { w: 12, h: 10 } }
  };

  // ══════════════════════════════════════════════════════════════
  //  regionFor()
  // ══════════════════════════════════════════════════════════════
  function regionFor(x, y) {
    for (var i = 0; i < WORLD_REGIONS.length; i++) {
      var r = WORLD_REGIONS[i];
      if (x >= r.x0 && x < r.x1 && y >= r.y0 && y < r.y1) return r.id;
    }
    return 'residential';
  }

  // ══════════════════════════════════════════════════════════════
  //  generateWorldMap() — uses tileHash for deterministic variation
  // ══════════════════════════════════════════════════════════════
  function generateWorldMap() {
    var w = MAP_CONFIG.worldWidth;
    var h = MAP_CONFIG.worldHeight;
    var map = new Array(h);
    var T = TILE_TYPES;

    for (var y = 0; y < h; y++) {
      var row = new Array(w);
      for (var x = 0; x < w; x++) {
        var region = regionFor(x, y);
        var hv = tileHash(x, y, 0);       // primary hash 0-255
        var hv2 = tileHash(x, y, 7919);   // secondary hash for sub-variation
        var tile = T.GRASS;

        if (region === 'nature') {
          // Dense forest region: FOREST, TREE, GRASS_TALL, occasional GRASS
          if (hv < 70) {
            tile = T.FOREST;
          } else if (hv < 110) {
            tile = T.TREE;
          } else if (hv < 170) {
            tile = T.GRASS_TALL;
          } else {
            tile = T.GRASS;
          }
        } else if (region === 'cultural') {
          // Paved cultural district: PATH_STONE dominant, some GRASS, occasional FLOWER
          if (hv < 120) {
            tile = T.PATH_STONE;
          } else if (hv < 200) {
            tile = T.GRASS;
          } else if (hv < 230) {
            tile = T.FLOWER;
          } else {
            tile = T.PATH_DIRT;
          }
        } else if (region === 'seaside') {
          // Coastal: WATER to the east, SAND transition, GRASS inland
          if (x > 180) {
            tile = (hv < 200) ? T.WATER : T.WATER_EDGE;
          } else if (x > 170) {
            tile = (hv < 128) ? T.WATER_EDGE : T.SAND;
          } else if (x > 160) {
            tile = (hv < 180) ? T.SAND : T.GRASS;
          } else {
            tile = (hv < 30) ? T.FLOWER : T.GRASS;
          }
        } else if (region === 'residential') {
          // Homes: mostly GRASS with some FLOWER and GRASS_TALL patches
          if (hv < 20) {
            tile = T.FLOWER;
          } else if (hv < 55) {
            tile = T.GRASS_TALL;
          } else if (hv < 75) {
            tile = T.PATH_DIRT;
          } else {
            tile = T.GRASS;
          }
        } else if (region === 'leisure') {
          // Parks: GRASS with FLOWER clusters, a pond area
          if (x > 170 && x < 190 && y > 78 && y < 100) {
            // Pond
            if (hv < 200) {
              tile = T.WATER;
            } else {
              tile = T.WATER_EDGE;
            }
          } else if (hv < 40) {
            tile = T.FLOWER;
          } else if (hv < 70) {
            tile = T.GRASS_TALL;
          } else if (hv < 90) {
            tile = T.TREE;
          } else {
            tile = T.GRASS;
          }
        } else if (region === 'commercial') {
          // Busy commercial: ROAD and PATH_STONE dominant, SIDEWALK, some GRASS edges
          if (hv < 90) {
            tile = T.ROAD;
          } else if (hv < 160) {
            tile = T.PATH_STONE;
          } else if (hv < 200) {
            tile = T.SIDEWALK;
          } else {
            tile = T.GRASS;
          }
        }

        row[x] = tile;
      }
      map[y] = row;
    }

    // ── Main roads: central cross ──
    for (var ry = 0; ry < h; ry++) {
      map[ry][98] = T.ROAD;
      map[ry][99] = T.ROAD;
      map[ry][100] = T.ROAD;
      map[ry][101] = T.ROAD;
    }
    for (var rx = 0; rx < w; rx++) {
      map[74][rx] = T.ROAD;
      map[75][rx] = T.ROAD;
      map[76][rx] = T.ROAD;
    }

    // ── Sidewalk borders along main roads ──
    for (var sy = 0; sy < h; sy++) {
      if (map[sy][97] !== T.ROAD && map[sy][97] !== T.BRIDGE) map[sy][97] = T.SIDEWALK;
      if (map[sy][102] !== T.ROAD && map[sy][102] !== T.BRIDGE) map[sy][102] = T.SIDEWALK;
    }
    for (var sx = 0; sx < w; sx++) {
      if (map[73] && map[73][sx] !== T.ROAD && map[73][sx] !== T.BRIDGE) map[73][sx] = T.SIDEWALK;
      if (map[77] && map[77][sx] !== T.ROAD && map[77][sx] !== T.BRIDGE) map[77][sx] = T.SIDEWALK;
    }

    // ── Bridges over leisure pond ──
    for (var bx = 170; bx <= 182; bx++) {
      map[88][bx] = T.BRIDGE;
      map[89][bx] = T.BRIDGE;
    }

    // ── Teleport marker terrain ──
    TELEPORT_POINTS.forEach(function (tp) {
      for (var oy = -1; oy <= 1; oy++) {
        for (var ox = -1; ox <= 1; ox++) {
          var tx = tp.x + ox;
          var ty = tp.y + oy;
          if (tx > 1 && ty > 1 && tx < w - 1 && ty < h - 1) {
            map[ty][tx] = T.PATH_STONE;
          }
        }
      }
    });

    return map;
  }

  // ══════════════════════════════════════════════════════════════
  //  Export everything on global.HomeData
  // ══════════════════════════════════════════════════════════════
  global.HomeData = {
    DP_PALETTE: DP_PALETTE,
    DP_BUILDINGS: DP_BUILDINGS,
    DP_VEGETATION: DP_VEGETATION,
    DP_UI: DP_UI,
    tileHash: tileHash,
    MAP_CONFIG: MAP_CONFIG,
    TILE_TYPES: TILE_TYPES,
    WORLD_REGIONS: WORLD_REGIONS,
    BUILDINGS: BUILDINGS,
    TELEPORT_POINTS: TELEPORT_POINTS,
    NPC_LIST: NPC_LIST,
    FURNITURE_CATALOG: FURNITURE_CATALOG,
    ROOM_TYPES: ROOM_TYPES,
    regionFor: regionFor,
    generateWorldMap: generateWorldMap
  };

})(window);
