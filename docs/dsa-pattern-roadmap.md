# DSA Pattern Roadmap — Easy to Hard

Topic-wise problem list that matches the 24-week plan (17 Oct 2026 → 28 Mar 2027).
Problem numbers are LeetCode numbers. ★ = core (do these first). Others = extra practice once the core is green.

---

## How to use this list

**Order inside each topic:** Easy → Medium → Hard. Never skip to Hard before the core Mediums are green.

**Status per problem:** `New` → `Red` → `Yellow` → `Green` → `Retired`

| Status | Meaning |
|---|---|
| New | Not attempted yet |
| Red | Couldn't solve without reading the explanation |
| Yellow | Solved alone but needed a hint, took >30 min, or had bugs |
| Green | Solved from a blank page in ~20–25 min with correct complexity |
| Retired | Green on two different days in a row |

**Revisit schedule:** solve → next day → +7 days → +3 weeks → +6 weeks. A Red or Yellow on any revisit resets to the +7 days step.

**For every problem, write one line:** the key insight in your own words (e.g. "count how often sum − k appeared before").

**A topic is mastered when:**
1. Every ★ problem in it is Green or Retired, and
2. You can solve 2 unseen Medium problems from that topic in about 25 minutes each.

**Recognise → apply:** each topic starts with "Recognise it" signals. In interviews, nobody tells you the pattern. Train yourself to spot it from the problem statement.

---

## 1. Arrays & Hashing · Week 3

**Recognise it:** fast lookup, counting frequencies, finding duplicates, grouping similar items.
**Core idea:** trade space for time — store what you've already seen in a HashMap or HashSet.

| LC | Problem | Level | Core |
|---|---|---|---|
| 217 | Contains Duplicate | Easy | ★ |
| 242 | Valid Anagram | Easy | ★ |
| 1 | Two Sum | Easy | ★ |
| 49 | Group Anagrams | Medium | ★ |
| 347 | Top K Frequent Elements | Medium | ★ |
| 238 | Product of Array Except Self | Medium | ★ |
| 36 | Valid Sudoku | Medium | |
| 128 | Longest Consecutive Sequence | Medium | ★ |
| 41 | First Missing Positive | Hard | |

## 2. Prefix Sum · Week 3

**Recognise it:** "sum of a subarray", "range sum query", "subarray with sum = k / divisible by k".
**Core idea:** `prefix[j] − prefix[i]` = sum of the range. Store prefix sums in a HashMap to find matching ranges in O(1).

| LC | Problem | Level | Core |
|---|---|---|---|
| 303 | Range Sum Query - Immutable | Easy | ★ |
| 724 | Find Pivot Index | Easy | |
| 560 | Subarray Sum Equals K | Medium | ★ |
| 525 | Contiguous Array | Medium | ★ |
| 523 | Continuous Subarray Sum | Medium | |
| 974 | Subarray Sums Divisible by K | Medium | |
| 304 | Range Sum Query 2D - Immutable | Medium | |
| 1074 | Number of Submatrices That Sum to Target | Hard | |

## 3. Two Pointers · Week 4

**Recognise it:** sorted array, pairs/triplets with a target, palindromes, in-place rearranging.
**Core idea:** two indices moving toward each other (or same direction) remove the inner loop: O(n²) → O(n).

| LC | Problem | Level | Core |
|---|---|---|---|
| 125 | Valid Palindrome | Easy | ★ |
| 283 | Move Zeroes | Easy | |
| 26 | Remove Duplicates from Sorted Array | Easy | |
| 977 | Squares of a Sorted Array | Easy | |
| 167 | Two Sum II - Input Array Is Sorted | Medium | ★ |
| 15 | 3Sum | Medium | ★ |
| 11 | Container With Most Water | Medium | ★ |
| 75 | Sort Colors | Medium | |
| 18 | 4Sum | Medium | |
| 42 | Trapping Rain Water | Hard | ★ |

## 4. Sliding Window · Week 5

**Recognise it:** "longest / shortest / count of substring or subarray" with a condition.
**Core idea:** expand the right edge; shrink the left edge while the window is invalid. Track the window state in a map or counter.

| LC | Problem | Level | Core |
|---|---|---|---|
| 121 | Best Time to Buy and Sell Stock | Easy | ★ |
| 643 | Maximum Average Subarray I | Easy | |
| 3 | Longest Substring Without Repeating Characters | Medium | ★ |
| 424 | Longest Repeating Character Replacement | Medium | ★ |
| 567 | Permutation in String | Medium | ★ |
| 209 | Minimum Size Subarray Sum | Medium | |
| 438 | Find All Anagrams in a String | Medium | |
| 1004 | Max Consecutive Ones III | Medium | |
| 76 | Minimum Window Substring | Hard | ★ |
| 239 | Sliding Window Maximum | Hard | |

## 5. Stack & Monotonic Stack · Week 6

**Recognise it:** matching brackets, "next greater / smaller element", nested structures, undo-like order.
**Core idea:** a stack remembers what's still "open". A monotonic stack keeps elements in sorted order so each one is pushed and popped once: O(n).

| LC | Problem | Level | Core |
|---|---|---|---|
| 20 | Valid Parentheses | Easy | ★ |
| 232 | Implement Queue using Stacks | Easy | |
| 496 | Next Greater Element I | Easy | |
| 155 | Min Stack | Medium | ★ |
| 150 | Evaluate Reverse Polish Notation | Medium | ★ |
| 739 | Daily Temperatures | Medium | ★ |
| 853 | Car Fleet | Medium | ★ |
| 22 | Generate Parentheses | Medium | |
| 503 | Next Greater Element II | Medium | |
| 394 | Decode String | Medium | |
| 901 | Online Stock Span | Medium | |
| 84 | Largest Rectangle in Histogram | Hard | ★ |

## 6. Binary Search · Week 7

**Recognise it:** sorted input, rotated sorted array, "minimum / maximum value that satisfies X", O(log n) required.
**Core idea:** halve the search space each step. "Search on answer": binary search over the answer range and check feasibility.

| LC | Problem | Level | Core |
|---|---|---|---|
| 704 | Binary Search | Easy | ★ |
| 35 | Search Insert Position | Easy | |
| 278 | First Bad Version | Easy | |
| 74 | Search a 2D Matrix | Medium | ★ |
| 875 | Koko Eating Bananas | Medium | ★ |
| 153 | Find Minimum in Rotated Sorted Array | Medium | ★ |
| 33 | Search in Rotated Sorted Array | Medium | ★ |
| 1011 | Capacity To Ship Packages Within D Days | Medium | ★ |
| 34 | Find First and Last Position of Element in Sorted Array | Medium | |
| 162 | Find Peak Element | Medium | |
| 981 | Time Based Key-Value Store | Medium | |
| 410 | Split Array Largest Sum | Hard | |
| 4 | Median of Two Sorted Arrays | Hard | |

## 7. Linked List · Week 8

**Recognise it:** node pointers, reversing, merging, cycles, "kth from end".
**Core idea:** dummy head node, fast/slow pointers, and reversing in place. Draw pointers on paper before coding.

| LC | Problem | Level | Core |
|---|---|---|---|
| 206 | Reverse Linked List | Easy | ★ |
| 21 | Merge Two Sorted Lists | Easy | ★ |
| 141 | Linked List Cycle | Easy | ★ |
| 876 | Middle of the Linked List | Easy | |
| 234 | Palindrome Linked List | Easy | |
| 143 | Reorder List | Medium | ★ |
| 19 | Remove Nth Node From End of List | Medium | ★ |
| 138 | Copy List with Random Pointer | Medium | ★ |
| 2 | Add Two Numbers | Medium | ★ |
| 146 | LRU Cache | Medium | ★ |
| 142 | Linked List Cycle II | Medium | |
| 287 | Find the Duplicate Number | Medium | |
| 23 | Merge k Sorted Lists | Hard | ★ |
| 25 | Reverse Nodes in k-Group | Hard | |

## 8. Trees · Week 9

**Recognise it:** hierarchical data, "depth / height / path / ancestor", level-by-level output, BST ordering.
**Core idea:** most tree problems = DFS that returns a value from children to parent. Level-related = BFS with a queue. BST = inorder is sorted.

| LC | Problem | Level | Core |
|---|---|---|---|
| 226 | Invert Binary Tree | Easy | ★ |
| 104 | Maximum Depth of Binary Tree | Easy | ★ |
| 543 | Diameter of Binary Tree | Easy | ★ |
| 110 | Balanced Binary Tree | Easy | ★ |
| 100 | Same Tree | Easy | ★ |
| 572 | Subtree of Another Tree | Easy | ★ |
| 235 | Lowest Common Ancestor of a Binary Search Tree | Medium | ★ |
| 102 | Binary Tree Level Order Traversal | Medium | ★ |
| 199 | Binary Tree Right Side View | Medium | ★ |
| 1448 | Count Good Nodes in Binary Tree | Medium | ★ |
| 98 | Validate Binary Search Tree | Medium | ★ |
| 230 | Kth Smallest Element in a BST | Medium | ★ |
| 105 | Construct Binary Tree from Preorder and Inorder Traversal | Medium | ★ |
| 236 | Lowest Common Ancestor of a Binary Tree | Medium | |
| 124 | Binary Tree Maximum Path Sum | Hard | ★ |
| 297 | Serialize and Deserialize Binary Tree | Hard | |

## 9. Heap / Priority Queue · Week 10

**Recognise it:** "top K", "kth largest / smallest", "closest K", merging sorted streams, running median.
**Core idea:** a heap of size K keeps the best K in O(n log K). Java: `PriorityQueue` (min-heap by default; use `Collections.reverseOrder()` or a comparator for max-heap).

| LC | Problem | Level | Core |
|---|---|---|---|
| 703 | Kth Largest Element in a Stream | Easy | ★ |
| 1046 | Last Stone Weight | Easy | ★ |
| 973 | K Closest Points to Origin | Medium | ★ |
| 215 | Kth Largest Element in an Array | Medium | ★ |
| 621 | Task Scheduler | Medium | ★ |
| 767 | Reorganize String | Medium | |
| 355 | Design Twitter | Medium | |
| 295 | Find Median from Data Stream | Hard | ★ |
| 502 | IPO | Hard | |

## 10. Backtracking · Week 11

**Recognise it:** "all combinations / subsets / permutations", "generate every valid…", constraint puzzles.
**Core idea:** choose → explore → un-choose. Draw the decision tree first; the code follows the tree.

| LC | Problem | Level | Core |
|---|---|---|---|
| 78 | Subsets | Medium | ★ |
| 39 | Combination Sum | Medium | ★ |
| 46 | Permutations | Medium | ★ |
| 90 | Subsets II | Medium | ★ |
| 79 | Word Search | Medium | ★ |
| 131 | Palindrome Partitioning | Medium | ★ |
| 17 | Letter Combinations of a Phone Number | Medium | ★ |
| 40 | Combination Sum II | Medium | |
| 51 | N-Queens | Hard | ★ |
| 37 | Sudoku Solver | Hard | |

## 11. Trie · Week 11

**Recognise it:** prefix search, autocomplete, "words starting with", searching many words in a grid.
**Core idea:** each node = one character with up to 26 children and an `isEnd` flag.

| LC | Problem | Level | Core |
|---|---|---|---|
| 208 | Implement Trie (Prefix Tree) | Medium | ★ |
| 211 | Design Add and Search Words Data Structure | Medium | ★ |
| 1268 | Search Suggestions System | Medium | |
| 212 | Word Search II | Hard | ★ |

## 12. Graphs: BFS / DFS · Week 12

**Recognise it:** grids, islands, connected regions, spreading (rot, fire, infection), "minimum steps" in an unweighted graph.
**Core idea:** DFS to explore a component; BFS for shortest path in unweighted graphs. Always track `visited`.

| LC | Problem | Level | Core |
|---|---|---|---|
| 733 | Flood Fill | Easy | |
| 1971 | Find if Path Exists in Graph | Easy | |
| 200 | Number of Islands | Medium | ★ |
| 133 | Clone Graph | Medium | ★ |
| 695 | Max Area of Island | Medium | ★ |
| 994 | Rotting Oranges | Medium | ★ |
| 417 | Pacific Atlantic Water Flow | Medium | ★ |
| 130 | Surrounded Regions | Medium | ★ |
| 542 | 01 Matrix | Medium | |
| 127 | Word Ladder | Hard | ★ |

## 13. Graphs: Topological Sort & Union-Find · Week 13

**Recognise it:** dependencies / prerequisites / ordering (topo sort); "are these connected", merging groups, detecting a redundant edge (union-find).
**Core idea:** topo sort = Kahn's BFS with in-degrees (a leftover node means a cycle). Union-find = `find` with path compression + `union` by rank.

| LC | Problem | Level | Core |
|---|---|---|---|
| 207 | Course Schedule | Medium | ★ |
| 210 | Course Schedule II | Medium | ★ |
| 547 | Number of Provinces | Medium | ★ |
| 684 | Redundant Connection | Medium | ★ |
| 721 | Accounts Merge | Medium | |
| 329 | Longest Increasing Path in a Matrix | Hard | |

## 14. Shortest Paths & MST · Week 14

**Recognise it:** weighted edges, "minimum cost / time / effort", "cheapest with at most K stops", "connect all points cheaply".
**Core idea:** Dijkstra = BFS with a min-heap. Bellman-Ford when stops are limited. MST = Prim's (heap) or Kruskal's (sort + union-find).

| LC | Problem | Level | Core |
|---|---|---|---|
| 743 | Network Delay Time | Medium | ★ |
| 1584 | Min Cost to Connect All Points | Medium | ★ |
| 787 | Cheapest Flights Within K Stops | Medium | ★ |
| 1631 | Path With Minimum Effort | Medium | |
| 778 | Swim in Rising Water | Hard | |
| 332 | Reconstruct Itinerary | Hard | |

## 15. Dynamic Programming 1D · Weeks 15–16

**Recognise it:** "number of ways", "minimum / maximum", "can you reach / form", choices at each step that affect the future.
**Core idea:** write the recurrence in words first ("best at i = best of taking i or skipping i"). Then: recursion → memo → bottom-up table → space-optimised.

| LC | Problem | Level | Core |
|---|---|---|---|
| 70 | Climbing Stairs | Easy | ★ |
| 746 | Min Cost Climbing Stairs | Easy | ★ |
| 509 | Fibonacci Number | Easy | |
| 198 | House Robber | Medium | ★ |
| 213 | House Robber II | Medium | ★ |
| 5 | Longest Palindromic Substring | Medium | ★ |
| 647 | Palindromic Substrings | Medium | ★ |
| 91 | Decode Ways | Medium | ★ |
| 322 | Coin Change | Medium | ★ |
| 152 | Maximum Product Subarray | Medium | ★ |
| 139 | Word Break | Medium | ★ |
| 300 | Longest Increasing Subsequence | Medium | ★ |
| 416 | Partition Equal Subset Sum | Medium | ★ |

## 16. Dynamic Programming 2D · Week 17

**Recognise it:** two strings compared, grid paths, "knapsack with choices", state needs two variables (index + something).
**Core idea:** `dp[i][j]` = answer for the first i of one thing and first j of another. Fill the table on paper for a tiny example before coding.

| LC | Problem | Level | Core |
|---|---|---|---|
| 62 | Unique Paths | Medium | ★ |
| 64 | Minimum Path Sum | Medium | |
| 1143 | Longest Common Subsequence | Medium | ★ |
| 518 | Coin Change II | Medium | ★ |
| 494 | Target Sum | Medium | ★ |
| 309 | Best Time to Buy and Sell Stock with Cooldown | Medium | ★ |
| 97 | Interleaving String | Medium | ★ |
| 72 | Edit Distance | Medium | ★ |
| 115 | Distinct Subsequences | Hard | |
| 312 | Burst Balloons | Hard | |
| 10 | Regular Expression Matching | Hard | |

## 17. Greedy · Week 18

**Recognise it:** a locally best choice at each step leads to the global best; "minimum jumps", "can you reach", "partition into…".
**Core idea:** before trusting greedy, try to break it with a small counter-example. If you can't, prove the choice is safe in one sentence.

| LC | Problem | Level | Core |
|---|---|---|---|
| 455 | Assign Cookies | Easy | |
| 53 | Maximum Subarray | Medium | ★ |
| 55 | Jump Game | Medium | ★ |
| 45 | Jump Game II | Medium | ★ |
| 134 | Gas Station | Medium | ★ |
| 846 | Hand of Straights | Medium | ★ |
| 763 | Partition Labels | Medium | ★ |
| 678 | Valid Parenthesis String | Medium | ★ |
| 135 | Candy | Hard | |

## 18. Intervals · Week 18

**Recognise it:** start/end pairs, meetings, overlapping ranges, merging or inserting ranges.
**Core idea:** sort by start (or by end for "max non-overlapping"), then sweep once comparing with the last kept interval.

| LC | Problem | Level | Core |
|---|---|---|---|
| 57 | Insert Interval | Medium | ★ |
| 56 | Merge Intervals | Medium | ★ |
| 435 | Non-overlapping Intervals | Medium | ★ |
| 452 | Minimum Number of Arrows to Burst Balloons | Medium | |
| 1851 | Minimum Interval to Include Each Query | Hard | |

## 19. Bit Manipulation, Math & Matrix · Week 19

**Recognise it:** XOR tricks, counting bits, "without using + or −", digit manipulation, rotating / spiralling a matrix.
**Core idea:** `x ^ x = 0`, `x & (x − 1)` removes the lowest set bit. Matrix problems = careful boundary tracking.

| LC | Problem | Level | Core |
|---|---|---|---|
| 136 | Single Number | Easy | ★ |
| 191 | Number of 1 Bits | Easy | ★ |
| 338 | Counting Bits | Easy | ★ |
| 268 | Missing Number | Easy | ★ |
| 190 | Reverse Bits | Easy | |
| 202 | Happy Number | Easy | |
| 66 | Plus One | Easy | |
| 371 | Sum of Two Integers | Medium | ★ |
| 7 | Reverse Integer | Medium | ★ |
| 48 | Rotate Image | Medium | ★ |
| 54 | Spiral Matrix | Medium | ★ |
| 73 | Set Matrix Zeroes | Medium | |
| 50 | Pow(x, n) | Medium | |
| 43 | Multiply Strings | Medium | |

---

## 20. Zoho-style extras · Mix in from Week 19

Commonly shared Zoho experiences describe these kinds of rounds. **Your own collected interview questions are more accurate than this list — treat those as the priority and this as a supplement.**

- **Programming rounds:** strings, matrices, number problems, pattern printing, written without library shortcuts.
- **Advanced programming / app round:** build a working console application in limited time (for example a ticket booking, taxi booking, or parking system) with clean classes. Practise this with your LLD weekends (Phase 3).

| LC | Problem | Level | Core |
|---|---|---|---|
| 13 | Roman to Integer | Easy | ★ |
| 14 | Longest Common Prefix | Easy | ★ |
| 12 | Integer to Roman | Medium | |
| 6 | Zigzag Conversion | Medium | ★ |
| 8 | String to Integer (atoi) | Medium | |
| 151 | Reverse Words in a String | Medium | ★ |
| 443 | String Compression | Medium | ★ |
| 451 | Sort Characters By Frequency | Medium | ★ |

Also overlap with Zoho style: 54 Spiral Matrix, 48 Rotate Image, 73 Set Matrix Zeroes, 20 Valid Parentheses.

---

## Totals

- About 130 ★ core problems across 20 topics. Many will overlap with problems you've already solved, so your real new count is lower.
- Extras: do them only after a topic's core is Green, or as unseen practice for the "2 unseen Mediums" mastery test.
