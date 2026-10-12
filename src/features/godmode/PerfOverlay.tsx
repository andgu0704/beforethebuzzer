import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePerf } from '@/state/perf';
import { Text } from '@/ui/components/Text';

/** Frames per second on the JS thread, and the last engine and save timings. */
export function PerfOverlay() {
  const on = usePerf((p) => p.overlay);
  const engine = usePerf((p) => p.lastEngineMs);
  const save = usePerf((p) => p.lastSaveMs);
  const insets = useSafeAreaInsets();
  const [fps, setFps] = useState(0);
  useEffect(() => {
    if (!on) return;
    let frames = 0;
    let start = performance.now();
    let raf = 0;
    const loop = () => {
      frames++;
      const now = performance.now();
      if (now - start >= 1000) {
        setFps(Math.round((frames * 1000) / (now - start)));
        frames = 0;
        start = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
    };
  }, [on]);
  if (!on) return null;
  return (
    <View pointerEvents="none" style={[styles.box, { top: insets.top + 4 }]}>
      <Text variant="caption" style={styles.text}>
        {`JS ${fps} fps · engine ${Math.round(engine)} ms · save ${Math.round(save)} ms`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    position: 'absolute',
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  text: { color: '#4CC38A' },
});
