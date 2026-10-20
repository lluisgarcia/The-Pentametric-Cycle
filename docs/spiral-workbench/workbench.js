/* Spiral Workbench
 * Fibonacci spirals and Holden's lines. Plain JS + SVG, no libraries.
 *
 * Frame: unit square centred at (0,0), corners (+-1/2,+-1/2); 1 unit = side of the unit square;
 * y points up (flipped only when drawing); Holden unit HOLDEN = sqrt(0.1).
 *
 * Sections:  1 maths helpers  2 exact-form recognisers  3 the eight spirals  4 geometry (intersections)
 *            5 self-test      6 state + user objects     7 snapping + hit tests  8 drawing
 *            9 tools + pointer 10 panels + file I/O
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
  { name: 'Mirror in the y-axis', short: 'mirror y', M: [-1, 0, 0, 1] },
  { name: 'Mirror in the diagonal y = x', short: 'mirror y=x', M: [0, 1, 1, 0] },
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
  return { i, name: sym.name, short: sym.short, M, mirror: flip, col: HUES[i % 4], squares, arcs, lines, H,
           nA: applyM(M, [1, 3]), nB: applyM(M, [3, -1]) };   // Holden grid: nA.p = m, nB.p = 1 + m  (m whole)
});

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
  for (const r of R) console.log(`${r.ok ? 'PASS' : 'FAIL'}: ${r.name}${r.ok ? '' : ' ' + r.info}`);
  return R;
}
const TESTS = selfTest();

/* ======================= 6. State and user objects ======================== */
const state = {
  layers: SYMS.map((_, i) => ({ arc: true, sq: i === 0, ctr: i === 0, hl: i === 0, grid: false, cross: i === 0 })),
  nFib: 10, showUnit: true, showCircH: true, bgGrid: false, snap: true,
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

const ser = () => JSON.stringify({ objs, nextId, labelN }, (k, v) => (k === 'g' ? undefined : v));
function pushUndo(before) { undoStack.push(before); if (undoStack.length > 200) undoStack.shift(); redoStack = []; }
function restore(s) { const o = JSON.parse(s); objs = o.objs; nextId = o.nextId; labelN = o.labelN; sel = null; pending = []; dirty.dyn = true; }
function undo() { if (!undoStack.length) return; redoStack.push(ser()); restore(undoStack.pop()); req(); }
function redo() { if (!redoStack.length) return; undoStack.push(ser()); restore(redoStack.pop()); req(); }

function builtinGeom(key) {
  const [t, a, b] = key.split(':');
  if (t === 'hl') return SP[+a].lines[+b];
  if (t === 'arc') return SP[+a].arcs[+b];
  if (t === 'usq') { const c = [[-.5, -.5], [.5, -.5], [.5, .5], [-.5, .5]]; return { k: 'seg', p: c[+a], q: c[(+a + 1) % 4] }; }
  if (t === 'circh') return { k: 'circ', c: [0, 0], r: HOLDEN };
  return null;
}
const G = ref => (typeof ref === 'string' ? builtinGeom(ref) : (byId.get(ref) || {}).g || null);
const P = id => { const g = (byId.get(id) || {}).g; return Array.isArray(g) ? g : null; };

function compute(o) {
  switch (o.t) {
    case 'pt': {
      if (o.mid) {
        if (o.mid.length === 2) { const a = P(o.mid[0]), b = P(o.mid[1]); return a && b ? mid(a, b) : null; }
        const g = G(o.mid[0]); return g && g.k === 'seg' ? mid(g.p, g.q) : null;
      }
      if (o.inter) { const a = G(o.inter[0]), b = G(o.inter[1]); return a && b ? intersect(a, b)[o.inter[2]] || null : null; }
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
    if (L.hl) SP[i].lines.forEach((g, j) => out.push({ ref: `hl:${i}:${j}`, g }));
    if (L.arc) SP[i].arcs.slice(0, state.nFib).forEach((g, j) => out.push({ ref: `arc:${i}:${j}`, g }));
  });
  if (state.showUnit) for (let j = 0; j < 4; j++) out.push({ ref: `usq:${j}`, g: builtinGeom(`usq:${j}`) });
  if (state.showCircH) out.push({ ref: 'circh', g: builtinGeom('circh') });
  return out;
}
let staticCands = [], dynCands = [];
function buildStatic() {
  const c = [], n = state.nFib;
  state.layers.forEach((L, i) => {
    const S = SP[i];
    if (L.ctr) S.squares.slice(0, n).forEach(q => c.push({ p: q.c }));
    if (L.sq) S.squares.slice(0, n).forEach(q => q.corners.forEach(p => c.push({ p })));
    if (L.cross) c.push({ p: S.H });
  });
  if (state.showUnit) { c.push({ p: [0, 0] }); for (const x of [-.5, .5]) for (const y of [-.5, .5]) c.push({ p: [x, y] }); }
  const b = builtinList();
  for (let i = 0; i < b.length; i++) for (let j = i + 1; j < b.length; j++) for (const p of intersect(b[i].g, b[j].g)) c.push({ p });
  staticCands = c; dirty.snap = false;
}
function buildDyn() {
  const c = [], us = objs.filter(o => o.g && o.t !== 'pt' && o.t !== 'poly' && typeof o.g === 'object' && o.g.k !== 'poly' && ['seg', 'line', 'par', 'perp', 'circ'].includes(o.t));
  const b = builtinList();
  us.forEach((u, i) => {
    for (const o of b) for (const p of intersect(u.g, o.g)) c.push({ p });
    for (let j = i + 1; j < us.length; j++) for (const p of intersect(u.g, us[j].g)) c.push({ p });
  });
  dynCands = c; dirty.dyn = false;
}
/* Nearest snap target within r px of world point w, or null. */
function snapAt(w, r = 10) {
  if (dirty.snap) buildStatic();
  if (dirty.dyn) buildDyn();
  let best = null, bd = r / view.s;
  const tryP = p => { const d = dist(p, w); if (d < bd) { bd = d; best = p; } };
  for (const c of staticCands) tryP(c.p);
  for (const c of dynCands) tryP(c.p);
  state.layers.forEach((L, i) => {                        // Holden grid nodes of spirals whose grid is shown
    if (!L.grid) return;
    const S = SP[i], q = applyM([S.M[0], S.M[2], S.M[1], S.M[3]], w);   // inverse (transpose) back to spiral-0 frame
    const m = Math.round(q[0] + 3 * q[1]), m2 = Math.round(3 * q[0] - q[1] - 1);
    tryP(applyM(S.M, [(m + 3 * (1 + m2)) / 10, (3 * m - (1 + m2)) / 10]));
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
    case 'line': { const a = w2s(g.p), L = (VW + VH) * 2; return `<line x1="${n2(a[0] - g.d[0] * L)}" y1="${n2(a[1] + g.d[1] * L)}" x2="${n2(a[0] + g.d[0] * L)}" y2="${n2(a[1] - g.d[1] * L)}" ${st}/>`; }
    case 'seg': { const a = w2s(g.p), b = w2s(g.q); return `<line x1="${n2(a[0])}" y1="${n2(a[1])}" x2="${n2(b[0])}" y2="${n2(b[1])}" ${st}/>`; }
    case 'circ': { const c = w2s(g.c); return `<circle cx="${n2(c[0])}" cy="${n2(c[1])}" r="${n2(g.r * view.s)}" fill="${fill}" ${st}/>`; }
    case 'arc': return `<path d="${polyD(arcPts(g))}" fill="none" ${st}/>`;
    case 'poly': return `<polygon points="${g.v.map(p => w2s(p).map(n2).join(',')).join(' ')}" fill="${fill}" ${st}/>`;
  }
  return '';
}
function arcPts(g, n = 48) {                              // polyline in screen coords, in spiral order (start -> end)
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = g.rev ? g.a1 - (g.a1 - g.a0) * i / n : g.a0 + (g.a1 - g.a0) * i / n;
    pts.push(w2s([g.c[0] + g.r * Math.cos(t), g.c[1] + g.r * Math.sin(t)]));
  }
  return pts;
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
  const cs = [s2w(0, 0), s2w(VW, 0), s2w(0, VH), s2w(VW, VH)];
  if (view.s / Math.sqrt(10) < 6) return '';
  let d = '';
  for (const [n, off] of [[S.nA, 0], [S.nB, 1]]) {
    const vals = cs.map(c => dot(n, c)), lo = Math.ceil(Math.min(...vals) - off), hi = Math.floor(Math.max(...vals) - off), nn = dot(n, n), L = (VW + VH) * 2;
    for (let m = lo; m <= hi && m - lo < 1500; m++) {
      const c = m + off, p = w2s([n[0] * c / nn, n[1] * c / nn]), dd = [-n[1] / Math.sqrt(nn), -n[0] / Math.sqrt(nn)];   // screen direction (dx, -dy) with d = (-ny, nx)/|n|
      d += `M${n2(p[0] - dd[0] * L)} ${n2(p[1] - dd[1] * L)}L${n2(p[0] + dd[0] * L)} ${n2(p[1] + dd[1] * L)}`;
    }
  }
  return `<path d="${d}" stroke="${S.col}" stroke-opacity=".28" stroke-width="1" fill="none"/>`;
}
function spiralSVG(S) {
  const L = state.layers[S.i], n = state.nFib, dash = S.mirror ? 'stroke-dasharray="7 4"' : '';
  let o = '';
  if (L.sq) for (const q of S.squares.slice(0, n)) o += `<polygon points="${q.corners.map(p => w2s(p).map(n2).join(',')).join(' ')}" fill="${S.col}" fill-opacity=".06" stroke="${S.col}" stroke-opacity=".7" stroke-width="1" ${dash}/>`;
  if (L.hl) for (const g of S.lines) o += geomSVG(g, `stroke="${S.col}" stroke-width="1.3" stroke-opacity=".85" stroke-dasharray="${S.mirror ? '6 4' : '2 3'}"`);
  if (L.arc) o += `<path d="${S.arcs.slice(0, n).map((g, i) => polyD(arcPts(g), i === 0)).join('')}" fill="none" stroke="${S.col}" stroke-width="2.4" ${dash} stroke-linecap="round" stroke-linejoin="round"/>`;
  if (L.ctr) S.squares.slice(0, n).forEach((q, k) => { const p = w2s(q.c); o += `<circle cx="${n2(p[0])}" cy="${n2(p[1])}" r="3" fill="${S.col}"/>` + text([p[0] + 5, p[1] - 5], k + 1, { size: 10, fill: S.col }); });
  if (L.cross) { const p = w2s(S.H); o += `<circle cx="${n2(p[0])}" cy="${n2(p[1])}" r="5.5" fill="#fff" stroke="${S.col}" stroke-width="2"/>` + text([p[0] + 8, p[1] + 14], `H${S.i}`, { fill: S.col, size: 11 }); }
  return o;
}
function userSVG() {
  let o = '';
  const selG = sel !== null ? G(sel) : null;
  if (selG && !Array.isArray(selG) && typeof selG === 'object') o += geomSVG(selG, 'stroke="#ff9f1a" stroke-opacity=".45" stroke-width="9" stroke-linecap="round"');
  for (const o2 of objs) {
    const g = o2.g; if (g === null || g === undefined) continue;
    const hov = hoverRef === o2.id ? 'stroke-width="3"' : 'stroke-width="1.8"';
    if (o2.t === 'seg' || o2.t === 'line' || o2.t === 'par' || o2.t === 'perp' || o2.t === 'circ') o += geomSVG(g, `stroke="#2b2f36" ${hov}`);
    else if (o2.t === 'poly') {
      o += geomSVG(g, `stroke="#5b3fd0" ${hov}`, 'rgba(91,63,208,.09)');
      const c = [g.v.reduce((s, p) => s + p[0], 0) / g.v.length, g.v.reduce((s, p) => s + p[1], 0) / g.v.length];
      o += text(w2s(c), `A = ${fx(polyArea(g.v))}`, { anchor: 'middle', fill: '#5b3fd0', size: 11 });
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
  for (const o2 of objs) if (o2.t === 'pt' && o2.g) {
    const p = w2s(o2.g), derived = o2.mid || o2.inter, hot = hoverRef === o2.id || sel === o2.id;
    o += `<circle cx="${n2(p[0])}" cy="${n2(p[1])}" r="${hot ? 5.5 : 4}" fill="${derived ? '#0a7d4f' : '#111'}" stroke="#fff" stroke-width="1.2"/>` + text([p[0] + 7, p[1] - 7], o2.label, { size: 12 });
  }
  return o;
}
function mainSVG() {
  let o = bgSVG();
  for (const S of SP) if (state.layers[S.i].grid) o += gridSVG(S);
  if (state.showUnit) o += `<rect x="${n2(w2s([-.5, .5])[0])}" y="${n2(w2s([-.5, .5])[1])}" width="${n2(view.s)}" height="${n2(view.s)}" fill="#f3f6fb" stroke="#444" stroke-width="1.6"/>`;
  if (state.showCircH) o += geomSVG(builtinGeom('circh'), 'stroke="#555" stroke-width="1.4" stroke-dasharray="3 3"');
  for (const S of SP) { const L = state.layers[S.i]; if (L.sq || L.hl || L.arc || L.ctr || L.cross) o += spiralSVG(S); }
  return o + userSVG();
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
];
const LINE_LIKE = ['line', 'seg'];
const sameTarget = (a, b) => (a.pt !== undefined && a.pt === b.pt) || (a.xy && b.xy && near(a.xy, b.xy, 1e-9)) || (a.obj !== undefined && a.obj === b.obj);
const tpos = t => (t.pt !== undefined ? P(t.pt) : t.xy);

function pointTarget(w) {                                  // existing point, snap target, or a free spot
  const u = pickUserPoint(w); if (u) return { pt: u.id };
  const sn = state.snap ? snapAt(w) : null;
  return { xy: sn ? [sn[0], sn[1]] : w };
}
function mixedTarget(w, kinds) {                           // point first, then object of the given kinds
  const u = pickUserPoint(w); if (u) return { pt: u.id };
  const sn = state.snap ? snapAt(w) : null; if (sn) return { xy: sn };
  const h = pickObj(w, kinds); if (h) return { obj: h.ref };
  return { xy: w };
}
function mkPoint(t) {                                      // make a target a real point object
  if (t.pt !== undefined) return t.pt;
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
        pts.forEach((_, k) => { if (!objs.some(o => o.inter && o.inter[0] === r1 && o.inter[1] === r2 && o.inter[2] === k)) addObj({ t: 'pt', inter: [r1, r2, k] }); });
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
  }
  if (newId !== null) sel = newId;
  finishClick(before, changed);
}
function finishClick(before, changed) { if (changed) pushUndo(before); req(); }
function closePoly() {
  if (pending.length < 3) return;
  const ids = pending.map(mkPoint); pending = []; sel = addObj({ t: 'poly', pts: ids });
}

/* Pointer events: a short click acts with the tool; a drag pans (or moves a free point in Select). */
function mouse(e) { const r = svg.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top; return { sx, sy, w: s2w(sx, sy) }; }
svg.addEventListener('pointerdown', e => {
  svg.setPointerCapture(e.pointerId);
  const m = mouse(e); drag = { sx: m.sx, sy: m.sy, moved: false, mode: 'pan', before: null };
  if (tool === 'select') { const u = pickUserPoint(m.w); if (u && !u.mid && !u.inter) { drag.mode = 'move'; drag.id = u.id; } }
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
    if (L.sq || L.arc || L.ctr) SP[i].squares.slice(0, n).forEach(q => pts.push(...q.corners));
    if (L.cross) pts.push(SP[i].H);
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
  if (o && o.t === 'pt') return `<b>Point ${o.label}</b> ${o.mid ? '(midpoint)' : o.inter ? '(intersection)' : ''}<br>${coordStr(g).replace(/\n/g, '<br>')}<br>in h: (${dec(g[0] / HOLDEN)}, ${dec(g[1] / HOLDEN)})<br>from the centre: ${fmtLen(len(g))}`;
  if (o && o.t === 'dist') return `<b>Distance</b><br>${fmtLen(g)}`;
  if (o && o.t === 'ang') return `<b>Angle</b><br>${fmtAngle(g)}`;
  if (o && o.t === 'area') return `<b>Area</b><br>${fmtArea(g)}`;
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
  const info = sel === null ? '<span class="muted">Nothing selected.</span>' : describe(sel);
  if (info !== lastInfo) { $('info').innerHTML = info; lastInfo = info; }
  const ms = objs.filter(o => ['dist', 'ang', 'area'].includes(o.t));
  const mh = ms.length ? ms.map(o => `<div class="m ${sel === o.id ? 'sel' : ''}" data-id="${o.id}">${describe(o.id)}</div>`).join('') : '<span class="muted">None yet. Use Distance, Angle or Area.</span>';
  if (mh !== lastMeas) { $('measures').innerHTML = mh; lastMeas = mh; }
  const tl = TOOLS.find(t => t.id === tool);
  $('hint').textContent = msg || (tl ? `${tl.label}: ${tl.hint}` : '');
  $('undoB').disabled = !undoStack.length; $('redoB').disabled = !redoStack.length;
}
function render() {
  raf = 0;
  VW = stage.clientWidth; VH = stage.clientHeight; svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  resolveAll();
  gmain.innerHTML = mainSVG(); gover.innerHTML = overlaySVG();
  updatePanels();
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
  const data = { app: 'spiral-workbench', version: 1, objects: JSON.parse(ser()), settings: state, view };
  download('spiral-workbench.json', new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }));
}
function loadJSON(file) {
  file.text().then(t => {
    const d = JSON.parse(t); if (d.app !== 'spiral-workbench') throw new Error('not a Spiral Workbench file');
    const before = ser();
    objs = d.objects.objs; nextId = d.objects.nextId; labelN = d.objects.labelN; sel = null; pending = [];
    Object.assign(state, d.settings); if (d.view) view = d.view;
    pushUndo(before); dirty.snap = dirty.dyn = true; buildUI(); req();
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
  LAYER_KEYS.forEach(([k, name]) => head.append(el('th', { textContent: { hl: 'Lines', grid: 'Grid', cross: 'Cross' }[k] || name, title: `${name}: click to toggle for all eight`, onclick: () => { const on = !state.layers.every(L => L[k]); state.layers.forEach(L => (L[k] = on)); touch(); } })));
  T.append(head);
  SYMS.forEach((s, i) => {
    const row = el('tr', {}, [el('td', { className: 'name', title: s.name, innerHTML: `<span class="sw ${SP[i].mirror ? 'dash' : ''}" style="border-color:${SP[i].col}"></span>${i} · ${s.short}` })]);
    LAYER_KEYS.forEach(([k]) => row.append(el('td', {}, [el('input', { type: 'checkbox', checked: state.layers[i][k], onchange: e => { state.layers[i][k] = e.target.checked; touch(); } })])));
    T.append(row);
  });
  const setAll = f => () => { state.layers.forEach((L, i) => LAYER_KEYS.forEach(([k]) => (L[k] = f(i)))); buildUI(); touch(); };
  const q = $('quick'); q.textContent = '';
  q.append(btn('all on', setAll(() => true)), btn('all off', setAll(() => false)), btn('rotations only', setAll(i => i < 4)), btn('mirrors only', setAll(i => i >= 4)));
  const o = $('options'); o.textContent = '';
  const chk = (label, key) => el('label', {}, [el('input', { type: 'checkbox', checked: state[key], onchange: e => { state[key] = e.target.checked; touch(); } }), label]);
  o.append(chk('unit square', 'showUnit'), chk('circle r = h', 'showCircH'), chk('plain grid', 'bgGrid'), chk('snap', 'snap'),
    el('label', {}, ['squares', el('input', { type: 'range', min: 1, max: FIB_MAX, value: state.nFib, oninput: e => { state.nFib = +e.target.value; $('nfibv').textContent = state.nFib; touch(); } }), el('span', { id: 'nfibv', textContent: state.nFib })]));
  setTool(tool);
}
function touch() { dirty.snap = dirty.dyn = true; req(); }
$('measures').addEventListener('click', e => { const m = e.target.closest('.m'); if (m) { sel = +m.dataset.id; req(); } });
window.addEventListener('resize', req);

/* ---- start ---- */
buildUI();
const failed = TESTS.filter(t => !t.ok);
const badge = $('badge');
badge.textContent = failed.length ? `✖ self-test: ${failed.length} failed` : `✔ self-test ${TESTS.length}/${TESTS.length}`;
badge.className = failed.length ? 'fail' : 'pass';
badge.title = TESTS.map(t => (t.ok ? 'PASS ' : 'FAIL ') + t.name).join('\n');
VW = stage.clientWidth; VH = stage.clientHeight; view.s = Math.min(VW, VH) / 6;
req();
window.SW = { SP, intersect, TESTS, state, get objs() { return objs; }, exactStr, angleExact, view, G, setTool, onClick, fit };   // handle for debugging in the console
})();
