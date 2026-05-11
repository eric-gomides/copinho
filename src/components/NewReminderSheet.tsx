import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, Modal, ScrollView,
  StyleSheet, Pressable,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, Easing } from 'react-native-reanimated';
import { X, ChevronUp, ChevronDown, Minus, Plus, Check } from 'lucide-react-native';
import type { Reminder } from '../store/useAppStore';
import { pad } from './TimeEditSheet';
import { Radii, FontSizes, Spacing } from '../theme/tokens';
import { makeStyles, useTheme } from '../theme/ThemeContext';

interface Props {
  visible: boolean;
  existing: Reminder[];
  defaultTime?: string;
  onClose: () => void;
  onAdd: (list: Omit<Reminder, 'id'>[], replace: boolean) => void;
}

type Mode = 'interval' | 'single';

const MSG_PRESETS = ['Hora de hidratar 💧', 'Sem desculpa, bebe', 'Já tá com sede?', 'Garrafa cheia, bora'];

function labelFor(h: number): string {
  if (h < 9)  return 'Manhã cedo';
  if (h < 12) return 'Manhã';
  if (h === 12) return 'Almoço';
  if (h < 15) return 'Início da tarde';
  if (h < 18) return 'Tarde';
  if (h < 20) return 'Fim de tarde';
  return 'Noite';
}

const useStyles = makeStyles(c => ({
  overlay: { flex: 1, justifyContent: 'flex-end' as const },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,30,28,0.55)' },
  sheet: {
    backgroundColor: c.paper,
    borderTopLeftRadius: Radii.sheet, borderTopRightRadius: Radii.sheet,
    paddingHorizontal: Spacing.screenH, paddingBottom: 32, paddingTop: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: -20 },
    shadowOpacity: 0.25, shadowRadius: 30, elevation: 20,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#dde4e2', alignSelf: 'center' as const, marginBottom: 16 },
  titleRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 16 },
  title: { fontSize: FontSizes.h3, fontWeight: '600' as const, color: c.ink },
  closeBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: c.paper2, alignItems: 'center' as const, justifyContent: 'center' as const },
  tabs: { flexDirection: 'row' as const, backgroundColor: c.paper2, borderRadius: 14, padding: 4, marginBottom: 20 },
  tabBtn: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10, alignItems: 'center' as const },
  tabBtnOn: { backgroundColor: c.white },
  tabText: { fontSize: 14, fontWeight: '600' as const, color: c.inkMute },
  tabTextOn: { color: c.teal900 },
  secLabel: {
    fontSize: FontSizes.sm, fontWeight: '700' as const, letterSpacing: 1.2,
    textTransform: 'uppercase' as const, color: c.inkMute, marginBottom: 10,
  },
  chips: { flexDirection: 'row' as const, gap: 6, marginBottom: 20 },
  chip: { flex: 1, paddingVertical: 12, paddingHorizontal: 6, borderRadius: 12, borderWidth: 1.5, borderColor: c.line, backgroundColor: c.white, alignItems: 'center' as const },
  chipOn: { backgroundColor: c.teal700, borderColor: c.teal700 },
  chipText: { fontSize: 12, fontWeight: '600' as const, color: c.ink, textAlign: 'center' as const, lineHeight: 16 },
  chipTextOn: { color: '#fff' },
  hourGrid: { flexDirection: 'row' as const, gap: 10, marginBottom: 18 },
  hourCard: { flex: 1, padding: 12, borderRadius: 14, backgroundColor: c.white, borderWidth: 1, borderColor: c.line },
  hourCardLabel: { fontSize: 11, color: c.inkMute, fontWeight: '600' as const, marginBottom: 6 },
  hourRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
  hourBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: c.paper2, alignItems: 'center' as const, justifyContent: 'center' as const },
  hourVal: { flex: 1, textAlign: 'center' as const, fontSize: 22, fontWeight: '700' as const, color: c.teal900 },
  hourSub: { fontSize: 13, color: c.inkMute },
  preview: { padding: 14, borderRadius: 16, backgroundColor: c.teal50, marginBottom: 16 },
  previewHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 10 },
  previewTitle: { fontSize: 12, fontWeight: '700' as const, letterSpacing: 0.5, textTransform: 'uppercase' as const, color: c.teal700 },
  previewCount: { fontSize: 13, fontWeight: '700' as const, color: c.teal900 },
  previewPills: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 6 },
  previewPill: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: c.white, borderWidth: 1, borderColor: c.teal300 },
  previewPillText: { fontSize: 12, fontWeight: '600' as const, color: c.teal900 },
  previewMore: { paddingVertical: 6, paddingHorizontal: 10 },
  previewMoreText: { fontSize: 12, fontWeight: '600' as const, color: c.inkMute },
  replaceRow: { padding: 12, paddingHorizontal: 14, borderRadius: 14, backgroundColor: c.white, borderWidth: 1, borderColor: c.line, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, marginBottom: 20 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: c.line, alignItems: 'center' as const, justifyContent: 'center' as const },
  checkboxOn: { backgroundColor: c.teal700, borderColor: c.teal700 },
  replaceTitle: { fontSize: 13, fontWeight: '600' as const, color: c.ink },
  replaceSub: { fontSize: 11, color: c.inkMute, marginTop: 2 },
  wheel: {
    backgroundColor: c.teal50, borderRadius: 22, paddingVertical: 22, paddingHorizontal: 18,
    alignItems: 'center' as const, flexDirection: 'row' as const, justifyContent: 'center' as const,
    gap: 16, marginBottom: 20,
  },
  colon: { fontSize: 46, fontWeight: '700' as const, color: c.teal900, opacity: 0.5 },
  spinnerCol: { alignItems: 'center' as const, gap: 4 },
  spinnerBtn: { width: 56, height: 32, borderRadius: 10, alignItems: 'center' as const, justifyContent: 'center' as const },
  spinnerBox: {
    width: 92, height: 76, borderRadius: 16, backgroundColor: c.white,
    borderWidth: 1, borderColor: c.line, alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  spinnerVal: { fontSize: 46, fontWeight: '700' as const, color: c.teal900 },
  inputLabel: {
    fontSize: FontSizes.sm, fontWeight: '700' as const, letterSpacing: 1.2,
    textTransform: 'uppercase' as const, color: c.inkMute, marginBottom: 8,
  },
  input: {
    width: '100%' as const, padding: 14, borderRadius: 14, backgroundColor: c.white,
    borderWidth: 1, borderColor: c.line, fontSize: 15, color: c.ink, marginBottom: 14,
  },
  msgPills: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 6, marginTop: 8, marginBottom: 20 },
  msgPill: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, backgroundColor: c.white, borderWidth: 1, borderColor: c.line },
  msgPillText: { fontSize: 11, color: c.inkSoft },
  submitBtn: {
    height: 56, borderRadius: Radii.button, backgroundColor: c.teal700,
    alignItems: 'center' as const, justifyContent: 'center' as const, marginTop: 4,
  },
  submitText: { fontSize: 16, fontWeight: '600' as const, color: '#fff' },
}));

export function NewReminderSheet({ visible, existing, defaultTime, onClose, onAdd }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();

  const [mode, setMode] = useState<Mode>('interval');

  useEffect(() => {
    if (visible && defaultTime) setMode('single');
    if (!visible) setMode('interval');
  }, [visible]);

  const translateY = useSharedValue(600);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.ease) });
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(600, { duration: 280, easing: Easing.in(Easing.ease) });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.sheet, sheetStyle]}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.handle} />

            <View style={styles.titleRow}>
              <Text style={styles.title}>Criar novo horário</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
                <X size={18} color={colors.inkMute} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {/* Mode tabs */}
            <View style={styles.tabs}>
              {([['interval', 'Por intervalo'], ['single', 'Horário único']] as [Mode, string][]).map(([id, label]) => (
                <TouchableOpacity key={id} style={[styles.tabBtn, mode === id && styles.tabBtnOn]} onPress={() => setMode(id)} activeOpacity={0.7}>
                  <Text style={[styles.tabText, mode === id && styles.tabTextOn]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {mode === 'interval'
              ? <IntervalForm existing={existing} onAdd={onAdd} styles={styles} colors={colors} />
              : <SingleForm defaultTime={defaultTime} onAdd={onAdd} styles={styles} colors={colors} />
            }
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── IntervalForm ──────────────────────────────────────────

function IntervalForm({ existing, onAdd, styles, colors }: { existing: Reminder[]; onAdd: Props['onAdd']; styles: any; colors: any }) {
  const [stepMin, setStepMin] = useState(60);
  const [startH, setStartH] = useState(8);
  const [endH, setEndH] = useState(20);
  const [replace, setReplace] = useState(false);

  const times = useMemo(() => {
    const out: { h: number; m: number }[] = [];
    for (let t = startH * 60; t <= endH * 60; t += stepMin) {
      out.push({ h: Math.floor(t / 60), m: t % 60 });
    }
    return out;
  }, [stepMin, startH, endH]);

  const FREQ = [[60, '1h em 1h'], [90, 'A cada 1h30'], [120, 'A cada 2h'], [180, 'A cada 3h']] as [number, string][];

  function submit() {
    const list = times.map(t => ({
      time: `${pad(t.h)}:${pad(t.m)}`,
      label: labelFor(t.h),
      msg: 'Hora de hidratar 💧',
      on: true,
      template: false,
    }));
    onAdd(list, replace);
  }

  return (
    <>
      <Text style={styles.secLabel}>FREQUÊNCIA</Text>
      <View style={styles.chips}>
        {FREQ.map(([v, label]) => (
          <TouchableOpacity key={v} style={[styles.chip, stepMin === v && styles.chipOn]} onPress={() => setStepMin(v)} activeOpacity={0.7}>
            <Text style={[styles.chipText, stepMin === v && styles.chipTextOn]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.secLabel}>JANELA DO DIA</Text>
      <View style={styles.hourGrid}>
        <HourCard label="Das" hour={startH} onDec={() => setStartH(v => Math.max(0, Math.min(v - 1, endH - 1)))} onInc={() => setStartH(v => Math.min(v + 1, endH - 1))} styles={styles} colors={colors} />
        <HourCard label="Até" hour={endH} onDec={() => setEndH(v => Math.max(startH + 1, v - 1))} onInc={() => setEndH(v => Math.min(23, v + 1))} styles={styles} colors={colors} />
      </View>

      <View style={styles.preview}>
        <View style={styles.previewHeader}>
          <Text style={styles.previewTitle}>PRÉ-VISUALIZAR</Text>
          <Text style={styles.previewCount}>{times.length} horários</Text>
        </View>
        <View style={styles.previewPills}>
          {times.slice(0, 14).map((t, i) => (
            <View key={i} style={styles.previewPill}>
              <Text style={styles.previewPillText}>{pad(t.h)}:{pad(t.m)}</Text>
            </View>
          ))}
          {times.length > 14 && (
            <View style={styles.previewMore}>
              <Text style={styles.previewMoreText}>+{times.length - 14}</Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.replaceRow} onPress={() => setReplace(v => !v)} activeOpacity={0.7}>
        <View style={[styles.checkbox, replace && styles.checkboxOn]}>
          {replace && <Check size={14} color="#fff" strokeWidth={3} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.replaceTitle}>Substituir horários atuais</Text>
          <Text style={styles.replaceSub}>Apaga os {existing.length} horários existentes</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.submitBtn} onPress={submit} activeOpacity={0.85}>
        <Text style={styles.submitText}>
          {replace ? `Substituir por ${times.length} horários` : `Adicionar ${times.length} horários`}
        </Text>
      </TouchableOpacity>
    </>
  );
}

function HourCard({ label, hour, onDec, onInc, styles, colors }: { label: string; hour: number; onDec: () => void; onInc: () => void; styles: any; colors: any }) {
  return (
    <View style={styles.hourCard}>
      <Text style={styles.hourCardLabel}>{label}</Text>
      <View style={styles.hourRow}>
        <TouchableOpacity style={styles.hourBtn} onPress={onDec} activeOpacity={0.7}>
          <Minus size={16} color={colors.teal900} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.hourVal}>{pad(hour)}<Text style={styles.hourSub}>:00</Text></Text>
        <TouchableOpacity style={styles.hourBtn} onPress={onInc} activeOpacity={0.7}>
          <Plus size={16} color={colors.teal900} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── SingleForm ────────────────────────────────────────────

function SingleForm({ defaultTime, onAdd, styles, colors }: { defaultTime?: string; onAdd: Props['onAdd']; styles: any; colors: any }) {
  const initH = defaultTime ? parseInt(defaultTime.split(':')[0], 10) : 10;
  const initM = defaultTime ? parseInt(defaultTime.split(':')[1], 10) : 0;
  const [h, setH] = useState(initH);
  const [m, setM] = useState(initM);
  const [label, setLabel] = useState('Lembrete extra');
  const [msg, setMsg] = useState('Hora de hidratar 💧');

  const stepH = (d: number) => setH(v => (v + d + 24) % 24);
  const stepM = (d: number) => setM(v => (v + d + 60) % 60);

  function submit() {
    onAdd([{ time: `${pad(h)}:${pad(m)}`, label, msg, on: true, template: false }], false);
  }

  return (
    <>
      {/* TimeWheel */}
      <View style={styles.wheel}>
        <Spinner value={h} padded onUp={() => stepH(1)} onDown={() => stepH(-1)} styles={styles} colors={colors} />
        <Text style={styles.colon}>:</Text>
        <Spinner value={m} padded onUp={() => stepM(5)} onDown={() => stepM(-5)} styles={styles} colors={colors} />
      </View>

      <Text style={styles.inputLabel}>NOME DO HORÁRIO</Text>
      <TextInput
        style={styles.input}
        value={label}
        onChangeText={setLabel}
        placeholder="ex: Antes do treino"
        placeholderTextColor={colors.inkMute}
      />

      <Text style={styles.inputLabel}>MENSAGEM</Text>
      <TextInput
        style={styles.input}
        value={msg}
        onChangeText={setMsg}
        placeholderTextColor={colors.inkMute}
      />
      <View style={styles.msgPills}>
        {MSG_PRESETS.map(p => (
          <TouchableOpacity key={p} style={styles.msgPill} onPress={() => setMsg(p)} activeOpacity={0.7}>
            <Text style={styles.msgPillText}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.submitBtn} onPress={submit} activeOpacity={0.85}>
        <Text style={styles.submitText}>Criar horário</Text>
      </TouchableOpacity>
    </>
  );
}

function Spinner({ value, padded, onUp, onDown, styles, colors }: {
  value: number; padded?: boolean;
  onUp: () => void; onDown: () => void;
  styles: any; colors: any;
}) {
  return (
    <View style={styles.spinnerCol}>
      <TouchableOpacity style={styles.spinnerBtn} onPress={onUp} activeOpacity={0.7}>
        <ChevronUp size={22} color={colors.teal700} strokeWidth={2.5} />
      </TouchableOpacity>
      <View style={styles.spinnerBox}>
        <Text style={styles.spinnerVal}>{padded ? pad(value) : value}</Text>
      </View>
      <TouchableOpacity style={styles.spinnerBtn} onPress={onDown} activeOpacity={0.7}>
        <ChevronDown size={22} color={colors.teal700} strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
}
