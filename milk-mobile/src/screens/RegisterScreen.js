import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [role, setRole] = useState('customer');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!fullName || !phone || !password) {
      Alert.alert('Eksik bilgi', 'Ad, telefon ve şifre gerekli');
      return;
    }
    setLoading(true);
    try {
      await register({ role, full_name: fullName, phone, password });
    } catch (err) {
      Alert.alert('Kayıt başarısız', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Kayıt Ol</Text>

      <View style={styles.roleRow}>
        <TouchableOpacity
          style={[styles.roleButton, role === 'customer' && styles.roleButtonActive]}
          onPress={() => setRole('customer')}
        >
          <Text style={role === 'customer' ? styles.roleTextActive : styles.roleText}>Müşteriyim</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleButton, role === 'producer' && styles.roleButtonActive]}
          onPress={() => setRole('producer')}
        >
          <Text style={role === 'producer' ? styles.roleTextActive : styles.roleText}>Üreticiyim</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Ad Soyad"
        placeholderTextColor={theme.subtext}
        value={fullName}
        onChangeText={setFullName}
      />
      <TextInput
        style={styles.input}
        placeholder="Telefon numarası"
        placeholderTextColor={theme.subtext}
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Şifre"
        placeholderTextColor={theme.subtext}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Kaydediliyor...' : 'Kayıt Ol'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Zaten hesabın var mı? Giriş yap</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function getStyles(theme) {
  return StyleSheet.create({
    container: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: theme.background },
    title: { fontSize: 24, fontWeight: '700', marginBottom: 24, textAlign: 'center', color: theme.primary },
    roleRow: { flexDirection: 'row', marginBottom: 16, gap: 8 },
    roleButton: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.primary,
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
    },
    roleButtonActive: { backgroundColor: theme.primary },
    roleText: { color: theme.primary, fontWeight: '600' },
    roleTextActive: { color: '#fff', fontWeight: '600' },
    input: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      padding: 14,
      marginBottom: 12,
      fontSize: 16,
      backgroundColor: theme.inputBg,
      color: theme.text,
    },
    button: { backgroundColor: theme.primary, borderRadius: 8, padding: 16, marginTop: 8 },
    buttonText: { color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 16 },
    link: { color: theme.primary, textAlign: 'center', marginTop: 20, marginBottom: 20 },
  });
}
