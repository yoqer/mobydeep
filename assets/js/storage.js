class StorageManager {
    constructor() {
        this.dbName = 'multiLLM_DB';
        this.dbVersion = 1;
        this.objectStoreName = 'conversations';
        this.db = null;
    }

    async initDB() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                resolve(this.db);
                return;
            }

            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.objectStoreName)) {
                    const store = db.createObjectStore(this.objectStoreName, { keyPath: 'id', autoIncrement: true });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onerror = (event) => {
                console.error('IndexedDB error:', event.target.errorCode);
                reject(new Error('IndexedDB initialization failed'));
            };
        });
    }

    async saveConversation(conversation) {
        try {
            const db = await this.initDB();
            const tx = db.transaction(this.objectStoreName, 'readwrite');
            const store = tx.objectStore(this.objectStoreName);
            
            if (!conversation.id) {
                conversation.id = Date.now(); // Assign a temporary ID if new
            }
            conversation.timestamp = Date.now();

            await store.put(conversation);
            await tx.complete;
            return conversation.id;
        } catch (error) {
            console.error('Error saving conversation to IndexedDB:', error);
            // Fallback to LocalStorage if IndexedDB fails
            this.saveToLocalStorage('conversations', conversation);
            return conversation.id;
        }
    }

    async getConversations() {
        try {
            const db = await this.initDB();
            const tx = db.transaction(this.objectStoreName, 'readonly');
            const store = tx.objectStore(this.objectStoreName);
            const conversations = await store.getAll();
            await tx.complete;
            return conversations.sort((a, b) => b.timestamp - a.timestamp);
        } catch (error) {
            console.error('Error getting conversations from IndexedDB:', error);
            // Fallback to LocalStorage
            return this.getFromLocalStorage('conversations') || [];
        }
    }

    async getConversation(id) {
        try {
            const db = await this.initDB();
            const tx = db.transaction(this.objectStoreName, 'readonly');
            const store = tx.objectStore(this.objectStoreName);
            const conversation = await store.get(id);
            await tx.complete;
            return conversation;
        } catch (error) {
            console.error('Error getting conversation from IndexedDB:', error);
            // Fallback to LocalStorage
            const conversations = this.getFromLocalStorage('conversations') || [];
            return conversations.find(conv => conv.id === id);
        }
    }

    async deleteConversation(id) {
        try {
            const db = await this.initDB();
            const tx = db.transaction(this.objectStoreName, 'readwrite');
            const store = tx.objectStore(this.objectStoreName);
            await store.delete(id);
            await tx.complete;
        } catch (error) {
            console.error('Error deleting conversation from IndexedDB:', error);
            // Fallback to LocalStorage
            let conversations = this.getFromLocalStorage('conversations') || [];
            conversations = conversations.filter(conv => conv.id !== id);
            this.saveToLocalStorage('conversations', conversations);
        }
    }

    // LocalStorage fallback methods
    saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error('Error saving to LocalStorage:', e);
        }
    }

    getFromLocalStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Error getting from LocalStorage:', e);
            return null;
        }
    }

    // API Key management
    saveApiKeys(apiKeys) {
        this.saveToLocalStorage('multiLLM_apiKeys', apiKeys);
    }

    getApiKeys() {
        return this.getFromLocalStorage('multiLLM_apiKeys') || {};
    }

    // Custom LLM management
    saveCustomLLMs(customLLMs) {
        this.saveToLocalStorage('multiLLM_customLLMs', customLLMs);
    }

    getCustomLLMs() {
        return this.getFromLocalStorage('multiLLM_customLLMs') || [];
    }

    // General settings
    saveSettings(settings) {
        this.saveToLocalStorage('multiLLM_settings', settings);
    }

    getSettings() {
        return this.getFromLocalStorage('multiLLM_settings') || {};
    }
}

const storageManager = new StorageManager();


