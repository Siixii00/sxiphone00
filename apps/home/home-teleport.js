(function (global) {
  'use strict';

  class HomeTeleportSystem {
    constructor(options = {}) {
      this.points = HomeData.TELEPORT_POINTS.map((p) => ({ ...p }));
      this.overlayEl = options.overlayEl || null;
      this.mapCanvas = options.mapCanvas || null;
      this.dialogue = options.dialogue || null;
      this.onTeleport = options.onTeleport || null;
      this.infoEl = options.infoEl || null;
      this.onUnlock = options.onUnlock || null;

      this._onMapClick = (ev) => this._handleMapClick(ev);
      if (this.mapCanvas) this.mapCanvas.addEventListener('click', this._onMapClick);
    }

    open(playerPos) {
      if (!this.overlayEl) return;
      this.overlayEl.classList.remove('hidden');
      this.renderMap(playerPos);
    }

    close() {
      this.overlayEl?.classList.add('hidden');
    }

    unlockAt(x, y) {
      for (let i = 0; i < this.points.length; i++) {
        const p = this.points[i];
        if (!p.unlocked && Math.abs(p.x - x) <= 1 && Math.abs(p.y - y) <= 1) {
          p.unlocked = true;
          this.onUnlock?.(p);
          this.dialogue?.show('系統', '已解鎖傳送點：' + p.name);
        }
      }
    }

    teleportTo(pointId) {
      const p = this.points.find((x) => x.id === pointId && x.unlocked);
      if (!p) return false;
      this.onTeleport?.(p);
      this.close();
      return true;
    }

    getUnlockedMap() {
      const map = {};
      this.points.forEach((p) => { map[p.id] = !!p.unlocked; });
      return map;
    }

    renderMap(playerPos) {
      if (!this.mapCanvas) return;
      const ctx = this.mapCanvas.getContext('2d');
      const w = this.mapCanvas.width;
      const h = this.mapCanvas.height;
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = '#102038';
      ctx.fillRect(0, 0, w, h);

      const scaleX = w / HomeData.MAP_CONFIG.worldWidth;
      const scaleY = h / HomeData.MAP_CONFIG.worldHeight;

      for (let i = 0; i < HomeData.WORLD_REGIONS.length; i++) {
        const r = HomeData.WORLD_REGIONS[i];
        const x = Math.floor(r.x0 * scaleX);
        const y = Math.floor(r.y0 * scaleY);
        const rw = Math.ceil((r.x1 - r.x0) * scaleX);
        const rh = Math.ceil((r.y1 - r.y0) * scaleY);
        ctx.fillStyle = i % 2 ? '#1a3550' : '#173149';
        ctx.fillRect(x, y, rw, rh);
      }

      for (let i = 0; i < this.points.length; i++) {
        const p = this.points[i];
        const x = Math.floor((p.x / HomeData.MAP_CONFIG.worldWidth) * w);
        const y = Math.floor((p.y / HomeData.MAP_CONFIG.worldHeight) * h);
        ctx.fillStyle = p.unlocked ? '#ffd447' : '#666';
        ctx.fillRect(x - 3, y - 3, 6, 6);
      }

      if (playerPos) {
        const px = Math.floor((playerPos.x / HomeData.MAP_CONFIG.worldWidth) * w);
        const py = Math.floor((playerPos.y / HomeData.MAP_CONFIG.worldHeight) * h);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px - 2, py - 2, 4, 4);
      }
    }

    _handleMapClick(ev) {
      if (!this.mapCanvas) return;
      const rect = this.mapCanvas.getBoundingClientRect();
      const x = ((ev.clientX - rect.left) / rect.width) * this.mapCanvas.width;
      const y = ((ev.clientY - rect.top) / rect.height) * this.mapCanvas.height;

      let picked = null;
      let best = Infinity;
      for (let i = 0; i < this.points.length; i++) {
        const p = this.points[i];
        const px = (p.x / HomeData.MAP_CONFIG.worldWidth) * this.mapCanvas.width;
        const py = (p.y / HomeData.MAP_CONFIG.worldHeight) * this.mapCanvas.height;
        const d = Math.hypot(px - x, py - y);
        if (d < best) {
          best = d;
          picked = p;
        }
      }

      if (!picked) return;
      if (!picked.unlocked) {
        if (this.infoEl) this.infoEl.textContent = picked.name + ' 尚未解鎖';
        return;
      }
      if (this.infoEl) this.infoEl.textContent = '傳送至 ' + picked.name;
      this.teleportTo(picked.id);
    }
  }

  global.HomeTeleportSystem = HomeTeleportSystem;
})(window);
