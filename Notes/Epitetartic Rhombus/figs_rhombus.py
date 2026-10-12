"""Figures for the note 'The Epitetartic Rhombus' (MIT licence)."""
import math
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon, Arc, Rectangle, Circle

plt.rcParams.update({"font.family": "serif", "font.size": 10, "mathtext.fontset": "cm"})
GOLD, BLUE, RED, GREEN, INK, GREY = "#c98a2b", "#2c5f8a", "#b5462a", "#2e7d4f", "#222222", "#9a9a9a"

# ---------- figure 1: the arc of square 1, Holden's line, Q = -P, the rhombus ----------
F = [0, 1, 1, 2, 3, 5]; L = [2, 1, 3, 4, 7, 11]
P = (0.1, 0.3)
def centre(k):
    w = complex(-0.1, -0.3) * L[k] * (1j) ** (k - 1)
    return (P[0] + w.real, P[1] + w.imag)
fig, ax = plt.subplots(figsize=(5.6, 5.6))
for k in range(1, 5):
    cx, cy = centre(k); h = F[k] / 2
    ax.add_patch(Rectangle((cx - h, cy - h), F[k], F[k], fill=False, ec=GREY, lw=0.9))
    if k == 3: ax.text(cx - h + 0.05, cy + h - 0.07, f"square {k} (side {F[k]})", ha="left", va="top", color=GREY, fontsize=7)
    elif k != 4: ax.text(cx + h - 0.04, cy - h + 0.05, f"square {k} (side {F[k]})", ha="right", va="bottom", color=GREY, fontsize=7)
# Holden's grid (light)
for m in range(-12, 13):
    xs = [-2.2, 3.2]
    ax.plot(xs, [3 * x - m for x in xs], color=GREY, lw=0.3, alpha=0.35)
    ax.plot(xs, [(m - x) / 3 for x in xs], color=GREY, lw=0.3, alpha=0.35)
# the arc of square 1 and its whole circle
ax.add_patch(Circle((0.5, 0.5), 1, fill=False, ec=BLUE, lw=0.8, ls=(0, (3, 3)), alpha=0.7))
ax.add_patch(Arc((0.5, 0.5), 2, 2, theta1=180, theta2=270, color=BLUE, lw=2.2))
# Holden's lines
xs = [-0.9, 0.75]; ax.plot(xs, [3 * x for x in xs], color=GREEN, lw=1.6)
xs = [-2.2, 3.2]; ax.plot(xs, [(1 - x) / 3 for x in xs], color=RED, lw=1.6)
# the rhombus
R = [(-0.5, 0.5), (0.5, -0.3), (1.5, 0.5), (0.5, 1.3)]
ax.add_patch(Polygon(R, closed=True, fc=GOLD, alpha=0.16, ec=GOLD, lw=2))
ax.plot([-0.5, 1.5], [0.5, 0.5], color=GOLD, lw=0.9, ls="--"); ax.plot([0.5, 0.5], [-0.3, 1.3], color=GOLD, lw=0.9, ls="--")
ax.plot([-0.1, 0.5], [-0.3, -0.3], color=GOLD, lw=0.9, ls=":")
# points
pts = {"$P$": (0.1, 0.3, (0.1, -0.04)), "$Q=-P$": (-0.1, -0.3, (-0.33, -0.05)), "$M$": (0.5, 0.5, (0.07, 0.06)), "$C_3$": (0.5, 1.5, (0.13, 0.04)), "$C_1$": (0, 0, (-0.14, 0.0))}
for lab, (x, y, (dx, dy)) in pts.items():
    ax.plot(x, y, "o", ms=5 if lab != "$Q=-P$" else 7, color=INK if lab not in ("$Q=-P$",) else GOLD, mec=INK)
    ax.text(x + dx, y + dy, lab, fontsize=10, ha="center")
ax.text(1.53, 0.43, r"$2\arctan\frac{5}{4}$", fontsize=8, color=GOLD, ha="left")
ax.text(0.56, 1.36, r"$2\arctan\frac{4}{5}=77.32^\circ$", fontsize=8, color=GOLD, ha="left")
ax.text(-0.95, 1.95, r"$y=3x$", color=GREEN); ax.text(2.35, -0.15, r"$x+3y=1$", color=RED)
ax.set_xlim(-1.4, 3.0); ax.set_ylim(-1.1, 3.3); ax.set_aspect("equal"); ax.axis("off")
fig.savefig("fig1_arc.pdf", bbox_inches="tight"); plt.close(fig)

# ---------- figure 2: the rhombus in any square, with the ruler construction ----------
fig, ax = plt.subplots(figsize=(4.6, 4.6))
ax.add_patch(Rectangle((0, 0), 1, 1, fill=False, ec=INK, lw=1.8))
for t in (1 / 3, 2 / 3):
    ax.plot([t, t], [0, 1], color=GREY, lw=0.9); ax.plot([0, 1], [t, t], color=GREY, lw=0.9)
ax.plot([0, 1], [1 / 3, 2 / 3], color=BLUE, lw=1.2); ax.plot([1 / 3, 2 / 3], [1, 0], color=BLUE, lw=1.2)
R = [(0, 1 / 3), (11 / 30, 0.9), (1, 2 / 3), (19 / 30, 0.1)]
ax.add_patch(Polygon(R, closed=True, fc=GOLD, alpha=0.18, ec=GOLD, lw=2.2))
for line in ([(1 / 6, 1), (1 / 2, 5 / 6), (5 / 6, 2 / 3)], [(5 / 6, 0), (1 / 2, 1 / 6), (1 / 6, 1 / 3)]):
    ax.plot([line[0][0], line[2][0]], [line[0][1], line[2][1]], color=RED, lw=1.1, ls=(0, (6, 2, 1.5, 2)))
    for x, y in line: ax.plot(x, y, "o", ms=5, mfc="white", mec=RED, mew=1.3)
for (x, y), lab, d in zip(R, ["$(0,\\frac{1}{3})$", "$(\\frac{11}{30},\\frac{9}{10})$", "$(1,\\frac{2}{3})$", "$(\\frac{19}{30},\\frac{1}{10})$"], [(-0.03, 0, "right"), (0, 0.05, "center"), (0.03, 0, "left"), (0, -0.07, "center")]):
    ax.plot(x, y, "o", ms=5, color=GOLD, mec=INK); ax.text(x + d[0], y + d[1], lab, ha=d[2], va="center", fontsize=9)
ax.set_xlim(-0.25, 1.25); ax.set_ylim(-0.15, 1.12); ax.set_aspect("equal"); ax.axis("off")
fig.savefig("fig2_square.pdf", bbox_inches="tight"); plt.close(fig)

# ---------- figure 3: halving (left) against the 15 x 15 grid (right) ----------
fig, axs = plt.subplots(1, 2, figsize=(6.4, 3.2))
x, y = 11 / 30, 0.9
ax = axs[0]; ax.add_patch(Rectangle((0, 0), 1, 1, fill=False, ec=INK, lw=1.4))
x0, y0, s = 0.0, 0.0, 1.0
seq = []
for k in range(6):
    s /= 2; bx = int((x - x0) >= s); by = int((y - y0) >= s); x0 += bx * s; y0 += by * s
    seq.append({(0, 0): "BL", (1, 0): "BR", (0, 1): "TL", (1, 1): "TR"}[(bx, by)])
    ax.add_patch(Rectangle((x0, y0), s, s, fill=False, ec=BLUE, lw=0.9 + 0.15 * (6 - k)))
ax.plot(x, y, "o", ms=4, color=GOLD, mec=INK)
ax.set_title("halving: " + ", ".join(seq) + ", ...", fontsize=8)
ax = axs[1]; ax.add_patch(Rectangle((0, 0), 1, 1, fill=False, ec=INK, lw=1.4))
for i in range(1, 15):
    ax.plot([i / 15] * 2, [0, 1], color=GREY, lw=0.5); ax.plot([0, 1], [i / 15] * 2, color=GREY, lw=0.5)
ax.add_patch(Rectangle((5 / 15, 13 / 15), 1 / 15, 1 / 15, fc=GREEN, alpha=0.35, ec="none"))
ax.plot(x, y, "o", ms=4, color=GOLD, mec=INK); ax.set_title("15 × 15: the centre of a cell", fontsize=8)
for a in axs: a.set_xlim(-0.03, 1.03); a.set_ylim(-0.03, 1.03); a.set_aspect("equal"); a.axis("off")
fig.savefig("fig3_halving.pdf", bbox_inches="tight"); plt.close(fig)
print("figures written")
