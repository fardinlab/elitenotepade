import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, Calendar, ChevronRight, Trash2, X, Check, ImagePlus, Pencil, Bell } from 'lucide-react';
import { Team, MAX_MEMBERS, SubscriptionType, SUBSCRIPTION_CONFIG } from '@/types/member';
import { differenceInDays } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface TeamListProps {
  teams: Team[];
  activeTeamId: string;
  onSelectTeam: (teamId: string) => void;
  onCreateTeam: (teamName: string, logo?: SubscriptionType, isYearly?: boolean, isPlus?: boolean) => void;
  onDeleteTeam: (teamId: string) => void;
  onUpdateTeamLogo?: (teamId: string, logo: SubscriptionType) => void;
}

const LOGO_ICONS: Record<SubscriptionType, string> = {
  chatgpt: 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg',
  gemini: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg',
  perplexity: 'https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/perplexity-ai-icon.png',
  youtube: 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg',
  canva: 'https://static.canva.com/static/images/favicon-1.ico',
  quillbot: '/images/quillbot-logo.png',
  crunchyroll: '/images/crunchyroll-logo.png',
  netflix: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg',
};

// Count members who need red indicators - for non-yearly, non-plus teams
// Includes: 30+ days old OR paid with 0 amount
const countMembersWithRedIndicator = (team: Team): number => {
  if (team.isYearlyTeam || team.isPlusTeam) return 0; // Yearly and Plus teams use different logic
  const now = new Date();
  const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return team.members.filter(member => {
    // Skip pushed members or members with active team - they don't show red indicators
    if (member.isPushed || member.activeTeamId) return false;
    const [y, m, d] = member.joinDate.split('-').map(Number);
    const joinDateLocal = new Date(y, m - 1, d);
    const isOverOneMonth = differenceInDays(todayLocal, joinDateLocal) >= 30;
    const isPaidZero = member.isPaid && (!member.paidAmount || member.paidAmount === 0);
    return isOverOneMonth || isPaidZero;
  }).length;
};

// Count Plus team members whose join date is 30+ days ago (not pushed)
const countPlusMembersOverOneMonth = (team: Team): number => {
  if (!team.isPlusTeam) return 0;
  const now = new Date();
  const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return team.members.filter(member => {
    if (member.isPushed) return false;
    const [y, m, d] = member.joinDate.split('-').map(Number);
    const joinDateLocal = new Date(y, m - 1, d);
    return differenceInDays(todayLocal, joinDateLocal) >= 30;
  }).length;
};

const countMembersWithPendingDue = (team: Team): number => {
  return team.members.filter(member => (member.pendingAmount || 0) > 0).length;
};

// Check if a yearly member needs notification (current month not paid AND due date reached or passed)
const checkYearlyMemberDue = (
  member: { id: string; joinDate: string },
  currentMonthPayments: Record<string, boolean>
): boolean => {
  const now = new Date();
  const currentDay = now.getDate();
  const [, , jd] = member.joinDate.split('-').map(Number);
  
  // If current month is paid, no notification
  if (currentMonthPayments[member.id]) return false;
  
  // If due date (join day) has reached or passed, show notification
  return currentDay >= jd;
};

export function TeamList({ teams, activeTeamId, onSelectTeam, onCreateTeam, onDeleteTeam, onUpdateTeamLogo }: TeamListProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isYearlyModal, setIsYearlyModal] = useState(false);
  const [isPlusModal, setIsPlusModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedLogo, setSelectedLogo] = useState<SubscriptionType | null>(null);
  const [teamToAddLogo, setTeamToAddLogo] = useState<Team | null>(null);
  const [logoForTeam, setLogoForTeam] = useState<SubscriptionType | null>(null);
  const [yearlyCurrentMonthPayments, setYearlyCurrentMonthPayments] = useState<Record<string, boolean>>({});
  const [yearlyMemberDueStatus, setYearlyMemberDueStatus] = useState<Record<string, boolean>>({});
  const [yearlyMemberPaidZero, setYearlyMemberPaidZero] = useState<Record<string, boolean>>({});
  const [yearlyMemberTotalPaid, setYearlyMemberTotalPaid] = useState<Record<string, number>>({});
  const [yearlyMemberTotalAmount, setYearlyMemberTotalAmount] = useState<Record<string, number>>({});

  // Fetch current month payment status and total due for all yearly team members
  const fetchYearlyPayments = useCallback(async () => {
    if (!user) return;

    const yearlyTeams = teams.filter(t => t.isYearlyTeam);
    if (yearlyTeams.length === 0) return;

    const allMemberIds = yearlyTeams.flatMap(t => t.members.map(m => m.id));
    if (allMemberIds.length === 0) return;

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const [currentMonthResult, allPaymentsResult, membersResult] = await Promise.all([
      supabase
        .from('member_payments')
        .select('member_id, status')
        .eq('user_id', user.id)
        .eq('year', currentYear)
        .eq('month', currentMonth)
        .in('member_id', allMemberIds),
      supabase
        .from('member_payments')
        .select('member_id, amount, status')
        .eq('user_id', user.id)
        .in('member_id', allMemberIds)
        .eq('status', 'paid'),
      supabase
        .from('members')
        .select('id, total_amount')
        .in('id', allMemberIds),
    ]);

    if (currentMonthResult.error || allPaymentsResult.error || membersResult.error) {
      console.error('Error fetching yearly payments');
      return;
    }

    const paymentsMap: Record<string, boolean> = {};
    (currentMonthResult.data || []).forEach(p => {
      if (p.status === 'paid') {
        paymentsMap[p.member_id] = true;
      }
    });
    setYearlyCurrentMonthPayments(paymentsMap);

    // Calculate which members have total_due > 0
    const totalPaidMap: Record<string, number> = {};
    (allPaymentsResult.data || []).forEach(p => {
      totalPaidMap[p.member_id] = (totalPaidMap[p.member_id] || 0) + p.amount;
    });

    const totalAmountMap: Record<string, number> = {};
    (membersResult.data || []).forEach(m => {
      totalAmountMap[m.id] = m.total_amount || 0;
    });

    const dueStatus: Record<string, boolean> = {};
    const paidZeroStatus: Record<string, boolean> = {};
    allMemberIds.forEach(id => {
      const totalAmount = totalAmountMap[id] || 0;
      const totalPaid = totalPaidMap[id] || 0;
      dueStatus[id] = (totalAmount - totalPaid) > 0;
      paidZeroStatus[id] = totalPaid === 0 && totalAmount > 0;
    });
    setYearlyMemberDueStatus(dueStatus);
    setYearlyMemberPaidZero(paidZeroStatus);
    setYearlyMemberTotalPaid(totalPaidMap);
    setYearlyMemberTotalAmount(totalAmountMap);
  }, [user, teams]);

  useEffect(() => {
    fetchYearlyPayments();
  }, [fetchYearlyPayments]);

  // Count yearly team members with due indicators (exclude fully paid members)
  const countYearlyMembersWithDue = (team: Team): number => {
    if (!team.isYearlyTeam) return 0;
    return team.members.filter(member => {
      // Skip if member has no remaining due
      if (yearlyMemberDueStatus[member.id] === false) return false;
      // Include if paid is 0 with outstanding due
      if (yearlyMemberPaidZero[member.id]) return true;
      return checkYearlyMemberDue(member, yearlyCurrentMonthPayments);
    }).length;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isCurrentMonth = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  };

  const handleDeleteClick = (team: Team, e: React.MouseEvent) => {
    e.stopPropagation();
    setTeamToDelete(team);
  };

  const confirmDelete = () => {
    if (teamToDelete) {
      onDeleteTeam(teamToDelete.id);
      setTeamToDelete(null);
      setIsDeleteMode(false);
    }
  };

  const handleCreateClick = (isYearly: boolean = false, isPlus: boolean = false) => {
    setNewTeamName('');
    setSelectedLogo(null);
    setIsYearlyModal(isYearly);
    setIsPlusModal(isPlus);
    setShowCreateModal(true);
  };

  const confirmCreate = () => {
    const trimmedName = newTeamName.trim();
    if (trimmedName && trimmedName.length <= 50) {
      onCreateTeam(trimmedName, selectedLogo || undefined, isYearlyModal, isPlusModal);
      setShowCreateModal(false);
      setNewTeamName('');
      setSelectedLogo(null);
      setIsYearlyModal(false);
      setIsPlusModal(false);
    }
  };

  const handleTeamClick = (team: Team) => {
    if (isDeleteMode) {
      handleDeleteClick(team, { stopPropagation: () => {} } as React.MouseEvent);
    } else {
      onSelectTeam(team.id);
      // Navigate to different page based on team type
      if (team.isYearlyTeam) {
        navigate(`/yearly-team/${team.id}`);
      } else if (team.isPlusTeam) {
        navigate(`/plus-team/${team.id}`);
      } else {
        navigate(`/team/${team.id}`);
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* Action Buttons Row */}
      <div className="flex items-center gap-1">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleCreateClick(false, false)}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors touch-manipulation active:scale-95"
        >
          <Plus className="w-3 h-3" />
          New
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleCreateClick(true, false)}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-accent text-accent-foreground rounded-lg text-xs font-medium hover:bg-accent/90 transition-colors touch-manipulation active:scale-95 border border-primary/30"
        >
          <Plus className="w-3 h-3" />
          Yearly
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleCreateClick(false, true)}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-xs font-medium hover:bg-purple-500/30 transition-colors touch-manipulation active:scale-95 border border-purple-500/30"
        >
          <Plus className="w-3 h-3" />
          Plus
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsDeleteMode(!isDeleteMode)}
          className={`flex-1 flex items-center justify-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors touch-manipulation active:scale-95 ${
            isDeleteMode 
              ? 'bg-destructive text-destructive-foreground' 
              : 'bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20'
          }`}
        >
          {isDeleteMode ? (
            <>
              <X className="w-3 h-3" />
              Cancel
            </>
          ) : (
            <>
              <Trash2 className="w-3 h-3" />
              Delete
            </>
          )}
        </motion.button>
      </div>

      {isDeleteMode && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-destructive text-center"
        >
          Tap on a team below to delete it
        </motion.p>
      )}

      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-medium text-muted-foreground">
          Your Teams ({teams.length})
        </h3>
      </div>

      <div className="space-y-2">
        {teams.map((team, index) => {
          const memberCount = team.isYearlyTeam ? team.members.length : team.members.length + 1;
          const isFull = !team.isYearlyTeam && memberCount >= MAX_MEMBERS;
          const isActive = team.id === activeTeamId;
          const membersOverMonth = countMembersWithRedIndicator(team);
          const yearlyMembersWithDue = countYearlyMembersWithDue(team);
          const plusMembersOverMonth = countPlusMembersOverOneMonth(team);
          const totalRedDots = team.isYearlyTeam ? yearlyMembersWithDue : membersOverMonth;
          
          // Check if Normal team is 31+ days old from creation (Yearly and Plus teams never expire)
          const isTeamExpired = !team.isYearlyTeam && !team.isPlusTeam && differenceInDays(new Date(), new Date(team.createdAt)) >= 31;

          return (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-xl border transition-all overflow-hidden ${
                isTeamExpired 
                  ? 'grayscale opacity-60'
                  : ''
              } ${
                isDeleteMode
                  ? 'bg-destructive/5 border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50'
                  : isActive
                    ? 'bg-primary/10 border-primary/50'
                    : 'bg-card border-border hover:border-primary/30 hover:bg-secondary/30'
              }`}
            >
              <button
                onClick={() => handleTeamClick(team)}
                className="w-full p-4 text-left touch-manipulation"
              >
                <div className="flex items-center gap-3">
                  {/* Team Logo/Icon */}
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden ${
                      isDeleteMode 
                        ? 'bg-destructive/20 text-destructive' 
                      : team.logo && LOGO_ICONS[team.logo]
                          ? 'bg-white'
                          : 'bg-secondary text-muted-foreground'
                    }`}>
                      {isDeleteMode ? (
                        <Trash2 className="w-5 h-5" />
                      ) : team.logo && LOGO_ICONS[team.logo] && SUBSCRIPTION_CONFIG[team.logo] ? (
                        <img 
                          src={LOGO_ICONS[team.logo]} 
                          alt={SUBSCRIPTION_CONFIG[team.logo].name}
                          className="w-6 h-6 object-contain"
                        />
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setTeamToAddLogo(team);
                            setLogoForTeam(null);
                          }}
                          className="w-full h-full flex items-center justify-center hover:bg-secondary/80 transition-colors"
                        >
                          <ImagePlus className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    {/* Bell notification badge for yearly teams */}
                    {!isDeleteMode && team.isYearlyTeam && yearlyMembersWithDue > 0 && (
                      <div className="absolute -top-1.5 -right-1.5 flex items-center justify-center">
                        <div className="relative">
                          <Bell className="w-4 h-4 text-destructive fill-destructive animate-pulse" />
                          <span className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] px-0.5 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                            {yearlyMembersWithDue}
                          </span>
                        </div>
                      </div>
                    )}
                    {/* Bell notification badge for Plus teams - members 30+ days since join */}
                    {!isDeleteMode && team.isPlusTeam && plusMembersOverMonth > 0 && (
                      <div className="absolute -top-1.5 -right-1.5 flex items-center justify-center">
                        <div className="relative">
                          <Bell className="w-4 h-4 text-purple-500 fill-purple-500 animate-pulse" />
                          <span className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] px-0.5 bg-purple-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                            {plusMembersOverMonth}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-foreground truncate">{team.teamName}</h4>
                      {/* Indicators */}
                      {!isDeleteMode && (
                        <div className="flex items-center gap-1">
                          {/* Red dots for standard teams with members over 30 days */}
                          {!team.isYearlyTeam && membersOverMonth > 0 && (
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: Math.min(membersOverMonth, 8) }).map((_, i) => (
                                <span 
                                  key={i} 
                                  className="w-2 h-2 rounded-full bg-destructive"
                                />
                              ))}
                            </div>
                          )}
                          {/* Yellow dots for members with pending due */}
                          {countMembersWithPendingDue(team) > 0 && (
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: Math.min(countMembersWithPendingDue(team), 8) }).map((_, i) => (
                                <span 
                                  key={i} 
                                  className="w-2 h-2 rounded-full bg-yellow-500"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {isCurrentMonth(team.createdAt) && (
                        <span className="px-1.5 py-0.5 bg-primary/20 text-primary text-[10px] font-medium rounded">
                          NEW
                        </span>
                      )}
                      {team.isYearlyTeam && (
                        <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-500 text-[10px] font-medium rounded">
                          YEARLY
                        </span>
                      )}
                      {team.isPlusTeam && (
                        <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] font-medium rounded">
                          PLUS
                        </span>
                      )}
                      {isFull && !team.isYearlyTeam && !team.isPlusTeam && (
                        <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-500 text-[10px] font-medium rounded">
                          FULL
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {team.isYearlyTeam || team.isPlusTeam ? `${team.members.length} members` : `${memberCount}/${MAX_MEMBERS}`}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(team.createdAt)}
                      </span>
                    </div>
                    {/* Paid & Due amounts */}
                    {!isDeleteMode && (() => {
                      let teamPaid = 0;
                      let teamDue = 0;
                      if (team.isYearlyTeam) {
                        team.members.forEach(m => {
                          teamPaid += yearlyMemberTotalPaid[m.id] || 0;
                          const totalAmt = yearlyMemberTotalAmount[m.id] || 0;
                          const paid = yearlyMemberTotalPaid[m.id] || 0;
                          teamDue += Math.max(0, totalAmt - paid);
                        });
                      } else {
                        team.members.forEach(m => {
                          if (m.isPaid && m.paidAmount) teamPaid += m.paidAmount;
                          if (m.pendingAmount && m.pendingAmount > 0) teamDue += m.pendingAmount;
                        });
                      }
                      return (teamPaid > 0 || teamDue > 0) ? (
                        <div className="flex items-center gap-3 mt-1">
                          {teamPaid > 0 && (
                            <span className="text-[11px] font-medium text-green-400">
                              Paid: ৳{teamPaid.toLocaleString()}
                            </span>
                          )}
                          {teamDue > 0 && (
                            <span className="text-[11px] font-medium text-orange-400">
                              Due: ৳{teamDue.toLocaleString()}
                            </span>
                          )}
                        </div>
                      ) : null;
                    })()}
                  </div>

                  <ChevronRight className={`w-5 h-5 transition-colors ${
                    isDeleteMode ? 'text-destructive' : 'text-muted-foreground'
                  }`} />
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {teamToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setTeamToDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 space-y-4"
            >
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
                  <Trash2 className="w-6 h-6 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Delete Team?</h3>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete "<span className="font-medium text-foreground">{teamToDelete.teamName}</span>"? 
                  This will remove all {teamToDelete.members.length} member{teamToDelete.members.length !== 1 ? 's' : ''}.
                </p>
              </div>
              
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setTeamToDelete(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-secondary text-foreground font-medium hover:bg-secondary/80 transition-colors touch-manipulation active:scale-95"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-medium hover:bg-destructive/90 transition-colors touch-manipulation active:scale-95"
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Team Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 space-y-4"
            >
              <div className="text-center space-y-2">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
                  isYearlyModal ? 'bg-cyan-500/20' : isPlusModal ? 'bg-purple-500/20' : 'bg-primary/20'
                }`}>
                  <Plus className={`w-6 h-6 ${
                    isYearlyModal ? 'text-cyan-500' : isPlusModal ? 'text-purple-400' : 'text-primary'
                  }`} />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {isYearlyModal ? 'Create Yearly Team' : isPlusModal ? 'Create Plus Team' : 'Create New Team'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isYearlyModal 
                    ? 'Yearly teams have unlimited members and no admin' 
                    : isPlusModal
                      ? 'Plus teams have 8 members limit like normal teams'
                      : 'Enter a name and select a logo for your team'}
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value.slice(0, 50))}
                    placeholder="Enter team name..."
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newTeamName.trim()) {
                        confirmCreate();
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {newTeamName.length}/50
                  </p>
                </div>

                {/* Logo Selection */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Select Team Logo (Optional)</p>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {(Object.keys(SUBSCRIPTION_CONFIG) as SubscriptionType[]).map((type, i) => (
                      <motion.button
                        key={type}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.07 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedLogo(selectedLogo === type ? null : type)}
                        className={`relative w-16 h-16 rounded-xl flex items-center justify-center transition-all touch-manipulation shrink-0 ${
                          selectedLogo === type
                            ? 'bg-primary/20 border-2 border-primary'
                            : 'bg-secondary border border-border hover:border-primary/50'
                        }`}
                      >
                        <img 
                          src={LOGO_ICONS[type]} 
                          alt={SUBSCRIPTION_CONFIG[type].name}
className="w-8 h-8 object-contain"
                        />
                        {selectedLogo === type && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-primary-foreground" />
                          </div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                  {selectedLogo && (
                    <p className="text-xs text-primary text-center">
                      {SUBSCRIPTION_CONFIG[selectedLogo].name} selected
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-secondary text-foreground font-medium hover:bg-secondary/80 transition-colors touch-manipulation active:scale-95"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={confirmCreate}
                  disabled={!newTeamName.trim()}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:scale-95"
                >
                  Create
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Logo Modal */}
      <AnimatePresence>
        {teamToAddLogo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setTeamToAddLogo(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 space-y-4"
            >
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                  <ImagePlus className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Add Team Logo</h3>
                <p className="text-sm text-muted-foreground">
                  Select a logo for "<span className="font-medium text-foreground">{teamToAddLogo.teamName}</span>"
                </p>
              </div>

              {/* Logo Selection */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground text-center">Choose a Logo</p>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {(Object.keys(SUBSCRIPTION_CONFIG) as SubscriptionType[]).map((type, i) => (
                    <motion.button
                      key={type}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setLogoForTeam(logoForTeam === type ? null : type)}
                      className={`relative w-16 h-16 rounded-xl flex items-center justify-center transition-all touch-manipulation shrink-0 ${
                        logoForTeam === type
                          ? 'bg-primary/20 border-2 border-primary'
                          : 'bg-secondary border border-border hover:border-primary/50'
                      }`}
                    >
                      <img 
                        src={LOGO_ICONS[type]} 
                        alt={SUBSCRIPTION_CONFIG[type].name}
                        className="w-8 h-8 object-contain"
                      />
                      {logoForTeam === type && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-primary-foreground" />
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
                {logoForTeam && (
                  <p className="text-xs text-primary text-center">
                    {SUBSCRIPTION_CONFIG[logoForTeam].name} selected
                  </p>
                )}
              </div>
              
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setTeamToAddLogo(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-secondary text-foreground font-medium hover:bg-secondary/80 transition-colors touch-manipulation active:scale-95"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (logoForTeam && onUpdateTeamLogo) {
                      onUpdateTeamLogo(teamToAddLogo.id, logoForTeam);
                    }
                    setTeamToAddLogo(null);
                    setLogoForTeam(null);
                  }}
                  disabled={!logoForTeam}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:scale-95"
                >
                  Save
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}