import { router } from 'expo-router';

/**
 * Opens the decision sheet once. The dock button and the automatic opening can both ask at
 * the same moment; only the first push counts until the sheet mounts or a second has passed.
 */
let mounted = 0;
let lastPush = 0;

export function openDecide(): void {
  if (mounted > 0 || Date.now() - lastPush < 1000) return;
  lastPush = Date.now();
  router.push('/decide');
}

export function decideMounted(on: boolean): void {
  mounted = Math.max(0, mounted + (on ? 1 : -1));
  if (!on) lastPush = 0;
}
