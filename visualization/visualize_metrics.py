#!/usr/bin/env python3

import matplotlib.pyplot as plt
import pandas as pd

# Lire le fichier CSV directement dans un DataFrame
dataframe = pd.read_csv("../notes-cli-classes.csv")

# Créer le graphique en barres groupées
ax = dataframe.plot(
    x="ClassName",
    y=["NumberOfMethods", "NumberOfAttributes"],
    kind="bar",
    figsize=(10, 6),
    color=["#2C3E50", "#7F8C8D"],  # Dark slate + Gray
    width=0.8,
)

# Configuration des titres et labels
ax.set_xlabel("Classes", fontsize=12, fontweight="bold")
ax.set_ylabel("Nombre", fontsize=12, fontweight="bold")
ax.set_title(
    "Métriques des classes du projet Notes CLI", fontsize=14, fontweight="bold", pad=20
)
ax.legend(["Nombre de méthodes", "Nombre d'attributs"], fontsize=11)
ax.grid(axis="y", alpha=0.3, linestyle="--")

# Rotation des labels de l'axe X pour meilleure lisibilité
plt.xticks(rotation=0)

# Ajouter les valeurs sur les barres
for container in ax.containers:
    ax.bar_label(container, fontweight="bold", fontsize=10)

# Ajuster la mise en page
plt.tight_layout()

# Sauvegarder l'image
output_file = "fig4-metrics-chart.png"
plt.savefig(output_file, dpi=300, bbox_inches="tight")
print(f"Visualisation sauvegardée: {output_file}")

# Afficher le graphique
plt.show()
