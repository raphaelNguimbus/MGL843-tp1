import fs from 'fs';
import path from 'path';
import type { Note } from './manager/NoteManager';

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

