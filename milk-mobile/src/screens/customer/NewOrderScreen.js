import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAgent } from '../../context/AgentContext';
import { api } from '../../api/client';

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToLabel(mins) {
  const h = Math.floor(mins / 60)
    .toString()
    .padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

// Verilen saat araligi icinde 15 dakikalik secilebilir saat dilimleri uretir
function generateSlots(startStr, endStr) {
  if (!startStr || !endStr) return [];
  const start = timeToMinutes(startStr);
  const end = timeToMinutes(endStr);
  const slots = [];
  for (let m = start; m <= end; m += 15) {
    slots.push(minutesToLabel(m));
  }
  return slots;
}

export default function NewOrderScreen() {
  const { theme } = useTheme();
  const { enabled: agentEnabled } = useAgent();
  const styles = getStyles(theme);

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [session, setSession] = useState('morning');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [quantity, setQuantity] = useState('1');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState(null);

  const loadSettings = useCallback(async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
    } catch (err) {
      console.log('Ayarlar yuklenemedi:', err.message);
    }
  }, []);

  const loadSuggestion = useCallback(async () => {
    if (!agentEnabled) {
      setSuggestion(null);
      return;
    }
    try {
      const data = await api.getCustomerSuggestion();
      setSuggestion(data.has_pattern ? data : null);
    } catch (err) {
      console.log('Oneri yuklenemedi:', err.message);
    }
  }, [agentEnabled]);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
      loadSuggestion();
    }, [loadSettings, loadSuggestion])
  );

  function applySuggestion() {
    if (!suggestion) return;
    setSession(suggestion.session);
    setQuantity(String(suggestion.quantity_lt));
  }

  const slots = useMemo(() => {
    if (!settings) return [];
    return session === 'morning'
      ? generateSlots(settings.morning_start, settings.morning_end)
      : generateSlots(settings.evening_start, settings.evening_end);
  }, [settings, session]);

  useEffect(() => {
    // Seans degisince, o seansin ilk saat dilimini varsayilan sec
    if (slots.length > 0) setSelectedSlot(slots[0]);
  }, [slots]);

  // Secilen tarih + seans icin kesim ani gecti mi? (istemci tarafi ön kontrol,
  // asil dogrulama zaten backend'de yapiliyor)
  const cutoffPassed = useMemo(() => {
    if (!settings) return false;
    const sessionStart = session === 'morning' ? settings.morning_start : settings.evening_start;
    if (!sessionStart) return false;
    const [h, m] = sessionStart.split(':').map(Number);
    const cutoff = new Date(date);
    cutoff.setHours(h, m, 0, 0);
    return new Date() > cutoff;
  }, [settings, session, date]);

  const totalPrice = useMemo(() => {
    const qty = Number(quantity);
    if (!settings?.price_per_lt || !qty) return null;
    return (qty * settings.price_per_lt).toFixed(2);
  }, [quantity, settings]);

  async function handleSubmit() {
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      Alert.alert('Geçersiz miktar', 'Litre miktarı pozitif bir sayı olmalı');
      return;
    }
    if (!selectedSlot) {
      Alert.alert('Saat seç', 'Lütfen bir teslim alma saati seç');
      return;
    }
    setLoading(true);
    try {
      const result = await api.createOrUpdateOrder({
        delivery_date: toIsoDate(date),
        session,
        delivery_time: selectedSlot,
        quantity_lt: qty,
      });
      const priceText = result.total_price ? ` — Toplam: ${result.total_price} ₺` : '';
      Alert.alert(
        'Başarılı',
        `${toIsoDate(date)} ${session === 'morning' ? 'sabah' : 'akşam'} (${selectedSlot}) için ${qty} litre sipariş kaydedildi.${priceText}`
      );
    } catch (err) {
      Alert.alert('Sipariş verilemedi', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {suggestion && (
        <View style={styles.suggestionCard}>
          <MaterialCommunityIcons name="robot-outline" size={20} color={theme.primary} />
          <Text style={styles.suggestionText}>
            Genelde {suggestion.session === 'morning' ? 'sabah' : 'akşam'} {suggestion.quantity_lt} litre
            alıyorsun. Bugün de aynısını hazırlayayım mı?
          </Text>
          <TouchableOpacity style={styles.suggestionButton} onPress={applySuggestion}>
            <Text style={styles.suggestionButtonText}>Uygula</Text>
          </TouchableOpacity>
        </View>
      )}

      {settings?.general_note ? (
        <View style={styles.noteCard}>
          <MaterialCommunityIcons name="bullhorn-outline" size={18} color={theme.primary} />
          <Text style={styles.noteText}>{settings.general_note}</Text>
        </View>
      ) : null}

      <View style={styles.noteCard}>
        <MaterialCommunityIcons name="bottle-tonic-outline" size={18} color={theme.primary} />
        <Text style={styles.noteText}>Lütfen süt şişelerinizi kendiniz getiriniz.</Text>
      </View>

      <Text style={styles.label}>Teslimat tarihi</Text>
      <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
        <Text style={styles.dateText}>{toIsoDate(date)}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          minimumDate={new Date()}
          onChange={(event, selected) => {
            setShowDatePicker(false);
            if (selected) setDate(selected);
          }}
        />
      )}

      <Text style={styles.label}>Sağım</Text>
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

      <Text style={styles.label}>Teslim alma saati</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.slotScroll}>
        {slots.map((slot) => (
          <TouchableOpacity
            key={slot}
            style={[styles.slotChip, selectedSlot === slot && styles.slotChipActive]}
            onPress={() => setSelectedSlot(slot)}
          >
            <Text style={selectedSlot === slot ? styles.slotTextActive : styles.slotText}>{slot}</Text>
          </TouchableOpacity>
        ))}
        {slots.length === 0 && <Text style={styles.emptySlots}>Saat aralığı yükleniyor...</Text>}
      </ScrollView>

      <Text style={styles.label}>Litre</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={quantity}
        onChangeText={setQuantity}
        placeholder="örn. 2"
        placeholderTextColor={theme.subtext}
      />

      {totalPrice && (
        <View style={styles.priceCard}>
          <Text style={styles.priceLabel}>Ödenecek tutar</Text>
          <Text style={styles.priceValue}>{totalPrice} ₺</Text>
        </View>
      )}

      {cutoffPassed && (
        <View style={styles.warningCard}>
          <MaterialCommunityIcons name="alert-outline" size={18} color={theme.danger} />
          <Text style={styles.warningText}>
            Bu seans için sipariş verme süresi geçmiş olabilir, yine de denemek istersen gönder.
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Gönderiliyor...' : 'Siparişi Gönder'}</Text>
      </TouchableOpacity>

      <Text style={styles.hint}>
        Not: Aynı gün + seans için tekrar sipariş girersen miktar güncellenir.
      </Text>
    </ScrollView>
  );
}

function getStyles(theme) {
  return StyleSheet.create({
    container: { flexGrow: 1, padding: 20, backgroundColor: theme.background },
    noteCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      backgroundColor: theme.primaryLight,
      borderRadius: 10,
      padding: 12,
      marginBottom: 16,
    },
    noteText: { flex: 1, color: theme.text, fontSize: 13, lineHeight: 18 },
    suggestionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: theme.primaryLight,
      borderRadius: 10,
      padding: 12,
      marginBottom: 12,
    },
    suggestionText: { flex: 1, color: theme.text, fontSize: 12, lineHeight: 17 },
    suggestionButton: {
      backgroundColor: theme.primary,
      borderRadius: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    suggestionButtonText: { color: '#fff', fontWeight: '600', fontSize: 12 },
    label: { fontSize: 14, color: theme.subtext, marginTop: 16, marginBottom: 6 },
    dateButton: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      padding: 14,
      backgroundColor: theme.card,
    },
    dateText: { fontSize: 16, color: theme.text },
    sessionRow: { flexDirection: 'row', gap: 10 },
    sessionButton: {
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
    sessionButtonActive: { backgroundColor: theme.primary },
    sessionText: { color: theme.primary, fontWeight: '600' },
    sessionTextActive: { color: '#fff', fontWeight: '600' },
    slotScroll: { flexGrow: 0 },
    slotChip: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 20,
      paddingVertical: 8,
      paddingHorizontal: 16,
      marginRight: 8,
      backgroundColor: theme.card,
    },
    slotChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
    slotText: { color: theme.text },
    slotTextActive: { color: '#fff', fontWeight: '600' },
    emptySlots: { color: theme.subtext, fontStyle: 'italic', paddingVertical: 8 },
    input: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      padding: 14,
      fontSize: 16,
      backgroundColor: theme.inputBg,
      color: theme.text,
    },
    priceCard: {
      marginTop: 20,
      backgroundColor: theme.primaryLight,
      borderRadius: 10,
      padding: 16,
      alignItems: 'center',
    },
    priceLabel: { color: theme.subtext, fontSize: 13 },
    priceValue: { color: theme.primary, fontSize: 26, fontWeight: '800', marginTop: 4 },
    warningCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 16,
      padding: 12,
      borderRadius: 8,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.danger,
    },
    warningText: { flex: 1, color: theme.text, fontSize: 12 },
    button: { backgroundColor: theme.primary, borderRadius: 8, padding: 16, marginTop: 24 },
    buttonText: { color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 16 },
    hint: { marginTop: 14, color: theme.subtext, fontSize: 12, lineHeight: 18 },
  });
}
