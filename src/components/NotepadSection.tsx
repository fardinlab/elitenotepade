import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, Trash2, Pencil, Check, X, ChevronLeft, Calendar } from 'lucide-react';
import { Notepad } from '@/types/member';
import { RichTextEditor } from './RichTextEditor';

interface NotepadSectionProps {
  notepads: Notepad[];
  activeNotepad: Notepad | null;
  onCreateNotepad: () => void;
  onSelectNotepad: (id: string) => void;
  onUpdateNotepad: (id: string, updates: Partial<Pick<Notepad, 'title' | 'content'>>) => void;
  onDeleteNotepad: (id: string) => void;
  onClose: () => void;
}

export function NotepadSection({
  notepads,
  activeNotepad,
  onCreateNotepad,
  onSelectNotepad,
  onUpdateNotepad,
  onDeleteNotepad,
  onClose,
}: NotepadSectionProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleStartEditTitle = () => {
    if (activeNotepad) {
      setEditTitleValue(activeNotepad.title);
      setIsEditingTitle(true);
    }
  };

  const handleSaveTitle = () => {
    if (activeNotepad && editTitleValue.trim()) {
      onUpdateNotepad(activeNotepad.id, { title: editTitleValue.trim() });
      setIsEditingTitle(false);
    }
  };

  const handleCancelTitle = () => {
    setIsEditingTitle(false);
    setEditTitleValue('');
  };

  // If viewing a notepad
  if (activeNotepad) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="space-y-4"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          {isEditingTitle ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={editTitleValue}
                onChange={(e) => setEditTitleValue(e.target.value)}
                className="flex-1 bg-input rounded-lg px-3 py-2 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') handleCancelTitle();
                }}
              />
              <button
                onClick={handleSaveTitle}
                className="p-2 rounded-lg bg-success/20 text-success hover:bg-success/30 transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancelTitle}
                className="p-2 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1">
              <h2 className="text-lg font-semibold truncate">{activeNotepad.title}</h2>
              <button
                onClick={handleStartEditTitle}
                className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
              >
                <Pencil className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          )}

          <button
            onClick={() => setDeleteConfirm(activeNotepad.id)}
            className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground flex items-center gap-1 px-1">
          <Calendar className="w-3 h-3" />
          Last updated: {formatDate(activeNotepad.updatedAt)}
        </p>

        {/* Editor */}
        <RichTextEditor
          content={activeNotepad.content}
          onChange={(content) => onUpdateNotepad(activeNotepad.id, { content })}
          placeholder="Start writing your note..."
        />

        {/* Delete Confirmation */}
        <AnimatePresence>
          {deleteConfirm && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                onClick={() => setDeleteConfirm(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto glass-card rounded-2xl p-6 z-50"
              >
                <h3 className="text-lg font-semibold mb-2">Delete Note?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onDeleteNotepad(deleteConfirm);
                      setDeleteConfirm(null);
                      onClose();
                    }}
                    className="flex-1 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // Notepad list view
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold">My Notepads</h2>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCreateNotepad}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Note
        </motion.button>
      </div>

      {notepads.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No notes yet</p>
          <p className="text-sm text-muted-foreground/60">Create your first note to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notepads.map((notepad, index) => (
            <motion.button
              key={notepad.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelectNotepad(notepad.id)}
              className="w-full p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:bg-secondary/30 transition-all text-left"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground truncate">{notepad.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(notepad.updatedAt)}
                  </p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
