(function(){
  const params = new URLSearchParams(window.location.search);
  const raceId = params.get('id') || ARENA_DATA[0].id;
  const race = ARENA_BY_ID[raceId] || ARENA_DATA[0];
  const idx = ARENA_DATA.findIndex(r=>r.id===race.id);

  /* ---------------- engine config per matchup ---------------- */
  const ENGINE_MAP = {
    'dijkstra-astar':      { type:'graph-path', weighted:true,  kindA:'dijkstra',    kindB:'astar' },
    'bfs-dfs':             { type:'graph-path', weighted:false, kindA:'bfs',         kindB:'dfs' },
    'merge-quick':         { type:'sort',       kindA:'merge',       kindB:'quick' },
    'prim-kruskal':        { type:'graph-mst',  kindA:'prim',        kindB:'kruskal' },
    'bubble-selection':    { type:'sort',       kindA:'bubble',      kindB:'selection' },
    'linear-binary':       { type:'search',     kindA:'linear',      kindB:'binary' },
    'heap-insertion':      { type:'sort',       kindA:'heap',        kindB:'insertion' },
    'bellman-dijkstra':    { type:'graph-path', weighted:true,  kindA:'bellmanford', kindB:'dijkstra' },
    'nqueens-backtrack':   { type:'backtrack',  kindA:'backtrack',   kindB:'bruteforce', n:5 },
    'knapsack-dp-greedy':  { type:'dp-greedy',  kindA:'dp',          kindB:'greedy' }
  };
  const cfg = ENGINE_MAP[race.id];

  /* ---------------- populate static content ---------------- */
  document.title = `${race.racerA.short} vs ${race.racerB.short} — Algorithm Race Arena`;
  document.getElementById('raceCategory').textContent = race.category;
  document.getElementById('matchupTitle').innerHTML =
    `<span class="a">${race.racerA.short}</span><span class="vs">vs</span><span class="b">${race.racerB.short}</span>`;
  document.getElementById('raceTagline').textContent = race.tagline;

  function fillRacer(letter, r){
    document.getElementById('name'+letter).textContent = r.name;
    document.getElementById('desc'+letter).textContent = r.description;
    document.getElementById('laneName'+letter).textContent = r.name;
    document.getElementById('legendName'+letter).textContent = r.name;
    document.getElementById('codeName'+letter).textContent = r.name + '.cpp';

    const steps = document.getElementById('steps'+letter);
    steps.innerHTML = r.steps.map(s=>`<li>${s}</li>`).join('');

    const table = document.getElementById('complexity'+letter);
    table.innerHTML = `
      <tr><td>Best case</td><td>${r.complexity.best}</td></tr>
      <tr><td>Average case</td><td>${r.complexity.avg}</td></tr>
      <tr><td>Worst case</td><td>${r.complexity.worst}</td></tr>
      <tr><td>Space</td><td>${r.complexity.space}</td></tr>
    `;
    document.getElementById('bestFor'+letter).textContent = r.bestFor;
    document.getElementById('code'+letter).textContent = r.code.trim();
  }
  fillRacer('A', race.racerA);
  fillRacer('B', race.racerB);

  const prev = ARENA_DATA[(idx-1+ARENA_DATA.length)%ARENA_DATA.length];
  const next = ARENA_DATA[(idx+1)%ARENA_DATA.length];
  const prevEl = document.getElementById('prevRace');
  const nextEl = document.getElementById('nextRace');
  prevEl.href = `race.html?id=${prev.id}`;
  prevEl.textContent = `← ${prev.racerA.short} vs ${prev.racerB.short}`;
  nextEl.href = `race.html?id=${next.id}`;
  nextEl.textContent = `${next.racerA.short} vs ${next.racerB.short} →`;

  document.querySelectorAll('.copy-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const letter = btn.dataset.copy;
      navigator.clipboard.writeText(document.getElementById('code'+letter).textContent).then(()=>{
        const old = btn.textContent; btn.textContent='Copied!'; setTimeout(()=>btn.textContent=old, 1200);
      });
    });
  });

  /* ---------------- colors ---------------- */
  function laneColors(lane){
    const s = getComputedStyle(document.documentElement);
    const g = (v)=>s.getPropertyValue(v).trim();
    return {
      surface:g('--surface'), elevated:g('--elevated'), elevated2:g('--elevated-2'),
      line:g('--line'), textHi:g('--text-hi'), textLo:g('--text-lo'),
      good:g('--good'), bad:g('--bad'), info:g('--info'),
      accent: lane==='A'? g('--racer-a') : g('--racer-b'),
      accentDim: lane==='A'? g('--racer-a-dim') : g('--racer-b-dim')
    };
  }

  /* ---------------- scenario + run ---------------- */
  function newScenario(){
    switch(cfg.type){
      case 'sort': return { array: genArray(24) };
      case 'search': { const arr = genArray(28); return { array:arr, target: arr[rand(0,arr.length-1)] }; }
      case 'graph-path': return { grid: Engine.buildGrid(13,7,cfg.weighted) };
      case 'graph-mst': return { graph: Engine.buildGraph(8) };
      case 'backtrack': return { n: cfg.n||6 };
      case 'dp-greedy': return Engine.buildKnapsack();
    }
  }

  function runBoth(scenario){
    switch(cfg.type){
      case 'sort': return [Engine.runSort(cfg.kindA, scenario.array), Engine.runSort(cfg.kindB, scenario.array)];
      case 'search': return [Engine.runSearch(cfg.kindA, scenario.array, scenario.target), Engine.runSearch(cfg.kindB, scenario.array, scenario.target)];
      case 'graph-path': return [Engine.runGraphPath(cfg.kindA, scenario.grid), Engine.runGraphPath(cfg.kindB, scenario.grid)];
      case 'graph-mst': return [Engine.runMST(cfg.kindA, scenario.graph), Engine.runMST(cfg.kindB, scenario.graph)];
      case 'backtrack': return [Engine.runNQueens(cfg.kindA, scenario.n), Engine.runNQueens(cfg.kindB, scenario.n)];
      case 'dp-greedy': return [Engine.runKnapsackDP(scenario.items, scenario.capacity), Engine.runKnapsackGreedy(scenario.items, scenario.capacity)];
    }
  }

  function renderFrame(which, ctx, W, H, frame, scenario){
    const colors = laneColors(which);
    switch(cfg.type){
      case 'sort': return Engine.renderSort(ctx,W,H,frame,colors);
      case 'search': return Engine.renderSearch(ctx,W,H,frame,colors);
      case 'graph-path': return Engine.renderGraphPath(ctx,W,H,frame,scenario.grid,colors);
      case 'graph-mst': return Engine.renderMST(ctx,W,H,frame,scenario.graph,colors);
      case 'backtrack': return Engine.renderNQueens(ctx,W,H,frame,scenario.n,colors);
      case 'dp-greedy':
        if(which==='A') return Engine.renderKnapsackDP(ctx,W,H,frame,scenario.items,scenario.capacity,colors);
        return Engine.renderKnapsackGreedy(ctx,W,H,frame,scenario.items,scenario.capacity,colors);
    }
  }

  function memoryFor(letter, scenario, n){
    const spaceStr = (letter==='A'?race.racerA:race.racerB).complexity.space;
    let bytes;
    if(cfg.type==='dp-greedy' && letter==='A') bytes = 8*n*scenario.capacity;
    else if(/n[²2]|N[²2]/.test(spaceStr)) bytes = 8*n*n;
    else if(/log n/i.test(spaceStr) && !/O\(n\)/i.test(spaceStr)) bytes = 8*Math.ceil(Math.log2(Math.max(2,n)));
    else if(/O\(1\)/i.test(spaceStr)) bytes = 16;
    else bytes = 8*n;
    return bytes < 1024 ? `${bytes} B` : `${(bytes/1024).toFixed(1)} KB`;
  }

  function memoryN(scenario){
    switch(cfg.type){
      case 'sort': case 'search': return scenario.array.length;
      case 'graph-path': return scenario.grid.cols*scenario.grid.rows;
      case 'graph-mst': return scenario.graph.nodes.length;
      case 'backtrack': return scenario.n;
      case 'dp-greedy': return scenario.items.length;
    }
  }

  /* ---------------- canvas setup ---------------- */
  const canvasA = document.getElementById('canvasA');
  const canvasB = document.getElementById('canvasB');
  function fitCanvas(canvas){
    const dpr = Math.min(window.devicePixelRatio||1, 2);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w*dpr; canvas.height = h*dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr,0,0,dpr,0,0);
    return { ctx, W:w, H:h };
  }

  /* ---------------- state ---------------- */
  let scenario, resA, resB, dimsA, dimsB;
  let frameIdxA=0, frameIdxB=0;
  let playing=false, animId=null, lastTs=0, acc=0;
  const speedSlider = document.getElementById('speedSlider');
  const speedLabel = document.getElementById('speedLabel');
  const baseMs = 55;

  const badgeA = document.getElementById('badgeA');
  const badgeB = document.getElementById('badgeB');
  const banner = document.getElementById('resultBanner');
  const btnStart = document.getElementById('btnStart');
  const btnPause = document.getElementById('btnPause');
  const btnReset = document.getElementById('btnReset');

  let finishedA=false, finishedB=false, finishOrder=[];

  function setup(){
    scenario = newScenario();
    [resA, resB] = runBoth(scenario);
    dimsA = fitCanvas(canvasA); dimsB = fitCanvas(canvasB);
    frameIdxA = 0; frameIdxB = 0;
    playing = false; acc = 0;
    finishedA = false; finishedB = false; finishOrder = [];
    badgeA.classList.remove('show'); badgeB.classList.remove('show');
    banner.classList.remove('show');
    document.getElementById('statCompA').textContent = '0';
    document.getElementById('statCompB').textContent = '0';
    document.getElementById('statTimeA').textContent = '—';
    document.getElementById('statTimeB').textContent = '—';
    document.getElementById('statMemA').textContent = '—';
    document.getElementById('statMemB').textContent = '—';
    renderFrame('A', dimsA.ctx, dimsA.W, dimsA.H, resA.frames[0], scenario);
    renderFrame('B', dimsB.ctx, dimsB.W, dimsB.H, resB.frames[0], scenario);
    btnStart.disabled = false; btnStart.textContent = '▶ Start Race';
    btnPause.disabled = true;
  }

  function finishLane(letter, res, scenario){
    const badge = letter==='A'?badgeA:badgeB;
    badge.classList.add('show');
    document.getElementById('statTime'+letter).textContent = res.time < 0.01 ? '<0.01 ms' : res.time.toFixed(2)+' ms';
    document.getElementById('statMem'+letter).textContent = memoryFor(letter, scenario, memoryN(scenario));
  }

  function announceWinner(){
    const nameA = race.racerA.name, nameB = race.racerB.name;
    let msg;
    if(finishOrder.length===2 && finishOrder[0]!==finishOrder[1]){
      const winner = finishOrder[0]==='A' ? nameA : nameB;
      msg = `🏆 <b>${winner}</b> finished first in this race — needing fewer visualized steps to complete. Full stats: <b>${nameA}</b> used ${resA.comparisons} comparisons in ${resA.time.toFixed(2)} ms · <b>${nameB}</b> used ${resB.comparisons} comparisons in ${resB.time.toFixed(2)} ms.`;
    } else {
      msg = `🤝 Both racers crossed the line together this run. <b>${nameA}</b>: ${resA.comparisons} comparisons, ${resA.time.toFixed(2)} ms · <b>${nameB}</b>: ${resB.comparisons} comparisons, ${resB.time.toFixed(2)} ms.`;
    }
    banner.innerHTML = msg;
    banner.classList.add('show');
  }

  function tick(ts){
    if(!playing) return;
    if(!lastTs) lastTs = ts;
    const dt = ts - lastTs; lastTs = ts;
    acc += dt;
    const speed = parseInt(speedSlider.value,10);
    const msPerFrame = baseMs / speed;

    while(acc >= msPerFrame){
      acc -= msPerFrame;
      if(frameIdxA < resA.frames.length-1) frameIdxA++;
      else if(!finishedA){ finishedA=true; finishOrder.push('A'); finishLane('A', resA, scenario); }
      if(frameIdxB < resB.frames.length-1) frameIdxB++;
      else if(!finishedB){ finishedB=true; finishOrder.push('B'); finishLane('B', resB, scenario); }
    }

    const fA = resA.frames[frameIdxA], fB = resB.frames[frameIdxB];
    renderFrame('A', dimsA.ctx, dimsA.W, dimsA.H, fA, scenario);
    renderFrame('B', dimsB.ctx, dimsB.W, dimsB.H, fB, scenario);
    document.getElementById('statCompA').textContent = fA.comparisons;
    document.getElementById('statCompB').textContent = fB.comparisons;

    if(finishedA && finishedB){
      playing = false;
      btnPause.disabled = true; btnStart.disabled = true;
      announceWinner();
      return;
    }
    animId = requestAnimationFrame(tick);
  }

  btnStart.addEventListener('click', ()=>{
    if(frameIdxA >= resA.frames.length-1 && frameIdxB >= resB.frames.length-1){ setup(); }
    playing = true; lastTs = 0;
    btnStart.disabled = true; btnPause.disabled = false;
    animId = requestAnimationFrame(tick);
  });
  btnPause.addEventListener('click', ()=>{
    playing = false;
    btnStart.disabled = false; btnStart.textContent = '▶ Resume';
    btnPause.disabled = true;
  });
  btnReset.addEventListener('click', setup);
  speedSlider.addEventListener('input', ()=>{ speedLabel.textContent = speedSlider.value+'×'; });

  window.addEventListener('resize', ()=>{
    dimsA = fitCanvas(canvasA); dimsB = fitCanvas(canvasB);
    if(resA) renderFrame('A', dimsA.ctx, dimsA.W, dimsA.H, resA.frames[frameIdxA], scenario);
    if(resB) renderFrame('B', dimsB.ctx, dimsB.W, dimsB.H, resB.frames[frameIdxB], scenario);
  });

  document.addEventListener('arena:theme', ()=>{
    if(resA) renderFrame('A', dimsA.ctx, dimsA.W, dimsA.H, resA.frames[frameIdxA], scenario);
    if(resB) renderFrame('B', dimsB.ctx, dimsB.W, dimsB.H, resB.frames[frameIdxB], scenario);
    rebuildChart();
  });

  setup();

  /* ---------------- complexity chart: derived from real Big-O ---------------- */
  function factorial(n){ let r=1; for(let i=2;i<=n;i++) r*=i; return r; }
  const FORMULAS = {
    const1:      n => 1,
    logn:        n => Math.log2(n),
    linear:      n => n,
    linear_E:    n => 4*n,                          // E ~ 4n on a sparse/grid-like graph
    ve_sum:      n => 5*n,                           // O(V+E), E ~ 4n
    nlogn:       n => n*Math.log2(n),
    quadratic:   n => n*n,
    ve_sum_logv: n => 5*n*Math.log2(n),               // O((V+E) log V)
    elogv:       n => 4*n*Math.log2(n),               // O(E log V), E ~ 4n
    ve_product:  n => 4*n*n,                          // O(VE), E ~ 4n
    nW_scaled:   n => n*(2*n),                        // O(nW), W assumed to scale as 2n
    factorial:   n => factorial(n),
    npow_n:      n => Math.pow(n, n)
  };
  const LABELS_LARGE = [10,50,100,250,500,1000];
  const LABELS_SMALL = [4,5,6,7,8,9];

  function buildChartData(){
    const c = race.chart;
    const labels = c.scale==='small' ? LABELS_SMALL : LABELS_LARGE;
    const fA = FORMULAS[c.formulaA], fB = FORMULAS[c.formulaB];
    return {
      labels: labels.map(n=>'n='+n),
      a: labels.map(fA),
      b: labels.map(fB)
    };
  }

  const chartCaption = document.getElementById('chartCaption');
  if(chartCaption){
    const basisLabel = race.chart.basis === 'avg' ? 'average-case' : 'worst-case';
    let text = `Estimated ${basisLabel} operation counts as input size n increases — sourced directly from each racer's stated complexity above.`;
    if(race.chart.note) text += ' ' + race.chart.note;
    chartCaption.textContent = text;
  }

  /* ---------------- complexity chart ---------------- */
  function chartColors(){
    const s = getComputedStyle(document.documentElement);
    const g = (v)=>s.getPropertyValue(v).trim();
    return { a:g('--racer-a'), b:g('--racer-b'), grid:g('--grid-line'), text:g('--text-lo') };
  }
  function rebuildChart(){
    const wrap = document.querySelector('.chart-wrap');
    if(typeof Chart === 'undefined'){
      wrap.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-lo);font-family:var(--font-mono);font-size:.85rem;text-align:center;padding:20px;">⚠ Chart.js couldn\'t load from the CDN (check your internet connection or ad-blocker). Everything else on this page still works.</div>';
      return;
    }
    const c = chartColors();
    const data = buildChartData();
    if(window.__complexityChart) window.__complexityChart.destroy();
    const canvasEl = document.getElementById('complexityChart');
    if(!canvasEl) return;
    const ctx = canvasEl.getContext('2d');
    window.__complexityChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [
          { label: race.racerA.short, data: data.a, borderColor:c.a, backgroundColor:c.a+'22', tension:.35, fill:true, pointRadius:3 },
          { label: race.racerB.short, data: data.b, borderColor:c.b, backgroundColor:c.b+'22', tension:.35, fill:true, pointRadius:3 }
        ]
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{ display:false },
          tooltip:{ callbacks:{ label: (item)=> `${item.dataset.label}: ${Math.round(item.parsed.y).toLocaleString()} ops` } }
        },
        scales:{
          x:{ ticks:{ color:c.text, font:{family:'JetBrains Mono', size:10} }, grid:{ color:c.grid } },
          y:{ type:'logarithmic', ticks:{ color:c.text, font:{family:'JetBrains Mono', size:10} }, grid:{ color:c.grid } }
        }
      }
    });
  }
  document.getElementById('legendDotA').style.cssText = `width:10px;height:10px;border-radius:3px;background:${chartColors().a}`;
  document.getElementById('legendDotB').style.cssText = `width:10px;height:10px;border-radius:3px;background:${chartColors().b}`;
  rebuildChart();

})();
