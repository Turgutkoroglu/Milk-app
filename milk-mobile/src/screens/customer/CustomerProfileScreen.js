import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Switch } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useAgent } from '../../context/AgentContext';
import { api } from '../../api/client';

const MODES = [
  { key: 'system', label: 'Cihaza göre', icon: 'theme-light-dark' },
  { key: 'light', label: 'Gündüz', icon: 'weather-sunny' },
  { key: 'dark', label: 'Gece', icon: 'weather-night' },
];

export default function CustomerProfileScreen() {
  const { user, logout } = useAuth();
  const { theme, mode, setThemeMode } = useTheme();
  const { enabled: agentEnabled, setAgentEnabled } = useAgent();
  const styles = getStyles(theme);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  async function handleChangePassword() {
    if (!currentPassword || !newPassword) {
      Alert.alert('Eksik bilgi', 'Mevcut ve yeni şifreyi gir');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Şifreler uyuşmuyor', 'Yeni şifre ile tekrar aynı olmalı');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Çok kısa', 'Yeni şifre en az 6 karakter olmalı');
      return;
    }
    setSavingPassword(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      Alert.alert('Başarılı', 'Şifren güncellendi');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      Alert.alert('Değiştirilemedi', err.message);
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.name}>{user?.full_name}</Text>
      <Text style={styles.phone}>{user?.phone}</Text>

      <Text style={styles.sectionTitle}>Agent (akıllı öneriler)</Text>
      <View style={styles.agentRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.agentTitle}>Sipariş önerileri</Text>
          <Text style={styles.agentDesc}>
            Açıksa geçmiş siparişlerine göre "aynısını gönder" önerisi görürsün.
          </Text>
        </View>
        <Switch
          value={agentEnabled}
          onValueChange={setAgentEnabled}
          trackColor={{ false: theme.border, true: theme.primary }}
        />
      </View>

      <Text style={styles.sectionTitle}>Görünüm</Text>
      <View style={styles.modeRow}>
        {MODES.map((m) => (
          <TouchableOpacity
            key={m.key}
            style={[styles.modeButton, mode === m.key && styles.modeButtonActive]}
            onPress={() => setThemeMode(m.key)}
          >
            <MaterialCommunityIcons
              name={m.icon}
              size={20}
              color={mode === m.key ? '#fff' : theme.primary}
            />
            <Text style={mode === m.key ? styles.modeTextActive : styles.modeText}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Şifre değiştir</Text>
      <TextInput
        style={styles.input}
        placeholder="Mevcut şifre"
        placeholderTextColor={theme.subtext}
        secureTextEntry
        value={currentPassword}
        onChangeText={setCurrentPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Yeni şifre"
        placeholderTextColor={theme.subtext}
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Yeni şifre (tekrar)"
        placeholderTextColor={theme.subtext}
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <TouchableOpacity style={styles.saveButton} onPress={handleChangePassword} disabled={savingPassword}>
        <Text style={styles.saveButtonText}>
          {savingPassword ? 'Kaydediliyor...' : 'Şifreyi Güncelle'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Çıkış yap</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function getStyles(theme) {
  return StyleSheet.create({
    container: { flexGrow: 1, padding: 20, backgroundColor: theme.background },
    name: { fontSize: 20, fontWeight: '700', marginTop: 12, color: theme.text },
    phone: { fontSize: 14, color: theme.subtext, marginTop: 4 },
    sectionTitle: { fontSize: 14, color: theme.subtext, marginTop: 32, marginBottom: 10 },
    agentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      padding: 14,
    },
    agentTitle: { fontSize: 14, fontWeight: '700', color: theme.text },
    agentDesc: { fontSize: 12, color: theme.subtext, marginTop: 4, lineHeight: 16 },
    modeRow: { flexDirection: 'row', gap: 10 },
    modeButton: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: theme.primary,
      borderRadius: 8,
      paddingVertical: 12,
    },
    modeButtonActive: { backgroundColor: theme.primary },
    modeText: { color: theme.primary, fontSize: 12, fontWeight: '600' },
    modeTextActive: { color: '#fff', fontSize: 12, fontWeight: '600' },
    input: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      padding: 14,
      fontSize: 16,
      marginBottom: 10,
      backgroundColor: theme.inputBg,
      color: theme.text,
    },
    saveButton: { backgroundColor: theme.primary, borderRadius: 8, padding: 14, marginTop: 4 },
    saveButtonText: { color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 15 },
    logoutButton: {
      marginTop: 40,
      marginBottom: 20,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.danger,
      borderRadius: 8,
    },
    logoutText: { color: theme.danger, textAlign: 'center', fontWeight: '600' },
  });
}
