const META_KEY = 'nt:meta';
const NOTE_PREFIX = 'nt:note:';

export const DEFAULT_SETTINGS = {
  theme: 'system',
  fontScale: 100,

  transcribeEngine: 'webspeech',
  whisperModel: 'auto',
  whisperLanguage: 'en',
  transcribeProvider: '',
  transcribeModel: '',

  summaryEngine: 'cloud',
  localSummaryModel: 'auto',
  summaryProvider: 'openai',
  summaryModel: 'auto',
  summaryInstructions: '',

  providers: {},
};

export const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

const emptyMeta = () => ({
  v: 1,
  rootIds: [],
  nodes: {},
  expanded: {},
  settings: { ...DEFAULT_SETTINGS },
});

export const loadMeta = () => {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return emptyMeta();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return emptyMeta();
    return {
      v: 1,
      rootIds: Array.isArray(parsed.rootIds) ? parsed.rootIds : [],
      nodes: parsed.nodes && typeof parsed.nodes === 'object' ? parsed.nodes : {},
      expanded: parsed.expanded && typeof parsed.expanded === 'object' ? parsed.expanded : {},
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
    };
  } catch {
    return emptyMeta();
  }
};

export const saveMeta = (meta) => {
  try {

    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch (e) {
    console.warn('[notetaker] could not save tree', e);
  }
};

export const loadContent = (id) => {
  try {
    return localStorage.getItem(NOTE_PREFIX + id) || '';
  } catch {
    return '';
  }
};

export const saveContent = (id, html) => {
  try {
    localStorage.setItem(NOTE_PREFIX + id, html || '');
  } catch (e) {
    console.warn('[notetaker] could not save note', e);
  }
};

export const removeContent = (id) => {
  try {
    localStorage.removeItem(NOTE_PREFIX + id);
  } catch { }
};

export const collectSubtree = (nodes, id) => {
  const out = [id];
  const walk = (pid) => {
    Object.values(nodes).forEach((n) => {
      if (n.parentId === pid) {
        out.push(n.id);
        walk(n.id);
      }
    });
  };
  walk(id);
  return out;
};

export const countNotes = (nodes) =>
  Object.values(nodes).filter((n) => n.type === 'note').length;

export const wipeEverything = () => {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (k && (k === META_KEY || k.startsWith(NOTE_PREFIX))) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch { }
};

export const exportAll = () => {
  const meta = loadMeta();
  const notes = {};
  Object.values(meta.nodes).forEach((n) => {
    if (n.type === 'note') notes[n.id] = loadContent(n.id);
  });
  return JSON.stringify({ ...meta, contents: notes }, null, 2);
};

export const importAll = (json) => {
  const parsed = JSON.parse(json);
  if (!parsed || typeof parsed !== 'object' || !parsed.nodes) {
    throw new Error('That does not look like a notetaker backup.');
  }
  const meta = {
    v: 1,
    rootIds: Array.isArray(parsed.rootIds) ? parsed.rootIds : [],
    nodes: parsed.nodes || {},
    expanded: parsed.expanded || {},
    settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
  };
  saveMeta(meta);
  Object.entries(parsed.contents || {}).forEach(([id, html]) => saveContent(id, html));
  return meta;
};
