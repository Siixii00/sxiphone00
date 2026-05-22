# 角色卡發送系統

加密角色卡發送與分享平台，部署於 Cloudflare Pages + Workers。

## 功能

- 創作者註冊與管理
- 角色卡加密上傳
- QR Code 與加密代碼分享
- 使用記錄追蹤

## 部署步驟

### 1. 建立 Cloudflare KV Namespace

```bash
wrangler kv:namespace create CARD_KV
```

記下輸出的 `id`，更新 `wrangler.toml` 中的 `id` 值。

### 2. 部署 Workers API

```bash
cd card-sender
wrangler deploy
```

部署完成後會獲得 Workers URL，例如 `https://card-sender-api.your-subdomain.workers.dev`

### 3. 部署前端到 Cloudflare Pages

方式一：透過 Cloudflare Dashboard
1. 連接 GitHub/GitLab 儲存庫
2. 選擇 `card-sender` 資料夾
3. 設定建置命令留空，輸出目錄為 `/`

方式二：使用 Wrangler

```bash
wrangler pages deploy . --project-name=card-sender
```

### 4. 設定 API URL

首次開啟網頁時，會提示輸入 API 網址。輸入步驟 2 部署的 Workers URL。

## API 端點

| 端點 | 方法 | 說明 |
|------|------|------|
| `/api/register` | POST | 註冊創作者 |
| `/api/cards` | GET | 獲取角色卡列表 |
| `/api/cards` | POST | 註冊新角色卡 |
| `/api/cards/:id` | DELETE | 刪除角色卡 |
| `/api/requestKey` | POST | 申請一次性金鑰 |
| `/api/confirmImport` | POST | 確認導入 |
| `/api/logs` | GET | 獲取使用記錄 |
| `/api/health` | GET | 健康檢查 |

## 加密代碼格式

Base64 編碼的 JSON 結構：

```json
{
  "version": "1.0",
  "cardId": "uuid",
  "creatorId": "uuid",
  "createdAt": 1234567890,
  "encryptedData": "base64",
  "iv": "base64",
  "tag": "base64"
}
```

## 本地開發

```bash
# 啟動 Workers 本地開發
wrangler dev

# 使用任意 HTTP 伺服器託管靜態檔案
npx serve .
```

## 安全注意事項

- 創作者金鑰 (creatorKey) 僅在註冊時顯示一次，請妥善保存
- 一次性金鑰有效期為 30 分鐘
- 所有 API 請求支援 CORS 跨域

## 授權

MIT