const KAKAOPAY_STORAGE_KEY = 'sxiphone.kakaopay.ledger.v1';

let timerInterval = null;
let countdown = 60;

const els = {
  balanceDisplay: document.getElementById('balanceDisplay'),
  refreshBtn: document.getElementById('refreshBtn'),
  barcodeSvg: document.getElementById('barcodeSvg'),
  barcodeNumber: document.getElementById('barcodeNumber'),
  qrcodeCanvas: document.getElementById('qrcodeCanvas'),
  qrcodeNumber: document.getElementById('qrcodeNumber'),
  timerFill: document.getElementById('timerFill'),
  timerCount: document.getElementById('timerCount'),
  openKakaopayBtn: document.getElementById('openKakaopayBtn')
};

init();

function init() {
  loadBalance();
  generateCodes();
  startTimer();
  bindEvents();
  listenForStorage();
}

function loadBalance() {
  try {
    const raw = localStorage.getItem(KAKAOPAY_STORAGE_KEY);
    if (!raw) {
      els.balanceDisplay.textContent = 'NT$0';
      return;
    }
    const data = JSON.parse(raw);
    const transactions = Array.isArray(data?.transactions) ? data.transactions : [];
    let income = 0;
    let expense = 0;
    transactions.forEach(tx => {
      const amount = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        income += amount;
      } else {
        expense += amount;
      }
    });
    const balance = income - expense;
    els.balanceDisplay.textContent = formatCurrency(balance);
  } catch {
    els.balanceDisplay.textContent = 'NT$0';
  }
}

function generateCodes() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const barcode = `KP${timestamp}${random}`.substring(0, 20);
  const qrcode = `KAKAOPAY://${timestamp}/${random}`;
  
  renderBarcode(barcode);
  renderQRCode(qrcode);
  els.barcodeNumber.textContent = barcode;
  els.qrcodeNumber.textContent = qrcode;
}

function renderBarcode(data) {
  const svg = els.barcodeSvg;
  svg.innerHTML = '';
  
  const barWidth = 2;
  const barHeight = 80;
  const quietZone = 10;
  
  const pattern = encodeCode128(data);
  const totalWidth = pattern.length * barWidth + quietZone * 2;
  
  svg.setAttribute('width', totalWidth);
  svg.setAttribute('height', barHeight + 20);
  svg.setAttribute('viewBox', `0 0 ${totalWidth} ${barHeight + 20}`);
  
  let x = quietZone;
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === '1') {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', 0);
      rect.setAttribute('width', barWidth);
      rect.setAttribute('height', barHeight);
      rect.setAttribute('fill', '#1a1a1a');
      svg.appendChild(rect);
    }
    x += barWidth;
  }
}

function encodeCode128(data) {
  let pattern = '11010000100';
  const patterns = [
    '11011001100', '11001101100', '11001100110', '10010011000', '10010001100',
    '10001001100', '10011001000', '10011000100', '10001100100', '11001001000',
    '11001000100', '11000100100', '10110011100', '10011011100', '10011001110',
    '10111001100', '10011101100', '10011100110', '11001110010', '11001011100',
    '11001001110', '11011100100', '11001110100', '11101101110', '11101001100',
    '11100101100', '11100100110', '11101100100', '11100110100', '11100110010'
  ];
  
  for (let i = 0; i < data.length; i++) {
    const charCode = data.charCodeAt(i);
    const index = (charCode - 32) % patterns.length;
    pattern += patterns[index >= 0 ? index : 0];
  }
  
  pattern += '1100011101011';
  return pattern;
}

function renderQRCode(data) {
  const canvas = els.qrcodeCanvas;
  const ctx = canvas.getContext('2d');
  const size = 160;
  const moduleCount = 21;
  const moduleSize = Math.floor(size / moduleCount);
  
  canvas.width = size;
  canvas.height = size;
  
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  
  const qrMatrix = generateQRMatrix(data, moduleCount);
  
  ctx.fillStyle = '#1a1a1a';
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (qrMatrix[row][col]) {
        ctx.fillRect(col * moduleSize, row * moduleSize, moduleSize, moduleSize);
      }
    }
  }
  
  drawFinderPattern(ctx, 0, 0, moduleSize);
  drawFinderPattern(ctx, moduleCount - 7, 0, moduleSize);
  drawFinderPattern(ctx, 0, moduleCount - 7, moduleSize);
}

function generateQRMatrix(data, size) {
  const matrix = [];
  for (let i = 0; i < size; i++) {
    matrix[i] = [];
    for (let j = 0; j < size; j++) {
      matrix[i][j] = false;
    }
  }
  
  const hash = simpleHash(data);
  let bitIndex = 0;
  
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (!isFinderArea(i, j, size)) {
        matrix[i][j] = ((hash >> (bitIndex % 32)) & 1) === 1;
        bitIndex++;
      }
    }
  }
  
  return matrix;
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function isFinderArea(row, col, size) {
  if (row < 8 && col < 8) return true;
  if (row < 8 && col >= size - 8) return true;
  if (row >= size - 8 && col < 8) return true;
  return false;
}

function drawFinderPattern(ctx, startRow, startCol, moduleSize) {
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(startCol * moduleSize, startRow * moduleSize, 7 * moduleSize, 7 * moduleSize);
  
  ctx.fillStyle = '#ffffff';
  ctx.fillRect((startCol + 1) * moduleSize, (startRow + 1) * moduleSize, 5 * moduleSize, 5 * moduleSize);
  
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect((startCol + 2) * moduleSize, (startRow + 2) * moduleSize, 3 * moduleSize, 3 * moduleSize);
}

function startTimer() {
  countdown = 60;
  updateTimerDisplay();
  
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  
  timerInterval = setInterval(() => {
    countdown--;
    updateTimerDisplay();
    
    if (countdown <= 0) {
      generateCodes();
      countdown = 60;
      updateTimerDisplay();
    }
  }, 1000);
}

function updateTimerDisplay() {
  els.timerCount.textContent = countdown;
  const percentage = (countdown / 60) * 100;
  els.timerFill.style.width = `${percentage}%`;
}

function bindEvents() {
  els.refreshBtn?.addEventListener('click', () => {
    generateCodes();
    countdown = 60;
    updateTimerDisplay();
    showToast('條碼已更新');
  });
  
  els.openKakaopayBtn?.addEventListener('click', () => {
    window.parent?.postMessage({ type: 'openApp', appId: 'kakaopay' }, '*');
  });
  
  document.querySelectorAll('.code-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.code-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.code-panel').forEach(p => p.classList.remove('active'));
      
      tab.classList.add('active');
      const targetPanel = document.getElementById(`${tab.dataset.tab}-panel`);
      targetPanel?.classList.add('active');
    });
  });
}

function listenForStorage() {
  window.addEventListener('storage', (event) => {
    if (event.key === KAKAOPAY_STORAGE_KEY) {
      loadBalance();
    }
  });
  
  window.addEventListener('message', (event) => {
    if (event.data?.type === 'KAKAOPAY_BALANCE_UPDATED') {
      loadBalance();
    }
  });
}

function formatCurrency(value) {
  const lang = localStorage.getItem('sxiphone_lang') || 'zh-Hant';
  const localeCode = lang === 'en' ? 'en-US' : 'zh-TW';
  return `NT$${Number(value || 0).toLocaleString(localeCode)}`;
}

function showToast(message) {
  const existing = document.querySelector('.code-toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = 'code-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 1500);
}
