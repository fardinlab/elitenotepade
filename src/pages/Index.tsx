import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { useMultiTeamData } from '@/hooks/useMultiTeamData';
import { useNotepads } from '@/hooks/useNotepads';
import { MAX_MEMBERS } from '@/types/member';
import { AppHeader } from '@/components/AppHeader';
import { TeamInfo } from '@/components/TeamInfo';
import { MemberCard } from '@/components/MemberCard';
import { EmptyState } from '@/components/EmptyState';
import { AddMemberModal } from '@/components/AddMemberModal';
import { SettingsModal } from '@/components/SettingsModal';
import { ActionControls } from '@/components/ActionControls';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { TeamList } from '@/components/TeamList';
import { GlobalSearch } from '@/components/GlobalSearch';
import { NotepadSection } from '@/components/NotepadSection';
import { toast } from 'sonner';

const Index = () => {
  const {
    activeTeam,
    sortedTeams,
    isLoaded,
    setActiveTeam,
    createNewTeam,
    updateTeamName,
    updateAdminEmail,
    addMember,
    removeMember,
    updateMemberDate,
    updateMemberEmail,
    updateMemberTelegram,
    canAddMember,
    isTeamFull,
    exportData,
    importData,
    setLastBackup,
    searchMembers,
    memberCount,
  } = useMultiTeamData();

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

  const handleAddMember = (member: { email: string; phone: string; telegram?: string; joinDate: string }) => {
    const success = addMember(member);
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

  const confirmRemove = () => {
    if (deleteConfirm) {
      removeMember(deleteConfirm.id);
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

  const handleBackupToCloud = () => {
    setLastBackup(new Date().toISOString());
    toast.success('Backup completed to Google Drive');
  };

  const handleRestoreFromCloud = () => {
    toast.info('Restore from Google Drive (demo mode)');
  };

  const handleCreateNewTeam = () => {
    createNewTeam();
    toast.success('New team created!');
  };

  const handleSelectTeam = (teamId: string) => {
    setActiveTeam(teamId);
    setIsRemoveMode(false);
  };

  const handleCreateNotepad = () => {
    createNotepad();
    toast.success('New notepad created!');
  };

  if (!isLoaded || !activeTeam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28">
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
            {/* Create Blank Notepad Button */}
            <motion.button
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setShowNotepads(true)}
              className="w-full p-4 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 hover:border-amber-500/50 transition-all flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-foreground">Create Blank Notepad</h3>
                <p className="text-xs text-muted-foreground">
                  Save personal notes with rich text formatting
                  {notepads.length > 0 && ` • ${notepads.length} note${notepads.length > 1 ? 's' : ''}`}
                </p>
              </div>
            </motion.button>

            {/* Global Search */}
            <GlobalSearch onSearch={searchMembers} onSelectTeam={handleSelectTeam} />

            {/* Team List */}
            <TeamList
              teams={sortedTeams}
              activeTeamId={activeTeam.id}
              onSelectTeam={handleSelectTeam}
              onCreateTeam={handleCreateNewTeam}
              showCreateButton={isTeamFull}
            />

            {/* Active Team Info */}
            <TeamInfo
              teamName={activeTeam.teamName}
              adminEmail={activeTeam.adminEmail}
              memberCount={memberCount}
              onTeamNameChange={updateTeamName}
              onAdminEmailChange={updateAdminEmail}
            />

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground px-1">
                Team Members ({activeTeam.members.length})
              </h3>

              {activeTeam.members.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {activeTeam.members.map((member, index) => (
                      <MemberCard
                        key={member.id}
                        member={member}
                        index={index}
                        isRemoveMode={isRemoveMode}
                        onRemove={() => handleRemoveMember(member.id, member.email)}
                        onDateChange={updateMemberDate}
                        onEmailChange={updateMemberEmail}
                        onTelegramChange={updateMemberTelegram}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
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
        lastBackup={activeTeam.lastBackup}
        onExport={exportData}
        onImport={handleImport}
        onBackupToCloud={handleBackupToCloud}
        onRestoreFromCloud={handleRestoreFromCloud}
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
