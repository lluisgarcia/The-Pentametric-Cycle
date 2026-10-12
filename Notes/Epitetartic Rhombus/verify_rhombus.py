"""Exact checks for the note 'The Epitetartic Rhombus' (Gardiner's coordinates)."""
from fractions import Fraction as F
P = (F(1,10), F(3,10))
M = (F(1,2), F(1,2))                       # centre of the arc of square 1
# 1. the arc meets Holden's line y = 3x
# (x - 1/2)^2 + (3x - 1/2)^2 - 1 = 10x^2 - 4x - 1/2 = (1/2)(2x - 1)(10x + 1)
for t in [F(k, 7) for k in range(-9, 9)]:
    assert (t-F(1,2))**2 + (3*t-F(1,2))**2 - 1 == F(1,2)*(2*t-1)*(10*t+1)
print('factorisation (1/2)(2x - 1)(10x + 1) checked')
Q = (F(-1,10), F(-3,10)); C3 = (F(1,2), F(3,2))
for p in (Q, C3): assert (p[0]-M[0])**2 + (p[1]-M[1])**2 == 1 and p[1] == 3*p[0]
assert Q == (-P[0], -P[1])
print('Q - M =', (Q[0]-M[0], Q[1]-M[1]))
# lattice nodes: 3x - y and x + 3y integers
node = lambda p: (3*p[0]-p[1]).denominator == 1 and (p[0]+3*p[1]).denominator == 1
print('nodes P,Q,M,C3:', [node(p) for p in (P, Q, M, C3)])
print('|PQ|^2 =', (P[0]-Q[0])**2 + (P[1]-Q[1])**2)
# 2. the rhombus of the arc
R = [(F(-1,2), F(1,2)), (F(1,2), F(-3,10)), (F(3,2), F(1,2)), (F(1,2), F(13,10))]
d1 = R[2][0]-R[0][0]; d2 = R[3][1]-R[1][1]; print('diagonals', d1, d2, 'ratio', d1/d2, 'area', d1*d2/2)
# as the square construction in Holden's grid square of side 6*sqrt(0.1), centre M, sides along (3,-1) and (1,3)
u = (F(3,10)*2, F(-1,10)*2); v = (F(1,10)*2, F(3,10)*2)        # 2 lattice steps... side = 6 steps of sqrt(0.1)
s = 3                                                          # side vectors are s*u, s*v  (|u| = 2*sqrt(0.1))
A = (M[0] - s*(u[0]+v[0])/2, M[1] - s*(u[1]+v[1])/2)
def at(a, b): return (A[0] + s*(a*u[0] + b*v[0]), A[1] + s*(a*u[1] + b*v[1]))
for a, b in [(0,F(1,3)), (F(11,30),F(9,10)), (1,F(2,3)), (F(19,30),F(1,10))]:
    print('square coords', (a, b), '->', at(a, b))
# 3. the square construction, unit square
L1, L2, S1, S2 = (F(0),F(1,3)), (F(1),F(2,3)), (F(11,30),F(9,10)), (F(19,30),F(1,10))
dl = (L2[0]-L1[0], L2[1]-L1[1]); ds = (S2[0]-S1[0], S2[1]-S1[1])
assert dl[0]*ds[0] + dl[1]*ds[1] == 0
assert ((L1[0]+L2[0])/2, (L1[1]+L2[1])/2) == ((S1[0]+S2[0])/2, (S1[1]+S2[1])/2) == (F(1,2), F(1,2))
r2 = (ds[0]**2+ds[1]**2)/(dl[0]**2+dl[1]**2); print('length ratio^2', r2, '|long|^2', dl[0]**2+dl[1]**2, 'area', (dl[0]**2+dl[1]**2)*F(4,5)/2)
# ruler: line through (1/6,1),(1/2,5/6),(5/6,2/3) meets the line through (1/3,1),(2/3,0)
# 1 - (X - 1/6)/2 = 1 - 3(X - 1/3)  ->  X - 1/6 = 6X - 2  ->  X = 11/30
X = F(11,30); Y = 1 - (X - F(1,6))/2; assert Y == 1 - 3*(X - F(1,3)); print('ruler corner', X, Y)
assert 1 - (F(1,2) - F(1,6))/2 == F(5,6) and 1 - (F(5,6) - F(1,6))/2 == F(2,3)
# 4. halving vs threes and fives
xq, yq = F(11,30), F(9,10); seq = []
for k in range(14):
    xq *= 2; yq *= 2; bx, by = int(xq), int(yq); xq -= bx; yq -= by; seq.append({(0,0):'BL',(1,0):'BR',(0,1):'TL',(1,1):'TR'}[(bx,by)])
print(seq)
for N in range(1, 61):
    gx, gy = F(11,30)*N, F(9,10)*N
    if gx.denominator == 1 and gy.denominator == 1: print('first corner grid', N); break
for N in range(1, 61):
    gx, gy = F(11,30)*N*2, F(9,10)*N*2
    if gx.denominator == 1 and gy.denominator == 1 and gx % 2 == 1 and gy % 2 == 1: print('first centre grid', N); break
