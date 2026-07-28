import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/client';

export default function ForgotPasswordScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getProducerContact();
        setContact(data);
      } catch (err) {
        console.log('Uretici bilgisi alinamadi:', err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="lock-question" size={48} color={theme.primary} />
      <Text style={styles.title}>Şifreni mi unuttun?</Text>
      <Text style={styles.desc}>
        Bu uygulamada şifre sıfırlama, üreticinle iletişime geçerek yapılıyor. Üretici, senin için
        uygulama üzerinden yeni bir şifre belirleyebilir.
      </Text>

      {loading && <Text style={styles.loading}>Yükleniyor...</Text>}

      {!loading && contact && (
        <View style={styles.contactCard}>
          <Text style={styles.contactName}>{contact.full_name}</Text>
          <Text style={styles.contactPhone}>{contact.phone}</Text>
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => Linking.openURL(`tel:${contact.phone}`)}
          >
            <MaterialCommunityIcons name="phone" size={18} color="#fff" />
            <Text style={styles.callButtonText}>Ara</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !contact && (
        <Text style={styles.desc}>Üretici bilgisi şu anda bulunamadı, lütfen daha sonra tekrar dene.</Text>
      )}

      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 24 }}>
        <Text style={styles.backLink}>Giriş ekranına dön</Text>
      </TouchableOpacity>
    </View>
  );
}

function getStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28, backgroundColor: theme.background },
    title: { fontSize: 20, fontWeight: '700', color: theme.text, marginTop: 16, marginBottom: 10 },
    desc: { fontSize: 14, color: theme.subtext, textAlign: 'center', lineHeight: 20, marginBottom: 8 },
    loading: { color: theme.subtext, marginTop: 20 },
    contactCard: {
      marginTop: 20,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      padding: 20,
      alignItems: 'center',
      width: '100%',
    },
    contactName: { fontSize: 16, fontWeight: '700', color: theme.text },
    contactPhone: { fontSize: 15, color: theme.subtext, marginTop: 4 },
    callButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.primary,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 20,
      marginTop: 14,
    },
    callButtonText: { color: '#fff', fontWeight: '600' },
    backLink: { color: theme.primary, fontSize: 14 },
  });
}
