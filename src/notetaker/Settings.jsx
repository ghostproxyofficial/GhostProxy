import { useEffect, useMemo, useState } from 'react';
import { Check, KeyRound, Trash2, Download, Upload, Sun, Moon, Monitor, Eye, EyeOff } from 'lucide-react';
import {
  PROVIDERS, WHISPER_MODELS, LOCAL_LLM_MODELS, detectHardware, webgpuInfo, unblockWebgpu, recommendWhisper, recommendLocalLlm,
} from './ai';
import { countNotes, exportAll, importAll, wipeEverything } from './store';

const Settings = ({ meta, settings, onChange, onWiped, onImported }) => {
  const hw = useMemo(() => detectHardware(), []);
  const [gpu, setGpu] = useState(null);
  const [reveal, setReveal] = useState({});
  const [savedFlash, setSavedFlash] = useState('');
  const [importText, setImportText] = useState('');
  const [confirmWipe, setConfirmWipe] = useState(false);

  useEffect(() => {
    let alive = true;
    webgpuInfo().then((info) => { if (alive) setGpu(info); });
    return () => { alive = false; };
  }, []);

  const setProvider = (id, patch) => {
    const providers = {
      ...(settings.providers || {}),
      [id]: { ...(settings.providers?.[id] || {}), ...patch },
    };
    onChange({ providers });
    setSavedFlash(id);
    setTimeout(() => setSavedFlash(''), 1200);
  };

  const download = () => {
    const blob = new Blob([exportAll()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `notetaker-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="nt-settings">
      <section className="nt-sect">
        <h3 className="nt-sect-title">Appearance</h3>
        <div className="nt-seg">
          {[
            ['light', Sun, 'Light'],
            ['dark', Moon, 'Dark'],
            ['system', Monitor, 'System'],
          ].map(([id, Icon, label]) => (
            <button
              key={id}
              type="button"
              className={'nt-seg-btn' + (settings.theme === id ? ' is-active' : '')}
              onClick={() => onChange({ theme: id })}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      </section>

      <section className="nt-sect">
        <h3 className="nt-sect-title">Transcription defaults</h3>
        <div className="nt-field">
          <label className="nt-label">Engine</label>
          <select className="nt-input" value={settings.transcribeEngine} onChange={(e) => onChange({ transcribeEngine: e.target.value })}>
            <option value="webspeech">Live captions (browser)</option>
            <option value="local">Local Whisper</option>
            <option value="cloud">API key</option>
          </select>
        </div>
        <div className="nt-field">
          <label className="nt-label">Local Whisper model</label>
          <select className="nt-input" value={settings.whisperModel} onChange={(e) => onChange({ whisperModel: e.target.value })}>
            <option value="auto">Auto (recommended for this machine)</option>
            {WHISPER_MODELS.map((m) => (
              <option key={m.id} value={m.id}>{m.label} - {m.size}</option>
            ))}
          </select>
          <p className="nt-muted nt-small">
            Your machine: {hw.cores} cores, {hw.ram ? `${hw.ram} GB RAM` : 'RAM unknown'}, {gpu === null ? 'checking GPU' : gpu.usable ? `WebGPU ready (${gpu.vendor || 'GPU'})` : `WebGPU unavailable (${gpu.reason}), local models use CPU`}.
            Suggests {WHISPER_MODELS.find((m) => m.id === recommendWhisper(hw))?.label}.
          </p>
        </div>
      </section>

      <section className="nt-sect">
        <h3 className="nt-sect-title">Summarizer defaults</h3>
        <div className="nt-field">
          <label className="nt-label">Engine</label>
          <select className="nt-input" value={settings.summaryEngine} onChange={(e) => onChange({ summaryEngine: e.target.value })}>
            <option value="cloud">API key</option>
            <option value="local">Local model</option>
          </select>
        </div>
        <div className="nt-field">
          <label className="nt-label">Local model</label>
          <select className="nt-input" value={settings.localSummaryModel} onChange={(e) => onChange({ localSummaryModel: e.target.value })}>
            <option value="auto">Auto (recommended for this machine)</option>
            {LOCAL_LLM_MODELS.map((m) => (
              <option key={m.id} value={m.id}>{m.label} - {m.size}</option>
            ))}
          </select>
          <p className="nt-muted nt-small">
            {gpu === null
              ? 'Checking the browser GPU adapter.'
              : `Suggests ${LOCAL_LLM_MODELS.find((m) => m.id === recommendLocalLlm(hw))?.label} for your machine.`}
          </p>
          {gpu?.reason === 'integrated-gpu' && (
            <p className="nt-muted nt-small">
              Chrome is on the integrated GPU. Set Chrome to High performance in Windows Graphics settings to use your NVIDIA card.
            </p>
          )}
          {gpu?.reason === 'previously-failed' && (
            <button
              type="button"
              className="nt-btn nt-btn-sm"
              onClick={() => { unblockWebgpu(); window.location.reload(); }}
            >
              Retry WebGPU
            </button>
          )}
        </div>
        <div className="nt-field">
          <label className="nt-label">Extra instructions (optional)</label>
          <textarea
            className="nt-input nt-textarea"
            value={settings.summaryInstructions}
            onChange={(e) => onChange({ summaryInstructions: e.target.value })}
            placeholder="For example: keep the chemistry equations, ignore the admin announcements."
          />
        </div>
      </section>

      <section className="nt-sect">
        <h3 className="nt-sect-title">Providers</h3>
        <p className="nt-muted nt-small">Keys stay in this browser and go straight to the provider. Nothing passes through a server of ours.</p>
        {Object.entries(PROVIDERS).map(([id, p]) => {
          const cfg = settings.providers?.[id] || {};
          const hidden = !reveal[id];
          return (
            <div key={id} className="nt-provider">
              <div className="nt-provider-top">
                <span className="nt-provider-name">{p.label}</span>
                <span className="nt-chips">
                  {p.audio && <span className="nt-chip">audio</span>}
                  {p.chat && <span className="nt-chip">chat</span>}
                </span>
              </div>
              <div className="nt-provider-row">
                <KeyRound size={13} className="nt-muted" />
                <input
                  className="nt-input nt-input-sm"
                  type={hidden ? 'password' : 'text'}
                  value={cfg.key || ''}
                  onChange={(e) => setProvider(id, { key: e.target.value })}
                  placeholder={p.keyHint}
                  spellCheck={false}
                />
                <button type="button" className="nt-tool" onClick={() => setReveal((r) => ({ ...r, [id]: !r[id] }))} title={hidden ? 'Show' : 'Hide'}>
                  {hidden ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                {savedFlash === id && <Check size={14} className="nt-ok" />}
              </div>
              {p.customBase && (
                <input
                  className="nt-input nt-input-sm"
                  value={cfg.base || ''}
                  onChange={(e) => setProvider(id, { base: e.target.value })}
                  placeholder="https://your-endpoint/v1"
                  spellCheck={false}
                />
              )}
            </div>
          );
        })}
      </section>

      <section className="nt-sect">
        <h3 className="nt-sect-title">Your data</h3>
        <p className="nt-muted nt-small">
          {countNotes(meta.nodes)} notes on this device. Everything is local to this browser.
        </p>
        <div className="nt-action-row">
          <button type="button" className="nt-btn" onClick={download}><Download size={14} /> Export backup</button>
          <label className="nt-btn nt-btn-file">
            <Upload size={14} /> Import backup
            <input
              type="file"
              accept="application/json,.json"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const text = await file.text();
                try {
                  const next = importAll(text);
                  onImported(next);
                } catch (err) {
                  setImportText(String(err.message || err));
                }
                e.target.value = '';
              }}
            />
          </label>
        </div>
        {importText && <p className="nt-note-error">{importText}</p>}

        <div className="nt-danger">
          {confirmWipe ? (
            <>
              <p className="nt-small">This deletes every note and folder from this browser. It cannot be undone.</p>
              <div className="nt-action-row">
                <button
                  type="button"
                  className="nt-btn nt-btn-danger"
                  onClick={() => { wipeEverything(); onWiped(); setConfirmWipe(false); }}
                >
                  <Trash2 size={14} /> Yes, delete everything
                </button>
                <button type="button" className="nt-btn" onClick={() => setConfirmWipe(false)}>Cancel</button>
              </div>
            </>
          ) : (
            <button type="button" className="nt-btn nt-btn-danger" onClick={() => setConfirmWipe(true)}>
              <Trash2 size={14} /> Delete all notes
            </button>
          )}
        </div>
      </section>
    </div>
  );
};

export default Settings;
