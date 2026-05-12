import React, { useRef, useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ToastAndroid, Share,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { X } from 'lucide-react-native';
import { useAppStore, WEEK_HISTORY_MOCK } from '../store/useAppStore';
import {
  computeDayStats, pickScenario, pickInsight,
  buildShareText, SCENARIO_CONFIG, DayStats,
} from '../utils/recap';
import { FontSizes, Spacing, Radii } from '../theme/tokens';
import { makeStyles, useTheme } from '../theme/ThemeContext';

interface Props {
  onClose: () => void;
}

const useStyles = makeStyles(c => ({
  root: { flex: 1, backgroundColor: c.paper },
  // Header
  header: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 22, overflow: 'hidden' as const, position: 'relative' as const },
  headerEmojiBg: { position: 'absolute' as const, right: -16, top: -10, fontSize: 140, opacity: 0.15, lineHeight: 150 },
  headerTopRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 14 },
  headerLabel: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 1.4, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase' as const },
  closeBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center' as const, justifyContent: 'center' as const },
  headerEmoji: { fontSize: 44, lineHeight: 52, marginBottom: 6 },
  headerTitle: { fontSize: 28, fontWeight: '700' as const, color: '#fff', lineHeight: 32 },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 6 },
  // Body
  body: { flex: 1 },
  bodyContent: { padding: 18, paddingHorizontal: 22, gap: 14 },
  // Hero chip
  heroChip: { borderRadius: 18, padding: 16, paddingHorizontal: 18, flexDirection: 'row' as const, alignItems: 'baseline' as const, gap: 12 },
  heroNum: { fontSize: 44, fontWeight: '700' as const, lineHeight: 48 },
  heroLabel: { fontSize: 13, fontWeight: '600' as const, opacity: 0.8 },
  // Timeline
  timelineGrid: { flexDirection: 'row' as const, gap: 8 },
  timelineCell: { flex: 1, backgroundColor: c.paper2, borderRadius: 12, padding: 10, alignItems: 'center' as const },
  timelineCellEmoji: { fontSize: 14 },
  timelineCellLabel: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 0.4, textTransform: 'uppercase' as const, color: c.inkMute, marginTop: 2 },
  timelineCellVal: { fontSize: 16, fontWeight: '700' as const, color: c.teal900, marginTop: 2 },
  // Sips card
  sipsCard: { padding: 12, paddingHorizontal: 14, borderRadius: 14, backgroundColor: c.white, borderWidth: 1, borderColor: c.line },
  sipsTitle: { fontSize: 13, color: c.ink, marginBottom: 4 },
  sipsNote: { fontSize: 12, color: c.inkMute },
  // Insight quote
  insightCard: { padding: 14, paddingHorizontal: 16, borderRadius: 16, backgroundColor: c.teal50, borderLeftWidth: 3, borderLeftColor: c.teal500 },
  insightCaption: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.8, textTransform: 'uppercase' as const, color: c.teal700, marginBottom: 4 },
  insightText: { fontSize: 14, color: c.ink, lineHeight: 20 },
  // Streak card
  streakCard: { padding: 12, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: c.coralSoft, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10 },
  streakEmoji: { fontSize: 22 },
  streakTitle: { fontSize: 12, fontWeight: '700' as const, color: c.ink },
  streakSub: { fontSize: 12, color: c.inkMute, marginTop: 1 },
  // Footer
  footer: { borderTopWidth: 1, borderTopColor: c.line, padding: 12, paddingHorizontal: 18, paddingBottom: 18, flexDirection: 'row' as const, gap: 8 },
  copyBtn: { flex: 1, height: 48, borderRadius: 14, backgroundColor: c.paper2, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 6 },
  copyBtnText: { fontSize: 14, fontWeight: '600' as const, color: c.ink },
  shareBtn: { flex: 1.4, height: 48, borderRadius: 14, backgroundColor: c.teal700, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 6 },
  shareBtnText: { fontSize: 14, fontWeight: '600' as const, color: '#fff' },
}));

export function RecapScreen({ onClose }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const log = useAppStore(s => s.log);
  const goalMl = useAppStore(s => s.goalMl);
  const streak = useAppStore(s => s.streak);
  const bestStreak = useAppStore(s => s.bestStreak);

  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  const stats: DayStats = useMemo(
    () => computeDayStats(log, goalMl, streak, bestStreak),
    [log, goalMl, streak, bestStreak],
  );

  const scenario = pickScenario(stats);
  const cfg = SCENARIO_CONFIG[scenario];
  const insight = useMemo(
    () => pickInsight(stats, WEEK_HISTORY_MOCK),
    [stats],
  );
  const shareText = buildShareText(stats, insight);

  const dateStr = stats.date.toLocaleDateString('pt-BR', {
    weekday: 'short', day: '2-digit', month: 'short',
  }).toUpperCase();

  const pctStr = Math.min(Math.round(stats.pct * 100), 999);
  const streakBadgeSub = stats.streak === 0
    ? 'Beba sua meta amanhã pra recomeçar.'
    : stats.streak < 7
    ? `Faltam ${7 - stats.streak} dias pra "Semana hidratada".`
    : '7 dias seguidos. Semana hidratada! 🎉';

  async function handleCopy() {
    await Clipboard.setStringAsync(shareText);
    ToastAndroid.show('Copiado! 📋', ToastAndroid.SHORT);
  }

  async function handleShare() {
    if (sharing) return;
    setSharing(true);
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (cardRef.current && isAvailable) {
        const uri = await captureRef(cardRef, { format: 'png', quality: 0.92 });
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Compartilhar resumo' });
      } else {
        await Share.share({ message: shareText });
      }
    } catch {
      // share cancelled or error — silent
    } finally {
      setSharing(false);
    }
  }

  return (
    <View style={styles.root}>
      {/* Capturable card area */}
      <View ref={cardRef} collapsable={false} style={{ flex: 1 }}>

        {/* Header */}
        <View style={[styles.header, { backgroundColor: cfg.headerBg }]}>
          <Text style={styles.headerEmojiBg}>{cfg.emoji}</Text>
          <View style={styles.headerTopRow}>
            <Text style={styles.headerLabel}>COPINHO · {dateStr}</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <X size={16} color="#fff" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerEmoji}>{cfg.emoji}</Text>
          <Text style={styles.headerTitle}>{cfg.getTitle(stats)}</Text>
          <Text style={styles.headerSub}>{cfg.getSub(stats)}</Text>
        </View>

        {/* Scrollable body */}
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>

          {/* Hero chip */}
          <View style={[styles.heroChip, { backgroundColor: cfg.chipBg }]}>
            <Text style={[styles.heroNum, { color: cfg.chipFg }]}>
              {(stats.ml / 1000).toFixed(1)}L
            </Text>
            <Text style={[styles.heroLabel, { color: cfg.chipFg }]}>
              {pctStr}% da meta
            </Text>
          </View>

          {/* Timeline */}
          <View style={styles.timelineGrid}>
            {([
              ['🌅', 'PRIMEIRO', stats.firstTime ?? '—'],
              ['🌙', 'ÚLTIMO',   stats.lastTime ?? '—'],
              ['⏱',  'INTERVALO', stats.avgGapStr],
            ] as [string, string, string][]).map(([icon, label, value]) => (
              <View key={label} style={styles.timelineCell}>
                <Text style={styles.timelineCellEmoji}>{icon}</Text>
                <Text style={styles.timelineCellLabel}>{label}</Text>
                <Text style={styles.timelineCellVal}>{value}</Text>
              </View>
            ))}
          </View>

          {/* Sips card */}
          <View style={styles.sipsCard}>
            <Text style={styles.sipsTitle}>
              📊 {stats.sips} gole{stats.sips !== 1 ? 's' : ''} · {stats.avgSip}ml médio
            </Text>
            {stats.notes.map(n => (
              <Text key={n} style={styles.sipsNote}>· {n}</Text>
            ))}
            {stats.sips === 0 && <Text style={styles.sipsNote}>· nada registrado hoje</Text>}
          </View>

          {/* Insight pull quote */}
          <View style={styles.insightCard}>
            <Text style={styles.insightCaption}>💬 O Copinho notou</Text>
            <Text style={styles.insightText}>"{insight}"</Text>
          </View>

          {/* Streak card */}
          <View style={[styles.streakCard, { backgroundColor: `${colors.coralSoft}80` }]}>
            <Text style={styles.streakEmoji}>{stats.streak > 0 ? '🔥' : '💔'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.streakTitle}>
                {stats.streak > 0 ? `Sequência: ${stats.streak} dias` : 'Sem sequência'}
              </Text>
              <Text style={styles.streakSub}>{streakBadgeSub}</Text>
            </View>
          </View>

        </ScrollView>
      </View>

      {/* Footer (outside capturable area) */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.copyBtn} onPress={handleCopy} activeOpacity={0.7}>
          <Text style={styles.copyBtnText}>📋 Copiar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.85} disabled={sharing}>
          <Text style={styles.shareBtnText}>📤 Compartilhar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
