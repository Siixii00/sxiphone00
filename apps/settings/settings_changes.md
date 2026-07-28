# Settings.js localStorage 替換摘要

## 已完成的替換

### 1. 核心函數更新

#### `t()` 和 `applyLanguageToUI()`
- 新增 `tAsync()` 和 `applyLanguageToUIAsync()` 函數
- 使用 `await sxGetItem('sxiphone_lang')` 替代 `localStorage.getItem('sxiphone_lang')`

#### `collectAppFolders()` 和 `restoreAppFolders()`
- 改為 async 函數
- 使用 `await sxGetItem()` 和 `await sxSetItem()`

#### `loadCharList()` 和 `saveCharList()`
- 簡化邏輯，使用 `sxGetJSON()` 和 `sxSetJSON()`

#### `loadUserList()` 和 `saveUserList()`
- 改為 async 函數
- 使用 `sxGetJSON()` 和 `sxSetJSON()`

#### `loadNpcList()` 和 `saveNpcList()`
- 改為 async 函數
- 使用 `sxGetJSON()` 和 `sxSetJSON()`

#### `saveAll()`
- 使用 `await sxGetItem()` 替代 `localStorage.getItem()`
- 使用 `await sxSetItem()` 替代 `localStorage.setItem()`
- 使用 `await sxSetJSON()` 替代 `JSON.stringify()` + `localStorage.setItem()`
- 調用 `await applyLanguageToUIAsync()` 而非同步版本的 `applyLanguageToUI()`

#### `saveUserMask()`
- 改為 async 函數
- 所有 `localStorage.setItem()` 改為 `await sxSetItem()`
- 調用 `await saveAll()`

#### `applySelectedChar()`
- 改為 async 函數
- 所有 `localStorage.getItem()` 改為 `await sxGetItem()`
- 所有 `localStorage.setItem()` 改為 `await sxSetItem()`

#### `refreshMemoryApiSelect()` 和 `refreshBoundUserSelect()`
- 改為 async 函數
- 使用 `await sxGetJSON()`

## 待手動替換的部分

由於檔案非常大（9651行），以下部分需要手動替換：

### 事件處理器中的 localStorage 操作

在事件處理器（如 `addEventListener`）中使用 localStorage 時，需要用 async IIFE 包裝：

```javascript
// 原本的同步代碼
someButton.addEventListener('click', () => {
    localStorage.setItem('key', value);
});

// 改為 async IIFE
someButton.addEventListener('click', async () => {
    await sxSetItem('key', value);
});
```

### `applySelectedUser()` 函數

需要將此函數改為 async 並替換所有 localStorage 操作。

### DOMContentLoaded 中的初始化邏輯

需要將以下代碼改為 async：
- `masks = JSON.parse(localStorage.getItem('sx_masks'))` → `masks = await sxGetJSON('sx_masks')`
- 所有自動回填邏輯中的 localStorage 讀取

### 其他需要替換的函數

1. `renderUserList()` - 內部調用 `loadUserList()`
2. `renderNpcList()` - 內部調用 `loadNpcList()`
3. `charSaveBtn` 的事件處理器
4. `userSaveBtn` 的事件處理器
5. `initStorage()` 函數
6. `handleImport()` 函數

## 替換規則參考

```javascript
// 1. localStorage.getItem
const value = localStorage.getItem('key');
// →
const value = await sxGetItem('key');

// 2. localStorage.setItem
localStorage.setItem('key', value);
// →
await sxSetItem('key', value);

// 3. localStorage.removeItem
localStorage.removeItem('key');
// →
await sxRemoveItem('key');

// 4. JSON.parse(localStorage.getItem())
const data = JSON.parse(localStorage.getItem('key') || '{}');
// →
const data = await sxGetJSON('key') || {};

// 5. localStorage.setItem(key, JSON.stringify(value))
localStorage.setItem('key', JSON.stringify(value));
// →
await sxSetJSON('key', value);
```

## 注意事項

1. 所有使用 localStorage 的函數都需要改為 async
2. 所有調用這些函數的地方都需要使用 await
3. 事件處理器需要改為 async 或使用 async IIFE
4. 確保 sx-helper.js 在 settings.js 之前載入