import { resolveUserAgent, GENERIC_PC_UA, getEffectiveUserAgent, getEffectiveIdentity } from '/src/data/userAgents';

const SYNTHETIC_KEY = 'ghostSyntheticIdentity';
const SYNTHETIC_NONCE_KEY = 'ghostSyntheticNonce';

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick(arr, seed) {
  return arr[seed % arr.length];
}

const PLATFORMS = ['Win32', 'MacIntel', 'Linux x86_64'];
const LANGUAGES = ['en-US', 'en-GB', 'de-DE', 'fr-FR', 'es-ES'];
const TIMEZONES = ['America/New_York', 'Europe/London', 'Europe/Berlin', 'America/Los_Angeles', 'Asia/Tokyo'];
const WEBGL_RENDERERS = [
  'ANGLE (NVIDIA, NVIDIA GeForce GTX 1060 Direct3D11 vs_5_0 ps_5_0, D3D11)',
  'ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0, D3D11)',
  'ANGLE (AMD, AMD Radeon RX 580 Series Direct3D11 vs_5_0 ps_5_0, D3D11)',
  'Apple GPU',
];

function buildIdentity(options, seed) {
// platform has to match the ua string, a mismatched pair is an instant
// fingerprinting tell
  let ua = null;
  let platform = null;
  try {
    const identity = getEffectiveIdentity(options, null);
    ua = identity?.ua || null;
    platform = identity?.platform || null;
  } catch {}
  return {
    ua: ua || resolveUserAgent(options) || GENERIC_PC_UA,
    platform: platform || pick(PLATFORMS, seed),
    language: pick(LANGUAGES, seed >> 8),
    timezone: pick(TIMEZONES, seed >> 16),
    webglRenderer: pick(WEBGL_RENDERERS, seed >> 4),
    canvasNoise: (seed % 7) - 3,
    screenJitter: (seed % 5) - 2,
  };
}

export function getSyntheticIdentity(options) {
  if ((options?.browserIdentity || 'mirror') !== 'disguise') return null;
  try {
    const raw = localStorage.getItem(SYNTHETIC_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.ua) return parsed;
    }
  } catch {}
  let nonce = '';
  try { nonce = localStorage.getItem(SYNTHETIC_NONCE_KEY) || ''; } catch {}
  let profileId = 'default';
  try { profileId = localStorage.getItem('ghostBrowserActiveProfileId') || 'default'; } catch {}
  const base = String(options?.userAgentPreset || 'default') + '|' + profileId + (nonce ? '|' + nonce : '');
  const seed = hashString(base);
  const identity = buildIdentity(options, seed);
  try { localStorage.setItem(SYNTHETIC_KEY, JSON.stringify(identity)); } catch {}
  return identity;
}

export function regenerateSyntheticIdentity(options) {
  try { localStorage.removeItem(SYNTHETIC_KEY); } catch {}
  // deterministic nonce, bump a counter instead of using the clock
  try {
    const prev = parseInt(localStorage.getItem(SYNTHETIC_NONCE_KEY) || '0', 10);
    localStorage.setItem(SYNTHETIC_NONCE_KEY, String((Number.isFinite(prev) ? prev : 0) + 1));
  } catch {}
  return getSyntheticIdentity(options);
}

export function getSpoofedUserAgent(options, url) {
  // one place decides: youtube gets the tv ua, disguise spoofs, mirror passes through
  return getEffectiveUserAgent(options, url);
}
