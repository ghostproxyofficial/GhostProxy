import Search from '../SearchContainer';
import QuickLinks from '../QuickLinks';
import Logo from '../Logo';
import Footer from '../Footer';
import clsx from 'clsx';
import {
  Battery,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Sun,
} from 'lucide-react';

import { process } from '/src/utils/hooks/loader/utils';
import { useOptions } from '/src/utils/optionsContext';
import { useEffect, useMemo, useState } from 'react';
import loaderStore from '/src/utils/hooks/loader/useLoaderStore';
import { createId } from '/src/utils/id';

const NewTab = ({ id, updateFn }) => {
  const { options } = useOptions();
  const addTab = loaderStore((state) => state.addTab);
  const setActive = loaderStore((state) => state.setActive);
  const [menuClockNow, setMenuClockNow] = useState(Date.now());
  const [batteryInfo, setBatteryInfo] = useState({ level: null, charging: false });
  const [ipMeta, setIpMeta] = useState({ timezone: '', latitude: null, longitude: null, city: '' });
  const [menuWeather, setMenuWeather] = useState({ temp: null, weatherCode: null, isDay: true });
  const [forecastDays, setForecastDays] = useState([]);
  const [infoCardOpen, setInfoCardOpen] = useState(false);
  const WEATHER_COORDS_CACHE_KEY = 'ghostWeatherCoordsCache';
  const WEATHER_FALLBACK_COORDS = { lat: 40.7128, lon: -74.006 };

  const parseCoords = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return null;
    const [latRaw, lonRaw] = raw.split(',').map((p) => p?.trim?.() || '');
    const lat = Number(latRaw);
    const lon = Number(lonRaw);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
    return { lat, lon };
  };

  const readCachedCoords = () => {
    try {
      const raw = localStorage.getItem(WEATHER_COORDS_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const lat = Number(parsed?.lat);
      const lon = Number(parsed?.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
      return { lat, lon };
    } catch {
      return null;
    }
  };

  const writeCachedCoords = (coords) => {
    if (!coords || !Number.isFinite(coords.lat) || !Number.isFinite(coords.lon)) return;
    try {
      localStorage.setItem(WEATHER_COORDS_CACHE_KEY, JSON.stringify({ lat: coords.lat, lon: coords.lon, t: Date.now() }));
    } catch { }
  };

  const getBrowserCoords = () =>
    new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = Number(position?.coords?.latitude);
          const lon = Number(position?.coords?.longitude);
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
            resolve(null);
            return;
          }
          resolve({ lat, lon });
        },
        () => resolve(null),
        { enableHighAccuracy: false, maximumAge: 15 * 60 * 1000, timeout: 6000 },
      );
    });

  const weatherUnitLabel = (options.weatherUnit || 'fahrenheit') === 'celsius' ? 'C' : 'F';

  const resolveWeatherIcon = (rawCode) => {
    const code = Number(rawCode);
    if (!Number.isFinite(code)) return Cloud;
    if (code === 0) return Sun;
    if (code === 45 || code === 48) return CloudFog;
    if ([95, 96, 99].includes(code)) return CloudLightning;
    if ([71, 73, 75, 77, 85, 86].includes(code)) return CloudSnow;
    if ([51, 53, 55, 56, 57].includes(code)) return CloudDrizzle;
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return CloudRain;
    return Cloud;
  };

  const weatherIcon = useMemo(() => resolveWeatherIcon(menuWeather.weatherCode), [menuWeather.weatherCode]);

  const effectiveTimezone = useMemo(() => {
    const override = String(options.timezoneOverride || '').trim();
    if (override) return override;
    if (ipMeta.timezone) return ipMeta.timezone;
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  }, [options.timezoneOverride, ipMeta.timezone]);

  const menuTimeLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: !(options.clock24Hour === true),
        timeZone: effectiveTimezone,
      }).format(menuClockNow);
    } catch {
      return new Date(menuClockNow).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: !(options.clock24Hour === true),
      });
    }
  }, [menuClockNow, options.clock24Hour, effectiveTimezone]);

  const menuDateLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat([], {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: effectiveTimezone,
      }).format(menuClockNow);
    } catch {
      return new Date(menuClockNow).toLocaleDateString();
    }
  }, [menuClockNow, effectiveTimezone]);

  const infoCardBg = options.menuColor || options.quickModalBgColor || 'rgba(15, 20, 29, 0.88)';
  const infoCardSubtleBg = options.quickModalBgColor || options.omninputColor || 'rgba(0, 0, 0, 0.22)';
  const infoCardText = options.siteTextColor || '#b4bcc8';
  const infoCardBorder = options.type === 'light' ? 'rgba(15,23,42,0.14)' : 'rgba(255,255,255,0.12)';

  useEffect(() => {
    const map = {
      duckduckgo: 'https://duckduckgo.com',
      google: 'https://google.com',
      blank: 'about:blank',
    };

    const selected = options.newTabPage || 'ghost';
    const target = map[selected];
    if (!target) return;

    if (target === 'about:blank') {
      updateFn(id, target, false);
      return;
    }

    const processed = process(target, false, options.prType || 'auto', options.engine || null);
    updateFn(id, processed, false);
  }, [id, updateFn, options.newTabPage, options.prType, options.engine]);

  useEffect(() => {
    const interval = setInterval(() => setMenuClockNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadBattery = async () => {
      try {
        const battery = await navigator.getBattery?.();
        if (!battery || cancelled) return;

        const update = () => {
          if (cancelled) return;
          setBatteryInfo({
            level: Math.round((battery.level || 0) * 100),
            charging: !!battery.charging,
          });
        };

        update();
        battery.addEventListener('levelchange', update);
        battery.addEventListener('chargingchange', update);
      } catch { }
    };

    loadBattery();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const parseProviderMeta = (payload, source) => {
      if (!payload || typeof payload !== 'object') return null;

      if (source === 'ipapi') {
        return {
          timezone: String(payload.timezone || ''),
          latitude: Number(payload.latitude),
          longitude: Number(payload.longitude),
          city: String(payload.city || ''),
        };
      }

      if (source === 'ipwho') {
        const zone = typeof payload.timezone === 'string'
          ? payload.timezone
          : payload?.timezone?.id || '';
        return {
          timezone: String(zone || ''),
          latitude: Number(payload.latitude),
          longitude: Number(payload.longitude),
          city: String(payload.city || ''),
        };
      }

      if (source === 'ipinfo') {
        const loc = String(payload.loc || '').split(',');
        return {
          timezone: String(payload.timezone || ''),
          latitude: Number(loc[0]),
          longitude: Number(loc[1]),
          city: String(payload.city || ''),
        };
      }

      return null;
    };

    const isValidMeta = (meta) =>
      !!meta &&
      Number.isFinite(meta.latitude) &&
      Number.isFinite(meta.longitude) &&
      meta.latitude >= -90 &&
      meta.latitude <= 90 &&
      meta.longitude >= -180 &&
      meta.longitude <= 180;



    const fetchIpMeta = async () => {
      const providers = [
        { url: 'https://ipapi.co/json/', source: 'ipapi' },
        { url: 'https://ipwho.is/', source: 'ipwho' },
        { url: 'https://ipinfo.io/json', source: 'ipinfo' },
      ];

      for (const provider of providers) {
        try {
          const response = await fetch(provider.url);
          if (!response.ok) continue;
          const data = await response.json();
          const parsed = parseProviderMeta(data, provider.source);
          if (!isValidMeta(parsed)) continue;
          if (cancelled) return;
          writeCachedCoords({ lat: parsed.latitude, lon: parsed.longitude });
          setIpMeta(parsed);
          return;
        } catch { }
      }

      const browserCoords = await getBrowserCoords();
      if (!browserCoords || cancelled) return;
      writeCachedCoords(browserCoords);
      const fallbackTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      setIpMeta((prev) => ({
        ...prev,
        latitude: browserCoords.lat,
        longitude: browserCoords.lon,
        timezone: prev.timezone || fallbackTimezone,
      }));
    };

    fetchIpMeta();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchWeather = async () => {
      try {
        let coords = null;
        const useIpLocation = options.weatherUseIpLocation !== false;

        if (!useIpLocation) {
          coords = parseCoords(options.weatherCoordsOverride || '');
        }

        if (!coords && Number.isFinite(ipMeta.latitude) && Number.isFinite(ipMeta.longitude)) {
          coords = { lat: ipMeta.latitude, lon: ipMeta.longitude };
        }

        if (!coords && useIpLocation) {
          coords = readCachedCoords();
        }

        if (!coords && useIpLocation) {
          const browserCoords = await getBrowserCoords();
          if (browserCoords) {
            coords = browserCoords;
            writeCachedCoords(browserCoords);
            if (!cancelled) {
              const fallbackTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
              setIpMeta((prev) => ({
                ...prev,
                latitude: browserCoords.lat,
                longitude: browserCoords.lon,
                timezone: prev.timezone || fallbackTimezone,
              }));
            }
          }
        }

        if (!coords) {
          coords = readCachedCoords() || WEATHER_FALLBACK_COORDS;
        }

        writeCachedCoords(coords);

        const unit = (options.weatherUnit || 'fahrenheit') === 'celsius' ? 'celsius' : 'fahrenheit';
        const query = new URLSearchParams({
          latitude: String(coords.lat),
          longitude: String(coords.lon),
          current: `temperature_2m,weather_code,is_day`,
          daily: `weather_code,temperature_2m_max,temperature_2m_min`,
          temperature_unit: unit,
          timezone: 'auto',
        });

        let data = null;
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?${query.toString()}`);
        if (response.ok) {
          data = await response.json();
        } else {
          const currentOnlyQuery = new URLSearchParams({
            latitude: String(coords.lat),
            longitude: String(coords.lon),
            current: `temperature_2m,weather_code,is_day`,
            temperature_unit: unit,
            timezone: 'auto',
          });
          const currentOnlyResponse = await fetch(`https://api.open-meteo.com/v1/forecast?${currentOnlyQuery.toString()}`);
          if (!currentOnlyResponse.ok) {
            if (!cancelled) {
              setMenuWeather({ temp: null, weatherCode: null, isDay: true });
              setForecastDays([]);
            }
            return;
          }
          data = await currentOnlyResponse.json();
        }

        if (!data) return;
        if (cancelled) return;

        const current = data?.current || {};
        setMenuWeather({
          temp: Number.isFinite(Number(current.temperature_2m)) ? Number(current.temperature_2m) : null,
          weatherCode: Number.isFinite(Number(current.weather_code)) ? Number(current.weather_code) : null,
          isDay: Number(current.is_day) === 1,
        });

        const daily = data?.daily || {};
        const times = Array.isArray(daily.time) ? daily.time : [];
        const codes = Array.isArray(daily.weather_code) ? daily.weather_code : [];
        const maxTemps = Array.isArray(daily.temperature_2m_max) ? daily.temperature_2m_max : [];
        const minTemps = Array.isArray(daily.temperature_2m_min) ? daily.temperature_2m_min : [];

        const nextDays = [];
        for (let index = 1; index < times.length && nextDays.length < 3; index += 1) {
          const time = String(times[index] || '').trim();
          if (!time) continue;
          const max = Number(maxTemps[index]);
          const min = Number(minTemps[index]);
          const weatherCode = Number(codes[index]);
          nextDays.push({
            date: time,
            weatherCode: Number.isFinite(weatherCode) ? weatherCode : null,
            max: Number.isFinite(max) ? Math.round(max) : null,
            min: Number.isFinite(min) ? Math.round(min) : null,
          });
        }

        if (nextDays.length === 0) {
          for (let index = 0; index < times.length && nextDays.length < 3; index += 1) {
            const time = String(times[index] || '').trim();
            if (!time) continue;
            const max = Number(maxTemps[index]);
            const min = Number(minTemps[index]);
            const weatherCode = Number(codes[index]);
            nextDays.push({
              date: time,
              weatherCode: Number.isFinite(weatherCode) ? weatherCode : null,
              max: Number.isFinite(max) ? Math.round(max) : null,
              min: Number.isFinite(min) ? Math.round(min) : null,
            });
          }
        }

        setForecastDays(nextDays);
      } catch { }
    };

    fetchWeather();
    const timer = setInterval(fetchWeather, 15 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [options.weatherUseIpLocation, options.weatherCoordsOverride, options.weatherUnit, ipMeta.latitude, ipMeta.longitude]);

  const navigating = {
    id: id,
    go: updateFn,
    process: process,
    openInNewTab: (url) => {
      if (!url) return;
      const processed = process(url, false, options.prType || 'auto', options.engine || null);
      if (loaderStore.getState().tabs.length >= 20) return;
      const tabId = createId();
      addTab({ title: 'New Tab', id: tabId, url: processed });
      setActive(tabId);
    },
  };

  if ((options.newTabPage || 'ghost') !== 'ghost') {
    return <div className="h-full w-full" />;
  }

  return (
    <>
      <div className="h-[calc(100%-100px)] flex flex-col items-center justify-center p-6 gap-8">
        <div className="w-full max-w-2xl">
          <div className="flex justify-center w-full">
            <Logo options="w-[15.8rem] h-30 mr-5 mb-2" />
          </div>
          <Search nav={false} logo={false} cls="-mt-3 absolute z-50" navigating={navigating} />
          <QuickLinks cls="mt-16" nav={false} navigating={navigating} />
        </div>
      </div>
      <div className="fixed left-1/2 -translate-x-1/2 bottom-3 z-[121] pointer-events-none">
        <div
          className={clsx(
            'pointer-events-auto rounded-lg border backdrop-blur-md overflow-hidden transition-[width,box-shadow,transform,background-color,padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] shadow-[0_10px_28px_rgba(0,0,0,0.24)]',
            infoCardOpen ? 'w-[min(24.5rem,92vw)] px-3 py-2.5 translate-y-0' : 'w-[min(17rem,92vw)] px-3 py-1.5 translate-y-[1px]',
          )}
          style={{ backgroundColor: infoCardBg, color: infoCardText, borderColor: infoCardBorder }}
          onMouseEnter={() => setInfoCardOpen(true)}
          onMouseLeave={() => setInfoCardOpen(false)}
        >
          <div className={clsx('grid grid-cols-3 items-center text-[12px] sm:text-[13px] transition-all duration-300', infoCardOpen ? 'gap-3' : 'gap-1')}>
            <span className="text-center">{menuTimeLabel}</span>
            <span className="inline-flex items-center justify-center gap-1.5">
              <Battery size={13} />
              {Number.isFinite(batteryInfo.level) ? `${batteryInfo.level}%` : '--'}
            </span>
            <span className="inline-flex items-center justify-center gap-1.5">
              {(() => {
                const WxIcon = weatherIcon;
                return <WxIcon size={13} />;
              })()}
              {Number.isFinite(menuWeather.temp) ? `${Math.round(menuWeather.temp)}°${weatherUnitLabel}` : '--'}
            </span>
          </div>

          <div
            className={clsx(
              'grid transition-[grid-template-rows,opacity,margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
              infoCardOpen ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0 mt-0',
            )}
          >
            <div className="overflow-hidden">
              <div className="flex items-center justify-between text-[11px] opacity-80 px-0.5">
                <span>{menuDateLabel}</span>
                <span className="truncate max-w-[10.5rem] text-right">{effectiveTimezone}</span>
              </div>

              <div className="mt-2 grid grid-cols-3 gap-2">
                {(forecastDays.length > 0 ? forecastDays : [{}, {}, {}]).slice(0, 3).map((entry, index) => {
                  const ForecastIcon = resolveWeatherIcon(entry.weatherCode);
                  const dayLabel = entry.date
                    ? new Intl.DateTimeFormat([], { weekday: 'short', timeZone: effectiveTimezone }).format(new Date(entry.date))
                    : '--';

                  return (
                    <div
                      key={`${entry.date || 'placeholder'}-${index}`}
                      className="rounded-lg border border-white/10 px-2 py-2 text-[11px]"
                      style={{ backgroundColor: infoCardSubtleBg }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="opacity-80">{dayLabel}</span>
                        <ForecastIcon size={12} className="opacity-90" />
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px]">
                        <span>{Number.isFinite(entry.max) ? `${entry.max}°` : '--'}</span>
                        <span className="opacity-70">{Number.isFinite(entry.min) ? `${entry.min}°` : '--'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default NewTab;
