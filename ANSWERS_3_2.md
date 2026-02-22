# Réponses — Section 3.2 : Visualiser les métriques du projet TypeScript

---

## Q1 — Expliquez les métriques que vous avez choisies. Pourquoi sont-elles importantes pour évaluer la qualité de la conception ?

Basé sur les notes de cours (sem3) et en suivant la chaîne M1→M4 de Budgen (2003) — qui relie les attributs de qualité FURPS aux métriques mesurables — nous avons retenu les métriques suivantes :

| Métrique | Attribut FURPS | Justification |
|---|---|---|
| **SLOC** (Source Lines of Code) | Supportability | Métrique de taille la plus simple. Meilleur prédicteur empirique de fautes selon Zhou, Xu & Leung (2010) — plus une classe est grande, plus elle est susceptible de contenir des défauts. |
| **WMC** (Weighted Methods per Class) | Reliability | Somme des complexités cyclomatiques (CC) de chaque méthode. Deuxième meilleur prédicteur de fautes (Chidamber & Kemerer, 1994). Une valeur élevée indique une classe difficile à comprendre, tester et maintenir. |
| **CBO** (Coupling Between Objects) | Supportability | Mesure le couplage entre classes. Un CBO élevé rend une classe difficile à modifier sans effets de bord — directement lié au principe de Faible Couplage (GRASP). |
| **RFC** (Response For a Class) | Reliability + Testability | Nombre de méthodes susceptibles d'être exécutées en réponse à un message. Un RFC élevé augmente la complexité des tests unitaires nécessaires. |
| **TCC** (Tight Class Cohesion) | Reliability | Ratio des paires de méthodes partageant au moins un attribut. Mesure la cohésion interne d'une classe — directement lié au principe de Forte Cohésion (GRASP). Variante moderne de LCOM (Bieman & Kang, 1995), plus robuste que l'original car moins sensible aux accesseurs. |

Ces cinq métriques forment un ensemble cohérent : elles sont toutes **extractables statiquement** depuis le modèle Famix généré par ts2famix, sans nécessiter l'exécution du code. Elles couvrent les trois dimensions clés de la qualité de conception : **taille** (SLOC), **complexité** (WMC, RFC), et **structure** (CBO, TCC).

**Métriques exclues et pourquoi :**
- **NOC / DIT** : Pas d'héritage dans le projet — valeurs uniformément à 0, donc non révélatrices.
- **LCOM original** : Métrique la plus controversée de la suite CK (Isong & Obeten, 2013) — les accesseurs comme `getTagRepository()` l'inflatent artificiellement. Remplacé par TCC.
- **Couverture de tests, densité de bugs, temps de réponse** : Métriques dynamiques ou historiques — hors portée d'une analyse statique avec Moose.

---

## Q2 — Si vous avez dû calculer des métriques supplémentaires, expliquez comment vous les avez calculées.

Une seule métrique n'était pas directement disponible dans le modèle Famix : le RFC. WMC et TCC sont disponibles nativement dans Moose via `weightedMethodCount` et `tightClassCohesion` — aucun calcul supplémentaire n'était nécessaire pour ces deux métriques.

### RFC (Response For a Class)

RFC a été calculé en additionnant le nombre de méthodes propres à la classe et le nombre de méthodes externes distinctes appelées. Conformément à la définition CK, les méthodes appelées ont été dédupliquées via un `asSet` :

```smalltalk
distinctCalledMethods := (c outgoingInvocations collect: [:i | i candidates]) flatten asSet.
rfc := c methods size + distinctCalledMethods size.
```

Nous avons vérifié que la formule simplifiée sans déduplication donnait les mêmes résultats sur notre projet, confirmant que chaque méthode externe n'est appelée qu'une seule fois par classe.

### Export complet en CSV

L'ensemble des métriques a été exporté dans `notes-cli-classes-tp2.csv` via le script Pharo suivant :

```smalltalk
| model csv |
model := MooseModel root first.

csv := String new writeStream.
csv nextPutAll: 'ClassName,SLOC,NumberOfMethods,WMC,CBO_in,CBO_out,RFC,TCC'.
csv nextPut: Character lf.

model allModelClasses do: [:c |
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
    row add: c tightClassCohesion.
    csv nextPutAll: (row inject: '' into: [:acc :val |
        acc isEmpty ifTrue: [val printString] ifFalse: [acc , ',' , val printString]]).
    csv nextPut: Character lf.
].

'notes-cli-classes-tp2.csv' asFileReference writeStreamDo: [:s |
    s nextPutAll: csv contents.
].
```

---

## Q3 — Quelles sont les éléments remarquables dans le projet ? Comment les avez-vous identifiés ?

L'analyse des métriques extraites de Moose et visualisées avec Roassal (Pharo) et Python (Matplotlib) a permis d'identifier les éléments suivants comme remarquables :

### `NoteManager` — Classe la plus complexe et la plus couplée

Identifiée grâce à :
- **SLOC = 158** — la plus grande classe (visible dans `fig-tp2-sloc.png` et dans la visualisation Roassal)
- **WMC = 17** — deuxième complexité globale (`fig-tp2-wmc.png`)
- **CBO_out = 65** — couplage sortant le plus élevé (`fig-tp2-cbo.png`)
- **RFC = 11** — complexité de test élevée (`fig-tp2-rfc.png`)
- **Scatter WMC vs CBO_out** — positionnée dans la zone à risque en haut à droite (`fig-tp2-scatter.png`)

En TP1, `NoteManager` était déjà la classe remarquable avec 8 méthodes. En TP2, elle a été étendue à 11 méthodes pour supporter l'expiration, la récurrence et l'interface web — ce qui a accentué tous ses indicateurs.

### `TagRepository` — Nouvelle classe TP2, complexité sous-estimée

Identifiée grâce à :
- **WMC = 20** — la complexité globale la plus élevée de toutes les classes (`fig-tp2-wmc.png`)
- **SLOC = 132** — deuxième plus grande classe
- **TCC = 0.045** — cohésion très faible malgré 12 méthodes et 3 attributs (`fig-tp2-tcc.png`)
- **RFC = 12** — la plus difficile à tester

Introduite pour séparer la gestion des tags de `NoteManager` (bonne décision architecturale), `TagRepository` présente néanmoins une cohésion interne très faible — ses méthodes partagent peu d'attributs entre elles, ce qui suggère qu'elle pourrait être subdivisée.

### `NotesCLI` — Complexité cachée

Identifiée grâce à :
- **CBO_out = 46** — très élevé pour une classe de seulement 3 méthodes
- **TCC = 1.333** — valeur anormalement supérieure à 1, ce qui est mathématiquement impossible pour un ratio standard. Probablement un artefact de parsing lié à l'interprétation des arrow functions par ts2famix — non représentatif de la cohésion réelle
- **WMC = 1** — apparemment simple, mais la méthode `configure` (72 SLOC) cache sa complexité dans des arrow functions imbriquées dont la CC n'est pas comptabilisée au niveau de la classe

### `Tag` — Classe saine

- **SLOC = 14**, **WMC = 1**, **CBO_out = 0**, **RFC = 3** — tous les indicateurs au minimum
- Positionné en bas à gauche du scatter — aucun risque de conception

---

## Q4 — Expliquez le rôle de ces éléments dans le projet. Pourquoi sont-ils importants ?

| Élément | Rôle | Importance |
|---|---|---|
| **`Tag`** | Modèle de données simple représentant une étiquette (nom + couleur). Sérialisable en JSON. | Brique de base partagée par toutes les autres classes. |
| **`NoteManager`** | Logique métier centrale — gère le cycle de vie complet des notes (CRUD, recherche, export, expiration). Persiste les données dans `notes_db.json`. | Point névralgique du système — toute opération sur les notes passe par elle. |
| **`TagRepository`** *(nouveau TP2)* | Gère le cycle de vie des tags indépendamment des notes — création, couleurs, compteurs d'usage, CRUD. Persiste dans `tags.json`. | Introduit pour appliquer le principe de Séparation des Responsabilités (SRP) — retire la gestion des tags de `NoteManager`. |
| **`NotesCLI`** | Point d'entrée de l'interface CLI — configure les commandes via `commander` et délègue à `NoteManager`. | Contrôleur (GRASP) de l'interface en ligne de commande. |
| **`server.ts`** *(module TP2)* | Expose l'API REST (Express.js), démarre le serveur sur le port 3000, lance le planificateur de suppression automatique des notes expirées (toutes les 5 secondes). | Contrôleur (GRASP) de l'interface web — point d'entrée HTTP du système. |
| **`public/app.js`** *(module TP2)* | Interface graphique web — gère les interactions utilisateur, les appels API REST, et la manipulation du DOM. | Couche de présentation — seul point de contact entre l'utilisateur web et le système. |

---

## Q5 — Commentez sur la qualité de la conception du projet. Y a-t-il des éléments qui semblent mal conçus ? Pourquoi ?

L'analyse des métriques révèle plusieurs problèmes de conception, que nous mettons en correspondance avec les heuristiques vues en cours (sem4) :

### `NoteManager` — Violations de SRP et de l'Expert en Information (GRASP)

`NoteManager` cumule deux responsabilités distinctes : la **persistance** (lecture/écriture du fichier JSON) et la **logique métier** (ajout, recherche, expiration des notes). Cela viole le **Principe de Responsabilité Unique** (SRP — SOLID) et l'heuristique de **Forte Cohésion** (GRASP).

De plus, `loadNotes()` relit le fichier JSON à chaque opération — une violation de l'**Expert en Information** (GRASP) qui préconise que la classe possédant les données les maintienne en mémoire (caching) plutôt que de les relire systématiquement depuis le disque.

Ces problèmes sont confirmés par les métriques : **WMC=17**, **CBO_out=65**, **SLOC=158** — tous élevés, et 0% de couverture de tests directs malgré une RFC=11 qui indique une complexité de test significative.

### `TagRepository` — Faible Cohésion malgré une bonne intention

L'extraction de `TagRepository` depuis `NoteManager` est une **bonne décision architecturale** — elle applique le principe de **Composition > Héritage** (heuristique 3.3) et réduit les responsabilités de `NoteManager`. Cependant, le **TCC = 0.045** indique une cohésion interne très faible : ses 12 méthodes partagent peu d'attributs entre elles, ce qui suggère que `TagRepository` regroupe des responsabilités hétérogènes (gestion des couleurs, compteurs d'usage, persistance, CRUD) qui pourraient être mieux séparées.

### `NoteManager` — Signe d'une God Class émergente (TP1 → TP2)

Entre TP1 et TP2, `NoteManager` est passée de **8 à 11 méthodes** (+37%). Cette croissance n'est pas anodine — au lieu d'extraire les nouvelles responsabilités (expiration, récurrence) dans des classes dédiées, elles ont été ajoutées directement à `NoteManager`. C'est un signal classique d'une **God Class** en formation : une classe qui grossit à chaque itération parce qu'elle est le point de moindre résistance pour ajouter du comportement. La création de `TagRepository` montre que l'équipe a conscience du problème, mais la logique d'expiration et de récurrence aurait mérité le même traitement.

### `server.ts` — Violation de Forte Cohésion et du Contrôleur (GRASP)

`server.ts` mélange trois responsabilités : le **routage HTTP**, la **validation des données**, et des éléments de **logique métier** (ex: recalcul des compteurs au démarrage). Le patron **Contrôleur** (GRASP) préconise que le contrôleur délègue sans implémenter la logique — ce n'est pas le cas ici. Une architecture en couches (routes → services → repository) aurait mieux séparé ces responsabilités.

Un exemple concret de dette technique visible dans `server.ts` : au démarrage du serveur, `recalculateUsageCounts()` est appelé systématiquement pour recalculer tous les compteurs d'usage des tags à partir de l'ensemble des notes :

```typescript
const tagRepo = noteManager.getTagRepository();
tagRepo.recalculateUsageCounts(noteManager.listNotes());
```

Ce recalcul compensatoire est un **design smell** — il indique que l'état entre `NoteManager` et `TagRepository` peut devenir incohérent lors des opérations normales (ajout, suppression, modification de notes). Au lieu de corriger la cause racine (maintenir les compteurs à jour de façon atomique lors de chaque opération), le code "répare" l'état au démarrage. Cela viole l'**Expert en Information** (GRASP) : la classe qui possède les données devrait garantir leur cohérence à tout moment, pas seulement à l'initialisation.

### `public/app.js` — Mélange de responsabilités

Comme mentionné, `app.js` mélange manipulation du DOM, appels API, gestion de l'état et mise à jour du style dans un seul fichier — une violation de **Forte Cohésion** (GRASP). L'utilisation d'un framework frontend (React, Vue.js) ou d'une architecture MVC côté client aurait permis une meilleure séparation.

### Point positif — `Tag`

`Tag` est un exemple de classe bien conçue : simple, cohésive, sans couplage sortant. Elle respecte pleinement les principes de **Faible Couplage** et **Forte Cohésion** (GRASP), confirmés par ses métriques (WMC=1, CBO_out=0, RFC=3).

---

## Références

- Budgen, D. (2003). *Software Design* (2e éd.). Addison-Wesley.
- Chidamber, S.R. & Kemerer, C.F. (1994). A metrics suite for object oriented design. *IEEE Transactions on Software Engineering*, 20(6), 476–493.
- Zhou, Y., Xu, B. & Leung, H. (2010). On the ability of complexity metrics to predict fault-prone classes in object-oriented systems. *Journal of Systems and Software*, 83(4), 660–674.
- McCabe, T.J. (1976). A complexity measure. *IEEE Transactions on Software Engineering*, SE-2(4), 308–320.
- Isong, B. & Obeten, O. (2013). A systematic approach for evaluating and selecting object-oriented metrics. *International Journal of Information Technology and Computer Science*.
- Bieman, J.M. & Kang, B.K. (1995). Cohesion and reuse in an object-oriented system. *ACM SIGSOFT Software Engineering Notes*, 20, 259–262.
