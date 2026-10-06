from fractions import Fraction as Fr
import math
# build counterclockwise spiral: squares appended right, up, left, down
F=[1,1]
for _ in range(14): F.append(F[-1]+F[-2])
sq=[(Fr(0),Fr(0),1)]  # (x0,y0,side) lower-left
xmin,ymin,xmax,ymax=Fr(0),Fr(0),Fr(1),Fr(1)
dirs=['R','U','L','D']
for i,s in enumerate(F[1:]):
    d=dirs[i%4]
    if d=='R': x0,y0=xmax,ymin
    if d=='U': x0,y0=xmin,ymax
    if d=='L': x0,y0=xmin-s,ymin
    if d=='D': x0,y0=xmin,ymin-s
    sq.append((x0,y0,s))
    xmin=min(xmin,x0);ymin=min(ymin,y0);xmax=max(xmax,x0+s);ymax=max(ymax,y0+s)
cent=[(x0+Fr(s,2),y0+Fr(s,2)) for x0,y0,s in sq]
c0=cent[0]
rel=[(x-c0[0],y-c0[1]) for x,y in cent]
# find intersection of line through centers 1,3,5 and 2,4,6 (indices 0,2,4 / 1,3,5)
def line(p,q):
    a=q[1]-p[1]; b=p[0]-q[0]; c=a*p[0]+b*p[1]; return a,b,c
def inter(l1,l2):
    a1,b1,c1=l1;a2,b2,c2=l2;det=a1*b2-a2*b1
    return ((c1*b2-c2*b1)/det,(a1*c2-a2*c1)/det)
O=inter(line(rel[0],rel[2]),line(rel[1],rel[3]))
print("origin rel to centre of first square",O)
L=[2,1]
for _ in range(20): L.append(L[-1]+L[-2])
for k,(x,y) in enumerate(rel[:12]):
    d2=(x-O[0])**2+(y-O[1])**2
    # check collinearity
    print(k+1,"F=",F[k],"centre",(x,y),"d^2*10=",d2*10, "L_k^2=",L[k+1]**2, "sqrt",math.isqrt(int(d2*10)))
# collinearity check all
odd=[rel[i] for i in range(0,16,2)]; even=[rel[i] for i in range(1,16,2)]
def col(pts):
    l=line(pts[0],pts[1]); return all(l[0]*p[0]+l[1]*p[1]==l[2] for p in pts)
print("odd collinear",col(odd),"even collinear",col(even))
l1=line(odd[0],odd[1]); l2=line(even[0],even[1])
print("perp", l1[0]*l2[0]+l1[1]*l2[1]==0, l1,l2)
# complex closed form check
w=complex(-0.1,-0.3)
ok=True
for k,(x,y) in enumerate(rel):
    z=complex(float(x-O[0]),float(y-O[1]))
    pred=(1j)**k*L[k+1]*w
    if abs(z-pred)>1e-6*abs(pred): ok=False;print("fail",k+1,z,pred)
print("complex closed form ok for k=1..",len(rel),ok)
