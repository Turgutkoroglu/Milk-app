import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const THEME_KEY = 'sut_theme_mode'; // 'light' | 'dark' | 'system'

export const palettes = {
  light: {
    background: '#faf8f5',
    card: '#ffffff',
    border: '#e8e2d8',
    text: '#2a2016',
    subtext: '#7a6f60',
    primary: '#6b4226',
    primaryLight: '#f2e4c9',
    accent: '#e8734a',
    danger: '#c0392b',
    inputBg: '#ffffff',
    tabInactive: '#a89584',
  },
  dark: {
    background: '#181410',
    card: '#241d16',
    border: '#3a2f24',
    text: '#f2ece2',
    subtext: '#b3a494',
    primary: '#e0a872',
    primaryLight: '#3a2f22',
    accent: '#f0916a',
    danger: '#ff7b6b',
    inputBg: '#2a2219',
    tabInactive: '#6b5f52',
  },
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('system');
  const [systemScheme, setSystemScheme] = useState(Appearance.getColorScheme() || 'light');

  useEffect(() => {
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync(THEME_KEY);
        if (saved) setMode(saved);
      } catch (err) {
        console.log('Tema tercihi okunamadi:', err.message);
      }
    })();

    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme || 'light');
    });
    return () => sub.remove();
  }, []);

  const resolvedScheme = mode === 'system' ? systemScheme : mode;
  const theme = palettes[resolvedScheme];

  async function setThemeMode(newMode) {
    setMode(newMode);
    try {
      await SecureStore.setItemAsync(THEME_KEY, newMode);
    } catch (err) {
      console.log('Tema tercihi kaydedilemedi:', err.message);
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, scheme: resolvedScheme, mode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme, ThemeProvider icinde kullanilmali');
  return ctx;
}
