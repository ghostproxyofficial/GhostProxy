navigator.userAgent.includes("Firefox") && Object.defineProperty(globalThis, "crossOriginIsolated", { value: !0, writable: !1 });
importScripts("/scram/scramjet.all.js");
const { ScramjetServiceWorker: ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker;

// ghost ua override.
// this scramjet build ignores the inject config so we set the ua at the
// baremux transport layer instead. the header goes over the wisp socket where
// the browser forbidden-header rules dont apply.
// client posts {type:'ghost-ua-config', base, youtube}
const GHOST_YOUTUBE_UA = "Mozilla/5.0 (SMART-TV; LINUX; Tizen 6.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36";
// client hints for the youtube tv identity (chrome 85 desktop)
const GHOST_YOUTUBE_HINTS = {
  brands: [{ brand: "Chromium", version: "85" }, { brand: "Google Chrome", version: "85" }, { brand: "Not-A.Brand", version: "99" }],
  mobile: false,
  uadPlatform: "Linux",
};
let ghostBaseUA = null;
let ghostIdentity = null; // { brands|null, mobile, uadPlatform|null }
let ghostUaConfigured = false;

// persist to idb, the sw gets evicted when idle so an in-memory value
// would be gone by the next navigation
function ghostIdb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("ghost-ua", 1);
    req.onupgradeneeded = () => { try { req.result.createObjectStore("kv"); } catch { } };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function ghostLoadUa() {
  try {
    const db = await ghostIdb();
    const value = await new Promise((resolve, reject) => {
      const get = db.transaction("kv", "readonly").objectStore("kv").get("config");
      get.onsuccess = () => resolve(get.result);
      get.onerror = () => reject(get.error);
    });
    if (!ghostUaConfigured) {
      if (value && typeof value.base === "string") ghostBaseUA = value.base;
      else if (value && value.base === null) ghostBaseUA = null;
      if (value && (value.identity === null || (value.identity && typeof value.identity === "object"))) {
        ghostIdentity = value.identity;
      }
    }
  } catch { }
}
async function ghostSaveUa(base, identity) {
  try {
    const db = await ghostIdb();
    db.transaction("kv", "readwrite").objectStore("kv").put({ base: base || null, identity: identity === undefined ? null : identity }, "config");
  } catch { }
}
const ghostUaReady = ghostLoadUa();

// take effect right away instead of waiting for every client to close
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

function ghostHostOf(url) {
  try {
    const href = typeof url === "string" ? url : (url && url.href) ? url.href : String(url);
    return new URL(href).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function ghostIsYouTubeUrl(url) {
  const h = ghostHostOf(url);
  return h === "youtube.com" || h === "youtu.be" || h === "m.youtube.com" || h.endsWith(".youtube.com");
}

function ghostPickUA(url) {
  if (ghostIsYouTubeUrl(url)) return GHOST_YOUTUBE_UA;
  return ghostBaseUA;
}

function ghostPickHints(url) {
  if (ghostIsYouTubeUrl(url)) return GHOST_YOUTUBE_HINTS;
  return ghostIdentity;
}

// sec-ch-ua hints come from the real browser so they can contradict the ua
// we spoofed. rewrite them to match, or drop them when the real browser
// sends none (firefox, safari, consoles)
function ghostFormatSecChUa(brands) {
  return (brands || []).map((b) => `"${b.brand}";v="${b.version}"`).join(", ");
}

function ghostApplyClientHints(setHeader, deleteHeader, url) {
  try {
    const hints = ghostPickHints(url);
    if (!hints || !hints.brands) {
      deleteHeader("Sec-CH-UA");
      deleteHeader("Sec-CH-UA-Mobile");
      deleteHeader("Sec-CH-UA-Platform");
      deleteHeader("Sec-CH-UA-Full-Version-List");
      deleteHeader("Sec-CH-UA-Arch");
      deleteHeader("Sec-CH-UA-Model");
      deleteHeader("Sec-CH-UA-Platform-Version");
      return;
    }
    const list = ghostFormatSecChUa(hints.brands);
    if (list) setHeader("Sec-CH-UA", list);
    setHeader("Sec-CH-UA-Mobile", hints.mobile ? "?1" : "?0");
    if (hints.uadPlatform) setHeader("Sec-CH-UA-Platform", `"${hints.uadPlatform}"`);
    else deleteHeader("Sec-CH-UA-Platform");
    deleteHeader("Sec-CH-UA-Full-Version-List");
    deleteHeader("Sec-CH-UA-Arch");
    deleteHeader("Sec-CH-UA-Model");
    deleteHeader("Sec-CH-UA-Platform-Version");
  } catch { }
}

try {
  const originalClientFetch = scramjet.client.fetch.bind(scramjet.client);
  scramjet.client.fetch = (url, opts = {}) => {
    const ua = ghostPickUA(url);
    if (!ua) return originalClientFetch(url, opts);
    let headers;
    try { headers = new Headers(opts.headers || {}); } catch { headers = new Headers(); }
    headers.set("User-Agent", ua);
    ghostApplyClientHints(
      (k, v) => headers.set(k, v),
      (k) => headers.delete(k),
      url,
    );
    return originalClientFetch(url, { ...opts, headers });
  };
} catch (err) {
  console.warn("ghost-ua: could not wrap scramjet client fetch", err);
}

// scramjet fires this right before it hands the request to bare, so mutating
// requestHeaders here actually reaches upstream. wrapping BareClient.fetch
// alone is too late on some builds
scramjet.addEventListener("request", (event) => {
  const ua = ghostPickUA(event.url);
  if (!ua || !event.requestHeaders) return;
  if (typeof event.requestHeaders.set === "function") {
    event.requestHeaders.set("User-Agent", ua);
    ghostApplyClientHints(
      (k, v) => event.requestHeaders.set(k, v),
      (k) => { try { event.requestHeaders.delete(k); } catch { } },
      event.url,
    );
  } else {
    event.requestHeaders["user-agent"] = ua;
    event.requestHeaders["User-Agent"] = ua;
    ghostApplyClientHints(
      (k, v) => { event.requestHeaders[k] = v; },
      (k) => { try { delete event.requestHeaders[k]; } catch { } },
      event.url,
    );
  }
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (data && data.type === "ghost-ua-config") {
    ghostUaConfigured = true;
    ghostBaseUA = data.base || null;
    ghostIdentity = data.identity === undefined ? null : data.identity;
    ghostSaveUa(ghostBaseUA, ghostIdentity);
  }
});

// keyboard shortcut bridge.
// scramjet v1 ignores the inject config so the keydown bridge never ran and
// shortcuts only worked on ghost surfaces. inject it into the proxied html
// here in the sw, same fallback as the ua
const GHOST_SHORTCUT_BRIDGE = `<script>(function(){
  if (window.__ghostShortcutBridge) return;
  window.__ghostShortcutBridge = true;
  var shortcuts = ["Alt+T","Alt+W","Alt+Shift+T","Alt+D","Alt+R","F5","F12","F11","Alt+L"];
  window.addEventListener('message', function(e){
    if (e.data && e.data.type === 'ghost-update-shortcuts' && Array.isArray(e.data.shortcuts)) shortcuts = e.data.shortcuts;
  });
  try { window.top.postMessage({ type: 'ghost-request-shortcuts' }, '*'); } catch (e) {}
  var steal = function(e){
    var key = e.key;
    if (!key) return;
    if (key === ' ' || key === 'Spacebar') key = 'Space';
    if (key.length === 1) key = key.toUpperCase();
    var out = [];
    if (e.ctrlKey) out.push('Ctrl');
    if (e.altKey) out.push('Alt');
    if (e.shiftKey) out.push('Shift');
    if (e.metaKey) out.push('Meta');
    out.push(key);
    var combo = out.join('+');
    if (shortcuts.indexOf(combo) !== -1 || combo.indexOf('F11') === 0 || combo.indexOf('F12') === 0 || combo.indexOf('F5') === 0) {
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      try {
        window.top.postMessage({ type: 'ghost-shortcut', key: e.key, altKey: e.altKey, ctrlKey: e.ctrlKey, shiftKey: e.shiftKey, metaKey: e.metaKey }, '*');
      } catch (err) {}
    }
  };
  window.addEventListener('keydown', steal, true);
  document.addEventListener('keydown', steal, true);
})();<\/script>`;

const GHOST_HTML_INJECT_TYPES = /text\/html|application\/xhtml\+xml/i;

function ghostGuessContentType(headers) {
  try {
    if (headers && typeof headers.get === "function") {
      return String(headers.get("content-type") || "");
    }
  } catch { }
  if (headers && typeof headers === "object") {
    return String(headers["content-type"] || headers["Content-Type"] || "");
  }
  return "";
}

// scramjet builds the response off responseBody after handleResponse fires,
// so mutating that field is what actually gets the bridge in
function ghostInjectShortcutBridge(event) {
  try {
    const body = event.responseBody;
    const isString = typeof body === "string";
    const isBytes = body instanceof Uint8Array || body instanceof ArrayBuffer;
    if (!isString && !isBytes) return event;

    const contentType = ghostGuessContentType(event.responseHeaders);
    if (!GHOST_HTML_INJECT_TYPES.test(contentType)) return event;

    let text = isString ? body : new TextDecoder("utf-8").decode(body instanceof Uint8Array ? body : new Uint8Array(body));
    if (text.indexOf("__ghostShortcutBridge") !== -1) return event;

    if (/<head[^>]*>/i.test(text)) {
      text = text.replace(/<head[^>]*>/i, (m) => m + GHOST_SHORTCUT_BRIDGE);
    } else if (/<html[^>]*>/i.test(text)) {
      text = text.replace(/<html[^>]*>/i, (m) => m + GHOST_SHORTCUT_BRIDGE);
    } else {
      text = GHOST_SHORTCUT_BRIDGE + text;
    }

    // keep the body type or scramjet builds the response wrong
    event.responseBody = isString ? text : new TextEncoder().encode(text);
    if (event.rawResponse) event.rawResponse.body = event.responseBody;
  } catch (err) {
    console.warn("ghost-shortcut: injection failed", err);
  }
  return event;
}

scramjet.addEventListener("handleResponse", (event) => {
  ghostInjectShortcutBridge(event);
});

async function handleRequest(e) { return await ghostUaReady, await scramjet.loadConfig(), scramjet.route(e) ? scramjet.fetch(e) : fetch(e.request); }
let playgroundData;
self.addEventListener("fetch", (e => { e.respondWith(handleRequest(e)); }));
self.addEventListener("message", (({ data: e }) => { "playgroundData" === e.type && (playgroundData = e); }));
scramjet.addEventListener("request", (e => {
  if (playgroundData && e.url.href.startsWith(playgroundData.origin)) {
    const s = {}, t = playgroundData.origin;
    e.url.href === t + "/" ? (s["content-type"] = "text/html", e.response = new Response(playgroundData.html, { headers: s })) : e.url.href === t + "/style.css" ? (s["content-type"] = "text/css", e.response = new Response(playgroundData.css, { headers: s })) : e.url.href === t + "/script.js" ? (s["content-type"] = "application/javascript", e.response = new Response(playgroundData.js, { headers: s })) : e.response = new Response("empty response", { headers: s }), e.response.rawHeaders = s, e.response.rawResponse = { body: e.response.body, headers: s, status: e.response.status, statusText: e.response.statusText }, e.response.finalURL = e.url.toString();
  }
}));
