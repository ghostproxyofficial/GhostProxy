import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { RotateCw } from 'lucide-react';
import { useOptions } from '/src/utils/optionsContext';

const Footer = memo(() => {
  const { options } = useOptions();
  const navigate = useNavigate();
  const location = useLocation();
  const inGhostBrowserMode = new URLSearchParams(location.search).get('ghost') === '1';
  const [latency, setLatency] = useState(0);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [samples, setSamples] = useState([]);
  const [probeStats, setProbeStats] = useState({ attempts: 0, fails: 0, slow: 0 });

  const resolveWispEndpoint = useCallback(() => {
    const normalizeWisp = (value) => {
      if (!value) return '';
      const raw = String(value).trim();
      if (!raw) return '';
      if (raw.startsWith('http://')) return `ws://${raw.replace(/^http:\/\//, '')}`;
      if (raw.startsWith('https://')) return `wss://${raw.replace(/^https:\/\//, '')}`;
      return raw;
    };

    if (typeof window !== 'undefined' && typeof window.__ghostActiveWisp === 'string' && window.__ghostActiveWisp && window.__ghostActiveWisp !== 'undefined') {
      return normalizeWisp(window.__ghostActiveWisp);
    }

    if (options.wServer) {
      return normalizeWisp(options.wServer);
    }

    if ((options.proxyRouting || 'direct') === 'remote' && options.remoteProxyServer) {
      try {
        const normalized = String(options.remoteProxyServer || '').trim();
        const base = normalized.startsWith('http://') || normalized.startsWith('https://')
          ? normalized
          : `https://${normalized}`;
        const remoteOrigin = new URL(base).origin;
        return `${remoteOrigin.startsWith('https://') ? 'wss://' : 'ws://'}${remoteOrigin.replace(/^https?:\/\//, '')}/wisp/`;
      } catch {
        return `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/wisp/`;
      }
    }

    return `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/wisp/`;
  }, [location.host, location.protocol, options.proxyRouting, options.remoteProxyServer, options.wServer]);

  const pollLatency = useCallback(async () => {
    const endpoint = resolveWispEndpoint();
    const started = performance.now();
    let ok = false;

    await new Promise((resolve) => {
      let finished = false;
      let ws;
      try {
        ws = new WebSocket(endpoint);
      } catch {
        resolve();
        return;
      }
      const done = (status) => {
        if (finished) return;
        finished = true;
        ok = status;
        try {
          ws.close();
        } catch { }
        resolve();
      };

      const timeoutId = setTimeout(() => done(false), 5000);

      ws.onopen = () => {
        clearTimeout(timeoutId);
        done(true);
      };
      ws.onerror = () => {
        clearTimeout(timeoutId);
        done(false);
      };
      ws.onclose = () => {
        clearTimeout(timeoutId);
        done(ok);
      };
    });

    const value = Math.max(1, Math.round(performance.now() - started));
    if (ok) {
      setLatency(value);
      setSamples((prev) => [...prev.slice(-19), value]);
    }

    setProbeStats((prev) => ({
      attempts: prev.attempts + 1,
      fails: prev.fails + (ok ? 0 : 1),
      slow: prev.slow + (ok && value > 1600 ? 1 : 0),
    }));
  }, [resolveWispEndpoint]);

  useEffect(() => {
    pollLatency();
    const interval = setInterval(pollLatency, 12000);
    return () => clearInterval(interval);
  }, [pollLatency]);

  const diagnostics = useMemo(() => {
    if (samples.length === 0) {
      return {
        jitter: 0,
        stutter: 0,
        packetLoss: 0,
      };
    }

    const mean = samples.reduce((acc, value) => acc + value, 0) / samples.length;
    const variance =
      samples.reduce((acc, value) => acc + (value - mean) ** 2, 0) / Math.max(1, samples.length);
    const jitter = Math.round(Math.sqrt(variance));
    const transitions = samples.slice(1).map((value, index) => Math.abs(value - samples[index]));
    const adaptiveSpikeThreshold = Math.max(8, Math.round(mean * 0.2));
    const stutterSpikes = transitions.filter((delta) => delta >= adaptiveSpikeThreshold).length;
    const stutter = transitions.length > 0
      ? Math.round((stutterSpikes / transitions.length) * 100)
      : 0;
    const packetLoss = probeStats.attempts > 0
      ? Math.round(((probeStats.fails + probeStats.slow) / probeStats.attempts) * 100)
      : 0;

    return { jitter, stutter, packetLoss };
  }, [samples, probeStats]);

  const openInfo = useCallback(() => {
    navigate('/search', {
      state: {
        url: '/settings?ghost=1&section=Info',
        openInGhostNewTab: true,
        skipProxy: true,
      },
    });
  }, [navigate]);

  const openChangelog = useCallback(() => {
    navigate('/search?ghost=1&changelog=1');
  }, [navigate]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[120] flex items-end justify-between px-2 pb-2 pointer-events-none">
      <div className={clsx(
        'pointer-events-auto rounded-md border border-white/10 bg-[#0d1016]/92 px-3 py-2 text-sm flex items-center gap-3 ml-14',
        inGhostBrowserMode ? 'ml-14' : '',
      )}>
        <button className="hover:opacity-80 hover:underline underline-offset-4 transition-opacity" onClick={openChangelog}>v1</button>
        <span className="opacity-55">\</span>
        <button className="hover:opacity-80 hover:underline underline-offset-4 transition-opacity" type="button" onClick={() => navigate('/search', { state: { url: 'https://github.com/ghostproxyofficial/GhostProxy', openInGhostNewTab: true } })}>GitHub</button>
        <span className="opacity-55">\</span>
        <button className="hover:opacity-80 hover:underline underline-offset-4 transition-opacity" type="button" onClick={() => navigate('/search', { state: { url: 'https://discord.gg/UZzYt4uE6D', openInGhostNewTab: true } })}>Discord</button>
        <span className="opacity-55">\</span>
        <button className="hover:opacity-80 hover:underline underline-offset-4 transition-opacity" onClick={openInfo}>Info</button>
      </div>

      <div
        className="pointer-events-auto relative"
        onMouseEnter={() => setDiagnosticsOpen(true)}
        onMouseLeave={() => setDiagnosticsOpen(false)}
      >
        <div
          className={clsx(
            'rounded-md border border-white/10 bg-[#0d1016]/92 px-3 py-2 text-sm flex items-center gap-2',
            'transition-all duration-150',
            diagnosticsOpen ? 'translate-y-[-1px]' : '',
          )}
        >
          <span className="opacity-70">Server Latency:</span>
          <span className="text-[#22c55e] font-medium ml-1">{latency}ms</span>
          <button
            className="opacity-70 hover:opacity-100 transition-opacity"
            onClick={pollLatency}
            title="Refresh stats"
          >
            <RotateCw size={13} />
          </button>
        </div>

        <div
          className={clsx(
            'absolute right-0 bottom-[calc(100%+8px)] w-56 rounded-md border border-white/10 bg-[#0b0e14]/96 p-2.5 text-xs shadow-2xl',
            'transition-all duration-150',
            diagnosticsOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-1 pointer-events-none',
          )}
        >
          <p className="text-[11px] uppercase tracking-wide opacity-60 mb-2">Server Diagnostics</p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between"><span className="opacity-75">Jitter</span><span>{diagnostics.jitter}ms</span></div>
            <div className="flex items-center justify-between"><span className="opacity-75">Samples</span><span>{probeStats.attempts}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
});

Footer.displayName = 'Footer';
export default Footer;
