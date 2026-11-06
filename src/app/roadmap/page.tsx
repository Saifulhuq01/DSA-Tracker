'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { ROADMAP_TOPICS, PLAN_START_DATE, type RoadmapTopic } from '@/data/roadmap';
import type { Problem } from '@/data/topics';
import { useTrackerState } from '@/hooks/useTrackerState';
import type { RoadmapEntry, TrackerRef } from '@/lib/roadmapIndex';
import {
  recallStatus, addDays, formatShortDate, RECALL_STATUSES, RATING_META, summarizeMastery,
  type RecallStatus, type MasterySummary,
} from '@/lib/revisit';
import { RecallCell, KeyInsightInput } from '../components';

/* ── Small helpers ── */

const STATUS_STYLE: Record<RecallStatus, { color: string; bg: string; border: string }> = {
  New: { color: 'var(--text-muted)', bg: 'transparent', border: 'var(--border-default)' },
  Red: { color: '#ef4444', bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.35)' },
  Yellow: { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.35)' },
  Green: { color: '#22c55e', bg: 'rgba(34,197,94,0.10)', border: 'rgba(34,197,94,0.35)' },
  Retired: { color: '#22c55e', bg: 'transparent', border: 'rgba(34,197,94,0.35)' },
};

function StatusChip({ status }: { status: RecallStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 999, whiteSpace: 'nowrap',
      fontSize: '0.62rem', fontWeight: 700, color: s.color, background: s.bg, border: `1px solid ${s.border}`,
    }}>
      {status === 'Retired' ? '🏁 Retired' : status}
    </span>
  );
}

function weekText(t: RoadmapTopic): string {
  const sat = (w: number) => formatShortDate(addDays(PLAN_START_DATE, 7 * (w - 1)));
  return t.weekStart === t.weekEnd
    ? `${t.weekLabel} · Sat ${sat(t.weekStart)}`
    : `${t.weekLabel} · ${sat(t.weekStart)} – ${sat(t.weekEnd)}`;
}

const chipStyle = (color: string): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 6px', borderRadius: 4,
  fontSize: '0.58rem', fontWeight: 700, whiteSpace: 'nowrap', textDecoration: 'none',
  color, background: `color-mix(in srgb, ${color} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
});

function RefTags({ zoho, alsoIn }: { zoho: TrackerRef[]; alsoIn: TrackerRef[] }) {
  if (!zoho.length && !alsoIn.length) return null;
  const zohoSets = [...new Set(zoho.map((z) => z.source))];
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 3 }}>
      {zohoSets.map((set) => (
        <Link key={set} href="/zoho-interview" style={chipStyle('#a78bfa')}
          title={`Also in your Zoho set (separate progress):\n${zoho.filter((z) => z.source === set).map((z) => `• ${z.name}`).join('\n')}`}>
          🏢 {set}
        </Link>
      ))}
      {alsoIn.map((a) => (
        <span key={a.key} style={chipStyle('#818cf8')} title={`Another copy in your tracker with its own progress:\n${a.name}`}>
          ↔ also in {a.source}
        </span>
      ))}
    </div>
  );
}

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

  return (
    <section id="due-today" style={{ marginBottom: 32, scrollMarginTop: 140 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 800 }}>🔔 Due today</h2>
        <span style={{ fontSize: '0.68rem', color: due.length ? 'var(--level-hard)' : 'var(--level-easy)', fontWeight: 700 }}>
          {due.length ? `${due.length} to revisit` : 'Nothing due ✓'}
        </span>
        {done.length > 0 && <span style={{ fontSize: '0.65rem', color: 'var(--level-easy)' }}>{done.length} done this session</span>}
        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
          Most overdue first · re-solve from a blank page, then rate it · includes main-tracker and Zoho problems
        </span>
      </div>
      {rows.length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflowX: 'auto' }}>
          <table className="data-grid">
            <thead>
              <tr>
                <th style={{ width: 92 }}>Due</th>
                <th>Problem</th>
                <th style={{ width: 160 }}>From</th>
                <th style={{ width: 70, textAlign: 'center' }}>Last</th>
                <th style={{ width: 120, textAlign: 'center' }}>Rate · next</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => {
                const isDone = doneKeys.includes(item.key);
                const entry = entryByKey.get(item.key);
                const state = getProblemState(item.topicId, item.problemId);
                const url = entry?.problem.url ?? urlByKey.get(item.key);
                const last = RATING_META[item.rating];
                const insightShown = revealed.has(item.key);
                return (
                  <tr key={item.key} style={{ opacity: isDone ? 0.55 : 1 }}>
                    <td style={{ fontSize: '0.7rem', fontWeight: 700, color: isDone ? 'var(--level-easy)' : item.daysUntil < 0 ? 'var(--level-hard)' : 'var(--level-medium)' }}>
                      {isDone ? '✓ done' : item.daysUntil < 0 ? `${-item.daysUntil}d overdue` : 'today'}
                      <div style={{ fontSize: '0.58rem', fontWeight: 500, color: 'var(--text-muted)', fontFamily: 'var(--font-geist-mono)' }}>{formatShortDate(item.nextReviseDate)}</div>
                    </td>
                    <td>
                      {item.isZoho ? (
                        <Link href="/zoho-interview" style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.8rem', textDecoration: 'none' }}>{item.name}</Link>
                      ) : (
                        <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.8rem', textDecoration: 'none' }}>
                          {entry && <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-geist-mono)', fontWeight: 500 }}>{entry.problem.lc} · </span>}
                          {item.name} <span style={{ opacity: 0.3 }}>↗</span>
                        </a>
                      )}
                      {entry?.problem.core && <span style={{ color: '#fbbf24', marginLeft: 6 }} title="Core problem">★</span>}
                      <div style={{ marginTop: 2 }}>
                        {state.keyInsight ? (
                          <button onClick={() => setRevealed((prev) => { const n = new Set(prev); if (n.has(item.key)) n.delete(item.key); else n.add(item.key); return n; })}
                            title="Try to recall it first — then reveal"
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '0.66rem', color: insightShown ? '#fbbf24' : 'var(--text-muted)', textAlign: 'left' }}>
                            💡 {insightShown ? state.keyInsight : 'reveal key insight'}
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', opacity: 0.6 }}>💡 no key insight yet — add one on its row</span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                      {entry ? `${entry.topic.id}. ${entry.topic.name}` : item.source}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', background: last.color }} title={`Last rating: ${last.label}`} />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <RecallCell
                        state={state}
                        onRate={(rating) => { onRate(item, rating); setDoneKeys((prev) => prev.includes(item.key) ? prev : [...prev, item.key]); }}
                        onDateChange={(d) => onDate(item, d)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* ── Topic progress (★ Green/Retired) ── */

const BAR_ORDER: RecallStatus[] = ['Retired', 'Green', 'Yellow', 'Red', 'New'];
const BAR_COLOR: Record<RecallStatus, string> = {
  Retired: '#15803d', Green: '#22c55e', Yellow: '#f59e0b', Red: '#ef4444', New: 'var(--border-default)',
};

function TopicProgress({ topics, mastery }: { topics: RoadmapTopic[]; mastery: Map<number, MasterySummary> }) {
  const all = [...mastery.values()];
  const masteredCount = all.filter((m) => m.mastered).length;
  const coreDone = all.reduce((n, m) => n + m.coreDone, 0);
  const coreTotal = all.reduce((n, m) => n + m.coreTotal, 0);
  return (
    <section id="progress" style={{ marginBottom: 32, scrollMarginTop: 140 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 800 }}>📊 Topic progress</h2>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#fbbf24' }}>🏆 {masteredCount}/{topics.length} mastered</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>★ Green or Retired: {coreDone}/{coreTotal}</span>
        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}
          title="The roadmap also asks you to solve 2 unseen Medium problems from the topic in ~25 min each — do that as your own check once a topic shows 🏆.">
          Mastered = every ★ problem Green or Retired ⓘ
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 8 }}>
        {topics.map((t) => {
          const m = mastery.get(t.id)!;
          return (
            <a key={t.id} href={`#topic-${t.id}`} style={{
              display: 'block', textDecoration: 'none', color: 'inherit', padding: '10px 12px', borderRadius: 10,
              background: m.mastered ? 'rgba(251,191,36,0.06)' : 'var(--bg-card)',
              border: `1px solid ${m.mastered ? 'rgba(251,191,36,0.45)' : 'var(--border-subtle)'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, lineHeight: 1.3 }}>{t.id}. {t.name}</span>
                {m.mastered && <span title="Mastered: every ★ is Green or Retired" style={{ fontSize: '0.9rem' }}>🏆</span>}
              </div>
              <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: 2 }}>{t.weekLabel}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, fontFamily: 'var(--font-geist-mono)', color: m.mastered ? '#fbbf24' : m.coreDone ? 'var(--level-easy)' : 'var(--text-secondary)' }}>
                  ★ {m.coreDone}/{m.coreTotal}
                </span>
                <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>all {m.allDone}/{m.allTotal}</span>
              </div>
              <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 6, background: 'var(--border-subtle)' }}
                title={BAR_ORDER.map((s) => `${s}: ${m.coreCounts[s]}`).join(' · ') + ' (★ only)'}>
                {BAR_ORDER.map((s) => m.coreCounts[s] > 0 && (
                  <div key={s} style={{ width: `${(m.coreCounts[s] / m.coreTotal) * 100}%`, background: BAR_COLOR[s] }} />
                ))}
              </div>
            </a>
          );
        })}
      </div>
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

  const q = search.trim().toLowerCase();
  const visible = (r: Row) =>
    (!coreOnly || r.core) &&
    (statusFilter === 'All' || statusOf(r) === statusFilter) &&
    (!q || r.title.toLowerCase().includes(q) || String(r.lc ?? '') === q.replace(/^#/, ''));
  const filtering = coreOnly || statusFilter !== 'All' || !!q;

  if (!mounted) {
    return <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading roadmap…</div>;
  }

  const renderTable = (rows: Row[], opts: { showCore: boolean; sourceOf?: (r: Row) => string }) => (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflowX: 'auto' }}>
      <table className="data-grid">
        <thead>
          <tr>
            <th style={{ width: 58 }}>LC</th>
            <th>Problem · key insight</th>
            <th style={{ width: 70, textAlign: 'center' }}>Level</th>
            {opts.showCore && <th style={{ width: 36, textAlign: 'center' }} title="Core problem — do these first">★</th>}
            <th style={{ width: 84, textAlign: 'center' }}>Status</th>
            <th style={{ width: 120, textAlign: 'center' }} title="Rate today's attempt · next revisit date">Recall · next</th>
            <th style={{ width: 84 }}>Last solved</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const state = getProblemState(r.topicId, r.problemId);
            const status = recallStatus(state);
            return (
              <tr key={r.key} id={`rm-${r.key}`}>
                <td style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.lc ?? '—'}</td>
                <td style={{ minWidth: 260 }}>
                  <a href={r.url} target="_blank" rel="noopener noreferrer"
                    style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.8rem', textDecoration: 'none' }}>
                    {r.title} <span style={{ opacity: 0.3 }}>↗</span>
                  </a>
                  {opts.sourceOf && <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}> · {opts.sourceOf(r)}</span>}
                  <KeyInsightInput value={state.keyInsight || ''} onSave={(v) => updateKeyInsight(r.topicId, r.problemId, v)} />
                  <RefTags zoho={r.zoho} alsoIn={r.alsoIn} />
                </td>
                <td style={{ textAlign: 'center' }}><span className={`level-badge level-${r.level}`}>{r.level}</span></td>
                {opts.showCore && <td style={{ textAlign: 'center', color: '#fbbf24' }}>{r.core ? '★' : ''}</td>}
                <td style={{ textAlign: 'center' }}><StatusChip status={status} /></td>
                <td style={{ textAlign: 'center' }}>
                  <RecallCell
                    state={state}
                    onRate={(rating) => rateAttempt(r.topicId, r.problemId, rating)}
                    onDateChange={(d) => updateRevisitDate(r.topicId, r.problemId, d)}
                  />
                </td>
                <td style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.7rem', color: state.lastSolved ? 'var(--text-primary)' : 'var(--text-muted)' }}>
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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(10,10,15,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border-subtle)', padding: '12px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 600, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
            ← Tracker
          </Link>
          <Link href="/zoho-interview" style={{ textDecoration: 'none', color: '#a78bfa', fontSize: '0.78rem', fontWeight: 600, padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(167,139,250,0.3)' }}>
            🏢 Zoho
          </Link>
          <div style={{ flex: 1, minWidth: 180 }}>
            <h1 style={{ fontSize: '1.05rem', fontWeight: 800, background: 'linear-gradient(135deg, #a78bfa, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Pattern Roadmap
            </h1>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              {ROADMAP_TOPICS.length} topics · {totalProblems} problems · {totalCore} ★ core
            </p>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or LC #"
            style={{ width: 200, padding: '6px 10px', borderRadius: 8, background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '0.75rem' }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          <button onClick={() => setCoreOnly((v) => !v)} aria-pressed={coreOnly} style={{
            padding: '3px 10px', borderRadius: 999, cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700,
            color: coreOnly ? '#0a0a0f' : '#fbbf24', background: coreOnly ? '#fbbf24' : 'transparent', border: '1px solid rgba(251,191,36,0.4)',
          }}>★ core only</button>
          <span style={{ width: 1, height: 16, background: 'var(--border-default)', margin: '0 4px' }} />
          {(['All', ...RECALL_STATUSES] as const).map((s) => {
            const active = statusFilter === s;
            const color = s === 'All' ? 'var(--accent-primary)' : STATUS_STYLE[s].color;
            return (
              <button key={s} onClick={() => setStatusFilter(s)} aria-pressed={active} style={{
                padding: '3px 10px', borderRadius: 999, cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700,
                color: active ? '#0a0a0f' : color, background: active ? color : 'transparent',
                border: `1px solid ${active ? color : 'var(--border-default)'}`,
              }}>
                {s}{s !== 'All' && <span style={{ opacity: 0.7 }}> {statusCounts[s]}</span>}
              </button>
            );
          })}
        </div>

        {/* Topic jump nav */}
        <nav style={{ display: 'flex', gap: 4, marginTop: 8, overflowX: 'auto', paddingBottom: 2 }}>
          <a href="#due-today" style={{ flexShrink: 0, padding: '2px 8px', borderRadius: 6, fontSize: '0.62rem', fontWeight: 700, color: dueCount ? '#ef4444' : 'var(--level-easy)', border: `1px solid ${dueCount ? 'rgba(239,68,68,0.35)' : 'rgba(34,197,94,0.3)'}`, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            🔔 Due {dueCount}
          </a>
          <a href="#progress" style={{ flexShrink: 0, padding: '2px 8px', borderRadius: 6, fontSize: '0.62rem', fontWeight: 700, color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            📊 Progress
          </a>
          {ROADMAP_TOPICS.map((t) => (
            <a key={t.id} href={`#topic-${t.id}`} title={t.name} style={{ flexShrink: 0, padding: '2px 8px', borderRadius: 6, fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
              {mastery.get(t.id)?.mastered ? '🏆 ' : ''}{t.id}. {t.name.split(/[:&·(]/)[0].trim()}
            </a>
          ))}
        </nav>
      </header>

      <main style={{ maxWidth: 1180, margin: '0 auto', padding: '20px 24px 60px' }}>
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
            <section key={topic.id} id={`topic-${topic.id}`} style={{ marginBottom: 28, scrollMarginTop: 140 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 800 }}>{topic.id}. {topic.name}</h2>
                <span style={{ fontSize: '0.68rem', color: 'var(--accent-primary)', fontWeight: 600 }}>{weekText(topic)}</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{rows.length} problems · {m.coreTotal} ★</span>
                {m.mastered ? (
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#fbbf24', padding: '1px 8px', borderRadius: 999, border: '1px solid rgba(251,191,36,0.45)', background: 'rgba(251,191,36,0.08)' }}>🏆 Mastered</span>
                ) : (
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: m.coreDone ? 'var(--level-easy)' : 'var(--text-muted)' }}>★ {m.coreDone}/{m.coreTotal} Green/Retired</span>
                )}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 10, display: 'grid', gap: 2 }}>
                {topic.recognise && <p><strong style={{ color: 'var(--text-primary)' }}>Recognise it:</strong> {topic.recognise}</p>}
                {topic.coreIdea && <p><strong style={{ color: 'var(--text-primary)' }}>Core idea:</strong> <span className="markdown-body" style={{ display: 'inline' }}><ReactMarkdown components={{ p: ({ children }) => <>{children}</> }}>{topic.coreIdea}</ReactMarkdown></span></p>}
                {topic.notes.map((n, i) => (
                  <div key={i} className="markdown-body">• <ReactMarkdown components={{ p: ({ children }) => <>{children}</> }}>{n}</ReactMarkdown></div>
                ))}
              </div>
              {renderTable(shown, { showCore: true })}
            </section>
          );
        })}

        {/* Tracker-only problems */}
        {(!filtering || visibleTrackerOnly.length > 0) && (
          <section id="tracker-only" style={{ marginTop: 40 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800 }}>Only in my tracker</h2>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{trackerOnlyRows.length} problems not on the roadmap — same progress as on the main page</span>
            </div>
            {renderTable(visibleTrackerOnly, { showCore: false, sourceOf: (r) => (r as Row & { source: string }).source })}
          </section>
        )}
      </main>
    </div>
  );
}
