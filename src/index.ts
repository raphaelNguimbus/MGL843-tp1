#!/usr/bin/env node

import { Command } from 'commander';
import { NoteManager } from './notes';

export interface ICLICommand {
    execute(program: Command, noteManager: NoteManager): void;
}

export class CreateNoteCommand implements ICLICommand {
    execute(program: Command, noteManager: NoteManager): void {
        program
            .command('create')
            .description('Create a new note')
            .argument('<content>', 'Note content')
            .option('-t, --tags <tags...>', 'Tags for the note')
            .action((content, options) => {
                const tags = options.tags || [];
                const note = noteManager.addNote(content, tags);
                console.log(`Note created with ID: ${note.id}`);
            });
    }
}

export class ListNotesCommand implements ICLICommand {
    execute(program: Command, noteManager: NoteManager): void {
        program
            .command('list')
            .description('List all notes')
            .action(() => {
                const notes = noteManager.listNotes();
                if (notes.length === 0) {
                    console.log('No notes found.');
                } else {
                    notes.forEach((note) => {
                        console.log(`[${note.id}] ${note.createdAt} - ${note.content} (Tags: ${note.tags.map(t => t.name).join(', ')})`);
                    });
                }
            });
    }
}

export class TagNoteCommand implements ICLICommand {
    execute(program: Command, noteManager: NoteManager): void {
        program
            .command('tag')
            .description('Add tags to a note')
            .argument('<id>', 'Note ID')
            .argument('<tags...>', 'Tags to add')
            .action((id, tags) => {
                const note = noteManager.addTags(id, tags);
                if (note) {
                    console.log(`Tags added to note ${id}`);
                } else {
                    console.error(`Note with ID ${id} not found.`);
                }
            });
    }
}

export class SearchNotesCommand implements ICLICommand {
    execute(program: Command, noteManager: NoteManager): void {
        program
            .command('search')
            .description('Search notes by content or tags')
            .argument('<query>', 'Search query')
            .action((query) => {
                const results = noteManager.searchNotes(query);
                if (results.length === 0) {
                    console.log('No matching notes found.');
                } else {
                    results.forEach((note) => {
                        console.log(`[${note.id}] ${note.content} (Tags: ${note.tags.map(t => t.name).join(', ')})`);
                    });
                }
            });
    }
}

export class ExportNotesCommand implements ICLICommand {
    execute(program: Command, noteManager: NoteManager): void {
        program
            .command('export')
            .description('Export notes to a JSON file')
            .argument('<file>', 'Output file path')
            .action((file) => {
                try {
                    noteManager.exportNotes(file);
                    console.log(`Notes exported to ${file}`);
                } catch (e: any) {
                    console.error(`Failed to export notes: ${e.message}`);
                }
            });
    }
}

class NotesCLI {
    private program: Command;
    private noteManager: NoteManager;
    private commands: ICLICommand[];

    constructor() {
        this.program = new Command();
        this.noteManager = new NoteManager();
        this.commands = [
            new CreateNoteCommand(),
            new ListNotesCommand(),
            new TagNoteCommand(),
            new SearchNotesCommand(),
            new ExportNotesCommand()
        ];
        this.configure();
    }

    private configure() {
        this.program
            .name('notes')
            .description('CLI for managing personal notes')
            .version('1.0.0');

        this.commands.forEach(cmd => cmd.execute(this.program, this.noteManager));
    }

    public run() {
        this.program.parse();
    }
}

const cli = new NotesCLI();
cli.run();
