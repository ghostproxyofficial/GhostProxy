import { Gamepad2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import theming from '/src/styles/theming.module.css';
import clsx from 'clsx';

const Breadcrumb = ({ theme, name }) => {
  const nav = useNavigate();
  const openGames = () => {
    const inGhostBrowserMode = new URLSearchParams(window.location.search).get('ghost') === '1';
    try {
      const topWin = window.top && window.top !== window ? window.top : window;
      const getTabId = topWin.__ghostGetActiveTabId;
      const updater = topWin.__ghostUpdateBrowserTabUrl;
      const tabId = typeof getTabId === 'function' ? getTabId() : null;
      if (tabId && typeof updater === 'function') {
        updater(tabId, 'ghost://games', { skipProxy: true });
        return;
      }
      const opener = topWin.__ghostOpenBrowserTab;
      if (typeof opener === 'function') {
        opener('ghost://games', { title: 'Ghost Entertainment', skipProxy: true });
        return;
      }
    } catch {
    }
    if (inGhostBrowserMode) {
      return;
    }
    nav('/discover?tab=games');
  };
  // assuming you're coming from the gms page
  return (
    <div
      className={clsx(
        'flex h-2 w-fit max-w-72 px-3 p-4 items-center rounded-xl',
        theming.appItemColor,
        theming[`theme-${theme || 'default'}`],
      )}
    >
      <Gamepad2 size="16" /> &nbsp;
      <span className="hover:underline cursor-pointer" onClick={openGames}>
        Entertainment
      </span>
      <span className="mx-1">&gt;</span>
      <span className="truncate">{name}</span>
    </div>
  );
};

export default Breadcrumb;
