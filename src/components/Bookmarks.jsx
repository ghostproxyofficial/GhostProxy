import clsx from 'clsx';
import {
  X, Plus, Globe, Trash2, Pencil, Check, Image, PenLine,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useOptions } from '../utils/optionsContext';
import loaderStore from '../utils/hooks/loader/useLoaderStore';
import { process } from '../utils/hooks/loader/utils';
import { createId } from '../utils/id';

const Bookmarks = ({ isOpen, onClose, inLoader = false }) => {
  const { options: o, updateOption } = useOptions();
  const { tabs, addTab, setActive, updateUrl } = loaderStore();

  const [bms, setBms] = useState([]);
  const [url, setUrl] = useState('');
  const [nm, setNm] = useState('');
  const [ico, setIco] = useState('');
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [anim, setAnim] = useState(false);
  const [render, setRender] = useState(false);
  const [badIcons, setBadIcons] = useState(new Set());
  const [loadedIcons, setLoadedIcons] = useState(new Set());

  useEffect(() => {
    if (isOpen) {
      setRender(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setAnim(true)));
    } else {
      setAnim(false);
      setTimeout(() => setRender(false), 200);
    }
  }, [isOpen]);

  useEffect(() => setBms(o.bookmarks || []), [o.bookmarks]);

  const save = v => {
    setBms(v);
    updateOption({ bookmarks: v });
  };

  const uniq = (base, skip) => {
    let i = 1, n = base;
    const names = bms.filter(b => b.id !== skip).map(b => b.name);
    while (names.includes(n)) n = `${base} (${i++})`;
    return n;
  };

  const reset = () => {
    setUrl(''); setNm(''); setIco('');
    setEditId(null); setShowForm(false);
  };

  const add = () => {
    if (!url.trim()) return;
    const regex = u => (/^(https?:)?\/\//.test(u) ? u : `https://${u}`);
    save([...bms, {
      id: createId(),
      name: uniq(nm.trim() || 'New Bookmark'),
      url: regex(url.trim()),
      icon: ico.trim() ? regex(ico.trim()) : null,
    }]);
    reset();
  };

  const update = () => {
    if (!url.trim() || !editId) return;
    const regex = u => (/^(https?:)?\/\//.test(u) ? u : `https://${u}`);
    const oldBm = bms.find(b => b.id === editId);
    const newIcon = ico.trim() ? regex(ico.trim()) : null;

    if (oldBm && oldBm.icon !== newIcon) {
      setLoadedIcons(p => {
        const n = new Set(p);
        n.delete(editId);
        return n;
      });
      setBadIcons(p => {
        const n = new Set(p);
        n.delete(editId);
        return n;
      });
    }

    save(bms.map(b =>
      b.id === editId
        ? {
          ...b,
          name: uniq(nm.trim() || 'New Bookmark', editId),
          url: regex(url.trim()),
          icon: newIcon,
        }
        : b
    ));
    reset();
  };

  const edit = b => {
    setEditId(b.id);
    setUrl(b.url);
    setNm(b.name);
    setIco(b.icon || '');
    setShowForm(true);
  };

  const del = id => save(bms.filter(b => b.id !== id));
  const fixUrl = u => (/^(https?:)?\/\//.test(u) ? u : `https://${u}`);

  if (!render) return null;
  const light = o.type === 'light';

  return createPortal(
    <div
      className={clsx(
        'fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-opacity',
        anim ? 'opacity-100' : 'opacity-0',
      )}
    >
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div
        className={clsx(
          'relative w-full max-w-2xl max-h-[80dvh] rounded-lg border shadow-lg overflow-hidden transition-all',
          anim ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
        )}
        style={{ backgroundColor: o.menuColor || '#1a252f' }}
      >
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: light ? '#e5e7eb' : '#374151' }}
        >
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-medium">
              {showForm ? (editId ? 'Edit Bookmark' : 'Create Bookmark') : 'Bookmarks'}
            </h2>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className={clsx('p-1 rounded-md', light ? 'hover:bg-gray-100' : 'hover:bg-[#ffffff0c]')}
              >
                <Plus size={18} />
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className={clsx('p-1 rounded-md', light ? 'hover:bg-gray-100' : 'hover:bg-[#ffffff0c]')}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(80dvh-4rem)]">
          {showForm ? (
            <div className="space-y-2">
              {[
                ['Bookmark Name', nm, setNm, PenLine],
                ['Bookmark URL', url, setUrl, Globe],
                ['Bookmark Icon (URL)', ico, setIco, Image],
              ].map(([ph, v, s, I], i) => (
                <div
                  key={i}
                  className={clsx(
                    'flex items-center gap-2 px-3 rounded-md border',
                    light ? 'bg-gray-50 border-gray-300' : 'bg-[#ffffff0c] border-gray-700',
                  )}
                >
                  <I size={16} />
                  <input
                    value={v}
                    onChange={e => s(e.target.value)}
                    placeholder={ph}
                    className="w-full py-2 text-sm bg-transparent outline-none"
                  />
                </div>
              ))}

              <div className="flex gap-2">
                <button
                  onClick={editId ? update : add}
                  disabled={!url.trim()}
                  className={clsx(
                    'flex-1 px-3 py-2 text-sm rounded-md flex items-center justify-center gap-2',
                    light ? 'bg-gray-200 hover:bg-gray-300' : 'bg-[#ffffff0c] hover:bg-[#ffffff15]',
                    !url.trim() && 'opacity-50 cursor-not-allowed',
                  )}
                >
                  {editId ? <Check size={16} /> : <Plus size={16} />}
                  {editId ? 'Save Changes' : 'Add Bookmark'}
                </button>
                <button
                  onClick={reset}
                  className={clsx(
                    'px-3 py-2 text-sm rounded-md',
                    light ? 'bg-gray-200 hover:bg-gray-300' : 'bg-[#ffffff0c] hover:bg-[#ffffff15]',
                  )}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : bms.length === 0 ? (
            <p className="text-sm text-gray-500">No bookmarks yet.</p>
          ) : (
            <div className="space-y-2">
              {bms.map(b => (
                <div
                  key={b.id}
                  onClick={() => {
                    if (inLoader) {
                      const processedUrl = process(fixUrl(b.url), false, o.prType || 'auto', o.engine || null);
                      const activeTab = tabs.find(t => t.active);

                      if (!o.openLinkInNewTab && activeTab) {
                        updateUrl(activeTab.id, processedUrl);
                      } else {
                        const id = createId();
                        addTab({
                          title: b.name || 'New Tab',
                          id,
                          url: processedUrl,
                        });
                        setActive(id);
                      }
                      onClose();
                    } else {
                      const finalUrl = fixUrl(b.url);
                      try {
                        const topWindow = window.top && window.top !== window ? window.top : window;
                        const opener = topWindow.__ghostOpenBrowserTab;
                        if (typeof opener === 'function') {
                          opener(finalUrl, { title: b.name || 'New Tab' });
                        } else {
                          window.open(finalUrl, '_blank', 'noopener,noreferrer');
                        }
                      } catch {
                        window.open(finalUrl, '_blank', 'noopener,noreferrer');
                      }
                    }
                  }}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer',
                    light ? 'hover:bg-gray-100' : 'hover:bg-[#ffffff0c]',
                  )}
                >
                  <div className="w-5 h-5 relative flex-shrink-0">
                    {b.icon && !badIcons.has(b.id) ? (
                      <>
                        {!loadedIcons.has(b.id) && (
                          <div className="absolute inset-0 bg-gray-600 rounded animate-pulse" />
                        )}
                        <img
                          src={b.icon}
                          className="w-5 h-5 relative"
                          onLoad={() => setLoadedIcons(p => new Set(p).add(b.id))}
                          onError={() => setBadIcons(p => new Set(p).add(b.id))}
                        />
                      </>
                    ) : (
                      <Globe size={20} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{b.name}</div>
                    <div className="text-xs text-gray-500 truncate">{b.url}</div>
                  </div>

                  <button
                    onClick={e => { e.stopPropagation(); edit(b); }}
                    className={clsx('p-1.5 rounded-md', light ? 'hover:bg-gray-200' : 'hover:bg-[#ffffff15]')}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); del(b.id); }}
                    className={clsx('p-1.5 rounded-md', light ? 'hover:bg-gray-200' : 'hover:bg-[#ffffff15]')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Bookmarks;
