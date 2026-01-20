"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const CLI_PATH = path_1.default.join(__dirname, '../src/index.ts');
const NOTES_FILE = path_1.default.join(process.cwd(), 'notes.json');
const EXPORT_FILE = path_1.default.join(process.cwd(), 'exported_notes.json');
const runCli = (args) => {
    return (0, child_process_1.execSync)(`npx ts-node "${CLI_PATH}" ${args}`, { encoding: 'utf-8' });
};
describe('Notes CLI E2E', () => {
    beforeAll(() => {
        if (fs_1.default.existsSync(NOTES_FILE)) {
            fs_1.default.unlinkSync(NOTES_FILE);
        }
        if (fs_1.default.existsSync(EXPORT_FILE)) {
            fs_1.default.unlinkSync(EXPORT_FILE);
        }
    });
    afterAll(() => {
        if (fs_1.default.existsSync(NOTES_FILE)) {
            fs_1.default.unlinkSync(NOTES_FILE);
        }
        if (fs_1.default.existsSync(EXPORT_FILE)) {
            fs_1.default.unlinkSync(EXPORT_FILE);
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
        if (!idMatch)
            throw new Error('Could not find note ID');
        const id = idMatch[1];
        const output = runCli(`tag ${id} food`);
        expect(output).toContain(`Tags added to note ${id}`);
        const verifyOutput = runCli('list');
        expect(verifyOutput).toContain('food');
    });
    test('should export notes', () => {
        const output = runCli(`export "${EXPORT_FILE}"`);
        expect(output).toContain(`Notes exported to ${EXPORT_FILE}`);
        expect(fs_1.default.existsSync(EXPORT_FILE)).toBe(true);
        const content = fs_1.default.readFileSync(EXPORT_FILE, 'utf-8');
        expect(content).toContain('Buy milk');
    });
});
