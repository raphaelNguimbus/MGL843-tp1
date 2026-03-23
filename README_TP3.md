# MGL843-TP3 — Réusinage d’un projet TypeScript

### 3.1 Identification des problèmes de conception

Les problèmes ci-dessous reprennent ce qu’on avait déjà observé au TP2, mais ici on les documente avec les métriques et les captures.

#### Rappel des métriques TP2

Les métriques suivantes ont été extraites du modèle FamixTypeScript via Moose et exportées en CSV.

| Classe | SLOC | Méthodes | WMC | CBO_in | CBO_out | RFC | TCC |
|---|---:|---:|---:|---:|---:|---:|---:|
| Tag | 14 | 3 | 1 | 13 | 0 | 3 | 0.0 |
| NoteManager | 158 | 11 | 17 | 18 | 65 | 11 | 0.436 |
| TagRepository | 132 | 12 | 20 | 16 | 19 | 12 | 0.045 |
| NotesCLI | 83 | 3 | 1 | 2 | 46 | 3 | 1.333 |


Dans les graphiques suivants, les couleurs indiquent le niveau de risque : **vert** = valeur saine, **jaune** = zone d'attention, **rouge** = zone de danger. Les lignes pointillées marquent les seuils. Pour le scatter plot, la **zone à risque** (en rouge pâle) correspond aux classes qui dépassent à la fois le seuil WMC (20) et CBO (14). La taille des points est proportionnelle au SLOC.

![WMC vs CBO — zone à risque au TP2](./visualization/tp2/fig-tp2-scatter.png)

![TCC — cohésion critique de TagRepository](./visualization/tp2/fig-tp2-tcc.png)

#### Problème 1 — NoteManager : classe trop centrale

`NoteManager` concentre plusieurs responsabilités : logique métier, persistance, expiration des notes et coordination avec `TagRepository`.

Les métriques vont dans le même sens :

- SLOC = 158 : c’est la plus grosse classe du projet ;
- WMC = 17 : la complexité cumulée est élevée ;
- CBO_out = 65 : le couplage sortant est très fort ;
- RFC = 11 : plusieurs appels sont déclenchés à partir d’une seule requête.

En pratique, on a clairement une violation du **SRP**. La cohésion n’est pas bonne non plus, parce que la même classe fait du métier, de la persistance et un peu de planification. On voit aussi un problème d’**Expert en information** : `loadNotes()` fait de la migration de tags alors que cette logique appartient davantage à `TagRepository`.

#### Problème 2 — TagRepository : cohésion très faible

`TagRepository` mélange plusieurs responsabilités dans la même classe :

- gestion des couleurs ;
- compteurs d’usage ;
- persistance ;
- CRUD des tags.

Les signaux les plus importants sont :

- TCC = 0.045 : cohésion très faible ;
- WMC = 20 : complexité élevée ;
- 12 méthodes qui touchent à des sujets assez différents.

Le point le plus gênant est `recalculateUsageCounts(notes: Note[])`, parce que cette méthode crée un couplage direct entre les tags et les notes. Pour nous, c’est contraire à **Faible couplage** et au **SRP**.

#### Problème 3 — server.ts : trop de choses au même endroit

Avant les réusinages du TP3, `server.ts` faisait environ 203 lignes et mélangeait :

- la configuration Express ;
- les routes API ;
- la validation des requêtes ;
- l’appel à la logique métier ;
- la planification avec `setInterval`.

Le fichier avait donc plusieurs raisons de changer. Ce n’est pas bon pour SRP, et ce n’est pas vraiment aligné avec **Contrôleur** et **Indirection** de GRASP.

#### Problème 4 — NotesCLI : complexité sous-estimée

`NotesCLI` donne l’impression d’être simple si on regarde juste les métriques, mais ce n’est pas toute l’histoire :

- WMC = 1 : valeur trompeuse ;
- TCC = 1.333 : valeur impossible en théorie ;
- 83 SLOC principalement dans `configure`.

Le problème vient probablement de la façon dont ts2famix interprète les fonctions fléchées imbriquées. Donc la métrique est faible, mais la méthode reste longue et difficile à découper mentalement.

#### Problème 5 — planification de l’expiration couplée au serveur

Le mécanisme d’expiration est directement dans `server.ts` :

```typescript
setInterval(() => {
    const deletedCount = noteManager.deleteExpiredNotes();
    if (deletedCount > 0) {
        console.log(`Deleted ${deletedCount} expired note(s)`);
    }
}, 5 * 1000);
```

Ça ajoute une responsabilité de plus au point d’entrée du serveur. Si la stratégie change plus tard, il faut modifier `server.ts`, ce qui n’est pas idéal. On perd en **Protection des variations**, en **Indirection** et encore une fois en **SRP**.

#### Synthèse

| Classe/Fichier | Problème principal | Heuristiques touchées | Indice principal |
|---|---|---|---|
| NoteManager | Large Class / responsabilités mélangées | SRP, Forte cohésion, Expert en information | WMC=17, CBO_out=65, SLOC=158 |
| TagRepository | Faible cohésion | SRP, Forte cohésion, Faible couplage | TCC=0.045, WMC=20 |
| server.ts | Responsabilités mélangées | SRP, Contrôleur, Indirection | 203 SLOC |
| NotesCLI | Long Method masquée | SRP | 83 SLOC, WMC peu fiable |
| Expiration dans server.ts | Couplage inutile | SRP, Protection des variations, Indirection | `setInterval` inline |

---

### 3.2 Proposition d'améliorations

À partir des problèmes de la section 3.1, on a retenu deux réusinages réalisés et une recommandation gardée de côté.

#### Réusinage #1 — Restructuration architecturale
Ce réusinage regroupe trois changements liés entre eux.

##### 1a. Décomposer `server.ts` en couches

Le premier réusinage correspond surtout à un ménage de structure. `server.ts` concentrait trop de choses, donc on l'a découpé pour sortir les routes, les contrôleurs et la configuration du serveur. Après ça, le fichier redevient surtout un point d'entrée. Dit simplement, on a essayé d'arrêter de faire porter au même endroit la configuration HTTP, les décisions de routage et la coordination métier. 
Après le changement, `server.ts` passe de **203 à 40 lignes** (réduction de 80%). Les routes et les contrôleurs sont déplacés dans leurs propres fichiers (`routes/note.ts` 20 lignes, `routes/tag.ts` 17 lignes, `controllers/note.ts` 104 lignes, `controllers/tag.ts` 77 lignes). Ce changement applique surtout : Contrôleur (GRASP) ; SRP ; Faible couplage.

##### 1b. Introduire un `NoteRepository`

Dans la même logique, on a séparé la persistance de `NoteManager` avec un `NoteRepository`. L'idée n'était pas de rajouter une couche "par principe", mais plutôt d'éviter que `NoteManager` connaisse encore les détails de lecture et d'écriture. On a donc introduit l'interface suivante :

```typescript
export interface NoteRepository {
    loadAll(): Note[];
    saveAll(notes: Note[]): void;
    exportTo(filePath: string): void;
}
```

Puis une implémentation concrète `FileNoteRepository`, injectée dans `NoteManager`.
Le gain attendu était simple : `NoteManager` dépend d’une abstraction et n’a plus besoin de connaître les détails de lecture/écriture de fichiers. Ça va dans le sens d' Indirection, du DIP et de la Protection des variations.

##### 1c. Séparer le module monolithique `notes.ts`

Le fichier `src/notes.ts` (378 lignes) regroupait trop d’éléments dans un seul module : `Tag`, `TagRepository`, `Note` et `NoteManager`. On l’a éclaté en : `src/tag.ts` (163 lignes), `src/manager/NoteManager.ts` (213 lignes), `src/repository/noteRepository.ts` (40 lignes).
Ce changement va dans le sens de : SRP; Forte cohésion; une structure plus claire du projet.
Ce n'est pas le changement le plus "spectaculaire", mais en pratique c'est celui qui rend le projet plus lisible quand on navigue dedans.

#### Réusinage #2 — Améliorer la cohésion de TagRepository

Ce réusinage cible directement le problème principal de `TagRepository`.

Les changements retenus sont :
- extraire la logique des couleurs dans `TagColorService` ;
- supprimer `recalculateUsageCounts(notes: Note[])` — cette suppression est sûre car les compteurs d'usage sont déjà maintenus en temps réel par NoteManager via `incrementUsage()` et `decrementUsage()` à chaque opération. La méthode était un filet de sécurité redondant dont l'existence révélait un manque de confiance dans la cohérence des données ;
- enlever l’appel de synchronisation au démarrage du serveur ;
- déplacer la résolution des tags vers `TagRepository` avec `resolveTag()`.

L’objectif était de recentrer `TagRepository` sur ce qu’il doit gérer : les tags eux-mêmes, pas les notes.
Les heuristiques visées sont : Forte cohésion; Faible couplage; SRP; Expert en information.

Le point important, pour nous, c’est surtout `loadNotes()`. Dans le code du TP2, `NoteManager` commençait à gérer des cas `string` ou objet, des couleurs par défaut, et plusieurs appels à `getTagByName()`. Bref, beaucoup de logique sur les tags dans une méthode qui est censée charger des notes. C’est pour ça qu’on le lit comme un cas de **Feature Envy** : la méthode travaillait trop avec les détails d’un autre objet.

**Avant (TP2)** — `loadNotes()` dans NoteManager gérait la résolution inline :

```typescript
// NoteManager.loadNotes() — 14 lignes de logique sur les tags
tags: (note.tags || []).map((t) => {
    if (typeof t === ‘string’) { /* lookup + new Tag(...) */ }
    else if (t.name) { /* lookup + new Tag(...) */ }
    return new Tag(‘unknown’, ‘#8b5cf6’);  // couleur hardcodée
})
```

**Après (TP3)** — la résolution est déléguée à `TagRepository.resolveTag()` :

```typescript
// NoteManager.loadNotes() — une seule ligne
tags: (note.tags || []).map((t) => this.tagRepository.resolveTag(t))

// TagRepository.resolveTag() — gère les formats string/objet/inconnu
resolveTag(raw) → vérifie le type, lookup getTagByName(), retourne un Tag
```

La logique de résolution est maintenant dans `TagRepository` (Expert en information), et `loadNotes()` se contente de déléguer.

> **En pratique :** on a déplacé la logique au bon endroit, mais `resolveTag()` ne nous satisfait pas complètement côté code. Le `any` dans la signature annule toute la sécurité de type de l'union, la même recherche `getTagByName()` est refaite dans deux cas très proches, et la logique reste assez tassée dans quelques lignes. Ça marche, mais ce n'est pas le genre de méthode qu'on lit facilement du premier coup. Ça rappelle aussi que les métriques disent surtout où placer les responsabilités, pas si le code est vraiment propre une fois écrit.

#### Recommandation non réalisée — Extraire `ExpirationScheduler`

On avait aussi envisagé d'extraire une classe `ExpirationScheduler` pour isoler la logique de planification. Sur le papier, l'idée reste défendable, surtout pour rendre l'architecture plus lisible. Mais dans le cadre du TP, on ne l'a pas retenue.

L'assistant IA a rejeté cette recommandation avec un argument métrique : la logique ne représente que 5 lignes, le WMC de `NoteManager` ne baisserait que d'un point (17→16), et le CBO du système augmenterait avec une nouvelle classe. D'après Isong & Obeten (2013), c'est justement le CBO qui est le meilleur prédicteur de fautes — donc augmenter le couplage pour une petite entorse au SRP ne serait pas un bon échange. L'IA a aussi signalé le risque de produire une **Lazy Class** au sens de Fowler.

En tant que développeurs, on n'est pas entièrement d'accord. Une classe `ExpirationScheduler` rend l'intention architecturale plus claire pour quelqu'un qui découvre le projet — c'est le genre de chose que les métriques ne capturent pas, mais qu'on voit tout de suite quand on navigue dans le code. On aurait préféré le faire, mais dans le cadre du TP on a priorisé les réusinages avec le plus d'impact mesurable. On garde l'idée comme piste d'évolution, surtout si la logique d'expiration venait à se complexifier.

#### Synthèse des réusinages proposés

| # | Réusinage | Statut | Heuristiques principales |
|---|---|---|---|
| #1a | Décomposition de `server.ts` en couches | Fait (`4d0d765`) | Contrôleur, SRP, Faible couplage |
| #1b | Introduction du patron Repository | Fait (`4d0d765`) | Indirection, DIP, Protection des variations |
| #1c | Séparation du module `notes.ts` | Fait (`4d0d765`) | SRP, Forte cohésion |
| #2 | Cohésion de `TagRepository` + correction du Feature Envy | Fait (PR #3) | Forte cohésion, SRP, Faible couplage, Expert en information |
| — | Extraire `ExpirationScheduler` | Non réalisé | SRP, Protection des variations |

---

### 3.3 Réalisation et vérification des améliorations

#### Amélioration manuelle

Les changements ont été réalisés via Pull Requests avec CI qui passe à chaque étape.

- **Réusinage #1** — restructuration architecturale complète : commit `4d0d765`
- **Réusinage #2** — amélioration de la cohésion de `TagRepository` + correction du Feature Envy : [PR #3](https://github.com/raphaelNguimbus/MGL843-tp1/pull/3)
- **Pipeline métriques CK** — mise à jour du script Pharo pour exporter toutes les métriques nécessaires : [PR #4](https://github.com/raphaelNguimbus/MGL843-tp1/pull/4)

#### Amélioration avec assistant IA

Les problèmes de la section 3.1 ont aussi été soumis à un assistant IA (Claude) pour comparer ses propositions avec les nôtres.

Deux branches ont été construites à partir de ces suggestions :
- **Branche de Dorian** : restructuration architecturale (`4d0d765`)
- **Branche de Pamela** : amélioration de `TagRepository` (PR #3, commit `17992cc`)

#### Comparaison des recommandations

| # | Recommandation | TP2 | IA | Commentaire |
|---|---|---|---|---|
| 1 | Extraire la persistance de `NoteManager` | ✅ | ✅ | Même direction |
| 2 | Décomposer `server.ts` | ✅ | ✅ | Même direction |
| 3 | Séparer le fichier `notes.ts` | ❌ | ✅ | Proposition de l’IA uniquement |
| 4 | Extraire `TagColorService` | ✅ | ✅ | Identique |
| 5 | Supprimer `recalculateUsageCounts(Note[])` | ⚠️ | ✅ | L’IA a été plus directe |
| 6 | Ajouter `resolveTag()` | ❌ | ✅ | Proposition de l’IA uniquement |
| 7 | Extraire `ExpirationScheduler` | ✅ | ❌ | Désaccord |

#### Analyse du désaccord sur `ExpirationScheduler`

C’est le principal point où notre jugement de développeurs diverge de celui de l’IA.

L’IA a rejeté l’extraction parce que le gain métrique semblait trop faible : peu de lignes, baisse limitée du WMC, et risque de créer une classe trop mince. C’est compréhensible.

De notre côté, on aurait quand même gardé cette extraction comme bonne direction architecturale. Même si les métriques ne bougent presque pas, une classe `ExpirationScheduler` rendrait l’intention plus claire pour quelqu’un qui découvre le projet. Donc ici, la différence vient surtout du fait que l’IA raisonne beaucoup par les métriques, alors qu’en développement on regarde aussi la lisibilité de l’architecture.

#### Régénération du modèle et des métriques

Après les réusinages, le modèle FamixTypeScript et les métriques ont été régénérés automatiquement dans le pipeline CI/CD.

- Workflow : `.github/workflows/analyse-ts-with-moose.yml`
- Script Pharo : `.github/pharo-metrics-export.st`
- Artefacts : `export_metrics.csv`, `model.json`

#### Questions

##### 1) Quels sont les changements dans les métriques après les changements réalisés ?

Les figures suivantes montrent l’état après réusinage :

![WMC vs CBO_out — après réusinage (TP3)](./visualization/tp3/fig-tp3-scatter.png)

![TCC — après réusinage (TP3)](./visualization/tp3/fig-tp3-tcc.png)

![Radar avant/après — NoteManager et TagRepository](./visualization/tp3/fig-tp3-radar-all.png)

Le point principal est que `NoteManager` et `TagRepository` ont réduit leur couplage sortant. `TagRepository` sort clairement d’une zone plus risquée sur l’axe du couplage. Les nouvelles classes créées restent petites et simples.

| Classe | Métrique | TP2 | TP3 | Changement |
|---|---|---:|---:|---|
| TagRepository | TCC | 0.045 | 0.073 | amélioration |
| TagRepository | CBO_out | 19 | 10 | réduction nette |
| TagRepository | SLOC | 132 | 111 | réduction |
| TagRepository | WMC | 20 | 24 | augmentation |
| NoteManager | CBO_out | 65 | 43 | réduction significative |
| NoteManager | TCC | 0.436 | 0.515 | amélioration |
| NoteManager | SLOC | 158 | 189 | augmentation |
| NoteManager | WMC | 17 | 20 | augmentation |
| TagColorService | — | n’existait pas | SLOC=23, WMC=1, CBO_out=0 | nouvelle classe simple |

Les hausses de WMC sont à surveiller, mais elles ne racontent pas toute l’histoire :

- **TagRepository (20 → 24)** : `resolveTag()` ajoute des branchements, donc la complexité monte un peu.
- **NoteManager (17 → 20)** : on pense que c’est en partie un artefact lié à la réorganisation des fichiers et à la manière dont `ts2famix` compte la complexité.

##### 2) Les changements ont-ils amélioré la qualité du projet de manière mesurable ? Pourquoi ?

Oui, globalement oui.

Le meilleur signal est la baisse du CBO_out :
- `NoteManager` : `65 → 43`
- `TagRepository` : `19 → 10`

C’est important parce que le couplage sortant est un vrai facteur de fragilité. Après les changements, les dépendances sont mieux réparties et moins directes.

La cohésion s’améliore aussi :
- `TagRepository` : `0.045 → 0.073`
- `NoteManager` : `0.436 → 0.515`

Ce n’est pas spectaculaire dans tous les cas, mais la tendance est bonne. `TagRepository` reste imparfait, mais il est moins dispersé qu’avant.

Pour `SLOC`, on voit surtout une redistribution : on a déplacé une partie du travail vers des classes plus petites comme `TagColorService`. Donc même si tout ne baisse pas partout, l’organisation est meilleure et plus propre à maintenir.

##### 3) Comment les améliorations de l’assistant IA se comparent-elles à vos propres changements ? Ont-elles été plus faciles ? Pourquoi ou pourquoi pas ?

L’assistant IA a suivi une bonne partie de notre direction, mais avec des propositions plus précises. Sur la persistance, la séparation en couches et l’extraction de `TagColorService`, on est arrivés à peu près au même résultat.

L’IA a aussi vu deux choses qu’on n’avait pas explicitement formulées dans le TP2 : le problème du gros fichier `notes.ts` et le Feature Envy dans `loadNotes()`. Sur ces points, son apport a été utile.

Par contre, elle a rejeté `ExpirationScheduler`, alors que nous on considère encore que ce serait un bon choix pour la lisibilité du projet. Donc l’IA aide bien pour repérer et structurer les idées, mais il faut garder une validation humaine. Elle optimise vite, mais pas toujours selon les mêmes critères qu’une équipe de dev.

Oui, l’approche IA a été plus rapide. Le plan de réusinage est sorti beaucoup plus vite que notre analyse manuelle. Mais au final, il faut quand même relire, filtrer et décider. Donc plus rapide, oui. Plus autonome, pas vraiment.
