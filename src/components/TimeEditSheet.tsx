import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, Easing } from 'react-native-reanimated';
import { X, Bell, ChevronUp, ChevronDown, Trash2 } from 'lucide-react-native';
import type { Reminder } from '../store/useAppStore';
import { Radii, FontSizes, Spacing } from '../theme/tokens';
import { makeStyles, useTheme } from '../theme/ThemeContext';

const REMINDER_TEMPLATES = [
  { label: 'Ao acordar',        msgs: ['300ml antes do café', 'Bom dia, primeiro gole 💧', 'Acorda e hidrata'] },
  { label: 'Meio da manhã',     msgs: ['Hora do refil 💦', 'Vai um copão?', 'Pausa hidratação'] },
  { label: 'Almoço',            msgs: ['Um copão antes de comer', 'Hidrata antes do prato', 'Pré-almoço, beba'] },
  { label: 'Meio da tarde',     msgs: ['Você tá indo bem!', 'Não esquece da água', 'Sono? Bebe água.'] },
  { label: 'Fim de expediente', msgs: ['Recompensa líquida', 'Fechou o dia? Bebe.', 'Última do trabalho'] },
  { label: 'Jantar',            msgs: ['Reta final do dia', 'Hidrata pra dormir bem', 'Último copão sério'] },
];

const QUICK_PRESETS = ['06:30', '08:00', '12:00', '15:00', '18:00', '22:00'];

export function pad(n: number) { return String(n).padStart(2, '0'); }

interface Props {
  visible: boolean;
  reminder: Reminder | null;
  onClose: () => void;
  onSave: (id: number, patch: { time: string; msg: string }) => void;
  onRemove: (id: number) => void;
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
  ctx: { padding: 14, borderRadius: 16, backgroundColor: c.teal50, marginBottom: 16, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12 },
  ctxIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: c.teal700, alignItems: 'center' as const, justifyContent: 'center' as const },
  ctxCaption: { fontSize: 12, fontWeight: '600' as const, color: c.teal700 },
  ctxLabel: { fontSize: 17, fontWeight: '700' as const, color: c.teal900, marginTop: 1 },
  wheel: {
    backgroundColor: c.teal50, borderRadius: 22, paddingVertical: 22, paddingHorizontal: 18,
    alignItems: 'center' as const, flexDirection: 'row' as const, justifyContent: 'center' as const,
    gap: 16, marginBottom: 14,
  },
  colon: { fontSize: 46, fontWeight: '700' as const, color: c.teal900, opacity: 0.5 },
  spinnerCol: { alignItems: 'center' as const, gap: 4 },
  spinnerBtn: { width: 56, height: 32, borderRadius: 10, alignItems: 'center' as const, justifyContent: 'center' as const },
  spinnerBox: {
    width: 92, height: 76, borderRadius: 16, backgroundColor: c.white,
    borderWidth: 1, borderColor: c.line, alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  spinnerVal: { fontSize: 46, fontWeight: '700' as const, color: c.teal900 },
  presetsRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 6, marginBottom: 20 },
  presetBtn: {
    flexBasis: '30%' as const, flexGrow: 1, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, borderColor: c.line,
    backgroundColor: c.white, alignItems: 'center' as const,
  },
  presetBtnOn: { backgroundColor: c.teal700, borderColor: c.teal700 },
  presetText: { fontSize: 13, fontWeight: '600' as const, color: c.teal900 },
  presetTextOn: { color: '#fff' },
  secLabel: {
    fontSize: FontSizes.sm, fontWeight: '700' as const, letterSpacing: 1.2,
    textTransform: 'uppercase' as const, color: c.inkMute, marginBottom: 8,
  },
  msgBtn: { padding: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1.5, borderColor: c.line, backgroundColor: c.white, marginBottom: 6 },
  msgBtnOn: { backgroundColor: c.teal50, borderColor: c.teal500 },
  msgText: { fontSize: 13, color: c.ink },
  footer: { flexDirection: 'row' as const, gap: 8, marginTop: 8 },
  deleteBtn: { width: 56, height: 56, borderRadius: Radii.button, backgroundColor: c.coralSoft, alignItems: 'center' as const, justifyContent: 'center' as const },
  saveBtn: { flex: 1, height: 56, borderRadius: Radii.button, backgroundColor: c.teal700, alignItems: 'center' as const, justifyContent: 'center' as const },
  saveBtnText: { fontSize: 17, fontWeight: '600' as const, color: '#fff' },
}));

export function TimeEditSheet({ visible, reminder, onClose, onSave, onRemove }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();

  const [h, setH] = useState(7);
  const [m, setM] = useState(30);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (reminder) {
      const [rh, rm] = reminder.time.split(':').map(Number);
      setH(rh);
      setM(rm);
      setMsg(reminder.msg);
    }
  }, [reminder?.id]);

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

  if (!visible || !reminder) return null;

  const stepH = (d: number) => setH(v => (v + d + 24) % 24);
  const stepM = (d: number) => setM(v => (v + d + 60) % 60);
  const currentTime = `${pad(h)}:${pad(m)}`;
  const tmpl = REMINDER_TEMPLATES.find(t => t.label === reminder.label);
  const msgPresets = tmpl ? tmpl.msgs : [];

  function handlePreset(t: string) {
    const [ph, pm] = t.split(':').map(Number);
    setH(ph); setM(pm);
  }

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
              <Text style={styles.title}>Editar horário</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
                <X size={18} color={colors.inkMute} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {/* Context card */}
            <View style={styles.ctx}>
              <View style={styles.ctxIcon}>
                <Bell size={20} color="#fff" strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ctxCaption}>
                  {reminder.template ? 'Horário do template' : 'Horário personalizado'}
                </Text>
                <Text style={styles.ctxLabel}>{reminder.label}</Text>
              </View>
            </View>

            {/* TimeWheel */}
            <View style={styles.wheel}>
              <NumberSpinner value={h} padded onUp={() => stepH(1)} onDown={() => stepH(-1)} styles={styles} colors={colors} />
              <Text style={styles.colon}>:</Text>
              <NumberSpinner value={m} padded onUp={() => stepM(5)} onDown={() => stepM(-5)} styles={styles} colors={colors} />
            </View>

            {/* Quick presets */}
            <View style={styles.presetsRow}>
              {QUICK_PRESETS.map(t => {
                const active = currentTime === t;
                return (
                  <TouchableOpacity key={t} style={[styles.presetBtn, active && styles.presetBtnOn]} onPress={() => handlePreset(t)} activeOpacity={0.7}>
                    <Text style={[styles.presetText, active && styles.presetTextOn]}>{t}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Message suggestions (templates only) */}
            {msgPresets.length > 0 && (
              <>
                <Text style={styles.secLabel}>MENSAGEM DA NOTIFICAÇÃO</Text>
                {msgPresets.map(p => (
                  <TouchableOpacity key={p} style={[styles.msgBtn, msg === p && styles.msgBtnOn]} onPress={() => setMsg(p)} activeOpacity={0.7}>
                    <Text style={styles.msgText}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* Footer */}
            <View style={styles.footer}>
              {!reminder.template && (
                <TouchableOpacity style={styles.deleteBtn} onPress={() => { onRemove(reminder.id); onClose(); }} activeOpacity={0.7}>
                  <Trash2 size={20} color={colors.coral} strokeWidth={2} />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.saveBtn} onPress={() => { onSave(reminder.id, { time: currentTime, msg }); onClose(); }} activeOpacity={0.85}>
                <Text style={styles.saveBtnText}>Salvar horário</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function NumberSpinner({ value, padded, onUp, onDown, styles, colors }: {
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
