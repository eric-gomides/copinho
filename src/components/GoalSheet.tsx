import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, Easing } from 'react-native-reanimated';
import { X, Minus, Plus, Zap } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { useAppStore } from '../store/useAppStore';
import { Radii, FontSizes, Spacing } from '../theme/tokens';
import { makeStyles, useTheme } from '../theme/ThemeContext';

interface GoalSheetProps {
  visible: boolean;
  onClose: () => void;
}

const MIN = 1500;
const MAX = 6000;
const STEP = 100;

const PRESETS = [
  { ml: 2000, label: '2L',   sub: 'Mínimo OMS' },
  { ml: 2500, label: '2.5L', sub: 'Padrão' },
  { ml: 3000, label: '3L',   sub: 'Ativo' },
  { ml: 4000, label: '4L',   sub: 'Atleta' },
  { ml: 5000, label: '5L',   sub: 'Boss mode' },
];

const useStyles = makeStyles(c => ({
  overlay: { flex: 1, justifyContent: 'flex-end' as const },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,30,28,0.55)' },
  sheet: {
    backgroundColor: c.paper, borderTopLeftRadius: Radii.sheet, borderTopRightRadius: Radii.sheet,
    paddingHorizontal: Spacing.screenH, paddingBottom: 32, paddingTop: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: -20 }, shadowOpacity: 0.25, shadowRadius: 30, elevation: 20,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: c.line, alignSelf: 'center' as const, marginBottom: 16 },
  titleRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'flex-start' as const, marginBottom: 16 },
  titleText: { fontSize: FontSizes.h3, fontWeight: '600' as const, color: c.ink },
  titleSub: { fontSize: 13, color: c.inkMute, marginTop: 2 },
  closeBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: c.paper2, alignItems: 'center' as const, justifyContent: 'center' as const, marginTop: 2 },
  display: {
    backgroundColor: c.teal50, borderRadius: 24, padding: 22,
    alignItems: 'center' as const, marginBottom: 16,
  },
  displayLabel: { fontSize: FontSizes.base, fontWeight: '700' as const, color: c.teal700, letterSpacing: 1, textTransform: 'uppercase' as const, marginBottom: 4 },
  displayValueRow: { flexDirection: 'row' as const, alignItems: 'flex-end' as const },
  displayValue: { fontSize: 64, fontWeight: '700' as const, color: c.teal900, lineHeight: 72 },
  displayUnit: { fontSize: 24, fontWeight: '600' as const, color: c.teal700, marginBottom: 10, marginLeft: 4 },
  displaySub: { fontSize: 13, color: c.inkSoft, marginTop: 4 },
  sliderRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, marginTop: 14, width: '100%' as const },
  stepBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: c.white, alignItems: 'center' as const, justifyContent: 'center' as const },
  sliderLimits: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, width: '100%' as const, marginTop: 4, paddingHorizontal: 44 },
  sliderLimit: { fontSize: FontSizes.sm, fontWeight: '600' as const, color: c.teal700, opacity: 0.7 },
  presetsLabel: { fontSize: FontSizes.sm, fontWeight: '700' as const, letterSpacing: 1.2, textTransform: 'uppercase' as const, color: c.inkMute, marginBottom: 10 },
  presetsRow: { flexDirection: 'row' as const, gap: 6, marginBottom: 16 },
  presetBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: c.line, backgroundColor: c.white, alignItems: 'center' as const },
  presetBtnActive: { borderColor: c.teal700, backgroundColor: c.teal700 },
  presetLabel: { fontSize: 15, fontWeight: '700' as const, color: c.ink },
  presetLabelActive: { color: '#fff' },
  presetSub: { fontSize: 9, fontWeight: '500' as const, color: c.inkMute, marginTop: 1 },
  presetSubActive: { color: 'rgba(255,255,255,0.8)' },
  contextCard: {
    padding: 12, paddingHorizontal: 14, borderRadius: 14,
    backgroundColor: c.coralSoft, flexDirection: 'row' as const, gap: 10, alignItems: 'flex-start' as const, marginBottom: 16,
  },
  contextTitle: { fontSize: 13, fontWeight: '600' as const, color: c.ink },
  contextSub: { fontSize: 12, color: c.inkMute, marginTop: 2 },
  btnRow: { flexDirection: 'row' as const, gap: 10 },
  cancelBtn: { flex: 1, height: 56, borderRadius: Radii.button, backgroundColor: c.paper2, alignItems: 'center' as const, justifyContent: 'center' as const },
  cancelText: { fontSize: FontSizes.bodyLg, fontWeight: '600' as const, color: c.ink },
  saveBtn: {
    flex: 2, height: 56, borderRadius: Radii.button, backgroundColor: c.teal700,
    alignItems: 'center' as const, justifyContent: 'center' as const,
    shadowColor: c.teal700, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  saveText: { fontSize: FontSizes.lg, fontWeight: '600' as const, color: '#fff' },
}));

export function GoalSheet({ visible, onClose }: GoalSheetProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const storeGoalMl = useAppStore(s => s.goalMl);
  const currentMl = useAppStore(s => s.currentMl());
  const setGoalMl = useAppStore(s => s.setGoalMl);
  const [g, setG] = useState(storeGoalMl);

  // Reset to current store value when sheet opens
  React.useEffect(() => { if (visible) setG(storeGoalMl); }, [visible, storeGoalMl]);

  const translateY = useSharedValue(600);
  const backdropOpacity = useSharedValue(0);

  React.useEffect(() => {
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

  const lStr = (v: number) => {
    const l = v / 1000;
    return Number.isInteger(l) ? `${l}` : l.toFixed(1);
  };

  const contextCopy = g <= 2000 ? 'Pé no chão. Dá pra fazer no automático.'
    : g <= 3000 ? 'Boa meta pro dia a dia.'
    : g <= 4000 ? 'Vai precisar planejar, mas dá.'
    : 'Tem que beber tipo um peixe.';

  const wouldHave = currentMl >= g;
  const contextDetail = wouldHave
    ? `Você já bateria essa meta hoje (${lStr(currentMl)}L).`
    : `Hoje você está em ${lStr(currentMl)}L. Faltariam ${lStr(Math.max(0, g - currentMl))}L.`;

  const cupsNeeded = Math.ceil(g / 300);

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.sheet, sheetStyle]}>
          <View style={styles.handle} />

          <View style={styles.titleRow}>
            <View>
              <Text style={styles.titleText}>Sua meta diária</Text>
              <Text style={styles.titleSub}>Quanto de água por dia?</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <X size={18} color={colors.inkMute} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Big display */}
          <View style={styles.display}>
            <Text style={styles.displayLabel}>META</Text>
            <View style={styles.displayValueRow}>
              <Text style={styles.displayValue}>{lStr(g)}</Text>
              <Text style={styles.displayUnit}>L</Text>
            </View>
            <Text style={styles.displaySub}>≈ {cupsNeeded} copos de 300ml</Text>

            <View style={styles.sliderRow}>
              <TouchableOpacity style={styles.stepBtn} onPress={() => setG(v => Math.max(MIN, v - STEP))} activeOpacity={0.7}>
                <Minus size={18} color={colors.teal700} strokeWidth={2.5} />
              </TouchableOpacity>
              <Slider
                style={{ flex: 1 }}
                minimumValue={MIN} maximumValue={MAX} step={STEP} value={g}
                onValueChange={setG}
                minimumTrackTintColor={colors.teal700}
                maximumTrackTintColor={colors.teal100}
                thumbTintColor={colors.teal700}
              />
              <TouchableOpacity style={styles.stepBtn} onPress={() => setG(v => Math.min(MAX, v + STEP))} activeOpacity={0.7}>
                <Plus size={18} color={colors.teal700} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
            <View style={styles.sliderLimits}>
              <Text style={styles.sliderLimit}>1.5L</Text>
              <Text style={styles.sliderLimit}>6L</Text>
            </View>
          </View>

          {/* Presets */}
          <Text style={styles.presetsLabel}>Atalhos populares</Text>
          <View style={styles.presetsRow}>
            {PRESETS.map(p => {
              const active = g === p.ml;
              return (
                <TouchableOpacity
                  key={p.ml}
                  style={[styles.presetBtn, active && styles.presetBtnActive]}
                  onPress={() => setG(p.ml)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.presetLabel, active && styles.presetLabelActive]}>{p.label}</Text>
                  <Text style={[styles.presetSub, active && styles.presetSubActive]}>{p.sub}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Contextual copy */}
          <View style={styles.contextCard}>
            <Zap size={18} color={colors.coral} strokeWidth={2.4} style={{ marginTop: 1 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.contextTitle}>{contextCopy}</Text>
              <Text style={styles.contextSub}>{contextDetail}</Text>
            </View>
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.75}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => { setGoalMl(g); onClose(); }}
              activeOpacity={0.85}
            >
              <Text style={styles.saveText}>Salvar meta</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
