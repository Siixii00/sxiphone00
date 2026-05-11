(function (global) {
  'use strict';

  var T  = HomeData.TILE_TYPES;
  var P  = HomeData.DP_PALETTE;
  var B  = HomeData.DP_BUILDINGS;
  var V  = HomeData.DP_VEGETATION;
  var UI = HomeData.DP_UI;
  var H  = HomeData.tileHash;

  var ROOF_STYLES = {
    blue: { light: B.house_roof_light, mid: B.house_roof_mid, dark: B.house_roof_dark, edge: B.house_roof_edge },
    red:  { light: B.pc_roof_light,    mid: B.pc_roof_mid,    dark: B.pc_roof_dark,    edge: B.pc_roof_dark     },
    mart: { light: B.mart_roof_light,  mid: B.mart_roof_mid,  dark: B.mart_roof_dark,  edge: B.mart_roof_dark   },
    wood: { light: B.wood_light,       mid: B.wood_mid,       dark: B.wood_dark,       edge: B.wood_edge        }
  };

  class WorldMapEngine {
    constructor(canvas, mapData) {
      this.canvas  = canvas;
      this.ctx     = canvas.getContext('2d');
      this.ctx.imageSmoothingEnabled = false;
      this.mapData   = mapData;
      this.tileSize  = HomeData.MAP_CONFIG.tileSize;
      this.camera    = { x: 0, y: 0 };
      this.animFrame = 0;
      this.buildings = HomeData.BUILDINGS;
      this.teleportPoints = HomeData.TELEPORT_POINTS;
      this.grassWave = 0;
    }

    centerOnPlayer(playerTileX, playerTileY) {
      var px = playerTileX * this.tileSize + this.tileSize / 2;
      var py = playerTileY * this.tileSize + this.tileSize / 2;
      this.camera.x = Math.floor(px - this.canvas.width  / 2);
      this.camera.y = Math.floor(py - this.canvas.height / 2);
      var maxX = this.mapData[0].length * this.tileSize - this.canvas.width;
      var maxY = this.mapData.length    * this.tileSize - this.canvas.height;
      this.camera.x = Math.max(0, Math.min(this.camera.x, maxX));
      this.camera.y = Math.max(0, Math.min(this.camera.y, maxY));
    }

    render(player, unlockedMap) {
      var ctx = this.ctx;
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      var ts = this.tileSize;
      var startTileX = Math.floor(this.camera.x / ts);
      var startTileY = Math.floor(this.camera.y / ts);
      var endTileX = Math.min(startTileX + Math.ceil(this.canvas.width / ts) + 1, HomeData.MAP_CONFIG.worldWidth);
      var endTileY = Math.min(startTileY + Math.ceil(this.canvas.height / ts) + 1, HomeData.MAP_CONFIG.worldHeight);
      for (var y = startTileY; y < endTileY; y++) {
        for (var x = startTileX; x < endTileX; x++) {
          this._renderTile(x, y, this.mapData[y][x]);
        }
      }
      var renderList = [];
      for (var i = 0; i < this.buildings.length; i++) {
        var b = this.buildings[i];
        if (b.position.x + b.footprint.width < startTileX || b.position.x > endTileX || b.position.y + b.footprint.height < startTileY || b.position.y > endTileY) continue;
        renderList.push({ y: b.position.y + b.footprint.height + 0.1, type: 'building', ref: b });
      }
      for (var ty = startTileY; ty < endTileY; ty++) {
        for (var tx = startTileX; tx < endTileX; tx++) {
          var tile = this.mapData[ty][tx];
          if (tile === T.TREE || tile === T.FOREST) {
            renderList.push({ y: ty + 1.0, type: 'tree', tileX: tx, tileY: ty });
          }
        }
      }
      for (var i = 0; i < HomeData.NPC_LIST.length; i++) {
        var n = HomeData.NPC_LIST[i];
        if (n.x < startTileX || n.x > endTileX || n.y < startTileY || n.y > endTileY) continue;
        renderList.push({ y: n.y + 0.9, type: 'npc', ref: n });
      }
      renderList.push({ y: player.getRenderPos().y + 1, type: 'player', ref: player });
      renderList.sort(function (a, b) { return a.y - b.y; });
      for (var i = 0; i < renderList.length; i++) {
        var item = renderList[i];
        if (item.type === 'building') this._renderBuilding(item.ref, unlockedMap);
        else if (item.type === 'tree') this._renderTree(item.tileX, item.tileY);
        else if (item.type === 'npc') this._renderNpc(item.ref);
        else if (item.type === 'player') item.ref.render(ctx, this.camera, ts);
      }
      this._renderTeleportPoints(unlockedMap);
      this.renderOverlay();
      this.animFrame = (this.animFrame + 1) % 120;
      this.grassWave += 1;
    }

    renderOverlay() {
      var ctx = this.ctx;
      var hours = new Date().getHours();
      if (hours >= 19 || hours < 5) {
        ctx.fillStyle = 'rgba(40,40,80,0.25)';
      } else if (hours >= 17) {
        ctx.fillStyle = 'rgba(255,160,80,0.12)';
      } else { return; }
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    _renderTile(tx, ty, tile) {
      var ctx = this.ctx;
      var ts  = this.tileSize;
      var px  = tx * ts - this.camera.x;
      var py  = ty * ts - this.camera.y;
      var hv  = H(tx, ty, 0);
      var hv2 = H(tx, ty, 7919);
      switch (tile) {
        case T.GRASS: {
          ctx.fillStyle = P.grass_base;
          ctx.fillRect(px, py, ts, ts);
          var spots = 3 + (hv & 1);
          for (var i = 0; i < spots; i++) {
            var sh = H(tx, ty, 100 + i);
            var sx = (sh & 0x1f) % (ts - 2);
            var sy = ((sh >> 3) & 0x1f) % (ts - 2);
            ctx.fillStyle = P.grass_light;
            ctx.fillRect(px + sx, py + sy, 2, 2);
          }
          var darkN = 1 + ((hv2 >> 4) & 1);
          for (var i = 0; i < darkN; i++) {
            var dh = H(tx, ty, 200 + i);
            var dx = (dh & 0x1f) % (ts - 2);
            var dy = ((dh >> 3) & 0x1f) % (ts - 2);
            ctx.fillStyle = P.grass_dark;
            ctx.fillRect(px + dx, py + dy, 2, 2);
          }
          break;
        }
        case T.GRASS_TALL: {
          ctx.fillStyle = P.grass_tall;
          ctx.fillRect(px, py, ts, ts);
          for (var i = 0; i < 4; i++) {
            var bh = H(tx, ty, 300 + i);
            var bx = 2 + ((bh & 0x1f) % (ts - 4));
            var sway = ((this.grassWave + tx + ty + i) % 12 < 6) ? 0 : 1;
            ctx.fillStyle = P.grass_tall_tip;
            ctx.fillRect(px + bx + sway, py + ts - 10, 2, 8);
          }
          break;
        }
        case T.PATH_DIRT:
        case T.ROAD:
        case T.SIDEWALK: {
          ctx.fillStyle = P.path_base;
          ctx.fillRect(px, py, ts, ts);
          ctx.fillStyle = P.path_dark;
          ctx.fillRect(px, py + ts - 1, ts, 1);
          ctx.fillRect(px + ts - 1, py, 1, ts);
          break;
        }
        case T.PATH_STONE: {
          ctx.fillStyle = P.path_stone;
          ctx.fillRect(px, py, ts, ts);
          ctx.fillStyle = P.path_dark;
          ctx.fillRect(px, py + ts - 1, ts, 1);
          ctx.fillRect(px + ts - 1, py, 1, ts);
          break;
        }
        case T.WATER:
        case T.WATER_EDGE: {
          var phase = (this.animFrame + tx * 3 + ty * 7) % 40;
          ctx.fillStyle = phase < 20 ? P.water_deep : P.water_mid;
          ctx.fillRect(px, py, ts, ts);
          var wh = H(tx, ty, 500);
          if (phase >= 10 && phase < 30) {
            var wx = (wh & 0x0f) % (ts - 4);
            var wy = ((wh >> 4) & 0x0f) % (ts - 4);
            ctx.fillStyle = P.water_light;
            ctx.fillRect(px + wx, py + wy, 4, 2);
          }
          if (tile === T.WATER_EDGE) {
            ctx.fillStyle = P.water_foam;
            ctx.fillRect(px, py, ts, 3);
          }
          break;
        }
        case T.SAND: {
          ctx.fillStyle = P.sand_base;
          ctx.fillRect(px, py, ts, ts);
          var sSpots = 2 + (hv & 1);
          for (var i = 0; i < sSpots; i++) {
            var sh2 = H(tx, ty, 600 + i);
            var sx2 = (sh2 & 0x1f) % (ts - 3);
            var sy2 = ((sh2 >> 3) & 0x1f) % (ts - 3);
            ctx.fillStyle = P.sand_light;
            ctx.fillRect(px + sx2, py + sy2, 3, 2);
          }
          break;
        }
        case T.FLOWER: {
          ctx.fillStyle = P.grass_base;
          ctx.fillRect(px, py, ts, ts);
          var fh = H(tx, ty, 700);
          ctx.fillStyle = P.grass_light;
          ctx.fillRect(px + (fh & 0x0f) % (ts - 2), py + ((fh >> 4) & 0x0f) % (ts - 2), 2, 2);
          var colors = [V.flower_yellow, V.flower_pink, V.flower_white];
          for (var i = 0; i < 3; i++) {
            var fh2 = H(tx, ty, 710 + i);
            var fx  = 3 + ((fh2 & 0x1f) % (ts - 6));
            var fy  = 3 + (((fh2 >> 3) & 0x1f) % (ts - 6));
            ctx.fillStyle = V.flower_stem;
            ctx.fillRect(px + fx, py + fy + 2, 1, 3);
            ctx.fillStyle = colors[i % 3];
            ctx.fillRect(px + fx - 1, py + fy, 2, 2);
          }
          break;
        }
        case T.BRIDGE: {
          ctx.fillStyle = B.wood_mid;
          ctx.fillRect(px, py, ts, ts);
          ctx.fillStyle = B.wood_dark;
          for (var i = 2; i < ts; i += 5) { ctx.fillRect(px + i, py + 1, 1, ts - 2); }
          ctx.fillStyle = B.wood_edge;
          ctx.fillRect(px, py, ts, 2);
          ctx.fillRect(px, py + ts - 2, ts, 2);
          break;
        }
        case T.FOREST: {
          ctx.fillStyle = P.grass_dark;
          ctx.fillRect(px, py, ts, ts);
          ctx.fillStyle = P.grass_shadow;
          var fsh = H(tx, ty, 800);
          ctx.fillRect(px + (fsh & 0x0f), py + ((fsh >> 4) & 0x0f) % (ts - 3), 3, 2);
          break;
        }
        case T.TREE: {
          ctx.fillStyle = P.grass_base;
          ctx.fillRect(px, py, ts, ts);
          var th = H(tx, ty, 900);
          ctx.fillStyle = P.grass_light;
          ctx.fillRect(px + (th & 0x0f) % (ts - 2), py + ((th >> 4) & 0x0f) % (ts - 2), 2, 2);
          break;
        }
        case T.SNOW: {
          ctx.fillStyle = P.snow_base;
          ctx.fillRect(px, py, ts, ts);
          ctx.fillStyle = P.snow_shadow;
          var snh = H(tx, ty, 950);
          ctx.fillRect(px + (snh & 0x0f) % (ts - 3), py + ((snh >> 4) & 0x0f) % (ts - 3), 3, 2);
          break;
        }
        case T.ICE: {
          ctx.fillStyle = P.water_foam;
          ctx.fillRect(px, py, ts, ts);
          ctx.fillStyle = P.water_light;
          var ich = H(tx, ty, 960);
          ctx.fillRect(px + (ich & 0x0f), py + ((ich >> 4) & 0x0f) % (ts - 2), 4, 1);
          break;
        }
        case T.FENCE: {
          ctx.fillStyle = P.grass_base;
          ctx.fillRect(px, py, ts, ts);
          ctx.fillStyle = B.wood_mid;
          ctx.fillRect(px + 2, py + ts - 14, 4, 14);
          ctx.fillRect(px + ts - 6, py + ts - 14, 4, 14);
          ctx.fillStyle = B.wood_light;
          ctx.fillRect(px, py + ts - 10, ts, 3);
          ctx.fillStyle = B.wood_dark;
          ctx.fillRect(px, py + ts - 5, ts, 2);
          break;
        }
        case T.STAIRS: {
          ctx.fillStyle = P.rock_base;
          ctx.fillRect(px, py, ts, ts);
          ctx.fillStyle = P.rock_light;
          for (var s = 0; s < ts; s += 6) { ctx.fillRect(px, py + s, ts, 2); }
          ctx.fillStyle = P.rock_dark;
          for (var s = 4; s < ts; s += 6) { ctx.fillRect(px, py + s, ts, 1); }
          break;
        }
        default: {
          ctx.fillStyle = P.grass_base;
          ctx.fillRect(px, py, ts, ts);
          var defH = H(tx, ty, 0);
          ctx.fillStyle = P.grass_light;
          ctx.fillRect(px + (defH & 0x0f) % (ts - 2), py + ((defH >> 4) & 0x0f) % (ts - 2), 2, 2);
          break;
        }
      }
    }

    _renderTree(tx, ty) {
      var ctx = this.ctx;
      var ts  = this.tileSize;
      var px  = tx * ts - this.camera.x;
      var py  = ty * ts - this.camera.y;
      var crownW = Math.floor(ts * 0.9);
      var crownH = Math.floor(ts * 0.65);
      var trunkW = Math.max(4, Math.floor(ts * 0.22));
      var trunkH = Math.floor(ts * 0.3);
      var cx = px + Math.floor((ts - crownW) / 2);
      var crownTop = py - crownH + 4;
      var trunkX = px + Math.floor((ts - trunkW) / 2);
      var trunkY = py + ts - trunkH - 2;
      // Shadow ellipse
      ctx.fillStyle = B.shadow_cast;
      var shadowW = Math.floor(crownW * 0.8);
      var shadowX = px + Math.floor((ts - shadowW) / 2);
      var shadowY = py + ts - 5;
      ctx.fillRect(shadowX + 2, shadowY, shadowW - 4, 1);
      ctx.fillRect(shadowX, shadowY + 1, shadowW, 2);
      ctx.fillRect(shadowX + 2, shadowY + 3, shadowW - 4, 1);
      // Trunk
      var halfTrunk = Math.floor(trunkW / 2);
      ctx.fillStyle = V.tree_top_shadow;
      ctx.fillRect(trunkX - 1, trunkY, trunkW + 2, trunkH);
      ctx.fillStyle = V.tree_trunk_light;
      ctx.fillRect(trunkX, trunkY, halfTrunk, trunkH);
      ctx.fillStyle = V.tree_trunk_dark;
      ctx.fillRect(trunkX + halfTrunk, trunkY, trunkW - halfTrunk, trunkH);
      // Crown dark base
      ctx.fillStyle = V.tree_top_dark;
      ctx.fillRect(cx, crownTop, crownW, crownH);
      // Mid overlay
      var midInset = 3;
      ctx.fillStyle = V.tree_top_mid;
      ctx.fillRect(cx + midInset, crownTop + midInset, crownW - midInset * 2, crownH - midInset * 2);
      // Light spots top-left
      ctx.fillStyle = V.tree_top_light;
      for (var i = 0; i < 5; i++) {
        var sh = H(tx, ty, 1200 + i);
        var sw = 2 + (sh & 3);
        var sHt = 2 + ((sh >> 2) & 3);
        var maxSX = Math.max(1, Math.floor(crownW / 2) - midInset - sw);
        var maxSY = Math.max(1, Math.floor(crownH / 2) - midInset - sHt);
        var spotX = cx + midInset + ((sh >> 4) & 0x0f) % maxSX;
        var spotY = crownTop + midInset + ((sh >> 1) & 0x07) % maxSY;
        ctx.fillRect(spotX, spotY, sw, sHt);
      }
      // Shadow band at bottom
      ctx.fillStyle = V.tree_top_shadow;
      ctx.fillRect(cx + 2, crownTop + crownH - 4, crownW - 4, 4);
      // 1px outline using tree_top_shadow
      ctx.fillStyle = V.tree_top_shadow;
      ctx.fillRect(cx + 2, crownTop - 1, crownW - 4, 1);
      ctx.fillRect(cx + 2, crownTop + crownH, crownW - 4, 1);
      ctx.fillRect(cx - 1, crownTop + 2, 1, crownH - 4);
      ctx.fillRect(cx + crownW, crownTop + 2, 1, crownH - 4);
    }

    _renderBuilding(building, unlockedMap) {
      var ctx = this.ctx;
      var ts  = this.tileSize;
      var px  = building.position.x * ts - this.camera.x;
      var py  = building.position.y * ts - this.camera.y;
      var w   = building.footprint.width  * ts;
      var h   = building.footprint.height * ts;
      var roofHeight = Math.floor(ts * Math.max(1, building.height * 0.24));
      var owned = building.owned || (unlockedMap && unlockedMap[building.id]);
      var roofKey = building.roofStyle || 'blue';
      var rc = ROOF_STYLES[roofKey] || ROOF_STYLES.blue;
      // Layer 1: Shadow
      ctx.fillStyle = B.shadow_cast;
      ctx.fillRect(px + 4, py + h, w - 2, 5);
      ctx.fillRect(px + 6, py + h + 5, w - 6, 2);
      // Layer 2: Wall
      ctx.fillStyle = B.house_wall;
      ctx.fillRect(px, py, w, h);
      var wallShadowW = Math.max(4, Math.floor(w * 0.2));
      ctx.fillStyle = B.house_wall_shadow;
      ctx.fillRect(px + w - wallShadowW, py, wallShadowW, h);
      ctx.fillStyle = B.house_wall;
      ctx.fillRect(px + 2, py + 2, w - wallShadowW - 4, 2);
      // Layer 3: Roof
      var roofTop = py - roofHeight;
      var roofMidY = roofTop + Math.floor(roofHeight * 0.5);
      var halfW = Math.floor(w / 2);
      ctx.fillStyle = rc.edge;
      ctx.fillRect(px - 2, roofTop, w + 4, 2);
      ctx.fillStyle = rc.light;
      ctx.fillRect(px - 2, roofTop + 2, halfW + 2, roofMidY - roofTop - 2);
      ctx.fillStyle = rc.dark;
      ctx.fillRect(px + halfW, roofTop + 2, w - halfW + 2, roofMidY - roofTop - 2);
      ctx.fillStyle = rc.mid;
      ctx.fillRect(px - 2, roofMidY, halfW + 2, py - roofMidY);
      ctx.fillStyle = rc.dark;
      ctx.fillRect(px + halfW, roofMidY, w - halfW + 2, py - roofMidY);
      ctx.fillStyle = rc.mid;
      ctx.fillRect(px - 3, py - 2, halfW + 3, 2);
      ctx.fillStyle = rc.dark;
      ctx.fillRect(px + halfW, py - 2, w - halfW + 3, 2);
      ctx.fillStyle = rc.edge;
      ctx.fillRect(px - 3, py, w + 6, 1);
      // Layer 4: Windows
      var winW = Math.min(14, Math.max(8, Math.floor(w * 0.14)));
      var winH = Math.min(11, Math.max(6, Math.floor(h * 0.22)));
      var winY = py + Math.max(6, Math.floor(h * 0.12));
      var winLX = px + Math.floor(w * 0.12);
      ctx.fillStyle = B.window_frame;
      ctx.fillRect(winLX - 1, winY - 1, winW + 2, winH + 2);
      ctx.fillStyle = B.window_glass;
      ctx.fillRect(winLX, winY, winW, winH);
      ctx.fillStyle = B.house_wall;
      ctx.fillRect(winLX + 1, winY + 1, Math.min(4, winW - 2), Math.min(3, winH - 2));
      if (w >= ts * 2) {
        var winRX = px + w - Math.floor(w * 0.12) - winW;
        ctx.fillStyle = B.window_frame;
        ctx.fillRect(winRX - 1, winY - 1, winW + 2, winH + 2);
        ctx.fillStyle = B.window_glass;
        ctx.fillRect(winRX, winY, winW, winH);
        ctx.fillStyle = B.house_wall;
        ctx.fillRect(winRX + 1, winY + 1, Math.min(4, winW - 2), Math.min(3, winH - 2));
      }
      // Layer 5: Door
      var doorW = Math.min(18, Math.max(10, Math.floor(w * 0.18)));
      var doorH = Math.min(22, Math.max(12, Math.floor(h * 0.36)));
      var doorX = px + Math.floor(w / 2) - Math.floor(doorW / 2);
      var doorY = py + h - doorH;
      ctx.fillStyle = B.door_wood;
      ctx.fillRect(doorX, doorY, doorW, doorH);
      ctx.fillStyle = B.door_dark;
      ctx.fillRect(doorX + Math.floor(doorW / 2), doorY, 1, doorH);
      ctx.fillStyle = B.door_dark;
      ctx.fillRect(doorX, doorY + doorH - 3, doorW, 3);
      ctx.fillStyle = B.door_knob;
      ctx.fillRect(doorX + doorW - 5, doorY + Math.floor(doorH / 2), 2, 2);
      // Layer 6: 1px outline
      ctx.fillStyle = B.outline;
      ctx.fillRect(px, py, w, 1);
      ctx.fillRect(px, py + h - 1, w, 1);
      ctx.fillRect(px, py, 1, h);
      ctx.fillRect(px + w - 1, py, 1, h);
      ctx.fillRect(px - 2, roofTop - 1, w + 4, 1);
      ctx.fillRect(px - 3, roofTop, 1, py - roofTop + 1);
      ctx.fillRect(px + w + 2, roofTop, 1, py - roofTop + 1);
      // Layer 7: FOR SALE
      if (building.purchasable && !owned) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(px + 4, py + 4, w - 8, 18);
        ctx.fillStyle = UI.accent_gold;
        ctx.font = '9px "Press Start 2P"';
        ctx.fillText('FOR SALE', px + 8, py + 16);
      }
    }

    _renderNpc(npc) {
      var ctx = this.ctx;
      var ts  = this.tileSize;
      var x   = npc.x * ts - this.camera.x;
      var y   = npc.y * ts - this.camera.y;
      // Shadow ellipse
      ctx.fillStyle = B.shadow_cast;
      ctx.fillRect(x + 10, y + ts - 5, 12, 1);
      ctx.fillRect(x + 8,  y + ts - 4, 16, 2);
      ctx.fillRect(x + 10, y + ts - 2, 12, 1);
      // Body outline
      ctx.fillStyle = B.outline;
      ctx.fillRect(x + 9, y + 15, 14, 13);
      // Body fill
      ctx.fillStyle = UI.accent_red;
      ctx.fillRect(x + 10, y + 16, 12, 11);
      // Head outline
      ctx.fillStyle = B.outline;
      ctx.fillRect(x + 10, y + 4, 12, 12);
      // Hair
      ctx.fillStyle = '#503820';
      ctx.fillRect(x + 11, y + 5, 10, 4);
      // Skin
      ctx.fillStyle = '#e8d0b8';
      ctx.fillRect(x + 11, y + 9, 10, 6);
    }

    _renderTeleportPoints(unlockedMap) {
      var ctx = this.ctx;
      var ts  = this.tileSize;
      for (var i = 0; i < this.teleportPoints.length; i++) {
        var tp = this.teleportPoints[i];
        var unlocked = unlockedMap ? !!unlockedMap[tp.id] : !!tp.unlocked;
        var x = tp.x * ts - this.camera.x;
        var y = tp.y * ts - this.camera.y;
        if (x < -ts || y < -ts || x > this.canvas.width + ts || y > this.canvas.height + ts) continue;
        var blink = this.animFrame % 40 < 20;
        if (unlocked) {
          ctx.fillStyle = blink ? P.water_foam : P.water_light;
          ctx.fillRect(x + 8, y + 7, 16, 20);
          ctx.fillStyle = blink ? P.water_light : P.water_foam;
          ctx.fillRect(x + 10, y + 9, 12, 16);
          ctx.fillStyle = P.water_foam;
          ctx.fillRect(x + 9, y + 6, 14, 3);
        } else {
          ctx.fillStyle = P.rock_dark;
          ctx.fillRect(x + 8, y + 7, 16, 20);
          ctx.fillStyle = P.rock_base;
          ctx.fillRect(x + 9, y + 6, 14, 3);
        }
      }
    }
  }

  global.WorldMapEngine = WorldMapEngine;
})(window);
