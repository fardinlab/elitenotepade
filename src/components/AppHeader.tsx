import { motion } from 'framer-motion';
import { Settings, LogOut } from 'lucide-react';
import logo from '@/assets/logo.jpg';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AppHeaderProps {
  onSettingsClick: () => void;
}

export function AppHeader({ onSettingsClick }: AppHeaderProps) {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out successfully');
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card sticky top-0 z-50 px-4 py-4"
      style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
    >
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Elite NotePad" className="h-10 w-auto rounded-lg" />
          <div className="flex flex-col">
            <h1 className="font-display text-xl font-bold gradient-text leading-tight">Elite NotePad</h1>
            <span className="text-xs text-muted-foreground">Powered by Fardin Sagor</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onSettingsClick}
            className="p-2.5 rounded-lg hover:bg-secondary transition-colors active:scale-95 touch-manipulation"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
          </button>
          <button
            onClick={handleLogout}
            className="p-2.5 rounded-lg hover:bg-destructive/20 transition-colors active:scale-95 touch-manipulation"
            aria-label="Logout"
          >
            <LogOut className="w-5 h-5 text-muted-foreground hover:text-destructive transition-colors" />
          </button>
        </div>
      </div>
    </motion.header>
  );
}
