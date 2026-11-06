'use client';

import { useState, useEffect, useRef, useCallback, useId, type CSSProperties } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Swords, Check, Smile, Meh, Frown, RotateCw, RotateCcw, Play, Pause, Square, Building2, Plus, Timer,
  Flag, BellRing, CalendarDays, Lightbulb, Brain, Target, Shuffle, X, Sparkles, Download, AlertTriangle,
} from 'lucide-react';
import { AnimatedBar, celebrate, originOf, EASE } from './ui';
import ReactMarkdown from 'react-markdown';
import html2canvas from 'html2canvas';
import type { DailyQuestData, WeaknessReport, XPData, PomodoroData, ProblemState } from '@/hooks/useTrackerState';
import {
  type RecallRating, RATING_META, REVISIT_INTERVALS, GREENS_TO_RETIRE, RETIRE_RULE_LABEL,
  localToday, formatShortDate,
} from '@/lib/revisit';

/* ── XP & Level Badge ── */
export function XPLevelBadge({ xpData }: { xpData: XPData }) {
  const pct = Math.max(0, Math.min(100, 100 - xpData.xpToNext));
  return (
    <div className="side-section">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ position: 'relative', width: 36, height: 36, flexShrink: 0 }}>
          <svg width="36" height="36" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2.5" />
            <motion.circle
              cx="18" cy="18" r="15" fill="none" stroke="var(--gold)" strokeWidth="2.5" strokeLinecap="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: pct / 100 }} transition={{ duration: 1.1, ease: EASE }}
            />
          </svg>
          <span className="tabular" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: '0.74rem', fontWeight: 650, color: 'var(--text-primary)' }}>
            {xpData.level}
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>Level {xpData.level}</p>
          <p className="tabular" style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
            {xpData.totalXP} XP · {xpData.xpToNext} to next
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Daily Quests Panel ── */
export function DailyQuestsPanel({ quests }: { quests: DailyQuestData }) {
  if (!quests.quests.length) return null;
  return (
    <div className="side-section">
      <div className="side-title" style={{ justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Swords size={12} /> Daily quests</span>
        {quests.allCompleted && <span className="chip" style={{ color: 'var(--level-easy)', borderColor: 'rgba(63,182,139,0.3)' }}>All done · +50 XP</span>}
      </div>
      <div style={{ display: 'grid', gap: 6 }}>
        {quests.quests.map((q) => (
          <div key={q.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
            <motion.span
              initial={false}
              animate={{ background: q.completed ? 'var(--level-easy)' : 'rgba(255,255,255,0)', borderColor: q.completed ? 'var(--level-easy)' : 'var(--border-hover)' }}
              style={{ width: 15, height: 15, marginTop: 1, borderRadius: 5, border: '1px solid', display: 'grid', placeItems: 'center', flexShrink: 0 }}
            >
              <AnimatePresence>
                {q.completed && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }} style={{ display: 'grid' }}>
                    <Check size={10} strokeWidth={3} color="#09090b" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.72rem', fontWeight: 500, color: q.completed ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: q.completed ? 'line-through' : 'none' }}>
                {q.description}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <div style={{ flex: 1 }}>
                  <AnimatedBar pct={(q.current / q.target) * 100} height={3} color={q.completed ? 'var(--level-easy)' : 'var(--accent-gradient)'} />
                </div>
                <span className="tabular" style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{q.current}/{q.target}</span>
                <span className="tabular" style={{ fontSize: '0.6rem', color: 'var(--gold)', fontWeight: 600 }}>+{q.xpReward}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Weakness Detector Panel ── */
export function WeaknessPanel({ report, onClose }: { report: WeaknessReport[]; onClose: () => void }) {
  const weakest = report.filter((r) => r.completionPct < 100);
  return (
    <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div className="modal-panel" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 16, padding: '24px 28px', maxWidth: 520, width: '92%', maxHeight: '80vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Target size={16} /> Weakness detector</span></h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}><X size={16} /></button>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 16 }}>Topics sorted by weakest first. Focus on the top ones!</p>
        {weakest.map((w, i) => (
          <div key={w.topicId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', marginBottom: 6, borderRadius: 10, border: '1px solid var(--border-subtle)', background: i < 3 ? 'rgba(229,83,75,0.04)' : 'transparent' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: i < 3 ? 'var(--level-hard)' : 'var(--text-muted)', width: 24, textAlign: 'center', fontFamily: 'var(--font-geist-mono)' }}>
              {i < 3 ? <AlertTriangle size={14} /> : (i + 1)}
            </span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>{w.topicName}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <div style={{ flex: 1, background: 'var(--bg-input)', borderRadius: 3, height: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, background: w.completionPct < 30 ? 'var(--level-hard)' : w.completionPct < 60 ? 'var(--level-medium)' : 'var(--level-easy)', width: `${w.completionPct}%` }} />
                </div>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, fontFamily: 'var(--font-geist-mono)', color: 'var(--text-secondary)' }}>
                  {w.solvedCount}/{w.totalCount}
                </span>
              </div>
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, fontFamily: 'var(--font-geist-mono)', color: w.completionPct < 30 ? 'var(--level-hard)' : w.completionPct < 60 ? 'var(--level-medium)' : 'var(--level-easy)' }}>
              {w.completionPct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Mock Interview Modal ── */
export function MockInterviewModal({ onClose, generateProblems }: {
  onClose: () => void;
  generateProblems: (count?: number) => { topicId: number; topicName: string; problemId: number; problemName: string; level: string; url: string }[];
}) {
  const [problems, setProblems] = useState(generateProblems(3));
  const [timeLeft, setTimeLeft] = useState(45 * 60); // 45 minutes
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (running && timeLeft > 0) {
      intervalRef.current = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, timeLeft]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const pct = (timeLeft / (45 * 60)) * 100;
  const urgentColor = timeLeft < 300 ? 'var(--level-hard)' : timeLeft < 900 ? 'var(--level-medium)' : 'var(--level-easy)';

  return (
    <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div className="modal-panel" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 16, padding: '32px', maxWidth: 580, width: '94%' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Swords size={16} /> Mock interview</span></h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.3rem' }}><X size={16} /></button>
        </div>

        {/* Timer */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <p style={{ fontSize: '3rem', fontWeight: 800, fontFamily: 'var(--font-geist-mono)', color: urgentColor, lineHeight: 1 }}>
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </p>
          <div style={{ background: 'var(--bg-input)', borderRadius: 4, height: 6, overflow: 'hidden', marginTop: 8, maxWidth: 300, margin: '8px auto 0' }}>
            <div style={{ height: '100%', borderRadius: 4, background: urgentColor, width: `${pct}%`, transition: 'width 1s linear' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 12 }}>
            <button onClick={() => setRunning(!running)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: running ? 'rgba(229,83,75,0.15)' : 'rgba(63,182,139,0.15)', color: running ? 'var(--level-hard)' : 'var(--level-easy)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
              {running ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Start</>}
            </button>
            <button onClick={() => { setTimeLeft(45 * 60); setRunning(false); }} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
              ↻ Reset
            </button>
          </div>
        </div>

        {/* Problems */}
        <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Your Challenge</p>
        {problems.map((p, i) => (
          <a key={i} href={p.url} target="_blank" rel="noopener noreferrer" style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', marginBottom: 8, borderRadius: 10,
            border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)',
            textDecoration: 'none', transition: 'all 0.15s',
          }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-primary)', fontFamily: 'var(--font-geist-mono)', width: 24 }}>{i + 1}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{p.problemName}</p>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{p.topicName}</p>
            </div>
            <span style={{
              fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4,
              background: p.level === 'Easy' ? 'var(--level-easy-bg)' : p.level === 'Medium' ? 'var(--level-medium-bg)' : 'var(--level-hard-bg)',
              color: p.level === 'Easy' ? 'var(--level-easy)' : p.level === 'Medium' ? 'var(--level-medium)' : 'var(--level-hard)',
            }}>{p.level}</span>
          </a>
        ))}
        <button onClick={() => setProblems(generateProblems(3))} style={{ width: '100%', marginTop: 8, padding: '10px', borderRadius: 8, border: '1px dashed var(--border-default)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
          <Shuffle size={13} /> Shuffle problems
        </button>
      </div>
    </div>
  );
}

/* ── Confidence Popup (SRS) ── */
export function ConfidencePopup({ onSelect, onClose }: {
  onSelect: (confidence: 'easy' | 'medium' | 'hard') => void;
  onClose: () => void;
}) {
  const options = [
    { key: 'easy' as const, label: 'Easy', sub: 'Revise in 14 days', Icon: Smile, color: 'var(--level-easy)' },
    { key: 'medium' as const, label: 'Okay', sub: 'Revise in 7 days', Icon: Meh, color: 'var(--level-medium)' },
    { key: 'hard' as const, label: 'Hard', sub: 'Revise in 3 days', Icon: Frown, color: 'var(--level-hard)' },
  ];
  return (
    <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }} onClick={onClose}>
      <div className="modal-panel" style={{ borderRadius: 16, padding: 22, maxWidth: 360, width: '90%' }} onClick={(e) => e.stopPropagation()}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 650, color: 'var(--text-primary)' }}>How did it feel?</h4>
        <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2, marginBottom: 16 }}>This sets when it comes back for revision.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {options.map(({ key, label, sub, Icon, color }, i) => (
            <motion.button
              key={key}
              onClick={() => onSelect(key)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 + i * 0.05, duration: 0.4, ease: EASE }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.96 }}
              style={{ display: 'grid', justifyItems: 'center', gap: 6, padding: '14px 8px', borderRadius: 12, cursor: 'pointer', border: '1px solid var(--border-default)', background: 'rgba(255,255,255,0.02)', color }}
            >
              <Icon size={20} strokeWidth={1.75} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{sub}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Revision Due Sidebar Widget ── */
export function RevisionDueWidget({ items }: { items: { topicId: number; problemId: number; problemName: string; daysOverdue: number }[] }) {
  if (!items.length) return null;
  return (
    <div className="side-section">
      <div className="side-title"><RotateCw size={12} /> Revision due <span className="tabular" style={{ marginLeft: 'auto' }}>{items.length}</span></div>
      <div style={{ maxHeight: 132, overflowY: 'auto', display: 'grid', gap: 2 }}>
        {items.slice(0, 5).map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 26, padding: '0 6px', borderRadius: 6 }}>
            <span className="dot" style={{ background: item.daysOverdue > 3 ? 'var(--level-hard)' : 'var(--status-revise)' }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.problemName}</span>
            {item.daysOverdue > 0 && <span className="tabular" style={{ fontSize: '0.62rem', color: 'var(--level-hard)', fontWeight: 600 }}>+{item.daysOverdue}d</span>}
          </div>
        ))}
        {items.length > 5 && <p style={{ fontSize: '0.64rem', color: 'var(--text-muted)', padding: '2px 6px' }}>+{items.length - 5} more</p>}
      </div>
    </div>
  );
}

/* ── Problem Timer Component ── */
export function ProblemTimer({ onStop }: { onStop: (ms: number) => void }) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const startTimeRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    startTimeRef.current = Date.now() - elapsed;
    setRunning(true);
  }, [elapsed]);

  const pause = useCallback(() => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const stop = useCallback(() => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (elapsed > 0) onStop(elapsed);
    setElapsed(0);
  }, [elapsed, onStop]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsed(Date.now() - startTimeRef.current);
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const mins = Math.floor(elapsed / 60000);
  const secs = Math.floor((elapsed % 60000) / 1000);
  const isLong = mins >= 45;
  const btn: CSSProperties = { display: 'grid', placeItems: 'center', width: 20, height: 20, borderRadius: 5, border: 'none', background: 'transparent', cursor: 'pointer' };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      <span className="tabular" style={{ fontSize: '0.68rem', fontFamily: 'var(--font-geist-mono)', color: running ? 'var(--text-primary)' : isLong ? 'var(--level-hard)' : 'var(--text-muted)', minWidth: 36, transition: 'color 0.2s' }}>
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </span>
      {!running ? (
        <button onClick={start} style={{ ...btn, color: 'var(--text-secondary)' }} title="Start timer" aria-label="Start timer"><Play size={11} fill="currentColor" /></button>
      ) : (
        <button onClick={pause} style={{ ...btn, color: 'var(--level-medium)' }} title="Pause" aria-label="Pause timer"><Pause size={11} fill="currentColor" /></button>
      )}
      {elapsed > 0 && (
        <button onClick={stop} style={{ ...btn, color: 'var(--level-hard)' }} title="Stop & save" aria-label="Stop and save"><Square size={10} fill="currentColor" /></button>
      )}
    </div>
  );
}

/* ── Company Tag Input ── */
const COMPANY_OPTIONS = ['Google', 'Amazon', 'Meta', 'Microsoft', 'Apple', 'Zoho', 'Freshworks', 'Flipkart', 'Razorpay', 'Uber'];

export function CompanyTagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [open, setOpen] = useState(false);

  const toggle = (company: string) => {
    if (tags.includes(company)) {
      onChange(tags.filter((t) => t !== company));
    } else {
      onChange([...tags, company]);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(!open)} title={tags.length ? tags.join(', ') : 'Tag companies'} style={{
        display: 'inline-flex', alignItems: 'center', gap: 4, height: 22, padding: '0 7px', borderRadius: 6, cursor: 'pointer',
        background: tags.length ? 'rgba(255,255,255,0.05)' : 'transparent',
        border: `1px solid ${tags.length ? 'var(--border-default)' : 'var(--border-subtle)'}`,
        color: tags.length ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '0.64rem', fontWeight: 550,
      }}>
        <Building2 size={11} /> {tags.length || <Plus size={10} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.16, ease: EASE }}
            style={{
              position: 'absolute', top: '100%', left: 0, marginTop: 6, zIndex: 50, transformOrigin: 'top left',
              background: 'var(--bg-elevated)', borderRadius: 10, padding: 5, minWidth: 150, boxShadow: 'var(--shadow-pop)',
            }}
          >
            {COMPANY_OPTIONS.map((c) => {
              const on = tags.includes(c);
              return (
                <button key={c} onClick={() => toggle(c)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', textAlign: 'left', height: 26, padding: '0 8px',
                  borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: on ? 600 : 450,
                  background: on ? 'rgba(255,255,255,0.06)' : 'transparent', color: on ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}>
                  {c}{on && <Check size={12} />}
                </button>
              );
            })}
            <button onClick={() => setOpen(false)} className="btn btn-sm" style={{ width: '100%', marginTop: 4 }}>Done</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Pomodoro Timer Component (Global) ── */
export function GlobalPomodoro({ pomodoroData, onComplete }: { pomodoroData: PomodoroData; onComplete: (minutes: number) => void }) {
  const WORK_MINS = 25;
  const BREAK_MINS = 5;
  const [timeLeft, setTimeLeft] = useState(WORK_MINS * 60);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (running && timeLeft > 0) {
      intervalRef.current = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (running && timeLeft === 0) {
      setRunning(false);
      if (mode === 'work') {
        onComplete(WORK_MINS);
        setMode('break');
        setTimeLeft(BREAK_MINS * 60);
      } else {
        setMode('work');
        setTimeLeft(WORK_MINS * 60);
      }
      // Play a sound if we had one
      alert(`Pomodoro ${mode} session complete!`);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, timeLeft, mode, onComplete]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const isWork = mode === 'work';
  const total = (isWork ? WORK_MINS : BREAK_MINS) * 60;
  const progress = ((total - timeLeft) / total) * 100;

  return (
    <div className="side-section">
      <div className="side-title" style={{ justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Timer size={12} /> Focus timer</span>
        <span className="tabular">{pomodoroData.sessionsCompleted} sessions · {pomodoroData.totalFocusMinutes}m</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <p className="tabular" style={{ fontSize: '1.35rem', fontWeight: 600, fontFamily: 'var(--font-geist-mono)', letterSpacing: '-0.02em', color: running ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: 1.1, transition: 'color 0.3s' }}>
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </p>
          <p style={{ fontSize: '0.64rem', color: isWork ? 'var(--text-muted)' : 'var(--level-easy)', display: 'flex', alignItems: 'center', gap: 5 }}>
            {running && <span className="dot animate-pulse-glow" style={{ background: isWork ? 'var(--level-hard)' : 'var(--level-easy)' }} />}
            {isWork ? 'Deep work' : 'Short break'}
          </p>
        </div>
        <button className="icon-btn" onClick={() => setRunning(!running)} aria-label={running ? 'Pause' : 'Start'} style={{ border: '1px solid var(--border-default)' }}>
          {running ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button className="icon-btn" onClick={() => { setRunning(false); setTimeLeft(total); }} aria-label="Reset timer">
          <RotateCcw size={14} />
        </button>
      </div>
      <div style={{ marginTop: 10 }}>
        <div style={{ height: 2, borderRadius: 2, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.9, ease: 'linear' }} style={{ height: '100%', background: isWork ? 'var(--text-secondary)' : 'var(--level-easy)' }} />
        </div>
      </div>
    </div>
  );
}

/* ── Custom Problem Modal ── */
export function CustomProblemModal({ topics, onAdd, onClose }: {
  topics: any[];
  onAdd: (problem: { topicId: number; name: string; level: 'Easy' | 'Medium' | 'Hard'; url: string; platform: string }) => void;
  onClose: () => void;
}) {
  const [topicId, setTopicId] = useState(topics[0]?.id || 1);
  const [name, setName] = useState('');
  const [level, setLevel] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState('LeetCode');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) return alert('Name and URL required');
    onAdd({ topicId: Number(topicId), name, level, url, platform });
    onClose();
  };

  return (
    <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }} onClick={onClose}>
      <form className="modal-panel" onSubmit={handleSubmit} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 16, padding: '24px', maxWidth: 400, width: '90%' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Add custom problem</h3>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.3rem' }}><X size={16} /></button>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>Topic</label>
          <select value={topicId} onChange={(e) => setTopicId(Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: 6, background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
            {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>Problem Name</label>
          <input required type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Alien Dictionary" style={{ width: '100%', padding: '8px', borderRadius: 6, background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} />
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>Level</label>
            <select value={level} onChange={(e) => setLevel(e.target.value as any)} style={{ width: '100%', padding: '8px', borderRadius: 6, background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>Platform</label>
            <input type="text" value={platform} onChange={(e) => setPlatform(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: 6, background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} />
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>URL</label>
          <input required type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '8px', borderRadius: 6, background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} />
        </div>

        <button type="submit" style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: 'var(--accent-primary)', color: '#09090b', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
          Add Problem
        </button>
      </form>
    </div>
  );
}

/* ── Rich Notes Input (Markdown) ── */
export function RichNotesInput({ initialNotes, onSave }: { initialNotes: string; onSave: (notes: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(initialNotes);

  if (editing) {
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <textarea
          autoFocus
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => { setEditing(false); onSave(notes); }}
          onKeyDown={(e) => {
            if (e.key === 'Escape' || (e.key === 'Enter' && e.ctrlKey)) {
              setEditing(false);
              onSave(notes);
            }
          }}
          placeholder="Use markdown: **bold**, `code`, etc."
          style={{ width: '100%', boxSizing: 'border-box', minHeight: '60px', padding: '6px', borderRadius: 6, background: 'var(--bg-input)', border: '1px solid var(--accent-primary)', color: 'var(--text-primary)', fontSize: '0.7rem', resize: 'vertical' }}
        />
        <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textAlign: 'right' }}>Ctrl+Enter to save</span>
      </div>
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      style={{
        width: '100%', minHeight: '24px', padding: '4px 6px', borderRadius: 6,
        background: 'transparent', border: '1px solid transparent',
        cursor: 'pointer', fontSize: '0.75rem', color: notes ? 'var(--text-primary)' : 'var(--text-muted)',
        maxHeight: 100, overflowY: 'auto'
      }}
      title="Click to edit"
    >
      {notes ? (
        <div style={{ paddingLeft: 4 }} className="markdown-body">
          <ReactMarkdown>{notes}</ReactMarkdown>
        </div>
      ) : 'Add notes...'}
    </div>
  );
}

/* ── Social Share Card Modal ── */
export function ShareCardModal({ onClose, stats, xp, streak }: { onClose: () => void; stats: any; xp: any; streak: any }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const downloadCard = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, { backgroundColor: '#09090b', scale: 2 });
      const link = document.createElement('a');
      link.download = 'dsa_tracker_stats.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to generate image', err);
      alert('Failed to generate image');
    }
  };

  return (
    <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }} onClick={onClose}>
      <div
        ref={cardRef}
        style={{
          background: 'linear-gradient(145deg, #1a1a24 0%, #09090b 100%)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 24, padding: '40px', width: 500,
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          position: 'relative', overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, background: 'rgba(255,255,255,0.1)', filter: 'blur(50px)', borderRadius: '50%' }} />

        <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', marginBottom: 8, letterSpacing: '-0.02em' }}>DSA Tracker Wrapped</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 32 }}>Consistency is the key to mastery.</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Total Solved</p>
            <p style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--status-solved)', lineHeight: 1 }}>{stats.totalSolved}</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Longest Streak</p>
            <p style={{ fontSize: '2.5rem', fontWeight: 900, color: '#d9a441', lineHeight: 1 }}>{streak.longestStreak} <span style={{ fontSize: '1.2rem' }}>days</span></p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Current Level</p>
            <p style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--accent-primary)', lineHeight: 1 }}>{xp.level}</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Completion</p>
            <p style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{stats.pct}%</p>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-geist-mono)' }}>Generated via DSA-Tracker</p>
        </div>
      </div>

      <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
        <button onClick={downloadCard} style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: 'var(--accent-primary)', color: '#09090b', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,255,255,0.15)' }}>
          <Download size={15} /> Download image
        </button>
        <button onClick={onClose} style={{ padding: '12px 24px', borderRadius: 12, border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ── AI Hint Modal (Simulated) ── */
export function AIHintModal({ problemName, onClose }: { problemName: string; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [hint, setHint] = useState('');

  useEffect(() => {
    // Simulate AI API call
    const timer = setTimeout(() => {
      setLoading(false);
      const hints = [
        "Think about using a two-pointer approach here.",
        "Can we optimize this by storing previously seen values in a Hash Map?",
        "This looks like a classic dynamic programming problem. What is your base case?",
        "Have you considered sorting the array first?",
        "Try tracking the maximum value seen so far as you iterate."
      ];
      setHint(hints[Math.floor(Math.random() * hints.length)]);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }} onClick={onClose}>
      <div className="modal-panel" style={{ background: 'var(--bg-card)', border: '1px solid var(--accent-primary)', borderRadius: 16, padding: '24px', maxWidth: 400, width: '90%', boxShadow: 'none' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Sparkles size={18} color="var(--gold)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>AI Tutor Hint</h3>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 16 }}>Hint for: <strong>{problemName}</strong></p>

        <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '16px', minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {loading ? (
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontStyle: 'italic' }}>Thinking...</span>
          ) : (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{hint}</p>
          )}
        </div>

        <button onClick={onClose} style={{ width: '100%', marginTop: 20, padding: '10px', borderRadius: 8, border: 'none', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
          Got it!
        </button>
      </div>
    </div>
  );
}

/* ── Recall: Red / Yellow / Green rating + next revisit (24-week plan) ── */
const RATINGS: RecallRating[] = ['red', 'yellow', 'green'];
const RUNG_LABELS = ['next day', '+7d', '+3w', '+6w'];

export function RecallCell({ state, onRate, onDateChange }: {
  state: Pick<ProblemState, 'rating' | 'attemptLog' | 'nextReviseDate' | 'retired' | 'revisitStep' | 'greenStreak'>;
  onRate: (rating: RecallRating) => void;
  onDateChange: (date: string) => void;
}) {
  const pillId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const today = localToday();
  const log = state.attemptLog || [];
  const ratedToday = log.length > 0 && log[log.length - 1].date === today;
  const next = state.nextReviseDate || '';
  const onLadder = log.length > 0;
  const due = onLadder && !state.retired && !!next && next <= today;
  const history = log.slice(-8).map(a => `${formatShortDate(a.date)}: ${RATING_META[a.rating].label}`).join('\n');

  // Celebrate the moment a problem retires (not on page load)
  const wasRetired = useRef(!!state.retired);
  useEffect(() => {
    if (state.retired && !wasRetired.current) celebrate(originOf(rootRef.current));
    wasRetired.current = !!state.retired;
  }, [state.retired]);

  return (
    <div ref={rootRef} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 5, minWidth: 104 }}>
      <div
        role="radiogroup"
        aria-label="Rate today's attempt"
        title={history ? `Attempts:\n${history}` : "Rate today's attempt"}
        style={{ position: 'relative', display: 'inline-flex', padding: 2, gap: 2, borderRadius: 8, border: '1px solid var(--border-default)', background: 'rgba(255,255,255,0.02)' }}
      >
        {RATINGS.map((r) => {
          const m = RATING_META[r];
          const active = state.rating === r;
          return (
            <motion.button
              key={r}
              role="radio"
              aria-checked={active}
              aria-label={`Rate ${m.label}`}
              aria-pressed={active}
              onClick={() => onRate(r)}
              whileTap={{ scale: 0.88 }}
              title={`${m.label}: ${m.desc}${ratedToday ? "\n(replaces today's rating)" : ''}`}
              style={{
                position: 'relative', width: 26, height: 20, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'transparent',
                fontSize: '0.64rem', fontWeight: 650, color: active ? m.color : 'var(--text-muted)', transition: 'color 0.2s',
              }}
            >
              {active && (
                <motion.span
                  layoutId={`recall-pill-${pillId}`}
                  transition={{ type: 'spring', stiffness: 520, damping: 34 }}
                  style={{ position: 'absolute', inset: 0, borderRadius: 6, background: m.bg, boxShadow: `inset 0 0 0 1px ${m.color}55` }}
                />
              )}
              <span style={{ position: 'relative' }}>{m.label[0]}</span>
            </motion.button>
          );
        })}
      </div>
        {!onLadder ? (
          <motion.span key="unrated" {...fadeSwap} style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>not rated</motion.span>
        ) : state.retired ? (
          <motion.span key="retired" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.62rem', color: 'var(--gold)', fontWeight: 600 }} title={`Retired: ${RETIRE_RULE_LABEL}`}>
            <Flag size={11} /> Retired
          </motion.span>
        ) : (
          <motion.label key="date" {...fadeSwap}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.62rem', color: due ? 'var(--level-hard)' : 'var(--text-muted)' }}
            title={`Rung: ${RUNG_LABELS[state.revisitStep ?? 0] ?? ''} · long-gap greens ${state.greenStreak ?? 0}/${GREENS_TO_RETIRE} (${RETIRE_RULE_LABEL}). Click to move the date.`}>
            {due ? <BellRing size={11} /> : <CalendarDays size={11} />}
            <input
              type="date"
              value={next}
              onChange={(e) => e.target.value && onDateChange(e.target.value)}
              style={{
                background: 'transparent', border: 'none', padding: 0, width: 88,
                color: 'inherit', fontSize: '0.64rem', fontFamily: 'var(--font-geist-mono), monospace',
                colorScheme: 'dark', cursor: 'pointer',
              }}
            />
          </motion.label>
        )}
    </div>
  );
}

const fadeSwap = {
  initial: { opacity: 0, y: 3 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.18 },
} as const;

/* ── Key insight: one sentence, your own words ── */
export function KeyInsightInput({ value, onSave }: { value: string; onSave: (text: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);

  useEffect(() => { if (!editing) setText(value); }, [value, editing]);

  const commit = () => {
    setEditing(false);
    if (text.trim() !== value) onSave(text);
  };

  if (editing) {
    return (
      <motion.input
        initial={{ opacity: 0, y: -2 }}
        animate={{ opacity: 1, y: 0 }}
        autoFocus
        value={text}
        maxLength={240}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') { setText(value); setEditing(false); }
        }}
        placeholder="The one idea that makes it optimal…"
        className="input"
        style={{ marginTop: 5, height: 28, fontSize: '0.72rem' }}
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      title="Key insight — click to edit"
      className="key-insight"
      data-empty={value ? undefined : ''}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 6, width: '100%', textAlign: 'left', marginTop: 4, padding: '1px 0',
        background: 'none', border: 'none', cursor: 'text',
        fontSize: '0.7rem', lineHeight: 1.45,
        color: value ? 'var(--text-secondary)' : 'var(--text-muted)',
      }}
    >
      <Lightbulb size={12} style={{ marginTop: 2, flexShrink: 0, color: value ? 'var(--gold)' : 'currentColor', opacity: value ? 1 : 0.6 }} />
      <span style={{ opacity: value ? 1 : 0.7 }}>{value || 'Add key insight'}</span>
    </button>
  );
}

/* ── Revisit queue (sorted by next revisit) ── */
export interface RevisitQueueData {
  items: {
    key: string; topicId: number; problemId: number; name: string; source: string; isZoho: boolean;
    rating: RecallRating; nextReviseDate: string; daysUntil: number; keyInsight: string;
  }[];
  counts: { red: number; yellow: number; green: number; retired: number; untriaged: number };
  today: string;
}

export function RevisitQueuePanel({ queue, onOpen }: {
  queue: RevisitQueueData;
  onOpen: (item: RevisitQueueData['items'][number]) => void;
}) {
  const [showUpcoming, setShowUpcoming] = useState(false);
  const { items, counts } = queue;
  const due = items.filter(i => i.daysUntil <= 0);
  const upcoming = items.filter(i => i.daysUntil > 0 && i.daysUntil <= 14);
  const onLadder = counts.red + counts.yellow + counts.green + counts.retired;
  if (!onLadder && !counts.untriaged) return null;

  const list = showUpcoming ? upcoming : due;

  return (
    <div className="side-section">
      <div className="side-title" style={{ justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Brain size={12} /> Revisit queue</span>
        <span className="tabular" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {(['red', 'yellow', 'green'] as const).map((r) => (
            <span key={r} title={RATING_META[r].label} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <span className="dot" style={{ background: RATING_META[r].color }} />{counts[r]}
            </span>
          ))}
          <span title="Retired" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: 'var(--gold)' }}><Flag size={10} />{counts.retired}</span>
        </span>
      </div>

      {counts.untriaged > 0 && (
        <p style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginBottom: 8 }}>
          {counts.untriaged} solved problem{counts.untriaged === 1 ? '' : 's'} not rated yet
        </p>
      )}

      <div style={{ position: 'relative', display: 'flex', padding: 2, gap: 2, borderRadius: 8, border: '1px solid var(--border-subtle)', marginBottom: 8 }}>
        {([['Due', due.length, false], ['Next 14d', upcoming.length, true]] as const).map(([label, n, up]) => {
          const active = showUpcoming === up;
          return (
            <button key={label} onClick={() => setShowUpcoming(up)} style={{
              position: 'relative', flex: 1, height: 24, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'transparent',
              fontSize: '0.68rem', fontWeight: 550, color: active ? 'var(--text-primary)' : 'var(--text-muted)', transition: 'color 0.2s',
            }}>
              {active && <motion.span layoutId="queue-tab" transition={{ type: 'spring', stiffness: 500, damping: 36 }} style={{ position: 'absolute', inset: 0, borderRadius: 6, background: 'rgba(255,255,255,0.07)' }} />}
              <span style={{ position: 'relative' }}>{label} <span className="tabular" style={{ opacity: 0.6 }}>{n}</span></span>
            </button>
          );
        })}
      </div>

      <div style={{ maxHeight: 190, overflowY: 'auto', display: 'grid', gap: 2 }}>
        <AnimatePresence mode="popLayout" initial={false}>
          {list.length === 0 && (
            <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
              {showUpcoming ? 'Nothing in the next 2 weeks' : 'Nothing due today'}
            </motion.p>
          )}
          {list.map((item) => {
            const m = RATING_META[item.rating];
            const when = item.daysUntil < 0 ? `${-item.daysUntil}d late` : item.daysUntil === 0 ? 'today' : formatShortDate(item.nextReviseDate);
            return (
              <motion.button
                layout
                key={item.key}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.25, ease: EASE }}
                onClick={() => onOpen(item)}
                title={item.keyInsight ? `Key insight: ${item.keyInsight}` : 'No key insight yet'}
                className="queue-item"
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
                  height: 28, padding: '0 8px', borderRadius: 7, cursor: 'pointer', border: 'none',
                  background: 'transparent',
                }}
              >
                <span className="dot" style={{ background: m.color }} />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.name}
                  {item.isZoho && <span style={{ color: 'var(--text-muted)' }}> · {item.source}</span>}
                </span>
                <span className="tabular" style={{ fontSize: '0.62rem', fontWeight: 550, flexShrink: 0, color: item.daysUntil < 0 ? 'var(--level-hard)' : 'var(--text-muted)' }}>{when}</span>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
      <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 8, opacity: 0.8 }}>
        {REVISIT_INTERVALS.map(d => `${d}d`).join(' → ')} · {RETIRE_RULE_LABEL}
      </p>
    </div>
  );
}
