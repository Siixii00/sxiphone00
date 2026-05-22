console.log('Loaded app: passkey');

const PASSKEY_STORAGE_KEY = 'sx_passkey_saved_devices';
const PASSKEY_RECONNECT_DELAY = 1000;
const PASSKEY_MAX_RECONNECT_ATTEMPTS = 3;
const LOVESPOUSE_SERVER_KEY = 'sx_lovespouse_server_ip';

const PasskeyApp = {
  connectedDevice: null,
  bluetoothDevice: null,
  server: null,
  characteristics: {},
  scanning: false,
  devices: [],
  deviceMeta: {},
  connectionStatus: 'disconnected',
  personalityProfile: null,
  personalityCharacter: null,
  reconnectAttempts: 0,
  savedDevices: [],
  activeCharacteristic: null,
  notifyCharacteristic: null,
  
  loveSpouseMode: false,
  loveSpouseServerIp: '',
  loveSpouseConnected: false,
  loveSpouseHealthCheckInterval: null,

  init() {
    console.log('Passkey app initialized');
    this.loadSavedDevices();
    this.loadLoveSpouseSettings();
    this.updateConnectionStatus();
    this.applyStoredCharacterProfile();
    this.bindPasskeyHandoffListener();
    this.checkBluetoothAvailability();
    this.bindLoveSpouseEvents();
  },

  loadLoveSpouseSettings() {
    this.loveSpouseServerIp = localStorage.getItem(LOVESPOUSE_SERVER_KEY) || '';
    const modeEnabled = localStorage.getItem('sx_lovespouse_mode') === '1';
    this.loveSpouseMode = modeEnabled;
    
    const ipInput = document.getElementById('lovespouse-server-ip');
    if (ipInput && this.loveSpouseServerIp) {
      ipInput.value = this.loveSpouseServerIp;
    }
    
    if (modeEnabled) {
      this.enableLoveSpouseMode();
    }
  },

  bindLoveSpouseEvents() {
    const ipInput = document.getElementById('lovespouse-server-ip');
    if (ipInput) {
      ipInput.addEventListener('change', () => {
        this.loveSpouseServerIp = ipInput.value.trim();
        localStorage.setItem(LOVESPOUSE_SERVER_KEY, this.loveSpouseServerIp);
        if (this.loveSpouseMode) {
          this.checkLoveSpouseConnection();
        }
      });
    }
  },

  enableLoveSpouseMode() {
    this.loveSpouseMode = true;
    localStorage.setItem('sx_lovespouse_mode', '1');
    this.updateModeUI();
    this.startLoveSpouseHealthCheck();
    
    const gattElements = document.querySelectorAll('.gatt-only');
    gattElements.forEach(el => el.style.display = 'none');
    
    const lsElements = document.querySelectorAll('.lovespouse-only');
    lsElements.forEach(el => el.style.display = 'block');
  },

  disableLoveSpouseMode() {
    this.loveSpouseMode = false;
    localStorage.setItem('sx_lovespouse_mode', '0');
    this.stopLoveSpouseHealthCheck();
    this.updateModeUI();
    
    const gattElements = document.querySelectorAll('.gatt-only');
    gattElements.forEach(el => el.style.display = 'block');
    
    const lsElements = document.querySelectorAll('.lovespouse-only');
    lsElements.forEach(el => el.style.display = 'none');
  },

  toggleMode() {
    if (this.loveSpouseMode) {
      this.disableLoveSpouseMode();
    } else {
      this.enableLoveSpouseMode();
    }
  },

  updateModeUI() {
    const modeBtn = document.getElementById('mode-toggle-btn');
    if (modeBtn) {
      modeBtn.textContent = this.loveSpouseMode ? 'GATT 模式' : 'Love Spouse';
    }
    this.updateConnectionStatus();
  },

  async checkLoveSpouseConnection() {
    if (!this.loveSpouseServerIp) {
      this.loveSpouseConnected = false;
      this.updateConnectionStatus();
      return false;
    }

    try {
      const url = `http://${this.loveSpouseServerIp}:8080/health`;
      const response = await fetch(url, { 
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      
      if (response.ok) {
        const data = await response.json();
        this.loveSpouseConnected = true;
        console.log('Love Spouse server connected:', data);
        this.updateConnectionStatus();
        return true;
      }
    } catch (error) {
      console.warn('Love Spouse server not reachable:', error.message);
    }
    
    this.loveSpouseConnected = false;
    this.updateConnectionStatus();
    return false;
  },

  startLoveSpouseHealthCheck() {
    this.stopLoveSpouseHealthCheck();
    this.checkLoveSpouseConnection();
    this.loveSpouseHealthCheckInterval = setInterval(() => {
      this.checkLoveSpouseConnection();
    }, 5000);
  },

  stopLoveSpouseHealthCheck() {
    if (this.loveSpouseHealthCheckInterval) {
      clearInterval(this.loveSpouseHealthCheckInterval);
      this.loveSpouseHealthCheckInterval = null;
    }
  },

  async sendLoveSpouseCommand(intensity, duration) {
    if (!this.loveSpouseMode || !this.loveSpouseServerIp) {
      console.warn('Love Spouse mode not enabled or server IP not set');
      return false;
    }

    try {
      const url = `http://${this.loveSpouseServerIp}:8080/vibrate`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intensity, duration }),
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Love Spouse command sent:', data);
        return true;
      } else {
        console.error('Love Spouse command failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Love Spouse command error:', error);
      return false;
    }
  },

  async sendLoveSpouseIntensity(level) {
    return this.sendLoveSpouseCommand(level, 0);
  },

  async sendLoveSpouseStop() {
    return this.sendLoveSpouseCommand(0, 0);
  },

  checkBluetoothAvailability() {
    if (!navigator.bluetooth) {
      console.warn('Web Bluetooth API 不可用');
      const searchBtn = document.getElementById('search-btn');
      if (searchBtn) {
        searchBtn.disabled = true;
        searchBtn.innerHTML = '<i class="fas fa-bluetooth-b"></i> 瀏覽器不支援';
      }
    } else {
      navigator.bluetooth.getAvailability().then(available => {
        console.log('Bluetooth available:', available);
      });
    }
  },

  loadSavedDevices() {
    try {
      const saved = localStorage.getItem(PASSKEY_STORAGE_KEY);
      this.savedDevices = saved ? JSON.parse(saved) : [];
      console.log('已載入儲存的設備:', this.savedDevices.length);
    } catch (e) {
      this.savedDevices = [];
    }
  },

  saveDevice(device) {
    if (!device) return;
    const existing = this.savedDevices.find(d => d.id === device.id);
    if (!existing) {
      this.savedDevices.push({
        id: device.id,
        name: device.name || '未知設備',
        savedAt: Date.now()
      });
      localStorage.setItem(PASSKEY_STORAGE_KEY, JSON.stringify(this.savedDevices));
    }
  },

  async startScanning() {
    if (this.scanning) {
      console.log('Already scanning');
      return;
    }

    if (!navigator.bluetooth) {
      alert('您的瀏覽器不支援 Web Bluetooth API。請使用 Chrome、Edge 或 Opera 瀏覽器。');
      return;
    }

    try {
      this.scanning = true;
      this.showScanningIndicator(true);
      
      document.getElementById('search-btn').style.display = 'none';
      document.getElementById('stop-search-btn').style.display = 'flex';
      
      console.log('Starting Bluetooth scan...');

      const options = {
        acceptAllDevices: true,
        optionalServices: [
          'battery_service',
          'device_information',
          'generic_access',
          'generic_attribute',
          'human_interface_device',
          'heart_rate',
          'cycling_power',
          'cycling_speed_and_cadence',
          'blood_pressure',
          'health_thermometer',
          '00001801-0000-1000-8000-00805f9b34fb',
          '00001800-0000-1000-8000-00805f9b34fb',
          '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
          '49535343-fe7d-4ae5-8fa9-9fafd205e455',
          '0000ff00-0000-1000-8000-00805f9b34fb',
          '0000fff0-0000-1000-8000-00805f9b34fb'
        ]
      };

      const device = await navigator.bluetooth.requestDevice(options);

      if (device) {
        device.addEventListener('gattserverdisconnected', () => {
          this.onDeviceDisconnected();
        });
        
        this.devices.push(device);
        const meta = await this.resolveDeviceType(device);
        this.deviceMeta[device.id] = meta;
        this.renderDeviceList();
        
        console.log('Device found:', device.name || 'Unknown', device.id);
      }
      
    } catch (error) {
      console.error('Bluetooth scan error:', error);
      if (error.name === 'NotFoundError') {
        console.log('用戶取消掃描');
      } else {
        alert('掃描失敗: ' + error.message);
      }
    } finally {
      this.scanning = false;
      this.showScanningIndicator(false);
      document.getElementById('search-btn').style.display = 'flex';
      document.getElementById('stop-search-btn').style.display = 'none';
    }
  },

  // 停止掃描
  stopScanning() {
    this.scanning = false;
    this.showScanningIndicator(false);
    document.getElementById('search-btn').style.display = 'flex';
    document.getElementById('stop-search-btn').style.display = 'none';
  },

  // 顯示掃描指示器
  showScanningIndicator(show) {
    const indicator = document.getElementById('scanning-indicator');
    if (show) {
      indicator.style.display = 'flex';
    } else {
      indicator.style.display = 'none';
    }
  },

  // 渲染設備列表
  renderDeviceList() {
    const listElement = document.getElementById('device-list');
    
    if (this.devices.length === 0) {
      listElement.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-bluetooth-b fa-2x"></i>
          <p>點擊上方按鈕搜尋藍牙設備</p>
        </div>
      `;
      return;
    }

    let html = '';
    this.devices.forEach((device, index) => {
      const meta = this.deviceMeta[device.id] || {};
      const icon = meta.icon || this.getDeviceIcon(device, meta);
      const typeLabel = meta.typeLabel ? `<div class="device-type">${meta.typeLabel}</div>` : '';
      html += `
        <div class="device-item" onclick="PasskeyApp.connectToDevice(${index})">
          <div class="device-info">
            <div class="device-icon">${icon}</div>
            <div class="device-details">
              <div class="device-name">${device.name || '未知設備'}</div>
              ${typeLabel}
              <div class="device-rssi">RSSI: ${device.rssi || 'N/A'} dBm</div>
            </div>
          </div>
          <button class="connect-btn">連接</button>
        </div>
      `;
    });

    listElement.innerHTML = html;
  },

  // 獲取設備圖標與類型
  getDeviceIcon(device, meta = {}) {
    const name = (device.name || '').toLowerCase();
    const label = (meta.typeLabel || '').toLowerCase();
    const merged = `${name} ${label}`;
    
    if (merged.includes('speaker') || merged.includes('soundbar') || merged.includes('sound bar') || merged.includes('audio') || merged.includes('sound') || merged.includes('音響') || merged.includes('喇叭')) {
      return '<i class="fas fa-volume-up"></i>';
    } else if (merged.includes('headphone') || merged.includes('earphone') || merged.includes('headset') || merged.includes('earbud') || merged.includes('earbuds') || merged.includes('airpod') || merged.includes('buds') || merged.includes('耳機')) {
      return '<i class="fas fa-headphones"></i>';
    } else if (merged.includes('phone') || merged.includes('手機') || merged.includes('iphone') || merged.includes('android') || merged.includes('pixel') || merged.includes('samsung') || merged.includes('galaxy') || merged.includes('xiaomi') || merged.includes('huawei') || merged.includes('oppo') || merged.includes('vivo')) {
      return '<i class="fas fa-mobile-alt"></i>';
    } else if (merged.includes('toy') || merged.includes('vibrator') || merged.includes('vibe') || merged.includes('intimate') || merged.includes('sex') || merged.includes('情趣') || merged.includes('跳蛋') || merged.includes('lovense') || merged.includes('lelov') || merged.includes('lush') || merged.includes('wevibe') || merged.includes('svakom') || merged.includes('satisfyer') || merged.includes('buttplug') || merged.includes('dildo') || merged.includes('bullet')) {
      return '<i class="fas fa-heart"></i>';
    } else if (merged.includes('keyboard') || merged.includes('mouse')) {
      return '<i class="fas fa-keyboard"></i>';
    } else if (merged.includes('game') || merged.includes('controller')) {
      return '<i class="fas fa-gamepad"></i>';
    } else {
      return '<i class="fas fa-bluetooth-b"></i>';
    }
  },

  async resolveDeviceType(device) {
    const meta = { typeLabel: '未知裝置', icon: '<i class="fas fa-bluetooth-b"></i>' };
    if (!device) return meta;

    const name = (device.name || '').toLowerCase();
    const setType = (label) => {
      if (meta.typeLabel === '未知裝置') {
        meta.typeLabel = label;
      }
    };

    const keywordMap = [
      { label: '手機', keywords: ['phone', 'iphone', 'android', 'pixel', 'samsung', 'galaxy', 'xiaomi', 'huawei', 'oppo', 'vivo', '手機'] },
      { label: '耳機', keywords: ['headphone', 'earphone', 'headset', 'earbud', 'earbuds', 'airpod', 'buds', '耳機'] },
      { label: '音響', keywords: ['speaker', 'soundbar', 'sound bar', 'audio', 'sound', '音響', '喇叭'] },
      { label: '情趣用品', keywords: ['toy', 'vibrator', 'vibe', 'intimate', 'sex', 'lovense', 'lelov', 'lush', 'wevibe', 'svakom', 'satisfyer', 'buttplug', 'dildo', 'bullet', '情趣', '跳蛋'] },
      { label: '人機裝置', keywords: ['keyboard', 'mouse'] },
      { label: '遊戲裝置', keywords: ['gamepad', 'controller', 'game'] }
    ];

    if (name) {
      keywordMap.some((group) => {
        if (group.keywords.some((keyword) => name.includes(keyword))) {
          setType(group.label);
          return true;
        }
        return false;
      });
    }

    try {
      if (device.gatt) {
        let server = null;
        let connectedHere = false;
        if (device.gatt.connected) {
          server = device.gatt;
        } else {
          server = await device.gatt.connect();
          connectedHere = true;
        }

        const services = await server.getPrimaryServices();
        const uuids = services.map(service => service.uuid);
        if (uuids.includes('00001812-0000-1000-8000-00805f9b34fb')) {
          meta.typeLabel = '人機裝置';
        } else if (uuids.includes('0000180f-0000-1000-8000-00805f9b34fb') || uuids.includes('0000180a-0000-1000-8000-00805f9b34fb')) {
          setType('一般裝置');
        }

        if (connectedHere && server?.disconnect) {
          server.disconnect();
        }
      }
    } catch (error) {
      console.warn('無法解析裝置類型:', error.message || error);
    }

    meta.icon = this.getDeviceIcon(device, meta);
    return meta;
  },

  async connectToDevice(index) {
    const device = this.devices[index];
    
    if (!device) {
      console.error('Invalid device index');
      return;
    }

    try {
      this.connectionStatus = 'connecting';
      this.updateConnectionStatus();
      
      console.log('Connecting to device:', device.name || device.id);

      this.bluetoothDevice = device;

      if (!device.gatt) {
        throw new Error('設備不支援 GATT');
      }

      device.addEventListener('gattserverdisconnected', () => {
        this.onDeviceDisconnected();
      });

      let attempts = 0;
      let lastError = null;

      while (attempts < PASSKEY_MAX_RECONNECT_ATTEMPTS) {
        try {
          attempts++;
          console.log(`Connection attempt ${attempts}/${PASSKEY_MAX_RECONNECT_ATTEMPTS}`);
          
          this.server = await device.gatt.connect();
          console.log('GATT server connected');
          break;
        } catch (err) {
          lastError = err;
          console.warn(`Connection attempt ${attempts} failed:`, err.message);
          
          if (attempts < PASSKEY_MAX_RECONNECT_ATTEMPTS) {
            await this.sleep(PASSKEY_RECONNECT_DELAY);
          }
        }
      }

      if (!this.server) {
        throw lastError || new Error('無法建立 GATT 連接');
      }

      await this.discoverServices();
      
      this.connectionStatus = 'connected';
      this.connectedDevice = device;
      this.reconnectAttempts = 0;
      this.saveDevice(device);
      this.updateConnectionStatus();
      
      document.getElementById('control-panel').style.display = 'block';
      
      console.log('Successfully connected to device:', device.name || device.id);
      
    } catch (error) {
      console.error('Connection error:', error);
      this.connectionStatus = 'disconnected';
      this.updateConnectionStatus();
      
      let errorMsg = '連接失敗: ' + error.message;
      if (error.name === 'NetworkError') {
        errorMsg = '連接失敗: 設備可能已關閉或超出範圍';
      } else if (error.name === 'SecurityError') {
        errorMsg = '連接失敗: 權限被拒絕，請重新掃描設備';
      }
      alert(errorMsg);
    }
  },

  onDeviceDisconnected() {
    console.log('Device disconnected');
    this.connectionStatus = 'disconnected';
    this.connectedDevice = null;
    this.server = null;
    this.characteristics = {};
    this.activeCharacteristic = null;
    this.notifyCharacteristic = null;
    this.updateConnectionStatus();
    document.getElementById('control-panel').style.display = 'none';
  },

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  async discoverServices() {
    if (!this.server) return;

    try {
      const primaryServices = await this.server.getPrimaryServices();
      
      console.log('Discovered services:', primaryServices.length);
      this.characteristics = {};
      
      for (const service of primaryServices) {
        const uuid = service.uuid;
        console.log('Service UUID:', uuid);
        
        try {
          const characteristics = await service.getCharacteristics();
          
          for (const characteristic of characteristics) {
            const charUUID = characteristic.uuid;
            const props = characteristic.properties;
            
            console.log('Characteristic:', charUUID, {
              read: props.read,
              write: props.write,
              writeWithoutResponse: props.writeWithoutResponse,
              notify: props.notify
            });

            if (!this.characteristics[uuid]) {
              this.characteristics[uuid] = [];
            }
            this.characteristics[uuid].push(characteristic);

            if (props.write || props.writeWithoutResponse) {
              if (!this.activeCharacteristic) {
                this.activeCharacteristic = characteristic;
                console.log('Set active write characteristic:', charUUID);
              }
            }

            if (props.notify) {
              if (!this.notifyCharacteristic) {
                this.notifyCharacteristic = characteristic;
                this.setupNotification(characteristic);
              }
            }

            if (props.read) {
              try {
                const value = await characteristic.readValue();
                console.log('Read value from', charUUID, ':', this.bufferToHex(value));
              } catch (readErr) {
                console.log('Could not read:', readErr.message);
              }
            }
          }
        } catch (charErr) {
          console.warn('Could not get characteristics for service', uuid, charErr.message);
        }
      }

      if (!this.activeCharacteristic) {
        console.warn('No writable characteristic found');
      }
      
    } catch (error) {
      console.error('Service discovery error:', error);
      throw error;
    }
  },

  async setupNotification(characteristic) {
    try {
      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', (event) => {
        const value = event.target.value;
        console.log('Notification received:', this.bufferToHex(value));
      });
      console.log('Notifications enabled for:', characteristic.uuid);
    } catch (err) {
      console.warn('Could not enable notifications:', err.message);
    }
  },

  bufferToHex(buffer) {
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(' ');
  },

  disconnectDevice() {
    if (this.bluetoothDevice && this.bluetoothDevice.gatt.connected) {
      this.bluetoothDevice.gatt.disconnect();
    }
    
    this.connectionStatus = 'disconnected';
    this.connectedDevice = null;
    this.bluetoothDevice = null;
    this.server = null;
    this.characteristics = {};
    this.activeCharacteristic = null;
    this.notifyCharacteristic = null;
    
    this.updateConnectionStatus();
    document.getElementById('control-panel').style.display = 'none';
    
    console.log('Disconnected from device');
  },

  async sendCommand(command) {
    if (!this.server) {
      alert('請先連接設備');
      return;
    }

    if (!this.activeCharacteristic) {
      alert('此設備沒有可寫入的特徵');
      return;
    }

    try {
      console.log('Sending command:', command);
      
      let data;
      switch (command) {
        case 'power_on':
          data = new Uint8Array([0x01]);
          break;
        case 'power_off':
          data = new Uint8Array([0x00]);
          break;
        case 'volume_up':
          data = new Uint8Array([0x02]);
          break;
        case 'volume_down':
          data = new Uint8Array([0x03]);
          break;
        case 'pattern_1':
          data = new Uint8Array([0x10, 0x01]);
          break;
        case 'pattern_2':
          data = new Uint8Array([0x10, 0x02]);
          break;
        case 'pattern_3':
          data = new Uint8Array([0x10, 0x03]);
          break;
        default:
          data = new Uint8Array([0xFF]);
      }

      await this.writeToCharacteristic(data);
      console.log('Command sent successfully:', command);
      
    } catch (error) {
      console.error('Command send error:', error);
      alert('發送命令失敗: ' + error.message);
    }
  },

  async sendIntensity(value) {
    const intensityValue = parseInt(value);
    const slider = document.getElementById('intensity-slider');
    const display = document.getElementById('intensity-value');
    if (slider) slider.value = intensityValue;
    if (display) display.textContent = intensityValue + '%';

    if (!this.server || !this.activeCharacteristic) return;
    
    try {
      const data = new Uint8Array([0x20, intensityValue]);
      await this.writeToCharacteristic(data);
      console.log('Intensity set to:', intensityValue);
    } catch (error) {
      console.error('Intensity control error:', error);
    }
  },

  async sendFrequency(value) {
    const frequencyValue = parseInt(value);
    const slider = document.getElementById('frequency-slider');
    const display = document.getElementById('frequency-value');
    if (slider) slider.value = frequencyValue;
    if (display) display.textContent = frequencyValue + '%';

    if (!this.server || !this.activeCharacteristic) return;
    
    try {
      const data = new Uint8Array([0x21, frequencyValue]);
      await this.writeToCharacteristic(data);
      console.log('Frequency set to:', frequencyValue);
    } catch (error) {
      console.error('Frequency control error:', error);
    }
  },

  async writeToCharacteristic(data) {
    if (!this.activeCharacteristic) {
      throw new Error('No writable characteristic available');
    }

    const char = this.activeCharacteristic;
    const props = char.properties;

    try {
      if (props.writeWithoutResponse) {
        await char.writeValueWithoutResponse(data);
        console.log('Written without response:', this.bufferToHex(data));
      } else if (props.write) {
        await char.writeValueWithResponse(data);
        console.log('Written with response:', this.bufferToHex(data));
      } else {
        throw new Error('Characteristic is not writable');
      }
    } catch (err) {
      console.error('Write failed:', err);
      throw err;
    }
  },

  bufferToString(buffer) {
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
  },

  updateConnectionStatus() {
    const statusElement = document.getElementById('connection-status');
    const deviceElement = document.getElementById('connected-device');
    const deviceNameElement = document.getElementById('device-name');
    
    if (this.loveSpouseMode) {
      if (this.loveSpouseConnected) {
        statusElement.textContent = 'Love Spouse 已連線';
        statusElement.style.color = '#4ade80';
        deviceNameElement.textContent = `Server: ${this.loveSpouseServerIp}:8080`;
        deviceElement.style.display = 'flex';
      } else {
        statusElement.textContent = 'Love Spouse 未連線';
        statusElement.style.color = '#ef4444';
        deviceElement.style.display = 'none';
      }
      return;
    }
    
    if (this.connectionStatus === 'connected' && this.connectedDevice) {
      statusElement.textContent = '已連接';
      statusElement.style.color = '#4ade80';
      deviceNameElement.textContent = this.connectedDevice.name || '未知設備';
      deviceElement.style.display = 'flex';
    } else if (this.connectionStatus === 'connecting') {
      statusElement.textContent = '連接中...';
      statusElement.style.color = '#fbbf24';
      deviceElement.style.display = 'none';
    } else {
      statusElement.textContent = '未連接';
      statusElement.style.color = '#ef4444';
      deviceElement.style.display = 'none';
    }
  },

  // 從世界書載入角色
  loadCharactersFromWorldbook() {
    try {
      // 從 localStorage 獲取世界書數據
      const categories = ['cot', 'style', 'global', 'keywords', 'backend'];
      const characters = [];
      
      categories.forEach(cat => {
        const key = `sx_worldbook_${cat}`;
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const worldbookData = JSON.parse(data);
            // 從世界書數據中提取角色名稱
            worldbookData.forEach(item => {
              if (item.title && !characters.includes(item.title)) {
                characters.push(item.title);
              }
            });
          } catch (e) {
            console.warn(`解析世界書 ${cat} 失敗:`, e);
          }
        }
      });

      this.populateCharacterSelect(characters);
    } catch (error) {
      console.error('載入世界書角色失敗:', error);
    }
  },

  // 從設定載入角色
  loadCharactersFromSettings() {
    try {
      const characters = [];
      
      // 使用 SxSettings 統一讀取
      if (typeof SxSettings !== 'undefined') {
        const settings = SxSettings.getSettingsSnapshot();
        settings.characters.forEach(c => {
          if (c.name && !characters.includes(c.name)) characters.push(c.name);
        });
        settings.users.forEach(u => {
          if (u.name && !characters.includes(u.name)) characters.push(u.name);
        });
        settings.npcs.forEach(n => {
          if (n.name && !characters.includes(n.name)) characters.push(n.name);
        });
        console.log('[passkey] Loaded from SxSettings:', characters.length);
      }
      
      // 備用：從 localStorage 獲取角色設定
      const masks = JSON.parse(localStorage.getItem('sx_masks') || '[]');
      masks.forEach(mask => {
        if (mask.name && !characters.includes(mask.name)) {
          characters.push(mask.name);
        }
      });

      this.populateCharacterSelect(characters);
    } catch (error) {
      console.error('載入設定角色失敗:', error);
    }
  },

  // 填充角色選擇下拉菜單
  populateCharacterSelect(characters) {
    const selectElement = document.getElementById('character-select');
    if (!selectElement) return;
    
    // 清空現有選項（保留第一個提示選項）
    selectElement.innerHTML = '<option value="">-- 選擇角色 --</option>';
    
    // 添加新選項
    characters.forEach(character => {
      const option = document.createElement('option');
      option.value = character;
      option.textContent = character;
      selectElement.appendChild(option);
    });

    const storedCharacter = localStorage.getItem('sx_passkey_character') || '';
    if (storedCharacter && characters.includes(storedCharacter)) {
      selectElement.value = storedCharacter;
      this.onCharacterSelectChange(selectElement, true);
    }
  },

  // 取得角色資料
  getCharacterData(name) {
    if (!name) return null;

    const masks = JSON.parse(localStorage.getItem('sx_masks') || '[]');
    const mask = masks.find(item => item.name === name);
    if (mask) {
      return {
        name,
        personality: mask.personality || '',
        background: mask.background || '',
        source: 'settings'
      };
    }

    const categories = ['cot', 'style', 'global', 'keywords', 'backend'];
    for (const cat of categories) {
      const key = `sx_worldbook_${cat}`;
      const data = localStorage.getItem(key);
      if (!data) continue;
      try {
        const worldbookData = JSON.parse(data);
        const entry = worldbookData.find(item => item.title === name);
        if (entry) {
          return {
            name,
            personality: entry.content || '',
            background: '',
            source: 'worldbook'
          };
        }
      } catch (e) {
        console.warn(`解析世界書 ${cat} 失敗:`, e);
      }
    }

    return { name, personality: '', background: '', source: 'unknown' };
  },

  applyStoredCharacterProfile() {
    const storedCharacter = localStorage.getItem('sx_passkey_character') || '';
    if (!storedCharacter) return;
    this.personalityCharacter = storedCharacter;

    const data = this.getCharacterData(storedCharacter);
    const mergedText = `${storedCharacter}\n${data?.personality || ''}\n${data?.background || ''}`;
    const personalityType = this.detectPersonalityType(mergedText);
    this.personalityProfile = this.getPersonalityProfile(personalityType);

    console.log('載入角色控制風格:', storedCharacter, personalityType);
  },

  bindPasskeyHandoffListener() {
    window.addEventListener('message', (event) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;
      if (data.type === 'PASSKEY_CONTROL_HANDOFF') {
        const payload = data.payload || {};
        this.handleHandoffPayload(payload);
      }
      if (data.type === 'LOVESPOUSE_COMMAND') {
        const payload = data.payload || {};
        this.handleLoveSpouseCommand(payload);
      }
    });

    const stored = localStorage.getItem('sx_passkey_control_handoff');
    if (stored) {
      try {
        const payload = JSON.parse(stored);
        this.handleHandoffPayload(payload);
      } catch (error) {
        console.warn('無法解析交接資料:', error);
      }
    }
    
    const lsCommand = localStorage.getItem('sx_lovespouse_command');
    if (lsCommand) {
      try {
        const payload = JSON.parse(lsCommand);
        this.handleLoveSpouseCommand(payload);
        localStorage.removeItem('sx_lovespouse_command');
      } catch (error) {
        console.warn('無法解析 Love Spouse 命令:', error);
      }
    }
  },

  handleLoveSpouseCommand(payload) {
    if (!this.loveSpouseMode) {
      console.log('Love Spouse mode not enabled, ignoring command');
      return;
    }
    
    const intensity = payload.intensity || 0;
    const duration = payload.duration || 0;
    
    console.log('Handling Love Spouse command:', { intensity, duration });
    this.sendLoveSpouseCommand(intensity, duration);
  },

  handleHandoffPayload(payload = {}) {
    if (!payload) return;

    const character = payload.character || localStorage.getItem('sx_passkey_character') || '';
    if (character && character !== this.personalityCharacter) {
      this.personalityCharacter = character;
      const data = this.getCharacterData(character);
      const mergedText = `${character}\n${data?.personality || ''}\n${data?.background || ''}`;
      const personalityType = this.detectPersonalityType(mergedText);
      this.personalityProfile = this.getPersonalityProfile(personalityType);
    }

    if (this.personalityProfile) {
      this.applyPersonalityControl(this.personalityProfile, payload.text || '');
    }
  },

  detectPersonalityType(text) {
    const content = (text || '').toLowerCase();
    const gentle = ['溫柔', '體貼', '柔和', '溫暖', '害羞', '細膩', '輕聲', 'gentle'];
    const strong = ['強勢', '霸道', '主導', '強硬', '嚴厲', '支配', '命令', 'intense', 'steady'];
    const playful = ['調皮', '活潑', '俏皮', '淘氣', '戲弄', '挑逗', 'tease', 'pulse'];

    if (strong.some(word => content.includes(word.toLowerCase()))) return 'strong';
    if (playful.some(word => content.includes(word.toLowerCase()))) return 'playful';
    if (gentle.some(word => content.includes(word.toLowerCase()))) return 'gentle';

    return 'gentle';
  },

  getPersonalityProfile(type) {
    if (type === 'strong') {
      return { type: 'strong', intensity: [70, 90], frequency: [70, 90], commands: ['intense', 'steady'], pattern: 'pattern_3' };
    }
    if (type === 'playful') {
      return { type: 'playful', intensity: [40, 60], frequency: [50, 70], commands: ['tease', 'pulse'], pattern: 'pattern_2' };
    }
    return { type: 'gentle', intensity: [20, 40], frequency: [20, 40], commands: ['gentle', 'pulse'], pattern: 'pattern_1' };
  },

  pickValue(range) {
    const [min, max] = range;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  async applyPersonalityControl(profile, contextText = '') {
    if (!profile) return;

    const intensityValue = this.pickValue(profile.intensity);
    const frequencyValue = this.pickValue(profile.frequency);
    
    if (this.loveSpouseMode) {
      const lsIntensity = Math.min(3, Math.floor(intensityValue / 25));
      await this.sendLoveSpouseCommand(lsIntensity, 0);
      console.log('Love Spouse control applied:', { lsIntensity, contextText });
      return;
    }

    await this.sendIntensity(intensityValue);
    await this.sendFrequency(frequencyValue);

    if (profile.pattern) {
      await this.sendCommand(profile.pattern);
    }

    console.log('已套用角色控制風格:', profile.type, { intensityValue, frequencyValue, contextText });
  },

  // 當選擇角色時的處理
  onCharacterSelectChange(selectElement, autoApplied = false) {
    const selectedCharacter = selectElement.value;
    if (!selectedCharacter) return;

    localStorage.setItem('sx_passkey_character', selectedCharacter);

    const data = this.getCharacterData(selectedCharacter);
    const mergedText = `${selectedCharacter}\n${data?.personality || ''}\n${data?.background || ''}`;
    const personalityType = this.detectPersonalityType(mergedText);
    const profile = this.getPersonalityProfile(personalityType);

    this.personalityCharacter = selectedCharacter;
    this.personalityProfile = profile;

    console.log(`選擇的角色: ${selectedCharacter}`, { personalityType, source: data?.source || 'unknown' });

    if (!autoApplied) {
      this.applyPersonalityControl(profile, mergedText);
    } else {
      this.applyPersonalityControl(profile, mergedText);
    }
  }
};

// 全局函數供 HTML 使用
function startScanning() {
  PasskeyApp.startScanning();
}

function stopScanning() {
  PasskeyApp.stopScanning();
}

function disconnectDevice() {
  PasskeyApp.disconnectDevice();
}

function sendCommand(command) {
  PasskeyApp.sendCommand(command);
}

function sendIntensity(value) {
  PasskeyApp.sendIntensity(value);
}

function sendFrequency(value) {
  PasskeyApp.sendFrequency(value);
}

function testConnection() {
  // 模擬連接狀態
  PasskeyApp.connectionStatus = 'connected';
  PasskeyApp.connectedDevice = {
    name: '測試設備',
    rssi: -50
  };
  PasskeyApp.updateConnectionStatus();
  
  // 顯示控制面板
  document.getElementById('control-panel').style.display = 'block';
  
  // 更新設備列表以顯示模擬設備
  PasskeyApp.devices = [{
    name: '測試設備',
    rssi: -50
  }];
  PasskeyApp.renderDeviceList();
}

function loadCharactersFromWorldbook() {
  PasskeyApp.loadCharactersFromWorldbook();
}

function loadCharactersFromSettings() {
  PasskeyApp.loadCharactersFromSettings();
}

function onCharacterSelectChange(selectElement) {
  PasskeyApp.onCharacterSelectChange(selectElement);
}

function toggleMode() {
  PasskeyApp.toggleMode();
}

function sendLoveSpouseIntensity(level) {
  PasskeyApp.sendLoveSpouseIntensity(level);
}

function sendLoveSpouseStop() {
  PasskeyApp.sendLoveSpouseStop();
}

function checkLoveSpouseConnection() {
  PasskeyApp.checkLoveSpouseConnection();
}

// 初始化應用
document.addEventListener('DOMContentLoaded', () => {
  PasskeyApp.init();
});