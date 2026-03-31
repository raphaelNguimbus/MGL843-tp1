#!/usr/bin/env python3
"""
Radar chart comparing software metrics before and after refactoring.
Based on: "Visualizing software refactoring using radar charts"
(Scientific Reports, Nature, 2023 — doi:10.1038/s41598-023-44281-6)

Usage:
    python radar_comparison.py before.csv after.csv -o output_dir --classes NoteManager TagRepository
    python radar_comparison.py before.csv after.csv -o output_dir  # all common classes
"""

import argparse
import os
import numpy as np
import matplotlib.pyplot as plt
import pandas as pd


METRICS = ["SLOC", "WMC", "CBO_out", "RFC", "TCC"]

# For display: some metrics are "lower is better" (invert for radar)
# TCC is "higher is better" so we invert the others
INVERT = {"SLOC", "WMC", "CBO_out", "RFC"}


def normalize(df, metrics):
    """Min-max normalize metrics to 0-1 scale across both dataframes."""
    result = df.copy()
    for m in metrics:
        col = result[m].astype(float)
        mn, mx = col.min(), col.max()
        if mx > mn:
            result[m] = (col - mn) / (mx - mn)
        else:
            result[m] = 0.5
    return result


def radar_chart(class_name, before_row, after_row, metrics, output_dir, prefix):
    """Create a single radar chart comparing before/after for one class."""
    n = len(metrics)
    angles = np.linspace(0, 2 * np.pi, n, endpoint=False).tolist()
    angles += angles[:1]  # close the polygon

    before_vals = [before_row[m] for m in metrics] + [before_row[metrics[0]]]
    after_vals = [after_row[m] for m in metrics] + [after_row[metrics[0]]]

    fig, ax = plt.subplots(figsize=(8, 8), subplot_kw=dict(projection="polar"))

    # Before polygon
    ax.plot(angles, before_vals, "o-", linewidth=2, color="#E74C3C", label="Avant (TP2)")
    ax.fill(angles, before_vals, alpha=0.15, color="#E74C3C")

    # After polygon
    ax.plot(angles, after_vals, "o-", linewidth=2, color="#27AE60", label="Après (TP3)")
    ax.fill(angles, after_vals, alpha=0.15, color="#27AE60")

    # Labels
    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(metrics, fontsize=12, fontweight="bold")
    ax.set_title(f"{class_name} — Avant vs Après réusinage",
                 fontsize=14, fontweight="bold", pad=30)
    ax.legend(loc="upper right", bbox_to_anchor=(1.3, 1.1), fontsize=11)
    ax.set_ylim(0, 1)
    ax.set_yticks([0.25, 0.5, 0.75, 1.0])
    ax.set_yticklabels(["0.25", "0.50", "0.75", "1.00"], fontsize=8, alpha=0.6)
    ax.grid(True, alpha=0.3)

    plt.tight_layout()
    path = os.path.join(output_dir, f"{prefix}-radar-{class_name}.png")
    plt.savefig(path, dpi=300, bbox_inches="tight")
    print(f"Saved: {path}")
    plt.close()


def main():
    parser = argparse.ArgumentParser(
        description="Radar chart comparing metrics before/after refactoring"
    )
    parser.add_argument("before", help="CSV file with metrics before refactoring")
    parser.add_argument("after", help="CSV file with metrics after refactoring")
    parser.add_argument("-o", "--output", default=".", help="Output directory")
    parser.add_argument("--prefix", default="fig", help="Prefix for filenames")
    parser.add_argument("--classes", nargs="*", help="Classes to compare (default: all common)")
    args = parser.parse_args()

    os.makedirs(args.output, exist_ok=True)

    df_before = pd.read_csv(args.before)
    df_after = pd.read_csv(args.after)

    # Find common classes
    common = set(df_before["ClassName"]) & set(df_after["ClassName"])
    if args.classes:
        common = common & set(args.classes)

    if not common:
        print("No common classes found between the two CSVs.")
        return

    # Normalize per-class so differences are clearly visible
    norm_before_rows = {}
    norm_after_rows = {}

    for cls in sorted(common):
        b_row = df_before[df_before["ClassName"] == cls].iloc[0].copy()
        a_row = df_after[df_after["ClassName"] == cls].iloc[0].copy()

        for m in METRICS:
            bv = float(b_row[m])
            av = float(a_row[m])
            # Scale relative to the larger value (with padding so polygons don't touch the edge)
            scale_max = max(bv, av) * 1.3 if max(bv, av) > 0 else 1.0
            if m in INVERT:
                # Lower is better → invert so improvement moves outward
                b_row[m] = 1 - (bv / scale_max)
                a_row[m] = 1 - (av / scale_max)
            else:
                b_row[m] = bv / scale_max
                a_row[m] = av / scale_max

        norm_before_rows[cls] = b_row
        norm_after_rows[cls] = a_row

    # Generate radar chart per class
    for cls in sorted(common):
        radar_chart(cls, norm_before_rows[cls], norm_after_rows[cls], METRICS, args.output, args.prefix)

    # Also generate an overlay with all classes — each class normalized per-class
    if len(common) > 1:
        fig, axes = plt.subplots(1, len(common), figsize=(7 * len(common), 7),
                                 subplot_kw=dict(projection="polar"))
        if len(common) == 1:
            axes = [axes]

        for ax, cls in zip(axes, sorted(common)):
            b_row = norm_before_rows[cls]
            a_row = norm_after_rows[cls]

            n = len(METRICS)
            angles = np.linspace(0, 2 * np.pi, n, endpoint=False).tolist()
            angles += angles[:1]

            before_vals = [b_row[m] for m in METRICS] + [b_row[METRICS[0]]]
            after_vals = [a_row[m] for m in METRICS] + [a_row[METRICS[0]]]

            ax.plot(angles, before_vals, "o-", linewidth=2, color="#E74C3C", label="Avant")
            ax.fill(angles, before_vals, alpha=0.15, color="#E74C3C")
            ax.plot(angles, after_vals, "o-", linewidth=2, color="#27AE60", label="Après")
            ax.fill(angles, after_vals, alpha=0.15, color="#27AE60")

            ax.set_xticks(angles[:-1])
            ax.set_xticklabels(METRICS, fontsize=10, fontweight="bold")
            ax.set_title(cls, fontsize=13, fontweight="bold", pad=20)
            ax.set_ylim(0, 1)
            ax.set_yticks([0.25, 0.5, 0.75, 1.0])
            ax.set_yticklabels(["", "", "", ""], fontsize=8)
            ax.grid(True, alpha=0.3)
            ax.legend(fontsize=9, loc="upper right", bbox_to_anchor=(1.2, 1.1))

        plt.suptitle("Comparaison des métriques avant/après réusinage",
                     fontsize=16, fontweight="bold", y=1.02)
        plt.tight_layout()
        path = os.path.join(args.output, f"{args.prefix}-radar-all.png")
        plt.savefig(path, dpi=300, bbox_inches="tight")
        print(f"Saved: {path}")
        plt.close()


if __name__ == "__main__":
    main()
