import { memo, useState, useEffect } from 'react';
import { useOptions } from '/src/utils/optionsContext';
import { Globe, Server, ExternalLink, Network, SquareArrowOutUpRight } from 'lucide-react';

const RemoteAccess = memo(() => {
  const { options } = useOptions();
  const [hoveredCard, setHoveredCard] = useState(null);
  const [discordHovered, setDiscordHovered] = useState(false);
  const [anim, setAnim] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setAnim(true)));
  }, []);

  const pageBg = options.bgColor || '#0c131d';
  const panelBg = options.quickModalBgColor || '#121c2a';
  const textColor = options.siteTextColor || '#a0b0c8';
  const mutedTextColor = options.siteMutedTextColor || 'rgba(160, 176, 200, 0.78)';

  const openBrowserLol = () => {
    const topWin = (() => {
      try { return window.top && window.top !== window ? window.top : window; }
      catch { return window; }
    })();

    const opener = topWin.__ghostOpenBrowserTab;
    if (typeof opener === 'function') {
      opener('https://browser.lol/create');
    } else {
      window.open('https://browser.lol/create', '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="h-full w-full overflow-hidden flex flex-col p-4 md:p-6 lg:p-8" style={{ backgroundColor: pageBg, color: textColor }}>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold flex items-center gap-2.5 tracking-tight" style={{ color: '#fff' }}>
          <Network size={22} className="opacity-60" />
          Remote Access
        </h1>
        <p className="text-[13px] mt-1.5 ml-[30px]" style={{ color: mutedTextColor }}>
          Connect to virtual machines or external servers.
        </p>
      </div>

      {/* Two-Column Layout */}
      <div className={`flex-1 min-h-0 flex flex-col md:flex-row gap-5 transition-all duration-500 ease-out origin-bottom ${anim ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-[0.98]'}`}>

        {/* Left: Browser.lol Card */}
        <div
          className="w-full md:w-[300px] flex-shrink-0 rounded-xl border flex flex-col overflow-hidden cursor-pointer relative"
          style={{
            backgroundColor: panelBg,
            borderColor: hoveredCard === 'browser' ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.07)',
            boxShadow: hoveredCard === 'browser' ? '0 8px 28px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
            transform: hoveredCard === 'browser' ? 'translateY(-3px)' : 'none',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseEnter={() => setHoveredCard('browser')}
          onMouseLeave={() => setHoveredCard(null)}
          onClick={openBrowserLol}
        >
          {/* Subtle top gradient shimmer on hover */}
          <div
            className="absolute inset-0 pointer-events-none rounded-xl"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 40%)',
              opacity: hoveredCard === 'browser' ? 1 : 0,
              transition: 'opacity 0.3s ease',
            }}
          />

          <div className="p-5 flex flex-col flex-1 relative z-10">
            <div className="flex items-start justify-between mb-3">
              <h2
                className="text-lg font-semibold"
                style={{
                  color: '#fff',
                  transition: 'letter-spacing 0.25s ease',
                  letterSpacing: hoveredCard === 'browser' ? '0.01em' : '0',
                }}
              >
                Browser.lol
              </h2>
              <div
                className="p-1.5 rounded-md"
                style={{
                  backgroundColor: hoveredCard === 'browser' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                  transition: 'background-color 0.25s ease',
                }}
              >
                <Globe size={18} style={{ color: mutedTextColor }} />
              </div>
            </div>

            <p className="text-[13px] leading-relaxed mb-5" style={{ color: mutedTextColor }}>
              Free online VM's with no prior setup. Launch a disposable browser instance instantly.
            </p>

            <div
              className="mt-auto pt-4 border-t flex items-center justify-between text-[13px] font-medium"
              style={{
                borderColor: 'rgba(255,255,255,0.06)',
                color: hoveredCard === 'browser' ? '#fff' : mutedTextColor,
                transition: 'color 0.2s ease',
              }}
            >
              <span>Launch Instance</span>
              <ExternalLink
                size={14}
                style={{
                  transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: hoveredCard === 'browser' ? 'translate(2px, -2px)' : 'none',
                }}
              />
            </div>
          </div>
        </div>

        {/* Right: Coming Soon Panel */}
        <div
          className="flex-1 rounded-xl border flex flex-col overflow-hidden relative"
          style={{
            backgroundColor: panelBg,
            borderColor: 'rgba(255, 255, 255, 0.07)',
          }}
        >
          {/* Very subtle radial gradient backdrop */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 50% 80%, rgba(100, 120, 180, 0.04) 0%, transparent 65%)',
            }}
          />

          <div className="p-6 md:p-8 flex flex-col h-full relative z-10">
            {/* Top Info */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold tracking-tight mb-3" style={{ color: '#fff' }}>
                Remote Access
              </h2>
              <p className="text-[14px] leading-relaxed max-w-lg" style={{ color: mutedTextColor }}>
                Developed by Ghost. Remotely access your home PC with a reliable and fast protocol. Full encryption and near-native latency.
              </p>
            </div>

            {/* Coming Soon Center */}
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4 text-center">
                {/* Icon with subtle float animation */}
                <div
                  className="p-4 rounded-2xl"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <Server size={40} className="opacity-40" style={{ color: textColor }} strokeWidth={1.5} />
                </div>

                <h3
                  className="text-3xl md:text-4xl font-bold tracking-tight"
                  style={{
                    background: 'linear-gradient(to right, #fff, rgba(255,255,255,0.55))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Coming Soon
                </h3>

                <p className="text-[13px] max-w-sm" style={{ color: mutedTextColor }}>
                  This feature is currently under development.
                </p>

                {/* Discord CTA - tight to the description */}
                <a
                  href="https://discord.gg/UZzYt4uE6D"
                  target="_blank" rel="noreferrer"
                  onMouseEnter={() => setDiscordHovered(true)}
                  onMouseLeave={() => setDiscordHovered(false)}
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium"
                  style={{
                    color: discordHovered ? '#fff' : mutedTextColor,
                    textDecoration: discordHovered ? 'underline' : 'none',
                    textUnderlineOffset: '3px',
                    transition: 'color 0.2s ease',
                  }}
                >
                  Join the Discord to stay updated
                  <SquareArrowOutUpRight
                    size={14}
                    style={{
                      transition: 'transform 0.2s ease',
                      transform: discordHovered ? 'translate(1px, -1px)' : 'none',
                    }}
                  />
                </a>
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
