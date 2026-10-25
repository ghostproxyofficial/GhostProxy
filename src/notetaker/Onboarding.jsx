import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, Check, Cpu, Cloud, Radio, FolderTree, PenLine, ShieldCheck, X, Download, Sparkles,
} from 'lucide-react';
import {
  PROVIDERS, WHISPER_MODELS, LOCAL_LLM_MODELS, detectHardware,
  recommendWhisper, recommendLocalLlm, canUseWebGPU, preloadWhisper, preloadLocalLlm, providerReady,
} from './ai';
import Status from './Status';

const STEPS = ['welcome', 'organize', 'transcribe', 'summarize', 'done'];

const Onboarding = ({ settings, onChange, onFinish }) => {
  const hw = useMemo(() => detectHardware(), []);
  const [gpuReady, setGpuReady] = useState(false);
  const [step, setStep] = useState(0);
  const [engine, setEngine] = useState(settings.transcribeEngine || 'webspeech');
  const [whisperId, setWhisperId] = useState('auto');
  const [summaryEngine, setSummaryEngine] = useState(settings.summaryEngine || 'cloud');
  const [localLlm, setLocalLlm] = useState('auto');
  const [providerId, setProviderId] = useState('openai');
  const [key, setKey] = useState(settings.providers?.openai?.key || '');
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    canUseWebGPU().then((ok) => { if (alive) setGpuReady(ok); });
    return () => { alive = false; };
  }, []);

  const suggestedLocalId = gpuReady ? recommendLocalLlm(hw) : 'qwen05';
  const suggestedLocal = LOCAL_LLM_MODELS.find((m) => m.id === suggestedLocalId) || LOCAL_LLM_MODELS[0];

  const name = STEPS[step];
  const next = () => { setError(''); setStep((s) => Math.min(STEPS.length - 1, s + 1)); };
  const back = () => { setError(''); setStep((s) => Math.max(0, s - 1)); };

  const saveKey = () => {
    if (!key.trim()) return;
    onChange({ providers: { ...(settings.providers || {}), [providerId]: { ...(settings.providers?.[providerId] || {}), key: key.trim() } } });
  };

  const downloadWhisper = async () => {
    setBusy(true); setError('');
    try {
      await preloadWhisper(whisperId, setStatus);
      onChange({ whisperModel: whisperId, transcribeEngine: 'local' });
    } catch (e) {
      setError(String(e?.message || e));
    } finally { setBusy(false); setStatus(null); }
  };

  const downloadLlm = async () => {
    setBusy(true); setError('');
    try {
      await preloadLocalLlm(localLlm, setStatus);
      onChange({ localSummaryModel: localLlm, summaryEngine: 'local' });
    } catch (e) {
      setError(String(e?.message || e));
    } finally { setBusy(false); setStatus(null); }
  };

  const finish = () => {
    onChange({
      transcribeEngine: engine,
      summaryEngine,
      summaryProvider: providerId,
      onboarded: true,
    });
    onFinish?.();
  };

  return (
    <div className="nt-modal">
      <div className="nt-modal-card nt-onboard">
        <div className="nt-modal-head">
          <h2>Set up Notetaker</h2>
          <button type="button" className="nt-tool" onClick={() => { onChange({ onboarded: true }); onFinish?.(); }} title="Skip">
            <X size={16} />
          </button>
        </div>

        <div className="nt-steps">
          {STEPS.slice(0, -1).map((s, i) => (
            <span key={s} className={'nt-step' + (i < step ? ' is-done' : i === step ? ' is-active' : '')} />
          ))}
        </div>

        <div className="nt-modal-body nt-onboard-body">
          {name === 'welcome' && (
            <>
              <h3 className="nt-onboard-title">Notes that live on your device</h3>
              <p className="nt-muted">
                Everything is stored in this browser. There is no account and no sync, so nothing leaves your machine unless you add an API key yourself.
              </p>
              <ul className="nt-bullets">
                <li><PenLine size={14} /> Saves on every keystroke</li>
                <li><FolderTree size={14} /> Folders inside folders, as deep as you want</li>
                <li><ShieldCheck size={14} /> Works offline for notes and local models</li>
              </ul>
            </>
          )}

          {name === 'organize' && (
            <>
              <h3 className="nt-onboard-title">How it is organized</h3>
              <p className="nt-muted">
                Make a folder per class, then notes inside it. You can nest folders as deep as you like, drag rows to reorder or move them, and hover a note to see when it was last edited.
              </p>
              <ul className="nt-bullets">
                <li><FolderTree size={14} /> Hover a row for add and more menu</li>
                <li><PenLine size={14} /> Toolbar buttons do the formatting, no markdown needed</li>
                <li><Sparkles size={14} /> Every note has its own Ask AI</li>
              </ul>
            </>
          )}

          {name === 'transcribe' && (
            <>
              <h3 className="nt-onboard-title">How should it transcribe?</h3>
              <div className="nt-choice-grid">
                <button type="button" className={'nt-choice' + (engine === 'webspeech' ? ' is-active' : '')} onClick={() => setEngine('webspeech')}>
                  <Radio size={16} />
                  <strong>Browser captions</strong>
                  <span className="nt-muted nt-small">Free and instant, uses the browser speech engine.</span>
                </button>
                <button type="button" className={'nt-choice' + (engine === 'local' ? ' is-active' : '')} onClick={() => setEngine('local')}>
                  <Cpu size={16} />
                  <strong>Local Whisper</strong>
                  <span className="nt-muted nt-small">Downloads once, then runs offline and private. Slower on weak machines.</span>
                </button>
                <button type="button" className={'nt-choice' + (engine === 'cloud' ? ' is-active' : '')} onClick={() => setEngine('cloud')}>
                  <Cloud size={16} />
                  <strong>API provider</strong>
                  <span className="nt-muted nt-small">Fastest and most accurate. Needs a key from a provider.</span>
                </button>
              </div>

              {engine === 'local' && (
                <div className="nt-field">
                  <label className="nt-label">Whisper model</label>
                  <select className="nt-input" value={whisperId} onChange={(e) => setWhisperId(e.target.value)}>
                    <option value="auto">Auto ({WHISPER_MODELS.find((m) => m.id === recommendWhisper(hw))?.label} for this machine)</option>
                    {WHISPER_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>{m.label} - {m.size}</option>
                    ))}
                  </select>
                  <button type="button" className="nt-btn" onClick={downloadWhisper} disabled={busy}>
                    <Download size={14} /> {busy ? 'Downloading' : 'Download now'}
                  </button>
                </div>
              )}
            </>
          )}

          {name === 'summarize' && (
            <>
              <h3 className="nt-onboard-title">And how should it write notes?</h3>
              <div className="nt-choice-grid nt-choice-grid-2">
                <button type="button" className={'nt-choice' + (summaryEngine === 'cloud' ? ' is-active' : '')} onClick={() => setSummaryEngine('cloud')}>
                  <Cloud size={16} />
                  <strong>API provider</strong>
                  <span className="nt-muted nt-small">Best quality notes. Add one key and you are done.</span>
                </button>
                <button type="button" className={'nt-choice' + (summaryEngine === 'local' ? ' is-active' : '')} onClick={() => setSummaryEngine('local')}>
                  <Cpu size={16} />
                  <strong>Local model</strong>
                  <span className="nt-muted nt-small">Private and free, but small models are slow and less accurate.</span>
                </button>
              </div>

              {summaryEngine === 'cloud' && (
                <div className="nt-field">
                  <label className="nt-label">Provider</label>
                  <select className="nt-input" value={providerId} onChange={(e) => { setProviderId(e.target.value); setKey(''); }}>
                    {Object.entries(PROVIDERS).filter(([, p]) => p.chat).map(([id, p]) => (
                      <option key={id} value={id}>{p.label}</option>
                    ))}
                  </select>
                  <label className="nt-label">API key</label>
                  <div className="nt-action-row">
                    <input
                      className="nt-input"
                      type="password"
                      value={key}
                      onChange={(e) => setKey(e.target.value)}
                      placeholder={PROVIDERS[providerId]?.keyHint}
                      spellCheck={false}
                    />
                    <button type="button" className="nt-btn" onClick={saveKey} disabled={!key.trim()}>
                      {providerReady(providerId, settings) ? <Check size={14} /> : 'Save'}
                    </button>
                  </div>
                  <p className="nt-muted nt-small">Stored only in this browser. You can add more providers later in Settings.</p>
                </div>
              )}

              {summaryEngine === 'local' && (
                <div className="nt-field">
                  <label className="nt-label">Model</label>
                  <select className="nt-input" value={localLlm} onChange={(e) => setLocalLlm(e.target.value)}>
                    <option value="auto">Auto ({suggestedLocal.label} for this machine)</option>
                    {LOCAL_LLM_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>{m.label} - {m.size}</option>
                    ))}
                  </select>
                  <button type="button" className="nt-btn" onClick={downloadLlm} disabled={busy}>
                    <Download size={14} /> {busy ? 'Downloading' : 'Download now'}
                  </button>
                  <p className="nt-muted nt-small">
                    Downloads once ({localLlm === 'auto' ? suggestedLocal.size : LOCAL_LLM_MODELS.find((m) => m.id === localLlm)?.size}).
                    {gpuReady ? ' WebGPU is available.' : ' No working WebGPU adapter was found, so local summaries will use the slower CPU path.'}
                  </p>
                </div>
              )}
            </>
          )}

          {name === 'done' && (
            <>
              <h3 className="nt-onboard-title">You are set</h3>
              <p className="nt-muted">
                Make a folder for a class, add a note, and hit Transcribe when the lecture starts. Everything else is in Settings.
              </p>
              <ul className="nt-bullets">
                <li><Check size={14} /> Notes save as you type</li>
                <li><Check size={14} /> Nothing is uploaded without a key</li>
                <li><Check size={14} /> You can change every choice later</li>
              </ul>
            </>
          )}

          <Status status={status} />
          {error && <p className="nt-note-error">{error}</p>}
        </div>

        <div className="nt-onboard-foot">
          <button type="button" className="nt-btn" onClick={back} disabled={step === 0}>Back</button>
          {name === 'done' ? (
            <button type="button" className="nt-btn nt-btn-primary" onClick={finish}>
              Start writing <ArrowRight size={14} />
            </button>
          ) : (
            <button type="button" className="nt-btn nt-btn-primary" onClick={next}>
              Continue <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
