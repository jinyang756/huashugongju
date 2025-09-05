/*
 * 知识库管理模块
 * 负责知识库的上传、检索和管理功能
 */

import { getElement, getElements, showNotification, readFileContent, parseCSV, extractTextSummary, validateFileSize, SUPPORTED_FILE_TYPES } from './utils.js';
import { knowledgeBaseManager } from './storage.js';

// DOM元素缓存
const elements = {
    knowledgeBaseContainer: null,
    fileUploadButton: null,
    fileInput: null,
    knowledgeSearchInput: null,
    knowledgeItemsContainer: null,
    addTextKnowledgeButton: null,
    textKnowledgeModal: null,
    textKnowledgeForm: null
};

// 初始化知识库功能
export async function initKnowledgeBase() {
    try {
        // 获取DOM元素
        cacheDOMElements();
        
        // 注册事件监听器
        registerEventListeners();
        
        // 加载知识库项目
        loadKnowledgeItems();
        
        console.log('知识库功能初始化成功');
    } catch (error) {
        console.error('知识库功能初始化失败:', error);
        showNotification('知识库功能初始化失败，请刷新页面重试。', 'error');
    }
}

// 缓存DOM元素
function cacheDOMElements() {
    elements.knowledgeBaseContainer = getElement('.knowledge-base-container');
    elements.fileUploadButton = getElement('#file-upload-btn');
    elements.fileInput = getElement('#file-input');
    elements.knowledgeSearchInput = getElement('#knowledge-search-input');
    elements.knowledgeItemsContainer = getElement('.knowledge-items-container');
    elements.addTextKnowledgeButton = getElement('#add-text-knowledge-btn');
    elements.textKnowledgeModal = getElement('#text-knowledge-modal');
    elements.textKnowledgeForm = getElement('#text-knowledge-form');
}

// 注册事件监听器
function registerEventListeners() {
    // 文件上传相关事件
    if (elements.fileUploadButton && elements.fileInput) {
        elements.fileUploadButton.addEventListener('click', () => {
            elements.fileInput.click();
        });
        
        elements.fileInput.addEventListener('change', handleFileUpload);
    }
    
    // 搜索事件
    if (elements.knowledgeSearchInput) {
        elements.knowledgeSearchInput.addEventListener('input', handleKnowledgeSearch);
    }
    
    // 添加文本知识事件
    if (elements.addTextKnowledgeButton) {
        elements.addTextKnowledgeButton.addEventListener('click', openTextKnowledgeModal);
    }
    
    // 文本知识表单提交
    if (elements.textKnowledgeForm) {
        elements.textKnowledgeForm.addEventListener('submit', handleTextKnowledgeSubmit);
    }
}

// 处理文件上传
async function handleFileUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    try {
        // 显示加载状态
        showNotification('正在处理文件，请稍候...', 'info');
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // 验证文件大小
            if (!validateFileSize(file)) {
                showNotification(`文件 ${file.name} 超过大小限制(10MB)`, 'error');
                continue;
            }
            
            // 读取文件内容
            const content = await readFileContent(file);
            
            // 根据文件类型处理内容
            let processedContent = '';
            let itemType = 'text';
            
            if (file.name.endsWith('.csv')) {
                const csvData = parseCSV(content);
                processedContent = JSON.stringify(csvData, null, 2);
                itemType = 'spreadsheet';
            } else if (file.name.endsWith('.json')) {
                // 验证JSON格式
                try {
                    JSON.parse(content);
                    processedContent = content;
                    itemType = 'text';
                } catch (e) {
                    showNotification(`文件 ${file.name} 不是有效的JSON格式`, 'error');
                    continue;
                }
            } else if (file.name.endsWith('.txt')) {
                processedContent = content;
                itemType = 'text';
            } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                // Excel文件处理（简化版）
                processedContent = 'Excel文件内容（需要专门的库解析）';
                itemType = 'spreadsheet';
            }
            
            // 添加到知识库
            const success = knowledgeBaseManager.add({
                title: file.name,
                content: processedContent,
                type: itemType,
                source: 'upload',
                tags: extractTagsFromFileName(file.name)
            });
            
            if (success) {
                showNotification(`文件 ${file.name} 上传成功！`, 'success');
            } else {
                showNotification(`文件 ${file.name} 上传失败`, 'error');
            }
        }
        
        // 重新加载知识库项目
        loadKnowledgeItems();
        
        // 清空文件输入
        elements.fileInput.value = '';
        
    } catch (error) {
        console.error('文件上传处理失败:', error);
        showNotification('文件处理失败: ' + error.message, 'error');
    }
}

// 从文件名提取标签
function extractTagsFromFileName(fileName) {
    const tags = [];
    const extension = fileName.split('.').pop().toLowerCase();
    tags.push(extension);
    
    // 可以根据需要添加更多的标签提取逻辑
    return tags;
}

// 处理知识库搜索
function handleKnowledgeSearch(event) {
    const query = event.target.value.trim();
    const searchResults = knowledgeBaseManager.search(query);
    renderKnowledgeItems(searchResults);
}

// 加载知识库项目
function loadKnowledgeItems() {
    const items = knowledgeBaseManager.get();
    renderKnowledgeItems(items);
}

// 渲染知识库项目
function renderKnowledgeItems(items) {
    if (!elements.knowledgeItemsContainer) return;
    
    // 清空容器
    elements.knowledgeItemsContainer.innerHTML = '';
    
    if (items.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <div class="empty-icon">📚</div>
            <h3>知识库为空</h3>
            <p>上传文档或添加文本知识来开始构建您的知识库</p>
        `;
        elements.knowledgeItemsContainer.appendChild(emptyState);
        return;
    }
    
    // 创建项目列表
    items.forEach(item => {
        const itemElement = createKnowledgeItemElement(item);
        elements.knowledgeItemsContainer.appendChild(itemElement);
    });
}

// 创建知识库项目元素
function createKnowledgeItemElement(item) {
    const itemElement = document.createElement('div');
    itemElement.className = 'knowledge-item';
    itemElement.setAttribute('data-id', item.id);
    
    // 根据项目类型设置图标
    let typeIcon = '📄'; // 默认文本文件图标
    if (item.type === 'spreadsheet') {
        typeIcon = '📊'; // 表格文件图标
    }
    
    // 创建标签HTML
    const tagsHTML = item.tags && item.tags.length > 0 
        ? item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')
        : '';
    
    itemElement.innerHTML = `
        <div class="knowledge-item-header">
            <div class="knowledge-item-icon">${typeIcon}</div>
            <div class="knowledge-item-info">
                <h4 class="knowledge-item-title">${item.title}</h4>
                <div class="knowledge-item-meta">
                    <span class="knowledge-item-type">${getItemTypeDisplayName(item.type)}</span>
                    <span class="knowledge-item-date">${formatDate(item.timestamp)}</span>
                </div>
            </div>
            <div class="knowledge-item-actions">
                <button class="btn btn-sm btn-secondary view-knowledge-btn">查看</button>
                <button class="btn btn-sm btn-secondary edit-knowledge-btn">编辑</button>
                <button class="btn btn-sm btn-danger delete-knowledge-btn">删除</button>
            </div>
        </div>
        <div class="knowledge-item-content">
            <p>${extractTextSummary(item.content, 150)}</p>
        </div>
        <div class="knowledge-item-tags">
            ${tagsHTML}
        </div>
    `;
    
    // 添加事件监听器
    const viewButton = itemElement.querySelector('.view-knowledge-btn');
    const editButton = itemElement.querySelector('.edit-knowledge-btn');
    const deleteButton = itemElement.querySelector('.delete-knowledge-btn');
    
    if (viewButton) {
        viewButton.addEventListener('click', () => viewKnowledgeItem(item));
    }
    
    if (editButton) {
        editButton.addEventListener('click', () => editKnowledgeItem(item));
    }
    
    if (deleteButton) {
        deleteButton.addEventListener('click', () => deleteKnowledgeItem(item.id));
    }
    
    return itemElement;
}

// 获取项目类型显示名称
function getItemTypeDisplayName(type) {
    const typeMap = {
        'text': '文本',
        'spreadsheet': '表格',
        'document': '文档'
    };
    return typeMap[type] || type;
}

// 格式化日期
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 查看知识库项目
function viewKnowledgeItem(item) {
    // 这里可以实现查看详情的逻辑，比如打开模态框显示完整内容
    showNotification(`查看: ${item.title}`, 'info');
    // 实际项目中可以实现更复杂的查看功能
}

// 编辑知识库项目
function editKnowledgeItem(item) {
    // 这里可以实现编辑的逻辑，比如打开编辑表单
    showNotification(`编辑: ${item.title}`, 'info');
    // 实际项目中可以实现更复杂的编辑功能
}

// 删除知识库项目
function deleteKnowledgeItem(id) {
    if (confirm('确定要删除这个知识库项目吗？')) {
        const success = knowledgeBaseManager.remove(id);
        if (success) {
            showNotification('项目已删除', 'success');
            loadKnowledgeItems(); // 重新加载列表
        } else {
            showNotification('删除失败', 'error');
        }
    }
}

// 打开文本知识添加模态框
function openTextKnowledgeModal() {
    if (elements.textKnowledgeModal) {
        elements.textKnowledgeModal.style.display = 'block';
    }
}

// 关闭文本知识添加模态框
function closeTextKnowledgeModal() {
    if (elements.textKnowledgeModal) {
        elements.textKnowledgeModal.style.display = 'none';
        if (elements.textKnowledgeForm) {
            elements.textKnowledgeForm.reset();
        }
    }
}

// 处理文本知识表单提交
function handleTextKnowledgeSubmit(event) {
    event.preventDefault();
    
    if (!elements.textKnowledgeForm) return;
    
    const title = elements.textKnowledgeForm.querySelector('#knowledge-title').value.trim();
    const content = elements.textKnowledgeForm.querySelector('#knowledge-content').value.trim();
    const tagsInput = elements.textKnowledgeForm.querySelector('#knowledge-tags').value.trim();
    
    if (!title || !content) {
        showNotification('标题和内容不能为空', 'error');
        return;
    }
    
    // 处理标签
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()) : [];
    
    // 添加到知识库
    const success = knowledgeBaseManager.add({
        title,
        content,
        type: 'text',
        source: 'manual',
        tags
    });
    
    if (success) {
        showNotification('文本知识添加成功', 'success');
        closeTextKnowledgeModal();
        loadKnowledgeItems(); // 重新加载列表
    } else {
        showNotification('添加失败', 'error');
    }
}

// 从知识库检索相关内容（用于AI生成时提供上下文）
export function retrieveKnowledge(query, maxItems = 3) {
    const searchResults = knowledgeBaseManager.search(query);
    // 返回前几个相关的知识库项目
    return searchResults.slice(0, maxItems).map(item => ({
        id: item.id,
        title: item.title,
        content: item.content,
        relevance: calculateRelevance(query, item.content)
    }));
}

// 计算相关性（简单实现）
function calculateRelevance(query, content) {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const contentLower = content.toLowerCase();
    
    let matches = 0;
    queryTerms.forEach(term => {
        if (contentLower.includes(term)) {
            matches++;
        }
    });
    
    return queryTerms.length > 0 ? (matches / queryTerms.length) * 100 : 0;
}

// 导出知识库功能接口
export default {
    initKnowledgeBase,
    retrieveKnowledge
};