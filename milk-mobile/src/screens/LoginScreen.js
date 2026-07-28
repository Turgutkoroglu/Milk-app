import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function LoginScreen({ navigation }) {
  const { login, sessionExpiredNotice, setSessionExpiredNotice } = useAuth();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!phone || !password) {
      Alert.alert('Eksik bilgi', 'Telefon ve sifre gerekli');
      return;
    }
    setLoading(true);
    try {
      await login(phone, password);
    } catch (err) {
      Alert.alert('Giris basarisiz', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/icon.png')} style={styles.logo} />
      <Text style={styles.title}>Köroğlu Farm</Text>

      {sessionExpiredNotice && (
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            Oturumunun süresi doldu, güvenlik için tekrar giriş yapman gerekiyor.
          </Text>
        </View>
      )}

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

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          setSessionExpiredNotice(false);
          navigation.navigate('ForgotPassword');
        }}
      >
        <Text style={styles.forgotLink}>Şifremi unuttum</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          setSessionExpiredNotice(false);
          navigation.navigate('Register');
        }}
      >
        <Text style={styles.link}>Hesabın yok mu? Kayıt ol</Text>
      </TouchableOpacity>
    </View>
  );
}

function getStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: theme.background },
    logo: { width: 88, height: 88, borderRadius: 22, alignSelf: 'center', marginBottom: 16 },
    title: { fontSize: 26, fontWeight: '700', marginBottom: 24, textAlign: 'center', color: theme.primary },
    noticeBox: {
      backgroundColor: theme.primaryLight,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
    },
    noticeText: { color: theme.text, fontSize: 13, textAlign: 'center', lineHeight: 18 },
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
    forgotLink: { color: theme.subtext, textAlign: 'center', marginTop: 18, fontSize: 13 },
    link: { color: theme.primary, textAlign: 'center', marginTop: 16 },
  });
}
