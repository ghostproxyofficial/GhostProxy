import { useEffect, useMemo, useState } from 'react';
import { Trash2, X } from 'lucide-react';
import clsx from 'clsx';
import { useOptions } from '/src/utils/optionsContext';
import { onNextPaint } from '/src/utils/popupAnim';

const HISTORY_KEY = 'ghostBrowserHistory';

const readHistory = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// one history popup for the whole app. the search page and the settings data
// section used to have their own near identical copies that drifted apart.
const HistoryPopup = ({ open, onClose, onOpenItem }) => {
  const { options } = useOptions();
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [anim, setAnim] = useState(false);
  const [render, setRender] = useState(false);

  useEffect(() => {
    if (!open) {
      setAnim(false);
      const t = setTimeout(() => setRender(false), 200);
      return () => clearTimeout(t);
    }
    setItems(readHistory());
    setQuery('');
    setAnim(false);
    setRender(true);
    return onNextPaint(() => setAnim(true));
  }, [open]);

  // keep it live while open so entries added elsewhere show up
  useEffect(() => {
    if (!open) return undefined;
    const id = setInterval(() => setItems(readHistory()), 2000);
    const onStorage = () => setItems(readHistory());
    window.addEventListener('storage', onStorage);
    window.addEventListener('ghost-history-updated', onStorage);
    return () => {
      clearInterval(id);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('ghost-history-updated', onStorage);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const title = String(item?.title || '').toLowerCase();
      const url = String(item?.url || '').toLowerCase();
      return title.includes(q) || url.includes(q);
    });
  }, [items, query]);

  const write = (next) => {
    setItems(next);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch { }
    window.dispatchEvent(new Event('ghost-history-updated'));
  };

  const clearAll = () => write([]);
  const removeItem = (item) => {
    const key = item?.id || `${item?.url}-${item?.time}`;
    write(items.filter((x) => (x?.id || `${x?.url}-${x?.time}`) !== key));
  };

  if (!open || !render) return null;

  const isLight =
    options.type === 'light' ||
    options.theme === 'light' ||
    options.themeName === 'lightTheme';
  const surface = options.quickModalBgColor || options.menuColor || '#252f3e';
  const rowBg = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
  const rowHover = isLight ? 'rgba(0,0,0,0.09)' : 'rgba(255,255,255,0.08)';
  const inputBg = options.omninputColor || 'rgba(255,255,255,0.06)';

  return (
    <div
      className={
        'fixed inset-0 z-[10000] flex items-center justify-center p-4 transition-opacity duration-200 ' +
        (anim ? 'opacity-100' : 'opacity-0')
      }
    >
      <div className="absolute inset-0 bg-black/50" onClick={() => onClose?.()} />
      <div
        className={
          'ghost-glass relative w-full max-w-4xl max-h-[80dvh] rounded-xl border border-white/10 overflow-hidden flex flex-col transition-all duration-200 ' +
          (anim ? 'opacity-100 scale-100' : 'opacity-0 scale-95')
        }
        style={{ backgroundColor: surface }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
          <h2 className="text-lg font-semibold">History</h2>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={clearAll}
                className="h-8 px-2.5 rounded-md hover:bg-[#ffffff12] text-xs flex items-center gap-1"
              >
                <Trash2 size={13} /> Clear
              </button>
            )}
            <button onClick={() => onClose?.()} className="p-1 rounded-md hover:bg-[#ffffff12]">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-white/10 shrink-0" style={{ backgroundColor: surface }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search history"
            className="w-full h-9 rounded-md border border-white/10 px-3 text-sm outline-none"
            style={{ backgroundColor: inputBg }}
          />
        </div>

        <div className="px-4 py-3 overflow-y-auto min-h-0 flex-1 space-y-2">
          {filtered.length === 0 && (
            <p className="text-sm opacity-70">No matching history entries.</p>
          )}
          {filtered.map((item) => (
            <div
              key={item.id || `${item.url}-${item.time}`}
              onClick={() => onOpenItem?.(item)}
              className="rounded-lg p-3 transition-colors cursor-pointer"
              style={{ backgroundColor: rowBg }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = rowHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = rowBg; }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{item.title || item.url}</p>
                  <p className="text-xs opacity-70 break-all">{item.url}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {item.time ? new Date(item.time).toLocaleString() : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeItem(item);
                  }}
                  className="p-1.5 rounded-md hover:bg-[#ffffff12]"
                  title="Delete entry"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HistoryPopup;
