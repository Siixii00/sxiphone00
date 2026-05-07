document.addEventListener('DOMContentLoaded', () => {
    const backBtn = document.getElementById('backBtn');
    const ballToggle = document.getElementById('ballToggle');
    const moreToggle = document.getElementById('moreToggle');
    const moreMenu = document.getElementById('moreMenu');
    const mainPage = document.getElementById('main-page');
    const subPage = document.getElementById('sub-page');
    const navTitle = document.getElementById('navTitle');
    const floatingBall = document.getElementById('floatingBall');
    const styleSelectToggle = document.getElementById('styleSelectToggle');
    const styleSelectMenu = document.getElementById('styleSelectMenu');
    const sizeRange = document.getElementById('sizeRange');
    const opacityRange = document.getElementById('opacityRange');
    const hueRange = document.getElementById('hueRange');

    const readLocalValue = (key) => {
        const val = localStorage.getItem(key);
        return val === null ? '' : val;
    };

    const readStorageValue = async (key) => {
        if (window.localforage) {
            const value = await window.localforage.getItem(key);
            if (value !== null && value !== undefined) return String(value);
        }
        return readLocalValue(key);
    };

    const syncEnvFromStorage = async () => {
        const novaUrl = await readStorageValue('sx_nova_api_url');
        const novaKey = await readStorageValue('sx_nova_api_key');
        const mode = await readStorageValue('sx_theme_mode');
        const accent = await readStorageValue('sx_theme_accent');
        const textColor = await readStorageValue('sx_theme_text_color');
        const appBg = await readStorageValue('sx_theme_app_bg_color');

        window.parent?.postMessage({
            type: 'TOUCH_ENV_SYNC',
            payload: {
                sx_nova_api_url: novaUrl,
                sx_nova_api_key: novaKey,
                sx_theme_mode: mode,
                sx_theme_accent: accent,
                sx_theme_text_color: textColor,
                sx_theme_app_bg_color: appBg
            }
        }, '*');
    };

    if (ballToggle) {
        ballToggle.checked = localStorage.getItem('sx_ball_enabled') === '1';
    }
    if (floatingBall) {
        floatingBall.style.display = ballToggle?.checked ? 'flex' : 'none';
    }

    const contentToggle = document.querySelector('.setting-item.arrow:not(#moreToggle)');
    if (contentToggle) {
        contentToggle.addEventListener('click', () => {
            mainPage.style.display = 'none';
            subPage.style.display = 'block';
            navTitle.innerText = '懸浮球內容';
            subPage.scrollTop = 0;
        });
    }

    if (moreToggle && moreMenu) {
        moreToggle.addEventListener('click', () => {
            const isOpen = moreMenu.classList.toggle('active');
            moreToggle.classList.toggle('open');
            console.log('更多功能:', isOpen ? '展開' : '收合');
        });
    }

    if (styleSelectToggle && styleSelectMenu) {
        styleSelectToggle.addEventListener('click', () => {
            const isOpen = styleSelectMenu.classList.toggle('active');
            styleSelectToggle.classList.toggle('open');
            console.log('樣式選單:', isOpen ? '展開' : '收合');
        });
    }

    if (backBtn) {
        backBtn.onclick = () => {
            if (subPage.style.display === 'block') {
                subPage.style.display = 'none';
                mainPage.style.display = 'block';
                navTitle.innerText = '輔助觸控';
            } else {
                handleBack();
            }
        };
    }

    if (ballToggle) {
        ballToggle.addEventListener('change', (e) => {
            const isEnabled = e.target.checked;
            if (floatingBall) {
                floatingBall.style.display = isEnabled ? 'flex' : 'none';
            }

            localStorage.setItem('sx_ball_enabled', isEnabled ? '1' : '0');

            window.parent.postMessage({
                type: 'TOGGLE_BALL',
                enabled: isEnabled
            }, '*');
        });
    }

    const moreItems = document.querySelectorAll('#moreMenu .setting-item.sub');
    moreItems.forEach(item => {
        item.addEventListener('click', () => {
            syncEnvFromStorage();
        });
    });

    const functionItems = document.querySelectorAll('[data-func]');
    functionItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();

            const funcName = item.getAttribute('data-func');
            const label = item.querySelector('.item-label').innerText;

            console.log('功能執行:', label, `(${funcName})`);

            window.parent.postMessage({
                type: 'EXECUTE_FUNCTION',
                function: funcName
            }, '*');
        });
    });

    const funcToggles = document.querySelectorAll('.ball-func-toggle');
    funcToggles.forEach(toggle => {
        toggle.addEventListener('change', (e) => {
            const funcName = e.target.getAttribute('data-func');
            const enabled = e.target.checked;

            window.parent.postMessage({
                type: 'TOGGLE_BALL_FUNCTION',
                function: funcName,
                enabled
            }, '*');
        });
    });

    const arrows = document.querySelectorAll('.setting-item.arrow:not(#moreToggle)');
    arrows.forEach(item => {
        item.addEventListener('click', () => {
            const label = item.querySelector('.item-label').innerText;
            console.log('進入項目:', label);
        });
    });

    const enableScroll = (container) => {
        if (!container) return;

        container.addEventListener('wheel', (event) => {
            event.preventDefault();
            container.scrollTop += event.deltaY;
        }, { passive: false });

        let touchStartY = 0;
        let touchStartScroll = 0;

        container.addEventListener('touchstart', (event) => {
            if (event.touches.length !== 1) return;
            touchStartY = event.touches[0].clientY;
            touchStartScroll = container.scrollTop;
        }, { passive: true });

        container.addEventListener('touchmove', (event) => {
            if (event.touches.length !== 1) return;
            const currentY = event.touches[0].clientY;
            const delta = touchStartY - currentY;
            container.scrollTop = touchStartScroll + delta;
        }, { passive: true });
    };

    enableScroll(mainPage);
    enableScroll(subPage);

    const loadBallStateFromStorage = () => {
        try {
            const raw = localStorage.getItem('sx_ball_style');
            if (raw) {
                const saved = JSON.parse(raw);
                if (saved) {
                    ballState.style = saved.style || 'smoke';
                    ballState.hue = Number(saved.hue) || 0;
                    ballState.size = Number(saved.size) || 60;
                    ballState.opacity = Number(saved.opacity) || 0.4;
                }
            }
        } catch (e) {
            console.warn('讀取懸浮球樣式失敗', e);
        }
    };

    const ballState = {
        style: 'smoke',
        hue: 0,
        size: 60,
        opacity: 0.4
    };

    loadBallStateFromStorage();

    const applyBallStyle = () => {
        if (floatingBall) {
            floatingBall.style.width = `${ballState.size}px`;
            floatingBall.style.height = `${ballState.size}px`;

            if (ballState.style === 'frost') {
                floatingBall.style.backgroundColor = `rgba(255, 255, 255, ${ballState.opacity})`;
                floatingBall.style.backdropFilter = 'blur(10px)';
            } else if (ballState.style === 'solid') {
                floatingBall.style.backgroundColor = `hsla(${ballState.hue}, 80%, 50%, ${ballState.opacity})`;
                floatingBall.style.backdropFilter = 'none';
            } else {
                floatingBall.style.backgroundColor = `rgba(0, 0, 0, ${ballState.opacity})`;
                floatingBall.style.backdropFilter = 'blur(10px)';
            }
        }

        localStorage.setItem('sx_ball_style', JSON.stringify(ballState));

        window.parent.postMessage({
            type: 'UPDATE_BALL_STYLE',
            payload: { ...ballState }
        }, '*');
    };

    const syncSize = (value) => {
        ballState.size = Number(value);
        if (sizeRange && sizeRange.value !== value) sizeRange.value = value;
        applyBallStyle();
    };

    const syncHue = (value) => {
        ballState.hue = Number(value);
        if (ballState.style !== 'solid') {
            ballState.style = 'solid';
            const solidRadio = document.querySelector('input[name="ballStyle"][value="solid"]');
            if (solidRadio) {
                solidRadio.checked = true;
            }
        }
        if (hueRange && hueRange.value !== value) hueRange.value = value;
        applyBallStyle();
    };

    if (sizeRange) {
        sizeRange.oninput = (e) => syncSize(e.target.value);
    }

    if (opacityRange) {
        opacityRange.oninput = (e) => {
            ballState.opacity = Number(e.target.value) / 100;
            applyBallStyle();
        };
    }

    if (hueRange) {
        hueRange.oninput = (e) => syncHue(e.target.value);
    }

    const styleRadios = document.querySelectorAll('input[name="ballStyle"]');
    styleRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (!e.target.checked) return;
            ballState.style = e.target.value;
            applyBallStyle();
        });
    });

    applyBallStyle();
    syncEnvFromStorage();

    function handleBack() {
        console.log('返回主頁');

        const isIframe = window.parent && window.parent !== window;
        if (isIframe) {
            try {
                window.parent.postMessage({
                    type: 'closeApp',
                    appId: 'touch'
                }, '*');
                return;
            } catch (e) {
                console.warn('postMessage 失敗', e);
            }
        }

        if (window.history.length > 1) {
            window.history.back();
            return;
        }

        window.location.replace('../index.html');
    }
});
