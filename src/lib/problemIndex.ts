// Read-only lookup of every trackable problem (main topics + Zoho sets) by its
// tracker key `${topicId}-${problemId}`. Imports the data files; never edits them.
import type { Topic } from '@/data/topics';
import { ROUND2_PROBLEMS, ROUND3_APPS, ROUND4_QUESTIONS, ROUND5_QUESTIONS, type ZohoProblem } from '@/data/zohoData';
import { LOCAL_ROUND2_PROBLEMS, LOCAL_ROUND3_PROBLEMS } from '@/data/localZohoData';
import { ROADMAP_TOPICS } from '@/data/roadmap';
import { buildRoadmapIndex, type RoadmapIndex } from '@/lib/roadmapIndex';

export interface IndexedProblem {
  key: string;
  topicId: number;
  problemId: number;
  name: string;
  source: string; // topic name or Zoho set label
  isZoho: boolean;
}

/** Same topicIds the Zoho page already uses for these sets. */
export const ZOHO_SETS: { topicId: number; label: string; problems: ZohoProblem[] }[] = [
  { topicId: 202, label: 'Zoho R2', problems: ROUND2_PROBLEMS },
  { topicId: 206, label: 'Zoho Local R2', problems: LOCAL_ROUND2_PROBLEMS },
  { topicId: 203, label: 'Zoho R3', problems: ROUND3_APPS },
  { topicId: 207, label: 'Zoho Local R3', problems: LOCAL_ROUND3_PROBLEMS },
  { topicId: 204, label: 'Zoho R4', problems: ROUND4_QUESTIONS },
  { topicId: 205, label: 'Zoho R5', problems: ROUND5_QUESTIONS },
];

/** Roadmap ↔ tracker ↔ Zoho links for the current topics (incl. custom problems). */
export function getRoadmapIndex(fullTopics: Topic[]): RoadmapIndex {
  return buildRoadmapIndex(ROADMAP_TOPICS, fullTopics, ZOHO_SETS);
}

export function buildProblemIndex(fullTopics: Topic[], roadmapIndex: RoadmapIndex = getRoadmapIndex(fullTopics)): Map<string, IndexedProblem> {
  const index = new Map<string, IndexedProblem>();
  fullTopics.forEach((t) =>
    t.problems.forEach((p) => {
      const key = `${t.id}-${p.id}`;
      index.set(key, { key, topicId: t.id, problemId: p.id, name: p.name, source: t.name, isZoho: false });
    })
  );
  ZOHO_SETS.forEach((set) =>
    set.problems.forEach((p) => {
      const key = `${set.topicId}-${p.id}`;
      index.set(key, { key, topicId: set.topicId, problemId: p.id, name: p.name, source: set.label, isZoho: true });
    })
  );
  // Roadmap problems you didn't have before live under the synthetic topic 300
  roadmapIndex.byLc.forEach((e) => {
    if (!index.has(e.ref.key)) {
      index.set(e.ref.key, { key: e.ref.key, topicId: e.ref.topicId, problemId: e.ref.problemId, name: e.problem.title, source: e.ref.source, isZoho: false });
    }
  });
  return index;
}
