#!/usr/bin/env python3

import argparse
import os
import matplotlib.pyplot as plt
import pandas as pd


# Thresholds based on Shatnawi (2010) and general practice
THRESHOLDS = {
    "SLOC": (100, 200),     # green < 100, yellow 100-200, red > 200
    "WMC":  (10, 20),       # green < 10, yellow 10-20, red > 20
    "CBO":  (5, 14),        # green < 5, yellow 5-14, red > 14
    "RFC":  (20, 50),       # green < 20, yellow 20-50, red > 50
    "TCC":  (0.5, 0.2),     # green > 0.5, yellow 0.2-0.5, red < 0.2 (inverted)
}

COLORS = {
    "green":  "#27AE60",
    "yellow": "#F39C12",
    "red":    "#E74C3C",
}


def threshold_color(value, metric):
    """Return green/yellow/red based on metric thresholds."""
    if metric not in THRESHOLDS:
        return "#2C3E50"
    low, high = THRESHOLDS[metric]
    if metric == "TCC":  # inverted: higher is better
        if value >= low:   return COLORS["green"]
        if value >= high:  return COLORS["yellow"]
        return COLORS["red"]
    else:  # lower is better
        if value <= low:   return COLORS["green"]
        if value <= high:  return COLORS["yellow"]
        return COLORS["red"]


def threshold_colors(values, metric):
    """Return list of colors for a series of values."""
    return [threshold_color(v, metric) for v in values]


def main():
    parser = argparse.ArgumentParser(description="Generate metric visualizations from a CSV file")
    parser.add_argument("csv", help="Path to the metrics CSV file")
    parser.add_argument("-o", "--output", default=".", help="Directory to save images (default: current dir)")
    parser.add_argument("--prefix", default="fig", help="Prefix for output filenames (default: fig)")
    parser.add_argument("--title", default="", help="Suffix for graph titles (e.g. TP2, TP3)")
    args = parser.parse_args()

    os.makedirs(args.output, exist_ok=True)
    df = pd.read_csv(args.csv)
    suffix = f" ({args.title})" if args.title else ""

    def save(name):
        path = os.path.join(args.output, f"{args.prefix}-{name}.png")
        plt.savefig(path, dpi=300, bbox_inches="tight")
        print(f"Saved: {path}")
        plt.close()

    def add_threshold_line(ax, value, metric, orientation="v"):
        label = f"Seuil {metric} ({value})"
        if orientation == "v":
            ax.axvline(x=value, color="#E74C3C", linestyle="--", alpha=0.6, label=label)
        else:
            ax.axhline(y=value, color="#E74C3C", linestyle="--", alpha=0.6, label=label)

    # 1 — SLOC
    d = df.sort_values("SLOC", ascending=True)
    fig, ax = plt.subplots(figsize=(10, 6))
    bars = ax.barh(d["ClassName"], d["SLOC"], color=threshold_colors(d["SLOC"], "SLOC"), edgecolor="black")
    ax.set_xlabel("SLOC", fontsize=12, fontweight="bold")
    ax.set_title(f"SLOC par classe{suffix}", fontsize=14, fontweight="bold", pad=20)
    ax.grid(axis="x", alpha=0.3, linestyle="--")
    add_threshold_line(ax, 100, "warning")
    add_threshold_line(ax, 200, "danger")
    ax.legend(fontsize=9)
    ax.bar_label(bars, fontweight="bold", fontsize=10, padding=4)
    plt.tight_layout()
    save("sloc")

    # 2 — WMC
    d = df.sort_values("WMC", ascending=True)
    fig, ax = plt.subplots(figsize=(10, 6))
    bars = ax.barh(d["ClassName"], d["WMC"], color=threshold_colors(d["WMC"], "WMC"), edgecolor="black")
    ax.set_xlabel("WMC", fontsize=12, fontweight="bold")
    ax.set_title(f"Weighted Methods per Class — WMC{suffix}", fontsize=14, fontweight="bold", pad=20)
    ax.grid(axis="x", alpha=0.3, linestyle="--")
    add_threshold_line(ax, 10, "warning")
    add_threshold_line(ax, 20, "danger")
    ax.legend(fontsize=9)
    ax.bar_label(bars, fontweight="bold", fontsize=10, padding=4)
    plt.tight_layout()
    save("wmc")

    # 3 — CBO (grouped: CBO_in and CBO_out)
    d = df.copy()
    d["CBO_total"] = d["CBO_in"] + d["CBO_out"]
    d = d.sort_values("CBO_total", ascending=True)
    y = range(len(d))
    h = 0.35
    fig, ax = plt.subplots(figsize=(10, 6))
    bars_in = ax.barh([i + h/2 for i in y], d["CBO_in"], height=h, color="#2980B9", edgecolor="black", label="CBO_in")
    bars_out = ax.barh([i - h/2 for i in y], d["CBO_out"], height=h, color="#E74C3C", edgecolor="black", label="CBO_out")
    ax.set_xlabel("CBO", fontsize=12, fontweight="bold")
    ax.set_title(f"Couplage entre objets — CBO{suffix}", fontsize=14, fontweight="bold", pad=20)
    ax.set_yticks(list(y))
    ax.set_yticklabels(d["ClassName"])
    add_threshold_line(ax, 14, "CBO")
    ax.legend(fontsize=11)
    ax.grid(axis="x", alpha=0.3, linestyle="--")
    ax.bar_label(bars_in, fontweight="bold", fontsize=10, padding=4)
    ax.bar_label(bars_out, fontweight="bold", fontsize=10, padding=4)
    plt.tight_layout()
    save("cbo")

    # 4 — RFC
    d = df.sort_values("RFC", ascending=True)
    fig, ax = plt.subplots(figsize=(10, 6))
    bars = ax.barh(d["ClassName"], d["RFC"], color=threshold_colors(d["RFC"], "RFC"), edgecolor="black")
    ax.set_xlabel("RFC", fontsize=12, fontweight="bold")
    ax.set_title(f"Response For a Class — RFC{suffix}", fontsize=14, fontweight="bold", pad=20)
    ax.grid(axis="x", alpha=0.3, linestyle="--")
    ax.bar_label(bars, fontweight="bold", fontsize=10, padding=4)
    plt.tight_layout()
    save("rfc")

    # 5 — Scatter WMC vs CBO_out (threshold zones)
    fig, ax = plt.subplots(figsize=(10, 6))
    for _, row in df.iterrows():
        wmc_clr = threshold_color(row["WMC"], "WMC")
        ax.scatter(row["CBO_out"], row["WMC"], s=row["SLOC"] * 3, color=wmc_clr, edgecolor="black", alpha=0.8, zorder=3)
        ax.annotate(row["ClassName"], (row["CBO_out"], row["WMC"]), textcoords="offset points", xytext=(10, 5), fontsize=11)
    # Threshold zones
    ax.axhline(y=20, color="#E74C3C", linestyle="--", alpha=0.4, label="WMC seuil (20)")
    ax.axvline(x=14, color="#E74C3C", linestyle="--", alpha=0.4, label="CBO seuil (14)")
    ax.fill_between([14, ax.get_xlim()[1] if ax.get_xlim()[1] > 14 else 50], 20, 50,
                     alpha=0.08, color="red", label="Zone à risque")
    ax.set_xlabel("CBO_out (couplage sortant)", fontsize=12, fontweight="bold")
    ax.set_ylabel("WMC (complexité)", fontsize=12, fontweight="bold")
    ax.set_title(f"WMC vs CBO_out — classes à risque{suffix}\n(taille du point ∝ SLOC)", fontsize=14, fontweight="bold", pad=20)
    ax.grid(alpha=0.3, linestyle="--")
    ax.legend(fontsize=9, loc="upper left")
    plt.tight_layout()
    save("scatter")

    # 6 — TCC
    d = df.sort_values("TCC", ascending=True)
    fig, ax = plt.subplots(figsize=(10, 6))
    bars = ax.barh(d["ClassName"], d["TCC"], color=threshold_colors(d["TCC"], "TCC"), edgecolor="black")
    ax.set_xlabel("TCC (0 = faible cohésion, 1 = forte cohésion)", fontsize=12, fontweight="bold")
    ax.set_title(f"Tight Class Cohesion — TCC{suffix}", fontsize=14, fontweight="bold", pad=20)
    ax.grid(axis="x", alpha=0.3, linestyle="--")
    ax.axvline(x=0.5, color="#F39C12", linestyle="--", alpha=0.5, label="Seuil warning (0.5)")
    ax.axvline(x=0.2, color="#E74C3C", linestyle="--", alpha=0.5, label="Seuil danger (0.2)")
    ax.legend(fontsize=9)
    ax.bar_label(bars, fmt="%.3f", fontweight="bold", fontsize=10, padding=4)
    plt.tight_layout()
    save("tcc")


if __name__ == "__main__":
    main()
