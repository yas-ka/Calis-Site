/* UI layer. All data lives in localStorage on this device only. */
(function () {
  var KEY = 'calis.v1', E = Engine, D = DATA;
  var S = load(), view = 'today', W = null, M = null, OB = { days: 3, sex: 'm', hasBar: false, newbie: true }, CI = null, CP = null;
  var $app = document.getElementById('app'), $ov = document.getElementById('overlay'), $rest = document.getElementById('rest');
  var timer = null, sw = null, tick = null, deferredInstall = null;
  D.ORDER.forEach(function (t) { D.TRACKS[t].levels.forEach(function (l, i) { l.steps = (STEPS[t] || [])[i] || []; }); });
  var TCOL = { hs: '#b388ff', push: '#ff7a7a', dips: '#ff9f5a', pl: '#ff5fa2', pull: '#4cc9f0', fl: '#6c8cff', legs: '#3ddc97', post: '#8be28f', calves: '#c3e66a', core: '#ffd166', obl: '#ffb454', flex: '#d58cff' };
  var TICO = { hs: '🤸', push: '💪', dips: '🏋️', pl: '🛸', pull: '🧗', fl: '🦅', legs: '🦵', post: '🍑', calves: '🦶', core: '🔥', obl: '🌀', flex: '🧘' };
  function exByKey(t, i) { return D.TRACKS[t].levels[i]; }
  function howTo(t, lv, open) {
    var ex = exByKey(t, lv);
    return '<details class="how"' + (open ? ' open' : '') + '><summary>📖 How to do it, step by step</summary><div class="fig" data-fig="' + t + '|' + lv + '|' + TCOL[t] + '"></div><ol class="steps">' + ex.steps.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol></details>';
  }
  function ring(done, goal) {
    var c = 2 * Math.PI * 26, p = Math.min(1, done / goal);
    return '<svg class="ring" viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" class="rbg"/><circle cx="32" cy="32" r="26" class="rfg" stroke-dasharray="' + (c * p).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 32 32)"/><text x="32" y="37" text-anchor="middle" class="rtx">' + done + '/' + goal + '</text></svg>';
  }
  function streakWeeks(t) {
    var ws = E.weekStart(t), n = 0;
    for (var i = 1; i <= 52; i++) { var w = E.addDays(ws, -7 * i), c = S.sessions.filter(function (x) { return E.weekStart(x.date) === w; }).length; if (c >= Math.max(1, S.profile.days - 1)) n++; else break; }
    return n + (E.sessionsInWeek(S, t) >= S.profile.days ? 1 : 0);
  }
  function confetti() {
    var c = document.createElement('canvas'); c.className = 'confetti'; c.width = innerWidth; c.height = innerHeight; document.body.appendChild(c);
    var x = c.getContext('2d'), cols = ['#3ddc97', '#2bb6c9', '#ffd166', '#ff7a7a', '#b388ff'], ps = [], t0 = Date.now();
    for (var i = 0; i < 120; i++) ps.push({ x: Math.random() * c.width, y: -20 - Math.random() * c.height * 0.4, vx: Math.random() * 2 - 1, vy: 2 + Math.random() * 4, r: 3 + Math.random() * 4, c: cols[i % 5], a: Math.random() * 6 });
    (function f() { x.clearRect(0, 0, c.width, c.height); ps.forEach(function (p) { p.x += p.vx; p.y += p.vy; p.a += 0.15; x.fillStyle = p.c; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); x.restore(); }); if (Date.now() - t0 < 2600) requestAnimationFrame(f); else c.remove(); })();
  }
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferredInstall = e; if (S && view === 'settings') render(); });
  if (S && (S.v < 3 || D.ORDER.some(function (t) { return !S.tracks[t]; }))) { E.migrate(S); save(); }

  function load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function today() { return E.ymd(); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function chip(on, act, attrs, label, cls) { return '<button class="chip ' + (on ? 'on ' : '') + (cls || '') + '" data-act="' + act + '" ' + attrs + '>' + label + '</button>'; }
  function num(id) { var v = parseFloat(val(id)); return isNaN(v) ? 0 : v; }

  /* ================= ONBOARDING ================= */
  function renderOnboarding() {
    $app.innerHTML =
      '<h1>Welcome 👋</h1><p class="mut">Goal: a lean, strong, flexible body, and one day a handstand push-up. I plan, track and adjust everything for you. Five quick questions and you are in.</p>' +
      '<div class="card"><label class="f" style="margin-top:0">Your name</label><input id="ob-name" type="text" placeholder="Name">' +
      '<label class="f">Body weight (kg)</label><input id="ob-w" type="number" inputmode="decimal" placeholder="e.g. 72">' +
      '<label class="f">Height (cm) and age <span class="xs mut">(for your calorie target and body-fat estimate)</span></label><div class="row"><input id="ob-h" type="number" inputmode="numeric" placeholder="Height cm"><input id="ob-a" type="number" inputmode="numeric" placeholder="Age"></div>' +
      '<label class="f">Formula for those estimates</label><div class="row">' + chip(OB.sex === 'm', 'ob', 'data-k="sex" data-v="m"', 'Male') + chip(OB.sex === 'f', 'ob', 'data-k="sex" data-v="f"', 'Female') + '</div>' +
      '<label class="f">Workouts per week</label><div class="row">' + chip(OB.days === 3, 'ob', 'data-k="days" data-v="3"', '3 days (recommended)') + chip(OB.days === 4, 'ob', 'data-k="days" data-v="4"', '4 days') + '</div>' +
      '<label class="f">Pull-up bar at home?</label><div class="row">' + chip(OB.hasBar, 'ob', 'data-k="hasBar" data-v="1"', 'Yes') + chip(!OB.hasBar, 'ob', 'data-k="hasBar" data-v="0"', 'Not yet') + '</div><p class="xs mut">No bar? You pull using a sturdy table. You can change this later.</p></div>' +
      '<div class="card"><h3>Where are you starting from?</h3><div class="row" style="margin-top:8px">' + chip(OB.newbie, 'ob', 'data-k="newbie" data-v="1"', '🌱 New to exercise') + chip(!OB.newbie, 'ob', 'data-k="newbie" data-v="0"', '💪 I already train') + '</div>' +
      (OB.newbie ? '<p class="sm" style="margin:10px 0 0">No tests needed. You start at the very first step of every exercise with a gentle first week, and the app moves you up automatically as you get stronger.</p>' :
        '<p class="sm mut" style="margin:10px 0 6px">Honest numbers, 0 is fine. Stop each test the moment your form breaks.</p>' +
        '<label class="f">Push-ups in a row <span class="xs mut">(full, chest near the floor)</span></label><input id="ob-pu" type="number" inputmode="numeric" value="0">' +
        '<label class="f">Pull-ups in a row <span class="xs mut">(0 if no bar)</span></label><input id="ob-pl" type="number" inputmode="numeric" value="0">' +
        '<label class="f">Bodyweight squats in a row</label><input id="ob-sq" type="number" inputmode="numeric" value="10">' +
        '<label class="f">Plank hold on forearms <span class="xs mut">(seconds)</span></label><input id="ob-pk" type="number" inputmode="numeric" value="20">' +
        '<label class="f">Chest-to-wall handstand hold <span class="xs mut">(seconds, 0 if none)</span></label><input id="ob-hs" type="number" inputmode="numeric" value="0">') + '</div>' +
      '<p class="xs mut">Not medical advice. If you have an injury, heart or blood-pressure issues, or are unwell, check with a doctor before starting.</p>' +
      '<button class="btn pri blk big" data-act="obdone">Start my plan</button>';
  }

  var TOUR = [
    ['👋', 'Welcome', 'This app is your coach. You never plan or track by hand: open it, answer a 10-second check-in, and follow the guided workout.'],
    ['🎬', 'Guided workouts', 'Each exercise shows a demo and steps the first time you meet it. Tap Done after each set. Rest timers run themselves and move you on, and your session saves itself at the end.'],
    ['🪜', 'It levels you up for you', 'Hit the rep goal with good form and the next, harder exercise unlocks automatically. If something is too hard or hurts, it eases off. There is nothing to mark or update.'],
    ['🍛', 'Food and check-ins', 'Meals come with exact recipes and nutrients. Every 2 weeks a quick checkpoint tunes your calories and training automatically. Add the app to your home screen for the best experience.']
  ];
  function showTour(i) {
    var s = TOUR[i];
    $ov.hidden = false;
    $ov.innerHTML = '<div class="tour"><div class="tico">' + s[0] + '</div><h1>' + s[1] + '</h1><p class="mut">' + s[2] + '</p><div class="sdots" style="justify-content:center;margin:18px 0">' + TOUR.map(function (x, j) { return '<i class="' + (j === i ? 'cur' : j < i ? 'on' : '') + '"></i>'; }).join('') + '</div>' +
      '<button class="btn pri blk big" data-act="tournext" data-v="' + i + '">' + (i === TOUR.length - 1 ? 'Let\'s go' : 'Next') + '</button><button class="btn ghost blk" data-act="tourskip">Skip</button></div>';
  }

  /* ================= TAB BAR ================= */
  var TABS = [['today', '🏠', 'Today'], ['plan', '🪜', 'Levels'], ['meals', '🍛', 'Meals'], ['progress', '📈', 'Progress'], ['settings', '⚙️', 'Settings']];
  function tabbar() { return '<nav class="tabbar">' + TABS.map(function (t) { return '<button class="' + (view === t[0] ? 'on' : '') + '" data-act="tab" data-v="' + t[0] + '"><span>' + t[1] + '</span>' + t[2] + '</button>'; }).join('') + '</nav>'; }

  function errList(ex, cls) {
    return '<div class="errs ' + (cls || '') + '"><div class="xs"><b>⚠ Common mistakes: check yourself</b></div><ul>' + (ex.err || []).map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul></div>';
  }

  /* ================= TODAY ================= */
  function weekStripHtml(t) {
    return '<div class="strip">' + E.weekStrip(S, t).map(function (d) {
      return '<div class="sd ' + (d.today ? 'today ' : '') + (d.done ? 'done' : d.past ? 'past' : '') + '"><span>' + d.label + '</span><b>' + (d.done ? '✓' : '·') + '</b></div>';
    }).join('') + '</div>';
  }
  /* the single most useful thing to do right now, derived from everything the app knows */
  function nextAction(t, st) {
    var plan = S.plan && S.plan.date === t ? S.plan : null;
    if (S.draft && S.draft.date === t && !W) return { ic: '▶️', t: 'Pick up where you left off', d: 'Your workout is saved. Resume exactly where you stopped, or end it and save what you did.', b: 'Resume workout', a: 'resume', b2: 'End & save what I did', a2: 'endearly' };
    if (E.checkpointDue(S, t)) return { ic: '📋', t: 'Checkpoint time', d: 'A 2-minute review of weight, waist, strength and how you feel. I use it to tune your calories and training automatically.', b: 'Do checkpoint', a: 'cpopen' };
    if (st.k === 'done') {
      var m = nextMeal();
      return { ic: '🍽️', t: 'Refuel and recover', d: m ? 'Next in your plan: ' + m.n + ' (' + m.p + ' g protein).' : 'All of today\'s meals are logged. Nice work.', b: m ? 'Open meals' : '', a: 'tab', v: 'meals' };
    }
    if (st.k === 'rest' || (plan && plan.rest)) {
      var hab = S.habits[t] || {}, nx = E.previewSession(S, t);
      return { ic: '🧘', t: 'Recovery day', d: (plan && plan.rest ? 'Based on how you feel, training would cost more than it gives. ' : st.why + ' ') + 'Next workout: ' + nx.name + '.', b: hab.mob ? '✅ Mobility done. Do it again' : '10-minute mobility routine', a: 'mob' };
    }
    return null;
  }
  function viewToday() {
    var t = today(), st = E.status(S, t), wk = E.weekNumber(S, t), dl = E.isDeload(S, t), done = E.sessionsInWeek(S, t);
    var h = '<div class="row sp"><div><div class="mut sm">' + new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' }) + '</div><h1>Hi' + (S.profile.name ? ', ' + esc(S.profile.name) : '') + '</h1></div>' + ring(done, S.profile.days) + '</div>' +
      '<div class="row wrap" style="margin-bottom:6px"><span class="pill g">Week ' + wk + '</span>' + (dl ? '<span class="pill w">Deload week</span>' : '') + '<span class="pill">' + done + '/' + S.profile.days + ' sessions</span>' + (streakWeeks(t) > 0 ? '<span class="pill w">🔥 ' + streakWeeks(t) + ' wk streak</span>' : '') + '</div>' + weekStripHtml(t);

    var na = nextAction(t, st);
    if (na) h += '<div class="card hero"><div class="row"><div class="hico">' + na.ic + '</div><div><div class="xs mut">NEXT STEP</div><h3>' + na.t + '</h3></div></div><p class="sm" style="margin:8px 0 0">' + esc(na.d) + '</p>' +
      (na.b ? '<button class="btn pri blk big" data-act="' + na.a + '"' + (na.v ? ' data-v="' + na.v + '"' : '') + '>' + na.b + '</button>' : '') + (na.b2 ? '<button class="btn ghost blk" data-act="' + na.a2 + '">' + na.b2 + '</button>' : '') + '</div>';

    if (st.k === 'train' && !(S.draft && S.draft.date === t && !W)) {
      var plan = S.plan && S.plan.date === t ? S.plan : null;
      if (!plan) h += checkinCard();
      else if (!plan.rest) h += planCard(plan);
    }
    if (st.k === 'done') h += doneCard();

    var hs = S.tracks.hs, hsN = E.levels('hs').length;
    h += '<div class="card"><div class="row sp"><h3>🎯 Dream: handstand push-up</h3><span class="pill g">step ' + (hs.level + 1) + '/' + hsN + '</span></div><div class="bar" style="margin:8px 0"><i style="width:' + Math.round((hs.level + 1) / hsN * 100) + '%"></i></div>' +
      '<div class="sm mut">Now: ' + esc(E.exAt('hs', hs.level).n) + '. Wall handstand push-up is step 7. The app moves you up by itself.</div></div>';

    var ms = E.mealStats(S, t), pt = E.proteinTarget(S), hab2 = S.habits[t] || {}, kt = E.calorieTarget(S, t), ke = E.kcalEaten(S, t);
    h += '<div class="card"><div class="row sp"><h3>Protein today</h3><span class="mut sm">' + ms.protein + ' / ' + pt + ' g</span></div><div class="bar" style="margin-top:8px"><i style="width:' + Math.min(100, Math.round(ms.protein / pt * 100)) + '%"></i></div>' +
      (kt ? '<div class="sm mut" style="margin-top:8px">Energy: ~' + ke + ' of ~' + kt + ' kcal (adjusts to training days and your checkpoints)</div>' : '') +
      '<div class="row sp" style="margin-top:10px"><span class="sm mut">Fermented food: ' + (ms.ferm ? '✅' : '⬜') + '</span><button class="btn sm ghost" data-act="tab" data-v="meals">Meals →</button></div></div>' +
      '<div class="card"><h3>Daily basics</h3><div class="row sp" style="margin-top:8px"><span>💧 Water</span><div class="row"><button class="chip" data-act="water" data-d="-1">−</button><b>' + (hab2.water || 0) + '</b><span class="mut sm">/ 8</span><button class="chip" data-act="water" data-d="1">+</button></div></div>' +
      '<div class="row wrap" style="margin-top:10px">' + chip(hab2.sleep, 'hab', 'data-k="sleep"', '😴 Slept 7h+') + chip(hab2.veg, 'hab', 'data-k="veg"', '🥦 2+ veg servings') + chip(hab2.clean, 'hab', 'data-k="clean"', '🚫 No sugary drinks / packaged snacks') + chip(hab2.walk, 'hab', 'data-k="walk"', '🚶 20 min walk') + '</div></div>';
    h += '<h2>Insights</h2><div class="card">' + E.insights(S, t).map(function (x) { return '<div class="msg">' + esc(x) + '</div>'; }).join('') + '</div>';
    return h;
  }

  function doneCard() {
    var last = S.sessions[S.sessions.length - 1], nx = E.previewSession(S, today());
    return '<div class="card hl"><h3>Today\'s session ✅</h3><ul class="clean sm">' + last.ex.map(function (e) { return '<li class="row sp"><span>' + TICO[e.track] + ' ' + esc(e.n) + '</span><span class="mut">' + e.reps.join(' · ') + '</span></li>'; }).join('') + '</ul>' +
      '<div class="sm" style="margin-top:8px">📅 Next: <b>' + esc(nx.name) + '</b>' + (E.sessionsInWeek(S, today()) >= S.profile.days ? ' next week.' : ' after a rest day.') + '</div></div>';
  }

  function checkinCard() {
    if (!CI) {
      var pre = E.suggestSoreness(S, today());
      CI = { soreness: { push: 0, pull: 0, legs: 0, core: 0, hs: 0, post: 0 }, energy: 3, pre: [], open: false };
      Object.keys(pre).forEach(function (k) { if (pre[k] > 0) { CI.soreness[k] = pre[k]; CI.pre.push(D.TRACKS[k].group); } });
    }
    var anySore = D.CHECK.some(function (t) { return CI.soreness[t] > 0; });
    var EN = ['😫 Drained', '😕 Low', '🙂 OK', '😀 Good', '🔥 Great'];
    var h = '<div class="card hl" id="ci"><h3>10-second check-in</h3><p class="sm mut" style="margin:4px 0 8px">Tell me how you feel and I build today\'s workout around it.</p><div class="xs"><b>Energy</b></div><div class="row wrap" style="margin-top:6px">' +
      [1, 2, 3, 4, 5].map(function (n) { return chip(CI.energy === n, 'energy', 'data-v="' + n + '"', EN[n - 1]); }).join('') + '</div>' +
      (CI.pre.length ? '<div class="sm" style="margin-top:10px">📝 Pre-filled from your last workout: <b>' + CI.pre.map(esc).join(', ') + '</b> may still be sore. Change it if that is wrong.</div>' : '') +
      '<details class="how"' + (anySore || CI.open ? ' open' : '') + '><summary>Anything sore or painful?</summary>';
    D.CHECK.forEach(function (t) {
      h += '<div style="margin-top:10px"><div class="sm"><b>' + D.TRACKS[t].group + '</b></div><div class="row wrap" style="margin-top:6px">' +
        D.SORE.map(function (l, i) { return chip(CI.soreness[t] === i, 'sore', 'data-t="' + t + '" data-v="' + i + '"', l, i === 2 ? 'w' : i === 3 ? 'b' : ''); }).join('') + '</div></div>';
    });
    return h + '</details><button class="btn pri blk big" data-act="build">Build today\'s workout</button></div>';
  }

  function label(it) { return it.sets + ' × ' + it.target + (it.ex.t === 'hold' ? ' s' : '') + (it.ex.side ? ' / side' : ''); }
  function planCard(p) {
    var h = '<div class="card hl"><div class="row sp"><h3>Today: ' + esc(p.name || 'Workout ' + p.type) + '</h3><span class="pill">~' + (10 + p.items.length * 6) + ' min</span></div>';
    h += '<ul class="clean">' + p.items.map(function (it) { return '<li><div class="row sp"><span><span class="xs" style="color:' + TCOL[it.track] + '">' + TICO[it.track] + ' ' + D.TRACKS[it.track].label + (S.seen[it.track + ':' + it.level] ? '' : ' · 🆕 new') + '</span><br><b>' + esc(it.ex.n) + '</b></span><span class="mut">' + label(it) + '</span></div></li>'; }).join('') + '</ul>';
    p.skipped.forEach(function (s) { h += '<div class="sm" style="color:var(--warn);margin-top:8px">⚠ ' + esc(s.reason) + '</div>'; });
    p.notes.forEach(function (n) { h += '<div class="sm mut" style="margin-top:6px">• ' + esc(n) + '</div>'; });
    return h + '<button class="btn pri blk big" data-act="start">Start guided workout</button><button class="btn ghost blk" data-act="redo">Change my check-in</button></div>';
  }

  /* ================= LEVELS ================= */
  function roadmapCard() {
    var rows = D.ROADMAP.map(function (r) {
      var t = r[1], lv = S.tracks[t].level, need = r[2], L = E.levels(t), locked = L[need].bar && !S.profile.hasBar, done = lv >= need;
      var pct = done ? 100 : Math.round((lv + 1) / (need + 1) * 100);
      return '<div style="margin-top:12px"><div class="row sp sm"><span>' + (done ? '✅ ' : locked ? '🔒 ' : '') + esc(r[0]) + '</span><span class="xs mut">' + (done ? 'unlocked' : locked ? 'needs a bar' : 'step ' + (lv + 1) + ' of ' + (need + 1)) + '</span></div><div class="bar" style="margin-top:5px"><i style="width:' + pct + '%"></i></div></div>';
    }).join('');
    return '<div class="card"><h3>🏆 Skill roadmap</h3><p class="xs mut" style="margin:4px 0 0">Every milestone below has a ladder behind it, trained weekly. Elite skills (planche, front lever, human flag) usually take 1-3+ years of patient practice, so the app paces tendon-heavy skills slowly on purpose.</p>' + rows + '</div>';
  }
  function goalText(t) {
    var g = E.goalFor(S, t);
    return (g.hold ? 'hold ' + g.max + ' seconds' : 'reach ' + g.max + ' reps') + ' (now ' + g.target + ')' + (g.next ? ', with good form in 2 sessions, and I unlock <b>' + esc(g.next) + '</b> automatically.' : '. You are at the top for your equipment.');
  }
  function viewPlan() {
    var h = '<h1>Your ladders</h1><p class="mut sm">Twelve tracks cover the whole body. Every session you train a mix, and over a week every area gets hit. You move up only after hitting the top of the rep range in two sessions (three for planche and front lever). You never have to mark anything: the app moves you up by itself. Tap a level only if you want to correct where you start.</p>' + roadmapCard();
    h += '<div class="card"><h3>Weekly split</h3><ul class="clean sm"><li><b>Upper body:</b> handstand, push-ups, dips, pulling, core, flexibility</li><li><b>Legs &amp; posterior:</b> squats and lunges, hamstrings and glutes, calves, handstand, flexibility</li><li><b>Skills &amp; core:</b> handstand, planche, front lever, core, obliques and flags, flexibility</li></ul><div class="xs mut" style="margin-top:6px">They rotate A, B, C, so 3 sessions a week hit every body part; a 4th adds extra practice.</div></div>';
    D.CATS.forEach(function (c) {
      h += '<h2>' + c[0] + '</h2>';
      c[1].forEach(function (t) {
        var tr = S.tracks[t], L = E.levels(t), cur = E.exAt(t, tr.level), locked = cur.bar && !S.profile.hasBar;
        h += '<details class="card"><summary><span class="row sp"><span>' + (t === 'hs' ? '🎯 ' : '') + '<b>' + D.TRACKS[t].label + '</b> <span class="xs mut">' + esc(cur.n) + '</span></span><span class="pill g">' + (tr.level + 1) + '/' + L.length + '</span></span></summary>' +
          '<div class="xs mut">' + D.TRACKS[t].group + '</div><div class="ladder">';
        L.forEach(function (e, i) {
          var lock = e.bar && !S.profile.hasBar, cl = lock ? 'lock' : i === tr.level ? 'cur' : i < tr.level ? 'done' : '';
          h += '<div class="l ' + cl + '" ' + (lock ? '' : 'data-act="setlevel" data-t="' + t + '" data-v="' + i + '"') + '><span>' + (i < tr.level ? '✓' : i === tr.level ? '▶' : lock ? '🔒' : '○') + '</span><span class="grow">' + esc(e.n) + '</span><span class="xs mut">' + e.r[0] + '-' + e.r[1] + (e.t === 'hold' ? 's' : '') + '</span></div>';
        });
        h += '</div>' + (locked ? '<div class="sm" style="color:var(--warn);margin-top:8px">Needs a pull-up bar (or sturdy pole). Skipped until you have one.</div>' : '<div class="goal" style="margin-top:8px">🎯 <b>To move up:</b> ' + goalText(t) + '</div><div class="sm mut" style="margin-top:8px"><b>Now:</b> ' + esc(cur.cue) + '</div>' + howTo(t, tr.level, true) + errList(cur)) + '</details>';
      });
    });
    h += '<div class="card"><h3>How it adapts</h3><ul class="clean sm"><li>Every 4th week is a lighter <b>deload</b> week.</li><li><b>Very sore</b> area: one set fewer and a lighter target.</li><li><b>Sharp pain</b>: that area is skipped. Pain twice in 3 weeks steps you back a level.</li><li><b>Too hard</b> twice in a row: drop back a level and rebuild.</li><li>During a workout, a failed set lowers the next sets automatically.</li><li>Checkpoints can trigger a light week if your joints or recovery are complaining.</li></ul></div>';
    return h;
  }


  /* ---- meal nutrition helpers ---- */
  function macroRow(m) {
    var n = m.nut, kc = n.kcal || 1, pc = Math.round(n.p * 4 / kc * 100), cc = Math.round(n.c * 4 / kc * 100), fc = Math.max(0, 100 - pc - cc);
    return '<div class="macros"><div><b>' + n.kcal + '</b><span>kcal</span></div><div><b>' + n.p + 'g</b><span>protein</span></div><div><b>' + n.c + 'g</b><span>carbs</span></div><div><b>' + n.fat + 'g</b><span>fat</span></div><div><b>' + n.fib + 'g</b><span>fibre</span></div></div>' +
      '<div class="msplit" title="share of calories"><i style="width:' + pc + '%;background:#3ddc97"></i><i style="width:' + cc + '%;background:#ffd166"></i><i style="width:' + fc + '%;background:#ff9f5a"></i></div><div class="xs mut" style="margin-top:3px">Calories from <span style="color:#3ddc97">protein ' + pc + '%</span> · <span style="color:#ffd166">carbs ' + cc + '%</span> · <span style="color:#ff9f5a">fat ' + fc + '%</span></div>';
  }
  function recipeHtml(m) {
    return '<details class="how"><summary>🍳 Recipe &amp; exact portions</summary><table class="ingt">' + m.ing.map(function (x) { return '<tr><td>' + esc(x.n) + (x.hh ? '<div class="xs mut">' + esc(x.hh) + '</div>' : '') + '</td><td>' + x.g + ' g</td></tr>'; }).join('') + '</table>' +
      '<ol class="steps">' + m.steps.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>' +
      '<div class="xs mut">Weights are raw/dry (before cooking) for one serving. Also: iron ' + m.nut.fe + ' mg · calcium ' + m.nut.ca + ' mg. ' + esc(D.SPICE_NOTE) + '</div></details>';
  }
  function nutCard(ms, t) {
    var n = ms.nut, p = S.profile, ironT = p.sex === 'f' ? 29 : 19, kt = E.calorieTarget(S, t), pt = E.proteinTarget(S);
    function row(l, v, tgt, u, col) { return '<div class="nrow"><span>' + l + '</span><div class="bar"><i style="width:' + Math.min(100, Math.round(v / tgt * 100)) + '%;background:' + col + '"></i></div><b>' + Math.round(v) + (tgt ? ' / ' + tgt : '') + ' ' + u + '</b></div>'; }
    return '<div class="card"><h3>Today\'s nutrients</h3><div class="xs mut" style="margin-bottom:6px">From the meals you ticked as eaten.</div>' +
      row('Energy', n.kcal, kt || 2000, 'kcal', '#2bb6c9') + row('Protein', ms.protein, pt, 'g', '#3ddc97') + row('Fibre', n.fib, 30, 'g', '#8be28f') +
      row('Calcium', n.ca, 1000, 'mg', '#ffd166') + row('Iron', n.fe, ironT, 'mg', '#ff7a7a') +
      '<div class="xs mut" style="margin-top:6px">Carbs ' + Math.round(n.c) + ' g · Fat ' + Math.round(n.fat) + ' g. Iron from plants absorbs less well: pair it with lemon or other vitamin C foods. Targets are general adult guides (protein 1.8 g/kg for fat loss, fibre 30 g, calcium 1000 mg, iron per ICMR-NIN).</div></div>';
  }

  /* ================= MEALS ================= */
  function viewMeals() {
    var t = today(), rec = E.dayRec(S, t), ms = E.mealStats(S, t), pt = E.proteinTarget(S), pl = E.plantsThisWeek(S, t), kt = E.calorieTarget(S, t), ke = E.kcalEaten(S, t);
    var h = '<h1>Today\'s meals</h1><p class="mut sm">Vegetarian household food. Tick what you eat, swap what you don\'t fancy. Protein target ≈ ' + pt + ' g (1.8 g/kg to protect muscle while losing fat). Numbers are rough estimates.</p>' +
      '<div class="card"><div class="row sp"><b>Protein</b><span>' + ms.protein + ' / ' + pt + ' g</span></div><div class="bar" style="margin:8px 0"><i style="width:' + Math.min(100, Math.round(ms.protein / pt * 100)) + '%"></i></div>' +
      (kt ? '<div class="row sp"><b>Energy</b><span>~' + ke + ' / ~' + kt + ' kcal</span></div><div class="bar" style="margin:8px 0"><i style="width:' + Math.min(100, Math.round(ke / kt * 100)) + '%"></i></div>' : '<div class="xs mut">Add height and age in Settings to see a calorie target.</div>') +
      '<div class="row sp sm"><span>🌿 Plant variety this week</span><b>' + pl + ' / 30</b></div><div class="bar" style="margin:6px 0"><i style="width:' + Math.min(100, Math.round(pl / 30 * 100)) + '%"></i></div>' +
      '<div class="xs mut">"Detox" is really your gut, liver and kidneys doing their job. Help them with fibre, plenty of plants, curd or buttermilk daily, water, little sugar and ultra-processed food, and good sleep. No juice cleanses needed.</div>' + (kt ? '<div class="xs mut" style="margin-top:6px">Your calorie target is set automatically: a gentle deficit, +100 on training days, -100 on rest days, and nudged by your checkpoints.</div>' : '') + '</div>';
    h += nutCard(ms, t);
    E.SLOTS.forEach(function (sl) {
      var m = E.pickMeal(S, t, sl), on = rec.done[sl];
      h += '<div class="card"><div class="row sp"><span class="pill">' + cap(sl) + '</span><span class="xs mut">~' + m.p + ' g protein · ' + m.k + ' kcal' + (m.f ? ' · fermented' : '') + '</span></div>' +
        '<div style="margin:8px 0;font-weight:600">' + esc(m.n) + '</div>' + macroRow(m) + recipeHtml(m) + '<div class="xs mut" style="margin-top:6px">🌿 ' + m.pl.map(esc).join(' · ') + '</div>' +
        '<div class="row" style="margin-top:10px"><button class="btn sm ' + (on ? 'pri' : '') + '" data-act="eat" data-v="' + sl + '">' + (on ? '✓ Eaten' : 'Mark eaten') + '</button><button class="btn sm ghost" data-act="swap" data-v="' + sl + '">↻ Swap</button></div></div>';
    });
    if (ms.protein < pt) h += '<div class="card"><b>Short on protein? Add:</b><div class="row wrap" style="margin-top:8px">' + D.BOOSTERS.map(function (b, i) { return chip(rec.extra[i], 'boost', 'data-v="' + i + '"', b.n + ' +' + b.p + 'g'); }).join('') + '</div></div>';
    h += '<div class="card"><b>Pantry staples to keep stocked</b><div class="row wrap" style="margin-top:8px">' + D.PANTRY.map(function (x) { return '<span class="pill">' + x + '</span>'; }).join('') + '</div></div>';
    return h;
  }

  /* ================= PROGRESS ================= */
  function barChart(vals, labels, max) {
    var w = 300, h = 90, bw = w / vals.length, m = Math.max(max || 1, Math.max.apply(null, vals));
    var s = '<svg viewBox="0 0 ' + w + ' ' + (h + 16) + '" width="100%">';
    vals.forEach(function (v, i) { var bh = Math.round(v / m * h); s += '<rect x="' + (i * bw + 4) + '" y="' + (h - bh) + '" width="' + (bw - 8) + '" height="' + Math.max(bh, 2) + '" rx="4" fill="' + (v ? '#3ddc97' : '#2a313c') + '"/><text x="' + (i * bw + bw / 2) + '" y="' + (h + 12) + '" text-anchor="middle">' + labels[i] + '</text>'; });
    return s + '</svg>';
  }
  function line(vals, color) {
    if (vals.length < 2) return '<div class="xs mut">Needs at least two entries to show a trend.</div>';
    var w = 300, h = 70, mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals), r = (mx - mn) || 1;
    var pts = vals.map(function (v, i) { return (i / (vals.length - 1) * (w - 10) + 5).toFixed(1) + ',' + (h - 8 - (v - mn) / r * (h - 16)).toFixed(1); }).join(' ');
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%"><polyline points="' + pts + '" fill="none" stroke="' + (color || '#2bb6c9') + '" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  var VCOL = { good: 'g', watch: 'w', adjust: 'w' }, VTXT = { good: 'On track', watch: 'Keep an eye', adjust: 'Adjust' }, VICON = { good: '✅', watch: '⚠️', bad: '🛑' };
  function viewProgress() {
    var t = today(), ws = E.weekStart(t), vals = [], labs = [];
    for (var i = 7; i >= 0; i--) { var w = E.addDays(ws, -7 * i); vals.push(S.sessions.filter(function (x) { return E.weekStart(x.date) === w; }).length); labs.push(w.slice(5)); }
    var streakWeeks = 0; for (var j = vals.length - 2; j >= 0 && vals[j] >= S.profile.days - 1 && vals[j] > 0; j--) streakWeeks++;
    var cps = S.checkpoints, lastCp = cps[cps.length - 1];
    var h = '<h1>Progress</h1>' +
      '<div class="card hl"><div class="row sp"><h3>📋 Checkpoints</h3><span class="xs mut">every ' + (S.profile.cpEvery === 7 ? 'week' : '2 weeks') + '</span></div>' +
      (lastCp ? '<div class="row sp" style="margin-top:8px"><span class="sm">Last: ' + lastCp.date + '</span><span class="pill ' + VCOL[lastCp.verdict] + '">' + VTXT[lastCp.verdict] + '</span></div>' : '<div class="sm mut" style="margin-top:6px">No checkpoint yet. Do the first one now to set your baseline.</div>') +
      '<button class="btn pri blk" data-act="cpopen">' + (E.checkpointDue(S, t) ? 'Do checkpoint (due)' : 'Do a checkpoint now') + '</button></div>' +
      '<div class="grid2"><div class="card"><div class="mut sm">Total sessions</div><h1>' + S.sessions.length + '</h1></div><div class="card"><div class="mut sm">Consistent weeks</div><h1>' + streakWeeks + '</h1></div></div>' +
      '<div class="card"><h3>Sessions per week</h3>' + barChart(vals, labs, S.profile.days) + '</div>';
    h += '<div class="card"><h3>All tracks</h3>' + D.ORDER.map(function (tr) {
      var st = S.tracks[tr], L = E.levels(tr), e = E.exAt(tr, st.level);
      return '<div style="margin-top:10px"><div class="row sp sm"><span>' + D.TRACKS[tr].label + '</span><span class="xs mut">' + esc(e.n) + '</span></div><div class="bar" style="margin-top:4px"><i style="width:' + Math.round((st.level + 1) / L.length * 100) + '%"></i></div></div>';
    }).join('') + '</div>';
    var cis = S.checkins.slice(-8);
    h += '<div class="card"><h3>Soreness (last ' + cis.length + ' check-ins)</h3>';
    if (!cis.length) h += '<div class="xs mut">Appears after your first check-in.</div>';
    if (cis.length) D.CHECK.forEach(function (tr) {
      h += '<div class="row sp" style="margin-top:8px"><span class="sm">' + D.TRACKS[tr].label + '</span><span>' + cis.map(function (c) { var v = (c.soreness && c.soreness[tr]) || 0; return '<span style="color:' + ['#3ddc97', '#8bd9b4', '#ffb454', '#ff6b6b'][v] + '">●</span>'; }).join(' ') + '</span></div>';
    });
    h += '</div>';
    var wv = S.weights.map(function (x) { return x.kg; });
    h += '<div class="card"><div class="row sp"><h3>Body weight</h3><span class="sm mut">' + wv[wv.length - 1] + ' kg</span></div>' + line(wv) + '</div>';
    var wa = cps.filter(function (c) { return c.waist; }).map(function (c) { return c.waist; }), bfs = cps.filter(function (c) { return c.bf; }).map(function (c) { return c.bf; });
    if (wa.length) h += '<div class="card"><div class="row sp"><h3>Waist</h3><span class="sm mut">' + wa[wa.length - 1] + ' cm</span></div>' + line(wa, '#3ddc97') + '</div>';
    if (bfs.length) h += '<div class="card"><div class="row sp"><h3>Body fat (estimate)</h3><span class="sm mut">' + bfs[bfs.length - 1] + '%</span></div>' + line(bfs, '#ffb454') + '</div>';
    if (cps.length) {
      h += '<h2>Checkpoint history</h2>' + cps.slice().reverse().map(function (c) {
        return '<details class="card"><summary><span class="pill ' + VCOL[c.verdict] + '">' + VTXT[c.verdict] + '</span> ' + c.date + ' · ' + c.weight + ' kg' + (c.waist ? ' · waist ' + c.waist : '') + (c.bf ? ' · ' + c.bf + '% bf' : '') + '</summary>' +
          (c.lines || []).map(function (l) { return '<div class="msg">' + VICON[l.k] + ' ' + esc(l.t) + '</div>'; }).join('') + '</details>';
      }).join('');
    }
    h += '<h2>Recent sessions</h2>' + (S.sessions.slice(-5).reverse().map(function (x) {
      return '<div class="card"><div class="row sp"><b>' + x.date + ' · ' + esc(x.name || 'Workout ' + x.type) + '</b>' + (x.deload ? '<span class="pill w">deload</span>' : '') + '</div><div class="sm mut" style="margin-top:6px">' + x.ex.map(function (y) { return esc(y.n) + ': ' + y.reps.join('/'); }).join('<br>') + '</div></div>';
    }).join('') || '<div class="mut sm">Nothing yet. Your first session is the hardest one.</div>');
    return h;
  }

  /* ================= CHECKPOINT ================= */
  function openCheckpoint() {
    if (!CP) CP = { energy: 3, sleep: 3, digest: 3, joints: 0 };
    var p = S.profile, last = S.checkpoints[S.checkpoints.length - 1];
    function f(id, lbl, ph, hint) { return '<label class="f">' + lbl + '</label><input id="' + id + '" type="number" inputmode="decimal" placeholder="' + (ph || '') + '">' + (hint ? '<div class="xs mut">' + hint + '</div>' : ''); }
    function scale(k, lbl, lo, hi, cls) { return '<label class="f">' + lbl + '</label><div class="row wrap">' + [1, 2, 3, 4, 5].map(function (n) { return chip(CP[k] === n, 'cps', 'data-k="' + k + '" data-v="' + n + '"', n); }).join('') + '<span class="xs mut">' + lo + ' → ' + hi + '</span></div>'; }
    $ov.hidden = false;
    $ov.innerHTML = '<div><div class="row sp"><h1>Checkpoint</h1><button class="btn sm ghost" data-act="closew">Close</button></div>' +
      '<p class="mut sm">Do this in the morning, before food, same conditions each time. Takes 2 minutes.</p>' +
      '<div class="card"><h3>Body</h3>' + f('cp-w', 'Weight (kg)', last ? last.weight : p.weightKg) +
      f('cp-waist', 'Waist (cm)', last && last.waist || '', 'Tape at navel level, relaxed, after breathing out.') +
      f('cp-neck', 'Neck (cm)', last && last.neck || '', 'Just below the Adam\'s apple. Used for the body-fat estimate.') +
      (p.sex === 'f' ? f('cp-hip', 'Hips (cm)', last && last.hip || '', 'Widest point.') : '') + '</div>' +
      '<div class="card"><h3>Strength tests</h3><p class="xs mut">Optional but powerful: same tests every time, stop before form breaks.</p>' +
      f('cp-pu', 'Max full push-ups') + f('cp-hs', 'Chest-to-wall handstand hold (s)') + f('cp-pk', 'Plank hold (s)') + (p.hasBar ? f('cp-pl', 'Max pull-ups') : '') + '</div>' +
      '<div class="card"><h3>How you feel (past 2 weeks)</h3>' + scale('energy', 'Energy', 'drained', 'great') + scale('sleep', 'Sleep quality', 'poor', 'great') + scale('digest', 'Digestion', 'rough', 'smooth') +
      '<label class="f">Joint / wrist / tendon pain</label><div class="row wrap">' + ['None', 'Slight', 'Noticeable', 'Real pain'].map(function (l, i) { return chip(CP.joints === i, 'cps', 'data-k="joints" data-v="' + i + '"', l, i === 2 ? 'w' : i === 3 ? 'b' : ''); }).join('') + '</div></div>' +
      '<button class="btn pri blk" data-act="cpsave">Save & review</button></div>';
  }
  function showCheckpointResult(res) {
    $ov.innerHTML = '<div><h1>Checkpoint review</h1><div class="card ' + (res.verdict === 'good' ? 'hl' : 'warn') + '"><div class="row sp"><h3>' + VTXT[res.verdict] + '</h3><span style="font-size:26px">' + { good: '✅', watch: '⚠️', adjust: '🛠️' }[res.verdict] + '</span></div>' +
      '<div class="sm mut">' + { good: 'Everything points in the right direction. Keep going.', watch: 'Mostly fine, with a couple of things worth watching.', adjust: 'Something needs adjusting. See below; the plan has already changed where needed.' }[res.verdict] + '</div></div>' +
      '<div class="card">' + res.lines.map(function (l) { return '<div class="msg">' + VICON[l.k] + ' ' + esc(l.t) + '</div>'; }).join('') + '</div><button class="btn pri blk" data-act="closew">Done</button></div>';
  }

  /* ================= SETTINGS ================= */
  function viewSettings() {
    var p = S.profile;
    return '<h1>Settings</h1>' +
      '<div class="card"><label class="f" style="margin-top:0">Sessions per week</label><div class="row">' + chip(p.days === 3, 'set', 'data-k="days" data-v="3"', '3') + chip(p.days === 4, 'set', 'data-k="days" data-v="4"', '4') + '</div>' +
      '<label class="f">Checkpoint every</label><div class="row">' + chip(p.cpEvery === 7, 'set', 'data-k="cpEvery" data-v="7"', 'Week') + chip(p.cpEvery !== 7, 'set', 'data-k="cpEvery" data-v="14"', '2 weeks') + '</div>' +
      '<label class="f">Pull-up bar</label><div class="row">' + chip(p.hasBar, 'set', 'data-k="hasBar" data-v="1"', 'Have one') + chip(!p.hasBar, 'set', 'data-k="hasBar" data-v="0"', 'No bar') + '</div></div>' +
      '<div class="card"><h3>Body profile</h3><div class="sm mut">Used for calorie target and body-fat estimate.</div>' +
      '<label class="f">Height (cm)</label><input id="s-h" type="number" inputmode="numeric" value="' + (p.heightCm || '') + '"><label class="f">Age</label><input id="s-a" type="number" inputmode="numeric" value="' + (p.age || '') + '">' +
      '<label class="f">Formula</label><div class="row">' + chip(p.sex === 'm', 'set', 'data-k="sex" data-v="m"', 'Male') + chip(p.sex === 'f', 'set', 'data-k="sex" data-v="f"', 'Female') + '</div><button class="btn blk" data-act="savebody">Save</button></div>' +
      '<div class="card"><h3>Your data</h3><p class="sm mut">Stored only in this app on this device. Export a backup now and then, because iOS can clear web storage if the app is deleted.</p>' +
      '<button class="btn blk" data-act="export">Export backup (.json)</button><button class="btn ghost blk" data-act="import">Import backup</button><input id="imp" type="file" accept=".json,application/json" hidden>' +
      '<button class="btn ghost blk" data-act="reset" style="color:var(--bad)">Erase everything</button></div>' +
      '<div class="card"><h3>🔰 How this app works</h3><button class="btn blk" data-act="tour">Replay the 30-second tour</button></div>' + '<div class="card"><h3>📲 Install on your phone</h3>' + (deferredInstall ? '<button class="btn pri blk" data-act="install">Install app</button>' : '') +
      '<div class="sm" style="margin-top:8px"><b>iPhone (Safari):</b> Share button, then <b>Add to Home Screen</b>.</div><div class="sm" style="margin-top:6px"><b>Android (Chrome):</b> menu (three dots), then <b>Install app</b> or <b>Add to Home screen</b>.</div><div class="xs mut" style="margin-top:6px">Same link works on both. Data stays on each device, so use backup export to move between phones.</div></div>' +
      '<div class="card"><h3>Straight talk</h3><p class="sm mut">No app can make a body "immune to anything", and you do not need a detox: your liver, kidneys and gut already do that. What actually builds a resilient, younger-feeling body is progressive strength work, mobility, enough recovery, sleep, protein, lots of plants and consistency over years. Fat loss is best slow (about 0.25-0.75% of body weight a week). This is not medical advice; see a doctor for persistent pain, injuries or health conditions.</p></div>';
  }

  /* ================= GUIDED WORKOUT PLAYER =================
     One screen at a time: intro -> warm-up -> (exercise -> rest -> ...) -> rate -> cool-down -> summary.
     Rests advance by themselves, ratings move you on, and the session saves itself at the end. */
  var STAGES = ['intro', 'warm', 'ex', 'rest', 'rate', 'cool', 'summary'], wake = null;
  function snapLevels() { var o = {}; D.ORDER.forEach(function (t) { o[t] = S.tracks[t].level; }); return o; }
  function totalSets() { return W.session.items.reduce(function (n, it) { return n + it.sets; }, 0); }
  function doneSets() { var n = 0; W.done.forEach(function (r) { r.forEach(function (d) { if (d) n++; }); }); return n; }
  function progressPct() {
    var wn = D.WARMUP.length, cn = D.COOLDOWN.length, tot = wn + totalSets() + cn;
    var d = (W.stage === 'intro' ? 0 : Math.min(W.wi || 0, wn)) + doneSets() + Math.min(W.ci || 0, cn);
    return W.stage === 'summary' ? 100 : Math.round(d / tot * 100);
  }
  function keepAwake() { try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then(function (l) { wake = l; }).catch(function () {}); } catch (e) {} }
  function releaseAwake() { try { if (wake) { wake.release(); wake = null; } } catch (e) {} }

  function openWorkout(plan, resumed) {
    if (!resumed) {
      W = { date: today(), session: plan, stage: 'intro', wi: 0, ci: 0, ei: 0, si: 0,
        vals: plan.items.map(function (it) { return Array(it.sets).fill(it.target); }), done: plan.items.map(function (it) { return Array(it.sets).fill(false); }),
        diff: plan.items.map(function () { return 'ok'; }), pain: {}, skip: {}, rest: null, msgs: [], changes: [], snap: snapLevels() };
      S.draft = W; save();
    } else if (STAGES.indexOf(W.stage) < 0) { W.stage = 'intro'; W.wi = 0; W.ci = 0; W.ei = 0; W.si = 0; W.skip = W.skip || {}; W.snap = W.snap || snapLevels(); W.rest = null; }
    keepAwake(); ensureTick();
    if (W.stage === 'rest') checkRestDone();
    renderWorkout();
  }
  function wHead(sub) {
    var p = W.session;
    return '<div class="row sp"><div><div class="xs mut">' + sub + '</div><h1 style="margin:0">' + esc(p.name || 'Workout') + '</h1></div><button class="btn sm ghost" data-act="pause">⏸ Pause</button></div><div class="bar" style="margin:10px 0 14px"><i style="width:' + progressPct() + '%"></i></div>';
  }
  function targetText(it) { return it.ex.t === 'hold' ? it.target + ' seconds' : it.target + ' reps'; }

  function screenIntro() {
    var p = W.session, h = wHead('Ready · about ' + (10 + p.items.length * 6) + ' min');
    h += '<div class="card hl"><h3>Today\'s plan</h3><ul class="clean">' + p.items.map(function (it) { return '<li><div class="row sp"><span><span class="xs" style="color:' + TCOL[it.track] + '">' + TICO[it.track] + ' ' + D.TRACKS[it.track].label + (S.seen[it.track + ':' + it.level] ? '' : ' · 🆕 new') + '</span><br><b>' + esc(it.ex.n) + '</b></span><span class="mut">' + label(it) + '</span></div></li>'; }).join('') + '</ul>';
    p.skipped.forEach(function (s) { h += '<div class="sm" style="color:var(--warn);margin-top:8px">⚠ ' + esc(s.reason) + '</div>'; });
    p.notes.forEach(function (n) { h += '<div class="sm mut" style="margin-top:6px">• ' + esc(n) + '</div>'; });
    h += '</div><details class="card"><summary>🔰 New to training? Quick glossary</summary><ul class="clean sm"><li><b>Rep</b>: one full movement, down and back up.</li><li><b>Set</b>: a group of reps, then a rest.</li><li><b>Hold</b>: keep one position for a number of seconds.</li><li><b>Rest</b>: the timer runs it and moves you on by itself.</li><li>The first time you meet an exercise, you get a demo and steps before you start.</li></ul></details>' +
      '<div class="card warn sm"><b>One rule:</b> stop a set the moment your form breaks, not when you hit the number. Sharp pain means stop that exercise (there is a button for it).</div>' +
      '<button class="btn pri blk big" data-act="wnext">Start warm-up</button>';
    return h;
  }
  function screenSeq(list, idx, title, emoji, sub, last) {
    var x = list[idx], h = wHead(title + ' · step ' + (idx + 1) + ' of ' + list.length);
    h += '<div class="card hl seq"><div class="seqe">' + emoji + '</div><h2 style="margin:6px 0">' + esc(x.n) + '</h2><div class="seqd">' + esc(x.d) + '</div><div class="xs mut" style="margin-top:6px">' + sub + '</div></div>' +
      '<button class="btn pri blk big" data-act="seqnext">' + (idx === list.length - 1 ? last : 'Next ›') + '</button><button class="btn ghost blk" data-act="seqskip">Skip this part</button>';
    return h;
  }
  function skipMenu() {
    return '<details class="skipm"><summary>Can\'t do this one?</summary><div class="row wrap" style="margin-top:8px"><button class="chip b" data-act="skipex" data-v="pain">⚠ Something hurts</button><button class="chip" data-act="skipex" data-v="equip">No equipment or space</button><button class="chip" data-act="skipex" data-v="time">Short on time</button></div><div class="xs mut" style="margin-top:6px">I will adjust your next sessions automatically.</div></details>';
  }
  function screenEx() {
    var w = W, it = w.session.items[w.ei], col = TCOL[it.track], learn = !S.seen[it.track + ':' + it.level], hold = it.ex.t === 'hold', v = w.vals[w.ei][w.si], running = sw && sw.i === w.ei && sw.j === w.si;
    var h = wHead('Exercise ' + (w.ei + 1) + ' of ' + w.session.items.length + ' · ' + D.TRACKS[it.track].label);
    h += '<div class="card tk" style="--tc:' + col + '"><div class="row sp"><h3>' + TICO[it.track] + ' ' + esc(it.ex.n) + '</h3><span class="pill">' + label(it) + '</span></div><div class="fig big" data-fig="' + it.track + '|' + it.level + '|' + col + '"></div>';
    if (learn) {
      h += '<div class="card hl" style="margin:8px 0"><b>🆕 New exercise: learn it first</b><div class="sm mut">Watch the demo and read the steps. You will only see this once.</div></div>' +
        '<div class="sm mut">' + esc(it.ex.cue) + '</div><ol class="steps">' + it.ex.steps.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>' + errList(it.ex) +
        '<button class="btn pri blk big" data-act="learned">Got it, start set 1</button>' + skipMenu() + '</div>';
      return h;
    }
    h += '<div class="sdots">' + w.done[w.ei].map(function (d, j) { return '<i class="' + (d ? 'on' : j === w.si ? 'cur' : '') + '"></i>'; }).join('') + '</div><div class="center sm" style="margin-bottom:10px"><b>Set ' + (w.si + 1) + ' of ' + it.sets + '</b> · target ' + targetText(it) + (it.ex.side ? ' each side' : '') + '</div>';
    if (!hold) {
      h += '<div class="stepper"><button class="s" data-act="adj" data-d="-1">−</button><div class="sv"><b>' + v + '</b><span>reps</span></div><button class="s" data-act="adj" data-d="1">+</button></div>' +
        '<button class="btn pri blk big" data-act="setdone">✓ Done: ' + v + ' reps</button><div class="xs mut center" style="margin-top:6px">Did fewer? Tap − first. Stop early if your form breaks.</div>';
    } else if (running) {
      h += '<div class="swbig"><b id="swt">0</b><span>seconds · target ' + it.target + 's</span></div><button class="btn pri blk big" data-act="swstop">■ Stop</button><div class="xs mut center" style="margin-top:6px">A beep sounds at your target. Stop when your form breaks.</div>';
    } else {
      h += '<button class="btn pri blk big" data-act="swstart">▶ Start hold</button><details class="skipm"><summary>Enter the time manually</summary><div class="stepper" style="margin-top:8px"><button class="s" data-act="adj" data-d="-1">−</button><div class="sv"><b>' + v + '</b><span>seconds</span></div><button class="s" data-act="adj" data-d="1">+</button></div><button class="btn blk" data-act="setdone">✓ Log ' + v + ' s</button></details>';
    }
    var g = E.goalFor(S, it.track);
    h += '<div class="goal">🎯 <b>Goal:</b> ' + (g.hold ? 'hold ' + g.max + 's' : 'reach ' + g.max + ' reps') + ' (you are at ' + g.target + ') ' + (g.next ? 'to unlock <b>' + esc(g.next) + '</b>.' : 'to build your top level.') + '</div>' +
      '<details class="how"><summary>📖 Steps and common mistakes</summary><ol class="steps">' + it.ex.steps.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>' + errList(it.ex) + '</details>' + skipMenu() + '</div>';
    return h;
  }
  function screenRest() {
    var r = W.rest, nit = W.session.items[r.next.ei], col = TCOL[nit.track];
    return wHead('Rest') + '<div class="card hl center"><div class="restbig"><b id="rt">0:00</b></div><div class="bar" style="margin-top:8px"><i id="rb" style="width:0%"></i></div><div class="sm" style="margin-top:10px">' + esc(r.note) + '</div></div>' +
      '<div class="card tk" style="--tc:' + col + '"><div class="xs mut">UP NEXT</div><b>' + TICO[nit.track] + ' ' + esc(nit.ex.n) + '</b><div class="sm mut">Set ' + (r.next.si + 1) + ' of ' + nit.sets + ' · target ' + targetText(nit) + '</div><div class="fig" data-fig="' + nit.track + '|' + nit.level + '|' + col + '"></div></div>' +
      '<button class="btn pri blk big" data-act="restdone">I\'m ready</button><button class="btn ghost blk" data-act="restmore">+15 seconds</button>';
  }
  function screenRate() {
    var it = W.session.items[W.ei], reps = W.vals[W.ei].map(function (v, j) { return W.done[W.ei][j] ? v : 0; });
    return wHead('Exercise ' + (W.ei + 1) + ' done') + '<div class="card"><h3>' + TICO[it.track] + ' ' + esc(it.ex.n) + '</h3><div class="sm mut">You did: ' + reps.join(' · ') + (it.ex.t === 'hold' ? ' s' : ' reps') + '</div><h3 style="margin-top:14px">How did it feel?</h3><div class="xs mut" style="margin-bottom:8px">One tap. This decides when you move up, so be honest.</div>' +
      '<button class="rate" data-act="rate" data-v="easy"><span>😌</span><div><b>Easy and clean</b><i>I had more in the tank with good form</i></div></button>' +
      '<button class="rate" data-act="rate" data-v="ok"><span>👍</span><div><b>Just right</b><i>Challenging, form held up</i></div></button>' +
      '<button class="rate" data-act="rate" data-v="hard"><span>😰</span><div><b>Hard, or my form broke</b><i>I will repeat or ease this next time</i></div></button>' +
      '<div class="row wrap" style="margin-top:10px">' + chip(W.pain[it.track], 'painflag', '', '⚠ Something hurt (not just muscle burn)', 'b') + '</div></div>';
  }
  function nextMeal() { var r = E.dayRec(S, today()); for (var i = 0; i < E.SLOTS.length; i++) if (!r.done[E.SLOTS[i]]) return E.pickMeal(S, today(), E.SLOTS[i]); return null; }
  function screenSummary() {
    var h = '<h1>Session complete 💪</h1><p class="mut sm">Saved automatically. Here is what happens next:</p><div class="card">' + W.msgs.map(function (m) { return '<div class="msg' + (/^LEVEL UP/.test(m) ? ' up' : '') + '">' + esc(m) + '</div>'; }).join('') + '</div>';
    W.changes.forEach(function (c) {
      var ex = exByKey(c.track, c.to), up = c.to > c.from;
      h += '<div class="card tk" style="--tc:' + TCOL[c.track] + '"><div class="pill ' + (up ? 'g' : 'w') + '">' + (up ? '🆕 Unlocked' : '↩ Stepped back') + '</div><h3 style="margin-top:8px">' + TICO[c.track] + ' ' + esc(ex.n) + '</h3><div class="sm mut">' + (up ? 'This is your next exercise. You will meet it in your next ' + D.TRACKS[c.track].label + ' session, and the app will teach it first.' : 'Build back up from here. It is a smart reset, not a failure.') + '</div><div class="fig" data-fig="' + c.track + '|' + c.to + '|' + TCOL[c.track] + '"></div><ol class="steps">' + ex.steps.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol></div>';
    });
    var nm = nextMeal(), nx = E.previewSession(S, today());
    h += '<div class="card"><h3>Recover well</h3>' + (nm ? '<div class="sm" style="margin-top:6px">🍽️ <b>Eat within the hour:</b> ' + esc(nm.n) + ' (' + nm.p + ' g protein). It is already planned for you in Meals.</div>' : '<div class="sm" style="margin-top:6px">🍽️ All of today\'s meals are logged. Great.</div>') +
      '<div class="sm" style="margin-top:6px">💧 Drink water, 😴 sleep early.</div><div class="sm" style="margin-top:6px">📅 <b>Next workout:</b> ' + esc(nx.name) + (E.sessionsInWeek(S, today()) >= S.profile.days ? ' (next week)' : ' (after a rest day)') + '. Your check-in tomorrow tells the app how you recovered.</div></div>' +
      '<button class="btn pri blk big" data-act="closew">Done</button>';
    return h;
  }
  function renderWorkout() {
    if (!W) return;
    $ov.hidden = false;
    var p = W.session, h;
    switch (W.stage) {
      case 'intro': h = screenIntro(); break;
      case 'warm': h = screenSeq(D.WARMUP, Math.min(W.wi, D.WARMUP.length - 1), '🔥 Warm-up', '🔥', 'Prepare the joints you are about to use. Wrists matter most for handstand work.', 'Start exercises'); break;
      case 'ex': h = screenEx(); break;
      case 'rest': h = screenRest(); break;
      case 'rate': h = screenRate(); break;
      case 'cool': h = screenSeq(D.COOLDOWN, Math.min(W.ci, D.COOLDOWN.length - 1), '🧊 Cool-down', '🧊', 'Slow breathing, gentle stretch. Never force it.', 'Finish & save'); break;
      default: h = screenSummary();
    }
    $ov.innerHTML = '<div>' + h + '</div>'; Fig.mountAll($ov, exByKey); tickOnce();
    $ov.scrollTop = 0;
  }
  function closeOverlay() { $ov.hidden = true; $ov.innerHTML = ''; releaseAwake(); }

  /* ---- player logic ---- */
  function enterExercise(ei, si) { W.ei = ei; W.si = si; W.stage = 'ex'; W.rest = null; }
  function startRest(sec, next, note) { W.rest = { end: Date.now() + sec * 1000, total: sec, next: next, note: note || '' }; W.stage = 'rest'; persist(); renderWorkout(); }
  function checkRestDone() { if (W && W.stage === 'rest' && W.rest && Date.now() >= W.rest.end) advanceRest(true); }
  function advanceRest(silent) { var n = W.rest.next; enterExercise(n.ei, n.si); persist(); renderWorkout(); }
  function recordSet() {
    var ei = W.ei, si = W.si, it = W.session.items[ei], v = W.vals[ei][si], note = '', errs = it.ex.err || [];
    W.done[ei][si] = true;
    var low = v < it.target * 0.8;
    if (low) { for (var k = si + 1; k < it.sets; k++) W.vals[ei][k] = Math.min(W.vals[ei][k], v); note = 'That was below target, so the next sets are lowered to ' + v + '. Rest a little longer. '; }
    if (si < it.sets - 1) {
      if (errs.length) note += 'Check: ' + errs[si % errs.length];
      startRest((it.track === 'flex' ? 30 : it.track === 'hs' ? 120 : it.ex.t === 'hold' ? 90 : 75) + (low ? 30 : 0), { ei: ei, si: si + 1 }, note);
    } else { W.stage = 'rate'; persist(); renderWorkout(); }
  }
  function nextExercise() {
    if (W.ei < W.session.items.length - 1) { var nx = W.session.items[W.ei + 1]; startRest(nx.track === 'flex' ? 20 : 45, { ei: W.ei + 1, si: 0 }, 'Shake it out. Next exercise: ' + nx.ex.n + '.'); }
    else { W.stage = 'cool'; W.ci = 0; persist(); renderWorkout(); }
  }
  /* builds results from what was actually done, applies progression and saves. No manual "save" step. */
  function finishAuto() {
    var res = W.session.items.map(function (it, i) { return { track: it.track, reps: W.vals[i].map(function (v, j) { return W.done[i][j] ? v : 0; }), diff: W.diff[i], pain: !!W.pain[it.track] }; });
    W.msgs = E.finishSession(S, W.session, res, today());
    W.changes = D.ORDER.filter(function (t) { return S.tracks[t].level !== W.snap[t]; }).map(function (t) { return { track: t, from: W.snap[t], to: S.tracks[t].level }; });
    W.stage = 'summary'; W.rest = null; save(); renderWorkout();
    if (W.changes.some(function (c) { return c.to > c.from; })) confetti();
  }

  /* ================= TIMERS ================= */
  function beep() { try { var c = new (window.AudioContext || window.webkitAudioContext)(), o = c.createOscillator(); o.frequency.value = 880; o.connect(c.destination); o.start(); setTimeout(function () { o.stop(); c.close(); }, 250); } catch (e) {} }
  function tickOnce() {
    if (!W || $ov.hidden) return;
    if (W.stage === 'rest' && W.rest) {
      var left = Math.max(0, Math.ceil((W.rest.end - Date.now()) / 1000)), t = document.getElementById('rt'), b = document.getElementById('rb');
      if (t) t.textContent = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0');
      if (b) b.style.width = Math.round((1 - left / W.rest.total) * 100) + '%';
      if (left <= 0) { beep(); advanceRest(); }
    }
    if (sw) {
      var secs = Math.round((Date.now() - sw.t0) / 1000), el = document.getElementById('swt');
      if (el) el.textContent = secs;
      if (!sw.beeped && secs >= sw.target) { sw.beeped = true; beep(); }
    }
  }
  function ensureTick() { if (!tick) tick = setInterval(tickOnce, 250); }
  document.addEventListener('visibilitychange', function () { if (!document.hidden && W) { if (W.stage === 'rest') checkRestDone(); if (!$ov.hidden) keepAwake(); } });

  /* ================= ACTIONS ================= */
  function render() {
    if (!S) { renderOnboarding(); return; }
    var map = { today: viewToday, plan: viewPlan, meals: viewMeals, progress: viewProgress, settings: viewSettings };
    var y = window.scrollY; $app.innerHTML = map[view]() + tabbar(); Fig.mountAll($app, exByKey); window.scrollTo(0, y);
  }
  function go(v) { view = v; render(); window.scrollTo(0, 0); }

  var acts = {
    tab: function (el) { go(el.dataset.v); },
    ob: function (el) { OB.name = val('ob-name'); OB.weightKg = val('ob-w'); OB.h = val('ob-h'); OB.a = val('ob-a'); OB.pu = val('ob-pu'); OB.pl = val('ob-pl'); OB.sq = val('ob-sq'); OB.pk = val('ob-pk'); OB.hs = val('ob-hs'); var k = el.dataset.k; OB[k] = (k === 'hasBar' || k === 'newbie') ? el.dataset.v === '1' : k === 'days' ? +el.dataset.v : el.dataset.v; renderOnboarding(); fill(); },
    obdone: function () {
      var kg = num('ob-w'); if (!(kg > 25 && kg < 300)) { alert('Please enter your weight in kg.'); return; }
      var prof = { name: val('ob-name').trim(), weightKg: kg, heightCm: num('ob-h') || null, age: num('ob-a') || null, sex: OB.sex, days: OB.days, hasBar: OB.hasBar, cpEvery: 14 };
      S = E.newState(prof, OB.newbie ? { pushups: 0, pullups: 0, squats: 0, plank: 0, hs: 0 } : { pushups: num('ob-pu'), pullups: num('ob-pl'), squats: num('ob-sq'), plank: num('ob-pk'), hs: num('ob-hs') });
      save(); if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); render(); showTour(0);
    },
    sore: function (el) { CI.soreness[el.dataset.t] = +el.dataset.v; CI.open = true; render(); },
    energy: function (el) { CI.energy = +el.dataset.v; render(); },
    build: function () {
      var t = today(), msgs = E.saveCheckin(S, t, CI);
      S.plan = E.buildSession(S, t, CI); CI = null; save(); render();
      if (msgs.length) alert(msgs.join('\n\n'));
    },
    redo: function () { S.plan = null; save(); render(); },
    start: function () { openWorkout(S.plan); },
    resume: function () { W = S.draft; openWorkout(W, true); },
    endearly: function () { W = S.draft; if (!W.snap) W.snap = snapLevels(); W.changes = []; W.skip = W.skip || {}; finishAuto(); },
    pause: function () { closeOverlay(); render(); },
    wnext: function () { if (W.stage === 'intro') { W.stage = 'warm'; W.wi = 0; persist(); renderWorkout(); } },
    seqnext: function () {
      if (W.stage === 'warm') { W.wi++; if (W.wi >= D.WARMUP.length) enterExercise(0, 0); persist(); renderWorkout(); }
      else if (W.stage === 'cool') { W.ci++; if (W.ci >= D.COOLDOWN.length) { finishAuto(); return; } persist(); renderWorkout(); }
    },
    seqskip: function () { if (W.stage === 'warm') { W.wi = D.WARMUP.length; enterExercise(0, 0); persist(); renderWorkout(); } else if (W.stage === 'cool') finishAuto(); },
    learned: function () { var it = W.session.items[W.ei]; S.seen[it.track + ':' + it.level] = true; save(); renderWorkout(); },
    adj: function (el) { var it = W.session.items[W.ei], st = it.ex.t === 'hold' ? 5 : 1; W.vals[W.ei][W.si] = Math.max(0, W.vals[W.ei][W.si] + st * +el.dataset.d); persist(); renderWorkout(); },
    setdone: function () { recordSet(); },
    swstart: function () { var it = W.session.items[W.ei]; sw = { i: W.ei, j: W.si, t0: Date.now(), target: it.target }; ensureTick(); renderWorkout(); },
    swstop: function () { if (!sw) return; W.vals[W.ei][W.si] = Math.max(1, Math.round((Date.now() - sw.t0) / 1000)); sw = null; recordSet(); },
    restdone: function () { if (W.rest) advanceRest(); },
    restmore: function () { if (W.rest) { W.rest.end += 15000; W.rest.total += 15; persist(); tickOnce(); } },
    rate: function (el) { W.diff[W.ei] = el.dataset.v; nextExercise(); },
    painflag: function () { var it = W.session.items[W.ei]; W.pain[it.track] = !W.pain[it.track]; persist(); renderWorkout(); },
    skipex: function (el) {
      var it = W.session.items[W.ei], why = el.dataset.v; if (why === 'pain') W.pain[it.track] = true; W.skip[W.ei] = why; sw = null;
      W.done[W.ei] = W.done[W.ei].map(function () { return false; }); nextExercise();
    },
    tournext: function (el) { var i = +el.dataset.v; if (i >= TOUR.length - 1) { S.toured = true; save(); closeOverlay(); render(); } else showTour(i + 1); },
    tourskip: function () { S.toured = true; save(); closeOverlay(); render(); },
    tour: function () { showTour(0); },
    mobnext: function () { M.i++; if (M.i >= D.MOBILITY.length) { habit().mob = true; save(); M = null; closeOverlay(); render(); } else renderMob(); },
    mobclose: function () { M = null; closeOverlay(); render(); },
    closew: function () { W = null; CP = null; M = null; closeOverlay(); render(); },
    mob: function () { mobility(); },
    water: function (el) { var h = habit(); h.water = Math.max(0, (h.water || 0) + +el.dataset.d); save(); render(); },
    hab: function (el) { var h = habit(), k = el.dataset.k; h[k] = !h[k]; save(); render(); },
    eat: function (el) { var r = E.dayRec(S, today()); r.done[el.dataset.v] = !r.done[el.dataset.v]; save(); render(); },
    swap: function (el) { var r = E.dayRec(S, today()); r.swap[el.dataset.v] = (r.swap[el.dataset.v] || 0) + 1; r.done[el.dataset.v] = false; save(); render(); },
    boost: function (el) { var r = E.dayRec(S, today()); r.extra[el.dataset.v] = !r.extra[el.dataset.v]; save(); render(); },
    cpopen: function () { openCheckpoint(); },
    cps: function (el) { var keep = {}; ['cp-w', 'cp-waist', 'cp-neck', 'cp-hip', 'cp-pu', 'cp-hs', 'cp-pk', 'cp-pl'].forEach(function (id) { keep[id] = val(id); }); CP[el.dataset.k] = +el.dataset.v; openCheckpoint(); Object.keys(keep).forEach(function (id) { var e = document.getElementById(id); if (e && keep[id] !== '') e.value = keep[id]; }); },
    cpsave: function () {
      var kg = num('cp-w'); if (!(kg > 25 && kg < 300)) { alert('Please enter your weight in kg.'); return; }
      var cp = { date: today(), weight: kg, waist: num('cp-waist') || null, neck: num('cp-neck') || null, hip: num('cp-hip') || null,
        tests: { pushups: val('cp-pu') === '' ? null : num('cp-pu'), hs: val('cp-hs') === '' ? null : num('cp-hs'), plank: val('cp-pk') === '' ? null : num('cp-pk'), pullups: val('cp-pl') === '' ? null : num('cp-pl') },
        well: { energy: CP.energy, sleep: CP.sleep, digest: CP.digest, joints: CP.joints } };
      var res = E.saveCheckpoint(S, cp); S.plan = null; save(); CP = null; showCheckpointResult(res);
    },
    setlevel: function (el) { if (!confirm('Set ' + D.TRACKS[el.dataset.t].label + ' to "' + E.exAt(el.dataset.t, +el.dataset.v).n + '"?')) return; var t = S.tracks[el.dataset.t], e = E.exAt(el.dataset.t, +el.dataset.v); t.level = +el.dataset.v; t.target = e.r[0]; t.topHits = 0; t.hardStreak = 0; save(); render(); },
    set: function (el) { var k = el.dataset.k; S.profile[k] = (k === 'hasBar') ? el.dataset.v === '1' : (k === 'days' || k === 'cpEvery') ? +el.dataset.v : el.dataset.v; D.ORDER.forEach(function (t) { S.tracks[t].level = E.clampLevel(t, S.tracks[t].level, S.profile); }); save(); render(); },
    install: function () { if (!deferredInstall) return; deferredInstall.prompt(); deferredInstall = null; },
    savebody: function () { S.profile.heightCm = num('s-h') || null; S.profile.age = num('s-a') || null; save(); render(); },
    export: function () {
      var blob = new Blob([JSON.stringify(S)], { type: 'application/json' }), name = 'calis-backup-' + today() + '.json';
      try { var f = new File([blob], name, { type: 'application/json' }); if (navigator.canShare && navigator.canShare({ files: [f] })) { navigator.share({ files: [f], title: name }); return; } } catch (e) {}
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
    },
    import: function () { document.getElementById('imp').click(); },
    reset: function () { if (confirm('Erase ALL data on this device? This cannot be undone.')) { localStorage.removeItem(KEY); S = null; OB = { days: 3, sex: 'm', hasBar: false, newbie: true }; render(); } }
  };
  function habit() { var t = today(); return S.habits[t] || (S.habits[t] = {}); }
  function persist() { S.draft = W; save(); }
  function val(id) { var e = document.getElementById(id); return e ? e.value : ''; }
  function fill() { [['ob-name', OB.name], ['ob-w', OB.weightKg], ['ob-h', OB.h], ['ob-a', OB.a], ['ob-pu', OB.pu], ['ob-pl', OB.pl], ['ob-sq', OB.sq], ['ob-pk', OB.pk], ['ob-hs', OB.hs]].forEach(function (x) { var e = document.getElementById(x[0]); if (e && x[1] !== undefined && x[1] !== '') e.value = x[1]; }); }

  function mobility() { M = { i: 0 }; renderMob(); }
  function renderMob() {
    var x = D.MOBILITY[M.i], n = D.MOBILITY.length;
    $ov.hidden = false;
    $ov.innerHTML = '<div><div class="row sp"><div><div class="xs mut">Mobility · step ' + (M.i + 1) + ' of ' + n + '</div><h1 style="margin:0">Recovery flow</h1></div><button class="btn sm ghost" data-act="mobclose">Close</button></div><div class="bar" style="margin:10px 0 14px"><i style="width:' + Math.round(M.i / n * 100) + '%"></i></div>' +
      '<div class="card hl seq"><div class="seqe">🧘</div><h2 style="margin:6px 0">' + esc(x.n) + '</h2><div class="seqd">' + esc(x.d) + '</div><div class="xs mut" style="margin-top:6px">Slow and pain-free. A stretch feels like tension, never sharp pain.</div></div>' +
      '<button class="btn pri blk big" data-act="mobnext">' + (M.i === n - 1 ? 'Finish ✓' : 'Next ›') + '</button></div>';
  }

  /* ================= WIRING ================= */
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-act]'); if (!el) return;
    var f = acts[el.dataset.act]; if (f) f(el);
  });
  document.addEventListener('change', function (ev) {
    if (ev.target.id !== 'imp' || !ev.target.files[0]) return;
    var r = new FileReader();
    r.onload = function () { try { var d = JSON.parse(r.result); if (!d.profile || !d.tracks) throw 0; S = d; E.migrate(S); save(); render(); alert('Backup restored.'); } catch (e) { alert('That file is not a valid backup.'); } };
    r.readAsText(ev.target.files[0]);
  });
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0 && location.hostname !== 'localhost') navigator.serviceWorker.register('sw.js').catch(function () {});
  render();
  if (S && S.toured === false) showTour(0);
})();
