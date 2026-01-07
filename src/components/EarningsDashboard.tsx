import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Clock, TrendingUp, Users } from 'lucide-react';
import { Team } from '@/types/member';

interface EarningsDashboardProps {
  teams: Team[];
}

export const EarningsDashboard = ({ teams }: EarningsDashboardProps) => {
  const earnings = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let currentMonthEarnings = 0;
    let totalDue = 0;
    let last3MonthsEarnings = 0;

    // Get all members from all teams
    const allMembers = teams.flatMap(team => team.members);

    allMembers.forEach(member => {
      const joinDate = new Date(member.joinDate);
      const memberMonth = joinDate.getMonth();
      const memberYear = joinDate.getFullYear();

      // Add to total due
      if (member.pendingAmount) {
        totalDue += member.pendingAmount;
      }

      // Check if member has paid amount
      if (member.paidAmount) {
        // Current month earnings
        if (memberMonth === currentMonth && memberYear === currentYear) {
          currentMonthEarnings += member.paidAmount;
        }

        // Last 3 months earnings (including current month)
        const threeMonthsAgo = new Date(currentYear, currentMonth - 2, 1);
        if (joinDate >= threeMonthsAgo) {
          last3MonthsEarnings += member.paidAmount;
        }
      }
    });

    return {
      currentMonth: currentMonthEarnings,
      totalDue,
      last3Months: last3MonthsEarnings,
      totalMembers: allMembers.length,
    };
  }, [teams]);

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
      className="grid grid-cols-4 gap-2"
    >
      {/* Current Month Earnings */}
      <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30">
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
            <DollarSign className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mb-0.5">{currentMonthName}</p>
        <p className="text-sm font-bold text-foreground">{formatCurrency(earnings.currentMonth)}</p>
      </div>

      {/* Total Due */}
      <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/20 to-rose-500/20 border border-red-500/30">
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center">
            <Clock className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mb-0.5">Total Due</p>
        <p className="text-sm font-bold text-foreground">{formatCurrency(earnings.totalDue)}</p>
      </div>

      {/* Last 3 Months */}
      <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mb-0.5">Last 3 Months</p>
        <p className="text-sm font-bold text-foreground">{formatCurrency(earnings.last3Months)}</p>
      </div>

      {/* Total Members */}
      <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/20 border border-purple-500/30">
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center">
            <Users className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mb-0.5">Total Members</p>
        <p className="text-sm font-bold text-foreground">{earnings.totalMembers}</p>
      </div>
    </motion.div>
  );
};
