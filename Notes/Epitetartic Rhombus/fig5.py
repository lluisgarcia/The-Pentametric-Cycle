"""Figure 5: distance from P along the spiral, in Holden units (MIT licence)."""
import math
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
plt.rcParams.update({"font.family": "serif", "font.size": 10, "mathtext.fontset": "cm"})
GOLD, BLUE, INK, GREY = "#c98a2b", "#2c5f8a", "#222222", "#9a9a9a"
F = [0, 1]; L = [2, 1]
for _ in range(30): F.append(F[-1] + F[-2]); L.append(L[-1] + L[-2])
P = complex(0.1, 0.3); w = complex(-0.1, -0.3); h = math.sqrt(0.1)
C = lambda k: P + (1j) ** (k - 1) * L[k] * w
M = lambda k: C(k) + F[k] * (1j) ** (k - 1) * (1 + 1j) / 2
def d(t):
    k = int(t) + 1; f = t - int(t); a = math.pi * (1 + (k - 1) / 2) + f * math.pi / 2
    return abs(M(k) + F[k] * complex(math.cos(a), math.sin(a)) - P) / h
K = 7; T = math.atan2(4, 3) / (math.pi / 2)
ts = [i / 400 for i in range(K * 400 + 1)]
fig, ax = plt.subplots(figsize=(6.4, 3.2))
ax.plot(ts, [d(t) for t in ts], color=BLUE, lw=1.8)
for j in range(K + 1):
    ax.plot(j, d(j), "o", color=BLUE, ms=4)
    if 1 <= j <= 5: ax.annotate(f"$2\\sqrt{{{F[2 * j + 1]}}}$", (j, d(j)), textcoords="offset points", xytext=(6, -12), fontsize=8, color=BLUE)
for k in range(1, K + 1):
    ax.plot(k - 1 + T, 2 * F[k + 1], "o", color=GOLD, mec=INK, ms=6)
    ax.annotate(f"{2 * F[k + 1]}", (k - 1 + T, 2 * F[k + 1]), textcoords="offset points", xytext=(-4, 7), fontsize=9)
ax.set_yscale("log"); ax.set_yticks([2, 4, 6, 10, 16, 26, 42]); ax.get_yaxis().set_major_formatter(matplotlib.ticker.ScalarFormatter())
ax.yaxis.set_minor_locator(matplotlib.ticker.NullLocator())
ax.set_xticks(range(K + 1)); ax.set_xlabel("position along the spiral (one unit = one square's quarter turn)"); ax.set_ylabel("distance from $P$ (units of $h$)")
ax.grid(alpha=0.25); ax.set_xlim(0, K)
fig.savefig("fig5_distance.pdf", bbox_inches="tight"); fig.savefig("fig5_distance.png", dpi=100, bbox_inches="tight")
