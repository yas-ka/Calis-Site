/* Adaptive training engine. Pure functions on a plain `state` object (no DOM). */
var Engine = (function () {
  var D = (typeof DATA !== 'undefined') ? DATA : require('./data.js');

  /* ---------- date helpers ---------- */
  function pad(n) { return String(n).padStart(2, '0'); }
  function ymd(d) { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function fromYmd(s) { var a = s.split('-').map(Number); return new Date(a[0], a[1] - 1, a[2]); }
  function daysBetween(a, b) { return Math.round((fromYmd(b) - fromYmd(a)) / 864e5); }
  function addDays(s, n) { var d = fromYmd(s); d.setDate(d.getDate() + n); return ymd(d); }
  function weekStart(s) { var d = fromYmd(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return ymd(d); }

  /* ---------- ladder helpers ---------- */
  function levels(track) { return D.TRACKS[track].levels; }
  function ok(e, p) { return !(e.bar && !p.hasBar); }
  function nextLevel(track, l, p) { var L = levels(track); for (var i = l + 1; i < L.length; i++) if (ok(L[i], p)) return i; return null; }
  function prevLevel(track, l, p) { var L = levels(track); for (var i = l - 1; i >= 0; i--) if (ok(L[i], p)) return i; return null; }
  function clampLevel(track, l, p) { var L = levels(track); l = Math.min(l, L.length - 1); while (l > 0 && !ok(L[l], p)) l--; return l; }
  function exAt(track, l) { return levels(track)[l]; }
  function mean(a) { return a.length ? a.reduce(function (x, y) { return x + y; }, 0) / a.length : 0; }

  /* ---------- starting levels from a baseline test ---------- */
  function baselineLevels(b) {
    var push = b.pushups < 1 ? 0 : b.pushups < 5 ? 1 : b.pushups < 10 ? 2 : b.pushups < 20 ? 3 : b.pushups < 30 ? 4 : 5;
    var pull = b.pullups < 1 ? 1 : b.pullups < 3 ? 4 : b.pullups < 8 ? 5 : b.pullups < 13 ? 6 : 7;
    var legs = b.squats < 8 ? 0 : b.squats < 20 ? 1 : b.squats < 35 ? 2 : 3;
    var core = b.plank < 20 ? 0 : b.plank < 45 ? 1 : b.plank < 90 ? 2 : 3;
    var hs = b.hs >= 30 ? 4 : b.hs >= 15 ? 3 : b.hs >= 1 ? 2 : (b.pushups >= 10 ? 1 : 0);
    return { hs: hs, push: push, pull: pull, legs: legs, core: core, flex: 0, pl: 0, fl: 0, calves: 0,
      dips: b.pushups >= 15 ? 1 : 0, post: b.squats >= 20 ? 1 : 0, obl: b.plank >= 45 ? 1 : 0 };
  }

  function newState(profile, baseline) {
    var lv = baselineLevels(baseline), tracks = {};
    D.ORDER.forEach(function (t) {
      var l = clampLevel(t, lv[t], profile);
      tracks[t] = { level: l, target: exAt(t, l).r[0], topHits: 0, hardStreak: 0 };
    });
    profile.startDate = ymd();
    profile.diet = 'veg'; profile.cpEvery = profile.cpEvery || 14;
    return { v: 3, profile: profile, tracks: tracks, sessions: [], weights: [{ d: ymd(), kg: profile.weightKg }],
      meals: {}, habits: {}, checkins: [], painLog: [], checkpoints: [], deloadUntil: null, checkin: null, plan: null, draft: null };
  }

  function migrate(s) {
    s.profile.diet = 'veg'; s.profile.cpEvery = s.profile.cpEvery || 14;
    s.checkpoints = s.checkpoints || []; s.deloadUntil = s.deloadUntil || null;
    D.ORDER.forEach(function (t) {
      if (!s.tracks[t]) { var l = clampLevel(t, t === 'hs' ? 0 : 0, s.profile); s.tracks[t] = { level: l, target: exAt(t, l).r[0], topHits: 0, hardStreak: 0 }; }
      var L = levels(t).length; if (s.tracks[t].level >= L) s.tracks[t].level = L - 1;
      s.tracks[t].level = clampLevel(t, s.tracks[t].level, s.profile);
    });
    s.v = 3; s.plan = null; s.draft = null; return s;
  }

  /* Mifflin-St Jeor, ~15% deficit for gradual fat loss; null if profile incomplete */
  function calorieTarget(s) {
    var p = s.profile; if (!p.heightCm || !p.age || !p.weightKg || !p.sex) return null;
    var bmr = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === 'm' ? 5 : -161);
    var tdee = bmr * 1.45, tgt = Math.max(bmr, tdee * 0.85);
    return Math.round(tgt / 50) * 50;
  }
  function kcalEaten(s, date) {
    var rec = s.meals[date]; if (!rec) return 0;
    var k = 0; SLOTS.forEach(function (sl) { if (rec.done[sl]) k += pickMeal(s, date, sl).k; }); return k;
  }

  /* ---------- schedule ---------- */
  function weekNumber(s, today) { return Math.floor(daysBetween(s.profile.startDate, today) / 7) + 1; }
  function isDeload(s, today) { if (s.deloadUntil && today <= s.deloadUntil) return true; var w = weekNumber(s, today); return w > 1 && w % 4 === 0; }
  function sessionsInWeek(s, today) { var ws = weekStart(today); return s.sessions.filter(function (x) { return weekStart(x.date) === ws; }).length; }
  function lastSession(s) { return s.sessions.length ? s.sessions[s.sessions.length - 1] : null; }

  /* 'train' | 'done' | 'rest' with a human reason */
  function status(s, today) {
    var last = lastSession(s);
    if (last && last.date === today) return { k: 'done', why: 'Today\'s session is in the books. Eat, hydrate, sleep: that is when you actually get stronger.' };
    if (sessionsInWeek(s, today) >= s.profile.days) return { k: 'rest', why: 'Weekly target reached (' + s.profile.days + ' sessions). More is not better, so recover and keep it that way.' };
    if (last && daysBetween(last.date, today) < 1) return { k: 'rest', why: 'Rest.' };
    if (last && daysBetween(last.date, today) === 1 && s.profile.days <= 3) return { k: 'rest', why: 'Recovery day. Muscles and tendons adapt on rest days. Do the mobility routine instead.' };
    return { k: 'train', why: '' };
  }

  /* ---------- build today's session from the check-in ---------- */
  function buildSession(s, today, ci) {
    var type = ['A', 'B', 'C'][s.sessions.length % 3], def = D.SESSIONS[type], focus = def.focus, order = def.order, noted = {};
    var week = weekNumber(s, today), deload = isDeload(s, today), ramp = week === 1;
    var last = lastSession(s), gap = last ? daysBetween(last.date, today) : 0;
    var notes = [], skipped = [], items = [];
    if (deload) notes.push('Deload week: volume is trimmed so your joints and tendons catch up with your muscles.');
    if (ramp) notes.push('Week 1 ramp-in: 2 sets per exercise while your body adapts.');
    if (gap >= 10) notes.push('Welcome back after ' + gap + ' days. Easing in with fewer sets.');
    if (ci.energy <= 2) notes.push('Low energy today, so one set fewer on everything. Showing up still counts.');

    order.forEach(function (t) {
      var tr = s.tracks[t], e = exAt(t, tr.level), sets = (t === 'hs' && type !== 'B') ? 3 : t === 'hs' ? 2 : t === 'flex' ? 2 : focus.indexOf(t) >= 0 ? 3 : 2, target = tr.target;
      var g = D.GROUP[t], sor = (g && ci.soreness && ci.soreness[g]) || 0, lbl = D.TRACKS[g || t].group;
      if (!ok(e, s.profile)) { skipped.push({ track: t, reason: D.TRACKS[t].label + ': needs a pull-up bar (or sturdy pole), so it is skipped for now. Everything else trains normally.' }); return; }
      if (ramp) sets = Math.min(sets, 2);
      if (deload) sets = Math.max(1, sets - 1);
      if (gap >= 10) sets = Math.max(1, sets - 1);
      if (ci.energy <= 2) sets = Math.max(1, sets - 1);
      if (sor >= 3) { skipped.push({ track: t, reason: D.TRACKS[t].label + ' (' + lbl + '): pain reported, so skipping it today. Pain is not "work harder" territory.' }); return; }
      if (sor === 2) {
        sets = Math.max(1, sets - 1);
        target = Math.max(e.r[0], target - (e.t === 'hold' ? 10 : 2));
        if (!noted[g]) { noted[g] = 1; notes.push(lbl + ' very sore: one set fewer and a lighter target.'); }
      }
      items.push({ track: t, level: tr.level, ex: e, sets: sets, target: target, sore: sor });
    });
    var rest = items.length < 2 || (ci.energy <= 1);
    return { date: today, type: type, name: def.name, week: week, deload: deload, items: items, skipped: skipped, notes: notes, rest: rest };
  }

  /* ---------- pain handling ---------- */
  function registerPain(s, track, today) {
    s.painLog.push({ d: today, track: track });
    var recent = s.painLog.filter(function (x) { return x.track === track && daysBetween(x.d, today) <= 21; });
    var days = {}; recent.forEach(function (x) { days[x.d] = 1; });
    if (Object.keys(days).length < 2) return track + ': pain noted. Easing off. If it shows up again I will step you back a level.';
    var tr = s.tracks[track], pl = prevLevel(track, tr.level, s.profile);
    s.painLog = s.painLog.filter(function (x) { return x.track !== track; });
    if (pl === null) return D.TRACKS[track].label + ': pain again at the easiest level. Please get it looked at (physio/doctor) before continuing it.';
    tr.level = pl; tr.target = Math.max(exAt(track, pl).r[0], Math.round(exAt(track, pl).r[1] * 0.7)); tr.topHits = 0; tr.hardStreak = 0;
    return D.TRACKS[track].label + ': pain twice in 3 weeks, so I stepped you back to "' + exAt(track, pl).n + '". Build up again from here; see a physio if it persists.';
  }

  function saveCheckin(s, today, ci) {
    s.checkin = { date: today, soreness: ci.soreness, energy: ci.energy };
    s.checkins.push({ d: today, soreness: ci.soreness, energy: ci.energy });
    var msgs = [];
    D.CHECK.forEach(function (t) { if ((ci.soreness[t] || 0) >= 3) msgs.push(registerPain(s, t, today)); });
    return msgs;
  }

  /* ---------- progression after a session ---------- */
  function progressOne(s, item, res) {
    var t = s.tracks[item.track], e = item.ex, mn = e.r[0], mx = e.r[1], step = e.t === 'hold' ? 5 : 1, name = e.n;
    var target = item.target, done = res.reps, avg = mean(done);
    var allHit = done.length === item.sets && done.every(function (r) { return r >= target; });
    var unit = e.t === 'hold' ? 's' : ' reps';
    if (res.pain) return registerPain(s, item.track, res.date);
    if (res.diff === 'hard' || avg < target * 0.75) {
      t.hardStreak++;
      var nt = Math.max(mn, target - Math.max(step, Math.ceil(target * 0.15)));
      if (t.hardStreak >= 2 && nt === mn && t.target === mn) {
        var pl = prevLevel(item.track, t.level, s.profile);
        if (pl !== null) { t.level = pl; t.target = exAt(item.track, pl).r[1]; t.hardStreak = 0; t.topHits = 0; return name + ' was too hard twice. Stepping back to "' + exAt(item.track, pl).n + '" so you can build momentum.'; }
      }
      t.target = nt; t.topHits = 0;
      return name + ': that was tough, so next target ' + nt + unit + '. Rebuild first.';
    }
    t.hardStreak = 0;
    if (!allHit) { t.target = Math.max(mn, Math.min(target, t.target)); return name + ': solid effort. Repeat the same target ' + t.target + unit + ' until every set hits it.'; }
    if (item.sore >= 2) { return name + ': target hit, but you were sore going in. Holding at ' + t.target + unit + '.'; }
    if (target < mx) {
      var inc = (res.diff === 'easy' && target + 2 * step <= mx) ? 2 * step : step;
      t.target = Math.min(mx, target + inc); t.topHits = 0;
      return name + ': nice. Next time ' + t.target + unit + '.';
    }
    t.topHits++;
    var skill = item.track === 'pl' || item.track === 'fl' || (item.track === 'obl' && t.level >= 5);
    if (t.topHits >= (skill ? 3 : 2) || (!skill && res.diff === 'easy' && t.topHits >= 1)) {
      var nl = nextLevel(item.track, t.level, s.profile);
      if (nl === null) { t.target = target + step; return name + ': top of the ladder for your equipment. Adding ' + step + (e.t === 'hold' ? 's' : ' rep') + ' per set' + (s.profile.hasBar ? '.' : '. A doorway pull-up bar would unlock harder variations.'); }
      t.level = nl; t.target = exAt(item.track, nl).r[0]; t.topHits = 0;
      return 'LEVEL UP in ' + D.TRACKS[item.track].label + ': "' + exAt(item.track, nl).n + '" (start at ' + t.target + unit + ').';
    }
    return name + ': top of the range (' + mx + unit + '). Hit it once more, then you level up.';
  }

  /* results: [{track, reps:[..], diff, pain}] */
  function finishSession(s, session, results, today) {
    var msgs = [], rec = { date: today, type: session.type, name: session.name, deload: session.deload, ex: [] };
    session.items.forEach(function (item) {
      var r = results.filter(function (x) { return x.track === item.track; })[0];
      if (!r) return;
      var any = r.reps.some(function (v) { return v > 0; });
      rec.ex.push({ track: item.track, n: item.ex.n, level: item.level, sets: item.sets, target: item.target, reps: r.reps, diff: r.diff, pain: !!r.pain });
      if (!any && !r.pain) { msgs.push(item.ex.n + ': skipped, no change.'); return; }
      r.date = today;
      msgs.push(progressOne(s, item, r));
    });
    s.sessions.push(rec);
    s.plan = null; s.draft = null;
    return msgs;
  }

  /* ---------- meals ---------- */
  function dietOk(m) { return m.d === 'v'; }
  var SLOTS = ['breakfast', 'lunch', 'snack', 'dinner'];
  function dayRec(s, date) { return s.meals[date] || (s.meals[date] = { done: {}, swap: {}, extra: {} }); }
  function pickMeal(s, date, slot) {
    var list = D.MEALS.filter(function (m) { return m.s === slot && dietOk(m, s.profile.diet); });
    var day = Math.floor(fromYmd(date).getTime() / 864e5), rec = s.meals[date];
    var off = rec && rec.swap && rec.swap[slot] || 0;
    return list[(day + SLOTS.indexOf(slot) * 3 + off) % list.length];
  }
  function proteinTarget(s) { return Math.round(1.8 * (s.profile.weightKg || 70)); }
  function mealStats(s, date) {
    var rec = s.meals[date] || { done: {}, extra: {} }, p = 0, ferm = false, plants = {};
    SLOTS.forEach(function (sl) { if (rec.done[sl]) { var m = pickMeal(s, date, sl); p += m.p; ferm = ferm || !!m.f; m.pl.forEach(function (x) { plants[x] = 1; }); } });
    Object.keys(rec.extra || {}).forEach(function (i) { if (rec.extra[i]) p += D.BOOSTERS[i].p; });
    return { protein: p, ferm: ferm, plants: plants };
  }
  function plantsThisWeek(s, today) {
    var ws = weekStart(today), all = {};
    for (var i = 0; i < 7; i++) Object.keys(mealStats(s, addDays(ws, i)).plants).forEach(function (k) { all[k] = 1; });
    return Object.keys(all).length;
  }

  /* ---------- checkpoints (weekly / biweekly review) ---------- */
  function checkpointDue(s, today) {
    var last = s.checkpoints[s.checkpoints.length - 1], ref = last ? last.date : s.profile.startDate;
    return daysBetween(ref, today) >= (s.profile.cpEvery || 14);
  }
  function log10(x) { return Math.log(x) / Math.LN10; }
  /* US Navy method, +/- 3-4% accuracy. Needs height; waist+neck (+hip for 'f'). */
  function bodyFat(p, m) {
    var h = p.heightCm; if (!h || !m.waist || !m.neck) return null;
    var v;
    if (p.sex === 'f') { if (!m.hip) return null; v = 495 / (1.29579 - 0.35004 * log10(m.waist + m.hip - m.neck) + 0.221 * log10(h)) - 450; }
    else { if (m.waist <= m.neck) return null; v = 495 / (1.0324 - 0.19077 * log10(m.waist - m.neck) + 0.15456 * log10(h)) - 450; }
    return isFinite(v) && v > 3 && v < 60 ? Math.round(v * 10) / 10 : null;
  }
  function lvSnap(s) { var o = {}; D.ORDER.forEach(function (t) { o[t] = s.tracks[t].level; }); return o; }

  /* cp: {date, weight, waist, neck, hip, tests:{pushups,hs,plank,pullups}, well:{energy,sleep,digest,joints}} */
  function evaluateCheckpoint(s, cp) {
    var prev = s.checkpoints[s.checkpoints.length - 1], lines = [], bad = 0, watch = 0;
    function add(k, t) { lines.push({ k: k, t: t }); if (k === 'bad') bad++; if (k === 'watch') watch++; }
    var baseDate = prev ? prev.date : s.profile.startDate, baseKg = prev ? prev.weight : (s.weights[0] ? s.weights[0].kg : cp.weight);
    var span = daysBetween(baseDate, cp.date), weeks = Math.max(1, span / 7), dKg = cp.weight - baseKg, pct = dKg / baseKg / weeks * 100;
    if (!prev && span < 10) add('good', 'First checkpoint saved. This is your baseline; the next one will show real change.');
    else if (pct < -1) add('watch', 'Weight is dropping fast (' + dKg.toFixed(1) + ' kg, ' + Math.abs(pct).toFixed(1) + '%/week). Faster than about 1%/week risks muscle loss and low energy. Add a protein booster or a bit more roti/rice.');
    else if (pct <= -0.2) add('good', 'Weight ' + dKg.toFixed(1) + ' kg (' + Math.abs(pct).toFixed(2) + '%/week): a healthy, sustainable fat-loss pace.');
    else if (pct < 0.2) add('good', 'Weight is steady (' + (dKg >= 0 ? '+' : '') + dKg.toFixed(1) + ' kg). Fine if waist and strength are improving (recomposition).');
    else add('watch', 'Weight is up ' + dKg.toFixed(1) + ' kg. If the waist is not shrinking, trim rice/roti/sweet portions a little and keep protein high.');
    if (prev && prev.waist && cp.waist) {
      var dw = cp.waist - prev.waist;
      if (dw <= -0.5) add('good', 'Waist ' + dw.toFixed(1) + ' cm: fat is coming off where it matters.');
      else if (dw < 0.5) {
        var flat = pct > -0.2 && pct < 0.2; cp.flatWaist = flat;
        if (flat && prev.flatWaist) add('bad', 'Waist and weight have not moved across two checkpoints. Trim about 150 kcal/day (smaller rice/roti portions, no sugary drinks) and add a 20-30 minute daily walk.');
        else add('watch', 'Waist unchanged. Give it one more checkpoint, and keep protein, sleep and daily steps consistent.');
      } else add('watch', 'Waist is up ' + dw.toFixed(1) + ' cm. Check portions, evening snacks and sleep.');
    }
    var bf = bodyFat(s.profile, cp); cp.bf = bf;
    if (bf !== null && prev && prev.bf) { var db = bf - prev.bf; add(db > 0.5 ? 'watch' : 'good', 'Estimated body fat ' + bf + '% (' + (db >= 0 ? '+' : '') + db.toFixed(1) + '). Tape-measure estimates are rough, so trust the trend, not one number.'); }
    else if (bf !== null) add('good', 'Estimated body fat ' + bf + '% (rough, +/-3-4%). Track the trend.');
    if (prev && prev.tests) {
      var tests = [['pushups', 'push-ups'], ['hs', 'wall handstand hold'], ['plank', 'plank hold'], ['pullups', 'pull-ups']], up = [], down = [];
      tests.forEach(function (t) { var a = prev.tests[t[0]], b = cp.tests[t[0]]; if (a > 0 && b !== undefined && b !== null) { if (b >= a * 1.1) up.push(t[1] + ' ' + a + ' to ' + b); else if (b < a * 0.85) down.push(t[1] + ' ' + a + ' to ' + b); } });
      if (up.length) add('good', 'Stronger: ' + up.join(', ') + '.');
      if (down.length) add('watch', 'Dropped: ' + down.join(', ') + '. Usually under-recovery (sleep, food, stress), not lost fitness.');
    }
    if (prev && prev.levels) {
      var ups = D.ORDER.filter(function (t) { return s.tracks[t].level > prev.levels[t]; }).map(function (t) { return D.TRACKS[t].label + ': ' + exAt(t, s.tracks[t].level).n; });
      if (ups.length) add('good', 'Level-ups: ' + ups.join('; ') + '.');
      else if (span >= 14) add('watch', 'No level-ups this period. Check you are hitting the rep targets; sleep and protein are the usual blockers.');
    }
    var hsl = s.tracks.hs.level; add('good', 'Handstand push-up journey: step ' + (hsl + 1) + ' of ' + levels('hs').length + ' (' + exAt('hs', hsl).n + ').');
    var done = s.sessions.filter(function (x) { return x.date > baseDate && x.date <= cp.date; }).length, planned = s.profile.days * span / 7;
    if (span >= 7) { if (done >= planned * 0.8) add('good', 'Consistency: ' + done + ' of about ' + Math.round(planned) + ' planned sessions.'); else add('watch', 'Consistency: ' + done + ' of about ' + Math.round(planned) + ' planned sessions. Shorten sessions on busy days rather than skipping them.'); }
    var w = cp.well || {};
    if (w.energy && w.energy <= 2) add('watch', 'Energy is low. Check sleep, iron and B12 foods (dals, spinach, curd, paneer), water, and the size of your calorie gap.');
    if (w.sleep && w.sleep <= 2) add('watch', 'Sleep is poor. It is the biggest lever for fat loss and recovery: fixed bedtime, no screens 30 minutes before.');
    if (w.digest && w.digest <= 2) add('watch', 'Digestion is rough. Raise fibre gradually (veg, dal, fruit), have curd or buttermilk daily, and drink more water.');
    else if (w.digest && w.digest >= 4) add('good', 'Digestion feels good.');
    if (w.joints && w.joints >= 2) { add('bad', 'Joint or wrist pain is present. The next 7 days are an automatic light week. Do not train through sharp pain; see a physio if it persists.'); s.deloadUntil = addDays(cp.date, 6); }
    return { verdict: bad ? 'adjust' : watch ? 'watch' : 'good', lines: lines };
  }
  function saveCheckpoint(s, cp) {
    var res = evaluateCheckpoint(s, cp);
    cp.levels = lvSnap(s); cp.verdict = res.verdict; cp.lines = res.lines;
    s.checkpoints.push(cp);
    s.weights.push({ d: cp.date, kg: cp.weight }); s.profile.weightKg = cp.weight;
    return res;
  }

  /* ---------- insights ---------- */
  function insights(s, today) {
    var out = [], last = s.checkins.slice(-3);
    D.CHECK.forEach(function (t) {
      var n = last.filter(function (c) { return (c.soreness[t] || 0) >= 2; }).length;
      if (n >= 2) out.push(D.TRACKS[t].group + ' has been very sore in ' + n + ' of your last ' + last.length + ' check-ins. Volume is trimmed. Check sleep, protein and rest days.');
    });
    if (!s.profile.hasBar) {
      var pt = s.tracks.pull;
      if (pt.level >= 2 && pt.target >= exAt('pull', 2).r[1] - 2) out.push('You are close to the ceiling of bar-free pulling. A doorway pull-up bar unlocks 7 more levels.');
    }
    var wk = sessionsInWeek(s, today);
    out.push('This week: ' + wk + ' of ' + s.profile.days + ' sessions done.' + (isDeload(s, today) ? ' (Deload week.)' : ''));
    return out;
  }

  return { ymd: ymd, fromYmd: fromYmd, daysBetween: daysBetween, addDays: addDays, weekStart: weekStart,
    levels: levels, exAt: exAt, nextLevel: nextLevel, prevLevel: prevLevel, clampLevel: clampLevel, baselineLevels: baselineLevels,
    newState: newState, weekNumber: weekNumber, isDeload: isDeload, sessionsInWeek: sessionsInWeek, status: status,
    buildSession: buildSession, saveCheckin: saveCheckin, finishSession: finishSession, registerPain: registerPain,
    SLOTS: SLOTS, dayRec: dayRec, pickMeal: pickMeal, proteinTarget: proteinTarget, mealStats: mealStats,
    plantsThisWeek: plantsThisWeek, insights: insights, migrate: migrate, calorieTarget: calorieTarget, kcalEaten: kcalEaten,
    checkpointDue: checkpointDue, bodyFat: bodyFat, evaluateCheckpoint: evaluateCheckpoint, saveCheckpoint: saveCheckpoint };
})();
if (typeof module !== 'undefined') module.exports = Engine;
