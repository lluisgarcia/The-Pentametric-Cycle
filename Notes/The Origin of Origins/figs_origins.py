"""Figures for the note 'The Origin of Origins' (MIT licence). Frame: unit square centred at O."""
import math
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon, Arc, Rectangle, Circle

plt.rcParams.update({"font.family": "serif", "font.size": 10, "mathtext.fontset": "cm"})
GOLD, BLUE, RED, GREEN, INK, GREY, PINK, YEL = "#c98a2b", "#2c5f8a", "#b5462a", "#2e7d4f", "#222222", "#9a9a9a", "#c2407a", "#d4a514"
r = math.sqrt(0.1)
# diagonal arcs: centre corner -> (colour, theta range seen from the centre)
ARCS = {(0.5, -0.5): (BLUE, 90, 180), (-0.5, -0.5): (RED, 0, 90), (0.5, 0.5): (PINK, 180, 270), (-0.5, 0.5): (YEL, 270, 360)}
ORIG = [(a * s, b * u) for a, b in ((0.3, 0.1), (0.1, 0.3)) for s in (1, -1) for u in (1, -1)]

def base(ax, lim=0.78, grid=True):
    if grid:
        for m in range(-8, 9):
            xs = [-1.5, 1.5]
            ax.plot(xs, [3 * x - 1 - m for x in xs], color=GREY, lw=0.3, alpha=0.35)
            ax.plot(xs, [(m - x) / 3 for x in xs], color=GREY, lw=0.3, alpha=0.35)
    ax.add_patch(Rectangle((-0.5, -0.5), 1, 1, fill=False, ec=INK, lw=0.9))
    for (cx, cy), (col, t1, t2) in ARCS.items():
        ax.add_patch(Arc((cx, cy), 2, 2, theta1=t1, theta2=t2, color=col, lw=1.8))
    ax.set_xlim(-lim, lim); ax.set_ylim(-lim, lim); ax.set_aspect("equal"); ax.axis("off")

# ---------- figure 1: the circle of origins, the eight origins, tangent and diameter at H0 ----------
fig, ax = plt.subplots(figsize=(5.4, 5.4))
base(ax)
ax.add_patch(Circle((0, 0), r, fill=False, ec=INK, lw=1.3))
ax.add_patch(Circle((-0.1, -0.3), r, fill=False, ec=GREEN, lw=1.1, ls=(0, (3, 2))))
ax.plot(-0.1, -0.3, "o", ms=4.5, color=GREEN)
xs = [-0.78, 0.78]
ax.plot(xs, [-x / 3 for x in xs], color=GREEN, lw=1.6)          # tangent x + 3y = 0 of the circle about N
xs = [0.05, 0.75]
ax.plot(xs, [3 * x - 1 for x in xs], color="#6b1d1d", lw=1.8)   # even line 3x - y = 1 (dark red)
for p in ORIG: ax.plot(*p, "o", ms=4.5, color=INK)
ax.plot(0, 0, "o", ms=5, mfc="white", mec=INK)
lab = {"$O$": (0, 0, -0.1, -0.07), "$H_0$": (0.3, -0.1, 0.035, -0.07), "$Q=-H_0$": (-0.3, 0.1, 0.02, 0.06), "$E$": (0.5, 0.5, 0.03, 0.03), "$N$": (-0.1, -0.3, -0.09, -0.06)}
for t, (x, y, dx, dy) in lab.items(): ax.text(x + dx, y + dy, t, fontsize=10, bbox=dict(fc="white", ec="none", pad=0.6, alpha=0.85))
ax.plot(0.5, 0.5, "o", ms=4.5, color=RED)
fig.savefig("fig1_origins.pdf", bbox_inches="tight"); plt.close(fig)

# ---------- figure 2: uniqueness ----------
K = (-0.5, 0.5)                                    # arc through H0, ends E = (1/2,1/2) and (-1/2,-1/2)
Kh = (K[0] / math.sqrt(0.5), K[1] / math.sqrt(0.5)); Dh = (1 / math.sqrt(2), 1 / math.sqrt(2))
fig, ax = plt.subplots(figsize=(5.4, 5.4))
base(ax, grid=False)
for t, col, lw in (((1 - math.sqrt(2) / 2) ** 2, GREY, 0.9), (0.1, INK, 1.6), (0.16, GREY, 0.9), (0.25, GREY, 0.9)):
    rr = math.sqrt(t)
    a = (t - 0.5) / 2 / math.sqrt(0.5)             # component of p along K-hat
    b = math.sqrt(max(t - a * a, 0))               # component along the diagonal (1,1)
    p = (a * Kh[0] + b * Dh[0], a * Kh[1] + b * Dh[1])
    ax.add_patch(Circle((0, 0), rr, fill=False, ec=col, lw=lw, ls="-" if abs(t - 0.1) < 1e-12 else (0, (3, 2))))
    d = (-p[1], p[0]); n = math.hypot(*d); d = (d[0] / n, d[1] / n)
    ax.plot([p[0] - 0.45 * d[0], p[0] + 0.75 * d[0]], [p[1] - 0.45 * d[1], p[1] + 0.75 * d[1]], color=RED if t == 0.1 else GREY, lw=1.5 if t == 0.1 else 0.8)
    ax.plot(*p, "o", ms=4, color=INK if t == 0.1 else GREY)
ax.plot(0.5, 0.5, "o", ms=5, color=RED); ax.text(0.53, 0.53, "$E$")
ax.plot(0, 0, "o", ms=5, mfc="white", mec=INK); ax.text(-0.1, -0.07, "$O$")
ax.text(0.30, -0.25, "$r^2=1/10$", fontsize=9, bbox=dict(fc="white", ec="none", pad=0.6, alpha=0.85))
fig.savefig("fig2_unique.pdf", bbox_inches="tight"); plt.close(fig)

# ---------- figure 3: angles, wedges and squares ----------
fig, ax = plt.subplots(figsize=(5.4, 5.4))
base(ax, lim=0.42, grid=False)
P = sorted(ORIG, key=lambda p: math.atan2(p[1], p[0]))
ax.add_patch(Circle((0, 0), r, fill=False, ec=INK, lw=1.1))
ax.add_patch(Polygon([(0, 0), P[3], P[4]], fc=GOLD, alpha=0.30, ec="none"))   # 36.87 deg wedge, 3/100
ax.add_patch(Polygon([(0, 0), P[4], P[5]], fc=GREEN, alpha=0.22, ec="none"))  # 53.13 deg wedge, 4/100
ax.text(0.17, 0.0, "$\\frac{3}{100}$", fontsize=12, ha="center", va="center")
ax.text(0.13, 0.12, "$\\frac{4}{100}$", fontsize=12, ha="center", va="center")
ax.add_patch(Polygon(P[0::2], closed=True, fill=False, ec=BLUE, lw=1.4))
ax.add_patch(Polygon(P[1::2], closed=True, fill=False, ec=RED, lw=1.4))
X = [(0.25, 0), (1/6, 1/6), (0, 0.25), (-1/6, 1/6), (-0.25, 0), (-1/6, -1/6), (0, -0.25), (1/6, -1/6)]
ax.add_patch(Polygon(X[0::2], closed=True, fill=False, ec=GOLD, lw=1.3, ls="--"))
ax.add_patch(Polygon(X[1::2], closed=True, fc="none", ec=INK, lw=1.0, ls=":"))
for p in P: ax.plot(*p, "o", ms=4.5, color=INK)
for q in X: ax.plot(*q, "o", ms=3, color=GOLD)
ax.plot(0, 0, "o", ms=4, mfc="white", mec=INK)
fig.savefig("fig3_squares.pdf", bbox_inches="tight"); plt.close(fig)
print("figures written")
