// 內建素材庫 - 使用Canvas繪製的基礎2D素材

const BuiltinAssets = {
    // 背景素材
    backgrounds: [
        {
            name: '草地',
            generate: (canvas) => {
                const ctx = canvas.getContext('2d');
                const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, '#90EE90');
                gradient.addColorStop(1, '#228B22');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // 添加草地紋理
                for (let i = 0; i < 100; i++) {
                    ctx.fillStyle = 'rgba(34, 139, 34, 0.3)';
                    ctx.fillRect(
                        Math.random() * canvas.width,
                        Math.random() * canvas.height,
                        2, 4
                    );
                }
            }
        },
        {
            name: '木地板',
            generate: (canvas) => {
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // 木紋
                for (let y = 0; y < canvas.height; y += 40) {
                    ctx.strokeStyle = 'rgba(139, 69, 19, 0.5)';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(0, y);
                    ctx.lineTo(canvas.width, y);
                    ctx.stroke();
                }
            }
        },
        {
            name: '石磚地',
            generate: (canvas) => {
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#808080';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // 磚塊
                const brickW = 40, brickH = 20;
                for (let y = 0; y < canvas.height; y += brickH) {
                    for (let x = 0; x < canvas.width; x += brickW) {
                        ctx.strokeStyle = '#555';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(x, y, brickW, brickH);
                    }
                }
            }
        },
        {
            name: '天空',
            generate: (canvas) => {
                const ctx = canvas.getContext('2d');
                const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, '#87CEEB');
                gradient.addColorStop(1, '#4682B4');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // 雲朵
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                for (let i = 0; i < 5; i++) {
                    const x = Math.random() * canvas.width;
                    const y = Math.random() * canvas.height * 0.5;
                    ctx.beginPath();
                    ctx.arc(x, y, 30, 0, Math.PI * 2);
                    ctx.arc(x + 20, y, 25, 0, Math.PI * 2);
                    ctx.arc(x + 40, y, 30, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    ],
    
    // 物件素材
    objects: [
        {
            name: '樹木',
            width: 60,
            height: 80,
            generate: (canvas) => {
                const ctx = canvas.getContext('2d');
                
                // 樹幹
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(25, 40, 10, 40);
                
                // 樹葉
                ctx.fillStyle = '#228B22';
                ctx.beginPath();
                ctx.arc(30, 30, 25, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#2E8B57';
                ctx.beginPath();
                ctx.arc(20, 35, 20, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(40, 35, 20, 0, Math.PI * 2);
                ctx.fill();
            }
        },
        {
            name: '房屋',
            width: 100,
            height: 80,
            generate: (canvas) => {
                const ctx = canvas.getContext('2d');
                
                // 牆壁
                ctx.fillStyle = '#D2691E';
                ctx.fillRect(10, 30, 80, 50);
                
                // 屋頂
                ctx.fillStyle = '#8B0000';
                ctx.beginPath();
                ctx.moveTo(50, 10);
                ctx.lineTo(5, 30);
                ctx.lineTo(95, 30);
                ctx.closePath();
                ctx.fill();
                
                // 門
                ctx.fillStyle = '#654321';
                ctx.fillRect(40, 50, 20, 30);
                
                // 窗戶
                ctx.fillStyle = '#87CEEB';
                ctx.fillRect(20, 40, 15, 15);
                ctx.fillRect(65, 40, 15, 15);
            }
        },
        {
            name: '長椅',
            width: 80,
            height: 40,
            generate: (canvas) => {
                const ctx = canvas.getContext('2d');
                
                // 座位
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(10, 15, 60, 10);
                
                // 靠背
                ctx.fillRect(10, 5, 5, 20);
                ctx.fillRect(65, 5, 5, 20);
                ctx.fillRect(10, 5, 60, 5);
                
                // 腿
                ctx.fillRect(15, 25, 5, 10);
                ctx.fillRect(60, 25, 5, 10);
            }
        },
        {
            name: '桌子',
            width: 80,
            height: 60,
            generate: (canvas) => {
                const ctx = canvas.getContext('2d');
                
                // 桌面
                ctx.fillStyle = '#8B7355';
                ctx.fillRect(10, 20, 60, 10);
                
                // 桌腿
                ctx.fillRect(15, 30, 5, 25);
                ctx.fillRect(60, 30, 5, 25);
            }
        },
        {
            name: '花朵',
            width: 40,
            height: 50,
            generate: (canvas) => {
                const ctx = canvas.getContext('2d');
                
                // 莖
                ctx.strokeStyle = '#228B22';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(20, 50);
                ctx.lineTo(20, 25);
                ctx.stroke();
                
                // 花瓣
                const petalColors = ['#FF69B4', '#FFB6C1', '#FF1493'];
                for (let i = 0; i < 5; i++) {
                    const angle = (i * Math.PI * 2) / 5;
                    const x = 20 + Math.cos(angle) * 8;
                    const y = 20 + Math.sin(angle) * 8;
                    
                    ctx.fillStyle = petalColors[i % petalColors.length];
                    ctx.beginPath();
                    ctx.arc(x, y, 6, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // 花心
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(20, 20, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        },
        {
            name: '路燈',
            width: 40,
            height: 100,
            generate: (canvas) => {
                const ctx = canvas.getContext('2d');
                
                // 燈柱
                ctx.fillStyle = '#696969';
                ctx.fillRect(18, 20, 4, 80);
                
                // 燈罩
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(20, 15, 10, 0, Math.PI * 2);
                ctx.fill();
                
                // 光暈
                const gradient = ctx.createRadialGradient(20, 15, 5, 20, 15, 20);
                gradient.addColorStop(0, 'rgba(255, 215, 0, 0.5)');
                gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(20, 15, 20, 0, Math.PI * 2);
                ctx.fill();
            }
        },
        {
            name: '噴泉',
            width: 80,
            height: 60,
            generate: (canvas) => {
                const ctx = canvas.getContext('2d');
                
                // 水池
                ctx.fillStyle = '#4682B4';
                ctx.beginPath();
                ctx.ellipse(40, 45, 35, 15, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // 水柱
                ctx.strokeStyle = '#87CEEB';
                ctx.lineWidth = 2;
                for (let i = 0; i < 5; i++) {
                    ctx.beginPath();
                    ctx.moveTo(40, 45);
                    ctx.quadraticCurveTo(
                        40 + (i - 2) * 5,
                        20,
                        40 + (i - 2) * 10,
                        45
                    );
                    ctx.stroke();
                }
            }
        },
        {
            name: '圍欄',
            width: 100,
            height: 40,
            generate: (canvas) => {
                const ctx = canvas.getContext('2d');
                
                ctx.fillStyle = '#8B4513';
                
                // 橫桿
                ctx.fillRect(0, 10, 100, 5);
                ctx.fillRect(0, 25, 100, 5);
                
                // 豎桿
                for (let x = 0; x < 100; x += 20) {
                    ctx.fillRect(x, 5, 5, 30);
                }
            }
        }
    ],
    
    // 生成素材並返回DataURL
    generateAsset(type, name) {
        const assets = type === 'background' ? this.backgrounds : this.objects;
        const asset = assets.find(a => a.name === name);
        if (!asset) return null;
        
        const canvas = document.createElement('canvas');
        if (type === 'background') {
            canvas.width = 800;
            canvas.height = 600;
        } else {
            canvas.width = asset.width;
            canvas.height = asset.height;
        }
        
        asset.generate(canvas);
        return canvas.toDataURL();
    },
    
    // 生成所有內建素材
    generateAll() {
        const result = {
            backgrounds: [],
            objects: []
        };
        
        this.backgrounds.forEach(bg => {
            result.backgrounds.push({
                name: bg.name,
                src: this.generateAsset('background', bg.name),
                builtin: true
            });
        });
        
        this.objects.forEach(obj => {
            result.objects.push({
                name: obj.name,
                src: this.generateAsset('object', obj.name),
                width: obj.width,
                height: obj.height,
                builtin: true
            });
        });
        
        return result;
    }
};

// 導出供其他模組使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BuiltinAssets;
}
