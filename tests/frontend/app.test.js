/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

// Mock fetch globally
global.fetch = jest.fn();

// Load the HTML content to set up the DOM
const html = fs.readFileSync(path.resolve(__dirname, '../../public/index.html'), 'utf8');

describe('Frontend App', () => {
    let app;

    beforeEach(() => {
        // Reset DOM
        document.documentElement.innerHTML = html.toString();

        // Reset mocks
        fetch.mockClear();

        // Mock API responses
        fetch.mockResolvedValue({
            ok: true,
            json: async () => []
        });

        // We need to reload the app module to re-attach event listeners to the new DOM
        jest.resetModules();
        app = require('../../public/app.js');
    });

    test('formatDate correctly formats dates', () => {
        const { formatDate } = app;
        const now = new Date();

        expect(formatDate(now.toISOString())).toBe('À l\'instant');

        const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);
        expect(formatDate(fiveMinutesAgo.toISOString())).toBe('Il y a 5 min');

        const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000);
        expect(formatDate(twoHoursAgo.toISOString())).toBe('Il y a 2h');
    });

    test('escapeHtml escapes special characters', () => {
        const { escapeHtml } = app;

        expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
        expect(escapeHtml('Hello & World')).toBe('Hello &amp; World');
    });

    test('TagInputComponent adds tags correctly', () => {
        const { TagInputComponent } = app;

        // Mock elements for the component
        const input = document.createElement('input');
        input.id = 'testInput';
        document.body.appendChild(input);

        const pills = document.createElement('div');
        pills.id = 'testPills';
        document.body.appendChild(pills);

        const autocomplete = document.createElement('div');
        autocomplete.id = 'testAutocomplete';
        document.body.appendChild(autocomplete);

        const component = new TagInputComponent('testInput', 'testPills', 'testAutocomplete');

        // Test adding a tag
        component.addTag({ name: 'test', color: '#000000' });
        expect(component.selectedTags).toHaveLength(1);
        expect(component.selectedTags[0].name).toBe('test');

        // Verify pill rendering
        expect(pills.innerHTML).toContain('test');

        // Test removing a tag
        component.removeTag(0);
        expect(component.selectedTags).toHaveLength(0);
        expect(pills.innerHTML).not.toContain('test');
    });
});
