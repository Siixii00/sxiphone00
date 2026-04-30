const DOCK_STORAGE_KEY = 'sx_dock_apps';
const MAX_DOCK_APPS = 4;

const allApps = [
    { id: 'chat', name: '聊天', icon: 'chat_bubble', gradient: 'linear-gradient(135deg,#4facfe,#00f2fe)' },
    { id: 'settings', name: '設定', icon: 'settings', color: '#8e8e93' },
    { id: 'album', name: '相簿', icon: 'photo_library', gradient: 'linear-gradient(135deg,#ff9a9e,#fecfef)' },
    { id: 'weather', name: '天氣', icon: 'partly_cloudy_day', color: '#4facfe' },
    { id: 'music', name: '音樂', icon: 'music_note', color: '#ff5f9f' },
    { id: 'twitter', name: '推特', icon: 'alternate_email', color: '#1da1f2' },
    { id: 'facebook', name: '臉書', icon: 'group', color: '#1877f2' },
    { id: 'youtube', name: 'YouTube', icon: 'play_circle', color: '#ff0000' },
    { id: 'instagram', name: 'Instagram', icon: 'photo_camera', color: '#c13584' },
    { id: 'bilibili', name: 'bilibili', icon: 'live_tv', color: '#00a1d6' },
    { id: 'chrome', name: 'Chrome', icon: 'language', color: '#fbbc05' },
    { id: 'drift-bottle', name: '漂流瓶', icon: 'sailing', color: '#2d9cdb' },
    { id: 'worldbook', name: '世界書', icon: 'menu_book', gradient: 'linear-gradient(145deg, #5856D6, #3634A3)' },
    { id: 'dating', name: '約會', icon: 'favorite', color: '#e91e63' },
    { id: 'home', name: '宅家', icon: 'home', color: '#7c4dff' },
    { id: 'arcade', name: '街機廳', icon: 'joystick', gradient: 'linear-gradient(135deg,#fbbf24,#f59e0b)' },
    { id: 'pomodoro', name: '番茄鐘', icon: 'timer', color: '#f25f5c' },
    { id: 'exchange-diary', name: '交換日記', icon: 'auto_stories', color: '#9c27b0' },
    { id: 'delivery', name: '外送', icon: 'delivery_dining', color: '#ff7043' },
    { id: 'taobao', name: '購物', icon: 'shopping_bag', color: '#6366f1' }
];

function getDockApps() {
    try {
        const saved = localStorage.getItem(DOCK_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
}

function saveDockApps(appIds) {
    localStorage.setItem(DOCK_STORAGE_KEY, JSON.stringify(appIds));
}

function renderDock() {
    const dockApps = document.getElementById('dock-apps');
    if (!dockApps) return;

    const savedAppIds = getDockApps();
    
    if (savedAppIds.length === 0) {
        dockApps.innerHTML = `
            <div class="dock-empty" onclick="openDockPicker()">
                <i class="fas fa-plus"></i>
                <span>加入常用</span>
            </div>
        `;
        return;
    }

    dockApps.innerHTML = savedAppIds.map(appId => {
        const app = allApps.find(a => a.id === appId);
        if (!app) return '';
        const bgStyle = app.gradient ? `background:${app.gradient};` : `background:${app.color};`;
        return `
            <div class="app-icon" onclick="launchApp('${app.id}')" data-dock-app="${app.id}">
                <div class="icon-box" style="${bgStyle}">
                    <span class="material-symbols-rounded">${app.icon}</span>
                </div>
            </div>
        `;
    }).join('');

    if (savedAppIds.length < MAX_DOCK_APPS) {
        dockApps.innerHTML += `
            <div class="app-icon" onclick="openDockPicker()">
                <div class="icon-box" style="background:rgba(255,255,255,0.15);border:2px dashed rgba(255,255,255,0.3);">
                    <span class="material-symbols-rounded">add</span>
                </div>
            </div>
        `;
    }
}

function openDockPicker() {
    let picker = document.getElementById('dock-picker');
    if (picker) {
        picker.classList.remove('hidden');
        return;
    }

    const savedAppIds = getDockApps();
    
    picker = document.createElement('div');
    picker.id = 'dock-picker';
    picker.className = 'dock-picker';
    picker.innerHTML = `
        <div class="dock-picker-header">
            <span class="dock-picker-title">選擇常用應用程式</span>
            <button class="dock-picker-close" onclick="closeDockPicker()">完成</button>
        </div>
        <div class="dock-picker-grid">
            ${allApps.map(app => {
                const isSelected = savedAppIds.includes(app.id);
                const bgStyle = app.gradient ? `background:${app.gradient};` : `background:${app.color};`;
                return `
                    <div class="dock-picker-item ${isSelected ? 'selected' : ''}" data-app-id="${app.id}" onclick="toggleDockApp('${app.id}')">
                        <div class="icon-box" style="${bgStyle}">
                            <span class="material-symbols-rounded">${app.icon}</span>
                        </div>
                        <span class="app-label">${app.name}</span>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    document.body.appendChild(picker);
}

function closeDockPicker() {
    const picker = document.getElementById('dock-picker');
    if (picker) {
        picker.classList.add('hidden');
    }
}

function toggleDockApp(appId) {
    let savedAppIds = getDockApps();
    
    if (savedAppIds.includes(appId)) {
        savedAppIds = savedAppIds.filter(id => id !== appId);
    } else {
        if (savedAppIds.length >= MAX_DOCK_APPS) {
            alert(`最多只能加入 ${MAX_DOCK_APPS} 個常用應用程式`);
            return;
        }
        savedAppIds.push(appId);
    }
    
    saveDockApps(savedAppIds);
    
    const item = document.querySelector(`.dock-picker-item[data-app-id="${appId}"]`);
    if (item) {
        item.classList.toggle('selected');
    }
    
    renderDock();
}

document.addEventListener('DOMContentLoaded', () => {
    renderDock();
});
