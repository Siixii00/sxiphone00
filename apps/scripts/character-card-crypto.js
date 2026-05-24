const CharacterCardCrypto = {
    DEVICE_ID_KEY: 'sx_device_id',
    
    getDeviceId() {
        let deviceId = localStorage.getItem(this.DEVICE_ID_KEY);
        if (!deviceId) {
            deviceId = this.generateUUID();
            localStorage.setItem(this.DEVICE_ID_KEY, deviceId);
        }
        return deviceId;
    },
    
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },
    
    parseEncryptedCode(base64String) {
        try {
            const jsonString = atob(base64String);
            const data = JSON.parse(jsonString);
            if (!data.version || !data.cardId || !data.creatorId || !data.encryptedData) {
                throw new Error('Invalid encrypted code format');
            }
            return {
                version: data.version,
                cardId: data.cardId,
                creatorId: data.creatorId,
                createdAt: data.createdAt,
                encryptedData: data.encryptedData,
                iv: data.iv,
                tag: data.tag
            };
        } catch (e) {
            console.error('[Crypto] Failed to parse encrypted code:', e);
            throw new Error('無法解析加密代碼，格式可能不正確');
        }
    },
    
    async requestOneTimeKey(cardId, creatorId, apiUrl) {
        const userId = this.getDeviceId();
        const endpoint = apiUrl || localStorage.getItem('sx_card_api_url') || '';
        
        if (!endpoint) {
            throw new Error('請先設定後端 API 網址');
        }
        
        try {
            const response = await fetch(`${endpoint}/requestKey`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    cardId,
                    creatorId,
                    userId
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || `請求失敗 (${response.status})`);
            }
            
            const result = await response.json();
            return {
                oneTimeKey: result.oneTimeKey,
                usageId: result.usageId,
                expiresAt: result.expiresAt
            };
        } catch (e) {
            console.error('[Crypto] Failed to request one-time key:', e);
            throw new Error(`申請金鑰失敗：${e.message}`);
        }
    },
    
    async decryptCharacterCard(encryptedData, oneTimeKey, iv, tag) {
        try {
            const keyData = await this.importKey(oneTimeKey);
            const encryptedBytes = this.base64ToUint8Array(encryptedData);
            const ivBytes = iv ? this.base64ToUint8Array(iv) : new Uint8Array(12);
            const tagBytes = tag ? this.base64ToUint8Array(tag) : null;
            
            const algorithm = {
                name: 'AES-GCM',
                iv: ivBytes
            };
            
            let ciphertext;
            if (tagBytes) {
                ciphertext = new Uint8Array(encryptedBytes.length + tagBytes.length);
                ciphertext.set(encryptedBytes, 0);
                ciphertext.set(tagBytes, encryptedBytes.length);
            } else {
                ciphertext = encryptedBytes;
            }
            
            const decrypted = await crypto.subtle.decrypt(algorithm, keyData, ciphertext);
            const decoder = new TextDecoder();
            const jsonString = decoder.decode(decrypted);
            const characterData = JSON.parse(jsonString);
            
            return characterData;
        } catch (e) {
            console.error('[Crypto] Failed to decrypt:', e);
            throw new Error(`解密失敗：${e.message}`);
        }
    },
    
    async importKey(base64Key) {
        const keyBytes = this.base64ToUint8Array(base64Key);
        return await crypto.subtle.importKey(
            'raw',
            keyBytes,
            { name: 'AES-GCM' },
            false,
            ['decrypt']
        );
    },
    
    base64ToUint8Array(base64) {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    },
    
    uint8ArrayToBase64(bytes) {
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    },
    
    async confirmImport(usageId, apiUrl) {
        const endpoint = apiUrl || localStorage.getItem('sx_card_api_url') || '';
        
        if (!endpoint) {
            throw new Error('請先設定後端 API 網址');
        }
        
        try {
            const response = await fetch(`${endpoint}/confirmImport`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    usageId
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || `確認失敗 (${response.status})`);
            }
            
            return await response.json();
        } catch (e) {
            console.error('[Crypto] Failed to confirm import:', e);
            throw new Error(`確認導入失敗：${e.message}`);
        }
    },
    
    async encryptCharacterCard(characterData, creatorKey) {
        try {
            const jsonString = JSON.stringify(characterData);
            const encoder = new TextEncoder();
            const dataBytes = encoder.encode(jsonString);
            
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const keyData = await this.importKey(creatorKey);
            
            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                keyData,
                dataBytes
            );
            
            const encryptedBytes = new Uint8Array(encrypted);
            const ciphertext = encryptedBytes.slice(0, encryptedBytes.length - 16);
            const tag = encryptedBytes.slice(encryptedBytes.length - 16);
            
            return {
                encryptedData: this.uint8ArrayToBase64(ciphertext),
                iv: this.uint8ArrayToBase64(iv),
                tag: this.uint8ArrayToBase64(tag)
            };
        } catch (e) {
            console.error('[Crypto] Failed to encrypt:', e);
            throw new Error(`加密失敗：${e.message}`);
        }
    },
    
    generateEncryptedCode(cardId, creatorId, encryptedData, iv, tag) {
        const payload = {
            version: '1.0',
            cardId,
            creatorId,
            createdAt: Date.now(),
            encryptedData,
            iv,
            tag
        };
        const jsonString = JSON.stringify(payload);
        return btoa(jsonString);
    },
    
    async saveCharacterToLocalStorage(characterData) {
        const list = JSON.parse(localStorage.getItem('sx_characters') || '[]');
        const existingIdx = list.findIndex(item => item.name === characterData.name && characterData.name);

        let avatar = characterData.avatar || '';
        // 自動上傳 avatar 到圖床
        if (avatar && typeof ImageUploader !== 'undefined' && ImageUploader.isBase64(avatar)) {
            const uploadedUrl = await ImageUploader.uploadOrKeep(avatar);
            if (uploadedUrl) avatar = uploadedUrl;
        }

        const payload = {
            name: characterData.name || '',
            avatar: avatar,
            personality: characterData.personality || '',
            background: characterData.background || '',
            worldBook: characterData.worldBook || characterData.worldbook || '',
            examples: characterData.examples || '',
            sleepStart: characterData.sleepStart || '',
            sleepEnd: characterData.sleepEnd || '',
            memoryApi: characterData.memoryApi || '',
            importedFrom: 'encrypted_card',
            importedAt: Date.now()
        };
        
        if (existingIdx >= 0) {
            list[existingIdx] = payload;
        } else {
            list.unshift(payload);
        }
        
        localStorage.setItem('sx_characters', JSON.stringify(list));
        
        localStorage.setItem('sx_char_name', payload.name);
        localStorage.setItem('sx_char_avatar', payload.avatar);
        localStorage.setItem('sx_char_personality', payload.personality);
        localStorage.setItem('sx_char_background', payload.background);
        localStorage.setItem('sx_char_examples', payload.examples);
        
        let masks = JSON.parse(localStorage.getItem('sx_masks') || '[]');
        if (masks.length === 0) {
            masks.push({
                name: payload.name,
                avatar: payload.avatar,
                personality: payload.personality,
                background: payload.background,
                worldBook: payload.worldBook,
                examples: payload.examples
            });
        } else {
            masks[0] = {
                ...masks[0],
                name: payload.name,
                avatar: payload.avatar,
                personality: payload.personality,
                background: payload.background,
                worldBook: payload.worldBook,
                examples: payload.examples
            };
        }
        localStorage.setItem('sx_masks', JSON.stringify(masks));
        
        window.parent?.postMessage({
            type: 'CHARACTER_UPDATED',
            payload: {
                name: payload.name,
                avatar: payload.avatar,
                personality: payload.personality,
                background: payload.background,
                examples: payload.examples
            }
        }, '*');
        
        return payload;
    }
};

window.CharacterCardCrypto = CharacterCardCrypto;