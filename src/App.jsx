import Routing from './Routing';
import ReactGA from 'react-ga4';
import Search from './pages/Search';
import lazyLoad from './lazyWrapper';
import NotFound from './pages/NotFound';
import { useEffect, useMemo, memo, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { OptionsProvider, useOptions } from './utils/optionsContext';
import { getEffectiveShortcuts, eventToShortcut, isTypingTarget } from './utils/shortcuts';
import { initPreload } from './utils/preload';
import { designConfig as bgDesign } from './utils/config';
import { applyStealthMode } from './utils/stealthMode';
import DialogHost from './components/DialogHost';
import GlobalShortcuts from './components/GlobalShortcuts';
import AnimatedBackground from './components/AnimatedBackground';
import Halo from './components/Halo';
import './index.css';
import 'nprogress/nprogress.css';

const importApps = () => import('./pages/Apps');
const importGms = () => import('./pages/Apps2');
const importDocs = () => import('./pages/Docs');
const importSettings = () => import('./pages/Settings');
const importCode = () => import('./pages/CodeRunner');
const importAI = () => import('./pages/AI');
const importRemote = () => import('./pages/RemoteAccess');
const importNotes = () => import('./pages/Notes');

const Apps = lazyLoad(importApps);
const Apps2 = lazyLoad(importGms);
const Docs = lazyLoad(importDocs);
const Settings = lazyLoad(importSettings);
const CodeRunner = lazyLoad(importCode);
const AI = lazyLoad(importAI);
const RemoteAccess = lazyLoad(importRemote);
const Notes = lazyLoad(importNotes);
const Player = lazyLoad(() => import('./pages/Player'));
const New = lazyLoad(() => import('./pages/New'));

initPreload('/apps', importApps);
initPreload('/discover', importGms);
initPreload('/docs', importDocs);
initPreload('/settings', importSettings);
initPreload('/code', importCode);
initPreload('/ai', importAI);
initPreload('/remote', importRemote);
initPreload('/notes', importNotes);

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
  const navigate = useNavigate();
  const [resolvedCustomBg, setResolvedCustomBg] = useState('');
  useTracking();

  useEffect(() => {
    applyStealthMode(options.stealthMode || 0);
  }, [options.stealthMode]);

  useEffect(() => {
    const root = document.documentElement;
    const isLight = options.type === 'light' || options.theme === 'light' || options.themeName === 'lightTheme';
    root.classList.toggle('liquid-glass', options.liquidGlassEnabled !== false);
    root.classList.toggle('ghost-light', isLight);
  }, [options.liquidGlassEnabled, options.type, options.theme, options.themeName]);

  const openInGhostBrowser = useCallback((url, title = 'New Tab') => {
    const rawUrl = String(url || '').trim();
    if (!rawUrl) return;

    const topWindow = (() => {
      try {
        return window.top && window.top !== window ? window.top : window;
      } catch {
        return window;
      }
    })();

    const openBrowserTab = topWindow.__ghostOpenBrowserTab;
    if (typeof openBrowserTab === 'function') {
      openBrowserTab(rawUrl, { title });
      return;
    }

    navigate('/search', {
      state: {
        url: rawUrl,
        openInGhostNewTab: true,
      },
    });
  }, [navigate]);

  useEffect(() => {
    const isDiscordOrGithub = (href) => {
      try {
        const parsed = new URL(href, window.location.href);
        const host = String(parsed.hostname || '').toLowerCase();
        return host === 'github.com' || host.endsWith('.github.com') || host === 'discord.com' || host.endsWith('.discord.com') || host === 'discord.gg' || host.endsWith('.discord.gg');
      } catch {
        return false;
      }
    };

    const onDocumentClick = (event) => {
      const anchor = event.target?.closest?.('a[href]');
      if (!anchor) return;
      const href = String(anchor.getAttribute('href') || '').trim();
      if (!href || !isDiscordOrGithub(href)) return;

      event.preventDefault();
      event.stopPropagation();
      openInGhostBrowser(href, anchor.textContent?.trim() || 'New Tab');
    };

    document.addEventListener('click', onDocumentClick, true);
    return () => document.removeEventListener('click', onDocumentClick, true);
  }, [openInGhostBrowser]);



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
      { path: '/notes', element: <Notes /> },
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

    const hasBg = bgDesignConfig !== 'none';
    const overlayGradient = hasBg && overlayAlpha > 0
      ? `linear-gradient(color-mix(in srgb, var(--ghost-bg-color) ${overlayAlpha}%, transparent), color-mix(in srgb, var(--ghost-bg-color) ${overlayAlpha}%, transparent))`
      : '';

    const backgrounds = [];
    if (overlayGradient) backgrounds.push(overlayGradient);
    if (hasBg) {
      backgrounds.push(bgDesignConfig);
    }

    const finalBgImage = backgrounds.length > 0 ? backgrounds.join(', ') : 'none';

     const rawGlassBlur = Number(options.liquidGlassBlur ?? 18);
     const glassBlur = Math.max(0, Math.min(20, Number.isFinite(rawGlassBlur) ? rawGlassBlur : 18));
     const glassTint = Math.max(0, Math.min(0.4, Number(options.liquidGlassTint ?? 0.12) || 0));
     const glassSaturation = Math.max(0.5, Math.min(2.5, Number(options.liquidGlassSaturation ?? 1.2) || 1.2));
     const isLightTheme = options.type === 'light' || options.theme === 'light' || options.themeName === 'lightTheme';
     const gradientStart = isLightTheme ? '#2563eb' : (options.navItemActive || '#ffffff');
     const gradientEnd = isLightTheme ? '#7c3aed' : (options.switchEnabledColor || '#a0b0c8');

    return `
      :root {
        --ghost-bg-color: ${options.bgColor || '#111827'};
        --ghost-logo-color: ${options.logoColor || '#ffffff'};
        --ghost-text-color: ${options.siteTextColor || '#a0b0c8'};
         --ghost-muted-text-color: ${options.siteMutedTextColor || 'rgba(160, 176, 200, 0.78)'};
         --ghost-border-color: ${isLightTheme ? 'rgba(15, 23, 42, 0.14)' : 'rgba(255, 255, 255, 0.11)'};
        --ghost-control-track: ${isLightTheme ? 'rgba(15, 23, 42, 0.12)' : 'rgba(255, 255, 255, 0.1)'};
        --ghost-control-thumb: ${isLightTheme ? '#334155' : '#ffffff'};
        --ghost-glass-surface: ${isLightTheme ? `rgba(190, 197, 208, ${(0.28 + glassTint * 0.45).toFixed(2)})` : `rgba(8, 9, 12, ${(0.72 + glassTint * 0.35).toFixed(2)})`};
        --ghost-glass-surface-strong: ${isLightTheme ? `rgba(184, 191, 202, ${(0.38 + glassTint * 0.45).toFixed(2)})` : `rgba(8, 9, 12, ${(0.82 + glassTint * 0.2).toFixed(2)})`};
        --ghost-glass-border: ${isLightTheme ? 'rgba(15, 23, 42, 0.16)' : 'rgba(255, 255, 255, 0.11)'};
        --ghost-glass-highlight: ${isLightTheme ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.025)'};
        --ghost-glass-shadow: ${isLightTheme ? 'rgba(15, 23, 42, 0.16)' : 'rgba(0, 0, 0, 0.48)'};
        --ghost-glass-noise: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 .055 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        --ghost-public-logo-filter: ${(options.type === 'light' || options.theme === 'light' || options.themeName === 'lightTheme')
          ? 'invert(0) brightness(0.12)'
          : 'invert(1) brightness(1.8)'};
        ${options.customFontFamily ? `--font-family: ${options.customFontFamily} !important;` : ''}
        ${options.customPadding ? `--main-padding: ${options.customPadding} !important;` : ''}
        ${options.customBorderRadius ? `--border-radius: ${options.customBorderRadius} !important;` : ''}
      }

      ${options.customFontFamily ? `* { font-family: ${options.customFontFamily} !important; }` : ''}

      ${options.customGlobalCss || ''}
      ${options.theme === 'custom' ? (options.customThemeCss || '') : ''}

      ${options.gradientText ? `
      h1, h2, h3, h4, h5, h6 {
         background-image: linear-gradient(135deg, ${gradientStart}, ${gradientEnd}) !important;
        -webkit-background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
        background-clip: text !important;
        color: transparent !important;
        display: inline-block;
      }
      ` : ''}

      /* Frosted surfaces stay translucent so animated backgrounds remain visible. */
      .liquid-glass .ghost-glass,
      .liquid-glass .ghost-glass-tint {
        background-color: var(--ghost-glass-surface) !important;
        background-image: linear-gradient(135deg, var(--ghost-glass-highlight), transparent 48%), var(--ghost-glass-noise) !important;
        background-blend-mode: normal, soft-light;
        background-clip: padding-box;
        border-color: var(--ghost-glass-border) !important;
        backdrop-filter: blur(${glassBlur}px) saturate(${glassSaturation});
        -webkit-backdrop-filter: blur(${glassBlur}px) saturate(${glassSaturation});
        box-shadow: 0 18px 42px var(--ghost-glass-shadow), inset 0 1px 0 var(--ghost-glass-highlight);
      }

      .liquid-glass .ghost-glass-contained {
        isolation: isolate;
      }

      .liquid-glass .ghost-profile-manager {
        background-color: var(--ghost-glass-surface-strong) !important;
        background-image: linear-gradient(135deg, var(--ghost-glass-highlight), transparent 48%), var(--ghost-glass-noise) !important;
        background-blend-mode: normal, soft-light;
        backdrop-filter: blur(${Math.min(24, glassBlur + 2)}px) saturate(${glassSaturation});
        -webkit-backdrop-filter: blur(${Math.min(24, glassBlur + 2)}px) saturate(${glassSaturation});
      }

      .liquid-glass .ghost-profile-manager > div,
      .liquid-glass .ghost-profile-manager .ghost-profile-row,
      .liquid-glass .ghost-profile-manager input,
      .liquid-glass .ghost-profile-manager button {
        background-image: linear-gradient(135deg, var(--ghost-glass-highlight), transparent 52%), var(--ghost-glass-noise) !important;
        background-blend-mode: normal, soft-light;
      }

      .liquid-glass .ghost-profile-manager > div {
        background-color: color-mix(in srgb, var(--ghost-glass-surface) 72%, transparent) !important;
        border-color: var(--ghost-glass-border) !important;
      }

      .liquid-glass .ghost-profile-manager .ghost-profile-row {
        background-color: color-mix(in srgb, var(--ghost-glass-surface) 58%, transparent) !important;
        border-color: var(--ghost-glass-border) !important;
      }

      .liquid-glass .ghost-profile-manager .ghost-profile-row-active {
        background-color: color-mix(in srgb, var(--ghost-glass-surface-strong) 78%, transparent) !important;
      }

      .liquid-glass .ghost-profile-manager input {
        background-color: color-mix(in srgb, var(--ghost-glass-surface) 78%, transparent) !important;
        border-color: var(--ghost-glass-border) !important;
      }

      html {
        background-image: ${options.customAnimatedBackground ? 'none' : options.customBackgroundImage ? `url(${options.customBackgroundImage})` : finalBgImage};
        background-size: ${options.customBackgroundImage || bgDesignConfig.includes('url(') ? 'cover !important' : 'auto'};
        background-repeat: ${options.customBackgroundImage || bgDesignConfig.includes('url(') ? 'no-repeat !important' : 'repeat'};
        background-position: center;
        background-attachment: fixed;
        background-color: ${options.customAnimatedBackground ? 'transparent' : (options.bgColor || '#111827')};
        opacity: 1 !important;
      }

      body {
        color: ${options.siteTextColor || '#a0b0c8'};
        background-image: ${options.customAnimatedBackground ? 'none' : options.customBackgroundImage ? `url(${options.customBackgroundImage})` : finalBgImage};
        background-size: ${options.customBackgroundImage || bgDesignConfig.includes('url(') ? 'cover !important' : options.bgDesign === 'grid' ? '24px 24px' : 'auto'};
        background-repeat: ${options.customBackgroundImage || bgDesignConfig.includes('url(') ? 'no-repeat !important' : 'repeat'};
        background-position: center;
        background-attachment: fixed;
        background-color: ${options.customAnimatedBackground ? 'transparent' : (options.bgColor || '#111827')};
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
    options.gradientText,
    options.navItemActive,
    options.switchEnabledColor,
    resolvedCustomBg,
    options.bgTransparency,
    options.customAnimatedBackground,
    options.customBackgroundImage,
     options.type,
     options.themeName,
     options.liquidGlassBlur,
     options.liquidGlassTint,
     options.liquidGlassSaturation,
   ]);

  return (
    <>
      <AnimatedBackground />
      <GlobalShortcuts />
      <Halo />
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
