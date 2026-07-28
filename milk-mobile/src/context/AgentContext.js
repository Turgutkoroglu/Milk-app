import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

const AGENT_KEY = 'sut_agent_enabled';

const AgentContext = createContext(null);

export function AgentProvider({ children }) {
  const [enabled, setEnabled] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync(AGENT_KEY);
        if (saved !== null) setEnabled(saved === 'true');
      } catch (err) {
        console.log('Agent tercihi okunamadi:', err.message);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  async function setAgentEnabled(value) {
    setEnabled(value);
    try {
      await SecureStore.setItemAsync(AGENT_KEY, String(value));
    } catch (err) {
      console.log('Agent tercihi kaydedilemedi:', err.message);
    }
  }

  return (
    <AgentContext.Provider value={{ enabled, loaded, setAgentEnabled }}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error('useAgent, AgentProvider icinde kullanilmali');
  return ctx;
}
