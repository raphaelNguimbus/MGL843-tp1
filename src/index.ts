#!/usr/bin/env node

import { Command } from 'commander';
import { NoteManager } from './notes';

class NotesCLI {
    private program: Command;
    private noteManager: NoteManager;

    constructor() {
        this.program = new Command();
        this.noteManager = new NoteManager();
        this.configure();
    }

    private configure() {
        this.program
            .name('notes')
            .description('CLI for managing personal notes')
            .version('1.0.0');

        this.program
            .command('create')
            .description('Create a new note')
            .argument('<content>', 'Note content')
            .option('-t, --tags <tags...>', 'Tags for the note')
            .action((content, options) => {
                const tags = options.tags || [];
                const note = this.noteManager.addNote(content, tags);
                console.log(`Note created with ID: ${note.id}`);
            });

        this.program
            .command('list')
            .description('List all notes')
            .action(() => {
                const notes = this.noteManager.listNotes();
                if (notes.length === 0) {
                    console.log('No notes found.');
                } else {
                    notes.forEach((note) => {
                        console.log(`[${note.id}] ${note.createdAt} - ${note.content} (Tags: ${note.tags.join(', ')})`);
                    });
                }
            });

        this.program
            .command('tag')
            .description('Add tags to a note')
            .argument('<id>', 'Note ID')
            .argument('<tags...>', 'Tags to add')
            .action((id, tags) => {
                const note = this.noteManager.addTags(id, tags);
                if (note) {
                    console.log(`Tags added to note ${id}`);
                } else {
                    console.error(`Note with ID ${id} not found.`);
                }
            });

        this.program
            .command('search')
            .description('Search notes by content or tags')
            .argument('<query>', 'Search query')
            .action((query) => {
                const results = this.noteManager.searchNotes(query);
                if (results.length === 0) {
                    console.log('No matching notes found.');
                } else {
                    results.forEach((note) => {
                        console.log(`[${note.id}] ${note.content} (Tags: ${note.tags.join(', ')})`);
                    });
                }
            });

        this.program
            .command('export')
            .description('Export notes to a JSON file')
            .argument('<file>', 'Output file path')
            .action((file) => {
                try {
                    this.noteManager.exportNotes(file);
                    console.log(`Notes exported to ${file}`);
                } catch (e: any) {
                    console.error(`Failed to export notes: ${e.message}`);
                }
            });
    }

    public run() {
        this.program.parse();
    }
}

const cli = new NotesCLI();
cli.run();
