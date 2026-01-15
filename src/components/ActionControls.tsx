import { motion } from 'framer-motion';
import { Plus, Minus, AlertTriangle } from 'lucide-react';

interface ActionControlsProps {
  canAdd: boolean;
  isRemoveMode: boolean;
  onAddClick: () => void;
  onRemoveModeToggle: () => void;
  memberCount: number;
  maxMembers?: number;
  showMemberLimit?: boolean;
}

export function ActionControls({
  canAdd,
  isRemoveMode,
  onAddClick,
  onRemoveModeToggle,
  memberCount,
  maxMembers = 8,
  showMemberLimit = true,
}: ActionControlsProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-2 card-shadow flex items-center gap-2"
      >
        <button
          onClick={onRemoveModeToggle}
          className={`p-4 rounded-xl transition-all duration-300 active:scale-95 touch-manipulation ${
            isRemoveMode
              ? 'bg-destructive text-destructive-foreground'
              : 'bg-secondary hover:bg-secondary/80 text-foreground'
          }`}
          aria-label="Toggle remove mode"
        >
          <Minus className="w-6 h-6" />
        </button>

        <div className="w-px h-8 bg-border" />

        {canAdd ? (
          <button
            onClick={onAddClick}
            className="p-4 rounded-xl bg-gradient-to-r from-primary to-cyan-400 text-primary-foreground hover:opacity-90 transition-opacity glow-shadow active:scale-95 touch-manipulation"
            aria-label="Add member"
          >
            <Plus className="w-6 h-6" />
          </button>
        ) : showMemberLimit ? (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-muted">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
              Max {maxMembers} members
            </span>
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}
