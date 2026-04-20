/**
 * WarpDesk - WebRTC Client
 * Lower-latency stream path: render directly to <video> instead of canvas blitting.
 */

(function () {
    'use strict';

    const DEFAULT_ICE_SERVERS = [
        { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }
    ];

    async function fetchIceServers(hostUrl, token) {
        if (!hostUrl || !token) return DEFAULT_ICE_SERVERS;
        try {
            const response = await fetch(`${hostUrl}/api/ice-servers`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
                mode: 'cors',
            });
            if (!response.ok) return DEFAULT_ICE_SERVERS;
            const data = await response.json();
            if (!data || !data.success || !Array.isArray(data.iceServers) || data.iceServers.length === 0) {
                return DEFAULT_ICE_SERVERS;
            }

            const sanitized = data.iceServers.filter((entry) => {
                if (!entry || typeof entry !== 'object') return false;
                const urls = entry.urls;
                if (Array.isArray(urls)) return urls.length > 0;
                return typeof urls === 'string' && urls.length > 0;
            });
            return sanitized.length > 0 ? sanitized : DEFAULT_ICE_SERVERS;
        } catch (_) {
            return DEFAULT_ICE_SERVERS;
        }
    }

    function parseCandidateInfo(candidateLine) {
        if (!candidateLine || typeof candidateLine !== 'string') return null;
        const parts = candidateLine.trim().split(/\s+/);
        if (parts.length < 8) return null;
        const protocol = (parts[2] || '').toLowerCase();
        const address = parts[4] || '';
        let type = 'unknown';
        for (let i = 0; i < parts.length - 1; i++) {
            if (parts[i] === 'typ') {
                type = parts[i + 1] || 'unknown';
                break;
            }
        }
        return { type, protocol, address, raw: candidateLine };
    }

    function logRemoteAnswerCandidates(sdp) {
        if (!sdp || typeof sdp !== 'string') return;
        const lines = sdp.split(/\r?\n/);
        for (const line of lines) {
            if (!line.startsWith('a=candidate:')) continue;
            const info = parseCandidateInfo(line.slice(2));
            if (!info) continue;
            console.log(`[WarpDesk][ICE][remote] type=${info.type} proto=${info.protocol} address=${info.address}`, info.raw);
        }
    }

    const remoteVideo = document.getElementById('remote-video');
    const canvas = document.getElementById('remote-canvas');
    const placeholder = document.getElementById('placeholder');

    let pc = null;
    let signalingSocket = null;
    let reconnectAttempts = 0;
    let reconnectTimer = null;
    let connectSession = 0;
    let reconnectPending = false;
    const MAX_RECONNECT = 8;

    let controlsAttached = false;
    let currentInputChannel = null;
    let currentControlChannel = null;
    let remoteStream = null;
    let audioContext = null;
    let audioSourceNode = null;
    let audioUnlockAttached = false;
    let remoteInputEnabled = true;
    const pressedKeys = new Set();
    const pressedButtons = new Set();
    let lastMouseSentAt = 0;
    const MOUSE_SEND_INTERVAL_MS = 8;
    const pointerLockBtn = document.getElementById('pointer-lock-btn');

    function getPointerLockSurface() {
        if (remoteVideo && remoteVideo.style.display !== 'none') return remoteVideo;
        if (canvas) return canvas;
        return null;
    }

    function isPointerLocked() {
        const target = getPointerLockSurface();
        return !!target && document.pointerLockElement === target;
    }

    function updatePointerLockUi() {
        if (!pointerLockBtn) return;
        const locked = isPointerLocked();
        pointerLockBtn.classList.toggle('active', locked);
        pointerLockBtn.title = locked ? 'Unlock mouse (Esc)' : 'Lock mouse for relative input';
    }

    async function togglePointerLock() {
        const target = getPointerLockSurface();
        if (!target) return;
        try {
            if (document.pointerLockElement === target) {
                document.exitPointerLock();
                return;
            }
            await target.requestPointerLock();
        } catch (err) {
            console.warn('[WarpDesk] Pointer lock request failed', err);
        }
    }

    function sendInputReset() {
        if (currentInputChannel && currentInputChannel.readyState === 'open') {
            try {
                currentInputChannel.send(JSON.stringify({ type: 'input_reset' }));
            } catch (_) { }
        }
        pressedKeys.clear();
        pressedButtons.clear();
    }

    function closePeerConnection() {
        sendInputReset();
        if (document.pointerLockElement) {
            try { document.exitPointerLock(); } catch (_) { }
        }
        updatePointerLockUi();
        if (signalingSocket) {
            try {
                signalingSocket.onopen = null;
                signalingSocket.onmessage = null;
                signalingSocket.onerror = null;
                signalingSocket.onclose = null;
                signalingSocket.close();
            } catch (_) { }
            signalingSocket = null;
        }
        if (pc) {
            try {
                pc.ontrack = null;
                pc.onconnectionstatechange = null;
                pc.oniceconnectionstatechange = null;
                pc.ondatachannel = null;
                pc.close();
            } catch (_) { }
            pc = null;
        }

        if (remoteVideo) {
            try { remoteVideo.pause(); } catch (_) { }
            remoteVideo.srcObject = null;
            remoteVideo.style.display = 'none';
        }

        remoteStream = null;
        currentInputChannel = null;
        currentControlChannel = null;
        window._sendWarpdeskInput = null;
        window._sendWarpdeskControl = null;
        window._sendOpC = null;
    }

    function resetReconnectTimer() {
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
        reconnectPending = false;
    }

    function bindAudioUnlock() {
        if (audioUnlockAttached) return;
        audioUnlockAttached = true;

        const unlock = () => {
            if (!remoteVideo) return;
            remoteVideo.muted = false;
            remoteVideo.volume = 1.0;
            remoteVideo.play().catch(() => { });
            window.removeEventListener('pointerdown', unlock, true);
            window.removeEventListener('keydown', unlock, true);
        };

        window.addEventListener('pointerdown', unlock, true);
        window.addEventListener('keydown', unlock, true);
    }

    function forceShowStreamUi() {
        if (placeholder) {
            placeholder.hidden = true;
            placeholder.style.display = 'none';
            placeholder.style.visibility = 'hidden';
        }

        document.querySelectorAll('.connecting, [class*="loading"], [class*="establish"]').forEach(el => {
            el.style.display = 'none';
            el.style.visibility = 'hidden';
        });
        const topbar = document.getElementById('topbar');
        const topOffset = document.body.classList.contains('topbar-hidden') ? 0 : ((topbar && topbar.offsetHeight) || 44);
        const videoHeight = topOffset > 0 ? `calc(100% - ${topOffset}px)` : '100%';

        if (remoteVideo) {
            remoteVideo.style.display = 'block';
            remoteVideo.style.visibility = 'visible';
            remoteVideo.style.width = '100%';
            remoteVideo.style.height = videoHeight;
            remoteVideo.style.position = 'fixed';
            remoteVideo.style.top = `${topOffset}px`;
            remoteVideo.style.left = '0';
            remoteVideo.style.zIndex = '9000';
            remoteVideo.style.objectFit = 'contain';
            remoteVideo.style.background = 'black';
        }

        if (canvas) {
            canvas.style.width = '100%';
            canvas.style.height = videoHeight;
            canvas.style.position = 'fixed';
            canvas.style.top = `${topOffset}px`;
            canvas.style.left = '0';
            canvas.style.zIndex = '9000';
            canvas.style.objectFit = 'contain';
            canvas.style.background = 'black';
        }

        window.dispatchEvent(new CustomEvent('warpdesk-stream-ready'));
    }

    window._warpdeskCloseConnection = () => {
        resetReconnectTimer();
        connectSession++;
        closePeerConnection();
    };

    window._warpdeskReconnect = () => {
        resetReconnectTimer();
        reconnectAttempts = 0;
        initWebRTC();
    };

    async function initWebRTC() {
        const sessionId = ++connectSession;
        resetReconnectTimer();
        closePeerConnection();

        const hostUrl = localStorage.getItem('warpdesk_host_url');
        const token = localStorage.getItem('warpdesk_session_token');

        if (!hostUrl || !token) {
            console.error('[WarpDesk] Missing host URL or token for WebRTC connection');
            return;
        }

        placeholder.hidden = false;
        canvas.style.display = 'none';
        if (remoteVideo) {
            remoteVideo.style.display = 'none';
            remoteVideo.autoplay = true;
            remoteVideo.playsInline = true;
            remoteVideo.muted = true;
            remoteVideo.preload = 'auto';
        }

        remoteStream = new MediaStream();
        if (remoteVideo) {
            remoteVideo.muted = true;
            remoteVideo.srcObject = remoteStream;
            remoteVideo.play().catch((e) => {
                console.warn('Autoplay blocked, waiting for user gesture:', e);
                document.addEventListener('click', () => {
                    remoteVideo.play().catch(() => { });
                }, { once: true });
            });
        }

        try {
            const iceServers = await fetchIceServers(hostUrl, token);
            pc = new RTCPeerConnection({
                iceServers,
                iceCandidatePoolSize: 10,
            });

            pc.ontrack = (event) => {
              if (sessionId !== connectSession || !pc) return;
              console.log('[WARPDESK] ontrack fired, kind=' + event.track.kind + ' state=' + event.track.readyState);
              const vid = remoteVideo || document.querySelector('video') || document.createElement('video');
              if (!remoteVideo && !document.querySelector('video')) document.body.appendChild(vid);
              if (!vid.srcObject) vid.srcObject = new MediaStream();
              vid.srcObject.addTrack(event.track);
              event.track.onunmute = () => {
                if (sessionId !== connectSession || !pc) return;
                console.log('[WARPDESK] track unmuted: ' + event.track.kind);
                                reconnectAttempts = 0;
                                resetReconnectTimer();
                vid.muted = true;
                vid.play().then(() => {
                    if (sessionId !== connectSession || !pc) return;
                    vid.muted = false;
                    if (event.track.kind === 'audio') {
                        try {
                            if (!audioContext || audioContext.state === 'closed') {
                                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                            }
                            if (audioContext.state === 'suspended') {
                                audioContext.resume().catch(() => {});
                            }
                            if (audioSourceNode) {
                                try { audioSourceNode.disconnect(); } catch (_) { }
                            }
                            const mediaStream = vid.srcObject instanceof MediaStream
                                ? vid.srcObject
                                : new MediaStream([event.track]);
                            audioSourceNode = audioContext.createMediaStreamSource(mediaStream);
                            audioSourceNode.connect(audioContext.destination);
                        } catch (audioErr) {
                            console.warn('[WARPDESK] AudioContext force path failed', audioErr);
                        }
                    }
                    console.log('[WARPDESK] video playing');
                    if (event.track.kind === 'video') {
                        forceShowStreamUi();
                    }
                }).catch(e => {
                    if (sessionId !== connectSession || !pc) return;
                    console.error('[WARPDESK] play error', e);
                    if (event.track.kind === 'video') {
                        forceShowStreamUi();
                    }
                });
              };
            };

            pc.onconnectionstatechange = () => {
                if (sessionId !== connectSession || !pc) return;
                window.dispatchEvent(new CustomEvent('warpdesk-connection-state', { detail: { state: pc.connectionState } }));
                if (pc.connectionState === 'connected') {
                    reconnectAttempts = 0;
                    resetReconnectTimer();
                    forceShowStreamUi();
                }
                // "disconnected" can be transient; reconnect only on terminal states.
                if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                    scheduleReconnect();
                }
            };

            pc.oniceconnectionstatechange = () => {
                if (sessionId !== connectSession || !pc) return;
                window.dispatchEvent(new CustomEvent('warpdesk-ice-state', { detail: { state: pc.iceConnectionState } }));
                if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
                    reconnectAttempts = 0;
                    resetReconnectTimer();
                    forceShowStreamUi();
                }
                if (pc.iceConnectionState === 'failed') {
                    scheduleReconnect();
                }
            };

            pc.addTransceiver('video', { direction: 'recvonly' });
            pc.addTransceiver('audio', { direction: 'recvonly' });

            const inputChannel = pc.createDataChannel('input', {
                ordered: false,
                maxRetransmits: 0,
            });
            const controlChannel = pc.createDataChannel('control', {
                ordered: true,
            });

            controlChannel.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    window.dispatchEvent(new CustomEvent('warpdesk-control-message', { detail: msg }));
                } catch (_) { }
            };

            setupControls(inputChannel, controlChannel);

            const parsedHost = new URL(hostUrl);
            const wsProtocol = parsedHost.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${wsProtocol}//${parsedHost.host}/ws?token=${encodeURIComponent(token)}`;
            signalingSocket = new WebSocket(wsUrl);

            signalingSocket.onmessage = async (event) => {
                if (sessionId !== connectSession || !pc) return;
                let msg;
                try {
                    msg = JSON.parse(event.data);
                } catch (_) {
                    return;
                }
                if (msg.type === 'answer' && msg.sdp) {
                    logRemoteAnswerCandidates(msg.sdp || '');
                    await pc.setRemoteDescription({ type: 'answer', sdp: msg.sdp });
                    return;
                }
                if (msg.type === 'candidate' && msg.candidate) {
                    try {
                        await pc.addIceCandidate(msg.candidate);
                    } catch (e) {
                        console.warn('[WarpDesk][ICE] failed to add remote candidate', e, msg.candidate);
                    }
                    return;
                }
                if (msg.type === 'error') {
                    console.error('[WarpDesk][WS] signaling error', msg.error || msg);
                }
            };

            signalingSocket.onerror = () => {
                if (sessionId !== connectSession) return;
                scheduleReconnect();
            };

            signalingSocket.onclose = () => {
                if (sessionId !== connectSession) return;
                scheduleReconnect();
            };

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            await new Promise((resolve, reject) => {
                if (!signalingSocket) {
                    reject(new Error('Signaling socket missing'));
                    return;
                }
                if (signalingSocket.readyState === WebSocket.OPEN) {
                    resolve();
                    return;
                }
                const timer = setTimeout(() => reject(new Error('WebSocket open timeout')), 5000);
                signalingSocket.onopen = () => {
                    clearTimeout(timer);
                    resolve();
                };
            });

            const localDesc = pc.localDescription;
            if (!localDesc) {
                throw new Error('Missing local description');
            }

            signalingSocket.send(JSON.stringify({ type: 'offer', sdp: localDesc.sdp }));

            pc.onicecandidate = (event) => {
                if (!event.candidate) return;
                const info = parseCandidateInfo(event.candidate.candidate);
                if (!info) {
                    console.log('[WarpDesk][ICE][local] candidate parse failed', event.candidate.candidate);
                } else {
                    console.log(`[WarpDesk][ICE][local] type=${info.type} proto=${info.protocol} address=${info.address}`, event.candidate.candidate);
                }

                if (!signalingSocket || signalingSocket.readyState !== WebSocket.OPEN) {
                    return;
                }
                signalingSocket.send(JSON.stringify({
                    type: 'candidate',
                    candidate: {
                        sdpMid: event.candidate.sdpMid,
                        sdpMLineIndex: event.candidate.sdpMLineIndex,
                        candidate: event.candidate.candidate,
                    },
                }));
            };
        } catch (err) {
            if (sessionId !== connectSession) return;
            console.error('[WarpDesk] WebRTC setup error', err);
            scheduleReconnect();
        }
    }

    function scheduleReconnect() {
        if (reconnectPending) return;

        if (reconnectAttempts >= MAX_RECONNECT) {
            updatePlaceholder('Connection lost. Please refresh the page.', true);
            return;
        }

        reconnectPending = true;
        reconnectAttempts++;
        const delay = Math.min(300 * Math.pow(1.6, reconnectAttempts - 1), 5000);
        updatePlaceholder(`Reconnecting... (attempt ${reconnectAttempts}/${MAX_RECONNECT})`, false);

        placeholder.hidden = false;
        if (remoteVideo) remoteVideo.style.display = 'none';
        canvas.style.display = 'none';
        closePeerConnection();

        reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            initWebRTC();
        }, delay);
    }

    function updatePlaceholder(text, isError) {
        const h2 = placeholder.querySelector('h2');
        const p = placeholder.querySelector('p');
        if (h2) h2.textContent = isError ? 'Connection Lost' : 'Connecting...';
        if (p) p.textContent = text;
    }

    function getControlSurface() {
        if (remoteVideo && remoteVideo.style.display !== 'none') {
            return remoteVideo;
        }
        return canvas;
    }

    function getNormalizedPointer(event, element) {
        const rect = element.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return null;

        const px = event.clientX - rect.left;
        const py = event.clientY - rect.top;

        const vw = remoteVideo && remoteVideo.videoWidth ? remoteVideo.videoWidth : rect.width;
        const vh = remoteVideo && remoteVideo.videoHeight ? remoteVideo.videoHeight : rect.height;

        const videoAspect = vw / vh;
        const rectAspect = rect.width / rect.height;

        let drawW = rect.width;
        let drawH = rect.height;
        let offsetX = 0;
        let offsetY = 0;

        if (videoAspect > rectAspect) {
            drawW = rect.width;
            drawH = rect.width / videoAspect;
            offsetY = (rect.height - drawH) / 2;
        } else {
            drawH = rect.height;
            drawW = rect.height * videoAspect;
            offsetX = (rect.width - drawW) / 2;
        }

        if (px < offsetX || py < offsetY || px > offsetX + drawW || py > offsetY + drawH) {
            return null;
        }

        const nx = (px - offsetX) / drawW;
        const ny = (py - offsetY) / drawH;
        return {
            x: Math.min(1, Math.max(0, nx)),
            y: Math.min(1, Math.max(0, ny)),
        };
    }

    function setupControls(inputChannel, controlChannel) {
        currentInputChannel = inputChannel;
        currentControlChannel = controlChannel;

        window._sendWarpdeskInput = (obj) => {
            if (currentInputChannel && currentInputChannel.readyState === 'open') {
                currentInputChannel.send(JSON.stringify(obj));
            }
        };

        window._sendWarpdeskControl = (obj) => {
            if (currentControlChannel && currentControlChannel.readyState === 'open') {
                currentControlChannel.send(JSON.stringify(obj));
            }
        };

        window._sendOpC = window._sendWarpdeskControl;
        window._enableWarpdeskRemoteInput = (enabled) => {
            remoteInputEnabled = !!enabled;
            if (!remoteInputEnabled) {
                sendInputReset();
            }
        };

        if (controlsAttached) {
            return;
        }
        controlsAttached = true;

        function sendEvent(obj) {
            if (!remoteInputEnabled) return;
            if (window._sendWarpdeskInput) {
                window._sendWarpdeskInput(obj);
            }
        }

        if (pointerLockBtn) {
            pointerLockBtn.addEventListener('click', (e) => {
                e.preventDefault();
                togglePointerLock();
            });
        }

        document.addEventListener('pointerlockchange', () => {
            updatePointerLockUi();
            if (!isPointerLocked()) {
                sendInputReset();
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (!remoteInputEnabled) return;
            if (!isPointerLocked()) return;
            const now = performance.now();
            if (now - lastMouseSentAt < MOUSE_SEND_INTERVAL_MS) return;
            lastMouseSentAt = now;
            const dx = Math.trunc(e.movementX || 0);
            const dy = Math.trunc(e.movementY || 0);
            if (dx === 0 && dy === 0) return;
            sendEvent({ type: 'mousemove_rel', dx, dy });
        }, { passive: true });

        const attachSurfaceEvents = (surface) => {
            if (!surface) return;

            surface.addEventListener('mousemove', (e) => {
                if (!remoteInputEnabled) return;
                if (isPointerLocked()) return;
                const now = performance.now();
                if (now - lastMouseSentAt < MOUSE_SEND_INTERVAL_MS) return;
                const p = getNormalizedPointer(e, surface);
                if (!p) return;
                lastMouseSentAt = now;
                sendEvent({ type: 'mousemove', x: p.x, y: p.y });
            });

            surface.addEventListener('mousedown', (e) => {
                if (!remoteInputEnabled) return;
                if (e.button > 2) return;
                if (e.button === 0 && !isPointerLocked()) {
                    togglePointerLock();
                }
                let btn = 'left';
                if (e.button === 1) btn = 'middle';
                if (e.button === 2) btn = 'right';
                pressedButtons.add(btn);
                sendEvent({ type: 'mousedown', button: btn });
                e.preventDefault();
            });

            surface.addEventListener('mouseup', (e) => {
                if (!remoteInputEnabled) return;
                if (e.button > 2) return;
                let btn = 'left';
                if (e.button === 1) btn = 'middle';
                if (e.button === 2) btn = 'right';
                pressedButtons.delete(btn);
                sendEvent({ type: 'mouseup', button: btn });
                e.preventDefault();
            });

            surface.addEventListener('contextmenu', e => e.preventDefault());

            surface.addEventListener('wheel', (e) => {
                if (!remoteInputEnabled) return;
                const dy = e.deltaY > 0 ? 1 : (e.deltaY < 0 ? -1 : 0);
                const dx = e.deltaX > 0 ? 1 : (e.deltaX < 0 ? -1 : 0);
                sendEvent({ type: 'mousescroll', dx, dy });
                e.preventDefault();
            }, { passive: false });
        };

        attachSurfaceEvents(canvas);
        attachSurfaceEvents(remoteVideo);

        window.addEventListener('mouseup', () => {
            if (pressedButtons.size === 0) return;
            sendInputReset();
        });

        const canSendKeys = () => {
            if (!remoteInputEnabled) return false;
            return !!(currentInputChannel && currentInputChannel.readyState === 'open');
        };

        const isTextInputFocused = () => {
            const el = document.activeElement;
            if (!el) return false;
            const tag = el.tagName ? el.tagName.toLowerCase() : '';
            if (el.isContentEditable) return true;
            return tag === 'input' || tag === 'textarea' || tag === 'select';
        };

        const forceViewerInputFocus = () => {
            const el = document.activeElement;
            if (!el) return;
            const tag = el.tagName ? el.tagName.toLowerCase() : '';
            if (tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable) {
                return;
            }
            if (typeof el.blur === 'function') {
                el.blur();
            }
        };

        [canvas, remoteVideo].forEach((surface) => {
            if (!surface) return;
            surface.addEventListener('pointerdown', () => {
                forceViewerInputFocus();
                if (window._enableWarpdeskRemoteInput) {
                    window._enableWarpdeskRemoteInput(true);
                }
            });
        });

        const releaseKey = (key) => {
            if (!pressedKeys.has(key)) return;
            pressedKeys.delete(key);
            sendEvent({ type: 'keyup', key });
        };

        window.addEventListener('keydown', (e) => {
            if (isTextInputFocused()) return;
            if (!canSendKeys()) return;
            if (e.key === 'Meta' || e.key === 'OS') return;
            e.preventDefault();
            if (e.repeat) return;
            if (pressedKeys.has(e.key)) return;
            pressedKeys.add(e.key);
            sendEvent({ type: 'keydown', key: e.key });
        }, { passive: false });

        window.addEventListener('keyup', (e) => {
            if (isTextInputFocused()) return;
            if (!canSendKeys()) return;
            if (e.key === 'Meta' || e.key === 'OS') return;
            e.preventDefault();
            releaseKey(e.key);
        }, { passive: false });

        window.addEventListener('blur', () => {
            sendInputReset();
        });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                sendInputReset();
            }
        });

        window.addEventListener('beforeunload', () => {
            sendInputReset();
        });
    }

    setTimeout(initWebRTC, 500);
    canvas.style.display = 'none';
    if (remoteVideo) remoteVideo.style.display = 'none';
    updatePointerLockUi();
})();
