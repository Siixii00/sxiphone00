const STORAGE_KEY = 'sx_widget_state';

export const AppState = {
  mode: 'home',
  wallpaper: {
    type: 'gradient',
    value: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
  },
  widgets: [],
  apps: [],
  dock: ['safari', 'messages', 'phone', 'camera'],
  editorState: {
    selectedWidgetId: null,
    isDirty: false
  },
  editMode: {
    isActive: false,
    longPressTimer: null
  }
};

const listeners = new Map();

export function on(event, callback) {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  listeners.get(event).add(callback);
}

export function off(event, callback) {
  const callbacks = listeners.get(event);
  if (callbacks) {
    callbacks.delete(callback);
  }
}

export function emit(event, data) {
  const callbacks = listeners.get(event);
  if (callbacks) {
    callbacks.forEach(cb => {
      try {
        cb(data);
      } catch (e) {
        console.error('Event listener error:', e);
      }
    });
  }
}

export function setState(path, value) {
  const keys = path.split('.');
  let obj = AppState;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in obj)) {
      obj[keys[i]] = {};
    }
    obj = obj[keys[i]];
  }
  obj[keys[keys.length - 1]] = value;
  emit('stateChange', { path, value });
}

export function getState(path) {
  const keys = path.split('.');
  let obj = AppState;
  for (const key of keys) {
    if (!(key in obj)) return undefined;
    obj = obj[key];
  }
  return obj;
}

export function resetState() {
  AppState.mode = 'home';
  AppState.widgets = [];
  AppState.apps = [];
  AppState.editorState.selectedWidgetId = null;
  AppState.editorState.isDirty = false;
  AppState.editMode.isActive = false;
  emit('stateReset');
}
