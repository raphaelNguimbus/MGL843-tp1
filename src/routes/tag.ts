import { Router } from 'express';
import { createTagController } from '../controllers/tag';
import { TagService } from '../service/TagService';

export const createTagRouter = (tagService: TagService): Router => {
    const router = Router();
    const tagController = createTagController(tagService);

    // Tag routes
    router.get('/tags', tagController.getTags);
    router.post('/tags', tagController.createTag);
    router.put('/tags/:name', tagController.updateTag);
    router.delete('/tags/:name', tagController.deleteTag);

    return router;
};

