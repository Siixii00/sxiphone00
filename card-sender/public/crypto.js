const Crypto = {
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    generateKey() {
        const keyBytes = new Uint8Array(32);
        crypto.getRandomValues(keyBytes);
        return this.uint8ArrayToBase64(keyBytes);
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

    async importEncryptKey(base64Key) {
        const keyBytes = this.base64ToUint8Array(base64Key);
        return await crypto.subtle.importKey(
            'raw',
            keyBytes,
            { name: 'AES-GCM' },
            false,
            ['encrypt', 'decrypt']
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
    }
};

window.Crypto = Crypto;