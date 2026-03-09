import { meta } from '/src/utils/config';
import {
  themeConfig,
  appsPerPageConfig,
  navScaleConfig,
  searchConfig,
  prConfig,
  designConfig,
} from '/src/utils/config';
import { showAlert, showConfirm } from '/src/utils/uiDialog';

const newTabPageConfig = [
  { option: 'Ghost Home', value: { newTabPage: 'ghost' } },
  { option: 'DuckDuckGo', value: { newTabPage: 'duckduckgo' } },
  { option: 'Google', value: { newTabPage: 'google' } },
  { option: 'Blank', value: { newTabPage: 'blank' } },
];

const transportConfig = [
  { option: 'LibCurl', value: { transport: 'libcurl' } },
  { option: 'Epoxy', value: { transport: 'epoxy' } },
];

const proxyRoutingConfig = [
  { option: 'Direct Connection', value: { proxyRouting: 'direct' } },
  { option: 'Remote Proxy Server', value: { proxyRouting: 'remote' } },
];

const weatherUnitConfig = [
  { option: 'Fahrenheit (°F)', value: { weatherUnit: 'fahrenheit' } },
  { option: 'Celsius (°C)', value: { weatherUnit: 'celsius' } },
];

const musicPlayerConfig = [
  { option: '--', value: { defaultMusicPlayer: '' } },
  { option: 'Monochrome', value: { defaultMusicPlayer: 'monochrome' } },
  { option: 'Spotify', value: { defaultMusicPlayer: 'spotify' } },
  { option: 'Apple Music', value: { defaultMusicPlayer: 'apple-music' } },
  { option: 'Amazon Music', value: { defaultMusicPlayer: 'amazon-music' } },
  { option: 'YouTube Music', value: { defaultMusicPlayer: 'youtube-music' } },
  { option: 'Tidal', value: { defaultMusicPlayer: 'tidal' } },
  { option: 'Deezer', value: { defaultMusicPlayer: 'deezer' } },
  { option: 'SoundCloud', value: { defaultMusicPlayer: 'soundcloud' } },
  { option: 'Pandora', value: { defaultMusicPlayer: 'pandora' } },
  { option: 'Qobuz', value: { defaultMusicPlayer: 'qobuz' } },
];

const aiProviderConfig = [
  { option: 'Ghost AI (Default)', value: { defaultAiProvider: '' } },
  { option: 'ChatGPT', value: { defaultAiProvider: 'chatgpt' } },
  { option: 'Google Gemini', value: { defaultAiProvider: 'gemini' } },
  { option: 'Claude', value: { defaultAiProvider: 'claude' } },
  { option: 'Perplexity', value: { defaultAiProvider: 'perplexity' } },
  { option: 'Microsoft Copilot', value: { defaultAiProvider: 'copilot' } },
  { option: 'DeepSeek', value: { defaultAiProvider: 'deepseek' } },
  { option: 'Mistral (Le Chat)', value: { defaultAiProvider: 'mistral' } },
  { option: 'Grok (xAI)', value: { defaultAiProvider: 'grok' } },
  { option: 'You.com', value: { defaultAiProvider: 'you' } },
  { option: 'Poe', value: { defaultAiProvider: 'poe' } },
  { option: 'HuggingChat', value: { defaultAiProvider: 'huggingchat' } },
];

export const privacyConfig = ({ options, updateOption, openPanic }) => ({
  1: {
    name: 'Site Title',
    desc: "This setting allows you to change the site's tab title and icon.",
    config: meta,
    value: (
      meta.find(
        (c) => c.value && typeof c.value === 'object' && c.value.tabName === options.tabName,
      ) || meta[0]
    ).value,
    type: 'select',
    action: (a) => updateOption(a),
  },
  2: {
    name: 'Auto Cloak',
    desc: 'Automatically apply your selected cloak when this tab loses focus and restore on return.',
    value: !!options.clkOff,
    type: 'switch',
    action: (b) => setTimeout(() => updateOption({ clkOff: b }), 100),
    disabled: !options.tabName || options.tabName === meta[0].value.tabName,
  },
  3: {
    name: 'Open in AB',
    desc: 'This will open the site into an about:blank tab. Make sure popups are enabled.',
    value: options.aboutBlank,
    type: 'switch',
    action: (b) =>
      setTimeout(() => updateOption({ aboutBlank: b, ...(b ? { openBlob: false } : {}) }), 100),
  },
  4: {
    name: 'Open in Blob',
    desc: 'This will open the site inside a blob: tab. If enabled, Open in AB is disabled.',
    value: !!options.openBlob,
    type: 'switch',
    action: (b) =>
      setTimeout(() => updateOption({ openBlob: b, ...(b ? { aboutBlank: false } : {}) }), 100),
  },
  5: {
    name: 'Panic Key',
    desc: 'Enable or disable the panic key option.',
    value: !!options.panicToggleEnabled,
    type: 'switch',
    action: (b) => {
      setTimeout(() => {
        updateOption({ panicToggleEnabled: b });
        import('/src/utils/utils.js').then(({ panic }) => panic());
      }, 100);
    },
  },
  6: {
    name: 'Panic Shortcut',
    desc: 'Set a keybind/shortcut that redirects you to a page when pressed.',
    value: 'Set Key',
    type: 'button',
    action: openPanic,
    disabled: !options.panicToggleEnabled,
  },
});

export const customizeConfig = ({ options, updateOption, openCssEditor }) => ({
  1: {
    name: 'Site Theme',
    desc: 'Customize the appearance of the website by selecting a theme.',
    config: themeConfig,
    value: find(themeConfig, (c) => c.value?.themeName === options.themeName, 0),
    type: 'select',
    action: (a) => updateOption(a),
  },
  2: {
    name: 'Background Design',
    desc: "Customize the site's background design. Background designs do not work with Custom Background URL.",
    config: designConfig,
    value: find(designConfig, (c) => c.value?.bgDesign === options.bgDesign, 0),
    type: 'select',
    action: (a) => updateOption(a),
    disabled: !!options.customBackgroundImage,
  },
  3: {
    name: 'Background Transparency',
    desc: 'Set the transparency/dim of the background image or design (0-100). Lower values make it darker/dimmer.',
    value: options.bgTransparency ?? '20',
    type: 'input',
    placeholder: '20',
    action: (v) => {
      let val = parseInt(v);
      if (isNaN(val)) return;
      if (val < 0) val = 0;
      if (val > 100) val = 100;
      updateOption({ bgTransparency: String(val) });
    },
  },
  4: {
    name: 'Apps per Page',
    desc: 'Number of apps to show per page ("All" will show everything).',
    config: appsPerPageConfig,
    value: find(appsPerPageConfig, (c) => c.value.itemsPerPage === (options.itemsPerPage ?? 50), 3),
    type: 'select',
    action: (a) => updateOption(a),
  },
  5: {
    name: 'Navigation Scale',
    desc: 'Scale navigation bar size (logo & font) globally.',
    config: navScaleConfig,
    value: find(navScaleConfig, (c) => c.value.navScale === (options.navScale ?? 1), 3),
    type: 'select',
    action: (a) => updateOption(a),
  },
  6: {
    name: 'Typography',
    desc: 'Set any Google Font name (example: Inter, Poppins, Roboto). Some fonts may not fit to elements well.',
    value: options.globalFont || 'Inter',
    type: 'input',
    action: (v) => updateOption({ globalFont: (v || 'Inter').trim() || 'Inter' }),
  },
  7: {
    name: 'Performance Mode',
    desc: 'Disable heavy animations and app/media icon loading for faster performance.',
    value: !!options.performanceMode,
    type: 'switch',
    action: (b) => setTimeout(() => updateOption({ performanceMode: b }), 100),
  },
  8: {
    name: 'Custom Background URL',
    desc: 'Set a custom background image URL (leave empty to use design presets).',
    value: options.customBackgroundImage || '',
    type: 'input',
    action: (v) => {
      const raw = String(v || '').trim();
      const cleaned = raw
        .replace(/^url\((.*)\)$/i, '$1')
        .replace(/^['"]|['"]$/g, '')
        .trim();
      updateOption({ customBackgroundImage: cleaned });
    },
  },
  9: {
    name: 'Sidebar Editor',
    desc: 'Add custom apps and manage sidebar toggles.',
    type: 'button',
    value: 'Open Sidebar Editor',
    action: openCssEditor?.openSidebarEditor, // Note: Need to pass openSidebarEditor
  },
  10: {
    name: 'CSS Editor',
    desc: 'Create and manage custom CSS presets, including global CSS and colors.',
    type: 'button',
    value: 'Open CSS Editor',
    action: openCssEditor?.openCssEditor || openCssEditor, // fallback for backward compatibility
  },
  11: {
    name: 'Clock Format',
    desc: 'Use 12-hour or 24-hour time in the Ghost menu. Default is 12-hour.',
    value: !!options.clock24Hour,
    type: 'switch',
    action: (b) => setTimeout(() => updateOption({ clock24Hour: b }), 100),
  },
  12: {
    name: 'Timezone Override',
    desc: 'Optional IANA timezone (example: America/New_York). Leave empty to auto-detect from your IP.',
    value: options.timezoneOverride || '',
    type: 'input',
    placeholder: 'Auto (IP timezone)',
    action: (v) => updateOption({ timezoneOverride: (v || '').trim() || null }),
  },
  13: {
    name: 'Use Your Location (IP)',
    desc: 'Use your IP-based location for menu weather.',
    value: options.weatherUseIpLocation !== false,
    type: 'switch',
    action: (b) => setTimeout(() => updateOption({ weatherUseIpLocation: b }), 100),
  },
  14: {
    name: 'Weather Unit',
    desc: 'Choose the temperature unit shown in the Ghost menu weather.',
    config: weatherUnitConfig,
    value: find(weatherUnitConfig, (c) => c.value?.weatherUnit === (options.weatherUnit || 'fahrenheit'), 0),
    type: 'select',
    action: (a) => updateOption(a),
  },
  15: {
    name: 'Weather Coords Override',
    desc: 'Optional coordinates when IP location is disabled (format: lat,lon).',
    value: options.weatherCoordsOverride || '',
    type: 'input',
    placeholder: '40.7128,-74.0060',
    action: (v) => updateOption({ weatherCoordsOverride: (v || '').trim() }),
    hidden: options.weatherUseIpLocation !== false,
  },
  16: {
    name: 'Music Player',
    desc: 'What music player opens when music is opened normally.',
    config: musicPlayerConfig,
    dropdownDirection: 'up',
    value: find(
      musicPlayerConfig,
      (c) => c.value?.defaultMusicPlayer === String(options.defaultMusicPlayer || ''),
      0,
    ),
    type: 'select',
    action: (a) => updateOption(a),
  },
  17: {
    name: 'AI Provider',
    desc: 'What AI provider opens when you use Ghost AI.',
    config: aiProviderConfig,
    dropdownDirection: 'up',
    value: find(
      aiProviderConfig,
      (c) => c.value?.defaultAiProvider === String(options.defaultAiProvider || ''),
      0,
    ),
    type: 'select',
    action: (a) => updateOption(a),
  },
});

export const browsingConfig = ({ options, updateOption, openShortcuts }) => ({
  1: {
    name: 'Search Engine',
    desc: 'Choose the default search engine used for queries.',
    config: searchConfig,
    value: find(searchConfig, (c) => c.value?.engine === options.engine, 0),
    type: 'select',
    action: (a) => updateOption(a),
  },
  2: {
    name: 'Backend Engine',
    desc: 'Choose the default engine used for browsing.',
    config: prConfig,
    value: find(prConfig, (c) => c.value?.prType === options.prType, 0),
    type: 'select',
    action: (a) => updateOption(a),
  },
  3: {
    name: 'New Tab Page',
    desc: 'Choose what new tabs open to in the loader.',
    config: newTabPageConfig,
    value: find(newTabPageConfig, (c) => c.value?.newTabPage === (options.newTabPage || 'ghost'), 0),
    type: 'select',
    action: (a) => updateOption(a),
  },
  4: {
    name: 'Save Tabs',
    desc: 'Restore your tabs after reopening the site.',
    value: options.saveTabs ?? true,
    type: 'switch',
    action: (b) => setTimeout(() => updateOption({ saveTabs: b }), 100),
  },
  5: {
    name: 'Search Recommendations',
    desc: 'Show search suggestions in the top browser search bar.',
    value: options.searchRecommendationsTop !== false,
    type: 'switch',
    action: (b) => setTimeout(() => updateOption({ searchRecommendationsTop: b }), 100),
  },
  6: {
    name: 'Ad Blocker (Default)',
    desc: 'Default ad blocking state for websites in browser mode. Per-site override is available in the sidebar menu.',
    value: !!options.adBlockDefault,
    type: 'switch',
    action: (b) => setTimeout(() => updateOption({ adBlockDefault: b }), 100),
  },
  7: {
    name: 'Popup Blocker (Default)',
    desc: 'Block websites from opening new tabs/windows by default. Per-site override is available in the sidebar menu.',
    value: !!options.popupBlockDefault,
    type: 'switch',
    action: (b) => setTimeout(() => updateOption({ popupBlockDefault: b }), 100),
  },
  8: {
    name: 'Download Blocker (Default)',
    desc: 'Block file downloads by default. Per-site override is available in the sidebar menu.',
    value: !!options.downloadBlockDefault,
    type: 'switch',
    action: (b) => setTimeout(() => updateOption({ downloadBlockDefault: b }), 100),
  },
  9: {
    name: 'Open Link In New Tab',
    desc: 'When clicking a bookmark or an app in the side menu, open it in a new tab instead of replacing the current one.',
    value: !!options.openLinkInNewTab,
    type: 'switch',
    action: (b) => setTimeout(() => updateOption({ openLinkInNewTab: b }), 100),
  },
  10: {
    name: 'Keyboard Shortcuts',
    desc: 'Edit/disable browser shortcuts.',
    type: 'button',
    value: 'Customize Shortcuts',
    action: openShortcuts,
  },
});

export const advancedConfig = ({ options, updateOption }) => ({
  1: {
    name: 'Confirm Leave',
    desc: 'Show a confirmation when attempting to leave the site.',
    value: !!options.beforeUnload,
    type: 'switch',
    action: (b) => updateOption({ beforeUnload: b }),
  },
  2: {
    name: 'Wisp Config',
    desc: 'Configure the websocket server location.',
    value: options.wServer
      ? options.wServer
      : !isStaticBuild
        ? `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/wisp/`
        : '',
    type: 'input',
    action: (b) => updateOption({ wServer: b || null }),
  },
  3: {
    name: 'Transport',
    desc: 'Choose the request transport implementation.',
    config: transportConfig,
    value: find(transportConfig, (c) => c.value?.transport === (options.transport || 'libcurl'), 0),
    type: 'select',
    action: (a) => updateOption(a),
  },
  4: {
    name: 'Proxy Routing',
    desc: 'Choose direct local connection or a remote proxy server.',
    config: proxyRoutingConfig,
    value: find(
      proxyRoutingConfig,
      (c) => c.value?.proxyRouting === (options.proxyRouting || 'direct'),
      0,
    ),
    type: 'select',
    action: (a) => updateOption(a),
  },
  5: {
    name: 'Remote Proxy Server',
    desc: 'Used when Proxy Routing is set to Remote Proxy Server.',
    value: options.remoteProxyServer || '',
    type: 'input',
    action: (v) => updateOption({ remoteProxyServer: (v || '').trim() }),
    hidden: (options.proxyRouting || 'direct') !== 'remote',
  },
  6: {
    name: 'Cloud Save',
    desc: 'Read the Docs to learn about Cloud Save',
    value: !!options.cloudSaveEnabled,
    type: 'switch',
    action: (b) => updateOption({ cloudSaveEnabled: b }),
    disabled: true,
  },
  7: {
    name: 'Cloud Save Value',
    desc: 'Cloud Save endpoint or value.',
    value: options.cloudSave || '',
    type: 'input',
    placeholder: 'Enter Value',
    action: (v) => updateOption({ cloudSave: (v || '').trim() }),
    disabled: !options.cloudSaveEnabled,
    hidden: !options.cloudSaveEnabled,
  },
  8: {
    name: 'Cloud Save Username',
    desc: 'Username for Cloud Save access.',
    value: options.cloudSaveUsername || '',
    type: 'input',
    placeholder: 'Enter Username',
    action: (v) => updateOption({ cloudSaveUsername: (v || '').trim() }),
    disabled: !options.cloudSaveEnabled,
    hidden: !options.cloudSaveEnabled,
  },
  9: {
    name: 'Cloud Save Password',
    desc: 'Password for Cloud Save access.',
    value: options.cloudSavePassword || '',
    type: 'input',
    inputType: 'password',
    placeholder: 'Enter Password',
    action: (v) => updateOption({ cloudSavePassword: String(v || '') }),
    disabled: !options.cloudSaveEnabled,
    hidden: !options.cloudSaveEnabled,
  },
  10: {
    name: 'Reset Instance',
    desc: 'Clear your site data if you are having issues.',
    type: 'button',
    value: 'Reset Data',
    action: () => import('/src/utils/utils.js').then(({ resetInstance }) => resetInstance()),
  },
  11: {
    name: 'Debug Mode Overlay',
    desc: 'Shows a draggable live debugging overlay.',
    value: !!options.debugMode,
    type: 'switch',
    action: (b) => updateOption({ debugMode: b }),
  },
});

export const dataConfig = ({ openHistoryData, openViewData, deleteData }) => ({
  1: {
    name: 'View History',
    desc: 'See your recent browser-mode history entries.',
    type: 'button',
    value: 'View History',
    action: openHistoryData,
  },
  2: {
    name: 'View Data',
    desc: 'Inspect local and session storage values used by this instance.',
    type: 'button',
    value: 'View Data',
    action: openViewData,
  },
  3: {
    name: 'Delete Data',
    desc: 'Delete your saved browser data (history, saved tabs, custom apps, bookmarks).',
    type: 'button',
    value: 'Delete Data',
    action: deleteData,
  },
  4: {
    name: 'Export Data',
    desc: 'Export your settings, tabs, and saved local/session data.',
    type: 'button',
    value: 'Export Data',
    dividerTop: true,
    action: exportData,
  },
  5: {
    name: 'Import Data',
    desc: 'Import a backup and overwrite current data.',
    type: 'button',
    value: 'Import Data',
    action: importData,
  },
});

export const infoConfig = () => ({
  1: {
    name: 'Project Credits',
    desc: 'View project contributors and acknowledgements.',
    type: 'info',
  },
  2: {
    name: 'Open Source Licenses',
    desc: 'Review third-party packages and licenses.',
    type: 'info',
  },
  3: {
    name: 'Legal',
    desc: 'Legal information about Ghost.',
    type: 'info',
  },
  4: {
    name: 'Code and Contact',
    desc: 'Links for source code and support contact.',
    type: 'info',
  },
});

function find(config, predicate, fallbackIndex = 0) {
  const found = config.find(predicate);
  return found ? found.value : config[fallbackIndex].value; // fallback
}

function exportData() {
  window.dispatchEvent(new Event('ghost-export-data'));
}

function importData() {
  window.dispatchEvent(new Event('ghost-import-data'));
}
