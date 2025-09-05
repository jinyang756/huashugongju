/**
 * 本地存储管理模块
 * 处理用户数据的本地存储和读取
 */

const STORAGE_KEYS = {
    RECENT_RECORDS: 'script_generator_recent_records',
    STATS: 'script_generator_stats',
    SETTINGS: 'script_generator_settings',
    DRAFTS: 'script_generator_drafts'
};

// 默认设置
const DEFAULT_SETTINGS = {
    selectedModel: 'GPT-3.5 Turbo',
    selectedStyle: 'professional',
    selectedRole: 'customer_service',
    selectedLength: 5,
    theme: 'dark',
    notifications: true
};

// 获取本地存储中的数据
export function getFromStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`从本地存储获取数据失败 (${key}):`, error);
        return defaultValue;
    }
}

// 保存数据到本地存储
export function saveToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error(`保存数据到本地存储失败 (${key}):`, error);
        return false;
    }
}

// 从本地存储中删除数据
export function removeFromStorage(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error(`从本地存储删除数据失败 (${key}):`, error);
        return false;
    }
}

// 清除所有本地存储数据
export function clearStorage() {
    try {
        localStorage.clear();
        return true;
    } catch (error) {
        console.error('清除本地存储失败:', error);
        return false;
    }
}

// 管理最近记录
export const recentRecordsManager = {
    get: function() {
        return getFromStorage(STORAGE_KEYS.RECENT_RECORDS, []);
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
            timestamp: new Date().toISOString()
        };
        // 添加到列表开头
        records.unshift(newRecord);
        // 限制记录数量为20条
        if (records.length > 20) {
            records.splice(20);
        }
        return saveToStorage(STORAGE_KEYS.RECENT_RECORDS, records);
    },
    remove: function(id) {
        const records = this.get();
        const filteredRecords = records.filter(record => record.id !== id);
        return saveToStorage(STORAGE_KEYS.RECENT_RECORDS, filteredRecords);
    },
    clear: function() {
        return removeFromStorage(STORAGE_KEYS.RECENT_RECORDS);
    }
};

// 管理统计数据
export const statsManager = {
    get: function() {
        return getFromStorage(STORAGE_KEYS.STATS, {
            totalScripts: 0,
            averageTime: 0,
            successRate: 0,
            lastUpdated: null
        });
    },
    update: function(generationTime) {
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
        stats.lastUpdated = new Date().toISOString();
        
        return saveToStorage(STORAGE_KEYS.STATS, stats);
    },
    reset: function() {
        return removeFromStorage(STORAGE_KEYS.STATS);
    }
};

// 管理用户设置
export const settingsManager = {
    get: function() {
        return {...DEFAULT_SETTINGS, ...getFromStorage(STORAGE_KEYS.SETTINGS, {})};
    },
    save: function(settings) {
        const currentSettings = this.get();
        const newSettings = {...currentSettings, ...settings};
        return saveToStorage(STORAGE_KEYS.SETTINGS, newSettings);
    },
    reset: function() {
        return removeFromStorage(STORAGE_KEYS.SETTINGS);
    }
};

// 管理草稿
export const draftsManager = {
    get: function() {
        return getFromStorage(STORAGE_KEYS.DRAFTS, []);
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
        return saveToStorage(STORAGE_KEYS.DRAFTS, drafts);
    },
    update: function(id, updates) {
        const drafts = this.get();
        const draftIndex = drafts.findIndex(draft => draft.id === id);
        if (draftIndex !== -1) {
            drafts[draftIndex] = {...drafts[draftIndex], ...updates, timestamp: new Date().toISOString()};
            return saveToStorage(STORAGE_KEYS.DRAFTS, drafts);
        }
        return false;
    },
    remove: function(id) {
        const drafts = this.get();
        const filteredDrafts = drafts.filter(draft => draft.id !== id);
        return saveToStorage(STORAGE_KEYS.DRAFTS, filteredDrafts);
    },
    clear: function() {
        return removeFromStorage(STORAGE_KEYS.DRAFTS);
    }
};

// 添加知识库存储键
STORAGE_KEYS.KNOWLEDGE_BASE = 'script_generator_knowledge_base';

// 管理知识库
export const knowledgeBaseManager = {
    get: function() {
        return getFromStorage(STORAGE_KEYS.KNOWLEDGE_BASE, []);
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
        return saveToStorage(STORAGE_KEYS.KNOWLEDGE_BASE, items);
    },
    update: function(id, updates) {
        const items = this.get();
        const itemIndex = items.findIndex(item => item.id === id);
        if (itemIndex !== -1) {
            items[itemIndex] = {...items[itemIndex], ...updates, timestamp: new Date().toISOString()};
            return saveToStorage(STORAGE_KEYS.KNOWLEDGE_BASE, items);
        }
        return false;
    },
    remove: function(id) {
        const items = this.get();
        const filteredItems = items.filter(item => item.id !== id);
        return saveToStorage(STORAGE_KEYS.KNOWLEDGE_BASE, filteredItems);
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
        return removeFromStorage(STORAGE_KEYS.KNOWLEDGE_BASE);
    }
};