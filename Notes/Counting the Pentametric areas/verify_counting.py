"""Exact checks for 'Counting the Pentametric areas from an empty square' (MIT licence)."""
from fractions import Fraction as Fr
def leg(n): r = n % 5; return 0 if r == 0 else (1 if r in (1, 4) else -1)
def P(n): return Fr(n*n + 4*leg(n), 5)
F, L = [0, 1], [2, 1]
for _ in range(80): F.append(F[-1] + F[-2]); L.append(L[-1] + L[-2])
h = Fr(1, 2)
# Prop 1: corner-to-midpoint lines meet at (-1/10, -3/10)
x = Fr(-1, 10); assert x/2 - Fr(1, 4) == -2*x - h == Fr(-3, 10)
# Prop 2: cells and the breath as the blue square of 2
for n in range(0, 2000):
    assert P(n).denominator == 1 and 10*P(n) == 2*n*n + 8*leg(n)
    assert P(n) == Fr(n*n, 5) + leg(n)*Fr(4, 5)
# Prop 3: thirds
for k in range(1, 60):
    lo, hi = 3*L[k] - 5*F[k], 3*L[k] + 5*F[k]
    assert (lo, hi) == (2*L[k-2] if k >= 2 else -2, 2*L[k+2])
# Theorem 4 and corollaries
z = (Fr(3, 10), Fr(-1, 10)); turn = {1: 0, 3: 1, 4: 2, 2: 3}   # z = H, turns counted clockwise
def rot(v, t):
    for _ in range(t): v = (v[1], -v[0])
    return v
for n in range(1, 6000):
    X = (n*z[0], n*z[1]); s = Fr(0) if n % 2 else h
    c = (round(X[0] - s) + s, round(X[1] - s) + s); d = (X[0] - c[0], X[1] - c[1])
    if n % 5 == 0:
        assert abs(d[0]) == h and abs(d[1]) == h
    else:
        assert d == rot(z, turn[n % 5])
        dot = d[0]*z[0] + d[1]*z[1]; crs = d[0]*z[1] - d[1]*z[0]
        assert 100*(dot*dot - crs*crs) == leg(n)
for k in range(1, 80):
    assert L[k] % 5 != 0 and turn[L[k] % 5] == (k - 1) % 4
# Prop 7: mirror squares
H = (Fr(3, 10), Fr(-1, 10)); pts = [(Fr(1, 10), Fr(3, 10)), (Fr(7, 10), Fr(1, 10)), (h, -h), (Fr(-1, 10), Fr(-3, 10))]
assert all((p[0]-H[0])**2 + (p[1]-H[1])**2 == Fr(1, 5) for p in pts)
assert all((pts[i][0]-pts[i-1][0])**2 + (pts[i][1]-pts[i-1][1])**2 == Fr(2, 5) for i in range(4))
# odd line x + 3y = 0 tangent to the circle about (1,0), radius rho, at (9/10, -3/10)
foot = (Fr(9, 10), Fr(-3, 10)); assert foot[0] + 3*foot[1] == 0 and (foot[0]-1)**2 + foot[1]**2 == Fr(1, 10)
print("all checks passed")
