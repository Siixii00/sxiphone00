const WEATHER_STORAGE_KEY = 'sx_weather_location';
const WEATHER_CACHE_KEY = 'sx_weather_cache';
const CACHE_TTL = 10 * 60 * 1000;

const PINYIN_MAP = {
    '台': 'tai', '臺': 'tai', '北': 'bei', '新': 'xin', '桃': 'tao', '園': 'yuan',
    '中': 'zhong', '南': 'nan', '高': 'gao', '雄': 'xiong', '基': 'ji', '隆': 'long',
    '竹': 'zhu', '嘉': 'jia', '義': 'yi', '宜': 'yi', '蘭': 'lan', '花': 'hua',
    '蓮': 'lian', '東': 'dong', '屏': 'ping', '投': 'tou', '彰': 'zhang', '化': 'hua',
    '雲': 'yun', '林': 'lin', '苗': 'miao', '栗': 'li', '澎': 'peng', '湖': 'hu',
    '金': 'jin', '門': 'men', '馬': 'ma', '祖': 'zu', '香': 'xiang', '港': 'gang',
    '澳': 'ao', '門': 'men', '上': 'shang', '海': 'hai', '京': 'jing', '廣': 'guang',
    '州': 'zhou', '深': 'shen', '圳': 'zhen', '杭': 'hang', '成': 'cheng', '都': 'du',
    '重': 'chong', '慶': 'qing', '武': 'wu', '漢': 'han', '西': 'xi', '安': 'an',
    '蘇': 'su', '津': 'jin', '青': 'qing', '島': 'dao', '大': 'da', '連': 'lian',
    '廈': 'xia', '門': 'men', '福': 'fu', '建': 'jian', '長': 'chang', '沙': 'sha',
    '鄭': 'zheng', '東': 'dong', '京': 'jing', '阪': 'ban', '都': 'du', '名': 'ming',
    '古': 'gu', '屋': 'wu', '札': 'zha', '幌': 'huang', '福': 'fu', '岡': 'gang',
    '沖': 'chong', '繩': 'sheng', '首': 'shou', '爾': 'er', '釜': 'fu', '山': 'shan',
    '濟': 'ji', '州': 'zhou', '新': 'xin', '加': 'jia', '坡': 'po', '曼': 'man',
    '谷': 'gu', '吉': 'ji', '隆': 'long', '坡': 'po', '雅': 'ya', '加': 'jia',
    '達': 'da', '馬': 'ma', '尼': 'ni', '拉': 'la', '河': 'he', '內': 'nei',
    '胡': 'hu', '志': 'zhi', '明': 'ming', '市': 'shi', '紐': 'niu', '約': 'yue',
    '洛': 'luo', '杉': 'shan', '磯': 'ji', '舊': 'jiu', '金': 'jin', '山': 'shan',
    '西': 'xi', '雅': 'ya', '圖': 'tu', '芝': 'zhi', '哥': 'ge', '休': 'xiu',
    '士': 'shi', '頓': 'dun', '邁': 'mai', '阿': 'a', '密': 'mi', '波': 'bo',
    '士': 'shi', '頓': 'dun', '拉': 'la', '斯': 'si', '維': 'wei', '加': 'jia',
    '斯': 'si', '倫': 'lun', '敦': 'dun', '巴': 'ba', '黎': 'li', '柏': 'bai',
    '林': 'lin', '羅': 'luo', '馬': 'ma', '德': 'de', '里': 'li', '阿': 'a',
    '姆': 'mu', '斯': 'si', '特': 'te', '丹': 'dan', '雪': 'xue', '梨': 'li',
    '墨': 'mo', '爾': 'er', '本': 'ben', '布': 'bu', '里': 'li', '斯': 'si',
    '本': 'ben', '奧': 'ao', '克': 'ke', '蘭': 'lan', '溫': 'wen', '哥': 'ge',
    '華': 'hua', '多': 'duo', '倫': 'lun', '多': 'duo', '蒙': 'meng', '特': 'te',
    '婁': 'lou', '市': 'shi', '縣': 'xian', '省': 'sheng'
};

function chineseToPinyin(text) {
    let result = '';
    for (const char of text) {
        if (PINYIN_MAP[char]) {
            result += PINYIN_MAP[char];
        } else if (/[\u4e00-\u9fa5]/.test(char)) {
            result += char;
        } else {
            result += char;
        }
    }
    return result;
}

function isChinese(text) {
    return /[\u4e00-\u9fa5]/.test(text);
}

const CITY_NAME_MAP = {
    '台北': 'Taipei',
    '臺北': 'Taipei',
    '新北': 'New Taipei',
    '桃園': 'Taoyuan',
    '台中': 'Taichung',
    '臺中': 'Taichung',
    '台南': 'Tainan',
    '臺南': 'Tainan',
    '高雄': 'Kaohsiung',
    '基隆': 'Keelung',
    '新竹': 'Hsinchu',
    '嘉義': 'Chiayi',
    '宜蘭': 'Yilan',
    '花蓮': 'Hualien',
    '台東': 'Taitung',
    '臺東': 'Taitung',
    '屏東': 'Pingtung',
    '南投': 'Nantou',
    '彰化': 'Changhua',
    '雲林': 'Yunlin',
    '苗栗': 'Miaoli',
    '澎湖': 'Penghu',
    '金門': 'Kinmen',
    '馬祖': 'Matsu',
    '香港': 'Hong Kong',
    '澳門': 'Macau',
    '上海': 'Shanghai',
    '北京': 'Beijing',
    '廣州': 'Guangzhou',
    '深圳': 'Shenzhen',
    '杭州': 'Hangzhou',
    '南京': 'Nanjing',
    '成都': 'Chengdu',
    '重慶': 'Chongqing',
    '武漢': 'Wuhan',
    '西安': 'Xi\'an',
    '蘇州': 'Suzhou',
    '天津': 'Tianjin',
    '青島': 'Qingdao',
    '大連': 'Dalian',
    '廈門': 'Xiamen',
    '福州': 'Fuzhou',
    '長沙': 'Changsha',
    '鄭州': 'Zhengzhou',
    '東京': 'Tokyo',
    '大阪': 'Osaka',
    '京都': 'Kyoto',
    '名古屋': 'Nagoya',
    '札幌': 'Sapporo',
    '福岡': 'Fukuoka',
    '沖繩': 'Okinawa',
    '首爾': 'Seoul',
    '釜山': 'Busan',
    '濟州': 'Jeju',
    '新加坡': 'Singapore',
    '曼谷': 'Bangkok',
    '吉隆坡': 'Kuala Lumpur',
    '雅加達': 'Jakarta',
    '馬尼拉': 'Manila',
    '河內': 'Hanoi',
    '胡志明市': 'Ho Chi Minh City',
    '紐約': 'New York',
    '洛杉磯': 'Los Angeles',
    '舊金山': 'San Francisco',
    '西雅圖': 'Seattle',
    '芝加哥': 'Chicago',
    '休士頓': 'Houston',
    '邁阿密': 'Miami',
    '波士頓': 'Boston',
    '拉斯維加斯': 'Las Vegas',
    '倫敦': 'London',
    '巴黎': 'Paris',
    '柏林': 'Berlin',
    '羅馬': 'Rome',
    '馬德里': 'Madrid',
    '阿姆斯特丹': 'Amsterdam',
    '雪梨': 'Sydney',
    '墨爾本': 'Melbourne',
    '布里斯本': 'Brisbane',
    '奧克蘭': 'Auckland',
    '溫哥華': 'Vancouver',
    '多倫多': 'Toronto',
    '蒙特婁': 'Montreal'
};

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
    let charName = localStorage.getItem('sx_char_name');
    let charAvatar = localStorage.getItem('sx_char_avatar');
    
    if (charName && charName !== '預設用戶') {
        const raw = localStorage.getItem('sx_characters');
        if (raw) {
            try {
                const chars = JSON.parse(raw);
                const found = chars.find(c => c.name === charName);
                if (found) {
                    if (!elements.charName || !elements.charAvatar) return;
                    elements.charName.textContent = found.name || '未命名角色';
                    if (found.avatar) {
                        elements.charAvatar.innerHTML = `<img src="${found.avatar}" alt="${found.name}" />`;
                        elements.charAvatar.classList.add('image');
                    } else {
                        elements.charAvatar.textContent = found.name.charAt(0) || '?';
                    }
                    if (elements.charPlaceholder) elements.charPlaceholder.style.display = 'none';
                    return;
                }
            } catch (e) {
                console.warn('[Weather] 解析 sx_characters 失敗:', e);
            }
        }
        
        if (!elements.charName || !elements.charAvatar) return;
        elements.charName.textContent = charName || '未命名角色';
        if (charAvatar) {
            elements.charAvatar.innerHTML = `<img src="${charAvatar}" alt="${charName}" />`;
            elements.charAvatar.classList.add('image');
        } else {
            elements.charAvatar.textContent = charName.charAt(0) || '?';
        }
        if (elements.charPlaceholder) elements.charPlaceholder.style.display = 'none';
        return;
    }
    
    const rawChars = localStorage.getItem('sx_characters');
    if (rawChars) {
        try {
            const chars = JSON.parse(rawChars);
            if (Array.isArray(chars) && chars.length > 0) {
                const firstChar = chars[0];
                if (firstChar && firstChar.name && firstChar.name !== '預設用戶') {
                    if (!elements.charName || !elements.charAvatar) return;
                    elements.charName.textContent = firstChar.name || '未命名角色';
                    if (firstChar.avatar) {
                        elements.charAvatar.innerHTML = `<img src="${firstChar.avatar}" alt="${firstChar.name}" />`;
                        elements.charAvatar.classList.add('image');
                    } else {
                        elements.charAvatar.textContent = firstChar.name.charAt(0) || '?';
                    }
                    if (elements.charPlaceholder) elements.charPlaceholder.style.display = 'none';
                    return;
                }
            }
        } catch (e) {
            console.warn('[Weather] 解析 sx_characters 失敗:', e);
        }
    }

    const masks = JSON.parse(localStorage.getItem('sx_masks') || '[]');
    const activeMask = masks[0] || {};
    const name = activeMask.name || '';
    const avatar = activeMask.avatar || '';

    if (!elements.charName || !elements.charAvatar) return;

    if (!name) {
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
    console.log('[Weather] 正在查詢地點:', query);
    
    let searchTerms = [query];
    
    if (CITY_NAME_MAP[query]) {
        searchTerms.push(CITY_NAME_MAP[query]);
    }
    
    if (isChinese(query)) {
        const pinyin = chineseToPinyin(query);
        if (pinyin !== query) {
            searchTerms.push(pinyin);
            const capitalized = pinyin.charAt(0).toUpperCase() + pinyin.slice(1);
            searchTerms.push(capitalized);
        }
    }
    
    searchTerms = [...new Set(searchTerms)];
    
    for (const searchTerm of searchTerms) {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchTerm)}&count=5&language=zh-TW&format=json`;
        
        let response;
        try {
            response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache'
            });
        } catch (fetchError) {
            console.error('[Weather] 地理編碼請求失敗:', fetchError);
            continue;
        }
        
        if (!response.ok) {
            console.error('[Weather] 地理編碼 HTTP 錯誤:', response.status);
            continue;
        }
        
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            const place = data.results[0];
            console.log('[Weather] 找到地點:', place.name, '(使用搜尋詞:', searchTerm, ')');
            return {
                name: `${place.name}${place.admin1 ? `, ${place.admin1}` : ''}${place.country ? `, ${place.country}` : ''}`,
                lat: place.latitude,
                lon: place.longitude,
                timezone: place.timezone
            };
        }
    }
    
    console.warn('[Weather] 找不到地點:', query);
    throw new Error('找不到此地區，請嘗試輸入英文城市名（如 Taipei、Tokyo）');
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

let currentWeatherData = null;
let currentPlaceName = null;

const WEATHER_REMINDERS = {
    hot: [
        '今天好熱，出門記得防曬喔！',
        '天氣炎熱，多喝水別中暑了～',
        '高溫警報！待在涼爽的地方比較好',
        '太陽很大，出門要帶傘或帽子喔'
    ],
    cold: [
        '今天好冷，出門記得多穿點！',
        '天氣冷冷的，別感冒了喔～',
        '低溫來襲！圍巾手套準備好',
        '好冷呀～來杯熱飲暖暖身子吧'
    ],
    rain: [
        '今天會下雨，出門記得帶傘！',
        '雨天出門要小心路滑喔～',
        '下雨了，別淋濕了！',
        '天氣濕濕的，注意別著涼'
    ],
    sunny: [
        '天氣不錯呢！適合出門走走～',
        '陽光普照，心情也跟著好起來了',
        '今天天氣很棒，有什麼計畫嗎？',
        '好天氣！適合出去曬曬太陽'
    ],
    cloudy: [
        '多雲的天氣，說變就變呢',
        '陰陰的天，可能要下雨喔',
        '雲有點多，但還是挺舒適的',
        '多雲時陰，出門帶件外套吧'
    ],
    storm: [
        '雷雨天來了！盡量別出門喔',
        '外面在打雷，待在室內比較安全',
        '天氣惡劣，注意安全！',
        '雷聲隆隆，別害怕，我陪著你'
    ],
    snow: [
        '下雪了！好浪漫～',
        '雪天路滑，走路要小心喔',
        '白茫茫一片，好漂亮！',
        '下雪天氣，保暖最重要'
    ],
    nice: [
        '今天天氣剛剛好，很舒適呢',
        '氣溫適中，很適合出門喔',
        '天氣宜人，心情也變好了～',
        '這種天氣最舒服了'
    ]
};

function getWeatherType(data) {
    if (!data || !data.daily || !data.current) return 'nice';
    
    const code = data.daily.weathercode?.[0] ?? 0;
    const temp = data.current.temperature_2m;
    
    if ([95, 96, 99].includes(code)) return 'storm';
    if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snow';
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return 'rain';
    if (temp >= 30) return 'hot';
    if (temp <= 15) return 'cold';
    if ([0, 1].includes(code)) return 'sunny';
    if ([2, 3].includes(code)) return 'cloudy';
    if ([45, 48].includes(code)) return 'cloudy';
    
    return 'nice';
}

function generateWeatherReminder(charName, data) {
    const weatherType = getWeatherType(data);
    const reminders = WEATHER_REMINDERS[weatherType] || WEATHER_REMINDERS.nice;
    const randomIndex = Math.floor(Math.random() * reminders.length);
    const reminder = reminders[randomIndex];
    
    if (charName && charName !== '尚未設定角色' && charName !== '未命名角色') {
        return reminder;
    }
    return reminder;
}

function updateCharReminder() {
    if (!elements.charNote) return;
    
    if (currentWeatherData) {
        const charName = elements.charName?.textContent || '';
        const reminder = generateWeatherReminder(charName, currentWeatherData);
        elements.charNote.textContent = reminder;
    } else {
        elements.charNote.textContent = '查詢天氣後，這裡會顯示天氣提醒';
    }
}

function renderCurrent(placeName, data) {
    const current = data.current;
    if (!current) return;
    
    currentWeatherData = data;
    currentPlaceName = placeName;

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
    
    updateCharReminder();
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
initReminderSettings();

function initReminderSettings() {
    const toggle = document.getElementById('reminder-toggle');
    const intervalSelect = document.getElementById('reminder-interval');
    const testBtn = document.getElementById('reminder-test-btn');
    const statusText = document.getElementById('reminder-status-text');
    const intervalRow = document.getElementById('reminder-interval-row');
    
    if (!toggle || !intervalSelect || !testBtn || !statusText) {
        console.warn('[Weather] 找不到提醒設定 UI 元素');
        return;
    }
    
    function updateStatusDisplay() {
        if (window.WeatherReminderScheduler) {
            const status = window.WeatherReminderScheduler.getStatus();
            
            if (status.enabled) {
                const nextTime = new Date(status.nextReminder);
                const now = new Date();
                const diffMs = Math.max(0, status.nextReminder - Date.now());
                const diffMins = Math.floor(diffMs / 60000);
                
                if (diffMins > 60) {
                    const hours = Math.floor(diffMins / 60);
                    const mins = diffMins % 60;
                    statusText.textContent = `下次提醒：${hours} 小時 ${mins} 分鐘後`;
                } else {
                    statusText.textContent = `下次提醒：${diffMins} 分鐘後`;
                }
                
                if (intervalRow) intervalRow.style.opacity = '1';
            } else {
                statusText.textContent = '狀態：未啟用';
                if (intervalRow) intervalRow.style.opacity = '0.5';
            }
            
            toggle.checked = status.enabled;
        }
    }
    
    const savedEnabled = localStorage.getItem('sx_weather_reminder_enabled') === '1';
    const savedInterval = localStorage.getItem('sx_weather_reminder_interval');
    
    toggle.checked = savedEnabled;
    
    if (savedInterval) {
        const mins = Math.floor(Number(savedInterval) / 60000);
        const options = [30, 60, 90, 120, 180];
        const closest = options.reduce((prev, curr) => 
            Math.abs(curr - mins) < Math.abs(prev - mins) ? curr : prev
        );
        intervalSelect.value = String(closest);
    }
    
    updateStatusDisplay();
    
    toggle.addEventListener('change', () => {
        if (!window.WeatherReminderScheduler) {
            console.warn('[Weather] WeatherReminderScheduler 未載入');
            return;
        }
        
        if (toggle.checked) {
            const location = localStorage.getItem(WEATHER_STORAGE_KEY);
            if (!location) {
                alert('請先設定地點以啟用天氣提醒');
                toggle.checked = false;
                return;
            }
            
            const intervalMins = Number(intervalSelect.value);
            window.WeatherReminderScheduler.setInterval(intervalMins * 60000);
            window.WeatherReminderScheduler.start();
            
            if (window.SxNotification) {
                const permStatus = window.SxNotification.getPermissionStatus();
                if (permStatus.supported && permStatus.permission !== 'granted') {
                    window.SxNotification.requestSystemPermission();
                }
            }
        } else {
            window.WeatherReminderScheduler.stop();
        }
        
        updateStatusDisplay();
    });
    
    intervalSelect.addEventListener('change', () => {
        if (!window.WeatherReminderScheduler) return;
        
        const intervalMins = Number(intervalSelect.value);
        window.WeatherReminderScheduler.setInterval(intervalMins * 60000);
        
        if (toggle.checked) {
            updateStatusDisplay();
        }
    });
    
    testBtn.addEventListener('click', () => {
        if (!window.WeatherReminderScheduler) {
            console.warn('[Weather] WeatherReminderScheduler 未載入');
            return;
        }
        
        const location = localStorage.getItem(WEATHER_STORAGE_KEY);
        if (!location) {
            alert('請先設定地點');
            return;
        }
        
        testBtn.disabled = true;
        testBtn.textContent = '發送中...';
        
        window.WeatherReminderScheduler.triggerImmediateReminder()
            .then(() => {
                testBtn.textContent = '已發送！';
                setTimeout(() => {
                    testBtn.textContent = '測試提醒';
                    testBtn.disabled = false;
                }, 2000);
            })
            .catch(err => {
                console.warn('[Weather] 測試提醒失敗:', err);
                testBtn.textContent = '測試提醒';
                testBtn.disabled = false;
            });
    });
    
    setInterval(updateStatusDisplay, 60000);
}
