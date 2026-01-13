import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Calendar, Mail, Phone, Crown } from 'lucide-react';
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
    const fetchCurrentMonthMembers = async () => {
      if (!user) return;

      try {
        // Fetch all teams with their members
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('id, team_name, is_yearly_team')
          .eq('user_id', user.id);

        if (teamsError) throw teamsError;

        const { data: membersData, error: membersError } = await supabase
          .from('members')
          .select('id, email, phone, join_date, team_id')
          .eq('user_id', user.id);

        if (membersError) throw membersError;

        // Filter members for current month
        const currentMonthMembers: MemberWithTeam[] = [];

        (membersData || []).forEach(member => {
          const joinDate = new Date(member.join_date);
          const memberMonth = joinDate.getMonth();
          const memberYear = joinDate.getFullYear();

          if (memberMonth === currentMonth && memberYear === currentYear) {
            const team = teamsData?.find(t => t.id === member.team_id);
            if (team) {
              currentMonthMembers.push({
                id: member.id,
                email: member.email,
                phone: member.phone,
                joinDate: member.join_date,
                teamId: team.id,
                teamName: team.team_name,
                isYearlyTeam: team.is_yearly_team,
              });
            }
          }
        });

        // Sort by join date (newest first)
        currentMonthMembers.sort((a, b) => 
          new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime()
        );

        setMembers(currentMonthMembers);
      } catch (error) {
        console.error('Error fetching current month members:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentMonthMembers();
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
            <h1 className="text-lg font-bold text-foreground">বর্তমান মাসের মেম্বার</h1>
            <p className="text-xs text-muted-foreground">{currentMonthName}</p>
          </div>
          <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary">{members.length}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">এই মাসে কোনো মেম্বার নেই</p>
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
                      
                      {/* Join Date */}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="text-xs text-muted-foreground">
                          {formatDate(member.joinDate)}
                        </span>
                      </div>
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
