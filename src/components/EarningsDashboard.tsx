import { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DollarSign, Clock, TrendingUp, Users } from 'lucide-react';
import { Team } from '@/types/member';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface EarningsDashboardProps {
  teams: Team[];
}

interface PaymentSummary {
  member_id: string;
  total_paid: number;
  total_amount: number;
}

export const EarningsDashboard = ({ teams }: EarningsDashboardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [paymentSummaries, setPaymentSummaries] = useState<PaymentSummary[]>([]);
  const [currentMonthYearlyPaid, setCurrentMonthYearlyPaid] = useState(0);
  const [last3MonthsYearlyPaid, setLast3MonthsYearlyPaid] = useState(0);

  // Fetch payment summaries for all yearly team members
  useEffect(() => {
    const fetchPaymentSummaries = async () => {
      if (!user) return;

      // Get all member IDs from yearly teams
      const yearlyMembers = teams
        .filter(team => team.isYearlyTeam)
        .flatMap(team => team.members);

      if (yearlyMembers.length === 0) {
        setPaymentSummaries([]);
        setCurrentMonthYearlyPaid(0);
        setLast3MonthsYearlyPaid(0);
        return;
      }

      const memberIds = yearlyMembers.map(m => m.id);

      // Get current month and last 3 months info
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                         'july', 'august', 'september', 'october', 'november', 'december'];
      const currentMonthNameEn = monthNames[currentMonth];

      // Calculate last 3 months (including current month)
      const last3MonthsFilters: { month: string; year: number }[] = [];
      for (let i = 0; i < 3; i++) {
        const d = new Date(currentYear, currentMonth - i, 1);
        last3MonthsFilters.push({
          month: monthNames[d.getMonth()],
          year: d.getFullYear()
        });
      }

      // Fetch all payments, current month payments, and member total_amounts in parallel
      const [paymentsResult, currentMonthPaymentsResult, membersResult] = await Promise.all([
        supabase
          .from('member_payments')
          .select('member_id, amount, status, month, year')
          .eq('user_id', user.id)
          .in('member_id', memberIds)
          .eq('status', 'paid'),
        supabase
          .from('member_payments')
          .select('member_id, amount, status, month, year')
          .eq('user_id', user.id)
          .in('member_id', memberIds)
          .eq('status', 'paid')
          .eq('month', currentMonthNameEn)
          .eq('year', currentYear),
        supabase
          .from('members')
          .select('id, total_amount')
          .in('id', memberIds)
      ]);

      if (paymentsResult.error) {
        console.error('Error fetching payments:', paymentsResult.error);
        return;
      }

      if (currentMonthPaymentsResult.error) {
        console.error('Error fetching current month payments:', currentMonthPaymentsResult.error);
        return;
      }

      if (membersResult.error) {
        console.error('Error fetching members:', membersResult.error);
        return;
      }

      // Calculate current month yearly paid amount
      let yearlyCurrentMonthPaid = 0;
      (currentMonthPaymentsResult.data || []).forEach(payment => {
        yearlyCurrentMonthPaid += payment.amount;
      });
      setCurrentMonthYearlyPaid(yearlyCurrentMonthPaid);

      // Calculate last 3 months yearly paid amount
      let yearlyLast3MonthsPaid = 0;
      (paymentsResult.data || []).forEach(payment => {
        const isInLast3Months = last3MonthsFilters.some(
          f => f.month === payment.month && f.year === payment.year
        );
        if (isInLast3Months) {
          yearlyLast3MonthsPaid += payment.amount;
        }
      });
      setLast3MonthsYearlyPaid(yearlyLast3MonthsPaid);

      // Create a map of member total_amounts
      const memberTotalAmounts: Record<string, number> = {};
      (membersResult.data || []).forEach(member => {
        memberTotalAmounts[member.id] = member.total_amount || 0;
      });

      // Aggregate paid amounts by member
      const paidSummaries: Record<string, number> = {};
      (paymentsResult.data || []).forEach(payment => {
        if (!paidSummaries[payment.member_id]) {
          paidSummaries[payment.member_id] = 0;
        }
        paidSummaries[payment.member_id] += payment.amount;
      });

      // Build summaries with total_amount
      const allMemberIds = [...new Set([...Object.keys(memberTotalAmounts), ...Object.keys(paidSummaries)])];
      setPaymentSummaries(
        allMemberIds.map(member_id => ({
          member_id,
          total_paid: paidSummaries[member_id] || 0,
          total_amount: memberTotalAmounts[member_id] || 0,
        }))
      );
    };

    fetchPaymentSummaries();
  }, [user, teams]);
  
  const earnings = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let currentMonthEarnings = 0;
    let regularDue = 0; // Only regular team due
    let last3MonthsEarnings = 0;

    // Get all members from all teams
    const allMembers = teams.flatMap(team => team.members);

    // Calculate current month and last 3 months earnings from regular teams
    // Also calculate regular team due only
    const regularMembers = teams.filter(team => !team.isYearlyTeam).flatMap(team => team.members);
    
    // Calculate last 3 months date range
    const threeMonthsAgo = new Date(currentYear, currentMonth - 2, 1);
    
    regularMembers.forEach(member => {
      const joinDate = new Date(member.joinDate);
      const memberMonth = joinDate.getMonth();
      const memberYear = joinDate.getFullYear();

      // Add to regular due from pending amount
      if (member.pendingAmount) {
        regularDue += member.pendingAmount;
      }

      // Check if member has paid amount
      if (member.paidAmount) {
        // Current month earnings
        if (memberMonth === currentMonth && memberYear === currentYear) {
          currentMonthEarnings += member.paidAmount;
        }

        // Last 3 months earnings (including current month)
        if (joinDate >= threeMonthsAgo) {
          last3MonthsEarnings += member.paidAmount;
        }
      }
    });

    // Add yearly team current month paid to current month earnings
    currentMonthEarnings += currentMonthYearlyPaid;
    
    // Add yearly team last 3 months paid to last 3 months earnings
    last3MonthsEarnings += last3MonthsYearlyPaid;

    return {
      currentMonth: currentMonthEarnings,
      totalDue: regularDue, // Only regular due in display
      last3Months: last3MonthsEarnings,
      totalMembers: allMembers.length,
    };
  }, [teams, currentMonthYearlyPaid, last3MonthsYearlyPaid]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'long' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="grid grid-cols-4 gap-1.5"
    >
      {/* Current Month Earnings */}
      <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30">
        <div className="w-5 h-5 rounded bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center mb-1">
          <DollarSign className="w-3 h-3 text-white" />
        </div>
        <p className="text-[8px] text-muted-foreground leading-tight">{currentMonthName}</p>
        <p className="text-[11px] font-bold text-foreground leading-tight">{formatCurrency(earnings.currentMonth)}</p>
      </div>

      {/* Total Due - Clickable */}
      <button
        onClick={() => navigate('/due-members')}
        className="p-2 rounded-lg bg-gradient-to-br from-red-500/20 to-rose-500/20 border border-red-500/30 hover:border-red-500/60 transition-all text-left"
      >
        <div className="w-5 h-5 rounded bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center mb-1">
          <Clock className="w-3 h-3 text-white" />
        </div>
        <p className="text-[8px] text-muted-foreground leading-tight">Total Due</p>
        <p className="text-[11px] font-bold text-foreground leading-tight">{formatCurrency(earnings.totalDue)}</p>
      </button>

      {/* Last 3 Months */}
      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
        <div className="w-5 h-5 rounded bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-1">
          <TrendingUp className="w-3 h-3 text-white" />
        </div>
        <p className="text-[8px] text-muted-foreground leading-tight">Last 3M</p>
        <p className="text-[11px] font-bold text-foreground leading-tight">{formatCurrency(earnings.last3Months)}</p>
      </div>

      {/* Total Members - Clickable */}
      <button
        onClick={() => navigate('/current-month-members')}
        className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-violet-500/20 border border-purple-500/30 hover:border-purple-500/60 transition-all text-left"
      >
        <div className="w-5 h-5 rounded bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center mb-1">
          <Users className="w-3 h-3 text-white" />
        </div>
        <p className="text-[8px] text-muted-foreground leading-tight">Members</p>
        <p className="text-[11px] font-bold text-foreground leading-tight">{earnings.totalMembers}</p>
      </button>
    </motion.div>
  );
};
