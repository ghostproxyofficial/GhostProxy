import { memo } from 'react';
import { useOptions } from '/src/utils/optionsContext';
import { ExternalLink } from 'lucide-react';

const RemoteAccess = memo(() => {
  const { options } = useOptions();

  const pageBg = options.bgColor || '#040507';

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
          <h1 className="text-center text-4xl md:text-5xl font-bold tracking-tight text-white mb-10">
            Choose a Remote Access Provider
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 place-items-center">
            <button
              type="button"
              onClick={openBrowserLol}
              className="group relative w-full max-w-[330px] h-[190px] rounded-2xl bg-[#1f2228] overflow-hidden border border-white/12 shadow-[0_12px_26px_rgba(0,0,0,0.35)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(0,0,0,0.42)]"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/8 to-transparent pointer-events-none" />
              <div className="relative h-full flex flex-col items-center justify-center px-5 text-center">
                <img
                  src="https://www.google.com/s2/favicons?sz=128&domain=browser.lol"
                  alt="Browser.lol"
                  className="w-14 h-14 rounded-xl mb-3 shadow-sm"
                  loading="lazy"
                />
                <h2 className="text-white text-xl font-semibold leading-tight">Browser.lol</h2>
                <p className="text-white/75 text-sm mt-2 leading-snug">
                  Free online VM's with no setup.
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-white/80 text-sm font-medium group-hover:text-white transition-colors">
                  Launch
                  <ExternalLink size={14} />
                </span>
              </div>
            </button>

            <div className="relative w-full max-w-[330px] h-[190px] rounded-2xl bg-[#1f2228] overflow-hidden border border-white/12 shadow-[0_12px_26px_rgba(0,0,0,0.35)]">
              <img
                src="/ghost.png"
                alt="Remote Access"
                className="absolute inset-0 w-full h-full object-contain p-6 opacity-85"
                style={{ filter: 'grayscale(1) brightness(0.3)' }}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/55" />
              <div className="relative h-full flex flex-col items-center justify-center px-5 text-center">
                <h2 className="text-white text-xl font-semibold leading-tight">Remote Access</h2>
                <p className="text-white/85 text-sm mt-2 leading-snug max-w-[260px]">
                  Developed by Ghost. Remotely access your home PC with a reliable and fast protocol.
                </p>
                <span className="mt-3 inline-flex items-center rounded-full bg-black/55 border border-white/20 px-3 py-1 text-xs font-semibold tracking-wide text-white/95">
                  Coming Soon...
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
