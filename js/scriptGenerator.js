/**
 * 脚本生成模块
 * 负责处理脚本生成的核心逻辑
 */

import { showNotification } from './utils.js';
import { statsManager, recentRecordsManager } from './storage.js';

// AI模型列表
const AVAILABLE_MODELS = [
    { id: 'gpt-3.5', name: 'GPT-3.5 Turbo', description: '平衡性能和成本的通用模型', params: ['temperature', 'max_tokens'] },
    { id: 'gpt-4', name: 'GPT-4', description: '更强大的模型，提供更高质量的结果', params: ['temperature', 'max_tokens'] },
    { id: 'gpt-4o', name: 'GPT-4o', description: '最新多模态模型，支持文本和图像', params: ['temperature', 'max_tokens'] },
    { id: 'claude-2', name: 'Claude 2', description: '擅长处理长文本和复杂对话', params: ['temperature', 'max_tokens'] },
    { id: 'claude-3', name: 'Claude 3', description: '新一代Claude模型，更高的准确性', params: ['temperature', 'max_tokens'] },
    { id: 'gemini', name: 'Gemini Pro', description: 'Google的多模态AI模型', params: ['temperature', 'max_tokens'] },
    { id: 'qianwen', name: '通义千问', description: '阿里巴巴开发的大型语言模型', params: ['temperature', 'max_tokens'] },
    { id: 'wenxin', name: '文心一言', description: '百度开发的大型语言模型', params: ['temperature', 'max_tokens'] },
    { id: 'llama-2', name: 'Llama 2', description: '开源大型语言模型', params: ['temperature', 'max_tokens'] }
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
    const { model = 'gpt-3.5', style = 'professional', length = 5, language = 'zh', contextHistory = [], characterRole = '客服-用户', knowledgeBaseItems = [] } = options;
    
    try {
        // 显示加载状态
        showNotification('正在生成脚本，请稍候...', 'info');
        
        // 记录开始时间用于统计
        const startTime = Date.now();
        
        // 模拟API调用（在实际项目中替换为真实API调用）
        const script = await simulateApiCall(prompt, { model, style, length, language, contextHistory, characterRole, knowledgeBaseItems });
        
        // 计算生成时间
        const generationTime = (Date.now() - startTime) / 1000;
        
        // 更新统计数据
        statsManager.update(generationTime);
        
        // 添加到最近记录
        recentRecordsManager.add({
            title: prompt.length > 30 ? prompt.substring(0, 30) + '...' : prompt,
            content: script,
            model,
            style,
            characterRole,
            hasContext: contextHistory && contextHistory.length > 0
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
    const { model, style, length, language, contextHistory, characterRole } = options;
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
    
    // 根据参数生成模拟的对话脚本
    const stylePrefix = getStylePrefix(style);
    const modelPrefix = getModelPrefix(model);
    
    let script = `# ${modelPrefix}${stylePrefix}对话脚本\n\n`;
    script += `角色: ${characterRole}\n\n`;
    
    // 如果有上下文历史，先显示历史内容
    if (contextHistory && contextHistory.length > 0) {
        script += `## 历史对话\n\n`;
        contextHistory.forEach((historyItem, index) => {
            script += `**${historyItem.role}**: ${historyItem.content}\n\n`;
        });
        script += `## 新对话\n\n`;
    }
    
    // 生成对话轮次
    for (let i = 1; i <= length; i++) {
        const { userRole, aiRole } = getRoleNames(characterRole);
        
        script += `## 第${i}轮对话\n\n`;
        script += `**${userRole}**: ${generateUserMessage(prompt, i, length, style, contextHistory, characterRole)}\n\n`;
        script += `**${aiRole}**: ${generateAIMessage(prompt, i, length, style, contextHistory, characterRole, knowledgeBaseItems)}\n\n`;
    }
    
    script += `---\n\n生成于: ${new Date().toLocaleString()}\n`;
    script += `模型: ${AVAILABLE_MODELS.find(m => m.id === model)?.name || model}\n`;
    script += `风格: ${AVAILABLE_STYLES.find(s => s.id === style)?.name || style}`;
    
    return script;
}

// 根据角色类型获取角色名称
function getRoleNames(characterRole) {
    const roleMap = {
        '客服-用户': { userRole: '用户', aiRole: '客服' },
        '老师-学生': { userRole: '学生', aiRole: '老师' },
        '医生-患者': { userRole: '患者', aiRole: '医生' },
        '销售-客户': { userRole: '客户', aiRole: '销售' },
        '面试官-面试者': { userRole: '面试者', aiRole: '面试官' },
        '教练-学员': { userRole: '学员', aiRole: '教练' }
    };
    
    return roleMap[characterRole] || roleMap['客服-用户'];
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
function generateUserMessage(prompt, round, totalRounds, style, contextHistory = [], characterRole = '客服-用户') {
    // 根据角色选择适合的消息模板
    const roleTemplates = {
        '客服-用户': {
            opening: [
                `你好，我想咨询关于${prompt}的问题，能帮我吗？`,
                `请问你们的${prompt}服务是怎么收费的？`,
                `我对${prompt}有一些疑问，希望能得到解答。`,
                `我在使用${prompt}时遇到了问题，该如何解决？`
            ],
            middle: [
                `那如果我要办理${prompt}，需要准备什么材料？`,
                `你们的${prompt}服务有什么保障措施吗？`,
                `能详细介绍一下${prompt}的具体流程吗？`,
                `如果使用${prompt}后不满意，可以退款吗？`
            ],
            closing: [
                `非常感谢你的解答，我已经了解了${prompt}的相关信息。`,
                `按照你的建议，我会尝试使用${prompt}服务。`,
                `这些信息对我很有帮助，谢谢！`,
                `请问还有其他关于${prompt}的注意事项吗？`
            ]
        },
        '老师-学生': {
            opening: [
                `老师，我不太理解${prompt}这个知识点，能给我解释一下吗？`,
                `关于${prompt}，我有几个问题想请教您。`,
                `老师，请问${prompt}应该怎么应用到实际问题中？`,
                `您能帮我梳理一下${prompt}的核心概念吗？`
            ],
            middle: [
                `那${prompt}和之前学的${getRelatedConcept(prompt)}有什么联系吗？`,
                `如果遇到${prompt}相关的问题，应该从哪些方面思考？`,
                `您能举几个关于${prompt}的实际例子吗？`,
                `学习${prompt}有没有什么有效的方法或技巧？`
            ],
            closing: [
                `谢谢您的讲解，我对${prompt}有了更清晰的认识。`,
                `我会按照您说的方法继续学习${prompt}。`,
                `这些例子对理解${prompt}很有帮助，谢谢！`,
                `关于${prompt}，我还需要做哪些练习来巩固？`
            ]
        },
        '医生-患者': {
            opening: [
                `医生，我最近${prompt}不太舒服，请问是什么原因？`,
                `我想咨询一下${prompt}的治疗方法有哪些？`,
                `我体检时发现${prompt}指标有异常，需要进一步检查吗？`,
                `医生，我想了解${prompt}的预防措施。`
            ],
            middle: [
                `那治疗${prompt}需要长期服药吗？`,
                `这个病会有什么并发症吗？`,
                `在日常生活中，我需要注意哪些方面来缓解${prompt}？`,
                `有没有什么饮食建议可以帮助改善${prompt}？`
            ],
            closing: [
                `谢谢您的建议，我会按照您说的去做。`,
                `请问多久需要复诊一次来监测${prompt}的情况？`,
                `这些注意事项我记下了，谢谢医生！`,
                `如果${prompt}症状加重，我应该怎么办？`
            ]
        },
        '销售-客户': {
            opening: [
                `你好，我想了解一下你们的${prompt}产品。`,
                `请问${prompt}有哪些不同的型号或版本？`,
                `你们的${prompt}相比其他品牌有什么优势？`,
                `能给我介绍一下${prompt}的主要功能吗？`
            ],
            middle: [
                `那${prompt}的价格是多少？有什么优惠活动吗？`,
                `购买${prompt}后有保修服务吗？`,
                `如果使用一段时间后对${prompt}不满意，可以退换吗？`,
                `安装或使用${prompt}有什么技术要求吗？`
            ],
            closing: [
                `谢谢你的介绍，我考虑一下购买${prompt}。`,
                `这些信息很有帮助，我会和家人商量一下${prompt}的购买事宜。`,
                `请问什么时候有货？我想尽快购买${prompt}。`,
                `能留下联系方式吗？我决定购买${prompt}后联系你。`
            ]
        }
    };
    
    // 默认使用客服-用户的模板
    const templates = roleTemplates[characterRole] || roleTemplates['客服-用户'];
    
    // 如果有上下文历史，可以基于最后一条消息生成更连贯的问题
    if (contextHistory && contextHistory.length > 0 && round > 1) {
        const lastMessage = contextHistory[contextHistory.length - 1];
        if (lastMessage.role && lastMessage.role.includes('客服') || lastMessage.role.includes('AI') || lastMessage.role.includes('老师') || lastMessage.role.includes('医生') || lastMessage.role.includes('销售')) {
            // 根据上一条AI消息生成相关问题
            return generateFollowUpQuestion(prompt, lastMessage.content, templates.middle);
        }
    }
    
    // 根据对话轮次选择合适的消息类型
    if (round === 1) {
        return templates.opening[Math.floor(Math.random() * templates.opening.length)];
    } else if (round === totalRounds) {
        return templates.closing[Math.floor(Math.random() * templates.closing.length)];
    } else {
        return templates.middle[Math.floor(Math.random() * templates.middle.length)];
    }
}

// 生成AI消息 - 集成知识库内容
function generateAIMessage(prompt, round, totalRounds, style, contextHistory = [], characterRole = '客服-用户', knowledgeBaseItems = []) {
    // 根据角色和风格选择适合的响应模板
    const roleStyleResponses = {
        '客服-用户': {
            'professional': `非常理解您对${prompt}的关注。我们的${prompt}服务旨在为客户提供高效、专业的解决方案。根据您的需求，我建议您可以考虑以下几个方面：首先，明确您的具体需求；其次，了解我们的服务流程；最后，根据预算选择合适的方案。如有任何疑问，我很乐意为您提供更详细的信息。`,
            'friendly': `您好！很高兴为您解答关于${prompt}的问题。我们的${prompt}服务一直以来都受到客户的好评，主要是因为我们注重细节和用户体验。您可以告诉我您的具体需求，我会为您推荐最适合的解决方案。如果您有任何其他问题，随时都可以问我哦！`,
            'casual': `关于${prompt}啊，我觉得您的需求很合理。我们这里有几种不同的方案，您可以根据自己的情况选择。简单来说，${prompt}主要就是帮您解决特定问题的服务。您看您更倾向于哪种方式呢？`,
            'persuasive': `我强烈推荐您体验我们的${prompt}服务。很多像您这样的客户在使用后都反馈效果显著。通过${prompt}，您不仅能解决当前的问题，还能获得长期的价值。现在正是尝试的好时机，我们还有特别的优惠活动。`,
            'empathetic': `我完全理解您现在的感受，面对${prompt}这样的问题确实会让人感到困惑。别担心，我们的团队有丰富的经验，可以帮您顺利解决。让我们一步步来，先了解您的具体情况，然后为您提供量身定制的解决方案。`
        },
        '老师-学生': {
            'professional': `${prompt}是一个重要的知识点。从理论角度来看，它主要涉及到以下几个方面：概念定义、基本原理、应用场景以及与其他知识点的联系。为了更好地理解${prompt}，建议您结合实际案例进行学习，并通过练习来巩固所学知识。如有任何疑问，请随时提出。`,
            'friendly': `很高兴你对${prompt}感兴趣！这是一个非常有趣的知识点。简单来说，${prompt}就是关于某个特定领域的规律或方法。为了帮助你理解，我可以举几个生活中的例子：比如...通过这些例子，你是不是对${prompt}有了更直观的认识？`,
            'casual': `关于${prompt}啊，其实没你想的那么复杂。咱们换个角度看，它就是解决某类问题的一种思路。你看，日常生活中我们经常会用到类似的思维方式。这样解释，你是不是更容易理解了？有什么具体的问题，咱们可以一起讨论。`,
            'persuasive': `掌握${prompt}对你的学习和未来发展都非常重要。很多成功的案例都证明，深入理解${prompt}可以帮助你在相关领域取得更好的成绩。现在投入时间学习${prompt}，将来一定会有丰厚的回报。让我们一起努力，攻克这个知识点！`,
            'empathetic': `我完全理解你在学习${prompt}时遇到的困难，这是很正常的。刚开始接触新知识点时，大家都会有这样的感受。别着急，让我用更简单的方式为你解释。我们可以从最基础的概念入手，然后逐步深入到更复杂的内容。相信通过我们的共同努力，你一定能掌握${prompt}。`
        },
        '医生-患者': {
            'professional': `关于您的${prompt}问题，根据医学研究和临床经验，主要考虑以下几种可能性：首先，可能是由于...引起的；其次，需要排除...的因素；最后，建议您进行...检查以明确诊断。在治疗方面，目前主要有...几种方法，我会根据您的具体情况为您推荐最合适的方案。`,
            'friendly': `您好！关于您提到的${prompt}问题，我先为您做一个简单的解释。这种情况在临床上比较常见，不必过于担心。为了更准确地了解您的情况，我需要问您几个问题：您的症状持续了多久？有没有伴随其他不适？之前有没有接受过相关治疗？了解这些信息后，我才能为您提供更有针对性的建议。`,
            'casual': `关于您说的${prompt}问题，咱们先别急着下结论。这种情况有很多可能的原因，需要进一步了解情况。您可以跟我详细描述一下症状，比如什么时候开始的，有什么规律，有没有什么因素会加重或缓解症状。了解这些信息后，我才能更好地帮助您。`,
            'persuasive': `针对您的${prompt}问题，我建议您尽快接受正规治疗。早期干预对于改善预后非常重要。根据您的情况，我推荐的治疗方案是...，这个方案已经在很多患者身上取得了良好的效果。请相信科学，积极配合治疗，我相信您的情况会很快得到改善。`,
            'empathetic': `我非常理解您现在的担忧和不安，面对${prompt}这样的健康问题，任谁都会感到焦虑。请相信我，我们的医疗团队有丰富的经验，一定能帮助您度过这个难关。让我们一起制定一个详细的治疗计划，我会全程陪伴您，解答您的每一个疑问。请放心，您不是一个人在战斗。`
        },
        '销售-客户': {
            'professional': `感谢您对我们的${prompt}产品感兴趣。${prompt}是我们的明星产品，具有以下几个核心优势：首先，它采用了最新的技术，性能卓越；其次，设计人性化，使用便捷；最后，我们提供完善的售后服务体系，让您无后顾之忧。根据您的需求，我推荐您选择...型号，它最适合像您这样的用户。`,
            'friendly': `您好！看到您对${prompt}感兴趣，我真的很开心！这是我们团队精心打造的产品，很多用户使用后都赞不绝口。您能告诉我您主要用${prompt}来做什么吗？了解您的需求后，我可以为您推荐最适合的款式和配置。如果您有任何疑问，随时都可以问我哦！`,
            'casual': `嘿，您眼光真不错！${prompt}确实是一款很棒的产品。我自己也在用，感觉特别好用。它的主要特点就是...您看，这些功能是不是正好符合您的需求？如果您觉得合适，我可以帮您介绍一下具体的购买流程和售后服务。`,
            'persuasive': `我向您保证，选择${prompt}绝对是明智之举。这款产品不仅质量过硬，而且性价比极高。现在购买还有特别优惠，机不可失。很多像您这样的客户在犹豫之后购买，都反馈说后悔没有早点下手。相信我，${prompt}一定会超出您的期望！`,
            'empathetic': `我完全理解您在购买${prompt}时的顾虑，毕竟这是一笔不小的支出。请放心，我们的${prompt}产品质量有保证，而且我们提供完善的售后服务。如果您使用后有任何不满意，我们承诺...您看，这样是不是能让您更放心一些？`
        }
    };
    
    // 获取基础响应
    let baseResponse;
    if (roleStyleResponses[characterRole] && roleStyleResponses[characterRole][style]) {
        baseResponse = roleStyleResponses[characterRole][style];
    } else {
        // 默认使用客服-用户的专业风格
        baseResponse = roleStyleResponses['客服-用户']['professional'];
    }
    
    // 添加一些变化使对话更自然
    const variations = [
        `\n\n具体来说，${prompt}的关键在于理解其核心逻辑。`,
        `\n\n需要注意的是，不同场景下${prompt}的应用方式可能有所不同。`,
        `\n\n根据经验，成功应用${prompt}需要一定的知识储备和实践。`,
        `\n\n为了更好地理解${prompt}，建议您结合实际案例进行学习和应用。`
    ];

    // 如果有相关的知识库内容，将其融入回复中
    let knowledgeIntegration = '';
    if (knowledgeBaseItems && knowledgeBaseItems.length > 0) {
        // 选择最合适的知识库内容（简单实现：选择第一个相关的或者随机选择）
        const relevantKnowledge = knowledgeBaseItems[Math.floor(Math.random() * knowledgeBaseItems.length)];
        if (relevantKnowledge && relevantKnowledge.content) {
            // 提取知识摘要并集成到回复中
            const knowledgeSummary = extractKnowledgeSummary(relevantKnowledge.content);
            if (knowledgeSummary) {
                const integrationFormats = [
                    `\n\n根据我们的知识库信息，${knowledgeSummary}`,
                    `\n\n值得注意的是，${knowledgeSummary}`,
                    `\n\n另外，我们的资料显示${knowledgeSummary}`,
                    `\n\n补充一点，${knowledgeSummary}`
                ];
                knowledgeIntegration = integrationFormats[Math.floor(Math.random() * integrationFormats.length)];
            }
        }
    }
    
    // 如果有上下文历史，可以基于历史内容生成更连贯的回答
    let contextualResponse = baseResponse;
    if (contextHistory && contextHistory.length > 0) {
        const lastUserMessage = contextHistory.find(item => 
            item.role.includes('用户') || item.role.includes('学生') || 
            item.role.includes('患者') || item.role.includes('客户') || 
            item.role.includes('面试者') || item.role.includes('学员')
        );
        
        if (lastUserMessage) {
            contextualResponse = adaptResponseToContext(baseResponse, prompt, lastUserMessage.content);
        }
    }
    
    // 如果不是最后一轮，可以添加引导下一轮对话的内容
    if (round < totalRounds) {
        const followUps = [
            `\n\n您还想了解${prompt}的哪些方面呢？`,
            `\n\n关于${prompt}，您有什么具体的问题吗？`,
            `\n\n我可以为您提供更详细的信息，您想深入了解哪一部分？`,
            `\n\n如果您有任何疑问，请随时告诉我。`
        ];
        return contextualResponse + variations[Math.floor(Math.random() * variations.length)] + knowledgeIntegration + followUps[Math.floor(Math.random() * followUps.length)];
    }

    return contextualResponse + variations[Math.floor(Math.random() * variations.length)] + knowledgeIntegration;
}

// 辅助函数：生成相关概念
function getRelatedConcept(prompt) {
    const concepts = ['基础理论', '实践应用', '案例分析', '方法论', '前沿研究', '经典模型'];
    return concepts[Math.floor(Math.random() * concepts.length)];
}

// 辅助函数：基于上下文生成跟进问题
function generateFollowUpQuestion(prompt, lastMessage, middleTemplates) {
    // 简单的关键词匹配来生成相关问题
    if (lastMessage.includes('流程')) {
        return `那在${prompt}的流程中，有没有什么需要特别注意的环节？`;
    } else if (lastMessage.includes('费用') || lastMessage.includes('价格')) {
        return `关于${prompt}的费用，有什么优惠政策吗？`;
    } else if (lastMessage.includes('时间') || lastMessage.includes('周期')) {
        return `完成${prompt}大概需要多长时间？`;
    } else if (lastMessage.includes('效果') || lastMessage.includes('收益')) {
        return `使用${prompt}后，一般能达到什么样的效果？`;
    }
    
    // 如果没有匹配的关键词，随机返回一个中间模板
    return middleTemplates[Math.floor(Math.random() * middleTemplates.length)];
}

// 辅助函数：根据上下文调整响应
function adaptResponseToContext(baseResponse, prompt, userMessage) {
    // 简单的调整逻辑，实际应用中可以更复杂
    let adaptedResponse = baseResponse;

    if (userMessage.includes('价格') || userMessage.includes('费用')) {
        adaptedResponse = adaptedResponse.replace('我们的服务', `我们的服务价格合理，性价比高`);
    } else if (userMessage.includes('时间') || userMessage.includes('周期')) {
        adaptedResponse = adaptedResponse.replace('我们的服务', `我们的服务效率高，时间周期短`);
    } else if (userMessage.includes('质量') || userMessage.includes('效果')) {
        adaptedResponse = adaptedResponse.replace('我们的服务', `我们的服务质量有保障，效果显著`);
    }

    return adaptedResponse;
}

// 辅助函数：从知识库内容中提取摘要
function extractKnowledgeSummary(content) {
    // 简单的摘要提取逻辑，实际应用中可以使用更复杂的NLP技术
    // 截取前100个字符作为摘要，确保句子完整
    if (!content || typeof content !== 'string') {
        return '';
    }
    
    // 限制摘要长度为100-200个字符
    const maxLength = Math.min(200, content.length);
    let summary = content.substring(0, maxLength);
    
    // 如果不是完整句子，查找最近的句子结束符
    const lastPeriod = summary.lastIndexOf('.');
    const lastComma = summary.lastIndexOf('，');
    const lastPunctuation = Math.max(lastPeriod, lastComma);
    
    if (lastPunctuation > 0 && lastPunctuation < summary.length - 1) {
        summary = summary.substring(0, lastPunctuation + 1);
    }
    
    return summary;
}

// 工具函数导出
export { AVAILABLE_MODELS, AVAILABLE_STYLES, AVAILABLE_LENGTHS };