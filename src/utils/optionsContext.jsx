import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { themeConfig, designConfig, searchConfig, prConfig } from '/src/utils/config';
import { buildDefaultShortcutsMap } from '/src/utils/shortcuts';

const OptionsContext = createContext();

const darkThemeDefaults = themeConfig.find((c) => c.option === 'Dark')?.value || themeConfig[0].value;
const gridDesignDefaults = designConfig.find((c) => c.option === 'Griddy')?.value || designConfig[0].value;
const duckDuckGoDefaults =
  searchConfig.find((c) => c.option === 'DuckDuckGo')?.value || searchConfig[0].value;
const scramjetDefaults = prConfig.find((c) => c.option === 'Scramjet only')?.value || prConfig[0].value;

const DEFAULT_OPTIONS = {
  ...darkThemeDefaults,
  ...gridDesignDefaults,
  ...duckDuckGoDefaults,
  ...scramjetDefaults,
  lastThemePresetName: darkThemeDefaults.themeName || 'darkTheme',
  tabName: 'Ghost',
  tabIcon: '/ghost.ico',
  clkOff: false,
  saveTabs: true,
  shortcuts: buildDefaultShortcutsMap(),
  transport: 'libcurl',
  proxyRouting: 'direct',
  remoteProxyServer: '',
  globalFont: 'Inter',
  performanceMode: false,
  customBackgroundImage: '',
  cloudSave: '',
  cloudSaveEnabled: false,
  cloudSaveUsername: '',
  cloudSavePassword: '',
  cssEditorPresets: [],
  activeCssPresetId: null,
  customGlobalCss: '',
  customThemeCss: '',
  logoColor: '',
  itemsPerPage: 50,
  searchRecommendationsTop: true,
  prType: 'scr',
  adBlockDefault: false,
  popupBlockDefault: false,
  downloadBlockDefault: false,
  clock24Hour: false,
  timezoneOverride: null,
  weatherUnit: 'fahrenheit',
  weatherUseIpLocation: true,
  weatherCoordsOverride: '',
  defaultMusicPlayer: '',
  defaultAiProvider: '',
  debugMode: false,
};

const normalizeLegacyOptions = (stored) => {
  if (!stored || typeof stored !== 'object') return stored;
  const out = { ...stored };

  const legacyThemeMap = {
    paper: { theme: 'graphite', themeName: 'graphiteTheme', type: 'dark' },
    rose: { theme: 'violet', themeName: 'violetTheme', type: 'dark' },
    arctic: { theme: 'slate', themeName: 'slateTheme', type: 'dark' },
  };
  const legacyNameMap = {
    paperTheme: legacyThemeMap.paper,
    roseTheme: legacyThemeMap.rose,
    arcticTheme: legacyThemeMap.arctic,
  };
  const normalizedTheme = String(out.theme || '').trim().toLowerCase();
  const normalizedThemeName = String(out.themeName || '').trim();
  const mappedTheme = legacyThemeMap[normalizedTheme] || legacyNameMap[normalizedThemeName] || null;
  if (mappedTheme) {
    const replacement = themeConfig.find(
      (entry) =>
        entry?.value?.theme === mappedTheme.theme || entry?.value?.themeName === mappedTheme.themeName,
    )?.value;
    if (replacement && typeof replacement === 'object') {
      Object.assign(out, replacement);
    }
    out.theme = mappedTheme.theme;
    out.themeName = mappedTheme.themeName;
    out.type = mappedTheme.type;
  }

  if (out.theme !== 'custom' && out.themeName) {
    out.lastThemePresetName = out.themeName;
  }

  if (!out.lastThemePresetName || out.lastThemePresetName === 'lightTheme') {
    out.lastThemePresetName = darkThemeDefaults.themeName || 'darkTheme';
  }

  const legacyTitle = typeof out.tabName === 'string' && out.tabName.startsWith('v5-');
  const legacyIcon = out.tabIcon === '/icon.svg' || out.tabIcon === '/icon.png';
  if (legacyTitle || legacyIcon) {
    out.tabName = 'Ghost';
    out.tabIcon = '/ghost.ico';
  }

  if (!out.shortcuts || typeof out.shortcuts !== 'object') {
    out.shortcuts = buildDefaultShortcutsMap();
  } else {
    const migrations = {
      nextTab: ['Alt+Tab', 'Alt+`'],
      previousTab: ['Alt+Shift+Tab', 'Ctrl+Shift+~'],
      pinTab: ['Alt+P', 'Alt+Shift+P'],
      goBack: ['Alt+ArrowLeft', 'Alt+Shift+ArrowLeft'],
      goForward: ['Alt+ArrowRight', 'Alt+Shift+ArrowRight'],
      goHome: ['Alt+H', 'Alt+Shift+H'],
      zoomIn: ['Alt+=', 'Ctrl+='],
      zoomOut: ['Alt+-', 'Ctrl+-'],
      zoomReset: ['Ctrl+0', 'Alt+Shift+0'],
      openHistory: ['Alt+Shift+H', 'Alt+Shift+Y'],
    };

    Object.entries(migrations).forEach(([id, [oldKey, newKey]]) => {
      if (!out.shortcuts[id]) return;
      if (out.shortcuts[id].key === oldKey) {
        out.shortcuts[id] = { ...out.shortcuts[id], key: newKey };
      }
    });

    if (out.shortcuts.bookmarkCurrentPage?.key === 'Alt+Shift+D') {
      out.shortcuts.bookmarkCurrentPage = {
        ...out.shortcuts.bookmarkCurrentPage,
        key: 'Alt+Shift+K',
      };
    }

    if (out.shortcuts.bookmarkCurrentPage?.key === '' || out.shortcuts.bookmarkCurrentPage?.key === 'Ctrl+Shift+D') {
      out.shortcuts.bookmarkCurrentPage = {
        ...out.shortcuts.bookmarkCurrentPage,
        key: 'Alt+Shift+K',
      };
    }

    [
      'createTabGroup',
      'removeTabGroup',
      'viewPageSource',
      'findInPage',
      'findNext',
      'findPrevious',
    ].forEach((id) => {
      if (Object.prototype.hasOwnProperty.call(out.shortcuts, id)) {
        delete out.shortcuts[id];
      }
    });
  }

  if (Array.isArray(out.quickLinks) && out.quickLinks.length >= 4) {
    const hasCrazy = out.quickLinks.some((q) => (q?.name || '').toLowerCase().includes('crazy'));
    const hasTikTok = out.quickLinks.some((q) => (q?.name || '').toLowerCase().includes('tiktok'));
    if (hasCrazy || hasTikTok) {
      out.quickLinks = [
        { link: 'https://google.com', icon: 'https://google.com/favicon.ico', name: 'Google' },
        {
          link: 'https://discord.com',
          icon: 'https://cdn.prod.website-files.com/6257adef93867e50d84d30e2/6266bc493fb42d4e27bb8393_847541504914fd33810e70a0ea73177e.ico',
          name: 'Discord',
        },
        { link: 'https://youtube.com', icon: 'https://youtube.com/favicon.ico', name: 'YouTube' },
        { link: 'https://facebook.com', icon: 'https://facebook.com/favicon.ico', name: 'Facebook' },
      ];
    }
  }

  return out;
};

const getStoredOptions = () => {
  try {
    const stored = normalizeLegacyOptions(JSON.parse(localStorage.getItem('options') || '{}'));
    return { ...DEFAULT_OPTIONS, ...stored };
  } catch {
    return DEFAULT_OPTIONS;
  }
};

export const OptionsProvider = ({ children }) => {
  const [options, setOptions] = useState(getStoredOptions);

  useEffect(() => {
    const syncOptions = (event) => {
      if (event?.type === 'storage' && event.key && event.key !== 'options') return;
      setOptions(getStoredOptions());
    };

    window.addEventListener('ghost-options-updated', syncOptions);
    window.addEventListener('storage', syncOptions);

    return () => {
      window.removeEventListener('ghost-options-updated', syncOptions);
      window.removeEventListener('storage', syncOptions);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('options', JSON.stringify(options));
    } catch { }
  }, [options]);

  useEffect(() => {
    import('/src/utils/utils.js').then(({ ckOff }) => ckOff());
  }, [options.tabName, options.tabIcon, options.clkOff]);

  useEffect(() => {
    import('/src/utils/utils.js').then(({ applyBeforeUnload }) => {
      applyBeforeUnload(!!options.beforeUnload);
    });
  }, [options.beforeUnload]);

  const updateOption = useCallback((obj, immediate = true) => {
    if (!obj || typeof obj !== 'object') return;

    setOptions((prev) => {
      const updated = { ...prev, ...obj };

      try {
        localStorage.setItem('options', JSON.stringify(updated));
      } catch { }

      setTimeout(() => {
        window.dispatchEvent(new Event('ghost-options-updated'));
      }, 0);

      return immediate ? updated : prev;
    });
  }, []);

  const contextValue = useMemo(() => ({ options, updateOption }), [options, updateOption]);

  return <OptionsContext.Provider value={contextValue}>{children}</OptionsContext.Provider>;
};

export const useOptions = () => {
  const context = useContext(OptionsContext);
  if (!context) {
    throw new Error('useOptions must be used within an OptionsProvider');
  }
  return context;
};
