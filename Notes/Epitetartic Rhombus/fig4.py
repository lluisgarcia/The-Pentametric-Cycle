"""Figure 4: the crossings X_k of Holden's lines with the spiral in squares 1-5 (MIT licence)."""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Arc, Rectangle
plt.rcParams.update({"font.family": "serif", "font.size": 10, "mathtext.fontset": "cm"})
GOLD, BLUE, RED, GREEN, INK, GREY = "#c98a2b", "#2c5f8a", "#b5462a", "#2e7d4f", "#222222", "#9a9a9a"
F = [0, 1, 1, 2, 3, 5, 8]; L = [2, 1, 3, 4, 7, 11, 18]
P = complex(0.1, 0.3); w = complex(-0.1, -0.3)
C = lambda k: P + (1j) ** (k - 1) * L[k] * w
Mk = lambda k: C(k) + F[k] * (1j) ** (k - 1) * (1 + 1j) / 2
X = lambda k: P + 2 * F[k + 1] * (1j) ** (k - 1) * w
fig, ax = plt.subplots(figsize=(6.2, 5.4))
for k in range(1, 6):
    c = C(k); h = F[k] / 2
    ax.add_patch(Rectangle((c.real - h, c.imag - h), F[k], F[k], fill=False, ec=GREY, lw=0.9))
    m = Mk(k); a0 = 180 + 90 * (k - 1)                         # the arc runs between directions -i^(k-1) and -i^k
    ax.add_patch(Arc((m.real, m.imag), 2 * F[k], 2 * F[k], theta1=a0, theta2=a0 + 90, color=BLUE, lw=2))
xs = [-3.6, 2.6]; ax.plot(xs, [3 * x for x in xs], color=GREEN, lw=1.3)
xs = [-4.2, 3.4]; ax.plot(xs, [(1 - x) / 3 for x in xs], color=RED, lw=1.3)
off = {1: (-1.05, -0.12), 2: (0.1, -0.35), 3: (0.15, 0.05), 4: (-0.25, 0.25), 5: (0.2, -0.05)}
for k in range(1, 6):
    x = X(k); ax.plot(x.real, x.imag, "o", ms=7, color=GOLD, mec=INK, zorder=5)
    ax.text(x.real + off[k][0], x.imag + off[k][1], f"$X_{k}$: {2 * F[k + 1]}$h$", fontsize=9, zorder=6)
    c = C(k); ax.plot(c.real, c.imag, "o", ms=3.5, color=INK)
    ax.text(c.real + 0.08, c.imag + 0.08, f"$C_{k}$", fontsize=8, color=INK)
ax.plot(P.real, P.imag, "*", ms=12, color=INK); ax.text(P.real + 0.12, P.imag - 0.18, "$P$", fontsize=11)
ax.text(-3.4, -3.1, "$y=3x$", color=GREEN); ax.text(-4.1, 1.85, "$x+3y=1$", color=RED)
ax.set_xlim(-4.3, 3.0); ax.set_ylim(-4.8, 3.2); ax.set_aspect("equal"); ax.axis("off")
fig.savefig("fig4_crossings.pdf", bbox_inches="tight"); fig.savefig("fig4_crossings.png", dpi=110, bbox_inches="tight")
