import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useOptions } from '../utils/optionsContext';

const calc = (hex, alpha = 0.5) => {
  const [r, g, b] = hex.match(/\w\w/g).map((x) => parseInt(x, 16));
  return `rgba(${r},${g},${b},${alpha})`;
};

const NotFound = () => {
  const loc = useLocation();
  const nav = useNavigate();
  const { options } = useOptions();
  const mainText = options.siteTextColor ?? '#a0b0c8';
  const isProxyPath = loc.pathname.includes('/scramjet/') || loc.pathname.includes('/uv/service/');

  const recoverBrowserMode = () => {
    const target = 'ghost://search';
    try {
      const topWindow = window.top && window.top !== window ? window.top : window;
      const getActiveTabId = topWindow.__ghostGetActiveTabId;
      const updateTabUrl = topWindow.__ghostUpdateBrowserTabUrl;
      if (typeof getActiveTabId === 'function' && typeof updateTabUrl === 'function') {
        const activeTabId = getActiveTabId();
        if (activeTabId) {
          updateTabUrl(activeTabId, target);
          return;
        }
      }
      const openBrowserTab = topWindow.__ghostOpenBrowserTab;
      if (typeof openBrowserTab === 'function') {
        openBrowserTab(target, { title: 'Ghost' });
        return;
      }
    } catch { }
    nav('/', { replace: true });
  };

  const colorConfig = {
    text: mainText,
    textMuted: calc(mainText, 0.5),
  };

  useEffect(() => {
    if (!isProxyPath) {
      recoverBrowserMode();
      return;
    }

    const timer = window.setTimeout(() => {
      recoverBrowserMode();
    }, 900);

    return () => window.clearTimeout(timer);
  }, [isProxyPath]);

  if (!isProxyPath) return null;

  return (
    <div
      className="min-h-full flex flex-col items-center justify-center p-6"
      style={{ fontFamily: 'SFProText, system-ui, sans-serif' }}
    >
      <h1 className="text-2xl font-medium mb-2" style={{ color: colorConfig.text }}>
        Whoops, something broke!
      </h1>
      <p
        onClick={recoverBrowserMode}
        className="cursor-pointer underline"
        style={{ color: colorConfig.textMuted }}
      >
        Returning to browser mode...
      </p>
    </div>
  );
};

export default NotFound;
