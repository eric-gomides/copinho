import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import type { Reminder } from '../store/useAppStore';

/**
 * Configura o handler global de notificações.
 * Deve ser chamado uma vez no App.tsx, não dentro de componentes.
 */
export function setupNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Cancela tudo e reagenda lembretes ativos + notificação de recap das 23h.
 * Fonte única de verdade — toda alteração de lembretes deve passar por aqui.
 */
export async function scheduleReminders(reminders: Reminder[]): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Lembretes do usuário
  for (const r of reminders) {
    if (!r.on) continue;
    const [hour, minute] = r.time.split(':').map(Number);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💧 Hora de beber água!',
        body: r.msg,
        sound: true,
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  }

  // Notificação diária do recap (23h) — sempre inclusa quando lembretes estão ativos
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📊 Copinho fez seu boletim',
      body: 'Bora ver como foi seu dia de hidratação?',
      sound: true,
      data: { type: 'recap' },
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DAILY,
      hour: 23,
      minute: 0,
    },
  });
}

/**
 * Reagenda tudo ao abrir o app, garantindo consistência após reinstalação.
 * Não verifica o count antes — reagendar é idempotente e mais seguro.
 */
export async function rescheduleOnStartup(
  notificationsEnabled: boolean,
  reminders: Reminder[]
): Promise<void> {
  if (!notificationsEnabled) return;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;
    await scheduleReminders(reminders);
  } catch {
    // Fail silently — notificações são não-críticas
  }
}
