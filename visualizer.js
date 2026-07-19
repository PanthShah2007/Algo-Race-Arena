/* ==========================================================
   RACE ENGINE
   Every generator below actually RUNS the algorithm (instrumented),
   measuring real performance.now() time and a real comparisons
   counter, while recording a list of visual "frames" for playback.
   Playback later just steps through frames — it does not fake data.
   ========================================================== */

const Engine = {};

/* ---------------- shared RNG ---------------- */
function rand(min, max){ return Math.floor(Math.random()*(max-min+1))+min; }
function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=rand(0,i); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }

/* =========================================================
   1. SORTING  — bubble / selection / merge / quick / heap / insertion
   Frame: { array, compareIdx:[i,j]|null, swapIdx:[i,j]|null, sortedUpTo:[...idx], comparisons }
   ========================================================= */
function genArray(n=26){ return shuffle(Array.from({length:n}, (_,i)=>i+4)); }

Engine.runSort = function(kind, arr){
  const a = arr.slice();
  const frames = [];
  let comparisons = 0;
  const sortedIdx = new Set();
  const push = (compareIdx, swapIdx) => frames.push({
    array: a.slice(), compareIdx: compareIdx||null, swapIdx: swapIdx||null,
    sortedUpTo: [...sortedIdx], comparisons
  });

  const t0 = performance.now();

  if(kind==='bubble'){
    const n=a.length;
    for(let i=0;i<n-1;i++){
      let swapped=false;
      for(let j=0;j<n-1-i;j++){
        comparisons++;
        push([j,j+1], null);
        if(a[j]>a[j+1]){ [a[j],a[j+1]]=[a[j+1],a[j]]; swapped=true; push(null,[j,j+1]); }
      }
      sortedIdx.add(n-1-i);
      if(!swapped) break;
    }
    for(let k=0;k<n;k++) sortedIdx.add(k);
    push(null,null);
  }
  else if(kind==='selection'){
    const n=a.length;
    for(let i=0;i<n-1;i++){
      let minIdx=i;
      for(let j=i+1;j<n;j++){
        comparisons++;
        push([minIdx,j], null);
        if(a[j]<a[minIdx]) minIdx=j;
      }
      if(minIdx!==i){ [a[i],a[minIdx]]=[a[minIdx],a[i]]; push(null,[i,minIdx]); }
      sortedIdx.add(i);
    }
    sortedIdx.add(n-1);
    push(null,null);
  }
  else if(kind==='insertion'){
    const n=a.length;
    sortedIdx.add(0);
    for(let i=1;i<n;i++){
      let key=a[i], j=i-1;
      while(j>=0){
        comparisons++;
        push([j,j+1], null);
        if(a[j]>key){ a[j+1]=a[j]; j--; push(null,[j+1,j+2]); }
        else break;
      }
      a[j+1]=key;
      for(let k=0;k<=i;k++) sortedIdx.add(k);
      push(null,null);
    }
  }
  else if(kind==='merge'){
    function merge(l,m,r){
      const left=a.slice(l,m+1), right=a.slice(m+1,r+1);
      let i=0,j=0,k=l;
      while(i<left.length && j<right.length){
        comparisons++;
        push([l+i, m+1+j], null);
        if(left[i]<=right[j]) a[k]=left[i++]; else a[k]=right[j++];
        push(null,[k]); k++;
      }
      while(i<left.length){ a[k]=left[i++]; push(null,[k]); k++; }
      while(j<right.length){ a[k]=right[j++]; push(null,[k]); k++; }
      for(let x=l;x<=r;x++) sortedIdx.add(x);
    }
    function ms(l,r){
      if(l>=r){ if(l===r) sortedIdx.add(l); return; }
      const m=l+Math.floor((r-l)/2);
      ms(l,m); ms(m+1,r); merge(l,m,r);
    }
    ms(0,a.length-1);
    push(null,null);
  }
  else if(kind==='quick'){
    function partition(lo,hi){
      const pivot=a[hi]; let i=lo-1;
      for(let j=lo;j<hi;j++){
        comparisons++;
        push([j,hi], null);
        if(a[j]<pivot){ i++; [a[i],a[j]]=[a[j],a[i]]; push(null,[i,j]); }
      }
      [a[i+1],a[hi]]=[a[hi],a[i+1]]; push(null,[i+1,hi]);
      sortedIdx.add(i+1);
      return i+1;
    }
    function qs(lo,hi){
      if(lo>=hi){ if(lo===hi) sortedIdx.add(lo); return; }
      const p=partition(lo,hi);
      qs(lo,p-1); qs(p+1,hi);
    }
    qs(0,a.length-1);
    push(null,null);
  }
  else if(kind==='heap'){
    const n=a.length;
    function heapify(size,i){
      let largest=i, l=2*i+1, r=2*i+2;
      if(l<size){ comparisons++; push([l,largest],null); if(a[l]>a[largest]) largest=l; }
      if(r<size){ comparisons++; push([r,largest],null); if(a[r]>a[largest]) largest=r; }
      if(largest!==i){ [a[i],a[largest]]=[a[largest],a[i]]; push(null,[i,largest]); heapify(size,largest); }
    }
    for(let i=Math.floor(n/2)-1;i>=0;i--) heapify(n,i);
    for(let i=n-1;i>0;i--){
      [a[0],a[i]]=[a[i],a[0]]; push(null,[0,i]);
      sortedIdx.add(i);
      heapify(i,0);
    }
    sortedIdx.add(0);
    push(null,null);
  }

  const t1 = performance.now();
  return { frames, comparisons, time: t1-t0, finalArray:a.slice(), n:a.length };
};

Engine.renderSort = function(ctx, W, H, frame, colors){
  ctx.clearRect(0,0,W,H);
  if(!frame) return;
  const a = frame.array, n=a.length;
  const max = Math.max(...a);
  const gap = 3;
  const bw = (W - gap*(n-1)) / n;
  a.forEach((v,i)=>{
    const bh = (v/max) * (H-18);
    const x = i*(bw+gap);
    const y = H - bh;
    let fill = colors.elevated2;
    if(frame.sortedUpTo && frame.sortedUpTo.includes(i)) fill = colors.good;
    if(frame.compareIdx && frame.compareIdx.includes(i)) fill = colors.info;
    if(frame.swapIdx && frame.swapIdx.includes(i)) fill = colors.accent;
    ctx.fillStyle = fill;
    roundRect(ctx, x, y, bw, bh, 2);
  });
};

/* =========================================================
   2. SEARCH — linear / binary
   Frame: { array, pointer:[idx] or [lo,mid,hi], target, found, comparisons }
   ========================================================= */
Engine.runSearch = function(kind, arr, target){
  const a = arr.slice().sort((x,y)=>x-y);
  const frames = [];
  let comparisons = 0;
  const t0 = performance.now();
  let foundIdx = -1;

  if(kind==='linear'){
    for(let i=0;i<a.length;i++){
      comparisons++;
      frames.push({ array:a, pointer:[i], comparisons, found:a[i]===target });
      if(a[i]===target){ foundIdx=i; break; }
    }
  } else if(kind==='binary'){
    let lo=0, hi=a.length-1;
    while(lo<=hi){
      const mid=lo+Math.floor((hi-lo)/2);
      comparisons++;
      frames.push({ array:a, pointer:[lo,mid,hi], comparisons, found:a[mid]===target });
      if(a[mid]===target){ foundIdx=mid; break; }
      else if(a[mid]<target) lo=mid+1;
      else hi=mid-1;
    }
  }
  const t1=performance.now();
  return { frames, comparisons, time:t1-t0, foundIdx, n:a.length, array:a };
};

Engine.renderSearch = function(ctx, W, H, frame, colors){
  ctx.clearRect(0,0,W,H);
  if(!frame) return;
  const a=frame.array, n=a.length;
  const gap=4; const bw=(W-gap*(n-1))/n;
  const cy = H/2;
  a.forEach((v,i)=>{
    const x=i*(bw+gap);
    let fill = colors.elevated2;
    if(frame.pointer && frame.pointer.includes(i)) fill = frame.found ? colors.good : colors.accent;
    ctx.fillStyle = fill;
    roundRect(ctx, x, cy-22, bw, 44, 6);
    ctx.fillStyle = colors.textHi;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(v, x+bw/2, cy);
  });
};

/* =========================================================
   3. GRID GRAPH  — bfs / dfs / dijkstra / astar / bellmanford
   shared grid, frame: { visitedList:[idx...], current, path, comparisons }
   ========================================================= */
Engine.buildGrid = function(cols, rows, weighted){
  const total = cols*rows;
  const start = 0;
  const goal = total-1;
  const idx=(r,c)=>r*cols+c;

  // Carve a guaranteed random walk path from start to goal first —
  // those cells are protected from ever becoming walls, so the grid
  // is always solvable no matter how the remaining walls fall.
  const safe = new Set([start, goal]);
  let r=0, c=0;
  const goalR = rows-1, goalC = cols-1;
  let guard = 0;
  while((r!==goalR || c!==goalC) && guard < (rows+cols)*4){
    guard++;
    const canRight = c < goalC, canDown = r < goalR;
    let moveRight;
    if(canRight && canDown) moveRight = Math.random() < 0.55;
    else moveRight = canRight;
    if(moveRight) c++; else if(canDown) r++;
    safe.add(idx(r,c));
  }

  const walls = new Set();
  for(let i=0;i<total;i++) if(!safe.has(i) && Math.random()<0.22) walls.add(i);

  const weights = new Array(total).fill(1);
  if(weighted) for(let i=0;i<total;i++) weights[i]=rand(1,9);

  const neighbors=(i)=>{
    const r=Math.floor(i/cols), c=i%cols; const out=[];
    if(r>0 && !walls.has(idx(r-1,c))) out.push(idx(r-1,c));
    if(r<rows-1 && !walls.has(idx(r+1,c))) out.push(idx(r+1,c));
    if(c>0 && !walls.has(idx(r,c-1))) out.push(idx(r,c-1));
    if(c<cols-1 && !walls.has(idx(r,c+1))) out.push(idx(r,c+1));
    return out;
  };
  return { cols, rows, walls, start, goal, weights, neighbors };
};

function reconstructPath(parent, goal){
  const path=[]; let cur=goal;
  while(cur!==undefined){ path.push(cur); cur=parent.get(cur); }
  return path.reverse();
}

Engine.runGraphPath = function(kind, grid){
  const { cols, rows, start, goal, weights, neighbors } = grid;
  const frames=[]; let comparisons=0;
  const t0=performance.now();
  const visitedOrder=[];
  let path=[];

  if(kind==='bfs'){
    const visited=new Set([start]); const q=[start]; const parent=new Map();
    let head=0; let reached=false;
    while(head<q.length){
      const u=q[head++]; visitedOrder.push(u);
      frames.push({visitedList:[...visitedOrder], current:u, comparisons});
      if(u===goal){ reached=true; break; }
      for(const v of neighbors(u)){
        comparisons++;
        if(!visited.has(v)){ visited.add(v); parent.set(v,u); q.push(v); }
      }
    }
    if(reached) path=reconstructPath(parent,goal);
  }
  else if(kind==='dfs'){
    const visited=new Set(); const stack=[start]; const parent=new Map();
    let reached=false;
    while(stack.length){
      const u=stack.pop();
      if(visited.has(u)) continue;
      visited.add(u); visitedOrder.push(u);
      frames.push({visitedList:[...visitedOrder], current:u, comparisons});
      if(u===goal){ reached=true; break; }
      for(const v of neighbors(u)){
        comparisons++;
        if(!visited.has(v)){ parent.set(v,u); stack.push(v); }
      }
    }
    if(reached) path=reconstructPath(parent,goal);
  }
  else if(kind==='dijkstra' || kind==='bellmanford'){
    const n=cols*rows;
    const dist=new Array(n).fill(Infinity); dist[start]=0;
    const parent=new Map(); const visited=new Set();
    if(kind==='dijkstra'){
      for(let iter=0; iter<n; iter++){
        let u=-1, best=Infinity;
        for(let i=0;i<n;i++){ comparisons++; if(!visited.has(i) && dist[i]<best){ best=dist[i]; u=i; } }
        if(u===-1) break;
        visited.add(u); visitedOrder.push(u);
        frames.push({visitedList:[...visitedOrder], current:u, comparisons});
        if(u===goal) break;
        for(const v of neighbors(u)){
          comparisons++;
          const w = weights[v];
          if(dist[u]+w < dist[v]){ dist[v]=dist[u]+w; parent.set(v,u); }
        }
      }
    } else { // bellman-ford (edge relax passes)
      const edges=[];
      for(let i=0;i<n;i++) for(const v of neighbors(i)) edges.push([i,v,weights[v]]);
      for(let pass=0; pass<n-1; pass++){
        let improved=false;
        for(const [u,v,w] of edges){
          comparisons++;
          if(dist[u]+w < dist[v]){ dist[v]=dist[u]+w; parent.set(v,u); improved=true; }
        }
        visitedOrder.push(...Array.from(dist.keys?dist.keys():[]));
        frames.push({visitedList: dist.map((d,i)=> d<Infinity?i:null).filter(x=>x!==null), current:-1, comparisons});
        if(!improved) break;
      }
    }
    if(dist[goal] < Infinity) path=reconstructPath(parent,goal);
  }
  else if(kind==='astar'){
    const n=cols*rows;
    const h=(i)=>{ const r1=Math.floor(i/cols),c1=i%cols, r2=Math.floor(goal/cols),c2=goal%cols; return Math.abs(r1-r2)+Math.abs(c1-c2); };
    const g=new Array(n).fill(Infinity); g[start]=0;
    const f=new Array(n).fill(Infinity); f[start]=h(start);
    const visited=new Set(); const parent=new Map();
    let reached=false;
    for(let iter=0; iter<n; iter++){
      let u=-1, best=Infinity;
      for(let i=0;i<n;i++){ comparisons++; if(!visited.has(i) && f[i]<best){ best=f[i]; u=i; } }
      if(u===-1) break;
      visited.add(u); visitedOrder.push(u);
      frames.push({visitedList:[...visitedOrder], current:u, comparisons});
      if(u===goal){ reached=true; break; }
      for(const v of neighbors(u)){
        comparisons++;
        const w=weights[v];
        if(g[u]+w < g[v]){ g[v]=g[u]+w; f[v]=g[v]+h(v); parent.set(v,u); }
      }
    }
    if(reached) path=reconstructPath(parent,goal);
  }

  frames.push({visitedList:[...visitedOrder], current:-1, path, comparisons});
  const t1=performance.now();
  return { frames, comparisons, time:t1-t0, path, nodesVisited: visitedOrder.length, n: cols*rows };
};

Engine.renderGraphPath = function(ctx, W, H, frame, grid, colors){
  ctx.clearRect(0,0,W,H);
  if(!frame) return;
  const { cols, rows, walls, start, goal } = grid;
  const cw = W/cols, ch = H/rows;
  const visitedSet = new Set(frame.visitedList||[]);
  const pathSet = new Set(frame.path||[]);
  for(let i=0;i<cols*rows;i++){
    const r=Math.floor(i/cols), c=i%cols;
    const x=c*cw, y=r*ch;
    let fill = colors.elevated;
    if(walls.has(i)) fill = colors.line;
    else if(i===start) fill = colors.good;
    else if(i===goal) fill = colors.bad;
    else if(pathSet.size && pathSet.has(i)) fill = colors.accent;
    else if(frame.current===i) fill = colors.info;
    else if(visitedSet.has(i)) fill = colors.accentDim;
    ctx.fillStyle=fill;
    ctx.fillRect(x+1,y+1,cw-2,ch-2);
  }
};

/* =========================================================
   4. MST — prim / kruskal on a small node graph
   Frame: { mstEdges:[[u,v]], currentEdge:[u,v]|null, comparisons }
   ========================================================= */
Engine.buildGraph = function(nodeCount){
  const nodes = Array.from({length:nodeCount}, (_,i)=>({
    x: 60 + Math.random()*(760), y: 40 + Math.random()*180
  }));
  const edges = [];
  for(let i=0;i<nodeCount;i++){
    const connections = rand(2,3);
    for(let k=0;k<connections;k++){
      const j = rand(0,nodeCount-1);
      if(j!==i && !edges.find(e=>(e.u===i&&e.v===j)||(e.u===j&&e.v===i))){
        edges.push({u:i, v:j, w: rand(2,20)});
      }
    }
  }
  // ensure connectivity with a spanning chain first
  for(let i=0;i<nodeCount-1;i++){
    if(!edges.find(e=>(e.u===i&&e.v===i+1)||(e.u===i+1&&e.v===i))){
      edges.push({u:i, v:i+1, w:rand(2,20)});
    }
  }
  return { nodes, edges };
};

Engine.runMST = function(kind, graph){
  const { nodes, edges } = graph;
  const n = nodes.length;
  const frames=[]; let comparisons=0;
  const t0=performance.now();
  const mstEdges=[];

  if(kind==='prim'){
    const inMST=new Array(n).fill(false); inMST[0]=true;
    let totalW=0;
    for(let step=0; step<n-1; step++){
      let best=null, bestW=Infinity;
      for(const e of edges){
        comparisons++;
        const a=inMST[e.u], b=inMST[e.v];
        if(a!==b){ // crosses the cut
          if(e.w<bestW){ bestW=e.w; best=e; }
        }
      }
      if(!best) break;
      inMST[best.u]=true; inMST[best.v]=true;
      mstEdges.push([best.u,best.v]); totalW+=best.w;
      frames.push({mstEdges:[...mstEdges], currentEdge:[best.u,best.v], comparisons, totalW});
    }
  } else { // kruskal
    const sorted = edges.slice().sort((a,b)=>a.w-b.w);
    const parent = Array.from({length:n},(_,i)=>i);
    const find=(x)=> parent[x]===x?x:(parent[x]=find(parent[x]));
    let totalW=0;
    for(const e of sorted){
      comparisons++;
      const ru=find(e.u), rv=find(e.v);
      frames.push({mstEdges:[...mstEdges], currentEdge:[e.u,e.v], comparisons, totalW, rejected: ru===rv});
      if(ru!==rv){ parent[ru]=rv; mstEdges.push([e.u,e.v]); totalW+=e.w; }
      if(mstEdges.length===n-1) break;
    }
  }
  frames.push({mstEdges:[...mstEdges], currentEdge:null, comparisons});
  const t1=performance.now();
  return { frames, comparisons, time:t1-t0, mstEdges, n };
};

Engine.renderMST = function(ctx, W, H, frame, graph, colors){
  ctx.clearRect(0,0,W,H);
  if(!frame) return;
  const { nodes, edges } = graph;
  const sx = W/840, sy = H/240;
  const P = (n)=>({x:n.x*sx, y:n.y*sy + H*0.15});
  const mstSet = new Set((frame.mstEdges||[]).map(([u,v])=>u+'-'+v+':'+v+'-'+u));
  const inMst = (u,v)=> (frame.mstEdges||[]).some(e=> (e[0]===u&&e[1]===v)||(e[0]===v&&e[1]===u));

  edges.forEach(e=>{
    const p1=P(nodes[e.u]), p2=P(nodes[e.v]);
    const isMst = inMst(e.u,e.v);
    const isCurrent = frame.currentEdge && ((frame.currentEdge[0]===e.u&&frame.currentEdge[1]===e.v)||(frame.currentEdge[0]===e.v&&frame.currentEdge[1]===e.u));
    ctx.strokeStyle = isMst ? colors.good : (isCurrent ? colors.accent : colors.line);
    ctx.lineWidth = isMst ? 3 : (isCurrent?2.4:1.2);
    ctx.beginPath(); ctx.moveTo(p1.x,p1.y); ctx.lineTo(p2.x,p2.y); ctx.stroke();
    if(!isMst){
      ctx.fillStyle=colors.textLo; ctx.font='600 10px "JetBrains Mono", monospace'; ctx.textAlign='center';
      ctx.fillText(e.w, (p1.x+p2.x)/2, (p1.y+p2.y)/2 - 4);
    }
  });
  nodes.forEach((n,i)=>{
    const p=P(n);
    ctx.beginPath(); ctx.arc(p.x,p.y,10,0,Math.PI*2);
    ctx.fillStyle = colors.surface; ctx.fill();
    ctx.lineWidth=2; ctx.strokeStyle= colors.accent; ctx.stroke();
    ctx.fillStyle=colors.textHi; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(i, p.x, p.y);
  });
};

/* =========================================================
   5. BACKTRACKING — N-Queens: backtracking vs brute force
   Frame: { cols:[...per row col or -1], row, testCol, safe, solved, comparisons }
   ========================================================= */
Engine.runNQueens = function(kind, n){
  const frames=[]; let comparisons=0;
  const t0=performance.now();
  let solved=false;
  const colsArr = new Array(n).fill(-1);

  function isSafe(row,col){
    for(let r=0;r<row;r++){
      comparisons++;
      const c=colsArr[r];
      if(c===col || Math.abs(c-col)===Math.abs(r-row)) return false;
    }
    return true;
  }

  if(kind==='backtrack'){
    function solve(row){
      if(solved) return true;
      if(row===n){ solved=true; frames.push({cols:[...colsArr], row, comparisons, solved:true}); return true; }
      for(let c=0;c<n;c++){
        const safe = isSafe(row,c);
        frames.push({cols:[...colsArr], row, testCol:c, safe, comparisons});
        if(safe){
          colsArr[row]=c;
          if(solve(row+1)) return true;
          colsArr[row]=-1;
        }
      }
      return false;
    }
    solve(0);
  } else { // brute force: generate combinations in order, validate only when complete
    const cap = 200000;
    function isValidFull(){
      for(let i=0;i<n;i++) for(let j=i+1;j<n;j++){
        comparisons++;
        if(colsArr[i]===colsArr[j] || Math.abs(colsArr[i]-colsArr[j])===Math.abs(i-j)) return false;
      }
      return true;
    }
    function gen(row){
      if(solved || comparisons>cap) return;
      if(row===n){
        const ok = isValidFull();
        frames.push({cols:[...colsArr], row:n, comparisons, solved: ok});
        if(ok) solved=true;
        return;
      }
      for(let c=0;c<n && !solved;c++){
        colsArr[row]=c;
        if(row===n-1){ gen(row+1); }
        else { frames.push({cols:[...colsArr], row, testCol:c, comparisons, building:true}); gen(row+1); }
      }
      colsArr[row]=-1;
    }
    gen(0);
  }
  const t1=performance.now();
  return { frames, comparisons, time:t1-t0, solved, n };
};

Engine.renderNQueens = function(ctx, W, H, frame, n, colors){
  ctx.clearRect(0,0,W,H);
  if(!frame) return;
  const size = Math.min(W,H) - 20;
  const cell = size/n;
  const ox = (W-size)/2, oy = (H-size)/2;
  for(let r=0;r<n;r++){
    for(let c=0;c<n;c++){
      ctx.fillStyle = (r+c)%2===0 ? colors.elevated : colors.elevated2;
      ctx.fillRect(ox+c*cell, oy+r*cell, cell, cell);
    }
  }
  if(frame.row!==undefined && frame.testCol!==undefined && !frame.solved){
    ctx.fillStyle = frame.safe===false ? 'rgba(251,113,133,0.35)' : 'rgba(56,189,248,0.35)';
    ctx.fillRect(ox+frame.testCol*cell, oy+frame.row*cell, cell, cell);
  }
  (frame.cols||[]).forEach((c,r)=>{
    if(c<0) return;
    ctx.font = `${cell*0.6}px serif`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle = frame.solved ? colors.good : colors.textHi;
    ctx.fillText('♛', ox+c*cell+cell/2, oy+r*cell+cell/2+2);
  });
};

/* =========================================================
   6. KNAPSACK — DP table vs Greedy ratio scan
   ========================================================= */
Engine.buildKnapsack = function(){
  const items = Array.from({length:7},()=>({ weight: rand(2,9), value: rand(4,30) }));
  items.forEach(it=> it.ratio = it.value/it.weight);
  return { items, capacity: 20 };
};

Engine.runKnapsackDP = function(items, capacity){
  const frames=[]; let comparisons=0;
  const t0=performance.now();
  const n=items.length;
  const dp = Array.from({length:n+1}, ()=> new Array(capacity+1).fill(0));
  for(let i=1;i<=n;i++){
    for(let w=0;w<=capacity;w++){
      comparisons++;
      dp[i][w]=dp[i-1][w];
      if(items[i-1].weight<=w) dp[i][w]=Math.max(dp[i][w], dp[i-1][w-items[i-1].weight]+items[i-1].value);
      frames.push({i, w, value: dp[i][w], comparisons});
    }
  }
  const t1=performance.now();
  return { frames, comparisons, time:t1-t0, best: dp[n][capacity], n };
};

Engine.runKnapsackGreedy = function(items, capacity){
  const frames=[]; let comparisons=0;
  const t0=performance.now();
  const sorted = items.map((it,idx)=>({...it,idx})).sort((a,b)=>b.ratio-a.ratio);
  let remaining=capacity, total=0;
  for(const it of sorted){
    comparisons++;
    const taken = it.weight<=remaining;
    if(taken){ remaining-=it.weight; total+=it.value; }
    frames.push({item: it, taken, remaining, total, comparisons});
  }
  const t1=performance.now();
  return { frames, comparisons, time:t1-t0, best: total, n: items.length };
};

Engine.renderKnapsackDP = function(ctx, W, H, frame, items, capacity, colors){
  ctx.clearRect(0,0,W,H);
  if(!frame) return;
  const n=items.length, cols=capacity+1;
  const cw = W/cols, ch = H/(n+1);
  for(let i=0;i<=n;i++){
    for(let w=0;w<cols;w++){
      const done = i<frame.i || (i===frame.i && w<=frame.w);
      ctx.fillStyle = done ? colors.elevated2 : colors.elevated;
      ctx.fillRect(w*cw, i*ch, cw-1, ch-1);
    }
  }
  ctx.fillStyle = colors.accent;
  ctx.fillRect(frame.w*cw, frame.i*ch, cw-1, ch-1);
};

Engine.renderKnapsackGreedy = function(ctx, W, H, frame, items, capacity, colors){
  ctx.clearRect(0,0,W,H);
  if(!frame) return;
  const barW = (W-40)/items.length;
  items.forEach((it,i)=>{
    const h = (it.ratio/6)*  (H-70);
    const x = 20 + i*barW;
    const y = H-40-h;
    let fill = colors.elevated2;
    if(frame.item && frame.item.weight===it.weight && frame.item.value===it.value) fill = frame.taken?colors.good:colors.bad;
    ctx.fillStyle=fill;
    roundRect(ctx, x+4, y, barW-8, h, 3);
    ctx.fillStyle=colors.textLo; ctx.font='600 10px "JetBrains Mono", monospace'; ctx.textAlign='center';
    ctx.fillText(`w${it.weight}`, x+barW/2, H-24);
    ctx.fillText(`v${it.value}`, x+barW/2, H-12);
  });
  // capacity bar
  const usedFrac = 1 - (frame.remaining!==undefined? frame.remaining/capacity : 1);
  ctx.fillStyle=colors.line; ctx.fillRect(20, 12, W-40, 10);
  ctx.fillStyle=colors.accent; ctx.fillRect(20, 12, (W-40)*usedFrac, 10);
};

/* ---------------- shared helpers ---------------- */
function roundRect(ctx,x,y,w,h,r){
  if(w<=0||h<=0) return;
  r = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
  ctx.fill();
}

function currentColors(){
  const s = getComputedStyle(document.documentElement);
  const g = (v)=>s.getPropertyValue(v).trim();
  return {
    surface: g('--surface'), elevated: g('--elevated'), elevated2: g('--elevated-2'),
    line: g('--line'), textHi: g('--text-hi'), textLo: g('--text-lo'),
    good: g('--good'), bad: g('--bad'), info: g('--info')
  };
}
