import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client';

function toIsoDate(date) { return date.toISOString().slice(0, 10); }
function timeToMinutes(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function minutesToLabel(mins) {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}
function generateSlots(start, end) {
  if (!start || !end) return [];
  const slots = [];
  for (let m = timeToMinutes(start); m <= timeToMinutes(end); m += 15) slots.push(minutesToLabel(m));
  return slots;
}

export default function NewOrder() {
  const [date, setDate] = useState(toIsoDate(new Date()));
  const [session, setSession] = useState('morning');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [quantity, setQuantity] = useState('1');
  const [settings, setSettings] = useState(null);
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    api.getSettings().then(setSettings).catch((err) => console.log(err.message));
    api.getCustomerSuggestion().then((data) => setSuggestion(data.has_pattern ? data : null)).catch((err) => console.log(err.message));
  }, []);

  const slots = useMemo(() => {
    if (!settings) return [];
    return session === 'morning'
      ? generateSlots(settings.morning_start, settings.morning_end)
      : generateSlots(settings.evening_start, settings.evening_end);
  }, [settings, session]);

  useEffect(() => {
    if (slots.length > 0) setSelectedSlot(slots[0]);
  }, [slots]);

  const totalPrice = useMemo(() => {
    const qty = Number(quantity);
    if (!settings?.price_per_lt || !qty) return null;
    return (qty * settings.price_per_lt).toFixed(2);
  }, [quantity, settings]);

  function applySuggestion() {
    if (!suggestion) return;
    setSession(suggestion.session);
    setQuantity(String(suggestion.quantity_lt));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const qty = Number(quantity);
    if (!qty || qty <= 0) { setMessage({ type: 'error', text: 'Litre miktarı pozitif bir sayı olmalı' }); return; }
    if (!selectedSlot) { setMessage({ type: 'error', text: 'Lütfen bir saat seç' }); return; }
    setLoading(true);
    setMessage(null);
    try {
      const result = await api.createOrUpdateOrder({ delivery_date: date, session, delivery_time: selectedSlot, quantity_lt: qty });
      const priceText = result.total_price ? ` — Toplam: ${result.total_price} ₺` : '';
      setMessage({ type: 'success', text: `Sipariş kaydedildi.${priceText}` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      {suggestion && (
        <div className="note-card">
          <span>🤖</span>
          <div style={{ flex: 1 }}>
            Genelde {suggestion.session === 'morning' ? 'sabah' : 'akşam'} {suggestion.quantity_lt} litre alıyorsun. Aynısını hazırlayayım mı?
            <button className="btn btn-outline btn-small" style={{ marginTop: 8 }} onClick={applySuggestion}>Uygula</button>
          </div>
        </div>
      )}

      {settings?.general_note && <div className="note-card">📢 {settings.general_note}</div>}
      <div className="note-card">🍼 Lütfen süt şişelerinizi kendiniz getiriniz.</div>

      {message && (
        <div className="note-card" style={{ color: message.type === 'error' ? 'var(--danger)' : 'var(--success)' }}>{message.text}</div>
      )}

      <form onSubmit={handleSubmit}>
        <label className="label">Teslimat tarihi</label>
        <input className="input" type="date" value={date} min={toIsoDate(new Date())} onChange={(e) => setDate(e.target.value)} />

        <label className="label">Sağım</label>
        <div className="segmented">
          <button type="button" className={session === 'morning' ? 'active' : ''} onClick={() => setSession('morning')}>☀️ Sabah</button>
          <button type="button" className={session === 'evening' ? 'active' : ''} onClick={() => setSession('evening')}>🌙 Akşam</button>
        </div>

        <label className="label">Teslim alma saati</label>
        <div className="chip-row">
          {slots.map((slot) => (
            <button type="button" key={slot} className={`chip ${selectedSlot === slot ? 'active' : ''}`} onClick={() => setSelectedSlot(slot)}>{slot}</button>
          ))}
          {slots.length === 0 && <span style={{ color: 'var(--subtext)' }}>Yükleniyor...</span>}
        </div>

        <label className="label">Litre</label>
        <input className="input" type="number" min="0.5" step="0.5" value={quantity} onChange={(e) => setQuantity(e.target.value)} />

        {totalPrice && (
          <div className="price-card">
            <div style={{ fontSize: 13, color: 'var(--subtext)' }}>Ödenecek tutar</div>
            <div className="price-value">{totalPrice} ₺</div>
          </div>
        )}

        <button className="btn btn-primary" style={{ marginTop: 24 }} disabled={loading}>{loading ? 'Gönderiliyor...' : 'Siparişi Gönder'}</button>
      </form>
    </div>
  );
}
