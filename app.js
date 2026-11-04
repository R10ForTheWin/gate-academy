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
      <div class="sub">OLSAT · Wed, March 3, 2027 · 2:45 PM<br>Multipurpose Room</div>
      ${d > 13 ? `<div><span class="weeks">${Math.floor(d / 7)} weeks · ${d * S.goal} questions at your daily goal</span></div>` : ''}
    </div>`;
  }
  function tile(t) {
    const T = TYPES[t], m = mastery(t);
    return `<button class="tile" data-lesson="${t}" style="--c:${CAT[T.cat].color}"><div class="ic">${T.icon}</div><div><div class="nm">${esc(T.name)}</div><div class="lv">${level(t)}${m !== null ? ` · ${Math.round(m * 100)}%` : ''}</div><div class="bar"><i style="width:${m === null ? 0 : Math.round(m * 100)}%"></i></div></div></button>`;
  }
  function suggestion() {
    const order = CATS.flatMap(c => c.types);
    const fresh = order.find(t => !S.stats[t]);
    if (fresh) return fresh;
    return order.slice().sort((a, b) => mastery(a) - mastery(b))[0];
  }

  // ───────── HOME ─────────
  function home() {
    stopTimer();
    const sug = suggestion(), T = TYPES[sug];
    const n = streakNow(), doneToday = met(todayKey());
    const greet = doneToday ? `Daily goal done — your streak is safe! 🔥 Want to keep going? Try another mission, or learn <b>${esc(T.name)}</b>.`
      : n > 0 ? `You’re on a <b>${n}-day streak</b>! Today’s mission mixes word, picture and number puzzles. Or learn something new: <b>${esc(T.name)}</b>.`
      : `Welcome to my academy, Rose! I’ll teach you every kind of puzzle on the OLSAT. Start with today’s mission, or with my lesson on <b>${esc(T.name)}</b>.`;
    const tests = S.tests.slice(-5).reverse();
    screen.innerHTML = `
      <div class="hero">
        <img src="oreo-face.png" alt="Professor Oreo">
        <div><h1>Oreo’s GATE Academy</h1><p>Thinking-skills training for the OLSAT</p></div>
        <div class="fish" title="Fish treats earned (1 per correct answer)">🐟 ${S.fish}</div>
      </div>
      <div class="dash">${streakCard()}${countdownCard()}</div>
      ${say(greet, `<div class="say-actions"><button class="btn flame" data-mission>🎯 Daily Mission · 10 questions</button><button class="btn ghost" data-lesson="${sug}">${T.icon} ${esc(T.name)} lesson</button></div>`)}
      <div class="tests">
        <button class="testbtn" data-test="mini"><span class="ic">⏱️</span><div class="t">Mini Test</div><div class="d">24 mixed questions · 14 minutes</div></button>
        <button class="testbtn" data-test="full"><span class="ic">📝</span><div class="t">Full Practice Test</div><div class="d">72 questions · 40 minutes · full length</div></button>
        <button class="testbtn" data-tips><span class="ic">💡</span><div class="t">Oreo’s Test Tips</div><div class="d">How the OLSAT works & how to beat it</div></button>
      </div>
      ${CATS.map(c => `
        <section class="cat" style="--c:${c.color}">
          <div class="cat-h"><h2>${c.name}</h2><span>${c.sub}</span><button class="mix" data-mix="${c.id}">Mixed practice ›</button></div>
          <div class="tiles">${c.types.map(tile).join('')}</div>
        </section>`).join('')}
      ${tests.length ? `<div class="card history"><h3>Recent tests</h3>${tests.map(t => `<div class="hrow"><span>${esc(t.label)} · ${new Date(t.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span><span>${t.score}/${t.n} (${Math.round(t.score / t.n * 100)}%)</span></div>`).join('')}</div>` : ''}
      <div class="settings">
        <div><b>Daily goal:</b> <span class="seg">${[5, 10, 20, 30].map(g => `<button data-goal="${g}" class="${S.goal === g ? 'on' : ''}">${g}</button>`).join('')}</span> <span style="color:var(--muted);font-weight:700">questions</span></div>
        <button class="link" data-reset>Reset progress</button>
      </div>
      <p class="fine">Original practice puzzles written for Rose by Professor Oreo. Not affiliated with Pearson or the official OLSAT — scores here are for practice and don’t predict official results.</p>`;
    window.scrollTo(0, 0);
  }

  // ───────── LESSON ─────────
  let lessonQ = null;
  function lesson(t) {
    stopTimer();
    const T = TYPES[t], c = CAT[T.cat];
    lessonQ = generate(t);
    screen.innerHTML = `
      <div class="lesson" style="--c:${c.color}">
        <div class="bar-top"><button class="btn ghost" data-home style="padding:8px 14px">‹ Academy</button><span class="tbadge">${c.name} · ${c.sub}</span></div>
        <h1>${T.icon} ${esc(T.name)}</h1>
        ${say(T.intro)}
        <div class="trick"><div class="h">🐾 Oreo’s Trick</div>${T.trick}</div>
        <div class="section-lbl">Try an example</div>
        <div id="lesson-q">${qHTML(lessonQ)}</div>
        <div id="hintbox">${hintBtn()}</div>
        <div id="lesson-fb"></div>
        <div class="lesson-actions">
          <button class="btn green" data-practice="${t}">Practice 10 questions ›</button>
          <button class="btn ghost" data-newex="${t}">New example</button>
        </div>
      </div>`;
    window.scrollTo(0, 0);
  }
  function lessonAnswer(i) {
    const q = lessonQ, box = screen.querySelector('#lesson-q .opts');
    if (!box || box.classList.contains('locked')) return;
    markOpts(box, q, i);
    clearHintBtn();
    const ok = i === q.answer;
    screen.querySelector('#lesson-fb').innerHTML = feedbackHTML(ok, q.explain, '');
  }

  // ───────── hints ─────────
  const hintBtn = () => '<button class="btn ghost hintbtn" data-hint>💡 Need a hint?</button>';
  function showHint() {
    const q = P && P.q && !P.answered && screen.querySelector('.bar-top [data-quit]') ? P.q : lessonQ;
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
  function missionSeq() {
    const verbal = shuffle([...CAT.verbal.types, ...CAT.reason.types]).slice(0, 5);
    return shuffle([...verbal, ...shuffle(CAT.figural.types).slice(0, 3), ...shuffle(CAT.quant.types).slice(0, 2)]);
  }
  function startPractice(types, label, total = 10, seq = null) {
    P = { types, label, total, seq, i: 0, score: 0, run: 0, hints: 0, q: null, answered: false, missed: [], fish0: S.fish, lastType: null, seen: new Set() };
    nextPractice();
  }
  function startMission() { startPractice(Object.keys(TYPES), '🎯 Daily Mission', 10, missionSeq()); }
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
          <button class="btn green" data-again>Practice again</button>
          <button class="btn ghost" data-home>Back to Academy</button>
        </div>
        ${P.missed.length ? `<div class="section-lbl">Review your misses</div><div class="review">${P.missed.map(reviewHTML).join('')}</div>` : ''}
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
    card.insertAdjacentHTML('beforeend', `${p === null ? '<div class="yours">You left this one blank — on test day, always guess!</div>' : ''}<div class="why">🐾 ${q.explain}</div><div style="margin-top:10px"><button class="link" data-lesson="${q.type}">Practice ${esc(TYPES[q.type].name)} ›</button></div>`);
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
        <div class="lesson-actions" style="justify-content:center"><button class="btn" data-home>Back to Academy</button></div>
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
    const cols = ['#ffc800', '#ff9600', '#58cc02', '#5b4bdb', '#ff4b4b', '#2f80ed', '#fff'];
    c.innerHTML = Array.from({ length: 90 }, () => `<i style="left:${Math.random() * 100}%;background:${pick(cols)};animation-duration:${2 + Math.random() * 2.5}s;animation-delay:${Math.random() * 0.8}s"></i>`).join('');
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 5500);
  }
  // ───────── green-screen Oreo: keyed live onto a canvas (works in Chrome and iPad Safari from one MP4) ─────────
  const keyedHTML = (src, cls = '') => `<div class="keyed ${cls}"><img src="oreo-face.png" alt="Oreo dancing" class="kfallback"><canvas width="360" height="640" aria-hidden="true"></canvas><video src="${src}" muted loop playsinline autoplay preload="auto"></video></div>`;
  function startKeyed(root) {
    const v = root.querySelector('video'), c = root.querySelector('canvas');
    if (!v || !c) return;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    const frame = () => {
      if (!root.isConnected) { v.pause(); return; }
      if (v.readyState >= 2) {
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
      }
      if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(frame); else requestAnimationFrame(frame);
    };
    v.play().catch(() => {});
    if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(frame); else requestAnimationFrame(frame);
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
    if (d.lesson) return lesson(d.lesson);
    if ('home' in d) return home();
    if (d.practice) return startPractice([d.practice], TYPES[d.practice].name);
    if (d.newex) return lesson(d.newex);
    if (d.mix) return startPractice(CAT[d.mix].types, `${CAT[d.mix].name} mix`);
    if (d.test) return modal(`<h2>${d.test === 'full' ? '📝 Full Practice Test' : '⏱️ Mini Test'}</h2><p>${d.test === 'full' ? '72 mixed questions. Timed mode gives you 40 minutes — about 33 seconds a question.' : '24 mixed questions. Timed mode gives you 14 minutes — about 35 seconds a question.'} You won’t see answers or hints until the end. Skip with <b>Next</b> and jump back with the number buttons.</p><p style="margin-top:8px">Choose <b>Untimed</b> to practice without the clock.</p>`, [['Untimed', 'ghost', () => startTest(d.test, false)], ['⏱ Timed', 'green', () => startTest(d.test, true)]]);
    if ('mission' in d) return startMission();
    if ('hint' in d) return showHint();
    if ('tips' in d) return tips();
    if (d.goal) { S.goal = +d.goal; save(); return home(); }
    if ('reset' in d) return modal('<h2>Reset all progress?</h2><p>This erases streaks, fish, scores, and test history on this device. It can’t be undone.</p>', [['Cancel', 'ghost', null], ['Reset', 'red', () => { S = { ...DEFAULTS, stats: {}, days: {}, tests: [] }; save(); home(); }]]);
    if (d.opt !== undefined) {
      const i = +d.opt;
      if (el.closest('#lesson-q')) return lessonAnswer(i);
      if (el.closest('.review')) return;
      if (X) return testPick(i);
      if (P) return practiceAnswer(i);
    }
    if ('next' in d) return nextPractice();
    if ('again' in d) return P.seq ? startMission() : startPractice(P.types, P.label, P.total);
    if ('quit' in d) return P.i > 0 ? modal('<h2>Leave practice?</h2><p>Your answers so far still count toward your streak.</p>', [['Stay', 'green', null], ['Leave', 'ghost', home]]) : home();
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
      const b = screen.querySelector('[data-next], [data-tnext]');
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
