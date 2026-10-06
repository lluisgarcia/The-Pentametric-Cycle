import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Wedge
import numpy as np
plt.rcParams.update({"font.family":"serif","font.serif":["Latin Modern Roman","DejaVu Serif"],"mathtext.fontset":"cm","font.size":10})
INK="#1f1f1f"; A="#2b5d8a"; B="#b4532a"; G="#8a8a8a"
F=[1,1];L=[1,3]
for _ in range(12): F.append(F[-1]+F[-2]); L.append(L[-1]+L[-2])
def spiral(N):
    sq=[(0,0,1)];xmin=ymin=0;xmax=ymax=1
    for i,s in enumerate(F[1:N]):
        d=i%4
        x0,y0={0:(xmax,ymin),1:(xmin,ymax),2:(xmin-s,ymin),3:(xmin,ymin-s)}[d]
        sq.append((x0,y0,s));xmin=min(xmin,x0);ymin=min(ymin,y0);xmax=max(xmax,x0+s);ymax=max(ymax,y0+s)
    return [(x-0.5,y-0.5,s) for x,y,s in sq]
P=np.array([0.1,0.3])
fig,(ax1,ax2)=plt.subplots(1,2,figsize=(7.0,3.3),gridspec_kw={"width_ratios":[1.25,1]})
# left: spiral + circles through P? show centres, lines, a few Lucas circles
sq=spiral(7)
for k,(x,y,s) in enumerate(sq):
    ax1.add_patch(Rectangle((x,y),s,s,fill=False,lw=0.8,ec=INK))
    c=np.array([x+s/2,y+s/2]); col=A if k%2==0 else B
    ax1.plot(*c,'o',ms=3,color=col,zorder=5)
    if k in (4,5):
        ax1.add_patch(plt.Circle(P,L[k]/np.sqrt(10),fill=False,lw=0.6,ls=':',ec=col))
    if k>=4:
        ax1.text(c[0]+0.35,c[1]+0.35,rf"$L_{{{k+1}}}={L[k]}$",fontsize=8.5,color=col,bbox=dict(fc='white',ec='none',pad=0.5))
xs=np.linspace(-12,10,10)
ax1.plot(xs,3*xs,'--',color=A,lw=0.8); ax1.plot(xs,(1-xs)/3,'--',color=B,lw=0.8)
ax1.plot(*P,'k*',ms=7,zorder=6)
xm=[min(x for x,y,s in sq),max(x+s for x,y,s in sq)];ym=[min(y for x,y,s in sq),max(y+s for x,y,s in sq)]
ax1.set_xlim(xm[0]-0.3,xm[1]+0.3);ax1.set_ylim(ym[0]-0.3,ym[1]+0.3);ax1.set_aspect('equal');ax1.axis('off')
ax1.set_title(r"$|C_kP|=L_k\sqrt{0.1}$,   $\mathfrak{P}(L_k)=F_k^2$",fontsize=10)
# right: ring of H(n), n=0..49
def chi(n): return 0 if n%5==0 else (1 if n%5 in(1,4) else -1)
H=[((n*n+4*chi(n))//5)%5 for n in range(50)]
cols={0:"#e3e3e3",1:"#4f7cac",2:"#2b5d8a",3:"#b4532a",4:"#d99a5b"}
N=50
for n,h in enumerate(H):
    a0=90-360*(n+0.5)/N; a1=90-360*(n-0.5)/N
    ax2.add_patch(Wedge((0,0),1.0,a0,a1,width=0.32,fc=cols[h],ec="white",lw=0.6))
    t=np.radians(90-360*n/N)
    if n%5==0: ax2.text(1.13*np.cos(t),1.13*np.sin(t),str(n),ha='center',va='center',fontsize=7,color=INK)
ax2.plot([0,0],[1.08,-1.08],color=INK,lw=0.9)

ax2.text(0,0.08,r"$H(n)=\mathfrak{P}(n)\ \mathrm{mod}\ 5$",fontsize=8.5,ha='center',bbox=dict(fc='white',ec='none',pad=1.5))
ax2.text(0,-0.18,"mirror axis $n=0\\leftrightarrow 25$",fontsize=7.5,ha='center',bbox=dict(fc='white',ec='none',pad=1.0))
for lab,h in [("silence",0),("unison",1),("octave",2),("fifth",3),("fourth",4)]:
    pass
hs=[plt.Rectangle((0,0),1,1,fc=cols[h]) for h in range(5)]
ax2.legend(hs,["silence","unison 1:1","octave 2:1","fifth 3:2","fourth 4:3"],loc="lower center",bbox_to_anchor=(0.5,-0.2),ncol=3,fontsize=7,frameon=False,handlelength=1)
ax2.set_xlim(-1.25,1.25);ax2.set_ylim(-1.25,1.25);ax2.set_aspect('equal');ax2.axis('off')
ax2.set_title("The Pentametric Palindrome",fontsize=10)
fig.tight_layout();fig.savefig("fig0_abstract.pdf",bbox_inches="tight",pad_inches=0.03)
fig.savefig("fig0_abstract.png",dpi=110,bbox_inches="tight")
