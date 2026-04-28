const WEATHER_STORAGE_KEY = 'sx_weather_location';
const WEATHER_CACHE_KEY = 'sx_weather_cache';
const CACHE_TTL = 10 * 60 * 1000;

const UserEnv = {
    ua: navigator.userAgent,
    isIOS() { return /iPad|iPhone|iPod/.test(this.ua) && !window.MSStream; },
    isAndroid() { return /Android/.test(this.ua); },
    isDesktop() { return !this.isIOS() && !this.isAndroid(); }
};

function handleBack() {
    const isIframe = window.parent && window.parent !== window;
    if (isIframe) {
        try {
            window.parent.postMessage({ type: 'closeApp', appId: 'weather' }, '*');
            return;
        } catch (e) {
            console.warn('postMessage 發送失敗:', e);
        }
    }
    const homePath = "../index.html";
    setTimeout(() => {
        window.location.replace(homePath);
    }, 100);
}

const elements = {
    locationInput: document.getElementById('location-input'),
    searchBtn: document.getElementById('search-btn'),
    locationDisplay: document.getElementById('location-display'),
    updateTime: document.getElementById('update-time'),
    currentTemp: document.getElementById('current-temp'),
    currentDesc: document.getElementById('current-desc'),
    currentWind: document.getElementById('current-wind'),
    currentHumidity: document.getElementById('current-humidity'),
    currentPrecip: document.getElementById('current-precip'),
    dailyForecast: document.getElementById('daily-forecast'),
    weeklyForecast: document.getElementById('weekly-forecast'),
    charAvatar: document.getElementById('char-avatar'),
    charName: document.getElementById('char-name'),
    charNote: document.getElementById('char-note'),
    charPlaceholder: document.getElementById('char-placeholder')
};

function loadCharFromChats() {
    const masks = JSON.parse(localStorage.getItem('sx_masks') || '[]');
    const activeMask = masks[0] || {};
    const name = activeMask.name || localStorage.getItem('sx_char_name') || '';
    const avatar = activeMask.avatar || localStorage.getItem('sx_char_avatar') || '';

    if (!elements.charName || !elements.charAvatar) return;

    if (!name && !avatar) {
        elements.charName.textContent = '尚未設定角色';
        elements.charAvatar.textContent = '?';
        if (elements.charPlaceholder) elements.charPlaceholder.style.display = 'block';
        return;
    }

    elements.charName.textContent = name || '未命名角色';
    if (avatar) {
        elements.charAvatar.innerHTML = `<img src="${avatar}" alt="${name}" />`;
        elements.charAvatar.classList.add('image');
    } else {
        elements.charAvatar.textContent = name.charAt(0) || '?';
    }
    if (elements.charPlaceholder) elements.charPlaceholder.style.display = 'none';
}

function setLoadingState(message) {
    if (elements.currentDesc) elements.currentDesc.textContent = message;
    if (elements.dailyForecast) {
        elements.dailyForecast.innerHTML = `<div class="empty-state">${message}</div>`;
    }
    if (elements.weeklyForecast) {
        elements.weeklyForecast.innerHTML = `<div class="empty-state">${message}</div>`;
    }
}

function formatUpdateTime(timestamp) {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function cacheWeatherData(location, data) {
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({
        location,
        timestamp: Date.now(),
        data
    }));
}

function getCachedWeather(location) {
    const raw = localStorage.getItem(WEATHER_CACHE_KEY);
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        if (parsed.location !== location) return null;
        if (Date.now() - parsed.timestamp > CACHE_TTL) return null;
        return parsed.data;
    } catch (e) {
        return null;
    }
}

async function geocodeLocation(query) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=zh-TW&format=json`;
    console.log('[Weather] 正在查詢地點:', query);
    
    let response;
    try {
        response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache'
        });
    } catch (fetchError) {
        console.error('[Weather] 地理編碼請求失敗:', fetchError);
        throw new Error('網路連線失敗，請檢查網路狀態');
    }
    
    if (!response.ok) {
        console.error('[Weather] 地理編碼 HTTP 錯誤:', response.status);
        throw new Error(`地理編碼失敗 (HTTP ${response.status})`);
    }
    
    const data = await response.json();
    if (!data.results || data.results.length === 0) {
        console.warn('[Weather] 找不到地點:', query);
        throw new Error('找不到此地區，請嘗試其他關鍵字');
    }
    
    const place = data.results[0];
    console.log('[Weather] 找到地點:', place.name);
    return {
        name: `${place.name}${place.admin1 ? `, ${place.admin1}` : ''}${place.country ? `, ${place.country}` : ''}`,
        lat: place.latitude,
        lon: place.longitude,
        timezone: place.timezone
    };
}

async function fetchWeatherData(lat, lon, timezone) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=${encodeURIComponent(timezone)}`;
    console.log('[Weather] 正在取得天氣資料...');
    
    let response;
    try {
        response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache'
        });
    } catch (fetchError) {
        console.error('[Weather] 天氣資料請求失敗:', fetchError);
        throw new Error('網路連線失敗，請檢查網路狀態');
    }
    
    if (!response.ok) {
        console.error('[Weather] 天氣資料 HTTP 錯誤:', response.status);
        throw new Error(`天氣資料取得失敗 (HTTP ${response.status})`);
    }
    
    const data = response.json();
    console.log('[Weather] 天氣資料取得成功');
    return data;
}

function getWeatherIcon(code) {
    if (code === 0) return 'fa-sun';
    if ([1, 2].includes(code)) return 'fa-cloud-sun';
    if (code === 3) return 'fa-cloud';
    if ([45, 48].includes(code)) return 'fa-smog';
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return 'fa-cloud-rain';
    if ([71, 73, 75, 77, 85, 86].includes(code)) return 'fa-snowflake';
    if ([95, 96, 99].includes(code)) return 'fa-cloud-bolt';
    return 'fa-cloud';
}

function getWeatherDescription(code) {
    const map = {
        0: '晴朗',
        1: '多雲',
        2: '陰晴',
        3: '陰天',
        45: '有霧',
        48: '濃霧',
        51: '毛毛雨',
        53: '細雨',
        55: '小雨',
        61: '小雨',
        63: '中雨',
        65: '大雨',
        71: '小雪',
        73: '中雪',
        75: '大雪',
        77: '霰',
        80: '陣雨',
        81: '強陣雨',
        82: '大陣雨',
        85: '陣雪',
        86: '強陣雪',
        95: '雷雨',
        96: '雷雨冰雹',
        99: '強雷雨'
    };
    return map[code] || '天氣不明';
}

function renderCurrent(placeName, data) {
    const current = data.current;
    if (!current) return;

    if (elements.locationDisplay) elements.locationDisplay.textContent = placeName;
    if (elements.updateTime) elements.updateTime.textContent = `更新 ${formatUpdateTime(Date.now())}`;
    if (elements.currentTemp) elements.currentTemp.textContent = `${Math.round(current.temperature_2m)}°`;
    if (elements.currentDesc) {
        const dailyCode = data.daily?.weathercode?.[0] ?? 0;
        elements.currentDesc.textContent = getWeatherDescription(dailyCode);
    }
    if (elements.currentWind) elements.currentWind.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
    if (elements.currentHumidity) elements.currentHumidity.textContent = `${Math.round(current.relative_humidity_2m)}%`;
    if (elements.currentPrecip) elements.currentPrecip.textContent = `${Math.round(current.precipitation)} mm`;
}

function renderDailyForecast(data) {
    const daily = data.daily;
    if (!daily || !elements.dailyForecast) return;

    elements.dailyForecast.innerHTML = daily.time.slice(0, 4).map((time, index) => {
        const date = new Date(time);
        const dayLabel = date.toLocaleDateString('zh-TW', { weekday: 'short' });
        const icon = getWeatherIcon(daily.weathercode[index]);
        const range = `${Math.round(daily.temperature_2m_min[index])}° / ${Math.round(daily.temperature_2m_max[index])}°`;
        return `
            <div class="forecast-card">
                <div class="day">${dayLabel}</div>
                <div class="icon"><i class="fas ${icon}"></i></div>
                <div class="range">${range}</div>
            </div>
        `;
    }).join('');
}

function renderWeeklyForecast(data) {
    const daily = data.daily;
    if (!daily || !elements.weeklyForecast) return;

    elements.weeklyForecast.innerHTML = daily.time.map((time, index) => {
        const date = new Date(time);
        const dayLabel = date.toLocaleDateString('zh-TW', { weekday: 'short', month: 'numeric', day: 'numeric' });
        const range = `${Math.round(daily.temperature_2m_min[index])}° / ${Math.round(daily.temperature_2m_max[index])}°`;
        const precip = daily.precipitation_probability_max?.[index];
        const precipText = precip !== undefined ? `降雨 ${precip}%` : '降雨 --';
        const icon = getWeatherIcon(daily.weathercode[index]);
        return `
            <div class="week-item">
                <div class="week-day">${dayLabel}</div>
                <div class="week-range"><i class="fas ${icon}"></i> ${range}</div>
                <div class="week-precip">${precipText}</div>
            </div>
        `;
    }).join('');
}

async function refreshWeather(locationName) {
    if (!locationName) return;
    setLoadingState('讀取天氣中...');

    try {
        const cached = getCachedWeather(locationName);
        if (cached) {
            console.log('[Weather] 使用快取資料');
            renderCurrent(cached.placeName, cached.data);
            renderDailyForecast(cached.data);
            renderWeeklyForecast(cached.data);
            return;
        }

        const place = await geocodeLocation(locationName);
        const weatherData = await fetchWeatherData(place.lat, place.lon, place.timezone || 'Asia/Taipei');
        const payload = { placeName: place.name, data: weatherData };
        cacheWeatherData(locationName, payload);
        renderCurrent(payload.placeName, payload.data);
        renderDailyForecast(payload.data);
        renderWeeklyForecast(payload.data);
    } catch (e) {
        console.error('[Weather] 錯誤:', e);
        const errorMsg = e.message || '找不到天氣資料';
        setLoadingState(errorMsg);
        if (elements.currentDesc) elements.currentDesc.textContent = errorMsg;
    }
}

function bindEvents() {
    if (elements.searchBtn && elements.locationInput) {
        elements.searchBtn.addEventListener('click', () => {
            const value = elements.locationInput.value.trim();
            if (!value) {
                setLoadingState('請輸入地區名稱');
                return;
            }
            localStorage.setItem(WEATHER_STORAGE_KEY, value);
            refreshWeather(value);
        });

        elements.locationInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                elements.searchBtn.click();
            }
        });
    }
}

function checkNetworkAndBootstrap() {
    console.log('[Weather] 初始化天氣應用...');
    
    if (!navigator.onLine) {
        console.warn('[Weather] 離線狀態');
        setLoadingState('離線中，請檢查網路連線');
        return;
    }
    
    loadCharFromChats();

    const storedLocation = localStorage.getItem(WEATHER_STORAGE_KEY);
    if (storedLocation && elements.locationInput) {
        elements.locationInput.value = storedLocation;
        refreshWeather(storedLocation);
    } else {
        setLoadingState('請輸入地區取得預報');
    }
}

window.addEventListener('online', () => {
    console.log('[Weather] 網路已連線');
    const storedLocation = localStorage.getItem(WEATHER_STORAGE_KEY);
    if (storedLocation) {
        refreshWeather(storedLocation);
    }
});

window.addEventListener('offline', () => {
    console.log('[Weather] 網路已斷線');
    setLoadingState('離線中，請檢查網路連線');
});

bindEvents();
checkNetworkAndBootstrap();
