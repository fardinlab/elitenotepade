import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useTeamData } from '@/hooks/useTeamData';
import { MAX_MEMBERS } from '@/types/member';
import { AppHeader } from '@/components/AppHeader';
import { TeamInfo } from '@/components/TeamInfo';
import { MemberCard } from '@/components/MemberCard';
import { EmptyState } from '@/components/EmptyState';
import { AddMemberModal } from '@/components/AddMemberModal';
import { SettingsModal } from '@/components/SettingsModal';
import { ActionControls } from '@/components/ActionControls';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { toast } from 'sonner';

const Index = () => {
  const {
    data,
    isLoaded,
    updateTeamName,
    updateAdminEmail,
    addMember,
    removeMember,
    canAddMember,
    exportData,
    importData,
    setLastBackup,
    memberCount,
  } = useTeamData();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRemoveMode, setIsRemoveMode] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; email: string } | null>(null);

  const handleAddMember = (member: { email: string; phone: string; joinDate: string }) => {
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
      if (data.members.length === 1) {
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
    // Mock backup to Google Drive
    setLastBackup(new Date().toISOString());
    toast.success('Backup completed to Google Drive');
  };

  const handleRestoreFromCloud = () => {
    // Mock restore from Google Drive
    toast.info('Restore from Google Drive (demo mode)');
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28">
      <AppHeader onSettingsClick={() => setIsSettingsOpen(true)} />

      <main className="container mx-auto px-4 py-6 space-y-4">
        <TeamInfo
          teamName={data.teamName}
          adminEmail={data.adminEmail}
          memberCount={memberCount}
          onTeamNameChange={updateTeamName}
          onAdminEmailChange={updateAdminEmail}
        />

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground px-1">
            Team Members ({data.members.length})
          </h3>

          {data.members.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {data.members.map((member, index) => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    index={index}
                    isRemoveMode={isRemoveMode}
                    onRemove={() => handleRemoveMember(member.id, member.email)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      <ActionControls
        canAdd={canAddMember}
        isRemoveMode={isRemoveMode}
        onAddClick={() => setIsAddModalOpen(true)}
        onRemoveModeToggle={() => setIsRemoveMode(!isRemoveMode)}
        memberCount={memberCount}
        maxMembers={MAX_MEMBERS}
      />

      <AddMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddMember}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        lastBackup={data.lastBackup}
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
