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
      var shadowAngle = 1;
      var shadowLength = 4;
      if (hours >= 6 && hours < 10) {
        shadowAngle = -1;
        shadowLength = 6;
        ctx.fillStyle = 'rgba(255,200,120,0.08)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      } else if (hours >= 10 && hours < 14) {
        shadowLength = 3;
      } else if (hours >= 14 && hours < 17) {
        shadowAngle = 1;
        shadowLength = 5;
      } else if (hours >= 17 && hours < 19) {
        shadowLength = 7;
        ctx.fillStyle = 'rgba(255,160,80,0.12)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      } else if (hours >= 19 || hours < 5) {
        ctx.fillStyle = 'rgba(40,40,80,0.25)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this._renderNightWindows();
      } else if (hours >= 5 && hours < 6) {
        shadowAngle = -1;
        shadowLength = 8;
        ctx.fillStyle = 'rgba(180,160,200,0.10)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }
      this._renderGridShadow(shadowAngle, shadowLength);
    }

    _renderGridShadow(angle, length) {
      var ctx = this.ctx;
      var ts = this.tileSize;
      var startX = Math.floor(this.camera.x / ts);
      var startY = Math.floor(this.camera.y / ts);
      var endX = startX + Math.ceil(this.canvas.width / ts) + 1;
      var endY = startY + Math.ceil(this.canvas.height / ts) + 1;
      ctx.fillStyle = P.shadow_soft;
      for (var y = startY; y < endY; y++) {
        for (var x = startX; x < endX; x++) {
          var hv = H(x, y, 9999);
          if ((hv & 0x07) === 0) {
            var px = x * ts - this.camera.x;
            var py = y * ts - this.camera.y;
            var sx = angle > 0 ? length : -length;
            ctx.fillRect(px + sx, py + length, 2, 2);
          }
        }
      }
    }

    _renderNightWindows() {
      var ctx = this.ctx;
      var ts = this.tileSize;
      for (var i = 0; i < this.buildings.length; i++) {
        var b = this.buildings[i];
        var px = b.position.x * ts - this.camera.x;
        var py = b.position.y * ts - this.camera.y;
        if (px < -ts * 2 || py < -ts * 2 || px > this.canvas.width + ts || py > this.canvas.height + ts) continue;
        var w = b.footprint.width * ts;
        var h = b.footprint.height * ts;
        var winW = Math.min(14, Math.max(8, Math.floor(w * 0.14)));
        var winH = Math.min(11, Math.max(6, Math.floor(h * 0.22)));
        var winY = py + Math.max(6, Math.floor(h * 0.15));
        var winLX = px + Math.floor(w * 0.12);
        var blink = (this.animFrame + i * 7) % 60 < 50;
        if (blink) {
          ctx.fillStyle = 'rgba(248,216,120,0.35)';
          ctx.fillRect(winLX - 2, winY - 2, winW + 4, winH + 4);
          ctx.fillRect(winLX + 1, winY + 1, winW - 2, winH - 2);
        }
        if (w >= ts * 2) {
          var winRX = px + w - Math.floor(w * 0.12) - winW;
          var blink2 = (this.animFrame + i * 13) % 60 < 45;
          if (blink2) {
            ctx.fillStyle = 'rgba(248,216,120,0.30)';
            ctx.fillRect(winRX - 2, winY - 2, winW + 4, winH + 4);
          }
        }
      }
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
          var numClusters = 4 + (hv & 2);
          for (var c = 0; c < numClusters; c++) {
            var ch = H(tx, ty, 100 + c);
            var cx = (ch & 0x1f) % (ts - 6);
            var cy = ((ch >> 3) & 0x1f) % (ts - 6);
            var clusterType = (ch >> 6) & 3;
            ctx.fillStyle = P.grass_detail_1;
            ctx.fillRect(px + cx, py + cy, 3, 2);
            ctx.fillRect(px + cx + 1, py + cy - 1, 2, 1);
            ctx.fillStyle = P.grass_detail_2;
            ctx.fillRect(px + cx + 2, py + cy + 1, 2, 2);
            ctx.fillStyle = P.grass_cluster;
            ctx.fillRect(px + cx + 1, py + cy + 2, 2, 1);
          }
          var brightN = 2 + ((hv2 >> 4) & 1);
          for (var b = 0; b < brightN; b++) {
            var bh = H(tx, ty, 200 + b);
            var bx = (bh & 0x1f) % (ts - 3);
            var by = ((bh >> 3) & 0x1f) % (ts - 3);
            ctx.fillStyle = P.grass_light;
            ctx.fillRect(px + bx, py + by, 2, 2);
          }
          var darkN = 1 + ((hv2 >> 5) & 1);
          for (var d = 0; d < darkN; d++) {
            var dh = H(tx, ty, 300 + d);
            var dx = (dh & 0x1f) % (ts - 4);
            var dy = ((dh >> 3) & 0x1f) % (ts - 4);
            ctx.fillStyle = P.grass_shadow;
            ctx.fillRect(px + dx + 1, py + dy + 1, 2, 2);
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
          var baseColor = tile === T.ROAD ? '#a0a0a0' : (tile === T.SIDEWALK ? '#c8c0b0' : P.path_base);
          ctx.fillStyle = baseColor;
          ctx.fillRect(px, py, ts, ts);
          ctx.fillStyle = P.path_dark;
          ctx.fillRect(px, py + ts - 1, ts, 1);
          ctx.fillRect(px + ts - 1, py, 1, ts);
          if (tile === T.ROAD) {
            ctx.fillStyle = '#808080';
            ctx.fillRect(px + 4, py + Math.floor(ts / 2) - 1, ts - 8, 2);
            ctx.fillStyle = '#b0b0b0';
            ctx.fillRect(px + 6, py + Math.floor(ts / 2), ts - 12, 1);
          } else if (tile === T.PATH_DIRT) {
            for (var di = 0; di < 3; di++) {
              var dith = H(tx, ty, 410 + di);
              ctx.fillStyle = P.dirt_dark;
              ctx.fillRect(px + ((dith & 0x0f) % (ts - 3)), py + (((dith >> 4) & 0x0f) % (ts - 3)), 2, 2);
            }
          }
          break;
        }
        case T.PATH_STONE: {
          ctx.fillStyle = P.path_stone;
          ctx.fillRect(px, py, ts, ts);
          ctx.fillStyle = P.path_dark;
          ctx.fillRect(px, py + ts - 1, ts, 1);
          ctx.fillRect(px + ts - 1, py, 1, ts);
          ctx.fillStyle = '#a09870';
          ctx.fillRect(px + 2, py + 2, 12, 12);
          ctx.fillRect(px + 16, py + 2, 12, 12);
          ctx.fillRect(px + 2, py + 18, 12, 12);
          ctx.fillRect(px + 16, py + 18, 12, 12);
          ctx.fillStyle = P.path_stone;
          ctx.fillRect(px + 4, py + 4, 8, 8);
          ctx.fillRect(px + 18, py + 4, 8, 8);
          ctx.fillRect(px + 4, py + 20, 8, 8);
          ctx.fillRect(px + 18, py + 20, 8, 8);
          break;
        }
        case T.WATER:
        case T.WATER_EDGE: {
          var phase = (this.animFrame + tx * 3 + ty * 7) % 60;
          ctx.fillStyle = phase < 30 ? P.water_deep : P.water_mid;
          ctx.fillRect(px, py, ts, ts);
          for (var wl = 0; wl < 3; wl++) {
            var waveY = py + 4 + wl * 10 + ((phase + wl * 5) % 10);
            ctx.fillStyle = P.water_light;
            ctx.fillRect(px + 2 + ((phase + wl * 7) % 20), waveY, 8, 1);
            ctx.fillRect(px + 14 + ((phase + wl * 11) % 16), waveY + 5, 6, 1);
          }
          var wh = H(tx, ty, 500);
          if (phase >= 15 && phase < 45) {
            var wx = (wh & 0x0f) % (ts - 6);
            var wy = ((wh >> 4) & 0x0f) % (ts - 4);
            ctx.fillStyle = P.water_foam;
            ctx.fillRect(px + wx, py + wy, 3, 2);
            ctx.fillStyle = P.window_shine;
            ctx.fillRect(px + wx, py + wy, 1, 1);
          }
          if (tile === T.WATER_EDGE) {
            ctx.fillStyle = P.water_foam;
            ctx.fillRect(px, py, ts, 3);
            ctx.fillStyle = P.water_shore;
            ctx.fillRect(px, py + 2, ts, 2);
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
          ctx.fillStyle = P.grass_detail_1;
          var fhg = H(tx, ty, 695);
          ctx.fillRect(px + ((fhg & 0x0f) % (ts - 4)), py + (((fhg >> 4) & 0x0f) % (ts - 4)), 3, 2);
          var colors = [V.flower_yellow, V.flower_pink, V.flower_white];
          for (var i = 0; i < 3; i++) {
            var fh2 = H(tx, ty, 710 + i);
            var fx  = 4 + ((fh2 & 0x1f) % (ts - 8));
            var fy  = 4 + (((fh2 >> 3) & 0x1f) % (ts - 8));
            ctx.fillStyle = V.flower_stem;
            ctx.fillRect(px + fx, py + fy + 4, 1, 4);
            ctx.fillStyle = '#507030';
            ctx.fillRect(px + fx - 2, py + fy + 6, 2, 2);
            ctx.fillRect(px + fx + 1, py + fy + 5, 2, 2);
            ctx.fillStyle = colors[i % 3];
            ctx.fillRect(px + fx - 2, py + fy, 5, 4);
            ctx.fillStyle = P.window_shine;
            ctx.fillRect(px + fx - 1, py + fy + 1, 1, 1);
            ctx.fillStyle = '#f8e878';
            ctx.fillRect(px + fx, py + fy + 2, 1, 1);
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
      var crownW = Math.floor(ts * 0.85);
      var crownH = Math.floor(ts * 0.58);
      var trunkW = Math.max(5, Math.floor(ts * 0.18));
      var trunkH = Math.floor(ts * 0.28);
      var cx = px + Math.floor((ts - crownW) / 2);
      var crownTop = py - crownH + 3;
      var trunkX = px + Math.floor((ts - trunkW) / 2);
      var trunkY = py + ts - trunkH - 3;
      // Ground shadow (ellipse)
      ctx.fillStyle = B.shadow_cast;
      var shadowW = Math.floor(crownW * 0.75);
      var shadowX = px + Math.floor((ts - shadowW) / 2);
      var shadowY = py + ts - 4;
      ctx.fillRect(shadowX + 3, shadowY, shadowW - 6, 1);
      ctx.fillRect(shadowX + 1, shadowY + 1, shadowW - 2, 2);
      ctx.fillRect(shadowX + 3, shadowY + 3, shadowW - 6, 1);
      // Trunk with bark texture
      ctx.fillStyle = V.tree_trunk_dark;
      ctx.fillRect(trunkX - 1, trunkY, trunkW + 2, trunkH);
      ctx.fillStyle = V.tree_trunk_light;
      ctx.fillRect(trunkX, trunkY, trunkW, trunkH);
      // Bark lines
      ctx.fillStyle = V.tree_trunk_dark;
      for (var bl = 0; bl < trunkH; bl += 4) {
        ctx.fillRect(trunkX + 1, trunkY + bl, 1, 3);
        ctx.fillRect(trunkX + trunkW - 2, trunkY + bl + 2, 1, 2);
      }
      // Root details
      ctx.fillStyle = V.tree_trunk_dark;
      ctx.fillRect(trunkX - 2, trunkY + trunkH - 2, 2, 3);
      ctx.fillRect(trunkX + trunkW, trunkY + trunkH - 2, 2, 3);
      // Crown - multi-layer concentric
      // Layer 1: Dark outer base
      ctx.fillStyle = V.tree_top_shadow;
      ctx.fillRect(cx - 1, crownTop - 1, crownW + 2, crownH + 2);
      // Layer 2: Dark main
      ctx.fillStyle = V.tree_top_dark;
      ctx.fillRect(cx, crownTop, crownW, crownH);
      // Layer 3: Mid layer (inset)
      var midInset = 3;
      ctx.fillStyle = V.tree_top_mid;
      ctx.fillRect(cx + midInset, crownTop + midInset, crownW - midInset * 2, crownH - midInset * 2);
      // Layer 4: Light highlights (clustered)
      ctx.fillStyle = V.tree_top_light;
      for (var i = 0; i < 6; i++) {
        var sh = H(tx, ty, 1200 + i);
        var sw = 2 + (sh & 3);
        var sHt = 2 + ((sh >> 2) & 3);
        var maxSX = Math.max(2, Math.floor(crownW / 2) - midInset - sw);
        var maxSY = Math.max(2, Math.floor(crownH / 2) - midInset - sHt);
        var spotX = cx + midInset + ((sh >> 4) & 0x0f) % maxSX;
        var spotY = crownTop + midInset + ((sh >> 1) & 0x07) % maxSY;
        ctx.fillRect(spotX, spotY, sw, sHt);
      }
      // Leaf cluster texture on crown
      ctx.fillStyle = V.tree_top_mid;
      for (var lc = 0; lc < 8; lc++) {
        var lch = H(tx, ty, 1300 + lc);
        var lx = cx + 2 + ((lch & 0x0f) % (crownW - 4));
        var ly = crownTop + 2 + (((lch >> 4) & 0x0f) % (crownH - 4));
        ctx.fillRect(lx, ly, 3, 2);
        ctx.fillRect(lx + 1, ly - 1, 2, 1);
      }
      // Shadow band at bottom of crown
      ctx.fillStyle = V.tree_top_shadow;
      ctx.fillRect(cx + 3, crownTop + crownH - 5, crownW - 6, 5);
      // Crown outline
      ctx.fillStyle = V.tree_top_shadow;
      ctx.fillRect(cx + 3, crownTop - 1, crownW - 6, 1);
      ctx.fillRect(cx + 3, crownTop + crownH, crownW - 6, 1);
      ctx.fillRect(cx - 1, crownTop + 3, 1, crownH - 6);
      ctx.fillRect(cx + crownW, crownTop + 3, 1, crownH - 6);
    }

    _renderBuilding(building, unlockedMap) {
      var ctx = this.ctx;
      var ts  = this.tileSize;
      var px  = building.position.x * ts - this.camera.x;
      var py  = building.position.y * ts - this.camera.y;
      var w   = building.footprint.width  * ts;
      var h   = building.footprint.height * ts;
      var roofHeight = Math.floor(ts * Math.max(1, building.height * 0.28));
      var owned = building.owned || (unlockedMap && unlockedMap[building.id]);
      var roofKey = building.roofStyle || 'blue';
      var rc = ROOF_STYLES[roofKey] || ROOF_STYLES.blue;
      var buildingHash = H(building.position.x, building.position.y, 0);
      // Layer 1: Cast shadow (fan shape)
      ctx.fillStyle = B.shadow_cast;
      ctx.fillRect(px + 6, py + h, w - 4, 4);
      ctx.fillRect(px + 8, py + h + 4, w - 8, 3);
      ctx.fillRect(px + 10, py + h + 7, w - 12, 2);
      // Layer 2: Wall base
      ctx.fillStyle = B.house_wall;
      ctx.fillRect(px, py, w, h);
      // Brick texture lines
      ctx.fillStyle = P.brick_line;
      for (var by = 6; by < h - 4; by += 8) {
        ctx.fillRect(px + 1, py + by, w - 2, 1);
        var offset = (Math.floor(by / 8) % 2) * 6;
        for (var bx = offset; bx < w - 2; bx += 12) {
          ctx.fillRect(px + bx, py + by - 4, 1, 4);
        }
      }
      // Wall shadow (right side)
      var wallShadowW = Math.max(5, Math.floor(w * 0.18));
      ctx.fillStyle = B.house_wall_shadow;
      ctx.fillRect(px + w - wallShadowW, py, wallShadowW, h);
      // Wall highlight (top-left)
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(px + 1, py + 1, Math.floor(w * 0.3), 2);
      // AO at bottom
      ctx.fillStyle = P.ao_dark;
      ctx.fillRect(px, py + h - 3, w, 3);
      // Layer 3: Slanted roof
      var roofTop = py - roofHeight;
      var roofMidY = roofTop + Math.floor(roofHeight * 0.55);
      var halfW = Math.floor(w / 2);
      // Roof edge/eaves (overhang)
      ctx.fillStyle = rc.edge;
      ctx.fillRect(px - 3, roofTop - 1, w + 6, 3);
      // Left slope (light)
      ctx.fillStyle = rc.light;
      ctx.fillRect(px - 3, roofTop + 2, halfW + 3, roofMidY - roofTop - 2);
      // Right slope (dark)
      ctx.fillStyle = rc.dark;
      ctx.fillRect(px + halfW, roofTop + 2, w - halfW + 3, roofMidY - roofTop - 2);
      // Lower roof section
      ctx.fillStyle = rc.mid;
      ctx.fillRect(px - 3, roofMidY, halfW + 3, py - roofMidY - 1);
      ctx.fillStyle = rc.dark;
      ctx.fillRect(px + halfW, roofMidY, w - halfW + 3, py - roofMidY - 1);
      // Tile lines on roof
      ctx.fillStyle = rc.edge;
      for (var ry = roofTop + 5; ry < py - 2; ry += 5) {
        ctx.fillRect(px - 2, ry, w + 4, 1);
      }
      // Roof highlight strip
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(px - 2, roofTop + 2, 4, roofMidY - roofTop - 2);
      // Eaves bottom edge
      ctx.fillStyle = rc.edge;
      ctx.fillRect(px - 3, py - 1, w + 6, 2);
      // Chimney for large buildings
      if (building.footprint.width >= 4) {
        var chimX = px + w - 20;
        var chimY = roofTop + 4;
        ctx.fillStyle = B.house_chimney;
        ctx.fillRect(chimX, chimY, 8, roofHeight - 2);
        ctx.fillStyle = B.house_chimney_top;
        ctx.fillRect(chimX - 1, chimY - 1, 10, 2);
        ctx.fillStyle = B.outline;
        ctx.fillRect(chimX, chimY, 1, roofHeight - 2);
      }
      // Layer 4: Windows with frame and shine
      var winW = Math.min(14, Math.max(8, Math.floor(w * 0.14)));
      var winH = Math.min(11, Math.max(6, Math.floor(h * 0.22)));
      var winY = py + Math.max(6, Math.floor(h * 0.15));
      var winLX = px + Math.floor(w * 0.12);
      // Left window
      ctx.fillStyle = B.window_frame;
      ctx.fillRect(winLX - 2, winY - 2, winW + 4, winH + 4);
      ctx.fillStyle = B.door_frame;
      ctx.fillRect(winLX - 1, winY - 1, winW + 2, winH + 2);
      ctx.fillStyle = B.window_glass;
      ctx.fillRect(winLX, winY, winW, winH);
      // Window cross
      ctx.fillStyle = B.window_frame;
      ctx.fillRect(winLX + Math.floor(winW / 2) - 1, winY, 2, winH);
      ctx.fillRect(winLX, winY + Math.floor(winH / 2) - 1, winW, 2);
      // Window shine
      ctx.fillStyle = P.window_shine;
      ctx.fillRect(winLX + 1, winY + 1, 2, 2);
      // Window sill
      ctx.fillStyle = B.door_frame;
      ctx.fillRect(winLX - 1, winY + winH + 1, winW + 2, 2);
      // Right window (if building wide enough)
      if (w >= ts * 2) {
        var winRX = px + w - Math.floor(w * 0.12) - winW;
        ctx.fillStyle = B.window_frame;
        ctx.fillRect(winRX - 2, winY - 2, winW + 4, winH + 4);
        ctx.fillStyle = B.door_frame;
        ctx.fillRect(winRX - 1, winY - 1, winW + 2, winH + 2);
        ctx.fillStyle = B.window_glass;
        ctx.fillRect(winRX, winY, winW, winH);
        ctx.fillStyle = B.window_frame;
        ctx.fillRect(winRX + Math.floor(winW / 2) - 1, winY, 2, winH);
        ctx.fillRect(winRX, winY + Math.floor(winH / 2) - 1, winW, 2);
        ctx.fillStyle = P.window_shine;
        ctx.fillRect(winRX + 1, winY + 1, 2, 2);
        ctx.fillStyle = B.door_frame;
        ctx.fillRect(winRX - 1, winY + winH + 1, winW + 2, 2);
      }
      // Layer 5: Door with frame and details
      var doorW = Math.min(18, Math.max(10, Math.floor(w * 0.18)));
      var doorH = Math.min(22, Math.max(12, Math.floor(h * 0.38)));
      var doorX = px + Math.floor(w / 2) - Math.floor(doorW / 2);
      var doorY = py + h - doorH;
      // Door frame
      ctx.fillStyle = P.door_frame;
      ctx.fillRect(doorX - 2, doorY - 2, doorW + 4, doorH + 4);
      // Door body
      ctx.fillStyle = B.door_wood;
      ctx.fillRect(doorX, doorY, doorW, doorH);
      // Door panel lines
      ctx.fillStyle = B.door_dark;
      ctx.fillRect(doorX + 2, doorY + 3, doorW - 4, 1);
      ctx.fillRect(doorX + 2, doorY + Math.floor(doorH / 2), doorW - 4, 1);
      // Door shadow (right)
      ctx.fillStyle = B.door_dark;
      ctx.fillRect(doorX + doorW - 3, doorY, 3, doorH);
      // Door knob with highlight
      ctx.fillStyle = B.door_knob;
      ctx.fillRect(doorX + doorW - 5, doorY + Math.floor(doorH / 2) - 1, 3, 3);
      ctx.fillStyle = P.window_shine;
      ctx.fillRect(doorX + doorW - 5, doorY + Math.floor(doorH / 2) - 1, 1, 1);
      // Door threshold
      ctx.fillStyle = B.door_dark;
      ctx.fillRect(doorX - 2, py + h - 2, doorW + 4, 2);
      // Layer 6: Outline
      ctx.fillStyle = B.outline;
      ctx.fillRect(px, py, w, 1);
      ctx.fillRect(px, py + h - 1, w, 1);
      ctx.fillRect(px, py, 1, h);
      ctx.fillRect(px + w - 1, py, 1, h);
      ctx.fillRect(px - 3, roofTop - 1, w + 6, 1);
      ctx.fillRect(px - 3, roofTop, 1, py - roofTop + 1);
      ctx.fillRect(px + w + 2, roofTop, 1, py - roofTop + 1);
      // Layer 7: FOR SALE sign
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
