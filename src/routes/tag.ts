import { Router } from 'express';
import { NoteManager } from '../manager/NoteManager';
import { createTagController } from '../controllers/tag';

export const createTagRouter = (noteManager: NoteManager): Router => {
    const router = Router();
    const tagController = createTagController(noteManager);

    // Tag routes
    router.get('/tags', tagController.getTags);
    router.post('/tags', tagController.createTag);
    router.put('/tags/:name', tagController.updateTag);
    router.delete('/tags/:name', tagController.deleteTag);

    return router;
};

