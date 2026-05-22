const STORAGE_KEY = 'sx_widget_state';

export function saveState(state) {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch (e) {
    console.error('Failed to save state:', e);
    return false;
  }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
    return null;
  } catch (e) {
    console.error('Failed to load state:', e);
    return null;
  }
}

export function clearState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (e) {
    console.error('Failed to clear state:', e);
    return false;
  }
}

export function saveWidgetLayout(widgets) {
  try {
    localStorage.setItem('sx_widget_layout', JSON.stringify(widgets));
    return true;
  } catch (e) {
    console.error('Failed to save widget layout:', e);
    return false;
  }
}

export function loadWidgetLayout() {
  try {
    const raw = localStorage.getItem('sx_widget_layout');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load widget layout:', e);
    return [];
  }
}

export function saveAppLayout(apps) {
  try {
    localStorage.setItem('sx_app_layout', JSON.stringify(apps));
    return true;
  } catch (e) {
    console.error('Failed to save app layout:', e);
    return false;
  }
}

export function loadAppLayout() {
  try {
    const raw = localStorage.getItem('sx_app_layout');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load app layout:', e);
    return [];
  }
}

export function saveHiddenApps(hiddenApps) {
  try {
    localStorage.setItem('sx_hidden_apps', JSON.stringify(hiddenApps));
    return true;
  } catch (e) {
    console.error('Failed to save hidden apps:', e);
    return false;
  }
}

export function loadHiddenApps() {
  try {
    const raw = localStorage.getItem('sx_hidden_apps');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load hidden apps:', e);
    return [];
  }
}
