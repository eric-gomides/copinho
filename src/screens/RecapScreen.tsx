import React, { useRef, useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ToastAndroid, Share, useWindowDimensions,
} from 'react-native';
import ViewShot, { ViewShotRef } from 'react-native-view-shot';
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
  header: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 22, overflow: 'hidden' as const, position: 'relative' as const },
  headerEmojiBg: { position: 'absolute' as const, right: -16, top: -10, fontSize: 140, opacity: 0.15, lineHeight: 150 },
  headerTopRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 14 },
  headerLabel: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 1.4, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase' as const },
  closeBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center' as const, justifyContent: 'center' as const },
  headerEmoji: { fontSize: 44, lineHeight: 52, marginBottom: 6 },
  headerTitle: { fontSize: 28, fontWeight: '700' as const, color: '#fff', lineHeight: 32 },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 6 },
  body: { flex: 1 },
  bodyContent: { padding: 18, paddingHorizontal: 22, gap: 14 },
  heroChip: { borderRadius: 18, padding: 16, paddingHorizontal: 18, flexDirection: 'row' as const, alignItems: 'baseline' as const, gap: 12 },
  heroNum: { fontSize: 44, fontWeight: '700' as const, lineHeight: 48 },
  heroLabel: { fontSize: 13, fontWeight: '600' as const, opacity: 0.8 },
  timelineGrid: { flexDirection: 'row' as const, gap: 8 },
  timelineCell: { flex: 1, borderRadius: 12, padding: 10, alignItems: 'center' as const },
  timelineCellEmoji: { fontSize: 14 },
  timelineCellLabel: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 0.4, textTransform: 'uppercase' as const, marginTop: 2 },
  timelineCellVal: { fontSize: 16, fontWeight: '700' as const, marginTop: 2 },
  sipsCard: { padding: 12, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1 },
  sipsTitle: { fontSize: 13, marginBottom: 4 },
  sipsNote: { fontSize: 12 },
  insightCard: { padding: 14, paddingHorizontal: 16, borderRadius: 16, borderLeftWidth: 3 },
  insightCaption: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.8, textTransform: 'uppercase' as const, marginBottom: 4 },
  insightText: { fontSize: 14, lineHeight: 20 },
  streakCard: { padding: 12, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10 },
  streakEmoji: { fontSize: 22 },
  streakTitle: { fontSize: 12, fontWeight: '700' as const },
  streakSub: { fontSize: 12, marginTop: 1 },
  footer: { borderTopWidth: 1, padding: 12, paddingHorizontal: 18, paddingBottom: 18, flexDirection: 'row' as const, gap: 8 },
  copyBtn: { flex: 1, height: 48, borderRadius: 14, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 6 },
  copyBtnText: { fontSize: 14, fontWeight: '600' as const },
  shareBtn: { flex: 1.4, height: 48, borderRadius: 14, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 6 },
  shareBtnText: { fontSize: 14, fontWeight: '600' as const, color: '#fff' },
}));

export function RecapScreen({ onClose }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  const log        = useAppStore(s => s.log);
  const goalMl     = useAppStore(s => s.goalMl);
  const streak     = useAppStore(s => s.streak);
  const bestStreak = useAppStore(s => s.bestStreak);

  // ViewShot ref apontado para o card off-screen
  const viewShotRef = useRef<ViewShotRef>(null);
  const [sharing, setSharing] = useState(false);

  const stats = useMemo(
    () => computeDayStats(log, goalMl, streak, bestStreak),
    [log, goalMl, streak, bestStreak],
  );
  const scenario = pickScenario(stats);
  const cfg      = SCENARIO_CONFIG[scenario];
  const insight  = useMemo(() => pickInsight(stats, WEEK_HISTORY_MOCK), [stats]);
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
      // 1. Captura o card fixo off-screen como PNG
      const uri = await viewShotRef.current?.capture();
      if (!uri) throw new Error('capture failed');

      // 2. Copia o texto pra clipboard (usuário pode colar no WhatsApp depois da imagem)
      await Clipboard.setStringAsync(shareText);

      // 3. Abre o share nativo com a imagem
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Compartilhar resumo do Copinho',
          UTI: 'public.png',
        });
      } else {
        // Fallback: share só texto via Share nativo
        await Share.share({ message: shareText });
      }
    } catch (err) {
      const msg = String(err);
      if (!msg.toLowerCase().includes('cancel')) {
        ToastAndroid.show('Não foi possível compartilhar', ToastAndroid.SHORT);
      }
    } finally {
      setSharing(false);
    }
  }

  const cardProps = { stats, cfg, insight, dateStr, pctStr, streakBadgeSub, colors };

  return (
    <View style={styles.root}>

      {/* ── Card off-screen capturável ── */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: -(screenWidth * 2),
          top: 0,
          width: screenWidth,
        }}
      >
        <ViewShot
          ref={viewShotRef}
          options={{ format: 'png', quality: 0.95, result: 'tmpfile' }}
        >
          <ShareCard {...cardProps} />
        </ViewShot>
      </View>

      {/* ── Tela principal ── */}

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

      {/* Body scrollável */}
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        <RecapBody {...cardProps} />
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: colors.line }]}>
        <TouchableOpacity
          style={[styles.copyBtn, { backgroundColor: colors.paper2 }]}
          onPress={handleCopy} activeOpacity={0.7}
        >
          <Text style={[styles.copyBtnText, { color: colors.ink }]}>📋 Copiar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.shareBtn, { backgroundColor: colors.teal700, opacity: sharing ? 0.6 : 1 }]}
          onPress={handleShare} activeOpacity={0.85} disabled={sharing}
        >
          <Text style={styles.shareBtnText}>{sharing ? 'Gerando…' : '📤 Compartilhar'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Conteúdo compartilhado entre tela e card de captura ────

interface CardProps {
  stats: DayStats;
  cfg: typeof SCENARIO_CONFIG[keyof typeof SCENARIO_CONFIG];
  insight: string;
  dateStr: string;
  pctStr: number;
  streakBadgeSub: string;
  colors: any;
}

/** Versão compacta sem ScrollView — usada pelo ViewShot para captura */
function ShareCard({ stats, cfg, insight, dateStr, pctStr, streakBadgeSub, colors }: CardProps) {
  return (
    <View style={{ backgroundColor: colors.paper }}>
      {/* Header */}
      <View style={{ backgroundColor: cfg.headerBg, padding: 20, paddingBottom: 24, overflow: 'hidden', position: 'relative' }}>
        <Text style={{ position: 'absolute', right: -10, top: -8, fontSize: 110, opacity: 0.15, lineHeight: 120 }}>
          {cfg.emoji}
        </Text>
        <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.4, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', marginBottom: 10 }}>
          COPINHO · {dateStr}
        </Text>
        <Text style={{ fontSize: 38, lineHeight: 44, marginBottom: 4 }}>{cfg.emoji}</Text>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#fff', lineHeight: 26 }}>{cfg.getTitle(stats)}</Text>
        <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 4 }}>{cfg.getSub(stats)}</Text>
      </View>

      {/* Body */}
      <View style={{ padding: 16, gap: 10 }}>
        {/* Hero chip */}
        <View style={{ backgroundColor: cfg.chipBg, borderRadius: 14, padding: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
          <Text style={{ fontSize: 36, fontWeight: '700', color: cfg.chipFg, lineHeight: 40 }}>
            {(stats.ml / 1000).toFixed(1)}L
          </Text>
          <Text style={{ fontSize: 13, fontWeight: '600', color: cfg.chipFg, opacity: 0.8 }}>
            {pctStr}% da meta
          </Text>
        </View>

        {/* Timeline */}
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {([
            ['🌅', 'PRIMEIRO', stats.firstTime ?? '—'],
            ['🌙', 'ÚLTIMO',   stats.lastTime ?? '—'],
            ['⏱',  'INTERVALO', stats.avgGapStr],
          ] as [string, string, string][]).map(([icon, label, value]) => (
            <View key={label} style={{ flex: 1, backgroundColor: colors.paper2, borderRadius: 10, padding: 8, alignItems: 'center' }}>
              <Text style={{ fontSize: 13 }}>{icon}</Text>
              <Text style={{ fontSize: 9, fontWeight: '700', color: colors.inkMute, textTransform: 'uppercase', marginTop: 1 }}>{label}</Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.teal900, marginTop: 1 }}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Sips */}
        <View style={{ padding: 12, paddingHorizontal: 14, borderRadius: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line }}>
          <Text style={{ fontSize: 13, color: colors.ink, marginBottom: 3 }}>
            📊 {stats.sips} gole{stats.sips !== 1 ? 's' : ''} · {stats.avgSip}ml médio
          </Text>
          {stats.notes.map(n => (
            <Text key={n} style={{ fontSize: 12, color: colors.inkMute }}>· {n}</Text>
          ))}
          {stats.sips === 0 && <Text style={{ fontSize: 12, color: colors.inkMute }}>· nada registrado hoje</Text>}
        </View>

        {/* Insight */}
        <View style={{ backgroundColor: colors.teal50, borderRadius: 12, padding: 12, paddingHorizontal: 14, borderLeftWidth: 3, borderLeftColor: colors.teal500 }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: colors.teal700, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 3 }}>
            💬 O COPINHO NOTOU
          </Text>
          <Text style={{ fontSize: 13, color: colors.ink, lineHeight: 18 }}>"{insight}"</Text>
        </View>

        {/* Streak */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: `${colors.coralSoft}60`, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.coralSoft }}>
          <Text style={{ fontSize: 20 }}>{stats.streak > 0 ? '🔥' : '💔'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.ink }}>
              {stats.streak > 0 ? `Sequência: ${stats.streak} dias` : 'Sem sequência'}
            </Text>
            <Text style={{ fontSize: 11, color: colors.inkMute, marginTop: 1 }}>{streakBadgeSub}</Text>
          </View>
        </View>

        {/* Watermark */}
        <Text style={{ fontSize: 11, color: colors.inkMute, textAlign: 'center', paddingTop: 2 }}>
          💧 enviado pelo Copinho
        </Text>
      </View>
    </View>
  );
}

/** Versão com cores explícitas do tema para a tela scrollável */
function RecapBody({ stats, cfg, insight, pctStr, streakBadgeSub, colors }: CardProps) {
  return (
    <>
      {/* Hero chip */}
      <View style={{ backgroundColor: cfg.chipBg, borderRadius: 18, padding: 16, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'baseline', gap: 12 }}>
        <Text style={{ fontSize: 44, fontWeight: '700', color: cfg.chipFg, lineHeight: 48 }}>
          {(stats.ml / 1000).toFixed(1)}L
        </Text>
        <Text style={{ fontSize: 13, fontWeight: '600', color: cfg.chipFg, opacity: 0.8 }}>
          {pctStr}% da meta
        </Text>
      </View>

      {/* Timeline */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {([
          ['🌅', 'PRIMEIRO', stats.firstTime ?? '—'],
          ['🌙', 'ÚLTIMO',   stats.lastTime ?? '—'],
          ['⏱',  'INTERVALO', stats.avgGapStr],
        ] as [string, string, string][]).map(([icon, label, value]) => (
          <View key={label} style={{ flex: 1, backgroundColor: colors.paper2, borderRadius: 12, padding: 10, alignItems: 'center' }}>
            <Text style={{ fontSize: 14 }}>{icon}</Text>
            <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase', color: colors.inkMute, marginTop: 2 }}>{label}</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.teal900, marginTop: 2 }}>{value}</Text>
          </View>
        ))}
      </View>

      {/* Sips card */}
      <View style={{ padding: 12, paddingHorizontal: 14, borderRadius: 14, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line }}>
        <Text style={{ fontSize: 13, color: colors.ink, marginBottom: 4 }}>
          📊 {stats.sips} gole{stats.sips !== 1 ? 's' : ''} · {stats.avgSip}ml médio
        </Text>
        {stats.notes.map(n => (
          <Text key={n} style={{ fontSize: 12, color: colors.inkMute }}>· {n}</Text>
        ))}
        {stats.sips === 0 && <Text style={{ fontSize: 12, color: colors.inkMute }}>· nada registrado hoje</Text>}
      </View>

      {/* Insight pull quote */}
      <View style={{ padding: 14, paddingHorizontal: 16, borderRadius: 16, backgroundColor: colors.teal50, borderLeftWidth: 3, borderLeftColor: colors.teal500 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: colors.teal700, marginBottom: 4 }}>
          💬 O Copinho notou
        </Text>
        <Text style={{ fontSize: 14, color: colors.ink, lineHeight: 20 }}>"{insight}"</Text>
      </View>

      {/* Streak card */}
      <View style={{ padding: 12, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.coralSoft, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: `${colors.coralSoft}80` }}>
        <Text style={{ fontSize: 22 }}>{stats.streak > 0 ? '🔥' : '💔'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.ink }}>
            {stats.streak > 0 ? `Sequência: ${stats.streak} dias` : 'Sem sequência'}
          </Text>
          <Text style={{ fontSize: 12, color: colors.inkMute, marginTop: 1 }}>{streakBadgeSub}</Text>
        </View>
      </View>
    </>
  );
}
