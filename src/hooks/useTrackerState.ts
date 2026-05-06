'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { topics, ProblemStatus, STATUS_CYCLE } from '@/data/topics';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';

export interface ProblemState {
  status: ProblemStatus;
  dateSolved: string;
  notes: string;
  // SRS fields
  solveConfidence?: 'easy' | 'medium' | 'hard';
  nextReviseDate?: string;
  srsInterval?: number; // days
  srsStage?: number; // 0=first, 1=second, etc.
  // Company tags
  companyTags?: string[];
  // Timer
  timeSpentMs?: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastSolveDate: string;
  totalDaysActive: number;
  solveHistory: Record<string, number>; // date -> count
}

export interface XPData {
  totalXP: number;
  level: number;
  xpToNext: number;
  xpHistory: Record<string, number>; // date -> xp gained
}

export interface DailyQuest {
  id: string;
  description: string;
  target: number;
  current: number;
  type: 'solve' | 'revise' | 'topic' | 'hard';
  xpReward: number;
  completed: boolean;
}

export interface DailyQuestData {
  date: string;
  quests: DailyQuest[];
  allCompleted: boolean;
  bonusXPClaimed: boolean;
}

export interface WeaknessReport {
  topicId: number;
  topicName: string;
  completionPct: number;
  solvedCount: number;
  totalCount: number;
}

export interface CustomProblem {
  id: number;
  topicId: number;
  name: string;
  level: 'Easy' | 'Medium' | 'Hard';
  url: string;
  platform: string;
}

export interface PomodoroData {
  sessionsCompleted: number;
  totalFocusMinutes: number;
  lastSessionDate: string;
}

export type TrackerData = Record<string, ProblemState>;

const STORAGE_KEY = 'dsa-tracker-state';
const DATE_KEY = 'dsa-tracker-start-date';
const STREAK_KEY = 'dsa-tracker-streak';
const XP_KEY = 'dsa-tracker-xp';
const QUEST_KEY = 'dsa-tracker-quests';
const CUSTOM_PROBLEMS_KEY = 'dsa-tracker-custom';
const POMODORO_KEY = 'dsa-tracker-pomodoro';

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
  const [xpData, setXPData] = useState<XPData>({ totalXP: 0, level: 1, xpToNext: 100, xpHistory: {} });
  const [dailyQuests, setDailyQuests] = useState<DailyQuestData>({ date: '', quests: [], allCompleted: false, bonusXPClaimed: false });
  const [customProblems, setCustomProblems] = useState<CustomProblem[]>([]);
  const [pomodoro, setPomodoro] = useState<PomodoroData>({ sessionsCompleted: 0, totalFocusMinutes: 0, lastSessionDate: '' });
  const autoReviseRanRef = useRef(false);

  // Combine static topics with custom problems
  const fullTopics = useMemo(() => {
    return topics.map(t => {
      const customs = customProblems.filter(cp => cp.topicId === t.id);
      if (customs.length === 0) return t;
      return {
        ...t,
        total: t.total + customs.length,
        problems: [...t.problems, ...customs.map(c => ({
          id: c.id,
          name: c.name,
          level: c.level,
          platform: c.platform,
          linkId: 'Custom',
          url: c.url
        }))]
      };
    });
  }, [customProblems]);

  // XP helper
  function computeLevel(totalXP: number): { level: number; xpToNext: number } {
    const level = Math.floor(totalXP / 100) + 1;
    const xpToNext = 100 - (totalXP % 100);
    return { level, xpToNext };
  }

  function getXPForDifficulty(level: 'Easy' | 'Medium' | 'Hard'): number {
    return level === 'Easy' ? 10 : level === 'Medium' ? 20 : 30;
  }

  // Generate daily quests based on current data
  function generateDailyQuests(currentData: TrackerData): DailyQuest[] {
    const today = getTodayStr();
    let reviseCount = 0;
    let unsolvedCount = 0;
    let hardUnsolved = 0;
    fullTopics.forEach((t) => t.problems.forEach((p) => {
      const s = currentData[getKey(t.id, p.id)];
      if (s?.status === 'revise') reviseCount++;
      if (!s || s.status === 'not_started' || s.status === 'attempted') unsolvedCount++;
      if (p.level === 'Hard' && (!s || s.status !== 'solved')) hardUnsolved++;
    }));
    const quests: DailyQuest[] = [
      { id: `solve-${today}`, description: 'Solve 3 problems today', target: 3, current: 0, type: 'solve', xpReward: 30, completed: false },
      { id: `revise-${today}`, description: `Revise ${Math.min(2, reviseCount)} problems`, target: Math.min(2, Math.max(1, reviseCount)), current: 0, type: 'revise', xpReward: 20, completed: false },
      { id: `hard-${today}`, description: 'Solve 1 Hard problem', target: 1, current: 0, type: 'hard', xpReward: 40, completed: false },
    ];
    return quests;
  }

  // SRS-aware auto-revise helper
  const applyAutoRevise = useCallback((inputData: TrackerData) => {
    let hasChanges = false;
    const now = Date.now();
    const todayDateString = new Date().toDateString();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const result = { ...inputData };

    Object.keys(result).forEach((key) => {
      const state = result[key];
      if (state.status === 'solved' && state.dateSolved) {
        const isSolvedToday = new Date(state.dateSolved).toDateString() === todayDateString;

        // Do not flip to revise if they literally just solved it today
        if (!isSolvedToday) {
          if (state.nextReviseDate) {
            const reviseTime = new Date(state.nextReviseDate).getTime();
            if (!isNaN(reviseTime) && now >= reviseTime) {
              result[key] = { ...state, status: 'revise' };
              hasChanges = true;
            }
          } else {
            const solvedTime = new Date(state.dateSolved).getTime();
            if (!isNaN(solvedTime) && now - solvedTime >= SEVEN_DAYS_MS) {
              result[key] = { ...state, status: 'revise' };
              hasChanges = true;
            }
          }
        }
      }
    });
    return { updated: result, hasChanges };
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    let loaded = loadLocal<TrackerData>(STORAGE_KEY, {});

    const { updated, hasChanges } = applyAutoRevise(loaded);
    if (hasChanges) {
      saveLocal(STORAGE_KEY, updated);
    }
    setData(updated);

    const streakLoaded = loadLocal<StreakData>(STREAK_KEY, {
      currentStreak: 0,
      longestStreak: 0,
      lastSolveDate: '',
      totalDaysActive: 0,
      solveHistory: {},
    });
    setStreakData(streakLoaded);

    const xpLoaded = loadLocal<XPData>(XP_KEY, { totalXP: 0, level: 1, xpToNext: 100, xpHistory: {} });
    setXPData(xpLoaded);

    const customLoaded = loadLocal<CustomProblem[]>(CUSTOM_PROBLEMS_KEY, []);
    setCustomProblems(customLoaded);

    const pomodoroLoaded = loadLocal<PomodoroData>(POMODORO_KEY, { sessionsCompleted: 0, totalFocusMinutes: 0, lastSessionDate: '' });
    setPomodoro(pomodoroLoaded);

    const questLoaded = loadLocal<DailyQuestData>(QUEST_KEY, { date: '', quests: [], allCompleted: false, bonusXPClaimed: false });
    const today = getTodayStr();
    if (questLoaded.date !== today) {
      const newQuests: DailyQuestData = { date: today, quests: generateDailyQuests(loaded), allCompleted: false, bonusXPClaimed: false };
      setDailyQuests(newQuests);
      saveLocal(QUEST_KEY, newQuests);
    } else {
      setDailyQuests(questLoaded);
    }

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
          const cloudData = snap.data() as { progress: TrackerData; streak: StreakData; startDate: string; customProblems?: CustomProblem[]; pomodoro?: PomodoroData };
          const { updated: revisedCloudData } = applyAutoRevise(cloudData.progress || {});
          const merged = { ...revisedCloudData, ...data };
          setData(merged);
          saveLocal(STORAGE_KEY, merged);
          if (cloudData.streak) {
            setStreakData(cloudData.streak);
            saveLocal(STREAK_KEY, cloudData.streak);
          }
          if (cloudData.customProblems) {
            setCustomProblems(cloudData.customProblems);
            saveLocal(CUSTOM_PROBLEMS_KEY, cloudData.customProblems);
          }
          if (cloudData.pomodoro) {
            setPomodoro(cloudData.pomodoro);
            saveLocal(POMODORO_KEY, cloudData.pomodoro);
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
          const { updated } = applyAutoRevise(cloudData.progress || {});
          setData(updated);
          saveLocal(STORAGE_KEY, updated);
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
    async (newData: TrackerData, newStreak: StreakData, newCustom?: CustomProblem[], newPomodoro?: PomodoroData) => {
      saveLocal(STORAGE_KEY, newData);
      saveLocal(STREAK_KEY, newStreak);
      if (newCustom) saveLocal(CUSTOM_PROBLEMS_KEY, newCustom);
      if (newPomodoro) saveLocal(POMODORO_KEY, newPomodoro);

      if (user && isConfigured && db) {
        setSyncing(true);
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

        syncTimeoutRef.current = setTimeout(async () => {
          try {
            const { doc, setDoc } = await import('firebase/firestore');
            const docRef = doc(db!, 'trackerData', user.uid);
            await setDoc(docRef, {
              progress: newData,
              streak: newStreak,
              startDate,
              ...(newCustom && { customProblems: newCustom }),
              ...(newPomodoro && { pomodoro: newPomodoro })
            }, { merge: true });
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

  // Award XP helper
  const awardXP = useCallback((amount: number) => {
    setXPData((prev) => {
      const todayKey = getTodayStr();
      const newTotal = prev.totalXP + amount;
      const { level, xpToNext } = computeLevel(newTotal);
      const newXP: XPData = {
        totalXP: newTotal,
        level,
        xpToNext,
        xpHistory: { ...prev.xpHistory, [todayKey]: (prev.xpHistory[todayKey] || 0) + amount },
      };
      saveLocal(XP_KEY, newXP);
      return newXP;
    });
  }, []);

  // Update quest progress helper
  const updateQuestProgress = useCallback((type: 'solve' | 'revise' | 'hard') => {
    setDailyQuests((prev) => {
      const updatedQuests = prev.quests.map((q) => {
        if (q.type === type && !q.completed) {
          const newCurrent = q.current + 1;
          const completed = newCurrent >= q.target;
          if (completed) awardXP(q.xpReward);
          return { ...q, current: newCurrent, completed };
        }
        return q;
      });
      const allDone = updatedQuests.every((q) => q.completed);
      let bonusClaimed = prev.bonusXPClaimed;
      if (allDone && !bonusClaimed) {
        awardXP(50); // bonus for completing all quests
        bonusClaimed = true;
      }
      const newQuestData: DailyQuestData = { ...prev, quests: updatedQuests, allCompleted: allDone, bonusXPClaimed: bonusClaimed };
      saveLocal(QUEST_KEY, newQuestData);
      return newQuestData;
    });
  }, [awardXP]);

  // Solve with confidence (SRS) — called after cycleStatus sets to 'solved'
  const setSolveConfidence = useCallback(
    (topicId: number, problemId: number, confidence: 'easy' | 'medium' | 'hard') => {
      const key = getKey(topicId, problemId);
      const current = data[key];
      if (!current) return;

      const interval = confidence === 'easy' ? 14 : confidence === 'medium' ? 7 : 3;
      const nextStage = confidence === 'hard' ? 0 : (current.srsStage || 0) + 1;
      const nextDate = new Date(Date.now() + interval * 86400000).toISOString().split('T')[0];

      const updated: TrackerData = {
        ...data,
        [key]: { ...current, solveConfidence: confidence, srsInterval: interval, srsStage: nextStage, nextReviseDate: nextDate },
      };
      setData(updated);
      persist(updated, streakData);
    },
    [data, streakData, persist]
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

        // Award XP based on problem difficulty
        const problem = fullTopics.find((t) => t.id === topicId)?.problems.find((p) => p.id === problemId);
        if (problem) {
          awardXP(getXPForDifficulty(problem.level));
        }

        // Update quest progress
        updateQuestProgress('solve');
        if (problem?.level === 'Hard') updateQuestProgress('hard');
      }

      // If re-solving from revise status, count as revise quest
      if (nextStatus === 'solved' && current.status === 'revise') {
        updateQuestProgress('revise');
      }

      setData(updated);
      persist(updated, newStreak);

      // Return nextStatus so UI can show confidence popup
      return nextStatus;
    },
    [data, streakData, persist, awardXP, updateQuestProgress]
  );

  // Company tags
  const updateCompanyTags = useCallback(
    (topicId: number, problemId: number, tags: string[]) => {
      const key = getKey(topicId, problemId);
      const current = data[key] || { status: 'not_started' as ProblemStatus, dateSolved: '', notes: '' };
      const updated: TrackerData = { ...data, [key]: { ...current, companyTags: tags } };
      setData(updated);
      persist(updated, streakData);
    },
    [data, streakData, persist]
  );

  // Timer tracking
  const updateTimeSpent = useCallback(
    (topicId: number, problemId: number, ms: number) => {
      const key = getKey(topicId, problemId);
      const current = data[key] || { status: 'not_started' as ProblemStatus, dateSolved: '', notes: '' };
      const updated: TrackerData = { ...data, [key]: { ...current, timeSpentMs: (current.timeSpentMs || 0) + ms } };
      setData(updated);
      persist(updated, streakData);
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
    return fullTopics.map((topic) => {
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
      const topic = fullTopics[i];
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
    let allTotal = 0;
    fullTopics.forEach((topic) => {
      allTotal += topic.total;
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
          fullTopics.forEach((t) =>
            t.problems.forEach((p) => {
              if (p.level === 'Hard' && data[getKey(t.id, p.id)]?.status === 'solved') hardSolved++;
            })
          );
          return hardSolved >= 10;
        })(),
      },
      { id: 'level_5', title: 'Leveling Up', desc: 'Reach Level 5', icon: '🎮', earned: xpData.level >= 5 },
      { id: 'level_10', title: 'XP Master', desc: 'Reach Level 10', icon: '💎', earned: xpData.level >= 10 },
      { id: 'quest_master', title: 'Quest Master', desc: 'Complete all daily quests', icon: '📜', earned: dailyQuests.allCompleted },
    ];
    return earned;
  }, [globalStats, topicStats, foundationComplete, streakData, data, xpData, dailyQuests]);

  const weaknessReport = useMemo((): WeaknessReport[] => {
    return fullTopics.map((topic) => {
      const stats = topicStats.find((s) => s.topicId === topic.id);
      return { topicId: topic.id, topicName: topic.name, completionPct: stats?.pct || 0, solvedCount: stats?.solved || 0, totalCount: topic.total };
    }).sort((a, b) => a.completionPct - b.completionPct);
  }, [topicStats]);

  const generateMockInterview = useCallback((count: number = 3) => {
    const pool: { topicId: number; topicName: string; problemId: number; problemName: string; level: string; url: string }[] = [];
    fullTopics.forEach((t) => t.problems.forEach((p) => {
      const state = data[getKey(t.id, p.id)];
      if (!state || state.status !== 'solved') {
        pool.push({ topicId: t.id, topicName: t.name, problemId: p.id, problemName: p.name, level: p.level, url: p.url });
      }
    }));
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, count);
  }, [data]);

  const revisionDueToday = useMemo(() => {
    const now = Date.now();
    const due: { topicId: number; problemId: number; problemName: string; daysOverdue: number }[] = [];
    fullTopics.forEach((t) => t.problems.forEach((p) => {
      const state = data[getKey(t.id, p.id)];
      if (state?.status === 'revise') {
        const overdue = state.nextReviseDate ? Math.max(0, Math.floor((now - new Date(state.nextReviseDate).getTime()) / 86400000)) : 0;
        due.push({ topicId: t.id, problemId: p.id, problemName: p.name, daysOverdue: overdue });
      }
    }));
    return due;
  }, [data]);

  const resetAll = useCallback(async () => {
    const empty: TrackerData = {};
    const emptyStreak: StreakData = { currentStreak: 0, longestStreak: 0, lastSolveDate: '', totalDaysActive: 0, solveHistory: {} };
    const emptyXP: XPData = { totalXP: 0, level: 1, xpToNext: 100, xpHistory: {} };
    setData(empty);
    setStreakData(emptyStreak);
    setXPData(emptyXP);
    saveLocal(XP_KEY, emptyXP);
    saveLocal(QUEST_KEY, { date: '', quests: [], allCompleted: false, bonusXPClaimed: false });
    await persist(empty, emptyStreak);
  }, [persist]);

  const addCustomProblem = useCallback((problem: Omit<CustomProblem, 'id'>) => {
    setCustomProblems(prev => {
      // Check if URL already exists in static topics or custom problems
      const isStaticDuplicate = topics.some(t => t.problems.some(p => p.url === problem.url));
      const isCustomDuplicate = prev.some(p => p.url === problem.url);

      if (isStaticDuplicate || isCustomDuplicate) {
        alert('This problem already exists in the tracker!');
        return prev;
      }

      const newProblem = { ...problem, id: Date.now() };
      const updated = [...prev, newProblem];
      persist(data, streakData, updated, pomodoro);
      return updated;
    });
  }, [data, streakData, pomodoro, persist]);

  const deleteCustomProblem = useCallback((idToRemove: number) => {
    setCustomProblems(prev => {
      const updated = prev.filter(p => p.id !== idToRemove);
      persist(data, streakData, updated, pomodoro);
      return updated;
    });
  }, [data, streakData, pomodoro, persist]);

  const addPomodoroSession = useCallback((minutes: number) => {
    setPomodoro(prev => {
      const updated = {
        sessionsCompleted: prev.sessionsCompleted + 1,
        totalFocusMinutes: prev.totalFocusMinutes + minutes,
        lastSessionDate: getTodayStr()
      };
      persist(data, streakData, customProblems, updated);
      awardXP(20); // Bonus XP for Pomodoro
      return updated;
    });
  }, [data, streakData, customProblems, persist, awardXP]);

  const exportData = useCallback(() => {
    const exportObj = {
      progress: data,
      streak: streakData,
      startDate,
      xpData,
      customProblems,
      pomodoro
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `dsa_tracker_backup_${getTodayStr()}.json`;
    a.click();
  }, [data, streakData, startDate, xpData, customProblems, pomodoro]);

  const importData = useCallback((jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.progress) setData(parsed.progress);
      if (parsed.streak) setStreakData(parsed.streak);
      if (parsed.startDate) setStartDate(parsed.startDate);
      if (parsed.xpData) setXPData(parsed.xpData);
      if (parsed.customProblems) setCustomProblems(parsed.customProblems);
      if (parsed.pomodoro) setPomodoro(parsed.pomodoro);
      persist(parsed.progress || data, parsed.streak || streakData, parsed.customProblems || customProblems, parsed.pomodoro || pomodoro);
      return true;
    } catch (e) {
      console.error("Failed to import data", e);
      return false;
    }
  }, [data, streakData, customProblems, pomodoro, persist]);

  return {
    data, mounted, syncing, startDate, streakData, achievements, fullTopics,
    getProblemState, cycleStatus, updateNotes, topicStats, foundationComplete, globalStats, resetAll,
    xpData, dailyQuests, weaknessReport, revisionDueToday, pomodoro,
    setSolveConfidence, updateCompanyTags, updateTimeSpent, generateMockInterview, awardXP,
    addCustomProblem, deleteCustomProblem, addPomodoroSession, exportData, importData
  };
}
