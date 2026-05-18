import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { writeHydrationRecord } from '../utils/healthConnect';
import { updateWidget } from '../native/CopinhoWidgetModule';
import { playDrop, playFanfare, setMuted } from '../utils/sounds';
import type { BottleColorId, BottleShapeId } from '../theme/colorShades';

// ─── Types ──────────────────────────────────────────────────

export type LiquidType = 'water' | 'tea' | 'coconut' | 'coffee' | 'juice';
export type Screen = 'onboarding' | 'home' | 'history' | 'badges' | 'reminders' | 'personalize' | 'recap';

export interface DrinkEntry {
  id: string;
  timestamp: number;
  ml: number;
  type: LiquidType;
}

export interface Reminder {
  id: number;
  time: string;
  label: string;
  msg: string;
  on: boolean;
  template: boolean;
}

export type BadgeIcon =
  | 'drop' | 'trophy' | 'flame' | 'sun' | 'leaf' | 'bolt' | 'moon'
  | 'calendar' | 'star' | 'medal' | 'waves' | 'sparkle' | 'shield' | 'coffee';

export interface BadgeDef {
  id: string;
  kind: 'daily' | 'weekly' | 'monthly';
  name: string;
  desc: string;
  icon: BadgeIcon;
}

// ─── Constants ──────────────────────────────────────────────

export const LIQUID_MULTIPLIERS: Record<LiquidType, number> = {
  water: 1.0, tea: 0.9, coconut: 1.0, coffee: 0.6, juice: 0.7,
};

export const LIQUID_TYPES: { id: LiquidType; label: string; hint: string; color: string }[] = [
  { id: 'water',   label: 'Água pura',   hint: '100% conta', color: '#2ea395' },
  { id: 'tea',     label: 'Chá',          hint: 'conta 90%',  color: '#1a8273' },
  { id: 'coconut', label: 'Água de coco', hint: '100% conta', color: '#c6eddb' },
  { id: 'coffee',  label: 'Café',         hint: 'conta 60%',  color: '#556361' },
  { id: 'juice',   label: 'Suco',         hint: 'conta 70%',  color: '#f7d97a' },
];

export const CUP_PRESETS: { id: string; label: string; ml: number }[] = [
  { id: 'glass',  label: 'Copinho', ml: 200 },
  { id: 'cup',    label: 'Copo',    ml: 300 },
  { id: 'mug',    label: 'Caneca',  ml: 400 },
  { id: 'bottle', label: 'Garrafa', ml: 500 },
];

export const ALL_BADGES: BadgeDef[] = [
  // Diárias (7)
  { id: 'first',     kind: 'daily',   name: 'Primeiro gole',      desc: 'Registrou o primeiro copo',           icon: 'drop'     },
  { id: 'goal',      kind: 'daily',   name: 'Meta cumprida',      desc: 'Bateu a meta em um dia',              icon: 'trophy'   },
  { id: 'early',     kind: 'daily',   name: 'Passarinho',          desc: '500ml antes das 8h',                  icon: 'sun'      },
  { id: 'pure',      kind: 'daily',   name: 'Só água',             desc: 'Dia inteiro só água pura',            icon: 'leaf'     },
  { id: 'mega',      kind: 'daily',   name: '5L boss',             desc: 'Passou de 5L em um dia',              icon: 'bolt'     },
  { id: 'night',     kind: 'daily',   name: 'Coruja',              desc: 'Último copo depois das 22h',          icon: 'moon'     },
  { id: 'rhythm',    kind: 'daily',   name: 'Ritmo certo',         desc: '6+ goles bem espaçados',              icon: 'drop'     },
  // Semanais (6)
  { id: 'streak3',   kind: 'weekly',  name: 'Tri-dia',             desc: '3 dias seguidos na meta',             icon: 'flame'    },
  { id: 'streak7',   kind: 'weekly',  name: 'Semana hidratada',    desc: '7 dias seguidos na meta',             icon: 'flame'    },
  { id: 'week40',    kind: 'weekly',  name: 'Maratona líquida',    desc: '28L+ na semana',                       icon: 'waves'    },
  { id: 'weekend',   kind: 'weekly',  name: 'Fim de semana firme', desc: 'Meta no sábado e domingo',            icon: 'calendar' },
  { id: 'weekearly', kind: 'weekly',  name: 'Madrugadora',          desc: '5 manhãs começando antes das 8h',     icon: 'sun'      },
  { id: 'nocoffee',  kind: 'weekly',  name: 'Sem cafué',            desc: 'Semana inteira sem café (heh)',       icon: 'coffee'   },
  // Mensais (6)
  { id: 'month20',   kind: 'monthly', name: '20 em 30',     desc: '20+ dias batendo meta no mês',        icon: 'medal'    },
  { id: 'month30',   kind: 'monthly', name: 'Mês perfeito', desc: '30 dias seguidos na meta',            icon: 'calendar' },
  { id: 'month150',  kind: 'monthly', name: 'Tanque cheio', desc: '120L+ no mês',                        icon: 'waves'    },
  { id: 'newrec',    kind: 'monthly', name: 'Novo recorde', desc: 'Bateu o seu pessoal anterior',        icon: 'star'     },
  { id: 'consist',   kind: 'monthly', name: 'Constante',    desc: 'Variância diária abaixo de 500ml',    icon: 'shield'   },
  { id: 'evolve',    kind: 'monthly', name: 'Em evolução',  desc: 'Volume médio cresceu vs mês passado', icon: 'sparkle'  },
];

export const DEFAULT_REMINDERS: Reminder[] = [
  { id: 1, time: '07:30', label: 'Ao acordar',        on: true,  msg: '300ml antes do café',     template: true },
  { id: 2, time: '10:00', label: 'Meio da manhã',     on: true,  msg: 'Hora do refil 💦',          template: true },
  { id: 3, time: '12:30', label: 'Almoço',             on: true,  msg: 'Um copão antes de comer', template: true },
  { id: 4, time: '15:00', label: 'Meio da tarde',     on: true,  msg: 'Você tá indo bem!',         template: true },
  { id: 5, time: '17:30', label: 'Fim de expediente', on: false, msg: 'Recompensa líquida',        template: true },
  { id: 6, time: '20:00', label: 'Jantar',             on: true,  msg: 'Reta final do dia',        template: true },
];

// ─── History helpers ─────────────────────────────────────────

/** Chave de data no formato YYYY-MM-DD */
export function dateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Retorna array de 7 valores (últimos 6 dias + hoje).
 * Dias sem registro retornam 0.
 */
export function getWeekHistory(history: Record<string, number>, todayMl: number): number[] {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return i === 6 ? Math.round(todayMl) : (history[dateKey(d)] ?? 0);
  });
}

// ─── Store ──────────────────────────────────────────────────

interface AppState {
  log: DrinkEntry[];
  history: Record<string, number>;   // 'YYYY-MM-DD' → ml total do dia
  goalMl: number;
  streak: number;
  bestStreak: number;
  unlockedBadges: string[];
  showCelebration: boolean;
  reminders: Reminder[];
  notificationsEnabled: boolean;
  hasOnboarded: boolean;
  goalMetToday: boolean;
  soundsMuted: boolean;
  bottleColor: BottleColorId;
  bottleShape: BottleShapeId;

  reminderCreatePreset: string | null;

  currentMl: () => number;
  pct: () => number;

  addDrink: (ml: number, type: LiquidType) => boolean;
  removeEntry: (id: string) => void;
  dismissCelebration: () => void;
  toggleReminder: (id: number) => void;
  updateReminder: (id: number, patch: Partial<Reminder>) => void;
  addReminders: (list: Omit<Reminder, 'id'>[], replace: boolean) => void;
  removeReminder: (id: number) => void;
  setNotificationsEnabled: (v: boolean) => void;
  completeOnboarding: () => void;
  checkAndUnlockBadges: () => void;
  setGoalMl: (g: number) => void;
  setSoundsMuted: (v: boolean) => void;
  setBottleColor: (c: BottleColorId) => void;
  setBottleShape: (s: BottleShapeId) => void;
  setReminderCreatePreset: (time: string | null) => void;
  clearHistory: () => void;
}

const calcCurrentMl = (log: DrinkEntry[]) =>
  log.reduce((s, e) => s + e.ml * LIQUID_MULTIPLIERS[e.type], 0);

function computeNewBadges(
  existing: string[],
  log: DrinkEntry[],
  streak: number,
  goalMl: number,
): string[] {
  const total = calcCurrentMl(log);
  const now = new Date();
  const hour = now.getHours();
  const gained: string[] = [];

  const add = (id: string) => {
    if (!existing.includes(id) && !gained.includes(id)) gained.push(id);
  };

  if (log.length >= 1)                                       add('first');
  if (total >= goalMl)                                       add('goal');
  if (streak >= 3)                                           add('streak3');
  if (streak >= 7)                                           add('streak7');
  if (total > 5000)                                          add('mega');
  // 500ml before 8am
  const earlyMl = log
    .filter(e => new Date(e.timestamp).getHours() < 8)
    .reduce((s, e) => s + e.ml * LIQUID_MULTIPLIERS[e.type], 0);
  if (earlyMl >= 500)                                        add('early');
  // all water
  if (log.length > 0 && log.every(e => e.type === 'water')) add('pure');
  // entry after 22h
  if (log.some(e => new Date(e.timestamp).getHours() >= 22)) add('night');

  return gained;
}

// ─── Helpers ────────────────────────────────────────────────

function isToday(timestamp: number): boolean {
  const d = new Date(timestamp);
  const now = new Date();
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate();
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
  log: [],
  history: {},
  goalMl: 4000,
  streak: 0,
  bestStreak: 0,
  unlockedBadges: [],
  showCelebration: false,
  reminders: DEFAULT_REMINDERS,
  notificationsEnabled: true,
  hasOnboarded: false,
  goalMetToday: false,
  soundsMuted: false,
  bottleColor: 'aqua' as BottleColorId,
  bottleShape: 'classic' as BottleShapeId,
  reminderCreatePreset: null,

  currentMl: () => calcCurrentMl(get().log),
  pct: () => Math.min(calcCurrentMl(get().log) / get().goalMl, 1),

  addDrink: (ml, type) => {
    const { log, goalMl, streak, bestStreak, goalMetToday, unlockedBadges } = get();
    const before = calcCurrentMl(log);
    const added = ml * LIQUID_MULTIPLIERS[type];
    const crossedGoal = !goalMetToday && before < goalMl && before + added >= goalMl;
    const newStreak = crossedGoal ? streak + 1 : streak;
    const newLog = [...log, { id: Date.now().toString(), timestamp: Date.now(), ml, type }];
    const newBadges = computeNewBadges(unlockedBadges, newLog, newStreak, goalMl);

    const newCurrentMl = calcCurrentMl(newLog);
    set({
      log: newLog,
      showCelebration: crossedGoal,
      streak: newStreak,
      bestStreak: Math.max(bestStreak, newStreak),
      goalMetToday: goalMetToday || crossedGoal,
      unlockedBadges: [...unlockedBadges, ...newBadges],
    });

    // Side effects (fire-and-forget)
    writeHydrationRecord(ml);
    updateWidget(newCurrentMl, goalMl);
    if (crossedGoal) {
      playDrop();
      setTimeout(() => playFanfare(), 180);
    } else {
      playDrop();
    }

    return crossedGoal;
  },

  removeEntry: (id) => set(state => ({ log: state.log.filter(e => e.id !== id) })),
  dismissCelebration: () => set({ showCelebration: false }),

  toggleReminder: (id) =>
    set(state => ({
      reminders: state.reminders.map(r => r.id === id ? { ...r, on: !r.on } : r),
    })),

  updateReminder: (id, patch) =>
    set(state => ({
      reminders: state.reminders
        .map(r => r.id === id ? { ...r, ...patch } : r)
        .sort((a, b) => a.time.localeCompare(b.time)),
    })),

  addReminders: (list, replace) =>
    set(state => {
      const base = replace ? [] : state.reminders;
      const maxId = state.reminders.reduce((m, r) => Math.max(m, r.id), 0);
      const newOnes = list.map((r, i) => ({ ...r, id: maxId + i + 1 }));
      return {
        reminders: [...base, ...newOnes].sort((a, b) => a.time.localeCompare(b.time)),
      };
    }),

  removeReminder: (id) =>
    set(state => ({ reminders: state.reminders.filter(r => r.id !== id) })),

  setNotificationsEnabled: (v) => set({ notificationsEnabled: v }),

  completeOnboarding: () => set({ hasOnboarded: true }),

  checkAndUnlockBadges: () => {
    const { log, streak, goalMl, unlockedBadges } = get();
    const gained = computeNewBadges(unlockedBadges, log, streak, goalMl);
    if (gained.length > 0) set({ unlockedBadges: [...unlockedBadges, ...gained] });
  },

  setGoalMl: (g) => set({
    goalMl: Math.max(1500, Math.min(6000, g)),
    // Reset goalMetToday so the user can hit the new goal today
    goalMetToday: false,
    showCelebration: false,
  }),

  setSoundsMuted: (v) => {
    setMuted(v);
    set({ soundsMuted: v });
  },

  setBottleColor: (c) => set({ bottleColor: c }),
  setBottleShape: (s) => set({ bottleShape: s }),
  setReminderCreatePreset: (time) => set({ reminderCreatePreset: time }),
  clearHistory: () => set({ history: {} }),
    }),
    {
      name: 'copinho-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Exclude transient UI state and non-serializable functions
      partialize: (state) => ({
        log:                 state.log,
        history:             state.history,
        goalMl:              state.goalMl,
        streak:              state.streak,
        bestStreak:          state.bestStreak,
        unlockedBadges:      state.unlockedBadges,
        reminders:           state.reminders,
        notificationsEnabled:state.notificationsEnabled,
        hasOnboarded:        state.hasOnboarded,
        goalMetToday:        state.goalMetToday,
        soundsMuted:         state.soundsMuted,
        bottleColor:         state.bottleColor,
        bottleShape:         state.bottleShape,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const todayLog = state.log.filter(e => isToday(e.timestamp));
        const newDay = state.log.length > 0 && todayLog.length === 0;

        if (newDay) {
          // Salva total de ontem antes de limpar o log
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const key = dateKey(yesterday);
          const yesterdayMl = Math.round(calcCurrentMl(state.log));
          if (yesterdayMl > 0) {
            // Mantém só os últimos 90 dias
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 90);
            const cutoffKey = dateKey(cutoff);
            const pruned = Object.fromEntries(
              Object.entries(state.history ?? {}).filter(([k]) => k >= cutoffKey)
            );
            state.history = { ...pruned, [key]: yesterdayMl };
          }
          state.goalMetToday = false;
        }

        state.log = todayLog;
        state.history = state.history ?? {};
        // Migra reminders sem o campo template
        state.reminders = state.reminders.map(r => ({
          ...r,
          template: r.template ?? (r.id >= 1 && r.id <= 6),
        }));
        if (state.soundsMuted) setMuted(true);
      },
    }
  )
);
