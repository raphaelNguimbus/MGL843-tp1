// API base URL
const API_URL = 'http://localhost:3000/api';

// DOM Elements
const notesContainer = document.getElementById('notesContainer');
const emptyState = document.getElementById('emptyState');
const createNoteForm = document.getElementById('createNoteForm');
const noteContentInput = document.getElementById('noteContent');
const searchInput = document.getElementById('searchInput');
const exportAllBtn = document.getElementById('exportAllBtn');
const toast = document.getElementById('toast');
const tagManagementContainer = document.getElementById('tagManagementContainer');
const emptyTagsState = document.getElementById('emptyTagsState');
const addTagBtn = document.getElementById('addTagBtn');

// State
let allNotes = [];
let allTags = [];
let currentSearchQuery = '';
let currentEditingNoteId = null;

// Tag Input Components
let createTagInput = null;
let editTagInput = null; // Single instance for modal editing

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadNotes();
    loadTags();
    setupEventListeners();
    initializeCreateTagInput();
});

// Event Listeners
function setupEventListeners() {
    createNoteForm.addEventListener('submit', handleCreateNote);
    searchInput.addEventListener('input', handleSearch);
    exportAllBtn.addEventListener('click', handleExportAll);
    addTagBtn.addEventListener('click', handleAddNewTag);
}

// Tag Input Component Class
class TagInputComponent {
    constructor(inputId, pillsContainerId, autocompleteId) {
        this.input = document.getElementById(inputId);
        this.pillsContainer = document.getElementById(pillsContainerId);
        this.autocompleteContainer = document.getElementById(autocompleteId);
        this.selectedTags = [];
        this.autocompleteIndex = -1;
        this.filteredSuggestions = [];

        if (this.input && this.pillsContainer && this.autocompleteContainer) {
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        this.input.addEventListener('input', (e) => this.handleInput(e));
        this.input.addEventListener('keydown', (e) => this.handleKeydown(e));
        this.input.addEventListener('focus', () => this.showAutocomplete());

        // Close autocomplete when clicking outside
        document.addEventListener('click', (e) => {
            const clickedInput = e.target === this.input || this.input.contains(e.target);
            const clickedAutocomplete = e.target === this.autocompleteContainer || this.autocompleteContainer.contains(e.target);
            const isInputFocused = document.activeElement === this.input;

            if (!clickedInput && !clickedAutocomplete && !isInputFocused) {
                this.hideAutocomplete();
            }
        });
    }

    handleInput(e) {
        const query = e.target.value.trim().toLowerCase();
        this.showAutocomplete();

        if (query) {
            this.filteredSuggestions = allTags.filter(tag =>
                tag.name.toLowerCase().includes(query) &&
                !this.selectedTags.some(st => st.name.toLowerCase() === tag.name.toLowerCase())
            );
        } else {
            this.filteredSuggestions = allTags.filter(tag =>
                !this.selectedTags.some(st => st.name.toLowerCase() === tag.name.toLowerCase())
            );
        }

        this.autocompleteIndex = -1;
        this.renderAutocomplete(query);
    }

    handleKeydown(e) {
        const query = this.input.value.trim();

        if (e.key === 'Enter') {
            e.preventDefault();

            if (this.autocompleteIndex >= 0 && this.filteredSuggestions.length > 0) {
                this.addTag(this.filteredSuggestions[this.autocompleteIndex]);
            } else if (query) {
                const existingTag = allTags.find(t => t.name.toLowerCase() === query.toLowerCase());
                if (existingTag) {
                    this.addTag(existingTag);
                } else {
                    this.addTag({ name: query, color: '#8b5cf6', usageCount: 0 });
                }
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.autocompleteIndex = Math.min(this.autocompleteIndex + 1, this.filteredSuggestions.length);
            this.renderAutocomplete(query);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.autocompleteIndex = Math.max(this.autocompleteIndex - 1, -1);
            this.renderAutocomplete(query);
        } else if (e.key === 'Backspace' && !query && this.selectedTags.length > 0) {
            this.removeTag(this.selectedTags.length - 1);
        } else if (e.key === 'Escape') {
            this.hideAutocomplete();
        }
    }

    renderAutocomplete(query) {
        if (!this.filteredSuggestions.length && !query) {
            this.hideAutocomplete();
            return;
        }

        let html = '';

        this.filteredSuggestions.forEach((tag, index) => {
            const activeClass = index === this.autocompleteIndex ? 'active' : '';
            html += `
                <div class="tag-autocomplete-item ${activeClass}" data-index="${index}">
                    <div class="tag-autocomplete-label">
                        <div class="tag-autocomplete-color" style="background: ${tag.color};"></div>
                        <span class="tag-autocomplete-name">${escapeHtml(tag.name)}</span>
                    </div>
                    <span class="tag-autocomplete-count">${tag.usageCount} note${tag.usageCount !== 1 ? 's' : ''}</span>
                </div>
            `;
        });

        if (query && !allTags.some(t => t.name.toLowerCase() === query.toLowerCase())) {
            const activeClass = this.autocompleteIndex === this.filteredSuggestions.length ? 'active' : '';
            html += `
                <div class="tag-autocomplete-item ${activeClass} tag-autocomplete-create" data-index="${this.filteredSuggestions.length}">
                    <div class="tag-autocomplete-label">
                        <span class="tag-autocomplete-name">Créer "${escapeHtml(query)}"</span>
                    </div>
                </div>
            `;
        }

        this.autocompleteContainer.innerHTML = html;
        this.autocompleteContainer.style.display = 'block';

        this.autocompleteContainer.querySelectorAll('.tag-autocomplete-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                if (index < this.filteredSuggestions.length) {
                    this.addTag(this.filteredSuggestions[index]);
                } else if (query) {
                    this.addTag({ name: query, color: '#8b5cf6', usageCount: 0 });
                }
            });
        });
    }

    showAutocomplete() {
        const query = this.input.value.trim().toLowerCase();

        // Always show all available tags (excluding already selected ones)
        if (query) {
            this.filteredSuggestions = allTags.filter(tag =>
                tag.name.toLowerCase().includes(query) &&
                !this.selectedTags.some(st => st.name.toLowerCase() === tag.name.toLowerCase())
            );
        } else {
            // Show ALL available tags when no query
            this.filteredSuggestions = allTags.filter(tag =>
                !this.selectedTags.some(st => st.name.toLowerCase() === tag.name.toLowerCase())
            );
        }

        this.autocompleteIndex = -1;
        this.renderAutocomplete(query);
    }

    hideAutocomplete() {
        this.autocompleteContainer.style.display = 'none';
        this.autocompleteIndex = -1;
    }

    addTag(tag) {
        if (this.selectedTags.some(t => t.name.toLowerCase() === tag.name.toLowerCase())) {
            this.input.value = '';
            this.hideAutocomplete();
            return;
        }

        this.selectedTags.push(tag);
        this.renderPills();
        this.input.value = '';
        this.hideAutocomplete();
        this.input.focus();
    }

    removeTag(index) {
        this.selectedTags.splice(index, 1);
        this.renderPills();
    }

    renderPills() {
        this.pillsContainer.innerHTML = this.selectedTags.map((tag, index) => `
            <div class="tag-pill" style="background: ${tag.color};">
                <span>${escapeHtml(tag.name)}</span>
                <button type="button" class="tag-pill-remove" data-index="${index}">×</button>
            </div>
        `).join('');

        this.pillsContainer.querySelectorAll('.tag-pill-remove').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.removeTag(index);
            });
        });
    }

    getTags() {
        return this.selectedTags.map(t => t.name);
    }

    setTags(tagNames) {
        this.selectedTags = tagNames.map(name => {
            const existing = allTags.find(t => t.name.toLowerCase() === name.toLowerCase());
            return existing || { name, color: '#8b5cf6', usageCount: 0 };
        });
        this.renderPills();
    }

    clear() {
        this.selectedTags = [];
        this.renderPills();
        this.input.value = '';
    }

    destroy() {
        // Clean up event listeners if needed
        this.input = null;
        this.pillsContainer = null;
        this.autocompleteContainer = null;
    }
}

function initializeCreateTagInput() {
    createTagInput = new TagInputComponent('noteTags', 'selectedTags', 'tagAutocomplete');
}

// Load all tags
async function loadTags() {
    try {
        const response = await fetch(`${API_URL}/tags`);
        if (!response.ok) throw new Error('Failed to load tags');

        allTags = await response.json();
        displayTagManagement();
    } catch (error) {
        console.error('Error loading tags:', error);
    }
}

// Display tag management
function displayTagManagement() {
    if (allTags.length === 0) {
        tagManagementContainer.innerHTML = '';
        emptyTagsState.style.display = 'block';
        return;
    }

    emptyTagsState.style.display = 'none';

    tagManagementContainer.innerHTML = allTags.map(tag => `
        <div class="tag-management-item" data-tag="${escapeHtml(tag.name)}">
            <div class="tag-management-header">
                <div class="tag-management-name">
                    <input type="color" class="tag-management-color-box" value="${tag.color}" 
                           data-tag-name="${escapeHtml(tag.name)}" title="Changer la couleur">
                    <span class="tag-management-label">${escapeHtml(tag.name)}</span>
                </div>
            </div>
            <div class="tag-management-stats">
                <div class="tag-stat">
                    <span>📊</span>
                    <span>${tag.usageCount} note${tag.usageCount !== 1 ? 's' : ''}</span>
                </div>
            </div>
            <div class="tag-management-actions">
                <button class="tag-management-delete" data-tag-name="${escapeHtml(tag.name)}" 
                        ${tag.usageCount > 0 ? 'disabled' : ''} 
                        title="${tag.usageCount > 0 ? 'Ne peut pas supprimer un tag utilisé' : 'Supprimer ce tag'}">
                    Supprimer
                </button>
            </div>
        </div>
    `).join('');

    tagManagementContainer.querySelectorAll('input[type="color"]').forEach(input => {
        input.addEventListener('change', async (e) => {
            const tagName = e.target.dataset.tagName;
            const newColor = e.target.value;
            await updateTagColor(tagName, newColor);
        });
    });

    tagManagementContainer.querySelectorAll('.tag-management-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const tagName = e.target.dataset.tagName;
            await deleteTag(tagName);
        });
    });
}

// Update tag color
async function updateTagColor(tagName, color) {
    try {
        const response = await fetch(`${API_URL}/tags/${encodeURIComponent(tagName)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ color })
        });

        if (!response.ok) throw new Error('Failed to update tag color');

        showToast('🎨 Couleur du tag mise à jour!', 'success');
        await loadTags();
        await loadNotes();
    } catch (error) {
        showToast('❌ Erreur lors de la mise à jour', 'error');
        console.error('Error updating tag color:', error);
    }
}

// Delete tag
async function deleteTag(tagName) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le tag "${tagName}"?`)) return;

    try {
        const response = await fetch(`${API_URL}/tags/${encodeURIComponent(tagName)}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete tag');
        }

        showToast('🗑️ Tag supprimé', 'success');
        await loadTags();
    } catch (error) {
        showToast(`❌ ${error.message}`, 'error');
        console.error('Error deleting tag:', error);
    }
}

// Add new tag
async function handleAddNewTag() {
    const tagName = prompt('Entrez le nom du nouveau tag:');
    if (!tagName) return;

    try {
        const response = await fetch(`${API_URL}/tags`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: tagName.trim() })
        });

        if (!response.ok) throw new Error('Failed to create tag');

        showToast('✅ Tag créé!', 'success');
        await loadTags();
    } catch (error) {
        showToast('❌ Erreur lors de la création du tag', 'error');
        console.error('Error creating tag:', error);
    }
}

// Load all notes
async function loadNotes() {
    try {
        const response = await fetch(`${API_URL}/notes`);
        if (!response.ok) throw new Error('Failed to load notes');

        allNotes = await response.json();
        displayNotes(allNotes);
    } catch (error) {
        showToast('❌ Erreur lors du chargement des notes', 'error');
        console.error('Error loading notes:', error);
    }
}

// Display notes
function displayNotes(notes) {
    const validNotes = notes.filter(note => {
        if (!note.id) return false;
        if (note.FM3 || note.sourcedEntities) return false;
        return true;
    });

    if (validNotes.length === 0) {
        notesContainer.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    notesContainer.innerHTML = validNotes.map(note => {
        const content = note.content || '(Sans contenu)';
        const tags = Array.isArray(note.tags) ? note.tags : [];
        const createdAt = note.createdAt || null;

        return `
            <div class="note-card" data-id="${note.id}" onclick="openEditModal('${note.id}')">
                <div class="note-header">
                    <div class="note-date">${formatDate(createdAt)}</div>
                    <div class="note-id">#${note.id}</div>
                    <button class="btn-icon-only btn-danger" onclick="event.stopPropagation(); deleteNote('${note.id}')" title="Supprimer">
                        🗑️
                    </button>
                </div>
                <div class="note-content">${escapeHtml(content)}</div>
                <div class="note-tags">
                    ${tags.map(tag => {
            const tagName = tag?.name || tag || 'unknown';
            const tagColor = tag?.color || '#8b5cf6';
            return `<span class="tag" style="background: ${tagColor}; border-color: ${tagColor};">${escapeHtml(tagName)}</span>`;
        }).join('')}
                </div>
            </div>
        `;
    }).join('');
}

// Open edit modal
function openEditModal(noteId) {
    const note = allNotes.find(n => n.id === noteId);
    if (!note) return;

    currentEditingNoteId = noteId;

    // Populate modal
    document.getElementById('modalNoteId').textContent = `#${noteId}`;
    document.getElementById('editNoteContent').value = note.content || '';

    // Initialize or reinitialize edit tag input
    if (!editTagInput) {
        editTagInput = new TagInputComponent('editNoteTags', 'editSelectedTags', 'editTagAutocomplete');
    }

    const tags = Array.isArray(note.tags) ? note.tags : [];
    const tagNames = tags.map(t => t.name || t);
    editTagInput.setTags(tagNames);

    // Show modal
    document.getElementById('editModal').style.display = 'flex';

    // Focus on content textarea
    setTimeout(() => {
        document.getElementById('editNoteContent').focus();
    }, 100);
}

// Close edit modal
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    currentEditingNoteId = null;

    // Clear form
    document.getElementById('editNoteContent').value = '';
    if (editTagInput) {
        editTagInput.clear();
    }
}

// Save edited note
async function saveEditedNote() {
    if (!currentEditingNoteId) return;

    const content = document.getElementById('editNoteContent').value.trim();
    const tags = editTagInput ? editTagInput.getTags() : [];

    if (!content) {
        showToast('⚠️ Le contenu ne peut pas être vide', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/notes/${currentEditingNoteId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, tags })
        });

        if (!response.ok) throw new Error('Failed to update note');

        showToast('✅ Note modifiée avec succès!', 'success');
        closeEditModal();

        await loadNotes();
        await loadTags();
    } catch (error) {
        showToast('❌ Erreur lors de la modification', 'error');
        console.error('Error updating note:', error);
    }
}


// Create note
async function handleCreateNote(e) {
    e.preventDefault();

    const content = noteContentInput.value.trim();
    const tags = createTagInput.getTags();

    if (!content) {
        showToast('⚠️ Le contenu ne peut pas être vide', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, tags })
        });

        if (!response.ok) throw new Error('Failed to create note');

        const newNote = await response.json();
        showToast('✅ Note créée avec succès!', 'success');

        noteContentInput.value = '';
        createTagInput.clear();

        await loadNotes();
        await loadTags();
    } catch (error) {
        showToast('❌ Erreur lors de la création de la note', 'error');
        console.error('Error creating note:', error);
    }
}

// Search notes
async function handleSearch(e) {
    const query = e.target.value.trim();
    currentSearchQuery = query;

    if (!query) {
        displayNotes(allNotes);
        return;
    }

    try {
        const response = await fetch(`${API_URL}/notes/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Search failed');

        const results = await response.json();
        displayNotes(results);
    } catch (error) {
        showToast('❌ Erreur lors de la recherche', 'error');
        console.error('Error searching notes:', error);
    }
}

// Export single note
async function exportNote(noteId) {
    const note = allNotes.find(n => n.id === noteId);
    if (!note) return;

    const dataStr = JSON.stringify([note], null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    downloadBlob(blob, `note-${noteId}.json`);
    showToast('📥 Note exportée!', 'success');
}

// Export all notes
async function handleExportAll() {
    try {
        const response = await fetch(`${API_URL}/notes/export`);
        if (!response.ok) throw new Error('Export failed');

        const blob = await response.blob();
        downloadBlob(blob, 'all-notes-export.json');
        showToast('📥 Toutes les notes exportées!', 'success');
    } catch (error) {
        showToast('❌ Erreur lors de l\'export', 'error');
        console.error('Error exporting notes:', error);
    }
}

// Delete note
async function deleteNote(noteId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette note?')) return;

    try {
        const response = await fetch(`${API_URL}/notes/${noteId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete note');

        showToast('🗑️ Note supprimée', 'success');

        const noteCard = document.querySelector(`[data-id="${noteId}"]`);
        if (noteCard) {
            noteCard.style.animation = 'scaleOut 0.3s ease';
            setTimeout(async () => {
                await loadNotes();
                await loadTags();
            }, 300);
        } else {
            await loadNotes();
            await loadTags();
        }
    } catch (error) {
        showToast('❌ Erreur lors de la suppression', 'error');
        console.error('Error deleting note:', error);
    }
}

// Utility Functions

function formatDate(isoString) {
    if (!isoString) return 'Date inconnue';

    const date = new Date(isoString);

    if (isNaN(date.getTime())) {
        return 'Date invalide';
    }

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function escapeHtml(text) {
    if (text === undefined || text === null) return '';
    if (typeof text !== 'string') return String(text);

    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

function showToast(message, type = 'info') {
    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Add scaleOut animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes scaleOut {
        to {
            opacity: 0;
            transform: scale(0.8);
        }
    }
    
    .note-card {
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .note-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(139, 92, 246, 0.2);
    }
    
    .note-card-edit {
        background: var(--bg-card);
        border-radius: var(--border-radius);
        padding: 1.5rem;
        backdrop-filter: blur(10px);
        border: 1px solid hsla(0, 0%, 100%, 0.1);
        animation: scaleIn 0.3s ease;
    }
    
    .note-edit-actions {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
        margin-top: 1rem;
    }
    
    .btn-icon-only {
        background: none;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0.25rem 0.5rem;
        border-radius: var(--border-radius-sm);
        transition: all var(--transition-base);
    }
    
    .btn-icon-only:hover {
        transform: scale(1.1);
    }
    
    .btn-danger:hover {
        background: rgba(239, 68, 68, 0.1);
    }
`;
document.head.appendChild(style);

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TagInputComponent,
        formatDate,
        escapeHtml,
        allNotes,
        allTags,
        displayNotes,
        createNoteForm,
        noteContentInput,
        searchInput
    };
}
