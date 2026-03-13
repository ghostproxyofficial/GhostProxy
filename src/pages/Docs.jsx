import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Search } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import docsCatalog from '/src/data/docs/catalog.json';
import dictionaryEntries from '/src/data/docs/dictionary.json';
import { useOptions } from '/src/utils/optionsContext';

const escapeHtml = (input) =>
  String(input || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const inlineMarkdown = (line) =>
  escapeHtml(line)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');

const renderMarkdown = (markdown) => {
  const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let listBuffer = [];
  let codeBuffer = [];
  let inCode = false;

  const flushList = () => {
    if (listBuffer.length === 0) return;
    out.push(`<ul>${listBuffer.map((item) => `<li>${inlineMarkdown(item)}</li>`).join('')}</ul>`);
    listBuffer = [];
  };

  const flushCode = () => {
    if (!inCode) return;
    out.push(`<pre><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`);
    codeBuffer = [];
    inCode = false;
  };

  for (const rawLine of lines) {
    const line = rawLine || '';

    if (line.trim().startsWith('```')) {
      if (inCode) flushCode();
      else {
        flushList();
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      listBuffer.push(line.replace(/^\s*[-*]\s+/, ''));
      continue;
    }

    flushList();

    if (!line.trim()) {
      out.push('<div class="spacer"></div>');
      continue;
    }

    if (/^###\s+/.test(line)) {
      out.push(`<h3>${inlineMarkdown(line.replace(/^###\s+/, ''))}</h3>`);
      continue;
    }

    if (/^##\s+/.test(line)) {
      out.push(`<h2>${inlineMarkdown(line.replace(/^##\s+/, ''))}</h2>`);
      continue;
    }

    if (/^#\s+/.test(line)) {
      out.push(`<h1>${inlineMarkdown(line.replace(/^#\s+/, ''))}</h1>`);
      continue;
    }

    out.push(`<p>${inlineMarkdown(line)}</p>`);
  }

  flushList();
  flushCode();
  return out.join('');
};

const Docs = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const { category, topicId } = useParams();
  const [query, setQuery] = useState('');
  const [dictionaryOpen, setDictionaryOpen] = useState(false);
  const [dictionaryRender, setDictionaryRender] = useState(false);
  const [dictionaryAnim, setDictionaryAnim] = useState(false);
  const [dictionaryQuery, setDictionaryQuery] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const isMac = typeof navigator !== 'undefined' ? /Mac|iPhone|iPad|iPod/i.test(navigator.platform) : false;
  const shortcutLabel = isMac ? 'Cmd+K' : 'Ctrl+K';
  const inGhostBrowserMode = new URLSearchParams(location.search).get('ghost') === '1';
  const { options } = useOptions();
  const panelBg = options.quickModalBgColor || options.menuColor || '#1a252f';
  const cardBg = options.menuColor || options.quickModalBgColor || '#0f141c';
  const inputBg = options.omninputColor || '#ffffff10';
  const textColor = options.siteTextColor || '#a0b0c8';
  const mutedText = options.siteMutedTextColor || 'rgba(160, 176, 200, 0.78)';
  const isLightTheme =
    options.type === 'light' ||
    options.theme === 'light' ||
    options.themeName === 'light';
  const popupPrimaryBg = isLightTheme ? '#3d4654' : '#3a3f48';
  const popupPrimaryText = '#f6f8fc';

  const categories = useMemo(() => (Array.isArray(docsCatalog) ? docsCatalog : []), []);

  const activeCategory = useMemo(
    () => categories.find((item) => item.id === category) || null,
    [categories, category],
  );

  const activeTopic = useMemo(
    () => activeCategory?.topics?.find((item) => String(item.id) === String(topicId)) || null,
    [activeCategory, topicId],
  );

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories
      .map((section) => ({
        ...section,
        topics: (section.topics || []).filter((item) => item.title.toLowerCase().includes(q)),
      }))
      .filter((section) => section.title.toLowerCase().includes(q) || (section.topics || []).length > 0);
  }, [categories, query]);

  useEffect(() => {
    const onKeyDown = (e) => {
      const useMod = isMac ? e.metaKey : e.ctrlKey;
      if (useMod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select?.();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMac]);

  useEffect(() => {
    if (dictionaryOpen) {
      setDictionaryAnim(false);
      setDictionaryRender(true);
      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setDictionaryAnim(true));
      });
      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }
    setDictionaryAnim(false);
    const t = setTimeout(() => setDictionaryRender(false), 200);
    return () => clearTimeout(t);
  }, [dictionaryOpen]);

  useEffect(() => {
    if (!activeTopic?.file) {
      setMarkdown('');
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetch(activeTopic.file)
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error('missing markdown'))))
      .then((text) => {
        if (cancelled) return;
        setMarkdown(text);
      })
      .catch(() => {
        if (cancelled) return;
        setMarkdown('# Missing Document\n\nThis markdown file was not found yet.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTopic?.file]);

  const openTopic = (catId, itemId) => {
    const search = inGhostBrowserMode ? '?ghost=1' : '';
    navigate(`/docs/${catId}/${itemId}${search}`);
  };

  const renderedMarkdown = useMemo(() => renderMarkdown(markdown), [markdown]);
  const filteredDictionaryEntries = useMemo(() => {
    const q = dictionaryQuery.trim().toLowerCase();
    if (!q) return dictionaryEntries;
    return dictionaryEntries.filter(
      (entry) => entry.word.toLowerCase().includes(q) || entry.definition.toLowerCase().includes(q),
    );
  }, [dictionaryQuery]);

  if (topicId) {
    return (
      <div className="min-h-full px-4 md:px-8 pt-6 pb-10" style={{ color: textColor }}>
        <div className="mx-auto max-w-5xl">
          <button
            type="button"
            onClick={() => navigate(`/docs${inGhostBrowserMode ? '?ghost=1' : ''}`)}
            className="h-9 px-3 rounded-md bg-[#ffffff12] hover:bg-[#ffffff1f] text-sm inline-flex items-center gap-2"
          >
            <ArrowLeft size={15} /> Back
          </button>

          <div className="mt-4 rounded-xl border border-white/10 p-5" style={{ backgroundColor: panelBg }}>
            <div className="mb-3 text-xs opacity-70 inline-flex items-center gap-2">
              <BookOpen size={13} />
              <span>{activeCategory?.title || 'Docs'}</span>
            </div>
            <h1 className="text-2xl font-semibold mb-4">{activeTopic?.title || 'Document'}</h1>
            {loading ? (
              <p className="text-sm opacity-80">Loading markdown…</p>
            ) : (
              <article className="ghost-doc-markdown" dangerouslySetInnerHTML={{ __html: renderedMarkdown }} />
            )}
          </div>
        </div>

        <style>{`
          .ghost-doc-markdown h1 { font-size: 1.8rem; font-weight: 700; margin: 0 0 0.75rem; }
          .ghost-doc-markdown h2 { font-size: 1.3rem; font-weight: 600; margin: 1rem 0 0.6rem; }
          .ghost-doc-markdown h3 { font-size: 1.05rem; font-weight: 600; margin: 0.9rem 0 0.5rem; }
          .ghost-doc-markdown p { margin: 0.45rem 0; opacity: 0.96; }
          .ghost-doc-markdown ul { margin: 0.5rem 0 0.6rem 1.2rem; list-style: disc; }
          .ghost-doc-markdown li { margin: 0.25rem 0; }
          .ghost-doc-markdown code { background: rgba(255,255,255,0.12); padding: 0.1rem 0.3rem; border-radius: 0.28rem; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
          .ghost-doc-markdown pre { background: rgba(0,0,0,0.32); padding: 0.7rem; border-radius: 0.5rem; overflow-x: auto; }
          .ghost-doc-markdown pre code { background: transparent; padding: 0; }
          .ghost-doc-markdown a { text-decoration: underline; text-underline-offset: 2px; }
          .ghost-doc-markdown .spacer { height: 0.3rem; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-full relative" style={{ color: textColor }}>
      {!inGhostBrowserMode && (
        <div
          className="sticky top-0 z-50 border-b border-white/10 backdrop-blur"
          style={{ backgroundColor: options.barColor || 'rgba(0, 0, 0, 0.07)' }}
        >
          <div className="h-20 px-4 md:px-8 flex items-center justify-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="h-9 px-3 rounded-md bg-[#ffffff12] hover:bg-[#ffffff1f] text-sm flex items-center gap-2"
            >
              <ArrowLeft size={15} /> Return to Ghost
            </button>

            <div
              className="h-9 w-[360px] max-w-[58vw] rounded-md border border-white/12 px-3 flex items-center gap-2"
              style={{ backgroundColor: inputBg }}
            >
              <Search size={15} className="opacity-70" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search docs"
                className="w-full bg-transparent outline-none text-sm"
                disabled
              />
              <span className="text-[11px] px-1.5 py-0.5 rounded border border-white/20 opacity-70">{shortcutLabel}</span>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 md:px-8 pt-6 pb-10 relative">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 p-8 mb-7" style={{ backgroundColor: cardBg }}>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(135deg, #ffffff0c, #ffffff0c 2px, transparent 2px, transparent 16px)' }} />
          <div className="absolute inset-0 opacity-12" style={{ backgroundImage: 'radial-gradient(circle at 20% 15%, #ffffff18 0 2px, transparent 3px), radial-gradient(circle at 70% 60%, #ffffff16 0 2px, transparent 3px)' }} />
          <div className="relative z-10">
            <div className="mb-3">
              <img
                src="/ghost.png"
                alt="Ghost"
                className="w-9 h-9 object-contain"
                style={{ filter: 'invert(1) brightness(2)' }}
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Ghost Docs</h1>
            <p className="text-sm md:text-base opacity-75 mt-2">Help for all things Ghost.</p>
          </div>
        </div>

        {/* Content grid with dark overlay */}
        <div className="relative">
          <div className="pointer-events-none select-none" style={{ filter: 'brightness(0.35)' }}>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredSections.map((section) => (
                <div key={section.id} className="rounded-xl border border-white/10 p-4" style={{ backgroundColor: panelBg }}>
                  <h2 className="text-xl font-semibold mb-3">{section.title}</h2>
                  <ul className="space-y-2.5 text-sm opacity-90">
                    {(section.topics || []).map((item, index) => (
                      <li key={`${section.id}-${item.id}`} className="flex items-start gap-2">
                        <span className="mt-[2px] inline-flex w-5 h-5 items-center justify-center rounded-full bg-white/8 text-[11px]">{index + 1}</span>
                        <span className="text-left">{item.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-xl border border-white/10 p-5 flex items-center justify-between gap-4" style={{ backgroundColor: panelBg }}>
              <div>
                <h3 className="text-xl font-semibold">Dictionary</h3>
                <p className="text-sm opacity-80 mt-1">Learn what terms for Ghost and Proxying in general mean</p>
              </div>
              <div className="h-10 px-4 rounded-md bg-white/10 text-sm flex items-center">View</div>
            </div>
          </div>

          {/* Coming Soon popup */}
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div
              className="rounded-2xl border border-white/15 backdrop-blur-lg px-10 py-8 flex flex-col items-center gap-4 shadow-[0_24px_48px_rgba(0,0,0,0.5)]"
              style={{ backgroundColor: panelBg }}
            >
              <img
                src="/ghost.png"
                alt="Ghost"
                className="w-14 h-14 object-contain"
                style={{ filter: 'invert(1) brightness(1.8)' }}
              />
              <h2 className="text-2xl font-bold tracking-tight">Coming Soon</h2>
              <p className="text-sm text-center max-w-xs" style={{ color: mutedText }}>
                Ghost Docs is under construction. Check back soon for full documentation.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (inGhostBrowserMode) {
                    try {
                      const topWin = window.top && window.top !== window ? window.top : window;
                      const getTabId = topWin.__ghostGetActiveTabId;
                      const updater = topWin.__ghostUpdateBrowserTabUrl;
                      const tabId = typeof getTabId === 'function' ? getTabId() : null;
                      if (tabId && typeof updater === 'function') {
                        updater(tabId, 'ghost://home', { skipProxy: true });
                      } else {
                        navigate('/');
                      }
                    } catch {
                      navigate('/');
                    }
                  } else {
                    navigate('/');
                  }
                }}
                className="mt-1 h-9 px-5 rounded-lg bg-white/10 hover:bg-white/18 border border-white/15 text-sm transition-colors"
                style={{ color: popupPrimaryText, backgroundColor: popupPrimaryBg, borderColor: 'transparent' }}
              >
                Return Home
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .ghost-doc-popup-backdrop {
          animation: ghostDocsFadeIn 0.18s ease-out;
        }
        .ghost-doc-popup-panel {
          animation: ghostDocsPopupIn 0.22s ease-out;
          transform-origin: center;
        }
        @keyframes ghostDocsFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes ghostDocsPopupIn {
          from { opacity: 0; transform: scale(0.965) translateY(6px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
});

Docs.displayName = 'Docs';
export default Docs;
