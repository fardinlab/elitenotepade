import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Member } from '@/types/member';
import { SubscriptionBadges } from '@/components/SubscriptionBadges';

interface DueMember extends Member {
  teamName: string;
  teamId: string;
  isYearly?: boolean;
  totalAmount?: number;
  totalPaid?: number;
  dueAmount: number;
}

const DueMembers = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sortedTeams, isLoaded } = useSupabaseData();
  const [yearlyDueMembers, setYearlyDueMembers] = useState<DueMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch yearly team members with due amounts
  useEffect(() => {
    const fetchYearlyMembersDue = async () => {
      if (!user || !isLoaded) return;

      const yearlyTeams = sortedTeams.filter(team => team.isYearlyTeam);
      const yearlyMembers = yearlyTeams.flatMap(team => 
        team.members.map(m => ({ ...m, teamName: team.teamName, teamId: team.id }))
      );

      if (yearlyMembers.length === 0) {
        setYearlyDueMembers([]);
        setLoading(false);
        return;
      }

      const memberIds = yearlyMembers.map(m => m.id);

      // Fetch payments and member total_amounts in parallel
      const [paymentsResult, membersResult] = await Promise.all([
        supabase
          .from('member_payments')
          .select('member_id, amount, status')
          .eq('user_id', user.id)
          .in('member_id', memberIds)
          .eq('status', 'paid'),
        supabase
          .from('members')
          .select('id, total_amount')
          .in('id', memberIds)
      ]);

      if (paymentsResult.error || membersResult.error) {
        console.error('Error fetching data:', paymentsResult.error || membersResult.error);
        setLoading(false);
        return;
      }

      // Create maps
      const memberTotalAmounts: Record<string, number> = {};
      (membersResult.data || []).forEach(member => {
        memberTotalAmounts[member.id] = member.total_amount || 0;
      });

      const paidSummaries: Record<string, number> = {};
      (paymentsResult.data || []).forEach(payment => {
        if (!paidSummaries[payment.member_id]) {
          paidSummaries[payment.member_id] = 0;
        }
        paidSummaries[payment.member_id] += payment.amount;
      });

      // Calculate due members
      const dueMembers: DueMember[] = yearlyMembers
        .map(member => {
          const totalAmount = memberTotalAmounts[member.id] || 0;
          const totalPaid = paidSummaries[member.id] || 0;
          const dueAmount = Math.max(0, totalAmount - totalPaid);
          return {
            ...member,
            isYearly: true,
            totalAmount,
            totalPaid,
            dueAmount,
          };
        })
        .filter(member => member.dueAmount > 0);

      setYearlyDueMembers(dueMembers);
      setLoading(false);
    };

    fetchYearlyMembersDue();
  }, [user, sortedTeams, isLoaded]);

  // Get regular team members with pending amounts
  const regularDueMembers: DueMember[] = sortedTeams
    .filter(team => !team.isYearlyTeam)
    .flatMap(team =>
      team.members
        .filter(member => member.pendingAmount && member.pendingAmount > 0)
        .map(member => ({
          ...member,
          teamName: team.teamName,
          teamId: team.id,
          isYearly: false,
          dueAmount: member.pendingAmount || 0,
        }))
    );

  // Combine all due members
  const allDueMembers = [...yearlyDueMembers, ...regularDueMembers];
  const totalDue = allDueMembers.reduce((sum, m) => sum + m.dueAmount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleNavigateToMember = (member: DueMember) => {
    if (member.isYearly) {
      navigate(`/yearly-team/${member.teamId}`, { state: { highlightMemberId: member.id } });
    } else {
      navigate(`/team/${member.teamId}`, { state: { highlightMemberId: member.id } });
    }
  };

  if (loading && !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

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
              {allDueMembers.length} member{allDueMembers.length !== 1 ? 's' : ''} with pending payments
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total Due</p>
            <p className="text-lg font-bold text-red-500">{formatCurrency(totalDue)}</p>
          </div>
        </div>

        {/* Due Members List */}
        {allDueMembers.length === 0 ? (
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
            {allDueMembers.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleNavigateToMember(member)}
                className="p-4 rounded-xl glass-card hover:border-primary/30 cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground break-all">{member.email}</p>
                      {member.isYearly && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">
                          YEARLY
                        </span>
                      )}
                      <SubscriptionBadges subscriptions={member.subscriptions || []} />
                    </div>
                    <p className="text-sm text-muted-foreground">{member.phone}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNavigateToMember(member);
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      {member.teamName} →
                    </button>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-muted-foreground">Due</p>
                    <p className="text-lg font-bold text-orange-400">৳{member.dueAmount}</p>
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
