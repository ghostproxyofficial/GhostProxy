import { useNavigate } from 'react-router-dom';
import NavItem from '../components/NavItem';
import { LayoutGrid, Gamepad2, Cog } from 'lucide-react';
import { useOptions } from '/src/utils/optionsContext';
import nav from '../styles/nav.module.css';
import theme from '../styles/theming.module.css';
import clsx from 'clsx';
import Logo from '../components/Logo';
import { memo, useMemo, useCallback } from 'react';

import pkg from '../../package.json';

const version = pkg.version;
const itemSize = 16;

const navItems = [
  { name: 'Apps', id: 'btn-a', type: LayoutGrid, route: '/apps' },
  { name: 'Entertainment', id: 'btn-g', type: Gamepad2, route: '/discover' },
  { name: 'Settings', id: 'btn-s', type: Cog, route: '/settings' },
];

const Nav = memo(() => {
  const navigate = useNavigate();
  const { options } = useOptions();

  const scale = Number(options.navScale || 1);
  const dimensions = useMemo(
    () => ({
      navHeight: Math.round(69 * scale),
      logoWidth: Math.round(122 * scale),
      logoHeight: Math.round(41 * scale),
      versionFont: Math.round(10 * scale),
      versionMargin: Math.round(-10 * scale),
    }),
    [scale],
  );

  const handleLogoClick = useCallback(() => navigate('/'), [navigate]);

  const items = useMemo(
    () =>
      navItems.map((item) => ({
        ...item,
        size: itemSize,
        onClick: () => navigate(item.route),
      })),
    [navigate],
  );

  return (
    <div
      className={clsx(
        nav.nav,
        theme['nav-backgroundColor'],
        theme[`theme-${options.theme || 'default'}`],
        'ghost-glass ghost-glass-contained',
        ' w-full shadow-x1/20 flex items-center md:pl-6 pl-3 md:pr-5 pr-3 md:gap-5 gap-3 z-50',
      )}
      style={{ height: `${dimensions.navHeight}px` }}
    >
      <Logo width={dimensions.logoWidth} height={dimensions.logoHeight} action={handleLogoClick} />
      <div
        className="border rounded-full text-center hidden sm:block"
        style={{
          fontSize: `${dimensions.versionFont}px`,
          marginLeft: `${dimensions.versionMargin}px`,
          paddingLeft: '0.38rem',
          paddingRight: '0.38rem',
        }}
      >
        {isStaticBuild ? 'Static Version' : 'v' + version}
      </div>
      <div className="flex items-center md:gap-5 gap-3 ml-auto" style={{ height: 'calc(100% - 0.5rem)' }}>
        <NavItem items={items} />
      </div>
    </div>
  );
});

Nav.displayName = 'Nav';
export default Nav;
