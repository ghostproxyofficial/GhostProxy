import { useEffect } from 'react';
import { BareMuxConnection } from '@mercuryworkshop/bare-mux';
import { useOptions } from '/src/utils/optionsContext';
import { fetchW as returnWServer } from './findWisp';
import store from './useLoaderStore';

export default function useReg() {
  const { options } = useOptions();
  const ws = `${location.protocol == 'http:' ? 'ws:' : 'wss:'}//${location.host}/wisp/`;
  const sws = [{ path: '/uv/ghost-sw.js', scope: '/uv/' }, { path: '/s_sw.js', scope: '/scramjet/' }];
  const setWispStatus = store((s) => s.setWispStatus);

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
      let socket = null;
      try {
        socket = await returnWServer();
      } catch (e) {
        socket = null;
      }

      const buildRemoteWisp = () => {
        if ((options.proxyRouting || 'direct') !== 'remote') return null;
        const raw = String(options.remoteProxyServer || '').trim();
        if (!raw) return null;

        try {
          const normalized = raw.startsWith('http://') || raw.startsWith('https://')
            ? raw
            : `https://${raw}`;
          const remoteOrigin = new URL(normalized).origin;
          const remoteProtocol = remoteOrigin.startsWith('https://') ? 'wss://' : 'ws://';
          const remoteHost = remoteOrigin.replace(/^https?:\/\//, '');
          return `${remoteProtocol}${remoteHost}/wisp/`;
        } catch {
          return null;
        }
      };

      const remoteWisp = buildRemoteWisp();
      const wispUrl =
        options.wServer != null && options.wServer !== ''
          ? options.wServer
          : remoteWisp || socket || ws;

      const preferredTransport =
        String(options.transport || 'libcurl').toLowerCase() === 'epoxy'
          ? 'epoxy'
          : 'libcurl';

      const setTransportByName = async (name) => {
        const modulePath = name === 'epoxy' ? '/epoxy/index.mjs' : '/libcurl/index.mjs';
        await connection.setTransport(modulePath, [{ wisp: wispUrl }]);
        window.__ghostActiveTransport = name;
      };

      window.__ghostActiveWisp = wispUrl;

      try {
        await setTransportByName(preferredTransport);
        setWispStatus(true);
      } catch (primaryError) {
        const fallbackTransport = preferredTransport === 'epoxy' ? 'libcurl' : 'epoxy';
        console.warn(
          `[proxy] ${preferredTransport} transport failed; trying ${fallbackTransport}.`,
          primaryError,
        );
        try {
          await setTransportByName(fallbackTransport);
          setWispStatus(true);
        } catch (fallbackError) {
          window.__ghostActiveTransport = null;
          setWispStatus(false);
          console.error('[proxy] Failed to initialize transport.', {
            primaryError,
            fallbackError,
            wispUrl,
          });
        }
      }
    };

    init();
  }, [options.wServer, options.proxyRouting, options.remoteProxyServer, options.transport]);
}
