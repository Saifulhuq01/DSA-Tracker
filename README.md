# DSA Progress Tracker

A high-performance, local-first DSA (Data Structures & Algorithms) progress tracking application built with Next.js, React, and TypeScript. Designed for interview preparation targeting Zoho, Freshworks, Chargebee, and Razorpay.

![DSA Tracker](https://img.shields.io/badge/Problems-175-purple) ![Topics](https://img.shields.io/badge/Topics-15-blue) ![Status](https://img.shields.io/badge/Status-Active-green)

## Features

### Core Tracking
- **175 Problems** across **15 Topics** (43 Easy, 95 Medium, 37 Hard)
- **Status FSM**: `[ ] Not Started` → `[~] Attempted` → `[✓] Solved` → `[R] Revise`
- **Auto Date Stamping**: Automatically records solve date
- **Notes Per Problem**: Track approaches, patterns, and reminders
- **Key Concepts**: 5 deep-internal concepts per topic

### Smart Features
- **Foundation Gate**: Topics 13+ (DP) locked until 80% of Topics 1-7 are solved
- **12-Week Activity Heatmap**: GitHub-style contribution visualization
- **Streak Tracking**: Current streak, personal best, total active days
- **12-Tier Achievement System**: Unlock badges from "First Blood" to "Completionist"
- **Print-Ready**: Landscape layout optimized for printing

### Cloud Sync (Optional)
- **Google Sign-In** via Firebase Authentication
- **Firestore Cloud Sync**: Real-time data synchronization across devices
- **Local-First**: Works fully offline with localStorage — cloud sync is optional

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: CSS + Tailwind CSS
- **Auth**: Firebase Authentication (Google)
- **Database**: Firestore (cloud) + localStorage (local)
- **Fonts**: Geist Sans & Geist Mono

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Cloud Sync Setup (Optional)

The app works fully in local-only mode. To enable Google Sign-In and cloud sync:

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Google Authentication** in Firebase Auth
3. Create a **Firestore Database**
4. Copy your Firebase config values
5. Create `.env.local` from the template:

```bash
cp .env.local.example .env.local
```

6. Fill in your Firebase credentials in `.env.local`

## Project Structure

```
src/
├── app/
│   ├── globals.css          # Design system & theme
│   ├── layout.tsx           # Root layout with AuthProvider
│   └── page.tsx             # Main tracker page
├── context/
│   └── AuthContext.tsx       # Firebase Auth context
├── data/
│   └── topics.ts            # 15 topics, 175 problems dataset
├── hooks/
│   └── useTrackerState.ts   # State management + Firestore sync
└── lib/
    └── firebase.ts          # Firebase initialization
```

## Topics Covered

| # | Topic | Problems |
|---|-------|----------|
| 1 | Arrays & Two Pointers & Sliding Window | 15 |
| 2 | Strings & Hashing | 13 |
| 3 | Binary Search | 11 |
| 4 | Sorting Algorithms — Internals | 10 |
| 5 | Recursion & Backtracking | 13 |
| 6 | Linked List | 13 |
| 7 | Stack & Queue (Monotonic Stack) | 12 |
| 8 | Binary Trees | 13 |
| 9 | Binary Search Trees (BST) | 11 |
| 10 | Heaps & Priority Queue | 10 |
| 11 | Graphs — BFS & DFS | 12 |
| 12 | Graphs — Weighted (Dijkstra, MST) | 7 |
| 13 | Dynamic Programming — 1D | 12 |
| 14 | Dynamic Programming — 2D & Interval | 12 |
| 15 | Greedy Algorithms | 11 |

## Author

**Mohammed Saifulhuq** — Zoho & Product Company Prep

## License

MIT
