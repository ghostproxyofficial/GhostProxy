import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Mic,
  Square,
  Sparkles,
  Copy,
  Check,
  Trash2,
  Download,
  Play,
  Pause,
  FileText,
  AlertTriangle,
  Loader,
} from 'lucide-react';
import { useOptions } from '/src/utils/optionsContext';

const NOTES_STORAGE_KEY = 'ghostNotesDraft';
const WHISPER_CDN = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3';
const WHISPER_MODEL = 'Xenova/whisper-tiny.en';
const SUMMARY_PROMPT_HEADER = [
  'Summarize the following lecture transcript into clean study notes.',
  'Format it as:',
  '1. A 2-3 sentence overview',
  '2. Key concepts as bullet points',
  '3. Important terms and their definitions',
  '4. Anything assigned or due (homework, readings)',
  '',
  'Transcript:',
].join('\n');

const getSpeechRecognition = () => {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

const getTopWindow = () => {
  try {
    return window.top && window.top !== window ? window.top : window;
  } catch {
    return window;
  }
};

// decode the recorded blob into mono float32 pcm at 16khz, thats what whisper wants
const decodeAudioToMono16k = async (blob) => {
  const arrayBuffer = await blob.arrayBuffer();
  const Ctx = window.AudioContext || window.webkitAudioContext;
  let ctx;
  try {
    ctx = new Ctx({ sampleRate: 16000 });
  } catch {
    ctx = new Ctx();
  }
  try {
    const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
    const channels = decoded.numberOfChannels;
    const length = decoded.length;
    const out = new Float32Array(length);
    for (let c = 0; c < channels; c += 1) {
      const data = decoded.getChannelData(c);
      for (let i = 0; i < length; i += 1) out[i] += data[i] / channels;
    }
    return out;
  } finally {
    try { ctx.close(); } catch { }
  }
};

const Notes = memo(() => {
  const { options } = useOptions();
  const isLight = options.type === 'light' || options.theme === 'light' || options.themeName === 'lightTheme';
  const textColor = options.siteTextColor || (isLight ? '#0f172a' : '#ffffff');
  const mutedColor = isLight ? '#475569' : 'rgba(255,255,255,0.7)';
  const panelBg = isLight ? 'rgba(255,255,255,0.75)' : 'rgba(20,22,27,0.72)';
  const borderColor = isLight ? 'rgba(15,23,42,0.12)' : 'rgba(255,255,255,0.12)';
  const inputBg = isLight ? 'rgba(255,255,255,0.85)' : 'rgba(10,12,16,0.6)';

  const speechSupported = useMemo(() => !!getSpeechRecognition(), []);

  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [showNoWords, setShowNoWords] = useState(false);
  const [whisperBusy, setWhisperBusy] = useState(false);
  const [whisperProgress, setWhisperProgress] = useState('');

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const audioBlobRef = useRef(null);
  const recordingRef = useRef(false);
  const injectTimerRef = useRef(null);

  // restore any saved draft
  useEffect(() => {
    try {
      const saved = localStorage.getItem(NOTES_STORAGE_KEY);
      if (saved) setTranscript(saved);
    } catch { }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(NOTES_STORAGE_KEY, transcript); } catch { }
  }, [transcript]);

// "no words" hint, offer the offline model after 5s of recording with an
// empty transcript. hides as soon as any words show up
  useEffect(() => {
    if (!recording || transcript.trim() || interim) {
      setShowNoWords(false);
      return undefined;
    }
    const timer = window.setTimeout(() => setShowNoWords(true), 5000);
    return () => window.clearTimeout(timer);
  }, [recording, transcript, interim]);

  const stopEverything = useCallback(() => {
    recordingRef.current = false;
    try { recognitionRef.current?.stop?.(); } catch { }
    recognitionRef.current = null;
    try {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') recorder.stop();
    } catch { }
    mediaRecorderRef.current = null;
    try { streamRef.current?.getTracks?.().forEach((track) => track.stop()); } catch { }
    streamRef.current = null;
    setRecording(false);
    setPaused(false);
    setInterim('');
  }, []);

  useEffect(() => () => {
    stopEverything();
    if (injectTimerRef.current) window.clearTimeout(injectTimerRef.current);
  }, [stopEverything]);

  const startRecognition = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0]?.transcript || '';
        if (result.isFinal) finalText += text;
        else interimText += text;
      }
      if (finalText) {
        setTranscript((prev) => {
          const needsSpace = prev && !/\s$/.test(prev);
          return `${prev}${needsSpace ? ' ' : ''}${finalText.trim()}`;
        });
      }
      setInterim(interimText);
    };

    recognition.onerror = (event) => {
      if (event?.error === 'not-allowed' || event?.error === 'service-not-allowed') {
        setError('Microphone access was blocked. Allow it and try again.');
        stopEverything();
      }
    };

    recognition.onend = () => {
      if (recordingRef.current) {
        try { recognition.start(); } catch { }
      }
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch { }
  }, [stopEverything]);

  const startRecording = useCallback(async () => {
    setError('');

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      chunksRef.current = [];
      try {
        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
        };
        recorder.onstop = () => {
          try {
            const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
            audioBlobRef.current = blob;
            setAudioUrl((prev) => {
              if (prev) { try { URL.revokeObjectURL(prev); } catch { } }
              return URL.createObjectURL(blob);
            });
          } catch { }
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
      } catch {
        // transcription can still work without a saved recording
      }

      recordingRef.current = true;
      setRecording(true);
      setPaused(false);

      if (speechSupported) {
        startRecognition();
      }
    } catch {
      setError('Could not access the microphone.');
      stopEverything();
    }
  }, [speechSupported, startRecognition, stopEverything]);

  const togglePause = useCallback(() => {
    const nextPaused = !paused;
    setPaused(nextPaused);
    try {
      const recorder = mediaRecorderRef.current;
      if (recorder) {
        if (nextPaused && recorder.state === 'recording') recorder.pause();
        else if (!nextPaused && recorder.state === 'paused') recorder.resume();
      }
    } catch { }
    try {
      if (nextPaused) recognitionRef.current?.stop?.();
      else if (recordingRef.current) recognitionRef.current?.start?.();
    } catch { }
  }, [paused]);

  const copyText = useCallback(async (text, tag) => {
    try {
      await navigator.clipboard.writeText(text || '');
      setCopied(tag);
      window.setTimeout(() => setCopied(''), 1500);
      return true;
    } catch {
      return false;
    }
  }, []);

  const clearAll = useCallback(() => {
    stopEverything();
    setTranscript('');
    setInterim('');
    setError('');
    audioBlobRef.current = null;
    setAudioUrl((prev) => {
      if (prev) { try { URL.revokeObjectURL(prev); } catch { } }
      return '';
    });
    try { localStorage.removeItem(NOTES_STORAGE_KEY); } catch { }
  }, [stopEverything]);

  const downloadTranscript = useCallback(() => {
    try {
      const blob = new Blob([transcript], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ghost-notes-${Date.now()}.txt`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch { }
  }, [transcript]);

  const buildPrompt = useCallback(
    () => `${SUMMARY_PROMPT_HEADER}\n${transcript.trim()}`,
    [transcript],
  );

  // whisper fallback, works in firefox or anything with wasm
  const transcribeWithWhisper = useCallback(async () => {
    const blob = audioBlobRef.current;
    if (!blob) {
      setError('Record something first, then transcribe.');
      return;
    }

    setError('');
    setWhisperBusy(true);
    setWhisperProgress('Loading speech model…');

    try {
      const mod = await import(/* @vite-ignore */ WHISPER_CDN);
      const pipeline = mod.pipeline;
      if (typeof pipeline !== 'function') throw new Error('transformers.js unavailable');

      const transcriber = await pipeline('automatic-speech-recognition', WHISPER_MODEL, {
        progress_callback: (p) => {
          if (p?.status === 'progress' && Number.isFinite(p.progress)) {
            setWhisperProgress(`Downloading model ${Math.round(p.progress)}%`);
          } else if (p?.status === 'ready') {
            setWhisperProgress('Model ready — transcribing…');
          }
        },
      });

      setWhisperProgress('Transcribing audio…');
      const audio = await decodeAudioToMono16k(blob);
      const result = await transcriber(audio, { chunk_length_s: 30, stride_length_s: 5 });
      const text = String(result?.text || '').trim();

      if (text) {
        setTranscript((prev) => (prev ? `${prev.trim()}\n${text}` : text));
      } else {
        setError('No speech detected in the recording.');
      }
    } catch (e) {
      setError('Whisper transcription failed. Check your connection and try again.');
    } finally {
      setWhisperBusy(false);
      setWhisperProgress('');
    }
  }, []);

  // summarize through duck.ai in a real ghost tab
  const openDuckWithPrompt = useCallback(async () => {
    if (!transcript.trim()) return;
    const prompt = buildPrompt();

    // always leave the prompt on the clipboard so pasting always works
    await copyText(prompt, 'prompt');

    const topWin = getTopWindow();
    const opener = topWin.__ghostOpenBrowserTab;

    if (typeof opener === 'function') {
      let tabId = null;
      try {
        tabId = opener('https://duck.ai', { title: 'Duck.ai', displayUrl: 'ghost://duckai' });
      } catch { }

      // fill the composer once the tab boots, best effort
      if (tabId && injectTimerRef.current === null) {
        let tries = 0;
        const tryInject = () => {
          tries += 1;
          let frame = null;
          try {
            frame = topWin.document.querySelector(`iframe[data-ghost-tab-id="${tabId}"]`);
          } catch { }
          if (frame) {
            try {
              const doc = frame.contentDocument;
              const textarea = doc?.querySelector('textarea');
              if (textarea) {
                textarea.focus();
// execCommand makes duck.ai's framework accept it, plain value assignment
// just gets reverted
                let filled = false;
                try {
                  filled = doc.execCommand('insertText', false, prompt);
                } catch { filled = false; }
                if (filled || String(textarea.value || '').includes(prompt.slice(0, 24))) {
                  injectTimerRef.current = null;
                  return;
                }
              }
              const editable = doc?.querySelector('[contenteditable="true"]');
              if (editable) {
                editable.focus();
                editable.textContent = prompt;
                editable.dispatchEvent(new InputEvent('input', { bubbles: true, data: prompt, inputType: 'insertText' }));
                injectTimerRef.current = null;
                return;
              }
            } catch { }
          }
          if (tries < 20) injectTimerRef.current = window.setTimeout(tryInject, 1500);
          else injectTimerRef.current = null;
        };
        injectTimerRef.current = window.setTimeout(tryInject, 3000);
      }
      return;
    }

    // not inside ghost, fall back to a normal new tab
    try { window.open('https://duck.ai', '_blank', 'noopener,noreferrer'); } catch { }
  }, [buildPrompt, transcript, copyText]);

  const wordCount = useMemo(
    () => transcript.trim().split(/\s+/).filter(Boolean).length,
    [transcript],
  );

  return (
    <div className="h-full w-full overflow-auto px-4 py-8" style={{ color: textColor }}>
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <FileText size={26} />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Ghost Notes</h1>
        </div>

        <div>
          {/* recorder + transcript */}
          <section className="rounded-2xl border p-4 md:p-5" style={{ backgroundColor: panelBg, borderColor }}>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {!recording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-sm font-semibold transition hover:bg-white/20"
                >
                  <Mic size={16} /> Start recording
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={stopEverything}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-sm font-semibold transition hover:bg-white/20"
                  >
                    <Square size={15} /> Stop
                  </button>
                  <button
                    type="button"
                    onClick={togglePause}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-sm font-semibold transition hover:bg-white/20"
                  >
                    {paused ? <Play size={15} /> : <Pause size={15} />}
                    {paused ? 'Resume' : 'Pause'}
                  </button>
                  {!paused && (
                    <span className="inline-flex items-center gap-2 text-xs" style={{ color: mutedColor }}>
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" /> Listening…
                    </span>
                  )}
                </>
              )}

              <span className="ml-auto text-xs" style={{ color: mutedColor }}>
                {wordCount} words
              </span>
            </div>

            {error && (
              <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <textarea
              value={interim ? `${transcript}${transcript && !/\s$/.test(transcript) ? ' ' : ''}${interim}` : transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={speechSupported ? 'Your transcript will appear here as you speak…' : 'Record, then use "Transcribe recording" — or type/paste your notes here…'}
              className="h-72 w-full resize-y rounded-xl border p-3 text-sm leading-relaxed outline-none"
              style={{ backgroundColor: inputBg, borderColor, color: textColor }}
            />

            {showNoWords && (
              <div className="mt-2 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                No words detected, you may have to use the Firefox model after the lecture finishes.
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={openDuckWithPrompt}
                disabled={!transcript.trim()}
                className={transcript.trim()
                  ? 'inline-flex h-9 items-center gap-2 rounded-lg border border-green-600 bg-green-600 px-3 text-xs font-semibold text-white transition hover:bg-green-500 disabled:opacity-40'
                  : 'inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition hover:bg-white/10 disabled:opacity-40'}
                style={transcript.trim() ? undefined : { borderColor }}
              >
                <Sparkles size={13} /> Summarize with Duck.ai
              </button>
              <button
                type="button"
                onClick={() => copyText(transcript, 'transcript')}
                disabled={!transcript.trim()}
                className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition hover:bg-white/10 disabled:opacity-40"
                style={{ borderColor }}
              >
                {copied === 'transcript' ? <Check size={13} /> : <Copy size={13} />} Copy
              </button>
              <button
                type="button"
                onClick={downloadTranscript}
                disabled={!transcript.trim()}
                className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition hover:bg-white/10 disabled:opacity-40"
                style={{ borderColor }}
              >
                <Download size={13} /> Download .txt
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-400/25 px-3 text-xs font-medium text-red-300 transition hover:bg-red-500/15"
              >
                <Trash2 size={13} /> Clear
              </button>

              {audioUrl && (
                <audio
                  src={audioUrl}
                  controls
                  className="ml-auto h-9 max-w-[220px]"
                />
              )}
            </div>

            {audioUrl && wordCount === 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={transcribeWithWhisper}
                  disabled={whisperBusy}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition hover:bg-white/10 disabled:opacity-50"
                  style={{ borderColor }}
                >
                  {whisperBusy ? <Loader size={13} className="animate-spin" /> : <Mic size={13} />}
                  {whisperBusy ? 'Transcribing…' : 'Transcribe recording (works in Firefox)'}
                </button>
                {whisperProgress && (
                  <span className="text-xs" style={{ color: mutedColor }}>{whisperProgress}</span>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
});

Notes.displayName = 'Notes';
export default Notes;
