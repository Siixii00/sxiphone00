#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
場景編輯器素材拆分工具
自動將 tileset 圖片按照固定尺寸切割成獨立的小圖
"""

from PIL import Image
import os
import sys


def split_tileset(image_path, tile_size, output_dir, prefix="tile"):
    """
    拆分 tileset 圖片

    參數:
        image_path: 輸入圖片路徑
        tile_size: 每個 tile 的尺寸（正方形）
        output_dir: 輸出資料夾
        prefix: 輸出檔案名稱前綴
    """
    try:
        img = Image.open(image_path)
        width, height = img.size

        print(f"正在處理: {image_path}")
        print(f"圖片尺寸: {width}x{height}")
        print(f"Tile 尺寸: {tile_size}x{tile_size}")

        # 建立輸出資料夾
        os.makedirs(output_dir, exist_ok=True)

        tile_count = 0
        for y in range(0, height, tile_size):
            for x in range(0, width, tile_size):
                # 確保不會超出圖片邊界
                if x + tile_size <= width and y + tile_size <= height:
                    # 裁切 tile
                    tile = img.crop((x, y, x + tile_size, y + tile_size))

                    # 檢查是否為空白 tile（可選）
                    # 如果 tile 完全透明或全白，可以選擇跳過
                    extrema = tile.convert("RGBA").getextrema()
                    is_empty = all(e[0] == e[1] == 0 for e in extrema[:3])  # RGB 都是 0

                    if not is_empty:
                        # 儲存 tile
                        output_path = os.path.join(
                            output_dir, f"{prefix}_{tile_count:03d}.png"
                        )
                        tile.save(output_path)
                        tile_count += 1

        print(f"✓ 成功拆分 {tile_count} 個素材到 {output_dir}")
        return tile_count

    except Exception as e:
        print(f"✗ 錯誤: {e}")
        return 0


def batch_split():
    """
    批次處理所有 tileset
    """
    # 定義要處理的 tileset 列表
    tilesets = [
        # (檔案名稱, tile 尺寸, 輸出資料夾名稱, 前綴)
        ("open_tileset (2).png", 16, "tiles_rpg_16", "rpg"),
        ("Tileset 16 NES Sheet.png", 16, "tiles_nes_16", "nes"),
        ("Tilesheet-land-v5.png", 32, "tiles_land_32", "land"),
        ("Tilesheet-water.png", 32, "tiles_water_32", "water"),
        ("Tilesheet_snow.png", 32, "tiles_snow_32", "snow"),
        ("Tilesheets-nature.png", 32, "tiles_nature_32", "nature"),
        ("tiles-map.png", 32, "tiles_map_32", "map"),
        ("transparent-bg-tiles.png", 32, "tiles_transparent_32", "trans"),
    ]

    total_tiles = 0
    success_count = 0

    print("=" * 60)
    print("場景編輯器素材拆分工具")
    print("=" * 60)
    print()

    for filename, tile_size, output_dir, prefix in tilesets:
        image_path = filename

        # 檢查檔案是否存在
        if not os.path.exists(image_path):
            print(f"⊘ 跳過: {filename} (檔案不存在)")
            print()
            continue

        # 拆分 tileset
        count = split_tileset(image_path, tile_size, output_dir, prefix)

        if count > 0:
            total_tiles += count
            success_count += 1

        print()

    print("=" * 60)
    print(f"處理完成！")
    print(f"成功處理: {success_count} 個 tileset")
    print(f"總共拆分: {total_tiles} 個素材")
    print("=" * 60)


if __name__ == "__main__":
    # 檢查是否安裝 Pillow
    try:
        from PIL import Image
    except ImportError:
        print("錯誤: 需要安裝 Pillow 套件")
        print("請執行: pip install Pillow")
        sys.exit(1)

    # 如果有命令列參數，使用自訂模式
    if len(sys.argv) >= 4:
        image_path = sys.argv[1]
        tile_size = int(sys.argv[2])
        output_dir = sys.argv[3]
        prefix = sys.argv[4] if len(sys.argv) >= 5 else "tile"

        split_tileset(image_path, tile_size, output_dir, prefix)
    else:
        # 否則使用批次模式
        batch_split()
