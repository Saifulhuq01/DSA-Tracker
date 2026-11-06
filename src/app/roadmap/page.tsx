'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, ArrowUpRight, ArrowLeftRight, BarChart3, BellRing, Building2, CalendarDays, Check,
  CircleCheck, Eye, EyeOff, Flag, Lightbulb, Search, Star, Trophy,
} from 'lucide-react';
import { ROADMAP_TOPICS, PLAN_START_DATE, type RoadmapTopic } from '@/data/roadmap';
import type { Problem } from '@/data/topics';
import { useTrackerState } from '@/hooks/useTrackerState';
import type { RoadmapEntry, TrackerRef } from '@/lib/roadmapIndex';
import {
  recallStatus, addDays, formatShortDate, RECALL_STATUSES, RATING_META, summarizeMastery,
  type RecallStatus, type MasterySummary,
} from '@/lib/revisit';
import { RecallCell, KeyInsightInput } from '../components';
import { Reveal, Stagger, StaggerItem, AnimatedNumber, celebrate, originOf, EASE } from '../ui';

/* ── Small helpers ── */

const STATUS_COLOR: Record<RecallStatus, string> = {
  New: 'var(--text-muted)',
  Red: 'var(--level-hard)',
  Yellow: 'var(--level-medium)',
  Green: 'var(--level-easy)',
  Retired: 'var(--gold)',
};

function StatusChip({ status }: { status: RecallStatus }) {
  const color = STATUS_COLOR[status];
  return (
      <motion.span
        key={status}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="chip"
        style={{
          color, borderColor: status === 'New' ? 'var(--border-default)' : `color-mix(in srgb, ${color} 35%, transparent)`,
          background: status === 'New' ? 'transparent' : `color-mix(in srgb, ${color} 9%, transparent)`,
          borderStyle: status === 'New' ? 'dashed' : 'solid',
        }}
      >
        {status === 'Retired' ? <Flag size={10} /> : status !== 'New' && <span className="dot" style={{ background: color }} />}
        {status}
      </motion.span>
  );
}

function weekText(t: RoadmapTopic): string {
  const sat = (w: number) => formatShortDate(addDays(PLAN_START_DATE, 7 * (w - 1)));
  return t.weekStart === t.weekEnd
    ? `${t.weekLabel} · Sat ${sat(t.weekStart)}`
    : `${t.weekLabel} · ${sat(t.weekStart)} – ${sat(t.weekEnd)}`;
}

function RefTags({ zoho, alsoIn }: { zoho: TrackerRef[]; alsoIn: TrackerRef[] }) {
  if (!zoho.length && !alsoIn.length) return null;
  const zohoSets = [...new Set(zoho.map((z) => z.source))];
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
      {zohoSets.map((set) => (
        <Link key={set} href="/zoho-interview" className="chip"
          title={`Also in your Zoho set (separate progress):\n${zoho.filter((z) => z.source === set).map((z) => `• ${z.name}`).join('\n')}`}>
          <Building2 size={10} /> {set}
        </Link>
      ))}
      {alsoIn.map((a) => (
        <span key={a.key} className="chip" title={`Another copy in your tracker with its own progress:\n${a.name}`}>
          <ArrowLeftRight size={10} /> also in {a.source}
        </span>
      ))}
    </div>
  );
}

function SectionTitle({ icon, title, children }: { icon: React.ReactNode; title: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
      <span style={{ display: 'grid', placeItems: 'center', width: 26, height: 26, borderRadius: 8, border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>{icon}</span>
      <h2 style={{ fontSize: '0.98rem', fontWeight: 650, letterSpacing: '-0.015em' }}>{title}</h2>
      {children}
    </div>
  );
}

const tableCard: React.CSSProperties = {
  background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 14, overflowX: 'auto',
};

/* ── Due today ── */

type QueueItem = ReturnType<typeof useTrackerState>['revisitQueue']['items'][number];

function DueToday({ items, entryByKey, urlByKey, getProblemState, onRate, onDate }: {
  items: QueueItem[];
  entryByKey: Map<string, RoadmapEntry>;
  urlByKey: Map<string, string>;
  getProblemState: ReturnType<typeof useTrackerState>['getProblemState'];
  onRate: (item: QueueItem, rating: 'red' | 'yellow' | 'green') => void;
  onDate: (item: QueueItem, date: string) => void;
}) {
  // Keys you rated while on this page stay visible (marked done) instead of vanishing mid-click
  const [doneKeys, setDoneKeys] = useState<string[]>([]);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const due = items.filter((i) => i.daysUntil <= 0 && !doneKeys.includes(i.key)); // sorted by date → most overdue first
  const done = doneKeys.map((k) => items.find((i) => i.key === k)).filter((i): i is QueueItem => !!i);
  const rows = [...due, ...done];
  const nextUp = items.find((i) => i.daysUntil > 0 && !doneKeys.includes(i.key));

  return (
    <Reveal id="due-today" style={{ marginBottom: 40, scrollMarginTop: 150 }}>
      <SectionTitle icon={<BellRing size={14} />} title="Due today">
        <span className="chip" style={due.length
          ? { color: 'var(--level-hard)', borderColor: 'rgba(229,83,75,0.3)' }
          : { color: 'var(--level-easy)', borderColor: 'rgba(63,182,139,0.3)' }}>
          {due.length ? `${due.length} to revisit` : 'All clear'}
        </span>
        <AnimatePresence>
          {done.length > 0 && (
            <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="chip" style={{ color: 'var(--level-easy)' }}>
              <Check size={10} /> {done.length} done
            </motion.span>
          )}
        </AnimatePresence>
        <span className="eyebrow" style={{ marginLeft: 'auto' }}>Re-solve from a blank page, then rate it</span>
      </SectionTitle>

      {rows.length === 0 ? (
        <div style={{ ...tableCard, display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px' }}>
          <motion.span initial={{ scale: 0.6, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            style={{ display: 'grid', placeItems: 'center', width: 34, height: 34, borderRadius: 10, background: 'var(--level-easy-bg)', color: 'var(--level-easy)' }}>
            <CircleCheck size={18} />
          </motion.span>
          <div>
            <p style={{ fontSize: '0.84rem', fontWeight: 550 }}>Nothing due today</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {nextUp ? <>Next up: <span style={{ color: 'var(--text-secondary)' }}>{nextUp.name}</span> on {formatShortDate(nextUp.nextReviseDate)}</> : 'Rate a problem and it will come back here on schedule.'}
            </p>
          </div>
        </div>
      ) : (
        <div style={tableCard}>
          <table className="data-grid">
            <thead>
              <tr>
                <th style={{ width: 110 }}>Due</th>
                <th>Problem</th>
                <th style={{ width: 190 }}>From</th>
                <th style={{ width: 56, textAlign: 'center' }}>Last</th>
                <th style={{ width: 130, textAlign: 'center' }}>Rate · next</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {rows.map((item) => {
                  const isDone = doneKeys.includes(item.key);
                  const entry = entryByKey.get(item.key);
                  const state = getProblemState(item.topicId, item.problemId);
                  const url = entry?.problem.url ?? urlByKey.get(item.key);
                  const last = RATING_META[item.rating];
                  const insightShown = revealed.has(item.key);
                  return (
                    <motion.tr
                      key={item.key}
                      layout="position"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: isDone ? 0.5 : 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35, ease: EASE }}
                    >
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', fontWeight: 600, color: isDone ? 'var(--level-easy)' : item.daysUntil < 0 ? 'var(--level-hard)' : 'var(--level-medium)' }}>
                          {isDone ? <><Check size={12} /> Done</> : item.daysUntil < 0 ? `${-item.daysUntil}d overdue` : 'Today'}
                        </span>
                        <div className="tabular" style={{ fontSize: '0.64rem', color: 'var(--text-muted)', fontFamily: 'var(--font-geist-mono)' }}>{formatShortDate(item.nextReviseDate)}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {entry && <span className="tabular" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-geist-mono)', fontSize: '0.72rem' }}>{entry.problem.lc}</span>}
                          {item.isZoho ? (
                            <Link href="/zoho-interview" className="title-link">{item.name}</Link>
                          ) : (
                            <a href={url} target="_blank" rel="noopener noreferrer" className="title-link">{item.name} <ArrowUpRight size={12} className="title-link-icon" /></a>
                          )}
                          {entry?.problem.core && <Star size={11} fill="var(--gold)" color="var(--gold)" aria-label="Core problem" />}
                        </div>
                        <div style={{ marginTop: 4 }}>
                          {state.keyInsight ? (
                            <button onClick={() => setRevealed((prev) => { const n = new Set(prev); if (n.has(item.key)) n.delete(item.key); else n.add(item.key); return n; })}
                              title="Try to recall it first — then reveal"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '0.7rem', color: insightShown ? 'var(--text-secondary)' : 'var(--text-muted)', textAlign: 'left' }}>
                              {insightShown ? <Lightbulb size={12} color="var(--gold)" /> : <Eye size={12} />}
                              <motion.span key={insightShown ? 'shown' : 'hidden'} initial={{ opacity: 0, filter: 'blur(4px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }} transition={{ duration: 0.25 }}>
                                {insightShown ? state.keyInsight : 'Reveal key insight'}
                              </motion.span>
                              {insightShown && <EyeOff size={11} style={{ opacity: 0.5 }} />}
                            </button>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.68rem', color: 'var(--text-muted)', opacity: 0.7 }}><Lightbulb size={12} /> No key insight yet — add one on its row</span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        {entry ? `${entry.topic.id}. ${entry.topic.name}` : item.source}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="dot" style={{ width: 8, height: 8, background: last.color }} title={`Last rating: ${last.label}`} />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <RecallCell
                          state={state}
                          onRate={(rating) => { onRate(item, rating); setDoneKeys((prev) => prev.includes(item.key) ? prev : [...prev, item.key]); }}
                          onDateChange={(d) => onDate(item, d)}
                        />
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </Reveal>
  );
}

/* ── Topic progress (★ Green/Retired) ── */

const BAR_ORDER: RecallStatus[] = ['Retired', 'Green', 'Yellow', 'Red'];
const BAR_COLOR: Record<RecallStatus, string> = {
  Retired: 'var(--gold)', Green: 'var(--level-easy)', Yellow: 'var(--level-medium)', Red: 'var(--level-hard)', New: 'transparent',
};

function TopicProgress({ topics, mastery }: { topics: RoadmapTopic[]; mastery: Map<number, MasterySummary> }) {
  const all = [...mastery.values()];
  const masteredCount = all.filter((m) => m.mastered).length;
  return (
    <section id="progress" style={{ marginBottom: 44, scrollMarginTop: 150 }}>
      <Reveal>
        <SectionTitle icon={<BarChart3 size={14} />} title="Topic progress">
          <span className="chip" style={{ color: 'var(--gold)', borderColor: 'rgba(214,168,79,0.3)' }}><Trophy size={10} /> {masteredCount}/{topics.length} mastered</span>
          <span className="eyebrow" style={{ marginLeft: 'auto' }}
            title="The roadmap also asks you to solve 2 unseen Medium problems from the topic in ~25 min each — do that as your own check once a topic shows the trophy.">
            Mastered when every ★ is Green or Retired
          </span>
        </SectionTitle>
      </Reveal>
      <Stagger gap={0.03} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
        {topics.map((t) => {
          const m = mastery.get(t.id)!;
          return (
            <StaggerItem key={t.id}>
              <motion.a
                id={`progress-card-${t.id}`}
                href={`#topic-${t.id}`}
                whileHover={{ y: -3 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className={`card card-hover${m.mastered ? ' sheen' : ''}`}
                style={{
                  display: 'block', textDecoration: 'none', color: 'inherit', padding: '14px 14px 13px', height: '100%',
                  borderColor: m.mastered ? 'rgba(214,168,79,0.4)' : undefined,
                  background: m.mastered ? 'linear-gradient(180deg, rgba(214,168,79,0.07), var(--bg-card) 70%)' : undefined,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0 }}>
                    <span className="tabular" style={{ fontSize: '0.62rem', fontFamily: 'var(--font-geist-mono)', color: 'var(--text-muted)' }}>{String(t.id).padStart(2, '0')}</span>
                    <p style={{ fontSize: '0.78rem', fontWeight: 550, lineHeight: 1.3, marginTop: 1 }}>{t.name}</p>
                  </div>
                  <AnimatePresence>
                    {m.mastered && (
                      <motion.span
                        initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 14 }}
                        title="Mastered: every ★ is Green or Retired"
                        style={{ color: 'var(--gold)', display: 'grid' }}
                      >
                        <Trophy size={16} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4, fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.03em', color: m.mastered ? 'var(--gold)' : m.coreDone ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    <AnimatedNumber value={m.coreDone} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ {m.coreTotal} ★</span>
                  </span>
                  <span className="tabular" style={{ marginLeft: 'auto', fontSize: '0.64rem', color: 'var(--text-muted)' }}>{t.weekLabel.replace('Mix in from ', 'from ')}</span>
                </div>
                <div style={{ display: 'flex', gap: 2, height: 4, borderRadius: 999, overflow: 'hidden', marginTop: 10, background: 'rgba(255,255,255,0.05)' }}
                  title={[...BAR_ORDER, 'New' as RecallStatus].map((s) => `${s}: ${m.coreCounts[s]}`).join(' · ') + ' (★ only)'}>
                  {BAR_ORDER.map((s, i) => (
                    <motion.div
                      key={s}
                      initial={{ width: 0 }}
                      animate={{ width: `${(m.coreCounts[s] / m.coreTotal) * 100}%` }}
                      transition={{ duration: 0.9, ease: EASE, delay: 0.1 + i * 0.05 }}
                      style={{ background: BAR_COLOR[s], borderRadius: 999 }}
                    />
                  ))}
                </div>
              </motion.a>
            </StaggerItem>
          );
        })}
      </Stagger>
    </section>
  );
}

/* ── Page ── */

type Row = {
  key: string;
  topicId: number; // tracker topic id used for progress
  problemId: number;
  lc: number | null;
  title: string;
  url: string;
  level: 'Easy' | 'Medium' | 'Hard';
  core: boolean;
  zoho: TrackerRef[];
  alsoIn: TrackerRef[];
};

const entryToRow = (e: RoadmapEntry): Row => ({
  key: e.ref.key, topicId: e.ref.topicId, problemId: e.ref.problemId,
  lc: e.problem.lc, title: e.problem.title, url: e.problem.url, level: e.problem.level, core: e.problem.core,
  zoho: e.zoho, alsoIn: e.alsoIn,
});

export default function RoadmapPage() {
  const {
    mounted, fullTopics, roadmapIndex, getProblemState,
    rateAttempt, updateKeyInsight, updateRevisitDate, revisitQueue,
  } = useTrackerState();

  const [coreOnly, setCoreOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState<RecallStatus | 'All'>('All');
  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState<string>('due-today');
  const searchRef = useRef<HTMLInputElement>(null);

  // Roadmap rows per topic, in roadmap order
  const topicRows = useMemo(() => ROADMAP_TOPICS.map((t) => ({
    topic: t,
    rows: t.problems.map((p) => entryToRow(roadmapIndex.byLc.get(p.lc)!)),
  })), [roadmapIndex]);

  // Tracker problems that aren't in the roadmap — shown at the bottom so nothing is hidden
  const trackerOnlyRows = useMemo(() => {
    const byKey = new Map<string, Problem>();
    fullTopics.forEach((t) => t.problems.forEach((p) => byKey.set(`${t.id}-${p.id}`, p)));
    return roadmapIndex.trackerOnly.map((r): Row & { source: string } => {
      const p = byKey.get(r.key)!;
      const lc = p.linkId.match(/^LC\s*#(\d+)$/)?.[1];
      return {
        key: r.key, topicId: r.topicId, problemId: r.problemId, lc: lc ? Number(lc) : null,
        title: p.name, url: p.url, level: p.level, core: false, zoho: [], alsoIn: [], source: r.source,
      };
    });
  }, [fullTopics, roadmapIndex]);

  // For the Due-today list: roadmap entry by progress key, and URLs for main-tracker problems
  const entryByKey = useMemo(() => {
    const m = new Map<string, RoadmapEntry>();
    roadmapIndex.byLc.forEach((e) => m.set(e.ref.key, e));
    return m;
  }, [roadmapIndex]);
  const urlByKey = useMemo(() => {
    const m = new Map<string, string>();
    fullTopics.forEach((t) => t.problems.forEach((p) => m.set(`${t.id}-${p.id}`, p.url)));
    return m;
  }, [fullTopics]);
  const dueCount = revisitQueue.items.filter((i) => i.daysUntil <= 0).length;

  const statusOf = (r: Row) => recallStatus(getProblemState(r.topicId, r.problemId));

  const statusCounts = useMemo(() => {
    const c: Record<RecallStatus, number> = { New: 0, Red: 0, Yellow: 0, Green: 0, Retired: 0 };
    topicRows.forEach(({ rows }) => rows.forEach((r) => { c[recallStatus(getProblemState(r.topicId, r.problemId))]++; }));
    return c;
  }, [topicRows, getProblemState]);

  const mastery = useMemo(() => {
    const m = new Map<number, MasterySummary>();
    topicRows.forEach(({ topic, rows }) => m.set(topic.id, summarizeMastery(
      rows.map((r) => ({ core: r.core, status: recallStatus(getProblemState(r.topicId, r.problemId)) })),
    )));
    return m;
  }, [topicRows, getProblemState]);

  // Confetti the moment a topic becomes mastered (not on first load)
  const masteredBefore = useRef<Set<number> | null>(null);
  useEffect(() => {
    if (!mounted) return;
    const now = new Set([...mastery].filter(([, m]) => m.mastered).map(([id]) => id));
    if (masteredBefore.current) {
      now.forEach((id) => {
        if (!masteredBefore.current!.has(id)) {
          celebrate(originOf(document.getElementById(`topic-${id}`)?.querySelector('h2') ?? null));
        }
      });
    }
    masteredBefore.current = now;
  }, [mastery, mounted]);

  // Scroll-spy for the jump nav
  useEffect(() => {
    if (!mounted) return;
    const ids = ['due-today', 'progress', ...ROADMAP_TOPICS.map((t) => `topic-${t.id}`), 'tracker-only'];
    const els = ids.map((id) => document.getElementById(id)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver((entries) => {
      const visibleEntries = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visibleEntries[0]) setActiveSection(visibleEntries[0].target.id);
    }, { rootMargin: '-160px 0px -60% 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [mounted, coreOnly, statusFilter, search]);

  // "/" focuses search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest('input, textarea');
      if (e.key === '/' && !typing) { e.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const q = search.trim().toLowerCase();
  const visible = (r: Row) =>
    (!coreOnly || r.core) &&
    (statusFilter === 'All' || statusOf(r) === statusFilter) &&
    (!q || r.title.toLowerCase().includes(q) || String(r.lc ?? '') === q.replace(/^#/, ''));
  const filtering = coreOnly || statusFilter !== 'All' || !!q;

  if (!mounted) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={{ display: 'grid', gap: 10, width: 260 }}>
          {[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 10, width: `${100 - i * 22}%` }} />)}
        </motion.div>
      </div>
    );
  }

  const renderTable = (rows: Row[], opts: { showCore: boolean; sourceOf?: (r: Row) => string }) => (
    <div style={tableCard}>
      <table className="data-grid">
        <thead>
          <tr>
            <th style={{ width: 64 }}>LC</th>
            <th>Problem</th>
            <th style={{ width: 92, textAlign: 'center' }}>Level</th>
            {opts.showCore && <th style={{ width: 40, textAlign: 'center' }} title="Core problem — do these first">★</th>}
            <th style={{ width: 96, textAlign: 'center' }}>Status</th>
            <th style={{ width: 130, textAlign: 'center' }} title="Rate today's attempt · next revisit date">Recall · next</th>
            <th style={{ width: 92 }}>Last solved</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const state = getProblemState(r.topicId, r.problemId);
            const status = recallStatus(state);
            return (
              <tr key={r.key} id={`rm-${r.key}`}>
                <td className="tabular" style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.lc ?? '—'}</td>
                <td style={{ minWidth: 280 }}>
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="title-link">
                    {r.title} <ArrowUpRight size={12} className="title-link-icon" />
                  </a>
                  {opts.sourceOf && <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}> · {opts.sourceOf(r)}</span>}
                  <KeyInsightInput value={state.keyInsight || ''} onSave={(v) => updateKeyInsight(r.topicId, r.problemId, v)} />
                  <RefTags zoho={r.zoho} alsoIn={r.alsoIn} />
                </td>
                <td style={{ textAlign: 'center' }}><span className={`level-badge level-${r.level}`}>{r.level}</span></td>
                {opts.showCore && (
                  <td style={{ textAlign: 'center' }}>
                    {r.core && <Star size={12} fill="var(--gold)" color="var(--gold)" aria-label="Core" style={{ display: 'inline' }} />}
                  </td>
                )}
                <td style={{ textAlign: 'center' }}><StatusChip status={status} /></td>
                <td style={{ textAlign: 'center' }}>
                  <RecallCell
                    state={state}
                    onRate={(rating) => rateAttempt(r.topicId, r.problemId, rating)}
                    onDateChange={(d) => updateRevisitDate(r.topicId, r.problemId, d)}
                  />
                </td>
                <td className="tabular" style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.7rem', color: state.lastSolved ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                  {state.lastSolved ? formatShortDate(state.lastSolved) : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const totalCore = topicRows.reduce((n, t) => n + t.rows.filter((r) => r.core).length, 0);
  const totalProblems = topicRows.reduce((n, t) => n + t.rows.length, 0);
  const visibleTrackerOnly = trackerOnlyRows.filter(visible);
  const coreDone = [...mastery.values()].reduce((n, m) => n + m.coreDone, 0);
  const masteredCount = [...mastery.values()].filter((m) => m.mastered).length;

  const navItems: { id: string; label: React.ReactNode; title?: string }[] = [
    { id: 'due-today', label: <><BellRing size={11} /> Due <span className="tabular" style={{ color: dueCount ? 'var(--level-hard)' : 'inherit' }}>{dueCount}</span></> },
    { id: 'progress', label: <><BarChart3 size={11} /> Progress</> },
    ...ROADMAP_TOPICS.map((t) => ({
      id: `topic-${t.id}`,
      title: t.name,
      label: <>{mastery.get(t.id)?.mastered && <Trophy size={10} color="var(--gold)" />}<span className="tabular" style={{ color: 'var(--text-muted)' }}>{t.id}</span> {t.name.split(/[:&·(]/)[0].trim()}</>,
    })),
  ];

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Header */}
      <header className="glass" style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth: 1220, margin: '0 auto', padding: '12px 28px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/" className="btn btn-ghost btn-sm"><ArrowLeft size={13} /> Tracker</Link>
            <Link href="/zoho-interview" className="btn btn-ghost btn-sm"><Building2 size={13} /> Zoho</Link>
            <span style={{ width: 1, height: 18, background: 'var(--border-default)', margin: '0 6px' }} />
            <div style={{ flex: 1, minWidth: 180 }}>
              <h1 style={{ fontSize: '0.98rem', fontWeight: 650, letterSpacing: '-0.02em' }}>Pattern roadmap</h1>
            </div>
            <div style={{ position: 'relative', width: 240 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title or LC #"
                className="input"
                style={{ paddingLeft: 30, paddingRight: 30 }}
              />
              <span className="kbd" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}>/</span>
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setCoreOnly((v) => !v)}
              aria-pressed={coreOnly}
              className="btn btn-sm"
              style={coreOnly ? { color: '#09090b', background: 'var(--gold)', borderColor: 'transparent' } : { color: 'var(--gold)' }}
            >
              <Star size={11} fill={coreOnly ? '#09090b' : 'none'} /> Core only
            </motion.button>
            <div role="tablist" aria-label="Filter by status" style={{ display: 'flex', padding: 2, gap: 2, borderRadius: 9, border: '1px solid var(--border-default)', background: 'rgba(255,255,255,0.015)' }}>
              {(['All', ...RECALL_STATUSES] as const).map((s) => {
                const active = statusFilter === s;
                const color = s === 'All' ? 'var(--text-primary)' : STATUS_COLOR[s];
                return (
                  <button key={s} role="tab" aria-selected={active} aria-pressed={active} onClick={() => setStatusFilter(s)} style={{
                    position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6, height: 24, padding: '0 10px', borderRadius: 7,
                    border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 550,
                    color: active ? 'var(--text-primary)' : 'var(--text-muted)', transition: 'color 0.2s',
                  }}>
                    {active && <motion.span layoutId="status-filter-pill" transition={{ type: 'spring', stiffness: 480, damping: 36 }} style={{ position: 'absolute', inset: 0, borderRadius: 7, background: 'rgba(255,255,255,0.07)', boxShadow: 'inset 0 0 0 1px var(--border-default)' }} />}
                    {s !== 'All' && <span className="dot" style={{ position: 'relative', background: color, opacity: active ? 1 : 0.7 }} />}
                    <span style={{ position: 'relative' }}>{s}</span>
                    {s !== 'All' && <span className="tabular" style={{ position: 'relative', opacity: 0.55 }}>{statusCounts[s]}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Jump nav with scroll-spy */}
          <nav style={{ display: 'flex', gap: 2, marginTop: 10, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
            {navItems.map((n) => {
              const active = activeSection === n.id;
              return (
                <a key={n.id} href={`#${n.id}`} title={n.title} style={{
                  position: 'relative', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5, height: 26, padding: '0 10px', borderRadius: 7,
                  fontSize: '0.7rem', fontWeight: 500, color: active ? 'var(--text-primary)' : 'var(--text-secondary)', textDecoration: 'none', whiteSpace: 'nowrap', transition: 'color 0.2s',
                }}>
                  {active && <motion.span layoutId="jump-nav-pill" transition={{ type: 'spring', stiffness: 420, damping: 36 }} style={{ position: 'absolute', inset: 0, borderRadius: 7, background: 'rgba(255,255,255,0.06)' }} />}
                  <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 5 }}>{n.label}</span>
                </a>
              );
            })}
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 1220, margin: '0 auto', padding: '28px 28px 80px', position: 'relative', zIndex: 1 }}>
        {/* Overview */}
        <Stagger onView={false} gap={0.06} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 36 }}>
          {[
            { label: 'Due today', value: dueCount, total: null as number | null, color: dueCount ? 'var(--level-hard)' : 'var(--text-primary)', icon: <BellRing size={13} /> },
            { label: 'Core Green or Retired', value: coreDone, total: totalCore, color: 'var(--text-primary)', icon: <Star size={13} /> },
            { label: 'Topics mastered', value: masteredCount, total: ROADMAP_TOPICS.length, color: masteredCount ? 'var(--gold)' : 'var(--text-primary)', icon: <Trophy size={13} /> },
            { label: 'Problems on the roadmap', value: totalProblems, total: null, color: 'var(--text-primary)', icon: <CalendarDays size={13} /> },
          ].map((s) => (
            <StaggerItem key={s.label} className="stat-card">
              <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{s.icon} {s.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 10 }}>
                <AnimatedNumber value={s.value} style={{ fontSize: '1.7rem', fontWeight: 600, letterSpacing: '-0.04em', lineHeight: 1, color: s.color }} />
                {s.total !== null && <span className="tabular" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ {s.total}</span>}
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        <DueToday
          items={revisitQueue.items}
          entryByKey={entryByKey}
          urlByKey={urlByKey}
          getProblemState={getProblemState}
          onRate={(item, rating) => rateAttempt(item.topicId, item.problemId, rating)}
          onDate={(item, d) => updateRevisitDate(item.topicId, item.problemId, d)}
        />
        <TopicProgress topics={ROADMAP_TOPICS} mastery={mastery} />

        {topicRows.map(({ topic, rows }) => {
          const shown = rows.filter(visible);
          if (filtering && !shown.length) return null;
          const m = mastery.get(topic.id)!;
          return (
            <section key={topic.id} id={`topic-${topic.id}`} style={{ marginBottom: 44, scrollMarginTop: 150 }}>
              <Reveal>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
                  <span className="tabular" style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.74rem', color: 'var(--text-muted)' }}>{String(topic.id).padStart(2, '0')}</span>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 650, letterSpacing: '-0.02em' }}>{topic.name}</h2>
                  <span className="chip"><CalendarDays size={10} /> {weekText(topic)}</span>
                  <span className="chip tabular">{rows.length} problems · {m.coreTotal} ★</span>
                    {m.mastered ? (
                      <motion.span key="m" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                        className="chip" style={{ color: 'var(--gold)', borderColor: 'rgba(214,168,79,0.4)', background: 'var(--gold-soft)' }}>
                        <Trophy size={10} /> Mastered
                      </motion.span>
                    ) : (
                      <motion.span key="p" initial={false} animate={{ opacity: 1 }} className="chip tabular"
                        style={{ color: m.coreDone ? 'var(--level-easy)' : 'var(--text-muted)' }}>
                        ★ {m.coreDone}/{m.coreTotal} Green/Retired
                      </motion.span>
                    )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 14, rowGap: 4, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 14, maxWidth: 900 }}>
                  {topic.recognise && <><span className="eyebrow" style={{ paddingTop: 2 }}>Recognise</span><span>{topic.recognise}</span></>}
                  {topic.coreIdea && <><span className="eyebrow" style={{ paddingTop: 2 }}>Core idea</span><span className="markdown-body"><ReactMarkdown components={{ p: ({ children }) => <>{children}</> }}>{topic.coreIdea}</ReactMarkdown></span></>}
                  {topic.notes.map((n, i) => (
                    <div key={i} className="markdown-body" style={{ gridColumn: '1 / -1' }}>• <ReactMarkdown components={{ p: ({ children }) => <>{children}</> }}>{n}</ReactMarkdown></div>
                  ))}
                </div>
              </Reveal>
              <Reveal delay={0.05}>{renderTable(shown, { showCore: true })}</Reveal>
            </section>
          );
        })}

        {/* Tracker-only problems */}
        {(!filtering || visibleTrackerOnly.length > 0) && (
          <section id="tracker-only" style={{ marginTop: 56, scrollMarginTop: 150 }}>
            <Reveal>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 650, letterSpacing: '-0.02em' }}>Only in my tracker</h2>
                <span className="eyebrow">{trackerOnlyRows.length} problems not on the roadmap — same progress as on the main page</span>
              </div>
            </Reveal>
            <Reveal delay={0.05}>{renderTable(visibleTrackerOnly, { showCore: false, sourceOf: (r) => (r as Row & { source: string }).source })}</Reveal>
          </section>
        )}
      </main>
    </div>
  );
}
