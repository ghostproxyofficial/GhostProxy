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
  const rootWindow = window.top || window;
  rootWindow.location.href = rootWindow.location.origin + '/';
};

export const ckOff = () => {
  const op = JSON.parse(localStorage.options || '{}');
  if (typeof op.tabName === 'string' && op.tabName.startsWith('v5-')) {
    op.tabName = 'Ghost';
    op.tabIcon = '/ghost-icon.ico?v=3';
    localStorage.setItem('options', JSON.stringify(op));
  }
  // fix old favicon
  if (op.tabIcon === '/favicon.ico' || (op.tabIcon && op.tabIcon.startsWith('/favicon.ico'))) {
    op.tabIcon = '/ghost-icon.ico?v=3';
    localStorage.setItem('options', JSON.stringify(op));
  }

  // sync set favicon right away so it doesnt flash
  try {
    const immediateIcon = op.tabName === 'Custom'
      ? (op.customSiteIcon || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>')
      : (op.tabIcon || '/ghost-icon.ico?v=3');
    const immediateTitle = (op.tabName === 'Custom' ? op.customSiteTitle : op.tabName) || 'Ghost';
    document.title = immediateTitle;
    let favicons = document.querySelectorAll("link[rel~='icon']");
    if (favicons.length === 0) {
      const lnk = document.createElement('link');
      lnk.rel = 'icon';
      document.head.appendChild(lnk);
      favicons = [lnk];
    }
    favicons.forEach(f => f.setAttribute('href', immediateIcon));
  } catch (_) {}

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
      let favicons = doc.querySelectorAll("link[rel~='icon']");
      if (favicons.length === 0) {
        let favicon = doc.createElement('link');
        favicon.rel = 'icon';
        doc.head.appendChild(favicon);
        favicons = [favicon];
      }
      favicons.forEach(favicon => {
        favicon.setAttribute('href', (iconsDisabled && !isGhostFavicon) ? 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>' : (icon || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>'));
      });
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

    const cloakedTitle = (t === 'Custom' ? op.customSiteTitle : t) || ogName;
    const cloakedIcon = iconsDisabled ? '' : (t === 'Custom' ? op.customSiteIcon : (i || ogIcon));

    if (op.clkOff && (cloakedTitle !== ogName || cloakedIcon !== ogIcon)) {
      const applyCloak = () => {
        const latest = JSON.parse(localStorage.options || '{}');
        const applyTitle = (latest.tabName === 'Custom' ? latest.customSiteTitle : latest.tabName) || ogName;
        const applyIcon = latest.tabName === 'Custom' ? latest.customSiteIcon : (latest.tabIcon || ogIcon);
        set(applyTitle, applyIcon);
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
    op.tabIcon = '/ghost-icon.ico?v=3';
  }
  // fix old gmail favicon
  if (op.tabIcon === '/favicon.ico' || (op.tabIcon && op.tabIcon.startsWith('/favicon.ico'))) {
    op.tabIcon = '/ghost-icon.ico?v=3';
  }
  if (!op.version) {
    localStorage.setItem('options', JSON.stringify({ ...op, version: pkg.version }));
  } else {
    localStorage.setItem('options', JSON.stringify(op));
  }
  applyBeforeUnload(!!op.beforeUnload);
  if (window.top === window.self && op.openBlob) {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Loading...</title><style>html,body{margin:0;height:100%;overflow:hidden}iframe{width:100%;height:100%;border:none}</style><link rel="icon" href="data:image/svg+xml,<svg xmlns=&quot;http://www.w3.org/2000/svg&quot;/>"></head><body><iframe src="${location.href}" allow="autoplay; fullscreen; pointer-lock; clipboard-read; clipboard-write" allowfullscreen></iframe><script>const apply=()=>{const op=JSON.parse(localStorage.getItem('options')||'{}');document.title=(op.tabName==='Custom'?op.customSiteTitle:op.tabName)||document.title;let favicons=document.querySelectorAll('link[rel~="icon"]');if(favicons.length===0){let icon=document.createElement('link');icon.rel='icon';document.head.appendChild(icon);favicons=[icon];}favicons.forEach(icon=>{icon.href=op.tabName==='Custom'?'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>':(op.tabIcon||'/ghost-icon.ico?v=3');});};apply();window.addEventListener('storage',(e)=>{if(!e||e.key==='options')apply();});setInterval(apply,200);</script></body></html>`;
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
      f.allow = 'autoplay; fullscreen; pointer-lock; clipboard-read; clipboard-write';
      f.setAttribute('allowfullscreen', '');
      Object.assign(f.style, { width: '100%', height: '100%', border: 'none' });
      Object.assign(d.body.style, { margin: 0, height: '100%' });
      d.documentElement.style.height = '100%';
      d.head.appendChild(Object.assign(document.createElement('link'), { rel: 'icon', href: '', sizes: '16x16' }));
      d.body.append(f);
      const s = d.createElement('script');
      s.textContent = `
        const d = document;
        const apply = () => {
          const op = JSON.parse(localStorage.options || '{}');
          d.title = (op.tabName === 'Custom' ? op.customSiteTitle : op.tabName) || '';
          let favicons = d.querySelectorAll("link[rel~='icon']");
          if (favicons.length === 0) {
            let icon = d.createElement('link');
            icon.rel = 'icon';
            d.head.appendChild(icon);
            favicons = [icon];
          }
          favicons.forEach(icon => {
            icon.href = op.tabName === 'Custom' ? 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>' : (op.tabIcon || '/ghost-icon.ico?v=3');
          });
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
