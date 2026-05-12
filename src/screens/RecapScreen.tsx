import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal,
  ToastAndroid, Share, StyleSheet, Pressable,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { X } from 'lucide-react-native';
import { useAppStore, WEEK_HISTORY_MOCK } from '../store/useAppStore';
import {
  computeDayStats, pickScenario, pickInsight,
  buildShareText, SCENARIO_CONFIG, DayStats,
} from '../utils/recap';
import { FontSizes, Spacing, Radii } from '../theme/tokens';
import { makeStyles, useTheme } from '../theme/ThemeContext';

interface Props { onClose: () => void; }

// ─── Styles ────────────────────────────────────────────────

const useStyles = makeStyles(c => ({
  root:         { flex: 1, backgroundColor: c.paper },
  header:       { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 22, overflow: 'hidden' as const, position: 'relative' as const },
  headerBgEmoji:{ position: 'absolute' as const, right: -16, top: -10, fontSize: 140, opacity: 0.15, lineHeight: 150 },
  headerTopRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 14 },
  headerLabel:  { fontSize: 11, fontWeight: '700' as const, letterSpacing: 1.4, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase' as const },
  closeBtn:     { width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center' as const, justifyContent: 'center' as const },
  headerEmoji:  { fontSize: 44, lineHeight: 52, marginBottom: 6 },
  headerTitle:  { fontSize: 28, fontWeight: '700' as const, color: '#fff', lineHeight: 32 },
  headerSub:    { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 6 },
  body:         { flex: 1 },
  bodyContent:  { padding: 18, paddingHorizontal: 22, gap: 14 },
  footer:       { borderTopWidth: 1, padding: 12, paddingHorizontal: 18, paddingBottom: 18, flexDirection: 'row' as const, gap: 8 },
  copyBtn:      { flex: 1, height: 48, borderRadius: 14, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 6 },
  copyBtnText:  { fontSize: 14, fontWeight: '600' as const },
  shareBtn:     { flex: 1.4, height: 48, borderRadius: 14, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 6 },
  shareBtnText: { fontSize: 14, fontWeight: '600' as const, color: '#fff' },
  // Copy sheet
  sheetOverlay: { flex: 1, justifyContent: 'flex-end' as const },
  sheetBackdrop:{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,30,28,0.55)' },
  sheet:        { backgroundColor: '#fafcfb', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 32, maxHeight: '80%' as any },
  sheetHandle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: '#dde4e2', alignSelf: 'center' as const, marginBottom: 16 },
  sheetTitle:   { fontSize: 22, fontWeight: '700' as const, marginBottom: 14 },
  textBox:      { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
  textBoxText:  { fontSize: 13, lineHeight: 22 },
  sheetCopyBtn: { height: 52, borderRadius: 16, alignItems: 'center' as const, justifyContent: 'center' as const },
  sheetCopyTxt: { fontSize: 16, fontWeight: '700' as const, color: '#fff' },
}));

// ─── Main screen ───────────────────────────────────────────

export function RecapScreen({ onClose }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();

  const log        = useAppStore(s => s.log);
  const goalMl     = useAppStore(s => s.goalMl);
  const streak     = useAppStore(s => s.streak);
  const bestStreak = useAppStore(s => s.bestStreak);

  const [copySheetOpen, setCopySheetOpen] = useState(false);

  const stats = useMemo(
    () => computeDayStats(log, goalMl, streak, bestStreak),
    [log, goalMl, streak, bestStreak],
  );
  const scenario  = pickScenario(stats);
  const cfg       = SCENARIO_CONFIG[scenario];
  const insight   = useMemo(() => pickInsight(stats, WEEK_HISTORY_MOCK), [stats]);
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

  async function handleShare() {
    try {
      await Share.share({ message: shareText });
    } catch (err) {
      const msg = String(err);
      if (!msg.toLowerCase().includes('cancel')) {
        ToastAndroid.show('Não foi possível compartilhar', ToastAndroid.SHORT);
      }
    }
  }

  const cardProps = { stats, cfg, insight, dateStr, pctStr, streakBadgeSub, colors };

  return (
    <View style={styles.root}>

      {/* ── Header colorido ── */}
      <View style={[styles.header, { backgroundColor: cfg.headerBg }]}>
        <Text style={styles.headerBgEmoji}>{cfg.emoji}</Text>
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

      {/* ── Body scrollável ── */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <RecapBody {...cardProps} />
      </ScrollView>

      {/* ── Footer ── */}
      <View style={[styles.footer, { borderTopColor: colors.line }]}>
        <TouchableOpacity
          style={[styles.copyBtn, { backgroundColor: colors.paper2 }]}
          onPress={() => setCopySheetOpen(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.copyBtnText, { color: colors.ink }]}>📋 Copiar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.shareBtn, { backgroundColor: colors.teal700 }]}
          onPress={handleShare}
          activeOpacity={0.85}
        >
          <Text style={styles.shareBtnText}>📤 Compartilhar</Text>
        </TouchableOpacity>
      </View>

      {/* ── Modal de preview do texto (Copiar) ── */}
      <Modal
        visible={copySheetOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setCopySheetOpen(false)}
      >
        <View style={styles.sheetOverlay}>
          <Pressable style={styles.sheetBackdrop} onPress={() => setCopySheetOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.ink }]}>Pré-visualizar texto</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={[styles.textBox, { borderColor: colors.line }]}>
                <Text style={[styles.textBoxText, { color: colors.ink, fontFamily: 'monospace' }]}>
                  {shareText}
                </Text>
              </View>
            </ScrollView>
            <TouchableOpacity
              style={[styles.sheetCopyBtn, { backgroundColor: colors.teal700 }]}
              onPress={async () => {
                await Clipboard.setStringAsync(shareText);
                setCopySheetOpen(false);
                ToastAndroid.show('Copiado! Cole em qualquer chat 📋', ToastAndroid.SHORT);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.sheetCopyTxt}>📋 Copiar texto</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

// ─── RecapBody shared types ──────────────────────────────────

interface CardProps {
  stats: DayStats;
  cfg: typeof SCENARIO_CONFIG[keyof typeof SCENARIO_CONFIG];
  insight: string;
  dateStr: string;
  pctStr: number;
  streakBadgeSub: string;
  colors: any;
}

// ─── RecapBody — versão scrollável para a tela principal ─────

function RecapBody({ stats, cfg, insight, pctStr, streakBadgeSub, colors }: CardProps) {
  return (
    <>
      <View style={{ backgroundColor: cfg.chipBg, borderRadius: 18, padding: 16, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'baseline', gap: 12 }}>
        <Text style={{ fontSize: 44, fontWeight: '700', color: cfg.chipFg, lineHeight: 48 }}>
          {(stats.ml / 1000).toFixed(1)}L
        </Text>
        <Text style={{ fontSize: 13, fontWeight: '600', color: cfg.chipFg, opacity: 0.8 }}>
          {pctStr}% da meta
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {([
          ['🌅', 'PRIMEIRO',  stats.firstTime ?? '—'],
          ['🌙', 'ÚLTIMO',    stats.lastTime ?? '—'],
          ['⏱',  'INTERVALO', stats.avgGapStr],
        ] as [string, string, string][]).map(([icon, label, value]) => (
          <View key={label} style={{ flex: 1, backgroundColor: colors.paper2, borderRadius: 12, padding: 10, alignItems: 'center' }}>
            <Text style={{ fontSize: 14 }}>{icon}</Text>
            <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase', color: colors.inkMute, marginTop: 2 }}>{label}</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.teal900, marginTop: 2 }}>{value}</Text>
          </View>
        ))}
      </View>

      <View style={{ padding: 12, paddingHorizontal: 14, borderRadius: 14, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line }}>
        <Text style={{ fontSize: 13, color: colors.ink, marginBottom: 4 }}>
          📊 {stats.sips} gole{stats.sips !== 1 ? 's' : ''} · {stats.avgSip}ml médio
        </Text>
        {stats.notes.map(n => <Text key={n} style={{ fontSize: 12, color: colors.inkMute }}>· {n}</Text>)}
        {stats.sips === 0 && <Text style={{ fontSize: 12, color: colors.inkMute }}>· nada registrado hoje</Text>}
      </View>

      <View style={{ padding: 14, paddingHorizontal: 16, borderRadius: 16, backgroundColor: colors.teal50, borderLeftWidth: 3, borderLeftColor: colors.teal500 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: colors.teal700, marginBottom: 4 }}>
          💬 O Copinho notou
        </Text>
        <Text style={{ fontSize: 14, color: colors.ink, lineHeight: 20 }}>"{insight}"</Text>
      </View>

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
