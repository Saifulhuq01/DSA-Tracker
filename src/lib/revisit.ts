// Red / Yellow / Green recall system from the 24-week plan.
//
// Pure functions only — no React, no storage. The ladder state of a problem is
// fully derived by replaying its attempt log, so a same-day misclick can be
// corrected by simply re-rating (the last entry is replaced, then replayed).

export type RecallRating = 'red' | 'yellow' | 'green';

export interface RecallAttempt {
  date: string; // local YYYY-MM-DD
  rating: RecallRating;
}

/** Revisit ladder in days: next day → +7 → +3 weeks → +6 weeks. */
export const REVISIT_INTERVALS = [1, 7, 21, 42] as const;

/** Red/yellow on a revisit drops the problem back to this rung (+7, "next weekend"). */
export const RESET_RUNG = 1;

/** This many greens in a row on long-gap revisits = retired. */
export const GREENS_TO_RETIRE = 2;

/**
 * Only greens on revisits at this rung or later count toward retirement
 * (2 = the +3 week revisit). Next-day and +7 greens still climb the ladder,
 * but a problem must survive the +3w and +6w gaps before it retires.
 */
export const RETIRE_FROM_RUNG = 2;

export const RETIRE_RULE_LABEL = 'green at +3w and +6w = retired';

/** Keep Firestore docs small: only the most recent attempts are stored. */
export const MAX_LOG = 30;

export const RATING_META: Record<RecallRating, { label: string; color: string; bg: string; desc: string }> = {
  red: {
    label: 'Red',
    color: '#e5534b',
    bg: 'rgba(229,83,75,0.12)',
    desc: "Couldn't solve it without reading the explanation",
  },
  yellow: {
    label: 'Yellow',
    color: '#d9a441',
    bg: 'rgba(217,164,65,0.12)',
    desc: 'Solved alone, but needed a hint, took 30+ min, or had bugs',
  },
  green: {
    label: 'Green',
    color: '#3fb68b',
    bg: 'rgba(63,182,139,0.12)',
    desc: 'Solved from a blank page in ~20–25 min with correct complexity',
  },
};

/** Local calendar date as YYYY-MM-DD (not UTC, so 1am IST is still "today"). */
export function localToday(): string {
  return toLocalDateStr(new Date());
}

export function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return toLocalDateStr(new Date(y, m - 1, d + days));
}

/** Whole days from a to b (b - a), both YYYY-MM-DD. */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}

export function formatShortDate(dateStr: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export interface LadderState {
  rating: RecallRating;
  revisitStep: number; // rung index into REVISIT_INTERVALS for the scheduled revisit
  greenStreak: number;
  retired: boolean;
  nextReviseDate: string; // '' when retired
  lastSolved: string; // date of the most recent attempt (any colour)
}

/** Roadmap status. Derived from stored fields, never stored itself. */
export type RecallStatus = 'New' | 'Red' | 'Yellow' | 'Green' | 'Retired';

export const RECALL_STATUSES: RecallStatus[] = ['New', 'Red', 'Yellow', 'Green', 'Retired'];

export function recallStatus(s?: { attemptLog?: RecallAttempt[]; rating?: RecallRating; retired?: boolean } | null): RecallStatus {
  if (!s || !s.attemptLog?.length || !s.rating) return 'New';
  if (s.retired) return 'Retired';
  return s.rating === 'red' ? 'Red' : s.rating === 'yellow' ? 'Yellow' : 'Green';
}

/** Counts toward topic mastery: a ★ problem must be Green or Retired. */
export function isMasteredStatus(status: RecallStatus): boolean {
  return status === 'Green' || status === 'Retired';
}

/**
 * Replay an attempt log into the current ladder state.
 *
 * - First attempt (new problem): revisit next day, whatever the colour.
 * - Green on a revisit: climb one rung (+7 → +21 → +42, then stays at +42).
 * - Red/yellow on a revisit: reset to the +7 rung.
 * - Green on GREENS_TO_RETIRE revisits in a row, each at rung >= RETIRE_FROM_RUNG
 *   (i.e. the +3w and +6w revisits): retired (no date).
 *   A later red/yellow (e.g. from mixed practice) un-retires it.
 */
export function computeLadder(log: RecallAttempt[]): LadderState | null {
  if (!log.length) return null;

  let rung = 0; // rung of the revisit currently scheduled
  let streak = 0;
  let next = '';

  log.forEach((a, i) => {
    if (i === 0) {
      // First attempt on a new problem: never counts toward retirement
      rung = 0;
      next = addDays(a.date, REVISIT_INTERVALS[0]);
      streak = 0;
      return;
    }
    if (a.rating === 'green') {
      // `rung` is the revisit just performed; only long-gap greens count
      if (rung >= RETIRE_FROM_RUNG) streak++;
      rung = Math.min(rung + 1, REVISIT_INTERVALS.length - 1);
      next = addDays(a.date, REVISIT_INTERVALS[rung]);
    } else {
      streak = 0;
      rung = RESET_RUNG;
      next = addDays(a.date, REVISIT_INTERVALS[RESET_RUNG]);
    }
  });

  const retired = streak >= GREENS_TO_RETIRE;
  return {
    rating: log[log.length - 1].rating,
    revisitStep: rung,
    greenStreak: streak,
    retired,
    nextReviseDate: retired ? '' : next,
    lastSolved: log[log.length - 1].date,
  };
}

/** Append today's attempt; a second rating on the same day replaces the first. */
export function appendAttempt(log: RecallAttempt[] | undefined, attempt: RecallAttempt): RecallAttempt[] {
  const prev = log ?? [];
  const base = prev.length && prev[prev.length - 1].date === attempt.date ? prev.slice(0, -1) : prev;
  return [...base, attempt].slice(-MAX_LOG);
}

export interface MasterySummary {
  coreTotal: number;
  coreDone: number; // ★ problems that are Green or Retired
  coreCounts: Record<RecallStatus, number>; // ★ problems by status
  allTotal: number;
  allDone: number; // any problem Green or Retired
  mastered: boolean; // every ★ problem is Green or Retired (and the topic has at least one ★)
}

/** Topic mastery: all ★ problems Green or Retired. */
export function summarizeMastery(problems: { core: boolean; status: RecallStatus }[]): MasterySummary {
  const coreCounts: Record<RecallStatus, number> = { New: 0, Red: 0, Yellow: 0, Green: 0, Retired: 0 };
  let coreTotal = 0, coreDone = 0, allDone = 0;
  problems.forEach((p) => {
    const done = isMasteredStatus(p.status);
    if (done) allDone++;
    if (!p.core) return;
    coreTotal++;
    coreCounts[p.status]++;
    if (done) coreDone++;
  });
  return { coreTotal, coreDone, coreCounts, allTotal: problems.length, allDone, mastered: coreTotal > 0 && coreDone === coreTotal };
}
