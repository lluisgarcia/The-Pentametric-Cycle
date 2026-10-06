from fractions import Fraction as Fr
from math import isqrt
def C(m): return Fr(26*m-5*m*m,24)
def P(n):
    m=(4*n*n)%10
    v=(n*n+4*C(m))/5
    return v,m
def leg(n):
    r=n%5
    return 0 if r==0 else (1 if r in(1,4) else -1)
ms=set()
for n in range(0,10000):
    v,m=P(n); ms.add(m)
    assert v.denominator==1
    assert v==Fr(n*n+4*leg(n),5)
print("m values attained:",sorted(ms))
for m in range(0,10,2): print(m,C(m))
H=[int(P(n)[0])%5 for n in range(51)]
print("H0..24",H[:25])
given=[0,1,0,1,4,0,3,4,2,2,0,0,3,3,0,0,2,2,4,3,0,4,1,0,1]
print("matches given:",H[:25]==given)
print("0..24 palindrome:",H[:25]==H[:25][::-1])
print("1..24 palindrome:",H[1:25]==H[1:25][::-1])
print("0..25 palindrome:",H[:26]==H[:26][::-1])
print("0..50 palindrome:",H==H[::-1])
from collections import Counter
print("counts 0..24",Counter(H[:25]))
print("counts 0..50",Counter(H))
# period
Hs=[int(P(n)[0])%5 for n in range(500)]
for p in range(1,30):
    if all(Hs[i]==Hs[i+p] for i in range(400)): print("min period",p);break
# Lucas
L=[2,1];F=[0,1]
for k in range(60): L.append(L[-1]+L[-2]); F.append(F[-1]+F[-2])
for k in range(60): assert P(L[k])[0]==F[k]**2
print("Lucas thm ok k=0..59")
sq=[n for n in range(1,200000) if isqrt(int(P(n)[0]))**2==int(P(n)[0])]
print("n with P(n) square:",sq)
print([ (L[k],int(P(L[k])[0])) for k in range(14)])
