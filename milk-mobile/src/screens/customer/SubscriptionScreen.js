import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../api/client';

const DAYS = [
  { id: 1, label: 'Pzt' },
  { id: 2, label: 'Sal' },
  { id: 3, label: 'Çar' },
  { id: 4, label: 'Per' },
  { id: 5, label: 'Cum' },
  { id: 6, label: 'Cmt' },
  { id: 7, label: 'Paz' },
];

export default function SubscriptionScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const [subscriptions, setSubscriptions] = useState([]);
  const [session, setSession] = useState('morning');
  const [quantity, setQuantity] = useState('1');
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5, 6, 7]);
  const [loading, setLoading] = useState(false);

  const loadSubscriptions = useCallback(async () => {
    try {
      const data = await api.getSubscriptions();
      setSubscriptions(data);
    } catch (err) {
      console.log('Abonelikler yuklenemedi:', err.message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSubscriptions();
    }, [loadSubscriptions])
  );

  function toggleDay(dayId) {
    setSelectedDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId].sort()
    );
  }

  async function handleCreate() {
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      Alert.alert('Geçersiz miktar', 'Litre miktarı pozitif bir sayı olmalı');
      return;
    }
    if (selectedDays.length === 0) {
      Alert.alert('Gün seç', 'En az bir gün seçmelisin');
      return;
    }
    setLoading(true);
    try {
      await api.createSubscription({ session, quantity_lt: qty, days_of_week: selectedDays });
      Alert.alert('Başarılı', 'Abonelik oluşturuldu');
      loadSubscriptions();
    } catch (err) {
      Alert.alert('Abonelik oluşturulamadı', err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeactivate(id) {
    try {
      await api.deactivateSubscription(id);
      loadSubscriptions();
    } catch (err) {
      Alert.alert('İşlem başarısız', err.message);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Yeni abonelik oluştur</Text>

      <View style={styles.sessionRow}>
        <TouchableOpacity
          style={[styles.sessionButton, session === 'morning' && styles.sessionButtonActive]}
          onPress={() => setSession('morning')}
        >
          <MaterialCommunityIcons
            name="weather-sunny"
            size={16}
            color={session === 'morning' ? '#fff' : theme.primary}
          />
          <Text style={session === 'morning' ? styles.sessionTextActive : styles.sessionText}>
            Sabah
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sessionButton, session === 'evening' && styles.sessionButtonActive]}
          onPress={() => setSession('evening')}
        >
          <MaterialCommunityIcons
            name="weather-night"
            size={16}
            color={session === 'evening' ? '#fff' : theme.primary}
          />
          <Text style={session === 'evening' ? styles.sessionTextActive : styles.sessionText}>
            Akşam
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={quantity}
        onChangeText={setQuantity}
        placeholder="Günlük litre"
        placeholderTextColor={theme.subtext}
      />

      <View style={styles.dayRow}>
        {DAYS.map((day) => (
          <TouchableOpacity
            key={day.id}
            style={[styles.dayChip, selectedDays.includes(day.id) && styles.dayChipActive]}
            onPress={() => toggleDay(day.id)}
          >
            <Text style={selectedDays.includes(day.id) ? styles.dayTextActive : styles.dayText}>
              {day.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Kaydediliyor...' : 'Abonelik Oluştur'}</Text>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Mevcut abonelikler</Text>
      <FlatList
        data={subscriptions}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={<Text style={styles.empty}>Henüz abonelik yok</Text>}
        renderItem={({ item }) => (
          <View style={styles.subCard}>
            <MaterialCommunityIcons
              name={item.session === 'morning' ? 'weather-sunny' : 'weather-night'}
              size={22}
              color={theme.primary}
            />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.subTitle}>
                {item.quantity_lt} litre / {item.session === 'morning' ? 'sabah' : 'akşam'}
                {item.active ? '' : ' (pasif)'}
              </Text>
              <Text style={styles.subDays}>
                {item.days_of_week.map((d) => DAYS.find((x) => x.id === d)?.label).join(', ')}
              </Text>
            </View>
            {item.active && (
              <TouchableOpacity onPress={() => handleDeactivate(item.id)}>
                <Text style={styles.stopLink}>Durdur</Text>
              </TouchableOpacity>
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
    sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, color: theme.text },
    sessionRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    sessionButton: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: theme.primary,
      borderRadius: 8,
      paddingVertical: 10,
    },
    sessionButtonActive: { backgroundColor: theme.primary },
    sessionText: { color: theme.primary, fontWeight: '600' },
    sessionTextActive: { color: '#fff', fontWeight: '600' },
    input: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      padding: 14,
      fontSize: 16,
      marginBottom: 12,
      backgroundColor: theme.inputBg,
      color: theme.text,
    },
    dayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    dayChip: { borderWidth: 1, borderColor: theme.primary, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14 },
    dayChipActive: { backgroundColor: theme.primary },
    dayText: { color: theme.primary },
    dayTextActive: { color: '#fff' },
    button: { backgroundColor: theme.primary, borderRadius: 8, padding: 16 },
    buttonText: { color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 16 },
    empty: { color: theme.subtext, fontStyle: 'italic' },
    subCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.card,
      borderRadius: 8,
      padding: 14,
      marginBottom: 10,
    },
    subTitle: { fontSize: 15, fontWeight: '600', color: theme.text },
    subDays: { fontSize: 13, color: theme.subtext, marginTop: 4 },
    stopLink: { color: theme.danger, fontWeight: '600' },
  });
}
