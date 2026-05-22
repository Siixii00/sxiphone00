export class ColorPicker {
  constructor(container, options = {}) {
    this.container = container;
    this.value = options.value || '#0A84FF';
    this.onChange = options.onChange || (() => {});
    this.showOpacity = options.showOpacity !== false;
    this.showCustom = options.showCustom !== false;
    
    this.render();
    this.bindEvents();
  }
  
  render() {
    const presets = this.getPresetColors();
    
    this.container.innerHTML = `
      <div class="color-picker-wrapper">
        <div class="preset-colors">
          ${presets.map(c => `
            <button class="preset-color" 
                    data-color="${c.hex}" 
                    style="background: ${c.hex}"
                    title="${c.label}">
            </button>
          `).join('')}
        </div>
        ${this.showCustom ? `
        <div class="custom-color-section">
          <div class="hue-slider-container">
            <canvas id="hueCanvas" width="260" height="24"></canvas>
            <div class="hue-handle" id="hueHandle"></div>
          </div>
          <div class="color-preview-row">
            <div class="color-preview-circle" id="previewCircle" style="background: ${this.value}"></div>
            <span class="color-hex-value" id="hexValue">${this.value}</span>
          </div>
        </div>
        ` : ''}
        ${this.showOpacity ? `
        <div class="opacity-section">
          <span class="opacity-label">透明度</span>
          <input type="range" id="opacitySlider" class="opacity-slider" min="0" max="100" value="100">
          <span class="opacity-value" id="opacityValue">100%</span>
        </div>
        ` : ''}
      </div>
    `;
    
    this.addStyles();
  }
  
  getPresetColors() {
    return [
      { hex: '#FF453A', label: '紅' },
      { hex: '#FF9F0A', label: '橙' },
      { hex: '#FFD60A', label: '黃' },
      { hex: '#30D158', label: '綠' },
      { hex: '#0A84FF', label: '藍' },
      { hex: '#5E5CE6', label: '靛' },
      { hex: '#BF5AF2', label: '紫' },
      { hex: '#FF375F', label: '粉' },
      { hex: '#64D2FF', label: '天藍' },
      { hex: '#AC8E68', label: '沙金' },
      { hex: '#1c1c1e', label: '深灰' },
      { hex: '#ffffff', label: '白' },
    ];
  }
  
  addStyles() {
    if (document.getElementById('color-picker-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'color-picker-styles';
    style.textContent = `
      .color-picker-wrapper {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .preset-colors {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .preset-color {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 3px solid transparent;
        cursor: pointer;
        transition: transform 0.15s, border-color 0.15s;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      }
      .preset-color:hover {
        transform: scale(1.12);
      }
      .preset-color.active {
        border-color: #fff;
      }
      .hue-slider-container {
        position: relative;
        height: 24px;
        border-radius: 12px;
        overflow: hidden;
      }
      #hueCanvas {
        width: 100%;
        height: 24px;
        border-radius: 12px;
        cursor: crosshair;
      }
      .hue-handle {
        position: absolute;
        width: 12px;
        height: 24px;
        background: #fff;
        border: 2px solid #000;
        border-radius: 6px;
        top: 0;
        transform: translateX(-50%);
        pointer-events: none;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      }
      .color-preview-row {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .color-preview-circle {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 2px solid rgba(255,255,255,0.2);
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      }
      .color-hex-value {
        font-family: 'SF Mono', 'Menlo', monospace;
        font-size: 14px;
        color: rgba(255,255,255,0.8);
        text-transform: uppercase;
      }
      .opacity-section {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .opacity-label {
        font-size: 13px;
        color: rgba(255,255,255,0.6);
      }
      .opacity-slider {
        flex: 1;
        height: 4px;
        -webkit-appearance: none;
        appearance: none;
        background: rgba(255,255,255,0.2);
        border-radius: 2px;
        outline: none;
      }
      .opacity-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #fff;
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      }
      .opacity-value {
        font-size: 13px;
        color: rgba(255,255,255,0.8);
        min-width: 40px;
      }
    `;
    document.head.appendChild(style);
  }
  
  bindEvents() {
    this.container.querySelectorAll('.preset-color').forEach(btn => {
      btn.addEventListener('click', () => {
        this.container.querySelectorAll('.preset-color').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.value = btn.dataset.color;
        this.updatePreview();
        this.onChange(this.value);
      });
    });
    
    if (this.showCustom) {
      const hueCanvas = this.container.querySelector('#hueCanvas');
      if (hueCanvas) {
        const ctx = hueCanvas.getContext('2d');
        this.drawHueGradient(ctx, hueCanvas.width, hueCanvas.height);
        
        hueCanvas.addEventListener('click', (e) => this.handleHueClick(e, hueCanvas));
        hueCanvas.addEventListener('mousedown', (e) => {
          this.handleHueClick(e, hueCanvas);
          const moveHandler = (ev) => this.handleHueClick(ev, hueCanvas);
          const upHandler = () => {
            document.removeEventListener('mousemove', moveHandler);
            document.removeEventListener('mouseup', upHandler);
          };
          document.addEventListener('mousemove', moveHandler);
          document.addEventListener('mouseup', upHandler);
        });
      }
    }
    
    if (this.showOpacity) {
      const opacitySlider = this.container.querySelector('#opacitySlider');
      const opacityValue = this.container.querySelector('#opacityValue');
      if (opacitySlider && opacityValue) {
        opacitySlider.addEventListener('input', () => {
          opacityValue.textContent = opacitySlider.value + '%';
        });
      }
    }
  }
  
  drawHueGradient(ctx, width, height) {
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    for (let i = 0; i <= 360; i += 30) {
      gradient.addColorStop(i / 360, `hsl(${i}, 100%, 50%)`);
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
  
  handleHueClick(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(canvas.width, e.clientX - rect.left));
    const hue = (x / canvas.width) * 360;
    
    this.value = this.hslToHex(hue, 80, 55);
    this.updatePreview();
    
    const handle = this.container.querySelector('#hueHandle');
    if (handle) {
      handle.style.left = x + 'px';
    }
    
    this.onChange(this.value);
  }
  
  hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }
  
  updatePreview() {
    const preview = this.container.querySelector('#previewCircle');
    const hexValue = this.container.querySelector('#hexValue');
    if (preview) {
      preview.style.background = this.value;
    }
    if (hexValue) {
      hexValue.textContent = this.value.toUpperCase();
    }
  }
  
  setValue(hex) {
    this.value = hex;
    this.updatePreview();
    
    this.container.querySelectorAll('.preset-color').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.color.toLowerCase() === hex.toLowerCase());
    });
  }
  
  getValue() {
    return this.value;
  }
  
  getOpacity() {
    const slider = this.container.querySelector('#opacitySlider');
    return slider ? parseInt(slider.value) : 100;
  }
}
