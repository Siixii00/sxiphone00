const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, 'ivory_tower_worldbook.json');

const MODEL_WORLDBOOK_FILES = [
    'claude42_worldbook.json',
    'claude46_worldbook.json',
    'sonnet_worldbook.json',
    'opus_worldbook.json',
    '4o_worldbook.json',
    '5.2_worldbook.json',
    'gemini31_worldbook.json',
    'deepseek_worldbook.json',
    'deepseek2_worldbook.json',
    'kimi_worldbook.json',
    'kimi25_worldbook.json',
    'glm_worldbook.json',
    'minimax_worldbook.json',
    'grok42_worldbook.json',
    'mino_worldbook.json',
    'literary_style_worldbook.json'
];

function main() {
    console.log('讀取現有象牙塔預設...');
    const rawData = fs.readFileSync(OUTPUT_FILE, 'utf-8');
    const data = JSON.parse(rawData);
    
    console.log('\n載入模型特化世界書...');
    
    const categories = ['cot', 'style', 'global', 'keywords', 'backend'];
    let addedCount = 0;
    
    MODEL_WORLDBOOK_FILES.forEach(filename => {
        const filepath = path.join(__dirname, filename);
        if (!fs.existsSync(filepath)) {
            console.log(`  跳過不存在的檔案：${filename}`);
            return;
        }
        
        try {
            const modelRawData = fs.readFileSync(filepath, 'utf-8');
            const modelData = JSON.parse(modelRawData);
            
            categories.forEach(cat => {
                const key = `sx_worldbook_${cat}`;
                const entries = modelData[key] || [];
                
                entries.forEach(entry => {
                    // 強制設為預設關閉
                    entry.enabled = false;
                    
                    // 添加模型標籤到標題（如果還沒有）
                    if (!entry.title.startsWith('🔮')) {
                        entry.title = `🔮${entry.title}`;
                    }
                    
                    // 檢查是否已存在相同標題的條目
                    const existingTitles = data[key].map(e => e.title);
                    if (!existingTitles.includes(entry.title)) {
                        data[key].push(entry);
                        addedCount++;
                    }
                });
            });
            
            console.log(`  載入 ${filename} 成功`);
        } catch (err) {
            console.log(`  載入 ${filename} 失敗：${err.message}`);
        }
    });
    
    console.log(`\n新增 ${addedCount} 個條目`);
    
    // 統計
    const totalCount = categories.reduce((sum, cat) => {
        return sum + data[`sx_worldbook_${cat}`].length;
    }, 0);
    
    const enabledCount = categories.reduce((sum, cat) => {
        return sum + data[`sx_worldbook_${cat}`].filter(e => e.enabled).length;
    }, 0);
    
    console.log('\n最終統計：');
    categories.forEach(cat => {
        const key = `sx_worldbook_${cat}`;
        console.log(`  ${cat}: ${data[key].length} 條`);
    });
    
    console.log(`\n總條目：${totalCount} 條`);
    console.log(`默認啟用條目：${enabledCount} 條`);
    console.log(`默認關閉條目：${totalCount - enabledCount} 條`);
    
    // 將所有條目設為預設關閉（除了作者聲明）
    categories.forEach(cat => {
        const key = `sx_worldbook_${cat}`;
        data[key].forEach(entry => {
            if (entry.title !== '©️作者声明') {
                entry.enabled = false;
            }
        });
    });
    
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`\n輸出文件：${OUTPUT_FILE}`);
}

main();
