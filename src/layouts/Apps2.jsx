import Nav from '../layouts/Nav';
import { useState, useMemo, useEffect, useCallback, memo, useRef, lazy, Suspense } from 'react';
import { Search, LayoutGrid, ChevronLeft, ChevronRight, Play, Menu, ChevronDown, Check } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useOptions } from '/src/utils/optionsContext';
import styles from '../styles/apps.module.css';
import theme from '../styles/theming.module.css';
import clsx from 'clsx';
import gnmathCatalog from '/src/data/games/catalog/gnmath.json';
import petezahCatalog from '/src/data/games/catalog/petezah.json';
import interstellerCatalog from '/src/data/games/catalog/intersteller.json';
import g55msCatalog from '/src/data/games/catalog/55gms.json';
import spaceCatalog from '/src/data/games/catalog/space.json';
import truffledCatalog from '/src/data/games/catalog/truffled.json';
import seleniteCatalog from '/src/data/games/catalog/selenite.json';
import velaraCatalog from '/src/data/games/catalog/velara.json';
import gnportsCatalog from '/src/data/games/catalog/gnports.json';
import mirrorsCatalog from '/src/data/games/catalog/mirrors.json';
import nowggCatalog from '/src/data/games/catalog/nowgg.json';

const Pagination = lazy(() => import('@mui/material/Pagination'));
const RED_PLAY_ICON = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><circle cx="64" cy="64" r="62" fill="%23ef4444"/><polygon points="50,38 94,64 50,90" fill="white"/></svg>';
const YELLOW_PLAY_ICON = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><circle cx="64" cy="64" r="62" fill="%23facc15"/><polygon points="50,38 94,64 50,90" fill="white"/></svg>';
const WHITE_MUSIC_ICON = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';

const AppCard = memo(({ app, onClick, fallbackMap, onImgError, itemTheme, itemStyles, actionLabel = 'Play', options }) => {
  const [loaded, setLoaded] = useState(false);
  const isGhostIcon = app.icon && /ghost/i.test(String(app.icon));
  const hideIcon = (!isGhostIcon && !!options?.performanceMode) || !!app.noIcon;

  return (
    <div
      key={app.appName}
      className={clsx(
        'flex-shrink-0',
        itemStyles.app,
        itemTheme.appItemColor,
        itemTheme[`theme-${itemTheme.current || 'default'}`],
        'ghost-anim-card',
        app.disabled ? 'disabled cursor-not-allowed' : 'cursor-pointer',
      )}
      onClick={!app.disabled ? () => onClick(app) : undefined}
    >
      <div className="w-20 h-20 rounded-[12px] mb-4 overflow-hidden relative">
        {!hideIcon && !loaded && !fallbackMap[app.appName] && (
          <div className="absolute inset-0 bg-gray-700 animate-pulse" />
        )}
        {hideIcon || fallbackMap[app.appName] ? (
          <LayoutGrid className="w-full h-full" />
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
      <p className="text-m font-semibold mb-3 flex-grow line-clamp-2">{app.appName.split('').join('\u200B')}</p>
      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ffffff15] hover:bg-[#ffffff25] transition-colors text-sm font-medium mt-auto self-start">
        <Play size={16} fill="currentColor" />
        {actionLabel}
      </button>
    </div>
  );
});

const CategoryRow = memo(({ category, games, onClick, onViewMore, fallback, onImgError, theme, options, styles }) => {
  const ref = useRef(null);

  const scroll = (dir) => {
    if (ref.current) {
      ref.current.scrollBy({
        left: dir === 'left' ? -400 : 400,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="mb-3 max-w-7xl mx-auto px-9">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">{category}</h2>
          <button
            onClick={() => onViewMore(category)}
            className="text-xs px-3 py-1 rounded-full bg-[#ffffff10] hover:bg-[#ffffff18] transition-colors"
          >
            View more
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-full bg-[#ffffff10] hover:bg-[#ffffff18] transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-full bg-[#ffffff10] hover:bg-[#ffffff18] transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      <div
        ref={ref}
        className="flex gap-1 overflow-x-auto pb-2 -ml-3 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {games.map((game) => (
          <AppCard
            key={game.appName}
            app={game}
            onClick={onClick}
            fallbackMap={fallback}
            onImgError={onImgError}
            itemTheme={theme}
            itemStyles={styles}
            options={options}
          />
        ))}
      </div>
    </div>
  );
});

const GAME_SOURCE_CONFIG = [
  { key: 'gnmath', label: 'gn-math', type: 'mix', data: gnmathCatalog },
  { key: 'local', label: 'DogeUB', type: 'local', data: null },
  {
    key: 'petezah',
    label: 'Petezah',
    type: 'jsd',
    data: petezahCatalog,
    base: 'https://petezahgames.com',
  },
  {
    key: 'intersteller',
    label: 'Intersteller',
    type: 'jsd',
    data: interstellerCatalog,
    base: 'https://gointerstellar.app',
  },
  {
    key: '55gms',
    label: '55gms',
    type: 'jsd',
    data: g55msCatalog,
    base: 'https://55gms.com',
  },
  {
    key: 'space',
    label: 'Space',
    type: 'jsd',
    data: spaceCatalog,
    base: 'https://gointospace.app',
  },
  {
    key: 'truffled',
    label: 'Truffled',
    type: 'jsd',
    data: truffledCatalog,
    base: 'https://truffled.lol',
  },
  {
    key: 'selenite',
    label: 'Selenite',
    type: 'jsd',
    data: seleniteCatalog,
    base: 'https://selenite.cc/resources/semag',
  },
  {
    key: 'velara',
    label: 'Velara',
    type: 'jsd',
    data: velaraCatalog,
    base: 'https://velara.cc',
  },
  { key: 'gnports', label: 'gn-ports', type: 'jsd', data: gnportsCatalog },
  {
    key: 'nowgg',
    label: 'Now.GG',
    type: 'proxy',
    data: nowggCatalog,
    description: 'Now.GG bypass made by Froggies Arcade.',
  },
  { key: 'divider', label: '──────────', type: 'divider', data: null },
  {
    key: 'mirrors',
    label: 'Mirrors',
    type: 'proxy',
    data: mirrorsCatalog,
    description: "These games are mirrored and route through UV/Scramjet proxy flow. They may not function correctly.",
  },
  {
    key: 'geforcenow',
    label: 'GeForce Now',
    type: 'action',
    data: null,
    url: 'https://play.geforcenow.com',
  },
];

const ALASKA_BASE = 'https://alaskantires.lat';

const formatMB = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0.00MB';
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
};

const toDataDocUrl = (html) => `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;

const buildLoadingDoc = (name, loadedBytes = 0, totalBytes = 0) => {
  const totalLabel = totalBytes > 0 ? formatMB(totalBytes) : '...';
  const remainingLabel = totalBytes > 0 ? formatMB(Math.max(totalBytes - loadedBytes, 0)) : '...';
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Loading ${name}</title><style>html,body{height:100%;margin:0;background:#000;color:#fff;font-family:Inter,system-ui,sans-serif}.wrap{height:100%;display:flex;align-items:center;justify-content:center}.card{text-align:center}.logo{width:86px;height:86px;object-fit:contain;filter:invert(1) brightness(2);opacity:.95}.title{margin-top:14px;font-size:1.05rem;font-weight:600}.sub{margin-top:8px;font-size:.85rem;opacity:.78}</style></head><body><div class="wrap"><div class="card"><img class="logo" src="/ghost.png" alt="Ghost"/><div class="title">Loading...</div><div class="sub">${formatMB(loadedBytes)}/${remainingLabel} left</div><div class="sub" style="opacity:.55">Total: ${totalLabel}</div></div></div></body></html>`;
};

const isRawHtmlUrl = (url) => {
  try {
    const parsed = new URL(url, location.origin);
    return /\.html?$/i.test(parsed.pathname || '');
  } catch {
    return /\.html?($|\?)/i.test(String(url || ''));
  }
};

const toAbsolute = (raw, base = ALASKA_BASE) => {
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('/')) return `${base}${raw}`;
  return `${base}/${raw}`;
};

const normalizeSourceGames = (source) => {
  const data = source?.data;
  if (!Array.isArray(data)) return [];

  return data.map((item) => {
    const sourceBase = source?.base || ALASKA_BASE;
    const name = item.name || item.label || item.appName || 'Untitled Game';
    const cover = item.cover || item.icon || item.image || item.imageUrl || item.img || '';
    const rawUrl = item.url || item.link || '';
    const url = rawUrl.includes('{IP_BEGINNING}')
      ? rawUrl.replaceAll('{IP_BEGINNING}', 'nowgg')
      : toAbsolute(rawUrl, sourceBase);

    return {
      appName: name,
      desc: item.desc || item.description || source.label,
      icon: toAbsolute(cover, sourceBase),
      url,
      disabled: !url,
      noIcon: !cover,
      sourceType: source.type,
      sourceKey: source.key,
    };
  });
};

const Games = memo(() => {
  const nav = useNavigate();
  const { options } = useOptions();
  const [sourceKey, setSourceKey] = useState('gnmath');
  const [showAllGames, setShowAllGames] = useState(false);
  const [sortBy, setSortBy] = useState('name-asc');
  const [sortOpen, setSortOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const controlsRef = useRef(null);

  const [data, setData] = useState({});
  useEffect(() => {
    let a = true;
    import('../data/apps.json').then((m) => a && setData(m.default?.games || {}));
    return () => {
      a = false;
    };
  }, []);

  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState(null);
  const [fallback, setFallback] = useState({});
  const [dlCount, setDlCount] = useState(0);
  const [showDl, setShowDl] = useState(false);
  const [dlGames, setDlGames] = useState([]);
  const selectedSource = useMemo(
    () => GAME_SOURCE_CONFIG.find((s) => s.key === sourceKey) || GAME_SOURCE_CONFIG[0],
    [sourceKey],
  );
  const isLocalSource = selectedSource.key === 'local';

  const refreshDownloadedGames = useCallback(async () => {
    try {
      const m = await import('../utils/localGmLoader');
      const loader = new m.default();
      await loader.cleanupOld();
      const gms = await loader.getAllGms();
      setDlCount(gms.length);
      setDlGames(gms);
    } catch { }
  }, []);

  useEffect(() => {
    refreshDownloadedGames();
  }, [refreshDownloadedGames]);

  useEffect(() => {
    if (!isLocalSource || !showDl) return;
    refreshDownloadedGames();
  }, [isLocalSource, showDl, refreshDownloadedGames]);

  useEffect(() => {
    if (!isLocalSource) return;

    const refreshOnFocus = () => refreshDownloadedGames();
    const refreshOnVisible = () => {
      if (document.visibilityState === 'visible') refreshDownloadedGames();
    };

    window.addEventListener('focus', refreshOnFocus);
    document.addEventListener('visibilitychange', refreshOnVisible);

    return () => {
      window.removeEventListener('focus', refreshOnFocus);
      document.removeEventListener('visibilitychange', refreshOnVisible);
    };
  }, [isLocalSource, refreshDownloadedGames]);

  const perPage = options.itemsPerPage || 50;

  const all = useMemo(() => {
    const games = [];
    Object.values(data).forEach((cats) => {
      games.push(...cats);
    });
    return games;
  }, [data]);

  const filtered = useMemo(() => {
    if (showAllGames) {
      const sourceGames = GAME_SOURCE_CONFIG
        .filter((source) => source.type !== 'divider' && source.type !== 'action' && source.key !== 'local')
        .flatMap((source) => normalizeSourceGames(source));

      const localGames = all.map((game) => ({
        ...game,
        sourceType: 'local',
        sourceKey: 'local',
        disabled: !game.url,
      }));

      const qLower = q.toLowerCase().trim();
      let list = qLower
        ? [...localGames, ...sourceGames].filter((game) => game.appName.toLowerCase().includes(qLower))
        : [...localGames, ...sourceGames];

      switch (sortBy) {
        case 'name-desc':
          list = [...list].sort((a, b) => b.appName.localeCompare(a.appName));
          break;
        default:
          list = [...list].sort((a, b) => a.appName.localeCompare(b.appName));
      }

      const totalPages = Math.ceil(list.length / perPage);
      const paged = list.slice((page - 1) * perPage, page * perPage);
      return { filteredGames: list, paged, totalPages };
    }

    if (!isLocalSource) {
      const normalized = normalizeSourceGames(selectedSource);
      const qLower = q.toLowerCase().trim();
      let list = qLower
        ? normalized.filter((game) => game.appName.toLowerCase().includes(qLower))
        : normalized;

      switch (sortBy) {
        case 'name-desc':
          list = [...list].sort((a, b) => b.appName.localeCompare(a.appName));
          break;
        default:
          list = [...list].sort((a, b) => a.appName.localeCompare(b.appName));
      }

      const totalPages = Math.ceil(list.length / perPage);
      const paged = list.slice((page - 1) * perPage, page * perPage);
      return { filteredGames: list, paged, totalPages };
    }

    let toFilter = all;

    if (showDl) {
      const dlNames = new Set(dlGames.map(g => g.name));
      toFilter = all.filter(game => {
        const firstUrl = Array.isArray(game.url) ? game.url[0] : game.url;
        const gmName = firstUrl?.split('/').pop()?.replace('.zip', '');
        return gmName && dlNames.has(gmName);
      });
    } else if (category) {
      toFilter = data[category] || [];
    }

    if (q) {
      const fq = q.toLowerCase().trim();
      toFilter = toFilter.filter((game) => {
        const gameName = game.appName.toLowerCase();
        return gameName.includes(fq);
      });
    }

    const total = Math.ceil(toFilter.length / perPage);
    const paged = toFilter.slice((page - 1) * perPage, page * perPage);
    return { filteredGames: toFilter, paged, totalPages: total };
  }, [showAllGames, isLocalSource, selectedSource, sortBy, all, data, category, showDl, dlGames, q, page, perPage]);

  useEffect(() => {
    if (page > filtered.totalPages && filtered.totalPages > 0) setPage(1);
  }, [page, filtered.totalPages]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!controlsRef.current) return;
      if (!controlsRef.current.contains(event.target)) {
        setSourceOpen(false);
        setSortOpen(false);
      }
    };

    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const navApp = useCallback(
    (app) => {
      if (!app) return;
      const targetApp = showDl ? { ...app, local: true } : app;
      nav('/discover/r/', { state: { app: targetApp } });
    },
    [nav, showDl],
  );

  const handleSearch = useCallback((e) => {
    setQ(e.target.value);
    if (isLocalSource || showAllGames) setCategory(null);
    setPage(1);
  }, [isLocalSource, showAllGames]);

  const handleViewMore = useCallback((cat) => {
    setCategory(cat);
    setQ('');
    setPage(1);
  }, []);

  const handleBack = useCallback(() => {
    setCategory(null);
    setShowDl(false);
    setQ('');
    setPage(1);
  }, []);

  const handleViewDl = useCallback(() => {
    setShowDl(true);
    setCategory(null);
    setQ('');
    setPage(1);
  }, []);

  const handleImgError = useCallback(
    (name) => setFallback((prev) => ({ ...prev, [name]: true })),
    [],
  );

  const placeholder = useMemo(() => `Search ${all.length} games`, [all.length]);
  const sourcePlaceholder = useMemo(() => {
    if (isLocalSource) return placeholder;
    return `Search ${filtered.filteredGames.length} games`;
  }, [isLocalSource, placeholder, filtered.filteredGames.length]);

  const openSourceGame = useCallback(
    async (game) => {
      if (!game?.url) return;

      const topWin = (() => {
        try {
          return window.top && window.top !== window ? window.top : window;
        } catch {
          return window;
        }
      })();

      const opener = topWin.__ghostOpenBrowserTab;
      const updater = topWin.__ghostUpdateBrowserTabUrl;

      const openFallback = (url, skipProxy = false) => {
        nav('/search', {
          state: {
            url,
            openInGhostNewTab: true,
            skipProxy,
          },
        });
      };

      const isNowGG = game.sourceKey === 'nowgg';

      const hostedPathSources = new Set(['55gms', 'petezah', 'intersteller', 'space', 'truffled', 'selenite', 'velara']);
      const useRawHtmlLoader = isRawHtmlUrl(game.url) && !hostedPathSources.has(game.sourceKey);

      if (useRawHtmlLoader) {
        nav('/discover/r/', {
          state: {
            app: {
              appName: game.appName,
              desc: game.desc,
              icon: game.icon,
              url: game.url,
              renderAsHtml: true,
            },
          },
        });
        return;
      }

      const tabId = typeof opener === 'function'
        ? opener(game.url, {
          title: game.appName || 'New Tab',
          skipProxy: isNowGG,
        })
        : null;
      if (tabId && typeof updater === 'function') {
        updater(tabId, game.url, { skipProxy: isNowGG });
      } else {
        openFallback(game.url, isNowGG);
      }
    },
    [nav],
  );

  return (
    <div className={`${styles.appContainer} w-full mx-auto relative isolate`}>
      <div className="w-full px-4 py-4 flex justify-center mt-3 relative z-[70]">
        {isLocalSource && (category || showDl) && (
          <button
            onClick={handleBack}
            className="absolute cursor-pointer left-10 text-sm hover:opacity-80 transition-opacity whitespace-nowrap"
          >
            ← Back to all
          </button>
        )}
        <div
          ref={controlsRef}
          className="flex items-center gap-2 p-2 rounded-2xl border border-white/10 bg-[#0a0a0c]/95 backdrop-blur-md shadow-[0_12px_28px_rgba(0,0,0,0.38)]"
        >
          <div
            className={clsx(
              'relative flex items-center gap-2.5 rounded-[10px] px-3 w-[420px] h-11 border border-white/10 bg-[#111114]',
            )}
          >
            <Search className="w-4 h-4 shrink-0" />
            <input
              type="text"
              placeholder={sourcePlaceholder}
              value={q}
              onChange={handleSearch}
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setSourceOpen((prev) => !prev);
                setSortOpen(false);
              }}
              className="h-11 min-w-[180px] rounded-[10px] px-3 bg-[#141418] border border-white/10 text-sm flex items-center justify-between gap-3 hover:bg-[#1b1b21] transition-colors"
            >
              <span>{showAllGames ? 'All' : selectedSource.label}</span>
              <ChevronDown size={16} className={clsx('transition-transform', sourceOpen && 'rotate-180')} />
            </button>

            {sourceOpen && (
              <div className="absolute right-0 top-12 w-[440px] rounded-2xl border border-white/10 bg-[#111117] z-[80] overflow-hidden shadow-[0_14px_30px_rgba(0,0,0,0.4)] p-1.5">
                <div className="grid grid-cols-2 gap-x-1">
                  {GAME_SOURCE_CONFIG.map((source) => {
                    if (source.type === 'divider') {
                      return <div key={source.key} className="col-span-2 my-1 h-px bg-white/10" />;
                    }

                    const active = source.key === sourceKey;
                    return (
                      <button
                        key={source.key}
                        onClick={() => {
                          if (source.type === 'action' && source.url) {
                            const topWin = (() => {
                              try {
                                return window.top && window.top !== window ? window.top : window;
                              } catch {
                                return window;
                              }
                            })();
                            const opener = topWin.__ghostOpenBrowserTab;
                            if (typeof opener === 'function') {
                              const opened = opener(source.url, {
                                title: source.label || 'New Tab',
                                skipProxy: true,
                              });
                              if (!opened) {
                                nav('/search', {
                                  state: {
                                    url: source.url,
                                    openInGhostNewTab: true,
                                    skipProxy: true,
                                  },
                                });
                              }
                            } else {
                              nav('/search', {
                                state: {
                                  url: source.url,
                                  openInGhostNewTab: true,
                                  skipProxy: true,
                                },
                              });
                            }
                            setSourceOpen(false);
                            setSortOpen(false);
                            return;
                          }

                          setSourceKey(source.key);
                          setShowAllGames(false);
                          setCategory(null);
                          setShowDl(false);
                          setQ('');
                          setPage(1);
                          setSourceOpen(false);
                        }}
                        className={clsx(
                          'w-full h-10 rounded-lg px-2.5 text-sm flex items-center justify-between transition-colors',
                          active ? 'bg-[#ffffff18]' : 'hover:bg-[#ffffff10]',
                        )}
                      >
                        <span>{source.label}</span>
                        {active && <Check size={15} className="opacity-80" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {(!isLocalSource || showAllGames) && (
            <div className="relative">
              <button
                onClick={() => {
                  setSortOpen((prev) => !prev);
                  setSourceOpen(false);
                }}
                className="h-11 w-11 rounded-[10px] bg-[#141418] border border-white/10 flex items-center justify-center hover:bg-[#1b1b21] transition-colors"
                title="Sort"
              >
                <Menu size={17} />
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-12 w-52 rounded-md border border-white/10 bg-[#111117] z-[80] overflow-hidden">
                  <button
                    onClick={() => {
                      const next = !showAllGames;
                      setShowAllGames(next);
                      setCategory(null);
                      setShowDl(false);
                      setQ('');
                      setPage(1);
                      setSortOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-[#ffffff12] flex items-center justify-between"
                  >
                    <span>Show all games</span>
                    <span className={showAllGames ? 'text-emerald-300' : 'opacity-70'}>{showAllGames ? 'On' : 'Off'}</span>
                  </button>
                  <div className="h-px bg-white/10" />
                  {[
                    { key: 'name-asc', label: 'Name (A-Z)' },
                    { key: 'name-desc', label: 'Name (Z-A)' },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => {
                        setSortBy(opt.key);
                        setSortOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-[#ffffff12]"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {!showAllGames && !isLocalSource && selectedSource.description && (
        <div className="text-center text-xs opacity-70 pb-2" dangerouslySetInnerHTML={{ __html: selectedSource.description }} />
      )}

      {isLocalSource && showDl && (
        <div className="text-center text-xs opacity-60 pb-2">
          Local games not played for 3+ days are automatically removed
        </div>
      )}

      {isLocalSource && !category && !showDl && dlCount > 0 && (
        <div className="w-full flex justify-center pb-1">
          <button
            onClick={handleViewDl}
            className="cursor-pointer text-xs hover:opacity-80 transition-opacity whitespace-nowrap"
          >
            View Downloaded Games ({dlCount})
          </button>
        </div>
      )}

      {q || category || showDl || !isLocalSource ? (
        <>
          {isLocalSource && !showAllGames ? (
            <div className="flex flex-wrap justify-center pb-2">
              {filtered.paged.map((game) => (
                <AppCard
                  key={game.appName}
                  app={game}
                  onClick={navApp}
                  fallbackMap={fallback}
                  onImgError={handleImgError}
                  itemTheme={{ ...theme, current: options.theme || 'default' }}
                  itemStyles={styles}
                  options={options}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 px-6 pb-6">
              {filtered.paged.map((game) => (
                <button
                  key={`${game.sourceKey || selectedSource.key}-${game.appName}`}
                  onClick={() => {
                    if (game.sourceKey === 'local') {
                      navApp(game);
                      return;
                    }
                    openSourceGame(game);
                  }}
                  className="group relative rounded-2xl border border-white/12 bg-[#111a27] overflow-hidden aspect-[16/10] shadow-[0_8px_22px_rgba(0,0,0,0.24)] hover:shadow-[0_14px_30px_rgba(0,0,0,0.36)] hover:-translate-y-0.5 transition-all"
                >
                  {game.icon && !game.noIcon && (!options.performanceMode || /ghost/i.test(String(game.icon))) ? (
                    <img src={game.icon} alt={game.appName} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center px-2 text-center text-sm font-semibold opacity-90">
                      {game.appName}
                    </div>
                  )}
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-black/18 to-transparent opacity-95" />
                  <div className="absolute inset-x-0 bottom-0 bg-black/70 backdrop-blur-sm text-white text-xs px-3 py-2 translate-y-full group-hover:translate-y-0 transition-transform">
                    {game.appName}
                  </div>
                </button>
              ))}
            </div>
          )}

          {filtered.filteredGames.length > perPage && (
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
        </>
      ) : (
        <div className="space-y-2">
          {Object.entries(data).map(([cat, games]) => (
            <CategoryRow
              key={cat}
              category={cat}
              games={games}
              onClick={navApp}
              onViewMore={handleViewMore}
              fallback={fallback}
              onImgError={handleImgError}
              theme={{ ...theme, current: options.theme || 'default' }}
              options={options}
              styles={styles}
            />
          ))}
        </div>
      )}
    </div>
  );
});

Games.displayName = 'Games';

const TV_APPS = [
  {
    appName: 'Live TV/Sports',
    desc: 'Watch live TV channels and sports streams',
    icon: YELLOW_PLAY_ICON,
    url: 'https://thetvapp.to',
  },
  {
    appName: 'Anime',
    desc: 'Watch anime shows and movies',
    icon: 'https://www.google.com/s2/favicons?sz=128&domain=9animetv.to',
    url: 'https://9animetv.to',
  },
  {
    appName: 'General Movies/TV',
    desc: 'Browse movies and TV shows',
    icon: RED_PLAY_ICON,
    url: 'https://www.cineby.gd',
  },
  {
    appName: 'YouTube',
    desc: 'Watch videos, clips and streams',
    icon: 'https://www.google.com/s2/favicons?sz=128&domain=youtube.com',
    url: 'https://youtube.com',
  },
  {
    appName: 'Twitch',
    desc: 'Watch live streams',
    icon: 'https://www.google.com/s2/favicons?sz=128&domain=twitch.tv',
    url: 'https://twitch.tv',
  },
  {
    appName: 'TikTok',
    desc: 'Short videos and trends',
    icon: 'https://www.google.com/s2/favicons?sz=128&domain=tiktok.com',
    url: 'https://www.tiktok.com',
  },
];

const GHOST_MUSIC_APPS = [
  { appName: 'Monochrome', desc: 'Monochrome music player', icon: WHITE_MUSIC_ICON, url: 'https://monochrome.tf', playerKey: 'monochrome', isMusicProvider: true },
];

const THIRD_PARTY_MUSIC_APPS = [
  { appName: 'Spotify', desc: 'Music and podcasts', icon: 'https://www.google.com/s2/favicons?sz=128&domain=spotify.com', url: 'https://open.spotify.com', playerKey: 'spotify', isMusicProvider: true },
  { appName: 'Apple Music', desc: 'Stream songs and albums', icon: 'https://www.google.com/s2/favicons?sz=128&domain=music.apple.com', url: 'https://music.apple.com', playerKey: 'apple-music', isMusicProvider: true },
  { appName: 'Amazon Music', desc: 'Amazon music service', icon: 'https://www.google.com/s2/favicons?sz=128&domain=music.amazon.com', url: 'https://music.amazon.com', playerKey: 'amazon-music', isMusicProvider: true },
  { appName: 'YouTube Music', desc: 'YouTube music streaming', icon: 'https://www.google.com/s2/favicons?sz=128&domain=music.youtube.com', url: 'https://music.youtube.com', playerKey: 'youtube-music', isMusicProvider: true },
  { appName: 'Tidal', desc: 'HiFi music and playlists', icon: 'https://www.google.com/s2/favicons?sz=128&domain=tidal.com', url: 'https://tidal.com', playerKey: 'tidal', isMusicProvider: true },
  { appName: 'Deezer', desc: 'Music on demand', icon: 'https://www.google.com/s2/favicons?sz=128&domain=deezer.com', url: 'https://www.deezer.com', playerKey: 'deezer', isMusicProvider: true },
  { appName: 'SoundCloud', desc: 'Independent music platform', icon: 'https://www.google.com/s2/favicons?sz=128&domain=soundcloud.com', url: 'https://soundcloud.com', playerKey: 'soundcloud', isMusicProvider: true },
  { appName: 'Pandora', desc: 'Personalized radio', icon: 'https://www.google.com/s2/favicons?sz=128&domain=pandora.com', url: 'https://www.pandora.com', playerKey: 'pandora', isMusicProvider: true },
  { appName: 'Qobuz', desc: 'Hi-res music streaming', icon: 'https://www.google.com/s2/favicons?sz=128&domain=qobuz.com', url: 'https://www.qobuz.com', playerKey: 'qobuz', isMusicProvider: true },
];

const ExternalAppsGrid = memo(({ items, onClick, options, fallback, onImgError, actionLabel = 'Play', title }) => {
  return (
    <div className="w-full mx-auto px-6 pt-5">
      {title && <h3 className="text-xl font-semibold text-center mb-3">{title}</h3>}
      <div className="flex flex-wrap justify-center pb-2">
        {items.map((item) => (
          <AppCard
            key={item.appName}
            app={item}
            onClick={onClick}
            fallbackMap={fallback}
            onImgError={onImgError}
            itemTheme={{ ...theme, current: options.theme || 'default' }}
            itemStyles={styles}
            actionLabel={actionLabel}
            options={options}
          />
        ))}
      </div>
    </div>
  );
});

ExternalAppsGrid.displayName = 'ExternalAppsGrid';

const GamesLayout = () => {
  const { options } = useOptions();
  const location = useLocation();
  const nav = useNavigate();
  const [tab, setTab] = useState('games');
  const [fallback, setFallback] = useState({});
  const inGhostBrowserMode = new URLSearchParams(location.search).get('ghost') === '1';

  useEffect(() => {
    const qTab = (new URLSearchParams(location.search).get('tab') || '').toLowerCase();
    if (qTab === 'games' || qTab === 'tv' || qTab === 'music') {
      setTab(qTab);
    }
  }, [location.search]);

  const handleImgError = useCallback((name) => {
    setFallback((prev) => ({ ...prev, [name]: true }));
  }, []);

  const openInNewGhostTab = useCallback(
    (app) => {
      if (!app?.url) return;
      const topWin = (() => {
        try {
          return window.top && window.top !== window ? window.top : window;
        } catch {
          return window;
        }
      })();
      const opener = topWin.__ghostOpenBrowserTab;
      if (typeof opener === 'function') {
        const opened = opener(app.url, {
          title: app.appName || 'New Tab',
          askDefaultMusicPrompt: !!app.isMusicProvider,
          musicProviderKey: app.playerKey || '',
          musicProviderName: app.appName || '',
        });
        if (opened) return;
      }

      nav('/search', {
        state: {
          url: app.url,
          openInGhostNewTab: true,
          askDefaultMusicPrompt: !!app.isMusicProvider,
          musicProviderKey: app.playerKey || '',
          musicProviderName: app.appName || '',
        },
      });
    },
    [nav],
  );

  const scrollCls = clsx(
    'scrollbar scrollbar-thin scrollbar-track-transparent',
    !options?.type || options.type === 'dark'
      ? 'scrollbar-thumb-gray-600'
      : 'scrollbar-thumb-gray-500',
  );

  const allMusicApps = useMemo(
    () => [...GHOST_MUSIC_APPS, ...THIRD_PARTY_MUSIC_APPS],
    [],
  );

  const defaultMusicPlayerKey = String(options.defaultMusicPlayer || 'monochrome').toLowerCase();
  const topMusicApps = useMemo(() => {
    const selected = allMusicApps.find((app) => app.playerKey === defaultMusicPlayerKey) || allMusicApps[0];
    return selected ? [selected] : [];
  }, [allMusicApps, defaultMusicPlayerKey]);

  const otherMusicApps = useMemo(
    () => allMusicApps.filter((app) => app.playerKey !== topMusicApps[0]?.playerKey),
    [allMusicApps, topMusicApps],
  );

  return (
    <div className="flex flex-col h-[100dvh] min-h-0 overflow-hidden">
      {!inGhostBrowserMode && <Nav />}
      <div className={clsx('flex-1 min-h-0 overflow-y-scroll', scrollCls)}>
        <div className="w-full flex justify-center pt-6 px-4">
          <div className="flex items-center gap-2 rounded-xl p-1 bg-[#ffffff10]">
            {[
              { key: 'games', label: 'Games' },
              { key: 'tv', label: 'TV' },
              { key: 'music', label: 'Music' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={clsx(
                  'px-4 py-2 rounded-lg text-sm cursor-pointer transition-colors',
                  tab === item.key ? 'bg-[#ffffff24] font-semibold' : 'hover:bg-[#ffffff18]',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {tab === 'games' && <Games />}
        {tab === 'tv' && (
          <>
            <ExternalAppsGrid
              items={TV_APPS.slice(0, 3)}
              onClick={openInNewGhostTab}
              options={options}
              fallback={fallback}
              onImgError={handleImgError}
              actionLabel="Watch"
            />
            <ExternalAppsGrid
              items={TV_APPS.slice(3)}
              onClick={openInNewGhostTab}
              options={options}
              fallback={fallback}
              onImgError={handleImgError}
              actionLabel="Watch"
            />
          </>
        )}
        {tab === 'music' && (
          <>
            <ExternalAppsGrid
              items={topMusicApps}
              onClick={openInNewGhostTab}
              options={options}
              fallback={fallback}
              onImgError={handleImgError}
              actionLabel="Listen"
              title="Default Player"
            />
            <ExternalAppsGrid
              items={otherMusicApps}
              onClick={openInNewGhostTab}
              options={options}
              fallback={fallback}
              onImgError={handleImgError}
              actionLabel="Listen"
              title="Third Party"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default GamesLayout;
