/* Spiral Workbench
 * Fibonacci spirals and Holden's lines. Plain JS + SVG, no libraries.
 *
 * Frame: unit square centred at (0,0), corners (+-1/2,+-1/2); 1 unit = side of the unit square;
 * y points up (flipped only when drawing); Holden unit HOLDEN = sqrt(0.1).
 *
 * Sections:  1 maths helpers  2 exact-form recognisers  3 the eight spirals  4 geometry (intersections)
 *            5 self-test      6 state + user objects     7 snapping + hit tests  8 drawing
 *            9 tools + pointer 10 panels + file I/O   11 rotation (live spirals, crossings, trails, graph)
 */
(() => {
'use strict';

/* ============================ 1. Maths helpers ============================ */
const TAU = Math.PI * 2, HOLDEN = Math.sqrt(0.1), TOL = 1e-9, FIB_MAX = 14;
const $ = id => document.getElementById(id);
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
const len = a => Math.hypot(a[0], a[1]);
const unit = a => { const l = len(a); return [a[0] / l, a[1] / l]; };
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const near = (a, b, t = TOL) => dist(a, b) < t;
const normAng = a => ((a % TAU) + TAU) % TAU;

/* The 8 symmetries of the unit square about (0,0), as integer 2x2 matrices [a,b,c,d]. */
const SYMS = [
  { name: 'Rotation 0°', short: '0°', M: [1, 0, 0, 1] },
  { name: 'Rotation 90°', short: '90°', M: [0, -1, 1, 0] },
  { name: 'Rotation 180°', short: '180°', M: [-1, 0, 0, -1] },
  { name: 'Rotation 270°', short: '270°', M: [0, 1, -1, 0] },
  { name: 'Mirror in the x-axis', short: 'mirror x', M: [1, 0, 0, -1] },
  { name: 'Mirror in the diagonal y = x', short: 'mirror y=x', M: [0, 1, 1, 0] },
  { name: 'Mirror in the y-axis', short: 'mirror y', M: [-1, 0, 0, 1] },
  { name: 'Mirror in the diagonal y = -x', short: 'mirror y=-x', M: [0, -1, -1, 0] },
];
const HUES = ['#1f6feb', '#e5484d', '#e060a8', '#d99a00'];   // rotations: blue, red, pink, yellow; mirrors reuse them dashed
const applyM = (M, p) => [M[0] * p[0] + M[1] * p[1] + 0, M[2] * p[0] + M[3] * p[1] + 0];   // "+ 0" turns -0 into 0

/* ====================== 2. Exact-form recognisers ======================== */
function asFraction(v, maxQ = 100) {                     // smallest q <= maxQ with |p/q - v| < 1e-9
  for (let q = 1; q <= maxQ; q++) {
    const p = Math.round(v * q);
    if (Math.abs(p / q - v) < TOL) return [p, q];
  }
  return null;
}
const fracStr = f => (f[1] === 1 ? `${f[0]}` : `${f[0]}/${f[1]}`);
const SQFREE = []; for (let n = 2; n <= 200; n++) { let ok = true; for (let k = 2; k * k <= n; k++) if (n % (k * k) === 0) { ok = false; break; } if (ok) SQFREE.push(n); }

/* Exact form of a number, or null: p/q, (p/q)*sqrt(n), (p/q)*pi.  q <= 100. */
function exactStr(v) {
  if (!isFinite(v)) return null;
  if (Math.abs(v) < TOL) return '0';
  if (v < 0) { const s = exactStr(-v); return s && '-' + s; }
  const f = asFraction(v); if (f) return fracStr(f);
  for (let q = 1; q <= 100; q++) for (const n of SQFREE) {
    const p = Math.round(v * q / Math.sqrt(n));
    if (p >= 1 && Math.abs(p * Math.sqrt(n) / q - v) < TOL) return `${p === 1 ? '' : p}√${n}${q === 1 ? '' : '/' + q}`;
  }
  const g = asFraction(v / Math.PI);
  if (g && g[0] !== 0) return `${g[0] === 1 ? '' : g[0]}π${g[1] === 1 ? '' : '/' + g[1]}`;
  return null;
}
/* Angle in degrees -> exact form: multiples of 15 deg, or arctan(p/q) (also 180 - arctan). */
function angleExact(deg) {
  const k = Math.round(deg / 15);
  if (Math.abs(deg - 15 * k) < 1e-7) return `${15 * k}°`;
  const t = Math.tan(deg * Math.PI / 180), a = Math.abs(t);
  const f = asFraction(a);
  if (f && f[0] >= 1 && f[0] <= 100 && Math.abs(Math.atan(f[0] / f[1]) - Math.atan(a)) < TOL)
    return deg < 90 ? `arctan(${fracStr(f)})` : `180° - arctan(${fracStr(f)})`;
  return null;
}
const fx = v => { const s = v.toFixed(6); return /^-0\.0+$/.test(s) ? s.slice(1) : s; };
const dec = v => String(+v.toFixed(6));
function fmtLen(v) {
  const e1 = exactStr(v), e2 = exactStr(v / HOLDEN);
  const ex = [e1 && e1 + ' u', e2 && e2 + ' h'].filter(Boolean).join(' = ');
  return `${fx(v)} u = ${fx(v / HOLDEN)} h` + (ex ? `  [${ex}]` : '');
}
function fmtArea(v) {
  const e1 = exactStr(v), e2 = exactStr(v / (HOLDEN * HOLDEN));
  const ex = [e1 && e1 + ' u²', e2 && e2 + ' h²'].filter(Boolean).join(' = ');
  return `${fx(v)} u² = ${fx(v / (HOLDEN * HOLDEN))} h²` + (ex ? `  [${ex}]` : '');
}
function fmtAngle(d) { const e = angleExact(d); return `${fx(d)}°` + (e ? `  [= ${e}]` : ''); }
function coordStr(p) {
  const fa = asFraction(p[0]), fb = asFraction(p[1]);
  let s = `(${dec(p[0])}, ${dec(p[1])})`;
  if (fa && fb) { const fs = `(${fracStr(fa)}, ${fracStr(fb)})`; if (fs.replace(/ /g, '') !== s.replace(/ /g, '')) s += '\n= ' + fs; }
  return s;
}
function lineEq(g) {                                    // "x + 3y = 0" style, integers when possible
  const L = g.k === 'seg' ? lineThru(g.p, g.q) : g;
  let n = [-L.d[1], L.d[0]], c = dot(n, L.p);
  const m = Math.max(Math.abs(n[0]), Math.abs(n[1]));
  n = [n[0] / m, n[1] / m]; c /= m;
  const sgn = (Math.abs(n[0]) > TOL ? n[0] : n[1]) < 0 ? -1 : 1; n = [n[0] * sgn, n[1] * sgn]; c *= sgn;
  let sc = 0;
  for (let s = 1; s <= 100 && !sc; s++) if ([n[0] * s, n[1] * s, c * s].every(v => Math.abs(v - Math.round(v)) < 1e-8)) sc = s;
  if (!sc) { const l = len(n); n = [n[0] / l, n[1] / l]; c /= l; sc = 1; }
  const co = (v, ch) => { v = +v.toFixed(6); if (v === 0) return ''; const a = Math.abs(v), t = (a === 1 ? '' : dec(a)) + ch; return v < 0 ? ` - ${t}` : ` + ${t}`; };
  let s = (co(n[0] * sc, 'x') + co(n[1] * sc, 'y')).trim();
  if (s.startsWith('+ ')) s = s.slice(2);
  return `${s} = ${dec(c * sc)}`;
}

/* ============================ 4. Geometry =============================== */
/* Geometry objects: {k:'line',p,d(unit)}  {k:'seg',p,q}  {k:'circ',c,r}  {k:'arc',c,r,a0,a1 (CCW)}  {k:'poly',v:[pts]} */
function lineThru(p, q) { return { k: 'line', p, d: unit(sub(q, p)) }; }
const carrier = g => g.k === 'seg' ? lineThru(g.p, g.q) : g.k === 'arc' ? { k: 'circ', c: g.c, r: g.r } : g;
function inRange(g, pt) {
  if (g.k === 'seg') {
    const d = sub(g.q, g.p), L2 = dot(d, d); if (L2 < 1e-30) return false;
    const t = dot(sub(pt, g.p), d) / L2; return t >= -1e-9 && t <= 1 + 1e-9;
  }
  if (g.k === 'arc') {
    const t = normAng(Math.atan2(pt[1] - g.c[1], pt[0] - g.c[0]) - g.a0);
    return t <= g.a1 - g.a0 + 1e-9 || t >= TAU - 1e-9;
  }
  return true;
}
function llInt(a, b) {
  const cr = cross(a.d, b.d); if (Math.abs(cr) < 1e-12) return [];
  const t = cross(sub(b.p, a.p), b.d) / cr;
  return [[a.p[0] + t * a.d[0], a.p[1] + t * a.d[1]]];
}
function lcInt(l, c) {
  const w = sub(l.p, c.c), b = dot(w, l.d), disc = b * b - (dot(w, w) - c.r * c.r);
  if (disc < -1e-12) return [];
  const sq = Math.sqrt(Math.max(0, disc)), ts = sq < 1e-9 ? [-b] : [-b - sq, -b + sq];
  return ts.map(t => [l.p[0] + t * l.d[0], l.p[1] + t * l.d[1]]);
}
function ccInt(a, b) {
  const d = dist(a.c, b.c); if (d < 1e-12 || d > a.r + b.r + 1e-12 || d < Math.abs(a.r - b.r) - 1e-12) return [];
  const x = (a.r * a.r - b.r * b.r + d * d) / (2 * d), h = Math.sqrt(Math.max(0, a.r * a.r - x * x));
  const u = [(b.c[0] - a.c[0]) / d, (b.c[1] - a.c[1]) / d], base = [a.c[0] + x * u[0], a.c[1] + x * u[1]];
  return h < 1e-9 ? [base] : [[base[0] - h * u[1], base[1] + h * u[0]], [base[0] + h * u[1], base[1] - h * u[0]]];
}
/* Intersection points of two line / segment / circle / arc objects (in a stable order). */
function intersect(g1, g2) {
  if (g1.k === 'arc' && g2.k === 'arc' && near(g1.c, g2.c, 1e-9) && Math.abs(g1.r - g2.r) < 1e-9) {   // two arcs of one circle: they meet where one ends on the other
    const out = [], end = (g, t) => [g.c[0] + g.r * Math.cos(t), g.c[1] + g.r * Math.sin(t)];
    for (const p of [end(g1, g1.a0), end(g1, g1.a1), end(g2, g2.a0), end(g2, g2.a1)])
      if (inRange(g1, p) && inRange(g2, p) && !out.some(q => near(q, p, 1e-9))) out.push(p);
    return out;
  }
  const a = carrier(g1), b = carrier(g2);
  const pts = a.k === 'line' ? (b.k === 'line' ? llInt(a, b) : lcInt(a, b)) : (b.k === 'line' ? lcInt(b, a) : ccInt(a, b));
  return pts.filter(p => inRange(g1, p) && inRange(g2, p));
}
const polyArea = v => { let s = 0; for (let i = 0; i < v.length; i++) s += cross(v[i], v[(i + 1) % v.length]); return Math.abs(s) / 2; };
const angleDeg = (a, v, b) => { const u = sub(a, v), w = sub(b, v); return Math.acos(Math.max(-1, Math.min(1, dot(u, w) / (len(u) * len(w))))) * 180 / Math.PI; };

/* =========================== 3. The eight spirals ========================= */
/* Spiral 0: squares attached down, right, up, left, ...; one quarter-circle arc per square. */
function buildSpiral0(n) {
  const squares = [], arcs = [], dirs = ['down', 'right', 'up', 'left'];
  let x0 = -.5, x1 = .5, y0 = -.5, y1 = .5;
  squares.push({ side: 1, ll: [-.5, -.5] });
  for (let k = 2; k <= n; k++) {
    const w = x1 - x0, h = y1 - y0;
    switch (dirs[(k - 2) % 4]) {
      case 'down': squares.push({ side: w, ll: [x0, y0 - w] }); y0 -= w; break;
      case 'right': squares.push({ side: h, ll: [x1, y0] }); x1 += h; break;
      case 'up': squares.push({ side: w, ll: [x0, y1] }); y1 += w; break;
      default: squares.push({ side: h, ll: [x0 - h, y0] }); x0 -= h;
    }
  }
  for (const q of squares) q.c = [q.ll[0] + q.side / 2, q.ll[1] + q.side / 2];
  // Arcs by the rule: a_k = 90deg*k, c_k = P_{k-1} - s_k u(a_k), P_k = c_k + s_k u(a_k + 90deg); counter-clockwise.
  const u = t => [Math.cos(t), Math.sin(t)];
  let P = [.5, .5];
  squares.forEach((q, i) => {
    const ak = (Math.PI / 2) * (i + 1), c = [P[0] - q.side * Math.round(u(ak)[0]), P[1] - q.side * Math.round(u(ak)[1])];   // u at multiples of 90deg is exact
    const E = [c[0] + q.side * Math.round(u(ak + Math.PI / 2)[0]), c[1] + q.side * Math.round(u(ak + Math.PI / 2)[1])];
    arcs.push({ c, r: q.side, a0: ak, a1: ak + Math.PI / 2, p0: P, p1: E });
    P = E;
  });
  return { squares, arcs };
}
const BASE = buildSpiral0(FIB_MAX);
/* Inward continuation by halving squares (sides 1/2, 1/4, ...): the same arc rule run backwards from the start (1/2, 1/2).
 * The steps form a geometric series and converge exactly to (7/10, -1/10), the origin of the neighbouring mirror square. */
function buildInward(n = 16) {
  const pts = [], squares = [], arcs = [], u = t => [Math.round(Math.cos(t)), Math.round(Math.sin(t))];
  let P = [.5, .5], s = .5;
  for (let k = 0; k > -n; k--) {
    const a = (Math.PI / 2) * k, c = [P[0] - s * u(a + Math.PI / 2)[0], P[1] - s * u(a + Math.PI / 2)[1]];
    for (let j = 0; j <= 16; j++) { const t = a + Math.PI / 2 - (Math.PI / 2) * j / 16; pts.push([c[0] + s * Math.cos(t), c[1] + s * Math.sin(t)]); }
    const P2 = [c[0] + s * u(a)[0], c[1] + s * u(a)[1]], F = [P[0] + P2[0] - c[0], P[1] + P2[1] - c[1]];
    arcs.push({ k: 'arc', c, r: s, a0: a, a1: a + Math.PI / 2, p0: P, p1: P2, rev: true, inward: true });   // drawn from P (angle a + 90deg) back to P2 (angle a)
    squares.push({ side: s, corners: [c, P, F, P2], c: [(c[0] + F[0]) / 2, (c[1] + F[1]) / 2] });
    P = P2; s /= 2;
  }
  return { pts, squares, arcs };                           // from the start inwards
}
const INW = buildInward(), INWARD = INW.pts, HSTART = [.7, -.1];   // the halving squares end at (7/10, -1/10)
/* An arc moved by a rigid map T: a turn keeps its sense, a reflection (det = -1) reverses it. */
function xfArc(g, T, det) {
  const c = T(g.c), span = g.a1 - g.a0, at = t => T([g.c[0] + g.r * Math.cos(t), g.c[1] + g.r * Math.sin(t)]);
  const st = det > 0 ? at(g.a0) : at(g.a1), a0 = Math.atan2(st[1] - c[1], st[0] - c[0]);
  return Object.assign({}, g, { c, a0, a1: a0 + span, p0: T(g.p0), p1: T(g.p1), rev: det > 0 ? g.rev : !g.rev });
}

/* Every spiral = the base images under one of the symmetries. */
const SP = SYMS.map((sym, i) => {
  const M = sym.M, T = p => applyM(M, p), flip = M[0] * M[3] - M[1] * M[2] < 0;
  const squares = BASE.squares.map(s => {
    const [x, y] = s.ll, a = s.side;
    return { side: a, c: T(s.c), corners: [[x, y], [x + a, y], [x + a, y + a], [x, y + a]].map(T) };
  });
  const arcs = BASE.arcs.map(a => {
    const c = T(a.c), p0 = T(a.p0), p1 = T(a.p1), st = flip ? p1 : p0;   // a mirror turns the arc clockwise: swap ends
    const a0 = Math.atan2(st[1] - c[1], st[0] - c[0]);
    return { k: 'arc', c, r: a.r, a0, a1: a0 + Math.PI / 2, p0, p1, rev: flip };
  });
  const lines = [lineThru(squares[0].c, squares[2].c), lineThru(squares[1].c, squares[3].c)];   // centres 1,3,5.. and 2,4,6..
  const H = intersect(lines[0], lines[1])[0];            // Holden's crossing, computed, not hard-coded
  return { i, name: sym.name, short: sym.short, M, mirror: flip, col: HUES[i % 4],   /* spiral 4 + k is the mirror of spiral k in an axis through O (4 of 0, 5 of 1, 6 of 2, 7 of 3), so it takes its colour */ squares, arcs, lines, H, inward: INWARD.map(T), inArcs: INW.arcs.map(g => xfArc(g, T, flip ? -1 : 1)), inSq: INW.squares.map(q => ({ side: q.side, c: T(q.c), corners: q.corners.map(T) })), Hs: T(HSTART),
           nA: applyM(M, [1, 3]), nB: applyM(M, [3, -1]) };   // Holden grid: nA.p = m, nB.p = 1 + m  (m whole)
});

/* Live spirals: each spiral turned by its own angle about its own origin (its Holden crossing) or about O.
 * SP stays the exact, unrotated construction (the self-test checks it); drawing, picking and the tools use LV. */
const ROLE = { odd: '#2e7d4f', even: '#b4532a' };      // odd line (centres 1, 3, 5, ...) green, even line rust
function rotAbout(c, phi) {
  const co = Math.cos(phi), si = Math.sin(phi);
  return p => [c[0] + co * (p[0] - c[0]) - si * (p[1] - c[1]), c[1] + si * (p[0] - c[0]) + co * (p[1] - c[1])];
}
function liveSpiral(S, phi, C) {
  if (Math.abs(phi) < 1e-15) return Object.assign({}, S, { phi: 0, C, offA: 0, offB: 1 });
  const T = rotAbout(C, phi), co = Math.cos(phi), si = Math.sin(phi), Rv = v => [co * v[0] - si * v[1], si * v[0] + co * v[1]];
  const nA = Rv(S.nA), nB = Rv(S.nB);
  return Object.assign({}, S, {
    phi, C,
    squares: S.squares.map(q => ({ side: q.side, c: T(q.c), corners: q.corners.map(T) })),
    arcs: S.arcs.map(a => Object.assign({}, a, { c: T(a.c), p0: T(a.p0), p1: T(a.p1), a0: a.a0 + phi, a1: a.a1 + phi })),
    lines: S.lines.map(l => ({ k: 'line', p: T(l.p), d: Rv(l.d) })),
    H: T(S.H), nA, nB, inward: S.inward.map(T), inArcs: S.inArcs.map(g => xfArc(g, T, 1)), Hs: T(S.Hs),
    inSq: S.inSq.map(q => ({ side: q.side, c: T(q.c), corners: q.corners.map(T) })),
    offA: dot(nA, C) - dot(S.nA, C), offB: 1 + dot(nB, C) - dot(S.nB, C),   // grid lines nA.p = m + offA, nB.p = m + offB
  });
}
let LV = SP.map(S => liveSpiral(S, 0, S.H));   // replaced by updateLive() once the state exists
function spinOf(i) { const r = state.layers[i].rot || 0; return r * state.theta * Math.PI / 180; }   // rot: 0 off, -1 clockwise, +1 anticlockwise
const centreOf = S => state.rotCentre === 'O' ? [0, 0] : state.rotCentre === 'start' ? S.Hs : S.H;
/* Flip a live spiral about its own centre C (0 none, 1 left-right, 2 up-down, 3 both = half turn),
 * and flip everything through the circle of origins about O (inversion z -> 0.1 z/|z|^2: outside <-> inside, the eight origins stay put). */
const FLIPSYM = ['·', '↔', '↕', '✣'], FLIPNAME = ['not flipped', 'flipped left-right about its centre', 'flipped up-down about its centre', 'flipped both ways (a half turn about its centre)'];
function flipSpiral(S, C, mode) {
  if (!mode) return S;
  const M = mode === 1 ? [-1, 0, 0, 1] : mode === 2 ? [1, 0, 0, -1] : [-1, 0, 0, -1], refl = mode !== 3;
  const Lm = v => [M[0] * v[0] + M[1] * v[1], M[2] * v[0] + M[3] * v[1]], T = p => { const d = Lm([p[0] - C[0], p[1] - C[1]]); return [C[0] + d[0], C[1] + d[1]]; };
  const ang = a => mode === 1 ? Math.PI - a : mode === 2 ? -a : a + Math.PI;
  const nA = Lm(S.nA), nB = Lm(S.nB);
  return Object.assign({}, S, {
    flip: mode,
    squares: S.squares.map(q => ({ side: q.side, c: T(q.c), corners: q.corners.map(T) })),
    arcs: S.arcs.map(a => { const span = a.a1 - a.a0, a0 = refl ? ang(a.a1) : ang(a.a0); return Object.assign({}, a, { c: T(a.c), p0: T(a.p0), p1: T(a.p1), a0, a1: a0 + span, rev: refl ? !a.rev : a.rev }); }),
    lines: S.lines.map(l => ({ k: 'line', p: T(l.p), d: Lm(l.d) })),
    H: T(S.H), nA, nB, inward: S.inward.map(T), inArcs: S.inArcs.map(g => xfArc(g, T, refl ? -1 : 1)), Hs: T(S.Hs),
    inSq: S.inSq.map(q => ({ side: q.side, c: T(q.c), corners: q.corners.map(T) })),
    offA: S.offA + dot(nA, C) - dot(S.nA, C), offB: S.offB + dot(nB, C) - dot(S.nB, C),
  });
}
const INV = p => { const d = p[0] * p[0] + p[1] * p[1]; return d < 1e-18 ? [1e9, 1e9] : [0.1 * p[0] / d, 0.1 * p[1] / d]; };
function invEdges(corners, k = 12) {                      // a square's sides become circular arcs: sample them
  const out = [];
  for (let j = 0; j < corners.length; j++) { const a = corners[j], b = corners[(j + 1) % corners.length]; for (let t = 0; t < k; t++) out.push(INV([a[0] + (b[0] - a[0]) * t / k, a[1] + (b[1] - a[1]) * t / k])); }
  return out;
}
function invArc(a) {
    const den = a.c[0] * a.c[0] + a.c[1] * a.c[1] - a.r * a.r;
    if (Math.abs(den) < 1e-12) return Object.assign({}, a, { r: 0, c: INV(a.p0), a0: 0, a1: 0, dead: true });   // a circle through O would become a line
    const c = [0.1 * a.c[0] / den, 0.1 * a.c[1] / den], r = 0.1 * a.r / Math.abs(den);
    const at = t => [a.c[0] + a.r * Math.cos(t), a.c[1] + a.r * Math.sin(t)], th = p => Math.atan2(p[1] - c[1], p[0] - c[0]);
    const sP = INV(at(a.rev ? a.a1 : a.a0)), eP = INV(at(a.rev ? a.a0 : a.a1)), mP = INV(at((a.a0 + a.a1) / 2));
    const as = th(sP), ae = th(eP), am = th(mP), span = normAng(ae - as);
    const fwd = normAng(am - as) <= span + 1e-12;
    const a0 = fwd ? as : ae, a1 = a0 + (fwd ? span : normAng(as - ae));
    return Object.assign({}, a, { c, r, a0, a1, rev: !fwd, p0: INV(a.p0), p1: INV(a.p1) });
}
function invertSpiral(S) {
  return Object.assign({}, S, {
    inverted: true, arcs: S.arcs.map(invArc), inArcs: S.inArcs.map(invArc),
    squares: S.squares.map(q => ({ side: q.side, c: INV(q.c), corners: invEdges(q.corners) })),
    lines: [], H: INV(S.H), Hs: INV(S.Hs), inward: S.inward.map(INV),
    inSq: S.inSq.map(q => ({ side: q.side, c: INV(q.c), corners: invEdges(q.corners) })),
  });
}
function updateLive() {
  LV = SP.map((S, i) => { const C = centreOf(S); let L = flipSpiral(liveSpiral(S, spinOf(i), C), C, state.layers[i].flip || 0); if (state.invert) L = invertSpiral(L); return L; });
  dirty.snap = dirty.dyn = true;
}

/* ============================== 5. Self-test ============================== */
function selfTest() {
  const R = [], chk = (name, ok, info = '') => R.push({ name, ok: !!ok, info });
  const S0 = SP[0];
  const cen = [[0, 0], [0, -1], [1.5, -.5], [1, 2], [-3, 1], [-1.5, -5.5], [9, -3], [5, 14]];
  const ll = [[-.5, -.5], [-.5, -1.5], [.5, -1.5], [-.5, .5], [-5.5, -1.5], [-5.5, -9.5], [2.5, -9.5], [-5.5, 3.5]];
  const sides = [1, 1, 2, 3, 5, 8, 13, 21];
  chk('Spiral 0 centres, corners and sides match the table',
    cen.every((c, k) => near(S0.squares[k].c, c) && near(S0.squares[k].corners[0], ll[k]) && Math.abs(S0.squares[k].side - sides[k]) < TOL));
  const lucas = [1, 3, 4, 7, 11, 18, 29, 47, 76, 123];
  chk('Holden crossing of spiral 0 is (0.3, -0.1)', near(S0.H, [.3, -.1]), `got ${S0.H}`);
  chk('Distances from H0 to centres 1-10 in h are the Lucas numbers',
    lucas.every((L, k) => Math.abs(dist(S0.H, S0.squares[k].c) / HOLDEN - L) < 1e-7));
  chk('Centres lie alternately on x+3y=0 and y=3x-1',
    S0.squares.every((s, k) => k % 2 === 0 ? Math.abs(s.c[0] + 3 * s.c[1]) < TOL : Math.abs(s.c[1] - 3 * s.c[0] + 1) < TOL));
  const tbl = [[1, [.5, .5], [.5, -.5], [-.5, -.5]], [1, [-.5, -.5], [.5, -.5], [.5, -1.5]], [2, [.5, -1.5], [.5, .5], [2.5, .5]], [3, [2.5, .5], [-.5, .5], [-.5, 3.5]],
    [5, [-.5, 3.5], [-.5, -1.5], [-5.5, -1.5]], [8, [-5.5, -1.5], [2.5, -1.5], [2.5, -9.5]], [13, [2.5, -9.5], [2.5, 3.5], [15.5, 3.5]], [21, [15.5, 3.5], [-5.5, 3.5], [-5.5, 24.5]]];
  chk('Spiral 0 arcs 1-8: side, start, centre, end match the table',
    tbl.every(([r, f, c, t], k) => { const a = BASE.arcs[k]; return Math.abs(a.r - r) < TOL && near(a.p0, f) && near(a.c, c) && near(a.p1, t); }));
  chk('Each arc centre is a corner of its square; the arc midpoint lies inside the square',
    BASE.arcs.every((a, k) => { const q = BASE.squares[k], lo = q.ll, hi = [lo[0] + q.side, lo[1] + q.side];
      const m = [a.c[0] + a.r * Math.cos(a.a0 + Math.PI / 4), a.c[1] + a.r * Math.sin(a.a0 + Math.PI / 4)];
      return [lo, hi, [lo[0], hi[1]], [hi[0], lo[1]]].some(c => near(c, a.c)) && m[0] > lo[0] && m[0] < hi[0] && m[1] > lo[1] && m[1] < hi[1]; }));
  chk('Arc 1 of spiral 0 goes (0.5,0.5) to (-0.5,-0.5) about (0.5,-0.5)', near(BASE.arcs[0].p0, [.5, .5]) && near(BASE.arcs[0].p1, [-.5, -.5]) && near(BASE.arcs[0].c, [.5, -.5]));
  chk('Consecutive arcs join for all 8 spirals (and lie on their circles)',
    SP.every(S => S.arcs.every((a, k) => (k === FIB_MAX - 1 || near(a.p1, S.arcs[k + 1].p0)) &&
      Math.abs(dist(a.p0, a.c) - a.r) < TOL && Math.abs(dist(a.p1, a.c) - a.r) < TOL)));
  const want = [[.3, .1], [.3, -.1], [-.3, .1], [-.3, -.1], [.1, .3], [.1, -.3], [-.1, .3], [-.1, -.3]];
  chk('The 8 crossings are (+-0.3,+-0.1), (+-0.1,+-0.3)', want.every(w => SP.filter(S => near(S.H, w)).length === 1));
  chk('Arc 1 of the 8 spirals is centred on the four corners', SP.every(S => [[.5, .5], [.5, -.5], [-.5, .5], [-.5, -.5]].some(c => near(S.arcs[0].c, c))));
  const pts = intersect({ k: 'line', p: [0, 0], d: unit([3, -1]) }, { k: 'circ', c: [.5, -.5], r: 1 });
  chk('Line x+3y=0 meets circle (r 1 at (0.5,-0.5)) in (-0.3,0.1) and (1.5,-0.5)',
    pts.length === 2 && pts.some(p => near(p, [-.3, .1])) && pts.some(p => near(p, [1.5, -.5])), JSON.stringify(pts));
  chk('Halving lead-in of spiral 0 converges to (0.7, -0.1)', near(INWARD[INWARD.length - 1], [.7, -.1], 1e-4), `got ${INWARD[INWARD.length - 1]}`);
  chk('Halving squares: centres alternately on slopes 7 and -1/7 through (0.7, -0.1), half a diagonal away',
    INW.squares.slice(0, 10).every((q, k) => { const d = sub(q.c, HSTART), sl = k % 2 ? -1 / 7 : 7; return Math.abs(d[1] - sl * d[0]) < 1e-12 && Math.abs(len(d) - q.side / Math.SQRT2) < 1e-12; }));
  for (const r of R) console.log(`${r.ok ? 'PASS' : 'FAIL'}: ${r.name}${r.ok ? '' : ' ' + r.info}`);
  return R;
}
const TESTS = selfTest();

/* ======================= 6. State and user objects ======================== */
const state = {
  layers: SYMS.map((_, i) => ({ arc: true, sq: i === 0, ctr: i === 0, hl: i === 0, grid: false, cross: i === 0 })),
  nFib: 10, showUnit: true, showCircH: true, bgGrid: false, snap: true,
  lineColour: 'role', theta: 0, total: 0, rotCentre: 'start', speed: 15, showX: true, trails: false, pin: true, turns: 1, gMul: 1, gZero: false, gLog: false, gAxis: 'fit', gMarks: [], gAuto: true,
};
const LAYER_KEYS = [['arc', 'Spiral'], ['sq', 'Squares'], ['ctr', 'Centres'], ['hl', 'Holden lines'], ['grid', 'Holden grid'], ['cross', 'Crossing']];

/* User objects (in creation order; parents always come before children). Fields by type:
 *  pt {x,y} | {mid:[ref,ref?]} | {inter:[refA,refB,k]}     seg/line {a,b}     par/perp {base,thr}
 *  circ {c,p} | {c,r}   poly {pts}   dist {a,b}   ang {a,v,b}   area {ref}
 * A ref is a user object id (number) or a built-in key (string): "hl:s:i", "arc:s:k", "usq:i", "circh". */
let objs = [], nextId = 1, labelN = 0;
const byId = new Map();
let sel = null, tool = 'select', pending = [], hoverRef = null, hoverPt = null, snapHit = null, drag = null, msg = '';
let undoStack = [], redoStack = [], dirty = { snap: true, dyn: true };

const ser = () => JSON.stringify({ objs, nextId, labelN }, (k, v) => (k === 'g' || k === '_last' ? undefined : v));
function pushUndo(before) { undoStack.push(before); if (undoStack.length > 200) undoStack.shift(); redoStack = []; }
function restore(s) { const o = JSON.parse(s); objs = o.objs; nextId = o.nextId; labelN = o.labelN; sel = null; pending = []; dirty.dyn = true; }
function undo() { if (!undoStack.length) return; redoStack.push(ser()); restore(undoStack.pop()); req(); }
function redo() { if (!redoStack.length) return; undoStack.push(ser()); restore(redoStack.pop()); req(); }

function builtinGeom(key) {
  const [t, a, b] = key.split(':');
  if (t === 'hl') return LV[+a].lines[+b] || null;
  if (t === 'arc') return LV[+a].arcs[+b];
  if (t === 'ina') return LV[+a].inArcs[+b] || null;
  if (t === 'usq') { const c = [[-.5, -.5], [.5, -.5], [.5, .5], [-.5, .5]]; return { k: 'seg', p: c[+a], q: c[(+a + 1) % 4] }; }
  if (t === 'circh') return { k: 'circ', c: [0, 0], r: HOLDEN };
  return null;
}
/* Built-in points a user point can be pinned to: square centres, square corners, origins (Holden crossings). */
function builtinPoint(key) {
  const [t, a, b, c] = key.split(':'), S = LV[+a]; if (!S) return null;
  if (t === 'ctr') return S.squares[+b] ? S.squares[+b].c : null;
  if (t === 'cnr') return S.squares[+b] ? S.squares[+b].corners[+c] : null;
  if (t === 'hx') return S.H;
  if (t === 'hs') return S.Hs;
  return null;
}
/* The curves of a live spiral that are drawn: its arcs and, when it turns about where it starts, the halving arcs leading in. */
const N_IN = 12;
const spiralCurves = S => S.arcs.slice(0, state.nFib).concat(state.rotCentre === 'start' ? S.inArcs.slice(0, N_IN) : []).filter(g => !g.dead);
const allCurves = S => S.arcs.concat(state.rotCentre === 'start' ? S.inArcs.slice(0, N_IN) : []).filter(g => !g.dead);
const G = ref => (typeof ref === 'string' ? builtinGeom(ref) : (byId.get(ref) || {}).g || null);
const P = id => { const g = (byId.get(id) || {}).g; return Array.isArray(g) ? g : null; };

function compute(o) {
  switch (o.t) {
    case 'pt': {
      if (o.mid) {
        if (o.mid.length === 2) { const a = P(o.mid[0]), b = P(o.mid[1]); return a && b ? mid(a, b) : null; }
        const g = G(o.mid[0]); return g && g.k === 'seg' ? mid(g.p, g.q) : null;
      }
      if (o.inter) {                                     // follow the same crossing: the one nearest to where it was
        // an arc ref stands for its whole spiral, so the crossing is followed from one arc to the next as the spirals turn
        const curves = r => (typeof r === 'string' && /^(arc|ina):/.test(r)) ? allCurves(LV[+r.split(':')[1]]) : [G(r)];
        const A = curves(o.inter[0]), B = curves(o.inter[1]); if (!A[0] || !B[0]) return null;
        const pts = []; let same = false;
        for (const a of A) for (const b of B) { if (a.k === 'arc' && b.k === 'arc' && near(a.c, b.c, 1e-9) && Math.abs(a.r - b.r) < 1e-9) same = true; for (const p of intersect(a, b)) pts.push(p); }
        if (!pts.length) return same && o._last ? o._last : null;
        const target = o._last || o.seed;
        let q = target ? null : pts[o.inter[2]] || pts[0], bd = Infinity;
        if (target) for (const p of pts) { const d = dist(p, target); if (d < bd) { bd = d; q = p; } }
        if (target && bd > 0.4 * (1 + len(target))) return same ? o._last : null;   // it ran off the drawn spirals: lost here, picked up again if it comes back
        o._last = q; return q;
      }
      if (o.at) return builtinPoint(o.at);
      return [o.x, o.y];
    }
    case 'seg': case 'line': { const a = P(o.a), b = P(o.b); if (!a || !b || near(a, b, 1e-12)) return null; return o.t === 'seg' ? { k: 'seg', p: a, q: b } : lineThru(a, b); }
    case 'par': case 'perp': {
      const g = G(o.base), p = P(o.thr); if (!g || !p) return null;
      const d = g.k === 'seg' ? unit(sub(g.q, g.p)) : g.d; if (!d) return null;
      return { k: 'line', p, d: o.t === 'par' ? d : [-d[1], d[0]] };
    }
    case 'circ': {
      const c = P(o.c); if (!c) return null;
      if (o.p !== undefined) { const q = P(o.p); return q && !near(c, q, 1e-12) ? { k: 'circ', c, r: dist(c, q) } : null; }
      return { k: 'circ', c, r: o.r };
    }
    case 'poly': { const v = o.pts.map(P); return v.every(Boolean) ? { k: 'poly', v } : null; }
    case 'dist': { const a = P(o.a), b = P(o.b); return a && b ? dist(a, b) : null; }
    case 'ang': { const a = P(o.a), v = P(o.v), b = P(o.b); return a && v && b && !near(a, v, 1e-12) && !near(b, v, 1e-12) ? angleDeg(a, v, b) : null; }
    case 'area': { const g = G(o.ref); return !g ? null : g.k === 'poly' ? polyArea(g.v) : g.k === 'circ' ? Math.PI * g.r * g.r : null; }
    case 'mark': { const a = P(o.a); return a ? { k: 'mark', c: a } : null; }
  }
  return null;
}
function resolveAll() { byId.clear(); for (const o of objs) { byId.set(o.id, o); o.g = compute(o); } }
function deps(o) {
  const d = [];
  for (const k of ['a', 'b', 'c', 'p', 'v', 'thr', 'base', 'ref']) if (typeof o[k] === 'number') d.push(o[k]);
  for (const k of ['pts', 'mid']) if (o[k]) d.push(...o[k].filter(x => typeof x === 'number'));
  if (o.inter) d.push(...o.inter.slice(0, 2).filter(x => typeof x === 'number'));
  return d;
}
function deleteCascade(id) {
  const kill = new Set([id]);
  for (let ch = true; ch;) { ch = false; for (const o of objs) if (!kill.has(o.id) && deps(o).some(d => kill.has(d))) { kill.add(o.id); ch = true; } }
  objs = objs.filter(o => !kill.has(o.id)); dirty.dyn = true;
}
function addObj(o) {
  o.id = nextId++;
  if (o.t === 'pt') { const n = labelN++; o.label = String.fromCharCode(65 + n % 26) + (n >= 26 ? Math.floor(n / 26) : ''); }
  objs.push(o); byId.set(o.id, o); o.g = compute(o); dirty.dyn = true; return o.id;
}

/* ===================== 7. Snapping, hit tests, view ======================= */
const svg = $('svg'), gmain = $('gmain'), gover = $('gover'), stage = $('stage');
let VW = 800, VH = 600, view = { cx: 0.6, cy: 0.3, s: 100 };
const w2s = p => [VW / 2 + (p[0] - view.cx) * view.s, VH / 2 - (p[1] - view.cy) * view.s];
const s2w = (x, y) => [view.cx + (x - VW / 2) / view.s, view.cy - (y - VH / 2) / view.s];

/* Visible built-in objects the tools can pick (Holden lines, arcs, unit square edges, h-circle). */
function builtinList() {
  const out = [];
  state.layers.forEach((L, i) => {
    if (L.hl) LV[i].lines.forEach((g, j) => out.push({ ref: `hl:${i}:${j}`, g }));
    if (L.arc) LV[i].arcs.slice(0, state.nFib).forEach((g, j) => { if (!g.dead) out.push({ ref: `arc:${i}:${j}`, g }); });
    if (L.arc && state.rotCentre === 'start') LV[i].inArcs.slice(0, N_IN).forEach((g, j) => { if (!g.dead) out.push({ ref: `ina:${i}:${j}`, g }); });
  });
  if (state.showUnit) for (let j = 0; j < 4; j++) out.push({ ref: `usq:${j}`, g: builtinGeom(`usq:${j}`) });
  if (state.showCircH) out.push({ ref: 'circh', g: builtinGeom('circh') });
  return out;
}
let staticCands = [], dynCands = [];
function buildStatic() {
  const c = [], n = state.nFib;
  state.layers.forEach((L, i) => {
    const S = LV[i];
    if (L.ctr) S.squares.slice(0, n).forEach((q, k) => c.push({ p: q.c, src: { at: `ctr:${i}:${k}` } }));
    if (L.sq) S.squares.slice(0, n).forEach((q, k) => q.corners.forEach((p, j) => c.push({ p, src: { at: `cnr:${i}:${k}:${j}` } })));
    if (L.cross) c.push({ p: S.H, src: { at: `hx:${i}` } });
    if (L.cross && state.rotCentre === 'start') c.push({ p: S.Hs, src: { at: `hs:${i}` } });
  });
  if (state.showUnit) { c.push({ p: [0, 0] }); for (const x of [-.5, .5]) for (const y of [-.5, .5]) c.push({ p: [x, y] }); }
  const b = builtinList();
  for (let i = 0; i < b.length; i++) for (let j = i + 1; j < b.length; j++) intersect(b[i].g, b[j].g).forEach((p, k) => c.push({ p, src: { inter: [b[i].ref, b[j].ref, k] } }));
  staticCands = c; dirty.snap = false;
}
function buildDyn() {
  const c = [], us = objs.filter(o => o.g && o.t !== 'pt' && o.t !== 'poly' && typeof o.g === 'object' && o.g.k !== 'poly' && ['seg', 'line', 'par', 'perp', 'circ'].includes(o.t));
  const b = builtinList();
  us.forEach((u, i) => {
    for (const o of b) intersect(u.g, o.g).forEach((p, k) => c.push({ p, src: { inter: [u.id, o.ref, k] } }));
    for (let j = i + 1; j < us.length; j++) intersect(u.g, us[j].g).forEach((p, k) => c.push({ p, src: { inter: [u.id, us[j].id, k] } }));
  });
  dynCands = c; dirty.dyn = false;
}
/* Nearest snap target within r px of world point w, or null. */
function snapAt(w, r = 10) {
  if (dirty.snap) buildStatic();
  if (dirty.dyn) buildDyn();
  let best = null, bd = r / view.s;
  const tryP = (p, src) => { const d = dist(p, w); if (d < bd) { bd = d; best = src ? Object.assign([p[0], p[1]], { src }) : p; } };
  for (const c of staticCands) tryP(c.p, c.src);
  for (const c of dynCands) tryP(c.p, c.src);
  state.layers.forEach((L, i) => {                        // Holden grid nodes of spirals whose grid is shown
    if (!L.grid || LV[i].flip || LV[i].inverted) return;
    const S = LV[i], back = rotAbout(S.C, -S.phi), fwd = rotAbout(S.C, S.phi);
    const q = applyM([S.M[0], S.M[2], S.M[1], S.M[3]], back(w));   // undo the turn, then the symmetry (transpose)
    const m = Math.round(q[0] + 3 * q[1]), m2 = Math.round(3 * q[0] - q[1] - 1);
    tryP(fwd(applyM(S.M, [(m + 3 * (1 + m2)) / 10, (3 * m - (1 + m2)) / 10])));
  });
  return best;
}
function distToSeg(pt, a, b) {
  const d = sub(b, a), L2 = dot(d, d), t = L2 ? Math.max(0, Math.min(1, dot(sub(pt, a), d) / L2)) : 0;
  return dist(pt, [a[0] + t * d[0], a[1] + t * d[1]]);
}
function pointInPoly(pt, v) {
  let c = false;
  for (let i = 0, j = v.length - 1; i < v.length; j = i++)
    if ((v[i][1] > pt[1]) !== (v[j][1] > pt[1]) && pt[0] < (v[j][0] - v[i][0]) * (pt[1] - v[i][1]) / (v[j][1] - v[i][1]) + v[i][0]) c = !c;
  return c;
}
/* Distance in px from world point w to geometry g. */
function distPx(g, w) {
  const s = view.s;
  switch (g.k) {
    case 'line': return Math.abs(cross(sub(w, g.p), g.d)) * s;
    case 'seg': return distToSeg(w, g.p, g.q) * s;
    case 'circ': return Math.abs(dist(w, g.c) - g.r) * s;
    case 'arc': return inRange(g, w) ? Math.abs(dist(w, g.c) - g.r) * s : Math.min(dist(w, g.p0), dist(w, g.p1)) * s;
    case 'mark': return Math.abs(dist(w, g.c) * s - 17);
    case 'poly': {
      let d = Infinity; for (let i = 0; i < g.v.length; i++) d = Math.min(d, distToSeg(w, g.v[i], g.v[(i + 1) % g.v.length]) * s);
      return d > 6 && pointInPoly(w, g.v) ? 6 : d;
    }
  }
  return Infinity;
}
/* Best object under the cursor among the given kinds ('pt','line','seg','circ','arc','poly', or null = any). */
function pickObj(w, kinds, maxPx = 8) {
  let best = null, bd = maxPx;
  const consider = (ref, g, bias) => {
    if (!g || Array.isArray(g) || typeof g !== 'object') return;
    if (kinds && !kinds.includes(g.k)) return;
    const d = distPx(g, w) + bias; if (d < bd) { bd = d; best = { ref, g }; }
  };
  for (const o of objs) consider(o.id, o.g, 0);
  for (const b of builtinList()) consider(b.ref, b.g, 0.5);       // user objects win ties
  return best;
}
function pickUserPoint(w, maxPx = 10) {
  let best = null, bd = maxPx / view.s;
  for (const o of objs) if (o.t === 'pt' && o.g) { const d = dist(o.g, w); if (d < bd) { bd = d; best = o; } }
  return best;
}

/* ============================== 8. Drawing =============================== */
const n2 = v => v.toFixed(2);
function geomSVG(g, st, fill = 'none') {
  switch (g.k) {
    case 'line': { const [a, b] = lineEnds(g.p, g.d); return `<line x1="${n2(a[0])}" y1="${n2(a[1])}" x2="${n2(b[0])}" y2="${n2(b[1])}" ${st}/>`; }
    case 'seg': { const a = w2s(g.p), b = w2s(g.q); return `<line x1="${n2(a[0])}" y1="${n2(a[1])}" x2="${n2(b[0])}" y2="${n2(b[1])}" ${st}/>`; }
    case 'circ': {
      if (g.r * view.s > 3000) { const d = arcD({ c: g.c, r: g.r, a0: 0, a1: TAU }); return d ? `<path d="${d}" fill="none" ${st}/>` : ''; }   // huge: only the part in the frame
      const c = w2s(g.c); return `<circle cx="${n2(c[0])}" cy="${n2(c[1])}" r="${n2(g.r * view.s)}" fill="${fill}" ${st}/>`;
    }
    case 'arc': { const d = arcD(g); return d ? `<path d="${d}" fill="none" ${st}/>` : ''; }
    case 'poly': return polyPath(g.v, `fill="${fill}" ${st}`);
    case 'mark': { const c = w2s(g.c); return `<circle cx="${n2(c[0])}" cy="${n2(c[1])}" r="17" fill="none" ${st}/>`; }
  }
  return '';
}
/* Only what is in the frame is drawn: every curve is cut to the window (plus a margin), so a deep zoom stays fast
 * (a huge dashed arc off screen would otherwise cost millions of dashes). */
function viewBox(mPx = 40) { const a = s2w(-mPx, VH + mPx), b = s2w(VW + mPx, -mPx); return [a[0], a[1], b[0], b[1]]; }   // xmin, ymin, xmax, ymax
const inBox = (p, B) => p[0] >= B[0] && p[0] <= B[2] && p[1] >= B[1] && p[1] <= B[3];
function arcPieces(g, B) {                                // visible angle ranges [t0, t1] of an arc, in spiral order
  const span = g.a1 - g.a0, cx = g.c[0], cy = g.c[1], r = g.r;
  if (cx + r < B[0] || cx - r > B[2] || cy + r < B[1] || cy - r > B[3]) return [];
  const us = [0, span], add = t => { const u = normAng(t - g.a0); if (u > 0 && u < span) us.push(u); };
  for (const X of [B[0], B[2]]) { const v = (X - cx) / r; if (Math.abs(v) <= 1) { const t = Math.acos(v); add(t); add(-t); } }
  for (const Y of [B[1], B[3]]) { const v = (Y - cy) / r; if (Math.abs(v) <= 1) { const t = Math.asin(v); add(t); add(Math.PI - t); } }
  us.sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i + 1 < us.length; i++) {
    const u0 = us[i], u1 = us[i + 1]; if (u1 - u0 < 1e-15) continue;
    const m = g.a0 + (u0 + u1) / 2;
    if (!inBox([cx + r * Math.cos(m), cy + r * Math.sin(m)], B)) continue;
    if (out.length && Math.abs(out[out.length - 1][1] - (g.a0 + u0)) < 1e-15) out[out.length - 1][1] = g.a0 + u1; else out.push([g.a0 + u0, g.a0 + u1]);
  }
  return g.rev ? out.reverse().map(([a, b]) => [b, a]) : out;
}
function arcD(g, ctx = { last: null }, B = viewBox()) {   // SVG path of the visible parts of an arc; ctx.last joins consecutive arcs
  let d = '';
  for (const [t0, t1] of arcPieces(g, B)) {
    const n = Math.max(2, Math.min(4000, Math.ceil(g.r * view.s * Math.abs(t1 - t0) / 3)));   // a point every ~3 px of the visible part
    for (let i = 0; i <= n; i++) {
      const t = t0 + (t1 - t0) * i / n, q = w2s([g.c[0] + g.r * Math.cos(t), g.c[1] + g.r * Math.sin(t)]);
      const join = i > 0 || (ctx.last && Math.abs(ctx.last[0] - q[0]) + Math.abs(ctx.last[1] - q[1]) < 0.75);
      d += (join ? 'L' : 'M') + n2(q[0]) + ' ' + n2(q[1]); ctx.last = q;
    }
  }
  return d;
}
function clipPoly(v, B) {                                 // Sutherland-Hodgman: a polygon cut to the window
  let out = v;
  const edges = [[p => p[0] >= B[0], (p, q) => (B[0] - p[0]) / (q[0] - p[0])], [p => p[0] <= B[2], (p, q) => (B[2] - p[0]) / (q[0] - p[0])],
                 [p => p[1] >= B[1], (p, q) => (B[1] - p[1]) / (q[1] - p[1])], [p => p[1] <= B[3], (p, q) => (B[3] - p[1]) / (q[1] - p[1])]];
  for (const [ins, tAt] of edges) {
    const inp = out; out = [];
    for (let i = 0; i < inp.length; i++) {
      const p = inp[i], q = inp[(i + 1) % inp.length], pi = ins(p), qi = ins(q);
      if (pi) out.push(p);
      if (pi !== qi) { const t = tAt(p, q); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); }
    }
    if (!out.length) break;
  }
  return out;
}
function polyPath(v, attrs) {                             // a filled polygon, cut to the window
  const c = clipPoly(v, viewBox());
  return c.length < 3 ? '' : `<path d="${c.map((p, i) => (i ? 'L' : 'M') + w2s(p).map(n2).join(' ')).join('')}Z" ${attrs}/>`;
}
function lineEnds(p, d) {                                 // a long-enough piece of a line, centred on the point nearest the window centre
  const vc = s2w(VW / 2, VH / 2), t = dot(sub(vc, p), d), L = (VW + VH) * 2 / view.s, m = [p[0] + t * d[0], p[1] + t * d[1]];
  return [w2s([m[0] - L * d[0], m[1] - L * d[1]]), w2s([m[0] + L * d[0], m[1] + L * d[1]])];
}
const polyD = (pts, move = true) => pts.map((p, i) => (i || !move ? 'L' : 'M') + n2(p[0]) + ' ' + n2(p[1])).join('');
const text = (p, t, o = {}) => `<text x="${n2(p[0])}" y="${n2(p[1])}" font-family="system-ui,sans-serif" font-size="${o.size || 12}" fill="${o.fill || '#222'}" text-anchor="${o.anchor || 'start'}" stroke="#fff" stroke-width="3" paint-order="stroke" stroke-linejoin="round">${t}</text>`;

function niceStep() { for (let e = -6; e < 9; e++) for (const m of [1, 2, 5]) if (m * 10 ** e * view.s >= 45) return m * 10 ** e; return 1; }
function bgSVG() {
  let o = '';
  const a = s2w(0, VH), b = s2w(VW, 0);                   // world corners (min x, min y) and (max x, max y)
  if (state.bgGrid) {
    const st = niceStep(); let d = '';
    for (let x = Math.ceil(a[0] / st); x <= b[0] / st; x++) { const sx = n2(w2s([x * st, 0])[0]); d += `M${sx} 0V${VH}`; }
    for (let y = Math.ceil(a[1] / st); y <= b[1] / st; y++) { const sy = n2(w2s([0, y * st])[1]); d += `M0 ${sy}H${VW}`; }
    o += `<path d="${d}" stroke="#e4e7ec" stroke-width="1" fill="none"/>`;
    o += text([4, VH - 6], `grid step ${st} u`, { fill: '#8a929c', size: 11 });
  }
  const ax = w2s([0, 0]);
  o += `<path d="M${n2(ax[0])} 0V${VH}M0 ${n2(ax[1])}H${VW}" stroke="#c9ced6" stroke-width="1" fill="none"/>`;
  return o;
}
function gridSVG(S) {                                     // Holden grid: nA.p = m, nB.p = 1 + m
  if (S.inverted) return '';
  const cs = [s2w(0, 0), s2w(VW, 0), s2w(0, VH), s2w(VW, VH)];
  if (view.s / Math.sqrt(10) < 6) return '';
  let d = '';
  for (const [n, off] of [[S.nA, S.offA], [S.nB, S.offB]]) {
    const vals = cs.map(c => dot(n, c)), lo = Math.ceil(Math.min(...vals) - off), hi = Math.floor(Math.max(...vals) - off), nn = dot(n, n), L = (VW + VH) * 2;
    for (let m = lo; m <= hi && m - lo < 1500; m++) {
      const c = m + off, [a, b] = lineEnds([n[0] * c / nn, n[1] * c / nn], [-n[1] / Math.sqrt(nn), n[0] / Math.sqrt(nn)]);
      d += `M${n2(a[0])} ${n2(a[1])}L${n2(b[0])} ${n2(b[1])}`;
    }
  }
  return `<path d="${d}" stroke="${S.col}" stroke-opacity=".28" stroke-width="1" fill="none"/>`;
}
function spiralSVG(S) {
  const L = state.layers[S.i], n = state.nFib, dash = S.mirror ? 'stroke-dasharray="7 4"' : '';
  let o = '';
  if (L.sq) for (const q of S.squares.slice(0, n)) o += polyPath(q.corners, `fill="${S.col}" fill-opacity=".06" stroke="${S.col}" stroke-opacity=".7" stroke-width="1" ${dash}`);
  if (L.hl) S.lines.forEach((g, j) => { const c = state.lineColour === 'role' ? (j === 0 ? ROLE.odd : ROLE.even) : S.col;
    o += geomSVG(g, `stroke="${c}" stroke-width="${state.lineColour === 'role' ? 1.6 : 1.3}" stroke-opacity=".85" stroke-dasharray="${S.mirror ? '6 4' : '2 3'}"`); });
  const start = state.rotCentre === 'start';
  if (start && L.sq) for (const q of S.inSq.slice(0, 10)) o += polyPath(q.corners, `fill="${S.col}" fill-opacity=".05" stroke="${S.col}" stroke-opacity=".55" stroke-width="1" ${dash}`);
  if (start && L.arc) { const B = viewBox(), ctx = { last: null }, d = S.inArcs.slice(0, N_IN).filter(g => !g.dead).map(g => arcD(g, ctx, B)).join(''); if (d) o += `<path d="${d}" fill="none" stroke="${S.col}" stroke-width="2.4" ${dash} stroke-linecap="round" stroke-linejoin="round"/>`; }
  if (start && L.cross) { const p = w2s(S.Hs); o += `<circle cx="${n2(p[0])}" cy="${n2(p[1])}" r="4" fill="${S.col}" stroke="#fff" stroke-width="1.2"/>` + text([p[0] + 6, p[1] + 13], `H′${S.i}`, { fill: S.col, size: 10 }); }
  if (L.arc) { const B = viewBox(), ctx = { last: null }, d = S.arcs.slice(0, n).filter(g => !g.dead).map(g => arcD(g, ctx, B)).join(''); if (d) o += `<path d="${d}" fill="none" stroke="${S.col}" stroke-width="2.4" ${dash} stroke-linecap="round" stroke-linejoin="round"/>`; }
  if (L.ctr) S.squares.slice(0, n).forEach((q, k) => { const p = w2s(q.c); o += `<circle cx="${n2(p[0])}" cy="${n2(p[1])}" r="3" fill="${S.col}"/>` + text([p[0] + 5, p[1] - 5], k + 1, { size: 10, fill: S.col }); });
  if (L.cross) { const p = w2s(S.H); o += `<circle cx="${n2(p[0])}" cy="${n2(p[1])}" r="5.5" fill="#fff" stroke="${S.col}" stroke-width="2"/>` + text([p[0] + 8, p[1] + 14], `H${S.i}`, { fill: S.col, size: 11 }); }
  return o;
}
const POLY_COL = '#5b3fd0', PALETTE = ['#5b3fd0', '#1f6feb', '#e5484d', '#e060a8', '#d99a00', '#2e7d4f', '#b4532a', '#0f9fb0', '#2b2f36'];
function userSVG() {
  let o = '';
  const selG = sel !== null ? G(sel) : null;
  if (selG && !Array.isArray(selG) && typeof selG === 'object') o += geomSVG(selG, 'stroke="#ff9f1a" stroke-opacity=".45" stroke-width="9" stroke-linecap="round"');
  for (const o2 of objs) {
    const g = o2.g; if (g === null || g === undefined) continue;
    const hov = hoverRef === o2.id ? 'stroke-width="3"' : 'stroke-width="1.8"';
    if (o2.t === 'seg' || o2.t === 'line' || o2.t === 'par' || o2.t === 'perp' || o2.t === 'circ') o += geomSVG(g, `stroke="${o2.col || '#2b2f36'}" ${hov}`);
    else if (o2.t === 'poly') {
      const col = o2.col || POLY_COL;
      o += geomSVG(g, `stroke="${col}" fill-opacity="${o2.col ? .16 : .09}" ${hov}`, col);
      const c = [g.v.reduce((s, p) => s + p[0], 0) / g.v.length, g.v.reduce((s, p) => s + p[1], 0) / g.v.length];
      o += text(w2s(c), `A = ${fx(polyArea(g.v))}`, { anchor: 'middle', fill: col, size: 11 });
    } else if (o2.t === 'dist') {
      const a = P(o2.a), b = P(o2.b), e = exactStr(g), m = w2s(mid(a, b));
      o += geomSVG({ k: 'seg', p: a, q: b }, 'stroke="#c2410c" stroke-width="1.6" stroke-dasharray="5 3"') + text([m[0] + 6, m[1] - 6], fx(g) + (e ? ` (${e})` : ''), { fill: '#c2410c', size: 11 });
    } else if (o2.t === 'ang') {
      const v = P(o2.v), a = w2s(P(o2.a)), c = w2s(v), b = w2s(P(o2.b)), R = 26;
      const sa = Math.atan2(a[1] - c[1], a[0] - c[0]), sb = Math.atan2(b[1] - c[1], b[0] - c[0]);
      let dl = sb - sa; while (dl > Math.PI) dl -= TAU; while (dl <= -Math.PI) dl += TAU;
      const pa = [c[0] + R * Math.cos(sa), c[1] + R * Math.sin(sa)], pb = [c[0] + R * Math.cos(sb), c[1] + R * Math.sin(sb)], mh = sa + dl / 2;
      const e = angleExact(g);
      o += `<path d="M${n2(pa[0])} ${n2(pa[1])}A${R} ${R} 0 0 ${dl > 0 ? 1 : 0} ${n2(pb[0])} ${n2(pb[1])}" fill="none" stroke="#c2410c" stroke-width="1.8"/>`
        + text([c[0] + (R + 8) * Math.cos(mh), c[1] + (R + 8) * Math.sin(mh) + 4], `${fx(g)}°` + (e ? ` (${e})` : ''), { fill: '#c2410c', size: 11, anchor: 'middle' });
    } else if (o2.t === 'area') {
      const t = G(o2.ref);
      if (t && t.k === 'circ') o += text(w2s(t.c), `A = ${fx(g)}`, { anchor: 'middle', fill: '#c2410c', size: 11 });
    }
  }
  for (const o2 of objs) if (o2.t === 'mark' && o2.g) { const c = w2s(o2.g.c); o += `<circle cx="${n2(c[0])}" cy="${n2(c[1])}" r="17" fill="none" stroke="#f59e0b" stroke-opacity=".35" stroke-width="9"/><circle cx="${n2(c[0])}" cy="${n2(c[1])}" r="17" fill="none" stroke="#d97706" stroke-width="2.6"/>`; }
  for (const o2 of objs) if (o2.t === 'pt' && o2.g) {
    const p = w2s(o2.g), derived = o2.mid || o2.inter || o2.at, hot = hoverRef === o2.id || sel === o2.id;
    o += `<circle cx="${n2(p[0])}" cy="${n2(p[1])}" r="${hot ? 5.5 : 4}" fill="${derived ? '#0a7d4f' : '#111'}" stroke="#fff" stroke-width="1.2"/>` + text([p[0] + 7, p[1] - 7], o2.label, { size: 12 });
  }
  return o;
}
function mainSVG() {
  let o = bgSVG();
  for (const S of LV) if (state.layers[S.i].grid) o += gridSVG(S);
  if (state.showUnit) o += `<rect x="${n2(w2s([-.5, .5])[0])}" y="${n2(w2s([-.5, .5])[1])}" width="${n2(view.s)}" height="${n2(view.s)}" fill="#f3f6fb" stroke="#444" stroke-width="1.6"/>`;
  if (state.showCircH) o += geomSVG(builtinGeom('circh'), 'stroke="#555" stroke-width="1.4" stroke-dasharray="3 3"');
  for (const S of LV) { const L = state.layers[S.i]; if (L.sq || L.hl || L.arc || L.ctr || L.cross) o += spiralSVG(S); }
  return o + crossSVG() + userSVG();
}
function overlaySVG() {                                   // not exported: hover marks, pending picks, rubber band
  let o = '';
  if (hoverRef !== null && !Array.isArray(G(hoverRef)) && G(hoverRef)) o += geomSVG(G(hoverRef), 'stroke="#1f6feb" stroke-opacity=".35" stroke-width="7" stroke-linecap="round"');
  const pos = t => t.pt !== undefined ? P(t.pt) : t.xy;
  const pp = pending.filter(t => t.obj === undefined).map(pos).filter(Boolean);
  for (const t of pending) {
    if (t.obj !== undefined) { const g = G(t.obj); if (g && typeof g === 'object' && !Array.isArray(g)) o += geomSVG(g, 'stroke="#1f6feb" stroke-opacity=".5" stroke-width="7"'); }
    else { const p = w2s(pos(t)); o += `<circle cx="${n2(p[0])}" cy="${n2(p[1])}" r="7" fill="none" stroke="#1f6feb" stroke-width="2"/>`; }
  }
  if (pp.length && hoverPt && ['segment', 'line', 'polygon', 'circle', 'dist', 'angle'].includes(tool)) {
    const cur = snapHit && state.snap ? snapHit : hoverPt, last = pp[pp.length - 1];
    if (tool === 'circle') o += geomSVG({ k: 'circ', c: last, r: dist(last, cur) }, 'stroke="#1f6feb" stroke-width="1.2" stroke-dasharray="4 3"');
    else if (tool === 'polygon' && pp.length > 1) o += geomSVG({ k: 'poly', v: [...pp, cur] }, 'stroke="#1f6feb" stroke-width="1.2" stroke-dasharray="4 3"', 'rgba(31,111,235,.07)');
    else o += geomSVG({ k: 'seg', p: last, q: cur }, 'stroke="#1f6feb" stroke-width="1.2" stroke-dasharray="4 3"');
  }
  if (snapHit && state.snap && tool !== 'select') { const p = w2s(snapHit); o += `<circle cx="${n2(p[0])}" cy="${n2(p[1])}" r="6" fill="none" stroke="#e5484d" stroke-width="1.6"/>`; }
  return o;
}

/* ===================== 9. Tools and pointer handling ====================== */
const TOOLS = [
  { id: 'select', label: 'Select', key: 'v', hint: 'Click to select. Drag a free point to move it. Drag empty space to pan. Delete removes the selection.' },
  { id: 'point', label: 'Point', key: 'p', hint: 'Click to place a point (snaps to nodes, centres, corners and intersections).' },
  { id: 'segment', label: 'Segment', key: 's', hint: 'Click two points.' },
  { id: 'line', label: 'Line', key: 'l', hint: 'Click two points: the line through them.' },
  { id: 'circle', label: 'Circle', key: 'c', hint: 'Click the centre, then a point on the circle.' },
  { id: 'circleR', label: 'Circle r', key: 'r', hint: 'Type a radius in the box (units or h), then click the centre.' },
  { id: 'midpoint', label: 'Midpoint', key: 'm', hint: 'Click two points, or click a segment.' },
  { id: 'intersect', label: 'Intersect', key: 'i', hint: 'Click two objects (line, segment, circle, arc, including the built-in ones).' },
  { id: 'parallel', label: 'Parallel', key: 'q', hint: 'Click a line or segment, then a point (or the point first).' },
  { id: 'perp', label: 'Perpendicular', key: 'w', hint: 'Click a line or segment, then a point (or the point first).' },
  { id: 'polygon', label: 'Polygon', key: 'g', hint: 'Click points; click the first point again (or press Enter) to close.' },
  { id: 'dist', label: 'Distance', key: 'd', hint: 'Click two points.' },
  { id: 'angle', label: 'Angle', key: 'a', hint: 'Click three points: first arm, vertex, second arm.' },
  { id: 'area', label: 'Area', key: 'e', hint: 'Click a polygon or a circle.' },
  { id: 'mark', label: 'Mark', key: 'k', hint: 'Click a point or a crossing to ring it, to show where to look; the ring follows the point.' },
];
const LINE_LIKE = ['line', 'seg'];
const sameTarget = (a, b) => (a.pt !== undefined && a.pt === b.pt) || (a.xy && b.xy && near(a.xy, b.xy, 1e-9)) || (a.obj !== undefined && a.obj === b.obj);
const tpos = t => (t.pt !== undefined ? P(t.pt) : t.xy);

function pointTarget(w) {                                  // existing point, snap target, or a free spot
  const u = pickUserPoint(w); if (u) return { pt: u.id };
  const sn = state.snap ? snapAt(w) : null;
  return { xy: sn ? [sn[0], sn[1]] : w, src: sn && sn.src };
}
function mixedTarget(w, kinds) {                           // point first, then object of the given kinds
  const u = pickUserPoint(w); if (u) return { pt: u.id };
  const sn = state.snap ? snapAt(w) : null; if (sn) return { xy: sn, src: sn.src };
  const h = pickObj(w, kinds); if (h) return { obj: h.ref };
  return { xy: w };
}
function mkPoint(t) {                                      // make a target a real point object
  if (t.pt !== undefined) return t.pt;
  if (state.pin && t.src) {                                 // pinned to a crossing, centre, corner or origin: it follows the spirals
    const same = o => o.t === 'pt' && ((t.src.at && o.at === t.src.at) || (t.src.inter && o.inter && o.inter[0] === t.src.inter[0] && o.inter[1] === t.src.inter[1] && o.g && near(o.g, t.xy, 1e-9)));
    const ex = objs.find(same); if (ex) return ex.id;
    return addObj(t.src.at ? { t: 'pt', at: t.src.at } : { t: 'pt', inter: t.src.inter.slice(), seed: [t.xy[0], t.xy[1]] });
  }
  return addObj({ t: 'pt', x: t.xy[0], y: t.xy[1] });
}
function radiusValue() {
  const v = parseFloat($('rad').value.replace(',', '.'));
  return v > 0 ? v * ($('radUnit').value === 'h' ? HOLDEN : 1) : null;
}
function onClick(w) {
  const before = ser(); let changed = false, newId = null;
  const done = id => { pending = []; changed = true; if (id !== undefined) newId = id; };
  msg = '';
  switch (tool) {
    case 'select': { const u = pickUserPoint(w), h = u ? { ref: u.id } : pickObj(w, null); sel = h ? h.ref : null; break; }
    case 'point': { const t = pointTarget(w); if (t.pt !== undefined) sel = t.pt; else done(mkPoint(t)); break; }
    case 'segment': case 'line': case 'dist': case 'circle': {
      const t = pointTarget(w);
      if (pending.length && sameTarget(pending[0], t)) break;
      pending.push(t);
      if (pending.length === 2) {
        const a = mkPoint(pending[0]), b = mkPoint(pending[1]);
        done(addObj(tool === 'segment' ? { t: 'seg', a, b } : tool === 'line' ? { t: 'line', a, b } : tool === 'dist' ? { t: 'dist', a, b } : { t: 'circ', c: a, p: b }));
      }
      break;
    }
    case 'circleR': {
      const r = radiusValue(); if (!r) { msg = 'Type a positive radius first.'; break; }
      done(addObj({ t: 'circ', c: mkPoint(pointTarget(w)), r }));
      break;
    }
    case 'midpoint': {
      const t = mixedTarget(w, ['seg']);
      if (t.obj !== undefined) { const g = G(t.obj); if (g && g.k === 'seg') done(addObj({ t: 'pt', mid: [t.obj] })); break; }
      if (pending.length && sameTarget(pending[0], t)) break;
      pending.push(t);
      if (pending.length === 2) done(addObj({ t: 'pt', mid: [mkPoint(pending[0]), mkPoint(pending[1])] }));
      break;
    }
    case 'intersect': {
      const h = pickObj(w, ['line', 'seg', 'circ', 'arc']); if (!h) break;
      if (pending.length && pending[0].obj === h.ref) break;
      pending.push({ obj: h.ref });
      if (pending.length === 2) {
        const [r1, r2] = pending.map(t => t.obj), pts = intersect(G(r1), G(r2));
        if (!pts.length) { msg = 'These two objects do not meet.'; pending = []; break; }
        pts.forEach((q, k) => { if (!objs.some(o => o.inter && o.inter[0] === r1 && o.inter[1] === r2 && o.inter[2] === k)) addObj({ t: 'pt', inter: [r1, r2, k], seed: [q[0], q[1]] }); });
        done();
      }
      break;
    }
    case 'parallel': case 'perp': {
      const t = mixedTarget(w, LINE_LIKE);
      if (pending.length && (pending[0].obj !== undefined) === (t.obj !== undefined)) { msg = 'Now click a ' + (pending[0].obj !== undefined ? 'point.' : 'line or segment.'); break; }
      pending.push(t);
      if (pending.length === 2) {
        const base = pending.find(x => x.obj !== undefined).obj, thr = mkPoint(pending.find(x => x.obj === undefined));
        done(addObj({ t: tool === 'parallel' ? 'par' : 'perp', base, thr }));
      }
      break;
    }
    case 'polygon': {
      const t = pointTarget(w);
      if (pending.length >= 3 && (sameTarget(pending[0], t) || dist(w2s(tpos(pending[0])), w2s(w)) < 10)) { closePoly(); return finishClick(before, true); }
      if (!pending.some(p => sameTarget(p, t))) pending.push(t);
      break;
    }
    case 'angle': {
      const t = pointTarget(w); if (pending.some(p => sameTarget(p, t))) break;
      pending.push(t);
      if (pending.length === 3) { const [a, v, b] = pending.map(mkPoint); done(addObj({ t: 'ang', a, v, b })); }
      break;
    }
    case 'area': {
      const h = pickObj(w, ['poly', 'circ']); if (h) done(addObj({ t: 'area', ref: h.ref })); break;
    }
    case 'mark': { const a = mkPoint(pointTarget(w)); done(addObj({ t: 'mark', a })); break; }
  }
  if (newId !== null) sel = newId;
  finishClick(before, changed);
}
function finishClick(before, changed) { if (changed) pushUndo(before); req(); }
function closePoly() {
  if (pending.length < 3) return;
  const ids = pending.map(mkPoint); pending = []; sel = addObj(Object.assign({ t: 'poly', pts: ids }, state.polyCol ? { col: state.polyCol } : {}));
}

/* Pointer events: a short click acts with the tool; a drag pans (or moves a free point in Select). */
function mouse(e) { const r = svg.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top; return { sx, sy, w: s2w(sx, sy) }; }
svg.addEventListener('pointerdown', e => {
  svg.setPointerCapture(e.pointerId);
  const m = mouse(e); drag = { sx: m.sx, sy: m.sy, moved: false, mode: 'pan', before: null };
  if (tool === 'select') { const u = pickUserPoint(m.w); if (u && !u.mid && !u.inter && !u.at) { drag.mode = 'move'; drag.id = u.id; } }
});
svg.addEventListener('pointermove', e => {
  const m = mouse(e); hoverPt = m.w;
  $('coords').textContent = `x ${dec(m.w[0])}   y ${dec(m.w[1])}   (${dec(m.w[0] / HOLDEN)} h, ${dec(m.w[1] / HOLDEN)} h)`;
  if (drag) {
    if (!drag.moved && Math.hypot(m.sx - drag.sx, m.sy - drag.sy) > 4) { drag.moved = true; if (drag.mode === 'move') drag.before = ser(); }
    if (drag.moved) {
      if (drag.mode === 'pan') { view.cx -= (m.sx - drag.sx) / view.s; view.cy += (m.sy - drag.sy) / view.s; drag.sx = m.sx; drag.sy = m.sy; }
      else {
        const o = byId.get(drag.id), sn = state.snap ? snapAt(m.w) : null, p = sn || m.w;
        o.x = p[0]; o.y = p[1]; dirty.dyn = true; snapHit = sn;
      }
      req(); return;
    }
  }
  hover(m); req();
});
function hover(m) {
  snapHit = state.snap ? snapAt(m.w) : null;
  const u = pickUserPoint(m.w), h = u ? null : pickObj(m.w, tool === 'select' || tool === 'intersect' || tool === 'area' || tool === 'parallel' || tool === 'perp' || tool === 'midpoint' ? null : []);
  hoverRef = u ? u.id : h ? h.ref : null;
  const tipPt = u ? u.g : snapHit;
  const tip = $('tip');
  if (tipPt) { tip.style.display = 'block'; tip.style.left = (m.sx + 14) + 'px'; tip.style.top = (m.sy + 14) + 'px'; tip.textContent = coordStr(tipPt); }
  else tip.style.display = 'none';
}
svg.addEventListener('pointerup', e => {
  if (!drag) return;
  const m = mouse(e), d = drag; drag = null;
  if (d.moved) { if (d.before) pushUndo(d.before); req(); return; }
  onClick(m.w);
});
svg.addEventListener('pointerleave', () => { hoverRef = null; hoverPt = null; snapHit = null; $('tip').style.display = 'none'; req(); });
svg.addEventListener('wheel', e => { e.preventDefault(); const m = mouse(e); zoomAt(m.sx, m.sy, Math.pow(1.0015, -e.deltaY)); }, { passive: false });
function zoomAt(sx, sy, f) {
  const w = s2w(sx, sy); view.s = Math.min(5e4, Math.max(0.2, view.s * f));
  view.cx = w[0] - (sx - VW / 2) / view.s; view.cy = w[1] + (sy - VH / 2) / view.s; req();
}
function fit() {
  const pts = [[-.5, -.5], [.5, .5]], n = state.nFib;
  state.layers.forEach((L, i) => {
    if (L.sq || L.arc || L.ctr) LV[i].squares.slice(0, n).forEach(q => pts.push(...q.corners));
    if (L.cross) pts.push(LV[i].H);
  });
  for (const o of objs) if (o.t === 'pt' && o.g) pts.push(o.g);
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  view.cx = (x0 + x1) / 2; view.cy = (y0 + y1) / 2;
  view.s = Math.max(0.2, Math.min(VW / ((x1 - x0) * 1.15), VH / ((y1 - y0) * 1.15)));
  req();
}
function setTool(id) { tool = id; pending = []; msg = ''; document.querySelectorAll('#toolbar [data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === id)); req(); }
window.addEventListener('keydown', e => {
  if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === 'Escape') { pending = []; sel = null; setTool('select'); }
  else if (e.key === 'Enter' && tool === 'polygon') { const b = ser(); const had = pending.length >= 3; closePoly(); if (had) pushUndo(b); req(); }
  else if ((e.key === 'Delete' || e.key === 'Backspace') && typeof sel === 'number') { const b = ser(); deleteCascade(sel); sel = null; pushUndo(b); req(); }
  else { const t = TOOLS.find(t => t.key === e.key.toLowerCase()); if (t) setTool(t.id); }
});

/* ================== 10. Panels, file input/output, main loop ================ */
let raf = 0;
function req() { if (!raf) raf = requestAnimationFrame(render); }
let lastInfo = '', lastMeas = '';
function describe(ref) {
  const g = G(ref), o = typeof ref === 'number' ? byId.get(ref) : null;
  if (g === null || g === undefined) return '<span class="muted">(undefined: its parents no longer meet)</span>';
  if (o && o.t === 'pt') return `<b>Point ${o.label}</b> ${o.mid ? '(midpoint)' : o.inter ? '(pinned to a crossing)' : o.at ? '(pinned to ' + o.at.split(':')[0].replace('ctr', 'a square centre').replace('cnr', 'a square corner').replace('hx', 'an origin').replace('hs', 'where a spiral starts') + ')' : '(free)'}<br>${coordStr(g).replace(/\n/g, '<br>')}<br>in h: (${dec(g[0] / HOLDEN)}, ${dec(g[1] / HOLDEN)})<br>from the centre: ${fmtLen(len(g))}`;
  if (o && o.t === 'dist') return `<b>Distance</b><br>${fmtLen(g)}`;
  if (o && o.t === 'ang') return `<b>Angle</b><br>${fmtAngle(g)}`;
  if (o && o.t === 'area') return `<b>Area</b><br>${fmtArea(g)}`;
  if (o && o.t === 'mark') return `<b>Mark</b> on point ${(byId.get(o.a) || {}).label || ''}`;
  const name = typeof ref === 'string' ? `<b>Built-in</b> ${ref}` : `<b>${o.t}</b>`;
  switch (g.k) {
    case 'line': return `${name}<br>${lineEq(g)}`;
    case 'seg': return `${name}<br>length ${fmtLen(dist(g.p, g.q))}<br>${lineEq(g)}`;
    case 'circ': return `${name}<br>centre ${coordStr(g.c).split('\n')[0]}<br>radius ${fmtLen(g.r)}<br>area ${fmtArea(Math.PI * g.r * g.r)}`;
    case 'arc': return `${name}<br>centre ${coordStr(g.c).split('\n')[0]}<br>radius ${fmtLen(g.r)}`;
    case 'poly': { let p = 0; for (let i = 0; i < g.v.length; i++) p += dist(g.v[i], g.v[(i + 1) % g.v.length]); return `${name} (${g.v.length} sides)<br>area ${fmtArea(polyArea(g.v))}<br>perimeter ${fmtLen(p)}`; }
  }
  return '';
}
function updatePanels() {
  let info = sel === null ? '<span class="muted">Nothing selected.</span>' : describe(sel);
  const so = typeof sel === 'number' ? byId.get(sel) : null;
  if (so && ['poly', 'seg', 'line', 'par', 'perp', 'circ'].includes(so.t)) {
    const cur = so.col || (so.t === 'poly' ? POLY_COL : '#2b2f36');
    info += `<div class="cols">colour ${PALETTE.map(c => `<button class="csw${c === cur ? ' on' : ''}" data-col="${c}" style="background:${c}" title="${c}"></button>`).join('')}<input type="color" class="cpick" value="${cur}" title="any colour"></div>`;
  }
  if (info !== lastInfo) { $('info').innerHTML = info; lastInfo = info; }
  const ms = objs.filter(o => ['dist', 'ang', 'area'].includes(o.t));
  const mh = ms.length ? ms.map(o => `<div class="m ${sel === o.id ? 'sel' : ''}" data-id="${o.id}">${describe(o.id)}</div>`).join('') : '<span class="muted">None yet. Use Distance, Angle or Area.</span>';
  if (mh !== lastMeas) { $('measures').innerHTML = mh; lastMeas = mh; }
  const tl = TOOLS.find(t => t.id === tool);
  $('hint').textContent = msg || (tl ? `${tl.label}: ${tl.hint}` : '');
  $('undoB').disabled = !undoStack.length; $('redoB').disabled = !redoStack.length;
}
function setSelCol(c) {                                  // colour of the selected drawing; new polygons keep the last colour picked
  const o = typeof sel === 'number' ? byId.get(sel) : null; if (!o) return;
  const b = ser(); o.col = c; if (o.t === 'poly') state.polyCol = c; pushUndo(b); req();
}
function render() {
  raf = 0;
  VW = stage.clientWidth; VH = stage.clientHeight; svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  resolveAll();
  recordSamples();
  gmain.innerHTML = mainSVG(); gover.innerHTML = overlaySVG();
  updatePanels(); drawGraph();
}

/* ---- UI building ---- */
function el(tag, props = {}, kids = []) { const e = Object.assign(document.createElement(tag), props); kids.forEach(k => e.append(k)); return e; }
function btn(label, fn, props = {}) { return el('button', Object.assign({ textContent: label, onclick: fn }, props)); }
function download(name, blob) { const a = el('a', { href: URL.createObjectURL(blob), download: name }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
function svgText() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${VW}" height="${VH}" viewBox="0 0 ${VW} ${VH}"><rect width="100%" height="100%" fill="#fff"/>${gmain.innerHTML}</svg>`;
}
function exportPNG() {
  const img = new Image(), k = 2;
  img.onload = () => { const c = el('canvas', { width: VW * k, height: VH * k }), x = c.getContext('2d'); x.drawImage(img, 0, 0, VW * k, VH * k); c.toBlob(b => download('spiral-workbench.png', b)); };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgText());
}
function saveJSON() {
  const data = { app: 'spiral-workbench', version: 2, objects: JSON.parse(ser()), settings: state, view };
  download('spiral-workbench.json', new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }));
}
function loadJSON(file) {
  file.text().then(t => {
    const d = JSON.parse(t); if (d.app !== 'spiral-workbench') throw new Error('not a Spiral Workbench file');
    const before = ser();
    if (!(d.version >= 2)) {                               // files from before 24 Oct 2026 numbered mirror y as 5 and mirror y=x as 6: swap them
      const sw = v => typeof v === 'string' ? v.replace(/^(arc|ina|hl|ctr|cnr|hx|hs):([56])(?=:|$)/, (m, t, k) => `${t}:${k === '5' ? 6 : 5}`)
        : Array.isArray(v) ? v.map(sw) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, sw(x)])) : v;
      d.objects.objs = sw(d.objects.objs);
      if (d.settings && d.settings.layers && d.settings.layers.length === 8) { const L = d.settings.layers; [L[5], L[6]] = [L[6], L[5]]; }
    }
    objs = d.objects.objs; nextId = d.objects.nextId; labelN = d.objects.labelN; sel = null; pending = [];
    Object.assign(state, d.settings); if (d.view) view = d.view;
    objs.forEach(o => delete o._last); if (state.total === undefined) state.total = state.theta; pushUndo(before); updateLive(); trails = []; samples.clear(); buildUI(); req();
  }).catch(err => { msg = 'Could not load: ' + err.message; req(); });
}
function buildUI() {
  const tb = $('toolbar'); tb.textContent = '';
  TOOLS.forEach(t => tb.append(btn(t.label, () => setTool(t.id), { title: `${t.label} (${t.key.toUpperCase()})`, className: t.id === tool ? 'on' : '' })));
  tb.querySelectorAll('button').forEach((b, i) => { b.dataset.tool = TOOLS[i].id; });
  tb.append(el('span', { className: 'sep' }), el('span', { textContent: 'r =' }), el('input', { id: 'rad', type: 'text', value: '1', title: 'Radius for Circle r' }),
    el('select', { id: 'radUnit' }, [el('option', { value: 'u', textContent: 'u' }), el('option', { value: 'h', textContent: 'h' })]));
  tb.append(el('span', { className: 'sep' }), btn('Undo', undo, { id: 'undoB' }), btn('Redo', redo, { id: 'redoB' }),
    btn('Clear', () => { if (!objs.length) return; const b = ser(); objs = []; sel = null; pending = []; dirty.dyn = true; pushUndo(b); req(); }));
  tb.append(el('span', { className: 'sep' }), btn('+', () => zoomAt(VW / 2, VH / 2, 1.4)), btn('−', () => zoomAt(VW / 2, VH / 2, 1 / 1.4)), btn('Fit', fit));
  tb.append(el('span', { className: 'sep' }), btn('SVG', () => download('spiral-workbench.svg', new Blob([svgText()], { type: 'image/svg+xml' }))), btn('PNG', exportPNG),
    btn('Save', saveJSON), btn('Load', () => $('file').click()),
    el('input', { id: 'file', type: 'file', accept: '.json,application/json', style: 'display:none', onchange: e => { if (e.target.files[0]) loadJSON(e.target.files[0]); e.target.value = ''; } }));

  const T = $('layers'); T.textContent = '';
  const head = el('tr', {}, [el('th', { textContent: 'Spiral', style: 'text-align:left;cursor:default' })]);
  head.append(el('th', { textContent: 'Flip', title: 'Flip this spiral about its centre: left-right, up-down, or both (a half turn); click to set all', onclick: () => { const f = ((state.layers[0].flip || 0) + 1) % 4; state.layers.forEach(L => (L.flip = f)); buildUI(); updateLive(); req(); } }));
  head.append(el('th', { textContent: 'Turn', title: 'Turn this spiral: off, clockwise or anticlockwise (click to set all)', onclick: () => { const r = state.layers[0].rot === -1 ? 1 : state.layers[0].rot === 1 ? 0 : -1; state.layers.forEach(L => (L.rot = r)); buildUI(); touchRot(); } }));
  LAYER_KEYS.forEach(([k, name]) => head.append(el('th', { textContent: { hl: 'Lines', grid: 'Grid', cross: 'Cross' }[k] || name, title: `${name}: click to toggle for all eight`, onclick: () => { const on = !state.layers.every(L => L[k]); state.layers.forEach(L => (L[k] = on)); touch(); } })));
  T.append(head);
  SYMS.forEach((s, i) => {
    const row = el('tr', {}, [el('td', { className: 'name', title: s.name, innerHTML: `<span class="sw ${SP[i].mirror ? 'dash' : ''}" style="border-color:${SP[i].col}"></span>${i} · ${s.short}` })]);
    const rb = btn(ROTSYM[state.layers[i].rot || 0], () => { const r = state.layers[i].rot || 0; state.layers[i].rot = r === 0 ? -1 : r === -1 ? 1 : 0; rb.textContent = ROTSYM[state.layers[i].rot]; rb.title = ROTNAME[state.layers[i].rot]; touchRot(); }, { className: 'turn', title: ROTNAME[state.layers[i].rot || 0] });
    const fb = btn(FLIPSYM[state.layers[i].flip || 0], () => { state.layers[i].flip = ((state.layers[i].flip || 0) + 1) % 4; fb.textContent = FLIPSYM[state.layers[i].flip]; fb.title = FLIPNAME[state.layers[i].flip]; updateLive(); req(); }, { className: 'turn', title: FLIPNAME[state.layers[i].flip || 0] });
    row.append(el('td', {}, [fb]), el('td', {}, [rb]));
    LAYER_KEYS.forEach(([k]) => row.append(el('td', {}, [el('input', { type: 'checkbox', checked: state.layers[i][k], onchange: e => { state.layers[i][k] = e.target.checked; touch(); } })])));
    T.append(row);
  });
  const setAll = f => () => { state.layers.forEach((L, i) => LAYER_KEYS.forEach(([k]) => (L[k] = f(i)))); buildUI(); touch(); };
  const q = $('quick'); q.textContent = '';
  q.append(btn('all on', setAll(() => true)), btn('all off', setAll(() => false)), btn('rotations only', setAll(i => i < 4)), btn('mirrors only', setAll(i => i >= 4)));
  const o = $('options'); o.textContent = '';
  const chk = (label, key) => el('label', {}, [el('input', { type: 'checkbox', checked: state[key], onchange: e => { state[key] = e.target.checked; touch(); } }), label]);
  o.append(el('label', { title: 'Flip everything through the circle of origins (inversion about O): outside goes inside, the spirals wind into O, the eight origins stay where they are' }, [el('input', { type: 'checkbox', checked: !!state.invert, onchange: e => { state.invert = e.target.checked; updateLive(); fit(); req(); } }), 'flip through the circle of origins']), chk('unit square', 'showUnit'), chk('circle r = h', 'showCircH'), chk('plain grid', 'bgGrid'), chk('snap', 'snap'),
    el('label', { title: 'Colour Holden\'s lines by their role (odd green, even rust) or by their spiral' }, ['lines by', el('select', { onchange: e => { state.lineColour = e.target.value; touch(); } }, [el('option', { value: 'role', textContent: 'odd / even', selected: state.lineColour === 'role' }), el('option', { value: 'spiral', textContent: 'spiral', selected: state.lineColour === 'spiral' })])]),
    el('label', {}, ['squares', el('input', { type: 'range', min: 1, max: FIB_MAX, value: state.nFib, oninput: e => { state.nFib = +e.target.value; $('nfibv').textContent = state.nFib; touch(); } }), el('span', { id: 'nfibv', textContent: state.nFib })]));
  buildRotUI();
  setTool(tool);
}
function touch() { dirty.snap = dirty.dyn = true; req(); }
$('measures').addEventListener('click', e => { const m = e.target.closest('.m'); if (m) { sel = +m.dataset.id; req(); } });
$('info').addEventListener('click', e => { const b = e.target.closest('.csw'); if (b) setSelCol(b.dataset.col); });
$('info').addEventListener('change', e => { if (e.target.classList.contains('cpick')) setSelCol(e.target.value); });
window.addEventListener('resize', req);

/* ===================== 11. Rotation, crossings, trails, graph ===================== */
const ROTSYM = { 0: '·', [-1]: '↻', 1: '↺' }, ROTNAME = { 0: 'not turning', [-1]: 'turning clockwise', 1: 'turning anticlockwise' };
let playing = false, lastT = null, trails = [], lastTrailTheta = null;
const samples = new Map();                                 // measurement id -> Map(theta bin -> value)
function touchRot() { updateLive(); req(); }
const thetaMax = () => 360 * (state.turns || 1);
function thetaLabel(t) { const k = Math.floor(t / 360 + 1e-9); return `${t.toFixed(1)}°` + (state.turns > 1 ? ` (${k} turn${k === 1 ? '' : 's'} + ${(t - 360 * k).toFixed(1)}°)` : ''); }
/* The total angle turned (across loops) is kept, and every move is taken in steps of at most half a degree,
 * so a pinned point follows its own crossing (the nearest one at each step) and can be rewound to where it was made. */
const modM = t => { const M = thetaMax(), r = ((t % M) + M) % M; return r < 1e-9 && t > 1e-9 ? M : r; };   // a full turn shows as 360, not 0
function goTotal(target) {
  const from = state.total || 0, d = target - from, n = Math.max(1, Math.ceil(Math.abs(d) / 0.5));
  for (let k = 1; k < n; k++) { state.total = from + d * k / n; state.theta = modM(state.total); updateLive(); resolveAll(); recordSamples(); }
  state.total = target; state.theta = modM(target); updateLive(); resolveAll(); recordSamples();
  const s = $('thetaS'); if (s) s.value = state.theta; const v = $('thetaV'); if (v) v.textContent = thetaLabel(state.theta) + (Math.abs(state.total - state.theta) > 1e-9 ? `, ${(state.total / 360).toFixed(2)} turns in all` : ''); req();
}
function setTheta(t) { const M = thetaMax(); t = Math.min(M, Math.max(0, t)); goTotal((state.total || 0) + (t - state.theta)); }
function backToStart() { goTotal(0); }
function spinning() { return state.layers.some(L => L.rot); }
/* Where the shown spirals cross each other (arcs of different spirals; each spiral never crosses itself). */
function spiralCrossings() {
  const shown = LV.filter(S => state.layers[S.i].arc).map(spiralCurves), out = [];
  for (let a = 0; a < shown.length; a++) for (let b = a + 1; b < shown.length; b++)
    for (const g1 of shown[a]) for (const g2 of shown[b])
      for (const p of intersect(g1, g2)) if (!out.some(q => near(q, p, 1e-12))) out.push(p);
  return out;
}
function crossSVG() {
  let o = '';
  const TB = viewBox(10);
  if (state.trails && trails.length) o += `<path d="${trails.filter(p => inBox(p, TB)).map(p => { const q = w2s(p); return `M${n2(q[0])} ${n2(q[1])}h.01`; }).join('')}" stroke="#6b5a9e" stroke-opacity=".55" stroke-width="2.2" stroke-linecap="round" fill="none"/>`;
  const B = viewBox(10);
  if (state.showX) for (const p of spiralCrossings()) { if (!inBox(p, B)) continue; const q = w2s(p); o += `<circle cx="${n2(q[0])}" cy="${n2(q[1])}" r="3.6" fill="#6b5a9e" stroke="#fff" stroke-width="1.1"/>`; }
  return o;
}
function recordSamples() {
  if (!spinning()) return;
  const th = state.theta;
  if (state.trails && lastTrailTheta !== th) { for (const p of spiralCrossings()) trails.push(p); if (trails.length > 60000) trails.splice(0, trails.length - 60000); }
  lastTrailTheta = th;
  const bin = Math.round((state.total || 0) * 2) / 2;       // half-degree bins of the total angle turned (across loops)
  for (const o of objs) if (['dist', 'ang', 'area'].includes(o.t) && typeof o.g === 'number') { if (!samples.has(o.id)) samples.set(o.id, new Map()); samples.get(o.id).set(bin, [state.total || 0, o.g]); }   // the exact angle is kept, the bin only stops duplicates
}
function graphTarget() { const m = objs.filter(o => ['dist', 'ang', 'area'].includes(o.t)); return m.find(o => o.id === sel) || m[m.length - 1] || null; }
/* The series to plot: value, x multiplier, on a fitted, from-0, log, or "breath" axis
 * (breath = log of the value minus its own least-squares straight line: steady growth is flat, only the waves remain). */
function graphSeries() {
  const o = graphTarget(), S = o && samples.get(o.id);
  if (!o || !S || S.size < 2) return null;
  const k = state.gMul || 1, ax = state.gAxis || 'fit', raw = [...S.values()].sort((a, b) => a[0] - b[0]);
  const pos = raw.every(([, v]) => v > 0), mode = (ax === 'log' || ax === 'breath') && !pos ? 'fit' : ax;
  let pts;
  if (mode === 'log') pts = raw.map(([t, v]) => [t, Math.log(v * k)]);
  else if (mode === 'breath') {
    const L = raw.map(([t, v]) => [t, Math.log(v)]), n = L.length, mt = L.reduce((a, p) => a + p[0], 0) / n, mv = L.reduce((a, p) => a + p[1], 0) / n;
    let sxy = 0, sxx = 0; for (const [t, v] of L) { sxy += (t - mt) * (v - mv); sxx += (t - mt) * (t - mt); }
    const b = sxx ? sxy / sxx : 0; pts = L.map(([t, v]) => [t, k * (v - (mv + b * (t - mt)))]);
  } else pts = raw.map(([t, v]) => [t, v * k]);
  return { o, k, mode, pts };
}
function graphSVG(W, H, forFile, win) {
  const G0 = graphSeries(); if (!G0) return null;
  const { o, k, mode, pts } = G0, vs = pts.map(p => p[1]);
  let lo = mode === '0' ? Math.min(0, ...vs) : Math.min(...vs), hi = Math.max(...vs); if (hi - lo < 1e-12) { lo -= 0.5; hi += 0.5; }
  let t0 = Math.min(0, pts[0][0]), t1 = Math.max(thetaMax(), pts[pts.length - 1][0]);
  if (win) { t0 = win.t0; t1 = win.t1;
    if (state.gAuto !== false) {                          // auto values: fit the height to the part that is in view, like a price chart
      const vis = pts.filter(p => p[0] >= t0 && p[0] <= t1).map(p => p[1]);
      if (vis.length > 1) { lo = Math.min(...vis); hi = Math.max(...vis); if (mode === '0') lo = Math.min(0, lo); const pad = (hi - lo) * 0.06 || 0.5; lo -= pad; hi += pad; }
    } else if (win.v0 !== null) { lo = win.v0; hi = win.v1; } }
  const top = forFile ? 44 : 8, L = 58, X = t => L + (t - t0) / (t1 - t0) * (W - L - 12), Y = v => H - 24 - (v - lo) / (hi - lo) * (H - 24 - top);
  let d = '', prev = null;
  for (const [t, v] of pts) { if (t < t0 - 2 || t > t1 + 2) { prev = null; continue; } d += (prev === null || t - prev > 3 ? 'M' : 'L') + n2(X(t)) + ' ' + n2(Y(v)); prev = t; }
  const kind = o.t === 'dist' ? 'distance' : o.t === 'ang' ? 'angle' : 'area', fs = W > 500 ? 13 : 10;
  const span = t1 - t0, step = span <= 4 ? 0.5 : span <= 10 ? 1 : span <= 45 ? 5 : span <= 120 ? 15 : span <= 400 ? 45 : span <= 1440 ? 180 : 360, ticks = [];
  for (let t = Math.ceil(t0 / step) * step; t <= t1 + 1e-9; t += step) ticks.push(t);
  const lab = v => mode === 'log' ? +Math.exp(v).toPrecision(4) : +v.toPrecision(4), yt = [lo, lo + (hi - lo) / 4, (lo + hi) / 2, lo + 3 * (hi - lo) / 4, hi];
  const cen = { own: 'H', O: 'O', start: 'where it starts (H′)' }[state.rotCentre || 'own'];
  const axisName = { fit: '', '0': ', axis from 0', log: ', log scale (a steady scaling is a straight line)', breath: ', breath: log of the value minus its straight-line trend' }[mode];
  const title = `${kind}${o.t === 'ang' ? ' (degrees)' : ''} against the angle turned${k !== 1 ? ` — values × ${k}` : ''}${axisName} — turning about ${cen}${win ? `, θ ${+t0.toFixed(2)}°–${+t1.toFixed(2)}°` : ''}`;
  const cur = typeof o.g === 'number' ? (mode === 'fit' || mode === '0' ? o.g * k : mode === 'log' ? Math.log(o.g * k) : null) : null, T = state.total || 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${forFile ? W : '100%'}" ${forFile ? `height="${H}"` : ''}>`
    + (forFile ? `<rect width="100%" height="100%" fill="#fff"/><text x="${L}" y="26" font-family="system-ui,sans-serif" font-size="15" fill="#1c2128">${title}</text>` : '')
    + `<defs><clipPath id="gclip${W}"><rect x="${L}" y="${top}" width="${W - L - 12}" height="${H - 24 - top}"/></clipPath></defs>`
    + `<rect x="${L}" y="${top}" width="${W - L - 12}" height="${H - 24 - top}" fill="#fafbfc" stroke="#d0d4da"/>`
    + ticks.map(t => `<line x1="${n2(X(t))}" y1="${top}" x2="${n2(X(t))}" y2="${H - 24}" stroke="#eceff2"/><text x="${n2(X(t))}" y="${H - 8}" font-family="system-ui,sans-serif" font-size="${fs}" text-anchor="middle" fill="#6e7781">${+t.toFixed(2)}°</text>`).join('')
    + yt.map(v => `<line x1="${L}" y1="${n2(Y(v))}" x2="${W - 12}" y2="${n2(Y(v))}" stroke="#eceff2"/><text x="${L - 4}" y="${n2(Y(v) + 4)}" font-family="system-ui,sans-serif" font-size="${fs}" text-anchor="end" fill="#6e7781">${lab(v)}</text>`).join('')
    + (mode === 'breath' ? `<line x1="${L}" y1="${n2(Y(0))}" x2="${W - 12}" y2="${n2(Y(0))}" stroke="#9aa3ad" stroke-dasharray="4 3"/>` : '')
    + `<g clip-path="url(#gclip${W})">` + (state.gMarks || []).filter(m => m >= t0 && m <= t1).map(m => {
        let best = null, bd = Infinity; for (const p of pts) { const dd = Math.abs(p[0] - m); if (dd < bd) { bd = dd; best = p; } }
        const val = best ? (mode === 'log' ? Math.exp(best[1]) : best[1]) : null;
        return `<line x1="${n2(X(m))}" y1="${top}" x2="${n2(X(m))}" y2="${H - 24}" stroke="#6b5a9e" stroke-width="1.4"/>` + (best ? `<circle cx="${n2(X(m))}" cy="${n2(Y(best[1]))}" r="3.2" fill="#6b5a9e"/>` : '')
          + `<text x="${n2(X(m) + 4)}" y="${top + 13}" font-family="system-ui,sans-serif" font-size="${fs}" fill="#6b5a9e" stroke="#fff" stroke-width="3" paint-order="stroke">${+m.toFixed(1)}°${val !== null ? `  ${+val.toPrecision(5)}` : ''}</text>`; }).join('')
    + `<path d="${d}" fill="none" stroke="#c2410c" stroke-width="${W > 500 ? 2 : 1.6}"/>`
    + (forFile || T < t0 || T > t1 ? '' : `<line x1="${n2(X(T))}" y1="${top}" x2="${n2(X(T))}" y2="${H - 24}" stroke="#1f6feb" stroke-width="1.2"/>` + (cur !== null ? `<circle cx="${n2(X(T))}" cy="${n2(Y(cur))}" r="3.5" fill="#1f6feb"/>` : ''))
    + `</g></svg>`;
}
/* the enlarged graph: wheel zooms the angle, Shift + wheel the values, drag pans, double-click resets; a crosshair reads off θ and the value */
let gWin = null, gDragging = false;
function graphFrame(W, H) {
  const G0 = graphSeries(); if (!G0) return null;
  const vs = G0.pts.map(p => p[1]); let lo = G0.mode === '0' ? Math.min(0, ...vs) : Math.min(...vs), hi = Math.max(...vs); if (hi - lo < 1e-12) { lo -= 0.5; hi += 0.5; }
  const t0 = Math.min(0, G0.pts[0][0]), t1 = Math.max(thetaMax(), G0.pts[G0.pts.length - 1][0]);
  return { G0, t0, t1, lo, hi, L: 58, top: 8, W, H };
}
let gDrag = null, gSize = null;
function bigWin() {
  const f = graphFrame(gSize.W, gSize.H), w = gWin ? Object.assign({}, gWin) : { t0: f.t0, t1: f.t1, v0: f.lo, v1: f.hi };
  if (state.gAuto !== false && f) { const vis = f.G0.pts.filter(p => p[0] >= w.t0 && p[0] <= w.t1).map(p => p[1]);
    if (vis.length > 1) { let lo = Math.min(...vis), hi = Math.max(...vis); if (f.G0.mode === '0') lo = Math.min(0, lo); const pad = (hi - lo) * 0.06 || 0.5; w.v0 = lo - pad; w.v1 = hi + pad; } }
  return w;
}
function autoOff() { if (state.gAuto !== false) { state.gAuto = false; const b = $('gAutoBtn'); if (b) b.classList.remove('on'); } }
function bindBigPlot(host) {                               // bound once, on the persistent box; the svg inside is redrawn freely
  if (host.dataset.bound) return; host.dataset.bound = '1';
  const L = 58, toW = e => { const sv = host.querySelector('svg'), r = sv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * gSize.W, (e.clientY - r.top) / r.height * gSize.H]; };
  const inv = (sx, sy, w) => [w.t0 + (sx - L) / (gSize.W - L - 12) * (w.t1 - w.t0), w.v0 + (gSize.H - 24 - sy) / (gSize.H - 32) * (w.v1 - w.v0)];
  host.addEventListener('wheel', e => {
    e.preventDefault(); if (!gSize) return;
    const w = Object.assign({}, bigWin()), [sx, sy] = toW(e), [t, v] = inv(sx, sy, w);
    const dlt = e.deltaY || e.deltaX, f = Math.pow(1.0018, dlt);          // Shift + wheel arrives as a sideways scroll on Windows
    if (e.shiftKey || e.ctrlKey || sx < L) { autoOff(); w.v0 = v + (w.v0 - v) * f; w.v1 = v + (w.v1 - v) * f; } else { w.t0 = t + (w.t0 - t) * f; w.t1 = t + (w.t1 - t) * f; }
    gWin = w; drawBig();
  }, { passive: false });
  host.addEventListener('pointerdown', e => {
    if (!gSize || e.button > 0) return; e.preventDefault(); host.setPointerCapture(e.pointerId);
    const p = toW(e), mode = p[0] < L ? 'yscale' : p[1] > gSize.H - 24 ? 'xscale' : 'pan';
    gDrag = { p, w: Object.assign({}, bigWin()), mode, moved: false }; gDragging = true; if (mode === 'yscale') autoOff();
  });
  host.addEventListener('pointermove', e => {
    if (!gSize) return;
    const [sx, sy] = toW(e);
    if (gDrag) {
      const w = gDrag.w, dx = sx - gDrag.p[0], dy = sy - gDrag.p[1];
      if (Math.abs(dx) + Math.abs(dy) > 3) gDrag.moved = true;
      if (gDrag.mode === 'pan') { const dt = dx / (gSize.W - L - 12) * (w.t1 - w.t0), dv = dy / (gSize.H - 32) * (w.v1 - w.v0); if (Math.abs(dy) > 8 && state.gAuto !== false && Math.abs(dy) > Math.abs(dx)) autoOff(); gWin = { t0: w.t0 - dt, t1: w.t1 - dt, v0: w.v0 + (state.gAuto === false ? dv : 0), v1: w.v1 + (state.gAuto === false ? dv : 0) }; }
      else if (gDrag.mode === 'yscale') { const f = Math.exp(dy / 120), c = (w.v0 + w.v1) / 2; gWin = { t0: w.t0, t1: w.t1, v0: c + (w.v0 - c) * f, v1: c + (w.v1 - c) * f }; }   // drag down: stretch the values
      else { const f = Math.exp(-dx / 160), c = (w.t0 + w.t1) / 2; gWin = { t0: c + (w.t0 - c) * f, t1: c + (w.t1 - c) * f, v0: w.v0, v1: w.v1 }; }   // drag right: stretch the angle
      drawBig();
    }
    const w = bigWin(), [t] = inv(sx, sy, w), G0 = graphSeries(), tip = $('gtip');
    if (!G0 || !tip) return;
    let best = null, bd = Infinity; for (const p of G0.pts) { const d = Math.abs(p[0] - t); if (d < bd) { bd = d; best = p; } }
    const val = best ? (G0.mode === 'log' ? Math.exp(best[1]) : best[1]) : null;
    tip.textContent = best ? `θ = ${best[0].toFixed(1)}°   value ${G0.mode === 'breath' ? '(breath) ' : ''}${val !== null ? +val.toPrecision(6) : ''}` : '';
    const ch = host.querySelector('#gcross'); if (ch) { ch.setAttribute('x1', sx); ch.setAttribute('x2', sx); }
  });
  host.addEventListener('pointerup', e => {
    const d = gDrag; gDrag = null; gDragging = false;
    if (d && !d.moved && d.mode === 'pan') {                // a click: drop a vertical line there, or remove the one under it
      const w = bigWin(), [t] = inv(d.p[0], d.p[1], w), G0 = graphSeries();
      if (G0) {
        let best = null, bd = Infinity; for (const p of G0.pts) { const dd = Math.abs(p[0] - t); if (dd < bd) { bd = dd; best = p; } }
        const tol = 6 / (gSize.W - L - 12) * (w.t1 - w.t0), marks = state.gMarks || (state.gMarks = []), hit = marks.findIndex(m => Math.abs(m - t) < tol);
        if (hit >= 0) marks.splice(hit, 1); else if (best) marks.push(best[0]);
      }
    }
    drawBig(); drawGraph();
  });
  host.addEventListener('dblclick', () => { gWin = null; state.gAuto = true; const b = $('gAutoBtn'); if (b) b.classList.add('on'); drawBig(); });
}
function drawBig() {
  const pl = $('bigPlot'); if (!pl) return;
  const W = Math.max(500, $('stage').clientWidth - 40), H = Math.max(300, Math.min(560, $('stage').clientHeight - 110)); gSize = { W, H };
  const svgS = graphSVG(W, H, false, gWin ? Object.assign({}, gWin) : null); if (!svgS) return;
  pl.innerHTML = svgS.replace('</svg>', `<rect x="0" y="0" width="58" height="${H}" fill="transparent" style="cursor:ns-resize"/><rect x="58" y="${H - 24}" width="${W - 58}" height="24" fill="transparent" style="cursor:ew-resize"/><line id="gcross" x1="-10" y1="8" x2="-10" y2="${H - 24}" stroke="#57606a" stroke-dasharray="3 3" pointer-events="none"/></svg>`);
  pl.style.cursor = 'crosshair'; pl.style.touchAction = 'none'; pl.style.userSelect = 'none'; bindBigPlot(pl);
}
function graphControls() {
  const mul = el('select', { title: 'multiply the plotted values (the labels show the multiplied values)', onchange: e => { state.gMul = +e.target.value; refreshGraphUI(); } }, [1, 2, 5, 10, 100, 1000].map(v => el('option', { value: v, textContent: `× ${v}`, selected: (state.gMul || 1) === v })));
  const ax = el('select', { title: 'breath: the log of the value minus its own straight-line trend, so steady growth is flat and only the waves remain', onchange: e => { state.gAxis = e.target.value; gWin = null; refreshGraphUI(); } }, [['fit', 'axis: fit'], ['0', 'axis: from 0'], ['log', 'axis: log'], ['breath', 'breath (log − trend)']].map(([v, t]) => el('option', { value: v, textContent: t, selected: (state.gAxis || 'fit') === v })));
  return el('div', { className: 'row' }, [btn('enlarge', openBig), mul, ax, btn('reset zoom', () => { gWin = null; drawBig(); }, { title: 'in the enlarged graph: wheel zooms the angle, Shift + wheel the values, drag the axes to stretch, drag inside to pan, click to put a vertical line, double-click resets' }), btn('auto values', e => { state.gAuto = state.gAuto === false; e.target.classList.toggle('on', state.gAuto); drawBig(); }, { id: 'gAutoBtn', className: state.gAuto === false ? '' : 'on', title: 'fit the height of the curve to the part in view (on until you stretch the values yourself)' }), btn('clear lines', () => { state.gMarks = []; drawBig(); drawGraph(); }), btn('PNG', saveGraphPNG), btn('CSV', saveGraphCSV, { title: 'all recorded measurements as a table for a spreadsheet: the angle turned, each value, and for the graphed one its log and its breath' })]);
}
let bigOpen = false;
function refreshGraphUI() { const b = $('graph'); if (b) b.dataset.k = ''; const ov = $('bigGraph'); if (ov) ov.remove(); drawGraph(); }
function openBig() { bigOpen = true; drawGraph(); }
function drawGraph() {
  const box = $('graph'); if (!box) return;
  if (state.gAxis === undefined) state.gAxis = state.gLog ? 'log' : state.gZero ? '0' : 'fit';
  const o = graphTarget(), g = graphSVG(330, 160, false);
  const cur = o && typeof o.g === 'number' ? o.g : null, kind = o ? (o.t === 'dist' ? 'distance' : o.t === 'ang' ? 'angle' : 'area') : '';
  const key = g === null ? 'none' : 'g';
  if (!g) { box.innerHTML = `<span class="muted">${o ? 'Turn the spirals (play, or move θ) to plot this measurement against θ.' : 'Make a distance, angle or area (for example between crossings of the spirals), then turn the spirals: its value is plotted against θ here.'}</span>`; box.dataset.k = key; }
  else {
    if (box.dataset.k !== 'g') { box.textContent = ''; box.append(el('div', { id: 'gplot' }), el('div', { id: 'gcap', className: 'muted' }), graphControls()); box.dataset.k = 'g'; }
    $('gplot').innerHTML = g;
    $('gcap').textContent = `${kind} against θ, now ${cur !== null ? fx(cur) : '—'}${o.t === 'ang' ? '°' : ''}${(state.gMul || 1) !== 1 ? ` (plotted × ${state.gMul})` : ''}; select another measurement to plot it`;
  }
  let ov = $('bigGraph');
  if (bigOpen && g) {
    if (!ov) { ov = el('div', { id: 'bigGraph' }); $('stage').append(ov); ov.append(el('div', { className: 'row' }, [el('b', { textContent: 'Measurement against the angle turned' }), graphControls(), btn('✕ close', () => { bigOpen = false; drawGraph(); })]), el('div', { className: 'muted', id: 'gtip', style: 'min-height:16px;font-variant-numeric:tabular-nums' }), el('div', { id: 'bigPlot' }), el('div', { className: 'muted', textContent: 'wheel: zoom the angle · Shift + wheel (or wheel over the values): zoom the values · drag the value axis up/down: stretch the waves · drag the angle axis: stretch θ · drag inside: pan · click: put a vertical line (click it again to remove) · double-click: reset' })); }
    if (!gDragging) drawBig();
  } else if (ov) ov.remove();
}
/* all the recorded measurements as a table for a spreadsheet (standard CSV) */
function saveGraphCSV() {
  const ms = objs.filter(o => ['dist', 'ang', 'area'].includes(o.t) && samples.get(o.id) && samples.get(o.id).size);
  if (!ms.length) return;
  const sep = ',', num = v => v === undefined || v === null || !isFinite(v) ? '' : String(+v.toPrecision(12));   // standard CSV: commas between columns, a point for decimals
  const kindN = { dist: 'distance', ang: 'angle', area: 'area' }, count = {};
  const names = ms.map(o => { count[o.t] = (count[o.t] || 0) + 1; return `${kindN[o.t]} ${count[o.t]}${o.t === 'ang' ? ' (degrees)' : ''}${o === graphTarget() ? ' [graph]' : ''}`; });
  const bins = [...new Set(ms.flatMap(o => [...samples.get(o.id).keys()]))].sort((a, b) => a - b);
  const tgt = graphTarget(), ti = ms.indexOf(tgt), TS = tgt && samples.get(tgt.id);
  let fitB = null;                                          // the straight-line trend of the log, for the breath column
  if (TS && [...TS.values()].every(p => p[1] > 0)) { const L = [...TS.values()].map(([t, v]) => [t, Math.log(v)]), n = L.length, mt = L.reduce((a, p) => a + p[0], 0) / n, mv = L.reduce((a, p) => a + p[1], 0) / n;
    let sxy = 0, sxx = 0; for (const [t, v] of L) { sxy += (t - mt) * (v - mv); sxx += (t - mt) * (t - mt); } fitB = { mt, mv, b: sxx ? sxy / sxx : 0 }; }
  const head = ['angle turned (degrees)', ...names].concat(ti >= 0 ? [`ln(${names[ti]})`, `breath: ln − trend (${names[ti]})`] : []);
  const rows = [head.map(h => `"${h}"`).join(sep)];
  for (const b of bins) {
    const cells = ms.map(o => samples.get(o.id).get(b)), at = cells.find(c => c);
    const row = [num(at[0]), ...cells.map(c => num(c && c[1]))];
    if (ti >= 0) { const c = cells[ti]; row.push(num(c && c[1] > 0 ? Math.log(c[1]) : null), num(c && fitB ? Math.log(c[1]) - (fitB.mv + fitB.b * (c[0] - fitB.mt)) : null)); }
    rows.push(row.join(sep));
  }
  download(`measurements-about-${(state.rotCentre || 'own')}.csv`, new Blob(['﻿' + rows.join('\r\n') + '\r\n'], { type: 'text/csv;charset=utf-8' }));
}
function saveGraphPNG() {
  const W = 1400, H = 640, svgS = graphSVG(W, H, true, gWin ? Object.assign({}, gWin) : null); if (!svgS) return;
  const img = new Image();
  img.onload = () => { const c = el('canvas', { width: W, height: H }), x = c.getContext('2d'); x.drawImage(img, 0, 0); c.toBlob(b => download(`measurement-${state.gMul || 1}x.png`, b)); };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgS);
}
function buildRotUI() {
  const r = $('rotation'); if (!r) return; r.textContent = '';
  const play = btn(playing ? '❚❚ pause' : '▶ play', () => { playing = !playing; play.textContent = playing ? '❚❚ pause' : '▶ play'; if (playing) { if (!spinning()) { state.layers.forEach((L, i) => { if (L.arc) L.rot = -1; }); buildUI(); updateLive(); } lastT = null; requestAnimationFrame(tick); } }, { id: 'playB' });
  const slider = el('input', { id: 'thetaS', type: 'range', min: 0, max: thetaMax(), step: 0.1, value: state.theta, oninput: e => setTheta(+e.target.value), style: 'flex:1;min-width:120px' });
  r.append(el('div', { className: 'row' }, [play, el('span', { textContent: 'θ' }), slider]));
  r.append(el('div', { className: 'row' }, [el('span', { id: 'thetaV', textContent: thetaLabel(state.theta), style: 'font-variant-numeric:tabular-nums' }),
    el('label', { title: 'how far the slider (and the graph) reaches' }, ['slider', el('select', { onchange: e => { state.turns = +e.target.value; if (state.theta > thetaMax()) state.theta = thetaMax(); buildRotUI(); setTheta(state.theta); } }, [1, 2, 3, 4].map(v => el('option', { value: v, textContent: v === 1 ? '1 turn' : `${v} turns`, selected: (state.turns || 1) === v })))])]));
  const sp = el('select', { onchange: e => { state.speed = +e.target.value; } }, [2, 5, 15, 30, 60, 90, 120, 180, 360].map(v => el('option', { value: v, textContent: `${v}°/s`, selected: state.speed === v })));
  const ce = el('select', { onchange: e => { state.rotCentre = e.target.value; touchRot(); } }, [['own', 'H, its Holden crossing'], ['O', 'O, the origin of origins'], ['start', 'where it starts (halving squares)']].map(([v, t]) => el('option', { value: v, textContent: t, selected: (state.rotCentre || 'own') === v })));
  r.append(el('div', { className: 'row' }, [el('label', {}, ['speed', sp]), el('label', {}, ['about', ce])]));
  const setRot = v => () => { state.layers.forEach((L, i) => { L.rot = L.arc ? v : 0; }); buildUI(); touchRot(); };
  r.append(el('div', { className: 'row' }, [btn('shown ↻', setRot(-1), { title: 'all shown spirals clockwise' }), btn('shown ↺', setRot(1), { title: 'all shown spirals anticlockwise' }), btn('none', setRot(0)),
    btn('⏮ back to start', backToStart, { title: 'rewind every turn made so far, so the pinned points go back along their own paths to where they were made' })]));
  const step = d => () => goTotal((state.total || 0) + d);
  const goIn = el('input', { id: 'thetaIn', type: 'text', placeholder: 'e.g. 296.988353', title: 'type an exact angle in degrees and press Enter', style: 'width:130px', onkeydown: e => { if (e.key === 'Enter') { const v = parseFloat(e.target.value.replace(',', '.')); if (isFinite(v)) setTheta(v); } } });
  r.append(el('div', { className: 'row' }, [btn('−1°', step(-1)), btn('+1°', step(1)), btn('−0.01°', step(-0.01)), btn('+0.01°', step(0.01)), el('label', {}, ['go to θ =', goIn])]));
  const cbx = (label, key, title) => el('label', { title }, [el('input', { type: 'checkbox', checked: state[key], onchange: e => { state[key] = e.target.checked; touch(); } }), label]);
  r.append(el('div', { className: 'row' }, [cbx('pin to the spirals', 'pin', 'points clicked on a crossing, centre, corner or origin are pinned to it and follow the turn')]));
  const cb = (label, key, title) => el('label', { title }, [el('input', { type: 'checkbox', checked: state[key], onchange: e => { state[key] = e.target.checked; if (key === 'trails' && !e.target.checked) trails = []; req(); } }), label]);
  r.append(el('div', { className: 'row' }, [cb('crossings', 'showX', 'mark where the shown spirals cross each other'), cb('trails', 'trails', 'leave the path of each crossing as the spirals turn'),
    btn('clear trails and graph', () => { trails = []; samples.clear(); req(); })]));
}
function tick(ts) {
  if (!playing) return;
  if (lastT !== null) goTotal((state.total || 0) + state.speed * Math.min(0.1, (ts - lastT) / 1000));
  lastT = ts; requestAnimationFrame(tick);
}

/* ---- start ---- */
buildUI();
const failed = TESTS.filter(t => !t.ok);
const badge = $('badge');
badge.textContent = failed.length ? `✖ self-test: ${failed.length} failed` : `✔ self-test ${TESTS.length}/${TESTS.length}`;
badge.className = failed.length ? 'fail' : 'pass';
badge.title = TESTS.map(t => (t.ok ? 'PASS ' : 'FAIL ') + t.name).join('\n');
VW = stage.clientWidth; VH = stage.clientHeight; view.s = Math.min(VW, VH) / 6;
req();
window.SW = { SP, get LV() { return LV; }, dumpSamples: () => [...samples.entries()].map(([id, m]) => [id, [...m.values()].sort((a, b) => a[0] - b[0])]), saveGraphCSV, updateLive, setTheta, goTotal, backToStart, openBig, graphSVG, intersect, TESTS, state, get objs() { return objs; }, exactStr, angleExact, view, G, setTool, onClick, fit };   // handle for debugging in the console
})();
