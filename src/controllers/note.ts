import { Request, Response } from 'express';
import { NoteManager } from '../manager/NoteManager';

export const createNoteController = (noteManager: NoteManager) => {
    return {
        // GET /notes - Get all notes
        getNotes: (req: Request, res: Response) => {
            try {
                const notes = noteManager.listNotes();
                res.json(notes);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        },

        // POST /notes - Create a new note
        createNote: (req: Request, res: Response) => {
            try {
                const { content, tags, expirationDate } = req.body;
                if (!content) {
                    return res.status(400).json({ error: 'Content is required' });
                }
                const note = noteManager.addNote(content, tags || [], expirationDate);
                res.status(201).json(note);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        },

        // POST /notes/:id/tags - Add tags to a note
        addTagsToNote: (req: Request, res: Response) => {
            try {
                const { id } = req.params;
                const { tags } = req.body;
                if (!tags || !Array.isArray(tags)) {
                    return res.status(400).json({ error: 'Tags array is required' });
                }
                const note = noteManager.addTags(id, tags);
                if (!note) {
                    return res.status(404).json({ error: 'Note not found' });
                }
                res.json(note);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        },

        // GET /notes/search - Search notes
        searchNotes: (req: Request, res: Response) => {
            try {
                const { q } = req.query;
                if (!q || typeof q !== 'string') {
                    return res.status(400).json({ error: 'Query parameter "q" is required' });
                }
                const results = noteManager.searchNotes(q as string);
                res.json(results);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        },

        // GET /notes/export - Export all notes
        exportNotes: (req: Request, res: Response) => {
            try {
                const notes = noteManager.listNotes();
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', 'attachment; filename="notes-export.json"');
                res.json(notes);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        },

        // PUT /notes/:id - Update a note
        updateNote: (req: Request, res: Response) => {
            try {
                const { id } = req.params;
                const { content, tags, expirationDate } = req.body;
                const note = noteManager.updateNote(id, content, tags, expirationDate);
                if (!note) {
                    return res.status(404).json({ error: 'Note not found' });
                }
                res.json(note);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        },

        // DELETE /notes/:id - Delete a note
        deleteNote: (req: Request, res: Response) => {
            try {
                const { id } = req.params;
                const deleted = noteManager.deleteNote(id);
                if (!deleted) {
                    return res.status(404).json({ error: 'Note not found' });
                }
                res.status(204).send();
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        }
    };
};

