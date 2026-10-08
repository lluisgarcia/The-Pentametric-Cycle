// The Pentametric Cycle — shared mathematics
// P(n) = (n^2 + 4 (n/5)) / 5, with (n/5) the Legendre symbol modulo 5.
"use strict";

const Pent = (() => {
  const mod = (a, m) => ((a % m) + m) % m;

  /** Legendre symbol (n/5): 0 if 5 | n, +1 if n = ±1 mod 5, -1 if n = ±2 mod 5. */
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

  return { mod, leg, P, H, C, INTERVALS, colorVar, L, F, lucasIndex, isSquare, fmt };
})();
