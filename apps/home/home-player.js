(function (global) {
  'use strict';

  var IMPASSABLE = [HomeData.TILE_TYPES.WATER, HomeData.TILE_TYPES.FOREST, HomeData.TILE_TYPES.FENCE];

  // Pokemon Diamond protagonist palette (Sinnoh trainer, Gen IV NDS)
  var P = {
    hair:        '#503820',
    skin:        '#e8d0b8',
    skinLight:   '#f0e0c8',
    skinShadow:  '#d0c0a8',
    shirt:       '#4070b0',
    shirtLight:  '#5080c0',
    shirtShadow: '#305090',
    pants:       '#304060',
    pantsShadow: '#203050',
    shoes:       '#202020',
    outline:     '#202020',
    hat:         '#c02828',
    hatLight:    '#e84040',
    shadow:      'rgba(0,0,20,0.22)'
  };

  class WorldPlayer {
    constructor(options) {
      options = options || {};
      this.x = options.x || 50;
      this.y = options.y || 75;
      this.targetX = this.x;
      this.targetY = this.y;
      this.isMoving = false;
      this.moveProgress = 0;
      this.moveSpeed = 0.09;
      this.runSpeed = 0.15;
      this.direction = 'down';
      this.isRunning = false;
      this.animFrame = 0;
      this.mapData = options.mapData || [];
      this.buildingFootprints = options.buildingFootprints || new Set();
      this.customSprite = null;
      this.spriteColors = null;
    }

    setCustomSprite(spriteData) {
      this.customSprite = spriteData;
    }

    setSpriteColors(colors) {
      this.spriteColors = colors;
    }

    resetToDefault() {
      this.customSprite = null;
      this.spriteColors = null;
    }

    setMapData(mapData) { this.mapData = mapData; }
    setBuildingFootprints(footprints) { this.buildingFootprints = footprints; }

    canMoveTo(x, y) {
      if (x < 0 || y < 0 || x >= HomeData.MAP_CONFIG.worldWidth || y >= HomeData.MAP_CONFIG.worldHeight) return false;
      var t = this.mapData && this.mapData[y] && this.mapData[y][x];
      if (IMPASSABLE.includes(t)) return false;
      if (this.buildingFootprints.has(x + ',' + y)) return false;
      return true;
    }

    move(direction) {
      if (this.isMoving) return false;
      this.direction = direction;
      var dx = direction === 'left' ? -1 : direction === 'right' ? 1 : 0;
      var dy = direction === 'up' ? -1 : direction === 'down' ? 1 : 0;
      var nx = this.x + dx;
      var ny = this.y + dy;
      if (!this.canMoveTo(nx, ny)) return false;
      this.targetX = nx;
      this.targetY = ny;
      this.isMoving = true;
      this.moveProgress = 0;
      return true;
    }

    update() {
      if (this.isMoving) {
        var speed = this.isRunning ? this.runSpeed : this.moveSpeed;
        this.moveProgress += speed;
        if (this.moveProgress >= 1) {
          this.x = this.targetX;
          this.y = this.targetY;
          this.isMoving = false;
          this.moveProgress = 0;
        }
      }
      this.animFrame = (this.animFrame + 1) % 24;
    }

    getRenderPos() {
      return {
        x: this.x + (this.targetX - this.x) * this.moveProgress,
        y: this.y + (this.targetY - this.y) * this.moveProgress
      };
    }

    render(ctx, camera, tileSize) {
      var pos = this.getRenderPos();
      var cx = Math.floor(pos.x * tileSize - camera.x + tileSize / 2);
      var by = Math.floor(pos.y * tileSize - camera.y + tileSize - 2);

      var wf = 0;
      if (this.isMoving) {
        var cycle = this.animFrame % 24;
        if (cycle < 8) wf = 1;
        else if (cycle < 16) wf = 0;
        else wf = 2;
      }

      var palette = this.spriteColors ? this._mergePalette(this.spriteColors) : P;

      ctx.fillStyle = P.shadow;
      ctx.fillRect(cx - 7, by + 1, 14, 1);
      ctx.fillRect(cx - 8, by + 2, 16, 2);
      ctx.fillRect(cx - 7, by + 4, 14, 1);

      var dir = this.direction;
      if (dir === 'down') {
        this._drawFront(ctx, cx, by, wf, palette);
      } else if (dir === 'up') {
        this._drawBack(ctx, cx, by, wf, palette);
      } else if (dir === 'left') {
        this._drawSide(ctx, cx, by, wf, false, palette);
      } else {
        this._drawSide(ctx, cx, by, wf, true, palette);
      }
    }

    _mergePalette(colors) {
      return {
        hair:        colors.hair || P.hair,
        skin:        colors.skin || P.skin,
        skinLight:   this._lighten(colors.skin || P.skin),
        skinShadow:  this._darken(colors.skin || P.skin),
        shirt:       colors.shirt || P.shirt,
        shirtLight:  this._lighten(colors.shirt || P.shirt),
        shirtShadow: this._darken(colors.shirt || P.shirt),
        pants:       colors.pants || P.pants,
        pantsShadow: this._darken(colors.pants || P.pants),
        shoes:       P.shoes,
        outline:     P.outline,
        hat:         P.hat,
        hatLight:    P.hatLight,
        shadow:      P.shadow
      };
    }

    _lighten(hex) {
      return this._adjustBrightness(hex, 30);
    }

    _darken(hex) {
      return this._adjustBrightness(hex, -30);
    }

    _adjustBrightness(hex, amount) {
      var num = parseInt(hex.replace('#', ''), 16);
      var r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
      var g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
      var b = Math.min(255, Math.max(0, (num & 0xff) + amount));
      return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    _drawFront(ctx, cx, by, wf, palette) {
      var P = palette;
      ctx.fillStyle = P.hatLight;
      ctx.fillRect(cx - 7, by - 31, 7, 3);
      ctx.fillStyle = P.hat;
      ctx.fillRect(cx, by - 31, 7, 3);
      ctx.fillStyle = P.hatLight;
      ctx.fillRect(cx - 8, by - 28, 8, 2);
      ctx.fillStyle = P.hat;
      ctx.fillRect(cx, by - 28, 8, 2);
      ctx.fillStyle = P.outline;
      ctx.fillRect(cx - 7, by - 32, 14, 1);
      ctx.fillRect(cx - 8, by - 31, 1, 5);
      ctx.fillRect(cx + 7, by - 31, 1, 5);
      ctx.fillRect(cx - 8, by - 26, 16, 1);

      ctx.fillStyle = P.hair;
      ctx.fillRect(cx - 6, by - 25, 2, 4);
      ctx.fillRect(cx + 4, by - 25, 2, 4);

      ctx.fillStyle = P.skinLight;
      ctx.fillRect(cx - 4, by - 25, 4, 7);
      ctx.fillStyle = P.skin;
      ctx.fillRect(cx, by - 25, 4, 7);
      ctx.fillStyle = P.outline;
      ctx.fillRect(cx - 3, by - 22, 2, 2);
      ctx.fillRect(cx + 1, by - 22, 2, 2);
      ctx.fillStyle = P.skinShadow;
      ctx.fillRect(cx - 1, by - 19, 2, 1);
      ctx.fillStyle = P.outline;
      ctx.fillRect(cx - 6, by - 25, 1, 7);
      ctx.fillRect(cx + 5, by - 25, 1, 7);
      ctx.fillRect(cx - 5, by - 18, 10, 1);

      ctx.fillStyle = P.skin;
      ctx.fillRect(cx - 2, by - 18, 4, 1);

      ctx.fillStyle = P.shirtLight;
      ctx.fillRect(cx - 6, by - 17, 6, 8);
      ctx.fillStyle = P.shirt;
      ctx.fillRect(cx, by - 17, 6, 8);
      ctx.fillStyle = P.shirtShadow;
      ctx.fillRect(cx + 4, by - 17, 2, 8);
      ctx.fillStyle = P.shirtShadow;
      ctx.fillRect(cx - 2, by - 17, 4, 1);
      ctx.fillStyle = P.outline;
      ctx.fillRect(cx - 7, by - 17, 1, 8);
      ctx.fillRect(cx + 6, by - 17, 1, 8);

      ctx.fillStyle = P.shirtLight;
      ctx.fillRect(cx - 8, by - 16, 2, 6);
      ctx.fillStyle = P.shirtShadow;
      ctx.fillRect(cx + 6, by - 16, 2, 6);
      ctx.fillStyle = P.skinLight;
      ctx.fillRect(cx - 8, by - 10, 2, 2);
      ctx.fillStyle = P.skinShadow;
      ctx.fillRect(cx + 6, by - 10, 2, 2);
      ctx.fillStyle = P.outline;
      ctx.fillRect(cx - 9, by - 16, 1, 8);
      ctx.fillRect(cx + 8, by - 16, 1, 8);
      ctx.fillRect(cx - 8, by - 8, 2, 1);
      ctx.fillRect(cx + 6, by - 8, 2, 1);

      var oL = 0, oR = 0;
      if (wf === 1) { oL = 1; oR = -1; }
      if (wf === 2) { oL = -1; oR = 1; }
      ctx.fillStyle = P.pants;
      ctx.fillRect(cx - 5, by - 9, 4, 6 + oL);
      ctx.fillStyle = P.pantsShadow;
      ctx.fillRect(cx - 5, by - 5, 4, 2 + oL);
      ctx.fillStyle = P.pants;
      ctx.fillRect(cx + 1, by - 9, 4, 6 + oR);
      ctx.fillStyle = P.pantsShadow;
      ctx.fillRect(cx + 1, by - 5, 4, 2 + oR);
      ctx.fillStyle = P.outline;
      ctx.fillRect(cx - 6, by - 9, 1, 6 + oL);
      ctx.fillRect(cx - 1, by - 9, 2, 1);
      ctx.fillRect(cx + 5, by - 9, 1, 6 + oR);

      var syL = by - 3 + oL;
      var syR = by - 3 + oR;
      ctx.fillStyle = P.shoes;
      ctx.fillRect(cx - 6, syL, 5, 3);
      ctx.fillRect(cx + 1, syR, 5, 3);
      ctx.fillStyle = P.outline;
      ctx.fillRect(cx - 6, syL + 3, 5, 1);
      ctx.fillRect(cx + 1, syR + 3, 5, 1);
    }

    _drawBack(ctx, cx, by, wf, palette) {
      var P = palette;
      ctx.fillStyle = P.hatLight;
      ctx.fillRect(cx - 7, by - 31, 7, 3);
      ctx.fillStyle = P.hat;
      ctx.fillRect(cx, by - 31, 7, 3);
      ctx.fillStyle = P.hatLight;
      ctx.fillRect(cx - 8, by - 28, 8, 2);
      ctx.fillStyle = P.hat;
      ctx.fillRect(cx, by - 28, 8, 2);
      ctx.fillStyle = P.outline;
      ctx.fillRect(cx - 7, by - 32, 14, 1);
      ctx.fillRect(cx - 8, by - 31, 1, 5);
      ctx.fillRect(cx + 7, by - 31, 1, 5);
      ctx.fillRect(cx - 8, by - 26, 16, 1);

      ctx.fillStyle = P.hair;
      ctx.fillRect(cx - 5, by - 25, 10, 7);
      ctx.fillStyle = P.outline;
      ctx.fillRect(cx - 6, by - 25, 1, 7);
      ctx.fillRect(cx + 5, by - 25, 1, 7);
      ctx.fillRect(cx - 5, by - 18, 10, 1);

      ctx.fillStyle = P.shirtLight;
      ctx.fillRect(cx - 6, by - 17, 6, 8);
      ctx.fillStyle = P.shirt;
      ctx.fillRect(cx, by - 17, 6, 8);
      ctx.fillStyle = P.shirtShadow;
      ctx.fillRect(cx + 4, by - 17, 2, 8);
      ctx.fillStyle = P.shirtShadow;
      ctx.fillRect(cx - 1, by - 16, 2, 6);
      ctx.fillStyle = P.outline;
      ctx.fillRect(cx - 7, by - 17, 1, 8);
      ctx.fillRect(cx + 6, by - 17, 1, 8);

      ctx.fillStyle = P.shirtLight;
      ctx.fillRect(cx - 8, by - 16, 2, 6);
      ctx.fillStyle = P.shirtShadow;
      ctx.fillRect(cx + 6, by - 16, 2, 6);
      ctx.fillStyle = P.skinLight;
      ctx.fillRect(cx - 8, by - 10, 2, 2);
      ctx.fillStyle = P.skinShadow;
      ctx.fillRect(cx + 6, by - 10, 2, 2);
      ctx.fillStyle = P.outline;
      ctx.fillRect(cx - 9, by - 16, 1, 8);
      ctx.fillRect(cx + 8, by - 16, 1, 8);
      ctx.fillRect(cx - 8, by - 8, 2, 1);
      ctx.fillRect(cx + 6, by - 8, 2, 1);

      var oL = 0, oR = 0;
      if (wf === 1) { oL = 1; oR = -1; }
      if (wf === 2) { oL = -1; oR = 1; }
      ctx.fillStyle = P.pants;
      ctx.fillRect(cx - 5, by - 9, 4, 6 + oL);
      ctx.fillStyle = P.pantsShadow;
      ctx.fillRect(cx - 5, by - 5, 4, 2 + oL);
      ctx.fillStyle = P.pants;
      ctx.fillRect(cx + 1, by - 9, 4, 6 + oR);
      ctx.fillStyle = P.pantsShadow;
      ctx.fillRect(cx + 1, by - 5, 4, 2 + oR);
      ctx.fillStyle = P.outline;
      ctx.fillRect(cx - 6, by - 9, 1, 6 + oL);
      ctx.fillRect(cx - 1, by - 9, 2, 1);
      ctx.fillRect(cx + 5, by - 9, 1, 6 + oR);

      var syL = by - 3 + oL;
      var syR = by - 3 + oR;
      ctx.fillStyle = P.shoes;
      ctx.fillRect(cx - 6, syL, 5, 3);
      ctx.fillRect(cx + 1, syR, 5, 3);
      ctx.fillStyle = P.outline;
      ctx.fillRect(cx - 6, syL + 3, 5, 1);
      ctx.fillRect(cx + 1, syR + 3, 5, 1);
    }

    _drawSide(ctx, cx, by, wf, facingRight, palette) {
      var P = palette;
      var hatF  = facingRight ? P.hat       : P.hatLight;
      var hatB  = facingRight ? P.hatLight   : P.hat;
      var skinF = facingRight ? P.skin       : P.skinLight;
      var skinB = facingRight ? P.skinShadow : P.skin;
      var bodyF = facingRight ? P.shirt      : P.shirtLight;
      var bodyB = facingRight ? P.shirtShadow : P.shirt;

      ctx.fillStyle = hatF;
      ctx.fillRect(cx - 6, by - 31, 12, 3);
      ctx.fillStyle = hatB;
      if (facingRight) {
        ctx.fillRect(cx - 6, by - 31, 5, 3);
      } else {
        ctx.fillRect(cx + 1, by - 31, 5, 3);
      }
      ctx.fillStyle = hatF;
      ctx.fillRect(cx - 8, by - 28, 16, 2);
      ctx.fillStyle = P.outline;
      if (facingRight) {
        ctx.fillRect(cx + 8, by - 29, 2, 2);
      } else {
        ctx.fillRect(cx - 10, by - 29, 2, 2);
      }
      ctx.fillStyle = P.outline;
      ctx.fillRect(cx - 6, by - 32, 12, 1);
      ctx.fillRect(cx - 7, by - 31, 1, 5);
      ctx.fillRect(cx + 6, by - 31, 1, 5);
      ctx.fillRect(cx - 8, by - 26, 16, 1);

      ctx.fillStyle = P.hair;
      if (facingRight) {
        ctx.fillRect(cx - 5, by - 25, 3, 6);
      } else {
        ctx.fillRect(cx + 2, by - 25, 3, 6);
      }

      ctx.fillStyle = skinF;
      ctx.fillRect(cx - 4, by - 25, 8, 7);
      ctx.fillStyle = skinB;
      if (facingRight) {
        ctx.fillRect(cx - 4, by - 25, 4, 7);
      } else {
        ctx.fillRect(cx, by - 25, 4, 7);
      }
      ctx.fillStyle = P.outline;
      if (facingRight) {
        ctx.fillRect(cx + 2, by - 23, 2, 2);
      } else {
        ctx.fillRect(cx - 4, by - 23, 2, 2);
      }
      ctx.fillStyle = P.skinShadow;
      if (facingRight) {
        ctx.fillRect(cx + 4, by - 22, 1, 2);
      } else {
        ctx.fillRect(cx - 5, by - 22, 1, 2);
      }
      ctx.fillStyle = P.outline;
      ctx.fillRect(cx - 5, by - 25, 1, 7);
      ctx.fillRect(cx + 4, by - 25, 1, 7);
      ctx.fillRect(cx - 4, by - 18, 8, 1);

      ctx.fillStyle = bodyF;
      ctx.fillRect(cx - 5, by - 17, 10, 8);
      ctx.fillStyle = bodyB;
      if (facingRight) {
        ctx.fillRect(cx - 5, by - 17, 4, 8);
      } else {
        ctx.fillRect(cx + 1, by - 17, 4, 8);
      }
      ctx.fillStyle = P.outline;
      ctx.fillRect(cx - 6, by - 17, 1, 8);
      ctx.fillRect(cx + 5, by - 17, 1, 8);

      var armSwing = 0;
      if (wf === 1) armSwing = -1;
      if (wf === 2) armSwing = 1;
      var armY = by - 16 + armSwing;

      if (facingRight) {
        ctx.fillStyle = P.shirt;
        ctx.fillRect(cx + 4, armY, 2, 6);
        ctx.fillStyle = P.skin;
        ctx.fillRect(cx + 4, armY + 6, 2, 2);
        ctx.fillStyle = P.outline;
        ctx.fillRect(cx + 6, armY, 1, 8);
        ctx.fillRect(cx + 4, armY + 8, 2, 1);
      } else {
        ctx.fillStyle = P.shirtLight;
        ctx.fillRect(cx - 6, armY, 2, 6);
        ctx.fillStyle = P.skinLight;
        ctx.fillRect(cx - 6, armY + 6, 2, 2);
        ctx.fillStyle = P.outline;
        ctx.fillRect(cx - 7, armY, 1, 8);
        ctx.fillRect(cx - 6, armY + 8, 2, 1);
      }

      var oF = 0, oB = 0;
      if (wf === 1) { oF = 1; oB = -1; }
      if (wf === 2) { oF = -1; oB = 1; }
      ctx.fillStyle = P.pants;
      ctx.fillRect(cx - 3, by - 9, 6, 6 + oF);
      ctx.fillStyle = P.pantsShadow;
      ctx.fillRect(cx - 3, by - 5, 6, 2 + oF);
      ctx.fillStyle = P.outline;
      ctx.fillRect(cx - 4, by - 9, 1, 6 + oF);
      ctx.fillRect(cx + 3, by - 9, 1, 6 + oF);
      if (facingRight) {
        ctx.fillStyle = P.pantsShadow;
        ctx.fillRect(cx - 5, by - 9, 2, 6 + oB);
        ctx.fillStyle = P.outline;
        ctx.fillRect(cx - 6, by - 9, 1, 6 + oB);
      } else {
        ctx.fillStyle = P.pantsShadow;
        ctx.fillRect(cx + 3, by - 9, 2, 6 + oB);
        ctx.fillStyle = P.outline;
        ctx.fillRect(cx + 5, by - 9, 1, 6 + oB);
      }

      var syF = by - 3 + oF;
      var syB = by - 3 + oB;
      ctx.fillStyle = P.shoes;
      ctx.fillRect(cx - 4, syF, 7, 3);
      ctx.fillStyle = P.outline;
      ctx.fillRect(cx - 4, syF + 3, 7, 1);
      ctx.fillStyle = P.shoes;
      if (facingRight) {
        ctx.fillRect(cx - 6, syB, 3, 3);
        ctx.fillStyle = P.outline;
        ctx.fillRect(cx - 6, syB + 3, 3, 1);
      } else {
        ctx.fillRect(cx + 3, syB, 3, 3);
        ctx.fillStyle = P.outline;
        ctx.fillRect(cx + 3, syB + 3, 3, 1);
      }
    }
  }

  global.WorldPlayer = WorldPlayer;
})(window);
