# Guide TDD et Analyse de Métriques - TP2

Ce document explique comment appliquer le TDD (Test Driven Development) et analyser les métriques de qualité.

---

## Table des matières

1. [TDD - Approche Test-First](#tdd---approche-test-first)
2. [Exemple 1: Recherche rapide avec indexation (Performance)](#exemple-1-recherche-rapide-avec-indexation-performance)
3. [Exemple 2: Récupération après corruption (Fiabilité)](#exemple-2-récupération-après-corruption-fiabilité)
4. [Exemple 3: Catégories hiérarchiques (Fonctionnalité)](#exemple-3-catégories-hiérarchiques-fonctionnalité)
5. [Métriques de qualité - Quoi analyser?](#métriques-de-qualité---quoi-analyser)
6. [Comment analyser les métriques dans Moose](#comment-analyser-les-métriques-dans-moose)

---

## TDD - Approche Test-First

### Le cycle TDD (Red-Green-Refactor)

```
┌─────────────────────────────────────────────────────┐
│ 1. RED: Écrire un test qui échoue                  │
│    (la fonctionnalité n'existe pas encore)          │
└────────────────┬────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────┐
│ 2. GREEN: Écrire le minimum de code pour faire      │
│    passer le test                                    │
└────────────────┬────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────┐
│ 3. REFACTOR: Améliorer le code sans changer le      │
│    comportement (les tests restent verts)           │
└────────────────┬────────────────────────────────────┘
                 ↓
                Répéter pour chaque nouvelle fonctionnalité
```

### Pourquoi TDD?

✅ **Avantages pour le TP2:**
- Garantit que votre code est testable (important pour les métriques)
- Documentation vivante de ce que fait le code
- Confiance lors du refactoring
- Couverture de tests élevée (métrique de qualité!)

---

## Exemple 1: Recherche rapide avec indexation (Performance)

### Exigence
"Le système doit retourner les résultats de recherche en moins de 100ms pour des bases de données allant jusqu'à 10 000 notes"

---

### ÉTAPE 1: RED - Écrire les tests qui échouent ❌

Créer le fichier: `tests/performance.test.ts`

```typescript
import { NoteManager } from '../src/notes';
import { performance } from 'perf_hooks';
import fs from 'fs';

describe('Performance - Search with Indexing', () => {
    let noteManager: NoteManager;
    const TEST_FILE = 'test-performance-notes.json';

    beforeEach(() => {
        // Nettoyer avant chaque test
        if (fs.existsSync(TEST_FILE)) {
            fs.unlinkSync(TEST_FILE);
        }
        noteManager = new NoteManager(TEST_FILE);
    });

    afterEach(() => {
        // Nettoyer après chaque test
        if (fs.existsSync(TEST_FILE)) {
            fs.unlinkSync(TEST_FILE);
        }
    });

    // TEST 1: Vérifier que l'index est créé
    test('should create search index when notes are added', () => {
        noteManager.addNote('Test note', ['tag1']);
        
        // L'index devrait exister (on va l'implémenter)
        const index = noteManager.getSearchIndex();
        
        expect(index).toBeDefined();
        expect(index.has('test')).toBe(true);
        expect(index.has('note')).toBe(true);
        expect(index.has('tag1')).toBe(true);
    });

    // TEST 2: Performance avec 10,000 notes
    test('should search through 10000 notes in less than 100ms', () => {
        // Générer 10,000 notes
        console.log('Generating 10000 notes...');
        for (let i = 0; i < 10000; i++) {
            noteManager.addNote(
                `Note number ${i} with some content about topic ${i % 100}`,
                [`tag${i % 50}`, `category${i % 10}`]
            );
        }
        console.log('Notes generated. Starting search test...');

        // Mesurer le temps de recherche
        const startTime = performance.now();
        const results = noteManager.searchNotes('topic 42');
        const endTime = performance.now();
        const duration = endTime - startTime;

        console.log(`Search took ${duration.toFixed(2)}ms`);
        console.log(`Found ${results.length} results`);

        // Assertions
        expect(duration).toBeLessThan(100);
        expect(results.length).toBeGreaterThan(0);
        expect(results.some(n => n.content.includes('topic 42'))).toBe(true);
    });

    // TEST 3: Performance de recherche par tag
    test('should search by tag in less than 50ms', () => {
        // Générer 5,000 notes avec tags
        for (let i = 0; i < 5000; i++) {
            noteManager.addNote(`Note ${i}`, [`tag${i % 100}`]);
        }

        const startTime = performance.now();
        const results = noteManager.searchNotes('tag42');
        const endTime = performance.now();
        const duration = endTime - startTime;

        console.log(`Tag search took ${duration.toFixed(2)}ms`);

        expect(duration).toBeLessThan(50);
        expect(results.length).toBe(50); // 5000 / 100 = 50 notes avec tag42
    });

    // TEST 4: L'index doit être mis à jour lors de l'ajout de tags
    test('should update index when tags are added to existing note', () => {
        const note = noteManager.addNote('Original content', ['original']);
        
        noteManager.addTags(note.id, ['newtag']);
        
        const index = noteManager.getSearchIndex();
        expect(index.has('newtag')).toBe(true);
        
        // Recherche doit trouver la note avec le nouveau tag
        const results = noteManager.searchNotes('newtag');
        expect(results.length).toBe(1);
        expect(results[0].id).toBe(note.id);
    });
});
```

**Lancer les tests:**
```bash
npm test -- tests/performance.test.ts
```

**Résultat attendu:** ❌ Tous les tests échouent (c'est normal! C'est le RED)

```
FAIL tests/performance.test.ts
  ● Performance - Search with Indexing › should create search index when notes are added
    TypeError: noteManager.getSearchIndex is not a function
```

---

### ÉTAPE 2: GREEN - Implémenter le minimum pour faire passer les tests ✅

Modifier: `src/notes.ts`

```typescript
import fs from 'fs';
import path from 'path';

export class Tag {
    constructor(public name: string) { }
    toString(): string { return this.name; }
    toJSON(): string { return this.name; }
}

export interface Note {
    id: string;
    content: string;
    tags: Tag[];
    createdAt: string;
}

// Nouvelle classe pour gérer l'index de recherche
class SearchIndex {
    // Map: mot -> Set de note IDs
    private wordToNoteIds: Map<string, Set<string>>;
    
    constructor() {
        this.wordToNoteIds = new Map();
    }

    // Ajouter une note à l'index
    addNote(note: Note): void {
        const words = this.extractWords(note);
        
        words.forEach(word => {
            if (!this.wordToNoteIds.has(word)) {
                this.wordToNoteIds.set(word, new Set());
            }
            this.wordToNoteIds.get(word)!.add(note.id);
        });
    }

    // Extraire tous les mots d'une note (contenu + tags)
    private extractWords(note: Note): string[] {
        const words: string[] = [];
        
        // Mots du contenu
        const contentWords = note.content
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ') // Enlever la ponctuation
            .split(/\s+/)
            .filter(w => w.length > 0);
        words.push(...contentWords);
        
        // Tags
        note.tags.forEach(tag => {
            words.push(tag.name.toLowerCase());
        });
        
        return words;
    }

    // Rechercher des note IDs par mot
    search(query: string): Set<string> {
        const queryWords = query
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 0);
        
        if (queryWords.length === 0) {
            return new Set();
        }

        // Intersection des résultats pour chaque mot (AND logique)
        let results: Set<string> | null = null;
        
        for (const word of queryWords) {
            const noteIds = this.wordToNoteIds.get(word) || new Set();
            
            if (results === null) {
                results = new Set(noteIds);
            } else {
                // Intersection
                results = new Set([...results].filter(id => noteIds.has(id)));
            }
        }
        
        return results || new Set();
    }

    // Vérifier si un mot existe dans l'index
    has(word: string): boolean {
        return this.wordToNoteIds.has(word.toLowerCase());
    }

    // Effacer l'index
    clear(): void {
        this.wordToNoteIds.clear();
    }

    // Reconstruire l'index à partir de notes
    rebuild(notes: Note[]): void {
        this.clear();
        notes.forEach(note => this.addNote(note));
    }
}

export class NoteManager {
    private filePath: string;
    private searchIndex: SearchIndex;
    private notesCache: Map<string, Note>; // Cache pour accès rapide par ID

    constructor(fileName: string = 'notes.json') {
        this.filePath = path.join(process.cwd(), fileName);
        this.searchIndex = new SearchIndex();
        this.notesCache = new Map();
        
        // Charger et indexer les notes existantes
        this.loadAndIndexNotes();
    }

    private loadAndIndexNotes(): void {
        const notes = this.loadNotes();
        this.searchIndex.rebuild(notes);
        
        // Remplir le cache
        notes.forEach(note => {
            this.notesCache.set(note.id, note);
        });
    }

    private loadNotes(): Note[] {
        if (!fs.existsSync(this.filePath)) {
            return [];
        }
        const data = fs.readFileSync(this.filePath, 'utf-8');
        try {
            const rawNotes = JSON.parse(data);
            return rawNotes.map((note: any) => ({
                ...note,
                tags: (note.tags || []).map((t: string | Tag) =>
                    typeof t === 'string' ? new Tag(t) : new Tag(t.name)
                )
            }));
        } catch (e) {
            return [];
        }
    }

    private saveNotes(notes: Note[]): void {
        fs.writeFileSync(this.filePath, JSON.stringify(notes, null, 2));
    }

    public addNote(content: string, tags: string[] = []): Note {
        const newNote: Note = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            content,
            tags: tags.map(t => new Tag(t)),
            createdAt: new Date().toISOString(),
        };
        
        // Ajouter à l'index
        this.searchIndex.addNote(newNote);
        
        // Ajouter au cache
        this.notesCache.set(newNote.id, newNote);
        
        // Sauvegarder
        const notes = this.loadNotes();
        notes.push(newNote);
        this.saveNotes(notes);
        
        return newNote;
    }

    public listNotes(): Note[] {
        return this.loadNotes();
    }

    public addTags(id: string, tags: string[]): Note | null {
        const notes = this.loadNotes();
        const note = notes.find((n) => n.id === id);
        if (note) {
            const existingTagNames = new Set(note.tags.map(t => t.name));
            tags.forEach(t => {
                if (!existingTagNames.has(t)) {
                    note.tags.push(new Tag(t));
                    existingTagNames.add(t);
                }
            });
            this.saveNotes(notes);
            
            // Reconstruire l'index avec les nouveaux tags
            this.loadAndIndexNotes();
            
            return note;
        }
        return null;
    }

    // NOUVELLE MÉTHODE: Recherche rapide avec index
    public searchNotes(query: string): Note[] {
        if (!query || query.trim().length === 0) {
            return [];
        }

        // Utiliser l'index pour trouver les IDs rapidement
        const noteIds = this.searchIndex.search(query);
        
        // Récupérer les notes complètes depuis le cache
        const results: Note[] = [];
        noteIds.forEach(id => {
            const note = this.notesCache.get(id);
            if (note) {
                results.push(note);
            }
        });
        
        return results;
    }

    public exportNotes(filePath: string): void {
        const notes = this.loadNotes();
        const targetPath = path.resolve(process.cwd(), filePath);
        fs.writeFileSync(targetPath, JSON.stringify(notes, null, 2));
    }

    // NOUVELLE MÉTHODE: Exposer l'index pour les tests
    public getSearchIndex(): SearchIndex {
        return this.searchIndex;
    }
}
```

**Lancer les tests à nouveau:**
```bash
npm test -- tests/performance.test.ts
```

**Résultat attendu:** ✅ Tous les tests passent (GREEN!)

```
PASS tests/performance.test.ts
  Performance - Search with Indexing
    ✓ should create search index when notes are added (15ms)
    ✓ should search through 10000 notes in less than 100ms (2847ms)
      Search took 12.34ms
      Found 100 results
    ✓ should search by tag in less than 50ms (1234ms)
      Tag search took 8.21ms
    ✓ should update index when tags are added to existing note (25ms)
```

---

### ÉTAPE 3: REFACTOR - Améliorer le code 🔧

Maintenant que les tests passent, on peut améliorer:

1. **Extraire la logique de tokenization**
2. **Ajouter des commentaires**
3. **Optimiser la performance**
4. **Améliorer la lisibilité**

```typescript
// Exemple de refactoring
class SearchIndex {
    private wordToNoteIds: Map<string, Set<string>>;
    
    constructor() {
        this.wordToNoteIds = new Map();
    }

    /**
     * Tokenize text into searchable words
     * - Converts to lowercase
     * - Removes punctuation
     * - Filters empty strings
     */
    private tokenize(text: string): string[] {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 0);
    }

    // ... reste du code ...
}
```

**Relancer les tests après refactoring:**
```bash
npm test
```

**Résultat:** ✅ Les tests passent toujours (bon refactoring!)

---

## Exemple 2: Récupération après corruption (Fiabilité)

### Exigence
"Le système doit récupérer gracieusement des fichiers JSON corrompus et préserver les données valides"

---

### ÉTAPE 1: RED - Tests pour la fiabilité ❌

Créer: `tests/reliability.test.ts`

```typescript
import { NoteManager } from '../src/notes';
import fs from 'fs';
import path from 'path';

describe('Reliability - Data Corruption Recovery', () => {
    const TEST_FILE = 'test-reliability-notes.json';
    const BACKUP_FILE = 'test-reliability-notes.json.bak';

    beforeEach(() => {
        [TEST_FILE, BACKUP_FILE].forEach(file => {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        });
    });

    afterEach(() => {
        [TEST_FILE, BACKUP_FILE].forEach(file => {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        });
    });

    // TEST 1: Créer un backup automatique
    test('should create automatic backup when saving notes', () => {
        const noteManager = new NoteManager(TEST_FILE);
        noteManager.addNote('Test note', ['test']);

        // Le backup devrait exister
        expect(fs.existsSync(BACKUP_FILE)).toBe(true);
    });

    // TEST 2: Récupérer depuis le backup si le fichier principal est corrompu
    test('should recover from backup when main file is corrupted', () => {
        // 1. Créer des notes valides
        let noteManager = new NoteManager(TEST_FILE);
        noteManager.addNote('Important note 1', ['important']);
        noteManager.addNote('Important note 2', ['important']);

        // 2. Corrompre le fichier principal (mais le backup existe)
        fs.writeFileSync(TEST_FILE, '{"corrupted": invalid json');

        // 3. Créer une nouvelle instance (devrait charger depuis le backup)
        noteManager = new NoteManager(TEST_FILE);
        const notes = noteManager.listNotes();

        // Les notes du backup devraient être chargées
        expect(notes.length).toBe(2);
        expect(notes[0].content).toBe('Important note 1');
    });

    // TEST 3: Récupération partielle si le JSON est partiellement valide
    test('should recover valid notes from partially corrupted file', () => {
        // Créer un fichier avec des notes valides et invalides mélangées
        const partiallyCorrupted = `[
            {"id": "1", "content": "Valid note 1", "tags": ["tag1"], "createdAt": "2024-01-01T00:00:00.000Z"},
            {"id": "2", "content": "Valid note 2", "tags": 
            {"id": "3", "content": "Valid note 3", "tags": ["tag3"], "createdAt": "2024-01-03T00:00:00.000Z"}
        ]`;
        
        fs.writeFileSync(TEST_FILE, partiallyCorrupted);

        const noteManager = new NoteManager(TEST_FILE);
        
        // Devrait tenter une récupération partielle
        // (ceci nécessitera une logique spéciale)
        const recoveredNotes = noteManager.attemptPartialRecovery();
        
        expect(recoveredNotes.length).toBeGreaterThan(0);
    });

    // TEST 4: Le système ne devrait pas planter avec un fichier corrompu
    test('should not crash when loading corrupted file', () => {
        fs.writeFileSync(TEST_FILE, 'completely invalid {{{ json');

        // Ne devrait pas lancer d'exception
        expect(() => {
            const noteManager = new NoteManager(TEST_FILE);
            noteManager.listNotes();
        }).not.toThrow();
    });

    // TEST 5: Logger les erreurs de corruption
    test('should log corruption errors for debugging', () => {
        fs.writeFileSync(TEST_FILE, 'invalid json');

        const noteManager = new NoteManager(TEST_FILE);
        const logs = noteManager.getCorruptionLogs();

        expect(logs.length).toBeGreaterThan(0);
        expect(logs[0]).toContain('corruption');
    });

    // TEST 6: Validation des données lors du chargement
    test('should validate note structure and skip invalid notes', () => {
        const invalidNotes = JSON.stringify([
            { id: "1", content: "Valid", tags: ["tag1"], createdAt: "2024-01-01T00:00:00.000Z" },
            { id: "2", content: null, tags: ["tag2"], createdAt: "2024-01-02T00:00:00.000Z" }, // Invalid: null content
            { id: "3", tags: ["tag3"], createdAt: "2024-01-03T00:00:00.000Z" }, // Invalid: missing content
            { id: "4", content: "Valid 2", tags: ["tag4"], createdAt: "2024-01-04T00:00:00.000Z" }
        ]);

        fs.writeFileSync(TEST_FILE, invalidNotes);

        const noteManager = new NoteManager(TEST_FILE);
        const notes = noteManager.listNotes();

        // Devrait charger seulement les notes valides
        expect(notes.length).toBe(2);
        expect(notes[0].content).toBe('Valid');
        expect(notes[1].content).toBe('Valid 2');
    });
});
```

**Lancer les tests:**
```bash
npm test -- tests/reliability.test.ts
```

**Résultat:** ❌ Échecs (RED)

---

### ÉTAPE 2: GREEN - Implémenter la récupération ✅

Modifier `src/notes.ts` pour ajouter la récupération:

```typescript
// Ajouter au début du fichier
interface CorruptionLog {
    timestamp: string;
    error: string;
    action: string;
}

export class NoteManager {
    private filePath: string;
    private backupPath: string;
    private searchIndex: SearchIndex;
    private notesCache: Map<string, Note>;
    private corruptionLogs: CorruptionLog[];

    constructor(fileName: string = 'notes.json') {
        this.filePath = path.join(process.cwd(), fileName);
        this.backupPath = this.filePath + '.bak';
        this.searchIndex = new SearchIndex();
        this.notesCache = new Map();
        this.corruptionLogs = [];
        
        this.loadAndIndexNotes();
    }

    /**
     * Valider qu'une note a la structure correcte
     */
    private isValidNote(note: any): note is Note {
        return (
            note &&
            typeof note.id === 'string' &&
            typeof note.content === 'string' &&
            note.content.length > 0 &&
            Array.isArray(note.tags) &&
            typeof note.createdAt === 'string'
        );
    }

    /**
     * Logger une erreur de corruption
     */
    private logCorruption(error: string, action: string): void {
        this.corruptionLogs.push({
            timestamp: new Date().toISOString(),
            error,
            action
        });
        console.error(`[CORRUPTION] ${error} - ${action}`);
    }

    /**
     * Créer un backup du fichier principal
     */
    private createBackup(notes: Note[]): void {
        try {
            fs.writeFileSync(this.backupPath, JSON.stringify(notes, null, 2));
        } catch (e) {
            console.error('Failed to create backup:', e);
        }
    }

    /**
     * Charger depuis le backup
     */
    private loadFromBackup(): Note[] {
        if (!fs.existsSync(this.backupPath)) {
            return [];
        }

        try {
            const data = fs.readFileSync(this.backupPath, 'utf-8');
            const rawNotes = JSON.parse(data);
            
            this.logCorruption(
                'Main file corrupted',
                'Loaded from backup successfully'
            );

            return this.parseAndValidateNotes(rawNotes);
        } catch (e) {
            this.logCorruption(
                'Backup file also corrupted',
                'Starting with empty notes'
            );
            return [];
        }
    }

    /**
     * Parser et valider les notes
     */
    private parseAndValidateNotes(rawNotes: any[]): Note[] {
        if (!Array.isArray(rawNotes)) {
            return [];
        }

        const validNotes: Note[] = [];
        const invalidCount = 0;

        rawNotes.forEach((note, index) => {
            if (this.isValidNote(note)) {
                validNotes.push({
                    ...note,
                    tags: (note.tags || []).map((t: string | Tag) =>
                        typeof t === 'string' ? new Tag(t) : new Tag(t.name)
                    )
                });
            } else {
                this.logCorruption(
                    `Invalid note structure at index ${index}`,
                    'Skipped invalid note'
                );
            }
        });

        if (invalidCount > 0) {
            console.warn(`Skipped ${invalidCount} invalid notes`);
        }

        return validNotes;
    }

    /**
     * Tentative de récupération partielle
     */
    public attemptPartialRecovery(): Note[] {
        if (!fs.existsSync(this.filePath)) {
            return [];
        }

        try {
            const data = fs.readFileSync(this.filePath, 'utf-8');
            
            // Essayer de parser normalement d'abord
            try {
                const notes = JSON.parse(data);
                return this.parseAndValidateNotes(notes);
            } catch (parseError) {
                // Si ça échoue, essayer une récupération ligne par ligne
                this.logCorruption(
                    'JSON parse failed',
                    'Attempting line-by-line recovery'
                );
                
                return this.recoverLineByLine(data);
            }
        } catch (e) {
            this.logCorruption(
                `File read error: ${e}`,
                'Recovery failed'
            );
            return [];
        }
    }

    /**
     * Récupération ligne par ligne
     */
    private recoverLineByLine(data: string): Note[] {
        const validNotes: Note[] = [];
        
        // Essayer de trouver des objets JSON valides ligne par ligne
        const lines = data.split('\n');
        let buffer = '';
        
        for (const line of lines) {
            buffer += line;
            
            try {
                const obj = JSON.parse(buffer);
                if (this.isValidNote(obj)) {
                    validNotes.push({
                        ...obj,
                        tags: obj.tags.map((t: any) => 
                            typeof t === 'string' ? new Tag(t) : new Tag(t.name)
                        )
                    });
                }
                buffer = ''; // Reset buffer après succès
            } catch (e) {
                // Continue à accumuler dans le buffer
            }
        }
        
        this.logCorruption(
            'Partial recovery completed',
            `Recovered ${validNotes.length} notes`
        );
        
        return validNotes;
    }

    private loadNotes(): Note[] {
        if (!fs.existsSync(this.filePath)) {
            return [];
        }

        try {
            const data = fs.readFileSync(this.filePath, 'utf-8');
            const rawNotes = JSON.parse(data);
            return this.parseAndValidateNotes(rawNotes);
        } catch (e) {
            // Fichier principal corrompu - essayer le backup
            this.logCorruption(
                `Failed to load main file: ${e}`,
                'Attempting to load from backup'
            );
            return this.loadFromBackup();
        }
    }

    private saveNotes(notes: Note[]): void {
        // Créer un backup avant de sauvegarder
        if (fs.existsSync(this.filePath)) {
            this.createBackup(this.loadNotes());
        }
        
        fs.writeFileSync(this.filePath, JSON.stringify(notes, null, 2));
    }

    /**
     * Obtenir les logs de corruption pour debugging
     */
    public getCorruptionLogs(): string[] {
        return this.corruptionLogs.map(log => 
            `[${log.timestamp}] ${log.error} - ${log.action}`
        );
    }

    // ... reste des méthodes existantes ...
}
```

**Lancer les tests:**
```bash
npm test -- tests/reliability.test.ts
```

**Résultat:** ✅ Tests passent (GREEN!)

---

### ÉTAPE 3: REFACTOR 🔧

Améliorer la structure du code, peut-être extraire une classe `BackupManager` séparée.

---

## Exemple 3: Catégories hiérarchiques (Fonctionnalité)

### Exigence
"Les utilisateurs doivent pouvoir organiser les notes dans des catégories/dossiers hiérarchiques"

---

### ÉTAPE 1: RED - Tests pour les catégories ❌

Créer: `tests/categories.test.ts`

```typescript
import { NoteManager } from '../src/notes';
import { CategoryManager } from '../src/categories';
import fs from 'fs';

describe('Functionality - Hierarchical Categories', () => {
    let noteManager: NoteManager;
    let categoryManager: CategoryManager;
    const TEST_NOTES_FILE = 'test-categories-notes.json';
    const TEST_CATEGORIES_FILE = 'test-categories.json';

    beforeEach(() => {
        [TEST_NOTES_FILE, TEST_CATEGORIES_FILE].forEach(file => {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        });
        noteManager = new NoteManager(TEST_NOTES_FILE);
        categoryManager = new CategoryManager(TEST_CATEGORIES_FILE);
    });

    afterEach(() => {
        [TEST_NOTES_FILE, TEST_CATEGORIES_FILE].forEach(file => {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        });
    });

    // TEST 1: Créer une catégorie
    test('should create a new category', () => {
        const category = categoryManager.createCategory('Work', null);
        
        expect(category).toBeDefined();
        expect(category.name).toBe('Work');
        expect(category.id).toBeDefined();
        expect(category.parentId).toBeNull();
    });

    // TEST 2: Créer une sous-catégorie
    test('should create a subcategory', () => {
        const work = categoryManager.createCategory('Work', null);
        const projects = categoryManager.createCategory('Projects', work.id);
        
        expect(projects.parentId).toBe(work.id);
        expect(categoryManager.getChildren(work.id)).toHaveLength(1);
    });

    // TEST 3: Assigner une note à une catégorie
    test('should assign note to category', () => {
        const work = categoryManager.createCategory('Work', null);
        const note = noteManager.addNote('Important task', ['todo']);
        
        noteManager.assignCategory(note.id, work.id);
        
        const noteWithCategory = noteManager.getNoteById(note.id);
        expect(noteWithCategory?.categoryId).toBe(work.id);
    });

    // TEST 4: Lister les notes par catégorie
    test('should list notes by category', () => {
        const work = categoryManager.createCategory('Work', null);
        const note1 = noteManager.addNote('Task 1', ['todo']);
        const note2 = noteManager.addNote('Task 2', ['todo']);
        const note3 = noteManager.addNote('Personal note', ['personal']);
        
        noteManager.assignCategory(note1.id, work.id);
        noteManager.assignCategory(note2.id, work.id);
        
        const workNotes = noteManager.getNotesByCategory(work.id);
        
        expect(workNotes).toHaveLength(2);
        expect(workNotes.map(n => n.id)).toContain(note1.id);
        expect(workNotes.map(n => n.id)).toContain(note2.id);
        expect(workNotes.map(n => n.id)).not.toContain(note3.id);
    });

    // TEST 5: Obtenir le chemin complet d'une catégorie
    test('should get full path of category', () => {
        const work = categoryManager.createCategory('Work', null);
        const projects = categoryManager.createCategory('Projects', work.id);
        const clientA = categoryManager.createCategory('Client A', projects.id);
        
        const path = categoryManager.getPath(clientA.id);
        
        expect(path).toBe('Work/Projects/Client A');
    });

    // TEST 6: Déplacer une note entre catégories
    test('should move note between categories', () => {
        const work = categoryManager.createCategory('Work', null);
        const personal = categoryManager.createCategory('Personal', null);
        const note = noteManager.addNote('Meeting notes', []);
        
        noteManager.assignCategory(note.id, work.id);
        expect(noteManager.getNoteById(note.id)?.categoryId).toBe(work.id);
        
        noteManager.assignCategory(note.id, personal.id);
        expect(noteManager.getNoteById(note.id)?.categoryId).toBe(personal.id);
    });

    // TEST 7: Supprimer une catégorie (et gérer les notes)
    test('should handle notes when deleting category', () => {
        const work = categoryManager.createCategory('Work', null);
        const note = noteManager.addNote('Task', []);
        noteManager.assignCategory(note.id, work.id);
        
        // Options: 1) Déplacer les notes vers la catégorie parente
        //          2) Mettre les notes sans catégorie
        categoryManager.deleteCategory(work.id, 'uncategorize');
        
        const noteAfterDeletion = noteManager.getNoteById(note.id);
        expect(noteAfterDeletion?.categoryId).toBeNull();
    });

    // TEST 8: Lister toutes les catégories sous forme d'arbre
    test('should list all categories as tree', () => {
        const work = categoryManager.createCategory('Work', null);
        const projects = categoryManager.createCategory('Projects', work.id);
        const meetings = categoryManager.createCategory('Meetings', work.id);
        const personal = categoryManager.createCategory('Personal', null);
        
        const tree = categoryManager.getCategoryTree();
        
        expect(tree).toHaveLength(2); // 2 catégories racine (Work, Personal)
        expect(tree[0].children).toHaveLength(2); // Work a 2 enfants
    });
});
```

---

### ÉTAPE 2: GREEN - Implémenter les catégories ✅

Créer: `src/categories.ts`

```typescript
import fs from 'fs';
import path from 'path';

export interface Category {
    id: string;
    name: string;
    parentId: string | null;
    createdAt: string;
}

export interface CategoryTree extends Category {
    children: CategoryTree[];
}

export class CategoryManager {
    private filePath: string;

    constructor(fileName: string = 'categories.json') {
        this.filePath = path.join(process.cwd(), fileName);
    }

    private loadCategories(): Category[] {
        if (!fs.existsSync(this.filePath)) {
            return [];
        }
        const data = fs.readFileSync(this.filePath, 'utf-8');
        return JSON.parse(data);
    }

    private saveCategories(categories: Category[]): void {
        fs.writeFileSync(this.filePath, JSON.stringify(categories, null, 2));
    }

    public createCategory(name: string, parentId: string | null): Category {
        const categories = this.loadCategories();
        
        const newCategory: Category = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name,
            parentId,
            createdAt: new Date().toISOString()
        };
        
        categories.push(newCategory);
        this.saveCategories(categories);
        
        return newCategory;
    }

    public getChildren(categoryId: string): Category[] {
        const categories = this.loadCategories();
        return categories.filter(c => c.parentId === categoryId);
    }

    public getPath(categoryId: string): string {
        const categories = this.loadCategories();
        const path: string[] = [];
        
        let current = categories.find(c => c.id === categoryId);
        while (current) {
            path.unshift(current.name);
            current = current.parentId 
                ? categories.find(c => c.id === current!.parentId)
                : undefined;
        }
        
        return path.join('/');
    }

    public deleteCategory(categoryId: string, action: 'uncategorize' | 'move-to-parent'): void {
        const categories = this.loadCategories();
        const category = categories.find(c => c.id === categoryId);
        
        if (!category) return;
        
        // Gérer les sous-catégories
        const children = this.getChildren(categoryId);
        children.forEach(child => {
            if (action === 'uncategorize') {
                child.parentId = null;
            } else {
                child.parentId = category.parentId;
            }
        });
        
        // Supprimer la catégorie
        const filtered = categories.filter(c => c.id !== categoryId);
        this.saveCategories(filtered);
    }

    public getCategoryTree(): CategoryTree[] {
        const categories = this.loadCategories();
        const rootCategories = categories.filter(c => c.parentId === null);
        
        const buildTree = (category: Category): CategoryTree => {
            const children = categories.filter(c => c.parentId === category.id);
            return {
                ...category,
                children: children.map(buildTree)
            };
        };
        
        return rootCategories.map(buildTree);
    }
}
```

Modifier: `src/notes.ts` pour ajouter le support des catégories

```typescript
export interface Note {
    id: string;
    content: string;
    tags: Tag[];
    createdAt: string;
    categoryId?: string | null; // NOUVEAU
}

export class NoteManager {
    // ... code existant ...

    public assignCategory(noteId: string, categoryId: string | null): void {
        const notes = this.loadNotes();
        const note = notes.find(n => n.id === noteId);
        
        if (note) {
            note.categoryId = categoryId;
            this.saveNotes(notes);
            this.loadAndIndexNotes(); // Recharger le cache
        }
    }

    public getNoteById(noteId: string): Note | null {
        return this.notesCache.get(noteId) || null;
    }

    public getNotesByCategory(categoryId: string): Note[] {
        const notes = this.loadNotes();
        return notes.filter(n => n.categoryId === categoryId);
    }

    // ... reste du code ...
}
```

**Lancer les tests:**
```bash
npm test -- tests/categories.test.ts
```

**Résultat:** ✅ GREEN!

---

### ÉTAPE 3: Ajouter les commandes CLI 🎯

Modifier: `src/index.ts`

```typescript
import { CategoryManager } from './categories';

class NotesCLI {
    private program: Command;
    private noteManager: NoteManager;
    private categoryManager: CategoryManager; // NOUVEAU

    constructor() {
        this.program = new Command();
        this.noteManager = new NoteManager();
        this.categoryManager = new CategoryManager(); // NOUVEAU
        this.configure();
    }

    private configure() {
        // ... commandes existantes ...

        // NOUVELLE COMMANDE: Créer une catégorie
        this.program
            .command('category create')
            .description('Create a new category')
            .argument('<name>', 'Category name')
            .option('-p, --parent <id>', 'Parent category ID')
            .action((name, options) => {
                const parentId = options.parent || null;
                const category = this.categoryManager.createCategory(name, parentId);
                console.log(`Category created: ${category.name} (ID: ${category.id})`);
            });

        // NOUVELLE COMMANDE: Lister les catégories
        this.program
            .command('category list')
            .description('List all categories as tree')
            .action(() => {
                const tree = this.categoryManager.getCategoryTree();
                this.printCategoryTree(tree, 0);
            });

        // NOUVELLE COMMANDE: Déplacer une note
        this.program
            .command('move')
            .description('Move note to a category')
            .argument('<note-id>', 'Note ID')
            .argument('<category-id>', 'Category ID')
            .action((noteId, categoryId) => {
                this.noteManager.assignCategory(noteId, categoryId);
                console.log(`Note ${noteId} moved to category ${categoryId}`);
            });
    }

    private printCategoryTree(tree: CategoryTree[], indent: number): void {
        tree.forEach(category => {
            console.log('  '.repeat(indent) + `- ${category.name} (${category.id})`);
            if (category.children.length > 0) {
                this.printCategoryTree(category.children, indent + 1);
            }
        });
    }

    // ... reste du code ...
}
```

---

## Métriques de qualité - Quoi analyser?

Maintenant que vous avez implémenté les 3 exigences, voici les métriques à analyser dans Moose.

### 📊 Métriques de base (disponibles dans Moose)

#### 1. **LOC (Lines of Code)** - Lignes de code
- **Quoi**: Nombre de lignes de code par classe/méthode
- **Pourquoi**: Indicateur de taille et complexité potentielle
- **Seuil**: Classes > 300 LOC peuvent être trop grandes

#### 2. **NOM (Number of Methods)** - Nombre de méthodes
- **Quoi**: Nombre de méthodes par classe
- **Pourquoi**: Trop de méthodes = classe fait trop de choses
- **Seuil**: > 20 méthodes peut indiquer un problème

#### 3. **NOC (Number of Classes)** - Nombre de classes
- **Quoi**: Nombre total de classes dans le projet
- **Pourquoi**: Indicateur de la taille du système

#### 4. **CC (Cyclomatic Complexity)** - Complexité cyclomatique
- **Quoi**: Nombre de chemins d'exécution dans une méthode
- **Pourquoi**: Complexité élevée = difficile à tester et maintenir
- **Seuil**: 
  - 1-10: Simple
  - 11-20: Modérément complexe
  - 21-50: Complexe
  - >50: Non testable

**Comment**: Compter les if, while, for, case, &&, ||, ?

#### 5. **CBO (Coupling Between Objects)** - Couplage
- **Quoi**: Nombre de classes auxquelles une classe est couplée
- **Pourquoi**: Couplage élevé = changements en cascade
- **Seuil**: > 10 est élevé

#### 6. **LCOM (Lack of Cohesion of Methods)** - Manque de cohésion
- **Quoi**: Mesure si les méthodes d'une classe travaillent ensemble
- **Pourquoi**: Cohésion faible = classe fait plusieurs choses non reliées
- **Seuil**: > 0.8 indique faible cohésion

#### 7. **DIT (Depth of Inheritance Tree)** - Profondeur d'héritage
- **Quoi**: Profondeur maximale de l'arbre d'héritage
- **Pourquoi**: Héritage trop profond = complexité et fragilité
- **Seuil**: > 5 est problématique

#### 8. **NOA (Number of Attributes)** - Nombre d'attributs
- **Quoi**: Nombre d'attributs (propriétés) par classe
- **Pourquoi**: Trop d'attributs = classe trop complexe
- **Seuil**: > 10 attributs

---

### 📈 Métriques avancées (à calculer)

#### 9. **Test Coverage** - Couverture des tests
- **Quoi**: % de code couvert par les tests
- **Comment calculer**: `npm test -- --coverage`
- **Seuil**: > 80% est bon

#### 10. **Afferent Coupling (Ca)** - Couplage afférent
- **Quoi**: Nombre de classes qui dépendent de cette classe
- **Pourquoi**: Classes avec Ca élevé sont importantes (beaucoup d'utilisation)

#### 11. **Efferent Coupling (Ce)** - Couplage efférent
- **Quoi**: Nombre de classes dont cette classe dépend
- **Pourquoi**: Ce élevé = classe fragile (beaucoup de dépendances)

#### 12. **Instability (I = Ce / (Ca + Ce))**
- **Quoi**: Ratio entre 0 (stable) et 1 (instable)
- **Pourquoi**: Classes instables changent souvent

---

## Comment analyser les métriques dans Moose

### Étape 1: Charger le modèle dans Moose

```smalltalk
"Dans Pharo Playground"

"1. Importer le fichier JSON"
model := FamixTypeScriptModel new.
model importFromJSONFile: 'C:\Users\pamib\Documents\projects\MGL843-tp1\model.json'.

"2. Explorer le modèle"
model inspect.
```

### Étape 2: Calculer les métriques de base

```smalltalk
"Nombre de classes"
model allModelClasses size.
"=> 5"

"Nombre total de méthodes"
model allMethods size.
"=> 45"

"Liste des classes avec leurs LOC"
model allModelClasses collect: [ :class |
    class name -> class numberOfLinesOfCode
].
"=> an OrderedCollection(
    'NoteManager'->150, 
    'NotesCLI'->100, 
    'CategoryManager'->80, 
    'SearchIndex'->70, 
    'Tag'->10
)"

"Classes avec beaucoup de méthodes (> 15)"
model allModelClasses 
    select: [ :class | class methods size > 15 ]
    thenCollect: [ :class | class name -> class methods size ].
"=> an OrderedCollection('NoteManager'->18)"
```

### Étape 3: Analyser la complexité

```smalltalk
"Complexité cyclomatique par classe"
model allModelClasses collect: [ :class |
    class name -> class cyclomaticComplexity
].

"Méthodes les plus complexes"
model allMethods 
    sorted: [ :a :b | a cyclomaticComplexity > b.cyclomaticComplexity ]
    thenCollect: [ :method | 
        method parentType name, '>>', method name, ' (CC:', method cyclomaticComplexity asString, ')'
    ].
"=> an OrderedCollection(
    'NoteManager>>searchNotes (CC:12)',
    'NoteManager>>loadNotes (CC:8)',
    'SearchIndex>>search (CC:7)',
    ...
)"
```

### Étape 4: Analyser le couplage

```smalltalk
"Couplage entre classes"
model allModelClasses collect: [ :class |
    | dependencies |
    dependencies := class outgoingReferences 
        collect: [ :ref | ref target ]
        as: Set.
    class name -> dependencies size
].
"=> an OrderedCollection(
    'NotesCLI'->3,  "dépend de NoteManager, CategoryManager, Commander"
    'NoteManager'->2,  "dépend de SearchIndex, Note"
    'CategoryManager'->1,  "dépend de Category"
    ...
)"

"Classes les plus couplées (CBO > 5)"
model allModelClasses 
    select: [ :class | class couplingBetweenObjects > 5 ]
    thenCollect: [ :class | class name -> class couplingBetweenObjects ].
```

### Étape 5: Identifier les "God Classes" (classes trop grosses)

```smalltalk
"God Classes: beaucoup de méthodes + beaucoup de LOC + couplage élevé"
model allModelClasses 
    select: [ :class |
        (class methods size > 15) and: [
        (class numberOfLinesOfCode > 200) and: [
        class couplingBetweenObjects > 5 ]]
    ]
    thenCollect: [ :class |
        class name, 
        ' (Methods:', class methods size asString,
        ', LOC:', class numberOfLinesOfCode asString,
        ', CBO:', class couplingBetweenObjects asString, ')'
    ].
"=> Si vous voyez 'NoteManager (Methods:18, LOC:250, CBO:6)' 
    => C'est une God Class à refactoriser!"
```

### Étape 6: Visualiser avec Roassal

```smalltalk
"Visualisation System Complexity"
| view |
view := RSCanvas new.

model allModelClasses do: [ :class |
    | box label |
    
    "Créer un rectangle pour chaque classe"
    box := RSBox new
        size: (class numberOfLinesOfCode sqrt * 3) max: 20;  "Taille = LOC"
        color: (Color blue alpha: (class cyclomaticComplexity / 50) min: 1);  "Couleur = complexité"
        yourself.
    
    "Ajouter le nom de la classe"
    label := RSLabel new
        text: class name;
        fontSize: 10;
        yourself.
    
    "Grouper"
    view add: box.
    view add: label.
    RSLocation new
        below;
        move: label on: box.
].

"Layout"
RSGridLayout on: view nodes.

"Interactions"
view @ RSCanvasController.

"Afficher"
view open.
```

**Résultat visuel:** 
- Gros rectangles = beaucoup de code
- Rectangles bleu foncé = haute complexité
- Vous voyez visuellement les classes problématiques!

### Étape 7: Graphe de dépendances

```smalltalk
"Graphe de dépendances entre classes"
| view builder |
view := RSCanvas new.
builder := RSUMLClassBuilder new.

builder classes: model allModelClasses.
builder build.

"Ajouter les liens de dépendance"
model allModelClasses do: [ :class |
    class outgoingReferences do: [ :ref |
        | edge |
        edge := RSLine new
            from: class;
            to: ref target;
            color: Color gray;
            yourself.
        view add: edge.
    ].
].

RSTreeLayout on: view nodes.
view @ RSCanvasController.
view open.
```

### Étape 8: Exporter les métriques en CSV

```smalltalk
"Créer un fichier CSV avec toutes les métriques"
| csv |
csv := String streamContents: [ :stream |
    "Header"
    stream 
        nextPutAll: 'ClassName,LOC,NOM,NOA,CC,CBO,LCOM'; 
        cr.
    
    "Données"
    model allModelClasses do: [ :class |
        stream 
            nextPutAll: class name; nextPut: $,;
            print: class numberOfLinesOfCode; nextPut: $,;
            print: class methods size; nextPut: $,;
            print: class attributes size; nextPut: $,;
            print: class cyclomaticComplexity; nextPut: $,;
            print: class couplingBetweenObjects; nextPut: $,;
            print: (class lackOfCohesionOfMethods ifNil: [ 0 ]); 
            cr.
    ].
].

"Sauvegarder"
'metrics.csv' asFileReference writeStreamDo: [ :s | 
    s nextPutAll: csv 
].

"Message de confirmation"
'Metrics exported to metrics.csv' inspect.
```

---

## Exemple d'analyse complète

Après avoir implémenté les 3 exigences, voici à quoi pourrait ressembler votre analyse:

### 📊 Résultats des métriques

| Classe | LOC | NOM | CC | CBO | Commentaire |
|--------|-----|-----|-----|-----|-------------|
| **NoteManager** | 250 | 18 | 42 | 6 | ⚠️ God Class - à refactoriser |
| SearchIndex | 70 | 8 | 15 | 2 | ✅ Bonne cohésion |
| CategoryManager | 80 | 10 | 18 | 3 | ✅ Bien structuré |
| NotesCLI | 150 | 12 | 8 | 3 | ✅ Bonne séparation |
| Tag | 10 | 3 | 1 | 0 | ✅ Simple et focalisé |

### 🎯 Éléments remarquables identifiés

1. **NoteManager** - God Class
   - **Problème**: Trop de responsabilités (gestion notes, index, backup, validation)
   - **Solution**: Extraire BackupManager, ValidationService
   
2. **SearchIndex** - Bien conçu
   - **Rôle**: Optimisation de la recherche
   - **Qualité**: Responsabilité unique, bonne encapsulation

3. **CategoryManager** - Nouvelle fonctionnalité bien isolée
   - **Rôle**: Gestion hiérarchie de catégories
   - **Qualité**: Couplage faible avec le reste du système

### 📈 Comparaison TP1 vs TP2

| Métrique | TP1 | TP2 | Δ |
|----------|-----|-----|---|
| Nombre de classes | 2 | 5 | +150% |
| LOC total | 200 | 560 | +180% |
| Complexité moyenne | 5 | 16.8 | +236% |
| Couverture tests | 60% | 85% | +25% |

**Conclusion**: Le projet est significativement plus complexe, mais mieux structuré avec les nouvelles fonctionnalités!

---

## Résumé: TDD en pratique

```
Pour chaque exigence FURPS:

1. RED ❌
   - Écrire les tests AVANT
   - Penser aux cas limites
   - Tests doivent échouer (fonctionnalité n'existe pas)

2. GREEN ✅
   - Écrire le minimum de code
   - Faire passer les tests
   - Ne pas optimiser prématurément

3. REFACTOR 🔧
   - Améliorer le code
   - Tests restent verts
   - Extraire classes/méthodes si nécessaire

4. REPEAT 🔄
   - Recommencer pour le test suivant
```

**Avantage**: À la fin, vous avez du code testé, des métriques intéressantes, et une bonne compréhension de la qualité!

---

Bonne chance pour le TP2! 🚀
