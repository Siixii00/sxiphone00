(function() {
  'use strict';

  /* ==================== CONSTANTS ==================== */
  const STORAGE_KEY = 'sx_widget_layout';
  const APP_LAYOUT_KEY = 'sx_app_layout';
  const HIDDEN_APPS_KEY = 'sx_hidden_apps';
  const PAGE_SIZE_KEY = 'sx_home_page_size';

  const WIDGET_STYLES = ['glass', 'solid', 'minimal', 'vintage', 'neon'];

  const PALETTE_COLORS = [
    { hex: '#0f1118', label: '深空黑' },
    { hex: '#1c1c1e', label: '石墨' },
    { hex: '#2c2c2e', label: '深灰' },
    { hex: '#000000', label: '純黑' },
    { hex: '#ffffff', label: '純白' },
    { hex: '#0A84FF', label: 'iOS藍' },
    { hex: '#30D158', label: '綠' },
    { hex: '#FF9F0A', label: '橙' },
    { hex: '#FF453A', label: '紅' },
    { hex: '#BF5AF2', label: '紫' },
    { hex: '#FF2D55', label: '粉' },
    { hex: '#64D2FF', label: '天藍' },
    { hex: '#FFD60A', label: '黃' },
    { hex: '#AC8E68', label: '沙金' },
    { hex: '#1a1a2e', label: '午夜' },
    { hex: '#16213e', label: '深藍' },
    { hex: '#0f3460', label: '海軍藍' },
    { hex: '#533483', label: '暗紫' },
    { hex: '#1DB954', label: 'Spotify綠' },
    { hex: '#5856D6', label: '靛藍' },
  ];

  // 所有應用程式定義
  const ALL_APPS = [
    { id: 'chat', label: '聊天', icon: 'fa-comment', color: 'linear-gradient(135deg,#4facfe,#00f2fe)', cat: 'social' },
    { id: 'settings', label: '設定', icon: 'fa-gear', color: '#8e8e93', cat: 'tools' },
    { id: 'album', label: '相簿', icon: 'fa-photo-library', color: 'linear-gradient(135deg,#ff9a9e,#fecfef)', cat: 'media' },
    { id: 'touch', label: '輔助觸控', icon: 'fa-hand-pointer', color: '#444', cat: 'tools' },
    { id: 'worldbook', label: '世界書', icon: 'fa-book', color: 'linear-gradient(145deg, #5856D6, #3634A3)', cat: 'life' },
    { id: 'pomodoro', label: '番茄鐘', icon: 'fa-clock', color: '#f25f5c', cat: 'tools' },
    { id: 'weather', label: '天氣', icon: 'fa-cloud-sun', color: '#4facfe', cat: 'tools' },
    { id: 'twitter', label: '推特', icon: 'fa-x-twitter', color: '#1da1f2', cat: 'social' },
    { id: 'facebook', label: '臉書', icon: 'fa-facebook-f', color: '#1877f2', cat: 'social' },
    { id: 'chrome', label: 'Chrome', icon: 'fa-chrome', color: '#fbbc05', cat: 'media' },
    { id: 'bilibili', label: 'bilibili', icon: 'fa-tv', color: '#00a1d6', cat: 'media' },
    { id: 'youtube', label: 'YouTube', icon: 'fa-youtube', color: '#ff0000', cat: 'media' },
    { id: 'exchange-diary', label: '交換日記', icon: 'fa-book-open', color: '#9c27b0', cat: 'life' },
    { id: 'lofter', label: 'lofter', icon: 'fa-pen', color: '#4e9a51', cat: 'social' },
    { id: 'drift-bottle', label: '漂流瓶', icon: 'fa-bottle-water', color: '#2d9cdb', cat: 'life' },
    { id: 'match-3', label: '消消樂', icon: 'fa-gamepad', color: '#ff8a3d', cat: 'life' },
    { id: 'bubbles', label: 'bubbles', icon: 'fa-comments', color: '#6c63ff', cat: 'social' },
    { id: 'weverse', label: 'weverse', icon: 'fa-users', color: '#20c997', cat: 'social' },
    { id: 'daily-recipe', label: '每日食譜', icon: 'fa-utensils', color: '#ffb347', cat: 'life' },
    { id: 'music', label: '音樂', icon: 'fa-music', color: '#ff5f9f', cat: 'media' },
    { id: 'delivery', label: '外送', icon: 'fa-motorcycle', color: '#ff7043', cat: 'life' },
    { id: 'taobao', label: '購物', icon: 'fa-shopping-bag', color: '#6366f1', cat: 'life' },
    { id: 'dating', label: '約會', icon: 'fa-heart', color: '#e91e63', cat: 'life' },
    { id: 'guzi-guide', label: '谷子圖鑒', icon: 'fa-leaf', color: '#7cb342', cat: 'life' },
    { id: 'smart-painter', label: '照相館', icon: 'fa-palette', color: '#8e44ad', cat: 'tools' },
    { id: 'instagram', label: 'Instagram', icon: 'fa-instagram', color: '#c13584', cat: 'social' },
    { id: 'timetree', label: 'timetree', icon: 'fa-calendar-days', color: '#2ecc71', cat: 'tools' },
    { id: 'pub', label: '酒館', icon: 'fa-martini-glass', color: '#c49b45', cat: 'life' },
    { id: 'kakaopay', label: 'kakaopay', icon: 'fa-wallet', color: '#f7d300', cat: 'tools' },
    { id: 'widget', label: 'widget', icon: 'fa-grip', color: '#5561ff', cat: 'tools' },
    { id: 'twitch', label: 'twitch', icon: 'fa-twitch', color: '#9146ff', cat: 'media' },
    { id: 'appearance', label: '外觀', icon: 'fa-wand-magic-sparkles', color: 'linear-gradient(135deg,#5B8DEF,#A855F7)', cat: 'tools' },
    { id: 'ao3', label: 'AO3', icon: 'fa-book-bookmark', color: 'linear-gradient(135deg,#ff5f6d,#ffc371)', cat: 'media' },
    { id: 'phone', label: '電話', icon: 'fa-phone', color: '#1ec06b', cat: 'tools' },
    { id: 'passkey', label: 'Passkey', icon: 'fa-key', color: 'linear-gradient(135deg,#6a11cb,#2575fc)', cat: 'tools' },
    { id: 'theater', label: '劇場', icon: 'fa-film', color: 'linear-gradient(135deg,#e50914,#b20710)', cat: 'media' },
    { id: 'arcade', label: '街機廳', icon: 'fa-gamepad', color: 'linear-gradient(135deg,#ff6b6b,#feca57)', cat: 'life' },
    { id: 'personal-wiki', label: '個人紀錄', icon: 'fa-folder-open', color: 'linear-gradient(135deg,#667eea,#764ba2)', cat: 'life' },
  ];

  const APPS = [
    { id: 'weather', label: '天氣', icon: 'fa-cloud-sun' },
    { id: 'music', label: '音樂', icon: 'fa-music' },
    { id: 'calendar', label: '行事曆', icon: 'fa-calendar' },
    { id: 'album', label: '相簿', icon: 'fa-image' },
    { id: 'chat', label: '聊天', icon: 'fa-comment' },
    { id: 'notes', label: '筆記', icon: 'fa-note-sticky' },
    { id: 'timer', label: '計時器', icon: 'fa-stopwatch' },
    { id: 'pomodoro', label: '番茄鐘', icon: 'fa-clock' },
    { id: 'weather-detail', label: '天氣詳', icon: 'fa-cloud' },
    { id: 'contacts', label: '通訊錄', icon: 'fa-address-book' },
    { id: 'settings', label: '設定', icon: 'fa-gear' },
    { id: 'smart-painter', label: '照相館', icon: 'fa-palette' },
  ];

  /* ==================== WIDGET DEFINITIONS ==================== */
  const WIDGET_DEFS = {

    /* ---- 時鐘 ---- */
    'clock-digital': {
      name: '數位時鐘', cat: 'clock', sizes: ['1x1','2x1','4x1'], preview: 'lib-preview-clock',
      render(w) {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = now.getSeconds();
        const isAM = now.getHours() < 12;
        const hour = now.getHours();
        
        let gradient;
        if (hour >= 6 && hour < 9) {
          gradient = 'linear-gradient(135deg, #FF6B35, #FF8E53)';
        } else if (hour >= 9 && hour < 17) {
          gradient = 'linear-gradient(135deg, #4A90E2, #357ABD)';
        } else if (hour >= 17 && hour < 20) {
          gradient = 'linear-gradient(135deg, #834D9B, #D04ED6)';
        } else {
          gradient = 'linear-gradient(135deg, #0F2027, #203A43)';
        }
        
        if (w.size === '4x1') {
          return `<div class="widget-clock-lg" style="background: ${gradient}">
            <span class="widget-time-lg">${hours}:${minutes}</span>
            <span class="widget-am-pm">${isAM ? 'AM' : 'PM'}</span>
            <span class="widget-date-lg">${fmtDate()}</span>
            <div class="widget-seconds-bar" style="width: ${(seconds / 60) * 100}%"></div>
          </div>`;
        }
        const t = fmtTime();
        const d = fmtDate();
        if (w.size === '1x1') return `<span class="widget-time-sm">${t}</span>`;
        return `<span class="widget-time">${t}</span><span class="widget-date">${d}</span>`;
      }
    },
    'clock-analog': {
      name: '類比時鐘', cat: 'clock', sizes: ['2x2','4x2'], preview: 'lib-preview-analog',
      render(w) {
        const now = new Date();
        const h = now.getHours() % 12; const m = now.getMinutes();
        const s = now.getSeconds();
        const hDeg = (h * 30 + m * 0.5);
        const mDeg = m * 6;
        const sDeg = s * 6;
        return `<div class="widget-ana-clock">
          <div class="hand hour-hand" style="transform:rotate(${hDeg}deg)"></div>
          <div class="hand min-hand" style="transform:rotate(${mDeg}deg)"></div>
          <div class="hand sec-hand" style="transform:rotate(${sDeg}deg)"></div>
        </div>
        <span class="widget-date">${fmtDate()}</span>`;
      }
    },
    'clock-world': {
      name: '世界時鐘', cat: 'clock', sizes: ['2x2','4x2'], preview: 'lib-preview-world',
      render(w) {
        const cities = getWorldClockCities();
        return `<div class="widget-world-clock-row">${cities.map(c => `
          <div class="widget-world-clock-city">
            <span class="widget-world-clock-city-name">${c.name}</span>
            <span class="widget-world-clock-time">${c.time}</span>
          </div>`).join('')}</div>`;
      }
    },
    'clock-alarm': {
      name: '鬧鐘', cat: 'clock', sizes: ['2x1','2x2'], preview: 'lib-preview-mini',
      render(w) {
        const saved = localStorage.getItem('sx_alarm_next');
        let next = saved || '08:00'; let label = '下一個鬧鐘';
        if (saved) {
          const diff = Math.max(0, new Date(saved).getTime() - Date.now());
          const h = Math.floor(diff / 3600000);
          const m = Math.floor((diff % 3600000) / 60000);
          label = `後 ${h}小時${m}分`;
        }
        return `<i class="fas fa-bell widget-icon-fa" style="color:var(--warning)"></i>
          <span class="widget-time-sm">${next}</span>
          <span class="widget-label">${label}</span>`;
      }
    },
    'date': {
      name: '日期', cat: 'calendar', sizes: ['1x1','2x1','2x2'], preview: 'lib-preview-date',
      render(w) {
        const now = new Date();
        const day = now.getDate();
        const months = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];
        const weekdays = ['日','一','二','三','四','五','六'];
        if (w.size === '1x1') return `<span class="widget-day-num">${day}</span>`;
        if (w.size === '2x2') return `<span class="widget-day-num" style="font-size:3rem">${day}</span><span class="widget-month-yr">${months[now.getMonth()]} ${now.getFullYear()}</span><span class="widget-weekday">星期${weekdays[now.getDay()]}</span>`;
        return `<span class="widget-day-num">${day}</span><span class="widget-month-yr">${months[now.getMonth()]}${now.getDate()}</span>`;
      }
    },
    'calendar-monthly': {
      name: '月曆', cat: 'calendar', sizes: ['2x2','4x2'], preview: 'lib-preview-cal',
      render(w) {
        const now = new Date();
        const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
        const wkdays = ['日','一','二','三','四','五','六'];
        const first = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        let cells = wkdays.map(d => `<span class="cal-hdr">${d}</span>`).join('');
        for (let i = 0; i < first; i++) cells += '<span></span>';
        for (let d = 1; d <= daysInMonth; d++) {
          const isToday = d === now.getDate() ? ' cal-today' : '';
          cells += `<span class="cal-day${isToday}">${d}</span>`;
        }
        return `<div class="widget-cal-header">${months[now.getMonth()]} ${now.getFullYear()}</div>
          <div class="widget-cal-grid">${cells}</div>`;
      }
    },
    'calendar-agenda': {
      name: '行事曆', cat: 'calendar', sizes: ['2x2','4x2'], preview: 'lib-preview-mini',
      render(w) {
        const events = getTodayEvents();
        const now = new Date();
        const h = now.getHours(); const m = now.getMinutes();
        const timeStr = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
        return `<div class="widget-cal-header" style="justify-content:space-between"><span>今日行程</span><span style="font-weight:600">${events.length}則</span></div>
          <div style="display:flex;flex-direction:column;gap:5px;width:100%">
          ${events.slice(0,3).map(e => `<div style="display:flex;align-items:center;gap:8px;font-size:0.68rem">
            <span style="color:var(--text-tertiary);width:36px">${e.time || timeStr}</span>
            <span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${e.title}</span>
          </div>`).join('')}
          ${events.length === 0 ? '<span class="widget-label" style="text-align:center;padding:8px">今天沒有行程</span>' : ''}
          </div>`;
      }
    },
    'lunar': {
      name: '農曆', cat: 'calendar', sizes: ['1x1','2x1'], preview: 'lib-preview-moon',
      render(w) {
        const lunar = getLunarInfo();
        return `<span class="widget-moon-phase">${lunar.emoji}</span>
          <span class="widget-label">${lunar.dateStr}</span>`;
      }
    },
    'weather-current': {
      name: '天氣', cat: 'weather', sizes: ['2x2','4x2'], preview: 'lib-preview-weather',
      render(w) {
        const d = getWeatherData();
        if (w.size === '4x2') {
          return `<div style="display:flex;align-items:center;gap:10px;width:100%">
            <div class="widget-weather-hero"><span class="widget-temp-lg">${d.temp}</span><span style="font-size:1.2rem">${d.icon}</span></div>
            <div class="widget-weather-detail" style="gap:6px">
              <div class="widget-weather-detail-row"><i class="fas fa-location-dot widget-weather-detail-icon"></i><span>${d.location}</span></div>
              <div class="widget-weather-detail-row"><i class="fas fa-arrow-up widget-weather-detail-icon"></i><span>H:${d.high} L:${d.low}</span></div>
              <div class="widget-weather-detail-row"><i class="fas fa-cloud-rain widget-weather-detail-icon"></i><span>${d.rain}%</span></div>
            </div>
          </div>
          <div class="widget-weather-grid" style="width:100%">${d.hourly.slice(0,4).map(h => `
            <div class="widget-weather-grid-cell"><span class="time">${h.time}</span><span class="icon">${h.icon}</span><span class="temp">${h.temp}</span></div>`).join('')}</div>`;
        }
        return `<div class="widget-weather-hero"><span class="widget-temp-lg">${d.temp}</span><span style="font-size:1.8rem">${d.icon}</span></div>
          <span class="widget-date">${d.location}</span>
          <span class="widget-label">H:${d.high} L:${d.low}</span>`;
      }
    },
    'weather-hourly': {
      name: '逐時天氣', cat: 'weather', sizes: ['4x2'], preview: 'lib-preview-weather-grid',
      render(w) {
        const d = getWeatherData();
        return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <span style="font-size:1.1rem;font-weight:700">${d.temp}</span><span style="font-size:1.4rem">${d.icon}</span>
          <span style="font-size:0.7rem;color:var(--text-secondary)">${d.location}</span>
        </div>
        <div class="widget-weather-grid" style="width:100%">${d.hourly.slice(0,6).map(h => `
          <div class="widget-weather-grid-cell"><span class="t">${h.time}</span><span class="i">${h.icon}</span><span class="v">${h.temp}</span></div>`).join('')}</div>`;
      }
    },
    'weather-uv': {
      name: '紫外線', cat: 'weather', sizes: ['1x1','2x1'], preview: 'lib-preview-mini',
      render(w) {
        const uv = getUVIndex();
        return `<i class="fas fa-sun widget-icon-fa" style="color:${uv.color}"></i>
          <span class="widget-value-sm">UV ${uv.value}</span>
          <span class="widget-label-sm">${uv.label}</span>`;
      }
    },
    'weather-wind': {
      name: '風速', cat: 'weather', sizes: ['1x1','2x1'], preview: 'lib-preview-mini',
      render(w) {
        const wind = getWindData();
        return `<i class="fas fa-wind widget-icon-fa"></i>
          <span class="widget-value-sm">${wind.speed}</span>
          <span class="widget-label-sm">${wind.dir}</span>`;
      }
    },
    'weather-aqi': {
      name: '空氣品質', cat: 'weather', sizes: ['2x1','2x2'], preview: 'lib-preview-aqi',
      render(w) {
        const aqi = getAQI();
        if (w.size === '2x2') {
          return `<div style="display:flex;flex-direction:column;gap:8px;width:100%">
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:2.2rem;font-weight:800">${aqi.value}</span>
              <div style="display:flex;flex-direction:column">
                <span style="font-size:0.85rem;font-weight:700;color:${aqi.color}">${aqi.label}</span>
                <span style="font-size:0.65rem;color:var(--text-secondary)">${aqi.station}</span>
              </div>
            </div>
            <div class="widget-aqi-bar"><div class="widget-aqi-marker" style="left:${aqi.pct}%"></div></div>
            <div style="display:flex;justify-content:space-between;font-size:0.58rem;color:var(--text-tertiary)">
              <span>優</span><span>良</span><span>中等</span><span>不良</span><span>惡劣</span>
            </div>
          </div>`;
        }
        return `<i class="fas fa-leaf widget-icon-fa" style="color:${aqi.color}"></i>
          <span class="widget-value-sm">${aqi.value}</span>
          <span class="widget-label-sm">${aqi.label}</span>`;
      }
    },
    'steps': {
      name: '步數', cat: 'activity', sizes: ['1x1','2x1'], preview: 'lib-preview-steps',
      render(w) {
        const steps = getStepsData();
        const pct = Math.min(100, Math.round(steps.count / steps.goal * 100));
        const circ = 2 * Math.PI * 20;
        const offset = circ * (1 - pct / 100);
        return `<div class="widget-step-ring">
          <svg viewBox="0 0 52 52"><circle class="bg" cx="26" cy="26" r="20"/><circle class="fg" cx="26" cy="26" r="20" style="stroke-dasharray:${circ};stroke-dashoffset:${offset}"/></svg>
          <span style="position:absolute;font-size:0.65rem;font-weight:700">${steps.count.toLocaleString()}</span>
        </div>
        <span class="widget-label">${steps.goal.toLocaleString()} 目標</span>`;
      }
    },
    'activity-rings': {
      name: '活動環', cat: 'activity', sizes: ['2x2','4x2'], preview: 'lib-preview-ring',
      render(w) {
        const rings = getActivityRings();
        const circs = [
          { r: 36, pct: rings.move, color: 'var(--pink)', label: '移動' },
          { r: 27, pct: rings.exercise, color: '#A0E55A', label: '運動' },
          { r: 18, pct: rings.stand, color: 'var(--teal)', label: '站立' },
        ];
        return `<div class="widget-activity-ring-group">
          ${circs.map(c => {
            const circumference = 2 * Math.PI * c.r;
            const offset = circumference * (1 - c.pct / 100);
            return `<div class="activity-ring-single">
              <svg viewBox="0 0 ${c.r*2} ${c.r*2}"><circle class="bg" cx="${c.r}" cy="${c.r}" r="${c.r}"/><circle class="fg" cx="${c.r}" cy="${c.r}" r="${c.r}" style="stroke-dasharray:${circumference};stroke-dashoffset:${offset};stroke:${c.color}"/></svg>
              <span class="lbl">${c.label}<br>${c.pct}%</span>
            </div>`;
          }).join('')}
        </div>`;
      }
    },
    'sleep': {
      name: '睡眠', cat: 'activity', sizes: ['2x1','2x2'], preview: 'lib-preview-sleep',
      render(w) {
        const sleep = getSleepData();
        return `<div style="display:flex;align-items:center;gap:10px;width:100%">
          <i class="fas fa-moon widget-icon-fa" style="color:var(--indigo)"></i>
          <div style="display:flex;flex-direction:column;gap:3px">
            <span class="widget-value">${sleep.duration}</span>
            <span class="widget-label">睡眠時數</span>
          </div>
        </div>
        <div class="widget-sleep-bar" style="width:100%">
          <div class="deep" style="width:${sleep.deep}%"></div>
          <div class="light" style="width:${sleep.light}%"></div>
          <div class="rem" style="width:${sleep.rem}%"></div>
          <div class="awake" style="width:${sleep.awake}%"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:0.6rem;color:var(--text-tertiary);width:100%">
          <span style="color:var(--indigo)">深睡${sleep.deep}%</span>
          <span style="color:var(--teal)">淺睡${sleep.light}%</span>
          <span style="color:var(--purple)">REM${sleep.rem}%</span>
        </div>`;
      }
    },
    'heart-rate': {
      name: '心率', cat: 'activity', sizes: ['1x1','2x1'], preview: 'lib-preview-mini',
      render(w) {
        const hr = getHeartRate();
        return `<i class="fas fa-heart widget-icon-fa" style="color:var(--pink)"></i>
          <span class="widget-value-sm">${hr} BPM</span>
          <span class="widget-label">心率</span>`;
      }
    },
    'water': {
      name: '喝水', cat: 'activity', sizes: ['1x1'], preview: 'lib-preview-mini',
      render(w) {
        const water = getWaterIntake();
        return `<i class="fas fa-glass-water widget-icon-fa" style="color:var(--teal)"></i>
          <span class="widget-value-sm">${water.cups}</span>
          <span class="widget-label-sm">杯 / ${water.goal}目標</span>`;
      }
    },
    'photo-single': {
      name: '單張相片', cat: 'photo', sizes: ['2x2','4x2'], preview: 'lib-preview-mini',
      render(w) {
        const img = getAlbumPhoto();
        if (!img) return `<i class="fas fa-image widget-icon-fa"></i><span class="widget-label">上傳相片</span>`;
        return `<div style="position:absolute;inset:0;border-radius:inherit;background:url('${img}') center/cover"></div>`;
      }
    },
    'photo-album': {
      name: '相簿幻燈片', cat: 'photo', sizes: ['2x2','4x2'], preview: 'lib-preview-mini',
      render(w) {
        const imgs = getAlbumPhotos(4);
        return imgs.slice(0,4).map((img, i) => `<div style="position:absolute;inset:0;background:url('${img}') center/cover;opacity:${1-i*0.25}"></div>`).join('');
      }
    },
    'music-nowplaying': {
      name: '音樂', cat: 'music', sizes: ['2x2','4x2'], preview: 'lib-preview-mini',
      render(w) {
        const track = getNowPlaying();
        return `<div class="widget-weather-hero" style="gap:10px">
          <div style="width:48px;height:48px;border-radius:8px;background:linear-gradient(135deg,var(--primary),var(--purple));display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0">${track.artwork || '♪'}</div>
          <div style="display:flex;flex-direction:column;gap:3px;min-width:0">
            <span class="widget-value" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${track.title}</span>
            <span class="widget-label" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${track.artist}</span>
          </div>
        </div>
        <div style="display:flex;gap:16px">
          <i class="fas fa-backward-step" style="font-size:0.8rem;color:var(--text-secondary)"></i>
          <i class="fas fa-play" style="font-size:1rem;color:#fff;padding:6px;background:var(--primary);border-radius:50%"></i>
          <i class="fas fa-forward-step" style="font-size:0.8rem;color:var(--text-secondary)"></i>
        </div>`;
      }
    },
    'notes': {
      name: '筆記', cat: 'notes', sizes: ['2x1','2x2','4x2'], preview: 'lib-preview-note',
      render(w) {
        const note = getWidgetNote();
        return `<i class="fas fa-note-sticky widget-icon-fa" style="color:var(--warning)"></i>
          <span class="widget-note-text">${note}</span>`;
      }
    },
    'todo': {
      name: '待辦事項', cat: 'notes', sizes: ['2x2','4x2'], preview: 'lib-preview-mini',
      render(w) {
        const todos = getTodoItems();
        return `<div class="widget-habit-row">${todos.slice(0,4).map(t => `
          <div class="widget-habit-item${t.done ? ' done' : ''}">
            <span class="dot"></span>
            <span>${t.text}</span>
          </div>`).join('')}</div>`;
      }
    },
    'countdown': {
      name: '倒數日', cat: 'tools', sizes: ['1x1','2x1','2x2'], preview: 'lib-preview-countdown',
      render(w) {
        const cd = getCountdown();
        return `<span class="widget-countdown-num">${cd.days}</span>
          <span class="widget-countdown-label">${cd.label}</span>
          <span class="widget-label-sm">${cd.name}</span>`;
      }
    },
    'timer': {
      name: '計時器', cat: 'tools', sizes: ['1x1','2x1'], preview: 'lib-preview-mini',
      render(w) {
        const timer = getTimerState();
        return `<i class="fas fa-stopwatch widget-icon-fa" style="color:var(--primary)"></i>
          <span class="widget-value-sm">${timer.display}</span>
          <span class="widget-label">${timer.label}</span>`;
      }
    },
    'stopwatch': {
      name: '碼表', cat: 'tools', sizes: ['2x1','2x2'], preview: 'lib-preview-mini',
      render(w) {
        const sw = getStopwatchState();
        return `<i class="fas fa-timer widget-icon-fa" style="color:var(--orange)"></i>
          <span class="widget-value">${sw.display}</span>
          <span class="widget-label">碼表</span>`;
      }
    },
    'compass': {
      name: '指南針', cat: 'tools', sizes: ['2x2'], preview: 'lib-preview-compass',
      render(w) {
        const heading = getCompassHeading();
        return `<div class="widget-compass-ring">
          <div class="widget-compass-needle" style="--heading:${heading}deg"></div>
        </div>
        <span class="widget-value-sm">${heading}° ${getCompassDir(heading)}</span>`;
      }
    },
    'stocks': {
      name: '股票', cat: 'info', sizes: ['2x1','2x2'], preview: 'lib-preview-mini',
      render(w) {
        const stock = getStockData();
        return `<div style="display:flex;align-items:center;gap:8px;width:100%">
          <span style="font-size:1rem;font-weight:700">${stock.symbol}</span>
          <span class="widget-value">${stock.price}</span>
          <span style="font-size:0.72rem;font-weight:600;color:${stock.change >= 0 ? 'var(--success)' : 'var(--danger)'}">${stock.change >= 0 ? '+' : ''}${stock.change}%</span>
        </div>`;
      }
    },
    'world-time': {
      name: '世界時間', cat: 'info', sizes: ['2x2','4x2'], preview: 'lib-preview-world',
      render(w) {
        const cities = getWorldClockCities();
        return `<div class="widget-world-clock-row">${cities.map(c => `
          <div class="widget-world-clock-city">
            <span class="widget-world-clock-city-name">${c.name}</span>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:1px">
              <span class="widget-world-clock-time">${c.time}</span>
              <span class="widget-world-clock-diff">${c.diff}</span>
            </div>
          </div>`).join('')}</div>`;
      }
    },
    'battery': {
      name: '電池', cat: 'info', sizes: ['1x1','2x1'], preview: 'lib-preview-mini',
      render(w) {
        const bat = getBatteryInfo();
        return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px">
          <div class="widget-battery-body"><div class="widget-battery-fill" style="width:${bat.level}%;background:${bat.color}"></div><div class="widget-battery-tip"></div></div>
          <span class="widget-battery-pct" style="color:${bat.color}">${bat.level}%</span>
        </div>`;
      }
    },
    'system': {
      name: '系統狀態', cat: 'info', sizes: ['2x2','4x2'], preview: 'lib-preview-mini',
      render(w) {
        const sys = getSystemInfo();
        return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%">
          <div style="display:flex;align-items:center;gap:8px"><i class="fas fa-memory" style="font-size:0.8rem;color:var(--text-secondary)"></i><span style="font-size:0.78rem">RAM <b>${sys.ram}</b></span></div>
          <div style="display:flex;align-items:center;gap:8px"><i class="fas fa-microchip" style="font-size:0.8rem;color:var(--text-secondary)"></i><span style="font-size:0.78rem">CPU <b>${sys.cpu}%</b></span></div>
          <div style="display:flex;align-items:center;gap:8px"><i class="fas fa-globe" style="font-size:0.8rem;color:var(--text-secondary)"></i><span style="font-size:0.78rem">網路 <b>${sys.network}</b></span></div>
          <div style="display:flex;align-items:center;gap:8px"><i class="fas fa-battery-full" style="font-size:0.8rem;color:var(--success)"></i><span style="font-size:0.78rem">電量 <b>${sys.battery}%</b></span></div>
        </div>`;
      }
    },
    'quick-memo': {
      name: '快速備忘', cat: 'tools', sizes: ['2x1','2x2'], preview: 'lib-preview-note',
      render(w) {
        const memo = getWidgetNote();
        return `<i class="fas fa-pen-to-square widget-icon-fa" style="color:var(--teal)"></i>
          <span class="widget-note-text">${memo}</span>`;
      }
    },
    'app-launcher': {
      name: '應用程式', cat: 'shortcut', sizes: ['2x2','4x2'], preview: 'lib-preview-mini',
      render(w) {
        const apps = APPS.slice(0, 6);
        return `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;width:100%">
          ${apps.map(a => `<div style="display:flex;flex-direction:column;align-items:center;gap:3px">
            <div style="width:36px;height:36px;border-radius:10px;background:var(--primary);display:flex;align-items:center;justify-content:center;font-size:1rem"><i class="fas ${a.icon}" style="color:#fff;font-size:0.85rem"></i></div>
            <span style="font-size:9px;color:var(--text-tertiary)">${a.label}</span>
          </div>`).join('')}
        </div>`;
      }
    },
    'qrcode': {
      name: 'QR Code', cat: 'tools', sizes: ['2x2'], preview: 'lib-preview-mini',
      render(w) {
        const qr = getQRData();
        return `<div style="width:64px;height:64px;background:var(--text);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:0.5rem;color:var(--bg);padding:4px;text-align:center;font-weight:700">${qr}</div>
          <span class="widget-label">掃描開啟</span>`;
      }
    },
    'habit': {
      name: '習慣追蹤', cat: 'activity', sizes: ['2x2'], preview: 'lib-preview-mini',
      render(w) {
        const habits = getHabits();
        return `<div class="widget-habit-row">${habits.slice(0,5).map(h => `
          <div class="widget-habit-item${h.done ? ' done' : ''}">
            <span class="dot"></span>
            <span style="flex:1;font-size:0.72rem">${h.name}</span>
            <span style="font-size:0.65rem;color:var(--text-tertiary)">${h.streak}天</span>
          </div>`).join('')}</div>`;
      }
    },
    'progress': {
      name: '進度條', cat: 'tools', sizes: ['2x1','4x1'], preview: 'lib-preview-mini',
      render(w) {
        const prog = getProgressData();
        return `<div style="display:flex;flex-direction:column;gap:6px;width:100%">
          <div style="display:flex;justify-content:space-between"><span class="widget-label-lg">${prog.label}</span><span style="font-size:0.78rem;font-weight:600">${prog.pct}%</span></div>
          <div class="widget-progress-track"><div class="widget-progress-fill" style="width:${prog.pct}%"></div></div>
        </div>`;
      }
    },
    'custom': {
      name: '自訂小工具', cat: 'shortcut', sizes: ['1x1','2x1','2x2','4x1','4x2'], preview: 'lib-preview-mini',
      render(w) {
        const title = w.customTitle || '自訂工具';
        const subtitle = w.customSubtitle || '';
        return `<i class="fas fa-wand-magic-sparkles widget-icon-fa" style="color:var(--purple)"></i>
          <span class="widget-custom-title">${title}</span>
          ${subtitle ? `<span class="widget-custom-subtitle">${subtitle}</span>` : ''}`;
      }
    }
  };

  /* ==================== UTILITIES ==================== */
  function genId() { return 'w_' + Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

  function fmtTime() {
    const n = new Date();
    return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
  }

  function fmtDate() {
    const n = new Date();
    const wk = ['週日','週一','週二','週三','週四','週五','週六'];
    return `${wk[n.getDay()]}，${n.getMonth()+1}月${n.getDate()}日`;
  }

  /* ==================== STATE ==================== */
  const state = {
    isEditing: false,
    widgets: [],
    selectedId: null,
    currentCat: 'clock',
    pendingWidget: null,  // 待添加的 widget 預覽
    isAddingNew: false,   // 是否為新增模式
    // 桌面應用程式狀態
    appLayout: [],        // 應用程式佈局 [{ page: 0, position: 0, appId: 'chat' }]
    hiddenApps: [],       // 隱藏的應用程式 ID
    pageSize: 8,          // 每頁應用數量
    draggingApp: null,    // 正在拖曳的應用
    appPickerTarget: null, // 應用選擇器的目標位置 { page, position }
    defaultWidgets: []    // 預設沒有小工具，使用者需自行拖曳添加
  };

  function hexToRgba(hex, alpha) {
    try {
      const r = parseInt(hex.slice(1,3),16);
      const g = parseInt(hex.slice(3,5),16);
      const b = parseInt(hex.slice(5,7),16);
      return `rgba(${r},${g},${b},${alpha})`;
    } catch { return hex; }
  }

  function isColorLight(hex) {
    try {
      const r = parseInt(hex.slice(1,3),16);
      const g = parseInt(hex.slice(3,5),16);
      const b = parseInt(hex.slice(5,7),16);
      return (r*299+g*587+b*114)/1000 > 128;
    } catch { return false; }
  }

  /* ==================== GRID UTILITIES ==================== */
  const GRID_COLS = 4;  // 每頁 4 欄
  
  // 取得 widget 尺寸（欄數, 行數）
  function getSizeInGrid(size) {
    const map = {
      '1x1': { cols: 1, rows: 1 },
      '2x1': { cols: 2, rows: 1 },
      '2x2': { cols: 2, rows: 2 },
      '4x1': { cols: 4, rows: 1 },
      '4x2': { cols: 4, rows: 2 },
      'lock-1x': { cols: 1, rows: 1 }
    };
    return map[size] || { cols: 1, rows: 1 };
  }
  
  // 檢查位置是否可用（不與其他 widget 重疊）
  function canPlaceAt(col, row, cols, rows, excludeId = null) {
    // 檢查邊界
    if (col < 0 || row < 0 || col + cols > GRID_COLS) return false;
    
    // 檢查與其他 widget 重疊
    for (const w of state.widgets) {
      if (w.id === excludeId) continue;
      const wSize = getSizeInGrid(w.size);
      const wCol = w.col ?? 0;
      const wRow = w.row ?? 0;
      
      // 檢查矩形重疊
      const overlap = !(col + cols <= wCol || 
                        wCol + wSize.cols <= col || 
                        row + rows <= wRow || 
                        wRow + wSize.rows <= row);
      if (overlap) return false;
    }
    return true;
  }
  
  // 尋找下一個可用位置
  function findNextAvailablePosition(size) {
    const { cols, rows } = getSizeInGrid(size);
    let maxRow = 0;
    
    // 找出目前最大的 row
    for (const w of state.widgets) {
      const wSize = getSizeInGrid(w.size);
      const wRow = (w.row ?? 0) + wSize.rows;
      if (wRow > maxRow) maxRow = wRow;
    }
    
    // 從 row 0 開始掃描
    for (let r = 0; r <= maxRow + 1; r++) {
      for (let c = 0; c <= GRID_COLS - cols; c++) {
        if (canPlaceAt(c, r, cols, rows)) {
          return { col: c, row: r };
        }
      }
    }
    
    // 找不到就放到最後
    return { col: 0, row: maxRow + 1 };
  }

  /* ==================== DESKTOP APP LAYOUT ==================== */
  
  // 載入應用程式佈局
  function loadAppLayout() {
    try {
      const raw = localStorage.getItem(APP_LAYOUT_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    // 預設佈局：按 ALL_APPS 順序排列
    return ALL_APPS.map((app, idx) => ({
      page: Math.floor(idx / state.pageSize),
      position: idx % state.pageSize,
      appId: app.id
    }));
  }
  
  // 儲存應用程式佈局
  function saveAppLayout() {
    localStorage.setItem(APP_LAYOUT_KEY, JSON.stringify(state.appLayout));
    syncToHome();
  }
  
  // 載入隱藏的應用程式
  function loadHiddenApps() {
    try {
      const raw = localStorage.getItem(HIDDEN_APPS_KEY);
      if (raw) state.hiddenApps = JSON.parse(raw);
    } catch {}
  }
  
  // 儲存隱藏的應用程式
  function saveHiddenApps() {
    localStorage.setItem(HIDDEN_APPS_KEY, JSON.stringify(state.hiddenApps));
    syncToHome();
  }
  
  // 載入每頁數量設定
  function loadPageSize() {
    try {
      const raw = localStorage.getItem(PAGE_SIZE_KEY);
      if (raw) state.pageSize = parseInt(raw) || 8;
    } catch {}
  }
  
  // 取得應用程式資訊
  function getAppInfo(appId) {
    return ALL_APPS.find(a => a.id === appId);
  }
  
  // 取得指定頁面的應用程式
  function getAppsInPage(pageIndex) {
    return state.appLayout
      .filter(item => item.page === pageIndex)
      .sort((a, b) => a.position - b.position);
  }
  
  // 取得總頁數
  function getTotalPages() {
    if (state.appLayout.length === 0) return 1;
    const maxPage = Math.max(...state.appLayout.map(item => item.page));
    return maxPage + 1;
  }
  
  // 渲染桌面預覽
  function renderDesktopPreview() {
    const container = $('desktopPagesContainer');
    const dotsContainer = $('desktopPageDots');
    if (!container) return;
    
    container.innerHTML = '';
    const totalPages = getTotalPages();
    
    // 渲染每一頁
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      const page = document.createElement('div');
      page.className = 'desktop-page' + (state.isEditing ? ' editing' : '');
      page.dataset.page = pageIndex;
      
      const grid = document.createElement('div');
      grid.className = 'desktop-app-grid';
      
      const appsInPage = getAppsInPage(pageIndex);
      
      // 渲染應用程式圖標
      for (let pos = 0; pos < state.pageSize; pos++) {
        const appItem = appsInPage.find(item => item.position === pos);
        
        if (appItem && !state.hiddenApps.includes(appItem.appId)) {
          const appInfo = getAppInfo(appItem.appId);
          if (appInfo) {
            const icon = createDesktopAppIcon(appInfo, appItem, pageIndex, pos);
            grid.appendChild(icon);
          }
        } else if (state.isEditing) {
          // 編輯模式下顯示空白格子
          const emptySlot = createEmptySlot(pageIndex, pos);
          grid.appendChild(emptySlot);
        }
      }
      
      page.appendChild(grid);
      container.appendChild(page);
    }
    
    // 添加「新增頁面」按鈕
    if (state.isEditing) {
      const addBtn = document.createElement('div');
      addBtn.className = 'add-page-btn';
      addBtn.innerHTML = '<i class="fas fa-plus"></i><span>新增頁面</span>';
      addBtn.addEventListener('click', addNewPage);
      container.appendChild(addBtn);
    }
    
    // 渲染分頁點
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      for (let i = 0; i < totalPages; i++) {
        const dot = document.createElement('div');
        dot.className = 'dot' + (i === 0 ? ' active' : '');
        dot.addEventListener('click', () => scrollToPage(i));
        dotsContainer.appendChild(dot);
      }
    }
    
    // 綁定拖放事件
    if (state.isEditing) {
      bindDesktopDragEvents();
    }
  }
  
  // 建立桌面應用程式圖標
  function createDesktopAppIcon(appInfo, layoutItem, pageIndex, position) {
    const icon = document.createElement('div');
    icon.className = 'desktop-app-icon' + (state.isEditing ? ' editing' : '');
    icon.dataset.appId = appInfo.id;
    icon.dataset.page = pageIndex;
    icon.dataset.position = position;
    icon.draggable = state.isEditing;
    
    icon.innerHTML = `
      <div class="icon-box" style="background:${appInfo.color}">
        <i class="fas ${appInfo.icon}"></i>
      </div>
      <span class="app-label">${appInfo.label}</span>
      <button class="app-hide-btn" data-app-id="${appInfo.id}">−</button>
    `;
    
    // 隱藏按鈕事件
    const hideBtn = icon.querySelector('.app-hide-btn');
    if (hideBtn) {
      hideBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        hideAppFromDesktop(appInfo.id);
      });
    }
    
    return icon;
  }
  
  // 建立空白格子
  function createEmptySlot(pageIndex, position) {
    const slot = document.createElement('div');
    slot.className = 'desktop-empty-slot';
    slot.dataset.page = pageIndex;
    slot.dataset.position = position;
    slot.innerHTML = '<i class="fas fa-plus"></i><span>添加</span>';
    
    slot.addEventListener('click', () => {
      state.appPickerTarget = { page: pageIndex, position };
      openAppPicker();
    });
    
    return slot;
  }
  
  // 綁定桌面拖放事件
  function bindDesktopDragEvents() {
    const container = $('desktopPagesContainer');
    if (!container) return;
    
    container.querySelectorAll('.desktop-app-icon').forEach(icon => {
      icon.addEventListener('dragstart', handleAppDragStart);
      icon.addEventListener('dragend', handleAppDragEnd);
      icon.addEventListener('dragover', handleAppDragOver);
      icon.addEventListener('drop', handleAppDrop);
    });
    
    container.querySelectorAll('.desktop-empty-slot').forEach(slot => {
      slot.addEventListener('dragover', handleSlotDragOver);
      slot.addEventListener('drop', handleSlotDrop);
    });
  }
  
  let draggedAppElement = null;
  
  function handleAppDragStart(e) {
    if (!state.isEditing) return;
    draggedAppElement = e.target.closest('.desktop-app-icon');
    if (draggedAppElement) {
      draggedAppElement.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', draggedAppElement.dataset.appId);
    }
  }
  
  function handleAppDragEnd(e) {
    if (draggedAppElement) {
      draggedAppElement.classList.remove('dragging');
      draggedAppElement = null;
    }
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
  }
  
  function handleAppDragOver(e) {
    e.preventDefault();
    if (!draggedAppElement || !state.isEditing) return;
    const target = e.target.closest('.desktop-app-icon');
    if (target && target !== draggedAppElement) {
      target.classList.add('drag-over');
    }
  }
  
  function handleAppDrop(e) {
    e.preventDefault();
    if (!draggedAppElement || !state.isEditing) return;
    
    const target = e.target.closest('.desktop-app-icon');
    if (!target || target === draggedAppElement) return;
    
    // 交換位置
    const draggedAppId = draggedAppElement.dataset.appId;
    const draggedPage = parseInt(draggedAppElement.dataset.page);
    const draggedPos = parseInt(draggedAppElement.dataset.position);
    
    const targetAppId = target.dataset.appId;
    const targetPage = parseInt(target.dataset.page);
    const targetPos = parseInt(target.dataset.position);
    
    // 更新佈局
    const draggedItem = state.appLayout.find(item => item.appId === draggedAppId);
    const targetItem = state.appLayout.find(item => item.appId === targetAppId);
    
    if (draggedItem && targetItem) {
      draggedItem.page = targetPage;
      draggedItem.position = targetPos;
      targetItem.page = draggedPage;
      targetItem.position = draggedPos;
      saveAppLayout();
      renderDesktopPreview();
      showToast('已移動');
    }
    
    target.classList.remove('drag-over');
  }
  
  function handleSlotDragOver(e) {
    e.preventDefault();
    if (!draggedAppElement || !state.isEditing) return;
    e.target.closest('.desktop-empty-slot')?.classList.add('drag-over');
  }
  
  function handleSlotDrop(e) {
    e.preventDefault();
    if (!draggedAppElement || !state.isEditing) return;
    
    const slot = e.target.closest('.desktop-empty-slot');
    if (!slot) return;
    
    const draggedAppId = draggedAppElement.dataset.appId;
    const newPage = parseInt(slot.dataset.page);
    const newPos = parseInt(slot.dataset.position);
    
    // 更新佈局
    const item = state.appLayout.find(i => i.appId === draggedAppId);
    if (item) {
      item.page = newPage;
      item.position = newPos;
      saveAppLayout();
      renderDesktopPreview();
      showToast('已移動');
    }
    
    slot.classList.remove('drag-over');
  }
  
  // 隱藏應用程式
  function hideAppFromDesktop(appId) {
    if (!state.hiddenApps.includes(appId)) {
      state.hiddenApps.push(appId);
      saveHiddenApps();
      renderDesktopPreview();
      showToast('已隱藏');
    }
  }
  
  // 顯示應用程式
  function showAppOnDesktop(appId) {
    const idx = state.hiddenApps.indexOf(appId);
    if (idx > -1) {
      state.hiddenApps.splice(idx, 1);
      saveHiddenApps();
      renderDesktopPreview();
      renderAppPickerGrid();
      showToast('已顯示');
    }
  }
  
  // 添加應用程式到指定位置
  function addAppToPosition(appId, page, position) {
    // 檢查是否已存在
    const existing = state.appLayout.find(item => item.appId === appId);
    if (existing) {
      // 移動到新位置
      existing.page = page;
      existing.position = position;
    } else {
      // 新增
      state.appLayout.push({ appId, page, position });
    }
    
    // 從隱藏列表移除
    const hiddenIdx = state.hiddenApps.indexOf(appId);
    if (hiddenIdx > -1) {
      state.hiddenApps.splice(hiddenIdx, 1);
      saveHiddenApps();
    }
    
    saveAppLayout();
    renderDesktopPreview();
  }
  
  // 新增頁面
  function addNewPage() {
    const totalPages = getTotalPages();
    // 將最後一頁的應用移到新頁面（如果最後一頁滿了）
    const lastPageApps = getAppsInPage(totalPages - 1);
    if (lastPageApps.length >= state.pageSize) {
      // 創建新頁面
      showToast('已新增頁面');
      renderDesktopPreview();
    }
  }
  
  // 滾動到指定頁面
  function scrollToPage(pageIndex) {
    const scroll = $('desktopPagesScroll');
    const pages = scroll?.querySelectorAll('.desktop-page');
    if (pages && pages[pageIndex]) {
      pages[pageIndex].scrollIntoView({ behavior: 'smooth', inline: 'start' });
      
      // 更新分頁點
      const dots = $('desktopPageDots')?.querySelectorAll('.dot');
      dots?.forEach((dot, i) => {
        dot.classList.toggle('active', i === pageIndex);
      });
    }
  }
  
  // 開啟應用選擇器
  function openAppPicker() {
    $('appPickerPanel')?.classList.add('open');
    renderAppPickerGrid();
  }
  
  // 關閉應用選擇器
  function closeAppPicker() {
    $('appPickerPanel')?.classList.remove('open');
    state.appPickerTarget = null;
  }
  
  // 渲染應用選擇器網格
  function renderAppPickerGrid(filter = 'all', search = '') {
    const grid = $('appPickerGrid');
    if (!grid) return;
    
    let apps = [...ALL_APPS];
    
    // 分類過濾
    if (filter !== 'all' && filter !== 'hidden') {
      apps = apps.filter(app => app.cat === filter);
    } else if (filter === 'hidden') {
      apps = apps.filter(app => state.hiddenApps.includes(app.id));
    }
    
    // 搜尋過濾
    if (search) {
      const searchLower = search.toLowerCase();
      apps = apps.filter(app => 
        app.label.toLowerCase().includes(searchLower) ||
        app.id.toLowerCase().includes(searchLower)
      );
    }
    
    grid.innerHTML = apps.map(app => `
      <div class="picker-app-item${state.hiddenApps.includes(app.id) ? ' hidden-app' : ''}" data-app-id="${app.id}">
        <div class="icon-box" style="background:${app.color}">
          <i class="fas ${app.icon}"></i>
        </div>
        <span class="app-name">${app.label}</span>
      </div>
    `).join('');
    
    // 綁定點擊事件
    grid.querySelectorAll('.picker-app-item').forEach(item => {
      item.addEventListener('click', () => {
        const appId = item.dataset.appId;
        if (state.appPickerTarget) {
          addAppToPosition(appId, state.appPickerTarget.page, state.appPickerTarget.position);
          closeAppPicker();
        } else {
          // 如果沒有目標位置，添加到第一個空白位置
          const totalPages = getTotalPages();
          for (let p = 0; p < totalPages; p++) {
            const appsInPage = getAppsInPage(p);
            for (let pos = 0; pos < state.pageSize; pos++) {
              if (!appsInPage.find(a => a.position === pos)) {
                addAppToPosition(appId, p, pos);
                closeAppPicker();
                return;
              }
            }
          }
          // 沒有空白位置，添加到新頁面
          addAppToPosition(appId, totalPages, 0);
          closeAppPicker();
        }
      });
    });
  }

  /* ==================== DATA FETCHERS (real data) ==================== */
  function getWeatherData() {
    try {
      const raw = localStorage.getItem('sx_weather_cache');
      if (raw) {
        const d = JSON.parse(raw);
        const hours = [];
        for (let i = 0; i < 8; i++) {
          const t = new Date(); t.setHours(t.getHours() + i);
          hours.push({ time: `${String(t.getHours()).padStart(2,'0')}:00`, icon: ['☀️','⛅','☁️','🌧️'][Math.floor(Math.random()*4)], temp: `${Math.round(20+Math.random()*8)}°` });
        }
        return { temp: d.temp || '25°', icon: d.icon || '☀️', location: d.location || '台北市', high: d.high || '30°', low: d.low || '22°', rain: d.rain || '10%', hourly: hours };
      }
    } catch {}
    return { temp: '25°', icon: '☀️', location: '台北市', high: '30°', low: '22°', rain: '10%', hourly: [{time:'現在',icon:'☀️',temp:'25°'},{time:'14:00',icon:'⛅',temp:'27°'},{time:'15:00',icon:'☀️',temp:'28°'},{time:'16:00',icon:'⛅',temp:'27°'}] };
  }

  function getWorldClockCities() {
    const now = new Date();
    const cities = [
      { name: '台北', zone: 8, flag: 'TW' },
      { name: '東京', zone: 9, flag: 'JP' },
      { name: '倫敦', zone: 0, flag: 'GB' },
      { name: '紐約', zone: -5, flag: 'US' },
    ];
    return cities.map(c => {
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const cityTime = new Date(utc + 3600000 * c.zone);
      const diff = c.zone >= 0 ? `+${c.zone}` : `${c.zone}`;
      return { name: c.name, time: `${String(cityTime.getHours()).padStart(2,'0')}:${String(cityTime.getMinutes()).padStart(2,'0')}`, diff: `UTC${diff}` };
    });
  }

  function getStepsData() {
    return { count: 6521, goal: 10000 };
  }

  function getActivityRings() {
    return { move: 72, exercise: 45, stand: 88 };
  }

  function getSleepData() {
    return { duration: '7h 24m', deep: 22, light: 48, rem: 20, awake: 10 };
  }

  function getHeartRate() { return 72; }

  function getWaterIntake() { return { cups: 4, goal: 8 }; }

  function getBatteryInfo() {
    const level = 78;
    const color = level > 50 ? '#34C759' : level > 20 ? '#FF9500' : '#FF3B30';
    return { level, color };
  }

  function getLunarInfo() {
    const lunarDays = ['初一','初二','初三','初四','初五','初六','初七','初八','初九','初十','十一','十二','十三','十四','十五','十六','十七','十八','十九','二十','廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'];
    const now = new Date();
    const day = lunarDays[Math.floor(Math.random()*29)];
    const emojis = ['🌑','🌒','🌓','🌔','🌕','🌖','🌗','🌘'];
    return { emoji: emojis[Math.floor(Math.random()*8)], dateStr: `${day}` };
  }

  function getTodayEvents() {
    try {
      const raw = localStorage.getItem('sx_today_events');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [
      { time: '09:00', title: '團隊會議' },
      { time: '14:00', title: '專案審查' },
    ];
  }

  function getUVIndex() {
    const val = 6;
    const labels = ['低','低','中','高','甚高','甚高','極高','危險'];
    const colors = ['#34C759','#34C759','#FFD60A','#FF9500','#FF9500','#FF9F0A','#FF3B30','#FF3B30'];
    return { value: val, label: labels[val] || '高', color: colors[val] || '#FF9500' };
  }

  function getWindData() {
    const dirs = ['北風','東北風','東風','東南風','南風','西南風','西風','西北風'];
    return { speed: '12 km/h', dir: dirs[Math.floor(Math.random()*8)] };
  }

  function getAQI() {
    const val = Math.round(30 + Math.random()*80);
    let label, color, pct;
    if (val <= 50) { label = '優'; color = '#34C759'; pct = val * 2; }
    else if (val <= 100) { label = '良'; color = '#FFD60A'; pct = 50 + (val-50); }
    else { label = '不良'; color = '#FF3B30'; pct = Math.min(100, 50 + (val-100) * 0.5); }
    return { value: val, label, color, station: '台北市', pct };
  }

  function getAlbumPhoto() {
    try {
      const raw = localStorage.getItem('sx_album_uploaded_images');
      if (raw) {
        const imgs = JSON.parse(raw);
        if (Array.isArray(imgs) && imgs.length) {
          const img = imgs[Math.floor(Math.random() * imgs.length)];
          return typeof img === 'string' ? img : img.url;
        }
      }
    } catch {}
    return '';
  }

  function getAlbumPhotos(count) {
    try {
      const raw = localStorage.getItem('sx_album_uploaded_images');
      if (raw) {
        const imgs = JSON.parse(raw);
        if (Array.isArray(imgs)) return imgs.slice(0, count).map(i => typeof i === 'string' ? i : i.url).filter(Boolean);
      }
    } catch {}
    return [];
  }

  function getNowPlaying() {
    return { title: '正在播放', artist: 'Music App', artwork: '♪' };
  }

  function getWidgetNote() {
    try {
      const raw = localStorage.getItem('sx_widget_note');
      return raw || '點擊編輯筆記內容...';
    } catch { return '點擊編輯筆記內容...'; }
  }

  function getTodoItems() {
    try {
      const raw = localStorage.getItem('sx_todo_items');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [
      { text: '回覆郵件', done: true },
      { text: '撰寫報告', done: false },
      { text: '團隊會議', done: false },
      { text: '運動 30 分鐘', done: false },
    ];
  }

  function getCountdown() {
    try {
      const raw = localStorage.getItem('sx_countdown_events');
      if (raw) {
        const evs = JSON.parse(raw);
        if (evs.length) {
          const ev = evs[0];
          const diff = Math.ceil((new Date(ev.date) - new Date()) / 86400000);
          return { name: ev.name, days: Math.abs(diff), label: diff >= 0 ? '天後' : '天前' };
        }
      }
    } catch {}
    return { name: '新年', days: Math.floor((new Date(new Date().getFullYear()+1,0,1) - new Date()) / 86400000), label: '天後' };
  }

  function getTimerState() {
    try {
      const raw = localStorage.getItem('sx_timer_state');
      if (raw) {
        const d = JSON.parse(raw);
        if (d.running && d.endTime) {
          const rem = Math.max(0, d.endTime - Date.now());
          const m = Math.floor(rem / 60000); const s = Math.floor((rem % 60000) / 1000);
          return { display: `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`, label: '倒數中' };
        }
      }
    } catch {}
    return { display: '25:00', label: '計時器' };
  }

  function getStopwatchState() {
    try {
      const raw = localStorage.getItem('sx_stopwatch');
      if (raw) {
        const d = JSON.parse(raw);
        if (d.running && d.start) {
          const elapsed = Date.now() - d.start;
          const m = Math.floor(elapsed / 60000); const s = Math.floor((elapsed % 60000) / 1000);
          return { display: `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` };
        }
      }
    } catch {}
    return { display: '00:00' };
  }

  function getCompassHeading() { return Math.round(Math.random() * 360); }
  function getCompassDir(deg) {
    const dirs = ['N','NE','E','SE','S','SW','W','NW'];
    return dirs[Math.round(deg / 45) % 8];
  }

  function getStockData() {
    const price = (150 + Math.random() * 30).toFixed(2);
    const change = (Math.random() * 6 - 2).toFixed(2);
    return { symbol: 'AAPL', price, change: parseFloat(change) };
  }

  function getSystemInfo() {
    const ram = Math.round(40 + Math.random() * 30);
    const cpu = Math.round(10 + Math.random() * 60);
    return { ram: `${ram}%`, cpu: `${cpu}%`, network: 'WiFi', battery: '78%' };
  }

  function getQRData() { return 'sxiphone.app'; }

  function getHabits() {
    try {
      const raw = localStorage.getItem('sx_habit_tracker');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [
      { name: '喝水', done: true, streak: 12 },
      { name: '運動', done: true, streak: 5 },
      { name: '冥想', done: false, streak: 3 },
      { name: '閱讀', done: false, streak: 8 },
    ];
  }

  function getProgressData() {
    try {
      const raw = localStorage.getItem('sx_progress_data');
      if (raw) return JSON.parse(raw);
    } catch {}
    return { label: '專案進度', pct: 68 };
  }

  /* ==================== DOM REFS ==================== */
  const $ = id => document.getElementById(id);

  /* ==================== STORAGE ==================== */
  function saveWidgets() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.widgets));
    syncToHome();
  }

  function loadWidgets() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        state.widgets = JSON.parse(raw).map((w, index) => ({ 
          ...w, 
          opacity: w.opacity ?? 80, 
          radius: w.radius ?? 20, 
          widgetStyle: w.widgetStyle || 'glass', 
          bgType: w.bgType || 'solid', 
          bgGradient: w.bgGradient || '', 
          bgImage: w.bgImage || '',
          col: w.col ?? (index % GRID_COLS),
          row: w.row ?? Math.floor(index / GRID_COLS)
        }));
        return;
      }
    } catch {}
    state.widgets = [...state.defaultWidgets];
    saveWidgets();
  }

  function syncToHome() {
    if (window.parent && window.parent !== window) {
      // 同步 widget 佈局
      window.parent.postMessage({ type: 'WIDGET_LAYOUT_UPDATED', layout: state.widgets }, '*');
      // 同步應用程式佈局
      window.parent.postMessage({ type: 'APP_LAYOUT_UPDATED', appLayout: state.appLayout, hiddenApps: state.hiddenApps }, '*');
    }
  }

  /* ==================== RENDER CATALOG ==================== */
  function createWidgetCard(widget) {
    const def = WIDGET_DEFS[widget.type];
    if (!def) return null;

    const card = document.createElement('div');
    card.className = 'widget-card';
    card.dataset.id = widget.id;
    card.dataset.size = widget.size;
    card.dataset.type = widget.type;
    card.dataset.enabled = widget.enabled ? 'true' : 'false';
    card.style.setProperty('--text', isColorLight(widget.bgColor) ? '#000' : '#fff');

    // Background
    applyWidgetBg(card, widget);

    // Content
    card.innerHTML = def.render(widget);

    // Custom title override
    if (widget.customTitle) {
      const titleEl = card.querySelector('.widget-custom-title');
      if (!titleEl) {
        const div = document.createElement('div');
        div.className = 'widget-custom-title';
        div.textContent = widget.customTitle;
        card.appendChild(div);
      }
    }

    // Delete button
    const delBtn = document.createElement('button');
    delBtn.className = 'widget-delete';
    delBtn.innerHTML = '<i class="fas fa-xmark"></i>';
    delBtn.addEventListener('click', e => { e.stopPropagation(); deleteWidget(widget.id); });
    card.appendChild(delBtn);

    if (state.isEditing) {
      card.classList.add('editing');
      card.draggable = true;
    }

    if (!widget.enabled) card.classList.add('disabled');

    card.addEventListener('click', () => {
      if (state.isEditing) { selectWidget(widget.id); return; }
      if (widget.appId && window.parent) { window.parent.postMessage({ type: 'openApp', appId: widget.appId }, '*'); return; }
      openEditor(widget.id);
    });

    // 拖放功能
    card.addEventListener('dragstart', e => {
      if (!state.isEditing) return;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', widget.id);
    });
    
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      document.querySelectorAll('.widget-drop-preview').forEach(el => el.remove());
    });

    return card;
  }

  function applyWidgetBg(card, widget) {
    if (widget.bgImage) {
      card.style.backgroundImage = `url('${widget.bgImage}')`;
      card.style.backgroundSize = 'cover';
      card.style.backgroundPosition = 'center';
      card.classList.add('has-image');
    } else if (widget.bgGradient) {
      card.style.background = widget.bgGradient;
    } else if (widget.bgColor) {
      const alpha = widget.opacity / 100 * 0.35;
      card.style.background = hexToRgba(widget.bgColor, alpha);
    } else {
      card.style.background = `rgba(255,255,255,${widget.opacity / 100 * 0.15})`;
    }
    card.style.borderRadius = `${widget.radius}px`;
    card.style.backdropFilter = widget.widgetStyle === 'glass' ? 'blur(20px) saturate(150%)' : 'none';
  }

  function renderCatalog() {
    const catalog = $('widgetCatalog');
    if (!catalog) return;
    
    // 清空所有 widget-row
    const rows = catalog.querySelectorAll('.widget-row');
    rows.forEach(r => r.innerHTML = '');

    // 根據 row 排序，同一 row 內根據 col 排序
    const sorted = [...state.widgets].sort((a, b) => {
      const rowA = a.row ?? 0;
      const rowB = b.row ?? 0;
      if (rowA !== rowB) return rowA - rowB;
      return (a.col ?? 0) - (b.col ?? 0);
    });
    
    sorted.forEach(w => {
      const card = createWidgetCard(w);
      if (!card) return;
      
      // 設定 Grid 位置
      const { cols, rows: cellRows } = getSizeInGrid(w.size);
      const col = w.col ?? 0;
      const row = w.row ?? 0;
      
      card.style.gridColumn = `${col + 1} / span ${cols}`;
      card.style.gridRow = `${row + 1} / span ${cellRows}`;
      
      // 根據類型決定放入哪個 row
      const rowKey = w.size.startsWith('lock') ? 'lock-1x' : 'main';
      const targetRow = Array.from(rows).find(r => r.dataset.sizeRow === rowKey);
      if (targetRow) targetRow.appendChild(card);
    });
  }

  /* ==================== LIBRARY UI ==================== */
  const CATEGORIES = [
    { id: 'clock', label: '時鐘', icon: 'fa-clock' },
    { id: 'calendar', label: '日曆', icon: 'fa-calendar-day' },
    { id: 'weather', label: '天氣', icon: 'fa-cloud-sun' },
    { id: 'activity', label: '健康', icon: 'fa-heart-pulse' },
    { id: 'photo', label: '相片', icon: 'fa-image' },
    { id: 'music', label: '音樂', icon: 'fa-music' },
    { id: 'notes', label: '筆記', icon: 'fa-note-sticky' },
    { id: 'tools', label: '工具', icon: 'fa-wrench' },
    { id: 'info', label: '資訊', icon: 'fa-circle-info' },
    { id: 'shortcut', label: '捷徑', icon: 'fa-bolt' },
  ];

  function buildCategoryButtons() {
    const container = $('libraryCategories');
    if (!container) return;
    container.innerHTML = CATEGORIES.map(c => `
      <button class="cat-btn${c.id === state.currentCat ? ' active' : ''}" data-cat="${c.id}">
        <i class="fas ${c.icon}"></i>${c.label}
      </button>
    `).join('');
    container.querySelectorAll('.cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.currentCat = btn.dataset.cat;
        buildCategoryButtons();
        buildLibraryGrid();
      });
    });
  }

  function buildLibraryGrid() {
    const grid = $('libraryGrid');
    if (!grid) return;
    const widgets = Object.entries(WIDGET_DEFS).filter(([,def]) => def.cat === state.currentCat);
    const sub = $('libraryWidgetType');
    if (sub) {
      const cat = CATEGORIES.find(c => c.id === state.currentCat);
      sub.textContent = cat ? cat.label : '選擇類型';
    }
    grid.innerHTML = widgets.map(([type, def]) => {
      const sizes = def.sizes.join(', ');
      return `<div class="lib-widget-item" data-type="${type}">
        <div class="lib-widget-preview">
          <span class="lib-widget-preview-label">${sizes}</span>
          ${getLibPreviewHTML(type, def)}
        </div>
        <div class="lib-widget-info">
          <span class="lib-widget-name">${def.name}</span>
          <span class="lib-widget-size-badge">${sizes}</span>
        </div>
      </div>`;
    }).join('');

    grid.querySelectorAll('.lib-widget-item').forEach(item => {
      item.addEventListener('click', () => previewNewWidget(item.dataset.type));
    });
  }
  
  // 預覽新 widget（添加前先編輯）
  function previewNewWidget(type) {
    const def = WIDGET_DEFS[type];
    if (!def) return;
    
    // 建立待添加的 widget
    const pos = findNextAvailablePosition(def.sizes[0]);
    state.pendingWidget = {
      id: genId(),
      type,
      size: def.sizes[0],
      col: pos.col,
      row: pos.row,
      bgColor: '#0f1118',
      bgType: 'solid',
      bgImage: '',
      bgGradient: '',
      opacity: 80,
      radius: 20,
      widgetStyle: 'glass',
      customTitle: '',
      customSubtitle: '',
      appId: '',
      enabled: true,
      order: state.widgets.length,
      lockScreen: false,
      deepInteract: true
    };
    state.isAddingNew = true;
    state.selectedId = null;
    
    // 關閉組件庫，開啟編輯器
    closeLibrary();
    openEditorForNew();
  }
  
  // 開啟編輯器（新增模式）
  function openEditorForNew() {
    if (!state.pendingWidget) return;
    const widget = state.pendingWidget;
    const def = WIDGET_DEFS[widget.type];
    
    // 渲染預覽
    const previewEl = $('editorPreview');
    if (previewEl) {
      previewEl.innerHTML = '';
      const previewCard = document.createElement('div');
      previewCard.className = 'preview-widget';
      previewCard.id = 'previewWidget';
      previewCard.style.background = widget.bgColor ? hexToRgba(widget.bgColor, 0.5) : 'var(--glass)';
      previewCard.style.borderRadius = `${widget.radius}px`;
      if (def) previewCard.innerHTML = def.render(widget);
      previewEl.appendChild(previewCard);
    }
    
    // 尺寸選項
    document.querySelectorAll('#sizeChipRow .size-chip').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.size === widget.size);
    });
    
    // 其他設定
    const opSlider = $('opacitySlider');
    const opVal = $('opacityVal');
    if (opSlider) opSlider.value = widget.opacity;
    if (opVal) opVal.textContent = `${widget.opacity}%`;
    
    const radSlider = $('radiusSlider');
    const radVal = $('radiusVal');
    if (radSlider) radSlider.value = widget.radius;
    if (radVal) radVal.textContent = `${widget.radius}px`;
    
    const titleIn = $('editorTitleInput');
    const subIn = $('editorSubtitleInput');
    if (titleIn) titleIn.value = widget.customTitle || '';
    if (subIn) subIn.value = widget.customSubtitle || '';
    
    // 顯示「添加」按鈕而非「刪除」
    const deleteBtn = $('deleteWidgetBtn');
    if (deleteBtn) {
      deleteBtn.innerHTML = '<i class="fas fa-plus"></i> 添加小工具';
      deleteBtn.style.background = 'rgba(52,199,89,0.1)';
      deleteBtn.style.borderColor = 'rgba(52,199,89,0.3)';
      deleteBtn.style.color = 'var(--success)';
    }
    
    $('widgetEditor')?.classList.add('open');
  }

  function getLibPreviewHTML(type, def) {
    const t = fmtTime();
    const d = fmtDate();
    switch(type) {
      case 'clock-digital': return `<span class="lib-preview-clock">${t}</span>`;
      case 'clock-analog': return `<div class="lib-preview-analog"><div class="h-hand"></div><div class="m-hand"></div></div>`;
      case 'clock-world': return `<div class="lib-preview-world"><div class="city">東京</div><div class="time">15:42</div></div>`;
      case 'clock-alarm': return `<div class="lib-preview-mini"><i class="fas fa-bell" style="font-size:1.4rem;color:var(--warning)"></i><span style="font-size:1rem;font-weight:700">08:00</span></div>`;
      case 'date': return `<div class="lib-preview-date"><span class="day">${new Date().getDate()}</span><span class="month">${['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'][new Date().getMonth()]}</span></div>`;
      case 'calendar-monthly': return `<div class="lib-preview-cal"><div class="cal-grid">${Array.from({length:7},()=>'<span style="width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,0.2)"></span>').join('')}${Array.from({length:7},(_,i)=>`<span class="cal-dot" style="background:${i===new Date().getDay()?'var(--primary)':'rgba(255,255,255,0.15)'}"></span>`).join('')}</div></div>`;
      case 'calendar-agenda': return `<div class="lib-preview-mini"><i class="fas fa-list" style="font-size:1.2rem"></i><span style="font-size:0.7rem">今日行程</span></div>`;
      case 'lunar': return `<div class="lib-preview-moon">🌕</div>`;
      case 'weather-current': return `<div class="lib-preview-weather"><span class="icon">☀️</span><span class="temp">25°</span><span class="loc">台北市</span></div>`;
      case 'weather-hourly': return `<div class="lib-preview-weather"><span style="font-size:1.2rem;font-weight:700">25°</span><span style="font-size:0.7rem;color:var(--text-secondary)">台北市</span></div>`;
      case 'weather-uv': return `<div class="lib-preview-mini"><i class="fas fa-sun" style="color:#FFD60A"></i><span style="font-size:0.9rem;font-weight:700">UV 6</span></div>`;
      case 'weather-wind': return `<div class="lib-preview-mini"><i class="fas fa-wind"></i><span style="font-size:0.9rem;font-weight:700">12km/h</span></div>`;
      case 'weather-aqi': return `<div class="lib-preview-aqi"><div class="aqi-val" style="font-size:1.4rem;font-weight:800">42</div><div class="aqi-bar"></div></div>`;
      case 'steps': return `<div class="lib-preview-steps"><span class="val">6,521</span><span class="lbl">步數</span></div>`;
      case 'activity-rings': return `<div class="lib-preview-ring" style="width:48px;height:48px"></div>`;
      case 'sleep': return `<div class="lib-preview-sleep"><span style="font-size:1.1rem;font-weight:700">7h 24m</span><div class="sleep-bar"></div></div>`;
      case 'heart-rate': return `<div class="lib-preview-mini"><i class="fas fa-heart" style="color:var(--pink)"></i><span style="font-size:1rem;font-weight:700">72</span></div>`;
      case 'water': return `<div class="lib-preview-mini"><i class="fas fa-glass-water" style="color:var(--teal)"></i><span style="font-size:1rem;font-weight:700">4杯</span></div>`;
      case 'photo-single': return `<div class="lib-preview-mini"><i class="fas fa-image" style="font-size:1.6rem"></i></div>`;
      case 'photo-album': return `<div class="lib-preview-mini"><i class="fas fa-images" style="font-size:1.6rem"></i></div>`;
      case 'music-nowplaying': return `<div class="lib-preview-mini"><i class="fas fa-music" style="font-size:1.4rem;color:var(--primary)"></i><span style="font-size:0.7rem">Music</span></div>`;
      case 'notes': return `<div class="lib-preview-note">筆記內容...</div>`;
      case 'todo': return `<div class="lib-preview-mini"><i class="fas fa-check-square" style="font-size:1.2rem"></i><span style="font-size:0.7rem">待辦</span></div>`;
      case 'countdown': return `<div class="lib-preview-countdown">12</div>`;
      case 'timer': return `<div class="lib-preview-mini"><i class="fas fa-stopwatch" style="color:var(--primary)"></i><span style="font-size:1rem;font-weight:700">25:00</span></div>`;
      case 'stopwatch': return `<div class="lib-preview-mini"><i class="fas fa-timer" style="color:var(--orange)"></i><span style="font-size:1rem;font-weight:700">00:00</span></div>`;
      case 'compass': return `<div class="lib-preview-compass"><div class="needle"></div></div>`;
      case 'stocks': return `<div class="lib-preview-mini"><span style="font-size:1rem;font-weight:700">AAPL</span><span style="font-size:0.8rem;color:var(--success)">+1.2%</span></div>`;
      case 'world-time': return `<div class="lib-preview-world"><div class="city">倫敦</div><div class="time">08:30</div></div>`;
      case 'battery': return `<div class="lib-preview-mini"><i class="fas fa-battery-full" style="color:var(--success)"></i><span style="font-size:1rem;font-weight:700">78%</span></div>`;
      case 'system': return `<div class="lib-preview-mini"><i class="fas fa-server" style="font-size:1.2rem"></i><span style="font-size:0.7rem">系統</span></div>`;
      case 'quick-memo': return `<div class="lib-preview-note"><i class="fas fa-pen-to-square"></i> 快速備忘</div>`;
      case 'app-launcher': return `<div class="lib-preview-mini"><i class="fas fa-grid-2" style="font-size:1.4rem"></i><span style="font-size:0.7rem">捷徑</span></div>`;
      case 'qrcode': return `<div class="lib-preview-mini"><i class="fas fa-qrcode" style="font-size:1.8rem"></i></div>`;
      case 'habit': return `<div class="lib-preview-mini"><i class="fas fa-chart-line" style="font-size:1.2rem"></i><span style="font-size:0.7rem">習慣</span></div>`;
      case 'progress': return `<div class="lib-preview-mini"><span style="font-size:1rem;font-weight:700">68%</span><div style="width:40px;height:4px;background:rgba(255,255,255,0.1);border-radius:999px;overflow:hidden"><div style="width:68%;height:100%;background:var(--primary);border-radius:999px"></div></div></div>`;
      case 'custom': return `<div class="lib-preview-mini"><i class="fas fa-wand-magic-sparkles" style="color:var(--purple)"></i><span style="font-size:0.7rem">自訂</span></div>`;
      default: return `<i class="fas fa-grip" style="font-size:1.4rem;color:var(--text-secondary)"></i>`;
    }
  }

  /* ==================== EDITOR PANEL ==================== */
  function openEditor(id) {
    const widget = state.widgets.find(w => w.id === id);
    if (!widget) return;
    state.selectedId = id;
    state.isAddingNew = false;
    state.pendingWidget = null;

    // Render preview
    const previewEl = $('editorPreview');
    if (previewEl) {
      previewEl.innerHTML = '';
      const def = WIDGET_DEFS[widget.type];
      const previewCard = document.createElement('div');
      previewCard.className = 'preview-widget';
      previewCard.id = 'previewWidget';
      previewCard.style.background = widget.bgColor ? hexToRgba(widget.bgColor, 0.5) : 'var(--glass)';
      previewCard.style.borderRadius = `${widget.radius}px`;
      if (def) previewCard.innerHTML = def.render(widget);
      previewEl.appendChild(previewCard);
    }

    // Size
    document.querySelectorAll('#sizeChipRow .size-chip').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.size === widget.size);
    });

    // Opacity
    const opSlider = $('opacitySlider');
    const opVal = $('opacityVal');
    if (opSlider) { opSlider.value = widget.opacity; }
    if (opVal) { opVal.textContent = `${widget.opacity}%`; }

    // Radius
    const radSlider = $('radiusSlider');
    const radVal = $('radiusVal');
    if (radSlider) { radSlider.value = widget.radius; }
    if (radVal) { radVal.textContent = `${widget.radius}px`; }

    // Title/subtitle
    const titleIn = $('editorTitleInput');
    const subIn = $('editorSubtitleInput');
    if (titleIn) titleIn.value = widget.customTitle || '';
    if (subIn) subIn.value = widget.customSubtitle || '';

    // App
    document.querySelectorAll('#appGrid .app-item').forEach(item => {
      item.classList.toggle('active', item.dataset.appId === widget.appId);
    });

    // Toggles
    const lockToggle = $('lockScreenToggle');
    const diToggle = $('deepInteractToggle');
    if (lockToggle) lockToggle.checked = !!widget.lockScreen;
    if (diToggle) diToggle.checked = widget.deepInteract !== false;

    // 顯示「刪除」按鈕（編輯模式）
    const deleteBtn = $('deleteWidgetBtn');
    if (deleteBtn) {
      deleteBtn.innerHTML = '<i class="fas fa-trash"></i> 刪除小工具';
      deleteBtn.style.background = 'rgba(255,59,48,0.06)';
      deleteBtn.style.borderColor = 'rgba(255,59,48,0.3)';
      deleteBtn.style.color = 'var(--danger)';
    }

    $('widgetEditor')?.classList.add('open');
  }

  function closeEditor() {
    $('widgetEditor')?.classList.remove('open');
    state.selectedId = null;
    state.pendingWidget = null;
    state.isAddingNew = false;
  }

  function updateSelectedWidget(changes) {
    // 支援預覽模式
    if (state.isAddingNew && state.pendingWidget) {
      Object.assign(state.pendingWidget, changes);
      updatePreviewWidget();
      return;
    }
    
    if (!state.selectedId) return;
    const w = state.widgets.find(w => w.id === state.selectedId);
    if (!w) return;
    Object.assign(w, changes);
    saveWidgets();
    renderCatalog();
    updatePreviewWidget();
  }
  
  function updatePreviewWidget() {
    const widget = state.isAddingNew ? state.pendingWidget : state.widgets.find(w => w.id === state.selectedId);
    if (!widget) return;
    
    const previewEl = $('previewWidget');
    if (previewEl) {
      if (widget.bgColor) {
        previewEl.style.background = hexToRgba(widget.bgColor, widget.opacity / 100 * 0.35);
      }
      if (widget.radius !== undefined) {
        previewEl.style.borderRadius = `${widget.radius}px`;
      }
      // 更新內容
      const def = WIDGET_DEFS[widget.type];
      if (def) previewEl.innerHTML = def.render(widget);
    }
  }

  /* ==================== COLOR SWATCHES ==================== */
  function buildColorSwatches() {
    const container = $('colorSwatches');
    if (!container) return;
    container.innerHTML = PALETTE_COLORS.map(c => `
      <button class="color-swatch" data-color="${c.hex}" title="${c.label}"
        style="background:${c.hex};${c.hex === '#ffffff' ? 'border-color:rgba(0,0,0,0.15)' : ''}"></button>
    `).join('');
    container.querySelectorAll('.color-swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        sw.classList.add('active');
        updateSelectedWidget({ bgColor: sw.dataset.color, bgType: 'solid', bgImage: '', bgGradient: '' });
      });
    });
  }

  /* ==================== APP GRID ==================== */
  function buildAppGrid() {
    const grid = $('appGrid');
    if (!grid) return;
    grid.innerHTML = APPS.map(a => `
      <div class="app-item" data-app-id="${a.id}">
        <i class="fas ${a.icon}"></i>
        <span>${a.label}</span>
      </div>
    `).join('');
    grid.querySelectorAll('.app-item').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.app-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const appId = item.dataset.appId;
        updateSelectedWidget({ appId });
      });
    });
  }

  /* ==================== EDITOR TAB SWITCHING ==================== */
  function initEditorTabs() {
    const tabs = document.querySelectorAll('.editor-tab-btn');
    const panels = document.querySelectorAll('.editor-panel');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        panels.forEach(p => p.classList.toggle('active', p.id === `panel${tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1)}`));
      });
    });
  }

  /* ==================== ACTIONS ==================== */
  function addWidget(type) {
    const def = WIDGET_DEFS[type];
    if (!def) return;
    const pos = findNextAvailablePosition(def.sizes[0]);
    const newWidget = {
      id: genId(), type, size: def.sizes[0],
      col: pos.col, row: pos.row,
      bgColor: '#0f1118', bgType: 'solid', bgImage: '', bgGradient: '',
      opacity: 80, radius: 20, widgetStyle: 'glass',
      customTitle: '', customSubtitle: '', appId: '',
      enabled: true, order: state.widgets.length,
      lockScreen: false, deepInteract: true
    };
    state.widgets.push(newWidget);
    saveWidgets();
    renderCatalog();
    closeLibrary();
    showToast(`${def.name} 已新增`);
  }
  
  // 確認添加預覽中的 widget
  function confirmAddWidget() {
    if (!state.pendingWidget) return;
    
    // 檢查位置是否可用，若不可用則重新找位置
    const { cols, rows } = getSizeInGrid(state.pendingWidget.size);
    if (!canPlaceAt(state.pendingWidget.col, state.pendingWidget.row, cols, rows)) {
      const pos = findNextAvailablePosition(state.pendingWidget.size);
      state.pendingWidget.col = pos.col;
      state.pendingWidget.row = pos.row;
    }
    
    state.widgets.push(state.pendingWidget);
    saveWidgets();
    renderCatalog();
    
    const def = WIDGET_DEFS[state.pendingWidget.type];
    showToast(`${def?.name || '小工具'} 已新增`);
    
    closeEditor();
  }

  function deleteWidget(id) {
    if (!confirm('刪除這個小工具？')) return;
    state.widgets = state.widgets.filter(w => w.id !== id);
    // 重新計算 order
    state.widgets.forEach((w, i) => w.order = i);
    saveWidgets();
    renderCatalog();
    closeEditor();
    showToast('已刪除');
  }

  function swapWidgets(id1, id2) {
    const w1 = state.widgets.find(w => w.id === id1);
    const w2 = state.widgets.find(w => w.id === id2);
    if (!w1 || !w2) return;
    // 交換位置
    const tmpCol = w1.col; w1.col = w2.col; w2.col = tmpCol;
    const tmpRow = w1.row; w1.row = w2.row; w2.row = tmpRow;
    const tmp = w1.order; w1.order = w2.order; w2.order = tmp;
    saveWidgets();
    renderCatalog();
  }
  
  // 移動 widget 到新位置
  function moveWidgetTo(id, newCol, newRow) {
    const w = state.widgets.find(widget => widget.id === id);
    if (!w) return false;
    const { cols, rows } = getSizeInGrid(w.size);
    if (!canPlaceAt(newCol, newRow, cols, rows, id)) return false;
    w.col = newCol;
    w.row = newRow;
    saveWidgets();
    renderCatalog();
    return true;
  }

  function selectWidget(id) {
    document.querySelectorAll('.widget-card').forEach(c => c.classList.toggle('selected', c.dataset.id === id));
    openEditor(id);
  }

  function toggleEditMode() {
    state.isEditing = !state.isEditing;
    $('editBtnText').textContent = state.isEditing ? '完成' : '編輯';
    $('editBtn')?.classList.toggle('done', state.isEditing);
    $('editToolbar')?.classList.toggle('visible', state.isEditing);
    
    // 更新預覽提示
    const hint = $('previewHint');
    if (hint) {
      hint.textContent = state.isEditing ? '拖曳圖標排序，點擊空白處添加' : '長按圖標進入編輯模式';
    }
    
    if (!state.isEditing) {
      closeEditor();
      closeLibrary();
      closeAppPicker();
    }
    renderCatalog();
    renderDesktopPreview();
  }

  function closeLibrary() { $('widgetLibrary')?.classList.remove('open'); }
  function openLibrary() { $('widgetLibrary')?.classList.add('open'); }

  function resetLayout() {
    if (!confirm('重置所有小工具？')) return;
    state.widgets = [...state.defaultWidgets.map(w => ({ ...w, id: genId() }))];
    saveWidgets();
    renderCatalog();
    showToast('已重置');
  }

  /* ==================== TOAST ==================== */
  function showToast(msg) {
    const t = $('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
  }

  /* ==================== EVENT BINDING ==================== */
  function bindEvents() {
    $('backBtn')?.addEventListener('click', () => {
      window.parent?.postMessage({ type: 'closeApp' }, '*');
    });

    $('editBtn')?.addEventListener('click', toggleEditMode);
    $('addWidgetBtn')?.addEventListener('click', openLibrary);
    $('addAppBtn')?.addEventListener('click', () => { openAppPicker(); });
    $('closeLibraryBtn')?.addEventListener('click', closeLibrary);
    $('resetLayoutBtn')?.addEventListener('click', resetLayout);
    $('saveLayoutBtn')?.addEventListener('click', () => { toggleEditMode(); showToast('已儲存'); });

    $('closeEditorBtn')?.addEventListener('click', closeEditor);
    $('deleteWidgetBtn')?.addEventListener('click', () => {
      if (state.isAddingNew && state.pendingWidget) {
        confirmAddWidget();
      } else if (state.selectedId) {
        deleteWidget(state.selectedId);
      }
    });

    // Size
    document.querySelectorAll('#sizeChipRow .size-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#sizeChipRow .size-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateSelectedWidget({ size: btn.dataset.size });
      });
    });

    // Style chips
    document.querySelectorAll('#styleChips .style-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#styleChips .style-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateSelectedWidget({ widgetStyle: btn.dataset.style });
      });
    });

    // Opacity
    $('opacitySlider')?.addEventListener('input', e => {
      $('opacityVal').textContent = `${e.target.value}%`;
      updateSelectedWidget({ opacity: parseInt(e.target.value) });
    });

    // Radius
    $('radiusSlider')?.addEventListener('input', e => {
      $('radiusVal').textContent = `${e.target.value}px`;
      updateSelectedWidget({ radius: parseInt(e.target.value) });
    });

    // Title/subtitle
    $('editorTitleInput')?.addEventListener('input', e => updateSelectedWidget({ customTitle: e.target.value }));
    $('editorSubtitleInput')?.addEventListener('input', e => updateSelectedWidget({ customSubtitle: e.target.value }));

    // Lock screen toggle
    $('lockScreenToggle')?.addEventListener('change', e => updateSelectedWidget({ lockScreen: e.target.checked }));

    // Deep interact toggle
    $('deepInteractToggle')?.addEventListener('change', e => updateSelectedWidget({ deepInteract: e.target.checked }));

    // Background type
    document.querySelectorAll('#bgTypeToggle .bg-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#bgTypeToggle .bg-type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const type = btn.dataset.bg;
        $('colorSwatches')?.classList.toggle('hidden', type !== 'solid');
        $('gradientPicker')?.classList.toggle('hidden', type !== 'gradient');
        $('imagePicker')?.classList.toggle('hidden', type !== 'image');
      });
    });

    // Bg image
    $('widgetBgImageInput')?.addEventListener('change', e => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => updateSelectedWidget({ bgImage: ev.target.result, bgType: 'image' });
      reader.readAsDataURL(file);
    });
    $('clearBgImageBtn')?.addEventListener('click', () => updateSelectedWidget({ bgImage: '', bgType: 'solid' }));

    // Click outside panels to close
    $('widgetLibrary')?.addEventListener('click', e => { if (e.target === $('widgetLibrary')) closeLibrary(); });
    $('widgetEditor')?.addEventListener('click', e => { if (e.target === $('widgetEditor')) closeEditor(); });

    // Keyboard
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { 
        closeEditor(); 
        closeLibrary(); 
        closeAppPicker();
        if (state.isEditing) toggleEditMode(); 
      }
    });
    
    // Desktop scroll: dots update + wheel + drag support
    const scrollContainer = $('desktopPagesScroll');
    if (scrollContainer) {
      // Scroll event for dots
      scrollContainer.addEventListener('scroll', () => {
        const pages = scrollContainer.querySelectorAll('.desktop-page');
        const dots = $('desktopPageDots')?.querySelectorAll('.dot');
        if (!pages.length || !dots) return;
        const index = Math.round(scrollContainer.scrollLeft / (pages[0]?.offsetWidth || 1));
        dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
      }, { passive: true });
      
      // Wheel horizontal scroll
      scrollContainer.addEventListener('wheel', (e) => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          e.preventDefault();
          scrollContainer.scrollLeft += e.deltaY;
        }
      }, { passive: false });
      
      // Drag to scroll
      let isDragging = false;
      let startX = 0;
      let scrollStart = 0;
      
      scrollContainer.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        scrollStart = scrollContainer.scrollLeft;
        scrollContainer.style.cursor = 'grabbing';
      });
      
      scrollContainer.addEventListener('mouseleave', () => {
        if (isDragging) { isDragging = false; scrollContainer.style.cursor = 'grab'; }
      });
      
      scrollContainer.addEventListener('mouseup', () => {
        if (isDragging) { isDragging = false; scrollContainer.style.cursor = 'grab'; }
      });
      
      scrollContainer.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const dx = e.clientX - startX;
        scrollContainer.scrollLeft = scrollStart - dx;
      });
    }
  }

  /* ==================== TIME UPDATE ==================== */
  function startTimeUpdate() {
    setInterval(() => {
      renderCatalog();
      if (state.selectedId) {
        const previewEl = $('previewWidget');
        const w = state.widgets.find(w => w.id === state.selectedId);
        if (previewEl && w) {
          const def = WIDGET_DEFS[w.type];
          if (def) previewEl.innerHTML = def.render(w);
        }
      }
    }, 1000);
  }

  /* ==================== iOS Safari / Android Chrome 儲存保護 ==================== */
  const saveWidgetData = () => {
    try {
      localStorage.setItem('sx_home_widget_layout', JSON.stringify(state.widgets));
    } catch (e) {
      console.warn('[widget] 保存數據失敗:', e);
    }
  };

  window.addEventListener('pagehide', saveWidgetData);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveWidgetData();
  });
  window.addEventListener('message', (event) => {
    if (event.data?.type === 'APP_WILL_CLOSE') saveWidgetData();
  });

  /* ==================== INIT ==================== */
  function init() {
    // 載入桌面設定
    loadPageSize();
    loadHiddenApps();
    state.appLayout = loadAppLayout();
    
    loadWidgets();
    buildCategoryButtons();
    buildLibraryGrid();
    buildColorSwatches();
    buildAppGrid();
    initEditorTabs();
    bindEvents();
    bindAppPickerEvents();
    renderCatalog();
    renderDesktopPreview();
    startTimeUpdate();
    initDesktopSettings();
    initWidgetSourcePanel();
  }

  /* ==================== WIDGET SOURCE PANEL ==================== */
  let currentSourceCat = 'clock';
  let draggedSourceType = null;

  function initWidgetSourcePanel() {
    buildSourceCategories();
    buildSourceGrid();
    bindSourceDragEvents();
    bindCatalogDropEvents();
  }

  function buildSourceCategories() {
    const container = $('sourceCategories');
    if (!container) return;
    
    container.innerHTML = CATEGORIES.map(c => `
      <button class="source-cat-btn${c.id === currentSourceCat ? ' active' : ''}" data-cat="${c.id}">
        ${c.label}
      </button>
    `).join('');
    
    container.querySelectorAll('.source-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentSourceCat = btn.dataset.cat;
        buildSourceCategories();
        buildSourceGrid();
      });
    });
  }

  function buildSourceGrid() {
    const grid = $('sourceGrid');
    if (!grid) return;
    
    const widgets = Object.entries(WIDGET_DEFS).filter(([,def]) => def.cat === currentSourceCat);
    
    grid.innerHTML = widgets.map(([type, def]) => `
      <div class="source-widget-item" draggable="true" data-type="${type}">
        <div class="source-widget-preview">
          ${getLibPreviewHTML(type, def)}
        </div>
        <span class="source-widget-name">${def.name}</span>
        <div class="source-widget-sizes">
          ${def.sizes.map(s => `<span class="source-size-badge">${s}</span>`).join('')}
        </div>
      </div>
    `).join('');
    
    bindSourceDragEvents();
  }

  function bindSourceDragEvents() {
    const items = document.querySelectorAll('.source-widget-item');
    items.forEach(item => {
      item.addEventListener('dragstart', (e) => {
        draggedSourceType = item.dataset.type;
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', item.dataset.type);
      });
      
      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        draggedSourceType = null;
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
      });
    });
  }

  function bindCatalogDropEvents() {
    const rows = document.querySelectorAll('.widget-row');
    
    rows.forEach(row => {
      row.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (draggedSourceType) {
          row.classList.add('drag-over');
        }
      });
      
      row.addEventListener('dragleave', () => {
        row.classList.remove('drag-over');
      });
      
      row.addEventListener('drop', (e) => {
        e.preventDefault();
        row.classList.remove('drag-over');
        
        if (!draggedSourceType) return;
        
        const type = draggedSourceType;
        const def = WIDGET_DEFS[type];
        if (!def) return;
        
        // 判斷是否為鎖屏區域
        const isLockRow = row.dataset.sizeRow === 'lock-1x';
        let targetSize = def.sizes[0];
        
        // 如果是鎖屏區域，優先選擇 lock-1x 尺寸
        if (isLockRow && def.sizes.includes('lock-1x')) {
          targetSize = 'lock-1x';
        } else if (isLockRow) {
          showToast('此小工具不支援鎖屏');
          return;
        }
        
        // 建立新 widget
        const pos = findNextAvailablePosition(targetSize);
        const newWidget = {
          id: genId(),
          type,
          size: targetSize,
          col: pos.col,
          row: pos.row,
          bgColor: '#0f1118',
          bgType: 'solid',
          bgImage: '',
          bgGradient: '',
          opacity: 80,
          radius: 16,
          widgetStyle: 'glass',
          customTitle: '',
          customSubtitle: '',
          appId: '',
          enabled: true,
          order: state.widgets.length,
          lockScreen: isLockRow,
          deepInteract: true
        };
        
        state.widgets.push(newWidget);
        saveWidgets();
        renderCatalog();
        syncToHome();
        showToast(`已新增「${def.name}」`);
      });
    });
  }
  
  /* ==================== APP PICKER EVENTS ==================== */
  function bindAppPickerEvents() {
    // 關閉按鈕
    $('closeAppPickerBtn')?.addEventListener('click', closeAppPicker);
    
    // 分類按鈕
    document.querySelectorAll('#appPickerCategories .app-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#appPickerCategories .app-cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderAppPickerGrid(btn.dataset.cat, $('appPickerSearch')?.value || '');
      });
    });
    
    // 搜尋
    $('appPickerSearch')?.addEventListener('input', (e) => {
      const activeCat = document.querySelector('#appPickerCategories .app-cat-btn.active')?.dataset.cat || 'all';
      renderAppPickerGrid(activeCat, e.target.value);
    });
    
    // 點擊背景關閉
    $('appPickerPanel')?.addEventListener('click', (e) => {
      if (e.target === $('appPickerPanel')) closeAppPicker();
    });
  }

  /* ==================== 桌面設定 ==================== */
  function initDesktopSettings() {
    const pageSizeSelect = $('pageSizeSelect');
    const shortcutsGrid = $('shortcutsGrid');
    
    if (!pageSizeSelect || !shortcutsGrid) return;
    
    // 載入當前設定
    const savedPageSize = localStorage.getItem('sx_home_page_size') || '8';
    pageSizeSelect.value = savedPageSize;
    
    // 載入快捷方式列表
    loadShortcutsList();
    
    // 事件綁定：每頁圖標數量
    pageSizeSelect.addEventListener('change', (e) => {
      localStorage.setItem('sx_home_page_size', e.target.value);
      showToast('已儲存，重新整理首頁後生效');
    });
  }
  
  function loadShortcutsList() {
    const shortcutsGrid = $('shortcutsGrid');
    if (!shortcutsGrid) return;
    
    // 從 localStorage 讀取隱藏的應用程式
    const hiddenApps = getHiddenApps();
    
    // 應用程式列表
    const apps = [
      { id: 'chat', label: '聊天' },
      { id: 'settings', label: '設定' },
      { id: 'album', label: '相簿' },
      { id: 'twitter', label: 'Twitter' },
      { id: 'facebook', label: 'Facebook' },
      { id: 'instagram', label: 'Instagram' },
      { id: 'youtube', label: 'YouTube' },
      { id: 'bilibili', label: 'Bilibili' },
      { id: 'music', label: '音樂' },
      { id: 'weather', label: '天氣' },
      { id: 'timetree', label: '時間樹' },
      { id: 'delivery', label: '外送' },
      { id: 'taobao', label: '淘寶' },
      { id: 'dating', label: '約會' },
      { id: 'widget', label: '小工具' },
      { id: 'phone', label: '電話' },
      { id: 'weverse', label: 'Weverse' },
      { id: 'bubbles', label: 'Bubbles' },
      { id: 'lofter', label: 'Lofter' },
      { id: 'twitch', label: 'Twitch' },
      { id: 'ao3', label: 'AO3' },
      { id: 'chrome', label: 'Chrome' },
      { id: 'kakaopay', label: 'KakaoPay' },
      { id: 'touch', label: 'Touch' },
      { id: 'daily-recipe', label: '每日食譜' },
      { id: 'exchange-diary', label: '交換日記' },
      { id: 'drift-bottle', label: '漂流瓶' },
      { id: 'emoji-shop', label: '表情商店' },
      { id: 'gift-shop', label: '禮物店' },
      { id: 'guzi-guide', label: '谷子指南' },
      { id: 'match-3', label: '消消樂' },
      { id: 'passkey', label: '通行密鑰' },
      { id: 'pomodoro', label: '番茄鐘' },
      { id: 'screenshots', label: '截圖' },
      { id: 'smart-painter', label: '照相館' },
      { id: 'theme-shop', label: '主題商店' },
      { id: 'worldbook', label: '世界書' },
      { id: 'theater', label: '劇場' },
      { id: 'arcade', label: '街機廳' },
      { id: 'personal-wiki', label: '個人紀錄' }
    ];
    
    shortcutsGrid.innerHTML = apps.map(app => {
      const isHidden = hiddenApps.includes(app.id);
      return `<div class="shortcut-item ${isHidden ? 'hidden' : ''}" data-app-id="${app.id}">
        <span class="shortcut-label">${app.label}</span>
        <button class="shortcut-toggle">${isHidden ? '顯示' : '隱藏'}</button>
      </div>`;
    }).join('');
    
    // 事件綁定
    shortcutsGrid.querySelectorAll('.shortcut-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const item = e.target.closest('.shortcut-item');
        const appId = item.dataset.appId;
        const hiddenApps = getHiddenApps();
        const isHidden = hiddenApps.includes(appId);
        
        if (isHidden) {
          showApp(appId);
          item.classList.remove('hidden');
          btn.textContent = '隱藏';
        } else {
          hideApp(appId);
          item.classList.add('hidden');
          btn.textContent = '顯示';
        }
        
        showToast('已儲存');
      });
    });
  }
  
  function getHiddenApps() {
    try {
      const raw = localStorage.getItem('sx_hidden_apps');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }
  
  function hideApp(appId) {
    const hidden = getHiddenApps();
    if (!hidden.includes(appId)) {
      hidden.push(appId);
      localStorage.setItem('sx_hidden_apps', JSON.stringify(hidden));
    }
  }
  
  function showApp(appId) {
    const hidden = getHiddenApps();
    const idx = hidden.indexOf(appId);
    if (idx > -1) {
      hidden.splice(idx, 1);
      localStorage.setItem('sx_hidden_apps', JSON.stringify(hidden));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
