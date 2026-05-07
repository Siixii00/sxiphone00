const FirebaseCardConfig = {
    CONFIG_KEY: 'sx_firebase_card_config',
    
    getDefaultConfig() {
        return {
            apiUrl: '',
            projectId: '',
            apiKey: '',
            authDomain: '',
            storageBucket: ''
        };
    },
    
    loadConfig() {
        try {
            const raw = localStorage.getItem(this.CONFIG_KEY);
            if (!raw) return this.getDefaultConfig();
            const parsed = JSON.parse(raw);
            return { ...this.getDefaultConfig(), ...parsed };
        } catch {
            return this.getDefaultConfig();
        }
    },
    
    saveConfig(config) {
        const merged = { ...this.getDefaultConfig(), ...config };
        localStorage.setItem(this.CONFIG_KEY, JSON.stringify(merged));
        return merged;
    },
    
    getApiUrl() {
        const config = this.loadConfig();
        return config.apiUrl || localStorage.getItem('sx_card_api_url') || '';
    },
    
    setApiUrl(url) {
        const config = this.loadConfig();
        config.apiUrl = url;
        this.saveConfig(config);
        localStorage.setItem('sx_card_api_url', url);
    },
    
    isConfigured() {
        const config = this.loadConfig();
        return !!(config.apiUrl || localStorage.getItem('sx_card_api_url'));
    },
    
    async initializeFirebase() {
        const config = this.loadConfig();
        
        if (!config.apiKey || !config.projectId) {
            console.log('[FirebaseCard] Firebase not configured, using custom API only');
            return false;
        }
        
        if (typeof firebase === 'undefined') {
            console.warn('[FirebaseCard] Firebase SDK not loaded');
            return false;
        }
        
        try {
            if (!firebase.apps.length) {
                firebase.initializeApp({
                    apiKey: config.apiKey,
                    authDomain: config.authDomain || `${config.projectId}.firebaseapp.com`,
                    projectId: config.projectId,
                    storageBucket: config.storageBucket || `${config.projectId}.appspot.com`
                });
            }
            
            console.log('[FirebaseCard] Firebase initialized');
            return true;
        } catch (e) {
            console.error('[FirebaseCard] Failed to initialize Firebase:', e);
            return false;
        }
    },
    
    getFirestore() {
        if (typeof firebase === 'undefined' || !firebase.apps.length) {
            return null;
        }
        return firebase.firestore();
    },
    
    async fetchCardInfo(cardId) {
        const db = this.getFirestore();
        if (!db) {
            throw new Error('Firebase not initialized');
        }
        
        try {
            const doc = await db.collection('cards').doc(cardId).get();
            if (!doc.exists) {
                throw new Error('找不到此角色卡');
            }
            return doc.data();
        } catch (e) {
            console.error('[FirebaseCard] Failed to fetch card info:', e);
            throw e;
        }
    },
    
    async logUsage(cardId, creatorId, userId, oneTimeKey) {
        const db = this.getFirestore();
        if (!db) {
            console.warn('[FirebaseCard] Firestore not available, skipping usage log');
            return null;
        }
        
        try {
            const usageRef = await db.collection('usageLogs').add({
                cardId,
                creatorId,
                userId,
                oneTimeKey,
                usedAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'pending'
            });
            return usageRef.id;
        } catch (e) {
            console.error('[FirebaseCard] Failed to log usage:', e);
            return null;
        }
    },
    
    async updateUsageStatus(usageId, status) {
        const db = this.getFirestore();
        if (!db) {
            return false;
        }
        
        try {
            await db.collection('usageLogs').doc(usageId).update({
                status,
                confirmedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return true;
        } catch (e) {
            console.error('[FirebaseCard] Failed to update usage status:', e);
            return false;
        }
    }
};

window.FirebaseCardConfig = FirebaseCardConfig;