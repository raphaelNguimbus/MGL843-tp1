import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { NoteManager } from './notes';

const app = express();
const PORT = process.env.PORT || 3000;
const noteManager = new NoteManager('todo-app-cli.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API Routes

// GET /api/notes - Récupérer toutes les notes
app.get('/api/notes', (req: Request, res: Response) => {
    try {
        const notes = noteManager.listNotes();
        res.json(notes);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/notes - Créer une nouvelle note
app.post('/api/notes', (req: Request, res: Response) => {
    try {
        const { content, tags } = req.body;
        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }
        const note = noteManager.addNote(content, tags || []);
        res.status(201).json(note);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/notes/:id/tags - Ajouter des tags à une note
app.post('/api/notes/:id/tags', (req: Request, res: Response) => {
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
});

// GET /api/notes/search - Rechercher des notes
app.get('/api/notes/search', (req: Request, res: Response) => {
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string') {
            return res.status(400).json({ error: 'Query parameter "q" is required' });
        }
        const results = noteManager.searchNotes(q);
        res.json(results);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/notes/export - Exporter toutes les notes
app.get('/api/notes/export', (req: Request, res: Response) => {
    try {
        const notes = noteManager.listNotes();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="notes-export.json"');
        res.json(notes);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/notes/:id - Mettre à jour une note
app.put('/api/notes/:id', (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { content, tags } = req.body;
        const note = noteManager.updateNote(id, content, tags);
        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }
        res.json(note);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/notes/:id - Supprimer une note
app.delete('/api/notes/:id', (req: Request, res: Response) => {
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
});

// Tag Management Routes

// GET /api/tags - Get all tags
app.get('/api/tags', (req: Request, res: Response) => {
    try {
        const tagRepository = noteManager.getTagRepository();
        const tags = tagRepository.getAllTags();
        res.json(tags);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/tags - Create a new tag
app.post('/api/tags', (req: Request, res: Response) => {
    try {
        const { name, color } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Tag name is required' });
        }
        const tagRepository = noteManager.getTagRepository();
        const tag = tagRepository.createOrGetTag(name, color);
        res.status(201).json(tag);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/tags/:name - Update tag color
app.put('/api/tags/:name', (req: Request, res: Response) => {
    try {
        const { name } = req.params;
        const { color } = req.body;
        if (!color) {
            return res.status(400).json({ error: 'Color is required' });
        }
        const tagRepository = noteManager.getTagRepository();
        const tag = tagRepository.updateTag(name, color);
        if (!tag) {
            return res.status(404).json({ error: 'Tag not found' });
        }
        res.json(tag);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/tags/:name - Delete a tag
app.delete('/api/tags/:name', (req: Request, res: Response) => {
    try {
        const { name } = req.params;
        const tagRepository = noteManager.getTagRepository();

        // Check if tag is in use
        const tag = tagRepository.getTagByName(name);
        if (tag && tag.usageCount > 0) {
            return res.status(400).json({
                error: 'Cannot delete tag that is in use',
                usageCount: tag.usageCount
            });
        }

        const deleted = tagRepository.deleteTag(name);
        if (!deleted) {
            return res.status(404).json({ error: 'Tag not found' });
        }
        res.status(204).send();
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Notes Web Server running at http://localhost:${PORT}`);
    console.log(`📝 Access the web interface at http://localhost:${PORT}`);
});
