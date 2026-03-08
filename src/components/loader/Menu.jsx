import clsx from 'clsx';
import { useCallback, useEffect, useState } from 'react';
import { useOptions } from '/src/utils/optionsContext';
import loaderStore from '/src/utils/hooks/loader/useLoaderStore';
import Zoom from './menu/Zoom';
import Bookmarks from '../Bookmarks';
import { createId } from '/src/utils/id';
import { process } from '/src/utils/hooks/loader/utils';

const INTERNAL_GHOST_PATHS = ['/apps', '/settings', '/discover', '/docs', '/search', '/code', '/ai', '/remote', '/new'];

const isInternalGhostTabUrl = (urlValue) => {
  const raw = String(urlValue || '').trim();
  if (!raw || raw === 'tabs://new') return true;
  if (raw.startsWith('ghost://') || raw.startsWith('tabs://')) return true;
  if (raw.includes('ghost=1')) return true;

  try {
    const parsed = new URL(raw, location.origin);
    if (parsed.searchParams.get('ghost') === '1') return true;

    // Check pathname-based routes (BrowserRouter / localhost)
    const path = parsed.pathname.replace(/\/$/, '') || '/';
    if (INTERNAL_GHOST_PATHS.some((base) => path === base || path.startsWith(`${base}/`))) return true;

    // Check hash-based routes (HashRouter / static/Cloudflare builds)
    let hashStr = parsed.hash || '';
    if (hashStr) {
      if (hashStr.includes('ghost=1')) return true;
      if (hashStr.startsWith('#')) hashStr = hashStr.slice(1);
      if (!hashStr.startsWith('/')) hashStr = '/' + hashStr;

      const hashPath = hashStr.split('?')[0].replace(/\/$/, '');
      if (INTERNAL_GHOST_PATHS.some((base) => hashPath === base || hashPath.startsWith(`${base}/`))) return true;
    }

    return false;
  } catch {
    return false;
  }
};

const devTools = (fr) => {
  if (!fr?.contentWindow || !fr?.contentDocument) return;

  try {
    const doc = fr.contentDocument;
    const win = fr.contentWindow;
    const erudaEl = doc.getElementById('eruda');

    if (erudaEl?.shadowRoot) {
      win.eruda?.destroy();
      return;
    }

    const s = doc.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/eruda';
    s.onload = () => {
      win.eruda?.init();
      win.eruda?.show();
      win.eruda?.show('elements');
      setTimeout(() => {
        const root = doc.getElementById('eruda')?.shadowRoot;
        root?.querySelector('div.eruda-entry-btn')?.remove();
      }, 100);
    };
    doc.body.appendChild(s);
  } catch (e) {
    console.error(e);
  }
};

export default function Menu() {
  const {
    showMenu,
    toggleMenu,
    tabs,
    addTab,
    setActive,
    removeTab,
    updateUrl,
    showTabs,
    activeFrameRef,
  } = loaderStore();
  const { options } = useOptions();
  const [showBookmarks, setShowBm] = useState(false);
  const activeTab = tabs.find((tab) => tab.active) || tabs[0] || null;
  const devToolsBlockedForInternalPage = isInternalGhostTabUrl(activeTab?.url);

  const newTab = useCallback(() => {
    if (tabs.length < 20) {
      let uuid = createId();
      addTab({
        title: 'New Tab',
        id: uuid,
        url: 'tabs://new',
      });
      setActive(uuid);
    }
  }, [tabs.length]);

  const fs = useCallback(() => {
    activeFrameRef?.current && activeFrameRef.current?.requestFullscreen?.();
  }, [activeFrameRef]);

  const clearTabs = useCallback(() => {
    tabs.forEach((tab) => removeTab(tab.id));
    newTab();
  }, [tabs, removeTab, newTab]);

  const togEruda = useCallback(() => {
    if (devToolsBlockedForInternalPage) return;
    activeFrameRef?.current && devTools(activeFrameRef.current);
  }, [activeFrameRef, devToolsBlockedForInternalPage]);

  const items = [
    {
      name: 'New Tab',
      shortcut: 'alt + t',
      fn: newTab,
    },
    {
      name: 'Clear Tabs',
      shortcut: 'alt + shift + u',
      fn: clearTabs,
    },
    { name: 'Bookmarks', shortcut: 'alt + shift + b', fn: () => setShowBm(true) },
    {
      name: 'Fullscreen',
      shortcut: 'shift + f',
      fn: fs,
      disabled: !activeFrameRef?.current,
    },
    { name: 'zoom-cmpn', isComponent: true, divider: true },
    {
      name: 'Settings',
      fn: () => {
        const activeTab = tabs.find((tab) => tab.active) || tabs[0];
        if (!activeTab) return;
        updateUrl(activeTab.id, process('ghost://settings', false, options.prType || 'auto', options.engine || null));
      },
    },
    {
      name: 'DevTools',
      shortcut: 'alt + shift + i',
      fn: togEruda,
      disabled: !activeFrameRef?.current || devToolsBlockedForInternalPage,
      divider: true,
    },
    {
      name: 'Return Home',
      divider: true,
      fn: () => {
        const activeTab = tabs.find((tab) => tab.active) || tabs[0];
        if (!activeTab) return;
        updateUrl(activeTab.id, process('ghost://home', false, options.prType || 'auto', options.engine || null));
      },
    },
    {
      name: 'Report Bug',
      fn: () => { },
    },
  ];

  useEffect(() => {
    const open = () => setShowBm(true);
    window.addEventListener('ghost-open-bookmarks', open);
    return () => window.removeEventListener('ghost-open-bookmarks', open);
  }, []);

  const cnt = clsx(
    'absolute right-2 w-56 rounded-lg shadow-lg overflow-hidden text-sm z-50',
    'border transition-all duration-200 origin-top-right',
    showTabs ? 'mt-21' : 'mt-11',
    showMenu
      ? 'scale-100 opacity-100 pointer-events-auto'
      : 'scale-95 opacity-0 pointer-events-none',
  );

  const item = clsx(
    'w-full flex justify-between items-center text-left text-[0.8rem] px-3 py-2 focus:outline-none',
    options.type === 'light' ? 'hover:bg-gray-100' : 'hover:bg-[#ffffff0c]',
  );

  return (
    <>
      <Bookmarks isOpen={showBookmarks} onClose={() => setShowBm(false)} inLoader={true} />

      <div className={cnt} style={{ backgroundColor: options.menuColor || '#1a252f' }}>
        {items.map(
          (
            {
              name,
              shortcut = null,
              divider = null,
              fn = null,
              disabled = false,
              isComponent = false,
            },
            id,
          ) => (
            <div
              key={id}
              disabled={disabled}
              className={clsx(disabled ? 'opacity-50 pointer-events-none' : '')}
            >
              {isComponent ? (
                <Zoom />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    !disabled && fn();
                    showMenu && toggleMenu();
                  }}
                  className={item}
                >
                  <span>{name}</span>
                  {shortcut && (
                    <span className="text-[0.7rem] text-gray-500 dark:text-gray-400">
                      {shortcut}
                    </span>
                  )}
                </button>
              )}
              {divider && (
                <hr
                  className={clsx(
                    'border-t',
                    options.type === 'light' ? 'border-gray-300' : 'border-gray-700',
                  )}
                />
              )}
            </div>
          ),
        )}
      </div>
    </>
  );
}
