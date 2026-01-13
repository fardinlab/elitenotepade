import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Calendar, Mail, Phone, Crown, CheckCircle, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface MemberWithTeam {
  id: string;
  email: string;
  phone?: string;
  joinDate: string;
  teamId: string;
  teamName: string;
  isYearlyTeam: boolean;
  paidAmount?: number;
}

export default function CurrentMonthMembers() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [members, setMembers] = useState<MemberWithTeam[]>([]);
  const [loading, setLoading] = useState(true);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentMonthName = new Date().toLocaleDateString('bn-BD', { month: 'long', year: 'numeric' });

  useEffect(() => {
    const fetchPaidMembers = async () => {
      if (!user) return;

      try {
        // Fetch all teams
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('id, team_name, is_yearly')
          .eq('user_id', user.id);

        if (teamsError) throw teamsError;

        // Fetch all members with paid_amount > 0 from normal teams (current month by join_date)
        const { data: membersData, error: membersError } = await supabase
          .from('members')
          .select('id, email, phone, join_date, team_id, paid_amount')
          .eq('user_id', user.id);

        if (membersError) throw membersError;

        // Get yearly team IDs
        const yearlyTeamIds = (teamsData || []).filter(t => t.is_yearly).map(t => t.id);
        const normalTeamIds = (teamsData || []).filter(t => !t.is_yearly).map(t => t.id);

        // Filter normal team members who paid in current month
        const paidMembers: MemberWithTeam[] = [];

        (membersData || []).forEach(member => {
          const joinDate = new Date(member.join_date);
          const memberMonth = joinDate.getMonth();
          const memberYear = joinDate.getFullYear();

          // Normal team members: check if paid_amount > 0 and join_date is current month
          if (normalTeamIds.includes(member.team_id) && 
              memberMonth === currentMonth && 
              memberYear === currentYear && 
              member.paid_amount > 0) {
            const team = teamsData?.find(t => t.id === member.team_id);
            if (team) {
              paidMembers.push({
                id: member.id,
                email: member.email,
                phone: member.phone,
                joinDate: member.join_date,
                teamId: team.id,
                teamName: team.team_name,
                isYearlyTeam: false,
                paidAmount: member.paid_amount,
              });
            }
          }
        });

        // For yearly team members, check member_payments table for current month paid entries
        if (yearlyTeamIds.length > 0) {
          const yearlyMemberIds = (membersData || [])
            .filter(m => yearlyTeamIds.includes(m.team_id))
            .map(m => m.id);

          if (yearlyMemberIds.length > 0) {
            // Get current month name for matching
            const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                               'july', 'august', 'september', 'october', 'november', 'december'];
            const currentMonthNameEn = monthNames[currentMonth];

            const { data: paymentsData, error: paymentsError } = await supabase
              .from('member_payments')
              .select('member_id, amount, month, year')
              .eq('user_id', user.id)
              .in('member_id', yearlyMemberIds)
              .eq('status', 'paid')
              .eq('month', currentMonthNameEn)
              .eq('year', currentYear);

            if (!paymentsError && paymentsData) {
              // Group payments by member
              const memberPayments: Record<string, number> = {};
              paymentsData.forEach(p => {
                memberPayments[p.member_id] = (memberPayments[p.member_id] || 0) + p.amount;
              });

              // Add yearly members who paid this month
              Object.keys(memberPayments).forEach(memberId => {
                const member = membersData?.find(m => m.id === memberId);
                if (member) {
                  const team = teamsData?.find(t => t.id === member.team_id);
                  if (team) {
                    paidMembers.push({
                      id: member.id,
                      email: member.email,
                      phone: member.phone,
                      joinDate: member.join_date,
                      teamId: team.id,
                      teamName: team.team_name,
                      isYearlyTeam: true,
                      paidAmount: memberPayments[memberId],
                    });
                  }
                }
              });
            }
          }
        }

        // Sort by paid amount (highest first)
        paidMembers.sort((a, b) => (b.paidAmount || 0) - (a.paidAmount || 0));

        setMembers(paidMembers);
      } catch (error) {
        console.error('Error fetching paid members:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPaidMembers();
  }, [user, currentMonth, currentYear]);

  const handleMemberClick = (member: MemberWithTeam) => {
    if (member.isYearlyTeam) {
      navigate(`/yearly-team/${member.teamId}?highlight=${member.id}`);
    } else {
      navigate(`/team/${member.teamId}?highlight=${member.id}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('bn-BD', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const totalCollected = members.reduce((sum, m) => sum + (m.paidAmount || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="p-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">এই মাসে Paid করেছে</h1>
            <p className="text-xs text-muted-foreground">{currentMonthName}</p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-full">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-bold text-emerald-500">{members.length}</span>
          </div>
        </div>
        
        {/* Total Collected Amount */}
        {!loading && members.length > 0 && (
          <div className="px-4 pb-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-500" />
                <span className="text-sm text-muted-foreground">মোট Collect হয়েছে</span>
              </div>
              <span className="text-lg font-bold text-emerald-500">৳{totalCollected.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">এই মাসে কেউ Paid করেনি</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <button
                  onClick={() => handleMemberClick(member)}
                  className="w-full p-3 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-accent/50 transition-all text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      {/* Email */}
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium text-foreground truncate">
                          {member.email}
                        </span>
                      </div>
                      
                      {/* Phone */}
                      {member.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="text-xs text-muted-foreground">
                            {member.phone}
                          </span>
                        </div>
                      )}
                      
                      {/* Paid Amount */}
                      {member.paidAmount && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="text-xs font-medium text-emerald-500">
                            ৳{member.paidAmount.toLocaleString()} Paid
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Team Info */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {member.isYearlyTeam && (
                        <Badge variant="secondary" className="bg-amber-500/20 text-amber-500 text-[10px] px-1.5 py-0.5">
                          <Crown className="w-2.5 h-2.5 mr-0.5" />
                          YEARLY
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full max-w-[100px] truncate">
                        {member.teamName}
                      </span>
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
