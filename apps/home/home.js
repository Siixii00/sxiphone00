let topPos = 50;
let leftPos = 50;
let stepCount = 0;
let currentMode = 'home';
let currentMap = 'city';
let lcdPanelOpen = false;

const maps = {
  city: {
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBdcRDw4pbG4SAV3_rO2UsC2zfrpfQTPzy6myCZbUKtZe768L2mdWfDrppi3jwRtmAKJYVFQxWR_oP3Lf2ahyO99N98HgcAUmPosvNWX8bgCayak6R03l1JsFlUflzDlkicxVvu1a0nKISOcBe3GK2Ive96tYXVA2LTmALAX1_fPv-CaixhEnhYYfbo46lGjwGNNg2bB8CZAnBk6Ax5kVmC8d_f3oeCkx_ppVyJW1W7hWgX9SH7H3eSwk1OZOZNEQyv8P5GmKabX0Sa',
    name: 'SINNOH CITY'
  },
  rural: {
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBdcRDw4pbG4SAV3_rO2UsC2zfrpfQTPzy6myCZbUKtZe768L2mdWfDrppi3jwRtmAKJYVFQxWR_oP3Lf2ahyO99N98HgcAUmPosvNWX8bgCayak6R03l1JsFlUflzDlkicxVvu1a0nKISOcBe3GK2Ive96tYXVA2LTmALAX1_fPv-CaixhEnhYYfbo46lGjwGNNg2bB8CZAnBk6Ax5kVmC8d_f3oeCkx_ppVyJW1W7hWgX9SH7H3eSwk1OZOZNEQyv8P5GmKabX0Sa',
    name: 'RURAL AREA'
  }
};

function toggleLcdPanel() {
  const panel = document.getElementById('bottom-screen');
  const icon = document.getElementById('hinge-icon');
  
  lcdPanelOpen = !lcdPanelOpen;
  
  if (lcdPanelOpen) {
    panel.style.maxHeight = '40vh';
    panel.style.padding = '16px';
    panel.style.opacity = '1';
    icon.textContent = 'expand_less';
  } else {
    panel.style.maxHeight = '0';
    panel.style.padding = '0';
    panel.style.opacity = '0';
    icon.textContent = 'expand_more';
  }
}

function switchMap(mapType) {
  if (!maps[mapType]) return;
  currentMap = mapType;
  
  const mapImg = document.querySelector('#home-top-content img');
  if (mapImg) {
    mapImg.src = maps[mapType].url;
    mapImg.alt = maps[mapType].name;
  }
}

function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const clockEl = document.getElementById('digital-clock');
  const customizeClock = document.getElementById('customize-clock');
  if (clockEl) clockEl.textContent = `${hours}:${minutes}`;
  if (customizeClock) customizeClock.textContent = `${hours}:${minutes}`;
  
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const dateDisplay = document.getElementById('date-display');
  if (dateDisplay) {
    dateDisplay.textContent = `${months[now.getMonth()]} ${String(now.getDate()).padStart(2, '0')} (${days[now.getDay()]})`;
  }
}

function incrementSteps() {
  stepCount++;
  const stepEl = document.getElementById('step-counter');
  if (stepEl) stepEl.textContent = stepCount.toLocaleString();
}

function movePlayer(direction) {
  const player = document.getElementById('player-sprite');
  if (!player) return;
  
  const step = 5;
  switch(direction) {
    case 'up': topPos -= step; break;
    case 'down': topPos += step; break;
    case 'left': leftPos -= step; break;
    case 'right': leftPos += step; break;
  }
  
  topPos = Math.max(15, Math.min(85, topPos));
  leftPos = Math.max(15, Math.min(85, leftPos));
  
  player.style.top = `${topPos}%`;
  player.style.left = `${leftPos}%`;
  
  incrementSteps();
}

document.addEventListener('keydown', (e) => {
  const keyMap = {
    'ArrowUp': 'up',
    'ArrowDown': 'down',
    'ArrowLeft': 'left',
    'ArrowRight': 'right'
  };
  
  if (keyMap[e.key]) {
    e.preventDefault();
    movePlayer(keyMap[e.key]);
  }
});

function switchMode(mode) {
  currentMode = mode;
  
  document.querySelectorAll('.mode-tab').forEach(tab => {
    tab.classList.remove('active');
    tab.classList.add('text-outline');
  });
  
  const activeTab = document.querySelector(`[data-mode="${mode}"]`);
  if (activeTab) {
    activeTab.classList.add('active');
    activeTab.classList.remove('text-outline');
  }
  
  const topContents = ['home-top-content', 'customize-top-content', 'builder-top-content'];
  const bottomContents = ['home-bottom-content', 'customize-bottom-content', 'builder-bottom-content'];
  
  topContents.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
  bottomContents.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
  
  const customizeNav = document.getElementById('customize-nav');
  
  switch(mode) {
    case 'home':
      document.getElementById('home-top-content').classList.remove('hidden');
      document.getElementById('home-bottom-content').classList.remove('hidden');
      if (customizeNav) customizeNav.style.display = 'none';
      break;
    case 'customize':
      document.getElementById('customize-top-content').classList.remove('hidden');
      document.getElementById('customize-bottom-content').classList.remove('hidden');
      if (customizeNav) customizeNav.style.display = 'flex';
      break;
    case 'builder':
      document.getElementById('builder-top-content').classList.remove('hidden');
      document.getElementById('builder-bottom-content').classList.remove('hidden');
      if (customizeNav) customizeNav.style.display = 'none';
      initCityBuilder();
      break;
  }
}

function showRemind() {
  alert('REMIND: Check your daily tasks!');
}

function showBag() {
  alert('BAG: Your inventory is empty.');
}

function saveGame() {
  const saveData = {
    steps: stepCount,
    playerPos: { top: topPos, left: leftPos },
    timestamp: new Date().toISOString()
  };
  localStorage.setItem('sinnoh_home_save', JSON.stringify(saveData));
  alert('Game saved successfully!');
}

function loadGame() {
  const saved = localStorage.getItem('sinnoh_home_save');
  if (saved) {
    const data = JSON.parse(saved);
    stepCount = data.steps || 0;
    topPos = data.playerPos?.top || 50;
    leftPos = data.playerPos?.left || 50;
    
    const stepEl = document.getElementById('step-counter');
    if (stepEl) stepEl.textContent = stepCount.toLocaleString();
    
    const player = document.getElementById('player-sprite');
    if (player) {
      player.style.top = `${topPos}%`;
      player.style.left = `${leftPos}%`;
    }
  }
}

function closeHomeApp() {
  if (window.parent && window.parent.closeApp) {
    window.parent.closeApp();
  } else {
    window.history.back();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updateClock();
  setInterval(updateClock, 1000);
  loadGame();
  
  const customizeNav = document.getElementById('customize-nav');
  if (customizeNav) customizeNav.style.display = 'none';
});
