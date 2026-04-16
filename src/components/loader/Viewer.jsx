import clsx from 'clsx';
import loaderStore from '/src/utils/hooks/loader/useLoaderStore';
import StaticError from './viewer/StaticError';
import { useOptions } from '/src/utils/optionsContext';
import { process, isInternalGhostTabUrl } from '/src/utils/hooks/loader/utils';
import { useRef, useEffect, useState } from 'react';
import { Loader } from 'lucide-react';
import { eventToShortcut, getEffectiveShortcuts } from '/src/utils/shortcuts';

import NewTab from './NewTab';

/* ── Error-retry rate limiter ──
 * Prevents infinite reload when proxy can't reach the target site.
 * Max 3 retries per tab, with exponential backoff. Resets on successful load. */
const MAX_ERROR_RETRIES = 3;
const BASE_RETRY_DELAY = 1500; // ms
const SITE_POLICY_KEY = 'ghostSitePolicies';
const ADBLOCK_STYLE_ID = 'ghost-adblock-style';
const DOWNLOAD_FILE_EXT_RE = /\.(zip|crx|exe|msi|dmg|pkg|apk|ipa|pdf|docx?|xlsx?|pptx?|csv|rar|7z|tar|gz|iso|bin|deb|rpm)(\?|#|$)/i;
const DOWNLOAD_HINT_RE = /(download|attachment|export|filename=|file=|response-content-disposition)/i;
const AD_SELECTORS = [
  '[id*="ad-"]',
  '[id^="ad-"]',
  '[id*="ads-"]',
  '[id*="banner"]',
  '[class*="ad-"]',
  '[class^="ad-"]',
  '[class*="advert"]',
  '[class*="ads-"]',
  '[class*="sponsor"]',
  '[data-ad]',
  '[data-ads]',
  '[data-ad-slot]',
  'iframe[src*="doubleclick"]',
  'iframe[src*="googlesyndication"]',
  'iframe[src*="adservice"]',
  'iframe[id*="google_ads"]',
  '.ad',
  '.ads',
  '.adsbygoogle',
  '.advertisement',
  '.sponsored',
].join(',');

const getStoredSitePolicies = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(SITE_POLICY_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const isPopupTarget = (targetValue) => {
  const target = String(targetValue || '').trim().toLowerCase();
  if (!target) return false;
  if (target === '_self' || target === '_top' || target === '_parent') return false;
  return true;
};

const isLikelyDownloadHref = (value) => {
  const href = String(value || '').trim();
  if (!href) return false;
  if (href.startsWith('blob:') || href.startsWith('data:')) return true;
  if (DOWNLOAD_FILE_EXT_RE.test(href)) return true;
  return DOWNLOAD_HINT_RE.test(href);
};

const Viewer = ({ zoom }) => {
  const tabs = loaderStore((state) => state.tabs);
  const updateUrl = loaderStore((state) => state.updateUrl);
  const updateTitle = loaderStore((state) => state.updateTitle);
  const setLoading = loaderStore((state) => state.setLoading);
  const setFrameRefs = loaderStore((state) => state.setFrameRefs);
  // wispStatus: reps. if working Wisp server is found
  // (only when isStaticBuild == true)
  const wispStatus = loaderStore((state) => state.wispStatus);
  const { setIframeUrl, showMenu, toggleMenu } = loaderStore();
  const frameRefs = useRef({});
  const prevURL = useRef({});
  const prevTitle = useRef({});
  const errorRetries = useRef({});   // { [tabId]: { count, timer } }
  const { options } = useOptions();
  const updateActiveFrameRef = loaderStore((state) => state.updateActiveFrameRef);
  const activeFrameRef = loaderStore((state) => state.activeFrameRef);
  const [policyTick, setPolicyTick] = useState(0);

  const decodeForSite = (rawUrl) => {
    const value = String(rawUrl || '').trim();
    if (!value) return '';
    if (value.startsWith('ghost://') || value.startsWith('tabs://')) return value;
    if (value.includes('/uv/service/') || value.includes('/scramjet/')) {
      try {
        return process(value, true, options.prType || 'auto', options.engine || null);
      } catch {
        return value;
      }
    }
    return value;
  };

  const isInternalGhostUrl = (urlValue) => {
    return isInternalGhostTabUrl(urlValue);
  };

  const isNewTabLikeUrl = (rawUrl) => {
    const value = String(rawUrl || '').trim().toLowerCase();
    return (
      value === 'tabs://new' ||
      value === 'ghost://home' ||
      value === 'ghost://search' ||
      value === 'ghost://new-tab' ||
      value === 'ghost://newtab'
    );
  };

  const getSitePolicyForTab = (tabUrl) => {
    const decoded = decodeForSite(tabUrl);
    if (!decoded || isInternalGhostUrl(decoded)) {
      return { adBlock: false, popupBlock: false, siteKey: null, decoded };
    }

    try {
      const parsed = new URL(decoded, location.origin);
      if (parsed.origin === location.origin) {
        return { adBlock: false, popupBlock: false, downloadBlock: false, siteKey: null, decoded };
      }
      const siteKey = parsed.hostname.replace(/^www\./, '').toLowerCase();
      const policies = getStoredSitePolicies();
      const sitePolicy = policies[siteKey] || {};
      return {
        adBlock:
          typeof sitePolicy.adBlock === 'boolean' ? sitePolicy.adBlock : !!options.adBlockDefault,
        popupBlock:
          typeof sitePolicy.popupBlock === 'boolean'
            ? sitePolicy.popupBlock
            : !!options.popupBlockDefault,
        downloadBlock:
          typeof sitePolicy.downloadBlock === 'boolean'
            ? sitePolicy.downloadBlock
            : !!options.downloadBlockDefault,
        siteKey,
        decoded,
      };
    } catch {
      return { adBlock: false, popupBlock: false, downloadBlock: false, siteKey: null, decoded };
    }
  };

  const setDownloadBlock = (doc, enabled) => {
    try {
      const win = doc.defaultView;
      if (!win) return;

      if (!win.__ghostOriginalAnchorClick && win.HTMLAnchorElement?.prototype?.click) {
        win.__ghostOriginalAnchorClick = win.HTMLAnchorElement.prototype.click;
        win.HTMLAnchorElement.prototype.click = function (...args) {
          try {
            const href = String(this.getAttribute?.('href') || this.href || '').trim();
            const target = String(this.getAttribute?.('target') || this.target || '').trim();
            const hasDownload = this.hasAttribute?.('download');

            if (win.__ghostPopupBlocked && isPopupTarget(target)) return;
            if (win.__ghostDownloadBlocked && (hasDownload || isLikelyDownloadHref(href))) return;
          } catch { }
          return win.__ghostOriginalAnchorClick.apply(this, args);
        };
      }

      if (!win.__ghostOriginalFormSubmit && win.HTMLFormElement?.prototype?.submit) {
        win.__ghostOriginalFormSubmit = win.HTMLFormElement.prototype.submit;
        win.HTMLFormElement.prototype.submit = function (...args) {
          try {
            const target = String(this.getAttribute?.('target') || this.target || '').trim();
            const action = String(this.getAttribute?.('action') || this.action || '').trim();

            if (win.__ghostPopupBlocked && isPopupTarget(target)) return;
            if (win.__ghostDownloadBlocked && isLikelyDownloadHref(action)) return;
          } catch { }
          return win.__ghostOriginalFormSubmit.apply(this, args);
        };
      }

      if (!win.__ghostDownloadBlockHandler) {
        win.__ghostDownloadBlockHandler = (event) => {
          const anchor = event?.target?.closest?.('a[href], area[href]');
          if (!anchor) return;
          if (!doc.defaultView.__ghostDownloadBlocked) return;

          const href = String(anchor.getAttribute('href') || '').trim();
          if (!href || href.startsWith('#') || href.toLowerCase().startsWith('javascript:')) return;

          const attrDownload = anchor.hasAttribute('download');
          const looksLikeFile = isLikelyDownloadHref(href);
          if (!attrDownload && !looksLikeFile) return;

          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation?.();
        };
      }

      if (!win.__ghostDownloadSubmitHandler) {
        win.__ghostDownloadSubmitHandler = (event) => {
          if (!doc.defaultView.__ghostDownloadBlocked) return;
          const form = event?.target;
          if (!(form instanceof win.HTMLFormElement)) return;
          const action = String(form.getAttribute('action') || form.action || '').trim();
          if (!isLikelyDownloadHref(action)) return;

          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation?.();
        };
      }

      if (enabled && !win.__ghostDownloadBlocked) {
        win.__ghostDownloadBlocked = true;
        doc.addEventListener('click', win.__ghostDownloadBlockHandler, true);
        doc.addEventListener('submit', win.__ghostDownloadSubmitHandler, true);
      } else if (!enabled && win.__ghostDownloadBlocked) {
        win.__ghostDownloadBlocked = false;
        doc.removeEventListener('click', win.__ghostDownloadBlockHandler, true);
        doc.removeEventListener('submit', win.__ghostDownloadSubmitHandler, true);
      }
    } catch { }
  };

  const removeAdNodes = (doc) => {
    try {
      doc.querySelectorAll(AD_SELECTORS).forEach((node) => node.remove());
    } catch { }
  };

  const setPopupBlock = (doc, enabled) => {
    try {
      const win = doc.defaultView;
      if (!win) return;

      if (!win.__ghostOriginalOpen) {
        win.__ghostOriginalOpen = win.open.bind(win);
      }

      if (!win.__ghostOpenWrapped && win.__ghostOriginalOpen) {
        win.open = (...args) => {
          const url = args[0];
          if (win.__ghostPopupBlocked) return null;
          if (win.__ghostDownloadBlocked && isLikelyDownloadHref(url)) return null;
          return win.__ghostOriginalOpen(...args);
        };
        win.__ghostOpenWrapped = true;
      }

      if (!win.__ghostOriginalAnchorClick && win.HTMLAnchorElement?.prototype?.click) {
        win.__ghostOriginalAnchorClick = win.HTMLAnchorElement.prototype.click;
        win.HTMLAnchorElement.prototype.click = function (...args) {
          try {
            const href = String(this.getAttribute?.('href') || this.href || '').trim();
            const target = String(this.getAttribute?.('target') || this.target || '').trim();
            const hasDownload = this.hasAttribute?.('download');

            if (win.__ghostPopupBlocked && isPopupTarget(target)) return;
            if (win.__ghostDownloadBlocked && (hasDownload || isLikelyDownloadHref(href))) return;
          } catch { }
          return win.__ghostOriginalAnchorClick.apply(this, args);
        };
      }

      if (!win.__ghostOriginalFormSubmit && win.HTMLFormElement?.prototype?.submit) {
        win.__ghostOriginalFormSubmit = win.HTMLFormElement.prototype.submit;
        win.HTMLFormElement.prototype.submit = function (...args) {
          try {
            const target = String(this.getAttribute?.('target') || this.target || '').trim();
            const action = String(this.getAttribute?.('action') || this.action || '').trim();

            if (win.__ghostPopupBlocked && isPopupTarget(target)) return;
            if (win.__ghostDownloadBlocked && isLikelyDownloadHref(action)) return;
          } catch { }
          return win.__ghostOriginalFormSubmit.apply(this, args);
        };
      }

      if (!win.__ghostPopupClickHandler) {
        win.__ghostPopupClickHandler = (event) => {
          const target = event?.target?.closest?.('a[target], area[target]');
          if (!target) return;
          if (!doc.defaultView.__ghostPopupBlocked) return;
          const targetValue = String(target.getAttribute('target') || '').trim();
          if (!isPopupTarget(targetValue)) return;
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation?.();
        };
      }

      if (!win.__ghostPopupSubmitHandler) {
        win.__ghostPopupSubmitHandler = (event) => {
          if (!doc.defaultView.__ghostPopupBlocked) return;
          const form = event?.target;
          if (!(form instanceof win.HTMLFormElement)) return;
          const target = String(form.getAttribute('target') || form.target || '').trim();
          if (!isPopupTarget(target)) return;

          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation?.();
        };
      }

      if (enabled && !win.__ghostPopupBlocked) {
        win.__ghostPopupBlocked = true;
        doc.addEventListener('click', win.__ghostPopupClickHandler, true);
        doc.addEventListener('submit', win.__ghostPopupSubmitHandler, true);
      } else if (!enabled && win.__ghostPopupBlocked) {
        win.__ghostPopupBlocked = false;
        doc.removeEventListener('click', win.__ghostPopupClickHandler, true);
        doc.removeEventListener('submit', win.__ghostPopupSubmitHandler, true);
      }
    } catch { }
  };

  const setAdBlock = (doc, enabled) => {
    try {
      let styleEl = doc.getElementById(ADBLOCK_STYLE_ID);

      if (enabled) {
        if (!styleEl) {
          styleEl = doc.createElement('style');
          styleEl.id = ADBLOCK_STYLE_ID;
          styleEl.textContent = `${AD_SELECTORS} { display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; }`;
          doc.documentElement.appendChild(styleEl);
        }

        removeAdNodes(doc);

        if (!doc.defaultView.__ghostAdObserver) {
          const observer = new MutationObserver(() => removeAdNodes(doc));
          observer.observe(doc.documentElement, { childList: true, subtree: true });
          doc.defaultView.__ghostAdObserver = observer;
        }
      } else {
        if (styleEl) styleEl.remove();
        doc.defaultView.__ghostAdObserver?.disconnect?.();
        doc.defaultView.__ghostAdObserver = null;
      }
    } catch { }
  };

  const applyProtection = (tab, iframe) => {
    if (!tab || !iframe) return;
    try {
      const doc = iframe.contentWindow?.document;
      if (!doc?.documentElement) return;
      const policy = getSitePolicyForTab(tab.url);
      setPopupBlock(doc, !!policy.popupBlock);
      setAdBlock(doc, !!policy.adBlock);
      setDownloadBlock(doc, !!policy.downloadBlock);

      const win = doc.defaultView;
      if (win && !win.__ghostCloseUiHandler) {
        win.__ghostCloseUiHandler = () => {
          window.dispatchEvent(new Event('ghost-close-omnibox-suggestions'));
          window.dispatchEvent(new Event('ghost-close-all-loader-popups'));
        };
        doc.addEventListener('pointerdown', win.__ghostCloseUiHandler, true);
      }
    } catch { }
  };

  const getFrameUrl = (rawUrl) => {
    const value = String(rawUrl || '').trim();
    if (!value || isNewTabLikeUrl(value)) {
      return 'tabs://new';
    }
    if (value.startsWith('tabs://') || value.startsWith('data:') || value.startsWith('blob:') || value.startsWith('about:')) {
      return value;
    }
    if (value.includes('/uv/service/') || value.includes('/scramjet/')) {
      return value;
    }
    if (value.startsWith('ghost://')) {
      const route = value.toLowerCase().replace(/^ghost:\/\//, '').replace(/^\/+/, '').split(/[?#]/)[0];
      const aliasTargets = {
        musicplayer: 'https://music.anonymoose.workers.dev',
        monochrome: 'https://music.anonymoose.workers.dev',
        duckai: 'https://duck.ai',
        live: 'https://thetvapp.to',
        movies: 'https://www.cineby.sc',
        anime: 'https://9animetv.to',
        browselol: 'https://browser.lol/create',
      };
      if (aliasTargets[route]) {
        return process(aliasTargets[route], false, options.prType || 'auto', options.engine || null);
      }
      return process(value, false, options.prType || 'auto', options.engine || null);
    }
    try {
      const parsed = new URL(value, location.origin);
      if (parsed.origin === location.origin) {
        return parsed.toString();
      }
    } catch { }
    return process(value, false, options.prType || 'auto', options.engine || null);
  };

  const getFrameSandbox = (rawUrl) => {
    const policy = getSitePolicyForTab(rawUrl);
    const flags = [
      'allow-scripts',
      'allow-same-origin',
      'allow-forms',
      'allow-pointer-lock',
      'allow-orientation-lock',
      'allow-presentation',
      'allow-top-navigation-by-user-activation',
    ];

    if (!policy.popupBlock) {
      flags.push('allow-popups');
      flags.push('allow-popups-to-escape-sandbox');
    }

    if (!policy.downloadBlock) {
      flags.push('allow-downloads');
    }

    return flags.join(' ');
  };

  const getInternalPageOffset = (rawUrl) => {
    return 0;
  };

  useEffect(() => {
    setFrameRefs(frameRefs);
    const tabIds = new Set(tabs.map((t) => t.id));
    Object.keys(frameRefs.current).forEach((id) => {
      if (!tabIds.has(id)) delete frameRefs.current[id];
    });
  }, [setFrameRefs, tabs]);

  useEffect(() => {
    const onPolicyUpdate = () => setPolicyTick((n) => n + 1);

    const onMessage = (e) => {
      if (e.data && e.data.type === 'ghost-shortcut') {
        console.log('[VIEWER] Received ghost-shortcut message from proxy iframe:', e.data);
        const { key, altKey, ctrlKey, shiftKey, metaKey } = e.data;
        const synth = new KeyboardEvent('keydown', {
          key,
          altKey,
          ctrlKey,
          shiftKey,
          metaKey,
          bubbles: true,
          cancelable: true
        });
        console.log('[VIEWER] Synthesizing and dispatching KeyboardEvent:', synth);
        window.dispatchEvent(synth);
      }
    };

    window.addEventListener('ghost-site-policies-updated', onPolicyUpdate);
    window.addEventListener('message', onMessage);

    return () => {
      window.removeEventListener('ghost-site-policies-updated', onPolicyUpdate);
      window.removeEventListener('message', onMessage);
    };
  }, []);

  /* Rate-limited error retry helper */
  const scheduleErrorRetry = (tabId, iframe, url) => {
    const entry = errorRetries.current[tabId] || { count: 0, timer: null };
    if (entry.count >= MAX_ERROR_RETRIES) {
      // Give up — leave error page visible instead of infinite loop
      console.warn(`[Viewer] Gave up retrying tab ${tabId} after ${MAX_ERROR_RETRIES} attempts`);
      return;
    }
    if (entry.timer) return; // already scheduled
    const delay = BASE_RETRY_DELAY * Math.pow(2, entry.count); // 1.5s, 3s, 6s
    entry.count += 1;
    entry.timer = setTimeout(() => {
      entry.timer = null;
      try {
        iframe.contentWindow.location.replace(url);
      } catch { /* cross-origin or destroyed */ }
    }, delay);
    errorRetries.current[tabId] = entry;
  };

  useEffect(() => {
    const listeners = [];
    tabs.forEach((tab) => {
      if (isNewTabLikeUrl(tab.url)) return;
      const iframe = frameRefs.current[tab.id];
      if (!iframe) return;
      const handleLoad = () => {
        setLoading(tab.id, false);
        applyProtection(tab, iframe);
        window.dispatchEvent(
          new CustomEvent('ghost-frame-loaded', {
            detail: { tabId: tab.id, frame: iframe },
          }),
        );
        try {
          const d = iframe.contentWindow?.document;
          if (d?.getElementById('errorTrace-wrapper') || d?.getElementById('fetchedURL')) {
            // Proxy error page — schedule a rate-limited retry
            scheduleErrorRetry(tab.id, iframe, getFrameUrl(tab.url));
          } else {
            // Successful load — reset retry counter for this tab
            if (errorRetries.current[tab.id]) {
              clearTimeout(errorRetries.current[tab.id].timer);
              delete errorRetries.current[tab.id];
            }
          }
        } catch { }
      };
      const checkState = () => {
        try {
          const curURL = iframe.contentWindow.location.href;
          const curTTL = iframe.contentWindow.document.title;
          if (curURL === 'about:blank') return;
          if (curURL !== prevURL.current[tab.id] && curURL !== tab.url) {
            prevURL.current[tab.id] = curURL;
            setIframeUrl(tab.id, curURL);
          }
          if (curTTL && curTTL !== prevTitle.current[tab.id] && curTTL !== tab.title) {
            prevTitle.current[tab.id] = curTTL;
            updateTitle(tab.id, curTTL);
          }
        } catch (e) { }
      };
      iframe.addEventListener('load', handleLoad);
      iframe.addEventListener('load', checkState);
      listeners.push({ iframe, handleLoad, checkState, tabId: tab.id });
    });
    /* Single high-frequency poll for URL/title sync + error detection (one interval, not two) */
    const interval = setInterval(() => {
      const currentTabs = loaderStore.getState().tabs;
      currentTabs.forEach((tab) => {
        if (isNewTabLikeUrl(tab.url)) return;
        const iframe = frameRefs.current[tab.id];
        if (!iframe) return;
        applyProtection(tab, iframe);
        try {
          const curURL = iframe.contentWindow.location.href;
          const curTTL = iframe.contentWindow.document.title;
          if (curURL === 'about:blank') return;

          // Check for proxy error page — rate-limited retry
          const d = iframe.contentWindow?.document;
          if (d?.getElementById('errorTrace-wrapper')) {
            scheduleErrorRetry(tab.id, iframe, getFrameUrl(tab.url));
            return;
          }

          if (curURL !== prevURL.current[tab.id] && curURL !== tab.url) {
            prevURL.current[tab.id] = curURL;
            setIframeUrl(tab.id, curURL);
          }
          if (curTTL && curTTL !== prevTitle.current[tab.id] && curTTL !== tab.title) {
            prevTitle.current[tab.id] = curTTL;
            updateTitle(tab.id, curTTL);
          }

          const cw = iframe.contentWindow;
          if (cw && !cw.__ghostShortcutHooked) {
            cw.__ghostShortcutHooked = true;

            cw.addEventListener('keydown', (e) => {
              const shortcutsMap = getEffectiveShortcuts(options);
              const activeCombos = Object.entries(shortcutsMap)
                .filter(([, cfg]) => cfg?.enabled !== false)
                .map(([id, cfg]) => cfg.key);

              const combo = eventToShortcut(e);

              if (activeCombos.includes(combo) || combo === 'F11' || combo === 'F12' || combo === 'F5') {
                e.preventDefault();
                e.stopPropagation();

                const synth = new KeyboardEvent('keydown', {
                  key: e.key,
                  altKey: e.altKey,
                  ctrlKey: e.ctrlKey,
                  shiftKey: e.shiftKey,
                  metaKey: e.metaKey,
                  bubbles: true,
                  cancelable: true
                });
                window.top.dispatchEvent(synth);
              }
            }, { capture: true });
          }
        } catch (e) { }
      });
    }, 220);

    return () => {
      listeners.forEach(({ iframe, handleLoad, checkState }) => {
        iframe.removeEventListener('load', handleLoad);
        iframe.removeEventListener('load', checkState);
      });
      clearInterval(interval);
      // Clean up pending retry timers
      Object.values(errorRetries.current).forEach((e) => clearTimeout(e.timer));
    };
  }, [tabs, setLoading, updateTitle, setIframeUrl, options.adBlockDefault, options.popupBlockDefault, options.downloadBlockDefault, options.prType, options.engine, policyTick]);

  useEffect(() => {
    if (activeFrameRef?.current) {
      try {
        activeFrameRef.current.contentWindow.document.body.style.zoom = zoom;
      } catch (e) { }
    }
  }, [activeFrameRef, zoom]);

  useEffect(() => {
    tabs.forEach((tab) => {
      if (tab.active) {
        const iframeRef = { current: frameRefs.current[tab.id] };
        updateActiveFrameRef(iframeRef);
      }
    });
  }, [tabs]);

  const zoomLevels = loaderStore((state) => state.zoomLevels);

  const activeNewTab = tabs.find((tab) => isNewTabLikeUrl(tab.url) && tab.active);

  return (
    <div className="relative w-full h-full">
      {tabs.map(({ id, url, active }) => {
        if (isNewTabLikeUrl(url)) return null;
        const internalOffsetTop = getInternalPageOffset(url);
        const iframeSizing = {
          display: 'block',
          width: '100%',
          height: `calc(100% - ${internalOffsetTop}px)`,
          marginTop: `${internalOffsetTop}px`,
        };
        return (
          <div
            key={id}
            className={clsx(
              'absolute inset-0 w-full h-full',
              active ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none',
            )}
          >
            {active && (
              <div
                className="absolute inset-0 w-full h-full flex items-center justify-center -z-20"
                style={{ backgroundColor: options.tabBarColor || '#070e15' }}
              >
                {/*
                  If not static build, show loader
                  If static, show loader when wispStatus == true
                  If Wisp is still being found (init), show loading
                  Otherwise show error
                */}
                {!isStaticBuild ? (
                  <Loader size={32} className="animate-spin" />
                ) : wispStatus ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader size={32} className="animate-spin" />
                    {wispStatus === 'init' && (
                      <p className="mt-2">Finding a Wisp server to route your request...</p>
                    )}
                  </div>
                ) : wispStatus === false && (
                  <StaticError />
                )}
              </div>
            )}
            {/* if not static, show frame. otherwise if wisp is found (and is static) show iframe,
            otherwise display error msg */}
            {!isStaticBuild ? (
              <iframe
                ref={(el) => (frameRefs.current[id] = el)}
                src={getFrameUrl(url)}
                sandbox={getFrameSandbox(url)}
                style={iframeSizing}
                className="absolute inset-0 w-full h-full transition-opacity duration-200"
                onPointerDown={() => {
                  window.dispatchEvent(new Event('ghost-close-omnibox-suggestions'));
                  window.dispatchEvent(new Event('ghost-close-all-loader-popups'));
                }}
                onFocus={() => {
                  window.dispatchEvent(new Event('ghost-close-omnibox-suggestions'));
                  window.dispatchEvent(new Event('ghost-close-all-loader-popups'));
                }}
                onMouseDown={() => {
                  window.dispatchEvent(new Event('ghost-close-omnibox-suggestions'));
                  window.dispatchEvent(new Event('ghost-close-all-loader-popups'));
                }}
              />
            ) : (
              wispStatus === true && (
                <iframe
                  ref={(el) => (frameRefs.current[id] = el)}
                  src={getFrameUrl(url)}
                  sandbox={getFrameSandbox(url)}
                  style={iframeSizing}
                  className="absolute inset-0 w-full h-full transition-opacity duration-200"
                  onPointerDown={() => {
                    window.dispatchEvent(new Event('ghost-close-omnibox-suggestions'));
                    window.dispatchEvent(new Event('ghost-close-all-loader-popups'));
                  }}
                  onFocus={() => {
                    window.dispatchEvent(new Event('ghost-close-omnibox-suggestions'));
                    window.dispatchEvent(new Event('ghost-close-all-loader-popups'));
                  }}
                  onMouseDown={() => {
                    window.dispatchEvent(new Event('ghost-close-omnibox-suggestions'));
                    window.dispatchEvent(new Event('ghost-close-all-loader-popups'));
                  }}
                />
              )
            )}

            {/*transparent overlay for when click on content */}
            {showMenu && (
              <div className="absolute inset-0 w-full h-full z-50" onClick={() => toggleMenu()} />
            )}
          </div>
        );
      })}
      {activeNewTab && (() => {
        const zl = zoomLevels[activeNewTab.id] ?? 100;
        const scale = zl / 100;
        const isDefaultScale = Math.abs(scale - 1) < 0.001;
        return (
          <div
            key={activeNewTab.id}
            className={clsx('absolute inset-0 w-full h-full', 'opacity-100 z-10 pointer-events-auto')}
          >
            {isDefaultScale ? (
              <NewTab id={activeNewTab.id} updateFn={updateUrl} />
            ) : (
              <div
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                  width: `${100 / scale}%`,
                  height: `${100 / scale}%`,
                }}
              >
                <NewTab id={activeNewTab.id} updateFn={updateUrl} />
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};

export default Viewer;
