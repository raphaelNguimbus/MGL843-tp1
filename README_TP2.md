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

TODO: **Complexité cyclomatique**, **Couplage**, **Cohésion**, **Nombre de lignes de code (LOC)**, **Taux de commentaires**, **Couverture de tests**, **Densité de bugs**, **Temps de réponse**.


**Si vous avez dû calculer des métriques supplémentaires, expliquez comment vous les avez calculées.**

**Quelles sont les éléments (classes, modules, méthodes, fonctions, etc.) remarquables dans le projet ? Comment les avez-vous identifiées ?**

**Expliquez le rôle de ces éléments dans le projet. Pourquoi sont-ils importants ?**

**Commentez sur la qualité de la conception du projet. Y a-t-il des éléments qui semblent mal conçus ?
Pourquoi ?**

Bien que l'HTML reste simple, si celui-ci vient à être plus complexe, il serait nécessaire d'utiliser un framework de frontend tel que React ou Vue.js pour gérer l'état de l'application et les interactions utilisateur de manière plus efficace. De plus, l'utilisation d'un framework permettrait de mieux structurer le code frontend et de faciliter la maintenance à long terme.

Cela se fait aussi ressentir dans le fichier `public/app.js` qui contient une grande quantité de code JavaScript pour gérer les interactions utilisateur et la communication avec le backend. Bien que cela fonctionne, cela peut devenir difficile à maintenir à mesure que l'application évolue et que de nouvelles fonctionnalités sont ajoutées. De plus celui-ci mélange plusieurs logique comme les intéractions utilisateur, la manipulation du DOM, et les appels API, mise à jour du style, ce qui rend le code plus difficile à comprendre et à déboguer.

Pour le serveur il aurait intéressant de d'augmenter la granularité du code en séparant les différentes responsabilités dans des modules ou classes distincts. Par exemple, la logique de gestion des notes pourrait être isolée dans un module dédié, tandis que la logique de gestion des tags pourrait être dans un autre module. Cela permettrait de mieux organiser le code et de faciliter la maintenance à long terme. De plus, cela permettrait de réduire le couplage entre les différentes parties du code.
