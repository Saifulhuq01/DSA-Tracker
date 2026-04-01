'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { topics, ProblemStatus, STATUS_CYCLE } from '@/data/topics';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';

export interface ProblemState {
  status: ProblemStatus;
  dateSolved: string;
  notes: string;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastSolveDate: string;
  totalDaysActive: number;
  solveHistory: Record<string, number>; // date -> count
}

export type TrackerData = Record<string, ProblemState>;

const STORAGE_KEY = 'dsa-tracker-state';
const DATE_KEY = 'dsa-tracker-start-date';
const STREAK_KEY = 'dsa-tracker-streak';

function getKey(topicId: number, problemId: number): string {
  return `${topicId}-${problemId}`;
}

function loadLocal<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveLocal(key: string, data: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // storage full or blocked
  }
}

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function computeStreak(history: Record<string, number>): { currentStreak: number; longestStreak: number } {
  const dates = Object.keys(history).sort().reverse();
  if (dates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const today = getTodayStr();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let currentStreak = 0;
  let longestStreak = 0;
  let streak = 0;

  // Check current streak (must include today or yesterday)
  if (dates[0] === today || dates[0] === yesterday) {
    for (let i = 0; i < dates.length; i++) {
      const expected = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
      if (dates[0] === yesterday) {
        const exp = new Date(Date.now() - (i + 1) * 86400000).toISOString().split('T')[0];
        if (history[exp]) {
          currentStreak++;
        } else break;
      } else {
        if (history[expected]) {
          currentStreak++;
        } else break;
      }
    }
  }

  // Compute longest streak
  const allDates = Object.keys(history).sort();
  streak = 1;
  longestStreak = 1;
  for (let i = 1; i < allDates.length; i++) {
    const prev = new Date(allDates[i - 1]);
    const curr = new Date(allDates[i]);
    const diffDays = (curr.getTime() - prev.getTime()) / 86400000;
    if (diffDays === 1) {
      streak++;
      longestStreak = Math.max(longestStreak, streak);
    } else {
      streak = 1;
    }
  }

  return { currentStreak, longestStreak: Math.max(longestStreak, currentStreak) };
}

export function useTrackerState() {
  const { user, isConfigured } = useAuth();
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [data, setData] = useState<TrackerData>({});
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastSolveDate: '',
    totalDaysActive: 0,
    solveHistory: {},
  });
  const [startDate, setStartDate] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const loaded = loadLocal<TrackerData>(STORAGE_KEY, {});
    setData(loaded);

    const streakLoaded = loadLocal<StreakData>(STREAK_KEY, {
      currentStreak: 0,
      longestStreak: 0,
      lastSolveDate: '',
      totalDaysActive: 0,
      solveHistory: {},
    });
    setStreakData(streakLoaded);

    let sd = localStorage.getItem(DATE_KEY);
    if (!sd) {
      sd = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      localStorage.setItem(DATE_KEY, sd);
    }
    setStartDate(sd);
    setMounted(true);
  }, []);

  // Firestore real-time sync
  useEffect(() => {
    if (!user || !isConfigured || !mounted || !db) return;

    let unsub: (() => void) | undefined;

    const setupSync = async () => {
      const { doc, setDoc, getDoc, onSnapshot } = await import('firebase/firestore');
      const docRef = doc(db!, 'trackerData', user.uid);

      // On initial login, merge local data with cloud
      try {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const cloudData = snap.data() as { progress: TrackerData; streak: StreakData; startDate: string };
          const merged = { ...cloudData.progress, ...data };
          setData(merged);
          saveLocal(STORAGE_KEY, merged);
          if (cloudData.streak) {
            setStreakData(cloudData.streak);
            saveLocal(STREAK_KEY, cloudData.streak);
          }
          if (cloudData.startDate) {
            setStartDate(cloudData.startDate);
            localStorage.setItem(DATE_KEY, cloudData.startDate);
          }
        } else {
          await setDoc(docRef, { progress: data, streak: streakData, startDate });
        }
      } catch (e) {
        console.warn('Firestore merge failed:', e);
      }

      // Listen for real-time changes
      unsub = onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
          const cloudData = snap.data() as { progress: TrackerData; streak: StreakData };
          setData(cloudData.progress || {});
          saveLocal(STORAGE_KEY, cloudData.progress || {});
          if (cloudData.streak) {
            setStreakData(cloudData.streak);
            saveLocal(STREAK_KEY, cloudData.streak);
          }
        }
      });
    };

    setupSync();

    return () => { if (unsub) unsub(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isConfigured, mounted]);

  // Persist helper - saves to both local and cloud
  const persist = useCallback(
    async (newData: TrackerData, newStreak: StreakData) => {
      saveLocal(STORAGE_KEY, newData);
      saveLocal(STREAK_KEY, newStreak);

      if (user && isConfigured && db) {
        setSyncing(true);
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

        syncTimeoutRef.current = setTimeout(async () => {
          try {
            const { doc, setDoc } = await import('firebase/firestore');
            const docRef = doc(db!, 'trackerData', user.uid);
            await setDoc(docRef, { progress: newData, streak: newStreak, startDate }, { merge: true });
          } catch (err) {
            console.error('Cloud sync error:', err);
          } finally {
            setSyncing(false);
          }
        }, 2000); // 2 second debounce for quota protection
      }
    },
    [user, isConfigured, startDate]
  );

  const getProblemState = useCallback(
    (topicId: number, problemId: number): ProblemState => {
      const key = getKey(topicId, problemId);
      return data[key] || { status: 'not_started', dateSolved: '', notes: '' };
    },
    [data]
  );

  const cycleStatus = useCallback(
    (topicId: number, problemId: number) => {
      const key = getKey(topicId, problemId);
      const current = data[key] || { status: 'not_started' as ProblemStatus, dateSolved: '', notes: '' };
      const idx = STATUS_CYCLE.indexOf(current.status);
      const nextStatus = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
      const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const todayKey = getTodayStr();

      const updated: TrackerData = {
        ...data,
        [key]: {
          ...current,
          status: nextStatus,
          dateSolved: nextStatus === 'solved' ? today : nextStatus === 'not_started' ? '' : current.dateSolved,
        },
      };

      // Update streak data if solving
      let newStreak = { ...streakData };
      if (nextStatus === 'solved' && current.status !== 'solved') {
        const history = { ...newStreak.solveHistory };
        history[todayKey] = (history[todayKey] || 0) + 1;
        const computed = computeStreak(history);
        newStreak = {
          ...newStreak,
          solveHistory: history,
          lastSolveDate: todayKey,
          totalDaysActive: Object.keys(history).length,
          currentStreak: computed.currentStreak,
          longestStreak: computed.longestStreak,
        };
        setStreakData(newStreak);
      }

      setData(updated);
      persist(updated, newStreak);
    },
    [data, streakData, persist]
  );

  const updateNotes = useCallback(
    (topicId: number, problemId: number, notes: string) => {
      const key = getKey(topicId, problemId);
      const current = data[key] || { status: 'not_started' as ProblemStatus, dateSolved: '', notes: '' };
      const updated: TrackerData = {
        ...data,
        [key]: { ...current, notes },
      };
      setData(updated);
      persist(updated, streakData);
    },
    [data, streakData, persist]
  );

  const topicStats = useMemo(() => {
    return topics.map((topic) => {
      let solved = 0;
      let attempted = 0;
      let revise = 0;
      topic.problems.forEach((p) => {
        const state = data[getKey(topic.id, p.id)];
        if (state?.status === 'solved') solved++;
        else if (state?.status === 'attempted') attempted++;
        else if (state?.status === 'revise') revise++;
      });
      const pct = topic.total > 0 ? Math.round((solved / topic.total) * 100) : 0;
      let statusLabel = 'Not Started';
      if (solved === topic.total) statusLabel = 'Complete';
      else if (solved > 0 || attempted > 0 || revise > 0) statusLabel = 'In Progress';
      return { topicId: topic.id, solved, attempted, revise, pct, statusLabel };
    });
  }, [data]);

  const foundationComplete = useMemo(() => {
    let totalProblems = 0;
    let solvedProblems = 0;
    for (let i = 0; i < 7; i++) {
      const topic = topics[i];
      totalProblems += topic.total;
      topic.problems.forEach((p) => {
        const state = data[getKey(topic.id, p.id)];
        if (state?.status === 'solved') solvedProblems++;
      });
    }
    return totalProblems > 0 ? solvedProblems / totalProblems >= 0.8 : false;
  }, [data]);

  const globalStats = useMemo(() => {
    let totalSolved = 0;
    let totalAttempted = 0;
    let totalRevise = 0;
    const allTotal = 175;
    topics.forEach((topic) => {
      topic.problems.forEach((p) => {
        const state = data[getKey(topic.id, p.id)];
        if (state?.status === 'solved') totalSolved++;
        else if (state?.status === 'attempted') totalAttempted++;
        else if (state?.status === 'revise') totalRevise++;
      });
    });
    return { totalSolved, totalAttempted, totalRevise, allTotal, pct: Math.round((totalSolved / allTotal) * 100) };
  }, [data]);

  // Achievements system
  const achievements = useMemo(() => {
    const earned: { id: string; title: string; desc: string; icon: string; earned: boolean }[] = [
      {
        id: 'first_blood',
        title: 'First Blood',
        desc: 'Solve your first problem',
        icon: '🩸',
        earned: globalStats.totalSolved >= 1,
      },
      {
        id: 'ten_down',
        title: 'Double Digits',
        desc: 'Solve 10 problems',
        icon: '🔟',
        earned: globalStats.totalSolved >= 10,
      },
      {
        id: 'quarter',
        title: 'Quarter Century',
        desc: 'Solve 25 problems',
        icon: '🎯',
        earned: globalStats.totalSolved >= 25,
      },
      {
        id: 'half_century',
        title: 'Half Century',
        desc: 'Solve 50 problems',
        icon: '⚡',
        earned: globalStats.totalSolved >= 50,
      },
      {
        id: 'century',
        title: 'Century',
        desc: 'Solve 100 problems',
        icon: '💯',
        earned: globalStats.totalSolved >= 100,
      },
      {
        id: 'completionist',
        title: 'Completionist',
        desc: 'Solve all 175 problems',
        icon: '👑',
        earned: globalStats.totalSolved >= 175,
      },
      {
        id: 'topic_master',
        title: 'Topic Master',
        desc: 'Complete any topic 100%',
        icon: '🏆',
        earned: topicStats.some((s) => s.pct === 100),
      },
      {
        id: 'foundation',
        title: 'Strong Foundation',
        desc: 'Unlock DP topics (80% of 1-7)',
        icon: '🔓',
        earned: foundationComplete,
      },
      {
        id: 'streak_3',
        title: 'Consistent',
        desc: 'Maintain a 3-day streak',
        icon: '🔥',
        earned: streakData.longestStreak >= 3,
      },
      {
        id: 'streak_7',
        title: 'Weekly Warrior',
        desc: 'Maintain a 7-day streak',
        icon: '⚔️',
        earned: streakData.longestStreak >= 7,
      },
      {
        id: 'streak_30',
        title: 'Monthly Legend',
        desc: 'Maintain a 30-day streak',
        icon: '🌟',
        earned: streakData.longestStreak >= 30,
      },
      {
        id: 'hard_slayer',
        title: 'Hard Slayer',
        desc: 'Solve 10 Hard problems',
        icon: '💀',
        earned: (() => {
          let hardSolved = 0;
          topics.forEach((t) =>
            t.problems.forEach((p) => {
              if (p.level === 'Hard' && data[getKey(t.id, p.id)]?.status === 'solved') hardSolved++;
            })
          );
          return hardSolved >= 10;
        })(),
      },
    ];
    return earned;
  }, [globalStats, topicStats, foundationComplete, streakData, data]);

  const resetAll = useCallback(async () => {
    const empty: TrackerData = {};
    const emptyStreak: StreakData = {
      currentStreak: 0,
      longestStreak: 0,
      lastSolveDate: '',
      totalDaysActive: 0,
      solveHistory: {},
    };
    setData(empty);
    setStreakData(emptyStreak);
    await persist(empty, emptyStreak);
  }, [persist]);

  return {
    data,
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
  };
}
