import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { Member } from '@/types/member';
import { SubscriptionBadges } from '@/components/SubscriptionBadges';

interface DueMember extends Member {
  teamName: string;
  teamId: string;
}

const DueMembers = () => {
  const navigate = useNavigate();
  const { sortedTeams } = useSupabaseData();

  // Get all members with pending amounts
  const dueMembers: DueMember[] = sortedTeams.flatMap(team =>
    team.members
      .filter(member => member.pendingAmount && member.pendingAmount > 0)
      .map(member => ({
        ...member,
        teamName: team.teamName,
        teamId: team.id,
      }))
  );

  const totalDue = dueMembers.reduce((sum, m) => sum + (m.pendingAmount || 0), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleNavigateToMember = (teamId: string, memberId: string) => {
    navigate(`/team/${teamId}`, { state: { highlightMemberId: memberId } });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Due Payments</h1>
            <p className="text-sm text-muted-foreground">
              {dueMembers.length} member{dueMembers.length !== 1 ? 's' : ''} with pending payments
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total Due</p>
            <p className="text-lg font-bold text-red-500">{formatCurrency(totalDue)}</p>
          </div>
        </div>

        {/* Due Members List */}
        {dueMembers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Pending Dues</h3>
            <p className="text-muted-foreground text-sm">All members have cleared their payments!</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {dueMembers.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleNavigateToMember(member.teamId, member.id)}
                className="p-4 rounded-xl glass-card hover:border-primary/30 cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground break-all">{member.email}</p>
                      <SubscriptionBadges subscriptions={member.subscriptions || []} />
                    </div>
                    <p className="text-sm text-muted-foreground">{member.phone}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNavigateToMember(member.teamId, member.id);
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      {member.teamName} →
                    </button>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-muted-foreground">Due</p>
                    <p className="text-lg font-bold text-orange-400">৳{member.pendingAmount}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DueMembers;
