import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import clsx from 'clsx';
import theme from '/src/styles/theming.module.css';
import { useOptions } from '/src/utils/optionsContext';
import SettingsContainerItem from './settings/components/ContainerItem';
import SidebarEditor from './settings/components/SidebarEditor';
import * as settings from '/src/data/settings';
import PanicDialog from './PanicDialog';
import ShortcutsDialog from './settings/components/ShortcutsDialog';
import ExportDialog from './settings/components/ExportDialog';
import ImportDialog from './settings/components/ImportDialog';
import {
  ChevronDown,
  ChevronUp,
  Code2,
  Github,
  Heart,
  Library,
  MessagesSquare,
  Scale,
  ShieldAlert,
  Users,
  X,
} from 'lucide-react';
import { showAlert, showConfirm } from '/src/utils/uiDialog';
import { createId } from '/src/utils/id';
import { themeConfig as siteThemeConfig } from '/src/utils/config';
import pkg from '../../package.json';
import { useLocation, useNavigate } from 'react-router-dom';

const BUG_REPORT_FORM_URL = 'https://forms.gle/94VwArsXReWqyWWr9';
const LIGHT_MODE_AVAILABLE = false;
const selectableThemePresets = siteThemeConfig.filter((entry) => entry.option !== 'Light');

const Type = ({ type, title }) => {
  const { options, updateOption } = useOptions();
  const settingsItems = type({ options, updateOption });
  const entries = Object.entries(settingsItems).filter(([, setting]) => !setting.hidden);

  const valueToken = (value) => {
    if (value == null) return 'none';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    try {
      return JSON.stringify(value);
    } catch {
      return 'obj';
    }
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-medium mb-3 px-1">{title}</h2>
      <div className="rounded-xl overflow-visible">
        {entries.map(([key, setting], index) => (
          <SettingsContainerItem
            key={`${key}-${valueToken(setting?.value)}`}
            {...setting}
            isFirst={index === 0}
            isLast={index === entries.length - 1}
          >
            {setting.desc}
          </SettingsContainerItem>
        ))}
      </div>
    </div>
  );
};

const InfoPanel = () => {
  const { options } = useOptions();
  const sections = Object.values(settings.infoConfig());
  const [open, setOpen] = useState('Project Credits');
  const runtimeLibraries = useMemo(() => Object.keys(pkg.dependencies || {}).sort(), []);
  const devLibraries = useMemo(() => Object.keys(pkg.devDependencies || {}).sort(), []);

  const contentMap = {
    'Project Credits': (
      <div className="space-y-4 text-sm">
        <div>
          <p className="font-semibold mb-1">Core Team</p>
          <ul className="space-y-1 opacity-90">
            <li>- ghostproxyofficial (Lead Developer)</li>
          </ul>
        </div>

        <div>
          <p className="font-semibold mb-1">Backend / Features</p>
          <ul className="space-y-1 opacity-90">
            <li>- MercuryWorkshop/wisp-server-node</li>
            <li>- MercuryWorkshop/scramjet</li>
            <li>- titaniumnetwork-dev/Ultraviolet</li>
            <li>- lucide-icons/lucide</li>
            <li>- pmndrs/zustand</li>
            <li>- Stuk/jszip</li>
            <li>- remarkjs/react-markdown</li>
            <li>- remarkjs/remark-gfm</li>
            <li>- movement.css</li>
            <li>- React ecosystem (React, React Router, Vite, HeadlessUI)</li>
          </ul>
        </div>

        <div>
          <p className="font-semibold mb-1">Libraries</p>
          <div className="rounded-lg border border-white/10 bg-black/20 p-3">
            <p className="text-xs uppercase tracking-wide opacity-70 mb-2">Runtime</p>
            <p className="text-xs leading-relaxed opacity-90">{runtimeLibraries.join(', ')}</p>
            <p className="text-xs uppercase tracking-wide opacity-70 mt-3 mb-2">Development</p>
            <p className="text-xs leading-relaxed opacity-90">{devLibraries.join(', ')}</p>
          </div>
        </div>

        <div>
          <p className="font-semibold mb-1">Thank you to</p>
          <ul className="space-y-1 opacity-90">
            <li>- Creator of DogeUB (Ghost is a fork of his unblocker)</li>
            <li>- Creator of Vapor v4 (took some game sources from Vapor)</li>
            <li>- Creator of DayDreamX (heavily inspired by DayDreamX)</li>
            <li>
              - Ghost Icon attribution:{' '}
              <span
                title="nightmare icons"
                className="underline underline-offset-2"
              >
                Nightmare icons created by JessHG - Flaticon
              </span>
            </li>
          </ul>
        </div>
      </div>
    ),
    'Open Source Licenses': (
      <div className="space-y-3 text-sm opacity-90">
        <p>
          Ghost uses open-source packages under their respective licenses. License terms come from each
          upstream repository/package and should be reviewed there for exact legal text.
        </p>
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <p className="font-semibold mb-2">Primary upstream projects</p>
          <ul className="space-y-1 text-sm">
            <li>- MercuryWorkshop/scramjet</li>
            <li>- MercuryWorkshop/wisp-server-node</li>
            <li>- MercuryWorkshop/epoxy-transport</li>
            <li>- MercuryWorkshop/libcurl-transport</li>
            <li>- titaniumnetwork-dev/Ultraviolet</li>
            <li>- PMNDRS/zustand</li>
            <li>- lucide-icons/lucide</li>
            <li>- remarkjs/react-markdown</li>
            <li>- remarkjs/remark-gfm</li>
            <li>- remarkjs/remark-math & rehypejs/rehype-katex</li>
            <li>- Headless UI, MUI, JSZip</li>
            <li>- React, Vite, Tailwind ecosystem packages</li>
          </ul>
        </div>
        <p>
          For complete dependency attribution, see package metadata in the project and each package repository.
        </p>
      </div>
    ),
    Legal: (
      <div className="space-y-3 text-sm opacity-90">
        <p>
          We are not a legal entity or corporation. This was a tool made from open-sourced components by someone
          in their free time. We do not want to profit from you or deceive you. All code is available in our
          GitHub (ghostproxyofficial/GhostProxy) and auditable.
        </p>
        <p>
          Because of this, we do not have a formal Terms of Service, Privacy Policy, etc. It’s as simple as this:
        </p>
        <ul className="space-y-1">
          <li>- We advise you not to use our platform for illegal or bad intentions.</li>
          <li>- Anything you do on our platform is your responsibility, and you take full accountability for your actions.</li>
          <li>- If you are forking our project, you MUST agree and follow the terms of our license (AGPL-3.0 license), and you MAY NOT fork our project for bad intent.</li>
          <li>- We do not store any data on our servers. All data is local and can easily be deleted through settings.</li>
        </ul>
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <p className="font-semibold mb-2">DMCA</p>
          <p>
            This website respects intellectual property rights and follows the DMCA and other copyright laws.
            Media and game assets available through this project are sourced from public third-party platforms.
          </p>
          <p className="mt-2">
            If you found content that should be removed, email ghostproxyofficial@gmail.com and include the following details:
          </p>
          <ul className="space-y-1 mt-2">
            <li>- Whether you own the content.</li>
            <li>- Whether the content is copyrighted or licensed.</li>
            <li>- The exact name of the content.</li>
            <li>- Where the content appears (direct URLs).</li>
            <li>- Whether you are authorized to act for the rights holder.</li>
            <li>- Contact details such as email and/or phone number.</li>
          </ul>
          <p className="mt-2">
            DMCA requests are reviewed seriously, and we make a strong effort to respond and resolve disputes quickly.
            Fraudulent or joke takedown requests may be ignored and blocked.
          </p>
        </div>
      </div>
    ),
    'Code and Contact': (
      <div className="space-y-3 text-sm opacity-90">
        <p>All code is on GitHub.</p>
        <p>Like any Open Source Software, there is a risk you may be using a hacked version of Ghost. We reccomend you only put private information on links provided by Ghost, a source you trust, or yourself.</p>
        <p>Contact me on Discord (username: ghostproxyofficial)</p>
        <div className="rounded-lg border border-white/10 bg-black/20 p-3 relative overflow-hidden">
          <p className="font-semibold mb-2">Repositories</p>
          <ul className="space-y-1">
            <li>- Frontend (website): ghostproxyofficial/GhostProxy</li>
            <li className="line-through opacity-70">- WispServer (setting up your own proxy server): ghostproxyofficial/WispServer</li>
            <li className="line-through opacity-70">- Ghost Remote Access (accessing your home PC remotely): ghostproxyofficial/RemoteAccess</li>
            <li className="line-through opacity-70">- Cloud Saving (save data online): ghostproxyofficial/CloudSaving</li>
          </ul>
        </div>
      </div>
    ),
  };

  const iconMap = {
    'Project Credits': Users,
    'Open Source Licenses': Library,
    Legal: Scale,
    'Code and Contact': Code2,
  };

  return (
    <div className="mb-8">
      <div className="mb-3 px-1 flex items-center justify-between">
        <h2 className="text-xl font-medium">Info</h2>
        <button
          type="button"
          className="h-8 px-3 rounded-md border border-white/15 hover:bg-white/10 text-xs inline-flex items-center"
          onClick={() => window.open(BUG_REPORT_FORM_URL, '_blank', 'noopener,noreferrer')}
        >
          Report a Bug
        </button>
      </div>
      <div
        className="rounded-xl overflow-hidden border border-white/10"
        style={{ backgroundColor: options.settingsContainerColor || options.quickModalBgColor || options.menuColor || '#1a252f' }}
      >
        {sections.map((section) => {
          const isOpen = open === section.name;
          const Icon = iconMap[section.name] || ShieldAlert;
          return (
            <div key={section.name} className="border-b border-white/10 last:border-b-0">
              <button
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#ffffff10]"
                onClick={() => setOpen((prev) => (prev === section.name ? '' : section.name))}
              >
                <span className={clsx('text-sm font-medium flex items-center gap-2', isOpen && 'opacity-100')}>
                  <Icon size={15} /> {section.name}
                </span>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {isOpen && (
                <div
                  className="px-4 pt-3 pb-4 border-t border-white/10"
                  style={{ backgroundColor: options.settingsDropdownColor || options.quickModalBgColor || options.menuColor || '#0f141c' }}
                >
                  {contentMap[section.name] || (
                    <div className="text-sm opacity-80 py-3 flex items-center gap-2">
                      <Heart size={15} /> Content coming soon.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-xs opacity-70 flex items-center gap-2">
        <Github size={13} /> This project is open-source and community-built.
        <MessagesSquare size={13} /> Reach out on Discord for support.
      </div>
    </div>
  );
};

// ─── Custom Theme helpers (module-level, no re-creation) ──────────────────────

const hsvToRgb = (h, s, v) => {
  s /= 100; v /= 100;
  const f = (n) => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
  return [Math.round(f(5) * 255), Math.round(f(3) * 255), Math.round(f(1) * 255)];
};

const hsvToHex = (h, s, v) => {
  const [r, g, b] = hsvToRgb(h, s, v);
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
};

const cl = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const hsl = (h, s, l) => `hsl(${Math.round(h)}, ${Math.round(cl(s, 0, 100))}%, ${Math.round(cl(l, 0, 100))}%)`;
const hsla = (h, s, l, a) => `hsla(${Math.round(h)}, ${Math.round(cl(s, 0, 100))}%, ${Math.round(cl(l, 0, 100))}%, ${a})`;

const generateCustomTheme = (h, s, v, mode) => {
  const isDark = mode === 'dark';
  // Derive rough HSL lightness for accent
  const sv = s / 100, vv = v / 100;
  const lAcc = vv * (1 - sv / 2) * 100;
  const [rA, gA, bA] = hsvToRgb(h, s, v);
  const designRgb = `${rA}, ${gA}, ${bA}`;

  if (isDark) {
    const bgS = cl(Math.round(s * 0.35), 2, 18);
    const fgS = cl(Math.round(s * 0.28), 4, 22);
    const accentFg = hsl(h, cl(s * 0.75, 20, 80), cl(lAcc + 15, 68, 93));
    const accentEnabled = hsl(h, cl(s, 30, 70), cl(lAcc * 0.4 + 20, 24, 45));
    const siteText = hsl(h, fgS, 80);
    const p = { // palette shorthand
      bg5: hsl(h, bgS, 5),   bg8: hsl(h, bgS + 2, 8),  bg10: hsl(h, bgS + 2, 10),
      bg12: hsl(h, bgS + 3, 12), bg14: hsl(h, bgS + 3, 14), bg18: hsl(h, bgS + 4, 18),
      border: hsl(h, fgS, 22), muted: hsl(h, fgS - 5, 58),
    };
    const navBg = hsla(h, bgS + 2, 8, 0.72);
    const themeCss = `:root {\n` +
      `  --nav-bg: ${navBg};\n  --nav-border: ${hsl(h, fgS, 20)};\n` +
      `  --search-border: ${hsl(h, fgS, 22)};\n  --search-bg: ${p.bg10};\n` +
      `  --search-ph: ${p.muted};\n  --search-color: ${accentFg};\n` +
      `  --settings-panel: ${p.bg8};\n  --settings-content: ${hsl(h, bgS, 6)};\n` +
      `  --settings-border: ${hsl(h, fgS, 22)};\n  --apps-bg: ${p.bg10};\n` +
      `  --apps-border: ${hsl(h, fgS, 22)};\n  --apps-text: ${accentFg};\n` +
      `  --apps-ph: ${p.muted};\n  --item-bg: ${p.bg12};\n` +
      `  --item-border: ${hsl(h, fgS, 22)};\n` +
      `  --result-hover: ${hsla(h, s, 70, 0.12)};\n}`;
    return {
      theme: 'custom', type: 'dark', themeName: 'customTheme',
      bgColor: p.bg5, siteTextColor: siteText,
      settingsContainerColor: p.bg14, navItemActive: accentFg,
      settingsSearchBar: p.bg14, settingsPanelItemBackgroundColor: p.bg18,
      settingsDropdownColor: p.bg8, bgDesignColor: designRgb, glowWrapperColor: designRgb,
      switchColor: p.bg14, switchEnabledColor: accentEnabled,
      quickModalBgColor: p.bg12, paginationTextColor: p.muted,
      paginationBorderColor: 'rgba(255,255,255,0.11)', paginationBgColor: p.bg10,
      paginationSelectedColor: accentEnabled,
      tabColor: hsla(h, bgS + 3, 10, 0.70), tabOutline: hsl(h, fgS - 2, 20),
      barColor: hsl(h, bgS + 2, 7), tabBarColor: hsl(h, bgS, 5),
      omninputColor: hsla(h, bgS + 2, 8, 0.56), menuColor: p.bg10,
      customThemeCss: themeCss,
    };
  } else {
    const bgS = cl(Math.round(s * 0.12), 1, 8);
    const fgS = cl(Math.round(s * 0.18), 2, 16);
    const accentColor = hsl(h, cl(s, 40, 80), cl(lAcc * 0.5, 25, 55));
    const siteText = hsl(h, fgS + 5, 12);
    const p = {
      bg97: hsl(h, bgS + 2, 97), bg95: hsl(h, bgS, 95),
      bg93: hsl(h, bgS + 2, 93), bg90: hsl(h, bgS + 4, 90),
      bg85: hsl(h, bgS + 5, 85), bg78: hsl(h, fgS + 5, 78),
      border: hsl(h, fgS + 8, 82), ph: hsl(h, fgS + 5, 44),
    };
    const navBg = hsla(h, bgS + 1, 99, 0.92);
    const themeCss = `:root {\n` +
      `  --nav-bg: ${navBg};\n  --nav-border: ${p.border};\n` +
      `  --search-border: ${p.border};\n  --search-bg: ${p.bg97};\n` +
      `  --search-ph: ${p.ph};\n  --search-color: ${siteText};\n` +
      `  --settings-panel: ${hsl(h, bgS + 3, 94)};\n  --settings-content: ${p.bg97};\n` +
      `  --settings-border: ${p.border};\n  --apps-bg: ${hsl(h, bgS + 3, 95)};\n` +
      `  --apps-border: ${p.border};\n  --apps-text: ${siteText};\n` +
      `  --apps-ph: ${p.ph};\n  --item-bg: ${p.bg97};\n` +
      `  --item-border: ${p.border};\n` +
      `  --result-hover: ${hsla(h, s, 40, 0.08)};\n}`;
    return {
      theme: 'custom', type: 'light', themeName: 'customTheme',
      bgColor: p.bg95, siteTextColor: siteText,
      settingsContainerColor: p.bg85, navItemActive: siteText,
      settingsSearchBar: p.bg85, settingsPanelItemBackgroundColor: p.bg78,
      settingsDropdownColor: hsl(h, bgS + 2, 95), bgDesignColor: designRgb, glowWrapperColor: designRgb,
      switchColor: p.bg85, switchEnabledColor: accentColor,
      quickModalBgColor: p.bg97, paginationTextColor: p.ph,
      paginationBorderColor: 'rgba(0,0,0,0.11)', paginationBgColor: p.bg90,
      paginationSelectedColor: accentColor,
      tabColor: hsla(h, bgS + 1, 99, 0.82), tabOutline: p.border,
      barColor: p.bg93, tabBarColor: hsl(h, bgS + 2, 90),
      omninputColor: hsla(h, bgS + 1, 99, 0.56), menuColor: p.bg97,
      customThemeCss: themeCss,
    };
  }
};

// ──────────────────────────────────────────────────────────────────────────────

const Setting = ({ setting }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { options, updateOption } = useOptions();
  const [panicOpen, setPanicOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRender, setHistoryRender] = useState(false);
  const [historyAnim, setHistoryAnim] = useState(false);
  const [historyQuery, setHistoryQuery] = useState('');
  const [dataOpen, setDataOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [cssEditorOpen, setCssEditorOpen] = useState(false);
  const [cssEditorRender, setCssEditorRender] = useState(false);
  const [cssEditorAnim, setCssEditorAnim] = useState(false);
  const [sidebarEditorOpen, setSidebarEditorOpen] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [newPresetName, setNewPresetName] = useState('');
  const [cssDraft, setCssDraft] = useState('');
  const [textColorDraft, setTextColorDraft] = useState('#a0b0c8');
  const [bgColorDraft, setBgColorDraft] = useState('#111827');
  const [logoColorDraft, setLogoColorDraft] = useState('#ffffff');
  const [fontFamilyDraft, setFontFamilyDraft] = useState('');
  const [paddingDraft, setPaddingDraft] = useState('');
  const [radiusDraft, setRadiusDraft] = useState('');

  // Custom Theme picker state
  const [customThemeOpen, setCustomThemeOpen] = useState(false);
  const [customThemeRender, setCustomThemeRender] = useState(false);
  const [customThemeAnim, setCustomThemeAnim] = useState(false);
  const [pickerHue, setPickerHue] = useState(220);
  const [pickerSat, setPickerSat] = useState(65);
  const [pickerVal, setPickerVal] = useState(72);
  const [pickerMode, setPickerMode] = useState('dark');
  const [draggingSV, setDraggingSV] = useState(false);
  const [draggingHue, setDraggingHue] = useState(false);
  const svPickerRef = useRef(null);
  const hueStripRef = useRef(null);

  const cssPresets = useMemo(
    () => (Array.isArray(options.cssEditorPresets) ? options.cssEditorPresets : []),
    [options.cssEditorPresets],
  );

  const activePreset = useMemo(
    () => cssPresets.find((p) => p.id === selectedPresetId) || null,
    [cssPresets, selectedPresetId],
  );

  useEffect(() => {
    if (!cssEditorOpen) return;

    const fallbackPresetId = options.activeCssPresetId || cssPresets[0]?.id || '';
    setSelectedPresetId(fallbackPresetId);

    if (fallbackPresetId) {
      const preset = cssPresets.find((p) => p.id === fallbackPresetId);
      if (preset) {
        setCssDraft(preset.css || '');
        setTextColorDraft(preset.siteTextColor || options.siteTextColor || '#a0b0c8');
        setBgColorDraft(preset.bgColor || options.bgColor || '#111827');
        setLogoColorDraft(preset.logoColor || options.logoColor || '#ffffff');
        return;
      }
    }

    setCssDraft(options.customGlobalCss || '');
    setTextColorDraft(options.siteTextColor || '#a0b0c8');
    setBgColorDraft(options.bgColor || '#111827');
    setLogoColorDraft(options.logoColor || '#ffffff');
  }, [cssEditorOpen, cssPresets, options.activeCssPresetId, options.customGlobalCss, options.siteTextColor, options.bgColor, options.logoColor]);

  useEffect(() => {
    if (!cssEditorOpen && !cssEditorRender && !activePreset) return;
    if (!activePreset) {
      setCssDraft(options.customGlobalCss || '');
      setTextColorDraft(options.siteTextColor || '#a0b0c8');
      setBgColorDraft(options.bgColor || '#111827');
      setLogoColorDraft(options.logoColor || '#ffffff');
      return;
    }
    setCssDraft(activePreset.css || '');
    setTextColorDraft(activePreset.siteTextColor || options.siteTextColor || '#a0b0c8');
    setBgColorDraft(activePreset.bgColor || options.bgColor || '#111827');
    setLogoColorDraft(activePreset.logoColor || options.logoColor || '#ffffff');
  }, [cssEditorOpen, cssEditorRender, activePreset, options.siteTextColor, options.bgColor, options.logoColor]);

  useEffect(() => {
    if (cssEditorOpen) {
      setCssEditorAnim(false);
      setCssEditorRender(true);
      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setCssEditorAnim(true));
      });
      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }
    setCssEditorAnim(false);
    const t = setTimeout(() => setCssEditorRender(false), 200);
    return () => clearTimeout(t);
  }, [cssEditorOpen]);

  useEffect(() => {
    if (historyOpen) {
      setHistoryAnim(false);
      setHistoryRender(true);
      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setHistoryAnim(true));
      });
      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }
    setHistoryAnim(false);
    const t = setTimeout(() => setHistoryRender(false), 200);
    return () => clearTimeout(t);
  }, [historyOpen]);

  // Custom Theme popup animation
  useEffect(() => {
    if (customThemeOpen) {
      setCustomThemeAnim(false);
      setCustomThemeRender(true);
      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setCustomThemeAnim(true));
      });
      return () => { cancelAnimationFrame(outer); cancelAnimationFrame(inner); };
    }
    setCustomThemeAnim(false);
    const t = setTimeout(() => setCustomThemeRender(false), 200);
    return () => clearTimeout(t);
  }, [customThemeOpen]);

  // Color picker drag handlers
  const updateSV = useCallback((clientX, clientY) => {
    if (!svPickerRef.current) return;
    const rect = svPickerRef.current.getBoundingClientRect();
    setPickerSat(Math.round(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))));
    setPickerVal(Math.round(Math.max(0, Math.min(100, (1 - (clientY - rect.top) / rect.height) * 100))));
  }, []);

  const updateHue = useCallback((clientX) => {
    if (!hueStripRef.current) return;
    const rect = hueStripRef.current.getBoundingClientRect();
    setPickerHue(Math.round(Math.max(0, Math.min(360, ((clientX - rect.left) / rect.width) * 360))));
  }, []);

  useEffect(() => {
    if (!draggingSV && !draggingHue) return;
    const onMove = (e) => {
      const cx = e.touches?.[0]?.clientX ?? e.clientX;
      const cy = e.touches?.[0]?.clientY ?? e.clientY;
      if (draggingSV) updateSV(cx, cy);
      if (draggingHue) updateHue(cx);
    };
    const onUp = () => { setDraggingSV(false); setDraggingHue(false); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [draggingSV, draggingHue, updateSV, updateHue]);

  const pickerModeLocks = useMemo(() => ({
    darkMaxValue: 42,
    lightMinValue: 58,
  }), []);

  const getForcedPickerMode = useCallback(
    (baseMode, val = pickerVal) => {
      const shouldForceLight = val >= pickerModeLocks.lightMinValue;
      const shouldForceDark = val <= pickerModeLocks.darkMaxValue;
      if (shouldForceDark) return 'dark';
      if (shouldForceLight && LIGHT_MODE_AVAILABLE) return 'light';
      return baseMode;
    },
    [pickerVal, pickerModeLocks.darkMaxValue, pickerModeLocks.lightMinValue],
  );

  const handlePickerMode = useCallback(
    (newMode) => {
      setPickerMode(newMode);
      const forced = getForcedPickerMode(newMode);
      if (forced !== newMode) {
        requestAnimationFrame(() => setPickerMode(forced));
      }
    },
    [getForcedPickerMode],
  );

  useEffect(() => {
    const forced = getForcedPickerMode(pickerMode);
    if (forced !== pickerMode) {
      setPickerMode(forced);
    }
  }, [pickerHue, pickerSat, pickerVal, pickerMode, getForcedPickerMode]);

  useEffect(() => {
    const handleExport = () => setExportOpen(true);
    const handleImport = () => setImportOpen(true);
    window.addEventListener('ghost-export-data', handleExport);
    window.addEventListener('ghost-import-data', handleImport);
    return () => {
      window.removeEventListener('ghost-export-data', handleExport);
      window.removeEventListener('ghost-import-data', handleImport);
    };
  }, []);

  const privSettings = settings.privacyConfig({
    options,
    updateOption,
    openPanic: () => setPanicOpen(true),
  });

  const browsingSettings = settings.browsingConfig({
    options,
    updateOption,
    openShortcuts: () => setShortcutsOpen(true),
  });

  const previousThemePreset = useMemo(() => {
    const preferredThemeName = options.lastThemePresetName || options.themeName || 'darkTheme';
    return (
      selectableThemePresets.find((entry) => entry.value?.themeName === preferredThemeName) ||
      selectableThemePresets.find((entry) => entry.option === 'Dark') ||
      selectableThemePresets[0] ||
      null
    );
  }, [options.lastThemePresetName, options.themeName]);

  const confirmCustomThemePresetSwitch = useCallback(async () => {
    if (options.theme !== 'custom') return;

    const targetPreset = previousThemePreset;
    const presetLabel = targetPreset?.option || 'Dark';
    const ok = await showConfirm(
      `Custom Theme is active. Switch back to "${presetLabel}" preset?`,
      'Switch Site Theme',
    );
    if (!ok || !targetPreset?.value) return;

    updateOption({
      ...targetPreset.value,
      lastThemePresetName:
        targetPreset.value.themeName || options.lastThemePresetName || options.themeName || 'darkTheme',
    });
  }, [options.theme, options.lastThemePresetName, options.themeName, previousThemePreset, updateOption]);

  const customizeSettings = settings.customizeConfig({
    options,
    updateOption,
    openCssEditor: {
      openSidebarEditor: () => setSidebarEditorOpen(true),
      openCustomTheme: () => setCustomThemeOpen(true),
      confirmCustomThemePresetSwitch,
    },
  });

  const historyItems = useMemo(() => {
    try {
      const raw = localStorage.getItem('ghostBrowserHistory');
      const parsed = JSON.parse(raw || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [historyOpen]);

  const filteredHistoryItems = useMemo(() => {
    const q = historyQuery.trim().toLowerCase();
    if (!q) return historyItems;
    return historyItems.filter((item) => {
      const title = String(item?.title || '').toLowerCase();
      const url = String(item?.url || '').toLowerCase();
      return title.includes(q) || url.includes(q);
    });
  }, [historyItems, historyQuery]);

  const clearHistory = async () => {
    const ok = await showConfirm('Clear all proxy browsing history?', 'Clear History');
    if (!ok) return;
    localStorage.setItem('ghostBrowserHistory', JSON.stringify([]));
    setHistoryQuery('');
    setHistoryOpen(false);
    setTimeout(() => setHistoryOpen(true), 0);
  };

  const openHistoryItem = (item) => {
    const rawUrl = String(item?.url || '').trim();
    if (!rawUrl) return;

    const openInBrowserTab =
      window.top?.__ghostOpenBrowserTab ||
      window.__ghostOpenBrowserTab;

    if (typeof openInBrowserTab === 'function') {
      openInBrowserTab(rawUrl, {
        title: item?.title || 'New Tab',
      });
    } else {
      window.open(rawUrl, '_blank', 'noopener,noreferrer');
    }

    setHistoryOpen(false);
  };

  const storageEntries = useMemo(() => {
    const local = [];
    const session = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      local.push({ key, value: localStorage.getItem(key) || '' });
    }

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key) continue;
      session.push({ key, value: sessionStorage.getItem(key) || '' });
    }

    return { local, session };
  }, [dataOpen]);

  const handleDeleteData = async () => {
    const ok = await showConfirm('Delete saved browser data? This will remove history, saved tabs, custom apps, and bookmarks.', 'Delete Data');
    if (!ok) return;

    try {
      localStorage.clear();
      sessionStorage.clear();
      showAlert('All local data and preferences have been deleted. Reloading...', 'Data Wiped');
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      showAlert('Failed to delete data.', 'Error');
    }
  };

  const dataSettings = settings.dataConfig({
    openHistoryData: () => setHistoryOpen(true),
    openViewData: () => setDataOpen(true),
    deleteData: handleDeleteData,
  });

  const applyCssDraft = () => {
    updateOption({
      siteTextColor: textColorDraft,
      bgColor: bgColorDraft,
      logoColor: logoColorDraft,
      customGlobalCss: cssDraft,
    });
  };

  const savePreset = () => {
    const base = activePreset || {
      id: createId(),
      name: newPresetName.trim() || `Preset ${cssPresets.length + 1}`,
    };

    const nextPreset = {
      ...base,
      css: cssDraft,
      siteTextColor: textColorDraft,
      bgColor: bgColorDraft,
      logoColor: logoColorDraft,
      fontFamily: fontFamilyDraft,
      padding: paddingDraft,
      borderRadius: radiusDraft,
    };

    const exists = cssPresets.some((p) => p.id === nextPreset.id);
    const nextPresets = exists
      ? cssPresets.map((p) => (p.id === nextPreset.id ? nextPreset : p))
      : [...cssPresets, nextPreset];

    updateOption({
      cssEditorPresets: nextPresets,
      activeCssPresetId: nextPreset.id,
      siteTextColor: nextPreset.siteTextColor,
      bgColor: nextPreset.bgColor,
      logoColor: nextPreset.logoColor,
      customGlobalCss: nextPreset.css,
      customFontFamily: nextPreset.fontFamily,
      customPadding: nextPreset.padding,
      customBorderRadius: nextPreset.borderRadius,
    });
    setSelectedPresetId(nextPreset.id);
    setNewPresetName('');
  };

  const createPreset = () => {
    const name = newPresetName.trim() || `Preset ${cssPresets.length + 1}`;
    const id = createId();
    const nextPreset = {
      id,
      name,
      css: cssDraft,
      siteTextColor: textColorDraft,
      bgColor: bgColorDraft,
      logoColor: logoColorDraft,
      fontFamily: fontFamilyDraft,
      padding: paddingDraft,
      borderRadius: radiusDraft,
    };

    updateOption({
      cssEditorPresets: [...cssPresets, nextPreset],
      activeCssPresetId: id,
      siteTextColor: nextPreset.siteTextColor,
      bgColor: nextPreset.bgColor,
      logoColor: nextPreset.logoColor,
      customGlobalCss: nextPreset.css,
      customFontFamily: nextPreset.fontFamily,
      customPadding: nextPreset.padding,
      customBorderRadius: nextPreset.borderRadius,
    });
    setSelectedPresetId(id);
    setNewPresetName('');
  };

  const deletePreset = async () => {
    if (!activePreset) return;
    const ok = await showConfirm(`Delete preset "${activePreset.name}"?`, 'Delete Preset');
    if (!ok) return;

    const nextPresets = cssPresets.filter((p) => p.id !== activePreset.id);
    const fallback = nextPresets[0] || null;
    updateOption({
      cssEditorPresets: nextPresets,
      activeCssPresetId: fallback?.id || null,
      siteTextColor: fallback?.siteTextColor || textColorDraft,
      bgColor: fallback?.bgColor || bgColorDraft,
      logoColor: fallback?.logoColor || logoColorDraft,
      customGlobalCss: fallback?.css || cssDraft,
      customFontFamily: fallback?.fontFamily || fontFamilyDraft,
      customPadding: fallback?.padding || paddingDraft,
      customBorderRadius: fallback?.borderRadius || radiusDraft,
    });
    setSelectedPresetId(fallback?.id || '');
  };

  const resetCssToPreset = () => {
    const preset = cssPresets.find((p) => p.id === (options.activeCssPresetId || selectedPresetId));
    if (!preset) {
      setCssDraft('');
      setTextColorDraft(options.siteTextColor || '#a0b0c8');
      setBgColorDraft(options.bgColor || '#111827');
      setLogoColorDraft(options.logoColor || '#ffffff');
      updateOption({ customGlobalCss: '' });
      return;
    }

    setCssDraft(preset.css || '');
    setTextColorDraft(preset.siteTextColor || '#a0b0c8');
    setBgColorDraft(preset.bgColor || '#111827');
    setLogoColorDraft(preset.logoColor || '#ffffff');
    setFontFamilyDraft(preset.fontFamily || '');
    setPaddingDraft(preset.padding || '');
    setRadiusDraft(preset.borderRadius || '');

    updateOption({
      activeCssPresetId: preset.id,
      customGlobalCss: preset.css || '',
      siteTextColor: preset.siteTextColor || '#a0b0c8',
      bgColor: preset.bgColor || '#111827',
      logoColor: preset.logoColor || '#ffffff',
      customFontFamily: preset.fontFamily || '',
      customPadding: preset.padding || '',
      customBorderRadius: preset.borderRadius || '',
    });
  };

  const scroll = clsx(
    'scrollbar scrollbar-track-transparent scrollbar-thin',
    options?.type === 'dark' || !options?.type
      ? 'scrollbar-thumb-gray-600'
      : 'scrollbar-thumb-gray-500',
  );
  const isUiLight = options?.type === 'light';
  const popupSurface = options.quickModalBgColor || options.menuColor || (isUiLight ? '#f8fafc' : '#1a252f');
  const popupTextColor = options.siteTextColor || (isUiLight ? '#0f172a' : '#e2e8f0');
  const popupMutedColor = isUiLight ? 'rgba(15,23,42,0.62)' : 'rgba(226,232,240,0.62)';
  const popupBorderColor = isUiLight ? 'rgba(15,23,42,0.14)' : 'rgba(255,255,255,0.12)';
  const popupSoftBg = isUiLight ? 'rgba(15,23,42,0.06)' : 'rgba(255,255,255,0.08)';
  const popupInputBg = isUiLight ? 'rgba(255,255,255,0.84)' : 'rgba(0,0,0,0.25)';
  const popupInputBorder = isUiLight ? 'rgba(15,23,42,0.16)' : 'rgba(255,255,255,0.1)';

  return (
    <div
      className={clsx(
        theme[`theme-${options.theme || 'default'}`],
        'flex flex-1 flex-col overflow-y-auto py-6 px-4 sm:px-8 md:px-16',
        scroll,
      )}
    >
      <PanicDialog state={panicOpen} set={setPanicOpen} />
      <ShortcutsDialog
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
        shortcuts={options.shortcuts}
        onSave={(shortcuts) => updateOption({ shortcuts })}
      />
      {cssEditorRender && (
        <div className={`fixed inset-0 z-[10000] flex items-center justify-center p-4 transition-all duration-200 ${cssEditorAnim ? 'opacity-100' : 'opacity-0'}`}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setCssEditorOpen(false)} />
          <div
            className={clsx(
              theme[`theme-${options.theme || 'default'}`],
              `relative w-full max-w-5xl max-h-[85dvh] rounded-xl border border-white/10 overflow-hidden transition-all duration-200 ${cssEditorAnim ? 'scale-100 translate-y-0' : 'scale-[0.965] translate-y-[6px]'}`
            )}
            style={{ backgroundColor: options.quickModalBgColor || options.menuColor || '#1a252f' }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h2 className="text-lg font-semibold">CSS Editor</h2>
              <button onClick={() => setCssEditorOpen(false)} className="p-1 rounded-md hover:bg-[#ffffff12]">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[calc(85dvh-4rem)] space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-lg bg-[#ffffff0d] p-3">
                  <p className="text-xs uppercase tracking-wide opacity-70 mb-2">Text Color</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={textColorDraft}
                      onChange={(e) => setTextColorDraft(e.target.value)}
                      className="h-10 w-12 p-1 rounded-md cursor-pointer border-none bg-transparent"
                    />
                    <input
                      type="text"
                      value={textColorDraft}
                      onChange={(e) => setTextColorDraft(e.target.value)}
                      className="h-10 flex-1 rounded-md bg-[#00000030] outline-none border border-white/10 px-3 text-sm uppercase"
                    />
                  </div>
                </div>
                <div className="rounded-lg bg-[#ffffff0d] p-3">
                  <p className="text-xs uppercase tracking-wide opacity-70 mb-2">Background Color</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bgColorDraft}
                      onChange={(e) => setBgColorDraft(e.target.value)}
                      className="h-10 w-12 p-1 rounded-md cursor-pointer border-none bg-transparent"
                    />
                    <input
                      type="text"
                      value={bgColorDraft}
                      onChange={(e) => setBgColorDraft(e.target.value)}
                      className="h-10 flex-1 rounded-md bg-[#00000030] outline-none border border-white/10 px-3 text-sm uppercase"
                    />
                  </div>
                </div>
                <div className="rounded-lg bg-[#ffffff0d] p-3">
                  <p className="text-xs uppercase tracking-wide opacity-70 mb-2">Logo Color</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={logoColorDraft}
                      onChange={(e) => setLogoColorDraft(e.target.value)}
                      className="h-10 w-12 p-1 rounded-md cursor-pointer border-none bg-transparent"
                    />
                    <input
                      type="text"
                      value={logoColorDraft}
                      onChange={(e) => setLogoColorDraft(e.target.value)}
                      className="h-10 flex-1 rounded-md bg-[#00000030] outline-none border border-white/10 px-3 text-sm uppercase"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-lg bg-[#ffffff0d] p-3">
                  <p className="text-xs uppercase tracking-wide opacity-70 mb-2">Font Family</p>
                  <input
                    type="text"
                    value={fontFamilyDraft}
                    onChange={(e) => setFontFamilyDraft(e.target.value)}
                    placeholder="e.g. 'Roboto', sans-serif"
                    className="h-10 w-full rounded-md bg-[#00000030] outline-none border border-white/10 px-3 text-sm"
                  />
                </div>
                <div className="rounded-lg bg-[#ffffff0d] p-3">
                  <p className="text-xs uppercase tracking-wide opacity-70 mb-2">Main Padding</p>
                  <input
                    type="text"
                    value={paddingDraft}
                    onChange={(e) => setPaddingDraft(e.target.value)}
                    placeholder="e.g. 1rem or 16px"
                    className="h-10 w-full rounded-md bg-[#00000030] outline-none border border-white/10 px-3 text-sm"
                  />
                </div>
                <div className="rounded-lg bg-[#ffffff0d] p-3">
                  <p className="text-xs uppercase tracking-wide opacity-70 mb-2">Border Radius</p>
                  <input
                    type="text"
                    value={radiusDraft}
                    onChange={(e) => setRadiusDraft(e.target.value)}
                    placeholder="e.g. 8px or 50%"
                    className="h-10 w-full rounded-md bg-[#00000030] outline-none border border-white/10 px-3 text-sm"
                  />
                </div>
              </div>

              <div className="rounded-lg bg-[#ffffff0d] p-3 space-y-3">
                <div className="flex flex-col md:flex-row gap-2">
                  <select
                    value={selectedPresetId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedPresetId(id);
                      const preset = cssPresets.find((p) => p.id === id);
                      if (!preset) return;
                      setCssDraft(preset.css || '');
                      setTextColorDraft(preset.siteTextColor || '#a0b0c8');
                      setBgColorDraft(preset.bgColor || '#111827');
                      setLogoColorDraft(preset.logoColor || '#ffffff');
                      updateOption({ activeCssPresetId: id });
                    }}
                    className="h-10 flex-1 rounded-md bg-[#00000030] border border-white/10 px-3 text-sm"
                  >
                    <option value="">No preset selected</option>
                    {cssPresets.map((preset) => (
                      <option key={preset.id} value={preset.id}>{preset.name}</option>
                    ))}
                  </select>
                  <input
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder="New preset name"
                    className="h-10 flex-1 rounded-md bg-[#00000030] border border-white/10 px-3 text-sm"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={createPreset} className="h-9 px-3 rounded-md bg-[#ffffff14] hover:bg-[#ffffff22] text-sm">Create Preset</button>
                  <button onClick={savePreset} className="h-9 px-3 rounded-md bg-[#ffffff14] hover:bg-[#ffffff22] text-sm">Save Preset</button>
                  <button onClick={deletePreset} disabled={!activePreset} className="h-9 px-3 rounded-md bg-[#ffffff14] hover:bg-[#ffffff22] disabled:opacity-50 text-sm">Delete Preset</button>
                  <button onClick={resetCssToPreset} className="h-9 px-3 rounded-md bg-[#ffffff14] hover:bg-[#ffffff22] text-sm">Reset CSS</button>
                  <button onClick={applyCssDraft} className="h-9 px-3 rounded-md bg-[#2f7fff44] hover:bg-[#2f7fff66] text-sm">Apply CSS</button>
                </div>
              </div>

              <div className="rounded-lg bg-[#ffffff0d] p-3">
                <p className="text-xs uppercase tracking-wide opacity-70 mb-2">Global CSS</p>
                <textarea
                  value={cssDraft}
                  onChange={(e) => setCssDraft(e.target.value)}
                  placeholder={'/* Example:\n#search-div { border-radius: 20px; }\n*/'}
                  className="w-full min-h-[260px] rounded-md bg-[#00000030] border border-white/10 p-3 text-sm outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}
      {historyRender && (
        <div className={`fixed inset-0 z-[10000] flex items-center justify-center p-4 transition-opacity duration-200 ${historyAnim ? 'opacity-100' : 'opacity-0'}`}>
          <div className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${historyAnim ? 'opacity-100' : 'opacity-0'}`} onClick={() => setHistoryOpen(false)} />
          <div
            className={clsx(
              theme[`theme-${options.theme || 'default'}`],
              `relative w-full max-w-4xl max-h-[80dvh] rounded-xl border overflow-hidden transition-all duration-200 ${historyAnim ? 'scale-100 translate-y-0' : 'scale-[0.965] translate-y-[6px]'}`
            )}
            style={{
              backgroundColor: popupSurface,
              borderColor: popupBorderColor,
              color: popupTextColor,
            }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: popupBorderColor }}>
              <h2 className="text-lg font-semibold">View History</h2>
              <div className="flex items-center gap-2">
                {historyItems.length > 0 && (
                  <button onClick={clearHistory} className="h-8 px-2.5 rounded-md hover:bg-[#ffffff12] text-xs translate-y-[1px]">
                    Clear
                  </button>
                )}
                <button onClick={() => setHistoryOpen(false)} className="p-1 rounded-md hover:bg-[#ffffff12]">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="px-4 pb-4 pt-0 overflow-y-auto max-h-[calc(80dvh-4rem)] space-y-2">
              <div className="sticky top-0 z-10 pb-2 pt-0" style={{ backgroundColor: popupSurface }}>
                <div className="h-2" style={{ backgroundColor: popupSurface }} />
                <input
                  value={historyQuery}
                  onChange={(e) => setHistoryQuery(e.target.value)}
                  placeholder="Search history"
                  className="w-full h-9 rounded-md border px-3 text-sm outline-none"
                  style={{
                    backgroundColor: popupInputBg,
                    borderColor: popupInputBorder,
                    color: popupTextColor,
                  }}
                />
              </div>
              {filteredHistoryItems.length === 0 && <p className="text-sm opacity-70">No matching history entries.</p>}
              {filteredHistoryItems.map((item) => (
                <div
                  key={item.id || `${item.url}-${item.time}`}
                  className="rounded-lg p-3 transition-opacity cursor-pointer hover:opacity-90"
                  style={{ backgroundColor: popupSoftBg }}
                  onClick={() => openHistoryItem(item)}
                >
                  <p className="text-sm font-medium truncate">{item.title || item.url}</p>
                  <p className="text-xs opacity-70 break-all">{item.url}</p>
                  <p className="text-xs opacity-60 mt-1">{item.time ? new Date(item.time).toLocaleString() : ''}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {dataOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDataOpen(false)} />
          <div
            className={clsx(
              theme[`theme-${options.theme || 'default'}`],
              'relative w-full max-w-5xl max-h-[85dvh] rounded-xl border overflow-hidden',
            )}
            style={{
              backgroundColor: popupSurface,
              borderColor: popupBorderColor,
              color: popupTextColor,
            }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: popupBorderColor }}>
              <h2 className="text-lg font-semibold">View Data</h2>
              <button onClick={() => setDataOpen(false)} className="p-1 rounded-md hover:bg-[#ffffff12]">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(85dvh-4rem)] space-y-6">
              <div>
                <h3 className="text-sm font-semibold mb-2">Local Storage ({storageEntries.local.length})</h3>
                <div className="space-y-2">
                  {storageEntries.local.map((entry) => (
                    <div key={entry.key} className="rounded-lg p-3" style={{ backgroundColor: popupSoftBg }}>
                      <p className="text-sm font-medium break-all">{entry.key}</p>
                      <pre className="text-xs opacity-80 mt-1 whitespace-pre-wrap break-words">{entry.value}</pre>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">Session Storage ({storageEntries.session.length})</h3>
                <div className="space-y-2">
                  {storageEntries.session.map((entry) => (
                    <div key={entry.key} className="rounded-lg p-3" style={{ backgroundColor: popupSoftBg }}>
                      <p className="text-sm font-medium break-all">{entry.key}</p>
                      <pre className="text-xs opacity-80 mt-1 whitespace-pre-wrap break-words">{entry.value}</pre>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {setting === 'Privacy' && <Type type={() => privSettings} title="Privacy" />}
      {setting === 'Customize' && <Type type={() => customizeSettings} title="Customize" />}
      {setting === 'Browsing' && <Type type={() => browsingSettings} title="Browsing" />}
      {setting === 'Data' && <Type type={() => dataSettings} title="Data" />}
      {setting === 'Advanced' && (
        <Type
          type={() => settings.advancedConfig({ options, updateOption })}
          title="Advanced"
        />
      )}
      {setting === 'Info' && <InfoPanel />}

      <SidebarEditor open={sidebarEditorOpen} onClose={() => setSidebarEditorOpen(false)} />
      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} />
      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />

      {/* ── Custom Theme Popup ── */}
      {customThemeRender && (
        <div
          className={`fixed inset-0 z-[10000] flex items-center justify-center p-4 transition-all duration-200 ${customThemeAnim ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="absolute inset-0 bg-black/50" onClick={() => setCustomThemeOpen(false)} />
          <div
            className={clsx(
              theme[`theme-${options.theme || 'default'}`],
              `relative w-full max-w-[410px] rounded-[28px] border overflow-hidden transition-all duration-200 ${customThemeAnim ? 'scale-100 translate-y-0' : 'scale-[0.965] translate-y-[6px]'}`,
            )}
            style={{ backgroundColor: popupSurface, borderColor: popupBorderColor, color: popupTextColor }}
          >
            {/* Header */}
            <div className="flex items-start justify-between px-5 pt-5 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">Custom Theme</h2>
                  <span
                    className="text-[0.6rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: isUiLight ? 'rgba(15,23,42,0.08)' : 'rgba(255,255,255,0.12)',
                      color: popupMutedColor,
                    }}
                  >
                    BETA
                  </span>
                </div>
                <p className="text-sm mt-0.5" style={{ color: popupMutedColor }}>Create a theme from a single color.</p>
                <p className="text-xs mt-1" style={{ color: popupMutedColor }}>Light mode isn&apos;t avaliable.</p>
              </div>
              <button
                type="button"
                onClick={() => setCustomThemeOpen(false)}
                className={clsx(
                  'p-1 rounded-md shrink-0 ml-4 transition-colors',
                  isUiLight ? 'hover:bg-black/10' : 'hover:bg-white/10',
                )}
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 pb-5 space-y-3">
              {/* SV Picker box */}
              <div
                ref={svPickerRef}
                className="relative w-full rounded-xl overflow-hidden select-none"
                style={{
                  height: 156,
                  background: `linear-gradient(to bottom, transparent, #000), linear-gradient(to right, #fff, hsl(${pickerHue}, 100%, 50%))`,
                  cursor: 'crosshair',
                }}
                onMouseDown={(e) => { setDraggingSV(true); updateSV(e.clientX, e.clientY); }}
                onTouchStart={(e) => { setDraggingSV(true); updateSV(e.touches[0].clientX, e.touches[0].clientY); }}
              >
                <div
                  className="absolute w-4 h-4 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)] pointer-events-none"
                  style={{
                    left: `${pickerSat}%`,
                    top: `${100 - pickerVal}%`,
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: hsvToHex(pickerHue, pickerSat, pickerVal),
                  }}
                />
              </div>

              {/* Hue strip */}
              <div
                ref={hueStripRef}
                className="relative w-full h-[14px] rounded-full overflow-visible select-none"
                style={{
                  background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)',
                  cursor: 'pointer',
                }}
                onMouseDown={(e) => { setDraggingHue(true); updateHue(e.clientX); }}
                onTouchStart={(e) => { setDraggingHue(true); updateHue(e.touches[0].clientX); }}
              >
                <div
                  className="absolute top-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none"
                  style={{
                    left: `${(pickerHue / 360) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: `hsl(${pickerHue}, 100%, 50%)`,
                  }}
                />
              </div>

              {/* Swatch + hex display */}
              <div className="flex items-center gap-3 pt-0.5">
                <div
                  className="w-8 h-8 rounded-lg border border-white/15 shrink-0"
                  style={{ backgroundColor: hsvToHex(pickerHue, pickerSat, pickerVal) }}
                />
                <code className="text-sm opacity-75 font-mono tracking-wider">
                  {hsvToHex(pickerHue, pickerSat, pickerVal).toUpperCase()}
                </code>
              </div>

              {/* Apply */}
              <button
                type="button"
                onClick={() => {
                  const resolvedMode = 'dark';
                  if (resolvedMode !== pickerMode) {
                    setPickerMode(resolvedMode);
                  }

                  if (resolvedMode === 'light' && !LIGHT_MODE_AVAILABLE) {
                    showAlert('Light mode is in development.', 'Custom Theme');
                    setPickerMode('dark');
                    return;
                  }

                  const preservedPresetThemeName =
                    options.theme === 'custom'
                      ? options.lastThemePresetName || previousThemePreset?.value?.themeName || 'darkTheme'
                      : options.themeName || previousThemePreset?.value?.themeName || 'darkTheme';

                  updateOption({
                    ...generateCustomTheme(pickerHue, pickerSat, pickerVal, resolvedMode),
                    lastThemePresetName: preservedPresetThemeName,
                  });
                }}
                className={clsx(
                  'w-full h-11 rounded-2xl border text-sm font-semibold active:scale-[0.98] transition-all flex items-center justify-center gap-2',
                  isUiLight
                    ? 'bg-[#111827] border-[#111827] text-white hover:bg-[#0b1220]'
                    : 'bg-white/15 border-white/20 text-white hover:bg-white/20',
                )}
              >
                ↑ Apply Theme!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Setting;
