import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOptions } from '/src/utils/optionsContext';
import { getEffectiveShortcuts, eventToShortcut } from '/src/utils/shortcuts';
import { process, isInternalGhostTabUrl } from '/src/utils/hooks/loader/utils';
import { createId } from '/src/utils/id';
import loaderStore from '/src/utils/hooks/loader/useLoaderStore';

// mounted at the root so it never unmounts. interception and execution both
// live here so shortcuts still work with focus inside a frame
const GlobalShortcuts = () => {
  const { options, updateOption } = useOptions();
  const navigate = useNavigate();

  useEffect(() => {
    const shortcuts = getEffectiveShortcuts(options);

    // active combos list for iframe sync
    const activeCombos = Object.entries(shortcuts)
      .filter(([, cfg]) => cfg?.enabled !== false)
      .map(([, cfg]) => cfg.key);

    const comboMatchesShortcut = (combo) => {
      return Object.entries(shortcuts).some(
        ([, cfg]) => cfg?.enabled !== false && cfg?.key === combo,
      );
    };

    const getActiveFrame = (store, activeTab) => {
      const activeRef = store.activeFrameRef?.current;
      if (activeRef) return activeRef;
      return store.frameRefs?.current?.[activeTab.id] || null;
    };

    const executeShortcut = (combo) => {
      const matchedEntries = Object.entries(shortcuts).filter(
        ([, cfg]) => cfg?.enabled !== false && cfg?.key === combo,
      );
      if (matchedEntries.length === 0) return;

      const matched = matchedEntries[0];

      const store = loaderStore.getState();
      const getActiveTab = () => loaderStore.getState().tabs.find((t) => t.active);
      const activeTab = getActiveTab();
      if (!activeTab) return;

      const ensureWorkspace = () => {
        const path = window.location.pathname;
        if (path !== '/' && path !== '/search') {
          navigate('/search');
        }
      };

      const setActiveByIndex = (index) => {
        const target = store.tabs[index];
        if (!target) return;
        store.setActive(target.id);
        ensureWorkspace();
      };

      const openNewTab = () => {
        if (store.tabs.length >= 60) return;
        const id = createId();
        store.addTab({ title: 'New Tab', id, url: 'tabs://new' });
        store.setActive(id);
        ensureWorkspace();
      };

      const closeCurrentTab = () => {
        if (activeTab.pinned) return;
        if (store.tabs.length <= 1) {
          if (activeTab.url !== 'tabs://new') {
            store.updateUrl(activeTab.id, process('ghost://home', false, options.prType || 'auto', options.engine || null));
            store.updateTitle(activeTab.id, 'New Tab');
          }
          return;
        }
        store.setLastActive(activeTab.id);
        store.removeTab(activeTab.id);
        ensureWorkspace();
      };

      const duplicateCurrentTab = () => {
        const current = getActiveTab();
        if (!current) return;
        if (store.tabs.length >= 60) return;
        const id = createId();
        store.addTab({ title: current.title || 'New Tab', id, url: current.url || 'tabs://new' });
        store.setActive(id);
        ensureWorkspace();
      };

      const nextTab = () => {
        const fresh = loaderStore.getState();
        const idx = fresh.tabs.findIndex((t) => t.active);
        setActiveByIndex((idx + 1) % fresh.tabs.length);
      };
      const previousTab = () => {
        const fresh = loaderStore.getState();
        const idx = fresh.tabs.findIndex((t) => t.active);
        setActiveByIndex((idx - 1 + fresh.tabs.length) % fresh.tabs.length);
      };

      const pinToggle = () => {
        const current = getActiveTab();
        if (!current) return;
        loaderStore.setState((state) => ({
          tabs: state.tabs.map((t) => (t.id === current.id ? { ...t, pinned: !t.pinned } : t)),
        }));
      };

      const hardReload = () => {
        const current = getActiveTab();
        if (!current?.url || current.url === 'tabs://new') return;
        const decoded = process(current.url, true, options.prType || 'auto', options.engine || null);
        const sep = decoded.includes('?') ? '&' : '?';
        const next = `${decoded}${sep}_=${Date.now()}`;
        store.updateUrl(current.id, process(next, false, options.prType || 'auto', options.engine || null), false);
      };

      const focusAddressBar = () => {
        const input = document.getElementById('ghost-omnibox-input') || document.querySelector('input[data-ghost-omnibox="1"]');
        input?.focus();
        input?.select?.();
      };

      const zoomIn = () => {
        const current = getActiveTab();
        if (!current) return;
        const currentZoom = store.zoomLevels?.[current.id] || 100;
        const frame = getActiveFrame(store, current);
        store.setZoom(current.id, Math.min(currentZoom + 10, 200), { current: frame });
      };
      const zoomOut = () => {
        const current = getActiveTab();
        if (!current) return;
        const currentZoom = store.zoomLevels?.[current.id] || 100;
        const frame = getActiveFrame(store, current);
        store.setZoom(current.id, Math.max(currentZoom - 10, 50), { current: frame });
      };

      const bookmarkCurrentPage = () => {
        const currentTab = getActiveTab();
        if (!currentTab?.url || currentTab.url === 'tabs://new') return;
        const currentFrameUrl = store.iframeUrls?.[currentTab.id] || '';
        if (isInternalGhostTabUrl(currentTab.url, currentFrameUrl)) return;
        const decoded = process(currentTab.url, true, options.prType || 'auto', options.engine || null);
        const currentBookmarks = options.bookmarks || [];
        const next = [
          {
            id: createId(),
            name: currentTab.title || 'Saved Page',
            url: decoded,
            icon: null,
          },
          ...currentBookmarks,
        ];
        updateOption({ bookmarks: next });
      };

      const actions = {
        newTab: openNewTab,
        closeTab: closeCurrentTab,
        reopenClosedTab: () => store.reopenClosedTab(),
        duplicateTab: duplicateCurrentTab,
        nextTab,
        previousTab,
        pinTab: pinToggle,
        goBack: () => store.goBack(activeTab.id),
        goForward: () => store.goForward(activeTab.id),
        reload: () => store.refreshTab(activeTab.id),
        reloadF5: () => store.refreshTab(activeTab.id),
        hardReload,
        focusAddressBar,
        goHome: () => {
          const current = getActiveTab();
          if (!current) return;
          const homeUrl = process('ghost://home', false, options.prType || 'auto', options.engine || null);
          store.updateUrl(current.id, homeUrl);
          store.setIframeUrl(current.id, 'ghost://home');
          ensureWorkspace();
        },
        // devtools toggle
        toggleDevToolsF12: () => {
          window.dispatchEvent(new CustomEvent('ghost-toggle-devtools', {
            detail: { tabId: activeTab.id, frame: getActiveFrame(store, activeTab) },
          }));
        },
        toggleDevToolsAlt: () => {
          window.dispatchEvent(new CustomEvent('ghost-toggle-devtools', {
            detail: { tabId: activeTab.id, frame: getActiveFrame(store, activeTab) },
          }));
        },
        zoomIn,
        zoomOut,
        zoomReset: () => {
          const current = getActiveTab();
          if (!current) return;
          const frame = getActiveFrame(store, current);
          store.resetZoom(current.id, { current: frame });
        },
        toggleFullscreen: () => {
          const current = getActiveTab();
          if (!current) return;
          getActiveFrame(store, current)?.requestFullscreen?.();
        },
        openSettings: () => {
          if (store.tabs.length >= 60) return;
          const id = createId();
          const settingsUrl = process('ghost://settings', false, options.prType || 'auto', options.engine || null);
          store.addTab({ title: 'Ghost Settings', id, url: settingsUrl });
          store.setIframeUrl(id, 'ghost://settings');
          store.setActive(id);
          ensureWorkspace();
        },
        // history/bookmarks 
        openHistory: () => {
          window.dispatchEvent(new Event('ghost-open-history'));
        },
        openBookmarks: () => {
          window.dispatchEvent(new Event('ghost-open-bookmarks'));
        },
        bookmarkCurrentPage,
        tab1: () => setActiveByIndex(0),
        tab2: () => setActiveByIndex(1),
        tab3: () => setActiveByIndex(2),
        tab4: () => setActiveByIndex(3),
        tab5: () => setActiveByIndex(4),
        tab6: () => setActiveByIndex(5),
        tab7: () => setActiveByIndex(6),
        tab8: () => setActiveByIndex(7),
        tab9: () => setActiveByIndex(8),
        tab10: () => setActiveByIndex(9),
      };

      const action = actions[matched[0]];
      if (!action) return;
      action();
    };

    // inside an iframe this passes up to the top window instead of running here
    const handleKeyDown = (e) => {
      const combo = eventToShortcut(e);
      if (!comboMatchesShortcut(combo)) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation?.();

      if (window !== window.top) {
        try {
          window.top.postMessage(
            {
              type: 'ghost-shortcut',
              key: e.key,
              altKey: e.altKey,
              ctrlKey: e.ctrlKey,
              shiftKey: e.shiftKey,
              metaKey: e.metaKey,
            },
            '*'
          );
        } catch {}
        return;
      }

      executeShortcut(combo);
    };

    // postMessage from iframes (scramjet inject script)
    const handleMessage = (e) => {
      if (e.data?.type === 'ghost-shortcut') {
        let key = e.data.key;
        if (!key) return;
        if (key === ' ' || key === 'Spacebar') key = 'Space';
        if (key.length === 1) key = key.toUpperCase();
        const parts = [];
        if (e.data.ctrlKey) parts.push('Ctrl');
        if (e.data.altKey) parts.push('Alt');
        if (e.data.shiftKey) parts.push('Shift');
        if (e.data.metaKey) parts.push('Meta');
        parts.push(key);
        const combo = parts.join('+');
        executeShortcut(combo);
      }

      if (e.data?.type === 'ghost-request-shortcuts') {
        const payload = { type: 'ghost-update-shortcuts', shortcuts: activeCombos };
        try {
          e.source?.postMessage?.(payload, '*');
        } catch {}
        try {
          const frames = document.querySelectorAll('iframe');
          for (let i = 0; i < frames.length; i++) {
            frames[i].contentWindow?.postMessage?.(payload, '*');
          }
        } catch {}
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('message', handleMessage);
    };
  }, [options, updateOption]);

  return null;
};

export default GlobalShortcuts;
