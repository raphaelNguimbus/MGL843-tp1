import fs from 'fs';
import path from 'path';
import type { TagDefinition } from '../domain/tag';

export interface TagRepository {
    loadAll(): TagDefinition[];
    saveAll(tags: TagDefinition[]): void;
}

export class FileTagRepository implements TagRepository {
    private filePath: string;

    constructor(fileName: string = 'tags.json') {
        this.filePath = path.join(process.cwd(), fileName);
    }

    public loadAll(): TagDefinition[] {
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

    public saveAll(tags: TagDefinition[]): void {
        fs.writeFileSync(this.filePath, JSON.stringify(tags, null, 2));
    }
}
