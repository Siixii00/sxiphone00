console.log('Loaded app: dating');

// ==================== 核心資料結構 ====================
const DatingApp = {
    currentScene: 'home',
    currentChar: null,
    player: { x: 200, y: 300, direction: 'down' },
    char: { x: 400, y: 300, direction: 'down' },
    isMoving: false,
    dialogueActive: false,
    currentDialogue: null,
    sceneCache: {}, // 場景圖片快取
    canvas: null,
    ctx: null,
    pendingSceneFromChat: null, // 從聊天約會邀請來的待啟動場景
    // 時間系統
    timeSystem: {
        totalDays: 3, // 預設3天
        currentDay: 1,
        currentHour: 9, // 早上9點開始
        currentMinute: 0,
        timeSpeed: 1, // 時間流速（分鐘/秒）
        isPaused: false
    },
    // AI 控制系統
    aiController: {
        enabled: true,
        lastActionTime: 0,
        actionInterval: 3000, // 每3秒檢查一次行動
        currentAction: null,
        greetingShown: false,
        contextLoaded: false,
        worldbookData: null,
        chatHistory: null
    },
    // 角色外觀系統
    charSprite: {
        body: 'slim',
        hair: 'short',
        haircolor: '#2d1b00',
        skin: '#fde8c8',
        outfit: 'casual',
        outfitcolor: '#ff6b9d',
        name: ''
    },
    // 玩家外觀
    playerSprite: {
        body: 'normal',
        hair: 'short',
        haircolor: '#1a1a1a',
        skin: '#fde8c8',
        outfit: 'casual',
        outfitcolor: '#38bdf8'
    },
    // 像素編輯器狀態
    pixelEditor: {
        tool: 'draw',
        penColor: '#ff6b9d',
        pixels: Array.from({length: 16}, () => Array(16).fill(null))
    },
    // 對話歷史（AI 生成用）
    dialogueHistory: []
};

// ==================== 像素角色渲染器 ====================
function adjustColor(hex, amt) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    r = Math.max(0, Math.min(255, r + amt));
    g = Math.max(0, Math.min(255, g + amt));
    b = Math.max(0, Math.min(255, b + amt));
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function renderSprite(sprite, canvas, size = 96) {
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, size, size);
    
    const scale = size / 96;
    const skin = sprite.skin || '#fde8c8';
    const skinShadow = adjustColor(skin, -20);
    const skinHighlight = adjustColor(skin, 15);
    const hair = sprite.haircolor || '#2d1b00';
    const hairShadow = adjustColor(hair, -15);
    const outfit = sprite.outfitcolor || '#ff6b9d';
    const outfitShadow = adjustColor(outfit, -25);
    const outfitHighlight = adjustColor(outfit, 20);
    
    ctx.save();
    ctx.scale(scale, scale);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(48, 92, 20, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    if (sprite.body === 'slim') {
        ctx.fillStyle = outfit;
        ctx.fillRect(36, 32, 24, 44);
        ctx.fillStyle = outfitHighlight;
        ctx.fillRect(36, 32, 4, 44);
        ctx.fillStyle = outfitShadow;
        ctx.fillRect(56, 32, 4, 44);
        
        ctx.fillStyle = skin;
        ctx.fillRect(34, 76, 10, 16);
        ctx.fillRect(52, 76, 10, 16);
        ctx.fillStyle = skinShadow;
        ctx.fillRect(42, 76, 2, 16);
        ctx.fillRect(60, 76, 2, 16);
        
        ctx.fillStyle = skin;
        ctx.fillRect(28, 34, 8, 28);
        ctx.fillRect(60, 34, 8, 28);
        ctx.fillStyle = skinShadow;
        ctx.fillRect(34, 34, 2, 28);
        ctx.fillRect(66, 34, 2, 28);
    } else if (sprite.body === 'normal') {
        ctx.fillStyle = outfit;
        ctx.fillRect(32, 32, 32, 44);
        ctx.fillStyle = outfitHighlight;
        ctx.fillRect(32, 32, 4, 44);
        ctx.fillStyle = outfitShadow;
        ctx.fillRect(60, 32, 4, 44);
        
        ctx.fillStyle = skin;
        ctx.fillRect(30, 76, 14, 16);
        ctx.fillRect(52, 76, 14, 16);
        ctx.fillStyle = skinShadow;
        ctx.fillRect(42, 76, 2, 16);
        ctx.fillRect(64, 76, 2, 16);
        
        ctx.fillStyle = skin;
        ctx.fillRect(22, 34, 10, 28);
        ctx.fillRect(64, 34, 10, 28);
        ctx.fillStyle = skinShadow;
        ctx.fillRect(30, 34, 2, 28);
        ctx.fillRect(72, 34, 2, 28);
    } else {
        ctx.fillStyle = outfit;
        ctx.fillRect(28, 32, 40, 44);
        ctx.fillStyle = outfitHighlight;
        ctx.fillRect(28, 32, 4, 44);
        ctx.fillStyle = outfitShadow;
        ctx.fillRect(64, 32, 4, 44);
        
        ctx.fillStyle = skin;
        ctx.fillRect(28, 76, 16, 16);
        ctx.fillRect(52, 76, 16, 16);
        ctx.fillStyle = skinShadow;
        ctx.fillRect(42, 76, 2, 16);
        ctx.fillRect(66, 76, 2, 16);
        
        ctx.fillStyle = skin;
        ctx.fillRect(18, 34, 12, 28);
        ctx.fillRect(66, 34, 12, 28);
        ctx.fillStyle = skinShadow;
        ctx.fillRect(28, 34, 2, 28);
        ctx.fillRect(76, 34, 2, 28);
    }
    
    ctx.fillStyle = skin;
    ctx.fillRect(32, 8, 32, 28);
    ctx.fillStyle = skinHighlight;
    ctx.fillRect(32, 8, 4, 28);
    ctx.fillStyle = skinShadow;
    ctx.fillRect(60, 8, 4, 28);
    
    ctx.fillStyle = '#1a0a00';
    ctx.fillRect(36, 20, 4, 4);
    ctx.fillRect(56, 20, 4, 4);
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(36, 20, 1, 1);
    ctx.fillRect(56, 20, 1, 1);
    
    ctx.fillStyle = '#ff9999';
    ctx.fillRect(40, 26, 16, 3);
    
    if (sprite.outfit === 'dress') {
        ctx.fillStyle = outfit;
        ctx.fillRect(32, 44, 32, 36);
        ctx.fillStyle = outfitHighlight;
        ctx.fillRect(32, 44, 4, 36);
        ctx.fillStyle = outfitShadow;
        ctx.fillRect(60, 44, 4, 36);
        ctx.fillRect(26, 44, 8, 24);
        ctx.fillRect(62, 44, 8, 24);
    } else if (sprite.outfit === 'uniform') {
        ctx.fillStyle = outfit;
        ctx.fillRect(32, 44, 32, 28);
        ctx.fillStyle = outfitHighlight;
        ctx.fillRect(32, 44, 4, 28);
        ctx.fillStyle = outfitShadow;
        ctx.fillRect(60, 44, 4, 28);
        ctx.fillStyle = '#333';
        ctx.fillRect(32, 72, 32, 20);
        ctx.fillStyle = '#fff';
        ctx.fillRect(44, 44, 8, 28);
    } else if (sprite.outfit === 'kimono') {
        ctx.fillStyle = outfit;
        ctx.fillRect(30, 42, 36, 36);
        ctx.fillStyle = outfitHighlight;
        ctx.fillRect(30, 42, 4, 36);
        ctx.fillStyle = outfitShadow;
        ctx.fillRect(62, 42, 4, 36);
        ctx.fillStyle = adjustColor(outfit, -40);
        ctx.fillRect(30, 42, 6, 36);
        ctx.fillRect(60, 42, 6, 36);
    } else if (sprite.outfit === 'sporty') {
        ctx.fillStyle = outfit;
        ctx.fillRect(32, 44, 32, 20);
        ctx.fillStyle = outfitHighlight;
        ctx.fillRect(32, 44, 4, 20);
        ctx.fillStyle = outfitShadow;
        ctx.fillRect(60, 44, 4, 20);
        ctx.fillStyle = adjustColor(outfit, 30);
        ctx.fillRect(32, 64, 32, 28);
    } else {
        ctx.fillStyle = outfit;
        ctx.fillRect(32, 44, 32, 28);
        ctx.fillStyle = outfitHighlight;
        ctx.fillRect(32, 44, 4, 28);
        ctx.fillStyle = outfitShadow;
        ctx.fillRect(60, 44, 4, 28);
        ctx.fillStyle = adjustColor(outfit, 20);
        ctx.fillRect(32, 72, 32, 20);
    }
    
    if (sprite.hair === 'short') {
        ctx.fillStyle = hair;
        ctx.fillRect(32, 4, 32, 16);
        ctx.fillStyle = hairShadow;
        ctx.fillRect(60, 4, 4, 16);
        ctx.fillRect(28, 8, 8, 16);
        ctx.fillRect(60, 8, 8, 16);
    } else if (sprite.hair === 'long') {
        ctx.fillStyle = hair;
        ctx.fillRect(32, 4, 32, 12);
        ctx.fillStyle = hairShadow;
        ctx.fillRect(60, 4, 4, 12);
        ctx.fillRect(24, 8, 12, 52);
        ctx.fillRect(60, 8, 12, 52);
        ctx.fillRect(28, 4, 4, 8);
    } else if (sprite.hair === 'twin') {
        ctx.fillStyle = hair;
        ctx.fillRect(32, 4, 32, 12);
        ctx.fillStyle = hairShadow;
        ctx.fillRect(60, 4, 4, 12);
        ctx.fillRect(18, 8, 14, 44);
        ctx.fillRect(64, 8, 14, 44);
        ctx.fillRect(18, 48, 14, 8);
        ctx.fillRect(64, 48, 14, 8);
    } else if (sprite.hair === 'messy') {
        for (let i = 0; i < 6; i++) {
            ctx.fillStyle = hair;
            ctx.fillRect(28 + i * 7, 2 + Math.floor(Math.random() * 4), 8, 14 + (i % 3) * 4);
        }
        ctx.fillStyle = hairShadow;
        ctx.fillRect(24, 8, 12, 20);
        ctx.fillRect(60, 8, 12, 20);
    } else {
        ctx.fillStyle = hair;
        ctx.fillRect(36, 0, 24, 12);
        ctx.beginPath();
        ctx.arc(48, 8, 12, 0, Math.PI * 2);
        ctx.fillStyle = hair;
        ctx.fill();
        ctx.fillRect(40, 0, 16, 8);
        ctx.fillStyle = hairShadow;
        ctx.fillRect(56, 0, 4, 12);
    }
    
    ctx.fillStyle = '#5588ff';
    ctx.fillRect(38, 20, 2, 2);
    ctx.fillRect(58, 20, 2, 2);
    
    ctx.restore();
    return canvas;
}

function createSpriteCanvas(size = 96) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    return canvas;
}

function getCharSpriteCanvas(size = 96) {
    const canvas = createSpriteCanvas(size);
    renderSprite(DatingApp.charSprite, canvas, size);
    return canvas;
}

function getPlayerSpriteCanvas(size = 96) {
    const canvas = createSpriteCanvas(size);
    renderSprite(DatingApp.playerSprite, canvas, size);
    return canvas;
}

// ==================== 像素編輯器 ====================
function initPixelEditor() {
    const canvas = document.getElementById('pixel-editor-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    
    // Setup event listeners
    canvas.addEventListener('mousedown', (e) => {
        pixelDrawing = true;
        paintPixelCell(e);
    });
    
    canvas.addEventListener('mousemove', paintPixelCell);
    canvas.addEventListener('mouseup', () => pixelDrawing = false);
    canvas.addEventListener('mouseleave', () => pixelDrawing = false);
    
    canvas.addEventListener('touchstart', (e) => {
        pixelDrawing = true;
        paintPixelCell(e);
        e.preventDefault();
    }, { passive: false });
    
    canvas.addEventListener('touchmove', (e) => {
        paintPixelCell(e);
        e.preventDefault();
    }, { passive: false });
    
    canvas.addEventListener('touchend', () => pixelDrawing = false);
    
    drawPixelGrid();
}

function drawPixelGrid() {
    const canvas = document.getElementById('pixel-editor-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const GRID = 16;
    const CELL = 10;
    
    ctx.clearRect(0, 0, 160, 160);
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, 160, 160);
    
    for (let r = 0; r < GRID; r++) {
        for (let c = 0; c < GRID; c++) {
            if (DatingApp.pixelEditor.pixels[r][c]) {
                ctx.fillStyle = DatingApp.pixelEditor.pixels[r][c];
                ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
            }
            ctx.strokeStyle = '#222';
            ctx.strokeRect(c * CELL, r * CELL, CELL, CELL);
        }
    }
}

function getPixelCell(e) {
    const canvas = document.getElementById('pixel-editor-canvas');
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    const scaleX = 160 / rect.width;
    const scaleY = 160 / rect.height;
    const CELL = 10;
    
    return {
        r: Math.floor(y * scaleY / CELL),
        c: Math.floor(x * scaleX / CELL)
    };
}

let pixelDrawing = false;

function paintPixelCell(e) {
    if (!pixelDrawing) return;
    
    const cell = getPixelCell(e);
    if (!cell || cell.r < 0 || cell.r >= 16 || cell.c < 0 || cell.c >= 16) return;
    
    if (DatingApp.pixelEditor.tool === 'erase') {
        DatingApp.pixelEditor.pixels[cell.r][cell.c] = null;
    } else if (DatingApp.pixelEditor.tool === 'draw') {
        DatingApp.pixelEditor.pixels[cell.r][cell.c] = DatingApp.pixelEditor.penColor;
    }
    
    drawPixelGrid();
}

function setPixelTool(tool) {
    DatingApp.pixelEditor.tool = tool;
    
    document.querySelectorAll('.pixel-tool-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.getElementById('pixel-tool-' + tool);
    if (activeBtn) activeBtn.classList.add('active');
}

function setPixelColor(color) {
    DatingApp.pixelEditor.penColor = color;
    
    document.querySelectorAll('.pixel-color-swatch').forEach(swatch => {
        swatch.classList.toggle('active', swatch.dataset.color === color);
    });
}

function clearPixelCanvas() {
    DatingApp.pixelEditor.pixels = Array.from({length: 16}, () => Array(16).fill(null));
    drawPixelGrid();
}

function applyPixelToSprite() {
    const previewCanvas = document.getElementById('sprite-preview-canvas');
    if (!previewCanvas) return;
    
    const ctx = previewCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    
    const CELL = 6;
    for (let r = 0; r < 16; r++) {
        for (let c = 0; c < 16; c++) {
            if (DatingApp.pixelEditor.pixels[r][c]) {
                ctx.fillStyle = DatingApp.pixelEditor.pixels[r][c];
                ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
            }
        }
    }
}

// ==================== 角色建立器選項 ====================
function selectSpriteOpt(group, value) {
    DatingApp.charSprite[group] = value;
    
    document.querySelectorAll(`[data-sprite-group="${group}"]`).forEach(el => {
        el.classList.toggle('active', el.dataset.value === value);
    });
    
    updateSpritePreview();
}

function selectSpriteColor(group, value) {
    DatingApp.charSprite[group] = value;
    
    document.querySelectorAll(`[data-sprite-color="${group}"]`).forEach(el => {
        el.classList.toggle('active', el.dataset.value === value);
    });
    
    updateSpritePreview();
}

function updateSpritePreview() {
    const canvas = document.getElementById('sprite-preview-canvas');
    if (canvas) {
        renderSprite(DatingApp.charSprite, canvas, 96);
    }
}

// 全域函數
window.setPixelTool = setPixelTool;
window.setPixelColor = setPixelColor;
window.clearPixelCanvas = clearPixelCanvas;
window.applyPixelToSprite = applyPixelToSprite;
window.selectSpriteOpt = selectSpriteOpt;
window.selectSpriteColor = selectSpriteColor;
window.switchSetupTab = switchSetupTab;

function switchSetupTab(tabName) {
    document.querySelectorAll('.setup-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    document.querySelectorAll('.setup-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    const targetPanel = document.getElementById('setup-panel-' + tabName);
    if (targetPanel) targetPanel.classList.add('active');
    
    if (tabName === 'sprite') {
        setTimeout(() => {
            updateSpritePreview();
            initPixelEditor();
        }, 100);
    }
}

// 從 settings 載入角色資料
function loadCharacterFromSettings() {
    const chars = JSON.parse(localStorage.getItem('sx_characters') || '[]');
    if (chars.length > 0) {
        return chars[0]; // 使用第一個角色
    }
    return {
        name: '',
        avatar: '',
        personality: '溫柔體貼',
        background: ''
    };
}

// ==================== 場景定義 ====================
const SCENES = {
    cafe: {
        name: '咖啡廳',
        icon: 'coffee',
        background: null, // 將由generateSceneBackground生成
        objects: [
            { type: 'counter', x: 40, y: 90, width: 240, height: 70 },
            { type: 'plant', x: 320, y: 90, width: 45, height: 45 },
            { type: 'plant', x: 700, y: 90, width: 45, height: 45 },
            { type: 'table', x: 220, y: 210, width: 120, height: 80 },
            { type: 'table', x: 460, y: 210, width: 120, height: 80 },
            { type: 'table', x: 140, y: 360, width: 120, height: 80 },
            { type: 'table', x: 380, y: 360, width: 120, height: 80 },
            { type: 'chair', x: 190, y: 290, width: 40, height: 40 },
            { type: 'chair', x: 300, y: 290, width: 40, height: 40 },
            { type: 'chair', x: 430, y: 290, width: 40, height: 40 },
            { type: 'chair', x: 540, y: 290, width: 40, height: 40 },
            { type: 'chair', x: 110, y: 440, width: 40, height: 40 },
            { type: 'chair', x: 220, y: 440, width: 40, height: 40 },
            { type: 'chair', x: 350, y: 440, width: 40, height: 40 },
            { type: 'chair', x: 460, y: 440, width: 40, height: 40 }
        ],
        dialogues: [
            { text: '這裡的咖啡很香呢...', mood: 'happy' },
            { text: '謝謝你陪我來這裡', mood: 'shy' },
            { text: '我們下次還要一起來嗎?', mood: 'hopeful' }
        ]
    },
    park: {
        name: '公園',
        icon: 'tree-deciduous',
        background: null,
        objects: [
            { type: 'tree', x: 60, y: 110, width: 90, height: 120 },
            { type: 'tree', x: 220, y: 130, width: 70, height: 100 },
            { type: 'tree', x: 560, y: 120, width: 90, height: 120 },
            { type: 'tree', x: 680, y: 200, width: 70, height: 100 },
            { type: 'bench', x: 180, y: 330, width: 140, height: 60 },
            { type: 'bench', x: 430, y: 330, width: 140, height: 60 },
            { type: 'flower', x: 120, y: 430, width: 36, height: 46 },
            { type: 'flower', x: 200, y: 420, width: 36, height: 46 },
            { type: 'flower', x: 520, y: 420, width: 36, height: 46 },
            { type: 'flower', x: 620, y: 430, width: 36, height: 46 },
            { type: 'path', x: 0, y: 460, width: 800, height: 50 }
        ],
        dialogues: [
            { text: '天氣真好，散步很舒服', mood: 'relaxed' },
            { text: '看那邊的花開得好漂亮', mood: 'excited' },
            { text: '能和你一起散步真好', mood: 'happy' }
        ]
    },
    cinema: {
        name: '電影院',
        icon: 'film',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        objects: [
            { type: 'screen', x: 210, y: 80, width: 280, height: 140 },
            { type: 'seats', x: 120, y: 250, width: 520, height: 70 },
            { type: 'seats', x: 120, y: 340, width: 520, height: 70 }
        ],
        dialogues: [
            { text: '這部電影好像很有趣', mood: 'curious' },
            { text: '我有點緊張...', mood: 'nervous' },
            { text: '謝謝你選了這部電影', mood: 'grateful' }
        ]
    },
    restaurant: {
        name: '餐廳',
        icon: 'utensils',
        background: 'linear-gradient(135deg, #8B0000 0%, #DC143C 100%)',
        objects: [
            { type: 'table', x: 140, y: 220, width: 120, height: 80 },
            { type: 'table', x: 360, y: 220, width: 120, height: 80 },
            { type: 'table', x: 260, y: 360, width: 120, height: 80 },
            { type: 'chair', x: 110, y: 300, width: 40, height: 40 },
            { type: 'chair', x: 230, y: 300, width: 40, height: 40 },
            { type: 'chair', x: 330, y: 300, width: 40, height: 40 },
            { type: 'chair', x: 450, y: 300, width: 40, height: 40 },
            { type: 'candle', x: 190, y: 235, width: 18, height: 26 },
            { type: 'candle', x: 410, y: 235, width: 18, height: 26 },
            { type: 'candle', x: 310, y: 375, width: 18, height: 26 }
        ],
        dialogues: [
            { text: '這裡的氣氛真浪漫', mood: 'romantic' },
            { text: '食物看起來很美味', mood: 'happy' },
            { text: '和你一起吃飯最開心了', mood: 'loving' }
        ]
    },
    beach: {
        name: '海邊',
        icon: 'waves',
        background: 'linear-gradient(135deg, #87CEEB 0%, #4682B4 100%)',
        objects: [
            { type: 'umbrella', x: 120, y: 200, width: 90, height: 110 },
            { type: 'umbrella', x: 540, y: 220, width: 90, height: 110 },
            { type: 'towel', x: 260, y: 330, width: 110, height: 60 },
            { type: 'towel', x: 420, y: 360, width: 110, height: 60 }
        ],
        dialogues: [
            { text: '海風吹來好舒服', mood: 'relaxed' },
            { text: '我們去踩踩水吧', mood: 'playful' },
            { text: '夕陽好美...', mood: 'romantic' }
        ]
    },
    library: {
        name: '圖書館',
        icon: 'book-open',
        background: 'linear-gradient(135deg, #8B7355 0%, #A0826D 100%)',
        objects: [
            { type: 'bookshelf', x: 40, y: 90, width: 120, height: 210 },
            { type: 'bookshelf', x: 640, y: 90, width: 120, height: 210 },
            { type: 'bookshelf', x: 260, y: 90, width: 120, height: 210 },
            { type: 'table', x: 200, y: 320, width: 140, height: 70 },
            { type: 'table', x: 420, y: 320, width: 140, height: 70 },
            { type: 'chair', x: 170, y: 390, width: 36, height: 36 },
            { type: 'chair', x: 300, y: 390, width: 36, height: 36 },
            { type: 'chair', x: 390, y: 390, width: 36, height: 36 },
            { type: 'chair', x: 520, y: 390, width: 36, height: 36 }
        ],
        dialogues: [
            { text: '這裡好安靜，很適合看書', mood: 'peaceful' },
            { text: '你喜歡看什麼類型的書?', mood: 'curious' },
            { text: '能和你一起度過這段時光真好', mood: 'content' }
        ]
    }
};

// ==================== 初始化 ====================
function init() {
    showLoadingScreen();
    
    // 監聽來自聊天約會邀請的訊息
    window.addEventListener('message', handleChatInvitationMessage);
    
    // 模擬載入過程
    setTimeout(() => {
        DatingApp.currentChar = loadCharacterFromSettings();
        setupEventListeners();
        renderSceneSelection();
        updateCharInfo();
        hideLoadingScreen();
        
        // 檢查是否從聊天約會邀請啟動
        checkChatInvitationStart();
    }, 2000);
}

// 處理來自聊天的約會邀請訊息
function handleChatInvitationMessage(event) {
    const data = event.data;
    if (!data || typeof data !== 'object') return;
    
    // 檢查是否是從聊天約會邀請啟動
    if (data.type === 'openApp' && data.appId === 'dating' && data.source === 'chat-invitation') {
        console.log('收到聊天約會邀請啟動請求，場景：', data.scene);
        
        // 儲存要自動啟動的場景
        DatingApp.pendingSceneFromChat = data.scene || 'cafe';
    }
}

// 檢查是否需要自動啟動約會（從聊天來的）
function checkChatInvitationStart() {
    const pendingScene = DatingApp.pendingSceneFromChat;
    if (!pendingScene) return;
    
    console.log('自動啟動約會，場景：', pendingScene);
    
    // 嘗試直接選擇該場景並啟動
    const sceneMap = {
        'cafe': 0,
        'park': 1,
        'cinema': 2,
        'restaurant': 3,
        'beach': 4,
        'library': 5
    };
    
    const sceneIndex = sceneMap[pendingScene];
    if (sceneIndex !== undefined) {
        // 延遲一點讓 UI 完全載入
        setTimeout(() => {
            // 自動選擇場景卡片
            const sceneCards = document.querySelectorAll('.scene-card');
            if (sceneCards[sceneIndex]) {
                // 直接觸發場景選擇的擊事件
                const card = sceneCards[sceneIndex];
                card.click();
                
                // 延遲後自動確認約會設定
                setTimeout(() => {
                    confirmDateSetup();
                }, 500);
            }
        }, 300);
    }
    
    // 清除待啟動的場景
    DatingApp.pendingSceneFromChat = null;
}

// 載入畫面
function showLoadingScreen() {
    const loading = document.getElementById('dating-loading');
    const loadingBar = document.getElementById('loading-bar');
    const loadingText = document.getElementById('loading-text');
    const loadingTips = document.getElementById('loading-tips');
    
    if (!loading) return;
    
    const tips = [
        '小提示：靠近角色按E鍵可以互動',
        '小提示：選擇不同的對話選項會影響好感度',
        '小提示：可以使用場景編輯器創建自己的約會場景',
        '小提示：按ESC可以返回場景選擇',
        '小提示：正面回應能獲得更多好感度'
    ];
    
    if (loadingTips) {
        loadingTips.textContent = tips[Math.floor(Math.random() * tips.length)];
    }
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
        }
        
        if (loadingBar) loadingBar.style.width = progress + '%';
        if (loadingText) {
            if (progress < 30) loadingText.textContent = '載入角色資料...';
            else if (progress < 60) loadingText.textContent = '準備場景...';
            else if (progress < 90) loadingText.textContent = '初始化系統...';
            else loadingText.textContent = '準備完成！';
        }
    }, 100);
}

function hideLoadingScreen() {
    const loading = document.getElementById('dating-loading');
    if (loading) {
        loading.classList.add('fade-out');
        setTimeout(() => {
            loading.style.display = 'none';
        }, 500);
    }
}

// 說明面板切換
function toggleHelp() {
    const helpModal = document.getElementById('help-modal');
    if (helpModal) {
        helpModal.classList.toggle('hidden');
        if (window.lucide) lucide.createIcons();
    }
}

window.toggleHelp = toggleHelp;

function handleTopBack() {
    const gameContainer = document.getElementById('game-container');
    const dateSetup = document.getElementById('date-setup');
    const datingSettings = document.getElementById('dating-settings-modal');
    const timeSettings = document.getElementById('time-settings-modal');
    const helpModal = document.getElementById('help-modal');

    if (datingSettings && !datingSettings.classList.contains('hidden')) {
        closeDatingSettings();
        return;
    }

    if (timeSettings && !timeSettings.classList.contains('hidden')) {
        closeTimeSettings();
        return;
    }

    if (helpModal && !helpModal.classList.contains('hidden')) {
        helpModal.classList.add('hidden');
        return;
    }

    if (gameContainer && !gameContainer.classList.contains('hidden')) {
        endDate();
        return;
    }

    if (dateSetup && !dateSetup.classList.contains('hidden')) {
        cancelDateSetup();
        return;
    }

    if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'closeApp' }, '*');
    }
}

window.handleTopBack = handleTopBack;

// ==================== 時間系統 ====================
let timeInterval = null;

function startTimeSystem() {
    if (timeInterval) clearInterval(timeInterval);
    
    timeInterval = setInterval(() => {
        if (DatingApp.timeSystem.isPaused) return;
        
        // 增加分鐘
        DatingApp.timeSystem.currentMinute += DatingApp.timeSystem.timeSpeed;
        
        // 處理小時進位
        if (DatingApp.timeSystem.currentMinute >= 60) {
            DatingApp.timeSystem.currentHour += Math.floor(DatingApp.timeSystem.currentMinute / 60);
            DatingApp.timeSystem.currentMinute = DatingApp.timeSystem.currentMinute % 60;
        }
        
        // 處理天數進位
        if (DatingApp.timeSystem.currentHour >= 24) {
            DatingApp.timeSystem.currentDay += Math.floor(DatingApp.timeSystem.currentHour / 24);
            DatingApp.timeSystem.currentHour = DatingApp.timeSystem.currentHour % 24;
        }
        
        // 檢查是否結束
        if (DatingApp.timeSystem.currentDay > DatingApp.timeSystem.totalDays) {
            endDateByTime();
            return;
        }
        
        updateTimeDisplay();
    }, 1000); // 每秒更新
}

function stopTimeSystem() {
    if (timeInterval) {
        clearInterval(timeInterval);
        timeInterval = null;
    }
}

function updateTimeDisplay() {
    const display = document.getElementById('time-display');
    if (!display) return;
    
    const { currentDay, currentHour, currentMinute } = DatingApp.timeSystem;
    const hourStr = currentHour.toString().padStart(2, '0');
    const minuteStr = Math.floor(currentMinute).toString().padStart(2, '0');
    
    display.textContent = `第${currentDay}天 ${hourStr}:${minuteStr}`;
}

function endDateByTime() {
    stopTimeSystem();
    alert(`約會時間結束！共度過了${DatingApp.timeSystem.totalDays}天美好時光。`);
    endDate();
}

// 時間設定相關函數
function openTimeSettings() {
    const modal = document.getElementById('time-settings-modal');
    if (modal) {
        modal.classList.remove('hidden');
        
        // 更新輸入框的值
        document.getElementById('current-day-input').value = DatingApp.timeSystem.currentDay;
        document.getElementById('current-hour-input').value = DatingApp.timeSystem.currentHour;
        document.getElementById('current-minute-input').value = Math.floor(DatingApp.timeSystem.currentMinute);
        
        if (window.lucide) lucide.createIcons();
    }
}

function closeTimeSettings() {
    const modal = document.getElementById('time-settings-modal');
    if (modal) modal.classList.add('hidden');
}

function setDays(days, btn) {
    DatingApp.timeSystem.totalDays = days;
    
    document.querySelectorAll('.day-btn').forEach(b => {
        b.classList.remove('active');
    });
    if (btn) btn.classList.add('active');
}

function setCustomDays() {
    const input = document.getElementById('custom-days');
    const days = parseInt(input.value);
    
    if (days && days > 0 && days <= 365) {
        DatingApp.timeSystem.totalDays = days;
        alert(`已設定為${days}天`);
    } else {
        alert('請輸入1-365之間的天數');
    }
}

function setTimeSpeed(speed, btn) {
    DatingApp.timeSystem.timeSpeed = speed;
    
    // 更新按鈕狀態
    document.querySelectorAll('.speed-btn').forEach(b => {
        b.classList.remove('active');
    });
    if (btn) btn.classList.add('active');
}

function setCustomDays() {
    const input = document.getElementById('custom-days');
    const days = parseInt(input.value);
    
    if (days && days > 0 && days <= 365) {
        DatingApp.timeSystem.totalDays = days;
        alert(`已設定為${days}天`);
    } else {
        alert('請輸入1-365之間的天數');
    }
}

function setTimeSpeed(speed) {
    DatingApp.timeSystem.timeSpeed = speed;
    
    // 更新按鈕狀態
    document.querySelectorAll('.speed-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

function applyTimeChange() {
    const day = parseInt(document.getElementById('current-day-input').value);
    const hour = parseInt(document.getElementById('current-hour-input').value);
    const minute = parseInt(document.getElementById('current-minute-input').value);
    
    if (day >= 1 && day <= DatingApp.timeSystem.totalDays &&
        hour >= 0 && hour <= 23 &&
        minute >= 0 && minute <= 59) {
        DatingApp.timeSystem.currentDay = day;
        DatingApp.timeSystem.currentHour = hour;
        DatingApp.timeSystem.currentMinute = minute;
        updateTimeDisplay();
        alert('時間已更新');
    } else {
        alert('請輸入有效的時間');
    }
}

function pauseTime() {
    DatingApp.timeSystem.isPaused = true;
    const btn = document.getElementById('time-pause-btn');
    if (btn) {
        btn.innerHTML = '<i data-lucide="play"></i>';
        if (window.lucide) lucide.createIcons();
    }
}

function resumeTime() {
    DatingApp.timeSystem.isPaused = false;
    const btn = document.getElementById('time-pause-btn');
    if (btn) {
        btn.innerHTML = '<i data-lucide="pause"></i>';
        if (window.lucide) lucide.createIcons();
    }
}

function toggleTimePause() {
    if (DatingApp.timeSystem.isPaused) {
        resumeTime();
    } else {
        pauseTime();
    }
}

function resetTime() {
    DatingApp.timeSystem.currentDay = 1;
    DatingApp.timeSystem.currentHour = 9;
    DatingApp.timeSystem.currentMinute = 0;
    DatingApp.timeSystem.isPaused = false;
    updateTimeDisplay();
    alert('時間已重置');
}

// 全域函數
window.openTimeSettings = openTimeSettings;
window.closeTimeSettings = closeTimeSettings;
window.setDays = setDays;
window.setCustomDays = setCustomDays;
window.setTimeSpeed = setTimeSpeed;
window.applyTimeChange = applyTimeChange;
window.pauseTime = pauseTime;
window.resumeTime = resumeTime;
window.toggleTimePause = toggleTimePause;
window.resetTime = resetTime;
window.selectScene = selectScene;
window.selectCharacter = selectCharacter;
window.selectDays = selectDays;
window.selectCustomDays = selectCustomDays;
window.selectSpeed = selectSpeed;
window.cancelDateSetup = cancelDateSetup;
window.confirmDateSetup = confirmDateSetup;

// 約會設定彈窗
function openDatingSettings() {
    const modal = document.getElementById('dating-settings-modal');
    if (modal) {
        modal.classList.remove('hidden');
        
        // 更新時間顯示
        const timeDisplay = document.getElementById('settings-time-display');
        if (timeDisplay) {
            const { currentDay, currentHour, currentMinute } = DatingApp.timeSystem;
            const hourStr = currentHour.toString().padStart(2, '0');
            const minuteStr = Math.floor(currentMinute).toString().padStart(2, '0');
            timeDisplay.textContent = `第${currentDay}天 ${hourStr}:${minuteStr}`;
        }
        
        // 檢查 API 狀態
        checkApiStatus();
        
        if (window.lucide) lucide.createIcons();
    }
}

function closeDatingSettings() {
    const modal = document.getElementById('dating-settings-modal');
    if (modal) modal.classList.add('hidden');
}

function switchSettingsTab(tabName) {
    // 更新標籤狀態
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    // 更新面板顯示
    document.querySelectorAll('.settings-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById(`${tabName}-panel`)?.classList.add('active');
    
    if (window.lucide) lucide.createIcons();
}

function openSceneEditorFromSettings() {
    closeDatingSettings();
    openSceneEditor();
}

window.openDatingSettings = openDatingSettings;
window.closeDatingSettings = closeDatingSettings;
window.switchSettingsTab = switchSettingsTab;
window.regenerateDialogue = regenerateDialogue;
window.checkApiStatus = checkApiStatus;

async function checkApiStatus() {
    const statusEl = document.getElementById('api-status-value');
    if (!statusEl) return;
    
    const config = getActiveApiConfig();
    if (!config || !config.url || !config.key) {
        statusEl.textContent = '未配置';
        statusEl.style.color = '#f87171';
        return false;
    }
    
    statusEl.textContent = '已配置';
    statusEl.style.color = '#4ade80';
    return true;
}

async function regenerateDialogue() {
    if (!DatingApp.dialogueActive) {
        alert('請先與角色互動後再重新生成對話');
        return;
    }
    
    const context = {
        situation: '重新生成對話',
        scene: DatingApp.currentScene
    };
    
    const dialogue = await generateDynamicDialogue(context);
    DatingApp.currentDialogue = dialogue;
    showDialogueBox(dialogue);
}

// ==================== 場景選擇介面 ====================
let selectedScene = null;

function renderSceneSelection() {
    const container = document.getElementById('scene-grid');
    if (!container) return;
    
    const defaultScenes = ['cafe', 'park', 'cinema', 'restaurant', 'beach', 'library'];
    
    let html = defaultScenes.map(key => {
        const scene = SCENES[key];
        if (!scene) return '';
        return `
            <button class="scene-card" onclick="selectScene('${key}')">
                <i data-lucide="${scene.icon}"></i>
                <span>${scene.name}</span>
            </button>
        `;
    }).join('');
    
    const customSceneKeys = Object.keys(SCENES).filter(key => 
        key.startsWith('custom_') || key.startsWith('imported_')
    );
    
    if (customSceneKeys.length > 0) {
        html += '<div class="scene-divider"><span>自定義地圖</span></div>';
        
        customSceneKeys.forEach(key => {
            const scene = SCENES[key];
            if (!scene) return;
            html += `
                <button class="scene-card custom-scene" onclick="selectScene('${key}')">
                    <i data-lucide="${scene.icon}"></i>
                    <span>${scene.name}</span>
                    ${scene.imported ? '<span class="imported-badge">導入</span>' : ''}
                </button>
            `;
        });
    }
    
    container.innerHTML = html;
    
    if (window.lucide) lucide.createIcons();
}

function selectScene(sceneKey) {
    selectedScene = sceneKey;
    
    // 隱藏場景選擇，顯示約會設定
    document.getElementById('scene-selection')?.classList.add('hidden');
    document.getElementById('date-setup')?.classList.remove('hidden');
    
    // 載入角色列表
    renderCharacterSelector();
}

function renderCharacterSelector() {
    const container = document.getElementById('char-selector');
    if (!container) return;
    
    const chars = JSON.parse(localStorage.getItem('sx_characters') || '[]');
    
    if (chars.length === 0) {
        container.innerHTML = `
            <div class="char-card selected" data-char-index="-1">
                <div class="char-card-avatar">
                    <i data-lucide="heart"></i>
                </div>
                <div class="char-card-name">預設角色</div>
            </div>
        `;
    } else {
        container.innerHTML = chars.map((char, idx) => `
            <div class="char-card ${idx === 0 ? 'selected' : ''}" data-char-index="${idx}" onclick="selectCharacter(${idx})">
                <div class="char-card-avatar">
                    ${char.avatar ? 
                        `<img src="${char.avatar}" alt="${char.name}">` :
                        '<i data-lucide="user"></i>'}
                </div>
                <div class="char-card-name">${char.name || '未命名'}</div>
            </div>
        `).join('');
    }
    
    if (window.lucide) lucide.createIcons();
}

function selectCharacter(idx) {
    // 更新選中狀態
    document.querySelectorAll('.char-card').forEach((card, i) => {
        card.classList.toggle('selected', i === idx);
    });
    
    // 載入角色資料
    const chars = JSON.parse(localStorage.getItem('sx_characters') || '[]');
    if (idx >= 0 && idx < chars.length) {
        DatingApp.currentChar = chars[idx];
    } else {
        DatingApp.currentChar = loadCharacterFromSettings();
    }
}

// ==================== 約會設定 ====================
function selectDays(days) {
    DatingApp.timeSystem.totalDays = days;
    
    // 更新按鈕狀態
    document.querySelectorAll('.date-setup .day-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

function selectCustomDays() {
    const input = document.getElementById('setup-custom-days');
    const days = parseInt(input.value);
    
    if (days && days > 0 && days <= 365) {
        DatingApp.timeSystem.totalDays = days;
        
        // 移除其他按鈕的active狀態
        document.querySelectorAll('.date-setup .day-btn').forEach(btn => {
            btn.classList.remove('active');
        });
    } else {
        alert('請輸入1-365之間的天數');
    }
}

function selectSpeed(speed) {
    DatingApp.timeSystem.timeSpeed = speed;
    
    // 更新按鈕狀態
    document.querySelectorAll('.date-setup .speed-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

function cancelDateSetup() {
    // 返回場景選擇
    document.getElementById('date-setup')?.classList.add('hidden');
    document.getElementById('scene-selection')?.classList.remove('hidden');
    selectedScene = null;
}

function confirmDateSetup() {
    if (!selectedScene) {
        alert('請選擇場景');
        return;
    }
    
    if (!DatingApp.currentChar) {
        DatingApp.currentChar = loadCharacterFromSettings();
    }
    
    // 開始約會
    startDate();
}

// ==================== 開始約會 ====================
function startDate() {
    DatingApp.currentScene = selectedScene;
    const scene = SCENES[selectedScene];
    
    // 隱藏設定，顯示遊戲畫面
    document.getElementById('date-setup')?.classList.add('hidden');
    document.getElementById('game-container')?.classList.remove('hidden');
    
    // 重置畫布快取
    DatingApp.canvas = null;
    DatingApp.ctx = null;
    
    // 更新角色資訊顯示
    updateCharInfo();
    
    // 初始化場景
    resetPositions();
    renderScene(scene);
    startGameLoop();
    
    // 啟動時間系統
    startTimeSystem();
    
    // 啟動 AI 控制系統
    initAIController();
}

// ==================== AI 控制系統 ====================
function initAIController() {
    DatingApp.aiController.enabled = true;
    DatingApp.aiController.greetingShown = false;
    DatingApp.aiController.contextLoaded = false;
    DatingApp.aiController.lastActionTime = Date.now();
    
    // 載入世界書和聊天紀錄
    loadAIContext();
    
    // 啟動 AI 行動循環
    startAIActionLoop();
}

function loadAIContext() {
    // 載入世界書資料
    const categories = ['cot', 'style', 'global', 'keywords', 'backend'];
    const worldbookData = {};
    
    categories.forEach(cat => {
        const key = `sx_worldbook_${cat}`;
        const data = localStorage.getItem(key);
        if (data) {
            try {
                worldbookData[cat] = JSON.parse(data);
            } catch (e) {
                worldbookData[cat] = [];
            }
        } else {
            worldbookData[cat] = [];
        }
    });
    
    DatingApp.aiController.worldbookData = worldbookData;
    
    // 載入聊天紀錄
    const chatHistory = JSON.parse(localStorage.getItem('sx_chat_history') || '[]');
    DatingApp.aiController.chatHistory = chatHistory.slice(-20); // 最近20條
    
    // 載入角色設定
    const charData = DatingApp.currentChar;
    const userName = localStorage.getItem('sx_user_name') || 'User';
    const userPersonality = localStorage.getItem('sx_user_personality') || '';
    
    DatingApp.aiController.charData = charData;
    DatingApp.aiController.userName = userName;
    DatingApp.aiController.userPersonality = userPersonality;
    
    DatingApp.aiController.contextLoaded = true;
    
    // 生成初始問候
    if (!DatingApp.aiController.greetingShown) {
        generateAIGreeting();
    }
}

function getActiveApiConfig() {
    const apis = JSON.parse(localStorage.getItem('api_configs') || '[]');
    if (!Array.isArray(apis) || !apis.length) return null;
    const activeIndex = Number.parseInt(localStorage.getItem('sx_active_api') || '0', 10);
    const safeIndex = Number.isFinite(activeIndex) && activeIndex >= 0 ? activeIndex : 0;
    return apis[safeIndex] || apis[0];
}

function buildAISystemPrompt(actionType) {
    const scene = SCENES[DatingApp.currentScene];
    const char = DatingApp.aiController.charData;
    const userName = DatingApp.aiController.userName;
    const wb = DatingApp.aiController.worldbookData;
    
    // 構建世界書內容
    let worldbookContent = '';
    const categories = ['cot', 'style', 'global', 'keywords', 'backend'];
    categories.forEach(cat => {
        const entries = wb[cat] || [];
        if (entries.length > 0) {
            worldbookContent += `\n【${cat}】\n`;
            entries.forEach(entry => {
                if (entry.content) {
                    worldbookContent += `${entry.content}\n`;
                }
            });
        }
    });
    
    // 構建聊天紀錄摘要
    let chatSummary = '';
    const history = DatingApp.aiController.chatHistory || [];
    if (history.length > 0) {
        chatSummary = '\n【最近對話】\n';
        history.slice(-5).forEach(msg => {
            const role = msg.role === 'user' ? userName : (char?.name || '角色');
            chatSummary += `${role}: ${msg.content}\n`;
        });
    }
    
    const basePrompt = `你正在扮演 ${char?.name || '角色'}，與 ${userName} 在 ${scene?.name || '約會場景'} 約會。

【角色設定】
名字: ${char?.name || '角色'}
性格: ${char?.personality || '溫柔體貼'}
背景: ${char?.background || ''}
${worldbookContent}
${chatSummary}

【場景】
${scene?.name} - ${getSceneDescription(DatingApp.currentScene)}

【行動指南】
- 你要模仿角色的語氣和性格
- 自然地與 ${userName} 互動
- 可以主動說話、跟隨、或做出反應
- 保持角色的一致性
- 回應要簡短自然，像日常對話`;

    if (actionType === 'greeting') {
        return basePrompt + `\n\n現在約會剛開始，請以角色的身份向 ${userName} 打招呼，表達期待或開心的心情。只回覆一句話。`;
    } else if (actionType === 'follow') {
        return basePrompt + `\n\n${userName} 正在移動，你決定跟隨他/她。請簡短表達你的行動或想法。只回覆一句話。`;
    } else if (actionType === 'react') {
        return basePrompt + `\n\n${userName} 做出了某個行動，請自然地做出反應。只回覆一句話。`;
    } else if (actionType === 'idle') {
        return basePrompt + `\n\n目前沒有特別的事情發生，請自然地說一句話或做出一個小動作。只回覆一句話。`;
    }
    
    return basePrompt;
}

function getSceneDescription(sceneKey) {
    const descriptions = {
        cafe: '溫馨的咖啡廳，有木質地板和柔和的燈光',
        park: '美麗的公園，有綠樹、花朵和散步小徑',
        cinema: '電影院，正在播放電影',
        restaurant: '浪漫的餐廳，有蠟燭和精緻的裝飾',
        beach: '海邊，有沙灘和陽傘',
        library: '安靜的圖書館，適合一起閱讀'
    };
    return descriptions[sceneKey] || '約會場所';
}

async function callAIAPI(systemPrompt) {
    const config = getActiveApiConfig();
    if (!config || !config.url || !config.key) {
        console.warn('AI API 未配置，使用預設回應');
        return null;
    }
    
    const apiType = config.type || 'openai';
    
    // Gemini 原生 API 格式
    if (apiType === 'gemini') {
        const model = config.model || 'gemini-1.5-flash';
        const targetUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + config.key;
        
        try {
            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: '請回應' }] }],
                    generationConfig: { temperature: 0.8, maxOutputTokens: 100 },
                    systemInstruction: { parts: [{ text: systemPrompt }] }
                })
            });
            
            if (!response.ok) {
                console.warn('Gemini API 回應失敗:', response.status);
                return null;
            }
            
            const data = await response.json();
            if (data.error) {
                console.warn('Gemini API 錯誤:', data.error);
                return null;
            }
            return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
        } catch (e) {
            console.warn('Gemini API 調用失敗:', e);
            return null;
        }
    }
    
    // OpenAI 相容格式或自訂端點
    let targetUrl;
    if (apiType === 'custom') {
        targetUrl = config.url;
    } else {
        targetUrl = config.url.endsWith('/chat/completions') ? config.url : config.url.replace(/\/$/, '') + '/chat/completions';
    }
    
    try {
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.key}`
            },
            body: JSON.stringify({
                model: config.model || 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: '請回應' }
                ],
                max_tokens: 100,
                temperature: 0.8
            })
        });
        
        if (!response.ok) {
            console.warn('AI API 回應失敗:', response.status);
            return null;
        }
        
        const data = await response.json();
        return data.choices?.[0]?.message?.content || null;
    } catch (e) {
        console.warn('AI API 調用失敗:', e);
        return null;
    }
}

async function generateAIGreeting() {
    if (DatingApp.aiController.greetingShown) return;
    
    const systemPrompt = buildAISystemPrompt('greeting');
    const aiResponse = await callAIAPI(systemPrompt);
    
    const greeting = aiResponse || getDefaultGreeting();
    
    // 顯示問候對話
    showAIDialogue(greeting);
    DatingApp.aiController.greetingShown = true;
}

function getDefaultGreeting() {
    const char = DatingApp.currentChar;
    const scene = SCENES[DatingApp.currentScene];
    const greetings = [
        `今天能和你一起來${scene?.name || '這裡'}，我很開心呢！`,
        `終於等到這一天了，${char?.name || '我'}好期待！`,
        `和你在一起的時間，總是特別美好。`,
        `這裡的氣氛真好，謝謝你約我出來！`
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
}

function showAIDialogue(text) {
    const box = document.getElementById('ai-dialogue-box');
    if (!box) {
        // 動態創建 AI 對話框
        createAIDialogueBox();
    }
    
    const dialogueBox = document.getElementById('ai-dialogue-box');
    if (dialogueBox) {
        dialogueBox.classList.remove('hidden');
        dialogueBox.innerHTML = `
            <div class="ai-dialogue-avatar">
                ${DatingApp.currentChar.avatar ?
                    `<img src="${DatingApp.currentChar.avatar}" alt="avatar">` :
                    '<i data-lucide="user"></i>'}
            </div>
            <div class="ai-dialogue-content">
                <div class="ai-dialogue-name">${DatingApp.currentChar.name || '角色'}</div>
                <div class="ai-dialogue-text">${text}</div>
            </div>
        `;
        
        if (window.lucide) lucide.createIcons();
        
        // 3秒後自動隱藏
        setTimeout(() => {
            dialogueBox.classList.add('hidden');
        }, 4000);
    }
}

function createAIDialogueBox() {
    const container = document.getElementById('game-container');
    if (!container) return;
    
    const box = document.createElement('div');
    box.id = 'ai-dialogue-box';
    box.className = 'ai-dialogue-box hidden';
    container.appendChild(box);
}

function startAIActionLoop() {
    setInterval(() => {
        if (!DatingApp.aiController.enabled || DatingApp.dialogueActive) return;
        
        const now = Date.now();
        if (now - DatingApp.aiController.lastActionTime < DatingApp.aiController.actionInterval) return;
        
        DatingApp.aiController.lastActionTime = now;
        
        // 檢查玩家與角色的距離
        const distance = Math.sqrt(
            Math.pow(DatingApp.player.x - DatingApp.char.x, 2) +
            Math.pow(DatingApp.player.y - DatingApp.char.y, 2)
        );
        
        // 根據情況決定行動
        if (distance > 150) {
            // 玩家走遠了，角色跟隨
            moveCharTowardsPlayer();
        } else if (distance < 60 && Math.random() > 0.7) {
            // 靠近時，有機率主動說話
            generateAIIdleAction();
        } else if (Math.random() > 0.85) {
            // 隨機閒置行動
            generateAIIdleAction();
        }
    }, 1000);
}

function moveCharTowardsPlayer() {
    const dx = DatingApp.player.x - DatingApp.char.x;
    const dy = DatingApp.player.y - DatingApp.char.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 100) {
        // 移動角色朝向玩家
        const speed = 3;
        const ratio = speed / distance;
        
        const newX = DatingApp.char.x + dx * ratio;
        const newY = DatingApp.char.y + dy * ratio;
        
        // 邊界檢查
        if (newX >= 20 && newX <= 680 && newY >= 20 && newY <= 480) {
            DatingApp.char.x = newX;
            DatingApp.char.y = newY;
        }
    }
}

async function generateAIIdleAction() {
    const systemPrompt = buildAISystemPrompt('idle');
    const aiResponse = await callAIAPI(systemPrompt);
    
    if (aiResponse) {
        showAIDialogue(aiResponse);
    }
}

// ==================== AI 動態對話生成 ====================
async function generateDynamicDialogue(context = {}) {
    const config = getActiveApiConfig();
    if (!config || !config.url || !config.key) {
        console.warn('AI API 未配置，使用預設對話');
        return getDefaultDialogue(context);
    }
    
    const systemPrompt = buildDialogueSystemPrompt(context);
    
    try {
        let targetUrl = config.url.endsWith('/chat/completions') 
            ? config.url 
            : config.url.replace(/\/$/, '') + '/chat/completions';
        
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.key}`
            },
            body: JSON.stringify({
                model: config.model || 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: '請生成對話回應' }
                ],
                max_tokens: 500,
                temperature: 0.85
            })
        });
        
        if (!response.ok) {
            console.warn('AI API 回應失敗:', response.status);
            return getDefaultDialogue(context);
        }
        
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (parseError) {
            console.warn('解析 AI 回應失敗:', parseError);
        }
        
        return {
            dialogue: content,
            mood: 'neutral',
            choices: [
                { text: '我同意', affection: 5 },
                { text: '嗯嗯', affection: 2 },
                { text: '是嗎？', affection: -1 }
            ]
        };
    } catch (e) {
        console.warn('AI API 調用失敗:', e);
        return getDefaultDialogue(context);
    }
}

function buildDialogueSystemPrompt(context) {
    const scene = SCENES[DatingApp.currentScene];
    const char = DatingApp.currentChar;
    const userName = localStorage.getItem('sx_user_name') || 'User';
    const userPersonality = localStorage.getItem('sx_user_personality') || '';
    const userBackground = localStorage.getItem('sx_user_background') || '';
    
    const wb = DatingApp.aiController.worldbookData || {};
    
    let worldbookContent = '';
    ['cot', 'style', 'global', 'keywords', 'backend'].forEach(cat => {
        const entries = wb[cat] || [];
        if (entries.length > 0) {
            worldbookContent += `\n【${cat}】\n`;
            entries.slice(0, 5).forEach(entry => {
                if (entry.content) {
                    worldbookContent += `${entry.content}\n`;
                }
            });
        }
    });
    
    let chatSummary = '';
    const history = DatingApp.dialogueHistory || [];
    if (history.length > 0) {
        chatSummary = '\n【最近對話紀錄】\n';
        history.slice(-5).forEach(msg => {
            chatSummary += `${msg.speaker}: ${msg.text}\n`;
        });
    }
    
    const timeInfo = DatingApp.timeSystem;
    const timeStr = `第${timeInfo.currentDay}天 ${timeInfo.currentHour.toString().padStart(2, '0')}:${Math.floor(timeInfo.currentMinute).toString().padStart(2, '0')}`;
    
    return `你正在扮演 ${char?.name || '角色'}，與 ${userName} 在 ${scene?.name || '約會場景'} 約會。

【角色設定】
名字: ${char?.name || '角色'}
性格: ${char?.personality || '溫柔體貼'}
背景: ${char?.background || ''}

【用戶設定】
名字: ${userName}
性格: ${userPersonality || '開朗友善'}
背景: ${userBackground || ''}

【場景】
${scene?.name} - ${getSceneDescription(DatingApp.currentScene)}
當前時間: ${timeStr}

【世界書資料】
${worldbookContent || '無'}
${chatSummary}

【情境】
${context.situation || '日常對話'}

【回應格式】
請以 JSON 格式回應，包含：
{
  "dialogue": "角色說的話（1-2句，自然口語化）",
  "mood": "happy/shy/curious/nervous/romantic/playful/neutral",
  "choices": [
    {"text": "選項一（正面回應）", "affection": 5到15},
    {"text": "選項二（中性回應）", "affection": -2到5},
    {"text": "選項三（負面或調皮回應）", "affection": -10到2}
  ]
}

注意：
- 好感度變化範圍 -10 到 +15
- 對話要符合角色性格和當前情境
- 選項要有趣且有意義
- 只回傳 JSON，不要其他文字`;
}

function getDefaultDialogue(context) {
    const scene = SCENES[DatingApp.currentScene];
    const char = DatingApp.currentChar;
    
    const defaultDialogues = [
        {
            dialogue: `和你在一起${scene?.name || '這裡'}感覺真好呢...`,
            mood: 'happy',
            choices: [
                { text: '我也這麼覺得！', affection: 10 },
                { text: '是啊，很開心', affection: 5 },
                { text: '還好啦', affection: 0 }
            ]
        },
        {
            dialogue: `今天的天氣真不錯，很適合約會呢！`,
            mood: 'cheerful',
            choices: [
                { text: '對啊，很舒服！', affection: 8 },
                { text: '嗯，還不錯', affection: 3 },
                { text: '我覺得太熱了...', affection: -3 }
            ]
        },
        {
            dialogue: `${char?.name || '我'}很珍惜和你在一起的時光。`,
            mood: 'romantic',
            choices: [
                { text: '我也是，很幸福', affection: 12 },
                { text: '謝謝你這麼說', affection: 6 },
                { text: '哈哈，真的嗎？', affection: 2 }
            ]
        }
    ];
    
    return defaultDialogues[Math.floor(Math.random() * defaultDialogues.length)];
}

function recordDialogue(speaker, text, choice = null) {
    DatingApp.dialogueHistory.push({
        speaker,
        text,
        choice,
        timestamp: Date.now()
    });
    
    if (DatingApp.dialogueHistory.length > 50) {
        DatingApp.dialogueHistory = DatingApp.dialogueHistory.slice(-30);
    }
}

// 當玩家移動時，AI 可能做出反應
function onPlayerMove() {
    if (!DatingApp.aiController.enabled) return;
    
    // 有機率讓角色跟隨或說話
    if (Math.random() > 0.8) {
        moveCharTowardsPlayer();
    }
}

// ==================== 場景渲染 ====================
function renderScene(scene) {
    if (!DatingApp.canvas) {
        DatingApp.canvas = document.getElementById('game-canvas');
        if (!DatingApp.canvas) return;
        DatingApp.ctx = DatingApp.canvas.getContext('2d');
        DatingApp.canvas.width = 800;
        DatingApp.canvas.height = 600;
    }
    
    const ctx = DatingApp.ctx;
    const canvas = DatingApp.canvas;
    
    // 清空畫布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 使用快取的場景圖片
    if (typeof SceneRenderer !== 'undefined') {
        // 檢查快取
        if (!DatingApp.sceneCache[DatingApp.currentScene]) {
            // 生成並快取場景
            const bgImage = new Image();
            bgImage.src = SceneRenderer.generateBackground(DatingApp.currentScene);
            DatingApp.sceneCache[DatingApp.currentScene] = bgImage;
            
            bgImage.onload = () => {
                renderSceneContent(ctx, canvas, scene);
            };
        } else {
            // 使用快取的圖片
            renderSceneContent(ctx, canvas, scene);
        }
    } else {
        // 備用方案
        renderSceneFallback(ctx, canvas, scene);
    }
}

function renderSceneContent(ctx, canvas, scene) {
    if (scene.custom && scene.data) {
        renderCustomTilemapScene(ctx, canvas, scene);
        return;
    }
    
    const bgImage = DatingApp.sceneCache[DatingApp.currentScene];
    if (bgImage && bgImage.complete) {
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        
        scene.objects.forEach(obj => {
            SceneRenderer.drawObject(ctx, obj);
        });
        
        drawCharacter(ctx, DatingApp.player, '#4A90E2', '你');
        drawCharacter(ctx, DatingApp.char, '#E91E63', DatingApp.currentChar.name);
    }
}

function renderCustomTilemapScene(ctx, canvas, scene) {
    const data = scene.data;
    const tileSize = data.tileSize || 32;
    
    ctx.fillStyle = '#2a2a4a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (data.layers) {
        data.layers.forEach(layer => {
            if (!layer.visible && layer.visible !== undefined) return;
            
            ctx.globalAlpha = layer.opacity || 1;
            
            if (layer.tileData) {
                for (let y = 0; y < layer.tileData.length; y++) {
                    for (let x = 0; x < layer.tileData[y].length; x++) {
                        const tile = layer.tileData[y][x];
                        if (!tile) continue;
                        
                        const tileset = data.tilesets?.find(t => t.id === tile.tilesetId);
                        if (!tileset || !tileset.image) continue;
                        
                        const tileInfo = tileset.tiles?.[tile.tileIndex];
                        if (!tileInfo) continue;
                        
                        const img = new Image();
                        img.src = tileInfo.src;
                        
                        if (img.complete) {
                            ctx.drawImage(img, x * tileSize, y * tileSize, tileSize, tileSize);
                        }
                    }
                }
            }
            
            if (layer.objects) {
                layer.objects.forEach(obj => {
                    const img = new Image();
                    img.src = obj.src;
                    if (img.complete) {
                        ctx.drawImage(img, obj.x, obj.y, obj.width, obj.height);
                    }
                });
            }
            
            ctx.globalAlpha = 1;
        });
    }
    
    drawCharacter(ctx, DatingApp.player, '#4A90E2', '你');
    drawCharacter(ctx, DatingApp.char, '#E91E63', DatingApp.currentChar.name);
}

function renderSceneFallback(ctx, canvas, scene) {
    // 備用方案：使用漸層背景
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#228B22');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 簡單繪製物件
    scene.objects.forEach(obj => {
        ctx.fillStyle = 'rgba(139, 69, 19, 0.7)';
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
    });
    
    drawCharacter(ctx, DatingApp.player, '#4A90E2', '你');
    drawCharacter(ctx, DatingApp.char, '#E91E63', DatingApp.currentChar.name);
}

function drawCharacter(ctx, char, color, label) {
    if (DatingApp.charSprite && label === DatingApp.currentChar?.name) {
        drawPixelCharacter(ctx, char, DatingApp.charSprite, label);
    } else if (label === '你' && DatingApp.playerSprite) {
        drawPixelCharacter(ctx, char, DatingApp.playerSprite, label);
    } else {
        drawFallbackCharacter(ctx, char, color, label);
    }
}

function drawPixelCharacter(ctx, charPos, sprite, label) {
    const spriteCanvas = createSpriteCanvas(32);
    renderSprite(sprite, spriteCanvas, 32);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.beginPath();
    ctx.ellipse(charPos.x, charPos.y + 5, 18, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.beginPath();
    ctx.ellipse(charPos.x + 1, charPos.y + 7, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
    ctx.beginPath();
    ctx.ellipse(charPos.x + 2, charPos.y + 9, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.drawImage(spriteCanvas, charPos.x - 16, charPos.y - 32, 32, 40);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 3;
    ctx.strokeText(label, charPos.x, charPos.y - 38);
    ctx.fillText(label, charPos.x, charPos.y - 38);
}

function drawFallbackCharacter(ctx, char, color, label) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.beginPath();
    ctx.ellipse(char.x, char.y + 5, 18, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.beginPath();
    ctx.ellipse(char.x + 1, char.y + 7, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
    ctx.beginPath();
    ctx.ellipse(char.x + 2, char.y + 9, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    const bodyColor = color;
    const bodyHighlight = adjustColor(color, 25);
    const bodyShadow = adjustColor(color, -25);
    const depthColor = adjustColor(color, -50);
    
    ctx.fillStyle = bodyColor;
    ctx.fillRect(char.x - 12, char.y - 24, 24, 28);
    
    ctx.fillStyle = bodyHighlight;
    ctx.fillRect(char.x - 12, char.y - 24, 4, 28);
    
    ctx.fillStyle = bodyShadow;
    ctx.fillRect(char.x + 8, char.y - 24, 4, 28);
    
    ctx.fillStyle = depthColor;
    ctx.fillRect(char.x - 12, char.y + 4, 24, 4);
    ctx.fillRect(char.x - 12, char.y + 4, 2, 4);
    
    const skinColor = '#fde8c8';
    const skinHighlight = adjustColor(skinColor, 15);
    const skinShadow = adjustColor(skinColor, -20);
    
    ctx.fillStyle = skinColor;
    ctx.fillRect(char.x - 10, char.y - 32, 20, 14);
    
    ctx.fillStyle = skinHighlight;
    ctx.fillRect(char.x - 10, char.y - 32, 3, 14);
    
    ctx.fillStyle = skinShadow;
    ctx.fillRect(char.x + 7, char.y - 32, 3, 14);
    
    ctx.fillStyle = '#1a0a00';
    ctx.fillRect(char.x - 6, char.y - 28, 4, 4);
    ctx.fillRect(char.x + 2, char.y - 28, 4, 4);
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(char.x - 6, char.y - 28, 1, 1);
    ctx.fillRect(char.x + 2, char.y - 28, 1, 1);
    
    ctx.fillStyle = '#ff9999';
    ctx.fillRect(char.x - 4, char.y - 22, 8, 2);
    
    ctx.fillStyle = skinColor;
    ctx.fillRect(char.x - 8, char.y + 4, 6, 8);
    ctx.fillRect(char.x + 2, char.y + 4, 6, 8);
    
    ctx.fillStyle = skinShadow;
    ctx.fillRect(char.x - 4, char.y + 4, 2, 8);
    ctx.fillRect(char.x + 6, char.y + 4, 2, 8);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 3;
    ctx.strokeText(label, char.x, char.y - 38);
    ctx.fillText(label, char.x, char.y - 38);
}

// ==================== 角色移動 ====================
function movePlayer(dx, dy) {
    if (DatingApp.dialogueActive) return;
    
    const newX = DatingApp.player.x + dx * 5;
    const newY = DatingApp.player.y + dy * 5;
    
    // 邊界檢查
    if (newX >= 20 && newX <= 680 && newY >= 20 && newY <= 480) {
        DatingApp.player.x = newX;
        DatingApp.player.y = newY;
        
        // 檢查是否接近角色
        checkInteraction();
        
        // AI 角色可能做出反應
        onPlayerMove();
    }
}

function checkInteraction() {
    const distance = Math.sqrt(
        Math.pow(DatingApp.player.x - DatingApp.char.x, 2) +
        Math.pow(DatingApp.player.y - DatingApp.char.y, 2)
    );
    
    if (distance < 60 && !DatingApp.dialogueActive) {
        showInteractionPrompt();
    }
}

function showInteractionPrompt() {
    const prompt = document.getElementById('interaction-prompt');
    if (prompt) {
        prompt.classList.remove('hidden');
        prompt.textContent = '按 E 互動';
    }
}

// ==================== 對話系統 ====================
async function startDialogue() {
    const scene = SCENES[DatingApp.currentScene];
    
    DatingApp.dialogueActive = true;
    
    // 使用 AI 生成動態對話
    const context = {
        situation: `${scene?.name || '約會場所'}的日常對話`,
        scene: DatingApp.currentScene
    };
    
    const dialogue = await generateDynamicDialogue(context);
    DatingApp.currentDialogue = dialogue;
    
    showDialogueBox(dialogue);
}

function showDialogueBox(dialogue) {
    const box = document.getElementById('dialogue-box');
    if (!box) return;
    
    box.classList.remove('hidden');
    
    const moodEmoji = {
        happy: '😊',
        shy: '😳',
        curious: '🤔',
        nervous: '😰',
        romantic: '💕',
        playful: '😜',
        neutral: '😐',
        cheerful: '😄'
    };
    
    const emoji = moodEmoji[dialogue.mood] || '😊';
    
    let choicesHtml = '';
    if (dialogue.choices && dialogue.choices.length > 0) {
        choicesHtml = '<div class="dialogue-options">';
        dialogue.choices.forEach((choice, idx) => {
            choicesHtml += `<button onclick="respondToDialogue(${idx}, ${choice.affection || 0}, '${choice.text.replace(/'/g, "\\'")}')">${choice.text}</button>`;
        });
        choicesHtml += '</div>';
    } else {
        choicesHtml = `
            <div class="dialogue-options">
                <button onclick="respondToDialogue(0, 5)">❤️ 我也這麼覺得</button>
                <button onclick="respondToDialogue(1, 2)">😊 是啊</button>
                <button onclick="respondToDialogue(2, -1)">😄 真的嗎?</button>
            </div>
        `;
    }
    
    box.innerHTML = `
        <div class="dialogue-avatar">
            ${DatingApp.currentChar.avatar ? 
                `<img src="${DatingApp.currentChar.avatar}" alt="avatar">` :
                '<i data-lucide="user"></i>'}
        </div>
        <div class="dialogue-content">
            <div class="dialogue-name">${emoji} ${DatingApp.currentChar.name}</div>
            <div class="dialogue-text">${dialogue.dialogue || dialogue.text}</div>
            ${choicesHtml}
        </div>
    `;
    
    if (window.lucide) lucide.createIcons();
}

async function respondToDialogue(choiceIdx, affectionDelta, choiceText = '') {
    const dialogue = DatingApp.currentDialogue;
    
    if (dialogue && dialogue.choices && dialogue.choices[choiceIdx]) {
        const choice = dialogue.choices[choiceIdx];
        affectionDelta = choice.affection || 0;
        choiceText = choice.text;
    }
    
    recordDialogue(DatingApp.currentChar?.name || '角色', dialogue?.dialogue || '', choiceText);
    recordDialogue('你', choiceText, null);
    
    closeDialogue();
}

function closeDialogue() {
    const box = document.getElementById('dialogue-box');
    if (box) box.classList.add('hidden');
    
    DatingApp.dialogueActive = false;
    DatingApp.currentDialogue = null;
    
    const prompt = document.getElementById('interaction-prompt');
    if (prompt) prompt.classList.add('hidden');
}

// ==================== 遊戲循環 ====================
let gameLoopId = null;

function startGameLoop() {
    // 停止之前的循環
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
    }
    
    let lastRender = Date.now();
    
    function gameLoop() {
        const now = Date.now();
        const delta = now - lastRender;
        
        if (delta >= 33 && !DatingApp.dialogueActive) { // ~30 FPS
            const scene = SCENES[DatingApp.currentScene];
            if (scene) {
                renderScene(scene);
            }
            lastRender = now;
        }
        
        gameLoopId = requestAnimationFrame(gameLoop);
    }
    
    gameLoop();
}

function stopGameLoop() {
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }
}

// ==================== 事件監聽 ====================
function setupEventListeners() {
    // 鍵盤控制
    document.addEventListener('keydown', (e) => {
        if (DatingApp.currentScene === 'home') return;
        
        switch(e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                movePlayer(0, -1);
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                movePlayer(0, 1);
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                movePlayer(-1, 0);
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                movePlayer(1, 0);
                break;
            case 'e':
            case 'E':
                if (!DatingApp.dialogueActive) {
                    startDialogue();
                }
                break;
            case 'Escape':
                endDate();
                break;
        }
    });
    
    // 觸控控制
    setupTouchControls();
}

function setupTouchControls() {
    const controls = document.getElementById('touch-controls');
    if (!controls) return;
    
    controls.innerHTML = `
        <button class="control-btn" data-dir="up">↑</button>
        <button class="control-btn" data-dir="down">↓</button>
        <button class="control-btn" data-dir="left">←</button>
        <button class="control-btn" data-dir="right">→</button>
        <button class="control-btn interact" onclick="startDialogue()">💬</button>
    `;
    
    controls.querySelectorAll('[data-dir]').forEach(btn => {
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const dir = btn.dataset.dir;
            const moves = {
                up: [0, -1],
                down: [0, 1],
                left: [-1, 0],
                right: [1, 0]
            };
            if (moves[dir]) {
                movePlayer(...moves[dir]);
            }
        });
    });
}

// ==================== 輔助函數 ====================
function resetPositions() {
    DatingApp.player = { x: 200, y: 300, direction: 'down' };
    DatingApp.char = { x: 400, y: 300, direction: 'down' };
}

function updateCharInfo() {
    const nameEl = document.getElementById('char-name-display');
    const avatarEl = document.getElementById('char-avatar-display');
    
    if (nameEl) nameEl.textContent = DatingApp.currentChar?.name || '';
    if (avatarEl && DatingApp.currentChar.avatar) {
        avatarEl.innerHTML = `<img src="${DatingApp.currentChar.avatar}" alt="avatar">`;
    }
}

function updateAffectionDisplay() {
    const display = document.getElementById('affection-display');
    if (display) {
        const hearts = '❤️'.repeat(Math.min(5, Math.floor(DatingApp.affection / 10)));
        display.textContent = `好感度: ${hearts} (${DatingApp.affection})`;
    }
}

function endDate() {
    if (confirm('確定要結束約會嗎?')) {
        stopGameLoop();
        stopTimeSystem();
        document.getElementById('game-container')?.classList.add('hidden');
        document.getElementById('scene-selection')?.classList.remove('hidden');
        DatingApp.currentScene = 'home';
        selectedScene = null;
        // 清空快取
        DatingApp.sceneCache = {};
        // 重置時間
        DatingApp.timeSystem.currentDay = 1;
        DatingApp.timeSystem.currentHour = 9;
        DatingApp.timeSystem.currentMinute = 0;
        DatingApp.timeSystem.isPaused = false;
        DatingApp.timeSystem.totalDays = 3;
        DatingApp.timeSystem.timeSpeed = 1;
    }
}

// ==================== 全域函數 ====================
window.startDate = startDate;
window.respondToDialogue = respondToDialogue;
window.endDate = endDate;

// 初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        init();
    });
} else {
    init();
}
