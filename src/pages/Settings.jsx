import clsx from 'clsx';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Nav from '../layouts/Nav';
import theme from '../styles/theming.module.css';
import { Search, HatGlasses, Palette, Globe, Database, Wrench, BadgeInfo } from 'lucide-react';
import { useOptions } from '/src/utils/optionsContext';
import RenderSetting from '../components/Settings';

let asyncConfs = [];
const baseConfigs = [
  {
    name: 'Privacy',
    icon: HatGlasses,
    keywords: ['title', 'about', 'about:blank', 'blank', 'blob', 'panic'],
    key: 'privacyConfig',
  },
  {
    name: 'Customize',
    icon: Palette,
    keywords: [
      'theme',
      'color',
      'appearance',
      'ui',
      'interface',
      'games',
      'pages',
      'apps',
      'scale',
      'nav',
      'navigation bar',
      'nav bar',
      'navbar',
      'size',
      'performance mode',
      'custom background',
      'logo color',
    ],
    key: 'customizeConfig',
  },
  {
    name: 'Browsing',
    icon: Globe,
    keywords: ['tabs', 'tab', 'type', 'search engine', 'shortcuts', 'keyboard', 'hotkeys'],
    key: 'browsingConfig',
  },
  {
    name: 'Data',
    icon: Database,
    keywords: ['data', 'backup', 'export', 'import', 'storage', 'save', 'history', 'view data', 'delete data'],
    key: 'dataConfig',
  },
  {
    name: 'Advanced',
    icon: Wrench,
    keywords: [
      'wisp',
      'type',
      'bare',
      'leave confirm',
      'debug',
      'transport',
      'routing',
      'proxy',
      'remote proxy',
      'cloud save',
      'cloud save username',
      'cloud save password',
      'reset instance',
      'experimental',
      'inspect',
      'clear cache',
    ],
    key: 'advancedConfig',
  },
  {
    name: 'Info',
    icon: BadgeInfo,
    keywords: ['credits', 'contributors', 'authors', 'about', 'license', 'open source', 'legal'],
    key: 'infoConfig',
  },
];

const Settings = () => {
  const { options, updateOption } = useOptions();
  const location = useLocation();
  const inGhostBrowserMode = new URLSearchParams(location.search).get('ghost') === '1';
  const [q, setQ] = useState('');
  const [content, setContent] = useState('Privacy');
  const [loaded, setLoaded] = useState(false);

  const consumePendingSection = useCallback(() => {
    try {
      const topWindow = window.top && window.top !== window ? window.top : window;
      const pending = typeof topWindow.__ghostNextSettingsSection === 'string'
        ? topWindow.__ghostNextSettingsSection
        : '';
      if (pending) {
        delete topWindow.__ghostNextSettingsSection;
      }
      return pending;
    } catch {
      return '';
    }
  }, []);

  useEffect(() => {
    const section = new URLSearchParams(location.search).get('section') || consumePendingSection();
    if (!section) return;

    const matched = baseConfigs.find((config) => config.name.toLowerCase() === section.toLowerCase());
    if (matched) {
      setContent(matched.name);
    }
  }, [location.search, consumePendingSection]);

  useEffect(() => {
    let m = true;
    import('/src/data/settings.js').then((mod) => {
      if (!m) return;
      asyncConfs = baseConfigs.map((c) => ({ ...c, fn: mod[c.key] }));
      setLoaded(true);
    });
    return () => {
      m = false;
    };
  }, []);

  const settings = useMemo(
    () =>
      loaded
        ? asyncConfs.map(({ fn, ...c }) => ({
          ...c,
          items: Object.values(fn({ options, updateOption })).map(({ name, desc }) => ({
            name,
            desc,
          })),
        }))
        : [],
    [options, updateOption, loaded],
  );

  const fq = q.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      !fq
        ? settings
        : settings.filter(
          ({ name, keywords, items }) =>
            name.toLowerCase().includes(fq) ||
            keywords.some((kw) => kw.toLowerCase().includes(fq)) ||
            items.some((i) => i.name.toLowerCase().includes(fq)),
        ),
    [settings, fq],
  );

  const matchCount = useMemo(
    () =>
      settings.reduce(
        (c, s) => c + s.items.filter((i) => i.name.toLowerCase().includes(fq)).length,
        0,
      ),
    [settings, fq],
  );

  const showKeywordTip =
    !!fq &&
    filtered.length > 0 &&
    !filtered.some((s) => s.name.toLowerCase().includes(fq)) &&
    filtered.some((s) => s.keywords.some((kw) => kw.toLowerCase().includes(fq)));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {!inGhostBrowserMode && (
        <div className="shrink-0">
          <Nav />
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div
          className={clsx(
            theme['settings-panelColor'],
            theme[`theme-${options.theme || 'default'}`],
            'w-20 md:w-60 shrink-0 overflow-y-auto p-2',
            inGhostBrowserMode ? 'pt-6' : 'pt-3',
          )}
        >
          <div
            className="flex items-center w-full max-w-52 h-7 rounded-lg mx-auto px-2"
            style={{ backgroundColor: options.settingsSearchBar || '#3c475a' }}
          >
            <Search className="w-4 md:mr-1.5" />
            <input
              type="text"
              placeholder="Filter settings"
              className="bg-transparent outline-none hidden md:block w-full text-sm"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {showKeywordTip && (
            <div className="mt-2 text-xs text-gray-400 text-center px-2">
              May contain what you're looking for
            </div>
          )}
          {fq && matchCount > 1 && (
            <div className="mt-2 text-xs text-gray-400 text-center px-2">
              Found {matchCount} matching settings
            </div>
          )}

          <div className="flex flex-col gap-3 mt-5">
            {filtered.map(({ name, icon: Icon, items }) => {
              const matched = fq ? items.filter((i) => i.name.toLowerCase().includes(fq)) : [];
              return (
                <div
                  key={name}
                  className={clsx(
                    'w-full flex flex-col md:rounded-xl rounded-md duration-75 cursor-pointer md:px-5 px-2 py-2',
                    content !== name && 'bg-transparent hover:bg-[#ffffff23]',
                  )}
                  style={{
                    backgroundColor:
                      content === name
                        ? options.settingsPanelItemBackgroundColor || '#405a77'
                        : undefined,
                  }}
                  onClick={() => setContent(name)}
                  title={name}
                >
                  <div className="flex items-center justify-center md:justify-start h-6">
                    <Icon className="w-5" />
                    <p className="hidden md:block mx-4">{name}</p>
                  </div>
                  {matched.length > 0 && (
                    <p className="hidden md:block ml-9 text-xs text-gray-400 truncate">
                      {matched.map((i) => i.name).join(', ')}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {loaded ? (
          <RenderSetting setting={content} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm">Loading...</div>
        )}
      </div>
    </div>
  );
};

export default Settings;
