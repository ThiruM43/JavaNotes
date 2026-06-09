'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface CustomNote {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

const STORAGE_KEY = 'custom_notes_v1';

function loadNotes(): CustomNote[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveNotes(notes: CustomNote[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)); } catch {}
}

export default function CustomNotesPage() {
  const [notes, setNotes] = useState<CustomNote[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title: '', content: '' });
  const [preview, setPreview] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const loaded = loadNotes();
    setNotes(loaded);
    if (loaded.length > 0) setSelected(loaded[0].id);
    setMounted(true);
  }, []);

  const current = notes.find((n) => n.id === selected) ?? null;

  const createNote = () => {
    const note: CustomNote = {
      id: Date.now().toString(),
      title: 'Untitled Note',
      content: '# Untitled Note\n\nStart writing here…',
      updatedAt: new Date().toISOString(),
    };
    const updated = [note, ...notes];
    setNotes(updated);
    saveNotes(updated);
    setSelected(note.id);
    setDraft({ title: note.title, content: note.content });
    setEditing(true);
  };

  const startEdit = () => {
    if (!current) return;
    setDraft({ title: current.title, content: current.content });
    setEditing(true);
    setPreview(false);
  };

  const saveEdit = () => {
    const updated = notes.map((n) =>
      n.id === selected ? { ...n, title: draft.title || 'Untitled', content: draft.content, updatedAt: new Date().toISOString() } : n
    );
    setNotes(updated);
    saveNotes(updated);
    setEditing(false);
  };

  const deleteNote = (id: string) => {
    if (!confirm('Delete this note?')) return;
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    saveNotes(updated);
    setSelected(updated[0]?.id ?? null);
    if (selected === id) setEditing(false);
  };

  if (!mounted) return (
    <div className="flex items-center justify-center h-screen text-gray-500">Loading…</div>
  );

  return (
    <div className="flex h-[calc(100vh-0px)] bg-gray-950 overflow-hidden">

      {/* Sidebar list */}
      <div className="w-56 sm:w-64 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="flex items-center justify-between px-3 py-3 border-b border-gray-800">
          <span className="text-sm font-semibold text-white">My Notes</span>
          <button
            onClick={createNote}
            className="w-7 h-7 rounded-lg bg-orange-500 hover:bg-orange-400 text-white flex items-center justify-center text-lg leading-none transition-colors"
            title="New note"
          >+</button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {notes.length === 0 && (
            <div className="p-4 text-xs text-gray-600 text-center">
              No notes yet.<br />Press + to create one.
            </div>
          )}
          {notes.map((n) => (
            <button
              key={n.id}
              onClick={() => { setSelected(n.id); setEditing(false); }}
              className={'w-full text-left px-3 py-2.5 border-b border-gray-800/50 transition-colors ' +
                (n.id === selected ? 'bg-orange-500/20' : 'hover:bg-gray-800')}
            >
              <div className={'text-sm font-medium truncate ' + (n.id === selected ? 'text-orange-300' : 'text-gray-300')}>
                {n.title}
              </div>
              <div className="text-xs text-gray-600 mt-0.5">
                {new Date(n.updatedAt).toLocaleDateString()}
              </div>
            </button>
          ))}
        </div>
        <div className="px-3 py-2 border-t border-gray-800">
          <p className="text-xs text-gray-600">{notes.length} note{notes.length !== 1 ? 's' : ''} · stored locally</p>
        </div>
      </div>

      {/* Main panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {!current ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-4">
            <span className="text-4xl">📝</span>
            <p className="text-gray-400 text-sm">Create your first personal note</p>
            <button onClick={createNote} className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white rounded-lg text-sm font-medium transition-colors">
              + New note
            </button>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 border-b border-gray-800 shrink-0 flex-wrap">
              {editing ? (
                <>
                  <input
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    className="flex-1 min-w-0 bg-gray-800 border border-gray-700 text-white text-sm px-3 py-1.5 rounded-lg outline-none focus:border-orange-500"
                    placeholder="Note title"
                  />
                  <button
                    onClick={() => setPreview(!preview)}
                    className={'text-xs px-2 py-1.5 rounded-lg border transition-colors ' +
                      (preview ? 'bg-orange-500/20 text-orange-300 border-orange-500/40' : 'border-gray-700 text-gray-400 hover:text-white')}
                  >
                    {preview ? 'Edit' : 'Preview'}
                  </button>
                  <button onClick={saveEdit} className="text-xs px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors">Save</button>
                  <button onClick={() => setEditing(false)} className="text-xs px-2 py-1.5 border border-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors">Cancel</button>
                </>
              ) : (
                <>
                  <h2 className="flex-1 font-semibold text-white text-sm truncate">{current.title}</h2>
                  <span className="text-xs text-gray-600 hidden sm:block">
                    {new Date(current.updatedAt).toLocaleString()}
                  </span>
                  <button onClick={startEdit} className="text-xs px-3 py-1.5 border border-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors">Edit</button>
                  <button onClick={() => deleteNote(current.id)} className="text-xs px-2 py-1.5 border border-red-800 text-red-500 hover:bg-red-950/30 rounded-lg transition-colors">Delete</button>
                </>
              )}
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto">
              {editing && !preview ? (
                <textarea
                  value={draft.content}
                  onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                  className="w-full h-full bg-gray-950 text-gray-200 font-mono text-sm p-4 sm:p-6 outline-none resize-none leading-relaxed"
                  placeholder="Write markdown here…"
                  spellCheck={false}
                />
              ) : (
                <div className="markdown-body p-4 sm:p-6 max-w-3xl">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {editing ? draft.content : current.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
