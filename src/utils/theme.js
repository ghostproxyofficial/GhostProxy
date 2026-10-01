export const isLightTheme = (options) => {
  if (!options) return false;
  return options.type === 'light' || options.theme === 'light' || options.themeName === 'lightTheme';
};

export const isCustomLightTheme = (options) => {
  return options?.theme === 'custom' && options?.type === 'light';
};

export const getLuminance = (r, g, b) => {
  const toLinear = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
};

export const autoDetectLightMode = (h, s, v) => {
  // convert hsv to rgb first
  const sv = s / 100, vv = v / 100;
  const f = (n) => { const k = (n + h / 60) % 6; return vv - vv * sv * Math.max(0, Math.min(k, 4 - k, 1)); };
  const r = Math.round(f(5) * 255), g = Math.round(f(3) * 255), b = Math.round(f(1) * 255);
  const lum = getLuminance(r, g, b);
  // light if high value + low saturation, or high luminance
  if (v >= 72 && s <= 55) return 'light';
  if (lum > 0.45) return 'light';
  if (v >= 85 && s <= 80) return 'light';
  return 'dark';
};
