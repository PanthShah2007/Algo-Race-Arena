/* ==========================================================
   ARENA_DATA — single source of truth for all 10 matchups.
   type drives which visual engine (visualizer.js) is used:
     'sort'        -> array bar race
     'search'      -> array pointer race
     'graph-path'  -> grid shortest-path race
     'graph-mst'   -> weighted graph MST race
     'backtrack'   -> N-Queens board race
     'dp-greedy'   -> knapsack table vs greedy bar race
   ========================================================== */

const ARENA_DATA = [

// ---------------------------------------------------------------- 1
{
  id: 'dijkstra-astar',
  category: 'Pathfinding',
  type: 'graph-path',
  variant: 'astar',
  tagline: "Both guarantee the shortest path. Only one bothers to look where it's going.",
  racerA: {
    name: 'Dijkstra', short: 'DIJKSTRA',
    description: `Dijkstra's algorithm finds the shortest path from a single source to every other node by always expanding the closest unvisited node first. It has no idea where the destination is — it explores uniformly outward in every direction, like ripples spreading from a stone dropped in water, until it happens to reach the target.`,
    steps: [
      'Set distance to the start node as 0, and infinity for every other node.',
      'Pick the unvisited node with the smallest known distance (a priority queue does this in log time).',
      "Relax every neighbor: if start→current→neighbor is shorter than the best known start→neighbor, update it.",
      'Mark the current node visited so it is never re-processed.',
      'Repeat until the target is popped from the queue, or the queue is empty.'
    ],
    complexity: { best: 'O((V+E) log V)', avg: 'O((V+E) log V)', worst: 'O((V+E) log V)', space: 'O(V)' },
    bestFor: 'Road networks and routing where you need shortest paths to many or all destinations, not just one — e.g. GPS backends, network routing tables.',
    code: `#include <vector>
#include <queue>
using namespace std;

typedef pair<int,int> pii; // {distance, node}

vector<int> dijkstra(int src, int n, vector<vector<pii>>& adj){
    vector<int> dist(n, INT_MAX);
    priority_queue<pii, vector<pii>, greater<pii>> pq;
    dist[src] = 0;
    pq.push({0, src});

    while(!pq.empty()){
        auto [d, u] = pq.top(); pq.pop();
        if(d > dist[u]) continue;       // stale entry, skip

        for(auto [v, w] : adj[u]){
            if(dist[u] + w < dist[v]){
                dist[v] = dist[u] + w;
                pq.push({dist[v], v});
            }
        }
    }
    return dist;
}`
  },
  racerB: {
    name: 'A* Search', short: 'A*',
    description: `A* is Dijkstra with a compass. It adds a heuristic — an estimate of remaining distance to the goal (e.g. straight-line distance on a grid) — and always expands the node that looks most promising: real cost so far, plus estimated cost to go. When the heuristic never overestimates ("admissible"), A* still guarantees the shortest path, but explores far fewer nodes.`,
    steps: [
      'Set g(start) = 0, and f(start) = g(start) + h(start), where h is the heuristic estimate to the goal.',
      'Pick the unvisited node with the lowest f-score from the priority queue.',
      'If it is the goal, stop — the path is found.',
      'Otherwise relax neighbors using g only, but queue them by f = g + h.',
      'Repeat. Nodes far from the goal, in the wrong direction, are rarely even touched.'
    ],
    complexity: { best: 'O(E)', avg: 'O(E) with a good heuristic', worst: 'O((V+E) log V)', space: 'O(V)' },
    bestFor: 'Single source-to-single-destination pathfinding where a good heuristic exists — video game NPC navigation, robotics, puzzle solvers.',
    code: `#include <vector>
#include <queue>
#include <cmath>
using namespace std;

typedef pair<int,int> pii;

double heuristic(Point a, Point b){          // straight-line estimate
    return hypot(a.x - b.x, a.y - b.y);
}

vector<int> aStar(int src, int goal, int n,
                   vector<vector<pii>>& adj, vector<Point>& pos){
    vector<double> g(n, INT_MAX), f(n, INT_MAX);
    priority_queue<pair<double,int>, vector<pair<double,int>>,
                   greater<pair<double,int>>> open;
    g[src] = 0; f[src] = heuristic(pos[src], pos[goal]);
    open.push({f[src], src});

    while(!open.empty()){
        auto [fu, u] = open.top(); open.pop();
        if(u == goal) break;               // goal reached — stop early
        if(fu > f[u]) continue;

        for(auto [v, w] : adj[u]){
            double tentative = g[u] + w;
            if(tentative < g[v]){
                g[v] = tentative;
                f[v] = tentative + heuristic(pos[v], pos[goal]);
                open.push({f[v], v});
            }
        }
    }
    return {}; // reconstruct path from parent[] in real use
}`
  },
  chart: {
    basis: "avg",
    formulaA: "ve_sum_logv",
    formulaB: "linear_E",
    scale: "large",
    note: null
  }
},

// ---------------------------------------------------------------- 2
{
  id: 'bfs-dfs',
  category: 'Graph Traversal',
  type: 'graph-path',
  variant: 'bfsdfs',
  tagline: 'One spreads wide like a flood. The other dives deep like a tunnel.',
  racerA: {
    name: 'Breadth-First Search', short: 'BFS',
    description: `BFS explores a graph level by level using a queue: it visits every neighbor of the start node before moving on to their neighbors. This "wavefront" behaviour means BFS always finds the shortest path in terms of number of edges (unweighted graphs) — it's guaranteed to reach a node in the fewest possible hops.`,
    steps: [
      'Push the start node into a queue and mark it visited.',
      'Pop the front of the queue, and look at all its unvisited neighbors.',
      'Mark each neighbor visited and push it to the back of the queue.',
      'Repeat until the queue is empty — nodes are visited in increasing distance order.'
    ],
    complexity: { best: 'O(V+E)', avg: 'O(V+E)', worst: 'O(V+E)', space: 'O(V)' },
    bestFor: 'Shortest path in unweighted graphs, level-order traversal, finding connected components, and "minimum moves" puzzle problems.',
    code: `#include <vector>
#include <queue>
using namespace std;

vector<int> bfs(int src, int n, vector<vector<int>>& adj){
    vector<int> dist(n, -1);
    queue<int> q;
    dist[src] = 0;
    q.push(src);

    while(!q.empty()){
        int u = q.front(); q.pop();
        for(int v : adj[u]){
            if(dist[v] == -1){
                dist[v] = dist[u] + 1;
                q.push(v);
            }
        }
    }
    return dist;
}`
  },
  racerB: {
    name: 'Depth-First Search', short: 'DFS',
    description: `DFS commits to one path and follows it as far as it can go, using a stack (explicit or via recursion). Only when it hits a dead end does it backtrack and try another branch. It doesn't find shortest paths, but it's the natural tool for exploring structure — cycles, connectivity, topological order.`,
    steps: [
      'Mark the start node visited and push it onto the stack.',
      'Look at the top of the stack; move to any unvisited neighbor and mark it visited.',
      'If there is no unvisited neighbor, pop the stack (backtrack).',
      'Repeat until the stack is empty — every reachable node has been visited exactly once.'
    ],
    complexity: { best: 'O(V+E)', avg: 'O(V+E)', worst: 'O(V+E)', space: 'O(V)' },
    bestFor: 'Cycle detection, topological sorting, maze generation, connected components, and backtracking-style search.',
    code: `#include <vector>
using namespace std;

void dfs(int u, vector<vector<int>>& adj, vector<bool>& visited,
          vector<int>& order){
    visited[u] = true;
    order.push_back(u);
    for(int v : adj[u]){
        if(!visited[v]) dfs(v, adj, visited, order);
    }
}

vector<int> runDFS(int src, int n, vector<vector<int>>& adj){
    vector<bool> visited(n, false);
    vector<int> order;
    dfs(src, adj, visited, order);
    return order;
}`
  },
  chart: {
    basis: "worst",
    formulaA: "ve_sum",
    formulaB: "ve_sum",
    scale: "large",
    note: "Both are O(V+E) — identical growth class. BFS and DFS differ in path quality, not raw speed."
  }
},

// ---------------------------------------------------------------- 3
{
  id: 'merge-quick',
  category: 'Sorting',
  type: 'sort',
  variant: 'mergequick',
  tagline: 'Guaranteed steady pace vs. blistering average speed with an occasional stumble.',
  racerA: {
    name: 'Merge Sort', short: 'MERGE SORT',
    description: `Merge Sort is a "divide and conquer" algorithm: it splits the array in half recursively until each piece has one element, then merges pairs of sorted pieces back together in order. Because the split is always exactly in half, its performance never degrades — it's O(n log n) no matter what the input looks like.`,
    steps: [
      'If the array has 1 element, it is already sorted — stop.',
      'Split the array into two halves.',
      'Recursively merge-sort the left half and the right half.',
      'Merge the two sorted halves into one sorted array by comparing front elements.'
    ],
    complexity: { best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)' },
    bestFor: 'Linked lists, external sorting (data too big for memory), and any situation where stable, predictable worst-case performance matters more than raw average speed.',
    code: `#include <vector>
using namespace std;

void merge(vector<int>& a, int l, int m, int r){
    vector<int> left(a.begin()+l, a.begin()+m+1);
    vector<int> right(a.begin()+m+1, a.begin()+r+1);
    int i=0, j=0, k=l;
    while(i<left.size() && j<right.size())
        a[k++] = (left[i] <= right[j]) ? left[i++] : right[j++];
    while(i<left.size()) a[k++] = left[i++];
    while(j<right.size()) a[k++] = right[j++];
}

void mergeSort(vector<int>& a, int l, int r){
    if(l >= r) return;
    int m = l + (r-l)/2;
    mergeSort(a, l, m);
    mergeSort(a, m+1, r);
    merge(a, l, m, r);
}`
  },
  racerB: {
    name: 'Quick Sort', short: 'QUICK SORT',
    description: `Quick Sort also divides and conquers, but differently: it picks a "pivot", partitions the array so smaller elements land left and larger ones land right, then recursively sorts each side. No merging step is needed — partitioning does the work in place. With a good pivot choice it's typically the fastest general-purpose sort in practice, but a bad pivot (e.g. already-sorted input with a naive pivot) degrades it to O(n²).`,
    steps: [
      'Pick a pivot element (commonly the last, first, or a random element).',
      'Partition: rearrange the array so elements less than the pivot come before it, greater ones come after.',
      'The pivot is now in its final sorted position.',
      'Recursively quick-sort the sub-array left of the pivot, and the sub-array right of it.'
    ],
    complexity: { best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n²)', space: 'O(log n)' },
    bestFor: 'General-purpose in-memory sorting where average-case speed and low memory overhead matter — most standard library sorts use a Quick Sort variant.',
    code: `#include <vector>
using namespace std;

int partition(vector<int>& a, int lo, int hi){
    int pivot = a[hi];
    int i = lo - 1;
    for(int j = lo; j < hi; j++){
        if(a[j] < pivot) swap(a[++i], a[j]);
    }
    swap(a[i+1], a[hi]);
    return i + 1;
}

void quickSort(vector<int>& a, int lo, int hi){
    if(lo >= hi) return;
    int p = partition(a, lo, hi);
    quickSort(a, lo, p-1);
    quickSort(a, p+1, hi);
}`
  },
  chart: {
    basis: "worst",
    formulaA: "nlogn",
    formulaB: "quadratic",
    scale: "large",
    note: "Shown at worst case — the one place Quick Sort can degrade while Merge Sort never does."
  }
},

// ---------------------------------------------------------------- 4
{
  id: 'prim-kruskal',
  category: 'Minimum Spanning Tree',
  type: 'graph-mst',
  variant: 'primkruskal',
  tagline: 'Grow a tree from one root, or grab the cheapest edges from anywhere on the map.',
  racerA: {
    name: "Prim's Algorithm", short: 'PRIM',
    description: `Prim's algorithm grows a single tree outward from an arbitrary start node. At every step it adds the cheapest edge that connects the current tree to a node outside it — like a colony expanding by always annexing its nearest neighbour. It never has two disconnected pieces at once.`,
    steps: [
      'Start with any single node as the initial (trivial) tree.',
      'Look at every edge leaving the current tree to an outside node.',
      'Add the cheapest such edge, pulling that node into the tree.',
      'Repeat until every node is included — the tree now has exactly V−1 edges.'
    ],
    complexity: { best: 'O(E log V)', avg: 'O(E log V)', worst: 'O(E log V)', space: 'O(V)' },
    bestFor: 'Dense graphs, and situations where the graph is given as an adjacency matrix — Prim with a Fibonacci heap or dense-matrix scan is very efficient there.',
    code: `#include <vector>
#include <queue>
using namespace std;
typedef pair<int,int> pii;

int primMST(int n, vector<vector<pii>>& adj){
    vector<bool> inMST(n, false);
    priority_queue<pii, vector<pii>, greater<pii>> pq;
    pq.push({0, 0});           // {weight, node} — start at node 0
    int totalWeight = 0;

    while(!pq.empty()){
        auto [w, u] = pq.top(); pq.pop();
        if(inMST[u]) continue;
        inMST[u] = true;
        totalWeight += w;

        for(auto [v, wt] : adj[u]){
            if(!inMST[v]) pq.push({wt, v});
        }
    }
    return totalWeight;
}`
  },
  racerB: {
    name: "Kruskal's Algorithm", short: 'KRUSKAL',
    description: `Kruskal's algorithm ignores structure entirely at first: it sorts every edge in the whole graph by weight, then greedily adds the cheapest edge as long as it doesn't form a cycle (checked with a Union-Find / Disjoint Set structure). Several disconnected fragments can exist mid-run — they only merge into one tree near the end.`,
    steps: [
      'Sort all edges in the graph by ascending weight.',
      'Initialise each node as its own separate set (Union-Find).',
      "For each edge in sorted order, add it if its two endpoints are in different sets (no cycle formed).",
      'Union the two sets. Stop once V−1 edges have been added.'
    ],
    complexity: { best: 'O(E log E)', avg: 'O(E log E)', worst: 'O(E log E)', space: 'O(V)' },
    bestFor: 'Sparse graphs and edge-list representations — since Kruskal only needs to sort edges once, it scales beautifully when E is much smaller than V².',
    code: `#include <vector>
#include <algorithm>
using namespace std;

struct Edge{ int u, v, w; };

struct DSU{
    vector<int> parent;
    DSU(int n){ parent.resize(n); iota(parent.begin(), parent.end(), 0); }
    int find(int x){ return parent[x]==x ? x : parent[x]=find(parent[x]); }
    bool unite(int a, int b){
        a = find(a); b = find(b);
        if(a==b) return false;
        parent[a] = b;
        return true;
    }
};

int kruskalMST(int n, vector<Edge>& edges){
    sort(edges.begin(), edges.end(), [](Edge&a, Edge&b){ return a.w < b.w; });
    DSU dsu(n);
    int totalWeight = 0, used = 0;

    for(auto& e : edges){
        if(dsu.unite(e.u, e.v)){
            totalWeight += e.w;
            if(++used == n-1) break;
        }
    }
    return totalWeight;
}`
  },
  chart: {
    basis: "worst",
    formulaA: "elogv",
    formulaB: "elogv",
    scale: "large",
    note: "Both run in O(E log V) for typical sparse graphs — asymptotically equivalent; the difference is implementation style, not speed class."
  }
},

// ---------------------------------------------------------------- 5
{
  id: 'bubble-selection',
  category: 'Sorting Basics',
  type: 'sort',
  variant: 'bubbleselection',
  tagline: 'The two textbook classics: one keeps swapping neighbours, the other hunts for the minimum.',
  racerA: {
    name: 'Bubble Sort', short: 'BUBBLE SORT',
    description: `Bubble Sort repeatedly walks through the array, comparing each pair of adjacent elements and swapping them if they're out of order. Large elements "bubble up" to the end with each pass. It's simple to reason about, but does a lot of unnecessary swapping — it's rarely used in production code.`,
    steps: [
      'Walk through the array comparing each adjacent pair.',
      'If a pair is out of order, swap them immediately.',
      'After one full pass, the largest unsorted element is guaranteed to be in its final position.',
      'Repeat the pass over the remaining unsorted portion until no swaps are needed.'
    ],
    complexity: { best: 'O(n) — already sorted', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
    bestFor: 'Teaching the concept of comparison-based sorting, and tiny or nearly-sorted arrays where its early-exit optimisation makes it effectively linear.',
    code: `#include <vector>
using namespace std;

void bubbleSort(vector<int>& a){
    int n = a.size();
    for(int i = 0; i < n-1; i++){
        bool swapped = false;
        for(int j = 0; j < n-1-i; j++){
            if(a[j] > a[j+1]){
                swap(a[j], a[j+1]);
                swapped = true;
            }
        }
        if(!swapped) break;   // already sorted — stop early
    }
}`
  },
  racerB: {
    name: 'Selection Sort', short: 'SELECTION SORT',
    description: `Selection Sort divides the array into a sorted and unsorted region. On every pass it scans the entire unsorted region to find the minimum element, then swaps it into place at the front of that region. Unlike Bubble Sort, it makes at most n swaps total — but it always scans the full remaining array, so it never gets to exit early.`,
    steps: [
      'Assume the first element starts the "unsorted" region.',
      'Scan the whole unsorted region to find its minimum element.',
      'Swap that minimum into the front of the unsorted region.',
      'Shrink the unsorted region by one and repeat until it is empty.'
    ],
    complexity: { best: 'O(n²)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
    bestFor: 'Situations where the cost of swapping is high but comparisons are cheap — Selection Sort makes the fewest possible swaps (at most n−1) of any comparison sort.',
    code: `#include <vector>
using namespace std;

void selectionSort(vector<int>& a){
    int n = a.size();
    for(int i = 0; i < n-1; i++){
        int minIdx = i;
        for(int j = i+1; j < n; j++){
            if(a[j] < a[minIdx]) minIdx = j;
        }
        if(minIdx != i) swap(a[i], a[minIdx]);
    }
}`
  },
  chart: {
    basis: "worst",
    formulaA: "quadratic",
    formulaB: "quadratic",
    scale: "large",
    note: "Both are O(n²) — identical growth class. Selection Sort just performs far fewer swaps."
  }
},

// ---------------------------------------------------------------- 6
{
  id: 'linear-binary',
  category: 'Searching',
  type: 'search',
  variant: 'linearbinary',
  tagline: 'Check everything, one by one — or halve the haystack every single time.',
  racerA: {
    name: 'Linear Search', short: 'LINEAR SEARCH',
    description: `Linear Search checks every element in order until it finds the target (or runs out of elements). It needs no assumptions about the data — the array doesn't have to be sorted — but that generality costs speed: in the worst case it inspects every single element.`,
    steps: [
      'Start at the first element of the array.',
      'Compare it to the target value.',
      'If it matches, return its index.',
      'Otherwise move to the next element and repeat until found or the array ends.'
    ],
    complexity: { best: 'O(1)', avg: 'O(n)', worst: 'O(n)', space: 'O(1)' },
    bestFor: 'Unsorted data, linked lists (no random access), or small arrays where sorting first would cost more than it saves.',
    code: `#include <vector>
using namespace std;

int linearSearch(vector<int>& a, int target){
    for(int i = 0; i < (int)a.size(); i++){
        if(a[i] == target) return i;
    }
    return -1;   // not found
}`
  },
  racerB: {
    name: 'Binary Search', short: 'BINARY SEARCH',
    description: `Binary Search requires the array to be sorted, but in exchange it's dramatically faster: it compares the target against the middle element, and instantly discards the half of the array that can't contain it. Each comparison halves the search space, so it needs only about log₂(n) comparisons even for huge arrays.`,
    steps: [
      'Look at the middle element of the current search range.',
      'If it equals the target, done.',
      'If the target is smaller, discard the right half and repeat on the left half.',
      'If the target is larger, discard the left half and repeat on the right half.',
      'Repeat until found, or the range becomes empty.'
    ],
    complexity: { best: 'O(1)', avg: 'O(log n)', worst: 'O(log n)', space: 'O(1)' },
    bestFor: 'Sorted data, especially large datasets — database indexes, sorted lookup tables, and "find the boundary" problems (first/last occurrence, lower/upper bound).',
    code: `#include <vector>
using namespace std;

int binarySearch(vector<int>& a, int target){
    int lo = 0, hi = (int)a.size() - 1;
    while(lo <= hi){
        int mid = lo + (hi - lo) / 2;
        if(a[mid] == target) return mid;
        else if(a[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;   // not found
}`
  },
  chart: {
    basis: "worst",
    formulaA: "linear",
    formulaB: "logn",
    scale: "large",
    note: null
  }
},

// ---------------------------------------------------------------- 7
{
  id: 'heap-insertion',
  category: 'Sorting — Advanced vs Simple',
  type: 'sort',
  variant: 'heapinsertion',
  tagline: 'A self-balancing tournament bracket vs. sorting a hand of playing cards.',
  racerA: {
    name: 'Heap Sort', short: 'HEAP SORT',
    description: `Heap Sort first arranges the array into a max-heap — a binary tree (stored in an array) where every parent is larger than its children. Then it repeatedly swaps the heap's root (the largest remaining element) to the end of the array and shrinks the heap, restoring the heap property each time. It guarantees O(n log n) in every case, in place, with no extra memory.`,
    steps: [
      'Build a max-heap from the array (heapify from the last non-leaf node upward).',
      'Swap the root (largest element) with the last element of the heap.',
      'Shrink the heap size by one, excluding the now-sorted last element.',
      "Sift the new root down to restore the max-heap property.",
      'Repeat steps 2–4 until the heap has one element left.'
    ],
    complexity: { best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(1)' },
    bestFor: 'Systems with tight, guaranteed memory limits and no tolerance for worst-case slowdowns — e.g. embedded systems and real-time applications where Quick Sort\'s O(n²) worst case is unacceptable.',
    code: `#include <vector>
using namespace std;

void heapify(vector<int>& a, int n, int i){
    int largest = i, l = 2*i+1, r = 2*i+2;
    if(l < n && a[l] > a[largest]) largest = l;
    if(r < n && a[r] > a[largest]) largest = r;
    if(largest != i){
        swap(a[i], a[largest]);
        heapify(a, n, largest);
    }
}

void heapSort(vector<int>& a){
    int n = a.size();
    for(int i = n/2 - 1; i >= 0; i--) heapify(a, n, i);
    for(int i = n-1; i > 0; i--){
        swap(a[0], a[i]);
        heapify(a, i, 0);
    }
}`
  },
  racerB: {
    name: 'Insertion Sort', short: 'INSERTION SORT',
    description: `Insertion Sort builds the sorted array one element at a time, the way most people sort a hand of playing cards: take the next card, and slide it left past every card bigger than it until it lands in the right spot. It's O(n²) in general, but on nearly-sorted data it's blazingly fast and it needs zero extra memory.`,
    steps: [
      'Start from the second element, treating the first as a sorted sub-array of size one.',
      'Take the current element as a "key".',
      'Shift every element in the sorted sub-array that is greater than the key one position right.',
      'Insert the key into the gap this creates.',
      'Move to the next element and repeat.'
    ],
    complexity: { best: 'O(n) — already sorted', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
    bestFor: 'Small arrays, nearly-sorted data, and online sorting (sorting a stream as data arrives) — many hybrid library sorts fall back to Insertion Sort for small sub-arrays.',
    code: `#include <vector>
using namespace std;

void insertionSort(vector<int>& a){
    int n = a.size();
    for(int i = 1; i < n; i++){
        int key = a[i];
        int j = i - 1;
        while(j >= 0 && a[j] > key){
            a[j+1] = a[j];
            j--;
        }
        a[j+1] = key;
    }
}`
  },
  chart: {
    basis: "worst",
    formulaA: "nlogn",
    formulaB: "quadratic",
    scale: "large",
    note: null
  }
},

// ---------------------------------------------------------------- 8
{
  id: 'bellman-dijkstra',
  category: 'Shortest Path',
  type: 'graph-path',
  variant: 'bellmandijkstra',
  tagline: 'One is fast but naive about negative weights. The other is slower, but nothing gets past it.',
  racerA: {
    name: 'Bellman-Ford', short: 'BELLMAN-FORD',
    description: `Bellman-Ford finds shortest paths from a single source by relaxing every edge in the graph, repeated V−1 times. It's slower than Dijkstra, but it handles negative edge weights correctly — and it can detect negative-weight cycles, which would make "shortest path" meaningless in the first place.`,
    steps: [
      'Set distance to the source as 0, and infinity for all other nodes.',
      'Relax every edge in the graph (check if going through it shortens the destination\'s distance).',
      'Repeat this full pass over all edges V−1 times.',
      'Run one extra pass: if any distance still improves, a negative-weight cycle exists.'
    ],
    complexity: { best: 'O(VE)', avg: 'O(VE)', worst: 'O(VE)', space: 'O(V)' },
    bestFor: 'Graphs that may contain negative edge weights (e.g. currency arbitrage, certain flow-cancellation networks) and any case needing negative-cycle detection.',
    code: `#include <vector>
#include <climits>
using namespace std;

struct Edge{ int u, v, w; };

vector<long long> bellmanFord(int src, int n, vector<Edge>& edges){
    vector<long long> dist(n, LLONG_MAX);
    dist[src] = 0;

    for(int i = 0; i < n-1; i++){
        for(auto& e : edges){
            if(dist[e.u] != LLONG_MAX && dist[e.u] + e.w < dist[e.v]){
                dist[e.v] = dist[e.u] + e.w;
            }
        }
    }

    // Optional Vth pass — detect negative-weight cycles
    for(auto& e : edges){
        if(dist[e.u] != LLONG_MAX && dist[e.u] + e.w < dist[e.v]){
            // negative cycle reachable from src
        }
    }
    return dist;
}`
  },
  racerB: {
    name: 'Dijkstra', short: 'DIJKSTRA',
    description: `Dijkstra, revisited here as the speed benchmark: it greedily commits to the closest unvisited node at every step, assuming that once a node is finalised, nothing can ever make it cheaper. That assumption is exactly why it breaks with negative weights — a later negative edge could retroactively shorten a path to an already-"finalised" node, and Dijkstra would never revisit it.`,
    steps: [
      'Set distance to the source as 0, infinity elsewhere, using a priority queue keyed by distance.',
      'Pop the closest unvisited node and mark it finalized.',
      'Relax its outgoing edges to update neighbor distances.',
      'Repeat — each node is finalized exactly once, which is only valid if all weights are non-negative.'
    ],
    complexity: { best: 'O((V+E) log V)', avg: 'O((V+E) log V)', worst: 'O((V+E) log V)', space: 'O(V)' },
    bestFor: 'Any graph guaranteed to have non-negative weights — which covers the overwhelming majority of real-world shortest-path problems, hence its status as the default choice.',
    code: `#include <vector>
#include <queue>
using namespace std;
typedef pair<long long,int> pli;

vector<long long> dijkstra(int src, int n, vector<vector<pair<int,int>>>& adj){
    vector<long long> dist(n, LLONG_MAX);
    priority_queue<pli, vector<pli>, greater<pli>> pq;
    dist[src] = 0;
    pq.push({0, src});

    while(!pq.empty()){
        auto [d, u] = pq.top(); pq.pop();
        if(d > dist[u]) continue;
        for(auto [v, w] : adj[u]){
            if(w < 0) continue;              // Dijkstra assumes non-negative
            if(dist[u] + w < dist[v]){
                dist[v] = dist[u] + w;
                pq.push({dist[v], v});
            }
        }
    }
    return dist;
}`
  },
  chart: {
    basis: "worst",
    formulaA: "ve_product",
    formulaB: "ve_sum_logv",
    scale: "large",
    note: null
  }
},

// ---------------------------------------------------------------- 9
{
  id: 'nqueens-backtrack',
  category: 'Constraint Solving',
  type: 'backtrack',
  variant: 'nqueens',
  tagline: 'Prune the impossible branches early, or generate every arrangement and check afterwards.',
  racerA: {
    name: 'Backtracking', short: 'BACKTRACKING',
    description: `The backtracking solution to N-Queens places queens one row at a time, and immediately checks whether the new queen attacks any previous one. If it does, that branch is abandoned instantly — no time is wasted exploring arrangements that were already doomed by row 3 of 8. This pruning is what makes backtracking dramatically faster than brute force.`,
    steps: [
      'Try placing a queen in row 0, column 0.',
      'Before placing a queen, check if it is attacked by any queen already placed (same column or diagonal).',
      'If safe, place it and recurse to the next row.',
      'If no column in the current row is safe, backtrack — remove the previous queen and try its next column.',
      'A full solution is found once queens are safely placed in all N rows.'
    ],
    complexity: { best: 'O(N!) worst-case bound, far less in practice', avg: 'Well below N! due to pruning', worst: 'O(N!)', space: 'O(N)' },
    bestFor: 'Any constraint-satisfaction problem — Sudoku, graph colouring, scheduling — where invalid partial solutions can be detected early and abandoned.',
    code: `#include <vector>
using namespace std;

bool isSafe(vector<int>& cols, int row, int col){
    for(int r = 0; r < row; r++){
        int c = cols[r];
        if(c == col || abs(c - col) == abs(r - row)) return false;
    }
    return true;
}

void solve(int row, int n, vector<int>& cols, int& count){
    if(row == n){ count++; return; }        // found a full valid board
    for(int col = 0; col < n; col++){
        if(isSafe(cols, row, col)){
            cols[row] = col;
            solve(row+1, n, cols, count);    // recurse only into safe branches
        }
    }
}

int totalSolutions(int n){
    vector<int> cols(n, -1);
    int count = 0;
    solve(0, n, cols, count);
    return count;
}`
  },
  racerB: {
    name: 'Brute Force', short: 'BRUTE FORCE',
    description: `The brute-force approach generates every possible arrangement of N queens on the board (or every way to place N queens in N² cells), then checks each complete arrangement for validity afterward. It does no early pruning at all — it happily builds arrangements that were already invalid after the second queen, and only discovers that at the very end.`,
    steps: [
      'Generate every possible placement of N queens across the board (or every permutation of columns).',
      'For each complete arrangement, check all pairs of queens for row, column, or diagonal conflicts.',
      'If no conflicts exist, count it as a valid solution.',
      'Move to the next arrangement and repeat — no information from a failed check is reused.'
    ],
    complexity: { best: 'O(N^N)', avg: 'O(N^N)', worst: 'O(N^N)', space: 'O(N)' },
    bestFor: 'Teaching contrast against smarter search, and only truly practical for very small N — beyond N≈10 it becomes computationally infeasible.',
    code: `#include <vector>
using namespace std;

bool isValidBoard(vector<int>& cols, int n){
    for(int i = 0; i < n; i++)
        for(int j = i+1; j < n; j++)
            if(cols[i] == cols[j] || abs(cols[i]-cols[j]) == abs(i-j))
                return false;               // conflict found — too late, already built
    return true;
}

void generateAll(int row, int n, vector<int>& cols, int& count){
    if(row == n){
        if(isValidBoard(cols, n)) count++;  // check only after full placement
        return;
    }
    for(int col = 0; col < n; col++){
        cols[row] = col;
        generateAll(row+1, n, cols, count); // no pruning — explores every branch
    }
}

int totalSolutions(int n){
    vector<int> cols(n, -1);
    int count = 0;
    generateAll(0, n, cols, count);
    return count;
}`
  },
  chart: {
    basis: "worst",
    formulaA: "factorial",
    formulaB: "npow_n",
    scale: "small",
    note: "Backtracking's real count is far below N! in practice — pruning cuts most branches before they're ever built."
  }
},

// ---------------------------------------------------------------- 10
{
  id: 'knapsack-dp-greedy',
  category: 'Optimization',
  type: 'dp-greedy',
  variant: 'knapsack',
  tagline: 'Remember every sub-problem you\'ve already solved, or just grab whatever looks best right now.',
  racerA: {
    name: 'Dynamic Programming', short: 'DP',
    description: `The DP solution to 0/1 Knapsack builds a table where each cell dp[i][w] answers "using only the first i items, what's the best value achievable within weight w?". Each cell reuses answers to smaller sub-problems instead of recomputing them. This guarantees the true optimal value — DP never has to guess.`,
    steps: [
      'Create a table dp[i][w] for i = 0..n items and w = 0..capacity.',
      'Base case: with 0 items, the best value for any capacity is 0.',
      'For each item, decide: skip it (value stays dp[i-1][w]), or take it if it fits (dp[i-1][w-weight] + value).',
      'Store the better of the two choices in dp[i][w].',
      'The answer is dp[n][capacity] — built from optimal answers to every smaller sub-problem.'
    ],
    complexity: { best: 'O(nW)', avg: 'O(nW)', worst: 'O(nW)', space: 'O(nW), reducible to O(W)' },
    bestFor: 'Problems needing a provably optimal answer under hard constraints — resource allocation, budget planning, cutting-stock problems — where "close enough" isn\'t good enough.',
    code: `#include <vector>
using namespace std;

int knapsackDP(int capacity, vector<int>& weight, vector<int>& value, int n){
    vector<vector<int>> dp(n+1, vector<int>(capacity+1, 0));

    for(int i = 1; i <= n; i++){
        for(int w = 0; w <= capacity; w++){
            dp[i][w] = dp[i-1][w];                       // skip item i
            if(weight[i-1] <= w){
                dp[i][w] = max(dp[i][w],
                    dp[i-1][w - weight[i-1]] + value[i-1]); // take item i
            }
        }
    }
    return dp[n][capacity];    // guaranteed optimal
}`
  },
  racerB: {
    name: 'Greedy (value/weight)', short: 'GREEDY',
    description: `The greedy approach sorts items by value-to-weight ratio and keeps grabbing the best-ratio item that still fits, never reconsidering a choice once it's made. It's fast and simple — and it's provably optimal for the Fractional Knapsack problem. But for 0/1 Knapsack, where items can't be split, greedy can lock in an early choice that blocks a better combination later, and its answer can be wrong.`,
    steps: [
      'Compute value/weight ratio for every item.',
      'Sort items by ratio, highest first.',
      'Walk through the sorted list, adding each item if it still fits in the remaining capacity.',
      "Skip items that don't fit — never look back to reconsider an earlier decision.",
      'Stop when capacity is exhausted or items run out.'
    ],
    complexity: { best: 'O(n log n) — dominated by the sort', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)' },
    bestFor: 'Fractional Knapsack (items are divisible, like grain or liquid) — there, this exact greedy strategy is provably optimal, not just fast.',
    code: `#include <vector>
#include <algorithm>
using namespace std;

struct Item{ int weight, value; double ratio; };

int knapsackGreedy(int capacity, vector<Item> items){
    sort(items.begin(), items.end(),
         [](Item&a, Item&b){ return a.ratio > b.ratio; });

    int totalValue = 0, remaining = capacity;
    for(auto& item : items){
        if(item.weight <= remaining){
            remaining -= item.weight;
            totalValue += item.value;     // locked in — never revisited
        }
        // 0/1 variant: partial items are skipped entirely, unlike fractional
    }
    return totalValue;   // NOT guaranteed optimal for 0/1 Knapsack
}`
  },
  chart: {
    basis: "worst",
    formulaA: "nW_scaled",
    formulaB: "nlogn",
    scale: "large",
    note: "DP's cost grows with capacity too — this chart assumes capacity scales together with item count."
  }
}

];

// convenience lookup
const ARENA_BY_ID = Object.fromEntries(ARENA_DATA.map(r => [r.id, r]));
