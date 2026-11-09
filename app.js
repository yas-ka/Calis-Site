/* UI layer. All data lives in localStorage on this device only. */
(function () {
  var KEY = 'calis.v1', E = Engine, D = DATA;
  var S = load(), view = 'today', W = null, OB = { days: 3, sex: 'm', hasBar: false }, CI = null, CP = null, restNote = '';
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
      '<h1>Let\'s set you up</h1><p class="mut">Everything stays on this phone. Goal: lean body, strength, flexibility and a handstand push-up. We start deliberately easy and adapt every session.</p>' +
      '<div class="card"><label class="f" style="margin-top:0">Name</label><input id="ob-name" type="text" placeholder="Your name">' +
      '<label class="f">Body weight (kg)</label><input id="ob-w" type="number" inputmode="decimal" placeholder="e.g. 72">' +
      '<label class="f">Height (cm)</label><input id="ob-h" type="number" inputmode="numeric" placeholder="e.g. 172">' +
      '<label class="f">Age</label><input id="ob-a" type="number" inputmode="numeric" placeholder="e.g. 30">' +
      '<label class="f">For body-fat and calorie formulas</label><div class="row">' + chip(OB.sex === 'm', 'ob', 'data-k="sex" data-v="m"', 'Male formula') + chip(OB.sex === 'f', 'ob', 'data-k="sex" data-v="f"', 'Female formula') + '</div>' +
      '<label class="f">Sessions per week</label><div class="row">' + chip(OB.days === 3, 'ob', 'data-k="days" data-v="3"', '3 days') + chip(OB.days === 4, 'ob', 'data-k="days" data-v="4"', '4 days') + '</div>' +
      '<label class="f">Do you have a pull-up bar?</label><div class="row">' + chip(OB.hasBar, 'ob', 'data-k="hasBar" data-v="1"', 'Yes') + chip(!OB.hasBar, 'ob', 'data-k="hasBar" data-v="0"', 'Not yet') + '</div>' +
      '<p class="xs mut">No bar? You pull using a sturdy table. Add a bar any time in Settings. Meals are fully vegetarian.</p></div>' +
      '<div class="card"><h3>Quick baseline</h3><p class="sm mut">Honest numbers, 0 is fine. Stop each test before form breaks.</p>' +
      '<label class="f">Max push-ups (full, floor)</label><input id="ob-pu" type="number" inputmode="numeric" value="0">' +
      '<label class="f">Max pull-ups (0 if no bar)</label><input id="ob-pl" type="number" inputmode="numeric" value="0">' +
      '<label class="f">Bodyweight squats in a row</label><input id="ob-sq" type="number" inputmode="numeric" value="10">' +
      '<label class="f">Plank hold (seconds)</label><input id="ob-pk" type="number" inputmode="numeric" value="20">' +
      '<label class="f">Chest-to-wall handstand hold (seconds, 0 if none)</label><input id="ob-hs" type="number" inputmode="numeric" value="0"></div>' +
      '<p class="xs mut">Not medical advice. If you have an injury, heart or blood-pressure issues, or are unwell, check with a doctor before starting.</p>' +
      '<button class="btn pri blk" data-act="obdone">Start my plan</button>';
  }

  /* ================= TAB BAR ================= */
  var TABS = [['today', '🏠', 'Today'], ['plan', '🪜', 'Levels'], ['meals', '🍛', 'Meals'], ['progress', '📈', 'Progress'], ['settings', '⚙️', 'Settings']];
  function tabbar() { return '<nav class="tabbar">' + TABS.map(function (t) { return '<button class="' + (view === t[0] ? 'on' : '') + '" data-act="tab" data-v="' + t[0] + '"><span>' + t[1] + '</span>' + t[2] + '</button>'; }).join('') + '</nav>'; }

  function errList(ex, cls) {
    return '<div class="errs ' + (cls || '') + '"><div class="xs"><b>⚠ Common mistakes: check yourself</b></div><ul>' + (ex.err || []).map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul></div>';
  }

  /* ================= TODAY ================= */
  function viewToday() {
    var t = today(), st = E.status(S, t), wk = E.weekNumber(S, t), dl = E.isDeload(S, t), done = E.sessionsInWeek(S, t);
    var dots = ''; for (var i = 0; i < S.profile.days; i++) dots += '<i class="' + (i < done ? 'on' : '') + '"></i>';
    var h = '<div class="row sp"><div><div class="mut sm">' + new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' }) + '</div><h1>Hi' + (S.profile.name ? ', ' + esc(S.profile.name) : '') + '</h1></div>' + ring(done, S.profile.days) + '</div>' +
      '<div class="row wrap" style="margin-bottom:4px"><span class="pill g">Week ' + wk + '</span>' + (dl ? '<span class="pill w">Deload week</span>' : '') + '<span class="pill">' + done + '/' + S.profile.days + ' sessions</span>' + (streakWeeks(t) > 0 ? '<span class="pill w">🔥 ' + streakWeeks(t) + ' wk streak</span>' : '') + '</div>';

    if (E.checkpointDue(S, t)) h += '<div class="card warn"><b>📋 Checkpoint due</b><div class="sm mut">A 2-minute review of weight, waist, strength and how you feel. It tells you whether everything is on track.</div><button class="btn blk" data-act="cpopen">Do checkpoint</button></div>';

    if (S.draft && S.draft.date === t && !W) h += '<div class="card warn"><b>Workout in progress</b><div class="sm mut">You have an unfinished session.</div><button class="btn pri blk" data-act="resume">Resume workout</button></div>';
    else if (st.k === 'train') {
      var plan = S.plan && S.plan.date === t ? S.plan : null;
      if (!plan) h += checkinCard();
      else if (plan.rest) h += restCard('Recovery day recommended', 'With how you feel today, training would cost more than it gives. Do the mobility routine, eat well, sleep early.');
      else h += planCard(plan);
    } else h += restCard(st.k === 'done' ? 'Session done ✅' : 'Rest day', st.why);

    var hs = S.tracks.hs, hsN = E.levels('hs').length;
    h += '<div class="card"><div class="row sp"><h3>🎯 Dream: handstand push-up</h3><span class="pill g">step ' + (hs.level + 1) + '/' + hsN + '</span></div><div class="bar" style="margin:8px 0"><i style="width:' + Math.round((hs.level + 1) / hsN * 100) + '%"></i></div>' +
      '<div class="sm mut">Now: ' + esc(E.exAt('hs', hs.level).n) + '. Wall handstand push-up is step 7.</div></div>';

    var ms = E.mealStats(S, t), pt = E.proteinTarget(S), hab = S.habits[t] || {}, kt = E.calorieTarget(S), ke = E.kcalEaten(S, t);
    h += '<div class="card"><div class="row sp"><h3>Protein today</h3><span class="mut sm">' + ms.protein + ' / ' + pt + ' g</span></div><div class="bar" style="margin-top:8px"><i style="width:' + Math.min(100, Math.round(ms.protein / pt * 100)) + '%"></i></div>' +
      (kt ? '<div class="sm mut" style="margin-top:8px">Energy: ~' + ke + ' of ~' + kt + ' kcal (gentle fat-loss target)</div>' : '') +
      '<div class="row sp" style="margin-top:10px"><span class="sm mut">Fermented food: ' + (ms.ferm ? '✅' : '⬜') + '</span><button class="btn sm ghost" data-act="tab" data-v="meals">Meals →</button></div></div>' +
      '<div class="card"><h3>Daily basics</h3><div class="row sp" style="margin-top:8px"><span>💧 Water</span><div class="row"><button class="chip" data-act="water" data-d="-1">−</button><b>' + (hab.water || 0) + '</b><span class="mut sm">/ 8</span><button class="chip" data-act="water" data-d="1">+</button></div></div>' +
      '<div class="row wrap" style="margin-top:10px">' + chip(hab.sleep, 'hab', 'data-k="sleep"', '😴 Slept 7h+') + chip(hab.veg, 'hab', 'data-k="veg"', '🥦 2+ veg servings') + chip(hab.clean, 'hab', 'data-k="clean"', '🚫 No sugary drinks / packaged snacks') + chip(hab.walk, 'hab', 'data-k="walk"', '🚶 20 min walk') + '</div></div>';
    h += '<h2>Insights</h2><div class="card">' + E.insights(S, t).map(function (x) { return '<div class="msg">' + esc(x) + '</div>'; }).join('') + '</div>';
    return h;
  }

  function restCard(title, why) {
    var hab = S.habits[today()] || {};
    return '<div class="card hl"><h3>' + title + '</h3><p class="sm" style="margin:6px 0 0">' + esc(why) + '</p>' +
      '<button class="btn blk" data-act="mob">' + (hab.mob ? '✅ Mobility done. Do it again' : '🧘 10-min mobility routine') + '</button></div>';
  }

  function checkinCard() {
    if (!CI) CI = { soreness: { push: 0, pull: 0, legs: 0, core: 0, hs: 0, post: 0 }, energy: 3 };
    var h = '<div class="card hl"><h3>Quick check-in</h3><p class="sm mut" style="margin:4px 0 0">How do these feel right now? Your workout adapts to this.</p>';
    D.CHECK.forEach(function (t) {
      h += '<div style="margin-top:12px"><div class="sm"><b>' + D.TRACKS[t].group + '</b></div><div class="row wrap" style="margin-top:6px">' +
        D.SORE.map(function (l, i) { return chip(CI.soreness[t] === i, 'sore', 'data-t="' + t + '" data-v="' + i + '"', l, i === 2 ? 'w' : i === 3 ? 'b' : ''); }).join('') + '</div></div>';
    });
    h += '<div style="margin-top:14px"><div class="sm"><b>Energy / sleep</b></div><div class="row" style="margin-top:6px">' +
      [1, 2, 3, 4, 5].map(function (n) { return chip(CI.energy === n, 'energy', 'data-v="' + n + '"', n); }).join('') + '<span class="xs mut">1 drained · 5 great</span></div></div>' +
      '<button class="btn pri blk" data-act="build">Build today\'s workout</button></div>';
    return h;
  }

  function label(it) { return it.sets + ' × ' + it.target + (it.ex.t === 'hold' ? ' s' : '') + (it.ex.side ? ' / side' : ''); }
  function planCard(p) {
    var h = '<div class="card hl"><div class="row sp"><h3>Today: ' + esc(p.name || 'Workout ' + p.type) + '</h3><span class="pill">~' + (10 + p.items.length * 6) + ' min</span></div>';
    h += '<ul class="clean">' + p.items.map(function (it) { return '<li><div class="row sp"><span><span class="xs" style="color:' + TCOL[it.track] + '">' + TICO[it.track] + ' ' + D.TRACKS[it.track].label + '</span><br><b>' + esc(it.ex.n) + '</b></span><span class="mut">' + label(it) + '</span></div></li>'; }).join('') + '</ul>';
    p.skipped.forEach(function (s) { h += '<div class="sm" style="color:var(--warn);margin-top:8px">⚠ ' + esc(s.reason) + '</div>'; });
    p.notes.forEach(function (n) { h += '<div class="sm mut" style="margin-top:6px">• ' + esc(n) + '</div>'; });
    return h + '<button class="btn pri blk" data-act="start">Start workout</button><button class="btn ghost blk" data-act="redo">Redo check-in</button></div>';
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
  function viewPlan() {
    var h = '<h1>Your ladders</h1><p class="mut sm">Twelve tracks cover the whole body. Every session you train a mix, and over a week every area gets hit. You move up only after hitting the top of the rep range in two sessions (three for planche and front lever). Tap a level to correct your starting point.</p>' + roadmapCard();
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
        h += '</div>' + (locked ? '<div class="sm" style="color:var(--warn);margin-top:8px">Needs a pull-up bar (or sturdy pole). Skipped until you have one.</div>' : '<div class="sm mut" style="margin-top:8px"><b>Now:</b> ' + esc(cur.cue) + '</div>' + howTo(t, tr.level, true) + errList(cur)) + '</details>';
      });
    });
    h += '<div class="card"><h3>How it adapts</h3><ul class="clean sm"><li>Every 4th week is a lighter <b>deload</b> week.</li><li><b>Very sore</b> area: one set fewer and a lighter target.</li><li><b>Sharp pain</b>: that area is skipped. Pain twice in 3 weeks steps you back a level.</li><li><b>Too hard</b> twice in a row: drop back a level and rebuild.</li><li>During a workout, a failed set lowers the next sets automatically.</li><li>Checkpoints can trigger a light week if your joints or recovery are complaining.</li></ul></div>';
    return h;
  }

  /* ================= MEALS ================= */
  function viewMeals() {
    var t = today(), rec = E.dayRec(S, t), ms = E.mealStats(S, t), pt = E.proteinTarget(S), pl = E.plantsThisWeek(S, t), kt = E.calorieTarget(S), ke = E.kcalEaten(S, t);
    var h = '<h1>Today\'s meals</h1><p class="mut sm">Vegetarian household food. Tick what you eat, swap what you don\'t fancy. Protein target ≈ ' + pt + ' g (1.8 g/kg to protect muscle while losing fat). Numbers are rough estimates.</p>' +
      '<div class="card"><div class="row sp"><b>Protein</b><span>' + ms.protein + ' / ' + pt + ' g</span></div><div class="bar" style="margin:8px 0"><i style="width:' + Math.min(100, Math.round(ms.protein / pt * 100)) + '%"></i></div>' +
      (kt ? '<div class="row sp"><b>Energy</b><span>~' + ke + ' / ~' + kt + ' kcal</span></div><div class="bar" style="margin:8px 0"><i style="width:' + Math.min(100, Math.round(ke / kt * 100)) + '%"></i></div>' : '<div class="xs mut">Add height and age in Settings to see a calorie target.</div>') +
      '<div class="row sp sm"><span>🌿 Plant variety this week</span><b>' + pl + ' / 30</b></div><div class="bar" style="margin:6px 0"><i style="width:' + Math.min(100, Math.round(pl / 30 * 100)) + '%"></i></div>' +
      '<div class="xs mut">"Detox" is really your gut, liver and kidneys doing their job. Help them with fibre, plenty of plants, curd or buttermilk daily, water, little sugar and ultra-processed food, and good sleep. No juice cleanses needed.</div></div>';
    E.SLOTS.forEach(function (sl) {
      var m = E.pickMeal(S, t, sl), on = rec.done[sl];
      h += '<div class="card"><div class="row sp"><span class="pill">' + cap(sl) + '</span><span class="xs mut">~' + m.p + ' g protein · ' + m.k + ' kcal' + (m.f ? ' · fermented' : '') + '</span></div>' +
        '<div style="margin:8px 0;font-weight:600">' + esc(m.n) + '</div><div class="xs mut">' + m.pl.map(esc).join(' · ') + '</div>' +
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
      '<div class="card"><h3>📲 Install on your phone</h3>' + (deferredInstall ? '<button class="btn pri blk" data-act="install">Install app</button>' : '') +
      '<div class="sm" style="margin-top:8px"><b>iPhone (Safari):</b> Share button, then <b>Add to Home Screen</b>.</div><div class="sm" style="margin-top:6px"><b>Android (Chrome):</b> menu (three dots), then <b>Install app</b> or <b>Add to Home screen</b>.</div><div class="xs mut" style="margin-top:6px">Same link works on both. Data stays on each device, so use backup export to move between phones.</div></div>' +
      '<div class="card"><h3>Straight talk</h3><p class="sm mut">No app can make a body "immune to anything", and you do not need a detox: your liver, kidneys and gut already do that. What actually builds a resilient, younger-feeling body is progressive strength work, mobility, enough recovery, sleep, protein, lots of plants and consistency over years. Fat loss is best slow (about 0.25-0.75% of body weight a week). This is not medical advice; see a doctor for persistent pain, injuries or health conditions.</p></div>';
  }

  /* ================= WORKOUT OVERLAY ================= */
  function openWorkout(plan, resumed) {
    if (!resumed) {
      W = { date: today(), session: plan, vals: plan.items.map(function (it) { return Array(it.sets).fill(it.target); }), done: plan.items.map(function (it) { return Array(it.sets).fill(false); }), diff: plan.items.map(function () { return 'ok'; }), pain: {}, stage: 'run', msgs: [] };
      S.draft = W; save();
    }
    renderWorkout();
  }
  function renderWorkout() {
    $ov.hidden = false;
    var w = W, p = w.session, h;
    if (w.stage === 'summary') {
      h = '<h1>Great work 💪</h1><p class="mut sm">Here is what changes next time:</p><div class="card">' + w.msgs.map(function (m) { return '<div class="msg' + (/^LEVEL UP/.test(m) ? ' up' : '') + '">' + esc(m) + '</div>'; }).join('') + '</div>' +
        '<div class="card"><b>Now recover</b><div class="sm mut">Protein within a few hours, water, and a proper night\'s sleep. Tomorrow\'s check-in tells the app how you recovered.</div></div><button class="btn pri blk" data-act="closew">Done</button>';
    } else if (w.stage === 'finish') {
      h = '<h1>How did it go?</h1><div class="card">';
      p.items.forEach(function (it, i) {
        h += '<div class="ex"><b>' + esc(it.ex.n) + '</b><div class="row wrap" style="margin-top:8px">' + [['easy', 'Too easy'], ['ok', 'Just right'], ['hard', 'Too hard']].map(function (d) { return chip(w.diff[i] === d[0], 'diff', 'data-i="' + i + '" data-v="' + d[0] + '"', d[1], d[0] === 'hard' ? 'w' : ''); }).join('') + '</div></div>';
      });
      h += '</div><div class="card"><b>Any pain during the session?</b><div class="sm mut">Sharp or joint pain, not normal muscle burn or a stretch sensation.</div><div class="row wrap" style="margin-top:8px">' +
        p.items.map(function (it) { return chip(w.pain[it.track], 'pain', 'data-t="' + it.track + '"', D.TRACKS[it.track].label, 'b'); }).join('') + '</div></div>' +
        '<button class="btn pri blk" data-act="save">Save workout</button><button class="btn ghost blk" data-act="back">Back to workout</button>';
    } else {
      h = '<div class="row sp"><h1>' + esc(p.name || 'Workout ' + p.type) + '</h1><button class="btn sm ghost" data-act="pause">Pause</button></div>' +
        '<div class="card warn sm"><b>Rule of the day:</b> stop a set the moment your form breaks, not when you hit the number. Sharp pain means stop that exercise.</div>' +
        '<details class="card"><summary>🔥 Warm-up (5 min). Do not skip, especially the wrists</summary><ul class="clean">' + D.WARMUP.map(function (x) { return '<li class="row sp"><span>' + x.n + '</span><span class="mut sm">' + x.d + '</span></li>'; }).join('') + '</ul></details>';
      p.items.forEach(function (it, i) {
        h += '<div class="card tk" style="--tc:' + TCOL[it.track] + '"><div class="row sp"><h3>' + TICO[it.track] + ' ' + esc(it.ex.n) + '</h3><span class="pill">' + label(it) + '</span></div><div class="sm mut" style="margin:6px 0 8px">' + esc(it.ex.cue) + '</div>' + howTo(it.track, it.level, true) + errList(it.ex);
        for (var j = 0; j < it.sets; j++) {
          var running = sw && sw.i === i && sw.j === j, v = w.vals[i][j];
          h += '<div class="set"><span class="n">Set ' + (j + 1) + '</span><button class="s" data-act="adj" data-i="' + i + '" data-j="' + j + '" data-d="-1">−</button><span class="v" id="v-' + i + '-' + j + '">' + (running ? '0s' : v + (it.ex.t === 'hold' ? 's' : '')) + '</span><button class="s" data-act="adj" data-i="' + i + '" data-j="' + j + '" data-d="1">+</button>' +
            (it.ex.t === 'hold' ? '<button class="chip" data-act="sw" data-i="' + i + '" data-j="' + j + '">' + (running ? 'Stop' : '⏱') + '</button>' : '') +
            '<button class="ck ' + (w.done[i][j] ? 'on' : '') + '" data-act="ck" data-i="' + i + '" data-j="' + j + '">✓</button></div>';
        }
        h += '</div>';
      });
      h += '<details class="card"><summary>🧊 Cool-down (3 min)</summary><ul class="clean">' + D.COOLDOWN.map(function (x) { return '<li class="row sp"><span>' + x.n + '</span><span class="mut sm">' + x.d + '</span></li>'; }).join('') + '</ul></details>' +
        '<button class="btn pri blk" data-act="finish">Finish workout</button>';
    }
    $ov.innerHTML = '<div>' + h + '</div>'; Fig.mountAll($ov, exByKey);
  }
  function closeOverlay() { $ov.hidden = true; $ov.innerHTML = ''; stopRest(); }

  /* ================= TIMERS ================= */
  function beep() { try { var c = new (window.AudioContext || window.webkitAudioContext)(), o = c.createOscillator(); o.frequency.value = 880; o.connect(c.destination); o.start(); setTimeout(function () { o.stop(); c.close(); }, 250); } catch (e) {} }
  function startRest(sec, note) { restNote = note || ''; timer = Date.now() + sec * 1000; $rest.hidden = false; ensureTick(); drawRest(); }
  function stopRest() { timer = null; $rest.hidden = true; }
  function drawRest() {
    var left = Math.max(0, Math.ceil((timer - Date.now()) / 1000));
    $rest.innerHTML = '<div style="min-width:0"><div class="xs mut" style="margin-bottom:2px">' + esc(restNote) + '</div><b>' + Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0') + '</b></div><span style="white-space:nowrap"><button class="btn sm" data-act="rest" data-d="15">+15s</button> <button class="btn sm ghost" data-act="skiprest">Skip</button></span>';
    if (left <= 0) { beep(); stopRest(); }
  }
  function ensureTick() {
    if (tick) return;
    tick = setInterval(function () {
      if (timer) drawRest();
      if (sw) { var el = document.getElementById('v-' + sw.i + '-' + sw.j); if (el) el.textContent = Math.round((Date.now() - sw.t0) / 1000) + 's'; }
    }, 250);
  }

  /* ================= ACTIONS ================= */
  function render() {
    if (!S) { renderOnboarding(); return; }
    var map = { today: viewToday, plan: viewPlan, meals: viewMeals, progress: viewProgress, settings: viewSettings };
    var y = window.scrollY; $app.innerHTML = map[view]() + tabbar(); Fig.mountAll($app, exByKey); window.scrollTo(0, y);
  }
  function go(v) { view = v; render(); window.scrollTo(0, 0); }

  var acts = {
    tab: function (el) { go(el.dataset.v); },
    ob: function (el) { OB.name = val('ob-name'); OB.weightKg = val('ob-w'); OB.h = val('ob-h'); OB.a = val('ob-a'); OB.pu = val('ob-pu'); OB.pl = val('ob-pl'); OB.sq = val('ob-sq'); OB.pk = val('ob-pk'); OB.hs = val('ob-hs'); var k = el.dataset.k; OB[k] = k === 'hasBar' ? el.dataset.v === '1' : k === 'days' ? +el.dataset.v : el.dataset.v; renderOnboarding(); fill(); },
    obdone: function () {
      var kg = num('ob-w'); if (!(kg > 25 && kg < 300)) { alert('Please enter your weight in kg.'); return; }
      var prof = { name: val('ob-name').trim(), weightKg: kg, heightCm: num('ob-h') || null, age: num('ob-a') || null, sex: OB.sex, days: OB.days, hasBar: OB.hasBar, cpEvery: 14 };
      S = E.newState(prof, { pushups: num('ob-pu'), pullups: num('ob-pl'), squats: num('ob-sq'), plank: num('ob-pk'), hs: num('ob-hs') });
      save(); if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); render();
    },
    sore: function (el) { CI.soreness[el.dataset.t] = +el.dataset.v; render(); },
    energy: function (el) { CI.energy = +el.dataset.v; render(); },
    build: function () {
      var t = today(), msgs = E.saveCheckin(S, t, CI);
      S.plan = E.buildSession(S, t, CI); CI = null; save(); render();
      if (msgs.length) alert(msgs.join('\n\n'));
    },
    redo: function () { S.plan = null; save(); render(); },
    start: function () { openWorkout(S.plan); },
    resume: function () { W = S.draft; openWorkout(W, true); },
    pause: function () { closeOverlay(); render(); },
    adj: function (el) { var i = +el.dataset.i, j = +el.dataset.j, it = W.session.items[i], st = it.ex.t === 'hold' ? 5 : 1; W.vals[i][j] = Math.max(0, W.vals[i][j] + st * +el.dataset.d); persist(); renderWorkout(); },
    ck: function (el) {
      var i = +el.dataset.i, j = +el.dataset.j, it = W.session.items[i], v = W.vals[i][j];
      W.done[i][j] = !W.done[i][j];
      if (!W.done[i][j]) { persist(); renderWorkout(); stopRest(); return; }
      var note = '', last = j === it.sets - 1, errs = it.ex.err || [];
      if (v < it.target * 0.8) {
        for (var k = j + 1; k < it.sets; k++) if (!W.done[i][k]) W.vals[i][k] = Math.min(W.vals[i][k], v);
        note = 'Below target, so the next sets are lowered to ' + v + '. Rest a bit longer. ';
      }
      if (!last && errs.length) note += 'Check: ' + errs[j % errs.length];
      else if (last) note += 'Last set of this exercise. Move on when ready.';
      persist(); renderWorkout();
      var base = it.track === 'flex' ? 30 : it.track === 'hs' ? 120 : it.ex.t === 'hold' ? 90 : 75;
      startRest(base + (v < it.target * 0.8 ? 30 : 0), note);
    },
    sw: function (el) {
      var i = +el.dataset.i, j = +el.dataset.j;
      if (sw && sw.i === i && sw.j === j) { W.vals[i][j] = Math.max(1, Math.round((Date.now() - sw.t0) / 1000)); W.done[i][j] = true; sw = null; persist(); renderWorkout(); startRest(W.session.items[i].track === 'flex' ? 30 : 90, 'Hold logged.'); }
      else { sw = { i: i, j: j, t0: Date.now() }; ensureTick(); renderWorkout(); }
    },
    rest: function (el) { timer += +el.dataset.d * 1000; drawRest(); },
    skiprest: stopRest,
    finish: function () { W.stage = 'finish'; renderWorkout(); },
    back: function () { W.stage = 'run'; renderWorkout(); },
    diff: function (el) { W.diff[+el.dataset.i] = el.dataset.v; persist(); renderWorkout(); },
    pain: function (el) { W.pain[el.dataset.t] = !W.pain[el.dataset.t]; persist(); renderWorkout(); },
    save: function () {
      var res = W.session.items.map(function (it, i) { return { track: it.track, reps: W.vals[i].map(function (v, j) { return W.done[i][j] ? v : 0; }), diff: W.diff[i], pain: !!W.pain[it.track] }; });
      W.msgs = E.finishSession(S, W.session, res, today()); W.stage = 'summary'; save(); renderWorkout(); if (W.msgs.some(function (m) { return /^LEVEL UP/.test(m); })) confetti();
    },
    closew: function () { W = null; CP = null; closeOverlay(); render(); },
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
    reset: function () { if (confirm('Erase ALL data on this device? This cannot be undone.')) { localStorage.removeItem(KEY); S = null; OB = { days: 3, sex: 'm', hasBar: false }; render(); } }
  };
  function habit() { var t = today(); return S.habits[t] || (S.habits[t] = {}); }
  function persist() { S.draft = W; save(); }
  function val(id) { var e = document.getElementById(id); return e ? e.value : ''; }
  function fill() { [['ob-name', OB.name], ['ob-w', OB.weightKg], ['ob-h', OB.h], ['ob-a', OB.a], ['ob-pu', OB.pu], ['ob-pl', OB.pl], ['ob-sq', OB.sq], ['ob-pk', OB.pk], ['ob-hs', OB.hs]].forEach(function (x) { var e = document.getElementById(x[0]); if (e && x[1] !== undefined && x[1] !== '') e.value = x[1]; }); }

  function mobility() {
    $ov.hidden = false;
    $ov.innerHTML = '<div><h1>Mobility, 10 min</h1><p class="mut sm">Slow, pain-free ranges. Move through it, never force it. A stretch feels like tension, never sharp pain.</p><div class="card"><ul class="clean">' +
      D.MOBILITY.map(function (x) { return '<li class="row sp"><span>' + x.n + '</span><span class="mut sm">' + x.d + '</span></li>'; }).join('') + '</ul></div><button class="btn pri blk" data-act="mobdone">Done ✓</button><button class="btn ghost blk" data-act="closew">Close</button></div>';
  }
  acts.mobdone = function () { habit().mob = true; save(); closeOverlay(); render(); };

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
})();
