// Approximate ephemeris after Paul Schlyter, "How to compute planetary positions" (orbital elements of date, with the
// main perturbations of the Moon, Jupiter, Saturn and Uranus; Pluto by its series, which gives the equinox of date). Accuracy about 1–2 arcminutes for
// the planets and a few arcminutes for the Moon over several centuries around 2000: plenty for a chart.
"use strict";
const Ephem = (() => {
  const RAD = Math.PI / 180, rev = (x) => x - Math.floor(x / 360) * 360;
  const sind = (x) => Math.sin(x * RAD), cosd = (x) => Math.cos(x * RAD), atan2d = (y, x) => Math.atan2(y, x) / RAD;
  // day number: d = 0.0 at 2000 Jan 0.0 UT (= 1999 Dec 31, 0h UT)
  const dayNumber = (date) => (date.getTime() - Date.UTC(1999, 11, 31, 0, 0, 0)) / 86400000;
  const EL = {   // N, i, w, a, e, M  (each [value at d = 0, change per day])
    Mercury: [[48.3313, 3.24587e-5], [7.0047, 5.0e-8], [29.1241, 1.01444e-5], [0.387098, 0], [0.205635, 5.59e-10], [168.6562, 4.0923344368]],
    Venus: [[76.6799, 2.4659e-5], [3.3946, 2.75e-8], [54.891, 1.38374e-5], [0.72333, 0], [0.006773, -1.302e-9], [48.0052, 1.6021302244]],
    Mars: [[49.5574, 2.11081e-5], [1.8497, -1.78e-8], [286.5016, 2.92961e-5], [1.523688, 0], [0.093405, 2.516e-9], [18.6021, 0.5240207766]],
    Jupiter: [[100.4542, 2.76854e-5], [1.303, -1.557e-7], [273.8777, 1.64505e-5], [5.20256, 0], [0.048498, 4.469e-9], [19.895, 0.0830853001]],
    Saturn: [[113.6634, 2.3898e-5], [2.4886, -1.081e-7], [339.3939, 2.97661e-5], [9.55475, 0], [0.055546, -9.499e-9], [316.967, 0.0334442282]],
    Uranus: [[74.0005, 1.3978e-5], [0.7733, 1.9e-8], [96.6612, 3.0565e-5], [19.18171, -1.55e-8], [0.047318, 7.45e-9], [142.5905, 0.011725806]],
    Neptune: [[131.7806, 3.0173e-5], [1.77, -2.55e-7], [272.8461, -6.027e-6], [30.05826, 3.313e-8], [0.008606, 2.15e-9], [260.2471, 0.005995147]],
  };
  const el = (name, d) => EL[name].map(([v, r]) => v + r * d);
  function kepler(M, e) { let E = M + (e / RAD) * sind(M) * (1 + e * cosd(M)); for (let k = 0; k < 30; k++) { const dE = (E - (e / RAD) * sind(E) - M) / (1 - e * cosd(E)); E -= dE; if (Math.abs(dE) < 1e-9) break; } return E; }
  // heliocentric (or, for the Moon, geocentric) ecliptic position from elements
  function orbit(N, i, w, a, e, M) {
    M = rev(M); const E = kepler(M, e), xv = a * (cosd(E) - e), yv = a * Math.sqrt(1 - e * e) * sind(E), v = atan2d(yv, xv), r = Math.hypot(xv, yv);
    const x = r * (cosd(N) * cosd(v + w) - sind(N) * sind(v + w) * cosd(i)), y = r * (sind(N) * cosd(v + w) + cosd(N) * sind(v + w) * cosd(i)), z = r * sind(v + w) * sind(i);
    return { x, y, z, lon: rev(atan2d(y, x)), lat: atan2d(z, Math.hypot(x, y)), r };
  }
  function sun(d) {   // the Sun's geocentric ecliptic position (equals minus the Earth's heliocentric position)
    const w = 282.9404 + 4.70935e-5 * d, e = 0.016709 - 1.151e-9 * d, M = rev(356.047 + 0.9856002585 * d);
    const E = kepler(M, e), xv = cosd(E) - e, yv = Math.sqrt(1 - e * e) * sind(E), v = atan2d(yv, xv), r = Math.hypot(xv, yv), lon = rev(v + w);
    return { lon, r, x: r * cosd(lon), y: r * sind(lon), M, L: rev(w + M) };
  }
  function moon(d) {
    const N = 125.1228 - 0.0529538083 * d, i = 5.1454, w = 318.0634 + 0.1643573223 * d, e = 0.0549, M = 115.3654 + 13.0649929509 * d;
    const p = orbit(N, i, w, 60.2666, e, M), S = sun(d), Ms = S.M, Mm = rev(M), Ls = S.L, Lm = rev(N + w + M), D = Lm - Ls, F = Lm - N;
    const dl = -1.274 * sind(Mm - 2 * D) + 0.658 * sind(2 * D) - 0.186 * sind(Ms) - 0.059 * sind(2 * Mm - 2 * D) - 0.057 * sind(Mm - 2 * D + Ms)
      + 0.053 * sind(Mm + 2 * D) + 0.046 * sind(2 * D - Ms) + 0.041 * sind(Mm - Ms) - 0.035 * sind(D) - 0.031 * sind(Mm + Ms)
      - 0.015 * sind(2 * F - 2 * D) + 0.011 * sind(Mm - 4 * D);
    return { lon: rev(p.lon + dl), node: rev(N) };
  }
  function planetHelio(name, d) {
    const [N, i, w, a, e, M] = el(name, d), p = orbit(N, i, w, a, e, M);
    const Mj = rev(19.895 + 0.0830853001 * d), Msat = rev(316.967 + 0.0334442282 * d), Mu = rev(142.5905 + 0.011725806 * d);
    let dl = 0;
    if (name === "Jupiter") dl = -0.332 * sind(2 * Mj - 5 * Msat - 67.6) - 0.056 * sind(2 * Mj - 2 * Msat + 21) + 0.042 * sind(3 * Mj - 5 * Msat + 21) - 0.036 * sind(Mj - 2 * Msat) + 0.022 * cosd(Mj - Msat) + 0.023 * sind(2 * Mj - 3 * Msat + 52) - 0.016 * sind(Mj - 5 * Msat - 69);
    if (name === "Saturn") dl = 0.812 * sind(2 * Mj - 5 * Msat - 67.6) - 0.229 * cosd(2 * Mj - 4 * Msat - 2) + 0.119 * sind(Mj - 2 * Msat - 3) + 0.046 * sind(2 * Mj - 6 * Msat - 69) + 0.014 * sind(Mj - 3 * Msat + 32);
    if (name === "Uranus") dl = 0.04 * sind(Msat - 2 * Mu + 6) + 0.035 * sind(Msat - 3 * Mu + 33) - 0.015 * sind(Mj - Mu + 20);
    if (!dl) return p;
    const lon = p.lon + dl, rr = p.r * cosd(p.lat);
    return { x: rr * cosd(lon), y: rr * sind(lon), z: p.z, lon: rev(lon), lat: p.lat, r: p.r };
  }
  function pluto(d) {   // Schlyter's Pluto series (valid about 1800–2100), equinox J2000 → add precession
    const S = 50.03 + 0.033459652 * d, P = 238.95 + 0.003968789 * d;
    const lon = 238.9508 + 0.00400703 * d - 19.799 * sind(P) + 19.848 * cosd(P) + 0.897 * sind(2 * P) - 4.956 * cosd(2 * P) + 0.61 * sind(3 * P) + 1.211 * cosd(3 * P)
      - 0.341 * sind(4 * P) - 0.19 * cosd(4 * P) + 0.128 * sind(5 * P) - 0.034 * cosd(5 * P) - 0.038 * sind(6 * P) + 0.031 * cosd(6 * P) + 0.02 * sind(S - P) - 0.01 * cosd(S - P);
    const lat = -3.9082 - 5.453 * sind(P) - 14.975 * cosd(P) + 3.527 * sind(2 * P) + 1.673 * cosd(2 * P) - 1.051 * sind(3 * P) + 0.328 * cosd(3 * P) + 0.179 * sind(4 * P) - 0.292 * cosd(4 * P)
      + 0.019 * sind(5 * P) + 0.1 * cosd(5 * P) - 0.031 * sind(6 * P) - 0.026 * cosd(6 * P) + 0.011 * cosd(S - P);
    const r = 40.72 + 6.68 * sind(P) + 6.9 * cosd(P) - 1.18 * sind(2 * P) - 0.03 * cosd(2 * P) + 0.15 * sind(3 * P) - 0.14 * cosd(3 * P);
    const L = lon;
    return { x: r * cosd(lat) * cosd(L), y: r * cosd(lat) * sind(L), z: r * sind(lat) };
  }
  // geocentric ecliptic longitudes (equinox of date) at day number d
  function longitudes(d) {
    const S = sun(d), out = { Sun: S.lon, Moon: 0, Node: 0 };
    const m = moon(d); out.Moon = m.lon; out.Node = m.node;
    for (const name of ["Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"]) { const p = planetHelio(name, d); out[name] = rev(atan2d(p.y + S.y, p.x + S.x)); }
    const pl = pluto(d); out.Pluto = rev(atan2d(pl.y + S.y, pl.x + S.x));
    return out;
  }
  const BODIES = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "Node"];
  function chart(date, latDeg, lonDeg) {
    const d = dayNumber(date), L = longitudes(d), L2 = longitudes(d + 0.02), L1 = longitudes(d - 0.02);
    const bodies = BODIES.map((b) => { let sp = L2[b] - L1[b]; if (sp > 180) sp -= 360; if (sp < -180) sp += 360; return { name: b, lon: L[b], speed: sp / 0.04, retro: sp < 0 }; });
    // angles: the obliquity, the local sidereal time, the midheaven and the ascendant
    const ecl = 23.4393 - 3.563e-7 * d, jd = date.getTime() / 86400000 + 2440587.5;
    const LST = rev(280.46061837 + 360.98564736629 * (jd - 2451545) + lonDeg);    // the local sidereal time, in degrees
    const mc = rev(atan2d(sind(LST), cosd(LST) * cosd(ecl)));
    const asc = rev(atan2d(cosd(LST), -(sind(LST) * cosd(ecl) + Math.tan(latDeg * RAD) * sind(ecl))));
    return { d, bodies, asc, mc, lst: LST, ecl };
  }
  return { chart, dayNumber, longitudes };
})();
if (typeof module !== "undefined") module.exports = Ephem;
