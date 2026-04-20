import loaderStore from '/src/utils/hooks/loader/useLoaderStore';
import { Globe, X, Plus, Loader, UsersRound, UserPlus, Check, Pencil, Trash2, Upload, Download } from 'lucide-react';
import { showAlert, showConfirm } from '/src/utils/uiDialog';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useOptions } from '/src/utils/optionsContext'
import clsx from 'clsx';
import { createId } from '/src/utils/id';
import { process } from '/src/utils/hooks/loader/utils';

const PROFILE_STORE_KEY = 'ghostBrowserProfiles';
const PROFILE_ACTIVE_KEY = 'ghostBrowserActiveProfileId';
const SAVED_TABS_KEY = 'ghostSavedTabs';

const isPlainObject = (value) => !!value && typeof value === 'object' && !Array.isArray(value);

const isValidProfileImport = (parsed) => {
  if (!isPlainObject(parsed)) return false;
  if (!Object.prototype.hasOwnProperty.call(parsed, 'tabs')) return false;
  if (!Object.prototype.hasOwnProperty.call(parsed, 'snapshot')) return false;
  if (!Array.isArray(parsed.tabs)) return false;
  if (!isPlainObject(parsed.snapshot)) return false;

  return parsed.tabs.every((tab) => {
    if (!isPlainObject(tab)) return false;
    const id = String(tab.id || '').trim();
    const title = String(tab.title || '').trim();
    const url = String(tab.url || '').trim();
    return !!id && !!title && !!url;
  });
};

const getLiveTabsSnapshot = () => {
  try {
    const state = loaderStore.getState();
    const tabs = Array.isArray(state.tabs) ? state.tabs : [];
    return tabs;
  } catch {
    return [];
  }
};

const snapshotCurrentStorage = () => {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || key === PROFILE_STORE_KEY || key === PROFILE_ACTIVE_KEY) continue;
    data[key] = localStorage.getItem(key);
  }
  return data;
};

const applyStorageSnapshot = (snapshot) => {
  const keep = new Set([PROFILE_STORE_KEY, PROFILE_ACTIVE_KEY]);
  const toRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && !keep.has(key)) toRemove.push(key);
  }
  toRemove.forEach((key) => localStorage.removeItem(key));

  Object.entries(snapshot || {}).forEach(([key, value]) => {
    if (typeof value === 'string') {
      localStorage.setItem(key, value);
    }
  });
};

const getGhostTabLabel = (url) => {
  if (!url) return null;

  const raw = String(url || '').trim();
  const normalizedGhost = raw.toLowerCase();
  const ghostRouteMap = {
    'ghost://home': 'Ghost Home',
    'ghost://new-tab': 'Ghost Home',
    'ghost://newtab': 'Ghost Home',
    'ghost://apps': 'Ghost Apps',
    'ghost://settings': 'Ghost Settings',
    'ghost://entertainment': 'Ghost Entertainment',
    'ghost://discover': 'Ghost Entertainment',
    'ghost://games': 'Ghost Entertainment',
    'ghost://tv': 'Ghost Entertainment',
    'ghost://music': 'Ghost Entertainment',
    'ghost://docs': 'Ghost Docs',
    'ghost://search': 'Ghost Search',
    'ghost://code': 'Ghost Code',
    'ghost://ai': 'Ghost AI',
    'ghost://remote': 'Remote Access',
    'ghost://musicplayer': 'Ghost Music',
    'ghost://monochrome': 'Ghost Music',
    'ghost://duckai': 'Ghost Duck AI',
    'ghost://live': 'Ghost Live TV',
    'ghost://movies': 'Ghost Movies/TV',
    'ghost://anime': 'Ghost Anime',
    'ghost://browselol': 'Ghost Browser.lol',
  };

  if (ghostRouteMap[normalizedGhost]) {
    return ghostRouteMap[normalizedGhost];
  }

  if (normalizedGhost.startsWith('ghost://docs/')) return 'Ghost Docs';

  try {
    const parsed = new URL(raw, location.origin);
    if (parsed.origin !== location.origin) return null;

    const path = parsed.pathname.replace(/\/$/, '') || '/';
    if (path.startsWith('/docs/')) return 'Ghost Docs';
    if (path === '/discover' || path === '/discover/r') {
      return 'Ghost Entertainment';
    }

    const map = {
      '/': 'Ghost Home',
      '/new': 'Ghost Home',
      '/apps': 'Ghost Apps',
      '/settings': 'Ghost Settings',
      '/docs': 'Ghost Docs',
      '/search': 'Ghost Search',
      '/code': 'Ghost Code',
      '/ai': 'Ghost AI',
      '/remote': 'Remote Access',
    };
    return map[path] || null;
  } catch {
    return null;
  }
};

const TabBar = () => {
  const { tabs, addTab, removeTab, setActive, showTabs, setLastActive, showUI, updateUrl, updateTitle, reorderTab } = loaderStore();
  const { options } = useOptions();
  const [profilesOpen, setProfilesOpen] = useState(false);
  const [profilesRender, setProfilesRender] = useState(false);
  const [profilesAnim, setProfilesAnim] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState('');
  const [newProfileName, setNewProfileName] = useState('');
  const [renameId, setRenameId] = useState('');
  const [renameValue, setRenameValue] = useState('');
  const fileInputRef = useRef(null);
  const panelRef = useRef(null);
  const triggerRef = useRef(null);
  const [draggedIdx, setDraggedIdx] = useState(null);

  useEffect(() => {
    try {
      const storedProfiles = JSON.parse(localStorage.getItem(PROFILE_STORE_KEY) || '[]');
      const list = Array.isArray(storedProfiles) ? storedProfiles : [];

      if (list.length === 0) {
        const initial = {
          id: createId(),
          name: 'Default',
          snapshot: snapshotCurrentStorage(),
          tabs: getLiveTabsSnapshot(),
          updatedAt: Date.now(),
        };
        localStorage.setItem(PROFILE_STORE_KEY, JSON.stringify([initial]));
        localStorage.setItem(PROFILE_ACTIVE_KEY, initial.id);
        setProfiles([initial]);
        setActiveProfileId(initial.id);
        return;
      }

      const activeId = localStorage.getItem(PROFILE_ACTIVE_KEY) || list[0].id;
      localStorage.setItem(PROFILE_ACTIVE_KEY, activeId);
      setProfiles(list);
      setActiveProfileId(activeId);
    } catch {
      const initial = {
        id: createId(),
        name: 'Default',
        snapshot: snapshotCurrentStorage(),
        tabs: getLiveTabsSnapshot(),
        updatedAt: Date.now(),
      };
      localStorage.setItem(PROFILE_STORE_KEY, JSON.stringify([initial]));
      localStorage.setItem(PROFILE_ACTIVE_KEY, initial.id);
      setProfiles([initial]);
      setActiveProfileId(initial.id);
    }
  }, []);

  const persistProfiles = (next, nextActive = activeProfileId) => {
    setProfiles(next);
    setActiveProfileId(nextActive);
    localStorage.setItem(PROFILE_STORE_KEY, JSON.stringify(next));
    localStorage.setItem(PROFILE_ACTIVE_KEY, nextActive);
  };

  const activeProfile = useMemo(
    () => profiles.find((profile) => profile.id === activeProfileId) || profiles[0],
    [profiles, activeProfileId],
  );

  const createProfile = () => {
    const name = (newProfileName || `Profile ${profiles.length + 1}`).trim();
    const nextProfile = {
      id: createId(),
      name,
      snapshot: snapshotCurrentStorage(),
      tabs: getLiveTabsSnapshot(),
      updatedAt: Date.now(),
    };
    const next = [...profiles, nextProfile];
    persistProfiles(next, nextProfile.id);
    setNewProfileName('');
  };

  const switchProfile = (targetId) => {
    if (!targetId || targetId === activeProfileId) return;
    const liveTabs = getLiveTabsSnapshot();
    try {
      localStorage.setItem(SAVED_TABS_KEY, JSON.stringify({ tabs: liveTabs }));
    } catch { }

    const next = profiles.map((profile) => {
      if (profile.id === activeProfileId) {
        return { ...profile, snapshot: snapshotCurrentStorage(), tabs: liveTabs, updatedAt: Date.now() };
      }
      return profile;
    });
    const target = next.find((profile) => profile.id === targetId);
    if (!target) return;

    persistProfiles(next, targetId);
    applyStorageSnapshot(target.snapshot || {});
    try {
      const targetTabs = Array.isArray(target.tabs)
        ? target.tabs
        : JSON.parse(String(target?.snapshot?.[SAVED_TABS_KEY] || '{}')).tabs;
      if (Array.isArray(targetTabs)) {
        localStorage.setItem(SAVED_TABS_KEY, JSON.stringify({ tabs: targetTabs }));
      }
    } catch { }
    window.location.reload();
  };

  const deleteProfile = async (id) => {
    if (profiles.length <= 1) return;

    const target = profiles.find(p => p.id === id);
    const confirmed = await showConfirm(`Are you sure you want to delete the profile "${target?.name || 'Unknown'}"? This action cannot be undone.`, 'Delete Profile');
    if (!confirmed) return;

    const next = profiles.filter((profile) => profile.id !== id);
    const nextActive = id === activeProfileId ? next[0].id : activeProfileId;
    persistProfiles(next, nextActive);

    if (id === activeProfileId) {
      const nextTarget = next.find((profile) => profile.id === nextActive);
      applyStorageSnapshot(nextTarget?.snapshot || {});
      window.location.reload();
    }
  };

  const saveRename = () => {
    if (!renameId) return;
    const name = renameValue.trim();
    if (!name) return;
    const next = profiles.map((profile) => profile.id === renameId ? { ...profile, name } : profile);
    persistProfiles(next, activeProfileId);
    setRenameId('');
    setRenameValue('');
  };

  const exportSpecificProfile = (profile, ext = 'json') => {
    if (!profile) return;
    const payload = JSON.stringify(profile, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const normalizedExt = ext === 'ghost' ? 'ghost' : 'json';
    a.download = `${(profile.name || 'profile').replace(/\s+/g, '_').toLowerCase()}.${normalizedExt}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportActiveProfile = () => {
    exportSpecificProfile(activeProfile, 'ghost');
  };

  const importProfile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        if (!isValidProfileImport(parsed)) {
          throw new Error('invalid-profile-structure');
        }
        const imported = {
          id: createId(),
          name: String(parsed.name || `Imported ${profiles.length + 1}`).trim() || `Imported ${profiles.length + 1}`,
          snapshot: parsed.snapshot && typeof parsed.snapshot === 'object' ? parsed.snapshot : {},
          tabs: Array.isArray(parsed.tabs) ? parsed.tabs : [],
          updatedAt: Date.now(),
        };
        persistProfiles([...profiles, imported], activeProfileId);
      } catch {
        showAlert('Invalid file. This profile format is not supported or has changed.', 'Import Error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const clearActiveProfileData = () => {
    if (!activeProfile) return;
    const next = profiles.map((profile) =>
      profile.id === activeProfile.id
        ? { ...profile, snapshot: {}, updatedAt: Date.now() }
        : profile,
    );
    persistProfiles(next, activeProfile.id);
    applyStorageSnapshot({});
    window.location.reload();
  };

  useEffect(() => {
    const close = (event) => {
      if (!profilesOpen) return;
      const clickedPanel = panelRef.current?.contains(event.target);
      const clickedTrigger = triggerRef.current?.contains(event.target);
      if (!clickedPanel && !clickedTrigger) {
        setProfilesOpen(false);
      }
    };
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [profilesOpen]);

  useEffect(() => {
    if (profilesOpen) {
      setProfilesAnim(false);
      setProfilesRender(true);
      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setProfilesAnim(true));
      });
      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }

    setProfilesAnim(false);
    const t = setTimeout(() => setProfilesRender(false), 180);
    return () => clearTimeout(t);
  }, [profilesOpen]);

  useEffect(() => {
    const closeAll = () => setProfilesOpen(false);
    window.addEventListener('ghost-close-all-loader-popups', closeAll);
    return () => window.removeEventListener('ghost-close-all-loader-popups', closeAll);
  }, []);

  useEffect(() => {
    if (!activeProfileId || profiles.length === 0) return;

    const interval = setInterval(() => {
      const latestSnapshot = snapshotCurrentStorage();
      const serialized = JSON.stringify(latestSnapshot);
      const latestTabs = getLiveTabsSnapshot();
      const serializedTabs = JSON.stringify(latestTabs);

      setProfiles((prev) => {
        const current = prev.find((profile) => profile.id === activeProfileId);
        if (!current) return prev;

        const currentSerialized = JSON.stringify(current.snapshot || {});
        const currentTabsSerialized = JSON.stringify(Array.isArray(current.tabs) ? current.tabs : []);
        if (currentSerialized === serialized && currentTabsSerialized === serializedTabs) return prev;

        const next = prev.map((profile) =>
          profile.id === activeProfileId
            ? { ...profile, snapshot: latestSnapshot, tabs: latestTabs, updatedAt: Date.now() }
            : profile,
        );

        localStorage.setItem(PROFILE_STORE_KEY, JSON.stringify(next));
        return next;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [activeProfileId, profiles.length]);

  // Instant tab-save: subscribe to loaderStore changes so tab updates persist immediately
  useEffect(() => {
    if (!activeProfileId) return;
    let debounceTimer = null;
    const unsub = loaderStore.subscribe(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const latestSnapshot = snapshotCurrentStorage();
        const latestTabs = getLiveTabsSnapshot();
        try {
          const storedProfiles = JSON.parse(localStorage.getItem(PROFILE_STORE_KEY) || '[]');
          const next = storedProfiles.map((p) =>
            p.id === activeProfileId
              ? { ...p, snapshot: latestSnapshot, tabs: latestTabs, updatedAt: Date.now() }
              : p
          );
          localStorage.setItem(PROFILE_STORE_KEY, JSON.stringify(next));
        } catch { }
      }, 300);
    });
    return () => { unsub(); clearTimeout(debounceTimer); };
  }, [activeProfileId]);

  const profilePanelBg = '#101215';
  const profilePanelSubtleBg = '#171a1f';
  const profilePanelInputBg = '#0c0f13';
  const profilePanelTextColor = '#eceef2';
  const profilePanelMutedText = '#aaafb8';
  const profileCreateBg = '#353941';
  const profileBorderColor = 'rgba(255,255,255,0.14)';
  const profileRowActive = 'border-white/25 bg-[#404349]';
  const profileRowIdle = 'border-white/10 bg-white/[0.03] hover:bg-white/[0.08]';
  const profileIconHover = 'hover:bg-white/10';
  const profileSecondaryBg = '#1b1f26';

  return (
    <div className={clsx("h-10 items-center overflow-visible gap-1 px-1 relative", showTabs && showUI ? 'flex' : 'hidden')} style={{ backgroundColor: options.tabBarColor || "#070e15" }}>
      <div className="relative flex-none">
        <button
          ref={triggerRef}
          className={clsx(
            'w-8 h-8 rounded-lg flex items-center justify-center border',
            options.type != 'light' ? 'border-white/10 hover:bg-[#ffffff1e]' : 'border-black/10 hover:bg-[#a7a7a7]',
          )}
          onClick={(e) => {
            e.stopPropagation();
            setProfilesOpen((prev) => !prev);
          }}
          title="Profiles"
        >
          <UsersRound size={15} />
        </button>

        {profilesRender && (
          <>
            <button
              type="button"
              aria-label="Close profile manager"
              className={
                'fixed inset-0 z-[115] bg-transparent transition-opacity duration-200 ' +
                (profilesAnim ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none')
              }
              onClick={() => setProfilesOpen(false)}
            />
            <div
              ref={panelRef}
              className={
                'absolute left-0 top-10 w-[372px] rounded-xl border z-[120] shadow-[0_14px_34px_rgba(0,0,0,0.4)] overflow-hidden backdrop-blur-sm transition-all duration-200 origin-top-left ' +
                (profilesAnim ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none')
              }
              style={{ backgroundColor: profilePanelBg, color: profilePanelTextColor, borderColor: profileBorderColor }}
            >
              <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: profileBorderColor }}>
                <p className="text-sm font-semibold">Profile Manager</p>
                <div className="flex items-center gap-1">
                  <button className={clsx('p-1.5 rounded-md', profileIconHover)} title="Export profile (.ghost)" onClick={exportActiveProfile}>
                    <Download size={14} />
                  </button>
                </div>
              </div>

              <div className="px-4 pt-3 pb-2 border-b" style={{ backgroundColor: profilePanelSubtleBg, borderColor: profileBorderColor }}>
                <p className="text-xs" style={{ color: profilePanelMutedText }}>Current Profile</p>
                <p className="text-sm font-semibold truncate">{activeProfile?.name || 'Default'}</p>
              </div>

              <div className="p-3 space-y-2 max-h-[290px] overflow-y-auto">
                <p className="text-xs px-1" style={{ color: profilePanelMutedText }}>Available Profiles</p>
                {profiles.map((profile) => {
                  const active = profile.id === activeProfileId;
                  const isRenaming = renameId === profile.id;
                  return (
                    <div
                      key={profile.id}
                      className={clsx('rounded-lg border px-2.5 py-2.5 transition-colors duration-150', active ? profileRowActive : clsx(profileRowIdle, 'cursor-pointer'))}
                      onClick={() => !active && !isRenaming && switchProfile(profile.id)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          {isRenaming ? (
                            <input
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveRename();
                              }}
                              className="w-full border border-white/20 outline-none focus:border-white/40 rounded px-2 py-1 text-sm shadow-inner"
                              style={{ backgroundColor: profilePanelInputBg, color: profilePanelTextColor }}
                              placeholder="Profile name"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <p className="text-sm font-medium truncate">{profile.name}</p>
                          )}
                          <p className="text-[11px]" style={{ color: profilePanelMutedText }}>{active ? '• Active' : '• Available'}</p>
                        </div>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {isRenaming ? (
                            <button className={clsx('p-1 rounded', profileIconHover)} onClick={saveRename} title="Save name">
                              <Check size={13} />
                            </button>
                          ) : (
                            <button className={clsx('p-1 rounded', profileIconHover)} onClick={() => { setRenameId(profile.id); setRenameValue(profile.name); }} title="Rename">
                              <Pencil size={13} />
                            </button>
                          )}

                          <button className={clsx('p-1 rounded', profileIconHover)} onClick={() => exportSpecificProfile(profile, 'json')} title="Export Profile (.json)">
                            <Download size={13} />
                          </button>
                          {profiles.length > 1 && (
                            <button className={clsx('p-1 rounded', profileIconHover, 'hover:text-red-400')} onClick={() => deleteProfile(profile.id)} title="Delete">
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 border-t border-white/10 flex items-center gap-2">
                <input
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') createProfile();
                  }}
                  placeholder="New profile name"
                  className="flex-1 h-9 rounded-md shadow-inner outline-none focus:border-white/30 border border-white/10 px-2 text-sm"
                  style={{ backgroundColor: profilePanelInputBg, color: profilePanelTextColor }}
                />
                <button
                  className="h-9 px-3 rounded-md border border-white/15 hover:brightness-110 text-sm font-medium flex items-center gap-1.5"
                  style={{ backgroundColor: profileCreateBg, color: '#ffffff' }}
                  onClick={createProfile}
                >
                  <UserPlus size={13} /> Create
                </button>
              </div>

              <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                <button
                  className="h-9 rounded-md border border-white/10 hover:brightness-110 text-sm flex items-center justify-center gap-1.5"
                  style={{ backgroundColor: profileSecondaryBg }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={13} /> Import
                </button>
                <button
                  className="h-9 rounded-md border border-white/10 hover:brightness-110 text-sm flex items-center justify-center gap-1.5"
                  style={{ backgroundColor: profileSecondaryBg }}
                  onClick={clearActiveProfileData}
                >
                  <Trash2 size={13} /> Clear Data
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.ghost,application/json"
                  className="hidden"
                  onChange={importProfile}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {tabs.map(({ title, id, active, isLoading, url, pinned }, index) => {
        const showGlobe = url === 'tabs://new' || !isLoading;
        const ghostLabel = getGhostTabLabel(url);
        const displayTitle = ghostLabel || (url === 'tabs://new' ? 'New Tab' : title);

        return (
          <div
            className={clsx(
              'flex flex-1 flex-shrink px-2 h-[calc(100%-7px)] min-w-[60px] max-w-[200px]',
              'items-center border rounded-md duration-150',
            )}
            onClick={() => setActive(id)}
            key={id}
            draggable={true}
            onDragStart={(e) => {
              setDraggedIdx(index);
              e.dataTransfer.effectAllowed = 'move';
              e.dataTransfer.setData('text/html', e.target.parentNode);
              e.dataTransfer.setDragImage(e.target, 20, 20);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (draggedIdx === null || draggedIdx === index) return;
              reorderTab(draggedIdx, index);
              setDraggedIdx(null);
            }}
            onDragEnd={() => setDraggedIdx(null)}
            style={{
              backgroundColor: active ? options.tabColor || "#111e2fb0" : "",
              borderColor: active ? options.tabOutline || "#344646" : "#ffffff0c",
              opacity: draggedIdx === index ? 0.3 : 1
            }}
          >
            {showGlobe ? (
              <Globe size={15} className="flex-shrink-0" />
            ) : (
              <Loader size={15} className="flex-shrink-0 animate-spin" />
            )}
            {pinned && <span className="ml-1 text-[0.64rem] opacity-80">📌</span>}
            <span className="truncate text-[0.79rem] ml-1 min-w-0">{displayTitle}</span>
            {!pinned && (
              <X
                size={13}
                className={clsx("ml-auto flex-shrink-0 duration-200 cursor-pointer")}
                onClick={(e) => {
                  e.stopPropagation();
                  if (tabs.length > 1) {
                    active && setLastActive(id);
                    removeTab(id);
                    return;
                  }

                  if (url !== 'tabs://new') {
                    updateUrl(id, process('ghost://home', false, options.prType || 'auto', options.engine || null));
                    updateTitle(id, 'New Tab');
                  }
                }}
              />
            )}
          </div>
        );
      })}

      <button
        disabled={tabs.length >= 20}
        className={clsx(
          'flex-none mx-1 w-6 h-6',
          'flex items-center justify-center',
          'duration-100 rounded-lg',
          options.type != 'light' ? "hover:bg-[#ffffff1e]" : "hover:bg-[#a7a7a7]",
          tabs.length >= 20 ? 'cursor-not-allowed opacity-50 hover:bg-transparent' : '',
        )}
        onClick={() => {
          if (tabs.length < 20) {
            let uuid = createId();
            addTab({
              title: 'New Tab',
              id: uuid,
              url: "tabs://new"
            });
            setActive(uuid);
          }
        }}
      >
        <Plus size={15} />
      </button>
    </div>
  );
};

export default TabBar;
