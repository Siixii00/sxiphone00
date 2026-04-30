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
        
        const baseGradient = ctx.createLinearGradient(0, 0, w, h);
        baseGradient.addColorStop(0, '#D4A574');
        baseGradient.addColorStop(0.5, '#C49A6C');
        baseGradient.addColorStop(1, '#B8865A');
        ctx.fillStyle = baseGradient;
        ctx.fillRect(0, 0, w, h);
        
        for (let y = 0; y < h; y += ts) {
            for (let x = 0; x < w; x += ts) {
                const noise = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 15;
                const baseColor = ((x / ts) + (y / ts)) % 2 === 0 ? 180 : 160;
                const r = Math.min(255, Math.max(0, baseColor + 40 + noise));
                const g = Math.min(255, Math.max(0, baseColor + 20 + noise));
                const b = Math.min(255, Math.max(0, baseColor - 40 + noise));
                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                ctx.fillRect(x, y, ts, ts);
                
                ctx.strokeStyle = `rgba(90, 50, 20, ${0.3 + Math.random() * 0.2})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x, y + ts * 0.3);
                ctx.lineTo(x + ts, y + ts * 0.3);
                ctx.moveTo(x, y + ts * 0.7);
                ctx.lineTo(x + ts, y + ts * 0.7);
                ctx.stroke();
            }
        }
        
        const carpetX = w * 0.15;
        const carpetY = h * 0.25;
        const carpetW = w * 0.7;
        const carpetH = h * 0.55;
        
        ctx.fillStyle = '#8B1A1A';
        ctx.fillRect(carpetX - 5, carpetY - 5, carpetW + 10, carpetH + 10);
        
        const carpetGradient = ctx.createRadialGradient(
            carpetX + carpetW / 2, carpetY + carpetH / 2, 0,
            carpetX + carpetW / 2, carpetY + carpetH / 2, carpetW / 2
        );
        carpetGradient.addColorStop(0, '#A52A2A');
        carpetGradient.addColorStop(0.5, '#8B1A1A');
        carpetGradient.addColorStop(1, '#6B0F0F');
        ctx.fillStyle = carpetGradient;
        ctx.fillRect(carpetX, carpetY, carpetW, carpetH);
        
        ctx.strokeStyle = '#DAA520';
        ctx.lineWidth = 4;
        ctx.strokeRect(carpetX + 10, carpetY + 10, carpetW - 20, carpetH - 20);
        
        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 2;
        const patternSize = 25;
        for (let py = carpetY + 20; py < carpetY + carpetH - 20; py += patternSize) {
            for (let px = carpetX + 20; px < carpetX + carpetW - 20; px += patternSize) {
                ctx.beginPath();
                ctx.arc(px, py, 5, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        
        ctx.fillStyle = 'rgba(255, 200, 100, 0.15)';
        ctx.beginPath();
        ctx.ellipse(w * 0.3, h * 0.15, 80, 40, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(w * 0.7, h * 0.15, 80, 40, 0, 0, Math.PI * 2);
        ctx.fill();
        
        this.drawNoise(ctx, 0, 0, w, h, 0.15);
    },
    
    drawParkTiles(ctx, w, h) {
        const ts = this.tileSize;
        
        const grassGradient = ctx.createLinearGradient(0, 0, 0, h);
        grassGradient.addColorStop(0, '#7CB342');
        grassGradient.addColorStop(0.5, '#8BC34A');
        grassGradient.addColorStop(1, '#689F38');
        ctx.fillStyle = grassGradient;
        ctx.fillRect(0, 0, w, h);
        
        for (let y = 0; y < h; y += ts) {
            for (let x = 0; x < w; x += ts) {
                const noise = (Math.sin(x * 0.05 + y * 0.03) + Math.cos(y * 0.07)) * 10;
                const baseGreen = 140 + noise;
                ctx.fillStyle = `rgba(${80 + Math.random() * 20}, ${baseGreen + Math.random() * 30}, ${40 + Math.random() * 20}, 0.4)`;
                ctx.fillRect(x, y, ts, ts);
                
                for (let i = 0; i < 4; i++) {
                    const gx = x + Math.random() * ts;
                    const gy = y + Math.random() * ts;
                    ctx.fillStyle = `rgba(34, 139, 34, ${0.3 + Math.random() * 0.3})`;
                    ctx.fillRect(gx, gy, 1, 2 + Math.random() * 3);
                }
            }
        }
        
        const pathX = w * 0.35;
        const pathW = w * 0.3;
        
        for (let y = 0; y < h; y += ts) {
            const curve = Math.sin(y * 0.02) * 20;
            for (let x = pathX + curve; x < pathX + pathW + curve; x += ts) {
                const stoneVar = Math.random() * 20;
                ctx.fillStyle = `rgb(${210 + stoneVar}, ${190 + stoneVar}, ${150 + stoneVar})`;
                ctx.fillRect(x, y, ts, ts);
                
                if (Math.random() > 0.6) {
                    ctx.fillStyle = `rgba(160, 130, 100, ${0.5 + Math.random() * 0.3})`;
                    ctx.beginPath();
                    ctx.arc(x + ts / 2, y + ts / 2, 2 + Math.random() * 4, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
        
        ctx.fillStyle = 'rgba(135, 206, 235, 0.3)';
        ctx.beginPath();
        ctx.ellipse(w * 0.2, h * 0.1, 100, 30, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(w * 0.8, h * 0.15, 80, 25, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        this.drawNoise(ctx, 0, 0, w, h, 0.1);
    },
    
    drawCinemaTiles(ctx, w, h) {
        const ts = this.tileSize;
        
        const bgGradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        bgGradient.addColorStop(0, '#1E1E3F');
        bgGradient.addColorStop(1, '#0D0D1F');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, w, h);
        
        for (let y = 0; y < h; y += ts) {
            for (let x = 0; x < w; x += ts) {
                const distFromCenter = Math.sqrt(Math.pow(x - w / 2, 2) + Math.pow(y - h / 2, 2));
                const alpha = 0.05 + (distFromCenter / w) * 0.1;
                ctx.fillStyle = `rgba(30, 30, 60, ${alpha})`;
                ctx.fillRect(x, y, ts, ts);
            }
        }
        
        const aisleX = w * 0.45;
        const aisleW = w * 0.1;
        
        for (let y = 0; y < h; y += ts) {
            for (let x = aisleX; x < aisleX + aisleW; x += ts) {
                ctx.fillStyle = '#2A2A4A';
                ctx.fillRect(x, y, ts, ts);
                
                ctx.fillStyle = 'rgba(100, 100, 150, 0.3)';
                ctx.fillRect(x + 2, y + ts - 3, ts - 4, 1);
            }
        }
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        for (let i = 0; i < 20; i++) {
            const sx = Math.random() * w;
            const sy = Math.random() * h;
            ctx.beginPath();
            ctx.arc(sx, sy, Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        this.drawNoise(ctx, 0, 0, w, h, 0.08);
    },
    
    drawRestaurantTiles(ctx, w, h) {
        const ts = this.tileSize;
        
        for (let y = 0; y < h; y += ts) {
            for (let x = 0; x < w; x += ts) {
                const isBlack = ((x / ts) + (y / ts)) % 2 === 0;
                
                if (isBlack) {
                    ctx.fillStyle = '#1A0F0A';
                } else {
                    ctx.fillStyle = '#3D2314';
                }
                ctx.fillRect(x, y, ts, ts);
                
                const gloss = Math.random() * 0.15;
                ctx.fillStyle = `rgba(255, 255, 255, ${gloss})`;
                ctx.fillRect(x, y, ts * 0.6, ts * 0.6);
                
                ctx.fillStyle = `rgba(0, 0, 0, ${0.1 + Math.random() * 0.1})`;
                ctx.fillRect(x + ts * 0.6, y + ts * 0.6, ts * 0.4, ts * 0.4);
            }
        }
        
        ctx.fillStyle = 'rgba(255, 200, 100, 0.2)';
        const candlePositions = [
            [w * 0.25, h * 0.3], [w * 0.75, h * 0.3],
            [w * 0.5, h * 0.6], [w * 0.2, h * 0.7], [w * 0.8, h * 0.7]
        ];
        candlePositions.forEach(([cx, cy]) => {
            const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60);
            glow.addColorStop(0, 'rgba(255, 200, 100, 0.3)');
            glow.addColorStop(0.5, 'rgba(255, 150, 50, 0.15)');
            glow.addColorStop(1, 'rgba(255, 100, 0, 0)');
            ctx.fillStyle = glow;
            ctx.fillRect(cx - 60, cy - 60, 120, 120);
        });
        
        this.drawNoise(ctx, 0, 0, w, h, 0.12);
    },
    
    drawBeachTiles(ctx, w, h) {
        const ts = this.tileSize;
        
        for (let y = 0; y < h * 0.45; y += ts) {
            const depth = y / (h * 0.45);
            for (let x = 0; x < w; x += ts) {
                const wave = Math.sin(x * 0.05 + y * 0.1) * 10;
                const r = 20 + depth * 30;
                const g = 80 + depth * 60 + wave;
                const b = 140 + depth * 80 + wave;
                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                ctx.fillRect(x, y, ts, ts);
                
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
        
        for (let y = h * 0.45; y < h; y += ts) {
            const sandDepth = (y - h * 0.45) / (h * 0.55);
            for (let x = 0; x < w; x += ts) {
                const noise = Math.sin(x * 0.03) * Math.cos(y * 0.05) * 15;
                const r = 240 + noise - sandDepth * 20;
                const g = 200 + noise - sandDepth * 30;
                const b = 140 + noise - sandDepth * 40;
                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                ctx.fillRect(x, y, ts, ts);
                
                for (let i = 0; i < 3; i++) {
                    ctx.fillStyle = `rgba(200, 180, 140, ${0.3 + Math.random() * 0.3})`;
                    ctx.fillRect(
                        x + Math.random() * ts,
                        y + Math.random() * ts,
                        1 + Math.random(), 1 + Math.random()
                    );
                }
            }
        }
        
        ctx.fillStyle = 'rgba(255, 255, 200, 0.15)';
        ctx.beginPath();
        ctx.ellipse(w * 0.8, h * 0.1, 100, 60, 0, 0, Math.PI * 2);
        ctx.fill();
        
        this.drawNoise(ctx, 0, 0, w, h, 0.1);
    },
    
    drawLibraryTiles(ctx, w, h) {
        const ts = this.tileSize;
        
        const woodGradient = ctx.createLinearGradient(0, 0, w, 0);
        woodGradient.addColorStop(0, '#8B7355');
        woodGradient.addColorStop(0.5, '#A0826D');
        woodGradient.addColorStop(1, '#8B7355');
        ctx.fillStyle = woodGradient;
        ctx.fillRect(0, 0, w, h);
        
        for (let y = 0; y < h; y += ts) {
            for (let x = 0; x < w; x += ts) {
                const grain = Math.sin(y * 0.2 + x * 0.05) * 10;
                const r = 139 + grain;
                const g = 115 + grain;
                const b = 85 + grain;
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
                ctx.fillRect(x, y, ts, ts);
                
                ctx.strokeStyle = `rgba(100, 80, 60, ${0.2 + Math.random() * 0.2})`;
                ctx.lineWidth = 1;
                const lineY = y + ts * 0.5 + Math.sin(x * 0.1) * 2;
                ctx.beginPath();
                ctx.moveTo(x, lineY);
                ctx.lineTo(x + ts, lineY);
                ctx.stroke();
            }
        }
        
        ctx.fillStyle = 'rgba(255, 240, 200, 0.15)';
        ctx.beginPath();
        ctx.ellipse(w * 0.5, h * 0.3, 150, 80, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(w * 0.3, h * 0.6, 100, 60, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(w * 0.7, h * 0.6, 100, 60, 0, 0, Math.PI * 2);
        ctx.fill();
        
        this.drawNoise(ctx, 0, 0, w, h, 0.12);
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
    
    drawShadow(ctx, x, y, w, h, blur = 5) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h + 3, w / 2 + blur, blur, 0, 0, Math.PI * 2);
        ctx.fill();
    },
    
    drawTableTop(ctx, x, y, w, h) {
        this.drawShadow(ctx, x, y, w, h, 8);
        
        const tableGradient = ctx.createLinearGradient(x, y, x + w, y + h);
        tableGradient.addColorStop(0, '#A0522D');
        tableGradient.addColorStop(0.5, '#8B4513');
        tableGradient.addColorStop(1, '#6B3410');
        ctx.fillStyle = tableGradient;
        
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 8);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.roundRect(x + 4, y + 4, w - 8, h / 3, 4);
        ctx.fill();
        
        ctx.strokeStyle = '#4A2C1A';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 8);
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(139, 69, 19, 0.3)';
        ctx.fillRect(x + 8, y + 8, w - 16, h - 16);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        ctx.arc(x + w * 0.3, y + h * 0.4, 8, 0, Math.PI * 2);
        ctx.fill();
    },
    
    drawChairTop(ctx, x, y, w, h) {
        this.drawShadow(ctx, x, y, w, h, 4);
        
        const seatGradient = ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, w / 2);
        seatGradient.addColorStop(0, '#8B5A2B');
        seatGradient.addColorStop(1, '#654321');
        ctx.fillStyle = seatGradient;
        
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 2, w - 4, h - 4, 6);
        ctx.fill();
        
        ctx.fillStyle = '#5D3A1A';
        ctx.fillRect(x + 4, y - h * 0.25, w - 8, h * 0.3);
        
        ctx.strokeStyle = '#3D2A1A';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 2, w - 4, h - 4, 6);
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.arc(x + w * 0.35, y + h * 0.35, 4, 0, Math.PI * 2);
        ctx.fill();
    },
    
    drawCounterTop(ctx, x, y, w, h) {
        this.drawShadow(ctx, x, y, w, h, 10);
        
        const counterGradient = ctx.createLinearGradient(x, y, x, y + h);
        counterGradient.addColorStop(0, '#D2691E');
        counterGradient.addColorStop(0.15, '#CD853F');
        counterGradient.addColorStop(0.15, '#8B4513');
        counterGradient.addColorStop(1, '#654321');
        ctx.fillStyle = counterGradient;
        ctx.fillRect(x, y, w, h);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(x + 5, y + 3, w - 10, h * 0.1);
        
        ctx.strokeStyle = '#4A2C1A';
        ctx.lineWidth = 4;
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
        
        const benchGradient = ctx.createLinearGradient(x, y, x, y + h);
        benchGradient.addColorStop(0, '#A0522D');
        benchGradient.addColorStop(1, '#8B4513');
        ctx.fillStyle = benchGradient;
        
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 4);
        ctx.fill();
        
        ctx.fillStyle = '#654321';
        ctx.fillRect(x + 5, y - h * 0.15, w - 10, h * 0.2);
        
        ctx.strokeStyle = '#4A2C1A';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 4);
        ctx.stroke();
        
        for (let i = 0; i < 3; i++) {
            const lx = x + 15 + i * (w / 3);
            ctx.fillStyle = '#5D3A1A';
            ctx.fillRect(lx, y + h + 2, 8, 12);
        }
    },
    
    drawTreeTop(ctx, x, y, w, h) {
        this.drawShadow(ctx, x, y, w, h * 0.3, 15);
        
        for (let layer = 3; layer >= 0; layer--) {
            const layerRadius = (w / 2) * (1 - layer * 0.15);
            const layerY = y + h / 2 + layer * 5;
            
            const treeGradient = ctx.createRadialGradient(
                x + w / 2, layerY, 0,
                x + w / 2, layerY, layerRadius
            );
            treeGradient.addColorStop(0, '#228B22');
            treeGradient.addColorStop(0.5, '#1E7B1E');
            treeGradient.addColorStop(1, '#145214');
            
            ctx.fillStyle = treeGradient;
            ctx.beginPath();
            ctx.arc(x + w / 2, layerY, layerRadius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, w / 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.arc(x + w * 0.35, y + h * 0.35, w * 0.15, 0, Math.PI * 2);
        ctx.fill();
    },
    
    drawFlowerTop(ctx, x, y, w, h) {
        this.drawShadow(ctx, x, y, w, h * 0.3, 3);
        
        const petalColors = ['#FF69B4', '#FFB6C1', '#FF1493', '#DB7093'];
        const petalCount = 5;
        
        for (let i = 0; i < petalCount; i++) {
            const angle = (i * Math.PI * 2) / petalCount;
            const px = x + w / 2 + Math.cos(angle) * w * 0.3;
            const py = y + h / 2 + Math.sin(angle) * h * 0.3;
            
            const petalGradient = ctx.createRadialGradient(px, py, 0, px, py, w * 0.25);
            petalGradient.addColorStop(0, '#FFB6C1');
            petalGradient.addColorStop(1, petalColors[i % petalColors.length]);
            
            ctx.fillStyle = petalGradient;
            ctx.beginPath();
            ctx.ellipse(px, py, w * 0.22, w * 0.18, angle, 0, Math.PI * 2);
            ctx.fill();
        }
        
        const centerGradient = ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, w * 0.15);
        centerGradient.addColorStop(0, '#FFD700');
        centerGradient.addColorStop(1, '#FFA500');
        ctx.fillStyle = centerGradient;
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, w * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(x + w * 0.4, y + h * 0.4, 2, 0, Math.PI * 2);
        ctx.fill();
    },

    drawScreenTop(ctx, x, y, w, h) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(x + 5, y + 5, w, h);
        
        const screenGradient = ctx.createLinearGradient(x, y, x + w, y + h);
        screenGradient.addColorStop(0, '#1a1a2e');
        screenGradient.addColorStop(0.5, '#16213e');
        screenGradient.addColorStop(1, '#0f172a');
        ctx.fillStyle = screenGradient;
        
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 4);
        ctx.fill();
        
        ctx.strokeStyle = '#4a5568';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 4);
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(100, 150, 255, 0.1)';
        ctx.fillRect(x + 10, y + 10, w - 20, h - 20);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        for (let i = 0; i < 5; i++) {
            const sx = x + 20 + Math.random() * (w - 40);
            const sy = y + 20 + Math.random() * (h - 40);
            ctx.fillRect(sx, sy, 30, 2);
        }
    },

    drawSeatsTop(ctx, x, y, w, h) {
        const rows = 2;
        const cols = 6;
        const seatW = w / cols;
        const seatH = h / rows;
        
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const sx = x + c * seatW + 4;
                const sy = y + r * seatH + 4;
                
                const seatGradient = ctx.createLinearGradient(sx, sy, sx, sy + seatH - 8);
                seatGradient.addColorStop(0, '#4c1d95');
                seatGradient.addColorStop(1, '#2f1b3f');
                ctx.fillStyle = seatGradient;
                
                ctx.beginPath();
                ctx.roundRect(sx, sy, seatW - 8, seatH - 8, 4);
                ctx.fill();
                
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.fillRect(sx + 3, sy + 3, seatW - 14, 5);
                
                ctx.strokeStyle = '#6b21a8';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(sx, sy, seatW - 8, seatH - 8, 4);
                ctx.stroke();
            }
        }
    },

    drawCandleTop(ctx, x, y, w, h) {
        ctx.fillStyle = 'rgba(255, 200, 100, 0.3)';
        const glow = ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, w * 2);
        glow.addColorStop(0, 'rgba(255, 200, 100, 0.4)');
        glow.addColorStop(0.5, 'rgba(255, 150, 50, 0.2)');
        glow.addColorStop(1, 'rgba(255, 100, 0, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(x - w, y - h, w * 3, h * 3);
        
        const candleGradient = ctx.createLinearGradient(x, y, x + w, y);
        candleGradient.addColorStop(0, '#f8fafc');
        candleGradient.addColorStop(0.5, '#e2e8f0');
        candleGradient.addColorStop(1, '#cbd5e1');
        ctx.fillStyle = candleGradient;
        
        ctx.beginPath();
        ctx.roundRect(x + 2, y + h * 0.3, w - 4, h * 0.7, 2);
        ctx.fill();
        
        const flameGradient = ctx.createRadialGradient(x + w / 2, y + 5, 0, x + w / 2, y + 5, w * 0.4);
        flameGradient.addColorStop(0, '#fff7ed');
        flameGradient.addColorStop(0.3, '#fbbf24');
        flameGradient.addColorStop(0.7, '#f97316');
        flameGradient.addColorStop(1, '#dc2626');
        ctx.fillStyle = flameGradient;
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + 5, w * 0.35, h * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
    },

    drawUmbrellaTop(ctx, x, y, w, h) {
        this.drawShadow(ctx, x, y, w, h * 0.3, 10);
        
        const stripeColors = ['#f97316', '#ffffff', '#f97316', '#ffffff'];
        const stripeCount = 8;
        const stripeAngle = (Math.PI * 2) / stripeCount;
        
        for (let i = 0; i < stripeCount; i++) {
            const startAngle = i * stripeAngle;
            const endAngle = startAngle + stripeAngle;
            
            ctx.fillStyle = stripeColors[i % stripeColors.length];
            ctx.beginPath();
            ctx.moveTo(x + w / 2, y + h / 2);
            ctx.arc(x + w / 2, y + h / 2, w / 2, startAngle, endAngle);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.strokeStyle = '#fb923c';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, w / 2, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y + h / 2);
        ctx.lineTo(x + w / 2, y + h);
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.arc(x + w * 0.35, y + h * 0.35, w * 0.15, 0, Math.PI * 2);
        ctx.fill();
    },

    drawTowelTop(ctx, x, y, w, h) {
        const towelGradient = ctx.createLinearGradient(x, y, x + w, y + h);
        towelGradient.addColorStop(0, '#60a5fa');
        towelGradient.addColorStop(0.5, '#3b82f6');
        towelGradient.addColorStop(1, '#2563eb');
        ctx.fillStyle = towelGradient;
        
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 4);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        for (let ty = y + 8; ty < y + h - 5; ty += 8) {
            ctx.beginPath();
            ctx.moveTo(x + 5, ty);
            ctx.lineTo(x + w - 5, ty);
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
        
        const shelfGradient = ctx.createLinearGradient(x, y, x + w, y);
        shelfGradient.addColorStop(0, '#6b4f3f');
        shelfGradient.addColorStop(0.5, '#8b6b5a');
        shelfGradient.addColorStop(1, '#6b4f3f');
        ctx.fillStyle = shelfGradient;
        ctx.fillRect(x, y, w, h);
        
        ctx.strokeStyle = '#3f2a1d';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);
        
        const shelfY = y + h * 0.35;
        const shelfY2 = y + h * 0.65;
        ctx.strokeStyle = '#2f2016';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + 4, shelfY);
        ctx.lineTo(x + w - 4, shelfY);
        ctx.moveTo(x + 4, shelfY2);
        ctx.lineTo(x + w - 4, shelfY2);
        ctx.stroke();
        
        const bookColors = ['#dc2626', '#2563eb', '#16a34a', '#9333ea', '#ca8a04'];
        for (let row = 0; row < 3; row++) {
            const rowY = y + 8 + row * (h / 3 - 4);
            let bookX = x + 6;
            while (bookX < x + w - 10) {
                const bookW = 6 + Math.random() * 8;
                ctx.fillStyle = bookColors[Math.floor(Math.random() * bookColors.length)];
                ctx.fillRect(bookX, rowY, bookW, h / 3 - 12);
                bookX += bookW + 2;
            }
        }
    },

    drawPlantTop(ctx, x, y, w, h) {
        this.drawShadow(ctx, x, y, w, h * 0.3, 5);
        
        for (let i = 0; i < 5; i++) {
            const leafAngle = (i * Math.PI * 2) / 5 + Math.random() * 0.3;
            const leafX = x + w / 2 + Math.cos(leafAngle) * w * 0.25;
            const leafY = y + h * 0.4 + Math.sin(leafAngle) * h * 0.2;
            
            const leafGradient = ctx.createRadialGradient(leafX, leafY, 0, leafX, leafY, w * 0.3);
            leafGradient.addColorStop(0, '#22c55e');
            leafGradient.addColorStop(1, '#16a34a');
            ctx.fillStyle = leafGradient;
            ctx.beginPath();
            ctx.ellipse(leafX, leafY, w * 0.25, w * 0.15, leafAngle, 0, Math.PI * 2);
            ctx.fill();
        }
        
        const potGradient = ctx.createLinearGradient(x + w * 0.2, y + h * 0.6, x + w * 0.8, y + h);
        potGradient.addColorStop(0, '#a3714f');
        potGradient.addColorStop(1, '#8b5e3c');
        ctx.fillStyle = potGradient;
        
        ctx.beginPath();
        ctx.moveTo(x + w * 0.2, y + h * 0.65);
        ctx.lineTo(x + w * 0.15, y + h);
        ctx.lineTo(x + w * 0.85, y + h);
        ctx.lineTo(x + w * 0.8, y + h * 0.65);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#6b4423';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
};

// 導出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SceneRenderer;
}
