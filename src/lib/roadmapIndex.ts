// Links roadmap problems (by LeetCode number) to where their progress lives.
//
// Pure function with type-only imports, so it can run in Node (scripts/check-roadmap.ts)
// as well as in the app. It never modifies the data it is given.
//
// Rules (approved plan):
// - LC already in topics.ts (or a custom problem with the same LeetCode URL) → reuse that
//   problem's progress key. If the LC appears more than once, the first copy is used and
//   the others are listed in `alsoIn` (they keep their own progress).
// - LC not in the tracker → new progress key `300-<LC>`.
// - Zoho questions that link to the same LeetCode problem are listed in `zoho` as tags;
//   their progress stays separate.

import type { Topic } from '@/data/topics';
import type { ZohoProblem } from '@/data/zohoData';
import type { RoadmapTopic, RoadmapProblem } from '@/data/roadmap';

/** Synthetic tracker topic id for roadmap problems you didn't have before. problemId = LC number. */
export const ROADMAP_ONLY_TOPIC_ID = 300;

export interface TrackerRef {
  key: string; // progress key `${topicId}-${problemId}`
  topicId: number;
  problemId: number;
  name: string;
  source: string; // tracker topic name or Zoho set label
}

export interface RoadmapEntry {
  problem: RoadmapProblem;
  topic: RoadmapTopic;
  ref: TrackerRef; // where this problem's progress is stored
  merged: boolean; // true = reuses an existing tracker problem's progress
  alsoIn: TrackerRef[]; // other tracker copies with the same LC (separate progress)
  zoho: TrackerRef[]; // Zoho questions linking to this LC (separate progress)
}

export interface RoadmapIndex {
  byLc: Map<number, RoadmapEntry>;
  /** Tracker problems that aren't in the roadmap (incl. custom ones) — shown so nothing is hidden. */
  trackerOnly: TrackerRef[];
}

export interface ZohoSetInput {
  topicId: number;
  label: string;
  problems: ZohoProblem[];
}

/** `https://leetcode.com/problems/two-sum/description/` → `two-sum` */
export function leetcodeSlug(url: string | undefined): string | null {
  const m = url?.match(/leetcode\.com\/problems\/([a-z0-9-]+)/i);
  return m ? m[1].toLowerCase() : null;
}

/** `'LC #217'` → 217 */
export function lcNumberFromLinkId(linkId: string): number | null {
  const m = linkId.match(/^LC\s*#(\d+)$/);
  return m ? Number(m[1]) : null;
}

const ref = (topicId: number, problemId: number, name: string, source: string): TrackerRef => ({
  key: `${topicId}-${problemId}`, topicId, problemId, name, source,
});

export function buildRoadmapIndex(
  roadmap: RoadmapTopic[],
  trackerTopics: Topic[],
  zohoSets: ZohoSetInput[],
): RoadmapIndex {
  const roadmapLcs = new Set<number>();
  const roadmapBySlug = new Map<string, number>();
  roadmap.forEach((t) => t.problems.forEach((p) => {
    roadmapLcs.add(p.lc);
    const slug = leetcodeSlug(p.url);
    if (slug) roadmapBySlug.set(slug, p.lc);
  }));

  // LC number → tracker copies, in topic order
  const trackerByLc = new Map<number, TrackerRef[]>();
  const trackerOnly: TrackerRef[] = [];
  trackerTopics.forEach((t) => t.problems.forEach((p) => {
    const r = ref(t.id, p.id, p.name, t.name);
    // Static problems carry "LC #n"; custom problems only have a URL
    const lc = lcNumberFromLinkId(p.linkId) ?? roadmapBySlug.get(leetcodeSlug(p.url) ?? '') ?? null;
    if (lc !== null && roadmapLcs.has(lc)) {
      if (!trackerByLc.has(lc)) trackerByLc.set(lc, []);
      trackerByLc.get(lc)!.push(r);
    } else {
      trackerOnly.push(r);
    }
  }));

  // LC number → Zoho questions linking to it
  const zohoByLc = new Map<number, TrackerRef[]>();
  zohoSets.forEach((set) => set.problems.forEach((p) => {
    const lcs = new Set<number>();
    (p.links ?? []).forEach((l) => {
      const lc = roadmapBySlug.get(leetcodeSlug(l.url) ?? '');
      if (lc !== undefined) lcs.add(lc);
    });
    lcs.forEach((lc) => {
      if (!zohoByLc.has(lc)) zohoByLc.set(lc, []);
      zohoByLc.get(lc)!.push(ref(set.topicId, p.id, p.name, set.label));
    });
  }));

  const byLc = new Map<number, RoadmapEntry>();
  roadmap.forEach((topic) => topic.problems.forEach((problem) => {
    const copies = trackerByLc.get(problem.lc) ?? [];
    byLc.set(problem.lc, {
      problem,
      topic,
      ref: copies[0] ?? ref(ROADMAP_ONLY_TOPIC_ID, problem.lc, problem.title, `Roadmap · ${topic.name}`),
      merged: copies.length > 0,
      alsoIn: copies.slice(1),
      zoho: zohoByLc.get(problem.lc) ?? [],
    });
  }));

  return { byLc, trackerOnly };
}
