import express from 'express';
import cors from 'cors';
import path from 'path';
import { NoteManager } from './manager/NoteManager';
import { createNoteRouter } from './routes/note';
import { createTagRouter } from './routes/tag';
import { FileNoteRepository } from './repository/noteRepository';
import { FileTagRepository } from './repository/tagRepository';
import { TagService } from './service/TagService';

const app = express();
const PORT = process.env.PORT || 3000;
const noteRepository = new FileNoteRepository('notes_db.json');
const tagService = new TagService(new FileTagRepository('tags.json'));
const noteManager = new NoteManager(noteRepository, tagService);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api', createNoteRouter(noteManager));
app.use('/api', createTagRouter(tagService));

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Notes Web Server running at http://localhost:${PORT}`);
    console.log(`📝 Access the web interface at http://localhost:${PORT}`);
});

// Periodic cleanup of expired notes (every 5 seconds)
setInterval(() => {
    const deletedCount = noteManager.deleteExpiredNotes();
    if (deletedCount > 0) {
        console.log(`🧹 Deleted ${deletedCount} expired note(s)`);
    }
}, 5 * 1000);
