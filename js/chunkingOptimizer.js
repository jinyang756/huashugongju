// 文档分块和检索前优化模块
const chunkingOptimizer = {
    // 配置参数
    config: {
        // 固定大小分块的默认设置
        fixedSize: {
            chunkSize: 300, // 默认分块大小（字符数）
            overlap: 50,    // 分块重叠字符数
        },
        // 句子分块的默认设置
        sentence: {
            maxSentences: 3, // 每个分块的最大句子数
        },
        // 递归分块的默认设置
        recursive: {
            maxDepth: 2,     // 最大递归深度
            baseSize: 500,   // 基础分块大小
        }
    },
    
    // 固定大小分块方法
    chunkByFixedSize: function(content, options = {}) {
        const config = {
            ...this.config.fixedSize,
            ...options
        };
        
        const chunks = [];
        const contentLength = content.length;
        let start = 0;
        
        while (start < contentLength) {
            let end = Math.min(start + config.chunkSize, contentLength);
            
            // 尝试在句子结束符处分割，以保持语义完整性
            const endMarker = this.findNearestPunctuation(content, end);
            if (endMarker > start) {
                end = endMarker;
            }
            
            chunks.push(content.substring(start, end).trim());
            start = end - config.overlap;
        }
        
        return chunks;
    },
    
    // 句子分块方法
    chunkBySentences: function(content, options = {}) {
        const config = {
            ...this.config.sentence,
            ...options
        };
        
        // 使用正则表达式分割句子
        const sentences = content.match(/[^。！？.?!]+[。！？.?!]?/g) || [content];
        const chunks = [];
        
        for (let i = 0; i < sentences.length; i += config.maxSentences) {
            const chunk = sentences.slice(i, i + config.maxSentences)
                .join('')
                .trim();
            
            if (chunk) {
                chunks.push(chunk);
            }
        }
        
        return chunks;
    },
    
    // 递归分块方法（处理长文档）
    chunkRecursively: function(content, options = {}, currentDepth = 0) {
        const config = {
            ...this.config.recursive,
            ...options
        };
        
        // 如果达到最大深度或内容长度适中，返回单个分块
        if (currentDepth >= config.maxDepth || content.length <= config.baseSize) {
            return [content.trim()];
        }
        
        // 首先进行初步分块
        const initialChunks = this.chunkByFixedSize(content, {
            chunkSize: config.baseSize * Math.pow(2, currentDepth),
            overlap: Math.floor(config.baseSize * 0.1)
        });
        
        // 对每个初步分块进行递归处理
        const finalChunks = [];
        for (const chunk of initialChunks) {
            finalChunks.push(...this.chunkRecursively(chunk, options, currentDepth + 1));
        }
        
        return finalChunks;
    },
    
    // Markdown/LaTeX分块（简单实现）
    chunkByMarkdown: function(content) {
        // 这里实现一个简单的Markdown分块策略
        // 按标题、代码块、列表等Markdown元素进行分块
        const chunks = [];
        
        // 分割标题块
        const headingRegex = /(#+\s+.*?)(?=\n#+\s|$)/gs;
        let match;
        let lastIndex = 0;
        
        while ((match = headingRegex.exec(content)) !== null) {
            // 添加标题前的内容
            if (match.index > lastIndex) {
                const preHeading = content.substring(lastIndex, match.index).trim();
                if (preHeading) {
                    chunks.push(preHeading);
                }
            }
            
            // 添加标题及其内容
            chunks.push(match[1].trim());
            lastIndex = match.index + match[1].length;
        }
        
        // 添加最后一部分内容
        if (lastIndex < content.length) {
            const lastChunk = content.substring(lastIndex).trim();
            if (lastChunk) {
                chunks.push(lastChunk);
            }
        }
        
        return chunks;
    },
    
    // 查找最近的标点符号（用于优化分块边界）
    findNearestPunctuation: function(content, position) {
        const punctuation = '。！？.!?，,；;\n\r';
        
        // 向前查找最近的标点符号，范围不超过50个字符
        const lookBack = Math.max(0, position - 50);
        for (let i = position; i >= lookBack; i--) {
            if (punctuation.includes(content[i])) {
                return i + 1;
            }
        }
        
        return position;
    },
    
    // 检索前查询优化
    optimizeQuery: function(query) {
        if (!query || typeof query !== 'string') {
            return query;
        }
        
        let optimizedQuery = query.trim();
        
        // 1. 去除多余空格
        optimizedQuery = optimizedQuery.replace(/\s+/g, ' ');
        
        // 2. 标准化常见查询前缀
        const commonPrefixes = [
            '请解释', '请说明', '什么是', '能否解释', 
            '如何理解', '怎么理解', '请教', '请问'
        ];
        
        for (const prefix of commonPrefixes) {
            if (optimizedQuery.startsWith(prefix)) {
                optimizedQuery = optimizedQuery.substring(prefix.length).trim();
                break;
            }
        }
        
        // 3. 提取核心关键词
        const coreKeywords = this.extractCoreKeywords(optimizedQuery);
        
        // 4. 如果提取到关键词，使用关键词重构查询
        if (coreKeywords.length > 0) {
            return coreKeywords.join(' ');
        }
        
        return optimizedQuery;
    },
    
    // 提取核心关键词
    extractCoreKeywords: function(text) {
        // 这是一个简单的关键词提取实现
        // 实际应用中可以使用更复杂的NLP技术
        const stopwords = ['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这'];
        const words = text.split(/[\s，,。！？.!?]+/).filter(word => word.length > 1);
        
        // 过滤停用词
        return words.filter(word => !stopwords.includes(word));
    },
    
    // 根据内容类型选择合适的分块方法
    smartChunking: function(content, contentType = 'text') {
        // 根据内容类型选择分块方法
        if (contentType === 'markdown') {
            return this.chunkByMarkdown(content);
        }
        
        // 根据内容长度自动选择分块方法
        const contentLength = content.length;
        
        if (contentLength > 2000) {
            // 长文档使用递归分块
            return this.chunkRecursively(content);
        } else if (contentLength > 500) {
            // 中等长度文档使用句子分块
            return this.chunkBySentences(content);
        } else {
            // 短文档使用固定大小分块
            return this.chunkByFixedSize(content, {
                chunkSize: 300,
                overlap: 30
            });
        }
    },
    
    // 获取分块统计信息
    getChunkStatistics: function(chunks) {
        return {
            totalChunks: chunks.length,
            averageLength: chunks.reduce((sum, chunk) => sum + chunk.length, 0) / chunks.length,
            minLength: Math.min(...chunks.map(chunk => chunk.length)),
            maxLength: Math.max(...chunks.map(chunk => chunk.length))
        };
    }
};

// 确保全局可访问
globalThis.chunkingOptimizer = chunkingOptimizer;