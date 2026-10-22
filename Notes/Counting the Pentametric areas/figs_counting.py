"""Figures for the note 'Counting the Pentametric areas from an empty square' (MIT licence)."""
import math
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon, Rectangle, Circle, FancyArrowPatch
plt.rcParams.update({"font.family": "serif", "font.size": 10, "mathtext.fontset": "cm"})
BLUE, PINK, RED, GREEN, INK, GREY, GOLD = "#2c5f8a", "#c2407a", "#b5462a", "#2e7d4f", "#222222", "#9a9a9a", "#c98a2b"
r = math.sqrt(0.1)
def leg(n): m = n % 5; return 0 if m == 0 else (1 if m in (1, 4) else -1)
def P(n): return (n*n + 4*leg(n)) // 5

# ---------- Fig 1: from an empty square ----------
fig, ax = plt.subplots(figsize=(5.2, 5.2))
h = 0.5
ax.add_patch(Rectangle((-h, -h), 1, 1, fill=False, ec=INK, lw=1.0))
C = [(-h, -h), (h, -h), (h, h), (-h, h)]
M = [(0, -h), (h, 0), (0, h), (-h, 0)]
# blue family: corner k -> midpoint of side k+1 ; pink: mirror
blue_lines = [((-h, -h), (h, 0)), ((h, -h), (0, h)), ((h, h), (-h, 0)), ((-h, h), (0, -h))]
pink_lines = [((x1, -y1), (x2, -y2)) for (x1, y1), (x2, y2) in blue_lines]
for (a, b) in blue_lines: ax.plot([a[0], b[0]], [a[1], b[1]], color=BLUE, lw=0.8, ls=(0, (4, 2)))
for (a, b) in pink_lines: ax.plot([a[0], b[0]], [a[1], b[1]], color=PINK, lw=0.6, ls=(0, (2, 2)), alpha=0.7)
bsq = [(-0.1, -0.3), (0.3, -0.1), (0.1, 0.3), (-0.3, 0.1)]
psq = [(x, -y) for x, y in bsq]
ax.add_patch(Polygon(bsq, closed=True, fc=BLUE, alpha=0.18, ec=BLUE, lw=1.4))
ax.add_patch(Polygon(psq, closed=True, fc=PINK, alpha=0.10, ec=PINK, lw=1.0))
ax.add_patch(Circle((0, 0), r, fill=False, ec=INK, lw=1.3))
H = (0.3, -0.1)
xs = [0.12, 0.62]; ax.plot(xs, [3*x - 1 for x in xs], color=RED, lw=1.8)      # even line (tangent)
xs = [-0.55, 0.55]; ax.plot(xs, [-x/3 for x in xs], color=GREEN, lw=1.8)      # odd line
for p in bsq + psq: ax.plot(*p, "o", ms=4, color=INK)
ax.plot(0, 0, "o", ms=5, mfc="white", mec=INK)
ax.text(0.33, -0.18, "$H$", fontsize=11); ax.text(-0.09, 0.03, "$O$", fontsize=11)
ax.text(0.47, -0.18, "even line", color=RED, fontsize=9, rotation=71)
ax.text(-0.42, 0.17, "odd line", color=GREEN, fontsize=9, rotation=-18)
ax.set_xlim(-0.62, 0.62); ax.set_ylim(-0.62, 0.62); ax.set_aspect("equal"); ax.axis("off")
fig.savefig("fig1_empty_square.pdf", bbox_inches="tight"); plt.close(fig)

# ---------- Fig 2: the breath is the blue square of the 2x2 square ----------
fig, axs = plt.subplots(1, 5, figsize=(11, 2.6))
def tilted_square(ax, area, cx, cy, **kw):
    s = math.sqrt(area); a = math.atan(0.5)   # blue squares are tilted by arctan(1/2)
    pts = []
    for k in range(4):
        t = a + k*math.pi/2 + math.pi/4
        pts.append((cx + s/math.sqrt(2)*math.cos(t), cy + s/math.sqrt(2)*math.sin(t)))
    ax.add_patch(Polygon(pts, closed=True, **kw))
for i, n in enumerate(range(1, 6)):
    ax = axs[i]; ch = leg(n)
    hb = math.sqrt(n*n/5)/math.sqrt(2)*math.cos(math.pi/4 - math.atan(0.5))  # half-width of tilted blue square
    hb = max(abs(math.sqrt(n*n/5)/math.sqrt(2)*math.cos(math.atan(0.5) + k*math.pi/2 + math.pi/4)) for k in range(4))
    hg = max(abs(math.sqrt(0.8)/math.sqrt(2)*math.cos(math.atan(0.5) + k*math.pi/2 + math.pi/4)) for k in range(4))
    x = 0.0
    tilted_square(ax, n*n/5, x, 0, fc=BLUE, alpha=0.25, ec=BLUE, lw=1.2); x += hb
    if ch != 0:
        col = GREEN if ch > 0 else RED
        x += 0.45; ax.text(x, 0, {1: "+", -1: "\u2212"}[ch], fontsize=16, ha="center", va="center"); x += 0.45 + hg
        tilted_square(ax, 4/5, x, 0, fc=col, alpha=0.25, ec=col, lw=1.2); x += hg
    x += 0.45; ax.text(x, 0, "=", fontsize=14, ha="center", va="center"); x += 0.45
    p = P(n); s = math.sqrt(p) if p else 0
    if p: ax.add_patch(Rectangle((x, -s/2), s, s, fill=False, ec=INK, lw=1.4)); x += s
    else: ax.plot(x + 0.1, 0, "o", ms=4, color=INK); x += 0.2
    ax.set_title(f"$n={n}$:  ${n}^2/5 {'+' if ch>0 else ('-' if ch<0 else '')}{' 2^2/5' if ch else ''} = {p}$", fontsize=10)
    ax.set_xlim(-hb - 0.2, x + 0.2); ax.set_ylim(-1.7, 1.7); ax.set_aspect("equal"); ax.axis("off")
fig.savefig("fig2_breath.pdf", bbox_inches="tight"); plt.close(fig)

# ---------- Fig 3: the landing rule ----------
fig, axs = plt.subplots(1, 5, figsize=(12, 3.0))
z = (0.3, -0.1)
for i, n in enumerate([1, 2, 3, 4, 5]):
    ax = axs[i]; hn = n/2
    for k in range(n + 1):
        ax.plot([-hn + k, -hn + k], [-hn, hn], color=GREY, lw=0.6)
        ax.plot([-hn, hn], [-hn + k, -hn + k], color=GREY, lw=0.6)
    ax.add_patch(Rectangle((-hn, -hn), n, n, fill=False, ec=INK, lw=1.1))
    ax.add_patch(Circle((0, 0), n*r, fill=False, ec=INK, lw=1.0, ls=(0, (3, 2))))
    X = (n*z[0], n*z[1])
    sh = 0 if n % 2 else 0.5
    c = (round(X[0] - sh) + sh, round(X[1] - sh) + sh)
    d = (X[0] - c[0], X[1] - c[1])
    if abs(d[0]**2 + d[1]**2 - 0.1) < 1e-9:
        ax.add_patch(Circle(c, r, fill=False, ec=BLUE, lw=1.2))
        ax.plot(*c, "+", color=BLUE, ms=6)
        ax.add_patch(FancyArrowPatch(c, X, arrowstyle="-|>", mutation_scale=8, color=BLUE, lw=1.0))
        t = {1: 0, 3: 1, 4: 2, 2: 3}[n % 5]
        lab = ["no turn", "¼ turn clockwise", "½ turn", "¾ turn clockwise"][t]
    else:
        lab = "a corner (rest)"
    ax.plot([0, X[0]], [0, X[1]], color=GOLD, lw=1.0)
    ax.plot(*X, "o", ms=5, color=RED); ax.plot(0, 0, "o", ms=4, mfc="white", mec=INK)
    ax.set_title(f"$n={n}$: {lab}", fontsize=10)
    lim = hn + 0.15; ax.set_xlim(-lim, lim); ax.set_ylim(-lim, lim); ax.set_aspect("equal"); ax.axis("off")
fig.savefig("fig3_landing.pdf", bbox_inches="tight"); plt.close(fig)

# ---------- Fig 4: mirror squares ----------
fig, ax = plt.subplots(figsize=(6.4, 3.8))
for cx in (0, 1):
    ax.add_patch(Rectangle((cx - h, -h), 1, 1, fill=False, ec=INK, lw=1.0))
    ax.add_patch(Circle((cx, 0), r, fill=False, ec=INK, lw=1.1))
H1, H2 = (0.3, -0.1), (0.7, -0.1)
g1 = [(0.1, 0.3), (0.7, 0.1), (0.5, -0.5), (-0.1, -0.3)]
g2 = [(0.9, 0.3), (0.3, 0.1), (0.5, -0.5), (1.1, -0.3)]
ax.add_patch(Polygon(g1, closed=True, fc=GREY, alpha=0.35, ec=INK, lw=1.0))
ax.add_patch(Polygon(g2, closed=True, fc=GOLD, alpha=0.18, ec=GOLD, lw=1.0))
xs = [-0.55, 1.4]; ax.plot(xs, [-x/3 for x in xs], color=GREEN, lw=1.5)
ax.plot(xs, [(x - 1)/3 for x in xs], color=GREEN, lw=1.0, ls=(0, (4, 2)))
for p in [H1, H2]: ax.plot(*p, "s", ms=5, color=RED)
for p in [(0.9, -0.3), (0.1, -0.3)]: ax.plot(*p, "o", ms=5, mfc="white", mec=GREEN, mew=1.5)
ax.text(0.27, -0.2, "$H$", fontsize=10); ax.text(0.68, -0.2, "$H'$", fontsize=10); ax.text(0.52, -0.6, "$F$", fontsize=10)
ax.set_xlim(-0.6, 1.6); ax.set_ylim(-0.62, 0.62); ax.set_aspect("equal"); ax.axis("off")
fig.savefig("fig4_mirror.pdf", bbox_inches="tight"); plt.close(fig)
print("ok")
