import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken, getStoredUser, setStoredUser, setUnauthorizedHandler } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (token) {
      const savedUser = getStoredUser();
      if (savedUser) setUser(savedUser);
    }
    setLoading(false);

    setUnauthorizedHandler(() => {
      setSessionExpiredNotice(true);
      setToken(null);
      setStoredUser(null);
      setUser(null);
    });
  }, []);

  async function login(phone, password) {
    const data = await api.login({ phone, password });
    setToken(data.token);
    setStoredUser(data.user);
    setUser(data.user);
    setSessionExpiredNotice(false);
    return data.user;
  }

  async function register(payload) {
    const data = await api.register(payload);
    setToken(data.token);
    setStoredUser(data.user);
    setUser(data.user);
    setSessionExpiredNotice(false);
    return data.user;
  }

  function logout() {
    setToken(null);
    setStoredUser(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, sessionExpiredNotice, setSessionExpiredNotice }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth, AuthProvider icinde kullanilmali');
  return ctx;
}
