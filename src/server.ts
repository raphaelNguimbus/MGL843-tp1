import express from 'express';
import cors from 'cors';
import path from 'path';
import { NoteManager } from './manager/NoteManager';
import { createNoteRouter } from './routes/note';
import { createTagRouter } from './routes/tag';
import { FileNoteRepository } from './repository/noteRepository';
import { TagRepository } from './tag';

const app = express();
const PORT = process.env.PORT || 3000;
const noteManager = new NoteManager(new FileNoteRepository("notes_db.json"), new TagRepository("tags.json"));

// Sync tag usage counts on startup to ensure consistency
const notes = noteManager.listNotes();
noteManager.getTagRepository().recalculateUsageCounts(notes);
console.log('🔄 Tag usage counts synchronized with notes database');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api', createNoteRouter(noteManager));
app.use('/api', createTagRouter(noteManager));

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
