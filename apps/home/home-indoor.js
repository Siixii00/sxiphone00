(function (global) {
  'use strict';

  var P = HomeData.DP_PALETTE;
  var B = HomeData.DP_BUILDINGS;
  var IT = HomeData.INDOOR_TILES;
  var H = HomeData.tileHash;

  class IndoorMapEngine {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.ctx.imageSmoothingEnabled = false;
      this.tileSize = 30;
      this.camera = { x: 0, y: 0 };
      this.indoorMap = null;
      this.roomType = 'living_room';
      this.furniture = [];
      this.playerIndoorX = 8;
      this.playerIndoorY = 12;
      this.animFrame = 0;
    }

    setRoom(roomType, furniture, playerX, playerY) {
      this.roomType = roomType;
      this.furniture = furniture || [];
      this.playerIndoorX = playerX || 8;
      this.playerIndoorY = playerY || 12;
      
      var roomConfig = HomeData.ROOM_TYPES[roomType];
      var width = roomConfig ? roomConfig.baseSize.w : 12;
      var height = roomConfig ? roomConfig.baseSize.h : 10;
      this.indoorMap = HomeData.generateIndoorMap(roomType, width, height);
    }

    centerOnPlayer(px, py) {
      var ts = this.tileSize;
      var centerX = px * ts + ts / 2;
      var centerY = py * ts + ts / 2;
      this.camera.x = Math.floor(centerX - this.canvas.width / 2);
      this.camera.y = Math.floor(centerY - this.canvas.height / 2);
      
      if (this.indoorMap) {
        var maxX = this.indoorMap[0].length * ts - this.canvas.width;
        var maxY = this.indoorMap.length * ts - this.canvas.height;
        this.camera.x = Math.max(0, Math.min(this.camera.x, maxX));
        this.camera.y = Math.max(0, Math.min(this.camera.y, maxY));
      }
    }

    canMoveTo(x, y) {
      if (!this.indoorMap) return false;
      if (x < 0 || y < 0 || y >= this.indoorMap.length || x >= this.indoorMap[0].length) return false;
      var tile = this.indoorMap[y][x];
      return tile !== IT.WALL;
    }

    render(playerSprite, spriteColors) {
      var ctx = this.ctx;
      var ts = this.tileSize;
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      if (!this.indoorMap) return;

      var startX = Math.floor(this.camera.x / ts);
      var startY = Math.floor(this.camera.y / ts);
      var endX = Math.min(startX + Math.ceil(this.canvas.width / ts) + 2, this.indoorMap[0].length);
      var endY = Math.min(startY + Math.ceil(this.canvas.height / ts) + 2, this.indoorMap.length);

      for (var y = startY; y < endY; y++) {
        for (var x = startX; x < endX; x++) {
          this._renderTile(x, y);
        }
      }

      this._renderFurniture();

      this._renderPlayer(playerSprite, spriteColors);

      this.animFrame = (this.animFrame + 1) % 120;
    }

    _renderTile(tx, ty) {
      var ctx = this.ctx;
      var ts = this.tileSize;
      var px = tx * ts - this.camera.x;
      var py = ty * ts - this.camera.y;
      var tile = this.indoorMap[ty][tx];
      var hv = H(tx, ty, 0);

      switch (tile) {
        case IT.FLOOR:
          ctx.fillStyle = '#d8c8a0';
          ctx.fillRect(px, py, ts, ts);
          ctx.fillStyle = '#c8b890';
          if ((tx + ty) % 2 === 0) {
            ctx.fillRect(px + 2, py + 2, ts - 4, ts - 4);
          }
          ctx.fillStyle = '#b8a880';
          ctx.fillRect(px, py + ts - 1, ts, 1);
          ctx.fillRect(px + ts - 1, py, 1, ts);
          break;
        case IT.WALL:
          ctx.fillStyle = '#a08868';
          ctx.fillRect(px, py, ts, ts);
          ctx.fillStyle = '#b89878';
          ctx.fillRect(px + 2, py + 2, ts - 4, ts - 6);
          ctx.fillStyle = '#887058';
          ctx.fillRect(px, py + ts - 4, ts, 4);
          ctx.fillRect(px, py, 1, ts);
          ctx.fillRect(px + ts - 1, py, 1, ts);
          break;
        case IT.DOOR:
          ctx.fillStyle = '#d8c8a0';
          ctx.fillRect(px, py, ts, ts);
          ctx.fillStyle = '#6a4a30';
          ctx.fillRect(px + 4, py, ts - 8, ts);
          ctx.fillStyle = '#8a6a50';
          ctx.fillRect(px + 6, py + 2, ts - 12, ts - 4);
          ctx.fillStyle = '#a08060';
          ctx.fillRect(px + ts / 2 - 2, py + ts / 2, 4, 4);
          break;
        case IT.CARPET:
          ctx.fillStyle = '#d8c8a0';
          ctx.fillRect(px, py, ts, ts);
          ctx.fillStyle = '#a04040';
          ctx.fillRect(px + 2, py + 2, ts - 4, ts - 4);
          ctx.fillStyle = '#c06060';
          ctx.fillRect(px + 4, py + 4, ts - 8, ts - 8);
          ctx.fillStyle = '#e08080';
          ctx.fillRect(px + 6, py + 6, ts - 12, ts - 12);
          break;
        case IT.KITCHEN_TILE:
          ctx.fillStyle = '#c8d0d8';
          ctx.fillRect(px, py, ts, ts);
          ctx.fillStyle = '#a8b0b8';
          ctx.fillRect(px + 2, py + 2, ts / 2 - 3, ts / 2 - 3);
          ctx.fillRect(px + ts / 2 + 1, py + ts / 2 + 1, ts / 2 - 3, ts / 2 - 3);
          ctx.fillStyle = '#889098';
          ctx.fillRect(px, py + ts - 1, ts, 1);
          break;
        case IT.BATH_TILE:
          ctx.fillStyle = '#b8d8e8';
          ctx.fillRect(px, py, ts, ts);
          ctx.fillStyle = '#98c0d0';
          ctx.fillRect(px + 2, py + 2, ts - 4, ts - 4);
          ctx.fillStyle = '#78a0b0';
          ctx.fillRect(px + 4, py + 4, ts - 8, ts - 8);
          break;
      }
    }

    _renderFurniture() {
      var ctx = this.ctx;
      var ts = this.tileSize;

      var sortedFurniture = this.furniture.slice().sort(function(a, b) {
        return a.y - b.y;
      });

      for (var i = 0; i < sortedFurniture.length; i++) {
        var item = sortedFurniture[i];
        var px = item.x * ts - this.camera.x;
        var py = item.y * ts - this.camera.y;

        if (px < -ts * 2 || py < -ts * 2 || px > this.canvas.width + ts || py > this.canvas.height + ts) continue;

        this._drawFurnitureShadow(ctx, item, ts, px, py);
        this._drawFurniture(ctx, item, ts, px, py);
      }
    }

    _drawFurnitureShadow(ctx, item, ts, x, y) {
      ctx.fillStyle = 'rgba(0,0,20,0.18)';
      ctx.fillRect(x + 4, y + ts * 0.7, ts - 8, 4);
      ctx.fillRect(x + 6, y + ts * 0.7 + 4, ts - 12, 2);
    }

    _drawFurniture(ctx, item, ts, x, y) {
      var h = 0.8;
      
      switch (item.id) {
        case 'sofa_basic':
          ctx.fillStyle = '#4a2a18';
          ctx.fillRect(x + 4, y + 2, ts * 2 - 8, ts * 0.5 * h);
          ctx.fillStyle = '#5a3a28';
          ctx.fillRect(x + 2, y, ts * 2 - 4, ts * 0.5 * h - 2);
          ctx.fillStyle = '#7a4a32';
          ctx.fillRect(x + 4, y + 2, ts * 2 - 8, ts * 0.4 * h);
          ctx.fillStyle = '#9a6a52';
          ctx.fillRect(x + 6, y + 4, ts * 2 - 12, ts * 0.25 * h);
          ctx.fillStyle = '#4a2a18';
          ctx.fillRect(x + 2, y + ts * 0.5 * h - 4, ts * 2 - 4, 4);
          ctx.fillStyle = '#3a2010';
          ctx.fillRect(x, y + ts * 0.5 * h, ts * 2, 6);
          break;
        case 'tv_basic':
          ctx.fillStyle = '#181818';
          ctx.fillRect(x + 2, y + ts * 0.1 * h, ts * 1.4 - 4, ts * 0.7 * h);
          ctx.fillStyle = '#222';
          ctx.fillRect(x + 4, y + ts * 0.12 * h, ts * 1.4 - 8, ts * 0.65 * h);
          ctx.fillStyle = '#4888d8';
          ctx.fillRect(x + 6, y + ts * 0.15 * h, ts * 1.4 - 12, ts * 0.5 * h);
          ctx.fillStyle = '#60a0f8';
          ctx.fillRect(x + 8, y + ts * 0.18 * h, 10, 8);
          break;
        case 'table_tea':
          ctx.fillStyle = '#5a3a20';
          ctx.fillRect(x + 6, y + ts * 0.3 * h, ts * 1.1 - 12, ts * 0.4 * h);
          ctx.fillStyle = '#8e6a45';
          ctx.fillRect(x + 4, y + ts * 0.25 * h, ts * 1.1 - 8, ts * 0.35 * h);
          ctx.fillStyle = '#a87a55';
          ctx.fillRect(x + 6, y + ts * 0.27 * h, ts * 1.1 - 12, ts * 0.2 * h);
          ctx.fillStyle = '#5a3a20';
          ctx.fillRect(x + 8, y + ts * 0.6 * h, 4, ts * 0.4 * h);
          ctx.fillRect(x + ts * 1.1 - 12, y + ts * 0.6 * h, 4, ts * 0.4 * h);
          break;
        case 'bed_double':
          ctx.fillStyle = '#4c2a28';
          ctx.fillRect(x + 4, y + 2, ts * 2.2 - 8, ts * 1.1 * h);
          ctx.fillStyle = '#5c3a38';
          ctx.fillRect(x + 2, y, ts * 2.2 - 4, ts * 1.0 * h);
          ctx.fillStyle = '#7c5a48';
          ctx.fillRect(x + 4, y + 2, ts * 2.2 - 8, ts * 0.9 * h);
          ctx.fillStyle = '#f8f8f8';
          ctx.fillRect(x + 6, y + 4, ts * 2.2 - 12, ts * 0.5 * h);
          ctx.fillStyle = '#e8e8e8';
          ctx.fillRect(x + 8, y + 6, ts * 2.2 - 16, ts * 0.4 * h);
          ctx.fillStyle = '#3a1818';
          ctx.fillRect(x, y + ts * 1.0 * h, ts * 2.2, 8);
          break;
        case 'wardrobe':
          ctx.fillStyle = '#5a3920';
          ctx.fillRect(x + 2, y + 2, ts * 1.2 - 4, ts * 1.3 * h);
          ctx.fillStyle = '#6a4930';
          ctx.fillRect(x, y, ts * 1.2, ts * 1.2 * h);
          ctx.fillStyle = '#8a694e';
          ctx.fillRect(x + 2, y + 2, ts * 1.2 - 4, ts * 1.15 * h);
          ctx.fillStyle = '#6a4930';
          ctx.fillRect(x + ts * 0.6 - 1, y + 2, 2, ts * 1.15 * h);
          ctx.fillStyle = '#a08060';
          ctx.fillRect(x + ts * 0.3, y + ts * 0.6 * h, 4, 4);
          ctx.fillRect(x + ts * 0.9, y + ts * 0.6 * h, 4, 4);
          ctx.fillStyle = '#4a3018';
          ctx.fillRect(x, y + ts * 1.2 * h, ts * 1.2, 6);
          break;
        case 'mirror':
          ctx.fillStyle = '#4a3020';
          ctx.fillRect(x + 4, y + ts * 0.1 * h, ts * 0.8 - 4, ts * 1.1 * h);
          ctx.fillStyle = '#5a4030';
          ctx.fillRect(x + 2, y + 2, ts * 0.8 - 2, ts * 1.0 * h);
          ctx.fillStyle = '#7a6050';
          ctx.fillRect(x + 4, y + 4, ts * 0.8 - 6, ts * 0.95 * h);
          ctx.fillStyle = '#c8e0f8';
          ctx.fillRect(x + 6, y + 6, ts * 0.8 - 10, ts * 0.85 * h);
          ctx.fillStyle = '#e8f4ff';
          ctx.fillRect(x + 8, y + 8, 10, 14);
          ctx.fillStyle = '#3a2010';
          ctx.fillRect(x + 2, y + ts * 1.0 * h, ts * 0.8 - 2, 6);
          break;
        case 'desk_set':
          ctx.fillStyle = '#534028';
          ctx.fillRect(x + 2, y + 2, ts * 1.6 - 4, ts * 0.55 * h);
          ctx.fillStyle = '#634530';
          ctx.fillRect(x, y, ts * 1.6, ts * 0.5 * h);
          ctx.fillStyle = '#836548';
          ctx.fillRect(x + 2, y + 2, ts * 1.6 - 4, ts * 0.45 * h);
          ctx.fillStyle = '#534028';
          ctx.fillRect(x + 4, y + ts * 0.5 * h, 4, ts * 0.4 * h);
          ctx.fillRect(x + ts * 1.6 - 8, y + ts * 0.5 * h, 4, ts * 0.4 * h);
          break;
        case 'bookshelf':
          ctx.fillStyle = '#4d3220';
          ctx.fillRect(x + 2, y + 2, ts * 1.2 - 4, ts * 1.2 * h);
          ctx.fillStyle = '#5d4230';
          ctx.fillRect(x, y, ts * 1.2, ts * 1.1 * h);
          ctx.fillStyle = '#6d5238';
          ctx.fillRect(x + 2, y + 2, ts * 1.2 - 4, ts * 1.05 * h);
          ctx.fillStyle = '#8a6050';
          ctx.fillRect(x + 4, y + 4, ts * 1.2 - 8, 10);
          ctx.fillStyle = '#5080a0';
          ctx.fillRect(x + 4, y + 18, ts * 1.2 - 8, 8);
          ctx.fillStyle = '#70a080';
          ctx.fillRect(x + 4, y + 30, ts * 1.2 - 8, 8);
          ctx.fillStyle = '#4d3220';
          ctx.fillRect(x, y + ts * 1.1 * h, ts * 1.2, 6);
          break;
        case 'fridge':
          ctx.fillStyle = '#607080';
          ctx.fillRect(x + 2, y + 2, ts * 1.1 - 4, ts * 1.3 * h);
          ctx.fillStyle = '#8090a0';
          ctx.fillRect(x, y, ts * 1.1, ts * 1.2 * h);
          ctx.fillStyle = '#aab3bc';
          ctx.fillRect(x + 2, y + 2, ts * 1.1 - 4, ts * 1.15 * h);
          ctx.fillStyle = '#c0c8d0';
          ctx.fillRect(x + 4, y + 4, ts * 1.1 - 8, ts * 0.4 * h);
          ctx.fillStyle = '#606870';
          ctx.fillRect(x + ts * 1.1 - 10, y + ts * 0.5 * h, 4, 8);
          ctx.fillStyle = '#506070';
          ctx.fillRect(x, y + ts * 1.2 * h, ts * 1.1, 6);
          break;
        case 'dining_table':
          ctx.fillStyle = '#5c3720';
          ctx.fillRect(x + 4, y + ts * 0.2 * h, ts * 1.8 - 8, ts * 0.6 * h);
          ctx.fillStyle = '#6c4730';
          ctx.fillRect(x + 2, y + ts * 0.15 * h, ts * 1.8 - 4, ts * 0.55 * h);
          ctx.fillStyle = '#8c6748';
          ctx.fillRect(x + 4, y + ts * 0.18 * h, ts * 1.8 - 8, ts * 0.45 * h);
          ctx.fillStyle = '#5c3720';
          ctx.fillRect(x + 8, y + ts * 0.7 * h, 4, ts * 0.3 * h);
          ctx.fillRect(x + ts * 1.8 - 12, y + ts * 0.7 * h, 4, ts * 0.3 * h);
          break;
        case 'plant_large':
          ctx.fillStyle = '#4f3f1e';
          ctx.fillRect(x + 16, y + ts * 0.5 * h, 16, ts * 0.35 * h);
          ctx.fillStyle = '#5f4f2e';
          ctx.fillRect(x + 14, y + ts * 0.45 * h, 20, ts * 0.3 * h);
          ctx.fillStyle = '#3a7a3a';
          ctx.fillRect(x + 8, y + ts * 0.1 * h, 32, ts * 0.35 * h);
          ctx.fillStyle = '#4b8f42';
          ctx.fillRect(x + 10, y + ts * 0.08 * h, 28, ts * 0.3 * h);
          ctx.fillStyle = '#5aa050';
          ctx.fillRect(x + 14, y + ts * 0.1 * h, 20, ts * 0.2 * h);
          break;
        default:
          ctx.fillStyle = '#666';
          ctx.fillRect(x + 4, y + 4, ts - 8, ts * 0.7 * h);
          ctx.fillStyle = '#888';
          ctx.fillRect(x + 6, y + 6, ts - 12, ts * 0.6 * h);
          break;
      }
    }

    _renderPlayer(spriteColors) {
      var ctx = this.ctx;
      var ts = this.tileSize;
      var px = this.playerIndoorX * ts - this.camera.x + ts / 2;
      var py = this.playerIndoorY * ts - this.camera.y + ts - 2;

      ctx.fillStyle = 'rgba(0,0,20,0.22)';
      ctx.fillRect(px - 7, py + 1, 14, 1);
      ctx.fillRect(px - 8, py + 2, 16, 2);
      ctx.fillRect(px - 7, py + 4, 14, 1);

      var colors = spriteColors || {
        hair: '#503820',
        skin: '#e8d0b8',
        shirt: '#4070b0',
        pants: '#304060'
      };

      ctx.fillStyle = '#e84040';
      ctx.fillRect(px - 6, py - 31, 7, 3);
      ctx.fillStyle = '#c02828';
      ctx.fillRect(px, py - 31, 7, 3);
      ctx.fillStyle = '#e84040';
      ctx.fillRect(px - 8, py - 28, 8, 2);
      ctx.fillStyle = '#c02828';
      ctx.fillRect(px, py - 28, 8, 2);
      ctx.fillStyle = '#202020';
      ctx.fillRect(px - 7, py - 32, 14, 1);
      ctx.fillRect(px - 8, py - 31, 1, 5);
      ctx.fillRect(px + 7, py - 31, 1, 5);
      ctx.fillRect(px - 8, py - 26, 16, 1);

      ctx.fillStyle = colors.hair;
      ctx.fillRect(px - 6, py - 25, 2, 4);
      ctx.fillRect(px + 4, py - 25, 2, 4);

      ctx.fillStyle = this._lighten(colors.skin);
      ctx.fillRect(px - 4, py - 25, 4, 7);
      ctx.fillStyle = colors.skin;
      ctx.fillRect(px, py - 25, 4, 7);
      ctx.fillStyle = '#202020';
      ctx.fillRect(px - 3, py - 22, 2, 2);
      ctx.fillRect(px + 1, py - 22, 2, 2);
      ctx.fillStyle = this._darken(colors.skin);
      ctx.fillRect(px - 1, py - 19, 2, 1);
      ctx.fillStyle = '#202020';
      ctx.fillRect(px - 6, py - 25, 1, 7);
      ctx.fillRect(px + 5, py - 25, 1, 7);
      ctx.fillRect(px - 5, py - 18, 10, 1);

      ctx.fillStyle = colors.skin;
      ctx.fillRect(px - 2, py - 18, 4, 1);

      ctx.fillStyle = this._lighten(colors.shirt);
      ctx.fillRect(px - 6, py - 17, 6, 8);
      ctx.fillStyle = colors.shirt;
      ctx.fillRect(px, py - 17, 6, 8);
      ctx.fillStyle = this._darken(colors.shirt);
      ctx.fillRect(px + 4, py - 17, 2, 8);
      ctx.fillRect(px - 2, py - 17, 4, 1);
      ctx.fillStyle = '#202020';
      ctx.fillRect(px - 7, py - 17, 1, 8);
      ctx.fillRect(px + 6, py - 17, 1, 8);

      ctx.fillStyle = this._lighten(colors.shirt);
      ctx.fillRect(px - 8, py - 16, 2, 6);
      ctx.fillStyle = this._darken(colors.shirt);
      ctx.fillRect(px + 6, py - 16, 2, 6);
      ctx.fillStyle = this._lighten(colors.skin);
      ctx.fillRect(px - 8, py - 10, 2, 2);
      ctx.fillStyle = this._darken(colors.skin);
      ctx.fillRect(px + 6, py - 10, 2, 2);
      ctx.fillStyle = '#202020';
      ctx.fillRect(px - 9, py - 16, 1, 8);
      ctx.fillRect(px + 8, py - 16, 1, 8);

      ctx.fillStyle = colors.pants;
      ctx.fillRect(px - 5, py - 9, 4, 6);
      ctx.fillStyle = this._darken(colors.pants);
      ctx.fillRect(px - 5, py - 5, 4, 2);
      ctx.fillStyle = colors.pants;
      ctx.fillRect(px + 1, py - 9, 4, 6);
      ctx.fillStyle = this._darken(colors.pants);
      ctx.fillRect(px + 1, py - 5, 4, 2);
      ctx.fillStyle = '#202020';
      ctx.fillRect(px - 6, py - 9, 1, 6);
      ctx.fillRect(px - 1, py - 9, 2, 1);
      ctx.fillRect(px + 5, py - 9, 1, 6);

      ctx.fillStyle = '#202020';
      ctx.fillRect(px - 6, py - 3, 5, 3);
      ctx.fillRect(px + 1, py - 3, 5, 3);
      ctx.fillRect(px - 6, py, 5, 1);
      ctx.fillRect(px + 1, py, 5, 1);
    }

    _lighten(hex) {
      return this._adjust(hex, 30);
    }

    _darken(hex) {
      return this._adjust(hex, -30);
    }

    _adjust(hex, amount) {
      if (!hex || !hex.startsWith('#')) return hex;
      var num = parseInt(hex.replace('#', ''), 16);
      var r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
      var g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
      var b = Math.min(255, Math.max(0, (num & 0xff) + amount));
      return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
  }

  global.IndoorMapEngine = IndoorMapEngine;
})(window);
