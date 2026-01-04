import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';

interface AppHeaderProps {
  onSettingsClick: () => void;
}

export function AppHeader({ onSettingsClick }: AppHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card sticky top-0 z-50 px-4 py-4"
      style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
    >
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center glow-shadow">
            <span className="font-display text-lg font-bold text-primary-foreground">E</span>
          </div>
          <h1 className="font-display text-xl font-bold gradient-text">Elite Notepade</h1>
        </div>
        <button
          onClick={onSettingsClick}
          className="p-2.5 rounded-lg hover:bg-secondary transition-colors active:scale-95 touch-manipulation"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
        </button>
      </div>
    </motion.header>
  );
}
