const ALBUM_KEY = 'sx_album_uploaded_images';

let allImages = [];
let currentTab = 'all';
let viewerIndex = -1;

const saveAlbumData = () => {
    try {
        saveImages(allImages);
        console.log("相簿數據已保存至 localStorage");
    } catch (e) {
        console.error("保存相簿數據失敗:", e);
    }
};

const saveToPersistentStorage = async () => {
    saveAlbumData();
    if (typeof localforage !== 'undefined') {
        try {
            const existingData = await localforage.getItem('sx_app_persisted_data') || {};
            await localforage.setItem('sx_app_persisted_data', {
                ...existingData,
                sx_album_uploaded_images: allImages
            });
            console.log("相簿數據已保存至 IndexedDB");
        } catch (e) {
            console.error("IndexedDB 保存失敗:", e);
        }
    }
};

window.addEventListener('pagehide', () => {
    saveAlbumData();
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        saveAlbumData();
    }
});

window.addEventListener('message', (event) => {
    if (event.data?.type === 'APP_WILL_CLOSE') {
        saveAlbumData();
    }
});

function loadImages() {
    try {
        const raw = localStorage.getItem(ALBUM_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveImages(images) {
    localStorage.setItem(ALBUM_KEY, JSON.stringify(images.slice(0, 200)));
}

function addImage(dataUrl, source) {
    if (!dataUrl) return;
    const record = {
        id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        url: dataUrl,
        source: source || 'uploaded',
        createdAt: new Date().toISOString()
    };
    allImages.unshift(record);
    saveImages(allImages);
    renderGallery();
    return record;
}

function deleteImage(id) {
    allImages = allImages.filter(img => img.id !== id);
    saveImages(allImages);
    renderGallery();
}

function handleBack() {
    const isIframe = window.parent && window.parent !== window;
    if (isIframe) {
        try {
            window.parent.postMessage({ type: 'closeApp', appId: 'album' }, '*');
            return;
        } catch (e) {
            console.warn('postMessage 發送失敗:', e);
        }
    }
    window.location.replace('../index.html');
}

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    renderGallery();
}

function getFilteredImages() {
    if (currentTab === 'all') return allImages;
    return allImages.filter(img => img.source === currentTab);
}

const SOURCE_ICONS = {
    uploaded: 'fa-upload',
    chat: 'fa-comment',
    painter: 'fa-palette'
};

const SOURCE_LABELS = {
    uploaded: '上傳',
    chat: '聊天',
    painter: '照相館'
};

function renderGallery() {
    const grid = document.getElementById('gallery-grid');
    const empty = document.getElementById('empty-state');
    if (!grid || !empty) return;

    const filtered = getFilteredImages();

    if (filtered.length === 0) {
        grid.classList.add('hidden');
        empty.classList.remove('hidden');
        return;
    }

    grid.classList.remove('hidden');
    empty.classList.add('hidden');

    grid.innerHTML = filtered.map((img, idx) => {
        const icon = SOURCE_ICONS[img.source] || 'fa-image';
        const label = SOURCE_LABELS[img.source] || img.source;
        return `<div class="gallery-item" data-id="${img.id}" onclick="openViewer('${img.id}')">
            <img src="${img.url}" loading="lazy" alt="">
            <span class="source-badge"><i class="fas ${icon}"></i> ${label}</span>
        </div>`;
    }).join('');
}

function openViewer(id) {
    const filtered = getFilteredImages();
    const idx = filtered.findIndex(img => img.id === id);
    if (idx < 0) return;
    viewerIndex = idx;
    const img = filtered[idx];
    const viewer = document.getElementById('image-viewer');
    const viewerImg = document.getElementById('viewer-img');
    if (!viewer || !viewerImg) return;
    viewerImg.src = img.url;
    viewer.classList.remove('hidden');
}

function closeViewer() {
    const viewer = document.getElementById('image-viewer');
    if (viewer) viewer.classList.add('hidden');
    viewerIndex = -1;
}

function getCurrentViewerImage() {
    const filtered = getFilteredImages();
    if (viewerIndex < 0 || viewerIndex >= filtered.length) return null;
    return filtered[viewerIndex];
}

function setAsWallpaper() {
    const img = getCurrentViewerImage();
    if (!img) return;
    window.parent?.postMessage({ type: 'updateWallpaper', url: img.url }, '*');
}

function setAsLockscreen() {
    const img = getCurrentViewerImage();
    if (!img) return;
    window.parent?.postMessage({ type: 'updateLockscreen', url: img.url }, '*');
}

function deleteCurrentImage() {
    const img = getCurrentViewerImage();
    if (!img) return;
    if (!confirm('確定要刪除這張照片嗎？')) return;
    deleteImage(img.id);
    closeViewer();
}

function openImagePicker() {
    const input = document.getElementById('device-upload');
    if (input) input.click();
}

function handleDeviceUpload(event) {
    const files = event.target.files;
    if (!files || !files.length) return;
    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            addImage(e.target.result, 'uploaded');
        };
        reader.readAsDataURL(file);
    });
    if (event.target) event.target.value = '';
}

function receiveImage(dataUrl, source) {
    if (!dataUrl) return;
    addImage(dataUrl, source);
}

window.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || typeof data !== 'object') return;
    if (data.type === 'ALBUM_ADD_IMAGE') {
        receiveImage(data.url, data.source || 'uploaded');
    }
});

function loadSxSettings() {
    if (typeof SxSettings === 'undefined') return null;
    const settings = SxSettings.getSettingsSnapshot();
    console.log('[album] Loaded settings:', {
        characters: settings.characters.length,
        users: settings.users.length
    });
    return settings;
}

document.addEventListener('DOMContentLoaded', () => {
    loadSxSettings();
    allImages = loadImages();
    renderGallery();
    if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'REQUEST_APP_FOLDER_SYNC', appId: 'album' }, '*');
    }
});
