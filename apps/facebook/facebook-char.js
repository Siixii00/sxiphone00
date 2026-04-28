const charSelect = document.getElementById('char-account-select');
const openBtn = document.getElementById('char-account-open');
const backBtn = document.getElementById('char-back');

const CHAR_LIST_KEY = 'sx_characters';
const ACTIVE_CHAR_KEY = 'sx_char_name';

function loadJSON(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function renderChars() {
  if (!charSelect) return;
  const list = loadJSON(CHAR_LIST_KEY, []);
  const chars = Array.isArray(list) ? list : [];
  const active = localStorage.getItem(ACTIVE_CHAR_KEY) || '';
  if (!chars.length) {
    charSelect.innerHTML = '<option value="">尚未建立角色</option>';
    return;
  }
  charSelect.innerHTML = chars.map((char) => {
    const name = char?.name || '未命名角色';
    const selected = name === active ? 'selected' : '';
    return `<option value="${name}" ${selected}>${name}</option>`;
  }).join('');
}

openBtn?.addEventListener('click', () => {
  const selected = charSelect?.value || '';
  if (selected) {
    localStorage.setItem(ACTIVE_CHAR_KEY, selected);
  }
  window.location.replace('facebook.html');
});

backBtn?.addEventListener('click', () => {
  window.location.replace('facebook-profile.html');
});

renderChars();
