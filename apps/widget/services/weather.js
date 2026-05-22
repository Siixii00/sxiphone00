const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';
const CACHE_DURATION = 30 * 60 * 1000;

let weatherCache = null;
let lastFetchTime = 0;

export async function fetchWeather(lat, lon) {
  const now = Date.now();
  
  if (weatherCache && (now - lastFetchTime) < CACHE_DURATION) {
    return weatherCache;
  }
  
  try {
    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      current: 'temperature_2m,weather_code,wind_speed_10m',
      daily: 'temperature_2m_max,temperature_2m_min',
      timezone: 'auto',
      forecast_days: 1
    });
    
    const res = await fetch(`${WEATHER_API}?${params}`);
    if (!res.ok) throw new Error('Weather API error');
    
    const data = await res.json();
    
    weatherCache = data;
    lastFetchTime = now;
    
    localStorage.setItem('sx_weather_cache', JSON.stringify({
      temp: Math.round(data.current?.temperature_2m || 25) + '°',
      code: data.current?.weather_code || 0,
      high: Math.round(data.daily?.temperature_2m_max?.[0] || 30) + '°',
      low: Math.round(data.daily?.temperature_2m_min?.[0] || 22) + '°',
      windSpeed: data.current?.wind_speed_10m || 0,
      timestamp: now
    }));
    
    return data;
  } catch (e) {
    console.error('Failed to fetch weather:', e);
    return getCachedWeather();
  }
}

export function getCachedWeather() {
  try {
    const raw = localStorage.getItem('sx_weather_cache');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return null;
}

export async function getCityName(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { 'Accept-Language': 'zh-TW' } }
    );
    const data = await res.json();
    return data.address?.city || data.address?.town || data.address?.county || '未知位置';
  } catch (e) {
    console.error('Failed to get city name:', e);
    return '未知位置';
  }
}

export function getWeatherIcon(code) {
  if (code === 0) return createSunIcon();
  if (code <= 2) return createPartlyCloudyIcon();
  if (code === 3) return createCloudIcon();
  if (code >= 45 && code <= 48) return createFogIcon();
  if (code >= 51 && code <= 67) return createRainIcon();
  if (code >= 71 && code <= 77) return createSnowIcon();
  if (code >= 80 && code <= 82) return createRainIcon();
  if (code >= 85 && code <= 86) return createSnowIcon();
  if (code >= 95) return createThunderIcon();
  return createSunIcon();
}

function createSunIcon() {
  return `<div class="weather-icon-sun"></div>`;
}

function createPartlyCloudyIcon() {
  return `<div class="weather-icon-partly-cloudy">
    <div class="weather-icon-sun" style="width:20px;height:20px;top:-4px;right:-4px;position:absolute;"></div>
    <div class="weather-icon-cloud"></div>
  </div>`;
}

function createCloudIcon() {
  return `<div class="weather-icon-cloud"></div>`;
}

function createFogIcon() {
  return `<div class="weather-icon-fog">
    <div style="width:28px;height:3px;background:rgba(255,255,255,0.5);border-radius:2px;margin:3px 0;"></div>
    <div style="width:24px;height:3px;background:rgba(255,255,255,0.4);border-radius:2px;margin:3px 0;"></div>
    <div style="width:20px;height:3px;background:rgba(255,255,255,0.3);border-radius:2px;margin:3px 0;"></div>
  </div>`;
}

function createRainIcon() {
  return `<div class="weather-icon-rain"></div>`;
}

function createSnowIcon() {
  return `<div class="weather-icon-snow">
    <div style="width:6px;height:6px;background:#fff;border-radius:50%;position:absolute;top:0;left:4px;"></div>
    <div style="width:5px;height:5px;background:#fff;border-radius:50%;position:absolute;top:10px;left:12px;"></div>
    <div style="width:4px;height:4px;background:#fff;border-radius:50%;position:absolute;top:20px;left:6px;"></div>
  </div>`;
}

function createThunderIcon() {
  return `<div class="weather-icon-thunder">
    <div class="weather-icon-cloud" style="opacity:0.7;"></div>
    <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:12px solid #FFD60A;position:absolute;bottom:0;left:10px;"></div>
  </div>`;
}

export function getWeatherDescription(code) {
  const descriptions = {
    0: '晴朗',
    1: '晴時多雲',
    2: '多雲',
    3: '陰天',
    45: '霧',
    48: '霧凇',
    51: '小毛雨',
    53: '毛雨',
    55: '大毛雨',
    61: '小雨',
    63: '中雨',
    65: '大雨',
    71: '小雪',
    73: '中雪',
    75: '大雪',
    80: '陣雨',
    81: '中陣雨',
    82: '大陣雨',
    95: '雷雨',
    96: '雷雨冰雹',
    99: '大雷雨冰雹'
  };
  return descriptions[code] || '未知';
}

export async function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        resolve({ lat: 25.0330, lon: 121.5654 });
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  });
}
