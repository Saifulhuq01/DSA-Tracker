'use client';

// Shared motion primitives. Keep animations short, eased, and purposeful:
// things enter, numbers count, bars grow, selections slide.
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { motion, useInView, useMotionValue, useReducedMotion, useSpring, useTransform, type Variants } from 'motion/react';
import type { ProblemStatus } from '@/data/topics';

export const EASE = [0.22, 1, 0.36, 1] as const;

/** Human labels for the progress status button (the data file keeps its bracket labels). */
export const STATUS_TEXT: Record<ProblemStatus, string> = {
  not_started: 'Not started',
  attempted: 'Attempted',
  solved: 'Solved',
  revise: 'Revise',
};

/** Fades + lifts its content in the first time it scrolls into view. */
export function Reveal({ children, delay = 0, y = 12, style, className, id }: {
  children: ReactNode; delay?: number; y?: number; style?: CSSProperties; className?: string; id?: string;
}) {
  return (
    <motion.div
      id={id}
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -40px 0px' }}
      transition={{ duration: 0.55, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

const staggerParent: Variants = {
  hidden: {},
  show: (gap: number = 0.045) => ({ transition: { staggerChildren: gap, delayChildren: 0.05 } }),
};
const staggerChild: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.985 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: EASE } },
};

/** Children wrapped in <StaggerItem> enter one after another. */
export function Stagger({ children, gap = 0.045, style, className, onView = true }: {
  children: ReactNode; gap?: number; style?: CSSProperties; className?: string; onView?: boolean;
}) {
  return (
    <motion.div
      className={className}
      style={style}
      variants={staggerParent}
      custom={gap}
      initial="hidden"
      {...(onView ? { whileInView: 'show', viewport: { once: true, margin: '0px 0px -30px 0px' } } : { animate: 'show' })}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, style, className }: { children: ReactNode; style?: CSSProperties; className?: string }) {
  return <motion.div className={className} style={style} variants={staggerChild}>{children}</motion.div>;
}

/** Counts up to `value` with a soft spring; re-animates when the value changes. */
export function AnimatedNumber({ value, style, className, suffix = '' }: {
  value: number; style?: CSSProperties; className?: string; suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 90, damping: 20, mass: 0.6 });
  const text = useTransform(spring, (v) => `${Math.round(v)}${suffix}`);
  useEffect(() => { if (inView) mv.set(value); }, [inView, value, mv]);
  if (reduced) return <span ref={ref} className={className} style={{ fontVariantNumeric: 'tabular-nums', ...style }}>{value}{suffix}</span>;
  return <motion.span ref={ref} className={className} style={{ fontVariantNumeric: 'tabular-nums', ...style }}>{text}</motion.span>;
}

/** Progress bar whose fill grows into place. */
export function AnimatedBar({ pct, color = 'var(--accent-gradient)', height = 4, delay = 0, track = 'rgba(255,255,255,0.05)' }: {
  pct: number; color?: string; height?: number; delay?: number; track?: string;
}) {
  const clamped = Math.max(0, Math.min(100, pct || 0));
  return (
    <div style={{ height, borderRadius: 999, background: track, overflow: 'hidden' }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 1, ease: EASE, delay }}
        style={{ height: '100%', borderRadius: 999, background: color }}
      />
    </div>
  );
}

/** Small confetti burst — used for mastering a topic or retiring a problem. */
export function celebrate(origin?: { x: number; y: number }) {
  if (typeof window === 'undefined') return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  import('canvas-confetti').then(({ default: confetti }) => {
    confetti({
      particleCount: 80,
      spread: 75,
      startVelocity: 34,
      gravity: 0.9,
      scalar: 0.8,
      ticks: 180,
      origin: origin ?? { x: 0.5, y: 0.35 },
      colors: ['#d6a84f', '#ececef', '#3fb68b', '#9a9aa4'],
      disableForReducedMotion: true,
    });
  });
}

/** Origin for celebrate() from a DOM element's centre. */
export function originOf(el: Element | null): { x: number; y: number } | undefined {
  if (!el) return undefined;
  const r = el.getBoundingClientRect();
  return { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight };
}
