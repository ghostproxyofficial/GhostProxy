import { useEffect, useMemo, useState } from 'react';
import { Sparkles, Cpu, Cloud, AlertTriangle, Wand2, RefreshCw, Download, Check, ChevronDown, Loader2 } from 'lucide-react';
import {
  PROVIDERS, LOCAL_LLM_MODELS, detectHardware, webgpuInfo, recommendLocalLlm, resolveLocalLlm,
  summarize, providerReady, fetchProviderModels, peekModels, modelDownloaded,
} from './ai';
import Status from './Status';

const Summarize = ({ settings, getPlainText, onInsert, onReplaceNote }) => {
  const hw = useMemo(() => detectHardware(), []);
  const [gpu, setGpu] = useState(null);
  const [engine, setEngine] = useState(settings.summaryEngine || 'cloud');
  const [localModel, setLocalModel] = useState(settings.localSummaryModel || 'auto');
  const [providerId, setProviderId] = useState(settings.summaryProvider || 'openai');
  const [model, setModel] = useState(settings.summaryModel && settings.summaryModel !== 'auto' ? settings.summaryModel : '');
  const [models, setModels] = useState(() => peekModels(settings.summaryProvider || 'openai'));
  const [loadingModels, setLoadingModels] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showPrompt, setShowPrompt] = useState(false);

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');
  const [, setRevision] = useState(0);

  const gpuReady = !!gpu?.usable;
  const resolved = resolveLocalLlm(localModel === 'auto' && !gpuReady ? 'qwen05' : localModel, hw);
  const recommendedLocalId = recommendLocalLlm(hw);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => { setDownloaded(modelDownloaded(resolved.repo)); }, [resolved.repo]);
  useEffect(() => {
    const update = () => setRevision((n) => n + 1);
    window.addEventListener('nt:note-input', update);
    return () => window.removeEventListener('nt:note-input', update);
  }, []);

  useEffect(() => {
    let alive = true;
    webgpuInfo().then((info) => { if (alive) setGpu(info); });
    return () => { alive = false; };
  }, []);

  const loadModels = async (force = false) => {
    setLoadingModels(true);
    try {
      const res = await fetchProviderModels(providerId, settings, { force });
      setModels({ chat: res.chat || [], audio: res.audio || [] });
      if (!model && res.chat?.length) setModel(res.chat[0]);
      if (model && !res.chat?.includes(model) && res.chat?.length) setModel(res.chat[0]);
    } finally {
      setLoadingModels(false);
    }
  };

  useEffect(() => {
    if (engine !== 'cloud') return;
    loadModels(false);

  }, [engine, providerId]);

  const currentText = getPlainText() || '';
  const words = currentText.trim() ? currentText.trim().split(/\s+/).length : 0;

  const run = async () => {
    setError('');
    setNotice('');
    setPreview('');
      const text = (getPlainText() || '').trim();
    if (!text) { setError('Write or transcribe something in this note first.'); return; }

    setBusy(true);
    try {
      const html = await summarize({
        text,
        engine,
        instructions: customPrompt,
        settings: { ...settings, localSummaryModel: localModel, summaryProvider: providerId, summaryModel: model },
        onStatus: (next) => {
          if (next?.phase === 'fallback') setNotice(next.text || 'Used transcript-only formatting.');
          else setStatus(next);
        },
      });
      if (!html) throw new Error('The model returned nothing usable. Try a larger model or a cloud provider.');
      setPreview(html);
      if (engine === 'local') setDownloaded(true);
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setBusy(false);
      setStatus(null);
    }
  };

  return (
    <div className="nt-panel">
      <p className="nt-muted nt-small">Overview, key concepts, terms, classwork and homework.</p>

      <div className="nt-seg">
        <button type="button" className={'nt-seg-btn' + (engine === 'local' ? ' is-active' : '')} onClick={() => setEngine('local')}>
          <Cpu size={13} /> Local
        </button>
        <button type="button" className={'nt-seg-btn' + (engine === 'cloud' ? ' is-active' : '')} onClick={() => setEngine('cloud')}>
          <Cloud size={13} /> API key
        </button>
      </div>

      {engine === 'local' ? (
        <div className="nt-field">
          <label className="nt-label">Model</label>
          <select className="nt-input" value={localModel} onChange={(e) => setLocalModel(e.target.value)}>
            <option value="auto">Auto ({resolveLocalLlm(gpuReady ? 'auto' : 'qwen05', hw).label} for this machine)</option>
            {LOCAL_LLM_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label} - {m.size}{m.id === recommendedLocalId ? ' (recommended)' : ''}
              </option>
            ))}
          </select>
          <div className="nt-model-note">
            {downloaded ? (
              <span className="nt-ok nt-small"><Check size={12} /> Model files cached here</span>
            ) : (
              <span className="nt-muted nt-small"><Download size={12} /> {resolved.size} one time download</span>
            )}
          </div>
          <p className="nt-muted nt-small">{resolved.note}</p>
          <p className="nt-muted nt-small">
            Small local models are slow and can drift off topic. For real lectures a cloud model gives much better notes.
          </p>
          {gpu?.reason === 'integrated-gpu' && (
            <p className="nt-note-warn">
              <AlertTriangle size={13} /> ONNX WebGPU does not work on this {gpu.vendor || 'integrated'} GPU, so notes run on CPU. Multi-threaded CPU is enabled automatically when the page is cross-origin isolated.
            </p>
          )}
          {gpu?.reason === 'previously-failed' && (
            <p className="nt-note-warn"><AlertTriangle size={13} /> WebGPU failed once on this GPU, so CPU is used. Clear that flag in Settings to try again.</p>
          )}
          {gpu?.reason === 'no-shader-f16' && (
            <p className="nt-note-warn"><AlertTriangle size={13} /> This GPU does not expose shader-f16, so CPU is used.</p>
          )}
          {gpu && !gpu.usable && !['integrated-gpu', 'previously-failed', 'no-shader-f16'].includes(gpu.reason) && (
            <p className="nt-note-warn"><AlertTriangle size={13} /> WebGPU is unavailable here. The model will run on CPU and may be slow.</p>
          )}
        </div>
      ) : (
        <>
          <div className="nt-field">
            <label className="nt-label">Provider</label>
            <select
              className="nt-input"
              value={providerId}
              onChange={(e) => { setProviderId(e.target.value); setModel(''); }}
            >
              {Object.entries(PROVIDERS).filter(([, p]) => p.chat).map(([id, p]) => (
                <option key={id} value={id}>{p.label}{providerReady(id, settings) ? '' : ' (no key)'}</option>
              ))}
            </select>
          </div>

          <div className="nt-field">
            <div className="nt-label-row">
              <label className="nt-label">Model</label>
              <button type="button" className="nt-mini" onClick={() => loadModels(true)} disabled={loadingModels}>
                <RefreshCw size={11} className={loadingModels ? 'nt-spin' : ''} /> Refresh list
              </button>
            </div>
            {models.chat?.length ? (
              <select className="nt-input" value={model} onChange={(e) => setModel(e.target.value)}>
                {!model && <option value="">Choose a model</option>}
                {models.chat.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            ) : (
              <input className="nt-input" value={model} onChange={(e) => setModel(e.target.value)} placeholder="model name" />
            )}
            <p className="nt-muted nt-small">
              {providerReady(providerId, settings)
                ? 'List pulled from the provider. Refresh if a new model is missing.'
                : 'Add a key to load the provider\'s real model list.'}
            </p>
          </div>

          {!providerReady(providerId, settings) && (
            <p className="nt-note-warn"><AlertTriangle size={13} /> Add a key for {PROVIDERS[providerId]?.label} in Settings.</p>
          )}
        </>
      )}

      <div className="nt-field">
        <button type="button" className="nt-collapse" onClick={() => setShowPrompt((v) => !v)}>
          <ChevronDown size={13} className={showPrompt ? 'is-open' : ''} /> Custom prompt
        </button>
        {showPrompt && (
          <textarea
            className="nt-input nt-textarea"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Tell it what matters. For example: keep the formulas, drop the announcements, and mark anything that sounds like a test."
          />
        )}
      </div>

      <p className="nt-muted nt-small">
        {words ? `${words.toLocaleString()} words in this note.` : 'This note is empty.'}
      </p>

      <button type="button" className="nt-btn nt-btn-primary" onClick={run} disabled={busy || !words}>
        {busy ? <Loader2 size={14} className="nt-spin" /> : <Wand2 size={14} />}
        {busy ? 'Working' : 'Generate notes'}
      </button>

      <Status status={status} />
      {notice && <p className="nt-note-info">{notice}</p>}
      {error && <p className="nt-note-error">{error}</p>}

      {preview && (
        <>
          <div className="nt-preview"><div dangerouslySetInnerHTML={{ __html: preview }} /></div>
          <div className="nt-action-row">
            {onReplaceNote && (
              <button
                type="button"
                className="nt-btn nt-btn-primary"
                onClick={() => { onReplaceNote(preview); setPreview(''); }}
              >
                Replace note
              </button>
            )}
              <button type="button" className="nt-btn" onClick={() => { onInsert(preview); setPreview(''); }}>
              <Sparkles size={14} /> Add below
            </button>
            <button type="button" className="nt-btn" onClick={() => setPreview('')}>Discard</button>
          </div>
        </>
      )}
    </div>
  );
};

export default Summarize;
