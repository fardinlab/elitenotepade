import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, User } from 'lucide-react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useNotepads } from '@/hooks/useNotepads';
import { MAX_MEMBERS, SubscriptionType } from '@/types/member';
import { AppHeader } from '@/components/AppHeader';
import { AddMemberModal } from '@/components/AddMemberModal';
import { SettingsModal } from '@/components/SettingsModal';
import { ActionControls } from '@/components/ActionControls';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { TeamList } from '@/components/TeamList';
import { GlobalSearch } from '@/components/GlobalSearch';
import { NotepadSection } from '@/components/NotepadSection';
import { toast } from 'sonner';

const Index = () => {
  const navigate = useNavigate();
  const {
    activeTeam,
    sortedTeams,
    isLoaded,
    setActiveTeam,
    createNewTeam,
    deleteTeam,
    updateTeamLogo,
    addMember,
    removeMember,
    canAddMember,
    exportData,
    importData,
    searchMembers,
    memberCount,
  } = useSupabaseData();

  const {
    notepads,
    activeNotepad,
    setActiveNotepadId,
    createNotepad,
    updateNotepad,
    deleteNotepad,
  } = useNotepads();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRemoveMode, setIsRemoveMode] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; email: string } | null>(null);
  const [showNotepads, setShowNotepads] = useState(false);

  const handleAddMember = async (member: { email: string; phone: string; telegram?: string; joinDate: string }) => {
    const success = await addMember(member);
    if (success) {
      toast.success('Member added successfully!');
    } else {
      toast.error(`Maximum ${MAX_MEMBERS} members allowed`);
    }
    return success;
  };

  const handleRemoveMember = (id: string, email: string) => {
    setDeleteConfirm({ id, email });
  };

  const confirmRemove = async () => {
    if (deleteConfirm) {
      await removeMember(deleteConfirm.id);
      toast.success('Member removed');
      setDeleteConfirm(null);
      if (activeTeam && activeTeam.members.length === 1) {
        setIsRemoveMode(false);
      }
    }
  };

  const handleImport = (json: string) => {
    const success = importData(json);
    if (success) {
      toast.success('Data imported successfully!');
    } else {
      toast.error('Failed to import data');
    }
    return success;
  };

  const getBackupData = () => {
    return {
      teams: sortedTeams,
      notepads: notepads,
      exportedAt: new Date().toISOString(),
    };
  };

  const handleRestoreData = (data: any) => {
    if (data && typeof data === 'object') {
      const jsonString = JSON.stringify(data);
      const success = importData(jsonString);
      if (success) {
        toast.success('Data restored from Google Drive!');
      } else {
        toast.error('Failed to restore data');
      }
    }
  };

  const handleCreateNewTeam = async (teamName: string, logo?: SubscriptionType) => {
    await createNewTeam(teamName, logo);
    toast.success('New team created!');
  };

  const handleDeleteTeam = async (teamId: string) => {
    await deleteTeam(teamId);
    toast.success('Team deleted!');
  };

  const handleSelectTeam = (teamId: string) => {
    setActiveTeam(teamId);
    setIsRemoveMode(false);
  };

  const handleCreateNotepad = () => {
    createNotepad();
    toast.success('New notepad created!');
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] pb-28" style={{ paddingBottom: 'max(7rem, calc(7rem + env(safe-area-inset-bottom)))' }}>
      <AppHeader onSettingsClick={() => setIsSettingsOpen(true)} />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {showNotepads ? (
          <NotepadSection
            notepads={notepads}
            activeNotepad={activeNotepad}
            onCreateNotepad={handleCreateNotepad}
            onSelectNotepad={setActiveNotepadId}
            onUpdateNotepad={updateNotepad}
            onDeleteNotepad={deleteNotepad}
            onClose={() => {
              setShowNotepads(false);
              setActiveNotepadId(null);
            }}
          />
        ) : (
          <>
            {/* Top Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              {/* Create Blank Notepad Button */}
              <motion.button
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setShowNotepads(true)}
                className="p-4 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 hover:border-amber-500/50 transition-all flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm">Notepad</h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {notepads.length > 0 ? `${notepads.length} note${notepads.length > 1 ? 's' : ''}` : 'Create notes'}
                  </p>
                </div>
              </motion.button>

              {/* Profile Button */}
              <motion.button
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => navigate('/profile')}
                className="p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 hover:border-purple-500/50 transition-all flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm">Profile</h3>
                  <p className="text-xs text-muted-foreground truncate">View & edit profile</p>
                </div>
              </motion.button>
            </div>

            {/* Global Search */}
            <GlobalSearch onSearch={searchMembers} onSelectTeam={handleSelectTeam} />

            {/* Team List */}
            <TeamList
              teams={sortedTeams}
              activeTeamId={activeTeam?.id || ''}
              onSelectTeam={handleSelectTeam}
              onCreateTeam={handleCreateNewTeam}
              onDeleteTeam={handleDeleteTeam}
              onUpdateTeamLogo={updateTeamLogo}
            />
          </>
        )}
      </main>

      {!showNotepads && (
        <ActionControls
          canAdd={canAddMember}
          isRemoveMode={isRemoveMode}
          onAddClick={() => setIsAddModalOpen(true)}
          onRemoveModeToggle={() => setIsRemoveMode(!isRemoveMode)}
          memberCount={memberCount}
          maxMembers={MAX_MEMBERS}
        />
      )}

      <AddMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddMember}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onExport={exportData}
        onImport={handleImport}
        getBackupData={getBackupData}
        onRestoreData={handleRestoreData}
      />

      <DeleteConfirmModal
        isOpen={!!deleteConfirm}
        memberEmail={deleteConfirm?.email || ''}
        onConfirm={confirmRemove}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
};

export default Index;
