# iOS App打包指南 (IPA 簽署安裝)

本指南說明如何將 sxiphone打包成 iOS App，獲得獨立儲存空間，避免 Safari 清除資料。

---

## 方法一：使用 Capacitor (推薦)

Capacitor 是 Ionic 的原生橋接框架，可將 Web App 打包成原生 iOS App。

### 1. 安裝 Capacitor

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios
npx cap init sxiphone com.sxiphone.app --web-dir .
```

### 2. 建立 iOS 專案

```bash
npx cap add ios
```

### 3. 同步 Web 內容

每次修改後執行：
```bash
npx cap sync ios
```

### 4. 在 Xcode 中開啟

```bash
npx cap open ios
```

### 5. 配置 iOS專案

在 Xcode 中：
- 設定 Bundle Identifier (如：`com.yourname.sxiphone`)
- 設定版本號
- 添加必要的 Capacitor Plugins (如相機、檔案系統等)

### 6. 編譯 IPA

#### 使用免費 Apple ID 筽署 (7天有效)
1. 在 Xcode → Preferences → Accounts 添加 Apple ID
2.選擇 Team為你的個人 Apple ID
3. Build → Archive
4. Organizer → Distribute App → Ad Hoc

#### 使用付費開發者帳號 (1年有效)
1.選擇你的開發者 Team
2. Build → Archive
3. Organizer → Distribute App → App Store Distribution

---

## 方法二：使用 PWABuilder

PWABuilder 是 Microsoft提供的線上打包服務。

### 1. 確保 PWA manifest 正確

檢查 `manifest.json` 包含：
```json
{
    "name": "sxiphone",
    "short_name": "sxiphone",
    "start_url": "/",
    "display": "standalone",
    "icons": [
        { "src": "/apps/screenshots/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
        { "src": "/apps/screenshots/current.png", "sizes": "512x512", "type": "image/png" }
    ]
}
```

### 2. 使用 PWABuilder

1. 造訪 https://www.pwabuilder.com/
2.輸入你的網站 URL (需 HTTPS)
3. 點擊「Build My PWA」
4.選擇 iOS 平台
5. 下載生成的 Xcode 專案

### 3. 在 Xcode 中簽署

同上方法一的步驟 5-6。

---

## 方法三：使用 WebIntoApp

線上服務，適合沒有 Mac 的用戶。

### 1. 造訪 https://webintoapp.com/

### 2. 填寫資訊
- 網站 URL (需 HTTPS)
- App名稱
-選擇 iOS

### 3. 選擇簽署方式
- 免費簽署 (需自己有 Apple ID)
-付費簽署 (服務商代簽)

---

## 注意事項

### iOS App 儲存特性
- **獨立儲存空間**：不受 Safari 5MB 限制
- **更穩定**：系統不會在低儲存時清除
- **支援背景執行**：可實現真正的通知功能

### 簽署類型比較

| 簽署方式 | 有效期 |費用 |限制 |
|---------|-------|-----|------|
| 免費 Apple ID | 7天 | $0| 3 App上限，需定期重簽 |
| 開發者帳號 | 1年 | $99/年 | 無限制，可上架 App Store |
|企業簽署 | 1年 | $299/年 | 內部使用，可隨意分發 |
|第三方簽署 |不定 |不定 | 可能被撤銷 |

### 推薦配置

修改 `capacitor.config.json`：
```json
{
    "appId": "com.sxiphone.app",
    "appName": "sxiphone",
    "webDir": ".",
    "ios": {
        "contentInset": "automatic",
        "allowsLinkPreview": false,
        "scrollEnabled": true
    },
    "plugins": {
        "FileSystem": {
            "directory": "Documents"
        }
    }
}
```

---

## 快速安裝腳本

```bash
# 安裝 Capacitor
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/ios

# 初始化
npx cap init sxiphone com.sxiphone.app --web-dir .

# 建立 iOS 專案
npx cap add ios

# 同步
npx cap sync ios

# 開啟 Xcode
npx cap open ios
```

---

## 需要添加的 Capacitor Plugins

```bash
# 檔案系統 (持久化儲存)
npm install @capacitor/filesystem

# 相機 (拍照功能)
npm install @capacitor/camera

# 通知
npm install @capacitor/push-notifications

# 狀態列
npm install @capacitor/status-bar

# Splash Screen
npm install @capacitor/splash-screen
```

---

完成後，你的 sxiphone將成為真正的 iOS App，享有：
- 獨立儲存空間 (無 5MB限制)
- 不會被 iOS 清除資料
- 可離線使用
- 真正的 App體驗