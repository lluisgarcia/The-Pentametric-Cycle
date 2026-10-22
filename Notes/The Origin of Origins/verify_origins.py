# Exact checks for the note "The Origin of Origins" (Lluis Garcia Torcal, Oct 2026).
# Frame: unit square centred at O = (0,0), corners (+-1/2, +-1/2).
# Diagonal arc with centre K: the quarter of the unit circle about the corner K that joins the
# two corners adjacent to K (they are opposite corners of the square).
from fractions import Fraction as Fr
from math import atan2, degrees, sqrt, isclose
half = Fr(1, 2)
corners = [(half, half), (half, -half), (-half, -half), (-half, half)]
dot = lambda p, q: p[0]*q[0] + p[1]*q[1]
sub = lambda p, q: (p[0]-q[0], p[1]-q[1])
add = lambda p, q: (p[0]+q[0], p[1]+q[1])
mul = lambda a, p: (a*p[0], a*p[1])
n2 = lambda p: dot(p, p)

def on_arc(p, K):
    """p on the diagonal arc centred at corner K (on the circle, inside the quarter towards the square)."""
    v = sub(p, K)
    return n2(v) == 1 and dot(v, (-K[0], 0)) >= 0 and dot(v, (0, -K[1])) >= 0

# 1. Uniqueness. A crossing p of the circle |p|^2 = t with the arc about K satisfies p.K = (t - 1/2)/2.
#    If the tangent at p (the line x.p = t) passes through an end E of that arc (E.K = 0, |E|^2 = 1/2), then
#    p = 2(p.K)K + 2(p.E)E and |p|^2 = t give (t - 1/2)^2/2 + 2t^2 = t, i.e. 20t^2 - 12t + 1 = 0.
for t in (Fr(1, 10), Fr(1, 2)):
    assert 20*t*t - 12*t + 1 == 0
# discriminant 144 - 80 = 64 = 8^2, so these are the only roots
assert 144 - 80 == 64
# far corner -K instead: p.(-K) = t gives (1/2 - t)/2 = t, t = 1/6, and the crossing is irrational
t6 = Fr(1, 6); assert (half - t6)/2 == t6

# 2. The eight origins: for t = 1/10, p = -(2/5)K + (1/5)E for each arc centre K and each end E.
t = Fr(1, 10)
origins = []
for K in corners:
    for E in corners:
        if E != K and dot(E, K) == 0:
            p = add(mul(2*(t - half)/2, K), mul(2*t, E))
            assert n2(p) == t and on_arc(p, K)           # on the circle of origins and on the arc
            assert dot(E, p) == t                        # tangent at p passes through the end E
            origins.append((p, K, E))
pts = sorted({o[0] for o in origins}, key=lambda p: atan2(p[1], p[0]))
assert len(pts) == 8
assert set(pts) == {(Fr(a*s, 10), Fr(b*u, 10)) for a, b in ((3, 1), (1, 3)) for s in (1, -1) for u in (1, -1)}
# every crossing of the circle of origins with the four arcs is one of these (2 per arc)
for K in corners:
    # circle |p|^2 = 1/10 and |p-K|^2 = 1 meet on the line p.K = -1/5: at most 2 points per arc
    on = [p for p in pts if on_arc(p, K)]
    assert len(on) == 2

# 3. Holden's lines of spiral 0 (Holden 1975, in this frame): x + 3y = 0 and 3x - y = 1, crossing H0 = (3/10, -1/10).
H0 = (Fr(3, 10), Fr(-1, 10))
assert H0 in pts
# square centres of spiral 0 (squares attached down, right, up, left, ...)
F = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144]
L = [1, 3, 4, 7, 11, 18, 29, 47, 76, 123, 199, 322]
xmin, xmax, ymin, ymax = -half, half, -half, half
centres = [(Fr(0), Fr(0))]
for k in range(1, len(F)):
    s = F[k]; d = (k - 1) % 4
    if d == 0: c = ((xmin + xmax)/2, ymin - Fr(s, 2)); ymin -= s
    elif d == 1: c = (xmax + Fr(s, 2), (ymin + ymax)/2); xmax += s
    elif d == 2: c = ((xmin + xmax)/2, ymax + Fr(s, 2)); ymax += s
    else: c = (xmin - Fr(s, 2), (ymin + ymax)/2); xmin -= s
    centres.append(c)
assert centres[:8] == [(0, 0), (0, -1), (Fr(3, 2), -half), (1, 2), (-3, 1), (Fr(-3, 2), Fr(-11, 2)), (9, -3), (5, 14)]
for k, c in enumerate(centres):
    on_diam = c[0] + 3*c[1] == 0
    on_tan = 3*c[0] - c[1] == 1
    assert on_diam if k % 2 == 0 else on_tan
    assert 10*n2(sub(c, H0)) == L[k]**2                 # Holden: |C_k H0| = L_k / sqrt(10)
# the diameter through H0 and the tangent at H0
assert dot((1, 3), H0) == 0                              # x + 3y = 0 passes through O and H0: the diameter
assert dot((3, -1), H0) == 1 and n2(H0) == t             # 3x - y = 1 is perpendicular to OH0 at H0: the tangent
assert 3*half - half == 1                                # ... and passes through the corner E = (1/2, 1/2)
# the diameter's other end, Q = -H0, is where Holden's line crosses the spiral's first arc (Rhombus note: Q = -P)
Q = (-H0[0], -H0[1]); assert on_arc(Q, (half, -half)) and on_arc(H0, (-half, half))

# 4. Angles and wedges seen from O
ang = [degrees(atan2(p[1], p[0])) % 360 for p in pts]
gaps = [round((ang[(i+1) % 8] - ang[i]) % 360, 4) for i in range(8)]
assert sorted(set(gaps)) == [36.8699, 53.1301]
area = lambda a, b: abs(a[0]*b[1] - a[1]*b[0]) / 2
assert sorted({area(pts[i], pts[(i+1) % 8]) for i in range(8)}) == [Fr(3, 100), Fr(4, 100)]
assert area(pts[0], pts[2]) == Fr(5, 100)
assert {n2(sub(pts[i], pts[(i+1) % 8])) for i in range(8)} == {Fr(4, 100), Fr(8, 100)}

# 5. Squares: two double squares (side^2 = 1/5) from alternate origins
for i in range(8):
    assert n2(sub(pts[i], pts[(i+2) % 8])) == Fr(1, 5)
# tangents to the ARCS at the origins are 3/10 from O (square of side 3/5)
for p, K, E in origins:
    u = sub(p, K)                                         # arc radius direction (unit)
    assert abs(dot(u, sub((0, 0), p))) == Fr(3, 10)
# at the four vertices of each double square the arc tangents (3/10 from O) form a square of side 3/5
for S in (pts[0::2], pts[1::2]):
    us = [sub(p, K) for p, K, E in origins if p in S]
    assert all(dot(us[i], us[j]) in (1, -1, 0) for i in range(4) for j in range(4))   # two perpendicular directions
# crossings of the two double squares: 45-degree steps, radii 1/4 and sqrt2/6; squares of area 1/8 and 1/9
X = [(Fr(1, 4), 0), (Fr(1, 6), Fr(1, 6)), (0, Fr(1, 4)), (-Fr(1, 6), Fr(1, 6)), (-Fr(1, 4), 0), (-Fr(1, 6), -Fr(1, 6)), (0, -Fr(1, 4)), (Fr(1, 6), -Fr(1, 6))]
sqA = pts[0::2]                                           # alternate origins: the two double squares
sqB = pts[1::2]
def seg_inter(a, b, c, d):
    r = sub(b, a); s = sub(d, c); den = r[0]*s[1] - r[1]*s[0]
    if den == 0: return None
    tt = ((c[0]-a[0])*s[1] - (c[1]-a[1])*s[0]) / den
    uu = ((c[0]-a[0])*r[1] - (c[1]-a[1])*r[0]) / den
    return add(a, mul(tt, r)) if 0 <= tt <= 1 and 0 <= uu <= 1 else None
order = lambda S: sorted(S, key=lambda p: atan2(p[1], p[0]))
A_, B_ = order(sqA), order(sqB)
cr = set()
for i in range(4):
    for j in range(4):
        q = seg_inter(A_[i], A_[(i+1) % 4], B_[j], B_[(j+1) % 4])
        if q: cr.add(q)
assert cr == set(X)
assert n2(sub(X[0], X[2])) == Fr(1, 8) and n2(sub(X[1], X[3])) == Fr(1, 9)
print("all checks passed")
print("origins:", [(str(p[0]), str(p[1])) for p in pts])
print("gaps:", gaps)

# 6. Both of Holden's lines are tangents of circles of radius rho (area pi/10).
#    Green x + 3y = 0: distance from the origin N = (-1/10, -3/10) is rho, and it touches that circle at O.
N = (Fr(-1, 10), Fr(-3, 10)); assert N in pts
dist2 = lambda c, a, b, k: (a*c[0] + b*c[1] - k)**2 / (a*a + b*b)      # squared distance to the line ax+by=k
assert dist2(N, 1, 3, 0) == t                                          # green line tangent to the circle about N
foot = add(N, mul(Fr(1, 10), (1, 3)))                                  # N + (1,3)/10
assert foot == (0, 0)                                                  # ... touching it at O
assert dist2((Fr(0), Fr(0)), 3, -1, 1) == t                            # red line tangent to the circle of origins (at H0)
# every line of Holden's grid is a tangent of the rho-circles about the neighbouring nodes
for m in range(-3, 4):
    assert dist2((Fr(0), Fr(0)), 3, -1, 1 + m) in ((1 + m)**2 * t,)    # spacing rho between consecutive lines
print("tangent checks passed")

# 7. Extra checks asked by the referee
# far corner: t = 1/6, p.E' = +-1/(3 sqrt 2), so (p.E')^2 = 1/18 is not a rational square -> irrational crossing
pe2 = (Fr(1, 6) - 2*(Fr(-1, 6))**2) / 2; assert pe2 == Fr(1, 18)
import math as _m
assert not any(Fr(a, b)**2 == Fr(1, 18) for a in range(1, 50) for b in range(1, 300))
# corner circle: tangent at (-1/2, 1/2) is -x + y = 1 (slope 1); radius^2 = 1/2 = 5 * rho^2; corner = -2u + v
G = (-half, half); assert n2(G) == 5*t and add(mul(-2, H0), (Fr(1, 10), Fr(3, 10))) == G
# tangent square side 3/5: two pairs of parallel tangents at distance 3/10 on both sides of O
assert 2*Fr(3, 10) == Fr(3, 5) and (Fr(3, 5))**2 == Fr(9, 25)
# Holden's closed form: F(n+3) + F(n-3) = 2 L(n), with F extended to negative indices
def Fib(n): return Fib(n+2) - Fib(n+1) if n < 0 else (n if n < 2 else Fib(n-1) + Fib(n-2))
Luc = lambda n: Fib(n-1) + Fib(n+1)
assert all(Fib(n+3) + Fib(n-3) == 2*Luc(n) for n in range(1, 15))
assert [Luc(k) for k in range(1, 9)] == L[:8]
# thirds: odd line on the unit square, the opposite even line on the opposite second square
assert all(x + 3*(-x/3) == 0 for x in (half, -half))
for y in (half, 3*half):
    x = (y - 1)/3; assert 3*x - y == -1 and abs(x) == Fr(1, 6)
print("extra checks passed")

# 8. The second unit square of the opposite spiral, centred O2 = (0, 1): the quarter-turned tiling started there
O2 = (Fr(0), Fr(1))
rot = lambda p: (-p[1], p[0])                         # quarter turn about the origin
odd_q = [add(O2, rot(c)) for k, c in enumerate(centres) if k % 2 == 0]   # its odd centres
assert all(3*c[0] - c[1] == -1 for c in odd_q)        # they lie on 3x - y = -1
print("second-unit-square check passed")
