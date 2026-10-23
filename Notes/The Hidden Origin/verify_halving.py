# Exact checks for the note "The Hidden Origin: halving squares and the start of the Fibonacci spiral"
# (Lluis Garcia Torcal, October 2026).
# Frame (as in "The Origin of Origins"): unit square centred at O = 0, corners (+-1/2, +-1/2), E = (1/2, 1/2).
# Points are Gaussian rationals x + iy, held exactly as pairs of Fractions.
from fractions import Fraction as Fr
import math

class G:
    def __init__(s, a, b=0): s.a, s.b = Fr(a), Fr(b)
    def _c(o): return o if isinstance(o, G) else G(o)
    def __add__(s, o): o = G._c(o); return G(s.a + o.a, s.b + o.b)
    __radd__ = __add__
    def __sub__(s, o): o = G._c(o); return G(s.a - o.a, s.b - o.b)
    def __rsub__(s, o): return G._c(o) - s
    def __neg__(s): return G(-s.a, -s.b)
    def __mul__(s, o): o = G._c(o); return G(s.a*o.a - s.b*o.b, s.a*o.b + s.b*o.a)
    __rmul__ = __mul__
    def __truediv__(s, o):
        o = G._c(o); d = o.a**2 + o.b**2
        return G((s.a*o.a + s.b*o.b)/d, (s.b*o.a - s.a*o.b)/d)
    def __pow__(s, n):
        r = G(1)
        for _ in range(abs(n)): r = r * s
        return r if n >= 0 else G(1) / r
    def __eq__(s, o): o = G._c(o); return s.a == o.a and s.b == o.b
    def n2(s): return s.a**2 + s.b**2
    def __repr__(s): return f"({s.a}, {s.b})"

I = G(0, 1); E = G(Fr(1, 2), Fr(1, 2)); H0 = G(Fr(3, 10), Fr(-1, 10)); HP = G(Fr(7, 10), Fr(-1, 10))
ok = 0
def check(cond, what):
    global ok
    assert cond, what
    ok += 1; print("ok ", what)

# --- The Fibonacci arc rule (as in the Spiral Workbench): square k has side s_k, a_k = 90 deg * k,
#     arc centre c_k = P_{k-1} - s_k i^k, end P_k = c_k + s_k i^{k+1}, so P_k = P_{k-1} + s_k i^k (i - 1).
#     First square: k = 1, s = 1, P_0 = E.  Run backwards: P_{k-1} = P_k - s_k i^k (i - 1), k = 0, -1, -2, ...
def lead_in(q, n):
    """Lead-in squares of sides q, q^2, ... (k = 0, -1, -2, ...); returns ends P, arc centres, square centres."""
    P, s, ends, arcc, cen = E, Fr(q), [E], [], []
    for j in range(n):
        k = -j; ik = I**k
        c = P - s * ik * I                       # arc centre of square k (P_k = c_k + s_k i^{k+1})
        Pn = P - s * ik * (I - 1)                # P_{k-1}
        cen.append((P + Pn) / 2)                  # the square has corners c, P, Pn and P + Pn - c: its centre is (P + Pn)/2
        arcc.append(c); ends.append(Pn); P, s = Pn, s * Fr(q)
    return ends, arcc, cen

ends, arcc, cen = lead_in(Fr(1, 2), 40)
check(ends[1] == G(1, 0), "the first halving arc starts at (1, 0) and ends at E")
check(arcc[0] == G(Fr(1, 2), 0) and (E - arcc[0]) == G(0, Fr(1, 2)), "its centre is (1/2, 0): at E its radius is vertical, so it has the same (horizontal) tangent as the first Fibonacci arc, whose centre (1/2, -1/2) is also straight below E")
check(cen[0] == G(Fr(3, 4), Fr(1, 4)), "the first halving square is [1/2, 1] x [0, 1/2], centre (3/4, 1/4)")

# --- Theorem 2: the limit.  Sum of the steps = (i - 1) * sum_{j>=0} 2^{-j-1} (-i)^j = (i - 1)/(2 + i)
S = (I - 1) / (2 + I)
check(E - S == HP, "limit E - (i-1)/(2+i) = (7/10, -1/10) = H'")
for m in (1, 10, 20, 40):
    check(ends[m] - HP == G(0, Fr(-1, 2))**m * (E - HP) and (ends[m] - HP).n2() * 4**m == Fr(2, 5), f"P_(-{m}) - H' = (-i/2)^{m} (E - H'): the ends approach H' geometrically")
check(G(1 - HP.a, HP.b) == H0, "H' is the mirror image of Holden's crossing H0 = (3/10, -1/10) in the right side x = 1/2")
check((HP - G(1, 0)).n2() == Fr(1, 10), "H' lies on the circle of origins (radius^2 = 1/10) of the neighbouring unit square, centred at (1, 0)")
check(HP.n2() == Fr(1, 2), "|H'|^2 = 1/2: H' lies on the circle through the four corners of the unit square")

# --- the spiral similarity f(z) = H' - (i/2)(z - H')
f = lambda z, L=HP, q=Fr(1, 2): L - I * q * (z - L)
check(f(E) == G(1, 0) and f(G(Fr(-1, 2), Fr(-1, 2))) == E, "f maps the first Fibonacci arc (from E to (-1/2,-1/2)) onto the first halving arc (from (1,0) to E)")
check(f(G(0)) == cen[0] and all(f(cen[j]) == cen[j + 1] for j in range(30)), "f maps O to the first halving centre, and each halving centre to the next")
check(all(f(arcc[j]) == arcc[j + 1] for j in range(30)), "f maps each arc centre to the next")

# --- Theorem 4: centres, lines, circumcircles
for j in range(-1, 30):
    s = Fr(1, 2)**(j + 1); c = G(0) if j == -1 else cen[j]
    if j < 3: check(c == HP + G(s / 10) * G(1, 7) * (G(0, -1)**j), f"c_{j} = H' + (s/10)(1+7i)(-i)^j, side s = {s}")
    assert c == HP + G(s / 10) * G(1, 7) * (G(0, -1)**j)
    assert (c - HP).n2() == s * s / 2               # H' on the circumcircle of square j
    d = c - HP
    assert (d.b == 7 * d.a) if j % 2 == 0 else (7 * d.b == -d.a)
check(True, "for j = -1 .. 29: |c_j - H'| = s_j/sqrt2, even j on the line of slope 7, odd j (and O, j = -1) on the line of slope -1/7")
check(G(1, 7) == (1 + I) * G(4, 3) and G(4, 3) == I * (2 - I)**2 and G(1, 3) == (1 + I) * (2 + I), "1+7i = (1+i)(4+3i), 4+3i = i(2-i)^2;  Holden: 1+3i = (1+i)(2+i)")
# the slope -1/7 line through H' passes through O; the slope 7 line passes through (3/4,1/4) and the corner (1/2,-3/2)
check(HP.b + Fr(-1, 7) * (0 - HP.a) == 0 and HP.b + 7 * (Fr(1, 2) - HP.a) == Fr(-3, 2), "the line of slope -1/7 through H' passes through O; the line of slope 7 through (1/2, -3/2)")

# --- lengths: the lead-in arcs have total length (pi/2)(1/2 + 1/4 + ...) = pi/2, one quarter of the unit circle
check(sum(Fr(1, 2)**(j + 1) for j in range(60)) + Fr(1, 2)**60 == 1, "sum of the halving sides = 1, so the whole lead-in is pi/2 long, the length of the first Fibonacci arc")

# --- Theorem 6: any ratio q.  L(q) = c0/(1 + iq), c0 = E + (q/2)(1 - i) = E(1 - iq)  =>  L(q) = E (1 - iq)/(1 + iq)
for q in (Fr(1, 2), Fr(1, 3), Fr(2, 3), Fr(1, 5), Fr(3, 7)):
    e, a, c = lead_in(q, 3)
    L = E * (1 - I * q) / (1 + I * q)
    assert c[0] == E * (1 - I * q) and c[0] == E + G(q / 2) * (1 - I)
    assert L - I * q * (0 - L) == c[0]                      # fixed point of f_q, which maps O to c0
    assert L - I * q * (c[0] - L) == c[1] and L - I * q * (E - L) == e[1]
    assert L.n2() == Fr(1, 2)
    # numerically: the ends converge to L
    e, a, c = lead_in(q, 90); assert abs(float(e[-1].a - L.a)) + abs(float(e[-1].b - L.b)) < 1e-12
check(True, "for q = 1/2, 1/3, 2/3, 1/5, 3/7: limit = E(1-iq)/(1+iq), on the circle |z|^2 = 1/2 (the corners' circle)")
check((1 - I * Fr(1, 2)) / (1 + I * Fr(1, 2)) == G(Fr(3, 5), Fr(-4, 5)) and (1 - I * Fr(1, 3)) / (1 + I * Fr(1, 3)) == G(Fr(4, 5), Fr(-3, 5)),
      "q = 1/2 turns E by the angle of 3-4i (53.13 deg), q = 1/3 by the angle of 4-3i (36.87 deg)")
L3 = E * (1 - I * Fr(1, 3)) / (1 + I * Fr(1, 3))
check(L3 == G(Fr(7, 10), Fr(1, 10)) and 2 * G(Fr(1, 2), 0) - L3 == H0,
      "q = 1/3 ends at (7/10, 1/10), the half turn of H0 about the midpoint (1/2, 0) of the right side")
# the corners' circle meets the right neighbour's circle of origins only at x = 7/10:  |z|^2=1/2, |z-1|^2=1/10 => 2x - 1 = 2/5
check(Fr(1, 2) - Fr(1, 10) + 1 == 2 * Fr(7, 10) and Fr(1, 2) - Fr(7, 10)**2 == Fr(1, 100), "|z|^2 = 1/2 and |z-1|^2 = 1/10 meet exactly at (7/10, +-1/10)")
# origins of the whole grid on |z|^2 = 1/2: tenths (a, b) with a^2 + b^2 = 50; an origin has one coordinate = m +- 3/10, the other n +- 1/10
orig = lambda a, b: (a % 10 in (3, 7) and b % 10 in (1, 9)) or (a % 10 in (1, 9) and b % 10 in (3, 7))
on = [(a, b) for a in range(-8, 9) for b in range(-8, 9) if a*a + b*b == 50 and orig(a, b)]
check(sorted(on) == sorted([(sx*7, sy*1) for sx in (1, -1) for sy in (1, -1)] + [(sx*1, sy*7) for sx in (1, -1) for sy in (1, -1)]), "the origins of the grid on the corners' circle are (+-7/10, +-1/10), (+-1/10, +-7/10)")
# for 0 < q < 1 the limit is E turned clockwise by 2 arctan q in (0, 90 deg): only (7/10, +-1/10) lie on that open arc
arc = [(a, b) for (a, b) in on if 0 < (math.degrees(math.atan2(0.5, 0.5) - math.atan2(b, a)) % 360) < 90]
check(sorted(arc) == [(7, -1), (7, 1)], "for 0 < q < 1 the limit is an origin only for q = 1/2 and q = 1/3")

# --- golden ratio q = 1/phi: L = sqrt5 * H0, on Holden's odd line x + 3y = 0
phi = (1 + 5**0.5) / 2; q = 1 / phi
Lg = complex(.5, .5) * (1 - 1j*q) / (1 + 1j*q)
check(abs(Lg - 5**0.5 * complex(.3, -.1)) < 1e-15, "q = 1/phi: limit = sqrt5 H0 (numerically; exactly since phi/(phi+2) = 1/sqrt5), on the line x + 3y = 0")
# lengths for general q: (pi/2) q/(1-q) = pi/2 only for q = 1/2
check(Fr(1, 2) / (1 - Fr(1, 2)) == 1, "lead-in length (pi/2) q/(1-q) equals pi/2 exactly when q = 1/2")

# --- eq. (1) as printed: c_k = P_{k-1} - s_k i^k, P_k = c_k + s_k i^{k+1}; Fibonacci squares k = 1, 2 share the centre 1/2 - i/2
Pp, fib = E, [1, 1, 2, 3, 5]
cs = []
for k, sk in enumerate(fib, start=1):
    c = Pp - sk * I**k; Pn = Pp + sk * I**k * (I - 1); assert Pn == c + sk * I**(k + 1); cs.append(c); Pp = Pn
check(cs[0] == G(Fr(1, 2), Fr(-1, 2)) and cs[1] == cs[0], "eq. (1): the first two Fibonacci arcs are both about 1/2 - i/2")
# tangency at every halving junction: radii P_k - c_k and P_k - c_{k+1} point the same way
okT = True
for j in range(1, 30):
    Pk = ends[j]; a1, a2 = Pk - arcc[j - 1], Pk - arcc[j]
    okT &= (a1.a * a2.b - a1.b * a2.a == 0) and (a1.a * a2.a + a1.b * a2.b > 0)
check(okT, "at every junction of the halving arcs the two radii are parallel and point the same way (same tangent, no corner)")
check(all(f(ends[j + 1]) == ends[j + 2] for j in range(30)) and all(f(arcc[j]) == arcc[j + 1] for j in range(30)), "f maps each end and each arc centre to the next")
print(f"\nall {ok} checks passed")
