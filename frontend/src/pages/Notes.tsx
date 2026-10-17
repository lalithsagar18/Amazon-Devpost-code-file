import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Tag,
  Trash2,
  Edit2,
  Sparkles,
  CheckSquare,
  BookOpen,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import { api } from '../services/api';
import { Note, ExtractedTaskCandidate } from '../types';

export const Notes: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');

  // Modals
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null);

  // Summarize Modal
  const [summaryData, setSummaryData] = useState<any | null>(null);
  const [summarizing, setSummarizing] = useState(false);

  // Task Extraction Modal
  const [extractData, setExtractData] = useState<{ noteId: number; tasks: ExtractedTaskCandidate[] } | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [importingTasks, setImportingTasks] = useState(false);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formTags, setFormTags] = useState('');

  useEffect(() => {
    loadNotes();
  }, [selectedTag]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const data = await api.getNotes({
        tag: selectedTag !== 'all' ? selectedTag : undefined,
        search: search.trim() || undefined,
      });
      setNotes(data);
    } catch (err: any) {
      console.error('Failed to load notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadNotes();
  };

  const openCreateModal = () => {
    setEditingNote(null);
    setFormTitle('');
    setFormContent('');
    setFormTags('');
    setIsNoteModalOpen(true);
  };

  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setFormTitle(note.title);
    setFormContent(note.content);
    setFormTags(note.tags);
    setIsNoteModalOpen(true);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) return;

    try {
      if (editingNote) {
        await api.updateNote(editingNote.id, {
          title: formTitle,
          content: formContent,
          tags: formTags,
        });
      } else {
        await api.createNote({
          title: formTitle,
          content: formContent,
          tags: formTags,
        });
      }

      setIsNoteModalOpen(false);
      loadNotes();
    } catch (err: any) {
      alert('Error saving note: ' + err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingNoteId) return;
    try {
      await api.deleteNote(deletingNoteId);
      setDeletingNoteId(null);
      loadNotes();
    } catch (err: any) {
      alert('Error deleting note: ' + err.message);
    }
  };

  const handleSummarize = async (noteId: number) => {
    setSummarizing(true);
    try {
      const res = await api.summarizeNote(noteId);
      setSummaryData(res);
    } catch (err: any) {
      alert('Error summarizing note: ' + err.message);
    } finally {
      setSummarizing(false);
    }
  };

  const handleExtractTasks = async (noteId: number) => {
    setExtracting(true);
    try {
      const res = await api.extractTasksFromNote(noteId);
      setExtractData({ noteId, tasks: res.extracted_tasks });
    } catch (err: any) {
      alert('Error extracting tasks: ' + err.message);
    } finally {
      setExtracting(false);
    }
  };

  const handleImportExtractedTasks = async () => {
    if (!extractData || extractData.tasks.length === 0) return;
    setImportingTasks(true);
    try {
      for (const t of extractData.tasks) {
        await api.createTask({
          title: t.title,
          description: t.description,
          priority: t.priority,
          estimated_duration: t.estimated_duration,
          category: t.category,
        });
      }
      alert(`Successfully imported ${extractData.tasks.length} task(s) into your task queue!`);
      setExtractData(null);
    } catch (err: any) {
      alert('Error importing tasks: ' + err.message);
    } finally {
      setImportingTasks(false);
    }
  };

  // Collect all unique tags
  const allTags = Array.from(
    new Set(
      notes
        .flatMap((n) => n.tags.split(','))
        .map((t) => t.trim())
        .filter(Boolean)
    )
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Notes & Knowledge Hub</h2>
          <p className="text-xs text-slate-500">
            Study lecture notes, hackathon checklists, and AI task extraction.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Note</span>
        </button>
      </div>

      {/* Search and Tags Row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes by title or content keywords..."
            className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>

        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <button
            type="button"
            onClick={() => setSelectedTag('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedTag === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All Notes
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                selectedTag === tag
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {notes.map((note) => (
          <Card key={note.id} className="flex flex-col justify-between hover:border-slate-300 transition-all">
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-bold text-sm text-slate-800 line-clamp-1">{note.title}</h4>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEditModal(note)}
                    className="p-1 text-slate-400 hover:text-blue-600 rounded"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingNoteId(note.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {note.tags && (
                <div className="flex items-center gap-1.5 flex-wrap mb-3">
                  {note.tags.split(',').map((t, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
                    >
                      {t.trim()}
                    </span>
                  ))}
                  {note.is_seed && (
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1 py-0.5 rounded border border-slate-200">
                      seed
                    </span>
                  )}
                </div>
              )}

              <p className="text-xs text-slate-600 whitespace-pre-line line-clamp-5 leading-relaxed bg-slate-50/60 p-3 rounded-lg border border-slate-100 font-mono text-[11px]">
                {note.content}
              </p>
            </div>

            {/* Smart Actions Row */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleSummarize(note.id)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100/80 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Summarize</span>
              </button>

              <button
                type="button"
                onClick={() => handleExtractTasks(note.id)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100/80 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Extract Tasks</span>
              </button>
            </div>
          </Card>
        ))}

        {notes.length === 0 && !loading && (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-slate-200">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="font-semibold text-slate-700 text-sm">No notes found</h4>
            <p className="text-xs text-slate-400 mt-1">Create a note or reset seed data to view sample notes.</p>
          </div>
        )}
      </div>

      {/* Note Edit/Create Modal */}
      <Modal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        title={editingNote ? 'Edit Note' : 'Create New Note'}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveNote} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Title *</label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g., Calculus II Exam Prep & High-Yield Topics"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tags (comma separated)</label>
            <input
              type="text"
              value={formTags}
              onChange={(e) => setFormTags(e.target.value)}
              placeholder="e.g., Study, Exam, Calculus"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Content & Checklist *</label>
            <textarea
              rows={8}
              required
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="Write your study notes, checklist items like [ ] Review chapter 4, or action bullet points..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:outline-none focus:bg-white focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsNoteModalOpen(false)}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm"
            >
              {editingNote ? 'Save Note' : 'Create Note'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Note Summary Modal */}
      <Modal
        isOpen={summaryData !== null}
        onClose={() => setSummaryData(null)}
        title="Note Analysis & Summary"
      >
        {summaryData && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-950 font-medium leading-relaxed">
              {summaryData.summary}
            </div>

            <div>
              <h5 className="font-bold text-slate-800 mb-2">Key Takeaways & Points:</h5>
              <ul className="space-y-1.5 pl-4 list-disc text-slate-600">
                {summaryData.key_points?.map((pt: string, idx: number) => (
                  <li key={idx}>{pt}</li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSummaryData(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Task Extraction Modal */}
      <Modal
        isOpen={extractData !== null}
        onClose={() => setExtractData(null)}
        title="Extracted Task Candidates"
        maxWidth="lg"
      >
        {extractData && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              The agent identified <strong>{extractData.tasks.length} actionable item(s)</strong> from your note:
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {extractData.tasks.map((t, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">{t.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{t.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                      {t.priority}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {t.estimated_duration}m
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setExtractData(null)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
              >
                Dismiss
              </button>
              <button
                type="button"
                disabled={importingTasks}
                onClick={handleImportExtractedTasks}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-sm transition-all"
              >
                {importingTasks ? 'Importing...' : `Import All ${extractData.tasks.length} Tasks`}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deletingNoteId !== null}
        onClose={() => setDeletingNoteId(null)}
        title="Confirm Note Deletion"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs text-slate-600">
          <p>Are you sure you want to delete this note?</p>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeletingNoteId(null)}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold shadow-sm"
            >
              Delete Note
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
