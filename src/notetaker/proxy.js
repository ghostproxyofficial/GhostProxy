import { BareMuxConnection, BareClient } from 'bare-mux-fork';
import { PROVIDERS } from './ai';

const WISP = 'wss://service.khanacademyy.org/socket/';

export const AI_HOSTS = [
  'huggingface.co',
  'hf.co',
  'cdn-lfs.huggingface.co',
  'cdn-lfs-us-1.huggingface.co',
  'cdn.jsdelivr.net',
  'unpkg.com',
  'esm.sh',
  'raw.githubusercontent.com',
  'objects.githubusercontent.com',
];

const providerHosts = () => Object.values(PROVIDERS)
  .map((p) => {
    try { return new URL(p.base || '').hostname; } catch { return ''; }
  })
  .filter(Boolean);

let clientPromise = null;

const readWisp = () => {
  try {
    const manual = JSON.parse(localStorage.getItem('options') || '{}')?.wServer;
    if (manual) return String(manual);
    const cached = localStorage.getItem('ghost:lastGoodWisp');
    if (cached) return String(cached);
  } catch { }
  return WISP;
};

export const proxyEnabled = () => {
  try {
    const raw = localStorage.getItem('nt:routeProxy');
    return raw === null ? true : raw === '1';
  } catch {
    return true;
  }
};

export const setProxyEnabled = (on) => {
  try { localStorage.setItem('nt:routeProxy', on ? '1' : '0'); } catch { }
};

const getClient = async () => {
  if (clientPromise) return clientPromise;
  clientPromise = (async () => {
    const connection = new BareMuxConnection('/baremux/worker.js');
    await connection.setTransport('/epoxy/index.mjs', [{ wisp: readWisp() }]);
    const port = await connection.getInnerPort();
    return new BareClient(port);
  })().catch((error) => {
    clientPromise = null;
    throw error;
  });
  return clientPromise;
};

export const proxiedFetch = async (input, init = {}) => {
  const url = typeof input === 'string' ? input : input?.url;
  if (!url) throw new Error('proxiedFetch needs a url');
  const client = await getClient();
  const response = await client.fetch(url, init);
  return response;
};

const shouldProxy = (url) => {
  try {
    const host = new URL(url, location.href).hostname.toLowerCase();
    if (providerHosts().includes(host)) return true;
    return AI_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
};

let installed = null;

export const installProxyFetch = () => {
  if (installed || typeof window === 'undefined') return;
  const original = window.fetch.bind(window);
  installed = { original };
  window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    if (url && proxyEnabled() && shouldProxy(url)) {
      try {
        return await proxiedFetch(url, init);
      } catch (error) {
        console.warn('[notetaker] proxy fetch failed, trying direct', url, error);
      }
    }
    return original(input, init);
  };
};

export const uninstallProxyFetch = () => {
  if (!installed) return;
  window.fetch = installed.original;
  installed = null;
};

export const proxyStatus = async () => {
  try {
    const client = await getClient();
    return { ok: true, wisp: readWisp(), client: !!client };
  } catch (error) {
    return { ok: false, wisp: readWisp(), error: String(error?.message || error) };
  }
};
