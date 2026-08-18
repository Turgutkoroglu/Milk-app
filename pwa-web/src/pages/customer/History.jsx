import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';

const STATUS_LABELS = { pending: 'Bekliyor', confirmed: 'Onaylandı', cancelled: 'İptal edildi', delivered: 'Teslim edildi' };

export default function History() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  function load() {
    api.getOrders().then(setOrders).catch((err) => setError(err.message));
  }
  useEffect(load, []);

  async function handleCancel(id) {
    try { await api.cancelOrder(id); load(); } catch (err) { setError(err.message); }
  }

  return (
    <div className="page">
      {error && <div className="note-card" style={{ color: 'var(--danger)' }}>{error}</div>}
      {orders.length === 0 && <p className="empty-text">Henüz sipariş yok</p>}
      {orders.map((item) => {
        const total = item.price_lt_at_order ? (Number(item.price_lt_at_order) * Number(item.quantity_lt)).toFixed(2) : null;
        return (
          <div className="card row" key={item.id}>
            <span style={{ fontSize: 22 }}>{item.session === 'morning' ? '☀️' : '🌙'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{item.delivery_date} · {item.delivery_time?.slice(0, 5)}</div>
              <div>{item.quantity_lt} litre {total ? `— ${total} ₺` : ''}</div>
              <div className={`status-badge status-${item.status}`}>{STATUS_LABELS[item.status] || item.status}</div>
            </div>
            {item.status === 'pending' && <button className="link" style={{ margin: 0, color: 'var(--danger)' }} onClick={() => handleCancel(item.id)}>İptal et</button>}
          </div>
        );
      })}
    </div>
  );
}
