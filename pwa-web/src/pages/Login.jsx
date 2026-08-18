import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { registerWebPush } from '../push.js';

export default function Login() {
  const { login, sessionExpiredNotice, setSessionExpiredNotice } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!phone || !password) {
      setError('Telefon ve şifre gerekli');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(phone, password);
      registerWebPush().catch((err) => console.log('Push kaydi basarisiz:', err.message));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <img src="/icons/icon-192.png" alt="Köroğlu Farm" className="logo" />
      <h1 className="title-center">Köroğlu Farm</h1>

      {sessionExpiredNotice && (
        <div className="note-card">Oturumunun süresi doldu, tekrar giriş yapman gerekiyor.</div>
      )}
      {error && <div className="note-card" style={{ color: 'var(--danger)' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <label className="label">Telefon numarası</label>
        <input className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <label className="label">Şifre</label>
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="btn btn-primary" style={{ marginTop: 20 }} disabled={loading}>
          {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </button>
      </form>

      <button
        className="link"
        onClick={() => {
          setSessionExpiredNotice(false);
          navigate('/forgot-password');
        }}
      >
        Şifremi unuttum
      </button>
      <button
        className="link"
        onClick={() => {
          setSessionExpiredNotice(false);
          navigate('/register');
        }}
      >
        Hesabın yok mu? Kayıt ol
      </button>
    </div>
  );
}
