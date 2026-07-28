import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/client';

export default function InfoScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [settings, setSettings] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
    } catch (err) {
      console.log('Bilgiler yuklenemedi:', err.message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
        />
      }
    >
      {settings?.general_note ? (
        <View style={styles.noteCard}>
          <MaterialCommunityIcons name="bullhorn-outline" size={22} color={theme.primary} />
          <Text style={styles.noteText}>{settings.general_note}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Satış saatleri</Text>
        <View style={styles.row}>
          <MaterialCommunityIcons name="weather-sunny" size={20} color={theme.subtext} />
          <Text style={styles.rowText}>
            Sabah: {settings?.morning_start?.slice(0, 5)} - {settings?.morning_end?.slice(0, 5)}
          </Text>
        </View>
        <View style={styles.row}>
          <MaterialCommunityIcons name="weather-night" size={20} color={theme.subtext} />
          <Text style={styles.rowText}>
            Akşam: {settings?.evening_start?.slice(0, 5)} - {settings?.evening_end?.slice(0, 5)}
          </Text>
        </View>
        {settings?.price_per_lt ? (
          <View style={styles.row}>
            <MaterialCommunityIcons name="cash" size={20} color={theme.subtext} />
            <Text style={styles.rowText}>Litre fiyatı: {settings.price_per_lt} ₺</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>İletişim</Text>
        <View style={styles.row}>
          <MaterialCommunityIcons name="account-outline" size={20} color={theme.subtext} />
          <Text style={styles.rowText}>{settings?.producer_name || '-'}</Text>
        </View>
        <View style={styles.row}>
          <MaterialCommunityIcons name="phone-outline" size={20} color={theme.subtext} />
          <Text style={styles.rowText}>{settings?.producer_phone || '-'}</Text>
        </View>
        {settings?.iban ? (
          <View style={styles.row}>
            <MaterialCommunityIcons name="bank-outline" size={20} color={theme.subtext} />
            <Text style={styles.rowText} selectable>
              {settings.iban}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.reminderCard}>
        <MaterialCommunityIcons name="bottle-tonic-outline" size={20} color={theme.accent} />
        <Text style={styles.reminderText}>Lütfen süt şişelerinizi kendiniz getiriniz.</Text>
      </View>

      <View style={[styles.reminderCard, { marginTop: 10 }]}>
        <MaterialCommunityIcons name="information-outline" size={20} color={theme.accent} />
        <Text style={styles.reminderText}>
          Lütfen sütü teslim aldıktan sonra ödeme yapınız.
        </Text>
      </View>
    </ScrollView>
  );
}

function getStyles(theme) {
  return StyleSheet.create({
    container: { flexGrow: 1, padding: 20, backgroundColor: theme.background },
    noteCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      backgroundColor: theme.primaryLight,
      borderRadius: 10,
      padding: 14,
      marginBottom: 16,
    },
    noteText: { flex: 1, color: theme.text, fontSize: 14, lineHeight: 20 },
    card: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      padding: 16,
      marginBottom: 16,
    },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 12 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    rowText: { color: theme.text, fontSize: 14 },
    reminderCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.accent,
      borderRadius: 10,
      padding: 14,
    },
    reminderText: { flex: 1, color: theme.text, fontSize: 13, fontWeight: '600' },
  });
}
