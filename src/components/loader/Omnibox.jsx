import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  House,
  Bookmark,
  Settings2,
  Menu,
  SquareArrowOutUpRight,
  Info,
  Search,
  Lock,
  Sparkles,
} from 'lucide-react';
import clsx from 'clsx';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import loaderStore from '/src/utils/hooks/loader/useLoaderStore';
import { process, openEmbed, toGhostDisplayUrl, isInternalGhostTabUrl } from '/src/utils/hooks/loader/utils';
import { useOptions } from '/src/utils/optionsContext';
import { createId } from '/src/utils/id';
import { useLocation, useNavigate } from 'react-router-dom';
import { prConfig, themeConfig, searchConfig } from '/src/utils/config';
import SwitchComponent from '../settings/components/Switch';
import ComboBox from '../settings/components/Combobox';
import TextInput from '../settings/components/Input';

const Action = ({ Icon, size = 15, action = () => { }, disabled = false }) => {
  const { options } = useOptions();
  return (
    <button
      className={clsx(
        'flex justify-center items-center',
        'h-6 w-7 rounded-md',
        disabled ? 'cursor-not-allowed opacity-70' : '',
        options.type != 'light' ? 'hover:bg-[#fff3]' : 'hover:bg-[#97979773]',
      )}
      onClick={(e) => {
        if (!disabled) {
          action(e);
        }
      }}
    >
      <Icon size={size} />
    </button>
  );
};

const Omnibox = () => {
  const [Icon, setIcon] = useState(Info);
  const activeTab = loaderStore((state) => state.tabs.find((tab) => tab.active));
  const activeTabId = activeTab?.id;
  const { updateUrl, refreshTab, goBack, goForward, toggleMenu, showUI, setIframeUrl } = loaderStore();
  const inputRef = useRef(null);
  const suggestPanelRef = useRef(null);
  const quickPanelRef = useRef(null);
  const { options, updateOption } = useOptions();
  const { state } = useLocation();
  const navigate = useNavigate();
  const activeFrameUrl = loaderStore((state) => (activeTabId ? state.iframeUrls[activeTabId] : ''));
  const popupBlockedForInternalPage = useMemo(
    () => isInternalGhostTabUrl(activeTab?.url, activeFrameUrl),
    [activeTab?.url, activeFrameUrl],
  );
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickRender, setQuickRender] = useState(false);
  const [quickAnim, setQuickAnim] = useState(false);
  const [results, setResults] = useState([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const debounceRef = useRef(null);
  const latestQuery = useRef('');
  const isEditingRef = useRef(false);
  const suppressSuggestionsRef = useRef(false);

  const getPreferredRawUrl = useCallback((tab, frameUrl) => {
    if (!tab) return '';
    const tabUrl = String(tab.url || '').trim();
    if (!tabUrl) return String(frameUrl || '').trim();
    if (tabUrl === 'tabs://new') return tabUrl;
    const ghostDisplay = toGhostDisplayUrl(tabUrl);
    if (ghostDisplay) return tabUrl;
    return String(frameUrl || '').trim() || tabUrl;
  }, []);

  const isProcied = (url) => url?.includes('/uv/service/') || url?.includes('/scramjet/');
  const isNewTab = (url) => !url || url === 'tabs://new' || url.endsWith('/new');

  const normalizeUrl = (value) => {
    if (!value) return '';
    try {
      const parsed = new URL(String(value));
      return parsed.toString().replace(/\/$/, '');
    } catch {
      return String(value).trim().replace(/\/$/, '');
    }
  };

  const getActiveDecodedUrl = () => {
    const raw = getPreferredRawUrl(activeTab, activeFrameUrl);
    if (!raw || raw === 'tabs://new') return '';
    return normalizeUrl(process(raw, true, options.prType || 'auto', options.engine || undefined));
  };

  const isCurrentBookmarked = useMemo(() => {
    const current = getActiveDecodedUrl();
    if (!current) return false;
    const bookmarks = Array.isArray(options.bookmarks) ? options.bookmarks : [];
    return bookmarks.some((item) => normalizeUrl(item?.url) === current);
  }, [activeTab?.url, options.bookmarks, options.prType, options.engine]);

  useEffect(() => {
    // Clear search suggestions when the active tab changes
    setResults([]);
    setSuggestOpen(false);
    latestQuery.current = '';
    // Also reset input if not editing
    if (!isEditingRef.current && activeTab) {
      // logic is handled in other useEffect, but ensure suggestions are gone.
    }
  }, [activeTab?.id]);

  const updateIcon = (url) => {
    const ghostDisplay = toGhostDisplayUrl(url);
    if (ghostDisplay) {
      setIcon(Info);
      return;
    }

    if (isNewTab(url)) {
      setIcon(Info);
    } else if (isProcied(url)) {
      const decoded = process(url, true, options.prType || 'auto', options.engine || undefined);
      setIcon(decoded.startsWith('https://') ? Lock : Info);
    } else {
      setIcon(Info);
    }
  };


  const getDisplayUrl = (url) => {
    if (isNewTab(url)) return 'ghost://home';

    const ghostDisplay = toGhostDisplayUrl(url);
    if (ghostDisplay) return ghostDisplay;

    if (isProcied(url)) {
      const decoded = process(url, true, options.prType || 'auto', options.engine || undefined);
      const decodedGhost = toGhostDisplayUrl(decoded);
      if (decodedGhost) return decodedGhost;
      return decoded.startsWith('https://') ? decoded.slice(8) : decoded;
    }
    return url;
  };

  const [input, setInput] = useState(getDisplayUrl(activeTab?.url));
  const activeEngineName = useMemo(() => {
    const currentEngine = String(options.engine || '').trim();
    if (!currentEngine) return 'Google';
    const matched = searchConfig.find((entry) => entry?.value?.engine === currentEngine);
    return matched?.value?.engineName || 'Google';
  }, [options.engine]);
  const omniboxPlaceholder = `Search with ${activeEngineName} or enter address`;
  const suggestionPanelBg = options.menuColor || options.quickModalBgColor || '#0e131b';
  const suggestionPanelText = options.siteTextColor || '#d7dfef';

  useEffect(() => {
    if (!activeTab) return;
    if (isEditingRef.current) return;

    const raw = getPreferredRawUrl(activeTab, activeFrameUrl);
    const next = getDisplayUrl(raw);
    setInput(next);
    updateIcon(raw);
  }, [activeTab?.id, activeTab?.url, activeFrameUrl, options.prType, options.engine, getPreferredRawUrl]);

  useEffect(() => {
    if (state?.url && activeTab) {
      if (state?.openInGhostNewTab) return;
      updateUrl(activeTab.id, process(state.url, false, options.prType || 'auto', options.engine || undefined));
      navigate('.', { replace: true, state: {} });
    }
  }, [state?.url, state?.openInGhostNewTab, activeTab?.id]);

  useEffect(() => {
    if (activeTab) {
      updateIcon(activeTab.url);
    }
  }, [activeTab]);

  useEffect(() => {
    const close = (event) => {
      if (!quickOpen) return;
      if (quickPanelRef.current?.contains(event.target)) return;
      setQuickOpen(false);
    };
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [quickOpen]);

  useEffect(() => {
    if (quickOpen) {
      setQuickAnim(false);
      setQuickRender(true);
      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setQuickAnim(true));
      });
      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }

    setQuickAnim(false);
    const t = setTimeout(() => setQuickRender(false), 180);
    return () => clearTimeout(t);
  }, [quickOpen]);

  useEffect(() => {
    const closeSuggest = (event) => {
      if (!suggestOpen) return;
      if (suggestPanelRef.current?.contains(event.target)) return;
      setSuggestOpen(false);
    };
    window.addEventListener('pointerdown', closeSuggest);
    return () => window.removeEventListener('pointerdown', closeSuggest);
  }, [suggestOpen]);

  useEffect(() => {
    const closeFromViewer = () => setSuggestOpen(false);
    window.addEventListener('ghost-close-omnibox-suggestions', closeFromViewer);
    return () => window.removeEventListener('ghost-close-omnibox-suggestions', closeFromViewer);
  }, []);

  useEffect(() => {
    const closeAll = () => {
      setQuickOpen(false);
      setSuggestOpen(false);
    };
    window.addEventListener('ghost-close-all-loader-popups', closeAll);
    return () => window.removeEventListener('ghost-close-all-loader-popups', closeAll);
  }, []);

  useEffect(() => {
    if (options.searchRecommendationsTop === false) {
      setResults([]);
      setSuggestOpen(false);
      latestQuery.current = '';
    }
  }, [options.searchRecommendationsTop]);

  useEffect(() => {
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const store = loaderStore.getState();
      const current = store.tabs.find((tab) => tab.active);
      if (!current) return;
      const raw = getPreferredRawUrl(current, store.iframeUrls[current.id]);
      const next = getDisplayUrl(raw);
      if (!isEditingRef.current) {
        setInput((prev) => (prev === next ? prev : next));
      }
      updateIcon(raw);
    }, 350);
    return () => clearInterval(interval);
  }, [options.prType, options.engine, getPreferredRawUrl]);

  const fetchResults = useCallback(async (searchQuery) => {
    if (!searchQuery.trim() || options.searchRecommendationsTop === false || suppressSuggestionsRef.current) {
      setResults([]);
      setSuggestOpen(false);
      return;
    }

    latestQuery.current = searchQuery;
    try {
      let data = null;

      const localResponse = await fetch('/return?q=' + encodeURIComponent(searchQuery));
      if (localResponse.ok) {
        data = await localResponse.json();
      } else {
        const fallbackResponse = await fetch(
          'https://duckduckgo.com/ac/?q=' + encodeURIComponent(searchQuery) + '&type=list',
        );
        if (!fallbackResponse.ok) return setResults([]);
        data = await fallbackResponse.json();
      }

      if (latestQuery.current !== searchQuery) return;
      const list = Array.isArray(data) ? data.filter((i) => i.phrase).slice(0, 6) : [];
      setResults(list);
      setSuggestOpen(list.length > 0);
    } catch {
      if (latestQuery.current === searchQuery) {
        setResults([]);
        setSuggestOpen(false);
      }
    }
  }, [options.searchRecommendationsTop]);

  const addCurrentToBookmarks = () => {
    if (popupBlockedForInternalPage) return;
    const decoded = getActiveDecodedUrl();
    if (!decoded) return;
    const currentBookmarks = Array.isArray(options.bookmarks) ? options.bookmarks : [];
    const exists = currentBookmarks.some((item) => normalizeUrl(item?.url) === decoded);

    if (exists) {
      updateOption({
        bookmarks: currentBookmarks.filter((item) => normalizeUrl(item?.url) !== decoded),
      });
      return;
    }

    updateOption({
      bookmarks: [
        {
          id: createId(),
          name: activeTab?.title || 'Saved Page',
          url: decoded,
          icon: null,
        },
        ...currentBookmarks,
      ],
    });
  };

  return (
    <div className={clsx("h-10 flex items-center gap-1 px-2", showUI ? '' : 'hidden')}>
      <Action
        Icon={ArrowLeft}
        size="17"
        action={() =>
          activeTab &&
          goBack(activeTab.id, () => {
            setInput('');
          })
        }
      />
      {/** ^^ callback used if going back to a new tab only */}
      <Action Icon={ArrowRight} size="17" action={() => activeTab && goForward(activeTab.id)} />
      <Action Icon={RotateCw} size="16" action={() => activeTab && refreshTab(activeTab.id)} />
      <Action
        Icon={House}
        size="16"
        action={() => {
          if (!activeTab) return;
          updateUrl(activeTab.id, process('ghost://home', false, options.prType || 'auto', options.engine || undefined));
          setInput('ghost://home');
        }}
      />
      <div
        ref={suggestPanelRef}
        className={clsx(
          ' h-[calc(100%-8px)] w-full',
          'rounded-lg border-1 flex items-center px-2 ml-1 mr-1 relative',
        )}
        style={{
          backgroundColor: options.omninputColor || '#06080d8f',
          borderColor: options.type == 'light' ? '#a1a1a173' : "#efefef30",
        }}
      >
        <Icon size="15" />
        <input
          id="ghost-omnibox-input"
          data-ghost-omnibox="1"
          className="h-full w-full outline-0 text-[0.8rem] ml-2 pr-12"
          placeholder={omniboxPlaceholder}
          onSelect={() => setIcon(Search)}
          onBlur={() => {
            isEditingRef.current = false;
            const raw = activeTab ? getPreferredRawUrl(activeTab, activeFrameUrl) : '';
            setInput(getDisplayUrl(raw));
            updateIcon(raw);
          }}
          onFocus={() => {
            isEditingRef.current = true;
            if (results.length > 0) setSuggestOpen(true);
          }}
          value={input}
          ref={inputRef}
          onChange={(e) => {
            const next = e.target.value;
            suppressSuggestionsRef.current = false;
            setInput(next);

            if (debounceRef.current) clearTimeout(debounceRef.current);
            if (!next.trim() || /^ghost:\/\//i.test(next) || options.searchRecommendationsTop === false) {
              latestQuery.current = '';
              setResults([]);
              setSuggestOpen(false);
              return;
            }

            debounceRef.current = setTimeout(() => fetchResults(next), 230);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && activeTab && input.length !== 0) {
              const typed = input.trim();
              const processed = process(typed, false, options.prType || 'auto', options.engine || undefined);
              suppressSuggestionsRef.current = true;
              latestQuery.current = '';
              if (debounceRef.current) {
                clearTimeout(debounceRef.current);
                debounceRef.current = null;
              }
              if (/^ghost:\/\//i.test(typed)) {
                updateUrl(activeTab.id, processed);
                const normalizedTyped = typed.toLowerCase();
                if (
                  normalizedTyped === 'ghost://home' ||
                  normalizedTyped === 'ghost://new-tab' ||
                  normalizedTyped === 'ghost://newtab'
                ) {
                  setIframeUrl(activeTab.id, 'ghost://home');
                }
              } else {
                updateUrl(activeTab.id, processed);
              }
              inputRef.current.blur();
              setResults([]);
              setSuggestOpen(false);
            }
          }}
        ></input>
        <button
          className={clsx(
            'h-7 w-7 rounded-md flex items-center justify-center absolute right-0.5 top-1/2 -translate-y-1/2',
            options.type != 'light' ? 'hover:bg-[#fff3]' : 'hover:bg-[#97979773]',
          )}
          title={isCurrentBookmarked ? 'Remove bookmark' : 'Bookmark current page'}
          onClick={addCurrentToBookmarks}
          disabled={!activeTab?.url || activeTab.url === 'tabs://new' || popupBlockedForInternalPage}
        >
          <Bookmark
            size={15}
            className={clsx(
              !activeTab?.url || activeTab.url === 'tabs://new' || popupBlockedForInternalPage ? 'opacity-50' : '',
              isCurrentBookmarked ? 'text-yellow-400' : '',
            )}
            fill={isCurrentBookmarked ? 'currentColor' : 'none'}
          />
        </button>

        {suggestOpen && results.length > 0 && (
          <div
            className="absolute left-0 right-0 top-[calc(100%+6px)] rounded-xl border border-white/12 shadow-[0_14px_32px_rgba(0,0,0,0.45)] p-1.5 z-[170]"
            style={{ backgroundColor: suggestionPanelBg, color: suggestionPanelText }}
          >
            {results.map((result) => (
              <button
                key={result.phrase}
                type="button"
                className={clsx(
                  'w-full h-9 rounded-lg px-2.5 text-left text-sm transition-colors flex items-center gap-2',
                  options.type !== 'light' ? 'hover:bg-white/10' : 'hover:bg-black/10',
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  if (!activeTab) return;
                  setInput(result.phrase);
                  updateUrl(activeTab.id, process(result.phrase, false, options.prType || 'auto', options.engine || undefined));
                  setSuggestOpen(false);
                }}
              >
                <Sparkles size={14} className="opacity-75 text-current" />
                <span className="truncate">{result.phrase}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <Action
        Icon={SquareArrowOutUpRight}
        size="15"
        action={() => {
          if (popupBlockedForInternalPage) return;
          openEmbed(activeTab?.url);
        }}
        disabled={popupBlockedForInternalPage}
      />
      <div className="relative" ref={quickPanelRef}>
        <Action Icon={Settings2} size="17" action={() => setQuickOpen((prev) => !prev)} />
        {quickRender && (
          <>
            <button
              type="button"
              aria-label="Close quick settings"
              className={
                'fixed inset-0 z-[150] bg-transparent transition-opacity duration-200 ' +
                (quickAnim ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none')
              }
              onClick={() => setQuickOpen(false)}
            />
            <div
              className={
                'absolute right-0 top-9 w-[18rem] rounded-xl border border-white/10 p-3 shadow-[0_16px_36px_rgba(0,0,0,0.45)] z-[160] backdrop-blur-md transition-all duration-200 origin-top-right ' +
                (quickAnim ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none')
              }
              style={{ backgroundColor: options.menuColor || '#171d29' }}
            >

              <div className="space-y-2.5 text-sm">
                <label className="block">
                  <span className="text-xs opacity-70 mb-1 block">Proxy Backend</span>
                  <ComboBox
                    config={prConfig}
                    selectedValue={prConfig.find((x) => x.value.prType === (options.prType || 'scr')) || prConfig[0]}
                    action={(item) => updateOption({ prType: item?.prType || 'scr' })}
                    maxW={58}
                    compact
                  />
                </label>

                <label className="block">
                  <span className="text-xs opacity-70 mb-1 block">Wisp Server</span>
                  <TextInput
                    defValue={options.wServer || ''}
                    onChange={(val) => updateOption({ wServer: val || null, proxyRouting: 'direct' })}
                    placeholder={'wss://dogekeepthisasecret.undoanarchy.rocks/wisp/'}
                    maxW={58}
                    compact
                    live
                  />
                </label>

                <label className="block">
                  <span className="text-xs opacity-70 mb-1 block">Proxy Routing</span>
                  <ComboBox
                    config={[
                      { option: 'Direct', value: 'direct' },
                      { option: 'Remote Proxy Server', value: 'remote' },
                    ]}
                    selectedValue={[
                      { option: 'Direct', value: 'direct' },
                      { option: 'Remote Proxy Server', value: 'remote' },
                    ].find((x) => x.value === (options.proxyRouting || 'direct'))}
                    action={(item) => updateOption({ proxyRouting: item || 'direct' })}
                    maxW={58}
                    compact
                  />
                </label>

                {(options.proxyRouting || 'direct') === 'remote' && (
                  <label className="block">
                    <span className="text-xs opacity-70 mb-1 block">Remote Proxy Server</span>
                    <TextInput
                      defValue={options.remoteProxyServer || ''}
                      onChange={(val) => updateOption({ remoteProxyServer: (val || '').trim() })}
                      placeholder="https://your-proxy-domain"
                      maxW={58}
                      compact
                      live
                    />
                  </label>
                )}

                <label className="block">
                  <span className="text-xs opacity-70 mb-1 block">Transport</span>
                  <ComboBox
                    config={[
                      { option: 'Epoxy', value: 'epoxy' },
                      { option: 'LibCurl', value: 'libcurl' },
                    ]}
                    selectedValue={[
                      { option: 'Epoxy', value: 'epoxy' },
                      { option: 'LibCurl', value: 'libcurl' },
                    ].find((x) => x.value === (options.transport || 'libcurl'))}
                    action={(item) => updateOption({ transport: item || 'libcurl' })}
                    maxW={58}
                    compact
                  />
                </label>

                <label className="block">
                  <span className="text-xs opacity-70 mb-1 block">Theme</span>
                  <ComboBox
                    config={themeConfig}
                    selectedValue={themeConfig.find((x) => x.value.themeName === (options.themeName || 'defaultTheme')) || themeConfig[0]}
                    action={(item) => updateOption(item || {})}
                    maxW={58}
                    compact
                  />
                </label>

                <label className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2.5" style={{ backgroundColor: '#00000020' }}>
                  <span className="text-xs opacity-80">Search Recommendations</span>
                  <SwitchComponent
                    value={options.searchRecommendationsTop !== false}
                    action={(val) => updateOption({ searchRecommendationsTop: val })}
                    size="sm"
                  />
                </label>
              </div>
            </div>
          </>
        )}
      </div>
      <Action Icon={Menu} size="17" action={(e) => {
        e?.stopPropagation();
        toggleMenu();
      }} />
    </div>
  );
};

export default Omnibox;