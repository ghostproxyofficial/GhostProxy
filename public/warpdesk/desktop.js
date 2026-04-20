/**
 * WarpDesk — Desktop Session Controller
 * Validates session, manages fullscreen, settings overlay, clipboard, and terminal.
 */

(function () {
    'use strict';

    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    const topbar = document.getElementById('topbar');
    const topbarToggle = document.getElementById('topbar-toggle');
    const remoteVideo = document.getElementById('remote-video');
    const remoteCanvas = document.getElementById('remote-canvas');
    const closeTopbarBtn = document.getElementById('close-topbar-btn');
    const quitBtn = document.getElementById('quit-btn');
    const settingsPanel = document.getElementById('settings-panel');
    const settingsBtn = document.getElementById('open-settings-btn');
    const closeBtn = document.getElementById('close-settings-btn');
    const applyVideoSettingsBtn = document.getElementById('apply-video-settings');
    const videoStatus = document.getElementById('video-status');
    const clipboardStatus = document.getElementById('clipboard-status');
    const terminalStatus = document.getElementById('terminal-status');
    const terminalOutput = document.getElementById('terminal-output');
    const terminalInput = document.getElementById('terminal-input');
    const themeToggleDesktop = document.getElementById('theme-toggle-desktop');

    let topbarHidden = false;
    let requestCounter = 0;
    const pendingControlRequests = new Map();
    let terminalBusy = false;
    let streamReady = false;
    let fullscreenActive = false;

    function applyStreamViewportLayout() {
        const topbarVisible = !document.body.classList.contains('topbar-hidden');
        const topOffsetPx = topbarVisible ? ((topbar && topbar.offsetHeight) || 44) : 0;
        const heightValue = topOffsetPx > 0 ? `calc(100% - ${topOffsetPx}px)` : '100%';

        [remoteVideo, remoteCanvas].forEach((surface) => {
            if (!surface) return;
            surface.style.position = 'fixed';
            surface.style.left = '0';
            surface.style.top = `${topOffsetPx}px`;
            surface.style.width = '100%';
            surface.style.height = heightValue;
            surface.style.zIndex = '9000';
            surface.style.objectFit = 'contain';
            surface.style.background = 'black';
        });
    }

    function applyTheme(theme) {
        document.body.classList.toggle('dark', theme === 'dark');
        if (themeToggleDesktop) {
            themeToggleDesktop.checked = theme === 'dark';
        }
    }

    function refreshCursorLock() {
        document.body.classList.remove('viewer-cursor-hidden');
    }

    function setStatus(text, connected) {
        statusText.textContent = text;
        if (statusDot) {
            if (connected) {
                statusDot.classList.remove('disconnected');
            } else {
                statusDot.classList.add('disconnected');
            }
        }
    }

    function disconnect(allowNavigate) {
        setStatus('Disconnecting...', false);
        if (document.pointerLockElement) {
            try { document.exitPointerLock(); } catch (_) { }
        }
        if (window._warpdeskCloseConnection) {
            window._warpdeskCloseConnection();
        }
        localStorage.removeItem('warpdesk_session_token');
        if (allowNavigate !== false) {
            window.location.href = 'index.html';
        }
    }

    function forceShowStreamUi() {
        const placeholder = document.getElementById('placeholder');
        if (placeholder) {
            placeholder.hidden = true;
            placeholder.style.display = 'none';
            placeholder.style.visibility = 'hidden';
        }

        document.querySelectorAll('.connecting, [class*="loading"], [class*="establish"]').forEach(el => {
            el.style.display = 'none';
            el.style.visibility = 'hidden';
        });

        if (remoteVideo) {
            remoteVideo.style.display = 'block';
            remoteVideo.style.visibility = 'visible';
        }
        applyStreamViewportLayout();
    }

    function setTopbarHidden(hidden) {
        topbarHidden = hidden;
        document.body.classList.toggle('topbar-hidden', hidden);
        topbar.classList.toggle('hidden', hidden);
        topbarToggle.style.display = hidden ? 'flex' : 'none';
        topbarToggle.querySelector('.toggle-arrow').textContent = '▴';
        topbarToggle.setAttribute('aria-label', 'Show toolbar');
        topbarToggle.title = 'Show toolbar';
        applyStreamViewportLayout();
    }

    function setTabStatus(element, text, tone) {
        if (!element) return;
        element.textContent = text;
        element.style.color = tone === 'error' ? '#d32f2f' : (tone === 'success' ? '#2e7d32' : 'var(--text-secondary)');
    }

    function makeRequestId(prefix) {
        requestCounter += 1;
        return `${prefix}_${Date.now()}_${requestCounter}`;
    }

    function appendTerminalLine(text, color) {
        if (!terminalOutput) return;
        const div = document.createElement('div');
        div.textContent = text;
        if (color) div.style.color = color;
        terminalOutput.appendChild(div);

        while (terminalOutput.children.length > 300) {
            terminalOutput.removeChild(terminalOutput.firstChild);
        }

        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }

    function isControlChannelOpen() {
        return typeof window._sendWarpdeskControl === 'function';
    }

    function sendControlWithAck(payload, options) {
        const opts = Object.assign({
            timeoutMs: 3000,
            retries: 2,
        }, options || {});

        if (!isControlChannelOpen()) {
            return Promise.reject(new Error('Control channel is not ready'));
        }

        const requestId = payload.request_id || makeRequestId('req');
        payload.request_id = requestId;

        let attempts = 0;

        return new Promise((resolve, reject) => {
            const attemptSend = () => {
                attempts += 1;
                const timeout = window.setTimeout(() => {
                    if (!pendingControlRequests.has(requestId)) {
                        return;
                    }
                    if (attempts <= opts.retries) {
                        attemptSend();
                        return;
                    }
                    pendingControlRequests.delete(requestId);
                    reject(new Error('Control request timeout'));
                }, opts.timeoutMs);

                const existing = pendingControlRequests.get(requestId);
                if (existing) {
                    window.clearTimeout(existing.timeout);
                }

                pendingControlRequests.set(requestId, {
                    resolve,
                    reject,
                    timeout,
                });

                try {
                    window._sendWarpdeskControl(payload);
                } catch (err) {
                    window.clearTimeout(timeout);
                    pendingControlRequests.delete(requestId);
                    reject(err);
                }
            };

            attemptSend();
        });
    }

    window.addEventListener('warpdesk-control-message', (event) => {
        const msg = event.detail || {};
        const requestId = msg.request_id;

        if (requestId && pendingControlRequests.has(requestId) && msg.type !== 'cmd_started') {
            const pending = pendingControlRequests.get(requestId);
            window.clearTimeout(pending.timeout);
            pendingControlRequests.delete(requestId);
            pending.resolve(msg);
        }

        if (msg.type === 'clip_data') {
            const clip = document.getElementById('clipboard-text');
            if (clip) clip.value = msg.text || '';
        }

        if (msg.type === 'cmd_output') {
            const out = (msg.output || '').split(/\r?\n/);
            for (const line of out) {
                if (line.length > 0) {
                    appendTerminalLine(line, 'var(--text-secondary)');
                }
            }
            if (typeof msg.exit_code === 'number') {
                appendTerminalLine(`[exit ${msg.exit_code}]`, msg.exit_code === 0 ? '#00ffaa' : '#ff6b6b');
            }
        }

        if (msg.type === 'cmd_started') {
            setTabStatus(terminalStatus, 'Running command...', 'neutral');
        }
    });

    async function validateSession() {
        const hostUrl = localStorage.getItem('warpdesk_host_url');
        const token = localStorage.getItem('warpdesk_session_token');

        if (!hostUrl || !token) {
            setStatus('Missing session credentials', false);
            return;
        }

        try {
            const res = await fetch(`${hostUrl}/api/session`, {
                headers: { 'Authorization': `Bearer ${token}` },
                mode: 'cors'
            });
            const data = await res.json();

            if (data.valid) {
                setStatus(`Connected to ${hostUrl}`, true);
            } else {
                setStatus('Session expired', false);
                if (!streamReady) {
                    setTimeout(() => disconnect(true), 1500);
                }
            }
        } catch (err) {
            setStatus('Connection lost', false);
            console.error('[WarpDesk] Session validation failed:', err);
        }
    }

    // --- Core button events ---
    window.addEventListener('warpdesk-stream-ready', () => {
        streamReady = true;
        setStatus('', true);
        forceShowStreamUi();
    });

    window.addEventListener('warpdesk-connection-state', (event) => {
        const state = event.detail && event.detail.state;
        if (state === 'connected') {
            setStatus('WebRTC connected', true);
            forceShowStreamUi();
        }
    });

    window.addEventListener('warpdesk-ice-state', (event) => {
        const state = event.detail && event.detail.state;
        if (state === 'connected' || state === 'completed') {
            setStatus('ICE connected', true);
            forceShowStreamUi();
        }
    });

    document.getElementById('fullscreen-btn').addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.warn('[WarpDesk] Fullscreen not available:', err);
            });
            fullscreenActive = true;
            setTopbarHidden(true);
        } else {
            document.exitFullscreen();
            fullscreenActive = false;
            setTopbarHidden(false);
        }
        refreshCursorLock();
    });

    document.addEventListener('fullscreenchange', () => {
        fullscreenActive = !!document.fullscreenElement;
        if (!fullscreenActive) {
            setTopbarHidden(false);
        }
        applyStreamViewportLayout();
        refreshCursorLock();
    });

    window.addEventListener('resize', () => {
        applyStreamViewportLayout();
    });

    topbarToggle.addEventListener('click', () => {
        setTopbarHidden(false);
    });

    if (closeTopbarBtn) {
        closeTopbarBtn.addEventListener('click', () => {
            setTopbarHidden(true);
        });
    }

    if (quitBtn) {
        quitBtn.addEventListener('click', () => disconnect(true));
    }

    // --- Settings Overlay Logic ---
    function closeSettingsPanel() {
        if (document.pointerLockElement) {
            try { document.exitPointerLock(); } catch (_) { }
        }
        settingsPanel.style.display = 'none';
        settingsPanel.style.visibility = 'hidden';
        document.body.classList.remove('overlay-open');
        refreshCursorLock();
        if (window._enableWarpdeskRemoteInput) {
            window._enableWarpdeskRemoteInput(true);
        }
        if (document.activeElement && typeof document.activeElement.blur === 'function') {
            document.activeElement.blur();
        }
    }

    if (settingsBtn) settingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (document.pointerLockElement) {
            try { document.exitPointerLock(); } catch (_) { }
        }
        settingsPanel.style.display = settingsPanel.style.display === 'flex' ? 'none' : 'flex';
        settingsPanel.style.visibility = settingsPanel.style.display === 'flex' ? 'visible' : 'hidden';
        const open = settingsPanel.style.display === 'flex';
        document.body.classList.toggle('overlay-open', open);
        if (window._enableWarpdeskRemoteInput) {
            window._enableWarpdeskRemoteInput(!open);
        }
        if (open) {
            setTopbarHidden(false);
            window.setTimeout(() => {
                const activePane = document.querySelector('.tab-pane.active');
                const firstInput = activePane ? activePane.querySelector('input,select,textarea,button') : null;
                if (firstInput && typeof firstInput.focus === 'function') {
                    firstInput.focus();
                }
            }, 0);
        }
        refreshCursorLock();
        if (window._sendWarpdeskInput) {
            window._sendWarpdeskInput({ type: 'input_reset' });
        }
    });

    if (closeBtn) closeBtn.addEventListener('click', () => {
        closeSettingsPanel();
    });

    document.addEventListener('mousedown', (e) => {
        if (settingsPanel.style.display !== 'flex') return;
        if (settingsPanel.contains(e.target)) return;
        if (settingsBtn.contains(e.target)) return;
        closeSettingsPanel();
    });

    settingsPanel.addEventListener('mousedown', (e) => {
        e.stopPropagation();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && settingsPanel.style.display === 'flex') {
            closeSettingsPanel();
        }
    });

    setTopbarHidden(false);
    applyStreamViewportLayout();
    settingsPanel.style.visibility = 'hidden';
    applyTheme(localStorage.getItem('warpdesk_theme') || 'light');
    if (themeToggleDesktop) {
        themeToggleDesktop.addEventListener('change', () => {
            const theme = themeToggleDesktop.checked ? 'dark' : 'light';
            localStorage.setItem('warpdesk_theme', theme);
            applyTheme(theme);
        });
    }

    // Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });

    // --- Data Channel Dispatchers ---
    applyVideoSettingsBtn.addEventListener('click', async () => {
        const fps = parseInt(document.getElementById('setting-fps').value, 10);
        const scale = parseInt(document.getElementById('setting-scale').value, 10);
        const requestId = makeRequestId('settings');
        const hostUrl = localStorage.getItem('warpdesk_host_url');
        const token = localStorage.getItem('warpdesk_session_token');

        const oldText = applyVideoSettingsBtn.textContent;
        applyVideoSettingsBtn.disabled = true;
        applyVideoSettingsBtn.textContent = 'Applying...';

        try {
            let msg = null;
            if (hostUrl && token) {
                try {
                    const res = await fetch(`${hostUrl}/api/settings`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({ fps, scale }),
                        mode: 'cors',
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data && data.success) {
                            msg = data;
                        }
                    }
                } catch (_) {
                    // Fallback to data-channel path below.
                }
            }
            if (!msg) {
                if (!isControlChannelOpen()) {
                    throw new Error('Control channel not ready yet');
                }
                msg = await sendControlWithAck({ type: 'settings', fps, scale, request_id: requestId });
            }
            const appliedFps = msg.fps || fps;
            const appliedScale = msg.scale || scale;
            setTabStatus(videoStatus, `Applied: ${appliedFps} FPS, ${appliedScale}%`, 'success');
            applyVideoSettingsBtn.textContent = 'Applied';
            if (window._warpdeskReconnect) {
                window.setTimeout(() => {
                    window._warpdeskReconnect();
                }, 120);
            }
            window.setTimeout(() => {
                applyVideoSettingsBtn.textContent = oldText;
            }, 1200);
        } catch (err) {
            setTabStatus(videoStatus, `Failed to apply settings: ${err.message}`, 'error');
            applyVideoSettingsBtn.textContent = oldText;
        } finally {
            applyVideoSettingsBtn.disabled = false;
        }
    });

    async function syncVideoSettingsFromAgent() {
        const hostUrl = localStorage.getItem('warpdesk_host_url');
        const token = localStorage.getItem('warpdesk_session_token');

        try {
            let msg = null;
            if (hostUrl && token) {
                try {
                    const res = await fetch(`${hostUrl}/api/settings`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                        mode: 'cors',
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data && data.success) {
                            msg = data;
                        }
                    }
                } catch (_) {
                    // Fallback to data-channel path below.
                }
            }
            if (!msg) {
                if (!isControlChannelOpen()) {
                    return;
                }
                msg = await sendControlWithAck({ type: 'settings_get', request_id: makeRequestId('settings_get') });
            }
            const fpsSelect = document.getElementById('setting-fps');
            const scaleSelect = document.getElementById('setting-scale');
            if (fpsSelect && msg.fps) {
                const fpsVal = String(msg.fps);
                if (![...fpsSelect.options].some(o => o.value === fpsVal)) {
                    const opt = document.createElement('option');
                    opt.value = fpsVal;
                    opt.textContent = `${fpsVal} FPS`;
                    fpsSelect.appendChild(opt);
                }
                fpsSelect.value = fpsVal;
            }
            if (scaleSelect && msg.scale) {
                const scaleVal = String(msg.scale);
                if (![...scaleSelect.options].some(o => o.value === scaleVal)) {
                    const opt = document.createElement('option');
                    opt.value = scaleVal;
                    opt.textContent = `${scaleVal}%`;
                    scaleSelect.appendChild(opt);
                }
                scaleSelect.value = scaleVal;
            }
            setTabStatus(videoStatus, 'Loaded current agent settings', 'success');
        } catch (_) {
            // Best-effort sync; leave current defaults if agent is not ready yet.
        }
    }

    document.getElementById('btn-clip-read').addEventListener('click', async () => {
        setTabStatus(clipboardStatus, 'Reading remote clipboard...', 'neutral');
        try {
            const msg = await sendControlWithAck({ type: 'clip_read', request_id: makeRequestId('clip_read') });
            const clip = document.getElementById('clipboard-text');
            if (clip && typeof msg.text === 'string') {
                clip.value = msg.text;
            }
            setTabStatus(clipboardStatus, 'Remote clipboard loaded', 'success');
        } catch (err) {
            setTabStatus(clipboardStatus, `Read failed: ${err.message}`, 'error');
        }
    });

    document.getElementById('btn-clip-write').addEventListener('click', async () => {
        const text = document.getElementById('clipboard-text').value;
        setTabStatus(clipboardStatus, 'Writing remote clipboard...', 'neutral');
        try {
            await sendControlWithAck({ type: 'clip_write', text, request_id: makeRequestId('clip_write') });
            setTabStatus(clipboardStatus, 'Sent to remote clipboard', 'success');
        } catch (err) {
            setTabStatus(clipboardStatus, `Write failed: ${err.message}`, 'error');
        }
    });

    document.getElementById('btn-clip-local-paste').addEventListener('click', async () => {
        const clip = document.getElementById('clipboard-text');
        if (!clip || !navigator.clipboard || !navigator.clipboard.readText) {
            setTabStatus(clipboardStatus, 'Browser blocked local paste', 'error');
            return;
        }
        try {
            clip.value = await navigator.clipboard.readText();
            setTabStatus(clipboardStatus, 'Loaded local clipboard', 'success');
        } catch (_) {
            clip.focus();
            document.execCommand('paste');
            setTabStatus(clipboardStatus, clip.value ? 'Loaded local clipboard' : 'Local paste denied by browser', clip.value ? 'success' : 'error');
        }
    });

    document.getElementById('btn-clip-local-copy').addEventListener('click', async () => {
        const text = document.getElementById('clipboard-text').value;
        if (!navigator.clipboard || !navigator.clipboard.writeText) {
            setTabStatus(clipboardStatus, 'Browser blocked local copy', 'error');
            return;
        }
        try {
            await navigator.clipboard.writeText(text);
            setTabStatus(clipboardStatus, 'Copied to local clipboard', 'success');
        } catch (_) {
            const clip = document.getElementById('clipboard-text');
            clip.focus();
            clip.select();
            const ok = document.execCommand('copy');
            setTabStatus(clipboardStatus, ok ? 'Copied to local clipboard' : 'Local copy denied by browser', ok ? 'success' : 'error');
        }
    });

    async function runTerminalCommand() {
        const cmd = terminalInput.value.trim();
        if (!cmd || terminalBusy) return;
        terminalBusy = true;
        terminalInput.value = '';

        appendTerminalLine(`> ${cmd}`, 'var(--text-primary)');
        setTabStatus(terminalStatus, 'Sending command...', 'neutral');

        try {
            const msg = await sendControlWithAck(
                { type: 'cmd', command: cmd, request_id: makeRequestId('cmd') },
                { timeoutMs: 180000, retries: 0 }
            );
            if (!msg || msg.type !== 'cmd_output') {
                throw new Error('Unexpected command response');
            }
            setTabStatus(terminalStatus, 'Command finished', 'success');
        } catch (err) {
            appendTerminalLine(`[error] ${err.message}`, '#ff6b6b');
            setTabStatus(terminalStatus, `Command failed: ${err.message}`, 'error');
        } finally {
            terminalBusy = false;
        }
    }

    terminalInput.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
            e.preventDefault();
            runTerminalCommand();
        }
    });

    terminalInput.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    terminalInput.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
    });

    terminalInput.addEventListener('mousedown', (e) => {
        e.stopPropagation();
    });

    terminalInput.addEventListener('focus', () => {
        if (window._sendWarpdeskInput) {
            window._sendWarpdeskInput({ type: 'input_reset' });
        }
        if (window._enableWarpdeskRemoteInput) {
            window._enableWarpdeskRemoteInput(false);
        }
    });

    terminalInput.addEventListener('blur', () => {
        if (window._enableWarpdeskRemoteInput && settingsPanel.style.display !== 'flex') {
            window._enableWarpdeskRemoteInput(true);
        }
    });

    document.getElementById('terminal-run-btn').addEventListener('click', () => {
        runTerminalCommand();
    });

    document.getElementById('terminal-clear-btn').addEventListener('click', () => {
        terminalOutput.innerHTML = '';
        appendTerminalLine('Terminal cleared.', '#00ffaa');
    });

    // --- Boot ---
    setTabStatus(clipboardStatus, 'Idle', 'neutral');
    setTabStatus(terminalStatus, 'Idle', 'neutral');
    setTabStatus(videoStatus, 'Idle', 'neutral');
    validateSession();
    window.setTimeout(syncVideoSettingsFromAgent, 1200);
})();
