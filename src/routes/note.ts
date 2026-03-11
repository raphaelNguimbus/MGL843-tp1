import { Router } from 'express';
import { NoteManager } from '../manager/NoteManager';
import { createNoteController } from '../controllers/note';

export const createNoteRouter = (noteManager: NoteManager): Router => {
    const router = Router();
    const noteController = createNoteController(noteManager);

    // Note routes
    router.get('/notes', noteController.getNotes);
    router.post('/notes', noteController.createNote);
    router.post('/notes/:id/tags', noteController.addTagsToNote);
    router.get('/notes/search', noteController.searchNotes);
    router.get('/notes/export', noteController.exportNotes);
    router.put('/notes/:id', noteController.updateNote);
    router.delete('/notes/:id', noteController.deleteNote);

    return router;
};

