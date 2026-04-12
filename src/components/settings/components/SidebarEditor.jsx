import { useState, useMemo, useEffect } from 'react';
import clsx from 'clsx';
import { useOptions } from '/src/utils/optionsContext';
import { createId } from '/src/utils/id';
import { X, Plus, Trash2, Pencil } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { showAlert } from '/src/utils/uiDialog';

export function getLucideIcon(iconName) {
    if (!iconName) return LucideIcons.Link;
    const exact = LucideIcons[iconName];
    if (exact) return exact;

    const normalized = iconName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const keys = Object.keys(LucideIcons);
    for (const key of keys) {
        if (key.toLowerCase() === normalized) {
            return LucideIcons[key];
        }
    }
    return LucideIcons.Link;
}

export default function SidebarEditor({ open, onClose }) {
    const { options, updateOption } = useOptions();
    const [editingApp, setEditingApp] = useState(null);
    const [visible, setVisible] = useState(false);
    const [render, setRender] = useState(false);

    useEffect(() => {
        if (open) {
            setRender(true);
            setTimeout(() => setVisible(true), 10);
        } else {
            setVisible(false);
            const timer = setTimeout(() => setRender(false), 200);
            return () => clearTimeout(timer);
        }
    }, [open]);

    // Custom Apps are stored in options.sidebarCustomApps
    const sidebarCustomApps = useMemo(() => {
        const apps = Array.isArray(options.sidebarCustomApps) ? options.sidebarCustomApps : [];
        return apps.map((app, index) => ({
            ...app,
            id: app.id || `app-${index}-${Date.now()}`
        }));
    }, [options.sidebarCustomApps]);

    const predefinedToggles = [
        { id: 'showApps', label: 'Apps', default: true },
        { id: 'showGames', label: 'Games', default: true },
        { id: 'showTV', label: 'TV', default: true },
        { id: 'showMusic', label: 'Music', default: true },
        { id: 'showRemote', label: 'Remote Access', default: true },
        { id: 'showAI', label: 'AI', default: true },
        { id: 'showBookmarks', label: 'Bookmarks', default: true },
        { id: 'showAdBlock', label: 'Ad Block', default: true },
        { id: 'showDevOptions', label: 'Dev Options', default: true },
        { id: 'showHistory', label: 'History', default: true },
        { id: 'showChangelog', label: 'Changelog', default: true },
        { id: 'showDocs', label: 'Docs', default: true },
        { id: 'showDiscord', label: 'Discord', default: true },
        { id: 'showChat', label: 'Chat', default: true },
    ];

    const isToggled = (id) => {
        const toggleItem = predefinedToggles.find(t => t.id === id);
        const current = options.sidebarToggles || {};
        return current[id] !== undefined ? current[id] : (toggleItem ? toggleItem.default : true);
    };

    const activeDefaultsCount = predefinedToggles.filter(t => isToggled(t.id)).length;
    const totalActiveItems = activeDefaultsCount + sidebarCustomApps.length;
    const MAX_ITEMS = 16;

    const handleToggle = (id) => {
        const toggleItem = predefinedToggles.find(t => t.id === id);
        if (toggleItem && toggleItem.disabled) return;

        const current = options.sidebarToggles || {};
        const currentValue = current[id] !== undefined ? current[id] : (toggleItem ? toggleItem.default : true);
        const nextVal = !currentValue;

        if (nextVal && totalActiveItems >= MAX_ITEMS) {
            showAlert(`You cannot turn on more default apps. Please delete a custom app or turn off another default toggle first to free up a slot.`, 'Limit Reached');
            return;
        }

        updateOption({
            sidebarToggles: {
                ...current,
                [id]: nextVal,
            },
        });
    };

    const handleSaveApp = (app) => {
        if (editingApp?.id) {
            updateOption({
                sidebarCustomApps: sidebarCustomApps.map((a) => (a.id === app.id ? app : a)),
            });
        } else {
            if (totalActiveItems >= MAX_ITEMS) {
                showAlert(`You cannot add more custom apps. Please turn off a default toggle first to free up a slot.`, 'Limit Reached');
                return;
            }
            updateOption({
                sidebarCustomApps: [...sidebarCustomApps, { ...app, id: createId() }],
            });
        }
        setEditingApp(null);
    };

    const handleDeleteApp = (id) => {
        updateOption({
            sidebarCustomApps: sidebarCustomApps.filter((a) => a.id !== id),
        });
    };

    if (!open && !render) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <div
                className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />
            <div
                className={clsx(
                    "relative w-full max-w-2xl max-h-[85dvh] rounded-xl border border-white/10 overflow-hidden flex flex-col transition-all duration-200",
                    visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-[0.965] translate-y-2'
                )}
                style={{ backgroundColor: options.quickModalBgColor || options.menuColor || '#1a252f' }}
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <h2 className="text-lg font-semibold">Sidebar Editor</h2>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-[#ffffff12]">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto max-h-[calc(85dvh-4rem)] space-y-6 flex-1">
                    {editingApp ? (
                        <AppForm app={editingApp} onSave={handleSaveApp} onCancel={() => setEditingApp(null)} />
                    ) : (
                        <>
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold">Custom Apps ({sidebarCustomApps.length})</h3>
                                    {totalActiveItems < MAX_ITEMS && (
                                        <button
                                            onClick={() => setEditingApp({ name: '', url: '', icon: '' })}
                                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-[#ffffff14] hover:bg-[#ffffff22]"
                                        >
                                            <Plus size={14} /> Add App
                                        </button>
                                    )}
                                </div>
                                {sidebarCustomApps.length === 0 ? (
                                    <div className="text-sm opacity-60 p-4 border border-white/10 border-dashed rounded-lg text-center">
                                        No custom apps added yet.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {sidebarCustomApps.map((app) => {
                                            const Icon = getLucideIcon(app.icon);
                                            return (
                                                <div key={app.id} className="flex items-center justify-between p-3 rounded-lg bg-[#ffffff0d] border border-white/5">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <Icon size={18} className="shrink-0" />
                                                        <div className="truncate text-sm">
                                                            <p className="font-medium truncate">{app.name}</p>
                                                            <p className="text-xs opacity-60 truncate">{app.url}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <button onClick={() => setEditingApp(app)} className="p-1.5 rounded-md hover:bg-[#ffffff14]">
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button onClick={() => handleDeleteApp(app.id)} className="p-1.5 rounded-md hover:bg-[#ffffff14] text-red-400">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div>
                                <div className="mb-3">
                                    <h3 className="text-sm font-semibold flex items-center justify-between">
                                        <span>Default Toggles</span>
                                        <span className="text-xs font-normal opacity-70">
                                            {totalActiveItems} / {MAX_ITEMS} Slots Used
                                        </span>
                                    </h3>
                                    {totalActiveItems >= MAX_ITEMS && (
                                        <p className="text-xs text-red-400 mt-1">Maximum sidebar items reached. Turn off a toggle to add a custom app.</p>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {predefinedToggles.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-[#ffffff0d] border border-white/5">
                                            <span className={clsx("text-sm font-medium", item.disabled && "opacity-50")}>{item.label}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleToggle(item.id)}
                                                disabled={item.disabled}
                                                className={clsx(
                                                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                                                    isToggled(item.id) ? "bg-[#2f7fff]" : "bg-[#ffffff20]",
                                                    item.disabled && "opacity-50 cursor-not-allowed"
                                                )}
                                            >
                                                <span
                                                    className={clsx(
                                                        "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                                        isToggled(item.id) ? "translate-x-4" : "translate-x-0"
                                                    )}
                                                />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function AppForm({ app, onSave, onCancel }) {
    const [name, setName] = useState(app.name || '');
    const [url, setUrl] = useState(app.url || '');
    const [icon, setIcon] = useState(app.icon || '');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim() || !url.trim()) return;

        let finalUrl = url.trim();
        if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://') && !finalUrl.startsWith('ghost://')) {
            finalUrl = 'https://' + finalUrl;
        }

        onSave({ ...app, name: name.trim(), url: finalUrl, icon: icon.trim() || 'Link' });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-sm font-semibold mb-2">{app.id ? 'Edit Custom App' : 'New Custom App'}</h3>

            <div>
                <label className="block text-xs uppercase tracking-wide opacity-70 mb-1.5">App Name</label>
                <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. My Link"
                    className="w-full h-10 rounded-md border border-white/10 bg-[#00000030] px-3 text-sm outline-none placeholder-white/30"
                />
            </div>

            <div>
                <label className="block text-xs uppercase tracking-wide opacity-70 mb-1.5">URL</label>
                <input
                    required
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="e.g. google.com"
                    className="w-full h-10 rounded-md border border-white/10 bg-[#00000030] px-3 text-sm outline-none placeholder-white/30"
                />
            </div>

            <div>
                <label className="block text-xs uppercase tracking-wide opacity-70 mb-1.5">Lucide Icon Name</label>
                <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    placeholder="e.g. MessageSquare"
                    className="w-full h-10 rounded-md border border-white/10 bg-[#00000030] px-3 text-sm outline-none placeholder-white/30"
                />
                <p className="text-xs opacity-60 mt-1">Must be an exact Lucide React icon name (like Globe, Gamepad2). Defaults to Link.</p>
            </div>

            <div className="flex gap-2 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 h-10 rounded-md border border-white/15 hover:bg-[#ffffff10] text-sm"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="flex-1 h-10 rounded-md bg-[#2f7fff44] hover:bg-[#2f7fff66] text-sm"
                >
                    Save
                </button>
            </div>
        </form>
    );
}
