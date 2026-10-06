import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Polygon, Circle
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
    return [(x-0.5,y-0.5,s) for x,y,s in sq]  # centre of first square at origin
P=np.array([0.1,0.3])
# Figure 1
N=8;sq=spiral(N)
fig,ax=plt.subplots(figsize=(6.2,5.6))
for k,(x,y,s) in enumerate(sq):
    ax.add_patch(Rectangle((x,y),s,s,fill=False,lw=0.9,ec=INK))
    c=np.array([x+s/2,y+s/2]); col=A if k%2==0 else B
    ax.plot(*c,'o',ms=3.5,color=col,zorder=5)
    if k>=3:
        ax.text(c[0]+0.4,c[1]+0.4,rf"$C_{{{k+1}}}$",fontsize=11,color=col)
xs=np.linspace(-16,14,10)
ax.plot(xs,3*xs,'--',color=A,lw=0.9,label=r"$y=3x$ (odd $k$)")
ax.plot(xs,(1-xs)/3,'--',color=B,lw=0.9,label=r"$x+3y=1$ (even $k$)")
ax.plot(*P,'k*',ms=9,zorder=6); ax.annotate(r"$P=(\frac{1}{10},\frac{3}{10})$",P,xytext=(-11,8.5),fontsize=11,arrowprops=dict(arrowstyle="->",lw=0.7,color=INK,shrinkB=4))
for k in [5,6,7]:
    x,y,s=sq[k-1];c=np.array([x+s/2,y+s/2])
    ax.plot([P[0],c[0]],[P[1],c[1]],color=G,lw=1.0,ls=(0,(1,1.5)))
xm=[min(x for x,y,s in sq),max(x+s for x,y,s in sq)];ym=[min(y for x,y,s in sq),max(y+s for x,y,s in sq)]
ax.set_xlim(xm[0]-0.5,xm[1]+0.5);ax.set_ylim(ym[0]-0.5,ym[1]+0.5);ax.set_aspect('equal')
ax.legend(loc="lower right",fontsize=10,frameon=True,framealpha=1,edgecolor="none");ax.axis('off')
fig.tight_layout();fig.savefig("fig1_spiral.pdf",bbox_inches="tight",pad_inches=0.05);plt.close(fig)
# Figure 2: two panels k=4 (even) and k=5 (odd)
fig,axs=plt.subplots(1,2,figsize=(6.6,3.5))
for ax,k in zip(axs,[4,5]):
    sq=spiral(k);x,y,s=sq[k-1];c=np.array([x+s/2,y+s/2])
    ax.add_patch(Rectangle((x,y),s,s,fill=True,fc="#e9eef4",ec=A,lw=1.1))
    v=P-c;r=np.hypot(*v)
    pts=[c+np.array([[np.cos(t),-np.sin(t)],[np.sin(t),np.cos(t)]])@v for t in np.arange(4)*np.pi/2]
    ax.add_patch(Polygon(pts,closed=True,fill=False,ec=B,lw=1.1))
    ax.add_patch(Circle(c,r,fill=False,ec=B,lw=0.6,ls=':'))
    ax.add_patch(Circle(c,s/np.sqrt(2),fill=False,ec=A,lw=0.6,ls=':'))
    ax.plot(*P,'k*',ms=8);ax.plot(*c,'o',color=INK,ms=3)
    ax.plot([c[0],P[0]],[c[1],P[1]],color=G,lw=0.6)
    sgn="+" if k%2==0 else "-"
    ax.set_title(rf"$k={k}$:  $F_{k}^2={F[k-1]**2}$,  $L_{k}^2/5={L[k-1]**2}/5=F_{k}^2{sgn}\frac{{4}}{{5}}$",fontsize=9)
    R=max(r,s/np.sqrt(2))+0.4
    ax.set_xlim(c[0]-R,c[0]+R);ax.set_ylim(c[1]-R,c[1]+R);ax.set_aspect('equal');ax.axis('off')
fig.tight_layout();fig.savefig("fig2_area.pdf",bbox_inches="tight",pad_inches=0.05);plt.close(fig)
# Figure 3: H(n)
def chi(n): return 0 if n%5==0 else (1 if n%5 in(1,4) else -1)
H=[((n*n+4*chi(n))//5)%5 for n in range(51)]
cols={0:"#d9d9d9",1:"#4f7cac",2:"#2b5d8a",3:"#b4532a",4:"#d99a5b"}
fig,ax=plt.subplots(figsize=(6.6,1.6))
for n,h in enumerate(H):
    ax.add_patch(Rectangle((n,0),0.92,1,fc=cols[h],ec='none'))
    ax.text(n+0.46,0.5,str(h),ha='center',va='center',fontsize=6.5,color="white" if h in (2,3) else INK)
for n in [0,12.5,25,37.5,50]:
    ax.axvline(n+0.46,ymin=-0.15,ymax=1.15,color=INK,lw=0.8 if n in (0,25,50) else 0.5,ls='-' if n in (0,25,50) else ':',clip_on=False)
for n in range(0,51,5): ax.text(n+0.46,-0.35,str(n),ha='center',fontsize=7)
ax.text(25.46,1.3,"Axis $n=25$",ha='center',fontsize=7.5)
ax.text(12.96,1.3,"centre (12,13)",ha='center',fontsize=7)
ax.text(37.96,1.3,"centre (37,38)",ha='center',fontsize=7)
ax.set_xlim(-0.5,51.5);ax.set_ylim(-0.6,1.6);ax.axis('off')
fig.tight_layout();fig.savefig("fig3_palindrome.pdf",bbox_inches="tight",pad_inches=0.05);plt.close(fig)
print("ok")
