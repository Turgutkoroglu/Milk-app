import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../api/client';

export default function ProducerCustomersScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const [customers, setCustomers] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.getCustomers();
      setCustomers(data);
    } catch (err) {
      console.log('Musteriler yuklenemedi:', err.message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function toggleExpand(id) {
    setExpandedId(expandedId === id ? null : id);
    setNewPassword('');
  }

  async function handleReset(customerId) {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Geçersiz şifre', 'Yeni şifre en az 6 karakter olmalı');
      return;
    }
    setSaving(true);
    try {
      await api.resetCustomerPassword(customerId, newPassword);
      Alert.alert('Başarılı', 'Müşterinin şifresi güncellendi');
      setExpandedId(null);
      setNewPassword('');
    } catch (err) {
      Alert.alert('Sıfırlanamadı', err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerNote}>
        Bir müşteri şifresini unuttuysa, buradan onun için yeni bir şifre belirleyebilirsin.
      </Text>
      <FlatList
        data={customers}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={<Text style={styles.empty}>Henüz müşteri yok</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity style={styles.cardHeader} onPress={() => toggleExpand(item.id)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.full_name}</Text>
                <Text style={styles.phone}>{item.phone}</Text>
              </View>
              <MaterialCommunityIcons
                name={expandedId === item.id ? 'chevron-up' : 'chevron-down'}
                size={22}
                color={theme.subtext}
              />
            </TouchableOpacity>

            {expandedId === item.id && (
              <View style={styles.resetRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Yeni şifre (en az 6 karakter)"
                  placeholderTextColor={theme.subtext}
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={() => handleReset(item.id)}
                  disabled={saving}
                >
                  <Text style={styles.resetButtonText}>{saving ? '...' : 'Sıfırla'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}

function getStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: theme.background },
    headerNote: { fontSize: 13, color: theme.subtext, marginBottom: 16, lineHeight: 18 },
    empty: { color: theme.subtext, fontStyle: 'italic' },
    card: {
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.card,
      borderRadius: 10,
      padding: 14,
      marginBottom: 10,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    name: { fontSize: 15, fontWeight: '700', color: theme.text },
    phone: { fontSize: 13, color: theme.subtext, marginTop: 2 },
    resetRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      padding: 10,
      color: theme.text,
      backgroundColor: theme.inputBg,
    },
    resetButton: {
      backgroundColor: theme.primary,
      borderRadius: 8,
      paddingHorizontal: 16,
      justifyContent: 'center',
    },
    resetButtonText: { color: '#fff', fontWeight: '600' },
  });
}
