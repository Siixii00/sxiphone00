const STORAGE_KEY = 'sx_emoji_packs';
const DEFAULT_PACK_KEY = 'sx_emoji_default_ryan_loaded';
const DEFAULT_PACK_URL = './ryan-pack.json';

const grid = document.getElementById('emoji-grid');
const jsonFileInput = document.getElementById('emoji-json-file');
const importBtn = document.getElementById('import-json');
const gifInput = document.getElementById('gif-url');
const addGifBtn = document.getElementById('add-gif');
const clearBtn = document.getElementById('clear-emoji');
const imageFileInput = document.getElementById('emoji-image-file');
const uploadBtn = document.getElementById('upload-images');
const uploadPreview = document.getElementById('upload-preview');
const batchUrlsInput = document.getElementById('batch-urls');
const batchNamePrefix = document.getElementById('batch-name-prefix');
const addBatchBtn = document.getElementById('add-batch-urls');
const singleEmojiName = document.getElementById('single-emoji-name');
const emojiCountEl = document.getElementById('emoji-count');
const exportBtn = document.getElementById('export-json');

console.log('[EmojiShop] 初始化表情包商店');

const loadPacks = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        console.log('[EmojiShop] 載入表情包，數量:', parsed.length);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        console.warn('[EmojiShop] 載入表情包失敗');
        return [];
    }
};

const savePacks = (packs) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(packs));
    console.log('[EmojiShop] 保存表情包，數量:', packs.length);
    updateCount();
    
    // 通知其他應用表情包已更新
    window.parent?.postMessage({
        type: 'EMOJI_PACKS_UPDATED',
        count: packs.length
    }, '*');
};

const updateCount = () => {
    const packs = loadPacks();
    if (emojiCountEl) emojiCountEl.textContent = packs.length;
};

const normalizeEntry = (entry) => {
    if (typeof entry === 'string') {
        return { name: 'GIF', url: entry };
    }
    if (entry && typeof entry === 'object') {
        return {
            name: entry.name || 'GIF',
            url: entry.url || ''
        };
    }
    return null;
};

const renderGrid = () => {
    const packs = loadPacks();
    if (!grid) return;
    grid.innerHTML = '';
    packs.forEach((item, index) => {
        if (!item.url) return;
        const card = document.createElement('div');
        card.className = 'emoji-item';
        card.innerHTML = `
            <img src="${item.url}" alt="${item.name}" loading="lazy">
            <div class="emoji-name">${item.name}</div>
            <button class="delete-btn" data-index="${index}" title="刪除">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // 點擊表情包時發送給父視窗
        card.addEventListener('click', (e) => {
            if (e.target.closest('.delete-btn')) return;
            
            console.log('[EmojiShop] 點擊表情包:', item.name);
            
            // 通知父視窗使用此表情包
            window.parent?.postMessage({
                type: 'EMOJI_SELECTED',
                emoji: {
                    name: item.name,
                    url: item.url
                }
            }, '*');
            
            // 顯示提示
            const toast = document.createElement('div');
            toast.className = 'emoji-toast';
            toast.textContent = `已選擇: ${item.name}`;
            toast.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 14px;
                z-index: 1000;
            `;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 1500);
        });
        
        grid.appendChild(card);
    });
    updateCount();
};

const ensureDefaultPack = () => {
    const loaded = localStorage.getItem(DEFAULT_PACK_KEY);
    if (loaded) {
        renderGrid();
        return;
    }
    fetch(DEFAULT_PACK_URL)
        .then(res => res.json())
        .then((list) => {
            if (!Array.isArray(list)) return;
            const items = list.map(url => ({ name: 'Ryan', url }));
            addItems(items);
            localStorage.setItem(DEFAULT_PACK_KEY, 'true');
        })
        .catch(() => {
            renderGrid();
        });
};

const addItems = (items) => {
    const packs = loadPacks();
    items.forEach((item) => {
        if (item && item.url) packs.push(item);
    });
    savePacks(packs);
    renderGrid();
};

const deleteItem = (index) => {
    const packs = loadPacks();
    if (index >= 0 && index < packs.length) {
        packs.splice(index, 1);
        savePacks(packs);
        renderGrid();
    }
};

const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const isValidImageUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    const lower = url.toLowerCase();
    return lower.startsWith('http://') || lower.startsWith('https://') || lower.startsWith('data:');
};

const getImageExtension = (url) => {
    const lower = url.toLowerCase().split('?')[0];
    if (lower.endsWith('.gif')) return 'gif';
    if (lower.endsWith('.png')) return 'png';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'jpg';
    if (lower.endsWith('.webp')) return 'webp';
    return 'img';
};

if (uploadBtn) {
    uploadBtn.addEventListener('click', async () => {
        const files = imageFileInput?.files;
        if (!files || files.length === 0) return;
        
        if (uploadPreview) {
            uploadPreview.innerHTML = '<div class="loading">處理中...</div>';
        }
        
        const items = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file.type.startsWith('image/')) continue;
            try {
                const base64 = await fileToBase64(file);
                const name = file.name.replace(/\.[^/.]+$/, '') || `表情${i + 1}`;
                items.push({ name, url: base64 });
            } catch (e) {
                console.warn('檔案轉換失敗:', file.name, e);
            }
        }
        
        if (items.length > 0) {
            addItems(items);
        }
        
        if (uploadPreview) {
            uploadPreview.innerHTML = items.length > 0 
                ? `<div class="success">✓ 已新增 ${items.length} 個表情</div>`
                : '';
            setTimeout(() => { uploadPreview.innerHTML = ''; }, 2000);
        }
        
        if (imageFileInput) imageFileInput.value = '';
    });
}

if (addBatchBtn) {
    addBatchBtn.addEventListener('click', () => {
        const rawUrls = batchUrlsInput?.value || '';
        const prefix = batchNamePrefix?.value.trim() || '';
        const lines = rawUrls.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);
        
        if (lines.length === 0) return;
        
        const items = [];
        lines.forEach((url, i) => {
            if (isValidImageUrl(url)) {
                const ext = getImageExtension(url);
                const name = prefix ? `${prefix}${i + 1}` : `表情${ext}`;
                items.push({ name, url });
            }
        });
        
        if (items.length > 0) {
            addItems(items);
            if (batchUrlsInput) batchUrlsInput.value = '';
            if (batchNamePrefix) batchNamePrefix.value = '';
        }
    });
}

if (addGifBtn) {
    addGifBtn.addEventListener('click', () => {
        const url = gifInput?.value.trim();
        if (!url || !isValidImageUrl(url)) return;
        const name = singleEmojiName?.value.trim() || 'GIF';
        addItems([{ name, url }]);
        if (gifInput) gifInput.value = '';
        if (singleEmojiName) singleEmojiName.value = '';
    });
}

if (importBtn) {
    importBtn.addEventListener('click', () => {
        const file = jsonFileInput?.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(reader.result);
                if (!Array.isArray(parsed)) return;
                const items = parsed.map(normalizeEntry).filter(Boolean);
                addItems(items);
                if (jsonFileInput) jsonFileInput.value = '';
            } catch (e) {
                console.warn('JSON 解析失敗', e);
            }
        };
        reader.readAsText(file);
    });
}

if (clearBtn) {
    clearBtn.addEventListener('click', () => {
        if (!confirm('確定要清空所有表情包嗎？')) return;
        localStorage.removeItem(STORAGE_KEY);
        renderGrid();
    });
}

if (exportBtn) {
    exportBtn.addEventListener('click', () => {
        const packs = loadPacks();
        if (packs.length === 0) {
            alert('沒有可匯出的表情包');
            return;
        }
        const json = JSON.stringify(packs, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `emoji-pack-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });
}

if (grid) {
    grid.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) {
            const index = parseInt(deleteBtn.dataset.index, 10);
            deleteItem(index);
        }
    });
}

if (imageFileInput) {
    imageFileInput.addEventListener('change', () => {
        const files = imageFileInput.files;
        if (!files || files.length === 0) return;
        if (uploadPreview) {
            uploadPreview.innerHTML = `<div class="preview-info">已選擇 ${files.length} 個檔案，點擊「上傳圖片」確認</div>`;
        }
    });
}

ensureDefaultPack();
