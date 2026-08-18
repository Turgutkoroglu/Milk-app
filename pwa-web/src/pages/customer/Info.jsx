import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';

export default function Info() {
  const [settings, setSettings] = useState(null);
  useEffect(() => { api.getSettings().then(setSettings).catch((err) => console.log(err.message)); }, []);

  return (
    <div className="page">
      {settings?.general_note && <div className="note-card">📢 {settings.general_note}</div>}

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Satış saatleri</h3>
        <div className="row">☀️ Sabah: {settings?.morning_start?.slice(0, 5)} - {settings?.morning_end?.slice(0, 5)}</div>
        <div className="row">🌙 Akşam: {settings?.evening_start?.slice(0, 5)} - {settings?.evening_end?.slice(0, 5)}</div>
        {settings?.price_per_lt && <div className="row">💰 Litre fiyatı: {settings.price_per_lt} ₺</div>}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>İletişim</h3>
        <div className="row">👤 {settings?.producer_name || '-'}</div>
        <div className="row">📞 {settings?.producer_phone || '-'}</div>
        {settings?.iban && <div className="row" style={{ userSelect: 'all' }}>🏦 {settings.iban}</div>}
      </div>

      <div className="note-card">🍼 Lütfen süt şişelerinizi kendiniz getiriniz.</div>
      <div className="note-card">ℹ️ Lütfen sütü teslim aldıktan sonra ödeme yapınız.</div>
    </div>
  );
}
