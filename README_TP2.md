# MGL843-tp2

### Interface Web (Graphique)

Lancer l'interface visuelle moderne :

```bash
npm run dev:web
```

Puis ouvrez **[http://localhost:3000](http://localhost:3000)** dans votre navigateur.

### Fonctionnalités de l'interface web

- **📝 Créer des notes** : Interface avec formulaire pour créer des notes avec tags
- **🔍 Rechercher** : Recherche en temps réel dans le contenu et les tags
- **🏷️ Gestion des tags** : Ajout de tags à des notes existantes
- **📥 Export** : Télécharger une note individuelle ou toutes les notes en JSON
- **🗑️ Supprimer** : Suppression de notes avec confirmation
- **✨ Design moderne** : Interface avec glassmorphism, animations fluides et design responsive

### Technologies utilisées

**Backend:**

- Express.js - Serveur web
- TypeScript - Langage de programmation

**Frontend:**

- HTML5 - Structure sémantique
- CSS3 - Design avec animations


### 3.1 Ajouter des exigences au projet TypeScript

**Quelles sont les exigences que vous avez ajoutées ? Justifiez brièvement chaque exigence.**

Convivialité - Afin d'ajouter des fonctionnalitées à l'application CLI de base nous avons décidé d'ajouter une interface web graphique moderne pour permettre aux utilisateurs de gérer leurs notes de manière plus intuitive et visuelle. 

Aussi nous avons ajouté une notion d'expiration pour les notes, permettant aux utilisateurs de définir une date d'expiration pour chaque note, après laquelle la note sera automatiquement supprimée ou archivée.

Pour appuyer notre concept d'expiration, nous avons ajouter de la récurance pour les notes, permettant aux utilisateurs de créer des notes qui se répètent à des intervalles réguliers (quotidien, hebdomadaire, mensuel).

**Comment les exigences ajoutées augmentent-elles la complexité du projet ? Expliquez en quoi elles
affectent la conception du projet par rapport aux exigences initiales (TP1).**


Convivialité - L'ajout d'une interface web graphique moderne augmente la complexité du projet en introduisant une nouvelle couche de présentation qui nécessite la gestion de l'état, des interactions utilisateur, et de la communication entre le frontend et le backend. Cela nécessite également l'utilisation de technologies supplémentaires telles que HTML et CSS pour créer une expérience utilisateur fluide et attrayante. De plus nous avons dû implémenter une API REST pour permettre au frontend de communiquer avec le backend, ce qui ajoute une complexité supplémentaire en termes de gestion des routes, de validation des données, et de sécurité.

Réutisabilité - Le backend se base sur la même classe que celle développer et utilisé pour le CLI, ce qui nous a permis de réutiliser une grande partie du code existant pour gérer les notes, les tags, et les opérations CRUD. Cependant, nous avons dû adapter certaines parties du code pour permettre une utilisation à la fois via le CLI et l'interface web, ce qui a introduit une certaine complexité en termes de gestion des différentes interfaces utilisateur.

Précision - L'ajout de la notion d'expiration et de récurrence pour les notes ajoute une complexité supplémentaire en termes de gestion des données et de logique métier. Nous avons dû implémenter des mécanismes pour vérifier régulièrement les notes expirées, gérer les notes récurrentes, et assurer que les opérations sur les notes prennent en compte ces nouvelles fonctionnalités. Cela a nécessité une réflexion approfondie sur la structure des données et la logique de l'application pour garantir que toutes les fonctionnalités fonctionnent correctement ensemble.

### 3.2 Visualiser les métriques du projet TypeScript


**Expliquez les métriques que vous avez choisies. Pourquoi sont-elles importantes pour évaluer la
qualité de la conception ?**

Pour évaluer la qualité de la conception, nous avons retenu cinq métriques statiques, toutes extractables depuis le modèle Famix généré par ts2famix, sans nécessiter l'exécution du code.

Le SLOC (Source Lines of Code) est la métrique de taille la plus directe. Selon Zhou, Xu & Leung (2010), c'est le meilleur prédicteur empirique de fautes — plus une classe est grande, plus elle est susceptible de contenir des défauts. Le WMC (Weighted Methods per Class) représente la somme des complexités cyclomatiques de chaque méthode et constitue le deuxième meilleur prédicteur de fautes selon Chidamber & Kemerer (1994) — une valeur élevée indique une classe difficile à comprendre, tester et maintenir. Le CBO (Coupling Between Objects) mesure le couplage entre classes — un CBO élevé rend une classe difficile à modifier sans effets de bord, ce qui est directement lié au principe de Faible Couplage (GRASP). Le RFC (Response For a Class) représente le nombre de méthodes susceptibles d'être exécutées en réponse à un message — un RFC élevé augmente la complexité des tests unitaires nécessaires. Enfin, le TCC (Tight Class Cohesion) mesure le ratio des paires de méthodes partageant au moins un attribut, ce qui reflète la cohésion interne d'une classe et est directement lié au principe de Forte Cohésion (GRASP). Il s'agit d'une variante plus robuste de LCOM, moins sensible aux accesseurs (Bieman & Kang, 1995).

Certaines métriques ont été exclues délibérément : NOC et DIT sont uniformément à 0 car il n'y a pas d'héritage dans le projet, et les métriques dynamiques comme la couverture de tests, la densité de bugs ou le temps de réponse sont hors portée d'une analyse statique avec Moose.

**Si vous avez dû calculer des métriques supplémentaires, expliquez comment vous les avez calculées.**

Une métrique n'était pas disponible directement dans le modèle Famix et a nécessité un calcul supplémentaire dans Pharo.

RFC a été calculé en additionnant le nombre de méthodes propres à la classe et le nombre d'invocations sortantes — c'est-à-dire les méthodes externes appelées depuis la classe :

```smalltalk
| model rows |
model := MooseModel root first.

rows := model allModelClasses collect: [:c |
    | rfc row |
    rfc := c methods size + c outgoingInvocations size.
    row := OrderedCollection new.
    row add: c name.
    row add: c numberOfLinesOfCode.
    row add: c methods size.
    row add: c weightedMethodCount.
    row add: c allClients size.
    row add: c allProviders size.
    row add: rfc.
    row
].
rows
```

WMC et TCC sont disponibles nativement dans Moose via weightedMethodCount et tightClassCohesion respectivement — aucun calcul supplémentaire n'était nécessaire. L'ensemble des métriques a ensuite été exporté dans `notes-cli-classes-tp2.csv` et visualisé avec Python (Matplotlib).

**Quelles sont les éléments (classes, modules, méthodes, fonctions, etc.) remarquables dans le projet ? Comment les avez-vous identifiées ?**

L'analyse des métriques extraites de Moose et visualisées avec Roassal et Python a permis d'identifier plusieurs éléments remarquables.

La classe NoteManager reste la plus complexe du projet avec SLOC=158, WMC=17, CBO_out=65 et RFC=11. Elle était déjà la classe dominante en TP1 avec 8 méthodes ; en TP2, elle en compte 11 pour supporter l'expiration et l'interface web. Elle apparaît clairement dans la zone à risque du graphique de dispersion WMC vs CBO.

La classe `TagRepository`, introduite en TP2, présente malgré une bonne intention architecturale une complexité sous-estimée : WMC=20 (le plus élevé de toutes les classes), SLOC=132, RFC=12, et surtout TCC=0.045 — une cohésion interne très faible qui indique que ses méthodes partagent peu d'attributs entre elles.

La classe `NotesCLI` présente une complexité cachée : WMC=1 en apparence, mais sa méthode `configure` fait 72 lignes et délègue la logique à des arrow functions imbriquées dont la complexité cyclomatique n'est pas remontée au niveau de la classe. À l'inverse, la classe `Tag` est un exemple de classe saine avec SLOC=14, WMC=1, CBO_out=0 et RFC=3 — aucun risque de conception.

**Expliquez le rôle de ces éléments dans le projet. Pourquoi sont-ils importants ?**

La classe `Tag` est un modèle de données simple représentant une étiquette (nom + couleur), sérialisable en JSON. C'est la brique de base partagée par toutes les autres classes. La classe `NoteManager` constitue la logique métier centrale — elle gère le cycle de vie complet des notes (CRUD, recherche, export, expiration) et persiste les données dans `notes_db.json`. Toute opération sur les notes passe par elle, ce qui en fait le point névralgique du système. La classe `TagRepository`, introduite en TP2, gère le cycle de vie des tags indépendamment des notes — création, couleurs, compteurs d'usage, CRUD — et persiste dans `tags.json`. Elle a été créée pour appliquer le principe de Séparation des Responsabilités (SRP) en retirant la gestion des tags de `NoteManager`. La classe `NotesCLI` est le point d'entrée de l'interface CLI — elle configure les commandes via `commander` et délègue à `NoteManager`, jouant le rôle de Contrôleur (GRASP) pour l'interface en ligne de commande. Le module `server.ts` expose l'API REST via Express.js, démarre le serveur sur le port 3000 et lance le planificateur de suppression automatique des notes expirées — c'est le point d'entrée HTTP du système. Enfin, `public/app.js` constitue la couche de présentation web — il gère les interactions utilisateur, les appels API REST et la manipulation du DOM, et représente le seul point de contact entre l'utilisateur web et le système.

**Commentez sur la qualité de la conception du projet. Y a-t-il des éléments qui semblent mal conçus ?
Pourquoi ?**

Bien que l'HTML reste simple, si celui-ci vient à être plus complexe, il serait nécessaire d'utiliser un framework de frontend tel que React ou Vue.js pour gérer l'état de l'application et les interactions utilisateur de manière plus efficace. De plus, l'utilisation d'un framework permettrait de mieux structurer le code frontend et de faciliter la maintenance à long terme.

Cela se fait aussi ressentir dans le fichier `public/app.js` qui contient une grande quantité de code JavaScript pour gérer les interactions utilisateur et la communication avec le backend. Bien que cela fonctionne, cela peut devenir difficile à maintenir à mesure que l'application évolue et que de nouvelles fonctionnalités sont ajoutées. De plus celui-ci mélange plusieurs logique comme les intéractions utilisateur, la manipulation du DOM, et les appels API, mise à jour du style, ce qui rend le code plus difficile à comprendre et à déboguer.

Pour le serveur il aurait intéressant de d'augmenter la granularité du code en séparant les différentes responsabilités dans des modules ou classes distincts. Par exemple, la logique de gestion des notes pourrait être isolée dans un module dédié, tandis que la logique de gestion des tags pourrait être dans un autre module. Cela permettrait de mieux organiser le code et de faciliter la maintenance à long terme. De plus, cela permettrait de réduire le couplage entre les différentes parties du code.

De plus, l'analyse des métriques extraites depuis Moose révèle d'autres problèmes de conception. La classe `NoteManager` cumule deux responsabilités distinctes : la persistance des données (lecture/écriture du fichier JSON) et la logique métier (ajout, recherche, expiration des notes). Cela viole le Principe de Responsabilité Unique (SRP) et l'heuristique de Forte Cohésion (GRASP). La méthode `loadNotes()` relit également le fichier JSON à chaque opération, ce qui n'est pas optimal — une mise en cache en mémoire aurait été préférable. Entre TP1 et TP2, `NoteManager` est passée de 8 à 11 méthodes, ce qui traduit une tendance à y ajouter du comportement plutôt qu'à extraire les nouvelles responsabilités dans des classes dédiées.

La classe `TagRepository`, bien qu'introduite avec la bonne intention de séparer la gestion des tags, présente une cohésion interne très faible (TCC=0.045) : ses 12 méthodes regroupent des responsabilités hétérogènes comme la gestion des couleurs, les compteurs d'usage et la persistance, qui pourraient être mieux séparées. On note également que `recalculateUsageCounts()` est appelé systématiquement au démarrage du serveur pour corriger un état potentiellement incohérent entre `NoteManager` et `TagRepository`, ce qui est davantage une correction compensatoire qu'une solution à la cause racine.

Enfin, la classe `Tag` reste un exemple de bonne conception : simple, cohésive, sans couplage sortant, avec des métriques au minimum (WMC=1, CBO_out=0, RFC=3).
