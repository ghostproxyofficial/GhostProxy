import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus, FolderPlus, MoreHorizontal, Pencil, Trash2, Settings as SettingsIcon, ChevronRight,
  Sparkles, Mic, X, Search, Smile, MessagesSquare, ArrowLeft, GripVertical, Clock,
} from 'lucide-react';
import Editor from './Editor';
import Transcribe from './Transcribe';
import Summarize from './Summarize';
import SettingsPanel from './Settings';
import Onboarding from './Onboarding';
import ChatBox from './ChatBox';
import { IconPicker, iconNode, DEFAULT_ICON } from './icons';
import {
  loadMeta, saveMeta, loadContent, saveContent, removeContent,
  collectSubtree, newId, DEFAULT_SETTINGS,
} from './store';
import './notetaker.css';

const EDITED = (id) => `nt:edited:${id}`;

const readEdited = (id) => {
  try { return Number(localStorage.getItem(EDITED(id))) || 0; } catch { return 0; }
};

const loadEditedMap = () => {
  const out = {};
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (k && k.startsWith('nt:edited:')) out[k.slice(10)] = Number(localStorage.getItem(k)) || 0;
    }
  } catch { }
  return out;
};

const htmlToText = (html) => {
  if (!html) return '';
  try {
    const d = document.createElement('div');
    d.innerHTML = html;
    d.querySelectorAll('br').forEach((b) => b.replaceWith('\n'));
    d.querySelectorAll('p,div,li,h1,h2,h3,h4,blockquote,pre').forEach((el) => el.append('\n'));
    return (d.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
  } catch { return ''; }
};

const when = (ts) => {
  if (!ts) return 'never edited';
  const d = new Date(ts);
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60000) return 'edited just now';
  if (diff < 3600000) return `edited ${Math.round(diff / 60000)}m ago`;
  if (diff < 86400000) return `edited ${Math.round(diff / 3600000)}h ago`;
  if (diff < 604800000) return `edited ${Math.round(diff / 86400000)}d ago`;
  return `edited ${d.toLocaleDateString()}`;
};

const siblingsOf = (nodes, parentId) =>
  Object.values(nodes)
    .filter((n) => (n.parentId || null) === (parentId || null))
    .sort((a, b) => (a.order ?? a.createdAt) - (b.order ?? b.createdAt));

const loadInitialMeta = () => {
  const meta = loadMeta();
  let changed = false;
  Object.values(meta.nodes).forEach((node) => {
    if (node.type === 'note' && node.title === 'New note') {
      node.title = 'Untitled note';
      changed = true;
    }
    if (node.type === 'folder' && node.title === 'New folder') {
      node.title = 'Untitled folder';
      changed = true;
    }
  });
  if (changed) saveMeta(meta);
  return meta;
};

const TreeRow = ({
  node, depth, meta, activeId, edited, sortMode, dragId, overId, dropPos,
  onSelect, onToggle, onAdd, onMenu, menuFor, setMenuFor, onDragStart, onDragOver, onDrop, onDragEnd,
}) => {
  const isFolder = node.type === 'folder';
  const open = !!meta.expanded[node.id];
  const children = useMemo(() => siblingsOf(meta.nodes, node.id), [meta.nodes, node.id]);
  const editedAt = edited[node.id] || node.updatedAt || 0;

  return (
    <>
      <div
        className={
          'nt-row' +
          (activeId === node.id ? ' is-active' : '') +
          (dragId === node.id ? ' is-dragging' : '') +
          (overId === node.id && dropPos === 'inside' ? ' is-drop-inside' : '') +
          (overId === node.id && dropPos === 'before' ? ' is-drop-before' : '') +
          (overId === node.id && dropPos === 'after' ? ' is-drop-after' : '')
        }
        style={{ paddingLeft: 8 + depth * 14 }}
        title={when(editedAt)}
        draggable={sortMode === 'manual'}
        onDragStart={(e) => { e.stopPropagation(); onDragStart(node.id); }}
        onDragEnd={onDragEnd}
        onDragOver={(e) => onDragOver(e, node)}
        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); onDrop(node); }}
        onClick={() => onSelect(node)}
      >
        {isFolder ? (
          <button
            type="button"
            className={'nt-caret' + (open ? ' is-open' : '')}
            onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
            aria-label={open ? 'Collapse' : 'Expand'}
          >
            <ChevronRight size={13} />
          </button>
        ) : (
          <span className="nt-caret nt-caret-spacer" />
        )}

        <span className="nt-row-icon">{iconNode(node.icon || DEFAULT_ICON[node.type], 14)}</span>
        <span className="nt-row-title">{node.title || (isFolder ? 'Untitled folder' : 'Untitled note')}</span>

        {(sortMode === 'edited' || sortMode === 'created') && (
          <span className="nt-row-date">
            {new Date(sortMode === 'edited' ? editedAt : node.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        )}

        <span className="nt-row-actions" onClick={(e) => e.stopPropagation()}>
          {isFolder && (
            <button type="button" className="nt-row-btn" title="New note inside" onClick={() => onAdd(node.id, 'note')}>
              <Plus size={13} />
            </button>
          )}
          <button
            type="button"
            className="nt-row-btn"
            title="More"
            onClick={() => setMenuFor(menuFor === node.id ? '' : node.id)}
          >
            <MoreHorizontal size={13} />
          </button>
        </span>

        {menuFor === node.id && (
          <div className="nt-menu" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => { onMenu('newnote', node); setMenuFor(''); }}>
              <Plus size={13} /> New note{isFolder ? ' inside' : ' next to it'}
            </button>
            {isFolder && (
              <button type="button" onClick={() => { onMenu('newfolder', node); setMenuFor(''); }}>
                <FolderPlus size={13} /> New folder inside
              </button>
            )}
            <button type="button" onClick={() => { onMenu('icon', node); setMenuFor(''); }}>
              <Smile size={13} /> Change icon
            </button>
            <button type="button" onClick={() => { onMenu('rename', node); setMenuFor(''); }}>
              <Pencil size={13} /> Rename
            </button>
            <button type="button" className="is-danger" onClick={() => { onMenu('delete', node); setMenuFor(''); }}>
              <Trash2 size={13} /> Delete
            </button>
          </div>
        )}
      </div>

      {isFolder && open && children.map((child) => (
        <TreeRow
          key={child.id}
          node={child}
          depth={depth + 1}
          meta={meta}
          activeId={activeId}
          edited={edited}
          sortMode={sortMode}
          dragId={dragId}
          overId={overId}
          dropPos={dropPos}
          onSelect={onSelect}
          onToggle={onToggle}
          onAdd={onAdd}
          onMenu={onMenu}
          menuFor={menuFor}
          setMenuFor={setMenuFor}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onDragEnd={onDragEnd}
        />
      ))}
    </>
  );
};

const Notetaker = () => {
  const [meta, setMeta] = useState(loadInitialMeta);
  const [resolvedTheme, setResolvedTheme] = useState('light');
  const [activeId, setActiveId] = useState('');
  const [menuFor, setMenuFor] = useState('');
  const [iconFor, setIconFor] = useState('');
  const [renaming, setRenaming] = useState('');
  const [renameValue, setRenameValue] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [panel, setPanel] = useState('');
  const [view, setView] = useState('notes');
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState('manual');
  const [edited, setEdited] = useState(() => loadEditedMap());
  const [dragId, setDragId] = useState('');
  const [overId, setOverId] = useState('');
  const [dropPos, setDropPos] = useState('');

  const insertRef = useRef(null);
  const editedRef = useRef(edited);

  const settings = { ...DEFAULT_SETTINGS, ...(meta.settings || {}) };

  useEffect(() => {
    document.body.classList.add('nt-active');
    const prevTitle = document.title;
    document.title = 'Notetaker';
    return () => { document.body.classList.remove('nt-active'); document.title = prevTitle; };
  }, []);

  useEffect(() => {
    const apply = () => {
      const wanted = settings.theme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : settings.theme;
      setResolvedTheme(wanted);
      document.documentElement.style.setProperty('color-scheme', wanted);
    };
    apply();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [settings.theme]);

  useEffect(() => {
    const id = setInterval(() => setEdited({ ...editedRef.current }), 20000);
    return () => clearInterval(id);
  }, []);

  const commit = useCallback((next) => { setMeta(next); saveMeta(next); }, []);

  const updateSettings = useCallback((patch) => {
    commit({ ...meta, settings: { ...settings, ...patch } });
  }, [meta, settings, commit]);

  const activeNode = activeId ? meta.nodes[activeId] : null;
  const activeNote = activeNode?.type === 'note' ? activeNode : null;

  const nodePath = useCallback((id) => {
    const path = [];
    let node = meta.nodes[id];
    while (node) {
      if (node.title) path.unshift(node.title);
      node = node.parentId ? meta.nodes[node.parentId] : null;
    }
    return path.join(' / ');
  }, [meta.nodes]);

  const nextOrder = useCallback((parentId) => {
    const sibs = siblingsOf(meta.nodes, parentId);
    return sibs.length ? Math.max(...sibs.map((n) => n.order ?? n.createdAt)) + 1 : 1;
  }, [meta.nodes]);

  const createNode = useCallback((parentId, type) => {
    const id = newId();
    const node = {
      id,
      parentId: parentId || null,
      type,
      title: type === 'folder' ? 'Untitled folder' : 'Untitled note',
      icon: DEFAULT_ICON[type],
      createdAt: Date.now(),
      order: nextOrder(parentId),
    };
    const nodes = { ...meta.nodes, [id]: node };
    commit({
      ...meta,
      nodes,
      rootIds: parentId ? meta.rootIds : [...meta.rootIds, id],
      expanded: parentId ? { ...meta.expanded, [parentId]: true } : meta.expanded,
    });
    if (type === 'note') setActiveId(id);
    return id;
  }, [meta, commit, nextOrder]);

  const deleteNode = useCallback((node) => {
    const ids = collectSubtree(meta.nodes, node.id);
    const nodes = { ...meta.nodes };
    ids.forEach((id) => delete nodes[id]);
    ids.forEach((id) => {
      removeContent(id);
      try { localStorage.removeItem(EDITED(id)); } catch { }
      delete editedRef.current[id];
    });
    commit({ ...meta, nodes, rootIds: meta.rootIds.filter((r) => r !== node.id) });
    if (ids.includes(activeId)) setActiveId('');
    setEdited({ ...editedRef.current });
  }, [meta, commit, activeId]);

  const renameNode = useCallback((id, title) => {
    commit({ ...meta, nodes: { ...meta.nodes, [id]: { ...meta.nodes[id], title } } });
  }, [meta, commit]);

  const setIcon = useCallback((id, icon) => {
    commit({ ...meta, nodes: { ...meta.nodes, [id]: { ...meta.nodes[id], icon } } });
  }, [meta, commit]);

  const toggleExpand = useCallback((id) => {
    commit({ ...meta, expanded: { ...meta.expanded, [id]: !meta.expanded[id] } });
  }, [meta, commit]);

  const handleMenu = useCallback((action, node) => {
    if (action === 'newnote') createNode(node.type === 'folder' ? node.id : node.parentId, 'note');
    else if (action === 'newfolder') createNode(node.id, 'folder');
    else if (action === 'icon') setIconFor(node.id);
    else if (action === 'rename') { setRenaming(node.id); setRenameValue(node.title || ''); }
    else if (action === 'delete') deleteNode(node);
  }, [createNode, deleteNode]);

  const onSaveContent = useCallback((html) => {
    if (!activeId) return;
    saveContent(activeId, html);
    const ts = Date.now();
    try { localStorage.setItem(EDITED(activeId), String(ts)); } catch { }
    editedRef.current[activeId] = ts;
    window.dispatchEvent(new Event('nt:note-input'));
  }, [activeId]);

  const getPlainText = useCallback(
    () => insertRef.current?.getText?.() || htmlToText(loadContent(activeId)),
    [activeId],
  );

  const beginTranscript = useCallback(() => insertRef.current?.beginTranscript?.() ?? false, []);
  const setLiveTranscript = useCallback((text) => insertRef.current?.setTranscript?.(text) ?? false, []);

  const insertIntoNote = useCallback((html) => {
    if (!activeId) return;
    const ok = insertRef.current?.insertHtml?.(html);
    if (!ok) {
      saveContent(activeId, `${loadContent(activeId) || ''}${html}`);
      setActiveId('');
      setTimeout(() => setActiveId(activeId), 0);
    }
  }, [activeId]);

  const replaceTranscript = useCallback(
    (html) => (activeId ? (insertRef.current?.replaceTranscript?.(html) ?? false) : false),
    [activeId],
  );

  const replaceNote = useCallback(
    (html) => (activeId ? (insertRef.current?.replaceAll?.(html) ?? false) : false),
    [activeId],
  );

  const isDescendant = useCallback((childId, ancestorId) => {
    let cur = meta.nodes[childId];
    while (cur?.parentId) {
      if (cur.parentId === ancestorId) return true;
      cur = meta.nodes[cur.parentId];
    }
    return false;
  }, [meta.nodes]);

  const moveNode = useCallback((draggedId, target, position) => {
    if (!draggedId || draggedId === target.id) return;
    if (isDescendant(target.id, draggedId)) return;

    const nodes = { ...meta.nodes };
    const dragged = nodes[draggedId];
    if (!dragged) return;

    let parentId;
    let list;
    if (position === 'inside' && target.type === 'folder') {
      parentId = target.id;
      list = siblingsOf(nodes, parentId).filter((n) => n.id !== draggedId);
      list.push(dragged);
    } else {
      parentId = target.parentId || null;
      list = siblingsOf(nodes, parentId).filter((n) => n.id !== draggedId);
      const at = list.findIndex((n) => n.id === target.id);
      const insertAt = at === -1 ? list.length : (position === 'before' ? at : at + 1);
      list.splice(insertAt, 0, dragged);
    }

    nodes[draggedId] = { ...dragged, parentId };
    list.forEach((n, i) => { nodes[n.id] = { ...nodes[n.id], parentId, order: i + 1 }; });

    const rootIds = Object.values(nodes)
      .filter((n) => !n.parentId)
      .sort((a, b) => (a.order ?? a.createdAt) - (b.order ?? b.createdAt))
      .map((n) => n.id);

    const expanded = parentId ? { ...meta.expanded, [parentId]: true } : meta.expanded;
    commit({ ...meta, nodes, rootIds, expanded });
  }, [meta, commit, isDescendant]);

  const onDragStart = useCallback((id) => { setDragId(id); }, []);
  const onDragEnd = useCallback(() => { setDragId(''); setOverId(''); setDropPos(''); }, []);

  const onDragOver = useCallback((e, node) => {
    if (!dragId) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    let pos;
    if (node.type === 'folder') {
      pos = y < rect.height * 0.3 ? 'before' : y > rect.height * 0.7 ? 'after' : 'inside';
    } else {
      pos = y < rect.height / 2 ? 'before' : 'after';
    }
    setOverId(node.id);
    setDropPos(pos);
  }, [dragId]);

  const onDrop = useCallback((node) => {
    if (!dragId) return;
    let pos = dropPos;
    if (node.type === 'folder' && pos === '') pos = 'inside';
    if (!pos) pos = 'after';
    moveNode(dragId, node, pos);
    setDragId(''); setOverId(''); setDropPos('');
  }, [dragId, dropPos, moveNode]);

  const sortNodes = useCallback((list) => {
    const arr = [...list];
    if (sortMode === 'name') arr.sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')));
    else if (sortMode === 'created') arr.sort((a, b) => b.createdAt - a.createdAt);
    else if (sortMode === 'edited') {
      arr.sort((a, b) => (edited[b.id] || b.updatedAt || 0) - (edited[a.id] || a.updatedAt || 0));
    } else {
      arr.sort((a, b) => (a.order ?? a.createdAt) - (b.order ?? b.createdAt));
    }
    return arr;
  }, [sortMode, edited]);

  const rootNodes = useMemo(() => sortNodes(
    meta.rootIds.map((id) => meta.nodes[id]).filter(Boolean),
  ), [meta.rootIds, meta.nodes, sortNodes]);

  const allNotes = useMemo(
    () => Object.values(meta.nodes).filter((n) => n.type === 'note'),
    [meta.nodes],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return sortNodes(allNotes.filter((n) => (n.title || '').toLowerCase().includes(q)));
  }, [query, allNotes, sortNodes]);

  const getNoteForChat = useCallback(
    () => (activeNote
      ? [{ id: activeNote.id, title: activeNote.title, path: nodePath(activeNote.id), edited: edited[activeNote.id], html: loadContent(activeNote.id) }]
      : []),
    [activeNote, edited, nodePath],
  );

  const getAllNotesForChat = useCallback(
    () => allNotes.map((n) => ({ id: n.id, title: n.title, path: nodePath(n.id), edited: edited[n.id], html: loadContent(n.id) })),
    [allNotes, edited, nodePath],
  );

  const openNoteById = useCallback((id) => {
    if (!meta.nodes[id] || meta.nodes[id].type !== 'note') return;
    setView('notes');
    setPanel('');
    setActiveId(id);
  }, [meta.nodes]);

  const openNote = (node) => {
    if (node.type === 'note') { setActiveId(node.id); setView('notes'); }
    else toggleExpand(node.id);
  };

  return (
    <div className={"nt-root" + (panel && activeNote && view === 'notes' ? ' has-panel' : '')} data-theme={resolvedTheme}>
      <aside className="nt-side">
        <div className="nt-side-head">
          <div className="nt-brand">Notetaker</div>
          <div className="nt-side-head-actions">
            <button
              type="button"
              className={'nt-tool' + (view === 'chat' ? ' is-active' : '')}
              title="Ask all notes"
              onClick={() => { setView(view === 'chat' ? 'notes' : 'chat'); setPanel(''); }}
            >
              <MessagesSquare size={15} />
            </button>
            <button type="button" className="nt-tool" title="Settings" onClick={() => setSettingsOpen(true)}>
              <SettingsIcon size={15} />
            </button>
          </div>
        </div>

        <div className="nt-side-actions">
          <button type="button" className="nt-btn nt-btn-sm" onClick={() => createNode(null, 'note')}>
            <Plus size={14} /> Note
          </button>
          <button type="button" className="nt-btn nt-btn-sm" onClick={() => createNode(null, 'folder')}>
            <FolderPlus size={14} /> Folder
          </button>
        </div>

        <div className="nt-search">
          <Search size={13} className="nt-muted" />
          <input
            className="nt-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a note"
          />
        </div>

        <div className="nt-sort">
          <Clock size={12} className="nt-muted" />
          <select className="nt-sort-select" value={sortMode} onChange={(e) => setSortMode(e.target.value)}>
            <option value="manual">Manual order</option>
            <option value="edited">Last edited</option>
            <option value="created">Date created</option>
            <option value="name">Name</option>
          </select>
        </div>

        <div className="nt-tree" onClick={() => setMenuFor('')}>
          {filtered ? (
            filtered.length ? filtered.map((n) => (
              <div
                key={n.id}
                className={'nt-row' + (activeId === n.id ? ' is-active' : '')}
                style={{ paddingLeft: 10 }}
                title={when(edited[n.id] || n.updatedAt)}
                onClick={() => { setActiveId(n.id); setView('notes'); }}
              >
                <span className="nt-row-icon">{iconNode(n.icon, 14)}</span>
                <span className="nt-row-title">{n.title}</span>
              </div>
            )) : <p className="nt-muted nt-small nt-pad">Nothing matched.</p>
          ) : (
            rootNodes.map((n) => (
              <TreeRow
                key={n.id}
                node={n}
                depth={0}
                meta={meta}
                activeId={activeId}
                edited={edited}
                sortMode={sortMode}
                dragId={dragId}
                overId={overId}
                dropPos={dropPos}
                onSelect={openNote}
                onToggle={toggleExpand}
                onAdd={createNode}
                onMenu={handleMenu}
                menuFor={menuFor}
                setMenuFor={setMenuFor}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onDragEnd={onDragEnd}
              />
            ))
          )}
          {!filtered && !rootNodes.length && (
            <div className="nt-empty-tree">
              <p className="nt-muted nt-small">No notes yet. Make a folder for a class, then add notes inside it.</p>
            </div>
          )}
        </div>

        <div className="nt-side-foot">
          <GripVertical size={12} className="nt-muted" />
          <span className="nt-muted nt-small">Drag rows to move or reorder</span>
        </div>
      </aside>

      <main className="nt-main">
        {view === 'chat' ? (
          <>
            <div className="nt-main-head">
              <button type="button" className="nt-icon-btn" title="Back to notes" onClick={() => setView('notes')}>
                <ArrowLeft size={16} />
              </button>
              <span className="nt-title-static">Ask your notes</span>
            </div>
            <ChatBox
              settings={settings}
              getNotes={getAllNotesForChat}
              scopeLabel="All notes"
              persist
              onOpenNote={openNoteById}
              emptyHint="Ask anything across your notes. It searches your notes, answers with sources you can click, and remembers this chat."
            />
          </>
        ) : activeNote ? (
          <>
            <div className="nt-main-head">
              <button type="button" className="nt-icon-btn" title="Change icon" onClick={() => setIconFor(activeNote.id)}>
                {iconNode(activeNote.icon, 16)}
              </button>
              <input
                className="nt-title-input"
                value={activeNote.title}
                onChange={(e) => renameNode(activeNote.id, e.target.value)}
                placeholder="Untitled note"
              />
              <div className="nt-head-actions">
                <button
                  type="button"
                  className={'nt-btn nt-btn-sm' + (panel === 'transcribe' ? ' is-active' : '')}
                  onClick={() => setPanel(panel === 'transcribe' ? '' : 'transcribe')}
                >
                  <Mic size={14} /> Transcribe
                </button>
                <button
                  type="button"
                  className={'nt-btn nt-btn-sm' + (panel === 'summarize' ? ' is-active' : '')}
                  onClick={() => setPanel(panel === 'summarize' ? '' : 'summarize')}
                >
                  <Sparkles size={14} /> Summarize
                </button>
                <button
                  type="button"
                  className={'nt-btn nt-btn-sm' + (panel === 'ask' ? ' is-active' : '')}
                  onClick={() => setPanel(panel === 'ask' ? '' : 'ask')}
                >
                  <MessagesSquare size={14} /> Ask AI
                </button>
              </div>
            </div>
            <Editor
              key={activeNote.id}
              noteId={activeNote.id}
              initialHtml={loadContent(activeNote.id)}
              onSave={onSaveContent}
              onInsertHtml={insertRef}
            />
          </>
        ) : (
          <div className="nt-blank">
            <div className="nt-blank-inner">
              <h2>Pick a note, or make one</h2>
              <p className="nt-muted">
                Folders can hold folders, and notes can live anywhere. Everything saves to this browser as you type.
              </p>
              <div className="nt-action-row nt-action-row-center">
                <button type="button" className="nt-btn nt-btn-primary" onClick={() => createNode(null, 'note')}>
                  <Plus size={14} /> New note
                </button>
                <button type="button" className="nt-btn" onClick={() => createNode(null, 'folder')}>
                  <FolderPlus size={14} /> New folder
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {panel && activeNote && view === 'notes' && (
        <aside className="nt-right">
          <div className="nt-right-head">
            <span className="nt-right-title">
              {panel === 'transcribe' ? 'Transcribe' : panel === 'summarize' ? 'Summarize' : 'Ask this note'}
            </span>
            <button type="button" className="nt-tool" onClick={() => setPanel('')} title="Close">
              <X size={15} />
            </button>
          </div>
          {panel === 'transcribe' && (
            <Transcribe
              settings={settings}
              beginTranscript={beginTranscript}
              setLiveTranscript={setLiveTranscript}
              onSwitchToSummarize={() => setPanel('summarize')}
            />
          )}
          {panel === 'summarize' && (
            <Summarize
              settings={settings}
              getPlainText={getPlainText}
              onInsert={insertIntoNote}
              onReplaceNote={replaceNote}
            />
          )}
          {panel === 'ask' && (
            <div className="nt-panel nt-panel-flush">
              <ChatBox
                settings={settings}
                getNotes={getNoteForChat}
                scopeLabel="This note"
                emptyHint="Ask about this note, like explain the third bullet, or make me a quiz from it."
              />
            </div>
          )}
        </aside>
      )}

      {settingsOpen && (
        <div className="nt-modal" onClick={() => setSettingsOpen(false)}>
          <div className="nt-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="nt-modal-head">
              <h2>Settings</h2>
              <button type="button" className="nt-tool" onClick={() => setSettingsOpen(false)} title="Close">
                <X size={16} />
              </button>
            </div>
            <div className="nt-modal-body">
              <SettingsPanel
                meta={meta}
                settings={settings}
                onChange={updateSettings}
                onWiped={() => {
                  commit({ v: 1, rootIds: [], nodes: {}, expanded: {}, settings });
                  setActiveId('');
                  setSettingsOpen(false);
                }}
                onImported={(next) => { setMeta(next); setActiveId(''); setSettingsOpen(false); }}
              />
            </div>
          </div>
        </div>
      )}

      {iconFor && (
        <div className="nt-modal" onClick={() => setIconFor('')}>
          <div className="nt-modal-card nt-modal-narrow" onClick={(e) => e.stopPropagation()}>
            <div className="nt-modal-head">
              <h2>Pick an icon</h2>
              <button type="button" className="nt-tool" onClick={() => setIconFor('')} title="Close">
                <X size={16} />
              </button>
            </div>
            <div className="nt-modal-body">
              <IconPicker
                value={meta.nodes[iconFor]?.icon}
                onPick={(name) => setIcon(iconFor, name)}
                onClose={() => setIconFor('')}
              />
            </div>
          </div>
        </div>
      )}

      {renaming && (
        <div className="nt-modal" onClick={() => setRenaming('')}>
          <div className="nt-modal-card nt-modal-narrow" onClick={(e) => e.stopPropagation()}>
            <div className="nt-modal-head">
              <h2>Rename</h2>
              <button type="button" className="nt-tool" onClick={() => setRenaming('')} title="Close">
                <X size={16} />
              </button>
            </div>
            <div className="nt-modal-body">
              <input
                autoFocus
                className="nt-input"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { renameNode(renaming, renameValue.trim() || 'Untitled'); setRenaming(''); }
                  if (e.key === 'Escape') setRenaming('');
                }}
              />
              <div className="nt-action-row nt-action-row-end">
                <button type="button" className="nt-btn" onClick={() => setRenaming('')}>Cancel</button>
                <button
                  type="button"
                  className="nt-btn nt-btn-primary"
                  onClick={() => { renameNode(renaming, renameValue.trim() || 'Untitled'); setRenaming(''); }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!settings.onboarded && (
        <Onboarding
          settings={settings}
          onChange={updateSettings}
          onFinish={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
};

export default Notetaker;
