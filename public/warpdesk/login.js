/**
 * WarpDesk — Login Handler
 */

(function () {
    'use strict';

    const form = document.getElementById('login-form');
    const hostUrlInput = document.getElementById('host-url');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    const loginBtn = document.getElementById('login-btn');
    const btnText = loginBtn.querySelector('.btn-text');
    const btnLoader = loginBtn.querySelector('.btn-loader');
    const themeToggle = document.getElementById('theme-toggle');
    const deviceListEl = document.getElementById('device-list');
    const deviceListCard = document.getElementById('device-list-card');
    const deviceAddBtn = document.getElementById('device-add-btn');
    const deviceAddIcon = document.getElementById('device-add-icon');
    const deviceEditBtn = document.getElementById('device-edit-btn');
    const deviceEditIcon = document.getElementById('device-edit-icon');
    const deviceListEditHelp = document.getElementById('device-list-edit-help');
    const customDeviceModal = document.getElementById('custom-device-modal');
    const customDeviceUrl = document.getElementById('custom-device-url');
    const customDeviceUser = document.getElementById('custom-device-user');
    const customDeviceOs = document.getElementById('custom-device-os');
    const customDeviceCancel = document.getElementById('custom-device-cancel');
    const customDeviceSave = document.getElementById('custom-device-save');
    const loginCard = document.querySelector('.login-card');
    let deviceEditMode = false;
    let dragHost = null;

    localStorage.removeItem('warpdesk_session_token');

    // Restore saved connection details
    const savedHost = localStorage.getItem('warpdesk_saved_host');
    const savedUser = localStorage.getItem('warpdesk_saved_user');
    if (savedHost) hostUrlInput.value = savedHost;
    if (savedUser) usernameInput.value = savedUser;

    function getSavedDevices() {
        try {
            const raw = localStorage.getItem('warpdesk_saved_devices');
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (_) {
            return [];
        }
    }

    function setSavedDevices(devices) {
        localStorage.setItem('warpdesk_saved_devices', JSON.stringify(devices.slice(0, 20)));
    }

    function orderedDevices(devices) {
        return [...devices].sort((a, b) => {
            const ao = Number.isFinite(a.order) ? a.order : Number.MAX_SAFE_INTEGER;
            const bo = Number.isFinite(b.order) ? b.order : Number.MAX_SAFE_INTEGER;
            if (ao !== bo) return ao - bo;
            return (b.lastSeen || 0) - (a.lastSeen || 0);
        });
    }

    function normalizeDeviceOrder() {
        const devices = orderedDevices(getSavedDevices());
        devices.forEach((d, idx) => {
            d.order = idx;
        });
        setSavedDevices(devices);
    }

    function moveDeviceOrder(fromHost, toHost) {
        const devices = orderedDevices(getSavedDevices());
        const fromIdx = devices.findIndex(d => d.host === fromHost);
        const toIdx = devices.findIndex(d => d.host === toHost);
        if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;
        const [moved] = devices.splice(fromIdx, 1);
        devices.splice(toIdx, 0, moved);
        devices.forEach((d, idx) => {
            d.order = idx;
        });
        setSavedDevices(devices);
    }

    function setDeviceEditMode(enabled) {
        deviceEditMode = !!enabled;
        if (deviceListCard) {
            deviceListCard.classList.toggle('edit-mode', deviceEditMode);
        }
        if (deviceListEditHelp) {
            deviceListEditHelp.hidden = !deviceEditMode;
        }
        if (deviceEditBtn) {
            deviceEditBtn.classList.toggle('active', deviceEditMode);
            deviceEditBtn.title = deviceEditMode ? 'Exit edit mode' : 'Edit device order';
        }
        if (deviceAddBtn) {
            deviceAddBtn.hidden = !deviceEditMode;
        }
        if (!deviceEditMode) {
            closeCustomDeviceModal();
        }
        applyEditButtonIcon();
        renderDeviceList();
    }

    function deleteSavedDevice(host) {
        const devices = getSavedDevices();
        const filtered = devices.filter(d => d.host !== host);
        setSavedDevices(filtered);
        renderDeviceList();
    }

    function inferOsType(host) {
        const s = String(host || '').toLowerCase();
        if (s.includes('mac') || s.includes('darwin') || s.includes('apple')) return 'macos';
        if (s.includes('linux') || s.includes('ubuntu') || s.includes('debian')) return 'linux';
        return 'windows';
    }

    function osIcon(osType) {
        const isDark = document.body.classList.contains('dark');
        if (osType === 'macos') {
            return isDark ? 'favicon/mac-white.png' : 'favicon/mac-black.png';
        }
        if (osType === 'linux') {
            return 'favicon/linux.png';
        }
        return 'favicon/windows.png';
    }

    function inferDeviceName(host) {
        try {
            const url = new URL(host);
            const hostname = (url.hostname || '').trim();
            return hostname || host.replace(/^https?:\/\//, '').split(':')[0];
        } catch (_) {
            return host.replace(/^https?:\/\//, '').split(':')[0] || 'unknown_device';
        }
    }

    function themedIcon(baseName, invert) {
        const isDark = document.body.classList.contains('dark');
        const useWhite = invert ? !isDark : isDark;
        return `favicon/${baseName}-${useWhite ? 'white' : 'black'}.png`;
    }

    function applyEditButtonIcon() {
        if (deviceEditIcon) {
            deviceEditIcon.src = themedIcon('construction', deviceEditMode);
        }
        if (deviceAddIcon) {
            deviceAddIcon.src = themedIcon('add', deviceEditMode);
        }
    }

    function normalizeHostUrl(hostUrl) {
        let host = String(hostUrl || '').trim();
        if (!host) return '';
        if (!host.startsWith('http://') && !host.startsWith('https://')) {
            host = `https://${host}`;
        }
        if (host.endsWith('/')) {
            host = host.slice(0, -1);
        }
        return host;
    }

    function openCustomDeviceModal() {
        if (!customDeviceModal || !customDeviceUrl || !customDeviceUser || !customDeviceOs) return;
        customDeviceModal.hidden = false;
        customDeviceUrl.value = hostUrlInput.value.trim() || '';
        customDeviceUser.value = usernameInput.value.trim() || 'admin';
        customDeviceOs.value = 'windows';
        customDeviceUrl.focus();
    }

    function closeCustomDeviceModal() {
        if (!customDeviceModal) return;
        customDeviceModal.hidden = true;
    }

    function addCustomDevice() {
        const host = normalizeHostUrl(customDeviceUrl && customDeviceUrl.value);
        const username = String(customDeviceUser && customDeviceUser.value || 'admin').trim() || 'admin';
        const os = String(customDeviceOs && customDeviceOs.value || 'windows').trim() || 'windows';

        if (!host) {
            showError('Custom device URL is required.');
            return;
        }

        saveOrUpdateDevice(host, username, inferDeviceName(host), os);
        hostUrlInput.value = host;
        usernameInput.value = username;
        hideError();
        showError('Custom device added. Enter password to connect.');
        closeCustomDeviceModal();
    }

    async function fetchDeviceInfo(host, token) {
        try {
            const response = await fetch(`${host}/api/device-info`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
                mode: 'cors',
            });
            if (!response.ok) return null;
            const data = await response.json();
            if (!data || !data.success) return null;
            return data;
        } catch (_) {
            return null;
        }
    }

    async function isHostReachable(host) {
        if (!host) return false;
        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), 1800);
        try {
            await fetch(`${host}/api/session`, {
                method: 'GET',
                mode: 'cors',
                signal: controller.signal,
            });
            return true;
        } catch (_) {
            return false;
        } finally {
            window.clearTimeout(timer);
        }
    }

    async function refreshDeviceStatuses() {
        const devices = getSavedDevices();
        if (devices.length === 0) return;

        let changed = false;
        for (const d of devices) {
            const online = await isHostReachable(d.host);
            if (!!d.online !== online) {
                d.online = online;
                changed = true;
            }
            d.statusCheckedAt = Date.now();
        }

        if (changed) {
            setSavedDevices(devices);
        }
        renderDeviceList();
    }

    function renderDeviceList() {
        if (!deviceListEl) return;
        const devices = orderedDevices(getSavedDevices());
        deviceListEl.innerHTML = '';

        if (devices.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'device-meta';
            empty.textContent = 'No saved devices yet.';
            deviceListEl.appendChild(empty);
            return;
        }

        for (const device of devices) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'device-item';
            if (deviceEditMode) {
                btn.draggable = true;
            }

            const dragHandle = document.createElement('span');
            dragHandle.className = 'device-drag-handle';
            dragHandle.textContent = '⋮⋮';

            const icon = document.createElement('span');
            icon.className = 'device-icon';
            const osType = device.os || inferOsType(device.host);
            const iconImg = document.createElement('img');
            iconImg.src = osIcon(osType);
            iconImg.alt = osType;
            icon.appendChild(iconImg);

            const main = document.createElement('span');
            main.className = 'device-main';

            const name = document.createElement('span');
            name.className = 'device-name';
            const rawName = String(device.name || '').trim();
            const looksLikeAddress = /^(https?:\/\/|\d{1,3}(?:\.\d{1,3}){3}|\[[a-f0-9:]+\]|[a-z0-9.-]+:\d{2,5})/i.test(rawName);
            const looksGeneric = /^(windows|linux|mac)\s+device$/i.test(rawName);
            name.textContent = rawName && !looksLikeAddress && !looksGeneric ? rawName : inferDeviceName(device.host || '');

            const status = document.createElement('span');
            status.className = `device-status-indicator ${device.online ? 'online' : 'offline'}`;
            status.title = device.online ? 'Online' : 'Offline';

            main.appendChild(name);
            btn.appendChild(dragHandle);
            btn.appendChild(icon);
            btn.appendChild(main);
            btn.appendChild(status);

            btn.addEventListener('click', () => {
                if (deviceEditMode) return;
                hostUrlInput.value = device.host || '';
                usernameInput.value = device.username || 'admin';
                passwordInput.value = '';
                hideError();
                showError('Selected device. Enter password to connect.');
                passwordInput.focus();
            });

            btn.addEventListener('contextmenu', (e) => {
                if (!deviceEditMode) return;
                e.preventDefault();
                const label = name.textContent || 'this device';
                if (window.confirm(`Delete saved device: ${label}?`)) {
                    deleteSavedDevice(device.host || '');
                }
            });

            btn.addEventListener('dragstart', (e) => {
                if (!deviceEditMode) {
                    e.preventDefault();
                    return;
                }
                dragHost = device.host || null;
                btn.classList.add('dragging');
                if (e.dataTransfer) {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', dragHost || '');
                }
            });

            btn.addEventListener('dragover', (e) => {
                if (!deviceEditMode || !dragHost || dragHost === (device.host || '')) return;
                e.preventDefault();
            });

            btn.addEventListener('drop', (e) => {
                if (!deviceEditMode || !dragHost) return;
                e.preventDefault();
                moveDeviceOrder(dragHost, device.host || '');
                dragHost = null;
                renderDeviceList();
            });

            btn.addEventListener('dragend', () => {
                dragHost = null;
                btn.classList.remove('dragging');
            });

            deviceListEl.appendChild(btn);
        }
    }

    function syncCardHeights() {
        if (!deviceListCard || !loginCard) return;
        deviceListCard.style.height = 'auto';
        const h = Math.max(300, loginCard.getBoundingClientRect().height);
        deviceListCard.style.height = `${Math.ceil(h)}px`;
    }

    function saveOrUpdateDevice(host, username, deviceName, deviceOs) {
        const devices = getSavedDevices();
        const os = String(deviceOs || '').trim() || inferOsType(host);
        const name = String(deviceName || '').trim() || inferDeviceName(host);
        const now = Date.now();
        const existing = devices.find(d => d.host === host);
        if (existing) {
            existing.username = username;
            existing.lastSeen = now;
            existing.name = name;
            existing.os = os;
            existing.online = typeof existing.online === 'boolean' ? existing.online : false;
            if (!Number.isFinite(existing.order)) {
                existing.order = devices.length;
            }
        } else {
            devices.unshift({
                host,
                username,
                name,
                os,
                online: false,
                lastSeen: now,
                order: 0,
            });
            for (let i = 1; i < devices.length; i++) {
                if (!Number.isFinite(devices[i].order)) {
                    devices[i].order = i;
                } else {
                    devices[i].order += 1;
                }
            }
        }
        const deduped = [];
        const seen = new Set();
        for (const d of devices) {
            if (seen.has(d.host)) continue;
            seen.add(d.host);
            deduped.push(d);
        }
        setSavedDevices(deduped);
        normalizeDeviceOrder();
        renderDeviceList();
    }

    function applyTheme(theme) {
        document.body.classList.toggle('dark', theme === 'dark');
        if (themeToggle) {
            themeToggle.checked = theme === 'dark';
        }
        applyEditButtonIcon();
    }

    const savedTheme = localStorage.getItem('warpdesk_theme') || 'light';
    applyTheme(savedTheme);
    if (themeToggle) {
        themeToggle.addEventListener('change', () => {
            const theme = themeToggle.checked ? 'dark' : 'light';
            localStorage.setItem('warpdesk_theme', theme);
            applyTheme(theme);
            renderDeviceList();
        });
    }

    normalizeDeviceOrder();
    renderDeviceList();
    syncCardHeights();
    refreshDeviceStatuses();
    window.setInterval(refreshDeviceStatuses, 30000);
    window.addEventListener('resize', syncCardHeights);

    /**
     * Show an error message with a shake animation.
     */
    function showError(message) {
        errorText.textContent = message;
        errorMessage.hidden = false;
        // Re-trigger shake animation
        errorMessage.style.animation = 'none';
        errorMessage.offsetHeight; // force reflow
        errorMessage.style.animation = '';
    }

    function hideError() {
        errorMessage.hidden = true;
    }

    function setLoading(loading) {
        loginBtn.disabled = loading;
        btnText.hidden = loading;
        btnText.textContent = loading ? '' : 'Connect';
        btnLoader.hidden = !loading;
    }

    /**
     * Handle login form submission.
     */
    async function handleLogin(e) {
        e.preventDefault();
        hideError();

        let hostUrl = hostUrlInput.value.trim();
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (!hostUrl || !username || !password) {
            showError('Please fill in all fields.');
            return;
        }

        // Ensure hostUrl doesn't end with slash
        if (hostUrl.endsWith('/')) {
            hostUrl = hostUrl.slice(0, -1);
        }

        // Auto-add https if missing (WebRTC requires HTTPS anyway)
        if (!hostUrl.startsWith('http')) {
            hostUrl = 'https://' + hostUrl;
            hostUrlInput.value = hostUrl;
        }

        setLoading(true);

        try {
            const response = await fetch(`${hostUrl}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                mode: 'cors', // Enable Cross-Origin requests
            });

            const data = await response.json();

            if (data.success && data.token) {
                // Store connection details
                localStorage.setItem('warpdesk_host_url', hostUrl);
                localStorage.setItem('warpdesk_session_token', data.token);
                localStorage.setItem('warpdesk_username', username);

                // Save for persistence across sessions
                localStorage.setItem('warpdesk_saved_host', hostUrl);
                localStorage.setItem('warpdesk_saved_user', username);
                const deviceInfo = await fetchDeviceInfo(hostUrl, data.token);
                saveOrUpdateDevice(hostUrl, username, deviceInfo && deviceInfo.device_name, deviceInfo && deviceInfo.os);

                // Redirect to desktop
                window.location.href = '/warpdesk/desktop.html';
            } else {
                showError(data.error || 'Login failed. Check your credentials.');
                passwordInput.value = '';
                passwordInput.focus();
            }
        } catch (err) {
            showError('Connection failed. Make sure the host agent is running.');
            console.error('[WarpDesk] Login error:', err);
        } finally {
            setLoading(false);
        }
    }

    form.addEventListener('submit', handleLogin);

    if (deviceEditBtn) {
        deviceEditBtn.addEventListener('click', () => {
            setDeviceEditMode(!deviceEditMode);
        });
    }

    if (deviceAddBtn) {
        deviceAddBtn.addEventListener('click', () => {
            if (!deviceEditMode) return;
            openCustomDeviceModal();
        });
    }

    if (customDeviceCancel) {
        customDeviceCancel.addEventListener('click', closeCustomDeviceModal);
    }

    if (customDeviceSave) {
        customDeviceSave.addEventListener('click', addCustomDevice);
    }

    if (customDeviceModal) {
        customDeviceModal.addEventListener('click', (e) => {
            if (e.target === customDeviceModal) {
                closeCustomDeviceModal();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && customDeviceModal && !customDeviceModal.hidden) {
            closeCustomDeviceModal();
        }
    });

    // Focus password field on load
    passwordInput.focus();
})();
