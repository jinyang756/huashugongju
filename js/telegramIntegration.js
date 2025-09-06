/**
 * Telegram集成模块
 * 负责与Telegram Bot API交互，处理消息接收和发送
 */

// 将模块挂载到全局对象上
window.telegramIntegration = {
    // 连接Telegram Bot
    connectBot(botToken) {
        return new Promise((resolve, reject) => {
            // 验证Bot Token格式是否正确
            if (!botToken || !botToken.match(/^\d+:\w+$/)) {
                reject(new Error('无效的Bot Token格式'));
                return;
            }

            // 保存Bot Token
            storage.telegramSettingsManager.setBotKey(botToken);

            // 测试连接是否成功
            this.testConnection()
                .then(() => {
                    storage.telegramSettingsManager.setConnected(true);
                    utils.showNotification('Telegram Bot连接成功！', 'success');
                    resolve(true);
                })
                .catch(error => {
                    storage.telegramSettingsManager.setConnected(false);
                    utils.showNotification('Telegram Bot连接失败：' + error.message, 'error');
                    reject(error);
                });
        });
    },

    // 测试Telegram Bot连接
    testConnection() {
        return new Promise((resolve, reject) => {
            const botKey = storage.telegramSettingsManager.getBotKey();
            if (!botKey) {
                reject(new Error('Bot Token未设置'));
                return;
            }

            // 使用fetch API调用Telegram Bot的getMe方法
            fetch(`https://api.telegram.org/bot${botKey}/getMe`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('API请求失败: ' + response.status);
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.ok) {
                        console.log('Telegram Bot信息:', data.result);
                        resolve(data.result);
                    } else {
                        reject(new Error(data.description || '未知错误'));
                    }
                })
                .catch(error => {
                    reject(new Error('连接失败: ' + error.message));
                });
        });
    },

    // 发送消息到Telegram
    sendMessage(chatId, message, options = {}) {
        return new Promise((resolve, reject) => {
            if (!storage.telegramSettingsManager.isConnected()) {
                reject(new Error('Telegram Bot未连接'));
                return;
            }

            const botKey = storage.telegramSettingsManager.getBotKey();
            if (!botKey) {
                reject(new Error('Bot Token未设置'));
                return;
            }

            const params = {
                chat_id: chatId,
                text: message,
                parse_mode: options.parseMode || 'Markdown',
                disable_notification: options.disableNotification || false
            };

            fetch(`https://api.telegram.org/bot${botKey}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(params)
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('发送消息失败: ' + response.status);
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.ok) {
                        // 保存聊天ID到设置中
                        storage.telegramSettingsManager.addChatId(chatId);
                        resolve(data.result);
                    } else {
                        reject(new Error(data.description || '未知错误'));
                    }
                })
                .catch(error => {
                    reject(new Error('发送消息失败: ' + error.message));
                });
        });
    },

    // 获取最新消息
    getUpdates() {
        return new Promise((resolve, reject) => {
            if (!storage.telegramSettingsManager.isConnected()) {
                reject(new Error('Telegram Bot未连接'));
                return;
            }

            const botKey = storage.telegramSettingsManager.getBotKey();
            if (!botKey) {
                reject(new Error('Bot Token未设置'));
                return;
            }

            const lastMessageId = storage.telegramSettingsManager.getLastMessageId();
            const params = {
                offset: lastMessageId + 1,
                timeout: 30
            };

            fetch(`https://api.telegram.org/bot${botKey}/getUpdates`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('获取更新失败: ' + response.status);
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.ok && data.result.length > 0) {
                        // 更新最后一个update_id到存储中
                        const newLastMessageId = data.result[data.result.length - 1].update_id;
                        storage.telegramSettingsManager.updateLastMessageId(newLastMessageId);
                        
                        // 保存新的聊天ID
                        data.result.forEach(update => {
                            if (update.message && update.message.chat && update.message.chat.id) {
                                storage.telegramSettingsManager.addChatId(update.message.chat.id);
                            }
                        });
                        
                        resolve(data.result);
                    } else {
                        resolve([]);
                    }
                })
                .catch(error => {
                    reject(new Error('获取更新失败: ' + error.message));
                });
        });
    },

    // 开始监控Telegram消息
    startMonitoring(callback) {
        if (!storage.telegramSettingsManager.isConnected()) {
            console.error('Telegram Bot未连接，无法开始监控');
            utils.showNotification('Telegram Bot未连接，无法开始监控', 'error');
            return null;
        }

        // 设置监控状态为true
        storage.telegramSettingsManager.setMonitoring(true);
        utils.showNotification('Telegram消息监控已启动', 'success');

        const monitorInterval = setInterval(() => {
            this.getUpdates()
                .then(updates => {
                    if (updates.length > 0 && typeof callback === 'function') {
                        callback(updates);
                    }
                })
                .catch(error => {
                    console.error('监控消息时出错:', error);
                    // 如果连续出错，可能是连接已断开
                    utils.showNotification('Telegram消息监控出错: ' + error.message, 'error');
                });
        }, 3000); // 每3秒检查一次新消息

        return monitorInterval;
    },

    // 停止监控
    stopMonitoring(intervalId) {
        if (intervalId) {
            clearInterval(intervalId);
            storage.telegramSettingsManager.setMonitoring(false);
            utils.showNotification('Telegram消息监控已停止', 'info');
        }
    },

    // 获取连接状态
    getConnectionStatus() {
        return {
            isConnected: storage.telegramSettingsManager.isConnected(),
            botKey: storage.telegramSettingsManager.getBotKey(),
            isMonitoring: storage.telegramSettingsManager.isMonitoring(),
            chatIds: storage.telegramSettingsManager.getChatIds()
        };
    },

    // 断开连接
    disconnect() {
        storage.telegramSettingsManager.setConnected(false);
        storage.telegramSettingsManager.setMonitoring(false);
        utils.showNotification('已断开Telegram连接', 'info');
    },

    // 完全重置Telegram设置（包括Bot Key）
    resetSettings() {
        storage.telegramSettingsManager.clearSettings();
        utils.showNotification('Telegram设置已重置', 'info');
    },

    // 初始化模块
    init() {
        // 从存储中加载设置
        const settings = storage.telegramSettingsManager.getSettings();
        if (settings && settings.botToken && settings.isConnected) {
            // 自动尝试重连
            this.testConnection()
                .then(() => {
                    storage.telegramSettingsManager.setConnected(true);
                    console.log('Telegram Bot自动重连成功');
                })
                .catch(error => {
                    console.warn('Telegram Bot自动重连失败:', error);
                    storage.telegramSettingsManager.setConnected(false);
                });
        }
    }
};

// 在DOM加载完成后初始化模块
document.addEventListener('DOMContentLoaded', () => {
    window.telegramIntegration.init();
});