import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getProducerContact().then(setContact).catch((err) => console.log(err.message)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="auth-page" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 40 }}>🔒</div>
      <h2 style={{ marginTop: 16, marginBottom: 10 }}>Şifreni mi unuttun?</h2>
      <p style={{ color: 'var(--subtext)', fontSize: 14, lineHeight: 1.5 }}>
        Bu uygulamada şifre sıfırlama, üreticinle iletişime geçerek yapılıyor. Üretici, senin
        için uygulama üzerinden yeni bir şifre belirleyebilir.
      </p>

      {loading && <p style={{ color: 'var(--subtext)' }}>Yükleniyor...</p>}

      {!loading && contact && (
        <div className="card" style={{ marginTop: 20 }}>
          <div style={{ fontWeight: 700 }}>{contact.full_name}</div>
          <div style={{ color: 'var(--subtext)', marginTop: 4 }}>{contact.phone}</div>
          <a
            className="btn btn-primary"
            style={{ marginTop: 14, display: 'inline-block', textDecoration: 'none', width: 'auto', padding: '10px 20px' }}
            href={`tel:${contact.phone}`}
          >
            Ara
          </a>
        </div>
      )}

      <button className="link" onClick={() => navigate('/login')}>
        Giriş ekranına dön
      </button>
    </div>
  );
}
