"""Where Holden's lines cross the spiral arc in each Fibonacci square (Gardiner's coordinates, exact)."""
from fractions import Fraction as Fr
from math import isqrt
Fib=[0,1]; Luc=[2,1]
for _ in range(40): Fib.append(Fib[-1]+Fib[-2]); Luc.append(Luc[-1]+Luc[-2])
P=(Fr(1,10),Fr(3,10))
def centre(k):
    z=complex(-1,-3)*Luc[k]*(1j)**(k-1)  # times 1/10
    return (P[0]+Fr(int(round(z.real)),10), P[1]+Fr(int(round(z.imag)),10))
def corners(k):
    c=centre(k); h=Fr(Fib[k],2); return [(c[0]+a*h,c[1]+b*h) for a,b in((-1,-1),(1,-1),(1,1),(-1,1))]
d2=lambda p,q:(p[0]-q[0])**2+(p[1]-q[1])**2
A=[(Fr(-1,2),Fr(1,2))]
for j in range(1,30):
    A.append(next(c for c in corners(j) if d2(c,A[j-1])==2*Fib[j]**2))
def arc(j):
    rem=[c for c in corners(j) if c!=A[j-1] and c!=A[j]]
    return min(rem,key=lambda c:d2(c,P))
def rsqrt(q):  # exact rational sqrt or None
    n,d=q.numerator,q.denominator; a,b=isqrt(n),isqrt(d); return Fr(a,b) if a*a==n and b*b==d else None
for j in range(1,16):
    M=arc(j); R=Fib[j]; cs=corners(j); xs=[c[0] for c in cs]; ys=[c[1] for c in cs]
    out=[]
    for name,u in (("y=3x",(Fr(1,10),Fr(3,10))),("x+3y=1",(Fr(3,10),Fr(-1,10)))):
        # P + s u on circle: |P - M + s u|^2 = R^2 ; |u|^2 = 1/10
        a=Fr(1,10); bx=P[0]-M[0]; by=P[1]-M[1]; b=2*(bx*u[0]+by*u[1]); c=bx*bx+by*by-R*R
        disc=b*b-4*a*c; r=rsqrt(disc)
        if r is None: out.append(f"{name}: irrational"); continue
        for s in {(-b+r)/(2*a),(-b-r)/(2*a)}:
            p=(P[0]+s*u[0],P[1]+s*u[1])
            inside=min(xs)<=p[0]<=max(xs) and min(ys)<=p[1]<=max(ys)
            if inside: out.append(f"{name}: s={s} steps of √0.1 from P, point ({p[0]},{p[1]})")
    print(j,'F=',R,'L=',Luc[j],'|',' ; '.join(out))

# check every square up to 28: exactly one crossing on the arc, a grid node, at 2*F_{k+1} steps = L_k + F_k
import math
ok=True
for j in range(1,29):
    M=arc(j); R=Fib[j]; hits=[]
    for u in ((Fr(1,10),Fr(3,10)),(Fr(3,10),Fr(-1,10))):
        a=0.1; bx=float(P[0]-M[0]); by=float(P[1]-M[1]); b=2*(bx*float(u[0])+by*float(u[1])); c=bx*bx+by*by-R*R
        dd=b*b-4*a*c
        if dd<0: continue
        for s in ((-b+math.sqrt(dd))/(2*a),(-b-math.sqrt(dd))/(2*a)):
            p=(float(P[0])+s*float(u[0]),float(P[1])+s*float(u[1]))
            # on the arc = inside the square (quarter circle lies in the square)
            cs=corners(j); xs=[float(q[0]) for q in cs]; ys=[float(q[1]) for q in cs]
            if min(xs)-1e-9<=p[0]<=max(xs)+1e-9 and min(ys)-1e-9<=p[1]<=max(ys)+1e-9: hits.append(round(abs(s),9))
    hits=sorted(set(hits))
    want=2*Fib[j+1]
    good = (hits==[want]) or (j==1 and hits==[2.0])
    ok&=good
    if not good: print('square',j,hits,want)
print('all squares 1..28 one crossing at 2F_{k+1} steps:', ok)

# the arc centre is M_k = C_k + F_k i^(k-1) (1+i)/2, and X_k - M_k = F_k i^(k-1) (-3/5 - 4/5 i)
def mul_i(p, n):
    x, y = p
    for _ in range(n % 4): x, y = -y, x
    return (x, y)
allok = True
for j in range(1, 29):
    c = centre(j); v = mul_i((Fr(Fib[j], 2), Fr(Fib[j], 2)), j - 1)
    allok &= arc(j) == (c[0] + v[0], c[1] + v[1])
    wv = mul_i((Fr(-1, 10) * 2 * Fib[j + 1], Fr(-3, 10) * 2 * Fib[j + 1]), j - 1); X = (P[0] + wv[0], P[1] + wv[1])
    t = mul_i((Fr(-3, 5) * Fib[j], Fr(-4, 5) * Fib[j]), j - 1)
    allok &= (X[0] - arc(j)[0], X[1] - arc(j)[1]) == t
print('arc-centre formula and 3-4-5 crossing hold for squares 1..28:', allok)
