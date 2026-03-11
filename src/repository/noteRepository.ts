import fs from 'fs';
import path from 'path';
import type { Note } from '../manager/NoteManager';

export interface NoteRepository {
    loadAll(): Note[];
    saveAll(notes: Note[]): void;
    exportTo(filePath: string): void;
}

export class FileNoteRepository implements NoteRepository {
    private filePath: string;

    constructor(fileName: string = 'notes.json') {
        this.filePath = path.join(process.cwd(), fileName);
    }

    public loadAll(): Note[] {
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

    public saveAll(notes: Note[]): void {
        fs.writeFileSync(this.filePath, JSON.stringify(notes, null, 2));
    }

    public exportTo(filePath: string): void {
        const notes = this.loadAll();
        const targetPath = path.resolve(process.cwd(), filePath);
        fs.writeFileSync(targetPath, JSON.stringify(notes, null, 2));
    }
}

