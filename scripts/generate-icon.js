// 生成 SEVENTEEN 应援色渐变图标
// 运行: node scripts/generate-icon.js

const fs = require('fs');
const path = require('path');

// 创建一个简单的 SVG 然后输出
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="seventeen-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF6B9D"/>
      <stop offset="50%" style="stop-color:#FF8FB1"/>
      <stop offset="100%" style="stop-color:#00B4D8"/>
    </linearGradient>
  </defs>
  <!-- 圆角正方形背景 -->
  <rect x="32" y="32" width="448" height="448" rx="96" ry="96" fill="url(#seventeen-gradient)"/>
  <!-- S 字母 -->
  <text x="256" y="340" 
        font-family="'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif" 
        font-size="300" 
        font-weight="700" 
        fill="#ffffff" 
        text-anchor="middle"
        style="text-shadow: 0 4px 20px rgba(0,0,0,0.15);">S</text>
</svg>`;

// 保存 SVG
const outputPath = path.join(__dirname, '..', 'apps', 'screenshots', 'current.svg');
fs.writeFileSync(outputPath, svgContent, 'utf8');
console.log(`SVG 已保存到: ${outputPath}`);

// 输出 SVG 内容供复制
console.log('\n=== SVG 内容 ===');
console.log(svgContent);
console.log('\n提示: 可以在浏览器中打开 apps/screenshots/generate-icon.html 来生成 PNG 文件');
