// The mirror fretboard — a shared component (used by fretboard.html and euler.html).
// A fretboard is several monochords side by side; in a regular tuning (all fourths, all fifths) every interval pattern
// repeats in every direction, and reflecting the board through any root turns each interval into its inversion.
"use strict";

const Fretboard = (() => {
  const NAMES = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
  const INT = ["R", "♭2", "2", "♭3", "3", "4", "♭5", "5", "♭6", "6", "♭7", "7"];
  const LONG = ["root", "minor second", "major second", "minor third", "major third", "fourth", "tritone", "fifth",
    "minor sixth", "major sixth", "minor seventh", "major seventh"];
  // an interval and its inversion share a colour: they are mirror partners (x ↔ 12 − x)
  // (Lluis's colours: root yellow, 4/5 green, 3/♭6 red, ♭3/6 purple, ♭2/7 blue, 2/♭7 orange, the tritone grey)
  const COL = [0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1].map((k) => `var(--p${k})`);
  const md = (a, m) => ((a % m) + m) % m;
  const TUNINGS = {
    fourths: { name: "all fourths (E A D G C F …)", low: 40, step: () => 5 },
    fifths: { name: "all fifths (C G D A E B …)", low: 36, step: () => 7 },
    standard: { name: "standard (E A D G B E) · only to compare", low: 40, step: (i) => (i === 4 ? 4 : 5) },
  };
  function offsets(id, n) { const T = TUNINGS[id], o = [0]; for (let i = 1; i < n; i++) o.push(o[i - 1] + T.step(i)); return o; }

  // ---- sound (equal temperament: a fretboard is tempered) ----
  let ctx = null, master = null;
  function audio() { if (!ctx) { ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = 0.22; master.connect(ctx.destination); } if (ctx.state === "suspended") ctx.resume(); }
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function pluck(m, t, d, g) { const o = ctx.createOscillator(), a = ctx.createGain(); o.type = "triangle"; o.frequency.value = hz(m);
    a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(g || 0.4, t + 0.01); a.gain.exponentialRampToValueAtTime(0.0001, t + (d || 1.2)); o.connect(a).connect(master); o.start(t); o.stop(t + (d || 1.2) + 0.05); }

  const NS = "http://www.w3.org/2000/svg";
  const el = (tag, at, txt) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]);
  if ((tag === "text" || tag === "tspan") && at.fill) e.style.fill = at.fill;     // the site's CSS sets svg text fill; a style wins over it
  if (tag === "text" && at["font-family"]) e.style.fontFamily = at["font-family"];
  if (txt !== undefined) e.textContent = txt; return e; };

  /** Put a fretboard into host. opts: strings, frets, tuning, root (pitch class), labels ("intervals" | "notes"),
   *  spacing ("equal" | "real"), compact (fewer controls), onNote(midi) */
  function create(host, opts) {
    const S = Object.assign({ strings: 6, frets: 24, tuning: "fourths", root: 0, labels: "intervals", spacing: "equal", compact: false, check: false, mirror: "root" }, opts || {});
    let centre = null, sel = null, lit = null;
    const wrap = document.createElement("div"); wrap.className = "fb-wrap";
    const ctl = document.createElement("div"); ctl.className = "controls";
    const opt = (o, v) => Object.entries(o).map(([k, t]) => `<option value="${k}"${k == v ? " selected" : ""}>${t}</option>`).join("");
    ctl.innerHTML =
      `<label>tuning <select data-k="tuning">${opt(Object.fromEntries(Object.entries(TUNINGS).map(([k, T]) => [k, T.name])), S.tuning)}</select></label>` +
      `<label>root <select data-k="root">${opt(Object.fromEntries(NAMES.map((n, i) => [i, n])), S.root)}</select></label>` +
      (S.compact ? "" :
        `<label>strings <select data-k="strings">${opt({ 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 12: "12 (one turn of the circle)" }, S.strings)}</select></label>` +
        `<label>frets <select data-k="frets">${opt({ 12: "0–12", 15: "0–15", 24: "0–24" }, S.frets)}</select></label>` +
        `<label>show <select data-k="labels">${opt({ intervals: "intervals from the root", notes: "note names" }, S.labels)}</select></label>` +
        `<label>fret spacing <select data-k="spacing">${opt({ equal: "equal (by pitch)", real: "real (by string length)" }, S.spacing)}</select></label>`) +
      `<label>mirror <select data-k="mirror">${opt({ root: "through a root (inversions)", fret12: "across fret 12 (half the string)" }, S.mirror)}</select></label>` +
      `<label><input type="checkbox" data-k="check"${S.check ? " checked" : ""}> check the whole mirror</label>`;
    const warn = document.createElement("p"); warn.className = "note fb-warn"; warn.hidden = true;
    warn.innerHTML = "<b>Standard tuning is shown only to compare.</b> It is not a regular tuning: the major third between G and B breaks the pattern, so the mirror fails across those strings (red rings).";
    const box = document.createElement("div"); box.className = "scroll-x";
    const svg = el("svg", { role: "img", "aria-label": "Fretboard with the mirror of intervals" }); box.appendChild(svg);
    const info = document.createElement("p"); info.className = "note fb-info"; info.style.marginBottom = "0";
    wrap.append(ctl, warn, box, info); host.appendChild(wrap);
    ctl.addEventListener("change", (e) => { const k = e.target.dataset.k; if (!k) return;
      S[k] = e.target.type === "checkbox" ? e.target.checked : (["strings", "frets", "root"].includes(k) ? +e.target.value : e.target.value);
      if (k !== "labels" && k !== "check" && k !== "spacing") { centre = null; sel = null; } if (k === "mirror") sel = null; draw(); });

    const geo = {};
    function layout() {
      const W = Math.max(720, 64 * (S.frets + 1)), L = 54, R = 16, T = 28, rowH = S.strings > 8 ? 30 : 38, H = T + rowH * S.strings + 24;
      const span = W - L - R, xs = [];             // x of fret wire f (0 = the nut)
      for (let f = 0; f <= S.frets; f++) {
        if (S.spacing === "real") { const tot = 1 - Math.pow(2, -(S.frets + 0.6) / 12); xs.push(L + 46 + (span - 46) * (1 - Math.pow(2, -f / 12)) / tot); }
        else xs.push(L + 46 + (span - 46) * f / (S.frets + 0.6));
      }
      Object.assign(geo, { W, L, T, rowH, H, xs });
    }
    const cx = (f) => (f === 0 ? geo.L + 22 : (geo.xs[f - 1] + geo.xs[f]) / 2);
    const cy = (s) => geo.T + geo.rowH * (S.strings - 1 - s) + geo.rowH / 2;   // lowest string at the bottom
    const midi = (s, f) => TUNINGS[S.tuning].low + offsets(S.tuning, S.strings)[s] + f;
    const ival = (s, f) => md(midi(s, f) - S.root, 12);
    const inside = (s, f) => s >= 0 && s < S.strings && f >= 0 && f <= S.frets;
    function defaultCentre() {           // a root near the middle of the board
      let best = null, bd = 1e9;
      for (let s = 0; s < S.strings; s++) for (let f = 0; f <= S.frets; f++) if (ival(s, f) === 0) {
        const d = Math.abs(s - (S.strings - 1) / 2) * 3 + Math.abs(f - S.frets / 2); if (d < bd) { bd = d; best = [s, f]; } }
      return best;
    }
    const f12 = () => S.mirror === "fret12";
    // through a root: a point mirror (s, f) -> (2 s0 - s, 2 f0 - f); across fret 12: each string folds at its 12th fret, f -> 24 - f
    const mirrorOf = (s, f) => (f12() ? [s, 24 - f] : [2 * centre[0] - s, 2 * centre[1] - f]);
    const holds = (s, f) => { if (f12()) return true; const [s2, f2] = mirrorOf(s, f); return midi(s, f) + midi(s2, f2) === 2 * midi(centre[0], centre[1]); };
    /** if a note's mirror falls off the board, move the centre to the nearest root whose mirror of it fits (the board repeats every 12 frets) */
    function fitCentre(s, f) {
      if (f12()) return false; const [s2, f2] = mirrorOf(s, f); if (inside(s2, f2)) return false;
      let best = null, bd = 1e9;
      for (let a = 0; a < S.strings; a++) for (let b = 0; b <= S.frets; b++) if (ival(a, b) === 0 && inside(2 * a - s, 2 * b - f)) {
        const d = Math.abs(a - centre[0]) * 5 + Math.abs(b - centre[1]); if (d < bd) { bd = d; best = [a, b]; } }
      if (best) { centre = best; return true; } return false;
    }
    let moved = false;

    function draw() {
      layout(); svg.innerHTML = ""; svg.setAttribute("viewBox", `0 0 ${geo.W} ${geo.H}`); svg.style.minWidth = Math.round(Math.max(700, geo.W * (S.compact ? 0.62 : 0.72))) + "px";
      warn.hidden = S.tuning !== "standard";
      if (!centre || !inside(centre[0], centre[1])) centre = defaultCentre();
      const offs = offsets(S.tuning, S.strings), low = TUNINGS[S.tuning].low;
      // fret wires, markers, numbers
      for (let f = 0; f <= S.frets; f++) {
        svg.appendChild(el("line", { x1: geo.xs[f], x2: geo.xs[f], y1: geo.T, y2: geo.T + geo.rowH * S.strings, stroke: "var(--rule)", "stroke-width": f === 0 ? 5 : f % 12 === 0 ? 3 : 1.2 }));
        if (f > 0) svg.appendChild(el("text", { x: cx(f), y: geo.T - 9, "text-anchor": "middle", "font-size": 12, fill: "var(--muted)", "font-family": "var(--mono)" }, f));
      }
      svg.appendChild(el("text", { x: cx(0), y: geo.T - 9, "text-anchor": "middle", "font-size": 12, fill: "var(--muted)", "font-family": "var(--mono)" }, "0"));
      for (let s = 0; s < S.strings; s++) {
        svg.appendChild(el("line", { x1: geo.L + 40, x2: geo.xs[S.frets], y1: cy(s), y2: cy(s), stroke: "var(--muted)", "stroke-width": 1 + (S.strings - s) * 0.15, opacity: 0.55 }));
        svg.appendChild(el("text", { x: geo.L - 8, y: cy(s) + 4, "text-anchor": "end", "font-size": 13, fill: "var(--muted)", "font-family": "var(--sans)" }, NAMES[md(low + offs[s], 12)]));
      }
      // the arc to the selected note's mirror (drawn under the dots)
      const arcs = el("g", {}); svg.appendChild(arcs);
      let good = 0, all = 0;
      for (let s = 0; s < S.strings; s++) for (let f = 0; f <= S.frets; f++) {
        const i = ival(s, f), x = cx(f), y = cy(s), r = Math.min(15, geo.rowH * 0.42);
        const g = el("g", { class: "fb-cell", "data-s": s, "data-f": f, style: "cursor:pointer" });
        const filled = i <= 6, c = COL[i], isLit = lit !== null && lit === i;
        g.appendChild(el("circle", { cx: x, cy: y, r, fill: filled ? c : "var(--panel)", stroke: filled ? (i === 0 ? "var(--ink)" : c) : c, "stroke-width": filled ? (i === 0 ? 2 : 1) : 3.2, opacity: lit !== null && !isLit ? 0.25 : 1 }));
        const lab = S.labels === "notes" ? NAMES[md(midi(s, f), 12)] : INT[i];
        g.appendChild(el("text", { x, y: y + 4.5, "text-anchor": "middle", "font-size": lab.length > 1 ? 11.5 : 13, "font-weight": 600, "font-family": "var(--sans)", fill: "var(--ink)", opacity: lit !== null && !isLit ? 0.35 : 1, "pointer-events": "none" }, lab));
        if (isLit) g.appendChild(el("circle", { cx: x, cy: y, r: r + 4, fill: "none", stroke: "var(--ink)", "stroke-width": 2.5 }));
        if (S.check) { const [s2, f2] = mirrorOf(s, f); if (inside(s2, f2) && !(s === centre[0] && f === centre[1])) { all++; if (holds(s, f)) good++;
          else g.appendChild(el("circle", { cx: x, cy: y, r: r + 3, fill: "none", stroke: "#c0392b", "stroke-width": 2.5 })); } }
        svg.appendChild(g);
      }
      // the centre of the mirror
      const [s0, f0] = centre;
      if (f12() && S.frets >= 12) svg.appendChild(el("line", { x1: cx(12), x2: cx(12), y1: geo.T - 2, y2: geo.T + geo.rowH * S.strings + 2, stroke: "var(--ink)", "stroke-width": 1.5, "stroke-dasharray": "4 4", "pointer-events": "none" }));
      else svg.appendChild(el("circle", { cx: cx(f0), cy: cy(s0), r: Math.min(15, geo.rowH * 0.42) + 6, fill: "none", stroke: "var(--ink)", "stroke-width": 1.5, "stroke-dasharray": "3 3", "pointer-events": "none" }));
      // 12-fret repeat
      if (S.frets >= 12) svg.appendChild(el("text", { x: geo.xs[12], y: geo.H - 6, "text-anchor": "middle", "font-size": 11, fill: "var(--muted)", "font-family": "var(--sans)" }, f12() ? "fret 12: half the string, the octave — the mirror line" : "12: the octave, the pattern repeats"));
      if (sel) {
        const [s, f] = sel, [s2, f2] = mirrorOf(s, f);
        if (inside(s2, f2)) {
          const x1 = cx(f), y1 = cy(s), x2 = cx(f2), y2 = cy(s2), mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1;
          const k = 0.35, qx = mx - dy * k, qy = my + dx * k * 0.25 - Math.hypot(dx, dy) * 0.18;
          arcs.appendChild(el("path", { d: `M${x1},${y1} Q${qx},${qy} ${x2},${y2}`, fill: "none", stroke: holds(s, f) ? "var(--ink)" : "#c0392b", "stroke-width": 2.6, opacity: 0.8 }));
        }
      }
      // what the board says
      const rootName = NAMES[S.root], cName = NAMES[md(midi(s0, f0), 12)], cIsRoot = ival(s0, f0) === 0;
      let txt = f12() ? `Dashed line: fret 12, the middle of every string (2:1). Fret f and fret 24 − f lie the same number of semitones below and above each string's octave. Click a note to hear it and its partner.` : `Dashed ring: the centre of the mirror (${cName} on string ${s0 + 1} from the bottom, fret ${f0}${cIsRoot ? ", a root" : ""}). Click a note to hear it and see its mirror; shift-click (or long-press) a note to move the centre there.`;
      if (sel && f12()) { const [s, f] = sel, a = ival(s, f), f2 = 24 - f;
        txt = !inside(s, f2) ? `${INT[a]} at fret ${f}: its partner, fret ${f2}, is beyond this board; choose 0–24 frets.` :
          `<b>Fret ${f} (${INT[a]}) ↔ fret ${f2} (${INT[ival(s, f2)]})</b>: ${Math.abs(12 - f)} semitone${Math.abs(12 - f) === 1 ? "" : "s"} ${f < 12 ? "below" : "above"} and ${f < 12 ? "above" : "below"} the octave of the ${NAMES[md(midi(s, 0), 12)]} string (fret 12, ${INT[ival(s, 12)]}). Halving the string is the monochord's middle; the two halves of the neck mirror each other.`; }
      else if (sel) { const [s, f] = sel, [s2, f2] = mirrorOf(s, f), a = ival(s, f);
        if (!inside(s2, f2)) txt = `${INT[a]} (${LONG[a]}): its mirror falls outside this board; widen it or move the centre.`;
        else if (holds(s, f)) { const b = ival(s2, f2);
          txt = cIsRoot ? `<b>${INT[a]} (${LONG[a]}) ↔ ${INT[b]} (${LONG[b]})</b>: mirror partners through the root, ${a} + ${b} = ${a + b} semitones${a + b === 12 ? ", an octave: each is the inversion of the other" : ""}.${moved ? " (The centre moved to the nearest root whose mirror fits on the board: the pattern repeats every 12 frets, so every root is a mirror.)" : ""}` :
            `Mirror through ${cName}: the two notes lie the same distance below and above it (${Math.abs(midi(s, f) - midi(s0, f0))} semitones).`; }
        else txt = `<b style="color:#c0392b">The mirror breaks here</b>: the reflected place is a semitone off, because the B string is tuned a major third above G.`; }
      if (S.check) txt += ` <br><b>Mirror check:</b> ${good} of ${all} reflected pairs agree${good === all ? " — the whole board is a mirror" : ""}.`;
      info.innerHTML = txt + ` Root: ${rootName}.`;
    }

    let pressT = null, longDone = false;
    function cellAt(e) { const g = e.target.closest && e.target.closest(".fb-cell"); return g ? [+g.dataset.s, +g.dataset.f] : null; }
    svg.addEventListener("click", (e) => { const c = cellAt(e); if (!c) return;
      if (longDone) { longDone = false; return; }
      if (e.shiftKey) { centre = c; sel = null; draw(); return; }
      sel = c; moved = fitCentre(c[0], c[1]); audio(); const t = ctx.currentTime + 0.02, [s2, f2] = mirrorOf(c[0], c[1]);
      pluck(midi(c[0], c[1]), t, 1.1); if (inside(s2, f2)) pluck(midi(s2, f2), t + 0.35, 1.1);
      if (S.onNote) S.onNote(midi(c[0], c[1])); draw(); });
    svg.addEventListener("pointerdown", (e) => { const c = cellAt(e); if (!c) return; pressT = setTimeout(() => { centre = c; sel = null; longDone = true; draw(); }, 550); });
    for (const ev of ["pointerup", "pointerleave", "pointercancel"]) svg.addEventListener(ev, () => { clearTimeout(pressT); pressT = null; });
    draw();
    return {
      /** light every place of one interval (semitones above the root), or none with null */
      light(i) { lit = i === null || i === undefined ? null : md(i, 12); draw(); },
      set(o) { Object.assign(S, o); centre = null; sel = null; draw(); },
      get root() { return S.root; },
      play(m, t, d, g) { audio(); pluck(m, t === undefined ? ctx.currentTime + 0.02 : t, d, g); },
      audio() { audio(); return ctx; },
    };
  }
  return { create, NAMES, INT, LONG, TUNINGS };
})();
