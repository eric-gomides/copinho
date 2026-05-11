import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, Easing } from 'react-native-reanimated';
import { X, Minus, Plus } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { useAppStore, LIQUID_TYPES, LiquidType, LIQUID_MULTIPLIERS } from '../store/useAppStore';
import { Radii, FontSizes, Spacing } from '../theme/tokens';
import { makeStyles, useTheme } from '../theme/ThemeContext';

interface AddSheetProps { visible: boolean; onClose: () => void; }
const QUICK_PRESETS = [200, 500, 1000, 1500];

const useStyles = makeStyles(c => ({
  overlay: { flex: 1, justifyContent: 'flex-end' as const },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,30,28,0.55)' },
  sheet: { backgroundColor: c.paper, borderTopLeftRadius: Radii.sheet, borderTopRightRadius: Radii.sheet, paddingHorizontal: Spacing.screenH, paddingBottom: 36, paddingTop: 12, shadowColor: '#000', shadowOffset: { width: 0, height: -20 }, shadowOpacity: 0.25, shadowRadius: 30, elevation: 20 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: c.line, alignSelf: 'center' as const, marginBottom: 16 },
  titleRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 16 },
  title: { fontSize: FontSizes.h3, fontWeight: '600' as const, color: c.ink },
  closeBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: c.paper2, alignItems: 'center' as const, justifyContent: 'center' as const },
  mlPanel: { backgroundColor: c.teal50, borderRadius: 20, padding: Spacing['4xl'], alignItems: 'center' as const, marginBottom: 20 },
  mlPanelLabel: { fontSize: FontSizes.base, fontWeight: '600' as const, color: c.teal700, letterSpacing: 1, textTransform: 'uppercase' as const, marginBottom: 4 },
  mlValueRow: { flexDirection: 'row' as const, alignItems: 'flex-end' as const, gap: 4 },
  mlValue: { fontSize: FontSizes.display, fontWeight: '700' as const, color: c.teal900, lineHeight: 64 },
  mlUnit: { fontSize: FontSizes.h3, fontWeight: '500' as const, color: c.teal700, marginBottom: 10 },
  mlHint: { fontSize: FontSizes.md, color: c.inkMute, marginTop: 4 },
  sliderRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, marginTop: 16, width: '100%' as const },
  stepBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: c.white, alignItems: 'center' as const, justifyContent: 'center' as const },
  presets: { flexDirection: 'row' as const, gap: 6, marginTop: 10, width: '100%' as const },
  presetBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: c.white, alignItems: 'center' as const },
  presetBtnActive: { backgroundColor: c.teal700 },
  presetText: { fontSize: FontSizes.md, fontWeight: '600' as const, color: c.teal900 },
  presetTextActive: { color: '#fff' },
  typeLabel: { fontSize: FontSizes.sm, fontWeight: '700' as const, letterSpacing: 1.2, textTransform: 'uppercase' as const, color: c.inkMute, marginBottom: 10 },
  typeList: { gap: 8, paddingBottom: 4, paddingRight: Spacing.lg },
  typeChip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1.5, minWidth: 120 },
  typeChipName: { fontSize: FontSizes.body, fontWeight: '600' as const, color: c.ink },
  typeChipHint: { fontSize: FontSizes.sm, color: c.inkMute, marginTop: 1 },
  confirmBtn: { height: 56, borderRadius: Radii.button, backgroundColor: c.teal700, alignItems: 'center' as const, justifyContent: 'center' as const, marginTop: 20, shadowColor: c.teal700, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  confirmText: { fontSize: FontSizes.xl, fontWeight: '600' as const, color: '#fff' },
}));

export function AddSheet({ visible, onClose }: AddSheetProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [ml, setMl] = useState(350);
  const [liquidType, setLiquidType] = useState<LiquidType>('water');
  const addDrink = useAppStore(s => s.addDrink);

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

  const mult = LIQUID_MULTIPLIERS[liquidType];
  const realMl = Math.round(ml * mult);

  function handleConfirm() { addDrink(ml, liquidType); setMl(350); setLiquidType('water'); onClose(); }

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
            <Text style={styles.title}>Registrar gole</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <X size={18} color={colors.inkMute} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View style={styles.mlPanel}>
            <Text style={styles.mlPanelLabel}>QUANTIDADE</Text>
            <View style={styles.mlValueRow}>
              <Text style={styles.mlValue}>{ml}</Text>
              <Text style={styles.mlUnit}>ml</Text>
            </View>
            {mult !== 1 && <Text style={styles.mlHint}>= {realMl}ml de hidratação real</Text>}
            <View style={styles.sliderRow}>
              <TouchableOpacity style={styles.stepBtn} onPress={() => setMl(m => Math.max(50, m - 50))} activeOpacity={0.7}>
                <Minus size={18} color={colors.teal700} strokeWidth={2.5} />
              </TouchableOpacity>
              <Slider
                style={{ flex: 1 }} minimumValue={50} maximumValue={1500} step={50} value={ml}
                onValueChange={setMl} minimumTrackTintColor={colors.teal700}
                maximumTrackTintColor={colors.teal100} thumbTintColor={colors.teal700}
              />
              <TouchableOpacity style={styles.stepBtn} onPress={() => setMl(m => Math.min(1500, m + 50))} activeOpacity={0.7}>
                <Plus size={18} color={colors.teal700} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
            <View style={styles.presets}>
              {QUICK_PRESETS.map(v => (
                <TouchableOpacity key={v} style={[styles.presetBtn, ml === v && styles.presetBtnActive]} onPress={() => setMl(v)} activeOpacity={0.75}>
                  <Text style={[styles.presetText, ml === v && styles.presetTextActive]}>{v >= 1000 ? `${v/1000}L` : `${v}ml`}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text style={styles.typeLabel}>E É O QUÊ?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeList}>
            {LIQUID_TYPES.map(liq => {
              const active = liquidType === liq.id;
              return (
                <TouchableOpacity
                  key={liq.id}
                  style={[styles.typeChip, active ? { backgroundColor: liq.color, borderColor: liq.color } : { backgroundColor: colors.white, borderColor: colors.line }]}
                  onPress={() => setLiquidType(liq.id)} activeOpacity={0.8}
                >
                  <Text style={[styles.typeChipName, active && { color: '#fff' }]}>{liq.label}</Text>
                  <Text style={[styles.typeChipHint, active && { color: 'rgba(255,255,255,0.8)' }]}>{liq.hint}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} activeOpacity={0.85}>
            <Text style={styles.confirmText}>Bebi, registra aí</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}
