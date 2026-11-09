/* Tiny animated stick-figure demos. Side view, 200x125 canvas, ground at y=106.
   A pose is 14 numbers (or 18 with a second leg): head, shoulder, elbow, hand, hip, knee, foot [, knee2, foot2]. */
var Fig = (function () {
  function pz(a) { if (a.length === 14) a = a.concat([a[10], a[11], a[12], a[13]]); var o = []; for (var i = 0; i < a.length; i += 2) o.push([a[i], a[i + 1]]); return o; }
  function lerp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
  function mix(A, B, t) { return A.map(function (p, i) { return lerp(p, B[i], t); }); }
  var G = 106;

  /* push-up family: h = hand surface height, fh = feet height, bot = lowered pose */
  function push(h, fh, bot) {
    var hy = G - h, F = [34, G - fh], S = bot ? [146, hy - 9] : [148, hy - 30];
    var hp = lerp(F, S, 0.55), kn = lerp(F, S, 0.28), dx = S[0] - hp[0], dy = S[1] - hp[1], n = Math.sqrt(dx * dx + dy * dy) || 1;
    var hd = [S[0] + dx / n * 15, S[1] + dy / n * 15 - 2], el = bot ? [123, hy - 14] : [149, hy - 15], hn = [150, hy];
    return [hd[0], hd[1], S[0], S[1], el[0], el[1], hn[0], hn[1], hp[0], hp[1], kn[0], kn[1], F[0], F[1]];
  }
  function pushProps(h, fh) {
    var s = '';
    if (h > 0) s += '<rect x="138" y="' + (G - h) + '" width="44" height="' + h + '" rx="3" class="prop"/>';
    if (fh > 0) s += '<rect x="14" y="' + (G - fh) + '" width="30" height="' + fh + '" rx="3" class="prop"/>';
    return s;
  }
  function P(a, b, o) { o = o || {}; return { a: pz(a), b: b ? pz(b) : null, props: o.props || '', cap: o.cap || '' }; }
  var wall = '<line x1="162" y1="4" x2="162" y2="106" class="prop2"/>', bar = function (y, x1, x2) { return '<line x1="' + (x1 || 70) + '" y1="' + y + '" x2="' + (x2 || 130) + '" y2="' + y + '" class="prop2"/>'; };

  var PAT = {
    wallpush: P([108, 26, 104, 40, 130, 40, 160, 40, 94, 74, 82, 91, 70, 106], [140, 36, 136, 48, 124, 62, 160, 44, 112, 78, 92, 94, 70, 106], { props: wall }),
    push_c: P(push(40, 0, false), push(40, 0, true), { props: pushProps(40, 0) }),
    push_ch: P(push(24, 0, false), push(24, 0, true), { props: pushProps(24, 0) }),
    push0: P(push(0, 0, false), push(0, 0, true)),
    push_dec: P(push(0, 24, false), push(0, 24, true), { props: pushProps(0, 24) }),
    pike: P([112, 86, 108, 72, 116, 90, 122, 106, 78, 40, 56, 74, 34, 106], null),
    pikepush: P([112, 86, 108, 72, 116, 90, 122, 106, 78, 40, 56, 74, 34, 106], [124, 100, 116, 92, 102, 98, 122, 106, 78, 44, 56, 76, 34, 106]),
    hold_hs: P([94, 88, 100, 76, 100, 92, 100, 106, 112, 50, 120, 32, 126, 14], null, { props: wall.replace(/162/g, '134') }),
    hspu: P([94, 88, 100, 76, 100, 92, 100, 106, 112, 50, 120, 32, 126, 14], [98, 100, 102, 92, 86, 100, 100, 106, 114, 62, 120, 44, 126, 26], { props: wall.replace(/162/g, '134') }),
    dip: P([100, 22, 100, 36, 100, 52, 100, 68, 96, 66, 90, 84, 90, 102], [104, 44, 104, 58, 88, 64, 100, 68, 98, 84, 92, 96, 92, 106], { props: '<rect x="84" y="68" width="32" height="5" rx="2" class="prop"/>' }),
    planche: P([160, 74, 148, 82, 148, 94, 148, 106, 98, 80, 66, 80, 34, 80], null),
    fl: P([118, 42, 100, 40, 100, 28, 100, 14, 62, 40, 36, 40, 14, 40], null, { props: bar(14, 80, 120) }),
    row: P([151, 86, 135, 82, 143, 70, 150, 58, 90, 92, 62, 96, 34, 100], [152, 68, 142, 66, 131, 68, 150, 58, 92, 86, 62, 94, 34, 100], { props: '<line x1="132" y1="58" x2="170" y2="58" class="prop2"/>' }),
    pullup: P([100, 40, 100, 48, 100, 34, 100, 18, 100, 76, 100, 92, 100, 106], [100, 16, 100, 30, 86, 38, 100, 18, 100, 58, 100, 74, 100, 90], { props: bar(18) }),
    squat: P([100, 14, 100, 28, 114, 28, 128, 28, 100, 56, 100, 82, 100, 106], [118, 38, 110, 50, 128, 52, 146, 52, 80, 82, 122, 76, 100, 106]),
    lunge: P([100, 14, 100, 28, 114, 28, 128, 28, 100, 56, 104, 82, 104, 106, 96, 82, 92, 106], [102, 28, 102, 42, 114, 42, 128, 44, 100, 70, 126, 78, 122, 106, 70, 98, 48, 106]),
    pistol: P([100, 14, 100, 28, 114, 28, 128, 28, 100, 56, 100, 82, 100, 106, 116, 64, 136, 58], [112, 40, 108, 52, 126, 54, 144, 54, 80, 84, 120, 74, 100, 106, 120, 88, 160, 86]),
    bridge: P([22, 98, 40, 98, 58, 98, 74, 98, 96, 98, 122, 76, 132, 104], [22, 98, 40, 98, 58, 98, 74, 98, 94, 70, 124, 70, 132, 104]),
    hinge: P([100, 12, 100, 26, 108, 38, 114, 50, 100, 54, 100, 80, 100, 106], [46, 52, 60, 56, 62, 74, 62, 90, 108, 60, 108, 84, 108, 106, 134, 62, 166, 58]),
    nordic: P([124, 28, 124, 40, 140, 52, 150, 62, 120, 72, 120, 104, 98, 106], [60, 88, 76, 90, 62, 96, 50, 104, 100, 96, 120, 104, 98, 106]),
    calf: P([100, 14, 100, 28, 114, 28, 128, 28, 100, 56, 100, 82, 100, 106], [100, 6, 100, 20, 114, 20, 128, 20, 100, 48, 100, 74, 104, 100]),
    deadbug: P([20, 98, 40, 98, 44, 74, 46, 52, 94, 98, 96, 62, 122, 62], [20, 98, 40, 98, 30, 98, 16, 98, 94, 98, 130, 90, 162, 96]),
    plank: P([156, 76, 142, 80, 142, 98, 160, 98, 86, 88, 60, 94, 34, 100], null),
    hollow: P([42, 90, 60, 94, 48, 88, 32, 84, 104, 100, 130, 94, 156, 86], null),
    legraise: P([20, 98, 40, 98, 60, 98, 76, 98, 94, 98, 94, 62, 94, 28], [20, 98, 40, 98, 60, 98, 76, 98, 94, 98, 124, 94, 156, 94]),
    hangraise: P([100, 40, 100, 48, 100, 34, 100, 18, 100, 74, 100, 90, 100, 104], [100, 40, 100, 48, 100, 34, 100, 18, 100, 74, 128, 76, 156, 76], { props: bar(18) }),
    lsit: P([104, 52, 102, 66, 102, 86, 102, 106, 98, 90, 130, 90, 160, 90], null),
    deepsquat: P([112, 56, 108, 68, 122, 74, 132, 72, 84, 92, 118, 76, 100, 106], null),
    fold: P([76, 52, 76, 64, 88, 80, 100, 94, 80, 98, 114, 98, 148, 98], [140, 84, 132, 78, 146, 90, 152, 98, 80, 98, 114, 98, 148, 98])
  };

  function patternFor(track, name, level) {
    var n = (name || '').toLowerCase();
    switch (track) {
      case 'push': return /wall/.test(n) ? 'wallpush' : /counter/.test(n) ? 'push_c' : /chair/.test(n) ? 'push_ch' : /decline/.test(n) ? 'push_dec' : 'push0';
      case 'hs': return /pike push/.test(n) ? 'pikepush' : /pike hold|feet-on-wall/.test(n) ? 'pike' : /push-up|negative/.test(n) ? 'hspu' : 'hold_hs';
      case 'dips': return 'dip';
      case 'pl': return 'planche';
      case 'fl': return 'fl';
      case 'pull': return /row/.test(n) ? 'row' : 'pullup';
      case 'legs': return /lunge|bulgarian|cossack/.test(n) ? 'lunge' : /pistol|shrimp/.test(n) ? 'pistol' : 'squat';
      case 'post': return /nordic|slider/.test(n) ? 'nordic' : /deadlift/.test(n) ? 'hinge' : /superman/.test(n) ? 'hollow' : 'bridge';
      case 'calves': return 'calf';
      case 'core': return /dead bug/.test(n) ? 'deadbug' : /hollow/.test(n) ? 'hollow' : /lying leg/.test(n) ? 'legraise' : /hanging/.test(n) ? 'hangraise' : /l-sit/.test(n) ? 'lsit' : /dragon/.test(n) ? 'hollow' : 'plank';
      case 'obl': return /wiper/.test(n) ? 'legraise' : 'plank';
      case 'flex': return /deep squat/.test(n) ? 'deepsquat' : /bridge/.test(n) ? 'bridge' : 'fold';
    }
    return 'plank';
  }

  var reg = [], raf = null;
  function pts(a) { return a.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '); }
  function draw(f, pose) {
    var hd = pose[0], sh = pose[1], el = pose[2], hn = pose[3], hp = pose[4], kn = pose[5], ft = pose[6], k2 = pose[7] || kn, f2 = pose[8] || ft;
    f.head.setAttribute('cx', hd[0]); f.head.setAttribute('cy', hd[1]);
    f.torso.setAttribute('points', pts([sh, hp])); f.arm.setAttribute('points', pts([sh, el, hn]));
    f.leg.setAttribute('points', pts([hp, kn, ft])); f.leg2.setAttribute('points', pts([hp, k2, f2]));
  }
  function loop(ts) {
    reg = reg.filter(function (f) { return f.svg.isConnected; });
    reg.forEach(function (f) { if (!f.p.b) return; var e = 0.5 - 0.5 * Math.cos(ts / 1300 * Math.PI); draw(f, mix(f.p.a, f.p.b, e)); });
    raf = reg.length ? requestAnimationFrame(loop) : null;
  }
  function svgFor(pat, color) {
    var p = PAT[pat] || PAT.plank, NS = 'http://www.w3.org/2000/svg', d = document.createElement('div');
    d.innerHTML = '<svg viewBox="0 0 200 125" xmlns="' + NS + '" class="figsvg" style="--fc:' + color + '"><line x1="4" y1="' + G + '" x2="196" y2="' + G + '" class="gnd"/>' + p.props +
      '<polyline class="leg2" fill="none"/><polyline class="leg" fill="none"/><polyline class="torso" fill="none"/><polyline class="arm" fill="none"/><circle class="head" r="7"/></svg>';
    var svg = d.firstChild, f = { svg: svg, p: p, head: svg.querySelector('.head'), torso: svg.querySelector('.torso'), arm: svg.querySelector('.arm'), leg: svg.querySelector('.leg'), leg2: svg.querySelector('.leg2') };
    draw(f, p.a); return f;
  }
  /* find [data-fig="track|level|color"] placeholders under root and fill them */
  function mountAll(root, exByKey) {
    var els = root.querySelectorAll('[data-fig]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i]; if (el.firstChild) continue;
      var k = el.getAttribute('data-fig').split('|'), ex = exByKey(k[0], +k[1]);
      var f = svgFor(patternFor(k[0], ex.n, +k[1]), k[2]); el.appendChild(f.svg); reg.push(f);
    }
    if (reg.length && !raf) raf = requestAnimationFrame(loop);
  }
  return { mountAll: mountAll, patternFor: patternFor, PAT: PAT };
})();
