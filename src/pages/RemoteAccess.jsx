import { memo } from 'react';
import { useOptions } from '/src/utils/optionsContext';
import { ExternalLink } from 'lucide-react';

const RemoteAccess = memo(() => {
  const { options } = useOptions();

  const isLight = options.type === 'light' || options.theme === 'light' || options.themeName === 'lightTheme';
  const pageBg = options.bgColor || (isLight ? '#f0f4f8' : '#040507');
  const cardBg = isLight ? 'rgba(255,255,255,0.72)' : '#1f2228';
  const textColor = options.siteTextColor || (isLight ? '#0f172a' : '#ffffff');
  const mutedColor = isLight ? '#475569' : 'rgba(255,255,255,0.75)';

  const openBrowserLol = () => {
    const topWin = (() => {
      try { return window.top && window.top !== window ? window.top : window; }
      catch { return window; }
    })();

    const opener = topWin.__ghostOpenBrowserTab;
    if (typeof opener === 'function') {
      opener('https://browser.lol/create', { displayUrl: 'ghost://browselol' });
    } else {
      window.open('https://browser.lol/create', '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="h-full w-full overflow-auto px-4 py-8 md:py-12" style={{ backgroundColor: pageBg }}>
      <div className="min-h-full flex items-center justify-center">
        <div className="w-full max-w-3xl">
          <h1 className="text-center text-4xl md:text-5xl font-bold tracking-tight mb-10" style={{ color: textColor }}>
            Choose a Remote Access Provider
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 place-items-center">
            <button
              type="button"
              onClick={openBrowserLol}
              className="group relative w-full max-w-[330px] h-[190px] rounded-2xl overflow-hidden border transition-all duration-200 hover:-translate-y-1"
              style={{ backgroundColor: cardBg, borderColor: isLight ? 'rgba(15,23,42,0.12)' : 'rgba(255,255,255,0.12)', boxShadow: isLight ? '0 12px 26px rgba(15,23,42,0.12)' : '0 12px 26px rgba(0,0,0,0.35)' }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/8 to-transparent pointer-events-none" />
              <div className="relative h-full flex flex-col items-center justify-center px-5 text-center">
                <img
                  src="https://www.google.com/s2/favicons?sz=128&domain=browser.lol"
                  alt="Browser.lol"
                  className="w-14 h-14 mb-3"
                  loading="lazy"
                />
                <h2 className="text-xl font-semibold leading-tight" style={{ color: textColor }}>Browser.lol</h2>
                <p className="text-sm mt-2 leading-snug" style={{ color: mutedColor }}>
                  Free online VM's with no setup.
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium transition-colors" style={{ color: textColor }}>
                  Launch
                  <ExternalLink size={14} />
                </span>
              </div>
            </button>

            <div
              className="group relative w-full max-w-[330px] h-[190px] rounded-2xl overflow-hidden border transition-all duration-200"
              style={{ backgroundColor: cardBg, borderColor: isLight ? 'rgba(15,23,42,0.12)' : 'rgba(255,255,255,0.12)', boxShadow: isLight ? '0 12px 26px rgba(15,23,42,0.12)' : '0 12px 26px rgba(0,0,0,0.35)' }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/8 to-transparent pointer-events-none" />
              <div className="relative h-full flex flex-col items-center justify-center px-5 text-center">
                <img
                  src="/ghost.png"
                  alt="RayGrid"
                  className="w-14 h-14 mb-3 opacity-70"
                  loading="lazy"
                />
                <h2 className="text-xl font-semibold leading-tight" style={{ color: textColor }}>RayGrid</h2>
                <p className="text-sm mt-2 leading-snug max-w-[260px]" style={{ color: mutedColor }}>
                  Remotely access your home PC.
                </p>
                <span
                  className="mt-3 inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                  style={{ color: mutedColor, borderColor: isLight ? 'rgba(15,23,42,0.16)' : 'rgba(255,255,255,0.18)' }}
                >
                  Coming Soon
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

RemoteAccess.displayName = 'RemoteAccess';
export default RemoteAccess;
