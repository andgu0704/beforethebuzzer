import { EmptyState } from '@/ui/components/Layout';
import { useT } from '@/ui/i18n';

/** What release builds get instead of God Mode: nothing to open. */
export const GOD_MODE_AVAILABLE: boolean = false;

export function GodModeScreen() {
  const { t } = useT();
  return <EmptyState title={t('ui.godmode.unavailable')} />;
}

export const StyleGuideScreen = GodModeScreen;
export const PortraitLabScreen = GodModeScreen;

export function PerfOverlay() {
  return null;
}
