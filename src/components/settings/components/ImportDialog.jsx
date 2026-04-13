import { useState, useEffect, useRef } from 'react';
import { X, Upload, FileJson } from 'lucide-react';
import clsx from 'clsx';
import { useOptions } from '/src/utils/optionsContext';
import { showAlert } from '/src/utils/uiDialog';

const isPlainObject = (value) => !!value && typeof value === 'object' && !Array.isArray(value);

const isValidBackupShape = (parsed) => {
    if (!isPlainObject(parsed)) return false;

    const hasLocal = Object.prototype.hasOwnProperty.call(parsed, 'localStorage');
    const hasSession = Object.prototype.hasOwnProperty.call(parsed, 'sessionStorage');
    const hasCookies = Object.prototype.hasOwnProperty.call(parsed, 'cookies');
    if (!hasLocal && !hasSession && !hasCookies) return false;

    if (hasLocal && !isPlainObject(parsed.localStorage)) return false;
    if (hasSession && !isPlainObject(parsed.sessionStorage)) return false;
    if (hasCookies && typeof parsed.cookies !== 'string') return false;

    return true;
};

export default function ImportDialog({ open, onClose }) {
    const { options } = useOptions();
    const [render, setRender] = useState(false);
    const [anim, setAnim] = useState(false);
    const fileInputRef = useRef(null);

    const [selectedFile, setSelectedFile] = useState(null);
    const [parsedData, setParsedData] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    const [toggles, setToggles] = useState({
        options: true,
        tabs: true,
        history: true,
        customApps: true,
        session: true,
        cookies: false,
    });

    useEffect(() => {
        if (open) {
            setRender(true);
            requestAnimationFrame(() => requestAnimationFrame(() => setAnim(true)));
        } else {
            setAnim(false);
            setTimeout(() => {
                setRender(false);
                setSelectedFile(null);
                setParsedData(null);
            }, 200);
        }
    }, [open]);

    const processFile = (file) => {
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(String(reader.result || '{}'));
                if (!isValidBackupShape(parsed)) {
                    throw new Error('invalid-backup-structure');
                }
                setParsedData(parsed);

                const local = parsed.localStorage || {};
                const session = parsed.sessionStorage || {};

                setToggles({
                    options: Object.prototype.hasOwnProperty.call(local, 'options') || Object.keys(local).some(k => k.startsWith('ghost') && k !== 'ghostSavedTabs' && k !== 'ghostBrowserHistory' && k !== 'ghostCustomApps'),
                    tabs: Object.prototype.hasOwnProperty.call(local, 'ghostSavedTabs'),
                    history: Object.prototype.hasOwnProperty.call(local, 'ghostBrowserHistory'),
                    customApps: Object.prototype.hasOwnProperty.call(local, 'ghostCustomApps'),
                    session: Object.keys(session).length > 0,
                    cookies: !!parsed.cookies,
                });
            } catch {
                showAlert('Invalid file. This backup format is not supported or has changed.', 'Import Error');
                setSelectedFile(null);
                setParsedData(null);
            }
        };
        reader.readAsText(file);
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    };

    const executeImport = () => {
        if (!parsedData) return;

        const local = parsedData.localStorage || {};
        const session = parsedData.sessionStorage || {};

        try {
            if (toggles.options) {
                Object.entries(local).forEach(([key, value]) => {
                    if (
                        key === 'ghostSavedTabs' ||
                        key === 'ghostBrowserHistory' ||
                        key === 'ghostCustomApps'
                    ) {
                        return;
                    }
                    localStorage.setItem(key, String(value ?? ''));
                });
            }
            if (toggles.tabs) {
                localStorage.setItem('ghostSavedTabs', String(local.ghostSavedTabs ?? ''));
            }
            if (toggles.history) {
                localStorage.setItem('ghostBrowserHistory', String(local.ghostBrowserHistory ?? ''));
            }
            if (toggles.customApps) {
                localStorage.setItem('ghostCustomApps', String(local.ghostCustomApps ?? ''));
            }

            if (toggles.session) {
                sessionStorage.clear();
                Object.entries(session).forEach(([key, value]) => {
                    sessionStorage.setItem(key, String(value ?? ''));
                });
            }

            if (toggles.cookies && parsedData.cookies) {
                const cookies = String(parsedData.cookies || '').split(';').map((c) => c.trim()).filter(Boolean);
                cookies.forEach((cookie) => {
                    document.cookie = cookie;
                });
            }

            window.dispatchEvent(new Event('ghost-options-updated'));
            showAlert('Import completed successfully.', 'Ghost Import');
            onClose();
        } catch {
            showAlert('An error occurred while importing data.', 'Import Error');
        }
    };

    const toggle = (k) => setToggles((p) => ({ ...p, [k]: !p[k] }));

    if (!render) return null;

    return (
        <div className={clsx('fixed inset-0 z-[10000] flex items-center justify-center p-4 transition-all duration-300 ease-out', anim ? 'opacity-100' : 'opacity-0')}>
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div
                className={clsx(
                    'relative w-full max-w-lg rounded-xl border border-white/10 overflow-hidden transition-all duration-300 ease-out',
                    anim ? 'scale-100 translate-y-0' : 'scale-[0.95] translate-y-4'
                )}
                style={{ backgroundColor: options.quickModalBgColor || options.menuColor || '#1a252f' }}
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <h2 className="text-lg font-semibold">Import Ghost Data</h2>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-[#ffffff12]">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {!parsedData ? (
                        <>
                            <p className="text-sm opacity-80 mb-6">Select a `.ghost` or `.json` backup file to restore your browser data.</p>

                            <div
                                className={clsx(
                                    "w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors gap-2",
                                    isDragging ? "border-[#22c55e] bg-[#22c55e]/10" : "border-white/20 hover:bg-white/5"
                                )}
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <Upload size={24} className="opacity-50" />
                                <span className="text-sm font-medium opacity-80">Click to browse files</span>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".ghost,.json,application/json"
                                onChange={handleFileChange}
                            />
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#ffffff0a] border border-white/10">
                                <FileJson size={20} className="text-[#22c55e]" />
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                                    <p className="text-xs opacity-60">Ready to restore. Select which payload fragments to import below.</p>
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
                                ].map((item) => {
                                    const hasData = (() => {
                                        const local = parsedData.localStorage || {};
                                        const session = parsedData.sessionStorage || {};

                                        if (item.id === 'options') return Object.prototype.hasOwnProperty.call(local, 'options') || Object.keys(local).some(k => k.startsWith('ghost') && k !== 'ghostSavedTabs' && k !== 'ghostBrowserHistory' && k !== 'ghostCustomApps');
                                        if (item.id === 'tabs') return Object.prototype.hasOwnProperty.call(local, 'ghostSavedTabs');
                                        if (item.id === 'history') return Object.prototype.hasOwnProperty.call(local, 'ghostBrowserHistory');
                                        if (item.id === 'customApps') return Object.prototype.hasOwnProperty.call(local, 'ghostCustomApps');
                                        if (item.id === 'session') return Object.keys(session).length > 0;
                                        if (item.id === 'cookies') return !!parsedData.cookies;
                                        return false;
                                    })();

                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => hasData && toggle(item.id)}
                                            className={clsx(
                                                "flex items-center justify-between p-3 rounded-lg transition-colors duration-200",
                                                hasData ? "bg-[#ffffff0a] hover:bg-[#ffffff10] cursor-pointer" : "bg-[#ffffff04] opacity-50 cursor-not-allowed"
                                            )}
                                        >
                                            <div>
                                                <div className="text-sm font-medium flex items-center gap-2">
                                                    {item.label}
                                                    {!hasData && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 uppercase tracking-widest opacity-80">Empty</span>}
                                                </div>
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
                                                        toggles[item.id] && hasData ? 'translate-x-5' : 'translate-x-0'
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <button onClick={() => { setSelectedFile(null); setParsedData(null); }} className="px-4 py-2 rounded-md hover:bg-[#ffffff10] text-sm">Cancel</button>
                                <button
                                    onClick={executeImport}
                                    className="px-4 py-2 rounded-md bg-[#22c55e]/20 text-[#22c55e] hover:bg-[#22c55e]/30 text-sm font-medium flex items-center gap-2 transition-colors"
                                >
                                    <Upload size={16} /> Import Selected Data
                                </button>
                            </div>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
}
