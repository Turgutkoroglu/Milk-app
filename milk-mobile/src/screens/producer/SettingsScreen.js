import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform, Switch } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useAgent } from '../../context/AgentContext';
import { api } from '../../api/client';

const MODES = [
  { key: 'system', label: 'Cihaza göre', icon: 'theme-light-dark' },
  { key: 'light', label: 'Gündüz', icon: 'weather-sunny' },
  { key: 'dark', label: 'Gece', icon: 'weather-night' },
];

// "HH:MM:SS" ya da "HH:MM" -> Date objesi (sadece saat/dakika onemli)
function timeStrToDate(str) {
  const [h, m] = (str || '07:00').split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}
function dateToTimeStr(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function TimeField({ label, value, onChange, theme, styles }) {
  const [show, setShow] = useState(false);
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.timeLabel}>{label}</Text>
      <TouchableOpacity style={styles.timeButton} onPress={() => setShow(true)}>
        <Text style={styles.timeText}>{dateToTimeStr(value)}</Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={value}
          mode="time"
          is24Hour
          onChange={(event, selected) => {
            setShow(Platform.OS === 'ios');
            if (selected) onChange(selected);
          }}
        />
      )}
    </View>
  );
}

export default function SettingsScreen() {
  const { logout } = useAuth();
  const { theme, mode, setThemeMode } = useTheme();
  const { enabled: agentEnabled, setAgentEnabled } = useAgent();
  const styles = getStyles(theme);

  const [capacity, setCapacity] = useState('');
  const [morningStart, setMorningStart] = useState(timeStrToDate('07:00'));
  const [morningEnd, setMorningEnd] = useState(timeStrToDate('08:00'));
  const [eveningStart, setEveningStart] = useState(timeStrToDate('19:00'));
  const [eveningEnd, setEveningEnd] = useState(timeStrToDate('20:00'));
  const [price, setPrice] = useState('');
  const [iban, setIban] = useState('');
  const [generalNote, setGeneralNote] = useState('');
  const [loading, setLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  async function handleChangePassword() {
    if (!currentPassword || !newPassword) {
      Alert.alert('Eksik bilgi', 'Mevcut ve yeni şifreyi gir');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Şifreler uyuşmuyor', 'Yeni şifre ile tekrar aynı olmalı');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Çok kısa', 'Yeni şifre en az 6 karakter olmalı');
      return;
    }
    setSavingPassword(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      Alert.alert('Başarılı', 'Şifren güncellendi');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      Alert.alert('Değiştirilemedi', err.message);
    } finally {
      setSavingPassword(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getSettings();
        if (data) {
          setCapacity(data.daily_capacity_lt ? String(data.daily_capacity_lt) : '');
          setMorningStart(timeStrToDate(data.morning_start));
          setMorningEnd(timeStrToDate(data.morning_end));
          setEveningStart(timeStrToDate(data.evening_start));
          setEveningEnd(timeStrToDate(data.evening_end));
          setPrice(data.price_per_lt ? String(data.price_per_lt) : '');
          setIban(data.iban || '');
          setGeneralNote(data.general_note || '');
        }
      } catch (err) {
        console.log('Ayarlar yuklenemedi:', err.message);
      }
    })();
  }, []);

  async function handleSave() {
    setLoading(true);
    try {
      await api.updateSettings({
        daily_capacity_lt: capacity ? Number(capacity) : null,
        morning_start: dateToTimeStr(morningStart),
        morning_end: dateToTimeStr(morningEnd),
        evening_start: dateToTimeStr(eveningStart),
        evening_end: dateToTimeStr(eveningEnd),
        price_per_lt: price ? Number(price) : null,
        iban: iban || null,
        general_note: generalNote || null,
      });
      Alert.alert('Kaydedildi', 'Ayarların güncellendi, müşterilere bildirim gönderildi');
    } catch (err) {
      Alert.alert('Kaydedilemedi', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>Sabah sağımı</Text>
      <View style={styles.timeRow}>
        <TimeField label="Başlangıç" value={morningStart} onChange={setMorningStart} theme={theme} styles={styles} />
        <TimeField label="Bitiş" value={morningEnd} onChange={setMorningEnd} theme={theme} styles={styles} />
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Akşam sağımı</Text>
      <View style={styles.timeRow}>
        <TimeField label="Başlangıç" value={eveningStart} onChange={setEveningStart} theme={theme} styles={styles} />
        <TimeField label="Bitiş" value={eveningEnd} onChange={setEveningEnd} theme={theme} styles={styles} />
      </View>
      <Text style={styles.hint}>
        Müşteriler her seans için, o seansın başlangıç saatine kadar sipariş verebilir/değiştirebilir.
      </Text>

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Kapasite ve fiyat</Text>
      <Text style={styles.label}>Günlük kapasite (litre, boş = sınırsız)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={capacity} onChangeText={setCapacity} placeholderTextColor={theme.subtext} />

      <Text style={styles.label}>Litre fiyatı (₺)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={price} onChangeText={setPrice} placeholderTextColor={theme.subtext} />

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>İletişim ve notlar</Text>
      <Text style={styles.label}>IBAN (opsiyonel)</Text>
      <TextInput
        style={styles.input}
        value={iban}
        onChangeText={setIban}
        placeholder="TR.. .. ...."
        placeholderTextColor={theme.subtext}
        autoCapitalize="characters"
      />

      <Text style={styles.label}>Genel not (müşterilere gösterilir, örn. "Şişelerinizi kendiniz getiriniz")</Text>
      <TextInput
        style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
        value={generalNote}
        onChangeText={setGeneralNote}
        multiline
        placeholderTextColor={theme.subtext}
      />

      <TouchableOpacity style={styles.button} onPress={handleSave} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Kaydediliyor...' : 'Kaydet'}</Text>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Agent (Rapor ve öneriler)</Text>
      <View style={styles.agentRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.agentTitle}>Raporlama asistanı</Text>
          <Text style={styles.agentDesc}>
            Açıksa "Rapor" sekmesinde geçmiş verilere dayalı özet ve öneriler görürsün.
          </Text>
        </View>
        <Switch
          value={agentEnabled}
          onValueChange={setAgentEnabled}
          trackColor={{ false: theme.border, true: theme.primary }}
        />
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Görünüm</Text>
      <View style={styles.modeRow}>
        {MODES.map((m) => (
          <TouchableOpacity
            key={m.key}
            style={[styles.modeButton, mode === m.key && styles.modeButtonActive]}
            onPress={() => setThemeMode(m.key)}
          >
            <MaterialCommunityIcons name={m.icon} size={18} color={mode === m.key ? '#fff' : theme.primary} />
            <Text style={mode === m.key ? styles.modeTextActive : styles.modeText}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Çıkış yap</Text>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Şifre değiştir</Text>
      <TextInput
        style={styles.input}
        placeholder="Mevcut şifre"
        placeholderTextColor={theme.subtext}
        secureTextEntry
        value={currentPassword}
        onChangeText={setCurrentPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Yeni şifre"
        placeholderTextColor={theme.subtext}
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <TextInput
        style={[styles.input, { marginBottom: 0 }]}
        placeholder="Yeni şifre (tekrar)"
        placeholderTextColor={theme.subtext}
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <TouchableOpacity style={styles.button} onPress={handleChangePassword} disabled={savingPassword}>
        <Text style={styles.buttonText}>
          {savingPassword ? 'Kaydediliyor...' : 'Şifreyi Güncelle'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function getStyles(theme) {
  return StyleSheet.create({
    container: { flexGrow: 1, padding: 20, backgroundColor: theme.background },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: theme.text },
    timeRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
    timeLabel: { fontSize: 12, color: theme.subtext, marginBottom: 6 },
    timeButton: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      padding: 14,
      backgroundColor: theme.card,
    },
    timeText: { fontSize: 16, color: theme.text, textAlign: 'center' },
    hint: { fontSize: 12, color: theme.subtext, marginTop: 10, lineHeight: 17 },
    agentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      padding: 14,
    },
    agentTitle: { fontSize: 14, fontWeight: '700', color: theme.text },
    agentDesc: { fontSize: 12, color: theme.subtext, marginTop: 4, lineHeight: 16 },
    label: { fontSize: 14, color: theme.subtext, marginTop: 14, marginBottom: 6 },
    input: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      padding: 14,
      fontSize: 16,
      backgroundColor: theme.inputBg,
      color: theme.text,
    },
    button: { backgroundColor: theme.primary, borderRadius: 8, padding: 16, marginTop: 24 },
    buttonText: { color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 16 },
    modeRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
    modeButton: {
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
    modeButtonActive: { backgroundColor: theme.primary },
    modeText: { color: theme.primary, fontSize: 12, fontWeight: '600' },
    modeTextActive: { color: '#fff', fontSize: 12, fontWeight: '600' },
    logoutButton: { marginTop: 24, marginBottom: 20, padding: 12, borderWidth: 1, borderColor: theme.danger, borderRadius: 8 },
    logoutText: { color: theme.danger, textAlign: 'center', fontWeight: '600' },
  });
}
