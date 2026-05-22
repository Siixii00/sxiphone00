const HomeExpansion = {
    state: {
        level: 1,
        maxLevel: 3,
        wood: 312,
        stone: 144,
        iron: 12,
        gold: 1250,
        roomSharingEnabled: false,
        installedRenovations: ['roof'],
        unlockedRenovations: ['wallpaper-living', 'flooring', 'kitchen', 'porch']
    },
    
    expansionRequirements: {
        2: { wood: 450, gold: 10000, description: '增加寬敞的第二臥室' },
        3: { wood: 800, stone: 300, gold: 50000, description: '增加閣樓與地下室' }
    },
    
    init() {
        this.load();
        this.bindEvents();
        this.updateUI();
    },
    
    save() {
        try {
            localStorage.setItem('sx_home_expansion', JSON.stringify(this.state));
        } catch (e) {
            console.warn('Failed to save home expansion state');
        }
    },
    
    load() {
        try {
            const saved = localStorage.getItem('sx_home_expansion');
            if (saved) {
                this.state = { ...this.state, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.warn('Failed to load home expansion state');
        }
    },
    
    bindEvents() {
        const btnExpansionClose = document.getElementById('btn-expansion-close');
        if (btnExpansionClose) {
            btnExpansionClose.addEventListener('click', () => this.closeExpansionModal());
        }
        
        const btnExpansionConfirm = document.getElementById('btn-expansion-confirm');
        if (btnExpansionConfirm) {
            btnExpansionConfirm.addEventListener('click', () => this.confirmExpansion());
        }
        
        const btnSharingClose = document.getElementById('btn-sharing-close');
        if (btnSharingClose) {
            btnSharingClose.addEventListener('click', () => this.closeSharingModal());
        }
        
        const sharingToggle = document.getElementById('room-sharing-toggle');
        if (sharingToggle) {
            sharingToggle.addEventListener('click', () => this.toggleRoomSharing());
        }
        
        const btnRenovationClose = document.getElementById('btn-renovation-close');
        if (btnRenovationClose) {
            btnRenovationClose.addEventListener('click', () => this.closeRenovationModal());
        }
        
        document.querySelectorAll('.renovation-item').forEach(item => {
            item.addEventListener('click', () => this.selectRenovation(item.dataset.item));
        });
    },
    
    openExpansionModal() {
        const modal = document.getElementById('expansion-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.updateExpansionPreview();
        }
    },
    
    closeExpansionModal() {
        const modal = document.getElementById('expansion-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    },
    
    updateExpansionPreview() {
        const canvas = document.getElementById('expansion-preview-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(0, 0, w, h);
        
        ctx.fillStyle = '#5c4a32';
        ctx.fillRect(20, 40, w - 40, h - 60);
        
        ctx.fillStyle = '#8e4e14';
        ctx.fillRect(0, 0, w, 30);
        
        if (this.state.level >= 2) {
            ctx.fillStyle = '#6f3800';
            ctx.fillRect(60, 60, 80, 80);
        }
        
        if (this.state.level >= 3) {
            ctx.fillStyle = '#4a6a2a';
            ctx.fillRect(w - 100, 60, 60, 60);
        }
        
        const nextLevel = this.state.level + 1;
        if (nextLevel <= this.state.maxLevel) {
            const req = this.expansionRequirements[nextLevel];
            if (req) {
                document.getElementById('expansion-current-level').textContent = `LEVEL ${this.state.level}`;
                document.getElementById('expansion-title').textContent = `升級至 Level ${nextLevel}`;
                document.getElementById('expansion-desc').textContent = req.description;
                
                const woodMet = this.state.wood >= req.wood;
                const goldMet = this.state.gold >= req.gold;
                
                const woodEl = document.getElementById('expansion-wood-req');
                if (woodEl) {
                    woodEl.textContent = `${this.state.wood} / ${req.wood}`;
                    woodEl.className = woodMet ? 'home-requirement-met' : 'home-requirement-unmet';
                }
                
                const goldEl = document.getElementById('expansion-gold-req');
                if (goldEl) {
                    goldEl.textContent = `${this.state.gold.toLocaleString()} / ${req.gold.toLocaleString()}`;
                    goldEl.className = goldMet ? 'home-requirement-met' : 'home-requirement-unmet';
                }
                
                const btn = document.getElementById('btn-expansion-confirm');
                if (btn) {
                    const canExpand = woodMet && goldMet;
                    btn.disabled = !canExpand;
                    btn.textContent = canExpand ? '確認升級' : '材料不足';
                }
            }
        } else {
            document.getElementById('expansion-title').textContent = '已達最高等級';
            document.getElementById('expansion-desc').textContent = '你的家園已完全升級！';
            const btn = document.getElementById('btn-expansion-confirm');
            if (btn) {
                btn.disabled = true;
                btn.textContent = '已滿級';
            }
        }
    },
    
    confirmExpansion() {
        const nextLevel = this.state.level + 1;
        if (nextLevel > this.state.maxLevel) return;
        
        const req = this.expansionRequirements[nextLevel];
        if (!req) return;
        
        if (this.state.wood >= req.wood && this.state.gold >= req.gold) {
            this.state.wood -= req.wood;
            this.state.gold -= req.gold;
            this.state.level = nextLevel;
            
            this.save();
            this.updateUI();
            this.updateExpansionPreview();
            
            this.showNotification(`家園已升級至 Level ${nextLevel}！`);
        }
    },
    
    openSharingModal() {
        const modal = document.getElementById('room-sharing-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.updateSharingUI();
        }
    },
    
    closeSharingModal() {
        const modal = document.getElementById('room-sharing-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    },
    
    updateSharingUI() {
        const toggle = document.getElementById('room-sharing-toggle');
        if (toggle) {
            if (this.state.roomSharingEnabled) {
                toggle.classList.add('active');
            } else {
                toggle.classList.remove('active');
            }
        }
    },
    
    toggleRoomSharing() {
        if (this.state.level < 2) {
            this.showNotification('需要先升級家園至 Level 2');
            return;
        }
        
        this.state.roomSharingEnabled = !this.state.roomSharingEnabled;
        this.save();
        this.updateSharingUI();
        
        const status = this.state.roomSharingEnabled ? '啟用' : '停用';
        this.showNotification(`房間共享已${status}`);
    },
    
    openRenovationModal() {
        const modal = document.getElementById('renovation-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.updateRenovationUI();
        }
    },
    
    closeRenovationModal() {
        const modal = document.getElementById('renovation-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    },
    
    updateRenovationUI() {
        document.getElementById('inv-wood').textContent = this.state.wood;
        document.getElementById('inv-stone').textContent = this.state.stone;
        document.getElementById('inv-iron').textContent = this.state.iron;
        
        document.querySelectorAll('.renovation-item').forEach(item => {
            const itemName = item.dataset.item;
            const isInstalled = this.state.installedRenovations.includes(itemName);
            const isUnlocked = this.state.unlockedRenovations.includes(itemName);
            
            if (isInstalled) {
                item.classList.add('installed');
            } else {
                item.classList.remove('installed');
            }
            
            if (!isUnlocked && !isInstalled) {
                item.style.opacity = '0.5';
                item.style.pointerEvents = 'none';
            } else {
                item.style.opacity = '1';
                item.style.pointerEvents = 'auto';
            }
        });
    },
    
    selectRenovation(itemName) {
        if (this.state.installedRenovations.includes(itemName)) {
            this.showNotification('此裝修已安裝');
            return;
        }
        
        if (!this.state.unlockedRenovations.includes(itemName)) {
            this.showNotification('此裝修尚未解鎖');
            return;
        }
        
        this.showNotification(`已選擇裝修: ${itemName}`);
    },
    
    updateUI() {
        this.updateExpansionPreview();
    },
    
    showNotification(message) {
        console.log('[HomeExpansion]', message);
        
        if (window.parent) {
            window.parent.postMessage({
                type: 'notification',
                message: message
            }, '*');
        }
    },
    
    addResources(type, amount) {
        switch (type) {
            case 'wood':
                this.state.wood += amount;
                break;
            case 'stone':
                this.state.stone += amount;
                break;
            case 'iron':
                this.state.iron += amount;
                break;
            case 'gold':
                this.state.gold += amount;
                break;
        }
        this.save();
        this.updateUI();
    }
};

window.HomeExpansion = HomeExpansion;

document.addEventListener('DOMContentLoaded', () => {
    HomeExpansion.init();
});
