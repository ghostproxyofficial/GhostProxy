import Tabs from '/src/components/loader/Tabs';
import Omnibox from '/src/components/loader/Omnibox';
import Viewer from '/src/components/loader/Viewer';
import Menu from '/src/components/loader/Menu';
import useReg from '/src/utils/hooks/loader/useReg';
import loaderStore from '/src/utils/hooks/loader/useLoaderStore';
import { process } from '/src/utils/hooks/loader/utils';
import { useOptions } from '../utils/optionsContext';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { getEffectiveShortcuts, eventToShortcut, isTypingTarget } from '/src/utils/shortcuts';
import {
  Battery,
  Blocks,
  Bot,
  Book,
  BookOpen,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Code2,
  ChevronDown,
  ChevronUp,
  Gamepad2,
  History,
  Monitor,
  Music,
  Settings,
  ShieldMinus,
  Sparkles,
  Sun,
  TvMinimalPlay,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { createId } from '/src/utils/id';
import { showAlert, showConfirm } from '/src/utils/uiDialog';
import changelogEntries from '/src/data/changelog.json';
import Discord from '/src/components/Discord';
import { getLucideIcon } from '/src/components/settings/components/SidebarEditor';

const SAVED_TABS_KEY = 'ghostSavedTabs';
const SITE_POLICY_KEY = 'ghostSitePolicies';

const getSitePolicies = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(SITE_POLICY_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const setSitePolicies = (next) => {
  try {
    localStorage.setItem(SITE_POLICY_KEY, JSON.stringify(next || {}));
  } catch { }
  window.dispatchEvent(new Event('ghost-site-policies-updated'));
};

const sanitizeHydratedUrl = (raw) => {
  const value = String(raw || '').trim();
  if (!value) return 'tabs://new';

  if (
    value === 'tabs://new' ||
    value.startsWith('tabs://') ||
    value.startsWith('data:') ||
    value.startsWith('blob:') ||
    value.startsWith('about:')
  ) {
    return value;
  }

  if (/\/uv\/service\//.test(value) || /\/scramjet\//.test(value)) {
    return value;
  }

  try {
    const parsed = new URL(value, location.origin);
    if (parsed.origin === location.origin) return parsed.toString();
  } catch { }

  let opts = {};
  try {
    opts = JSON.parse(localStorage.getItem('options') || '{}');
  } catch { }

  return process(value, false, opts.prType || 'auto', opts.engine || null);
};

const SidebarButton = ({ label, onClick, children, className = '', iconSize = 16, hideTooltip = false }) => {
  const [hovered, setHovered] = useState(false);
  const btnRef = useRef(null);

  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });

  const handleMouseEnter = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setCoords({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    }
    setHovered(true);
  };

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setHovered(false)}
      className={`relative w-8 h-8 rounded-lg text-white/82 hover:text-white hover:bg-white/8 transition-all duration-150 flex items-center justify-center shrink-0 ${className}`}
    >
      <span className="flex items-center justify-center" style={{ fontSize: iconSize }}>
        {children}
      </span>
      {!hideTooltip && typeof window !== 'undefined' && btnRef.current && typeof document !== 'undefined' && createPortal(
        <div
          className={`pointer-events-none fixed z-[99999] whitespace-nowrap rounded-md border border-white/10 bg-[#0b0d12] px-2.5 py-1.5 text-[11px] font-medium text-white/90 shadow-xl transition duration-150 ${hovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          style={{
            top: window.innerWidth < 768
              ? coords.top
              : coords.top + coords.height / 2,
            left: window.innerWidth < 768
              ? coords.left + coords.width / 2
              : coords.left + coords.width + 10,
            transform: window.innerWidth < 768
              ? `translate(-50%, calc(-100% - ${hovered ? '10px' : '4px'}))`
              : `translate(${hovered ? '0px' : '-4px'}, -50%)`,
          }}
        >
          {label}
        </div>,
        document.body
      )}
    </button>
  );
};

export default function Loader({ url, ui = true, zoom }) {
  useReg();
  const { options, updateOption } = useOptions();
  const navigate = useNavigate();
  const location = useLocation();
  const routeUrl = url || location.state?.url;
  const tabs = loaderStore((state) => state.tabs);
  const updateUrl = loaderStore((state) => state.updateUrl);
  const setIframeUrl = loaderStore((state) => state.setIframeUrl);
  const addTab = loaderStore((state) => state.addTab);
  const setActive = loaderStore((state) => state.setActive);
  const lastFindText = useRef('');
  const lastOpenStateKeyRef = useRef('');
  const [historyPopupOpen, setHistoryPopupOpen] = useState(false);
  const [historyPopupItems, setHistoryPopupItems] = useState([]);
  const [historyQuery, setHistoryQuery] = useState('');
  const [findBarOpen, setFindBarOpen] = useState(false);
  const [findText, setFindText] = useState('');
  const [tabsHydrated, setTabsHydrated] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [changelogRender, setChangelogRender] = useState(false);
  const [changelogAnim, setChangelogAnim] = useState(false);
  const [ghostMenuOpen, setGhostMenuOpen] = useState(false);
  const [adBlockPopupOpen, setAdBlockPopupOpen] = useState(false);
  const [devOptionsOpen, setDevOptionsOpen] = useState(false);

  const [popupCoords, setPopupCoords] = useState({
    ghost: { top: 0, left: 0, right: 0 },
    adBlock: { top: 0, left: 0, right: 0 },
    dev: { top: 0, left: 0, right: 0 }
  });

  const updatePopupCoords = useCallback(() => {
    setPopupCoords({
      ghost: ghostMenuRef.current ? {
        top: ghostMenuRef.current.getBoundingClientRect().top,
        left: ghostMenuRef.current.getBoundingClientRect().left,
        right: ghostMenuRef.current.getBoundingClientRect().right
      } : { top: 0, left: 0, right: 0 },
      adBlock: adBlockPopupRef.current ? {
        top: adBlockPopupRef.current.getBoundingClientRect().top,
        left: adBlockPopupRef.current.getBoundingClientRect().left,
        right: adBlockPopupRef.current.getBoundingClientRect().right
      } : { top: 0, left: 0, right: 0 },
      dev: devOptionsRef.current ? {
        top: devOptionsRef.current.getBoundingClientRect().top,
        left: devOptionsRef.current.getBoundingClientRect().left,
        right: devOptionsRef.current.getBoundingClientRect().right
      } : { top: 0, left: 0, right: 0 }
    });
  }, []);

  useEffect(() => {
    if (ghostMenuOpen || adBlockPopupOpen || devOptionsOpen) {
      updatePopupCoords();
      window.addEventListener('resize', updatePopupCoords);
      return () => window.removeEventListener('resize', updatePopupCoords);
    }
  }, [ghostMenuOpen, adBlockPopupOpen, devOptionsOpen, updatePopupCoords]);
  const [geforceHelpOpen, setGeforceHelpOpen] = useState(false);
  const [geforceHelpDismissed, setGeforceHelpDismissed] = useState({});
  const [showDocsPopup, setShowDocsPopup] = useState(false);
  const [historyPopupRender, setHistoryPopupRender] = useState(false);
  const [historyPopupAnim, setHistoryPopupAnim] = useState(false);
  const [policyTick, setPolicyTick] = useState(0);
  const [menuClockNow, setMenuClockNow] = useState(Date.now());
  const [ipMeta, setIpMeta] = useState({ timezone: '', latitude: null, longitude: null, city: '' });
  const [menuWeather, setMenuWeather] = useState({ temp: null, weatherCode: null, isDay: true });
  const [batteryInfo, setBatteryInfo] = useState({ level: null, charging: false });
  const [debugPanelPos, setDebugPanelPos] = useState({ x: 78, y: 90 });
  const [debugStats, setDebugStats] = useState({ fps: 0, cpu: 0, ram: null, connection: 'unknown' });
  const [debugLogsOpen, setDebugLogsOpen] = useState(false);
  const [debugLogs, setDebugLogs] = useState([]);
  const [musicPromptByTab, setMusicPromptByTab] = useState({});
  const [devToolsTabs, setDevToolsTabs] = useState({});
  const ghostMenuRef = useRef(null);
  const devOptionsRef = useRef(null);
  const adBlockPopupRef = useRef(null);
  const ghostMenuPortalRef = useRef(null);
  const devOptionsPortalRef = useRef(null);
  const adBlockPortalRef = useRef(null);
  const findInputRef = useRef(null);
  const debugDragRef = useRef({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });
  const logRestoreRef = useRef(null);
  const [timeState, setTimeState] = useState(Date.now());
  const [windowHeight, setWindowHeight] = useState('100vh');

  useEffect(() => {
    const handleResize = () => {
      const scale = Number(options?.uiScale || document.documentElement.style.getPropertyValue('--ui-scale') || 1);
      setWindowHeight(`${window.innerHeight / scale}px`);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [options?.uiScale]);

  useEffect(() => {
    if (!ui) return;
    const dismissed = localStorage.getItem('ghostDocsPopupDismissed');
    if (!dismissed) {
      setShowDocsPopup(true);
    }
  }, [ui]);

  const parseCoords = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return null;
    const [latRaw, lonRaw] = raw.split(',').map((p) => p?.trim?.() || '');
    const lat = Number(latRaw);
    const lon = Number(lonRaw);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
    return { lat, lon };
  };

  const pushDebugLog = useCallback((level, args) => {
    setDebugLogs((prev) => {
      const line = {
        id: createId(),
        t: Date.now(),
        level,
        text: args
          .map((entry) => {
            try {
              if (typeof entry === 'string') return entry;
              return JSON.stringify(entry);
            } catch {
              return String(entry);
            }
          })
          .join(' '),
      };
      const next = [...prev, line];
      return next.slice(-160);
    });
  }, []);

  const effectiveTimezone = useMemo(() => {
    const override = String(options.timezoneOverride || '').trim();
    if (override) return override;
    if (ipMeta.timezone) return ipMeta.timezone;
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  }, [options.timezoneOverride, ipMeta.timezone]);

  const menuTimeLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: !(options.clock24Hour === true),
        timeZone: effectiveTimezone,
      }).format(menuClockNow);
    } catch {
      return new Date(menuClockNow).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: !(options.clock24Hour === true),
      });
    }
  }, [menuClockNow, options.clock24Hour, effectiveTimezone]);

  const weatherIcon = useMemo(() => {
    const code = Number(menuWeather.weatherCode);
    if (!Number.isFinite(code)) return Cloud;
    if (code === 0) return Sun;
    if (code === 45 || code === 48) return CloudFog;
    if ([95, 96, 99].includes(code)) return CloudLightning;
    if ([71, 73, 75, 77, 85, 86].includes(code)) return CloudSnow;
    if ([51, 53, 55, 56, 57].includes(code)) return CloudDrizzle;
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return CloudRain;
    return Cloud;
  }, [menuWeather.weatherCode]);

  const weatherUnitLabel = (options.weatherUnit || 'fahrenheit') === 'celsius' ? 'C' : 'F';

  const DEFAULT_MUSIC_URLS = {
    monochrome: 'https://monochrome.tf',
    spotify: 'https://open.spotify.com',
    'apple-music': 'https://music.apple.com',
    'amazon-music': 'https://music.amazon.com',
    'youtube-music': 'https://music.youtube.com',
    tidal: 'https://tidal.com',
    deezer: 'https://www.deezer.com',
    soundcloud: 'https://soundcloud.com',
    pandora: 'https://www.pandora.com',
    qobuz: 'https://www.qobuz.com',
  };

  const openDefaultMusicProvider = () => {
    const key = String(options.defaultMusicPlayer || '').toLowerCase().trim();
    if (!key || key === '--') {
      navigateActiveTab('ghost://music');
      return;
    }
    const target = DEFAULT_MUSIC_URLS[key] || DEFAULT_MUSIC_URLS.monochrome;
    navigateActiveTab(target);
  };

  const loadProxyHistory = () => {
    try {
      const raw = localStorage.getItem('ghostBrowserHistory');
      const parsed = JSON.parse(raw || '[]');
      const list = Array.isArray(parsed) ? parsed : [];
      setHistoryPopupItems(list);
      return list;
    } catch {
      setHistoryPopupItems([]);
      return [];
    }
  };

  const openProxyHistoryPopup = () => {
    loadProxyHistory();
    setHistoryPopupOpen(true);
  };

  const removeHistoryItem = (id, fallbackKey) => {
    const current = loadProxyHistory();
    const next = current.filter((item) => {
      if (id) return item.id !== id;
      return `${item.url}-${item.time}` !== fallbackKey;
    });
    localStorage.setItem('ghostBrowserHistory', JSON.stringify(next));
    setHistoryPopupItems(next);
  };

  const clearHistoryItems = async () => {
    const ok = await showConfirm('Clear all proxy browsing history?', 'Clear History');
    if (!ok) return;
    localStorage.setItem('ghostBrowserHistory', JSON.stringify([]));
    setHistoryPopupItems([]);
    setHistoryQuery('');
  };

  const openHistoryItem = (item) => {
    const rawUrl = String(item?.url || '').trim();
    if (!rawUrl) return;
    navigateActiveTab(rawUrl);
    setHistoryPopupOpen(false);
  };

  const filteredHistoryItems = useMemo(() => {
    const q = historyQuery.trim().toLowerCase();
    if (!q) return historyPopupItems;
    return historyPopupItems.filter((item) => {
      const title = String(item?.title || '').toLowerCase();
      const url = String(item?.url || '').toLowerCase();
      return title.includes(q) || url.includes(q);
    });
  }, [historyPopupItems, historyQuery]);

  const activeTab = useMemo(
    () => tabs.find((tab) => tab.active) || tabs[0] || null,
    [tabs],
  );

  const activeMusicPrompt = useMemo(() => {
    const tabId = activeTab?.id;
    if (!tabId) return null;
    const prompt = musicPromptByTab[tabId];
    if (!prompt) return null;
    return {
      tabId,
      providerKey: String(prompt.providerKey || ''),
      providerName: String(prompt.providerName || '').trim() || 'this service',
    };
  }, [activeTab?.id, musicPromptByTab]);

  const activeTabIsGeForceNow = useMemo(() => {
    const raw = String(activeTab?.url || '').trim();
    if (!raw || raw === 'tabs://new' || raw.startsWith('ghost://') || raw.startsWith('tabs://')) return false;

    let decoded = raw;
    try {
      if (raw.includes('/uv/service/') || raw.includes('/scramjet/')) {
        decoded = process(raw, true, options.prType || 'auto', options.engine || null);
      }
    } catch { }

    try {
      const parsed = new URL(decoded, location.origin);
      return parsed.hostname.replace(/^www\./i, '').toLowerCase() === 'play.geforcenow.com';
    } catch {
      return /play\.geforcenow\.com/i.test(decoded);
    }
  }, [activeTab?.url, options.prType, options.engine]);

  useEffect(() => {
    const tabId = activeTab?.id;
    if (!tabId || !activeTabIsGeForceNow) {
      setGeforceHelpOpen(false);
      return;
    }

    if (geforceHelpDismissed[tabId]) return;
    setGeforceHelpOpen(true);
  }, [activeTab?.id, activeTabIsGeForceNow, geforceHelpDismissed]);

  const persistSavedTabs = () => {
    if (!(options.saveTabs ?? true)) return;
    try {
      localStorage.setItem(
        SAVED_TABS_KEY,
        JSON.stringify({
          tabs: loaderStore.getState().tabs,
        }),
      );
    } catch { }
  };
  const barStyle = {
    backgroundColor: options.barColor || '#09121e',
  };

  const runFind = (backwards = false) => {
    const store = loaderStore.getState();
    const activeTab = store.tabs.find((t) => t.active);
    if (!activeTab) return;
    const text = (findText || lastFindText.current || '').trim();
    if (!text) return;
    lastFindText.current = text;
    const frame = store.activeFrameRef?.current || store.frameRefs?.current?.[activeTab.id];
    frame?.contentWindow?.find?.(text, false, backwards, true, false, false, false);
  };

  const getActiveFrame = (store, activeTab) => {
    const activeRef = store.activeFrameRef?.current;
    if (activeRef) return activeRef;
    return store.frameRefs?.current?.[activeTab.id] || null;
  };

  const enableDevTools = (frameRef) => {
    if (!frameRef?.contentWindow) return;

    try {
      const doc = frameRef.contentDocument || frameRef.contentWindow.document;
      const win = frameRef.contentWindow;
      if (!doc?.body) return;
      const erudaEl = doc.getElementById('eruda');

      if (erudaEl?.shadowRoot) return;

      const s = doc.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/eruda';
      s.onload = () => {
        win.eruda?.init();
        win.eruda?.show();
        win.eruda?.show('elements');
      };
      doc.body.appendChild(s);
    } catch { }
  };

  const disableDevTools = (frameRef) => {
    if (!frameRef?.contentWindow) return;
    try {
      const doc = frameRef.contentDocument || frameRef.contentWindow.document;
      const win = frameRef.contentWindow;
      if (!doc?.body) return;
      win.eruda?.destroy?.();
    } catch { }
  };

  const toggleDevToolsForTab = (tabId, frameRef) => {
    if (!tabId) return;
    setDevToolsTabs((prev) => {
      const enabled = !!prev[tabId];
      if (enabled) {
        disableDevTools(frameRef);
        const next = { ...prev };
        delete next[tabId];
        return next;
      }
      enableDevTools(frameRef);
      return { ...prev, [tabId]: true };
    });
  };

  const navigateActiveTab = (rawUrl) => {
    // Intercept ghost://ai — redirect to external provider if one is set
    if (String(rawUrl).toLowerCase() === 'ghost://ai' && options.defaultAiProvider) {
      const providerUrls = {
        chatgpt: 'https://chat.openai.com',
        gemini: 'https://gemini.google.com',
        claude: 'https://claude.ai',
        perplexity: 'https://www.perplexity.ai',
        copilot: 'https://copilot.microsoft.com',
        deepseek: 'https://chat.deepseek.com',
        mistral: 'https://chat.mistral.ai',
        grok: 'https://grok.x.ai',
        you: 'https://you.com',
        poe: 'https://poe.com',
        huggingchat: 'https://huggingface.co/chat',
      };
      const externalUrl = providerUrls[options.defaultAiProvider];
      if (externalUrl) {
        rawUrl = externalUrl;
      }
    }

    const store = loaderStore.getState();
    const activeTab = store.tabs.find((tab) => tab.active) || store.tabs[0];
    const processed = process(rawUrl, false, options.prType || 'auto', options.engine || null);

    if (activeTab && activeTab.url === processed) return;

    if (options.openLinkInNewTab) {
      if (store.tabs.length < 20) {
        const id = createId();
        addTab({ title: 'New Tab', id, url: processed });
        if (String(rawUrl).toLowerCase() === 'ghost://home') {
          setIframeUrl(id, 'ghost://home');
        }
        setActive(id);
      }
    } else if (activeTab) {
      updateUrl(activeTab.id, processed);
      if (String(rawUrl).toLowerCase() === 'ghost://home') {
        setIframeUrl(activeTab.id, 'ghost://home');
      }
    }
  };

  const INTERNAL_PATHS = ['/apps', '/settings', '/discover', '/docs', '/search', '/code', '/ai', '/remote', '/new'];

  const isActiveTabInternalGhost = () => {
    const store = loaderStore.getState();
    const tab = store.tabs.find((tab) => tab.active) || store.tabs[0];
    if (!tab) return true;
    const raw = String(tab?.url || '').trim();
    // Check iframeUrls too (ghost:// URLs stored as iframeUrl)
    const iframeUrl = String(store.iframeUrls?.[tab.id] || '').trim();
    if (!raw || raw === 'tabs://new') return true;
    if (raw.startsWith('ghost://') || raw.startsWith('tabs://')) return true;
    if (iframeUrl.startsWith('ghost://') || iframeUrl.startsWith('tabs://')) return true;
    try {
      const parsed = new URL(raw, location.origin);
      if (parsed.origin !== location.origin) return false;
      if (parsed.searchParams.get('ghost') === '1') return true;

      // Check pathname-based routes (BrowserRouter / localhost)
      const path = parsed.pathname.replace(/\/$/, '') || '/';
      if (INTERNAL_PATHS.some((base) => path === base || path.startsWith(`${base}/`))) return true;

      // Check hash-based routes (HashRouter / static/Cloudflare builds)
      const hash = parsed.hash || '';
      if (hash.startsWith('#/')) {
        const hashPath = '/' + hash.slice(2).split('?')[0].replace(/\/$/, '');
        const hashQs = hash.includes('?') ? new URLSearchParams(hash.split('?')[1]) : null;
        if (hashQs?.get('ghost') === '1') return true;
        if (INTERNAL_PATHS.some((base) => hashPath === base || hashPath.startsWith(`${base}/`))) return true;
      }

      return false;
    } catch { return false; }
  };

  const openDevToolsForActiveTab = () => {
    if (isActiveTabInternalGhost()) return;
    const store = loaderStore.getState();
    const activeTab = store.tabs.find((tab) => tab.active);
    if (!activeTab) return;
    const frame = store.activeFrameRef?.current || store.frameRefs?.current?.[activeTab.id];
    toggleDevToolsForTab(activeTab.id, frame);
  };

  const openInGhostNewTab = (rawUrl, config = {}) => {
    const store = loaderStore.getState();
    if (!rawUrl || store.tabs.length >= 20) return;
    const processedUrl = config?.skipProxy
      ? rawUrl
      : process(rawUrl, false, options.prType || 'auto', options.engine || null);
    const id = createId();
    addTab({ title: config?.title || 'New Tab', id, url: processedUrl });
    setActive(id);
  };

  const resolveCurrentSite = () => {
    const store = loaderStore.getState();
    const activeTab = store.tabs.find((tab) => tab.active) || store.tabs[0];
    const raw = String(activeTab?.url || '').trim();
    if (!raw || raw === 'tabs://new' || raw.startsWith('ghost://') || raw.startsWith('tabs://')) return null;

    let decoded = raw;
    try {
      if (raw.includes('/uv/service/') || raw.includes('/scramjet/')) {
        decoded = process(raw, true, options.prType || 'auto', options.engine || null);
      }
    } catch { }

    try {
      const parsed = new URL(decoded, location.origin);
      const currentHost = String(location.hostname || '').toLowerCase();
      const internalHosts = new Set(['localhost', '127.0.0.1', '::1', currentHost]);
      const parsedHost = String(parsed.hostname || '').toLowerCase();
      if (parsed.origin === location.origin || internalHosts.has(parsedHost)) return null;
      const key = parsed.hostname.replace(/^www\./, '').toLowerCase();
      if (!key) return null;
      return { key, label: key, tabId: activeTab?.id || null };
    } catch {
      return null;
    }
  };

  const getCurrentSitePolicy = () => {
    const site = resolveCurrentSite();
    if (!site) return null;
    const all = getSitePolicies();
    const current = all[site.key] || {};
    return {
      site,
      adBlock: typeof current.adBlock === 'boolean' ? current.adBlock : !!options.adBlockDefault,
      popupBlock:
        typeof current.popupBlock === 'boolean' ? current.popupBlock : !!options.popupBlockDefault,
      downloadBlock:
        typeof current.downloadBlock === 'boolean'
          ? current.downloadBlock
          : !!options.downloadBlockDefault,
    };
  };

  const updateCurrentSitePolicy = (patch) => {
    const current = getCurrentSitePolicy();
    if (!current?.site) return;

    const all = getSitePolicies();
    const next = {
      ...all,
      [current.site.key]: {
        ...(all[current.site.key] || {}),
        ...patch,
        updatedAt: Date.now(),
      },
    };
    setSitePolicies(next);
    setPolicyTick((v) => v + 1);

    if (current.site.tabId) {
      loaderStore.getState().refreshTab(current.site.tabId);
    }
  };

  useEffect(() => {
    const close = (event) => {
      if (!ghostMenuOpen) return;
      if (ghostMenuRef.current?.contains(event.target)) return;
      if (ghostMenuPortalRef.current?.contains(event.target)) return;
      setGhostMenuOpen(false);
    };
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [ghostMenuOpen]);

  useEffect(() => {
    const close = (event) => {
      if (!devOptionsOpen) return;
      if (devOptionsRef.current?.contains(event.target)) return;
      if (devOptionsPortalRef.current?.contains(event.target)) return;
      setDevOptionsOpen(false);
    };
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [devOptionsOpen]);

  useEffect(() => {
    const close = (event) => {
      if (!adBlockPopupOpen) return;
      if (adBlockPopupRef.current?.contains(event.target)) return;
      if (adBlockPortalRef.current?.contains(event.target)) return;
      setAdBlockPopupOpen(false);
    };
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [adBlockPopupOpen]);

  useEffect(() => {
    const onPolicyUpdate = () => setPolicyTick((v) => v + 1);
    window.addEventListener('ghost-site-policies-updated', onPolicyUpdate);
    return () => window.removeEventListener('ghost-site-policies-updated', onPolicyUpdate);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setMenuClockNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let batteryRef = null;
    let listener = null;

    const updateBattery = () => {
      if (!batteryRef || cancelled) return;
      const rawLevel = Number(batteryRef.level);
      setBatteryInfo({
        level: Number.isFinite(rawLevel) ? Math.round(rawLevel * 100) : null,
        charging: !!batteryRef.charging,
      });
    };

    if (navigator.getBattery) {
      navigator.getBattery().then((battery) => {
        if (cancelled) return;
        batteryRef = battery;
        updateBattery();
        listener = () => updateBattery();
        battery.addEventListener('chargingchange', listener);
        battery.addEventListener('levelchange', listener);
      }).catch(() => { });
    }

    return () => {
      cancelled = true;
      if (batteryRef && listener) {
        batteryRef.removeEventListener('chargingchange', listener);
        batteryRef.removeEventListener('levelchange', listener);
      }
    };
  }, []);

  useEffect(() => {
    if (!options.debugMode) {
      setDebugLogsOpen(false);
      return;
    }

    let mounted = true;
    let rafId = 0;
    let frames = 0;
    let lastTick = performance.now();

    const readConnection = () => {
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (!conn) return 'unknown';
      const speed = Number(conn.downlink);
      const type = String(conn.effectiveType || '').trim();
      if (Number.isFinite(speed) && type) return `${speed} Mbps (${type})`;
      if (Number.isFinite(speed)) return `${speed} Mbps`;
      return type || 'unknown';
    };

    const tick = (now) => {
      if (!mounted) return;
      frames += 1;
      const elapsed = now - lastTick;
      if (elapsed >= 1000) {
        const fps = Math.round((frames * 1000) / elapsed);
        const avgFrame = elapsed / Math.max(frames, 1);
        const cpuEstimate = Math.max(0, Math.min(100, Math.round(((avgFrame - 16.67) / 16.67) * 100 + 50)));
        let ramLabel = null;
        if (performance?.memory?.usedJSHeapSize) {
          ramLabel = `${(performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1)} MB`;
        }

        setDebugStats({
          fps,
          cpu: cpuEstimate,
          ram: ramLabel,
          connection: readConnection(),
        });
        frames = 0;
        lastTick = now;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      mounted = false;
      cancelAnimationFrame(rafId);
    };
  }, [options.debugMode]);

  useEffect(() => {
    if (!options.debugMode) {
      if (logRestoreRef.current) {
        logRestoreRef.current();
        logRestoreRef.current = null;
      }
      return;
    }

    if (logRestoreRef.current) return;

    const original = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
    };

    const wrap = (level) => (...args) => {
      pushDebugLog(level, args);
      original[level](...args);
    };

    console.log = wrap('log');
    console.warn = wrap('warn');
    console.error = wrap('error');
    console.info = wrap('info');

    logRestoreRef.current = () => {
      console.log = original.log;
      console.warn = original.warn;
      console.error = original.error;
      console.info = original.info;
    };

    const onWindowError = (event) => {
      if (event.target && (event.target.src || event.target.href)) {
        pushDebugLog('error', [`Resource failed to load: ${event.target.src || event.target.href}`]);
        return;
      }
      pushDebugLog('error', [event?.message || 'Unhandled error', event?.filename || '', event?.lineno || '']);
    };
    const onUnhandledRejection = (event) => {
      pushDebugLog('error', ['Unhandled rejection', event?.reason || '']);
    };
    window.addEventListener('error', onWindowError, true);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.removeEventListener('error', onWindowError, true);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
      if (logRestoreRef.current) {
        logRestoreRef.current();
        logRestoreRef.current = null;
      }
    };
  }, [options.debugMode, pushDebugLog]);

  useEffect(() => {
    const onMove = (event) => {
      if (!debugDragRef.current.active) return;
      const dx = event.clientX - debugDragRef.current.startX;
      const dy = event.clientY - debugDragRef.current.startY;
      const nextX = Math.max(4, Math.min(window.innerWidth - 320, debugDragRef.current.originX + dx));
      const nextY = Math.max(4, Math.min(window.innerHeight - 140, debugDragRef.current.originY + dy));
      setDebugPanelPos({ x: nextX, y: nextY });
    };

    const onUp = () => {
      debugDragRef.current.active = false;
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  useEffect(() => {
    let canceled = false;

    const parseProviderMeta = (payload, source) => {
      if (!payload || typeof payload !== 'object') return null;

      if (source === 'ipapi') {
        return {
          timezone: String(payload.timezone || ''),
          latitude: Number(payload.latitude),
          longitude: Number(payload.longitude),
          city: String(payload.city || ''),
        };
      }

      if (source === 'ipwho') {
        return {
          timezone: String(payload?.timezone?.id || ''),
          latitude: Number(payload.latitude),
          longitude: Number(payload.longitude),
          city: String(payload.city || ''),
        };
      }

      if (source === 'ipinfo') {
        const loc = String(payload.loc || '').split(',');
        return {
          timezone: String(payload.timezone || ''),
          latitude: Number(loc[0]),
          longitude: Number(loc[1]),
          city: String(payload.city || ''),
        };
      }

      return null;
    };

    const isValidMeta = (meta) =>
      !!meta &&
      Number.isFinite(meta.latitude) &&
      Number.isFinite(meta.longitude) &&
      meta.latitude >= -90 &&
      meta.latitude <= 90 &&
      meta.longitude >= -180 &&
      meta.longitude <= 180;



    const fetchIpMeta = async () => {

      const providers = [
        { url: 'https://whatismyipaddress.com/', source: 'ip' },
        { url: 'https://ipinfo.io/json', source: 'ipinfo' },
      ];

      for (const provider of providers) {
        try {
          const response = await fetch(provider.url);
          if (!response.ok) continue;
          const data = await response.json();
          const parsed = parseProviderMeta(data, provider.source);
          if (!isValidMeta(parsed)) continue;
          if (canceled) return;
          setIpMeta(parsed);
          return;
        } catch { }
      }
    };

    fetchIpMeta();
    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    let canceled = false;

    const manualCoords = parseCoords(options.weatherCoordsOverride);
    const shouldUseIp = options.weatherUseIpLocation !== false;
    const lat = shouldUseIp ? Number(ipMeta.latitude) : Number(manualCoords?.lat);
    const lon = shouldUseIp ? Number(ipMeta.longitude) : Number(manualCoords?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

    const unit = (options.weatherUnit || 'fahrenheit') === 'celsius' ? 'celsius' : 'fahrenheit';

    const loadWeather = async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&current=temperature_2m,weather_code,is_day&temperature_unit=${unit}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('weather fetch failed');
        const data = await response.json();
        if (canceled) return;
        const current = data?.current || {};
        setMenuWeather({
          temp: Number(current.temperature_2m),
          weatherCode: Number(current.weather_code),
          isDay: Number(current.is_day) !== 0,
        });
      } catch {
        if (canceled) return;
        setMenuWeather({ temp: null, weatherCode: null, isDay: true });
      }
    };

    loadWeather();
    const poll = setInterval(loadWeather, 10 * 60 * 1000);
    return () => {
      canceled = true;
      clearInterval(poll);
    };
  }, [ipMeta.latitude, ipMeta.longitude, options.weatherUnit, options.weatherUseIpLocation, options.weatherCoordsOverride]);

  useEffect(() => {
    if (historyPopupOpen) {
      setHistoryPopupRender(true);
      const t = setTimeout(() => setHistoryPopupAnim(true), 10);
      return () => clearTimeout(t);
    }

    setHistoryPopupAnim(false);
    const t = setTimeout(() => setHistoryPopupRender(false), 200);
    return () => clearTimeout(t);
  }, [historyPopupOpen]);

  useEffect(() => {
    if (isChangelogOpen) {
      setChangelogRender(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setChangelogAnim(true)));
      return;
    }

    setChangelogAnim(false);
    const t = setTimeout(() => setChangelogRender(false), 200);
    return () => clearTimeout(t);
  }, [isChangelogOpen]);

  useEffect(() => {
    const closeAll = () => {
      setGhostMenuOpen(false);
      setDevOptionsOpen(false);
      setAdBlockPopupOpen(false);
      const store = loaderStore.getState();
      if (store.showMenu) store.toggleMenu();
    };
    window.addEventListener('ghost-close-all-loader-popups', closeAll);
    return () => window.removeEventListener('ghost-close-all-loader-popups', closeAll);
  }, []);

  useEffect(() => {
    const shouldOpenChangelog = new URLSearchParams(location.search).get('changelog') === '1';
    if (shouldOpenChangelog) {
      setIsChangelogOpen(true);
      navigate('/search?ghost=1', { replace: true });
    }
  }, [location.search, navigate]);

  useEffect(() => {
    if (!location.state?.openHistoryPopup) return;
    openProxyHistoryPopup();
    navigate('.', { replace: true, state: {} });
  }, [location.state, navigate]);

  /* Route-URL → active-tab effect.
   * IMPORTANT: `tabs` is NOT in the dependency array to prevent a cascading
   * re-render loop (updateUrl creates a new tabs reference → effect re-fires).
   * We read tabs from the store snapshot inside the callback instead. */
  useEffect(() => {
    if (!tabsHydrated) return;
    if (!routeUrl) return;

    const storeTabs = loaderStore.getState().tabs;
    if (storeTabs.length === 0) return;

    const shouldSkipProxy = !!location.state?.skipProxy;
    const processedUrl = shouldSkipProxy
      ? routeUrl
      : process(routeUrl, false, options.prType || 'auto', options.engine || null);

    if (location.state?.openInGhostNewTab) {
      const stateKey = `${routeUrl}-${location.key}`;
      if (lastOpenStateKeyRef.current === stateKey) return;
      lastOpenStateKeyRef.current = stateKey;

      if (storeTabs.length >= 20) return;
      const id = createId();
      addTab({ title: 'New Tab', id, url: processedUrl });
      if (location.state?.askDefaultMusicPrompt) {
        setMusicPromptByTab((prev) => ({
          ...prev,
          [id]: {
            providerKey: String(location.state?.musicProviderKey || ''),
            providerName: String(location.state?.musicProviderName || ''),
          },
        }));
      }
      setActive(id);
      navigate('.', { replace: true, state: {} });
      return;
    }

    const currentTab = storeTabs.find((tab) => tab.active) || storeTabs[0];
    if (currentTab && currentTab.url !== processedUrl) {
      updateUrl(currentTab.id, processedUrl);
    }
  }, [tabsHydrated, routeUrl, updateUrl, addTab, setActive, options.prType, options.engine, location.state, location.key, navigate]);

  useEffect(() => {
    if (options.saveTabs ?? true) {
      try {
        const raw = localStorage.getItem(SAVED_TABS_KEY);
        const parsed = JSON.parse(raw || '{}');
        const savedTabs = Array.isArray(parsed.tabs) ? parsed.tabs : [];
        if (savedTabs.length > 0) {
          const normalizedTabs = savedTabs.map((tab) => {
            const normalizedUrl = sanitizeHydratedUrl(tab.url);
            const baseHistory = Array.isArray(tab.history) && tab.history.length > 0
              ? tab.history
              : [normalizedUrl];
            const normalizedHistory = baseHistory.map((entry) => sanitizeHydratedUrl(entry));
            const safeHistoryIndex = Math.min(
              Math.max(Number.isInteger(tab.historyIndex) ? tab.historyIndex : normalizedHistory.length - 1, 0),
              normalizedHistory.length - 1,
            );

            return {
              ...tab,
              url: normalizedUrl,
              history: normalizedHistory,
              historyIndex: safeHistoryIndex,
            };
          });

          const hasActive = normalizedTabs.some((t) => t.active);
          const hydrated = hasActive
            ? normalizedTabs
            : normalizedTabs.map((t, i) => ({ ...t, active: i === 0 }));
          loaderStore.setState({
            tabs: hydrated,
            showTabs: true,
            iframeUrls: {},
            frameRefs: null,
          });
          setTabsHydrated(true);
          return;
        }
      } catch { }
    }

    loaderStore.getState().clearStore();
    setTabsHydrated(true);
  }, []);

  useEffect(() => {
    if (!(options.saveTabs ?? true)) {
      localStorage.removeItem(SAVED_TABS_KEY);
      return;
    }

    const unsubscribe = loaderStore.subscribe((state) => {
      try {
        localStorage.setItem(
          SAVED_TABS_KEY,
          JSON.stringify({
            tabs: state.tabs,
          }),
        );
      } catch { }
    });

    return () => {
      persistSavedTabs();
      unsubscribe();
    };
  }, [options.saveTabs]);

  useEffect(() => {
    const openGhostBrowserTab = (rawUrl, config = {}) => {
      if (!rawUrl || loaderStore.getState().tabs.length >= 20) return false;
      const processedUrl = config?.skipProxy
        ? rawUrl
        : process(rawUrl, false, options.prType || 'auto', options.engine || null);
      const id = createId();
      addTab({ title: config?.title || 'New Tab', id, url: processedUrl });
      if (config.askDefaultMusicPrompt) {
        setMusicPromptByTab((prev) => ({
          ...prev,
          [id]: {
            providerKey: String(config.musicProviderKey || ''),
            providerName: String(config.musicProviderName || ''),
          },
        }));
      }
      setActive(id);
      return id;
    };

    const updateGhostBrowserTabUrl = (tabId, rawUrl, config = {}) => {
      if (!tabId || !rawUrl) return false;
      // Handle ghost://home specially — switch to tabs://new so Viewer shows home
      if (String(rawUrl).toLowerCase() === 'ghost://home') {
        loaderStore.getState().updateUrl(tabId, 'tabs://new');
        loaderStore.getState().setIframeUrl(tabId, 'ghost://home');
        return true;
      }
      const processedUrl = config?.skipProxy
        ? rawUrl
        : process(rawUrl, false, options.prType || 'auto', options.engine || null);
      loaderStore.getState().updateUrl(tabId, processedUrl);
      // Also set iframeUrl for ghost:// protocol URLs
      if (String(rawUrl).startsWith('ghost://')) {
        loaderStore.getState().setIframeUrl(tabId, rawUrl);
      }
      return true;
    };

    window.__ghostOpenBrowserTab = openGhostBrowserTab;
    window.__ghostUpdateBrowserTabUrl = updateGhostBrowserTabUrl;
    window.__ghostGetActiveTabId = () => {
      const store = loaderStore.getState();
      const active = store.tabs.find((tab) => tab.active) || store.tabs[0];
      return active?.id || null;
    };
    return () => {
      if (window.__ghostOpenBrowserTab === openGhostBrowserTab) {
        delete window.__ghostOpenBrowserTab;
      }
      if (window.__ghostUpdateBrowserTabUrl === updateGhostBrowserTabUrl) {
        delete window.__ghostUpdateBrowserTabUrl;
      }
      delete window.__ghostGetActiveTabId;
    };
  }, [addTab, setActive, options.prType, options.engine]);

  useEffect(() => {
    const onFrameLoaded = (event) => {
      const tabId = event?.detail?.tabId;
      const frame = event?.detail?.frame || null;
      if (!tabId || !devToolsTabs[tabId]) return;
      enableDevTools(frame);
    };

    window.addEventListener('ghost-frame-loaded', onFrameLoaded);
    return () => window.removeEventListener('ghost-frame-loaded', onFrameLoaded);
  }, [devToolsTabs]);

  useEffect(() => {
    if (!(options.saveTabs ?? true)) return;

    const onBeforeUnload = () => {
      persistSavedTabs();
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        persistSavedTabs();
      }
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      persistSavedTabs();
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [options.saveTabs]);

  useEffect(() => {
    const openHistory = () => openProxyHistoryPopup();
    window.addEventListener('ghost-open-history-popup', openHistory);
    return () => window.removeEventListener('ghost-open-history-popup', openHistory);
  }, []);

  useEffect(() => {
    const shortcuts = getEffectiveShortcuts(options);

    const handleKeyDown = (e) => {
      const combo = eventToShortcut(e);
      const matchedEntries = Object.entries(shortcuts).filter(
        ([, cfg]) => cfg?.enabled !== false && cfg?.key === combo,
      );
      if (matchedEntries.length === 0) return;

      const matched = matchedEntries[0];

      const store = loaderStore.getState();
      const getActiveTab = () => loaderStore.getState().tabs.find((t) => t.active);
      const activeTab = getActiveTab();
      if (!activeTab) return;

      const setActiveByIndex = (index) => {
        const target = store.tabs[index];
        if (!target) return;
        store.setActive(target.id);
      };

      const openNewTab = () => {
        if (store.tabs.length >= 20) return;
        const id = createId();
        store.addTab({ title: 'New Tab', id, url: 'tabs://new' });
        store.setActive(id);
      };

      const closeCurrentTab = () => {
        if (store.tabs.length <= 1) {
          if (activeTab.url !== 'tabs://new') {
            store.updateUrl(activeTab.id, process('ghost://home', false, options.prType || 'auto', options.engine || null));
            store.updateTitle(activeTab.id, 'New Tab');
          }
          return;
        }
        store.setLastActive(activeTab.id);
        store.removeTab(activeTab.id);
      };

      const duplicateCurrentTab = () => {
        const current = getActiveTab();
        if (!current) return;
        if (store.tabs.length >= 20) return;
        const id = createId();
        store.addTab({ title: current.title || 'New Tab', id, url: current.url || 'tabs://new' });
        store.setActive(id);
      };

      const nextTab = () => {
        const fresh = loaderStore.getState();
        const idx = fresh.tabs.findIndex((t) => t.active);
        setActiveByIndex((idx + 1) % fresh.tabs.length);
      };
      const previousTab = () => {
        const fresh = loaderStore.getState();
        const idx = fresh.tabs.findIndex((t) => t.active);
        setActiveByIndex((idx - 1 + fresh.tabs.length) % fresh.tabs.length);
      };

      const pinToggle = () => {
        const current = getActiveTab();
        if (!current) return;
        loaderStore.setState((state) => ({
          tabs: state.tabs.map((t) => (t.id === current.id ? { ...t, pinned: !t.pinned } : t)),
        }));
      };

      const createGroup = () => {
        const current = getActiveTab();
        if (!current) return;
        loaderStore.setState((state) => ({
          tabs: state.tabs.map((t) =>
            t.id === current.id ? { ...t, group: t.group || 'Group 1' } : t,
          ),
        }));
      };

      const removeGroup = () => {
        const current = getActiveTab();
        if (!current) return;
        loaderStore.setState((state) => ({
          tabs: state.tabs.map((t) => (t.id === current.id ? { ...t, group: null } : t)),
        }));
      };

      const hardReload = () => {
        const current = getActiveTab();
        if (!current?.url || current.url === 'tabs://new') return;
        const decoded = process(current.url, true, options.prType || 'auto', options.engine || null);
        const sep = decoded.includes('?') ? '&' : '?';
        const next = `${decoded}${sep}_=${Date.now()}`;
        store.updateUrl(current.id, process(next, false, options.prType || 'auto', options.engine || null), false);
      };

      const focusAddressBar = () => {
        const input = document.getElementById('ghost-omnibox-input') || document.querySelector('input[data-ghost-omnibox="1"]');
        input?.focus();
        input?.select?.();
      };

      const markReturnHint = () => {
        try {
          sessionStorage.setItem('ghostReturnToBrowserHint', '1');
        } catch { }
      };

      const viewSource = () => {
        const current = getActiveTab();
        if (!current?.url || current.url === 'tabs://new') return;
        const decoded = process(current.url, true, options.prType || 'auto', options.engine || null);
        if (store.tabs.length >= 20) return;
        const id = createId();
        store.addTab({ title: `Source: ${current.title || 'Page'}`, id, url: `view-source:${decoded}` });
        store.setActive(id);
      };

      const zoomIn = () => {
        const current = getActiveTab();
        if (!current) return;
        const currentZoom = store.zoomLevels?.[current.id] || 100;
        const frame = getActiveFrame(store, current);
        store.setZoom(current.id, Math.min(currentZoom + 10, 200), { current: frame });
      };
      const zoomOut = () => {
        const current = getActiveTab();
        if (!current) return;
        const currentZoom = store.zoomLevels?.[current.id] || 100;
        const frame = getActiveFrame(store, current);
        store.setZoom(current.id, Math.max(currentZoom - 10, 50), { current: frame });
      };

      const openHistory = () => openProxyHistoryPopup();

      const openBookmarks = () => {
        window.dispatchEvent(new Event('ghost-open-bookmarks'));
      };

      const bookmarkCurrentPage = () => {
        const currentTab = getActiveTab();
        if (!currentTab?.url || currentTab.url === 'tabs://new') return;
        const decoded = process(currentTab.url, true, options.prType || 'auto', options.engine || null);
        const currentBookmarks = options.bookmarks || [];
        const next = [
          {
            id: createId(),
            name: currentTab.title || 'Saved Page',
            url: decoded,
            icon: null,
          },
          ...currentBookmarks,
        ];
        updateOption({ bookmarks: next });
      };

      const findInPage = () => {
        setFindBarOpen(true);
        const initial = lastFindText.current || '';
        setFindText(initial);
        requestAnimationFrame(() => {
          findInputRef.current?.focus();
          findInputRef.current?.select?.();
        });
      };

      const findNext = () => {
        const text = (findText || lastFindText.current || '').trim();
        if (!text) return;
        lastFindText.current = text;
        getActiveFrame(store, activeTab)?.contentWindow?.find?.(
          text,
          false,
          false,
          true,
          false,
          false,
          false,
        );
      };

      const findPrevious = () => {
        const text = (findText || lastFindText.current || '').trim();
        if (!text) return;
        lastFindText.current = text;
        getActiveFrame(store, activeTab)?.contentWindow?.find?.(
          text,
          false,
          true,
          true,
          false,
          false,
          false,
        );
      };

      const actions = {
        newTab: openNewTab,
        closeTab: closeCurrentTab,
        reopenClosedTab: () => store.reopenClosedTab(),
        duplicateTab: duplicateCurrentTab,
        nextTab,
        previousTab,
        pinTab: pinToggle,
        createTabGroup: createGroup,
        removeTabGroup: removeGroup,
        goBack: () => store.goBack(activeTab.id),
        goForward: () => store.goForward(activeTab.id),
        reload: () => store.refreshTab(activeTab.id),
        reloadF5: () => store.refreshTab(activeTab.id),
        hardReload,
        focusAddressBar,
        goHome: () => {
          markReturnHint();
          navigate('/');
        },
        toggleDevToolsF12: () => toggleDevToolsForTab(activeTab.id, getActiveFrame(store, activeTab)),
        toggleDevToolsAlt: () => toggleDevToolsForTab(activeTab.id, getActiveFrame(store, activeTab)),
        viewPageSource: viewSource,
        zoomIn,
        zoomOut,
        zoomReset: () => {
          const current = getActiveTab();
          if (!current) return;
          const frame = getActiveFrame(store, current);
          store.resetZoom(current.id, { current: frame });
        },
        toggleFullscreen: () => {
          const current = getActiveTab();
          if (!current) return;
          getActiveFrame(store, current)?.requestFullscreen?.();
        },
        openSettings: () => {
          markReturnHint();
          navigate('/settings');
        },
        openHistory,
        openBookmarks,
        bookmarkCurrentPage,
        findInPage,
        findNext,
        findPrevious,
        tab1: () => setActiveByIndex(0),
        tab2: () => setActiveByIndex(1),
        tab3: () => setActiveByIndex(2),
        tab4: () => setActiveByIndex(3),
        tab5: () => setActiveByIndex(4),
        tab6: () => setActiveByIndex(5),
        tab7: () => setActiveByIndex(6),
        tab8: () => setActiveByIndex(7),
        tab9: () => setActiveByIndex(8),
        tab10: () => setActiveByIndex(9),
      };

      const action = actions[matched[0]];
      if (!action) return;
      e.preventDefault();
      action();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [options, navigate]);

  const currentSitePolicy = useMemo(
    () => getCurrentSitePolicy(),
    [
      tabs,
      options.adBlockDefault,
      options.popupBlockDefault,
      options.downloadBlockDefault,
      options.prType,
      options.engine,
      policyTick,
    ],
  );
  const anySidebarPopupOpen = ghostMenuOpen || devOptionsOpen || adBlockPopupOpen;

  return (
    <div
      className="flex flex-col-reverse md:flex-row w-full h-full"
      style={{ color: options.siteTextColor || '#a0b0c8' }}
    >
      {ui && (
        <aside
          className="w-full h-auto md:w-[52px] md:h-full flex flex-row md:flex-col items-center px-1.5 md:py-2.5 z-[140] border-t md:border-t-0 md:border-r border-white/10 shrink-0 overflow-x-auto md:overflow-x-hidden md:overflow-y-auto hide-scrollbar"
          style={{ backgroundColor: options.tabBarColor || '#070e15' }}
          onScroll={(e) => {
            setGhostMenuOpen(false);
            setAdBlockPopupOpen(false);
            setDevOptionsOpen(false);
          }}
        >
          <div className="relative shrink-0 md:pt-0" ref={ghostMenuRef}>
            <SidebarButton
              label="Ghost Menu"
              onClick={() => setGhostMenuOpen((prev) => !prev)}
              className="w-10 h-10 rounded-xl text-white hover:bg-white/10"
              iconSize={20}
              hideTooltip={true}
            >
              <img
                src="/ghost.png"
                alt="Ghost"
                className="w-6 h-6 object-contain"
                style={{ filter: 'invert(1) brightness(1.8)' }}
                draggable={false}
              />
            </SidebarButton>

            {typeof document !== 'undefined' && createPortal(
              <div
                ref={ghostMenuPortalRef}
                className={`fixed z-[9999] w-52 rounded-xl border border-white/10 bg-[#0c0f14] p-2 shadow-2xl transition duration-150 origin-bottom-left md:origin-top-left ${ghostMenuOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}
                style={{
                  top: window.innerWidth < 768 ? Math.max(0, popupCoords.ghost.top - 220) : Math.min(popupCoords.ghost.top, window.innerHeight - 300),
                  bottom: window.innerWidth < 768 ? 'auto' : 'auto',
                  left: window.innerWidth < 768 ? Math.max(0, popupCoords.ghost.left - 80) : popupCoords.ghost.right + 2
                }}
              >
                <div className="px-2.5 py-1.5 mb-1 rounded-lg border border-white/10 bg-[#111722]">
                  <div className="text-[11px] font-semibold tracking-wide text-white/90 flex items-center justify-between">
                    <span>{menuTimeLabel}</span>
                    <span className="inline-flex items-center gap-1 opacity-85">
                      <Battery size={12} />
                      {Number.isFinite(batteryInfo.level) ? `${batteryInfo.level}%` : '--'}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-white/80">
                    <span className="truncate max-w-[7.2rem]">{ipMeta.city || 'Your Location'}</span>
                    <span className="inline-flex items-center gap-1">
                      {(() => {
                        const WxIcon = weatherIcon;
                        return <WxIcon size={12} />;
                      })()}
                      {Number.isFinite(menuWeather.temp)
                        ? `${Math.round(menuWeather.temp)}°${weatherUnitLabel}`
                        : '--'}
                    </span>
                  </div>
                </div>

                {[
                  { label: 'Home', action: () => navigateActiveTab('ghost://home') },
                  { label: 'Apps', action: () => navigateActiveTab('ghost://apps') },
                  { label: 'Games', action: () => navigateActiveTab('ghost://games') },
                  { label: 'TV', action: () => navigateActiveTab('ghost://tv') },
                  { label: 'Music', action: () => openDefaultMusicProvider() },
                  { label: 'Remote Access', action: () => navigateActiveTab('ghost://remote') },
                  { label: 'Artificial Intelligence', action: () => navigateActiveTab('ghost://ai') },
                  { label: 'Code Runner', action: () => navigateActiveTab('ghost://code') },
                  { label: 'Docs', action: () => navigateActiveTab('ghost://docs') },
                  { label: 'Settings', action: () => navigateActiveTab('ghost://settings') },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-white/10 text-[12px] transition-colors cursor-pointer"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      item.action();
                      setGhostMenuOpen(false);
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>,
              document.body
            )}
          </div>

          <div className="ml-2 md:mt-2 md:ml-0 flex flex-row md:flex-col items-center gap-2 shrink-0">
            {options?.sidebarToggles?.showApps !== false && (
              <SidebarButton label="Apps" onClick={() => navigateActiveTab('ghost://apps')}>
                <Blocks size={16} />
              </SidebarButton>
            )}
            {options?.sidebarToggles?.showGames !== false && (
              <SidebarButton label="Games" onClick={() => navigateActiveTab('ghost://games')}>
                <Gamepad2 size={16} />
              </SidebarButton>
            )}
            {options?.sidebarToggles?.showTV !== false && (
              <SidebarButton label="TV" onClick={() => navigateActiveTab('ghost://tv')}>
                <TvMinimalPlay size={16} />
              </SidebarButton>
            )}
            {options?.sidebarToggles?.showMusic !== false && (
              <SidebarButton label="Music" onClick={() => openDefaultMusicProvider()}>
                <Music size={16} />
              </SidebarButton>
            )}
            {options?.sidebarToggles?.showChat === true && (
              <SidebarButton
                label="Chat"
                onClick={() => navigateActiveTab('https://discord.com/app')}
              >
                <LucideIcons.MessageSquare size={16} />
              </SidebarButton>
            )}
            {options?.sidebarToggles?.showRemote !== false && (
              <SidebarButton label="Remote Access" onClick={() => navigateActiveTab('ghost://remote')}>
                <Monitor size={16} />
              </SidebarButton>
            )}
            {options?.sidebarToggles?.showAI !== false && (
              <SidebarButton label="AI" onClick={() => navigateActiveTab('ghost://ai')}>
                <Bot size={16} />
              </SidebarButton>
            )}

            {Array.isArray(options?.sidebarCustomApps) && options.sidebarCustomApps.length > 0 && (
              <>
                <div className="my-2 w-7 h-[2px] rounded-full bg-white/10" />
                {options.sidebarCustomApps.map((app) => {
                  const Icon = getLucideIcon(app.icon);
                  return (
                    <SidebarButton
                      key={app.id}
                      label={app.name}
                      onClick={() => navigateActiveTab(app.url)}
                    >
                      <Icon size={16} />
                    </SidebarButton>
                  );
                })}
              </>
            )}
          </div>

          <div className="shrink-0 mx-2 md:my-6 md:mx-0 w-[2px] md:w-7 h-5 md:h-[2px] rounded-full bg-white/20" />

          <div className="flex flex-row md:flex-col items-center gap-2 shrink-0">
            {options?.sidebarToggles?.showBookmarks !== false && (
              <SidebarButton label="Bookmarks" onClick={() => window.dispatchEvent(new Event('ghost-open-bookmarks'))}>
                <BookOpen size={16} />
              </SidebarButton>
            )}
            {options?.sidebarToggles?.showAdBlock !== false && (
              <div className="relative" ref={adBlockPopupRef}>
                <SidebarButton
                  label="Ad Block"
                  onClick={() => {
                    if (window.innerWidth >= 768) {
                      setAdBlockPopupOpen((prev) => !prev);
                    }
                  }}
                  hideTooltip={adBlockPopupOpen}
                >
                  <ShieldMinus size={16} />
                </SidebarButton>
                {typeof document !== 'undefined' && createPortal(
                  <div
                    ref={adBlockPortalRef}
                    className={`fixed z-[9999] w-64 rounded-xl border border-white/10 bg-[#0f141d] p-2.5 shadow-2xl transition duration-200 origin-bottom md:origin-left ${adBlockPopupOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}
                    style={{
                      top: window.innerWidth < 768 ? Math.max(0, popupCoords.adBlock.top - 160) : Math.min(popupCoords.adBlock.top, window.innerHeight - 200),
                      bottom: window.innerWidth < 768 ? 'auto' : 'auto',
                      left: window.innerWidth < 768 ? Math.max(0, popupCoords.adBlock.left - 100) : popupCoords.adBlock.right + 8
                    }}
                  >
                    {currentSitePolicy?.site ? (
                      <>
                        <p className="text-[11px] opacity-70 px-2.5 pb-2 break-all">Site: {currentSitePolicy.site.label}</p>
                        <button
                          className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-white/10 text-[12px] transition-colors flex items-center justify-between"
                          onClick={() =>
                            updateCurrentSitePolicy({ adBlock: !currentSitePolicy.adBlock })
                          }
                        >
                          <span>Ad Block</span>
                          <span className={currentSitePolicy.adBlock ? 'text-emerald-400' : 'text-white/55'}>
                            {currentSitePolicy.adBlock ? 'On' : 'Off'}
                          </span>
                        </button>
                        <button
                          className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-white/10 text-[12px] transition-colors flex items-center justify-between"
                          onClick={() =>
                            updateCurrentSitePolicy({ popupBlock: !currentSitePolicy.popupBlock })
                          }
                        >
                          <span>Popup Blocker</span>
                          <span className={currentSitePolicy.popupBlock ? 'text-emerald-400' : 'text-white/55'}>
                            {currentSitePolicy.popupBlock ? 'On' : 'Off'}
                          </span>
                        </button>
                        <button
                          className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-white/10 text-[12px] transition-colors flex items-center justify-between"
                          onClick={() =>
                            updateCurrentSitePolicy({ downloadBlock: !currentSitePolicy.downloadBlock })
                          }
                        >
                          <span>Download Blocker</span>
                          <span className={currentSitePolicy.downloadBlock ? 'text-emerald-400' : 'text-white/55'}>
                            {currentSitePolicy.downloadBlock ? 'On' : 'Off'}
                          </span>
                        </button>
                      </>
                    ) : (
                      <p className="text-[12px] opacity-70 px-2.5 py-2">
                        Ad block not available on internal Ghost pages.
                      </p>
                    )}
                  </div>,
                  document.body
                )}
              </div>
            )}
            {options?.sidebarToggles?.showDevOptions !== false && (
              <div className="relative" ref={devOptionsRef}>
                <SidebarButton
                  label="Developer Options"
                  onClick={() => {
                    if (window.innerWidth >= 768) {
                      setDevOptionsOpen((prev) => !prev);
                    }
                  }}
                  hideTooltip={devOptionsOpen}
                >
                  <Wrench size={16} />
                </SidebarButton>
                {typeof document !== 'undefined' && createPortal(
                  <div
                    ref={devOptionsPortalRef}
                    className={`fixed z-[9999] w-48 rounded-xl border border-white/10 bg-[#0f141d] p-2 shadow-2xl transition duration-200 origin-bottom-right md:origin-left ${devOptionsOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}
                    style={{
                      top: window.innerWidth < 768 ? Math.max(0, popupCoords.dev.top - 140) : Math.min(popupCoords.dev.top, window.innerHeight - 150),
                      bottom: window.innerWidth < 768 ? 'auto' : 'auto',
                      left: window.innerWidth < 768 ? Math.max(0, popupCoords.dev.left - 50) : popupCoords.dev.right + 8
                    }}
                  >
                    <button
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-[12px] transition-colors flex items-center gap-2 ${isActiveTabInternalGhost() ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/10'}`}
                      onClick={() => {
                        if (isActiveTabInternalGhost()) return;
                        openDevToolsForActiveTab();
                        setDevOptionsOpen(false);
                      }}
                    >
                      <Wrench size={14} /> DevTools
                    </button>
                    <button
                      className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-white/10 text-[12px] transition-colors flex items-center gap-2"
                      onClick={() => {
                        navigateActiveTab('ghost://code');
                        setDevOptionsOpen(false);
                      }}
                    >
                      <Code2 size={14} /> Code Runner
                    </button>
                    <button
                      className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-white/10 text-[12px] transition-colors flex items-center justify-between"
                      onClick={() => updateOption({ debugMode: !options.debugMode })}
                    >
                      <span>Debug Mode</span>
                      <span className={options.debugMode ? 'text-emerald-400' : 'text-white/60'}>
                        {options.debugMode ? 'On' : 'Off'}
                      </span>
                    </button>
                  </div>,
                  document.body
                )}
              </div>
            )}
            {options?.sidebarToggles?.showHistory !== false && (
              <SidebarButton label="History" onClick={openProxyHistoryPopup}>
                <History size={16} />
              </SidebarButton>
            )}
          </div>

          <div className="ml-auto md:mt-auto md:ml-0 flex flex-row md:flex-col items-center gap-2 shrink-0 pr-1 md:pr-0 md:pb-1">
            {options?.sidebarToggles?.showChangelog !== false && (
              <SidebarButton label="Changelog" onClick={() => setIsChangelogOpen(true)}>
                <Sparkles size={16} />
              </SidebarButton>
            )}
            {options?.sidebarToggles?.showDocs !== false && (
              <SidebarButton label="Docs" onClick={() => navigateActiveTab('ghost://docs')}>
                <Book size={16} />
              </SidebarButton>
            )}
            {options?.sidebarToggles?.showDiscord !== false && (
              <SidebarButton
                label="Discord"
                onClick={() => navigateActiveTab('https://discord.gg/your-discord-link')}
              >
                <Discord fill="currentColor" />
              </SidebarButton>
            )}
            <SidebarButton label="Settings" onClick={() => navigateActiveTab('ghost://settings')}>
              <Settings size={16} />
            </SidebarButton>
          </div>
        </aside>
      )}

      {ui && anySidebarPopupOpen && (
        <button
          type="button"
          aria-label="Close sidebar popup"
          className="fixed inset-0 z-[130] bg-transparent"
          onClick={() => {
            setGhostMenuOpen(false);
            setDevOptionsOpen(false);
            setAdBlockPopupOpen(false);
          }}
        />
      )}

      <div className="flex flex-col flex-1 min-w-0 h-full">
        {ui && (
          <>
            <div
              className="flex flex-col w-full"
              style={barStyle}
              onClick={() => loaderStore.getState().showMenu && loaderStore.getState().toggleMenu()}
            >
              <Tabs />
              <Omnibox />
            </div>
            <Menu />
          </>
        )}
        <div
          className="flex-1 w-full min-h-0"
          onClick={() => loaderStore.getState().showMenu && loaderStore.getState().toggleMenu()}
        >
          <Viewer zoom={zoom} />
        </div>
      </div>

      {ui && geforceHelpOpen && (
        <div className="fixed inset-0 z-[10003] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              const tabId = activeTab?.id;
              if (tabId) {
                setGeforceHelpDismissed((prev) => ({ ...prev, [tabId]: true }));
              }
              setGeforceHelpOpen(false);
            }}
          />
          <div className="relative w-full max-w-md rounded-xl border border-white/10 bg-[#1a252f] p-5 shadow-2xl">
            <h3 className="text-lg font-semibold">Need help setting up Geforce Now?</h3>
            <p className="mt-2 text-sm opacity-80">Read the Docs for support.</p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  const tabId = activeTab?.id;
                  if (tabId) {
                    setGeforceHelpDismissed((prev) => ({ ...prev, [tabId]: true }));
                  }
                  setGeforceHelpOpen(false);
                }}
                className="h-9 px-3 rounded-md border border-white/15 hover:bg-[#ffffff10] text-sm"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const tabId = activeTab?.id;
                  if (tabId) {
                    setGeforceHelpDismissed((prev) => ({ ...prev, [tabId]: true }));
                  }
                  setGeforceHelpOpen(false);
                  navigateActiveTab('ghost://docs');
                }}
                className="h-9 px-3 rounded-md bg-[#1f3a58] hover:bg-[#29507a] text-sm"
              >
                Open Docs
              </button>
            </div>
          </div>
        </div>
      )}

      {ui && showDocsPopup && (
        <div className="fixed inset-0 z-[10004] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowDocsPopup(false)} />
          <div className="relative w-full max-w-xl rounded-lg border border-white/10 bg-[#252f3e] shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h2 className="text-lg font-medium">Please read the Docs!</h2>
              <button
                onClick={() => setShowDocsPopup(false)}
                className="p-1 rounded-md duration-150 hover:bg-[#ffffff0c]"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 text-sm space-y-4">
              <p>
                Welcome to Ghost. To have the best experience, we recommend you first read the
                docs (button in the bottom left). It has info on how to use Ghost and answers
                potential questions.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowDocsPopup(false)}
                  className="px-3 py-2 rounded-md bg-[#ffffff08] hover:bg-[#ffffff12] duration-150"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('ghostDocsPopupDismissed', 'true');
                    setShowDocsPopup(false);
                  }}
                  className="px-3 py-2 rounded-md bg-[#ffffff0c] hover:bg-[#ffffff15] duration-150"
                >
                  Don&apos;t show this again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {ui && historyPopupRender && (
        <div className={"fixed inset-0 z-[10000] flex items-center justify-center p-4 transition-opacity duration-200 " + (historyPopupAnim ? 'opacity-100' : 'opacity-0')}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setHistoryPopupOpen(false)} />
          <div
            className={"relative w-full max-w-4xl max-h-[80dvh] rounded-xl border border-white/10 overflow-hidden transition-all duration-200 " + (historyPopupAnim ? 'opacity-100 scale-100' : 'opacity-0 scale-95')}
            style={{ backgroundColor: options.quickModalBgColor || '#252f3e' }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h2 className="text-lg font-semibold">History</h2>
              <div className="flex items-center gap-2">
                {historyPopupItems.length > 0 && (
                  <button
                    onClick={clearHistoryItems}
                    className="h-8 px-2.5 rounded-md hover:bg-[#ffffff12] text-xs flex items-center gap-1"
                  >
                    <Trash2 size={13} /> Clear
                  </button>
                )}
                <button onClick={() => setHistoryPopupOpen(false)} className="p-1 rounded-md hover:bg-[#ffffff12]">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(80dvh-4rem)] space-y-2">
              <div className="sticky top-0 z-10 pb-2 pt-1" style={{ backgroundColor: options.quickModalBgColor || '#252f3e' }}>
                <input
                  value={historyQuery}
                  onChange={(e) => setHistoryQuery(e.target.value)}
                  placeholder="Search history"
                  className="w-full h-9 rounded-md border border-white/10 bg-[#00000025] px-3 text-sm outline-none"
                />
              </div>
              {filteredHistoryItems.length === 0 && <p className="text-sm opacity-70">No matching history entries.</p>}
              {filteredHistoryItems.map((item) => (
                <div
                  key={item.id || `${item.url}-${item.time}`}
                  onClick={() => openHistoryItem(item)}
                  className="w-full text-left rounded-lg bg-[#ffffff0d] p-3 hover:bg-[#ffffff14] transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.title || item.url}</p>
                      <p className="text-xs opacity-70 break-all">{item.url}</p>
                      <p className="text-xs opacity-60 mt-1">{item.time ? new Date(item.time).toLocaleString() : ''}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeHistoryItem(item.id, `${item.url}-${item.time}`);
                      }}
                      className="p-1.5 rounded-md hover:bg-[#ffffff12]"
                      title="Delete entry"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {ui && findBarOpen && (
        <div className="fixed top-[84px] left-1/2 -translate-x-1/2 z-[10001] rounded-xl border border-white/10 bg-[#1a2330]/95 backdrop-blur px-3 py-2 flex items-center gap-2 shadow-2xl">
          <input
            ref={findInputRef}
            value={findText}
            onChange={(e) => {
              setFindText(e.target.value);
              lastFindText.current = e.target.value;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                runFind(false);
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                setFindBarOpen(false);
              }
            }}
            placeholder="Find in page"
            className="h-9 w-64 rounded-md bg-[#00000030] border border-white/10 px-3 outline-none text-sm"
          />
          <button onClick={() => runFind(true)} className="h-9 px-3 rounded-md hover:bg-[#ffffff12] text-sm flex items-center gap-1">
            <ChevronUp size={14} /> Prev
          </button>
          <button onClick={() => runFind(false)} className="h-9 px-3 rounded-md hover:bg-[#ffffff12] text-sm flex items-center gap-1">
            <ChevronDown size={14} /> Next
          </button>
          <button onClick={() => setFindBarOpen(false)} className="h-9 w-9 rounded-md hover:bg-[#ffffff12] flex items-center justify-center">
            <X size={15} />
          </button>
        </div>
      )
      }

      {
        ui && changelogRender && (
          <div className={"fixed inset-0 z-[10002] flex items-center justify-center p-4 transition-opacity duration-200 " + (changelogAnim ? 'opacity-100' : 'opacity-0')}>
            <div className="fixed inset-0 bg-black/50" onClick={() => setIsChangelogOpen(false)} />

            <div className={"relative w-full max-w-2xl max-h-[80dvh] rounded-lg border border-white/10 shadow-lg overflow-hidden bg-[#1a252f] transition-all duration-200 " + (changelogAnim ? 'opacity-100 scale-100' : 'opacity-0 scale-95')}>
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-lg font-medium">Changelog</h2>
                <button
                  className="p-1 rounded-md hover:bg-[#ffffff0c]"
                  onClick={() => setIsChangelogOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 overflow-y-auto max-h-[calc(80dvh-5rem)]">
                {changelogEntries.map((entry) => (
                  <div key={entry.version} className="mb-6 last:mb-0">
                    <h3 className="font-medium text-lg mb-2">Version {entry.version}</h3>
                    <p className="text-xs opacity-70 mb-3">{entry.date}</p>
                    <ul className="space-y-2 text-sm">
                      {entry.changes.map((change, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-white/60 mt-0.5">•</span>
                          <span>{change}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      }

      {
        ui && activeMusicPrompt && (
          <div className="fixed inset-0 z-[10004] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative w-full max-w-md rounded-xl border border-white/10 bg-[#1a252f] p-5 shadow-2xl">
              <h3 className="text-lg font-semibold">Is this your default music provider?</h3>
              <p className="mt-2 text-sm opacity-80">
                In settings, you can choose to make this service open every time you open music.
              </p>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMusicPromptByTab((prev) => {
                      const next = { ...prev };
                      delete next[activeMusicPrompt.tabId];
                      return next;
                    });
                  }}
                  className="h-9 px-3 rounded-md border border-white/15 hover:bg-[#ffffff10] text-sm"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMusicPromptByTab((prev) => {
                      const next = { ...prev };
                      delete next[activeMusicPrompt.tabId];
                      return next;
                    });
                    navigateActiveTab('ghost://settings');
                  }}
                  className="h-9 px-3 rounded-md bg-[#1f3a58] hover:bg-[#29507a] text-sm"
                >
                  Take me to settings
                </button>
              </div>
            </div>
          </div>
        )
      }

      {
        ui && debugLogsOpen && (
          <div className="fixed inset-0 z-[10005] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/55" onClick={() => setDebugLogsOpen(false)} />
            <div className="relative w-full max-w-6xl h-[78dvh] rounded-xl border border-white/15 bg-[#101722] shadow-2xl overflow-hidden">
              <div className="h-12 px-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-base font-semibold">Console Logs</h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="h-8 px-2.5 rounded-md border border-white/15 hover:bg-white/10 text-xs"
                    onClick={() => setDebugLogs([])}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    className="h-8 px-2.5 rounded-md border border-white/15 hover:bg-white/10 text-xs"
                    onClick={() => setDebugLogsOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="h-[calc(78dvh-3rem)] overflow-y-auto p-3 space-y-1 text-xs font-mono bg-[#0a0f17]">
                {debugLogs.length === 0 && <p className="opacity-70">No logs yet.</p>}
                {debugLogs.map((log) => (
                  <div key={log.id} className="break-words">
                    <span className="opacity-70">[{new Date(log.t).toLocaleTimeString()}] </span>
                    <span className={log.level === 'error' ? 'text-red-300' : log.level === 'warn' ? 'text-yellow-200' : 'text-blue-200'}>
                      {log.level.toUpperCase()}
                    </span>
                    <span>: {log.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      }

      {
        ui && options.debugMode && (
          <div
            className="fixed z-[10004] w-[312px] rounded-lg border border-white/20 bg-[#7c7f85]/35 backdrop-blur-sm px-3 py-2 text-[11px] shadow-2xl"
            style={{ left: `${debugPanelPos.x}px`, top: `${debugPanelPos.y}px` }}
          >
            <div
              className="flex items-center justify-between gap-2 cursor-move select-none"
              onPointerDown={(event) => {
                debugDragRef.current = {
                  active: true,
                  startX: event.clientX,
                  startY: event.clientY,
                  originX: debugPanelPos.x,
                  originY: debugPanelPos.y,
                };
              }}
            >
              <span className="font-semibold">Debug Mode</span>
              <button
                type="button"
                className="h-5 w-5 rounded hover:bg-black/20 flex items-center justify-center"
                onClick={() => updateOption({ debugMode: false })}
              >
                <X size={12} />
              </button>
            </div>

            <div className="mt-2 space-y-1 text-white/95">
              <div>FPS: {debugStats.fps}</div>
              <div>RAM Usage: {debugStats.ram || 'N/A'}</div>
              <div>User Agent: {navigator.userAgent}</div>
              <div>Resolution: {window.innerWidth}×{window.innerHeight}</div>
              <div>Connection Speed: {debugStats.connection}</div>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <button
                type="button"
                className="h-7 px-2 rounded border border-white/20 hover:bg-black/15"
                onClick={() => setDebugLogsOpen((prev) => !prev)}
              >
                View Console Logs
              </button>
            </div>
          </div>
        )
      }
    </div >
  );
}
