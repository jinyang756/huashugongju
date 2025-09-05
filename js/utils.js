/**
 * 工具函数模块
 * 包含项目中使用的通用辅助功能
 */

// 将工具函数挂载到全局对象
const utils = window.utils = window.utils || {};

// 获取元素并提供错误处理
utils.getElement = function(selector, parent = document) {
    const element = parent.querySelector(selector);
    if (!element) {
        console.warn(`元素未找到: ${selector}`);
    }
    return element;
};

// 获取所有元素并提供错误处理
utils.getElements = function(selector, parent = document) {
    const elements = parent.querySelectorAll(selector);
    if (elements.length === 0) {
        console.warn(`没有找到元素: ${selector}`);
    }
    return elements;
};

// 格式化日期时间
utils.formatDateTime = function(date = new Date()) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
};

// 显示通知
utils.showNotification = function(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // 添加到body
    document.body.appendChild(notification);
    
    // 添加样式
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 20px',
        borderRadius: '8px',
        background: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6',
        color: 'white',
        zIndex: '9999',
        fontSize: '0.875rem',
        fontWeight: '500',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease',
        opacity: '0'
    });
    
    // 显示通知
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 10);
    
    // 3秒后隐藏通知
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
};

// 防抖函数
utils.debounce = function(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// 节流函数
utils.throttle = function(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// 读取文件内容
utils.readFileContent = function(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = reject;
        
        if (file.type.includes('text') || file.name.endsWith('.txt')) {
            reader.readAsText(file);
        } else if (file.name.endsWith('.json')) {
            reader.readAsText(file);
        } else if (file.name.endsWith('.csv')) {
            reader.readAsText(file);
        } else if (file.type.includes('spreadsheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            // 对于Excel文件，这里只是简单处理，实际项目中可能需要专门的库
            reader.readAsArrayBuffer(file);
        } else {
            reject(new Error('不支持的文件类型'));
        }
    });
};

// 解析CSV文件
utils.parseCSV = function(text) {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(header => header.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const row = {};
        
        headers.forEach((header, index) => {
            row[header] = values[index] ? values[index].trim() : '';
        });
        
        if (Object.values(row).some(value => value !== '')) {
            data.push(row);
        }
    }
    
    return {
        headers,
        data
    };
};

// 提取文本摘要
utils.extractTextSummary = function(text, maxLength = 200) {
    // 移除多余的空白字符
    const cleanedText = text.replace(/\s+/g, ' ').trim();
    
    // 截取指定长度的文本
    if (cleanedText.length <= maxLength) {
        return cleanedText;
    }
    
    // 尝试在句子边界处截断
    const truncated = cleanedText.substring(0, maxLength);
    const lastPeriodIndex = truncated.lastIndexOf('.');
    const lastCommaIndex = truncated.lastIndexOf(',');
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    let cutIndex = lastPeriodIndex > 0 ? lastPeriodIndex + 1 : 
                  (lastCommaIndex > 0 ? lastCommaIndex + 1 : 
                  (lastSpaceIndex > 0 ? lastSpaceIndex : maxLength));
    
    return truncated.substring(0, cutIndex).trim() + '...';
};

// 验证文件大小
utils.validateFileSize = function(file, maxSizeMB = 5) {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
};

// 支持的文件类型
utils.SUPPORTED_FILE_TYPES = [
    { type: 'text/plain', extension: '.txt', name: '文本文件' },
    { type: 'application/json', extension: '.json', name: 'JSON文件' },
    { type: 'text/csv', extension: '.csv', name: 'CSV文件' },
    { type: 'application/vnd.ms-excel', extension: '.xls', name: 'Excel 97-2003' },
    { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', extension: '.xlsx', name: 'Excel' }
];

// 随机生成唯一ID
utils.generateId = function() {
    return Math.random().toString(36).substr(2, 9);
};

// 复制到剪贴板
utils.copyTextToClipboard = async function(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('复制失败:', err);
        // 降级方案：使用传统方法
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return true;
        } catch (err) {
            console.error('降级复制方法也失败:', err);
            document.body.removeChild(textArea);
            return false;
        }
    }
};

// 支持的文件类型和其他常量已在上面定义为utils对象的属性
// generateId和copyTextToClipboard函数也已在上面定义