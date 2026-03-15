import Nav from '../layouts/Nav';
import { useState, useMemo, useEffect, useCallback, memo, lazy, Suspense } from 'react';
import { Search, LayoutGrid, Plus, X, Hammer } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useOptions } from '/src/utils/optionsContext';
import { showConfirm } from '/src/utils/uiDialog';
import { createId } from '/src/utils/id';
import styles from '../styles/apps.module.css';
import theme from '../styles/theming.module.css';
import clsx from 'clsx';

const Pagination = lazy(() => import('@mui/material/Pagination'));
const CUSTOM_APPS_KEY = 'ghostCustomApps';
const NO_ICON_APPS = new Set(['Google Drive', 'eBay', 'Best Buy', 'Epic Games', 'WhatsApp']);
const MODAL_TRANSITION_MS = 180;

const usePopupTransition = (open) => {
  const [rendered, setRendered] = useState(open);
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) {
      setRendered(true);
      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setVisible(true));
      });
      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }

    setVisible(false);
    const timer = window.setTimeout(() => setRendered(false), MODAL_TRANSITION_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  return { rendered, visible };
};

const REQUIRED_APPS = [
  {
    appName: 'LinkedIn',
    desc: 'Professional networking and jobs.',
    icon: 'https://www.google.com/s2/favicons?sz=128&domain=linkedin.com',
    url: 'https://www.linkedin.com',
    disabled: false,
  },
  {
    appName: 'WhatsApp',
    desc: 'Messaging in the browser.',
    icon: 'https://www.google.com/s2/favicons?sz=128&domain=web.whatsapp.com',
    url: 'https://web.whatsapp.com',
    disabled: false,
  },
  {
    appName: 'Telegram',
    desc: 'Cloud messaging app.',
    icon: 'https://www.google.com/s2/favicons?sz=128&domain=web.telegram.org',
    url: 'https://web.telegram.org',
    disabled: false,
  },
  {
    appName: 'Netflix',
    desc: 'Movies and shows.',
    icon: 'https://www.google.com/s2/favicons?sz=128&domain=netflix.com',
    url: 'https://www.netflix.com',
    disabled: false,
  },
  {
    appName: 'Hulu',
    desc: 'TV and streaming.',
    icon: 'https://www.google.com/s2/favicons?sz=128&domain=hulu.com',
    url: 'https://www.hulu.com',
    disabled: false,
  },
  {
    appName: 'Disney+',
    desc: 'Disney and Marvel streaming.',
    icon: 'https://www.google.com/s2/favicons?sz=128&domain=disneyplus.com',
    url: 'https://www.disneyplus.com',
    disabled: false,
  },
  {
    appName: 'Prime Video',
    desc: 'Amazon video streaming.',
    icon: 'https://www.google.com/s2/favicons?sz=128&domain=primevideo.com',
    url: 'https://www.primevideo.com',
    disabled: false,
  },
  {
    appName: 'YouTube Music',
    desc: 'Music videos and playlists.',
    icon: 'https://www.google.com/s2/favicons?sz=128&domain=music.youtube.com',
    url: 'https://music.youtube.com',
    disabled: false,
  },
  {
    appName: 'SoundCloud',
    desc: 'Music and audio platform.',
    icon: 'https://www.google.com/s2/favicons?sz=128&domain=soundcloud.com',
    url: 'https://soundcloud.com',
    disabled: false,
  },
  {
    appName: 'PayPal',
    desc: 'Payments and transfers.',
    icon: 'https://www.google.com/s2/favicons?sz=128&domain=paypal.com',
    url: 'https://www.paypal.com',
    disabled: false,
  },
  {
    appName: 'AliExpress',
    desc: 'Global online shopping.',
    icon: 'https://www.google.com/s2/favicons?sz=128&domain=aliexpress.com',
    url: 'https://www.aliexpress.com',
    disabled: false,
  },
  {
    appName: 'Best Buy',
    desc: 'Electronics and tech shopping.',
    icon: 'https://www.google.com/s2/favicons?sz=128&domain=bestbuy.com',
    url: 'https://www.bestbuy.com',
    disabled: false,
  },
  {
    appName: 'Target',
    desc: 'Retail and groceries.',
    icon: 'https://www.google.com/s2/favicons?sz=128&domain=target.com',
    url: 'https://www.target.com',
    disabled: false,
  },
  {
    appName: 'Office 365',
    desc: 'Microsoft Office web apps.',
    icon: 'https://www.google.com/s2/favicons?sz=128&domain=office.com',
    url: 'https://www.office.com',
    disabled: false,
  },
  {
    appName: 'Google Drive',
    desc: 'Cloud files and docs.',
    icon: 'https://www.google.com/s2/favicons?sz=128&domain=drive.google.com',
    url: 'https://drive.google.com',
    disabled: false,
  },
  {
    appName: 'Canva',
    desc: 'Design and presentations.',
    icon: 'https://www.google.com/s2/favicons?sz=128&domain=canva.com',
    url: 'https://www.canva.com',
    disabled: false,
  },
  {
    appName: 'Notion',
    desc: 'Docs and productivity workspace.',
    icon: 'https://www.google.com/s2/favicons?sz=128&domain=notion.so',
    url: 'https://www.notion.so',
    disabled: false,
  },
  {
    appName: 'Facebook',
    desc: 'Connect with friends and communities.',
    icon: 'https://www.google.com/s2/favicons?sz=128&domain=facebook.com',
    url: 'https://facebook.com',
    disabled: false,
  },
  {
    appName: 'TikTok',
    desc: 'Short videos and trends.',
    icon: 'https://www.google.com/s2/favicons?sz=128&domain=tiktok.com',
    url: 'https://www.tiktok.com',
    disabled: false,
  },
  {
    appName: 'Steam',
    desc: 'PC games and community.',
    icon: 'https://www.google.com/s2/favicons?sz=128&domain=store.steampowered.com',
    url: 'https://store.steampowered.com',
    disabled: false,
  },
  {
    appName: 'Epic Games',
    desc: 'Games launcher and store.',
    icon: 'https://www.google.com/s2/favicons?sz=128&domain=epicgames.com',
    url: 'https://store.epicgames.com',
    disabled: false,
  },
  {
    appName: 'Walmart',
    desc: 'Shopping and delivery.',
    icon: 'https://www.google.com/s2/favicons?sz=128&domain=walmart.com',
    url: 'https://www.walmart.com',
    disabled: false,
  },
  {
    appName: 'eBay',
    desc: 'Buy and sell online.',
    icon: 'https://www.google.com/s2/favicons?sz=128&domain=ebay.com',
    url: 'https://www.ebay.com',
    disabled: false,
  },
  {
    appName: 'Spotify',
    desc: 'Music streaming and playlists.',
    icon: 'https://www.google.com/s2/favicons?sz=128&domain=spotify.com',
    url: 'https://open.spotify.com',
    disabled: false,
  },
  {
    appName: 'Apple Music',
    desc: 'Stream songs and albums.',
    icon: 'https://www.google.com/s2/favicons?sz=128&domain=music.apple.com',
    url: 'https://music.apple.com',
    disabled: false,
  },
];

const DEVELOPER_APPS = [
  {
    appName: 'Code Runner',
    desc: 'Run local HTML, CSS, and JavaScript projects.',
    icon: '',
    url: 'ghost://code',
    disabled: false,
    noIcon: true,
  },
];

const AppCard = memo(({ app, onClick, fallbackMap, onImgError, itemTheme, itemStyles, onDelete, options }) => {
  const [loaded, setLoaded] = useState(false);
  const isGhostIcon = app.icon && /ghost/i.test(String(app.icon));
  const hideIcon = (!isGhostIcon && !!options?.performanceMode) || !!app.noIcon;

  return (
    <div
      key={app.appName}
      className={clsx(
        itemStyles.app,
        itemTheme.appItemColor,
        itemTheme[`theme-${itemTheme.current || 'default'}`],
        'relative ghost-anim-card',
        app.disabled ? 'disabled cursor-not-allowed' : 'cursor-pointer',
      )}
      onClick={!app.disabled ? () => onClick(app) : undefined}
    >
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(app);
          }}
          className="absolute top-2 right-3 p-1.5 rounded-md bg-[#00000040] hover:bg-[#00000066]"
          aria-label={`Delete ${app.appName}`}
        >
          <X size={14} />
        </button>
      )}
      <div className="w-20 h-20 rounded-[12px] mb-4 overflow-hidden relative">
        {!hideIcon && !loaded && !fallbackMap[app.appName] && (
          <div className="absolute inset-0 bg-gray-700 animate-pulse" />
        )}
        {hideIcon || fallbackMap[app.appName] ? (
          app.appName === 'Code Runner' ? <Hammer className="w-full h-full p-2" /> : <LayoutGrid className="w-full h-full" />
        ) : (
          <img
            src={app.icon && String(app.icon).includes('placeholder.com') ? '' : app.icon}
            draggable="false"
            loading="lazy"
            className="w-full h-full object-cover"
            onLoad={() => setLoaded(true)}
            onError={() => onImgError(app.appName)}
          />
        )}
      </div>
      <p className="text-m font-semibold">{app.appName.split('').join('\u200B')}</p>
      <p className="text-sm mt-2">{(app.desc || '').split('').join('\u200B')}</p>
    </div>
  );
});

const PlusCard = memo(({ onClick, itemTheme, itemStyles }) => (
  <div
    className={clsx(
      itemStyles.app,
      itemTheme.appItemColor,
      itemTheme[`theme-${itemTheme.current || 'default'}`],
      'cursor-pointer ghost-anim-card',
    )}
    onClick={onClick}
  >
    <div className="w-20 h-20 rounded-[12px] mb-4 overflow-hidden relative bg-[#ffffff14] flex items-center justify-center">
      <Plus size={38} />
    </div>
    <p className="text-m font-semibold">Add Custom App</p>
    <p className="text-sm mt-2">Create your own app card</p>
  </div>
));

const DeveloperToggleCard = memo(({ enabled, onToggle, itemTheme, itemStyles }) => (
  <div
    className={clsx(
      itemStyles.app,
      itemTheme.appItemColor,
      itemTheme[`theme-${itemTheme.current || 'default'}`],
      'cursor-pointer ghost-anim-card border border-white/10',
      enabled && 'ring-1 ring-white/40',
    )}
    onClick={onToggle}
  >
    <div className="w-20 h-20 rounded-[12px] mb-4 overflow-hidden relative bg-[#ffffff14] flex items-center justify-center">
      <Hammer size={34} />
    </div>
    <p className="text-m font-semibold">Developer Apps</p>
    <p className="text-sm mt-2">Press to only view developer apps.</p>
  </div>
));

const Apps = memo(() => {
  const nav = useNavigate();
  const { options } = useOptions();

  const [appsList, setAppsList] = useState([]);
  const [customApps, setCustomApps] = useState([]);
  const [customName, setCustomName] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customIcon, setCustomIcon] = useState('');
  const [showCustomModal, setShowCustomModal] = useState(false);

  useEffect(() => {
    let a = true;
    import('../data/apps.json').then((m) => a && setAppsList(m.default?.apps || []));
    return () => {
      a = false;
    };
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_APPS_KEY);
      const parsed = JSON.parse(raw || '[]');
      if (Array.isArray(parsed)) {
        setCustomApps(
          parsed.map((app) => ({
            ...app,
            isCustom: true,
            customId: app.customId || createId(),
            noIcon: !!app.noIcon || !String(app.icon || '').trim(),
          })),
        );
      }
    } catch { }
  }, []);

  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [fallback, setFallback] = useState({});
  const [developerOnly, setDeveloperOnly] = useState(false);
  const customModal = usePopupTransition(showCustomModal);

  const perPage = options.itemsPerPage || 50;

  const visibleApps = useMemo(() => {
    const existing = [...appsList, ...customApps]
      .filter((app) => app?.appName && app?.url)
      .filter((app) => app.appName.toLowerCase() !== 'movies/tv');

    const existingNames = new Set(existing.map((app) => app.appName.toLowerCase()));
    const missingRequired = REQUIRED_APPS.filter(
      (app) => !existingNames.has(app.appName.toLowerCase()),
    );

    return [...existing, ...missingRequired].map((app) => ({
      ...app,
      noIcon: !!app.noIcon || NO_ICON_APPS.has(app.appName),
    }));
  }, [appsList, customApps]);

  const indexedApps = useMemo(() => visibleApps.map((a, i) => ({ ...a, __i: i })), [visibleApps]);

  const sourceApps = useMemo(() => (developerOnly ? DEVELOPER_APPS : indexedApps), [developerOnly, indexedApps]);

  const sortedApps = useMemo(
    () => {
      const custom = sourceApps.filter((app) => app.isCustom);
      const rest = sourceApps
        .filter((app) => !app.isCustom)
        .sort(
          (a, b) =>
            (a.desc || '').localeCompare(b.desc || '', undefined, { sensitivity: 'base' }) ||
            a.appName.localeCompare(b.appName, undefined, { sensitivity: 'base' }),
        );

      return [...custom, ...rest];
    },
    [sourceApps],
  );

  const filtered = useMemo(() => {
    const fq = q.toLowerCase();
    const filteredApps = sortedApps.filter((a) => a.appName.toLowerCase().includes(fq));
    const totalPages = Math.ceil(filteredApps.length / perPage);
    const paged = filteredApps.slice((page - 1) * perPage, page * perPage);
    return { filteredApps, paged, totalPages };
  }, [sortedApps, q, page, perPage]);

  useEffect(() => {
    if (page > filtered.totalPages && filtered.totalPages > 0) setPage(1);
  }, [page, filtered.totalPages]);

  const navApp = useCallback(
    (app) => {
      if (!app) return;
      const topWin = (() => {
        try {
          return window.top && window.top !== window ? window.top : window;
        } catch {
          return window;
        }
      })();
      const opener = topWin.__ghostOpenBrowserTab;
      if (typeof opener === 'function') {
        const opened = opener(app.url, { skipProxy: true, title: app.appName || 'New Tab' });
        if (opened) return;
      }

      const nativeOpened = window.open(app.url, '_blank', 'noopener,noreferrer');
      if (nativeOpened) return;

      nav("/search", {
        state: {
          url: app.url,
          openInGhostNewTab: !!options.openLinkInNewTab,
          skipProxy: true,
        }
      });
    },
    [nav],
  );

  const handleSearch = useCallback((e) => {
    setQ(e.target.value);
    setPage(1);
  }, []);

  const handleImgError = useCallback(
    (name) => setFallback((prev) => ({ ...prev, [name]: true })),
    [],
  );

  const saveCustomApps = useCallback((next) => {
    setCustomApps(next);
    try {
      localStorage.setItem(CUSTOM_APPS_KEY, JSON.stringify(next));
    } catch { }
  }, []);

  const addCustomApp = useCallback(() => {
    const appName = customName.trim();
    const rawUrl = customUrl.trim();
    if (!appName || !rawUrl) return;

    const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    const icon = customIcon.trim();
    const useDefaultGridIcon = !icon;

    const next = [
      {
        customId: createId(),
        isCustom: true,
        appName,
        url,
        icon,
        noIcon: useDefaultGridIcon,
        desc: customDesc.trim() || 'Custom app',
        disabled: false,
      },
      ...customApps,
    ];

    saveCustomApps(next);
    setCustomName('');
    setCustomUrl('');
    setCustomDesc('');
    setCustomIcon('');
    setShowCustomModal(false);
  }, [customName, customUrl, customDesc, customIcon, customApps, saveCustomApps]);

  const removeCustomApp = useCallback(
    async (app) => {
      if (!app?.isCustom) return;
      const ok = await showConfirm(`Delete custom app "${app.appName}"?`, 'Delete Custom App');
      if (!ok) return;
      const next = customApps.filter((item) => item.customId !== app.customId);
      saveCustomApps(next);
    },
    [customApps, saveCustomApps],
  );

  const searchBarCls = useMemo(
    () => clsx(theme.appsSearchColor, theme[`theme-${options.theme || 'default'}`]),
    [options.theme],
  );

  const placeholder = useMemo(() => `Search ${visibleApps.length} apps`, [visibleApps.length]);
  const isLightTheme =
    options.type === 'light' ||
    options.theme === 'light' ||
    options.themeName === 'light';
  const formCanSave = customName.trim().length > 0 && customUrl.trim().length > 0;
  const modalSurfaceStyle = useMemo(
    () => ({
      backgroundColor: options.quickModalBgColor || options.menuColor || (isLightTheme ? '#f8fafc' : '#101722'),
      color: options.siteTextColor || (isLightTheme ? '#0f172a' : '#dbe7f5'),
      borderColor: isLightTheme ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.12)',
      boxShadow: isLightTheme
        ? '0 30px 80px rgba(15, 23, 42, 0.18)'
        : '0 34px 90px rgba(0, 0, 0, 0.42)',
    }),
    [options.quickModalBgColor, options.menuColor, options.siteTextColor, isLightTheme],
  );
  const modalFieldStyle = useMemo(
    () => ({
      backgroundColor: isLightTheme ? 'rgba(255, 255, 255, 0.82)' : 'rgba(255, 255, 255, 0.05)',
      borderColor: isLightTheme ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.1)',
    }),
    [isLightTheme],
  );
  const modalSecondaryButtonStyle = useMemo(
    () => ({
      backgroundColor: isLightTheme ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255, 255, 255, 0.06)',
      borderColor: isLightTheme ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.1)',
      color: options.siteTextColor || (isLightTheme ? '#0f172a' : '#dbe7f5'),
    }),
    [options.siteTextColor, isLightTheme],
  );
  const modalPrimaryButtonStyle = useMemo(
    () => ({
      backgroundColor: '#ffffff',
      color: '#0f172a',
    }),
    [],
  );

  return (
    <div className={`${styles.appContainer} w-full mx-auto`}>
      <div className="w-full px-4 py-4 flex justify-center mt-3">
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              'relative flex items-center gap-2.5 rounded-[10px] px-3 w-[600px] h-11',
              searchBarCls,
            )}
          >
            <Search className="w-4 h-4 shrink-0" />
            <input
              type="text"
              placeholder={placeholder}
              value={q}
              onChange={handleSearch}
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>
          <button
            onClick={() => setShowCustomModal(true)}
            className="h-11 px-4 rounded-lg bg-[#ffffff18] hover:bg-[#ffffff28] transition-colors text-sm cursor-pointer"
          >
            Create Custom App
          </button>
        </div>
      </div>

      <div className="flex flex-wrap justify-center pb-2">
        {page === 1 && !q && (
          <DeveloperToggleCard
            enabled={developerOnly}
            onToggle={() => {
              setDeveloperOnly((prev) => !prev);
              setPage(1);
            }}
            itemTheme={{ ...theme, current: options.theme || 'default' }}
            itemStyles={styles}
          />
        )}
        {filtered.paged.map((app) => (
          <AppCard
            key={app.customId || app.appName}
            app={app}
            onClick={navApp}
            fallbackMap={fallback}
            onImgError={handleImgError}
            itemTheme={{ ...theme, current: options.theme || 'default' }}
            itemStyles={styles}
            onDelete={app.isCustom ? removeCustomApp : null}
            options={options}
          />
        ))}
        {!developerOnly && (
          <PlusCard
            onClick={() => setShowCustomModal(true)}
            itemTheme={{ ...theme, current: options.theme || 'default' }}
            itemStyles={styles}
          />
        )}
      </div>

      {customModal.rendered && (
        <div
          className={clsx(
            'fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-opacity duration-[220ms] ease-out',
            customModal.visible ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
        >
          <div
            className={clsx(
              'absolute inset-0 bg-black/55 backdrop-blur-[2px] transition-opacity duration-[220ms] ease-out',
              customModal.visible ? 'opacity-100' : 'opacity-0',
            )}
            onClick={() => setShowCustomModal(false)}
          />
          <div
            className={clsx(
              'relative w-full max-w-2xl rounded-[28px] border px-5 py-5 md:px-6 md:py-6 backdrop-blur-xl transform-gpu transition-all duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
              customModal.visible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-3 scale-[0.98] opacity-0',
            )}
            style={modalSurfaceStyle}
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-xl font-semibold tracking-tight">Create Custom App</h3>
                <p className="text-sm opacity-70 mt-1">
                  Add a site you use often.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-colors"
                style={modalSecondaryButtonStyle}
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <input
                type="text"
                placeholder="App Name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="h-11 rounded-2xl border px-3.5 outline-none text-sm placeholder:opacity-60"
                style={modalFieldStyle}
              />
              <input
                type="text"
                placeholder="URL"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="h-11 rounded-2xl border px-3.5 outline-none text-sm placeholder:opacity-60"
                style={modalFieldStyle}
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={customDesc}
                onChange={(e) => setCustomDesc(e.target.value)}
                className="h-11 rounded-2xl border px-3.5 outline-none text-sm placeholder:opacity-60"
                style={modalFieldStyle}
              />
              <input
                type="text"
                placeholder="Icon URL (optional)"
                value={customIcon}
                onChange={(e) => setCustomIcon(e.target.value)}
                className="h-11 rounded-2xl border px-3.5 outline-none text-sm placeholder:opacity-60"
                style={modalFieldStyle}
              />
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm opacity-70">
              
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="h-10 px-4 rounded-2xl border text-sm transition-colors"
                  style={modalSecondaryButtonStyle}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={addCustomApp}
                  disabled={!formCanSave}
                  className="h-10 px-4 rounded-2xl text-sm font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-45"
                  style={modalPrimaryButtonStyle}
                >
                  Create App
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {filtered.filteredApps.length > perPage && (
        <div className="flex flex-col items-center pb-7">
          <Suspense>
            <Pagination
              count={filtered.totalPages}
              page={page}
              onChange={(_, v) => setPage(v)}
              shape="rounded"
              variant="outlined"
              sx={{
                '& .MuiPaginationItem-root': {
                  color: options.paginationTextColor || '#9baec8',
                  borderColor: options.paginationBorderColor || '#ffffff1c',
                  backgroundColor: options.paginationBgColor || '#141d2b',
                  fontFamily: 'SFProText',
                },
                '& .Mui-selected': {
                  backgroundColor: `${options.paginationSelectedColor || '#75b3e8'} !important`,
                  color: '#fff !important',
                },
              }}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
});

Apps.displayName = 'Apps';

const AppLayout = () => {
  const { options } = useOptions();
  const location = useLocation();
  const inGhostBrowserMode = new URLSearchParams(location.search).get('ghost') === '1';
  const scrollCls = clsx(
    'scrollbar scrollbar-thin scrollbar-track-transparent',
    !options?.type || options.type === 'dark'
      ? 'scrollbar-thumb-gray-600'
      : 'scrollbar-thumb-gray-500',
  );

  return (
    <div className="flex flex-col h-full">
      {!inGhostBrowserMode && <Nav />}
      <div className={clsx('flex-1 overflow-y-auto', scrollCls)}>
        <Apps />
      </div>
    </div>
  );
};

export default AppLayout;
