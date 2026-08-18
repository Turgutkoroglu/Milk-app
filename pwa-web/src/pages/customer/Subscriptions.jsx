import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';

const DAYS = [
  { id: 1, label: 'Pzt' }, { id: 2, label: 'Sal' }, { id: 3, label: 'Çar' },
  { id: 4, label: 'Per' }, { id: 5, label: 'Cum' }, { id: 6, label: 'Cmt' }, { id: 7, label: 'Paz' },
];

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [session, setSession] = useState('morning');
  const [quantity, setQuantity] = useState('1');
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5, 6, 7]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  function load() {
    api.getSubscriptions().then(setSubscriptions).catch((err) => console.log(err.message));
  }
  useEffect(load, []);

  function toggleDay(id) {
    setSelectedDays((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id].sort()));
  }

  async function handleCreate(e) {
    e.preventDefault();
    const qty = Number(quantity);
    if (!qty || qty <= 0) { setMessage({ type: 'error', text: 'Litre miktarı pozitif bir sayı olmalı' }); return; }
    setLoading(true);
    setMessage(null);
    try {
      await api.createSubscription({ session, quantity_lt: qty, days_of_week: selectedDays });
      setMessage({ type: 'success', text: 'Abonelik oluşturuldu' });
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleDeactivate(id) {
    try { await api.deactivateSubscription(id); load(); } catch (err) { setMessage({ type: 'error', text: err.message }); }
  }

  return (
    <div className="page">
      <h3>Yeni abonelik oluştur</h3>
      {message && <div className="note-card" style={{ color: message.type === 'error' ? 'var(--danger)' : 'var(--success)' }}>{message.text}</div>}
      <form onSubmit={handleCreate}>
        <div className="segmented" style={{ marginTop: 12 }}>
          <button type="button" className={session === 'morning' ? 'active' : ''} onClick={() => setSession('morning')}>☀️ Sabah</button>
          <button type="button" className={session === 'evening' ? 'active' : ''} onClick={() => setSession('evening')}>🌙 Akşam</button>
        </div>
        <input className="input" type="number" min="0.5" step="0.5" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Günlük litre" />
        <div className="chip-row" style={{ marginTop: 12, flexWrap: 'wrap' }}>
          {DAYS.map((day) => (
            <button type="button" key={day.id} className={`chip ${selectedDays.includes(day.id) ? 'active' : ''}`} onClick={() => toggleDay(day.id)}>{day.label}</button>
          ))}
        </div>
        <button className="btn btn-primary" disabled={loading}>{loading ? 'Kaydediliyor...' : 'Abonelik Oluştur'}</button>
      </form>

      <h3 style={{ marginTop: 28 }}>Mevcut abonelikler</h3>
      {subscriptions.length === 0 && <p className="empty-text">Henüz abonelik yok</p>}
      {subscriptions.map((item) => (
        <div className="card row" key={item.id}>
          <span>{item.session === 'morning' ? '☀️' : '🌙'}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>
              {item.quantity_lt} litre / {item.session === 'morning' ? 'sabah' : 'akşam'}{item.active ? '' : ' (pasif)'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--subtext)' }}>
              {item.days_of_week.map((d) => DAYS.find((x) => x.id === d)?.label).join(', ')}
            </div>
          </div>
          {item.active && <button className="link" style={{ margin: 0, color: 'var(--danger)' }} onClick={() => handleDeactivate(item.id)}>Durdur</button>}
        </div>
      ))}
    </div>
  );
}
