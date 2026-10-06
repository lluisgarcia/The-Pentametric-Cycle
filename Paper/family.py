from fractions import Fraction as Fr
import math, cmath
def leg(n): r=n%5; return 0 if r==0 else (1 if r in (1,4) else -1)
def P(n): return Fr(n*n+4*leg(n),5)
def xround(x): return math.floor(x+0.5)  # Excel ROUND for positives
phi=(1+5**.5)/2; K=phi*math.sin(2*math.pi/5)
bad=[]
C,D=1.0,0.0
for n in range(0,3000):
    p=P(n); s=math.sqrt(p)
    m=(4*n*n)%10; d=(2*n*n)%10; r=(n*n)%10; x=r-5
    forms={}
    forms['A1']=Fr(n*n+4*Fr(26*m-5*m*m,24),5)
    forms['A3']=(n*n+(8/5**.5)*(math.cos(2*math.pi*n/5)-math.cos(4*math.pi*n/5)))/5
    B=phi**n if n<600 else None
    if n<60:
        z=(phi*cmath.exp(2j*math.pi/5))**n
        forms['A4']=(n*n+8/5**.5*(z.real/phi**n-(z*z).real/phi**(2*n)))/5
        # recurrence as in sheet
        forms['A4rec']=(n*n+8/5**.5*(C/phi**n-(C*C-D*D)/phi**(2*n)))/5
    ang=(72*n)%360
    c=4*(ang==72)-4*(ang==144)-4*(ang==216)+4*(ang==288)
    forms['A5']=Fr(n*n+c,5)
    pd=Fr(-d*d,12)+Fr(17*d,30)
    forms['A6']=Fr(n*n,5)+pd
    forms['A7']=Fr(2*n*n-d,10)+Fr(d*(8-d),12)
    forms['A7r']=(2*n*n-d)//10+(xround(1/d) if d else 0)
    forms['A9']=Fr(n*n+4*Fr(x**5-35*x**3+250*x,216),5)
    forms['A10']=Fr(n*n+4*Fr(5,4)*pd,5)
    Bq=2*n*0.2**.5; Cq=3.2*leg(n)
    disc=Bq*Bq+Cq
    forms['A11']=(n*0.2**.5+(-Bq+math.sqrt(disc))/2)**2 if disc>=0 else None
    forms['circle']=(math.pi*float(p)/2-math.pi*n*n/10)-2*math.pi/5*leg(n)
    for k,v in forms.items():
        if v is None: bad.append((n,k,'none')); continue
        tgt=0 if k=='circle' else p
        if abs(float(v)-float(tgt))>1e-6*max(1,float(p)): bad.append((n,k,float(v)))
    C,D=0.5*C-K*D, K*C+0.5*D
print("failures:",bad[:20],len(bad))
