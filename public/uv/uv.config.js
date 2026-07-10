const k = new TextEncoder().encode(btoa(new Date().toISOString().slice(0, 10) + location.host).split('').reverse().join('').slice(6.7));
self.__uv$config = {
    prefix: "/uv/service/",
    encodeUrl: s => {
        if (!s) return s;
        try {
            const d = new TextEncoder().encode(s), o = new Uint8Array(d.length);
            for (let i = 0; i < d.length; i++) o[i] = d[i] ^ k[i % 8];
            return Array.from(o, b => b.toString(16).padStart(2, "0")).join("");
        } catch { return s; }
    },
    decodeUrl: s => {
        if (!s) return s;
        try {
            const n = Math.min(s.indexOf('?') + 1 || s.length + 1, s.indexOf('#') + 1 || s.length + 1, s.indexOf('&') + 1 || s.length + 1) - 1;
            let h = 0;
            for (let i = 0; i < n && i < s.length; i++) {
                const c = s.charCodeAt(i);
                if (!((c >= 48 && c <= 57) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102))) break;
                h = i + 1;
            }
            if (h < 2 || h % 2) return decodeURIComponent(s);
            const l = h >> 1, o = new Uint8Array(l);
            for (let i = 0; i < l; i++) {
                const x = i << 1;
                o[i] = parseInt(s[x] + s[x + 1], 16) ^ k[i % 8];
            }
            return new TextDecoder().decode(o) + s.slice(h);
        } catch {
            try {
                return decodeURIComponent(s);
            } catch {
                return s;
            }
        }
    },
    handler: "/uv/uv.handler.js",
    client: "/uv/uv.client.js",
    bundle: "/uv/uv.bundle.js",
    config: "/uv/uv.config.js",
    sw: "/uv/uv.sw.js",
    inject: [
        {
            host: /.*/,
            injectTo: "head",
            html: `
            <script>
                (function() {
                    let shortcuts = ["Alt+T", "Alt+W", "Alt+Shift+T", "Alt+D", "Alt+R", "F5", "F12", "F11", "Alt+L"];
                    const postState = () => {
                        try {
                            window.top.postMessage({
                                type: 'ghost-location-change',
                                url: window.location.href,
                                title: document.title || ''
                            }, '*');
                        } catch {}
                    };
                    const postTitle = () => {
                        try {
                            window.top.postMessage({
                                type: 'ghost-title-change',
                                title: document.title || ''
                            }, '*');
                        } catch {}
                    };
                    const hookHistory = () => {
                        try {
                            const originalPushState = history.pushState.bind(history);
                            const originalReplaceState = history.replaceState.bind(history);
                            history.pushState = function (...args) {
                                const result = originalPushState(...args);
                                postState();
                                return result;
                            };
                            history.replaceState = function (...args) {
                                const result = originalReplaceState(...args);
                                postState();
                                return result;
                            };
                        } catch {}
                    };
                    const observeTitle = () => {
                        try {
                            const observer = new MutationObserver(() => postTitle());
                            const titleNode = document.querySelector('title');
                            if (titleNode) {
                                observer.observe(titleNode, { childList: true, characterData: true, subtree: true });
                            } else if (document.head) {
                                observer.observe(document.head, { childList: true, subtree: true });
                            }
                        } catch {}
                    };
                    hookHistory();
                    observeTitle();
                    window.addEventListener('popstate', postState);
                    window.addEventListener('hashchange', postState);
                    window.addEventListener('pageshow', postState);
                    postState();
                    window.addEventListener('message', (e) => {
                        if (e.data && e.data.type === 'ghost-update-shortcuts') shortcuts = e.data.shortcuts;
                    });
                    try { window.top.postMessage({ type: 'ghost-request-shortcuts' }, '*'); } catch {}
                    const stealShortcut = (e) => {
                        let key = e.key;
                        if (!key) return;
                        if (key === ' ' || key === 'Spacebar') key = 'Space';
                        if (key.length === 1) key = key.toUpperCase();
                        const out = [];
                        if (e.ctrlKey) out.push('Ctrl');
                        if (e.altKey) out.push('Alt');
                        if (e.shiftKey) out.push('Shift');
                        if (e.metaKey) out.push('Meta');
                        out.push(key);
                        const combo = out.join('+');

                        if (shortcuts.includes(combo) || combo.startsWith('F11') || combo.startsWith('F12') || combo.startsWith('F5')) {
                            e.preventDefault();
                            e.stopPropagation();
                            e.stopImmediatePropagation?.();
                            try {
                                window.top.postMessage({
                                    type: 'ghost-shortcut',
                                    key: e.key,
                                    altKey: e.altKey,
                                    ctrlKey: e.ctrlKey,
                                    shiftKey: e.shiftKey,
                                    metaKey: e.metaKey
                                }, '*');
                            } catch {}
                        }
                    };
                    window.addEventListener('keydown', stealShortcut, { capture: true });
                    document.addEventListener('keydown', stealShortcut, { capture: true });

                })();
            </script>
            `
        }
    ]
};