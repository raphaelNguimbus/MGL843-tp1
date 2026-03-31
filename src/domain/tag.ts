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
