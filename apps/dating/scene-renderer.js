// 場景渲染器 - 精緻俯視角2D RPG風格

const SceneRenderer = {
    tileSize: 16,
    
    generateBackground(sceneKey, width = 800, height = 600) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        switch(sceneKey) {
            case 'cafe':
                this.drawCafeTiles(ctx, width, height);
                break;
            case 'park':
                this.drawParkTiles(ctx, width, height);
                break;
            case 'cinema':
                this.drawCinemaTiles(ctx, width, height);
                break;
            case 'restaurant':
                this.drawRestaurantTiles(ctx, width, height);
                break;
            case 'beach':
                this.drawBeachTiles(ctx, width, height);
                break;
            case 'library':
                this.drawLibraryTiles(ctx, width, height);
                break;
            default:
                this.drawDefaultTiles(ctx, width, height);
        }
        
        return canvas.toDataURL();
    },
    
    drawNoise(ctx, x, y, w, h, density = 0.3) {
        for (let i = 0; i < w * h * density / 10; i++) {
            const nx = x + Math.random() * w;
            const ny = y + Math.random() * h;
            const alpha = 0.1 + Math.random() * 0.2;
            ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
            ctx.fillRect(nx, ny, 1, 1);
        }
    },
    
    drawCafeTiles(ctx, w, h) {
        const ts = this.tileSize;
        
        const baseColor = '#C49A6C';
        const highlightColor = '#D4A574';
        const shadowColor = '#B8865A';
        const depthColor = '#A07840';
        
        for (let y = 0; y < h; y += ts) {
            for (let x = 0; x < w; x += ts) {
                const isAlt = ((x / ts) + (y / ts)) % 2 === 0;
                const base = isAlt ? baseColor : highlightColor;
                
                ctx.fillStyle = base;
                ctx.fillRect(x, y, ts, ts);
                
                ctx.fillStyle = isAlt ? highlightColor : baseColor;
                ctx.fillRect(x, y, ts, 2);
                ctx.fillRect(x, y, 2, ts);
                
                ctx.fillStyle = shadowColor;
                ctx.fillRect(x + ts - 2, y, 2, ts);
                ctx.fillRect(x, y + ts - 2, ts, 2);
                
                ctx.fillStyle = depthColor;
                ctx.fillRect(x + ts - 2, y + ts - 2, 2, 2);
            }
        }
        
        const carpetX = w * 0.15;
        const carpetY = h * 0.25;
        const carpetW = w * 0.7;
        const carpetH = h * 0.55;
        
        const carpetMain = '#8B1A1A';
        const carpetHighlight = '#A52A2A';
        const carpetShadow = '#6B0F0F';
        const carpetDepth = '#4A0A0A';
        
        ctx.fillStyle = carpetShadow;
        ctx.fillRect(carpetX - 3, carpetY - 3, carpetW + 6, carpetH + 6);
        
        ctx.fillStyle = carpetMain;
        ctx.fillRect(carpetX, carpetY, carpetW, carpetH);
        
        ctx.fillStyle = carpetHighlight;
        ctx.fillRect(carpetX, carpetY, carpetW, 3);
        ctx.fillRect(carpetX, carpetY, 3, carpetH);
        
        ctx.fillStyle = carpetShadow;
        ctx.fillRect(carpetX + carpetW - 3, carpetY, 3, carpetH);
        ctx.fillRect(carpetX, carpetY + carpetH - 3, carpetW, 3);
        
        ctx.fillStyle = carpetDepth;
        ctx.fillRect(carpetX + carpetW - 3, carpetY + carpetH - 3, 3, 3);
        
        ctx.strokeStyle = '#DAA520';
        ctx.lineWidth = 3;
        ctx.strokeRect(carpetX + 10, carpetY + 10, carpetW - 20, carpetH - 20);
        
        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 2;
        const patternSize = 25;
        for (let py = carpetY + 20; py < carpetY + carpetH - 20; py += patternSize) {
            for (let px = carpetX + 20; px < carpetX + carpetW - 20; px += patternSize) {
                ctx.fillStyle = carpetHighlight;
                ctx.fillRect(px - 3, py - 3, 6, 6);
            }
        }
        
        ctx.fillStyle = 'rgba(255, 200, 100, 0.12)';
        ctx.beginPath();
        ctx.ellipse(w * 0.3, h * 0.15, 80, 40, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(w * 0.7, h * 0.15, 80, 40, 0, 0, Math.PI * 2);
        ctx.fill();
        
        this.drawNoise(ctx, 0, 0, w, h, 0.1);
    },
    
    drawParkTiles(ctx, w, h) {
        const ts = this.tileSize;
        
        const grassMain = '#7CB342';
        const grassHighlight = '#8BC34A';
        const grassShadow = '#689F38';
        const grassDark = '#558B2F';
        
        for (let y = 0; y < h; y += ts) {
            for (let x = 0; x < w; x += ts) {
                const variation = Math.random() * 0.3;
                const base = variation > 0.15 ? grassMain : grassHighlight;
                
                ctx.fillStyle = base;
                ctx.fillRect(x, y, ts, ts);
                
                ctx.fillStyle = grassHighlight;
                ctx.fillRect(x, y, ts, 2);
                ctx.fillRect(x, y, 2, ts);
                
                ctx.fillStyle = grassShadow;
                ctx.fillRect(x + ts - 2, y, 2, ts);
                ctx.fillRect(x, y + ts - 2, ts, 2);
                
                ctx.fillStyle = grassDark;
                ctx.fillRect(x + ts - 2, y + ts - 2, 2, 2);
                
                for (let i = 0; i < 3; i++) {
                    const gx = x + Math.random() * (ts - 2);
                    const gy = y + Math.random() * (ts - 2);
                    ctx.fillStyle = grassDark;
                    ctx.fillRect(gx, gy, 1, 2 + Math.random() * 2);
                }
            }
        }
        
        const pathX = w * 0.35;
        const pathW = w * 0.3;
        
        const stoneMain = '#D4C4A8';
        const stoneHighlight = '#E8DCC8';
        const stoneShadow = '#B8A888';
        const stoneDepth = '#9A8A6A';
        
        for (let y = 0; y < h; y += ts) {
            const curve = Math.sin(y * 0.02) * 20;
            for (let x = pathX + curve; x < pathX + pathW + curve; x += ts) {
                ctx.fillStyle = stoneMain;
                ctx.fillRect(x, y, ts, ts);
                
                ctx.fillStyle = stoneHighlight;
                ctx.fillRect(x, y, ts, 2);
                ctx.fillRect(x, y, 2, ts);
                
                ctx.fillStyle = stoneShadow;
                ctx.fillRect(x + ts - 2, y, 2, ts);
                ctx.fillRect(x, y + ts - 2, ts, 2);
                
                if (Math.random() > 0.6) {
                    ctx.fillStyle = stoneDepth;
                    ctx.fillRect(x + 4 + Math.random() * 4, y + 4 + Math.random() * 4, 3, 3);
                }
            }
        }
        
        ctx.fillStyle = 'rgba(135, 206, 235, 0.25)';
        ctx.beginPath();
        ctx.ellipse(w * 0.2, h * 0.1, 100, 30, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(w * 0.8, h * 0.15, 80, 25, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        this.drawNoise(ctx, 0, 0, w, h, 0.08);
    },
    
    drawCinemaTiles(ctx, w, h) {
        const ts = this.tileSize;
        
        const floorMain = '#1E1E3F';
        const floorHighlight = '#2A2A5A';
        const floorShadow = '#161630';
        const floorDepth = '#0D0D1F';
        
        for (let y = 0; y < h; y += ts) {
            for (let x = 0; x < w; x += ts) {
                const distFromCenter = Math.sqrt(Math.pow(x - w / 2, 2) + Math.pow(y - h / 2, 2));
                const isDarker = distFromCenter > w * 0.3;
                
                ctx.fillStyle = isDarker ? floorDepth : floorMain;
                ctx.fillRect(x, y, ts, ts);
                
                ctx.fillStyle = isDarker ? floorMain : floorHighlight;
                ctx.fillRect(x, y, ts, 2);
                ctx.fillRect(x, y, 2, ts);
                
                ctx.fillStyle = floorShadow;
                ctx.fillRect(x + ts - 2, y, 2, ts);
                ctx.fillRect(x, y + ts - 2, ts, 2);
            }
        }
        
        const aisleX = w * 0.45;
        const aisleW = w * 0.1;
        
        const aisleMain = '#2A2A4A';
        const aisleHighlight = '#3A3A5A';
        const aisleShadow = '#1A1A3A';
        
        for (let y = 0; y < h; y += ts) {
            for (let x = aisleX; x < aisleX + aisleW; x += ts) {
                ctx.fillStyle = aisleMain;
                ctx.fillRect(x, y, ts, ts);
                
                ctx.fillStyle = aisleHighlight;
                ctx.fillRect(x, y, ts, 2);
                ctx.fillRect(x, y, 2, ts);
                
                ctx.fillStyle = aisleShadow;
                ctx.fillRect(x + ts - 2, y, 2, ts);
                ctx.fillRect(x, y + ts - 2, ts, 2);
            }
        }
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        for (let i = 0; i < 20; i++) {
            const sx = Math.random() * w;
            const sy = Math.random() * h;
            ctx.fillRect(sx, sy, 2, 2);
        }
        
        this.drawNoise(ctx, 0, 0, w, h, 0.06);
    },
    
    drawRestaurantTiles(ctx, w, h) {
        const ts = this.tileSize;
        
        const tileDark = '#1A0F0A';
        const tileDarkHighlight = '#2A1A12';
        const tileDarkShadow = '#0A0505';
        const tileLight = '#3D2314';
        const tileLightHighlight = '#4D3020';
        const tileLightShadow = '#2D180A';
        
        for (let y = 0; y < h; y += ts) {
            for (let x = 0; x < w; x += ts) {
                const isDark = ((x / ts) + (y / ts)) % 2 === 0;
                
                const main = isDark ? tileDark : tileLight;
                const highlight = isDark ? tileDarkHighlight : tileLightHighlight;
                const shadow = isDark ? tileDarkShadow : tileLightShadow;
                
                ctx.fillStyle = main;
                ctx.fillRect(x, y, ts, ts);
                
                ctx.fillStyle = highlight;
                ctx.fillRect(x, y, ts, 2);
                ctx.fillRect(x, y, 2, ts);
                
                ctx.fillStyle = shadow;
                ctx.fillRect(x + ts - 2, y, 2, ts);
                ctx.fillRect(x, y + ts - 2, ts, 2);
                
                ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
                ctx.fillRect(x + 2, y + 2, ts * 0.5, ts * 0.5);
            }
        }
        
        const candlePositions = [
            [w * 0.25, h * 0.3], [w * 0.75, h * 0.3],
            [w * 0.5, h * 0.6], [w * 0.2, h * 0.7], [w * 0.8, h * 0.7]
        ];
        
        candlePositions.forEach(([cx, cy]) => {
            const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60);
            glow.addColorStop(0, 'rgba(255, 200, 100, 0.25)');
            glow.addColorStop(0.5, 'rgba(255, 150, 50, 0.12)');
            glow.addColorStop(1, 'rgba(255, 100, 0, 0)');
            ctx.fillStyle = glow;
            ctx.fillRect(cx - 60, cy - 60, 120, 120);
        });
        
        this.drawNoise(ctx, 0, 0, w, h, 0.1);
    },
    
    drawBeachTiles(ctx, w, h) {
        const ts = this.tileSize;
        
        const waterMain = '#4A90D0';
        const waterHighlight = '#5AA0E0';
        const waterShadow = '#3A70A0';
        const waterDeep = '#2A5080';
        
        for (let y = 0; y < h * 0.45; y += ts) {
            const depth = y / (h * 0.45);
            for (let x = 0; x < w; x += ts) {
                const wave = Math.sin(x * 0.05 + y * 0.1) * 0.3;
                const isLight = wave > 0;
                
                const main = isLight ? waterHighlight : waterMain;
                const shadow = isLight ? waterMain : waterShadow;
                
                ctx.fillStyle = main;
                ctx.fillRect(x, y, ts, ts);
                
                ctx.fillStyle = waterHighlight;
                ctx.fillRect(x, y, ts, 2);
                ctx.fillRect(x, y, 2, ts);
                
                ctx.fillStyle = shadow;
                ctx.fillRect(x + ts - 2, y, 2, ts);
                ctx.fillRect(x, y + ts - 2, ts, 2);
                
                if (Math.random() > 0.85) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                    const waveY = y + Math.sin(x * 0.1) * 3;
                    ctx.fillRect(x, waveY, ts, 2);
                }
            }
        }
        
        const foamY = h * 0.43;
        for (let x = 0; x < w; x += ts) {
            const foamHeight = 5 + Math.sin(x * 0.1) * 3 + Math.random() * 5;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.fillRect(x, foamY + Math.sin(x * 0.2) * 3, ts, foamHeight);
        }
        
        const sandMain = '#F0D8A0';
        const sandHighlight = '#FFE8B0';
        const sandShadow = '#D8C090';
        const sandDepth = '#C0A878';
        
        for (let y = h * 0.45; y < h; y += ts) {
            const sandVariation = (y - h * 0.45) / (h * 0.55);
            for (let x = 0; x < w; x += ts) {
                const noise = Math.sin(x * 0.03) * Math.cos(y * 0.05) * 0.3;
                const isLight = noise > 0;
                
                ctx.fillStyle = isLight ? sandHighlight : sandMain;
                ctx.fillRect(x, y, ts, ts);
                
                ctx.fillStyle = sandHighlight;
                ctx.fillRect(x, y, ts, 2);
                ctx.fillRect(x, y, 2, ts);
                
                ctx.fillStyle = sandShadow;
                ctx.fillRect(x + ts - 2, y, 2, ts);
                ctx.fillRect(x, y + ts - 2, ts, 2);
                
                for (let i = 0; i < 2; i++) {
                    ctx.fillStyle = sandDepth;
                    ctx.fillRect(
                        x + Math.random() * (ts - 2),
                        y + Math.random() * (ts - 2),
                        1 + Math.random(), 1 + Math.random()
                    );
                }
            }
        }
        
        ctx.fillStyle = 'rgba(255, 255, 200, 0.12)';
        ctx.beginPath();
        ctx.ellipse(w * 0.8, h * 0.1, 100, 60, 0, 0, Math.PI * 2);
        ctx.fill();
        
        this.drawNoise(ctx, 0, 0, w, h, 0.08);
    },
    
    drawLibraryTiles(ctx, w, h) {
        const ts = this.tileSize;
        
        const woodMain = '#8B7355';
        const woodHighlight = '#A0826D';
        const woodShadow = '#6B5344';
        const woodDepth = '#5B4334';
        
        for (let y = 0; y < h; y += ts) {
            for (let x = 0; x < w; x += ts) {
                const grain = Math.sin(y * 0.2 + x * 0.05) * 0.3;
                const isLight = grain > 0;
                
                ctx.fillStyle = isLight ? woodHighlight : woodMain;
                ctx.fillRect(x, y, ts, ts);
                
                ctx.fillStyle = woodHighlight;
                ctx.fillRect(x, y, ts, 2);
                ctx.fillRect(x, y, 2, ts);
                
                ctx.fillStyle = woodShadow;
                ctx.fillRect(x + ts - 2, y, 2, ts);
                ctx.fillRect(x, y + ts - 2, ts, 2);
                
                ctx.fillStyle = woodDepth;
                ctx.fillRect(x + ts - 2, y + ts - 2, 2, 2);
                
                const lineY = y + ts * 0.5 + Math.sin(x * 0.1) * 2;
                ctx.fillStyle = woodDepth;
                ctx.fillRect(x, lineY, ts, 1);
            }
        }
        
        ctx.fillStyle = 'rgba(255, 240, 200, 0.12)';
        ctx.beginPath();
        ctx.ellipse(w * 0.5, h * 0.3, 150, 80, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(w * 0.3, h * 0.6, 100, 60, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(w * 0.7, h * 0.6, 100, 60, 0, 0, Math.PI * 2);
        ctx.fill();
        
        this.drawNoise(ctx, 0, 0, w, h, 0.1);
    },
    
    drawDefaultTiles(ctx, w, h) {
        const ts = this.tileSize;
        
        const gradient = ctx.createLinearGradient(0, 0, w, h);
        gradient.addColorStop(0, '#E8E8E8');
        gradient.addColorStop(1, '#D0D0D0');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
        
        for (let y = 0; y < h; y += ts) {
            for (let x = 0; x < w; x += ts) {
                const isLight = ((x / ts) + (y / ts)) % 2 === 0;
                ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.1)';
                ctx.fillRect(x, y, ts, ts);
            }
        }
        
        this.drawNoise(ctx, 0, 0, w, h, 0.1);
    },
    
    drawObject(ctx, obj) {
        ctx.save();
        
        switch(obj.type) {
            case 'table':
                this.drawTableTop(ctx, obj.x, obj.y, obj.width, obj.height);
                break;
            case 'chair':
                this.drawChairTop(ctx, obj.x, obj.y, obj.width, obj.height);
                break;
            case 'counter':
                this.drawCounterTop(ctx, obj.x, obj.y, obj.width, obj.height);
                break;
            case 'bench':
                this.drawBenchTop(ctx, obj.x, obj.y, obj.width, obj.height);
                break;
            case 'tree':
                this.drawTreeTop(ctx, obj.x, obj.y, obj.width, obj.height);
                break;
            case 'flower':
                this.drawFlowerTop(ctx, obj.x, obj.y, obj.width, obj.height);
                break;
            case 'screen':
                this.drawScreenTop(ctx, obj.x, obj.y, obj.width, obj.height);
                break;
            case 'seats':
                this.drawSeatsTop(ctx, obj.x, obj.y, obj.width, obj.height);
                break;
            case 'candle':
                this.drawCandleTop(ctx, obj.x, obj.y, obj.width, obj.height);
                break;
            case 'umbrella':
                this.drawUmbrellaTop(ctx, obj.x, obj.y, obj.width, obj.height);
                break;
            case 'towel':
                this.drawTowelTop(ctx, obj.x, obj.y, obj.width, obj.height);
                break;
            case 'bookshelf':
                this.drawBookshelfTop(ctx, obj.x, obj.y, obj.width, obj.height);
                break;
            case 'plant':
                this.drawPlantTop(ctx, obj.x, obj.y, obj.width, obj.height);
                break;
            case 'path':
                break;
        }
        
        ctx.restore();
    },
    
    adjustColor(hex, amt) {
        let r = parseInt(hex.slice(1, 3), 16);
        let g = parseInt(hex.slice(3, 5), 16);
        let b = parseInt(hex.slice(5, 7), 16);
        r = Math.max(0, Math.min(255, r + amt));
        g = Math.max(0, Math.min(255, g + amt));
        b = Math.max(0, Math.min(255, b + amt));
        return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
    },
    
    drawShadow(ctx, x, y, w, h, blur = 5) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h + 3, w / 2 + blur, blur, 0, 0, Math.PI * 2);
        ctx.fill();
    },
    
    drawTableTop(ctx, x, y, w, h) {
        this.drawShadow(ctx, x, y, w, h, 8);
        
        const tableTop = '#C9A66B';
        const tableMain = '#A07840';
        const tableShadow = '#704820';
        const tableDepth = '#503010';
        
        ctx.fillStyle = tableMain;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 8);
        ctx.fill();
        
        ctx.fillStyle = tableTop;
        ctx.fillRect(x + 2, y + 2, w - 4, 4);
        ctx.fillRect(x + 2, y + 2, 4, h - 8);
        
        ctx.fillStyle = tableShadow;
        ctx.fillRect(x + w - 6, y + 2, 4, h - 8);
        ctx.fillRect(x + 2, y + h - 6, w - 4, 4);
        
        ctx.fillStyle = tableDepth;
        ctx.fillRect(x + 4, y + h, w - 8, 6);
        ctx.fillStyle = adjustColor(tableDepth, -15);
        ctx.fillRect(x, y + h, 4, 6);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(x + 6, y + 6, w - 12, 3);
        
        ctx.strokeStyle = tableShadow;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 8);
        ctx.stroke();
    },
    
    drawChairTop(ctx, x, y, w, h) {
        this.drawShadow(ctx, x, y, w, h, 4);
        
        const chairTop = '#A07840';
        const chairMain = '#8B5A2B';
        const chairShadow = '#5D3A1A';
        const chairDepth = '#4A2F1A';
        
        ctx.fillStyle = chairMain;
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 2, w - 4, h - 4, 6);
        ctx.fill();
        
        ctx.fillStyle = chairTop;
        ctx.fillRect(x + 4, y + 4, w - 8, 3);
        ctx.fillRect(x + 4, y + 4, 3, h - 8);
        
        ctx.fillStyle = chairShadow;
        ctx.fillRect(x + w - 7, y + 4, 3, h - 8);
        ctx.fillRect(x + 4, y + h - 7, w - 8, 3);
        
        ctx.fillStyle = chairDepth;
        ctx.fillRect(x + 6, y + h, w - 12, 4);
        ctx.fillStyle = adjustColor(chairDepth, -15);
        ctx.fillRect(x + 2, y + h, 4, 4);
        
        ctx.fillStyle = chairShadow;
        ctx.fillRect(x + 4, y - h * 0.25, w - 8, h * 0.3);
        ctx.fillStyle = adjustColor(chairShadow, -15);
        ctx.fillRect(x + w - 8, y - h * 0.25, 4, h * 0.3);
        
        ctx.strokeStyle = chairShadow;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 2, w - 4, h - 4, 6);
        ctx.stroke();
    },
    
    drawCounterTop(ctx, x, y, w, h) {
        this.drawShadow(ctx, x, y, w, h, 10);
        
        const counterTop = '#D2691E';
        const counterMain = '#8B4513';
        const counterShadow = '#654321';
        const counterDepth = '#4A2F1A';
        
        ctx.fillStyle = counterMain;
        ctx.fillRect(x, y, w, h);
        
        ctx.fillStyle = counterTop;
        ctx.fillRect(x + 3, y + 3, w - 6, 6);
        ctx.fillRect(x + 3, y + 3, 6, h - 6);
        
        ctx.fillStyle = counterShadow;
        ctx.fillRect(x + w - 9, y + 3, 6, h - 6);
        ctx.fillRect(x + 3, y + h - 9, w - 6, 6);
        
        ctx.fillStyle = counterDepth;
        ctx.fillRect(x + 6, y + h, w - 12, 8);
        ctx.fillStyle = adjustColor(counterDepth, -15);
        ctx.fillRect(x, y + h, 6, 8);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(x + 8, y + 6, w - 16, 3);
        
        ctx.strokeStyle = counterShadow;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);
        
        for (let i = 0; i < 3; i++) {
            const cx = x + 30 + i * 80;
            ctx.fillStyle = '#2F4F4F';
            ctx.beginPath();
            ctx.ellipse(cx, y + h * 0.5, 12, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.ellipse(cx - 3, y + h * 0.45, 4, 3, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    },
    
    drawBenchTop(ctx, x, y, w, h) {
        this.drawShadow(ctx, x, y, w, h, 6);
        
        const benchTop = '#A0522D';
        const benchMain = '#8B4513';
        const benchShadow = '#654321';
        const benchDepth = '#4A2F1A';
        
        ctx.fillStyle = benchMain;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 4);
        ctx.fill();
        
        ctx.fillStyle = benchTop;
        ctx.fillRect(x + 2, y + 2, w - 4, 4);
        ctx.fillRect(x + 2, y + 2, 4, h - 4);
        
        ctx.fillStyle = benchShadow;
        ctx.fillRect(x + w - 6, y + 2, 4, h - 4);
        ctx.fillRect(x + 2, y + h - 6, w - 4, 4);
        
        ctx.fillStyle = benchDepth;
        ctx.fillRect(x + 4, y + h, w - 8, 5);
        ctx.fillStyle = adjustColor(benchDepth, -15);
        ctx.fillRect(x, y + h, 4, 5);
        
        ctx.fillStyle = benchShadow;
        ctx.fillRect(x + 5, y - h * 0.15, w - 10, h * 0.2);
        ctx.fillStyle = adjustColor(benchShadow, -15);
        ctx.fillRect(x + w - 9, y - h * 0.15, 4, h * 0.2);
        
        ctx.strokeStyle = benchShadow;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 4);
        ctx.stroke();
        
        for (let i = 0; i < 3; i++) {
            const lx = x + 15 + i * (w / 3);
            ctx.fillStyle = benchDepth;
            ctx.fillRect(lx, y + h + 2, 8, 12);
            ctx.fillStyle = adjustColor(benchDepth, -20);
            ctx.fillRect(lx + 6, y + h + 2, 2, 12);
        }
    },
    
    drawTreeTop(ctx, x, y, w, h) {
        this.drawShadow(ctx, x, y, w, h * 0.3, 15);
        
        const leafTop = '#4CAF50';
        const leafMain = '#388E3C';
        const leafShadow = '#2E7D32';
        const leafDepth = '#1B5E20';
        const trunkMain = '#8B4513';
        const trunkShadow = '#5D3A1A';
        const trunkDepth = '#4A2F1A';
        
        const layers = [
            { radius: w * 0.45, offsetY: 0 },
            { radius: w * 0.38, offsetY: 8 },
            { radius: w * 0.30, offsetY: 16 },
            { radius: w * 0.20, offsetY: 24 }
        ];
        
        layers.forEach((layer, idx) => {
            const cx = x + w / 2;
            const cy = y + h * 0.35 + layer.offsetY;
            const r = layer.radius;
            
            ctx.fillStyle = leafMain;
            ctx.fillRect(cx - r, cy - r * 0.8, r * 2, r * 1.6);
            ctx.fillRect(cx - r * 0.8, cy - r, r * 1.6, r * 2);
            
            ctx.fillStyle = leafTop;
            ctx.fillRect(cx - r, cy - r * 0.8, r * 0.3, r * 1.6);
            ctx.fillRect(cx - r * 0.8, cy - r, r * 1.6, r * 0.3);
            
            ctx.fillStyle = leafShadow;
            ctx.fillRect(cx + r * 0.7, cy - r * 0.8, r * 0.3, r * 1.6);
            ctx.fillRect(cx - r * 0.8, cy + r * 0.7, r * 1.6, r * 0.3);
        });
        
        const trunkW = w * 0.18;
        const trunkH = h * 0.25;
        const trunkX = x + w / 2 - trunkW / 2;
        const trunkY = y + h * 0.45;
        
        ctx.fillStyle = trunkMain;
        ctx.fillRect(trunkX, trunkY, trunkW, trunkH);
        
        ctx.fillStyle = trunkShadow;
        ctx.fillRect(trunkX + trunkW - 3, trunkY, 3, trunkH);
        
        ctx.fillStyle = trunkDepth;
        ctx.fillRect(trunkX + 2, trunkY + trunkH, trunkW - 4, 4);
        ctx.fillStyle = adjustColor(trunkDepth, -15);
        ctx.fillRect(trunkX, trunkY + trunkH, 2, 4);
    },
    
    drawFlowerTop(ctx, x, y, w, h) {
        this.drawShadow(ctx, x, y, w, h * 0.3, 3);
        
        const petalTop = '#FFB6C1';
        const petalMain = '#FF69B4';
        const petalShadow = '#DB7093';
        const centerTop = '#FFD700';
        const centerMain = '#FFA500';
        const centerShadow = '#FF8C00';
        const stemMain = '#228B22';
        const stemShadow = '#1B5E20';
        
        const petalCount = 5;
        const cx = x + w / 2;
        const cy = y + h * 0.4;
        
        for (let i = 0; i < petalCount; i++) {
            const angle = (i * Math.PI * 2) / petalCount;
            const px = cx + Math.cos(angle) * w * 0.25;
            const py = cy + Math.sin(angle) * h * 0.2;
            const petalW = w * 0.22;
            const petalH = w * 0.18;
            
            ctx.fillStyle = petalMain;
            ctx.fillRect(px - petalW / 2, py - petalH / 2, petalW, petalH);
            
            ctx.fillStyle = petalTop;
            ctx.fillRect(px - petalW / 2, py - petalH / 2, 3, petalH);
            ctx.fillRect(px - petalW / 2, py - petalH / 2, petalW, 3);
            
            ctx.fillStyle = petalShadow;
            ctx.fillRect(px + petalW / 2 - 3, py - petalH / 2, 3, petalH);
            ctx.fillRect(px - petalW / 2, py + petalH / 2 - 3, petalW, 3);
        }
        
        const centerR = w * 0.12;
        ctx.fillStyle = centerMain;
        ctx.fillRect(cx - centerR, cy - centerR, centerR * 2, centerR * 2);
        
        ctx.fillStyle = centerTop;
        ctx.fillRect(cx - centerR, cy - centerR, 3, centerR * 2);
        ctx.fillRect(cx - centerR, cy - centerR, centerR * 2, 3);
        
        ctx.fillStyle = centerShadow;
        ctx.fillRect(cx + centerR - 3, cy - centerR, 3, centerR * 2);
        ctx.fillRect(cx - centerR, cy + centerR - 3, centerR * 2, 3);
        
        ctx.fillStyle = stemMain;
        ctx.fillRect(cx - 2, cy + centerR, 4, h * 0.35);
        
        ctx.fillStyle = stemShadow;
        ctx.fillRect(cx, cy + centerR, 2, h * 0.35);
    },

    drawScreenTop(ctx, x, y, w, h) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(x + 5, y + 5, w, h);
        
        const frameTop = '#4a5568';
        const frameMain = '#2d3748';
        const frameShadow = '#1a202c';
        const screenMain = '#1a1a2e';
        const screenHighlight = '#16213e';
        
        ctx.fillStyle = frameMain;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 4);
        ctx.fill();
        
        ctx.fillStyle = frameTop;
        ctx.fillRect(x + 2, y + 2, w - 4, 3);
        ctx.fillRect(x + 2, y + 2, 3, h - 4);
        
        ctx.fillStyle = frameShadow;
        ctx.fillRect(x + w - 5, y + 2, 3, h - 4);
        ctx.fillRect(x + 2, y + h - 5, w - 4, 3);
        
        const screenX = x + 8;
        const screenY = y + 8;
        const screenW = w - 16;
        const screenH = h - 16;
        
        ctx.fillStyle = screenMain;
        ctx.fillRect(screenX, screenY, screenW, screenH);
        
        ctx.fillStyle = screenHighlight;
        ctx.fillRect(screenX, screenY, screenW, 3);
        ctx.fillRect(screenX, screenY, 3, screenH);
        
        ctx.fillStyle = 'rgba(100, 150, 255, 0.15)';
        ctx.fillRect(screenX + 4, screenY + 4, screenW - 8, screenH - 8);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        for (let i = 0; i < 5; i++) {
            const sx = screenX + 10 + Math.random() * (screenW - 20);
            const sy = screenY + 10 + Math.random() * (screenH - 20);
            ctx.fillRect(sx, sy, 20, 2);
        }
    },

    drawSeatsTop(ctx, x, y, w, h) {
        const rows = 2;
        const cols = 6;
        const seatW = w / cols;
        const seatH = h / rows;
        
        const seatTop = '#6b21a8';
        const seatMain = '#4c1d95';
        const seatShadow = '#3b0764';
        const seatDepth = '#2f1b3f';
        
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const sx = x + c * seatW + 4;
                const sy = y + r * seatH + 4;
                const sw = seatW - 8;
                const sh = seatH - 8;
                
                ctx.fillStyle = seatMain;
                ctx.beginPath();
                ctx.roundRect(sx, sy, sw, sh, 4);
                ctx.fill();
                
                ctx.fillStyle = seatTop;
                ctx.fillRect(sx + 2, sy + 2, sw - 4, 3);
                ctx.fillRect(sx + 2, sy + 2, 3, sh - 4);
                
                ctx.fillStyle = seatShadow;
                ctx.fillRect(sx + sw - 5, sy + 2, 3, sh - 4);
                ctx.fillRect(sx + 2, sy + sh - 5, sw - 4, 3);
                
                ctx.fillStyle = seatDepth;
                ctx.fillRect(sx + 4, sy + sh, sw - 8, 3);
                ctx.fillStyle = adjustColor(seatDepth, -15);
                ctx.fillRect(sx, sy + sh, 4, 3);
                
                ctx.strokeStyle = seatShadow;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(sx, sy, sw, sh, 4);
                ctx.stroke();
            }
        }
    },

    drawCandleTop(ctx, x, y, w, h) {
        const glow = ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, w * 2);
        glow.addColorStop(0, 'rgba(255, 200, 100, 0.4)');
        glow.addColorStop(0.5, 'rgba(255, 150, 50, 0.2)');
        glow.addColorStop(1, 'rgba(255, 100, 0, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(x - w, y - h, w * 3, h * 3);
        
        const candleTop = '#f8fafc';
        const candleMain = '#e2e8f0';
        const candleShadow = '#cbd5e1';
        const candleDepth = '#94a3b8';
        
        const candleW = w - 4;
        const candleH = h * 0.7;
        const candleX = x + 2;
        const candleY = y + h * 0.3;
        
        ctx.fillStyle = candleMain;
        ctx.beginPath();
        ctx.roundRect(candleX, candleY, candleW, candleH, 2);
        ctx.fill();
        
        ctx.fillStyle = candleTop;
        ctx.fillRect(candleX + 1, candleY + 1, candleW - 2, 2);
        ctx.fillRect(candleX + 1, candleY + 1, 2, candleH - 2);
        
        ctx.fillStyle = candleShadow;
        ctx.fillRect(candleX + candleW - 3, candleY + 1, 2, candleH - 2);
        ctx.fillRect(candleX + 1, candleY + candleH - 3, candleW - 2, 2);
        
        ctx.fillStyle = candleDepth;
        ctx.fillRect(candleX + 2, candleY + candleH, candleW - 4, 2);
        
        const flameW = w * 0.5;
        const flameH = h * 0.35;
        const flameX = x + w / 2 - flameW / 2;
        const flameY = y;
        
        ctx.fillStyle = '#fff7ed';
        ctx.fillRect(flameX + 2, flameY + 2, flameW - 4, flameH - 4);
        
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(flameX + 4, flameY + 4, flameW - 8, flameH - 8);
        
        ctx.fillStyle = '#f97316';
        ctx.fillRect(flameX + 6, flameY + 6, flameW - 12, flameH - 12);
        
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(flameX + 8, flameY + flameH * 0.6, flameW - 16, flameH * 0.3);
    },

    drawUmbrellaTop(ctx, x, y, w, h) {
        this.drawShadow(ctx, x, y, w, h * 0.3, 10);
        
        const stripeTop = '#fdba74';
        const stripeMain = '#f97316';
        const stripeShadow = '#ea580c';
        const poleMain = '#78350f';
        const poleShadow = '#451a03';
        
        const cx = x + w / 2;
        const cy = y + h * 0.4;
        const radius = w / 2;
        
        const stripeCount = 8;
        const stripeAngle = (Math.PI * 2) / stripeCount;
        
        for (let i = 0; i < stripeCount; i++) {
            const isOrange = i % 2 === 0;
            const startAngle = i * stripeAngle - Math.PI / 2;
            const endAngle = startAngle + stripeAngle;
            
            const stripeW = radius * 0.8;
            const stripeH = radius * 0.4;
            const angle = startAngle + stripeAngle / 2;
            const px = cx + Math.cos(angle) * radius * 0.3;
            const py = cy + Math.sin(angle) * radius * 0.2;
            
            ctx.fillStyle = isOrange ? stripeMain : '#ffffff';
            ctx.fillRect(px - stripeW / 4, py - stripeH / 4, stripeW / 2, stripeH / 2);
            
            if (isOrange) {
                ctx.fillStyle = stripeTop;
                ctx.fillRect(px - stripeW / 4, py - stripeH / 4, 2, stripeH / 2);
            } else {
                ctx.fillStyle = '#f0f0f0';
                ctx.fillRect(px + stripeW / 4 - 2, py - stripeH / 4, 2, stripeH / 2);
            }
        }
        
        ctx.strokeStyle = stripeShadow;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.8, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = poleMain;
        ctx.fillRect(cx - 2, cy, 4, h * 0.6);
        
        ctx.fillStyle = poleShadow;
        ctx.fillRect(cx, cy, 2, h * 0.6);
    },

    drawTowelTop(ctx, x, y, w, h) {
        const towelTop = '#93c5fd';
        const towelMain = '#60a5fa';
        const towelShadow = '#3b82f6';
        const towelDepth = '#2563eb';
        
        ctx.fillStyle = towelMain;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 4);
        ctx.fill();
        
        ctx.fillStyle = towelTop;
        ctx.fillRect(x + 2, y + 2, w - 4, 3);
        ctx.fillRect(x + 2, y + 2, 3, h - 4);
        
        ctx.fillStyle = towelShadow;
        ctx.fillRect(x + w - 5, y + 2, 3, h - 4);
        ctx.fillRect(x + 2, y + h - 5, w - 4, 3);
        
        ctx.fillStyle = towelDepth;
        ctx.fillRect(x + 4, y + h, w - 8, 4);
        ctx.fillStyle = adjustColor(towelDepth, -15);
        ctx.fillRect(x, y + h, 4, 4);
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        for (let ty = y + 8; ty < y + h - 5; ty += 8) {
            const offset = Math.sin(ty * 0.5) * 1;
            ctx.beginPath();
            ctx.moveTo(x + 5 + offset, ty);
            ctx.lineTo(x + w - 5 + offset, ty);
            ctx.stroke();
        }
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x + 4, y + 4, w - 8, h - 8, 2);
        ctx.stroke();
    },

    drawBookshelfTop(ctx, x, y, w, h) {
        this.drawShadow(ctx, x, y, w, h, 8);
        
        const shelfTop = '#8b6b5a';
        const shelfMain = '#6b4f3f';
        const shelfShadow = '#4a3628';
        const shelfDepth = '#3f2a1d';
        
        ctx.fillStyle = shelfMain;
        ctx.fillRect(x, y, w, h);
        
        ctx.fillStyle = shelfTop;
        ctx.fillRect(x + 2, y + 2, w - 4, 3);
        ctx.fillRect(x + 2, y + 2, 3, h - 4);
        
        ctx.fillStyle = shelfShadow;
        ctx.fillRect(x + w - 5, y + 2, 3, h - 4);
        ctx.fillRect(x + 2, y + h - 5, w - 4, 3);
        
        ctx.fillStyle = shelfDepth;
        ctx.fillRect(x + 4, y + h, w - 8, 6);
        ctx.fillStyle = adjustColor(shelfDepth, -15);
        ctx.fillRect(x, y + h, 4, 6);
        
        ctx.strokeStyle = shelfDepth;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);
        
        const shelfY1 = y + h * 0.33;
        const shelfY2 = y + h * 0.66;
        ctx.strokeStyle = '#2f2016';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + 4, shelfY1);
        ctx.lineTo(x + w - 4, shelfY1);
        ctx.moveTo(x + 4, shelfY2);
        ctx.lineTo(x + w - 4, shelfY2);
        ctx.stroke();
        
        const bookColors = [
            { main: '#dc2626', shadow: '#991b1b' },
            { main: '#2563eb', shadow: '#1d4ed8' },
            { main: '#16a34a', shadow: '#15803d' },
            { main: '#9333ea', shadow: '#7e22ce' },
            { main: '#ca8a04', shadow: '#a16207' }
        ];
        
        for (let row = 0; row < 3; row++) {
            const rowY = y + 6 + row * (h / 3);
            let bookX = x + 6;
            while (bookX < x + w - 10) {
                const bookW = 5 + Math.random() * 6;
                const colorIdx = Math.floor(Math.random() * bookColors.length);
                const bookColor = bookColors[colorIdx];
                
                ctx.fillStyle = bookColor.main;
                ctx.fillRect(bookX, rowY, bookW, h / 3 - 10);
                
                ctx.fillStyle = bookColor.shadow;
                ctx.fillRect(bookX + bookW - 2, rowY, 2, h / 3 - 10);
                
                bookX += bookW + 2;
            }
        }
    },

    drawPlantTop(ctx, x, y, w, h) {
        this.drawShadow(ctx, x, y, w, h * 0.3, 5);
        
        const leafTop = '#4CAF50';
        const leafMain = '#388E3C';
        const leafShadow = '#2E7D32';
        const potTop = '#D7CCC8';
        const potMain = '#BCAAA4';
        const potShadow = '#8D6E63';
        const potDepth = '#6D4C41';
        
        const cx = x + w / 2;
        const cy = y + h * 0.35;
        
        for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5 + Math.random() * 0.3;
            const leafX = cx + Math.cos(angle) * w * 0.25;
            const leafY = cy + Math.sin(angle) * h * 0.15;
            const leafW = w * 0.25;
            const leafH = w * 0.15;
            
            ctx.fillStyle = leafMain;
            ctx.fillRect(leafX - leafW / 2, leafY - leafH / 2, leafW, leafH);
            
            ctx.fillStyle = leafTop;
            ctx.fillRect(leafX - leafW / 2, leafY - leafH / 2, 2, leafH);
            ctx.fillRect(leafX - leafW / 2, leafY - leafH / 2, leafW, 2);
            
            ctx.fillStyle = leafShadow;
            ctx.fillRect(leafX + leafW / 2 - 2, leafY - leafH / 2, 2, leafH);
            ctx.fillRect(leafX - leafW / 2, leafY + leafH / 2 - 2, leafW, 2);
        }
        
        const potW = w * 0.6;
        const potH = h * 0.35;
        const potX = cx - potW / 2;
        const potY = y + h * 0.65;
        
        ctx.fillStyle = potMain;
        ctx.beginPath();
        ctx.moveTo(potX, potY);
        ctx.lineTo(potX - 4, potY + potH);
        ctx.lineTo(potX + potW + 4, potY + potH);
        ctx.lineTo(potX + potW, potY);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = potTop;
        ctx.fillRect(potX, potY, potW, 3);
        ctx.fillRect(potX, potY, 3, potH);
        
        ctx.fillStyle = potShadow;
        ctx.fillRect(potX + potW - 3, potY, 3, potH);
        
        ctx.fillStyle = potDepth;
        ctx.fillRect(potX + 4, potY + potH, potW - 8, 4);
        ctx.fillStyle = adjustColor(potDepth, -15);
        ctx.fillRect(potX - 4, potY + potH, 8, 4);
        
        ctx.strokeStyle = potShadow;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(potX, potY);
        ctx.lineTo(potX - 4, potY + potH);
        ctx.lineTo(potX + potW + 4, potY + potH);
        ctx.lineTo(potX + potW, potY);
        ctx.closePath();
        ctx.stroke();
    }
};

// 導出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SceneRenderer;
}
