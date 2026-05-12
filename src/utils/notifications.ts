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
 * Cancela todas as notificações agendadas e reagenda
 * apenas os reminders ativos, usando o trigger DAILY correto.
 */
export async function scheduleReminders(reminders: Reminder[]): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
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
}

/**
 * Agenda notificação diária às 23h para o resumo do dia.
 * Cancela a anterior antes de reagendar.
 */
export async function scheduleRecapNotification(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if (n.content.data?.type === 'recap') {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
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
 * Reagenda notificações ao abrir o app se o usuário já autorizou.
 * Garante que após reinstalar o APK os lembretes continuem funcionando.
 */
export async function rescheduleOnStartup(
  notificationsEnabled: boolean,
  reminders: Reminder[]
): Promise<void> {
  if (!notificationsEnabled) return;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;
    // Só reagenda se não houver notificações já agendadas (ex: primeiro boot após reinstall)
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    if (scheduled.length === 0) {
      await scheduleReminders(reminders);
    }
  } catch {
    // Fail silently — notificações são não-críticas
  }
}
