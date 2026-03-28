import type { Note } from '../domain/note';
import type { TagDefinition } from '../domain/tag';
import type { TagRepository } from '../repository/tagRepository';

export class TagService {
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

    constructor(private repository: TagRepository) { }

    private getNextColor(): string {
        const color = this.colorPalette[this.colorIndex % this.colorPalette.length];
        this.colorIndex++;
        return color;
    }

    public getAllTags(): TagDefinition[] {
        return this.repository.loadAll();
    }

    public getTagByName(name: string): TagDefinition | null {
        const tags = this.repository.loadAll();
        return tags.find(t => t.name.toLowerCase() === name.toLowerCase()) || null;
    }

    public createOrGetTag(name: string, color?: string): TagDefinition {
        const tags = this.repository.loadAll();
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
        this.repository.saveAll(tags);
        return newTag;
    }

    public updateTag(name: string, color: string): TagDefinition | null {
        const tags = this.repository.loadAll();
        const tag = tags.find(t => t.name.toLowerCase() === name.toLowerCase());

        if (!tag) {
            return null;
        }

        tag.color = color;
        this.repository.saveAll(tags);
        return tag;
    }

    public deleteTag(name: string): boolean {
        const tags = this.repository.loadAll();
        const initialLength = tags.length;
        const filteredTags = tags.filter(t => t.name.toLowerCase() !== name.toLowerCase());

        if (filteredTags.length === initialLength) {
            return false;
        }

        this.repository.saveAll(filteredTags);
        return true;
    }

    public incrementUsage(name: string): void {
        const tags = this.repository.loadAll();
        const tag = tags.find(t => t.name.toLowerCase() === name.toLowerCase());

        if (tag) {
            tag.usageCount++;
            this.repository.saveAll(tags);
        }
    }

    public decrementUsage(name: string): void {
        const tags = this.repository.loadAll();
        const tag = tags.find(t => t.name.toLowerCase() === name.toLowerCase());

        if (tag && tag.usageCount > 0) {
            tag.usageCount--;
            this.repository.saveAll(tags);
        }
    }

    public recalculateUsageCounts(allNotes: Note[]): void {
        const tags = this.repository.loadAll();

        // Reset all counts then rebuild from notes.
        tags.forEach(t => t.usageCount = 0);

        allNotes.forEach(note => {
            note.tags.forEach(tag => {
                const tagDef = tags.find(t => t.name.toLowerCase() === tag.name.toLowerCase());
                if (tagDef) {
                    tagDef.usageCount++;
                }
            });
        });

        this.repository.saveAll(tags);
    }
}
