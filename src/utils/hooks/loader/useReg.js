import { useEffect } from 'react';
import { BareMuxConnection, BareClient } from 'bare-mux-fork';
import { useOptions } from '/src/utils/optionsContext';
import { fetchW } from './findWisp';
import store from './useLoaderStore';
import { getEffectiveUserAgent, getEffectiveIdentity, YOUTUBE_TV_UA, USER_AGENT_IDENTITY } from '/src/data/userAgents';

export default function useReg() {
  const { options } = useOptions();
  const defaultWispEndpoint = 'wss://service.khanacademyy.org/socket/';
  const sws = [{ path: '/uv/ghost-sw.js', scope: '/uv/' }, { path: '/s_sw.js', scope: '/scramjet/' }];
  const setWispStatus = store((s) => s.setWispStatus);

// ua changes only need the proxy workers updated. recreating scramjet here
// remounts active frames and the settings tab visibly reloads
  useEffect(() => {
    let disposed = false;
    const broadcast = async () => {
      try {
        const base = getEffectiveUserAgent(options, null);
        const identity = getEffectiveIdentity(options, null);
        const message = {
          type: 'ghost-ua-config',
          base: base || null,
          youtube: YOUTUBE_TV_UA,
          identity: identity ? {
            brands: identity.brands || null,
            mobile: !!identity.mobile,
            uadPlatform: identity.uadPlatform || null,
          } : null,
        };
        navigator.serviceWorker.controller?.postMessage(message);
        const registrations = await navigator.serviceWorker.getRegistrations();
        if (disposed) return;
        registrations.forEach((registration) => {
          const worker = registration.active || registration.waiting || registration.installing;
          worker?.postMessage(message);
        });
      } catch { }
    };
    broadcast();
    return () => { disposed = true; };
  }, [options.userAgentPreset, options.customUserAgent, options.browserIdentity]);

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
      // keep the path as given, dont force a /wisp/ suffix on it
      const pathname = parsed.pathname || '/';
      const trailingSlashPath = pathname.endsWith('/') ? pathname : `${pathname}/`;

      return `${protocol}//${parsed.host}${trailingSlashPath}`;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    let disposed = false;
    let connectionRef = null;
    let remoteProxyRef = null;

    const init = async () => {
      if (disposed) return;
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

      // resolve identity before the scramjetcontroller init
      let effectiveUA = null;
      let effectivePlatform = null;
      let effectiveIdentity = null;
      try {
        effectiveUA = getEffectiveUserAgent(options, null);
        effectiveIdentity = getEffectiveIdentity(options, null);
        const { getSyntheticIdentity } = await import('/src/utils/identity.js');
        const syn = getSyntheticIdentity(options);
        if (syn?.platform) effectivePlatform = syn.platform;
        if (effectiveIdentity && effectivePlatform && !effectiveIdentity.platform) {
          effectiveIdentity = { ...effectiveIdentity, platform: effectivePlatform };
        }
        if (!effectivePlatform && effectiveIdentity?.platform) effectivePlatform = effectiveIdentity.platform;
      } catch {}

      window.scr = new ScramjetController({
        files: {
          wasm: '/scram/scramjet.wasm.wasm',
          all: '/scram/scramjet.all.js',
          sync: '/scram/scramjet.sync.js',
        },
        flags: {
          rewriterLogs: !!options.experimentalScramjetLogs,
          scramitize: !!options.experimentalScramjetScramitize,
          cleanErrors: true,
          sourcemaps: options.experimentalScramjetSourcemaps !== false,
        },
        inject: [
          // UA / identity spoof, must run before any page JS
          ...(effectiveIdentity ? [{
            host: /.*/,
            injectTo: "head",
            html: `<script>(function(){try{var I=${JSON.stringify({ ua: effectiveIdentity.ua, platform: effectiveIdentity.platform, vendor: effectiveIdentity.vendor, mobile: !!effectiveIdentity.mobile, uadPlatform: effectiveIdentity.uadPlatform || null, brands: effectiveIdentity.brands || null })};Object.defineProperty(navigator,'userAgent',{get:function(){return I.ua},configurable:true});if(I.platform){try{Object.defineProperty(navigator,'platform',{get:function(){return I.platform},configurable:true});}catch{}}if(typeof I.vendor==='string'){try{Object.defineProperty(navigator,'vendor',{get:function(){return I.vendor},configurable:true});}catch{}}try{if(I.brands){var uad={brands:I.brands,mobile:!!I.mobile,platform:I.uadPlatform||'',getHighEntropyValues:function(){return Promise.resolve({platform:I.uadPlatform||'',mobile:!!I.mobile,model:'',architecture:'',bitness:'',formFactor:I.mobile?'Mobile':'Desktop',fullVersionList:I.brands.map(function(b){return{brand:b.brand,version:b.version+'.0.0.0'}}),wow64:false})}};Object.defineProperty(navigator,'userAgentData',{get:function(){return uad},configurable:true});}else{Object.defineProperty(navigator,'userAgentData',{get:function(){return undefined},configurable:true});}}catch{}}catch{}})();</script>`
          }] : []),
          // youtube always gets the tv ua, listed last so it wins over the generic one
          {
            host: /(^|\.)(youtube\.com|youtu\.be|m\.youtube\.com)$/,
            injectTo: "head",
            html: `<script>(function(){try{var I=${JSON.stringify({ ua: YOUTUBE_TV_UA, ...(USER_AGENT_IDENTITY['tv'] || {}) })};Object.defineProperty(navigator,'userAgent',{get:function(){return I.ua},configurable:true});if(I.platform){try{Object.defineProperty(navigator,'platform',{get:function(){return I.platform},configurable:true});}catch{}}try{var uad={brands:I.brands,mobile:false,platform:I.uadPlatform||'',getHighEntropyValues:function(){return Promise.resolve({platform:I.uadPlatform||'',mobile:false,model:'',architecture:'',bitness:'',formFactor:'Desktop',fullVersionList:(I.brands||[]).map(function(b){return{brand:b.brand,version:b.version+'.0.0.0'}}),wow64:false})}};Object.defineProperty(navigator,'userAgentData',{get:function(){return uad},configurable:true});}catch{}}catch{}})();</script>`
          },
          {
            host: /.*/,
            injectTo: "head",
            html: `
            <script>
                (function() {
                    let shortcuts = ["Alt+T", "Alt+W", "Alt+Shift+T", "Alt+D", "Alt+R", "F5", "F12", "F11", "Alt+L"];
                    window.addEventListener('message', (e) => {
                        if (e.data && e.data.type === 'ghost-update-shortcuts') shortcuts = e.data.shortcuts;
                    });
                    try { window.top.postMessage({ type: 'ghost-request-shortcuts' }, '*'); } catch {}
                    const stealShortcut = (e) => {
                        let key = e.key;
                        if (!key) return;
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
                          e.stopImmediatePropagation?.();
                          try {
                            window.top.postMessage({
                                type: 'ghost-shortcut',
                                key: e.key,
                                altKey: e.altKey,
                                ctrlKey: e.ctrlKey,
                                shiftKey: e.shiftKey,
                                metaKey: e.metaKey
                            }, '*');
                          } catch {}
                        }
                      };
                      window.addEventListener('keydown', stealShortcut, { capture: true });
                      document.addEventListener('keydown', stealShortcut, { capture: true });
                })();
            </script>
            `
          }
        ]
      });

      window.scr.init();

      // the sw sets these as real request headers, see public/s_sw.js
      const sendUaConfig = (worker) => {
        try {
          worker?.postMessage({
            type: 'ghost-ua-config',
            base: effectiveUA || null,
            youtube: YOUTUBE_TV_UA,
            identity: effectiveIdentity ? {
              brands: effectiveIdentity.brands || null,
              mobile: !!effectiveIdentity.mobile,
              uadPlatform: effectiveIdentity.uadPlatform || null,
            } : null,
          });
        } catch { }
      };

      for (const sw of sws) {
        try {
          const registration = await navigator.serviceWorker.register(
            sw.path,
            sw.scope ? { scope: sw.scope } : undefined,
          );
          // only an active worker takes postMessage
          sendUaConfig(registration.active || registration.waiting || registration.installing);
        } catch (err) {
          console.warn(`SW reg err (${sw.path}):`, err);
        }
      }

      const broadcastUaConfig = async () => {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          registrations.forEach((registration) => {
            if (registration.active) sendUaConfig(registration.active);
          });
        } catch { }
      };

      try {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          sendUaConfig(navigator.serviceWorker.controller);
        });
      } catch { }

      // the sw scopes are too narrow for ready to ever resolve, broadcast to all of them
      broadcastUaConfig();
      setTimeout(broadcastUaConfig, 1500);

      globalThis.__ghostScramjetReady = true;

// baremux runs in a SharedWorker that survives reloads so once its stuck it
// stays stuck. keep the path around so we can swap in a fresh one on timeout
      let baremuxPath = '/baremux/worker.js';
      let connection = new BareMuxConnection(baremuxPath);
      connectionRef = connection;

      const recreateConnection = (reason) => {
        const bust = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        baremuxPath = `/baremux/worker.js?ghost=${bust}`;
        connection = new BareMuxConnection(baremuxPath);
        connectionRef = connection;
        console.warn('[proxy] recreated baremux connection with fresh worker', { reason, baremuxPath });
      };

      setWispStatus('init');
      const manualWisp = normalizeWispEndpoint(options.wServer);
      const defaultWisp = normalizeWispEndpoint(defaultWispEndpoint);
      const isInvalidWisp = (value) => /\/\/(undefined|null)(?::|\/|$)/i.test(String(value || ''));
      const isLocalHost = (() => {
        try {
          const host = String(window.location.hostname || '').toLowerCase();
          return host === 'localhost' || host === '127.0.0.1' || host === '::1';
        } catch {
          return false;
        }
      })();

      const localOriginWisp = isLocalHost
        ? normalizeWispEndpoint(`${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/wisp/`)
        : null;

      let discoveredWisp = null;
      if (!manualWisp) {
        try {
          discoveredWisp = normalizeWispEndpoint(await fetchW());
        } catch (error) {
          console.error(error);
          throw error;
        }
      }

      const uniqueWispCandidates = [
        manualWisp,
        discoveredWisp,
        localOriginWisp,
        defaultWisp,
      ].filter((candidate, index, arr) => candidate && !isInvalidWisp(candidate) && arr.indexOf(candidate) === index);

      const wispUrl = uniqueWispCandidates[0] || null;

      const preferredTransport =
        String(options.transport || 'epoxy').toLowerCase() === 'libcurl'
          ? 'libcurl'
          : 'epoxy';

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
      remoteProxyRef = remoteProxyUrl;

// setTransport can hang forever on a stale worker, so every step is timed out
      const withTimeout = (promise, ms, label) => Promise.race([
        promise,
        new Promise((_, reject) => {
          window.setTimeout(() => reject(new Error(`[proxy] ${label} timed out after ${ms}ms`)), ms);
        }),
      ]);

      const setTransportByName = async (name, endpoint) => {
        const modulePath = name === 'epoxy' ? '/epoxy/index.mjs' : '/libcurl/index.mjs';
        const transportConfig = { wisp: endpoint };
        if (remoteProxyUrl) {
          transportConfig.proxy = remoteProxyUrl;
        }
        await withTimeout(
          connection.setTransport(modulePath, [transportConfig]),
          8000,
          `setTransport(${name})`,
        );
        window.__ghostActiveTransport = name;
        window.__ghostActiveRemoteProxy = remoteProxyUrl;
      };

      const probeTransport = async () => {
        const client = new BareClient(baremuxPath);
        const probeTargets = ['https://example.com/', 'https://duckduckgo.com/'];
        let lastError = null;

        for (const target of probeTargets) {
          try {
            const response = await Promise.race([
              client.fetch(target, {
                method: 'GET',
                redirect: 'manual',
                cache: 'no-store',
              }),
              new Promise((_, reject) => {
                setTimeout(() => reject(new Error(`[proxy] probe timeout for ${target}`)), 8000);
              }),
            ]);

            // any http status at all means the transport is reaching upstream
            if (response && Number.isFinite(response.status)) {
              return;
            }
          } catch (error) {
            lastError = error;
          }
        }

        throw lastError || new Error('[proxy] probe request failed for all targets.');
      };

      let primaryError = null;

      const tryTransport = async (transportName, endpoint) => {
        window.__ghostActiveWisp = endpoint;

        try {
          await setTransportByName(transportName, endpoint);
        } catch (error) {
          primaryError = error;
// setTransport itself failed. this is the call that hangs on a stuck worker
// so put a fresh one in before retrying
          recreateConnection(`setTransport(${transportName}) failed: ${error?.message || error}`);
          return false;
        }

        try {
          await probeTransport();
          return true;
        } catch (error) {
          primaryError = error;
          return false;
        }
      };

// retry the same transport first, libcurl wasm can still be loading on call
// one. after that try the other transport, then the next endpoint
      const transportsToTry = [
        preferredTransport,
        preferredTransport === 'epoxy' ? 'libcurl' : 'epoxy',
      ];

      const attemptAllTransports = async () => {
        for (const endpoint of uniqueWispCandidates) {
          for (const transportName of transportsToTry) {
            if (await tryTransport(transportName, endpoint)) {
              setWispStatus(true);
              return true;
            }

            console.warn(
              `[proxy] ${transportName} transport failed for ${endpoint}; retrying once.`,
              primaryError,
            );

            if (await tryTransport(transportName, endpoint)) {
              setWispStatus(true);
              return true;
            }
          }
        }

        return false;
      };

      const ok = await attemptAllTransports();
      if (!ok) {
        setWispStatus(false);
        const endpointPreview = wispUrl || '(none)';
        console.warn(
          `[proxy] unable to initialize transport for ${endpointPreview}; transport=${preferredTransport}.`,
          primaryError,
        );

        window.__ghostActiveTransport = null;
        window.__ghostActiveWisp = null;
        window.__ghostActiveRemoteProxy = remoteProxyUrl;
      }

// viewer calls this when a frame keeps failing on transport errors
      let reinitInFlight = null;
      window.__ghostReinitTransport = async () => {
        if (reinitInFlight) return reinitInFlight;
        reinitInFlight = (async () => {
          setWispStatus('init');
          const recovered = await attemptAllTransports();
          setWispStatus(recovered);
          return recovered;
        })();
        try {
          return await reinitInFlight;
        } finally {
          reinitInFlight = null;
        }
      };
    };

// debounce it so fast ua toggles dont spin up a controller per change
    const initTimer = setTimeout(init, 250);

    return () => {
      disposed = true;
      clearTimeout(initTimer);
      connectionRef = null;
    };
  }, [options.wServer, options.transport, options.proxyRouting, options.remoteProxyServer, options.remoteProxyType, options.experimentalScramjetLogs, options.experimentalScramjetSourcemaps, options.experimentalScramjetScramitize, options.userAgentPreset, options.customUserAgent, options.browserIdentity]);
}
