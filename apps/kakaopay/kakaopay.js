const STORAGE_KEY = 'sxiphone.kakaopay.ledger.v1';
const DEFAULT_BUDGET = 30000;

const CATEGORY_ICONS = {
  餐飲: 'fa-utensils',
  交通: 'fa-train-subway',
  購物: 'fa-bag-shopping',
  娛樂: 'fa-film',
  薪資: 'fa-wallet',
  其他: 'fa-receipt',
  禮物: 'fa-gift',
  主題: 'fa-palette',
  外送: 'fa-motorcycle',
  訂閱: 'fa-repeat',
  直播: 'fa-video',
  社群: 'fa-users',
  應用: 'fa-mobile-screen',
  周邊: 'fa-star',
  街機: 'fa-gamepad'
};

const state = {
  budget: DEFAULT_BUDGET,
  transactions: []
};

const els = {
  closeBtn: document.getElementById('closeBtn'),
  simulatePayBtn: document.getElementById('simulatePayBtn'),
  resetBtn: document.getElementById('resetBtn'),
  setBalanceBtn: document.getElementById('setBalanceBtn'),
  entryForm: document.getElementById('entryForm'),
  typeInput: document.getElementById('typeInput'),
  categoryInput: document.getElementById('categoryInput'),
  amountInput: document.getElementById('amountInput'),
  dateInput: document.getElementById('dateInput'),
  noteInput: document.getElementById('noteInput'),
  totalBalance: document.getElementById('totalBalance'),
  monthExpense: document.getElementById('monthExpense'),
  monthIncome: document.getElementById('monthIncome'),
  budgetText: document.getElementById('budgetText'),
  budgetFill: document.getElementById('budgetFill'),
  transactionList: document.getElementById('transactionList'),
  historyHint: document.getElementById('historyHint'),
  toast: document.getElementById('toast')
};

init();

function init() {
  bindEvents();
  setDefaultDate();
  loadState();
  render();
  listenForExternalSync();
}

function listenForExternalSync() {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) {
      loadState();
      render();
    }
  });
  
  window.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || typeof data !== 'object') return;
    
    // 處理新增交易
    if (data.type === 'ADD_TRANSACTION') {
      const { category, amount, note, source } = data;
      if (amount && amount > 0) {
        const txType = data.txType || 'expense';
        state.transactions.unshift(createTx(txType, category || '購物', amount, note || `來自 ${source || '外部應用'}`, toYMD(new Date())));
        persist();
        render();
        showToast(`已記錄：${formatCurrency(amount)}`);
      }
    }
    
    // 處理付款請求（從各應用程式）
    if (data.type === 'KAKAOPAY_PAYMENT_REQUEST') {
      handlePaymentRequest(data);
    }
    
    // 處理訂閱付款
    if (data.type === 'KAKAOPAY_SUBSCRIPTION') {
      handleSubscription(data);
    }
    
    // 處理外送訂單
    if (data.type === 'KAKAOPAY_DELIVERY') {
      handleDelivery(data);
    }
    
    // 處理禮物券購買
    if (data.type === 'KAKAOPAY_GIFT_PURCHASE') {
      handleGiftPurchase(data);
    }
    
    // 處理主題購買
    if (data.type === 'KAKAOPAY_THEME_PURCHASE') {
      handleThemePurchase(data);
    }
    
    // 處理周邊商品購買
    if (data.type === 'KAKAOPAY_MERCH_PURCHASE') {
      handleMerchPurchase(data);
    }
    
    // 處理跨平台購物
    if (data.type === 'KAKAOPAY_SHOP_PURCHASE') {
      handleShopPurchase(data);
    }
    
    // 處理創作支持
    if (data.type === 'KAKAOPAY_CREATOR_SUPPORT') {
      handleCreatorSupport(data);
    }
    
    // 處理街機廳儲值
    if (data.type === 'KAKAOPAY_ARCADE_TOPUP') {
      handleArcadeTopup(data);
    }
  });
}

function handlePaymentRequest(data) {
  const { amount, itemName, category, source } = data;
  if (!amount || amount <= 0) return;
  
  const summary = computeSummary();
  const availableBalance = summary.balance;
  
  if (availableBalance < amount) {
    window.parent?.postMessage({
      type: 'KAKAOPAY_PAYMENT_FAILED',
      reason: '餘額不足',
      source
    }, '*');
    return;
  }
  
  state.transactions.unshift(createTx('expense', category || '購物', amount, itemName || '消費', toYMD(new Date())));
  persist();
  render();
  showToast(`付款成功：${formatCurrency(amount)}`);
  
  window.parent?.postMessage({
    type: 'KAKAOPAY_PAYMENT_SUCCESS',
    amount,
    itemName,
    source,
    timestamp: Date.now()
  }, '*');
}

function handleSubscription(data) {
  const { amount, planName, source } = data;
  if (!amount || amount <= 0) return;
  
  state.transactions.unshift(createTx('expense', '訂閱', amount, `${planName || '訂閱方案'} - ${source || '應用'}`, toYMD(new Date())));
  persist();
  render();
  showToast(`訂閱付款：${formatCurrency(amount)}`);
}

function handleDelivery(data) {
  const { amount, storeName, items, source } = data;
  if (!amount || amount <= 0) return;
  
  const note = items ? `${storeName || '外送'} - ${items}` : `${storeName || '外送訂單'}`;
  state.transactions.unshift(createTx('expense', '外送', amount, note, toYMD(new Date())));
  persist();
  render();
  showToast(`外送付款：${formatCurrency(amount)}`);
}

function handleGiftPurchase(data) {
  const { amount, giftName, quantity, source } = data;
  if (!amount || amount <= 0) return;
  
  const note = `購買禮物券：${giftName}${quantity > 1 ? ` x${quantity}` : ''}`;
  state.transactions.unshift(createTx('expense', '禮物', amount, note, toYMD(new Date())));
  persist();
  render();
  showToast(`禮物券購買：${formatCurrency(amount)}`);
}

function handleThemePurchase(data) {
  const { amount, themeName, source } = data;
  if (!amount || amount <= 0) return;
  
  state.transactions.unshift(createTx('expense', '主題', amount, `購買主題：${themeName || '自訂主題'}`, toYMD(new Date())));
  persist();
  render();
  showToast(`主題購買：${formatCurrency(amount)}`);
}

function handleMerchPurchase(data) {
  const { amount, itemName, source } = data;
  if (!amount || amount <= 0) return;
  
  state.transactions.unshift(createTx('expense', '周邊', amount, `${itemName || '周邊商品'} - ${source || '谷子圖鑑'}`, toYMD(new Date())));
  persist();
  render();
  showToast(`周邊購買：${formatCurrency(amount)}`);
}

function handleCreatorSupport(data) {
  const { amount, creatorName, source } = data;
  if (!amount || amount <= 0) return;
  
  state.transactions.unshift(createTx('expense', '社群', amount, `支持創作者：${creatorName || '創作者'}`, toYMD(new Date())));
  persist();
  render();
  showToast(`支持創作者：${formatCurrency(amount)}`);
}

function handleShopPurchase(data) {
  const { amount, note, source } = data;
  if (!amount || amount <= 0) return;
  
  state.transactions.unshift(createTx('expense', '購物', amount, note || `跨平台購物 - ${source || '購物'}`, toYMD(new Date())));
  persist();
  render();
  showToast(`購物付款：${formatCurrency(amount)}`);
}

function handleArcadeTopup(data) {
  const { amount, coins, source } = data;
  if (!amount || amount <= 0) return;
  
  state.transactions.unshift(createTx('expense', '街機', amount, `街機廳儲值 - ${coins || amount}金幣`, toYMD(new Date())));
  persist();
  render();
  showToast(`街機廳儲值：${formatCurrency(amount)}`);
  
  window.parent?.postMessage({
    type: 'KAKAOPAY_ARCADE_TOPUP_SUCCESS',
    amount,
    coins: coins || amount,
    source,
    timestamp: Date.now()
  }, '*');
}

function openBalancePanel() {
  const summary = computeSummary();
  const currentBalance = summary.balance;
  
  const overlay = document.createElement('div');
  overlay.className = 'balance-panel-overlay';
  overlay.innerHTML = `
    <div class="balance-panel">
      <div class="balance-panel-header">
        <h3><i class="fa-solid fa-wallet"></i> 設定餘額</h3>
        <button class="close-btn" onclick="this.parentElement.parentElement.remove()">
          <i class="fa-solid fa-times"></i>
        </button>
      </div>
      <div class="balance-panel-content">
        <div class="current-balance">
          <span class="label">目前餘額</span>
          <span class="value">${formatCurrency(currentBalance)}</span>
        </div>
        <div class="balance-input-section">
          <label>
            <i class="fa-solid fa-plus-circle"></i> 新增收入
            <input type="number" id="incomeAmountInput" min="1" step="1" placeholder="輸入金額">
          </label>
          <button class="add-btn income-btn" onclick="addIncomeFromPanel()">
            <i class="fa-solid fa-plus"></i> 加入收入
          </button>
        </div>
        <div class="balance-input-section">
          <label>
            <i class="fa-solid fa-minus-circle"></i> 新增支出
            <input type="number" id="expenseAmountInput" min="1" step="1" placeholder="輸入金額">
          </label>
          <button class="add-btn expense-btn" onclick="addExpenseFromPanel()">
            <i class="fa-solid fa-minus"></i> 加入支出
          </button>
        </div>
        <div class="quick-amounts">
          <span class="quick-label">快速金額</span>
          <div class="quick-btns">
            <button onclick="setQuickAmount('income', 1000)">+1000</button>
            <button onclick="setQuickAmount('income', 5000)">+5000</button>
            <button onclick="setQuickAmount('income', 10000)">+10000</button>
            <button onclick="setQuickAmount('income', 30000)">+30000</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function setQuickAmount(type, amount) {
  const inputId = type === 'income' ? 'incomeAmountInput' : 'expenseAmountInput';
  const input = document.getElementById(inputId);
  if (input) {
    input.value = amount;
  }
}

function addIncomeFromPanel() {
  const input = document.getElementById('incomeAmountInput');
  const amount = Number(input?.value || 0);
  
  if (!amount || amount <= 0) {
    showToast('請輸入正確金額');
    return;
  }
  
  state.transactions.unshift(createTx('income', '薪資', amount, '手動新增收入', toYMD(new Date())));
  persist();
  render();
  
  input.value = '';
  showToast(`已新增收入：${formatCurrency(amount)}`);
  
  const overlay = document.querySelector('.balance-panel-overlay');
  if (overlay) {
    const currentBalance = overlay.querySelector('.current-balance .value');
    if (currentBalance) {
      const summary = computeSummary();
      currentBalance.textContent = formatCurrency(summary.balance);
    }
  }
}

function addExpenseFromPanel() {
  const input = document.getElementById('expenseAmountInput');
  const amount = Number(input?.value || 0);
  
  if (!amount || amount <= 0) {
    showToast('請輸入正確金額');
    return;
  }
  
  state.transactions.unshift(createTx('expense', '其他', amount, '手動新增支出', toYMD(new Date())));
  persist();
  render();
  
  input.value = '';
  showToast(`已新增支出：${formatCurrency(amount)}`);
  
  const overlay = document.querySelector('.balance-panel-overlay');
  if (overlay) {
    const currentBalance = overlay.querySelector('.current-balance .value');
    if (currentBalance) {
      const summary = computeSummary();
      currentBalance.textContent = formatCurrency(summary.balance);
    }
  }
}

function bindEvents() {
  els.closeBtn?.addEventListener('click', () => {
    window.parent?.postMessage({ type: 'closeApp' }, '*');
  });

  els.simulatePayBtn?.addEventListener('click', () => {
    showToast('已開啟付款介面（模擬）');
  });

  els.resetBtn?.addEventListener('click', resetDemoData);
  
  els.setBalanceBtn?.addEventListener('click', openBalancePanel);

  els.entryForm?.addEventListener('submit', handleAddEntry);
}

function setDefaultDate() {
  const today = toYMD(new Date());
  if (els.dateInput) {
    els.dateInput.value = today;
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      seedIfEmpty();
      return;
    }

    const parsed = JSON.parse(raw);
    state.budget = Number(parsed?.budget) > 0 ? Number(parsed.budget) : DEFAULT_BUDGET;
    state.transactions = Array.isArray(parsed?.transactions) ? parsed.transactions : [];
  } catch {
    seedIfEmpty();
  }
}

function seedIfEmpty() {
  state.budget = DEFAULT_BUDGET;
  state.transactions = [];
  persist();
}

function resetDemoData() {
  state.budget = DEFAULT_BUDGET;
  state.transactions = [];
  persist();
  setDefaultDate();
  render();
  showToast('已清除所有資料');
}

function handleAddEntry(event) {
  event.preventDefault();

  const type = els.typeInput?.value || 'expense';
  const category = els.categoryInput?.value || '其他';
  const amount = Number(els.amountInput?.value || 0);
  const date = els.dateInput?.value || toYMD(new Date());
  const note = (els.noteInput?.value || '').trim();

  if (!amount || amount <= 0) {
    showToast('請輸入正確金額');
    return;
  }

  state.transactions.unshift(createTx(type, category, amount, note, date));
  persist();
  render();

  if (els.amountInput) {
    els.amountInput.value = '';
  }
  if (els.noteInput) {
    els.noteInput.value = '';
  }

  showToast('記帳已加入');
}

function createTx(type, category, amount, note, date) {
  return {
    id: `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    type,
    category,
    amount: Number(amount),
    note,
    date: normalizeDate(date),
    createdAt: Date.now()
  };
}

function normalizeDate(input) {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) {
    return toYMD(new Date());
  }
  return toYMD(d);
}

function persist() {
  const payload = {
    budget: state.budget,
    transactions: state.transactions
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function render() {
  const summary = computeSummary();

  els.totalBalance.textContent = formatCurrency(summary.balance);
  els.monthExpense.textContent = formatCurrency(summary.monthExpense);
  els.monthIncome.textContent = formatCurrency(summary.monthIncome);
  els.budgetText.textContent = `${formatCurrency(summary.monthExpense)} / ${formatCurrency(state.budget)}`;

  const ratio = state.budget > 0 ? Math.min((summary.monthExpense / state.budget) * 100, 100) : 0;
  els.budgetFill.style.width = `${ratio.toFixed(1)}%`;

  renderTransactions();
}

function computeSummary() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  let income = 0;
  let expense = 0;
  let monthIncome = 0;
  let monthExpense = 0;

  state.transactions.forEach((tx) => {
    const amount = Number(tx.amount) || 0;
    const txDate = new Date(tx.date);

    if (tx.type === 'income') {
      income += amount;
      if (txDate.getFullYear() === year && txDate.getMonth() === month) {
        monthIncome += amount;
      }
    } else {
      expense += amount;
      if (txDate.getFullYear() === year && txDate.getMonth() === month) {
        monthExpense += amount;
      }
    }
  });

  return {
    balance: income - expense,
    monthIncome,
    monthExpense
  };
}

function renderTransactions() {
  const list = [...state.transactions].sort((a, b) => (b.date + b.createdAt) > (a.date + a.createdAt) ? 1 : -1);

  els.historyHint.textContent = `${list.length} 筆資料`;

  if (!list.length) {
    els.transactionList.innerHTML = '<div class="empty">尚無交易，請先新增一筆記帳。</div>';
    return;
  }

  els.transactionList.innerHTML = list.slice(0, 20).map((tx) => {
    const icon = CATEGORY_ICONS[tx.category] || CATEGORY_ICONS.其他;
    const title = escapeHtml(tx.note || tx.category);
    const sub = `${escapeHtml(tx.category)} · ${formatDate(tx.date)}`;
    const amountText = `${tx.type === 'expense' ? '-' : '+'}${formatCurrency(tx.amount)}`;
    return `
      <article class="transaction-item">
        <div class="transaction-icon"><i class="fa-solid ${icon}"></i></div>
        <div class="transaction-main">
          <p class="transaction-title">${title}</p>
          <p class="transaction-sub">${sub}</p>
        </div>
        <div class="transaction-amount ${tx.type}">${amountText}</div>
      </article>
    `;
  }).join('');
}

function showToast(message) {
  if (!els.toast) {
    return;
  }

  els.toast.textContent = message;
  els.toast.classList.add('show');

  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    els.toast.classList.remove('show');
  }, 1400);
}

function shiftDate(base, deltaDays) {
  const d = new Date(base);
  d.setDate(d.getDate() + deltaDays);
  return toYMD(d);
}

function toYMD(d) {
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(dateText) {
  const d = new Date(dateText);
  if (Number.isNaN(d.getTime())) {
    return dateText;
  }
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatCurrency(value) {
  const lang = localStorage.getItem('sxiphone_lang') || 'zh-Hant';
  const localeCode = window.getLocaleStringLang?.(lang) || 'zh-TW';
  return `NT$${Number(value || 0).toLocaleString(localeCode)}`;
}

function escapeHtml(input) {
  return String(input)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// iOS Safari / Android Chrome 儲存保護
const saveKakaopayData = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      budget: state.budget,
      transactions: state.transactions
    }));
  } catch (e) {
    console.warn('[kakaopay] 保存數據失敗:', e);
  }
};

window.addEventListener('pagehide', saveKakaopayData);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') saveKakaopayData();
});
window.addEventListener('message', (event) => {
  if (event.data?.type === 'APP_WILL_CLOSE') saveKakaopayData();
});

window.setQuickAmount = setQuickAmount;
window.addIncomeFromPanel = addIncomeFromPanel;
window.addExpenseFromPanel = addExpenseFromPanel;

