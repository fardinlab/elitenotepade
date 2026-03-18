import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, Calendar } from 'lucide-react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface MonthlyData {
  month: number;
  year: number;
  label: string;
  regular: number;
  yearly: number;
  plus: number;
  total: number;
}

const MONTH_NAMES_BN = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

const MonthlyEarnings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sortedTeams, isLoaded } = useSupabaseData();
  const [yearlyPayments, setYearlyPayments] = useState<{ member_id: string; amount: number; month: number; year: number }[]>([]);

  // Fetch yearly team payments
  useEffect(() => {
    const fetchYearlyPayments = async () => {
      if (!user) return;
      const yearlyMemberIds = sortedTeams
        .filter(t => t.isYearlyTeam)
        .flatMap(t => t.members)
        .map(m => m.id);

      if (yearlyMemberIds.length === 0) {
        setYearlyPayments([]);
        return;
      }

      const { data, error } = await supabase
        .from('member_payments')
        .select('member_id, amount, month, year')
        .eq('user_id', user.id)
        .in('member_id', yearlyMemberIds)
        .eq('status', 'paid');

      if (!error && data) {
        setYearlyPayments(data);
      }
    };

    if (isLoaded) fetchYearlyPayments();
  }, [user, sortedTeams, isLoaded]);

  const monthlyData = useMemo(() => {
    const dataMap = new Map<string, MonthlyData>();

    // Regular & Plus teams - use joinDate month as earning month
    sortedTeams.forEach(team => {
      if (team.isYearlyTeam) return;
      const type = team.isPlusTeam ? 'plus' : 'regular';

      team.members.forEach(member => {
        if (!member.paidAmount) return;
        const d = new Date(member.joinDate);
        const m = d.getMonth();
        const y = d.getFullYear();
        const key = `${y}-${m}`;

        if (!dataMap.has(key)) {
          dataMap.set(key, { month: m, year: y, label: '', regular: 0, yearly: 0, plus: 0, total: 0 });
        }
        const entry = dataMap.get(key)!;
        entry[type] += member.paidAmount;
      });
    });

    // Yearly teams - use member_payments month/year
    yearlyPayments.forEach(p => {
      const m = p.month - 1; // convert 1-based to 0-based
      const key = `${p.year}-${m}`;

      if (!dataMap.has(key)) {
        dataMap.set(key, { month: m, year: p.year, label: '', regular: 0, yearly: 0, plus: 0, total: 0 });
      }
      const entry = dataMap.get(key)!;
      entry.yearly += p.amount;
    });

    // Calculate totals and labels, sort descending
    const result = Array.from(dataMap.values()).map(d => ({
      ...d,
      label: `${MONTH_NAMES_BN[d.month]} ${d.year}`,
      total: d.regular + d.yearly + d.plus,
    }));

    result.sort((a, b) => b.year - a.year || b.month - a.month);
    return result;
  }, [sortedTeams, yearlyPayments]);

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
          monthlyData.map((data, index) => (
            <motion.div
              key={`${data.year}-${data.month}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="p-3 rounded-xl bg-card border border-border"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Calendar className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{data.label}</span>
                </div>
                <span className="text-sm font-bold text-emerald-500">{formatCurrency(data.total)}</span>
              </div>

              {/* Breakdown */}
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

              {/* Progress bar */}
              <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                  style={{ width: `${Math.min((data.total / Math.max(grandTotal, 1)) * 100 * monthlyData.length, 100)}%` }}
                />
              </div>
            </motion.div>
          ))
        )}
      </main>
    </div>
  );
};

export default MonthlyEarnings;
