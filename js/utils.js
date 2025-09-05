/**
 * 工具函数模块
 * 包含项目中使用的通用辅助功能
 */

// 获取元素并提供错误处理
export function getElement(selector, parent = document) {
    const element = parent.querySelector(selector);
    if (!element) {
        console.warn(`元素未找到: ${selector}`);
    }
    return element;
}

// 获取所有元素并提供错误处理
export function getElements(selector, parent = document) {
    const elements = parent.querySelectorAll(selector);
    if (elements.length === 0) {
        console.warn(`没有找到元素: ${selector}`);
    }
    return elements;
}

// 格式化日期时间
export function formatDateTime(date = new Date()) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
}

// 显示通知
export function showNotification(message, type = 'info') {
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
}

// 防抖函数
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 节流函数
export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 随机生成唯一ID
export function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

// 复制到剪贴板
export async function copyTextToClipboard(text) {
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
}