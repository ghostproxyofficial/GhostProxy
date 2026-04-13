import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { RotateCw } from 'lucide-react';
import { useOptions } from '/src/utils/optionsContext';
import changelogEntries from '/src/data/changelog.json';

const Footer = memo(() => {
  const defaultWispEndpoint = 'wss://doge.studyeurope.edu.eu.org/wisp/';
  const { options } = useOptions();
  const navigate = useNavigate();
  const location = useLocation();
  const inGhostBrowserMode = new URLSearchParams(location.search).get('ghost') === '1';
  const [latency, setLatency] = useState(0);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [samples, setSamples] = useState([]);
  const [probeStats, setProbeStats] = useState({ attempts: 0, fails: 0, slow: 0 });

  const latestVersionLabel = useMemo(() => {
    const latestEntry = [...(Array.isArray(changelogEntries) ? changelogEntries : [])]
      .sort((a, b) => Number(String(b?.version || '0')) - Number(String(a?.version || '0')))[0];
    const version = String(latestEntry?.version || '').trim();
    return version ? `v${version}` : 'v1';
  }, []);

  const resolveWispEndpoint = useCallback(() => {
    const normalizeWisp = (value) => {
      if (!value) return '';
      const raw = String(value).trim();
      if (!raw) return '';
      if (raw === 'undefined' || raw === 'null') return '';

      try {
        const normalized = raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('ws://') || raw.startsWith('wss://')
          ? raw
          : `${location.protocol === 'https:' ? 'https://' : 'http://'}${raw.replace(/^\/+/, '')}`;
        const parsed = new URL(normalized);
        const host = String(parsed.hostname || '').trim().toLowerCase();
        if (!host || host === 'undefined' || host === 'null') return '';
        const protocol = parsed.protocol === 'https:' || parsed.protocol === 'wss:' ? 'wss:' : 'ws:';
        const pathname = parsed.pathname && parsed.pathname !== '/' ? parsed.pathname : '/wisp/';
        const trailingSlashPath = pathname.endsWith('/') ? pathname : `${pathname}/`;
        return `${protocol}//${parsed.host}${trailingSlashPath}`;
      } catch {
        return '';
      }
    };

    if (typeof window !== 'undefined' && typeof window.__ghostActiveWisp === 'string' && window.__ghostActiveWisp && window.__ghostActiveWisp !== 'undefined') {
      return normalizeWisp(window.__ghostActiveWisp);
    }

    if (options.wServer) {
      return normalizeWisp(options.wServer);
    }

    return normalizeWisp(defaultWispEndpoint);
  }, [defaultWispEndpoint, options.wServer]);

  const pollLatency = useCallback(async () => {
    const endpoint = resolveWispEndpoint();
    if (!endpoint) return;
    if (/\/\/(undefined|null)(?::|\/|$)/i.test(endpoint)) {
      if (typeof window !== 'undefined') {
        window.__ghostActiveWisp = null;
      }
      return;
    }
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
    const interval = setInterval(pollLatency, 10000);
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

  const openInGhostTab = useCallback((url, config = {}) => {
    const topWindow = (() => {
      try {
        return window.top && window.top !== window ? window.top : window;
      } catch {
        return window;
      }
    })();
    const openBrowserTab = topWindow.__ghostOpenBrowserTab;
    if (typeof openBrowserTab === 'function') {
      openBrowserTab(url, config);
      return true;
    }
    return false;
  }, []);

  const openExternalLink = useCallback((url) => {
    if (inGhostBrowserMode && openInGhostTab(url, { title: 'New Tab' })) {
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [inGhostBrowserMode, openInGhostTab]);

  const openInfo = useCallback(() => {
    try {
      const topWindow = window.top && window.top !== window ? window.top : window;
      topWindow.__ghostNextSettingsSection = 'Info';
      const getActiveTabId = topWindow.__ghostGetActiveTabId;
      const updateBrowserTab = topWindow.__ghostUpdateBrowserTabUrl;
      const activeTabId = typeof getActiveTabId === 'function' ? getActiveTabId() : null;
      if (activeTabId && typeof updateBrowserTab === 'function') {
        updateBrowserTab(activeTabId, 'ghost://settings', { skipProxy: true });
        return;
      }
      const openBrowserTab = topWindow.__ghostOpenBrowserTab;
      if (typeof openBrowserTab === 'function') {
        openBrowserTab('ghost://settings', {
          title: 'Ghost Settings',
          skipProxy: true,
        });
      }
    } catch {
    }
  }, []);

  const openChangelog = useCallback(() => {
    if (inGhostBrowserMode) {
      try {
        const topWindow = window.top && window.top !== window ? window.top : window;
        topWindow.dispatchEvent(new Event('ghost-open-changelog'));
        return;
      } catch {
      }
      if (openInGhostTab('ghost://search', { title: 'Ghost' })) {
        return;
      }
      return;
    }
    navigate('/search?changelog=1');
  }, [inGhostBrowserMode, navigate, openInGhostTab]);

  const latencyColorClass = latency > 250
    ? 'text-[#ef4444]'
    : latency > 100
      ? 'text-[#facc15]'
      : 'text-[#22c55e]';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[120] flex items-end justify-between px-2 pb-2 pointer-events-none">
      <div className={clsx(
        'pointer-events-auto rounded-md border border-white/10 bg-[#0d1016]/92 px-3 py-2 text-sm flex items-center gap-3 ml-14',
        inGhostBrowserMode ? 'ml-14' : '',
      )}>
        <button className="hover:opacity-80 hover:underline underline-offset-4 transition-opacity" onClick={openChangelog}>{latestVersionLabel}</button>
        <span className="opacity-55">\</span>
        <button className="hover:opacity-80 hover:underline underline-offset-4 transition-opacity" type="button" onClick={() => openExternalLink('https://github.com/ghostproxyofficial/GhostProxy')}>GitHub</button>
        <span className="opacity-55">\</span>
        <button className="hover:opacity-80 hover:underline underline-offset-4 transition-opacity" type="button" onClick={() => openExternalLink('https://discord.gg/UZzYt4uE6D')}>Discord</button>
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
          <span className={clsx(latencyColorClass, 'font-medium ml-1')}>{latency}ms</span>
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
