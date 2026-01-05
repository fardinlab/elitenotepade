import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { motion } from 'framer-motion';
import { FileText, Info } from 'lucide-react';
import { useMultiTeamData } from '@/hooks/useMultiTeamData';
import AboutSection from '@/components/AboutSection';
import { useNotepads } from '@/hooks/useNotepads';
import { MAX_MEMBERS, SubscriptionType } from '@/types/member';
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
    deleteTeam,
    updateTeamName,
    updateAdminEmail,
    addMember,
    removeMember,
    updateMemberDate,
    updateMemberEmail,
    updateMemberTelegram,
    updateMemberPayment,
    updateMemberSubscriptions,
    canAddMember,
    exportData,
    importData,
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
  const [showAbout, setShowAbout] = useState(false);

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

  const handleCreateNewTeam = (teamName: string, logo?: SubscriptionType) => {
    createNewTeam(teamName, logo);
    toast.success('New team created!');
  };

  const handleDeleteTeam = (teamId: string) => {
    deleteTeam(teamId);
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

  if (!isLoaded || !activeTeam) {
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
        {showAbout ? (
          <>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setShowAbout(false)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              ← Back
            </motion.button>
            <AboutSection />
          </>
        ) : showNotepads ? (
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

              {/* About Button */}
              <motion.button
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setShowAbout(true)}
                className="p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 hover:border-purple-500/50 transition-all flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                  <Info className="w-5 h-5 text-white" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm">About</h3>
                  <p className="text-xs text-muted-foreground truncate">Developer info</p>
                </div>
              </motion.button>
            </div>

            {/* Global Search */}
            <GlobalSearch onSearch={searchMembers} onSelectTeam={handleSelectTeam} />

            {/* Team List */}
            <TeamList
              teams={sortedTeams}
              activeTeamId={activeTeam.id}
              onSelectTeam={handleSelectTeam}
              onCreateTeam={handleCreateNewTeam}
              onDeleteTeam={handleDeleteTeam}
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
                        onPaymentChange={updateMemberPayment}
                        onSubscriptionsChange={updateMemberSubscriptions}
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
