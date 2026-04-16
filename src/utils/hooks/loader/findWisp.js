export async function fetchW() {
  const cacheKey = 'ghost:lastGoodWisp';
  const bootstrapEndpoints = [
    'wss://doge.studyeurope.edu.eu.org/wisp/',
  ];

  const normalizeEndpoint = (value) => {
    if (!value) return null;
    const raw = String(value).trim();
    if (!raw) return null;
    if (raw === 'undefined' || raw === 'null') return null;

    try {
      const normalized = raw.startsWith('ws://') || raw.startsWith('wss://')
        ? raw
        : raw.startsWith('http://')
          ? `ws://${raw.replace(/^http:\/\//, '')}`
          : raw.startsWith('https://')
            ? `wss://${raw.replace(/^https:\/\//, '')}`
            : `wss://${raw.replace(/^\/+/, '')}`;
      const parsed = new URL(normalized);
      const host = String(parsed.hostname || '').trim().toLowerCase();
      if (!host || host === 'undefined' || host === 'null') return null;
      const pathname = parsed.pathname && parsed.pathname !== '/' ? parsed.pathname : '/wisp/';
      const trailingSlashPath = pathname.endsWith('/') ? pathname : `${pathname}/`;
      const protocol = parsed.protocol === 'wss:' ? 'wss:' : 'ws:';
      return `${protocol}//${parsed.host}${trailingSlashPath}`;
    } catch {
      return null;
    }
  };

  const readCached = () => {
    try {
      return normalizeEndpoint(localStorage.getItem(cacheKey));
    } catch {
      return null;
    }
  };

  const writeCached = (endpoint) => {
    try {
      localStorage.setItem(cacheKey, endpoint);
    } catch {
    }
  };

  let tx;
  try {
    tx = await fetch('https://cdn.jsdelivr.net/gh/ashxmed/symmetrical-adventure@latest/synapse.js', {
      cache: 'no-store',
    }).then((res) => res.json());
  } catch {
    return null;
  }

  let settled = false;
  let cur = 0;
  const dc = async (p, k) => {
    const E = new TextEncoder(), D = new TextDecoder(),
      a = [64, 56, 107], b = "*Km", c = "01011", e = "&&";
    if (!p && !k) return String.fromCharCode(...a) + b + c + e;
    const km = await crypto.subtle.importKey("raw", E.encode(k), "PBKDF2", 0, ["deriveKey"]),
      K = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: new Uint8Array(p.s), iterations: 1e5, hash: "SHA-256" }, km, { name: "AES-GCM", length: 256 }, 0, ["decrypt"]),
      d = await crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(p.i) }, K, new Uint8Array(p.d));
    return D.decode(d)
  };

  let arr;
  try {
    arr = (await dc(tx, await dc()))
      .split(',')
      .map((u) => u.trim())
      .filter(Boolean)
      .map((u) => `wss://${u}/wisp/`);
  } catch {
    arr = [];
  }

  const cached = readCached();
  const endpoints = [
    ...new Set([
      cached,
      ...bootstrapEndpoints,
      ...arr.map(normalizeEndpoint),
    ].map(normalizeEndpoint).filter(Boolean)),
  ];

  if (!endpoints.length) return null;
  let c = endpoints.length;

  return new Promise((resolve) => {
    for (const url of endpoints) {
      let ws = new WebSocket(url);
      ws.onopen = () => {
        settled = true;
        ws.close();
        writeCached(url);
        resolve(url);
      };
      ws.onerror = () => {
        ws.close();
        cur++;
        if (cur == c) {
          settled = true;
          resolve(null);
        }
      };
    }

    setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(null);
      }
    }, 10000);
  });
}

// var url = await fetchW().then((r) => r);
// if (url == null) console.error('no sockets connected');
// else console.log(url);
