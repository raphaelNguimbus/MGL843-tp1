import { Tag, TagRepository } from '../tag';
import { FileNoteRepository, NoteRepository } from '../repository/noteRepository';

export interface Note {
    id: string;
    content: string;
    tags: Tag[];
    createdAt: string;
    expirationDate?: string;
}

export class NoteManager {
    private repository: NoteRepository;
    private tagRepository: TagRepository;

    constructor(
        repository: NoteRepository = new FileNoteRepository(),
        tagRepository: TagRepository = new TagRepository()
    ) {
        this.repository = repository;
        this.tagRepository = tagRepository;
    }

    private loadNotes(): Note[] {
        const rawNotes = this.repository.loadAll();
        return rawNotes.map((note: any) => ({
            ...note,
            tags: (note.tags || []).map((t: any) => this.tagRepository.resolveTag(t))
        }));
    }

    private saveNotes(notes: Note[]): void {
        this.repository.saveAll(notes);
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
        // Sort by creation date, newest first
        return notes.sort((a, b) => {
            // IDs are timestamps, so sort by ID descending
            return Number(b.id) - Number(a.id);
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
        this.repository.exportTo(filePath);
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

