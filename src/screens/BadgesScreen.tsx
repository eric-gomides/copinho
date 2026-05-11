import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import {
  Flame, Check, Droplets, Trophy, Sun, Leaf, Zap, Moon,
  Calendar, Star, Medal, Waves, Sparkles, Shield, Coffee,
} from 'lucide-react-native';
import { useAppStore, ALL_BADGES, BadgeDef, BadgeIcon } from '../store/useAppStore';
import { FontSizes, Spacing, Radii } from '../theme/tokens';
import { makeStyles, useTheme } from '../theme/ThemeContext';

type Tab = 'daily' | 'weekly' | 'monthly';

const WEEK_LABELS = ['s', 't', 'q', 'q', 's', 's', 'd'];
const MONTH_LABELS = ['j', 'f', 'm', 'a', 'm', 'j', 'j', 'a', 's', 'o', 'n', 'd'];

function iconFor(icon: BadgeIcon, size = 26, color = '#fff') {
  const props = { size, color, strokeWidth: 2.3 };
  switch (icon) {
    case 'drop':     return <Droplets {...props} />;
    case 'trophy':   return <Trophy {...props} />;
    case 'flame':    return <Flame {...props} />;
    case 'sun':      return <Sun {...props} />;
    case 'leaf':     return <Leaf {...props} />;
    case 'bolt':     return <Zap {...props} />;
    case 'moon':     return <Moon {...props} />;
    case 'calendar': return <Calendar {...props} />;
    case 'star':     return <Star {...props} />;
    case 'medal':    return <Medal {...props} />;
    case 'waves':    return <Waves {...props} />;
    case 'sparkle':  return <Sparkles {...props} />;
    case 'shield':   return <Shield {...props} />;
    case 'coffee':   return <Coffee {...props} />;
    default:         return <Droplets {...props} />;
  }
}

const useStyles = makeStyles(c => ({
  container: { flex: 1, backgroundColor: c.paper },
  content: { paddingBottom: 120 },
  header: { paddingHorizontal: Spacing.screenH, paddingTop: 16, paddingBottom: 12 },
  subtitle: { fontSize: FontSizes.base, fontWeight: '500' as const, color: c.teal700, letterSpacing: 0.5, textTransform: 'uppercase' as const },
  title: { fontSize: FontSizes.h2, fontWeight: '600' as const, color: c.ink, marginTop: 2 },
  tabs: { flexDirection: 'row' as const, backgroundColor: c.paper2, borderRadius: 14, padding: 4, marginHorizontal: Spacing.screenH, marginBottom: 18 },
  tabBtn: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10, alignItems: 'center' as const },
  tabBtnOn: { backgroundColor: c.white },
  tabText: { fontSize: 13, fontWeight: '600' as const, color: c.inkMute },
  tabTextOn: { color: c.teal900 },
  hero: { marginHorizontal: Spacing.screenH, borderRadius: Radii.lg, padding: 22, marginBottom: 20, overflow: 'hidden' as const, position: 'relative' as const },
  heroIconBg: { position: 'absolute' as const, right: -20, top: -20, opacity: 0.2 },
  heroLabel: { fontSize: 13, fontWeight: '500' as const, color: 'rgba(255,255,255,0.9)' },
  heroValRow: { flexDirection: 'row' as const, alignItems: 'flex-end' as const, marginTop: 4 },
  heroNum: { fontSize: 56, fontWeight: '700' as const, color: '#fff', lineHeight: 64 },
  heroUnit: { fontSize: FontSizes.h3, color: 'rgba(255,255,255,0.85)', marginBottom: 10, fontWeight: '600' as const },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 6 },
  trackRow: { flexDirection: 'row' as const, gap: 6, marginTop: 14 },
  trackPill: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center' as const, justifyContent: 'center' as const },
  trackPillDone: { backgroundColor: 'rgba(255,255,255,0.25)' },
  trackLabel: { fontSize: 10, fontWeight: '700' as const, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' as const },
  badgesHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, paddingHorizontal: Spacing.screenH, marginBottom: 12 },
  sectionLabel: { fontSize: FontSizes.sm, fontWeight: '700' as const, letterSpacing: 1.2, textTransform: 'uppercase' as const, color: c.inkMute },
  badgesCount: { fontSize: FontSizes.base, color: c.inkMute },
  grid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 10, paddingHorizontal: Spacing.screenH },
  card: { padding: 16, borderRadius: Radii.md, position: 'relative' as const, gap: 4 },
  cardOn: { backgroundColor: c.white, borderWidth: 1.5, borderColor: c.teal300 },
  cardOff: { backgroundColor: c.paper2, borderWidth: 1, borderColor: c.line, opacity: 0.6 },
  lockedPill: { position: 'absolute' as const, top: 10, right: 10, backgroundColor: c.paper, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  lockedText: { fontSize: 9, fontWeight: '700' as const, color: c.inkMute, letterSpacing: 0.5 },
  iconWrap: { width: 52, height: 52, borderRadius: 16, alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: 6 },
  iconWrapOn: { backgroundColor: '#f7c000' },
  iconWrapOff: { backgroundColor: '#9dd4c7' },
  badgeName: { fontSize: FontSizes.body, fontWeight: '700' as const, color: c.ink },
  badgeDesc: { fontSize: FontSizes.sm, color: c.inkMute, lineHeight: 15 },
}));

export function BadgesScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const cardW = (width - Spacing.screenH * 2 - 10) / 2;

  const streak = useAppStore(s => s.streak);
  const bestStreak = useAppStore(s => s.bestStreak);
  const unlockedBadges = useAppStore(s => s.unlockedBadges);
  const checkAndUnlockBadges = useAppStore(s => s.checkAndUnlockBadges);

  useEffect(() => { checkAndUnlockBadges(); }, []);

  const [tab, setTab] = useState<Tab>('daily');

  const filtered = ALL_BADGES.filter(b => b.kind === tab);
  const unlockedCount = filtered.filter(b => unlockedBadges.includes(b.id)).length;

  // Compute weekly/monthly streaks from current streak (approximations)
  const weekStreak = Math.floor(streak / 7);
  const monthStreak = streak >= 25 ? 1 : 0;

  const TABS: [Tab, string][] = [['daily', 'Diárias'], ['weekly', 'Semanais'], ['monthly', 'Mensais']];

  const SECTION_LABELS: Record<Tab, string> = {
    daily: 'CONQUISTAS DIÁRIAS',
    weekly: 'CONQUISTAS SEMANAIS',
    monthly: 'CONQUISTAS MENSAIS',
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.subtitle}>CONQUISTAS</Text>
        <Text style={styles.title}>Troféus da hidratação</Text>
      </View>

      {/* Segmented tabs */}
      <View style={styles.tabs}>
        {TABS.map(([id, label]) => (
          <TouchableOpacity key={id} style={[styles.tabBtn, tab === id && styles.tabBtnOn]} onPress={() => setTab(id)} activeOpacity={0.7}>
            <Text style={[styles.tabText, tab === id && styles.tabTextOn]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Hero card */}
      {tab === 'daily' && (
        <HeroCard
          bg={colors.coral}
          icon={<Flame size={180} color="#fff" strokeWidth={1} />}
          label="Sequência diária"
          value={streak}
          unit="dias"
          sub={bestStreak > streak
            ? `Seu recorde é ${bestStreak} dias. Bora quebrar?`
            : streak === 0 ? 'Beba sua meta hoje pra começar a sequência!'
            : `Recorde atual: ${bestStreak} dias. Continua! 🔥`}
          track={WEEK_LABELS}
          done={Math.min(streak, 7)}
          styles={styles}
        />
      )}
      {tab === 'weekly' && (
        <HeroCard
          bg={colors.plum}
          icon={<Calendar size={180} color="#fff" strokeWidth={1} />}
          label="Semanas na meta"
          value={weekStreak}
          unit="semanas"
          sub="Bater 5+ dias por semana, 4 semanas seguidas, vira mensal."
          track={['s1', 's2', 's3', 's4']}
          done={weekStreak}
          styles={styles}
        />
      )}
      {tab === 'monthly' && (
        <HeroCard
          bg={colors.teal900}
          icon={<Medal size={180} color="#fff" strokeWidth={1} />}
          label="Meses fortes"
          value={monthStreak}
          unit="mês"
          sub="Continue hidratando bem e acumule meses fortes."
          track={MONTH_LABELS}
          done={new Date().getMonth()}
          styles={styles}
        />
      )}

      {/* Badge grid */}
      <View style={styles.badgesHeader}>
        <Text style={styles.sectionLabel}>{SECTION_LABELS[tab]}</Text>
        <Text style={styles.badgesCount}>{unlockedCount}/{filtered.length}</Text>
      </View>
      <View style={styles.grid}>
        {filtered.map(badge => (
          <BadgeCard key={badge.id} badge={badge} unlocked={unlockedBadges.includes(badge.id)} width={cardW} styles={styles} />
        ))}
      </View>
    </ScrollView>
  );
}

function HeroCard({ bg, icon, label, value, unit, sub, track, done, styles }: {
  bg: string; icon: React.ReactNode;
  label: string; value: number; unit: string; sub: string;
  track: string[]; done: number; styles: any;
}) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(withTiming(1.06, { duration: 1000, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={[styles.hero, { backgroundColor: bg }]}>
      <Animated.View style={[styles.heroIconBg, iconStyle]} pointerEvents="none">
        {icon}
      </Animated.View>
      <Text style={styles.heroLabel}>{label}</Text>
      <View style={styles.heroValRow}>
        <Text style={styles.heroNum}>{value}</Text>
        <Text style={styles.heroUnit}> {unit}</Text>
      </View>
      <Text style={styles.heroSub}>{sub}</Text>
      <View style={styles.trackRow}>
        {track.map((d, i) => (
          <View key={i} style={[styles.trackPill, i < done && styles.trackPillDone]}>
            {i < done
              ? <Check size={12} color="rgba(255,255,255,0.9)" strokeWidth={3} />
              : <Text style={styles.trackLabel}>{d}</Text>
            }
          </View>
        ))}
      </View>
    </View>
  );
}

function BadgeCard({ badge, unlocked, width, styles }: { badge: BadgeDef; unlocked: boolean; width: number; styles: any }) {
  return (
    <View style={[styles.card, { width }, unlocked ? styles.cardOn : styles.cardOff]}>
      {!unlocked && <View style={styles.lockedPill}><Text style={styles.lockedText}>TRANCADO</Text></View>}
      <View style={[styles.iconWrap, unlocked ? styles.iconWrapOn : styles.iconWrapOff]}>
        {iconFor(badge.icon)}
      </View>
      <Text style={styles.badgeName}>{badge.name}</Text>
      <Text style={styles.badgeDesc}>{badge.desc}</Text>
    </View>
  );
}
