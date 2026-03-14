export const SHORTCUT_DEFINITIONS = [
  { id: 'newTab', section: 'Tab Actions', label: 'Open new tab', defaultKey: 'Alt+T' },
  { id: 'closeTab', section: 'Tab Actions', label: 'Close current tab', defaultKey: 'Alt+W' },
  { id: 'reopenClosedTab', section: 'Tab Actions', label: 'Reopen closed tab', defaultKey: 'Alt+Shift+T' },
  { id: 'duplicateTab', section: 'Tab Actions', label: 'Duplicate current tab', defaultKey: 'Alt+D' },
  { id: 'nextTab', section: 'Tab Actions', label: 'Switch to next tab', defaultKey: 'Alt+`' },
  { id: 'previousTab', section: 'Tab Actions', label: 'Switch to previous tab', defaultKey: 'Ctrl+Shift+~' },
  { id: 'pinTab', section: 'Tab Actions', label: 'Pin/unpin current tab', defaultKey: 'Alt+Shift+P' },

  { id: 'goBack', section: 'Navigation', label: 'Go back in history', defaultKey: 'Alt+Shift+ArrowLeft' },
  { id: 'goForward', section: 'Navigation', label: 'Go forward in history', defaultKey: 'Alt+Shift+ArrowRight' },
  { id: 'reload', section: 'Navigation', label: 'Reload page', defaultKey: 'Alt+R' },
  { id: 'reloadF5', section: 'Navigation', label: 'Reload page (F5)', defaultKey: 'F5' },
  { id: 'hardReload', section: 'Navigation', label: 'Hard reload (bypass cache)', defaultKey: 'Alt+Shift+R' },
  { id: 'focusAddressBar', section: 'Navigation', label: 'Focus address bar', defaultKey: 'Alt+L' },
  { id: 'goHome', section: 'Navigation', label: 'Go to home page', defaultKey: 'Alt+Shift+H' },

  { id: 'toggleDevToolsF12', section: 'Developer Tools', label: 'Toggle DevTools', defaultKey: 'F12' },
  { id: 'toggleDevToolsAlt', section: 'Developer Tools', label: 'Toggle DevTools (Alt+Shift+I)', defaultKey: 'Alt+Shift+I' },

  { id: 'zoomIn', section: 'View & Zoom', label: 'Zoom in', defaultKey: 'Ctrl+=' },
  { id: 'zoomOut', section: 'View & Zoom', label: 'Zoom out', defaultKey: 'Ctrl+-' },
  { id: 'zoomReset', section: 'View & Zoom', label: 'Reset zoom', defaultKey: 'Alt+Shift+0' },
  { id: 'toggleFullscreen', section: 'View & Zoom', label: 'Toggle fullscreen', defaultKey: 'F11' },

  { id: 'openSettings', section: 'Window Management', label: 'Open settings', defaultKey: 'Alt+,' },
  { id: 'openHistory', section: 'Window Management', label: 'Open history', defaultKey: 'Alt+Shift+Y' },
  { id: 'openBookmarks', section: 'Window Management', label: 'Open bookmarks', defaultKey: 'Alt+Shift+B' },
  { id: 'bookmarkCurrentPage', section: 'Window Management', label: 'Bookmark current page', defaultKey: 'Alt+Shift+K' },

  { id: 'tab1', section: 'Tab Actions', label: 'Switch to tab 1', defaultKey: 'Alt+1' },
  { id: 'tab2', section: 'Tab Actions', label: 'Switch to tab 2', defaultKey: 'Alt+2' },
  { id: 'tab3', section: 'Tab Actions', label: 'Switch to tab 3', defaultKey: 'Alt+3' },
  { id: 'tab4', section: 'Tab Actions', label: 'Switch to tab 4', defaultKey: 'Alt+4' },
  { id: 'tab5', section: 'Tab Actions', label: 'Switch to tab 5', defaultKey: 'Alt+5' },
  { id: 'tab6', section: 'Tab Actions', label: 'Switch to tab 6', defaultKey: 'Alt+6' },
  { id: 'tab7', section: 'Tab Actions', label: 'Switch to tab 7', defaultKey: 'Alt+7' },
  { id: 'tab8', section: 'Tab Actions', label: 'Switch to tab 8', defaultKey: 'Alt+8' },
  { id: 'tab9', section: 'Tab Actions', label: 'Switch to tab 9', defaultKey: 'Alt+9' },
  { id: 'tab10', section: 'Tab Actions', label: 'Switch to tab 10', defaultKey: 'Alt+0' },
];

const KEY_ALIASES = {
  ' ': 'Space',
  Spacebar: 'Space',
  Esc: 'Escape',
  Left: 'ArrowLeft',
  Right: 'ArrowRight',
  Up: 'ArrowUp',
  Down: 'ArrowDown',
  '!': '1',
  '@': '2',
  '#': '3',
  '$': '4',
  '%': '5',
  '^': '6',
  '&': '7',
  '*': '8',
  '(': '9',
  ')': '0',
  '+': '=',
  _: '-',
  '<': ',',
  '>': '.',
  Add: '=',
  Subtract: '-',
  Decimal: '.',
  ',': ',',
};

function normalizeKey(key) {
  const alias = KEY_ALIASES[key] || key;
  if (alias.length === 1) {
    return alias.toUpperCase();
  }
  return alias;
}

export function normalizeShortcutString(input) {
  if (!input || typeof input !== 'string') return '';
  const parts = input
    .split('+')
    .map((p) => p.trim())
    .filter(Boolean);

  const lowered = parts.map((p) => p.toLowerCase());
  const hasCtrl = lowered.includes('ctrl') || lowered.includes('control');
  const hasAlt = lowered.includes('alt');
  const hasShift = lowered.includes('shift');
  const hasMeta = lowered.includes('meta') || lowered.includes('cmd') || lowered.includes('command');

  const keyPartRaw = parts.find(
    (p) => !['ctrl', 'control', 'alt', 'shift', 'meta', 'cmd', 'command'].includes(p.toLowerCase()),
  );

  if (!keyPartRaw) return '';
  const key = normalizeKey(keyPartRaw);

  const out = [];
  if (hasCtrl) out.push('Ctrl');
  if (hasAlt) out.push('Alt');
  if (hasShift) out.push('Shift');
  if (hasMeta) out.push('Meta');
  out.push(key);
  return out.join('+');
}

export function eventToShortcut(e) {
  const key = normalizeKey(e.key);
  const out = [];
  if (e.ctrlKey) out.push('Ctrl');
  if (e.altKey) out.push('Alt');
  if (e.shiftKey) out.push('Shift');
  if (e.metaKey) out.push('Meta');
  out.push(key);
  return out.join('+');
}

export function buildDefaultShortcutsMap() {
  return SHORTCUT_DEFINITIONS.reduce((acc, item) => {
    acc[item.id] = {
      key: normalizeShortcutString(item.defaultKey),
      enabled: true,
    };
    return acc;
  }, {});
}

export function getEffectiveShortcuts(options) {
  const defaults = buildDefaultShortcutsMap();
  const fromOptions = options?.shortcuts || {};

  const merged = { ...defaults };
  Object.keys(fromOptions).forEach((id) => {
    if (!merged[id]) return;
    merged[id] = {
      key: normalizeShortcutString(fromOptions[id]?.key || merged[id].key),
      enabled: fromOptions[id]?.enabled !== false,
    };
  });

  return merged;
}

export function isTypingTarget(target) {
  if (!target) return false;
  const tag = target.tagName?.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if (target.isContentEditable) return true;
  return false;
}

export function groupShortcutDefinitions() {
  return SHORTCUT_DEFINITIONS.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});
}
