import { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import clsx from 'clsx';
import { useOptions } from '/src/utils/optionsContext';
import { X, Check, Trash2, RotateCcw } from 'lucide-react';
import { BACKGROUND_LIST, BACKGROUND_CONFIGS } from '/src/data/backgroundConfigs';

const reactBitsModules = import.meta.glob('/src/components/reactbits/*/*.jsx');

function PreviewRenderer({ bgId, props }) {
  const DynamicComponent = useMemo(() => {
    if (!bgId || bgId === 'StarrySky') return null;
    const modulePath = Object.keys(reactBitsModules).find(p => p.includes(`/${bgId}/${bgId}.jsx`));
    if (modulePath) return lazy(reactBitsModules[modulePath]);
    return null;
  }, [bgId]);

  if (!bgId) return <div className="w-full h-full flex items-center justify-center text-white/30 text-sm">No background selected</div>;

  if (bgId === 'StarrySky') {
    return (
      <div className="w-full h-full bg-[#050505] relative overflow-hidden">
        <div id="stars"></div><div id="stars2"></div><div id="stars3"></div>
      </div>
    );
  }

  if (DynamicComponent) {
    return (
      <div className="w-full h-full bg-[#0a0a0a] relative overflow-hidden">
        <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-white/30 text-sm">Loading...</div>}>
          <div className="absolute inset-0">
            <DynamicComponent {...(props || {})} />
          </div>
        </Suspense>
      </div>
    );
  }

  return <div className="w-full h-full flex items-center justify-center text-white/30 text-sm">Preview unavailable</div>;
}

function PropEditor({ propKey, value, onChange }) {
  const type = typeof value;

  if (type === 'boolean') {
    return (
      <button type="button" onClick={() => onChange(!value)}
        className={clsx("relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors", value ? "bg-[#2f7fff]" : "bg-[#ffffff20]")}>
        <span className={clsx("inline-block h-4 w-4 rounded-full bg-white shadow transition", value ? "translate-x-4" : "translate-x-0")} />
      </button>
    );
  }

  if (type === 'number') {
    return (
      <input type="number" value={value} step={value % 1 !== 0 ? 0.1 : 1}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-24 h-7 rounded border border-white/10 bg-[#00000040] px-2 text-xs font-mono outline-none" />
    );
  }

  if (type === 'string' && value.match(/^#[0-9a-fA-F]{3,8}$/)) {
    return (
      <div className="flex items-center gap-1.5">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
          className="w-7 h-7 rounded border border-white/10 bg-transparent cursor-pointer" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
          className="w-20 h-7 rounded border border-white/10 bg-[#00000040] px-2 text-xs font-mono outline-none" />
      </div>
    );
  }

  if (type === 'string') {
    return (
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-32 h-7 rounded border border-white/10 bg-[#00000040] px-2 text-xs font-mono outline-none" />
    );
  }

  if (Array.isArray(value)) {
    const isColorArray = value.every(v => typeof v === 'string' && v.match(/^#/));
    if (isColorArray) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((c, i) => (
            <input key={i} type="color" value={c}
              onChange={(e) => { const next = [...value]; next[i] = e.target.value; onChange(next); }}
              className="w-7 h-7 rounded border border-white/10 bg-transparent cursor-pointer" />
          ))}
        </div>
      );
    }
    return <span className="text-xs opacity-50 font-mono">{JSON.stringify(value)}</span>;
  }

  return <span className="text-xs opacity-50 font-mono">{JSON.stringify(value)}</span>;
}

export default function BackgroundEditor({ open, onClose }) {
  const { options, updateOption } = useOptions();
  const isLight =
    options?.type === 'light' || options?.theme === 'light' || options?.themeName === 'lightTheme';
  const [visible, setVisible] = useState(false);
  const [render, setRender] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [customProps, setCustomProps] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (open) {
      setRender(true);
      const active = options.customAnimatedBackground || '';
      setSelectedId(active);
      setCustomProps(options.animatedBgProps || {});
      setTimeout(() => setVisible(true), 10);
    } else {
      setVisible(false);
      const timer = setTimeout(() => setRender(false), 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const all = [{ id: '', label: 'None' }, ...BACKGROUND_LIST];
    if (!searchQuery.trim()) return all;
    const q = searchQuery.toLowerCase();
    return all.filter(bg => bg.label.toLowerCase().includes(q));
  }, [searchQuery]);

  const currentConfig = BACKGROUND_CONFIGS[selectedId];
  const defaultProps = currentConfig?.props || {};

  const mergedProps = useMemo(() => {
    const saved = customProps[selectedId] || {};
    return { ...defaultProps, ...saved };
  }, [selectedId, customProps, defaultProps]);

  const handlePropChange = (key, value) => {
    setCustomProps(prev => ({
      ...prev,
      [selectedId]: { ...(prev[selectedId] || {}), [key]: value }
    }));
  };

  const handleResetProps = () => {
    setCustomProps(prev => {
      const next = { ...prev };
      delete next[selectedId];
      return next;
    });
  };

  const handleApply = () => {
    updateOption({ customAnimatedBackground: selectedId, animatedBgProps: customProps });
  };

  const handleApplyAndClose = () => {
    handleApply();
    onClose();
  };

  const handleRemove = () => {
    setSelectedId('');
    updateOption({ customAnimatedBackground: '', animatedBgProps: {} });
  };

  if (!open && !render) return null;
  const activeId = options.customAnimatedBackground || '';

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
      <div className={clsx(
        "ghost-glass relative w-full max-w-4xl max-h-[90dvh] rounded-xl border border-white/10 overflow-hidden flex flex-col transition-all duration-200",
        visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-[0.965] translate-y-2'
      )} style={{ backgroundColor: options.quickModalBgColor || options.menuColor || '#1a252f' }}>

        {/* header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
          <h2 className="text-lg font-semibold">Background Editor</h2>
          <div className="flex items-center gap-2">
            {activeId && (
              <button onClick={handleRemove} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-colors">
                <Trash2 size={13} /> Remove
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-[#ffffff12] transition-colors"><X size={18} /></button>
          </div>
        </div>

        {/* body */}
        <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
          {/* left: list */}
          <div className="w-[220px] border-r border-white/10 flex flex-col shrink-0">
            <div className="p-3 border-b border-white/5">
              <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full h-8 rounded-md border px-3 text-xs outline-none ${isLight ? 'border-black/15 bg-black/[0.04] text-[#0f172a] placeholder:text-[#64748b]' : 'border-white/10 bg-[#00000030] placeholder-white/30'}`} />
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-0.5">
              {filtered.map((bg) => (
                <button key={bg.id} onClick={() => setSelectedId(bg.id)}
                  className={clsx(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between",
                    selectedId === bg.id
                      ? (isLight ? "bg-black/[0.08] text-[#0f172a]" : "bg-[#ffffff18] text-white")
                      : (isLight ? "hover:bg-black/[0.05] text-[#475569] hover:text-[#0f172a]" : "hover:bg-[#ffffff0a] text-white/70 hover:text-white/90"),
                    activeId === bg.id && selectedId !== bg.id && (isLight ? "border border-black/15" : "border border-white/15")
                  )}>
                  <span className="truncate">{bg.label}</span>
                  {activeId === bg.id && <Check size={14} className="shrink-0 text-green-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* right: preview + config */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* preview */}
            <div className="relative min-h-[220px] max-h-[280px] flex-shrink-0 border-b border-white/10 bg-black/40">
              <div className="absolute inset-0 overflow-hidden">
                <PreviewRenderer bgId={selectedId} props={mergedProps} />
              </div>
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur text-xs text-white/70">
                {BACKGROUND_LIST.find(b => b.id === selectedId)?.label || 'None'}
              </div>
            </div>

            {/* props config */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {selectedId && Object.keys(defaultProps).length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs uppercase tracking-wide opacity-70 font-medium">Configuration</label>
                    <button onClick={handleResetProps} className="flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-[#ffffff10] opacity-60 hover:opacity-100 transition-opacity">
                      <RotateCcw size={12} /> Reset
                    </button>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(mergedProps).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-[#ffffff06] gap-3">
                        <span className="text-xs font-mono opacity-80 shrink-0">{key}</span>
                        <PropEditor propKey={key} value={val} onChange={(v) => handlePropChange(key, v)} />
                      </div>
                    ))}
                  </div>
                </>
              ) : selectedId ? (
                <div className="text-sm opacity-50 text-center py-6">No configurable props for this background.</div>
              ) : (
                <div className="text-sm opacity-50 text-center py-6">Select a background from the list.</div>
              )}
            </div>

            {/* footer */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-white/10">
              <button onClick={handleApplyAndClose} className="flex-1 h-10 rounded-lg bg-[#2f7fff44] hover:bg-[#2f7fff66] text-sm font-medium transition-colors">Apply & Close</button>
              <button onClick={handleApply} className="h-10 px-5 rounded-lg border border-white/15 hover:bg-[#ffffff10] text-sm transition-colors">Apply</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
