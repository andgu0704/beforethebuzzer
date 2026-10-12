import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { useSettings } from '@/state/settings';

export type HapticKind = 'selection' | 'light' | 'success' | 'warning' | 'heavy';

/** The five haptics of §10.4, silenced by the setting and on the web. */
export function haptic(kind: HapticKind): void {
  if (Platform.OS === 'web' || !useSettings.getState().haptics) return;
  switch (kind) {
    case 'selection':
      void Haptics.selectionAsync();
      return;
    case 'light':
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    case 'heavy':
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      return;
    case 'success':
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    case 'warning':
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
  }
}
