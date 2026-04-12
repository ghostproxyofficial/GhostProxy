import Routing from './Routing';
import ReactGA from 'react-ga4';
import Search from './pages/Search';
import lazyLoad from './lazyWrapper';
import NotFound from './pages/NotFound';
import { useEffect, useMemo, memo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { OptionsProvider, useOptions } from './utils/optionsContext';
import { getEffectiveShortcuts, eventToShortcut, isTypingTarget } from './utils/shortcuts';
import { initPreload } from './utils/preload';
import { designConfig as bgDesign } from './utils/config';
import DialogHost from './components/DialogHost';
import './index.css';
import 'nprogress/nprogress.css';

const importApps = () => import('./pages/Apps');
const importGms = () => import('./pages/Apps2');
const importDocs = () => import('./pages/Docs');
const importSettings = () => import('./pages/Settings');
const importCode = () => import('./pages/CodeRunner');
const importAI = () => import('./pages/AI');
const importRemote = () => import('./pages/RemoteAccess');

const Apps = lazyLoad(importApps);
const Apps2 = lazyLoad(importGms);
const Docs = lazyLoad(importDocs);
const Settings = lazyLoad(importSettings);
const CodeRunner = lazyLoad(importCode);
const AI = lazyLoad(importAI);
const RemoteAccess = lazyLoad(importRemote);
const Player = lazyLoad(() => import('./pages/Player'));
const New = lazyLoad(() => import('./pages/New'));

initPreload('/apps', importApps);
initPreload('/discover', importGms);
initPreload('/docs', importDocs);
initPreload('/settings', importSettings);
initPreload('/code', importCode);
initPreload('/ai', importAI);
initPreload('/remote', importRemote);

function useTracking() {
  const location = useLocation();

  useEffect(() => {
    ReactGA.send({ hitType: 'pageview', page: location.pathname });
  }, [location]);
}

const ReturnToBrowserHint = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const isMac = typeof navigator !== 'undefined' ? /Mac|iPhone|iPad|iPod/i.test(navigator.platform) : false;
  const shortcutLabel = isMac ? 'Cmd - K' : 'Ctrl - K';

  useEffect(() => {
    const shouldShow = location.pathname !== '/search' && sessionStorage.getItem('ghostReturnToBrowserHint') === '1';
    setVisible(shouldShow);
  }, [location.pathname]);

  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (e) => {
      const usesMeta = isMac ? e.metaKey : e.ctrlKey;
      if (usesMeta && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        sessionStorage.removeItem('ghostReturnToBrowserHint');
        setVisible(false);
        navigate('/search');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [visible, isMac, navigate]);

  if (!visible) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[11000] px-4 py-2 rounded-lg border border-white/15 bg-[#0f1b2a]/95 backdrop-blur text-sm shadow-2xl">
      Return to Browser [{shortcutLabel}]
    </div>
  );
};

const ThemedApp = memo(() => {
  const { options } = useOptions();
  const [resolvedCustomBg, setResolvedCustomBg] = useState('');
  useTracking();

  useEffect(() => {
    let cancelled = false;
    const raw = (options.customBackgroundImage || '').trim();

    if (!raw) {
      setResolvedCustomBg('');
      return;
    }

    const cleaned = raw
      .replace(/^url\((.*)\)$/i, '$1')
      .replace(/^['"]|['"]$/g, '')
      .trim();

    const normalized = cleaned.startsWith('http://') || cleaned.startsWith('https://')
      ? cleaned
      : `https://${cleaned}`;

    const direct = encodeURI(normalized);
    const noProto = normalized.replace(/^https?:\/\//i, '');
    const wsrv = `https://wsrv.nl/?url=${encodeURIComponent(noProto)}&n=-1`;
    const thum = `https://image.thum.io/get/width/2560/noanimate/${direct}`;
    const candidates = [direct, wsrv, thum];

    const testImage = (src) =>
      new Promise((resolve) => {
        const image = new Image();
        image.onload = () => resolve({ ok: true, width: image.naturalWidth, height: image.naturalHeight });
        image.onerror = () => resolve({ ok: false, width: 0, height: 0 });
        image.src = src;
      });

    (async () => {
      for (const src of candidates) {
        const result = await testImage(src);
        if (cancelled) return;
        if (result.ok && result.width >= 320 && result.height >= 180) {
          setResolvedCustomBg(src);
          return;
        }
      }
      setResolvedCustomBg('');
    })();

    return () => {
      cancelled = true;
    };
  }, [options.customBackgroundImage]);

  useEffect(() => {
    const fontName = (options.globalFont || 'Inter').trim();
    const normalized = fontName.replace(/\s+/g, '+');
    const href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(normalized).replace(
      /%2B/g,
      '+',
    )}:wght@300;400;500;600;700&display=swap`;

    let link = document.getElementById('ghost-font-link');
    if (!link) {
      link = document.createElement('link');
      link.id = 'ghost-font-link';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = href;
  }, [options.globalFont]);

  const pages = useMemo(
    () => [
      { path: '/', element: <Search /> },
      { path: '/apps', element: <Apps /> },
      { path: '/discover', element: <Apps2 /> },
      { path: '/discover/r', element: <Player /> },
      { path: '/docs', element: <Docs /> },
      { path: '/docs/:category/:topicId', element: <Docs /> },
      { path: '/search', element: <Search /> },
      { path: '/settings', element: <Settings /> },
      { path: '/code', element: <CodeRunner /> },
      { path: '/ai', element: <AI /> },
      { path: '/remote', element: <RemoteAccess /> },
      { path: '/new', element: <New /> },
      { path: '*', element: <NotFound /> },
    ],
    [],
  );

  const backgroundStyle = useMemo(() => {
    const bgDesignConfig =
      options.bgDesign === 'None'
        ? 'none'
        : (
          bgDesign.find((d) => d.value.bgDesign === options.bgDesign) || bgDesign[0]
        ).value.getCSS?.(options.bgDesignColor || '102, 105, 109') || 'none';

    const transpValue = Number(options.bgTransparency ?? 20);
    const overlayAlpha = 100 - (Number.isFinite(transpValue) ? Math.max(0, Math.min(100, transpValue)) : 20);

    // We only apply the dimmer gradient if overlayAlpha > 0 and there's actually a background to dim
    const hasBg = resolvedCustomBg || bgDesignConfig !== 'none';
    const overlayGradient = hasBg && overlayAlpha > 0
      ? `linear-gradient(color-mix(in srgb, var(--ghost-bg-color) ${overlayAlpha}%, transparent), color-mix(in srgb, var(--ghost-bg-color) ${overlayAlpha}%, transparent))`
      : '';

    const finalBgImageHtml = resolvedCustomBg
      ? (overlayGradient ? `${overlayGradient}, url("${resolvedCustomBg}")` : `url("${resolvedCustomBg}")`)
      : 'none';

    const finalBgImageBody = resolvedCustomBg
      ? (overlayGradient ? `${overlayGradient}, url("${resolvedCustomBg}")` : `url("${resolvedCustomBg}")`)
      : (bgDesignConfig !== 'none' ? (overlayGradient ? `${overlayGradient}, ${bgDesignConfig}` : bgDesignConfig) : 'none');

    return `
      :root {
        --ghost-bg-color: ${options.bgColor || '#111827'};
        --ghost-logo-color: ${options.logoColor || '#ffffff'};
        --ghost-text-color: ${options.siteTextColor || '#a0b0c8'};
        --ghost-muted-text-color: ${options.siteMutedTextColor || 'rgba(160, 176, 200, 0.78)'};
        --ghost-public-logo-filter: ${(options.type === 'light' || options.theme === 'light')
          ? 'invert(0) brightness(0.12)'
          : 'invert(1) brightness(1.8)'};
        ${options.customFontFamily ? `--font-family: ${options.customFontFamily} !important;` : ''}
        ${options.customPadding ? `--main-padding: ${options.customPadding} !important;` : ''}
        ${options.customBorderRadius ? `--border-radius: ${options.customBorderRadius} !important;` : ''}
      }

      ${options.customFontFamily ? `* { font-family: ${options.customFontFamily} !important; }` : ''}

      ${options.customGlobalCss || ''}
      ${options.theme === 'custom' ? (options.customThemeCss || '') : ''}

      html {
        background-image: ${finalBgImageHtml};
        background-size: ${resolvedCustomBg ? '100% 100% !important' : 'auto'};
        background-repeat: ${resolvedCustomBg ? 'no-repeat !important' : 'repeat'};
        background-position: center;
        background-attachment: fixed;
        opacity: 1 !important;
      }

      body {
        color: ${options.siteTextColor || '#a0b0c8'};
        background-image: ${finalBgImageBody};
        background-size: ${resolvedCustomBg ? '100% 100% !important' : options.bgDesign === 'grid' ? '24px 24px' : 'auto'};
        background-repeat: ${resolvedCustomBg ? 'no-repeat !important' : 'repeat'};
        background-position: center;
        background-attachment: fixed;
        background-color: ${options.bgColor || '#111827'};
        font-family: '${(options.globalFont || 'Inter').replace(/'/g, '')}', Inter, system-ui, -apple-system, sans-serif;
        opacity: 1 !important;
      }

      #root {
        color: var(--ghost-text-color);
      }

      button,
      input,
      select,
      textarea {
        color: inherit;
      }

      input::placeholder,
      textarea::placeholder {
        color: var(--ghost-muted-text-color);
      }

      img[src="/ghost.png"]:not(.ghost-ai-logo),
      img[src$="/ghost.png"]:not(.ghost-ai-logo),
      img[src*="/ghost.png?"]:not(.ghost-ai-logo) {
        filter: var(--ghost-public-logo-filter) !important;
      }

      ${options.performanceMode
        ? `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
        scroll-behavior: auto !important;
      }
      
      img:not([src^="/"]):not([src^="data:"]):not([src=""]) { visibility: hidden !important; opacity: 0 !important; }
      video, iframe[src*="youtube"] { visibility: hidden !important; opacity: 0 !important; }

      html, body {
        background-image: none !important;
        background-color: ${options.bgColor || '#111827'} !important;
      }
      `
        : ''
      }
    `;
  }, [
    options.siteTextColor,
    options.bgDesign,
    options.bgDesignColor,
    options.bgColor,
    options.globalFont,
    options.performanceMode,
    options.logoColor,
    options.customGlobalCss,
    options.customThemeCss,
    options.theme,
    resolvedCustomBg,
    options.bgTransparency,
  ]);

  return (
    <>
      <Routing pages={pages} />
      <ReturnToBrowserHint />
      <DialogHost />
      <style>{backgroundStyle}</style>
    </>
  );
});

ThemedApp.displayName = 'ThemedApp';

const App = () => (
  <OptionsProvider>
    <ThemedApp />
  </OptionsProvider>
);

export default App;
