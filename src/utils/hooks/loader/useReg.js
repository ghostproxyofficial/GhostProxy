import { useEffect } from 'react';
import { BareMuxConnection } from '@mercuryworkshop/bare-mux';
import { useOptions } from '/src/utils/optionsContext';
import store from './useLoaderStore';

export default function useReg() {
  const { options } = useOptions();
  const defaultWispEndpoint = 'wss://dogekeepthisasecret.undoanarchy.rocks/wisp/';
  const sws = [{ path: '/uv/ghost-sw.js', scope: '/uv/' }, { path: '/s_sw.js', scope: '/scramjet/' }];
  const setWispStatus = store((s) => s.setWispStatus);

  const normalizeWispEndpoint = (value) => {
    if (!value) return null;

    const raw = String(value).trim();
    if (!raw) return null;
    if (raw === 'undefined' || raw === 'null') return null;

    try {
      const normalized = raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('ws://') || raw.startsWith('wss://')
        ? raw
        : `https://${raw}`;
      const parsed = new URL(normalized);
      const host = String(parsed.hostname || '').trim().toLowerCase();
      if (!host || host === 'undefined' || host === 'null') return null;
      const protocol = parsed.protocol === 'https:' || parsed.protocol === 'wss:' ? 'wss:' : 'ws:';
      const pathname = parsed.pathname && parsed.pathname !== '/' ? parsed.pathname : '/wisp/';
      const trailingSlashPath = pathname.endsWith('/') ? pathname : `${pathname}/`;

      return `${protocol}//${parsed.host}${trailingSlashPath}`;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const init = async () => {
      if (!window.scr) {
        const script = document.createElement('script');
        script.src = '/scram/scramjet.all.js';
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const { ScramjetController } = $scramjetLoadController();

      window.scr = new ScramjetController({
        files: {
          wasm: '/scram/scramjet.wasm.wasm',
          all: '/scram/scramjet.all.js',
          sync: '/scram/scramjet.sync.js',
        },
        flags: { rewriterLogs: false, scramitize: false, cleanErrors: true, sourcemaps: true },
        inject: [
          {
            host: /.*/,
            injectTo: "head",
            html: `
            <script>
                (function() {
                    if (window === window.parent) return;
                    let shortcuts = ["Alt+T", "Alt+W", "Alt+Shift+T", "Alt+D", "Alt+R", "F5", "F12", "F11", "Alt+L"];
                    window.addEventListener('message', (e) => {
                        if (e.data && e.data.type === 'ghost-update-shortcuts') shortcuts = e.data.shortcuts;
                    });
                    window.addEventListener('keydown', (e) => {
                        let key = e.key;
                        if (key === ' ' || key === 'Spacebar') key = 'Space';
                        if (key.length === 1) key = key.toUpperCase();
                        const out = [];
                        if (e.ctrlKey) out.push('Ctrl');
                        if (e.altKey) out.push('Alt');
                        if (e.shiftKey) out.push('Shift');
                        if (e.metaKey) out.push('Meta');
                        out.push(key);
                        const combo = out.join('+');

                        if (shortcuts.includes(combo) || combo.startsWith('F11') || combo.startsWith('F12') || combo.startsWith('F5')) {
                            e.preventDefault();
                            e.stopPropagation();
                            window.top.postMessage({
                                type: 'ghost-shortcut',
                                key: e.key,
                                altKey: e.altKey,
                                ctrlKey: e.ctrlKey,
                                shiftKey: e.shiftKey,
                                metaKey: e.metaKey
                            }, '*');
                        }
                    }, { capture: true });
                })();
            </script>
            `
          }
        ]
      });

      window.scr.init();

      for (const sw of sws) {
        try {
          await navigator.serviceWorker.register(
            sw.path,
            sw.scope ? { scope: sw.scope } : undefined,
          );
        } catch (err) {
          console.warn(`SW reg err (${sw.path}):`, err);
        }
      }

      globalThis.__ghostScramjetReady = true;

      const connection = new BareMuxConnection('/baremux/worker.js');
      setWispStatus('init');
      const manualWisp = normalizeWispEndpoint(options.wServer);
      const defaultWisp = normalizeWispEndpoint(defaultWispEndpoint);
      const isInvalidWisp = (value) => /\/\/(undefined|null)(?::|\/|$)/i.test(String(value || ''));
      const uniqueWispCandidates = [manualWisp || defaultWisp].filter((candidate) => candidate && !isInvalidWisp(candidate));

      const wispUrl = uniqueWispCandidates[0] || null;

      const preferredTransport =
        String(options.transport || 'libcurl').toLowerCase() === 'epoxy'
          ? 'epoxy'
          : 'libcurl';

      const resolveRemoteProxyUrl = () => {
        if (String(options.proxyRouting || 'direct').toLowerCase() !== 'remote') return null;
        const raw = String(options.remoteProxyServer || '').trim();
        if (!raw || raw === 'undefined' || raw === 'null') return null;

        const selectedType = String(options.remoteProxyType || 'http').toLowerCase();
        const scheme = ['http', 'socks4', 'socks5'].includes(selectedType) ? selectedType : 'http';

        try {
          const hasScheme = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(raw);
          const normalized = hasScheme ? raw : `${scheme}://${raw}`;
          const parsed = new URL(normalized);
          const host = String(parsed.hostname || '').trim().toLowerCase();
          if (!host || host === 'undefined' || host === 'null') return null;
          const auth = parsed.username
            ? `${parsed.username}${parsed.password ? `:${parsed.password}` : ''}@`
            : '';
          const port = parsed.port ? `:${parsed.port}` : '';
          return `${parsed.protocol}//${auth}${parsed.hostname}${port}`;
        } catch {
          return null;
        }
      };

      const remoteProxyUrl = resolveRemoteProxyUrl();

      const setTransportByName = async (name, endpoint) => {
        const modulePath = name === 'epoxy' ? '/epoxy/index.mjs' : '/libcurl/index.mjs';
        const transportConfig = { wisp: endpoint };
        if (remoteProxyUrl) {
          transportConfig.proxy = remoteProxyUrl;
        }
        await connection.setTransport(modulePath, [transportConfig]);
        window.__ghostActiveTransport = name;
        window.__ghostActiveRemoteProxy = remoteProxyUrl;
      };

      const fallbackTransport = preferredTransport === 'epoxy' ? 'libcurl' : 'epoxy';
      let primaryError = null;
      let fallbackError = null;

      for (const endpoint of uniqueWispCandidates) {
        window.__ghostActiveWisp = endpoint;

        try {
          await setTransportByName(preferredTransport, endpoint);
          setWispStatus(true);
          return;
        } catch (error) {
          primaryError = error;
        }

        console.warn(
          `[proxy] ${preferredTransport} transport failed for ${endpoint}; trying ${fallbackTransport}.`,
          primaryError,
        );

        try {
          await setTransportByName(fallbackTransport, endpoint);
          setWispStatus(true);
          return;
        } catch (error) {
          fallbackError = error;
          console.warn(`[proxy] transport fallback failed for ${endpoint}.`, fallbackError);
        }
      }

      window.__ghostActiveTransport = null;
      window.__ghostActiveWisp = null;
      window.__ghostActiveRemoteProxy = remoteProxyUrl;
      setWispStatus(false);
      console.error('[proxy] Failed to initialize transport.', {
        primaryError,
        fallbackError,
        wispUrl,
        remoteProxyUrl,
      });
    };

    init();
  }, [options.wServer, options.transport, options.proxyRouting, options.remoteProxyServer, options.remoteProxyType]);
}
