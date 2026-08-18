import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../api/client';

export default function Settings() {
  const { logout } = useAuth();
  const [capacity, setCapacity] = useState('');
  const [morningStart, setMorningStart] = useState('07:00');
  const [morningEnd, setMorningEnd] = useState('08:00');
  const [eveningStart, setEveningStart] = useState('19:00');
  const [eveningEnd, setEveningEnd] = useState('20:00');
  const [price, setPrice] = useState('');
  const [iban, setIban] = useState('');
  const [generalNote, setGeneralNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [pwMessage, setPwMessage] = useState(null);

  useEffect(() => {
    api.getSettings().then((data) => {
      if (!data) return;
      setCapacity(data.daily_capacity_lt ? String(data.daily_capacity_lt) : '');
      setMorningStart(data.morning_start?.slice(0, 5) || '07:00');
      setMorningEnd(data.morning_end?.slice(0, 5) || '08:00');
      setEveningStart(data.evening_start?.slice(0, 5) || '19:00');
      setEveningEnd(data.evening_end?.slice(0, 5) || '20:00');
      setPrice(data.price_per_lt ? String(data.price_per_lt) : '');
      setIban(data.iban || '');
      setGeneralNote(data.general_note || '');
    });
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await api.updateSettings({
        daily_capacity_lt: capacity ? Number(capacity) : null,
        morning_start: morningStart,
        morning_end: morningEnd,
        evening_start: eveningStart,
        evening_end: eveningEnd,
        price_per_lt: price ? Number(price) : null,
        iban: iban || null,
        general_note: generalNote || null,
      });
      setMessage({ type: 'success', text: 'Ayarların güncellendi, müşterilere bildirim gönderildi' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setPwMessage({ type: 'error', text: 'Yeni şifreler uyuşmuyor' }); return; }
    if (newPassword.length < 6) { setPwMessage({ type: 'error', text: 'Yeni şifre en az 6 karakter olmalı' }); return; }
    setSavingPassword(true);
    setPwMessage(null);
    try {
      await api.changePassword(currentPassword, newPassword);
      setPwMessage({ type: 'success', text: 'Şifren güncellendi' });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      setPwMessage({ type: 'error', text: err.message });
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="page">
      {message && <div className="note-card" style={{ color: message.type === 'error' ? 'var(--danger)' : 'var(--success)' }}>{message.text}</div>}

      <form onSubmit={handleSave}>
        <h3>Sabah sağımı</h3>
        <div className="row">
          <div style={{ flex: 1 }}><label className="label">Başlangıç</label><input className="input" type="time" value={morningStart} onChange={(e) => setMorningStart(e.target.value)} /></div>
          <div style={{ flex: 1 }}><label className="label">Bitiş</label><input className="input" type="time" value={morningEnd} onChange={(e) => setMorningEnd(e.target.value)} /></div>
        </div>

        <h3 style={{ marginTop: 20 }}>Akşam sağımı</h3>
        <div className="row">
          <div style={{ flex: 1 }}><label className="label">Başlangıç</label><input className="input" type="time" value={eveningStart} onChange={(e) => setEveningStart(e.target.value)} /></div>
          <div style={{ flex: 1 }}><label className="label">Bitiş</label><input className="input" type="time" value={eveningEnd} onChange={(e) => setEveningEnd(e.target.value)} /></div>
        </div>
        <p style={{ fontSize: 12, color: 'var(--subtext)' }}>Müşteriler her seans için, o seansın başlangıç saatine kadar sipariş verebilir.</p>

        <h3 style={{ marginTop: 20 }}>Kapasite ve fiyat</h3>
        <label className="label">Günlük kapasite (litre, boş = sınırsız)</label>
        <input className="input" type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
        <label className="label">Litre fiyatı (₺)</label>
        <input className="input" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />

        <h3 style={{ marginTop: 20 }}>İletişim ve notlar</h3>
        <label className="label">IBAN (opsiyonel)</label>
        <input className="input" value={iban} onChange={(e) => setIban(e.target.value)} placeholder="TR.. .. ...." />
        <label className="label">Genel not (müşterilere gösterilir)</label>
        <textarea className="input" value={generalNote} onChange={(e) => setGeneralNote(e.target.value)} />

        <button className="btn btn-primary" style={{ marginTop: 20 }} disabled={loading}>{loading ? 'Kaydediliyor...' : 'Kaydet'}</button>
      </form>

      <h3 style={{ marginTop: 32 }}>Şifre değiştir</h3>
      {pwMessage && <div className="note-card" style={{ color: pwMessage.type === 'error' ? 'var(--danger)' : 'var(--success)' }}>{pwMessage.text}</div>}
      <form onSubmit={handleChangePassword}>
        <input className="input" style={{ marginBottom: 10 }} type="password" placeholder="Mevcut şifre" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        <input className="input" style={{ marginBottom: 10 }} type="password" placeholder="Yeni şifre" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <input className="input" type="password" placeholder="Yeni şifre (tekrar)" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        <button className="btn btn-primary" style={{ marginTop: 14 }} disabled={savingPassword}>{savingPassword ? 'Kaydediliyor...' : 'Şifreyi Güncelle'}</button>
      </form>

      <button className="btn btn-danger-outline" style={{ marginTop: 24, marginBottom: 20 }} onClick={logout}>Çıkış yap</button>
    </div>
  );
}
