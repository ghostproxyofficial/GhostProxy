import { Fragment, useMemo, useState, useEffect, useRef } from 'react';
import {
  ArrowUp,
  Check,
  Copy,
  Ellipsis,
  MessageSquare,
  Moon,
  Settings,
  PanelLeft,
  Plus,
  RefreshCw,
  Sparkles,
  Sun,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from 'lucide-react';
import { X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import React from 'react';
import ComboBox from '/src/components/settings/components/Combobox';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, errorMsg: error.message + '\\n' + error.stack };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <div className="p-4 bg-red-900/50 text-red-200 whitespace-pre-wrap font-mono text-xs rounded-lg border border-red-500">REACT CRASH: {this.state.errorMsg}</div>;
    }
    return this.props.children;
  }
}

import { useOptions } from '/src/utils/optionsContext';
import Input from '/src/components/settings/components/Input';

const STORAGE_KEY = 'ghostAiConversations';
const ACTIVE_CHAT_KEY = 'ghostAiActiveChatId';
const THEME_KEY = 'ghostAiTheme';
const SEND_COOLDOWN_MS = 5000;

const createId = () => `chat-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const PROVIDER_LINKS = {
  stoutchat: 'https://duck.ai',
  duckai: 'https://duck.ai',
  discordchat: 'https://discord.com/app',
  chatgpt: 'https://chat.openai.com',
  gemini: 'https://gemini.google.com',
  claude: 'https://claude.ai',
  perplexity: 'https://www.perplexity.ai',
  copilot: 'https://copilot.microsoft.com',
  deepseek: 'https://chat.deepseek.com',
  mistral: 'https://chat.mistral.ai',
  grok: 'https://grok.x.ai',
  you: 'https://you.com',
  poe: 'https://poe.com',
  huggingchat: 'https://huggingface.co/chat',
};

const SYSTEM_MESSAGE = { role: 'system', content: 'You are Ghost AI, a concise and helpful assistant.' };

const createNewChat = () => ({
  id: createId(),
  title: 'Chat',
  updatedAt: Date.now(),
  messages: [
    {
      id: createId(),
      role: 'assistant',
      content: 'Hello! How can I help you today?',
    },
  ],
});

const getStoredChats = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    return [createNewChat()];
  }
  return [createNewChat()];
};

const stripThinkingBlock = (text) => {
  const raw = String(text || '');

  const withoutClosedTag = raw.replace(/<think>[\s\S]*?<\/think>(\r?\n)?/gi, '');
  const withoutRepeatedOpenTag = withoutClosedTag.replace(/<think>[\s\S]*?<think>(\r?\n)?/gi, '');

  return withoutRepeatedOpenTag.trimStart();
};

const requestAiReply = async (chatMessages) => {
  // Read AI profile early so we can use customPersonality in the system message.
  const raw = (() => {
    try {
      return JSON.parse(localStorage.getItem('ghostAiProfile') || '{}') || {};
    } catch {
      return {};
    }
  })();

  const personality = String(raw.customPersonality || '').trim();
  const systemMsg = personality
    ? { role: 'system', content: `${SYSTEM_MESSAGE.content} ${personality}` }
    : SYSTEM_MESSAGE;

  const apiMessages = [
    systemMsg,
    ...chatMessages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content })),
  ];
  // raw was already read above for customPersonality.

  // Ghost AI now always uses user-provided provider credentials.
  const key = String(raw.apiKey || '').trim();
  const provider = String(raw.provider || 'openai').trim().toLowerCase();
  const model = String(raw.model || '').trim();
  if (!key) throw new Error('No API key configured for the selected provider.');

  if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: model || 'gpt-4o-mini', messages: apiMessages, temperature: 0.7 }),
      });
      if (res.status === 429) throw new Error('You are sending messages too fast.');
      if (!res.ok) throw new Error('AI provider returned an error.');
      const data = await res.json();
      const reply = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || '';
      if (!reply) throw new Error('AI returned an empty response.');
      return stripThinkingBlock(String(reply));
    }

  if (provider === 'anthropic') {
      // Anthropic completion endpoint (best-effort). Uses x-api-key header.
      const prompt = apiMessages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
      const res = await fetch('https://api.anthropic.com/v1/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': key },
        body: JSON.stringify({ model: model || 'claude-2.1', prompt, max_tokens: 1000, temperature: 0.7 }),
      });
      if (res.status === 429) throw new Error('You are sending messages too fast.');
      if (!res.ok) throw new Error('AI provider returned an error.');
      const data = await res.json();
      const reply = data?.completion || data?.completion?.text || '';
      if (!reply) throw new Error('AI returned an empty response.');
      return stripThinkingBlock(String(reply));
    }

  if (provider === 'gemini') {
      const contents = apiMessages.filter(m => m.role !== 'system').map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));
      const systemInstruction = apiMessages.find(m => m.role === 'system')?.content;
      const bodyPayload = { contents };
      if (systemInstruction) {
        bodyPayload.systemInstruction = { parts: [{ text: systemInstruction }] };
      }

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-1.5-flash'}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });
      if (res.status === 429) throw new Error('You are sending messages too fast.');
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || 'AI provider returned an error.');
      }
      const data = await res.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!reply) throw new Error('AI returned an empty response.');
      return stripThinkingBlock(String(reply));
    }

  // Unsupported provider selected.
  throw new Error('Selected AI provider is not supported.');
};



export default function AIPage() {
  const [chats, setChats] = useState(() => getStoredChats());
  const [activeChatId, setActiveChatId] = useState(() => localStorage.getItem(ACTIVE_CHAT_KEY) || '');
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'dark');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastSentAt, setLastSentAt] = useState(0);
  const [tick, setTick] = useState(Date.now());
  const [openMenuId, setOpenMenuId] = useState(null);
  const [feedbackByMessage, setFeedbackByMessage] = useState({});
  const [copiedMessageId, setCopiedMessageId] = useState('');
  const [reloadingMessageId, setReloadingMessageId] = useState('');
  const [pendingDeleteChatId, setPendingDeleteChatId] = useState('');
  const copyTimerRef = useRef(null);
  const endRef = useRef(null);
  const [aiSettingsMounted, setAiSettingsMounted] = useState(false);
  const [aiSettingsVisible, setAiSettingsVisible] = useState(false);
  const buttonRef = useRef(null);
  const transitionLockRef = useRef(false);
  const lastToggleAtRef = useRef(0);
  const [aiProfile, setAiProfile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ghostAiProfile') || '{}') || {};
    } catch {
      return {};
    }
  });
  const aiSettingsRef = useRef(null);
  const { options, updateOption } = useOptions();
  const [selectedProvider, setSelectedProvider] = useState(() => String(options.defaultAiProvider || 'duckai'));
  const [aiProviderPopupOpen, setAiProviderPopupOpen] = useState(() => {
    try {
      if (String(options.defaultAiProvider || '') === '') return true;
      return localStorage.getItem('ghostAiProviderChooserDismissed') !== 'true';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (String(options.defaultAiProvider || '') === '') {
      setAiProviderPopupOpen(true);
    }
  }, [options.defaultAiProvider]);

  useEffect(() => {
    setSelectedProvider(String(options.defaultAiProvider || 'duckai'));
  }, [options.defaultAiProvider]);

  const applySelectedProvider = () => {
    const nextProvider = String(selectedProvider || '').trim();
    if (!nextProvider) return;

    updateOption({ defaultAiProvider: nextProvider });

    if (nextProvider === 'stoutchat' || nextProvider === 'discordchat') {
      updateOption({ defaultChatProvider: nextProvider });
    }
    try {
      localStorage.setItem('ghostAiProviderChooserDismissed', 'true');
    } catch { }
    setAiProviderPopupOpen(false);

    if (nextProvider === 'ghostai') return;

    const link = PROVIDER_LINKS[nextProvider];
    if (link) {
      let handledByGhostBrowser = false;
      try {
        const topWindow = window.top && window.top !== window ? window.top : window;
        const getActiveTabId = topWindow.__ghostGetActiveTabId;
        const updateBrowserTab = topWindow.__ghostUpdateBrowserTabUrl;
        const activeTabId = typeof getActiveTabId === 'function' ? getActiveTabId() : null;
        if (activeTabId && typeof updateBrowserTab === 'function') {
          updateBrowserTab(activeTabId, link, { skipProxy: false });
          handledByGhostBrowser = true;
        }
      } catch {
      }

      if (!handledByGhostBrowser) {
        window.location.assign(link);
      }
      return;
    }

    setAiProviderPopupOpen(false);
  };

  useEffect(() => {
    if (!aiSettingsMounted) return;
    const onDown = (e) => {
      // Ignore pointer events during transition lock to avoid flicker
      if (transitionLockRef.current) return;
      if (aiSettingsRef.current?.contains(e.target)) return;
      if (buttonRef.current?.contains(e.target)) return;
      // start close animation
      closeAiSettings();
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, [aiSettingsMounted]);

  const openAiSettings = () => {
    const now = Date.now();
    if (now - lastToggleAtRef.current < 400) return;
    lastToggleAtRef.current = now;
    // prevent outside-click handler from immediately closing while we open
    transitionLockRef.current = true;
    setAiSettingsMounted(true);
    // make visible immediately to avoid mount/visible race
    setAiSettingsVisible(true);
    // release lock after animation window
    setTimeout(() => {
      transitionLockRef.current = false;
    }, 350);
  };

  const closeAiSettings = () => {
    const now = Date.now();
    if (now - lastToggleAtRef.current < 200) return;
    lastToggleAtRef.current = now;
    // lock transitions to prevent immediate reopen while close animation plays
    transitionLockRef.current = true;
    setAiSettingsVisible(false);
    // wait for exit animation before unmount
    setTimeout(() => {
      setAiSettingsMounted(false);
      // release lock shortly after unmount
      setTimeout(() => {
        transitionLockRef.current = false;
      }, 120);
    }, 240);
  };

  useEffect(() => () => {
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
  }, []);

  useEffect(() => {
    if (!chats.some((chat) => chat.id === activeChatId)) {
      const fallback = chats[0]?.id || '';
      setActiveChatId(fallback);
      localStorage.setItem(ACTIVE_CHAT_KEY, fallback);
    }
  }, [chats, activeChatId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats.slice(0, 100)));
  }, [chats]);

  useEffect(() => {
    if (activeChatId) localStorage.setItem(ACTIVE_CHAT_KEY, activeChatId);
  }, [activeChatId]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem('ghostAiProfile', JSON.stringify(aiProfile || {}));
    } catch { }
  }, [aiProfile]);

  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === activeChatId) || chats[0],
    [chats, activeChatId],
  );

  const messages = activeChat?.messages || [];
  const hasApiKeyConfigured = String(aiProfile?.apiKey || '').trim().length > 0;

  const updateActiveChat = (updater) => {
    if (!activeChat) return;
    setChats((prev) => prev.map((chat) => (chat.id === activeChat.id ? updater(chat) : chat)));
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  const cooldownRemaining = Math.max(0, SEND_COOLDOWN_MS - (tick - lastSentAt));
  const cooldownLabel = (cooldownRemaining / 1000).toFixed(1);
  const canSend = useMemo(
    () => input.trim().length > 0 && !loading && cooldownRemaining === 0 && hasApiKeyConfigured,
    [input, loading, cooldownRemaining, hasApiKeyConfigured],
  );

  const isLight = theme === 'light';
  const ui = isLight
    ? {
      page: 'bg-[#f3f5f8] text-[#0f172a]',
      side: 'bg-[#f7f8fb] border-black/10',
      panel: 'bg-white border-black/10',
      muted: 'text-[#5b6474]',
      input: 'bg-white border-black/10',
      card: 'bg-white border-black/10 hover:border-black/20',
      bubbleUser: 'bg-[#e2e8f0] text-[#0f172a] border-black/10',
      bubbleAssistant: 'bg-white text-[#0f172a] border-black/10',
    }
    : {
      page: 'bg-[#030507] text-white',
      side: 'bg-[#0c0d10] border-white/10',
      panel: 'bg-[#030507] border-white/10',
      muted: 'text-white/55',
      input: 'bg-[#05070b] border-white/15',
      card: 'bg-[#05070b] border-white/15 hover:border-white/30',
      bubbleUser: 'bg-[#27272a] text-white border-white/10',
      bubbleAssistant: 'bg-[#07090d] text-white border-white/10',
    };

  const aiSettingsSurface = isLight ? '#ffffff' : options.settingsContainerColor || '#2f363b';
  const aiSettingsBorder = isLight ? 'rgba(15, 23, 42, 0.14)' : 'rgba(255,255,255,0.14)';
  const aiSettingsInputClass = isLight
    ? 'border-black/15 bg-black/5 text-[#0f172a] placeholder:text-[#475569] focus:border-black/25'
    : 'border-white/15 bg-white/5 text-white placeholder:text-white/40 focus:border-white/30';
  const aiSettingsFieldBg = isLight ? '#f8fafc' : options.settingsDropdownColor || '#162337';

  const createChat = () => {
    const next = createNewChat();
    setChats((prev) => [next, ...prev]);
    setActiveChatId(next.id);
    setOpenMenuId(null);
    setInput('');
  };

  const confirmDeleteChat = (id) => {
    if (!id) return;
    const remaining = chats.filter((chat) => chat.id !== id);
    if (remaining.length === 0) {
      const fresh = createNewChat();
      setChats([fresh]);
      setActiveChatId(fresh.id);
      setPendingDeleteChatId('');
      return;
    }
    setChats(remaining);
    if (activeChatId === id) setActiveChatId(remaining[0].id);
    setPendingDeleteChatId('');
    setOpenMenuId(null);
  };

  const setFeedback = (messageId, value) => {
    setFeedbackByMessage((prev) => ({
      ...prev,
      [messageId]: prev[messageId] === value ? null : value,
    }));
  };

  const copyMessage = async (messageId, content) => {
    try {
      await navigator.clipboard.writeText(String(content || ''));
      setCopiedMessageId(messageId);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopiedMessageId(''), 1100);
    } catch { }
  };

  const regenerateMessage = async (messageId) => {
    if (loading || reloadingMessageId) return;
    const assistantIndex = messages.findIndex((message) => message.id === messageId);
    if (assistantIndex < 0) return;

    let userIndex = -1;
    for (let idx = assistantIndex - 1; idx >= 0; idx -= 1) {
      if (messages[idx]?.role === 'user') {
        userIndex = idx;
        break;
      }
    }
    if (userIndex < 0) return;

    const context = messages.slice(0, userIndex + 1);
    setReloadingMessageId(messageId);

    try {
      const refreshed = await requestAiReply(context);
      updateActiveChat((chat) => ({
        ...chat,
        updatedAt: Date.now(),
        messages: chat.messages.map((message) =>
          message.id === messageId ? { ...message, content: refreshed } : message,
        ),
      }));
    } catch (error) {
      updateActiveChat((chat) => ({
        ...chat,
        updatedAt: Date.now(),
        messages: [
          ...chat.messages,
          { id: createId(), role: 'system', content: `Error: ${error?.message || 'Unable to regenerate response.'}` },
        ],
      }));
    } finally {
      setReloadingMessageId('');
    }
  };

  const send = async () => {
    const prompt = input.trim();
    if (!prompt || loading) return;
    if (!hasApiKeyConfigured) return;

    if (Date.now() - lastSentAt < SEND_COOLDOWN_MS) {
      const waitMsg = { id: createId(), role: 'system', content: 'You are sending messages too fast.' };
      updateActiveChat((chat) => ({
        ...chat,
        updatedAt: Date.now(),
        messages: [...chat.messages, waitMsg],
      }));
      return;
    }

    setLastSentAt(Date.now());

    const nextUser = { id: createId(), role: 'user', content: prompt };
    const optimistic = [...messages, nextUser];
    updateActiveChat((chat) => ({
      ...chat,
      title:
        chat.title === 'Chat'
          ? prompt.slice(0, 38) || 'Chat'
          : chat.title,
      updatedAt: Date.now(),
      messages: optimistic,
    }));
    setInput('');
    setLoading(true);

    try {
      const text = await requestAiReply(optimistic);
      updateActiveChat((chat) => ({
        ...chat,
        updatedAt: Date.now(),
        messages: [...chat.messages, { id: createId(), role: 'assistant', content: text }],
      }));
    } catch (error) {
      updateActiveChat((chat) => ({
        ...chat,
        updatedAt: Date.now(),
        messages: [
          ...chat.messages,
          { id: createId(), role: 'system', content: `Error: ${error?.message || 'Unable to complete request.'}` },
        ],
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`h-full w-full overflow-hidden ${ui.page}`}>
      <div className="h-full flex min-w-0">
        <aside
          className={`h-full border-r overflow-hidden transition-all duration-300 ease-out ${ui.side} ${sidebarOpen ? 'w-[260px]' : 'w-0 border-r-0'
            }`}
        >
          <div className="h-full w-[260px] flex flex-col">
            <div className="px-3 pt-5 pb-0">
              <div className="flex items-center gap-2.5 pl-1.5 mb-3">
                <img
                  src="/ghost.png"
                  alt="Ghost AI"
                  className="h-7 w-7 ghost-ai-logo"
                  style={{ filter: isLight ? 'none' : 'invert(1)' }}
                />
                <span className="font-semibold text-[1.35rem] leading-none">Ghost AI</span>
              </div>
            </div>

            <div className="px-3 pt-2 pb-3 overflow-y-auto flex-1 space-y-1">
              <div className="mb-3">
                <button
                  onClick={createChat}
                  className={`w-full h-9 rounded-xl border px-3 text-[0.96rem] font-medium transition-all duration-200 flex items-center gap-2 ${ui.card}`}
                >
                  <Plus size={14} />
                  <span className="text-[0.96rem]">New Chat</span>
                </button>
              </div>
              {chats
                .slice()
                .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
                .map((chat) => (
                  <div
                    key={chat.id}
                    className={`group rounded-xl border transition-all duration-200 ${chat.id === activeChat?.id
                      ? isLight
                        ? 'bg-[#e5e7eb] border-black/10'
                        : 'bg-[#22252b] border-white/10'
                      : 'border-transparent hover:border-white/10'
                      }`}
                  >
                    <div
                      onClick={() => {
                        setActiveChatId(chat.id);
                        setOpenMenuId(null);
                      }}
                      className="h-8 px-3 flex items-center justify-between cursor-pointer"
                    >
                      <p className="text-[0.92rem] truncate">{chat.title || 'Chat'}</p>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setOpenMenuId((prev) => (prev === chat.id ? null : chat.id));
                          }}
                          className="h-7 w-7 rounded-md grid place-items-center opacity-70 hover:opacity-100 transition-opacity"
                        >
                          <Ellipsis size={15} />
                        </button>
                        {openMenuId === chat.id && (
                          <div className={`absolute right-0 top-8 w-36 rounded-xl border z-20 p-1.5 shadow-xl ${ui.card}`}>
                            <button
                              type="button"
                              className="w-full h-8 rounded-lg px-2.5 text-left text-[0.92rem] text-red-400 hover:bg-red-500/10"
                              onClick={(event) => {
                                event.stopPropagation();
                                setPendingDeleteChatId(chat.id);
                                setOpenMenuId(null);
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0 h-full flex flex-col">
          <div className={`h-14 border-b px-4 flex items-center justify-between ${ui.panel}`}>
            <button
              type="button"
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="h-8 w-8 rounded-md grid place-items-center transition-all duration-200 hover:bg-white/10"
              title="Toggle chat sidebar"
            >
              <PanelLeft size={17} />
            </button>

            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  ref={buttonRef}
                  type="button"
                  onClick={() => {
                    if (transitionLockRef.current) return;
                    if (aiSettingsMounted && aiSettingsVisible) closeAiSettings();
                    else openAiSettings();
                  }}
                  className="h-8 w-8 rounded-md grid place-items-center transition-all duration-200 hover:bg-white/6"
                  title="AI Settings"
                >
                  <Settings size={16} />
                </button>
                {aiSettingsMounted && (
                  <div
                    ref={aiSettingsRef}
                    className={`absolute right-0 top-9 w-[22rem] rounded-xl border z-30 p-4 shadow-2xl ${aiSettingsVisible ? 'ghost-anim-card' : 'ghost-anim-leave'
                      } ai-settings-no-outline`}
                    style={{ minWidth: '20rem', backgroundColor: aiSettingsSurface, borderColor: aiSettingsBorder, color: isLight ? '#0f172a' : '#ffffff' }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="text-lg font-semibold">AI Settings</div>
                      <button type="button" onClick={() => closeAiSettings()} className={`p-1 rounded-md ${isLight ? 'hover:bg-black/6' : 'hover:bg-white/6'}`}>
                        <X size={14} />
                      </button>
                    </div>

                    <div className="mb-3">
                      <div className="text-[0.85rem] mb-1">Default Theme</div>
                      <ComboBox
                        config={[{ option: 'Dark', value: 'dark' }, { option: 'Light', value: 'light' }]}
                        selectedValue={aiProfile.defaultTheme || 'dark'}
                        action={(v) => setAiProfile((s) => ({ ...(s || {}), defaultTheme: v }))}
                        mode={isLight ? 'light' : 'dark'}
                        backgroundColor={aiSettingsFieldBg}
                      />
                    </div>

                    <div className="mb-3">
                      <div className="text-[0.85rem] mb-1">AI Provider</div>
                      <ComboBox
                        config={[{ option: 'OpenAI', value: 'openai' }, { option: 'Gemini', value: 'gemini' }]}
                        selectedValue={aiProfile.provider || 'openai'}
                        action={(v) => setAiProfile((s) => ({ ...(s || {}), provider: v }))}
                        mode={isLight ? 'light' : 'dark'}
                        backgroundColor={aiSettingsFieldBg}
                      />
                    </div>

                    <div className="mb-3">
                      <div className="text-[0.85rem] mb-1">Model</div>
                      <Input
                        defValue={aiProfile.model || ''}
                        onChange={(v) => setAiProfile((s) => ({ ...(s || {}), model: v }))}
                        placeholder="e.g. gpt-4o-mini"
                        mode={isLight ? 'light' : 'dark'}
                        backgroundColor={aiSettingsFieldBg}
                      />
                    </div>

                    <div className="mb-3">
                      <div className="text-[0.85rem] mb-1">API Key</div>
                      <Input
                        defValue={aiProfile.apiKey || ''}
                        onChange={(v) => setAiProfile((s) => ({ ...(s || {}), apiKey: v }))}
                        placeholder="Paste your API key"
                        inputType="password"
                        mode={isLight ? 'light' : 'dark'}
                        backgroundColor={aiSettingsFieldBg}
                      />
                    </div>

                    <div className="mb-3">
                      <div className="text-[0.85rem] mb-1">Custom Personality</div>
                      <textarea
                        value={aiProfile.customPersonality || ''}
                        onChange={(e) => setAiProfile((s) => ({ ...(s || {}), customPersonality: e.target.value }))}
                        placeholder="e.g. You are a pirate, speak in pirate talk"
                        rows={3}
                        className={`w-full rounded-lg border px-3 py-2 text-[0.85rem] outline-none resize-none transition-colors ${aiSettingsInputClass}`}
                      />
                    </div>

                    <div className="flex justify-end gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (aiProfile?.defaultTheme) setTheme(aiProfile.defaultTheme);
                          closeAiSettings();
                        }}
                        className={`px-3 py-1 rounded-md border text-sm ${isLight ? 'border-black/20 hover:bg-black/5' : 'border-white/20 hover:bg-white/10'}`}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => closeAiSettings()}
                        className={`px-3 py-1 rounded-md text-sm ${isLight ? 'text-[#334155] hover:bg-black/5' : 'opacity-70 hover:bg-white/8'}`}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
                className={`h-8 w-14 rounded-full border p-1 transition-all duration-300 flex items-center ${isLight ? 'justify-start border-black/15 bg-[#dbe1ea]' : 'justify-end border-white/20 bg-[#1b1f28]'
                  }`}
                title="Toggle light/dark mode"
              >
                <span
                  className={`h-6 w-6 rounded-full grid place-items-center transition-transform duration-300 ${isLight ? 'bg-[#f8fafc] text-[#0f172a]' : 'bg-[#0b1020] text-[#f8fafc]'
                    }`}
                >
                  {isLight ? <Sun size={13} /> : <Moon size={13} />}
                </span>
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 md:px-8 pt-6 pb-5">
            {messages.length <= 1 && (
              <div className="max-w-[900px] mx-auto mt-8 mb-8">
                <h1 className="text-5xl font-semibold tracking-tight mb-2">Hello there!</h1>
                <p className={`text-4xl ${ui.muted}`}>How can I help you today?</p>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setInput('How do you find the vertex of a parabola')}
                    disabled={!hasApiKeyConfigured}
                    className={`h-16 rounded-2xl border px-4 text-left transition-all duration-200 ${hasApiKeyConfigured ? 'hover:translate-y-[-1px]' : 'opacity-55 cursor-not-allowed'} ${ui.card}`}
                  >
                    <p className="text-[0.95rem] font-semibold">How do you find</p>
                    <p className={`text-[0.9rem] ${ui.muted}`}>the vertex of a parabola</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInput('Explain React hooks like useState and useEffect')}
                    disabled={!hasApiKeyConfigured}
                    className={`h-16 rounded-2xl border px-4 text-left transition-all duration-200 ${hasApiKeyConfigured ? 'hover:translate-y-[-1px]' : 'opacity-55 cursor-not-allowed'} ${ui.card}`}
                  >
                    <p className="text-[0.95rem] font-semibold">Explain React hooks</p>
                    <p className={`text-[0.9rem] ${ui.muted}`}>like useState and useEffect</p>
                  </button>
                </div>
              </div>
            )}

            <div className="max-w-[900px] mx-auto space-y-4 pb-2">
              {messages
                .filter((message, idx) => !(idx === 0 && message.role === 'assistant' && message.content?.includes('Hello!')))
                .map((message) => {
                  const richMessage = message.role === 'assistant' || message.role === 'system';
                  const feedback = feedbackByMessage[message.id] || null;
                  const copied = copiedMessageId === message.id;
                  const reloading = reloadingMessageId === message.id;
                  return (
                    <div key={message.id} className={message.role === 'user' ? 'ml-auto w-fit max-w-[86%]' : 'w-fit max-w-[86%]'}>
                      <div
                        className={`rounded-2xl border px-4 py-3 text-[0.95rem] transition-all duration-200 ${message.role === 'user'
                          ? `${ui.bubbleUser}`
                          : message.role === 'assistant'
                            ? `${ui.bubbleAssistant}`
                            : isLight
                              ? 'border-red-200 text-red-700 bg-red-100'
                              : 'border-red-500/50 text-red-300 bg-red-900/20'
                          }`}
                      >
                        {richMessage ? (
                          <ErrorBoundary>
                            <div className="space-y-3 leading-7">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm, remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                                components={{
                                  p: ({ node, ...props }) => <div className="mb-2 last:mb-0" {...props} />,
                                  a: ({ node, ...props }) => <a className="text-blue-400 hover:underline hover:text-blue-300 transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
                                  ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1 my-2" {...props} />,
                                  ol: ({ node, ...props }) => <ol className="list-decimal pl-5 space-y-1 my-2" {...props} />,
                                  li: ({ node, ...props }) => <li className="" {...props} />,
                                  h1: ({ node, ...props }) => <h1 className="text-xl font-bold mt-4 mb-2" {...props} />,
                                  h2: ({ node, ...props }) => <h2 className="text-lg font-bold mt-4 mb-2" {...props} />,
                                  h3: ({ node, ...props }) => <h3 className="text-base font-bold mt-3 mb-1" {...props} />,
                                  h4: ({ node, ...props }) => <h4 className="text-sm font-bold mt-3 mb-1" {...props} />,
                                  h5: ({ node, ...props }) => <h5 className="text-sm font-semibold mt-2 mb-1 uppercase tracking-wide opacity-80" {...props} />,
                                  h6: ({ node, ...props }) => <h6 className="text-xs font-semibold mt-2 mb-1 uppercase tracking-wide opacity-70" {...props} />,
                                  hr: ({ node, ...props }) => <hr className="border-t border-black/10 dark:border-white/10 my-4" {...props} />,
                                  blockquote: ({ node, ...props }) => (
                                    <blockquote className="border-l-4 border-emerald-500/50 pl-4 py-1 my-3 bg-emerald-500/5 rounded-r-lg italic opacity-90" {...props} />
                                  ),
                                  code: ({ node, inline, className, children, ...props }) => {
                                    const match = /language-(\w+)/.exec(className || '');
                                    return !inline ? (
                                      <div className="my-3 overflow-hidden rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/40">
                                        <div className="flex items-center justify-between px-3 py-1.5 border-b border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/50 text-[0.75rem] font-mono text-black/60 dark:text-white/60">
                                          <span>{match ? match[1] : 'text'}</span>
                                        </div>
                                        <pre className="p-4 overflow-x-auto text-[0.85rem] leading-6 font-mono">
                                          <code className={className} {...props}>
                                            {children}
                                          </code>
                                        </pre>
                                      </div>
                                    ) : (
                                      <code className="px-1.5 py-0.5 mx-0.5 rounded-md bg-black/10 dark:bg-black/30 text-[0.88em] font-mono" {...props}>
                                        {children}
                                      </code>
                                    );
                                  },
                                  table: ({ node, ...props }) => (
                                    <div className="my-4 overflow-x-auto rounded-xl border border-black/10 dark:border-white/10">
                                      <table className="min-w-full text-sm text-left" {...props} />
                                    </div>
                                  ),
                                  thead: ({ node, ...props }) => <thead className="bg-black/5 dark:bg-black/40" {...props} />,
                                  th: ({ node, ...props }) => <th className="px-4 py-3 font-semibold border-b border-black/10 dark:border-white/10" {...props} />,
                                  td: ({ node, ...props }) => <td className="px-4 py-2 border-b border-black/5 dark:border-white/5 last:border-b-0 align-top" {...props} />,
                                  del: ({ node, ...props }) => <del className="line-through opacity-70" {...props} />,
                                }}
                              >
                                {message.content}
                              </ReactMarkdown>
                            </div>
                          </ErrorBoundary>
                        ) : (
                          <div className="whitespace-pre-wrap leading-7">{message.content}</div>
                        )}
                      </div>

                      {message.role === 'assistant' && (
                        <div className={`mt-1.5 px-1 flex items-center gap-1.5 ${ui.muted}`}>
                          <button
                            type="button"
                            onClick={() => copyMessage(message.id, message.content)}
                            title={copied ? 'Copied' : 'Copy'}
                            className={`h-7 w-7 rounded-md grid place-items-center transition-all duration-200 ${copied ? 'text-emerald-400 scale-105' : 'hover:bg-white/10'}`}
                          >
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => setFeedback(message.id, 'like')}
                            title="Like"
                            className={`h-7 w-7 rounded-md grid place-items-center transition-all duration-200 ${feedback === 'like' ? 'text-emerald-400' : 'hover:bg-white/10'}`}
                          >
                            <ThumbsUp size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setFeedback(message.id, 'dislike')}
                            title="Dislike"
                            className={`h-7 w-7 rounded-md grid place-items-center transition-all duration-200 ${feedback === 'dislike' ? 'text-red-400' : 'hover:bg-white/10'}`}
                          >
                            <ThumbsDown size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => regenerateMessage(message.id)}
                            title="Regenerate"
                            disabled={loading || !!reloadingMessageId}
                            className={`h-7 w-7 rounded-md grid place-items-center transition-all duration-200 ${loading || reloadingMessageId ? 'opacity-45 cursor-not-allowed' : 'hover:bg-white/10'}`}
                          >
                            <RefreshCw size={14} className={reloading ? 'animate-spin' : ''} />
                          </button>
                        </div>
                      )}
                      {message.role !== 'user' && message.role !== 'assistant' && (
                        <div className="h-1" />
                      )}
                    </div>
                  );
                })}

              {loading && (
                <div className={`w-fit rounded-2xl border px-4 py-3 text-[1.05rem] animate-pulse flex items-center gap-2 ${ui.bubbleAssistant}`}>
                  <Sparkles size={15} />
                  <span>Generating…</span>
                </div>
              )}
              <div ref={endRef} />
            </div>
          </div>

          <div className={`border-t px-6 md:px-8 py-4 ${ui.panel}`}>
            <div className="max-w-[900px] mx-auto">
              <div className={`rounded-2xl border px-4 py-3 transition-all duration-300 ${ui.input}`}>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={!hasApiKeyConfigured}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder={
                    !hasApiKeyConfigured
                      ? 'Please add your API key to Ghost AI.'
                      : loading
                        ? 'Waiting for response...'
                        : 'Send a message...'
                  }
                  className={`w-full h-10 bg-transparent outline-none text-[0.95rem] ${isLight ? 'placeholder:text-[#111827]' : 'placeholder:text-white/60'
                    }`}
                />

                <div className="h-9 mt-1 flex items-center justify-between">
                  <button
                    type="button"
                    disabled
                    title="Upload disabled"
                    className="h-8 w-8 rounded-md grid place-items-center opacity-45 cursor-not-allowed"
                  >
                    <Plus size={20} />
                  </button>

                  <button
                    type="button"
                    onClick={send}
                    disabled={!canSend}
                    title={cooldownRemaining > 0 ? `Wait ${cooldownLabel}s` : 'Send'}
                    className={`h-8 w-8 rounded-md grid place-items-center transition-all duration-200 ${canSend ? 'opacity-85 hover:opacity-100 hover:translate-y-[-1px]' : 'opacity-35 cursor-not-allowed'
                      }`}
                  >
                    <ArrowUp size={18} />
                  </button>
                </div>
              </div>

              {!hasApiKeyConfigured && (
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className={`text-[0.9rem] ${ui.muted}`}>Please add your API key to Ghost AI.</p>
                  <button
                    type="button"
                    onClick={() => openAiSettings()}
                    className={`px-3 py-1.5 rounded-md border text-sm transition-colors ${isLight ? 'border-black/20 hover:bg-black/6 text-[#0f172a]' : 'border-white/20 hover:bg-white/10 text-white'}`}
                  >
                    Open Popup
                  </button>
                </div>
              )}

              {cooldownRemaining > 0 && !loading && (
                <p className={`text-[0.9rem] mt-2 ${ui.muted}`}>Rate limit active: wait {cooldownLabel}s</p>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* AI Provider chooser popup */}
      {aiProviderPopupOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-[28px] border border-white/10 bg-[#0f141d] p-6 shadow-2xl">
            <div className="pr-3 mb-5">
              <h2 className="text-2xl font-semibold text-white">AI Provider</h2>
              <p className="text-base text-white/70 mt-2 leading-6">Choose what AI provider you want to use.</p>
              <p className="text-sm text-white/55 mt-1">You can change this anytime in settings.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => setSelectedProvider('duckai')}
                className={`text-left rounded-2xl border bg-white/5 p-4 transition-colors ${selectedProvider === 'duckai' ? 'border-white/45 bg-white/10' : 'border-white/20 hover:bg-white/10'}`}
              >
                <div className="text-lg font-semibold text-white">Duck.ai</div>
                <div className="text-sm text-white/70 mt-1">Free unlimited AI, saves locally.</div>
              </button>
              <button
                type="button"
                onClick={() => setSelectedProvider('ghostai')}
                className={`text-left rounded-2xl border bg-white/5 p-4 transition-colors ${selectedProvider === 'ghostai' ? 'border-white/45 bg-white/10' : 'border-white/20 hover:bg-white/10'}`}
              >
                <div className="text-lg font-semibold text-white">Ghost AI</div>
                <div className="text-sm text-white/70 mt-1">Bring your own API/Endpoint.</div>
              </button>
            </div>

            <div className="mb-5">
              <p className="text-xs uppercase tracking-wide text-white/45 mb-2">Other providers</p>
              <div className="flex flex-wrap gap-2">
                {[
                  ['chatgpt', 'ChatGPT'],
                  ['gemini', 'Gemini'],
                  ['claude', 'Claude'],
                  ['perplexity', 'Perplexity'],
                  ['copilot', 'Copilot'],
                  ['deepseek', 'DeepSeek'],
                  ['mistral', 'Mistral'],
                  ['grok', 'Grok'],
                  ['you', 'You.com'],
                  ['poe', 'Poe'],
                  ['huggingchat', 'HuggingChat'],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedProvider(id)}
                    className={`h-9 px-3 rounded-lg border text-xs text-white/85 ${selectedProvider === id ? 'border-white/40 bg-white/14' : 'border-white/15 bg-white/5 hover:bg-white/10'}`}
                  >
                    {label}
                  </button>
                ))}

                {pendingDeleteChatId && (
                  <div className="fixed inset-0 z-[10020] flex items-center justify-center p-4">
                    <button
                      type="button"
                      aria-label="Close delete dialog"
                      className="absolute inset-0 bg-black/45"
                      onClick={() => setPendingDeleteChatId('')}
                    />
                    <div
                      className="relative w-full max-w-sm rounded-2xl border p-4 shadow-2xl"
                      style={{
                        backgroundColor: isLight ? '#ffffff' : '#111827',
                        borderColor: isLight ? 'rgba(15,23,42,0.12)' : 'rgba(255,255,255,0.12)',
                        color: isLight ? '#0f172a' : '#ffffff',
                      }}
                    >
                      <h3 className="text-base font-semibold">Delete chat</h3>
                      <p className={`mt-2 text-sm ${isLight ? 'text-[#334155]' : 'text-white/70'}`}>
                        Delete this chat? This action cannot be undone.
                      </p>
                      <div className="mt-4 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setPendingDeleteChatId('')}
                          className={`px-3 py-1.5 rounded-md border text-sm ${isLight ? 'border-black/15 hover:bg-black/6' : 'border-white/20 hover:bg-white/10'}`}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => confirmDeleteChat(pendingDeleteChatId)}
                          className="px-3 py-1.5 rounded-md border border-red-400/40 text-red-400 text-sm hover:bg-red-500/10"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={applySelectedProvider}
                  className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/18 border border-white/15 text-sm text-white/90 transition-colors"
                >
                  Select
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
