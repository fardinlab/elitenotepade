import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  memberEmail: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmModal({
  isOpen,
  memberEmail,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto glass-card rounded-2xl p-6 z-50 card-shadow"
          >
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-destructive/20 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-destructive" />
              </div>
              <h2 className="font-display text-lg font-bold mb-2">Remove Member?</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Are you sure you want to remove <span className="font-medium text-foreground">{memberEmail}</span> from your team?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 py-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 py-3 rounded-xl bg-destructive text-destructive-foreground font-medium hover:opacity-90 transition-opacity"
                >
                  Remove
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
