import clsx from 'clsx';
import loaderStore from '/src/utils/hooks/loader/useLoaderStore';
import StaticError from './viewer/StaticError';
import { useOptions } from '/src/utils/optionsContext';
import { process, isInternalGhostTabUrl } from '/src/utils/hooks/loader/utils';
import { getEffectiveIdentity } from '/src/data/userAgents';
import { useRef, useEffect, useState } from 'react';
import { Loader } from 'lucide-react';
import { showConfirm } from '/src/utils/uiDialog';

import NewTab from './NewTab';

// retry a failed load 3 times, backoff gets longer each time
const MAX_ERROR_RETRIES = 3;
const BASE_RETRY_DELAY = 1500; // ms

// transport error signatures we retry past on the quiet.
// kept narrow, generic stuff like "network error" shows up in normal pages too
const PROXY_ERROR_MARKERS = [
  'ssl connect error',
  'tls handshake eof',
  'connection reset',
  'connection refused',
  'could not resolve host',
  'name or service not known',
  'socket hang up',
  'econnreset',
  'etimedout',
  'err_connection',
  'err_ssl',
  'err_tunnel',
  'err_name_not_resolved',
  'code 28',
  'code 35',
  'code 56',
  'code 60',
];

const isProxyErrorDocument = (doc) => {
  if (!doc) return false;
  try {
    if (doc.getElementById?.('errorTrace-wrapper') || doc.getElementById?.('fetchedURL')) return true;
    const text = String(doc.body?.innerText || '').toLowerCase();
    if (!text) return false;
    return PROXY_ERROR_MARKERS.some((marker) => text.includes(marker));
  } catch {
    return false;
  }
};

// stuck-load watchdog, no load event in 30s means stalled.
// reuses the retry path. the isLoading check spares sparse pages that loaded fine
const STUCK_NO_LOAD_MS = 30000;
const STUCK_WATCH_TTL_MS = 6 * 60 * 1000;
const STUCK_MAX_TRIGGERS = 2;
const SITE_POLICY_KEY = 'ghostSitePolicies';
const ADBLOCK_STYLE_ID = 'ghost-adblock-style';
const DOWNLOAD_FILE_EXT_RE = /\.(zip|crx|exe|msi|dmg|pkg|apk|ipa|pdf|docx?|xlsx?|pptx?|csv|rar|7z|tar|gz|iso|bin|deb|rpm)(\?|#|$)/i;
const DOWNLOAD_HINT_RE = /(download|attachment|export|filename=|file=|response-content-disposition)/i;

const getMediaMetadata = (documentObject, mediaElement) => {
  const read = (selector) => {
    try {
      const node = documentObject.querySelector(selector);
      return String(node?.content || node?.textContent || '').trim();
    } catch {
      return '';
    }
  };
  const attr = (name) => String(mediaElement?.dataset?.[name] || mediaElement?.getAttribute?.(`data-${name}`) || '').trim();
  return {
    title: attr('title')
      || mediaElement?.getAttribute?.('aria-label')
      || read('meta[property="og:title"]')
      || read('[itemprop="name"]')
      || String(documentObject.title || '').trim(),
    artist: attr('artist')
      || read('meta[property="music:musician"]')
      || read('[itemprop="byArtist"]')
      || read('[data-artist]')
      || read('[class*="artist" i]')
      || read('meta[name="author"]'),
  };
};
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
  // wisp connection check, static builds only
  const wispStatus = loaderStore((state) => state.wispStatus);
  const { setIframeUrl, showMenu, toggleMenu } = loaderStore();
  const frameRefs = useRef({});
  const prevURL = useRef({});
  const prevTitle = useRef({});
  const errorRetries = useRef({});   // tabid -> { count, timer }
  const stuckWatch = useRef({});    // tabid -> { url, firstSeen, lastSig, lastChange, triggered, settled }
  const watchTick = useRef(0);
  const { options } = useOptions();
  const updateActiveFrameRef = loaderStore((state) => state.updateActiveFrameRef);
  const activeFrameRef = loaderStore((state) => state.activeFrameRef);
  const [policyTick, setPolicyTick] = useState(0);
  const uaSignatureRef = useRef(null);
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

  const syncMediaState = (tab, iframe) => {
    if (!tab || !iframe?.contentWindow) return;
    try {
      const media = Array.from(iframe.contentWindow.document.querySelectorAll('audio, video'));
      const playingMedia = media.find((item) => !item.paused && item.volume > 0 && !item.muted);
      const documentObject = iframe.contentWindow.document;
      const artwork = documentObject.querySelector('meta[property="og:image"]')?.content
        || documentObject.querySelector('link[rel*="icon"]')?.href
        || '';
      const metadata = getMediaMetadata(documentObject, playingMedia || media[0]);
      const nextState = media.length > 0
        ? {
          playing: !!playingMedia,
          title: metadata.title,
          artist: metadata.artist,
          artwork,
          mediaCount: media.length,
          mediaKind: playingMedia?.tagName === 'VIDEO' ? 'video' : media.some((item) => item.tagName === 'AUDIO') ? 'audio' : 'video',
          currentTime: playingMedia?.currentTime || 0,
          duration: Number.isFinite(playingMedia?.duration) ? playingMedia.duration : 0,
        }
        : undefined;
      const currentState = loaderStore.getState().tabs.find((item) => item.id === tab.id)?.mediaState;
      if (
        currentState?.playing === nextState?.playing &&
        currentState?.title === nextState?.title &&
        currentState?.artist === nextState?.artist &&
        currentState?.mediaCount === nextState?.mediaCount &&
        currentState?.artwork === nextState?.artwork &&
        Math.abs((currentState?.currentTime || 0) - (nextState?.currentTime || 0)) < 0.5
      ) return;
      loaderStore.getState().updateMediaState(tab.id, nextState);
    } catch { }
  };

  const installFrameBridge = (tab, iframe) => {
    if (!tab || !iframe?.contentWindow) return;

    try {
      const cw = iframe.contentWindow;

      applyFrameUserAgent(tab, iframe);

// media bridge goes in before the url/shortcut hooks, scramjet RawProxy
// can reject those on some proxied sites
      if (!cw.__ghostMessageForwarderHooked) {
        cw.__ghostMessageForwarderHooked = true;
        cw.addEventListener('message', (e) => {
          if (e.data?.type !== 'GHOST_MEDIA_COMMAND') return;
          try {
            if (e.data.tabId && String(e.data.tabId) !== String(tab.id)) return;
            const media = Array.from(cw.document.querySelectorAll('video, audio'));
            if (e.data.command === 'play') {
              media.forEach((item) => { try { item.play?.().catch(() => {}); } catch {} });
            } else if (e.data.command === 'pause') {
              media.forEach((item) => { try { item.pause?.(); } catch {} });
            } else if (e.data.command === 'seek') {
              media.forEach((item) => {
                try {
                  if (Number.isFinite(Number(e.data.time))) item.currentTime = Number(e.data.time);
                } catch { }
              });
            } else if (e.data.command === 'nexttrack') {
              const button = cw.document.querySelector('#fs-next-btn, #next-btn, [data-action="next-track"], [data-action="next"]');
              if (button) button.click();
            } else if (e.data.command === 'previoustrack') {
              const button = cw.document.querySelector('#fs-prev-btn, #prev-btn, [data-action="previous-track"], [data-action="previous"]');
              if (button) button.click();
            }
          } catch { }
        });
      }

      if (!cw.__ghostMediaStateHooked) {
        cw.__ghostMediaStateHooked = true;
        const sendMediaState = () => {
          try {
            const media = Array.from(cw.document.querySelectorAll('video, audio'));
            const playing = media.some((item) => !item.paused && item.volume > 0 && !item.muted);
            const audio = media.find((item) => !item.paused && item.volume > 0 && !item.muted);
            const metadata = getMediaMetadata(cw.document, audio || media[0]);
            const artwork = cw.document.querySelector('meta[property="og:image"]')?.content
              || cw.document.querySelector('link[rel*="icon"]')?.href
              || '';
            window.top.postMessage({
              type: 'GHOST_MEDIA_STATE',
              tabId: tab.id,
              playing,
              title: metadata.title,
              artist: metadata.artist,
              artwork,
              mediaCount: media.length,
              mediaKind: audio?.tagName === 'VIDEO' ? 'video' : media.some((item) => item.tagName === 'AUDIO') ? 'audio' : 'video',
              currentTime: audio?.currentTime || 0,
              duration: audio?.duration || 0,
            }, '*');
          } catch { }
        };
        cw.setInterval(sendMediaState, 1000);
        cw.addEventListener('play', sendMediaState, true);
        cw.addEventListener('pause', sendMediaState, true);
        sendMediaState();
      }

      syncFrameState(tab, iframe, true);
    } catch { }
  };


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

  const applyFrameUserAgent = (tab, iframe) => {
    if (!tab || !iframe?.contentWindow) return;
    try {
      const navigatorObject = iframe.contentWindow.navigator;
      if (!navigatorObject) return;
      const decoded = decodeForSite(tab.url);
      const identity = getEffectiveIdentity(options, decoded);
      if (!identity?.ua) {
        // mirror default, put the natives back if we overrode them
        try {
          if (navigatorObject.__ghostNativeUserAgent !== undefined) {
            const native = navigatorObject.__ghostNativeUserAgent;
            Object.defineProperty(navigatorObject, 'userAgent', { get: () => native, configurable: true });
          }
          if (navigatorObject.__ghostNativePlatform !== undefined) {
            const native = navigatorObject.__ghostNativePlatform;
            Object.defineProperty(navigatorObject, 'platform', { get: () => native, configurable: true });
          }
          if (navigatorObject.__ghostNativeVendor !== undefined) {
            const native = navigatorObject.__ghostNativeVendor;
            Object.defineProperty(navigatorObject, 'vendor', { get: () => native, configurable: true });
          }
          if (navigatorObject.__ghostNativeUAD !== undefined) {
            const native = navigatorObject.__ghostNativeUAD;
            Object.defineProperty(navigatorObject, 'userAgentData', { get: () => native, configurable: true });
          }
        } catch { }
        return;
      }
      if (navigatorObject.__ghostNativeUserAgent === undefined) {
        try { navigatorObject.__ghostNativeUserAgent = navigatorObject.userAgent; } catch { navigatorObject.__ghostNativeUserAgent = null; }
      }
      if (navigatorObject.__ghostNativePlatform === undefined) {
        try { navigatorObject.__ghostNativePlatform = navigatorObject.platform; } catch { navigatorObject.__ghostNativePlatform = null; }
      }
      if (navigatorObject.__ghostNativeVendor === undefined) {
        try { navigatorObject.__ghostNativeVendor = navigatorObject.vendor; } catch { navigatorObject.__ghostNativeVendor = null; }
      }
      if (navigatorObject.__ghostNativeUAD === undefined) {
        try { navigatorObject.__ghostNativeUAD = navigatorObject.userAgentData; } catch { navigatorObject.__ghostNativeUAD = null; }
      }
      // whole identity, has to line up with the ua everywhere
      const spoofedUAD = identity.brands
        ? {
          brands: identity.brands.map((b) => ({ brand: b.brand, version: b.version })),
          mobile: !!identity.mobile,
          platform: identity.uadPlatform || '',
          getHighEntropyValues: () => Promise.resolve({
            platform: identity.uadPlatform || '',
            mobile: !!identity.mobile,
            model: '',
            architecture: '',
            bitness: '',
            formFactor: identity.mobile ? 'Mobile' : 'Desktop',
            fullVersionList: identity.brands.map((b) => ({ brand: b.brand, version: `${b.version}.0.0.0` })),
            wow64: false,
          }),
        }
        : undefined;
      Object.defineProperty(navigatorObject, 'userAgent', {
        get: () => identity.ua,
        configurable: true,
      });
      if (identity.platform) {
        Object.defineProperty(navigatorObject, 'platform', {
          get: () => identity.platform,
          configurable: true,
        });
      }
      if (typeof identity.vendor === 'string') {
        Object.defineProperty(navigatorObject, 'vendor', {
          get: () => identity.vendor,
          configurable: true,
        });
      }
      Object.defineProperty(navigatorObject, 'userAgentData', {
        get: () => spoofedUAD,
        configurable: true,
      });
    } catch { }
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
      
      if (!win.__ghostClickBlocked) {
        win.addEventListener('click', (e) => {
          if (win.__ghostPopupBlocked) {
            let target = e.target;
            while (target && target.tagName !== 'A') {
              target = target.parentNode;
            }
            if (target && target.tagName === 'A' && target.target === '_blank') {
              e.preventDefault();
            }
          }
        }, true);
        win.__ghostClickBlocked = true;
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
      // pull the real url back out
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
        live: 'https://tvapp1.com',
        movies: 'https://cinejoy.to',
        anime: 'https://hianime.ms',
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
    if (rawUrl && rawUrl.includes('ghost://musicplayer')) {
      return undefined;
    }
    const policy = getSitePolicyForTab(rawUrl);
    const flags = [
      'allow-scripts',
      'allow-same-origin',
      'allow-forms',
      'allow-pointer-lock',
      'allow-orientation-lock',
      'allow-presentation'
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
    const signature = [
      options.userAgentPreset,
      options.customUserAgent,
      options.browserIdentity,
    ].map((value) => String(value || '')).join('|');
    const changed = uaSignatureRef.current !== null && uaSignatureRef.current !== signature;
    uaSignatureRef.current = signature;
    if (!changed) return;

    tabs.forEach((tab) => {
      if (!tab || isNewTabLikeUrl(tab.url) || isInternalGhostTabUrl(tab.url)) return;
      const iframe = frameRefs.current[tab.id];
      if (!iframe) return;
      applyFrameUserAgent(tab, iframe);
      try {
        iframe.contentWindow.location.reload();
      } catch { }
    });
  }, [tabs, options.userAgentPreset, options.customUserAgent, options.browserIdentity]);

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

  // 2nd retry re-inits the transport, that fixes stuff a reload cant
  const scheduleErrorRetry = (tabId, iframe, url) => {
    // safety net, ghost pages never get retried as a failed load
    const tabUrl = loaderStore.getState().tabs.find((t) => t.id === tabId)?.url;
    if (tabUrl) {
      try {
        if (isInternalGhostTabUrl(tabUrl)) return;
      } catch { }
    }
    const entry = errorRetries.current[tabId] || { count: 0, timer: null };
    if (entry.count >= MAX_ERROR_RETRIES) {
      // give up  leave error page visible instead of infinite loop
      console.warn(`[Viewer] Gave up retrying tab ${tabId} after ${MAX_ERROR_RETRIES} attempts`);
      return;
    }
    if (entry.timer) return; // already scheduled
    const delay = BASE_RETRY_DELAY * Math.pow(2, entry.count); // 1.5s, 3s, 6s
    entry.count += 1;
    entry.timer = setTimeout(async () => {
      entry.timer = null;

      if (entry.count >= 2 && typeof window.__ghostReinitTransport === 'function') {
        try {
          await window.__ghostReinitTransport();
        } catch { }
      }

      let target = url;
      try {
        const current = loaderStore.getState().tabs.find((t) => t.id === tabId);
        if (current) target = getFrameUrl(current.url) || url;
      } catch { }

      try {
        iframe.contentWindow.location.replace(target);
      } catch { /* cross-origin or destroyed */ }
    }, delay);
    errorRetries.current[tabId] = entry;
  };

  const checkStuckTab = (tab, iframe) => {
    if (!tab || isNewTabLikeUrl(tab.url)) return;
    try {
      if (isInternalGhostTabUrl(tab.url)) return;
    } catch { }
    // never disturb media that is actually playing
    if (tab.mediaState?.playing) return;
    // load already fired so its alive even if the page looks empty
    if (!tab.isLoading) {
      if (stuckWatch.current[tab.id]) delete stuckWatch.current[tab.id];
      return;
    }
    // the retry flow owns the tab while it still has budget left
    if (errorRetries.current[tab.id]?.timer) return;
    if ((errorRetries.current[tab.id]?.count || 0) >= MAX_ERROR_RETRIES) return;

    const now = Date.now();
    let entry = stuckWatch.current[tab.id];
    if (!entry || entry.url !== tab.url) {
      entry = { url: tab.url, firstSeen: now, triggers: 0 };
      stuckWatch.current[tab.id] = entry;
    }
    if (now - entry.firstSeen > STUCK_WATCH_TTL_MS) {
      delete stuckWatch.current[tab.id];
      return;
    }
    if (entry.triggers >= STUCK_MAX_TRIGGERS) return;

    // need same-origin access, cross-origin frames get skipped
    try {
      if (!iframe.contentWindow?.document?.documentElement) return;
    } catch { return; }

    if (now - entry.firstSeen >= STUCK_NO_LOAD_MS) {
      entry.triggers += 1;
      entry.firstSeen = now;
      try {
        scheduleErrorRetry(tab.id, iframe, getFrameUrl(tab.url));
      } catch { }
    }
  };

// stable key, rebind only when tabs actually change.
// not every mediaState tick or the bridge tears down and audio detection breaks
  const tabsKey = tabs.map((t) => `${t.id}:${t.url}`).join('|');

  useEffect(() => {
    const listeners = [];

    const bindTab = (tab) => {
      if (!tab || isNewTabLikeUrl(tab.url)) return;
      const iframe = frameRefs.current[tab.id];
      if (!iframe) return;

      const handleLoad = () => {
        const fresh = loaderStore.getState().tabs.find((t) => t.id === tab.id) || tab;
        setLoading(tab.id, false);
        applyProtection(fresh, iframe);
        installFrameBridge(fresh, iframe);
        syncMediaState(fresh, iframe);
        syncFrameState(fresh, iframe, true);
        window.dispatchEvent(
          new CustomEvent('ghost-frame-loaded', {
            detail: { tabId: tab.id, frame: iframe },
          }),
        );

        if ((fresh.url.includes('hianime.ms') || fresh.url.includes('ghost://anime')) && !localStorage.getItem('ghost-hianime-ryu-warned')) {
          showConfirm("Don't use the RYU server for streaming. Others should be fine.", "HiAnime Notice", "Don't show this again", "OK").then((res) => {
            if (res) localStorage.setItem('ghost-hianime-ryu-warned', '1');
          });
        }

        try {
          const d = iframe.contentWindow?.document;
          if (!isInternalGhostTabUrl(fresh.url) && isProxyErrorDocument(d)) {
            const rawUrl = getFrameUrl(fresh.url);

            scheduleErrorRetry(tab.id, iframe, rawUrl);
          } else if (errorRetries.current[tab.id]) {
            clearTimeout(errorRetries.current[tab.id].timer);
            delete errorRetries.current[tab.id];
          }
        } catch { }
      };

      iframe.addEventListener('load', handleLoad);
      listeners.push({ iframe, handleLoad });
    };

    loaderStore.getState().tabs.forEach(bindTab);

    const interval = setInterval(() => {
      const currentTabs = loaderStore.getState().tabs;

      // media bridge on every tab incl. background ones, it is idempotent
      currentTabs.forEach((tab) => {
        if (isNewTabLikeUrl(tab.url)) return;
        const iframe = frameRefs.current[tab.id];
        if (!iframe) return;
        applyProtection(tab, iframe);
        installFrameBridge(tab, iframe);
        syncMediaState(tab, iframe);
      });

      // watchdog runs every ~3.2s to keep layout reads down
      watchTick.current += 1;
      if (watchTick.current % 4 === 0) {
        const liveIds = new Set(currentTabs.map((t) => t.id));
        Object.keys(stuckWatch.current).forEach((id) => {
          if (!liveIds.has(id)) delete stuckWatch.current[id];
        });
        currentTabs.forEach((tab) => {
          if (isNewTabLikeUrl(tab.url)) return;
          const iframe = frameRefs.current[tab.id];
          if (!iframe) return;
          checkStuckTab(tab, iframe);
        });
      }

      const activeTab = currentTabs.find((tab) => tab.active);
      if (!activeTab || isNewTabLikeUrl(activeTab.url)) return;

      const iframe = frameRefs.current[activeTab.id];
      if (!iframe) return;

      try {
        syncFrameState(activeTab, iframe);
        const d = iframe.contentWindow?.document;
// docs can contain the marker strings (the libcurl error doc)
// so a healthy docs tab looked like a failed load
        const isErrorPage = !isInternalGhostTabUrl(activeTab.url) && isProxyErrorDocument(d);

        if (isErrorPage) {
          const rawUrl = getFrameUrl(activeTab.url);

          scheduleErrorRetry(activeTab.id, iframe, rawUrl);
        } else if (errorRetries.current[activeTab.id]) {
          clearTimeout(errorRetries.current[activeTab.id].timer);
          delete errorRetries.current[activeTab.id];
        }
      } catch { }
    }, 800);

    return () => {
      listeners.forEach(({ iframe, handleLoad }) => {
        iframe.removeEventListener('load', handleLoad);
      });
      clearInterval(interval);
      Object.values(errorRetries.current).forEach((entry) => clearTimeout(entry.timer));
    };
  }, [tabsKey, setLoading, updateTitle, setIframeUrl, options.adBlockDefault, options.popupBlockDefault, options.downloadBlockDefault, options.prType, options.engine, options.userAgentPreset, options.customUserAgent, options.browserIdentity, policyTick]);

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
            {wispStatus === true ? (
              <iframe
                key={`${id}:${getFrameSandbox(url)}`}
                ref={(el) => (frameRefs.current[id] = el)}
                data-ghost-tab-id={id}
                src={getFrameUrl(url)}
                sandbox={getFrameSandbox(url)}
                allow="autoplay; fullscreen; clipboard-read; clipboard-write; display-capture; encrypted-media;"
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
                  data-ghost-tab-id={id}
                  src={getFrameUrl(url)}
                  sandbox={getFrameSandbox(url)}
                  allow="autoplay; fullscreen; clipboard-read; clipboard-write; display-capture; encrypted-media;"
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

            {/* invisible overlay, keeps clicks off the content behind it */}
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
