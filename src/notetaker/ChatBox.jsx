import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Send, Loader2, AlertTriangle, Bot, User, Sparkles, Plus, MessageSquare, FileText, Search,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import {
  PROVIDERS, CHAT_PROVIDERS, LOCAL_LLM_MODELS, providerReady, askAboutNotes, chatLocally,
  fetchProviderModels, peekModels, pickRelevantNotes, rankChatModels, normalizeMath,
} from './ai';

const CHATS_KEY = 'nt:chats';
const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const loadChats = () => {
  try {
    const raw = localStorage.getItem(CHATS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch { return []; }
};
const saveChats = (list) => {
  try { localStorage.setItem(CHATS_KEY, JSON.stringify(list)); } catch { }
};

const when = (ts) => {
  if (!ts) return '';
  const diff = Date.now() - ts;
  if (diff < 60000) return 'now';
  if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.round(diff / 3600000)}h ago`;
  return new Date(ts).toLocaleDateString();
};

const searchableText = (html) => {
  const d = document.createElement('div');
  d.innerHTML = html || '';
  return (d.textContent || '').toLowerCase();
};

const ChatBox = ({ settings, getNotes, scopeLabel, emptyHint, onOpenNote, persist = false }) => {
  const [providerId, setProviderId] = useState(settings.summaryProvider || 'openai');
  const [model, setModel] = useState(settings.summaryModel || '');
  const [models, setModels] = useState(() => peekModels(settings.summaryProvider || 'openai'));

  const [convos, setConvos] = useState(() => (persist ? loadChats() : []));
  const [activeConvo, setActiveConvo] = useState(() => (persist ? (loadChats()[0]?.id || '') : ''));
  const activeConvoRef = useRef(activeConvo);

  const [loose, setLoose] = useState([]);
  const [input, setInput] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef(null);
  const inputRef = useRef(null);

  const allNotes = useMemo(() => (getNotes?.() || []).filter((n) => n && n.html), [getNotes]);
  const convo = persist ? convos.find((c) => c.id === activeConvo) : null;
  const messages = persist ? (convo?.messages || []) : loose;
  const searchTerm = historySearch.trim().toLowerCase();
  const matchingChats = useMemo(() => {
    if (!searchTerm) return convos;
    return convos.filter((c) =>
      String(c.title || '').toLowerCase().includes(searchTerm) ||
      (c.messages || []).some((m) => String(m.content || '').toLowerCase().includes(searchTerm)),
    );
  }, [convos, searchTerm]);
  const matchingNotes = useMemo(() => {
    if (!searchTerm) return [];
    return allNotes.filter((n) =>
      `${n.path || ''} ${n.title || ''} ${searchableText(n.html)}`.toLowerCase().includes(searchTerm),
    ).slice(0, 20);
  }, [allNotes, searchTerm]);

  useEffect(() => { activeConvoRef.current = activeConvo; }, [activeConvo]);

  useEffect(() => {
    let alive = true;
    if (providerId === 'local') {
      setModels({ chat: [] });
      setModel(settings.localSummaryModel || 'auto');
      return () => { alive = false; };
    }
    fetchProviderModels(providerId, settings).then((res) => {
      if (!alive) return;
      const chat = rankChatModels(res.chat || []);
      setModels({ chat });
      setModel((cur) => (cur && chat.includes(cur) ? cur : (chat[0] || '')));
    });
    return () => { alive = false; };
  }, [providerId, settings]);

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [messages, busy]);

  const commitMessages = useCallback((next, titleOverride = '') => {
    if (!persist) { setLoose(next); return; }
    const currentId = activeConvoRef.current;
    const id = currentId || newId();
    activeConvoRef.current = id;
    if (!currentId) setActiveConvo(id);
    setConvos((prev) => {
      const existing = prev.find((c) => c.id === id);
      const title = titleOverride || existing?.title || (next.find((m) => m.role === 'user')?.content || 'New chat').slice(0, 48);
      const entry = { id, title, messages: next, updatedAt: Date.now(), createdAt: existing?.createdAt || Date.now() };
      const list = [entry, ...prev.filter((c) => c.id !== id)].sort((a, b) => b.updatedAt - a.updatedAt);
      saveChats(list);
      return list;
    });
  }, [persist]);

  const newChat = () => {
    if (!persist) { setLoose([]); return; }
    activeConvoRef.current = '';
    setActiveConvo('');
    setError('');
    setConvos(loadChats());
  };

  const send = async () => {
    const q = input.trim();
    if (!q || busy) return;
    setError('');

    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    const generateTitle = persist && history.length === 0;
    const userMsg = { role: 'user', content: q };
    commitMessages([...messages, userMsg]);
    setInput('');
    setBusy(true);

    try {
      if (providerId === 'local') {
        const localMessages = [
          { role: 'system', content: 'You answer questions about the user\'s own notes. Only use the notes provided. If the answer is not in them, say so plainly. Use Markdown and LaTeX ($...$ inline, $$...$$ display). Do not invent note titles, paths, dates, or section numbers.' },
          { role: 'user', content: `Notes:\n"""\n${allNotes.map((n) => `### ${n.path || n.title}\n${n.html.replace(/<[^>]+>/g, ' ')}`).join('\n\n').slice(0, 12000)}\n"""` },
          ...history,
          { role: 'user', content: q },
        ];
        const answer = await chatLocally({ messages: localMessages, modelId: model || 'auto', maxTokens: 600 });
        if (!answer) throw new Error('The local model returned nothing.');
        commitMessages([...messages, userMsg, { role: 'assistant', content: answer, sources: [] }]);
        return;
      }
      if (!providerReady(providerId, settings)) {
        throw new Error(`Add a key for ${PROVIDERS[providerId]?.label || providerId} in Settings.`);
      }
      const picked = persist ? pickRelevantNotes(allNotes, q) : allNotes;
      const answer = await askAboutNotes({
        question: q,
        notes: picked,
        history,
        settings,
        providerId,
        model: model || models.chat?.[0] || undefined,
        generateTitle,
      });
      let answerText = answer;
      let title = '';
      if (generateTitle) {
        const match = answer.match(/^\s*\[Title\]\s*:\s*(.{3,90}?)\s*(?:\r?\n){1,2}/i);
        if (match) {
          title = match[1].replace(/[.\s]+$/, '').trim();
          answerText = answer.slice(match[0].length).trim();
        }
      }
      const sources = picked.map((n) => ({ id: n.id, title: n.title, edited: n.edited }));
      commitMessages([...messages, userMsg, { role: 'assistant', content: answerText, sources }], title);
    } catch (e) {
      setError(String(e?.message || e));
      commitMessages(messages);
      setInput(q);
    } finally {
      setBusy(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const main = (
    <div className="nt-chat-main">
      <div className="nt-chat-top">
        <span className="nt-chip-scope">
          {scopeLabel} <span className="nt-muted">({allNotes.length} note{allNotes.length === 1 ? '' : 's'})</span>
        </span>
        <div className="nt-chat-model">
          <select
            className="nt-input nt-input-sm"
            value={providerId}
            onChange={(e) => { setProviderId(e.target.value); setModel(''); }}
          >
            <option value="local">Local model (this browser)</option>
            {CHAT_PROVIDERS.map(([id, p]) => (
              <option key={id} value={id}>{p.label}</option>
            ))}
          </select>
          {providerId === 'local' ? (
            <select className="nt-input nt-input-sm" value={model} onChange={(e) => setModel(e.target.value)}>
              <option value="auto">Auto ({LOCAL_LLM_MODELS[0].label})</option>
              {LOCAL_LLM_MODELS.map((m) => <option key={m.id} value={m.id}>{m.label} - {m.size}</option>)}
            </select>
          ) : models.chat?.length ? (
            <select className="nt-input nt-input-sm" value={model} onChange={(e) => setModel(e.target.value)}>
              {models.chat.slice(0, 300).map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          ) : (
            <input className="nt-input nt-input-sm" value={model} onChange={(e) => setModel(e.target.value)} placeholder="model" />
          )}
        </div>
      </div>

      <div className="nt-chat-log">
        {!messages.length && (
          <div className="nt-chat-empty">
            <Sparkles size={16} />
            <p className="nt-muted nt-small">{emptyHint}</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={'nt-msg nt-msg-' + m.role}>
            <span className="nt-msg-icon">{m.role === 'user' ? <User size={13} /> : <Bot size={13} />}</span>
            <div className="nt-msg-body">
              {m.role === 'assistant' ? (
                <div className="nt-markdown">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[[rehypeKatex, { throwOnError: false }]]}
                    components={{
                      a: ({ href, children }) => {
                        const safe = /^(https?:|mailto:)/i.test(String(href || '')) ? href : undefined;
                        return safe
                          ? <a href={safe} target="_blank" rel="noreferrer noopener">{children}</a>
                          : <span>{children}</span>;
                      },
                    }}
                  >
                    {normalizeMath(m.content)}
                  </ReactMarkdown>
                </div>
              ) : m.content}
              {m.sources?.length > 0 && (
                <div className="nt-sources">
                  {m.sources.map((s) => (
                    onOpenNote ? (
                      <button
                        key={s.id}
                        type="button"
                        className="nt-source"
                        title={s.edited ? `Last edited ${new Date(s.edited).toLocaleDateString()}` : 'Open note'}
                        onClick={() => onOpenNote(s.id)}
                      >
                        <FileText size={10} /> {s.path || s.title}
                      </button>
                    ) : (
                      <span key={s.id} className="nt-source" title={s.edited ? `Last edited ${new Date(s.edited).toLocaleDateString()}` : ''}>
                        <FileText size={10} /> {s.path || s.title}
                      </span>
                    )
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {busy && (
          <div className="nt-msg nt-msg-assistant">
            <span className="nt-msg-icon"><Bot size={13} /></span>
            <div className="nt-msg-body"><Loader2 size={13} className="nt-spin" /> thinking</div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {providerId !== 'local' && !providerReady(providerId, settings) && (
        <p className="nt-note-warn"><AlertTriangle size={13} /> Add a key for {PROVIDERS[providerId]?.label} in Settings.</p>
      )}
      {error && <p className="nt-note-error">{error}</p>}

      <div className="nt-chat-input">
        <textarea
          ref={inputRef}
          className="nt-input nt-textarea nt-chat-textarea"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
          }}
          placeholder="Ask about these notes. Enter to send, Shift+Enter for a new line."
          rows={2}
        />
        <button type="button" className="nt-btn nt-btn-primary nt-btn-icon" onClick={send} disabled={busy || !input.trim()}>
          <Send size={15} />
        </button>
      </div>
    </div>
  );

  if (!persist) return <div className="nt-chat">{main}</div>;

  return (
    <div className="nt-chat-page">
      <aside className="nt-chat-history">
        <div className="nt-chat-history-head">
          <span className="nt-small nt-muted">Chats</span>
          <button type="button" className="nt-mini" onClick={newChat}><Plus size={12} /> New</button>
        </div>
        <label className="nt-chat-history-search">
          <Search size={13} />
          <input
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
            placeholder="Search notes and chats"
            aria-label="Search notes and chats"
          />
        </label>
        <div className="nt-chat-history-list">
          {searchTerm ? (
            <>
              <p className="nt-history-label">Notes</p>
              {matchingNotes.map((n) => (
                <button key={`note-${n.id}`} type="button" className="nt-convo" onClick={() => onOpenNote?.(n.id)}>
                  <span className="nt-convo-title"><FileText size={12} /> {n.path || n.title}</span>
                  <span className="nt-convo-meta">{when(n.edited)}</span>
                </button>
              ))}
              {!matchingNotes.length && <p className="nt-muted nt-small nt-pad">No matching notes.</p>}

              <p className="nt-history-label">Chats</p>
              {matchingChats.map((c) => (
                <button
                  key={`chat-${c.id}`}
                  type="button"
                  className={'nt-convo' + (c.id === activeConvo ? ' is-active' : '')}
                  onClick={() => { activeConvoRef.current = c.id; setActiveConvo(c.id); setError(''); }}
                >
                  <span className="nt-convo-title"><MessageSquare size={12} /> {c.title}</span>
                  <span className="nt-convo-meta">{when(c.updatedAt)}</span>
                </button>
              ))}
              {!matchingChats.length && <p className="nt-muted nt-small nt-pad">No matching chats.</p>}
            </>
          ) : (
            <>
              {convos.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={'nt-convo' + (c.id === activeConvo ? ' is-active' : '')}
                  onClick={() => { activeConvoRef.current = c.id; setActiveConvo(c.id); setError(''); }}
                >
                  <span className="nt-convo-title"><MessageSquare size={12} /> {c.title}</span>
                  <span className="nt-convo-meta">{when(c.updatedAt)}</span>
                </button>
              ))}
              {!convos.length && <p className="nt-muted nt-small nt-pad">No chats yet. Search also finds your notes.</p>}
            </>
          )}
        </div>
      </aside>
      <div className="nt-chat">{main}</div>
    </div>
  );
};

export default ChatBox;
