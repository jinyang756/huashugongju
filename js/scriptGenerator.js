/**
 * 脚本生成模块
 * 负责处理脚本生成的核心逻辑
 */

import { showNotification } from './utils.js';
import { statsManager, recentRecordsManager } from './storage.js';

// 模拟AI模型列表
const AVAILABLE_MODELS = [
    { id: 'gpt-3.5', name: 'GPT-3.5 Turbo', description: '平衡性能和成本的通用模型' },
    { id: 'gpt-4', name: 'GPT-4', description: '更强大的模型，提供更高质量的结果' },
    { id: 'claude-2', name: 'Claude 2', description: '擅长处理长文本和复杂对话' },
    { id: 'llama-2', name: 'Llama 2', description: '开源大型语言模型' }
];

// 可用的对话风格
const AVAILABLE_STYLES = [
    { id: 'professional', name: '专业', description: '正式、专业的对话风格' },
    { id: 'friendly', name: '友好', description: '亲切、友好的对话风格' },
    { id: 'casual', name: '随意', description: '轻松、随意的对话风格' },
    { id: 'persuasive', name: '说服', description: '有说服力的对话风格' },
    { id: 'empathetic', name: '同理心', description: '富有同理心的对话风格' }
];

// 可用的脚本长度
const AVAILABLE_LENGTHS = [
    { value: 3, label: '短 (约3轮)' },
    { value: 5, label: '中 (约5轮)' },
    { value: 8, label: '长 (约8轮)' },
    { value: 12, label: '超长 (约12轮)' }
];

// 生成对话脚本的核心函数
export async function generateScript(prompt, options = {}) {
    const { model = 'gpt-3.5', style = 'professional', length = 5, language = 'zh' } = options;
    
    try {
        // 显示加载状态
        showNotification('正在生成脚本，请稍候...', 'info');
        
        // 记录开始时间用于统计
        const startTime = Date.now();
        
        // 模拟API调用（在实际项目中替换为真实API调用）
        const script = await simulateApiCall(prompt, { model, style, length, language });
        
        // 计算生成时间
        const generationTime = (Date.now() - startTime) / 1000;
        
        // 更新统计数据
        statsManager.update(generationTime);
        
        // 添加到最近记录
        recentRecordsManager.add({
            title: prompt.length > 30 ? prompt.substring(0, 30) + '...' : prompt,
            content: script,
            model,
            style
        });
        
        showNotification('脚本生成成功！', 'success');
        
        return {
            success: true,
            content: script,
            generationTime,
            model,
            style,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('生成脚本失败:', error);
        showNotification('生成脚本失败，请稍后重试。', 'error');
        
        return {
            success: false,
            error: error.message || '未知错误'
        };
    }
}

// 模拟API调用（在实际项目中替换为真实API调用）
async function simulateApiCall(prompt, options) {
    const { model, style, length } = options;
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
    
    // 根据参数生成模拟的对话脚本
    const stylePrefix = getStylePrefix(style);
    const modelPrefix = getModelPrefix(model);
    
    let script = `# ${modelPrefix}${stylePrefix}对话脚本\n\n`;
    
    // 生成对话轮次
    for (let i = 1; i <= length; i++) {
        script += `## 第${i}轮对话\n\n`;
        script += `**用户**: ${generateUserMessage(prompt, i, length)}\n\n`;
        script += `**AI**: ${generateAIMessage(prompt, i, length, style)}\n\n`;
    }
    
    script += `---\n\n生成于: ${new Date().toLocaleString()}\n`;
    script += `模型: ${AVAILABLE_MODELS.find(m => m.id === model)?.name || model}\n`;
    script += `风格: ${AVAILABLE_STYLES.find(s => s.id === style)?.name || style}`;
    
    return script;
}

// 获取风格前缀
function getStylePrefix(style) {
    const prefixes = {
        'professional': '【专业】',
        'friendly': '【友好】',
        'casual': '【随意】',
        'persuasive': '【说服】',
        'empathetic': '【同理心】'
    };
    return prefixes[style] || '';
}

// 获取模型前缀
function getModelPrefix(model) {
    const prefixes = {
        'gpt-3.5': '[GPT-3.5] ',
        'gpt-4': '[GPT-4] ',
        'claude-2': '[Claude 2] ',
        'llama-2': '[Llama 2] '
    };
    return prefixes[model] || '';
}

// 生成用户消息
function generateUserMessage(prompt, round, totalRounds) {
    const openingMessages = [
        `你好，我想了解关于${prompt}的信息，能帮我吗？`,
        `请问你能提供一些关于${prompt}的建议吗？`,
        `我对${prompt}很感兴趣，想深入了解一下。`,
        `最近在研究${prompt}，有些问题想请教你。`
    ];
    
    const middleMessages = [
        `那关于${prompt}的具体应用场景有哪些呢？`,
        `在实施${prompt}时需要注意什么问题吗？`,
        `你能详细解释一下${prompt}的原理吗？`,
        `有没有成功的${prompt}案例可以分享？`
    ];
    
    const closingMessages = [
        `非常感谢你的解答，对${prompt}有了更清晰的认识。`,
        `这些信息对我很有帮助，还有什么补充的吗？`,
        `按照你的建议，我会进一步学习${prompt}相关知识。`,
        `你觉得学习${prompt}最好的方法是什么？`
    ];
    
    if (round === 1) {
        return openingMessages[Math.floor(Math.random() * openingMessages.length)];
    } else if (round === totalRounds) {
        return closingMessages[Math.floor(Math.random() * closingMessages.length)];
    } else {
        return middleMessages[Math.floor(Math.random() * middleMessages.length)];
    }
}

// 生成AI消息
function generateAIMessage(prompt, round, totalRounds, style) {
    const baseResponses = {
        'professional': `非常乐意帮助您了解${prompt}。根据最新的行业研究，${prompt}在多个领域展现出了显著的优势，包括提高效率、降低成本和优化用户体验。从专业角度来看，${prompt}的核心价值在于其创新的方法论和实践应用。建议您在实施过程中注重数据驱动的决策，并建立持续优化的机制。`,
        'friendly': `嗨！很高兴你对${prompt}感兴趣！我觉得${prompt}真的很赞，它能帮我们解决很多实际问题呢。比如说，我有个朋友就是用${prompt}提升了工作效率，效果特别好。如果你想试试的话，我可以给你一些简单的入门建议哦！`,
        'casual': `关于${prompt}啊，我觉得挺有意思的。现在很多人都在讨论这个，主要是因为它确实能带来一些改变。其实你不需要太复杂的准备，先从基础开始试试看，遇到问题再慢慢调整就行。反正我觉得多尝试总是好的。`,
        'persuasive': `我强烈推荐您深入了解${prompt}。无数成功案例已经证明，采用${prompt}可以显著提升业务表现。想象一下，如果您能有效应用${prompt}，不仅能解决当前面临的挑战，还能为未来的发展奠定坚实基础。现在正是开始的最佳时机。`,
        'empathetic': `我完全理解您想要了解${prompt}的心情，这确实是一个值得关注的领域。很多人在刚开始接触${prompt}时都会有些困惑，这是很正常的。让我用简单易懂的方式为您解释，希望能帮助您理清思路，找到适合自己的学习方法。`
    };
    
    const response = baseResponses[style] || baseResponses['professional'];
    
    // 添加一些变化使对话更自然
    const variations = [
        `\n\n具体来说，${prompt}的关键在于理解其底层逻辑。`,
        `\n\n需要注意的是，不同场景下${prompt}的应用方式可能有所不同。`,
        `\n\n根据我的经验，成功应用${prompt}需要一定的耐心和实践。`,
        `\n\n为了更好地理解${prompt}，建议您结合实际案例进行学习。`
    ];
    
    // 如果不是最后一轮，可以添加引导下一轮对话的内容
    if (round < totalRounds) {
        const followUps = [
            `\n\n您还想了解${prompt}的哪些方面呢？`,
            `\n\n关于${prompt}，您有什么具体的问题吗？`,
            `\n\n我可以为您提供更详细的信息，您想深入了解哪一部分？`,
            `\n\n如果您有任何疑问，请随时告诉我。`
        ];
        return response + variations[Math.floor(Math.random() * variations.length)] + followUps[Math.floor(Math.random() * followUps.length)];
    }
    
    return response + variations[Math.floor(Math.random() * variations.length)];
}

// 工具函数导出
export { AVAILABLE_MODELS, AVAILABLE_STYLES, AVAILABLE_LENGTHS };