import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useOptions } from '/src/utils/optionsContext';

function hexToHsv(hex) {
  let r = 0, g = 0, b = 0;
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex || '').trim());
  if (m) { r = parseInt(m[1], 16) / 255; g = parseInt(m[2], 16) / 255; b = parseInt(m[3], 16) / 255; }
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : (d / max) * 100;
  const v = max * 100;
  return { h, s, v };
}
function hsvToHex(h, s, v) {
  s /= 100; v /= 100;
  const f = (n) => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
  const r = Math.round(f(5) * 255), g = Math.round(f(3) * 255), b = Math.round(f(1) * 255);
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

export default function ModernColorPicker({ value, onChange, label }) {
  const { options } = useOptions();
  const isLight =
    options?.type === 'light' || options?.theme === 'light' || options?.themeName === 'lightTheme';
  const [open, setOpen] = useState(false);
  const normalized = useMemo(() => {
    const raw = String(value || '#ffffff').trim();
    return /^#([a-f\d]{3}|[a-f\d]{6})$/i.test(raw) ? (raw.startsWith('#') ? raw : '#' + raw) : '#ffffff';
  }, [value]);
  const hsv = useMemo(() => hexToHsv(normalized), [normalized]);
  const [h, setH] = useState(hsv.h);
  const [s, setS] = useState(hsv.s);
  const [v, setV] = useState(hsv.v);
  const svRef = useRef(null);
  const hueRef = useRef(null);
  const [dragSV, setDragSV] = useState(false);
  const [dragHue, setDragHue] = useState(false);

  useEffect(() => { setH(hsv.h); setS(hsv.s); setV(hsv.v); }, [hsv.h, hsv.s, hsv.v]);

  const commit = useCallback((nh, ns, nv) => {
    const hex = hsvToHex(nh, ns, nv);
    onChange?.(hex);
  }, [onChange]);

  const updateSV = useCallback((clientX, clientY) => {
    if (!svRef.current) return;
    const rect = svRef.current.getBoundingClientRect();
    const ns = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const nv = Math.max(0, Math.min(100, (1 - (clientY - rect.top) / rect.height) * 100));
    setS(ns); setV(nv); commit(h, ns, nv);
  }, [h, commit]);

  const updateHue = useCallback((clientX) => {
    if (!hueRef.current) return;
    const rect = hueRef.current.getBoundingClientRect();
    const nh = Math.max(0, Math.min(360, ((clientX - rect.left) / rect.width) * 360));
    setH(nh); commit(nh, s, v);
  }, [s, v, commit]);

  useEffect(() => {
    if (!dragSV && !dragHue) return;
    const onMove = (e) => {
      const cx = e.touches?.[0]?.clientX ?? e.clientX;
      const cy = e.touches?.[0]?.clientY ?? e.clientY;
      if (dragSV) updateSV(cx, cy);
      if (dragHue) updateHue(cx);
    };
    const onUp = () => { setDragSV(false); setDragHue(false); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [dragSV, dragHue, updateSV, updateHue]);

  const previewHex = hsvToHex(h, s, v);

  return (
    <div className="relative w-full min-w-0">
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-10 h-10 rounded-lg border border-white/15 shrink-0 shadow-inner"
          style={{ background: normalized }}
          aria-label={label || 'Pick color'}
          title={normalized}
        />
        <input
          type="text"
          value={normalized}
          onChange={(e) => {
            const raw = e.target.value.trim();
            if (/^#?[a-f\d]{0,6}$/i.test(raw)) {
              // allow typing
              if (/^#?[a-f\d]{6}$/i.test(raw)) {
                const hex = raw.startsWith('#') ? raw : '#' + raw;
                const nHsv = hexToHsv(hex);
                setH(nHsv.h); setS(nHsv.s); setV(nHsv.v);
                onChange?.(hex.toLowerCase());
              }
            }
          }}
          onBlur={(e) => {
            const raw = e.target.value.trim();
            if (/^#?[a-f\d]{6}$/i.test(raw)) {
              const hex = (raw.startsWith('#') ? raw : '#' + raw).toLowerCase();
              onChange?.(hex);
            }
          }}
          className={`h-10 flex-1 min-w-0 rounded-md border px-3 text-sm font-mono uppercase outline-none ${isLight ? 'border-black/15 bg-black/[0.04] text-[#0f172a]' : 'border-white/10 bg-[#00000030] text-white'}`}
          placeholder="#ffffff"
        />
      </div>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className={`absolute left-0 top-[46px] z-50 w-[280px] rounded-xl border p-3 shadow-2xl ${isLight ? 'border-black/15 bg-white' : 'border-white/15 bg-[#0f141c]'}`}>
            <div
              ref={svRef}
              className="relative w-full rounded-lg overflow-hidden select-none cursor-crosshair"
              style={{ height: 140, background: `linear-gradient(to bottom, transparent, #000), linear-gradient(to right, #fff, hsl(${h}, 100%, 50%))` }}
              onMouseDown={(e) => { setDragSV(true); updateSV(e.clientX, e.clientY); }}
              onTouchStart={(e) => { setDragSV(true); updateSV(e.touches[0].clientX, e.touches[0].clientY); }}
            >
              <div className="absolute w-3.5 h-3.5 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)] pointer-events-none" style={{ left: `${s}%`, top: `${100 - v}%`, transform: 'translate(-50%, -50%)', background: previewHex }} />
            </div>
            <div
              ref={hueRef}
              className="relative w-full h-3 rounded-full mt-2 overflow-visible select-none cursor-pointer"
              style={{ background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)' }}
              onMouseDown={(e) => { setDragHue(true); updateHue(e.clientX); }}
              onTouchStart={(e) => { setDragHue(true); updateHue(e.touches[0].clientX); }}
            >
              <div className="absolute top-1/2 w-3.5 h-3.5 rounded-full border-2 border-white shadow pointer-events-none" style={{ left: `${(h / 360) * 100}%`, transform: 'translate(-50%, -50%)', background: `hsl(${h}, 100%, 50%)` }} />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="w-6 h-6 rounded-md border border-white/15 shrink-0" style={{ background: previewHex }} />
              <span className="text-xs font-mono opacity-70">{previewHex.toUpperCase()}</span>
              <button onClick={() => setOpen(false)} className={`ml-auto text-xs px-2 py-1 rounded ${isLight ? 'bg-black/[0.08] hover:bg-black/[0.12] text-[#0f172a]' : 'bg-white/10 hover:bg-white/15'}`}>Done</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
