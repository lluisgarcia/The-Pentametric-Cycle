# Figures for "The Hidden Origin" (Lluis Garcia Torcal, Oct 2026). Frame: unit square centred at O, corners (+-1/2, +-1/2).
import numpy as np, matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Circle, Arc
plt.rcParams.update({"font.family": "serif", "mathtext.fontset": "cm", "font.size": 9})
E = 0.5 + 0.5j; HP = 0.7 - 0.1j; H0 = 0.3 - 0.1j
BLUE, RED, GREEN, GOLD, GREY, PURPLE = "#1f4e9e", "#a3262a", "#2e7d32", "#b8860b", "#8a8f96", "#6b3fa0"

def lead_in(q, n):
    P, s, out = E, q, []
    for j in range(n):
        ik = 1j ** (-j); c = P - s * ik * 1j; Pn = P - s * ik * (1j - 1)
        out.append(dict(s=s, c=c, P=P, Pn=Pn, cen=(P + Pn) / 2)); P, s = Pn, s * q
    return out

def arc(ax, c, P0, P1, **kw):
    a0, a1 = np.angle(P0 - c), np.angle(P1 - c)
    if a1 < a0: a1 += 2 * np.pi
    t = np.linspace(a0, a1, 60); r = abs(P0 - c); ax.plot(c.real + r * np.cos(t), c.imag + r * np.sin(t), **kw)

def square(ax, cen, s, **kw): ax.add_patch(Rectangle((cen.real - s / 2, cen.imag - s / 2), s, s, fill=False, **kw))
def pt(ax, z, lab, dx=0.02, dy=0.02, col="k", **kw):
    ax.plot(z.real, z.imag, "o", ms=3.2, color=col, zorder=5); ax.annotate(lab, (z.real, z.imag), (z.real + dx, z.imag + dy), color=col, **kw)

LI = lead_in(0.5, 14)
fig, axs = plt.subplots(1, 2, figsize=(7.4, 3.7), gridspec_kw=dict(width_ratios=[1.12, 1]))
for k, ax in enumerate(axs):
    square(ax, 0, 1, lw=1.1, ec="k")                                            # unit square
    square(ax, -1j, 1, lw=0.7, ec=GREY)                                         # second Fibonacci square
    square(ax, 1, 1, lw=0.8, ec=GREY, ls="--")                                  # neighbouring unit square
    arc(ax, 0.5 - 0.5j, E, -0.5 - 0.5j, color=BLUE, lw=1.6)                     # first Fibonacci arc
    arc(ax, 0.5 - 0.5j, -0.5 - 0.5j, 0.5 - 1.5j, color=BLUE, lw=1.6)            # second arc
    for L in LI:
        square(ax, L["cen"], L["s"], lw=0.6, ec=RED)
        arc(ax, L["c"], L["Pn"], L["P"], color=RED, lw=1.3)
    ax.add_patch(Circle((1, 0), 0.1 ** 0.5, fill=False, ec=GOLD, lw=0.9))     # neighbour's circle of origins
    ax.set_aspect("equal"); ax.axis("off")
ax = axs[0]
ax.add_patch(Circle((0, 0), 0.5 ** 0.5, fill=False, ec=GREY, lw=0.7, ls=":"))   # circle through the corners
ax.add_patch(Circle((0, 0), 0.1 ** 0.5, fill=False, ec=GOLD, lw=0.7, ls="-"))   # its own circle of origins
ax.plot([0.5, 0.5], [-0.62, 0.62], color=PURPLE, lw=0.7, ls="-.")
pt(ax, 0j, "$O$", -0.09, 0.02); pt(ax, H0, "$H_0$", -0.03, -0.11); pt(ax, HP, r"$H'$", 0.03, -0.1, col=RED); pt(ax, E, "$E$", -0.1, 0.03)
pt(ax, 1 + 0j, "", col=GREY)
ax.set_xlim(-0.75, 1.55); ax.set_ylim(-1.55, 0.78)
ax.text(0.53, 0.66, "mirror", color=PURPLE, fontsize=7.5)
ax.set_title("(a)", fontsize=9)
ax = axs[1]
x = np.linspace(-0.05, 1.0, 10)
ax.plot(x, -0.1 - (x - 0.7) / 7, color=GREEN, lw=0.9)                          # slope -1/7 through H' (and O)
y = np.linspace(-0.45, 0.55, 10); ax.plot(0.7 + (y + 0.1) / 7, y, color=GREEN, lw=0.9, ls="--")   # slope 7
for j, L in enumerate(LI[:7]):
    ax.plot(L["cen"].real, L["cen"].imag, "s", ms=2.6, color=GREEN)
    if j < 3: ax.add_patch(Circle((L["cen"].real, L["cen"].imag), L["s"] / 2 ** 0.5, fill=False, ec=GREY, lw=0.5, ls=":"))
pt(ax, HP, r"$H'$", 0.012, -0.045, col=RED); pt(ax, E, "$E$", -0.05, 0.015)
ax.set_xlim(0.46, 1.04); ax.set_ylim(-0.3, 0.55); ax.set_title("(b)", fontsize=9)
plt.tight_layout(); plt.savefig("fig1_halving.pdf"); plt.savefig("fig1_halving.png", dpi=170)

# Figure 2: the limits for every ratio q lie on the circle through the corners
fig, ax = plt.subplots(figsize=(3.6, 3.6))
square(ax, 0, 1, lw=1.1, ec="k"); square(ax, 1, 1, lw=0.8, ec=GREY, ls="--")
ax.add_patch(Circle((0, 0), 0.5 ** 0.5, fill=False, ec=GREY, lw=0.7, ls=":"))
ax.add_patch(Circle((1, 0), 0.1 ** 0.5, fill=False, ec=GOLD, lw=0.9)); ax.add_patch(Circle((0, 0), 0.1 ** 0.5, fill=False, ec=GOLD, lw=0.7))
q = np.linspace(0, 1, 200); Lq = E * (1 - 1j * q) / (1 + 1j * q); ax.plot(Lq.real, Lq.imag, color=RED, lw=2.0)
t = np.linspace(-0.25, 0.8, 5); ax.plot(t, -t / 3, color=GREEN, lw=0.8)                      # Holden's odd line x + 3y = 0
phi = (1 + 5 ** 0.5) / 2
for qq, lab, dx, dy in [(1 / 3, "$q=1/3$", 0.03, 0.01), (0.5, "$q=1/2$", 0.03, -0.04), (1 / phi, r"$q=1/\varphi$", 0.035, -0.075)]:
    z = E * (1 - 1j * qq) / (1 + 1j * qq); pt(ax, z, lab, dx, dy, col=RED, fontsize=8)
pt(ax, H0, "$H_0$", -0.05, 0.05); pt(ax, 0j, "$O$", -0.08, 0.02); pt(ax, E, "$E$ ($q=0$)", -0.05, 0.04, fontsize=8); pt(ax, 0.5 - 0.5j, "$q=1$", 0.02, -0.06, fontsize=8)
ax.set_xlim(-0.6, 1.5); ax.set_ylim(-0.75, 0.75); ax.set_aspect("equal"); ax.axis("off")
plt.tight_layout(); plt.savefig("fig2_ratios.pdf"); plt.savefig("fig2_ratios.png", dpi=170)
print("figures written")
