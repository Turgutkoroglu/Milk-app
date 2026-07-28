import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAgent } from '../../context/AgentContext';
import { api } from '../../api/client';

const PERIODS = [
  { key: 7, label: 'Haftalık' },
  { key: 30, label: 'Aylık' },
  { key: 1, label: 'Günlük' },
];

export default function ReportsScreen() {
  const { theme } = useTheme();
  const { enabled } = useAgent();
  const styles = getStyles(theme);

  const [days, setDays] = useState(30);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (targetDays) => {
    setLoading(true);
    try {
      const data = await api.getProducerReport(targetDays);
      setReport(data);
    } catch (err) {
      console.log('Rapor yuklenemedi:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (enabled) load(days);
    }, [days, enabled, load])
  );

  if (!enabled) {
    return (
      <View style={styles.disabledContainer}>
        <MaterialCommunityIcons name="robot-off-outline" size={40} color={theme.subtext} />
        <Text style={styles.disabledText}>
          Agent şu an kapalı. Rapor ve önerileri görmek için Ayarlar'dan açabilirsin.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await load(days);
            setRefreshing(false);
          }}
        />
      }
    >
      <View style={styles.periodRow}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.key}
            style={[styles.periodButton, days === p.key && styles.periodButtonActive]}
            onPress={() => setDays(p.key)}
          >
            <Text style={days === p.key ? styles.periodTextActive : styles.periodText}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && <Text style={styles.loadingText}>Yükleniyor...</Text>}

      {report && !loading && (
        <>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{report.current.total_lt}</Text>
              <Text style={styles.statLabel}>Litre</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{report.current.total_revenue} ₺</Text>
              <Text style={styles.statLabel}>Ciro</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{report.current.order_count}</Text>
              <Text style={styles.statLabel}>Sipariş</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>%{report.current.cancellation_rate}</Text>
              <Text style={styles.statLabel}>İptal oranı</Text>
            </View>
          </View>

          <View style={styles.splitRow}>
            <View style={styles.splitCard}>
              <MaterialCommunityIcons name="weather-sunny" size={20} color={theme.primary} />
              <Text style={styles.splitValue}>{report.current.morning_lt} litre</Text>
              <Text style={styles.splitLabel}>Sabah</Text>
            </View>
            <View style={styles.splitCard}>
              <MaterialCommunityIcons name="weather-night" size={20} color={theme.primary} />
              <Text style={styles.splitValue}>{report.current.evening_lt} litre</Text>
              <Text style={styles.splitLabel}>Akşam</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Öneriler</Text>
          {report.advice.map((a, i) => (
            <View key={i} style={styles.adviceCard}>
              <MaterialCommunityIcons name="lightbulb-outline" size={18} color={theme.accent} />
              <Text style={styles.adviceText}>{a}</Text>
            </View>
          ))}

          <Text style={styles.footnote}>
            Bu öneriler geçmiş sipariş verilerine göre kural tabanlı olarak üretiliyor (yapay zeka kullanılmıyor).
          </Text>
        </>
      )}
    </ScrollView>
  );
}

function getStyles(theme) {
  return StyleSheet.create({
    container: { flexGrow: 1, padding: 20, backgroundColor: theme.background },
    disabledContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
      backgroundColor: theme.background,
      gap: 12,
    },
    disabledText: { color: theme.subtext, textAlign: 'center', fontSize: 14, lineHeight: 20 },
    periodRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    periodButton: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.primary,
      borderRadius: 8,
      paddingVertical: 10,
      alignItems: 'center',
    },
    periodButtonActive: { backgroundColor: theme.primary },
    periodText: { color: theme.primary, fontWeight: '600', fontSize: 13 },
    periodTextActive: { color: '#fff', fontWeight: '600', fontSize: 13 },
    loadingText: { color: theme.subtext, textAlign: 'center', marginTop: 20 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
    statCard: {
      flexBasis: '47%',
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      padding: 14,
      alignItems: 'center',
    },
    statValue: { fontSize: 20, fontWeight: '800', color: theme.primary },
    statLabel: { fontSize: 12, color: theme.subtext, marginTop: 4 },
    splitRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    splitCard: {
      flex: 1,
      backgroundColor: theme.primaryLight,
      borderRadius: 10,
      padding: 14,
      alignItems: 'center',
    },
    splitValue: { fontSize: 15, fontWeight: '700', color: theme.text, marginTop: 6 },
    splitLabel: { fontSize: 12, color: theme.subtext, marginTop: 2 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 10 },
    adviceCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
    },
    adviceText: { flex: 1, color: theme.text, fontSize: 13, lineHeight: 18 },
    footnote: { color: theme.subtext, fontSize: 11, marginTop: 8, fontStyle: 'italic' },
  });
}
