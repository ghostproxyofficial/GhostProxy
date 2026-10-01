import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import clsx from 'clsx';
import { useOptions } from '/src/utils/optionsContext';
import { showAlert } from '/src/utils/uiDialog';

export default function ExportDialog({ open, onClose }) {
    const { options } = useOptions();
    const isLight = options?.type === 'light' || options?.theme === 'light' || options?.themeName === 'lightTheme';
    const [render, setRender] = useState(false);
    const [anim, setAnim] = useState(false);
    const [toggles, setToggles] = useState({
        options: true,
        tabs: true,
        history: true,
        customApps: true,
        session: true,
        cookies: true,
    });
    const [exportFormat, setExportFormat] = useState('ghost');

    useEffect(() => {
        if (open) {
            setRender(true);
            requestAnimationFrame(() => requestAnimationFrame(() => setAnim(true)));
        } else {
            setAnim(false);
            setTimeout(() => setRender(false), 200);
        }
    }, [open]);

    const handleExport = async () => {
        try {
            if (
                !toggles.options &&
                !toggles.tabs &&
                !toggles.history &&
                !toggles.customApps &&
                !toggles.session &&
                !toggles.cookies
            ) {
                showAlert('Export cancelled. No data categories were selected.', 'Export Data');
                return;
            }

            const local = {};
            if (toggles.options) {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (!key) continue;
                    if (
                        key === 'options' ||
                        key === 'ghostDocsPopupDismissed' ||
                        key === 'ghostSitePolicies' ||
                        key === 'ghostBrowserProfiles' ||
                        key === 'ghostBrowserActiveProfileId' ||
                        key.startsWith('ghost')
                    ) {
                        local[key] = localStorage.getItem(key) || '';
                    }
                }
            }
            if (toggles.tabs) local.ghostSavedTabs = localStorage.getItem('ghostSavedTabs') || '';
            if (toggles.history) local.ghostBrowserHistory = localStorage.getItem('ghostBrowserHistory') || '';
            if (toggles.customApps) local.ghostCustomApps = localStorage.getItem('ghostCustomApps') || '';

            const session = {};
            if (toggles.session) {
                for (let i = 0; i < sessionStorage.length; i++) {
                    const key = sessionStorage.key(i);
                    if (!key) continue;
                    session[key] = sessionStorage.getItem(key);
                }
            }

            const payload = {
                exportedAt: new Date().toISOString(),
                version: 'v4-ghost-export',
                localStorage: local,
                sessionStorage: session,
                cookies: toggles.cookies ? document.cookie || '' : '',
            };

            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });

            const dateObj = new Date();
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            const ext = exportFormat === 'json' ? 'json' : 'ghost';
            const defaultName = `GhostBackup-${year}-${month}-${day}.${ext}`;

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = defaultName;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            onClose();
        } catch {
            showAlert('Failed to export data.', 'Export Error');
        }
    };

    const toggle = (k) => setToggles((p) => ({ ...p, [k]: !p[k] }));

    if (!render) return null;

    return (
        <div className={clsx('fixed inset-0 z-[10000] flex items-center justify-center p-4 transition-all duration-300 ease-out', anim ? 'opacity-100' : 'opacity-0')}>
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div
                className={clsx(
                    clsx('ghost-glass relative w-full max-w-lg rounded-xl border overflow-hidden transition-all duration-300 ease-out', isLight ? 'border-black/10' : 'border-white/10'),
                    anim ? 'scale-100 translate-y-0' : 'scale-[0.95] translate-y-4'
                )}
                style={{ backgroundColor: options.quickModalBgColor || options.menuColor || '#1a252f' }}
            >
                <div className={clsx("flex items-center justify-between px-4 py-3 border-b", isLight ? "border-black/10" : "border-white/10")}>
                    <h2 className="text-lg font-semibold">Export Ghost Data</h2>
                    <button onClick={onClose} className={clsx("p-1 rounded-md", isLight ? "hover:bg-black/[0.06]" : "hover:bg-[#ffffff12]")}>
                        <X size={18} />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <p className="text-sm opacity-80">Select which data categories to include in your backup. You can export as `.ghost` or `.json`.</p>

                    <div className={clsx("rounded-lg p-3 border", isLight ? "bg-black/[0.04] border-black/10" : "bg-[#ffffff0a] border-white/10")}>
                        <p className="text-sm font-medium mb-2">File Format</p>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                className={clsx(
                                    'px-3 py-1.5 rounded-md text-sm border',
                                    exportFormat === 'ghost' ? 'bg-[#22c55e]/20 border-[#22c55e]/40 text-[#22c55e]' : isLight ? 'border-black/15 hover:bg-black/[0.05]' : 'border-white/15 hover:bg-[#ffffff10]'
                                )}
                                onClick={() => setExportFormat('ghost')}
                            >
                                .ghost
                            </button>
                            <button
                                type="button"
                                className={clsx(
                                    'px-3 py-1.5 rounded-md text-sm border',
                                    exportFormat === 'json' ? 'bg-[#22c55e]/20 border-[#22c55e]/40 text-[#22c55e]' : isLight ? 'border-black/15 hover:bg-black/[0.05]' : 'border-white/15 hover:bg-[#ffffff10]'
                                )}
                                onClick={() => setExportFormat('json')}
                            >
                                .json
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {[
                            { id: 'options', label: 'Settings & Options', desc: 'Core preferences, themes, etc.' },
                            { id: 'tabs', label: 'Saved Tabs', desc: 'Active browser profiles and tabs.' },
                            { id: 'history', label: 'Browsing History', desc: 'Proxy traversal history.' },
                            { id: 'customApps', label: 'Custom Apps', desc: 'User-defined sidebar apps.' },
                            { id: 'session', label: 'Session Storage', desc: 'Active session data.' },
                            { id: 'cookies', label: 'Cookies', desc: 'Proxy cookie payload.' },
                        ].map((item) => (
                            <div
                                key={item.id}
                                onClick={() => toggle(item.id)}
                                className={clsx("flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors", isLight ? "bg-black/[0.04] hover:bg-black/[0.08]" : "bg-[#ffffff0a] hover:bg-[#ffffff10]")}
                            >
                                <div>
                                    <div className="text-sm font-medium">{item.label}</div>
                                    <div className="text-xs opacity-60 mt-0.5">{item.desc}</div>
                                </div>
                                <div
                                    className={clsx(
                                        'w-10 h-5 rounded-full relative transition-colors duration-200',
                                        toggles[item.id] ? 'bg-[#22c55e]' : 'bg-gray-600'
                                    )}
                                >
                                    <div
                                        className={clsx(
                                            'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-200 shadow-sm',
                                            toggles[item.id] ? 'translate-x-5' : 'translate-x-0'
                                        )}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                        <button onClick={onClose} className={clsx("px-4 py-2 rounded-md text-sm", isLight ? "hover:bg-black/[0.06]" : "hover:bg-[#ffffff10]")}>Cancel</button>
                        <button onClick={handleExport} className={clsx("px-4 py-2 rounded-md text-sm flex items-center gap-2", isLight ? "bg-black/[0.08] hover:bg-black/[0.12]" : "bg-[#ffffff15] hover:bg-[#ffffff25]")}>
                            <Save size={16} /> Download Backup
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
