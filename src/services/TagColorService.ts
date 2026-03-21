export class TagColorService {
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

    public static readonly DEFAULT_COLOR = '#8b5cf6';

    public getNextColor(): string {
        const color = this.colorPalette[this.colorIndex % this.colorPalette.length];
        this.colorIndex++;
        return color;
    }
}
