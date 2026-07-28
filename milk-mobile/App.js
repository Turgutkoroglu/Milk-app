import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AgentProvider } from './src/context/AgentContext';
import RootNavigator from './src/navigation/RootNavigator';

function StatusBarBridge() {
  const { scheme } = useTheme();
  return <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AgentProvider>
          <StatusBarBridge />
          <RootNavigator />
        </AgentProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
