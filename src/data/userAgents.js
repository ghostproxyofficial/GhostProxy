export const USER_AGENT_MAP = {
  'default': null, // use real UA
  'chrome-win': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'chrome-mac': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'chrome-linux': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'chrome-chromebook': 'Mozilla/5.0 (X11; CrOS x86_64 15917.71.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'chrome-android': 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
  'chrome-android-tablet': 'Mozilla/5.0 (Linux; Android 14; Pixel Tablet) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'chrome-ios': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1',
  'safari-mac': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
  'safari-iphone': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  'safari-ipad': 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  'firefox-win': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0',
  'firefox-mac': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.7; rv:132.0) Gecko/20100101 Firefox/132.0',
  'firefox-linux': 'Mozilla/5.0 (X11; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0',
  'firefox-android': 'Mozilla/5.0 (Android 14; Mobile; rv:132.0) Gecko/132.0 Firefox/132.0',
  'edge-win': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
  'edge-mac': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
  'edge-linux': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
  'opera-win': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 OPR/115.0.0.0',
  'brave-win': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Brave/131',
  'samsung-android': 'Mozilla/5.0 (Linux; Android 14; SAMSUNG SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/27.0 Chrome/125.0.0.0 Mobile Safari/537.36',
  'tv': 'Mozilla/5.0 (SMART-TV; LINUX; Tizen 6.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36',
  'playstation5': 'Mozilla/5.0 (PlayStation; PlayStation 5/2.26) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0 Safari/605.1.15',
  'xbox': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; Xbox; Xbox Series X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.82 Safari/537.36 Edge/20.02',
  'nintendo-switch': 'Mozilla/5.0 (Nintendo Switch; WifiWebAuthApplet) AppleWebKit/609.4 (KHTML, like Gecko) NF/6.0.2.21.3 NintendoBrowser/5.1.0.22023',
  'googlebot': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
};

export const YOUTUBE_TV_UA = USER_AGENT_MAP['tv'];

// generic pc user, disguise fallback when nothing is picked.
// never the tv ua, sites serve tv layouts or break on it
export const GENERIC_PC_PRESET = 'chrome-win';
export const GENERIC_PC_UA = USER_AGENT_MAP[GENERIC_PC_PRESET];

// platform, vendor and userAgentData all have to agree with the ua string.
// brands: null means the browser has no userAgentData at all so shadow it
// undefined instead of making up chromium brands
const chromiumBrands = (chromeVersion, extra) => [
  { brand: 'Chromium', version: String(chromeVersion) },
  ...(extra ? [extra] : []),
  { brand: 'Google Chrome', version: String(chromeVersion) },
  { brand: 'Not-A.Brand', version: '24' },
];

export const USER_AGENT_IDENTITY = {
  'chrome-win': { platform: 'Win32', uadPlatform: 'Windows', mobile: false, vendor: 'Google Inc.', brands: chromiumBrands(131) },
  'chrome-mac': { platform: 'MacIntel', uadPlatform: 'macOS', mobile: false, vendor: 'Google Inc.', brands: chromiumBrands(131) },
  'chrome-linux': { platform: 'Linux x86_64', uadPlatform: 'Linux', mobile: false, vendor: 'Google Inc.', brands: chromiumBrands(131) },
  'chrome-chromebook': { platform: 'Linux x86_64', uadPlatform: 'ChromeOS', mobile: false, vendor: 'Google Inc.', brands: chromiumBrands(131) },
  'chrome-android': { platform: 'Linux armv8l', uadPlatform: 'Android', mobile: true, vendor: 'Google Inc.', brands: chromiumBrands(131) },
  'chrome-android-tablet': { platform: 'Linux armv8l', uadPlatform: 'Android', mobile: true, vendor: 'Google Inc.', brands: chromiumBrands(131) },
  'chrome-ios': { platform: 'iPhone', uadPlatform: 'iOS', mobile: true, vendor: 'Google Inc.', brands: chromiumBrands(131) },
  'safari-mac': { platform: 'MacIntel', uadPlatform: null, mobile: false, vendor: 'Apple Computer, Inc.', brands: null },
  'safari-iphone': { platform: 'iPhone', uadPlatform: null, mobile: true, vendor: 'Apple Computer, Inc.', brands: null },
  'safari-ipad': { platform: 'iPad', uadPlatform: null, mobile: true, vendor: 'Apple Computer, Inc.', brands: null },
  'firefox-win': { platform: 'Win32', uadPlatform: null, mobile: false, vendor: '', brands: null },
  'firefox-mac': { platform: 'MacIntel', uadPlatform: null, mobile: false, vendor: '', brands: null },
  'firefox-linux': { platform: 'Linux x86_64', uadPlatform: null, mobile: false, vendor: '', brands: null },
  'firefox-android': { platform: 'Linux armv8l', uadPlatform: null, mobile: true, vendor: '', brands: null },
  'edge-win': { platform: 'Win32', uadPlatform: 'Windows', mobile: false, vendor: 'Google Inc.', brands: [{ brand: 'Chromium', version: '131' }, { brand: 'Microsoft Edge', version: '131' }, { brand: 'Not-A.Brand', version: '24' }] },
  'edge-mac': { platform: 'MacIntel', uadPlatform: 'macOS', mobile: false, vendor: 'Google Inc.', brands: [{ brand: 'Chromium', version: '131' }, { brand: 'Microsoft Edge', version: '131' }, { brand: 'Not-A.Brand', version: '24' }] },
  'edge-linux': { platform: 'Linux x86_64', uadPlatform: 'Linux', mobile: false, vendor: 'Google Inc.', brands: [{ brand: 'Chromium', version: '131' }, { brand: 'Microsoft Edge', version: '131' }, { brand: 'Not-A.Brand', version: '24' }] },
  'opera-win': { platform: 'Win32', uadPlatform: 'Windows', mobile: false, vendor: 'Google Inc.', brands: [{ brand: 'Chromium', version: '130' }, { brand: 'Opera', version: '115' }, { brand: 'Not-A.Brand', version: '24' }] },
  'brave-win': { platform: 'Win32', uadPlatform: 'Windows', mobile: false, vendor: 'Google Inc.', brands: chromiumBrands(131) },
  'samsung-android': { platform: 'Linux armv8l', uadPlatform: 'Android', mobile: true, vendor: 'Google Inc.', brands: [{ brand: 'Chromium', version: '125' }, { brand: 'Samsung Internet', version: '27' }, { brand: 'Not-A.Brand', version: '24' }] },
  'tv': { platform: 'Linux armv7l', uadPlatform: 'Linux', mobile: false, vendor: 'Google Inc.', brands: [{ brand: 'Chromium', version: '85' }, { brand: 'Google Chrome', version: '85' }, { brand: 'Not-A.Brand', version: '99' }] },
  'playstation5': { platform: 'PlayStation 5', uadPlatform: null, mobile: false, vendor: 'Apple Computer, Inc.', brands: null },
  'xbox': { platform: 'Win32', uadPlatform: 'Windows', mobile: false, vendor: 'Google Inc.', brands: [{ brand: 'Chromium', version: '48' }, { brand: 'Microsoft Edge', version: '20' }, { brand: 'Not-A.Brand', version: '99' }] },
  'nintendo-switch': { platform: 'Nintendo Switch', uadPlatform: null, mobile: false, vendor: '', brands: null },
  'googlebot': { platform: 'Linux x86_64', uadPlatform: null, mobile: false, vendor: 'Google Inc.', brands: null },
};

// guess an identity from a custom ua string
export function inferIdentityFromUA(uaString) {
  const raw = String(uaString || '').toLowerCase();
  const has = (...tokens) => tokens.some((t) => raw.includes(t));
  const mobile = has('mobile', 'android', 'iphone', 'ipad');
  let platform = 'Win32';
  if (has('iphone')) platform = 'iPhone';
  else if (has('ipad')) platform = 'iPad';
  else if (has('android')) platform = 'Linux armv8l';
  else if (has('macintosh', 'mac os')) platform = 'MacIntel';
  else if (has('linux')) platform = 'Linux x86_64';
  else if (has('windows')) platform = 'Win32';
  if (has('firefox', 'fxios')) {
    return { platform, uadPlatform: null, mobile, vendor: '', brands: null };
  }
  if (has('safari') && !has('chrome', 'chromium', 'crios', 'edg', 'opr', 'samsungbrowser')) {
    return { platform, uadPlatform: null, mobile, vendor: 'Apple Computer, Inc.', brands: null };
  }
  const version = (raw.match(/(?:chrome|crios)\/(\d+)/) || [])[1] || '131';
  const brands = chromiumBrands(version);
  if (has('edg')) brands.splice(1, 0, { brand: 'Microsoft Edge', version: (raw.match(/edg(?:a|ios)?\/(\d+)/) || [])[1] || version });
  if (has('opr/')) brands.splice(1, 0, { brand: 'Opera', version: (raw.match(/opr\/(\d+)/) || [])[1] || version });
  if (has('samsungbrowser')) brands.splice(1, 0, { brand: 'Samsung Internet', version: (raw.match(/samsungbrowser\/(\d+(?:\.\d+)?)/) || [])[1] || version });
  const uadPlatform = has('android') ? 'Android' : has('iphone', 'ipad') || has('crios') ? 'iOS' : has('macintosh', 'mac os') ? 'macOS' : has('linux') ? 'Linux' : 'Windows';
  return { platform, uadPlatform, mobile, vendor: 'Google Inc.', brands };
}

export function getIdentityForPreset(preset) {
  const key = String(preset || 'default').toLowerCase();
  if (key === 'custom') return null;
  return USER_AGENT_IDENTITY[key] || null;
}

// coherent { ua, platform, vendor, mobile, uadPlatform, brands }, null means
// theres nothing to spoof so the caller leaves the natives alone
export function getEffectiveIdentity(options, url) {
  if (url && isYouTubeUrl(url)) {
    return { ua: YOUTUBE_TV_UA, ...USER_AGENT_IDENTITY['tv'] };
  }
  const preset = String(options?.userAgentPreset || 'default').toLowerCase();
  const disguise = (options?.browserIdentity || 'mirror') === 'disguise';
  const resolved = resolveUserAgent(options);
  if (!disguise && !resolved) return null;
  const ua = resolved || GENERIC_PC_UA;
  if (preset === 'custom') {
    const custom = String(options?.customUserAgent || '').trim();
    if (custom) return { ua: custom, ...inferIdentityFromUA(custom) };
    return { ua: GENERIC_PC_UA, ...USER_AGENT_IDENTITY[GENERIC_PC_PRESET] };
  }
  const identity = USER_AGENT_IDENTITY[preset];
  if (!identity) return { ua, ...USER_AGENT_IDENTITY[GENERIC_PC_PRESET] };
  return { ua, ...identity };
}

export function resolveUserAgent(options) {
  const preset = String(options?.userAgentPreset || 'default').toLowerCase();
  if (preset === 'custom') {
    const custom = String(options?.customUserAgent || '').trim();
    if (custom) return custom;
    return null;
  }
  return USER_AGENT_MAP[preset] ?? null;
}

export function isYouTubeUrl(url) {
  try {
    const parsed = new URL(String(url), location.origin);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
    return host === 'youtube.com' || host === 'youtu.be' || host === 'm.youtube.com' || host.endsWith('.youtube.com');
  } catch {
    const raw = String(url || '').toLowerCase();
    return raw.includes('youtube.com') || raw.includes('youtu.be');
  }
}

export function getEffectiveUserAgent(options, url) {
  // youtube always gets the tv ua or playback breaks, not overridable
  if (url && isYouTubeUrl(url)) return YOUTUBE_TV_UA;

  const resolved = resolveUserAgent(options);

// disguise never shows the real ua. a preset resolving to null ("default")
// means use the generic pc ua
  if ((options?.browserIdentity || 'mirror') === 'disguise') {
    return resolved || GENERIC_PC_UA;
  }

  // mirror uses the real ua unless they picked a preset or custom one
  return resolved;
}
