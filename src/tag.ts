import fs from 'fs';
import path from 'path';
import { TagColorService } from './services/TagColorService';

export class Tag {
    constructor(
        public name: string,
        public color: string = TagColorService.DEFAULT_COLOR
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
    private colorService: TagColorService;

    constructor(fileName: string = 'tags.json', colorService: TagColorService = new TagColorService()) {
        this.filePath = path.join(process.cwd(), fileName);
        this.colorService = colorService;
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
            color: color || this.colorService.getNextColor(),
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

    public resolveTag(raw: string | { name: string; color?: string } | any): Tag {
        if (typeof raw === 'string') {
            const tagDef = this.getTagByName(raw);
            return new Tag(raw, tagDef?.color || TagColorService.DEFAULT_COLOR);
        } else if (raw?.name) {
            const tagDef = this.getTagByName(raw.name);
            return new Tag(raw.name, raw.color || tagDef?.color || TagColorService.DEFAULT_COLOR);
        }
        return new Tag('unknown', TagColorService.DEFAULT_COLOR);
    }
}

