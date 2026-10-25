import { transcribeLocally, transcribeWithProvider, resolveWhisper, detectHardware } from './ai';

const getSpeechRecognition = () => {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

const resampleTo16k = (input, fromRate) => {
  if (fromRate === 16000) return input;
  const ratio = fromRate / 16000;
  const outLen = Math.max(1, Math.floor(input.length / ratio));
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i += 1) {
    const pos = i * ratio;
    const i0 = Math.floor(pos);
    const i1 = Math.min(input.length - 1, i0 + 1);
    const frac = pos - i0;
    out[i] = input[i0] * (1 - frac) + input[i1] * frac;
  }
  return out;
};

const encodeWav = (samples, sampleRate = 16000) => {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buf);
  const str = (o, s) => { for (let i = 0; i < s.length; i += 1) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF');
  v.setUint32(4, 36 + samples.length * 2, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, 'data');
  v.setUint32(40, samples.length * 2, true);
  let o = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    o += 2;
  }
  return new Blob([buf], { type: 'audio/wav' });
};

const words = (s) => String(s || '').toLowerCase().match(/[a-z0-9']+/g) || [];

const stripOverlap = (committed, next) => {
  const tail = words(committed);
  const head = words(next);
  if (!tail.length || !head.length) return String(next || '').trim();
  let best = 0;
  const max = Math.min(tail.length, head.length, 12);
  for (let k = 2; k <= max; k += 1) {
    const a = tail.slice(-k).join(' ');
    const b = head.slice(0, k).join(' ');
    if (a === b) best = k;
  }
  if (!best) return String(next || '').trim();
  const raw = String(next).trim().split(/\s+/);
  return raw.slice(best).join(' ').trim();
};

const rms = (samples) => {
  if (!samples.length) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i += 1) sum += samples[i] * samples[i];
  return Math.sqrt(sum / samples.length);
};

const cleanWhisperChunk = (value) => {
  let text = String(value || '')
    .replace(/\[(?:blank_audio|music|applause|laughter|noise|silence)\]/gi, ' ')
    .replace(/\((?:upbeat music|music|singing|applause|laughter|dog barking|knocking|bell rings|throat clearing|clears throat|blank audio)\)/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return '';
  const words = text.split(/\s+/);
  const originalKeys = words.map((w) => w.toLowerCase().replace(/[^a-z0-9']/g, '')).filter(Boolean);
  if (originalKeys.length >= 10 && new Set(originalKeys).size <= 3) return '';

  const out = [];
  let last = '';
  let repeats = 0;
  for (const word of words) {
    const key = word.toLowerCase().replace(/[^a-z0-9']/g, '');
    repeats = key && key === last ? repeats + 1 : 1;
    last = key;
    if (repeats <= 2) out.push(word);
  }

  const keyOf = (w) => w.toLowerCase().replace(/[^a-z0-9']/g, '');
  for (let size = Math.min(8, Math.floor(out.length / 2)); size >= 2; size -= 1) {
    let collapsed = false;
    for (let i = 0; i + size * 2 <= out.length; i += 1) {
      const phrase = out.slice(i, i + size).map(keyOf).join(' ');
      if (!phrase.trim()) continue;
      let copies = 1;
      while (i + size * (copies + 1) <= out.length &&
        out.slice(i + size * copies, i + size * (copies + 1)).map(keyOf).join(' ') === phrase) copies += 1;
      if (copies >= 2) {
        out.splice(i + size, size * (copies - 1));
        collapsed = true;
        break;
      }
    }
    if (collapsed) break;
  }

  const normalized = out.map(keyOf).filter(Boolean);
  if (normalized.length >= 8 && new Set(normalized).size / normalized.length < 0.3) return '';
  return out.join(' ');
};

export const createLiveTranscriber = ({
  engine, settings, whisperId, providerId, model, language = 'en',
  onPartial, onFinal, onStatus, onError,
}) => {
  let stopped = false;
  let ctx = null;
  let source = null;
  let proc = null;
  let stream = null;
  let recorder = null;
  let recognition = null;
  let want = false;
  let queue = [];
  let networkFailures = 0;

  const stop = () => {
    stopped = true;
    want = false;
    try { recognition?.stop?.(); } catch { }
    recognition = null;
    try {
      if (recorder && recorder.state !== 'inactive') recorder.stop();
    } catch { }
    recorder = null;
    try { proc?.disconnect?.(); } catch { }
    try { source?.disconnect?.(); } catch { }
    try { ctx?.close?.(); } catch { }
    stream?.getTracks?.().forEach((t) => t.stop());
    proc = null; source = null; ctx = null; stream = null;
    queue = [];
  };

  const startSpeech = async () => {
    const SR = getSpeechRecognition();
    if (!SR) {
      onError?.('This browser has no built in speech engine. Pick Local Whisper or an API key.', { fatal: true });
      return false;
    }

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.maxAlternatives = 1;

    rec.onaudiostart = () => console.log('[notetaker] speech: audio start');
    rec.onspeechstart = () => console.log('[notetaker] speech: speech detected');
    rec.onspeechend = () => console.log('[notetaker] speech: speech ended');
    rec.onstart = () => {
      console.log('[notetaker] speech: recognizer started');
      onStatus?.({ phase: 'live', text: 'Listening' });
    };

    rec.onresult = (e) => {
      if (stopped || !want) return;
      networkFailures = 0;
      let fin = '';
      let intr = '';
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) fin += t;
        else intr += t;
      }
      if (fin) onFinal?.(fin.trim());
      onPartial?.(intr.trim());
    };

    rec.onerror = (e) => {
      if (stopped || !want) return;
      const code = String(e?.error || '');
      console.warn('[notetaker] speech error:', code, e?.message || '');
      if (code === 'network') {
        networkFailures += 1;
        if (networkFailures >= 3) {

          onError?.(
            'This browser cannot reach its speech service, so Live captions will not work here. Switch to Whisper or an API key.',
            { fatal: true, disableLive: true },
          );
          return;
        }
        onError?.(
          `Live captions could not connect (attempt ${networkFailures} of 3).`,
          { fatal: false },
        );
        onStatus?.({ phase: 'live', text: 'Live captions cannot connect' });
      } else if (code === 'not-allowed' || code === 'service-not-allowed') {
        onError?.('Microphone access was blocked. Allow it for this site, then try again.', { fatal: true });
      } else if (code === 'audio-capture') {
        onError?.('No microphone was found.', { fatal: true });
      } else if (code !== 'no-speech' && code !== 'aborted') {
        onError?.(`Live captions reported: ${code}`, { fatal: false });
      }
    };

    rec.onend = () => {
      if (want && !stopped) {

        try { rec.start(); } catch (e) {
          onStatus?.({ phase: 'live', text: 'Live captions stopped restarting' });
        }
      }
    };

    recognition = rec;
    want = true;
    try { rec.start(); } catch (e) {
      onError?.(`Could not start live captions: ${String(e?.message || e)}`, { fatal: true });
      return false;
    }
    return true;
  };

  const startChunks = async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: true,
        },
      });
    } catch {
      onError?.('Could not open the microphone. Check the permission and try again.', { fatal: true });
      return;
    }

    const Ctx = window.AudioContext || window.webkitAudioContext;
    try {
      ctx = new Ctx({ sampleRate: 16000 });
    } catch {
      ctx = new Ctx();
    }
    source = ctx.createMediaStreamSource(stream);
    const sampleRate = ctx.sampleRate;

    const bufferSize = 4096;
    proc = ctx.createScriptProcessor(bufferSize, 1, 1);

    let pending = [];
    let pendingLen = 0;
    let busy = false;
    let carry = new Float32Array(0);
    let committed = '';

    const hopSeconds = engine === 'local' ? 2 : 4;
    const overlapSeconds = engine === 'local' ? 4 : 1;
    const targetLen = Math.floor(sampleRate * hopSeconds);
    const carryLen = Math.floor(sampleRate * overlapSeconds);

    const flush = async () => {
      if (busy || stopped) return;
      if (pendingLen < Math.floor(sampleRate * 0.5)) return;
      const merged = new Float32Array(carry.length + pendingLen);
      merged.set(carry, 0);
      let off = carry.length;
      for (const chunk of pending) { merged.set(chunk, off); off += chunk.length; }
      pending = [];
      pendingLen = 0;

      if (rms(merged) < 0.01) return;

      const audio16k = resampleTo16k(merged, sampleRate);
      busy = true;
      try {
        const blob = encodeWav(audio16k, 16000);
        if (engine === 'local') {
          const raw = await transcribeLocally({ blob, modelId: whisperId, language, onStatus });
          const text = cleanWhisperChunk(raw);
          const fresh = stripOverlap(committed, text);
          if (fresh) {
            committed = committed ? `${committed} ${fresh}` : fresh;
            if (!stopped) onFinal?.(fresh);
          }
        } else {
          const text = await transcribeWithProvider({ providerId, model, blob, settings, language });
          if (text && !stopped) onFinal?.(text);
        }
        if (!stopped) onStatus?.({ phase: 'live', text: 'Listening' });
      } catch (e) {
        if (!stopped) onError?.(String(e?.message || e), { fatal: true });
      } finally {
        busy = false;
      }
      carry = merged.slice(Math.max(0, merged.length - carryLen));
    };

    proc.onaudioprocess = (e) => {
      if (stopped) return;
      const data = e.inputBuffer.getChannelData(0);
      const copy = new Float32Array(data.length);
      copy.set(data);
      pending.push(copy);
      pendingLen += copy.length;
      if (pendingLen >= targetLen) flush();
    };

    const mute = ctx.createGain();
    mute.gain.value = 0;
    source.connect(proc);
    proc.connect(mute);
    mute.connect(ctx.destination);

    onStatus?.({
      phase: 'live',
      text: engine === 'local'
        ? `Listening with ${resolveWhisper(whisperId, detectHardware()).label}, ${hopSeconds}s updates`
        : 'Listening',
    });
  };

  return {
    async start() {
      stopped = false;
      if (engine === 'webspeech') return startSpeech();
      await startChunks();
      return !stopped && !!stream;
    },
    stop,
  };
};
