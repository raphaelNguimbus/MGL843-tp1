#!/usr/bin/env python3

import matplotlib.pyplot as plt
import pandas as pd

df = pd.read_csv("../notes-cli-classes-tp2.csv")
colors = ["#E67E22" if name == "TagRepository" else "#2C3E50" for name in df["ClassName"]]

# ---------------------------------------------------------------------------
# Graph 1 : SLOC par classe (horizontal, sorted descending)
# ---------------------------------------------------------------------------

df_sloc = df.sort_values("SLOC", ascending=True)
clr = ["#E67E22" if name == "TagRepository" else "#2C3E50" for name in df_sloc["ClassName"]]

fig, ax = plt.subplots(figsize=(10, 6))
bars = ax.barh(df_sloc["ClassName"], df_sloc["SLOC"], color=clr, edgecolor="black")
ax.set_xlabel("SLOC", fontsize=12, fontweight="bold")
ax.set_title("SLOC par classe (TP2)", fontsize=14, fontweight="bold", pad=20)
ax.grid(axis="x", alpha=0.3, linestyle="--")
ax.bar_label(bars, fontweight="bold", fontsize=10, padding=4)
plt.tight_layout()
plt.savefig("fig-tp2-sloc.png", dpi=300, bbox_inches="tight")
print("Visualisation sauvegardée: fig-tp2-sloc.png")
plt.close()

# ---------------------------------------------------------------------------
# Graph 2 : WMC par classe (horizontal, sorted descending)
# ---------------------------------------------------------------------------

df_wmc = df.sort_values("WMC", ascending=True)
clr = ["#E67E22" if name == "TagRepository" else "#2C3E50" for name in df_wmc["ClassName"]]

fig, ax = plt.subplots(figsize=(10, 6))
bars = ax.barh(df_wmc["ClassName"], df_wmc["WMC"], color=clr, edgecolor="black")
ax.set_xlabel("WMC", fontsize=12, fontweight="bold")
ax.set_title("Weighted Methods per Class — WMC (TP2)", fontsize=14, fontweight="bold", pad=20)
ax.grid(axis="x", alpha=0.3, linestyle="--")
ax.bar_label(bars, fontweight="bold", fontsize=10, padding=4)
plt.tight_layout()
plt.savefig("fig-tp2-wmc.png", dpi=300, bbox_inches="tight")
print("Visualisation sauvegardée: fig-tp2-wmc.png")
plt.close()

# ---------------------------------------------------------------------------
# Graph 3 : CBO par classe (grouped horizontal, sorted by total)
# ---------------------------------------------------------------------------

df_cbo = df.copy()
df_cbo["CBO_total"] = df_cbo["CBO_in"] + df_cbo["CBO_out"]
df_cbo = df_cbo.sort_values("CBO_total", ascending=True)

y = range(len(df_cbo["ClassName"]))
height = 0.35

fig, ax = plt.subplots(figsize=(10, 6))
bars_in = ax.barh(
    [i + height / 2 for i in y], df_cbo["CBO_in"], height=height,
    color="#2980B9", edgecolor="black", label="CBO_in"
)
bars_out = ax.barh(
    [i - height / 2 for i in y], df_cbo["CBO_out"], height=height,
    color="#E74C3C", edgecolor="black", label="CBO_out"
)
ax.set_xlabel("CBO", fontsize=12, fontweight="bold")
ax.set_title("Couplage entre objets — CBO (TP2)", fontsize=14, fontweight="bold", pad=20)
ax.set_yticks(list(y))
ax.set_yticklabels(df_cbo["ClassName"])
ax.legend(fontsize=11)
ax.grid(axis="x", alpha=0.3, linestyle="--")
ax.bar_label(bars_in, fontweight="bold", fontsize=10, padding=4)
ax.bar_label(bars_out, fontweight="bold", fontsize=10, padding=4)
plt.tight_layout()
plt.savefig("fig-tp2-cbo.png", dpi=300, bbox_inches="tight")
print("Visualisation sauvegardée: fig-tp2-cbo.png")
plt.close()

# ---------------------------------------------------------------------------
# Graph 4 : RFC par classe (horizontal, sorted descending)
# ---------------------------------------------------------------------------

df_rfc = df.sort_values("RFC", ascending=True)
clr = ["#E67E22" if name == "TagRepository" else "#2C3E50" for name in df_rfc["ClassName"]]

fig, ax = plt.subplots(figsize=(10, 6))
bars = ax.barh(df_rfc["ClassName"], df_rfc["RFC"], color=clr, edgecolor="black")
ax.set_xlabel("RFC", fontsize=12, fontweight="bold")
ax.set_title("Response For a Class — RFC (TP2)", fontsize=14, fontweight="bold", pad=20)
ax.grid(axis="x", alpha=0.3, linestyle="--")
ax.bar_label(bars, fontweight="bold", fontsize=10, padding=4)
plt.tight_layout()
plt.savefig("fig-tp2-rfc.png", dpi=300, bbox_inches="tight")
print("Visualisation sauvegardée: fig-tp2-rfc.png")
plt.close()

# ---------------------------------------------------------------------------
# Graph 5 : Scatter WMC vs CBO_out (bubble, classes labeled)
# ---------------------------------------------------------------------------

fig, ax = plt.subplots(figsize=(10, 6))

for _, row in df.iterrows():
    color = "#E67E22" if row["ClassName"] == "TagRepository" else "#2C3E50"
    ax.scatter(row["CBO_out"], row["WMC"], s=row["SLOC"] * 3, color=color,
               edgecolor="black", alpha=0.8, zorder=3)
    ax.annotate(row["ClassName"], (row["CBO_out"], row["WMC"]),
                textcoords="offset points", xytext=(10, 5), fontsize=11)

ax.set_xlabel("CBO_out (couplage sortant)", fontsize=12, fontweight="bold")
ax.set_ylabel("WMC (complexité)", fontsize=12, fontweight="bold")
ax.set_title("WMC vs CBO_out — classes à risque (TP2)\n(taille du point ∝ SLOC)",
             fontsize=14, fontweight="bold", pad=20)
ax.grid(alpha=0.3, linestyle="--")
ax.annotate("Zone à risque →", xy=(0.72, 0.88), xycoords="axes fraction",
            fontsize=10, color="red", fontstyle="italic")
plt.tight_layout()
plt.savefig("fig-tp2-scatter.png", dpi=300, bbox_inches="tight")
print("Visualisation sauvegardée: fig-tp2-scatter.png")
plt.close()

# ---------------------------------------------------------------------------
# Graph 6 : TCC par classe (Tight Class Cohesion)
# ---------------------------------------------------------------------------

df_tcc = df.sort_values("TCC", ascending=True)
clr = ["#E67E22" if name == "TagRepository" else "#2C3E50" for name in df_tcc["ClassName"]]

fig, ax = plt.subplots(figsize=(10, 6))
bars = ax.barh(df_tcc["ClassName"], df_tcc["TCC"], color=clr, edgecolor="black")
ax.set_xlabel("TCC (0 = faible cohésion, 1 = forte cohésion)", fontsize=12, fontweight="bold")
ax.set_title("Tight Class Cohesion — TCC (TP2)", fontsize=14, fontweight="bold", pad=20)
ax.grid(axis="x", alpha=0.3, linestyle="--")
ax.axvline(x=1.0, color="red", linestyle="--", alpha=0.5, label="Limite théorique (1.0)")
ax.legend(fontsize=10)
ax.bar_label(bars, fmt="%.3f", fontweight="bold", fontsize=10, padding=4)
plt.tight_layout()
plt.savefig("fig-tp2-tcc.png", dpi=300, bbox_inches="tight")
print("Visualisation sauvegardée: fig-tp2-tcc.png")
plt.close()
