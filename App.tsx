import 'react-native-gesture-handler';
import React, { useEffect, useState, Component } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  SpaceGrotesk_400Regular, SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  Inter_400Regular, Inter_500Medium,
  Inter_600SemiBold, Inter_700Bold,
} from '@expo-google-fonts/inter';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing,
} from 'react-native-reanimated';

import * as Notifications from 'expo-notifications';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { HomeScreen }       from './src/screens/HomeScreen';
import { HistoryScreen }    from './src/screens/HistoryScreen';
import { BadgesScreen }     from './src/screens/BadgesScreen';
import { RemindersScreen }  from './src/screens/RemindersScreen';
import { RecapScreen }      from './src/screens/RecapScreen';
import { AddSheet }         from './src/components/AddSheet';
import { BottomNav }        from './src/components/BottomNav';
import { GoalSheet }         from './src/components/GoalSheet';
import { PersonalizeScreen } from './src/screens/PersonalizeScreen';
import { useAppStore, Screen } from './src/store/useAppStore';
import { Colors, FontSizes }    from './src/theme/tokens';
import { SHADES }               from './src/theme/colorShades';
import { initHealthConnect } from './src/utils/healthConnect';
import { prewarm }           from './src/utils/sounds';
import { setupNotificationHandler, rescheduleOnStartup } from './src/utils/notifications';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { useBoolean }           from './src/hooks/useBoolean';

// Configura o handler de notificações uma vez, antes de qualquer componente montar
setupNotificationHandler();

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [showAddSheet, openAddSheet, closeAddSheet] = useBoolean(false);
  const [showGoalSheet, openGoalSheet, closeGoalSheet] = useBoolean(false);
  const hasOnboarded         = useAppStore(s => s.hasOnboarded);
  const showCelebration      = useAppStore(s => s.showCelebration);
  const dismissCelebration   = useAppStore(s => s.dismissCelebration);
  const notificationsEnabled = useAppStore(s => s.notificationsEnabled);
  const reminders            = useAppStore(s => s.reminders);

  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular, SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold,
    Inter_400Regular, Inter_500Medium,
    Inter_600SemiBold, Inter_700Bold,
  });

  useEffect(() => {
    // Pre-warm sound synthesis (generates WAV once in background)
    prewarm();
    // Reagenda lembretes + recap ao abrir — idempotente, garante consistência
    rescheduleOnStartup(notificationsEnabled, reminders).catch(() => {});
    // Initialize Health Connect only — permissions requested lazily on first drink
    const timer = setTimeout(() => {
      initHealthConnect().catch(() => {});
    }, 3000); // delay until Activity is fully ready
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (showCelebration) {
      const t = setTimeout(dismissCelebration, 3500);
      return () => clearTimeout(t);
    }
  }, [showCelebration]);

  if (!fontsLoaded) {
    return <View style={{ flex: 1 }} />;
  }

  return (
    <ErrorBoundary>
    <ThemeProvider>
      <AppShell
        screen={screen} setScreen={setScreen}
        showAddSheet={showAddSheet} openAddSheet={openAddSheet} closeAddSheet={closeAddSheet}
        showGoalSheet={showGoalSheet} openGoalSheet={openGoalSheet} closeGoalSheet={closeGoalSheet}
        showCelebration={showCelebration}
        hasOnboarded={hasOnboarded}
      />

    </ThemeProvider>
    </ErrorBoundary>
  );
}

function AppShell({ screen, setScreen, showAddSheet, openAddSheet, closeAddSheet, showGoalSheet, openGoalSheet, closeGoalSheet, showCelebration, hasOnboarded }: {
  screen: Screen; setScreen: (s: Screen) => void;
  showAddSheet: boolean; openAddSheet: () => void; closeAddSheet: () => void;
  showGoalSheet: boolean; openGoalSheet: () => void; closeGoalSheet: () => void;
  showCelebration: boolean; hasOnboarded: boolean;
}) {
  const { colors, isDark } = useTheme();
  const bottleColor = useAppStore(s => s.bottleColor);
  const topBg = SHADES[bottleColor]?.bg50 ?? colors.teal50;
  const showOnboarding = !hasOnboarded;

  // Navigate to recap when user taps the 23h notification
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      if (response.notification.request.content.data?.type === 'recap') {
        setScreen('recap');
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.paper }}>
      <SafeAreaProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />

        {showOnboarding ? (
          <SafeAreaView style={{ flex: 1, backgroundColor: colors.teal50 }} edges={['top', 'bottom']}>
            <OnboardingScreen />
          </SafeAreaView>
        ) : (
          <>
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 340, backgroundColor: topBg, opacity: 0.8 }} />
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
              {screen === 'home'        && <HomeScreen onOpenAddSheet={openAddSheet} onGoToBadges={() => setScreen('badges')} onEditGoal={openGoalSheet} onPersonalize={() => setScreen('personalize')} onGoToRecap={() => setScreen('recap')} />}
              {screen === 'history'    && <HistoryScreen onGoToReminders={() => setScreen('reminders')} />}
              {screen === 'badges'     && <BadgesScreen />}
              {screen === 'reminders'  && <RemindersScreen />}
              {screen === 'personalize'&& <PersonalizeScreen onBack={() => setScreen('home')} />}
              {screen === 'recap'      && <RecapScreen onClose={() => setScreen('home')} />}
            </SafeAreaView>
            {screen !== 'recap' && <BottomNav current={screen} onNav={setScreen} onAdd={openAddSheet} />}
            <AddSheet visible={showAddSheet} onClose={closeAddSheet} />
            <GoalSheet visible={showGoalSheet} onClose={closeGoalSheet} />
          </>
        )}

        {showCelebration && <CelebrationOverlay onViewRecap={() => { useAppStore.getState().dismissCelebration(); setScreen('recap'); }} />}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// ─── Error Boundary (debug) ───────────────────────────────

class ErrorBoundary extends Component<{ children: React.ReactNode }, { error: string | null }> {
  state = { error: null };
  static getDerivedStateFromError(e: Error) { return { error: e.message + '\n' + e.stack?.slice(0, 400) }; }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, padding: 20, paddingTop: 60, backgroundColor: '#fff' }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'red', marginBottom: 12 }}>CRASH</Text>
          <Text style={{ fontSize: 11, color: '#333', fontFamily: 'monospace' }}>{this.state.error}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

// ─── Celebration overlay ──────────────────────────────────

function CelebrationOverlay({ onViewRecap }: { onViewRecap: () => void }) {
  const goalMl = useAppStore(s => s.goalMl);
  const goalLabel = goalMl % 1000 === 0
    ? `${goalMl / 1000}L`
    : `${(goalMl / 1000).toFixed(1)}L`;

  const opacity = useSharedValue(0);
  const scale   = useSharedValue(0.82);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 250 });
    scale.value   = withTiming(1, { duration: 450, easing: Easing.bezier(0.34, 1.56, 0.64, 1) });
  }, []);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const cardStyle     = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.celebBackdrop, backdropStyle]} />
      {CONFETTI.map((c, i) => <ConfettiPiece key={i} {...c} />)}
      <Animated.View style={[styles.celebCard, cardStyle]}>
        <Text style={styles.celebEmoji}>🏆</Text>
        <Text style={styles.celebTitle}>META BATIDA!</Text>
        <Text style={styles.celebSub}>{goalLabel} em dia. Brinde pra você 🥂</Text>
        <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)', width: '100%', marginTop: 4 }} />
        <Text
          onPress={onViewRecap}
          style={{ fontSize: FontSizes.body, color: Colors.teal700, fontWeight: '600', paddingVertical: 4 }}
        >
          Ver resumo do dia →
        </Text>
      </Animated.View>
    </View>
  );
}

const CONFETTI_COLORS = [Colors.coral, Colors.sun, Colors.teal500, Colors.mint, Colors.teal300, Colors.coralSoft];
const CONFETTI = Array.from({ length: 28 }, (_, i) => ({
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  x: 2 + (i * 37) % 94,
  delay: (i * 110) % 1000,
  dur: 2000 + (i * 313) % 2800,
  w: 6 + (i % 3) * 3,
  h: 10 + (i % 4) * 4,
}));

function ConfettiPiece({ color, x, delay, dur, w, h }: typeof CONFETTI[0]) {
  const translateY = useSharedValue(-60);
  const opacity    = useSharedValue(0);
  const rotate     = useSharedValue(0);

  useEffect(() => {
    const t = setTimeout(() => {
      opacity.value    = withTiming(1, { duration: 150 });
      translateY.value = withTiming(960, { duration: dur, easing: Easing.in(Easing.ease) });
      rotate.value     = withTiming(720, { duration: dur });
    }, delay);
    return () => clearTimeout(t);
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { rotate: `${rotate.value}deg` }],
  }));

  return (
    <Animated.View style={[
      { position: 'absolute', top: 0, left: `${x}%` as any, width: w, height: h, backgroundColor: color, borderRadius: 2 },
      style,
    ]} />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.paper },
  gradientTop: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 340,
    backgroundColor: Colors.teal50, opacity: 0.8,
  },
  safe: { flex: 1 },
  celebBackdrop: { backgroundColor: 'rgba(10,74,71,0.55)' },
  celebCard: {
    position: 'absolute', alignSelf: 'center', top: '30%',
    backgroundColor: Colors.white, borderRadius: 24,
    paddingVertical: 32, paddingHorizontal: 40,
    alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.22, shadowRadius: 40, elevation: 24, minWidth: 260,
  },
  celebEmoji: { fontSize: 56, lineHeight: 68 },
  celebTitle: { fontSize: FontSizes.h3, fontWeight: '700', color: Colors.teal900, letterSpacing: 0.5 },
  celebSub:   { fontSize: FontSizes.body, color: Colors.inkMute, textAlign: 'center' },
});
