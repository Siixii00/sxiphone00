console.log('Loaded app: dating');

// ==================== ?∏Â?Ë≥áÊ?ÁµêÊ? ====================
const DatingApp = {
    currentScene: 'home',
    currentChar: null,
    player: { x: 200, y: 300, direction: 'down' },
    char: { x: 400, y: 300, direction: 'down' },
    isMoving: false,
    dialogueActive: false,
    currentDialogue: null,
    sceneCache: {}, // ?¥ÊôØ?ñÁ?Âø´Â?
    canvas: null,
    ctx: null,
    pendingSceneFromChat: null, // ÂæûË?Â§©Á??ÉÈ?Ë´ã‰??ÑÂ??üÂ??¥ÊôØ
    // ?ÇÈ?Á≥ªÁµ±
    timeSystem: {
        totalDays: 3, // ?êË®≠3Â§?        currentDay: 1,
        currentHour: 9, // ?©‰?9ÈªûÈ?Âß?        currentMinute: 0,
        timeSpeed: 1, // ?ÇÈ?ÊµÅÈÄüÔ??ÜÈ?/ÁßíÔ?
        isPaused: false
    },
    // AI ?ßÂà∂Á≥ªÁµ±
    aiController: {
        enabled: true,
        lastActionTime: 0,
        actionInterval: 3000, // ÊØ?ÁßíÊ™¢?•‰?Ê¨°Ë???        currentAction: null,
        greetingShown: false,
        contextLoaded: false,
        worldbookData: null,
        chatHistory: null
    },
    // ËßíËâ≤Â§ñË?Á≥ªÁµ±
    charSprite: {
        body: 'slim',
        hair: 'short',
        haircolor: '#2d1b00',
        skin: '#fde8c8',
        outfit: 'casual',
        outfitcolor: '#ff6b9d',
        name: ''
    },
    // ?©ÂÆ∂Â§ñË?
    playerSprite: {
        body: 'normal',
        hair: 'short',
        haircolor: '#1a1a1a',
        skin: '#fde8c8',
        outfit: 'casual',
        outfitcolor: '#38bdf8'
    },
    // ?èÁ?Á∑®ËºØ?®Á???    pixelEditor: {
        tool: 'draw',
        penColor: '#ff6b9d',
        pixels: Array.from({length: 16}, () => Array(16).fill(null))
    },
    // Â∞çË©±Ê≠∑Âè≤ÔºàAI ?üÊ??®Ô?
    dialogueHistory: []
};

// ==================== ?èÁ?ËßíËâ≤Ê∏≤Ê???====================
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
    const hair = sprite.haircolor || '#2d1b00';
    const outfit = sprite.outfitcolor || '#ff6b9d';
    
    ctx.save();
    ctx.scale(scale, scale);
    
    // Body
    ctx.fillStyle = skin;
    if (sprite.body === 'slim') {
        ctx.fillRect(36, 32, 24, 44);
        ctx.fillRect(34, 76, 10, 16);
        ctx.fillRect(52, 76, 10, 16);
        ctx.fillRect(28, 34, 8, 28);
        ctx.fillRect(60, 34, 8, 28);
    } else if (sprite.body === 'normal') {
        ctx.fillRect(32, 32, 32, 44);
        ctx.fillRect(30, 76, 14, 16);
        ctx.fillRect(52, 76, 14, 16);
        ctx.fillRect(22, 34, 10, 28);
        ctx.fillRect(64, 34, 10, 28);
    } else {
        ctx.fillRect(28, 32, 40, 44);
        ctx.fillRect(28, 76, 16, 16);
        ctx.fillRect(52, 76, 16, 16);
        ctx.fillRect(18, 34, 12, 28);
        ctx.fillRect(66, 34, 12, 28);
    }
    
    // Head
    ctx.fillStyle = skin;
    ctx.fillRect(32, 8, 32, 28);
    ctx.fillStyle = '#1a0a00';
    ctx.fillRect(36, 20, 4, 4);
    ctx.fillRect(56, 20, 4, 4);
    ctx.fillStyle = '#ff9999';
    ctx.fillRect(40, 26, 16, 3);
    
    // Outfit
    ctx.fillStyle = outfit;
    if (sprite.outfit === 'dress') {
        ctx.fillRect(32, 44, 32, 36);
        ctx.fillRect(26, 44, 8, 24);
        ctx.fillRect(62, 44, 8, 24);
    } else if (sprite.outfit === 'uniform') {
        ctx.fillRect(32, 44, 32, 28);
        ctx.fillStyle = '#333';
        ctx.fillRect(32, 72, 32, 20);
        ctx.fillStyle = '#fff';
        ctx.fillRect(44, 44, 8, 28);
    } else if (sprite.outfit === 'kimono') {
        ctx.fillRect(30, 42, 36, 36);
        ctx.fillStyle = adjustColor(outfit, -40);
        ctx.fillRect(30, 42, 6, 36);
        ctx.fillRect(60, 42, 6, 36);
    } else if (sprite.outfit === 'sporty') {
        ctx.fillRect(32, 44, 32, 20);
        ctx.fillStyle = adjustColor(outfit, 30);
        ctx.fillRect(32, 64, 32, 28);
    } else {
        ctx.fillRect(32, 44, 32, 28);
        ctx.fillStyle = adjustColor(outfit, 20);
        ctx.fillRect(32, 72, 32, 20);
    }
    
    // Hair
    ctx.fillStyle = hair;
    if (sprite.hair === 'short') {
        ctx.fillRect(32, 4, 32, 16);
        ctx.fillRect(28, 8, 8, 16);
        ctx.fillRect(60, 8, 8, 16);
    } else if (sprite.hair === 'long') {
        ctx.fillRect(32, 4, 32, 12);
        ctx.fillRect(24, 8, 12, 52);
        ctx.fillRect(60, 8, 12, 52);
        ctx.fillRect(28, 4, 4, 8);
    } else if (sprite.hair === 'twin') {
        ctx.fillRect(32, 4, 32, 12);
        ctx.fillRect(18, 8, 14, 44);
        ctx.fillRect(64, 8, 14, 44);
        ctx.fillRect(18, 48, 14, 8);
        ctx.fillRect(64, 48, 14, 8);
    } else if (sprite.hair === 'messy') {
        for (let i = 0; i < 6; i++) {
            ctx.fillRect(28 + i * 7, 2 + Math.floor(Math.random() * 4), 8, 14 + (i % 3) * 4);
        }
        ctx.fillRect(24, 8, 12, 20);
        ctx.fillRect(60, 8, 12, 20);
    } else {
        ctx.fillRect(36, 0, 24, 12);
        ctx.beginPath();
        ctx.arc(48, 8, 12, 0, Math.PI * 2);
        ctx.fillStyle = hair;
        ctx.fill();
        ctx.fillRect(40, 0, 16, 8);
    }
    
    // Eye color detail
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

// ==================== ?èÁ?Á∑®ËºØ??====================
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

// ==================== ËßíËâ≤Âª∫Á??®ÈÅ∏??====================
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

// ?®Â??ΩÊï∏
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

// Âæ?settings ËºâÂÖ•ËßíËâ≤Ë≥áÊ?
function loadCharacterFromSettings() {
    const chars = JSON.parse(localStorage.getItem('sx_characters') || '[]');
    if (chars.length > 0) {
        return chars[0]; // ‰ΩøÁî®Á¨¨‰??ãË???    }
    return {
        name: '',
        avatar: '',
        personality: 'Ê∫´Ê?È´îË≤º',
        background: ''
    };
}

// ==================== ?¥ÊôØÂÆöÁæ© ====================
const SCENES = {
    cafe: {
        name: '?ñÂï°Âª?,
        icon: 'coffee',
        background: null, // Â∞áÁî±generateSceneBackground?üÊ?
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
            { text: '?ôË£°?ÑÂ??°Â?È¶ôÂë¢...', mood: 'happy' },
            { text: 'Ë¨ùË?‰Ω†Èô™?ë‰??ôË£°', mood: 'shy' },
            { text: '?ëÂÄë‰?Ê¨°È?Ë¶Å‰?Ëµ∑‰???', mood: 'hopeful' }
        ]
    },
    park: {
        name: '?¨Â?',
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
            { text: 'Â§©Ê∞£?üÂ•ΩÔºåÊï£Ê≠•Â??íÊ?', mood: 'relaxed' },
            { text: '?ãÈÇ£?äÁ??±È?ÂæóÂ•ΩÊºÇ‰∫Æ', mood: 'excited' },
            { text: '?ΩÂ?‰Ω†‰?Ëµ∑Êï£Ê≠•Á?Â•?, mood: 'happy' }
        ]
    },
    cinema: {
        name: '?ªÂΩ±??,
        icon: 'film',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        objects: [
            { type: 'screen', x: 210, y: 80, width: 280, height: 140 },
            { type: 'seats', x: 120, y: 250, width: 520, height: 70 },
            { type: 'seats', x: 120, y: 340, width: 520, height: 70 }
        ],
        dialogues: [
            { text: '?ôÈÉ®?ªÂΩ±Â•ΩÂ?ÂæàÊ?Ë∂?, mood: 'curious' },
            { text: '?ëÊ?ÈªûÁ?Âº?..', mood: 'nervous' },
            { text: 'Ë¨ùË?‰Ω†ÈÅ∏‰∫ÜÈÄôÈÉ®?ªÂΩ±', mood: 'grateful' }
        ]
    },
    restaurant: {
        name: 'È§êÂª≥',
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
            { text: '?ôË£°?ÑÊ∞£Ê∞õÁ?Êµ™Êº´', mood: 'romantic' },
            { text: 'È£üÁâ©?ãËµ∑‰æÜÂ?ÁæéÂë≥', mood: 'happy' },
            { text: '?å‰?‰∏ÄËµ∑Â?È£ØÊ??ãÂ?‰∫?, mood: 'loving' }
        ]
    },
    beach: {
        name: 'Êµ∑È?',
        icon: 'waves',
        background: 'linear-gradient(135deg, #87CEEB 0%, #4682B4 100%)',
        objects: [
            { type: 'umbrella', x: 120, y: 200, width: 90, height: 110 },
            { type: 'umbrella', x: 540, y: 220, width: 90, height: 110 },
            { type: 'towel', x: 260, y: 330, width: 110, height: 60 },
            { type: 'towel', x: 420, y: 360, width: 110, height: 60 }
        ],
        dialogues: [
            { text: 'Êµ∑È¢®?π‰?Â•ΩË???, mood: 'relaxed' },
            { text: '?ëÂÄëÂéªË∏©Ë∏©Ê∞¥Âêß', mood: 'playful' },
            { text: 'Â§ïÈôΩÂ•ΩÁ?...', mood: 'romantic' }
        ]
    },
    library: {
        name: '?ñÊõ∏È§?,
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
            { text: '?ôË£°Â•ΩÂ??úÔ?ÂæàÈÅ©?àÁ???, mood: 'peaceful' },
            { text: '‰Ω†Â?Ê≠°Á?‰ªÄÈ∫ºÈ??ãÁ???', mood: 'curious' },
            { text: '?ΩÂ?‰Ω†‰?Ëµ∑Â∫¶?éÈÄôÊÆµ?ÇÂ??üÂ•Ω', mood: 'content' }
        ]
    }
};

// ==================== ?ùÂ???====================
function init() {
    showLoadingScreen();
    
    // ??ÅΩ‰æÜËá™?äÂ§©Á¥ÑÊ??ÄË´ãÁ?Ë®äÊÅØ
    window.addEventListener('message', handleChatInvitationMessage);
    
    // Ê®°Êì¨ËºâÂÖ•?éÁ?
    setTimeout(() => {
        DatingApp.currentChar = loadCharacterFromSettings();
        setupEventListeners();
        renderSceneSelection();
        updateCharInfo();
        hideLoadingScreen();
        
        // Ê™¢Êü•?ØÂê¶ÂæûË?Â§©Á??ÉÈ?Ë´ãÂ???        checkChatInvitationStart();
    }, 2000);
}

// ?ïÁ?‰æÜËá™?äÂ§©?ÑÁ??ÉÈ?Ë´ãË???function handleChatInvitationMessage(event) {
    const data = event.data;
    if (!data || typeof data !== 'object') return;
    
    // Ê™¢Êü•?ØÂê¶?ØÂ??äÂ§©Á¥ÑÊ??ÄË´ãÂ???    if (data.type === 'openApp' && data.appId === 'dating' && data.source === 'chat-invitation') {
        console.log('?∂Âà∞?äÂ§©Á¥ÑÊ??ÄË´ãÂ??ïË?Ê±ÇÔ??¥ÊôØÔº?, data.scene);
        
        // ?≤Â?Ë¶ÅËá™?ïÂ??ïÁ??¥ÊôØ
        DatingApp.pendingSceneFromChat = data.scene || 'cafe';
    }
}

// Ê™¢Êü•?ØÂê¶?ÄË¶ÅËá™?ïÂ??ïÁ??ÉÔ?ÂæûË?Â§©‰??ÑÔ?
function checkChatInvitationStart() {
    const pendingScene = DatingApp.pendingSceneFromChat;
    if (!pendingScene) return;
    
    console.log('?™Â??üÂ?Á¥ÑÊ?ÔºåÂ†¥?ØÔ?', pendingScene);
    
    // ?óË©¶?¥Êé•?∏Ê?Ë©≤Â†¥?Ø‰∏¶?üÂ?
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
        // Âª∂ÈÅ≤‰∏ÄÈªûË? UI ÂÆåÂÖ®ËºâÂÖ•
        setTimeout(() => {
            // ?™Â??∏Ê??¥ÊôØ?°Á?
            const sceneCards = document.querySelectorAll('.scene-card');
            if (sceneCards[sceneIndex]) {
                // ?¥Êé•Ëß∏Áôº?¥ÊôØ?∏Ê??ÑÊ?‰∫ã‰ª∂
                const card = sceneCards[sceneIndex];
                card.click();
                
                // Âª∂ÈÅ≤ÂæåËá™?ïÁ¢∫Ë™çÁ??ÉË®≠ÂÆ?                setTimeout(() => {
                    confirmDateSetup();
                }, 500);
            }
        }, 300);
    }
    
    // Ê∏ÖÈô§ÂæÖÂ??ïÁ??¥ÊôØ
    DatingApp.pendingSceneFromChat = null;
}

// ËºâÂÖ•?´Èù¢
function showLoadingScreen() {
    const loading = document.getElementById('dating-loading');
    const loadingBar = document.getElementById('loading-bar');
    const loadingText = document.getElementById('loading-text');
    const loadingTips = document.getElementById('loading-tips');
    
    if (!loading) return;
    
    const tips = [
        'Â∞èÊ?Á§∫Ô??†Ë?ËßíËâ≤?âE?µÂèØ‰ª•‰???,
        'Â∞èÊ?Á§∫Ô??∏Ê?‰∏çÂ??ÑÂ?Ë©±ÈÅ∏?ÖÊ?ÂΩ±ÈüøÂ•ΩÊ?Â∫?,
        'Â∞èÊ?Á§∫Ô??Ø‰ª•‰ΩøÁî®?¥ÊôØÁ∑®ËºØ?®ÂâµÂª∫Ëá™Â∑±Á?Á¥ÑÊ??¥ÊôØ',
        'Â∞èÊ?Á§∫Ô??âESC?Ø‰ª•ËøîÂ??¥ÊôØ?∏Ê?',
        'Â∞èÊ?Á§∫Ô?Ê≠?ù¢?ûÊ??ΩÁç≤ÂæóÊõ¥Â§öÂ•Ω?üÂ∫¶'
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
            if (progress < 30) loadingText.textContent = 'ËºâÂÖ•ËßíËâ≤Ë≥áÊ?...';
            else if (progress < 60) loadingText.textContent = 'Ê∫ñÂ??¥ÊôØ...';
            else if (progress < 90) loadingText.textContent = '?ùÂ??ñÁ≥ªÁµ?..';
            else loadingText.textContent = 'Ê∫ñÂ?ÂÆåÊ?Ôº?;
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

// Ë™™Ê??¢Êùø?áÊ?
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

// ==================== ?ÇÈ?Á≥ªÁµ± ====================
let timeInterval = null;

function startTimeSystem() {
    if (timeInterval) clearInterval(timeInterval);
    
    timeInterval = setInterval(() => {
        if (DatingApp.timeSystem.isPaused) return;
        
        // Â¢ûÂ??ÜÈ?
        DatingApp.timeSystem.currentMinute += DatingApp.timeSystem.timeSpeed;
        
        // ?ïÁ?Â∞èÊ??≤‰?
        if (DatingApp.timeSystem.currentMinute >= 60) {
            DatingApp.timeSystem.currentHour += Math.floor(DatingApp.timeSystem.currentMinute / 60);
            DatingApp.timeSystem.currentMinute = DatingApp.timeSystem.currentMinute % 60;
        }
        
        // ?ïÁ?Â§©Êï∏?≤‰?
        if (DatingApp.timeSystem.currentHour >= 24) {
            DatingApp.timeSystem.currentDay += Math.floor(DatingApp.timeSystem.currentHour / 24);
            DatingApp.timeSystem.currentHour = DatingApp.timeSystem.currentHour % 24;
        }
        
        // Ê™¢Êü•?ØÂê¶ÁµêÊ?
        if (DatingApp.timeSystem.currentDay > DatingApp.timeSystem.totalDays) {
            endDateByTime();
            return;
        }
        
        updateTimeDisplay();
    }, 1000); // ÊØèÁ??¥Êñ∞
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
    
    display.textContent = `Á¨?{currentDay}Â§?${hourStr}:${minuteStr}`;
}

function endDateByTime() {
    stopTimeSystem();
    alert(`Á¥ÑÊ??ÇÈ?ÁµêÊ?ÔºÅÂÖ±Â∫¶È?‰∫?{DatingApp.timeSystem.totalDays}Â§©Á?Â•ΩÊ??â„ÄÇ`);
    endDate();
}

// ?ÇÈ?Ë®≠Â??∏È??ΩÊï∏
function openTimeSettings() {
    const modal = document.getElementById('time-settings-modal');
    if (modal) {
        modal.classList.remove('hidden');
        
        // ?¥Êñ∞Ëº∏ÂÖ•Ê°ÜÁ???        document.getElementById('current-day-input').value = DatingApp.timeSystem.currentDay;
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
        alert(`Â∑≤Ë®≠ÂÆöÁÇ∫${days}Â§©`);
    } else {
        alert('Ë´ãËº∏??-365‰πãÈ??ÑÂ§©??);
    }
}

function setTimeSpeed(speed, btn) {
    DatingApp.timeSystem.timeSpeed = speed;
    
    // ?¥Êñ∞?âÈ??Ä??    document.querySelectorAll('.speed-btn').forEach(b => {
        b.classList.remove('active');
    });
    if (btn) btn.classList.add('active');
}

function setCustomDays() {
    const input = document.getElementById('custom-days');
    const days = parseInt(input.value);
    
    if (days && days > 0 && days <= 365) {
        DatingApp.timeSystem.totalDays = days;
        alert(`Â∑≤Ë®≠ÂÆöÁÇ∫${days}Â§©`);
    } else {
        alert('Ë´ãËº∏??-365‰πãÈ??ÑÂ§©??);
    }
}

function setTimeSpeed(speed) {
    DatingApp.timeSystem.timeSpeed = speed;
    
    // ?¥Êñ∞?âÈ??Ä??    document.querySelectorAll('.speed-btn').forEach(btn => {
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
        alert('?ÇÈ?Â∑≤Êõ¥??);
    } else {
        alert('Ë´ãËº∏?•Ê??àÁ??ÇÈ?');
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
    alert('?ÇÈ?Â∑≤È?ÁΩ?);
}

// ?®Â??ΩÊï∏
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

// Á¥ÑÊ?Ë®≠Â?ÂΩàÁ?
function openDatingSettings() {
    const modal = document.getElementById('dating-settings-modal');
    if (modal) {
        modal.classList.remove('hidden');
        
        // ?¥Êñ∞?ÇÈ?È°ØÁ§∫
        const timeDisplay = document.getElementById('settings-time-display');
        if (timeDisplay) {
            const { currentDay, currentHour, currentMinute } = DatingApp.timeSystem;
            const hourStr = currentHour.toString().padStart(2, '0');
            const minuteStr = Math.floor(currentMinute).toString().padStart(2, '0');
            timeDisplay.textContent = `Á¨?{currentDay}Â§?${hourStr}:${minuteStr}`;
        }
        
        // Ê™¢Êü• API ?Ä??        checkApiStatus();
        
        if (window.lucide) lucide.createIcons();
    }
}

function closeDatingSettings() {
    const modal = document.getElementById('dating-settings-modal');
    if (modal) modal.classList.add('hidden');
}

function switchSettingsTab(tabName) {
    // ?¥Êñ∞Ê®ôÁ±§?Ä??    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    // ?¥Êñ∞?¢ÊùøÈ°ØÁ§∫
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
window.openSceneEditorFromSettings = openSceneEditorFromSettings;
window.regenerateDialogue = regenerateDialogue;
window.checkApiStatus = checkApiStatus;

async function checkApiStatus() {
    const statusEl = document.getElementById('api-status-value');
    if (!statusEl) return;
    
    const config = getActiveApiConfig();
    if (!config || !config.url || !config.key) {
        statusEl.textContent = '?™È?ÁΩ?;
        statusEl.style.color = '#f87171';
        return false;
    }
    
    statusEl.textContent = 'Â∑≤È?ÁΩ?;
    statusEl.style.color = '#4ade80';
    return true;
}

async function regenerateDialogue() {
    if (!DatingApp.dialogueActive) {
        alert('Ë´ãÂ??áË??≤‰??ïÂ??çÈ??∞Á??êÂ?Ë©?);
        return;
    }
    
    const context = {
        situation: '?çÊñ∞?üÊ?Â∞çË©±',
        scene: DatingApp.currentScene
    };
    
    const dialogue = await generateDynamicDialogue(context);
    DatingApp.currentDialogue = dialogue;
    showDialogueBox(dialogue);
}

// ==================== ?¥ÊôØ?∏Ê?‰ªãÈù¢ ====================
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
        html += '<div class="scene-divider"><span>?™Â?Áæ©Âú∞??/span></div>';
        
        customSceneKeys.forEach(key => {
            const scene = SCENES[key];
            if (!scene) return;
            html += `
                <button class="scene-card custom-scene" onclick="selectScene('${key}')">
                    <i data-lucide="${scene.icon}"></i>
                    <span>${scene.name}</span>
                    ${scene.imported ? '<span class="imported-badge">Â∞éÂÖ•</span>' : ''}
                </button>
            `;
        });
    }
    
    container.innerHTML = html;
    
    if (window.lucide) lucide.createIcons();
}

function selectScene(sceneKey) {
    selectedScene = sceneKey;
    
    // ?±Ë??¥ÊôØ?∏Ê?ÔºåÈ°ØÁ§∫Á??ÉË®≠ÂÆ?    document.getElementById('scene-selection')?.classList.add('hidden');
    document.getElementById('date-setup')?.classList.remove('hidden');
    
    // ËºâÂÖ•ËßíËâ≤?óË°®
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
                <div class="char-card-name">?êË®≠ËßíËâ≤</div>
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
                <div class="char-card-name">${char.name || '?™ÂëΩ??}</div>
            </div>
        `).join('');
    }
    
    if (window.lucide) lucide.createIcons();
}

function selectCharacter(idx) {
    // ?¥Êñ∞?∏‰∏≠?Ä??    document.querySelectorAll('.char-card').forEach((card, i) => {
        card.classList.toggle('selected', i === idx);
    });
    
    // ËºâÂÖ•ËßíËâ≤Ë≥áÊ?
    const chars = JSON.parse(localStorage.getItem('sx_characters') || '[]');
    if (idx >= 0 && idx < chars.length) {
        DatingApp.currentChar = chars[idx];
    } else {
        DatingApp.currentChar = loadCharacterFromSettings();
    }
}

// ==================== Á¥ÑÊ?Ë®≠Â? ====================
function selectDays(days) {
    DatingApp.timeSystem.totalDays = days;
    
    // ?¥Êñ∞?âÈ??Ä??    document.querySelectorAll('.date-setup .day-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

function selectCustomDays() {
    const input = document.getElementById('setup-custom-days');
    const days = parseInt(input.value);
    
    if (days && days > 0 && days <= 365) {
        DatingApp.timeSystem.totalDays = days;
        
        // ÁßªÈô§?∂‰??âÈ??Ñactive?Ä??        document.querySelectorAll('.date-setup .day-btn').forEach(btn => {
            btn.classList.remove('active');
        });
    } else {
        alert('Ë´ãËº∏??-365‰πãÈ??ÑÂ§©??);
    }
}

function selectSpeed(speed) {
    DatingApp.timeSystem.timeSpeed = speed;
    
    // ?¥Êñ∞?âÈ??Ä??    document.querySelectorAll('.date-setup .speed-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

function cancelDateSetup() {
    // ËøîÂ??¥ÊôØ?∏Ê?
    document.getElementById('date-setup')?.classList.add('hidden');
    document.getElementById('scene-selection')?.classList.remove('hidden');
    selectedScene = null;
}

function confirmDateSetup() {
    if (!selectedScene) {
        alert('Ë´ãÈÅ∏?áÂ†¥??);
        return;
    }
    
    if (!DatingApp.currentChar) {
        DatingApp.currentChar = loadCharacterFromSettings();
    }
    
    // ?ãÂ?Á¥ÑÊ?
    startDate();
}

// ==================== ?ãÂ?Á¥ÑÊ? ====================
function startDate() {
    DatingApp.currentScene = selectedScene;
    const scene = SCENES[selectedScene];
    
    // ?±Ë?Ë®≠Â?ÔºåÈ°ØÁ§∫È??≤Áï´??    document.getElementById('date-setup')?.classList.add('hidden');
    document.getElementById('game-container')?.classList.remove('hidden');
    
    // ?çÁΩÆ?´Â?Âø´Â?
    DatingApp.canvas = null;
    DatingApp.ctx = null;
    
    // ?¥Êñ∞ËßíËâ≤Ë≥áË?È°ØÁ§∫
    updateCharInfo();
    
    // ?ùÂ??ñÂ†¥??    resetPositions();
    renderScene(scene);
    startGameLoop();
    
    // ?üÂ??ÇÈ?Á≥ªÁµ±
    startTimeSystem();
    
    // ?üÂ? AI ?ßÂà∂Á≥ªÁµ±
    initAIController();
}

// ==================== AI ?ßÂà∂Á≥ªÁµ± ====================
function initAIController() {
    DatingApp.aiController.enabled = true;
    DatingApp.aiController.greetingShown = false;
    DatingApp.aiController.contextLoaded = false;
    DatingApp.aiController.lastActionTime = Date.now();
    
    // ËºâÂÖ•‰∏ñÁ??∏Â??äÂ§©Á¥Ä??    loadAIContext();
    
    // ?üÂ? AI Ë°åÂ?Âæ™Áí∞
    startAIActionLoop();
}

function loadAIContext() {
    // ËºâÂÖ•‰∏ñÁ??∏Ë???    const categories = ['cot', 'style', 'global', 'keywords', 'backend'];
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
    
    // ËºâÂÖ•?äÂ§©Á¥Ä??    const chatHistory = JSON.parse(localStorage.getItem('sx_chat_history') || '[]');
    DatingApp.aiController.chatHistory = chatHistory.slice(-20); // ?ÄËø?0Ê¢?    
    // ËºâÂÖ•ËßíËâ≤Ë®≠Â?
    const charData = DatingApp.currentChar;
    const userName = localStorage.getItem('sx_user_name') || 'User';
    const userPersonality = localStorage.getItem('sx_user_personality') || '';
    
    DatingApp.aiController.charData = charData;
    DatingApp.aiController.userName = userName;
    DatingApp.aiController.userPersonality = userPersonality;
    
    DatingApp.aiController.contextLoaded = true;
    
    // ?üÊ??ùÂ??èÂÄ?    if (!DatingApp.aiController.greetingShown) {
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
    
    // ÊßãÂª∫‰∏ñÁ??∏ÂÖßÂÆ?    let worldbookContent = '';
    const categories = ['cot', 'style', 'global', 'keywords', 'backend'];
    categories.forEach(cat => {
        const entries = wb[cat] || [];
        if (entries.length > 0) {
            worldbookContent += `\n??{cat}?ë\n`;
            entries.forEach(entry => {
                if (entry.content) {
                    worldbookContent += `${entry.content}\n`;
                }
            });
        }
    });
    
    // ÊßãÂª∫?äÂ§©Á¥Ä?ÑÊ?Ë¶?    let chatSummary = '';
    const history = DatingApp.aiController.chatHistory || [];
    if (history.length > 0) {
        chatSummary = '\n?êÊ?ËøëÂ?Ë©±„Äë\n';
        history.slice(-5).forEach(msg => {
            const role = msg.role === 'user' ? userName : (char?.name || 'ËßíËâ≤');
            chatSummary += `${role}: ${msg.content}\n`;
        });
    }
    
    const basePrompt = `‰Ω†Ê≠£?®ÊâÆÊº?${char?.name || 'ËßíËâ≤'}ÔºåË? ${userName} ??${scene?.name || 'Á¥ÑÊ??¥ÊôØ'} Á¥ÑÊ???
?êË??≤Ë®≠ÂÆö„Ä??çÂ?: ${char?.name || 'ËßíËâ≤'}
?ßÊ†º: ${char?.personality || 'Ê∫´Ê?È´îË≤º'}
?åÊôØ: ${char?.background || ''}
${worldbookContent}
${chatSummary}

?êÂ†¥?Ø„Ä?${scene?.name} - ${getSceneDescription(DatingApp.currentScene)}

?êË??ïÊ??ó„Ä?- ‰Ω†Ë?Ê®°‰ªøËßíËâ≤?ÑË?Ê∞???ßÊ†º
- ?™ÁÑ∂?∞Ë? ${userName} ‰∫íÂ?
- ?Ø‰ª•‰∏ªÂ?Ë™™Ë©±?ÅË??®„ÄÅÊ??öÂá∫?çÊ?
- ‰øùÊ?ËßíËâ≤?Ñ‰??¥ÊÄ?- ?ûÊ?Ë¶ÅÁ∞°?≠Ëá™?∂Ô??èÊó•Â∏∏Â?Ë©±`;

    if (actionType === 'greeting') {
        return basePrompt + `\n\n?æÂú®Á¥ÑÊ??õÈ?ÂßãÔ?Ë´ã‰ª•ËßíËâ≤?ÑË∫´‰ªΩÂ? ${userName} ?ìÊ??ºÔ?Ë°®È??üÂ??ñÈ?ÂøÉÁ?ÂøÉÊ??ÇÂè™?ûË?‰∏Ä?•Ë©±?Ç`;
    } else if (actionType === 'follow') {
        return basePrompt + `\n\n${userName} Ê≠?ú®ÁßªÂ?Ôºå‰?Ê±∫Â?Ë∑üÈö®‰ª?Â•π„ÄÇË?Á∞°Áü≠Ë°®È?‰Ω†Á?Ë°åÂ??ñÊÉ≥Ê≥ï„ÄÇÂè™?ûË?‰∏Ä?•Ë©±?Ç`;
    } else if (actionType === 'react') {
        return basePrompt + `\n\n${userName} ?öÂá∫‰∫ÜÊ??ãË??ïÔ?Ë´ãËá™?∂Âú∞?öÂá∫?çÊ??ÇÂè™?ûË?‰∏Ä?•Ë©±?Ç`;
    } else if (actionType === 'idle') {
        return basePrompt + `\n\n?ÆÂ?Ê≤íÊ??πÂà•?Ñ‰??ÖÁôº?üÔ?Ë´ãËá™?∂Âú∞Ë™™‰??•Ë©±?ñÂ??∫‰??ãÂ??ï‰??ÇÂè™?ûË?‰∏Ä?•Ë©±?Ç`;
    }
    
    return basePrompt;
}

function getSceneDescription(sceneKey) {
    const descriptions = {
        cafe: 'Ê∫´È¶®?ÑÂ??°Âª≥ÔºåÊ??®Ë≥™?∞Êùø?åÊ??åÁ??àÂ?',
        park: 'ÁæéÈ??ÑÂÖ¨?íÔ??âÁ?Ê®π„ÄÅËä±?µÂ???≠•Â∞èÂ?',
        cinema: '?ªÂΩ±?¢Ô?Ê≠?ú®?≠Êîæ?ªÂΩ±',
        restaurant: 'Êµ™Êº´?ÑÈ?Âª≥Ô??âË??≠Â?Á≤æÁ∑ª?ÑË?È£?,
        beach: 'Êµ∑È?ÔºåÊ?Ê≤ôÁ??åÈôΩ??,
        library: 'ÂÆâÈ??ÑÂ??∏È§®ÔºåÈÅ©?à‰?Ëµ∑Èñ±ËÆÄ'
    };
    return descriptions[sceneKey] || 'Á¥ÑÊ??¥Ê?';
}

async function callAIAPI(systemPrompt) {
    const config = getActiveApiConfig();
    if (!config || !config.url || !config.key) {
        console.warn('AI API ?™È?ÁΩÆÔ?‰ΩøÁî®?êË®≠?ûÊ?');
        return null;
    }
    
    const apiType = config.type || 'openai';
    
    // Gemini ?üÁ? API ?ºÂ?
    if (apiType === 'gemini') {
        const model = config.model || 'gemini-1.5-flash';
        const targetUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + config.key;
        
        try {
            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: 'Ë´ãÂ??? }] }],
                    generationConfig: { temperature: 0.8, maxOutputTokens: 100 },
                    systemInstruction: { parts: [{ text: systemPrompt }] }
                })
            });
            
            if (!response.ok) {
                console.warn('Gemini API ?ûÊ?Â§±Ê?:', response.status);
                return null;
            }
            
            const data = await response.json();
            if (data.error) {
                console.warn('Gemini API ?ØË™§:', data.error);
                return null;
            }
            return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
        } catch (e) {
            console.warn('Gemini API Ë™øÁî®Â§±Ê?:', e);
            return null;
        }
    }
    
    // OpenAI ?∏ÂÆπ?ºÂ??ñËá™Ë®ÇÁ´ØÈª?    let targetUrl;
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
                    { role: 'user', content: 'Ë´ãÂ??? }
                ],
                max_tokens: 100,
                temperature: 0.8
            })
        });
        
        if (!response.ok) {
            console.warn('AI API ?ûÊ?Â§±Ê?:', response.status);
            return null;
        }
        
        const data = await response.json();
        return data.choices?.[0]?.message?.content || null;
    } catch (e) {
        console.warn('AI API Ë™øÁî®Â§±Ê?:', e);
        return null;
    }
}

async function generateAIGreeting() {
    if (DatingApp.aiController.greetingShown) return;
    
    const systemPrompt = buildAISystemPrompt('greeting');
    const aiResponse = await callAIAPI(systemPrompt);
    
    const greeting = aiResponse || getDefaultGreeting();
    
    // È°ØÁ§∫?èÂÄôÂ?Ë©?    showAIDialogue(greeting);
    DatingApp.aiController.greetingShown = true;
}

function getDefaultGreeting() {
    const char = DatingApp.currentChar;
    const scene = SCENES[DatingApp.currentScene];
    const greetings = [
        `‰ªäÂ§©?ΩÂ?‰Ω†‰?Ëµ∑‰?${scene?.name || '?ôË£°'}ÔºåÊ?ÂæàÈ?ÂøÉÂë¢ÔºÅ`,
        `ÁµÇÊñºÁ≠âÂà∞?ô‰?Â§©‰?Ôº?{char?.name || '??}Â•ΩÊ?ÂæÖÔ?`,
        `?å‰??®‰?Ëµ∑Á??ÇÈ?ÔºåÁ∏Ω?ØÁâπ?•Á?Â•Ω„ÄÇ`,
        `?ôË£°?ÑÊ∞£Ê∞õÁ?Â•ΩÔ?Ë¨ùË?‰Ω†Á??ëÂá∫‰æÜÔ?`
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
}

function showAIDialogue(text) {
    const box = document.getElementById('ai-dialogue-box');
    if (!box) {
        // ?ïÊ??µÂª∫ AI Â∞çË©±Ê°?        createAIDialogueBox();
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
                <div class="ai-dialogue-name">${DatingApp.currentChar.name || 'ËßíËâ≤'}</div>
                <div class="ai-dialogue-text">${text}</div>
            </div>
        `;
        
        if (window.lucide) lucide.createIcons();
        
        // 3ÁßíÂ??™Â??±Ë?
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
        
        // Ê™¢Êü•?©ÂÆ∂?áË??≤Á?Ë∑ùÈõ¢
        const distance = Math.sqrt(
            Math.pow(DatingApp.player.x - DatingApp.char.x, 2) +
            Math.pow(DatingApp.player.y - DatingApp.char.y, 2)
        );
        
        // ?πÊ??ÖÊ?Ê±∫Â?Ë°åÂ?
        if (distance > 150) {
            // ?©ÂÆ∂Ëµ∞È?‰∫ÜÔ?ËßíËâ≤Ë∑üÈö®
            moveCharTowardsPlayer();
        } else if (distance < 60 && Math.random() > 0.7) {
            // ?†Ë??ÇÔ??âÊ??á‰∏ª?ïË™™Ë©?            generateAIIdleAction();
        } else if (Math.random() > 0.85) {
            // ?®Ê??íÁΩÆË°åÂ?
            generateAIIdleAction();
        }
    }, 1000);
}

function moveCharTowardsPlayer() {
    const dx = DatingApp.player.x - DatingApp.char.x;
    const dy = DatingApp.player.y - DatingApp.char.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 100) {
        // ÁßªÂ?ËßíËâ≤?ùÂ??©ÂÆ∂
        const speed = 3;
        const ratio = speed / distance;
        
        const newX = DatingApp.char.x + dx * ratio;
        const newY = DatingApp.char.y + dy * ratio;
        
        // ?äÁ?Ê™¢Êü•
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

// ==================== AI ?ïÊ?Â∞çË©±?üÊ? ====================
async function generateDynamicDialogue(context = {}) {
    const config = getActiveApiConfig();
    if (!config || !config.url || !config.key) {
        console.warn('AI API ?™È?ÁΩÆÔ?‰ΩøÁî®?êË®≠Â∞çË©±');
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
                    { role: 'user', content: 'Ë´ãÁ??êÂ?Ë©±Â??? }
                ],
                max_tokens: 500,
                temperature: 0.85
            })
        });
        
        if (!response.ok) {
            console.warn('AI API ?ûÊ?Â§±Ê?:', response.status);
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
            console.warn('Ëß?? AI ?ûÊ?Â§±Ê?:', parseError);
        }
        
        return {
            dialogue: content,
            mood: 'neutral',
            choices: [
                { text: '?ëÂ???, affection: 5 },
                { text: '?ØÂóØ', affection: 2 },
                { text: '?ØÂ?Ôº?, affection: -1 }
            ]
        };
    } catch (e) {
        console.warn('AI API Ë™øÁî®Â§±Ê?:', e);
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
            worldbookContent += `\n??{cat}?ë\n`;
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
        chatSummary = '\n?êÊ?ËøëÂ?Ë©±Á??Ñ„Äë\n';
        history.slice(-5).forEach(msg => {
            chatSummary += `${msg.speaker}: ${msg.text}\n`;
        });
    }
    
    const timeInfo = DatingApp.timeSystem;
    const timeStr = `Á¨?{timeInfo.currentDay}Â§?${timeInfo.currentHour.toString().padStart(2, '0')}:${Math.floor(timeInfo.currentMinute).toString().padStart(2, '0')}`;
    
    return `‰Ω†Ê≠£?®ÊâÆÊº?${char?.name || 'ËßíËâ≤'}ÔºåË? ${userName} ??${scene?.name || 'Á¥ÑÊ??¥ÊôØ'} Á¥ÑÊ???
?êË??≤Ë®≠ÂÆö„Ä??çÂ?: ${char?.name || 'ËßíËâ≤'}
?ßÊ†º: ${char?.personality || 'Ê∫´Ê?È´îË≤º'}
?åÊôØ: ${char?.background || ''}

?êÁî®?∂Ë®≠ÂÆö„Ä??çÂ?: ${userName}
?ßÊ†º: ${userPersonality || '?ãÊ??ãÂ?'}
?åÊôØ: ${userBackground || ''}

?êÂ†¥?Ø„Ä?${scene?.name} - ${getSceneDescription(DatingApp.currentScene)}
?∂Â??ÇÈ?: ${timeStr}

?ê‰??åÊõ∏Ë≥áÊ???${worldbookContent || '??}
${chatSummary}

?êÊ?Â¢É„Ä?${context.situation || '?•Â∏∏Â∞çË©±'}

?êÂ??âÊ†ºÂºè„Ä?Ë´ã‰ª• JSON ?ºÂ??ûÊ?ÔºåÂ??´Ô?
{
  "dialogue": "ËßíËâ≤Ë™™Á?Ë©±Ô?1-2?•Ô??™ÁÑ∂????ñÔ?",
  "mood": "happy/shy/curious/nervous/romantic/playful/neutral",
  "choices": [
    {"text": "?∏È?‰∏ÄÔºàÊ≠£?¢Â??âÔ?", "affection": 5??5},
    {"text": "?∏È?‰∫åÔ?‰∏≠ÊÄßÂ??âÔ?", "affection": -2??},
    {"text": "?∏È?‰∏âÔ?Ë≤†Èù¢?ñË™ø?ÆÂ??âÔ?", "affection": -10??}
  ]
}

Ê≥®Ê?Ôº?- Â•ΩÊ?Â∫¶Ë??ñÁ???-10 ??+15
- Â∞çË©±Ë¶ÅÁ¨¶?àË??≤ÊÄßÊ†º?åÁï∂?çÊ?Â¢?- ?∏È?Ë¶ÅÊ?Ë∂???âÊ?Áæ?- ?™Â???JSONÔºå‰?Ë¶ÅÂÖ∂‰ªñÊ?Â≠ó`;
}

function getDefaultDialogue(context) {
    const scene = SCENES[DatingApp.currentScene];
    const char = DatingApp.currentChar;
    
    const defaultDialogues = [
        {
            dialogue: `?å‰??®‰?Ëµ?{scene?.name || '?ôË£°'}?üË¶∫?üÂ•Ω??..`,
            mood: 'happy',
            choices: [
                { text: '?ë‰??ôÈ∫ºË¶∫Â?Ôº?, affection: 10 },
                { text: '?ØÂ?ÔºåÂ??ãÂ?', affection: 5 },
                { text: '?ÑÂ•Ω??, affection: 0 }
            ]
        },
        {
            dialogue: `‰ªäÂ§©?ÑÂ§©Ê∞??‰∏çÈåØÔºåÂ??©Â?Á¥ÑÊ??¢Ô?`,
            mood: 'cheerful',
            choices: [
                { text: 'Â∞çÂ?ÔºåÂ??íÊ?Ôº?, affection: 8 },
                { text: '?ØÔ??Ñ‰???, affection: 3 },
                { text: '?ëË¶∫ÂæóÂ§™?±‰?...', affection: -3 }
            ]
        },
        {
            dialogue: `${char?.name || '??}ÂæàÁ??úÂ?‰Ω†Âú®‰∏ÄËµ∑Á??ÇÂ??Ç`,
            mood: 'romantic',
            choices: [
                { text: '?ë‰??ØÔ?ÂæàÂπ∏Á¶?, affection: 12 },
                { text: 'Ë¨ùË?‰Ω†ÈÄôÈ∫ºË™?, affection: 6 },
                { text: '?àÂ?ÔºåÁ??ÑÂ?Ôº?, affection: 2 }
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

// ?∂Áé©ÂÆ∂Áßª?ïÊ?ÔºåAI ?ØËÉΩ?öÂá∫?çÊ?
function onPlayerMove() {
    if (!DatingApp.aiController.enabled) return;
    
    // ?âÊ??áË?ËßíËâ≤Ë∑üÈö®?ñË™™Ë©?    if (Math.random() > 0.8) {
        moveCharTowardsPlayer();
    }
}

// ==================== ?¥ÊôØÊ∏≤Ê? ====================
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
    
    // Ê∏ÖÁ©∫?´Â?
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // ‰ΩøÁî®Âø´Â??ÑÂ†¥?ØÂ???    if (typeof SceneRenderer !== 'undefined') {
        // Ê™¢Êü•Âø´Â?
        if (!DatingApp.sceneCache[DatingApp.currentScene]) {
            // ?üÊ?‰∏¶Âø´?ñÂ†¥??            const bgImage = new Image();
            bgImage.src = SceneRenderer.generateBackground(DatingApp.currentScene);
            DatingApp.sceneCache[DatingApp.currentScene] = bgImage;
            
            bgImage.onload = () => {
                renderSceneContent(ctx, canvas, scene);
            };
        } else {
            // ‰ΩøÁî®Âø´Â??ÑÂ???            renderSceneContent(ctx, canvas, scene);
        }
    } else {
        // ?ôÁî®?πÊ?
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
        
        drawCharacter(ctx, DatingApp.player, '#4A90E2', '‰Ω?);
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
    
    drawCharacter(ctx, DatingApp.player, '#4A90E2', '‰Ω?);
    drawCharacter(ctx, DatingApp.char, '#E91E63', DatingApp.currentChar.name);
}

function renderSceneFallback(ctx, canvas, scene) {
    // ?ôÁî®?πÊ?Ôºö‰Ωø?®Êº∏Â±§Ë???    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#228B22');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Á∞°ÂñÆÁπ™Ë£Ω?©‰ª∂
    scene.objects.forEach(obj => {
        ctx.fillStyle = 'rgba(139, 69, 19, 0.7)';
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
    });
    
    drawCharacter(ctx, DatingApp.player, '#4A90E2', '‰Ω?);
    drawCharacter(ctx, DatingApp.char, '#E91E63', DatingApp.currentChar.name);
}

function drawCharacter(ctx, char, color, label) {
    if (DatingApp.charSprite && label === DatingApp.currentChar?.name) {
        drawPixelCharacter(ctx, char, DatingApp.charSprite, label);
    } else if (label === '‰Ω? && DatingApp.playerSprite) {
        drawPixelCharacter(ctx, char, DatingApp.playerSprite, label);
    } else {
        drawFallbackCharacter(ctx, char, color, label);
    }
}

function drawPixelCharacter(ctx, charPos, sprite, label) {
    const spriteCanvas = createSpriteCanvas(32);
    renderSprite(sprite, spriteCanvas, 32);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(charPos.x, charPos.y + 5, 18, 8, 0, 0, Math.PI * 2);
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
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(char.x, char.y + 5, 18, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(char.x, char.y, 16, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(char.x - 5, char.y - 3, 3, 0, Math.PI * 2);
    ctx.arc(char.x + 5, char.y - 3, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 3;
    ctx.strokeText(label, char.x, char.y - 25);
    ctx.fillText(label, char.x, char.y - 25);
}

// ==================== ËßíËâ≤ÁßªÂ? ====================
function movePlayer(dx, dy) {
    if (DatingApp.dialogueActive) return;
    
    const newX = DatingApp.player.x + dx * 5;
    const newY = DatingApp.player.y + dy * 5;
    
    // ?äÁ?Ê™¢Êü•
    if (newX >= 20 && newX <= 680 && newY >= 20 && newY <= 480) {
        DatingApp.player.x = newX;
        DatingApp.player.y = newY;
        
        // Ê™¢Êü•?ØÂê¶?•Ë?ËßíËâ≤
        checkInteraction();
        
        // AI ËßíËâ≤?ØËÉΩ?öÂá∫?çÊ?
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
        prompt.textContent = '??E ‰∫íÂ?';
    }
}

// ==================== Â∞çË©±Á≥ªÁµ± ====================
async function startDialogue() {
    const scene = SCENES[DatingApp.currentScene];
    
    DatingApp.dialogueActive = true;
    
    // ‰ΩøÁî® AI ?üÊ??ïÊ?Â∞çË©±
    const context = {
        situation: `${scene?.name || 'Á¥ÑÊ??¥Ê?'}?ÑÊó•Â∏∏Â?Ë©±`,
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
        happy: '??',
        shy: '?ò≥',
        curious: '??',
        nervous: '?ò∞',
        romantic: '??',
        playful: '??',
        neutral: '??',
        cheerful: '??'
    };
    
    const emoji = moodEmoji[dialogue.mood] || '??';
    
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
                <button onclick="respondToDialogue(0, 5)">?§Ô? ?ë‰??ôÈ∫ºË¶∫Â?</button>
                <button onclick="respondToDialogue(1, 2)">?? ?ØÂ?</button>
                <button onclick="respondToDialogue(2, -1)">?? ?üÁ???</button>
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
    
    recordDialogue(DatingApp.currentChar?.name || 'ËßíËâ≤', dialogue?.dialogue || '', choiceText);
    recordDialogue('‰Ω?, choiceText, null);
    
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

// ==================== ?äÊà≤Âæ™Áí∞ ====================
let gameLoopId = null;

function startGameLoop() {
    // ?úÊ≠¢‰πãÂ??ÑÂæ™??    if (gameLoopId) {
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

// ==================== ‰∫ã‰ª∂??ÅΩ ====================
function setupEventListeners() {
    // ?µÁõ§?ßÂà∂
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
    
    // Ëß∏Êéß?ßÂà∂
    setupTouchControls();
}

function setupTouchControls() {
    const controls = document.getElementById('touch-controls');
    if (!controls) return;
    
    controls.innerHTML = `
        <button class="control-btn" data-dir="up">??/button>
        <button class="control-btn" data-dir="down">??/button>
        <button class="control-btn" data-dir="left">??/button>
        <button class="control-btn" data-dir="right">??/button>
        <button class="control-btn interact" onclick="startDialogue()">?í¨</button>
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

// ==================== ËºîÂä©?ΩÊï∏ ====================
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
        const hearts = '?§Ô?'.repeat(Math.min(5, Math.floor(DatingApp.affection / 10)));
        display.textContent = `Â•ΩÊ?Â∫? ${hearts} (${DatingApp.affection})`;
    }
}

function endDate() {
    if (confirm('Á¢∫Â?Ë¶ÅÁ??üÁ??ÉÂ??')) {
        stopGameLoop();
        stopTimeSystem();
        document.getElementById('game-container')?.classList.add('hidden');
        document.getElementById('scene-selection')?.classList.remove('hidden');
        DatingApp.currentScene = 'home';
        selectedScene = null;
        // Ê∏ÖÁ©∫Âø´Â?
        DatingApp.sceneCache = {};
        // ?çÁΩÆ?ÇÈ?
        DatingApp.timeSystem.currentDay = 1;
        DatingApp.timeSystem.currentHour = 9;
        DatingApp.timeSystem.currentMinute = 0;
        DatingApp.timeSystem.isPaused = false;
        DatingApp.timeSystem.totalDays = 3;
        DatingApp.timeSystem.timeSpeed = 1;
    }
}

// ==================== ?®Â??ΩÊï∏ ====================
window.startDate = startDate;
window.respondToDialogue = respondToDialogue;
window.endDate = endDate;

// ?¥ÊôØÁ∑®ËºØ??function openSceneEditor() {
    window.location.href = 'scene-editor.html';
}

window.openSceneEditor = openSceneEditor;

// ËºâÂÖ•?™Ë??¥ÊôØ
function loadCustomScenes() {
    const customScenes = JSON.parse(localStorage.getItem('sx_dating_custom_scenes') || '[]');
    customScenes.forEach(scene => {
        const sceneKey = `custom_${scene.name.replace(/\s+/g, '_')}`;
        SCENES[sceneKey] = {
            name: scene.name,
            icon: 'map',
            background: '#ffffff',
            objects: [],
            dialogues: [
                { text: '?ôÂÄãÂ†¥?ØÁ??πÂà•', mood: 'curious' },
                { text: '‰Ω†Ë®≠Ë®àÁ??¥ÊôØÂæàÊ?', mood: 'happy' }
            ],
            custom: true,
            data: scene
        };
    });
    
    const customMaps = JSON.parse(localStorage.getItem('sx_dating_custom_maps') || '[]');
    customMaps.forEach(map => {
        const sceneKey = `imported_${map.name.replace(/\s+/g, '_')}_${map.importedAt || Date.now()}`;
        SCENES[sceneKey] = {
            name: map.name,
            icon: 'map-pin',
            background: map.backgroundColor || '#2a2a4a',
            objects: map.objects || [],
            dialogues: [
                { text: `Ê≠°Ë?‰æÜÂà∞${map.name}ÔºÅ`, mood: 'happy' },
                { text: '?ôÂÄãÂú∞?πÁ?‰∏çÈåØ??, mood: 'curious' }
            ],
            custom: true,
            imported: true,
            data: map
        };
    });
}

// Ê™¢Êü•Ê∏¨Ë©¶?¥ÊôØ
function checkTestScene() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('testScene') === 'true') {
        const testSceneData = localStorage.getItem('sx_test_scene');
        if (testSceneData) {
            try {
                const data = JSON.parse(testSceneData);
                const testScene = {
                    name: 'Ê∏¨Ë©¶?¥ÊôØ',
                    icon: 'play',
                    background: '#2a2a4a',
                    objects: [],
                    dialogues: [
                        { text: '?ôÊòØÊ∏¨Ë©¶?¥ÊôØ', mood: 'neutral' }
                    ],
                    custom: true,
                    data: data
                };
                
                SCENES['test'] = testScene;
                selectedScene = 'test';
                
                setTimeout(() => {
                    confirmDateSetup();
                }, 500);
            } catch (e) {
                console.error('ËºâÂÖ•Ê∏¨Ë©¶?¥ÊôØÂ§±Ê?:', e);
            }
        }
    }
}

// ?ùÂ???if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        loadCustomScenes();
        checkTestScene();
        init();
        setupImportDropZone();
        renderImportedMapsList();
    });
} else {
    loadCustomScenes();
    checkTestScene();
    init();
    setupImportDropZone();
    renderImportedMapsList();
}

// ==================== ?™Â?Áæ©Âú∞?ñÂ??•Â???====================
let pendingMapData = null;

function openImportModal() {
    const modal = document.getElementById('import-modal');
    if (modal) {
        modal.classList.remove('hidden');
        if (window.lucide) lucide.createIcons();
    }
}

function closeImportModal() {
    const modal = document.getElementById('import-modal');
    if (modal) modal.classList.add('hidden');
    
    pendingMapData = null;
    
    const preview = document.getElementById('import-preview');
    const error = document.getElementById('import-error');
    const jsonInput = document.getElementById('map-json-input');
    const nameInput = document.getElementById('import-map-name');
    
    if (preview) preview.classList.add('hidden');
    if (error) error.classList.add('hidden');
    if (jsonInput) jsonInput.value = '';
    if (nameInput) nameInput.value = '';
}

function switchImportTab(tabName) {
    document.querySelectorAll('.import-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    document.querySelectorAll('.import-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    const targetPanel = document.getElementById(`import-${tabName}-panel`);
    if (targetPanel) targetPanel.classList.add('active');
    
    if (window.lucide) lucide.createIcons();
}

function setupImportDropZone() {
    const dropZone = document.getElementById('file-drop-zone');
    if (!dropZone) return;
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleMapFile(files[0]);
        }
    });
}

function handleMapFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        handleMapFile(file);
    }
}

function handleMapFile(file) {
    if (!file.name.endsWith('.json')) {
        showImportError('Ë´ãÈÅ∏??JSON ?ºÂ??ÑÊ?‰ª?);
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            validateAndPreviewMap(data, file.name.replace('.json', ''));
        } catch (err) {
            showImportError('JSON Ëß??Â§±Ê?Ôº? + err.message);
        }
    };
    reader.onerror = () => {
        showImportError('?á‰ª∂ËÆÄ?ñÂ§±??);
    };
    reader.readAsText(file);
}

function parseMapJson() {
    const input = document.getElementById('map-json-input');
    if (!input || !input.value.trim()) {
        showImportError('Ë´ãËº∏??JSON ?∏Ê?');
        return;
    }
    
    try {
        const data = JSON.parse(input.value);
        validateAndPreviewMap(data, '?™Â?Áæ©Âú∞??);
    } catch (err) {
        showImportError('JSON Ëß??Â§±Ê?Ôº? + err.message);
    }
}

function validateAndPreviewMap(data, defaultName) {
    const error = document.getElementById('import-error');
    const preview = document.getElementById('import-preview');
    const previewInfo = document.getElementById('preview-info');
    const nameInput = document.getElementById('import-map-name');
    
    if (!data.name && !data.tileData && !data.layers) {
        showImportError('?°Ê??ÑÂú∞?ñÊï∏?öÊ†ºÂº?);
        return;
    }
    
    pendingMapData = data;
    
    if (error) error.classList.add('hidden');
    if (preview) preview.classList.remove('hidden');
    
    const mapName = data.name || defaultName;
    if (nameInput) nameInput.value = mapName;
    
    const tileSize = data.tileSize || 32;
    const layerCount = data.layers ? data.layers.length : (data.tileData ? 1 : 0);
    const objectCount = data.objects ? data.objects.length : 0;
    
    if (previewInfo) {
        previewInfo.innerHTML = `
            <div class="preview-item">
                <span class="preview-label">?∞Â??çÁ®±Ôº?/span>
                <span class="preview-value">${mapName}</span>
            </div>
            <div class="preview-item">
                <span class="preview-label">?ºÂ?Â§ßÂ?Ôº?/span>
                <span class="preview-value">${tileSize}px</span>
            </div>
            <div class="preview-item">
                <span class="preview-label">?ñÂ±§?∏È?Ôº?/span>
                <span class="preview-value">${layerCount}</span>
            </div>
            <div class="preview-item">
                <span class="preview-label">?©‰ª∂?∏È?Ôº?/span>
                <span class="preview-value">${objectCount}</span>
            </div>
        `;
    }
    
    if (window.lucide) lucide.createIcons();
}

function showImportError(message) {
    const error = document.getElementById('import-error');
    const errorMsg = document.getElementById('import-error-msg');
    const preview = document.getElementById('import-preview');
    
    if (preview) preview.classList.add('hidden');
    if (error) error.classList.remove('hidden');
    if (errorMsg) errorMsg.textContent = message;
    
    if (window.lucide) lucide.createIcons();
}

function confirmMapImport() {
    if (!pendingMapData) {
        showImportError('Ê≤íÊ?ÂæÖÂ??•Á??∞Â??∏Ê?');
        return;
    }
    
    const nameInput = document.getElementById('import-map-name');
    const mapName = (nameInput && nameInput.value.trim()) || pendingMapData.name || '?™ÂëΩ?çÂú∞??;
    
    pendingMapData.name = mapName;
    pendingMapData.importedAt = Date.now();
    
    const customMaps = JSON.parse(localStorage.getItem('sx_dating_custom_maps') || '[]');
    
    const existingIndex = customMaps.findIndex(m => m.name === mapName);
    if (existingIndex >= 0) {
        if (!confirm(`?∞Â???{mapName}?çÂ∑≤Â≠òÂú®ÔºåÊòØ?¶Ë??ãÔ?`)) {
            return;
        }
        customMaps[existingIndex] = pendingMapData;
    } else {
        customMaps.push(pendingMapData);
    }
    
    localStorage.setItem('sx_dating_custom_maps', JSON.stringify(customMaps));
    
    loadCustomScenes();
    renderImportedMapsList();
    renderSceneSelection();
    
    closeImportModal();
    
    alert(`?∞Â???{mapName}?çÂ??•Ê??üÔ?`);
}

function renderImportedMapsList() {
    const container = document.getElementById('imported-maps');
    if (!container) return;
    
    const customMaps = JSON.parse(localStorage.getItem('sx_dating_custom_maps') || '[]');
    
    if (customMaps.length === 0) {
        container.innerHTML = '<p class="no-maps">Â∞öÊú™Â∞éÂÖ•‰ªª‰??™Â?Áæ©Âú∞??/p>';
        return;
    }
    
    container.innerHTML = `
        <h4>Â∑≤Â??•Á??∞Â? (${customMaps.length})</h4>
        <div class="imported-maps-list">
            ${customMaps.map((map, idx) => `
                <div class="imported-map-item" data-map-index="${idx}">
                    <div class="imported-map-info">
                        <i data-lucide="map"></i>
                        <span class="imported-map-name">${map.name}</span>
                    </div>
                    <div class="imported-map-actions">
                        <button class="imported-map-btn delete" onclick="deleteImportedMap(${idx})" title="?™Èô§">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    if (window.lucide) lucide.createIcons();
}

function deleteImportedMap(index) {
    const customMaps = JSON.parse(localStorage.getItem('sx_dating_custom_maps') || '[]');
    
    if (index < 0 || index >= customMaps.length) return;
    
    const mapName = customMaps[index].name;
    
    if (confirm(`Á¢∫Â?Ë¶ÅÂà™?§Âú∞?ñ„Ä?{mapName}?çÂ?Ôºü`)) {
        customMaps.splice(index, 1);
        localStorage.setItem('sx_dating_custom_maps', JSON.stringify(customMaps));
        
        loadCustomScenes();
        renderImportedMapsList();
        renderSceneSelection();
    }
}

window.openImportModal = openImportModal;
window.closeImportModal = closeImportModal;
window.switchImportTab = switchImportTab;
window.handleMapFileSelect = handleMapFileSelect;
window.parseMapJson = parseMapJson;
window.confirmMapImport = confirmMapImport;
window.deleteImportedMap = deleteImportedMap;
