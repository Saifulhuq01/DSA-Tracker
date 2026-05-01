'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { topics, STATUS_LABELS, ProblemStatus } from '@/data/topics';
import { useTrackerState } from '@/hooks/useTrackerState';
import { useAuth } from '@/context/AuthContext';
import {
  XPLevelBadge, DailyQuestsPanel, WeaknessPanel, MockInterviewModal,
  ConfidencePopup, RevisionDueWidget, ProblemTimer, CompanyTagInput,
} from './components';

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
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
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
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={syncing ? '#f59e0b' : '#22c55e'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={syncing ? { animation: 'pulse 1s infinite' } : {}}>
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
    if (count === 1) return 'rgba(167,139,250,0.25)';
    if (count <= 3) return 'rgba(167,139,250,0.45)';
    if (count <= 5) return 'rgba(167,139,250,0.65)';
    return 'rgba(167,139,250,0.85)';
  };

  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {weekGroups.map((week, wi) => (
        <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {week.map((cell) => (
            <div
              key={cell.date}
              title={`${cell.date}: ${cell.count} solved`}
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: getColor(cell.count),
                transition: 'background 0.2s',
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
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
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
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>🏆 Achievements</h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{earned} / {achievements.length} unlocked</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
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
                border: `1px solid ${a.earned ? 'rgba(167,139,250,0.3)' : 'var(--border-subtle)'}`,
                background: a.earned ? 'rgba(167,139,250,0.06)' : 'var(--bg-input)',
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
  } = useTrackerState();

  const [expandedTopics, setExpandedTopics] = useState<Set<number>>(new Set([1]));
  const [activeTopic, setActiveTopic] = useState<number | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showWeakness, setShowWeakness] = useState(false);
  const [showMockInterview, setShowMockInterview] = useState(false);
  const [confidenceTarget, setConfidenceTarget] = useState<{ topicId: number; problemId: number } | null>(null);
  const topicRefs = useRef<Record<number, HTMLElement | null>>({});

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
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '3px solid var(--border-default)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Loading tracker...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>

      {/* ─── Sidebar Navigation ─── */}
      <aside
        className="no-print"
        style={{
          width: 280, minWidth: 280, background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-subtle)',
          position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
          display: 'flex', flexDirection: 'column', zIndex: 20,
        }}
      >
        {/* Logo + Auth */}
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 800, color: '#fff' }}>
                DS
              </div>
              <div>
                <h1 style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>DSA Tracker</h1>
                <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 500 }}>Zoho & Product Prep</p>
              </div>
            </div>
            {/* User avatar / sign in */}
            {user ? (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid var(--accent-primary)' }} />
                  ) : (
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#fff' }}>
                      {user.displayName?.[0] || 'U'}
                    </div>
                  )}
                  <CloudIcon syncing={syncing} />
                </button>
                {showUserMenu && (
                  <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 10, padding: 8, minWidth: 180, zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                    <div style={{ padding: '6px 10px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 4 }}>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{user.displayName}</p>
                      <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{user.email}</p>
                    </div>
                    <div style={{ padding: '4px 10px', fontSize: '0.68rem', color: 'var(--status-solved)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                      <CloudIcon syncing={false} /> Cloud sync active
                    </div>
                    <button
                      onClick={() => { signOut(); setShowUserMenu(false); }}
                      style={{ width: '100%', padding: '6px 10px', fontSize: '0.72rem', fontWeight: 600, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, color: 'var(--level-hard)', cursor: 'pointer', textAlign: 'left' }}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border-default)', background: 'rgba(255,255,255,0.03)', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.15s' }}
              >
                <GoogleIcon /> Sign in
              </button>
            )}
          </div>
        </div>

        {/* Date badge */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: 8, padding: '7px 12px', fontSize: '0.7rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
            📅 Started: {startDate}
          </div>
        </div>

        {/* Streak + Progress */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          {/* Streak row */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1, padding: '8px 10px', borderRadius: 8, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', textAlign: 'center' }}>
              <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--status-attempted)', fontFamily: 'var(--font-geist-mono)', lineHeight: 1 }}>
                {streakData.currentStreak}
              </p>
              <p style={{ fontSize: '0.58rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>🔥 STREAK</p>
            </div>
            <div style={{ flex: 1, padding: '8px 10px', borderRadius: 8, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)', textAlign: 'center' }}>
              <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-primary)', fontFamily: 'var(--font-geist-mono)', lineHeight: 1 }}>
                {streakData.longestStreak}
              </p>
              <p style={{ fontSize: '0.58rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>📈 BEST</p>
            </div>
            <div style={{ flex: 1, padding: '8px 10px', borderRadius: 8, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', textAlign: 'center' }}>
              <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--status-solved)', fontFamily: 'var(--font-geist-mono)', lineHeight: 1 }}>
                {streakData.totalDaysActive}
              </p>
              <p style={{ fontSize: '0.58rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>📆 DAYS</p>
            </div>
          </div>

          {/* Mini heatmap */}
          <div style={{ marginBottom: 10 }}>
            <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Activity (12 weeks)</p>
            <ContributionHeatmap solveHistory={streakData.solveHistory} />
          </div>

          {/* Overall progress */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Overall</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-primary)', fontFamily: 'var(--font-geist-mono)' }}>{globalStats.pct}%</span>
          </div>
          <div className="progress-bar-track" style={{ marginBottom: 6 }}>
            <div className={`progress-bar-fill${globalStats.pct === 100 ? ' complete' : ''}`} style={{ width: `${globalStats.pct}%` }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, fontSize: '0.65rem' }}>
            <span style={{ color: 'var(--status-solved)' }}>✓ {globalStats.totalSolved} Solved</span>
            <span style={{ color: 'var(--status-attempted)' }}>~ {globalStats.totalAttempted} Trying</span>
            <span style={{ color: 'var(--status-revise)' }}>R {globalStats.totalRevise} Revise</span>
            <span style={{ color: 'var(--text-muted)' }}>  {globalStats.allTotal} Total</span>
          </div>
        </div>

        {/* Foundation gate */}
        <div style={{ padding: '6px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ padding: '5px 10px', borderRadius: 6, fontSize: '0.66rem', fontWeight: 600, background: foundationComplete ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', color: foundationComplete ? 'var(--level-easy)' : 'var(--level-hard)', border: `1px solid ${foundationComplete ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`, display: 'flex', alignItems: 'center', gap: 6 }}>
            {foundationComplete ? <CheckCircle /> : <LockIcon />}
            {foundationComplete ? 'DP Topics Unlocked' : 'Topics 13+ locked (80% of 1–7)'}
          </div>
        </div>

        {/* XP Level Badge */}
        <XPLevelBadge xpData={xpData} />

        {/* Daily Quests */}
        <DailyQuestsPanel quests={dailyQuests} />

        {/* Revision Due */}
        <RevisionDueWidget items={revisionDueToday} />

        {/* Topic nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
          <div style={{ padding: '3px 8px', marginBottom: 3 }}>
            <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Topics ({topics.length})</span>
          </div>
          {topics.map((topic) => {
            const stats = topicStats.find((s) => s.topicId === topic.id);
            const locked = isTopicLocked(topic.id);
            return (
              <button key={topic.id} className={`nav-item${activeTopic === topic.id ? ' active' : ''}`} onClick={() => scrollToTopic(topic.id)} style={{ opacity: locked ? 0.4 : 1 }}>
                <span style={{ width: 20, height: 20, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, background: stats?.pct === 100 ? 'rgba(34,197,94,0.15)' : 'rgba(167,139,250,0.1)', color: stats?.pct === 100 ? 'var(--level-easy)' : 'var(--accent-primary)', flexShrink: 0 }}>
                  {locked ? <LockIcon /> : topic.id}
                </span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.71rem' }}>{topic.name}</span>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, fontFamily: 'var(--font-geist-mono)', color: stats?.pct === 100 ? 'var(--level-easy)' : stats && stats.pct > 0 ? 'var(--accent-primary)' : 'var(--text-muted)', flexShrink: 0 }}>
                  {stats?.solved}/{topic.total}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Achievements button */}
          <button
            onClick={() => setShowAchievements(true)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', borderRadius: 8, border: '1px solid rgba(167,139,250,0.25)', background: 'rgba(167,139,250,0.04)', color: 'var(--accent-primary)', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
          >
            <TrophyIcon /> Achievements ({earnedCount}/{achievements.length})
          </button>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setShowWeakness(true)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.04)', color: 'var(--level-hard)', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}>
              🎯 Weakness
            </button>
            <button onClick={() => setShowMockInterview(true)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px', borderRadius: 8, border: '1px solid rgba(34,197,94,0.2)', background: 'rgba(34,197,94,0.04)', color: 'var(--level-easy)', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}>
              ⚔️ Mock
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => window.print()} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}>
              <PrintIcon /> Print
            </button>
            <button onClick={() => setShowResetConfirm(true)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: 'var(--level-hard)', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}>
              <ResetIcon /> Reset
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        {/* Header bar */}
        <header style={{ position: 'sticky', top: 0, zIndex: 15, background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border-subtle)', padding: '12px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>DSA Progress Tracker</h2>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>15 Topics · 175 Problems · Easy / Medium / Hard</p>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {user && (
              <span style={{ fontSize: '0.65rem', padding: '3px 8px', borderRadius: 4, background: 'rgba(34,197,94,0.08)', color: 'var(--status-solved)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CloudIcon syncing={syncing} /> {syncing ? 'Syncing...' : 'Synced'}
              </span>
            )}
            {(['not_started', 'attempted', 'solved', 'revise'] as ProblemStatus[]).map((s) => (
              <span key={s} style={{ fontSize: '0.65rem', padding: '3px 8px', borderRadius: 4, fontFamily: 'var(--font-geist-mono)', fontWeight: 600 }} className={`status-${s}`}>
                {STATUS_LABELS[s]}
              </span>
            ))}
          </div>
        </header>

        {/* ─── Master Progress Summary ─── */}
        <section style={{ padding: '24px 32px' }}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>Master Progress Summary</h2>
            <hr className="topic-accent-rule" />
          </div>

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Total Problems', value: globalStats.allTotal, color: 'var(--text-primary)', icon: '📊' },
              { label: 'Solved', value: globalStats.totalSolved, color: 'var(--status-solved)', icon: '✅' },
              { label: 'Attempted', value: globalStats.totalAttempted, color: 'var(--status-attempted)', icon: '⏳' },
              { label: 'To Revise', value: globalStats.totalRevise, color: 'var(--status-revise)', icon: '🔄' },
              { label: 'Current Streak', value: streakData.currentStreak, color: 'var(--status-attempted)', icon: '🔥' },
            ].map((s) => (
              <div key={s.label} className="stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <p style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
                  <span style={{ fontSize: '1rem' }}>{s.icon}</span>
                </div>
                <p style={{ fontSize: '1.7rem', fontWeight: 800, color: s.color, fontFamily: 'var(--font-geist-mono)', lineHeight: 1 }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Summary table */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
            <table className="data-grid">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>Topic</th>
                  <th style={{ width: 60, textAlign: 'center' }}>Total</th>
                  <th style={{ width: 55, textAlign: 'center' }}>Easy</th>
                  <th style={{ width: 55, textAlign: 'center' }}>Med</th>
                  <th style={{ width: 55, textAlign: 'center' }}>Hard</th>
                  <th style={{ width: 80, textAlign: 'center' }}>Solved</th>
                  <th style={{ width: 120 }}>Progress</th>
                  <th style={{ width: 100 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {topics.map((topic) => {
                  const stats = topicStats.find((s) => s.topicId === topic.id);
                  const locked = isTopicLocked(topic.id);
                  return (
                    <tr key={topic.id} style={{ cursor: 'pointer', opacity: locked ? 0.4 : 1 }} onClick={() => scrollToTopic(topic.id)}>
                      <td style={{ fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'var(--font-geist-mono)' }}>{locked ? <LockIcon /> : topic.id}</td>
                      <td style={{ fontWeight: 600, fontSize: '0.8rem' }}>{topic.name}</td>
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-geist-mono)', fontWeight: 600 }}>{topic.total}</td>
                      <td style={{ textAlign: 'center' }}><span className="level-badge level-Easy">{topic.easy}</span></td>
                      <td style={{ textAlign: 'center' }}><span className="level-badge level-Medium">{topic.medium}</span></td>
                      <td style={{ textAlign: 'center' }}><span className="level-badge level-Hard">{topic.hard}</span></td>
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-geist-mono)', fontWeight: 700, color: stats?.solved === topic.total ? 'var(--level-easy)' : 'var(--text-primary)' }}>
                        {stats?.solved} / {topic.total}
                      </td>
                      <td>
                        <div className="progress-bar-track"><div className={`progress-bar-fill${stats?.pct === 100 ? ' complete' : ''}`} style={{ width: `${stats?.pct || 0}%` }} /></div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: stats?.statusLabel === 'Complete' ? 'var(--level-easy)' : stats?.statusLabel === 'In Progress' ? 'var(--status-attempted)' : 'var(--text-muted)' }}>
                          {stats?.statusLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                <tr style={{ background: 'rgba(167,139,250,0.04)' }}>
                  <td></td>
                  <td style={{ fontWeight: 800, color: 'var(--accent-primary)' }}>TOTAL</td>
                  <td style={{ textAlign: 'center', fontFamily: 'var(--font-geist-mono)', fontWeight: 800, color: 'var(--accent-primary)' }}>175</td>
                  <td style={{ textAlign: 'center' }}><span className="level-badge level-Easy" style={{ fontWeight: 800 }}>43</span></td>
                  <td style={{ textAlign: 'center' }}><span className="level-badge level-Medium" style={{ fontWeight: 800 }}>95</span></td>
                  <td style={{ textAlign: 'center' }}><span className="level-badge level-Hard" style={{ fontWeight: 800 }}>37</span></td>
                  <td style={{ textAlign: 'center', fontFamily: 'var(--font-geist-mono)', fontWeight: 800, color: 'var(--accent-primary)' }}>{globalStats.totalSolved} / 175</td>
                  <td><div className="progress-bar-track"><div className={`progress-bar-fill${globalStats.pct === 100 ? ' complete' : ''}`} style={{ width: `${globalStats.pct}%` }} /></div></td>
                  <td style={{ fontWeight: 800, color: 'var(--accent-primary)', fontFamily: 'var(--font-geist-mono)' }}>{globalStats.pct}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ─── Topic Sections ─── */}
        {topics.map((topic) => {
          const stats = topicStats.find((s) => s.topicId === topic.id);
          const locked = isTopicLocked(topic.id);
          const expanded = expandedTopics.has(topic.id);

          return (
            <section
              key={topic.id}
              ref={(el) => { topicRefs.current[topic.id] = el; }}
              className="topic-section"
              style={{ padding: '0 32px 24px', opacity: locked ? 0.35 : 1, pointerEvents: locked ? 'none' : 'auto', transition: 'opacity 0.3s' }}
            >
              <div style={{ marginBottom: 16 }}>
                <hr className="topic-accent-rule" style={{ marginBottom: 16 }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => toggleTopic(topic.id)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: stats?.pct === 100 ? 'rgba(34,197,94,0.12)' : 'rgba(167,139,250,0.08)', border: `1px solid ${stats?.pct === 100 ? 'rgba(34,197,94,0.2)' : 'rgba(167,139,250,0.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800, fontFamily: 'var(--font-geist-mono)', color: stats?.pct === 100 ? 'var(--level-easy)' : 'var(--accent-primary)' }}>
                      {locked ? <LockIcon /> : topic.id}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{topic.name}</h3>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{topic.total} problems · {stats?.solved} solved · {stats?.pct}%</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 80 }}><div className="progress-bar-track"><div className={`progress-bar-fill${stats?.pct === 100 ? ' complete' : ''}`} style={{ width: `${stats?.pct || 0}%` }} /></div></div>
                    <span style={{ color: 'var(--text-muted)', transition: 'transform 0.2s', transform: expanded ? 'rotate(0)' : 'rotate(-90deg)' }}><ChevronDown /></span>
                  </div>
                </div>
              </div>

              {expanded && (
                <div className="animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
                  {/* Key Concepts */}
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '14px 18px', marginBottom: 14 }}>
                    <h4 style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Key Concepts to Master</h4>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {topic.concepts.map((c, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          <span style={{ color: 'var(--accent-primary)', fontSize: '0.5rem', marginTop: 5, flexShrink: 0 }}>●</span>
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Mini progress table */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1, background: 'var(--border-subtle)', borderRadius: 8, overflow: 'hidden', marginBottom: 14 }}>
                    {['Total', 'Easy', 'Medium', 'Hard', 'Solved', '%'].map((label) => (
                      <div key={label} style={{ background: 'var(--bg-secondary)', padding: '6px 12px', textAlign: 'center', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                    ))}
                    {([
                      { v: topic.total, c: 'var(--text-primary)' },
                      { v: topic.easy, c: 'var(--level-easy)' },
                      { v: topic.medium, c: 'var(--level-medium)' },
                      { v: topic.hard, c: 'var(--level-hard)' },
                      { v: stats?.solved || 0, c: stats?.solved === topic.total ? 'var(--level-easy)' : 'var(--accent-primary)' },
                      { v: `${stats?.pct || 0}%`, c: stats?.pct === 100 ? 'var(--level-easy)' : 'var(--accent-primary)' },
                    ] as { v: number | string; c: string }[]).map((cell, idx) => (
                      <div key={idx} style={{ background: 'var(--bg-card)', padding: '8px 12px', textAlign: 'center', fontSize: '1rem', fontWeight: 800, fontFamily: 'var(--font-geist-mono)', color: cell.c }}>{cell.v}</div>
                    ))}
                  </div>

                  {/* Problem grid */}
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
                    <table className="data-grid problem-grid">
                      <thead>
                        <tr>
                          <th style={{ width: 36, textAlign: 'center' }}>#</th>
                          <th>Problem</th>
                          <th style={{ width: 70, textAlign: 'center' }}>Level</th>
                          <th style={{ width: 80 }}>Platform</th>
                          <th style={{ width: 95 }}>Link / ID</th>
                          <th style={{ width: 115, textAlign: 'center' }}>Status</th>
                          <th style={{ width: 100 }}>Date Solved</th>
                          <th style={{ width: 70, textAlign: 'center' }}>Timer</th>
                          <th style={{ width: 50, textAlign: 'center' }}>Tags</th>
                          <th style={{ minWidth: 120 }}>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topic.problems.map((problem) => {
                          const state = getProblemState(topic.id, problem.id);
                          const isSolved = state.status === 'solved';
                          return (
                            <tr key={problem.id}>
                              <td style={{ textAlign: 'center', fontFamily: 'var(--font-geist-mono)', fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{problem.id}</td>
                              <td>
                                <a
                                  href={problem.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    color: isSolved ? 'var(--level-easy)' : 'var(--text-primary)',
                                    textDecorationLine: isSolved ? 'line-through' : 'none',
                                    textDecorationColor: 'rgba(34,197,94,0.3)',
                                    textDecorationStyle: 'solid' as const,
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    transition: 'color 0.15s',
                                  }}
                                >
                                  {problem.name}
                                  <span style={{ opacity: 0.3, flexShrink: 0 }}><ExternalLink /></span>
                                </a>
                                {state.nextReviseDate && state.status === 'solved' && (
                                  <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', display: 'block', marginTop: 1 }}>
                                    📅 Revise: {state.nextReviseDate}
                                  </span>
                                )}
                              </td>
                              <td style={{ textAlign: 'center' }}><span className={`level-badge level-${problem.level}`}>{problem.level}</span></td>
                              <td><span className="platform-badge">{problem.platform}</span></td>
                              <td style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{problem.linkId}</td>
                              <td style={{ textAlign: 'center' }}>
                                <button className={`status-btn status-${state.status}`} onClick={() => {
                                  const next = cycleStatus(topic.id, problem.id);
                                  if (next === 'solved') {
                                    setConfidenceTarget({ topicId: topic.id, problemId: problem.id });
                                  }
                                }} title="Click to cycle status">
                                  {STATUS_LABELS[state.status]}
                                </button>
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
                              <td>
                                <input className="notes-input" type="text" placeholder="Add notes..." value={state.notes} onChange={(e) => updateNotes(topic.id, problem.id, e.target.value)} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          );
        })}

        <footer style={{ padding: '24px 32px', borderTop: '1px solid var(--border-subtle)', textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          Target: Zoho | Freshworks | Chargebee | Razorpay · Built for daily momentum · {user ? `Signed in as ${user.displayName}` : 'Local mode'}
        </footer>
      </main>

      {/* ─── Reset Modal ─── */}
      {showResetConfirm && (
        <div className="no-print" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowResetConfirm(false)}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 16, padding: '24px 28px', maxWidth: 380, width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Reset All Progress?</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
              This will permanently delete all progress data{user ? ' from both local storage and cloud' : ''}. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowResetConfirm(false)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleReset} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: 'var(--level-hard)', color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>Reset Everything</button>
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
    </div>
  );
}
