import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { MAX_MEMBERS } from '@/types/member';
import { TeamInfo } from '@/components/TeamInfo';
import { MemberCard } from '@/components/MemberCard';
import { EmptyState } from '@/components/EmptyState';
import { AddMemberModal } from '@/components/AddMemberModal';
import { ActionControls } from '@/components/ActionControls';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { toast } from 'sonner';

const TeamMembers = () => {
  const navigate = useNavigate();
  const { teamId } = useParams<{ teamId: string }>();
  
  const {
    activeTeam,
    sortedTeams,
    isLoaded,
    setActiveTeam,
    updateTeamName,
    updateAdminEmail,
    addMember,
    removeMember,
    updateMemberDate,
    updateMemberEmail,
    updateMemberPhone,
    updateMemberTelegram,
    updateMemberPayment,
    updateMemberSubscriptions,
    updateMemberPendingAmount,
    canAddMember,
    memberCount,
  } = useSupabaseData();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRemoveMode, setIsRemoveMode] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; email: string } | null>(null);

  // Sync active team with URL
  useEffect(() => {
    if (teamId && activeTeam?.id !== teamId) {
      const targetTeam = sortedTeams.find(t => t.id === teamId);
      if (targetTeam) {
        setActiveTeam(teamId);
      }
    }
  }, [teamId, activeTeam?.id, sortedTeams, setActiveTeam]);

  const team = sortedTeams.find(t => t.id === teamId) || activeTeam;

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
      if (team && team.members.length === 1) {
        setIsRemoveMode(false);
      }
    }
  };

  if (!isLoaded || !team) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] pb-28" style={{ paddingBottom: 'max(7rem, calc(7rem + env(safe-area-inset-bottom)))' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border px-4 py-3">
        <div className="container mx-auto flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors touch-manipulation active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-lg font-bold text-foreground truncate">{team.teamName}</h1>
            <p className="text-xs text-muted-foreground">Team Members</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Team Info */}
        <TeamInfo
          teamName={team.teamName}
          adminEmail={team.adminEmail}
          memberCount={memberCount}
          createdAt={team.createdAt}
          onTeamNameChange={updateTeamName}
          onAdminEmailChange={updateAdminEmail}
        />

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground px-1">
            Team Members ({team.members.length})
          </h3>

          {team.members.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {team.members.map((member, index) => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    index={index}
                    isRemoveMode={isRemoveMode}
                    onRemove={() => handleRemoveMember(member.id, member.email)}
                    onDateChange={updateMemberDate}
                    onEmailChange={updateMemberEmail}
                    onPhoneChange={updateMemberPhone}
                    onTelegramChange={updateMemberTelegram}
                    onPaymentChange={updateMemberPayment}
                    onSubscriptionsChange={updateMemberSubscriptions}
                    onPendingAmountChange={updateMemberPendingAmount}
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

      <DeleteConfirmModal
        isOpen={!!deleteConfirm}
        memberEmail={deleteConfirm?.email || ''}
        onConfirm={confirmRemove}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
};

export default TeamMembers;
