import katex from 'katex';

export const PROVIDERS = {
  openai: {
    label: 'OpenAI',
    audio: true,
    chat: true,
    base: 'https://api.openai.com/v1',
    keyHint: 'sk-...',
    modelsPath: '/models',
    audioModels: ['whisper-1', 'gpt-4o-transcribe', 'gpt-4o-mini-transcribe'],
    chatModels: ['gpt-5', 'gpt-5-mini', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4o', 'gpt-4o-mini', 'o4-mini'],
  },
  anthropic: {
    label: 'Anthropic',
    audio: false,
    chat: true,
    base: 'https://api.anthropic.com/v1',
    keyHint: 'sk-ant-...',
    modelsPath: '/models',
    chatModels: ['claude-sonnet-4-5', 'claude-opus-4-1', 'claude-haiku-4-5', 'claude-sonnet-4-0'],
  },
  google: {
    label: 'Google Gemini',
    audio: false,
    chat: true,
    base: 'https://generativelanguage.googleapis.com/v1beta',
    keyHint: 'AIza...',
    modelsPath: '/models',
    chatModels: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'],
  },
  groq: {
    label: 'Groq',
    audio: true,
    chat: true,
    base: 'https://api.groq.com/openai/v1',
    keyHint: 'gsk_...',
    modelsPath: '/models',
    audioModels: ['whisper-large-v3-turbo', 'whisper-large-v3', 'distil-whisper-large-v3-en'],
    chatModels: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'openai/gpt-oss-120b', 'qwen/qwen3-32b'],
  },
  deepseek: {
    label: 'DeepSeek',
    audio: false,
    chat: true,
    base: 'https://api.deepseek.com/v1',
    keyHint: 'sk-...',
    modelsPath: '/models',
    chatModels: ['deepseek-chat', 'deepseek-reasoner'],
  },
  moonshot: {
    label: 'Moonshot (Kimi)',
    audio: false,
    chat: true,
    base: 'https://api.moonshot.ai/v1',
    keyHint: 'sk-...',
    modelsPath: '/models',
    chatModels: ['kimi-k2-0905-preview', 'kimi-k2-turbo-preview', 'moonshot-v1-128k', 'moonshot-v1-32k'],
  },
  xai: {
    label: 'xAI (Grok)',
    audio: false,
    chat: true,
    base: 'https://api.x.ai/v1',
    keyHint: 'xai-...',
    modelsPath: '/models',
    chatModels: ['grok-4', 'grok-3', 'grok-3-mini', 'grok-2-1212'],
  },
  mistral: {
    label: 'Mistral',
    audio: false,
    chat: true,
    base: 'https://api.mistral.ai/v1',
    keyHint: 'mistral key',
    modelsPath: '/models',
    chatModels: ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest', 'ministral-8b-latest'],
  },
  openrouter: {
    label: 'OpenRouter',
    audio: false,
    chat: true,
    base: 'https://openrouter.ai/api/v1',
    keyHint: 'sk-or-...',
    modelsPath: '/models',
    publicModels: true,
    chatModels: [
      'anthropic/claude-sonnet-4.5', 'openai/gpt-5', 'google/gemini-2.5-pro',
      'deepseek/deepseek-chat', 'meta-llama/llama-3.3-70b-instruct',
    ],
  },
  assemblyai: {
    label: 'AssemblyAI',
    audio: true,
    chat: false,
    base: 'https://api.assemblyai.com/v2',
    keyHint: 'assembly key',
    audioModels: ['universal-3-5-pro', 'universal-2'],
  },
  deepgram: {
    label: 'Deepgram',
    audio: true,
    chat: false,
    base: 'https://api.deepgram.com/v1',
    keyHint: 'deepgram key',
    audioModels: ['nova-3', 'nova-2-general', 'nova-2-phonecall', 'nova-2-meeting', 'enhanced'],
  },
  elevenlabs: {
    label: 'ElevenLabs',
    audio: true,
    chat: false,
    base: 'https://api.elevenlabs.io/v1',
    keyHint: 'xi-...',
    audioModels: ['scribe_v1'],
  },
  custom: {
    label: 'Custom (OpenAI compatible)',
    audio: false,
    chat: true,
    base: '',
    keyHint: 'your key',
    customBase: true,
    chatModels: [],
  },
};

export const AUDIO_PROVIDERS = Object.entries(PROVIDERS).filter(([, p]) => p.audio);
export const CHAT_PROVIDERS = Object.entries(PROVIDERS).filter(([, p]) => p.chat);

export const providerKey = (id, settings) => String(settings?.providers?.[id]?.key || '').trim();
export const providerBase = (id, settings) =>
  (settings?.providers?.[id]?.base || PROVIDERS[id]?.base || '').replace(/\/+$/, '');
export const providerReady = (id, settings) => !!providerKey(id, settings) && !!providerBase(id, settings);

const modelCache = new Map();

const NOT_LLM = /embed|embedding|whisper|tts|audio|transcribe|speech|dall-e|sora|veo|imagen|image|video|lyria|musicgen|music-generation|moderation|rerank|guard|safety|realtime|aqa|clip|blip|nano-banana/i;
const CODING_AGENT = /code|coder|coding|agent|antigravity|composer|devin|swe/i;

const PREFERRED = [
  /^gpt-6(?!.*(nano|audio|realtime))/,
  /^gpt-5(?!.*(nano|audio|realtime))/,
  /^gpt-4\.1/,
  /^gpt-4o$/,
  /^gpt-4o-mini$/,
  /^o[34]/,
  /^claude-(sonnet|opus|haiku)-/,
  /^gemini-3/,
  /^gemini-2\.5-(pro|flash)/,
  /^gemini-2\.0-flash/,
  /deepseek-chat|deepseek-reasoner/,
  /llama-3\.3|llama-3\.1/,
  /^qwen/,
  /^mistral-(large|medium|small)/,
  /^kimi|moonshot/,
  /^grok-/,
];

export const rankChatModels = (ids) => {
  const list = [...new Set(ids || [])].filter((id) => id && !NOT_LLM.test(id) && !CODING_AGENT.test(id));
  const scored = list.map((id) => {
    let score = 60;
    PREFERRED.forEach((re, i) => { if (re.test(id)) score = Math.min(score, i * 2); });
    if (/preview|experimental|exp\b|alpha|beta|latest/i.test(id)) score += 12;
    if (/lite|mini|flash|nano/i.test(id)) score += 3;
    return { id, score };
  });
  scored.sort((a, b) => a.score - b.score || a.id.localeCompare(b.id));
  return scored.map((s) => s.id);
};

export const fetchProviderModels = async (providerId, settings, { force = false } = {}) => {
  const p = PROVIDERS[providerId];
  if (!p) return { chat: [], audio: [] };
  const cached = modelCache.get(providerId);
  if (!force && cached && Date.now() - cached.at < 10 * 60 * 1000) return cached;

  const base = providerBase(providerId, settings);
  const key = providerKey(providerId, settings);
  const result = { at: Date.now(), chat: [...(p.chatModels || [])], audio: [...(p.audioModels || [])] };

  const needsKey = !p.publicModels;
  if (!p.modelsPath || !base || (needsKey && !key)) {
    modelCache.set(providerId, result);
    return result;
  }

  try {
    let url = `${base}${p.modelsPath}`;
    const headers = {};
    if (providerId === 'anthropic') {
      headers['x-api-key'] = key;
      headers['anthropic-version'] = '2023-06-01';
      headers['anthropic-dangerous-direct-browser-access'] = 'true';
    } else if (providerId === 'google') {
      url += `?key=${encodeURIComponent(key)}`;
    } else if (key) {
      headers.Authorization = `Bearer ${key}`;
    }

    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();

    let ids = [];
    if (Array.isArray(data?.data)) ids = data.data.map((m) => m.id || m.name);
    else if (Array.isArray(data?.models)) {
      const models = providerId === 'google'
        ? data.models.filter((m) => (m.supportedGenerationMethods || []).some((method) => /generateContent/i.test(method)))
        : data.models;
      ids = models.map((m) => m.name?.replace(/^models\//, '') || m.id);
    }
    else if (Array.isArray(data)) ids = data.map((m) => m.id || m.name);

    ids = [...new Set(ids.filter(Boolean).map((x) => String(x).replace(/^models\//, '')))];
    if (ids.length) {
      result.chat = rankChatModels(ids);
      result.defaultChat = result.chat[0] || '';
    }

  } catch (e) {
    result.error = String(e?.message || e);
  }

  modelCache.set(providerId, result);
  return result;
};

export const peekModels = (providerId) =>
  modelCache.get(providerId) || {
    chat: [...(PROVIDERS[providerId]?.chatModels || [])],
    audio: [...(PROVIDERS[providerId]?.audioModels || [])],
  };

export const WHISPER_MODELS = [
  { id: 'tiny', repo: 'Xenova/whisper-tiny', label: 'Tiny', size: '~80 MB', note: 'Fastest. Fine for quiet, clear speech.', minRam: 2 },
  { id: 'base', repo: 'Xenova/whisper-base', label: 'Base', size: '~150 MB', note: 'Good balance for most laptops.', minRam: 4 },
  { id: 'small', repo: 'Xenova/whisper-small', label: 'Small', size: '~500 MB', note: 'Noticeably better accuracy, still fine on a decent laptop.', minRam: 8 },
  { id: 'medium', repo: 'Xenova/whisper-medium', label: 'Medium', size: '~1.5 GB', note: 'Accurate but slow without a GPU.', minRam: 16 },
  { id: 'turbo', repo: 'onnx-community/whisper-large-v3-turbo', label: 'Turbo', size: '~1.6 GB', note: 'Best accuracy per second, wants WebGPU and 16 GB.', minRam: 16 },
];

export const LOCAL_LLM_MODELS = [
  { id: 'qwen05', repo: 'Xenova/Qwen1.5-0.5B-Chat', label: 'Qwen1.5 0.5B Chat', size: '~500 MB', note: 'Verified to run on CPU here. Short notes only.', minRam: 4, cpuSafe: true },
  { id: 'llama1b', repo: 'onnx-community/Llama-3.2-1B-Instruct-ONNX', label: 'Llama 3.2 1B', size: '~1.2 GB', note: 'Needs a working WebGPU adapter.', minRam: 8, cpuSafe: false },
  { id: 'qwen15', repo: 'onnx-community/Qwen2.5-1.5B-Instruct', label: 'Qwen2.5 1.5B', size: '~1.8 GB', note: 'WebGPU only. Aborts on CPU.', minRam: 8, cpuSafe: false },
  { id: 'phi35', repo: 'onnx-community/Phi-3.5-mini-instruct-onnx-web', label: 'Phi-3.5 Mini', size: '~2.5 GB', note: 'WebGPU only. Will not run on CPU.', minRam: 16 },
  { id: 'llama3b', repo: 'onnx-community/Llama-3.2-3B-Instruct-ONNX', label: 'Llama 3.2 3B', size: '~3 GB', note: 'Best quality here. Needs a real GPU.', minRam: 16 },
];

export const detectHardware = () => {
  const cores = Number(navigator.hardwareConcurrency) || 4;
  const ram = Number(navigator.deviceMemory) || 0;
  const webgpu = typeof navigator !== 'undefined' && !!navigator.gpu;
  return { cores, ram, webgpu };
};

const GPU_BLOCK_KEY = 'nt:gpuBlocked';

export const webgpuInfo = async () => {
  try {
    if (!navigator?.gpu?.requestAdapter) return { ok: false, shaderF16: false, vendor: '', arch: '', usable: false };
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) return { ok: false, shaderF16: false, vendor: '', arch: '', usable: false };
    let device = null;
    try {
      device = await adapter.requestDevice();
    } catch {
      return { ok: false, shaderF16: false, vendor: '', arch: '', usable: false };
    }
    const shaderF16 = !!adapter.features?.has?.('shader-f16');
    try { device?.destroy?.(); } catch { }

    const vendor = String(adapter.info?.vendor || '');
    const arch = String(adapter.info?.architecture || '');
    const signature = `${vendor}|${arch}`;
    let blocked = '';
    try { blocked = localStorage.getItem(GPU_BLOCK_KEY) || ''; } catch { }

    const knownBad = /intel|gen-?1[0-9]|swiftshader|software/i.test(`${vendor} ${arch}`);
    const usable = !!device && shaderF16 && !knownBad && blocked !== signature;

    return {
      ok: !!device,
      shaderF16,
      vendor,
      arch,
      usable,
      reason: !device ? 'no-device' : !shaderF16 ? 'no-shader-f16' : knownBad ? 'integrated-gpu' : blocked === signature ? 'previously-failed' : 'ready',
    };
  } catch {
    return { ok: false, shaderF16: false, vendor: '', arch: '', usable: false, reason: 'error' };
  }
};

export const blockWebgpu = async () => {
  try {
    const adapter = await navigator?.gpu?.requestAdapter?.();
    const signature = `${adapter?.info?.vendor || ''}|${adapter?.info?.architecture || ''}`;
    localStorage.setItem(GPU_BLOCK_KEY, signature);
  } catch { }
};

export const unblockWebgpu = () => {
  try { localStorage.removeItem(GPU_BLOCK_KEY); } catch { }
};

export const canUseWebGPU = async () => {
  const info = await webgpuInfo();
  return !!info.usable;
};

const pickByRam = (list, hw) => {
  const ram = hw.ram || (hw.cores >= 8 ? 8 : 4);
  const afford = list.filter((m) => m.minRam <= ram);
  const pool = afford.length ? afford : [list[0]];
  return pool[Math.min(pool.length - 1, 1)] || pool[0];
};

export const recommendWhisper = (hw = detectHardware()) => {
  const ram = hw.ram || (hw.cores >= 8 ? 8 : 4);
  if (ram >= 16) return 'small';
  if (ram >= 8) return 'small';
  if (ram >= 4) return 'base';
  return 'tiny';
};
export const recommendLocalLlm = () => 'qwen05';

export const resolveWhisper = (id, hw) =>
  WHISPER_MODELS.find((m) => m.id === (!id || id === 'auto' ? recommendWhisper(hw) : id)) || WHISPER_MODELS[1];

export const resolveLocalLlm = (id, hw) =>
  LOCAL_LLM_MODELS.find((m) => m.id === (!id || id === 'auto' ? recommendLocalLlm(hw) : id)) || LOCAL_LLM_MODELS[2];

const TRANSFORMERS_CDNS = [
  'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3',
  'https://unpkg.com/@huggingface/transformers@3',
  'https://esm.sh/@huggingface/transformers@3',
];

let transformersPromise = null;

const loadTransformers = async () => {
  if (transformersPromise) return transformersPromise;
  transformersPromise = (async () => {
    const failures = [];
    for (const cdn of TRANSFORMERS_CDNS) {
      try {
        const mod = await import( cdn);
        if (typeof mod?.pipeline !== 'function') { failures.push(`${cdn}: no pipeline`); continue; }
        try {
          const env = mod.env;
          if (env?.backends?.onnx?.wasm) {

            env.backends.onnx.wasm.numThreads = 1;
            env.backends.onnx.wasm.proxy = false;
          }
          if (env) env.allowLocalModels = false;
        } catch { }
        return mod;
      } catch (e) {
        failures.push(`${cdn}: ${String(e?.message || e).slice(0, 80)}`);
      }
    }
    throw new Error(`Could not load the local model runtime. ${failures.join(' | ')}`);
  })();
  try { return await transformersPromise; } catch (e) { transformersPromise = null; throw e; }
};

const pipes = new Map();
const MODEL_FLAG = (repo) => `nt:model:${repo}`;
export const modelDownloaded = (repo) => {
  try { return localStorage.getItem(MODEL_FLAG(repo)) === '1'; } catch { return false; }
};
const markDownloaded = (repo) => {
  try { localStorage.setItem(MODEL_FLAG(repo), '1'); } catch { }
};

const setOrtThreads = (mod, threads) => {
  try {
    const env = mod.env;
    if (!env?.backends?.onnx?.wasm) return;
    env.backends.onnx.wasm.numThreads = threads;
    env.backends.onnx.wasm.proxy = false;
  } catch { }
};

const getPipeline = async (task, repo, opts, onStatus) => {
  const key = `${task}:${repo}:${opts.dtype}:${opts.device}:${opts.threads ?? 'auto'}`;
  if (pipes.has(key)) return pipes.get(key);

  const mod = await loadTransformers();
  const isolated = typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated;
  const cores = Number(navigator.hardwareConcurrency) || 4;
  setOrtThreads(mod, isolated ? Math.max(2, Math.min(16, cores - 1)) : 1);
  const cached = modelDownloaded(repo);
  onStatus?.({
    phase: cached ? 'loading' : 'downloading',
    text: cached ? `Loading ${repo.split('/')[1]}` : `Downloading model`,
    detail: repo,
  });

  const pipe = await mod.pipeline(task, repo, {
    ...opts,
    progress_callback: (p) => {
      if (p?.status === 'progress' && Number.isFinite(p.progress) && Number.isFinite(p.total)) {
        onStatus?.({
          phase: 'downloading',
          text: `Downloading model ${Math.round(p.progress)}%`,
          detail: p.file || repo,
          percent: p.progress,
        });
      } else if (p?.status === 'done' && p?.file) {
        onStatus?.({ phase: 'downloading', text: 'Finishing model', detail: p.file });
      }
    },
  });
  markDownloaded(repo);
  pipes.set(key, pipe);
  return pipe;
};

export const decodeToMono16k = async (blob) => {
  const buf = await blob.arrayBuffer();
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) throw new Error('This browser has no audio decoder.');
  const ctx = new Ctx({ sampleRate: 16000 });
  const decoded = await ctx.decodeAudioData(buf.slice(0));
  const ch = decoded.numberOfChannels;
  const len = decoded.length;
  const out = new Float32Array(len);
  for (let c = 0; c < ch; c += 1) {
    const data = decoded.getChannelData(c);
    for (let i = 0; i < len; i += 1) out[i] += data[i] / ch;
  }
  try { ctx.close(); } catch { }
  return out;
};

export const transcribeLocally = async ({ blob, modelId, language = 'en', onStatus }) => {
  const model = resolveWhisper(modelId, detectHardware());
  onStatus?.({ phase: 'work', text: 'Decoding audio' });
  const audio = await decodeToMono16k(blob);
  onStatus?.({ phase: 'work', text: 'Transcribing' });

  const multilingual = !/\.en$/i.test(model.repo);
  const opts = { chunk_length_s: 30, stride_length_s: 5 };
  if (multilingual) {
    opts.language = language || 'en';
    opts.task = 'transcribe';
  }
  const gpu = await canUseWebGPU();
  const attempts = [
    { device: 'wasm', dtype: 'q8', threads: 1 },
    { device: 'wasm', dtype: 'q4', threads: 1 },
  ];
  let lastErr = null;
  for (const attempt of attempts) {
    try {
      const pipe = await getPipeline('automatic-speech-recognition', model.repo, attempt, onStatus);
      const res = await pipe(audio, opts);
      return String(res?.text || '').trim();
    } catch (e) {
      lastErr = e;
      console.warn('[notetaker] whisper backend failed', attempt, e);
    }
  }
  throw new Error(`Whisper could not run locally (${String(lastErr?.message || lastErr).slice(0, 180)}). Try a smaller model.`);
};

const SYSTEM_PROMPT = [
  'You convert a lecture transcript into study notes for a student.',
  'Only use facts that appear in the transcript.',
  'Never invent course names, dates, chapters, page numbers or assignments.',
  'If the transcript does not mention classwork or homework, say "None mentioned."',
  'Reply with plain text only. No markdown fences, no html, no preamble.',
  'Write any math as LaTeX: $...$ inline, and $$...$$ on its own line for display equations.',
  'When comparing two or more things, emit a GitHub markdown table using | pipes with a header row and a |---| separator row.',
  'Use exactly these section headers, each on its own line, wrapped in double brackets:',
  '[[Overview]] then one short paragraph.',
  '[[Key concepts]] then bullet lines starting with "- ".',
  '[[Terms]] then bullet lines in the form "- term: definition".',
  '[[Classwork]] then bullets, or "None mentioned."',
  '[[Homework]] then bullets, or "None mentioned."',
].join(' ');

const buildPrompt = (text, instructions) => {
  const extra = instructions?.trim() ? `\nExtra instructions: ${instructions.trim()}` : '';
  return `Transcript:\n"""\n${text}\n"""${extra}\n\nWrite the notes now.`;
};

export const killRepetition = (raw) => {
  let s = String(raw || '');
  s = s.replace(/^```[a-z]*\s*/i, '').replace(/```\s*$/i, '').trim();
  const lines = s.split(/\r?\n/);
  const out = [];
  let dupRun = 0;
  const templates = new Map();
  for (const line of lines) {
    const t = line.trim();
    if (t && out.length && out[out.length - 1].trim() === t) {
      dupRun += 1;
      if (dupRun > 1) continue;
    } else {
      dupRun = 0;
    }
    const template = t.toLowerCase()
      .replace(/\b(?:[ivxlcdm]{1,8}|\d+)\b/gi, '#')
      .replace(/[^a-z# ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (template.length > 12) {
      const count = (templates.get(template) || 0) + 1;
      templates.set(template, count);
      if (count > 2) continue;
    }
    out.push(line);
  }
  s = out.join('\n');

  s = s.replace(/(\b[\w' ]{8,60}?)\1{2,}/g, '$1');
  return s.trim();
};

export const toHtmlFragment = (raw) => {
  let s = killRepetition(raw);
  if (!s) return '';

  const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = (t) => esc(t)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');

  s = s.replace(/\[\[(.+?)\]\]/g, (_, name) => `\n## ${name.trim()}\n`);
  s = s.replace(/\*\*(Overview|Key concepts|Terms|Classwork|Homework)\*\*/gi, '## $1');
  s = s.replace(/^#\s+(Overview|Key concepts|Terms|Classwork|Homework)\s*$/gim, '## $1');

  const lines = s.split(/\r?\n/);
  const out = [];
  let list = null;
  let table = [];
  const closeList = () => { if (list) { out.push(`</${list}>`); list = null; } };
  const flushTable = () => {
    if (!table.length) return;
    const rows = table.map((r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
    const isDivider = (r) => r.every((c) => /^:?-{2,}:?$/.test(c));
    const head = rows[0] || [];
    const bodyRows = rows.slice(1).filter((r) => !isDivider(r));
    const headHtml = head.length
      ? `<thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead>`
      : '';
    const bodyHtml = bodyRows.length
      ? `<tbody>${bodyRows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody>`
      : '';
    out.push(`<table>${headHtml}${bodyHtml}</table>`);
    table = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith('|') && line.endsWith('|')) { closeList(); table.push(line); continue; }
    if (table.length) flushTable();
    if (!line) { closeList(); continue; }
    const h = line.match(/^#{1,6}\s+(.*)$/);
    if (h) { closeList(); out.push(`<h2>${inline(h[1])}</h2>`); continue; }
    const ul = line.match(/^[-*\u2022]\s+(.*)$/);
    const ol = line.match(/^\d+[.)]\s+(.*)$/);
    if (ul || ol) {
      const want = ul ? 'ul' : 'ol';
      if (list !== want) { closeList(); out.push(`<${want}>`); list = want; }
      out.push(`<li>${inline((ul || ol)[1])}</li>`);
      continue;
    }
    closeList();
    out.push(`<p>${inline(line)}</p>`);
  }
  flushTable();
  closeList();
  return out.join('').replace(/<\s*(script|style|iframe)[\s\S]*?<\/\s*\1\s*>/gi, '');
};

const capInput = (text, maxChars = 7000) => {
  const t = String(text || '');
  if (t.length <= maxChars) return { text: t, truncated: false };
  return { text: t.slice(0, maxChars), truncated: true };
};

const withTimeout = (promise, ms, label) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error(`${label} timed out after ${Math.round(ms / 1000)} seconds`)), ms);
  Promise.resolve(promise).then(
    (value) => { clearTimeout(timer); resolve(value); },
    (error) => { clearTimeout(timer); reject(error); },
  );
});

const STOP_WORDS = new Set('the a an and or but if then than that this these those is are was were be been being to of in on at for from with by as it its we they you he she them their our your into about after before during through'.split(' '));

const contentWords = (value) =>
  (String(value || '').toLowerCase().match(/[a-z0-9']{3,}/g) || [])
    .filter((w) => !STOP_WORDS.has(w));

const cleanTranscript = (rawText) => String(rawText || '')

  .replace(/\[\d{1,2}:\d{2}(?:\s*[-–]\s*\d{1,2}:\d{2})?\]/g, ' ')
  .replace(/\bPart\s+[IVXLC]+\s*[:.]?/gi, ' ')
  .replace(/\b(?:professor|instructor|teacher|lecturer|student|speaker)\s*:\s*/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const splitSentences = (text) => (String(text || '').match(/[^.!?]+[.!?]?/g) || [])
  .map((s) => s.trim())
  .filter((s) => s.split(/\s+/).filter((w) => /[a-z0-9]/i.test(w)).length >= 4);

export const extractiveSummary = (rawText) => {
  const text = cleanTranscript(rawText);
  const sentences = splitSentences(text);

  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
  const seen = new Set();
  const unique = sentences.filter((s) => {
    const key = norm(s);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const used = new Set();
  const take = (list, limit) => {
    const out = [];
    for (const s of list) {
      const key = norm(s);
      if (used.has(key)) continue;
      used.add(key);
      out.push(s);
      if (out.length >= limit) break;
    }
    return out;
  };

  const homework = take(unique.filter((s) => /homework|assignment|due\b|worksheet|submit|read chapter|read the chapter|study for|bring to class/i.test(s)), 6);
  const classwork = take(unique.filter((s) => /classwork|in class|quiz|\btest\b|\bexam\b|lab work|group work/i.test(s)), 6);
  const terms = take(unique.filter((s) => {
    if (/\?\s*$/.test(s)) return false;
    if (/\b(means|is defined as|refers to|is called)\b/i.test(s)) return true;
    const colon = s.match(/^([A-Za-z][A-Za-z \-]{2,30}):\s+(.+)$/);
    if (!colon) return false;
    if (colon[1].trim().split(/\s+/).length > 3) return false;
    return /\b(is|are|the|a|an|process|term|idea|value|layer|cell|energy|force)\b/i.test(colon[2]);
  }), 8);
  const overview = take(unique, 2);
  const concepts = take(unique, 8);

  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const section = (title, body) => `<h2>${title}</h2>${body}`;
  const listOrNone = (items) => items.length
    ? `<ul>${items.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>`
    : '<p>None mentioned.</p>';

  return [
    section('Overview', overview.length ? `<p>${esc(overview.join(' '))}</p>` : '<p>No transcript text.</p>'),
    section('Key concepts', listOrNone(concepts)),
    section('Terms', listOrNone(terms)),
    section('Classwork', listOrNone(classwork)),
    section('Homework', listOrNone(homework)),
  ].join('');
};

const isGrounded = (html, source) => {
  const div = document.createElement('div');
  div.innerHTML = html;
  const generated = [...new Set(contentWords(div.textContent || ''))];
  const sourceSet = new Set(contentWords(source));
  if (generated.length < 30) return true;
  const hits = generated.reduce((n, word) => n + (sourceSet.has(word) ? 1 : 0), 0);

  return hits / generated.length >= 0.18;
};

export const summarizeLocally = async ({ text, modelId, instructions, onStatus }) => {
  const inputWords = contentWords(text);
  if (inputWords.length < 25) {
    throw new Error('This note is too short to summarize. Add at least a few sentences first.');
  }

  if (inputWords.length < 55) {
    onStatus?.({ phase: 'work', text: 'Formatting a short transcript without adding facts' });
    return extractiveSummary(text);
  }
  const gpu = await webgpuInfo();
  const useGpu = !!gpu.usable;
  let chosenModel = modelId === 'auto' && !useGpu ? 'qwen05' : modelId;
  const requested = resolveLocalLlm(chosenModel, detectHardware());
  if (!useGpu && !requested.cpuSafe) chosenModel = 'qwen05';
  const model = resolveLocalLlm(chosenModel, detectHardware());
  const attempts = useGpu
    ? [{ device: 'webgpu', dtype: 'q4f16' }, { device: 'wasm', dtype: 'q4', threads: 1 }]
    : [{ device: 'wasm', dtype: 'q4', threads: 1 }];

  const cut = capInput(text);
  onStatus?.({ phase: 'work', text: cut.truncated ? 'Writing notes (transcript trimmed)' : 'Writing notes' });
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: buildPrompt(cut.text, instructions) },
  ];
  let lastErr = null;
  for (const attempt of attempts) {
    try {
      const gen = await getPipeline('text-generation', model.repo, attempt, onStatus);
      onStatus?.({ phase: 'work', text: `Generating notes with ${model.label}` });
      const out = await withTimeout(gen(messages, {
        max_new_tokens: 220,
        do_sample: true,
        temperature: 0.2,
        top_p: 0.9,
        repetition_penalty: 1.15,
        no_repeat_ngram_size: 4,
        return_full_text: false,
      }), 90000, `${model.label} inference`);
      const raw = out?.[0]?.generated_text;
      const content = Array.isArray(raw) ? raw[raw.length - 1]?.content || '' : String(raw || '');
      const html = toHtmlFragment(content);
      if (!isGrounded(html, cut.text)) {
        onStatus?.({ phase: 'work', text: 'Model added facts not in the transcript, using an extractive version instead' });
        return extractiveSummary(cut.text);
      }
      return html;
    } catch (e) {
      lastErr = e;
      if (attempt.device === 'webgpu') await blockWebgpu();
      console.warn('[notetaker] local model attempt failed', attempt, e);
    }
  }

  if (model.id !== 'qwen05') {
    const fallback = LOCAL_LLM_MODELS.find((m) => m.id === 'qwen05');
    onStatus?.({ phase: 'loading', text: 'Selected model failed, trying the small local fallback', detail: fallback.repo });
    try {
      const gen = await getPipeline('text-generation', fallback.repo, { device: 'wasm', dtype: 'q4' }, onStatus);
      const out = await withTimeout(gen(messages, {
        max_new_tokens: 260,
        do_sample: true,
        temperature: 0.15,
        top_p: 0.85,
        repetition_penalty: 1.18,
        no_repeat_ngram_size: 4,
        return_full_text: false,
      }), 45000, 'Small local model inference');
      const raw = out?.[0]?.generated_text;
      const content = Array.isArray(raw) ? raw[raw.length - 1]?.content || '' : String(raw || '');
      const html = toHtmlFragment(content);
      if (isGrounded(html, cut.text)) return html;
      return extractiveSummary(cut.text);
    } catch (e) {
      lastErr = e;
      console.warn('[notetaker] small local fallback failed', e);
    }
  }

  onStatus?.({ phase: 'fallback', text: 'Local model did not run. These notes are formatted directly from the transcript, with no generated facts.' });
  return extractiveSummary(cut.text);
};

export const chatLocally = async ({ messages, modelId, onStatus, maxTokens = 512 }) => {
  const gpu = await webgpuInfo();
  const useGpu = !!gpu.usable;
  const wanted = modelId === 'auto' && !useGpu ? 'qwen05' : modelId;
  const requested = resolveLocalLlm(wanted, detectHardware());
  const model = resolveLocalLlm(!useGpu && !requested.cpuSafe ? 'qwen05' : wanted, detectHardware());
  const attempts = useGpu
    ? [{ device: 'webgpu', dtype: 'q4f16' }, { device: 'wasm', dtype: 'q4', threads: 1 }]
    : [{ device: 'wasm', dtype: 'q4', threads: 1 }];
  let lastErr = null;
  for (const attempt of attempts) {
    try {
      const gen = await getPipeline('text-generation', model.repo, attempt, onStatus);
      onStatus?.({ phase: 'work', text: `Answering with ${model.label}` });
      const out = await withTimeout(gen(messages, {
        max_new_tokens: maxTokens,
        do_sample: true,
        temperature: 0.3,
        top_p: 0.9,
        repetition_penalty: 1.15,
        no_repeat_ngram_size: 4,
        return_full_text: false,
      }), 60000, 'Local answer');
      const raw = out?.[0]?.generated_text;
      return Array.isArray(raw) ? raw[raw.length - 1]?.content || '' : String(raw || '');
    } catch (e) {
      lastErr = e;
      if (attempt.device === 'webgpu') await blockWebgpu();
      console.warn('[notetaker] local chat attempt failed', attempt, e);
    }
  }
  throw new Error(`The local model could not answer (${String(lastErr?.message || lastErr).slice(0, 160)}).`);
};

const providerHeaders = (providerId, key) => {
  if (providerId === 'anthropic') {
    return {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    };
  }
  if (providerId === 'google') return { 'content-type': 'application/json' };
  return { 'content-type': 'application/json', Authorization: `Bearer ${key}` };
};

async function readError(res) {
  let detail = '';
  try {
    const text = await res.text();
    try {
      const j = JSON.parse(text);
      detail = j?.error?.message || j?.message || j?.error || j?.detail || text;
    } catch { detail = text; }
  } catch { }
  return `${res.status} ${res.statusText}${detail ? ` - ${String(detail).slice(0, 240)}` : ''}`;
}

export const transcribeWithProvider = async ({ providerId, model, blob, settings, language = 'en' }) => {
  const key = providerKey(providerId, settings);
  const base = providerBase(providerId, settings);
  if (!key) throw new Error(`No API key saved for ${PROVIDERS[providerId]?.label || providerId}.`);
  if (!base) throw new Error('This provider needs a base URL in Settings.');
  const modelName = model || PROVIDERS[providerId]?.audioModels?.[0];

  if (providerId === 'assemblyai') {
    const up = await fetch(`${base}/upload`, {
      method: 'POST',
      headers: { authorization: key, 'content-type': 'application/octet-stream' },
      body: blob,
    });
    if (!up.ok) throw new Error(await readError(up));
    const { upload_url: uploadUrl } = await up.json();

    const created = await fetch(`${base}/transcript`, {
      method: 'POST',
      headers: { authorization: key, 'content-type': 'application/json' },
      body: JSON.stringify({
        audio_url: uploadUrl,
        speech_models: [modelName, 'universal-2'].filter((m, i, a) => m && a.indexOf(m) === i),
        language_code: language || 'en',
      }),
    });
    if (!created.ok) throw new Error(await readError(created));
    const job = await created.json();

    for (let i = 0; i < 150; i += 1) {
      await new Promise((r) => setTimeout(r, 2000));
      const poll = await fetch(`${base}/transcript/${job.id}`, { headers: { authorization: key } });
      if (!poll.ok) throw new Error(await readError(poll));
      const data = await poll.json();
      if (data.status === 'completed') return String(data.text || '').trim();
      if (data.status === 'error') throw new Error(data.error || 'AssemblyAI failed.');
    }
    throw new Error('AssemblyAI timed out.');
  }

  if (providerId === 'deepgram') {
    const res = await fetch(`${base}/listen?model=${encodeURIComponent(modelName)}&smart_format=true&punctuate=true`, {
      method: 'POST',
      headers: { Authorization: `Token ${key}`, 'content-type': blob.type || 'audio/webm' },
      body: blob,
    });
    if (!res.ok) throw new Error(await readError(res));
    const data = await res.json();
    return String(data?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '').trim();
  }

  if (providerId === 'elevenlabs') {
    const form = new FormData();
    form.append('file', blob, 'recording.webm');
    form.append('model_id', modelName);
    const res = await fetch(`${base}/speech-to-text`, { method: 'POST', headers: { 'xi-api-key': key }, body: form });
    if (!res.ok) throw new Error(await readError(res));
    const data = await res.json();
    return String(data.text || '').trim();
  }

  const form = new FormData();
  form.append('file', blob, 'recording.webm');
  form.append('model', modelName);
  if (language) form.append('language', language);
  const res = await fetch(`${base}/audio/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  if (!res.ok) throw new Error(await readError(res));
  const data = await res.json();
  return String(data.text || '').trim();
};

const chatOpenAiCompatible = async ({ base, key, model, messages, temperature = 0.2, maxTokens = 2000 }) => {
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
  });
  if (!res.ok) throw new Error(await readError(res));
  const data = await res.json();
  return String(data?.choices?.[0]?.message?.content || '').trim();
};

export const chatComplete = async ({ providerId, model, messages, settings, temperature, maxTokens }) => {
  const key = providerKey(providerId, settings);
  const base = providerBase(providerId, settings);
  if (!key) throw new Error(`No API key saved for ${PROVIDERS[providerId]?.label || providerId}.`);
  if (!base) throw new Error('This provider needs a base URL in Settings.');

  if (providerId === 'anthropic') {
    const sys = messages.find((m) => m.role === 'system')?.content || '';
    const rest = messages.filter((m) => m.role !== 'system');
    const res = await fetch(`${base}/messages`, {
      method: 'POST',
      headers: providerHeaders('anthropic', key),
      body: JSON.stringify({
        model, max_tokens: maxTokens || 2048, system: sys,
        temperature: temperature ?? 0.2,
        messages: rest.map((m) => ({ role: m.role, content: m.content })),
      }),
    });
    if (!res.ok) throw new Error(await readError(res));
    const data = await res.json();
    return (data?.content || []).map((c) => c?.text || '').join('').trim();
  }

  if (providerId === 'google') {
    const sys = messages.find((m) => m.role === 'system')?.content || '';
    const rest = messages.filter((m) => m.role !== 'system');
    const res = await fetch(`${base}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: sys ? { parts: [{ text: sys }] } : undefined,
        contents: rest.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        generationConfig: { temperature: temperature ?? 0.2, maxOutputTokens: maxTokens || 2048 },
      }),
    });
    if (!res.ok) throw new Error(await readError(res));
    const data = await res.json();
    return (data?.candidates?.[0]?.content?.parts || []).map((p) => p?.text || '').join('').trim();
  }

  return chatOpenAiCompatible({ base, key, model, messages, temperature, maxTokens });
};

export const summarize = async ({ text, engine, settings, instructions, onStatus }) => {
  if (engine === 'local') {
    const html = await summarizeLocally({
      text,
      modelId: settings?.localSummaryModel,
      instructions,
      onStatus,
    });
    return renderMathInHtml(html);
  }
  const providerId = settings?.summaryProvider;
  if (!providerId) throw new Error('Pick a provider in Settings first.');
  const model = settings?.summaryModel || PROVIDERS[providerId]?.chatModels?.[0];
  onStatus?.({ phase: 'work', text: `Asking ${PROVIDERS[providerId]?.label || providerId}`, detail: model });
  const raw = await chatComplete({
    providerId,
    model,
    settings,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildPrompt(capInput(text).text, instructions) },
    ],
    temperature: 0.2,
    maxTokens: 2000,
  });
  return renderMathInHtml(toHtmlFragment(raw));
};

export const renderMathInHtml = (html) => {
  if (!html) return html;
  const div = document.createElement('div');
  div.innerHTML = html;

  const decode = (s) => s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  const wrap = (tex, display) => {
    try {
      const rendered = katex.renderToString(decode(tex), {
        throwOnError: false,
        displayMode: display,
        strict: false,
        trust: false,
        output: 'html',
      });
      return `<span class="nt-math"${display ? ' data-display="1"' : ''} contenteditable="false">${rendered}</span>`;
    } catch {
      return tex;
    }
  };

  const replaceInText = (node) => {
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    const targets = [];
    let current = walker.nextNode();
    while (current) {
      if (current.nodeValue && /\$|\\\(|\\\[/.test(current.nodeValue)) targets.push(current);
      current = walker.nextNode();
    }
    for (const textNode of targets) {
      if (!textNode.parentNode || textNode.parentElement.closest('.nt-math, code, pre')) continue;
      const value = textNode.nodeValue;
      const replaced = value
        .replace(/\$\$([\s\S]+?)\$\$/g, (m, tex) => wrap(tex.trim(), true))
        .replace(/\\\[([\s\S]+?)\\\]/g, (m, tex) => wrap(tex.trim(), true))
        .replace(/\\\(([\s\S]+?)\\\)/g, (m, tex) => wrap(tex.trim(), false))
        .replace(/\$([^$\n]+?)\$/g, (m, tex) => wrap(tex.trim(), false));
      if (replaced === value) continue;
      const holder = document.createElement('span');
      holder.innerHTML = replaced;
      textNode.parentNode.replaceChild(holder, textNode);
      while (holder.firstChild) holder.parentNode.insertBefore(holder.firstChild, holder);
      holder.remove();
    }
  };

  replaceInText(div);
  return div.innerHTML;
};

export const normalizeMath = (text) => String(text || '')
  .replace(/\\\[([\s\S]+?)\\\]/g, (_, body) => `\n$$\n${body.trim()}\n$$\n`)
  .replace(/\\\(([\s\S]+?)\\\)/g, (_, body) => `$${body.trim()}$`)
  .replace(/[ \t]*\$\$([\s\S]+?)\$\$[ \t]*/g, (_, body) => `\n$$\n${body.trim()}\n$$\n`);

const plainText = (html) => {
  if (!html) return '';
  const d = document.createElement('div');
  d.innerHTML = html;
  return (d.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
};

export const pickRelevantNotes = (notes, question, limit = 6) => {
  const terms = String(question || '').toLowerCase().match(/[a-z0-9]{3,}/g) || [];
  if (!terms.length || notes.length <= 3) return notes.slice(0, Math.max(limit, notes.length));

  const scored = notes.map((n) => {
    const title = String(n.title || '').toLowerCase();
    const body = plainText(n.html).toLowerCase();
    let score = 0;
    terms.forEach((t) => {
      if (title.includes(t)) score += 6;
      let idx = body.indexOf(t);
      let hits = 0;
      while (idx !== -1 && hits < 12) { hits += 1; idx = body.indexOf(t, idx + t.length); }
      score += hits * 1.5;
    });
    return { n, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const hit = scored.filter((s) => s.score > 0).slice(0, limit).map((s) => s.n);
  return hit.length ? hit : scored.slice(0, Math.min(3, notes.length)).map((s) => s.n);
};

export const askAboutNotes = async ({ question, notes, history = [], settings, providerId, model, generateTitle = false }) => {
  const ctx = notes
    .map((n) => {
      const when = n.edited ? ` (last edited ${new Date(n.edited).toLocaleDateString()})` : '';
      return `### ${n.title}${when}\n${plainText(n.html)}`;
    })
    .join('\n\n')
    .slice(0, 24000);

  const messages = [
    {
      role: 'system',
      content: [
        'You answer questions about the user\'s own notes.',
        'Only use the notes provided. If the answer is not in them, say so plainly.',
        'Do not invent note titles, filenames, paths, dates, or section numbers. The app shows source notes separately.',
        ...(generateTitle ? [
          'This is a new chat. First output exactly one metadata line in this format: [Title]: a concise 3 to 7 word summary of the user question.',
          'Then output a blank line and your answer. Do not repeat the question as the title.',
        ] : []),
        'Be concise. Quote the note when it helps.',
        'Format answers as Markdown: short paragraphs, bullet lists for steps, and fenced code blocks with a language tag for code.',
        'Whenever you compare two or more things, output a GitHub markdown table with | pipes, a header row, and a |---| separator row.',
        'Write math as LaTeX: $...$ inline and $$...$$ on its own lines for display equations.',
        'Never wrap the whole reply in one code fence.',
      ].join(' '),
    },
    { role: 'user', content: `Notes:\n"""\n${ctx || '(no notes)'}\n"""` },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: question },
  ];

  return chatComplete({ providerId, model, messages, settings, temperature: 0.2, maxTokens: 1200 });
};

export const preloadWhisper = async (modelId, onStatus) => {
  const model = resolveWhisper(modelId, detectHardware());
  const gpu = await canUseWebGPU();
  const attempts = [
    { device: 'wasm', dtype: 'q8', threads: 1 },
    { device: 'wasm', dtype: 'q4', threads: 1 },
  ];
  let lastErr = null;
  for (const attempt of attempts) {
    try {
      await getPipeline('automatic-speech-recognition', model.repo, attempt, onStatus);
      return model;
    } catch (e) { lastErr = e; }
  }
  throw new Error(String(lastErr?.message || lastErr || 'Whisper model could not load.').slice(0, 200));
};

export const preloadLocalLlm = async (modelId, onStatus) => {
  const gpu = await webgpuInfo();
  const useGpu = !!gpu.usable;
  const model = resolveLocalLlm(modelId === 'auto' && !useGpu ? 'qwen05' : modelId, detectHardware());
  const attempts = useGpu
    ? [{ device: 'webgpu', dtype: 'q4f16' }, { device: 'wasm', dtype: 'q4', threads: 1 }]
    : [{ device: 'wasm', dtype: 'q4', threads: 1 }];
  let lastErr = null;
  for (const attempt of attempts) {
    try {
      await getPipeline('text-generation', model.repo, attempt, onStatus);
      return model;
    } catch (e) {
      lastErr = e;
      if (attempt.device === 'webgpu') await blockWebgpu();
    }
  }
  throw new Error(String(lastErr?.message || lastErr || 'The local model would not start.').slice(0, 200));
};
