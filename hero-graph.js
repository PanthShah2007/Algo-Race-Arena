// Ambient hero animation — a graph of nodes where two "racers" (amber vs violet)
// continuously flood outward from a shared start node along different routes,
// racing to a finish node, then reset. This is the site's signature visual:
// it literally re-enacts what the whole product does, as atmosphere.
(function(){
  const canvas = document.getElementById('heroGraph');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, DPR;
  let nodes = [], edges = [];
  let raceA, raceB;
  let t0 = performance.now();

  function colors(){
    const style = getComputedStyle(document.documentElement);
    return {
      a: style.getPropertyValue('--racer-a').trim(),
      b: style.getPropertyValue('--racer-b').trim(),
      line: style.getPropertyValue('--grid-line').trim(),
      dim: style.getPropertyValue('--text-lo').trim()
    };
  }

  function resize(){
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR,0,0,DPR,0,0);
    buildGraph();
  }

  function buildGraph(){
    nodes = []; edges = [];
    const cols = Math.max(9, Math.round(W/95));
    const rows = Math.max(6, Math.round(H/95));
    const padX = W*0.06, padY = H*0.10;
    const gx = (W - padX*2)/(cols-1), gy = (H - padY*2)/(rows-1);
    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        const jitter = () => (Math.random()-0.5);
        nodes.push({
          x: padX + c*gx + jitter()*gx*0.28,
          y: padY + r*gy + jitter()*gy*0.28,
          r, c
        });
      }
    }
    const idx = (r,c)=> r*cols+c;
    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        if(c<cols-1 && Math.random()>0.12) edges.push([idx(r,c), idx(r,c+1)]);
        if(r<rows-1 && Math.random()>0.12) edges.push([idx(r,c), idx(r+1,c)]);
        if(c<cols-1 && r<rows-1 && Math.random()>0.72) edges.push([idx(r,c), idx(r+1,c+1)]);
      }
    }
    // adjacency for BFS-style flood
    const adj = new Map();
    nodes.forEach((_,i)=>adj.set(i,[]));
    edges.forEach(([a,b])=>{ adj.get(a).push(b); adj.get(b).push(a); });

    const start = idx(Math.floor(rows/2), 0);
    const endA = idx(Math.floor(rows*0.18), cols-1);
    const endB = idx(Math.floor(rows*0.82), cols-1);

    raceA = floodOrder(adj, start, endA, 0.15);
    raceB = floodOrder(adj, start, endB, 0.15);
  }

  function floodOrder(adj, start, goal, branchBias){
    // BFS-like wavefront with slight randomness, recording distance (wave index) per node
    const dist = new Map([[start,0]]);
    const q = [start];
    let head = 0;
    while(head < q.length){
      const cur = q[head++];
      const neighbors = adj.get(cur).slice().sort(()=>Math.random()-0.5);
      for(const n of neighbors){
        if(!dist.has(n)){
          dist.set(n, dist.get(cur)+1);
          q.push(n);
        }
      }
    }
    const maxDist = Math.max(...dist.values());
    return { dist, maxDist, goal };
  }

  function draw(now){
    const c = colors();
    ctx.clearRect(0,0,W,H);

    // static edges
    ctx.lineWidth = 1;
    ctx.strokeStyle = c.line;
    edges.forEach(([a,b])=>{
      ctx.beginPath();
      ctx.moveTo(nodes[a].x, nodes[a].y);
      ctx.lineTo(nodes[b].x, nodes[b].y);
      ctx.stroke();
    });

    const cycle = 5200; // ms per full race+reset
    const elapsed = (now - t0) % cycle;
    const progress = Math.min(1, elapsed / (cycle*0.72));
    const waveA = progress * (raceA.maxDist+2);
    const waveB = progress * (raceB.maxDist+2);

    drawWave(raceA, waveA, c.a);
    drawWave(raceB, waveB, c.b);

    requestAnimationFrame(draw);
  }

  function drawWave(race, wave, color){
    ctx.fillStyle = color;
    nodes.forEach((n,i)=>{
      const d = race.dist.get(i);
      if(d===undefined) return;
      const delta = wave - d;
      if(delta < 0) return;
      const fade = Math.max(0, 1 - delta/3.2);
      if(fade<=0) return;
      ctx.globalAlpha = fade*0.85;
      const rad = 1.6 + fade*1.8;
      ctx.beginPath();
      ctx.arc(n.x, n.y, rad, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  window.addEventListener('resize', resize);
  document.addEventListener('arena:theme', ()=>{ /* colors recomputed each frame */ });
  resize();
  requestAnimationFrame(draw);
})();
