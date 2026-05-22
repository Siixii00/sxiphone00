const PALETTE = {
    wood: { dark: '#3a2a1a', main: '#5c4a32', light: '#7a6a52' },
    dirt: { dark: '#3a2a1a', main: '#5c4033', light: '#7a6053' },
    grass: { dark: '#4a6a2a', main: '#7ec850', light: '#9ae870' },
    water: { dark: '#2a4a6a', main: '#4a90c2', light: '#6ab0e2' },
    stone: { dark: '#5a5a5a', main: '#7a7a7a', light: '#9a9a9a' },
    roof: { main: '#c44a4a', light: '#e46a6a' },
    gold: '#ffd700',
    parchment: '#f4e8c1'
};

function tileHash(x, y, seed = 0) {
    let h = seed + x * 374761393 + y * 668265263;
    h = (h ^ (h >> 13)) * 1274126177;
    return (h ^ (h >> 16)) & 0xff;
}

function hashPick(x, y, seed = 0) {
    return tileHash(x, y, seed) / 255;
}

function hashInt(x, y, min, max, seed = 0) {
    return min + (tileHash(x, y, seed) % (max - min + 1));
}

const TILE_TYPES = {
    GRASS: 0,
    DIRT: 1,
    TILLED: 2,
    WATER: 3,
    PATH: 4,
    FENCE: 5
};

const MAP_DATA = [];
for (let y = 0; y < FARM_DATA.MAP_HEIGHT; y++) {
    MAP_DATA[y] = [];
    for (let x = 0; x < FARM_DATA.MAP_WIDTH; x++) {
        MAP_DATA[y][x] = TILE_TYPES.GRASS;
    }
}

const FarmGame = {
    canvas: null,
    ctx: null,
    state: {
        gold: 500,
        day: 1,
        level: 1,
        totalEarnings: 0,
        weather: 'sunny',
        currentTool: 'till',
        fields: [],
        animals: [],
        inventory: {
            seeds: { turnip: 5, tomato: 0, pumpkin: 0, corn: 0, strawberry: 0, sunflower: 0, tulip: 0 },
            products: { Egg: 0, Milk: 0, Wool: 0 }
        },
        selectedCrop: 'turnip',
        hasSprinkler: false,
        barnCapacity: 2
    },
    
    init() {
        this.canvas = document.getElementById('farm-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.canvas.width = FARM_DATA.MAP_WIDTH * FARM_DATA.TILE_SIZE;
        this.canvas.height = FARM_DATA.MAP_HEIGHT * FARM_DATA.TILE_SIZE;
        
        this.load();
        
        for (let y = 0; y < FARM_DATA.MAP_HEIGHT; y++) {
            if (!this.state.fields[y]) {
                this.state.fields[y] = [];
                for (let x = 0; x < FARM_DATA.MAP_WIDTH; x++) {
                    this.state.fields[y][x] = null;
                }
            }
        }
        
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('touchstart', (e) => this.handleTouch(e));
        
        this.updateUI();
        this.gameLoop();
        
        this.hideLoading();
    },
    
    save() {
        try {
            localStorage.setItem('sx_farm_save', JSON.stringify(this.state));
        } catch (e) {}
    },
    
    load() {
        try {
            const saved = localStorage.getItem('sx_farm_save');
            if (saved) {
                const loaded = JSON.parse(saved);
                this.state = { ...this.state, ...loaded };
            }
        } catch (e) {}
    },
    
    hideLoading() {
        const loading = document.getElementById('farm-loading');
        if (loading) {
            loading.classList.add('fade-out');
            setTimeout(() => loading.style.display = 'none', 500);
        }
    },
    
    gameLoop() {
        this.drawScene();
        requestAnimationFrame(() => this.gameLoop());
    },
    
    drawScene() {
        const ctx = this.ctx;
        const ts = FARM_DATA.TILE_SIZE;
        
        for (let y = 0; y < FARM_DATA.MAP_HEIGHT; y++) {
            for (let x = 0; x < FARM_DATA.MAP_WIDTH; x++) {
                this.drawTile(x, y);
            }
        }
        
        for (let y = 0; y < FARM_DATA.MAP_HEIGHT; y++) {
            for (let x = 0; x < FARM_DATA.MAP_WIDTH; x++) {
                const field = this.state.fields[y]?.[x];
                if (field) {
                    this.drawField(x, y, field);
                }
            }
        }
        
        this.drawBuildings();
        this.drawAnimals();
        
        if (this.state.weather === 'rainy' || this.state.weather === 'stormy') {
            this.drawRain();
        }
    },
    
    drawTile(x, y) {
        const ctx = this.ctx;
        const ts = FARM_DATA.TILE_SIZE;
        const px = x * ts;
        const py = y * ts;
        
        const variation = hashPick(x, y, 12345);
        const baseColor = variation > 0.3 ? PALETTE.grass.main : PALETTE.grass.light;
        
        ctx.fillStyle = baseColor;
        ctx.fillRect(px, py, ts, ts);
        
        ctx.fillStyle = PALETTE.grass.dark;
        if (hashPick(x, y, 111) > 0.7) {
            ctx.fillRect(px + hashInt(x, y, 0, ts-2, 222), py + hashInt(x, y, 0, ts-2, 333), 1, 2);
        }
    },
    
    drawField(x, y, field) {
        const ctx = this.ctx;
        const ts = FARM_DATA.TILE_SIZE;
        const px = x * ts;
        const py = y * ts;
        
        ctx.fillStyle = PALETTE.dirt.main;
        ctx.fillRect(px, py, ts, ts);
        
        if (field.tilled) {
            ctx.fillStyle = PALETTE.dirt.dark;
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(px + 2 + i * 4, py + 2, 2, ts - 4);
            }
        }
        
        if (field.watered) {
            ctx.fillStyle = 'rgba(74, 144, 194, 0.3)';
            ctx.fillRect(px, py, ts, ts);
        }
        
        if (field.crop) {
            const cropData = FARM_DATA.CROPS[field.crop];
            if (cropData) {
                const stage = Math.min(Math.floor(field.growth / cropData.growDays * 3), 2);
                const stageData = cropData.stages[stage];
                
                ctx.fillStyle = stageData.color;
                const cropHeight = stageData.height;
                ctx.fillRect(px + ts/2 - 2, py + ts - cropHeight, 4, cropHeight);
                
                if (stage === 2) {
                    ctx.fillStyle = PALETTE.gold;
                    ctx.fillRect(px + ts/2 - 1, py + ts - cropHeight - 2, 2, 2);
                }
            }
        }
    },
    
    drawBuildings() {
        const ctx = this.ctx;
        const ts = FARM_DATA.TILE_SIZE;
        
        for (const [key, b] of Object.entries(FARM_DATA.BUILDINGS)) {
            if (b.unlockLevel && this.state.level < b.unlockLevel) continue;
            
            const px = b.x * ts;
            const py = b.y * ts;
            const pw = b.w * ts;
            const ph = b.h * ts;
            
            ctx.fillStyle = PALETTE.wood.main;
            ctx.fillRect(px, py, pw, ph);
            
            ctx.fillStyle = b.color;
            ctx.fillRect(px, py, pw, ts);
            
            ctx.fillStyle = PALETTE.wood.dark;
            ctx.fillRect(px, py, pw, 2);
            ctx.fillRect(px, py, 2, ph);
            ctx.fillRect(px + pw - 2, py, 2, ph);
            ctx.fillRect(px, py + ph - 2, pw, 2);
        }
    },
    
    drawAnimals() {
        const ctx = this.ctx;
        const ts = FARM_DATA.TILE_SIZE;
        
        this.state.animals.forEach((animal, idx) => {
            const ax = animal.x || (15 + (idx % 3)) * ts;
            const ay = animal.y || (3 + Math.floor(idx / 3)) * ts;
            
            ctx.fillStyle = animal.type === 'chicken' ? '#f4e8c1' : 
                           animal.type === 'cow' ? '#8b4513' : '#f4e8c1';
            ctx.fillRect(ax, ay, ts - 2, ts - 2);
            
            ctx.fillStyle = '#000';
            ctx.fillRect(ax + 3, ay + 4, 2, 2);
            ctx.fillRect(ax + ts - 7, ay + 4, 2, 2);
        });
    },
    
    drawRain() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(74, 144, 194, 0.1)';
        for (let i = 0; i < 50; i++) {
            const rx = hashInt(i, this.state.day, 0, this.canvas.width, 999);
            const ry = hashInt(i, this.state.day + 1, 0, this.canvas.height, 888);
            ctx.fillRect(rx, ry, 1, 4);
        }
    },
    
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = Math.floor((e.clientX - rect.left) * scaleX / FARM_DATA.TILE_SIZE);
        const y = Math.floor((e.clientY - rect.top) * scaleY / FARM_DATA.TILE_SIZE);
        this.handleTileAction(x, y);
    },
    
    handleTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = Math.floor((touch.clientX - rect.left) * scaleX / FARM_DATA.TILE_SIZE);
        const y = Math.floor((touch.clientY - rect.top) * scaleY / FARM_DATA.TILE_SIZE);
        this.handleTileAction(x, y);
    },
    
    handleTileAction(x, y) {
        if (x < 0 || x >= FARM_DATA.MAP_WIDTH || y < 0 || y >= FARM_DATA.MAP_HEIGHT) return;
        
        const field = this.state.fields[y][x];
        const tool = this.state.currentTool;
        
        switch (tool) {
            case 'till':
                if (!field || !field.tilled) {
                    this.state.fields[y][x] = { tilled: true, watered: false, crop: null, growth: 0 };
                }
                break;
            case 'plant':
                if (field?.tilled && !field.crop) {
                    const crop = this.state.selectedCrop;
                    if (this.state.inventory.seeds[crop] > 0) {
                        this.state.fields[y][x].crop = crop;
                        this.state.fields[y][x].growth = 0;
                        this.state.inventory.seeds[crop]--;
                    }
                }
                break;
            case 'water':
                if (field?.tilled) {
                    this.state.fields[y][x].watered = true;
                }
                break;
            case 'harvest':
                if (field?.crop) {
                    const cropData = FARM_DATA.CROPS[field.crop];
                    if (field.growth >= cropData.growDays) {
                        this.state.gold += cropData.sellPrice;
                        this.state.totalEarnings += cropData.sellPrice;
                        this.state.fields[y][x] = { tilled: true, watered: false, crop: null, growth: 0 };
                        this.checkLevelUp();
                    }
                }
                break;
        }
        
        this.save();
        this.updateUI();
    },
    
    endDay() {
        for (let y = 0; y < FARM_DATA.MAP_HEIGHT; y++) {
            for (let x = 0; x < FARM_DATA.MAP_WIDTH; x++) {
                const field = this.state.fields[y][x];
                if (field?.crop && (field.watered || this.state.weather === 'rainy' || this.state.weather === 'stormy')) {
                    field.growth++;
                }
                if (field) {
                    field.watered = this.state.hasSprinkler;
                }
            }
        }
        
        this.state.animals.forEach(animal => {
            if (animal.fed) {
                animal.daysSinceProduct++;
                const animalData = FARM_DATA.ANIMALS[animal.type];
                if (animal.daysSinceProduct >= animalData.productInterval) {
                    animal.readyForProduct = true;
                    animal.daysSinceProduct = 0;
                }
                animal.fed = false;
            }
            animal.happiness = Math.max(0, animal.happiness - 1);
        });
        
        this.state.day++;
        this.calculateWeather();
        this.checkLevelUp();
        this.save();
        this.updateUI();
    },
    
    calculateWeather() {
        const h = tileHash(this.state.day, 0, 7777);
        if (h < 180) this.state.weather = 'sunny';
        else if (h < 220) this.state.weather = 'cloudy';
        else if (h < 250) this.state.weather = 'rainy';
        else this.state.weather = 'stormy';
    },
    
    checkLevelUp() {
        const thresholds = FARM_DATA.LEVEL_THRESHOLDS;
        for (let i = thresholds.length - 1; i >= 0; i--) {
            if (this.state.totalEarnings >= thresholds[i] && this.state.level < i + 1) {
                this.state.level = i + 1;
                break;
            }
        }
    },
    
    updateUI() {
        document.getElementById('gold-display').textContent = this.state.gold + 'g';
        document.getElementById('day-display').textContent = this.state.day;
        document.getElementById('level-display').textContent = this.state.level;
        
        const dayInSeason = ((this.state.day - 1) % 28) + 1;
        const progressPercent = Math.round((dayInSeason / 28) * 100);
        const progressEl = document.getElementById('season-progress');
        if (progressEl) {
            progressEl.style.width = progressPercent + '%';
        }
        
        const seasonNames = ['Spring', 'Summer', 'Fall', 'Winter'];
        const currentSeason = seasonNames[Math.floor((this.state.day - 1) / 28) % 4];
        const seasonTimeEl = document.getElementById('season-time-display');
        if (seasonTimeEl) {
            const hour = 6 + Math.floor((this.state.day * 17) % 12);
            const timeStr = `${currentSeason} ${dayInSeason}, ${hour.toString().padStart(2, '0')}:00`;
            seasonTimeEl.textContent = timeStr;
        }
        
        const weatherData = FARM_DATA.WEATHER_TYPES[this.state.weather];
        const weatherDisplayEl = document.getElementById('weather-display');
        if (weatherDisplayEl) {
            weatherDisplayEl.textContent = weatherData.name;
        }
        const weatherIconEl = document.getElementById('weather-icon');
        if (weatherIconEl) {
            weatherIconEl.setAttribute('data-lucide', weatherData.icon);
        }
        
        if (window.lucide) lucide.createIcons();
    }
};

function setTool(tool) {
    FarmGame.state.currentTool = tool;
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tool === tool);
    });
}

function openShop() {
    const modal = document.getElementById('shop-modal');
    const container = document.getElementById('shop-items');
    container.innerHTML = '';
    
    FARM_DATA.SHOP_ITEMS.seeds.forEach(cropKey => {
        const crop = FARM_DATA.CROPS[cropKey];
        if (FarmGame.state.level >= crop.unlockLevel) {
            const item = document.createElement('div');
            item.className = 'shop-item';
            item.innerHTML = `<h3>${crop.nameZh}</h3><p>${crop.seedPrice}G</p>`;
            item.onclick = () => buySeed(cropKey);
            container.appendChild(item);
        }
    });
    
    modal.classList.add('active');
}

function closeShop() {
    document.getElementById('shop-modal').classList.remove('active');
}

function buySeed(cropKey) {
    const crop = FARM_DATA.CROPS[cropKey];
    if (FarmGame.state.gold >= crop.seedPrice) {
        FarmGame.state.gold -= crop.seedPrice;
        FarmGame.state.inventory.seeds[cropKey]++;
        FarmGame.save();
        FarmGame.updateUI();
    }
}

function openInventory() {
    const modal = document.getElementById('inventory-modal');
    const container = document.getElementById('inventory-items');
    container.innerHTML = '';
    
    Object.entries(FarmGame.state.inventory.seeds).forEach(([key, count]) => {
        if (count > 0) {
            const crop = FARM_DATA.CROPS[key];
            const item = document.createElement('div');
            item.className = 'inventory-item';
            item.innerHTML = `<h3>${crop.nameZh}</h3><p>x${count}</p>`;
            container.appendChild(item);
        }
    });
    
    Object.entries(FarmGame.state.inventory.products).forEach(([key, count]) => {
        if (count > 0) {
            const item = document.createElement('div');
            item.className = 'inventory-item';
            item.innerHTML = `<h3>${key}</h3><p>x${count}</p>`;
            container.appendChild(item);
        }
    });
    
    modal.classList.add('active');
}

function closeInventory() {
    document.getElementById('inventory-modal').classList.remove('active');
}

function openAnimals() {
    const modal = document.getElementById('animals-modal');
    const container = document.getElementById('animals-list');
    container.innerHTML = '';
    
    FarmGame.state.animals.forEach((animal, idx) => {
        const animalData = FARM_DATA.ANIMALS[animal.type];
        const item = document.createElement('div');
        item.className = 'animal-item';
        item.innerHTML = `<h3>${animalData.nameZh}</h3><p>${animal.readyForProduct ? 'Ready!' : 'OK'}</p>`;
        if (animal.readyForProduct) {
            item.onclick = () => collectProduct(idx);
        }
        container.appendChild(item);
    });
    
    modal.classList.add('active');
}

function closeAnimals() {
    document.getElementById('animals-modal').classList.remove('active');
}

function collectProduct(idx) {
    const animal = FarmGame.state.animals[idx];
    if (animal?.readyForProduct) {
        const animalData = FARM_DATA.ANIMALS[animal.type];
        FarmGame.state.inventory.products[animalData.product]++;
        animal.readyForProduct = false;
        FarmGame.save();
        openAnimals();
    }
}

function endDay() {
    FarmGame.endDay();
}

function closeFarmApp() {
    if (window.closeApp) {
        window.closeApp('farm');
    } else {
        window.history.back();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    FarmGame.init();
    if (window.lucide) lucide.createIcons();
});

function switchTab(tab) {
    if (tab === 'home') {
        if (window.parent) {
            window.parent.postMessage({ type: 'launchApp', app: 'home' }, '*');
        }
    }
}

function openSocial() {
    if (window.parent) {
        window.parent.postMessage({ type: 'launchApp', app: 'chat' }, '*');
    }
}