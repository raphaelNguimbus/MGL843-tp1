import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const CLI_PATH = path.join(__dirname, '../src/index.ts');
const NOTES_FILE = path.join(process.cwd(), 'notes.json');
const EXPORT_FILE = path.join(process.cwd(), 'exported_notes.json');

const runCli = (args: string) => {
    return execSync(`npx ts-node "${CLI_PATH}" ${args}`, { encoding: 'utf-8' });
};

describe('Notes CLI E2E', () => {
    beforeAll(() => {
        if (fs.existsSync(NOTES_FILE)) {
            fs.unlinkSync(NOTES_FILE);
        }
        if (fs.existsSync(EXPORT_FILE)) {
            fs.unlinkSync(EXPORT_FILE);
        }
    });

    afterAll(() => {
        if (fs.existsSync(NOTES_FILE)) {
            fs.unlinkSync(NOTES_FILE);
        }
        if (fs.existsSync(EXPORT_FILE)) {
            fs.unlinkSync(EXPORT_FILE);
        }
    });

    test('should create a new note', () => {
        const output = runCli('create "Buy milk" -t shopping urgent');
        expect(output).toContain('Note created with ID:');
    });

    test('should list notes', () => {
        const output = runCli('list');
        expect(output).toContain('Buy milk');
        expect(output).toContain('Tags: shopping, urgent');
    });

    test('should search notes', () => {
        const output = runCli('search "milk"');
        expect(output).toContain('Buy milk');
    });

    test('should add tags to a note', () => {
        // Extract ID from list
        const listOutput = runCli('list');
        const idMatch = listOutput.match(/\[(\d+)\]/);
        if (!idMatch) throw new Error('Could not find note ID');
        const id = idMatch[1];

        const output = runCli(`tag ${id} food`);
        expect(output).toContain(`Tags added to note ${id}`);

        const verifyOutput = runCli('list');
        expect(verifyOutput).toContain('food');
    });

    test('should export notes', () => {
        const output = runCli(`export "${EXPORT_FILE}"`);
        expect(output).toContain(`Notes exported to ${EXPORT_FILE}`);
        expect(fs.existsSync(EXPORT_FILE)).toBe(true);
        const content = fs.readFileSync(EXPORT_FILE, 'utf-8');
        expect(content).toContain('Buy milk');
    });
});
