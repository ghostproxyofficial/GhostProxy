import { useRef, useState, useCallback, useEffect } from 'react';
import {
  Maximize2,
  SquareArrowOutUpRight,
  ZoomIn,
  ZoomOut,
  Cloud,
  HardDrive,
  Bug,
} from 'lucide-react';
import { useLocalGmLoader } from '/src/utils/hooks/player/useLocalGmLoader';
import { useNavigate } from 'react-router-dom';
import { process } from '/src/utils/hooks/loader/utils';
import { useOptions } from '/src/utils/optionsContext';
import Control from './Controls';
import InfoCard from './InfoCard';
import theming from '/src/styles/theming.module.css';
import clsx from 'clsx';
import Tooltip from '@mui/material/Tooltip';

const BUG_REPORT_FORM_URL = 'https://forms.gle/94VwArsXReWqyWWr9';

const Loader = ({ theme, app }) => {
  const nav = useNavigate();
  const gmRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [runtimeHtmlUrl, setRuntimeHtmlUrl] = useState('');
  const [runtimeLoading, setRuntimeLoading] = useState(false);
  const { options } = useOptions();
  const { gmUrl, loading, downloading } = useLocalGmLoader(app);
  const isLocal = app?.local;
  const effectivePrType = app?.prType || options.prType || 'auto';
  const proxiedUrl = app?.url
    ? process(app.url, false, effectivePrType, options.engine || null)
    : '';

  useEffect(() => {
    if (isLocal || !app?.renderAsHtml || !app?.url) {
      setRuntimeHtmlUrl('');
      setRuntimeLoading(false);
      return;
    }

    let cancelled = false;
    let createdUrl = '';

    const resolveHtmlRuntime = async () => {
      setRuntimeLoading(true);
      const candidates = [app.url, proxiedUrl].filter(Boolean);

      for (const candidate of candidates) {
        try {
          const response = await fetch(candidate);
          if (!response.ok) continue;
          const text = await response.text();
          if (!String(text || '').trim()) continue;

          createdUrl = URL.createObjectURL(new Blob([text], { type: 'text/html' }));
          if (!cancelled) {
            setRuntimeHtmlUrl(createdUrl);
            setRuntimeLoading(false);
          }
          return;
        } catch { }
      }

      if (!cancelled) {
        setRuntimeHtmlUrl('');
        setRuntimeLoading(false);
      }
    };

    resolveHtmlRuntime();

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [isLocal, app?.renderAsHtml, app?.url, proxiedUrl]);

  const remoteFrameUrl = runtimeHtmlUrl || proxiedUrl || app?.url;
  const showRemoteLoader = !isLocal && !!app?.renderAsHtml && runtimeLoading && !runtimeHtmlUrl;

  const fs = useCallback(() => {
    if (gmRef.current) {
      gmRef.current?.requestFullscreen?.();
    }
  }, []);

  const external = useCallback(() => {
    const topWin = (() => {
      try {
        return window.top && window.top !== window ? window.top : window;
      } catch {
        return window;
      }
    })();

    const opener = topWin.__ghostOpenBrowserTab;
    const externalUrl = proxiedUrl || app?.url;
    if (typeof opener === 'function' && externalUrl) {
      const opened = opener(externalUrl, { title: app?.appName || 'New Tab', skipProxy: false });
      if (opened) return;
    }

    nav('/search', {
      state: {
        url: externalUrl,
        openInGhostNewTab: true,
      },
    });
  }, [app?.url, app?.appName, nav, proxiedUrl]);

  const handleZoom = useCallback((direction) => {
    setZoom((prev) => {
      const newZoom = direction === 'in' ? Math.min(prev + 0.1, 2) : Math.max(prev - 0.1, 0.5);
      if (gmRef.current) gmRef.current.style.zoom = newZoom;
      return newZoom;
    });
  }, []);

  return (
    <div
      className={clsx(
        'flex flex-col h-full w-full rounded-xl',
        theming.appItemColor,
        theming[`theme-${theme || 'default'}`],
      )}
    >
      <div className="p-2 pl-1 border-b flex gap-2 items-center">
        <InfoCard app={app} theme={theme} />
        <Tooltip
          title={isLocal ? 'Downloaded to device (local)' : 'Fetched from web'}
          arrow
          placement="top"
        >
          <div className="flex items-center ml-auto mr-5">
            {isLocal ? (
              <HardDrive size={18} className="opacity-80" />
            ) : (
              <Cloud size={18} className="opacity-80" />
            )}
          </div>
        </Tooltip>
      </div>

      {loading || showRemoteLoader ? (
        <div className="w-full flex-grow flex items-center justify-center">
          {downloading ? 'Downloading...' : 'Loading...'}
        </div>
      ) : isLocal ? (
        <iframe
          key={gmUrl}
          src={gmUrl}
          ref={gmRef}
          onContextMenu={(e) => e.preventDefault()}
          className="w-full flex-grow"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-pointer-lock"
        />
      ) : (
        <iframe
          key={remoteFrameUrl}
          src={remoteFrameUrl}
          ref={gmRef}
          onContextMenu={(e) => e.preventDefault()}
          className="w-full flex-grow"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-pointer-lock allow-top-navigation-by-user-activation"
        />
      )}

      <div className="p-2.5 flex gap-2 border-t">
        {isLocal ? (
          <Tooltip title="Local games can't open in browser" arrow placement="top">
            <div className="cursor-not-allowed">
              <Control
                icon={SquareArrowOutUpRight}
                fn={null}
                className="cursor-not-allowed opacity-50 pointer-events-none"
              />
            </div>
          </Tooltip>
        ) : (
          <Control icon={SquareArrowOutUpRight} fn={external} />
        )}

        <Control
          icon={Bug}
          fn={() =>
            window.open(BUG_REPORT_FORM_URL, '_blank', 'noopener noreferrer')
          }
          className="ml-auto"
        >
          Report Issue
        </Control>
        <Control icon={ZoomIn} fn={() => handleZoom('in')} />
        <Control icon={ZoomOut} fn={() => handleZoom('out')} />
        <Control icon={Maximize2} fn={fs} />
      </div>
    </div>
  );
};

export default Loader;
