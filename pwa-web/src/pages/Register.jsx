import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('customer');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!fullName || !phone || !password) {
      setError('Ad, telefon ve şifre gerekli');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register({ role, full_name: fullName, phone, password });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <h1 className="title-center">Kayıt Ol</h1>
      {error && <div className="note-card" style={{ color: 'var(--danger)' }}>{error}</div>}

      <div className="segmented">
        <button type="button" className={role === 'customer' ? 'active' : ''} onClick={() => setRole('customer')}>
          Müşteriyim
        </button>
        <button type="button" className={role === 'producer' ? 'active' : ''} onClick={() => setRole('producer')}>
          Üreticiyim
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <input className="input" style={{ marginBottom: 12 }} placeholder="Ad Soyad" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <input className="input" style={{ marginBottom: 12 }} type="tel" placeholder="Telefon numarası" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input className="input" type="password" placeholder="Şifre" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="btn btn-primary" style={{ marginTop: 20 }} disabled={loading}>
          {loading ? 'Kaydediliyor...' : 'Kayıt Ol'}
        </button>
      </form>

      <button className="link" onClick={() => navigate('/login')}>
        Zaten hesabın var mı? Giriş yap
      </button>
    </div>
  );
}
