import fs from 'fs';
import path from 'path';

export interface Note {
    id: string;
    content: string;
    tags: string[];
    createdAt: string;
}

const NOTES_FILE = path.join(process.cwd(), 'notes.json');

export const loadNotes = (): Note[] => {
    if (!fs.existsSync(NOTES_FILE)) {
        return [];
    }
    const data = fs.readFileSync(NOTES_FILE, 'utf-8');
    try {
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
};

export const saveNotes = (notes: Note[]) => {
    fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2));
};

export const addNote = (content: string, tags: string[] = []): Note => {
    const notes = loadNotes();
    const newNote: Note = {
        id: Date.now().toString(),
        content,
        tags,
        createdAt: new Date().toISOString(),
    };
    notes.push(newNote);
    saveNotes(notes);
    return newNote;
};

export const listNotes = (): Note[] => {
    return loadNotes();
};

export const addTags = (id: string, tags: string[]): Note | null => {
    const notes = loadNotes();
    const note = notes.find((n) => n.id === id);
    if (note) {
        // Avoid duplicates
        const uniqueTags = new Set([...note.tags, ...tags]);
        note.tags = Array.from(uniqueTags);
        saveNotes(notes);
        return note;
    }
    return null;
};

export const searchNotes = (query: string): Note[] => {
    const notes = loadNotes();
    const lowerQuery = query.toLowerCase();
    return notes.filter((n) =>
        n.content.toLowerCase().includes(lowerQuery) ||
        n.tags.some((t) => t.toLowerCase().includes(lowerQuery))
    );
};

export const exportNotes = (filePath: string) => {
    const notes = loadNotes();
    const targetPath = path.resolve(process.cwd(), filePath);
    fs.writeFileSync(targetPath, JSON.stringify(notes, null, 2));
}
