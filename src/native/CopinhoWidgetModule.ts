import { NativeModules, Platform } from 'react-native';

const { CopinhoWidgetModule } = NativeModules;

export function updateWidget(currentMl: number, goalMl: number): void {
  if (Platform.OS !== 'android' || !CopinhoWidgetModule) return;
  CopinhoWidgetModule.updateWidget(currentMl, goalMl).catch(() => {});
}
