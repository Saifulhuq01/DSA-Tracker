export const ZOHO_OVERVIEW = {
  title: 'Zoho Chennai — Real Interview Plan',
  subtitle: 'Based on Verified 2023–2024 Chennai Interview Experiences',
  author: 'Mohammed Saifulhuq | 30-Day Plan | Rounds 2–5',
  processNote: `ROUND 1 (Written) — Aptitude + C pseudo-code. Skippable with referral or 1 YOE.
ROUND 2 (HackerRank) — 6 problems, 90 min. Need 4+ correct. ~3000 → ~60 → ~11.
ROUND 3 (Advanced Programming) — Build a FULL WORKING APP in 2–3 hrs. OOP + data structures.
ROUND 4 (Technical Interview) — Resume deep-dive, OOP theory, CS fundamentals.
ROUND 5 (HR) — Why Zoho, salary, higher studies, culture fit. NOT a formality.`,
};

export interface ZohoLink { label: string; url: string; platform: 'LC' | 'GFG' | 'YT' | 'Other'; }
export interface ZohoProblem {
  id: number; name: string; category: string; insight: string; difficulty: string;
  links?: ZohoLink[];
}

export const ROUND2_PROBLEMS: ZohoProblem[] = [
  { id: 1, name: 'Balanced Parentheses', category: 'Stack', insight: 'Stack push/pop with valid bracket mapping', difficulty: 'Easy', links: [
    { label: 'LC 20', url: 'https://leetcode.com/problems/valid-parentheses/', platform: 'LC' },
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/check-for-balanced-parentheses-in-an-expression/', platform: 'GFG' },
    { label: 'Striver', url: 'https://www.youtube.com/watch?v=wkDfsKijrZ8', platform: 'YT' }] },
  { id: 2, name: 'Two Sum', category: 'Arrays/Hashing', insight: 'HashMap: one pass, store complement', difficulty: 'Easy', links: [
    { label: 'LC 1', url: 'https://leetcode.com/problems/two-sum/', platform: 'LC' },
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/check-if-pair-with-given-sum-exists-in-array/', platform: 'GFG' },
    { label: 'NeetCode', url: 'https://www.youtube.com/watch?v=KLlXCFG5TnA', platform: 'YT' }] },
  { id: 3, name: 'Reverse a Linked List', category: 'Linked List', insight: 'Three-pointer: prev, curr, next', difficulty: 'Easy', links: [
    { label: 'LC 206', url: 'https://leetcode.com/problems/reverse-linked-list/', platform: 'LC' },
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/reverse-a-linked-list/', platform: 'GFG' },
    { label: 'Striver', url: 'https://www.youtube.com/watch?v=iRtLEoL-r-g', platform: 'YT' }] },
  { id: 4, name: 'Find Middle of Linked List', category: 'Linked List', insight: 'Fast & slow pointer', difficulty: 'Easy', links: [
    { label: 'LC 876', url: 'https://leetcode.com/problems/middle-of-the-linked-list/', platform: 'LC' },
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/write-a-c-function-to-print-the-middle-of-the-linked-list/', platform: 'GFG' }] },
  { id: 5, name: 'Check Palindrome', category: 'Strings', insight: 'Two pointer from both ends — O(n) O(1)', difficulty: 'Easy', links: [
    { label: 'LC 125', url: 'https://leetcode.com/problems/valid-palindrome/', platform: 'LC' },
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/check-if-a-number-is-palindrome/', platform: 'GFG' }] },
  { id: 6, name: 'Reverse Words in String', category: 'Strings', insight: 'Split, reverse array, rejoin', difficulty: 'Easy', links: [
    { label: 'LC 151', url: 'https://leetcode.com/problems/reverse-words-in-a-string/', platform: 'LC' },
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/reverse-words-in-a-given-string/', platform: 'GFG' }] },
  { id: 7, name: 'Binary Search', category: 'Binary Search', insight: 'lo + (hi-lo)/2 prevents overflow', difficulty: 'Easy', links: [
    { label: 'LC 704', url: 'https://leetcode.com/problems/binary-search/', platform: 'LC' },
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/binary-search/', platform: 'GFG' },
    { label: 'Striver', url: 'https://www.youtube.com/watch?v=MHf6awe89xw', platform: 'YT' }] },
  { id: 8, name: 'Height of Binary Tree', category: 'Trees', insight: 'max(left, right) + 1 recursively', difficulty: 'Easy', links: [
    { label: 'LC 104', url: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/', platform: 'LC' },
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/find-the-maximum-depth-or-height-of-a-tree/', platform: 'GFG' }] },
  { id: 9, name: 'Detect Loop (Floyd\'s)', category: 'Linked List', insight: 'Fast ptr 2, slow 1 — meet = cycle', difficulty: 'Easy', links: [
    { label: 'LC 141', url: 'https://leetcode.com/problems/linked-list-cycle/', platform: 'LC' },
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/detect-loop-in-a-linked-list/', platform: 'GFG' }] },
  { id: 10, name: 'Roman to Integer', category: 'Strings/Math', insight: 'If current < next: subtract, else add', difficulty: 'Easy', links: [
    { label: 'LC 13', url: 'https://leetcode.com/problems/roman-to-integer/', platform: 'LC' },
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/converting-roman-numerals-decimal-lying-1-3999/', platform: 'GFG' }] },
  { id: 11, name: 'Sort 0s 1s 2s (Dutch Flag)', category: 'Arrays', insight: 'Three pointer: lo, mid, hi — single pass', difficulty: 'Easy', links: [
    { label: 'LC 75', url: 'https://leetcode.com/problems/sort-colors/', platform: 'LC' },
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/sort-an-array-of-0s-1s-and-2s/', platform: 'GFG' },
    { label: 'Striver', url: 'https://www.youtube.com/watch?v=tp8JIuCXBaU', platform: 'YT' }] },
  { id: 12, name: 'Rotate Array by d', category: 'Arrays', insight: 'Reversal algorithm', difficulty: 'Easy', links: [
    { label: 'LC 189', url: 'https://leetcode.com/problems/rotate-array/', platform: 'LC' },
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/array-rotation/', platform: 'GFG' }] },
  { id: 13, name: 'Stock Span Problem', category: 'Stack', insight: 'Monotonic stack with index tracking', difficulty: 'Medium', links: [
    { label: 'LC 901', url: 'https://leetcode.com/problems/online-stock-span/', platform: 'LC' },
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/the-stock-span-problem/', platform: 'GFG' },
    { label: 'Aditya Verma', url: 'https://www.youtube.com/watch?v=p9T-fE1g1pU', platform: 'YT' }] },
  { id: 14, name: 'Trapping Rain Water', category: 'Arrays', insight: 'Two pointers: maxLeft, maxRight', difficulty: 'Medium', links: [
    { label: 'LC 42', url: 'https://leetcode.com/problems/trapping-rain-water/', platform: 'LC' },
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/trapping-rain-water/', platform: 'GFG' },
    { label: 'NeetCode', url: 'https://www.youtube.com/watch?v=ZI2z5pq0TqA', platform: 'YT' }] },
  { id: 15, name: 'Max Consecutive Ones (flip)', category: 'Sliding Window', insight: 'Expand window, shrink when flips > k', difficulty: 'Medium', links: [
    { label: 'LC 1004', url: 'https://leetcode.com/problems/max-consecutive-ones-iii/', platform: 'LC' },
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/find-zeroes-to-be-flipped-so-that-number-of-consecutive-1s-is-maximized/', platform: 'GFG' }] },
  { id: 16, name: 'Find Missing Number', category: 'Arrays/Math', insight: 'XOR or n*(n+1)/2 - sum', difficulty: 'Easy', links: [
    { label: 'LC 268', url: 'https://leetcode.com/problems/missing-number/', platform: 'LC' },
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/find-the-missing-number/', platform: 'GFG' }] },
  { id: 17, name: 'Isomorphic Strings', category: 'Hashing', insight: 'Two HashMaps: s→t and t→s', difficulty: 'Easy', links: [
    { label: 'LC 205', url: 'https://leetcode.com/problems/isomorphic-strings/', platform: 'LC' },
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/check-if-two-given-strings-are-isomorphic-to-each-other/', platform: 'GFG' }] },
  { id: 18, name: 'LIS', category: 'DP', insight: 'dp[i] = max dp[j]+1 where arr[j]<arr[i]', difficulty: 'Medium', links: [
    { label: 'LC 300', url: 'https://leetcode.com/problems/longest-increasing-subsequence/', platform: 'LC' },
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/longest-increasing-subsequence-dp-3/', platform: 'GFG' },
    { label: 'Striver', url: 'https://www.youtube.com/watch?v=ekcwMsSIzVc', platform: 'YT' }] },
  { id: 19, name: 'Subset Sum Problem', category: 'DP', insight: 'dp[i][w] = dp[i-1][w] OR dp[i-1][w-arr[i]]', difficulty: 'Medium', links: [
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/subset-sum-problem-dp-25/', platform: 'GFG' },
    { label: 'Aditya Verma', url: 'https://www.youtube.com/watch?v=_gPcYovP7wc', platform: 'YT' }] },
  { id: 20, name: 'Jump Game', category: 'Greedy', insight: 'Track maxReach — greedy O(n)', difficulty: 'Medium', links: [
    { label: 'LC 55', url: 'https://leetcode.com/problems/jump-game/', platform: 'LC' },
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/jump-game/', platform: 'GFG' },
    { label: 'NeetCode', url: 'https://www.youtube.com/watch?v=Yan0cv2cLy8', platform: 'YT' }] },
  { id: 21, name: 'BST Validation', category: 'Trees/BST', insight: 'Pass min/max bounds, NOT parent comparison', difficulty: 'Medium', links: [
    { label: 'LC 98', url: 'https://leetcode.com/problems/validate-binary-search-tree/', platform: 'LC' },
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/a-program-to-check-if-a-binary-tree-is-bst-or-not/', platform: 'GFG' }] },
  { id: 22, name: 'Allocate Min Pages', category: 'Binary Search', insight: 'BS on answer space', difficulty: 'Medium', links: [
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/allocate-minimum-number-pages/', platform: 'GFG' },
    { label: 'Striver', url: 'https://www.youtube.com/watch?v=Z0hwjftStI4', platform: 'YT' }] },
  { id: 23, name: 'Beautiful Pairs variant', category: 'DP/Arrays', insight: 'Track state across pairs', difficulty: 'Medium', links: [
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/beautiful-pair/', platform: 'GFG' }] },
  { id: 24, name: 'DFS of Graph', category: 'Graphs', insight: 'Visited array, recurse unvisited', difficulty: 'Medium', links: [
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/depth-first-search-or-dfs-for-a-graph/', platform: 'GFG' },
    { label: 'Striver', url: 'https://www.youtube.com/watch?v=Qzf1a--rhp8', platform: 'YT' }] },
  { id: 25, name: 'pow(x,n) Fast Exp', category: 'Math/Recursion', insight: 'Binary exponentiation O(log n)', difficulty: 'Medium', links: [
    { label: 'LC 50', url: 'https://leetcode.com/problems/powx-n/', platform: 'LC' },
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/write-a-c-program-to-calculate-powxn/', platform: 'GFG' }] },
  { id: 26, name: 'Permutations of String', category: 'Backtracking', insight: 'Swap or choose/unchoose pattern', difficulty: 'Medium', links: [
    { label: 'LC 46', url: 'https://leetcode.com/problems/permutations/', platform: 'LC' },
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/write-a-c-program-to-print-all-permutations-of-a-given-string/', platform: 'GFG' },
    { label: 'Striver', url: 'https://www.youtube.com/watch?v=YK78FU5Ffjw', platform: 'YT' }] },
  { id: 27, name: 'Unique Rows Boolean Matrix', category: 'Hashing', insight: 'Row→string, HashSet', difficulty: 'Medium', links: [
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/print-unique-rows/', platform: 'GFG' }] },
  { id: 28, name: 'Boundary Traversal BT', category: 'Trees', insight: '3 passes: left, leaves, right reversed', difficulty: 'Medium', links: [
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/boundary-traversal-of-binary-tree/', platform: 'GFG' },
    { label: 'Striver', url: 'https://www.youtube.com/watch?v=0ca1nvR0be8', platform: 'YT' }] },
  { id: 29, name: 'LRU Cache', category: 'Design', insight: 'HashMap + DoublyLinkedList O(1)', difficulty: 'Medium', links: [
    { label: 'LC 146', url: 'https://leetcode.com/problems/lru-cache/', platform: 'LC' },
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/lru-cache-implementation/', platform: 'GFG' },
    { label: 'NeetCode', url: 'https://www.youtube.com/watch?v=7ABFKPK2hD4', platform: 'YT' }] },
  { id: 30, name: 'LFU Cache (2024 confirmed)', category: 'Design', insight: 'Two HashMaps + freq-to-DLL map', difficulty: 'Hard', links: [
    { label: 'LC 460', url: 'https://leetcode.com/problems/lfu-cache/', platform: 'LC' },
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/least-frequently-used-lfu-cache-implementation/', platform: 'GFG' }] },
];

export const ROUND3_APPS: ZohoProblem[] = [
  { id: 1, name: 'Transaction Manager', category: 'OOP + DS', insight: 'Set/Get/Unset/Count + Begin/Commit/Rollback. Stack of snapshots.', difficulty: 'App', links: [
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/transaction-management/', platform: 'GFG' },
    { label: 'Concept', url: 'https://www.youtube.com/watch?v=s4eRGNJHEqM', platform: 'YT' }] },
  { id: 2, name: 'LFU Cache (full)', category: 'OOP + Design', insight: 'freq→DLL map + key→node map + key→freq map', difficulty: 'App', links: [
    { label: 'LC 460', url: 'https://leetcode.com/problems/lfu-cache/', platform: 'LC' },
    { label: 'NeetCode', url: 'https://www.youtube.com/watch?v=0PSB9y8ehbk', platform: 'YT' }] },
  { id: 3, name: 'LRU Cache (full)', category: 'OOP + Design', insight: 'HashMap + DoublyLinkedList. MoveToFront.', difficulty: 'App', links: [
    { label: 'LC 146', url: 'https://leetcode.com/problems/lru-cache/', platform: 'LC' },
    { label: 'NeetCode', url: 'https://www.youtube.com/watch?v=7ABFKPK2hD4', platform: 'YT' }] },
  { id: 4, name: 'E-Commerce App', category: 'OOP Full App', insight: 'User, Seller, Product, Cart, Order, Payment', difficulty: 'App', links: [
    { label: 'LLD Guide', url: 'https://www.youtube.com/watch?v=EKjB6sMo2ZE', platform: 'YT' }] },
  { id: 5, name: 'Library Management', category: 'OOP Full App', insight: 'Book, Member, Librarian, Transaction', difficulty: 'App', links: [
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/design-a-library-management-system/', platform: 'GFG' },
    { label: 'Design', url: 'https://www.youtube.com/watch?v=WQ2GlHOAAaY', platform: 'YT' }] },
  { id: 6, name: 'Hospital Management', category: 'OOP Full App', insight: 'Doctor, Patient, Appointment, Ward', difficulty: 'App', links: [
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/design-an-online-hotel-booking-system/', platform: 'GFG' }] },
  { id: 7, name: 'Parking Lot System', category: 'OOP Full App', insight: 'ParkingLot, Floor, Slot, Ticket, Vehicle', difficulty: 'App', links: [
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/design-parking-lot-using-object-oriented-principles/', platform: 'GFG' },
    { label: 'Design', url: 'https://www.youtube.com/watch?v=tVRyb4HaHgw', platform: 'YT' }] },
  { id: 8, name: 'Taxi Booking App', category: 'OOP Full App', insight: 'Driver, Rider, Booking, LocationService', difficulty: 'App', links: [
    { label: 'Design', url: 'https://www.youtube.com/watch?v=Tp8kpMe-ZKw', platform: 'YT' }] },
  { id: 9, name: 'Banking System', category: 'OOP Full App', insight: 'Account, Transaction, Customer, Branch', difficulty: 'App', links: [
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/design-online-banking-system/', platform: 'GFG' }] },
  { id: 10, name: 'Mail Server', category: 'OOP Full App', insight: 'User, Mailbox, Email, Folder', difficulty: 'App' },
  { id: 11, name: 'Railway Reservation', category: 'OOP Full App', insight: 'Train, Seat, Booking, Passenger, Route', difficulty: 'App', links: [
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/design-a-movie-ticket-booking-system/', platform: 'GFG' }] },
  { id: 12, name: 'Online Voting System', category: 'OOP Full App', insight: 'Voter, Candidate, Election, Ballot', difficulty: 'App' },
];

export const ROUND4_QUESTIONS: ZohoProblem[] = [
  { id: 1, name: 'Inheritance vs Composition', category: 'OOP Theory', insight: 'Favour composition over inheritance — when and why', difficulty: 'Theory', links: [
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/difference-between-inheritance-and-composition-in-java/', platform: 'GFG' }] },
  { id: 2, name: 'Polymorphism types', category: 'OOP Theory', insight: 'Compile-time (overloading) vs runtime (overriding)', difficulty: 'Theory', links: [
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/polymorphism-in-java/', platform: 'GFG' }] },
  { id: 3, name: 'SOLID Principles (all 5)', category: 'OOP Theory', insight: 'SRP — one reason to change. OCP — open/closed', difficulty: 'Theory', links: [
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/solid-principle-in-programming-understand-with-real-life-examples/', platform: 'GFG' },
    { label: 'Concept', url: 'https://www.youtube.com/watch?v=_jDNAf3CzeY', platform: 'YT' }] },
  { id: 4, name: 'Thread-safe Singleton', category: 'Java Internals', insight: 'Double-checked locking + volatile', difficulty: 'Theory', links: [
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/java-singleton-design-pattern-practices-examples/', platform: 'GFG' },
    { label: 'Refactoring Guru', url: 'https://refactoring.guru/design-patterns/singleton', platform: 'Other' }] },
  { id: 5, name: 'HashMap internals (Java 8)', category: 'Java Internals', insight: 'Array + LinkedList → TreeNode when bucket > 8', difficulty: 'Theory', links: [
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/internal-working-of-hashmap-java/', platform: 'GFG' }] },
  { id: 6, name: 'Process vs Thread', category: 'OS', insight: 'PCB, context switch cost, shared memory, race condition', difficulty: 'Theory', links: [
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/difference-between-process-and-thread/', platform: 'GFG' }] },
  { id: 7, name: 'Deadlock — 4 conditions', category: 'OS', insight: 'Mutual Excl, Hold&Wait, No Preemption, Circular Wait', difficulty: 'Theory', links: [
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/introduction-of-deadlock-in-operating-system/', platform: 'GFG' }] },
  { id: 8, name: 'Virtual Memory + Page Fault', category: 'OS', insight: 'TLB miss → page table → disk fetch. Thrashing.', difficulty: 'Theory', links: [
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/virtual-memory-in-operating-system/', platform: 'GFG' }] },
  { id: 9, name: 'ACID properties', category: 'DBMS', insight: 'Atomicity=undo log, Durability=WAL', difficulty: 'Theory', links: [
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/acid-properties-in-dbms/', platform: 'GFG' }] },
  { id: 10, name: 'Indexing — B+ Tree', category: 'DBMS', insight: 'Clustered vs non-clustered. Index slows writes.', difficulty: 'Theory', links: [
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/indexing-in-databases-set-1/', platform: 'GFG' }] },
  { id: 11, name: 'SQL: 2nd highest salary', category: 'SQL', insight: 'RANK() OVER (PARTITION BY dept ORDER BY salary DESC)', difficulty: 'Theory', links: [
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/sql-query-to-find-second-largest-salary/', platform: 'GFG' },
    { label: 'LC 176', url: 'https://leetcode.com/problems/second-highest-salary/', platform: 'LC' }] },
  { id: 12, name: '@Transactional self-invocation', category: 'Spring Boot', insight: 'AOP proxy not used on internal calls. Fix: inject self', difficulty: 'Theory', links: [
    { label: 'Article', url: 'https://www.baeldung.com/spring-transactional-propagation-isolation', platform: 'Other' }] },
  { id: 13, name: 'Apache Fineract SQL Injection', category: 'Project', insight: 'PreparedStatement vs Statement, OWASP Top 10', difficulty: 'Theory', links: [
    { label: 'OWASP', url: 'https://owasp.org/www-community/attacks/SQL_Injection', platform: 'Other' },
    { label: 'GFG', url: 'https://www.geeksforgeeks.org/sql-injection/', platform: 'GFG' }] },
  { id: 14, name: 'Explain MSL project (3 min)', category: 'Project', insight: 'Context → problem → solution → impact', difficulty: 'Theory' },
  { id: 15, name: 'Live DSA question (approach)', category: 'DSA', insight: 'Explain approach, not full code. Speak first.', difficulty: 'Theory' },
];

export const ROUND5_QUESTIONS: ZohoProblem[] = [
  { id: 1, name: 'Tell me about yourself', category: 'HR', insight: '2 min max. Journey → Fineract → why Zoho. Not resume recitation.', difficulty: 'Theory' },
  { id: 2, name: 'Why Zoho specifically?', category: 'HR', insight: 'Bootstrapped, long-term, Tamil Nadu roots, no VC pressure', difficulty: 'Theory' },
  { id: 3, name: 'What happened at previous company?', category: 'HR', insight: 'Honest, forward-looking. Layoff → clarity → upskilling → Zoho', difficulty: 'Theory' },
  { id: 4, name: 'Where in 5 years?', category: 'HR', insight: 'Staff engineer, distributed systems, owning a product area', difficulty: 'Theory' },
  { id: 5, name: 'Higher studies interest?', category: 'HR', insight: 'Zoho checks attrition risk. "I want to grow in-role."', difficulty: 'Theory' },
  { id: 6, name: 'Salary expectations?', category: 'HR', insight: 'Zoho SDE: 8–14 LPA for 1 YOE Chennai', difficulty: 'Theory' },
  { id: 7, name: 'Handling pressure?', category: 'HR', insight: 'STAR format. Vee Technologies night + software day story', difficulty: 'Theory' },
  { id: 8, name: 'What do you know about Zoho?', category: 'HR', insight: 'Founded 1996, Sridhar Vembu, 55+ products, bootstrapped', difficulty: 'Theory' },
];

export interface DayPlan {
  day: number;
  topic: string;
  problems: string;
  video: string;
  goal: string;
  type: 'dsa' | 'revision' | 'oop' | 'theory';
}

export const THIRTY_DAY_PLAN: DayPlan[] = [
  { day: 1, topic: 'Arrays + Running State', problems: 'Two Sum, Best Time Stock, Contains Dup, Find Missing Number, Move Zeroes', video: 'Striver Array Series', goal: "Kadane's + running min/max pattern. Solve 5.", type: 'dsa' },
  { day: 2, topic: 'Arrays II + Dutch Flag', problems: 'Sort 0s1s2s, Max Subarray, Max Product, Rotate Array, Merge', video: 'Striver Array Series', goal: 'Dutch Flag 3-pointer. Reversal trick.', type: 'dsa' },
  { day: 3, topic: 'Two Pointers + Sliding Window', problems: 'Trapping Rain Water, Container, 3Sum, Max Consecutive Ones', video: 'Aditya Verma Sliding Window', goal: 'Trapping Rain Water cold.', type: 'dsa' },
  { day: 4, topic: 'Strings + Hashing I', problems: 'Valid Anagram, Isomorphic, Group Anagrams, Reverse Words', video: 'Striver String Series', goal: 'Two-HashMap isomorphic pattern.', type: 'dsa' },
  { day: 5, topic: 'Strings + Hashing II', problems: 'Longest Substr, Longest Palindromic, Roman to Int, Permutations', video: 'Striver String Series', goal: 'Palindrome expand-around-centre.', type: 'dsa' },
  { day: 6, topic: 'Binary Search + pow(x,n)', problems: 'Binary Search, Search Rotated, Find Min, Allocate Pages, pow(x,n)', video: 'Striver BS Series', goal: 'BS on answer space.', type: 'dsa' },
  { day: 7, topic: 'REVISION MOCK', problems: 'Pick 6 from Days 1–6. 20-min timer. No hints.', video: 'NeetCode if stuck', goal: 'Track weak patterns.', type: 'revision' },
  { day: 8, topic: 'Sorting Internals', problems: 'QuickSort, MergeSort, Kth Largest (QuickSelect), Merge Intervals', video: 'Striver A2Z Sorting', goal: 'QuickSort partition from memory.', type: 'dsa' },
  { day: 9, topic: 'Stack + Monotonic Stack', problems: 'Balanced Parens, Min Stack, Stock Span, Daily Temps, Largest Rect', video: 'Aditya Verma Stack', goal: 'Histogram O(n) trick.', type: 'dsa' },
  { day: 10, topic: 'Linked List I', problems: 'Reverse LL, Merge Sorted, Detect Cycle, Middle LL, Palindrome LL', video: 'Striver LL Series', goal: "Floyd's proof. Reverse trace.", type: 'dsa' },
  { day: 11, topic: 'Linked List II + LRU', problems: 'Add Two Numbers, Remove Nth, Reorder, Copy Random, LRU Cache', video: 'Striver LL Series', goal: 'LRU from scratch.', type: 'dsa' },
  { day: 12, topic: 'Recursion + Backtracking', problems: 'Subsets, Permutations, Combination Sum, N-Queens, Word Search', video: 'Striver Recursion', goal: 'Choose/explore/unchoose.', type: 'dsa' },
  { day: 13, topic: 'Trees I', problems: 'Height BT, Invert, Symmetric, Level Order, Diameter, Boundary', video: 'Striver Tree Series', goal: 'Boundary traversal 3 passes.', type: 'dsa' },
  { day: 14, topic: 'REVISION MOCK', problems: '6 random from Days 8–13. 20-min timer.', video: 'None', goal: 'Simulate R2: 6 problems, 90 min.', type: 'revision' },
  { day: 15, topic: 'Trees II — BST', problems: 'Validate BST, Kth Smallest, BST Iterator, LCA BST, Recover BST', video: 'Striver BST', goal: 'Validate BST: min/max bounds.', type: 'dsa' },
  { day: 16, topic: 'Trees III — Hard', problems: 'Max Path Sum, Serialize/Deserialize, Construct from Pre+In, Flatten', video: 'Striver Tree Series', goal: 'Max path sum: return vs track.', type: 'dsa' },
  { day: 17, topic: 'Heaps', problems: 'Kth Largest, Top K Freq, K Closest, Task Scheduler, Median Stream', video: 'Aditya Verma Heap', goal: 'Two-heap median trick.', type: 'dsa' },
  { day: 18, topic: 'Graphs I — BFS/DFS', problems: 'Islands, Rotting Oranges, Clone Graph, Cycle Detect, Bipartite', video: 'Striver Graph Series', goal: 'Multi-source BFS.', type: 'dsa' },
  { day: 19, topic: 'Graphs II — Topo Sort', problems: 'Course Schedule I & II, DFS Graph, Unique Rows', video: 'Striver Graph Series', goal: "Kahn's BFS topo sort.", type: 'dsa' },
  { day: 20, topic: 'DP 1D', problems: 'Climbing Stairs, House Robber, Coin Change, LIS, Jump Game, Subset Sum', video: 'Striver DP Series', goal: 'LIS O(n²) DP correctly.', type: 'dsa' },
  { day: 21, topic: 'MOCK — Full R2', problems: '6 problems, 90 min, HackerRank style. 2E + 3M + 1H.', video: 'None', goal: 'Exact Round 2 format.', type: 'revision' },
  { day: 22, topic: 'DP 2D + Knapsack', problems: 'Unique Paths, LCS, 0/1 Knapsack, Partition Equal, Target Sum', video: 'Striver DP 2D', goal: 'Knapsack loop direction.', type: 'dsa' },
  { day: 23, topic: 'Greedy', problems: 'Jump Game, Gas Station, Non-overlapping, Meeting Rooms II, Stock', video: 'Striver Greedy', goal: 'Exchange argument proof.', type: 'dsa' },
  { day: 24, topic: 'OOP — Core Principles', problems: 'Singleton (DCL+volatile), Factory, Observer Pattern in Java', video: 'Refactoring Guru', goal: 'Code all 3 from scratch.', type: 'oop' },
  { day: 25, topic: 'ROUND 3 APP 1', problems: 'Transaction Manager: Set/Get/Unset/Count/Begin/Commit/Rollback', video: 'Think, design, code', goal: 'Stack of HashMap snapshots.', type: 'oop' },
  { day: 26, topic: 'ROUND 3 APP 2', problems: 'LRU Cache + LFU Cache from scratch in Java', video: 'Think, design, code', goal: 'LFU: 3 HashMaps. Time them.', type: 'oop' },
  { day: 27, topic: 'ROUND 3 APP 3', problems: 'Parking Lot OR Library Management with OOP', video: 'Think, design, code', goal: 'Explain while coding.', type: 'oop' },
  { day: 28, topic: 'CS Fundamentals (R4)', problems: 'OS, DBMS, SQL, Java internals, @Transactional', video: 'GFG articles', goal: 'Answer without notes.', type: 'theory' },
  { day: 29, topic: 'FULL MOCK — R2 + R3', problems: 'R2: 6 problems 90 min. R3: Full app 2 hours.', video: 'None', goal: 'Back to back simulation.', type: 'revision' },
  { day: 30, topic: 'WEAK SPOTS ONLY', problems: 'Re-solve 5 wrong problems. No new topics.', video: 'Striver/NeetCode', goal: 'Consolidate. Clean gaps.', type: 'revision' },
];

export const FINERACT_NARRATIVE = [
  "1. Context: 'Apache Fineract is an open-source core banking platform used in production fintech globally.'",
  "2. Problem: 'I identified an unparameterised SQL query in the lending engine — a direct SQL injection vulnerability.'",
  "3. Fix: 'Replaced Statement with PreparedStatement. The query input is now parameterised — never concatenated.'",
  "4. Impact: 'Patched in production banking software. Follows OWASP Top 10 — Injection is #1.'",
  "5. Learning: 'No user input should ever be concatenated into SQL. Always parameterise, always validate.'",
];

export const LAYOFF_NARRATIVE = [
  "'Muthu Soft Labs restructured in early 2025. It was unexpected but gave me clarity on what I actually want — a product engineering environment where I build things that matter at scale.'",
  "'I used that period deliberately: I patched a critical SQL injection vulnerability in Apache Fineract, a real production fintech platform. I kept coding every day. I didn't pause.'",
  "'I'm not here because I need any job. I'm here because Zoho builds real products, is bootstrapped, and rewards engineers who think long-term. That's exactly the environment I want to grow in.'",
];

export const ROUND2_RULES = [
  'State TC/SC after every problem — even easy ones. Zoho interviewers explicitly look for this.',
  "For unsolved: write brute force first, then say 'the optimal uses X pattern because Y'.",
  'LRU Cache appears in Round 2 as coding AND in Round 3 as application. Know it cold.',
  'BST Validation — use min/max bounds, NOT just parent comparison. Known trap.',
  "Dutch Flag — they test if you know WHY it's O(n) single-pass vs naive O(n²).",
];

export const ROUND3_FRAMEWORK = [
  "Step 1 (first 5 min — BEFORE keyboard): Clarify requirements out loud. Ask edge cases.",
  "Step 2: Identify entities (nouns → classes) and operations (verbs → methods). Write class names first.",
  "Step 3: Start with core data structures. DON'T over-engineer. Get it working, then optimize.",
  "Step 4: TALK constantly. Explain every decision: 'I'm using a HashMap here because...'",
  "Step 5: When it works, immediately say 'I can optimize X by doing Y' — show you think ahead.",
];
