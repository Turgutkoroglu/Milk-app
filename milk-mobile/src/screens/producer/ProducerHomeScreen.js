import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../api/client';

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

const STATUS_LABELS = {
  pending: 'Bekliyor',
  confirmed: 'Onaylandı',
  cancelled: 'İptal edildi',
  delivered: 'Teslim edildi',
};

export default function ProducerHomeScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const [date, setDate] = useState(new Date());
  const [session, setSession] = useState('morning');
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (targetDate, targetSession) => {
    const iso = toIsoDate(targetDate);
    try {
      const [orderList, summaryData] = await Promise.all([
        api.getOrders(iso, targetSession),
        api.getOrderSummary(iso, targetSession),
      ]);
      setOrders(orderList);
      setSummary(summaryData);
    } catch (err) {
      console.log('Veri yuklenemedi:', err.message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(date, session);
    }, [date, session, load])
  );

  function changeDay(offset) {
    const next = new Date(date);
    next.setDate(next.getDate() + offset);
    setDate(next);
  }

  const overCapacity =
    summary?.daily_capacity_lt && summary.total_lt > Number(summary.daily_capacity_lt);

  async function handleConfirm(id) {
    try {
      await api.confirmOrder(id);
      load(date, session);
    } catch (err) {
      Alert.alert('Onaylanamadı', err.message);
    }
  }

  async function handleComplete(id) {
    try {
      await api.completeOrder(id);
      load(date, session);
    } catch (err) {
      Alert.alert('İşaretlenemedi', err.message);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.dateNav}>
        <TouchableOpacity onPress={() => changeDay(-1)}>
          <Text style={styles.navArrow}>{'‹'}</Text>
        </TouchableOpacity>
        <Text style={styles.dateText}>{toIsoDate(date)}</Text>
        <TouchableOpacity onPress={() => changeDay(1)}>
          <Text style={styles.navArrow}>{'›'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sessionRow}>
        <TouchableOpacity
          style={[styles.sessionButton, session === 'morning' && styles.sessionButtonActive]}
          onPress={() => setSession('morning')}
        >
          <MaterialCommunityIcons
            name="weather-sunny"
            size={18}
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
            size={18}
            color={session === 'evening' ? '#fff' : theme.primary}
          />
          <Text style={session === 'evening' ? styles.sessionTextActive : styles.sessionText}>
            Akşam
          </Text>
        </TouchableOpacity>
      </View>

      {summary && (
        <View style={[styles.summaryCard, overCapacity && styles.summaryCardWarning]}>
          <Text style={styles.summaryTotal}>{summary.total_lt} litre</Text>
          <Text style={styles.summarySub}>
            {summary.order_count} sipariş
            {summary.daily_capacity_lt ? ` · kapasite: ${summary.daily_capacity_lt} litre` : ''}
          </Text>
          {overCapacity && <Text style={styles.warningText}>Kapasite aşıldı</Text>}
        </View>
      )}

      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load(date, session);
              setRefreshing(false);
            }}
          />
        }
        ListEmptyComponent={<Text style={styles.empty}>Bu tarih/seans için sipariş yok</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.customerName}>{item.full_name}</Text>
              <Text style={styles.qty}>
                {item.quantity_lt} litre · {item.delivery_time?.slice(0, 5)}
              </Text>
              <Text style={styles.phone}>{item.phone}</Text>
              <Text
                style={[
                  styles.statusBadge,
                  item.status === 'cancelled' && styles.statusCancelled,
                  item.status === 'confirmed' && styles.statusConfirmed,
                  item.status === 'delivered' && styles.statusDelivered,
                ]}
              >
                {STATUS_LABELS[item.status] || item.status}
              </Text>
            </View>
            {item.status === 'pending' && (
              <TouchableOpacity style={styles.actionButton} onPress={() => handleConfirm(item.id)}>
                <MaterialCommunityIcons name="check" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Onayla</Text>
              </TouchableOpacity>
            )}
            {item.status === 'confirmed' && (
              <TouchableOpacity style={styles.actionButton} onPress={() => handleComplete(item.id)}>
                <MaterialCommunityIcons name="truck-check-outline" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Tamamlandı</Text>
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
    dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    navArrow: { fontSize: 28, color: theme.primary, paddingHorizontal: 24 },
    dateText: { fontSize: 18, fontWeight: '700', color: theme.text },
    sessionRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
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
    summaryCard: {
      backgroundColor: theme.primaryLight,
      borderRadius: 10,
      padding: 16,
      marginBottom: 16,
      alignItems: 'center',
    },
    summaryCardWarning: { backgroundColor: '#fdecea' },
    summaryTotal: { fontSize: 26, fontWeight: '800', color: theme.primary },
    summarySub: { fontSize: 13, color: theme.subtext, marginTop: 4 },
    warningText: { color: theme.danger, fontWeight: '700', marginTop: 6 },
    empty: { color: theme.subtext, fontStyle: 'italic', marginTop: 20, textAlign: 'center' },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.card,
      borderRadius: 8,
      padding: 14,
      marginBottom: 10,
    },
    customerName: { fontSize: 15, fontWeight: '700', color: theme.text },
    qty: { fontSize: 14, color: theme.primary, fontWeight: '600', marginTop: 2 },
    phone: { fontSize: 13, color: theme.subtext, marginTop: 2 },
    statusBadge: { fontSize: 12, color: theme.subtext, marginTop: 6, fontWeight: '600' },
    statusCancelled: { color: theme.danger },
    statusConfirmed: { color: theme.primary },
    statusDelivered: { color: '#2f7d5f' },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.primary,
      borderRadius: 6,
      paddingVertical: 8,
      paddingHorizontal: 10,
    },
    actionButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  });
}
