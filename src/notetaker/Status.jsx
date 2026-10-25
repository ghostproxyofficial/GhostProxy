import { Download, Loader2 } from 'lucide-react';

const Status = ({ status }) => {
  if (!status) return null;
  const pct = typeof status.percent === 'number' ? Math.round(status.percent) : null;
  return (
    <div className={'nt-status' + (status.phase === 'downloading' ? ' is-download' : '')}>
      <div className="nt-status-row">
        {status.phase === 'downloading' ? <Download size={13} /> : <Loader2 size={13} className="nt-spin" />}
        <span>{status.text}</span>
      </div>
      {pct !== null && <div className="nt-bar"><span style={{ width: `${pct}%` }} /></div>}
      {status.detail && <div className="nt-status-detail">{status.detail}</div>}
    </div>
  );
};

export default Status;
