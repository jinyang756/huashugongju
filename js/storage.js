/**
 * 本地存储管理模块
 * 处理用户数据的本地存储和读取
 */

// 将存储管理挂载到全局对象
const storage = window.storage = window.storage || {};

// 存储键名定义
storage.STORAGE_KEYS = {
    RECENT_RECORDS: 'script_generator_recent_records',
    STATS: 'script_generator_stats',
    SETTINGS: 'script_generator_settings',
    DRAFTS: 'script_generator_drafts',
    KNOWLEDGE_BASE: 'script_generator_knowledge_base'
};

// 默认设置
storage.DEFAULT_SETTINGS = {
    selectedModel: 'GPT-3.5 Turbo',
    selectedStyle: 'professional',
    selectedRole: 'customer_service',
    selectedLength: 5,
    theme: 'dark',
    notifications: true
};

// 获取本地存储中的数据
storage.getFromStorage = function(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`从本地存储获取数据失败 (${key}):`, error);
        return defaultValue;
    }
};

// 保存数据到本地存储
storage.saveToStorage = function(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error(`保存数据到本地存储失败 (${key}):`, error);
        return false;
    }
};

// 从本地存储中删除数据
storage.removeFromStorage = function(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error(`从本地存储删除数据失败 (${key}):`, error);
        return false;
    }
};

// 清除所有本地存储数据
storage.clearStorage = function() {
    try {
        localStorage.clear();
        return true;
    } catch (error) {
        console.error('清除本地存储失败:', error);
        return false;
    }
};

// 管理最近记录
storage.recentRecordsManager = {
    get: function() {
        return storage.getFromStorage(storage.STORAGE_KEYS.RECENT_RECORDS, []);
    },
    add: function(record) {
        const records = this.get();
        // 添加时间戳和ID
        const newRecord = {
            id: Date.now().toString(),
            title: record.title,
            content: record.content || '',
            model: record.model,
            style: record.style,
            characterRole: record.characterRole,
            knowledgeUsed: record.knowledgeUsed || false,
            knowledgeItems: record.knowledgeItems || [],
            timestamp: new Date().toISOString()
        };
        // 添加到列表开头
        records.unshift(newRecord);
        // 限制记录数量为20条
        if (records.length > 20) {
            records.splice(20);
        }
        return storage.saveToStorage(storage.STORAGE_KEYS.RECENT_RECORDS, records);
    },
    remove: function(id) {
        const records = this.get();
        const filteredRecords = records.filter(record => record.id !== id);
        return storage.saveToStorage(storage.STORAGE_KEYS.RECENT_RECORDS, filteredRecords);
    },
    clear: function() {
        return storage.removeFromStorage(storage.STORAGE_KEYS.RECENT_RECORDS);
    }
};

// 管理统计数据
storage.statsManager = {
    get: function() {
        return storage.getFromStorage(storage.STORAGE_KEYS.STATS, {
            totalScripts: 0,
            averageTime: 0,
            successRate: 0,
            knowledgeUtilization: 0,
            knowledgeUsedCount: 0,
            lastUpdated: null
        });
    },
    update: function(generationTime, knowledgeUsed = false) {
        const stats = this.get();
        stats.totalScripts += 1;
        
        // 计算平均生成时间
        if (stats.totalScripts === 1) {
            stats.averageTime = generationTime;
        } else {
            stats.averageTime = ((stats.averageTime * (stats.totalScripts - 1)) + generationTime) / stats.totalScripts;
        }
        
        // 模拟成功率（假设总是成功）
        stats.successRate = Math.min(99.9, stats.successRate + (Math.random() * 0.5) + 0.1);
        
        // 更新知识库利用率统计
        if (knowledgeUsed) {
            stats.knowledgeUsedCount += 1;
        }
        stats.knowledgeUtilization = stats.totalScripts > 0 ? 
            (stats.knowledgeUsedCount / stats.totalScripts) * 100 : 0;
        
        stats.lastUpdated = new Date().toISOString();
        
        return storage.saveToStorage(storage.STORAGE_KEYS.STATS, stats);
    },
    reset: function() {
        return storage.removeFromStorage(storage.STORAGE_KEYS.STATS);
    },
    // 更新单个生成的统计信息
    updateWithNewGeneration: function(generationTime, knowledgeUsed = false) {
        return this.update(generationTime, knowledgeUsed);
    }
};

// 管理用户设置
storage.settingsManager = {
    get: function() {
        return {...storage.DEFAULT_SETTINGS, ...storage.getFromStorage(storage.STORAGE_KEYS.SETTINGS, {})};
    },
    save: function(settings) {
        const currentSettings = this.get();
        const newSettings = {...currentSettings, ...settings};
        return storage.saveToStorage(storage.STORAGE_KEYS.SETTINGS, newSettings);
    },
    reset: function() {
        return storage.removeFromStorage(storage.STORAGE_KEYS.SETTINGS);
    }
};

// 管理草稿
storage.draftsManager = {
    get: function() {
        return storage.getFromStorage(storage.STORAGE_KEYS.DRAFTS, []);
    },
    add: function(draft) {
        const drafts = this.get();
        const newDraft = {
            id: Date.now().toString(),
            title: draft.title,
            content: draft.content,
            timestamp: new Date().toISOString()
        };
        drafts.unshift(newDraft);
        // 限制草稿数量为10条
        if (drafts.length > 10) {
            drafts.splice(10);
        }
        return storage.saveToStorage(storage.STORAGE_KEYS.DRAFTS, drafts);
    },
    update: function(id, updates) {
        const drafts = this.get();
        const draftIndex = drafts.findIndex(draft => draft.id === id);
        if (draftIndex !== -1) {
            drafts[draftIndex] = {...drafts[draftIndex], ...updates, timestamp: new Date().toISOString()};
            return storage.saveToStorage(storage.STORAGE_KEYS.DRAFTS, drafts);
        }
        return false;
    },
    remove: function(id) {
        const drafts = this.get();
        const filteredDrafts = drafts.filter(draft => draft.id !== id);
        return storage.saveToStorage(storage.STORAGE_KEYS.DRAFTS, filteredDrafts);
    },
    clear: function() {
        return storage.removeFromStorage(storage.STORAGE_KEYS.DRAFTS);
    }
};

// 管理知识库
storage.knowledgeBaseManager = {
    get: function() {
        return storage.getFromStorage(storage.STORAGE_KEYS.KNOWLEDGE_BASE, []);
    },
    add: function(item) {
        const items = this.get();
        const newItem = {
            id: Date.now().toString(),
            title: item.title,
            content: item.content,
            type: item.type || 'text', // text, document, spreadsheet
            source: item.source || 'upload',
            tags: item.tags || [],
            timestamp: new Date().toISOString()
        };
        items.push(newItem);
        return storage.saveToStorage(storage.STORAGE_KEYS.KNOWLEDGE_BASE, items);
    },
    update: function(id, updates) {
        const items = this.get();
        const itemIndex = items.findIndex(item => item.id === id);
        if (itemIndex !== -1) {
            items[itemIndex] = {...items[itemIndex], ...updates, timestamp: new Date().toISOString()};
            return storage.saveToStorage(storage.STORAGE_KEYS.KNOWLEDGE_BASE, items);
        }
        return false;
    },
    remove: function(id) {
        const items = this.get();
        const filteredItems = items.filter(item => item.id !== id);
        return storage.saveToStorage(storage.STORAGE_KEYS.KNOWLEDGE_BASE, filteredItems);
    },
    search: function(query) {
        if (!query || query.trim() === '') {
            return this.get();
        }
        
        const items = this.get();
        const searchTerm = query.toLowerCase().trim();
        
        return items.filter(item => 
            item.title.toLowerCase().includes(searchTerm) ||
            item.content.toLowerCase().includes(searchTerm) ||
            item.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
    },
    clear: function() {
        return storage.removeFromStorage(storage.STORAGE_KEYS.KNOWLEDGE_BASE);
    }
};