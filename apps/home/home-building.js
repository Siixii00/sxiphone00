(function (global) {
  'use strict';

  class HomeBuildingSystem {
    constructor(options = {}) {
      this.dialogue = options.dialogue || null;
      this.onEnterBuilding = options.onEnterBuilding || null;
      this.onNeedPurchase = options.onNeedPurchase || null;
      this.onOpenShop = options.onOpenShop || null;
      this.ownedBuildingIds = new Set(['player_house']);
      this.currentNearby = null;
      this.roomState = {
        currentBuildingId: null,
        currentRoom: 'living_room',
        ownedFurniture: {
          sofa_basic: 1,
          tv_basic: 1,
          table_tea: 1,
          bed_double: 1,
          wardrobe: 1,
          mirror: 1,
          desk_set: 1,
          bookshelf: 1,
          fridge: 1,
          dining_table: 1,
          plant_large: 1
        },
        furnitureByRoom: {
          living_room: [],
          bedroom: [{ id: 'mirror', x: 5, y: 4 }],
          study: [],
          kitchen: [],
          balcony: [],
          bathroom: []
        }
      };
      this.onOpenMirror = options.onOpenMirror || null;
    }

    getBuildingFootprints() {
      const set = new Set();
      for (let i = 0; i < HomeData.BUILDINGS.length; i++) {
        const b = HomeData.BUILDINGS[i];
        for (let y = 0; y < b.footprint.height; y++) {
          for (let x = 0; x < b.footprint.width; x++) {
            set.add((b.position.x + x) + ',' + (b.position.y + y));
          }
        }
      }
      return set;
    }

    findInteractableNear(player) {
      const offsets = [
        { dx: 0, dy: 1 },
        { dx: 0, dy: -1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 }
      ];
      for (let i = 0; i < HomeData.BUILDINGS.length; i++) {
        const b = HomeData.BUILDINGS[i];
        for (let j = 0; j < offsets.length; j++) {
          const o = offsets[j];
          const px = player.x + o.dx;
          const py = player.y + o.dy;
          if (this._isAtDoorLike(b, px, py)) return b;
        }
      }
      return null;
    }

    async interact(player) {
      const target = this.findInteractableNear(player);
      this.currentNearby = target;
      if (!target) {
        const npc = this.findNpcNear(player);
        if (npc) {
          await this.dialogue?.show(npc.speaker || '居民', npc.text || '你好。');
          return true;
        }
        return false;
      }

      if (target.shopType === 'furniture') {
        this.onOpenShop?.();
        return true;
      }

      const owned = this.ownedBuildingIds.has(target.id) || target.owned;
      if (!owned && target.purchasable) {
        this.onNeedPurchase?.(target);
        return true;
      }

      if (target.enterable) {
        if (owned || target.type !== 'residential') {
          this.onEnterBuilding?.(target.id);
        } else {
          await this.dialogue?.show('系統', '尚未擁有，無法進入。');
        }
        return true;
      }

      await this.dialogue?.show('系統', target.name + ' 目前不可進入。');
      return true;
    }

    markOwned(buildingId) {
      this.ownedBuildingIds.add(buildingId);
    }

    findNpcNear(player) {
      for (let i = 0; i < HomeData.NPC_LIST.length; i++) {
        const n = HomeData.NPC_LIST[i];
        const d = Math.abs(n.x - player.x) + Math.abs(n.y - player.y);
        if (d <= 1) return n;
      }
      return null;
    }

    _isAtDoorLike(building, x, y) {
      const doorX = building.position.x + Math.floor(building.footprint.width / 2);
      const doorY = building.position.y + building.footprint.height;
      return x === doorX && y === doorY;
    }
  }

  global.HomeBuildingSystem = HomeBuildingSystem;
})(window);
