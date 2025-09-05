/**
 * 主入口模块
 * 整合所有功能模块，处理DOM交互和页面初始化
 */

// 从全局对象中获取所需功能
const { getElement, getElements, copyTextToClipboard, formatDateTime, debounce } = utils;
const { recentRecordsManager, statsManager, settingsManager, draftsManager } = storage;
const { generateScript, AVAILABLE_MODELS, AVAILABLE_STYLES, AVAILABLE_LENGTHS } = scriptGenerator;
const { initKnowledgeBase, retrieveKnowledge } = knowledgeBase;

// 全局调试函数
window.debugApp = function() {
    console.log('=== 应用调试信息 ===');
    console.log('DOM元素状态:', {
        generateButton: !!elements.generateButton,
        inputTextarea: !!elements.inputTextarea,
        outputTextarea: !!elements.outputTextarea,
        copyButton: !!elements.copyButton,
        editButton: !!elements.editButton,
    });
    console.log('=== 调试结束 ===');
};

// DOM元素缓存
const elements = {
    generateButton: null,
    inputTextarea: null,
    outputTextarea: null,
    copyButton: null,
    editButton: null,
    recentRecordsContainer: null,
    statValues: null,
    settingsPanel: null,
    selectedModel: null,
    selectedStyle: null,
    selectedRole: null,
    selectedLength: null,
    clearRecordsButton: null,
    clearDraftsButton: null,
    // 新增功能按钮
    newConversationButton: null,
    settingsButton: null,
    knowledgeBaseButton: null,
    conversationRecordsButton: null,
    uploadDataButton: null,
    scriptGeneratorButton: null,
    optimizationButton: null,
    batchGenerateButton: null,
    telegramMonitorButton: null,
    apiConfigButton: null,
    telegramConnectButton: null
};

// 初始化应用
async function initApp() {
    try {
        // 获取DOM元素
        cacheDOMElements();
        
        // 注册事件监听器
        registerEventListeners();
        
        // 初始化设置
        initSettings();
        
        // 添加知识库权重配置UI
        addKnowledgeWeightControl();
        
        // 添加历史记录筛选UI
        addRecordFilterUI();
        
        // 加载最近记录
        loadRecentRecords();
        
        // 更新统计信息
        updateStats();
        
        // 初始化加载动画
        initLoadAnimation();
        
        // 加载自动保存的草稿
        loadDraft();
        
        console.log('应用初始化成功');
        utils.showNotification('AI对话脚本生成器已就绪', 'info');
        
        // 初始化知识库功能
        await initKnowledgeBase();
        
        // 设置模态框关闭事件
        setupModalCloseEvent();
    } catch (error) {
        console.error('应用初始化失败:', error);
        utils.showNotification('应用初始化失败，请刷新页面重试。', 'error');
    }
}

// 缓存DOM元素
function cacheDOMElements() {
    console.log('开始缓存DOM元素...');
    elements.generateButton = getElement('#generate-btn');
    elements.inputTextarea = getElement('#input-textarea');
    elements.outputTextarea = getElement('#output-textarea');
    elements.copyButton = getElement('#copy-btn');
    elements.editButton = getElement('#edit-btn');
    elements.recentRecordsContainer = getElement('.recent-records');
    elements.statValues = getElements('.stat-value');
    elements.settingsPanel = getElement('.settings-panel');
    elements.selectedModel = getElement('#model-select');
    elements.selectedStyle = getElement('#style-select');
    elements.selectedRole = getElement('#role-select');
    elements.selectedLength = getElement('#length-select');
    elements.clearRecordsButton = getElement('#clear-records-btn');
    elements.clearDraftsButton = getElement('#clear-drafts-btn');
    
    // 新增功能按钮缓存
    elements.newConversationButton = document.querySelector('.btn-primary'); // 新建对话按钮
    elements.settingsButton = document.querySelector('.btn-secondary'); // 设置按钮
    
    // 侧边栏菜单按钮
    elements.knowledgeBaseButton = getElement('.menu-item:nth-child(1)'); // 知识库管理
    elements.conversationRecordsButton = getElement('.menu-item:nth-child(2)'); // 对话记录
    elements.uploadDataButton = getElement('.menu-item:nth-child(3)'); // 上传数据
    elements.scriptGeneratorButton = getElement('.menu-item:nth-child(4)'); // 脚本生成
    elements.optimizationButton = getElement('.menu-item:nth-child(5)'); // 优化建议
    elements.batchGenerateButton = getElement('.menu-item:nth-child(6)'); // 批量生成
    elements.telegramMonitorButton = getElement('.menu-item:nth-child(7)'); // Telegram监控
    elements.apiConfigButton = getElement('.menu-item:nth-child(8)'); // API配置
    
    // Telegram连接按钮
    elements.telegramConnectButton = document.querySelector('.btn-primary');
    
    // 调试日志
    console.log('DOM元素缓存结果:', {
        generateButton: !!elements.generateButton,
        inputTextarea: !!elements.inputTextarea,
        outputTextarea: !!elements.outputTextarea,
        copyButton: !!elements.copyButton,
        editButton: !!elements.editButton,
        selectedModel: !!elements.selectedModel,
        selectedStyle: !!elements.selectedStyle,
        selectedRole: !!elements.selectedRole,
        selectedLength: !!elements.selectedLength,
        newConversationButton: !!elements.newConversationButton,
        settingsButton: !!elements.settingsButton
    });
}

// 注册事件监听器
function registerEventListeners() {
    console.log('开始注册事件监听器...');
    
    if (elements.generateButton) {
        console.log('绑定生成按钮点击事件');
        elements.generateButton.addEventListener('click', function() {
            console.log('生成按钮被点击');
            handleGenerateClick();
        });
    } else {
        console.error('生成按钮元素未找到');
    }
    
    if (elements.copyButton) {
        console.log('绑定复制按钮点击事件');
        elements.copyButton.addEventListener('click', function() {
            console.log('复制按钮被点击');
            handleCopyClick();
        });
    }
    
    if (elements.editButton) {
        console.log('绑定编辑按钮点击事件');
        elements.editButton.addEventListener('click', function() {
            console.log('编辑按钮被点击');
            handleEditClick();
        });
    }
    
    if (elements.clearRecordsButton) {
        console.log('绑定清空记录按钮点击事件');
        elements.clearRecordsButton.addEventListener('click', handleClearRecords);
    }
    
    if (elements.clearDraftsButton) {
        console.log('绑定清空草稿按钮点击事件');
        elements.clearDraftsButton.addEventListener('click', handleClearDrafts);
    }
    
    // 新增功能按钮事件监听器
    if (elements.newConversationButton) {
        console.log('绑定新建对话按钮点击事件');
        elements.newConversationButton.addEventListener('click', function() {
            console.log('新建对话按钮被点击');
            handleNewConversationClick();
        });
    }
    
    if (elements.settingsButton) {
        console.log('绑定设置按钮点击事件');
        elements.settingsButton.addEventListener('click', function() {
            console.log('设置按钮被点击');
            handleSettingsButtonClick();
        });
    }
    
    // 侧边栏菜单按钮事件监听器
    if (elements.knowledgeBaseButton) {
        console.log('绑定知识库管理按钮点击事件');
        elements.knowledgeBaseButton.addEventListener('click', function() {
            console.log('知识库管理按钮被点击');
            handleMenuItemClick('knowledge-base');
        });
    }
    
    if (elements.conversationRecordsButton) {
        console.log('绑定对话记录按钮点击事件');
        elements.conversationRecordsButton.addEventListener('click', function() {
            console.log('对话记录按钮被点击');
            handleMenuItemClick('conversation-records');
        });
    }
    
    if (elements.uploadDataButton) {
        console.log('绑定上传数据按钮点击事件');
        elements.uploadDataButton.addEventListener('click', function() {
            console.log('上传数据按钮被点击');
            handleMenuItemClick('upload-data');
        });
    }
    
    if (elements.scriptGeneratorButton) {
        console.log('绑定脚本生成按钮点击事件');
        elements.scriptGeneratorButton.addEventListener('click', function() {
            console.log('脚本生成按钮被点击');
            handleMenuItemClick('script-generator');
        });
    }
    
    if (elements.optimizationButton) {
        console.log('绑定优化建议按钮点击事件');
        elements.optimizationButton.addEventListener('click', function() {
            console.log('优化建议按钮被点击');
            handleMenuItemClick('optimization');
        });
    }
    
    if (elements.batchGenerateButton) {
        console.log('绑定批量生成按钮点击事件');
        elements.batchGenerateButton.addEventListener('click', function() {
            console.log('批量生成按钮被点击');
            handleMenuItemClick('batch-generate');
        });
    }
    
    if (elements.telegramMonitorButton) {
        console.log('绑定Telegram监控按钮点击事件');
        elements.telegramMonitorButton.addEventListener('click', function() {
            console.log('Telegram监控按钮被点击');
            handleMenuItemClick('telegram-monitor');
        });
    }
    
    if (elements.apiConfigButton) {
        console.log('绑定API配置按钮点击事件');
        elements.apiConfigButton.addEventListener('click', function() {
            console.log('API配置按钮被点击');
            handleMenuItemClick('api-config');
        });
    }
    
    if (elements.telegramConnectButton && elements.telegramConnectButton.textContent.includes('连接')) {
        console.log('绑定Telegram连接按钮点击事件');
        elements.telegramConnectButton.addEventListener('click', function() {
            console.log('Telegram连接按钮被点击');
            handleTelegramConnectClick();
        });
    }
    
    // 监听输入框变化，实现自动保存草稿
    if (elements.inputTextarea) {
        console.log('绑定输入框输入事件');
        elements.inputTextarea.addEventListener('input', debounce(saveDraft, 1000));
    }
    
    // 监听设置变更
    if (elements.selectedModel) {
        console.log('绑定模型选择器变更事件');
        elements.selectedModel.addEventListener('change', handleSettingsChange);
    }
    
    if (elements.selectedStyle) {
        console.log('绑定风格选择器变更事件');
        elements.selectedStyle.addEventListener('change', handleSettingsChange);
    }
    
    if (elements.selectedRole) {
        console.log('绑定角色选择器变更事件');
        elements.selectedRole.addEventListener('change', handleSettingsChange);
    }
    
    if (elements.selectedLength) {
        console.log('绑定长度选择器变更事件');
        elements.selectedLength.addEventListener('change', handleSettingsChange);
    }
    
    // 监听键盘事件
    document.addEventListener('keydown', handleKeydown);
    
    console.log('事件监听器注册完成');
}

// 初始化设置
function initSettings() {
    const settings = settingsManager.get();
    
    // 填充下拉选择框
    populateSelectOptions(elements.selectedModel, AVAILABLE_MODELS, settings.selectedModel);
    populateSelectOptions(elements.selectedStyle, AVAILABLE_STYLES, settings.selectedStyle);
    if (elements.selectedRole) {
        populateSelectOptions(elements.selectedRole, [
            { id: 'customer_service', name: '客服-用户' },
            { id: 'teacher_student', name: '老师-学生' },
            { id: 'doctor_patient', name: '医生-患者' },
            { id: 'sales_customer', name: '销售-客户' }
        ], settings.selectedRole || 'customer_service');
    }
    populateSelectOptions(elements.selectedLength, AVAILABLE_LENGTHS, settings.selectedLength, 'value', 'label');
}

// 填充选择框选项
function populateSelectOptions(selectElement, options, selectedValue, valueKey = 'id', labelKey = 'name') {
    if (!selectElement) return;
    
    selectElement.innerHTML = '';
    
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option[valueKey];
        optionElement.textContent = option[labelKey];
        if (option[valueKey] === selectedValue) {
            optionElement.selected = true;
        }
        selectElement.appendChild(optionElement);
    });
}

// 处理设置变更
function handleSettingsChange() {
    if (!elements.selectedModel || !elements.selectedStyle || !elements.selectedLength) return;
    
    const settings = {
        selectedModel: elements.selectedModel.value,
        selectedStyle: elements.selectedStyle.value,
        selectedRole: elements.selectedRole ? elements.selectedRole.value : 'customer_service',
        selectedLength: parseInt(elements.selectedLength.value)
    };
    
    settingsManager.save(settings);
    utils.showNotification('设置已保存', 'success');
}

// 处理新建对话按钮点击
function handleNewConversationClick() {
    try {
        // 清空输入框和输出框
        if (elements.inputTextarea) {
            elements.inputTextarea.value = '';
        }
        
        if (elements.outputTextarea) {
            elements.outputTextarea.value = '';
        }
        
        utils.showNotification('已开始新对话', 'success');
    } catch (error) {
        console.error('新建对话时发生错误:', error);
        utils.showNotification('新建对话失败', 'error');
    }
}

// 处理设置按钮点击
function handleSettingsButtonClick() {
    try {
        // 切换设置面板的显示/隐藏
        if (elements.settingsPanel) {
            elements.settingsPanel.style.display = elements.settingsPanel.style.display === 'none' ? 'block' : 'none';
            utils.showNotification(elements.settingsPanel.style.display === 'block' ? '设置面板已显示' : '设置面板已隐藏', 'success');
        } else {
            // 如果没有设置面板，创建一个简单的设置模态框
            alert('设置功能即将上线，敬请期待！');
        }
    } catch (error) {
        console.error('打开设置时发生错误:', error);
        utils.showNotification('打开设置失败', 'error');
    }
}

// 处理侧边栏菜单项点击
function handleMenuItemClick(itemType) {
    try {
        // 在控制台记录点击的菜单项
        console.log(`菜单项 ${itemType} 被点击`);
        
        // 为所有菜单项添加高亮处理
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.classList.remove('active');
        });
        
        // 获取当前点击的菜单项并添加高亮
        const currentItem = document.querySelector(`[data-menu-item="${itemType}"]`) || 
                          getElement(`.menu-item:nth-child(${getMenuItemIndex(itemType)})`);
        if (currentItem) {
            currentItem.classList.add('active');
        }
        
        // 根据不同的菜单项类型执行不同的操作
        switch (itemType) {
            case 'knowledge-base':
                utils.showNotification('已切换到知识库管理', 'success');
                // 可以在这里添加显示知识库管理面板的逻辑
                break;
            case 'conversation-records':
                utils.showNotification('已切换到对话记录', 'success');
                // 可以在这里添加显示对话记录面板的逻辑
                loadRecentRecords();
                break;
            case 'upload-data':
                utils.showNotification('已切换到数据上传', 'success');
                // 可以在这里添加显示数据上传面板的逻辑
                break;
            case 'script-generator':
                utils.showNotification('已切换到脚本生成器', 'success');
                // 可以在这里添加显示脚本生成器面板的逻辑
                break;
            case 'optimization':
                utils.showNotification('已切换到优化建议', 'success');
                // 可以在这里添加显示优化建议面板的逻辑
                break;
            case 'batch-generate':
                utils.showNotification('批量生成功能即将上线', 'info');
                break;
            case 'telegram-monitor':
                utils.showNotification('Telegram监控功能即将上线', 'info');
                break;
            case 'api-config':
                utils.showNotification('API配置功能即将上线', 'info');
                break;
            default:
                utils.showNotification('功能切换成功', 'success');
        }
    } catch (error) {
        console.error(`处理菜单项 ${itemType} 点击时发生错误:`, error);
        utils.showNotification('功能切换失败', 'error');
    }
}

// 获取菜单项索引
function getMenuItemIndex(itemType) {
    const menuMap = {
        'knowledge-base': 1,
        'conversation-records': 2,
        'upload-data': 3,
        'script-generator': 4,
        'optimization': 5,
        'batch-generate': 6,
        'telegram-monitor': 7,
        'api-config': 8
    };
    return menuMap[itemType] || 1;
}

// 处理Telegram连接按钮点击
function handleTelegramConnectClick() {
    try {
        utils.showNotification('正在连接Telegram账号...', 'info');
        // 这里可以添加实际的Telegram连接逻辑
        // 由于是模拟环境，这里仅显示通知
        setTimeout(() => {
            utils.showNotification('Telegram账号连接成功', 'success');
        }, 1500);
    } catch (error) {
        console.error('连接Telegram时发生错误:', error);
        utils.showNotification('连接Telegram失败', 'error');
    }
}

// 处理生成按钮点击
async function handleGenerateClick() {
    if (!elements.inputTextarea || !elements.outputTextarea || !elements.generateButton) return;
    
    const prompt = elements.inputTextarea.value.trim();
    
    if (!prompt) {
        utils.showNotification('请输入提示内容', 'error');
        return;
    }
    
    // 禁用按钮，显示加载状态
    elements.generateButton.disabled = true;
    elements.generateButton.classList.add('loading');
    
    try {
        // 获取当前设置
        const settings = settingsManager.get();
        
        // 获取对话角色
        const characterRole = elements.selectedRole ? elements.selectedRole.value : '客服-用户';
        
        // 获取知识库权重
        const knowledgeWeightElement = document.getElementById('knowledge-weight');
        const knowledgeWeight = knowledgeWeightElement ? parseFloat(knowledgeWeightElement.value) : 0.5;
        
        // 构建上下文历史（如果当前有内容，可以作为历史）
        const contextHistory = [];
        if (elements.outputTextarea.value.trim()) {
            // 简单处理：假设之前的输出是一个对话记录
            // 实际应用中可能需要更复杂的解析逻辑
            const previousContent = elements.outputTextarea.value.trim();
            // 这里只是一个简单的模拟，实际应用中需要根据对话格式解析
            if (previousContent.includes('用户：') && previousContent.includes('AI：')) {
                const lines = previousContent.split('\n');
                let currentMessage = '';
                let currentRole = '';
                
                lines.forEach(line => {
                    if (line.startsWith('用户：')) {
                        if (currentMessage && currentRole) {
                            contextHistory.push({ role: currentRole, content: currentMessage });
                        }
                        currentRole = '用户';
                        currentMessage = line.substring(3).trim();
                    } else if (line.startsWith('AI：')) {
                        if (currentMessage && currentRole) {
                            contextHistory.push({ role: currentRole, content: currentMessage });
                        }
                        currentRole = 'AI';
                        currentMessage = line.substring(3).trim();
                    } else if (currentMessage) {
                        currentMessage += '\n' + line.trim();
                    }
                });
                
                // 添加最后一条消息
                if (currentMessage && currentRole) {
                    contextHistory.push({ role: currentRole, content: currentMessage });
                }
            }
        }
        
        // 从知识库中检索相关内容
        utils.showNotification('正在从知识库检索相关信息...', 'info');
        const relevantKnowledge = retrieveKnowledge(prompt);
        
        // 记录开始时间
        const startTime = Date.now();
        
        // 生成脚本，传递上下文历史、角色信息和知识库内容
        const result = await generateScript(prompt, {
            ...settings,
            contextHistory,
            characterRole,
            knowledgeBaseItems: relevantKnowledge,
            knowledgeWeight: knowledgeWeight
        });
        
        // 计算生成时间
        const generationTime = (Date.now() - startTime) / 1000;
        
        if (result.success) {
            // 显示生成结果
            elements.outputTextarea.value = result.content;
            
            // 记录是否使用了知识库
            const usedKnowledgeBase = result.usedKnowledgeBase || false;
            
            // 更新统计信息，包括本次生成时间和知识库使用情况
            updateStats({ generationTime, knowledgeUsed: usedKnowledgeBase });
            
            // 保存到最近记录（包含知识库关联信息）
            const title = prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt;
            recentRecordsManager.add({
                title,
                content: result.content,
                model: settings.selectedModel,
                style: settings.selectedStyle,
                characterRole: characterRole,
                knowledgeUsed: usedKnowledgeBase,
                knowledgeItems: relevantKnowledge.map(item => ({id: item.id, title: item.title}))
            });
            
            // 重新加载最近记录
            loadRecentRecords();
            
            // 清空自动保存的草稿
            draftsManager.clear();
            
            // 显示成功通知
            utils.showNotification('脚本生成成功！' + (usedKnowledgeBase ? ' 已使用知识库内容。' : ''), 'success');
        } else {
            // 显示错误信息
            utils.showNotification(result.message || '生成失败，请稍后重试。', 'error');
        }
    } catch (error) {
        console.error('生成过程中发生错误:', error);
        utils.showNotification('生成失败，请稍后重试。', 'error');
    } finally {
        // 恢复按钮状态
        elements.generateButton.disabled = false;
        elements.generateButton.classList.remove('loading');
    }
}

// 处理复制按钮点击
async function handleCopyClick() {
    if (!elements.outputTextarea) return;
    
    const textToCopy = elements.outputTextarea.value.trim();
    
    if (!textToCopy) {
        utils.showNotification('没有内容可复制', 'error');
        return;
    }
    
    try {
        const success = await copyTextToClipboard(textToCopy);
        
        if (success) {
            utils.showNotification('已复制到剪贴板', 'success');
        } else {
            utils.showNotification('复制失败，请手动复制', 'error');
        }
    } catch (error) {
        console.error('复制失败:', error);
        utils.showNotification('复制失败，请手动复制', 'error');
    }
}

// 设置模态框关闭事件
function setupModalCloseEvent() {
    const closeButtons = getElements('.modal-close');
    const modal = getElement('#text-knowledge-modal');
    
    if (modal && closeButtons && closeButtons.length > 0) {
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        });
        
        // 点击模态框外部关闭
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
}

// 处理编辑按钮点击
function handleEditClick() {
    if (!elements.inputTextarea || !elements.outputTextarea) return;
    
    const outputText = elements.outputTextarea.value.trim();
    
    if (!outputText) {
        utils.showNotification('没有内容可编辑', 'error');
        return;
    }
    
    // 将输出内容复制到输入框进行编辑
    elements.inputTextarea.value = outputText;
    
    // 清空输出框
    elements.outputTextarea.value = '';
    
    // 滚动到输入框
    elements.inputTextarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
    elements.inputTextarea.focus();
    
    utils.showNotification('已准备好编辑内容', 'info');
}

// 加载最近记录
function loadRecentRecords() {
    if (!elements.recentRecordsContainer) return;
    
    const records = recentRecordsManager.get();
    
    // 清空容器
    elements.recentRecordsContainer.innerHTML = '';
    
    if (records.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-records';
        emptyMessage.textContent = '暂无最近记录';
        elements.recentRecordsContainer.appendChild(emptyMessage);
        return;
    }
    
    // 创建记录列表
    const recordsList = document.createElement('div');
    recordsList.className = 'records-list';
    
    records.forEach(record => {
        const recordItem = createRecordItemWithKnowledgeFlag(record);
        recordsList.appendChild(recordItem);
    });
    
    elements.recentRecordsContainer.appendChild(recordsList);
}

// 创建记录项
function createRecordItem(record) {
    const item = document.createElement('div');
    item.className = 'record-item';
    
    // 解析时间戳
    const date = new Date(record.timestamp);
    const formattedDate = formatDateTime(date);
    
    // 获取角色名称映射
    const getRoleDisplayName = (roleId) => {
        const roleMap = {
            'customer_service': '客服-用户',
            'teacher_student': '老师-学生',
            'doctor_patient': '医生-患者',
            'sales_customer': '销售-客户'
        };
        return roleMap[roleId] || roleId;
    };
    
    // 构建记录HTML
    item.innerHTML = `
        <div class="record-header">
            <h4 class="record-title">${escapeHtml(record.title)}</h4>
            <span class="record-date">${formattedDate}</span>
        </div>
        <div class="record-meta">
            <span class="record-model">${escapeHtml(record.model)}</span>
            <span class="record-style">${escapeHtml(record.style)}</span>
            ${record.characterRole ? `<span class="record-role">${escapeHtml(getRoleDisplayName(record.characterRole))}</span>` : ''}
            ${record.hasContext ? `<span class="record-context">带上下文</span>` : ''}
        </div>
        <div class="record-actions">
            <button class="record-action-btn load-btn" data-id="${record.id}">加载</button>
            <button class="record-action-btn copy-btn" data-id="${record.id}">复制</button>
            <button class="record-action-btn delete-btn" data-id="${record.id}">删除</button>
        </div>
    `;
    
    // 添加事件监听
    const loadBtn = item.querySelector('.load-btn');
    const copyBtn = item.querySelector('.copy-btn');
    const deleteBtn = item.querySelector('.delete-btn');
    
    if (loadBtn) {
        loadBtn.addEventListener('click', () => loadRecord(record.id));
    }
    
    if (copyBtn) {
        copyBtn.addEventListener('click', () => copyRecord(record.id));
    }
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => deleteRecord(record.id));
    }
    
    // 点击整个记录项也加载记录
    item.addEventListener('click', (e) => {
        // 避免与按钮点击事件冲突
        if (!e.target.closest('.record-action-btn')) {
            loadRecord(record.id);
        }
    });
    
    return item;
}

// 加载记录
function loadRecord(recordId) {
    try {
        const records = recentRecordsManager.get();
        const record = records.find(r => r.id === recordId);
        
        if (record && elements.outputTextarea && elements.selectedModel && elements.selectedStyle && elements.selectedLength) {
            // 加载内容
            elements.outputTextarea.value = record.content || '';
            
            // 同时恢复对应的设置
            if (record.model) {
                elements.selectedModel.value = record.model;
            }
            if (record.style) {
                elements.selectedStyle.value = record.style;
            }
            if (record.length) {
                elements.selectedLength.value = record.length;
            }
            
            // 滚动到输出区域
            elements.outputTextarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            utils.showNotification('记录已加载', 'success');
        } else {
            utils.showNotification('记录加载失败', 'error');
        }
    } catch (error) {
        console.error('加载记录时发生错误:', error);
        utils.showNotification('记录加载失败', 'error');
    }
}

// 删除记录
function deleteRecord(recordId) {
    if (confirm('确定要删除这条记录吗？')) {
        const success = recentRecordsManager.remove(recordId);
        
        if (success) {
            loadRecentRecords();
            utils.showNotification('记录已删除', 'success');
        } else {
            utils.showNotification('记录删除失败', 'error');
        }
    }
}

// 清空所有记录
function handleClearRecords() {
    if (confirm('确定要清空所有最近记录吗？此操作不可恢复。')) {
        const success = recentRecordsManager.clear();
        
        if (success) {
            loadRecentRecords();
            utils.showNotification('所有记录已清空', 'success');
        } else {
            utils.showNotification('清空记录失败', 'error');
        }
    }
}

// 清空所有草稿
function handleClearDrafts() {
    if (confirm('确定要清空所有草稿吗？此操作不可恢复。')) {
        try {
            draftsManager.clear();
            utils.showNotification('所有草稿已清空', 'success');
        } catch (error) {
            console.error('清空草稿时发生错误:', error);
            utils.showNotification('清空草稿失败', 'error');
        }
    }
}

// 更新统计信息
function updateStats(options = {}) {
    if (!elements.statValues || elements.statValues.length === 0) return;
    
    try {
        let stats = statsManager.get();
        
        // 如果提供了新的生成时间和知识库使用情况，更新统计
        if (options.generationTime !== undefined) {
            stats = statsManager.updateWithNewGeneration(options.generationTime, options.knowledgeUsed);
        }
        
        // 确保有足够的元素显示所有统计数据
        if (elements.statValues.length >= 5) {
            elements.statValues[0].textContent = stats.totalScripts || 0;
            elements.statValues[1].textContent = (stats.averageTime || 0).toFixed(1) + 's';
            elements.statValues[2].textContent = (stats.successRate || 0).toFixed(1) + '%';
            elements.statValues[3].textContent = (stats.knowledgeUtilization || 0).toFixed(1) + '%';
            
            // 获取实际草稿数量
            const drafts = draftsManager.get();
            elements.statValues[4].textContent = drafts.length || 0;
        } else if (elements.statValues.length >= 4) {
            // 如果只有4个统计项，用知识库利用率替换草稿数
            elements.statValues[0].textContent = stats.totalScripts || 0;
            elements.statValues[1].textContent = (stats.averageTime || 0).toFixed(1) + 's';
            elements.statValues[2].textContent = (stats.successRate || 0).toFixed(1) + '%';
            elements.statValues[3].textContent = (stats.knowledgeUtilization || 0).toFixed(1) + '%';
        }
    } catch (error) {
        console.error('更新统计信息时发生错误:', error);
    }
}

// 初始化加载动画
function initLoadAnimation() {
    // 可以在这里添加加载动画的初始化代码
    // 例如：为按钮添加点击时的波纹效果等
}

// 处理键盘事件
function handleKeydown(event) {
    // Ctrl/Cmd + Enter 快速生成
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        handleGenerateClick();
    }
    
    // Ctrl/Cmd + C 复制结果
    if ((event.ctrlKey || event.metaKey) && event.key === 'c' && elements.outputTextarea === document.activeElement) {
        event.preventDefault();
        handleCopyClick();
    }
}

// HTML转义函数，防止XSS攻击
function escapeHtml(text) {
    if (!text) return '';
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 复制记录内容
function copyRecord(recordId) {
    try {
        const records = recentRecordsManager.get();
        const record = records.find(r => r.id === recordId);
        
        if (record) {
            const success = copyTextToClipboard(record.content || '');
            
            if (success) {
                utils.showNotification('记录内容已复制到剪贴板', 'success');
            } else {
                utils.showNotification('复制失败，请手动复制', 'error');
            }
        } else {
            utils.showNotification('未找到记录', 'error');
        }
    } catch (error) {
        console.error('复制记录时发生错误:', error);
        showNotification('复制失败，请手动复制', 'error');
    }
}

// 自动保存草稿
function saveDraft() {
    if (!elements.inputTextarea) return;
    
    const content = elements.inputTextarea.value.trim();
    
    if (content) {
        try {
            draftsManager.save(content);
        } catch (error) {
            console.error('保存草稿时发生错误:', error);
        }
    }
}

// 加载自动保存的草稿
function loadDraft() {
    if (!elements.inputTextarea) return;
    
    try {
        const drafts = draftsManager.get();
        
        // 获取最新的草稿
        if (drafts.length > 0) {
            const latestDraft = drafts[0];
            elements.inputTextarea.value = latestDraft.content || '';
        }
    } catch (error) {
        console.error('加载草稿时发生错误:', error);
    }
}

// 当DOM加载完成后初始化应用
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // 如果DOM已经加载完成，直接初始化应用
    initApp();
}

// 添加知识库权重配置UI
function addKnowledgeWeightControl() {
    // 查找生成按钮的父容器
    const generateButton = document.getElementById('generate-btn');
    if (!generateButton) return;
    
    const container = generateButton.parentElement;
    
    // 创建权重控制元素
    const weightContainer = document.createElement('div');
    weightContainer.className = 'knowledge-weight-control';
    weightContainer.innerHTML = `
        <label for="knowledge-weight">知识库影响权重</label>
        <div class="weight-slider-container">
            <input type="range" id="knowledge-weight" min="0" max="1" step="0.1" value="0.5">
            <span id="weight-value-display">0.5</span>
        </div>
        <p class="weight-hint">调整知识库内容对生成结果的影响程度，0表示不使用知识库，1表示优先使用知识库内容</p>
    `;
    
    // 插入到生成按钮前面
    container.insertBefore(weightContainer, generateButton);
    
    // 添加事件监听器
    const weightSlider = document.getElementById('knowledge-weight');
    const weightDisplay = document.getElementById('weight-value-display');
    
    if (weightSlider && weightDisplay) {
        weightSlider.addEventListener('input', function() {
            weightDisplay.textContent = this.value;
        });
    }
}

// 添加历史记录筛选UI
function addRecordFilterUI() {
    // 查找最近记录的容器
    const recentRecordsSection = document.querySelector('.recent-records-section');
    if (!recentRecordsSection) return;
    
    // 查找标题元素
    const titleElement = recentRecordsSection.querySelector('h2, h3');
    if (!titleElement) return;
    
    // 创建筛选器容器
    const filterContainer = document.createElement('div');
    filterContainer.className = 'record-filter-container';
    filterContainer.innerHTML = `
        <label for="record-filter">筛选记录：</label>
        <select id="record-filter">
            <option value="all">全部记录</option>
            <option value="with">使用了知识库</option>
            <option value="without">未使用知识库</option>
        </select>
    `;
    
    // 插入到标题后面
    titleElement.parentNode.insertBefore(filterContainer, titleElement.nextSibling);
    
    // 添加事件监听器
    const filterSelect = document.getElementById('record-filter');
    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
            filterRecordsByKnowledge(this.value);
        });
    }
}

// 按知识库关联度筛选历史记录
function filterRecordsByKnowledge(filterType) {
    // 获取所有记录项
    const recordItems = document.querySelectorAll('.record-item');
    if (!recordItems.length) return;
    
    // 遍历并筛选记录项
    recordItems.forEach(item => {
        const recordId = item.getAttribute('data-id');
        if (!recordId) {
            item.style.display = filterType === 'all' ? '' : 'none';
            return;
        }
        
        try {
            // 获取记录详情
            const records = recentRecordsManager.get();
            const record = records.find(r => r.id === recordId);
            
            // 根据筛选类型决定显示或隐藏
            if (filterType === 'all') {
                item.style.display = '';
            } else if (filterType === 'with' && record && record.knowledgeUsed) {
                item.style.display = '';
            } else if (filterType === 'without' && (!record || !record.knowledgeUsed)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        } catch (error) {
            console.error('筛选记录时发生错误:', error);
            item.style.display = filterType === 'all' ? '' : 'none';
        }
    });
}

// 更新创建记录项函数以显示知识库使用标记
function createRecordItemWithKnowledgeFlag(record) {
    // 调用原始的createRecordItem函数
    const item = createRecordItem(record);
    
    // 如果记录使用了知识库，添加标记
    if (record.knowledgeUsed) {
        const recordMeta = item.querySelector('.record-meta');
        if (recordMeta) {
            const knowledgeBadge = document.createElement('span');
            knowledgeBadge.className = 'knowledge-used-badge';
            knowledgeBadge.textContent = '使用了知识库';
            recordMeta.appendChild(knowledgeBadge);
        }
    }
    
    // 添加data-id属性以便筛选
    item.setAttribute('data-id', record.id);
    
    return item;
}

// 重写loadRecentRecords函数以使用带知识库标记的记录项
const originalLoadRecentRecords = loadRecentRecords;
function loadRecentRecordsWithKnowledgeFilter() {
    // 先调用原始函数加载记录
    originalLoadRecentRecords();
    
    // 再应用当前的筛选条件
    const filterSelect = document.getElementById('record-filter');
    if (filterSelect) {
        filterRecordsByKnowledge(filterSelect.value);
    }
}

// 替换原有的loadRecentRecords函数
window.loadRecentRecords = loadRecentRecordsWithKnowledgeFilter;