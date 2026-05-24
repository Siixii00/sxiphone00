/**
 * image-uploader.js
 *
 * 統一圖床上傳模組。
 * 自動將 base64 / Blob / File 圖片上傳到圖床，回傳 URL。
 * 支援多個圖床提供者（可擴充），目前內建：
 *   - catbox.moe（免費、無限期、200MB）
 *   - imgbb（需 API key）
 *
 * 使用方式：
 *   const url = await ImageUploader.upload(base64OrBlobOrFile);
 *   // url = 'https://files.catbox.moe/xxxxx.png' or null (失敗)
 *
 * 設定：
 *   sx_image_host_enabled   = 'true' | 'false'
 *   sx_image_host_provider  = 'catbox' | 'imgbb'
 *   sx_catbox_userhash      = ''   (可選)
 *   sx_imgbb_api_key        = ''   (需要時)
 */
(function (global) {
  'use strict';

  const SETTING_ENABLED  = 'sx_image_host_enabled';
  const SETTING_PROVIDER = 'sx_image_host_provider';
  const SETTING_CATBOX   = 'sx_catbox_userhash';
  const SETTING_IMGBB    = 'sx_imgbb_api_key';

  // 判斷字串是否為 base64 data URI
  function isBase64(str) {
    return typeof str === 'string' && str.startsWith('data:');
  }

  // 判斷字串是否為有效的遠端 URL（非 base64）
  function isRemoteUrl(str) {
    return typeof str === 'string' && (str.startsWith('https://') || str.startsWith('http://'));
  }

  // base64 data URI → File
  async function base64ToFile(dataUri, filename) {
    const res = await fetch(dataUri);
    const blob = await res.blob();
    const ext = (dataUri.split(';')[0].split('/')[1] || 'png').replace('+xml', '');
    return new File([blob], filename || `image_${Date.now()}.${ext}`, { type: blob.type || 'image/png' });
  }

  // ─── 圖床提供者 ─────────────────────────────────────────────────────────────

  const providers = {
    /**
     * catbox.moe — 免費、無帳號可用、最大 200MB
     */
    async catbox(file) {
      const formData = new FormData();
      formData.append('reqtype', 'fileupload');
      formData.append('fileToUpload', file);

      const userhash = localStorage.getItem(SETTING_CATBOX) || '';
      if (userhash) formData.append('userhash', userhash);

      const res = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error(`catbox HTTP ${res.status}`);
      const url = (await res.text()).trim();
      if (!url.startsWith('https://')) throw new Error('catbox 回傳非 URL: ' + url.slice(0, 80));
      return url;
    },

    /**
     * imgbb — 免費（需 API key）
     */
    async imgbb(file) {
      const apiKey = localStorage.getItem(SETTING_IMGBB) || '';
      if (!apiKey) throw new Error('imgbb API key 未設定');

      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error(`imgbb HTTP ${res.status}`);
      const json = await res.json();
      if (!json?.data?.url) throw new Error('imgbb 回傳無 URL');
      return json.data.url;
    }
  };

  // ─── 公開 API ──────────────────────────────────────────────────────────────

  const ImageUploader = {
    /**
     * 圖床是否已啟用
     */
    isEnabled() {
      return localStorage.getItem(SETTING_ENABLED) === 'true';
    },

    /**
     * 目前使用的圖床
     */
    getProvider() {
      return localStorage.getItem(SETTING_PROVIDER) || 'catbox';
    },

    /**
     * 上傳圖片到圖床
     * @param {string|Blob|File} source - base64 data URI / Blob / File
     * @param {object} [options]
     * @param {string} [options.filename] - 檔名
     * @param {boolean} [options.force] - 強制上傳，忽略 isEnabled() 檢查
     * @returns {Promise<string|null>} 圖床 URL，失敗回傳 null
     */
    async upload(source, options = {}) {
      if (!options.force && !this.isEnabled()) return null;
      if (!source) return null;

      // 已經是遠端 URL → 不需要上傳
      if (isRemoteUrl(source)) return source;

      try {
        let file;
        if (source instanceof File) {
          file = source;
        } else if (source instanceof Blob) {
          file = new File([source], options.filename || `img_${Date.now()}.png`, { type: source.type || 'image/png' });
        } else if (isBase64(source)) {
          file = await base64ToFile(source, options.filename);
        } else {
          console.warn('[ImageUploader] 無法辨識的 source 類型');
          return null;
        }

        // 限制 50MB
        if (file.size > 50 * 1024 * 1024) {
          console.warn('[ImageUploader] 檔案過大:', (file.size / 1024 / 1024).toFixed(1), 'MB');
          return null;
        }

        const provider = this.getProvider();
        const fn = providers[provider];
        if (!fn) {
          console.warn('[ImageUploader] 不支援的圖床:', provider);
          return null;
        }

        const url = await fn(file);
        console.info(`[ImageUploader] 上傳成功 (${provider}):`, url);
        return url;
      } catch (e) {
        console.warn('[ImageUploader] 上傳失敗:', e.message || e);
        return null;
      }
    },

    /**
     * 嘗試上傳，失敗時回傳原值（降級策略）
     * @param {string} source - base64 or URL
     * @returns {Promise<string>} URL (上傳成功) 或原 source (失敗)
     */
    async uploadOrKeep(source, options = {}) {
      if (!source) return source;
      if (isRemoteUrl(source)) return source; // 已是 URL
      if (!isBase64(source)) return source;   // 不是 base64

      const url = await this.upload(source, options);
      return url || source;
    },

    /**
     * 批次上傳：掃描 object 中所有 base64 值，上傳後回填 URL
     * @param {object} obj - 要處理的物件
     * @param {string[]} keys - 要掃描的 key 列表
     * @returns {Promise<{uploaded: number, failed: number}>}
     */
    async uploadObjectFields(obj, keys) {
      let uploaded = 0, failed = 0;
      for (const key of keys) {
        const val = obj[key];
        if (isBase64(val)) {
          const url = await this.upload(val);
          if (url) {
            obj[key] = url;
            uploaded++;
          } else {
            failed++;
          }
        }
      }
      return { uploaded, failed };
    },

    // 暴露 helper 供外部使用
    isBase64,
    isRemoteUrl,
    base64ToFile
  };

  // ─── 自動攔截：寫入圖片 key 時自動上傳 ─────────────────────────────────────
  // 對特定 key（avatar, wallpaper, lockscreen）進行「寫入後非同步上傳回填」
  const AUTO_UPLOAD_KEYS = new Set([
    'sx_char_avatar',
    'sx_user_avatar',
    'userWallpaper',
    'userLockscreen'
  ]);

  // 在 localStorage-mirror 攔截後，sxStorage.setItem 是最終寫入端
  // 我們用 MutationObserver 式的 post-write hook
  let _originalSxSetItem = null;

  function _installAutoUploadHook() {
    if (!ImageUploader.isEnabled()) return;
    if (_originalSxSetItem) return; // 已安裝
    if (typeof sxStorage === 'undefined' || !sxStorage) return;

    _originalSxSetItem = sxStorage.setItem.bind(sxStorage);

    sxStorage.setItem = async function (key, value) {
      // 先寫入原值（確保同步性）
      await _originalSxSetItem(key, value);

      // 如果是圖片 key 且值為 base64 → 非同步上傳後回填
      if (AUTO_UPLOAD_KEYS.has(key) && typeof value === 'string' && isBase64(value)) {
        // 非同步上傳，不阻塞
        ImageUploader.upload(value).then(url => {
          if (url && url !== value) {
            _originalSxSetItem(key, url).then(() => {
              console.info(`[ImageUploader] 自動上傳 ${key} → ${url.slice(0, 60)}...`);
            }).catch(() => {});
          }
        }).catch(() => {});
      }
    };

    console.info('[ImageUploader] 自動上傳 hook 已安裝');
  }

  // 延遲安裝（等 sxStorage 準備好）
  if (typeof sxStorage !== 'undefined' && sxStorage) {
    setTimeout(_installAutoUploadHook, 1000);
  } else {
    // 等 localStorage-mirror markSxReady 之後
    const _checkInterval = setInterval(() => {
      if (typeof sxStorage !== 'undefined' && sxStorage) {
        clearInterval(_checkInterval);
        setTimeout(_installAutoUploadHook, 1000);
      }
    }, 500);
    // 30 秒後放棄
    setTimeout(() => clearInterval(_checkInterval), 30000);
  }

  global.ImageUploader = ImageUploader;

})(typeof window !== 'undefined' ? window : globalThis);
