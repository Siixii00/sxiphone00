console.log('Scene Editor loaded');

const EditorState = {
    canvas: null,
    ctx: null,
    currentTool: 'pen',
    selectedAsset: null,
    selectedObject: null,
    layers: [
        { id: 1, name: '背景層', visible: true, opacity: 1, objects: [], tileData: null },
        { id: 2, name: '物件層', visible: true, opacity: 1, objects: [], tileData: null },
        { id: 3, name: '角色層', visible: true, opacity: 1, objects: [], tileData: null }
    ],
    activeLayer: 2,
    zoom: 1,
    assets: { backgrounds: [], objects: [], sprites: [] },
    tilesets: [],
    selectedTiles: [],
    tileSize: 32,
    mapWidth: 25,
    mapHeight: 19,
    showGrid: true,
    history: [],
    historyIndex: -1,
    animatedTiles: {},
    flipX: false,
    flipY: false
};

function init() {
    EditorState.canvas = document.getElementById('scene-canvas');
    if (!EditorState.canvas) return;
    EditorState.ctx = EditorState.canvas.getContext('2d');
    
    EditorState.canvas.width = EditorState.mapWidth * EditorState.tileSize;
    EditorState.canvas.height = EditorState.mapHeight * EditorState.tileSize;
    
    setupEventListeners();
    loadBuiltinAssets();
    initTilesetPanel();
    renderLayers();
    updateLayerMoveStatus();
    renderCanvas();
    updateTileSizeDisplay();
    
    if (window.lucide) lucide.createIcons();
}

function initTilesetPanel() {
    const container = document.getElementById('tileset-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="tileset-controls">
            <select id="tile-size-select" onchange="setTileSize(this.value)">
                <option value="16">16px</option>
                <option value="32" selected>32px</option>
                <option value="64">64px</option>
            </select>
            <button class="tileset-btn" onclick="loadExternalTileset()">
                <i data-lucide="upload"></i> 載入 Tileset
            </button>
        </div>
        <div class="tileset-preview" id="tileset-preview"></div>
        <div class="tileset-info" id="tileset-info">尚未載入 tileset</div>
    `;
    
    if (window.lucide) lucide.createIcons();
}

function setTileSize(size) {
    EditorState.tileSize = parseInt(size);
    EditorState.canvas.width = EditorState.mapWidth * EditorState.tileSize;
    EditorState.canvas.height = EditorState.mapHeight * EditorState.tileSize;
    updateTileSizeDisplay();
    renderCanvas();
}

function updateTileSizeDisplay() {
    const display = document.getElementById('tile-size-display');
    if (display) {
        display.textContent = `${EditorState.tileSize}px`;
    }
}

function loadExternalTileset() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                processTilesetImage(img, file.name);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

function processTilesetImage(img, name) {
    const tileSize = EditorState.tileSize;
    const cols = Math.floor(img.width / tileSize);
    const rows = Math.floor(img.height / tileSize);
    
    const tileset = {
        id: Date.now(),
        name: name.replace(/\.[^/.]+$/, ''),
        image: img,
        width: img.width,
        height: img.height,
        cols: cols,
        rows: rows,
        tiles: []
    };
    
    const canvas = document.createElement('canvas');
    canvas.width = tileSize;
    canvas.height = tileSize;
    const ctx = canvas.getContext('2d');
    
    let tileIndex = 0;
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            ctx.clearRect(0, 0, tileSize, tileSize);
            ctx.drawImage(
                img,
                col * tileSize, row * tileSize, tileSize, tileSize,
                0, 0, tileSize, tileSize
            );
            
            if (!isTileEmpty(ctx, tileSize, tileSize)) {
                tileset.tiles.push({
                    index: tileIndex,
                    col: col,
                    row: row,
                    src: canvas.toDataURL('image/png')
                });
            }
            tileIndex++;
        }
    }
    
    EditorState.tilesets.push(tileset);
    renderTilesetPreview(tileset);
    updateTilesetInfo(tileset);
}

function renderTilesetPreview(tileset) {
    const preview = document.getElementById('tileset-preview');
    if (!preview) return;
    
    const tileSize = EditorState.tileSize;
    const displaySize = Math.min(48, tileSize);
    
    preview.innerHTML = tileset.tiles.map((tile, idx) => `
        <div class="tileset-tile ${EditorState.selectedTiles.includes(idx) ? 'selected' : ''}" 
             onclick="selectTile(${tileset.id}, ${idx})"
             data-tileset="${tileset.id}" data-tile="${idx}">
            <img src="${tile.src}" style="width:${displaySize}px;height:${displaySize}px;">
        </div>
    `).join('');
}

function selectTile(tilesetId, tileIndex) {
    const tileset = EditorState.tilesets.find(t => t.id === tilesetId);
    if (!tileset) return;
    
    EditorState.selectedTiles = [{ tilesetId, tileIndex, flipX: EditorState.flipX, flipY: EditorState.flipY }];
    EditorState.selectedAsset = {
        type: 'tile',
        tileset: tileset,
        tile: tileset.tiles[tileIndex]
    };
    
    document.querySelectorAll('.tileset-tile').forEach(el => {
        el.classList.toggle('selected', 
            el.dataset.tileset == tilesetId && el.dataset.tile == tileIndex);
    });
    
    updateAssetPreview(EditorState.selectedAsset, tileIndex, 'Tile');
}

function updateTilesetInfo(tileset) {
    const info = document.getElementById('tileset-info');
    if (!info) return;
    
    info.innerHTML = `
        <strong>${tileset.name}</strong><br>
        ${tileset.cols} x ${tileset.rows} tiles<br>
        ${tileset.tiles.length} 個有效 tiles
    `;
}

function loadBuiltinAssets() {
    if (typeof BuiltinAssets !== 'undefined') {
        const assets = BuiltinAssets.generateAll();
        EditorState.assets.objects = assets.objects || [];
        EditorState.assets.backgrounds = assets.backgrounds || [];
        renderAssetGrid('background-assets', EditorState.assets.backgrounds);
        renderAssetGrid('object-assets', EditorState.assets.objects);
        const container = document.getElementById('builtin-assets');
        if (container) {
            container.innerHTML = EditorState.assets.objects.slice(0, 6).map((a, i) => 
                `<div class="asset-item" onclick="selectBuiltinAsset(${i})">
                    <img src="${a.src}" alt="內建素材 ${i + 1}">
                    <div class="asset-meta">
                        <strong>內建素材 ${i + 1}</strong>
                        <span>${(a.width || 100)} x ${(a.height || 100)}</span>
                    </div>
                </div>`
            ).join('');
        }
    }
    
    loadExternalAssets();
}

function loadExternalAssets() {
    const assetPath = 'assets/';
    const tilesetSources = [
        { file: 'Tilesheet-land-v5.png', category: 'background', name: '陸地地形', tileSize: 32 },
        { file: 'Tilesheet-water.png', category: 'background', name: '水域地形', tileSize: 32 },
        { file: 'Tilesheet_snow.png', category: 'background', name: '雪地地形', tileSize: 32 },
        { file: 'Tilesheets-nature.png', category: 'background', name: '自然地形', tileSize: 32 },
        { file: 'tiles-map.png', category: 'background', name: '地圖素材', tileSize: 32 },
        { file: 'transparent-bg-tiles.png', category: 'background', name: '透明地形', tileSize: 32 },
        { file: 'open_tileset (2).png', category: 'object', name: 'RPG 素材', tileSize: 16 },
        { file: 'Tileset 16 NES Sheet.png', category: 'object', name: 'NES 風格', tileSize: 16 }
    ];

    const singleAssets = [
        { file: 'grass-tile.png', category: 'background', name: '草地1', tileSize: 32 },
        { file: 'grass-tile-2.png', category: 'background', name: '草地2', tileSize: 32 },
        { file: 'grass-tile-3.png', category: 'background', name: '草地3', tileSize: 32 },
        { file: 'tile_dirt.png', category: 'background', name: '泥土', tileSize: 32 },
        { file: 'tile_grass.png', category: 'background', name: '草皮', tileSize: 32 },
        { file: 'tile_pavement.png', category: 'background', name: '鋪面', tileSize: 32 },
        { file: 'house.png', category: 'object', name: '房屋1', tileSize: 64 },
        { file: 'house2.png', category: 'object', name: '房屋2', tileSize: 64 },
        { file: 'house3.png', category: 'object', name: '房屋3', tileSize: 64 },
        { file: 'gate.png', category: 'object', name: '大門', tileSize: 32 },
        { file: 'wall.png', category: 'object', name: '牆壁', tileSize: 32 },
        { file: 'tree.png', category: 'object', name: '樹木1', tileSize: 32 },
        { file: 'tree2.png', category: 'object', name: '樹木2', tileSize: 32 },
        { file: 'trees-and-bushes.png', category: 'object', name: '樹叢', tileSize: 32 },
        { file: 'barel.png', category: 'object', name: '木桶', tileSize: 32 },
        { file: 'crate.png', category: 'object', name: '木箱', tileSize: 32 },
        { file: 'scene.png', category: 'background', name: '完整場景', tileSize: 128 }
    ];

    let pendingTilesets = tilesetSources.length;
    const finishTilesetLoad = () => {
        pendingTilesets -= 1;
        if (pendingTilesets <= 0) {
            renderAssetGrid('background-assets', EditorState.assets.backgrounds);
            renderAssetGrid('object-assets', EditorState.assets.objects);
        }
    };

    tilesetSources.forEach((source) => {
        sliceTilesetToAssets(assetPath + source.file, source, (tiles) => {
            if (source.category === 'background') {
                EditorState.assets.backgrounds.push(...tiles);
            } else {
                EditorState.assets.objects.push(...tiles);
            }
            finishTilesetLoad();
        });
    });

    singleAssets.forEach((asset) => {
        const img = new Image();
        img.onload = function() {
            const assetData = {
                src: assetPath + asset.file,
                width: asset.tileSize,
                height: asset.tileSize,
                name: asset.name,
                category: asset.category
            };

            if (asset.category === 'background') {
                EditorState.assets.backgrounds.push(assetData);
                renderAssetGrid('background-assets', EditorState.assets.backgrounds);
            } else {
                EditorState.assets.objects.push(assetData);
                renderAssetGrid('object-assets', EditorState.assets.objects);
            }
        };
        img.src = assetPath + asset.file;
    });
}

function sliceTilesetToAssets(src, source, onComplete) {
    const img = new Image();
    img.onload = function() {
        const tileSize = source.tileSize;
        const cols = Math.floor(img.width / tileSize);
        const rows = Math.floor(img.height / tileSize);
        const canvas = document.createElement('canvas');
        canvas.width = tileSize;
        canvas.height = tileSize;
        const ctx = canvas.getContext('2d');
        const tiles = [];

        let tileIndex = 0;
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                ctx.clearRect(0, 0, tileSize, tileSize);
                ctx.drawImage(
                    img,
                    col * tileSize,
                    row * tileSize,
                    tileSize,
                    tileSize,
                    0,
                    0,
                    tileSize,
                    tileSize
                );

                if (isTileEmpty(ctx, tileSize, tileSize)) {
                    continue;
                }

                tiles.push({
                    src: canvas.toDataURL('image/png'),
                    width: tileSize,
                    height: tileSize,
                    name: `${source.name}-${tileIndex + 1}`,
                    category: source.category
                });
                tileIndex += 1;
            }
        }

        onComplete(tiles);
    };

    img.onerror = function() {
        console.log(`素材 ${src} 載入失敗`);
        onComplete([]);
    };

    img.src = src;
}

function isTileEmpty(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height).data;
    for (let i = 3; i < imageData.length; i += 4) {
        if (imageData[i] > 10) {
            return false;
        }
    }
    return true;
}

function setupEventListeners() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
            const tab = document.getElementById(`${btn.dataset.tab}-tab`);
            if (tab) tab.classList.remove('hidden');
        });
    });
    
    document.querySelectorAll('.canvas-tool').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.canvas-tool').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            EditorState.currentTool = btn.dataset.tool;
        });
    });
    
    if (EditorState.canvas) {
        EditorState.canvas.addEventListener('mousedown', handleCanvasMouseDown);
        EditorState.canvas.addEventListener('mousemove', handleCanvasMouseMove);
        EditorState.canvas.addEventListener('mouseup', handleCanvasMouseUp);
        EditorState.canvas.addEventListener('mouseleave', handleCanvasMouseUp);
    }
}

let isDrawing = false;

function handleCanvasMouseDown(e) {
    isDrawing = true;
    handleCanvasInteraction(e);
}

function handleCanvasMouseMove(e) {
    if (!isDrawing) return;
    if (EditorState.currentTool !== 'pen' && EditorState.currentTool !== 'erase') return;
    handleCanvasInteraction(e);
}

function handleCanvasMouseUp() {
    if (isDrawing) {
        saveHistory();
    }
    isDrawing = false;
}

function handleCanvasInteraction(e) {
    const rect = EditorState.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const tileSize = EditorState.tileSize;
    const tileX = Math.floor(x / tileSize);
    const tileY = Math.floor(y / tileSize);
    
    const layer = EditorState.layers.find(l => l.id === EditorState.activeLayer);
    if (!layer) return;
    
    if (EditorState.currentTool === 'pen' && EditorState.selectedAsset) {
        if (EditorState.selectedAsset.type === 'tile') {
            placeTile(layer, tileX, tileY, EditorState.selectedAsset);
        } else {
            placeObject(layer, x, y, EditorState.selectedAsset);
        }
    } else if (EditorState.currentTool === 'erase') {
        eraseAtPosition(layer, tileX, tileY, x, y);
    } else if (EditorState.currentTool === 'fill') {
        fillTiles(layer, tileX, tileY, EditorState.selectedAsset);
    } else if (EditorState.currentTool === 'eyedropper') {
        pickTile(layer, tileX, tileY);
    }
    
    renderCanvas();
}

function placeTile(layer, tileX, tileY, asset) {
    if (!layer.tileData) {
        layer.tileData = createEmptyTileData();
    }
    
    if (tileX < 0 || tileX >= EditorState.mapWidth || tileY < 0 || tileY >= EditorState.mapHeight) return;
    
    layer.tileData[tileY][tileX] = {
        tilesetId: asset.tileset.id,
        tileIndex: asset.tile.index,
        flipX: asset.flipX || false,
        flipY: asset.flipY || false
    };
}

function placeObject(layer, x, y, asset) {
    layer.objects.push({
        id: Date.now(),
        src: asset.src,
        x: x - (asset.width || 50) / 2,
        y: y - (asset.height || 50) / 2,
        width: asset.width || 100,
        height: asset.height || 100
    });
}

function eraseAtPosition(layer, tileX, tileY, x, y) {
    if (layer.tileData && layer.tileData[tileY] && layer.tileData[tileY][tileX]) {
        layer.tileData[tileY][tileX] = null;
    }
    
    const tileSize = EditorState.tileSize;
    layer.objects = layer.objects.filter(obj => {
        const objTileX = Math.floor((obj.x + obj.width / 2) / tileSize);
        const objTileY = Math.floor((obj.y + obj.height / 2) / tileSize);
        return objTileX !== tileX || objTileY !== tileY;
    });
}

function fillTiles(layer, startX, startY, asset) {
    if (!asset || asset.type !== 'tile') return;
    
    if (!layer.tileData) {
        layer.tileData = createEmptyTileData();
    }
    
    const targetTile = layer.tileData[startY]?.[startX];
    
    for (let y = 0; y < EditorState.mapHeight; y++) {
        for (let x = 0; x < EditorState.mapWidth; x++) {
            const current = layer.tileData[y][x];
            if ((targetTile === null && current === null) || 
                (targetTile && current && current.tilesetId === targetTile.tilesetId && current.tileIndex === targetTile.tileIndex)) {
                layer.tileData[y][x] = {
                    tilesetId: asset.tileset.id,
                    tileIndex: asset.tile.index,
                    flipX: asset.flipX || false,
                    flipY: asset.flipY || false
                };
            }
        }
    }
}

function pickTile(layer, tileX, tileY) {
    if (!layer.tileData || !layer.tileData[tileY] || !layer.tileData[tileY][tileX]) return;
    
    const tileInfo = layer.tileData[tileY][tileX];
    const tileset = EditorState.tilesets.find(t => t.id === tileInfo.tilesetId);
    if (!tileset) return;
    
    selectTile(tileset.id, tileInfo.tileIndex);
}

function createEmptyTileData() {
    const data = [];
    for (let y = 0; y < EditorState.mapHeight; y++) {
        data[y] = [];
        for (let x = 0; x < EditorState.mapWidth; x++) {
            data[y][x] = null;
        }
    }
    return data;
}

function renderCanvas() {
    if (!EditorState.ctx) return;
    const ctx = EditorState.ctx;
    const tileSize = EditorState.tileSize;
    
    ctx.clearRect(0, 0, EditorState.canvas.width, EditorState.canvas.height);
    ctx.fillStyle = '#2a2a4a';
    ctx.fillRect(0, 0, EditorState.canvas.width, EditorState.canvas.height);
    
    EditorState.layers.forEach(layer => {
        if (!layer.visible) return;
        
        ctx.globalAlpha = layer.opacity || 1;
        
        if (layer.tileData) {
            for (let y = 0; y < EditorState.mapHeight; y++) {
                for (let x = 0; x < EditorState.mapWidth; x++) {
                    const tile = layer.tileData[y][x];
                    if (!tile) continue;
                    
                    const tileset = EditorState.tilesets.find(t => t.id === tile.tilesetId);
                    if (!tileset) continue;
                    
                    const tileInfo = tileset.tiles[tile.tileIndex];
                    if (!tileInfo) continue;
                    
                    const img = new Image();
                    img.src = tileInfo.src;
                    
                    ctx.save();
                    ctx.translate(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2);
                    
                    if (tile.flipX) ctx.scale(-1, 1);
                    if (tile.flipY) ctx.scale(1, -1);
                    
                    ctx.drawImage(img, -tileSize / 2, -tileSize / 2, tileSize, tileSize);
                    ctx.restore();
                }
            }
        }
        
        layer.objects.forEach(obj => {
            const img = new Image();
            img.src = obj.src;
            img.onload = () => ctx.drawImage(img, obj.x, obj.y, obj.width, obj.height);
            if (img.complete) {
                ctx.drawImage(img, obj.x, obj.y, obj.width, obj.height);
            }
        });
        
        ctx.globalAlpha = 1;
    });
    
    if (EditorState.showGrid) {
        renderGrid(ctx);
    }
}

function renderGrid(ctx) {
    const tileSize = EditorState.tileSize;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    for (let x = 0; x <= EditorState.mapWidth; x++) {
        ctx.beginPath();
        ctx.moveTo(x * tileSize, 0);
        ctx.lineTo(x * tileSize, EditorState.canvas.height);
        ctx.stroke();
    }
    
    for (let y = 0; y <= EditorState.mapHeight; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * tileSize);
        ctx.lineTo(EditorState.canvas.width, y * tileSize);
        ctx.stroke();
    }
}

function renderLayers() {
    const list = document.getElementById('layers-list');
    if (!list) return;
    
    list.innerHTML = EditorState.layers.map(l => `
        <div class="layer-item ${l.id === EditorState.activeLayer ? 'active' : ''}" onclick="selectLayer(${l.id})">
            <button class="layer-visibility" onclick="toggleLayerVisibility(${l.id}, event)">
                <i data-lucide="${l.visible ? 'eye' : 'eye-off'}"></i>
            </button>
            <span>${l.name}</span>
            <input type="range" class="layer-opacity" min="0" max="100" value="${(l.opacity || 1) * 100}" 
                   onclick="event.stopPropagation()" onchange="setLayerOpacity(${l.id}, this.value)">
        </div>
    `).join('');
    
    if (window.lucide) lucide.createIcons();
}

function toggleLayerVisibility(id, e) {
    e.stopPropagation();
    const layer = EditorState.layers.find(l => l.id === id);
    if (layer) {
        layer.visible = !layer.visible;
        renderLayers();
        renderCanvas();
    }
}

function setLayerOpacity(id, value) {
    const layer = EditorState.layers.find(l => l.id === id);
    if (layer) {
        layer.opacity = value / 100;
        renderCanvas();
    }
}

function renderAssetGrid(id, assets) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = assets.map((a, i) => 
        `<div class="asset-item" onclick="selectAsset('${id}', ${i})">
            <img src="${a.src}" alt="素材 ${i + 1}">
            <div class="asset-meta">
                <strong>素材 ${i + 1}</strong>
                <span>${(a.width || 100)} x ${(a.height || 100)}</span>
            </div>
        </div>`
    ).join('');
}

function selectAsset(containerId, idx) {
    const assets = containerId.includes('background') ? EditorState.assets.backgrounds : EditorState.assets.objects;
    EditorState.selectedAsset = assets[idx];
    EditorState.selectedAsset.type = 'object';
    updateAssetPreview(EditorState.selectedAsset, idx, containerId.includes('background') ? '背景素材' : '物件素材');
}

function selectBuiltinAsset(idx) {
    EditorState.selectedAsset = EditorState.assets.objects[idx];
    EditorState.selectedAsset.type = 'object';
    updateAssetPreview(EditorState.selectedAsset, idx, '內建素材');
}

function selectLayer(id) {
    EditorState.activeLayer = id;
    renderLayers();
    updateLayerMoveStatus();
}

function updateAssetPreview(asset, idx, typeLabel) {
    const preview = document.getElementById('asset-preview');
    if (!preview) return;
    if (!asset) {
        preview.innerHTML = `
            <h3>素材預覽</h3>
            <div class="asset-preview-empty">尚未選擇素材</div>
        `;
        return;
    }
    preview.innerHTML = `
        <h3>素材預覽</h3>
        <div class="asset-preview-body">
            <img src="${asset.src || asset.tile?.src}" alt="素材預覽">
            <div class="asset-preview-meta">
                <strong>${typeLabel} ${idx + 1}</strong>
                <span>${(asset.width || EditorState.tileSize)} x ${(asset.height || EditorState.tileSize)}</span>
            </div>
        </div>
    `;
}

function updateLayerMoveStatus() {
    const status = document.getElementById('layer-move-status');
    if (!status) return;
    const active = EditorState.layers.find(layer => layer.id === EditorState.activeLayer);
    status.textContent = `目前圖層：${active ? active.name : '未選擇'}`;
}

function moveActiveLayer(direction) {
    const currentIndex = EditorState.layers.findIndex(layer => layer.id === EditorState.activeLayer);
    if (currentIndex < 0) return;
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= EditorState.layers.length) return;

    const temp = EditorState.layers[currentIndex];
    EditorState.layers[currentIndex] = EditorState.layers[targetIndex];
    EditorState.layers[targetIndex] = temp;

    renderLayers();
    updateLayerMoveStatus();
    renderCanvas();
}

function saveHistory() {
    EditorState.history = EditorState.history.slice(0, EditorState.historyIndex + 1);
    EditorState.history.push(JSON.stringify({
        layers: EditorState.layers.map(l => ({
            ...l,
            tileData: l.tileData ? JSON.parse(JSON.stringify(l.tileData)) : null
        }))
    }));
    EditorState.historyIndex = EditorState.history.length - 1;
    
    if (EditorState.history.length > 50) {
        EditorState.history.shift();
        EditorState.historyIndex--;
    }
}

function undo() {
    if (EditorState.historyIndex <= 0) return;
    EditorState.historyIndex--;
    restoreFromHistory();
}

function redo() {
    if (EditorState.historyIndex >= EditorState.history.length - 1) return;
    EditorState.historyIndex++;
    restoreFromHistory();
}

function restoreFromHistory() {
    const state = JSON.parse(EditorState.history[EditorState.historyIndex]);
    EditorState.layers = state.layers;
    renderLayers();
    renderCanvas();
}

function saveScene() {
    const name = document.getElementById('scene-name')?.value || '場景';
    
    const tilesetsData = EditorState.tilesets.map(t => ({
        id: t.id,
        name: t.name,
        src: t.image.src,
        cols: t.cols,
        rows: t.rows
    }));
    
    const data = {
        name,
        tileSize: EditorState.tileSize,
        mapWidth: EditorState.mapWidth,
        mapHeight: EditorState.mapHeight,
        layers: EditorState.layers.map(l => ({
            id: l.id,
            name: l.name,
            visible: l.visible,
            opacity: l.opacity,
            objects: l.objects,
            tileData: l.tileData
        })),
        tilesets: tilesetsData,
        animatedTiles: EditorState.animatedTiles
    };
    
    const scenes = JSON.parse(localStorage.getItem('sx_dating_custom_scenes') || '[]');
    scenes.push(data);
    localStorage.setItem('sx_dating_custom_scenes', JSON.stringify(scenes));
    alert('已儲存');
}

function loadScene() {
    const input = document.getElementById('scene-import');
    if (input) {
        input.click();
    }
}

function handleSceneImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            
            EditorState.tileSize = data.tileSize || 32;
            EditorState.mapWidth = data.mapWidth || 25;
            EditorState.mapHeight = data.mapHeight || 19;
            
            EditorState.canvas.width = EditorState.mapWidth * EditorState.tileSize;
            EditorState.canvas.height = EditorState.mapHeight * EditorState.tileSize;
            
            EditorState.layers = data.layers || EditorState.layers;
            EditorState.animatedTiles = data.animatedTiles || {};
            
            if (data.tilesets) {
                data.tilesets.forEach(ts => {
                    const img = new Image();
                    img.onload = () => {
                        processTilesetImage(img, ts.name);
                    };
                    img.src = ts.src;
                });
            }
            
            renderLayers();
            renderCanvas();
            alert('場景已載入');
        } catch (err) {
            alert('載入失敗：' + err.message);
        }
    };
    reader.readAsText(file);
}

function exportScene() {
    const data = {
        tileSize: EditorState.tileSize,
        mapWidth: EditorState.mapWidth,
        mapHeight: EditorState.mapHeight,
        tilesets: EditorState.tilesets.map(t => ({
            name: t.name,
            src: t.image.src,
            firstGid: 1
        })),
        layers: EditorState.layers.map(l => ({
            name: l.name,
            data: l.tileData ? flattenTileData(l.tileData) : [],
            objects: l.objects,
            opacity: l.opacity || 1
        })),
        animatedTiles: EditorState.animatedTiles
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'scene.json';
    a.click();
}

function flattenTileData(tileData) {
    const result = [];
    for (let y = 0; y < tileData.length; y++) {
        for (let x = 0; x < tileData[y].length; x++) {
            const tile = tileData[y][x];
            if (tile) {
                result.push({
                    x, y,
                    tilesetId: tile.tilesetId,
                    tileIndex: tile.tileIndex,
                    flipX: tile.flipX,
                    flipY: tile.flipY
                });
            }
        }
    }
    return result;
}

function clearScene() {
    if (confirm('確定清空?')) {
        EditorState.layers.forEach(l => {
            l.objects = [];
            l.tileData = null;
        });
        renderCanvas();
    }
}

function testScene() {
    const sceneData = {
        tileSize: EditorState.tileSize,
        mapWidth: EditorState.mapWidth,
        mapHeight: EditorState.mapHeight,
        layers: EditorState.layers,
        tilesets: EditorState.tilesets
    };
    
    localStorage.setItem('sx_test_scene', JSON.stringify(sceneData));
    window.location.href = 'dating.html?testScene=true';
}

function closeEditor() { 
    window.location.href = 'dating.html'; 
}

function uploadAsset() { 
    alert('請使用素材指南'); 
}

function zoomIn() { 
    EditorState.zoom = Math.min(2, EditorState.zoom + 0.1); 
    updateZoomDisplay();
}

function zoomOut() { 
    EditorState.zoom = Math.max(0.5, EditorState.zoom - 0.1); 
    updateZoomDisplay();
}

function updateZoomDisplay() {
    const display = document.getElementById('zoom-level');
    if (display) {
        display.textContent = Math.round(EditorState.zoom * 100) + '%';
    }
}

function toggleGrid() {
    EditorState.showGrid = !EditorState.showGrid;
    renderCanvas();
}

function addLayer() {
    const newId = Math.max(...EditorState.layers.map(l => l.id)) + 1;
    EditorState.layers.push({
        id: newId,
        name: `圖層 ${newId}`,
        visible: true,
        opacity: 1,
        objects: [],
        tileData: null
    });
    renderLayers();
}

function deleteLayer(id) {
    if (EditorState.layers.length <= 1) {
        alert('至少需要一個圖層');
        return;
    }
    EditorState.layers = EditorState.layers.filter(l => l.id !== id);
    if (EditorState.activeLayer === id) {
        EditorState.activeLayer = EditorState.layers[0].id;
    }
    renderLayers();
    renderCanvas();
}

function toggleFlipX() {
    EditorState.flipX = !EditorState.flipX;
    if (EditorState.selectedTiles.length > 0) {
        EditorState.selectedTiles[0].flipX = EditorState.flipX;
    }
}

function toggleFlipY() {
    EditorState.flipY = !EditorState.flipY;
    if (EditorState.selectedTiles.length > 0) {
        EditorState.selectedTiles[0].flipY = EditorState.flipY;
    }
}

function createAnimatedTile() {
    if (EditorState.selectedTiles.length < 2) {
        alert('請選擇至少 2 個 tiles 來創建動畫');
        return;
    }
    
    const animId = 'anim_' + Date.now();
    const frames = EditorState.selectedTiles.map(t => ({
        tilesetId: t.tilesetId,
        tileIndex: t.tileIndex
    }));
    
    EditorState.animatedTiles[animId] = {
        frames: frames,
        interval: 200
    };
    
    updateAnimatedTilesList();
    alert(`動畫 tile 已創建: ${animId}`);
}

function updateAnimatedTilesList() {
    const container = document.getElementById('animated-tiles-list');
    if (!container) return;
    
    container.innerHTML = Object.entries(EditorState.animatedTiles).map(([id, anim]) => `
        <div class="anim-tile-item">
            <span>${id}</span>
            <input type="number" value="${anim.interval}" min="50" max="1000" step="50"
                   onchange="updateAnimInterval('${id}', this.value)">
            <button onclick="deleteAnimatedTile('${id}')">刪除</button>
        </div>
    `).join('');
}

function updateAnimInterval(animId, interval) {
    if (EditorState.animatedTiles[animId]) {
        EditorState.animatedTiles[animId].interval = parseInt(interval);
    }
}

function deleteAnimatedTile(animId) {
    delete EditorState.animatedTiles[animId];
    updateAnimatedTilesList();
}

function openSpriteGenerator() {
    const modal = document.getElementById('sprite-generator-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeSpriteGenerator() {
    const modal = document.getElementById('sprite-generator-modal');
    if (modal) modal.classList.add('hidden');
}

function openPixelEditor() {
    const modal = document.getElementById('pixel-editor-modal');
    if (modal) modal.classList.remove('hidden');
}

function closePixelEditor() {
    const modal = document.getElementById('pixel-editor-modal');
    if (modal) modal.classList.add('hidden');
}

window.saveScene = saveScene;
window.loadScene = loadScene;
window.exportScene = exportScene;
window.clearScene = clearScene;
window.testScene = testScene;
window.closeEditor = closeEditor;
window.uploadAsset = uploadAsset;
window.selectAsset = selectAsset;
window.selectBuiltinAsset = selectBuiltinAsset;
window.selectLayer = selectLayer;
window.selectTile = selectTile;
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.toggleGrid = toggleGrid;
window.addLayer = addLayer;
window.deleteLayer = deleteLayer;
window.openSpriteGenerator = openSpriteGenerator;
window.closeSpriteGenerator = closeSpriteGenerator;
window.openPixelEditor = openPixelEditor;
window.closePixelEditor = closePixelEditor;
window.moveActiveLayer = moveActiveLayer;
window.toggleLayerVisibility = toggleLayerVisibility;
window.setLayerOpacity = setLayerOpacity;
window.setTileSize = setTileSize;
window.loadExternalTileset = loadExternalTileset;
window.toggleFlipX = toggleFlipX;
window.toggleFlipY = toggleFlipY;
window.undo = undo;
window.redo = redo;
window.handleSceneImport = handleSceneImport;
window.createAnimatedTile = createAnimatedTile;
window.updateAnimInterval = updateAnimInterval;
window.deleteAnimatedTile = deleteAnimatedTile;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
