import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';

function toIsoDate(date) { return date.toISOString().slice(0, 10); }

export default function Orders() {
  const [date, setDate] = useState(new Date());
  const [session, setSession] = useState('morning');
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  function load() {
    const iso = toIsoDate(date);
    Promise.all([api.getOrders(iso, session), api.getOrderSummary(iso, session)])
      .then(([o, s]) => { setOrders(o); setSummary(s); })
      .catch((err) => setError(err.message));
  }
  useEffect(load, [date, session]);

  function changeDay(offset) {
    const next = new Date(date);
    next.setDate(next.getDate() + offset);
    setDate(next);
  }

  async function handleConfirm(id) { try { await api.confirmOrder(id); load(); } catch (err) { setError(err.message); } }
  async function handleComplete(id) { try { await api.completeOrder(id); load(); } catch (err) { setError(err.message); } }

  const overCapacity = summary?.daily_capacity_lt && summary.total_lt > Number(summary.daily_capacity_lt);

  return (
    <div className="page">
      <div className="row" style={{ justifyContent: 'center' }}>
        <button className="link" style={{ margin: 0, fontSize: 24 }} onClick={() => changeDay(-1)}>‹</button>
        <strong>{toIsoDate(date)}</strong>
        <button className="link" style={{ margin: 0, fontSize: 24 }} onClick={() => changeDay(1)}>›</button>
      </div>

      <div className="segmented">
        <button className={session === 'morning' ? 'active' : ''} onClick={() => setSession('morning')}>☀️ Sabah</button>
        <button className={session === 'evening' ? 'active' : ''} onClick={() => setSession('evening')}>🌙 Akşam</button>
      </div>

      {error && <div className="note-card" style={{ color: 'var(--danger)' }}>{error}</div>}

      {summary && (
        <div className="price-card" style={{ background: overCapacity ? '#fdecea' : 'var(--primary-light)' }}>
          <div className="price-value">{summary.total_lt} litre</div>
          <div style={{ fontSize: 13, color: 'var(--subtext)' }}>
            {summary.order_count} sipariş{summary.daily_capacity_lt ? ` · kapasite: ${summary.daily_capacity_lt} litre` : ''}
          </div>
          {overCapacity && <div style={{ color: 'var(--danger)', fontWeight: 700, marginTop: 6 }}>Kapasite aşıldı</div>}
        </div>
      )}

      {orders.length === 0 && <p className="empty-text">Bu tarih/seans için sipariş yok</p>}
      {orders.map((item) => (
        <div className="card row" key={item.id}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700 }}>{item.full_name}</div>
            <div style={{ color: 'var(--primary)', fontWeight: 600 }}>{item.quantity_lt} litre · {item.delivery_time?.slice(0, 5)}</div>
            <div style={{ fontSize: 13, color: 'var(--subtext)' }}>{item.phone}</div>
          </div>
          {item.status === 'pending' && <button className="btn btn-primary btn-small" onClick={() => handleConfirm(item.id)}>Onayla</button>}
          {item.status === 'confirmed' && <button className="btn btn-primary btn-small" onClick={() => handleComplete(item.id)}>Tamamlandı</button>}
        </div>
      ))}
    </div>
  );
}
