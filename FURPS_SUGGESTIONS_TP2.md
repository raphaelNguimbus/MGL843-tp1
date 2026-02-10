# Suggestions d'exigences FURPS pour TP2

Ce document présente des suggestions de nouvelles exigences FURPS à ajouter au projet Notes CLI pour le TP2.

---

## 📋 Table des matières

- [F - Fonctionnalité (Functionality)](#f---fonctionnalité-functionality)
- [U - Convivialité (Usability)](#u---convivialité-usability)
- [R - Fiabilité (Reliability)](#r---fiabilité-reliability)
- [P - Performance](#p---performance)
- [S - Supportabilité (Supportability)](#s---supportabilité-supportability)
- [Recommandation finale](#-recommandation-finale)

---

## F - Fonctionnalité (Functionality)

### 1. Catégories/Dossiers hiérarchiques

**Exigence** : "Les utilisateurs doivent pouvoir organiser les notes dans des catégories/dossiers hiérarchiques"

**Justification** :
- Ajoute une fonctionnalité significative
- Nécessite des changements au modèle de données
- Nouvelles commandes : `category create`, `category list`, `move <note-id> <category>`
- Logique de recherche plus complexe

**Validation** :
- Tests unitaires pour les opérations de catégories
- Tests E2E pour les nouvelles commandes
- Tests d'intégration pour les relations note-catégorie

**Impact sur la complexité** :
- Nouveau modèle de données pour Category
- Relations hiérarchiques parent-enfant
- Migration des notes existantes
- Affichage arborescent dans le CLI

---

### 2. Historique et annulation (Undo/Redo)

**Exigence** : "Le système doit permettre d'annuler et de refaire les dernières opérations (create, delete, tag)"

**Justification** :
- Fonctionnalité avancée demandée par les utilisateurs
- Nécessite un système de gestion d'historique (pattern Command)
- Augmente la complexité de l'architecture

**Validation** :
- Tests pour chaque opération annulable
- Tests de séquences undo/redo multiples
- Tests des limites de l'historique

**Impact sur la complexité** :
- Implémentation du pattern Command
- Stack pour l'historique des opérations
- Sérialisation/désérialisation des commandes
- Nouvelles commandes : `undo`, `redo`, `history`

---

### 3. Rappels et dates d'échéance

**Exigence** : "Les notes doivent pouvoir avoir des dates d'échéance et le système doit afficher les notes urgentes"

**Justification** :
- Nouvelle dimension temporelle aux notes
- Commandes : `remind <note-id> <date>`, `upcoming`, `overdue`
- Logique de tri et filtrage par date

**Validation** :
- Tests avec différentes dates (passées, futures, aujourd'hui)
- Tests de formatage de dates
- Tests de rappels multiples

**Impact sur la complexité** :
- Ajout du champ `dueDate` au modèle Note
- Parsing et validation de dates
- Logique de tri chronologique
- Calcul des dates relatives (aujourd'hui, demain, dans 7 jours)

---

## U - Convivialité (Usability)

### 1. Mode interactif avec autocomplétion

**Exigence** : "Le système doit fournir un mode interactif avec autocomplétion pour les commandes et les IDs de notes"

**Justification** :
- Améliore l'expérience utilisateur
- Nécessite une nouvelle couche UI (inquirer.js ou similaire)
- Peut être testé avec des entrées/sorties simulées

**Validation** :
- Tests avec des entrées utilisateur simulées
- Vérifier les suggestions d'autocomplétion
- Tests de navigation dans l'historique des commandes

**Impact sur la complexité** :
- Intégration de bibliothèque interactive (inquirer, prompts)
- Mode REPL (Read-Eval-Print Loop)
- Système d'autocomplétion dynamique
- Gestion de l'historique de session

---

### 2. Formatage et coloration de la sortie

**Exigence** : "La sortie CLI doit être formatée avec des couleurs, des icônes et un affichage tabulaire pour améliorer la lisibilité"

**Justification** :
- Améliore la lisibilité et l'expérience utilisateur
- Utilisation de bibliothèques comme chalk, cli-table3
- Options de configuration pour désactiver les couleurs

**Validation** :
- Tests de snapshot pour vérifier le formatage
- Tests avec/sans couleurs activées
- Tests d'affichage pour différentes tailles de terminal

**Impact sur la complexité** :
- Intégration de chalk pour les couleurs
- Intégration de cli-table3 pour les tableaux
- Détection du support des couleurs du terminal
- Option `--no-color` pour désactiver

---

### 3. Aide contextuelle améliorée

**Exigence** : "Le système doit fournir des exemples et des suggestions pour chaque commande via --help"

**Justification** :
- Facilite l'apprentissage de l'outil
- Documentation intégrée
- Exemples d'utilisation courants

**Validation** :
- Tests que chaque commande a une aide complète
- Vérifier la présence d'exemples
- Tests de formatage de l'aide

**Impact sur la complexité** :
- Extension de la configuration Commander.js
- Ajout d'exemples pour chaque commande
- Système de templates pour l'aide
- Tests de documentation

---

## R - Fiabilité (Reliability)

### 1. Récupération après corruption de données ⭐ RECOMMANDÉ

**Exigence** : "Le système doit récupérer gracieusement des fichiers JSON corrompus et préserver les données valides"

**Justification** :
- Teste la robustesse de la gestion d'erreurs
- Nécessite des mécanismes de sauvegarde/récupération
- Ajoute de la logique de validation

**Validation** :
- Tests avec des fichiers JSON intentionnellement corrompus
- Vérifier que le système ne plante pas
- Vérifier que les notes valides sont préservées
- Vérifier la création automatique de sauvegardes

**Impact sur la complexité** :
- Système de sauvegarde automatique (notes.json.bak)
- Validation du JSON avant parsing
- Récupération partielle des données valides
- Logging des erreurs de corruption
- Mécanisme de rollback

**Tests à implémenter** :
```typescript
// Exemple de test
test('should recover from corrupted JSON', () => {
  // Créer un fichier JSON corrompu
  fs.writeFileSync('notes.json', '{"id": "1", "content": "test"');
  
  // Le système doit charger depuis le backup
  const notes = noteManager.loadNotes();
  
  // Vérifier que les données du backup sont chargées
  expect(notes.length).toBeGreaterThan(0);
});
```

---

### 2. Sécurité des accès concurrents

**Exigence** : "Le système doit prévenir la perte de données lorsque plusieurs instances CLI s'exécutent simultanément"

**Justification** :
- Préoccupation de fiabilité réelle
- Nécessite un mécanisme de verrouillage de fichiers
- Teste les conditions de concurrence

**Validation** :
- Tests avec plusieurs processus concurrents
- Vérifier qu'il n'y a pas de perte de données
- Tests des scénarios de timeout de verrouillage

**Impact sur la complexité** :
- Implémentation de file locking (lockfile, proper-lockfile)
- Gestion des timeouts de verrous
- Retry logic avec backoff exponentiel
- Détection de verrous orphelins (stale locks)

---

### 3. Validation des données et intégrité

**Exigence** : "Le système doit valider toutes les entrées et maintenir l'intégrité référentielle entre les notes et les tags"

**Justification** :
- Prévient les états invalides
- Nécessite des validateurs et des schémas
- Tests de cas limites et d'erreurs

**Validation** :
- Tests avec des entrées invalides (contenu vide, IDs inexistants)
- Tests de contraintes d'intégrité
- Tests de messages d'erreur appropriés

**Impact sur la complexité** :
- Schéma de validation (Zod, Joi, class-validator)
- Validation à chaque point d'entrée
- Messages d'erreur descriptifs
- Sanitization des entrées utilisateur

---

## P - Performance

### 1. Recherche rapide avec indexation ⭐ RECOMMANDÉ

**Exigence** : "Le système doit retourner les résultats de recherche en moins de 100ms pour des bases de données allant jusqu'à 10 000 notes"

**Justification** :
- Mesurable avec des tests de performance
- Nécessite une refonte de l'algorithme de recherche (peut-être ajouter un index)
- Augmente la complexité (nouvelles structures de données)

**Validation** :
- Créer un test de performance qui charge 10 000 notes
- Mesurer le temps d'exécution de la recherche
- Assert temps < 100ms

**Impact sur la complexité** :
- Index inversé pour la recherche de texte
- Index pour les tags (Map<tag, Set<noteId>>)
- Mise à jour des index lors des modifications
- Sérialisation/désérialisation des index
- Cache en mémoire

**Tests à implémenter** :
```typescript
test('search performance with 10000 notes', () => {
  // Générer 10 000 notes
  for (let i = 0; i < 10000; i++) {
    noteManager.addNote(`Note ${i}`, [`tag${i % 100}`]);
  }
  
  // Mesurer le temps de recherche
  const startTime = performance.now();
  const results = noteManager.searchNotes('Note 5000');
  const endTime = performance.now();
  
  expect(endTime - startTime).toBeLessThan(100);
  expect(results.length).toBeGreaterThan(0);
});
```

---

### 2. Export efficace de gros fichiers

**Exigence** : "Le système doit exporter 10 000+ notes en utilisant le streaming pour éviter le débordement de mémoire"

**Justification** :
- Adresse la scalabilité
- Nécessite l'implémentation de streaming/chunking
- Utilisation mémoire mesurable

**Validation** :
- Test de performance avec de grands ensembles de données
- Surveiller l'utilisation de la mémoire pendant l'export
- Assert que la mémoire reste sous un seuil défini

**Impact sur la complexité** :
- Utilisation de streams Node.js
- Export par chunks (batch processing)
- Monitoring de la mémoire
- Support de différents formats (JSON, CSV, Markdown)

---

### 3. Chargement paresseux (Lazy Loading)

**Exigence** : "Le système doit charger les notes de manière incrémentielle pour améliorer le temps de démarrage avec de grandes bases de données"

**Justification** :
- Améliore la réactivité pour les grandes bases de données
- Nécessite une pagination ou un chargement à la demande
- Impact mesurable sur le temps de démarrage

**Validation** :
- Tests de temps de démarrage avec 0, 1000, 10000 notes
- Mesurer le temps jusqu'à la première note affichée
- Tests de pagination

**Impact sur la complexité** :
- Architecture de chargement différé
- Pagination des résultats
- Options `--limit` et `--offset`
- Cache avec invalidation

---

## S - Supportabilité (Supportability)

### 1. Fichier de configuration

**Exigence** : "Le système doit supporter un fichier de configuration (.notesrc) pour personnaliser les chemins, les formats et les préférences"

**Justification** :
- Améliore la configurabilité
- Nécessite un système de gestion de configuration
- Tests de différentes configurations

**Validation** :
- Tests avec différentes configurations
- Tests de valeurs par défaut
- Tests de validation de configuration invalide

**Impact sur la complexité** :
- Parsing de fichier de config (JSON, YAML, TOML)
- Recherche de config dans plusieurs emplacements
- Merge des configs (defaults < user config < env vars < CLI args)
- Validation du schéma de configuration

---

### 2. Logs et mode debug

**Exigence** : "Le système doit fournir un mode verbeux/debug avec logging détaillé pour le diagnostic"

**Justification** :
- Facilite le débogage et la maintenance
- Nécessite un système de logging (winston, pino)
- Différents niveaux de log (error, warn, info, debug)

**Validation** :
- Tests que les logs sont générés aux bons niveaux
- Tests de rotation des logs
- Tests du mode verbeux

**Impact sur la complexité** :
- Intégration de bibliothèque de logging
- Configuration des niveaux de log
- Option `--verbose` ou `--debug`
- Logs dans des fichiers séparés

---

### 3. Plugin/Extension system

**Exigence** : "Le système doit permettre le chargement de plugins externes pour étendre les fonctionnalités"

**Justification** :
- Architecture extensible
- Nécessite un système de découverte et chargement de plugins
- Pattern d'architecture avancé

**Validation** :
- Tests de chargement de plugins
- Tests d'isolation des plugins
- Tests de gestion d'erreurs de plugins

**Impact sur la complexité** :
- Système de hooks/événements
- API publique pour les plugins
- Découverte automatique de plugins
- Sandboxing et sécurité
- Documentation API pour développeurs de plugins

---

## 🎯 Recommandation finale

Pour le TP2, je recommande d'implémenter **ces 3 exigences** :

### ✅ 1. Performance - Recherche rapide avec indexation
- **Catégorie** : Performance (P)
- **Difficulté** : Moyenne
- **Impact** : Haute complexité technique, métriques claires
- **Tests** : Tests de performance automatisés avec assertions de temps

### ✅ 2. Fiabilité - Récupération après corruption de données
- **Catégorie** : Reliability (R)
- **Difficulté** : Moyenne
- **Impact** : Gestion d'erreurs robuste, mécanismes de backup
- **Tests** : Tests avec fichiers corrompus, vérification de la récupération

### ✅ 3. Fonctionnalité - Catégories/Dossiers hiérarchiques
- **Catégorie** : Functionality (F)
- **Difficulté** : Élevée
- **Impact** : Changement architectural majeur, nouveau modèle de données
- **Tests** : Tests unitaires, E2E et d'intégration

---

## 💡 Pourquoi cette combinaison ?

1. **Couvre 3 catégories FURPS différentes** (F, P, R)
2. **Équilibre de complexité** : facile → moyenne → élevée
3. **Toutes sont testables** avec des tests automatisés
4. **Impact architectural significatif** : justifie l'analyse de métriques dans Moose
5. **Répond aux critères du TP2** :
   - Augmente la complexité du projet ✓
   - Nécessite des tests de validation ✓
   - Affecte la conception de manière mesurable ✓
   - Génère des métriques intéressantes pour l'analyse ✓

---

## 📊 Impact attendu sur les métriques

Après l'implémentation de ces 3 exigences, vous devriez observer :

- **Augmentation du nombre de classes** : +5-7 classes (Category, Index, BackupManager, etc.)
- **Augmentation de la complexité cyclomatique** : logique de recherche, validation, récupération
- **Nouveaux couplages** : relations entre Note-Category, Note-Index
- **Augmentation de la cohésion** : classes spécialisées avec responsabilités claires
- **Plus de méthodes** : nouvelles opérations CRUD pour catégories
- **Profondeur d'héritage** : possiblement si vous utilisez des classes abstraites

Ces changements fourniront une base riche pour l'analyse de qualité dans Moose/Roassal !

---

## 📝 Prochaines étapes

1. **Valider ces exigences** avec votre enseignant
2. **Créer des issues GitHub** pour chaque exigence
3. **Implémenter avec TDD** : tests d'abord, puis implémentation
4. **Documenter les changements** architecturaux
5. **Générer le modèle FamixTypeScript** avec ts2famix
6. **Analyser dans Moose** et visualiser les métriques

Bon courage pour le TP2 ! 🚀
