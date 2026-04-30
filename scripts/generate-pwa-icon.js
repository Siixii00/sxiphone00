// 生成 SEVENTEEN 应援色渐变 PWA 图标 (PNG)
// 运行: node scripts/generate-pwa-icon.js

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'apps', 'screenshots');

// SEVENTEEN 应援色渐变: 珍珠粉 → 粉色 → 蓝色
const COLORS = {
    pinkStart: '#FF6B9D',
    pinkMid: '#FF8FB1',
    blueEnd: '#00B4D8'
};

// 解析 hex 颜色为 RGB
function hexToRgb(hex) {
    const raw = hex.replace('#', '');
    return {
        r: parseInt(raw.slice(0, 2), 16),
        g: parseInt(raw.slice(2, 4), 16),
        b: parseInt(raw.slice(4, 6), 16)
    };
}

// 线性插值两个颜色
function lerpColor(c1, c2, t) {
    return {
        r: Math.round(c1.r + (c2.r - c1.r) * t),
        g: Math.round(c1.g + (c2.g - c1.g) * t),
        b: Math.round(c1.b + (c2.b - c1.b) * t)
    };
}

function drawIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    const scale = size / 512;

    // 绘制圆角矩形背景（填满整个画布，无外框）
    const padding = 0;  // 无外框，填满
    const radius = 96 * scale;
    const w = size;
    const h = size;

    // 创建渐变
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, COLORS.pinkStart);
    gradient.addColorStop(0.5, COLORS.pinkMid);
    gradient.addColorStop(1, COLORS.blueEnd);

    // 绘制圆角矩形（填满整个画布）
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, radius);
    ctx.fillStyle = gradient;
    ctx.fill();

    // 绘制 S 字母 - 垂直居中
    ctx.fillStyle = '#ffffff';
    const fontSize = 300 * scale;
    ctx.font = `bold ${fontSize}px "Segoe UI", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';  // 垂直居中

    // 添加阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 15 * scale;
    ctx.shadowOffsetY = 4 * scale;

    // 完全居中
    ctx.fillText('S', size / 2, size / 2);

    return canvas;
}

// 生成不同尺寸的图标
const sizes = [512, 192, 180, 152, 120, 96, 72, 48];

console.log('生成 SEVENTEEN 应援色渐变 PWA 图标...\n');

sizes.forEach(size => {
    const canvas = drawIcon(size);
    const buffer = canvas.toBuffer('image/png');
    
    let filename;
    if (size === 512) filename = 'current.png';       // 主图标
    else if (size === 180) filename = 'apple-touch-icon.png';  // iOS Safari
    else filename = `icon-${size}x${size}.png`;
    
    const outputPath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(outputPath, buffer);
    console.log(`  ✓ ${filename} (${size}x${size})`);
});

// 同时输出 SVG 版本
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="seventeen-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF6B9D"/>
      <stop offset="50%" style="stop-color:#FF8FB1"/>
      <stop offset="100%" style="stop-color:#00B4D8"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="512" height="512" rx="96" ry="96" fill="url(#seventeen-gradient)"/>
  <text x="256" y="256" font-family="'SF Pro Display', -apple-system, sans-serif" font-size="300" font-weight="700" fill="#ffffff" text-anchor="middle" dominant-baseline="central">S</text>
</svg>`;

fs.writeFileSync(path.join(OUTPUT_DIR, 'icon.svg'), svgContent);
console.log('  ✓ icon.svg');

console.log('\n完成！所有图标已保存到 apps/screenshots/');
