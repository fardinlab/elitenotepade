import { motion } from 'framer-motion';
import { Settings, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.jpg';
import { useProfile } from '@/hooks/useProfile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AppHeaderProps {
  onSettingsClick: () => void;
}

export function AppHeader({ onSettingsClick }: AppHeaderProps) {
  const navigate = useNavigate();
  const { profile } = useProfile();

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return 'U';
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
            onClick={() => navigate('/profile')}
            className="rounded-full hover:ring-2 hover:ring-primary/50 transition-all active:scale-95 touch-manipulation"
            aria-label="Profile"
          >
            <Avatar className="w-9 h-9 border-2 border-primary/20">
              <AvatarImage src={profile?.avatar_url || undefined} alt="Profile" />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          </button>
        </div>
      </div>
    </motion.header>
  );
}
