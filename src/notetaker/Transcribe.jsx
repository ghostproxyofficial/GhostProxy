import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Mic, Square, Cloud, Cpu, Radio, AlertTriangle, Download, Check, Loader2 } from 'lucide-react';
import {
  PROVIDERS, WHISPER_MODELS, detectHardware, recommendWhisper, resolveWhisper,
  providerReady, modelDownloaded, preloadWhisper,
} from './ai';
import { createLiveTranscriber } from './live';
import Status from './Status';

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

const Transcribe = ({ settings, beginTranscript, setLiveTranscript, onSwitchToSummarize }) => {
  const hw = useMemo(() => detectHardware(), []);
  const [engine, setEngine] = useState(settings.transcribeEngine || 'webspeech');
  const [whisperId, setWhisperId] = useState(settings.whisperModel || 'auto');
  const [providerId, setProviderId] = useState(settings.transcribeProvider || '');
  const [model, setModel] = useState(settings.transcribeModel || '');

  const [recording, setRecording] = useState(false);
  const [starting, setStarting] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [interim, setInterim] = useState('');
  const [words, setWords] = useState(0);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [downloaded, setDownloaded] = useState(false);

  const [ask, setAsk] = useState(false);
  const [noDataHint, setNoDataHint] = useState(false);
  const [liveUnavailable, setLiveUnavailable] = useState(false);
  const [emptyChunks, setEmptyChunks] = useState(0);

  const liveRef = useRef(null);
  const timerRef = useRef(null);
  const committedRef = useRef('');
  const resolved = resolveWhisper(whisperId, hw);

  useEffect(() => { setDownloaded(modelDownloaded(resolved.repo)); }, [resolved.repo]);

  useEffect(() => {
    if (!providerId) {
      const first = Object.entries(PROVIDERS).find(([id, p]) => p.audio && providerReady(id, settings));
      if (first) {
        setProviderId(first[0]);
        setModel(PROVIDERS[first[0]].audioModels[0]);
      }
    }
  }, [providerId, settings]);

  const stop = useCallback(() => {
    liveRef.current?.stop?.();
    liveRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setRecording(false);
    setInterim('');
    setStatus(null);
    setLiveTranscript?.(committedRef.current);
  }, [setLiveTranscript]);

  useEffect(() => () => stop(), [stop]);

  useEffect(() => {
    if (!starting) return undefined;
    const timer = setTimeout(() => {
      setStarting(false);
      setError('Could not start recording. Check the provider key and your network, then try again.');
      stop();
    }, 30000);
    return () => clearTimeout(timer);
  }, [starting, stop]);

  useEffect(() => {
    if (!recording || engine !== 'webspeech' || words > 0 || interim) {
      setNoDataHint(false);
      return undefined;
    }
    const timer = setTimeout(() => setNoDataHint(true), 9000);
    return () => clearTimeout(timer);
  }, [recording, engine, words, interim]);

  const start = async () => {
    if (starting || recording) return;
    setError('');
    setInterim('');
    setAsk(false);
    setWords(0);
    setStatus(null);
    setElapsed(0);
    committedRef.current = '';
    beginTranscript?.();
    setLiveTranscript?.('');

    if (engine === 'cloud' && !providerReady(providerId, settings)) {
      setError(`Add a key for ${PROVIDERS[providerId]?.label || 'a provider'} in Settings first.`);
      return;
    }

    if (engine === 'local') {
      setStarting(true);
      setStatus({ phase: 'loading', text: 'Loading Whisper model' });
      try {
        await preloadWhisper(whisperId, setStatus);
        setDownloaded(true);
      } catch (e) {
        setError(`Whisper could not load: ${String(e?.message || e)}`);
        setStarting(false);
        setStatus(null);
        return;
      }
      setStatus(null);
      setStarting(false);
    }

    const t = createLiveTranscriber({
      engine,
      settings,
      whisperId,
      providerId,
      model,
      onStatus: setStatus,
      onError: (msg, opts = {}) => {
        setError(msg);
        if (opts.disableLive) {
          setLiveUnavailable(true);
          setEngine('local');
        }
        if (opts.fatal) stop();
      },
      onEmpty: () => setEmptyChunks((n) => n + 1),
      onPartial: (partial) => {
        if (partial) setError('');
        setInterim(partial);
        const current = committedRef.current;
        setLiveTranscript?.(partial ? `${current}${current ? ' ' : ''}${partial}` : current);
      },
      onFinal: (chunk) => {
        setInterim('');
        const clean = String(chunk || '').trim();
        if (!clean) return;
        setEmptyChunks(0);
        setError('');
        committedRef.current = committedRef.current
          ? `${committedRef.current}${/\s$/.test(committedRef.current) ? '' : ' '}${clean}`
          : clean;
        const ok = setLiveTranscript?.(committedRef.current);
        if (ok === false) setError('Open a note first, then start transcribing.');
        setWords(committedRef.current.trim().split(/\s+/).filter(Boolean).length);
        if (engine === 'local') setDownloaded(true);
      },
    });

    if (engine === 'cloud') {
    }

    liveRef.current = t;
    setStarting(true);
    try {
      const started = await t.start();
      if (!started || liveRef.current !== t) return;
      setRecording(true);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch (e) {
      setError(String(e?.message || e));
      t.stop();
      if (liveRef.current === t) liveRef.current = null;
    } finally {
      setStarting(false);
    }
  };

  const stopAndOffer = () => {
    const tail = interim.trim();
    if (tail) {
      committedRef.current = committedRef.current
        ? `${committedRef.current}${/\s$/.test(committedRef.current) ? '' : ' '}${tail}`
        : tail;
      setLiveTranscript?.(committedRef.current);
    }
    const finalWords = committedRef.current.trim().split(/\s+/).filter(Boolean).length;
    setWords(finalWords);
    stop();
    if (finalWords > 0) setAsk(true);
  };

  return (
    <div className="nt-panel">
      <p className="nt-muted nt-small">
        {engine === 'webspeech'
          ? 'Instant captions from the browser, including interim words as you speak.'
          : engine === 'local'
            ? 'Whisper runs locally on short audio windows. It needs a little context and inference time; use Live for instant captions.'
            : 'Sends short audio windows to your selected provider as you speak.'}
        {engine !== 'cloud' && ' Nothing is uploaded.'}
      </p>

      <div className="nt-seg">
        <button
          type="button"
          className={'nt-seg-btn' + (engine === 'webspeech' ? ' is-active' : '')}
          onClick={() => setEngine('webspeech')}
          title={liveUnavailable ? 'This browser cannot reach its speech service' : 'Instant browser captions'}
        >
          <Radio size={13} /> <span>Live</span>
        </button>
        <button type="button" className={'nt-seg-btn' + (engine === 'local' ? ' is-active' : '')} onClick={() => setEngine('local')}>
          <Cpu size={13} /> <span>Whisper</span>
        </button>
        <button type="button" className={'nt-seg-btn' + (engine === 'cloud' ? ' is-active' : '')} onClick={() => setEngine('cloud')}>
          <Cloud size={13} /> <span>API</span>
        </button>
      </div>

      {engine === 'webspeech' && !liveUnavailable && (
        <p className="nt-muted nt-small">
          Instant captions from this browser. Chrome sends the audio to its own speech service.
        </p>
      )}

      {engine === 'webspeech' && liveUnavailable && (
        <p className="nt-note-warn">
          <AlertTriangle size={13} /> This browser could not reach its speech service, so Live captions will not work here. Whisper or an API key still will.
        </p>
      )}

      {engine === 'local' && (
        <div className="nt-field">
          <label className="nt-label">Model</label>
          <select className="nt-input" value={whisperId} onChange={(e) => setWhisperId(e.target.value)}>
            <option value="auto">Auto ({resolveWhisper('auto', hw).label} for this machine)</option>
            {WHISPER_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label} - {m.size}{m.id === recommendWhisper(hw) ? ' (recommended)' : ''}
              </option>
            ))}
          </select>
          <div className="nt-model-note">
            {downloaded
              ? <span className="nt-ok nt-small"><Check size={12} /> Model files cached here</span>
              : <span className="nt-muted nt-small"><Download size={12} /> {resolved.size} one time download</span>}
          </div>
          <p className="nt-muted nt-small">{resolved.note}</p>
        </div>
      )}

      {engine === 'cloud' && (
        <>
          <div className="nt-field">
            <label className="nt-label">Provider</label>
            <select
              className="nt-input"
              value={providerId}
              onChange={(e) => {
                setProviderId(e.target.value);
                setModel(PROVIDERS[e.target.value]?.audioModels?.[0] || '');
              }}
            >
              <option value="">Choose a provider</option>
              {Object.entries(PROVIDERS).filter(([, p]) => p.audio).map(([id, p]) => (
                <option key={id} value={id}>{p.label}{providerReady(id, settings) ? '' : ' (no key)'}</option>
              ))}
            </select>
          </div>
          {providerId && (
            <div className="nt-field">
              <label className="nt-label">Model</label>
              <select className="nt-input" value={model} onChange={(e) => setModel(e.target.value)}>
                {(PROVIDERS[providerId]?.audioModels || []).map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          )}
          {providerId && !providerReady(providerId, settings) && (
            <p className="nt-note-warn"><AlertTriangle size={13} /> Add a key for {PROVIDERS[providerId].label} in Settings.</p>
          )}
        </>
      )}

      <div className="nt-rec-row">
        <button
          type="button"
          className={'nt-btn nt-btn-record' + (recording ? ' is-recording' : '')}
          onClick={recording ? stopAndOffer : start}
          disabled={starting}
        >
          {starting ? <Loader2 size={15} className="nt-spin" /> : recording ? <Square size={15} /> : <Mic size={15} />}
          {starting ? 'Starting' : recording ? 'Stop' : 'Start listening'}
        </button>
        {recording && <><span className="nt-timer">{fmt(elapsed)}</span><span className="nt-live-dot" /></>}
        {!recording && words > 0 && <span className="nt-muted nt-small">{words} words written</span>}
      </div>

      {interim && <div className="nt-transcript">{interim}</div>}

      {emptyChunks >= 2 && (
        <p className="nt-note-warn">
          <AlertTriangle size={13} /> The provider has returned no text twice. Check that the key is valid and that the selected model exists for that provider.
        </p>
      )}

      {noDataHint && (
        <p className="nt-note-warn">
          <AlertTriangle size={13} />
          Chrome accepted the microphone but sent no captions. Its speech service is not reachable from this browser, so use Whisper or an API key instead.
        </p>
      )}

      <Status status={status} />
      {error && <p className="nt-note-error">{error}</p>}

      {ask && (
        <div className="nt-offer">
          <p className="nt-small"><strong>{words} words</strong> are now in the note.</p>
          <p className="nt-muted nt-small">Want them turned into proper notes with headings, terms and homework?</p>
          <div className="nt-action-row">
            <button type="button" className="nt-btn nt-btn-primary" onClick={() => { setAsk(false); onSwitchToSummarize?.(); }}>
              Summarize
            </button>
            <button type="button" className="nt-btn" onClick={() => setAsk(false)}>Keep transcript</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transcribe;
