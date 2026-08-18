import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';

const PERIODS = [ { key: 7, label: 'Haftalık' }, { key: 30, label: 'Aylık' }, { key: 1, label: 'Günlük' } ];

export default function Reports() {
  const [days, setDays] = useState(30);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getProducerReport(days).then(setReport).catch((err) => console.log(err.message)).finally(() => setLoading(false));
  }, [days]);

  return (
    <div className="page">
      <div className="segmented">
        {PERIODS.map((p) => (<button key={p.key} className={days === p.key ? 'active' : ''} onClick={() => setDays(p.key)}>{p.label}</button>))}
      </div>

      {loading && <p style={{ color: 'var(--subtext)', textAlign: 'center' }}>Yükleniyor...</p>}

      {report && !loading && (
        <>
          <div className="stat-grid">
            <div className="stat-card"><div className="stat-value">{report.current.total_lt}</div><div className="stat-label">Litre</div></div>
            <div className="stat-card"><div className="stat-value">{report.current.total_revenue} ₺</div><div className="stat-label">Ciro</div></div>
            <div className="stat-card"><div className="stat-value">{report.current.order_count}</div><div className="stat-label">Sipariş</div></div>
            <div className="stat-card"><div className="stat-value">%{report.current.cancellation_rate}</div><div className="stat-label">İptal oranı</div></div>
          </div>

          <div className="stat-grid">
            <div className="card" style={{ textAlign: 'center', background: 'var(--primary-light)' }}>
              ☀️<div style={{ fontWeight: 700, marginTop: 6 }}>{report.current.morning_lt} litre</div><div style={{ fontSize: 12, color: 'var(--subtext)' }}>Sabah</div>
            </div>
            <div className="card" style={{ textAlign: 'center', background: 'var(--primary-light)' }}>
              🌙<div style={{ fontWeight: 700, marginTop: 6 }}>{report.current.evening_lt} litre</div><div style={{ fontSize: 12, color: 'var(--subtext)' }}>Akşam</div>
            </div>
          </div>

          <h3>Öneriler</h3>
          {report.advice.map((a, i) => (<div className="card row" key={i}><span>💡</span><span style={{ fontSize: 13 }}>{a}</span></div>))}
          <p style={{ fontSize: 11, color: 'var(--subtext)', fontStyle: 'italic' }}>
            Bu öneriler geçmiş verilere göre kural tabanlı üretiliyor (yapay zeka kullanılmıyor).
          </p>
        </>
      )}
    </div>
  );
}
