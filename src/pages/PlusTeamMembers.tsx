import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { TeamInfo } from '@/components/TeamInfo';
import { PlusMemberCard } from '@/components/PlusMemberCard';
import { EmptyState } from '@/components/EmptyState';
import { AddPlusMemberModal } from '@/components/AddPlusMemberModal';
import { ActionControls } from '@/components/ActionControls';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { toast } from 'sonner';

const PlusTeamMembers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { teamId } = useParams<{ teamId: string }>();
  const locationState = location.state as { highlightMemberId?: string; highlightColor?: 'blue' | 'green' } | null;
  const highlightMemberId = locationState?.highlightMemberId;
  const highlightColorFromState = locationState?.highlightColor || 'blue';
  const [highlightedMemberId, setHighlightedMemberId] = useState<string | null>(null);
  const [highlightColor, setHighlightColor] = useState<'blue' | 'green'>('blue');
  const memberRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  const {
    activeTeam,
    sortedTeams,
    isLoaded,
    setActiveTeam,
    updateTeamName,
    updateAdminEmail,
    updateTeamCreatedAt,
    addMember,
    removeMember,
    updateMemberDate,
    updateMemberEmail,
    updateMemberPhone,
    updateMemberTelegram,
    updateMemberEPass,
    updateMemberGPass,
    updateMemberPushed,
    updateMemberPayment,
    updateMemberPendingAmount,
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

  // Handle scroll and highlight for searched member
  useEffect(() => {
    if (highlightMemberId && team) {
      setHighlightedMemberId(highlightMemberId);
      setHighlightColor(highlightColorFromState);
      
      // Wait for render then scroll
      setTimeout(() => {
        const memberElement = memberRefs.current[highlightMemberId];
        if (memberElement) {
          memberElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);

      // Remove highlight after 3 seconds
      const timer = setTimeout(() => {
        setHighlightedMemberId(null);
      }, 3000);

      // Clear the location state to prevent re-highlighting on navigation
      window.history.replaceState({}, document.title);

      return () => clearTimeout(timer);
    }
  }, [highlightMemberId, highlightColorFromState, team]);

  const handleAddMember = async (member: { 
    email: string; 
    ePass?: string;
    gPass?: string;
    phone?: string; 
    telegram?: string; 
    joinDate: string 
  }) => {
    // Plus teams allow unlimited members, so we bypass the limit check
    const result = await addMember({
      email: member.email,
      phone: member.phone || '',
      telegram: member.telegram,
      ePass: member.ePass,
      gPass: member.gPass,
      joinDate: member.joinDate,
    }, undefined, true); // skipLimitCheck = true
    
    if (result.ok) {
      toast.success('Member added successfully!');
      return true;
    }

    toast.error(result.error || 'Failed to add member');
    if (result.code) toast.error(`Code: ${result.code}`);
    return false;
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
            <div className="flex items-center gap-2">
              <h1 className="font-display text-lg font-bold text-foreground truncate">{team.teamName}</h1>
              <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] font-medium rounded">
                PLUS
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Plus Team Members</p>
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
          onCreatedAtChange={updateTeamCreatedAt}
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
                  <div
                    key={member.id}
                    ref={(el) => { memberRefs.current[member.id] = el; }}
                  >
                    <PlusMemberCard
                      member={member}
                      index={index}
                      isRemoveMode={isRemoveMode}
                      isHighlighted={highlightedMemberId === member.id}
                      highlightColor={highlightColor}
                      onRemove={() => handleRemoveMember(member.id, member.email)}
                      onDateChange={updateMemberDate}
                      onEmailChange={updateMemberEmail}
                      onPhoneChange={updateMemberPhone}
                      onTelegramChange={updateMemberTelegram}
                      onEPassChange={updateMemberEPass}
                      onGPassChange={updateMemberGPass}
                      onPushedChange={updateMemberPushed}
                      onPaymentChange={updateMemberPayment}
                      onPendingAmountChange={updateMemberPendingAmount}
                    />
                  </div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      <ActionControls
        canAdd={true}
        isRemoveMode={isRemoveMode}
        onAddClick={() => setIsAddModalOpen(true)}
        onRemoveModeToggle={() => setIsRemoveMode(!isRemoveMode)}
        memberCount={memberCount}
        showMemberLimit={false}
      />

      <AddPlusMemberModal
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

export default PlusTeamMembers;
