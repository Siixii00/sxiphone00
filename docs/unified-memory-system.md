# 統一記憶系統架構

## 系統概述

統一記憶系統整合了所有記憶相關的子系統，提供單一入口點讓任何應用程式都能調用同一套記憶邏輯。

## 架構圖

```
┌─────────────────────────────────────────────────────────────────┐
│                    UnifiedMemorySystem                          │
│                      (統一記憶系統)                               │
├─────────────────────────────────────────────────────────────────┤
│  setIdentity() / getIdentity()  ← 身份管理                       │
│  recall(query)                  ← 統一回憶入口                   │
│  memorize(content)              ← 統一記憶入口                   │
│  forget(id)                     ← 統一遺忘入口                   │
│  sleep() / awaken()             ← 休眠/喚醒                      │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ↓                     ↓                     ↓
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  MemoryPool   │    │ ShortTerm     │    │  LongTerm     │
│  (記憶池)      │    │ Memory        │    │  Memory       │
│               │    │ (短期記憶)     │    │  (長期記憶)    │
│ 認知模型架構   │    │               │    │               │
│ - 前提層      │    │ - 時間衰減    │    │ - 向量化      │
│ - 感知層      │    │ - 容量限制    │    │ - 永久儲存    │
│ - 空間層      │    │ - 重要性過濾  │    │ - 情感標記    │
│ - 時間層      │    │               │    │ - 分類索引    │
└───────────────┘    └───────────────┘    └───────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    DecayEngine (遺忘曲線引擎)                    │
│  - Ebbinghaus 遺忘曲線                                          │
│  - 重要性權重                                                   │
│  - 情感強度保護                                                 │
│  - 強化次數保護                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    SearchEngine (搜尋引擎)                       │
│  - 關鍵詞搜尋 (Fuse.js)                                         │
│  - 向量語義搜尋                                                 │
│  - 綜合評分排序                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 記憶池認知模型

```
┌─────────────────────────────────────┐
│  前提層（存在錨點）                    │
│  觸發條件：對話發生                    │
│  性質：自動成立，無需權重               │
└─────────────────┬───────────────────┘
                  ↓
┌─────────────────────────────────────┐
│  感知層（主權重層）                    │
│  五感描述展開                         │
│  嗅覺(1.0)／觸覺(0.95)最強觸發索引     │
│  視覺(0.7)／聽覺(0.6)／味覺(0.85)     │
└─────────────────┬───────────────────┘
                  ↓
┌─────────────────────────────────────┐
│  空間層                               │
│  環境描述，從感知向外擴展              │
└─────────────────┬───────────────────┘
                  ↓
┌─────────────────────────────────────┐
│  時間層（最抽象，最後定位）             │
│  時間標記，情緒染色                    │
└─────────────────────────────────────┘
```

## 遺忘曲線計算

```javascript
// 遺忘分數計算公式
score = importance * 
        Math.pow(activationCount, 0.3) *
        Math.exp(-lambda * daysSinceActive) *
        combinedWeight *
        freshness *
        reinforcementFactor *
        strengthFactor;

// 保護機制
- 強化次數保護: 1 + min(reinforcementCount * 0.15, 1.5)
- 記憶強度保護: 0.5 + memoryStrength * 0.5
- 情感強度加成: 1.0 + arousal * 0.8
- 固定記憶保護: pinned = 999.0
- 永久記憶保護: permanent >= 100.0
- 感受記憶保護: feel >= 50.0
```

## API 使用方式

### 1. 在應用程式中使用

```javascript
// 方式一：使用 MemoryHelper（推薦）
const result = await MemoryHelper.recall('用戶提到的關鍵詞');
console.log(result.memories);    // 相關記憶
console.log(result.context);     // 上下文摘要
console.log(result.identity);    // AI 身份

// 方式二：直接使用 postMessage
window.parent?.postMessage({
    type: 'UNIFIED_MEMORY_RECALL',
    payload: { query: '搜尋內容', options: { limit: 10 } }
}, '*');

// 方式三：直接訪問全域物件
const um = window.unifiedMemory;
if (um && um.isInitialized) {
    const result = await um.recall('搜尋內容');
}
```

### 2. 記憶儲存

```javascript
// 自動儲存（透過 MEMORY_CHAT_EVENT）
window.parent?.postMessage({
    type: 'MEMORY_CHAT_EVENT',
    payload: {
        content: '用戶說的內容',
        role: 'user',
        importance: 7,
        emotion: { valence: 0.8, arousal: 0.6 }
    }
}, '*');

// 手動儲存
await MemoryHelper.memorize('重要內容', {
    importance: 8,
    tags: ['重要', '約定'],
    emotion: { valence: 0.9, arousal: 0.5 }
});
```

### 3. 設置 AI 身份

```javascript
// 當用戶開始對話時，設置身份
MemoryHelper.setIdentity({
    name: '角色名稱',
    type: 'companion',
    personality: '溫柔體貼'
});

// 系統會自動：
// 1. 記住自己的身份
// 2. 在 recall 時返回身份資訊
// 3. 在記憶池設置前提層
```

### 4. 觸發切換機制

```javascript
// 當調用 recall 時，系統會：
// 1. 檢查記憶池的感知觸發
// 2. 執行搜尋引擎檢索
// 3. 獲取短期記憶
// 4. 檢查是否需要喚醒
// 5. 返回綜合結果

const result = await MemoryHelper.recall('咖啡的味道');

// result 包含：
// - memories: 相關記憶列表
// - shortTerm: 短期記憶
// - pool: 記憶池匹配結果
// - context: 上下文摘要
// - identity: AI 身份
```

## 事件列表

| 事件名稱 | 方向 | 說明 |
|---------|------|------|
| `UNIFIED_MEMORY_RECALL` | App → Main | 請求回憶 |
| `UNIFIED_MEMORY_RECALL_RESULT` | Main → App | 回憶結果 |
| `UNIFIED_MEMORY_MEMORIZE` | App → Main | 請求記憶 |
| `UNIFIED_MEMORY_MEMORIZE_RESULT` | Main → App | 記憶結果 |
| `UNIFIED_MEMORY_FORGET` | App → Main | 請求遺忘 |
| `UNIFIED_MEMORY_SLEEP` | App → Main | 觸發休眠 |
| `UNIFIED_MEMORY_AWAKEN` | App → Main | 觸發喚醒 |
| `UNIFIED_MEMORY_SET_IDENTITY` | App → Main | 設置身份 |
| `UNIFIED_MEMORY_GET_STATS` | App → Main | 獲取狀態 |
| `MEMORY_CHAT_EVENT` | App → Main | 聊天事件（自動記憶） |

## 檔案結構

```
apps/scripts/
├── unified-memory-system.js  # 統一記憶系統主體
├── memory-pool.js            # 記憶池（認知模型）
├── short-term-memory.js      # 短期記憶
├── memory-manager.js         # 長期記憶管理
├── memory-store.js           # IndexedDB 儲存
├── embedding-engine.js       # 向量化引擎
├── search-engine.js          # 搜尋引擎
├── decay-engine.js           # 遺忘曲線引擎
├── emotion-tagger.js         # 情感標記
├── memory-classifier.js      # 記憶分類
├── sleep-engine.js           # 休眠引擎
├── awakening-engine.js       # 喚醒引擎
└── memory-helper.js          # 應用程式輔助工具
```

## 初始化流程

```
1. 頁面載入
   ↓
2. initUnifiedMemorySystem()
   ↓
3. 初始化各子系統
   ├── MemoryStore (IndexedDB)
   ├── EmbeddingEngine (向量化)
   ├── DecayEngine (遺忘曲線)
   ├── SearchEngine (搜尋)
   ├── EmotionTagger (情感)
   ├── MemoryClassifier (分類)
   ├── ShortTermMemory (短期)
   ├── MemoryPool (記憶池)
   ├── AwakeningEngine (喚醒)
   └── SleepEngine (休眠)
   ↓
4. 載入身份
   ↓
5. 檢查喚醒狀態
   ↓
6. 系統就緒
```

## 注意事項

1. **統一入口**: 所有記憶操作都應透過 `UnifiedMemorySystem` 或 `MemoryHelper`
2. **自動整合**: `MEMORY_CHAT_EVENT` 會自動寫入所有子系統
3. **身份管理**: 系統啟動時會自動設置身份，確保 AI 知道自己是誰
4. **降級處理**: 如果統一系統初始化失敗，會自動降級到舊系統
5. **跨應用共享**: 所有應用程式共享同一個記憶系統實例
