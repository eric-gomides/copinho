import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { ArrowLeft, Check } from 'lucide-react-native';
import { Bottle } from '../components/Bottle';
import { useAppStore } from '../store/useAppStore';
import {
  BOTTLE_COLORS, BOTTLE_SHAPES, SHADES,
  type BottleColorId, type BottleShapeId,
} from '../theme/colorShades';
import { FontSizes, Spacing, Radii } from '../theme/tokens';
import { makeStyles, useTheme } from '../theme/ThemeContext';
import { playDrop } from '../utils/sounds';

interface PersonalizeScreenProps {
  onBack: () => void;
}

const useStyles = makeStyles(c => ({
  container: { flex: 1, backgroundColor: c.paper },
  content: { paddingBottom: 160 },

  header: {
    flexDirection: 'row' as const, alignItems: 'center' as const,
    paddingHorizontal: Spacing.screenH, paddingTop: 12, paddingBottom: 8, gap: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: c.teal50,
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  headerSub: { fontSize: FontSizes.base, fontWeight: '500' as const, color: c.teal700, letterSpacing: 0.5, textTransform: 'uppercase' as const },
  headerTitle: { fontSize: FontSizes.h2, fontWeight: '600' as const, color: c.ink, lineHeight: 30, marginTop: 2 },

  previewCard: {
    marginHorizontal: Spacing.screenH, marginBottom: 4,
    borderRadius: Radii.lg, backgroundColor: c.white,
    borderWidth: 1, borderColor: c.line, paddingTop: 20, paddingBottom: 8,
    alignItems: 'center' as const, overflow: 'hidden' as const,
  },

  section: { paddingHorizontal: Spacing.screenH, paddingTop: 24 },
  sectionRow: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, marginBottom: 12 },
  sectionLabel: { fontSize: FontSizes.sm, fontWeight: '700' as const, letterSpacing: 1.2, textTransform: 'uppercase' as const, color: c.inkMute },
  sectionSub: { fontSize: FontSizes.base, color: c.inkMute },

  shapeGrid: { flexDirection: 'row' as const, gap: 10 },
  shapeBtn: {
    flex: 1, paddingTop: 14, paddingBottom: 12, paddingHorizontal: 6,
    borderRadius: 18, borderWidth: 2, borderColor: c.line, backgroundColor: c.white,
    alignItems: 'center' as const, position: 'relative' as const,
    // fixed height keeps all three cards identical regardless of content
    height: 148,
    justifyContent: 'flex-end' as const,
  },
  shapeBtnActive: { backgroundColor: c.teal50, borderColor: c.teal500 },
  shapeBtnInner: {
    position: 'absolute' as const, top: 10, left: 0, right: 0,
    height: 100, alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  shapeLabel: { fontSize: 12, fontWeight: '600' as const, color: c.inkSoft, textAlign: 'center' as const },
  shapeLabelActive: { color: c.teal900 },
  checkBadge: {
    position: 'absolute' as const, top: 8, right: 8,
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },

  colorGrid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 12 },
  colorBtn: {
    width: '22%' as any, padding: 6, borderRadius: 18,
    alignItems: 'center' as const, gap: 6,
    borderWidth: 2, borderColor: 'transparent', backgroundColor: 'transparent',
  },
  colorBtnActive: { backgroundColor: '#fff' },
  colorSwatch: { width: '100%' as any, aspectRatio: 1, borderRadius: 14 },
  colorName: { fontSize: 11, fontWeight: '600' as const, color: c.inkMute },

  ctaBtn: {
    marginHorizontal: Spacing.screenH, marginTop: 28,
    height: 56, borderRadius: Radii.button,
    alignItems: 'center' as const, justifyContent: 'center' as const, flexDirection: 'row' as const, gap: 8,
  },
  ctaText: { fontSize: FontSizes.lg, fontWeight: '600' as const, color: '#fff' },
  microText: { textAlign: 'center' as const, fontSize: 12, color: '#8c9997', marginTop: 12, lineHeight: 18 },
}));

export function PersonalizeScreen({ onBack }: PersonalizeScreenProps) {
  const styles = useStyles();
  const { colors } = useTheme();

  const bottleColor = useAppStore(s => s.bottleColor);
  const bottleShape = useAppStore(s => s.bottleShape);
  const setBottleColor = useAppStore(s => s.setBottleColor);
  const setBottleShape = useAppStore(s => s.setBottleShape);
  const pct = useAppStore(s => s.pct());
  const goalMl = useAppStore(s => s.goalMl);
  const currentMl = useAppStore(s => s.currentMl());

  const C = SHADES[bottleColor];
  const activeShapeDef = BOTTLE_SHAPES[bottleShape];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.paper }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={20} color={colors.teal900} strokeWidth={2} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerSub}>PERSONALIZAR</Text>
          <Text style={styles.headerTitle}>Deixa do seu jeito</Text>
        </View>
      </View>

      {/* Live preview */}
      <View style={[styles.previewCard, { borderColor: colors.line }]}>
        {/* radial bg tint */}
        <View style={{ position: 'absolute', inset: 0, borderRadius: Radii.lg, backgroundColor: C.bg50, opacity: 0.5 } as any} />
        <View style={{ position: 'relative' }}>
          <Bottle
            pct={pct}
            variant="mascot"
            color={bottleColor}
            shape={bottleShape}
            width={200}
            height={290}
            goalMl={goalMl}
            currentMl={currentMl}
            showBubbles
          />
        </View>
      </View>

      {/* Shape picker */}
      <View style={styles.section}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>Formato</Text>
          <Text style={styles.sectionSub}>{activeShapeDef.label}</Text>
        </View>
        <View style={styles.shapeGrid}>
          {(Object.keys(BOTTLE_SHAPES) as BottleShapeId[]).map(id => {
            const active = bottleShape === id;
            return (
              <TouchableOpacity
                key={id}
                style={[styles.shapeBtn, active && { ...styles.shapeBtnActive, borderColor: C.waterMid, backgroundColor: C.bg50 }]}
                onPress={() => setBottleShape(id)}
                activeOpacity={0.8}
              >
                <View style={styles.shapeBtnInner}>
                  <Bottle
                    pct={0.6}
                    variant="mascot"
                    color={bottleColor}
                    shape={id}
                    width={58}
                    height={92}
                    goalMl={goalMl}
                    currentMl={goalMl * 0.6}
                    showBubbles={false}
                    showLabel={false}
                  />
                </View>
                <Text style={[styles.shapeLabel, active && { ...styles.shapeLabelActive, color: C.cap }]}>
                  {BOTTLE_SHAPES[id].label}
                </Text>
                {active && (
                  <View style={[styles.checkBadge, { backgroundColor: C.waterMid }]}>
                    <Check size={12} color="#fff" strokeWidth={3.5} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Color picker */}
      <View style={styles.section}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>Cor da água</Text>
          <Text style={styles.sectionSub}>{BOTTLE_COLORS.find(c => c.id === bottleColor)?.name}</Text>
        </View>
        <View style={styles.colorGrid}>
          {BOTTLE_COLORS.map(({ id, name }) => {
            const sh = SHADES[id];
            const active = bottleColor === id;
            return (
              <TouchableOpacity
                key={id}
                style={[
                  styles.colorBtn,
                  active && { ...styles.colorBtnActive, borderColor: sh.waterMid },
                ]}
                onPress={() => { setBottleColor(id); playDrop(); }}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.colorSwatch,
                    {
                      // gradient simulated with backgroundColor + shadow tint
                      backgroundColor: sh.waterMid,
                      shadowColor: sh.waterMid,
                      shadowOffset: { width: 0, height: active ? 6 : 2 },
                      shadowOpacity: active ? 0.45 : 0.15,
                      shadowRadius: active ? 8 : 3,
                      elevation: active ? 6 : 2,
                    },
                  ]}
                >
                  {active && (
                    <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' } as any}>
                      <Check size={22} color="#fff" strokeWidth={3.5} />
                    </View>
                  )}
                </View>
                <Text style={[styles.colorName, active && { color: sh.cap, fontWeight: '700' }]}>{name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={[styles.ctaBtn, { backgroundColor: C.waterMid }]}
        onPress={onBack}
        activeOpacity={0.85}
      >
        <Check size={20} color="#fff" strokeWidth={2.5} />
        <Text style={styles.ctaText}>Pronto, ficou top</Text>
      </TouchableOpacity>
      <Text style={styles.microText}>Mudanças salvam na hora. Sem stress.</Text>
    </ScrollView>
  );
}
