import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../api/client';

const STATUS_LABELS = {
  pending: 'Bekliyor',
  confirmed: 'Onaylandı',
  cancelled: 'İptal edildi',
  delivered: 'Teslim edildi',
};

export default function OrderHistoryScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.getOrders();
      setOrders(data);
    } catch (err) {
      console.log('Siparisler yuklenemedi:', err.message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleCancel(id) {
    try {
      await api.cancelOrder(id);
      load();
    } catch (err) {
      Alert.alert('İptal edilemedi', err.message);
    }
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.id)}
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
        ListEmptyComponent={<Text style={styles.empty}>Henüz sipariş yok</Text>}
        renderItem={({ item }) => {
          const total = item.price_lt_at_order
            ? (Number(item.price_lt_at_order) * Number(item.quantity_lt)).toFixed(2)
            : null;
          return (
            <View style={styles.card}>
              <MaterialCommunityIcons
                name={item.session === 'morning' ? 'weather-sunny' : 'weather-night'}
                size={24}
                color={theme.primary}
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.date}>
                  {item.delivery_date} · {item.delivery_time?.slice(0, 5)}
                </Text>
                <Text style={styles.qty}>
                  {item.quantity_lt} litre {total ? `— ${total} ₺` : ''}
                </Text>
                <Text style={styles.status}>{STATUS_LABELS[item.status] || item.status}</Text>
              </View>
              {item.status === 'pending' && (
                <TouchableOpacity onPress={() => handleCancel(item.id)}>
                  <Text style={styles.cancelLink}>İptal et</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

function getStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: theme.background },
    empty: { color: theme.subtext, fontStyle: 'italic', marginTop: 20 },
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
    date: { fontSize: 15, fontWeight: '700', color: theme.text },
    qty: { fontSize: 14, color: theme.text, marginTop: 2 },
    status: { fontSize: 13, color: theme.subtext, marginTop: 4 },
    cancelLink: { color: theme.danger, fontWeight: '600' },
  });
}
