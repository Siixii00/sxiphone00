const API = {
    baseUrl: localStorage.getItem('api_base_url') || '',

    setBaseUrl(url) {
        this.baseUrl = url.replace(/\/$/, '');
        localStorage.setItem('api_base_url', this.baseUrl);
    },

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        if (options.body && typeof options.body === 'object') {
            mergedOptions.body = JSON.stringify(options.body);
        }

        try {
            const response = await fetch(url, mergedOptions);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            return data;
        } catch (e) {
            console.error('[API] Request failed:', e);
            throw e;
        }
    },

    async registerCreator(name, email, website = '') {
        return this.request('/api/register', {
            method: 'POST',
            body: { name, email, website }
        });
    },

    async registerCard(creatorId, creatorKey, cardName, encryptedData, iv, tag) {
        return this.request('/api/cards', {
            method: 'POST',
            body: { creatorId, creatorKey, cardName, encryptedData, iv, tag }
        });
    },

    async getCards(creatorId, creatorKey) {
        return this.request(`/api/cards?creatorId=${encodeURIComponent(creatorId)}&creatorKey=${encodeURIComponent(creatorKey)}`);
    },

    async deleteCard(cardId, creatorId, creatorKey) {
        return this.request(`/api/cards/${cardId}`, {
            method: 'DELETE',
            body: { creatorId, creatorKey }
        });
    },

    async requestKey(cardId, creatorId, userId) {
        return this.request('/api/requestKey', {
            method: 'POST',
            body: { cardId, creatorId, userId }
        });
    },

    async confirmImport(usageId) {
        return this.request('/api/confirmImport', {
            method: 'POST',
            body: { usageId }
        });
    },

    async getLogs(creatorId, creatorKey) {
        return this.request(`/api/logs?creatorId=${encodeURIComponent(creatorId)}&creatorKey=${encodeURIComponent(creatorKey)}`);
    },

    async healthCheck() {
        return this.request('/api/health');
    }
};

window.API = API;