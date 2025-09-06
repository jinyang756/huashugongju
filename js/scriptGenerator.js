/**
 * 脚本生成模块
 * 负责处理脚本生成的核心逻辑
 */

// 将脚本生成器挂载到全局对象
const scriptGenerator = window.scriptGenerator = window.scriptGenerator || {};


// 可用的AI模型 - 证券投资专用
scriptGenerator.AVAILABLE_MODELS = [
    { name: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', available: true },
    { name: 'gpt-4', label: 'GPT-4', available: true },
    { name: 'gpt-4o', label: 'GPT-4o', available: true },
    { name: 'claude-3-opus', label: 'Claude 3 Opus', available: true },
    { name: 'claude-3-sonnet', label: 'Claude 3 Sonnet', available: true },
    { name: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', available: false },
    { name: 'glm-4', label: 'GLM-4', available: true }
];

// 可用的对话风格 - 证券投资专用
scriptGenerator.AVAILABLE_STYLES = [
    { name: 'professional', label: '专业分析' },
    { name: 'friendly', label: '热情分享' },
    { name: 'casual', label: '轻松交流' },
    { name: 'persuasive', label: '深度推荐' },
    { name: 'empathetic', label: '共鸣理解' },
    { name: 'technical', label: '技术派交流' },
    { name: 'fundamental', label: '基本面分析' },
    { name: 'risk-warning', label: '风险提示' },
    { name: 'strategy-sharing', label: '策略分享' },
    { name: 'experience-telling', label: '经验分享' }
];

// 可用的对话长度
scriptGenerator.AVAILABLE_LENGTHS = [
    { value: 1, label: '短 (1-2轮)' },
    { value: 3, label: '中 (3-4轮)' },
    { value: 5, label: '长 (5-7轮)' },
    { value: 7, label: '超长 (8-10轮)' },
    { value: 10, label: '深度对话 (10-15轮)' }
];

// 可用的证券投资交流角色 - 包含各种小号定位
scriptGenerator.AVAILABLE_ROLES = [
    { value: '分析师-投资者', label: '分析师-投资者' },
    { value: '资深股民-新手', label: '资深股民-新手' },
    { value: '股票推荐者-跟随者', label: '股票推荐者-跟随者' },
    { value: '市场评论员-听众', label: '市场评论员-听众' },
    { value: '基金经理-客户', label: '基金经理-客户' },
    { value: '投资顾问-咨询者', label: '投资顾问-咨询者' },
    { value: '技术高手-学习者', label: '技术高手-学习者' },
    { value: '价值投资者-讨论者', label: '价值投资者-讨论者' },
    { value: '短线交易者-交流者', label: '短线交易者-交流者' },
    { value: '行业专家-关注者', label: '行业专家-关注者' },
    { value: '量化分析员-实践者', label: '量化分析员-实践者' },
    { value: '财经媒体人-读者', label: '财经媒体人-读者' }
];

// 生成对话脚本的核心函数
scriptGenerator.generateScript = async function(prompt, options = {}) {
    const { model = 'gpt-3.5', style = 'professional', length = 5, language = 'zh', contextHistory = [], characterRole = '客服-用户', knowledgeBaseItems = [] } = options;
    
    try {
        // 显示加载状态
        utils.showNotification('正在生成脚本，请稍候...', 'info');
        
        // 记录开始时间用于统计
        const startTime = Date.now();
        
        // 模拟API调用（在实际项目中替换为真实API调用）
        const script = await simulateApiCall(prompt, { model, style, length, language, contextHistory, characterRole, knowledgeBaseItems });
        
        // 计算生成时间
        const generationTime = (Date.now() - startTime) / 1000;
        
        // 更新统计数据
        storage.statsManager.update(generationTime);
        
        // 添加到最近记录
        storage.recentRecordsManager.add({
            title: prompt.length > 30 ? prompt.substring(0, 30) + '...' : prompt,
            content: script.script,
            model,
            style,
            characterRole,
            hasContext: contextHistory && contextHistory.length > 0
        });
        
        utils.showNotification('脚本生成成功！', 'success');
        
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
        utils.showNotification('生成脚本失败，请稍后重试。', 'error');
        
        return {
            success: false,
            error: error.message || '未知错误'
        };
    }
}

// 模拟API调用（在实际项目中替换为真实API调用）
scriptGenerator.simulateApiCall = async function(prompt, options) {
    const { model, style, length, language, contextHistory, characterRole, knowledgeBaseItems = [], knowledgeWeight = 0.5 } = options;
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
    
    // 根据参数生成模拟的对话脚本
    const stylePrefix = scriptGenerator.getStylePrefix(style);
    const modelPrefix = scriptGenerator.getModelPrefix(model);
    
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
        const { userRole, aiRole } = scriptGenerator.getRoleNames(characterRole);
        
        script += `## 第${i}轮对话\n\n`;
        script += `**${userRole}**: ${scriptGenerator.generateUserMessage(prompt, i, length, style, contextHistory, characterRole)}\n\n`;
        script += `**${aiRole}**: ${scriptGenerator.generateAIMessage(prompt, i, length, style, contextHistory, characterRole, knowledgeBaseItems, knowledgeWeight)}\n\n`;
    }
    
    script += `---\n\n生成于: ${new Date().toLocaleString()}\n`;
    script += `模型: ${scriptGenerator.AVAILABLE_MODELS.find(m => m.id === model)?.name || model}\n`;
    script += `风格: ${scriptGenerator.AVAILABLE_STYLES.find(s => s.id === style)?.name || style}`;
    
    // 返回生成结果和是否使用了知识库内容的标志
    let usedKnowledgeBase = false;
    if (knowledgeBaseItems && knowledgeBaseItems.length > 0 && Math.random() < knowledgeWeight) {
        usedKnowledgeBase = true;
    }
    
    return {
        script: script,
        usedKnowledgeBase: usedKnowledgeBase
    };
}

// 根据角色类型获取角色名称 - 证券投资专用
scriptGenerator.getRoleNames = function(characterRole) {
    const roleMap = {
        '客服-用户': { userRole: '用户', aiRole: '客服' },
        '老师-学生': { userRole: '学生', aiRole: '老师' },
        '医生-患者': { userRole: '患者', aiRole: '医生' },
        '销售-客户': { userRole: '客户', aiRole: '销售' },
        '面试官-面试者': { userRole: '面试者', aiRole: '面试官' },
        '教练-学员': { userRole: '学员', aiRole: '教练' },
        // 证券投资交流群专用角色
        '分析师-投资者': { userRole: '投资者', aiRole: '分析师' },
        '资深股民-新手': { userRole: '新手', aiRole: '资深股民' },
        '股票推荐者-跟随者': { userRole: '跟随者', aiRole: '股票推荐者' },
        '市场评论员-听众': { userRole: '听众', aiRole: '市场评论员' }
    };
    
    return roleMap[characterRole] || roleMap['客服-用户'];
}

// 获取风格前缀
scriptGenerator.getStylePrefix = function(style) {
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
scriptGenerator.getModelPrefix = function(model) {
    const prefixes = {
        'gpt-3.5': '[GPT-3.5] ',
        'gpt-4': '[GPT-4] ',
        'claude-2': '[Claude 2] ',
        'llama-2': '[Llama 2] '
    };
    return prefixes[model] || '';
}

// 生成用户消息 - 证券投资交流群专用
scriptGenerator.generateUserMessage = function(prompt, round, totalRounds, style, contextHistory = [], characterRole = '客服-用户') {
    // 根据角色选择适合的消息模板
    const roleTemplates = {
        // 证券投资交流群专用模板
        '分析师-投资者': {
            opening: [
                `您好，我想请教一下关于${prompt}这只股票的看法，最近走势好像不错。`,
                `分析师您好，能帮我分析一下${prompt}的基本面和技术面吗？`,
                `请问${prompt}最近有什么利好消息吗？值得入手吗？`,
                `我关注${prompt}很久了，想听听您专业的分析意见。`
            ],
            middle: [
                `那${prompt}的估值目前处于什么水平？是高估还是低估？`,
                `您觉得持有${prompt}的风险主要在哪里？`,
                `如果我现在买入${prompt}，大概能持有多久？目标价是多少？`,
                `${prompt}和同行业的${scriptGenerator.getRelatedConcept(prompt)}相比，优势在哪里？`
            ],
            closing: [
                `谢谢您的专业分析，我对${prompt}有了更清晰的认识。`,
                `按照您的建议，我会考虑分批建仓${prompt}。`,
                `这些信息对我的投资决策很有帮助，谢谢！`,
                `请问关于${prompt}，还有其他需要注意的风险点吗？`
            ]
        },
        '资深股民-新手': {
            opening: [
                `前辈好，我是刚入市的新手，想请教一下${prompt}这只股票怎么样？`,
                `大佬，能给我讲讲${prompt}的投资逻辑吗？我不太懂。`,
                `请问${prompt}适合长期持有还是短线操作？`,
                `我看${prompt}最近涨得不错，现在追进去会不会太高了？`
            ],
            middle: [
                `那买${prompt}的话，大概什么时候适合卖出？有什么止盈止损策略吗？`,
                `您之前买过${prompt}吗？能分享一下您的操作经验吗？`,
                `如果${prompt}回调的话，大概会跌到什么位置？`,
                `新手买${prompt}需要注意什么风险吗？`
            ],
            closing: [
                `太感谢您的指导了，我这就去研究一下${prompt}。`,
                `按照您说的方法，我会先小仓位尝试买入${prompt}。`,
                `听您这么一讲，我对${prompt}的投资思路更清晰了，谢谢！`,
                `下次有投资问题，还能向您请教吗？`
            ]
        },
        '股票推荐者-跟随者': {
            opening: [
                `老师，您之前推荐的${prompt}表现很好，能再推荐几只类似的股票吗？`,
                `请问最近有什么像${prompt}这样有潜力的股票可以关注？`,
                `您觉得${prompt}接下来还会继续涨吗？需要减仓吗？`,
                `我按照您的建议买了${prompt}，现在赚了不少，接下来该怎么操作？`
            ],
            middle: [
                `那除了${prompt}，您还看好哪个板块？有具体的标的推荐吗？`,
                `您推荐的${prompt}已经涨了不少，现在还能跟进吗？`,
                `如果我想建仓${prompt}，大概分几次买入比较合适？`,
                `您觉得${prompt}的上涨逻辑是什么？能持续多久？`
            ],
            closing: [
                `太感谢您的推荐了，我会密切关注${prompt}的走势。`,
                `按照您的策略，我会继续持有${prompt}并观察市场变化。`,
                `您的分析很到位，我对${prompt}的信心更足了，谢谢！`,
                `期待您下次的股票推荐。`
            ]
        },
        '市场评论员-听众': {
            opening: [
                `老师，您对当前${prompt}市场的看法是什么？未来走势会如何？`,
                `请问${prompt}板块最近为什么这么活跃？有什么驱动因素吗？`,
                `您觉得${prompt}政策对市场会有什么影响？`,
                `能分析一下${prompt}事件对股市的短期和长期影响吗？`
            ],
            middle: [
                `那在${prompt}市场环境下，应该配置哪些类型的股票比较安全？`,
                `您认为${prompt}风险因素会在什么时候释放？`,
                `如果${prompt}情况发生变化，我们应该如何应对？`,
                `您觉得${prompt}和${scriptGenerator.getRelatedConcept(prompt)}哪个更值得关注？`
            ],
            closing: [
                `感谢您的精彩分析，让我对${prompt}市场有了更深入的了解。`,
                `按照您的观点，我会调整一下自己的投资组合。`,
                `您的解读很专业，对我很有启发，谢谢！`,
                `下次市场有重大变化时，还想听听您的看法。`
            ]
        },
        // 新增证券投资交流角色模板
        '基金经理-客户': {
            opening: [
                `基金经理您好，我想了解一下${prompt}基金的投资策略是什么？`,
                `请问${prompt}基金最近的表现如何？主要配置了哪些行业？`,
                `您管理的${prompt}基金今年收益率是多少？在同类基金中处于什么水平？`,
                `我想投资${prompt}基金，您觉得现在是合适的时机吗？`
            ],
            middle: [
                `${prompt}基金的风险等级是多少？最大回撤是多少？`,
                `如果我投资${prompt}基金，建议持有多长时间比较合适？`,
                `您觉得未来${prompt}基金的主要机会和风险分别是什么？`,
                `相比其他同类基金，${prompt}基金的优势在哪里？`
            ],
            closing: [
                `感谢您的详细介绍，我对${prompt}基金有了更全面的了解。`,
                `按照您的建议，我会考虑配置${prompt}基金。`,
                `您的专业分析让我对基金投资更有信心了，谢谢！`,
                `期待${prompt}基金未来的表现，我会持续关注。`
            ]
        },
        '投资顾问-咨询者': {
            opening: [
                `顾问您好，我想制定一个关于${prompt}的投资计划，能帮我吗？`,
                `请问像我这样的${prompt}类型的投资者，应该如何配置资产？`,
                `我有一笔资金想投资${prompt}，您能给我一些建议吗？`,
                `面对当前的${prompt}市场环境，我应该如何调整我的投资策略？`
            ],
            middle: [
                `投资${prompt}的话，应该如何分散风险？`,
                `您觉得${prompt}投资的最佳时间周期是什么？`,
                `对于${prompt}投资，有什么常见的误区需要避免？`,
                `如果市场出现大幅波动，我应该如何应对${prompt}相关投资？`
            ],
            closing: [
                `非常感谢您的专业建议，我会按照您制定的${prompt}投资计划执行。`,
                `您的资产配置建议很合理，我对${prompt}投资更有信心了。`,
                `这些投资策略对我很有帮助，谢谢！`,
                `以后在${prompt}投资方面还有问题，还能向您请教吗？`
            ]
        },
        '技术高手-学习者': {
            opening: [
                `老师您好，我想学习${prompt}技术指标的使用方法，能教我吗？`,
                `请问${prompt}技术形态出现后，通常会有什么走势？`,
                `您能详细讲解一下${prompt}技术分析的核心要点吗？`,
                `我在使用${prompt}技术指标时遇到了一些问题，该如何解决？`
            ],
            middle: [
                `如何结合${prompt}和其他技术指标进行综合分析？`,
                `您在使用${prompt}技术分析时，有什么独特的技巧吗？`,
                `对于新手来说，学习${prompt}技术分析需要注意什么？`,
                `您觉得${prompt}技术指标在当前市场环境下的有效性如何？`
            ],
            closing: [
                `太感谢您的指导了，我对${prompt}技术分析有了更深入的理解。`,
                `按照您教的方法，我会多实践${prompt}技术指标的应用。`,
                `您的技术分析经验分享对我帮助很大，谢谢！`,
                `希望以后能继续向您学习更多${prompt}相关的技术分析知识。`
            ]
        },
        '价值投资者-讨论者': {
            opening: [
                `您好，我是价值投资者，想和您讨论一下${prompt}这家公司的投资价值。`,
                `请问您如何看待${prompt}的护城河和竞争优势？`,
                `从价值投资的角度，您觉得${prompt}当前的估值是否合理？`,
                `您能分析一下${prompt}的财务状况和盈利能力吗？`
            ],
            middle: [
                `${prompt}的管理层能力如何？对公司未来发展有什么影响？`,
                `从长期来看，${prompt}的成长性如何？值得长期持有吗？`,
                `相比同行业的其他公司，${prompt}的估值优势在哪里？`,
                `作为价值投资者，您觉得${prompt}的安全边际如何？`
            ],
            closing: [
                `感谢您的价值投资观点分享，让我对${prompt}有了更深入的认识。`,
                `您的分析很有见地，我会进一步研究${prompt}的投资价值。`,
                `价值投资理念的交流对我很有帮助，谢谢！`,
                `期待以后能和您继续讨论更多关于${prompt}的价值投资话题。`
            ]
        },
        '短线交易者-交流者': {
            opening: [
                `您好，我是短线交易者，想请教您对${prompt}的短期走势看法。`,
                `请问${prompt}最近的资金流向如何？适合短线操作吗？`,
                `您能分析一下${prompt}的短期支撑位和压力位吗？`,
                `今天${prompt}的异动是什么原因导致的？有什么交易机会吗？`
            ],
            middle: [
                `短线操作${prompt}的话，应该设置什么样的止盈止损位？`,
                `您觉得${prompt}的短期波动主要受哪些因素影响？`,
                `对于${prompt}的短线交易，您有什么策略可以分享吗？`,
                `如果${prompt}出现了某种技术形态，短线应该如何操作？`
            ],
            closing: [
                `感谢您的短线交易建议，我会关注${prompt}的短期交易机会。`,
                `您的短线分析很精准，对我的交易决策很有帮助，谢谢！`,
                `希望以后能和您交流更多关于${prompt}的短线交易心得。`,
                `按照您的策略，我会谨慎操作${prompt}的短线交易。`
            ]
        },
        '行业专家-关注者': {
            opening: [
                `专家您好，能给我详细介绍一下${prompt}行业的发展现状吗？`,
                `请问${prompt}行业未来的发展趋势是什么？有哪些投资机会？`,
                `您觉得${prompt}行业的竞争格局如何？哪家公司最有竞争力？`,
                `政策对${prompt}行业的影响有多大？会带来哪些变化？`
            ],
            middle: [
                `${prompt}行业的技术发展方向是什么？哪些技术突破会改变行业格局？`,
                `对于${prompt}行业的投资，您建议关注哪些细分领域？`,
                `${prompt}行业目前面临的主要挑战是什么？如何应对？`,
                `相比国际市场，国内${prompt}行业的发展水平如何？`
            ],
            closing: [
                `非常感谢您的行业分析，让我对${prompt}行业有了更全面的了解。`,
                `您的专业见解对我的${prompt}行业投资很有指导意义，谢谢！`,
                `期待以后能听到更多您对${prompt}行业的深度分析。`,
                `按照您的建议，我会重点关注${prompt}行业的优质公司。`
            ]
        },
        '量化分析员-实践者': {
            opening: [
                `分析员您好，我想了解一下${prompt}量化策略的回测结果如何？`,
                `请问您开发的${prompt}量化模型主要基于哪些因子？`,
                `您觉得${prompt}量化策略在当前市场环境下的有效性如何？`,
                `能分享一下${prompt}量化交易系统的构建思路吗？`
            ],
            middle: [
                `${prompt}量化策略的最大回撤是多少？如何控制风险？`,
                `您的${prompt}量化模型如何处理市场的极端情况？`,
                `对于个人投资者来说，如何应用${prompt}量化方法？`,
                `您觉得${prompt}量化策略相比主观交易有什么优势和劣势？`
            ],
            closing: [
                `感谢您分享的量化分析知识，让我对${prompt}量化策略有了更深的认识。`,
                `您的量化模型设计很精妙，对我的${prompt}量化研究很有启发，谢谢！`,
                `希望以后能和您交流更多关于${prompt}量化交易的经验。`,
                `我会尝试将您的${prompt}量化思想应用到我的投资实践中。`
            ]
        },
        '财经媒体人-读者': {
            opening: [
                `您好，我看了您关于${prompt}的报道，想请教一些问题。`,
                `请问您对${prompt}事件的后续发展有什么预测吗？`,
                `您觉得${prompt}新闻对市场的影响会持续多久？`,
                `能解释一下${prompt}财经数据背后的深层含义吗？`
            ],
            middle: [
                `作为财经媒体人，您是如何看待${prompt}市场热点的？`,
                `您觉得普通投资者应该如何解读${prompt}财经新闻？`,
                `在报道${prompt}相关新闻时，您最关注哪些方面？`,
                `您认为${prompt}财经信息对投资决策的重要性有多大？`
            ],
            closing: [
                `感谢您的专业解读，让我对${prompt}财经新闻有了更深入的理解。`,
                `您的财经分析很客观，对我的投资决策很有帮助，谢谢！`,
                `以后我会更关注您关于${prompt}的报道和分析。`,
                `希望能看到更多您关于${prompt}的深度报道。`
            ]
        },
        // 原有角色模板
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
                `那${prompt}和之前学的${scriptGenerator.getRelatedConcept(prompt)}有什么联系吗？`,
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
scriptGenerator.generateAIMessage = function(prompt, round, totalRounds, style, contextHistory = [], characterRole = '客服-用户', knowledgeBaseItems = [], knowledgeWeight = 0.5) {
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
        },
        // 证券投资交流群角色模板
        '分析师-投资者': {
            '专业分析': `根据${prompt}的技术面和基本面分析，我们可以看到以下几个关键点：首先，从K线形态来看，${prompt}近期形成了明显的看涨信号；其次，从基本面分析，公司最新财报显示业绩超预期，营收和净利润均有显著增长；再者，从行业角度，${prompt}所在板块正处于政策红利期。综合来看，${prompt}具备中长期投资价值。`,
            '热情分享': `嘿，关于${prompt}我有一些新发现要和你分享！最近我一直在跟踪这只股票，发现它的资金流入非常明显，主力持仓持续增加。而且公司刚刚发布了一个重磅合作消息，这很可能成为股价上涨的催化剂。我觉得现在是关注${prompt}的好时机，你也可以研究一下！`,
            '轻松交流': `聊到${prompt}啊，我觉得这只票挺有意思的。最近市场波动挺大的，但它表现得相对抗跌，说明有资金在护盘。从短期来看，可能会有一波反弹机会；中长期的话，还是要看公司的业绩能不能持续增长。你觉得呢？`,
            '深度推荐': `经过深度研究，我强烈推荐关注${prompt}。这只股票在所属行业中处于领先地位，拥有核心技术壁垒，而且估值处于历史低位。更重要的是，公司正在布局新兴领域，未来成长空间巨大。根据我的模型测算，${prompt}未来12个月的目标价至少有30%的上涨空间。`,
            '共鸣理解': `我完全理解你对${prompt}的纠结，市场上确实有很多不同的声音。其实投资就是这样，充满了不确定性。不过，从长远来看，${prompt}的基本面还是比较扎实的，公司管理层也很靠谱。如果你是长期投资者，现在的价格其实是一个不错的入场点。`
        },
        '资深股民-新手': {
            '专业分析': `${prompt}这个股票我研究过，从技术指标来看，MACD即将金叉，RSI处于超卖区域，短期有反弹需求。从基本面来说，公司的毛利率和净利率都在稳步提升，现金流状况良好。不过需要注意的是，近期市场情绪波动较大，建议控制好仓位，分批建仓。`,
            '热情分享': `哎呀，你也关注${prompt}啦！我跟你说，这只股票我已经拿了半年了，收益相当不错。它的逻辑其实很简单：行业景气度高，公司订单饱满，而且估值也不算贵。你要是感兴趣，我可以把我整理的研究资料发给你，咱们一起交流学习！`,
            '轻松交流': `说起${prompt}啊，我想起去年这个时候它还在低位徘徊，没想到现在涨了这么多。其实投资有时候就是需要耐心，选对了方向就坚持持有。当然，也要注意风险控制，不要把鸡蛋放在一个篮子里。你平时喜欢做短线还是长线？`,
            '深度推荐': `听我一句劝，一定要关注${prompt}！我在股市摸爬滚打这么多年，很少见到基本面这么扎实的公司。它不仅业绩稳定增长，而且每年都会分红，股息率也不低。现在这个价格绝对是被低估了，再过一段时间等市场反应过来，肯定会涨上去的。`,
            '共鸣理解': `我特别能理解你现在的感受，刚开始炒股的时候我也是这样，看到股票波动就紧张得不行。其实对于${prompt}这样的优质股，你完全不用太担心短期的涨跌，把眼光放长远一点。只要公司基本面没问题，长期持有肯定会有不错的回报。`
        },
        '基金经理-客户': {
            '专业分析': `关于${prompt}基金，我们的研究团队进行了深入分析。从业绩表现来看，该基金在过去一年的收益率位居同类产品前10%；从风险控制角度，最大回撤显著低于行业平均水平；从持仓结构来看，基金经理对${prompt}的配置比例合理，兼顾成长和价值。综合评估，这是一只值得配置的优质基金。`,
            '热情分享': `很高兴能和你聊到${prompt}基金！这只基金我关注很久了，基金经理的投资风格非常稳健，无论是牛市还是熊市都能取得不错的收益。特别是最近市场调整的时候，它表现得特别抗跌，充分体现了基金经理的选股能力和风险控制水平。`,
            '轻松交流': `你问我对${prompt}基金的看法啊，我觉得还不错。它的波动比较小，适合风险偏好中等的投资者。如果你是想做长期定投的话，现在开始是个不错的时机。当然，投资基金也不能只看短期表现，还是要关注基金经理的投资理念和长期业绩。`,
            '深度推荐': `我非常推荐你配置${prompt}基金。根据我们的模型分析，该基金在未来3-5年内有望获得年化15%以上的收益。基金经理不仅有丰富的投资经验，而且对宏观经济和行业趋势的判断非常准确。现在市场处于相对低位，正是买入优质基金的好时机。`,
            '共鸣理解': `我完全理解你在选择基金时的犹豫，毕竟投资涉及到自己的血汗钱，谨慎一点是对的。对于${prompt}基金，我建议你先小额配置，观察一段时间，看看它的表现是否符合你的预期。投资是一个长期的过程，慢慢来，不要急于求成。`
        },
        '投资顾问-咨询者': {
            '专业分析': `针对您提出的${prompt}问题，我从多个维度进行了分析。从宏观经济环境来看，当前处于经济复苏阶段，有利于股市表现；从中观行业层面，${prompt}所属行业正处于上升周期；从微观公司角度，企业竞争力强，财务状况健康。基于以上分析，我建议采取均衡配置策略，适当增加${prompt}相关资产的比例。`,
            '热情分享': `您好！很高兴能为您解答关于${prompt}的问题。我最近也在研究这个领域，发现了一些很有价值的信息。${prompt}其实是一个非常有潜力的投资方向，尤其是在当前市场环境下。我可以为您详细介绍一下相关的投资机会和风险点，帮助您做出更明智的决策。`,
            '轻松交流': `关于${prompt}啊，我觉得您的问题很有见地。其实投资并没有想象中那么复杂，关键是要找到适合自己的方法。对于${prompt}，我建议您可以先从小额投资开始，积累一些经验。如果您有具体的投资目标或风险偏好，我可以为您提供更有针对性的建议。`,
            '深度推荐': `经过深入研究，我强烈建议您关注${prompt}相关的投资机会。从长期来看，这一领域将受益于技术进步和政策支持，成长空间巨大。具体来说，您可以考虑通过ETF、股票或基金等多种方式参与。现在正是布局的好时机，机不可失。`,
            '共鸣理解': `我非常理解您在面对${prompt}时的困惑和担忧，投资确实是一个需要谨慎对待的事情。别着急，让我们慢慢来。首先，明确您的投资目标和风险承受能力；然后，我们可以一起分析${prompt}的优缺点；最后，根据您的实际情况制定一个合适的投资计划。`
        },
        // 新增证券投资交流角色AI响应模板
        '技术高手-学习者': {
            '专业分析': `${prompt}是一个非常重要的技术指标，它的计算方式是...从理论上来说，当${prompt}出现金叉形态时，通常意味着短期趋势向上；而当出现死叉形态时，则意味着短期趋势向下。在实际应用中，建议结合成交量、MACD等其他指标进行综合判断，以提高分析的准确性。`,
            '热情分享': `太好啦！你对${prompt}感兴趣，这可是技术分析的核心指标之一。我当年刚开始学技术分析的时候，也对${prompt}特别着迷。这个指标最大的特点就是...我可以给你推荐一本关于${prompt}的经典书籍，里面有很多实用的案例分析，相信会对你有很大帮助！`,
            '轻松交流': `说起${prompt}啊，其实它并没有想象中那么复杂。简单来说，它就是帮助我们判断市场短期趋势的一种工具。你看，最近${scriptGenerator.getRelatedConcept(prompt)}的走势就可以用${prompt}来很好地解释。我觉得学习技术分析最重要的是多实践，你可以拿历史数据来练习，慢慢就会掌握其中的窍门了。`,
            '深度推荐': `我强烈建议你深入学习${prompt}的使用方法。这个指标虽然看起来简单，但实际上蕴含着丰富的市场信息。通过研究${prompt}与价格走势的背离关系，你可以提前发现市场趋势的变化。如果能熟练运用${prompt}，再结合其他技术分析工具，你的交易胜率将会大大提高。`,
            '共鸣理解': `我完全理解你在学习${prompt}时遇到的困难，当年我也花了很长时间才真正掌握它。别着急，技术分析需要时间和经验的积累。对于${prompt}，我的建议是先从基础概念入手，然后通过大量的实战案例来加深理解。如果你在学习过程中遇到任何问题，随时都可以来问我，我们一起探讨。`
        },
        '价值投资者-讨论者': {
            '专业分析': `从价值投资的角度来看，${prompt}公司具有以下几个核心优势：首先，公司拥有坚固的护城河，市场份额持续提升；其次，财务状况健康，现金流充裕，负债率低；再者，管理层能力突出，过往战略执行效果良好；最后，当前估值处于合理区间，安全边际较高。综合来看，${prompt}是一个优质的长期投资标的。`,
            '热情分享': `你也关注${prompt}这家公司啊！我研究这家公司很久了，它的商业模式非常独特，而且在行业内处于领先地位。最让我欣赏的是公司管理层的战略眼光，他们总是能够提前布局未来的发展方向。如果你有兴趣，我可以分享一些我收集的关于${prompt}的研究资料，咱们一起深入探讨它的投资价值。`,
            '轻松交流': `关于${prompt}，我觉得它确实是一家不错的公司。虽然最近股价表现一般，但从长期来看，公司的基本面还是很扎实的。价值投资嘛，本来就是需要耐心的。我自己也持有一些${prompt}的股票，打算长期持有。你平时是怎么筛选价值股的？咱们可以互相交流一下经验。`,
            '深度推荐': `经过深入研究，我认为${prompt}是一个被市场严重低估的优质企业。从DCF模型估值来看，公司的内在价值至少比当前股价高出50%以上。而且公司近年来一直在加大研发投入，新业务增长迅速，未来几年业绩有望保持两位数的增长。作为价值投资者，现在正是买入${prompt}的绝佳时机。`,
            '共鸣理解': `我非常理解你对${prompt}当前估值的担忧，毕竟市场上有很多不同的声音。但是从价值投资的角度来看，短期的市场波动并不重要，关键是要看公司的长期价值。${prompt}公司的竞争优势在不断增强，盈利能力持续提升，这样的企业即使短期估值略高，长期来看也是值得投资的。`
        },
        '短线交易者-交流者': {
            '专业分析': `从短线交易的角度来看，${prompt}的技术面呈现出以下几个特点：首先，K线形态形成了明显的突破信号；其次，成交量显著放大，资金流入迹象明显；再者，短期均线系统呈多头排列，MACD在零轴上方金叉。综合来看，${prompt}短期内有继续上涨的动力，建议在回调时适量买入，设置好止盈止损位。`,
            '热情分享': `嘿，你也在关注${prompt}啊！今天早上我就发现这只股票有异动，赶紧追进去了，没想到下午就涨停了！这只股票的资金面非常活跃，主力介入迹象明显，而且盘子不大，很适合短线操作。明天如果有机会回调，我打算再加仓一些。你今天有没有买？`,
            '轻松交流': `说起${prompt}，我昨天刚做了一把短线，小赚了一点。其实做短线最重要的就是快进快出，不要太贪心。我一般都是看5分钟和15分钟K线，结合分时图来做决策。你平时做短线喜欢用什么指标？咱们可以互相交流一下经验。对了，你觉得${prompt}明天会怎么走？`,
            '深度推荐': `我强烈建议你关注${prompt}的短线机会。根据我的交易系统分析，这只股票已经满足了多个短线爆发的条件：题材热点契合当前市场主流、技术面突破关键压力位、资金大幅流入、换手率适中。从历史数据来看，类似形态出现后，短期内上涨的概率超过80%。明天如果开盘有小幅回调，就是绝佳的买入时机。`,
            '共鸣理解': `我完全理解你现在的纠结，做短线确实压力很大，尤其是在市场波动剧烈的时候。对于${prompt}，我的建议是先观察一下明天的开盘情况，如果能够强势突破今天的高点，就可以考虑介入；如果低开低走，就暂时观望。记住，短线交易最重要的是控制风险，永远不要满仓操作。`
        },
        '行业专家-关注者': {
            '专业分析': `${prompt}行业正处于快速发展阶段，行业景气度持续提升。从产业链角度来看，上游原材料供应稳定，中游制造环节技术不断突破，下游需求持续增长。政策层面，国家出台了一系列支持${prompt}行业发展的政策，为行业发展提供了良好的外部环境。预计未来3-5年，${prompt}行业将保持20%以上的年复合增长率。`,
            '热情分享': `你对${prompt}行业感兴趣真是太好了！这可是未来几年最有发展潜力的行业之一。我最近一直在跟踪这个行业，发现了很多有趣的变化。比如...这些变化都预示着${prompt}行业即将迎来爆发式增长。如果你想深入了解这个行业，我可以推荐一些专业的研究报告和数据来源给你。`,
            '轻松交流': `关于${prompt}行业啊，我觉得它的发展前景确实不错。现在人们生活水平提高了，对${prompt}相关产品的需求也越来越大。而且随着技术的进步，${prompt}的应用场景也在不断扩展。我有个朋友就在${prompt}行业工作，据他说现在行业内的公司订单都排到明年了。你觉得${prompt}行业的竞争格局怎么样？`,
            '深度推荐': `经过深入研究，我强烈建议你关注${prompt}行业的投资机会。这个行业不仅现在发展得很好，而且未来成长空间巨大。具体来说，我最看好行业内的龙头企业和一些具有核心技术优势的中小企业。现在市场对${prompt}行业的关注度还不够高，很多优质公司的估值还比较合理，正是布局的好时机。`,
            '共鸣理解': `我非常理解你对${prompt}行业的疑惑，毕竟任何行业都有其发展的不确定性。不过从目前掌握的信息来看，${prompt}行业的基本面还是非常扎实的。需求端持续增长，供给端技术不断突破，政策面也很友好。虽然短期内可能会有一些波动，但长期来看，${prompt}行业的发展前景是非常光明的。`
        },
        '量化分析员-实践者': {
            '专业分析': `${prompt}量化策略的回测结果显示，该策略在过去5年的年化收益率达到了18.5%，最大回撤控制在12%以内，夏普比率为1.6。从因子分析来看，该策略主要依赖于动量因子和价值因子，这两个因子在当前市场环境下仍具有较好的有效性。不过需要注意的是，随着市场环境的变化，策略可能需要进行适当的参数调整。`,
            '热情分享': `太好了！你也对${prompt}量化策略感兴趣啊！我最近刚好开发了一个基于${prompt}的量化模型，回测效果非常不错。这个策略的核心思想是...我还在模型中加入了一些机器学习的方法，用来提高预测的准确性。如果你有兴趣，我们可以一起讨论这个策略的优化方向，甚至可以合作开发一个更完善的版本。`,
            '轻松交流': `说起${prompt}量化策略，我觉得它确实是一个很有意思的研究方向。不过做量化也不能完全依赖模型，有时候还是需要一些主观判断的。我自己就喜欢把量化分析和基本面分析结合起来使用，这样可以互相验证，提高决策的准确性。你平时做量化的时候喜欢用哪些编程语言和工具？`,
            '深度推荐': `我强烈推荐你深入研究${prompt}量化策略。经过我的回测和实盘验证，这个策略在不同的市场环境下都表现出了较好的适应性和稳定性。而且，这个策略的逻辑清晰，参数容易调整，非常适合个人投资者使用。如果你能够熟练掌握这个策略，并根据市场变化进行适当的优化，相信你的投资收益将会有显著的提升。`,
            '共鸣理解': `我完全理解你在学习${prompt}量化策略时遇到的困难，量化分析确实需要一定的数学基础和编程能力。不过别担心，学习量化是一个循序渐进的过程，只要你有耐心，慢慢积累，就一定能够掌握它。对于${prompt}量化策略，我的建议是先从简单的模型开始，然后再逐步加入更多的因子和复杂的算法。`
        },
        '财经媒体人-读者': {
            '专业分析': `关于${prompt}事件，我们进行了深入的调查和分析。从表面上看，这只是一个个案，但实际上反映了当前市场的深层次矛盾。从短期来看，该事件可能会对相关板块产生一定的冲击；但从长期来看，这反而可能加速行业的整合和规范，有利于行业的健康发展。投资者在面对此类事件时，应该保持理性，避免盲目跟风。`,
            '热情分享': `你关注到${prompt}事件了啊！我最近也在跟踪这个事件，收集了很多第一手资料。其实这个事件背后还有很多不为人知的细节，比如...这些细节对于理解整个事件的来龙去脉非常重要。如果你想了解更多关于${prompt}事件的深度报道，我可以给你推荐一些优质的媒体资源。`,
            '轻松交流': `说起${prompt}财经新闻，我觉得现在媒体的报道质量参差不齐，有时候很难从中获取准确的信息。作为普通投资者，我觉得最重要的是要有自己的判断能力，不能完全依赖媒体的报道。你平时都通过哪些渠道获取财经信息？有没有什么特别信任的媒体或分析师？`,
            '深度推荐': `我强烈建议你关注${prompt}事件的后续发展。根据我的经验，这类事件往往会引发一系列的连锁反应，不仅会影响相关公司的股价，还可能对整个行业的发展格局产生深远的影响。如果你是相关行业的投资者，现在正是密切关注市场变化、调整投资策略的好时机。`,
            '共鸣理解': `我非常理解你在面对海量财经信息时的困惑，现在媒体报道的速度越来越快，但质量却参差不齐。对于${prompt}相关的财经新闻，我的建议是多渠道核实信息，关注多个不同观点的报道，然后通过自己的分析判断来形成独立的见解。记住，在投资领域，独立思考能力是最宝贵的。`
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

    // 如果有相关的知识库内容，根据权重决定是否集成到回复中
    let knowledgeIntegration = '';
    let usedKnowledge = false;
    
    if (knowledgeBaseItems && knowledgeBaseItems.length > 0 && Math.random() < knowledgeWeight) {
        // 根据权重选择使用的知识库内容数量
        const knowledgeCount = Math.max(1, Math.floor(knowledgeBaseItems.length * knowledgeWeight));
        const selectedItems = [];
        
        // 随机选择内容，但避免重复
        while (selectedItems.length < knowledgeCount && selectedItems.length < knowledgeBaseItems.length) {
            const randomIndex = Math.floor(Math.random() * knowledgeBaseItems.length);
            if (!selectedItems.includes(knowledgeBaseItems[randomIndex])) {
                selectedItems.push(knowledgeBaseItems[randomIndex]);
            }
        }
        
        // 提取知识摘要并集成到回复中
        selectedItems.forEach((item, index) => {
            if (item) {
                // 优先使用最相关的分块内容（如果有）
                const contentToUse = item.mostRelevantChunk || item.content;
                const knowledgeSummary = scriptGenerator.extractKnowledgeSummary(contentToUse);
                if (knowledgeSummary) {
                    const integrationFormats = [
                        `\n\n根据我们的知识库信息，${knowledgeSummary}`,
                        `\n\n值得注意的是，${knowledgeSummary}`,
                        `\n\n另外，我们的资料显示${knowledgeSummary}`,
                        `\n\n补充一点，${knowledgeSummary}`
                    ];
                    
                    // 权重越高，使用的集成格式越靠前（更直接引用知识库）
                    const formatIndex = knowledgeWeight > 0.7 ? 0 : 
                                      (knowledgeWeight > 0.4 ? Math.floor(Math.random() * 2) : 
                                      Math.floor(Math.random() * integrationFormats.length));
                    
                    knowledgeIntegration += integrationFormats[formatIndex];
                    usedKnowledge = true;
                }
            }
        });
    }
    
    // 保存是否使用了知识库的标志，用于统计
    scriptGenerator.lastUsedKnowledge = usedKnowledge;
    
    // 如果有上下文历史，可以基于历史内容生成更连贯的回答
    let contextualResponse = baseResponse;
    if (contextHistory && contextHistory.length > 0) {
        const lastUserMessage = contextHistory.find(item => 
            item.role.includes('用户') || item.role.includes('学生') || 
            item.role.includes('患者') || item.role.includes('客户') || 
            item.role.includes('面试者') || item.role.includes('学员')
        );
        
        if (lastUserMessage) {
            contextualResponse = scriptGenerator.adaptResponseToContext(baseResponse, prompt, lastUserMessage.content);
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
scriptGenerator.getRelatedConcept = function(prompt) {
    const concepts = ['基础理论', '实践应用', '案例分析', '方法论', '前沿研究', '经典模型'];
    return concepts[Math.floor(Math.random() * concepts.length)];
}

// 辅助函数：基于上下文生成跟进问题
scriptGenerator.generateFollowUpQuestion = function(prompt, lastMessage, middleTemplates) {
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
scriptGenerator.adaptResponseToContext = function(baseResponse, prompt, userMessage) {
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
scriptGenerator.extractKnowledgeSummary = function(content) {
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