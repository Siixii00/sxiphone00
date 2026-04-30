const GIFT_STORAGE_KEY = 'sx_gift_inventory';
const RECEIVED_GIFT_KEY = 'sx_received_gifts';
const KAKAOPAY_LEDGER_KEY = 'sxiphone.kakaopay.ledger.v1';

const giftCatalog = [
    {
        id: 'coffee_basic',
        name: '美式咖啡券',
        desc: '可兌換一杯美式咖啡',
        price: 80,
        originalPrice: 100,
        category: 'cafe',
        icon: '☕',
        bg: 'linear-gradient(135deg, #8B4513 0%, #D2691E 100%)',
        badge: '熱銷'
    },
    {
        id: 'coffee_latte',
        name: '拿鐵券',
        desc: '可兌換一杯拿鐵',
        price: 110,
        originalPrice: 140,
        category: 'cafe',
        icon: '🥤',
        bg: 'linear-gradient(135deg, #C4A484 0%, #E8D4B8 100%)'
    },
    {
        id: 'bubble_tea',
        name: '珍珠奶茶券',
        desc: '可兌換一杯珍珠奶茶',
        price: 50,
        originalPrice: 65,
        category: 'cafe',
        icon: '🧋',
        bg: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
        badge: '人氣'
    },
    {
        id: 'meal_set',
        name: '便當套餐券',
        desc: '可兌換一份便當套餐',
        price: 120,
        originalPrice: 150,
        category: 'food',
        icon: '🍱',
        bg: 'linear-gradient(135deg, #E57373 0%, #EF5350 100%)'
    },
    {
        id: 'ramen',
        name: '拉麵券',
        desc: '可兌換一碗拉麵',
        price: 180,
        originalPrice: 220,
        category: 'food',
        icon: '🍜',
        bg: 'linear-gradient(135deg, #FF8A65 0%, #FF7043 100%)'
    },
    {
        id: 'dessert',
        name: '甜點券',
        desc: '可兌換一份精緻甜點',
        price: 150,
        originalPrice: 180,
        category: 'food',
        icon: '🍰',
        bg: 'linear-gradient(135deg, #F48FB1 0%, #EC407A 100%)'
    },
    {
        id: 'movie_ticket',
        name: '電影票券',
        desc: '可兌換一張電影票',
        price: 250,
        originalPrice: 320,
        category: 'entertainment',
        icon: '🎬',
        bg: 'linear-gradient(135deg, #5C6BC0 0%, #3F51B5 100%)',
        badge: '限量'
    },
    {
        id: 'ktv',
        name: 'KTV 歡唱券',
        desc: '可兌換 2 小時歡唱',
        price: 300,
        originalPrice: 450,
        category: 'entertainment',
        icon: '🎤',
        bg: 'linear-gradient(135deg, #AB47BC 0%, #7B1FA2 100%)'
    },
    {
        id: 'shopping_100',
        name: '購物金 100',
        desc: '可折抵 100 元消費',
        price: 90,
        originalPrice: 100,
        category: 'shopping',
        icon: '🛍️',
        bg: 'linear-gradient(135deg, #FFD54F 0%, #FFC107 100%)'
    },
    {
        id: 'shopping_500',
        name: '購物金 500',
        desc: '可折抵 500 元消費',
        price: 420,
        originalPrice: 500,
        category: 'shopping',
        icon: '🎁',
        bg: 'linear-gradient(135deg, #FF7043 0%, #E64A19 100%)',
        badge: '超值'
    },
    {
        id: 'birthday',
        name: '生日禮物券',
        desc: '特別的生日驚喜',
        price: 500,
        originalPrice: 680,
        category: 'special',
        icon: '🎂',
        bg: 'linear-gradient(135deg, #F06292 0%, #E91E63 100%)'
    },
    {
        id: 'love',
        name: '愛心禮物券',
        desc: '表達心意的特別禮物',
        price: 999,
        originalPrice: 1288,
        category: 'special',
        icon: '💝',
        bg: 'linear-gradient(135deg, #EF5350 0%, #C62828 100%)',
        badge: '限定'
    }
];

let currentGift = null;
let currentQuantity = 1;
let selectedCategory = 'all';

const state = {
    inventory: [],
    received: []
};

const saveGiftData = () => {
    try {
        localStorage.setItem(GIFT_STORAGE_KEY, JSON.stringify(state.inventory));
        localStorage.setItem(RECEIVED_GIFT_KEY, JSON.stringify(state.received));
        console.log("禮物數據已保存至 localStorage");
    } catch (e) {
        console.error("保存禮物數據失敗:", e);
    }
};

const saveToPersistentStorage = async () => {
    saveGiftData();
    if (typeof localforage !== 'undefined') {
        try {
            const existingData = await localforage.getItem('sx_app_persisted_data') || {};
            await localforage.setItem('sx_app_persisted_data', {
                ...existingData,
                sx_gift_inventory: state.inventory,
                sx_received_gifts: state.received
            });
            console.log("禮物數據已保存至 IndexedDB");
        } catch (e) {
            console.error("IndexedDB 保存失敗:", e);
        }
    }
};

window.addEventListener('pagehide', () => {
    saveGiftData();
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        saveGiftData();
    }
});

window.addEventListener('message', (event) => {
    if (event.data?.type === 'APP_WILL_CLOSE') {
        saveGiftData();
    }
});

const els = {
    giftGrid: document.getElementById('gift-grid'),
    giftDetailModal: document.getElementById('gift-detail-modal'),
    modalGiftPreview: document.getElementById('modal-gift-preview'),
    modalGiftName: document.getElementById('modal-gift-name'),
    modalGiftDesc: document.getElementById('modal-gift-desc'),
    modalGiftPrice: document.getElementById('modal-gift-price'),
    qtyValue: document.getElementById('qty-value'),
    buyBtn: document.getElementById('buy-gift-btn'),
    sendModal: document.getElementById('send-modal'),
    sendPreview: document.getElementById('send-preview'),
    charSelect: document.getElementById('char-select'),
    giftMessage: document.getElementById('gift-message'),
    anonymousSend: document.getElementById('anonymous-send'),
    confirmSendBtn: document.getElementById('confirm-send-btn'),
    inventoryList: document.getElementById('inventory-list'),
    inventoryCount: document.getElementById('inventory-count'),
    receivedList: document.getElementById('received-list'),
    paymentModal: document.getElementById('payment-modal'),
    paymentAmount: document.getElementById('payment-amount'),
    paymentDetails: document.getElementById('payment-details'),
    toast: document.getElementById('toast')
};

function init() {
    loadState();
    renderGiftGrid();
    renderInventory();
    renderReceived();
    bindEvents();
    loadCharacters();
}

function loadState() {
    try {
        state.inventory = JSON.parse(localStorage.getItem(GIFT_STORAGE_KEY) || '[]');
        state.received = JSON.parse(localStorage.getItem(RECEIVED_GIFT_KEY) || '[]');
    } catch {
        state.inventory = [];
        state.received = [];
    }
}

function saveState() {
    localStorage.setItem(GIFT_STORAGE_KEY, JSON.stringify(state.inventory));
    localStorage.setItem(RECEIVED_GIFT_KEY, JSON.stringify(state.received));
}

function loadCharacters() {
    const masks = JSON.parse(localStorage.getItem('sx_masks') || '[]');
    const charSelect = els.charSelect;
    if (!charSelect) return;

    charSelect.innerHTML = '<option value="">選擇角色</option>';
    
    const activeChar = masks[0] || {};
    if (activeChar.name) {
        charSelect.innerHTML += `<option value="${activeChar.name}" selected>${activeChar.name}</option>`;
    }
    
    masks.slice(1).forEach((mask, i) => {
        if (mask.name) {
            charSelect.innerHTML += `<option value="${mask.name}">${mask.name}</option>`;
        }
    });
}

function renderGiftGrid() {
    const filtered = selectedCategory === 'all' 
        ? giftCatalog 
        : giftCatalog.filter(g => g.category === selectedCategory);

    els.giftGrid.innerHTML = filtered.map(gift => `
        <div class="gift-card" data-gift-id="${gift.id}">
            <div class="gift-image" style="background: ${gift.bg};">
                ${gift.icon}
                ${gift.badge ? `<span class="gift-badge">${gift.badge}</span>` : ''}
            </div>
            <div class="gift-info">
                <h4 class="gift-name">${gift.name}</h4>
                <div>
                    <span class="gift-price">NT$${gift.price}</span>
                    ${gift.originalPrice ? `<span class="gift-original-price">NT$${gift.originalPrice}</span>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function renderInventory() {
    const count = state.inventory.reduce((sum, item) => sum + item.quantity, 0);
    els.inventoryCount.textContent = `${count} 張`;

    if (state.inventory.length === 0) {
        els.inventoryList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-gift"></i>
                <p>尚無禮物券</p>
                <span>前往商店購買吧！</span>
            </div>
        `;
        return;
    }

    els.inventoryList.innerHTML = state.inventory.map(item => {
        const gift = giftCatalog.find(g => g.id === item.giftId);
        if (!gift) return '';
        return `
            <div class="inventory-item" data-item-id="${item.id}">
                <div class="inventory-item-icon" style="background: ${gift.bg};">
                    ${gift.icon}
                </div>
                <div class="inventory-item-info">
                    <h4>${gift.name} x${item.quantity}</h4>
                    <span>購買於 ${formatDate(item.purchasedAt)}</span>
                </div>
                <div class="inventory-item-actions">
                    <button class="use-btn" onclick="useGift('${item.id}')">使用</button>
                    <button class="gift-btn" onclick="sendFromInventory('${item.id}')">贈送</button>
                </div>
            </div>
        `;
    }).join('');
}

function renderReceived() {
    if (state.received.length === 0) {
        els.receivedList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>尚未收到禮物券</p>
                <span>等待驚喜吧！</span>
            </div>
        `;
        return;
    }

    els.receivedList.innerHTML = state.received.map(item => {
        const gift = giftCatalog.find(g => g.id === item.giftId);
        if (!gift) return '';
        return `
            <div class="received-item">
                <div class="received-item-icon" style="background: ${gift.bg};">
                    ${gift.icon}
                </div>
                <div class="received-item-info">
                    <h4>${gift.name}</h4>
                    <span>收到於 ${formatDate(item.receivedAt)}</span>
                    ${item.message ? `<div class="received-item-message">"${item.message}"</div>` : ''}
                    <div class="received-item-sender">
                        ${item.anonymous ? '匿名' : (item.senderName || '神秘人')} 送給你
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function formatDate(timestamp) {
    const d = new Date(timestamp);
    return `${d.getMonth() + 1}/${d.getDate()}`;
}

function showGiftDetail(giftId) {
    const gift = giftCatalog.find(g => g.id === giftId);
    if (!gift) return;

    currentGift = gift;
    currentQuantity = 1;

    els.modalGiftPreview.innerHTML = gift.icon;
    els.modalGiftPreview.style.background = gift.bg;
    els.modalGiftName.textContent = gift.name;
    els.modalGiftDesc.textContent = gift.desc;
    els.modalGiftPrice.textContent = `NT$${gift.price}`;
    els.qtyValue.textContent = '1';

    els.giftDetailModal.classList.add('active');
}

function closeGiftDetail() {
    els.giftDetailModal.classList.remove('active');
    currentGift = null;
}

function updateQuantity(delta) {
    currentQuantity = Math.max(1, Math.min(10, currentQuantity + delta));
    els.qtyValue.textContent = currentQuantity;
    if (currentGift) {
        els.modalGiftPrice.textContent = `NT$${currentGift.price * currentQuantity}`;
    }
}

function startPurchase() {
    if (!currentGift) return;

    const total = currentGift.price * currentQuantity;

    els.paymentAmount.textContent = `NT$ ${total.toLocaleString()}`;
    els.paymentDetails.innerHTML = `
        <div><strong>商品：</strong>${currentGift.name} x${currentQuantity}</div>
        <div><strong>單價：</strong>NT$${currentGift.price}</div>
    `;

    closeGiftDetail();
    els.paymentModal.classList.add('active');

    const pinInputs = document.querySelectorAll('.pin-input');
    pinInputs.forEach(input => input.value = '');
    pinInputs[0]?.focus();
}

function closePayment() {
    els.paymentModal.classList.remove('active');
}

function confirmPayment() {
    const pinInputs = document.querySelectorAll('.pin-input');
    const pin = Array.from(pinInputs).map(i => i.value).join('');

    if (pin.length !== 4) {
        showToast('請輸入 4 位數密碼');
        return;
    }

    const total = currentGift.price * currentQuantity;

    const ledgerRaw = localStorage.getItem(KAKAOPAY_LEDGER_KEY);
    let ledger;
    try {
        ledger = JSON.parse(ledgerRaw || '{}');
    } catch {
        ledger = {};
    }

    const budget = Number(ledger?.budget) || 30000;
    const transactions = Array.isArray(ledger?.transactions) ? ledger.transactions : [];

    const summary = computeBalance(transactions);
    const availableBalance = summary.income - summary.expense;

    if (availableBalance < total) {
        showToast('餘額不足');
        return;
    }

    transactions.unshift({
        id: `tx_${Date.now()}`,
        type: 'expense',
        category: '禮物',
        amount: total,
        note: `購買禮物券：${currentGift.name} x${currentQuantity}`,
        date: getTodayYMD(),
        createdAt: Date.now(),
        source: 'gift-shop'
    });

    localStorage.setItem(KAKAOPAY_LEDGER_KEY, JSON.stringify({ budget, transactions }));

    // 發送付款通知到 kakaopay
    window.parent?.postMessage({
        type: 'KAKAOPAY_GIFT_PURCHASE',
        amount: total,
        giftName: currentGift.name,
        quantity: currentQuantity,
        source: 'gift-shop'
    }, '*');

    addToInventory(currentGift.id, currentQuantity);

    closePayment();
    showToast('購買成功！禮物券已加入庫存');

    setTimeout(() => {
        showSendModal();
    }, 500);
}

function computeBalance(transactions) {
    let income = 0;
    let expense = 0;

    transactions.forEach(tx => {
        if (tx.type === 'income') {
            income += Number(tx.amount) || 0;
        } else {
            expense += Number(tx.amount) || 0;
        }
    });

    return { income, expense };
}

function getTodayYMD() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addToInventory(giftId, quantity) {
    const existing = state.inventory.find(item => item.giftId === giftId);
    if (existing) {
        existing.quantity += quantity;
    } else {
        state.inventory.push({
            id: `inv_${Date.now()}`,
            giftId,
            quantity,
            purchasedAt: Date.now()
        });
    }
    saveState();
    renderInventory();
}

function showSendModal() {
    if (!currentGift) return;

    const sendTarget = document.getElementById('send-target');
    const charSelectOption = document.getElementById('char-select-option');

    els.sendPreview.innerHTML = `
        <div class="send-preview-icon" style="background: ${currentGift.bg};">
            ${currentGift.icon}
        </div>
        <div class="send-preview-info">
            <h4>${currentGift.name}</h4>
            <span>數量：${currentQuantity}</span>
        </div>
    `;

    els.giftMessage.value = '';
    els.anonymousSend.checked = false;
    loadCharacters();

    els.sendModal.classList.add('active');
}

function closeSendModal() {
    els.sendModal.classList.remove('active');
}

function confirmSend() {
    if (!currentGift) return;

    const sendTarget = document.getElementById('send-target').value;
    const charName = els.charSelect.value;
    const message = els.giftMessage.value.trim();
    const anonymous = els.anonymousSend.checked;

    const userName = localStorage.getItem('sx_user_name') || '我';

    const giftData = {
        id: `recv_${Date.now()}`,
        giftId: currentGift.id,
        receivedAt: Date.now(),
        senderName: anonymous ? '' : userName,
        anonymous,
        message,
        source: sendTarget
    };

    if (sendTarget === 'char') {
        state.received.unshift(giftData);
        saveState();
        renderReceived();
        showToast(`已將 ${currentGift.name} 送給 ${charName || '角色'}`);

        sendGiftToChat(currentGift, message, anonymous, charName);
    } else if (sendTarget === 'bubbles') {
        sendGiftToBubbles(currentGift, message, anonymous);
        showToast(`已將 ${currentGift.name} 發送到 Bubbles`);
    }

    closeSendModal();
}

function sendGiftToChat(gift, message, anonymous, charName) {
    const userName = localStorage.getItem('sx_user_name') || '我';
    const sender = anonymous ? '神秘人' : userName;

    const giftBubbleHtml = `
        <div class="gift-bubble" style="background: ${gift.bg}; padding: 12px 16px; border-radius: 16px; display: inline-block;">
            <div style="font-size: 32px; margin-bottom: 8px;">${gift.icon}</div>
            <div style="font-weight: 600; color: #fff;">${gift.name}</div>
            ${message ? `<div style="font-size: 12px; color: rgba(255,255,255,0.8); margin-top: 4px;">"${message}"</div>` : ''}
        </div>
    `;

    const history = JSON.parse(localStorage.getItem('sx_chat_history') || '[]');
    history.push({ 
        role: 'user', 
        content: `${sender} 送出了禮物券：${gift.name}${message ? `，留言：「${message}」` : ''}`
    });
    localStorage.setItem('sx_chat_history', JSON.stringify(history));

    if (window.parent && window.parent !== window) {
        window.parent.postMessage({
            type: 'GIFT_SENT_TO_CHAT',
            gift: {
                id: gift.id,
                name: gift.name,
                icon: gift.icon,
                bg: gift.bg,
                message,
                sender,
                timestamp: Date.now()
            }
        }, '*');
    }
}

function sendGiftToBubbles(gift, message, anonymous) {
    const userName = localStorage.getItem('sx_user_name') || '我';
    const sender = anonymous ? '神秘人' : userName;

    if (window.parent && window.parent !== window) {
        window.parent.postMessage({
            type: 'GIFT_SENT_TO_BUBBLES',
            gift: {
                id: gift.id,
                name: gift.name,
                icon: gift.icon,
                bg: gift.bg,
                message,
                sender,
                timestamp: Date.now()
            }
        }, '*');
    }
}

function useGift(itemId) {
    const item = state.inventory.find(i => i.id === itemId);
    if (!item) return;

    const gift = giftCatalog.find(g => g.id === item.giftId);
    if (!gift) return;

    if (confirm(`確定要使用「${gift.name}」嗎？\n\n此禮物券將被核銷。`)) {
        if (item.quantity > 1) {
            item.quantity -= 1;
        } else {
            const idx = state.inventory.findIndex(i => i.id === itemId);
            if (idx >= 0) state.inventory.splice(idx, 1);
        }

        saveState();
        renderInventory();
        showToast(`已使用 ${gift.name}！`);

        if (window.parent && window.parent !== window) {
            window.parent.postMessage({
                type: 'GIFT_USED',
                gift: {
                    id: gift.id,
                    name: gift.name,
                    icon: gift.icon
                }
            }, '*');
        }
    }
}

function sendFromInventory(itemId) {
    const item = state.inventory.find(i => i.id === itemId);
    if (!item) return;

    currentGift = giftCatalog.find(g => g.id === item.giftId);
    currentQuantity = 1;

    if (currentGift) {
        showSendModal();
    }
}

function showToast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.add('show');
    setTimeout(() => {
        els.toast.classList.remove('show');
    }, 2000);
}

function bindEvents() {
    document.querySelectorAll('.shop-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            const target = document.getElementById(`tab-${tab.dataset.tab}`);
            if (target) target.classList.add('active');
        });
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedCategory = btn.dataset.category;
            renderGiftGrid();
        });
    });

    els.giftGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.gift-card');
        if (card) {
            showGiftDetail(card.dataset.giftId);
        }
    });

    document.getElementById('modal-close')?.addEventListener('click', closeGiftDetail);
    document.getElementById('qty-minus')?.addEventListener('click', () => updateQuantity(-1));
    document.getElementById('qty-plus')?.addEventListener('click', () => updateQuantity(1));
    els.buyBtn?.addEventListener('click', startPurchase);

    document.getElementById('send-modal-close')?.addEventListener('click', closeSendModal);
    els.confirmSendBtn?.addEventListener('click', confirmSend);

    document.getElementById('payment-cancel')?.addEventListener('click', closePayment);
    document.getElementById('payment-confirm')?.addEventListener('click', confirmPayment);

    const pinInputs = document.querySelectorAll('.pin-input');
    pinInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.target.value && index < pinInputs.length - 1) {
                pinInputs[index + 1].focus();
            }
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                pinInputs[index - 1].focus();
            }
        });
    });

    const sendTarget = document.getElementById('send-target');
    const charSelectOption = document.getElementById('char-select-option');
    sendTarget?.addEventListener('change', () => {
        if (charSelectOption) {
            charSelectOption.style.display = sendTarget.value === 'char' ? 'flex' : 'none';
        }
    });

    els.giftDetailModal?.addEventListener('click', (e) => {
        if (e.target === els.giftDetailModal) closeGiftDetail();
    });

    els.sendModal?.addEventListener('click', (e) => {
        if (e.target === els.sendModal) closeSendModal();
    });

    els.paymentModal?.addEventListener('click', (e) => {
        if (e.target === els.paymentModal) closePayment();
    });

    window.addEventListener('message', (event) => {
        const data = event.data;
        if (!data || typeof data !== 'object') return;

        if (data.type === 'GIFT_SEND_TO_FAN') {
            const gift = giftCatalog.find(g => g.id === data.giftId);
            if (gift) {
                state.received.push({
                    id: `recv_${Date.now()}`,
                    giftId: gift.id,
                    receivedAt: Date.now(),
                    senderName: data.senderName || '',
                    anonymous: data.anonymous || false,
                    message: data.message || '',
                    source: 'bubbles'
                });
                saveState();
                renderReceived();
                showToast(`收到來自 ${data.anonymous ? '神秘人' : data.senderName} 的禮物券！`);
            }
        }
    });
}

init();
