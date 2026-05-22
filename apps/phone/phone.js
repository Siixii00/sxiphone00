const favorites = [
    { name: '小魚', number: '0912123456', label: '家人' },
    { name: '工作群組', number: '0223456789', label: '辦公室' },
    { name: '慢跑同伴', number: '0987654321', label: '朋友' }
];

let historyEntries = [
    { id: 'h1', name: '小魚', number: '0912123456', type: 'outgoing', timestamp: Date.now() - 1000 * 60 * 30, duration: 186 },
    { id: 'h2', name: '慢跑同伴', number: '0987654321', type: 'incoming', timestamp: Date.now() - 1000 * 60 * 90, duration: 85 },
    { id: 'h3', name: '', number: '0423457890', type: 'missed', timestamp: Date.now() - 1000 * 60 * 160, duration: 0 }
];

const RECORDINGS_KEY = 'sx_voice_call_recordings';

const getRecordings = () => {
    try {
        const raw = localStorage.getItem(RECORDINGS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

const saveRecordings = (recordings) => {
    localStorage.setItem(RECORDINGS_KEY, JSON.stringify(recordings));
};

const addRecording = (recording) => {
    const recordings = getRecordings();
    recordings.unshift(recording);
    if (recordings.length > 100) recordings.pop();
    saveRecordings(recordings);
};

const deleteRecording = (id) => {
    const recordings = getRecordings().filter(r => r.id !== id);
    saveRecordings(recordings);
};

const clearAllRecordings = () => {
    saveRecordings([]);
};

window.saveVoiceCallRecording = function(recordingData) {
    const recording = {
        id: `rec-${Date.now()}`,
        charName: recordingData.charName || '未知',
        timestamp: recordingData.timestamp || Date.now(),
        duration: recordingData.duration || 0,
        audioData: recordingData.audioData,
        mimeType: recordingData.mimeType || 'audio/webm',
        transcript: recordingData.transcript || []
    };
    addRecording(recording);
    console.log('Voice call recording saved:', recording.id);
};

const formatDuration = (seconds) => {
    if (!seconds) return '未接';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (!mins) return `${secs} 秒`;
    return `${mins} 分 ${secs.toString().padStart(2, '0')} 秒`;
};

const formatTimestamp = (ts) => {
    const date = new Date(ts);
    const now = new Date();
    const sameDay = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    const time = date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
    if (sameDay) return `今天 ${time}`;
    if (isYesterday) return `昨天 ${time}`;
    return date.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' }) + ' ' + time;
};

const renderRecordings = () => {
    const list = document.getElementById('recordings-list');
    if (!list) return;
    
    const recordings = getRecordings();
    list.innerHTML = '';
    
    if (!recordings.length) {
        const empty = document.createElement('li');
        empty.className = 'recordings-empty';
        empty.innerHTML = '<i class="fas fa-microphone-slash"></i><p>尚無錄音紀錄</p><span>通話錄音將自動保存在這裡</span>';
        list.appendChild(empty);
        return;
    }

    recordings.forEach(rec => {
        const item = document.createElement('li');
        item.className = 'recording-item';
        
        const playBtn = document.createElement('button');
        playBtn.className = 'recording-play';
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        playBtn.addEventListener('click', () => playRecording(rec));
        
        const info = document.createElement('div');
        info.className = 'recording-info';
        info.innerHTML = `
            <h3><i class="fas fa-user"></i> ${rec.charName}</h3>
            <p>${formatTimestamp(rec.timestamp)} · ${formatDuration(rec.duration)}</p>
        `;

        if (rec.transcript && rec.transcript.length > 0) {
            const transcriptToggle = document.createElement('button');
            transcriptToggle.className = 'transcript-toggle';
            transcriptToggle.innerHTML = '<i class="fas fa-comment-dots"></i> 通話內容';
            transcriptToggle.addEventListener('click', () => {
                const details = item.querySelector('.recording-transcript');
                if (details) {
                    details.classList.toggle('open');
                    transcriptToggle.classList.toggle('active', details.classList.contains('open'));
                }
            });
            info.appendChild(transcriptToggle);

            const transcriptDiv = document.createElement('div');
            transcriptDiv.className = 'recording-transcript';
            rec.transcript.forEach(entry => {
                const line = document.createElement('div');
                line.className = `transcript-line ${entry.role === 'user' ? 'transcript-user' : 'transcript-char'}`;
                const label = entry.role === 'user' ? '我' : rec.charName;
                line.innerHTML = `<span class="transcript-label">${label}:</span> ${entry.text}`;
                transcriptDiv.appendChild(line);
            });
            item.append(playBtn, info, transcriptDiv);
        } else {
            item.append(playBtn, info);
        }

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'recording-actions';

        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'recording-download';
        downloadBtn.innerHTML = '<i class="fas fa-download"></i>';
        downloadBtn.addEventListener('click', () => downloadRecording(rec));
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'recording-delete';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.addEventListener('click', () => {
            if (confirm('確定刪除此錄音？')) {
                deleteRecording(rec.id);
                renderRecordings();
            }
        });
        
        actionsDiv.append(downloadBtn, deleteBtn);
        item.appendChild(actionsDiv);
        list.appendChild(item);
    });
};

let currentAudio = null;

const playRecording = (rec) => {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    
    if (rec.audioData) {
        const audio = new Audio(rec.audioData);
        currentAudio = audio;
        audio.play().catch(err => console.error('Playback error:', err));
    }
};

const downloadRecording = (rec) => {
    if (!rec.audioData) return;
    
    const link = document.createElement('a');
    link.href = rec.audioData;
    link.download = `通話錄音_${rec.charName}_${new Date(rec.timestamp).toISOString().slice(0,10)}.webm`;
    link.click();
};

const state = {
    number: '',
    silent: false,
    recordings: [],
    history: []
};

const els = {
    dialedNumber: document.getElementById('dialed-number'),
    statusBanner: document.getElementById('status-banner'),
    keypad: document.getElementById('keypad'),
    callButton: document.getElementById('call-button'),
    backspace: document.getElementById('backspace'),
    holdButton: document.getElementById('hold-button'),
    saveContact: document.getElementById('save-contact'),
    clearNumber: document.getElementById('clear-number'),
    historyList: document.getElementById('history-list'),
    historyClear: document.getElementById('history-clear'),
    favoriteGrid: document.getElementById('favorite-grid'),
    favoriteShuffle: document.getElementById('favorite-shuffle'),
    toggleSilent: document.getElementById('toggle-silent'),
    connectionStatus: document.getElementById('connection-status'),
    closeButton: document.getElementById('phone-close')
};

let statusTimer = null;

const formatDialText = (value) => {
    const condensed = value.replace(/\s+/g, '');
    if (/^\d+$/.test(condensed)) {
        return condensed.replace(/(.{4})/g, '$1 ').trim();
    }
    return condensed;
};

const findContactByNumber = (number) => {
    const target = number.replace(/\D/g, '');
    return favorites.find(contact => contact.number.replace(/\D/g, '') === target);
};

const updateDialedNumber = () => {
    if (!els.dialedNumber) return;
    if (!state.number) {
        els.dialedNumber.textContent = '輸入號碼';
        els.dialedNumber.classList.add('muted');
        return;
    }
    els.dialedNumber.textContent = formatDialText(state.number) || state.number;
    els.dialedNumber.classList.remove('muted');
};

const setStatus = (message) => {
    if (!els.statusBanner) return;
    els.statusBanner.textContent = message;
    els.statusBanner.classList.add('active');
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => {
        els.statusBanner?.classList.remove('active');
    }, 1600);
};

const appendDigit = (value) => {
    if (!value) return;
    if (state.number.length >= 24) {
        setStatus('號碼已達上限');
        return;
    }
    state.number += value;
    updateDialedNumber();
};

const eraseDigit = () => {
    if (!state.number) return;
    state.number = state.number.slice(0, -1);
    updateDialedNumber();
};

const clearNumber = () => {
    if (!state.number) {
        setStatus('沒有號碼可清除');
        return;
    }
    state.number = '';
    updateDialedNumber();
    setStatus('已清除號碼');
};

const renderHistory = () => {
    if (!els.historyList) return;
    els.historyList.innerHTML = '';
    if (!historyEntries.length) {
        const empty = document.createElement('li');
        empty.className = 'history-empty';
        empty.textContent = '暫無通話紀錄';
        els.historyList.appendChild(empty);
        return;
    }

    historyEntries.forEach(entry => {
        const item = document.createElement('li');
        item.className = 'history-item';

        const main = document.createElement('div');
        main.className = 'history-main';

        const type = document.createElement('div');
        type.className = `history-type ${entry.type}`;
        type.textContent = entry.type === 'incoming' ? '↙' : entry.type === 'missed' ? '⚠' : '↗';

        const meta = document.createElement('div');
        meta.className = 'history-meta';
        const numberDisplay = formatDialText(entry.number);
        const name = entry.name || numberDisplay || '未知號碼';
        meta.innerHTML = `<h3>${name}</h3><p>${entry.name ? numberDisplay : '未儲存'}</p>`;

        main.append(type, meta);

        const extra = document.createElement('div');
        extra.className = 'history-extra';
        extra.innerHTML = `<div>${formatTimestamp(entry.timestamp)}</div><div>${formatDuration(entry.duration)}</div>`;

        item.append(main, extra);
        item.addEventListener('dblclick', () => {
            state.number = entry.number;
            updateDialedNumber();
            simulateCall({ label: entry.name || numberDisplay });
        });
        els.historyList.appendChild(item);
    });
};

const renderFavorites = () => {
    if (!els.favoriteGrid) return;
    els.favoriteGrid.innerHTML = '';
    favorites.forEach(contact => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'favorite-card';
        card.innerHTML = `
            <div class="favorite-avatar">${contact.name.slice(0, 2)}</div>
            <div class="favorite-meta">
                <h3>${contact.name}</h3>
                <p>${contact.label}</p>
            </div>
        `;
        card.addEventListener('click', () => {
            state.number = contact.number;
            updateDialedNumber();
            setStatus(`已填入 ${contact.name}`);
        });
        els.favoriteGrid.appendChild(card);
    });
};

const shuffleFavorites = () => {
    for (let i = favorites.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [favorites[i], favorites[j]] = [favorites[j], favorites[i]];
    }
    renderFavorites();
    setStatus('已重新排序常用聯絡人');
};

const saveContact = () => {
    if (!state.number) {
        setStatus('請先輸入號碼');
        return;
    }
    const exists = favorites.some(contact => contact.number.replace(/\D/g, '') === state.number.replace(/\D/g, ''));
    if (exists) {
        setStatus('號碼已在常用聯絡人中');
        return;
    }
    const suffix = state.number.slice(-4).padStart(4, '0');
    const name = `聯絡人 ${suffix}`;
    favorites.unshift({ name, number: state.number, label: '快速加入' });
    renderFavorites();
    setStatus(`${name} 已加入常用`);
};

const updateConnectionStatus = () => {
    if (!els.connectionStatus) return;
    const battery = Math.max(65, Math.min(99, Math.floor(80 + Math.random() * 15)));
    els.connectionStatus.textContent = `${state.silent ? '靜音' : '4G'} · ${battery}%`;
};

const simulateCall = (options = {}) => {
    if (!state.number) {
        setStatus('請先輸入號碼');
        return;
    }
    const digits = state.number.replace(/\s+/g, '');
    const contact = findContactByNumber(digits);
    const label = options.label || contact?.name || `聯絡人 ${digits.slice(-4)}`;
    const duration = options.duration ?? Math.floor(30 + Math.random() * 210);
    const entry = {
        id: `call-${Date.now()}`,
        name: contact?.name || '',
        number: digits,
        type: options.type || 'outgoing',
        timestamp: Date.now(),
        duration
    };
    historyEntries = [entry, ...historyEntries].slice(0, 30);
    renderHistory();
    setStatus(`已撥出至 ${label}`);
    state.number = '';
    updateDialedNumber();
};

const clearHistory = () => {
    if (!historyEntries.length) {
        setStatus('沒有紀錄可清除');
        return;
    }
    historyEntries = [];
    renderHistory();
    setStatus('通話紀錄已清除');
};

const bindKeypad = () => {
    if (!els.keypad) return;
    const longPressTimers = new WeakMap();
    const longPressState = new WeakMap();

    const startTimer = (button, event) => {
        if (event.type === 'touchstart') event.preventDefault();
        if (!button.dataset.alt) return;
        clearTimer(button);
        const timer = window.setTimeout(() => {
            appendDigit(button.dataset.alt);
            longPressState.set(button, true);
        }, 550);
        longPressTimers.set(button, timer);
    };

    const clearTimer = (button) => {
        const timer = longPressTimers.get(button);
        if (timer) {
            clearTimeout(timer);
            longPressTimers.delete(button);
        }
    };

    const endPress = (button) => {
        clearTimer(button);
    };

    els.keypad.querySelectorAll('.key[data-value]').forEach(button => {
        button.addEventListener('mousedown', (event) => startTimer(button, event));
        button.addEventListener('touchstart', (event) => startTimer(button, event), { passive: false });
        ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach(evt => {
            button.addEventListener(evt, () => endPress(button));
        });
        button.addEventListener('click', (event) => {
            event.preventDefault();
            const usedAlt = longPressState.get(button);
            if (usedAlt) {
                longPressState.delete(button);
                return;
            }
            appendDigit(button.dataset.value || '');
        });
    });
};

const bindEvents = () => {
    els.callButton?.addEventListener('click', () => simulateCall());
    els.backspace?.addEventListener('click', () => eraseDigit());
    els.holdButton?.addEventListener('click', () => {
        appendDigit(',');
        setStatus('已插入暫停符號');
    });
    els.saveContact?.addEventListener('click', saveContact);
    els.clearNumber?.addEventListener('click', clearNumber);
    els.historyClear?.addEventListener('click', clearHistory);
    els.favoriteShuffle?.addEventListener('click', shuffleFavorites);
    els.toggleSilent?.addEventListener('click', () => {
        state.silent = !state.silent;
        els.toggleSilent.setAttribute('aria-pressed', state.silent ? 'true' : 'false');
        els.toggleSilent.textContent = state.silent ? '🔕' : '🔔';
        setStatus(state.silent ? '已啟用靜音' : '已恢復鈴聲');
        updateConnectionStatus();
    });
    els.closeButton?.addEventListener('click', () => {
        window.parent?.postMessage({ type: 'closeApp' }, '*');
    });

    document.querySelectorAll('.phone-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.phone-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            const panelId = tab.dataset.tab;
            document.getElementById(panelId)?.classList.add('active');
            if (panelId === 'recordings-tab') {
                renderRecordings();
            }
        });
    });

    document.getElementById('clear-recordings')?.addEventListener('click', () => {
        if (confirm('確定清除所有錄音？此操作無法復原。')) {
            clearAllRecordings();
            renderRecordings();
            setStatus('已清除所有錄音');
        }
    });

    document.addEventListener('keydown', (event) => {
        if (/^Digit\d$/.test(event.code) || /^Numpad\d$/.test(event.code)) {
            appendDigit(event.key);
            return;
        }
        if (event.key === '+' || event.key === '*' || event.key === '#') {
            appendDigit(event.key);
            return;
        }
        if (event.key === 'Backspace') {
            eraseDigit();
            return;
        }
        if (event.key === 'Enter') {
            simulateCall();
        }
    });
};

const loadContactsFromSettings = () => {
    if (typeof SxSettings === 'undefined') return;
    const settings = SxSettings.getSettingsSnapshot();
    
    const contacts = [];
    settings.characters.forEach(char => {
        contacts.push({
            name: char.name,
            number: `09${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
            label: '角色',
            avatar: char.avatar || '',
            personality: char.personality || ''
        });
    });
    settings.users.forEach(user => {
        contacts.push({
            name: user.name,
            number: `09${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
            label: '用戶',
            avatar: user.avatar || '',
            personality: user.personality || ''
        });
    });
    settings.npcs.forEach(npc => {
        contacts.push({
            name: npc.name,
            number: `09${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
            label: 'NPC',
            avatar: npc.avatar || '',
            personality: npc.personality || ''
        });
    });
    
    if (contacts.length > 0) {
        console.log('[phone] Loaded contacts from settings:', contacts.length);
    }
    
    return contacts;
};

// iOS Safari / Android Chrome 儲存保護
const savePhoneData = () => {
    try {
        localStorage.setItem('sx_voice_call_recordings', JSON.stringify(state.recordings));
        localStorage.setItem('sx_phone_history', JSON.stringify(state.history));
    } catch (e) {
        console.warn('[phone] 保存數據失敗:', e);
    }
};

window.addEventListener('pagehide', savePhoneData);
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') savePhoneData();
});
window.addEventListener('message', (event) => {
    if (event.data?.type === 'APP_WILL_CLOSE') savePhoneData();
});

const init = () => {
    loadContactsFromSettings();
    renderFavorites();
    renderHistory();
    renderRecordings();
    updateDialedNumber();
    updateConnectionStatus();
    bindKeypad();
    bindEvents();
    setInterval(updateConnectionStatus, 15000);
};

document.addEventListener('DOMContentLoaded', init);
