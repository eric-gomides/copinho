import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { Bottle } from '../components/Bottle';
import { useAppStore } from '../store/useAppStore';
import { FontSizes, Spacing, Radii } from '../theme/tokens';
import { makeStyles, useTheme } from '../theme/ThemeContext';

const STEPS = [
  { title: 'Oi! Eu sou o Copinho', sub: 'Vou te ajudar a beber 4L de água por dia sem enlouquecer.', pct: 0.15 },
  { title: 'É simples', sub: 'Tu bebe. Aperta o botão. Eu encho. A gente comemora.', pct: 0.55 },
  { title: 'Bora lá?', sub: 'Tenho lembretes espertos, conquistas e até conto café (parcialmente, desculpa).', pct: 1.0 },
];

const useStyles = makeStyles(c => ({
  container: { flex: 1, backgroundColor: c.teal50, paddingHorizontal: Spacing.screenH, paddingBottom: 32 },
  skipRow: { alignItems: 'flex-end' as const, paddingTop: 8, paddingBottom: 4 },
  skipBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  skipText: { fontSize: FontSizes.body, fontWeight: '500' as const, color: c.inkMute },
  bottleArea: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const },
  footer: { gap: 20 },
  title: { fontSize: FontSizes.h1, fontWeight: '700' as const, color: c.teal900, lineHeight: 36, textAlign: 'center' as const },
  subtitle: { fontSize: FontSizes.bodyLg, color: c.inkSoft, textAlign: 'center' as const, lineHeight: 22, marginTop: 10 },
  dots: { flexDirection: 'row' as const, justifyContent: 'center' as const, gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.teal300 },
  dotActive: { width: 22, backgroundColor: c.teal700 },
  cta: {
    height: 56, borderRadius: Radii.button, backgroundColor: c.teal700,
    alignItems: 'center' as const, justifyContent: 'center' as const,
    shadowColor: c.teal700, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  ctaText: { fontSize: FontSizes.xl, fontWeight: '600' as const, color: '#fff' },
}));

export function OnboardingScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const [step, setStep] = useState(0);
  const completeOnboarding = useAppStore(s => s.completeOnboarding);

  const titleOpacity = useSharedValue(1);
  const titleY = useSharedValue(0);

  function advanceStep() {
    if (step < STEPS.length - 1) {
      titleOpacity.value = withTiming(0, { duration: 150 });
      titleY.value = withTiming(12, { duration: 150 });
      setTimeout(() => {
        setStep(s => s + 1);
        titleY.value = withSpring(0, { damping: 18, stiffness: 200 });
        titleOpacity.value = withTiming(1, { duration: 200 });
      }, 160);
    } else {
      completeOnboarding();
    }
  }

  const textStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));

  const s = STEPS[step];

  return (
    <View style={styles.container}>
      <View style={styles.skipRow}>
        <TouchableOpacity onPress={completeOnboarding} style={styles.skipBtn} activeOpacity={0.7}>
          <Text style={styles.skipText}>Pular</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottleArea}>
        <Bottle pct={s.pct} variant="mascot" width={220} height={310} goalMl={4000} currentMl={Math.round(s.pct * 4000)} />
      </View>

      <View style={styles.footer}>
        <Animated.View style={textStyle}>
          <Text style={styles.title}>{s.title}</Text>
          <Text style={styles.subtitle}>{s.sub}</Text>
        </Animated.View>

        <View style={styles.dots}>
          {STEPS.map((_, i) => <View key={i} style={[styles.dot, i === step && styles.dotActive]} />)}
        </View>

        <TouchableOpacity style={styles.cta} onPress={advanceStep} activeOpacity={0.85}>
          <Text style={styles.ctaText}>{step === STEPS.length - 1 ? 'Começar meu dia' : 'Próximo'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
