'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ZOHO_OVERVIEW, ROUND2_PROBLEMS, ROUND3_APPS, ROUND4_QUESTIONS,
  ROUND5_QUESTIONS, THIRTY_DAY_PLAN, FINERACT_NARRATIVE, LAYOFF_NARRATIVE,
  ROUND2_RULES, ROUND3_FRAMEWORK, ZOHO_REVIEWS, ZohoProblem, DayPlan
} from '@/data/zohoData';
import { useTrackerState } from '@/hooks/useTrackerState';
import { STATUS_LABELS, ProblemStatus } from '@/data/topics';
import { 
  ConfidencePopup, RevisionDueWidget, ProblemTimer, 
  CompanyTagInput, RichNotesInput, AIHintModal 
} from '../components';

type ProblemState = { status: ProblemStatus; dateSolved: string; notes: string; nextReviseDate?: string; companyTags?: string[]; timeSpentMs?: number; [k: string]: any };

const TABS = ['Overview', 'Round 2', 'Round 3', 'Round 4', 'Round 5', '30-Day Plan', 'Reviews'] as const;
type Tab = typeof TABS[number];

const diffColor = (d: string) => d === 'Easy' ? '#22c55e' : d === 'Medium' ? '#f59e0b' : d === 'Hard' ? '#ef4444' : '#a78bfa';
const dayTypeColor = (t: string) => t === 'dsa' ? 'rgba(167,139,250,0.1)' : t === 'revision' ? 'rgba(59,130,246,0.12)' : t === 'oop' ? 'rgba(168,85,247,0.12)' : 'rgba(245,158,11,0.12)';
const dayTypeBorder = (t: string) => t === 'dsa' ? 'rgba(167,139,250,0.25)' : t === 'revision' ? 'rgba(59,130,246,0.3)' : t === 'oop' ? 'rgba(168,85,247,0.3)' : 'rgba(245,158,11,0.3)';

const highlightStyles = `
  @keyframes highlightRow {
    0% { background: rgba(167, 139, 250, 0); }
    30% { background: rgba(167, 139, 250, 0.15); }
    100% { background: rgba(167, 139, 250, 0); }
  }
  .highlight-row {
    animation: highlightRow 2s ease-out;
  }
`;

const platformStyle = (p: string) => {
  if (p === 'LC') return { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: 'rgba(245,158,11,0.25)' };
  if (p === 'GFG') return { bg: 'rgba(34,197,94,0.1)', color: '#22c55e', border: 'rgba(34,197,94,0.25)' };
  if (p === 'YT') return { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.25)' };
  return { bg: 'rgba(129,140,248,0.1)', color: '#818cf8', border: 'rgba(129,140,248,0.25)' };
};

function ProblemTable({ 
  problems, title, groupByCategory = false, topicId, 
  setConfidenceTarget, getProblemState, cycleStatus,
  updateNotes, updateTimeSpent, updateCompanyTags, setHintProblem
}: { 
  problems: ZohoProblem[]; title: string; groupByCategory?: boolean; topicId: number; 
  setConfidenceTarget: (t: { topicId: number, problemId: number } | null) => void; 
  getProblemState: (topicId: number, problemId: number) => ProblemState; 
  cycleStatus: (topicId: number, problemId: number) => ProblemStatus;
  updateNotes: (topicId: number, problemId: number, notes: string) => void;
  updateTimeSpent: (topicId: number, problemId: number, ms: number) => void;
  updateCompanyTags: (topicId: number, problemId: number, tags: string[]) => void;
  setHintProblem: (name: string) => void;
}) {

  const renderTable = (problemList: ZohoProblem[]) => (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
        <thead>
          <tr>{['#', 'Problem', 'Diff', 'Status', 'Date', 'Timer', 'Tags', 'Notes'].map(h => (
            <th key={h} style={{ background: '#12121a', color: '#8888a0', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #303045', whiteSpace: 'nowrap' }}>{h}</th>
          ))}</tr>
        </thead>
        <tbody>
          {problemList.map(p => {
            const state = getProblemState(topicId, p.id);
            return (
              <tr key={p.id} id={`prob-${topicId}-${p.id}`} style={{ transition: 'background 0.1s' }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(167,139,250,0.03)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #252535', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.75rem', color: '#a78bfa' }}>{p.id}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #252535', fontWeight: 600, fontSize: '0.8rem', color: '#e8e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                      {p.links?.find(l => l.platform === 'LC') ? (
                        <a href={p.links.find(l => l.platform === 'LC')!.url} target="_blank" rel="noopener noreferrer" style={{ color: '#e8e8f0', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {p.name} <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                        </a>
                      ) : p.name}
                      <p style={{ fontSize: '0.65rem', color: '#555570', marginTop: 2 }}>{p.insight}</p>
                      {state.nextReviseDate && state.status === 'solved' && (
                        <span style={{ fontSize: '0.58rem', color: '#22c55e', display: 'block', marginTop: 2 }}>
                          📅 Revise: {state.nextReviseDate}
                        </span>
                      )}
                      {state.nextReviseDate && state.status === 'revise' && (
                        <span style={{ fontSize: '0.58rem', color: '#ef4444', display: 'block', marginTop: 2 }}>
                          🔔 Overdue — revise now!
                        </span>
                      )}
                    </div>
                    <button onClick={() => setHintProblem(p.name)} style={{ background: 'none', border: 'none', color: '#8888a0', cursor: 'pointer', opacity: 0.5 }}>🤖</button>
                  </div>
                </td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #252535' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: '0.68rem', fontWeight: 700, color: diffColor(p.difficulty), background: `${diffColor(p.difficulty)}15`, border: `1px solid ${diffColor(p.difficulty)}30` }}>{p.difficulty}</span>
                </td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #252535', textAlign: 'center' }}>
                  <button className={`status-btn status-${state.status}`} onClick={() => {
                    const next = cycleStatus(topicId, p.id);
                    if (next === 'solved') setConfidenceTarget({ topicId, problemId: p.id });
                  }} title="Click to cycle status" style={{ padding: '4px 8px', fontSize: '0.65rem' }}>
                    {STATUS_LABELS[state.status]}
                  </button>
                </td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #252535', fontFamily: 'monospace', fontSize: '0.72rem', color: state.dateSolved ? '#e8e8f0' : '#555570' }}>
                  {state.dateSolved || '—'}
                </td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #252535', textAlign: 'center' }}>
                  <ProblemTimer onStop={(ms) => updateTimeSpent(topicId, p.id, ms)} />
                  {state.timeSpentMs ? (
                    <span style={{ fontSize: '0.55rem', color: '#555570', display: 'block' }}>
                      {Math.floor(state.timeSpentMs / 60000)}m
                    </span>
                  ) : null}
                </td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #252535' }}>
                  <CompanyTagInput tags={state.companyTags || []} onChange={(tags) => updateCompanyTags(topicId, p.id, tags)} />
                </td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #252535', minWidth: 200 }}>
                  <RichNotesInput initialNotes={state.notes || ''} onSave={(val) => updateNotes(topicId, p.id, val)} />
                </td>
              </tr>
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
      <div key={category} style={{ borderTop: idx > 0 ? '1px solid #252535' : 'none' }}>
        <div style={{ padding: '10px 18px', background: 'rgba(167,139,250,0.05)', borderBottom: '1px solid #252535', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#a78bfa' }}>{category}</span>
          <span style={{ fontSize: '0.65rem', color: '#555570', background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: 10 }}>{catProblems.length}</span>
        </div>
        {renderTable(catProblems)}
      </div>
    ));
  } else {
    content = renderTable(problems);
  }

  return (
    <div style={{ background: '#16161f', border: '1px solid #252535', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #252535', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e8e8f0' }}>{title}</h3>
        <span style={{ fontSize: '0.7rem', color: '#555570', fontWeight: 600 }}>{problems.length} items</span>
      </div>
      {content}
    </div>
  );
}

function InfoCard({ title, items, icon }: { title: string; items: string[]; icon: string }) {
  return (
    <div style={{ background: '#16161f', border: '1px solid #252535', borderRadius: 12, padding: '18px 20px', marginBottom: 16 }}>
      <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#a78bfa', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>{icon}</span> {title}
      </h4>
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item, i) => (
          <li key={i} style={{ display: 'flex', gap: 10, fontSize: '0.78rem', color: '#8888a0', lineHeight: 1.6 }}>
            <span style={{ color: '#a78bfa', fontSize: '0.5rem', marginTop: 7, flexShrink: 0 }}>●</span>
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
      <div style={{ width: 40, height: 40, borderRadius: 10, background: dayTypeBorder(plan.type), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800, fontFamily: 'monospace', color: '#e8e8f0', flexShrink: 0 }}>
        {plan.day}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#e8e8f0' }}>{plan.topic}</h4>
          <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', padding: '2px 6px', borderRadius: 4, background: dayTypeBorder(plan.type), color: '#e8e8f0' }}>{plan.type}</span>
        </div>
        <p style={{ fontSize: '0.72rem', color: '#8888a0', marginBottom: 4 }}>{plan.problems}</p>
        <p style={{ fontSize: '0.68rem', color: '#a78bfa', fontWeight: 600 }}>🎯 {plan.goal}</p>
        {plan.video !== 'None' && <p style={{ fontSize: '0.62rem', color: '#555570', marginTop: 2 }}>📺 {plan.video}</p>}
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
    updateNotes, updateTimeSpent, updateCompanyTags
  } = useTrackerState();

  // Search auto-scroll
  useEffect(() => {
    if (!search || search.length < 3) return;
    const s = search.toLowerCase();
    const allProbs = [...ROUND2_PROBLEMS, ...ROUND3_APPS, ...ROUND4_QUESTIONS, ...ROUND5_QUESTIONS];
    const match = allProbs.find(p => p.name.toLowerCase().includes(s));
    if (match) {
      // Find which tab it belongs to
      if (ROUND2_PROBLEMS.includes(match)) setActiveTab('Round 2');
      else if (ROUND3_APPS.includes(match)) setActiveTab('Round 3');
      else if (ROUND4_QUESTIONS.includes(match)) setActiveTab('Round 4');
      else if (ROUND5_QUESTIONS.includes(match)) setActiveTab('Round 5');

      setTimeout(() => {
        const id = match.id;
        const tid = ROUND2_PROBLEMS.includes(match) ? 202 : 
                    ROUND3_APPS.includes(match) ? 203 : 
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
    checkProblems(203, ROUND3_APPS);
    checkProblems(204, ROUND4_QUESTIONS);
    checkProblems(205, ROUND5_QUESTIONS);
    return due;
  }, [data]);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e8e8f0' }}>
      <style>{highlightStyles}</style>
      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #252535', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#8888a0', fontSize: '0.8rem', fontWeight: 600, padding: '6px 12px', borderRadius: 8, border: '1px solid #252535', background: 'rgba(255,255,255,0.02)', transition: 'all 0.15s' }}>
            ← Back to Tracker
          </Link>
          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 800, background: 'linear-gradient(135deg, #a78bfa, #818cf8, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Zoho Interview Prep
            </h1>
            <p style={{ fontSize: '0.65rem', color: '#555570' }}>Verified 2023–2024 Chennai Experiences</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Search problems..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #252535', borderRadius: 8, padding: '8px 12px 8px 32px', fontSize: '0.75rem', color: '#e8e8f0', width: 220, transition: 'all 0.15s' }} 
            />
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555570" strokeWidth="2.5" style={{ position: 'absolute', left: 10, top: 10 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.7rem', color: '#555570', padding: '4px 10px', borderRadius: 6, border: '1px solid #252535' }}>📋 Rounds 2–5</span>
            <span style={{ fontSize: '0.7rem', color: '#555570', padding: '4px 10px', borderRadius: 6, border: '1px solid #252535' }}>📅 30-Day Plan</span>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div style={{ padding: '0 32px', borderBottom: '1px solid #252535', overflowX: 'auto', display: 'flex', gap: 8 }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ background: activeTab === tab ? 'rgba(167,139,250,0.1)' : 'transparent', border: 'none', color: activeTab === tab ? '#a78bfa' : '#8888a0', padding: '14px 20px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', borderBottom: activeTab === tab ? '2px solid #a78bfa' : '2px solid transparent', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
            {tab}
          </button>
        ))}
      </div>

      <main style={{ padding: '32px', maxWidth: 1000, margin: '0 auto' }}>
        {/* Reminder Widget */}
        {zohoRevisionDue.length > 0 && (
          <div style={{ marginBottom: 24, background: '#16161f', borderRadius: 12, border: '1px solid #252535', overflow: 'hidden' }}>
            <RevisionDueWidget items={zohoRevisionDue} />
          </div>
        )}

        {activeTab === 'Overview' && (
          <div>
            <div style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.08), rgba(99,102,241,0.06))', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 16, padding: '28px 32px', marginBottom: 24 }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 6, color: '#e8e8f0' }}>{ZOHO_OVERVIEW.title}</h2>
              <p style={{ fontSize: '0.78rem', color: '#a78bfa', fontWeight: 600, marginBottom: 4 }}>{ZOHO_OVERVIEW.subtitle}</p>
              <p style={{ fontSize: '0.72rem', color: '#555570', marginBottom: 16 }}>{ZOHO_OVERVIEW.author}</p>
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '16px 20px' }}>
                <h4 style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.06em' }}>⚠ How Zoho Chennai Actually Works</h4>
                {ZOHO_OVERVIEW.processNote.split('\n').map((line, i) => (
                  <p key={i} style={{ fontSize: '0.75rem', color: '#8888a0', lineHeight: 1.7, marginBottom: 4 }}>{line}</p>
                ))}
              </div>
            </div>
            {/* Pipeline funnel */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 24 }}>
              {[
                { round: 'R1', label: 'Written', desc: 'Aptitude + C code', color: '#555570', skip: true },
                { round: 'R2', label: 'HackerRank', desc: '6 problems · 90 min', color: '#f59e0b' },
                { round: 'R3', label: 'App Build', desc: '2-3 hrs · OOP', color: '#ef4444' },
                { round: 'R4', label: 'Technical', desc: 'Resume + Theory', color: '#818cf8' },
                { round: 'R5', label: 'HR', desc: 'Culture Fit', color: '#22c55e' },
              ].map((r, i) => (
                <div key={i} style={{ background: '#16161f', border: `1px solid ${r.color}30`, borderRadius: 12, padding: '16px', textAlign: 'center', position: 'relative', opacity: r.skip ? 0.5 : 1 }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'monospace', color: r.color, marginBottom: 4 }}>{r.round}</div>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#e8e8f0', marginBottom: 2 }}>{r.label}</p>
                  <p style={{ fontSize: '0.65rem', color: '#555570' }}>{r.desc}</p>
                  {r.skip && <span style={{ position: 'absolute', top: 8, right: 8, fontSize: '0.55rem', background: 'rgba(34,197,94,0.15)', color: '#22c55e', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>SKIP</span>}
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
            <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: '16px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#f59e0b' }}>Round 2 — HackerRank Coding</h2>
                <p style={{ fontSize: '0.72rem', color: '#8888a0' }}>⏱ 90 min · 6 Problems · Easy → Hard · Need 4+ to pass</p>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 700, padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.08)' }}>3000 → 60 → 11</span>
            </div>
            <InfoCard title="Non-Negotiable Rules" icon="⚠️" items={ROUND2_RULES} />
            <ProblemTable 
              problems={ROUND2_PROBLEMS} title="Problem Bank — Confirmed Zoho Questions" groupByCategory={true} topicId={202} 
              setConfidenceTarget={setConfidenceTarget} getProblemState={getProblemState} cycleStatus={cycleStatus}
              updateNotes={updateNotes} updateTimeSpent={updateTimeSpent} updateCompanyTags={updateCompanyTags} setHintProblem={setHintProblem}
            />
          </div>
        )}

        {activeTab === 'Round 3' && (
          <div>
            <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#ef4444' }}>Round 3 — Advanced Programming</h2>
              <p style={{ fontSize: '0.72rem', color: '#8888a0' }}>⏱ 2–3 hours · Offline at Zoho Chennai · Laptop Given · Build Full Application</p>
              <p style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 600, marginTop: 6 }}>⚡ Silent candidates are eliminated even if code is correct. TALK CONSTANTLY.</p>
            </div>
            <InfoCard title="The OOP Framework — Every Time" icon="🏗️" items={ROUND3_FRAMEWORK} />
            <ProblemTable 
              problems={ROUND3_APPS} title="Application Bank — Verified Zoho Problem Types" topicId={203} 
              setConfidenceTarget={setConfidenceTarget} getProblemState={getProblemState} cycleStatus={cycleStatus}
              updateNotes={updateNotes} updateTimeSpent={updateTimeSpent} updateCompanyTags={updateCompanyTags} setHintProblem={setHintProblem}
            />
            <div style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 12, padding: '18px 22px' }}>
              <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#a78bfa', marginBottom: 8 }}>🏆 The Winning Formula</h4>
              <p style={{ fontSize: '0.78rem', color: '#8888a0', lineHeight: 1.7 }}>
                The person who wins Round 3 is NOT the best algorithm solver. It is the person who builds a working application AND talks through every decision while building it. Build the Transaction Manager (Day 25). Time yourself. Narrate out loud. If you can build it in 90 min while explaining clearly, you will clear Round 3.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'Round 4' && (
          <div>
            <div style={{ background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.2)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#818cf8' }}>Round 4 — Technical Interview</h2>
              <p style={{ fontSize: '0.72rem', color: '#8888a0' }}>⏱ 45–90 min · Face-to-Face · Resume + OOP + CS Theory</p>
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
              updateNotes={updateNotes} updateTimeSpent={updateTimeSpent} updateCompanyTags={updateCompanyTags} setHintProblem={setHintProblem}
            />
            <InfoCard title="Fineract Pitch — Say in 90 Seconds" icon="🛡️" items={FINERACT_NARRATIVE} />
          </div>
        )}

        {activeTab === 'Round 5' && (
          <div>
            <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#22c55e' }}>Round 5 — HR Round</h2>
              <p style={{ fontSize: '0.72rem', color: '#8888a0' }}>⏱ 30–45 min · Culture Fit · NOT a Formality — Zoho rejects here</p>
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
              updateNotes={updateNotes} updateTimeSpent={updateTimeSpent} updateCompanyTags={updateCompanyTags} setHintProblem={setHintProblem}
            />
            <InfoCard title="Layoff Narrative — Say This Exactly" icon="💬" items={LAYOFF_NARRATIVE} />
          </div>
        )}

        {activeTab === '30-Day Plan' && (
          <div>
            <div style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#a78bfa' }}>30-Day Execution Plan</h2>
              <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
                {[
                  { label: 'DSA', color: 'rgba(167,139,250,0.3)' },
                  { label: 'Revision/Mock', color: 'rgba(59,130,246,0.3)' },
                  { label: 'OOP Build', color: 'rgba(168,85,247,0.3)' },
                  { label: 'CS Theory', color: 'rgba(245,158,11,0.3)' },
                ].map(c => (
                  <span key={c.label} style={{ fontSize: '0.68rem', fontWeight: 600, padding: '3px 10px', borderRadius: 6, background: c.color, color: '#e8e8f0' }}>{c.label}</span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: '0.7rem', color: '#8888a0' }}>
                <span>📝 Daily: 3 problems solved</span>
                <span>⏱ 20-min rule: stuck → look approach only</span>
                <span>🗣️ Day 24+: narrate out loud</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {THIRTY_DAY_PLAN.map(plan => <DayPlanCard key={plan.day} plan={plan} />)}
            </div>
          </div>
        )}

        {activeTab === 'Reviews' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 12, padding: '16px 20px', marginBottom: 4 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#a78bfa' }}>Verified Chennai Experience Reviews</h2>
              <p style={{ fontSize: '0.72rem', color: '#8888a0' }}>Real feedback from candidates who interviewed at Zoho Chennai in 2023–2024</p>
            </div>
            {ZOHO_REVIEWS.map((rev, i) => (
              <div key={i} style={{ background: '#16161f', border: '1px solid #252535', borderRadius: 12, padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e8e8f0' }}>{rev.candidate}</h4>
                    <p style={{ fontSize: '0.65rem', color: '#555570' }}>Interviewed in {rev.date}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {Array.from({ length: 5 }).map((_, si) => (
                      <span key={si} style={{ color: si < rev.rating ? '#f59e0b' : '#303045', fontSize: '0.8rem' }}>★</span>
                    ))}
                  </div>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#8888a0', lineHeight: 1.6, fontStyle: 'italic' }}>
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
      </main>

      <footer style={{ padding: '20px 32px', borderTop: '1px solid #252535', textAlign: 'center', fontSize: '0.68rem', color: '#555570' }}>
        Zoho Interview Prep · Mohammed Saifulhuq · Built with DSA Tracker
      </footer>
    </div>
  );
}
