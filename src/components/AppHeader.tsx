import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import logo from '@/assets/logo.jpg';

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
          <img src={logo} alt="Tech Subx BD" className="h-10 w-auto rounded-lg" />
          <h1 className="font-display text-xl font-bold gradient-text">Tech Subx BD</h1>
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
