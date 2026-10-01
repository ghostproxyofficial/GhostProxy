import { useEffect, useRef, useState } from 'react';
import { MonitorUp, Sparkles, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import loaderStore from '/src/utils/hooks/loader/useLoaderStore';
import { useOptions } from '/src/utils/optionsContext';
import { process as processUrl } from '/src/utils/hooks/loader/utils';

const DUCK_AI_URL = 'https://duck.ai';

const isCanvasBlank = (canvas) => {
  try {
    const context = canvas.getContext('2d');
    const { width, height } = canvas;
    if (!width || !height) return true;
    const points = [
      [0, 0],
      [width - 1, 0],
      [0, height - 1],
      [width - 1, height - 1],
      [width >> 1, height >> 1],
    ];
    return points.every(([x, y]) => context.getImageData(x, y, 1, 1).data[3] === 0);
  } catch {
    return false;
  }
};

const renderFrame = (target, frame, foreignObjectRendering) => {
  const width = Math.max(1, frame.clientWidth || target.clientWidth || 1);
  const height = Math.max(1, frame.clientHeight || target.clientHeight || 1);
  return html2canvas(target, {
    allowTaint: false,
    backgroundColor: null,
    foreignObjectRendering,
    logging: false,
    scale: 1,
    scrollX: 0,
    scrollY: 0,
    useCORS: true,
    width,
    height,
    windowHeight: height,
    windowWidth: width,
  });
};

const captureFrameToBlob = async (frame) => {
  const frameDocument = frame?.contentDocument;
  const target = frameDocument?.body || frameDocument?.documentElement;
  if (!frame || !target) return null;

  let canvas = await renderFrame(target, frame, false);
  if (isCanvasBlank(canvas)) canvas = await renderFrame(target, frame, true);
  if (isCanvasBlank(canvas)) return null;

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
};

const deliverToDuck = async (frame, file) => {
  if (!frame) return false;

  let frameDocument = null;
  try {
    frameDocument = frame.contentDocument;
  } catch {
    frameDocument = null;
  }

  if (frameDocument) {
    const fileInput = frameDocument.querySelector('input[type="file"]');
    if (fileInput) {
      try {
        const transfer = new DataTransfer();
        transfer.items.add(file);
        try {
          fileInput.files = transfer.files;
        } catch {
          Object.defineProperty(fileInput, 'files', { configurable: true, value: transfer.files });
        }
        fileInput.dispatchEvent(new Event('input', { bubbles: true }));
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      } catch {
        // fall through to the paste path
      }
    }

    const composer = frameDocument.querySelector('[contenteditable="true"], textarea');
    if (composer) {
      try {
        composer.focus();
        const transfer = new DataTransfer();
        transfer.items.add(file);
        composer.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: transfer }));
        return true;
      } catch {
        // fall through to the clipboard path
      }
    }
  }

  try {
    if (navigator.clipboard?.write && window.ClipboardItem) {
      await navigator.clipboard.write([new ClipboardItem({ [file.type]: file })]);
      frame.contentWindow?.focus?.();
      return true;
    }
  } catch {
    // clipboard permissions are optional
  }

  return false;
};

export default function Halo() {
  const { options } = useOptions();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const frameRef = useRef(null);
  const shellRef = useRef(null);

  const isLight = options.type === 'light' || options.theme === 'light' || options.themeName === 'lightTheme';
  const textColor = options.siteTextColor || (isLight ? '#0f172a' : '#f3f4f6');
  const duckUrl = processUrl(DUCK_AI_URL, false, 'scr');
  const isTopFrame = typeof window === 'undefined' || window === window.top;

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutside = (event) => {
      if (!shellRef.current?.contains(event.target)) setOpen(false);
    };

    // the quick ai panels own frame isnt an outside click
    const isOwnFrame = (frame) => {
      if (!frame) return false;
      try {
        return !!shellRef.current?.contains(frame);
      } catch {
        return false;
      }
    };

// pointer events inside a proxied iframe never bubble up to here so listen
// on the frames too and close on their focus/blur
    const bindFrameListeners = () => {
      document.querySelectorAll('iframe').forEach((frame) => {
        if (isOwnFrame(frame)) return;
        try {
          const frameWindow = frame.contentWindow;
          if (!frameWindow || frameWindow.__ghostHaloBound) return;
          frameWindow.__ghostHaloBound = true;
          frameWindow.addEventListener('pointerdown', () => setOpen(false));
        } catch {
          // cross-origin frames cant be instrumented, the blur handler below covers them
        }
      });
    };

    const onWindowBlur = () => {
      window.setTimeout(() => {
        const active = document.activeElement;
        if (active && active.tagName === 'IFRAME' && !isOwnFrame(active)) setOpen(false);
      }, 0);
    };

    document.addEventListener('pointerdown', closeOnOutside, true);
    window.addEventListener('blur', onWindowBlur);
    bindFrameListeners();
    const frameObserver = window.setInterval(bindFrameListeners, 2000);

    return () => {
      document.removeEventListener('pointerdown', closeOnOutside, true);
      window.removeEventListener('blur', onWindowBlur);
      window.clearInterval(frameObserver);
    };
  }, [open]);

  if (options.haloEnabled === false || !isTopFrame) return null;

  const openQuickAi = () => {
    setOpen((current) => !current);
  };

  const captureAndSend = async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) return;

    setLoading(true);
    let stream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const track = stream.getVideoTracks()[0];
      const settings = track.getSettings();
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      await video.play();
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      const canvas = document.createElement('canvas');
      canvas.width = settings.width || video.videoWidth;
      canvas.height = settings.height || video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) return;

      const file = new File([blob], `ghost-screen-${Date.now()}.png`, { type: 'image/png' });
      await deliverToDuck(frameRef.current, file);
    } catch {
      // capture permission is user-controlled
    } finally {
      stream?.getTracks?.().forEach((track) => track.stop());
      setLoading(false);
    }
  };

  const captureCurrentTabAndSend = async () => {
    const activeTab = loaderStore.getState().tabs.find((tab) => tab.active);
    const frame = activeTab
      ? Array.from(document.querySelectorAll('iframe[data-ghost-tab-id]'))
        .find((candidate) => candidate.getAttribute('data-ghost-tab-id') === String(activeTab.id))
      : null;
    if (!frame) {
      console.error('[quick-ai] no active Ghost tab frame was found');
      return;
    }

    setLoading(true);
    try {
      const blob = await captureFrameToBlob(frame);
      if (!blob) {
        console.error('[quick-ai] the active Ghost tab could not be captured');
        return;
      }
      const file = new File([blob], `ghost-tab-${Date.now()}.png`, { type: 'image/png' });
      const delivered = await deliverToDuck(frameRef.current, file);
      if (!delivered) console.error('[quick-ai] screenshot captured but could not be delivered to Duck.ai');
    } catch (error) {
      console.error('[quick-ai] screenshot capture failed', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={shellRef} data-halo-root className="fixed top-1.5 right-1.5 z-[200] select-none">
      <button
        type="button"
        onClick={openQuickAi}
        aria-label="Open Quick AI"
        aria-expanded={open}
        className="ghost-glass flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold shadow-lg transition-transform hover:scale-[1.03]"
        style={{ color: textColor }}
      >
        {open ? <X size={14} /> : <Sparkles size={14} />}
        <span>Quick AI</span>
      </button>

      <section
        onPointerDown={(event) => event.stopPropagation()}
        className={`ghost-glass absolute right-0 top-10 flex h-[min(680px,calc(100vh-64px))] w-[min(520px,calc(100vw-24px))] origin-top-right flex-col overflow-hidden rounded-2xl border shadow-2xl transition duration-200 ${open ? 'pointer-events-auto scale-100 opacity-100' : 'pointer-events-none scale-[0.97] opacity-0'}`}
        aria-hidden={!open}
      >
        <div className="relative min-h-0 flex-1 bg-black/10">
          {open && (
            <iframe
              ref={frameRef}
              src={duckUrl}
              title="Duck.ai Quick AI"
              className="h-full w-full border-0"
              allow="clipboard-read; clipboard-write; display-capture; microphone; camera"
            />
          )}
          {loading && <div className="absolute inset-0 bg-black/25" aria-hidden="true" />}
        </div>

        <footer className="flex flex-wrap items-center gap-2 border-t p-3" style={{ borderColor: 'var(--ghost-glass-border)' }}>
          <button type="button" onClick={captureAndSend} disabled={loading} className="flex h-9 items-center gap-2 rounded-xl border border-blue-300/25 bg-blue-500/15 px-3 text-xs font-semibold text-blue-100 transition hover:bg-blue-500/25 disabled:opacity-50">
            <MonitorUp size={14} />
            Share & send
          </button>
          <button type="button" onClick={captureCurrentTabAndSend} disabled={loading} className="flex h-9 items-center gap-2 rounded-xl border border-blue-300/25 bg-blue-500/15 px-3 text-xs font-semibold text-blue-100 transition hover:bg-blue-500/25 disabled:opacity-50">
            <MonitorUp size={14} />
            Send current Ghost tab
          </button>
        </footer>
      </section>
    </div>
  );
}
