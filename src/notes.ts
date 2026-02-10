import fs from 'fs';
import path from 'path';

export class Tag {
    constructor(
        public name: string,
        public color: string = '#8b5cf6'
    ) { }

    toString(): string {
        return this.name;
    }

    toJSON(): { name: string; color: string } {
        return { name: this.name, color: this.color };
    }
}

export interface Note {
    id: string;
    content: string;
    tags: Tag[];
    createdAt: string;
    expirationDate?: string;
}

export interface TagDefinition {
    name: string;
    color: string;
    usageCount: number;
    createdAt: string;
}

export class TagRepository {
    private filePath: string;
    private colorPalette: string[] = [
        '#8b5cf6', // purple
        '#3b82f6', // blue
        '#10b981', // green
        '#f59e0b', // amber
        '#ef4444', // red
        '#ec4899', // pink
        '#14b8a6', // teal
        '#f97316', // orange
        '#6366f1', // indigo
        '#84cc16', // lime
    ];
    private colorIndex: number = 0;

    constructor(fileName: string = 'tags.json') {
        this.filePath = path.join(process.cwd(), fileName);
    }

    private loadTags(): TagDefinition[] {
        if (!fs.existsSync(this.filePath)) {
            return [];
        }
        const data = fs.readFileSync(this.filePath, 'utf-8');
        try {
            return JSON.parse(data);
        } catch (e) {
            return [];
        }
    }

    private saveTags(tags: TagDefinition[]): void {
        fs.writeFileSync(this.filePath, JSON.stringify(tags, null, 2));
    }

    private getNextColor(): string {
        const color = this.colorPalette[this.colorIndex % this.colorPalette.length];
        this.colorIndex++;
        return color;
    }

    public getAllTags(): TagDefinition[] {
        return this.loadTags();
    }

    public getTagByName(name: string): TagDefinition | null {
        const tags = this.loadTags();
        return tags.find(t => t.name.toLowerCase() === name.toLowerCase()) || null;
    }

    public createOrGetTag(name: string, color?: string): TagDefinition {
        const tags = this.loadTags();
        const existing = tags.find(t => t.name.toLowerCase() === name.toLowerCase());

        if (existing) {
            return existing;
        }

        const newTag: TagDefinition = {
            name,
            color: color || this.getNextColor(),
            usageCount: 0,
            createdAt: new Date().toISOString()
        };

        tags.push(newTag);
        this.saveTags(tags);
        return newTag;
    }

    public updateTag(name: string, color: string): TagDefinition | null {
        const tags = this.loadTags();
        const tag = tags.find(t => t.name.toLowerCase() === name.toLowerCase());

        if (!tag) {
            return null;
        }

        tag.color = color;
        this.saveTags(tags);
        return tag;
    }

    public deleteTag(name: string): boolean {
        const tags = this.loadTags();
        const initialLength = tags.length;
        const filteredTags = tags.filter(t => t.name.toLowerCase() !== name.toLowerCase());

        if (filteredTags.length === initialLength) {
            return false;
        }

        this.saveTags(filteredTags);
        return true;
    }

    public incrementUsage(name: string): void {
        const tags = this.loadTags();
        const tag = tags.find(t => t.name.toLowerCase() === name.toLowerCase());

        if (tag) {
            tag.usageCount++;
            this.saveTags(tags);
        }
    }

    public decrementUsage(name: string): void {
        const tags = this.loadTags();
        const tag = tags.find(t => t.name.toLowerCase() === name.toLowerCase());

        if (tag && tag.usageCount > 0) {
            tag.usageCount--;
            this.saveTags(tags);
        }
    }

    public recalculateUsageCounts(allNotes: Note[]): void {
        const tags = this.loadTags();

        // Reset all counts
        tags.forEach(t => t.usageCount = 0);

        // Count usage from notes
        allNotes.forEach(note => {
            note.tags.forEach(tag => {
                const tagDef = tags.find(t => t.name.toLowerCase() === tag.name.toLowerCase());
                if (tagDef) {
                    tagDef.usageCount++;
                }
            });
        });

        this.saveTags(tags);
    }
}

export class NoteManager {
    private filePath: string;
    private tagRepository: TagRepository;

    constructor(fileName: string = 'notes.json') {
        this.filePath = path.join(process.cwd(), fileName);
        this.tagRepository = new TagRepository();
    }

    private loadNotes(): Note[] {
        if (!fs.existsSync(this.filePath)) {
            return [];
        }
        const data = fs.readFileSync(this.filePath, 'utf-8');
        try {
            const rawNotes = JSON.parse(data);
            // Migrate string tags to Tag objects if necessary
            return rawNotes.map((note: any) => ({
                ...note,
                tags: (note.tags || []).map((t: string | Tag | any) => {
                    if (typeof t === 'string') {
                        const tagDef = this.tagRepository.getTagByName(t);
                        return new Tag(t, tagDef?.color || '#8b5cf6');
                    } else if (t.name) {
                        const tagDef = this.tagRepository.getTagByName(t.name);
                        return new Tag(t.name, t.color || tagDef?.color || '#8b5cf6');
                    }
                    return new Tag('unknown', '#8b5cf6');
                })
            }));
        } catch (e) {
            return [];
        }
    }

    private saveNotes(notes: Note[]): void {
        // Recalculate tag usage counts to ensure consistency
        this.tagRepository.recalculateUsageCounts(notes);
        fs.writeFileSync(this.filePath, JSON.stringify(notes, null, 2));
    }

    public addNote(content: string, tags: string[] = [], expirationDate?: string): Note {
        const notes = this.loadNotes();

        // Register tags in repository and get Tag objects with colors
        const tagObjects = tags.map(tagName => {
            const tagDef = this.tagRepository.createOrGetTag(tagName);
            this.tagRepository.incrementUsage(tagName);
            return new Tag(tagDef.name, tagDef.color);
        });

        const newNote: Note = {
            id: Date.now().toString(),
            content,
            tags: tagObjects,
            createdAt: new Date().toISOString(),
        };

        if (expirationDate) {
            newNote.expirationDate = expirationDate;
        }

        notes.push(newNote);
        this.saveNotes(notes);
        return newNote;
    }

    public listNotes(): Note[] {
        const notes = this.loadNotes();
        // Trier par date de création, du plus récent au plus ancien
        return notes.sort((a, b) => {
            // Les IDs sont des timestamps, donc les trier par ID décroissant
            return Number(b.id) - Number(a.id); // Plus grand ID = plus récent = vient en premier
        });
    }

    public addTags(id: string, tags: string[]): Note | null {
        const notes = this.loadNotes();
        const note = notes.find((n) => n.id === id);
        if (note) {
            // Avoid duplicates
            const existingTagNames = new Set(note.tags.map(t => t.name.toLowerCase()));
            tags.forEach(tagName => {
                if (!existingTagNames.has(tagName.toLowerCase())) {
                    const tagDef = this.tagRepository.createOrGetTag(tagName);
                    this.tagRepository.incrementUsage(tagName);
                    note.tags.push(new Tag(tagDef.name, tagDef.color));
                    existingTagNames.add(tagName.toLowerCase());
                }
            });
            this.saveNotes(notes);
            return note;
        }
        return null;
    }

    public searchNotes(query: string): Note[] {
        const notes = this.loadNotes();
        const lowerQuery = query.toLowerCase();
        return notes.filter((n) => {
            // Safely check content (handle missing or undefined content)
            const contentMatch = n.content?.toLowerCase().includes(lowerQuery) || false;
            // Safely check tags (handle missing or malformed tags)
            const tagsMatch = Array.isArray(n.tags) && n.tags.some((t) =>
                t?.name?.toLowerCase().includes(lowerQuery)
            );
            return contentMatch || tagsMatch;
        });
    }

    public exportNotes(filePath: string): void {
        const notes = this.loadNotes();
        const targetPath = path.resolve(process.cwd(), filePath);
        fs.writeFileSync(targetPath, JSON.stringify(notes, null, 2));
    }

    public updateNote(id: string, content?: string, tags?: string[], expirationDate?: string | null): Note | null {
        const notes = this.loadNotes();
        const note = notes.find((n) => n.id === id);
        if (!note) {
            return null;
        }

        // Update content if provided
        if (content !== undefined) {
            note.content = content;
        }

        // Update tags if provided
        if (tags !== undefined) {
            // Decrement usage for old tags
            note.tags.forEach(tag => {
                this.tagRepository.decrementUsage(tag.name);
            });

            // Create new tag objects with colors from repository
            note.tags = tags.map(tagName => {
                const tagDef = this.tagRepository.createOrGetTag(tagName);
                this.tagRepository.incrementUsage(tagName);
                return new Tag(tagDef.name, tagDef.color);
            });
        }

        // Update expiration date if provided
        // Pass null to remove expiration date
        if (expirationDate !== undefined) {
            if (expirationDate === null) {
                delete note.expirationDate;
            } else {
                note.expirationDate = expirationDate;
            }
        }

        this.saveNotes(notes);
        return note;
    }

    public deleteNote(id: string): boolean {
        const notes = this.loadNotes();
        const note = notes.find((n) => n.id === id);

        if (note) {
            // Decrement usage count for all tags in the note
            note.tags.forEach(tag => {
                this.tagRepository.decrementUsage(tag.name);
            });
        }

        const initialLength = notes.length;
        const filteredNotes = notes.filter((n) => n.id !== id);
        if (filteredNotes.length === initialLength) {
            return false; // Note not found
        }
        this.saveNotes(filteredNotes);
        return true;
    }

    public deleteExpiredNotes(): number {
        const notes = this.loadNotes();
        const now = new Date();
        const initialLength = notes.length;

        const activeNotes = notes.filter(note => {
            if (note.expirationDate) {
                const expiration = new Date(note.expirationDate);
                if (expiration <= now) {
                    // Note is expired, decrement tag usage
                    note.tags.forEach(tag => {
                        this.tagRepository.decrementUsage(tag.name);
                    });
                    return false; // Remove from list
                }
            }
            return true; // Keep note
        });

        if (activeNotes.length !== initialLength) {
            this.saveNotes(activeNotes);
            return initialLength - activeNotes.length;
        }

        return 0;
    }

    public getTagRepository(): TagRepository {
        return this.tagRepository;
    }
}
