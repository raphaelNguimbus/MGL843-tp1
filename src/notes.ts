import fs from 'fs';
import path from 'path';

export class Tag {
    constructor(public name: string) { }

    toString(): string {
        return this.name;
    }

    toJSON(): string {
        return this.name;
    }
}

export interface Note {
    id: string;
    content: string;
    tags: Tag[];
    createdAt: string;
}

export class NoteManager {
    private filePath: string;

    constructor(fileName: string = 'notes.json') {
        this.filePath = path.join(process.cwd(), fileName);
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
        const notes = this.loadNotes();
        const newNote: Note = {
            id: Date.now().toString(),
            content,
            tags: tags.map(t => new Tag(t)),
            createdAt: new Date().toISOString(),
        };
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
            // Avoid duplicates
            const existingTagNames = new Set(note.tags.map(t => t.name));
            tags.forEach(t => {
                if (!existingTagNames.has(t)) {
                    note.tags.push(new Tag(t));
                    existingTagNames.add(t);
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
        return notes.filter((n) =>
            n.content.toLowerCase().includes(lowerQuery) ||
            n.tags.some((t) => t.name.toLowerCase().includes(lowerQuery))
        );
    }

    public exportNotes(filePath: string): void {
        const notes = this.loadNotes();
        const targetPath = path.resolve(process.cwd(), filePath);
        fs.writeFileSync(targetPath, JSON.stringify(notes, null, 2));
    }
}
