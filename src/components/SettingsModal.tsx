import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Cloud, Download, Upload, CheckCircle, LogOut, Loader2, User, Save } from 'lucide-react';
import { useGoogleDrive } from '@/hooks/useGoogleDrive';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
  onImport: (json: string) => boolean | Promise<boolean>;
  getBackupData: () => object;
  onRestoreData: (data: object) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  onExport,
  onImport,
  getBackupData,
  onRestoreData,
}: SettingsModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isConnected, email: driveEmail, isLoading, connect, disconnect, backup, restore } = useGoogleDrive();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [editingName, setEditingName] = useState(false);
  const [fullName, setFullName] = useState('');
  const [savingName, setSavingName] = useState(false);

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        const success = onImport(result);
        if (success) {
          toast.success('Import successful!');
        } else {
          toast.error('Invalid file format');
        }
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBackupToCloud = async () => {
    const data = getBackupData();
    await backup(data);
  };

  const handleRestoreFromCloud = async () => {
    const data = await restore();
    if (data) {
      onRestoreData(data);
    }
  };

  const handleLogout = async () => {
    await signOut();
    onClose();
    navigate('/auth');
    toast.success('Logged out successfully');
  };

  const handleEditName = () => {
    setFullName(profile?.full_name || '');
    setEditingName(true);
  };

  const handleSaveName = async () => {
    setSavingName(true);
    await updateProfile({ full_name: fullName });
    setSavingName(false);
    setEditingName(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto glass-card rounded-2xl p-6 z-50 card-shadow max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/20">
                  <Settings className="w-5 h-5 text-primary" />
                </div>
                <h2 className="font-display text-xl font-bold">Settings</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Profile Section */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Profile
                </h3>
                {profileLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Email (read-only) */}
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Email</label>
                      <div className="p-3 rounded-xl bg-secondary/50 text-sm text-muted-foreground truncate">
                        {user?.email || profile?.email || 'No email'}
                      </div>
                    </div>

                    {/* Full Name (editable) */}
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Full Name</label>
                      {editingName ? (
                        <div className="flex gap-2">
                          <Input
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Enter your name"
                            className="flex-1"
                          />
                          <Button
                            size="sm"
                            onClick={handleSaveName}
                            disabled={savingName}
                            className="px-3"
                          >
                            {savingName ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingName(false)}
                            className="px-3"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={handleEditName}
                          className="w-full p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-sm text-left"
                        >
                          {profile?.full_name || 'Click to add name'}
                        </button>
                      )}
                    </div>

                    {/* Avatar URL (optional - display if exists) */}
                    {profile?.avatar_url && (
                      <div className="flex items-center gap-3">
                        <img
                          src={profile.avatar_url}
                          alt="Avatar"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <span className="text-sm text-muted-foreground">Profile Picture</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Local Backup Section */}
              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-semibold text-foreground mb-3">Local Backup</h3>
                <div className="flex gap-3">
                  <button
                    onClick={onExport}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-sm font-medium">Export JSON</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="text-sm font-medium">Import JSON</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileImport}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Google Drive Backup Section */}
              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Cloud className="w-4 h-4" />
                  Google Drive Backup
                </h3>

                {isLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : !isConnected ? (
                  <button
                    onClick={connect}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-primary to-cyan-400 text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Connect Google Account
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-success/10 border border-success/20">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span className="text-sm text-success truncate max-w-[180px]">{driveEmail}</span>
                      </div>
                      <button
                        onClick={disconnect}
                        className="p-1.5 rounded-lg hover:bg-destructive/20 transition-colors text-muted-foreground hover:text-destructive"
                        title="Disconnect"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleBackupToCloud}
                        disabled={isLoading}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        Backup Now
                      </button>
                      <button
                        onClick={handleRestoreFromCloud}
                        disabled={isLoading}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        Restore
                      </button>
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                      Backup saves to: elite-notepade-backup.json
                    </p>
                  </div>
                )}
              </div>

              {/* Logout Section */}
              <div className="pt-4 border-t border-border">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
