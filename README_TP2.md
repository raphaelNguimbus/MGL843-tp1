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

Nous avons retenu cinq métriques, toutes extractables statiquement depuis le modèle Famix sans exécuter le code.

Le SLOC nous donne une idée de la taille de chaque classe — plus une classe est grande, plus elle est susceptible de contenir des défauts. Le WMC mesure la complexité globale d'une classe en sommant la complexité cyclomatique de chacune de ses méthodes ; dans Moose, il est calculé via weightedMethodCount, ce qui signifie qu'une méthode simple compte moins qu'une méthode avec plusieurs branches. Le CBO mesure le couplage entre classes — une classe très couplée est difficile à modifier sans casser autre chose, ce qui va à l'encontre du principe de Faible Couplage (GRASP). Le RFC estime combien de méthodes peuvent être déclenchées en réponse à un message, ce qui donne une idée de la complexité des tests à écrire. Enfin, le TCC mesure à quel point les méthodes d'une classe partagent les mêmes attributs — une cohésion faible suggère que la classe fait trop de choses à la fois, ce que GRASP appelle une violation de Forte Cohésion. Nous avons préféré TCC à LCOM car LCOM est connu pour donner des résultats biaisés en présence d'accesseurs.

Nous avons exclu NOC et DIT car le projet n'utilise pas d'héritage — ces métriques auraient toutes été à 0. Les métriques dynamiques comme la couverture de tests ou le temps de réponse sont hors portée d'une analyse statique avec Moose.

**Si vous avez dû calculer des métriques supplémentaires, expliquez comment vous les avez calculées.**

Une métrique n'était pas disponible directement dans le modèle Famix et a nécessité un calcul supplémentaire dans Pharo.

RFC a été calculé en additionnant le nombre de méthodes propres à la classe et le nombre de méthodes externes distinctes appelées depuis la classe. La définition stricte de Chidamber & Kemerer exige une déduplication — si une même méthode externe est appelée plusieurs fois, elle ne compte qu'une seule fois. Nous avons donc utilisé la formule suivante :

```smalltalk
distinctCalledMethods := (c outgoingInvocations collect: [:i | i candidates]) flatten asSet.
rfc := c methods size + distinctCalledMethods size.
```

Nous avons également vérifié que la formule simplifiée sans déduplication donnait les mêmes résultats sur notre projet :

```smalltalk
rfc := c methods size + c outgoingInvocations size.
```

Les deux formules produisent des valeurs identiques pour toutes les classes, ce qui confirme que chaque méthode externe n'est appelée qu'une seule fois par classe dans ce projet. Les valeurs RFC rapportées sont donc exactes au sens de la définition CK.

WMC et TCC sont disponibles nativement dans Moose via weightedMethodCount et tightClassCohesion respectivement — aucun calcul supplémentaire n'était nécessaire. L'ensemble des métriques a ensuite été exporté dans `notes-cli-classes-tp2.csv` et visualisé avec Python (Matplotlib).

**Quelles sont les éléments (classes, modules, méthodes, fonctions, etc.) remarquables dans le projet ? Comment les avez-vous identifiées ?**

L'analyse des métriques extraites de Moose et visualisées avec Roassal (Pharo) et Python (Matplotlib) a permis d'identifier plusieurs éléments remarquables.

La classe NoteManager a été identifiée comme la plus complexe et la plus couplée du projet. Elle se démarque dans le graphique SLOC avec 158 lignes, dans le graphique WMC avec une valeur de 17, et dans le graphique CBO avec un couplage sortant de 65 — le plus élevé de toutes les classes. Elle apparaît également dans la zone à risque en haut à droite du graphique de dispersion WMC vs CBO. Son RFC de 11 confirme une complexité de test élevée. Elle était déjà la classe dominante en TP1 avec 8 méthodes ; en TP2, elle en compte 11, ce qui accentue tous ses indicateurs.

La classe TagRepository, introduite en TP2, a été repérée grâce au graphique WMC où elle affiche la valeur la plus élevée de toutes les classes avec 20, malgré un SLOC de 132. C'est surtout le graphique TCC qui la distingue : avec un score de 0.045, sa cohésion interne est très faible, ce qui indique que ses 12 méthodes partagent peu d'attributs entre elles. Son RFC de 12 en fait également la classe la plus difficile à tester.

La classe NotesCLI présente une complexité cachée que les métriques révèlent partiellement. Son WMC affiche 1, ce qui semble indiquer une classe simple, mais sa méthode configure compte 72 lignes et délègue la logique à des arrow functions imbriquées dont la complexité cyclomatique n'est pas comptabilisée au niveau de la classe. Son CBO sortant de 46 est par ailleurs très élevé pour seulement 3 méthodes. Le TCC affiche une valeur de 1.333 — anormalement supérieure à 1, ce qui est mathématiquement impossible pour un ratio standard puisque TCC représente une fraction de paires de méthodes. Notre hypothèse est que ts2famix interprète les arrow functions imbriquées dans la méthode configure comme des méthodes à part entière dans le modèle Famix. Cela gonfle artificiellement le nombre de méthodes détectées, ce qui fausse le calcul du dénominateur et du numérateur de manière incohérente, produisant un ratio supérieur à 1. Nous ne l'interprétons donc pas comme un indicateur réel de cohésion pour cette classe.

La classe Tag a été identifiée comme un exemple de classe saine grâce à ses métriques toutes au minimum : SLOC=14, WMC=1, CBO_out=0 et RFC=3. Elle se positionne en bas à gauche du graphique de dispersion, loin de toute zone à risque.

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

Pour améliorer la conception à long terme, il serait pertinent de décomposer `NoteManager` en trois classes distinctes : un `NoteStorage` responsable uniquement de la persistance JSON, un `NoteManager` recentré sur la logique métier, et un `ExpirationScheduler` dédié à la gestion de l'expiration et de la récurrence. Cela respecterait pleinement le SRP et réduirait mécaniquement le CBO et le WMC de chaque classe.
