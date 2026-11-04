/* Oreo's GATE Academy — app UI */
(() => {
  'use strict';
  const { TYPES, CATS, generate, shuffle } = window.OreoContent;
  const screen = document.getElementById('screen');
  const TEST_DAY = new Date(2027, 2, 3, 14, 45); // Wed, Mar 3, 2027, 2:45 PM
  const STORE = 'oreo-gate-v1';
  const LET = 'ABCDE';
  const CAT = Object.fromEntries(CATS.map(c => [c.id, c]));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pick = a => a[Math.floor(Math.random() * a.length)];

  // ───────── state ─────────
  const DEFAULTS = { stats: {}, days: {}, fish: 0, tests: [], goal: 10, best: 0 };
  let S = load();
  function load() {
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORE) || '{}') }; } catch { return { ...DEFAULTS }; }
  }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch { /* private mode */ } }

  const dkey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const todayKey = () => dkey(new Date());
  const met = k => (S.days[k] || 0) >= S.goal;

  function streakNow() {
    let d = new Date();
    if (!met(dkey(d))) d = addDays(d, -1); // today not done yet → streak still alive from yesterday
    let n = 0;
    while (met(dkey(d))) { n++; d = addDays(d, -1); }
    return n;
  }
  function daysToTest() {
    const t = new Date(TEST_DAY); t.setHours(0, 0, 0, 0);
    const n = new Date(); n.setHours(0, 0, 0, 0);
    return Math.round((t - n) / 86400000);
  }

  function record(type, ok, hinted = false) {
    const st = S.stats[type] || (S.stats[type] = { n: 0, c: 0, r: [] });
    st.n++; if (ok) { st.c++; S.fish++; }
    st.r.push(ok ? (hinted ? 0.5 : 1) : 0); if (st.r.length > 20) st.r.shift();
  }
  // returns true if this answer just completed today's goal
  function countToday(n = 1) {
    const k = todayKey(), before = S.days[k] || 0;
    S.days[k] = before + n;
    const hit = before < S.goal && S.days[k] >= S.goal;
    if (hit) S.best = Math.max(S.best || 0, streakNow());
    save();
    return hit;
  }
  function mastery(type) {
    const st = S.stats[type];
    if (!st || !st.r.length) return null;
    return st.r.reduce((a, b) => a + b, 0) / st.r.length;
  }
  function level(type) {
    const m = mastery(type), n = S.stats[type]?.n || 0;
    if (m === null) return 'Not started';
    if (n < 8) return 'Warming up';
    return m >= 0.85 ? '🏆 Top Cat' : m >= 0.7 ? '⭐ Clever Cat' : m >= 0.5 ? 'Getting there' : 'Needs practice';
  }

  // ───────── Oreo voice ─────────
  const YAY = ['Purr-fect!', 'Paw-some!', 'Meow-velous!', 'Claw-some!', 'Fur-midable!', 'You’re the cat’s whiskers!', 'Whisker-sharp thinking!', 'Hiss-torically good!', 'Feline fine!'];
  const OOPS = ['Not quite — here’s the trick:', 'Close! Let’s look at why:', 'Tricky one! Here’s how Oreo thinks about it:', 'Good try — every miss is a lesson:'];
  const face = (cls = '') => `<img src="oreo-face.png" alt="Oreo" class="${cls}">`;
  const say = (html, extra = '') => `<div class="oreo-say">${face()}<div class="bubble"><span class="name">Professor Oreo</span>${html}${extra}</div></div>`;

  // ───────── components ─────────
  function weekRow() {
    const now = new Date(), dow = (now.getDay() + 6) % 7; // Monday = 0
    const mon = addDays(now, -dow);
    return `<div class="week">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((l, i) => {
      const d = addDays(mon, i), k = dkey(d), isToday = i === dow, fut = i > dow;
      return `<div class="day ${met(k) ? 'done' : ''} ${isToday ? 'today' : ''} ${fut ? 'future' : ''}">${l}<div class="dot">${met(k) ? '🔥' : ''}</div></div>`;
    }).join('')}</div>`;
  }
  function streakCard() {
    const n = streakNow(), done = S.days[todayKey()] || 0, doneToday = done >= S.goal;
    const left = Math.max(0, S.goal - done);
    const msg = doneToday ? '<span class="hot">✓ Goal done today!</span>' : n > 0 ? `<span class="hot">${left} more to keep your streak!</span>` : `${left} questions to start a streak`;
    return `<div class="card streak">
      <div class="streak-top">
        <div class="flame-big ${doneToday ? '' : 'cold'}">🔥</div>
        <div><div class="streak-num ${n ? '' : 'cold'}">${n}</div><div class="streak-lbl">day streak${S.best > 1 ? ` · best ${S.best}` : ''}</div></div>
      </div>
      ${weekRow()}
      <div class="goalbar"><i style="width:${Math.min(100, done / S.goal * 100)}%"></i></div>
      <div class="goal-txt"><span>Today: ${Math.min(done, S.goal)} / ${S.goal} questions</span>${msg}</div>
    </div>`;
  }
  function countdownCard() {
    const d = daysToTest();
    let big, lbl;
    if (d > 1) { big = d; lbl = 'days until GATE test day'; }
    else if (d === 1) { big = 1; lbl = 'day to go — test is TOMORROW!'; }
    else if (d === 0) { big = '🎉'; lbl = 'Test day is TODAY! You’ve got this!'; }
    else { big = '🏁'; lbl = 'Test day is done — so proud of you!'; }
    return `<div class="card countdown">
      <div class="big">${big}</div><div class="lbl">${lbl}</div>
      <div class="sub">Wed, March 3 · 2:45 PM</div>
    </div>`;
  }
  // ───────── THE PATH: Oreo leads, one step at a time ─────────
  const UNITS = [
    { id: 'verbal', name: 'Word Power', icon: '📖', steps: ['antonym', 'completion', 'arrange'] },
    { id: 'figural', name: 'Picture Puzzles', icon: '🔷', steps: ['figSeries', 'figAnalogy', 'figClass', 'matrix'] },
    { id: 'quant', name: 'Number Sense', icon: '🔢', steps: ['numSeries', 'numInfer', 'numMatrix'] },
    { id: 'reason', name: 'Word Logic', icon: '🧩', steps: ['analogy', 'classify', 'logical', 'logic', 'order', 'letters', 'arith'] },
  ];
  const NODES = [];
  UNITS.forEach(u => {
    u.steps.forEach(t => NODES.push({ id: 'lesson:' + t, unit: u.id, kind: 'lesson', type: t, name: TYPES[t].name, icon: TYPES[t].icon }));
    NODES.push({ id: 'cp:' + u.id, unit: u.id, kind: 'cp', cat: u.id, name: `${u.name} Checkpoint`, icon: '🏁' });
  });
  UNITS.push({ id: 'ready', name: 'Test Ready', icon: '🎓' });
  NODES.push({ id: 'test:mini', unit: 'ready', kind: 'test', test: 'mini', name: 'Mini Practice Test', icon: '⏱️' });
  NODES.push({ id: 'test:full', unit: 'ready', kind: 'test', test: 'full', name: 'Full Practice Test', icon: '📝' });
  const NODE = Object.fromEntries(NODES.map(n => [n.id, n]));
  const isDone = id => !!(S.done && S.done[id]);
  function markDone(id, score) { S.done = S.done || {}; S.done[id] = { at: Date.now(), score }; save(); }
  const currentIndex = () => { const i = NODES.findIndex(n => !isDone(n.id)); return i < 0 ? NODES.length : i; };
  const openUnits = new Set();

  function startNode(id) {
    const n = NODE[id];
    if (!n) return home();
    if (n.kind === 'lesson') return guided(n.type, 0, id);
    if (n.kind === 'cp') return startPractice(CAT[n.cat].types, `🏁 ${CAT[n.cat].name} Checkpoint`, 8, null, id);
    return testIntro(n.test);
  }
  function reviewSeq() { // weakest skills get extra attention
    const all = Object.keys(TYPES).sort((a, b) => (mastery(a) ?? 0) - (mastery(b) ?? 0));
    return shuffle([...all.slice(0, 5), ...shuffle(all.slice(5)).slice(0, 5)]);
  }

  // ───────── HOME: where am I, and what's next ─────────
  function home() {
    stopTimer();
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    const ci = currentIndex(), cur = NODES[ci], allDone = !cur;
    const done = S.days[todayKey()] || 0, doneToday = done >= S.goal, n = streakNow(), days = daysToTest();
    const first = !Object.keys(S.done || {}).length && !Object.keys(S.stats).length;
    let msg;
    if (first) msg = 'Hi Rose! I’m <b>Professor Oreo</b>. I’ll walk you through every kind of puzzle on the GATE test — one small step at a time. Ready for your first lesson?';
    else if (allDone) msg = 'You finished the whole path! 🎓 Now we keep your skills sharp: each <b>Daily Review</b> mixes puzzles, with extra practice on your trickiest ones.';
    else if (cur.kind === 'cp') msg = `You finished every <b>${CAT[cur.cat].name}</b> lesson! Let’s do a quick checkpoint to lock it in.`;
    else if (cur.kind === 'test') msg = `You’ve learned every kind of puzzle! Time to try a <b>${cur.name}</b> — just like the real thing.`;
    else msg = `${doneToday ? 'You already hit today’s goal — this one is a bonus round! ' : ''}Next up: <b>${esc(cur.name)}</b>. It takes about 5 minutes.`;
    const curUnit = cur ? cur.unit : null;
    screen.innerHTML = `
      <div class="topline">
        <button class="chip ${n ? 'hot' : ''}" data-streak>🔥 ${n ? `${n}-day streak` : 'Start a streak!'}</button>
        <span class="chip">🐟 ${S.fish} fish</span>
      </div>
      <div class="home-hero">
        <div class="hero-oreo" title="Tap Oreo to dance!">${keyedHTML('oreo-greenscreen.mp4', 'home')}</div>
        <div class="hero-right">
          <div class="logo"><span class="logo-oreo">Oreo’s</span><span class="logo-sub">GATE Academy</span></div>
          <div class="bubble">${msg}</div>
        </div>
      </div>
      <button class="continue" ${allDone ? 'data-review' : `data-node="${cur.id}"`}>
        <span class="ci">${allDone ? '🎯' : cur.icon}</span>
        <span class="cl"><small>${allDone ? 'Keep sharp' : first ? 'Start here' : 'Continue'}</small>${allDone ? 'Daily Review' : esc(cur.name)}</span>
        <span class="cg">›</span>
      </button>
      <button class="countdown-bar" data-countdown>${countdownLine(days)}</button>
      <div class="goal-mini"><span>Today’s goal</span><div class="goalbar"><i style="width:${Math.min(100, done / S.goal * 100)}%"></i></div><b>${Math.min(done, S.goal)}/${S.goal}</b></div>
      <div class="path">
        ${UNITS.map(u => {
          const ns = NODES.filter(x => x.unit === u.id), d = ns.filter(x => isDone(x.id)).length;
          const locked = ns.every(x => NODES.indexOf(x) > ci), open = u.id === curUnit || openUnits.has(u.id);
          return `<div class="unit ${open ? 'open' : ''} ${locked ? 'locked' : ''}">
            <button class="unit-h" data-unit="${u.id}"><span>${u.icon}</span><b>${u.name}</b><small>${locked ? '🔒' : d === ns.length ? '✓ Done' : `${d} of ${ns.length}`}</small></button>
            ${open ? `<div class="nodes">${ns.map(x => {
              const idx = NODES.indexOf(x), st = isDone(x.id) ? 'done' : idx === ci ? 'cur' : 'lock';
              return `<button class="node ${st}" data-node="${x.id}"><span class="dot">${st === 'done' ? '✓' : st === 'lock' ? '🔒' : x.icon}</span><span>${esc(x.name)}</span></button>`;
            }).join('')}</div>` : ''}
          </div>`;
        }).join('')}
      </div>
      <div class="home-links"><button class="link" data-tests>📝 Practice tests</button><button class="link" data-tips>💡 Test tips</button><button class="link" data-settings>⚙️ Settings</button></div>
      <p class="fine">Original practice puzzles written for Rose by Professor Oreo. Not affiliated with Pearson or the official OLSAT.</p>`;
    window.scrollTo(0, 0);
    startKeyed(screen.querySelector('.keyed.home'), { once: true, holdAt: 9.5, skipDance: homeDanced });
    homeDanced = true;
  }
  let homeDanced = false; // Oreo dances on the first home visit each session, then holds a pose (tap to dance again)
  function countdownLine(d) {
    if (d < 0) return '<span class="cd-num">🏁</span><span class="cd-txt"><b>Test day is done!</b><small>So proud of you, Rose.</small></span>';
    if (d === 0) return '<span class="cd-num">🎉</span><span class="cd-txt"><b>Today is GATE test day!</b><small>2:45 PM · You’ve got this!</small></span>';
    if (d === 1) return '<span class="cd-num">1</span><span class="cd-txt"><b>Your GATE test is TOMORROW!</b><small>Get a good night’s sleep 😴</small></span>';
    const weeks = Math.floor(d / 7);
    const sub = d <= 14 ? `Only ${d} days left — keep practicing!` : `That’s about ${weeks} weeks · Wednesday, March 3`;
    return `<span class="cd-num">${d}</span><span class="cd-txt"><b>days until your GATE test</b><small>${sub}</small></span>`;
  }
  function streakInfo() { modal(streakCard(), [['OK', 'green', null]]); }
  function countdownInfo() {
    modal(`${countdownCard()}<p style="margin-top:12px">The test is <b>after school in the Multipurpose Room</b>. A little practice every day beats a lot at once!</p>`, [['OK', 'green', null]]);
  }

  // ───────── GUIDED LESSON: Meet it → Watch Oreo → Your turn → Practice ─────────
  let G = null;
  const STAGES = ['Meet it', 'Watch Oreo', 'Your turn', 'Practice'];
  function stepper(stage) {
    return `<div class="stepper">${STAGES.map((l, i) => `<span class="${i < stage ? 'past' : i === stage ? 'now' : ''}"><i>${i < stage ? '✓' : i + 1}</i><em>${l}</em></span>`).join('')}</div>`;
  }
  function guided(type, stage, nodeId = 'lesson:' + type) {
    stopTimer();
    P = null;
    const T = TYPES[type], c = CAT[T.cat];
    if (stage === 0 || !G || G.type !== type) G = { type, nodeId, q: generate(type), q2: null };
    G.stage = stage;
    let body = '', btn = '';
    if (stage === 0) {
      body = `${say(T.intro)}<div class="section-lbl">Here’s what one looks like</div>${qHTML(G.q).replace('class="opts ', 'class="opts locked preview ')}`;
      btn = '<button class="btn wide big" data-g="1">Show me how ›</button>';
    } else if (stage === 1) {
      const card = qHTML(G.q).replace('class="opts ', 'class="opts locked ').replace(`data-opt="${G.q.answer}"`, `data-opt="${G.q.answer}" data-right`);
      body = `${say(`Watch me solve it. 🐾 ${T.trick}`)}${card}<div class="feedback ok"><div class="head">${face()}Here’s how I got it:</div><div class="why">${G.q.explain}</div></div>`;
      btn = '<button class="btn wide big green" data-g="2">My turn ›</button>';
    } else {
      G.q2 = generate(type);
      body = `${say('Your turn! Take your time. If you get stuck, tap the hint — that’s what it’s for.')}${qHTML(G.q2)}<div id="hintbox">${hintBtn()}</div><div id="lesson-fb"></div>`;
    }
    screen.innerHTML = `
      <div class="guide" style="--c:${c.color}">
        <div class="bar-top"><button class="xbtn" data-home aria-label="Back to path">✕</button>${stepper(stage)}</div>
        <h1 class="g-title">${T.icon} ${esc(T.name)}</h1>
        ${body}
        ${btn ? `<div class="g-next">${btn}</div>` : ''}
      </div>`;
    screen.querySelectorAll('[data-right]').forEach(b => b.classList.add('right'));
    window.scrollTo(0, 0);
  }
  function guidedAnswer(i) {
    const q = G.q2, box = screen.querySelector('.qcard .opts');
    if (!box || box.classList.contains('locked')) return;
    markOpts(box, q, i);
    const hinted = !!screen.querySelector('#hintbox .oreo-say');
    clearHintBtn();
    const ok = i === q.answer;
    record(q.type, ok, hinted);
    const hit = countToday();
    screen.querySelector('#lesson-fb').innerHTML = feedbackHTML(ok, q.explain + (ok ? '' : '<div class="why"><b>That’s okay — practice is where it clicks.</b></div>'),
      '<button class="btn wide big green" data-g="3">Start practice · 5 questions ›</button>');
    screen.querySelector('#lesson-fb').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (hit) setTimeout(celebrate, 600);
  }
  function lesson(t) { guided(t, 0); }

  // ───────── hints ─────────
  const hintBtn = () => '<button class="btn ghost hintbtn" data-hint>💡 Need a hint?</button>';
  function showHint() {
    const q = P && P.q && !P.answered && screen.querySelector('.bar-top [data-quit]') ? P.q : G && G.q2;
    if (!q) return;
    if (P && q === P.q) { P.qHinted = true; P.hints++; }
    screen.querySelector('#hintbox').innerHTML = say(`💡 ${q.hint}`);
  }
  function clearHintBtn() { const b = screen.querySelector('#hintbox .hintbtn'); if (b) b.remove(); }

  // ───────── question rendering ─────────
  function qHTML(q, picked = null) {
    const T = TYPES[q.type], c = CAT[T.cat];
    return `<div class="qcard" style="--c:${c.color}">
      <span class="tbadge">${T.icon} ${esc(T.name)}</span>
      <div class="prompt">${q.prompt}</div>
      ${q.stem ? `<div class="stem">${q.stem}</div>` : ''}
      <div class="opts ${q.kind}">${q.options.map((o, i) => `<button class="opt ${picked === i ? 'picked' : ''}" data-opt="${i}"><span class="lt">${LET[i]}</span><span class="ov">${o}</span></button>`).join('')}</div>
    </div>`;
  }
  function markOpts(box, q, pickedI) {
    box.classList.add('locked');
    box.querySelectorAll('.opt').forEach((b, i) => {
      b.classList.remove('picked');
      if (i === q.answer) b.classList.add('right');
      else if (i === pickedI) b.classList.add('wrong');
    });
  }
  function feedbackHTML(ok, explain, btn) {
    return `<div class="feedback ${ok ? 'ok' : 'no'}">
      <div class="head">${face()}${ok ? pick(YAY) : pick(OOPS)}</div>
      <div class="why">${explain}</div>
      ${btn}
    </div>`;
  }

  // ───────── PRACTICE ─────────
  let P = null;
  function startPractice(types, label, total = 10, seq = null, step = null) {
    P = { types, label, total, seq, step, i: 0, score: 0, run: 0, hints: 0, q: null, answered: false, missed: [], fish0: S.fish, lastType: null, seen: new Set() };
    nextPractice();
  }
  function startMission() { startPractice(Object.keys(TYPES), '🎯 Daily Review', 10, reviewSeq()); }
  function nextPractice() {
    if (P.i >= P.total) return practiceEnd();
    let t = P.seq ? P.seq[P.i] : pick(P.types);
    if (!P.seq && P.types.length > 2 && t === P.lastType) t = pick(P.types);
    P.lastType = t;
    let q;
    for (let k = 0; k < 12; k++) { q = generate(t); if (!P.seen.has(q.prompt + q.stem)) break; } // no repeats within a round
    P.seen.add(q.prompt + q.stem);
    P.q = q; P.answered = false; P.qHinted = false;
    renderPractice();
  }
  function renderPractice() {
    screen.innerHTML = `
      <div class="bar-top">
        <button class="xbtn" data-quit aria-label="Quit">✕</button>
        <div class="prog"><i style="width:${P.i / P.total * 100}%"></i></div>
        <span class="pill flame">${P.run >= 2 ? `🔥 ${P.run}` : `${P.i + 1}/${P.total}`}</span>
      </div>
      ${qHTML(P.q)}
      <div id="hintbox">${hintBtn()}</div>
      <div id="fb"></div>`;
    window.scrollTo(0, 0);
  }
  function practiceAnswer(i) {
    if (P.answered) return;
    P.answered = true;
    const q = P.q, ok = i === q.answer;
    record(q.type, ok, P.qHinted);
    clearHintBtn();
    if (ok) { P.score++; P.run++; } else { P.run = 0; P.missed.push({ q, pick: i }); }
    P.i++;
    const hit = countToday();
    markOpts(screen.querySelector('.opts'), q, i);
    screen.querySelector('.prog i').style.width = `${P.i / P.total * 100}%`;
    screen.querySelector('.pill').textContent = P.run >= 2 ? `🔥 ${P.run} in a row` : `${Math.min(P.i + 1, P.total)}/${P.total}`;
    const runMsg = ok && [3, 5, 8, 10].includes(P.run) ? `<div class="why"><b>🔥 ${P.run} in a row!</b></div>` : '';
    screen.querySelector('#fb').innerHTML = feedbackHTML(ok, q.explain + runMsg, `<button class="btn ${ok ? 'green' : 'red'} wide" data-next>${P.i >= P.total ? 'See results' : 'Continue'}</button>`);
    screen.querySelector('#fb').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (hit) setTimeout(celebrate, 600);
  }
  function practiceEnd() {
    const pct = P.score / P.total, fish = S.fish - P.fish0;
    if (P.step) return stepEnd(pct, fish);
    const msg = pct === 1 ? 'A perfect score! Oreo is doing backflips! 🐱' : pct >= 0.8 ? 'Excellent work — you’re thinking like a GATE student!' : pct >= 0.6 ? 'Nice job! Look over the misses below — that’s where the learning happens.' : 'These are tough! Read Oreo’s explanations below, then try another round.';
    screen.innerHTML = `
      <div class="results">
        ${pct >= 0.8 ? keyedHTML('oreo-greenscreen.mp4', 'results') : ''}
        ${say(msg)}
        <div class="card">
          <div class="of">${esc(P.label)}</div>
          <div class="score">${P.score}/${P.total}</div>
          <div class="stat-row"><span class="pill">🐟 +${fish} fish</span><span class="pill flame">🔥 ${streakNow()} day streak</span><span class="pill">Today: ${S.days[todayKey()] || 0} questions</span>${P.hints ? `<span class="pill">💡 ${P.hints} hint${P.hints > 1 ? 's' : ''} used</span>` : ''}</div>
        </div>
        <div class="lesson-actions" style="justify-content:center">
          <button class="btn green" data-again>Another review</button>
          <button class="btn ghost" data-home>Back to my path</button>
        </div>
        ${P.missed.length ? `<div class="section-lbl">Review your misses</div><div class="review">${P.missed.map(reviewHTML).join('')}</div>` : ''}
      </div>`;
    window.scrollTo(0, 0);
    const k = screen.querySelector('.keyed'); if (k) startKeyed(k);
  }
  function stepEnd(pct, fish) {
    const node = NODE[P.step], isCp = node.kind === 'cp';
    const passed = isCp || P.score >= Math.ceil(P.total * 0.6);
    const wasDone = isDone(node.id);
    if (passed) markDone(node.id, pct);
    const next = passed ? (NODES.find(n => !isDone(n.id)) || null) : null;
    let msg;
    if (!passed) msg = `${P.score} out of ${P.total} — this one is tricky! Read my explanations below, then let’s practice it once more.`;
    else if (isCp) msg = pct >= 0.75 ? `Checkpoint cleared! You really know your ${esc(CAT[node.cat].name)}. 🎉` : 'Checkpoint done! A few of these are still tricky — I’ll mix them into your Daily Reviews.';
    else msg = pct === 1 ? `Perfect! You’ve got <b>${esc(node.name)}</b> down. 🐾` : `Nice work — <b>${esc(node.name)}</b> ${wasDone ? 'practiced again' : 'complete'}! ✓`;
    screen.innerHTML = `
      <div class="results">
        ${pct >= 0.8 ? keyedHTML('oreo-greenscreen.mp4', 'results') : ''}
        ${say(msg)}
        <div class="card">
          <div class="of">${esc(P.label)}</div>
          <div class="score">${P.score}/${P.total}</div>
          <div class="stat-row"><span class="pill">🐟 +${fish} fish</span><span class="pill">Today: ${Math.min(S.days[todayKey()] || 0, S.goal)}/${S.goal}</span></div>
        </div>
        <div class="g-next">
          ${passed
            ? (next ? `<button class="btn wide big green" data-node="${next.id}">Next: ${next.icon} ${esc(next.name)} ›</button>` : '<button class="btn wide big green" data-home>See your path 🎓</button>')
            : '<button class="btn wide big" data-again>Practice once more ›</button>'}
          <button class="btn ghost wide" data-home style="margin-top:10px">Back to my path</button>
        </div>
        ${P.missed.length ? `<div class="section-lbl">Let’s look at the ones you missed</div><div class="review">${P.missed.map(reviewHTML).join('')}</div>` : ''}
      </div>`;
    window.scrollTo(0, 0);
    const k = screen.querySelector('.keyed'); if (k) startKeyed(k);
  }
  function reviewHTML({ q, pick: p }) {
    const html = qHTML(q).replace(/class="opts /, 'class="opts locked ');
    const div = document.createElement('div');
    div.innerHTML = html;
    div.querySelectorAll('.opt').forEach((b, i) => { if (i === q.answer) b.classList.add('right'); else if (i === p) b.classList.add('wrong'); });
    const card = div.querySelector('.qcard');
    card.insertAdjacentHTML('beforeend', `${p === null ? '<div class="yours">You left this one blank — on test day, always guess!</div>' : ''}<div class="why">🐾 ${q.explain}</div>`);
    return div.innerHTML;
  }

  // ───────── TEST ─────────
  let X = null, timer = null;
  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }
  const TKEY = 'oreo-gate-test';
  function saveTest() {
    if (!X) return;
    try { localStorage.setItem(TKEY, JSON.stringify({ kind: X.kind, label: X.label, n: X.n, picks: X.picks, i: X.i, end: X.end, start: X.start })); } catch { /* ignore */ }
  }
  function clearTest() { try { localStorage.removeItem(TKEY); localStorage.removeItem(TKEY + '-qs'); } catch { /* ignore */ } }
  function startTest(kind, timed = true) {
    const n = kind === 'full' ? 72 : 24, minutes = kind === 'full' ? 40 : 14;
    const all = Object.keys(TYPES);
    let list = [];
    while (list.length < n) list = list.concat(shuffle(all));
    list = shuffle(list.slice(0, n));
    X = { kind, label: (kind === 'full' ? 'Full Practice Test' : 'Mini Test') + (timed ? '' : ' (untimed)'), n, qs: list.map(generate), picks: Array(n).fill(null), i: 0, end: timed ? Date.now() + minutes * 60000 : null, start: Date.now() };
    try { localStorage.setItem(TKEY + '-qs', JSON.stringify(X.qs)); } catch { /* storage full: test still works, just can't resume */ }
    saveTest();
    stopTimer();
    if (timed) timer = setInterval(tick, 500);
    renderTest();
  }
  const mmss = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  function tick() {
    if (!X || !X.end) return;
    const left = Math.max(0, Math.round((X.end - Date.now()) / 1000));
    const el = document.getElementById('timer');
    if (el) { el.textContent = `⏱ ${mmss(left)}`; el.classList.toggle('low', left <= 120); }
    if (left <= 0) { stopTimer(); finishTest(true); }
  }
  function renderTest() {
    const q = X.qs[X.i], answered = X.picks.filter(p => p !== null).length;
    screen.innerHTML = `
      <div class="bar-top">
        <button class="xbtn" data-quittest aria-label="Quit">✕</button>
        <div class="prog"><i style="width:${answered / X.n * 100}%"></i></div>
        <span class="pill">${X.i + 1}/${X.n}</span>
        <span class="pill timer" id="timer">${X.end ? `⏱ ${mmss(Math.max(0, Math.round((X.end - Date.now()) / 1000)))}` : 'Untimed'}</span>
      </div>
      ${qHTML(q, X.picks[X.i])}
      <div class="testnav">
        <button class="btn ghost" data-prev ${X.i === 0 ? 'disabled' : ''}>‹ Back</button>
        ${X.i < X.n - 1 ? '<button class="btn" data-tnext>Next ›</button>' : '<button class="btn green" data-finish>Finish test</button>'}
      </div>
      <div class="palette">${X.qs.map((_, i) => `<button data-jump="${i}" class="${X.picks[i] !== null ? 'ans' : ''} ${i === X.i ? 'cur' : ''}">${i + 1}</button>`).join('')}</div>
      ${X.i < X.n - 1 ? '<div style="margin-top:14px;text-align:right"><button class="link" data-finish>Finish early</button></div>' : ''}`;
    saveTest();
    tick();
  }
  function testPick(i) {
    X.picks[X.i] = i;
    saveTest();
    screen.querySelectorAll('.opt').forEach((b, k) => b.classList.toggle('picked', k === i));
    screen.querySelector(`.palette [data-jump="${X.i}"]`).classList.add('ans');
    screen.querySelector('.prog i').style.width = `${X.picks.filter(p => p !== null).length / X.n * 100}%`;
  }
  function askFinish() {
    const blank = X.picks.filter(p => p === null).length;
    if (!blank) return finishTest(false);
    modal(`<h2>Finish the test?</h2><p>You have <b>${blank}</b> unanswered question${blank > 1 ? 's' : ''}. On the real OLSAT, a wrong guess costs nothing — so always fill in an answer!</p>`,
      [['Keep working', 'ghost', null], ['Finish anyway', 'green', () => finishTest(false)]]);
  }
  function finishTest(timeUp) {
    if (!X) return; // already finished (e.g. timer and button at the same moment)
    stopTimer();
    clearTest();
    const secs = Math.round(((X.end ? Math.min(Date.now(), X.end) : Date.now()) - X.start) / 1000);
    let score = 0, answered = 0;
    const byCat = {}, missed = [];
    X.qs.forEach((q, i) => {
      const p = X.picks[i], ok = p === q.answer, cat = TYPES[q.type].cat;
      byCat[cat] = byCat[cat] || { c: 0, n: 0 }; byCat[cat].n++;
      if (ok) { score++; byCat[cat].c++; }
      if (p !== null) { answered++; record(q.type, ok); }
      if (!ok) missed.push({ q, pick: p });
    });
    S.tests.push({ at: Date.now(), label: X.label, score, n: X.n, secs });
    markDone('test:' + X.kind, X.n ? score / X.n : 0);
    const hit = answered ? countToday(answered) : (save(), false);
    const pct = score / X.n;
    const msg = (timeUp ? '⏰ Time’s up! ' : '') + (pct >= 0.85 ? 'Outstanding! That’s GATE-level thinking!' : pct >= 0.7 ? 'Great job! A few more practice rounds on your weakest section and you’ll be unstoppable.' : pct >= 0.5 ? 'Good effort! Check which section scored lowest and visit those lessons.' : 'This was a tough one. Practicing each lesson will make the next test feel much easier!');
    const label = X.label, n = X.n;
    X = null;
    screen.innerHTML = `
      <div class="results">
        ${pct >= 0.8 ? keyedHTML('oreo-greenscreen.mp4', 'results') : ''}
        ${say(msg)}
        <div class="card">
          <div class="of">${esc(label)} · ${mmss(secs)} used</div>
          <div class="score">${score}/${n}</div>
          <div class="of">${Math.round(pct * 100)}% correct</div>
          <div class="rcats">${CATS.filter(c => byCat[c.id]).map(c => `<div class="rcat" style="--c:${c.color}"><div class="top"><span>${c.name} <span style="color:var(--muted);font-weight:700">· ${c.sub}</span></span><span>${byCat[c.id].c}/${byCat[c.id].n}</span></div><div class="bar"><i style="width:${byCat[c.id].c / byCat[c.id].n * 100}%"></i></div></div>`).join('')}</div>
          <div class="stat-row"><span class="pill">🐟 +${score} fish</span><span class="pill flame">🔥 ${streakNow()} day streak</span></div>
        </div>
        <div class="g-next"><button class="btn wide big" data-home>Back to my path</button></div>
        ${missed.length ? `<div class="section-lbl">Review (${missed.length} to learn from)</div><div class="review">${missed.map(reviewHTML).join('')}</div>` : ''}
      </div>`;
    window.scrollTo(0, 0);
    const kd = screen.querySelector('.keyed'); if (kd) startKeyed(kd);
    if (hit) setTimeout(celebrate, 700);
  }

  // ───────── modal / celebrate / tips ─────────
  function modal(html, buttons, cls = '') {
    const ov = document.createElement('div');
    ov.className = 'overlay';
    ov.innerHTML = `<div class="mbox ${cls}">${html}<div class="mbtns">${buttons.map(([t, c], i) => `<button class="btn ${c}" data-mb="${i}">${t}</button>`).join('')}</div></div>`;
    ov.addEventListener('click', e => {
      const b = e.target.closest('[data-mb]');
      if (b) { ov.remove(); const fn = buttons[+b.dataset.mb][2]; if (fn) fn(); }
      else if (e.target === ov) ov.remove();
    });
    document.body.appendChild(ov);
    return ov;
  }
  function confetti() {
    const c = document.createElement('div');
    c.className = 'confetti';
    const cols = ['#ffcf3f', '#ff9b3d', '#5fcf73', '#6c4fe0', '#ff6b57', '#fffdf8', '#1c1a24'];
    c.innerHTML = Array.from({ length: 90 }, () => `<i style="left:${Math.random() * 100}%;background:${pick(cols)};animation-duration:${2 + Math.random() * 2.5}s;animation-delay:${Math.random() * 0.8}s"></i>`).join('');
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 5500);
  }
  // ───────── green-screen Oreo: keyed live onto a canvas (works in Chrome and iPad Safari from one MP4) ─────────
  const keyedHTML = (src, cls = '') => `<div class="keyed ${cls}"><img src="oreo-face.png" alt="Oreo dancing" class="kfallback"><canvas width="360" height="640" aria-hidden="true"></canvas><video src="${src}" muted ${cls === 'home' ? '' : 'loop autoplay'} playsinline preload="auto"></video></div>`;
  function startKeyed(root, opts = {}) {
    const v = root && root.querySelector('video'), c = root && root.querySelector('canvas');
    if (!v || !c) return;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    const draw = () => {
      if (v.readyState < 2) return;
      ctx.drawImage(v, 0, 0, c.width, c.height);
      const img = ctx.getImageData(0, 0, c.width, c.height), d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2], m = r > b ? r : b, gr = g - m;
        if (gr >= 90) { d[i + 3] = 0; continue; }
        if (gr > 40) d[i + 3] = (90 - gr) * 5.1;   // soft edge
        if (g > m) d[i + 1] = m;                    // remove green spill
      }
      ctx.putImageData(img, 0, 0);
      root.classList.add('on');
    };
    const loop = () => {
      if (!root.isConnected) { v.pause(); return; }
      draw();
      if (v.paused || v.ended) return;
      if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(loop); else requestAnimationFrame(loop);
    };
    v.addEventListener('seeked', draw);
    if (opts.once) {
      v.loop = false;
      const hold = () => { v.pause(); v.currentTime = opts.holdAt; };
      v.addEventListener('ended', hold);
      root.addEventListener('click', () => { v.currentTime = 0; v.play().then(loop).catch(() => {}); });
      const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (opts.skipDance || reduce) {
        if (v.readyState >= 1) hold(); else v.addEventListener('loadedmetadata', hold, { once: true });
        return;
      }
    }
    v.play().then(loop).catch(() => {});
  }

  const CELEBRATIONS = [
    { src: 'oreo-dance.mp4', alt: 'Oreo dancing', title: 'Daily goal complete!', icons: ['🎵', '🎶', '✨', '🎵'] },
    { src: 'oreo-puddle.mp4', alt: 'Oreo splashing in puddles in yellow rain boots', title: 'Splash-tastic! Goal complete!', icons: ['💧', '💦', '✨', '💧'] },
    { src: 'oreo-greenscreen.mp4', keyed: true, title: 'Oreo’s victory dance!', icons: ['🎵', '⭐', '✨', '🎶'] },
  ];
  function celebrate() {
    const n = streakNow();
    // alternate videos so the reward stays fresh — never the same one twice in a row
    const options = CELEBRATIONS.filter(c => c.src !== S.lastCeleb);
    const C = pick(options.length ? options : CELEBRATIONS);
    S.lastCeleb = C.src; save();
    const line = n === 1 ? 'You started a streak! Come back tomorrow to make it 2.' : n > 0 && n % 7 === 0 ? `${n / 7} full week${n > 7 ? 's' : ''} in a row! Oreo is SO proud!` : `${n} days in a row! Come back tomorrow to make it ${n + 1}.`;
    const notes = C.icons.map((s, i) => `<span style="left:${[2, 78, 10, 85][i]}%;top:${[30, 20, 70, 65][i]}%;animation-delay:${i * 0.4}s">${s}</span>`).join('');
    const media = C.keyed ? keyedHTML(C.src, 'celeb') : `<img src="oreo-face.png" alt="${C.alt}"><video src="${C.src}" autoplay loop muted playsinline preload="auto"></video>`;
    const ov = modal(`<div class="dance ${C.keyed ? 'free' : ''}">${media}<div class="notes">${notes}</div></div>
      <div class="streak-num">🔥 ${n}</div>
      <h2>${C.title}</h2><p>${line}</p>${weekRow()}`, [['Keep going', 'flame', null]], 'celebrate');
    if (C.keyed) { startKeyed(ov.querySelector('.keyed')); confetti(); return; }
    const v = ov.querySelector('video'), img = ov.querySelector('.dance img');
    const show = () => { v.classList.add('on'); img.style.animation = 'none'; v.play().catch(() => {}); };
    if (v.readyState >= 2) show(); else v.addEventListener('loadeddata', show);
    v.addEventListener('error', () => v.remove());
    confetti();
  }
  function tips() {
    modal(`<h2>💡 Oreo’s Test Tips</h2>
      <ul class="tips">
        <li><b>What it is:</b> the OLSAT (Otis-Lennon School Ability Test). It doesn’t test what you learned in class — it tests how you <i>think</i>: words, pictures, and numbers.</li>
        <li><b>Pace:</b> the upper-grade OLSAT is usually about 72 questions in about 40 minutes — roughly 30 seconds each. If one is taking forever, guess, mark it, and move on.</li>
        <li><b>Always answer:</b> you are scored on how many you get right. A wrong guess costs nothing, so never leave a blank.</li>
        <li><b>Eliminate:</b> cross out answers you know are wrong. Going from 5 choices to 2 doubles your chances.</li>
        <li><b>Read every choice</b> before picking — the first one that looks OK might be a trap.</li>
        <li><b>Pictures:</b> check one thing at a time — turning, flipping, counting, colors, inside shapes.</li>
        <li><b>About this app:</b> every puzzle here is an original practice puzzle in the same style as the OLSAT — not real test questions — so your scores here are for practice only.</li>
        <li><b>The day before:</b> a good night’s sleep. Test day is after school at 2:45, so eat a good snack first! 🍎</li>
      </ul>`, [['Got it!', 'green', null]]);
  }

  // ───────── events ─────────
  document.addEventListener('click', e => {
    const el = e.target.closest('button');
    if (!el || el.closest('.overlay')) return;
    const d = el.dataset;
    if (d.node) {
      const idx = NODES.findIndex(n => n.id === d.node);
      if (idx > currentIndex()) return modal(`<div class="oreo-say" style="margin:0">${face()}<div class="bubble"><span class="name">Professor Oreo</span>Not yet! Finish <b>${esc(NODES[currentIndex()].name)}</b> first — each step gets you ready for the next one. 🐾</div></div>`, [['OK', 'green', null]]);
      return startNode(d.node);
    }
    if (d.unit) { if (openUnits.has(d.unit)) openUnits.delete(d.unit); else openUnits.add(d.unit); return home(); }
    if (d.g) {
      const st = +d.g;
      if (st < 3) return guided(G.type, st, G.nodeId);
      return startPractice([G.type], TYPES[G.type].name, 5, null, G.nodeId);
    }
    if ('home' in d) return home();
    if ('review' in d) return startMission();
    if ('streak' in d) return streakInfo();
    if ('countdown' in d) return countdownInfo();
    if ('tests' in d) return testsMenu();
    if ('settings' in d) return settings();
    if (d.test) return testIntro(d.test);
    if ('hint' in d) return showHint();
    if ('tips' in d) return tips();
    if (d.opt !== undefined) {
      const i = +d.opt;
      if (el.closest('.review') || el.closest('.preview')) return;
      if (X) return testPick(i);
      if (!P && G && G.stage === 2 && screen.querySelector('.guide')) return guidedAnswer(i);
      if (P) return practiceAnswer(i);
    }
    if ('next' in d) return nextPractice();
    if ('again' in d) return P.step ? startPractice(P.types, P.label, P.total, null, P.step) : startMission();
    if ('quit' in d) return P.i > 0 ? modal('<h2>Leave for now?</h2><p>Your answers so far still count toward today’s goal. You can pick this step up again from your path.</p>', [['Stay', 'green', null], ['Leave', 'ghost', home]]) : home();
    if ('quittest' in d) return modal('<h2>Quit the test?</h2><p>This test won’t be scored.</p>', [['Keep going', 'green', null], ['Quit', 'red', () => { X = null; clearTest(); home(); }]]);
    if ('prev' in d) { X.i--; return renderTest(); }
    if ('tnext' in d) { X.i++; return renderTest(); }
    if (d.jump !== undefined) { X.i = +d.jump; return renderTest(); }
    if ('finish' in d) return askFinish();
  });

  document.addEventListener('keydown', e => {
    if (document.querySelector('.overlay') || e.metaKey || e.ctrlKey) return;
    const k = e.key.toUpperCase();
    const idx = '12345'.indexOf(k) >= 0 ? '12345'.indexOf(k) : LET.indexOf(k);
    if (idx >= 0 && k.length === 1) {
      const btn = screen.querySelector(`.opts:not(.locked) [data-opt="${idx}"]`);
      if (btn) btn.click();
    } else if (e.key === 'Enter' || e.key === 'ArrowRight') {
      const b = screen.querySelector('[data-next], [data-tnext], .g-next [data-g], #lesson-fb [data-g]');
      if (b) { e.preventDefault(); b.click(); }
    } else if (e.key === 'ArrowLeft') {
      const b = screen.querySelector('[data-prev]:not([disabled])');
      if (b) b.click();
    }
  });

  // deep links: #lesson/<type>
  const m = location.hash.match(/^#lesson\/(\w+)/);
  if (m && TYPES[m[1]]) lesson(m[1]); else home();

  // resume a test interrupted by a reload (e.g. the iPad put the tab to sleep)
  try {
    const st = JSON.parse(localStorage.getItem(TKEY) || 'null'), qs = JSON.parse(localStorage.getItem(TKEY + '-qs') || 'null');
    if (st && qs && qs.length === st.n) {
      const resume = () => { X = { ...st, qs }; if (X.end) timer = setInterval(tick, 500); renderTest(); };
      if (st.end && Date.now() >= st.end) { X = { ...st, qs }; finishTest(true); }
      else modal(`<h2>Resume your test?</h2><p>You have a ${esc(st.label)} in progress — ${st.picks.filter(p => p !== null).length} of ${st.n} answered.${st.end ? ' The clock kept running while you were away.' : ''}</p>`,
        [['Discard', 'ghost', clearTest], ['Resume', 'green', resume]]);
    } else if (st) clearTest();
  } catch { clearTest(); }
})();
