'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { topics, STATUS_LABELS, ProblemStatus } from '@/data/topics';
import { useTrackerState } from '@/hooks/useTrackerState';
import { useAuth } from '@/context/AuthContext';
import {
  XPLevelBadge, DailyQuestsPanel, WeaknessPanel, MockInterviewModal,
  ConfidencePopup, RevisionDueWidget, ProblemTimer, CompanyTagInput,
  GlobalPomodoro, CustomProblemModal, RichNotesInput, ShareCardModal, AIHintModal,
  RecallCell, KeyInsightInput, RevisitQueuePanel
} from './components';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowUpRight, BookOpen, Building2, CalendarDays, Check, ChevronDown as ChevronDownIcon, CircleCheck, Download, Flame,
  Hourglass, Layers, LayoutGrid, Lock, LockOpen, LogOut, Map as MapIcon, Plus, Printer, RotateCcw, RotateCw, Search,
  Share2, Sparkles, Swords, Target, Trash2, TrendingUp, Trophy, Upload, X,
} from 'lucide-react';
import { Reveal, Stagger, StaggerItem, AnimatedNumber, AnimatedBar, STATUS_TEXT, EASE } from './ui';

/* ── Tiny SVG Icons ── */
const ChevronDown = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
);
const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
);
const ExternalLink = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
);
const CheckCircle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3fb68b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);
const PrintIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
);
const ResetIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
);
const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
);
const CloudIcon = ({ syncing }: { syncing: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={syncing ? '#d9a441' : '#3fb68b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={syncing ? { animation: 'pulse 1s infinite' } : {}}>
    <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/>
  </svg>
);
const TrophyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0012 0V2z"/></svg>
);

/* ── Contribution Heatmap ── */
function ContributionHeatmap({ solveHistory }: { solveHistory: Record<string, number> }) {
  const weeks = 12;
  const today = new Date();
  const cells: { date: string; count: number; dayOfWeek: number }[] = [];

  for (let i = weeks * 7 - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    cells.push({ date: key, count: solveHistory[key] || 0, dayOfWeek: d.getDay() });
  }

  const weekGroups: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weekGroups.push(cells.slice(i, i + 7));
  }

  const getColor = (count: number) => {
    if (count === 0) return 'rgba(255,255,255,0.04)';
    if (count === 1) return 'rgba(63,182,139,0.3)';
    if (count <= 3) return 'rgba(63,182,139,0.5)';
    if (count <= 5) return 'rgba(63,182,139,0.72)';
    return 'rgba(63,182,139,0.95)';
  };

  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {weekGroups.map((week, wi) => (
        <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {week.map((cell) => (
            <motion.div
              key={cell.date}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + wi * 0.025, duration: 0.3, ease: EASE }}
              title={`${cell.date}: ${cell.count} solved`}
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: getColor(cell.count),
                cursor: 'default',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── Achievements Panel ── */
function AchievementsPanel({ achievements, onClose }: {
  achievements: { id: string; title: string; desc: string; icon: string; earned: boolean }[];
  onClose: () => void;
}) {
  const earned = achievements.filter((a) => a.earned).length;
  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        className="modal-panel"
        style={{
          borderRadius: 16,
          padding: '24px 28px',
          maxWidth: 520,
          width: '92%',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 650, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}><Trophy size={16} color="var(--gold)" /> Achievements</h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{earned} / {achievements.length} unlocked</p>
          </div>
          <button onClick={onClose} className="icon-btn" aria-label="Close"><X size={16} /></button>
        </div>
        <div className="progress-bar-track" style={{ marginBottom: 16 }}>
          <div className="progress-bar-fill" style={{ width: `${Math.round((earned / achievements.length) * 100)}%` }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {achievements.map((a) => (
            <div
              key={a.id}
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                border: `1px solid ${a.earned ? 'rgba(255,255,255,0.15)' : 'var(--border-subtle)'}`,
                background: a.earned ? 'rgba(255,255,255,0.03)' : 'var(--bg-input)',
                opacity: a.earned ? 1 : 0.45,
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{a.icon}</div>
              <p style={{ fontSize: '0.78rem', fontWeight: 700, color: a.earned ? 'var(--text-primary)' : 'var(--text-muted)' }}>{a.title}</p>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>{a.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Highlight Helper ── */
function highlightMatch(text: string, query: string) {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return parts.map((part, i) => 
    part.toLowerCase() === query.toLowerCase() ? <mark key={i} style={{ background: 'rgba(255,255,255,0.25)', color: 'inherit', borderRadius: 2, padding: '0 2px' }}>{part}</mark> : part
  );
}

export default function Home() {
  const { user, signInWithGoogle, signOut, isConfigured } = useAuth();
  const {
    mounted,
    syncing,
    startDate,
    streakData,
    achievements,
    getProblemState,
    cycleStatus,
    updateNotes,
    topicStats,
    foundationComplete,
    globalStats,
    resetAll,
    xpData,
    dailyQuests,
    weaknessReport,
    revisionDueToday,
    setSolveConfidence,
    updateCompanyTags,
    updateTimeSpent,
    generateMockInterview,
    fullTopics,
    pomodoro,
    addCustomProblem,
    deleteCustomProblem,
    addPomodoroSession,
    exportData,
    importData,
    rateAttempt,
    updateKeyInsight,
    updateRevisitDate,
    revisitQueue
  } = useTrackerState();

  const [expandedTopics, setExpandedTopics] = useState<Set<number>>(new Set([1]));
  const [activeTopic, setActiveTopic] = useState<number | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showWeakness, setShowWeakness] = useState(false);
  const [showMockInterview, setShowMockInterview] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [showCustomProblem, setShowCustomProblem] = useState(false);
  const [showHintFor, setShowHintFor] = useState<{ topicId: number; problemId: number; problemName: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [confidenceTarget, setConfidenceTarget] = useState<{ topicId: number; problemId: number } | null>(null);
  const topicRefs = useRef<Record<number, HTMLElement | null>>({});
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // cmd+k or ctrl+k to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-expand topics that match search query
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      const matchedTopics = new Set<number>();
      let firstMatchId: number | null = null;
      fullTopics.forEach((topic) => {
        if (topic.problems.some(p => p.name.toLowerCase().includes(query) || p.level.toLowerCase().includes(query) || p.platform.toLowerCase().includes(query))) {
          matchedTopics.add(topic.id);
          if (firstMatchId === null) firstMatchId = topic.id;
        }
      });
      if (matchedTopics.size > 0) {
        setExpandedTopics(prev => {
          const next = new Set(prev);
          matchedTopics.forEach(id => next.add(id));
          return next;
        });
        
        // Auto-scroll to the first match
        if (firstMatchId !== null && topicRefs.current[firstMatchId]) {
          topicRefs.current[firstMatchId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
  }, [searchQuery, fullTopics]);

  const toggleTopic = useCallback((id: number) => {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const scrollToTopic = useCallback((id: number) => {
    setActiveTopic(id);
    setExpandedTopics((prev) => new Set(prev).add(id));
    topicRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Jump to a problem from the revisit queue (Zoho items live on the Zoho page)
  const openQueueItem = useCallback((item: { topicId: number; problemId: number; isZoho: boolean }) => {
    if (item.isZoho) { window.location.assign('/zoho-interview'); return; }
    scrollToTopic(item.topicId);
    setTimeout(() => {
      document.getElementById(`prob-${item.topicId}-${item.problemId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  }, [scrollToTopic]);

  const isTopicLocked = useCallback(
    (topicId: number) => topicId >= 13 && !foundationComplete,
    [foundationComplete]
  );

  const handleReset = useCallback(() => {
    resetAll();
    setShowResetConfirm(false);
    setExpandedTopics(new Set([1]));
  }, [resetAll]);

  const earnedCount = useMemo(() => achievements.filter((a) => a.earned).length, [achievements]);

  // Loading skeleton
  if (!mounted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex' }}>
        <div style={{ width: 272, borderRight: '1px solid var(--border-subtle)', padding: 18, display: 'grid', gap: 12, alignContent: 'start' }}>
          {[55, 85, 70, 90, 65, 80].map((w, i) => <div key={i} className="skeleton" style={{ height: 11, width: `${w}%` }} />)}
        </div>
        <div style={{ flex: 1, padding: 32, display: 'grid', gap: 14, alignContent: 'start' }}>
          <div className="skeleton" style={{ height: 16, width: 200 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            {[0, 1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 86, borderRadius: 14 }} />)}
          </div>
          <div className="skeleton" style={{ height: 340, borderRadius: 14 }} />
        </div>
      </div>
    );
  }

  const startLabel = (() => {
    const d = new Date(startDate);
    return isNaN(d.getTime()) ? startDate : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  })();
  const roadmapDue = revisitQueue.items.filter((i) => i.daysUntil <= 0).length;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* ─── Sidebar ─── */}
      <aside
        className="no-print"
        style={{
          width: 272, minWidth: 272, background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-subtle)',
          position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
          display: 'flex', flexDirection: 'column', zIndex: 20,
        }}
      >
        {/* Brand + auth */}
        <div style={{ padding: '16px 14px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <motion.div
              initial={{ rotate: -12, scale: 0.85, opacity: 0 }} animate={{ rotate: 0, scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16 }}
              style={{ width: 30, height: 30, borderRadius: 9, display: 'grid', placeItems: 'center', flexShrink: 0, background: 'linear-gradient(145deg, #2b2b31, #141417)', border: '1px solid var(--border-default)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)' }}
            >
              <Layers size={15} color="var(--text-primary)" />
            </motion.div>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: '0.88rem', fontWeight: 650, letterSpacing: '-0.02em' }}>DSA Tracker</h1>
              <p style={{ fontSize: '0.64rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Since {startLabel}</p>
            </div>
          </div>
          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-label="Account"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid var(--border-hover)' }} />
                ) : (
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border-hover)', display: 'grid', placeItems: 'center', fontSize: '0.68rem', fontWeight: 600 }}>
                    {user.displayName?.[0] || 'U'}
                  </div>
                )}
                <CloudIcon syncing={syncing} />
              </button>
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.97 }}
                    transition={{ duration: 0.16, ease: EASE }}
                    style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: 'var(--bg-elevated)', borderRadius: 12, padding: 6, minWidth: 200, zIndex: 100, boxShadow: 'var(--shadow-pop)', transformOrigin: 'top right' }}
                  >
                    <div style={{ padding: '6px 8px 8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 4 }}>
                      <p style={{ fontSize: '0.76rem', fontWeight: 600 }}>{user.displayName}</p>
                      <p style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>{user.email}</p>
                    </div>
                    <div style={{ padding: '4px 8px', fontSize: '0.68rem', color: 'var(--status-solved)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CloudIcon syncing={false} /> Cloud sync active
                    </div>
                    <button onClick={() => { signOut(); setShowUserMenu(false); }} className="btn btn-ghost btn-sm btn-danger" style={{ width: '100%', justifyContent: 'flex-start', marginTop: 2 }}>
                      <LogOut size={13} /> Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button onClick={signInWithGoogle} className="btn btn-sm">
              <GoogleIcon /> Sign in
            </button>
          )}
        </div>

        {/* Primary navigation */}
        <nav style={{ padding: '2px 8px 10px', display: 'grid', gap: 1, borderBottom: '1px solid var(--border-subtle)' }}>
          <span className="nav-item active"><LayoutGrid size={14} /> Overview</span>
          <Link href="/roadmap" className="nav-item">
            <MapIcon size={14} /> Pattern roadmap
            {roadmapDue > 0 && <span className="chip tabular" style={{ marginLeft: 'auto', height: 18, color: 'var(--level-hard)', borderColor: 'rgba(229,83,75,0.3)' }}>{roadmapDue} due</span>}
          </Link>
          <Link href="/zoho-interview" className="nav-item"><Building2 size={14} /> Zoho interview</Link>
        </nav>

        {/* Momentum */}
        <div className="side-section">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 14 }}>
            {[
              { icon: <Flame size={11} />, label: 'Streak', value: streakData.currentStreak, color: streakData.currentStreak > 0 ? 'var(--level-medium)' : 'var(--text-primary)' },
              { icon: <TrendingUp size={11} />, label: 'Best', value: streakData.longestStreak, color: 'var(--text-primary)' },
              { icon: <CalendarDays size={11} />, label: 'Days', value: streakData.totalDaysActive, color: 'var(--text-primary)' },
            ].map((s) => (
              <div key={s.label} style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.015)' }}>
                <AnimatedNumber value={s.value} style={{ fontSize: '1.05rem', fontWeight: 600, letterSpacing: '-0.03em', color: s.color, display: 'block', lineHeight: 1.2 }} />
                <span className="eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{s.icon} {s.label}</span>
              </div>
            ))}
          </div>

          <div className="side-title">Last 12 weeks</div>
          <ContributionHeatmap solveHistory={streakData.solveHistory} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 14, marginBottom: 6 }}>
            <span className="eyebrow">Overall</span>
            <AnimatedNumber value={globalStats.pct} suffix="%" style={{ fontSize: '0.92rem', fontWeight: 600 }} />
          </div>
          <AnimatedBar pct={globalStats.pct} color={globalStats.pct === 100 ? 'var(--level-easy)' : undefined} />
          <div className="tabular" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px', fontSize: '0.66rem', color: 'var(--text-secondary)', marginTop: 10 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span className="dot" style={{ background: 'var(--status-solved)' }} />{globalStats.totalSolved} solved</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span className="dot" style={{ background: 'var(--status-attempted)' }} />{globalStats.totalAttempted} trying</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span className="dot" style={{ background: 'var(--status-revise)' }} />{globalStats.totalRevise} to revise</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}><span className="dot" style={{ background: 'var(--text-muted)' }} />{globalStats.allTotal} total</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: '0.66rem', color: foundationComplete ? 'var(--level-easy)' : 'var(--text-muted)' }}>
            {foundationComplete ? <LockOpen size={12} /> : <Lock size={12} />}
            {foundationComplete ? 'DP topics unlocked' : 'DP topics unlock at 80% of topics 1–7'}
          </div>
        </div>

        <XPLevelBadge xpData={xpData} />
        <GlobalPomodoro pomodoroData={pomodoro} onComplete={addPomodoroSession} />
        <DailyQuestsPanel quests={dailyQuests} />
        <RevisitQueuePanel queue={revisitQueue} onOpen={openQueueItem} />
        <RevisionDueWidget items={revisionDueToday} />

        {/* Topic nav */}
        <nav style={{ flex: 1, padding: '12px 8px' }}>
          <div className="side-title" style={{ padding: '0 6px' }}>Topics <span className="tabular" style={{ marginLeft: 'auto' }}>{fullTopics.length}</span></div>
          <div style={{ display: 'grid', gap: 1 }}>
            {fullTopics.map((topic) => {
              const stats = topicStats.find((s) => s.topicId === topic.id);
              const locked = isTopicLocked(topic.id);
              const active = activeTopic === topic.id;
              const complete = stats?.pct === 100;
              return (
                <button key={topic.id} className="nav-item" onClick={() => scrollToTopic(topic.id)} style={{ opacity: locked ? 0.45 : 1, color: active ? 'var(--text-primary)' : undefined }}>
                  {active && <motion.span layoutId="side-topic-pill" transition={{ type: 'spring', stiffness: 450, damping: 38 }} style={{ position: 'absolute', inset: 0, borderRadius: 8, background: 'rgba(255,255,255,0.06)' }} />}
                  <span className="tabular" style={{ position: 'relative', width: 18, fontFamily: 'var(--font-geist-mono)', fontSize: '0.64rem', color: 'var(--text-muted)', flexShrink: 0, display: 'grid', placeItems: 'center' }}>
                    {locked ? <Lock size={11} /> : topic.id}
                  </span>
                  <span style={{ position: 'relative', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.74rem' }}>{topic.name}</span>
                  <span className="tabular" style={{ position: 'relative', fontSize: '0.64rem', color: complete ? 'var(--level-easy)' : stats && stats.solved > 0 ? 'var(--text-secondary)' : 'var(--text-muted)', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    {complete && <Check size={11} />}{stats?.solved}/{topic.total}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Tools */}
        <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
          <button className="icon-btn tip-start" data-tip={`Achievements ${earnedCount}/${achievements.length}`} onClick={() => setShowAchievements(true)} aria-label="Achievements">
            <Trophy size={15} />
            {earnedCount > 0 && <span className="tabular" style={{ position: 'absolute', top: 3, right: 3, minWidth: 13, height: 13, padding: '0 3px', borderRadius: 7, background: 'var(--gold)', color: '#09090b', fontSize: '0.52rem', fontWeight: 700, display: 'grid', placeItems: 'center' }}>{earnedCount}</span>}
          </button>
          <button className="icon-btn" data-tip="Share card" onClick={() => setShowShareCard(true)} aria-label="Share card"><Share2 size={15} /></button>
          <button className="icon-btn" data-tip="Weakness detector" onClick={() => setShowWeakness(true)} aria-label="Weakness detector"><Target size={15} /></button>
          <button className="icon-btn" data-tip="Mock interview" onClick={() => setShowMockInterview(true)} aria-label="Mock interview"><Swords size={15} /></button>
          <button className="icon-btn" data-tip="Export backup" onClick={exportData} aria-label="Export backup"><Download size={15} /></button>
          <label className="icon-btn" data-tip="Import backup" aria-label="Import backup" style={{ margin: 0 }}>
            <input type="file" accept=".json" style={{ display: 'none' }} onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => importData(ev.target?.result as string);
                reader.readAsText(file);
              }
            }} />
            <Upload size={15} />
          </label>
          <button className="icon-btn" data-tip="Print" onClick={() => window.print()} aria-label="Print"><Printer size={15} /></button>
          <button className="icon-btn danger tip-end" data-tip="Reset progress" onClick={() => setShowResetConfirm(true)} aria-label="Reset progress"><RotateCcw size={15} /></button>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main style={{ flex: 1, minWidth: 0, overflow: 'auto', position: 'relative', zIndex: 1 }}>
        <header className="glass" style={{ position: 'sticky', top: 0, zIndex: 15, borderBottom: '1px solid var(--border-subtle)', padding: '12px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flexShrink: 0 }}>
            <h2 style={{ fontSize: '0.98rem', fontWeight: 650, letterSpacing: '-0.02em' }}>Overview</h2>
            <p className="eyebrow tabular">{fullTopics.length} topics · {globalStats.allTotal} problems</p>
          </div>
          <div style={{ flex: 1, maxWidth: 380, marginLeft: 'auto', position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search problems"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input"
              style={{ paddingLeft: 30, paddingRight: 48 }}
            />
            <span className="kbd" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}>⌘K</span>
          </div>
          {user && (
            <span className="chip" style={{ color: syncing ? 'var(--level-medium)' : 'var(--level-easy)' }}>
              <CloudIcon syncing={syncing} /> {syncing ? 'Syncing…' : 'Synced'}
            </span>
          )}
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowCustomProblem(true)} className="btn btn-primary">
            <Plus size={14} /> Add problem
          </motion.button>
        </header>

        {/* ─── Progress summary ─── */}
        <section style={{ padding: '30px 32px 18px' }}>
          <Reveal>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 650, letterSpacing: '-0.03em' }}>Progress</h2>
              <span className="eyebrow">Started {startLabel}</span>
            </div>
          </Reveal>

          <Stagger onView={false} gap={0.05} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Total problems', value: globalStats.allTotal, color: 'var(--text-primary)', icon: <Layers size={12} /> },
              { label: 'Solved', value: globalStats.totalSolved, color: 'var(--status-solved)', icon: <CircleCheck size={12} /> },
              { label: 'Attempted', value: globalStats.totalAttempted, color: 'var(--status-attempted)', icon: <Hourglass size={12} /> },
              { label: 'To revise', value: globalStats.totalRevise, color: 'var(--status-revise)', icon: <RotateCw size={12} /> },
              { label: 'Current streak', value: streakData.currentStreak, color: 'var(--text-primary)', icon: <Flame size={12} /> },
            ].map((s) => (
              <StaggerItem key={s.label} className="stat-card">
                <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{s.icon} {s.label}</div>
                <AnimatedNumber value={s.value} style={{ display: 'block', marginTop: 12, fontSize: '1.8rem', fontWeight: 600, letterSpacing: '-0.045em', lineHeight: 1, color: s.color }} />
              </StaggerItem>
            ))}
          </Stagger>

          <Reveal delay={0.1}>
            <div className="card" style={{ overflow: 'hidden' }}>
              <table className="data-grid">
                <thead>
                  <tr>
                    <th style={{ width: 48 }}>#</th>
                    <th>Topic</th>
                    <th style={{ width: 64, textAlign: 'center' }}>Total</th>
                    <th style={{ width: 70, textAlign: 'center' }}>Easy</th>
                    <th style={{ width: 70, textAlign: 'center' }}>Medium</th>
                    <th style={{ width: 70, textAlign: 'center' }}>Hard</th>
                    <th style={{ width: 84, textAlign: 'center' }}>Solved</th>
                    <th style={{ width: 150 }}>Progress</th>
                    <th style={{ width: 110 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {fullTopics.map((topic, i) => {
                    const stats = topicStats.find((s) => s.topicId === topic.id);
                    const locked = isTopicLocked(topic.id);
                    const statusColor = stats?.statusLabel === 'Complete' ? 'var(--level-easy)' : stats?.statusLabel === 'In Progress' ? 'var(--status-attempted)' : 'var(--text-muted)';
                    return (
                      <tr key={topic.id} style={{ cursor: 'pointer', opacity: locked ? 0.45 : 1 }} onClick={() => scrollToTopic(topic.id)}>
                        <td className="tabular" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-geist-mono)', fontSize: '0.72rem' }}>{locked ? <Lock size={12} /> : String(topic.id).padStart(2, '0')}</td>
                        <td style={{ fontWeight: 550 }}>{topic.name}</td>
                        <td className="tabular" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{topic.total}</td>
                        <td style={{ textAlign: 'center' }}><span className="level-badge level-Easy tabular">{topic.easy}</span></td>
                        <td style={{ textAlign: 'center' }}><span className="level-badge level-Medium tabular">{topic.medium}</span></td>
                        <td style={{ textAlign: 'center' }}><span className="level-badge level-Hard tabular">{topic.hard}</span></td>
                        <td className="tabular" style={{ textAlign: 'center', fontWeight: 550, color: stats?.solved === topic.total ? 'var(--level-easy)' : 'var(--text-primary)' }}>
                          {stats?.solved}<span style={{ color: 'var(--text-muted)' }}> / {topic.total}</span>
                        </td>
                        <td><AnimatedBar pct={stats?.pct || 0} delay={i * 0.03} color={stats?.pct === 100 ? 'var(--level-easy)' : undefined} /></td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: statusColor }}>
                            <span className="dot" style={{ background: statusColor }} />{stats?.statusLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <td></td>
                    <td style={{ fontWeight: 600 }}>Total</td>
                    <td className="tabular" style={{ textAlign: 'center', fontWeight: 600 }}>{globalStats.allTotal}</td>
                    <td colSpan={3}></td>
                    <td className="tabular" style={{ textAlign: 'center', fontWeight: 600 }}>{globalStats.totalSolved}<span style={{ color: 'var(--text-muted)' }}> / {globalStats.allTotal}</span></td>
                    <td><AnimatedBar pct={globalStats.pct} color={globalStats.pct === 100 ? 'var(--level-easy)' : undefined} /></td>
                    <td className="tabular" style={{ fontWeight: 600 }}>{globalStats.pct}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Reveal>
        </section>

        {/* ─── Topic Sections ─── */}
        {fullTopics.map((topic) => {
          const stats = topicStats.find((s) => s.topicId === topic.id);
          const locked = isTopicLocked(topic.id);
          const expanded = expandedTopics.has(topic.id);

          return (
            <section
              key={topic.id}
              ref={(el) => { topicRefs.current[topic.id] = el; }}
              className="topic-section"
              style={{ padding: '0 32px 8px', opacity: locked ? 0.4 : 1, pointerEvents: locked ? 'none' : 'auto', transition: 'opacity 0.3s' }}
            >
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 20, marginBottom: 16 }}>
                <div role="button" aria-expanded={expanded} tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTopic(topic.id); } }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: 16 }} onClick={() => toggleTopic(topic.id)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                    <div className="tabular" style={{ width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center', flexShrink: 0, border: `1px solid ${stats?.pct === 100 ? 'rgba(63,182,139,0.35)' : 'var(--border-default)'}`, background: stats?.pct === 100 ? 'var(--level-easy-bg)' : 'rgba(255,255,255,0.02)', fontFamily: 'var(--font-geist-mono)', fontSize: '0.74rem', fontWeight: 600, color: stats?.pct === 100 ? 'var(--level-easy)' : 'var(--text-secondary)' }}>
                      {locked ? <Lock size={13} /> : stats?.pct === 100 ? <Check size={15} /> : String(topic.id).padStart(2, '0')}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h3 style={{ fontSize: '1.02rem', fontWeight: 650, letterSpacing: '-0.02em' }}>{topic.name}</h3>
                      <p className="tabular" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{topic.total} problems · {stats?.solved} solved · {stats?.pct}%</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                    <div style={{ width: 120 }}><AnimatedBar pct={stats?.pct || 0} color={stats?.pct === 100 ? 'var(--level-easy)' : undefined} /></div>
                    <motion.span animate={{ rotate: expanded ? 0 : -90 }} transition={{ type: 'spring', stiffness: 320, damping: 24 }} style={{ color: 'var(--text-muted)', display: 'grid' }}>
                      <ChevronDownIcon size={16} />
                    </motion.span>
                  </div>
                </div>
              </div>

              <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  key="topic-body"
                  initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
                  animate={{ height: 'auto', opacity: 1, transitionEnd: { overflow: 'visible' } }}
                  exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
                  transition={{ duration: 0.45, ease: EASE }}
                >
                <div style={{ paddingBottom: 8 }}>
                  {/* Key Concepts */}
                  <div className="card" style={{ padding: '16px 20px', marginBottom: 12 }}>
                    <h4 className="eyebrow" style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><BookOpen size={12} /> Key concepts</h4>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {topic.concepts.map((c, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          <span className="dot" style={{ marginTop: 8, background: 'var(--text-muted)' }} />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Mini progress table */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1, background: 'var(--border-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
                    {['Total', 'Easy', 'Medium', 'Hard', 'Solved', '%'].map((label) => (
                      <div key={label} style={{ background: 'var(--bg-secondary)', padding: '6px 12px', textAlign: 'center', fontSize: '0.66rem', fontWeight: 550, color: 'var(--text-muted)' }}>{label}</div>
                    ))}
                    {([
                      { v: topic.total, c: 'var(--text-primary)' },
                      { v: topic.easy, c: 'var(--level-easy)' },
                      { v: topic.medium, c: 'var(--level-medium)' },
                      { v: topic.hard, c: 'var(--level-hard)' },
                      { v: stats?.solved || 0, c: stats?.solved === topic.total ? 'var(--level-easy)' : 'var(--accent-primary)' },
                      { v: `${stats?.pct || 0}%`, c: stats?.pct === 100 ? 'var(--level-easy)' : 'var(--accent-primary)' },
                    ] as { v: number | string; c: string }[]).map((cell, idx) => (
                      <div key={idx} style={{ background: 'var(--bg-card)', padding: '8px 12px', textAlign: 'center', fontSize: '1rem', fontWeight: 600, fontFamily: 'var(--font-geist-mono)', fontVariantNumeric: 'tabular-nums', color: cell.c }}>{cell.v}</div>
                    ))}
                  </div>

                  {/* Problem grid */}
                  <div className="card" style={{ overflow: 'hidden' }}>
                    <table className="data-grid problem-grid">
                      <thead>
                        <tr>
                          <th style={{ width: 36, textAlign: 'center' }}>#</th>
                          <th>Problem</th>
                          <th style={{ width: 70, textAlign: 'center' }}>Level</th>
                          <th style={{ width: 80 }}>Platform</th>
                          <th style={{ width: 95 }}>Link / ID</th>
                          <th style={{ width: 115, textAlign: 'center' }}>Status</th>
                          <th style={{ width: 112, textAlign: 'center' }} title="Red / Yellow / Green for today's attempt, and the next revisit date">Recall</th>
                          <th style={{ width: 100 }}>Date Solved</th>
                          <th style={{ width: 70, textAlign: 'center' }}>Timer</th>
                          <th style={{ width: 50, textAlign: 'center' }}>Tags</th>
                          <th style={{ minWidth: 120 }}>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topic.problems.filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.level.toLowerCase().includes(searchQuery.toLowerCase()) || p.platform.toLowerCase().includes(searchQuery.toLowerCase())).map((problem) => {
                          const state = getProblemState(topic.id, problem.id);
                          const isSolved = state.status === 'solved';
                          return (
                            <tr key={problem.id} id={`prob-${topic.id}-${problem.id}`}>
                              <td style={{ textAlign: 'center', fontFamily: 'var(--font-geist-mono)', fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {problem.linkId === 'Custom' ? 'C' : problem.id}
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                  <a
                                    href={problem.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      color: isSolved ? 'var(--text-secondary)' : 'var(--text-primary)',
                                      textDecorationLine: isSolved ? 'line-through' : 'none',
                                      textDecorationColor: 'rgba(63,182,139,0.45)',
                                      textDecorationStyle: 'solid' as const,
                                      fontSize: '0.8rem',
                                      fontWeight: 550,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 6,
                                      transition: 'color 0.15s',
                                    }}
                                  >
                                    {highlightMatch(problem.name, searchQuery)}
                                    <ArrowUpRight size={12} className="title-link-icon" style={{ flexShrink: 0 }} />
                                  </a>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                                    <button className="icon-btn" onClick={() => setShowHintFor({ topicId: topic.id, problemId: problem.id, problemName: problem.name })} style={{ width: 24, height: 24 }} title="Get AI hint" aria-label="Get AI hint"><Sparkles size={13} /></button>
                                    {problem.linkId === 'Custom' && (
                                      <button className="icon-btn danger" onClick={() => deleteCustomProblem(problem.id)} style={{ width: 24, height: 24 }} title="Delete custom problem" aria-label="Delete custom problem"><Trash2 size={13} /></button>
                                    )}
                                  </div>
                                </div>
                                <KeyInsightInput value={state.keyInsight || ''} onSave={(val) => updateKeyInsight(topic.id, problem.id, val)} />
                                {state.nextReviseDate && state.status === 'solved' && !state.attemptLog?.length && (
                                  <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                                    <CalendarDays size={11} /> Revise {state.nextReviseDate}
                                  </span>
                                )}
                              </td>
                              <td style={{ textAlign: 'center' }}><span className={`level-badge level-${problem.level}`}>{problem.level}</span></td>
                              <td><span className="platform-badge">{problem.platform}</span></td>
                              <td style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{problem.linkId}</td>
                              <td style={{ textAlign: 'center' }}>
                                <button className={`status-btn status-${state.status}`} onClick={() => {
                                  const next = cycleStatus(topic.id, problem.id);
                                  // Problems on the recall ladder are scheduled by their R/Y/G rating instead
                                  if (next === 'solved' && !state.attemptLog?.length) {
                                    setConfidenceTarget({ topicId: topic.id, problemId: problem.id });
                                  }
                                }} title="Click to cycle status">
                                  {STATUS_TEXT[state.status]}
                                </button>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <RecallCell
                                  state={state}
                                  onRate={(r) => rateAttempt(topic.id, problem.id, r)}
                                  onDateChange={(d) => updateRevisitDate(topic.id, problem.id, d)}
                                />
                              </td>
                              <td style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.72rem', color: state.dateSolved ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                {state.dateSolved || '—'}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <ProblemTimer onStop={(ms) => updateTimeSpent(topic.id, problem.id, ms)} />
                                {state.timeSpentMs ? (
                                  <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', display: 'block' }}>
                                    {Math.floor(state.timeSpentMs / 60000)}m
                                  </span>
                                ) : null}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <CompanyTagInput tags={state.companyTags || []} onChange={(tags) => updateCompanyTags(topic.id, problem.id, tags)} />
                              </td>
                              <td style={{ minWidth: 200 }}>
                                <RichNotesInput initialNotes={state.notes || ''} onSave={(val) => updateNotes(topic.id, problem.id, val)} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                </motion.div>
              )}
              </AnimatePresence>
            </section>
          );
        })}

        <footer style={{ padding: '28px 32px 36px', marginTop: 16, borderTop: '1px solid var(--border-subtle)', textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          Zoho · Freshworks · Chargebee · Razorpay — {user ? `signed in as ${user.displayName}` : 'local mode'}
        </footer>
      </main>

      {/* ─── Reset Modal ─── */}
      {showResetConfirm && (
        <div className="no-print modal-backdrop" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowResetConfirm(false)}>
          <div className="modal-panel" style={{ borderRadius: 16, padding: '22px 24px', maxWidth: 380, width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 650, color: 'var(--text-primary)', marginBottom: 8 }}>Reset all progress?</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
              This will permanently delete all progress data{user ? ' from both local storage and cloud' : ''}. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowResetConfirm(false)} className="btn" style={{ flex: 1, height: 36 }}>Cancel</button>
              <button onClick={handleReset} className="btn" style={{ flex: 1, height: 36, background: 'var(--level-hard)', borderColor: 'transparent', color: '#fff', fontWeight: 600 }}>Reset everything</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Achievements Modal ─── */}
      {showAchievements && (
        <AchievementsPanel achievements={achievements} onClose={() => setShowAchievements(false)} />
      )}

      {/* ─── Weakness Detector Modal ─── */}
      {showWeakness && (
        <WeaknessPanel report={weaknessReport} onClose={() => setShowWeakness(false)} />
      )}

      {/* ─── Mock Interview Modal ─── */}
      {showMockInterview && (
        <MockInterviewModal onClose={() => setShowMockInterview(false)} generateProblems={generateMockInterview} />
      )}

      {/* ─── SRS Confidence Popup ─── */}
      {confidenceTarget && (
        <ConfidencePopup
          onSelect={(confidence) => {
            setSolveConfidence(confidenceTarget.topicId, confidenceTarget.problemId, confidence);
            setConfidenceTarget(null);
          }}
          onClose={() => setConfidenceTarget(null)}
        />
      )}

      {/* ─── Custom Problem Modal ─── */}
      {showCustomProblem && (
        <CustomProblemModal 
          topics={fullTopics} 
          onAdd={(p) => addCustomProblem(p)} 
          onClose={() => setShowCustomProblem(false)} 
        />
      )}

      {/* ─── Share Card Modal ─── */}
      {showShareCard && (
        <ShareCardModal 
          stats={globalStats} 
          xp={xpData} 
          streak={streakData} 
          onClose={() => setShowShareCard(false)} 
        />
      )}

      {/* ─── AI Hint Modal ─── */}
      {showHintFor && (
        <AIHintModal 
          problemName={showHintFor.problemName} 
          onClose={() => setShowHintFor(null)} 
        />
      )}
    </div>
  );
}
