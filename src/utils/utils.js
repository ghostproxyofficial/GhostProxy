import pkg from '../../package.json';
import { showAlert } from './uiDialog';
let blur, focus, visibility, panicListener;
let beforeUnloadListener;

export const applyBeforeUnload = (enabled) => {
  if (beforeUnloadListener) {
    window.removeEventListener('beforeunload', beforeUnloadListener);
    beforeUnloadListener = undefined;
  }

  if (!enabled) return;

  beforeUnloadListener = (e) => {
    e.preventDefault();
    e.returnValue = '';
  };

  window.addEventListener('beforeunload', beforeUnloadListener);
};

export const resetInstance = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => registrations.forEach((reg) => reg.unregister()));
  }
  if ('caches' in window) {
    caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
  }
  localStorage.clear();
  sessionStorage.clear();
  location.href = '/';
};

export const ckOff = () => {
  const op = JSON.parse(localStorage.options || '{}');
  if (typeof op.tabName === 'string' && op.tabName.startsWith('v5-')) {
    op.tabName = 'Ghost';
    op.tabIcon = '/ghost.ico';
    localStorage.setItem('options', JSON.stringify(op));
  }
  import('./config.js').then(({ meta }) => {
    const { tabName: t, tabIcon: i } = op;
    const { tabName: ogName, tabIcon: ogIcon } = meta[0].value;
    const iconsDisabled = !!op.performanceMode;
    const isGhostFavicon = /ghost/i.test(String(i || ogIcon || ''));
    const hostWindow = (() => {
      try {
        if (window.top && window.top.location.origin === window.location.origin) {
          return window.top;
        }
      } catch { }
      return window;
    })();

    const setOnDocument = (doc, title, icon) => {
      if (!doc) return;
      doc.title = title || ogName;
      let favicon = doc.querySelector("link[rel~='icon']");
      if (!favicon) {
        favicon = doc.createElement('link');
        favicon.rel = 'icon';
        doc.head.appendChild(favicon);
      }
      favicon.setAttribute('sizes', '16x16');
      favicon.setAttribute('href', (iconsDisabled && !isGhostFavicon) ? '' : (icon || ogIcon));
    };

    const set = (title, icon) => {
      setOnDocument(hostWindow.document, title, icon);
      if (hostWindow !== window) {
        setOnDocument(document, title, icon);
      }
    };

    blur && hostWindow.removeEventListener('blur', blur);
    focus && hostWindow.removeEventListener('focus', focus);
    visibility && hostWindow.document?.removeEventListener('visibilitychange', visibility);

    const cloakedTitle = t || ogName;
    const cloakedIcon = iconsDisabled ? '' : (i || ogIcon);

    if (op.clkOff && (cloakedTitle !== ogName || cloakedIcon !== ogIcon)) {
      const applyCloak = () => {
        const latest = JSON.parse(localStorage.options || '{}');
        set(latest.tabName || ogName, latest.tabIcon || ogIcon);
      };
      const applyOriginal = () => set(ogName, ogIcon);

      blur = () => applyCloak();
      focus = () => applyOriginal();
      visibility = () => {
        if (hostWindow.document?.hidden) {
          applyCloak();
          return;
        }
        applyOriginal();
      };

      hostWindow.addEventListener('blur', blur);
      hostWindow.addEventListener('focus', focus);
      hostWindow.document?.addEventListener('visibilitychange', visibility);

      if (hostWindow.document?.hidden) {
        applyCloak();
      } else if (hostWindow.document?.hasFocus?.()) {
        applyOriginal();
      } else {
        applyCloak();
      }
      return;
    }

    set(cloakedTitle, cloakedIcon);
    blur = focus = visibility = null;
  });
};

export const panic = () => {
  const op = JSON.parse(localStorage.options || '{}');
  const panicConfig = op.panic;
  if (panicListener) {
    window.removeEventListener('keydown', panicListener);
    panicListener = null;
  }
  if (panicConfig?.key && panicConfig?.url && !!op.panicToggleEnabled) {
    panicListener = (e) => {
      const combo = [];
      if (e.ctrlKey) combo.push('Ctrl');
      if (e.altKey) combo.push('Alt');
      if (e.shiftKey) combo.push('Shift');
      if (e.metaKey) combo.push('Meta');
      combo.push(e.key.length === 1 ? e.key.toUpperCase() : e.key);

      const pressed = combo.join('+');
      if (pressed === panicConfig.key) {
        e.preventDefault();
        window.location.replace(panicConfig.url);
      }
    };

    window.addEventListener('keydown', panicListener);
  }
};

export const check = (() => {
  const op = JSON.parse(localStorage.options || '{}');
  if (typeof op.tabName === 'string' && op.tabName.startsWith('v5-')) {
    op.tabName = 'Ghost';
    op.tabIcon = '/ghost.ico';
  }
  if (!op.version) {
    localStorage.setItem('options', JSON.stringify({ ...op, version: pkg.version }));
  } else {
    localStorage.setItem('options', JSON.stringify(op));
  }
  applyBeforeUnload(!!op.beforeUnload);
  if (window.top === window.self && op.openBlob) {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Loading...</title><style>html,body{margin:0;height:100%;overflow:hidden}iframe{width:100%;height:100%;border:none}</style><link rel="icon" sizes="16x16" href=""></head><body><iframe src="${location.href}"></iframe><script>const apply=()=>{const op=JSON.parse(localStorage.getItem('options')||'{}');document.title=op.tabName||document.title;let icon=document.querySelector('link[rel~="icon"]');if(!icon){icon=document.createElement('link');icon.rel='icon';document.head.appendChild(icon);}icon.setAttribute('sizes','16x16');icon.href=op.tabIcon||'';};apply();window.addEventListener('storage',(e)=>{if(!e||e.key==='options')apply();});setInterval(apply,200);</script></body></html>`;
    const blobUrl = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    const w = open(blobUrl, '_blank');
    if (!w || w.closed) {
      showAlert('Please enable popups to continue.', 'Popup Blocked');
      location.href = 'https://google.com';
    } else {
      location.href = 'https://google.com';
    }
    history.replaceState(null, '', '/');
  }
  if (window.top === window.self && op.aboutBlank) {
    const w = open('about:blank');
    if (!w || w.closed) {
      showAlert('Please enable popups to continue.', 'Popup Blocked');
      location.href = 'https://google.com';
    } else {
      const win = w.window,
        d = win.document,
        f = d.createElement('iframe');

      Object.assign(f, { src: location.href });
      Object.assign(f.style, { width: '100%', height: '100%', border: 'none' });
      Object.assign(d.body.style, { margin: 0, height: '100%' });
      d.documentElement.style.height = '100%';
      d.head.appendChild(Object.assign(document.createElement('link'), { rel: 'icon', href: '', sizes: '16x16' }));
      d.body.append(f);
      const s = d.createElement('script');
      s.textContent = `
        const d = document;
        const apply = () => {
          const op = JSON.parse(localStorage.getItem('options') || '{}');
          d.title = op.tabName || '';
          let icon = d.querySelector("link[rel~='icon']");
          if (!icon) {
            icon = d.createElement('link');
            icon.rel = 'icon';
            d.head.appendChild(icon);
          }
          icon.setAttribute('sizes', '16x16');
          icon.href = op.tabIcon || '';
        };
        apply();
        window.addEventListener('storage', (e) => {
          if (!e || e.key === 'options') apply();
        });
        setInterval(apply, 200);
      `;
      d.head.appendChild(s);
      location.href = 'https://google.com';
    }
    history.replaceState(null, '', '/');
  }

  ckOff();
  panic();
})();