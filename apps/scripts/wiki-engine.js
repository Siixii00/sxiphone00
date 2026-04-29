class WikiEngine {
    constructor(db) {
        this.db = db;
        this.graph = null;
        this.zoomLevel = 1;
        this.panOffset = { x: 0, y: 0 };
        this.config = {
            maxIndexSize: 100,
            logRetentionDays: 30,
            enableAutoLink: true,
            linkThreshold: 0.7,
            weightDecayRate: 0.05,
            activationBoost: 0.1,
            maxActivation: 1.0,
            minActivation: 0.1,
            spreadDecay: 0.8,
            maxSpreadDepth: 3
        };
        this.activationState = new Map();
        this.keywordIndex = new Map();
        this.linkGraph = new Map();
    }

    async initialize() {
        await this._buildKeywordIndex();
        await this._buildLinkGraph();
        console.log('[WikiEngine] 初始化完成');
    }

    async _buildKeywordIndex() {
        const userEntries = await this.db.getAllEntries('user_entries');
        const charEntries = await this.db.getAllEntries('char_entries');
        const allEntries = [...userEntries, ...charEntries];

        this.keywordIndex.clear();

        for (const entry of allEntries) {
            const keywords = entry.keywords || this._extractKeywords(entry.content);
            const weight = this._calculateEntryWeight(entry);

            for (const kw of keywords) {
                if (!this.keywordIndex.has(kw)) {
                    this.keywordIndex.set(kw, []);
                }
                this.keywordIndex.get(kw).push({
                    entryId: entry.id,
                    weight: weight,
                    charId: entry.charId,
                    category: entry.category,
                    lastAccessed: entry.lastAccessed || entry.createdAt
                });
            }
        }

        for (const [kw, entries] of this.keywordIndex) {
            entries.sort((a, b) => b.weight - a.weight);
        }

        console.log(`[WikiEngine] 關鍵詞索引建立完成: ${this.keywordIndex.size} 個關鍵詞`);
    }

    async _buildLinkGraph() {
        const userEntries = await this.db.getAllEntries('user_entries');
        const charEntries = await this.db.getAllEntries('char_entries');
        const allEntries = [...userEntries, ...charEntries];

        this.linkGraph.clear();

        for (const entry of allEntries) {
            const links = entry.linkedMemories || [];
            const linkWeights = entry.linkScores || [];

            this.linkGraph.set(entry.id, {
                outgoing: links.map((id, idx) => ({
                    targetId: id,
                    weight: linkWeights[idx]?.similarity || 0.5
                })),
                incoming: []
            });
        }

        for (const [entryId, node] of this.linkGraph) {
            for (const link of node.outgoing) {
                const targetNode = this.linkGraph.get(link.targetId);
                if (targetNode) {
                    targetNode.incoming.push({
                        sourceId: entryId,
                        weight: link.weight
                    });
                }
            }
        }

        console.log(`[WikiEngine] 連結圖譜建立完成: ${this.linkGraph.size} 個節點`);
    }

    _calculateEntryWeight(entry) {
        let weight = 0.5;

        const importance = entry.importance || entry.metadata?.importance || 5;
        weight += (importance - 5) * 0.05;

        const accessCount = entry.accessCount || entry.metadata?.accessCount || 0;
        weight += Math.min(accessCount * 0.02, 0.2);

        const emphasisCount = entry.emphasisCount || 0;
        weight += Math.min(emphasisCount * 0.08, 0.3);

        if (entry.emotionalWeight) {
            weight += entry.emotionalWeight * 0.15;
        }

        if (entry.dislikeMarked) {
            weight += 0.25;
        }

        if (entry.importantMarked) {
            weight += 0.2;
        }

        const createdAt = entry.createdAt ? new Date(entry.createdAt).getTime() : Date.now();
        const daysSinceCreated = (Date.now() - createdAt) / (1000 * 60 * 60 * 24);
        weight *= Math.exp(-this.config.weightDecayRate * daysSinceCreated * 0.5);

        const lastAccessed = entry.lastAccessed ? new Date(entry.lastAccessed).getTime() : createdAt;
        const hoursSinceAccessed = (Date.now() - lastAccessed) / (1000 * 60 * 60);
        weight *= Math.exp(-this.config.weightDecayRate * hoursSinceAccessed / 48);

        if (entry.category === 'important') weight *= 1.3;
        if (entry.tags?.includes('重要') || entry.tags?.includes('important')) weight *= 1.2;
        if (entry.tags?.includes('討厭') || entry.tags?.includes('dislike')) weight *= 1.4;
        if (entry.tags?.includes('喜歡') || entry.tags?.includes('like')) weight *= 1.2;

        const linkCount = (entry.linkedMemories || []).length;
        weight += Math.min(linkCount * 0.03, 0.15);

        const reinforcementCount = entry.reinforcementCount || 0;
        weight += Math.min(reinforcementCount * 0.05, 0.2);

        return Math.max(this.config.minActivation, Math.min(this.config.maxActivation, weight));
    }

    async emphasize(entryId, source = 'user', emotion = null) {
        const entry = await this._getEntryById(entryId);
        if (!entry) return null;

        const storeName = entry.charId ? 'char_entries' : 'user_entries';
        const currentEmphasis = entry.emphasisCount || 0;
        const emphasisHistory = entry.emphasisHistory || [];

        emphasisHistory.push({
            timestamp: new Date().toISOString(),
            source: source,
            emotion: emotion,
            previousCount: currentEmphasis
        });

        const updated = await this.db.updateEntry(storeName, {
            ...entry,
            emphasisCount: currentEmphasis + 1,
            emphasisHistory: emphasisHistory.slice(-20),
            lastEmphasized: new Date().toISOString(),
            weight: this._calculateEntryWeight({
                ...entry,
                emphasisCount: currentEmphasis + 1
            })
        });

        await this._buildKeywordIndex();

        console.log(`[WikiEngine] 強調條目: ${entryId} (第 ${currentEmphasis + 1} 次, 來源: ${source})`);

        return updated;
    }

    async markDislike(entryId, source = 'user', reason = null) {
        const entry = await this._getEntryById(entryId);
        if (!entry) return null;

        const storeName = entry.charId ? 'char_entries' : 'user_entries';
        const dislikeHistory = entry.dislikeHistory || [];

        dislikeHistory.push({
            timestamp: new Date().toISOString(),
            source: source,
            reason: reason
        });

        const tags = entry.tags || [];
        if (!tags.includes('討厭')) tags.push('討厭');
        if (!tags.includes('dislike')) tags.push('dislike');

        const updated = await this.db.updateEntry(storeName, {
            ...entry,
            dislikeMarked: true,
            dislikeSource: source,
            dislikeReason: reason,
            dislikeHistory: dislikeHistory,
            dislikeCount: (entry.dislikeCount || 0) + 1,
            tags: tags,
            emotionalWeight: Math.min((entry.emotionalWeight || 0) + 0.3, 1.0),
            weight: this._calculateEntryWeight({
                ...entry,
                dislikeMarked: true,
                emotionalWeight: Math.min((entry.emotionalWeight || 0) + 0.3, 1.0)
            })
        });

        await this._buildKeywordIndex();

        console.log(`[WikiEngine] 標記討厭: ${entryId} (來源: ${source}, 原因: ${reason || '無'})`);

        return updated;
    }

    async markImportant(entryId, source = 'user', level = 1) {
        const entry = await this._getEntryById(entryId);
        if (!entry) return null;

        const storeName = entry.charId ? 'char_entries' : 'user_entries';
        const importantHistory = entry.importantHistory || [];

        importantHistory.push({
            timestamp: new Date().toISOString(),
            source: source,
            level: level
        });

        const tags = entry.tags || [];
        if (!tags.includes('重要')) tags.push('重要');

        const updated = await this.db.updateEntry(storeName, {
            ...entry,
            importantMarked: true,
            importantLevel: Math.max(entry.importantLevel || 0, level),
            importantHistory: importantHistory,
            importance: Math.min(10, (entry.importance || 5) + level),
            tags: tags,
            emotionalWeight: Math.min((entry.emotionalWeight || 0) + 0.2 * level, 1.0),
            weight: this._calculateEntryWeight({
                ...entry,
                importantMarked: true,
                importance: Math.min(10, (entry.importance || 5) + level),
                emotionalWeight: Math.min((entry.emotionalWeight || 0) + 0.2 * level, 1.0)
            })
        });

        await this._buildKeywordIndex();

        console.log(`[WikiEngine] 標記重要: ${entryId} (等級: ${level}, 來源: ${source})`);

        return updated;
    }

    async recordEmotion(entryId, emotion, source = 'user') {
        const entry = await this._getEntryById(entryId);
        if (!entry) return null;

        const storeName = entry.charId ? 'char_entries' : 'user_entries';
        const emotionHistory = entry.emotionHistory || [];

        emotionHistory.push({
            timestamp: new Date().toISOString(),
            emotion: emotion,
            source: source
        });

        let emotionalWeight = entry.emotionalWeight || 0;

        if (emotion.type === 'dislike' || emotion.type === 'hate') {
            emotionalWeight = Math.min(emotionalWeight + 0.3, 1.0);
        } else if (emotion.type === 'like' || emotion.type === 'love') {
            emotionalWeight = Math.min(emotionalWeight + 0.15, 1.0);
        } else if (emotion.type === 'important' || emotion.type === 'remember') {
            emotionalWeight = Math.min(emotionalWeight + 0.2, 1.0);
        } else if (emotion.intensity && emotion.intensity > 0.7) {
            emotionalWeight = Math.min(emotionalWeight + emotion.intensity * 0.2, 1.0);
        }

        const updated = await this.db.updateEntry(storeName, {
            ...entry,
            emotionHistory: emotionHistory.slice(-30),
            lastEmotion: emotion,
            emotionalWeight: emotionalWeight,
            weight: this._calculateEntryWeight({
                ...entry,
                emotionalWeight: emotionalWeight
            })
        });

        await this._buildKeywordIndex();

        return updated;
    }

    async _getEntryById(entryId) {
        let entry = await this.db.getEntry('user_entries', entryId);
        if (!entry) {
            entry = await this.db.getEntry('char_entries', entryId);
        }
        return entry;
    }

    getDeepMemories(options = {}) {
        const deepMemories = [];
        const minEmphasis = options.minEmphasis || 2;
        const minWeight = options.minWeight || 0.7;

        for (const [entryId, node] of this.linkGraph) {
            if (node.weight >= minWeight || (node.emphasisCount || 0) >= minEmphasis) {
                deepMemories.push({
                    entryId,
                    weight: node.weight,
                    emphasisCount: node.emphasisCount || 0,
                    dislikeMarked: node.dislikeMarked,
                    importantMarked: node.importantMarked,
                    emotionalWeight: node.emotionalWeight || 0
                });
            }
        }

        return deepMemories.sort((a, b) => b.weight - a.weight);
    }

    getEmotionalMemories(type = 'all') {
        const memories = [];

        for (const [entryId, node] of this.linkGraph) {
            if (type === 'dislike' && node.dislikeMarked) {
                memories.push({ entryId, type: 'dislike', weight: node.weight });
            }
            if (type === 'important' && node.importantMarked) {
                memories.push({ entryId, type: 'important', weight: node.weight });
            }
            if (type === 'all' && (node.dislikeMarked || node.importantMarked || node.emotionalWeight > 0.5)) {
                memories.push({
                    entryId,
                    type: node.dislikeMarked ? 'dislike' : 'important',
                    weight: node.weight,
                    emotionalWeight: node.emotionalWeight
                });
            }
        }

        return memories.sort((a, b) => b.weight - a.weight);
    }

    getMemoryDepth(entryId) {
        const node = this.linkGraph.get(entryId);
        if (!node) return null;

        return {
            entryId,
            weight: node.weight,
            emphasisCount: node.emphasisCount || 0,
            emphasisHistory: node.emphasisHistory || [],
            dislikeMarked: node.dislikeMarked || false,
            dislikeCount: node.dislikeCount || 0,
            importantMarked: node.importantMarked || false,
            importantLevel: node.importantLevel || 0,
            emotionalWeight: node.emotionalWeight || 0,
            reinforcementCount: node.reinforcementCount || 0,
            depth: this._calculateMemoryDepth(node)
        };
    }

    _calculateMemoryDepth(node) {
        let depth = 0;

        depth += (node.weight || 0.5) * 30;

        depth += Math.min((node.emphasisCount || 0) * 10, 30);

        if (node.dislikeMarked) depth += 20;
        if (node.importantMarked) depth += 15;

        depth += (node.emotionalWeight || 0) * 20;

        depth += Math.min((node.reinforcementCount || 0) * 5, 15);

        return Math.min(100, Math.round(depth));
    }

    async recall(query, options = {}) {
        const keywords = this._extractKeywords(query);
        const results = new Map();

        for (const kw of keywords) {
            const matches = this.keywordIndex.get(kw) || [];
            for (const match of matches) {
                const existing = results.get(match.entryId);
                const score = match.weight * (1 + 0.1 * keywords.indexOf(kw));

                if (!existing || score > existing.score) {
                    results.set(match.entryId, {
                        entryId: match.entryId,
                        score: score,
                        matchedKeywords: existing ? [...existing.matchedKeywords, kw] : [kw],
                        charId: match.charId,
                        category: match.category
                    });
                }
            }
        }

        const sorted = [...results.values()].sort((a, b) => b.score - a.score);
        const topResults = sorted.slice(0, options.limit || 10);

        const spreadResults = await this._spreadActivation(
            topResults.map(r => r.entryId),
            options.spreadDepth || 2
        );

        for (const spread of spreadResults) {
            if (!results.has(spread.entryId)) {
                results.set(spread.entryId, spread);
            }
        }

        const finalResults = [...results.values()]
            .sort((a, b) => b.score - a.score)
            .slice(0, options.limit || 15);

        await this._updateAccess(finalResults.map(r => r.entryId));

        return finalResults;
    }

    async _spreadActivation(entryIds, depth = 2) {
        const results = [];
        const visited = new Set(entryIds);
        let currentLevel = [...entryIds];
        let currentDepth = 0;

        while (currentDepth < depth && currentLevel.length > 0) {
            const nextLevel = [];

            for (const entryId of currentLevel) {
                const node = this.linkGraph.get(entryId);
                if (!node) continue;

                for (const link of node.outgoing) {
                    if (visited.has(link.targetId)) continue;

                    visited.add(link.targetId);
                    nextLevel.push(link.targetId);

                    const spreadWeight = link.weight * Math.pow(this.config.spreadDecay, currentDepth + 1);

                    results.push({
                        entryId: link.targetId,
                        score: spreadWeight,
                        spreadDepth: currentDepth + 1,
                        spreadFrom: entryId
                    });
                }

                for (const link of node.incoming) {
                    if (visited.has(link.sourceId)) continue;

                    visited.add(link.sourceId);
                    nextLevel.push(link.sourceId);

                    const spreadWeight = link.weight * Math.pow(this.config.spreadDecay, currentDepth + 1) * 0.8;

                    results.push({
                        entryId: link.sourceId,
                        score: spreadWeight,
                        spreadDepth: currentDepth + 1,
                        spreadFrom: entryId
                    });
                }
            }

            currentLevel = nextLevel;
            currentDepth++;
        }

        return results;
    }

    async _updateAccess(entryIds) {
        for (const entryId of entryIds) {
            try {
                const isUserEntry = await this.db.getEntry('user_entries', entryId);
                const storeName = isUserEntry ? 'user_entries' : 'char_entries';
                const entry = await this.db.getEntry(storeName, entryId);

                if (entry) {
                    await this.db.updateEntry(storeName, {
                        ...entry,
                        lastAccessed: new Date().toISOString(),
                        accessCount: (entry.accessCount || 0) + 1
                    });
                }
            } catch (e) {}
        }
    }

    async getEntryWithLinks(entryId) {
        const userEntry = await this.db.getEntry('user_entries', entryId);
        const charEntry = await this.db.getEntry('char_entries', entryId);
        const entry = userEntry || charEntry;

        if (!entry) return null;

        const storeName = userEntry ? 'user_entries' : 'char_entries';
        const linkedEntries = [];

        for (const linkedId of entry.linkedMemories || []) {
            const linked = await this.db.getEntry('user_entries', linkedId) ||
                          await this.db.getEntry('char_entries', linkedId);
            if (linked) {
                linkedEntries.push({
                    id: linked.id,
                    title: linked.title,
                    weight: this._calculateEntryWeight(linked),
                    category: linked.category
                });
            }
        }

        const backLinks = [];
        const node = this.linkGraph.get(entryId);
        if (node) {
            for (const link of node.incoming) {
                const source = await this.db.getEntry('user_entries', link.sourceId) ||
                              await this.db.getEntry('char_entries', link.sourceId);
                if (source) {
                    backLinks.push({
                        id: source.id,
                        title: source.title,
                        weight: link.weight,
                        category: source.category
                    });
                }
            }
        }

        return {
            ...entry,
            weight: this._calculateEntryWeight(entry),
            linkedEntries,
            backLinks,
            extendedLinks: await this._getExtendedLinks(entryId, 2)
        };
    }

    async _getExtendedLinks(entryId, depth = 2) {
        const extended = [];
        const visited = new Set([entryId]);
        let currentLevel = [entryId];
        let currentDepth = 0;

        while (currentDepth < depth && currentLevel.length > 0) {
            const nextLevel = [];

            for (const id of currentLevel) {
                const node = this.linkGraph.get(id);
                if (!node) continue;

                for (const link of node.outgoing) {
                    if (visited.has(link.targetId)) continue;
                    visited.add(link.targetId);
                    nextLevel.push(link.targetId);

                    const entry = await this.db.getEntry('user_entries', link.targetId) ||
                                 await this.db.getEntry('char_entries', link.targetId);

                    if (entry) {
                        extended.push({
                            id: entry.id,
                            title: entry.title,
                            depth: currentDepth + 1,
                            weight: link.weight * Math.pow(0.7, currentDepth),
                            path: `${id} -> ${link.targetId}`
                        });
                    }
                }
            }

            currentLevel = nextLevel;
            currentDepth++;
        }

        return extended.slice(0, 10);
    }

    async think(query, options = {}) {
        console.log(`[WikiEngine] 思考: "${query}"`);

        const recallResults = await this.recall(query, { limit: 5, spreadDepth: 2 });

        const thinkingProcess = {
            query,
            keywords: this._extractKeywords(query),
            directMatches: [],
            associations: [],
            extendedThoughts: [],
            summary: null
        };

        for (const result of recallResults.slice(0, 5)) {
            const entry = await this.db.getEntry('user_entries', result.entryId) ||
                         await this.db.getEntry('char_entries', result.entryId);

            if (entry) {
                thinkingProcess.directMatches.push({
                    id: entry.id,
                    title: entry.title,
                    content: entry.content?.substring(0, 200),
                    weight: result.score,
                    matchedKeywords: result.matchedKeywords,
                    category: entry.category
                });
            }
        }

        for (const result of recallResults.filter(r => r.spreadDepth)) {
            const entry = await this.db.getEntry('user_entries', result.entryId) ||
                         await this.db.getEntry('char_entries', result.entryId);

            if (entry) {
                thinkingProcess.associations.push({
                    id: entry.id,
                    title: entry.title,
                    weight: result.score,
                    spreadDepth: result.spreadDepth,
                    spreadFrom: result.spreadFrom
                });
            }
        }

        for (const match of thinkingProcess.directMatches.slice(0, 3)) {
            const extended = await this._getExtendedLinks(match.id, 1);
            thinkingProcess.extendedThoughts.push(...extended);
        }

        thinkingProcess.summary = this._generateThinkingSummary(thinkingProcess);

        return thinkingProcess;
    }

    _generateThinkingSummary(process) {
        const parts = [];

        if (process.directMatches.length > 0) {
            const titles = process.directMatches.map(m => m.title).join('、');
            parts.push(`直接相關: ${titles}`);
        }

        if (process.associations.length > 0) {
            parts.push(`聯想到 ${process.associations.length} 條相關記憶`);
        }

        if (process.extendedThoughts.length > 0) {
            parts.push(`延伸思考 ${process.extendedThoughts.length} 條路徑`);
        }

        return {
            text: parts.join('。'),
            stats: {
                directCount: process.directMatches.length,
                associationCount: process.associations.length,
                extendedCount: process.extendedThoughts.length,
                totalKeywords: process.keywords.length
            }
        };
    }

    async updateEntryWeight(entryId, delta = 0.1) {
        const entry = await this.db.getEntry('user_entries', entryId) ||
                     await this.db.getEntry('char_entries', entryId);

        if (!entry) return;

        const storeName = (await this.db.getEntry('user_entries', entryId)) ? 'user_entries' : 'char_entries';
        const currentWeight = entry.weight || this._calculateEntryWeight(entry);
        const newWeight = Math.max(this.config.minActivation, 
                                   Math.min(this.config.maxActivation, currentWeight + delta));

        await this.db.updateEntry(storeName, {
            ...entry,
            weight: newWeight,
            lastAccessed: new Date().toISOString()
        });

        await this._buildKeywordIndex();
    }

    async reinforceEntry(entryId) {
        await this.updateEntryWeight(entryId, this.config.activationBoost);
        console.log(`[WikiEngine] 強化條目: ${entryId}`);
    }

    async decayEntry(entryId) {
        await this.updateEntryWeight(entryId, -this.config.weightDecayRate);
        console.log(`[WikiEngine] 衰減條目: ${entryId}`);
    }

    getKeywordStats() {
        const stats = {
            totalKeywords: this.keywordIndex.size,
            topKeywords: [],
            categoryDistribution: {}
        };

        const sorted = [...this.keywordIndex.entries()]
            .sort((a, b) => b[1].length - a[1].length)
            .slice(0, 20);

        stats.topKeywords = sorted.map(([kw, entries]) => ({
            keyword: kw,
            count: entries.length,
            avgWeight: entries.reduce((sum, e) => sum + e.weight, 0) / entries.length
        }));

        return stats;
    }

    getLinkStats() {
        const stats = {
            totalNodes: this.linkGraph.size,
            totalLinks: 0,
            avgLinks: 0,
            mostConnected: []
        };

        const connectionCounts = [];
        for (const [id, node] of this.linkGraph) {
            const count = node.outgoing.length + node.incoming.length;
            stats.totalLinks += node.outgoing.length;
            connectionCounts.push({ id, count });
        }

        stats.avgLinks = stats.totalLinks / stats.totalNodes || 0;
        stats.mostConnected = connectionCounts
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        return stats;
    }

    async ingest(source, options = {}) {
        const entry = await this._processSource(source, options);
        
        await this._updateRelatedEntries(entry);
        
        await this._updateIndex(entry);
        
        await this._appendLog('ingest', entry.title, entry.id);
        
        return entry;
    }

    async _processSource(source, options) {
        const entry = {
            id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: source.title || '未命名條目',
            content: source.content || '',
            category: source.category || 'important',
            tags: source.tags || [],
            linkedMemories: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            source: source.source || 'manual',
            metadata: {
                importance: source.importance || 5,
                type: source.type || 'dynamic',
                ...source.metadata
            }
        };

        if (source.charId) {
            entry.charId = source.charId;
        }

        const keywords = this._extractKeywords(entry.content);
        entry.keywords = keywords;

        const entities = this._extractEntities(entry.content);
        entry.entities = entities;

        return entry;
    }

    _extractKeywords(text) {
        if (!text) return [];
        
        const stopWords = new Set([
            '的', '是', '在', '了', '和', '有', '我', '你', '他', '她', '它', '們',
            '這', '那', '就', '也', '都', '會', '能', '要', '可以', '一個', '什麼',
            '怎麼', '為什麼', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be',
            'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
            'would', 'could', 'should', 'may', 'might', 'must'
        ]);

        const chineseWords = text.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
        const englishWords = text.toLowerCase().match(/[a-z]{3,}/g) || [];

        const wordFreq = new Map();
        for (const word of [...chineseWords, ...englishWords]) {
            if (stopWords.has(word)) continue;
            wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
        }

        const sorted = [...wordFreq.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([word]) => word);

        return sorted;
    }

    _extractEntities(text) {
        if (!text) return [];
        
        const entities = [];
        
        const personPattern = /([A-Z][a-z]+|[一-龥]{2,4})(?=\s*(?:說|問|想|覺得|告訴|提到))/g;
        const persons = text.match(personPattern) || [];
        persons.forEach(p => {
            if (!entities.find(e => e.name === p)) {
                entities.push({ name: p, type: 'person' });
            }
        });

        const datePattern = /(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日]?|\d{1,2}[-/]\d{1,2})/g;
        const dates = text.match(datePattern) || [];
        dates.forEach(d => {
            entities.push({ name: d, type: 'date' });
        });

        const locationPattern = /在([一-龥]{2,6})/g;
        let match;
        while ((match = locationPattern.exec(text)) !== null) {
            entities.push({ name: match[1], type: 'location' });
        }

        return entities;
    }

    async _updateRelatedEntries(newEntry) {
        if (!this.config.enableAutoLink) return;

        const storeName = newEntry.charId ? 'char_entries' : 'user_entries';
        let allEntries = await this.db.getAllEntries(storeName);
        
        if (newEntry.charId) {
            allEntries = allEntries.filter(e => e.charId === newEntry.charId);
        }

        const relatedEntries = [];
        
        for (const entry of allEntries) {
            if (entry.id === newEntry.id) continue;
            
            const similarity = this._calculateSimilarity(newEntry, entry);
            
            if (similarity >= this.config.linkThreshold) {
                relatedEntries.push({
                    id: entry.id,
                    title: entry.title,
                    similarity
                });
            }
        }

        if (relatedEntries.length > 0) {
            newEntry.linkedMemories = relatedEntries
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, 5)
                .map(r => r.id);
        }
    }

    _calculateSimilarity(entry1, entry2) {
        let score = 0;

        const keywords1 = new Set(entry1.keywords || []);
        const keywords2 = new Set(entry2.keywords || []);
        const keywordOverlap = [...keywords1].filter(k => keywords2.has(k)).length;
        const keywordScore = keywordOverlap / Math.max(keywords1.size, keywords2.size, 1);
        score += keywordScore * 0.4;

        const tags1 = new Set(entry1.tags || []);
        const tags2 = new Set(entry2.tags || []);
        const tagOverlap = [...tags1].filter(t => tags2.has(t)).length;
        const tagScore = tagOverlap / Math.max(tags1.size, tags2.size, 1);
        score += tagScore * 0.3;

        if (entry1.category === entry2.category) {
            score += 0.2;
        }

        const entities1 = entry1.entities || [];
        const entities2 = entry2.entities || [];
        const entityOverlap = entities1.filter(e1 => 
            entities2.some(e2 => e2.name === e1.name)
        ).length;
        const entityScore = entityOverlap / Math.max(entities1.length, entities2.length, 1);
        score += entityScore * 0.1;

        return score;
    }

    async _updateIndex(entry) {
        const indexKey = entry.charId ? `char_index_${entry.charId}` : 'user_index';
        
        let index = [];
        try {
            const stored = localStorage.getItem(`sx_wiki_${indexKey}`);
            if (stored) index = JSON.parse(stored);
        } catch (e) {}

        const existingIdx = index.findIndex(i => i.id === entry.id);
        const indexEntry = {
            id: entry.id,
            title: entry.title,
            category: entry.category,
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt
        };

        if (existingIdx >= 0) {
            index[existingIdx] = indexEntry;
        } else {
            index.unshift(indexEntry);
        }

        if (index.length > this.config.maxIndexSize) {
            index = index.slice(0, this.config.maxIndexSize);
        }

        localStorage.setItem(`sx_wiki_${indexKey}`, JSON.stringify(index));
    }

    async _appendLog(action, detail, entryId) {
        await this.db.addLog({
            action,
            detail,
            entryId
        });
    }

    async query(queryText, options = {}) {
        const storeName = options.charId ? 'char_entries' : 'user_entries';
        let entries = await this.db.getAllEntries(storeName);
        
        if (options.charId) {
            entries = entries.filter(e => e.charId === options.charId);
        }

        const queryKeywords = this._extractKeywords(queryText);
        const queryEntities = this._extractEntities(queryText);

        const results = entries.map(entry => {
            let score = 0;

            const titleMatch = entry.title.toLowerCase().includes(queryText.toLowerCase());
            if (titleMatch) score += 0.5;

            const contentMatch = entry.content?.toLowerCase().includes(queryText.toLowerCase());
            if (contentMatch) score += 0.3;

            const keywordMatches = queryKeywords.filter(k => 
                entry.keywords?.includes(k)
            ).length;
            score += (keywordMatches / Math.max(queryKeywords.length, 1)) * 0.15;

            const tagMatches = queryKeywords.filter(k => 
                entry.tags?.includes(k)
            ).length;
            score += (tagMatches / Math.max(queryKeywords.length, 1)) * 0.05;

            return { ...entry, score };
        });

        return results
            .filter(r => r.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, options.limit || 10);
    }

    async lint() {
        const issues = [];
        
        const userEntries = await this.db.getAllEntries('user_entries');
        const charEntries = await this.db.getAllEntries('char_entries');
        const allEntries = [...userEntries, ...charEntries];

        const titleCount = new Map();
        allEntries.forEach(entry => {
            const count = titleCount.get(entry.title) || 0;
            titleCount.set(entry.title, count + 1);
        });
        
        titleCount.forEach((count, title) => {
            if (count > 1) {
                issues.push({
                    type: 'duplicate_title',
                    severity: 'warning',
                    message: `重複標題: "${title}" (${count} 次)`
                });
            }
        });

        const orphanEntries = allEntries.filter(entry => 
            !entry.linkedMemories || entry.linkedMemories.length === 0
        );
        if (orphanEntries.length > 0) {
            issues.push({
                type: 'orphan_entries',
                severity: 'info',
                message: `孤立條目: ${orphanEntries.length} 個條目沒有關聯`
            });
        }

        const entriesWithoutTags = allEntries.filter(entry => 
            !entry.tags || entry.tags.length === 0
        );
        if (entriesWithoutTags.length > 0) {
            issues.push({
                type: 'missing_tags',
                severity: 'info',
                message: `缺少標籤: ${entriesWithoutTags.length} 個條目`
            });
        }

        return issues;
    }

    renderGraph(container, entries) {
        if (!container) return;

        const nodes = entries.map((entry, index) => ({
            id: entry.id,
            title: entry.title,
            category: entry.category,
            x: Math.random() * container.clientWidth,
            y: Math.random() * container.clientHeight,
            vx: 0,
            vy: 0
        }));

        const links = [];
        entries.forEach(entry => {
            if (entry.linkedMemories) {
                entry.linkedMemories.forEach(linkedId => {
                    links.push({
                        source: entry.id,
                        target: linkedId
                    });
                });
            }
        });

        this._renderForceGraph(container, nodes, links);
    }

    _renderForceGraph(container, nodes, links) {
        const canvas = document.createElement('canvas');
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        container.innerHTML = '';
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        const categoryColors = {
            'important': '#6366f1',
            'people': '#22c55e',
            'events': '#f59e0b',
            'insights': '#ec4899',
            'user-memories': '#ec4899',
            'conversations': '#8b5cf6',
            'npc': '#14b8a6',
            'world': '#f97316',
            'daily': '#06b6d4'
        };

        const simulate = () => {
            nodes.forEach(node => {
                nodes.forEach(other => {
                    if (node.id === other.id) return;
                    
                    const dx = node.x - other.x;
                    const dy = node.y - other.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    
                    const force = 1000 / (dist * dist);
                    node.vx += (dx / dist) * force;
                    node.vy += (dy / dist) * force;
                });
            });

            links.forEach(link => {
                const source = nodes.find(n => n.id === link.source);
                const target = nodes.find(n => n.id === link.target);
                if (!source || !target) return;

                const dx = target.x - source.x;
                const dy = target.y - source.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;

                const force = (dist - 100) * 0.01;
                source.vx += (dx / dist) * force;
                source.vy += (dy / dist) * force;
                target.vx -= (dx / dist) * force;
                target.vy -= (dy / dist) * force;
            });

            nodes.forEach(node => {
                node.x += node.vx * 0.1;
                node.y += node.vy * 0.1;
                node.vx *= 0.9;
                node.vy *= 0.9;

                node.x = Math.max(30, Math.min(width - 30, node.x));
                node.y = Math.max(30, Math.min(height - 30, node.y));
            });
        };

        const draw = () => {
            ctx.clearRect(0, 0, width, height);

            ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
            ctx.lineWidth = 1;
            links.forEach(link => {
                const source = nodes.find(n => n.id === link.source);
                const target = nodes.find(n => n.id === link.target);
                if (!source || !target) return;

                ctx.beginPath();
                ctx.moveTo(source.x, source.y);
                ctx.lineTo(target.x, target.y);
                ctx.stroke();
            });

            nodes.forEach(node => {
                const color = categoryColors[node.category] || '#6366f1';
                
                ctx.beginPath();
                ctx.arc(node.x, node.y, 20, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();

                ctx.fillStyle = '#ffffff';
                ctx.font = '10px SF Pro Display';
                ctx.textAlign = 'center';
                ctx.fillText(
                    node.title.substring(0, 6) + (node.title.length > 6 ? '...' : ''),
                    node.x,
                    node.y + 35
                );
            });
        };

        const animate = () => {
            simulate();
            draw();
            requestAnimationFrame(animate);
        };

        animate();
    }

    zoomIn() {
        this.zoomLevel = Math.min(this.zoomLevel * 1.2, 3);
    }

    zoomOut() {
        this.zoomLevel = Math.max(this.zoomLevel / 1.2, 0.3);
    }

    resetGraph() {
        this.zoomLevel = 1;
        this.panOffset = { x: 0, y: 0 };
    }

    async syncWithMemorySystem(unifiedMemory, type = 'user', charId = null) {
        if (!unifiedMemory) return;

        try {
            const result = await unifiedMemory.recall('', { limit: 20 });
            
            if (result.memories && result.memories.length > 0) {
                for (const mem of result.memories) {
                    const entry = {
                        title: mem.content?.substring(0, 50) || '記憶同步',
                        content: mem.content,
                        category: 'important',
                        tags: mem.tags || [],
                        source: 'memory_sync',
                        memoryId: mem.id,
                        importance: mem.importance || 5,
                        emotion: mem.emotion
                    };

                    if (type === 'char' && charId) {
                        entry.charId = charId;
                    }

                    await this.ingest(entry);
                }
            }

            console.log('[WikiEngine] 同步記憶系統完成');
        } catch (e) {
            console.error('[WikiEngine] 同步失敗:', e);
        }
    }

    async exportWiki(type = 'user', charId = null) {
        const storeName = type === 'user' ? 'user_entries' : 'char_entries';
        let entries = await this.db.getAllEntries(storeName);
        
        if (charId) {
            entries = entries.filter(e => e.charId === charId);
        }

        const exportData = {
            version: 1,
            exportedAt: new Date().toISOString(),
            type,
            charId,
            entries,
            stats: {
                totalEntries: entries.length,
                categories: this._countByCategory(entries)
            }
        };

        return exportData;
    }

    _countByCategory(entries) {
        const counts = {};
        entries.forEach(entry => {
            const cat = entry.category || 'uncategorized';
            counts[cat] = (counts[cat] || 0) + 1;
        });
        return counts;
    }

    async importWiki(data, options = {}) {
        if (!data || !data.entries) return { success: false, reason: 'invalid_data' };

        const storeName = data.type === 'user' ? 'user_entries' : 'char_entries';
        let imported = 0;

        for (const entry of data.entries) {
            try {
                entry.id = `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                entry.importedAt = new Date().toISOString();
                
                if (options.charId) {
                    entry.charId = options.charId;
                }

                await this.db.addEntry(storeName, entry);
                imported++;
            } catch (e) {
                console.warn('[WikiEngine] 導入條目失敗:', e);
            }
        }

        await this._appendLog('import', `導入 ${imported} 個條目`);

        return { success: true, imported };
    }

    async generateSummary(type = 'user', charId = null) {
        const storeName = type === 'user' ? 'user_entries' : 'char_entries';
        let entries = await this.db.getAllEntries(storeName);
        
        if (charId) {
            entries = entries.filter(e => e.charId === charId);
        }

        const summary = {
            totalEntries: entries.length,
            categories: this._countByCategory(entries),
            recentActivity: entries
                .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                .slice(0, 5)
                .map(e => ({ id: e.id, title: e.title, updatedAt: e.updatedAt })),
            topKeywords: this._getTopKeywords(entries),
            topEntities: this._getTopEntities(entries)
        };

        return summary;
    }

    _getTopKeywords(entries) {
        const keywordCount = new Map();
        entries.forEach(entry => {
            (entry.keywords || []).forEach(kw => {
                keywordCount.set(kw, (keywordCount.get(kw) || 0) + 1);
            });
        });

        return [...keywordCount.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([keyword, count]) => ({ keyword, count }));
    }

    _getTopEntities(entries) {
        const entityCount = new Map();
        entries.forEach(entry => {
            (entry.entities || []).forEach(entity => {
                const key = `${entity.type}:${entity.name}`;
                entityCount.set(key, (entityCount.get(key) || 0) + 1);
            });
        });

        return [...entityCount.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([key, count]) => {
                const [type, name] = key.split(':');
                return { type, name, count };
            });
    }
}

if (typeof window !== 'undefined') {
    window.WikiEngine = WikiEngine;
}
