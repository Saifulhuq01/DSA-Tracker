'use client';
import { useState, useMemo, useEffect, useRef, Fragment } from 'react';
import Link from 'next/link';
import {
  ZOHO_OVERVIEW, ROUND2_PROBLEMS, ROUND3_APPS, ROUND4_QUESTIONS,
  ROUND5_QUESTIONS, THIRTY_DAY_PLAN, FINERACT_NARRATIVE, LAYOFF_NARRATIVE,
  ROUND2_RULES, ROUND3_FRAMEWORK, ZOHO_REVIEWS, ZohoProblem, DayPlan
} from '@/data/zohoData';
import { LOCAL_ROUND2_PROBLEMS, LOCAL_ROUND3_PROBLEMS } from '@/data/localZohoData';
import { useTrackerState } from '@/hooks/useTrackerState';
import { ProblemStatus } from '@/data/topics';
import { motion } from 'motion/react';
import {
  AlertTriangle, ArrowLeft, BellRing, Boxes, CalendarDays, Code2, FileText, Info, Map as MapIcon,
  MessageSquare, PlayCircle, Search, ShieldCheck, Sparkles, Target, Trophy, Zap,
} from 'lucide-react';
import { STATUS_TEXT, EASE } from '../ui';
import { 
  ConfidencePopup, RevisionDueWidget, ProblemTimer, 
  CompanyTagInput, RichNotesInput, AIHintModal,
  RecallCell, KeyInsightInput
} from '../components';
import type { RecallRating } from '@/lib/revisit';

type RecallActions = {
  rate: (topicId: number, problemId: number, rating: RecallRating) => void;
  saveInsight: (topicId: number, problemId: number, text: string) => void;
  setDate: (topicId: number, problemId: number, date: string) => void;
};

type ProblemState = { status: ProblemStatus; dateSolved: string; notes: string; nextReviseDate?: string; companyTags?: string[]; timeSpentMs?: number; [k: string]: any };

const TABS = ['Overview', 'Round 2', 'Local Round 2', 'Round 3', 'Local Round 3', 'Round 4', 'Round 5', '30-Day Plan', 'Reviews'] as const;
type Tab = typeof TABS[number];

const diffColor = (d: string) => d === 'Easy' ? '#3fb68b' : d === 'Medium' ? '#d9a441' : d === 'Hard' ? '#e5534b' : '#c8c8d0';
const dayTypeColor = (t: string) => t === 'dsa' ? 'rgba(255,255,255,0.05)' : t === 'revision' ? 'rgba(110,168,254,0.12)' : t === 'oop' ? 'rgba(255,255,255,0.06)' : 'rgba(217,164,65,0.12)';
const dayTypeBorder = (t: string) => t === 'dsa' ? 'rgba(255,255,255,0.125)' : t === 'revision' ? 'rgba(110,168,254,0.3)' : t === 'oop' ? 'rgba(255,255,255,0.15)' : 'rgba(217,164,65,0.3)';

const highlightStyles = `
  @keyframes highlightRow {
    0% { background: rgba(255,255,255,0.0); }
    30% { background: rgba(255,255,255,0.075); }
    100% { background: rgba(255,255,255,0.0); }
  }
  .highlight-row {
    animation: highlightRow 2s ease-out;
  }
`;

const platformStyle = (p: string) => {
  if (p === 'LC') return { bg: 'rgba(217,164,65,0.1)', color: '#d9a441', border: 'rgba(217,164,65,0.25)' };
  if (p === 'GFG') return { bg: 'rgba(63,182,139,0.1)', color: '#3fb68b', border: 'rgba(63,182,139,0.25)' };
  if (p === 'YT') return { bg: 'rgba(229,83,75,0.1)', color: '#e5534b', border: 'rgba(229,83,75,0.25)' };
  return { bg: 'rgba(255,255,255,0.05)', color: '#a1a1aa', border: 'rgba(255,255,255,0.125)' };
};

function ProblemTable({ 
  problems, title, groupByCategory = false, topicId, 
  setConfidenceTarget, getProblemState, cycleStatus,
  updateNotes, updateTimeSpent, updateCompanyTags, setHintProblem, recall
}: { 
  problems: ZohoProblem[]; title: string; groupByCategory?: boolean; topicId: number; 
  setConfidenceTarget: (t: { topicId: number, problemId: number } | null) => void; 
  getProblemState: (topicId: number, problemId: number) => ProblemState; 
  cycleStatus: (topicId: number, problemId: number) => ProblemStatus;
  updateNotes: (topicId: number, problemId: number, notes: string) => void;
  updateTimeSpent: (topicId: number, problemId: number, ms: number) => void;
  updateCompanyTags: (topicId: number, problemId: number, tags: string[]) => void;
  setHintProblem: (name: string) => void;
  recall: RecallActions;
}) {
  const [expandedProblemId, setExpandedProblemId] = useState<number | null>(null);

  const renderTable = (problemList: ZohoProblem[]) => (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
        <thead>
          <tr>{['#', 'Problem', 'Diff', 'Status', 'Recall', 'Date', 'Timer', 'Tags', 'Resources', 'Notes'].map(h => (
            <th key={h} style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 550, padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--border-subtle)', whiteSpace: 'nowrap' }}>{h}</th>
          ))}</tr>
        </thead>
        <tbody>
          {problemList.map((p, rowIndex) => {
            const state = getProblemState(topicId, p.id);
            const isExpanded = expandedProblemId === p.id;
            return (
              <Fragment key={`${p.id}-${rowIndex}`}>
                <tr id={`prob-${topicId}-${p.id}`} style={{ transition: 'background 0.1s' }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.015)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.75rem', color: '#c8c8d0' }}>{p.id}</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontWeight: 600, fontSize: '0.8rem', color: '#ececef' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          {p.links?.find(l => l.platform === 'LC') ? (
                            <a href={p.links.find(l => l.platform === 'LC')!.url} target="_blank" rel="noopener noreferrer" style={{ color: '#ececef', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              {p.name} <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                            </a>
                          ) : <span>{p.name}</span>}
                          
                          {(p.description || p.code) && (
                            <button 
                              onClick={() => setExpandedProblemId(isExpanded ? null : p.id)}
                              style={{ 
                                background: isExpanded ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)', 
                                color: '#c8c8d0', 
                                border: '1px solid rgba(255,255,255,0.125)', 
                                borderRadius: 4, 
                                padding: '2px 8px', 
                                fontSize: '0.62rem', 
                                cursor: 'pointer',
                                fontWeight: 700,
                                transition: 'all 0.15s',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.125)'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = isExpanded ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)'; }}
                            >
                              {isExpanded ? '▲ Hide Details' : '▼ View Details'}
                              {p.code && <span style={{ color: '#3fb68b', fontSize: '0.58rem' }}>(Code)</span>}
                            </button>
                          )}
                        </div>
                        <p style={{ fontSize: '0.65rem', color: '#62626c', marginTop: 2 }}>{p.insight}</p>
                        <KeyInsightInput value={state.keyInsight || ''} onSave={(val) => recall.saveInsight(topicId, p.id, val)} />
                        {state.nextReviseDate && state.status === 'solved' && !state.attemptLog?.length && (
                          <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                            <CalendarDays size={11} /> Revise {state.nextReviseDate}
                          </span>
                        )}
                        {state.nextReviseDate && state.status === 'revise' && (
                          <span style={{ fontSize: '0.64rem', color: 'var(--level-hard)', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                            <BellRing size={11} /> Overdue — revise now
                          </span>
                        )}
                      </div>
                      <button className="icon-btn" onClick={() => setHintProblem(p.name)} style={{ width: 24, height: 24 }} title="Get AI hint" aria-label="Get AI hint"><Sparkles size={13} /></button>
                    </div>
                  </td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className={['Easy', 'Medium', 'Hard'].includes(p.difficulty) ? `level-badge level-${p.difficulty}` : 'chip'}>{p.difficulty}</span>
                  </td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                    <button className={`status-btn status-${state.status}`} onClick={() => {
                      const next = cycleStatus(topicId, p.id);
                      // Problems on the recall ladder are scheduled by their R/Y/G rating instead
                      if (next === 'solved' && !state.attemptLog?.length) setConfidenceTarget({ topicId, problemId: p.id });
                    }} title="Click to cycle status">
                      {STATUS_TEXT[state.status]}
                    </button>
                  </td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <RecallCell
                      state={state}
                      onRate={(r) => recall.rate(topicId, p.id, r)}
                      onDateChange={(d) => recall.setDate(topicId, p.id, d)}
                    />
                  </td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontFamily: 'monospace', fontSize: '0.72rem', color: state.dateSolved ? '#ececef' : '#62626c' }}>
                    {state.dateSolved || '—'}
                  </td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                    <ProblemTimer onStop={(ms) => updateTimeSpent(topicId, p.id, ms)} />
                    {state.timeSpentMs ? (
                      <span style={{ fontSize: '0.55rem', color: '#62626c', display: 'block' }}>
                        {Math.floor(state.timeSpentMs / 60000)}m
                      </span>
                    ) : null}
                  </td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <CompanyTagInput tags={state.companyTags || []} onChange={(tags) => updateCompanyTags(topicId, p.id, tags)} />
                  </td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {p.links && p.links.length > 0 ? (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {p.links.map((link, i) => {
                          const s = platformStyle(link.platform);
                          return (
                            <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" style={{ padding: '2px 7px', borderRadius: 4, fontSize: '0.62rem', fontWeight: 700, background: s.bg, color: s.color, border: `1px solid ${s.border}`, textDecoration: 'none', whiteSpace: 'nowrap', transition: 'all 0.15s', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                              {link.platform === 'YT' && '▶ '}{link.label}
                            </a>
                          );
                        })}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.62rem', color: '#62626c', fontStyle: 'italic' }}>No links</span>
                    )}
                  </td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', minWidth: 200 }}>
                    <RichNotesInput initialNotes={state.notes || ''} onSave={(val) => updateNotes(topicId, p.id, val)} />
                  </td>
                </tr>
                {isExpanded && (p.description || p.code) && (
                  <tr>
                    <td colSpan={10} style={{ padding: '16px', background: 'rgba(0, 0, 0, 0.25)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {p.description && (
                          <div>
                            <h4 style={{ color: '#c8c8d0', fontSize: '0.8rem', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <FileText size={13} /> Problem description
                            </h4>
                            <pre style={{ 
                              whiteSpace: 'pre-wrap', 
                              fontFamily: 'inherit', 
                              fontSize: '0.78rem', 
                              color: '#a1a1aa', 
                              margin: 0, 
                              lineHeight: 1.6,
                              background: 'rgba(255, 255, 255, 0.02)',
                              padding: '12px 16px',
                              borderRadius: 8,
                              border: '1px solid rgba(255, 255, 255, 0.05)'
                            }}>
                              {p.description}
                            </pre>
                          </div>
                        )}
                        {p.code && (
                          <div>
                            <h4 style={{ color: '#3fb68b', fontSize: '0.8rem', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Code2 size={13} /> Java solution
                            </h4>
                            <pre style={{ 
                              background: '#09090b', 
                              border: '1px solid rgba(255,255,255,0.06)', 
                              borderRadius: 8, 
                              padding: '14px 18px', 
                              overflowX: 'auto', 
                              fontFamily: 'monospace', 
                              fontSize: '0.75rem', 
                              color: '#c8c8d0', 
                              margin: 0,
                              lineHeight: 1.5
                            }}>
                              <code>{p.code}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  let content;
  if (groupByCategory) {
    const grouped = problems.reduce((acc, p) => {
      if (!acc[p.category]) acc[p.category] = [];
      acc[p.category].push(p);
      return acc;
    }, {} as Record<string, ZohoProblem[]>);

    content = Object.entries(grouped).map(([category, catProblems], idx) => (
      <div key={category} style={{ borderTop: idx > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
        <div style={{ padding: '10px 18px', background: 'rgba(255,255,255,0.025)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#c8c8d0' }}>{category}</span>
          <span style={{ fontSize: '0.65rem', color: '#62626c', background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: 10 }}>{catProblems.length}</span>
        </div>
        {renderTable(catProblems)}
      </div>
    ));
  } else {
    content = renderTable(problems);
  }

  return (
    <div className="card" style={{ overflow: 'hidden', marginBottom: 20 }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>{title}</h3>
        <span style={{ fontSize: '0.7rem', color: '#62626c', fontWeight: 600 }}>{problems.length} items</span>
      </div>
      {content}
    </div>
  );
}

const INFO_ICONS: Record<string, typeof Info> = {
  '🛡️': ShieldCheck, '💬': MessageSquare, '⚠️': AlertTriangle, '🏗️': Boxes, '🎯': Target,
};

function InfoCard({ title, items, icon }: { title: string; items: string[]; icon: string }) {
  const Icon = INFO_ICONS[icon] ?? Info;
  return (
    <div className="card" style={{ padding: '18px 20px', marginBottom: 16 }}>
      <h4 style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ display: 'grid', placeItems: 'center', width: 24, height: 24, borderRadius: 7, border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}><Icon size={13} /></span> {title}
      </h4>
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item, i) => (
          <li key={i} style={{ display: 'flex', gap: 10, fontSize: '0.78rem', color: '#9a9aa4', lineHeight: 1.6 }}>
            <span className="dot" style={{ marginTop: 9, background: 'var(--text-muted)' }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DayPlanCard({ plan }: { plan: DayPlan }) {
  return (
    <div style={{ background: dayTypeColor(plan.type), border: `1px solid ${dayTypeBorder(plan.type)}`, borderRadius: 10, padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: dayTypeBorder(plan.type), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800, fontFamily: 'monospace', color: '#ececef', flexShrink: 0 }}>
        {plan.day}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ececef' }}>{plan.topic}</h4>
          <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', padding: '2px 6px', borderRadius: 4, background: dayTypeBorder(plan.type), color: '#ececef' }}>{plan.type}</span>
        </div>
        <p style={{ fontSize: '0.72rem', color: '#9a9aa4', marginBottom: 4 }}>{plan.problems}</p>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-primary)', fontWeight: 550, display: 'flex', alignItems: 'center', gap: 5 }}><Target size={11} /> {plan.goal}</p>
        {plan.video !== 'None' && <p style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 5 }}><PlayCircle size={11} /> {plan.video}</p>}
      </div>
    </div>
  );
}

export default function ZohoInterviewPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [confidenceTarget, setConfidenceTarget] = useState<{ topicId: number; problemId: number } | null>(null);
  const [search, setSearch] = useState('');
  const [hintProblem, setHintProblem] = useState<string | null>(null);
  const { 
    setSolveConfidence, data, getProblemState, cycleStatus,
    updateNotes, updateTimeSpent, updateCompanyTags,
    rateAttempt, updateKeyInsight, updateRevisitDate
  } = useTrackerState();
  const recall: RecallActions = useMemo(
    () => ({ rate: rateAttempt, saveInsight: updateKeyInsight, setDate: updateRevisitDate }),
    [rateAttempt, updateKeyInsight, updateRevisitDate]
  );

  // Search auto-scroll
  useEffect(() => {
    if (!search || search.length < 3) return;
    const s = search.toLowerCase();
    const allProbs = [...ROUND2_PROBLEMS, ...LOCAL_ROUND2_PROBLEMS, ...ROUND3_APPS, ...LOCAL_ROUND3_PROBLEMS, ...ROUND4_QUESTIONS, ...ROUND5_QUESTIONS];
    const match = allProbs.find(p => p.name.toLowerCase().includes(s));
    if (match) {
      // Find which tab it belongs to
      if (ROUND2_PROBLEMS.includes(match)) setActiveTab('Round 2');
      else if (LOCAL_ROUND2_PROBLEMS.includes(match)) setActiveTab('Local Round 2');
      else if (ROUND3_APPS.includes(match)) setActiveTab('Round 3');
      else if (LOCAL_ROUND3_PROBLEMS.includes(match)) setActiveTab('Local Round 3');
      else if (ROUND4_QUESTIONS.includes(match)) setActiveTab('Round 4');
      else if (ROUND5_QUESTIONS.includes(match)) setActiveTab('Round 5');

      setTimeout(() => {
        const id = match.id;
        const tid = ROUND2_PROBLEMS.includes(match) ? 202 : 
                    LOCAL_ROUND2_PROBLEMS.includes(match) ? 206 :
                    ROUND3_APPS.includes(match) ? 203 : 
                    LOCAL_ROUND3_PROBLEMS.includes(match) ? 207 :
                    ROUND4_QUESTIONS.includes(match) ? 204 : 205;
        const el = document.getElementById(`prob-${tid}-${id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.remove('highlight-row');
          void el.offsetWidth; // trigger reflow
          el.classList.add('highlight-row');
        }
      }, 300);
    }
  }, [search]);

  const zohoRevisionDue = useMemo(() => {
    const now = Date.now();
    const due: { topicId: number; problemId: number; problemName: string; daysOverdue: number }[] = [];
    const checkProblems = (topicId: number, problems: ZohoProblem[]) => {
      problems.forEach(p => {
        const state = data[`${topicId}-${p.id}`];
        if (state?.status === 'revise') {
          const overdue = state.nextReviseDate ? Math.max(0, Math.floor((now - new Date(state.nextReviseDate).getTime()) / 86400000)) : 0;
          due.push({ topicId, problemId: p.id, problemName: p.name, daysOverdue: overdue });
        }
      });
    };
    checkProblems(202, ROUND2_PROBLEMS);
    checkProblems(206, LOCAL_ROUND2_PROBLEMS);
    checkProblems(203, ROUND3_APPS);
    checkProblems(207, LOCAL_ROUND3_PROBLEMS);
    checkProblems(204, ROUND4_QUESTIONS);
    checkProblems(205, ROUND5_QUESTIONS);
    return due;
  }, [data]);

  return (
    <div style={{ minHeight: '100vh', color: 'var(--text-primary)' }}>
      <style>{highlightStyles}</style>
      {/* Header */}
      <header className="glass" style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid var(--border-subtle)', padding: '12px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/" className="btn btn-ghost btn-sm"><ArrowLeft size={13} /> Tracker</Link>
          <Link href="/roadmap" className="btn btn-ghost btn-sm"><MapIcon size={13} /> Roadmap</Link>
          <span style={{ width: 1, height: 18, background: 'var(--border-default)', margin: '0 6px' }} />
          <div>
            <h1 style={{ fontSize: '0.98rem', fontWeight: 650, letterSpacing: '-0.02em' }}>Zoho interview prep</h1>
            <p className="eyebrow">Verified 2023–2024 Chennai experiences · Rounds 2–5 · 30-day plan</p>
          </div>
        </div>
        <div style={{ position: 'relative', width: 260 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search Zoho problems"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
            style={{ paddingLeft: 30 }}
          />
        </div>
      </header>

      {/* Navigation */}
      <div role="tablist" style={{ padding: '0 24px', borderBottom: '1px solid var(--border-subtle)', overflowX: 'auto', display: 'flex', gap: 2, scrollbarWidth: 'none' }}>
        {TABS.map(tab => {
          const active = activeTab === tab;
          return (
            <button key={tab} role="tab" aria-selected={active} onClick={() => setActiveTab(tab)} style={{
              position: 'relative', background: 'transparent', border: 'none', padding: '13px 14px', cursor: 'pointer', whiteSpace: 'nowrap',
              fontSize: '0.78rem', fontWeight: 550, color: active ? 'var(--text-primary)' : 'var(--text-muted)', transition: 'color 0.2s',
            }}>
              {tab}
              {active && (
                <motion.span layoutId="zoho-tab-underline" transition={{ type: 'spring', stiffness: 480, damping: 38 }}
                  style={{ position: 'absolute', left: 10, right: 10, bottom: -1, height: 2, borderRadius: 2, background: 'var(--text-primary)' }} />
              )}
            </button>
          );
        })}
      </div>

      <main style={{ padding: '32px', maxWidth: 1080, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Reminder Widget */}
        {zohoRevisionDue.length > 0 && (
          <div className="card" style={{ marginBottom: 24, overflow: 'hidden' }}>
            <RevisionDueWidget items={zohoRevisionDue} />
          </div>
        )}

        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}>
        {activeTab === 'Overview' && (
          <div>
            <div style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.03))', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '28px 32px', marginBottom: 24 }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 6, color: '#ececef' }}>{ZOHO_OVERVIEW.title}</h2>
              <p style={{ fontSize: '0.78rem', color: '#c8c8d0', fontWeight: 600, marginBottom: 4 }}>{ZOHO_OVERVIEW.subtitle}</p>
              <p style={{ fontSize: '0.72rem', color: '#62626c', marginBottom: 16 }}>{ZOHO_OVERVIEW.author}</p>
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '16px 20px' }}>
                <h4 style={{ fontSize: '0.72rem', fontWeight: 700, color: '#d9a441', textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={12} /> How Zoho Chennai actually works</h4>
                {ZOHO_OVERVIEW.processNote.split('\n').map((line, i) => (
                  <p key={i} style={{ fontSize: '0.75rem', color: '#9a9aa4', lineHeight: 1.7, marginBottom: 4 }}>{line}</p>
                ))}
              </div>
            </div>
            {/* Pipeline funnel */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 24 }}>
              {[
                { round: 'R1', label: 'Written', desc: 'Aptitude + C code', color: '#62626c', skip: true },
                { round: 'R2', label: 'HackerRank', desc: '6 problems · 90 min', color: '#d9a441' },
                { round: 'R3', label: 'App Build', desc: '2-3 hrs · OOP', color: '#e5534b' },
                { round: 'R4', label: 'Technical', desc: 'Resume + Theory', color: '#a1a1aa' },
                { round: 'R5', label: 'HR', desc: 'Culture Fit', color: '#3fb68b' },
              ].map((r, i) => (
                <div key={i} style={{ background: '#111114', border: `1px solid ${r.color}30`, borderRadius: 12, padding: '16px', textAlign: 'center', position: 'relative', opacity: r.skip ? 0.5 : 1 }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'monospace', color: r.color, marginBottom: 4 }}>{r.round}</div>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ececef', marginBottom: 2 }}>{r.label}</p>
                  <p style={{ fontSize: '0.65rem', color: '#62626c' }}>{r.desc}</p>
                  {r.skip && <span style={{ position: 'absolute', top: 8, right: 8, fontSize: '0.55rem', background: 'rgba(63,182,139,0.15)', color: '#3fb68b', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>SKIP</span>}
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <InfoCard title="Fineract SQL Injection — Round 4 Card" icon="🛡️" items={FINERACT_NARRATIVE} />
              <InfoCard title="Layoff Narrative — Round 5 Script" icon="💬" items={LAYOFF_NARRATIVE} />
            </div>
          </div>
        )}

        {activeTab === 'Round 2' && (
          <div>
            <div style={{ background: 'rgba(217,164,65,0.06)', border: '1px solid rgba(217,164,65,0.2)', borderRadius: 12, padding: '16px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#d9a441' }}>Round 2 — HackerRank Coding</h2>
                <p style={{ fontSize: '0.72rem', color: '#9a9aa4' }}>⏱ 90 min · 6 Problems · Easy → Hard · Need 4+ to pass</p>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#d9a441', fontWeight: 700, padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(217,164,65,0.3)', background: 'rgba(217,164,65,0.08)' }}>3000 → 60 → 11</span>
            </div>
            <InfoCard title="Non-Negotiable Rules" icon="⚠️" items={ROUND2_RULES} />
            <ProblemTable 
              problems={ROUND2_PROBLEMS} title="Problem Bank — Confirmed Zoho Questions" groupByCategory={true} topicId={202} 
              setConfidenceTarget={setConfidenceTarget} getProblemState={getProblemState} cycleStatus={cycleStatus}
              updateNotes={updateNotes} updateTimeSpent={updateTimeSpent} updateCompanyTags={updateCompanyTags} setHintProblem={setHintProblem} recall={recall}
            />
          </div>
        )}

        {activeTab === 'Local Round 2' && (
          <div>
            <div style={{ background: 'rgba(217,164,65,0.06)', border: '1px solid rgba(217,164,65,0.2)', borderRadius: 12, padding: '16px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#d9a441' }}>Local Round 2 — Folder Practice</h2>
                <p style={{ fontSize: '0.72rem', color: '#9a9aa4' }}>Practice bank loaded directly from your local `ZOHO-interview-Questions/Round 2` folder</p>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#d9a441', fontWeight: 700, padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(217,164,65,0.3)', background: 'rgba(217,164,65,0.08)' }}>{LOCAL_ROUND2_PROBLEMS.length} Questions</span>
            </div>
            <ProblemTable 
              problems={LOCAL_ROUND2_PROBLEMS} title="Local Round 2 Problem Bank" topicId={206} 
              setConfidenceTarget={setConfidenceTarget} getProblemState={getProblemState} cycleStatus={cycleStatus}
              updateNotes={updateNotes} updateTimeSpent={updateTimeSpent} updateCompanyTags={updateCompanyTags} setHintProblem={setHintProblem} recall={recall}
            />
          </div>
        )}

        {activeTab === 'Round 3' && (
          <div>
            <div style={{ background: 'rgba(229,83,75,0.06)', border: '1px solid rgba(229,83,75,0.2)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#e5534b' }}>Round 3 — Advanced Programming</h2>
              <p style={{ fontSize: '0.72rem', color: '#9a9aa4' }}>⏱ 2–3 hours · Offline at Zoho Chennai · Laptop Given · Build Full Application</p>
              <p style={{ fontSize: '0.72rem', color: '#e5534b', fontWeight: 600, marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}><Zap size={12} /> Silent candidates are eliminated even if code is correct. TALK CONSTANTLY.</p>
            </div>
            <InfoCard title="The OOP Framework — Every Time" icon="🏗️" items={ROUND3_FRAMEWORK} />
            <ProblemTable 
              problems={ROUND3_APPS} title="Application Bank — Verified Zoho Problem Types" topicId={203} 
              setConfidenceTarget={setConfidenceTarget} getProblemState={getProblemState} cycleStatus={cycleStatus}
              updateNotes={updateNotes} updateTimeSpent={updateTimeSpent} updateCompanyTags={updateCompanyTags} setHintProblem={setHintProblem} recall={recall}
            />
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '18px 22px' }}>
              <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#c8c8d0', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><Trophy size={13} color="var(--gold)" /> The winning formula</h4>
              <p style={{ fontSize: '0.78rem', color: '#9a9aa4', lineHeight: 1.7 }}>
                The person who wins Round 3 is NOT the best algorithm solver. It is the person who builds a working application AND talks through every decision while building it. Build the Transaction Manager (Day 25). Time yourself. Narrate out loud. If you can build it in 90 min while explaining clearly, you will clear Round 3.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'Local Round 3' && (
          <div>
            <div style={{ background: 'rgba(229,83,75,0.06)', border: '1px solid rgba(229,83,75,0.2)', borderRadius: 12, padding: '16px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#e5534b' }}>Local Round 3 — App Designs</h2>
                <p style={{ fontSize: '0.72rem', color: '#9a9aa4' }}>App design questions loaded directly from your local `ZOHO-interview-Questions/Round 3` folder</p>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#e5534b', fontWeight: 700, padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(229,83,75,0.3)', background: 'rgba(229,83,75,0.08)' }}>{LOCAL_ROUND3_PROBLEMS.length} Apps</span>
            </div>
            <ProblemTable 
              problems={LOCAL_ROUND3_PROBLEMS} title="Local Round 3 Application Bank" topicId={207} 
              setConfidenceTarget={setConfidenceTarget} getProblemState={getProblemState} cycleStatus={cycleStatus}
              updateNotes={updateNotes} updateTimeSpent={updateTimeSpent} updateCompanyTags={updateCompanyTags} setHintProblem={setHintProblem} recall={recall}
            />
          </div>
        )}

        {activeTab === 'Round 4' && (
          <div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#a1a1aa' }}>Round 4 — Technical Interview</h2>
              <p style={{ fontSize: '0.72rem', color: '#9a9aa4' }}>⏱ 45–90 min · Face-to-Face · Resume + OOP + CS Theory</p>
            </div>
            <InfoCard title="What This Round Actually Is" icon="🎯" items={[
              'Interviewer reads your resume first. Every line is fair game.',
              'OOP theory: polymorphism, inheritance vs composition, SOLID — concrete examples.',
              'CS fundamentals: OS (process/thread, deadlock), DBMS (ACID, indexing), SQL.',
              'Java internals: HashMap structure, ConcurrentHashMap, @Transactional bug.',
              '1 DSA question — explain APPROACH ONLY. Speak before writing.',
              'Your Apache Fineract patch: they WILL probe this. Know every detail.'
            ]} />
            <ProblemTable 
              problems={ROUND4_QUESTIONS} title="Full Question Bank" topicId={204} 
              setConfidenceTarget={setConfidenceTarget} getProblemState={getProblemState} cycleStatus={cycleStatus}
              updateNotes={updateNotes} updateTimeSpent={updateTimeSpent} updateCompanyTags={updateCompanyTags} setHintProblem={setHintProblem} recall={recall}
            />
            <InfoCard title="Fineract Pitch — Say in 90 Seconds" icon="🛡️" items={FINERACT_NARRATIVE} />
          </div>
        )}

        {activeTab === 'Round 5' && (
          <div>
            <div style={{ background: 'rgba(63,182,139,0.06)', border: '1px solid rgba(63,182,139,0.2)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#3fb68b' }}>Round 5 — HR Round</h2>
              <p style={{ fontSize: '0.72rem', color: '#9a9aa4' }}>⏱ 30–45 min · Culture Fit · NOT a Formality — Zoho rejects here</p>
            </div>
            <InfoCard title="What They Actually Check" icon="⚠️" items={[
              'Long-term commitment — no VC-style job hopping.',
              'Higher studies intent — attrition risk check.',
              'Communication quality and self-awareness.',
              'Genuine motivation beyond "product company".',
              'They WILL ask about your layoff. Have a clean narrative.',
              "Know Zoho: Sridhar Vembu, Chennai + Tenkasi, bootstrapped, 55+ products."
            ]} />
            <ProblemTable 
              problems={ROUND5_QUESTIONS} title="HR Questions + How to Answer" topicId={205} 
              setConfidenceTarget={setConfidenceTarget} getProblemState={getProblemState} cycleStatus={cycleStatus}
              updateNotes={updateNotes} updateTimeSpent={updateTimeSpent} updateCompanyTags={updateCompanyTags} setHintProblem={setHintProblem} recall={recall}
            />
            <InfoCard title="Layoff Narrative — Say This Exactly" icon="💬" items={LAYOFF_NARRATIVE} />
          </div>
        )}

        {activeTab === '30-Day Plan' && (
          <div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#c8c8d0' }}>30-Day Execution Plan</h2>
              <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
                {[
                  { label: 'DSA', color: 'rgba(255,255,255,0.15)' },
                  { label: 'Revision/Mock', color: 'rgba(110,168,254,0.3)' },
                  { label: 'OOP Build', color: 'rgba(255,255,255,0.15)' },
                  { label: 'CS Theory', color: 'rgba(217,164,65,0.3)' },
                ].map(c => (
                  <span key={c.label} style={{ fontSize: '0.68rem', fontWeight: 600, padding: '3px 10px', borderRadius: 6, background: c.color, color: '#ececef' }}>{c.label}</span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: '0.7rem', color: '#9a9aa4' }}>
                <span>Daily: 3 problems solved</span>
                <span>⏱ 20-min rule: stuck → look approach only</span>
                <span>Day 24+: narrate out loud</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {THIRTY_DAY_PLAN.map(plan => <DayPlanCard key={plan.day} plan={plan} />)}
            </div>
          </div>
        )}

        {activeTab === 'Reviews' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '16px 20px', marginBottom: 4 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#c8c8d0' }}>Verified Chennai Experience Reviews</h2>
              <p style={{ fontSize: '0.72rem', color: '#9a9aa4' }}>Real feedback from candidates who interviewed at Zoho Chennai in 2023–2024</p>
            </div>
            {ZOHO_REVIEWS.map((rev, i) => (
              <div key={i} style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ececef' }}>{rev.candidate}</h4>
                    <p style={{ fontSize: '0.65rem', color: '#62626c' }}>Interviewed in {rev.date}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {Array.from({ length: 5 }).map((_, si) => (
                      <span key={si} style={{ color: si < rev.rating ? '#d9a441' : 'rgba(255,255,255,0.09)', fontSize: '0.8rem' }}>★</span>
                    ))}
                  </div>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#9a9aa4', lineHeight: 1.6, fontStyle: 'italic' }}>
                  "{rev.experience}"
                </p>
              </div>
            ))}
          </div>
        )}

        {confidenceTarget && (
          <ConfidencePopup
            onSelect={(confidence) => {
              setSolveConfidence(confidenceTarget.topicId, confidenceTarget.problemId, confidence);
              setConfidenceTarget(null);
            }}
            onClose={() => setConfidenceTarget(null)}
          />
        )}

        {hintProblem && (
          <AIHintModal problemName={hintProblem} onClose={() => setHintProblem(null)} />
        )}
        </motion.div>
      </main>

      <footer style={{ padding: '20px 32px', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', fontSize: '0.68rem', color: '#62626c' }}>
        Zoho Interview Prep · Mohammed Saifulhuq · Built with DSA Tracker
      </footer>
    </div>
  );
}
