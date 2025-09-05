/**
 * 主入口模块
 * 整合所有功能模块，处理DOM交互和页面初始化
 */

import { getElement, getElements, showNotification, copyTextToClipboard, formatDateTime, debounce } from './utils.js';
import { recentRecordsManager, statsManager, settingsManager, draftsManager } from './storage.js';
import { generateScript, AVAILABLE_MODELS, AVAILABLE_STYLES, AVAILABLE_LENGTHS } from './scriptGenerator.js';

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
    selectedLength: null,
    clearRecordsButton: null,
    clearDraftsButton: null
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
        
        // 加载最近记录
        loadRecentRecords();
        
        // 更新统计信息
        updateStats();
        
        // 初始化加载动画
        initLoadAnimation();
        
        // 加载自动保存的草稿
        loadDraft();
        
        console.log('应用初始化成功');
        showNotification('AI对话脚本生成器已就绪', 'info');
    } catch (error) {
        console.error('应用初始化失败:', error);
        showNotification('应用初始化失败，请刷新页面重试。', 'error');
    }
}

// 缓存DOM元素
function cacheDOMElements() {
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
    elements.selectedLength = getElement('#length-select');
    elements.clearRecordsButton = getElement('#clear-records-btn');
    elements.clearDraftsButton = getElement('#clear-drafts-btn');
}

// 注册事件监听器
function registerEventListeners() {
    if (elements.generateButton) {
        elements.generateButton.addEventListener('click', handleGenerateClick);
    }
    
    if (elements.copyButton) {
        elements.copyButton.addEventListener('click', handleCopyClick);
    }
    
    if (elements.editButton) {
        elements.editButton.addEventListener('click', handleEditClick);
    }
    
    if (elements.clearRecordsButton) {
        elements.clearRecordsButton.addEventListener('click', handleClearRecords);
    }
    
    if (elements.clearDraftsButton) {
        elements.clearDraftsButton.addEventListener('click', handleClearDrafts);
    }
    
    // 监听输入框变化，实现自动保存草稿
    if (elements.inputTextarea) {
        elements.inputTextarea.addEventListener('input', debounce(saveDraft, 1000));
    }
    
    // 监听设置变更
    if (elements.selectedModel) {
        elements.selectedModel.addEventListener('change', handleSettingsChange);
    }
    
    if (elements.selectedStyle) {
        elements.selectedStyle.addEventListener('change', handleSettingsChange);
    }
    
    if (elements.selectedLength) {
        elements.selectedLength.addEventListener('change', handleSettingsChange);
    }
    
    // 监听键盘事件
    document.addEventListener('keydown', handleKeydown);
}

// 初始化设置
function initSettings() {
    const settings = settingsManager.get();
    
    // 填充下拉选择框
    populateSelectOptions(elements.selectedModel, AVAILABLE_MODELS, settings.selectedModel);
    populateSelectOptions(elements.selectedStyle, AVAILABLE_STYLES, settings.selectedStyle);
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
        selectedLength: parseInt(elements.selectedLength.value)
    };
    
    settingsManager.save(settings);
    showNotification('设置已保存', 'success');
}

// 处理生成按钮点击
async function handleGenerateClick() {
    if (!elements.inputTextarea || !elements.outputTextarea || !elements.generateButton) return;
    
    const prompt = elements.inputTextarea.value.trim();
    
    if (!prompt) {
        showNotification('请输入提示内容', 'error');
        return;
    }
    
    // 禁用按钮，显示加载状态
    elements.generateButton.disabled = true;
    elements.generateButton.classList.add('loading');
    
    try {
        // 获取当前设置
        const settings = settingsManager.get();
        
        // 记录开始时间
        const startTime = Date.now();
        
        // 生成脚本
        const result = await generateScript(prompt, settings);
        
        // 计算生成时间
        const generationTime = (Date.now() - startTime) / 1000;
        
        if (result.success) {
            // 显示生成结果
            elements.outputTextarea.value = result.content;
            
            // 更新统计信息，包括本次生成时间
            updateStats({ generationTime });
            
            // 重新加载最近记录
            loadRecentRecords();
            
            // 清空自动保存的草稿
            draftsManager.clear();
            
            // 显示成功通知
            showNotification('脚本生成成功！', 'success');
        } else {
            // 显示错误信息
            showNotification(result.message || '生成失败，请稍后重试。', 'error');
        }
    } catch (error) {
        console.error('生成过程中发生错误:', error);
        showNotification('生成失败，请稍后重试。', 'error');
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
        showNotification('没有内容可复制', 'error');
        return;
    }
    
    try {
        const success = await copyTextToClipboard(textToCopy);
        
        if (success) {
            showNotification('已复制到剪贴板', 'success');
        } else {
            showNotification('复制失败，请手动复制', 'error');
        }
    } catch (error) {
        console.error('复制失败:', error);
        showNotification('复制失败，请手动复制', 'error');
    }
}

// 处理编辑按钮点击
function handleEditClick() {
    if (!elements.inputTextarea || !elements.outputTextarea) return;
    
    const outputText = elements.outputTextarea.value.trim();
    
    if (!outputText) {
        showNotification('没有内容可编辑', 'error');
        return;
    }
    
    // 将输出内容复制到输入框进行编辑
    elements.inputTextarea.value = outputText;
    
    // 清空输出框
    elements.outputTextarea.value = '';
    
    // 滚动到输入框
    elements.inputTextarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
    elements.inputTextarea.focus();
    
    showNotification('已准备好编辑内容', 'info');
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
        const recordItem = createRecordItem(record);
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
    
    // 构建记录HTML
    item.innerHTML = `
        <div class="record-header">
            <h4 class="record-title">${escapeHtml(record.title)}</h4>
            <span class="record-date">${formattedDate}</span>
        </div>
        <div class="record-meta">
            <span class="record-model">${escapeHtml(record.model)}</span>
            <span class="record-style">${escapeHtml(record.style)}</span>
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
            
            showNotification('记录已加载', 'success');
        } else {
            showNotification('记录加载失败', 'error');
        }
    } catch (error) {
        console.error('加载记录时发生错误:', error);
        showNotification('记录加载失败', 'error');
    }
}

// 删除记录
function deleteRecord(recordId) {
    if (confirm('确定要删除这条记录吗？')) {
        const success = recentRecordsManager.remove(recordId);
        
        if (success) {
            loadRecentRecords();
            showNotification('记录已删除', 'success');
        } else {
            showNotification('记录删除失败', 'error');
        }
    }
}

// 清空所有记录
function handleClearRecords() {
    if (confirm('确定要清空所有最近记录吗？此操作不可恢复。')) {
        const success = recentRecordsManager.clear();
        
        if (success) {
            loadRecentRecords();
            showNotification('所有记录已清空', 'success');
        } else {
            showNotification('清空记录失败', 'error');
        }
    }
}

// 清空所有草稿
function handleClearDrafts() {
    if (confirm('确定要清空所有草稿吗？此操作不可恢复。')) {
        try {
            draftsManager.clear();
            showNotification('所有草稿已清空', 'success');
        } catch (error) {
            console.error('清空草稿时发生错误:', error);
            showNotification('清空草稿失败', 'error');
        }
    }
}

// 更新统计信息
function updateStats(options = {}) {
    if (!elements.statValues || elements.statValues.length === 0) return;
    
    try {
        let stats = statsManager.get();
        
        // 如果提供了新的生成时间，更新统计
        if (options.generationTime !== undefined) {
            stats = statsManager.updateWithNewGeneration(options.generationTime);
        }
        
        // 确保有足够的元素
        if (elements.statValues.length >= 4) {
            elements.statValues[0].textContent = stats.totalScripts || 0;
            elements.statValues[1].textContent = (stats.averageTime || 0).toFixed(1) + 's';
            elements.statValues[2].textContent = (stats.successRate || 0).toFixed(1) + '%';
            
            // 获取实际草稿数量
            const drafts = draftsManager.get();
            elements.statValues[3].textContent = drafts.length || 0;
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
                showNotification('记录内容已复制到剪贴板', 'success');
            } else {
                showNotification('复制失败，请手动复制', 'error');
            }
        } else {
            showNotification('未找到记录', 'error');
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