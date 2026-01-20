#!/usr/bin/env node

import { Command } from 'commander';
import { addNote, listNotes, addTags, searchNotes, exportNotes } from './notes';

const program = new Command();

program
    .name('notes')
    .description('CLI for managing personal notes')
    .version('1.0.0');

program
    .command('create')
    .description('Create a new note')
    .argument('<content>', 'Note content')
    .option('-t, --tags <tags...>', 'Tags for the note')
    .action((content, options) => {
        const tags = options.tags || [];
        const note = addNote(content, tags);
        console.log(`Note created with ID: ${note.id}`);
    });

program
    .command('list')
    .description('List all notes')
    .action(() => {
        const notes = listNotes();
        if (notes.length === 0) {
            console.log('No notes found.');
        } else {
            notes.forEach((note) => {
                console.log(`[${note.id}] ${note.createdAt} - ${note.content} (Tags: ${note.tags.join(', ')})`);
            });
        }
    });

program
    .command('tag')
    .description('Add tags to a note')
    .argument('<id>', 'Note ID')
    .argument('<tags...>', 'Tags to add')
    .action((id, tags) => {
        const note = addTags(id, tags);
        if (note) {
            console.log(`Tags added to note ${id}`);
        } else {
            console.error(`Note with ID ${id} not found.`);
        }
    });

program
    .command('search')
    .description('Search notes by content or tags')
    .argument('<query>', 'Search query')
    .action((query) => {
        const results = searchNotes(query);
        if (results.length === 0) {
            console.log('No matching notes found.');
        } else {
            results.forEach((note) => {
                console.log(`[${note.id}] ${note.content} (Tags: ${note.tags.join(', ')})`);
            });
        }
    });

program
    .command('export')
    .description('Export notes to a JSON file')
    .argument('<file>', 'Output file path')
    .action((file) => {
        try {
            exportNotes(file);
            console.log(`Notes exported to ${file}`);
        } catch (e: any) {
            console.error(`Failed to export notes: ${e.message}`);
        }
    });

program.parse();
