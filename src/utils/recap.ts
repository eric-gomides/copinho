import type { DrinkEntry } from '../store/useAppStore';
import { LIQUID_MULTIPLIERS } from '../store/useAppStore';

// ─── Types ──────────────────────────────────────────────────

export interface DayStats {
  ml: number;
  goalMl: number;
  pct: number;
  sips: number;
  avgSip: number;
  firstTime: string | null;
  lastTime: string | null;
  avgGapStr: string;
  morningPct: number;
  lateNightPct: number;
  notes: string[];
  streak: number;
  bestStreak: number;
  date: Date;
}

export type Scenario = 'champion' | 'flood' | 'almost' | 'dry';

// ─── Compute stats from raw log ──────────────────────────────

export function computeDayStats(
  log: DrinkEntry[],
  goalMl: number,
  streak: number,
  bestStreak: number,
  date = new Date(),
): DayStats {
  const ml = log.reduce((s, e) => s + e.ml * LIQUID_MULTIPLIERS[e.type], 0);
  const pct = goalMl > 0 ? ml / goalMl : 0;
  const sips = log.length;
  const totalRaw = log.reduce((s, e) => s + e.ml, 0);
  const avgSip = sips > 0 ? Math.round(totalRaw / sips) : 0;

  const sorted = [...log].sort((a, b) => a.timestamp - b.timestamp);
  const fmt = (ts: number) =>
    new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const firstTime = sorted.length > 0 ? fmt(sorted[0].timestamp) : null;
  const lastTime  = sorted.length > 0 ? fmt(sorted[sorted.length - 1].timestamp) : null;

  let avgGapStr = '—';
  if (sorted.length >= 2) {
    const diffs = sorted.slice(1).map((e, i) => (e.timestamp - sorted[i].timestamp) / 60000);
    const avgMin = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
    avgGapStr = `${Math.floor(avgMin / 60)}h${String(avgMin % 60).padStart(2, '0')}`;
  }

  const morningMl = log
    .filter(e => new Date(e.timestamp).getHours() < 12)
    .reduce((s, e) => s + e.ml * LIQUID_MULTIPLIERS[e.type], 0);
  const morningPct = ml > 0 ? morningMl / ml : 0;

  const lateNightMl = log
    .filter(e => new Date(e.timestamp).getHours() >= 21)
    .reduce((s, e) => s + e.ml * LIQUID_MULTIPLIERS[e.type], 0);
  const lateNightPct = ml > 0 ? lateNightMl / ml : 0;

  const coffees = log.filter(e => e.type === 'coffee').length;
  const teas    = log.filter(e => e.type === 'tea').length;
  const allWater = sips > 0 && log.every(e => e.type === 'water');
  const noCoffee = sips > 0 && !log.some(e => e.type === 'coffee');
  const notes: string[] = [];
  if (coffees > 0) notes.push(`${coffees} café${coffees > 1 ? 's' : ''} conta${coffees > 1 ? 'm' : ''} 60%`);
  if (teas > 0)    notes.push(`${teas} chá${teas > 1 ? 's' : ''} conta${teas > 1 ? 'm' : ''} 90%`);
  if (allWater)    notes.push('tudo água — pelo menos isso');
  if (noCoffee && !allWater) notes.push('zero café');

  return { ml, goalMl, pct, sips, avgSip, firstTime, lastTime, avgGapStr, morningPct, lateNightPct, notes, streak, bestStreak, date };
}

// ─── Scenario selection ──────────────────────────────────────

export function pickScenario(stats: DayStats): Scenario {
  if (stats.pct >= 1.25) return 'flood';
  if (stats.pct >= 1.0)  return 'champion';
  if (stats.pct >= 0.7)  return 'almost';
  return 'dry';
}

// ─── Scenario UI config ──────────────────────────────────────

export const SCENARIO_CONFIG: Record<Scenario, {
  headerBg: string;
  emoji: string;
  chipBg: string;
  chipFg: string;
  getTitle: (s: DayStats) => string;
  getSub: (s: DayStats) => string;
}> = {
  champion: {
    headerBg:  '#1a8273',
    emoji:     '🏆',
    chipBg:    '#edf8f4',
    chipFg:    '#1a8273',
    getTitle:  () => 'Dia de campeão',
    getSub:    s => s.lastTime ? `Bateu meta às ${s.lastTime}.` : 'Meta batida. Missão cumprida.',
  },
  flood: {
    headerBg:  '#1b5e8a',
    emoji:     '🌊',
    chipBg:    '#e5f4fc',
    chipFg:    '#1b5e8a',
    getTitle:  s => s.ml >= 6000 ? 'Calma, peixe' : 'Vai acabar a água do mundo assim',
    getSub:    s => s.ml >= 6000
      ? `${(s.ml / 1000).toFixed(1)}L. Sério mesmo? Tudo bem?`
      : `Passou ${Math.round((s.pct - 1) * 100)}% da meta. Calma, peixe.`,
  },
  almost: {
    headerBg:  '#b8700a',
    emoji:     '😬',
    chipBg:    '#fef9e6',
    chipFg:    '#8a6200',
    getTitle:  s => s.pct >= 0.85 ? 'Quase lá' : 'Dia morno',
    getSub:    s => s.pct >= 0.85 ? 'Faltou um copo. Literalmente.' : 'Dá pra mais. A gente sabe.',
  },
  dry: {
    headerBg:  '#7a5040',
    emoji:     '🏜️',
    chipBg:    '#f5ede9',
    chipFg:    '#8a4f3a',
    getTitle:  s => s.sips === 0 ? 'Sumido' : 'Sequinho',
    getSub:    s => s.sips === 0 ? 'Cliquei aqui só pra saber se tu tá vivo.' : 'Esqueceu de mim hoje?',
  },
};

// ─── Insight selection (priority list) ───────────────────────

export function pickInsight(stats: DayStats, history: number[]): string {
  const { ml, pct, morningPct, lateNightPct, sips, streak, bestStreak } = stats;

  if (sips === 0) return 'Volta amanhã. Hoje não contou.';

  // 1. Personal record
  if (history.length > 0 && ml > Math.max(...history)) {
    return 'Recorde pessoal de consumo. Melhor dia até agora.';
  }

  // 2. Morning strong
  if (morningPct >= 0.8 && sips >= 2) {
    return `Você é Time Manhã. ${Math.round(morningPct * 100)}% da hidratação antes do meio-dia.`;
  }

  // 3. Late-night rush
  if (lateNightPct >= 0.4 && sips >= 2) {
    return `Hidratou correndo no fim. ${Math.round(lateNightPct * 100)}% depois das 21h.`;
  }

  // 4. Streak broken
  if (bestStreak >= 3 && streak === 0 && pct < 1) {
    return `Streak de ${bestStreak} dias acabou. Recomeça amanhã.`;
  }

  // 5. Week comparison
  if (history.length >= 3) {
    const avg = history.reduce((a, b) => a + b, 0) / history.length;
    const diff = avg > 0 ? (ml - avg) / avg : 0;
    if (Math.abs(diff) > 0.15) {
      return `Você bebeu ${diff > 0 ? 'mais' : 'menos'} que ${Math.round(Math.abs(diff) * 100)}% da sua média semanal.`;
    }
  }

  return 'Dia mediano. Sem drama.';
}

// ─── Share text ──────────────────────────────────────────────

export function buildShareText(stats: DayStats, insight: string): string {
  const { ml, pct, sips, firstTime, lastTime, streak, date } = stats;
  const d = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
  const pctStr = Math.min(Math.round(pct * 100), 999);

  return [
    `💧 Copinho · ${d}`,
    '',
    `Bebi ${(ml / 1000).toFixed(1)}L hoje (${pctStr}% da meta)`,
    `${sips} goles, primeiro às ${firstTime ?? '—'}, último às ${lastTime ?? '—'}`,
    streak > 0 ? `Sequência: ${streak} dias 🔥` : 'Sem sequência hoje',
    '',
    `"${insight}"`,
    '',
    '— enviado pelo Copinho',
  ].join('\n');
}
