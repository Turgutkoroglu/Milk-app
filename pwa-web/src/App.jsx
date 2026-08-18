import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import BottomNav from './components/BottomNav.jsx';
import InstallBanner from './components/InstallBanner.jsx';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';

import NewOrder from './pages/customer/NewOrder.jsx';
import Subscriptions from './pages/customer/Subscriptions.jsx';
import History from './pages/customer/History.jsx';
import Info from './pages/customer/Info.jsx';
import Profile from './pages/customer/Profile.jsx';

import Orders from './pages/producer/Orders.jsx';
import Reports from './pages/producer/Reports.jsx';
import Customers from './pages/producer/Customers.jsx';
import Settings from './pages/producer/Settings.jsx';

export default function App() {
  const { user, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (loading) return null;

  if (!user) {
    return (
      <div className="app-shell">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    );
  }

  const isProducer = user.role === 'producer';

  return (
    <div className="app-shell">
      <InstallBanner />
      <Routes>
        {isProducer ? (
          <>
            <Route path="/orders" element={<Orders />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/orders" replace />} />
          </>
        ) : (
          <>
            <Route path="/order" element={<NewOrder />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/history" element={<History />} />
            <Route path="/info" element={<Info />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/order" replace />} />
          </>
        )}
      </Routes>
      <BottomNav isProducer={isProducer} />
    </div>
  );
}
