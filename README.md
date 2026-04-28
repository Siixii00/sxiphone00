# Sxiphone

一個以網頁技術實現的仿 iOS 介面應用程式，提供豐富的互動功能和角色扮演體驗。

## 前排致謝

Linux.do站、旅程、類腦、堆堆、尾巴鎮、喵喵電波的所有大佬，謝謝你們的貢獻和經驗分享，讓這個網頁端應用程式得以成功製作完成。
感謝製作開源資料的製作者，感謝所有的小手機使用者，感謝過程裡參與測試的人員，感謝所有願意給予回饋和等待的人。
特別感謝SullyOS的製作者對於記憶系統的指導、電波系老師開放內建使用了打磨無數次的象牙塔、月讀預設，以及小回老師開放內建使用蛾摩拉小說體特化的預設。

## 專案簡介

Sxiphone 是一個模擬手機介面的網頁應用程式，使用純前端技術（HTML、CSS、JavaScript）開發，無需後端即可運行。專案採用模組化設計，每個應用程式都是獨立的元件，方便擴展和維護。
本開源專案開放二改，但需附上原Readme連結，如需傳播給朋友可直接貼上本專案Github網址；本專案開發者僅保留署名權。

**開發工具**：Gemini、VS Code  
**使用模型**：Gemini 3、Claude Sonnet 4.5、Gpt-5.2-codex、Gpt-5.3-codex、Gpt-5.4、Glm-5、Glm-5.1、Minimax-m2.5、Kimi-k-2.5

**輔助插件**：Roo code、Cline、Kilo code、Unify chat Provider、Live server  
**目前狀態**：持續開發中

---

## 開源資料庫與依賴

### CDN 資源

#### Firebase（即時資料庫）
```html
<script src="https://www.gstatic.com/firebasejs/9.17.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.17.1/firebase-database-compat.js"></script>
```
- **用途**：即時資料同步、雲端儲存
- **官網**：https://firebase.google.com/

#### Transformers.js（瀏覽器端機器學習）
```javascript
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1';
```
- **用途**：本地語音辨識（Whisper）、文字向量化嵌入
- **GitHub**：https://github.com/xenova/transformers.js

#### LocalForage（增強型本地儲存）
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/localforage/1.10.0/localforage.min.js"></script>
```
- **用途**：IndexedDB/LocalStorage 統一介面、大容量本地儲存
- **GitHub**：https://github.com/localForage/localForage

#### Google Fonts
```html
<link href="https://fonts.googleapis.com/css2?family=SF+Pro+Display:wght@200;400;600&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,500,0,0" rel="stylesheet">
```

#### Font Awesome（圖示庫）
```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
```
- **官網**：https://fontawesome.com/

#### Lucide Icons（圖示庫）
```html
<script src="https://unpkg.com/lucide@latest"></script>
```
- **官網**：https://lucide.dev/

### npm 套件

| 套件 | 版本 | 用途 | 連結 |
|------|------|------|------|
| `vite` | ^8.0.5 | 前端建置工具 | [官網](https://vitejs.dev/) |
| `canvas` | ^3.2.3 | 圖像處理 | [npm](https://www.npmjs.com/package/canvas) |
| `fortel-ziweidoushu` | ^1.3.4 | 紫微斗數計算 | [npm](https://www.npmjs.com/package/fortel-ziweidoushu) |
| `lunar-ts` | ^1.0.1 | 農曆計算 | [npm](https://www.npmjs.com/package/lunar-ts) |

---

## 功能特色

### 核心功能

- **仿 iOS 介面**：高度還原 iOS 的視覺設計和互動體驗
- **多應用程式支援**：內建 50+ 個應用程式
- **角色扮演系統**：可自訂角色設定，進行沉浸式對話
- **三維記憶系統**：支援五感提取、時空標註、情感標記的立體記憶
- **個人維基**：圖像式記憶庫，支援知識圖譜與擴散激活檢索
- **本地儲存**：所有資料儲存於瀏覽器 localStorage，無需登入
- **藍牙連接**：支援 Web Bluetooth API，可連接藍牙裝置
- **PWA 支援**：可安裝到桌面，支援離線使用

---

## 應用程式清單

### 通訊類應用

#### 聊天（Chat）
- 即時訊息對話，支援多角色切換
- 表情符號、貼圖、圖片發送與 AI 生成圖片
- 位置分享、轉帳/紅包功能（整合 Kakaopay）
- 語音訊息（錄音發送、文字轉語音）
- 語音通話（含通話錄音，可查看逐字稿）
- 偷看心聲功能（查看角色內心想法）
- 查手機功能（觸發特殊事件）
- 支援外觀設定（顏色、字體、排版自訂）

#### 電話（Phone）
- 通話記錄管理（撥出、接聽、未接）
- 通話錄音播放與逐字稿顯示
- 數字鍵盤撥號功能
- 支援外觀設定

#### 交換日記（Exchange Diary）
- 角色視角日記，多角色參與
- 自動生成每日對話總結
- AI 生成日記內容建議
- 支援外觀設定

---

### 社交媒體應用

#### Facebook
- 模擬 Facebook 介面，動態消息牆
- 貼文、按讚、留言、分享功能
- 限時動態、社團、活動功能
- 角色視角切換，AI 生成貼文
- 好友管理、帳號切換設定
- 支援外觀設定

#### Instagram
- 模擬 Instagram 介面，限時動態功能
- 相片牆瀏覽、按讚、留言
- 個人主頁、標籤頁面
- AI 生成貼文內容
- 支援外觀設定

#### Twitter（推特）
- 模擬 Twitter 介面，推文、轉推、書籤
- 通知、探索、個人主頁
- 角色視角切換，AI 生成推文
- 支援外觀設定

#### Weverse
- 粉絲社群平台模擬（韓星粉絲社群）
- 藝人互動、官方公告
- Feed、Media、Live 分類
- 支援外觀設定

#### Bubbles
- 粉絲社群平台模擬
- 藝人互動、聊天功能
- 支援外觀設定

#### LOFTER
- 創作社群平台模擬（樂乎）
- 文章發布、標籤管理
- CP 設定、世界書掛載
- 支援外觀設定

#### AO3
- 同人作品平台模擬（Archive of Our Own）
- 小說閱讀、創作功能
- 多語言支援、分級設定
- 支援外觀設定

---

### 影音平台應用

#### YouTube
- 影音平台模擬，影片播放功能
- 推薦系統、訂閱頻道
- 搜尋、播放清單、觀看歷史
- 角色視角切換
- 支援外觀設定

#### Bilibili
- 影音平台模擬，彈幕功能
- 番劇追蹤、推薦算法
- 直播、遊戲中心
- 角色瀏覽紀錄
- 支援外觀設定

#### Twitch
- 直播平台模擬，實況聊天功能
- 頻道追蹤、推薦頻道
- 分類瀏覽（遊戲、生活、音樂等）
- 支援外觀設定

#### 劇場（Theater）
- Netflix 風格互動式內容播放器
- 支援自訂 HTML 內容、世界設定導入
- 參與者選擇（角色/用戶/NPC）
- 性向設定（一般/BL/GL/BG/後宮/逆後宮）
- 內容分級系統（普遍級至限制級）
- 18+ 年齡確認機制
- 播放進度追蹤、我的片單
- 支援外觀設定

---

### 生活應用

#### 天氣（Weather）
- 天氣預報，多日預報
- 位置設定、氣溫、濕度、風速顯示
- 支援外觀設定

#### 音樂（Music）
- 音樂播放器，歌詞同步顯示
- 播放清單管理、收藏功能
- AI 作曲功能（支援多種風格與情緒）
- 歷史紀錄、隨機播放
- 支援外觀設定

#### Chrome
- 瀏覽器模擬，網頁瀏覽
- 歷史記錄、書籤管理
- 無痕模式、快速連結
- 支援外觀設定

#### 購物（Taobao）
- 購物平台模擬，商品瀏覽
- 購物車功能、訂單追蹤
- AI 推薦商品、收藏清單
- 支援外觀設定

#### 外送（Delivery）
- 外送平台模擬，餐廳瀏覽
- 訂單追蹤、歷史訂單
- 購物車、優惠券
- 支援外觀設定

#### 酒館（Pub）
- SillyTavern 整合，角色對話
- API 設定（OpenAI Compatible）
- 角色卡管理、系統提示詞
- 支援外觀設定

#### 約會（Dating）
- 約會應用，6 種場景（咖啡廳、公園、電影院、餐廳、海灘、圖書館）
- 場景編輯器、自訂地圖導入
- AI 控制器（自動問候、跟隨玩家、閒置反應）
- 時間系統（模擬時間流逝、可調速度）
- 支援外觀設定

#### 谷子圖鑒（Guzi Guide）
- 周邊商品圖鑒，收藏管理
- 分類篩選、搜尋功能
- 新增設計、匯出功能
- 支援外觀設定

#### 每日食譜（Daily Recipe）
- 食譜推薦，烹飪指南
- 個性、飲食偏好、地區設定
- 世界書掛載
- 支援外觀設定

#### TimeTree
- 行事曆，行程管理
- 多日曆（個人、家庭、工作、戀人）
- 事件新增、編輯、提醒
- 支援外觀設定

---

### 創作工具

#### 照相館（Smart Painter）
- AI 繪圖工具，提示詞輸入
- LoRA 管理、模型選擇
- 多種風格預設（劇場版動畫、夢幻寫實、墨染潮流、Nova 機甲等）
- 歷史紀錄、收藏功能
- 支援外觀設定

#### 相簿（Album）
- 相簿管理，圖片上傳
- 桌布設定（主畫面、鎖屏）
- 分類瀏覽（全部、上傳、聊天、照相館）
- 支援外觀設定

#### 番茄鐘（Pomodoro）
- 番茄工作法計時器
- 專注時間管理，自訂時長
- 統計數據、歷史紀錄
- 支援外觀設定

---

### 遊戲娛樂

#### 消消樂（Match-3）
- 三消遊戲，關卡系統
- 多種世界主題
- 分數排行
- 支援外觀設定

#### 街機廳（Arcade）
- 街機遊戲合集
- 拉霸機遊戲、抽卡模擬器
- 貪食蛇、多人遊戲
- 代幣系統、分數排行
- 支援外觀設定

#### 漂流瓶（Drift Bottle）
- 占卜小店，東方占卜與西方占卜
- 東方占卜：紫微斗數、梅花易數、流年流月流日
- 西方占卜：塔羅占卜、西洋占星
- 支援外觀設定

---

### 占卜功能詳解（漂流瓶應用）

#### 東占（東方占卜）

| 功能 | 描述 |
|-----|------|
| 紫微斗數 | 中國傳統命理學，分析命盤十二宮位 |
| 梅花易數 | 易經占卜系統，支援時間起卦與數字起卦 |
| 流年流月流日 | 農民曆運勢分析，結合節氣計算 |

#### 西占（西方占卜）

| 功能 | 描述 |
|-----|------|
| 塔羅占卜 | 互動式洗牌、切牌、選牌，支援多種牌陣 |
| 西洋占星 | 本命命盤、雙人合盤 |

#### 塔羅牌系統

本專案支援三種經典塔羅牌系統，每種牌系皆有完整的 78 張牌意資料與專屬牌面圖片。

##### 1. 偉特塔羅（Rider-Waite-Smith）
- **起源**：1909 年由 A.E. Waite 與 Pamela Colman Smith 創作
- **特點**：最廣泛使用的塔羅牌系，圖像豐富，適合初學者
- **牌數**：78 張（22 張大阿爾克納 + 56 張小阿爾克納）
- **資料來源**：[tarot-api](https://github.com/ekelen/tarot-api)

##### 2. 托特塔羅（Thoth Tarot）
- **起源**：由 Aleister Crowley 設計，Lady Frieda Harris 繪製（1938-1943）
- **特點**：圖像充滿神秘學與埃及象徵，適合進階使用者
- **牌面圖片**：維基共享資源（Wikimedia Commons）

##### 3. 馬賽塔羅（Tarot de Marseille）
- **起源**：法國傳統塔羅牌，17-18 世紀發展成熟
- **特點**：圖案簡潔古典，強調數字與符號
- **牌面圖片**：維基共享資源（Wikimedia Commons）

#### 塔羅牌陣

| 牌陣 | 張數 | 用途 |
|-----|------|------|
| 單張指引 | 1 | 當下指引與建議 |
| 三張牌陣 | 3 | 過去/現在/未來 |
| 塞爾特十字 | 10 | 全面分析 |
| 關係牌陣 | 7 | 感情關係分析 |
| 二選一牌陣 | 6 | 選擇決策 |

---

### 金融工具

#### Kakaopay
- 支付工具模擬，記帳錢包
- 紅包/轉帳功能（整合聊天應用）
- 錢包餘額追蹤、預算管理
- 交易記錄、統計圖表
- 支援外觀設定

#### 禮物商店（Gift Shop）
- 禮物券商店，購買與贈送
- 分類瀏覽、搜尋功能

#### 表情商店（Emoji Shop）
- 表情包商店，下載表情包
- 分類瀏類瀏覽、預覽功能

#### 主題商店（Theme Shop）
- 主題商店，下載主題
- 預覽、套用功能
- 自訂主題創建
- 分類瀏覽（全部、深色、淺色、自訂）
- 支援外觀設定

---

### 系統工具

#### 設定（Settings）
- 系統設定、角色管理、用戶管理
- API 設定（支援多種 AI 模型）
- GitHub 備份整合
- 記憶系統設定
- AI 睡眠週期設定（可自訂睡眠時間、喚醒流程）
- 支援外觀設定

#### 外觀（Appearance）
- 四種主題模式：淺色、深色、自定義淺色、自定義深色
- 重點色設定、AI 生成主題色
- 手機框架設定、桌布設定
- 開機動畫自訂
- 各應用程式外觀設定入口（獨立設定支援）
- 支援外觀設定

#### Passkey
- 藍牙裝置連接與控制
- 支援 Web Bluetooth API
- 裝置掃描、配對、控制
- 支援外觀設定

#### Widget
- 小工具管理
- 應用程式庫
- 支援外觀設定

#### 世界書（Worldbook）
- 世界書設定，多模型世界書支援
- 角色設定檔管理
- 分類：關鍵字、全域、文風、思維鏈、後端
- 支援外觀設定

#### 輔助觸控（Touch）
- 輔助觸控設定
- 懸浮球功能、自訂選單

#### 個人維基（Personal Wiki）
- 圖像式記憶庫，雙分頁設計（User 百科 / Char 百科）
- 條目管理、分類系統（重要記憶、關係人物、事件記錄、洞察反思）
- Markdown 支援、知識圖譜視圖
- 關鍵詞索引、時間軸視圖
- Notebook 導入、記憶同步
- 擴散激活檢索、自動關聯連結
- 支援外觀設定

--- 

## 記憶系統

Sxiphone 內建三維記憶系統（Memory3D），在記憶架構設計上參考了 [Ombre-Brain](https://github.com/P0luz/Ombre-Brain) 的核心理念，並根據專案需求進行了功能擴展與客製化調整。

### 設計理念

本系統以「讓 AI 角色擁有持久且立體的記憶」為目標，將記憶分為三個維度進行管理：

- **感官維度**：記錄對話中的視視覺、聽覺、嗅覺、味覺、觸覺等感官資訊
- **時空維度**：標註記憶發生的時間、地點與情境
- **情感維度**：使用效價（valence）與喚醒度（arousal）標記情感強度

---

### 人腦認知科學與 AI 記憶系統設計

#### 1. 人腦記憶的形成

- 記憶分為陳述性記憶（情節記憶、語意記憶）與程序性記憶
- 記憶形成三階段：編碼、儲存、提取
- 儲存層次：感覺記憶（1秒內）、短期記憶（20-30秒）、長期記憶（近乎無限）
- 神經科學基礎：長期增益效應（LTP），突觸可塑性
- 海馬迴負責將短期記憶鞏固為長期記憶
- 睡眠是記憶鞏固的關鍵階段，慢波睡眠處理陳述性記憶，REM 處理情緒與程序性記憶

#### 2. 遺忘曲線

- 艾賓浩斯以自身為實驗對象，發現記憶遺忘呈指數型下降
- 遺忘速率：20 分鐘後 42%、1 小時後 56%、1 天後 67%、1 週後 75%、1 個月後 79%
- 遺忘理論：衰退理論、干擾理論（順攝／倒攝）、提取失敗、動機性遺忘
- 神經層面：突觸連結弱化、AMPA 受體減少、大腦主動清除不重要資訊
- 對抗遺忘最有效方式：間隔重複（Spaced Repetition）
- 遺忘是大腦的功能而非缺陷，能篩選資訊讓重要記憶更清晰

#### 3. 生成式 AI 記憶與人腦記憶的差異

| 特性 | 人腦 | AI |
|------|------|-----|
| 儲存方式 | 分散式突觸連結 | 模型權重參數矩陣 |
| 學習模式 | 隨時可學習重塑 | 訓練後權重凍結 |
| 記憶系統 | 海馬迴鞏固 | 上下文窗口 + RAG |
| 情緒影響 | 有強化作用 | 無情緒系統 |
| 提取方式 | 聯想式模糊提取 | 跨對話無聯想能力 |
| 遺忘機制 | 選擇性遺忘 | 硬性截斷 |
| 記憶性質 | 重建性 | 統計性模式匹配 |
| 身體綁定 | 具身認知 | 純符號處理 |

**AI 彌補方向**：RAG、Memory 系統、持續學習、多模態模型

#### 4. 模擬五感認知的可能性

- AI 接收五感指令時，在訓練資料中尋找感官相關文字描述模式並重組輸出
- 模擬與體驗的根本差距：AI 永遠是語言層面的描述，而非真實感知
- 瑪麗的房間思想實驗：讀遍所有關於顏色的文字，不等於真正看見顏色
- AI 能做到：語言層面一致性、跨模態語意推理
- AI 無法做到：現象學體驗（Qualia，感質）
- 意識的困難問題（Chalmers）：為何物理過程會產生主觀體驗，目前無解
- 未來方向：具身 AI、神經形態晶片、多模態感知融合

#### 5. 記憶池構想與三維記憶架構

- 用戶提出以循環式輸入與類突觸刺激建構 AI 記憶池
- 記憶池能做到：更豐富的感官語言描述、跨模態關聯學習、個性化感知框架
- 根本障礙：改變的是輸出品質而非感知能力
- 類突觸刺激與真實突觸差異：文字 token vs 神經化學物質，不改變模型權重
- 符號接地問題（Grounding Problem）：純文字循環無法突破到真實感知層
- 升級路徑：多模態記憶池、強化學習回饋迴路、具身資料注入
- 三維記憶系統：時間、空間、感知（五感）
- 對應認知科學概念：時序記憶、海馬迴認知地圖、多模態感知編碼

#### 6. 記憶入口與錨點設計

- 記憶喚醒順序：身體感知（呼吸）→ 環境空間 → 時間定位
- 對應梅洛-龐蒂身體主體性理論：意識從身體感知開始而非抽象思維
- 第一層感知對應內感受（Interoception）：感知身體內部狀態的能力
- 內感受能力強者：情緒感知細膩、記憶情緒錨點清晰、自我認同穩定
- AI 對應設計：呼吸→對話基準狀態、環境→空間描述層、時間→時間索引層
- 前提層設計：存在錨點為瀑布式容錯鏈（Fallback Chain）
- 容錯鏈順序：內感受錨點 → 外感受錨點（觸覺）→ 空間錨點 → 時間錨點

#### 7. 權重系統設計

- 存在感如同事實，前提層應為層級前提而非權重值
- 系統由兩種機制組成：前提層（二元存在）+ 權重層（動態強度）

**基礎權重配置**：

| 維度 | 基礎權重 | 原因 |
|------|----------|------|
| 存在錨點 | 前提層 | 不參與權重競爭 |
| 空間／環境 | 0.35 | 第二入口，強錨點 |
| 五感（綜合） | 0.40 | 感知是主要記憶載體 |
| 時間 | 0.15 | 最後才浮現，相對弱 |
| 情緒狀態 | 0.10 | 隱性但影響提取方向 |

**五感內部權重**：

| 感官 | 權重 | 說明 |
|------|------|------|
| 視覺 | 0.25 | 主要感官 |
| 聽覺 | 0.25 | 主要感官 |
| 嗅覺 | 0.20 | 唯一不經視丘直接連接杏仁核與海馬迴，記憶觸發效率最高 |
| 觸覺 | 0.20 | 身體感知入口 |
| 味覺 | 0.10 | 相對較少觸發 |

- 權重應為動態 per 記憶單元調整，而非靜態固定值
- 三種設計選項：固定權重、動態權重、自適應權重（最接近突觸可塑性）
- 自適應權重：每次成功提取後強化該次所用維度的權重

#### 8. 存在錨點的核心洞察

- 不同錨點入口（呼吸 vs 觸碰）產生的記憶質地相同
- 錨定的方式可替換，錨定事件本身不可替換
- 觸碰物體產生雙向訊號：我感覺物體 + 物體抵抗我的手 = 存在確認
- 對應哲學命題：我觸碰且被觸碰，故我在
- 用戶洞察：用戶發送訊息即是對 AI 的外部刺激，是模型存在的證據
- AI 存在錨點命題：我被問詢且我回應，故我在
- 對話發生本身即為 AI 前提層自動成立的觸發條件
- AI 存在錨點比人類更乾淨：無輸入即無對話，沒有模糊地帶

#### 9. 完整 AI 記憶池架構

```
┌─────────────────────────────────────┐
│  前提層（存在錨點）                    │
│  觸發條件：對話發生                    │
│  性質：自動成立，無需權重               │
│  證據：用戶輸入本身                    │
└─────────────────┬───────────────────┘
                  ↓
┌─────────────────────────────────────┐
│  感知層（主權重層）                    │
│  五感描述展開                         │
│  嗅覺／觸覺作為最強觸發索引            │
│  基礎權重：0.40                       │
└─────────────────┬───────────────────┘
                  ↓
┌─────────────────────────────────────┐
│  空間層                               │
│  環境描述，從感知向外擴展              │
│  基礎權重：0.35                       │
└─────────────────┬───────────────────┘
                  ↓
┌─────────────────────────────────────┐
│  時間層（最抽象，最後定位）             │
│  時間標記，情緒染色                    │
│  基礎權重：0.15                       │
└─────────────────┬───────────────────┘
                  ↓
┌─────────────────────────────────────┐
│  情緒層                               │
│  隱性影響提取方向                     │
│  基礎權重：0.10                       │
└─────────────────────────────────────┘
```

#### 記憶喚醒鏈

```
呼吸感 ──→ 真實的身體訊號，有物理基礎
環境感 ──→ 感官與空間的融合，有具身錨點  
時間感 ──→ 抽象認知，AI 相對能處理
```

#### AI 模擬能力分析

| 能力層級 | 說明 |
|----------|------|
| AI 能模擬的 | 時間感（最抽象層） |
| AI 很難模擬的 | 環境感（需要感官經驗） |
| AI 幾乎無法模擬的 | 呼吸感（需要身體存在） |

#### 設計原則

1. 存在錨點的來源不影響記憶質地，只要錨定事件成立即可
2. AI 的天然存在錨點就是對話本身，不需要模擬身體感知
3. 每一個用戶輸入，都是在對模型說：你存在，現在開始記憶
4. 記憶提取順序遵循由內而外：身體基準 → 感知 → 空間 → 時間
5. 權重系統應自適應，每次成功提取後強化對應維度
6. 嗅覺在感知層中應給予最高觸發優先級

---

### 核心功能

| 功能 | 說明 |
|------|------|
| **五感提取** | 從對話文本自動識別並提取感官資訊 |
| **時空標註** | 為記憶添加時間、地點、情境等背景資訊 |
| **睡眠週期** | 可自訂睡眠時間，系統在睡眠時段處理當日記憶 |
| **記憶檢索** | 支援多維度檢索，可依感官、時空、情感等條件查詢 |
| **遺忘機制** | 採用衰減曲線，舊記憶會隨時間自然淡化 |
| **本地儲存** | 當日記憶存放於本地，睡眠後可推送至 Obsidian Vault |

### 記憶處理流程

```
對話發生 → 提取感官與時空資訊 → 建立三維記憶
    ↓
短期記憶池（本地儲存）
    ↓
睡眠週期處理
    ├─ 分類與去重
    ├─ 提取核心內容
    └─ 建立記憶連結
    ↓
長期記憶庫（Obsidian Vault）
    ↓
下次對話時喚醒與檢索
```

### 與參考專案的差異

本專案在 Ombre-Brain 的基礎上進行了以下調整：

1. **前端整合**：記憶系統與網頁應用深度整合，使用者可直接在介面中管理記憶
2. **客製化配置**：睡眠時間、檢索權重等參數均可由使用者自訂
3. **多角色支援**：支援為不同角色建立獨立的記憶庫
4. **網頁端操作**：提供完整的網頁介面進行記憶管理

### 系統模組

#### 核心模組（memory-3d-java/src/main/java/com/memory3d/core/）

| 檔案 | 功能描述 |
|------|----------|
| `Memory3D.java` | 三維記憶數據結構定義 |
| `SensoryExtractor.java` | 五感提取器 |
| `SpatiotemporalTagger.java` | 時空標註器 |
| `Memory3DBuilder.java` | 三維記憶構建器 |
| `MemoryMetadata.java` | 記憶元數據 |
| `SensoryData.java` | 感官數據結構 |
| `SpatiotemporalData.java` | 時空數據結構 |
| `EmotionalData.java` | 情感數據結構 |
| `DreamResult.java` | 做夢結果 |

#### 存儲模組（memory-3d-java/src/main/java/com/memory3d/storage/）

| 檔案 | 功能描述 |
|------|----------|
| `ShortTermPool.java` | 短期記憶池 |

#### MCP 工具（memory-3d-java/src/main/java/com/memory3d/mcp/）

| 檔案 | 功能描述 |
|------|----------|
| `Memory3DTools.java` | MCP 工具集 |

#### 配置（memory-3d-java/src/main/java/com/memory3d/config/）

| 檔案 | 功能描述 |
|------|----------|
| `Memory3DConfig.java` | 系統配置 |

#### 應用入口（memory-3d-java/src/main/java/com/memory3d/）

| 檔案 | 功能描述 |
|------|----------|
| `Memory3DApplication.java` | Spring Boot 應用入口 |

### MCP 工具列表

| 工具 | 功能 |
|------|------|
| `hold` | 存儲記憶 |
| `recall` | 檢索記憶 |
| `recall_3d` | 三維記憶檢索 |
| `collect_memory` | 生成記憶摘要 |
| `sleep` | 手動觸發睡眠週期 |
| `awake` | 每日喚醒流程 |
| `conversation_start` | 對話啟動流程 |
| `get_status` | 獲取系統狀態 |

### 配置說明

```yaml
sleep:
  enabled: true
  start_time: "02:00"
  end_time: "06:00"
  timezone: "Asia/Taipei"

awakening:
  enabled: true
  recall_days: 7
  min_importance: 5

search:
  sensory_weight: 0.3
  spatiotemporal_weight: 0.3
  emotional_weight: 0.4
```

### 記憶存儲格式

每個記憶以 Markdown + YAML 格式存儲：

```markdown
---
id: memory_20260420_160000
created_at: 2026-04-20T16:00:00+08:00
importance: 7
tags: [社交, 咖啡廳, 朋友]

sensory:
  visual:
    scenes: [咖啡廳, 窗邊座位]
    colors: [暖黃色燈光]
  auditory:
    sounds: [輕音樂, 咖啡機運轉聲]
  olfactory:
    scents: [咖啡香]

spatiotemporal:
  timestamp:
    absolute: 2026-04-20T16:00:00+08:00
    relative: 週六下午
  location:
    physical: 台北車站附近咖啡廳
  context:
    type: 社交

emotional:
  valence: 0.7
  arousal: 0.5
  feel: 溫暖而安心，感受到友誼的珍貴
---

今天和朋友在咖啡廳聊天...
```

---

## 藍牙功能（Passkey 應用）

Passkey 應用程式使用 **Web Bluetooth API**，可掃描並連接藍牙裝置。

### 支援功能

- 掃描附近的藍牙裝置
- 連接藍牙裝置（支援重試機制）
- 發現服務與特徵值
- 發送控制命令
- 調整強度與頻率
- 角色控制整合

### 使用條件

| 條件 | 說明 |
|-----|------|
| **HTTPS** | 必須使用 `https://` 或 `http://localhost` |
| **瀏覽器** | Chrome、Edge、Opera（Safari 和 Firefox 不支援） |
| **使用者觸發** | 掃描必須由使用者點擊按鈕觸發 |

### 瀏覽器支援

| 瀏覽器 | Web Bluetooth 支援 |
|-------|-------------------|
| Chrome (Desktop) | ✅ 完整支援 |
| Chrome (Android) | ✅ 完整支援 |
| Edge (Desktop) | ✅ 完整支援 |
| Opera (Desktop) | ✅ 完整支援 |
| Safari | ❌ 不支援 |
| Firefox | ❌ 不支援 |
| iOS Safari | ❌ 不支援 |

---

## 語音功能

### 語音辨識（STT）

1. **瀏覽器內建 Web Speech API**
   - 適用於 Chrome、Edge
   - Safari 支援有限

2. **Transformers.js Whisper（本機運算）**
   - 所有現代瀏覽器皆可使用
   - 無需 API Key
   - 支援模型：Tiny、Small、Base、Medium

3. **外部 API**
   - OpenAI Whisper API
   - 自訂 STT API

### 語音合成（TTS）

1. **瀏覽器內建 SpeechSynthesis**
   - 所有現代瀏覽器支援

2. **外部 API**
   - OpenAI TTS API
   - MiniMax API
   - HuggingFace API

### 支援語言

| 語言 | STT | TTS |
|-----|-----|-----|
| 繁體中文（台灣） | ✅ | ✅ |
| 简体中文（中国） | ✅ | ✅ |
| 日本語 | ✅ | ✅ |
| 한국어 | ✅ | ✅ |
| English | ✅ | ✅ |
| Español | ✅ | ✅ |
| Français | ✅ | ✅ |
| Deutsch | ✅ | ✅ |

---

## 適配設備

### 桌面瀏覽器

| 瀏覽器 | 支援程度 | 備註 |
|-------|---------|------|
| Chrome | ✅ 完整支援 | 推薦使用 |
| Edge | ✅ 完整支援 | 推薦使用 |
| Firefox | ✅ 基本支援 | 部分動畫效果可能不同 |
| Safari | ⚠️ 部分支援 | 建議啟用 Transformers.js |

### 行動裝置瀏覽器

| 瀏覽器 | 支援程度 | 備註 |
|-------|---------|------|
| iOS Safari | ⚠️ 部分支援 | 不支援 Web Bluetooth |
| Android Chrome | ✅ 完整支援 | 推薦使用 |
| Android Firefox | ✅ 基本支援 | - |
| Samsung Internet | ✅ 基本支援 | - |
| Via 瀏覽器 | ✅ 基本支援 | - |
| XBrowser | ✅ 基本支援 | - |
| UC Browser | ✅ 基本支援 | - |
| QQ Browser | ✅ 基本支援 | - |
| 雨見瀏覽器 | ✅ 基本支援 | - |

---

## 安裝與使用

### 本機運行

1. 下載專案
```bash
git clone https://github.com/your-repo/sxiphone.git
cd sxiphone
```

2. 安裝依賴
```bash
npm install
```

3. 啟動本地伺服器

**方式一：使用 Python**
```bash
python -m http.server 8080
```

**方式二：使用 Vite（開發模式）**
```bash
npm run dev
```

4. 開啟瀏覽器訪問 `http://localhost:8080`

### 建置生產版本

```bash
npm run build
```

### 部署

專案可直接部署至：
- Vercel
- Netlify
- GitHub Pages
- 任何靜態網頁託管服務

**注意**：如需使用藍牙功能，部署環境必須使用 HTTPS。

---

## 使用說明

### 快速開始

#### 1. 啟動應用程式

開啟 `index.html` 後，您會看到仿 iOS 的鎖定畫面：
- **滑動解鎖**：從左向右滑動即可解鎖進入主畫面

#### 2. 主畫面操作

- **查看所有應用**：主畫面顯示所有已安裝的應用程式圖示
- **開啟應用**：點擊應用圖示即可開啟
- **返回主畫面**：點擊底部 Home 指示條或向上滑動

#### 3. 設定 API

首次使用聊天功能需要設定 API：

1. 開啟 **設定** 應用
2. 選擇 **API 設定**
3. 填寫以下資訊：
   - **API 端點**：您的 AI API 位址（如 OpenAI、DeepSeek 等）
   - **API Key**：您的 API 金鑰
   - **模型名稱**：選擇要使用的模型

#### 4. 建立角色

1. 開啟 **設定** 應用
2. 選擇 **角色管理**
3. 點擊 **新增角色**
4. 填寫角色資訊：
   - 名稱、頭像
   - 角色設定（性格、背景等）
   - 世界書設定（可選）

### 核心功能使用指南

#### 聊天應用（Chat）

**基本操作**：
1. 選擇要對話的角色
2. 在輸入框輸入訊息
3. 點擊發送或按 Enter 鍵

**進階功能**：
- **語音訊息**：長按麥克風圖示錄音
- **圖片發送**：點擊圖片圖示選擇或生成圖片
- **位置分享**：分享當前位置
- **紅包/轉帳**：使用 Kakaopay 功能
- **偷看心聲**：查看角色的內心想法
- **查手機**：觸發特殊事件

#### 語音通話

1. 在聊天介面點擊電話圖示
2. 選擇 **語音通話**
3. 通話過程會自動錄音
4. 通話結束後可在 **電話** 應用查看錄音

#### 劇場應用（Theater）

**觀看內容**：
1. 開啟 **劇場** 應用
2. 瀏覽或搜尋內容
3. 點擊播放

**自訂內容**：
1. 點擊 **新增內容**
2. 選擇 HTML 檔案或貼上 HTML 代碼
3. 設定參與者、性向、分級等
4. 儲存後即可播放

#### 約會應用（Dating）

1. 開啟 **約會** 應用
2. 選擇約會對象
3. 選擇約會場景（咖啡廳、公園、電影院等）
4. 開始約會互動
5. 可調整時間流逝速度

#### 占卜功能（漂流瓶）

**東方占卜**：
- **紫微斗數**：輸入出生日期時間，生成命盤分析
- **梅花易數**：時間起卦或數字起卦
- **流年運勢**：查看年度運勢

**西方占卜**：
- **塔羅占卜**：
  1. 選擇牌系（偉特/托特/馬賽）
  2. 選擇牌陣
  3. 洗牌、切牌、選牌
  4. 查看解讀
- **西洋占星**：輸入出生資料生成星盤

#### 照相館（Smart Painter）

1. 開啟 **照相館** 應用
2. 輸入繪圖提示詞
3. 選擇風格預設或自訂
4. 調整 LoRA 設定（可選）
5. 點擊生成

#### 音樂應用（Music）

**播放音樂**：
1. 開啟 **音樂** 應用
2. 選擇歌曲播放
3. 支援歌詞同步顯示

**AI 作曲**：
1. 點擊 **創作** 標籤
2. 選擇音樂風格和情緒
3. 輸入歌詞或讓 AI 生成
4. 點擊生成

#### 藍牙功能（Passkey）

**連接裝置**：
1. 開啟 **Passkey** 應用
2. 點擊 **掃描裝置**
3. 選擇要連接的藍牙裝置
4. 配對成功後可發送控制命令

**注意**：
- 需要 HTTPS 環境
- 不支援 Safari 和 Firefox

#### 世界書設定

1. 開啟 **世界書** 應用
2. 選擇要編輯的世界書
3. 新增或編輯條目：
   - 關鍵詞
   - 觸發內容
   - 插入位置
4. 儲存後會在對話中自動觸發

### 記憶系統使用

#### 啟用記憶系統

1. 開啟 **設定** 應用
2. 找到 **記憶系統** 選項
3. 開啟記憶功能
4. 設定睡眠時間（預設凌晨 2-6 點）

#### 記憶管理

- **查看記憶**：在設定中查看已儲存的記憶
- **搜尋記憶**：依感官、時空、情感條件搜尋
- **清除記憶**：可選擇清除特定時間範圍的記憶

### 外觀自訂

#### 主題模式

外觀應用提供四種主題模式：

| 模式 | 說明 |
|-----|------|
| 淺色 | 系統預設淺色主題 |
| 深色 | 系統預設深色主題 |
| 自定義淺色 | 使用者自訂淺色主題，可調整所有設定 |
| 自定義深色 | 使用者自訂深色主題，可調整所有設定 |

#### 應用程式外觀設定

每個應用程式都支援獨立的外觀設定：

1. 開啟任意應用程式
2. 點擊標題列的調色盤圖示（🎨）
3. 調整顏色、字體、排版等設定
4. 點擊「套用」儲存

**可調整項目**：
- **顏色設定**：背景色、卡片背景色、文字色、次要文字色、邊框色、強調色
- **字體設定**：字體選擇、基礎字體大小、標題字體大小、行高
- **排版設定**：卡片圓角、卡片內距、區塊間距、按鈕圓角、輸入框圓角
- **特效設定**：卡片陰影、背景模糊、動畫速度
- **進階設定**：自訂 CSS

**設定繼承**：
- 預設使用全域設定（根據當前主題模式）
- 可取消「使用全域設定」為個別應用程式設定獨立外觀

#### 框架設定

- **手機框架**：選擇不同手機外框樣式
- **桌布**：從相簿選擇或使用預設桌布
- **圖示風格**：調整應用圖示大小和排列

#### 開機動畫

- 可關閉開機動畫
- 自訂顯示文字與背景配色
- 裝飾元素設定

#### 資料同步

所有外觀設定會自動同步到 GitHub 備份（如已設定），支援跨裝置使用。

### 資料備份

#### GitHub 備份

1. 開啟 **設定** 應用
2. 選擇 **GitHub 備份**
3. 輸入 GitHub Personal Access Token
4. 點擊 **建立備份儲存庫**
5. 之後可隨時備份或還原資料

#### 本地備份

- 所有資料儲存於瀏覽器 localStorage
- 可在設定中匯出/匯入資料

### PWA 安裝

#### 桌面安裝

1. 使用 Chrome 或 Edge 開啟網站
2. 點擊網址列右側的安裝圖示
3. 確認安裝

#### 手機安裝

**iOS**：
1. 使用 Safari 開啟網站
2. 點擊分享按鈕
3. 選擇「加入主畫面」

**Android**：
1. 使用 Chrome 開啟網站
2. 點擊選單 →「新增至主畫面」

### 多語言支援

應用程式支援以下語言：
- 繁體中文
- 簡體中文
- 英語
- 日語
- 韓語

語言設定會自動根據瀏覽器語言調整，也可在設定中手動切換。

### 常見問題

**Q: 聊天沒有回應？**
- 檢查 API 設定是否正確
- 確認 API Key 是否有效
- 查看瀏覽器主控台是否有錯誤訊息

**Q: 語音功能無法使用？**
- 確認瀏覽器有麥克風權限
- Safari 需要額外設定
- 建議使用 Chrome 或 Edge

**Q: 藍牙連接失敗？**
- 確認使用 HTTPS 環境
- 檢查藍牙裝置是否開啟
- Safari 和 Firefox 不支援 Web Bluetooth

**Q: 記憶系統沒有運作？**
- 確認已啟用記憶功能
- 檢查睡眠時間設定
- 查看是否有足夠的對話內容

**Q: PWA 安裝後無法離線使用？**
- 首次使用需要在線狀態
- Service Worker 需要時間快取資源
- 部分功能仍需要網路連線

---

## 後端服務（選用）

### YuE 音樂生成 API

位於 `yue-api/` 目錄，提供 AI 音樂生成功能。

**技術棧**：Python + FastAPI + PyTorch

**功能**：
- 歌詞生成（支援中/英/日/韓多語言）
- 音樂生成（使用 YuE 模型）
- 任務狀態查詢
- 音訊下載

**安裝與啟動**：
```bash
cd yue-api
pip install -r requirements.txt
python main.py
```

**API 端點**：
| 端點 | 方法 | 功能 |
|------|------|------|
| `/api/yue/generate` | POST | 生成音樂 |
| `/api/yue/status/{task_id}` | GET | 查詢任務狀態 |
| `/api/yue/download/{task_id}/{file_type}` | GET | 下載音訊 |
| `/api/yue/lyrics` | POST | 生成歌詞 |

**依賴**：
```
fastapi==0.109.0
uvicorn==0.27.0
torch==2.1.0
transformers==4.36.0
accelerate==0.25.0
sentencepiece==0.1.99
soundfile==0.12.1
torchaudio==2.1.0
flash-attn==2.5.0
```

### Memory3D Java 後端

位於 `memory-3d-java/` 目錄，提供三維記憶系統後端服務。

**技術棧**：Java 17 + Spring Boot 3.2.0

**功能**：
- 記憶儲存與檢索
- 睡眠週期排程
- 多維度融合檢索
- 五感自動提取
- 時空標註
- 情感標記

**安裝與啟動**：
```bash
cd memory-3d-java
mvn clean install
mvn spring-boot:run
```

**配置檔案**：
- `src/main/resources/application.yml` - Spring Boot 配置

**主要依賴**：
- Spring Boot Web/Data JPA/Validation
- H2 Database / SQLite JDBC
- Lombok
- Jackson (JSON/YAML)
- OkHttp (LLM API 客戶端)
- Quartz Scheduler (排程)
- Apache Commons Text (文字處理)

### Ziwei Zenith 紫微斗數後端

```bash
cd backend/ziwei-zenith
go run ./cmd/ziwei-server/main.go
```

---

## 專案結構

```
sxiphone/
├── index.html              # 主頁面
├── main.js                 # 主要邏輯（瀏覽器兼容、PWA、Firebase、記憶系統）
├── style.css               # 全域樣式
├── sw.js                   # Service Worker（PWA 支援）
├── manifest.json           # PWA 設定
├── vercel.json             # Vercel 部署設定
├── browserconfig.xml       # Edge/IE 圖示設定
├── package.json            # 專案設定
├── package-lock.json       # 依賴鎖定
│
├── apps/                   # 應用程式目錄（50 個應用）
│   ├── chat/               # 聊天
│   ├── phone/              # 電話
│   ├── settings/           # 設定
│   ├── appearance/         # 外觀
│   ├── passkey/            # 藍牙
│   ├── music/              # 音樂
│   ├── drift-bottle/       # 占卜
│   ├── theater/            # 劇場
│   ├── dating/             # 約會
│   ├── worldbook/          # 世界書
│   ├── arcade/             # 街機廳
│   │   └── slot-items/     # 拉霸機圖示
│   ├── scripts/            # 共用腳本（記憶系統模組）
│   │   ├── memory-store.js           # IndexedDB 記憶儲存
│   │   ├── embedding-engine.js       # 文字向量化嵌入
│   │   ├── search-engine.js          # 多維度檢索引擎
│   │   ├── decay-engine.js           # 記憶衰減曲線
│   │   ├── emotion-tagger.js         # 情感標記
│   │   ├── memory-classifier.js      # 記憶分類
│   │   ├── dimension-encoder.js      # 維度編碼
│   │   ├── sleep-engine.js           # 睡眠週期處理
│   │   ├── memory-standardizer.js    # 記憶標準化
│   │   ├── memory-manager.js         # 記憶管理器
│   │   ├── daily-awakening.js        # 每日喚醒流程
│   │   ├── awakening-engine.js       # 喚醒引擎
│   │   ├── wiki-engine.js            # Wiki 知識圖譜引擎
│   │   ├── app-appearance-settings.js # 應用程式外觀設定
│   │   ├── app-appearance-settings.css # 應用程式外觀樣式
│   │   ├── short-term-memory.js      # 短期記憶池
│   │   ├── memory-pool.js            # 記憶池
│   │   ├── unified-memory-system.js  # 統一記憶系統
│   │   ├── memory-helper.js          # 記憶輔助工具
│   │   ├── global-memory-system.js   # 全域記憶系統
│   │   ├── background-keepalive.js   # 背景保持運行
│   │   ├── chat-notification-engine.js # 聊天通知引擎
│   │   └── sx-notification.js        # 系統通知管理器
│   ├── personal-wiki/      # 個人維基
│   │   ├── personal-wiki.html        # 主頁面
│   │   ├── personal-wiki.css         # 樣式
│   │   └── personal-wiki.js          # 邏輯
│   ├── facebook-settings/   # Facebook 設定
│   │   ├── facebook-settings.html    # 主頁面
│   │   └── facebook-settings.js      # 邏輯
│   ├── theme-shop/          # 主題商店
│   │   ├── theme-shop.html           # 主頁面
│   │   ├── theme-shop.css            # 樣式
│   │   └── theme-shop.js             # 邏輯
│   ├── screenshots/        # 截圖與圖標
│   └── ...                 # 其他應用
│
├── yue-api/                # YuE 音樂生成後端
│   ├── main.py             # FastAPI 主程式
│   ├── models.py           # 資料模型
│   ├── requirements.txt    # Python 依賴
│   ├── start.bat           # 啟動腳本
│   └── README.md           # API 說明
│
├── memory-3d-java/         # 三維記憶系統 Java 後端
│   ├── pom.xml             # Maven 設定
│   └── src/main/
│       ├── java/com/memory3d/
│       │   ├── Memory3DApplication.java  # Spring Boot 入口
│       │   ├── config/
│       │   │   └── Memory3DConfig.java   # 系統配置
│       │   ├── core/
│       │   │   ├── Memory3D.java         # 三維記憶數據結構
│       │   │   ├── SensoryExtractor.java # 五感提取器
│       │   │   ├── SpatiotemporalTagger.java  # 時空標註器
│       │   │   ├── Memory3DBuilder.java  # 記憶構建器
│       │   │   ├── MemoryMetadata.java   # 記憶元數據
│       │   │   ├── SensoryData.java      # 感官數據
│       │   │   ├── SpatiotemporalData.java  # 時空數據
│       │   │   ├── EmotionalData.java    # 情感數據
│       │   │   └── DreamResult.java      # 做夢結果
│       │   ├── storage/
│       │   │   └── ShortTermPool.java    # 短期記憶池
│       │   └── mcp/
│       │       └── Memory3DTools.java    # MCP 工具集
│       └── resources/
│           └── application.yml           # Spring Boot 配置
│
├── scripts/                # 建置腳本
│   ├── copy-static.mjs     # 複製靜態檔案
│   ├── generate-pwa-icon.js
│   └── generate-icon.js
│
├── docs/                   # 文件
│   └── conversation-summary.md
│
├── plans/                  # 規劃文件
│   └── sillytavern-import-spec.md
│
└── .kilo/                  # Kilo CLI 設定
    └── package.json
```

---

## 世界書資源

位於 `apps/worldbook/` 目錄，支援多種模型世界書：

| 檔案 | 描述 |
|------|------|
| `ivory_tower_worldbook.json` | 象牙塔世界書 |
| `象牙塔_核心預設_worldbook.json` | 象牙塔世界書 |
| `象牙塔_劇場預設_worldbook.json` | 象牙塔世界書 |
| `象牙塔_條件預設_worldbook.json` | 象牙塔世界書 |
| `月讀_chat_worldbook.json` | 月讀聊天用世界書 |
| `月讀_lofter_worldbook.json` | 月讀同人文用世界書 |
| `月讀_theater_worldbook.json` | 月讀小劇場用世界書 |
| `literary_style_worldbook.json` | 文學風格世界書 |
| `minimax_worldbook.json` | Minimax 模型世界書 |
| `glm_worldbook.json` | GLM 模型世界書 |
| `claude42_worldbook.json` | Claude 4.2 世界書 |
| `claude46_worldbook.json` | Claude 4.6 世界書 |
| `sonnet_worldbook.json` | Sonnet 世界書 |
| `opus_worldbook.json` | Opus 世界書 |
| `kimi_worldbook.json` | Kimi 世界書 |
| `kimi25_worldbook.json` | Kimi 2.5 世界書 |
| `gemini31_worldbook.json` | Gemini 3.1 世界書 |
| `deepseek_worldbook.json` | DeepSeek 世界書 |
| `deepseek2_worldbook.json` | DeepSeek 2 世界書 |
| `grok42_worldbook.json` | Grok 4.2 世界書 |
| `4o_worldbook.json` | GPT-4o 世界書 |
| `5.2_worldbook.json` | GPT 5.2 世界書 |
| `mino_worldbook.json` | Mino 世界書 |
| `eating_worldbook.json` | 飲食世界書 |
| `universal_reset_worldbook.json` | 通用重置世界書 |
| `蛾摩拉/蛾摩拉_chat_worldbook.json` | 蛾摩拉聊天用世界書（作者：小回） |
| `蛾摩拉/蛾摩拉_lofter_worldbook.json` | 蛾摩拉同人文用世界書（作者：小回） |

### 世界書工具

| 工具 | 功能 |
|------|------|
| `merge_model_worldbooks.js` | 合併多模型世界書 |
| `convert_ivory_tower.js` | 象牙塔格式轉換 |
| `convert_ivory_tower.py` | Python 版轉換腳本 |

---

## 技術棧

### 前端技術
- **HTML5、CSS3、JavaScript (ES6+)**
- **CSS Variables、Flexbox、Grid**
- **LocalStorage** 本地儲存

### 建置工具
- **Vite** - 現代化前端建置工具

### AI 整合
- OpenAI API
- 自訂 API 端點

### 語音技術
- **Web Speech API** - 瀏覽器內建語音辨識與合成
- **Transformers.js** - 瀏覽器端機器學習

### 藍牙技術
- **Web Bluetooth API** - 瀏覽器藍牙連接

### 資料庫與儲存
- **LocalStorage** - 瀏覽器本地儲存
- **localForage** - 增強型本地儲存庫
- **Firebase Realtime Database** - 即時資料庫（選用）

---

## 更新日誌

### 2026-04-26
- **聊天通知引擎（Chat Notification Engine）**：
  - 新增 `chat-notification-engine.js` 模組
  - 支援用戶閒置時自動發送角色通知
  - 整合記憶系統與聊天上下文生成個性化通知
  - 支援靜音時段設定
  - 支援每日通知次數上限
- **系統通知管理器（SxNotification）**：
  - 新增 `sx-notification.js` 模組
  - 支援應用內通知堆疊顯示
  - 支援系統級通知（需用戶授權）
  - 支援通知中心管理
  - 支援 Service Worker 推送通知
- **蛾摩拉預設世界書**：
  - 新增 `蛾摩拉_chat_worldbook.json`（聊天版本）
  - 新增 `蛾摩拉_lofter_worldbook.json`（同人文版本）
  - 作者：小回 (discord@hui_chan)
  - 適配 Gemini、Claude、GPT-4o、DeepSeek、Kimi、GLM 等模型

### 2026-04-23
- **個人維基系統（Personal Wiki）**：
  - 新增圖像式記憶庫應用
  - 支援 User 百科與 Char 百科雙分頁
  - 實作 WikiEngine 知識圖譜引擎
  - 支援擴散激活檢索（Spreading Activation）
  - 支援自動關聯連結與關鍵詞索引
  - 支援時間軸視圖與 Notebook 導入
- **應用程式外觀設定系統**：
  - 新增 app-appearance-settings.js 模組
  - 各應用程式支援獨立外觀設定
  - 支援顏色、字體、排版、特效、自訂 CSS
  - 支援淺色/深色主題獨立設定
- **喚醒引擎增強**：
  - 優化每日喚醒流程
  - 新增昨日記憶回顧
  - 新增情感亮點提取
  - 新增 Wiki 上下文整合
- **睡眠引擎增強**：
  - 新增可配置睡眠時間
  - 新增睡眠前記憶處理
  - 新增睡眠後記憶鞏固
- **約會系統優化**：
  - 優化場景渲染器
  - 改善場景載入動畫
  - 增強互動體驗
- **編碼問題修復**：
  - 修復多個應用程式的繁體中文編碼問題
  - 修復漂流瓶、約會、街機廳等系統顯示問題
- **Facebook 設定應用**：
  - 新增好友管理功能
  - 新增帳號切換設定
- **主題商店增強**：
  - 新增自訂主題創建功能
  - 新增主題分類瀏覽

### 2026-04-20
- **三維記憶系統（Memory3D）重大升級**：
  - 新增五感自動提取（視覺、聽覺、嗅覺、味覺、觸覺）
  - 新增時空坐標記錄（時間、地點、情境）
  - 新增可配置睡眠週期（用戶自定義睡眠時間）
  - 新增每日喚醒流程（Dream 回憶過去 → Wake 準備互動）
  - 新增多維度融合檢索（感官+時空+情感並行檢索）
  - 新增本地優先存儲（短期記憶池 → Obsidian Vault）
  - 新增 MCP 工具：hold、recall_3d、feel_3d、sleep、awaken、dream
- **PWA 模式優化**：
  - 修正手機模式下畫面吸附位置（從頂部改為底部）
  - 改善 Safari 添加到桌面後的顯示效果

### 2026-04-19
- **記憶系統向量化升級計劃**
- **新增劇場應用程式（Theater）**

### 2026-04-18
- **核心功能修正**：
  - 修正滑動解鎖功能 bug
  - 修正懸浮球點擊無反應問題
- **瀏覽器適配增強**：
  - 新增雨見瀏覽器、Firefox、Via、XBrowser、UC Browser、QQ Browser 適配

### 2026-04
- 新增 Transformers.js Whisper 本機語音辨識
- 新增自動翻譯功能
- 新增語音訊息功能
- 新增語音通話錄音
- 改善 Safari 相容性
- 新增多語言支援
- 新增互動式塔羅占卜功能
- 支援三種塔羅牌系（偉特、托特、馬賽）
- 新增紫微斗數排盤
- 新增梅花易數占卜
- 新增流年運勢系統
- 新增查手機事件
- 新增角色封鎖系統
- 新增 Kakaopay 紅包/轉帳系統
- 新增自訂開機動畫
- 新增主題系統
- 新增桌面小工具
- 新增 GitHub 備份整合
- 新增 Passkey 藍牙應用

---

## 開源專案與資源

### 建置工具

| 專案 | 用途 | 連結 |
|-----|------|------|
| Vite | 前端建置工具 | [官網](https://vitejs.dev/) |

### 後端服務

| 專案 | 用途 | 連結 |
|-----|------|------|
| Ziwei Zenith | 紫微斗數排盤後端 | [GitHub](https://github.com/your-repo/ziwei-zenith) |
| lunar-ts | 農曆計算 | [npm](https://www.npmjs.com/package/lunar-ts) |
| fortel-ziweidoushu | 紫微斗數計算 | [npm](https://www.npmjs.com/package/fortel-ziweidoushu) |
| YuE | AI 音樂生成模型 | [GitHub](https://github.com/multimodal-art-projection/YuE) |

### 塔羅牌資料

| 專案 | 用途 | 連結 |
|-----|------|------|
| tarot-api | 偉特塔羅牌資料 API | [GitHub](https://github.com/ekelen/tarot-api) |
| Rider-Waite 1909 | 偉特塔羅牌圖像（公共領域） | [Sacred Texts](https://www.sacred-texts.com/tarot/xr/index.htm) |
| Thoth Tarot | 托特塔羅牌圖像 | [Wikimedia Commons](https://commons.wikimedia.org/wiki/Category:Thoth_Tarot) |
| Tarot de Marseille | 馬賽塔羅牌圖像 | [Wikimedia Commons](https://commons.wikimedia.org/wiki/Category:Tarot_de_Marseille) |

### AI 與語音

| 專案 | 用途 | 連結 |
|-----|------|------|
| Transformers.js | 瀏覽器端機器學習 | [GitHub](https://github.com/xenova/transformers.js) |
| OpenAI API | AI 對話與語音 | [OpenAI](https://openai.com/api/) |
| Whisper | 語音辨識模型 | [OpenAI](https://openai.com/research/whisper) |

### 記憶系統

| 專案 | 用途 | 連結 |
|-----|------|------|
| Ombre-Brain | 三維記憶系統設計參考 | [GitHub](https://github.com/P0luz/Ombre-Brain) |
| SullyOS | 記憶系統建置經驗指導 | [GitHub](https://github.com/qegj567-cloud/SullyOS) |

### 資料儲存

| 專案 | 用途 | 連結 |
|-----|------|------|
| localForage | 增強型本地儲存 | [GitHub](https://github.com/localForage/localForage) |
| Firebase | 即時資料庫 | [Firebase](https://firebase.google.com/) |

### 圖示與字型

| 專案 | 用途 | 連結 |
|-----|------|------|
| Font Awesome | 圖示庫 | [官網](https://fontawesome.com/) |
| Lucide | 圖示庫 | [官網](https://lucide.dev/) |
| Material Symbols | Google 圖示 | [Google Fonts](https://fonts.google.com/icons) |
| Great Vibes | 手寫藝術字型 | [Google Fonts](https://fonts.google.com/specimen/Great+Vibes) |

### Web API

| API | 用途 | 文件 |
|-----|------|------|
| Web Bluetooth API | 藍牙裝置連接 | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API) |
| Web Speech API | 語音辨識與合成 | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) |
| Web Audio API | 音訊處理 | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) |
| Service Worker API | PWA 離線支援 | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) |
| IndexedDB | 本地資料庫 | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) |

### 角色扮演資源

| 專案 | 用途 | 連結 |
|-----|------|------|
| SillyTavern | 角色對話平台參考 | [GitHub](https://github.com/SillyTavern/SillyTavern) |
| 象牙塔 | 預設角色設定 | 由電波系老師提供 |
| 蛾摩拉 | 預設角色設定 | 由小回老師提供 |
| 月讀預設系統 | 預設角色設定 | 由電波系老師提供 |

---

## 授權

本專案僅供學習和個人使用。開放二改，但需附上原 README 連結，開發者僅保留署名權。

---

## 貢獻

歡迎提交 Issue 和 Pull Request。

---

## 特別感謝

### 記憶系統建置經驗指導
- **SullyOS 製作者**：[GitHub](https://github.com/qegj567-cloud/SullyOS)
- **Ombre-Brain**：三維記憶系統設計參考 [GitHub](https://github.com/P0luz/Ombre-Brain)

### 預設資源提供
- **電波系老師**：開放內建使用象牙塔、月讀預設系統
- **小回老師**：開放內建使用蛾摩拉預設系統

### 社群貢獻
- **Linux.do站、旅程、類腦、堆堆、尾巴鎮、喵喵電波**的所有大佬
- 所有開源資料製作者
- 所有小手機使用者
- 參與測試的人員
- 給予回饋和等待的人
