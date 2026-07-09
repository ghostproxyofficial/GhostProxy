import clsx from 'clsx';
import loaderStore from '/src/utils/hooks/loader/useLoaderStore';
import StaticError from './viewer/StaticError';
import { useOptions } from '/src/utils/optionsContext';
import { process, isInternalGhostTabUrl } from '/src/utils/hooks/loader/utils';
import { useRef, useEffect, useState } from 'react';
import { Loader } from 'lucide-react';
import { eventToShortcut, getEffectiveShortcuts } from '/src/utils/shortcuts';
import { showConfirm } from '/src/utils/uiDialog';

import NewTab from './NewTab';

// retry loading if it fails. max 3 times with exponential backoff
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

  const syncFrameState = (tab, iframe, force = false) => {
    if (!tab || !iframe?.contentWindow) return;
    try {
      const cw = iframe.contentWindow;
      const curURL = cw.location.href;
      const curTTL = cw.document.title;

      if (curURL && curURL !== 'about:blank' && (force || curURL !== prevURL.current[tab.id] && curURL !== tab.url)) {
        prevURL.current[tab.id] = curURL;
        setIframeUrl(tab.id, curURL);
      }

      if (curTTL && (force || curTTL !== prevTitle.current[tab.id] && curTTL !== tab.title)) {
        prevTitle.current[tab.id] = curTTL;
        updateTitle(tab.id, curTTL);
      }
    } catch { }
  };

  const installFrameBridge = (tab, iframe) => {
    if (!tab || !iframe?.contentWindow) return;

    try {
      const cw = iframe.contentWindow;
      if (!cw.__ghostUrlBridgeHooked) {
        cw.__ghostUrlBridgeHooked = true;

        const notifyFrameState = () => syncFrameState(tab, iframe, true);
        const originalPushState = cw.history.pushState.bind(cw.history);
        const originalReplaceState = cw.history.replaceState.bind(cw.history);

        cw.history.pushState = function (...args) {
          const result = originalPushState(...args);
          notifyFrameState();
          return result;
        };

        cw.history.replaceState = function (...args) {
          const result = originalReplaceState(...args);
          notifyFrameState();
          return result;
        };

        const onStateChange = () => notifyFrameState();
        cw.addEventListener('popstate', onStateChange);
        cw.addEventListener('hashchange', onStateChange);
        cw.addEventListener('pageshow', onStateChange);

        const titleObserver = new cw.MutationObserver(onStateChange);
        const titleNode = cw.document.querySelector('title');
        if (titleNode) {
          titleObserver.observe(titleNode, { childList: true, characterData: true, subtree: true });
        } else if (cw.document.head) {
          titleObserver.observe(cw.document.head, { childList: true, subtree: true });
        }
        cw.__ghostTitleObserver = titleObserver;
      }

      const shortcutsMap = getEffectiveShortcuts(options);
      const activeCombos = Object.entries(shortcutsMap)
        .filter(([, cfg]) => cfg?.enabled !== false)
        .map(([, cfg]) => cfg.key);
      cw.__ghostActiveCombos = activeCombos;
      cw.postMessage({ type: 'ghost-update-shortcuts', shortcuts: activeCombos }, '*');

      if (!cw.__ghostShortcutHooked) {
        cw.__ghostShortcutHooked = true;

        const stealShortcut = (e) => {
          const combo = eventToShortcut(e);
          if (cw.__ghostActiveCombos?.includes(combo) || combo === 'F11' || combo === 'F12' || combo === 'F5') {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation?.();

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
        };

        cw.addEventListener('keydown', stealShortcut, { capture: true });
        cw.document.addEventListener('keydown', stealShortcut, { capture: true });
      }

      if (!cw.__ghostMessageForwarderHooked) {
        cw.__ghostMessageForwarderHooked = true;
        cw.addEventListener('message', (e) => {
          if (e.data && typeof e.data.type === 'string' && e.data.type.startsWith('ghost-')) {
            try {
              window.top.postMessage(e.data, '*');
            } catch {}
          }
        });
      }

      syncFrameState(tab, iframe, true);
    } catch { }
  };

const Viewer = ({ zoom }) => {
  const tabs = loaderStore((state) => state.tabs);
  const updateUrl = loaderStore((state) => state.updateUrl);
  const updateTitle = loaderStore((state) => state.updateTitle);
  const setLoading = loaderStore((state) => state.setLoading);
  const setFrameRefs = loaderStore((state) => state.setFrameRefs);
  // wisp connection check for static builds
  const wispStatus = loaderStore((state) => state.wispStatus);
  const { setIframeUrl, showMenu, toggleMenu } = loaderStore();
  const frameRefs = useRef({});
  const prevURL = useRef({});
  const prevTitle = useRef({});
  const errorRetries = useRef({});   // tabid -> { count, timer }
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
      value === 'about:blank' ||
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

    if (options.torRouting) {
      // get raw url from proxy url
      let targetUrl = value;
      if (value.includes('/uv/service/') || value.includes('/scramjet/')) {
         try {
           targetUrl = process(value, true, options.prType || 'auto', options.engine || null);
         } catch { }
      }
      return targetUrl; // tor handles fetching
    }

    if (value.includes('/uv/service/') || value.includes('/scramjet/')) {
      try {
        const decoded = process(value, true, options.prType || 'auto', options.engine || null);
        return process(decoded, false, options.prType || 'auto', options.engine || null);
      } catch {
        return value;
      }
    }
    if (value.startsWith('ghost://')) {
      const route = value.toLowerCase().replace(/^ghost:\/\//, '').replace(/^\/+/, '').split(/[?#]/)[0];
      const aliasTargets = {
        musicplayer: 'https://monochrome.tf',
        monochrome: 'https://monochrome.tf',
        duckai: 'https://duck.ai',
        live: 'https://thetvapptv.com/',
        movies: 'https://www.cineby.sc',
        anime: 'https://hianime.ms',
        browselol: 'https://browser.lol/create',
      };
      if (aliasTargets[route]) {
        if (route === 'musicplayer' || route === 'monochrome') return aliasTargets[route];
        return process(aliasTargets[route], false, options.prType || 'auto', options.engine || null);
      }
      return process(value, false, options.prType || 'auto', options.engine || null);
    }
    try {
      const parsed = new URL(value, location.origin);
      if (parsed.origin === location.origin) {
        return parsed.toString();
      }
      if (value === 'https://monochrome.tf' || value.startsWith('https://monochrome.tf/')) {
        return value;
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
      if (!policy.downloadBlock) {
        flags.push('allow-popups-to-escape-sandbox');
      }
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

    window.addEventListener('ghost-site-policies-updated', onPolicyUpdate);

    return () => {
      window.removeEventListener('ghost-site-policies-updated', onPolicyUpdate);
    };
  }, []);

  /* rate-limited error retry helper */
  const scheduleErrorRetry = (tabId, iframe, url) => {
    const entry = errorRetries.current[tabId] || { count: 0, timer: null };
    if (entry.count >= MAX_ERROR_RETRIES) {
      // give up  leave error page visible instead of infinite loop
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
        installFrameBridge(tab, iframe);
        syncFrameState(tab, iframe, true);
        window.dispatchEvent(
          new CustomEvent('ghost-frame-loaded', {
            detail: { tabId: tab.id, frame: iframe },
          }),
        );

        if ((tab.url.includes('hianime.ms') || tab.url.includes('ghost://anime')) && !localStorage.getItem('ghost-hianime-ryu-warned')) {
          showConfirm("Don't use the RYU server for streaming. Others should be fine.", "HiAnime Notice", "Don't show this again", "OK").then((res) => {
            if (res) localStorage.setItem('ghost-hianime-ryu-warned', '1');
          });
        }

        try {
          const d = iframe.contentWindow?.document;
          if (d?.getElementById('errorTrace-wrapper') || d?.getElementById('fetchedURL')) {
            const errorText = d.body?.innerText || '';
            const rawUrl = getFrameUrl(tab.url);

            scheduleErrorRetry(tab.id, iframe, rawUrl);
          } else if (errorRetries.current[tab.id]) {
            clearTimeout(errorRetries.current[tab.id].timer);
            delete errorRetries.current[tab.id];
          }
        } catch { }
      };

      iframe.addEventListener('load', handleLoad);
      listeners.push({ iframe, handleLoad });
    });

    const interval = setInterval(() => {
      const currentTabs = loaderStore.getState().tabs;
      const activeTab = currentTabs.find((tab) => tab.active);
      if (!activeTab || isNewTabLikeUrl(activeTab.url)) return;

      const iframe = frameRefs.current[activeTab.id];
      if (!iframe) return;

      applyProtection(activeTab, iframe);

      try {
        syncFrameState(activeTab, iframe);
        const d = iframe.contentWindow?.document;
        const errorText = d?.body?.innerText || '';
        const isErrorPage = d?.getElementById('errorTrace-wrapper') || errorText.includes('SSL connect error') || errorText.includes('code 35') || errorText.includes('code 60') || errorText.includes('tls handshake eof');

        if (isErrorPage) {
          const rawUrl = getFrameUrl(activeTab.url);

          scheduleErrorRetry(activeTab.id, iframe, rawUrl);
        } else if (errorRetries.current[activeTab.id]) {
          clearTimeout(errorRetries.current[activeTab.id].timer);
          delete errorRetries.current[activeTab.id];
        }
      } catch { }
    }, 300);

    return () => {
      listeners.forEach(({ iframe, handleLoad }) => {
        iframe.removeEventListener('load', handleLoad);
      });
      clearInterval(interval);
      Object.values(errorRetries.current).forEach((entry) => clearTimeout(entry.timer));
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
                  if not static build, show loader
                  if static, show loader when wispstatus == true
                  if wisp is still being found (init), show loading
                  otherwise show error
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
            {wispStatus === true ? (
              <iframe
                ref={(el) => (frameRefs.current[id] = el)}
                src={getFrameUrl(url)}
                sandbox={getFrameSandbox(url)}
                allow="autoplay; fullscreen; clipboard-read; clipboard-write; display-capture;"
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
                  allow="autoplay; fullscreen; clipboard-read; clipboard-write; display-capture;"
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
