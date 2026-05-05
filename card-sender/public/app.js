const App = {
    creator: null,
    cards: [],
    pendingCardData: null,

    init() {
        this.loadCreator();
        this.bindEvents();
        this.checkApiUrl();
    },

    checkApiUrl() {
        if (!API.baseUrl) {
            const url = prompt('請輸入 API 網址：', 'https://your-worker.workers.dev');
            if (url) {
                API.setBaseUrl(url);
            }
        }
    },

    loadCreator() {
        const saved = localStorage.getItem('card_sender_creator');
        if (saved) {
            this.creator = JSON.parse(saved);
            this.showCreatorInfo();
            this.loadCards();
        }
    },

    saveCreator(creator) {
        this.creator = creator;
        localStorage.setItem('card_sender_creator', JSON.stringify(creator));
    },

    clearCreator() {
        this.creator = null;
        this.cards = [];
        localStorage.removeItem('card_sender_creator');
    },

    bindEvents() {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        document.getElementById('registerBtn').addEventListener('click', () => this.register());
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());

        const uploadArea = document.getElementById('uploadArea');
        const cardFile = document.getElementById('cardFile');

        uploadArea.addEventListener('click', () => cardFile.click());
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file) this.handleFileUpload(file);
        });
        cardFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.handleFileUpload(file);
        });

        document.getElementById('encryptBtn').addEventListener('click', () => this.encryptAndUpload());
        document.getElementById('cancelUploadBtn').addEventListener('click', () => this.cancelUpload());

        document.getElementById('cardSelect').addEventListener('change', (e) => {
            const cardId = e.target.value;
            if (cardId) {
                document.getElementById('sendOptions').classList.remove('hidden');
            } else {
                document.getElementById('sendOptions').classList.add('hidden');
                document.getElementById('sendResult').classList.add('hidden');
            }
        });

        document.getElementById('generateCodeBtn').addEventListener('click', () => this.generateCode());

        document.getElementById('copyCodeBtn').addEventListener('click', () => {
            this.copyToClipboard(document.getElementById('encryptedCode').textContent);
        });
        document.getElementById('copyLinkBtn').addEventListener('click', () => {
            this.copyToClipboard(document.getElementById('shareLink').textContent);
        });
    },

    switchTab(tabId) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        document.getElementById(tabId).classList.add('active');

        if (tabId === 'cards' && this.creator) {
            this.loadCards();
        } else if (tabId === 'logs' && this.creator) {
            this.loadLogs();
        } else if (tabId === 'send' && this.creator) {
            this.populateCardSelect();
        }
    },

    async register() {
        const name = document.getElementById('creatorName').value.trim();
        const email = document.getElementById('creatorEmail').value.trim();
        const website = document.getElementById('creatorWebsite').value.trim();

        if (!name || !email) {
            this.showToast('請填寫名稱和 Email', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const result = await API.registerCreator(name, email, website);
            this.saveCreator({
                creatorId: result.creatorId,
                creatorKey: result.creatorKey,
                name,
                email,
                website
            });
            this.showCreatorInfo();
            this.showToast('註冊成功！', 'success');
        } catch (e) {
            this.showToast(`註冊失敗：${e.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    },

    logout() {
        if (confirm('確定要登出嗎？登出後需要重新輸入金鑰才能登入。')) {
            this.clearCreator();
            document.getElementById('registerForm').classList.remove('hidden');
            document.getElementById('creatorInfo').classList.add('hidden');
            this.showToast('已登出', 'success');
        }
    },

    showCreatorInfo() {
        document.getElementById('registerForm').classList.add('hidden');
        document.getElementById('creatorInfo').classList.remove('hidden');
        document.getElementById('displayCreatorId').textContent = this.creator.creatorId;
        document.getElementById('displayCreatorName').textContent = this.creator.name;
        document.getElementById('displayCreatorEmail').textContent = this.creator.email;
        document.getElementById('displayCreatorKey').textContent = this.creator.creatorKey.substring(0, 20) + '...';
    },

    async loadCards() {
        if (!this.creator) return;

        this.showLoading(true);

        try {
            const result = await API.getCards(this.creator.creatorId, this.creator.creatorKey);
            this.cards = result.cards || [];
            this.renderCardsList();
        } catch (e) {
            this.showToast(`載入失敗：${e.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    },

    renderCardsList() {
        const container = document.getElementById('cardsList');
        const noCards = document.getElementById('noCards');

        if (this.cards.length === 0) {
            container.innerHTML = '';
            noCards.classList.remove('hidden');
            return;
        }

        noCards.classList.add('hidden');
        container.innerHTML = this.cards.map(card => `
            <div class="card-item" data-card-id="${card.cardId}">
                <div class="card-avatar" style="background: var(--accent); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                    ${card.cardName.charAt(0).toUpperCase()}
                </div>
                <div class="card-info">
                    <div class="card-name">${this.escapeHtml(card.cardName)}</div>
                    <div class="card-meta">
                        使用次數: ${card.usageCount || 0} · 
                        ${card.createdAt ? new Date(card.createdAt).toLocaleDateString('zh-TW') : '未知日期'}
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn secondary" onclick="App.deleteCard('${card.cardId}')">刪除</button>
                </div>
            </div>
        `).join('');
    },

    async deleteCard(cardId) {
        if (!confirm('確定要刪除此角色卡嗎？')) return;

        this.showLoading(true);

        try {
            await API.deleteCard(cardId, this.creator.creatorId, this.creator.creatorKey);
            this.cards = this.cards.filter(c => c.cardId !== cardId);
            this.renderCardsList();
            this.showToast('已刪除', 'success');
        } catch (e) {
            this.showToast(`刪除失敗：${e.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    },

    handleFileUpload(file) {
        if (!file.name.endsWith('.json')) {
            this.showToast('請上傳 JSON 檔案', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.pendingCardData = data;
                this.showCardPreview(data);
            } catch (err) {
                this.showToast('無法解析 JSON 檔案', 'error');
            }
        };
        reader.readAsText(file);
    },

    showCardPreview(data) {
        document.getElementById('uploadArea').classList.add('hidden');
        document.getElementById('cardPreview').classList.remove('hidden');

        const name = data.name || data.char_name || '未命名角色';
        document.getElementById('cardName').value = name;
        document.getElementById('previewName').textContent = name;

        const personality = data.personality || data.char_persona || '無';
        document.getElementById('previewPersonality').textContent = personality.substring(0, 100) + (personality.length > 100 ? '...' : '');

        const avatar = data.avatar || data.char_avatar || '';
        const avatarEl = document.getElementById('previewAvatar');
        if (avatar) {
            avatarEl.src = avatar;
            avatarEl.classList.remove('hidden');
        } else {
            avatarEl.classList.add('hidden');
        }
    },

    cancelUpload() {
        this.pendingCardData = null;
        document.getElementById('uploadArea').classList.remove('hidden');
        document.getElementById('cardPreview').classList.add('hidden');
        document.getElementById('cardFile').value = '';
    },

    async encryptAndUpload() {
        if (!this.pendingCardData || !this.creator) return;

        const cardName = document.getElementById('cardName').value.trim();
        if (!cardName) {
            this.showToast('請輸入角色卡名稱', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const encrypted = await Crypto.encryptCharacterCard(this.pendingCardData, this.creator.creatorKey);

            const result = await API.registerCard(
                this.creator.creatorId,
                this.creator.creatorKey,
                cardName,
                encrypted.encryptedData,
                encrypted.iv,
                encrypted.tag
            );

            this.showToast('上傳成功！', 'success');
            this.cancelUpload();
            this.loadCards();
        } catch (e) {
            this.showToast(`上傳失敗：${e.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    },

    populateCardSelect() {
        const select = document.getElementById('cardSelect');
        select.innerHTML = '<option value="">選擇要發送的角色卡</option>' +
            this.cards.map(card => `<option value="${card.cardId}">${this.escapeHtml(card.cardName)}</option>`).join('');
    },

    async generateCode() {
        const cardId = document.getElementById('cardSelect').value;
        if (!cardId || !this.creator) return;

        const card = this.cards.find(c => c.cardId === cardId);
        if (!card) return;

        this.showLoading(true);

        try {
            const encryptedCode = Crypto.generateEncryptedCode(
                cardId,
                this.creator.creatorId,
                card.encryptedData || '',
                card.iv || '',
                card.tag || ''
            );

            document.getElementById('encryptedCode').textContent = encryptedCode;

            const shareLink = `${window.location.origin}${window.location.pathname}#import=${encodeURIComponent(encryptedCode)}`;
            document.getElementById('shareLink').textContent = shareLink;

            const qrcodeContainer = document.getElementById('qrcode');
            qrcodeContainer.innerHTML = '';
            new QRCode(qrcodeContainer, {
                text: encryptedCode,
                width: 200,
                height: 200,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.M
            });

            document.getElementById('sendResult').classList.remove('hidden');
        } catch (e) {
            this.showToast(`生成失敗：${e.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    },

    async loadLogs() {
        if (!this.creator) return;

        this.showLoading(true);

        try {
            const result = await API.getLogs(this.creator.creatorId, this.creator.creatorKey);
            this.renderLogs(result.logs || []);
        } catch (e) {
            this.showToast(`載入失敗：${e.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    },

    renderLogs(logs) {
        const tbody = document.getElementById('logsBody');
        const noLogs = document.getElementById('noLogs');
        const container = document.querySelector('.logs-table-container');

        if (logs.length === 0) {
            tbody.innerHTML = '';
            container.classList.add('hidden');
            noLogs.classList.remove('hidden');
            return;
        }

        container.classList.remove('hidden');
        noLogs.classList.add('hidden');

        tbody.innerHTML = logs.map(log => {
            const card = this.cards.find(c => c.cardId === log.cardId);
            const cardName = card ? card.cardName : log.cardId.substring(0, 8);
            const statusClass = log.status || 'pending';
            const statusText = {
                pending: '等待中',
                confirmed: '已確認',
                expired: '已過期'
            }[log.status] || log.status;

            return `
                <tr>
                    <td>${this.escapeHtml(cardName)}</td>
                    <td>${log.userId ? log.userId.substring(0, 8) + '...' : '-'}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>${log.usedAt ? new Date(log.usedAt).toLocaleString('zh-TW') : '-'}</td>
                </tr>
            `;
        }).join('');
    },

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('已複製到剪貼簿', 'success');
        }).catch(() => {
            this.showToast('複製失敗', 'error');
        });
    },

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;

        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    },

    showLoading(show) {
        document.getElementById('loading').classList.toggle('hidden', !show);
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
