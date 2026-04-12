import clsx from 'clsx';
import { useState, useEffect, useRef, useCallback, useMemo, memo, startTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { LucideSearch, Earth } from 'lucide-react';
import { GlowWrapper } from '../utils/Glow';
import { useOptions } from '../utils/optionsContext';
import Logo from '../components/Logo';
import theme from '../styles/theming.module.css';
import 'movement.css';

const SearchContainer = memo(function SearchContainer({ logo = true, cls, nav = true, navigating }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const debounceRef = useRef(null);
  const latestQuery = useRef('');
  const navigate = useNavigate();
  const { options } = useOptions();

  const fetchResults = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    latestQuery.current = searchQuery;
    try {
      let data = null;

      const localResponse = await fetch('/return?q=' + encodeURIComponent(searchQuery));
      if (localResponse.ok) {
        data = await localResponse.json();
      } else {
        const fallbackResponse = await fetch(
          'https://duckduckgo.com/ac/?q=' + encodeURIComponent(searchQuery) + '&type=list',
        );
        if (!fallbackResponse.ok) return setResults([]);
        data = await fallbackResponse.json();
      }

      if (latestQuery.current !== searchQuery) return;
      const list = Array.isArray(data) ? data.filter((i) => i.phrase).slice(0, 4) : [];
      startTransition(() => setResults(list));
    } catch {
      if (latestQuery.current === searchQuery) setResults([]);
    }
  }, []);

  const go = (strin) => {
    if (nav) {
      navigate("/search", {
        state: {
          url: strin,
          openInGhostNewTab: true,
        }
      });
    } else {
      if (/^ghost:\/\//i.test(strin) && typeof navigating?.openInNewTab === 'function') {
        navigating.openInNewTab(strin);
        return;
      }
      navigating.go(navigating.id, navigating.process(strin));
    }
  }

  const handleInputChange = useCallback(
    (e) => {
      const newQuery = e.target.value;
      setQuery(newQuery);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!newQuery.trim()) {
        latestQuery.current = '';
        setResults([]);
        return;
      }

      debounceRef.current = setTimeout(() => fetchResults(newQuery), 300);
    },
    [fetchResults],
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key !== 'Enter') return;
      const trimmed = query.trim();
      if (!trimmed) return;
      go(trimmed);
    },
    [query, go],
  );

  const handleResultClick = useCallback(
    (phrase) => {
      go(phrase);
    },
    [go],
  );

  useEffect(() => {
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, []);

  const placeholder = useMemo(
    () => `Search ${options.engineName || 'DuckDuckGo'} or type URL`,
    [options.engineName],
  );

  const iconSrc = useMemo(
    () =>
      options.performanceMode
        ? null
        : options.engineIcon ??
        'https://duckduckgo.com/favicon.ico',
    [options.engineIcon, options.performanceMode],
  );

  return (
    <div
      className={clsx(
        !cls ? 'absolute w-full px-20 py-4 flex flex-col items-center mt-20 z-50' : cls,
      )}
      data-m={!cls && 'bounce-up'}
      data-m-duration={!cls && '0.8'}
    >
      {logo && <Logo options="w-[15.8rem] h-auto" />}
      <GlowWrapper
        glowOptions={{ color: options.glowWrapperColor || '255, 255, 255', size: 70, opacity: 0.2 }}
      >
        <div className="w-[40.625rem]">
          <div
            id="search-div"
            className={clsx(
              'flex items-center gap-3 shadow-xl pl-4 pr-4 w-full h-[3.41rem]',
              results.length ? 'rounded-t-[14px] rounded-b-none' : 'rounded-[14px]',
              theme[`searchBarColor`],
              theme[`theme-${options.theme || 'default'}`],
            )}
          >
            {iconSrc ? (
              <img src={iconSrc} className="w-5 h-5 shrink-0" alt="Search icon" loading="lazy" />
            ) : (
              <Earth size={22} />
            )}

            <input
              type="text"
              placeholder={placeholder}
              className="flex-1 bg-transparent outline-hidden text-[16.5px] leading-[20px] placeholder:font-[Inter] placeholder:font-medium"
              autoComplete="off"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
            />

            <LucideSearch className="w-[1.08rem] h-[1.08rem] shrink-0" />
          </div>

          {results.length > 0 && (
            <div
              className={clsx(
                'shadow-xl mt-0 p-2 text-[14px] w-full rounded-b-[14px] space-y-1',
                theme[`searchResultStyle`],
                theme[`theme-${options.theme || 'default'}`],
              )}
            >
              {results.map((result) => (
                <div
                  key={result.phrase}
                  className={clsx(
                    'rounded-[9px] w-full h-11 cursor-pointer duration-100 ease-in px-3 pl-2.5 flex items-center',
                    theme.searchResultItem,
                  )}
                  onClick={() => handleResultClick(result.phrase)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ marginRight: '12px' }}
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.3-4.3"></path>
                  </svg>
                  <span className="text-[15px]">{result.phrase}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </GlowWrapper>
    </div>
  );
});

export default SearchContainer;
