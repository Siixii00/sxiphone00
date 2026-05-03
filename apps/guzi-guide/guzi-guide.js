const STORAGE_KEY = 'guzi-guide:user-items:v2';
const SETTINGS_USERS_KEY = 'sx_users';
const SETTINGS_USER_NAME_KEY = 'sx_user_name';

const searchInput = document.getElementById('search-input');
const userFilter = document.getElementById('user-filter');
const typeFilter = document.getElementById('type-filter');
const clearFilterBtn = document.getElementById('clear-filter-btn');
const addItemBtn = document.getElementById('add-item-btn');
const openDesignBtn = document.getElementById('open-design-btn');
const statPanel = document.getElementById('stat-panel');
const userChips = document.getElementById('user-chips');
const resultCount = document.getElementById('result-count');
const catalogList = document.getElementById('catalog-list');
const emptyTip = document.getElementById('empty-tip');
const detailSheet = document.getElementById('detail-sheet');
const detailTitle = document.getElementById('detail-title');
const detailContent = document.getElementById('detail-content');

const settingsUserList = document.getElementById('settings-user-list');
const editorSheet = document.getElementById('editor-sheet');
const editorTitle = document.getElementById('editor-title');
const editorForm = document.getElementById('editor-form');
const editorUser = document.getElementById('editor-user');
const editorType = document.getElementById('editor-type');
const editorItemName = document.getElementById('editor-item-name');
const editorSeries = document.getElementById('editor-series');
const editorCharacter = document.getElementById('editor-character');
const editorMaterial = document.getElementById('editor-material');
const editorRarity = document.getElementById('editor-rarity');
const editorSource = document.getElementById('editor-source');
const editorCount = document.getElementById('editor-count');
const editorWish = document.getElementById('editor-wish');
const editorTags = document.getElementById('editor-tags');
const editorNotes = document.getElementById('editor-notes');
const editorImageUrl = document.getElementById('editor-image-url');
const editorPickImage = document.getElementById('editor-pick-image');
const editorImageFile = document.getElementById('editor-image-file');
const editorImagePreview = document.getElementById('editor-image-preview');

const designSheet = document.getElementById('design-sheet');
const designPickBtn = document.getElementById('design-pick-btn');
const designUploadInput = document.getElementById('design-upload-input');
const designPickModelBtn = document.getElementById('design-pick-model-btn');
const designModelUploadInput = document.getElementById('design-model-upload-input');
const designModelUrl = document.getElementById('design-model-url');
const designLoadModelBtn = document.getElementById('design-load-model-btn');
const modelUrlSection = document.getElementById('model-url-section');
const modelViewer = document.getElementById('model-viewer');
const designResetBtn = document.getElementById('design-reset-btn');
const designExportBtn = document.getElementById('design-export-btn');
const productPreview = document.getElementById('product-preview');
const previewBadge = document.getElementById('preview-badge');
const previewStandee = document.getElementById('preview-standee');
const previewMahjong = document.getElementById('preview-mahjong');
const previewCharm = document.getElementById('preview-charm');
const previewModel3d = document.getElementById('preview-model3d');
const badgeImage = document.getElementById('badge-image');
const standeeImage = document.getElementById('standee-image');
const mahjongImage = document.getElementById('mahjong-image');
const charmImage = document.getElementById('charm-image');
const specSize = document.getElementById('spec-size');
const specMaterial = document.getElementById('spec-material');
const specCraft = document.getElementById('spec-craft');

const ai3dSection = document.getElementById('ai-3d-section');
const ai3dImageInput = document.getElementById('ai-3d-image-input');
const ai3dPickImageBtn = document.getElementById('ai-3d-pick-image-btn');
const ai3dImagePreview = document.getElementById('ai-3d-image-preview');
const ai3dTextInput = document.getElementById('ai-3d-text-input');
const ai3dRemoveBg = document.getElementById('ai-3d-remove-bg');
const ai3dTexture = document.getElementById('ai-3d-texture');
const ai3dGenerateBtn = document.getElementById('ai-3d-generate-btn');

const defaultCatalog = [];

const iconByType = {
  立牌: 'fa-cubes', 徽章: 'fa-certificate', 透卡: 'fa-id-card', 壓克力磚: 'fa-gem', 紙類: 'fa-file-lines',
  娃衣: 'fa-shirt', 吊飾: 'fa-key', 票根: 'fa-ticket', 貼紙: 'fa-note-sticky', 票卡夾: 'fa-wallet', 包袋: 'fa-bag-shopping', 收納: 'fa-box-open'
};

let catalog = [];
let currentEditingId = null;
let currentProductType = 'badge';
let currentDesignImage = null;

const productSpecs = {
  badge: { size: '直徑 5.8cm', material: '金屬徽章', craft: '印刷 + 滴膠' },
  standee: { size: '高 15cm', material: '壓克力', craft: '雙面印刷' },
  mahjong: { size: '3.5 x 2.6cm', material: '壓克力 + 流沙', craft: '雙層流沙' },
  charm: { size: '高 6cm', material: '壓克力', craft: '雙面印刷 + 金屬環' },
  model3d: { size: '自訂尺寸', material: '3D列印 / 數位模型', craft: 'GLB/GLTF 格式' },
  ai3d: { size: 'AI 生成', material: 'Hunyuan3D-2', craft: '圖片/文字轉3D' }
};

function safeJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function loadSettingsUsers() {
  const list = safeJson(SETTINGS_USERS_KEY, []);
  return Array.isArray(list) ? list : [];
}

function getSettingsUserNames() {
  const users = loadSettingsUsers();
  const names = users.map(u => (u?.name || '').trim()).filter(Boolean);
  const fallbackName = (localStorage.getItem(SETTINGS_USER_NAME_KEY) || '').trim();
  if (fallbackName) names.unshift(fallbackName);
  return [...new Set(names)];
}

function normalizeUserBySettings(inputName = '') {
  const name = inputName.trim();
  const settingsNames = getSettingsUserNames();
  if (!settingsNames.length) return name || 'Unknown';
  if (name && settingsNames.includes(name)) return name;
  const current = (localStorage.getItem(SETTINGS_USER_NAME_KEY) || '').trim();
  if (current && settingsNames.includes(current)) return current;
  return settingsNames[0];
}

function renderSettingsUserDatalist() {
  if (!settingsUserList) return;
  const names = getSettingsUserNames();
  settingsUserList.innerHTML = names.map(name => `<option value="${name}"></option>`).join('');
}

function syncUsersFromSettings() {
  renderSettingsUserDatalist();
  refreshFilterOptions(true);
  if (editorUser) {
    editorUser.value = normalizeUserBySettings(editorUser.value || '');
  }
}

function loadUserItems() {
  const list = safeJson(STORAGE_KEY, []);
  return Array.isArray(list) ? list : [];
}

function saveUserItems() {
  const custom = catalog.filter(item => item.custom === true);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
}

function initCatalog() {
  catalog = [...defaultCatalog, ...loadUserItems()];
  if (defaultCatalog.length === 0) {
    const legacy = safeJson('guzi-guide:user-items:v1', []);
    if (Array.isArray(legacy) && legacy.length) {
      catalog = [...legacy.map(item => ({ ...item, custom: true }))];
      saveUserItems();
    }
  }
}

function getUsers() { return [...new Set(catalog.map(item => item.user))].sort(); }
function getTypes() { return [...new Set(catalog.map(item => item.type))].sort(); }

function buildSelect(selectEl, labelAll, values) {
  if (!selectEl) return;
  selectEl.innerHTML = [`<option value="">${labelAll}</option>`, ...values.map(v => `<option value="${v}">${v}</option>`)].join('');
}

function refreshFilterOptions(preserve = true) {
  const prevUser = preserve ? (userFilter?.value || '') : '';
  const prevType = preserve ? (typeFilter?.value || '') : '';
  const settingsUsers = getSettingsUserNames();
  buildSelect(userFilter, '全部 User', settingsUsers);
  buildSelect(typeFilter, '全部種類', getTypes());
  if (userFilter && prevUser) userFilter.value = settingsUsers.includes(prevUser) ? prevUser : '';
  if (typeFilter && prevType) typeFilter.value = getTypes().includes(prevType) ? prevType : '';
}

function renderStats(list) {
  if (!statPanel) return;
  const total = catalog.length;
  const owned = catalog.filter(item => Number(item.count || 0) > 0).length;
  const wished = catalog.filter(item => item.wish).length;
  const custom = catalog.filter(item => item.custom).length;
  const visible = list.length;
  statPanel.innerHTML = `
    <div class="stat-item"><span class="v">${total}</span><span class="k">總收錄</span></div>
    <div class="stat-item"><span class="v">${owned}</span><span class="k">已持有</span></div>
    <div class="stat-item"><span class="v">${wished}</span><span class="k">願望清單</span></div>
    <div class="stat-item"><span class="v">${custom}/${visible}</span><span class="k">自訂/顯示</span></div>
  `;
}

function renderUserChips(activeUser) {
  if (!userChips) return;
  const settingsUsers = getSettingsUserNames();
  userChips.innerHTML = settingsUsers.map(user => `<button class="chip ${user === activeUser ? 'active' : ''}" data-user-chip="${user}" type="button">${user}</button>`).join('');
}

function getFilteredList() {
  const keyword = (searchInput?.value || '').trim().toLowerCase();
  const user = userFilter?.value || '';
  const type = typeFilter?.value || '';
  return catalog.filter(item => {
    const text = `${item.user} ${item.series} ${item.itemName} ${item.character} ${(item.tags || []).join(' ')}`.toLowerCase();
    if (keyword && !text.includes(keyword)) return false;
    if (user && item.user !== user) return false;
    if (type && item.type !== type) return false;
    return true;
  });
}

function renderCatalog(list) {
  if (!catalogList || !resultCount || !emptyTip) return;
  resultCount.textContent = `${list.length} 筆`;
  emptyTip.classList.toggle('is-hidden', list.length > 0);
  catalogList.innerHTML = list.map(item => {
    const icon = iconByType[item.type] || 'fa-seedling';
    const hasImage = Boolean(item.image);
    const thumb = hasImage ? `<img src="${item.image}" alt="${item.itemName}">` : `<i class="fas ${icon}"></i>`;
    return `
      <article class="catalog-item ${hasImage ? 'has-image' : ''}" data-item-id="${item.id}">
        <div class="thumb">${thumb}</div>
        <div><h3>${item.itemName}</h3><p class="meta">${item.user} · ${item.series || '未分類'} · ${item.character || '未指定角色'}</p></div>
        <div><span class="tag">${item.custom ? '自訂' : '預設'}</span><span class="tag">${item.type}</span></div>
      </article>
    `;
  }).join('');
}

function openDetail(item) {
  if (!detailSheet || !detailTitle || !detailContent) return;
  detailTitle.textContent = `${item.itemName}｜${item.user}`;
  const img = item.image ? `<img src="${item.image}" alt="${item.itemName}" class="detail-cover">` : '';
  const actions = item.custom ? `<div class="detail-line"><button class="toolbar-btn" data-edit-id="${item.id}" type="button"><i class="fas fa-pen"></i>編輯</button> <button class="toolbar-btn" data-delete-id="${item.id}" type="button"><i class="fas fa-trash"></i>刪除</button></div>` : '';
  detailContent.innerHTML = `
    ${img}
    <div class="detail-line"><p class="k">系列</p><p class="v">${item.series || '未填寫'}</p></div>
    <div class="detail-line"><p class="k">角色</p><p class="v">${item.character || '未填寫'}</p></div>
    <div class="detail-line"><p class="k">種類/材質</p><p class="v">${item.type} / ${item.material || '未填寫'}</p></div>
    <div class="detail-line"><p class="k">稀有度/來源</p><p class="v">${item.rarity || '未填寫'} / ${item.source || '未填寫'}</p></div>
    <div class="detail-line"><p class="k">標籤</p><p class="v">${(item.tags || []).join('、') || '無'}</p></div>
    <div class="detail-line"><p class="k">持有/願望</p><p class="v">${Number(item.count || 0)} 件 / ${item.wish ? '是' : '否'}</p></div>
    <div class="detail-line"><p class="k">備註</p><p class="v">${item.notes || '無'}</p></div>
    ${actions}
  `;
  detailSheet.classList.remove('is-hidden');
  detailSheet.setAttribute('aria-hidden', 'false');
}

function closeDetail() {
  detailSheet?.classList.add('is-hidden');
  detailSheet?.setAttribute('aria-hidden', 'true');
}

function syncEditorPreview() {
  const src = (editorImageUrl?.value || '').trim();
  if (!editorImagePreview) return;
  if (!src) {
    editorImagePreview.src = '';
    editorImagePreview.classList.add('is-hidden');
    return;
  }
  editorImagePreview.src = src;
  editorImagePreview.classList.remove('is-hidden');
}

function makeId() { return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`; }

function openEditor(item = null) {
  currentEditingId = item?.id || null;
  if (editorTitle) editorTitle.textContent = item ? '編輯谷子' : '新增谷子';
  editorUser.value = normalizeUserBySettings(item?.user || '');
  editorType.value = item?.type || '';
  editorItemName.value = item?.itemName || '';
  editorSeries.value = item?.series || '';
  editorCharacter.value = item?.character || '';
  editorMaterial.value = item?.material || '';
  editorRarity.value = item?.rarity || '';
  editorSource.value = item?.source || '';
  editorCount.value = String(Number(item?.count || 0));
  editorWish.value = String(Boolean(item?.wish));
  editorTags.value = Array.isArray(item?.tags) ? item.tags.join(',') : '';
  editorNotes.value = item?.notes || '';
  editorImageUrl.value = item?.image || '';
  syncEditorPreview();
  editorSheet?.classList.remove('is-hidden');
  editorSheet?.setAttribute('aria-hidden', 'false');
}

function closeEditor() {
  editorSheet?.classList.add('is-hidden');
  editorSheet?.setAttribute('aria-hidden', 'true');
  currentEditingId = null;
}

function refreshView() {
  const list = getFilteredList();
  renderStats(list);
  renderCatalog(list);
  renderUserChips(userFilter?.value || '');
}

function resetFilters() {
  if (searchInput) searchInput.value = '';
  if (userFilter) userFilter.value = '';
  if (typeFilter) typeFilter.value = '';
  refreshView();
}

function openDesignSheet() {
  designSheet?.classList.remove('is-hidden');
  designSheet?.setAttribute('aria-hidden', 'false');
  updateProductType('badge');
}

function closeDesignSheet() {
  designSheet?.classList.add('is-hidden');
  designSheet?.setAttribute('aria-hidden', 'true');
}

function updateProductType(type) {
  currentProductType = type;
  
  document.querySelectorAll('.product-type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.productType === type);
  });
  
  previewBadge?.classList.toggle('is-hidden', type !== 'badge');
  previewStandee?.classList.toggle('is-hidden', type !== 'standee');
  previewMahjong?.classList.toggle('is-hidden', type !== 'mahjong');
  previewCharm?.classList.toggle('is-hidden', type !== 'charm');
  previewModel3d?.classList.toggle('is-hidden', type !== 'model3d' && type !== 'ai3d');
  modelUrlSection?.classList.toggle('is-hidden', type !== 'model3d');
  ai3dSection?.classList.toggle('is-hidden', type !== 'ai3d');
  
  const specs = productSpecs[type];
  if (specs && specSize && specMaterial && specCraft) {
    specSize.textContent = specs.size;
    specMaterial.textContent = specs.material;
    specCraft.textContent = specs.craft;
  }
  
  if (currentDesignImage && type !== 'model3d' && type !== 'ai3d') {
    updateProductImage(currentDesignImage);
  }
}

function updateProductImage(src) {
  currentDesignImage = src;
  
  switch (currentProductType) {
    case 'badge':
      if (badgeImage) badgeImage.src = src;
      break;
    case 'standee':
      if (standeeImage) standeeImage.src = src;
      break;
    case 'mahjong':
      if (mahjongImage) mahjongImage.src = src;
      break;
    case 'charm':
      if (charmImage) charmImage.src = src;
      break;
  }
}

function resetDesign() {
  currentDesignImage = null;
  if (badgeImage) badgeImage.src = '';
  if (standeeImage) standeeImage.src = '';
  if (mahjongImage) mahjongImage.src = '';
  if (charmImage) charmImage.src = '';
  if (designUploadInput) designUploadInput.value = '';
  if (designModelUploadInput) designModelUploadInput.value = '';
  if (designModelUrl) designModelUrl.value = '';
  if (modelViewer) {
    modelViewer.src = '';
    modelViewer.removeAttribute('src');
  }
  if (ai3dImageInput) ai3dImageInput.value = '';
  if (ai3dImagePreview) {
    ai3dImagePreview.src = '';
    ai3dImagePreview.classList.add('is-hidden');
  }
  if (ai3dTextInput) ai3dTextInput.value = '';
}

function exportDesign() {
  if (currentProductType === 'model3d' || currentProductType === 'ai3d') {
    if (!modelViewer?.src) {
      alert('請先上傳或生成 3D 模型');
      return;
    }
    alert('3D 模型已載入，可使用 model-viewer 的截圖功能或右鍵另存圖片。\n模型 URL: ' + modelViewer.src);
    return;
  }
  
  if (!productPreview || !currentDesignImage) {
    alert('請先上傳圖片');
    return;
  }
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const previewElement = productPreview.querySelector(`:not(.is-hidden)`);
  
  if (!previewElement) return;
  
  canvas.width = 800;
  canvas.height = 800;
  
  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  const img = new Image();
  img.onload = () => {
    const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.6;
    const x = (canvas.width - img.width * scale) / 2;
    const y = (canvas.height - img.height * scale) / 2;
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    
    const link = document.createElement('a');
    link.download = `${currentProductType}-design-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    const prices = { badge: 50, standee: 150, mahjong: 200, charm: 80, model3d: 300, ai3d: 500 };
    const names = { badge: '徽章', standee: '立牌', mahjong: '麻將', charm: '吊飾', model3d: '3D模型', ai3d: 'AI生成3D' };
    window.parent?.postMessage({
      type: 'KAKAOPAY_MERCH_PURCHASE',
      amount: prices[currentProductType] || 50,
      itemName: `自訂${names[currentProductType] || '周邊'}`,
      source: 'guzi-guide'
    }, '*');
  };
  img.src = currentDesignImage;
}

function loadModelFromUrl(url) {
  if (!modelViewer || !url) return;
  modelViewer.src = url;
  currentDesignImage = url;
}

let ai3dCurrentTab = 'image';
let ai3dSelectedImage = null;

function switchAi3dTab(tab) {
  ai3dCurrentTab = tab;
  document.querySelectorAll('.ai-3d-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.aiTab === tab);
  });
  document.getElementById('ai-3d-image-tab')?.classList.toggle('is-hidden', tab !== 'image');
  document.getElementById('ai-3d-text-tab')?.classList.toggle('is-hidden', tab !== 'text');
}

async function generateAi3dModel() {
  const imageFile = ai3dImageInput?.files?.[0];
  const textPrompt = ai3dTextInput?.value?.trim();
  
  if (ai3dCurrentTab === 'image' && !imageFile) {
    alert('請先選擇一張圖片');
    return;
  }
  
  if (ai3dCurrentTab === 'text' && !textPrompt) {
    alert('請輸入描述文字');
    return;
  }
  
  const useHunyuan = confirm(
    'AI 3D 生成需要使用 Hunyuan3D-2 服務。\n\n' +
    '由於瀏覽器安全限制，將開啟新視窗前往 Hugging Face Spaces。\n\n' +
    '生成完成後，請下載 .glb 檔案並回到此處上傳。\n\n' +
    '點擊「確定」繼續...'
  );
  
  if (!useHunyuan) return;
  
  if (ai3dCurrentTab === 'image' && imageFile) {
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result.split(',')[1];
      const params = new URLSearchParams({
        image: 'data:image/png;base64,' + base64Data,
        rembg: ai3dRemoveBg?.checked ? 'true' : 'false',
        texture: ai3dTexture?.checked ? 'true' : 'false'
      });
      localStorage.setItem('ai3d_pending_image', reader.result);
      localStorage.setItem('ai3d_pending_prompt', '');
      window.open('https://huggingface.co/spaces/tencent/Hunyuan3D-2', '_blank');
    };
    reader.readAsDataURL(imageFile);
  } else {
    localStorage.setItem('ai3d_pending_prompt', textPrompt || '');
    localStorage.setItem('ai3d_pending_image', '');
    window.open('https://huggingface.co/spaces/tencent/Hunyuan3D-2', '_blank');
  }
}

function bindEvents() {
  searchInput?.addEventListener('input', refreshView);
  userFilter?.addEventListener('change', refreshView);
  typeFilter?.addEventListener('change', refreshView);
  clearFilterBtn?.addEventListener('click', resetFilters);
  addItemBtn?.addEventListener('click', () => openEditor(null));
  openDesignBtn?.addEventListener('click', openDesignSheet);

  userChips?.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-user-chip]');
    if (!btn || !userFilter) return;
    const user = btn.dataset.userChip || '';
    userFilter.value = userFilter.value === user ? '' : user;
    refreshView();
  });

  catalogList?.addEventListener('click', (event) => {
    const card = event.target.closest('[data-item-id]');
    if (!card) return;
    const item = catalog.find(entry => entry.id === card.dataset.itemId);
    if (item) openDetail(item);
  });

  detailSheet?.addEventListener('click', (event) => {
    if (event.target.closest('[data-close-detail]')) {
      closeDetail();
      return;
    }
    const editBtn = event.target.closest('[data-edit-id]');
    if (editBtn) {
      const item = catalog.find(entry => entry.id === editBtn.dataset.editId);
      if (item) {
        closeDetail();
        openEditor(item);
      }
      return;
    }
    const deleteBtn = event.target.closest('[data-delete-id]');
    if (deleteBtn) {
      const id = deleteBtn.dataset.deleteId;
      const item = catalog.find(entry => entry.id === id);
      if (item?.custom) {
        catalog = catalog.filter(entry => entry.id !== id);
        saveUserItems();
        refreshFilterOptions(true);
        refreshView();
        closeDetail();
      }
    }
  });

  editorSheet?.addEventListener('click', (event) => {
    if (event.target.closest('[data-close-editor]')) closeEditor();
  });

  editorImageUrl?.addEventListener('input', syncEditorPreview);
  editorPickImage?.addEventListener('click', () => editorImageFile?.click());

  editorImageFile?.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string' && editorImageUrl) {
        editorImageUrl.value = reader.result;
        syncEditorPreview();
      }
    };
    reader.readAsDataURL(file);
  });

  editorForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const payload = {
      id: currentEditingId || makeId(),
      user: normalizeUserBySettings(editorUser?.value || ''),
      type: editorType?.value.trim() || '未分類',
      itemName: editorItemName?.value.trim() || '未命名周邊',
      series: editorSeries?.value.trim() || '',
      character: editorCharacter?.value.trim() || '',
      material: editorMaterial?.value.trim() || '',
      rarity: editorRarity?.value.trim() || '',
      source: editorSource?.value.trim() || '',
      count: Number.parseInt(editorCount?.value || '0', 10) || 0,
      wish: editorWish?.value === 'true',
      tags: (editorTags?.value || '').split(',').map(v => v.trim()).filter(Boolean),
      notes: editorNotes?.value.trim() || '',
      image: editorImageUrl?.value.trim() || '',
      custom: true
    };
    const index = catalog.findIndex(item => item.id === payload.id);
    if (index >= 0) catalog[index] = { ...catalog[index], ...payload };
    else catalog.unshift(payload);

    saveUserItems();
    refreshFilterOptions(true);
    refreshView();
    closeEditor();
  });

  designSheet?.addEventListener('click', (event) => {
    if (event.target.closest('[data-close-design]')) closeDesignSheet();
    
    const typeBtn = event.target.closest('[data-product-type]');
    if (typeBtn) {
      const type = typeBtn.dataset.productType;
      if (type) updateProductType(type);
    }
  });

  designPickBtn?.addEventListener('click', () => designUploadInput?.click());
  
  designUploadInput?.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateProductImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  });

  designPickModelBtn?.addEventListener('click', () => designModelUploadInput?.click());
  
  designModelUploadInput?.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    loadModelFromUrl(objectUrl);
  });

  designLoadModelBtn?.addEventListener('click', () => {
    const url = designModelUrl?.value?.trim();
    if (url) {
      loadModelFromUrl(url);
    }
  });

  designModelUrl?.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      const url = designModelUrl.value?.trim();
      if (url) {
        loadModelFromUrl(url);
      }
    }
  });

  designResetBtn?.addEventListener('click', resetDesign);
  designExportBtn?.addEventListener('click', exportDesign);

  ai3dPickImageBtn?.addEventListener('click', () => ai3dImageInput?.click());
  
  ai3dImageInput?.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    ai3dSelectedImage = file;
    const reader = new FileReader();
    reader.onload = () => {
      if (ai3dImagePreview) {
        ai3dImagePreview.src = reader.result;
        ai3dImagePreview.classList.remove('is-hidden');
      }
    };
    reader.readAsDataURL(file);
  });

  document.querySelectorAll('.ai-3d-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.aiTab;
      if (tab) switchAi3dTab(tab);
    });
  });

  ai3dGenerateBtn?.addEventListener('click', generateAi3dModel);

  window.addEventListener('message', (event) => {
    const data = event.data || {};
    if (data.type === 'settingsUpdated' || data.type === 'SX_USERS_UPDATED') {
      syncUsersFromSettings();
      refreshView();
    }
  });

  window.addEventListener('storage', (event) => {
    if (event.key === SETTINGS_USERS_KEY || event.key === SETTINGS_USER_NAME_KEY) {
      syncUsersFromSettings();
      refreshView();
    }
  });
}

function init() {
  initCatalog();
  syncUsersFromSettings();
  refreshFilterOptions(false);
  bindEvents();
  refreshView();
}

init();
console.log('Loaded app: guzi-guide');
