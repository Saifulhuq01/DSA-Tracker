'use client';

import { MotionConfig } from 'motion/react';

/** App-wide motion defaults. `reducedMotion="user"` honours the OS "reduce motion" setting. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </MotionConfig>
  );
}
