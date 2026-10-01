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
  SquareSplitHorizontal,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Music2,
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
  const allTabs = loaderStore((state) => state.tabs);
  const activeTabId = activeTab?.id;
  const { updateUrl, refreshTab, goBack, goForward, toggleMenu, showUI, setIframeUrl, toggleSidebar } = loaderStore();
  const inputRef = useRef(null);
  const suggestPanelRef = useRef(null);
  const quickPanelRef = useRef(null);
  const mediaPanelRef = useRef(null);
  const mediaSeekFramesRef = useRef(new Map());
  const mediaSeekValuesRef = useRef(new Map());
  const { options, updateOption } = useOptions();
  
  const [mediaExpanded, setMediaExpanded] = useState(false);
  const [mediaSeekDrafts, setMediaSeekDrafts] = useState({});
  const activeTabMedia = activeTab?.mediaState || { playing: false, title: '', artist: '', artwork: '' };
  const mediaState = { ...activeTabMedia, expanded: mediaExpanded };
  const isLight = options.type === 'light' || options.theme === 'light' || options.themeName === 'lightTheme';

  const sendMediaCommand = (command, tabId = null, time = null) => {
    const message = { type: 'GHOST_MEDIA_COMMAND', command, ...(tabId ? { tabId } : {}), ...(time !== null ? { time } : {}) };
    document.querySelectorAll('iframe').forEach((iframe) => {
      if (tabId && iframe.getAttribute('data-ghost-tab-id') !== String(tabId)) return;
      try {
        iframe.contentWindow?.postMessage(message, '*');
      } catch { }
      try {
        const media = Array.from(iframe.contentWindow?.document?.querySelectorAll('audio, video') || []);
        if (command === 'play') media.forEach((item) => { try { item.play?.().catch(() => {}); } catch { } });
        if (command === 'pause') media.forEach((item) => { try { item.pause?.(); } catch { } });
        if (command === 'seek') media.forEach((item) => {
          try {
            if (Number.isFinite(Number(time))) item.currentTime = Number(time);
          } catch { }
        });
        if (command === 'nexttrack' || command === 'previoustrack') {
          const selectors = command === 'nexttrack'
            ? '[aria-label*="next" i], [title*="next" i], #fs-next-btn, #next-btn, [data-action="next-track"], [data-action="next"]'
            : '[aria-label*="prev" i], [aria-label*="previous" i], [title*="prev" i], [title*="previous" i], #fs-prev-btn, #prev-btn, [data-action="previous-track"], [data-action="previous"]';
          iframe.contentWindow?.document?.querySelector(selectors)?.click?.();
        }
      } catch { }
    });
  };

  const sendMediaSeek = (tabId, time) => {
    mediaSeekValuesRef.current.set(tabId, time);
    if (mediaSeekFramesRef.current.has(tabId)) return;
    const frame = requestAnimationFrame(() => {
      mediaSeekFramesRef.current.delete(tabId);
      sendMediaCommand('seek', tabId, mediaSeekValuesRef.current.get(tabId));
    });
    mediaSeekFramesRef.current.set(tabId, frame);
  };

  const formatMediaTime = (value) => {
    const seconds = Math.max(0, Math.floor(Number(value) || 0));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  };

  const formatMediaLabel = (mediaTitle, artist, tabTitle) => {
    const title = String(mediaTitle || '').trim();
    const byline = String(artist || '').trim();
    const site = String(tabTitle || '').trim();
    const track = title && byline ? `${title} by ${byline}` : title || byline || 'Unknown media';
    return site && site.toLowerCase() !== track.toLowerCase() ? `${track} - ${site}` : track;
  };

  useEffect(() => {
    const handleMediaMessage = (e) => {
       if (e.data && e.data.type === 'GHOST_MEDIA_STATE') {
         if (e.data.tabId) {
           const hasMedia = Number(e.data.mediaCount) > 0;
           const hasMediaMetadata = Boolean(e.data.title || e.data.artist || e.data.artwork);
           loaderStore.getState().updateMediaState(
             e.data.tabId,
             e.data.playing || hasMediaMetadata || hasMedia
               ? {
                 playing: !!e.data.playing,
                 title: e.data.title || '',
                 artist: e.data.artist || '',
                 artwork: e.data.artwork || '',
                 mediaCount: Number(e.data.mediaCount) || 0,
                 mediaKind: e.data.mediaKind || 'audio',
                 currentTime: Number(e.data.currentTime) || 0,
                 duration: Number(e.data.duration) || 0,
               }
               : undefined,
          );
        }
      }
    };
    window.addEventListener('message', handleMediaMessage);
    return () => window.removeEventListener('message', handleMediaMessage);
  }, []);

  useEffect(() => {
    if (!mediaExpanded) return undefined;

    const closeMedia = (event) => {
      if (mediaPanelRef.current?.contains(event.target)) return;
      setMediaExpanded(false);
    };

// clicks inside a proxied iframe dont bubble up here so treat any
// interaction with a frame as an outside click too
    const bindFrameListeners = () => {
      document.querySelectorAll('iframe').forEach((frame) => {
        try {
          const frameWindow = frame.contentWindow;
          if (!frameWindow || frameWindow.__ghostMediaOutsideBound) return;
          frameWindow.__ghostMediaOutsideBound = true;
          frameWindow.addEventListener('pointerdown', () => setMediaExpanded(false));
        } catch {
          // cross-origin frames fall back to the window blur handler
        }
      });
    };

    const onWindowBlur = () => {
      window.setTimeout(() => {
        const active = document.activeElement;
        if (active && active.tagName === 'IFRAME') setMediaExpanded(false);
      }, 0);
    };

    document.addEventListener('pointerdown', closeMedia, true);
    window.addEventListener('blur', onWindowBlur);
    bindFrameListeners();
    const frameObserver = window.setInterval(bindFrameListeners, 2000);

    return () => {
      document.removeEventListener('pointerdown', closeMedia, true);
      window.removeEventListener('blur', onWindowBlur);
      window.clearInterval(frameObserver);
    };
  }, [mediaExpanded]);
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
    const frame = String(frameUrl || '').trim();
    if (frame && frame !== 'about:blank' && !frame.startsWith('ghost://') && !frame.startsWith('tabs://')) {
      return frame;
    }

    if (!tabUrl) return frame;
    if (tabUrl === 'tabs://new') return tabUrl;
    const ghostDisplay = toGhostDisplayUrl(tabUrl);
    if (ghostDisplay) return tabUrl;

    return frame || tabUrl;
  }, [options.prType, options.engine]);

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
    // clear search suggestions when the active tab changes
    setResults([]);
    setSuggestOpen(false);
    latestQuery.current = '';
    // also reset input if not editing
    if (!isEditingRef.current && activeTab) {
      // handled in another useeffect, just make sure the suggestions are gone
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


  const getDisplayUrl = (url, displayUrl = '') => {
    const masked = String(displayUrl || '').trim();
    if (masked) return masked;

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

  const [input, setInput] = useState(getDisplayUrl(activeTab?.url, activeTab?.displayUrl));
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
    const next = getDisplayUrl(raw, activeTab?.displayUrl);
    setInput(next);
    if (inputRef.current) inputRef.current.textContent = next;
    updateIcon(raw);
  }, [activeTab?.id, activeTab?.url, activeTab?.displayUrl, activeFrameUrl, options.prType, options.engine, getPreferredRawUrl]);

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
      {/* only used when going back to a new tab */}
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
          'ghost-glass-tint h-[calc(100%-8px)] w-full',
          'rounded-lg border-1 flex items-center px-2 ml-1 mr-1 relative',
        )}
        style={{
          backgroundColor: options.omninputColor || '#06080d8f',
          borderColor: options.type == 'light' ? '#a1a1a173' : "#efefef30",
        }}
      >
        <Icon size="15" />
        <div
          id="ghost-omnibox-input"
          data-ghost-omnibox="1"
          contentEditable="plaintext-only"
          suppressContentEditableWarning
          className="h-full w-full outline-0 text-[0.8rem] ml-2 pr-12 whitespace-nowrap overflow-hidden flex items-center empty:before:content-[attr(data-placeholder)] cursor-text"
          data-placeholder={omniboxPlaceholder}
          onMouseUp={() => setIcon(Search)}
          onBlur={(e) => {
            isEditingRef.current = false;
            if (activeTab) {
              const raw = getPreferredRawUrl(activeTab, activeFrameUrl);
              const display = getDisplayUrl(raw, activeTab?.displayUrl);
              setInput(display);
              if (inputRef.current) inputRef.current.textContent = display;
              updateIcon(raw);
            }
          }}
          onFocus={() => {
            isEditingRef.current = true;
            if (results.length > 0) setSuggestOpen(true);
          }}
          ref={inputRef}
          onInput={(e) => {
            const next = e.currentTarget.textContent;
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
              e.preventDefault();
              const typed = inputRef.current.textContent.trim();
              const masked = String(activeTab.displayUrl || '').trim();
              if (masked && typed.toLowerCase() === masked.toLowerCase()) {
                inputRef.current.blur();
                setResults([]);
                setSuggestOpen(false);
                return;
              }

              const processed = process(typed, false, options.prType || 'auto', options.engine || undefined);
              suppressSuggestionsRef.current = true;
              latestQuery.current = '';
              if (debounceRef.current) {
                clearTimeout(debounceRef.current);
                debounceRef.current = null;
              }
              if (/^ghost:\/\//i.test(typed)) {
                updateUrl(activeTab.id, typed);
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
        />
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
            className="ghost-glass absolute left-0 right-0 top-[calc(100%+6px)] rounded-xl border border-white/12 shadow-[0_14px_32px_rgba(0,0,0,0.45)] p-1.5 z-[170]"
            style={{ backgroundColor: suggestionPanelBg, color: suggestionPanelText }}
          >
            {results.map((result) => (
              <button
                key={result.phrase}
                type="button"
                className={clsx(
                  'w-full h-9 rounded-lg px-2.5 text-left text-sm transition-colors flex items-center gap-2',
                  !isLight ? 'hover:bg-white/10' : 'hover:bg-black/10',
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

      {/* media controls pill */}
      <div className="relative flex-shrink-0" ref={mediaPanelRef}>
        {(() => {
           const playingTabs = allTabs.filter((t) => t.mediaState?.playing);
           const mediaTabs = allTabs.filter((t) => t.mediaState?.mediaCount > 0 || t.mediaState?.playing);
           const hasAnyPlaying = playingTabs.length > 0;
           const hasAnyMedia = mediaTabs.length > 0;
          return (
            <>
              <div
                className={clsx(
                  "h-7 rounded-full flex items-center px-2 gap-1.5 cursor-pointer text-xs border border-white/10 transition-colors select-none ml-1 mr-1",
                   isLight
                    ? (hasAnyPlaying ? "border-black/10 bg-black/10 hover:bg-black/15 text-[#0f172a]" : "border-black/10 bg-black/5 hover:bg-black/10 text-black/55")
                    : (hasAnyPlaying ? "bg-[#ffffff15] hover:bg-[#ffffff20] text-white" : "bg-[#ffffff05] hover:bg-[#ffffff10] text-white/50")
                )}
                onClick={() => setMediaExpanded((prev) => !prev)}
                 title={hasAnyPlaying ? `${playingTabs.length} tab(s) playing` : hasAnyMedia ? 'Media detected' : 'No audio'}
              >
                 <Music2 size={13} className={hasAnyPlaying ? "animate-pulse" : hasAnyMedia ? "text-current" : ""} />
                <span className="max-w-[100px] truncate">
                    {hasAnyPlaying ? (playingTabs.length === 1 ? formatMediaLabel(playingTabs[0].mediaState.title, playingTabs[0].mediaState.artist, playingTabs[0].title) : `${playingTabs.length} playing`) : hasAnyMedia ? 'Media ready' : "Nothing playing"}
                </span>
                <div className="flex items-center gap-0.5 ml-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    className={clsx('p-0.5 rounded-sm opacity-70 hover:opacity-100', isLight ? 'hover:bg-black/10' : 'hover:bg-white/20')}
                    title="Previous track"
                     onClick={() => sendMediaCommand('previoustrack')}
                  >
                    <SkipBack size={12} />
                  </button>
                  <button
                      className={clsx('p-0.5 rounded-sm opacity-70 hover:opacity-100', isLight ? 'hover:bg-black/10' : 'hover:bg-white/20')}
                    onClick={() => {
                       sendMediaCommand(hasAnyPlaying ? 'pause' : 'play');
                    }}
                  >
                    {hasAnyPlaying ? <Pause size={12} /> : <Play size={12} />}
                  </button>
                  <button
                      className={clsx('p-0.5 rounded-sm opacity-70 hover:opacity-100', isLight ? 'hover:bg-black/10' : 'hover:bg-white/20')}
                    title="Next track"
                     onClick={() => sendMediaCommand('nexttrack')}
                  >
                    <SkipForward size={12} />
                  </button>
                </div>
              </div>
              {mediaState.expanded && (
                <div
                  className="ghost-glass absolute right-0 top-9 w-72 rounded-xl border border-white/12 p-3 shadow-2xl z-[180] max-h-[60vh] overflow-y-auto"
                   style={{ backgroundColor: options.menuColor || (isLight ? '#f8fafc' : '#171d29'), color: options.siteTextColor || (isLight ? '#0f172a' : '#fff') }}
                >
                   {mediaTabs.length === 0 ? (
                    <div className="flex items-center gap-3 opacity-70">
                      <div className="w-14 h-14 bg-black/20 rounded-md flex items-center justify-center border border-white/5 shrink-0"><Music2 size={24} className="opacity-30" /></div>
                      <span className="text-sm">Nothing playing</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                       {mediaTabs.map((t) => (
                         <div key={t.id} className="flex items-center gap-3 rounded-lg border border-white/10 p-2" style={{ backgroundColor: isLight ? 'rgba(15,23,42,0.04)' : 'rgba(255,255,255,0.04)' }}>
                          <div className="w-10 h-10 bg-black/20 rounded-md overflow-hidden flex items-center justify-center border border-white/5 shrink-0">
                            {t.mediaState?.artwork ? <img src={t.mediaState.artwork} alt="" className="w-full h-full object-cover" /> : <Music2 size={16} className="opacity-30" />}
                          </div>
                           <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold truncate">{formatMediaLabel(t.mediaState?.title, t.mediaState?.artist, t.title)}</p>
                             {Number(t.mediaState?.duration) > 0 && (
                               <div className="mt-1">
                                 <input
                                   type="range"
                                   min="0"
                                   max={t.mediaState.duration}
                                    step="1"
                                   value={Object.prototype.hasOwnProperty.call(mediaSeekDrafts, t.id)
                                     ? mediaSeekDrafts[t.id]
                                     : Math.min(t.mediaState.duration, t.mediaState.currentTime || 0)}
                                   onInput={(event) => {
                                     const value = Number(event.target.value);
                                     setMediaSeekDrafts((drafts) => ({ ...drafts, [t.id]: value }));
                                     sendMediaSeek(t.id, value);
                                   }}
                                   onPointerUp={() => {
                                     window.setTimeout(() => setMediaSeekDrafts((drafts) => {
                                       const next = { ...drafts };
                                       delete next[t.id];
                                       return next;
                                     }), 250);
                                   }}
                                    className="media-seek-slider w-full h-1 cursor-pointer"
                                   aria-label="Media position"
                                 />
                                 <div className="flex justify-between text-[10px] opacity-60 tabular-nums">
                                   <span>{formatMediaTime(t.mediaState.currentTime)}</span>
                                   <span>{formatMediaTime(t.mediaState.duration)}</span>
                                 </div>
                               </div>
                             )}
                           </div>
                          <button
                            className="p-1 rounded hover:bg-white/10 shrink-0"
                            onClick={() => {
                              const isPlaying = !!t.mediaState?.playing;
                               sendMediaCommand(isPlaying ? 'pause' : 'play', t.id);
                            }}
                            title={t.mediaState?.playing ? 'Pause' : 'Play'}
                          >
                            {t.mediaState?.playing ? <Pause size={14} /> : <Play size={14} />}
                          </button>
                        </div>
                      ))}
                      <button
                         className={clsx('w-full mt-1 h-7 rounded-md text-xs', isLight ? 'bg-black/10 hover:bg-black/15' : 'bg-white/10 hover:bg-white/15')}
                         onClick={() => sendMediaCommand('pause')}
                      >
                        Pause all
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          );
        })()}
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
      <Action Icon={SquareSplitHorizontal} size="15" action={() => toggleSidebar()} />
      <div className="relative" ref={quickPanelRef}>
        <Action Icon={Settings2} size="17" action={() => setQuickOpen((prev) => !prev)} />
        {quickRender && (
          <>
            <div
              className={
                'ghost-glass absolute right-0 top-9 w-[18rem] rounded-xl border border-white/10 p-3 shadow-[0_16px_36px_rgba(0,0,0,0.45)] z-[160] transition-all duration-200 origin-top-right ' +
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
                    onChange={(val) => {
                      const raw = String(val || '').trim();
                      updateOption({
                        wServer: raw || null,
                        proxyRouting: 'direct',
                      });
                    }}
                    placeholder={'Enter text'}
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
                  <>
                    <label className="block">
                      <span className="text-xs opacity-70 mb-1 block">Remote Proxy Type</span>
                      <ComboBox
                        config={[
                          { option: 'HTTP', value: 'http' },
                          { option: 'SOCKS4', value: 'socks4' },
                          { option: 'SOCKS5', value: 'socks5' },
                        ]}
                        selectedValue={[
                          { option: 'HTTP', value: 'http' },
                          { option: 'SOCKS4', value: 'socks4' },
                          { option: 'SOCKS5', value: 'socks5' },
                        ].find((x) => x.value === (options.remoteProxyType || 'http'))}
                        action={(item) => updateOption({ remoteProxyType: item || 'http' })}
                        maxW={58}
                        compact
                      />
                    </label>

                    <label className="block">
                      <span className="text-xs opacity-70 mb-1 block">Remote Proxy Server</span>
                      <TextInput
                        defValue={options.remoteProxyServer || ''}
                        onChange={(val) => updateOption({ remoteProxyServer: (val || '').trim() })}
                        placeholder="proxy.example.com:8080"
                        maxW={58}
                        compact
                        live
                      />
                    </label>
                  </>
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
