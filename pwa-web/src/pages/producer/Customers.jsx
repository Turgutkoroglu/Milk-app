import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => { api.getCustomers().then(setCustomers).catch((err) => console.log(err.message)); }, []);

  function toggle(id) { setExpandedId(expandedId === id ? null : id); setNewPassword(''); }

  async function handleReset(id) {
    if (!newPassword || newPassword.length < 6) { setMessage({ type: 'error', text: 'Yeni şifre en az 6 karakter olmalı' }); return; }
    setSaving(true);
    setMessage(null);
    try {
      await api.resetCustomerPassword(id, newPassword);
      setMessage({ type: 'success', text: 'Müşterinin şifresi güncellendi' });
      setExpandedId(null);
      setNewPassword('');
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <p style={{ fontSize: 13, color: 'var(--subtext)' }}>Bir müşteri şifresini unuttuysa, buradan onun için yeni bir şifre belirleyebilirsin.</p>
      {message && <div className="note-card" style={{ color: message.type === 'error' ? 'var(--danger)' : 'var(--success)' }}>{message.text}</div>}
      {customers.length === 0 && <p className="empty-text">Henüz müşteri yok</p>}
      {customers.map((c) => (
        <div className="card" key={c.id}>
          <div className="row" style={{ cursor: 'pointer', marginBottom: 0 }} onClick={() => toggle(c.id)}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{c.full_name}</div>
              <div style={{ fontSize: 13, color: 'var(--subtext)' }}>{c.phone}</div>
            </div>
            <span>{expandedId === c.id ? '▲' : '▼'}</span>
          </div>
          {expandedId === c.id && (
            <div className="row" style={{ marginTop: 12 }}>
              <input className="input" type="password" placeholder="Yeni şifre (en az 6 karakter)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <button className="btn btn-primary btn-small" disabled={saving} onClick={() => handleReset(c.id)}>{saving ? '...' : 'Sıfırla'}</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
