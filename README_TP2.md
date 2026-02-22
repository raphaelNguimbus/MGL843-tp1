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

<!-- NOTE: "Convivialité" c'est une qualité pas une exigence — à reformuler en quelque chose de mesurable, genre "Le système doit offrir une interface web permettant de créer, modifier, supprimer et rechercher des notes." -->
Convivialité - Afin d'ajouter des fonctionnalitées à l'application CLI de base nous avons décidé d'ajouter une interface web graphique moderne pour permettre aux utilisateurs de gérer leurs notes de manière plus intuitive et visuelle.

<!-- NOTE: "supprimée ou archivée" — dans le code c'est seulement supprimée, il n'y a pas archive. À corriger. -->
Aussi nous avons ajouté une notion d'expiration pour les notes, permettant aux utilisateurs de définir une date d'expiration pour chaque note, après laquelle la note sera automatiquement supprimée ou archivée.

<!-- NOTE: "récurrence". Cette fonctionnalité n'a pas été implémentée — à supprimer ou mentionner clairement que c'était prévu mais pas livré. -->
Pour appuyer notre concept d'expiration, nous avons ajouter de la récurance pour les notes, permettant aux utilisateurs de créer des notes qui se répètent à des intervalles réguliers (quotidien, hebdomadaire, mensuel).

**Comment les exigences ajoutées augmentent-elles la complexité du projet ? Expliquez en quoi elles
affectent la conception du projet par rapport aux exigences initiales (TP1).**


Convivialité - L'ajout d'une interface web graphique moderne augmente la complexité du projet en introduisant une nouvelle couche de présentation qui nécessite la gestion de l'état, des interactions utilisateur, et de la communication entre le frontend et le backend. Cela nécessite également l'utilisation de technologies supplémentaires telles que HTML et CSS pour créer une expérience utilisateur fluide et attrayante. De plus nous avons dû implémenter une API REST pour permettre au frontend de communiquer avec le backend, ce qui ajoute une complexité supplémentaire en termes de gestion des routes, de validation des données, et de sécurité.

Réutilisabilité - Le backend se base sur la même classe que celle développée et utilisée pour le CLI, ce qui nous a permis de réutiliser une grande partie du code existant pour gérer les notes, les tags, et les opérations CRUD. Cependant, nous avons dû adapter certaines parties du code pour permettre une utilisation à la fois via le CLI et l'interface web, ce qui a introduit une certaine complexité en termes de gestion des différentes interfaces utilisateur.

Précision - L'ajout de la notion d'expiration pour les notes ajoute une complexité supplémentaire en termes de gestion des données et de logique métier. Nous avons dû implémenter des mécanismes pour vérifier régulièrement les notes expirées et assurer que les opérations sur les notes prennent en compte cette fonctionnalité. Une fonctionnalité de récurrence avait été envisagée, mais elle n'a pas été implémentée dans la version actuelle. Cela a nécessité une réflexion approfondie sur la structure des données et la logique de l'application pour garantir que toutes les fonctionnalités fonctionnent correctement ensemble.

### 3.2 Visualiser les métriques du projet TypeScript


**Expliquez les métriques que vous avez choisies. Pourquoi sont-elles importantes pour évaluer la
qualité de la conception ?**

Pour évaluer la qualité de la conception, nous avons choisi cinq métriques statiques extraites du modèle Famix généré par ts2famix, sans exécuter le code. L'objectif était d'analyser la taille, la complexité, le couplage et la cohésion des classes, qui sont des indicateurs classiques de qualité de conception.

Le SLOC permet d'avoir une première idée de la taille des classes : plus une classe est volumineuse, plus elle risque d'être difficile à comprendre et à maintenir. Le WMC mesure la complexité interne d'une classe à travers la complexité cyclomatique de ses méthodes ; une valeur élevée indique généralement une classe plus difficile à tester et à faire évoluer.

Le CBO évalue le niveau de dépendance entre classes : un couplage fort signifie qu'une modification peut avoir des effets de bord ailleurs dans le système. Le RFC donne une estimation du nombre de méthodes potentiellement exécutées en réponse à un appel, ce qui impacte directement la complexité des tests. Enfin, le TCC mesure la cohésion interne d'une classe, c'est-à-dire dans quelle mesure ses méthodes travaillent sur les mêmes données — un indicateur important pour juger si une classe respecte le principe de Responsabilité Unique.

Nous avons volontairement exclu certaines métriques comme NOC et DIT, puisque le projet n'utilise pas l'héritage. Les métriques dynamiques (couverture de tests, performance, etc.) n'ont pas été considérées car elles dépassent le cadre d'une analyse statique avec Moose.

**Si vous avez dû calculer des métriques supplémentaires, expliquez comment vous les avez calculées.**

Une seule métrique n'était pas directement disponible dans le modèle Famix : le RFC. Nous avons donc dû la calculer manuellement dans Pharo.

Conformément à la définition CK, nous avons additionné le nombre de méthodes propres à la classe et le nombre de méthodes externes distinctes qu'elle appelle. Nous avons pris soin de dédupliquer les méthodes appelées afin d'éviter de compter plusieurs fois la même dépendance.

```smalltalk
distinctCalledMethods := (c outgoingInvocations collect: [:i | i candidates]) flatten asSet.
rfc := c methods size + distinctCalledMethods size.
```

Nous avons également vérifié qu'une version simplifiée (sans déduplication explicite) produisait les mêmes résultats sur notre projet, ce qui montre qu'aucune méthode externe n'est appelée plusieurs fois dans une même classe. Les valeurs de RFC obtenues sont donc cohérentes avec la définition théorique.

Les métriques WMC et TCC étaient disponibles directement dans Moose (weightedMethodCount et tightClassCohesion), donc aucun calcul supplémentaire n'a été nécessaire. L'ensemble des résultats a ensuite été exporté en CSV et visualisé avec Python (Matplotlib).

**Quelles sont les éléments (classes, modules, méthodes, fonctions, etc.) remarquables dans le projet ? Comment les avez-vous identifiées ?**

L’analyse des métriques extraites avec Moose et visualisées via Roassal et Python a permis d’identifier plusieurs classes remarquables, soit par leur complexité, soit par leur rôle central dans l’architecture.

La classe NoteManager ressort comme l’élément le plus critique du projet. Elle présente des valeurs élevées en taille (SLOC), en complexité (WMC) et en couplage (CBO), et se situe dans la zone à risque du graphique WMC vs CBO. Son RFC relativement élevé confirme qu’elle concentre beaucoup de comportement, ce qui la rend plus difficile à tester et à faire évoluer.

La classe TagRepository, introduite en TP2, se distingue par une complexité interne importante (WMC élevé) et surtout par une cohésion très faible (TCC bas). Cela suggère que ses méthodes manipulent peu d’attributs en commun et que la classe regroupe probablement plusieurs responsabilités.

La classe NotesCLI présente une complexité plus subtile. Son WMC est faible, mais sa méthode configure est longue et contient plusieurs fonctions fléchées imbriquées, ce qui masque en partie sa complexité réelle. Son TCC dépasse 1, ce qui est théoriquement impossible pour un ratio de cohésion ; cela indique probablement une limite dans l’extraction métrique (liée à l’interprétation des fonctions fléchées par ts2famix). Nous ne considérons donc pas cette valeur comme représentative de sa cohésion réelle.

À l’inverse, la classe Tag apparaît comme un exemple de conception simple et cohésive : petite taille, faible complexité et absence de couplage sortant. Elle se situe clairement dans la zone “saine” des visualisations.

Ces éléments ont été identifiés en croisant les métriques principales (SLOC, WMC, CBO, RFC, TCC) et en observant les zones à risque dans les graphiques de dispersion, ce qui a permis de repérer à la fois les classes dominantes et les classes bien structurées.

**Expliquez le rôle de ces éléments dans le projet. Pourquoi sont-ils importants ?**

La classe Tag représente une étiquette avec un nom et une couleur. Son rôle est d’être le modèle de données partagé entre les autres classes. Elle est particulièrement stable car elle ne possède aucune dépendance, ce qui la rend facilement réutilisable dans tout le système.

NoteManager gère le cycle de vie complet des notes : création, modification, suppression, recherche et expiration. C’est la classe centrale du projet, puisque toutes les opérations passent par elle ; toute faiblesse de conception à ce niveau impacte directement l’ensemble du système.

TagRepository gère les tags de manière indépendante : création, couleurs, compteurs d’usage et persistance dans tags.json. Elle a été introduite en TP2 afin de retirer cette responsabilité de NoteManager, évitant ainsi qu’elle ne devienne une God Class et améliorant la séparation des responsabilités.

NotesCLI configure les commandes du terminal via commander et délègue à NoteManager, tandis que server.ts expose l’API REST et démarre le planificateur d’expiration. Ces deux modules constituent les points d’entrée du système — l’un pour le CLI, l’autre pour le web — et définissent la manière dont l’utilisateur interagit avec l’application.

Enfin, public/app.js gère les interactions utilisateur, les appels à l’API et la mise à jour de l’interface. Il représente le point de contact direct avec l’utilisateur web, ce qui en fait un élément déterminant pour l’expérience utilisateur.

**Commentez sur la qualité de la conception du projet. Y a-t-il des éléments qui semblent mal conçus ?
Pourquoi ?**

Bien que l'HTML reste simple, si celui-ci vient à être plus complexe, il serait nécessaire d'utiliser un framework de frontend tel que React ou Vue.js pour gérer l'état de l'application et les interactions utilisateur de manière plus efficace. De plus, l'utilisation d'un framework permettrait de mieux structurer le code frontend et de faciliter la maintenance à long terme.

Cela se fait aussi ressentir dans le fichier `public/app.js` qui contient une grande quantité de code JavaScript pour gérer les interactions utilisateur et la communication avec le backend. Bien que cela fonctionne, cela peut devenir difficile à maintenir à mesure que l'application évolue et que de nouvelles fonctionnalités sont ajoutées. De plus celui-ci mélange plusieurs logique comme les interactions utilisateur, la manipulation du DOM, et les appels API, mise à jour du style, ce qui rend le code plus difficile à comprendre et à déboguer.

Pour le serveur il aurait intéressant de d'augmenter la granularité du code en séparant les différentes responsabilités dans des modules ou classes distincts. Par exemple, la logique de gestion des notes pourrait être isolée dans un module dédié, tandis que la logique de gestion des tags pourrait être dans un autre module. Cela permettrait de mieux organiser le code et de faciliter la maintenance à long terme. De plus, cela permettrait de réduire le couplage entre les différentes parties du code.

Cependant, les métriques extraites avec Moose mettent en évidence des problèmes de conception plus structurants.
La classe NoteManager cumule deux responsabilités majeures : la persistance des données (lecture/écriture JSON) et la logique métier (CRUD, recherche, expiration). Cette concentration viole le principe de Responsabilité Unique et explique ses valeurs élevées en WMC et en CBO. Sa croissance entre TP1 et TP2 (8 à 11 méthodes) confirme une tendance à centraliser le comportement plutôt qu’à le distribuer. De plus, la méthode loadNotes() relit le fichier à chaque opération, ce qui introduit un coût inutile et révèle une absence de séparation claire entre stockage et logique métier.

La classe TagRepository, bien qu’introduite pour améliorer la modularité, présente une cohésion très faible (TCC=0.045). Ses méthodes couvrent des aspects hétérogènes — couleurs, compteurs d’usage, persistance — ce qui suggère qu’elle regroupe encore plusieurs responsabilités. Le fait que recalculateUsageCounts() soit exécutée au démarrage pour corriger un état potentiellement incohérent révèle également un couplage indirect entre la gestion des notes et celle des tags.

À l’inverse, la classe Tag illustre une conception saine : simple, cohésive et sans dépendances sortantes. Ses métriques faibles confirment qu’elle respecte naturellement le principe de forte cohésion (WMC=1, CBO_out=0, RFC=3).

Pour améliorer la conception à long terme, il serait pertinent de séparer clairement la persistance, la logique métier et la planification. Extraire un NoteStorage (persistance), recentrer NoteManager sur la logique métier, et isoler un ExpirationScheduler dédié permettrait de mieux respecter le SRP et de réduire mécaniquement la complexité et le couplage observés.
