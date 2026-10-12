import * as Sharing from 'expo-sharing';
import type { RefObject } from 'react';
import { Platform, type View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

/** Renders the card to a PNG and opens the system share sheet, offline. */
export async function shareView(ref: RefObject<View | null>, title: string): Promise<boolean> {
  if (Platform.OS === 'web' || !ref.current) return false;
  if (!(await Sharing.isAvailableAsync())) return false;
  const uri = await captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' });
  await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: title, UTI: 'public.png' });
  return true;
}
