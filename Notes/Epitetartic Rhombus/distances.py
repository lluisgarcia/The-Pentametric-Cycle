"""Checks for Section 5 of 'The Epitetartic Rhombus' (version 2): distances from P, in Holden units h = sqrt(0.1)."""
from fractions import Fraction as Fr
import math
F = [0, 1]; L = [2, 1]
for _ in range(80): F.append(F[-1] + F[-2]); L.append(L[-1] + L[-2])
P = complex(0.1, 0.3); w = complex(-0.1, -0.3); h = math.sqrt(0.1)
C = lambda k: P + (1j) ** (k - 1) * L[k] * w
M = lambda k: C(k) + F[k] * (1j) ** (k - 1) * (1 + 1j) / 2
def point(t):                       # the spiral: square k = floor(t)+1, fraction f of its quarter turn
    k = int(t) + 1; f = t - int(t); a = math.pi * (1 + (k - 1) / 2) + f * math.pi / 2
    return M(k) + F[k] * complex(math.cos(a), math.sin(a))
d = lambda t: abs(point(t) - P) / h
# 1. joins: exact, with integers. A_j - P = i^(j-1) (L_j w + F_j (1-i)/2); |.|^2 / h^2 = (2F_j)^2 + (F_j + L_j)^2
for j in range(1, 40):
    re = Fr(-L[j], 10) + Fr(F[j], 2); im = Fr(-3 * L[j], 10) - Fr(F[j], 2)
    assert (re * re + im * im) * 10 == (2 * F[j]) ** 2 + (F[j] + L[j]) ** 2 == 4 * F[2 * j + 1] == (2 * F[j]) ** 2 + (2 * F[j + 1]) ** 2
print("joins: |PA_j| = 2 sqrt(F_(2j+1)) = hypot(2F_j, 2F_(j+1)) h, j = 1..39")
# 2. crossings at 2F_(k+1) h, at arctan(4/3) into the quarter turn
T = math.atan2(4, 3) / (math.pi / 2)
for k in range(1, 30): assert abs(d(k - 1 + T) - 2 * F[k + 1]) < 1e-6 * F[k + 1]
print("crossings at fraction", T, "(arctan(4/3) = 53.130 deg) of each quarter turn, k = 1..29")
# 3. minimum sqrt(10) - sqrt(2), then the distance only grows (dense sampling, squares 1..20)
ds = [d(i / 20000) for i in range(0, 20 * 20000)]
i0 = min(range(len(ds)), key=ds.__getitem__)
print("minimum", ds[i0], "at t =", i0 / 20000, " sqrt(10)-sqrt(2) =", math.sqrt(10) - math.sqrt(2))
assert all(ds[i + 1] > ds[i] for i in range(i0, len(ds) - 1)); print("strictly increasing after the minimum, squares 1..20 (sampled)")
# 4. the inner corner of square n (pentagon picture): miss n - sqrt(n^2 + 4 chi); 2 psi^k at Lucas numbers
chi = lambda n: 0 if n % 5 == 0 else (1 if n % 5 in (1, 4) else -1)
Pn = lambda n: (n * n + 4 * chi(n)) // 5
psi = (1 - math.sqrt(5)) / 2
for n in range(1, 2000): assert Pn(n) * 5 == n * n + 4 * chi(n)
for k in range(1, 40):
    n = L[k]; assert n * n + 4 * chi(n) == 5 * F[k] ** 2         # exact: so the miss is L_k - sqrt(5) F_k = 2 psi^k
    assert abs((n - math.sqrt(5) * F[k]) - 2 * psi ** k) < 1e-9 * max(1, n)
print("inner-corner miss at L_k = 2 psi^k, k = 1..39 (via L_k^2 + 4 chi(L_k) = 5 F_k^2)")
