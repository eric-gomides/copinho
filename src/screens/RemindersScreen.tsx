import React, { useEffect, useCallback, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Alert } from 'react-native';
import { Bell, Plus, Sparkles } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Notifications from 'expo-notifications';
import { useAppStore, Reminder } from '../store/useAppStore';
import { FontSizes, Spacing, Radii } from '../theme/tokens';
import { makeStyles, useTheme } from '../theme/ThemeContext';
import { scheduleReminders } from '../utils/notifications';
import { TimeEditSheet } from '../components/TimeEditSheet';
import { NewReminderSheet } from '../components/NewReminderSheet';

const useStyles = makeStyles(c => ({
  container: { flex: 1, backgroundColor: c.paper },
  content: { paddingBottom: 160 },
  header: { paddingHorizontal: Spacing.screenH, paddingTop: 16, paddingBottom: 12 },
  subtitle: { fontSize: FontSizes.base, fontWeight: '500' as const, color: c.teal700, letterSpacing: 0.5, textTransform: 'uppercase' as const },
  title: { fontSize: FontSizes.h2, fontWeight: '600' as const, color: c.ink, marginTop: 2 },
  banner: { marginHorizontal: Spacing.screenH, marginBottom: 20, borderRadius: Radii.lg, padding: 16, backgroundColor: c.teal700, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 14 },
  bannerIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(247,217,122,0.2)', alignItems: 'center' as const, justifyContent: 'center' as const },
  bannerTitle: { fontSize: FontSizes.bodyLg, fontWeight: '600' as const, color: '#fff' },
  bannerSub: { fontSize: FontSizes.base, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  sectionRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, paddingHorizontal: Spacing.screenH, marginBottom: 10 },
  sectionLabel: { fontSize: FontSizes.sm, fontWeight: '700' as const, letterSpacing: 1.2, textTransform: 'uppercase' as const, color: c.inkMute },
  sectionHint: { fontSize: FontSizes.sm, color: c.inkMute },
  list: { paddingHorizontal: Spacing.screenH, gap: 10 },
  row: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 14, padding: 14, borderRadius: Radii.card, backgroundColor: c.white, borderWidth: 1, borderColor: c.line },
  rowOff: { opacity: 0.55 },
  timePillWrap: { position: 'relative' as const },
  timePill: { width: 60, height: 56, borderRadius: 14, backgroundColor: c.teal50, alignItems: 'center' as const, justifyContent: 'center' as const },
  timePillOff: { backgroundColor: c.paper2 },
  editBadge: {
    position: 'absolute' as const, bottom: -4, right: -4,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: c.teal700, alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  timeHour: { fontSize: FontSizes.bodyLg, fontWeight: '600' as const, color: c.teal900, lineHeight: 18 },
  timeMin: { fontSize: FontSizes.xs, color: c.teal700, lineHeight: 12 },
  timeOff: { color: c.inkMute },
  rowMid: { flex: 1 },
  rowLabelRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6 },
  rowLabel: { fontSize: FontSizes.body, fontWeight: '600' as const, color: c.ink },
  templateBadge: {
    fontSize: 9, fontWeight: '700' as const, letterSpacing: 0.5,
    color: c.teal700, backgroundColor: c.teal50,
    paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5,
    overflow: 'hidden' as const,
  },
  rowMsg: { fontSize: FontSizes.md, color: c.inkMute, marginTop: 1 },
  textOff: { color: c.inkMute },
  toggleTrack: { width: 48, height: 28, borderRadius: 14, backgroundColor: c.line, justifyContent: 'center' as const },
  toggleTrackOn: { backgroundColor: c.teal700 },
  toggleKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },
  addBtn: { marginHorizontal: Spacing.screenH, marginTop: 16, height: 52, borderRadius: Radii.md, borderWidth: 1.5, borderColor: c.teal300, borderStyle: 'dashed' as const, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 8 },
  addBtnText: { fontSize: FontSizes.body, fontWeight: '600' as const, color: c.teal700 },
  footer: { marginHorizontal: Spacing.screenH, marginTop: 14, padding: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: c.paper2, flexDirection: 'row' as const, gap: 8, alignItems: 'flex-start' as const },
  footerText: { fontSize: 12, color: c.inkMute, lineHeight: 18, flex: 1 },
}));

export function RemindersScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const reminders = useAppStore(s => s.reminders);
  const notificationsEnabled = useAppStore(s => s.notificationsEnabled);
  const toggleReminder = useAppStore(s => s.toggleReminder);
  const updateReminder = useAppStore(s => s.updateReminder);
  const addReminders = useAppStore(s => s.addReminders);
  const removeReminder = useAppStore(s => s.removeReminder);
  const setNotificationsEnabled = useAppStore(s => s.setNotificationsEnabled);
  const reminderCreatePreset = useAppStore(s => s.reminderCreatePreset);
  const setReminderCreatePreset = useAppStore(s => s.setReminderCreatePreset);

  const activeCount = reminders.filter(r => r.on).length;

  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [createPresetTime, setCreatePresetTime] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (reminderCreatePreset) {
      setCreatePresetTime(reminderCreatePreset);
      setCreating(true);
      setReminderCreatePreset(null);
    }
  }, [reminderCreatePreset]);

  const scheduleAll = useCallback((rems: Reminder[]) => scheduleReminders(rems), []);

  async function handleMasterToggle() {
    if (!notificationsEnabled) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Ative nas configurações do celular.');
        return;
      }
      setNotificationsEnabled(true);
      await scheduleAll(reminders);
    } else {
      setNotificationsEnabled(false);
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
  }

  async function handleToggle(id: number) {
    toggleReminder(id);
    setTimeout(async () => {
      const updated = useAppStore.getState().reminders;
      if (useAppStore.getState().notificationsEnabled) await scheduleAll(updated);
    }, 50);
  }

  async function handleSave(id: number, patch: { time: string; msg: string }) {
    updateReminder(id, patch);
    setTimeout(async () => {
      const updated = useAppStore.getState().reminders;
      if (useAppStore.getState().notificationsEnabled) await scheduleAll(updated);
    }, 50);
  }

  async function handleRemove(id: number) {
    removeReminder(id);
    setTimeout(async () => {
      const updated = useAppStore.getState().reminders;
      if (useAppStore.getState().notificationsEnabled) await scheduleAll(updated);
    }, 50);
  }

  async function handleAdd(list: Omit<Reminder, 'id'>[], replace: boolean) {
    addReminders(list, replace);
    setCreating(false);
    setCreatePresetTime(undefined);
    setTimeout(async () => {
      const updated = useAppStore.getState().reminders;
      if (useAppStore.getState().notificationsEnabled) await scheduleAll(updated);
    }, 50);
  }

  const editingReminder = reminders.find(r => r.id === editingId) ?? null;

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.subtitle}>LEMBRETES INTELIGENTES</Text>
          <Text style={styles.title}>Quando te cutucar?</Text>
        </View>

        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerIcon}><Bell size={22} color={colors.sun} strokeWidth={2} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Notificações {notificationsEnabled ? 'ativas' : 'desligadas'}</Text>
            <Text style={styles.bannerSub}>{activeCount} horários configurados</Text>
          </View>
          <Toggle value={notificationsEnabled} onChange={handleMasterToggle} styles={styles} />
        </View>

        {/* Section label */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>HORÁRIOS DO DIA</Text>
          <Text style={styles.sectionHint}>toque pra editar</Text>
        </View>

        <View style={styles.list}>
          {reminders.map(r => (
            <ReminderRow
              key={r.id}
              reminder={r}
              disabled={!notificationsEnabled}
              onEdit={() => setEditingId(r.id)}
              onToggle={() => handleToggle(r.id)}
              styles={styles}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.addBtn} activeOpacity={0.7} onPress={() => { setCreatePresetTime(undefined); setCreating(true); }}>
          <Plus size={18} color={colors.teal700} strokeWidth={2} />
          <Text style={styles.addBtnText}>Criar novo horário</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Sparkles size={16} color={colors.inkMute} strokeWidth={2} />
          <Text style={styles.footerText}>Seus horários ficam salvos no aparelho. A gente avisa sem ser chato.</Text>
        </View>
      </ScrollView>

      <TimeEditSheet
        visible={editingId !== null}
        reminder={editingReminder}
        onClose={() => setEditingId(null)}
        onSave={handleSave}
        onRemove={handleRemove}
      />

      <NewReminderSheet
        visible={creating}
        existing={reminders}
        defaultTime={createPresetTime}
        onClose={() => { setCreating(false); setCreatePresetTime(undefined); }}
        onAdd={handleAdd}
      />
    </>
  );
}

function ReminderRow({ reminder, disabled, onEdit, onToggle, styles }: {
  reminder: Reminder; disabled: boolean; onEdit: () => void; onToggle: () => void; styles: any;
}) {
  const isOff = !reminder.on || disabled;
  const [hour, minute] = reminder.time.split(':');
  return (
    <TouchableOpacity style={[styles.row, isOff && styles.rowOff]} activeOpacity={0.7} onPress={onEdit}>
      <View style={styles.timePillWrap}>
        <View style={[styles.timePill, isOff && styles.timePillOff]}>
          <Text style={[styles.timeHour, isOff && styles.timeOff]}>{hour}</Text>
          <Text style={[styles.timeMin, isOff && styles.timeOff]}>:{minute}</Text>
        </View>
        <View style={styles.editBadge}>
          <Text style={{ fontSize: 8, color: '#fff', fontWeight: '700' }}>✎</Text>
        </View>
      </View>
      <View style={styles.rowMid}>
        <View style={styles.rowLabelRow}>
          <Text style={[styles.rowLabel, isOff && styles.textOff]}>{reminder.label}</Text>
          {reminder.template && <Text style={styles.templateBadge}>TEMPLATE</Text>}
        </View>
        <Text style={[styles.rowMsg, isOff && styles.textOff]}>{reminder.msg}</Text>
      </View>
      <Toggle value={reminder.on && !disabled} onChange={onToggle} styles={styles} />
    </TouchableOpacity>
  );
}

function Toggle({ value, onChange, styles }: { value: boolean; onChange: () => void; styles: any }) {
  const translateX = useSharedValue(value ? 20 : 2);
  useEffect(() => {
    translateX.value = withSpring(value ? 20 : 2, { damping: 15, stiffness: 200 });
  }, [value]);
  const knobStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onChange} style={[styles.toggleTrack, value && styles.toggleTrackOn]}>
      <Animated.View style={[styles.toggleKnob, knobStyle]} />
    </TouchableOpacity>
  );
}
