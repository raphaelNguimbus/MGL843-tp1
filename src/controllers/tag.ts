import { Request, Response } from 'express';
import { TagService } from '../service/TagService';

export const createTagController = (tagService: TagService) => {
    return {
        // GET /tags - Get all tags
        getTags: (req: Request, res: Response) => {
            try {
                const tags = tagService.getAllTags();
                res.json(tags);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        },

        // POST /tags - Create a new tag
        createTag: (req: Request, res: Response) => {
            try {
                const { name, color } = req.body;
                if (!name) {
                    return res.status(400).json({ error: 'Tag name is required' });
                }
                const tag = tagService.createOrGetTag(name, color);
                res.status(201).json(tag);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        },

        // PUT /tags/:name - Update tag color
        updateTag: (req: Request, res: Response) => {
            try {
                const { name } = req.params;
                const { color } = req.body;
                if (!color) {
                    return res.status(400).json({ error: 'Color is required' });
                }
                const tag = tagService.updateTag(name, color);
                if (!tag) {
                    return res.status(404).json({ error: 'Tag not found' });
                }
                res.json(tag);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        },

        // DELETE /tags/:name - Delete a tag
        deleteTag: (req: Request, res: Response) => {
            try {
                const { name } = req.params;
                const deleted = tagService.deleteTag(name);
                if (!deleted) {
                    return res.status(404).json({ error: 'Tag not found' });
                }
                res.status(204).send();
            } catch (error: any) {
                res.status(400).json({ error: error.message });
            }
        }
    };
};

