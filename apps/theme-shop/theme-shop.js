const STORAGE_KEY = 'sx_chat_themes';
const APPLIED_THEME_KEY = 'sx_chat_applied_theme';

const defaultThemes = [
    {
        id: 'default-light',
        name: '經典黃色',
        author: '官方',
        type: 'light',
        isDefault: true,
        config: {
            bgColor: '#AFC3D1',
            bgImage: null,
            myBubbleColor: '#f3d94b',
            otherBubbleColor: '#ffffff',
            myTextColor: '#333333',
            otherTextColor: '#333333',
            headerBgColor: '#f3d94b',
            headerTextColor: '#343434',
            avatarImage: null
        }
    },
    {
        id: 'default-dark',
        name: '深夜黑',
        author: '官方',
        type: 'dark',
        isDefault: true,
        config: {
            bgColor: '#1a1a2e',
            bgImage: null,
            myBubbleColor: '#4a4a6a',
            otherBubbleColor: '#2d2d44',
            myTextColor: '#ffffff',
            otherTextColor: '#ffffff',
            headerBgColor: '#16213e',
            headerTextColor: '#ffffff',
            avatarImage: null
        }
    },
    {
        id: 'sakura-pink',
        name: '櫻花粉',
        author: '官方',
        type: 'light',
        isDefault: true,
        config: {
            bgColor: '#ffeef0',
            bgImage: null,
            myBubbleColor: '#ffb7c5',
            otherBubbleColor: '#ffffff',
            myTextColor: '#5c3d3d',
            otherTextColor: '#5c3d3d',
            headerBgColor: '#ffc0cb',
            headerTextColor: '#5c3d3d',
            avatarImage: null
        }
    },
    {
        id: 'ocean-blue',
        name: '海洋藍',
        author: '官方',
        type: 'light',
        isDefault: true,
        config: {
            bgColor: '#e3f2fd',
            bgImage: null,
            myBubbleColor: '#90caf9',
            otherBubbleColor: '#ffffff',
            myTextColor: '#1a237e',
            otherTextColor: '#1a237e',
            headerBgColor: '#64b5f6',
            headerTextColor: '#ffffff',
            avatarImage: null
        }
    },
    {
        id: 'forest-green',
        name: '森林綠',
        author: '官方',
        type: 'light',
        isDefault: true,
        config: {
            bgColor: '#e8f5e9',
            bgImage: null,
            myBubbleColor: '#a5d6a7',
            otherBubbleColor: '#ffffff',
            myTextColor: '#1b5e20',
            otherTextColor: '#1b5e20',
            headerBgColor: '#81c784',
            headerTextColor: '#ffffff',
            avatarImage: null
        }
    },
    {
        id: 'sunset-orange',
        name: '日落橘',
        author: '官方',
        type: 'light',
        isDefault: true,
        config: {
            bgColor: '#fff3e0',
            bgImage: null,
            myBubbleColor: '#ffcc80',
            otherBubbleColor: '#ffffff',
            myTextColor: '#e65100',
            otherTextColor: '#e65100',
            headerBgColor: '#ffb74d',
            headerTextColor: '#ffffff',
            avatarImage: null
        }
    },
    {
        id: 'lavender-purple',
        name: '薰衣草紫',
        author: '官方',
        type: 'light',
        isDefault: true,
        config: {
            bgColor: '#f3e5f5',
            bgImage: null,
            myBubbleColor: '#ce93d8',
            otherBubbleColor: '#ffffff',
            myTextColor: '#4a148c',
            otherTextColor: '#4a148c',
            headerBgColor: '#ba68c8',
            headerTextColor: '#ffffff',
            avatarImage: null
        }
    },
    {
        id: 'midnight-dark',
        name: '午夜深藍',
        author: '官方',
        type: 'dark',
        isDefault: true,
        config: {
            bgColor: '#0d1b2a',
            bgImage: null,
            myBubbleColor: '#1b263b',
            otherBubbleColor: '#415a77',
            myTextColor: '#e0e1dd',
            otherTextColor: '#e0e1dd',
            headerBgColor: '#1b263b',
            headerTextColor: '#e0e1dd',
            avatarImage: null
        }
    }
];

let currentCategory = 'all';
let selectedThemeType = 'dark';
let uploadedBgImage = null;
let uploadedAvatarImage = null;

const themeGrid = document.getElementById('theme-grid');
const myThemesGrid = document.getElementById('my-themes-grid');
const categoryTabs = document.getElementById('category-tabs');
const modal = document.getElementById('theme-detail-modal');
const modalBody = document.getElementById('modal-body');
const emptyHint = document.getElementById('empty-hint');

const themeNameInput = document.getElementById('theme-name');
const typeOptions = document.querySelectorAll('.type-option');
const bgFileInput = document.getElementById('bg-file');
const bgPreview = document.getElementById('bg-preview');
const avatarFileInput = document.getElementById('avatar-file');
const avatarPreview = document.getElementById('avatar-preview');
const myBubbleColorInput = document.getElementById('my-bubble-color');
const otherBubbleColorInput = document.getElementById('other-bubble-color');
const myTextColorInput = document.getElementById('my-text-color');
const otherTextColorInput = document.getElementById('other-text-color');
const headerBgColorInput = document.getElementById('header-bg-color');
const headerTextColorInput = document.getElementById('header-text-color');
const previewBox = document.getElementById('theme-preview-box');
const resetFormBtn = document.getElementById('reset-form');
const saveThemeBtn = document.getElementById('save-theme');

const loadThemes = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const saveThemes = (themes) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(themes));
};

const getAppliedTheme = () => {
    try {
        const raw = localStorage.getItem(APPLIED_THEME_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

const setAppliedTheme = (theme) => {
    if (theme) {
        localStorage.setItem(APPLIED_THEME_KEY, JSON.stringify(theme));
    } else {
        localStorage.removeItem(APPLIED_THEME_KEY);
    }
    notifyParentThemeChanged(theme);
};

const notifyParentThemeChanged = (theme) => {
    if (window.parent && window.parent !== window) {
        window.parent.postMessage({
            type: 'THEME_CHANGED',
            theme: theme,
            source: 'theme-shop'
        }, '*');
    }
};

const createThemeCard = (theme, isCustom = false) => {
    const appliedTheme = getAppliedTheme();
    const isApplied = appliedTheme && appliedTheme.id === theme.id;
    
    const card = document.createElement('div');
    card.className = 'theme-card';
    card.dataset.themeId = theme.id;
    
    const bgStyle = theme.config.bgImage 
        ? `background-image: url(${theme.config.bgImage});` 
        : `background-color: ${theme.config.bgColor};`;
    
    card.innerHTML = `
        <div class="theme-preview">
            <div class="theme-preview-bg" style="${bgStyle}"></div>
            <div class="theme-preview-overlay"></div>
            <div class="theme-preview-bubbles">
                <div class="preview-bubble left" style="background: ${theme.config.otherBubbleColor};"></div>
                <div class="preview-bubble right" style="background: ${theme.config.myBubbleColor};"></div>
            </div>
            ${theme.isDefault ? '<div class="theme-badge free">免費</div>' : ''}
            ${isApplied ? '<div class="applied-badge"><i class="fas fa-check"></i> 使用中</div>' : ''}
            ${isCustom ? `
                <div class="theme-card-actions">
                    <button class="theme-action-btn apply" title="套用" data-action="apply">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="theme-action-btn delete" title="刪除" data-action="delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            ` : ''}
        </div>
        <div class="theme-info">
            <div class="theme-name">${theme.name}</div>
            <div class="theme-author">${theme.author}</div>
        </div>
    `;
    
    card.addEventListener('click', (e) => {
        if (e.target.closest('.theme-action-btn')) {
            const action = e.target.closest('.theme-action-btn').dataset.action;
            if (action === 'apply') {
                applyTheme(theme);
            } else if (action === 'delete') {
                deleteCustomTheme(theme.id);
            }
            return;
        }
        openThemeDetail(theme);
    });
    
    return card;
};

const renderThemeGrid = () => {
    if (!themeGrid) return;
    themeGrid.innerHTML = '';
    
    let themes = [...defaultThemes];
    
    if (currentCategory !== 'all') {
        if (currentCategory === 'custom') {
            const customThemes = loadThemes();
            themes = customThemes;
        } else {
            themes = themes.filter(t => t.type === currentCategory);
        }
    }
    
    themes.forEach(theme => {
        const card = createThemeCard(theme, !theme.isDefault);
        themeGrid.appendChild(card);
    });
};

const renderMyThemes = () => {
    if (!myThemesGrid) return;
    const customThemes = loadThemes();
    
    if (customThemes.length === 0) {
        if (emptyHint) emptyHint.style.display = 'block';
        return;
    }
    
    if (emptyHint) emptyHint.style.display = 'none';
    myThemesGrid.innerHTML = '';
    
    customThemes.forEach(theme => {
        const card = createThemeCard(theme, true);
        myThemesGrid.appendChild(card);
    });
};

const openThemeDetail = (theme) => {
    if (!modal || !modalBody) return;
    
    const bgStyle = theme.config.bgImage 
        ? `background-image: url(${theme.config.bgImage});` 
        : `background-color: ${theme.config.bgColor};`;
    
    modalBody.innerHTML = `
        <div class="modal-preview">
            <div class="modal-preview-bg" style="${bgStyle}"></div>
        </div>
        <div class="modal-info">
            <div class="modal-theme-name">${theme.name}</div>
            <div class="modal-theme-author">作者：${theme.author}</div>
        </div>
    `;
    
    modal.classList.add('active');
    modal.dataset.themeId = theme.id;
};

const closeThemeDetail = () => {
    if (modal) {
        modal.classList.remove('active');
        delete modal.dataset.themeId;
    }
};

const applyTheme = (theme) => {
    setAppliedTheme(theme);
    
    // 通知父視窗主題已變更
    window.parent?.postMessage({
        type: 'THEME_CHANGED',
        theme: theme,
        source: 'theme-shop'
    }, '*');
    
    renderThemeGrid();
    renderMyThemes();
    
    showNotification(`已套用「${theme.name}」主題`);
};

const deleteCustomTheme = (themeId) => {
    const themes = loadThemes();
    const filtered = themes.filter(t => t.id !== themeId);
    saveThemes(filtered);
    
    const appliedTheme = getAppliedTheme();
    if (appliedTheme && appliedTheme.id === themeId) {
        setAppliedTheme(null);
    }
    
    renderThemeGrid();
    renderMyThemes();
    showNotification('主題已刪除');
};

const showNotification = (message) => {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 12px 24px;
        border-radius: 24px;
        font-size: 14px;
        z-index: 2000;
        animation: fadeInUp 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOutDown 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
};

const updatePreview = () => {
    if (!previewBox) return;
    
    const myBubble = previewBox.querySelector('.preview-msg.mine .preview-bubble-text');
    const otherBubble = previewBox.querySelector('.preview-msg.other .preview-bubble-text');
    const header = previewBox.querySelector('.preview-header');
    const chatArea = previewBox.querySelector('.preview-chat-area');
    
    if (myBubble) {
        myBubble.style.background = myBubbleColorInput?.value || '#f3d94b';
        myBubble.style.color = myTextColorInput?.value || '#333333';
    }
    
    if (otherBubble) {
        otherBubble.style.background = otherBubbleColorInput?.value || '#ffffff';
        otherBubble.style.color = otherTextColorInput?.value || '#333333';
    }
    
    if (header) {
        header.style.background = headerBgColorInput?.value || '#f3d94b';
        header.style.color = headerTextColorInput?.value || '#343434';
    }
    
    if (chatArea) {
        if (uploadedBgImage) {
            chatArea.style.backgroundImage = `url(${uploadedBgImage})`;
            chatArea.style.backgroundSize = 'cover';
            chatArea.style.backgroundPosition = 'center';
        } else {
            chatArea.style.backgroundImage = 'none';
            chatArea.style.backgroundColor = selectedThemeType === 'dark' ? '#1a1a2e' : '#AFC3D1';
        }
    }
};

const resetCreateForm = () => {
    if (themeNameInput) themeNameInput.value = '';
    selectedThemeType = 'dark';
    uploadedBgImage = null;
    uploadedAvatarImage = null;
    
    typeOptions.forEach(opt => {
        opt.classList.toggle('active', opt.dataset.type === 'dark');
    });
    
    if (bgPreview) {
        bgPreview.classList.remove('has-image');
        bgPreview.style.backgroundImage = '';
    }
    
    if (avatarPreview) {
        avatarPreview.classList.remove('has-image');
        avatarPreview.style.backgroundImage = '';
    }
    
    const defaultConfig = {
        myBubbleColor: '#f3d94b',
        otherBubbleColor: '#ffffff',
        myTextColor: '#333333',
        otherTextColor: '#333333',
        headerBgColor: '#f3d94b',
        headerTextColor: '#343434'
    };
    
    if (myBubbleColorInput) myBubbleColorInput.value = defaultConfig.myBubbleColor;
    if (otherBubbleColorInput) otherBubbleColorInput.value = defaultConfig.otherBubbleColor;
    if (myTextColorInput) myTextColorInput.value = defaultConfig.myTextColor;
    if (otherTextColorInput) otherTextColorInput.value = defaultConfig.otherTextColor;
    if (headerBgColorInput) headerBgColorInput.value = defaultConfig.headerBgColor;
    if (headerTextColorInput) headerTextColorInput.value = defaultConfig.headerTextColor;
    
    updatePreview();
};

const saveCustomTheme = () => {
    const name = themeNameInput?.value.trim();
    if (!name) {
        showNotification('請輸入主題名稱');
        themeNameInput?.focus();
        return;
    }
    
    const newTheme = {
        id: `custom-${Date.now()}`,
        name: name,
        author: '我',
        type: selectedThemeType,
        isDefault: false,
        config: {
            bgColor: selectedThemeType === 'dark' ? '#1a1a2e' : '#AFC3D1',
            bgImage: uploadedBgImage,
            myBubbleColor: myBubbleColorInput?.value || '#f3d94b',
            otherBubbleColor: otherBubbleColorInput?.value || '#ffffff',
            myTextColor: myTextColorInput?.value || '#333333',
            otherTextColor: otherTextColorInput?.value || '#333333',
            headerBgColor: headerBgColorInput?.value || '#f3d94b',
            headerTextColor: headerTextColorInput?.value || '#343434',
            avatarImage: uploadedAvatarImage
        },
        createdAt: new Date().toISOString(),
        synced: false
    };
    
    const themes = loadThemes();
    themes.push(newTheme);
    saveThemes(themes);
    
    // 同步到雲端
    syncThemeToCloud(newTheme);
    
    renderThemeGrid();
    renderMyThemes();
    resetCreateForm();
    showNotification(`主題「${name}」已儲存`);
};

const handleImageUpload = (file, type) => {
    if (!file || !file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const dataUrl = e.target.result;
        
        if (type === 'bg') {
            uploadedBgImage = dataUrl;
            if (bgPreview) {
                bgPreview.classList.add('has-image');
                bgPreview.style.backgroundImage = `url(${dataUrl})`;
            }
        } else if (type === 'avatar') {
            uploadedAvatarImage = dataUrl;
            if (avatarPreview) {
                avatarPreview.classList.add('has-image');
                avatarPreview.style.backgroundImage = `url(${dataUrl})`;
            }
        }
        
        updatePreview();
    };
    reader.readAsDataURL(file);
};

if (categoryTabs) {
    categoryTabs.addEventListener('click', (e) => {
        const tab = e.target.closest('.chip-btn');
        if (!tab) return;
        
        categoryTabs.querySelectorAll('.chip-btn').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentCategory = tab.dataset.category;
        renderThemeGrid();
    });
}

typeOptions.forEach(opt => {
    opt.addEventListener('click', () => {
        typeOptions.forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        selectedThemeType = opt.dataset.type;
        updatePreview();
    });
});

if (bgPreview) {
    bgPreview.addEventListener('click', () => bgFileInput?.click());
}

if (avatarPreview) {
    avatarPreview.addEventListener('click', () => avatarFileInput?.click());
}

if (bgFileInput) {
    bgFileInput.addEventListener('change', (e) => {
        handleImageUpload(e.target.files[0], 'bg');
    });
}

if (avatarFileInput) {
    avatarFileInput.addEventListener('change', (e) => {
        handleImageUpload(e.target.files[0], 'avatar');
    });
}

[myBubbleColorInput, otherBubbleColorInput, myTextColorInput, otherTextColorInput, headerBgColorInput, headerTextColorInput].forEach(input => {
    if (input) {
        input.addEventListener('input', updatePreview);
    }
});

if (resetFormBtn) {
    resetFormBtn.addEventListener('click', resetCreateForm);
}

if (saveThemeBtn) {
    saveThemeBtn.addEventListener('click', saveCustomTheme);
}

const saveAsLightBtn = document.getElementById('save-as-light');
const saveAsDarkBtn = document.getElementById('save-as-dark');

const convertToAppearanceSettings = (theme) => {
    return {
        bgColor: theme.config.bgColor || '#f2f2f7',
        cardBgColor: theme.config.otherBubbleColor || '#ffffff',
        textColor: theme.config.otherTextColor || '#1c1c1e',
        mutedColor: '#6e6e73',
        borderColor: '#d1d1d6',
        accentColor: theme.config.myBubbleColor || '#007aff',
        fontFamily: "'SF Pro Display', sans-serif",
        fontSize: 14,
        headingSize: 22,
        lineHeight: 1.5,
        cardRadius: 12,
        cardPadding: 14,
        sectionGap: 12,
        btnRadius: 10,
        inputRadius: 10,
        shadow: 10,
        blur: 0,
        animationSpeed: 'normal',
        customCss: ''
    };
};

const saveAsCustomLight = () => {
    const settings = {
        bgColor: selectedThemeType === 'light' ? (uploadedBgImage ? 'transparent' : '#f2f2f7') : '#f2f2f7',
        cardBgColor: otherBubbleColorInput?.value || '#ffffff',
        textColor: otherTextColorInput?.value || '#1c1c1e',
        mutedColor: '#6e6e73',
        borderColor: '#d1d1d6',
        accentColor: myBubbleColorInput?.value || '#007aff',
        fontFamily: "'SF Pro Display', sans-serif",
        fontSize: 14,
        headingSize: 22,
        lineHeight: 1.5,
        cardRadius: 12,
        cardPadding: 14,
        sectionGap: 12,
        btnRadius: 10,
        inputRadius: 10,
        shadow: 10,
        blur: 0,
        animationSpeed: 'normal',
        customCss: '',
        bgImage: uploadedBgImage
    };
    
    localStorage.setItem('sx_app_interface_custom_light', JSON.stringify(settings));
    localStorage.setItem('sx_global_appearance_saved', JSON.stringify(settings));
    
    window.parent?.postMessage({ type: 'GLOBAL_APPEARANCE_SAVED', mode: 'custom-light', settings: settings }, '*');
    window.parent?.postMessage({ type: 'TRIGGER_GITHUB_SYNC' }, '*');
    
    showNotification('已儲存為自訂淺色主題');
};

const saveAsCustomDark = () => {
    const settings = {
        bgColor: selectedThemeType === 'dark' ? (uploadedBgImage ? 'transparent' : '#0b0c12') : '#0b0c12',
        cardBgColor: otherBubbleColorInput?.value || '#12131b',
        textColor: otherTextColorInput?.value || '#e5e7eb',
        mutedColor: '#9ca3af',
        borderColor: '#1f2030',
        accentColor: myBubbleColorInput?.value || '#5B8DEF',
        fontFamily: "'SF Pro Display', sans-serif",
        fontSize: 14,
        headingSize: 22,
        lineHeight: 1.5,
        cardRadius: 12,
        cardPadding: 14,
        sectionGap: 12,
        btnRadius: 10,
        inputRadius: 10,
        shadow: 25,
        blur: 0,
        animationSpeed: 'normal',
        customCss: '',
        bgImage: uploadedBgImage
    };
    
    localStorage.setItem('sx_app_interface_custom_dark', JSON.stringify(settings));
    localStorage.setItem('sx_global_appearance_saved', JSON.stringify(settings));
    
    window.parent?.postMessage({ type: 'GLOBAL_APPEARANCE_SAVED', mode: 'custom-dark', settings: settings }, '*');
    window.parent?.postMessage({ type: 'TRIGGER_GITHUB_SYNC' }, '*');
    
    showNotification('已儲存為自訂深色主題');
};

if (saveAsLightBtn) {
    saveAsLightBtn.addEventListener('click', saveAsCustomLight);
}

if (saveAsDarkBtn) {
    saveAsDarkBtn.addEventListener('click', saveAsCustomDark);
}

document.getElementById('modal-close')?.addEventListener('click', closeThemeDetail);
document.getElementById('modal-cancel')?.addEventListener('click', closeThemeDetail);

document.getElementById('modal-apply')?.addEventListener('click', () => {
    const themeId = modal?.dataset.themeId;
    if (!themeId) return;
    
    const allThemes = [...defaultThemes, ...loadThemes()];
    const theme = allThemes.find(t => t.id === themeId);
    if (theme) {
        applyTheme(theme);
    }
    closeThemeDetail();
});

modal?.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeThemeDetail();
    }
});

const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInUp {
        from { opacity: 0; transform: translateX(-50%) translateY(20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    @keyframes fadeOutDown {
        from { opacity: 1; transform: translateX(-50%) translateY(0); }
        to { opacity: 0; transform: translateX(-50%) translateY(20px); }
    }
`;
document.head.appendChild(style);

// 同步主題到雲端
const syncThemeToCloud = (theme) => {
    // 通知父視窗同步到 GitHub
    window.parent?.postMessage({
        type: 'THEME_CREATED',
        theme: theme,
        source: 'theme-shop'
    }, '*');
    
    // 觸發 GitHub 同步
    window.parent?.postMessage({
        type: 'TRIGGER_GITHUB_SYNC'
    }, '*');
    
    console.log('[ThemeShop] 主題已同步到雲端:', theme.name);
};

// 監聽來自父視窗的同步結果
window.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || typeof data !== 'object') return;
    
    if (data.type === 'GITHUB_SYNC_RESULT') {
        if (data.success) {
            console.log('[ThemeShop] 雲端同步成功');
        } else {
            console.warn('[ThemeShop] 雲端同步失敗:', data.error);
        }
    }
});

renderThemeGrid();
renderMyThemes();
updatePreview();
