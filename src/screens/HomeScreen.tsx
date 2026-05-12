import React, { useMemo } from 'react';
import { ScrollView, View, Text, TouchableOpacity, useWindowDimensions, Alert } from 'react-native';
import { Flame, Plus, Trophy, ChevronRight, MoreHorizontal, Droplets, Volume2, VolumeX, Settings } from 'lucide-react-native';
import { Bottle } from '../components/Bottle';
import { useAppStore, CUP_PRESETS, LIQUID_TYPES, DrinkEntry, LIQUID_MULTIPLIERS } from '../store/useAppStore';
import { Radii, FontSizes, Spacing } from '../theme/tokens';
import { makeStyles, useTheme } from '../theme/ThemeContext';
import { SHADES as SHADES_REF } from '../theme/colorShades';

interface HomeScreenProps {
  onOpenAddSheet: () => void;
  onGoToBadges: () => void;
  onEditGoal: () => void;
  onPersonalize: () => void;
  onGoToRecap: () => void;
}

function getGreeting(pct: number): [string, string] {
  if (pct >= 1) return ['Isso aí, monstro!', 'Meta batida 💪'];
  if (pct >= 0.75) return ['Reta final!', 'Mais um copão e fecha'];
  if (pct >= 0.5) return ['Metade feita', 'Você tá on fire 🔥'];
  const lines: [string, string][] = [
    ['Bora molhar a planta?', 'Sua bexiga agradece'],
    ['Eai, sequinho?', 'A gente conserta já'],
    ['Tá fazendo calor aqui', 'ou é só você desidratado?'],
    ['Olha essa cara seca', 'ó a água aí ó'],
  ];
  return lines[new Date().getDate() % lines.length];
}

function todayLabel() {
  return new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase().replace('.', '');
}

const useStyles = makeStyles(c => ({
  container: { flex: 1, backgroundColor: c.paper },
  content: { paddingBottom: 120 },
  header: { flexDirection: 'row' as const, alignItems: 'flex-start' as const, paddingHorizontal: Spacing.screenH, paddingTop: 12, paddingBottom: 6, gap: 12 },
  headerText: { flex: 1 },
  headerSubtitle: { fontSize: FontSizes.base, fontWeight: '500' as const, color: c.teal700, letterSpacing: 0.5, textTransform: 'uppercase' as const },
  headerTitle: { fontSize: FontSizes.h2, fontWeight: '600' as const, color: c.ink, lineHeight: 30, marginTop: 2 },
  streakChip: { height: 36, paddingHorizontal: 12, borderRadius: 12, backgroundColor: c.coralSoft, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 5, marginTop: 4 },
  streakText: { fontSize: FontSizes.body, fontWeight: '600' as const, color: c.coral },
  funLine: { paddingHorizontal: Spacing.screenH, fontSize: FontSizes.body, color: c.inkMute, marginBottom: 4 },
  bottleWrapper: { alignItems: 'center' as const, justifyContent: 'center' as const, marginTop: 16, marginBottom: 4, position: 'relative' as const },
  statChip: { position: 'absolute' as const, padding: 8, paddingHorizontal: 10, borderRadius: 12, zIndex: 2 },
  statChipLeft: { left: 12, top: 40 },
  statChipRight: { right: 12, top: 40 },
  statLabel: { fontSize: FontSizes.xs, fontWeight: '600' as const, letterSpacing: 0.5, textTransform: 'uppercase' as const, opacity: 0.8 },
  statValue: { fontSize: FontSizes.lg, fontWeight: '700' as const },
  section: { paddingHorizontal: Spacing.screenH, paddingTop: Spacing['5xl'], gap: 12 },
  sectionRow: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
  sectionLabel: { fontSize: FontSizes.sm, fontWeight: '700' as const, letterSpacing: 1.2, textTransform: 'uppercase' as const, color: c.inkMute },
  logCount: { fontSize: FontSizes.base, color: c.inkMute },
  presetsGrid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 10 },
  primaryButton: { height: 56, borderRadius: Radii.button, backgroundColor: c.teal700, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 8, shadowColor: c.teal700, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  primaryButtonText: { fontSize: FontSizes.lg, fontWeight: '600' as const, color: '#fff' },
  logList: { gap: 8 },
  emptyLog: { padding: Spacing['5xl'], borderRadius: Radii.md, backgroundColor: c.teal50, alignItems: 'center' as const },
  emptyLogText: { fontSize: FontSizes.body, color: c.inkMute, textAlign: 'center' as const },
  ctaCard: { padding: 14, paddingHorizontal: 18, borderRadius: Radii.md, backgroundColor: c.teal900, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 14 },
  ctaIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(247,217,122,0.2)', alignItems: 'center' as const, justifyContent: 'center' as const },
  ctaTitle: { fontSize: FontSizes.bodyLg, fontWeight: '600' as const, color: '#fff' },
  ctaSubtitle: { fontSize: FontSizes.base, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  cupCard: { padding: 14, borderRadius: 16, backgroundColor: c.white, borderWidth: 1.5, borderColor: c.line, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10 },
  cupIconBox: { width: 38, height: 38, borderRadius: 10, backgroundColor: c.teal50, alignItems: 'center' as const, justifyContent: 'center' as const },
  cupOuter: { width: 16, height: 22, borderRadius: 3, backgroundColor: c.teal100, overflow: 'hidden' as const, justifyContent: 'flex-end' as const },
  cupFill: { backgroundColor: c.teal500, width: '100%' as const },
  cupLabel: { fontSize: FontSizes.md, color: c.inkMute },
  cupMl: { fontSize: FontSizes.xl, fontWeight: '700' as const, color: c.ink },
  addBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: c.teal500, alignItems: 'center' as const, justifyContent: 'center' as const },
  logRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, padding: 10, paddingHorizontal: 14, borderRadius: 14, backgroundColor: c.white, borderWidth: 1, borderColor: c.line },
  logIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center' as const, justifyContent: 'center' as const, opacity: 0.9 },
  logMainText: { fontSize: FontSizes.body, fontWeight: '600' as const, color: c.ink },
  logSubText: { fontSize: FontSizes.base, color: c.inkMute, marginTop: 1 },
  logDotsBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: c.paper2, alignItems: 'center' as const, justifyContent: 'center' as const },
}));

export function HomeScreen({ onOpenAddSheet, onGoToBadges, onEditGoal, onPersonalize, onGoToRecap }: HomeScreenProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { log, goalMl, streak, addDrink, removeEntry, unlockedBadges, soundsMuted, setSoundsMuted, bottleColor, bottleShape } = useAppStore();
  const currentMl = useAppStore(s => s.currentMl());
  const pct = useAppStore(s => s.pct());
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = (screenWidth - Spacing.screenH * 2 - 10) / 2;
  const [greeting, funLine] = useMemo(() => getGreeting(pct), [pct]);
  const remaining = Math.max(0, goalMl - currentMl);
  const pace = pct >= 0.5 ? 'ótimo' : 'lento';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.headerSubtitle}>HOJE • {todayLabel()}</Text>
          <Text style={styles.headerTitle}>{greeting}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 }}>
          {/* Mute toggle */}
          <TouchableOpacity
            onPress={() => setSoundsMuted(!soundsMuted)}
            style={{
              width: 36, height: 36, borderRadius: 10,
              backgroundColor: soundsMuted ? colors.paper2 : colors.teal50,
              alignItems: 'center', justifyContent: 'center',
            }}
            activeOpacity={0.7}
          >
            {soundsMuted
              ? <VolumeX size={17} color={colors.inkMute} strokeWidth={2} />
              : <Volume2 size={17} color={colors.teal900} strokeWidth={2} />}
          </TouchableOpacity>
          {/* Streak chip */}
          <View style={styles.streakChip}>
            <Flame size={15} color={colors.coral} strokeWidth={2.2} />
            <Text style={styles.streakText}>{streak}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.funLine}>{funLine}</Text>

      <View style={styles.bottleWrapper}>
        <View style={[styles.statChip, styles.statChipLeft, { backgroundColor: colors.paper2 }]}>
          <Text style={[styles.statLabel, { color: colors.inkMute }]}>RESTAM</Text>
          <Text style={[styles.statValue, { color: colors.ink }]}>{(remaining / 1000).toFixed(2)}L</Text>
        </View>
        <Bottle pct={pct} variant="mascot" color={bottleColor} shape={bottleShape} width={220} height={310} goalMl={goalMl} currentMl={currentMl} />
        <View style={[styles.statChip, styles.statChipRight, { backgroundColor: pct >= 0.5 ? colors.teal50 : colors.coralSoft }]}>
          <Text style={[styles.statLabel, { color: pct >= 0.5 ? colors.teal700 : colors.coral }]}>RITMO</Text>
          <Text style={[styles.statValue, { color: pct >= 0.5 ? colors.teal700 : colors.coral }]}>{pace}</Text>
        </View>
      </View>

      {/* Pills abaixo da garrafa — Meta + Aparência lado a lado */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8, paddingHorizontal: Spacing.screenH, flexWrap: 'wrap' }}>
        {/* Meta */}
        <TouchableOpacity
          onPress={onEditGoal}
          activeOpacity={0.75}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 7,
            paddingVertical: 8, paddingHorizontal: 14,
            borderRadius: 999, backgroundColor: colors.white,
            borderWidth: 1, borderColor: colors.line,
            shadowColor: colors.ink, shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
          }}
        >
          <Text style={{ fontSize: 13, color: colors.inkMute }}>Meta:</Text>
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.teal900 }}>
            {(goalMl / 1000 % 1 === 0) ? `${goalMl / 1000}L` : `${(goalMl / 1000).toFixed(1)}L`}
          </Text>
          <Settings size={13} color={colors.inkMute} strokeWidth={2} />
        </TouchableOpacity>

        {/* Aparência */}
        <TouchableOpacity
          onPress={onPersonalize}
          activeOpacity={0.75}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 7,
            paddingVertical: 8, paddingHorizontal: 14,
            borderRadius: 999, backgroundColor: colors.white,
            borderWidth: 1, borderColor: colors.line,
            shadowColor: colors.ink, shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
          }}
        >
          {/* Color swatch dot */}
          <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: SHADES_REF[bottleColor]?.waterMid ?? colors.teal500 }} />
          <Text style={{ fontSize: 13, color: colors.inkMute }}>Aparência</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionRow}><Text style={styles.sectionLabel}>Adicionar rápido</Text></View>
        <View style={styles.presetsGrid}>
          {CUP_PRESETS.map(cup => (
            <QuickCupButton key={cup.id} label={cup.label} ml={cup.ml} width={cardWidth} styles={styles} onPress={() => addDrink(cup.ml, 'water')} />
          ))}
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={onOpenAddSheet} activeOpacity={0.85}>
          <Plus size={20} color="#fff" strokeWidth={2.5} />
          <Text style={styles.primaryButtonText}>Outro valor / bebida</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>Histórico de hoje</Text>
          <Text style={styles.logCount}>{log.length} registros</Text>
        </View>
        {log.length === 0 ? (
          <View style={styles.emptyLog}><Text style={styles.emptyLogText}>Ainda nada. Solta o primeiro copo aí em cima ☝️</Text></View>
        ) : (
          <View style={styles.logList}>
            {[...log].reverse().map(entry => <LogRow key={entry.id} entry={entry} styles={styles} colors={colors} onRemove={removeEntry} />)}
          </View>
        )}
      </View>

      <View style={[styles.section, { paddingBottom: 0 }]}>
        <TouchableOpacity style={styles.ctaCard} activeOpacity={0.85} onPress={onGoToBadges}>
          <View style={styles.ctaIconBox}><Trophy size={22} color={colors.sun} strokeWidth={2} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.ctaTitle}>{unlockedBadges.length} conquistas desbloqueadas</Text>
            <Text style={styles.ctaSubtitle}>
              {streak < 7 ? `Faltam ${7 - streak} dias pra Semana Hidratada` : 'Você desbloqueou a Semana Hidratada! 🎉'}
            </Text>
          </View>
          <ChevronRight size={18} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>

      <RecapHomeCard onPress={onGoToRecap} pct={pct} colors={colors} />
    </ScrollView>
  );
}

function QuickCupButton({ label, ml, width, onPress, styles }: { label: string; ml: number; width: number; onPress: () => void; styles: any }) {
  const fillH = Math.min(ml / 500, 1) * 22;
  return (
    <TouchableOpacity style={[styles.cupCard, { width }]} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.cupIconBox}>
        <View style={styles.cupOuter}><View style={[styles.cupFill, { height: fillH }]} /></View>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cupLabel}>{label}</Text>
        <Text style={styles.cupMl}>{ml}ml</Text>
      </View>
      <View style={styles.addBtn}><Plus size={15} color="#fff" strokeWidth={2.8} /></View>
    </TouchableOpacity>
  );
}

function LogRow({ entry, styles, colors, onRemove }: {
  entry: DrinkEntry; styles: any; colors: any; onRemove: (id: string) => void;
}) {
  const liq = LIQUID_TYPES.find(l => l.id === entry.type) ?? LIQUID_TYPES[0];
  const time = new Date(entry.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const realMl = Math.round(entry.ml * LIQUID_MULTIPLIERS[entry.type]);

  function handleDots() {
    Alert.alert(
      `${entry.ml}ml de ${liq?.label.toLowerCase() ?? 'água'}`,
      `${time} · contou ${realMl}ml`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir registro',
          style: 'destructive',
          onPress: () => onRemove(entry.id),
        },
      ]
    );
  }

  return (
    <View style={styles.logRow}>
      <View style={[styles.logIcon, { backgroundColor: liq?.color ?? colors.teal500 }]}>
        <Droplets size={16} color="#fff" strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.logMainText}>{entry.ml}ml de {liq?.label.toLowerCase() ?? 'água'}</Text>
        <Text style={styles.logSubText}>{time} • contou {realMl}ml</Text>
      </View>
      <TouchableOpacity style={styles.logDotsBtn} onPress={handleDots} activeOpacity={0.7}>
        <MoreHorizontal size={18} color={colors.inkMute} />
      </TouchableOpacity>
    </View>
  );
}

function RecapHomeCard({ onPress, pct, colors }: { onPress: () => void; pct: number; colors: any }) {
  const hour = new Date().getHours();
  if (hour < 18) return null;

  const emoji = pct >= 1 ? '🏆' : pct >= 0.7 ? '😬' : '🏜️';
  const label = pct >= 1 ? 'Bateu a meta! Ver resumo completo' : 'Ver resumo de hoje';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        marginHorizontal: Spacing.screenH, marginTop: 12, marginBottom: 4,
        backgroundColor: colors.teal50, borderRadius: Radii.card,
        padding: 14, paddingHorizontal: 16,
        flexDirection: 'row', alignItems: 'center', gap: 12,
        borderWidth: 1, borderColor: colors.teal300,
      }}
    >
      <Text style={{ fontSize: 24 }}>{emoji}</Text>
      <Text style={{ flex: 1, fontSize: FontSizes.body, fontWeight: '600', color: colors.teal700 }}>
        {label}
      </Text>
      <ChevronRight size={16} color={colors.teal700} strokeWidth={2} />
    </TouchableOpacity>
  );
}
