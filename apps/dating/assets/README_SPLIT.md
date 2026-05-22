# 素材拆分工具使用說明

## 安裝依賴

首先需要安裝 Python 的 Pillow 圖片處理套件：

```bash
pip install Pillow
```

## 使用方式

### 方法 1：批次處理（推薦）

直接執行腳本，會自動處理所有預設的 tileset：

```bash
cd E:\new\sxiphone00\apps\dating\assets
python split_tileset.py
```

這會自動拆分以下素材：
- `open_tileset (2).png` → `tiles_rpg_16/` (16x16)
- `Tileset 16 NES Sheet.png` → `tiles_nes_16/` (16x16)
- `Tilesheet-land-v5.png` → `tiles_land_32/` (32x32)
- `Tilesheet-water.png` → `tiles_water_32/` (32x32)
- `Tilesheet_snow.png` → `tiles_snow_32/` (32x32)
- `Tilesheets-nature.png` → `tiles_nature_32/` (32x32)
- `tiles-map.png` → `tiles_map_32/` (32x32)
- `transparent-bg-tiles.png` → `tiles_transparent_32/` (32x32)

### 方法 2：自訂拆分

如果要拆分其他圖片，可以指定參數：

```bash
python split_tileset.py <圖片路徑> <tile尺寸> <輸出資料夾> [前綴]
```

範例：
```bash
# 拆分 16x16 的 tileset
python split_tileset.py my_tileset.png 16 output_tiles tile

# 拆分 32x32 的 tileset，使用自訂前綴
python split_tileset.py water_tiles.png 32 water_output water
```

## 輸出結果

拆分後的素材會儲存在指定的資料夾中，檔名格式為：
```
<前綴>_000.png
<前綴>_001.png
<前綴>_002.png
...
```

## 注意事項

1. **空白 tile 會被跳過**：完全透明或全黑的 tile 不會被儲存
2. **邊界處理**：如果圖片尺寸不是 tile 尺寸的整數倍，邊緣不完整的 tile 會被跳過
3. **檔案格式**：輸出格式為 PNG，保留透明度

## 整合到場景編輯器

拆分完成後，你可以：

1. 將拆分後的資料夾移到 `assets/` 下
2. 更新 `scene-editor.js` 中的 `loadExternalAssets()` 函式
3. 加入新的素材路徑

範例：
```javascript
const externalAssets = [
    // 拆分後的素材
    { file: 'tiles_rpg_16/rpg_000.png', category: 'object', name: 'RPG-草地', tileSize: 16 },
    { file: 'tiles_rpg_16/rpg_001.png', category: 'object', name: 'RPG-水域', tileSize: 16 },
    // ... 更多素材
];
```

## 疑難排解

### 錯誤：ModuleNotFoundError: No module named 'PIL'

解決方法：
```bash
pip install Pillow
```

### 錯誤：FileNotFoundError

確認：
1. 圖片檔案存在於當前目錄
2. 檔案名稱正確（注意大小寫）
3. 檔案路徑正確

### 拆分出來的素材太多

如果不想要空白 tile，腳本已經自動過濾。如果還是太多，可以手動刪除不需要的素材。
