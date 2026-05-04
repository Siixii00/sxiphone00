const LONG_PRESS_DURATION = 500;

let longPressTimer = null;
let isEditModeActive = false;
let touchStartX = 0;
let touchStartY = 0;

function handleTouchStart(e) {
  touchStartX = e.touches ? e.touches[0].clientX : e.clientX;
  touchStartY = e.touches ? e.touches[0].clientY : e.clientY;
  
  longPressTimer = setTimeout(() => {
    enterEditMode();
  }, LONG_PRESS_DURATION);
}

function handleTouchMove(e) {
  if (!longPressTimer) return;
  
  const currentX = e.touches ? e.touches[0].clientX : e.clientX;
  const currentY = e.touches ? e.touches[0].clientY : e.clientY;
  
  const deltaX = Math.abs(currentX - touchStartX);
  const deltaY = Math.abs(currentY - touchStartY);
  
  if (deltaX > 10 || deltaY > 10) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
}

function handleTouchEnd(e) {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
}

export function enterEditMode() {
  if (isEditModeActive) return;
  
  isEditModeActive = true;
  document.body.classList.add('edit-mode');
  
  showEditToolbar();
  startWobbleAnimation();
  
  if (typeof window.widgetState !== 'undefined') {
    window.widgetState.isEditing = true;
  }
  
  const event = new CustomEvent('editModeEnter');
  document.dispatchEvent(event);
}

export function exitEditMode() {
  if (!isEditModeActive) return;
  
  isEditModeActive = false;
  document.body.classList.remove('edit-mode');
  
  hideEditToolbar();
  stopWobbleAnimation();
  
  if (typeof window.widgetState !== 'undefined') {
    window.widgetState.isEditing = false;
  }
  
  const event = new CustomEvent('editModeExit');
  document.dispatchEvent(event);
}

export function toggleEditMode() {
  if (isEditModeActive) {
    exitEditMode();
  } else {
    enterEditMode();
  }
}

function showEditToolbar() {
  const toolbar = document.getElementById('editToolbar');
  if (toolbar) {
    toolbar.classList.add('visible');
  }
}

function hideEditToolbar() {
  const toolbar = document.getElementById('editToolbar');
  if (toolbar) {
    toolbar.classList.remove('visible');
  }
}

function startWobbleAnimation() {
  const widgets = document.querySelectorAll('.widget-card');
  const appIcons = document.querySelectorAll('.desktop-app-icon');
  
  widgets.forEach((w, i) => {
    w.classList.add('editing');
    w.style.animationDelay = (i % 2 === 0) ? '0s' : '0.1s';
  });
  
  appIcons.forEach((icon, i) => {
    icon.classList.add('editing');
    icon.style.animationDelay = (i % 2 === 0) ? '0.05s' : '0.15s';
  });
}

function stopWobbleAnimation() {
  const widgets = document.querySelectorAll('.widget-card');
  const appIcons = document.querySelectorAll('.desktop-app-icon');
  
  widgets.forEach(w => {
    w.classList.remove('editing');
    w.style.animationDelay = '';
  });
  
  appIcons.forEach(icon => {
    icon.classList.remove('editing');
    icon.style.animationDelay = '';
  });
}

export function attachLongPressListener(element) {
  element.addEventListener('touchstart', handleTouchStart, { passive: true });
  element.addEventListener('touchmove', handleTouchMove, { passive: true });
  element.addEventListener('touchend', handleTouchEnd, { passive: true });
  element.addEventListener('touchcancel', handleTouchEnd, { passive: true });
  
  element.addEventListener('mousedown', handleTouchStart);
  element.addEventListener('mousemove', handleTouchMove);
  element.addEventListener('mouseup', handleTouchEnd);
  element.addEventListener('mouseleave', handleTouchEnd);
}

export function detachLongPressListener(element) {
  element.removeEventListener('touchstart', handleTouchStart);
  element.removeEventListener('touchmove', handleTouchMove);
  element.removeEventListener('touchend', handleTouchEnd);
  element.removeEventListener('touchcancel', handleTouchEnd);
  
  element.removeEventListener('mousedown', handleTouchStart);
  element.removeEventListener('mousemove', handleTouchMove);
  element.removeEventListener('mouseup', handleTouchEnd);
  element.removeEventListener('mouseleave', handleTouchEnd);
}

export function isEditing() {
  return isEditModeActive;
}

export function initEditMode() {
  const homeScreen = document.getElementById('home-screen') || document.getElementById('previewPhone');
  if (homeScreen) {
    attachLongPressListener(homeScreen);
  }
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isEditModeActive) {
      exitEditMode();
    }
  });
}