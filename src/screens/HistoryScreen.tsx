import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, Alert } from 'react-native';
import { Sun, Clock, Coffee, Droplets, BarChart2, Calendar, Flame, Bell, Trash2 } from 'lucide-react-native';
import { useAppStore, getWeekHistory, LIQUID_MULTIPLIERS } from '../store/useAppStore';
import { FontSizes, Spacing, Radii } from '../theme/tokens';
import { makeStyles, useTheme } from '../theme/ThemeContext';

const DAYS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];
const CHART_H = 180;
const MAX_SCALE = 5000;

type InsightTone = 'teal' | 'coral' | 'sun' | 'plum';

const useStyles = makeStyles(c => ({
  container: { flex: 1, backgroundColor: c.paper },
  content: { paddingBottom: 160 },
  header: { paddingHorizontal: Spacing.screenH, paddingTop: 16, paddingBottom: 8 },
  subtitle: { fontSize: FontSizes.base, fontWeight: '500' as const, color: c.teal700, letterSpacing: 0.5, textTransform: 'uppercase' as const },
  title: { fontSize: FontSizes.h2, fontWeight: '600' as const, color: c.ink, marginTop: 2 },
  statsRow: { flexDirection: 'row' as const, gap: 8, paddingHorizontal: Spacing.screenH, marginBottom: 20 },
  statBox: { flex: 1, borderRadius: Radii.md, padding: 14 },
  statLabel: { fontSize: FontSizes.sm, fontWeight: '600' as const, letterSpacing: 0.5, textTransform: 'uppercase' as const, opacity: 0.75 },
  statValue: { fontSize: FontSizes.h3, fontWeight: '700' as const, marginTop: 2 },
  chartCard: {
    marginHorizontal: Spacing.screenH, backgroundColor: c.white, borderRadius: Radii.lg,
    padding: 20, borderWidth: 1, borderColor: c.line, elevation: 2,
  },
  chartHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 20 },
  sectionLabel: { fontSize: FontSizes.sm, fontWeight: '700' as const, letterSpacing: 1.2, textTransform: 'uppercase' as const, color: c.inkMute },
  chartMeta: { fontSize: FontSizes.base, fontWeight: '600' as const, color: c.teal700 },
  barsContainer: { flexDirection: 'row' as const, alignItems: 'flex-end' as const, height: CHART_H + 40, position: 'relative' as const, gap: 6 },
  goalLine: { position: 'absolute' as const, left: 0, right: 0, height: 1.5, borderStyle: 'dashed' as const, borderWidth: 1, borderColor: c.teal500 },
  barCol: { flex: 1, alignItems: 'center' as const, gap: 4 },
  barTrack: { width: '100%' as const, alignItems: 'center' as const, justifyContent: 'flex-end' as const, height: CHART_H },
  bar: { width: '80%' as const, maxWidth: 28, borderRadius: 6 },
  barValue: { fontSize: 9, fontWeight: '600' as const, color: c.inkMute },
  barDay: { fontSize: FontSizes.base, fontWeight: '600' as const, color: c.inkMute },
  insightSection: { paddingHorizontal: Spacing.screenH, marginTop: 22 },
  insightSectionLabel: { fontSize: FontSizes.sm, fontWeight: '700' as const, letterSpacing: 1.2, textTransform: 'uppercase' as const, color: c.inkMute, marginBottom: 10 },
  insightGap: { gap: 8 },
  insightCard: {
    flexDirection: 'row' as const, gap: 12, alignItems: 'flex-start' as const,
    padding: 14, paddingHorizontal: 16, backgroundColor: c.white,
    borderRadius: Radii.card, borderWidth: 1, borderColor: c.line,
  },
  insightIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center' as const, justifyContent: 'center' as const, flexShrink: 0 },
  insightTitle: { fontSize: FontSizes.body, fontWeight: '600' as const, color: c.ink },
  insightDesc: { fontSize: FontSizes.md, color: c.inkMute, marginTop: 2 },
  ctaBtn: { marginTop: 8, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, alignSelf: 'flex-start' as const },
  ctaText: { fontSize: 12, fontWeight: '700' as const },
  fallback: {
    padding: 16, borderRadius: Radii.card, backgroundColor: c.paper2,
    marginHorizontal: Spacing.screenH, marginTop: 20,
  },
  fallbackText: { fontSize: FontSizes.body, color: c.inkMute, textAlign: 'center' as const },
}));

interface InsightCardProps {
  tone: InsightTone;
  icon: React.ReactNode;
  title: string;
  desc: string;
  cta?: { label: string; onPress: () => void };
}

function InsightCard({ tone, icon, title, desc, cta }: InsightCardProps) {
  const styles = useStyles();
  const { colors } = useTheme();

  const bgMap: Record<InsightTone, string> = {
    teal:  colors.teal50,
    coral: colors.coralSoft,
    sun:   '#fef9e6',
    plum:  '#f3ecfa',
  };
  const fgMap: Record<InsightTone, string> = {
    teal:  colors.teal700,
    coral: colors.coral,
    sun:   '#a07800',
    plum:  colors.plum,
  };

  return (
    <View style={styles.insightCard}>
      <View style={[styles.insightIcon, { backgroundColor: bgMap[tone] }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.insightTitle}>{title}</Text>
        <Text style={styles.insightDesc}>{desc}</Text>
        {cta && (
          <TouchableOpacity style={[styles.ctaBtn, { backgroundColor: bgMap[tone] }]} onPress={cta.onPress} activeOpacity={0.7}>
            <Text style={[styles.ctaText, { color: fgMap[tone] }]}>{cta.label}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export function HistoryScreen({ onGoToReminders }: { onGoToReminders: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const goalMl     = useAppStore(s => s.goalMl);
  const log        = useAppStore(s => s.log);
  const history    = useAppStore(s => s.history);
  const streak     = useAppStore(s => s.streak);
  const bestStreak = useAppStore(s => s.bestStreak);
  const todayMl    = Math.round(useAppStore(s => s.currentMl()));
  const clearHistory        = useAppStore(s => s.clearHistory);
  const setReminderCreatePreset = useAppStore(s => s.setReminderCreatePreset);

  const vals: number[] = getWeekHistory(history, todayMl);
  const hasHistoryData  = Object.keys(history).length > 0;
  const avg    = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  const best   = Math.max(...vals);
  const metCount = vals.filter(v => v >= goalMl).length;
  const dayIndex   = new Date().getDay();
  const mondayFirst = (dayIndex + 6) % 7;
  const shiftedDays = Array.from({ length: 7 }, (_, i) => DAYS[(mondayFirst - 6 + i + 7) % 7]);

  function handleClearHistory() {
    Alert.alert(
      'Limpar histórico',
      'Apaga todos os dados dos dias anteriores. O registro de hoje não é afetado.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Limpar', style: 'destructive', onPress: clearHistory },
      ]
    );
  }

  // ── Compute insights from today's log ──
  const hasData = log.length >= 2;

  // Morning ratio
  const morningMl = log.filter(e => new Date(e.timestamp).getHours() < 12)
    .reduce((s, e) => s + e.ml * LIQUID_MULTIPLIERS[e.type], 0);
  const morningPct = todayMl > 0 ? Math.round((morningMl / todayMl) * 100) : 0;

  // Coffee ratio
  const coffeeMl = log.filter(e => e.type === 'coffee')
    .reduce((s, e) => s + e.ml * LIQUID_MULTIPLIERS[e.type], 0);
  const coffeeRawMl = log.filter(e => e.type === 'coffee').reduce((s, e) => s + e.ml, 0);
  const totalRawMl = log.reduce((s, e) => s + e.ml, 0);
  const coffeePct = totalRawMl > 0 ? Math.round((coffeeRawMl / totalRawMl) * 100) : 0;

  // Average sip
  const avgSip = log.length > 0 ? Math.round(totalRawMl / log.length) : 0;

  // Average interval between sips
  let avgIntervalMin = 0;
  if (log.length >= 2) {
    const diffs = log.slice(1).map((e, i) => (e.timestamp - log[i].timestamp) / 60000);
    avgIntervalMin = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
  }
  const intervalStr = avgIntervalMin > 0 ? `${Math.floor(avgIntervalMin / 60)}h${String(avgIntervalMin % 60).padStart(2, '0')}` : '–';

  // Week comparison (today vs 6-day average from history)
  const pastVals     = vals.slice(0, 6).filter(v => v > 0);
  const lastWeekAvg  = pastVals.length > 0 ? pastVals.reduce((a, b) => a + b, 0) / pastVals.length : 0;
  const weekChangePct = lastWeekAvg > 0 ? Math.round(((todayMl - lastWeekAvg) / lastWeekAvg) * 100) : 0;

  function handleReminderCTA() {
    setReminderCreatePreset('14:30');
    onGoToReminders();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }]}>
        <View>
          <Text style={styles.subtitle}>ÚLTIMOS 7 DIAS</Text>
          <Text style={styles.title}>Como foi sua semana</Text>
        </View>
        {hasHistoryData && (
          <TouchableOpacity
            onPress={handleClearHistory}
            activeOpacity={0.7}
            style={{ padding: 8, borderRadius: 10, backgroundColor: colors.paper2 }}
          >
            <Trash2 size={18} color={colors.coral} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.statsRow}>
        {[
          { label: 'Média',  value: `${(avg/1000).toFixed(1)}L`,  bg: colors.teal50,    fg: colors.teal900 },
          { label: 'Melhor', value: `${(best/1000).toFixed(1)}L`, bg: colors.coralSoft, fg: colors.coral },
          { label: 'Metas',  value: `${metCount}/7`,              bg: '#fef9e6',         fg: '#a07800' },
        ].map(({ label, value, bg, fg }) => (
          <View key={label} style={[styles.statBox, { backgroundColor: bg }]}>
            <Text style={[styles.statLabel, { color: fg }]}>{label}</Text>
            <Text style={[styles.statValue, { color: fg }]}>{value}</Text>
          </View>
        ))}
      </View>

      {/* Chart */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.sectionLabel}>ÁGUA INGERIDA POR DIA</Text>
          <Text style={styles.chartMeta}>meta {(goalMl/1000).toFixed(0)}L</Text>
        </View>
        <View style={styles.barsContainer}>
          <View style={[styles.goalLine, { bottom: (goalMl / MAX_SCALE) * CHART_H }]} />
          {vals.map((v, i) => {
            const isToday = i === 6;
            const barH = Math.max(4, Math.min(v, MAX_SCALE) / MAX_SCALE * CHART_H);
            const barBg = isToday ? colors.coral : v >= goalMl ? colors.teal500 : colors.teal300;
            return (
              <View key={i} style={styles.barCol}>
                <Text style={styles.barValue}>{(v/1000).toFixed(1)}L</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.bar, { height: barH, backgroundColor: barBg, opacity: v === 0 ? 0.3 : 1 }]} />
                </View>
                <Text style={[styles.barDay, isToday ? { color: colors.coral, fontWeight: '700' } : {}]}>{shiftedDays[i]}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {!hasData ? (
        <View style={styles.fallback}>
          <Text style={styles.fallbackText}>Registre pelo menos 2 goles hoje pra ver seus padrões 💧</Text>
        </View>
      ) : (
        <>
          {/* Seção 1 — Padrões da semana */}
          <View style={styles.insightSection}>
            <Text style={styles.insightSectionLabel}>PADRÕES DA SEMANA</Text>
            <View style={styles.insightGap}>
              <InsightCard
                tone="teal"
                icon={<Sun size={20} color={colors.teal700} />}
                title="Você bebe mais de manhã"
                desc={`${morningPct}% da meta vem antes do meio-dia. Nada mal.`}
              />
              <InsightCard
                tone="coral"
                icon={<Clock size={20} color={colors.coral} />}
                title="Cuidado no fim de tarde"
                desc="Entre 15h e 18h você belisca. Um lembrete pode ajudar."
              />
              {coffeePct > 0 && (
                <InsightCard
                  tone="sun"
                  icon={<Coffee size={20} color="#a07800" />}
                  title={`Café tá puxando ${coffeePct}% dos líquidos`}
                  desc="Ok pra caramba, mas puxa mais água pura."
                />
              )}
              {avgSip > 0 && (
                <InsightCard
                  tone="plum"
                  icon={<Droplets size={20} color={colors.plum} />}
                  title={`Gole médio: ${avgSip}ml`}
                  desc="Copos um pouco maiores te tirariam da meta mais rápido."
                />
              )}
              {avgIntervalMin > 0 && (
                <InsightCard
                  tone="teal"
                  icon={<Clock size={20} color={colors.teal700} />}
                  title={`Você bebe a cada ${intervalStr}`}
                  desc="Intervalo bonito. Acima de 2h vira sede acumulada."
                />
              )}
            </View>
          </View>

          {/* Seção 2 — Comparativos */}
          <View style={styles.insightSection}>
            <Text style={styles.insightSectionLabel}>COMPARATIVOS</Text>
            <View style={styles.insightGap}>
              <InsightCard
                tone="teal"
                icon={<BarChart2 size={20} color={colors.teal700} />}
                title={`${weekChangePct >= 0 ? '+' : ''}${weekChangePct}% vs semana passada`}
                desc={`Média de ${(lastWeekAvg/1000).toFixed(1)}L → hoje ${(todayMl/1000).toFixed(1)}L.`}
              />
              <InsightCard
                tone="coral"
                icon={<BarChart2 size={20} color={colors.coral} />}
                title="Dias úteis > fim de semana"
                desc="Você se hidrata melhor quando tem rotina. Fim de semana pede atenção."
              />
              <InsightCard
                tone="sun"
                icon={<Calendar size={20} color="#a07800" />}
                title={`${new Date().toLocaleString('pt-BR', { month: 'long' })[0].toUpperCase() + new Date().toLocaleString('pt-BR', { month: 'long' }).slice(1)}: ${metCount} dias na meta`}
                desc="Continue assim — a consistência é o que mais importa."
              />
              <InsightCard
                tone="plum"
                icon={<Flame size={20} color={colors.plum} />}
                title={`Sequência atual: ${streak} dias`}
                desc={bestStreak > streak ? `Seu recorde é ${bestStreak}. Faltam ${bestStreak - streak} pra empatar.` : 'Continue assim! 🔥'}
              />
            </View>
          </View>

          {/* Seção 3 — Recomendações */}
          <View style={styles.insightSection}>
            <Text style={styles.insightSectionLabel}>RECOMENDAÇÕES</Text>
            <View style={styles.insightGap}>
              <InsightCard
                tone="coral"
                icon={<Bell size={20} color={colors.coral} />}
                title="Esquece entre 14h e 16h"
                desc="Quer que eu coloque um lembrete às 14:30?"
                cta={{ label: 'Configurar lembrete', onPress: handleReminderCTA }}
              />
              <InsightCard
                tone="teal"
                icon={<Sun size={20} color={colors.teal700} />}
                title="Manhã = chave"
                desc="Quando bebe antes das 8h, você bate a meta com mais facilidade."
              />
              <InsightCard
                tone="sun"
                icon={<Droplets size={20} color="#a07800" />}
                title={`${getDayOfWeekLabel()} pode ser melhor`}
                desc="Um copo extra no almoço pode fazer diferença no dia mais fraco."
              />
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

function getDayOfWeekLabel(): string {
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return days[new Date().getDay()];
}
