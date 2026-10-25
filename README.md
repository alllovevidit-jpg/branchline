# Branchline — Interactive Git Internals & DAG Visualizer

**Branchline** is an interactive developer tool built from scratch in React and JavaScript that visualizes how Git works under the hood as a **Directed Acyclic Graph (DAG)**.

Instead of treating Git commands as black-box terminal magic, Branchline exposes commit objects, branch pointers, `HEAD` states, Lowest Common Ancestor (LCA) graph traversal, 3-way merge conflict resolution, and rebase commit cloning in real time.

## Key Engineering Highlights

- **In-Memory Git DAG Engine (`src/engine/gitEngine.js`):** Pure JavaScript implementation of content-addressable commit nodes, parent pointers, attached/detached `HEAD` refs, and working-tree snapshots.
- **Lowest Common Ancestor (LCA) via BFS:** Traverses ancestor paths across divergent branches to automatically identify the exact `Merge Base` commit before executing fast-forward or 3-way merges.
- **Interactive 3-Way Merge Conflict Resolver:** Compares file snapshots across `Base (LCA)`, `Ours (Current)`, and `Theirs (Incoming)` to trigger and resolve real merge conflicts in the UI.
- **Rebase & Ghost Node Visualization:** Visually demonstrates why `git rebase` rewrites history by cloning commits onto a new base while preserving the original orphaned commits as faded ghost nodes.
- **Topological Swimlane Layout (`src/engine/dagLayout.js`):** Computes deterministic `(x, y)` SVG coordinates and cubic Bezier curves with zero overlapping nodes.

## Supported Commands

Use the **1-Click Quick Operations Deck** or type directly into the integrated **git-sh interactive shell**:

- `git commit -m "feat: add caching layer"`
- `git checkout -b feat/payment`
- `git checkout main`
- `git merge feat/payment`
- `git rebase main`
- `git reset --hard HEAD~1`

## Tech Stack
- **Frontend:** React, Vite, Lucide Icons
- **Graph Rendering:** Custom SVG Cubic Bezier Engine + Topological Depth Sort
- **Styling:** Custom Obsidian Dark CSS Grid Design System (`Inter` + `JetBrains Mono`)