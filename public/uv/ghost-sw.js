/*global UVServiceWorker,__uv$config*/
/*
 * ghost proxy uv sw
 * custom sw wrapper to make it load instantly and fallback nicely
 */
importScripts('uv.bundle.js');
importScripts('uv.config.js');
importScripts(__uv$config.sw || 'uv.sw.js');

const uv = new UVServiceWorker();
const GHOST_YOUTUBE_UA = 'Mozilla/5.0 (SMART-TV; LINUX; Tizen 6.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36';
const GHOST_YOUTUBE_HINTS = {
  brands: [{ brand: 'Chromium', version: '85' }, { brand: 'Google Chrome', version: '85' }, { brand: 'Not-A.Brand', version: '99' }],
  mobile: false,
  uadPlatform: 'Linux',
};
let ghostBaseUA = null;
let ghostIdentity = null; // { brands|null, mobile, uadPlatform|null }
let ghostUaConfigured = false;

const ghostUaReady = new Promise((resolve) => {
  try {
    const request = indexedDB.open('ghost-ua', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('kv');
    request.onsuccess = () => {
      const db = request.result;
      const get = db.transaction('kv', 'readonly').objectStore('kv').get('config');
      get.onsuccess = () => {
        if (!ghostUaConfigured && get.result && typeof get.result.base === 'string') ghostBaseUA = get.result.base;
        if (!ghostUaConfigured && get.result && (get.result.identity === null || (get.result.identity && typeof get.result.identity === 'object'))) {
          ghostIdentity = get.result.identity;
        }
        resolve();
      };
      get.onerror = () => resolve();
    };
    request.onerror = () => resolve();
  } catch {
    resolve();
  }
});

const saveGhostUa = (base, identity) => {
  try {
    const request = indexedDB.open('ghost-ua', 1);
    request.onsuccess = () => {
      const db = request.result;
      db.transaction('kv', 'readwrite').objectStore('kv').put({ base: base || null, identity: identity === undefined ? null : identity }, 'config');
    };
  } catch { }
};

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'ghost-ua-config') return;
  ghostUaConfigured = true;
  ghostBaseUA = event.data.base || null;
  ghostIdentity = event.data.identity === undefined ? null : event.data.identity;
  saveGhostUa(ghostBaseUA, ghostIdentity);
});

const getTargetUrl = (requestUrl) => {
  try {
    const url = new URL(requestUrl);
    const marker = '/uv/service/';
    const encoded = url.pathname.split(marker)[1];
    if (!encoded) return requestUrl;
    return __uv$config.decodeUrl(encoded + url.search + url.hash);
  } catch {
    return requestUrl;
  }
};

const pickUA = (requestUrl) => {
  const host = (() => {
    try { return new URL(getTargetUrl(requestUrl)).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; }
  })();
  if (host === 'youtube.com' || host === 'youtu.be' || host === 'm.youtube.com' || host.endsWith('.youtube.com')) return GHOST_YOUTUBE_UA;
  return ghostBaseUA;
};

const pickHints = (requestUrl) => {
  const host = (() => {
    try { return new URL(getTargetUrl(requestUrl)).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; }
  })();
  if (host === 'youtube.com' || host === 'youtu.be' || host === 'm.youtube.com' || host.endsWith('.youtube.com')) return GHOST_YOUTUBE_HINTS;
  return ghostIdentity;
};

const formatSecChUa = (brands) => (brands || []).map((b) => `"${b.brand}";v="${b.version}"`).join(', ');

// The browser sends Sec-CH-UA* hints from the REAL browser; rewrite them to
// match the spoofed UA, or strip them for identities that send none.
const applyClientHints = (setHeader, deleteHeader, requestUrl) => {
  try {
    const hints = pickHints(requestUrl);
    if (!hints || !hints.brands) {
      deleteHeader('Sec-CH-UA');
      deleteHeader('Sec-CH-UA-Mobile');
      deleteHeader('Sec-CH-UA-Platform');
      deleteHeader('Sec-CH-UA-Full-Version-List');
      deleteHeader('Sec-CH-UA-Arch');
      deleteHeader('Sec-CH-UA-Model');
      deleteHeader('Sec-CH-UA-Platform-Version');
      return;
    }
    const list = formatSecChUa(hints.brands);
    if (list) setHeader('Sec-CH-UA', list);
    setHeader('Sec-CH-UA-Mobile', hints.mobile ? '?1' : '?0');
    if (hints.uadPlatform) setHeader('Sec-CH-UA-Platform', `"${hints.uadPlatform}"`);
    else deleteHeader('Sec-CH-UA-Platform');
    deleteHeader('Sec-CH-UA-Full-Version-List');
    deleteHeader('Sec-CH-UA-Arch');
    deleteHeader('Sec-CH-UA-Model');
    deleteHeader('Sec-CH-UA-Platform-Version');
  } catch { }
};

const originalUvFetch = uv.fetch.bind(uv);
uv.fetch = (event) => {
  const ua = pickUA(event.request.url);
  if (!ua) return originalUvFetch(event);
  const headers = new Headers(event.request.headers);
  headers.set('User-Agent', ua);
  applyClientHints(
    (k, v) => headers.set(k, v),
    (k) => { try { headers.delete(k); } catch { } },
    event.request.url,
  );
  const request = new Request(event.request, { headers });
  const patchedEvent = Object.create(event);
  Object.defineProperty(patchedEvent, 'request', { value: request });
  return originalUvFetch(patchedEvent);
};

// UV exposes the mutable request object immediately before BareClient.fetch.
// This is later than cloning FetchEvent.request and is the path UV itself uses
// for all outgoing headers.
uv.on('request', (event) => {
  const request = event.data;
  const ua = pickUA(request?.url || event.url || '');
  if (ua && request?.headers) {
    if (typeof request.headers.set === 'function') {
      request.headers.set('User-Agent', ua);
      applyClientHints(
        (k, v) => request.headers.set(k, v),
        (k) => { try { request.headers.delete(k); } catch { } },
        request?.url || event.url || '',
      );
    } else request.headers['user-agent'] = ua;
  }
});

async function handleRequest(event) {
  await ghostUaReady;
  if (uv.route(event)) {
    return await uv.fetch(event);
  }
  // only fetch same origin directly. block external stuff so they dont escape proxying.
  const url = new URL(event.request.url);
  if (url.origin === location.origin) {
    return await fetch(event.request);
  }
  return new Response('Blocked non-proxied cross-origin request', {
    status: 470,
    statusText: 'Proxy Required',
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}

self.addEventListener('fetch', (event) => {
  // let ai requests go thru directly so cors doesnt break
  const url = new URL(event.request.url);
  if (url.hostname === 'api.edisonlearningcenter.me') return;

  event.respondWith(handleRequest(event));
});

