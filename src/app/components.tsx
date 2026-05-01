'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { DailyQuestData, WeaknessReport, XPData } from '@/hooks/useTrackerState';

/* ── XP & Level Badge ── */
export function XPLevelBadge({ xpData }: { xpData: XPData }) {
  const pct = ((100 - xpData.xpToNext) / 100) * 100;
  return (
    <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.75rem', fontWeight: 800, color: '#fff',
            boxShadow: '0 0 12px rgba(245,158,11,0.3)',
          }}>
            {xpData.level}
          </div>
          <div>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)' }}>Level {xpData.level}</p>
            <p style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>{xpData.totalXP} XP total</p>
          </div>
        </div>
        <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--status-attempted)', fontFamily: 'var(--font-geist-mono)' }}>
          {xpData.xpToNext} to next
        </span>
      </div>
      <div style={{ background: 'var(--bg-input)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 4,
          background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
          width: `${pct}%`, transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
    </div>
  );
}

/* ── Daily Quests Panel ── */
export function DailyQuestsPanel({ quests }: { quests: DailyQuestData }) {
  if (!quests.quests.length) return null;
  return (
    <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          ⚔️ Daily Quests
        </span>
        {quests.allCompleted && (
          <span style={{ fontSize: '0.58rem', fontWeight: 700, color: 'var(--status-solved)', background: 'rgba(34,197,94,0.1)', padding: '2px 6px', borderRadius: 4 }}>
            ALL DONE! +50 XP
          </span>
        )}
      </div>
      {quests.quests.map((q) => (
        <div key={q.id} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 10px', marginBottom: 4, borderRadius: 8,
          background: q.completed ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.02)',
          border: `1px solid ${q.completed ? 'rgba(34,197,94,0.2)' : 'var(--border-subtle)'}`,
        }}>
          <span style={{ fontSize: '0.85rem' }}>{q.completed ? '✅' : '⬜'}</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.68rem', fontWeight: 600, color: q.completed ? 'var(--status-solved)' : 'var(--text-primary)', textDecoration: q.completed ? 'line-through' : 'none' }}>
              {q.description}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <div style={{ flex: 1, background: 'var(--bg-input)', borderRadius: 3, height: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  background: q.completed ? 'var(--status-solved)' : 'var(--accent-primary)',
                  width: `${Math.min(100, (q.current / q.target) * 100)}%`,
                  transition: 'width 0.3s',
                }} />
              </div>
              <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontFamily: 'var(--font-geist-mono)', fontWeight: 600 }}>
                {q.current}/{q.target}
              </span>
              <span style={{ fontSize: '0.55rem', color: 'var(--status-attempted)', fontWeight: 700 }}>
                +{q.xpReward}XP
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Weakness Detector Panel ── */
export function WeaknessPanel({ report, onClose }: { report: WeaknessReport[]; onClose: () => void }) {
  const weakest = report.filter((r) => r.completionPct < 100);
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 16, padding: '24px 28px', maxWidth: 520, width: '92%', maxHeight: '80vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>🎯 Weakness Detector</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 16 }}>Topics sorted by weakest first. Focus on the top ones!</p>
        {weakest.map((w, i) => (
          <div key={w.topicId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', marginBottom: 6, borderRadius: 10, border: '1px solid var(--border-subtle)', background: i < 3 ? 'rgba(239,68,68,0.04)' : 'transparent' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: i < 3 ? 'var(--level-hard)' : 'var(--text-muted)', width: 24, textAlign: 'center', fontFamily: 'var(--font-geist-mono)' }}>
              {i < 3 ? '⚠️' : (i + 1)}
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 16, padding: '32px', maxWidth: 580, width: '94%' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>⚔️ Mock Interview</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.3rem' }}>✕</button>
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
            <button onClick={() => setRunning(!running)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: running ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)', color: running ? 'var(--level-hard)' : 'var(--level-easy)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
              {running ? '⏸ Pause' : '▶ Start'}
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
            border: '1px solid var(--border-subtle)', background: 'rgba(167,139,250,0.04)',
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
          🔄 Shuffle Problems
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
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }} onClick={onClose}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 16, padding: '24px', maxWidth: 340, width: '90%', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
        <p style={{ fontSize: '1.3rem', marginBottom: 4 }}>🧠</p>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>How did it feel?</h4>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 16 }}>This sets when you&apos;ll need to revise it</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {([
            { key: 'easy' as const, label: '😎 Easy', sub: 'Revise in 14d', color: 'var(--level-easy)', bg: 'rgba(34,197,94,0.08)' },
            { key: 'medium' as const, label: '🤔 Medium', sub: 'Revise in 7d', color: 'var(--level-medium)', bg: 'rgba(245,158,11,0.08)' },
            { key: 'hard' as const, label: '😰 Hard', sub: 'Revise in 3d', color: 'var(--level-hard)', bg: 'rgba(239,68,68,0.08)' },
          ]).map((opt) => (
            <button key={opt.key} onClick={() => onSelect(opt.key)} style={{
              flex: 1, padding: '12px 8px', borderRadius: 10,
              border: `1px solid ${opt.color}33`, background: opt.bg,
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 700, color: opt.color, marginBottom: 2 }}>{opt.label}</p>
              <p style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>{opt.sub}</p>
            </button>
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
    <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          🔔 Revision Due ({items.length})
        </span>
      </div>
      <div style={{ maxHeight: 120, overflowY: 'auto' }}>
        {items.slice(0, 5).map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 8px', marginBottom: 3, borderRadius: 6,
            background: item.daysOverdue > 3 ? 'rgba(239,68,68,0.06)' : 'rgba(167,139,250,0.04)',
            border: `1px solid ${item.daysOverdue > 3 ? 'rgba(239,68,68,0.15)' : 'var(--border-subtle)'}`,
          }}>
            <span style={{ fontSize: '0.62rem', color: item.daysOverdue > 3 ? 'var(--level-hard)' : 'var(--status-revise)' }}>●</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.problemName}
            </span>
            {item.daysOverdue > 0 && (
              <span style={{ fontSize: '0.55rem', color: 'var(--level-hard)', fontWeight: 700 }}>+{item.daysOverdue}d</span>
            )}
          </div>
        ))}
        {items.length > 5 && (
          <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>+{items.length - 5} more</p>
        )}
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

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-geist-mono)', fontWeight: 600, color: isLong ? 'var(--level-hard)' : 'var(--text-secondary)', minWidth: 38 }}>
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </span>
      {!running ? (
        <button onClick={start} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.7rem', color: 'var(--level-easy)', padding: '2px' }} title="Start timer">▶</button>
      ) : (
        <button onClick={pause} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.7rem', color: 'var(--level-medium)', padding: '2px' }} title="Pause">⏸</button>
      )}
      {elapsed > 0 && (
        <button onClick={stop} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.7rem', color: 'var(--level-hard)', padding: '2px' }} title="Stop & save">⏹</button>
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
      <button onClick={() => setOpen(!open)} style={{
        background: tags.length ? 'rgba(167,139,250,0.08)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${tags.length ? 'rgba(167,139,250,0.25)' : 'var(--border-subtle)'}`,
        borderRadius: 4, padding: '2px 6px', fontSize: '0.6rem', cursor: 'pointer',
        color: tags.length ? 'var(--accent-primary)' : 'var(--text-muted)', fontWeight: 600,
      }}>
        🏢 {tags.length || '+'}
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 50,
          background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
          borderRadius: 8, padding: 6, minWidth: 140, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          {COMPANY_OPTIONS.map((c) => (
            <button key={c} onClick={() => toggle(c)} style={{
              display: 'block', width: '100%', textAlign: 'left', padding: '4px 8px',
              borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: '0.65rem',
              fontWeight: tags.includes(c) ? 700 : 500,
              background: tags.includes(c) ? 'rgba(167,139,250,0.1)' : 'transparent',
              color: tags.includes(c) ? 'var(--accent-primary)' : 'var(--text-secondary)',
              marginBottom: 2,
            }}>
              {tags.includes(c) ? '✓ ' : ''}{c}
            </button>
          ))}
          <button onClick={() => setOpen(false)} style={{
            width: '100%', marginTop: 4, padding: '4px', borderRadius: 4,
            border: '1px solid var(--border-subtle)', background: 'transparent',
            color: 'var(--text-muted)', fontSize: '0.6rem', cursor: 'pointer',
          }}>Done</button>
        </div>
      )}
    </div>
  );
}
