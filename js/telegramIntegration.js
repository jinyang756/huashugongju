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

            // 测试连接是否成功
            this.testConnection()
                .then(() => {
                     // 保存Bot Token和连接状态
                     storage.telegramSettingsManager.saveSettings({
                         botToken: botToken,
                         isConnected: true,
                         lastConnected: new Date().toISOString()
                     });
                       
                     // 额外的本地存储备份
                     try {
                         localStorage.setItem('TELEGRAM_SETTINGS_BACKUP', JSON.stringify({
                             botToken: botToken,
                             isConnected: true,
                             lastConnected: new Date().toISOString()
                         }));
                     } catch (e) {
                         console.warn('本地存储备份失败:', e);
                     }
                      
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
        try {
            // 首先尝试从主存储获取
            const isConnected = storage.telegramSettingsManager.isConnected();
            const botKey = storage.telegramSettingsManager.getBotKey();
            const isMonitoring = storage.telegramSettingsManager.isMonitoring();
            const chatIds = storage.telegramSettingsManager.getChatIds();
            
            // 如果主存储没有或连接状态为false，尝试从备份存储恢复
            if (!isConnected || !botKey) {
                try {
                    const backupSettings = localStorage.getItem('TELEGRAM_SETTINGS_BACKUP');
                    if (backupSettings) {
                        const parsedBackup = JSON.parse(backupSettings);
                        // 验证备份数据
                        if ((parsedBackup.botKey || parsedBackup.botToken) && parsedBackup.isConnected) {
                             console.log('从备份恢复Telegram配置');
                             // 尝试重新连接
                             setTimeout(() => {
                                 this.connectBot(parsedBackup.botKey || parsedBackup.botToken).catch(e => console.warn('自动重连失败:', e));
                             }, 1000);
                         }
                    }
                } catch (e) {
                    console.warn('恢复备份配置失败:', e);
                }
            }
            
            return {
                isConnected: isConnected,
                botKey: botKey,
                isMonitoring: isMonitoring,
                chatIds: chatIds,
                hasSettings: !!botKey
            };
        } catch (error) {
            console.error('获取Telegram连接状态失败:', error);
            return {
                isConnected: false,
                botKey: null,
                isMonitoring: false,
                chatIds: [],
                hasSettings: false
            };
        }
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
        console.log('初始化Telegram集成');
        
        try {
            // 检查是否已有保存的连接设置
            const settings = storage.telegramSettingsManager.getSettings();
            if (settings && settings.botToken && settings.isConnected) {
                console.log('检测到已保存的Telegram连接设置，尝试自动重连');
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
            } else {
                // 尝试从备份恢复
                try {
                    const backupSettings = localStorage.getItem('TELEGRAM_SETTINGS_BACKUP');
                    if (backupSettings) {
                        const parsedBackup = JSON.parse(backupSettings);
                        if (parsedBackup.botKey && parsedBackup.isConnected) {
                            console.log('从备份恢复Telegram配置并尝试重连');
                            // 保存回主存储
                             storage.telegramSettingsManager.saveSettings({
                                 botToken: parsedBackup.botKey || parsedBackup.botToken,
                                 isConnected: parsedBackup.isConnected,
                                 lastConnected: parsedBackup.lastConnected || new Date().toISOString()
                             });
                            // 自动尝试重连
                            this.testConnection()
                                .then(() => {
                                    console.log('Telegram Bot从备份恢复并连接成功');
                                })
                                .catch(error => {
                                    console.warn('Telegram Bot从备份恢复但连接失败:', error);
                                    storage.telegramSettingsManager.setConnected(false);
                                });
                        }
                    }
                } catch (e) {
                    console.warn('恢复备份配置失败:', e);
                }
            }
        } catch (error) {
            console.error('初始化Telegram集成失败:', error);
        }
    }
};

// 在DOM加载完成后初始化模块
document.addEventListener('DOMContentLoaded', () => {
    window.telegramIntegration.init();
});