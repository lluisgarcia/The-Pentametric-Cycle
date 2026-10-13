// The Pentametric Cycle — shared mathematics
// P(n) = (n^2 + 4 (n | 5)) / 5, with (n | 5) the Legendre symbol modulo 5.
"use strict";

const Pent = (() => {
  const mod = (a, m) => ((a % m) + m) % m;

  /** Legendre symbol (n | 5): 0 if 5 | n, +1 if n = ±1 mod 5, -1 if n = ±2 mod 5. */
  function leg(n) {
    const r = mod(n, 5);
    return r === 0 ? 0 : (r === 1 || r === 4) ? 1 : -1;
  }

  /** The Pentametric Formula (exact for |n| < 9.4e7). */
  function P(n) { return (n * n + 4 * leg(n)) / 5; }

  /** Consonance indicator H(n) = P(n) mod 5. */
  function H(n) { return mod(P(n), 5); }

  /** Interval Map C(m) = (26m - 5m^2)/24, m = 4n^2 mod 10. */
  function C(m) { return (26 * m - 5 * m * m) / 24; }

  const INTERVALS = [
    { h: 0, name: "silence", ratio: null, num: 0, den: 0, greek: "σιγή", translit: "sigē" },
    { h: 1, name: "unison", ratio: "1:1", num: 1, den: 1, greek: "ὁμώνυμον", translit: "homōnymon" },
    { h: 2, name: "octave", ratio: "2:1", num: 2, den: 1, greek: "διὰ πασῶν", translit: "dia pasōn" },
    { h: 3, name: "fifth", ratio: "3:2", num: 3, den: 2, greek: "διὰ πέντε", translit: "dia pente" },
    { h: 4, name: "fourth", ratio: "4:3", num: 4, den: 3, greek: "διὰ τεσσάρων", translit: "dia tessarōn" },
  ];

  /** CSS custom property holding the colour of H = h. */
  const colorVar = (h) => `var(--c${h})`;

  // Lucas and Fibonacci numbers as BigInt, k = 0..90.
  const L = [2n, 1n], F = [0n, 1n];
  for (let k = 2; k <= 90; k++) { L.push(L[k - 1] + L[k - 2]); F.push(F[k - 1] + F[k - 2]); }

  /** Index k with L_k = n (n >= 1), or -1. L_0 = 2 and L_2 = 3, L_1 = 1. */
  function lucasIndex(n) {
    const b = BigInt(n);
    for (let k = 0; k < L.length; k++) if (L[k] === b) return k;
    return -1;
  }

  function isSquare(x) {
    if (x < 0) return false;
    const r = Math.round(Math.sqrt(x));
    return r * r === x;
  }

  /** Format a number with a proper minus sign. */
  function fmt(x, digits) {
    let s = digits === undefined ? String(x) : x.toFixed(digits);
    if (s.startsWith("-")) s = "−" + s.slice(1);
    return s;
  }


  // ---- Lluis's reading: the silence as 5 (exploratory; see silence5.html) ----
  // Groups of five have members 1–5: H = 0 is read as 5, the fifth member, and sounds as the major third 5:4.
  const FIVE = { h: 5, name: "major third", ratio: "5:4", num: 5, den: 4, greek: "ἐπιτέταρτος", translit: "epitetartos" };
  const INTERVALS5 = [...INTERVALS, FIVE];
  // The choice travels in two ways, because some browsers keep a separate storage for every local file:
  // in localStorage, and as ?silence=5 on the links between pages (also handy to share a page in this reading).
  let s5 = false;
  try { s5 = localStorage.getItem("pent.silence") === "5"; } catch (e) { /* storage blocked: start at 0 */ }
  try { const q = new URLSearchParams(location.search).get("silence"); if (q === "5" || q === "0") s5 = q === "5"; } catch (e) { /* no query */ }
  try { localStorage.setItem("pent.silence", s5 ? "5" : "0"); } catch (e) { /* not remembered */ }
  const silence5 = () => s5;
  function withSilence(href) {           // add or remove ?silence=5 on a link to another page of the site
    if (!href || /^([a-z][a-z0-9+.-]*:|#|\/\/)/i.test(href) || !/\.html([?#]|$)/.test(href)) return href;
    const hash = href.includes("#") ? href.slice(href.indexOf("#")) : "", rest = hash ? href.slice(0, href.indexOf("#")) : href;
    const [path, qs] = rest.split("?"), ps = new URLSearchParams(qs || "");
    ps.set("silence", s5 ? "5" : "0");    // always explicit: a page's own old storage must not win over the choice
    const q = ps.toString(); return path + (q ? "?" + q : "") + hash;
  }
  const tag = (e) => { const a = e.target && e.target.closest && e.target.closest("a[href]"); if (a) { const h = withSilence(a.getAttribute("href")); if (h !== a.getAttribute("href")) a.setAttribute("href", h); } };
  if (typeof document !== "undefined") for (const ev of ["pointerdown", "focusin", "click", "contextmenu"]) document.addEventListener(ev, tag, true);
  function setSilence5(v) {
    s5 = !!v;
    try { localStorage.setItem("pent.silence", s5 ? "5" : "0"); } catch (e) { /* not remembered */ }
    try { const u = new URL(location.href); u.searchParams.set("silence", s5 ? "5" : "0"); history.replaceState(history.state, "", u); } catch (e) { /* keep the address */ }
    document.querySelectorAll(".sil-switch").forEach(syncSwitch);
    window.dispatchEvent(new CustomEvent("pent-silence", { detail: s5 }));
  }
  /** The value as the page reads it: H(n), or 5 for a silence when the switch is on 5. */
  const V = (n) => { const h = H(n); return s5 && h === 0 ? 5 : h; };
  /** 1 + MOD(P − 1; 5): the members 1–5 of each group of five. */
  const I5 = (n) => 1 + mod(P(n) - 1, 5);
  /** The interval of a value v (0–5). */
  const IV = (v) => INTERVALS5[v];
  function syncSwitch(box) { box.querySelectorAll("button").forEach((b) => b.classList.toggle("on", (b.dataset.v === "5") === s5)); const t = box.querySelector(".now5"); if (t) t.hidden = !s5; }
  /** Put the switch into a host element. */
  function silenceSwitch(host, note) {
    const box = document.createElement("div"); box.className = "sil-switch";
    box.innerHTML = '<span>silence:</span><span class="seg2" role="group" aria-label="read the silence as 0 or as 5"><button type="button" data-v="0" title="the papers: 0 is silence">0</button><button type="button" data-v="5" title="Lluis\'s reading: the silence is 5, the major third 5:4">5</button></span>' +
      '<span class="now5">' + (note || "the silences sound as major thirds 5:4 (Lluis's reading, exploratory)") + '</span> <a class="why" href="silence5.html">why 5?</a>';
    box.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => setSilence5(b.dataset.v === "5")));
    syncSwitch(box); host.appendChild(box); return box;
  }

  // ---- tunings, shared by the pages that play or write MIDI ----
  // cents of each note above the tonic (d = 0 … 11 semitones); the same tunings as on The chord wheel
  const cts = (r) => 1200 * Math.log2(r), md = (a, m) => ((a % m) + m) % m;
  const P5c = cts(3 / 2), PCc = cts(531441 / 524288), SCc = cts(81 / 80), SCHc = cts(32805 / 32768), KF5 = cts(16384 / 10935);
  const byFifths = (f, lo, hi) => { const t = []; for (let k = lo; k <= hi; k++) t[md(7 * k, 12)] = md(k * f, 1200); return t; };
  function chainT(links) { const t = new Array(12).fill(0); let c = 0; for (let k = 1; k < 12; k++) { c += links[k - 1]; t[md(7 * k, 12)] = md(c, 1200); } return t; }
  const q4 = P5c - PCc / 4, m4 = P5c - SCc / 4, v6 = P5c - PCc / 6;
  const TUNINGS = [
    { id: "et", name: "equal temperament", cents: null },
    { id: "p5", name: "Pentametric fifths (pure 3:2)", cents: byFifths(P5c, 0, 11) },
    { id: "p4", name: "Pentametric fourths (pure 4:3)", cents: byFifths(P5c, -11, 0) },
    { id: "pyth", name: "Pythagorean (3:2 up and 4:3 up)", cents: byFifths(P5c, -5, 6) },
    { id: "p35", name: "Pentametric with thirds (3:2 and 5:4)", five: true, cents: [1, 16 / 15, 9 / 8, 6 / 5, 5 / 4, 4 / 3, 45 / 32, 3 / 2, 8 / 5, 5 / 3, 9 / 5, 15 / 8].map(cts) },
    { id: "kfifth", name: "Kirnberger fifth (≈ equal)", cents: byFifths(KF5, -5, 6) },
    { id: "mean", name: "¼-comma meantone", cents: byFifths(P5c - SCc / 4, -3, 8) },
    { id: "werck", name: "Werckmeister III", cents: chainT([q4, q4, q4, P5c, P5c, q4, P5c, P5c, P5c, P5c, P5c]) },
    { id: "kirn3", name: "Kirnberger III", cents: chainT([m4, m4, m4, m4, P5c, P5c, P5c - SCHc, P5c, P5c, P5c, P5c]) },
    { id: "vall", name: "Vallotti", cents: chainT([v6, v6, v6, v6, v6, P5c, P5c, P5c, P5c, P5c, P5c]) },
  ];
  const tuning = (id) => TUNINGS.find((t) => t.id === id);
  /** Deviation in cents from equal temperament of MIDI note m, in tuning id, with the tonic on pitch class tonic. */
  function devCents(id, m, tonic) {
    const T = tuning(id); if (!T || !T.cents) return 0;
    const d = md(m - tonic, 12); let dev = T.cents[d] - 100 * d; if (dev > 600) dev -= 1200; if (dev < -600) dev += 1200; return dev;
  }
  /** Fill a <select> with the tunings (the "with thirds" one only when the switch is on 5); extra = [[value, text], …] first. */
  function tuningOptions(sel, extra) {
    const keep = sel.value; sel.innerHTML = "";
    for (const [v, t] of extra || []) sel.add(new Option(t, v));
    for (const T of TUNINGS) if (!T.five || s5) sel.add(new Option(T.name + (T.five ? " · silence as 5" : ""), T.id));
    if ([...sel.options].some((o) => o.value === keep)) sel.value = keep;
  }
  /** MIDI events for tuned notes, as [tick, bytes]: each note gets a channel of its own from the pool with a pitch bend
   *  (range ±2 semitones), so any synthesizer plays the tuning. notes: {t, d (ticks), m (MIDI key), dev (cents), vel}. */
  function tunedEvents(notes, pool, program) {
    const ev = [], free = pool.map((ch) => ({ ch, until: -1, bend: null }));
    for (const ch of pool) { ev.push([0, [0xb0 | ch, 101, 0]], [0, [0xb0 | ch, 100, 0]], [0, [0xb0 | ch, 6, 2]], [0, [0xb0 | ch, 38, 0]], [0, [0xb0 | ch, 101, 127]], [0, [0xb0 | ch, 100, 127]]);
      if (program !== undefined) ev.push([0, [0xc0 | ch, program]]); }
    for (const x of [...notes].sort((a, b) => a.t - b.t)) {
      const b = Math.max(0, Math.min(16383, Math.round(8192 + (x.dev || 0) / 200 * 8192)));
      let c = free.find((f) => f.until <= x.t && f.bend === b) || free.find((f) => f.until <= x.t) || free.reduce((a, f) => (f.until < a.until ? f : a));
      if (c.bend !== b) { ev.push([x.t, [0xe0 | c.ch, b & 127, (b >> 7) & 127]]); c.bend = b; }
      ev.push([x.t, [0x90 | c.ch, x.m, Math.max(1, Math.min(127, x.vel))]], [x.t + x.d, [0x80 | c.ch, x.m, 0]]); c.until = x.t + x.d;
    }
    return ev;
  }

  /** Sort MIDI events [tick, bytes] for one track: at the same tick, note-offs, then controllers and meta, then bends, then note-ons. */
  function sortMidi(ev) {
    const pr = (b) => { const st = b[0] & 0xf0; return st === 0x80 ? 0 : st === 0xe0 ? 2 : st === 0x90 ? 3 : 1; };
    return ev.map((e, i) => [e, i]).sort((x, y) => x[0][0] - y[0][0] || pr(x[0][1]) - pr(y[0][1]) || x[1] - y[1]).map((x) => x[0]);
  }
  return { mod, leg, P, H, C, INTERVALS, INTERVALS5, TUNINGS, tuning, devCents, tuningOptions, tunedEvents, sortMidi, colorVar, L, F, lucasIndex, isSquare, fmt, silence5, setSilence5, V, I5, IV, silenceSwitch };
})();
