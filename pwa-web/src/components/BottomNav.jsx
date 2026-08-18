import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const customerTabs = [
  { path: '/order', icon: '🍼', label: 'Sipariş' },
  { path: '/subscriptions', icon: '🔁', label: 'Abonelik' },
  { path: '/history', icon: '🕒', label: 'Geçmiş' },
  { path: '/info', icon: 'ℹ️', label: 'Bilgi' },
  { path: '/profile', icon: '👤', label: 'Profil' },
];

const producerTabs = [
  { path: '/orders', icon: '📋', label: 'Siparişler' },
  { path: '/reports', icon: '📊', label: 'Rapor' },
  { path: '/customers', icon: '👥', label: 'Müşteriler' },
  { path: '/settings', icon: '⚙️', label: 'Ayarlar' },
];

export default function BottomNav({ isProducer }) {
  const navigate = useNavigate();
  const location = useLocation();
  const tabs = isProducer ? producerTabs : customerTabs;

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => (
        <button
          key={tab.path}
          className={`nav-item ${location.pathname === tab.path ? 'active' : ''}`}
          onClick={() => navigate(tab.path)}
        >
          <span className="nav-icon">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
