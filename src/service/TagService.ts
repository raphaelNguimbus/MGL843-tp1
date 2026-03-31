import { Tag } from '../domain/tag';
import type { TagDefinition } from '../domain/tag';
import type { TagRepository } from '../repository/tagRepository';
import { TagColorService } from './TagColorService';

export class TagService {
    private colorService: TagColorService;

    constructor(private repository: TagRepository) {
        this.colorService = new TagColorService();
    }

    public resolveTag(name: string, color?: string): Tag {
        if (color) {
            return new Tag(name, color);
        }
        const existing = this.getTagByName(name);
        if (existing) {
            return new Tag(name, existing.color);
        }
        return new Tag(name, TagColorService.DEFAULT_COLOR);
    }

    public assignTag(name: string): Tag {
        const tagDef = this.createOrGetTag(name);
        this.incrementUsage(name);
        return new Tag(tagDef.name, tagDef.color);
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
            color: color || this.colorService.getNextColor(),
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
        const tag = this.getTagByName(name);
        if (tag && tag.usageCount > 0) {
            throw new Error('Cannot delete tag that is in use');
        }

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

}
