import type { Tag } from './tag';

export interface Note {
    id: string;
    content: string;
    tags: Tag[];
    createdAt: string;
    expirationDate?: string;
}
