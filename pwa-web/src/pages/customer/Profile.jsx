import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../api/client';

export default function Profile() {
  const { user, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleChangePassword(e) {
    e.preventDefault();
    if (!currentPassword || !newPassword) { setMessage({ type: 'error', text: 'Mevcut ve yeni şifreyi gir' }); return; }
    if (newPassword !== confirmPassword) { setMessage({ type: 'error', text: 'Yeni şifreler uyuşmuyor' }); return; }
    if (newPassword.length < 6) { setMessage({ type: 'error', text: 'Yeni şifre en az 6 karakter olmalı' }); return; }
    setSaving(true);
    setMessage(null);
    try {
      await api.changePassword(currentPassword, newPassword);
      setMessage({ type: 'success', text: 'Şifren güncellendi' });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <h2>{user?.full_name}</h2>
      <p style={{ color: 'var(--subtext)' }}>{user?.phone}</p>

      <h3 style={{ marginTop: 28 }}>Şifre değiştir</h3>
      {message && <div className="note-card" style={{ color: message.type === 'error' ? 'var(--danger)' : 'var(--success)' }}>{message.text}</div>}
      <form onSubmit={handleChangePassword}>
        <input className="input" style={{ marginBottom: 10 }} type="password" placeholder="Mevcut şifre" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        <input className="input" style={{ marginBottom: 10 }} type="password" placeholder="Yeni şifre" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <input className="input" type="password" placeholder="Yeni şifre (tekrar)" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        <button className="btn btn-primary" style={{ marginTop: 14 }} disabled={saving}>{saving ? 'Kaydediliyor...' : 'Şifreyi Güncelle'}</button>
      </form>

      <button className="btn btn-danger-outline" style={{ marginTop: 32 }} onClick={logout}>Çıkış yap</button>
    </div>
  );
}
