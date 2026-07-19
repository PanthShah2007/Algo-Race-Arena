# 🏁 Algorithm Race Arena

**Watch classic algorithms race head-to-head — animated, timed, and explained.**

Ten algorithm rivalries, run side by side in real time. Every comparison, every swap, every step is visualized live, backed by real measured execution time and real operation counts — not fake numbers.

**🔗 Live site:** [panthshah2007.github.io/Algo-Race-Arena](https://panthshah2007.github.io/Algo-Race-Arena/)

---

## What it does

Pick a matchup, hit **Start Race**, and watch two algorithms solve the exact same problem side by side. Each race page includes:

- **Live animation** — canvas-based visualization of every algorithm step
- **Real stats** — comparisons/operations are actually counted during execution, time is measured with `performance.now()`, and memory is estimated from each algorithm's stated space complexity
- **Plain-English explanations** — how each algorithm works, step by step
- **Complexity graph** — growth curves generated directly from each algorithm's real Big-O, so the chart always matches the complexity table
- **Reference C++ code** for both competitors
- **Light/dark theme toggle**

## The 10 races

| Category | Matchup |
|---|---|
| Pathfinding | Dijkstra vs A* |
| Graph Traversal | BFS vs DFS |
| Sorting | Merge Sort vs Quick Sort |
| Minimum Spanning Tree | Prim vs Kruskal |
| Sorting Basics | Bubble Sort vs Selection Sort |
| Searching | Linear Search vs Binary Search |
| Sorting — Advanced vs Simple | Heap Sort vs Insertion Sort |
| Shortest Path | Bellman-Ford vs Dijkstra |
| Constraint Solving | N-Queens: Backtracking vs Brute Force |
| Optimization | 0/1 Knapsack: DP vs Greedy |

## Tech stack

- Vanilla HTML / CSS / JavaScript — no build step, no framework
- [Chart.js](https://www.chartjs.org/) for the complexity growth charts
- Canvas API for all race animations

## Project structure

```
Algo-Race-Arena/
├── index.html            # landing page
├── race.html             # race template, driven by ?id=<race-id>
├── style.css              # design tokens + base styles
├── landing.css             # landing page styles
├── race.css                # race page styles
├── theme.js               # light/dark theme toggle
├── hero-graph.js           # landing page ambient animation
├── algorithms-data.js       # descriptions, complexity, code for all 10 races
├── visualizer.js            # instrumented algorithm engine + canvas renderers
├── race.js                  # race page controller (playback, stats, charts)
└── .nojekyll
```

Everything is intentionally flat (no subfolders) so it deploys cleanly via GitHub Pages with zero path issues.

## Running locally

No build tools needed — just serve the folder:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`. (Opening `index.html` directly via `file://` mostly works too, but some browsers restrict fonts/clipboard on `file://`, so a local server is recommended.)

## Deploying

This repo is deployed with **GitHub Pages** directly from the `main` branch root — no build step required.

## Author

**Panth Shah**
B.Tech Electronics & Communication Engineering, Nirma University

- LinkedIn: [linkedin.com/in/panth-shah-445144389](https://www.linkedin.com/in/panth-shah-445144389)
- GitHub: [github.com/PanthShah2007](https://github.com/PanthShah2007)
- Email: panthshah2007@gmail.com
