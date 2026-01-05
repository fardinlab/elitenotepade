import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Team, Member, MAX_MEMBERS, SubscriptionType, AppData } from '@/types/member';
import { toast } from 'sonner';

export function useSupabaseData() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch all teams and members for the current user
  const fetchData = useCallback(async () => {
    if (!user) {
      setTeams([]);
      setActiveTeamId(null);
      setIsLoaded(true);
      return;
    }

    try {
      // Fetch teams
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (teamsError) {
        console.error('Error fetching teams:', teamsError);
        return;
      }

      // Fetch members for all teams
      const teamIds = teamsData?.map(t => t.id) || [];
      let membersData: any[] = [];
      
      if (teamIds.length > 0) {
        const { data: members, error: membersError } = await supabase
          .from('members')
          .select('*')
          .in('team_id', teamIds);

        if (membersError) {
          console.error('Error fetching members:', membersError);
        } else {
          membersData = members || [];
        }
      }

      // Map to Team interface
      const mappedTeams: Team[] = (teamsData || []).map(team => ({
        id: team.id,
        teamName: team.team_name,
        adminEmail: team.admin_email,
        createdAt: team.created_at,
        lastBackup: team.last_backup,
        logo: team.logo as SubscriptionType | undefined,
        members: membersData
          .filter(m => m.team_id === team.id)
          .map(m => ({
            id: m.id,
            email: m.email,
            phone: m.phone,
            telegram: m.telegram,
            joinDate: m.join_date,
            isPaid: m.is_paid,
            paidAmount: m.paid_amount,
            subscriptions: m.subscriptions as SubscriptionType[],
          })),
      }));

      setTeams(mappedTeams);
      
      // Set active team to first one if not set
      if (mappedTeams.length > 0 && !activeTeamId) {
        setActiveTeamId(mappedTeams[0].id);
      }
    } catch (err) {
      console.error('Data fetch error:', err);
    } finally {
      setIsLoaded(true);
    }
  }, [user, activeTeamId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get active team
  const activeTeam = useMemo(() => {
    return teams.find(t => t.id === activeTeamId) || teams[0] || null;
  }, [teams, activeTeamId]);

  // Sort teams: current month first, then by creation date descending
  const sortedTeams = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return [...teams].sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);

      const isCurrentMonthA = dateA.getMonth() === currentMonth && dateA.getFullYear() === currentYear;
      const isCurrentMonthB = dateB.getMonth() === currentMonth && dateB.getFullYear() === currentYear;

      if (isCurrentMonthA && !isCurrentMonthB) return -1;
      if (!isCurrentMonthA && isCurrentMonthB) return 1;

      return dateB.getTime() - dateA.getTime();
    });
  }, [teams]);

  const setActiveTeam = useCallback((teamId: string) => {
    setActiveTeamId(teamId);
  }, []);

  const createNewTeam = useCallback(async (teamName?: string, logo?: SubscriptionType) => {
    if (!user) return null;

    const newTeam = {
      user_id: user.id,
      team_name: teamName || 'My Elite Team',
      admin_email: user.email || 'admin@example.com',
      logo: logo || null,
    };

    const { data, error } = await supabase
      .from('teams')
      .insert(newTeam)
      .select()
      .single();

    if (error) {
      toast.error('Failed to create team');
      console.error('Error creating team:', error);
      return null;
    }

    const mappedTeam: Team = {
      id: data.id,
      teamName: data.team_name,
      adminEmail: data.admin_email,
      createdAt: data.created_at,
      logo: data.logo,
      members: [],
    };

    setTeams(prev => [mappedTeam, ...prev]);
    setActiveTeamId(data.id);
    return mappedTeam;
  }, [user]);

  const deleteTeam = useCallback(async (teamId: string) => {
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId);

    if (error) {
      toast.error('Failed to delete team');
      console.error('Error deleting team:', error);
      return;
    }

    setTeams(prev => {
      const remaining = prev.filter(t => t.id !== teamId);
      if (activeTeamId === teamId && remaining.length > 0) {
        setActiveTeamId(remaining[0].id);
      }
      return remaining;
    });
  }, [activeTeamId]);

  const updateTeamName = useCallback(async (name: string) => {
    if (!activeTeamId) return;

    const { error } = await supabase
      .from('teams')
      .update({ team_name: name })
      .eq('id', activeTeamId);

    if (error) {
      toast.error('Failed to update team name');
      return;
    }

    setTeams(prev => prev.map(t => 
      t.id === activeTeamId ? { ...t, teamName: name } : t
    ));
  }, [activeTeamId]);

  const updateAdminEmail = useCallback(async (email: string) => {
    if (!activeTeamId) return;

    const { error } = await supabase
      .from('teams')
      .update({ admin_email: email })
      .eq('id', activeTeamId);

    if (error) {
      toast.error('Failed to update admin email');
      return;
    }

    setTeams(prev => prev.map(t => 
      t.id === activeTeamId ? { ...t, adminEmail: email } : t
    ));
  }, [activeTeamId]);

  const addMember = useCallback(async (member: Omit<Member, 'id'>) => {
    if (!activeTeamId || !activeTeam) return false;
    if (activeTeam.members.length + 1 >= MAX_MEMBERS) return false;

    const newMember = {
      team_id: activeTeamId,
      email: member.email,
      phone: member.phone,
      telegram: member.telegram || null,
      join_date: member.joinDate,
      is_paid: member.isPaid || false,
      paid_amount: member.paidAmount || null,
      subscriptions: member.subscriptions || [],
    };

    const { data, error } = await supabase
      .from('members')
      .insert(newMember)
      .select()
      .single();

    if (error) {
      toast.error('Failed to add member');
      console.error('Error adding member:', error);
      return false;
    }

    const mappedMember: Member = {
      id: data.id,
      email: data.email,
      phone: data.phone,
      telegram: data.telegram,
      joinDate: data.join_date,
      isPaid: data.is_paid,
      paidAmount: data.paid_amount,
      subscriptions: data.subscriptions,
    };

    setTeams(prev => prev.map(t => 
      t.id === activeTeamId ? { ...t, members: [...t.members, mappedMember] } : t
    ));
    return true;
  }, [activeTeamId, activeTeam]);

  const removeMember = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to remove member');
      return;
    }

    setTeams(prev => prev.map(t => 
      t.id === activeTeamId ? { ...t, members: t.members.filter(m => m.id !== id) } : t
    ));
  }, [activeTeamId]);

  const updateMemberDate = useCallback(async (id: string, joinDate: string) => {
    const { error } = await supabase
      .from('members')
      .update({ join_date: joinDate })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update join date');
      return;
    }

    setTeams(prev => prev.map(t => 
      t.id === activeTeamId ? { 
        ...t, 
        members: t.members.map(m => m.id === id ? { ...m, joinDate } : m)
      } : t
    ));
  }, [activeTeamId]);

  const updateMemberEmail = useCallback(async (id: string, email: string) => {
    const { error } = await supabase
      .from('members')
      .update({ email })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update email');
      return;
    }

    setTeams(prev => prev.map(t => 
      t.id === activeTeamId ? { 
        ...t, 
        members: t.members.map(m => m.id === id ? { ...m, email } : m)
      } : t
    ));
  }, [activeTeamId]);

  const updateMemberTelegram = useCallback(async (id: string, telegram: string) => {
    const { error } = await supabase
      .from('members')
      .update({ telegram: telegram || null })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update Telegram');
      return;
    }

    setTeams(prev => prev.map(t => 
      t.id === activeTeamId ? { 
        ...t, 
        members: t.members.map(m => m.id === id ? { ...m, telegram: telegram || undefined } : m)
      } : t
    ));
  }, [activeTeamId]);

  const updateMemberPayment = useCallback(async (id: string, isPaid: boolean, paidAmount?: number) => {
    const { error } = await supabase
      .from('members')
      .update({ 
        is_paid: isPaid, 
        paid_amount: isPaid ? paidAmount : null 
      })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update payment');
      return;
    }

    setTeams(prev => prev.map(t => 
      t.id === activeTeamId ? { 
        ...t, 
        members: t.members.map(m => m.id === id ? { ...m, isPaid, paidAmount: isPaid ? paidAmount : undefined } : m)
      } : t
    ));
  }, [activeTeamId]);

  const updateMemberSubscriptions = useCallback(async (id: string, subscriptions: SubscriptionType[]) => {
    const { error } = await supabase
      .from('members')
      .update({ subscriptions })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update subscriptions');
      return;
    }

    setTeams(prev => prev.map(t => 
      t.id === activeTeamId ? { 
        ...t, 
        members: t.members.map(m => m.id === id ? { ...m, subscriptions } : m)
      } : t
    ));
  }, [activeTeamId]);

  const updateTeamLogo = useCallback(async (teamId: string, logo: SubscriptionType) => {
    const { error } = await supabase
      .from('teams')
      .update({ logo })
      .eq('id', teamId);

    if (error) {
      toast.error('Failed to update team logo');
      return;
    }

    setTeams(prev => prev.map(t => 
      t.id === teamId ? { ...t, logo } : t
    ));
  }, []);

  const canAddMember = activeTeam ? activeTeam.members.length + 1 < MAX_MEMBERS : false;
  const isTeamFull = activeTeam ? activeTeam.members.length + 1 >= MAX_MEMBERS : false;

  // Export data as JSON (for backup)
  const exportData = useCallback(() => {
    const data: AppData = {
      teams,
      activeTeamId: activeTeamId || '',
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `elite-notepade-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [teams, activeTeamId]);

  // Import data from JSON
  const importData = useCallback(async (jsonString: string) => {
    if (!user) return false;

    try {
      const parsed = JSON.parse(jsonString);
      let teamsToImport: Team[] = [];

      if (parsed.teams && Array.isArray(parsed.teams)) {
        teamsToImport = parsed.teams;
      } else if (parsed.teamName && parsed.adminEmail && Array.isArray(parsed.members)) {
        // Handle old single-team format
        teamsToImport = [{
          id: Date.now().toString(),
          teamName: parsed.teamName,
          adminEmail: parsed.adminEmail,
          members: parsed.members,
          createdAt: new Date().toISOString(),
          lastBackup: parsed.lastBackup,
        }];
      } else {
        return false;
      }

      setIsSyncing(true);

      // Insert teams into Supabase
      for (const team of teamsToImport) {
        const { data: newTeam, error: teamError } = await supabase
          .from('teams')
          .insert({
            user_id: user.id,
            team_name: team.teamName,
            admin_email: team.adminEmail,
            logo: team.logo || null,
            last_backup: team.lastBackup || null,
          })
          .select()
          .single();

        if (teamError) {
          console.error('Error importing team:', teamError);
          continue;
        }

        // Insert members for this team
        if (team.members && team.members.length > 0) {
          const membersToInsert = team.members.map(m => ({
            team_id: newTeam.id,
            email: m.email,
            phone: m.phone,
            telegram: m.telegram || null,
            join_date: m.joinDate,
            is_paid: m.isPaid || false,
            paid_amount: m.paidAmount || null,
            subscriptions: m.subscriptions || [],
          }));

          const { error: membersError } = await supabase
            .from('members')
            .insert(membersToInsert);

          if (membersError) {
            console.error('Error importing members:', membersError);
          }
        }
      }

      // Refetch all data
      await fetchData();
      setIsSyncing(false);
      return true;
    } catch (err) {
      console.error('Import error:', err);
      setIsSyncing(false);
      return false;
    }
  }, [user, fetchData]);

  const setLastBackup = useCallback(async (date: string) => {
    if (!activeTeamId) return;

    await supabase
      .from('teams')
      .update({ last_backup: date })
      .eq('id', activeTeamId);

    setTeams(prev => prev.map(t => 
      t.id === activeTeamId ? { ...t, lastBackup: date } : t
    ));
  }, [activeTeamId]);

  // Search across all teams
  const searchMembers = useCallback((query: string) => {
    if (!query.trim()) return [];

    const normalizedQuery = query.toLowerCase().trim();
    const results: Array<{ team: Team; member: Member; isAdmin: boolean }> = [];

    teams.forEach((team) => {
      // Check admin email
      if (team.adminEmail.toLowerCase().includes(normalizedQuery)) {
        results.push({
          team,
          member: { id: 'admin', email: team.adminEmail, phone: '', joinDate: team.createdAt },
          isAdmin: true,
        });
      }

      // Check members
      team.members.forEach((member) => {
        if (
          member.email.toLowerCase().includes(normalizedQuery) ||
          member.phone.includes(normalizedQuery)
        ) {
          results.push({ team, member, isAdmin: false });
        }
      });
    });

    return results;
  }, [teams]);

  return {
    data: { teams, activeTeamId: activeTeamId || '' },
    activeTeam,
    sortedTeams,
    isLoaded,
    isSyncing,
    setActiveTeam,
    createNewTeam,
    deleteTeam,
    updateTeamName,
    updateAdminEmail,
    addMember,
    removeMember,
    updateMemberDate,
    updateMemberEmail,
    updateMemberTelegram,
    updateMemberPayment,
    updateMemberSubscriptions,
    updateTeamLogo,
    canAddMember,
    isTeamFull,
    exportData,
    importData,
    setLastBackup,
    searchMembers,
    memberCount: activeTeam ? activeTeam.members.length + 1 : 1,
    teamCount: teams.length,
    refetch: fetchData,
  };
}
