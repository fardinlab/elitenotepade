import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, TrendingUp, Calendar, ChevronDown, Users } from 'lucide-react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface TeamEarning {
  teamId: string;
  teamName: string;
  type: 'regular' | 'yearly' | 'plus';
  amount: number;
  memberIds: string[];
}

interface MonthlyData {
  month: number;
  year: number;
  label: string;
  regular: number;
  yearly: number;
  plus: number;
  total: number;
  teams: TeamEarning[];
}

const MONTH_NAMES_BN = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

const TYPE_LABELS: Record<string, string> = { regular: 'Regular', yearly: 'Yearly', plus: 'Plus' };
const TYPE_COLORS: Record<string, string> = {
  regular: 'bg-blue-500/20 text-blue-400',
  yearly: 'bg-amber-500/20 text-amber-400',
  plus: 'bg-purple-500/20 text-purple-400',
};

const MonthlyEarnings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sortedTeams, isLoaded } = useSupabaseData();
  const [yearlyPayments, setYearlyPayments] = useState<{ member_id: string; amount: number; month: number; year: number }[]>([]);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  useEffect(() => {
    const fetchYearlyPayments = async () => {
      if (!user) return;
      const yearlyMemberIds = sortedTeams
        .filter(t => t.isYearlyTeam)
        .flatMap(t => t.members)
        .map(m => m.id);

      if (yearlyMemberIds.length === 0) { setYearlyPayments([]); return; }

      const { data, error } = await supabase
        .from('member_payments')
        .select('member_id, amount, month, year')
        .eq('user_id', user.id)
        .in('member_id', yearlyMemberIds)
        .eq('status', 'paid');

      if (!error && data) setYearlyPayments(data);
    };
    if (isLoaded) fetchYearlyPayments();
  }, [user, sortedTeams, isLoaded]);

  // Build a map of member_id -> team info for yearly teams
  const yearlyMemberTeamMap = useMemo(() => {
    const map = new Map<string, { teamId: string; teamName: string }>();
    sortedTeams.filter(t => t.isYearlyTeam).forEach(team => {
      team.members.forEach(m => map.set(m.id, { teamId: team.id, teamName: team.teamName }));
    });
    return map;
  }, [sortedTeams]);

  const monthlyData = useMemo(() => {
    const dataMap = new Map<string, MonthlyData>();

    const getOrCreate = (key: string, m: number, y: number): MonthlyData => {
      if (!dataMap.has(key)) {
        dataMap.set(key, { month: m, year: y, label: '', regular: 0, yearly: 0, plus: 0, total: 0, teams: [] });
      }
      return dataMap.get(key)!;
    };

    // Regular & Plus teams
    sortedTeams.forEach(team => {
      if (team.isYearlyTeam) return;
      const type = team.isPlusTeam ? 'plus' : 'regular';

      // Aggregate per team per month
      const teamMonthData = new Map<string, { amount: number; memberIds: string[] }>();
      team.members.forEach(member => {
        if (!member.paidAmount) return;
        const d = new Date(member.joinDate);
        const m = d.getMonth();
        const y = d.getFullYear();
        const key = `${y}-${m}`;
        const existing = teamMonthData.get(key) || { amount: 0, memberIds: [] };
        existing.amount += member.paidAmount;
        existing.memberIds.push(member.id);
        teamMonthData.set(key, existing);
      });

      teamMonthData.forEach((data, key) => {
        const [y, m] = key.split('-').map(Number);
        const entry = getOrCreate(key, m, y);
        entry[type] += data.amount;
        const existing = entry.teams.find(t => t.teamId === team.id);
        if (existing) {
          existing.amount += data.amount;
          existing.memberIds.push(...data.memberIds);
        } else {
          entry.teams.push({ teamId: team.id, teamName: team.teamName, type, amount: data.amount, memberIds: [...data.memberIds] });
        }
      });
    });

    // Yearly teams
    yearlyPayments.forEach(p => {
      const m = p.month - 1;
      const key = `${p.year}-${m}`;
      const entry = getOrCreate(key, m, p.year);
      entry.yearly += p.amount;

      const teamInfo = yearlyMemberTeamMap.get(p.member_id);
      if (teamInfo) {
        const existing = entry.teams.find(t => t.teamId === teamInfo.teamId);
        if (existing) {
          existing.amount += p.amount;
          if (!existing.memberIds.includes(p.member_id)) existing.memberIds.push(p.member_id);
        } else {
          entry.teams.push({ teamId: teamInfo.teamId, teamName: teamInfo.teamName, type: 'yearly', amount: p.amount, memberIds: [p.member_id] });
        }
      }
    });

    const result = Array.from(dataMap.values()).map(d => ({
      ...d,
      label: `${MONTH_NAMES_BN[d.month]} ${d.year}`,
      total: d.regular + d.yearly + d.plus,
      teams: d.teams.sort((a, b) => b.amount - a.amount),
    }));

    result.sort((a, b) => b.year - a.year || b.month - a.month);
    return result;
  }, [sortedTeams, yearlyPayments, yearlyMemberTeamMap]);

  const grandTotal = monthlyData.reduce((sum, d) => sum + d.total, 0);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-foreground">Monthly Earnings</h1>
            <p className="text-xs text-muted-foreground">মাসভিত্তিক আয়ের হিসাব</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">সর্বমোট</p>
            <p className="text-sm font-bold text-emerald-500">{formatCurrency(grandTotal)}</p>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-4 space-y-2">
        {monthlyData.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">কোনো আয়ের রেকর্ড নেই</p>
          </div>
        ) : (
          monthlyData.map((data, index) => {
            const key = `${data.year}-${data.month}`;
            const isExpanded = expandedMonth === key;

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="rounded-xl bg-card border border-border overflow-hidden"
              >
                <button
                  onClick={() => setExpandedMonth(isExpanded ? null : key)}
                  className="w-full p-3 text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                        <Calendar className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-foreground">{data.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-emerald-500">{formatCurrency(data.total)}</span>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  <div className="flex gap-3 text-[10px]">
                    {data.regular > 0 && (
                      <span className="text-muted-foreground">
                        Regular: <span className="text-foreground font-medium">{formatCurrency(data.regular)}</span>
                      </span>
                    )}
                    {data.yearly > 0 && (
                      <span className="text-muted-foreground">
                        Yearly: <span className="text-foreground font-medium">{formatCurrency(data.yearly)}</span>
                      </span>
                    )}
                    {data.plus > 0 && (
                      <span className="text-muted-foreground">
                        Plus: <span className="text-foreground font-medium">{formatCurrency(data.plus)}</span>
                      </span>
                    )}
                  </div>

                  <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                      style={{ width: `${Math.min((data.total / Math.max(grandTotal, 1)) * 100 * monthlyData.length, 100)}%` }}
                    />
                  </div>
                </button>

                {/* Expanded team list */}
                <AnimatePresence>
                  {isExpanded && data.teams.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 space-y-1.5 border-t border-border pt-2">
                        <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                          <Users className="w-3 h-3" /> টিম ব্রেকডাউন
                        </p>
                        {data.teams.map(team => (
                          <button
                            key={team.teamId}
                            onClick={() => {
                              if (team.type === 'yearly') {
                                navigate(`/yearly-team/${team.teamId}`);
                              } else if (team.type === 'plus') {
                                navigate(`/plus-team/${team.teamId}`);
                              } else {
                                navigate(`/team/${team.teamId}`);
                              }
                            }}
                            className="w-full flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-foreground">{team.teamName}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${TYPE_COLORS[team.type]}`}>
                                {TYPE_LABELS[team.type]}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-emerald-500">{formatCurrency(team.amount)}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </main>
    </div>
  );
};

export default MonthlyEarnings;
