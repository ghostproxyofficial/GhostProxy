import clsx from 'clsx';
import { useOptions } from '/src/utils/optionsContext';
import { memo, useEffect, useMemo, useRef, useState } from 'react';

const BUG_REPORT_FORM_URL = 'https://forms.gle/94VwArsXReWqyWWr9';

const Logo = memo(({ options, action, width, height, showBetaBadge = true }) => {
  const { options: op } = useOptions();
  const [betaHover, setBetaHover] = useState(false);
  const closeTimerRef = useRef(null);
  const isLightTheme =
    op.type === 'light' ||
    op.theme === 'light' ||
    op.themeName === 'light';
  const logoSrc = isLightTheme ? '/ghost-text-logo-black.png' : '/ghost-text-logo-white.png';

  const style = useMemo(() => {
    const dimensions = {
      ...(width && { width }),
      ...(height && { height }),
    };
    return { ...dimensions };
  }, [width, height]);

  const className = useMemo(
    () =>
      clsx(
        options,
        action && 'cursor-pointer duration-300 ease-out scale-[1.12] hover:scale-[1.15]',
        'select-none object-contain',
      ),
    [options, action],
  );

  const logoColor = (op.logoColor || '').trim();
  const betaPopupBg = op.menuColor || op.quickModalBgColor || '#0f141d';
  const betaPopupText = op.siteTextColor || '#d9e2f2';

  const openBetaPopup = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setBetaHover(true);
  };

  const closeBetaPopupSoon = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setBetaHover(false);
      closeTimerRef.current = null;
    }, 140);
  };

  useEffect(
    () => () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    },
    [],
  );

  const betaBadge = (
    <div
      className="relative -ml-2"
      onMouseEnter={openBetaPopup}
      onMouseLeave={closeBetaPopupSoon}
    >
      {logoColor ? (
        <span className="text-xs font-bold tracking-wider uppercase px-2 py-0.5 rounded-md border border-white/20 bg-white/8 select-none" style={{ color: logoColor }}>
          Beta
        </span>
      ) : (
        <span className="text-xs font-bold tracking-wider uppercase px-2 py-0.5 rounded-md border border-white/20 bg-white/8 text-white/70 select-none">
          Beta
        </span>
      )}

      <div
        className={clsx(
          'absolute left-1/2 bottom-[calc(100%+4px)] -translate-x-1/2 w-[min(18rem,75vw)] rounded-lg border border-white/15 px-3 py-2 text-[11px] leading-relaxed shadow-2xl z-[220] transition-all duration-200',
          betaHover ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-1 pointer-events-none',
        )}
        style={{ backgroundColor: betaPopupBg, color: betaPopupText }}
        onMouseEnter={openBetaPopup}
        onMouseLeave={closeBetaPopupSoon}
      >
        <span>Ghost is in beta, expect bugs. Please report them </span>
        <a
          href={BUG_REPORT_FORM_URL}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          here
        </a>
        <span> or in the Discord.</span>
      </div>
    </div>
  );

  if (logoColor) {
    return (
      <div className="inline-flex items-center gap-0">
        <div
          className={className}
          id="btn-logo"
          onClick={action}
          style={{
            ...style,
            backgroundColor: logoColor,
            WebkitMaskImage: `url('${logoSrc}')`,
            maskImage: `url('${logoSrc}')`,
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
          }}
        />
        {showBetaBadge ? betaBadge : null}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-0">
      <img
        src={logoSrc}
        className={className}
        id="btn-logo"
        draggable="false"
        alt="logo"
        onClick={action}
        style={style}
      />
      {showBetaBadge ? betaBadge : null}
    </div>
  );
});

Logo.displayName = 'Logo';
export default Logo;
