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
];

const prioritizeOption = (config, optionName) => {
  const index = config.findIndex((item) => item.option === optionName);
  if (index <= 0) return config;
  return [config[index], ...config.slice(0, index), ...config.slice(index + 1)];
};

const themeConfigForSettings = prioritizeOption(
  themeConfig,
  'Dark',
);
const designConfigForSettings = prioritizeOption(designConfig, 'Griddy');

const transportConfig = [
  { option: 'LibCurl', value: { transport: 'libcurl' } },
  { option: 'Epoxy', value: { transport: 'epoxy' } },
];

const proxyRoutingConfig = [
  { option: 'Direct Connection', value: { proxyRouting: 'direct' } },
  { option: 'Remote Proxy Server', value: { proxyRouting: 'remote' } },
];

const remoteProxyTypeConfig = [
  { option: 'HTTP', value: { remoteProxyType: 'http' } },
  { option: 'SOCKS4', value: { remoteProxyType: 'socks4' } },
  { option: 'SOCKS5', value: { remoteProxyType: 'socks5' } },
];

const weatherUnitConfig = [
  { option: 'Fahrenheit (°F)', value: { weatherUnit: 'fahrenheit' } },
  { option: 'Celsius (°C)', value: { weatherUnit: 'celsius' } },
];

const musicPlayerConfig = [
  { option: '--', value: { defaultMusicPlayer: '' } },
  { option: 'Ghost Music', value: { defaultMusicPlayer: 'musicplayer' } },
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
  { option: '--', value: { defaultAiProvider: '' } },
  { option: 'Duck.ai', value: { defaultAiProvider: 'duckai' } },
  { option: 'Ghost AI (Bring your own API/Endpoint)', value: { defaultAiProvider: 'ghostai' } },
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

const chatProviderConfig = [
  { option: 'Stout Chat', value: { defaultChatProvider: 'stoutchat' } },
  { option: 'Discord', value: { defaultChatProvider: 'discordchat' } },
];

const browserIdentityConfig = [
  { option: 'Mirror: real fingerprint', value: { browserIdentity: 'mirror' } },
  { option: 'Disguise: synthetic', value: { browserIdentity: 'disguise' } },
];

const userAgentConfig = [
  { option: 'Default', value: { userAgentPreset: 'default' } },
  { option: 'Chrome — Windows', value: { userAgentPreset: 'chrome-win' } },
  { option: 'Chrome — macOS', value: { userAgentPreset: 'chrome-mac' } },
  { option: 'Chrome — Linux', value: { userAgentPreset: 'chrome-linux' } },
  { option: 'Chrome — ChromeOS', value: { userAgentPreset: 'chrome-chromebook' } },
  { option: 'Chrome — Android Mobile', value: { userAgentPreset: 'chrome-android' } },
  { option: 'Chrome — Android Tablet', value: { userAgentPreset: 'chrome-android-tablet' } },
  { option: 'Chrome — iOS (CriOS)', value: { userAgentPreset: 'chrome-ios' } },
  { option: 'Safari — macOS', value: { userAgentPreset: 'safari-mac' } },
  { option: 'Safari — iPhone', value: { userAgentPreset: 'safari-iphone' } },
  { option: 'Safari — iPad', value: { userAgentPreset: 'safari-ipad' } },
  { option: 'Firefox — Windows', value: { userAgentPreset: 'firefox-win' } },
  { option: 'Firefox — macOS', value: { userAgentPreset: 'firefox-mac' } },
  { option: 'Firefox — Linux', value: { userAgentPreset: 'firefox-linux' } },
  { option: 'Firefox — Android', value: { userAgentPreset: 'firefox-android' } },
  { option: 'Edge — Windows', value: { userAgentPreset: 'edge-win' } },
  { option: 'Edge — macOS', value: { userAgentPreset: 'edge-mac' } },
  { option: 'Edge — Linux', value: { userAgentPreset: 'edge-linux' } },
  { option: 'Opera — Windows', value: { userAgentPreset: 'opera-win' } },
  { option: 'Brave — Windows', value: { userAgentPreset: 'brave-win' } },
  { option: 'Samsung — Android', value: { userAgentPreset: 'samsung-android' } },
  { option: 'Smart TV (Tizen)', value: { userAgentPreset: 'tv' } },
  { option: 'PlayStation 5', value: { userAgentPreset: 'playstation5' } },
  { option: 'Xbox Series X', value: { userAgentPreset: 'xbox' } },
  { option: 'Nintendo Switch', value: { userAgentPreset: 'nintendo-switch' } },
  { option: 'Googlebot', value: { userAgentPreset: 'googlebot' } },
  { option: 'Custom', value: { userAgentPreset: 'custom' } },
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
  '1a': {
    name: 'Custom Site Title',
    desc: 'Enter your custom site title here.',
    value: options.customSiteTitle || '',
    type: 'input',
    placeholder: 'My Custom Title...',
    hidden: options.tabName !== 'Custom',
    action: (v) => updateOption({ customSiteTitle: v }),
  },
  '1b': {
    name: 'Custom Site Favicon',
    desc: 'Enter a URL for your custom site favicon.',
    value: options.customSiteIcon || '',
    type: 'input',
    placeholder: 'https://example.com/favicon.ico',
    hidden: options.tabName !== 'Custom',
    action: (v) => updateOption({ customSiteIcon: v }),
  },
  2: {
    name: 'Stealth Mode',
    desc: 'Obfuscates page text with lookalike characters to bypass screen monitoring and filters.',
    value: options.stealthMode ?? 0,
    type: 'slider',
    min: 0,
    max: 2,
    step: 1,
    action: (v) => updateOption({ stealthMode: parseInt(v) || 0 }),
    customValueLabel: (v) => {
      if (v == 0) return 'Level 0: Disabled';
      if (v == 1) return 'Level 1: Subtle';
      if (v == 2) return 'Level 2: Max';
      return '';
    },
  },
  '2a': {
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
  7: {
    name: 'Hide Location',
    desc: 'Hide location details in the Ghost menu and home screen info card.',
    value: !!options.hideLocation,
    type: 'switch',
    action: (b) => setTimeout(() => updateOption({ hideLocation: b }), 100),
  },
  9: {
    name: 'Anti Close',
    desc: 'Show a confirmation popup before any tab close action.',
    value: !!options.antiClose,
    type: 'switch',
    action: (b) => setTimeout(() => updateOption({ antiClose: b }), 100),
  },
  10: {
    name: 'Browser Identity',
    desc: 'Mirror is your real fingerprint and disguise is a synthetic one.',
    config: browserIdentityConfig,
    value: (browserIdentityConfig.find((c) => c.value.browserIdentity === (options.browserIdentity || 'mirror')) || browserIdentityConfig[0]).value,
    type: 'select',
    action: (a) => updateOption(a),
  },
});

export const customizeConfig = ({ options, updateOption, openCssEditor }) => ({
  1: {
    name: 'Site Theme',
    desc: 'Customize the appearance of the website by selecting a theme.',
    config: themeConfigForSettings,
    value: find(
      themeConfigForSettings,
      (c) =>
        c.value?.themeName ===
        (options.theme === 'custom' ? options.lastThemePresetName || 'darkTheme' : options.themeName),
      0,
    ),
    type: 'select',
    action: (a) =>
      updateOption({
        ...a,
        lastThemePresetName: a?.themeName || options.lastThemePresetName || 'darkTheme',
      }),
    disabled: options.theme === 'custom',
    disabledAction: openCssEditor?.confirmCustomThemePresetSwitch,
  },
  2: {
    name: 'Custom Theme',
    desc: 'Create a custom theme from a single accent color.',
    type: 'button',
    value: 'Open Custom Theme',
    action: openCssEditor?.openCustomTheme,
  },
  3: {
    name: 'Animated Background',
    desc: 'Browse and preview animated backgrounds with customizable styles.',
    type: 'button',
    value: options.customAnimatedBackground ? `Active: ${options.customAnimatedBackground}` : 'Open Background Editor',
    action: openCssEditor?.openBackgroundEditor,
    disabled: !!options.customBackgroundImage,
  },
  4: {
    name: 'Image/GIF Background',
    desc: 'Upload a custom image or GIF as your background. Overrides Animated Background and Background Design.',
    type: 'button-group',
    disabled: !!options.customAnimatedBackground,
    buttons: [
      {
        value: options.customBackgroundImage ? 'Change Image' : 'Upload Image',
        action: () => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (ev) => {
                updateOption({ customBackgroundImage: ev.target.result, customAnimatedBackground: false, bgDesign: 'None' });
              };
              reader.readAsDataURL(file);
            }
          };
          input.click();
        },
      },
      ...(options.customBackgroundImage ? [{
        value: 'Clear',
        action: () => updateOption({ customBackgroundImage: '' }),
      }] : []),
    ],
  },
  5: {
    name: 'Background Design',
    desc: "Customize the site's background design.",
    config: designConfigForSettings,
    value: find(designConfigForSettings, (c) => c.value?.bgDesign === options.bgDesign, 0),
    type: 'select',
    action: (a) => updateOption(a),
    disabled: !!options.customAnimatedBackground || !!options.customBackgroundImage,
  },
  6: {
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
  7: {
    name: 'Gradient Text',
    desc: 'Makes sitewide headings use a gradient matching your theme.',
    value: !!options.gradientText,
    type: 'switch',
    action: (b) => setTimeout(() => updateOption({ gradientText: b }), 100),
  },
  8: {
    name: 'Typography',
    desc: 'Set any Google Font name (example: Inter, Poppins, Roboto). Some fonts may not fit to elements well.',
    value: options.globalFont || 'Inter',
    type: 'input',
    action: (v) => updateOption({ globalFont: (v || 'Inter').trim() || 'Inter' }),
  },
  9: {
    name: 'Navigation Scale',
    desc: 'Scale navigation bar size (logo & font) globally.',
    config: navScaleConfig,
    value: find(navScaleConfig, (c) => c.value.navScale === (options.navScale ?? 1), 3),
    type: 'select',
    action: (a) => updateOption(a),
  },
  10: {
    name: 'Apps per Page',
    desc: 'Number of apps to show per page ("All" will show everything).',
    config: appsPerPageConfig,
    value: find(appsPerPageConfig, (c) => c.value.itemsPerPage === (options.itemsPerPage ?? 50), 3),
    type: 'select',
    action: (a) => updateOption(a),
  },
  11: {
    name: 'Performance Mode',
    desc: 'Disable heavy animations and app/media icon loading for faster performance.',
    value: !!options.performanceMode,
    type: 'switch',
    action: (b) => setTimeout(() => updateOption({ performanceMode: b }), 100),
  },
  12: {
    name: 'Magic Pill',
    desc: 'Enable the expanding info card on Ghost Home. When disabled, it just shows as text on the background.',
    value: !!options.magicPill,
    type: 'switch',
    action: (b) => setTimeout(() => updateOption({ magicPill: b }), 100),
  },
  13: {
    name: 'Sidebar Editor',
    desc: 'Add custom apps and manage sidebar toggles.',
    type: 'button',
    value: 'Open Sidebar Editor',
    action: openCssEditor?.openSidebarEditor,
  },
  '13a': {
    name: 'Liquid Glass',
    desc: 'Translucent blurred surfaces with tint. Blur and tint sliders appear when enabled.',
    value: !!options.liquidGlassEnabled,
    type: 'switch',
    action: (b) => updateOption({ liquidGlassEnabled: !!b }),
  },
  '13b': {
    name: 'Glass Blur',
    desc: 'Blur amount for liquid glass (0–20px).',
    value: Number(options.liquidGlassBlur ?? 18),
    type: 'slider',
    min: 0,
    max: 20,
    step: 1,
    hidden: !options.liquidGlassEnabled,
    action: (v) => updateOption({ liquidGlassBlur: Math.max(0, Math.min(20, Number(v) || 0)) }),
  },
  '13c': {
    name: 'Glass Tint',
    desc: 'Tint opacity for glass surfaces (0–0.40).',
    value: Number(options.liquidGlassTint ?? 0.12),
    type: 'slider',
    min: 0,
    max: 0.4,
    step: 0.01,
    hidden: !options.liquidGlassEnabled,
    action: (v) => updateOption({ liquidGlassTint: Math.max(0, Math.min(0.4, Number(v) || 0)) }),
  },
  '13d': {
    name: 'Quick AI (Top-Right)',
    desc: 'Intelligent Quick AI feature in the top right.',
    value: options.haloEnabled !== false,
    type: 'switch',
    action: (b) => updateOption({ haloEnabled: !!b }),
  },
  15: {
    name: 'Clock Format',
    desc: 'Use 12-hour or 24-hour time in the Ghost menu. Default is 12-hour.',
    value: !!options.clock24Hour,
    type: 'switch',
    action: (b) => setTimeout(() => updateOption({ clock24Hour: b }), 100),
  },
  16: {
    name: 'Timezone Override',
    desc: 'Optional IANA timezone (example: America/New_York). Leave empty to auto-detect from your IP.',
    value: options.timezoneOverride || '',
    type: 'input',
    placeholder: 'Auto (IP timezone)',
    action: (v) => updateOption({ timezoneOverride: (v || '').trim() || null }),
  },
  17: {
    name: 'Use Your Location (IP)',
    desc: 'Use your IP-based location for menu weather.',
    value: options.weatherUseIpLocation !== false,
    type: 'switch',
    action: (b) => setTimeout(() => updateOption({ weatherUseIpLocation: b }), 100),
  },
  18: {
    name: 'Weather Unit',
    desc: 'Choose the temperature unit shown in the Ghost menu weather.',
    config: weatherUnitConfig,
    value: find(weatherUnitConfig, (c) => c.value?.weatherUnit === (options.weatherUnit || 'fahrenheit'), 0),
    type: 'select',
    action: (a) => updateOption(a),
  },
  19: {
    name: 'Weather Coords Override',
    desc: 'Optional coordinates when IP location is disabled (format: lat,lon).',
    value: options.weatherCoordsOverride || '',
    type: 'input',
    placeholder: '40.7128,-74.0060',
    action: (v) => updateOption({ weatherCoordsOverride: (v || '').trim() }),
    hidden: options.weatherUseIpLocation !== false,
  },
  20: {
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
  21: {
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
  22: {
    name: 'Chat Provider',
    desc: 'What chat provider opens when you click the Chat button.',
    config: chatProviderConfig,
    dropdownDirection: 'up',
    value: find(
      chatProviderConfig,
      (c) => c.value?.defaultChatProvider === String(options.defaultChatProvider || ''),
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

const resolveUserAgentLabel = (preset) => {
  const hit = userAgentConfig.find((c) => c.value.userAgentPreset === preset);
  return hit ? hit.option : 'Default';
};

export const advancedConfig = ({ options, updateOption, openCssEditor }) => ({
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
    // an empty custom value falls back to the default endpoint
    value: options.wServer || '',
    type: 'input',
    action: (b) => {
      const raw = String(b || '').trim();
      updateOption({
        wServer: raw || null,
        proxyRouting: 'direct',
      });
    },
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
    name: 'Remote Proxy Type',
    desc: 'Choose the protocol for your remote proxy server.',
    config: remoteProxyTypeConfig,
    value: find(
      remoteProxyTypeConfig,
      (c) => c.value?.remoteProxyType === (options.remoteProxyType || 'http'),
      0,
    ),
    type: 'select',
    action: (a) => updateOption(a),
    hidden: (options.proxyRouting || 'direct') !== 'remote',
  },
  6: {
    name: 'Remote Proxy Server',
    desc: 'Remote proxy host/IP (no scheme needed; selected protocol above is applied).',
    value: options.remoteProxyServer || '',
    type: 'input',
    action: (v) => updateOption({ remoteProxyServer: (v || '').trim() }),
    hidden: (options.proxyRouting || 'direct') !== 'remote',
  },
  7: {
    name: 'Cloud Save',
    desc: 'Read the Docs to learn about Cloud Save',
    value: !!options.cloudSaveEnabled,
    type: 'switch',
    action: (b) => updateOption({ cloudSaveEnabled: b }),
    disabled: true,
  },
  8: {
    name: 'Cloud Save Value',
    desc: 'Cloud Save endpoint or value.',
    value: options.cloudSave || '',
    type: 'input',
    placeholder: 'Enter Value',
    action: (v) => updateOption({ cloudSave: (v || '').trim() }),
    disabled: !options.cloudSaveEnabled,
    hidden: !options.cloudSaveEnabled,
  },
  9: {
    name: 'Cloud Save Username',
    desc: 'Username for Cloud Save access.',
    value: options.cloudSaveUsername || '',
    type: 'input',
    placeholder: 'Enter Username',
    action: (v) => updateOption({ cloudSaveUsername: (v || '').trim() }),
    disabled: !options.cloudSaveEnabled,
    hidden: !options.cloudSaveEnabled,
  },
  10: {
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
  11: {
    name: 'Reset Instance',
    desc: 'Clear your site data if you are having issues.',
    type: 'button',
    value: 'Reset Data',
    action: () => import('/src/utils/utils.js').then(({ resetInstance }) => resetInstance()),
  },
  12: {
    name: 'Debug Mode Overlay',
    desc: 'Shows a draggable live debugging overlay.',
    value: !!options.debugMode,
    type: 'switch',
    action: (b) => updateOption({ debugMode: b }),
  },
  13: {
    name: 'User Agent',
    desc: 'Override the browser User-Agent. YouTube always uses a TV UA and cannot be overridden.',
    config: userAgentConfig,
    value: (userAgentConfig.find((c) => c.value.userAgentPreset === (options.userAgentPreset || 'default')) || userAgentConfig[0]).value,
    type: 'select',
    action: (a) => updateOption(a),
  },
  14: {
    name: 'Custom User Agent',
    desc: 'Only used when User Agent is set to Custom.',
    value: options.customUserAgent || '',
    type: 'input',
    placeholder: 'Mozilla/5.0 ...',
    hidden: (options.userAgentPreset || 'default') !== 'custom',
    action: (v) => updateOption({ customUserAgent: String(v || '') }),
  },
  15: {
    name: 'CSS Editor (Variables)',
    desc: 'Edit every theme variable with a friendly GUI + raw CSS.',
    type: 'button',
    value: 'Open CSS Editor',
    action: () => openCssEditor?.openCssEditor?.(),
  },
  16: {
    name: 'Scramjet: Rewriter Logs',
    desc: 'Enable Scramjet rewriter logging (verbose, experimental).',
    value: !!options.experimentalScramjetLogs,
    type: 'switch',
    action: (b) => updateOption({ experimentalScramjetLogs: !!b }),
  },
  17: {
    name: 'Scramjet: Sourcemaps',
    desc: 'Enable Scramjet sourcemaps.',
    value: options.experimentalScramjetSourcemaps !== false,
    type: 'switch',
    action: (b) => updateOption({ experimentalScramjetSourcemaps: !!b }),
  },
  18: {
    name: 'Scramjet: Scramitize',
    desc: 'Experimental scramitize flag for Scramjet (may break pages).',
    value: !!options.experimentalScramjetScramitize,
    type: 'switch',
    action: (b) => updateOption({ experimentalScramjetScramitize: !!b }),
  },
  19: {
    name: 'UV Prefix Override',
    desc: 'Override UV prefix (e.g. /uv/service/). Leave blank for default.',
    value: options.experimentalUvPrefix || '',
    type: 'input',
    placeholder: '/uv/service/',
    action: (v) => updateOption({ experimentalUvPrefix: String(v || '').trim() }),
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
  5: {
    name: 'Frequently Asked Questions',
    desc: 'Common answers about links, compatibility, and reporting bugs.',
    type: 'info',
  },
  6: {
    name: 'Build',
    desc: 'Current Ghost build details.',
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
