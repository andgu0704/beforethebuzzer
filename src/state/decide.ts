import { router } from 'expo-router';

/**
 * Opens the decision sheet once. The dock button and the automatic opening can both ask at
 * the same moment; only the first push counts until the sheet mounts or a second has passed.
 */
let mounted = false;
let lastPush = 0;

export function openDecide(): void {
  if (mounted || Date.now() - lastPush < 1000) return;
  lastPush = Date.now();
  router.push('/decide');
}

export function decideMounted(on: boolean): void {
  mounted = on;
  if (!on) lastPush = 0;
}
