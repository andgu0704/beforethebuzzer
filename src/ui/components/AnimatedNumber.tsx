import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';
import type { TextStyle } from 'react-native';

import { motion, type TypeVariant } from '../theme/tokens';
import { Text } from './Text';

/** A number that counts to its new value over `motion.count`; jumps under reduced motion. */
export function AnimatedNumber({
  value,
  variant = 'stat',
  format = (n: number) => String(Math.round(n)),
  style,
  from: start,
}: {
  readonly value: number;
  readonly variant?: TypeVariant | undefined;
  readonly format?: (n: number) => string | undefined;
  readonly style?: TextStyle | undefined;
  /** Count up from this value on first show instead of starting at `value`. */
  readonly from?: number | undefined;
}) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(start ?? value);
  const from = useRef(start ?? value);
  useEffect(() => {
    if (reduced || from.current === value) {
      from.current = value;
      setShown(value);
      return;
    }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = () => {
      const k = Math.min(1, (performance.now() - start) / motion.count);
      const eased = 1 - (1 - k) ** 3;
      setShown(a + (value - a) * eased);
      if (k < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      from.current = value;
    };
  }, [value, reduced]);
  return (
    <Text variant={variant} tabular style={style}>
      {format(shown)}
    </Text>
  );
}
