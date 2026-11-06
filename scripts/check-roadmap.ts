// Sanity checks for the roadmap merge + recall ladder. Run: npm run roadmap:check
// Read-only: imports the app's data and logic, prints a report, exits 1 on failure.
import { topics } from '@/data/topics';
import { ROADMAP_TOPICS } from '@/data/roadmap';
import { ZOHO_SETS } from '@/lib/problemIndex';
import { buildRoadmapIndex, ROADMAP_ONLY_TOPIC_ID } from '@/lib/roadmapIndex';
import { computeLadder, recallStatus, summarizeMastery, type RecallAttempt, type RecallRating } from '@/lib/revisit';

let failures = 0;
const check = (label: string, ok: boolean, detail = '') => {
  if (!ok) failures++;
  console.log(`${ok ? '  ✓' : '  ✗'} ${label}${detail ? `  — ${detail}` : ''}`);
};

// ── Roadmap ↔ tracker ↔ Zoho ──
const index = buildRoadmapIndex(ROADMAP_TOPICS, topics, ZOHO_SETS);
const entries = [...index.byLc.values()];
const merged = entries.filter((e) => e.merged);
const fresh = entries.filter((e) => !e.merged);
const zohoTagged = entries.filter((e) => e.zoho.length);
const withAlso = entries.filter((e) => e.alsoIn.length);

console.log('\nRoadmap merge');
check('roadmap problems', entries.length === 197, `${entries.length}`);
check('core ★', entries.filter((e) => e.problem.core).length === 129, `${entries.filter((e) => e.problem.core).length}`);
check('merged with existing tracker problems', merged.length === 122, `${merged.length}`);
check('new roadmap-only problems (key 300-<LC>)', fresh.length === 75, `${fresh.length}`);
check('new keys all use topic 300 + LC number', fresh.every((e) => e.ref.key === `${ROADMAP_ONLY_TOPIC_ID}-${e.problem.lc}`));
check('no progress key used by two roadmap problems', new Set(entries.map((e) => e.ref.key)).size === entries.length);
check('merged keys point at real topics.ts problems', merged.every((e) => topics.some((t) => t.problems.some((p) => `${t.id}-${p.id}` === e.ref.key))));
check('Zoho never used as the progress key', entries.every((e) => e.ref.topicId < 200 || e.ref.topicId === ROADMAP_ONLY_TOPIC_ID));
const trackerRows = topics.reduce((n, t) => n + t.problems.length, 0);
const usedByRoadmap = merged.length + withAlso.reduce((n, e) => n + e.alsoIn.length, 0);
check('every tracker problem is either in the roadmap or listed as tracker-only', usedByRoadmap + index.trackerOnly.length === trackerRows,
  `${usedByRoadmap} + ${index.trackerOnly.length} = ${trackerRows}`);
console.log(`    Zoho-tagged roadmap problems: ${zohoTagged.length}`);
console.log(`    LC numbers with a second tracker copy (kept separate): ${withAlso.map((e) => e.problem.lc).join(', ') || 'none'}`);
console.log(`    Sample: LC 1 → ${index.byLc.get(1)!.ref.key} (${index.byLc.get(1)!.ref.source}); Zoho: ${index.byLc.get(1)!.zoho.map((z) => z.source).join(', ') || '—'}`);
console.log(`    Sample: LC 853 → ${index.byLc.get(853)!.ref.key} (${index.byLc.get(853)!.ref.source})`);

// ── Ladder + status ──
console.log('\nRecall ladder (retire = green at +3w and +6w)');
const A = (date: string, rating: RecallRating): RecallAttempt => ({ date, rating });
const run = (log: RecallAttempt[]) => {
  const l = computeLadder(log)!;
  return { ...l, status: recallStatus({ attemptLog: log, rating: l.rating, retired: l.retired }) };
};
check('no attempts → New', recallStatus({}) === 'New' && recallStatus(null) === 'New');
let r = run([A('2026-11-07', 'red')]);
check('new solve → revisit next day', r.nextReviseDate === '2026-11-08' && r.status === 'Red', `${r.nextReviseDate} ${r.status}`);
check('lastSolved = latest attempt date', r.lastSolved === '2026-11-07');
r = run([A('2026-11-07', 'red'), A('2026-11-08', 'green')]);
check('green on next-day revisit → +7', r.nextReviseDate === '2026-11-15' && r.status === 'Green', `${r.nextReviseDate}`);
r = run([A('2026-11-07', 'red'), A('2026-11-08', 'green'), A('2026-11-15', 'green')]);
check('green on +7 → +3 weeks', r.nextReviseDate === '2026-12-06', `${r.nextReviseDate}`);
r = run([A('2026-11-07', 'red'), A('2026-11-08', 'green'), A('2026-11-15', 'green'), A('2026-12-06', 'green')]);
check('green on +3w → +6 weeks', r.nextReviseDate === '2027-01-17' && r.status === 'Green', `${r.nextReviseDate}`);
r = run([A('2026-11-07', 'red'), A('2026-11-08', 'green'), A('2026-11-15', 'green'), A('2026-12-06', 'green'), A('2027-01-17', 'green')]);
check('green on +6w → Retired', r.status === 'Retired' && r.nextReviseDate === '', r.status);
r = run([A('2026-11-07', 'green'), A('2026-11-08', 'green')]);
check('two quick greens do NOT retire', r.status === 'Green', r.status);
r = run([A('2026-11-07', 'red'), A('2026-11-08', 'green'), A('2026-11-15', 'yellow')]);
check('yellow on a revisit → reset to +7', r.nextReviseDate === '2026-11-22' && r.status === 'Yellow', `${r.nextReviseDate}`);
r = run([A('2026-11-07', 'green'), A('2026-11-08', 'green'), A('2026-11-15', 'green'), A('2026-12-06', 'green'), A('2027-01-17', 'green'), A('2027-02-20', 'red')]);
check('red after retiring → back on the ladder at +7', r.status === 'Red' && r.nextReviseDate === '2027-02-27', `${r.nextReviseDate}`);

// ── Topic mastery ──
console.log('\nTopic mastery (all ★ Green or Retired)');
check('every roadmap topic has at least one ★', ROADMAP_TOPICS.every((t) => t.problems.some((p) => p.core)));
let m = summarizeMastery([{ core: true, status: 'Green' }, { core: true, status: 'Retired' }, { core: false, status: 'New' }]);
check('all ★ Green/Retired → mastered (non-★ ignored)', m.mastered && m.coreDone === 2 && m.coreTotal === 2);
m = summarizeMastery([{ core: true, status: 'Green' }, { core: true, status: 'Yellow' }]);
check('one ★ Yellow → not mastered', !m.mastered && m.coreDone === 1);
m = summarizeMastery([{ core: false, status: 'Green' }]);
check('topic with no ★ is never mastered', !m.mastered);
m = summarizeMastery([{ core: true, status: 'New' }, { core: true, status: 'Red' }, { core: false, status: 'Green' }]);
check('counts by status', m.coreCounts.New === 1 && m.coreCounts.Red === 1 && m.allDone === 1 && m.allTotal === 3);

console.log(failures ? `\n${failures} check(s) FAILED` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
