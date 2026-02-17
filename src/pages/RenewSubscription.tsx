import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, Clock, Mail, Phone, MessageCircle, Calendar } from 'lucide-react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { differenceInDays } from 'date-fns';
import { SUBSCRIPTION_CONFIG, SubscriptionType, Member, Team } from '@/types/member';

const parseLocalDate = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

interface RenewableMember {
  member: Member;
  team: Team;
  daysSinceJoin: number;
}

const RenewSubscription = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightMemberId = searchParams.get('memberId');
  const { sortedTeams, isLoaded } = useSupabaseData();

  const renewableMembers = useMemo((): RenewableMember[] => {
    const today = new Date();
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const results: RenewableMember[] = [];

    sortedTeams.forEach((team) => {
      if (team.isYearlyTeam || team.isPlusTeam) return;

      team.members.forEach((member) => {
        if (member.isPushed || member.activeTeamId) return;

        const joinDate = parseLocalDate(member.joinDate);
        const days = differenceInDays(todayLocal, joinDate);

        if (days >= 1 && days <= 28) {
          results.push({ member, team, daysSinceJoin: days });
        }
      });
    });

    return results.sort((a, b) => b.daysSinceJoin - a.daysSinceJoin);
  }, [sortedTeams]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card sticky top-0 z-50 px-4 py-4"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      >
        <div className="container mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="font-display text-lg font-bold">Renew Subscription</h1>
          <div className="w-16" />
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="w-4 h-4" />
          <span className="text-sm">{renewableMembers.length} মেম্বার রিনিউ করা দরকার</span>
        </div>

        {renewableMembers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-8 text-center space-y-3"
          >
            <RefreshCw className="w-12 h-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-semibold">কোন মেম্বার নেই</h3>
            <p className="text-sm text-muted-foreground">
              বর্তমানে ১-২৮ দিনের মধ্যে কোন মেম্বার নেই
            </p>
          </motion.div>
        ) : (
          renewableMembers.map(({ member, team, daysSinceJoin }, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`glass-card rounded-2xl p-4 space-y-3 cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all ${
                highlightMemberId === member.id ? 'ring-2 ring-blue-500 bg-blue-500/20' : ''
              }`}
              onClick={() => navigate(`/team/${team.id}`, { state: { highlightMemberId: member.id } })}
            >
              {/* Header: Days + Team */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    daysSinceJoin >= 25 ? 'bg-red-500/20 text-red-400' :
                    daysSinceJoin >= 20 ? 'bg-orange-500/20 text-orange-400' :
                    daysSinceJoin >= 10 ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    <Clock className="w-3 h-3 inline mr-1" />
                    {daysSinceJoin} দিন
                  </div>
                </div>
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-lg">
                  {team.teamName}
                </span>
              </div>

              {/* Member Details */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium truncate">{member.email}</span>
                </div>

                {member.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-muted-foreground">{member.phone}</span>
                  </div>
                )}

                {member.telegram && (
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-muted-foreground">{member.telegram}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground">Join: {member.joinDate}</span>
                </div>
              </div>

              {/* Subscriptions */}
              {member.subscriptions && member.subscriptions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {member.subscriptions.map((sub) => {
                    const config = SUBSCRIPTION_CONFIG[sub as SubscriptionType];
                    return config ? (
                      <span
                        key={sub}
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: `${config.color}20`, color: config.color }}
                      >
                        {config.name}
                      </span>
                    ) : null;
                  })}
                </div>
              )}

              {/* Payment Info */}
              <div className="flex items-center gap-3 text-xs">
                {member.isPaid && (
                  <span className="text-green-400">
                    Paid: ৳{member.paidAmount || 0}
                  </span>
                )}
                {(member.pendingAmount ?? 0) > 0 && (
                  <span className="text-red-400">
                    Due: ৳{member.pendingAmount}
                  </span>
                )}
              </div>
            </motion.div>
          ))
        )}
      </main>
    </div>
  );
};

export default RenewSubscription;
