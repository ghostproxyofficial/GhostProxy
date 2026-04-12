const k = new TextEncoder().encode(
  btoa(new Date().toISOString().slice(0, 10) + location.host)
    .split('')
    .reverse()
    .join('')
    .slice(6.7),
);
export const encoding = {
  enc: (s) => {
    if (!s) return s;
    try {
      const d = new TextEncoder().encode(s),
        o = new Uint8Array(d.length);
      for (let i = 0; i < d.length; i++) o[i] = d[i] ^ k[i % 8];
      return Array.from(o, (b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      return s;
    }
  },
  dnc: (s) => {
    if (!s) return s;
    try {
      const n =
        Math.min(
          s.indexOf('?') + 1 || s.length + 1,
          s.indexOf('#') + 1 || s.length + 1,
          s.indexOf('&') + 1 || s.length + 1,
        ) - 1;
      let h = 0;
      for (let i = 0; i < n && i < s.length; i++) {
        const c = s.charCodeAt(i);
        if (!((c >= 48 && c <= 57) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102))) break;
        h = i + 1;
      }
      if (h < 2 || h % 2) return decodeURIComponent(s);
      const l = h >> 1,
        o = new Uint8Array(l);
      for (let i = 0; i < l; i++) {
        const x = i << 1;
        o[i] = parseInt(s[x] + s[x + 1], 16) ^ k[i % 8];
      }
      return new TextDecoder().decode(o) + s.slice(h);
    } catch {
      return decodeURIComponent(s);
    }
  },
};

export const INTERNAL_GHOST_PATHS = [
  '/apps',
  '/settings',
  '/discover',
  '/docs',
  '/search',
  '/code',
  '/ai',
  '/remote',
  '/new',
];

const isInternalGhostPath = (pathname) => {
  const normalized = String(pathname || '').replace(/\/$/, '') || '/';
  return INTERNAL_GHOST_PATHS.some((base) => normalized === base || normalized.startsWith(`${base}/`));
};

const isInternalGhostCandidate = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return false;
  if (raw === 'tabs://new') return true;
  if (raw.startsWith('ghost://') || raw.startsWith('tabs://')) return true;

  try {
    const parsed = new URL(raw, location.origin);

    if (parsed.searchParams.get('ghost') === '1') return true;
    if (parsed.origin !== location.origin) return false;

    if (isInternalGhostPath(parsed.pathname)) return true;

    let hashStr = parsed.hash || '';
    if (!hashStr) return false;
    if (hashStr.includes('ghost=1')) return true;

    if (hashStr.startsWith('#')) hashStr = hashStr.slice(1);
    if (!hashStr.startsWith('/')) hashStr = `/${hashStr}`;
    const hashPath = hashStr.split('?')[0];

    return isInternalGhostPath(hashPath);
  } catch {
    return false;
  }
};

export const isInternalGhostTabUrl = (urlValue, iframeUrlValue = '') => {
  const raw = String(urlValue || '').trim();
  const iframe = String(iframeUrlValue || '').trim();
  if (!raw && !iframe) return true;

  // The tab URL is the source of truth. Iframe URLs can be stale during transitions.
  if (raw) {
    return isInternalGhostCandidate(raw);
  }

  return isInternalGhostCandidate(iframe);
};

const check = (inp, engine) => {
  const trimmed = inp.trim();
  if (!trimmed) return '';

  const passthroughProtocol = /^(data:|blob:|about:)/i;
  if (passthroughProtocol.test(trimmed)) {
    return trimmed;
  }

  const hasProtocol = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed);
  if (hasProtocol) {
    return trimmed;
  }

  const isUrl =
    /^[\w-]+\.[\w.-]+/i.test(trimmed) ||
    trimmed.startsWith('localhost');

  if (isUrl) {
    return `https://${trimmed}`;
  } else {
    return engine + encodeURIComponent(trimmed);
  }
};

const resolveGhostRoute = (input) => {
  const map = {
    '': 'tabs://new',
    'home': 'tabs://new',
    'new-tab': 'tabs://new',
    'newtab': 'tabs://new',
    'apps': `${location.origin}/apps?ghost=1`,
    'settings': `${location.origin}/settings?ghost=1`,
    'entertainment': `${location.origin}/discover?ghost=1`,
    'discover': `${location.origin}/discover?ghost=1`,
    'games': `${location.origin}/discover?ghost=1&tab=games`,
    'tv': `${location.origin}/discover?ghost=1&tab=tv`,
    'music': `${location.origin}/discover?ghost=1&tab=music`,
    'docs': `${location.origin}/docs?ghost=1`,
    'search': `${location.origin}/search?ghost=1`,
    'code': `${location.origin}/code?ghost=1`,
    'code-runner': `${location.origin}/code?ghost=1&run=1`,
    'ai': `${location.origin}/ai?ghost=1`,
    'remote': `${location.origin}/remote?ghost=1`,
  };

  const raw = String(input || '').trim();
  if (!raw) return null;

  const normalized = raw.toLowerCase();
  let route = null;

  if (normalized.startsWith('ghost://')) {
    route = normalized.replace(/^ghost:\/\//, '').replace(/^\/+/, '').split(/[?#]/)[0];
  } else {
    const simpleAliases = new Set([
      'home',
      'new',
      'new-tab',
      'newtab',
      'apps',
      'settings',
      'entertainment',
      'discover',
      'games',
      'tv',
      'music',
      'docs',
      'search',
      'code',
      'code-runner',
      'ai',
      'remote',
    ]);

    if (simpleAliases.has(normalized)) {
      route = normalized;
    } else if (normalized.startsWith('/')) {
      route = normalized.replace(/^\/+/, '').split(/[?#]/)[0];
    } else {
      try {
        const parsed = new URL(raw, location.origin);
        if (parsed.origin === location.origin) {
          route = parsed.pathname.replace(/^\/+/, '').split(/[?#]/)[0] || 'home';
        }
      } catch { }
    }
  }

  if (!route) return null;

  if (route.startsWith('docs/')) {
    return `${location.origin}/docs/${route.slice(5)}?ghost=1`;
  }

  return map[route] || null;
};

export const toGhostDisplayUrl = (url) => {
  if (!url) return '';

  const raw = String(url || '').trim();
  if (!raw) return '';
  if (raw === 'tabs://new') return 'ghost://home';

  if (/^ghost:\/\//i.test(raw)) {
    const route = raw.replace(/^ghost:\/\//i, '').replace(/^\/+/, '');
    const normalizedRoute = route.toLowerCase();

    if (!route || normalizedRoute === 'home' || normalizedRoute === 'new-tab' || normalizedRoute === 'newtab') {
      return 'ghost://home';
    }

    if (normalizedRoute.startsWith('docs/')) {
      return `ghost://docs/${route.slice(5)}`;
    }

    const allowedRoutes = new Set([
      'apps',
      'settings',
      'entertainment',
      'discover',
      'games',
      'tv',
      'music',
      'docs',
      'search',
      'code',
      'ai',
      'remote',
    ]);

    if (allowedRoutes.has(normalizedRoute)) {
      if (['entertainment', 'discover', 'games', 'tv', 'music'].includes(normalizedRoute)) {
        return 'ghost://entertainment';
      }
      return `ghost://${normalizedRoute}`;
    }
  }

  try {
    const parsed = new URL(raw, location.origin);
    if (parsed.origin !== location.origin) return null;

    const path = parsed.pathname.replace(/\/$/, '') || '/';
    if (path.startsWith('/docs/')) {
      return `ghost://docs/${path.slice('/docs/'.length)}`;
    }

    if (path === '/discover' || path === '/discover/r') {
      return 'ghost://entertainment';
    }

    const map = {
      '/': 'ghost://home',
      '/new': 'ghost://new-tab',
      '/apps': 'ghost://apps',
      '/settings': 'ghost://settings',
      '/docs': 'ghost://docs',
      '/search': 'ghost://search',
      '/code': 'ghost://code',
      '/ai': 'ghost://ai',
      '/remote': 'ghost://remote',
    };

    return map[path] || null;
  } catch {
    return null;
  }
};

import whitelist from '/src/data/whitelist.json';
import appsData from '/src/data/apps.json';

const scrwlist = new Set([
  ...whitelist,
  ...Object.values(appsData.games || {}).flatMap(cat =>
    cat.filter(g => g.url && !g.local).map(g => {
      try { return new URL(g.url.startsWith('http') ? g.url : `https://${g.url}`).hostname.replace(/^www\./, ''); }
      catch { return null; }
    }).filter(Boolean)
  )
]);

export const process = (input, decode = false, prType, engine = "https://duckduckgo.com/?q=") => {
  const rawInput = String(input || '').trim();
  if (!decode && /^(data:|blob:|about:)/i.test(rawInput)) {
    return rawInput;
  }

  const ghostRoute = resolveGhostRoute(input);
  if (!decode && ghostRoute) {
    return ghostRoute;
  }

  let prefix;

  switch (prType) {
    case 'uv':
      prefix = '/uv/service/';
      break;
    case 'scr':
      prefix = '/scramjet/';
      break;
    default: {
      const isDirectUrl =
        /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(rawInput) ||
        /^[\w-]+\.[\w.-]+/i.test(String(input || '').trim()) ||
        rawInput.startsWith('localhost');

      if (!isDirectUrl) {
        prefix = '/uv/service/';
        break;
      }
      const url = check(input, engine);
      const match = [...scrwlist].some(d => url.includes(d));
      prefix = match && globalThis.__ghostScramjetReady ? '/scramjet/' : '/uv/service/';
    }
  }

  if (decode) {
    const uvPart = input.split('/uv/service/')[1];
    const scrPart = input.split('/scramjet/')[1];
    let decoded = input;
    if (uvPart) {
      decoded = encoding.dnc(uvPart);
    } else if (scrPart) {
      decoded = decodeURIComponent(scrPart);
    } else {
      try {
        decoded = decodeURIComponent(input);
      } catch {
        try {
          decoded = encoding.dnc(input);
        } catch {
          decoded = input;
        }
      }
    }
    return decoded.endsWith('/') ? decoded.slice(0, -1) : decoded;
  } else {
    const final = check(input, engine);
    const encoded = prefix === '/scramjet/' ? encodeURIComponent(final) : encoding.enc(final);
    let base = `${location.protocol}//${location.host}`;

    try {
      const opts = JSON.parse(localStorage.getItem('options') || '{}');
      if (opts.proxyRouting === 'remote' && opts.remoteProxyServer) {
        const rawRemote = String(opts.remoteProxyServer || '').trim();
        const remoteType = String(opts.remoteProxyType || 'http').toLowerCase();
        const hasScheme = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(rawRemote);
        const normalized = hasScheme
          ? rawRemote
          : remoteType === 'http'
            ? `https://${rawRemote}`
            : `${remoteType}://${rawRemote}`;

        const parsed = new URL(normalized);
        const protocol = String(parsed.protocol || '').toLowerCase();
        if (protocol === 'http:' || protocol === 'https:' || protocol === 'ws:' || protocol === 'wss:') {
          base = parsed.origin;
        }
      }
    } catch { }

    return `${base}${prefix}${encoded}`;
  }
};

export function openEmbed(url) {
  if (isInternalGhostTabUrl(url)) return null;
  var win = window.open();
  if (!win?.document?.body) return null;
  win.document.body.style.margin = "0";
  win.document.body.style.height = '100%';
  var iframe = win.document.createElement("iframe");
  iframe.style.border = "none";
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.margin = "0";
  iframe.src = url;
  win.document.body.appendChild(iframe);
  return win;
}