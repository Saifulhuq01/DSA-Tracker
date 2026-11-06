'use client';

import { motion } from 'motion/react';

// Re-mounts on every navigation → a soft cross-fade between pages.
// Opacity only: a transform here would break position: fixed modals and sticky headers.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35, ease: 'easeOut' }}>
      {children}
    </motion.div>
  );
}
